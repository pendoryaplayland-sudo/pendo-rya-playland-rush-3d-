
(()=>{
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
sun.position.set(5,10,7); sun.castShadow=true; scene.add(sun);

const M=(c,e=0)=>new THREE.MeshStandardMaterial({color:c,roughness:.48,metalness:.03,emissive:e?c:0,emissiveIntensity:e});
const lanes=[-2.45,0,2.45];

const moving=[];
for(let i=0;i<26;i++){
  const z=-i*7;
  const floor=new THREE.Mesh(new THREE.BoxGeometry(10,.2,7),M(i%2?0xf7eadb:0xfff8ef));
  floor.position.set(0,-.1,z); floor.receiveShadow=true; scene.add(floor); moving.push(floor);

  for(const side of [-1,1]){
    const glass=new THREE.Mesh(new THREE.BoxGeometry(.12,1.25,7),new THREE.MeshStandardMaterial({color:0x7fe7ff,transparent:true,opacity:.38,roughness:.1}));
    glass.position.set(side*4.7,.63,z); scene.add(glass); moving.push(glass);

    const shop=new THREE.Mesh(new THREE.BoxGeometry(.8,3.6,4.8),M(i%3===0?0xff4db8:(i%3===1?0x1cc8ff:0xffc92f),.18));
    shop.position.set(side*5.25,1.8,z-1); scene.add(shop); moving.push(shop);
  }

  if(i%4===0){
    for(const x of [-3.7,3.7]){
      const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.11,.16,2.1,8),M(0x9a6438));
      trunk.position.set(x,1.05,z-2.4); scene.add(trunk); moving.push(trunk);
      const crown=new THREE.Mesh(new THREE.SphereGeometry(.7,12,8),M(0x2fc76b));
      crown.scale.set(1.5,.7,1.1); crown.position.set(x,2.35,z-2.4); scene.add(crown); moving.push(crown);
    }
  }
}

function makeRunner(who){
  // Temporary stylized rig placeholder. Designed so a future GLB can replace this group 1:1.
  const P=who==='pendo', g=new THREE.Group(), skin=M(0xffd2b2), main=M(P?0x087cff:0xff4db8), dark=M(P?0x0a3e9f:0xa35cff), hair=M(P?0x0876d8:0xff2f9c);
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.72,6,14),main); torso.position.y=1.25; torso.castShadow=true; g.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.56,24,18),skin); head.position.y=2.18; head.castShadow=true; g.add(head);
  if(P){
    const haircap=new THREE.Mesh(new THREE.SphereGeometry(.58,20,12,0,Math.PI*2,0,Math.PI*.55),hair); haircap.position.y=2.37; g.add(haircap);
    const cap=new THREE.Mesh(new THREE.CylinderGeometry(.44,.52,.17,20),M(0xffffff)); cap.position.y=2.67; g.add(cap);
    const brim=new THREE.Mesh(new THREE.BoxGeometry(.62,.07,.32),main); brim.position.set(0,2.61,.44); g.add(brim);
  }else{
    const crown=new THREE.Mesh(new THREE.SphereGeometry(.58,20,14),hair); crown.scale.set(1,.72,.9); crown.position.y=2.43; g.add(crown);
    for(const sx of [-1,1]){
      const pony=new THREE.Mesh(new THREE.SphereGeometry(.34,16,12),hair); pony.scale.set(.78,1.3,.78); pony.position.set(.65*sx,2.38,0); g.add(pony);
      const star=new THREE.Mesh(new THREE.OctahedronGeometry(.1),M(0xffd83d)); star.position.set(.4*sx,2.67,.3); g.add(star);
    }
    const skirt=new THREE.Mesh(new THREE.CylinderGeometry(.62,.78,.34,20),dark); skirt.position.y=.9; g.add(skirt);
  }
  for(const ex of [-.19,.19]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8),M(0x111111)); eye.position.set(ex,2.2,.52); g.add(eye)}
  const arms=[],legs=[];
  for(const sx of [-1,1]){
    const a=new THREE.Group(); a.position.set(.46*sx,1.5,0); const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.10,.48,4,8),skin); arm.position.y=-.3; a.add(arm); g.add(a); arms.push(a);
    const l=new THREE.Group(); l.position.set(.2*sx,.78,0); const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.52,4,8),P?dark:skin); leg.position.y=-.38; l.add(leg);
    const shoe=new THREE.Mesh(new THREE.BoxGeometry(.36,.18,.58),main); shoe.position.set(0,-.7,.14); l.add(shoe); g.add(l); legs.push(l);
  }
  g.userData={arms,legs};
  g.position.z=1.7; g.scale.setScalar(.92);
  return g;
}

let hero='pendo', player=makeRunner(hero); scene.add(player);
let running=false,last=0,score=0,coins=0,lives=3,best=+(localStorage.getItem('pr-v3-best')||0),mission=0;
let lane=0,targetX=0,vy=0,onGround=true,slideT=0,speed=17,spawn=0,distance=0;
const objects=[];

function swapHero(){
  scene.remove(player);
  player=makeRunner(hero);
  scene.add(player);
  player.position.x=targetX;
}

