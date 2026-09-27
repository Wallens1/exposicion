/* =========================================================
   phone.js — lo que ve el público en su celular.
   Sigue en vivo el estado que transmite server.js.
   ========================================================= */

const BLOQUE_COLORS = {
  1:'#e8b965', 2:'#8fbf9f', 3:'#d98c6b', 4:'#7fb3d9', 5:'#b79bd9',
  6:'#d98ca0', 7:'#cbb35a', 8:'#5fc3b0', 9:'#e8b965',
};

const main = document.querySelector('#main');
const prog = document.querySelector('#prog');
const progressFill = document.querySelector('#progressFill');
const offlineBanner = document.querySelector('#offlineBanner');

function getClientId(){
  try{
    let id = localStorage.getItem('origen-client-id');
    if(!id){ id = crypto.randomUUID(); localStorage.setItem('origen-client-id', id); }
    return id;
  }catch{ return 'anon-'+Math.random().toString(36).slice(2); }
}
const clientId = getClientId();

let SLIDES = [];
let myRole = null;
let lastRoundKey = null;
let hasVotedThisRound = false;
let sentTexts = new Set();

async function api(pathname, method='GET', body){
  const res = await fetch(pathname, { method, headers: body?{'Content-Type':'application/json'}:undefined, body: body?JSON.stringify(body):undefined });
  return res.json();
}

function bloqueNumber(section){ return parseInt(section,10) || 1; }

function render(st){
  const slide = SLIDES[st.slideIndex]; if(!slide) return;
  const accent = BLOQUE_COLORS[bloqueNumber(slide.section)] || '#e8b965';
  document.documentElement.style.setProperty('--accent', accent);

  prog.textContent = `${st.slideIndex+1} / ${st.totalSlides}`;
  progressFill.style.width = `${((st.slideIndex+1)/st.totalSlides)*100}%`;

  const roundKey = st.slideIndex+':'+st.partIndex;
  if(roundKey !== lastRoundKey){ lastRoundKey = roundKey; hasVotedThisRound = false; }

  const ph = slide.phone || { type:'info' };
  let html = `<span class="phone-section">${slide.section}</span><h2 class="phone-title">${stripTags(slide.title) || slide.section}</h2>`;

  if(ph.type==='role') html += roleView(slide, st);
  else if(ph.type==='reveal') html += revealView(slide, st);
  else if(ph.type==='vote') html += voteView(slide, st);
  else if(ph.type==='text') html += textView(slide, st);
  else html += infoView(slide, st);

  main.innerHTML = html;
  wireInteractions(slide, st);
}

function stripTags(html){ return html ? html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim() : ''; }

function infoView(slide, st){
  const fact = slide.phone && slide.phone.fact;
  return `<div class="phone-card"><p class="lede" style="color:var(--ink)">Sigan la explicación en la pantalla.</p></div>
  ${fact?`<div class="fact-card"><span class="eyebrow">DATO CURIOSO</span><p>${fact}</p></div>`:''}`;
}

function roleView(slide, st){
  if(!myRole) return `<div class="phone-card"><p class="lede">Asignando tu rol…</p></div>`;
  const statusClass = myRole.canVote ? 'can' : 'cannot';
  const statusLabel = myRole.canVote ? 'PUEDES VOTAR' : 'NO PUEDES VOTAR';
  return `<div class="phone-card role-badge">
    <span class="eyebrow">ERES</span>
    <div class="big">${myRole.label}</div>
    <span class="status ${statusClass}">${statusLabel}</span>
    <p class="blurb">${myRole.blurb}</p>
  </div>
  ${slide.phone.fact?`<div class="fact-card"><span class="eyebrow">DATO CURIOSO</span><p>${slide.phone.fact}</p></div>`:''}`;
}

function revealView(slide, st){
  const ph = slide.phone;
  const cluesHtml = `<ol class="clue-list">${ph.clues.map(c=>`<li>${c}</li>`).join('')}</ol>`;
  if(!st.revealed){
    return `<div class="phone-card">${cluesHtml}<p class="wait-note">Griten el nombre. El expositor va a revelar la respuesta.</p></div>`;
  }
  return `<div class="phone-card">${cluesHtml}
    <div class="vote-explain" style="margin-top:16px"><strong style="color:var(--accent);display:block;margin-bottom:6px;font-size:18px">${ph.answer}</strong>${ph.detail}</div>
  </div>`;
}

