/* =========================================================
   server.js — servidor local, sin dependencias externas.
   Sirve la pantalla del expositor y la vista del celular,
   y las sincroniza por "polling" (cada segundo se pregunta
   por el estado actual). Se eligió polling en vez de SSE/
   streaming porque los túneles públicos (Cloudflare, etc.)
   suelen retener/almacenar en búfer las respuestas largas y
   nunca entregan los datos — con peticiones cortas normales
   no hay ese problema, en cualquier red.
   Arranca con:  node server.js
   ========================================================= */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');

const { SLIDES, ATHENS_ROLES, BLOQUE_TIMING } = require('./deck.js');

const PORT = process.env.PORT || 4321;
const PUBLIC_DIR = path.join(__dirname, 'public');

/* ---------------- estado compartido en memoria ---------------- */
const state = {
  slideIndex: 0,
  partIndex: 0,
  revealed: false,
  votes: {},      // { "0": count, "1": count, ... } para la parte actual
  texts: [],      // respuestas de texto (diapo 39)
  startedAt: null,// cronómetro de la exposición (Date.now() al pulsar "Iniciar")
};
const voted = new Set();       // `${clientId}` que ya votaron en la parte actual
const roles = new Map();       // clientId -> role key (persiste toda la sesión)

function currentSlide(){ return SLIDES[state.slideIndex] || SLIDES[0]; }

function roleCounts(){
  const counts = {}; ATHENS_ROLES.forEach(r=>counts[r.key]=0);
  for(const key of roles.values()){ if(counts[key]!==undefined) counts[key]++; }
  return counts;
}

function publicState(){
  return {
    slideIndex: state.slideIndex,
    partIndex: state.partIndex,
    revealed: state.revealed,
    votes: state.votes,
    votedCount: voted.size,
    texts: state.texts.slice(-60),
    roleCounts: roleCounts(),
    totalSlides: SLIDES.length,
    startedAt: state.startedAt,
    elapsedSeconds: state.startedAt ? Math.floor((Date.now()-state.startedAt)/1000) : null,
  };
}

function resetActivity(){
  state.revealed = false;
  state.votes = {};
  voted.clear();
}

function weightedRandomRole(){
  const total = ATHENS_ROLES.reduce((a,r)=>a+r.weight,0);
  let n = Math.random()*total;
  for(const r of ATHENS_ROLES){ if(n<r.weight) return r.key; n-=r.weight; }
  return ATHENS_ROLES[0].key;
}

/* ---------------- utilidades HTTP ---------------- */
const MIME = {
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.png':'image/png', '.svg':'image/svg+xml', '.ico':'image/x-icon',
};

