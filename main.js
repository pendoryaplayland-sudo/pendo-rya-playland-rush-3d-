import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const $=id=>document.getElementById(id);
const host=$('game');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8cd9ff);
scene.fog=new THREE.Fog(0xb8ecff,30,120);

const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,180);
camera.position.set(0,5.2,9.6);
camera.lookAt(0,1.5,-12);

const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;
host.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff,0x37517b,3.2));
const sun=new THREE.DirectionalLight(0xffffff,2.4);
sun.position.set(5,10,7);
sun.castShadow=true;
scene.add(sun);

const M=(c,e=0)=>new THREE.MeshStandardMaterial({
  color:c,
  roughness:.48,
  metalness:.03,
  emissive:e?c:0,
  emissiveIntensity:e
});

const lanes=[-1.55,0,1.55];
const moving=[];
const objects=[];
const themeMoving=[];
const effects=[];

for(let i=0;i<26;i++){
  const z=-i*7;

  const floor=new THREE.Mesh(
    new THREE.BoxGeometry(10,.2,7),
    M(i%2?0xf7eadb:0xfff8ef)
  );
  floor.position.set(0,-.1,z);
  floor.receiveShadow=true;
  scene.add(floor);
  moving.push(floor);

  for(const side of [-1,1]){
    const glass=new THREE.Mesh(
      new THREE.BoxGeometry(.12,1.25,7),
      new THREE.MeshStandardMaterial({
        color:0x7fe7ff,
        transparent:true,
        opacity:.38,
        roughness:.1
      })
    );
    glass.position.set(side*4.7,.63,z);
    scene.add(glass);
    moving.push(glass);

    const shop=new THREE.Mesh(
      new THREE.BoxGeometry(.8,3.6,4.8),
      M(i%3===0?0xff4db8:(i%3===1?0x1cc8ff:0xffc92f),.18)
    );
    shop.position.set(side*5.25,1.8,z-1);
    scene.add(shop);
    moving.push(shop);
  }
}


function addPlaylandSign(label,z,y=3.35,scale=1){
  const group=new THREE.Group();

  const back=new THREE.Mesh(
    new THREE.BoxGeometry(4.6*scale,1.15*scale,.22),
    M(0xff2f9c,.18)
  );
  group.add(back);

  const inner=new THREE.Mesh(
    new THREE.BoxGeometry(4.15*scale,.78*scale,.25),
    M(0x24c8ff,.15)
  );
  inner.position.z=.13;
  group.add(inner);

  // glowing letter-like blocks to evoke PLAYLAND without texture/font dependencies
  for(let i=0;i<8;i++){
    const b=new THREE.Mesh(
      new THREE.BoxGeometry(.34*scale,.44*scale,.12),
      M(i%2===0?0xffef43:0xffffff,.08)
    );
    b.position.set((-1.55+i*.44)*scale,0,.29);
    group.add(b);
  }

  group.position.set(0,y,z);
  scene.add(group);
  themeMoving.push(group);
}

function addArcadeMachine(x,z,colorA,colorB){
  const g=new THREE.Group();

  const body=new THREE.Mesh(
    new THREE.BoxGeometry(1.05,1.85,.75),
    M(colorA,.28)
  );
  body.position.y=.93;
  g.add(body);

  const screen=new THREE.Mesh(
    new THREE.BoxGeometry(.72,.55,.08),
    M(colorB,.05)
  );
  screen.position.set(0,1.18,.415);
  g.add(screen);

  const deck=new THREE.Mesh(
    new THREE.BoxGeometry(.78,.18,.48),
    M(0xffef43,.18)
  );
  deck.position.set(0,.72,.42);
  deck.rotation.x=-.22;
  g.add(deck);

  const stick=new THREE.Mesh(
    new THREE.CylinderGeometry(.05,.05,.28,12),
    M(0xffffff,.2)
  );
  stick.position.set(-.18,.88,.57);
  g.add(stick);

  const knob=new THREE.Mesh(
    new THREE.SphereGeometry(.09,12,12),
    M(0xff4d45,.15)
  );
  knob.position.set(-.18,1.02,.57);
  g.add(knob);

  g.position.set(x,0,z);
  scene.add(g);
  themeMoving.push(g);
}

