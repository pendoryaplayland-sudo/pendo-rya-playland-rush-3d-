import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const $=id=>document.getElementById(id);
const host=$('game');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8cd9ff);
scene.fog=new THREE.Fog(0xb8ecff,30,120);

const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,180);
camera.position.set(0,5.2,9.6); camera.lookAt(0,1.5,-12);

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
const lanes=[-2.45,0,2.45], moving=[], objects=[];

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
}

const loader=new GLTFLoader();
const GLB={
  run:'public/models/Pendo-run.glb',
  jump:'public/models/Pendo-jump.glb',
  slide:'public/models/Pendo-slide.glb'
};

let player=new THREE.Group(), mixer=null, action=null, current='run';
player.position.z=1.7; scene.add(player);

function normalizeModel(root)root.rotation.y=Math.PI;{
  root.traverse(o=>{ if(o.isMesh){o.castShadow=true;o.receiveShadow=true;} });
  const box=new THREE.Box3().setFromObject(root);
  const size=box.getSize(new THREE.Vector3());
  const h=Math.max(.001,size.y);
  const s=1.75/h;
  root.scale.setScalar(s);
  box.setFromObject(root);
  const center=box.getCenter(new THREE.Vector3());
  const minY=box.min.y;
  root.position.x-=center.x;
  root.position.z-=center.z;
  root.position.y-=minY;
}

function loadMotion(kind){
  current=kind;
  loader.load(GLB[kind], gltf=>{
    if(current!==kind)return;
    while(player.children.length) player.remove(player.children[0]);
    mixer=null; action=null;
    const model=gltf.scene;
    normalizeModel(model);
    player.add(model);
    if(gltf.animations?.length){
      mixer=new THREE.AnimationMixer(model);
      action=mixer.clipAction(gltf.animations[0]);
      action.reset();
      if(kind!=='run'){ action.setLoop(THREE.LoopOnce,1); action.clampWhenFinished=true; }
      action.play();
    }
  },undefined,e=>console.error('GLB yüklenemedi:',kind,e));
}
loadMotion('run');

let running=false,last=0,score=0,coins=0,lives=3,best=+(localStorage.getItem('pr-v3-best')||0),mission=0;
let lane=0,targetX=0,vy=0,onGround=true,slideT=0,speed=17,spawn=0,distance=0;

function spawnObject(){
  const q=Math.random(), laneX=lanes[(Math.random()*3)|0]; let type,obj;
  if(q<.52){type='coin';obj=new THREE.Mesh(new THREE.CylinderGeometry(.26,.26,.09,24),M(0xffc928,.35));obj.rotation.z=Math.PI/2;obj.position.set(laneX,1.15,-78);}
  else if(q<.7){type='star';obj=new THREE.Mesh(new THREE.OctahedronGeometry(.29),M(0xffef43,.45));obj.position.set(laneX,1.35,-78);}
  else if(q<.82){type='ramp';obj=new THREE.Mesh(new THREE.BoxGeometry(1.5,.25,2.3),M(0x52dc38,.2));obj.rotation.x=-.28;obj.position.set(laneX,.18,-80);}
  else{type='barrier';obj=new THREE.Mesh(new THREE.BoxGeometry(1.45,1.35,.75),M(0xff4d45,.15));obj.position.set(laneX,.67,-80);}
  obj.userData.type=type; obj.castShadow=true; scene.add(obj); objects.push(obj);
}

function updateHud(){
  $('score').textContent=Math.floor(score); $('coins').textContent=coins;
  $('lives').textContent=lives; $('best').textContent=best; $('missionCount').textContent=mission;
}
function reset(){
  score=0;coins=0;lives=3;mission=0;lane=0;targetX=0;vy=0;onGround=true;slideT=0;speed=17;spawn=0;distance=0;
  objects.splice(0).forEach(o=>scene.remove(o)); player.position.set(0,0,1.7); loadMotion('run'); updateHud();
}
function start(){
  reset(); $('menu').classList.add('hidden'); $('gameover').classList.add('hidden');
  $('hud').classList.remove('hidden'); $('mission').classList.remove('hidden'); $('controls').classList.remove('hidden');
  running=true;last=performance.now();requestAnimationFrame(loop);
}
function end(){
  running=false;best=Math.max(best,Math.floor(score));localStorage.setItem('pr-v3-best',best);
  $('finalScore').textContent=Math.floor(score);$('hud').classList.add('hidden');$('mission').classList.add('hidden');
  $('controls').classList.add('hidden');$('gameover').classList.remove('hidden');updateHud();
}
function move(d){lane=Math.max(-1,Math.min(1,lane+d));targetX=lanes[lane+1];}
function jump(){if(onGround&&slideT<=0){vy=8.4;onGround=false;loadMotion('jump');}}
function slide(){if(onGround&&slideT<=0){slideT=.7;loadMotion('slide');}}
function coll(o){return Math.abs(player.position.x-o.position.x)<.82&&Math.abs(player.position.y-o.position.y)<1.1&&Math.abs(player.position.z-o.position.z)<.95;}

$('pickPendo').onclick=()=>{$('pickPendo').classList.add('selected');$('pickRya').classList.remove('selected');};
$('pickRya').onclick=()=>{$('pickRya').classList.add('selected');$('pickPendo').classList.remove('selected');};
$('start').onclick=start;$('restart').onclick=start;
$('left').onpointerdown=e=>{e.preventDefault();move(-1)};
$('right').onpointerdown=e=>{e.preventDefault();move(1)};
$('jump').onpointerdown=e=>{e.preventDefault();jump()};
$('slide').onpointerdown=e=>{e.preventDefault();slide()};

let sx=0,sy=0;
addEventListener('touchstart',e=>{const t=e.changedTouches[0];sx=t.clientX;sy=t.clientY},{passive:true});
addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<35)return;if(Math.abs(dx)>Math.abs(dy))move(dx>0?1:-1);else dy<0?jump():slide()},{passive:true});

function loop(t){
  if(!running)return;
  const dt=Math.min(.033,(t-last)/1000);last=t;
  if(mixer)mixer.update(dt);
  distance+=speed*dt;speed=Math.min(31,17+distance/250);score+=dt*speed;
  spawn-=dt;if(spawn<=0){spawnObject();spawn=.46+Math.random()*.36}
  player.position.x+=(targetX-player.position.x)*Math.min(1,dt*12);
  vy-=19*dt;player.position.y+=vy*dt;
  if(player.position.y<=0){
    player.position.y=0;vy=0;
    if(!onGround){onGround=true;if(slideT<=0)loadMotion('run');}
  }
  if(slideT>0){slideT-=dt;if(slideT<=0)loadMotion('run');}

  for(const m of moving){m.position.z+=speed*dt;if(m.position.z>9)m.position.z-=182}
  for(let i=objects.length-1;i>=0;i--){
    const o=objects[i];o.position.z+=speed*dt;
    if(o.userData.type==='coin'||o.userData.type==='star')o.rotation.y+=dt*3;
    if(coll(o)){
      if(o.userData.type==='coin'){coins++;score+=10}
      else if(o.userData.type==='star'){mission++;score+=25}
      else if(o.userData.type==='ramp'){vy=10.2;onGround=false;loadMotion('jump');score+=20}
      else{lives--;vy=4.2;if(lives<=0){scene.remove(o);objects.splice(i,1);end();return}}
      scene.remove(o);objects.splice(i,1);
    }else if(o.position.z>10){scene.remove(o);objects.splice(i,1)}
  }
  updateHud();renderer.render(scene,camera);requestAnimationFrame(loop);
}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
updateHud();renderer.render(scene,camera);
