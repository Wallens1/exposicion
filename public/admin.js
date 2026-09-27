/* =========================================================
   admin.js — panel de control para los expositores.
   Aquí viven todos los botones: navegar, revelar, avanzar
   ítems de una actividad, y el cronómetro con los tiempos
   del guion. La pantalla de proyección (/) es de solo lectura
   y refleja lo que se hace aquí.
   ========================================================= */

const connDot = document.querySelector('#connDot');
const clockEl = document.querySelector('#clock');
const timerTargetEl = document.querySelector('#timerTarget');
const timerStatusEl = document.querySelector('#timerStatus');
const timerStartBtn = document.querySelector('#timerStart');
const timerResetBtn = document.querySelector('#timerReset');

const slideSectionEl = document.querySelector('#slideSection');
const slideTitleEl = document.querySelector('#slideTitle');
const slideSpeakerEl = document.querySelector('#slideSpeaker');
const counterEl = document.querySelector('#slideCounter');
const prevBtn = document.querySelector('#prevBtn');
const nextBtn = document.querySelector('#nextBtn');
const jumpInput = document.querySelector('#jumpInput');
const jumpBtn = document.querySelector('#jumpBtn');

const activityPanel = document.querySelector('#activityPanel');
const qrImg = document.querySelector('#qrImg');
const joinUrlEl = document.querySelector('#joinUrl');
const joinHelpEl = document.querySelector('#joinHelp');

let SLIDES = [];
let BLOQUE_TIMING = [];
let current = 0;
let leaderTimer = null, leaderSeconds = 30;

