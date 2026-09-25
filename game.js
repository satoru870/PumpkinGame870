const canvas = document.getElementById('game-canvas');
const frame = document.getElementById('game-frame');
const context = canvas.getContext('2d');
const state = { score: 0, combo: 0, ghostSlices: 0, realSlices: 0, coins: 240, stars: 12, time: 30, bossCooldown: 8, crystal: 6, ice: 3, wood: 8, built: false, materialIndex: 0, pointer: null, trail: [], objects: [], particles: [], lastFrame: 0, running: true };
const materials = [
  { name: 'Pumpkin Ghost', label: 'おばけパンプキン', color: '#f58a4d', edge: '#703650', accent: '#fff29d', resource: 'crystal', value: 40, shape: 'cloud', image: 'assets/pumpkin-ghost.svg' },
  { name: 'Witch Pumpkin', label: '魔女パンプキン', color: '#a978e0', edge: '#593661', accent: '#ffe9a0', resource: 'ice', value: 44, shape: 'crystal', image: 'assets/witch-pumpkin.svg' },
  { name: 'Bat Pumpkin', label: 'コウモリパンプキン', color: '#b84961', edge: '#63334f', accent: '#fff1a2', resource: 'wood', value: 46, shape: 'cloud', image: 'assets/bat-pumpkin.svg' },
  { name: 'Candy Pumpkin', label: 'キャンディパンプキン', color: '#ed779d', edge: '#7b3b61', accent: '#fffbe5', resource: 'crystal', value: 38, shape: 'cloud', image: 'assets/candy-pumpkin.svg' },
  { name: 'Moon Pumpkin', label: '月夜パンプキン', color: '#f2b466', edge: '#70415a', accent: '#fff5bd', resource: 'ice', value: 50, shape: 'crystal', image: 'assets/moon-pumpkin.svg' },
  { name: 'Lantern Pumpkin', label: 'ランタンパンプキン', color: '#f58a4d', edge: '#733950', accent: '#fff0a0', resource: 'wood', value: 56, shape: 'cloud', image: 'assets/lantern-pumpkin.svg' }
];
const forbiddenMaterial = { name: 'Real Pumpkin', label: '本物のパンプキン', color: '#d44e63', edge: '#652b50', accent: '#ffb0a3', value: 0, shape: 'forbidden', forbidden: true, image: 'assets/real-pumpkin.svg' };
const $ = id => document.getElementById(id);
materials.forEach(material => { material.loadedImage = new Image(); material.loadedImage.src = material.image; });
forbiddenMaterial.loadedImage = new Image(); forbiddenMaterial.loadedImage.src = forbiddenMaterial.image;

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const bounds = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(bounds.width * ratio));
  canvas.height = Math.max(1, Math.floor(bounds.height * ratio));
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}
function spawnObject() {
  const bounds = canvas.getBoundingClientRect();
  const material = Math.random() < .12 ? forbiddenMaterial : materials[state.materialIndex];
  const size = 48 + Math.random() * 22;
  state.objects.push({ x: bounds.width * (.07 + Math.random() * .86), y: bounds.height + size, size, vx: (Math.random() - .5) * 3.6, vy: -(8.5 + Math.random() * 3.5), rotation: Math.random() * 6, spin: (Math.random() - .5) * .11, material, sliced: false, id: Math.random() });
}
function spawnBoss() {
  const bounds = canvas.getBoundingClientRect();
  const material = materials[state.materialIndex];
  const size = Math.min(104, Math.max(78, bounds.width * .23));
  state.objects.push({ x: bounds.width * (.25 + Math.random() * .5), y: bounds.height + size, size, vx: (Math.random() - .5) * 1.5, vy: -5.2, rotation: 0, spin: .025, material, sliced: false, boss: true, hits: 0, maxHits: 5, id: Math.random() });
  showMessage('BIG PUMPKIN!', false);
}
function drawObject(item) {
  context.save();
  context.translate(item.x, item.y);
  context.rotate(item.rotation);
  const s = item.size;
  context.shadowColor = 'rgba(9, 25, 42, .34)'; context.shadowBlur = 16; context.shadowOffsetY = 9;
  if (item.material.loadedImage && item.material.loadedImage.complete) { context.drawImage(item.material.loadedImage, -s, -s, s * 2, s * 2); if (item.boss) drawBossMeter(item); context.restore(); return; }
  context.fillStyle = item.material.color; context.strokeStyle = item.material.edge; context.lineWidth = 2.4;
  context.beginPath();
  if (item.material.shape === 'cloud') {
    context.moveTo(-s*.7, s*.38); context.bezierCurveTo(-s*.9, -s*.2, -s*.5, -s*.72, -s*.12, -s*.48); context.bezierCurveTo(s*.1, -s*.9, s*.7, -s*.62, s*.58, -.1*s); context.bezierCurveTo(s*.95, .1*s, s*.72, s*.7, s*.25, s*.53); context.bezierCurveTo(-s*.12, s*.84, -s*.58, s*.75, -s*.7, s*.38); context.closePath();
  } else if (item.material.shape === 'wood') {
    context.roundRect(-s*.72, -s*.62, s*1.44, s*1.24, 8);
  } else {
    context.moveTo(0, -s); context.lineTo(s*.7, -s*.32); context.lineTo(s*.58, s*.54); context.lineTo(0, s*.82); context.lineTo(-s*.58, s*.54); context.lineTo(-s*.7, -s*.32); context.closePath();
  }
  context.fill(); context.stroke(); context.shadowColor = 'transparent';
  context.globalAlpha = .28; context.fillStyle = item.material.accent; context.beginPath(); context.ellipse(-s*.25, -s*.28, s*.16, s*.3, -.5, 0, Math.PI*2); context.fill(); context.globalAlpha = 1;
  context.strokeStyle = 'rgba(30, 35, 58, .8)'; context.fillStyle = '#fff9e8'; context.lineWidth = 2;
  context.beginPath(); context.ellipse(-s*.25, -s*.03, s*.12, s*.16, 0, 0, Math.PI*2); context.ellipse(s*.25, -s*.03, s*.12, s*.16, 0, 0, Math.PI*2); context.fill(); context.stroke();
  context.fillStyle = '#263249'; context.beginPath(); context.arc(-s*.22, -.02*s, s*.05, 0, Math.PI*2); context.arc(s*.28, -.02*s, s*.05, 0, Math.PI*2); context.fill();
  if (item.material.shape === 'forbidden') { context.fillStyle='#ffdf86'; context.strokeStyle='#672c55'; context.lineWidth=3; context.beginPath(); context.arc(0,0,s*.52,0,Math.PI*2); context.fill(); context.stroke(); context.strokeStyle='#cb405c'; context.lineWidth=5; context.beginPath(); context.moveTo(-s*.32,-s*.32); context.lineTo(s*.32,s*.32); context.moveTo(s*.32,-s*.32); context.lineTo(-s*.32,s*.32); context.stroke(); context.fillStyle='#652b50'; context.font=`700 ${Math.max(9,s*.32)}px Space Grotesk`; context.textAlign='center'; context.fillText('NO',0,s*.9); }
  if (item.material.shape === 'wood') { context.strokeStyle = item.material.accent; context.lineWidth = 2; context.beginPath(); context.moveTo(-s*.42,-s*.52); context.lineTo(-s*.18,-s*.78); context.lineTo(0,-s*.5); context.lineTo(s*.18,-s*.78); context.lineTo(s*.42,-s*.52); context.stroke(); context.fillStyle='#f2c76a'; context.fillRect(-s*.3,s*.25,s*.6,s*.08); }
  if (item.material.shape === 'crystal') { context.strokeStyle = item.material.accent; context.lineWidth = 3; context.beginPath(); context.moveTo(-s*.48,-s*.38); context.lineTo(-s*.72,-s*.8); context.moveTo(s*.48,-s*.38); context.lineTo(s*.72,-s*.8); context.stroke(); }
  if (item.material.shape === 'cloud') { context.fillStyle = '#f58c9c'; context.beginPath(); context.arc(-s*.12,s*.2,s*.07,0,Math.PI*2); context.arc(s*.12,s*.2,s*.07,0,Math.PI*2); context.fill(); }
  context.restore();
}
function drawBossMeter(item) { const width=item.size*1.7; const left=-width/2; context.fillStyle='rgba(20,10,35,.8)'; context.fillRect(left,-item.size-18,width,8); context.fillStyle='#ffb24d'; context.fillRect(left,-item.size-18,width*(1-item.hits/item.maxHits),8); context.strokeStyle='#fff0a8'; context.lineWidth=2; context.strokeRect(left,-item.size-18,width,8); context.fillStyle='#fff0a8'; context.font=`700 ${Math.max(10,item.size*.18)}px Space Grotesk`; context.textAlign='center'; context.fillText(`BIG PUMPKIN  ${item.hits}/${item.maxHits}`,0,-item.size-26); }
function drawBackground() {
  const bounds = canvas.getBoundingClientRect();
  const gradient = context.createLinearGradient(0, 0, bounds.width, bounds.height);
  gradient.addColorStop(0, '#110f31'); gradient.addColorStop(.46, '#32184d'); gradient.addColorStop(1, '#090d25');
  context.fillStyle = gradient; context.fillRect(0, 0, bounds.width, bounds.height);
  context.fillStyle = 'rgba(255,226,142,.75)'; context.beginPath(); context.arc(bounds.width*.78, bounds.height*.17, 34, 0, Math.PI*2); context.fill(); context.fillStyle='#110f31'; context.beginPath(); context.arc(bounds.width*.81,bounds.height*.14,34,0,Math.PI*2); context.fill();
  context.fillStyle='#f8d98e'; for (let i=0;i<30;i++) { const x=(i*83+37)%bounds.width; const y=(i*47+29)%(bounds.height*.58); const r=i%3===0?2:1; context.globalAlpha=.45+(i%4)*.1; context.beginPath(); context.arc(x,y,r,0,Math.PI*2); context.fill(); } context.globalAlpha=1;
  context.fillStyle = '#17152f'; context.beginPath(); context.moveTo(0,bounds.height*.64); context.lineTo(bounds.width*.18,bounds.height*.48); context.lineTo(bounds.width*.34,bounds.height*.64); context.lineTo(bounds.width*.53,bounds.height*.42); context.lineTo(bounds.width*.73,bounds.height*.64); context.lineTo(bounds.width*.9,bounds.height*.5); context.lineTo(bounds.width,bounds.height*.64); context.lineTo(bounds.width,bounds.height); context.lineTo(0,bounds.height); context.closePath(); context.fill();
  context.fillStyle='#0a0c20'; context.fillRect(bounds.width*.08,bounds.height*.5,bounds.width*.22,bounds.height*.15); context.fillRect(bounds.width*.12,bounds.height*.44,bounds.width*.14,bounds.height*.06); context.fillStyle='#ff9a4b'; context.fillRect(bounds.width*.14,bounds.height*.52,7,10); context.fillRect(bounds.width*.22,bounds.height*.52,7,10); context.fillStyle='#f58a4d'; context.beginPath(); context.arc(bounds.width*.1,bounds.height*.73,16,0,Math.PI*2); context.arc(bounds.width*.16,bounds.height*.73,16,0,Math.PI*2); context.fill();
  context.fillStyle = '#090d25'; context.fillRect(0,bounds.height*.82,bounds.width,bounds.height*.18); context.fillStyle='rgba(255,133,77,.28)'; context.fillRect(0,bounds.height*.82,bounds.width,3);
  context.fillStyle='rgba(245,139,77,.25)'; for(let i=0;i<4;i++){context.beginPath();context.ellipse(bounds.width*(.15+i*.25),bounds.height*.87,70,15,0,0,Math.PI*2);context.fill();}
}
function drawTrail() {
  if (state.trail.length < 2) return;
  context.save(); context.lineCap = 'round'; context.lineJoin = 'round';
  context.beginPath(); context.moveTo(state.trail[0].x, state.trail[0].y);
  state.trail.slice(1).forEach(point => context.lineTo(point.x, point.y));
  context.strokeStyle = 'rgba(255, 248, 210, .9)'; context.lineWidth = 3; context.shadowColor = '#f6bc52'; context.shadowBlur = 13; context.stroke(); context.restore();
}
function update(timestamp) {
  const delta = Math.min((timestamp - state.lastFrame) / 16.67 || 1, 2); state.lastFrame = timestamp;
  if (state.running) {
    const bounds = canvas.getBoundingClientRect();
    state.bossCooldown -= delta / 60;
    if (state.bossCooldown <= 0 && !state.objects.some(item => item.boss)) { spawnBoss(); state.bossCooldown = 18; }
    state.objects.forEach(item => { item.x += item.vx * delta; item.y += item.vy * delta; item.vy += .13 * delta; item.rotation += item.spin * delta; });
    state.objects = state.objects.filter(item => item.y < bounds.height + 80 && !item.remove);
    state.particles.forEach(p => { p.x += p.vx * delta; p.y += p.vy * delta; p.vy += .08 * delta; p.life -= .025 * delta; });
    state.particles = state.particles.filter(p => p.life > 0);
    if (state.objects.length < 6 && Math.random() < .055 * delta) spawnObject();
    state.trail = state.trail.filter(point => point.life-- > 0);
  }
  context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight); drawBackground();
  state.objects.forEach(drawObject); state.particles.forEach(drawParticle); drawTrail();
  requestAnimationFrame(update);
}
function drawParticle(p) { context.save(); context.globalAlpha = Math.max(0,p.life); context.fillStyle=p.color; context.beginPath(); context.arc(p.x,p.y,p.size,0,Math.PI*2); context.fill(); context.restore(); }
function position(event) { const rect = canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; }
function lineHits(item, from, to) { const dx=to.x-from.x, dy=to.y-from.y; const length=Math.hypot(dx,dy) || 1; const t=Math.max(0,Math.min(1,((item.x-from.x)*dx+(item.y-from.y)*dy)/(length*length))); return Math.hypot(item.x-(from.x+t*dx),item.y-(from.y+t*dy)) < item.size * 1.08; }
function sliceAt(from, to) {
  const hit = state.objects.find(item => !item.sliced && lineHits(item, from, to));
  if (!hit) return;
  if (hit.material.forbidden) { hit.sliced = true; hit.remove = true; state.realSlices++; state.combo = 0; state.coins = Math.max(0, state.coins - 20); createBurst(hit); createDangerBurst(hit); updateUi(); showMessage('BOOM! WRONG SLICE', true); return; }
  if (hit.boss) { hit.hits++; state.combo++; state.score += 25 + state.combo * 5; createBurst(hit); updateUi(); if (hit.hits >= hit.maxHits) { hit.remove = true; state.coins += 180; state.stars += 3; createDangerBurst(hit); showMessage('BOSS CLEARED!', false); } else { showMessage(`HIT ${hit.hits} / ${hit.maxHits}`, false); } return; }
  hit.sliced = true; hit.remove = true; state.ghostSlices++; state.combo++; state.score += hit.material.value + state.combo * 5; state.coins += hit.material.value;
  state[hit.material.resource]++; createBurst(hit); updateUi(); showMessage(state.combo > 1 ? `${state.combo} COMBO` : 'CLEAN CUT');
  if (state.combo >= 3) { state.starCount = (state.starCount || 0) + 1; state.stars++; }
}
function createBurst(item) { for (let i=0; i<12; i++) state.particles.push({ x:item.x,y:item.y,vx:(Math.random()-.5)*7,vy:(Math.random()-.8)*7,size:2+Math.random()*4,life:1,color:item.material.accent }); }
function createDangerBurst(item) { for (let i=0; i<34; i++) state.particles.push({ x:item.x,y:item.y,vx:(Math.random()-.5)*15,vy:(Math.random()-.8)*15,size:3+Math.random()*7,life:1.5,color:i%2?'#ff5e67':'#ffd36b' }); }
function showMessage(message, danger=false) { const node=$('round-message'); node.textContent=message; node.classList.toggle('danger-message', danger); node.classList.remove('show'); void node.offsetWidth; node.classList.add('show'); if (danger) { frame.classList.remove('danger-flash'); void frame.offsetWidth; frame.classList.add('danger-flash'); setTimeout(() => frame.classList.remove('danger-flash'), 650); } }
function updateCompanion() { const level=Math.min(3,1+Math.floor(state.score/300)); const progress=Math.min(100,(state.score%300)/3); const hero=$('hero-character'); hero.className=`hero-character level-${level}`; $('hero-level').textContent=String(level).padStart(2,'0'); $('hero-xp').style.width=`${progress}%`; $('hero-xp-label').textContent=`${state.score%300} / 300`; $('hero-title').textContent=level===3?'森を救う伝説の勇者':level===2?'一閃を覚えた冒険者':'森を守る見習い勇者'; $('character-card').dataset.level=level; }
function updateUi() { $('coin-count').textContent=state.coins; $('star-count').textContent=state.stars; $('ghost-count').textContent=state.ghostSlices; $('real-count').textContent=state.realSlices; $('combo-display').querySelector('strong').textContent=state.combo; $('mission-progress-label').textContent=`${Math.min(state.combo,3)} / 3`; $('mission-progress').style.width=`${Math.min(state.combo/3*100,100)}%`; updateCompanion(); }
function nextCommission() { state.materialIndex=(state.materialIndex+1)%materials.length; state.combo=0; state.time=30; const material=materials[state.materialIndex]; const missions=['おばけパンプキンを集めよう。','魔女パンプキンを追いかけよう。','コウモリパンプキンを狙え。','キャンディパンプキンを連続スラッシュ。','月夜パンプキンを切り開こう。','ランタンパンプキンで夜を照らせ。']; const guides=['おばけだけを狙って、楽しくスラッシュしよう。','魔女の帽子が目印。色をよく見てね。','羽が見えたら素早くスワイプ。','甘そうでも、本物のパンプキンには要注意。','月の光をまとったおばけは高得点だよ。','連続スラッシュでハロウィンの夜を盛り上げよう。']; $('stage-title').textContent=material.name; $('mission-text').textContent=missions[state.materialIndex]; $('mission-detail').textContent=`${material.label}を3体、正確にスラッシュ`; $('ai-message').textContent=guides[state.materialIndex]; $('stage-hint').style.opacity='1'; for(let i=0;i<6;i++) spawnObject(); }
function resetGame() { state.score=0; state.combo=0; state.ghostSlices=0; state.realSlices=0; state.coins=240; state.stars=12; state.time=30; state.bossCooldown=12; state.crystal=6; state.ice=3; state.wood=8; state.materialIndex=0; state.objects=[]; $('stage-title').textContent=materials[0].name; updateUi(); for(let i=0;i<5;i++) spawnObject(); }
canvas.addEventListener('pointerdown', event => { state.pointer=position(event); state.combo=Math.max(0,state.combo); $('stage-hint').style.opacity='0'; canvas.setPointerCapture(event.pointerId); sliceAt(state.pointer,state.pointer); });
canvas.addEventListener('pointermove', event => { if (!state.pointer) return; const next=position(event); sliceAt(state.pointer,next); state.trail.push({...next,life:9}); state.pointer=next; });
canvas.addEventListener('pointerup', () => { state.pointer=null; setTimeout(()=>{ if(!state.pointer) state.trail=[]; },120); });
canvas.addEventListener('pointercancel', () => { state.pointer=null; state.trail=[]; });
$('next-button').addEventListener('click', nextCommission); $('reset-button').addEventListener('click', resetGame);
$('build-button').addEventListener('click', () => { if(state.coins < 180 || state.built) return; state.coins-=180; state.built=true; $('build-button').textContent='加入した'; $('build-button').disabled=true; $('build-cost').textContent='森の魔法使いが仲間になった'; $('next-build').textContent='森の魔法使い 加入済み'; const card=document.querySelector('.character-card'); card.classList.add('party-upgraded'); const mageSlot=document.querySelectorAll('.party-slot')[1]; mageSlot.classList.add('joined'); mageSlot.querySelector('b').textContent='ルナ'; mageSlot.querySelector('small').textContent='魔法使い'; updateUi(); });
window.addEventListener('resize', resizeCanvas); resizeCanvas(); resetGame(); requestAnimationFrame(update);
setInterval(() => { if(!state.running) return; state.time--; $('time-left').textContent=String(Math.max(0,state.time)).padStart(2,'0'); if(state.time<=0){ state.time=30; state.combo=0; showMessage('NEW BRIEF'); nextCommission(); } },1000);