function sendFile(res, filePath){
  fs.readFile(filePath, (err, data)=>{
    if(err){ res.writeHead(404); res.end('No encontrado'); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

function sendJSON(res, obj, code=200){
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type':'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function readJSONBody(req){
  return new Promise((resolve)=>{
    let chunks=[];
    req.on('data', c=>{ chunks.push(c); if(Buffer.concat(chunks).length>1e6) req.destroy(); });
    req.on('end', ()=>{
      try{ resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}')); }
      catch{ resolve({}); }
    });
    req.on('error', ()=>resolve({}));
  });
}

const VIRTUAL_ADAPTER_RE = /virtualbox|vmware|docker|hyper-v|vethernet|loopback|virtual/i;

function localIPs(){
  const nets = os.networkInterfaces();
  const found = [];
  for(const name of Object.keys(nets)){
    for(const net of nets[name]){
      if(net.family==='IPv4' && !net.internal) found.push({ name, address:net.address });
    }
  }
  // preferir adaptadores "reales" (wifi/ethernet) sobre los de máquinas virtuales
  found.sort((a,b)=>{
    const av = VIRTUAL_ADAPTER_RE.test(a.name) ? 1 : 0;
    const bv = VIRTUAL_ADAPTER_RE.test(b.name) ? 1 : 0;
    return av-bv;
  });
  return found.map(f=>f.address);
}

/* ---------------- rutas ---------------- */
const server = http.createServer(async (req,res)=>{
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // ---- estado en vivo (polling) ----
  if(pathname==='/api/state' && req.method==='GET'){
    sendJSON(res, publicState());
    return;
  }

  // ---- API ----
  if(pathname==='/api/deck' && req.method==='GET'){
    sendJSON(res, { slides: SLIDES, athensRoles: ATHENS_ROLES, bloqueTiming: BLOQUE_TIMING });
    return;
  }

  if(pathname==='/api/join-info' && req.method==='GET'){
    const ips = localIPs();
    const lanUrl = `http://${ips[0] || 'localhost'}:${PORT}/telefono`;
    sendJSON(res, {
      url: publicUrl ? `${publicUrl}/telefono` : lanUrl,
      publicUrl: publicUrl ? `${publicUrl}/telefono` : null,
      lanUrl,
      tunnelStarting: !publicUrl && tunnelProcess !== null,
      ips, port:PORT,
    });
    return;
  }

  if(pathname==='/api/role' && req.method==='GET'){
    const clientId = url.searchParams.get('clientId');
    if(!clientId){ sendJSON(res,{error:'clientId requerido'},400); return; }
    if(!roles.has(clientId)) roles.set(clientId, weightedRandomRole());
    const key = roles.get(clientId);
    const def = ATHENS_ROLES.find(r=>r.key===key);
    sendJSON(res, def);
    return;
  }

  if(pathname==='/api/next' && req.method==='POST'){
    state.slideIndex = Math.min(SLIDES.length-1, state.slideIndex+1);
    state.partIndex = 0; resetActivity();
    sendJSON(res, publicState()); return;
  }
  if(pathname==='/api/prev' && req.method==='POST'){
    state.slideIndex = Math.max(0, state.slideIndex-1);
    state.partIndex = 0; resetActivity();
    sendJSON(res, publicState()); return;
  }
  if(pathname==='/api/goto' && req.method==='POST'){
    const body = await readJSONBody(req);
    const i = Number(body.index);
    if(Number.isInteger(i) && i>=0 && i<SLIDES.length){
      state.slideIndex = i; state.partIndex = 0; resetActivity();
    }
    sendJSON(res, publicState()); return;
  }
  if(pathname==='/api/next-part' && req.method==='POST'){
    const slide = currentSlide();
    const parts = slide.phone && slide.phone.parts;
    if(parts && state.partIndex < parts.length-1){ state.partIndex++; resetActivity(); }
    sendJSON(res, publicState()); return;
  }
  if(pathname==='/api/prev-part' && req.method==='POST'){
    if(state.partIndex>0){ state.partIndex--; resetActivity(); }
    sendJSON(res, publicState()); return;
  }
  if(pathname==='/api/reveal' && req.method==='POST'){
    state.revealed = true;
    sendJSON(res, publicState()); return;
  }
  if(pathname==='/api/reset-activity' && req.method==='POST'){
    resetActivity();
    sendJSON(res, publicState()); return;
  }

  if(pathname==='/api/timer/start' && req.method==='POST'){
    state.startedAt = Date.now();
    sendJSON(res, publicState()); return;
  }
  if(pathname==='/api/timer/reset' && req.method==='POST'){
    state.startedAt = null;
    sendJSON(res, publicState()); return;
  }

  if(pathname==='/api/vote' && req.method==='POST'){
    const body = await readJSONBody(req);
    const { clientId, choiceIndex } = body;
    const slide = currentSlide();
    const part = slide.phone && slide.phone.parts ? slide.phone.parts[state.partIndex] : null;
    if(!clientId || !part || !Number.isInteger(choiceIndex)){ sendJSON(res,{error:'solicitud inválida'},400); return; }
    if(!voted.has(clientId)){
      voted.add(clientId);
      const key = String(choiceIndex);
      state.votes[key] = (state.votes[key]||0)+1;
    }
    sendJSON(res, { ok:true, alreadyVoted: voted.has(clientId) }); return;
  }

  if(pathname==='/api/text' && req.method==='POST'){
    const body = await readJSONBody(req);
    const text = String(body.text||'').trim().slice(0,140);
    if(text){
      state.texts.push({ text, at: Date.now() });
      if(state.texts.length>200) state.texts.shift();
    }
    sendJSON(res, { ok:true }); return;
  }

  // ---- páginas y estáticos ----
  if(pathname==='/' ){ sendFile(res, path.join(PUBLIC_DIR,'projection.html')); return; }
  if(pathname==='/expositor'){ sendFile(res, path.join(PUBLIC_DIR,'admin.html')); return; }
  if(pathname==='/telefono'){ sendFile(res, path.join(PUBLIC_DIR,'phone.html')); return; }

  // hero.png vive en la raíz del proyecto (imagen de portada ya existente)
  if(pathname==='/hero.png'){ sendFile(res, path.join(__dirname,'hero.png')); return; }

  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/,'');
  const filePath = path.join(PUBLIC_DIR, safePath);
  if(filePath.startsWith(PUBLIC_DIR) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()){
    sendFile(res, filePath); return;
  }

  res.writeHead(404); res.end('No encontrado');
});

/* ---------------- túnel público (Cloudflare) ---------------- */
let publicUrl = null;
let tunnelProcess = null;

function startTunnel(){
  if(process.env.NO_TUNNEL){
    console.log('  (NO_TUNNEL activo: solo disponible en la wifi local.)');
    return;
  }
  const exe = path.join(__dirname, 'tools', process.platform==='win32' ? 'cloudflared.exe' : 'cloudflared');
  if(!fs.existsSync(exe)){
    console.log('  (No se encontró tools/cloudflared.exe — solo disponible en la wifi local.)');
    return;
  }
  tunnelProcess = spawn(exe, ['tunnel', '--url', `http://localhost:${PORT}`, '--no-autoupdate']);
  const onData = (data)=>{
    const text = data.toString();
    const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if(match && !publicUrl){
      publicUrl = match[0];
      console.log(`  Internet (datos móviles):  ${publicUrl}/telefono`);
      console.log('');
    }
  };
  tunnelProcess.stdout.on('data', onData);
  tunnelProcess.stderr.on('data', onData); // cloudflared imprime la URL por stderr
  tunnelProcess.on('error', e=>console.log('  No se pudo iniciar el túnel:', e.message));
  tunnelProcess.on('exit', ()=>{ tunnelProcess = null; });
}

function shutdown(){
  if(tunnelProcess) tunnelProcess.kill();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.listen(PORT, ()=>{
  const ips = localIPs();
  console.log('');
  console.log('  El poder y el derecho — servidor local');
  console.log('  ---------------------------------------');
  console.log(`  Pantalla para proyectar:   http://localhost:${PORT}/`);
  console.log(`  Panel de control (Uds.):   http://localhost:${PORT}/expositor`);
  if(ips.length){
    ips.forEach(ip=>console.log(`  Celulares (misma wifi):    http://${ip}:${PORT}/telefono`));
  } else {
    console.log('  No se detectó una IP de red local. Conecta el computador a la wifi del salón.');
  }
  console.log('  Iniciando acceso por internet (datos móviles)…');
  console.log('');
  startTunnel();
});