function addBalloon(x,z,color){
  const g=new THREE.Group();
  const balloon=new THREE.Mesh(
    new THREE.SphereGeometry(.28,16,16),
    M(color,.12)
  );
  balloon.scale.y=1.2;
  balloon.position.y=2.6;
  g.add(balloon);

  const string=new THREE.Mesh(
    new THREE.CylinderGeometry(.008,.008,1.5,6),
    M(0xffffff,.65)
  );
  string.position.y=1.72;
  g.add(string);

  g.position.set(x,0,z);
  scene.add(g);
  themeMoving.push(g);
}

function addStarDecor(x,z,color=0xffef43){
  const s=new THREE.Mesh(
    new THREE.OctahedronGeometry(.22),
    M(color,.16)
  );
  s.position.set(x,2.65,z);
  scene.add(s);
  themeMoving.push(s);
}

function buildPlaylandTheme(){
  // Mall -> approach -> arcade -> Playland goal
  addPlaylandSign('PLAYLAND',-38,3.5,.95);
  addPlaylandSign('PLAYLAND',-82,3.7,1.05);
  addPlaylandSign('PLAYLAND',-132,3.9,1.15);

  const arcadeZ=[-24,-32,-50,-58,-72,-92,-106,-120,-144,-160];
  arcadeZ.forEach((z,i)=>{
    addArcadeMachine(-4.15,z,i%2===0?0xff2f9c:0x24c8ff,i%2===0?0x24c8ff:0xffef43);
    addArcadeMachine( 4.15,z,i%2===0?0x24c8ff:0xff2f9c,i%2===0?0xffef43:0x24c8ff);
  });

  for(let z=-18,i=0;z>-174;z-=13,i++){
    addBalloon(-3.45,z,i%3===0?0xff2f9c:(i%3===1?0x24c8ff:0xffef43));
    addBalloon( 3.45,z,i%3===0?0x24c8ff:(i%3===1?0xffef43:0xff2f9c));
    addStarDecor(-2.65,z-4,i%2===0?0xffef43:0xffffff);
    addStarDecor( 2.65,z-7,i%2===0?0xffffff:0xffef43);
  }

  // Large final Playland portal
  const gate=new THREE.Group();

  const left=new THREE.Mesh(
    new THREE.BoxGeometry(1.1,5.2,1.0),
    M(0xff2f9c,.16)
  );
  left.position.set(-3.25,2.6,0);
  gate.add(left);

  const right=new THREE.Mesh(
    new THREE.BoxGeometry(1.1,5.2,1.0),
    M(0x24c8ff,.16)
  );
  right.position.set(3.25,2.6,0);
  gate.add(right);

  const top=new THREE.Mesh(
    new THREE.BoxGeometry(7.6,1.15,1.0),
    M(0xffef43,.14)
  );
  top.position.set(0,5.05,0);
  gate.add(top);

  const signBack=new THREE.Mesh(
    new THREE.BoxGeometry(5.4,1.05,.35),
    M(0xff2f9c,.12)
  );
  signBack.position.set(0,5.15,.65);
  gate.add(signBack);

  for(let i=0;i<8;i++){
    const b=new THREE.Mesh(
      new THREE.BoxGeometry(.4,.5,.16),
      M(i%2===0?0xffffff:0x24c8ff,.06)
    );
    b.position.set(-1.72+i*.49,5.15,.9);
    gate.add(b);
  }

  gate.position.set(0,0,-178);
  scene.add(gate);
  themeMoving.push(gate);
}

buildPlaylandTheme();

const loader=new GLTFLoader();

const GLB={
  run:'public/models/Pendo-run.glb',
  jump:'public/models/Pendo-jump.glb',
  slide:'public/models/Pendo-slide.glb'
};

let player=new THREE.Group();
let mixer=null;
let action=null;
let current='run';

player.position.z=1.7;
scene.add(player);

function normalizeModel(root){
  root.traverse(o=>{
    if(o.isMesh){
      o.castShadow=true;
      o.receiveShadow=true;
    }
  });

  const box=new THREE.Box3().setFromObject(root);
  const size=box.getSize(new THREE.Vector3());
  const h=Math.max(.001,size.y);

  // Karakteri önceki sürüme göre yaklaşık %40 küçült.
  const s=1.50/h;
  root.scale.setScalar(s);

  const box2=new THREE.Box3().setFromObject(root);
  const center=box2.getCenter(new THREE.Vector3());
  const minY=box2.min.y;

  root.position.x-=center.x;
  root.position.z-=center.z;
  root.position.y-=minY;

  // Pendo'nun sırtını kameraya döndür:
  // artık parkurun içine doğru koşuyor.
  root.rotation.y=Math.PI;
}


