/* =========================================================
   deck.js — fuente única de verdad del contenido.
   La usa server.js (Node) y se sirve como JSON en /api/deck
   para que projection.js, admin.js y phone.js la consuman.

   Cada composición es propia de su contenido (línea de tiempo,
   diagrama, mapa anotado, comparación, cifra dominante) — no
   una plantilla de tarjetas repetida. Las imágenes usan la
   función frame()/portrait() de abajo: mientras no exista el
   archivo real en public/images/diapo-<diapo>.jpg, se ve un
   recuadro con la descripción de qué foto debería ir ahí.
   ========================================================= */

const ICON = `<svg viewBox="0 0 48 48" width="32" height="32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6">
  <rect x="6" y="6" width="36" height="36"/><circle cx="17" cy="18" r="4"/>
  <path d="m8 34 10-10 7 7 6-8 11 13" stroke-linejoin="round" stroke-linecap="round"/></svg>`;

function frame(diapo, caption, aspect){
  return `<div class="frame" style="aspect-ratio:${aspect||'4/3'}">
    <img src="/images/diapo-${diapo}.jpg" alt="" loading="lazy" onerror="this.classList.add('broken')">
    <div class="frame-fallback">${ICON}<span>${caption}</span></div>
  </div>`;
}
function portrait(diapo, caption, aspect){
  return `<div class="portrait-frame" style="aspect-ratio:${aspect||'3/4'}">
    <img src="/images/diapo-${diapo}.jpg" alt="" loading="lazy" onerror="this.classList.add('broken')">
    <div class="portrait-fallback">${ICON}<span>${caption}</span></div>
  </div>`;
}
function units(total, onIdx){
  return `<div class="units">${Array.from({length:total},(_,i)=>`<i class="${i===onIdx?'on':''}"></i>`).join('')}</div>`;
}

const ATHENS_ROLES = [
  { key:'citizen',  label:'Ciudadano varón adulto', weight:1, canVote:true,  blurb:'Puedes votar en la asamblea. Tu decisión afecta también a quienes no pueden votar.' },
  { key:'woman',     label:'Mujer',                  weight:4, canVote:false, blurb:'Vives en Atenas, pero la asamblea no te escucha. No tienes voto.' },
  { key:'enslaved',  label:'Persona esclavizada',     weight:3, canVote:false, blurb:'Sostienes con tu trabajo la ciudad que decide sin ti.' },
  { key:'foreign',   label:'Extranjero (meteco)',     weight:2, canVote:false, blurb:'Aunque llevaras toda la vida en Atenas, no eras ciudadano.' },
];

const BLOQUE_TIMING = [
  { bloque:1, label:'Apertura',              minutes:5,  target:5  },
  { bloque:2, label:'El origen',             minutes:6,  target:11 },
  { bloque:3, label:'El poder sagrado',      minutes:5,  target:16 },
  { bloque:4, label:'Grecia y Roma',         minutes:6,  target:22 },
  { bloque:5, label:'Imperios y monarquías', minutes:6,  target:28 },
  { bloque:6, label:'Las revoluciones',      minutes:6,  target:34 },
  { bloque:7, label:'Siglo XX',              minutes:5,  target:39 },
  { bloque:8, label:'Colombia',              minutes:14, target:53 },
  { bloque:9, label:'Cierre',                minutes:4,  target:57 },
];

// Hoja de ruta solo para el panel del expositor (/expositor): fechas y nombres
// clave para orientarse rápido durante la exposición. El público NO la ve.
const ROADMAP = [
  { yr:'300.000 a. C.', name:'Homo sapiens' },
  { yr:'1754 a. C.', name:'Código de Hammurabi' },
  { yr:'508 a. C.', name:'Atenas, nace la democracia' },
  { yr:'27 a. C.', name:'Augusto, Roma se vuelve imperio' },
  { yr:'1215', name:'Carta Magna' },
  { yr:'1789', name:'Revolución francesa, Nariño' },
  { yr:'1886', name:'Constitución colombiana centralista' },
  { yr:'1948', name:'Declaración Universal de Derechos Humanos' },
  { yr:'1991', name:'Constitución de Colombia' },
];