async function api(pathname, method='GET', body){
  const res = await fetch(pathname, {
    method, headers: body ? {'Content-Type':'application/json'} : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

function stripTags(html){ return html ? html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim() : ''; }
function bloqueNumber(section){ return parseInt(section,10) || 1; }
function fmtClock(totalSeconds){
  const m = Math.floor(totalSeconds/60), s = totalSeconds%60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

/* ---------- cronómetro ---------- */
function renderTimer(st){
  const secs = st.elapsedSeconds || 0;
  clockEl.textContent = fmtClock(secs);
  timerStartBtn.textContent = st.startedAt ? 'Reiniciar desde ahora' : 'Iniciar cronómetro';

  const slide = SLIDES[current];
  const bloque = slide ? bloqueNumber(slide.section) : 1;
  const timing = BLOQUE_TIMING.find(b=>b.bloque===bloque);
  if(!timing){ timerTargetEl.textContent=''; timerStatusEl.textContent=''; return; }
  const prevTiming = BLOQUE_TIMING.find(b=>b.bloque===bloque-1);
  const prevTarget = prevTiming ? prevTiming.target : 0;
  timerTargetEl.textContent = `Bloque ${bloque} · ${timing.label} — debería terminar en el minuto ${timing.target}`;

  if(!st.startedAt){ timerStatusEl.textContent=''; timerStatusEl.className='timer-status'; return; }
  const elapsedMin = secs/60;
  if(elapsedMin <= timing.target){
    timerStatusEl.textContent = elapsedMin < prevTarget ? 'Van adelantados' : 'Van a tiempo';
    timerStatusEl.className = 'timer-status ontime';
  } else {
    const behind = Math.round(elapsedMin - timing.target);
    timerStatusEl.textContent = `${behind} min atrasados en este bloque`;
    timerStatusEl.className = 'timer-status behind';
  }
}

timerStartBtn.addEventListener('click', ()=>api('/api/timer/start','POST'));
timerResetBtn.addEventListener('click', ()=>api('/api/timer/reset','POST'));

/* ---------- navegación ---------- */
prevBtn.addEventListener('click', ()=>api('/api/prev','POST'));
nextBtn.addEventListener('click', ()=>api('/api/next','POST'));
jumpBtn.addEventListener('click', ()=>{
  const n = Number(jumpInput.value);
  if(Number.isInteger(n) && n>=1 && n<=SLIDES.length) api('/api/goto','POST',{index:n-1});
  jumpInput.value='';
});

function renderSlideInfo(st){
  current = st.slideIndex;
  const s = SLIDES[current]; if(!s) return;
  slideSectionEl.textContent = `${s.section} · DIAPO ${s.diapo}`;
  slideTitleEl.textContent = stripTags(s.title) || stripTags(s.body).slice(0,80);
  slideSpeakerEl.textContent = s.speaker || '';
  counterEl.textContent = `${current+1} / ${SLIDES.length}`;
  prevBtn.disabled = current===0;
  nextBtn.disabled = current===SLIDES.length-1;
}

/* ---------- panel de actividad ---------- */
function renderActivity(st){
  const s = SLIDES[current]; if(!s){ activityPanel.innerHTML=''; return; }

  if(s.widget==='leader-timer'){
    activityPanel.innerHTML = `<span class="eyebrow">ACTIVIDAD · ELEGIR LÍDER</span>
      <div class="leader-timer" style="margin-top:10px">
        <button class="btn" id="leaderBtn" type="button">Iniciar 30 segundos</button>
        <output id="leaderOut">00:30</output>
      </div>`;
    wireLeaderTimer();
    return;
  }

  const ph = s.phone;
  if(!ph || ph.type==='info'){
    activityPanel.innerHTML = `<span class="eyebrow">ACTIVIDAD</span><p class="activity-empty" style="margin-top:8px">Esta diapositiva no tiene actividad de celular.</p>`;
    return;
  }

  if(ph.type==='role'){
    const counts = st.roleCounts||{};
    const total = Object.values(counts).reduce((a,b)=>a+b,0);
    activityPanel.innerHTML = `<span class="eyebrow">ROLES EN VIVO</span>
      <p class="activity-empty" style="margin-top:6px">${total} celular${total===1?'':'es'} conectado${total===1?'':'s'}</p>
      <div class="role-counts">${ph.roles.map(r=>`<div class="role-chip"><b>${counts[r.key]||0}</b>${r.label}</div>`).join('')}</div>`;
    return;
  }

  if(ph.type==='reveal'){
    activityPanel.innerHTML = `<span class="eyebrow">¿QUIÉN SOY?</span>
      <p class="activity-q">${ph.answer}</p>
      <div class="activity-actions">
        <button class="btn" data-action="reveal" type="button" ${st.revealed?'disabled':''}>${st.revealed?'Ya revelado':'Revelar personaje'}</button>
      </div>`;
    wireActivityButtons();
    return;
  }

  if(ph.type==='vote'){
    const parts = ph.parts;
    const part = parts[st.partIndex] || parts[0];
    const totalVotes = Object.values(st.votes||{}).reduce((a,b)=>a+b,0);
    const multi = parts.length>1;
    const isLast = st.partIndex >= parts.length-1;
    const bars = part.choices.map((c,i)=>{
      const n = st.votes[String(i)]||0;
      const pct = totalVotes ? Math.round(n/totalVotes*100) : 0;
      const isCorrect = st.revealed && i===part.correctIndex;
      return `<div class="tally-row ${isCorrect?'is-correct':''}"><span class="label">${c}</span><div class="tally-bar"><span style="width:${pct}%"></span></div><span class="tally-count">${n}</span></div>`;
    }).join('');
    activityPanel.innerHTML = `
      <span class="eyebrow">${multi?`ÍTEM ${st.partIndex+1}/${parts.length} · `:''}${totalVotes} VOTO${totalVotes===1?'':'S'}</span>
      <p class="activity-q">${part.question}</p>
      <div class="tally">${bars}</div>
      ${st.revealed?`<p class="activity-tag" style="margin-top:4px">RESPUESTA</p><p class="lede">${part.explanation}</p>`:''}
      <div class="activity-actions">
        <button class="btn" data-action="reveal" type="button" ${st.revealed?'disabled':''}>Revelar respuesta</button>
        ${multi ? `<button class="btn ghost" data-action="next-part" type="button" ${isLast?'disabled':''}>Siguiente ítem →</button>` : ''}
      </div>`;
    wireActivityButtons();
    return;
  }

  if(ph.type==='text'){
    const items = (st.texts||[]).slice().reverse();
    activityPanel.innerHTML = `<span class="eyebrow">RESPUESTAS EN VIVO</span>
      <div class="texts-list">${items.length ? items.map(t=>`<div class="t">${escapeHTML(t.text)}</div>`).join('') : '<p class="activity-empty">Nadie ha escrito todavía.</p>'}</div>`;
    return;
  }

  activityPanel.innerHTML = '';
}

function escapeHTML(str){
  return str.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function wireActivityButtons(){
  activityPanel.querySelectorAll('[data-action]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(btn.dataset.action==='reveal') api('/api/reveal','POST');
      else if(btn.dataset.action==='next-part') api('/api/next-part','POST');
    });
  });
}

function wireLeaderTimer(){
  const btn = document.querySelector('#leaderBtn');
  const out = document.querySelector('#leaderOut');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    if(leaderTimer){ clearInterval(leaderTimer); leaderTimer=null; leaderSeconds=30; out.textContent='00:30'; btn.textContent='Iniciar 30 segundos'; return; }
    btn.textContent='Reiniciar';
    leaderTimer=setInterval(()=>{
      leaderSeconds--; out.textContent=`00:${String(leaderSeconds).padStart(2,'0')}`;
      if(leaderSeconds===0){ clearInterval(leaderTimer); leaderTimer=null; btn.textContent='Otra ronda'; leaderSeconds=30; out.textContent='¡Tiempo!'; }
    },1000);
  });
}

