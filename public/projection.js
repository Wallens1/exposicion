/* =========================================================
   projection.js — lo que se proyecta al público.
   Pantalla de solo lectura: sin botones ni controles. Todo
   se maneja desde /expositor (admin.js) y esta página solo
   refleja el estado del servidor, sondeándolo cada segundo.
   Cada diapositiva trae su propia composición (deck.js); esta
   página no le impone una plantilla común.
   ========================================================= */

const stage = document.querySelector('#stage');
const counterEl = document.querySelector('#slideCounter');
const fillEl = document.querySelector('#progressFill');

let SLIDES = [];
let current = 0;

async function api(pathname){
  const res = await fetch(pathname);
  return res.json();
}

function chrome(s, i){
  if(s.bare) return `<div class="slide-body title-comp">${s.body}</div>`;
  return `<div class="slide-head"><span class="kicker muted">${s.section}</span><span class="mono-tag">DIAPO ${s.diapo}</span></div>
  <div class="slide-body">
    ${s.body}
    <div class="host-panel-slot" data-slot="${s.diapo}"></div>
  </div>`;
}

function renderAll(){
  stage.innerHTML = SLIDES.map((s,i)=>`<section class="slide" data-i="${i}">${chrome(s,i)}</section>`).join('');
}

function goToLocal(i){
  current = Math.max(0, Math.min(SLIDES.length-1, i));
  stage.querySelectorAll('.slide').forEach(el=>el.classList.toggle('active', Number(el.dataset.i)===current));
  counterEl.textContent = `${current+1} / ${SLIDES.length}`;
  fillEl.style.width = `${((current+1)/SLIDES.length)*100}%`;
}

function applyState(st){
  if(st.slideIndex !== current) goToLocal(st.slideIndex);
  const s = SLIDES[current];
  if(!s) return;

  const activeSlide = stage.querySelector('.slide.active');
  if(!activeSlide) return;

  activeSlide.querySelectorAll('.answer').forEach(ans=>ans.toggleAttribute('hidden', !st.revealed));

  const slot = activeSlide.querySelector('.host-panel-slot');
  if(slot) slot.innerHTML = activityHTML(s, st);

  const liveTexts = activeSlide.querySelector('#liveTexts');
  if(liveTexts){
    const items = (st.texts||[]).slice().reverse();
    liveTexts.innerHTML = items.length
      ? items.map(t=>`<div class="t">${escapeHTML(t.text)}</div>`).join('')
      : `<p class="empty">Esperando respuestas…</p>`;
  }
}

function escapeHTML(str){
  return str.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// solo lectura: nada de botones, solo el estado (conteos, barras, revelado)
function activityHTML(slide, st){
  const ph = slide.phone; if(!ph) return '';

  if(ph.type==='role'){
    const counts = st.roleCounts || {};
    const total = Object.values(counts).reduce((a,b)=>a+b,0);
    return `<div class="host-panel"><span class="kicker">Roles en vivo</span><span class="cap" style="margin-left:10px">${total} celular${total===1?'':'es'} conectado${total===1?'':'s'}</span>
      <div class="role-counts">${ph.roles.map(r=>`<div class="role-chip"><div class="n">${counts[r.key]||0}</div><div class="l">${r.label}</div></div>`).join('')}</div></div>`;
  }

  if(ph.type==='vote'){
    const parts = ph.parts;
    const part = parts[st.partIndex] || parts[0];
    const totalVotes = Object.values(st.votes||{}).reduce((a,b)=>a+b,0);
    const bars = part.choices.map((c,i)=>{
      const n = st.votes[String(i)] || 0;
      const pct = totalVotes ? Math.round(n/totalVotes*100) : 0;
      const isCorrect = st.revealed && i===part.correctIndex;
      return `<div class="tally-row ${isCorrect?'is-correct':''}"><span class="label">${c}</span><div class="tally-bar"><span style="width:${pct}%"></span></div><span class="tally-count">${n}</span></div>`;
    }).join('');
    const multi = parts.length>1;
    return `<div class="host-panel">
      <span class="kicker">${multi?`Ítem ${st.partIndex+1}/${parts.length} · `:''}${totalVotes} voto${totalVotes===1?'':'s'}</span>
      <p class="h-sub" style="font-size:18px;margin-top:8px">${part.question}</p>
      <div class="tally">${bars}</div>
      ${st.revealed?`<p class="lede" style="margin-top:10px">${part.explanation}</p>`:''}
    </div>`;
  }

  return '';
}

async function poll(){
  try{ applyState(await api('/api/state')); }catch{}
}

async function boot(){
  const deck = await api('/api/deck');
  SLIDES = deck.slides;
  renderAll();
  goToLocal(0);
  poll();
  setInterval(poll, 1000);
  renderTitleJoin();
}
boot();

/* ---------- QR de la portada (se une desde el celular) ---------- */
async function renderTitleJoin(){
  const slot = document.querySelector('#titleJoin');
  if(!slot) return;
  const info = await api('/api/join-info');
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(info.url)}`;
  slot.innerHTML = `<img src="${qrSrc}" alt="Código QR para unirse" onerror="this.style.display='none'">
    <div class="txt"><b>Únete desde tu celular</b>${info.url}</div>`;
  if(info.tunnelStarting){
    setTimeout(renderTitleJoin, 2000);
  }
}