function spawnObject(){
  const q=Math.random();
  const laneX=lanes[(Math.random()*3)|0];
  let type,obj;
  if(q<.52){
    type='coin'; obj=new THREE.Mesh(new THREE.CylinderGeometry(.26,.26,.09,24),M(0xffc928,0.35)); obj.rotation.z=Math.PI/2; obj.position.set(laneX,1.15,-78);
  }else if(q<.7){
    type='star'; obj=new THREE.Mesh(new THREE.OctahedronGeometry(.29),M(0xffef43,.45)); obj.position.set(laneX,1.35,-78);
  }else if(q<.82){
    type='ramp'; obj=new THREE.Mesh(new THREE.BoxGeometry(1.5,.25,2.3),M(0x52dc38,.2)); obj.rotation.x=-.28; obj.position.set(laneX,.18,-80);
  }else{
    type='barrier'; obj=new THREE.Mesh(new THREE.BoxGeometry(1.45,1.35,.75),M(0xff4d45,.15)); obj.position.set(laneX,.67,-80);
  }
  obj.userData.type=type; obj.castShadow=true; scene.add(obj); objects.push(obj);
}

function updateHud(){
  $('score').textContent=Math.floor(score);
  $('coins').textContent=coins;
  $('lives').textContent=lives;
  $('best').textContent=best;
  $('missionCount').textContent=mission;
}

function reset(){
  score=0;coins=0;lives=3;mission=0;lane=0;targetX=0;vy=0;onGround=true;slideT=0;speed=17;spawn=0;distance=0;
  objects.splice(0).forEach(o=>scene.remove(o));
  player.position.set(0,0,1.7);
  player.scale.setScalar(.92);
  updateHud();
}

function start(){
  reset();
  $('menu').classList.add('hidden');
  $('gameover').classList.add('hidden');
  $('hud').classList.remove('hidden');
  $('mission').classList.remove('hidden');
  $('controls').classList.remove('hidden');
  running=true; last=performance.now(); requestAnimationFrame(loop);
}

function end(){
  running=false;
  best=Math.max(best,Math.floor(score)); localStorage.setItem('pr-v3-best',best);
  $('finalScore').textContent=Math.floor(score);
  $('hud').classList.add('hidden'); $('mission').classList.add('hidden'); $('controls').classList.add('hidden');
  $('gameover').classList.remove('hidden'); updateHud();
}

function move(d){lane=Math.max(-1,Math.min(1,lane+d)); targetX=lanes[lane+1]}
function jump(){if(onGround&&slideT<=0){vy=8.4;onGround=false}}
function slide(){if(onGround){slideT=.7;player.scale.y=.55}}
function coll(o){return Math.abs(player.position.x-o.position.x)<.82&&Math.abs(player.position.y-o.position.y)<1.1&&Math.abs(player.position.z-o.position.z)<.95}

$('pickPendo').onclick=()=>{hero='pendo';$('pickPendo').classList.add('selected');$('pickRya').classList.remove('selected');swapHero()};
$('pickRya').onclick=()=>{hero='rya';$('pickRya').classList.add('selected');$('pickPendo').classList.remove('selected');swapHero()};
$('start').onclick=start; $('restart').onclick=start;
$('left').onpointerdown=e=>{e.preventDefault();move(-1)};
$('right').onpointerdown=e=>{e.preventDefault();move(1)};
$('jump').onpointerdown=e=>{e.preventDefault();jump()};
$('slide').onpointerdown=e=>{e.preventDefault();slide()};

let sx=0,sy=0;
addEventListener('touchstart',e=>{const t=e.changedTouches[0];sx=t.clientX;sy=t.clientY},{passive:true});
addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<35)return;if(Math.abs(dx)>Math.abs(dy))move(dx>0?1:-1);else dy<0?jump():slide()},{passive:true});

function loop(t){
  if(!running)return;
  const dt=Math.min(.033,(t-last)/1000); last=t;
  distance+=speed*dt; speed=Math.min(31,17+distance/250); score+=dt*speed;
  spawn-=dt; if(spawn<=0){spawnObject();spawn=.46+Math.random()*.36}

  player.position.x+=(targetX-player.position.x)*Math.min(1,dt*12);
  vy-=19*dt; player.position.y+=vy*dt;
  if(player.position.y<=0){player.position.y=0;vy=0;onGround=true}
  slideT-=dt; if(slideT<=0)player.scale.y+=(.92-player.scale.y)*Math.min(1,dt*12);

  const ph=t*.018; player.userData.arms[0].rotation.x=Math.sin(ph)*.75; player.userData.arms[1].rotation.x=-Math.sin(ph)*.75;
  player.userData.legs[0].rotation.x=-Math.sin(ph)*.85; player.userData.legs[1].rotation.x=Math.sin(ph)*.85;

  for(const m of moving){m.position.z+=speed*dt;if(m.position.z>9)m.position.z-=182}

  for(let i=objects.length-1;i>=0;i--){
    const o=objects[i]; o.position.z+=speed*dt;
    if(o.userData.type==='coin'||o.userData.type==='star')o.rotation.y+=dt*3;
    if(coll(o)){
      if(o.userData.type==='coin'){coins++;score+=10}
      else if(o.userData.type==='star'){mission++;score+=25}
      else if(o.userData.type==='ramp'){vy=10.2;onGround=false;score+=20}
      else{lives--;vy=4.2;if(lives<=0){scene.remove(o);objects.splice(i,1);end();return}}
      scene.remove(o);objects.splice(i,1);
    }else if(o.position.z>10){scene.remove(o);objects.splice(i,1)}
  }
  updateHud(); renderer.render(scene,camera); requestAnimationFrame(loop);
}

addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
updateHud(); renderer.render(scene,camera);
})();