// --- Pendo & Rya arcade audio (Web Audio, no external sound files) ---
let audioCtx=null;
let masterGain=null;
let musicTimer=null;
let musicStep=0;

function initAudio(){
  if(audioCtx){
    if(audioCtx.state==='suspended')audioCtx.resume();
    return;
  }
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC)return;
  audioCtx=new AC();
  masterGain=audioCtx.createGain();
  masterGain.gain.value=.20;
  masterGain.connect(audioCtx.destination);
}

function tone(freq,dur=.10,type='sine',vol=.12,delay=0){
  if(!audioCtx||!masterGain)return;
  const now=audioCtx.currentTime+delay;
  const osc=audioCtx.createOscillator();
  const gain=audioCtx.createGain();
  osc.type=type;
  osc.frequency.setValueAtTime(freq,now);
  gain.gain.setValueAtTime(.0001,now);
  gain.gain.exponentialRampToValueAtTime(Math.max(.001,vol),now+.01);
  gain.gain.exponentialRampToValueAtTime(.0001,now+dur);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now+dur+.03);
}

function sfx(kind){
  initAudio();
  if(kind==='coin'){
    tone(880,.07,'square',.09);
    tone(1320,.09,'square',.07,.055);
  }else if(kind==='star'){
    tone(660,.07,'sine',.10);
    tone(990,.08,'sine',.09,.055);
    tone(1320,.10,'sine',.08,.11);
  }else if(kind==='jump'){
    tone(330,.08,'square',.07);
    tone(520,.10,'square',.07,.06);
  }else if(kind==='slide'){
    tone(220,.10,'sawtooth',.045);
    tone(150,.13,'sawtooth',.035,.05);
  }else if(kind==='hit'){
    tone(115,.18,'sawtooth',.14);
    tone(75,.20,'square',.08,.03);
  }else if(kind==='bonus'){
    [523,659,784,1047].forEach((f,i)=>tone(f,.13,'sine',.10,i*.09));
  }else if(kind==='start'){
    [392,523,659].forEach((f,i)=>tone(f,.11,'square',.07,i*.07));
  }else if(kind==='gameover'){
    [330,262,196,147].forEach((f,i)=>tone(f,.18,'triangle',.09,i*.12));
  }
}

function startMusic(){
  initAudio();
  if(musicTimer)return;
  const notes=[262,330,392,523,392,330,294,392,494,587,494,392];
  musicTimer=setInterval(()=>{
    if(!running||!audioCtx)return;
    const f=notes[musicStep++%notes.length];
    tone(f,.11,'triangle',.022);
    if(musicStep%4===0)tone(f/2,.08,'square',.012);
  },220);
}

function stopMusic(){
  if(musicTimer){
    clearInterval(musicTimer);
    musicTimer=null;
  }
}

function loadMotion(kind){
  current=kind;

  loader.load(
    GLB[kind],
    gltf=>{
      if(current!==kind)return;

      while(player.children.length){
        player.remove(player.children[0]);
      }

      mixer=null;
      action=null;

      const model=gltf.scene;
      normalizeModel(model);
      player.add(model);

      if(gltf.animations?.length){
        mixer=new THREE.AnimationMixer(model);
        action=mixer.clipAction(gltf.animations[0]);
        action.reset();

        if(kind!=='run'){
          action.setLoop(THREE.LoopOnce,1);
          action.clampWhenFinished=true;
        }

        action.play();
      }
    },
    undefined,
    e=>console.error('GLB yüklenemedi:',kind,e)
  );
}

loadMotion('run');

let running=false;
let last=0;
let score=0;
let coins=0;
let lives=3;
let best=+(localStorage.getItem('pr-v3-best')||0);
let mission=0;

let lane=0;
let targetX=0;
let vy=0;
let onGround=true;
let slideT=0;
let speed=17;
let spawn=0;
let distance=0;
let invincible=0;
let missionDone=false;


function haptic(ms=20){
  try{
    if(navigator.vibrate)navigator.vibrate(ms);
  }catch(e){}
}

function burstAt(pos,color=0xffffff,count=8){
  for(let i=0;i<count;i++){
    const p=new THREE.Mesh(
      new THREE.SphereGeometry(.055,8,8),
      M(color,.45)
    );
    p.position.copy(pos);
    p.userData.life=.45+Math.random()*.25;
    p.userData.vx=(Math.random()-.5)*3.6;
    p.userData.vy=1.8+Math.random()*2.8;
    p.userData.vz=(Math.random()-.5)*2.4;
    scene.add(p);
    effects.push(p);
  }
}