const SLIDES = [

// ========== BLOQUE 1 · APERTURA ==========
{
  diapo:'1', section:'01 · LA PREGUNTA', speaker:'EXPOSITOR A', bare:true,
  title:'De la tribu a Colombia.',
  widget:'leader-timer',
  body:`<div class="title-top">
    <span class="kicker">El poder y el derecho</span>
    <span class="mono-tag">01 / 41</span>
  </div>
  <div class="title-main">
    <h1 class="h-display">De la tribu<br>a <em>Colombia.</em></h1>
    <div class="title-join" id="titleJoin"></div>
  </div>
  <div class="title-bottom">
    <span class="cap">300.000 años en 57 minutos</span>
  </div>`,
  phone:{ type:'info', fact:'En bandas de cazadores-recolectores nadie mandaba de forma permanente: el liderazgo se ganaba y se perdía según el prestigio.' }
},
{
  diapo:'2', section:'01 · LA PREGUNTA', speaker:'EXPOSITOR A',
  title:'Tres razones para obedecer.',
  body:`<h2 class="h-display">Tres razones<br>para <em>obedecer.</em></h2>
  <hr class="rule" style="margin:26px 0 22px">
  <div class="comp">
    <div class="c4"><span class="kicker">I · Tradición</span><h3 class="h-sub" style="font-size:19px;margin-top:8px">"Siempre ha sido así"</h3><p class="lede" style="margin-top:8px">La autoridad se apoya en la costumbre.</p></div>
    <div class="c4"><span class="kicker">II · Carisma</span><h3 class="h-sub" style="font-size:19px;margin-top:8px">"Esta persona es excepcional"</h3><p class="lede" style="margin-top:8px">La autoridad se apoya en cualidades que el grupo admira.</p></div>
    <div class="c4"><span class="kicker">III · Ley</span><h3 class="h-sub" style="font-size:19px;margin-top:8px">"Una norma le dio el cargo"</h3><p class="lede" style="margin-top:8px">La autoridad se apoya en reglas e instituciones.</p></div>
  </div>
  <p class="cap" style="margin-top:24px">Max Weber, sociólogo alemán (1864–1920). Son tipos ideales. En la vida real se combinan.</p>`,
  phone:{ type:'info', fact:'Weber escribió esta teoría hace más de cien años, pero se sigue usando para analizar gobiernos actuales.' }
},
{
  diapo:'3', section:'01 · LA PREGUNTA', speaker:'EXPOSITOR A',
  title:'¿Por qué obedecemos y qué límites tiene el poder?',
  body:`<div class="comp">
    <div class="c7">
      <p class="quote-ed"><span class="mark">"</span>¿Por qué obedecemos<br>a quien manda?</p>
    </div>
    <div class="c4 s9 self-end">
      <p class="lede large">Y una segunda pregunta que va a volver, exactamente igual, al final de la exposición:</p>
      <p class="h-sub" style="margin-top:10px;font-size:22px"><em>¿Qué límites tiene su poder?</em></p>
      <hr class="rule" style="margin:20px 0">
      <p class="cap">Primeros humanos → Colombia, Constitución de 1991</p>
    </div>
  </div>`,
  phone:{ type:'info', fact:'Guarda estas dos preguntas: van a volver, exactamente iguales, en la última diapositiva.' }
},

// ========== BLOQUE 2 · EL ORIGEN ==========
{
  diapo:'4', section:'02 · EL ORIGEN', speaker:'EXPOSITOR B',
  title:'Homo sapiens, hace 300.000 años.',
  body:`<div class="comp">
    <div class="c5">
      <span class="num-mega">300<span class="unit">mil años</span></span>
      <p class="lede large" style="margin-top:6px">de nuestra especie. Bandas de 20 a 50 personas.<br>Sin reyes, sin policía, sin leyes escritas.</p>
    </div>
    <div class="c6 s7 self-center activity">
      <h3>Si alguien roba comida,<br>¿quién lo castiga?</h3>
    </div>
  </div>`,
  phone:{ type:'info', fact:'Todos los humanos vivos hoy descendemos de poblaciones que salieron de África hace unos 70.000 años.' }
},
{
  diapo:'5', section:'02 · EL ORIGEN', speaker:'EXPOSITOR B',
  title:'Del grupo igualitario al cacicazgo.',
  body:`<h2 class="h-display" style="font-size:clamp(30px,3.6vw,50px);margin-bottom:8px">Del grupo igualitario<br>al <em>cacicazgo.</em></h2>
  <div class="flow" style="margin-top:30px">
    <div class="flow-step"><span class="n">01 · CULTIVAR</span><h3>Agricultura</h3><p>Aparecen los excedentes.</p></div>
    <div class="flow-arrow">→</div>
    <div class="flow-step"><span class="n">02 · ACUMULAR</span><h3>Riqueza</h3><p>Alguien la controla y redistribuye.</p></div>
    <div class="flow-arrow">→</div>
    <div class="flow-step"><span class="n">03 · HEREDAR</span><h3>Cacicazgo</h3><p>El jefe ya no se gana el puesto, lo hereda.</p></div>
  </div>`,
  phone:{ type:'info', fact:'La agricultura apareció de forma independiente en al menos siete regiones distintas del planeta.' }
},
{
  diapo:'6', section:'02 · EL ORIGEN', speaker:'EXPOSITOR B',
  title:'Colombia antes de 1492.',
  body:`<div class="comp">
    <div class="c7">${frame('6','Mapa de los pueblos indígenas del territorio colombiano antes de 1492.','16/11')}</div>
    <div class="c4 s9 self-center">
      <span class="kicker">¿Y aquí?</span>
      <p class="quote-ed" style="font-size:clamp(21px,2.4vw,30px);margin-top:10px">Cientos de pueblos indígenas.<br>Ningún <em>imperio único.</em></p>
      <p class="cap" style="margin-top:14px">Cada pueblo tenía su propia forma de organizar el poder.</p>
    </div>
  </div>`,
  phone:{ type:'info', fact:'A diferencia de los incas o los aztecas, en el territorio colombiano nunca hubo un imperio que unificara a todos los pueblos.' }
},
{
  diapo:'6A', section:'02 · EL ORIGEN', speaker:'EXPOSITOR B',
  title:'Cuatro pueblos, cuatro formas de poder.',
  body:`<div class="comp">
    <div class="c5">${portrait('6A','Piezas de orfebrería muisca o tairona.','3/4')}</div>
    <div class="c6 s7">
      <h2 class="h-display" style="font-size:clamp(26px,3vw,38px);margin-bottom:16px">Cuatro pueblos,<br>cuatro formas de <em>poder.</em></h2>
      <div class="map-note-list">
        <div class="map-item"><span class="pin">I</span><div><h3>Muiscas, altiplano cundiboyacense</h3><p>Zipa y zaque. Poder heredado por línea materna. Tributos, sal y esmeraldas.</p></div></div>
        <div class="map-item"><span class="pin">II</span><div><h3>Taironas, Sierra Nevada</h3><p>Poder político ligado al religioso. Hoy, koguis, arhuacos, wiwas, kankuamos y sus mamos.</p></div></div>
        <div class="map-item"><span class="pin">III</span><div><h3>Zenúes, Sinú y San Jorge</h3><p>Un enorme sistema de canales exigía organizar el trabajo de miles de personas.</p></div></div>
        <div class="map-item"><span class="pin">IV</span><div><h3>Calimas, Valle del Cauca</h3><p>Sociedades agrícolas. La orfebrería en oro, símbolo de poder.</p></div></div>
      </div>
    </div>
  </div>`,
  phone:{ type:'info', fact:'La leyenda de El Dorado nació de un rito muisca real: el zipa se cubría en polvo de oro y se sumergía en la laguna de Guatavita.' }
},
{
  diapo:'6B', section:'02 · EL ORIGEN', speaker:'EXPOSITOR B',
  title:'No son solo pasado.',
  body:`<div class="comp">
    <div class="c5"><span class="num-mega">115</span></div>
    <div class="c6 s7 self-center">
      <span class="kicker">No son solo pasado</span>
      <p class="lede large" style="margin-top:8px">pueblos indígenas viven hoy en Colombia (DANE, censo 2018), también en el Valle del Cauca.</p>
      <hr class="rule" style="margin:18px 0">
      <p class="cap">La Constitución de 1991 reconoce sus propias autoridades y normas.</p>
    </div>
  </div>`,
  phone:{ type:'info', fact:'En Colombia se hablan hoy más de 60 lenguas indígenas vivas, además del español.' }
},

// ========== BLOQUE 3 · EL PODER SAGRADO ==========
{
  diapo:'7', section:'03 · EL PODER SAGRADO', speaker:'EXPOSITOR A',
  title:'Egipto: el faraón como dios.',
  body:`<div class="comp">
    <div class="c5">${portrait('7','Estatua o relieve de Hatshepsut como faraona, con barba ceremonial.','3/4')}</div>
    <div class="c6 s7 self-center">
      <span class="kicker">Egipto</span>
      <h2 class="h-display" style="font-size:clamp(28px,3.2vw,42px);margin:8px 0 14px">El faraón<br>como <em>dios.</em></h2>
      <p class="lede large">Hace unos 3.500 años, Hatshepsut gobernó Egipto como faraona, y se hacía representar con barba postiza, símbolo del poder real.</p>
    </div>
  </div>`,
  phone:{ type:'info', fact:'Hatshepsut fue una de las gobernantes con el reinado más próspero y largo de todo el Antiguo Egipto, unos 20 años.' }
},
{
  diapo:'8', section:'03 · EL PODER SAGRADO', speaker:'EXPOSITOR A',
  title:'Código de Hammurabi, hacia 1754 a. C.',
  body:`<div class="comp">
    <div class="c7">
      <p class="quote-ed"><span class="mark">"</span>Si alguien le saca un ojo a un noble, a él le sacan un ojo. Si se lo saca a un plebeyo, solo paga una suma de plata.<span class="src">Código de Hammurabi · Babilonia, hacia 1754 a. C.</span></p>
    </div>
    <div class="c4 s9 self-end">
      <p class="cap">Casi 300 leyes grabadas en piedra, públicas, pero no iguales para todos.</p>
    </div>
  </div>`,
  phone:{ type:'info', fact:'La estela original con el Código de Hammurabi existe todavía, se exhibe en el museo del Louvre, en París.' }
},
{
  diapo:'9', section:'03 · EL PODER SAGRADO', speaker:'EXPOSITOR A',
  title:'China: el Mandato del Cielo.',
  body:`<h2 class="h-display" style="font-size:clamp(28px,3.4vw,44px)">El Mandato<br>del <em>Cielo.</em></h2>
  <div class="flow" style="margin-top:28px">
    <div class="flow-step"><span class="n">SI…</span><h3>El pueblo sufre</h3><p>Hambre, inundaciones, injusticia.</p></div>
    <div class="flow-arrow">→</div>
    <div class="flow-step"><span class="n">ENTONCES…</span><h3>Llegan catástrofes</h3><p>Se interpretan como una señal.</p></div>
    <div class="flow-arrow">→</div>
    <div class="flow-step"><span class="n">RESULTADO</span><h3>Pierde el mandato</h3><p>El Cielo se lo retira al gobernante.</p></div>
  </div>
  <p class="cap" style="margin-top:22px">China, dinastía Zhou, hacia 1046 a. C. Incluso un poder sagrado se puede perder.</p>`,
  phone:{ type:'info', fact:'El Mandato del Cielo se siguió usando para justificar o cuestionar dinastías chinas durante casi 3.000 años.' }
},

// ========== BLOQUE 4 · GRECIA Y ROMA ==========
{
  diapo:'10', section:'04 · GRECIA Y ROMA', speaker:'EXPOSITOR B',
  title:'Atenas, 508 a. C.: nace la democracia.',
  body:`<div class="comp">
    <div class="c6">
      <h2 class="h-display" style="font-size:clamp(28px,3.4vw,44px)">Nace la<br><em>democracia.</em></h2>
      <p class="lede large" style="margin-top:14px">La asamblea de ciudadanos vota leyes, guerra y paz. De ahí, "democracia", gobierno del pueblo.</p>
      ${units(10,4)}
      <p class="cap" style="margin-top:10px">Solo cerca de 1 de cada 10 habitantes era ciudadano con derecho a voto.</p>
    </div>
    <div class="c5 s8 self-center activity">
      <span class="kicker">En sus celulares</span>
      <h3>Cada quien recibió un rol al azar.</h3>
      <p>¿Quién puede votar en la asamblea? Miren su pantalla.</p>
    </div>
  </div>`,
  phone:{ type:'role', roles:ATHENS_ROLES, fact:'Se calcula que en la Atenas clásica solo 1 de cada 10 habitantes tenía derecho a voto.' }
},
{
  diapo:'11', section:'04 · GRECIA Y ROMA', speaker:'EXPOSITOR B',
  title:'Roma: república, imperio y derecho.',
  body:`<h2 class="h-display" style="font-size:clamp(28px,3.4vw,44px)">República,<br>imperio y <em>derecho.</em></h2>
  <div class="timeline" style="margin-top:34px"><div class="timeline-row">
    <div class="timeline-item"><span class="yr">509 A. C.</span><h3>República</h3><p>Dos cónsules y un Senado.</p></div>
    <div class="timeline-item"><span class="yr">450 A. C.</span><h3>XII Tablas</h3><p>Las leyes se hacen públicas.</p></div>
    <div class="timeline-item"><span class="yr">27 A. C.</span><h3>Augusto</h3><p>La república se convierte en imperio.</p></div>
  </div></div>`,
  phone:{ type:'info', fact:'Las XII Tablas se exhibían en el foro romano para que cualquiera pudiera leerlas. Era una novedad que la ley fuera pública.' }
},
{
  diapo:'12', section:'04 · GRECIA Y ROMA', speaker:'EXPOSITOR B',
  title:'Del Código de Justiniano al Código Civil.',
  body:`<span class="kicker">¿Y aquí?</span>
  <h2 class="h-display" style="font-size:clamp(26px,3vw,40px);margin:8px 0 30px">Del Código de Justiniano<br>al <em>Código Civil.</em></h2>
  <div class="flow">
    <div class="flow-step"><span class="n">SIGLO VI</span><h3>Justiniano</h3><p>Recopila todo el derecho romano.</p></div>
    <div class="flow-arrow">→</div>
    <div class="flow-step"><span class="n">SIGLO XIX</span><h3>Andrés Bello</h3><p>Escribe el Código Civil chileno sobre esa base.</p></div>
    <div class="flow-arrow">→</div>
    <div class="flow-step"><span class="n">HOY</span><h3>Colombia</h3><p>Un contrato de arriendo tiene raíces romanas.</p></div>
  </div>`,
  phone:{ type:'info', fact:'El Código Civil que escribió Andrés Bello para Chile fue adoptado, con ajustes, por Colombia, Ecuador y otros países de la región.' }
},

// ========== BLOQUE 5 · IMPERIOS Y MONARQUÍAS ==========
{
  diapo:'13', section:'05 · IMPERIOS Y MONARQUÍAS', speaker:'EXPOSITOR A',
  title:'¿Quién soy?',
  body:`<div class="comp"><div class="c7">
    <h2 class="h-display">¿Quién <em>soy?</em></h2>
    <p class="lede large" style="margin-top:16px">Tres pistas por personaje. En sus celulares van a encontrar tres nombres posibles, elijan el que crean correcto.</p>
  </div></div>`,
  phone:{ type:'info', fact:'Van a conocer a dos emperadores, una emperatriz china y una reina española, todos gobernantes reales.' }
},
{
  diapo:'14', section:'05 · IMPERIOS Y MONARQUÍAS', speaker:'EXPOSITOR A',
  title:'Personaje 01, Qin Shi Huang.',
  body:`<div class="comp">
    <div class="c5">${portrait('14','Ejército de terracota o retrato de Qin Shi Huang.','3/4')}</div>
    <div class="c6 s7 self-center">
      <span class="mono-tag">PERSONAJE 01</span>
      <ol class="rail" style="list-style:none;padding-left:20px;margin:16px 0 0;display:flex;flex-direction:column;gap:10px">
        <li class="lede">Unifiqué China en el año 221 a. C. y me proclamé su primer emperador.</li>
        <li class="lede">Unifiqué la escritura, las monedas y las medidas del imperio.</li>
        <li class="lede">Me enterraron con un ejército de miles de soldados de barro.</li>
      </ol>
      <div class="answer" hidden style="margin-top:18px;padding-top:16px;border-top:1px solid var(--line)">
        <h3 class="h-sub">Qin Shi Huang</h3>
        <p class="lede" style="margin-top:6px">Nace el imperio chino, que durará más de 2.000 años. Desde la dinastía Sui (605), los funcionarios se elegían por exámenes, no solo por ser nobles.</p>
      </div>
    </div>
  </div>`,
  phone:{ type:'vote', parts:[{ question:'¿Quién es este personaje?', choices:['Kublai Khan','Qin Shi Huang','Puyi'], correctIndex:1, explanation:'Nace el imperio chino, que durará más de 2.000 años.' }] }
},
{
  diapo:'15', section:'05 · IMPERIOS Y MONARQUÍAS', speaker:'EXPOSITOR A',
  title:'Personaje 02, Wu Zetian.',
  body:`<div class="comp">
    <div class="c5">${portrait('15','Retrato o pintura clásica de Wu Zetian.','3/4')}</div>
    <div class="c6 s7 self-center">
      <span class="mono-tag">PERSONAJE 02</span>
      <ol class="rail" style="list-style:none;padding-left:20px;margin:16px 0 0;display:flex;flex-direction:column;gap:10px">
        <li class="lede">Fui concubina de un emperador y terminé gobernando.</li>
        <li class="lede">Fundé mi propia dinastía.</li>
        <li class="lede">Soy la única mujer que gobernó China como emperatriz en nombre propio.</li>
      </ol>
      <div class="answer" hidden style="margin-top:18px;padding-top:16px;border-top:1px solid var(--line)">
        <h3 class="h-sub">Wu Zetian</h3>
        <p class="lede" style="margin-top:6px">Gobernó del 690 al 705 d. C.</p>
      </div>
    </div>
  </div>`,
  phone:{ type:'vote', parts:[{ question:'¿Quién es este personaje?', choices:['Cixi','Nefertiti','Wu Zetian'], correctIndex:2, explanation:'Gobernó del 690 al 705 d. C.' }] }
},
{
  diapo:'16', section:'05 · IMPERIOS Y MONARQUÍAS', speaker:'EXPOSITOR A',
  title:'Personaje 03, Catalina la Grande.',
  body:`<div class="comp">
    <div class="c5">${portrait('16','Retrato de Catalina la Grande de Rusia.','3/4')}</div>
    <div class="c6 s7 self-center">
      <span class="mono-tag">PERSONAJE 03</span>
      <ol class="rail" style="list-style:none;padding-left:20px;margin:16px 0 0;display:flex;flex-direction:column;gap:10px">
        <li class="lede">Nací princesa en un pequeño Estado alemán.</li>
        <li class="lede">Llegué al poder después de que derrocaran a mi esposo.</li>
        <li class="lede">Goberné Rusia durante 34 años como emperatriz.</li>
      </ol>
      <div class="answer" hidden style="margin-top:18px;padding-top:16px;border-top:1px solid var(--line)">
        <h3 class="h-sub">Catalina la Grande</h3>
        <p class="lede" style="margin-top:6px">Leía a los filósofos de la Ilustración, pero nunca aceptó límites a su poder. La llaman "déspota ilustrada".</p>
      </div>
    </div>
  </div>`,
  phone:{ type:'vote', parts:[{ question:'¿Quién es este personaje?', choices:['Victoria de Inglaterra','Catalina la Grande','María Antonieta'], correctIndex:1, explanation:'Leía a los filósofos de la Ilustración, pero nunca aceptó límites a su propio poder.' }] }
},
{
  diapo:'17', section:'05 · IMPERIOS Y MONARQUÍAS', speaker:'EXPOSITOR A',
  title:'Personaje 04, Isabel de Castilla.',
  body:`<div class="comp">
    <div class="c5">${portrait('17','Retrato de Isabel de Castilla.','3/4')}</div>
    <div class="c6 s7 self-center">
      <span class="mono-tag">PERSONAJE 04</span>
      <ol class="rail" style="list-style:none;padding-left:20px;margin:16px 0 0;display:flex;flex-direction:column;gap:10px">
        <li class="lede">Financié el viaje de Cristóbal Colón en 1492.</li>
        <li class="lede">Con mi esposo Fernando unifiqué buena parte de España.</li>
        <li class="lede">Con mi reinado empezó la Conquista de América.</li>
      </ol>
      <div class="answer" hidden style="margin-top:18px;padding-top:16px;border-top:1px solid var(--line)">
        <h3 class="h-sub">Isabel de Castilla</h3>
        <p class="lede" style="margin-top:6px">Es el puente con la historia de Colombia.</p>
      </div>
    </div>
  </div>`,
  phone:{ type:'vote', parts:[{ question:'¿Quién es este personaje?', choices:['Juana la Loca','Leonor de Aquitania','Isabel de Castilla'], correctIndex:2, explanation:'Es el puente con la historia de Colombia.' }] }
},
{
  diapo:'18', section:'05 · IMPERIOS Y MONARQUÍAS', speaker:'EXPOSITOR A',
  title:'Europa: la Carta Magna, 1215.',
  body:`<div class="comp">
    <div class="c7">${frame('18','Fotografía de una copia original de la Carta Magna de 1215.','16/10')}</div>
    <div class="c4 s9 self-center">
      <span class="kicker">Europa · 1215</span>
      <p class="lede large" style="margin-top:8px">Los nobles ingleses obligan al rey Juan sin Tierra a firmarla. Por primera vez, un documento escrito dice que el rey también está sometido a la ley.</p>
      <p class="cap" style="margin-top:14px">Protegía sobre todo a los nobles, pero la idea quedó sembrada.</p>
    </div>
  </div>`,
  phone:{ type:'info', fact:'Solo quedan cuatro copias originales de la Carta Magna de 1215, dos en la Biblioteca Británica y una en cada una de las catedrales de Lincoln y Salisbury.' }
},
{
  diapo:'19', section:'05 · IMPERIOS Y MONARQUÍAS', speaker:'EXPOSITOR A',
  title:'La Colonia.',
  body:`<span class="kicker">¿Y aquí? La Colonia</span>
  <div class="comp" style="margin-top:14px">
    <div class="c12 compare">
      <div><h3>Encomienda</h3><p>Tributo y trabajo forzado, a cambio de una protección y evangelización que casi nunca se cumplió.</p></div>
      <div class="div"></div>
      <div><h3>1542 · Leyes Nuevas</h3><p>Buscaban limitar los abusos de los encomenderos. Poco cumplidas.</p></div>
    </div>
  </div>
  <p class="quote-ed" style="font-size:clamp(20px,2.4vw,30px);margin-top:32px">Una cosa es la ley escrita.<br>Otra, <em>lo que se cumple.</em></p>
  <p class="cap" style="margin-top:14px">Resguardos y cabildos nacen en la Colonia para controlar a los indígenas, pero con los siglos se vuelven herramientas de autonomía.</p>`,
  phone:{ type:'info', fact:'Los resguardos indígenas coloniales nunca desaparecieron del todo. Hoy están protegidos como tierras colectivas por la Constitución de 1991.' }
},

// ========== BLOQUE 6 · LAS REVOLUCIONES ==========
{
  diapo:'20', section:'06 · LAS REVOLUCIONES', speaker:'EXPOSITOR B',
  title:'Inglaterra: el rey reina, no gobierna.',
  body:`<h2 class="h-display" style="font-size:clamp(28px,3.4vw,44px)">El rey reina,<br>no <em>gobierna.</em></h2>
  <div class="timeline" style="margin-top:34px"><div class="timeline-row">
    <div class="timeline-item"><span class="yr">1689</span><h3>Declaración de Derechos</h3><p>El rey ya no cobra impuestos ni tiene ejército sin el Parlamento.</p></div>
    <div class="timeline-item"><span class="yr">1721</span><h3>Primer ministro</h3><p>Robert Walpole, el primero.</p></div>
    <div class="timeline-item"><span class="yr">Parlamentarismo</span><h3>Nace un modelo</h3><p>El ministro responde ante el Parlamento.</p></div>
  </div></div>`,
  phone:{ type:'info', fact:'Robert Walpole nunca usó el título "primer ministro": en su época era casi un insulto. El nombre se popularizó después.' }
},
{
  diapo:'21', section:'06 · LAS REVOLUCIONES', speaker:'EXPOSITOR B',
  title:'Estados Unidos: nace el presidente.',
  body:`<h2 class="h-display" style="font-size:clamp(28px,3.4vw,44px)">Nace el<br><em>presidente.</em></h2>
  <hr class="rule" style="margin:26px 0 22px">
  <div class="comp">
    <div class="c4"><span class="kicker">Legislativo</span><p class="lede" style="margin-top:8px">Hace las leyes.</p></div>
    <div class="c4"><span class="kicker">Ejecutivo</span><p class="lede" style="margin-top:8px">Las ejecuta. En 1789, George Washington fue el primer presidente.</p></div>
    <div class="c4"><span class="kicker">Judicial</span><p class="lede" style="margin-top:8px">Juzga. Los tres, separados (Montesquieu).</p></div>
  </div>
  <p class="cap" style="margin-top:24px">1787 · Nace el presidencialismo, el modelo que copiaría casi toda América Latina, incluida Colombia.</p>`,
  phone:{ type:'info', fact:'George Washington pudo haberse reelegido indefinidamente, pero se retiró tras dos períodos, creando una costumbre que duró hasta 1940.' }
},
{
  diapo:'22', section:'06 · LAS REVOLUCIONES', speaker:'EXPOSITOR B',
  title:'Francia, 1789: Declaración de los Derechos del Hombre.',
  body:`<div class="comp">
    <div class="c8">
      <p class="quote-ed"><span class="mark">"</span>Los hombres nacen y permanecen libres e iguales en derechos.<span class="src">Declaración de los Derechos del Hombre y del Ciudadano · Francia, 1789</span></p>
    </div>
    <div class="c3 s10 self-end"><p class="cap">La soberanía reside en la nación, no en el rey, aunque en la práctica excluía a mujeres y esclavos.</p></div>
  </div>`,
  phone:{ type:'info', fact:'Olympe de Gouges respondió en 1791 con la Declaración de los Derechos de la Mujer y la Ciudadana, y fue guillotinada dos años después.' }
},
{
  diapo:'23', section:'06 · LAS REVOLUCIONES', speaker:'EXPOSITOR B',
  title:'Antonio Nariño.',
  body:`<span class="kicker">¿Y aquí?</span>
  <h2 class="h-display" style="font-size:clamp(28px,3.4vw,44px);margin:8px 0 30px">Antonio <em>Nariño.</em></h2>
  <div class="timeline"><div class="timeline-row">
    <div class="timeline-item"><span class="yr">1793–94</span><h3>Traduce e imprime</h3><p>La Declaración, en secreto, en Bogotá.</p></div>
    <div class="timeline-item"><span class="yr">1794</span><h3>Descubierto y preso</h3><p>Es condenado por difundirla.</p></div>
    <div class="timeline-item"><span class="yr">1810 / 1819</span><h3>Independencia</h3><p>Estalla en 1810, se consolida en Boyacá en 1819.</p></div>
  </div></div>`,
  phone:{ type:'info', fact:'Antonio Nariño llegó a ser presidente de la Gran Colombia de forma interina, décadas después de haber estado preso por esa misma traducción.' }
},

// ========== BLOQUE 7 · SIGLO XX ==========
{
  diapo:'24', section:'07 · SIGLO XX', speaker:'EXPOSITOR A',
  title:'Rusia: del zar al Kremlin.',
  body:`<h2 class="h-display" style="font-size:clamp(28px,3.4vw,44px)">Del zar<br>al <em>Kremlin.</em></h2>
  <div class="timeline" style="margin-top:34px"><div class="timeline-row">
    <div class="timeline-item"><span class="yr">1917</span><h3>Revolución</h3><p>Termina el zarismo. Nace la URSS.</p></div>
    <div class="timeline-item"><span class="yr">1991</span><h3>Disolución</h3><p>Nace la Federación Rusa.</p></div>
    <div class="timeline-item"><span class="yr">1993 / 2020</span><h3>Constitución</h3><p>Con elecciones; en 2020 una reforma extendió la permanencia presidencial.</p></div>
  </div></div>`,
  phone:{ type:'info', fact:'La URSS llegó a ocupar una sexta parte de la superficie terrestre del planeta.' }
},
{
  diapo:'25', section:'07 · SIGLO XX', speaker:'EXPOSITOR A',
  title:'China: del emperador al Partido.',
  body:`<h2 class="h-display" style="font-size:clamp(28px,3.4vw,44px)">Del emperador<br>al <em>Partido.</em></h2>
  <div class="timeline" style="margin-top:34px"><div class="timeline-row">
    <div class="timeline-item"><span class="yr">1912</span><h3>Puyi abdica</h3><p>El último emperador, siendo un niño.</p></div>
    <div class="timeline-item"><span class="yr">1949</span><h3>República Popular</h3><p>El Partido Comunista dirige el Estado.</p></div>
    <div class="timeline-item"><span class="yr">2018</span><h3>Sin límite de mandatos</h3><p>Se elimina el límite de dos periodos presidenciales.</p></div>
  </div></div>
  <p class="quote-ed" style="font-size:clamp(18px,2vw,24px);margin-top:30px">Más de 2.000 años de emperadores<br>terminaron hace apenas <em>un poco más de cien.</em></p>`,
  phone:{ type:'info', fact:'Puyi, el último emperador de China, terminó sus días como jardinero y ciudadano común en Pekín.' }
},
{
  diapo:'26', section:'07 · SIGLO XX', speaker:'EXPOSITOR A',
  title:'1948: Declaración Universal de Derechos Humanos.',
  body:`<div class="comp">
    <div class="c5"><span class="num-mega" style="font-size:clamp(60px,8.6vw,116px)">1948</span></div>
    <div class="c6 s7 self-center">
      <p class="lede large">Dos guerras mundiales y regímenes totalitarios. La ONU responde. Por primera vez, casi todos los países aceptan que hay derechos que ningún gobierno puede quitar.</p>
      <div style="display:flex;height:6px;margin-top:20px;gap:2px">
        <div style="flex:48;background:var(--accent)"></div>
        <div style="flex:8;background:var(--faint)"></div>
      </div>
      <div style="display:flex;gap:22px;margin-top:8px">
        <span class="cap"><b style="color:var(--accent)">48</b> a favor</span>
        <span class="cap"><b style="color:var(--muted)">0</b> en contra</span>
        <span class="cap"><b style="color:var(--faint)">8</b> abstenciones</span>
      </div>
    </div>
  </div>`,
  phone:{ type:'info', fact:'La Declaración de 1948 se votó 48 a favor, 0 en contra y 8 abstenciones. Hoy es el documento más traducido del mundo.' }
},
{
  diapo:'27', section:'07 · SIGLO XX', speaker:'EXPOSITOR A',
  title:'Tres generaciones de derechos.',
  body:`<div class="comp">
    <div class="c7 tiers">
      <div class="tier"><span class="roman">I</span><h3>Libertades frente al Estado</h3><span class="ex">Siglo XVIII</span></div>
      <div class="tier"><span class="roman">II</span><h3>Condiciones dignas de vida</h3><span class="ex">Siglo XIX y XX</span></div>
      <div class="tier"><span class="roman">III</span><h3>Pueblos y colectivos</h3><span class="ex">Siglo XX y XXI</span></div>
    </div>
    <div class="c4 s9 self-center activity">
      <span class="kicker">En sus celulares</span>
      <h3>Clasificación rápida</h3>
      <p>¿A qué generación pertenece cada derecho?</p>
    </div>
  </div>`,
  phone:{ type:'vote', label:'Clasificación rápida', parts:[
    { question:'Votar', choices:['Primera','Segunda','Tercera'], correctIndex:0, explanation:'Es una libertad política frente al Estado.' },
    { question:'Educación gratuita', choices:['Primera','Segunda','Tercera'], correctIndex:1, explanation:'Es una condición para una vida digna.' },
    { question:'Ambiente sano', choices:['Primera','Segunda','Tercera'], correctIndex:2, explanation:'Es un derecho colectivo.' },
    { question:'No ser torturado', choices:['Primera','Segunda','Tercera'], correctIndex:0, explanation:'Es una libertad frente al Estado.' },
    { question:'Vivienda digna', choices:['Primera','Segunda','Tercera'], correctIndex:1, explanation:'Es una condición de vida digna.' },
    { question:'La paz', choices:['Primera','Segunda','Tercera'], correctIndex:2, explanation:'Es un derecho colectivo, de todo un pueblo.' },
  ]}
},

// ========== BLOQUE 8 · COLOMBIA ==========
{
  diapo:'28', section:'08 · COLOMBIA', speaker:'EXPOSITOR B',
  title:'Dos siglos buscando su Constitución.',
  body:`<div class="comp"><div class="c8">
    <h2 class="h-display" style="font-size:clamp(28px,3.6vw,48px)">Dos siglos buscando<br>su <em>Constitución.</em></h2>
    <p class="lede large" style="margin-top:18px">Siete voluntarios, siete años, 1811 · 1853 · 1863 · 1886 · 1910 · 1954 · 1991.<br>Ordénenlos de más antiguo a más reciente.</p>
  </div></div>`,
  phone:{ type:'info', fact:'Colombia ha tenido más de diez constituciones o grandes reformas constitucionales desde 1811.' }
},
{
  diapo:'29', section:'08 · COLOMBIA', speaker:'EXPOSITOR B',
  title:'Siglo XIX.',
  body:`<h2 class="h-display" style="font-size:clamp(28px,3.4vw,44px)">Siglo <em>XIX.</em></h2>
  <div class="timeline" style="margin-top:34px"><div class="timeline-row">
    <div class="timeline-item"><span class="yr">1811</span><h3>Cundinamarca</h3><p>Monarquía constitucional, aún reconoce a Fernando VII.</p></div>
    <div class="timeline-item"><span class="yr">1853</span><h3>Sufragio masculino</h3><p>Vélez (Santander) aprueba el voto femenino, anulado después.</p></div>
    <div class="timeline-item"><span class="yr">1863</span><h3>Rionegro</h3><p>Extremo federal, se llamó "Estados Unidos de Colombia".</p></div>
    <div class="timeline-item"><span class="yr">1886</span><h3>Centralismo</h3><p>Extremo centralista. Nos rige durante 105 años.</p></div>
  </div></div>`,
  phone:{ type:'info', fact:'En 1853, la provincia de Vélez (Santander) fue de las primeras del mundo en aprobar el voto femenino, un siglo antes de que se hiciera realidad en Colombia.' }
},
{
  diapo:'30', section:'08 · COLOMBIA', speaker:'EXPOSITOR A',
  title:'Siglo XX.',
  body:`<h2 class="h-display" style="font-size:clamp(28px,3.4vw,44px)">Siglo <em>XX.</em></h2>
  <div class="timeline" style="margin-top:34px"><div class="timeline-row">
    <div class="timeline-item"><span class="yr">1910</span><h3>Acción pública</h3><p>Cualquier ciudadano puede demandar una ley inconstitucional. Colombia, pionera.</p></div>
    <div class="timeline-item"><span class="yr">1954</span><h3>Voto femenino</h3><p>Reconocido, ejercido por primera vez en 1957.</p></div>
    <div class="timeline-item"><span class="yr">1986</span><h3>Alcaldes electos</h3><p>Elección popular (antes los nombraba el gobernador).</p></div>
  </div></div>
  <p class="cap" style="margin-top:22px">Entre medio, La Violencia, el asesinato de Gaitán (1948) y el Frente Nacional (1958 a 1974).</p>`,
  phone:{ type:'info', fact:'Colombia fue pionera mundial en 1910 al permitir que cualquier ciudadano, no solo abogados del Estado, demandara una ley por inconstitucional.' }
},
{
  diapo:'31', section:'08 · COLOMBIA', speaker:'EXPOSITOR A',
  title:'La Séptima Papeleta.',
  body:`<h2 class="h-display" style="font-size:clamp(28px,3.4vw,44px)">La Séptima<br><em>Papeleta.</em></h2>
  <p class="lede large" style="margin-top:14px;max-width:60ch">Finales de los 80. Crisis del narcotráfico, asesinatos de candidatos, desconfianza. Estudiantes universitarios proponen una salida.</p>
  <div class="flow" style="margin-top:28px">
    <div class="flow-step"><span class="n">MARZO 1990</span><h3>Una papeleta extra</h3><p>La gente pide una Asamblea Constituyente.</p></div>
    <div class="flow-arrow">→</div>
    <div class="flow-step"><span class="n">1990</span><h3>Se convoca</h3><p>No era un voto oficial, pero fue tan masivo que se tuvo en cuenta.</p></div>
    <div class="flow-arrow">→</div>
    <div class="flow-step"><span class="n">4 JULIO 1991</span><h3>Nueva Constitución</h3><p>La que nos rige hoy.</p></div>
  </div>`,
  phone:{ type:'info', fact:'La Séptima Papeleta no estaba impresa por el gobierno: los propios estudiantes la fotocopiaron y repartieron para que la gente la metiera en la urna.' }
},
{
  diapo:'32', section:'08 · COLOMBIA', speaker:'EXPOSITOR A',
  title:'Lo que cambió en 1991.',
  body:`<div class="hub">
    <div class="hub-branches left">
      <div class="hub-branch"><h3>Estado social de derecho</h3><p>Colombia se define como pluriétnica y multicultural.</p></div>
      <div class="hub-branch"><h3>Pueblos indígenas</h3><p>Jurisdicción especial, resguardos inembargables, dos curules en el Senado.</p></div>
    </div>
    <div class="hub-center"><span class="num-mega">1991</span></div>
    <div class="hub-branches">
      <div class="hub-branch"><h3>Corte Constitucional</h3><p>Y la acción de tutela, la más usada por los colombianos.</p></div>
      <div class="hub-branch"><h3>Constituyentes indígenas</h3><p>Lorenzo Muelas y Francisco Rojas Birry, elegidos.</p></div>
    </div>
  </div>`,
  phone:{ type:'info', fact:'La Asamblea Constituyente de 1991 tuvo delegados de partidos nunca antes representados, como el M-19, desmovilizado apenas un año antes.' }
},
{
  diapo:'33', section:'08 · COLOMBIA', speaker:'EXPOSITOR A y B',
  title:'¿Procede la tutela?',
  body:`<h2 class="h-display" style="font-size:clamp(28px,3.6vw,48px)">¿Procede<br>la <em>tutela?</em></h2>
  <div class="flow" style="margin-top:30px">
    <div class="flow-step"><span class="n">01</span><h3>Derecho vulnerado</h3><p>Un derecho fundamental está en riesgo.</p></div>
    <div class="flow-arrow">→</div>
    <div class="flow-step"><span class="n">02</span><h3>Sin otro mecanismo</h3><p>No hay otra vía eficaz para defenderlo.</p></div>
    <div class="flow-arrow">→</div>
    <div class="flow-step"><span class="n">03</span><h3>Un juez resuelve</h3><p>En un máximo de 10 días hábiles.</p></div>
  </div>
  <p class="cap" style="margin-top:24px">Voten en sus celulares antes de revelar cada caso.</p>`,
  phone:{ type:'info', fact:'La tutela se puede presentar sin abogado, en papel simple, y un juez debe resolverla en 10 días hábiles.' }
},
{
  diapo:'34', section:'08 · COLOMBIA', speaker:'EXPOSITOR A y B',
  title:'Caso 1, el agua y la deuda.',
  body:`<div class="comp"><div class="c8 case">
    <span class="case-num">CASO 01 · UNA DEUDA</span>
    <h3>A un adulto mayor que vive solo le suspenden el agua por una deuda que no ha podido pagar. ¿Procede?</h3>
    <div class="answer" hidden><div class="verdict"><span class="v">Sí procede</span><p>Parece un simple cobro, algo que resolvería un juez civil. Pero el mínimo vital de agua para una persona vulnerable pesa más que la deuda, y la empresa debe garantizar al menos una cantidad básica.</p></div></div>
  </div></div>`,
  phone:{ type:'vote', parts:[{ question:'A un adulto mayor que vive solo le suspenden el agua por una deuda que no ha podido pagar. ¿Procede la tutela?', choices:['Sí procede','No procede'], correctIndex:0, explanation:'El mínimo vital de agua para una persona vulnerable pesa más que la deuda pendiente.' }] }
},
{
  diapo:'35', section:'08 · COLOMBIA', speaker:'EXPOSITOR A y B',
  title:'Caso 2, el despido.',
  body:`<div class="comp"><div class="c8 case">
    <span class="case-num">CASO 02 · UN DESPIDO</span>
    <h3>Despiden a un trabajador sin justa causa y pide, por tutela, que lo devuelvan a su puesto. ¿Procede?</h3>
    <div class="answer" hidden><div class="verdict no"><span class="v">Por regla general, no</span><p>Suena urgente e injusto, pero existe la jurisdicción laboral, un mecanismo igual de eficaz para esto. La tutela solo entra si hay riesgo al mínimo vital o el trabajador tiene protección especial (por ejemplo, está embarazada).</p></div></div>
  </div></div>`,
  phone:{ type:'vote', parts:[{ question:'Despiden a un trabajador sin justa causa y pide, por tutela, que lo devuelvan a su puesto. ¿Procede la tutela?', choices:['Sí procede','No procede'], correctIndex:1, explanation:'Existe la jurisdicción laboral, un mecanismo igual de eficaz, salvo que haya riesgo al mínimo vital o protección especial.' }] }
},
{
  diapo:'36', section:'08 · COLOMBIA', speaker:'EXPOSITOR A y B',
  title:'Caso 3, la clínica privada.',
  body:`<div class="comp"><div class="c8 case">
    <span class="case-num">CASO 03 · UNA CLÍNICA</span>
    <h3>Una clínica privada se niega a atender una urgencia médica porque el paciente no puede pagar por adelantado. ¿Procede?</h3>
    <div class="answer" hidden><div class="verdict"><span class="v">Sí procede</span><p>Aunque la clínica es privada, no es el Estado, la tutela también procede contra particulares que prestan un servicio público como la salud. Una urgencia vital se atiende sin importar la capacidad de pago.</p></div></div>
  </div></div>`,
  phone:{ type:'vote', parts:[{ question:'Una clínica privada se niega a atender una urgencia médica porque el paciente no puede pagar por adelantado. ¿Procede la tutela?', choices:['Sí procede','No procede'], correctIndex:0, explanation:'La tutela también procede contra particulares que prestan un servicio público como la salud.' }] }
},

// ========== BLOQUE 9 · CIERRE ==========
{
  diapo:'37', section:'09 · CIERRE', speaker:'EXPOSITOR B',
  title:'Quiz relámpago.',
  body:`<div class="comp"><div class="c7">
    <h2 class="h-display">Quiz <em>relámpago.</em></h2>
    <p class="lede large" style="margin-top:16px">Cinco preguntas. Respondan desde sus celulares. La pantalla mostrará cuántos acertaron.</p>
  </div></div>`,
  phone:{ type:'vote', label:'Quiz relámpago', parts:[
    { question:'Un presidente elegido en las urnas manda por legitimidad de…', choices:['Tradición','Carisma','Ley'], correctIndex:2, explanation:'La legitimidad legal se apoya en normas e instituciones.' },
    { question:'¿Qué documento de 1215 dijo que el rey también está sometido a la ley?', choices:['Código de Hammurabi','Carta Magna','Declaración de 1789'], correctIndex:1, explanation:'La Carta Magna.' },
    { question:'¿Quién tradujo e imprimió en Bogotá la Declaración de los Derechos del Hombre?', choices:['Simón Bolívar','Antonio Nariño','Francisco de Paula Santander'], correctIndex:1, explanation:'Antonio Nariño, 1793–94.' },
    { question:'¿En qué año votaron las mujeres por primera vez en Colombia?', choices:['1886','1957','1991'], correctIndex:1, explanation:'Reconocido en 1954, ejercido en 1957.' },
    { question:'¿Qué movimiento estudiantil impulsó la Constitución de 1991?', choices:['La Séptima Papeleta','El Frente Nacional','Los Comuneros'], correctIndex:0, explanation:'La Séptima Papeleta, 1990.' },
  ]}
},
{
  diapo:'38', section:'09 · CIERRE', speaker:'EXPOSITOR A',
  title:'Volvemos a la pregunta.',
  body:`<h2 class="h-display" style="font-size:clamp(28px,3.6vw,48px)">Volvemos<br>a la <em>pregunta.</em></h2>
  <div class="timeline" style="margin-top:34px"><div class="timeline-row">
    <div class="timeline-item"><span class="yr">Antes</span><h3>Tradición</h3><p>Al jefe de la tribu.</p></div>
    <div class="timeline-item"><span class="yr">Después</span><h3>Religión y fuerza</h3><p>Al faraón, al emperador, a reyes y zares.</p></div>
    <div class="timeline-item"><span class="yr">Hoy</span><h3>La ley</h3><p>Con mucha lucha, aprendimos a obedecer por ley.</p></div>
  </div></div>
  <p class="quote-ed" style="font-size:clamp(20px,2.4vw,30px);margin-top:34px">Al súbdito le imponen las leyes.<br>El ciudadano <em>puede cambiarlas.</em></p>`,
  phone:{ type:'info', fact:'Recuerda tu rol en Atenas: ese mismo grupo que no podía votar es, hoy, quien sí puede. Es la mejor forma de sentir la diferencia.' }
},
{
  diapo:'39', section:'09 · CIERRE', speaker:'EXPOSITOR A y B',
  title:'¿Qué ley cambiarías?',
  body:`<p class="quote-ed" style="font-family:var(--serif);font-style:normal;font-weight:480;font-size:clamp(32px,5vw,64px);line-height:1.08;max-width:14ch">Si pudieras cambiar<br>una sola ley,<br><em>¿cuál sería?</em></p>
  <p class="cap" style="margin-top:20px">Escríbanlo en sus celulares. Va a aparecer aquí en vivo.</p>
  <div id="liveTexts" class="live-texts" style="margin-top:10px;max-width:60ch"></div>`,
  phone:{ type:'text', prompt:'Si pudieras cambiar una sola ley, ¿cuál sería?' }
},

];

module.exports = { SLIDES, ATHENS_ROLES, BLOQUE_TIMING, ROADMAP };