/* ---------- unirse (QR) ---------- */
let joinPoll = null;
async function refreshJoinInfo(){
  const info = await api('/api/join-info');
  qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(info.url)}`;
  joinUrlEl.textContent = info.url;
  joinHelpEl.textContent = info.publicUrl
    ? 'Funciona con wifi o datos móviles.'
    : info.tunnelStarting
      ? 'Preparando acceso por internet…'
      : 'Solo disponible en la wifi local.';
  if(info.tunnelStarting && !joinPoll){
    joinPoll = setInterval(async ()=>{
      const fresh = await api('/api/join-info');
      if(fresh.publicUrl){ clearInterval(joinPoll); joinPoll=null; refreshJoinInfo(); }
    }, 2000);
  }
}

/* ---------- sondeo cada segundo ---------- */
// Importante: renderActivity() reconstruye el HTML del panel (innerHTML), lo que
// destruye cualquier estado local en curso ahí dentro (como el cronómetro de
// "elegir un líder", que corre solo en el navegador). Por eso solo se vuelve a
// pintar cuando algo relevante del servidor realmente cambió, no en cada sondeo.
let lastSlideIndex = -1;
let lastActivitySig = null;
async function poll(){
  try{
    const st = await api('/api/state');
    connDot.classList.remove('off');
    renderTimer(st);
    if(st.slideIndex!==lastSlideIndex){ renderSlideInfo(st); }
    const sig = JSON.stringify({ i:st.slideIndex, p:st.partIndex, r:st.revealed, v:st.votes, rc:st.roleCounts, t:(st.texts||[]).length });
    if(sig !== lastActivitySig){ renderActivity(st); lastActivitySig = sig; }
    lastSlideIndex = st.slideIndex;
  }catch{
    connDot.classList.add('off');
  }
}

async function boot(){
  const deck = await api('/api/deck');
  SLIDES = deck.slides;
  BLOQUE_TIMING = deck.bloqueTiming;
  refreshJoinInfo();
  poll();
  setInterval(poll, 1000);
}
boot();