function flashPlayer(){
  player.traverse(o=>{
    if(o.isMesh&&o.material){
      const mats=Array.isArray(o.material)?o.material:[o.material];
      mats.forEach(mat=>{
        if('emissiveIntensity' in mat){
          const old=mat.emissiveIntensity||0;
          mat.emissiveIntensity=1.2;
          setTimeout(()=>{ mat.emissiveIntensity=old; },120);
        }
      });
    }
  });
}

function spawnObject(){
  const q=Math.random();
  const laneX=lanes[(Math.random()*3)|0];
  let type,obj;

  if(q<.52){
    type='coin';
    obj=new THREE.Mesh(
      new THREE.CylinderGeometry(.26,.26,.09,24),
      M(0xffc928,.35)
    );
    obj.rotation.z=Math.PI/2;
    obj.position.set(laneX,1.15,-78);
  }else if(q<.7){
    type='star';
    obj=new THREE.Mesh(
      new THREE.OctahedronGeometry(.29),
      M(0xffef43,.45)
    );
    obj.position.set(laneX,1.35,-78);
  }else if(q<.82){
    type='ramp';
    obj=new THREE.Mesh(
      new THREE.BoxGeometry(1.5,.25,2.3),
      M(0x52dc38,.2)
    );
    obj.rotation.x=-.28;
    obj.position.set(laneX,.18,-80);
  }else{
    type='barrier';
    obj=new THREE.Mesh(
      new THREE.BoxGeometry(1.45,1.35,.75),
      M(0xff4d45,.15)
    );
    obj.position.set(laneX,.67,-80);
  }

  obj.userData.type=type;
  obj.castShadow=true;
  scene.add(obj);
  objects.push(obj);
}

function updateHud(){
  $('score').textContent=Math.floor(score);
  $('coins').textContent=coins;
  $('lives').textContent=lives;
  $('best').textContent=best;
  $('missionCount').textContent=mission;
}

function reset(){
  score=0;
  coins=0;
  lives=3;
  mission=0;
  lane=0;
  targetX=0;
  vy=0;
  onGround=true;
  slideT=0;
  speed=17;
  spawn=0;
  distance=0;
  invincible=0;
  missionDone=false;

  objects.splice(0).forEach(o=>scene.remove(o));
  effects.splice(0).forEach(o=>scene.remove(o));

  player.position.set(0,0,1.7);
  loadMotion('run');
  updateHud();
}

function start(){
  reset();

  $('menu').classList.add('hidden');
  $('gameover').classList.add('hidden');
  $('hud').classList.remove('hidden');
  $('mission').classList.remove('hidden');
  $('controls').classList.remove('hidden');

  running=true;
  initAudio();
  sfx('start');
  startMusic();
  last=performance.now();
  requestAnimationFrame(loop);
}

function end(){
  running=false;
  stopMusic();
  sfx('gameover');

  best=Math.max(best,Math.floor(score));
  localStorage.setItem('pr-v3-best',best);

  $('finalScore').textContent=Math.floor(score);
  $('hud').classList.add('hidden');
  $('mission').classList.add('hidden');
  $('controls').classList.add('hidden');
  $('gameover').classList.remove('hidden');

  updateHud();
}

function move(d){
  lane=Math.max(-1,Math.min(1,lane+d));
  targetX=lanes[lane+1];
}

function jump(){
  if(onGround&&slideT<=0){
    vy=8.4;
    onGround=false;
    loadMotion('jump');
    sfx('jump');
  }
}

function slide(){
  if(onGround&&slideT<=0){
    slideT=.7;
    loadMotion('slide');
    sfx('slide');
  }
}

function coll(o){
  if(invincible>0&&o.userData.type==='barrier')return false;
  return (
    Math.abs(player.position.x-o.position.x)<.82 &&
    Math.abs(player.position.y-o.position.y)<1.1 &&
    Math.abs(player.position.z-o.position.z)<.95
  );
}

$('pickPendo').onclick=()=>{
  $('pickPendo').classList.add('selected');
  $('pickRya').classList.remove('selected');
};

$('pickRya').onclick=()=>{
  $('pickRya').classList.add('selected');
  $('pickPendo').classList.remove('selected');
};

$('start').onclick=start;
$('restart').onclick=start;

$('left').onpointerdown=e=>{
  e.preventDefault();
  move(-1);
};