function voteView(slide, st){
  const ph = slide.phone;
  const part = ph.parts[st.partIndex] || ph.parts[0];
  const totalVotes = Object.values(st.votes||{}).reduce((a,b)=>a+b,0);
  const choicesHtml = part.choices.map((c,i)=>{
    let cls = 'vote-choice';
    if(st.revealed){
      if(i===part.correctIndex) cls += ' correct';
      else if(hasVotedThisRound && Number(sessionStorage.getItem('lastChoice'))===i) cls += ' wrong';
    }
    return `<button class="${cls}" data-choice="${i}" ${hasVotedThisRound||st.revealed?'disabled':''} type="button">${c}</button>`;
  }).join('');

  let status = '';
  if(hasVotedThisRound && !st.revealed) status = `<p class="vote-status">Voto registrado. Esperando a los demás…</p>`;
  let explain = st.revealed ? `<div class="vote-explain">${part.explanation}</div>` : '';
  let bars = '';
  if(st.revealed){
    bars = `<div class="result-bars">${part.choices.map((c,i)=>{
      const n = st.votes[String(i)]||0;
      const pct = totalVotes ? Math.round(n/totalVotes*100) : 0;
      return `<div class="result-row"><span class="l">${c}</span><div class="result-bar"><span style="width:${pct}%"></span></div><span>${pct}%</span></div>`;
    }).join('')}</div>`;
  }
  return `<div class="phone-card">
    <p class="vote-question">${part.question}</p>
    <div class="vote-choices">${choicesHtml}</div>
    ${status}${explain}${bars}
  </div>`;
}

function textView(slide, st){
  const already = sentTexts.has(st.slideIndex);
  if(already){
    return `<div class="phone-card text-form"><p class="sent-note">✓ Enviado. Gracias.</p></div>`;
  }
  return `<div class="phone-card text-form">
    <textarea id="textInput" maxlength="140" placeholder="${slide.phone.prompt}"></textarea>
    <button id="textSend" type="button">Enviar</button>
  </div>`;
}

function wireInteractions(slide, st){
  const ph = slide.phone; if(!ph) return;

  if(ph.type==='vote'){
    main.querySelectorAll('[data-choice]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        if(hasVotedThisRound) return;
        hasVotedThisRound = true;
        const idx = Number(btn.dataset.choice);
        sessionStorage.setItem('lastChoice', String(idx));
        main.querySelectorAll('[data-choice]').forEach(b=>{ b.disabled=true; b.classList.toggle('selected', b===btn); });
        await api('/api/vote','POST',{ clientId, choiceIndex: idx });
        const statusP = document.createElement('p');
        statusP.className='vote-status'; statusP.textContent='Voto registrado. Esperando a los demás…';
        main.querySelector('.phone-card').appendChild(statusP);
      });
    });
  }

  if(ph.type==='text'){
    const send = main.querySelector('#textSend');
    const input = main.querySelector('#textInput');
    if(send) send.addEventListener('click', async ()=>{
      const text = input.value.trim();
      if(!text) return;
      send.disabled = true;
      await api('/api/text','POST',{ text });
      sentTexts.add(st.slideIndex);
      render(st);
    });
  }
}

async function ensureRole(){
  try{ myRole = await api('/api/role?clientId='+encodeURIComponent(clientId)); }
  catch{ myRole = null; }
}

async function poll(){
  try{
    const st = await api('/api/state');
    offlineBanner.classList.remove('show');
    render(st);
  }catch{
    offlineBanner.classList.add('show');
  }
}

async function connectWithRetry(){
  while(true){
    try{
      const deck = await api('/api/deck');
      SLIDES = deck.slides;
      return;
    }catch{
      offlineBanner.classList.add('show');
      await new Promise(r=>setTimeout(r,2000));
    }
  }
}

async function boot(){
  main.innerHTML = `<div class="phone-card"><p class="lede" style="color:var(--ink)">Conectando…</p></div>`;
  await connectWithRetry();
  await ensureRole();
  poll();
  setInterval(poll, 1000);
}
boot();