$('right').onpointerdown=e=>{
  e.preventDefault();
  move(1);
};

$('jump').onpointerdown=e=>{
  e.preventDefault();
  jump();
};

$('slide').onpointerdown=e=>{
  e.preventDefault();
  slide();
};

let sx=0,sy=0;

addEventListener('touchstart',e=>{
  const t=e.changedTouches[0];
  sx=t.clientX;
  sy=t.clientY;
},{passive:true});

addEventListener('touchend',e=>{
  const t=e.changedTouches[0];
  const dx=t.clientX-sx;
  const dy=t.clientY-sy;

  if(Math.max(Math.abs(dx),Math.abs(dy))<35)return;

  if(Math.abs(dx)>Math.abs(dy)){
    move(dx>0?1:-1);
  }else{
    dy<0?jump():slide();
  }
},{passive:true});

function loop(t){
  if(!running)return;

  const dt=Math.min(.033,(t-last)/1000);
  last=t;

  if(mixer)mixer.update(dt);

  if(invincible>0){
    invincible=Math.max(0,invincible-dt);
    player.visible=(Math.floor(invincible*12)%2)===0;
    if(invincible===0)player.visible=true;
  }else{
    player.visible=true;
  }

  distance+=speed*dt;
  speed=Math.min(31,17+distance/250);
  score+=dt*speed;

  spawn-=dt;

  if(spawn<=0){
    spawnObject();
    spawn=.58+Math.random()*.40;
  }

  player.position.x+=(targetX-player.position.x)*Math.min(1,dt*12);

  vy-=19*dt;
  player.position.y+=vy*dt;

  if(player.position.y<=0){
    player.position.y=0;
    vy=0;

    if(!onGround){
      onGround=true;
      if(slideT<=0)loadMotion('run');
    }
  }

  if(slideT>0){
    slideT-=dt;
    if(slideT<=0)loadMotion('run');
  }

  for(const m of moving){
    m.position.z+=speed*dt;
    if(m.position.z>9)m.position.z-=182;
  }

  for(const m of themeMoving){
    m.position.z+=speed*dt;
    if(m.position.z>12)m.position.z-=196;
    if(m.rotation)m.rotation.y+=0.0008*dt;
  }

  for(let i=objects.length-1;i>=0;i--){
    const o=objects[i];

    o.position.z+=speed*dt;

    if(o.userData.type==='coin'||o.userData.type==='star'){
      o.rotation.y+=dt*4.5;
      o.position.y+=Math.sin(t*.006+o.position.z)*dt*.12;
    }

    if(coll(o)){
      if(o.userData.type==='coin'){
        coins++;
        score+=10;
        sfx('coin');
        burstAt(o.position,0xffc928,7);
        haptic(12);
      }else if(o.userData.type==='star'){
        if(!missionDone){
          mission=Math.min(25,mission+1);
          sfx('star');
          if(mission>=25){
            missionDone=true;
            score+=250;
            sfx('bonus');
            burstAt(o.position,0xffef43,22);
            haptic(45);
          }else{
            score+=25;
            burstAt(o.position,0xffef43,10);
            haptic(15);
          }
        }else{
          score+=25;
          burstAt(o.position,0xffef43,8);
        }
      }else if(o.userData.type==='ramp'){
        vy=10.2;
        onGround=false;
        loadMotion('jump');
        score+=20;
        burstAt(o.position,0x52dc38,8);
        haptic(18);
      }else{
        lives--;
        sfx('hit');
        invincible=1.05;
        vy=4.2;
        flashPlayer();
        burstAt(o.position,0xff4d45,14);
        haptic(55);

        if(lives<=0){
          scene.remove(o);
          objects.splice(i,1);
          end();
          return;
        }
      }

      scene.remove(o);
      objects.splice(i,1);
    }else if(o.position.z>10){
      scene.remove(o);
      objects.splice(i,1);
    }
  }

  for(let i=effects.length-1;i>=0;i--){
    const p=effects[i];
    p.userData.life-=dt;
    p.position.x+=p.userData.vx*dt;
    p.position.y+=p.userData.vy*dt;
    p.position.z+=p.userData.vz*dt;
    p.userData.vy-=7.5*dt;
    p.scale.multiplyScalar(.97);

    if(p.userData.life<=0){
      scene.remove(p);
      effects.splice(i,1);
    }
  }

  updateHud();
  renderer.render(scene,camera);
  requestAnimationFrame(loop);
}

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

updateHud();
renderer.render(scene,camera);
