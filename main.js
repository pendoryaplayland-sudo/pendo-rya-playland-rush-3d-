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



function makeTextSprite(textValue,subValue,z,y=3.6,scale=1){
  const canvas=document.createElement('canvas');
  canvas.width=1024;
  canvas.height=320;
  const ctx=canvas.getContext('2d');

  const g=ctx.createLinearGradient(0,0,1024,0);
  g.addColorStop(0,'#18c8ff');
  g.addColorStop(.5,'#ffffff');
  g.addColorStop(1,'#ff32b4');

  ctx.clearRect(0,0,1024,320);
  ctx.shadowColor='#153c9a';
  ctx.shadowBlur=28;
  ctx.lineWidth=18;
  ctx.strokeStyle='#143f9a';
  ctx.textAlign='center';
  ctx.font='900 118px Arial Rounded MT Bold, Arial, sans-serif';
  ctx.strokeText(textValue,512,145);
  ctx.fillStyle=g;
  ctx.fillText(textValue,512,145);

  ctx.shadowBlur=12;
  ctx.lineWidth=10;
  ctx.font='900 46px Arial Rounded MT Bold, Arial, sans-serif';
  ctx.strokeText(subValue,512,235);
  ctx.fillStyle='#ffffff';
  ctx.fillText(subValue,512,235);

  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;

  const mat=new THREE.MeshBasicMaterial({
    map:texture,
    transparent:true,
    depthWrite:false
  });
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(5.9*scale,1.85*scale),mat);
  plane.position.set(0,y,z);
  scene.add(plane);
  themeMoving.push(plane);
}

function addNeonRail(side,z){
  const rail=new THREE.Group();

  const glass=new THREE.Mesh(
    new THREE.BoxGeometry(.07,.88,7.2),
    new THREE.MeshStandardMaterial({
      color:0xa9ecff,
      transparent:true,
      opacity:.30,
      roughness:.08,
      metalness:.05
    })
  );
  glass.position.set(side*4.05,.62,0);
  rail.add(glass);

  const neon=new THREE.Mesh(
    new THREE.BoxGeometry(.045,.045,7.2),
    M(side<0?0x19c9ff:0xff34b4,1.4)
  );
  neon.position.set(side*4.01,1.08,0);
  rail.add(neon);

  const base=new THREE.Mesh(
    new THREE.BoxGeometry(.12,.12,7.2),
    M(0x31548e,.1)
  );
  base.position.set(side*4.03,.09,0);
  rail.add(base);

  rail.position.z=z;
  scene.add(rail);
  themeMoving.push(rail);
}


function addShopFront(side,z,i){
  const g=new THREE.Group();
  const sx=side*5.08;

  const wall=new THREE.Mesh(
    new THREE.BoxGeometry(.55,3.75,5.9),
    new THREE.MeshStandardMaterial({
      color:i%2===0?0xf0ece7:0xe6e9ef,
      roughness:.44
    })
  );
  wall.position.set(sx,1.88,0);
  g.add(wall);

  const frameMat=M(0x263b63,.08);
  for(const dz of [-2.25,0,2.25]){
    const frame=new THREE.Mesh(new THREE.BoxGeometry(.10,2.65,.09),frameMat);
    frame.position.set(side*4.77,1.65,dz);
    g.add(frame);
  }

  const glass=new THREE.Mesh(
    new THREE.BoxGeometry(.08,2.6,4.65),
    new THREE.MeshPhysicalMaterial({
      color:i%2===0?0xbdefff:0xffc7e9,
      transparent:true,
      opacity:.26,
      roughness:.05,
      metalness:.02,
      transmission:.3,
      clearcoat:.7
    })
  );
  glass.position.set(side*4.72,1.65,0);
  g.add(glass);

  // lit merchandise plinths behind the window
  for(const dz of [-1.55,0,1.55]){
    const plinth=new THREE.Mesh(
      new THREE.BoxGeometry(.42,.48,.82),
      M(i%3===0?0x22cfff:(i%3===1?0xff47b9:0xffdf48),.22)
    );
    plinth.position.set(side*4.95,.48,dz);
    g.add(plinth);

    const obj=new THREE.Mesh(
      new THREE.SphereGeometry(.17,12,12),
      M(i%2===0?0xffffff:0xffdf48,.35)
    );
    obj.position.set(side*4.82,.88,dz);
    g.add(obj);
  }

  const signBack=new THREE.Mesh(
    new THREE.BoxGeometry(.12,.55,2.65),
    M(i%3===0?0x1bcbff:(i%3===1?0xff3eae:0xffd93e),.52)
  );
  signBack.position.set(side*4.64,3.1,-.5);
  g.add(signBack);

  const light=new THREE.Mesh(
    new THREE.BoxGeometry(.10,.055,4.55),
    M(0xffffff,.82)
  );
  light.position.set(side*4.62,2.68,0);
  g.add(light);

  g.position.z=z;
  scene.add(g);
  themeMoving.push(g);
}

function addPalm(side,z){
  const g=new THREE.Group();
  const x=side*3.72;

  const trunk=new THREE.Mesh(
    new THREE.CylinderGeometry(.12,.18,2.7,10),
    M(0x9a6b42,.02)
  );
  trunk.position.set(x,1.35,0);
  g.add(trunk);

  const crownY=2.8;
  for(let i=0;i<7;i++){
    const leaf=new THREE.Mesh(
      new THREE.CapsuleGeometry(.11,.95,4,7),
      M(0x39b866,.05)
    );
    const a=(i/7)*Math.PI*2;
    leaf.position.set(x+Math.cos(a)*.54,crownY+Math.sin(a*.5)*.12,Math.sin(a)*.54);
    leaf.rotation.z=Math.PI/2;
    leaf.rotation.y=-a;
    leaf.scale.set(1,.7,1);
    g.add(leaf);
  }

  const planter=new THREE.Mesh(
    new THREE.CylinderGeometry(.34,.46,.48,12),
    M(0xeee8df,.02)
  );
  planter.position.set(x,.24,0);
  g.add(planter);

  g.position.z=z;
  scene.add(g);
  themeMoving.push(g);
}

function addCeilingArc(z,i){
  const g=new THREE.Group();

  const top=new THREE.Mesh(
    new THREE.TorusGeometry(4.5,.08,8,36,Math.PI),
    M(i%2===0?0x8cdfff:0xff88d3,.62)
  );
  top.rotation.z=Math.PI;
  top.position.y=5.1;
  g.add(top);

  const strip=new THREE.Mesh(
    new THREE.BoxGeometry(7.3,.06,.12),
    M(0xffffff,.95)
  );
  strip.position.set(0,4.92,0);
  g.add(strip);

  g.position.z=z;
  scene.add(g);
  themeMoving.push(g);
}

function addBanner(side,z,isRya=false){
  const g=new THREE.Group();
  const pole=new THREE.Mesh(
    new THREE.CylinderGeometry(.035,.035,2.5,8),
    M(0x263f77,.12)
  );
  pole.position.set(side*3.35,3.12,0);
  g.add(pole);

  const panel=new THREE.Mesh(
    new THREE.BoxGeometry(.75,1.7,.08),
    M(isRya?0xff32b4:0x19c8ff,.48)
  );
  panel.position.set(side*3.35,3.05,.05);
  g.add(panel);

  const mark=new THREE.Mesh(
    new THREE.OctahedronGeometry(.23),
    M(0xffe342,.8)
  );
  mark.position.set(side*3.35,3.1,.13);
  g.add(mark);

  g.position.z=z;
  scene.add(g);
  themeMoving.push(g);
}


function addPlaylandPortal(z){
  const g=new THREE.Group();

  const colMatL=new THREE.MeshStandardMaterial({color:0xff2fa9,emissive:0xff168e,emissiveIntensity:.75,roughness:.22});
  const colMatR=new THREE.MeshStandardMaterial({color:0x18caff,emissive:0x0aaee8,emissiveIntensity:.75,roughness:.22});

  const left=new THREE.Mesh(new THREE.BoxGeometry(.72,5.7,.72),colMatL);
  left.position.set(-3.45,2.85,0); g.add(left);

  const right=new THREE.Mesh(new THREE.BoxGeometry(.72,5.7,.72),colMatR);
  right.position.set(3.45,2.85,0); g.add(right);

  const canopy=new THREE.Mesh(
    new THREE.BoxGeometry(7.55,.58,1.08),
    new THREE.MeshStandardMaterial({color:0x173b8f,emissive:0x102c78,emissiveIntensity:.45,roughness:.2,metalness:.18})
  );
  canopy.position.set(0,5.35,0); g.add(canopy);

  const cyan=new THREE.Mesh(new THREE.BoxGeometry(7.2,.075,1.14),M(0x25d8ff,1.15));
  cyan.position.set(0,5.65,.02); g.add(cyan);
  const pink=new THREE.Mesh(new THREE.BoxGeometry(7.2,.075,1.14),M(0xff3bb8,1.05));
  pink.position.set(0,5.04,.02); g.add(pink);

  for(const x of [-2.7,2.7]){
    const s=new THREE.Mesh(new THREE.OctahedronGeometry(.34),M(0xffe33f,.95));
    s.position.set(x,5.35,.7); g.add(s);
  }

  const opening=new THREE.Mesh(
    new THREE.PlaneGeometry(5.9,4.35),
    new THREE.MeshBasicMaterial({color:0xe7fbff,transparent:true,opacity:.30,side:THREE.DoubleSide})
  );
  opening.position.set(0,2.6,-.42); g.add(opening);

  g.position.z=z;
  scene.add(g);
  themeMoving.push(g);
  makeTextSprite('PLAYLAND','PENDORYA AVM',z+.62,4.48,1.08);
}

function addFloorGlow(z){
  const g=new THREE.Group();

  // warm mall floor panels
  const base=new THREE.Mesh(
    new THREE.BoxGeometry(5.5,.035,7.15),
    new THREE.MeshStandardMaterial({
      color:0xd6b18b,
      roughness:.58,
      metalness:.02
    })
  );
  base.position.y=.005;
  g.add(base);

  // subtle tile joints
  for(const x of [-2.7,-1.35,0,1.35,2.7]){
    const joint=new THREE.Mesh(
      new THREE.BoxGeometry(.018,.01,7.15),
      M(0xffffff,.02)
    );
    joint.position.set(x,.03,0);
    g.add(joint);
  }

  // lane guidance kept elegant and thin
  for(const [x,c] of [[-1.55,0x4fdcff],[1.55,0xff55bd]]){
    const line=new THREE.Mesh(
      new THREE.BoxGeometry(.035,.018,7.0),
      M(c,.35)
    );
    line.position.set(x,.038,0);
    g.add(line);
  }

  // soft center guide
  const center=new THREE.Mesh(
    new THREE.BoxGeometry(.025,.012,7.0),
    M(0xffffff,.22)
  );
  center.position.set(0,.036,0);
  g.add(center);

  g.position.z=z;
  scene.add(g);
  themeMoving.push(g);
}

function addCeilingLights(z){
  const g=new THREE.Group();

  const bar=new THREE.Mesh(
    new THREE.BoxGeometry(6.8,.05,.12),
    M(0xffffff,.9)
  );
  bar.position.y=4.85;
  g.add(bar);

  for(const x of [-2.7,-1.35,0,1.35,2.7]){
    const lamp=new THREE.Mesh(
      new THREE.BoxGeometry(.32,.055,.22),
      M(0xfff1cf,.72)
    );
    lamp.position.set(x,4.83,0);
    g.add(lamp);
  }

  g.position.z=z;
  scene.add(g);
  themeMoving.push(g);
}


function addMallArchitecture(z,i){
  const g=new THREE.Group();
  for(const side of [-1,1]){
    const soffit=new THREE.Mesh(
      new THREE.BoxGeometry(1.45,.20,7.05),
      new THREE.MeshStandardMaterial({color:0xf0efed,roughness:.5})
    );
    soffit.position.set(side*4.72,4.72,0); g.add(soffit);

    const upperGlass=new THREE.Mesh(
      new THREE.BoxGeometry(.055,1.0,7.0),
      new THREE.MeshPhysicalMaterial({color:0xb5edff,transparent:true,opacity:.17,roughness:.04,transmission:.35})
    );
    upperGlass.position.set(side*4.02,3.92,0); g.add(upperGlass);
  }
  for(const x of [-2.5,0,2.5]){
    const lamp=new THREE.Mesh(new THREE.BoxGeometry(1.0,.035,.42),M(0xffefc8,.8));
    lamp.position.set(x,4.61,0); g.add(lamp);
  }
  g.position.z=z; scene.add(g); themeMoving.push(g);
}

function addMallBench(side,z){
  const g=new THREE.Group();
  const seat=new THREE.Mesh(new THREE.BoxGeometry(1.15,.16,.52),M(0xa66f43,.02));
  seat.position.set(side*3.42,.48,0); g.add(seat);
  for(const dz of [-.34,.34]){
    const leg=new THREE.Mesh(new THREE.BoxGeometry(.08,.42,.08),M(0x34445e,.02));
    leg.position.set(side*3.42,.22,dz); g.add(leg);
  }
  g.position.z=z; scene.add(g); themeMoving.push(g);
}

function buildPlaylandTheme(){
  // Clean premium mall corridor based on the approved Pendo & Rya reference art.
  for(let i=0;i<25;i++){
    const z=-10-i*7.2;
    addFloorGlow(z);
    addMallArchitecture(z,i);
    addNeonRail(-1,z);
    addNeonRail(1,z);

    if(i%2===0){
      addShopFront(-1,z-1.2,i);
      addShopFront(1,z-1.2,i+1);
    }
    if(i%4===0){
      addPalm(-1,z-2.4);
      addPalm(1,z-2.4);
      addMallBench(i%8===0?-1:1,z-4.0);
    }
if(i%3===0){
      addCeilingLights(z-2.0);
    }
    if(i%5===1){
      addBanner(-1,z-1.8,false);
      addBanner(1,z-1.8,true);
    }
  }

  makeTextSprite('PLAYLAND','PENDORYA AVM',-32,3.82,.94);
  makeTextSprite('PLAYLAND','PENDORYA AVM',-68,4.0,1.02);
  addPlaylandPortal(-108);
}

// V12 uses approved image assets instead of procedural theme
// buildPlaylandTheme();




// ===================== V12.2 STATIC ASSET ENVIRONMENT =====================
const assetTexLoader=new THREE.TextureLoader();
const staticAssets=[];
const movingFloorAssets=[];

function tex(url){
  const t=assetTexLoader.load(
    url,
    undefined,
    undefined,
    err=>console.warn('Asset yüklenemedi:',url,err)
  );
  if('colorSpace' in t)t.colorSpace=THREE.SRGBColorSpace;
  return t;
}

const AT={
  entrance:tex('/assets/playland_entrance.jpg'),
  shops:tex('/assets/storefronts.jpg'),
  rails:tex('/assets/railings.jpg'),
  floor:tex('/assets/floor_wood.jpg'),
  ceiling:tex('/assets/ceiling.jpg'),
  plants:tex('/assets/plants.jpg'),
  interiors:tex('/assets/interiors.jpg'),
  lights:tex('/assets/lights.jpg'),
  brand:tex('/assets/brand.jpg')
};

function staticPlane(texture,w,h,x,y,z,rotY=0){
  const mat=new THREE.MeshBasicMaterial({
    map:texture,
    side:THREE.DoubleSide
  });
  const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
  p.position.set(x,y,z);
  p.rotation.y=rotY;
  scene.add(p);
  staticAssets.push(p);
  return p;
}

function floorTile(z){
  const mat=new THREE.MeshStandardMaterial({
    map:AT.floor,
    roughness:.62,
    metalness:.01
  });
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(6.2,6.0),mat);
  floor.rotation.x=-Math.PI/2;
  floor.position.set(0,.012,z);
  scene.add(floor);
  movingFloorAssets.push(floor);
}

function addStaticEnvironment(){
  // Only floor tiles move with the runner.
  for(let i=0;i<34;i++){
    floorTile(-6-i*5.9);
  }

  // Fixed storefront walls: far to each side and never cross the track.
  const wallZ=[-18,-36,-54,-72,-90,-108,-126,-144,-162];
  wallZ.forEach((z,i)=>{
    staticPlane(AT.shops,5.2,2.8,-5.0,1.6,z,-Math.PI/2);
    staticPlane(AT.shops,5.2,2.8, 5.0,1.6,z, Math.PI/2);

    staticPlane(AT.rails,2.0,.85,-3.95,.67,z+.8,-Math.PI/2);
    staticPlane(AT.rails,2.0,.85, 3.95,.67,z+.8, Math.PI/2);

    if(i%3===1){
      staticPlane(AT.interiors,2.25,1.35,-4.55,2.25,z+1.0,-Math.PI/2);
      staticPlane(AT.plants,1.0,1.0,3.55,.95,z+.6,0);
    }

    if(i%4===2){
      staticPlane(AT.brand,1.1,.66,-3.45,2.45,z+.5,0);
      staticPlane(AT.lights,.7,1.35,3.45,2.25,z+.5,0);
    }
  });

  // Fixed ceiling image segments, high enough to never intersect camera.
  for(const z of [-28,-58,-88,-118,-148]){
    const c=staticPlane(AT.ceiling,7.5,2.25,0,5.3,z,0);
    c.rotation.x=Math.PI/2;
  }

  // One distant Playland entrance. It remains static.
  staticPlane(AT.entrance,8.8,5.9,0,2.95,-155,0);
}
addStaticEnvironment();

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
      const mats=Array.isArray(o.material)?o.material:[o.material];
      mats.forEach(mat=>{
        if(!mat || !mat.color || mat.map)return;
        const avg=(mat.color.r+mat.color.g+mat.color.b)/3;
        if(avg>.72)mat.color.setHex(0xf7f9ff);
        else if(avg>.40)mat.color.setHex(0x248cff);
        else mat.color.setHex(0x153b8f);
        mat.needsUpdate=true;
      });
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

  for(const f of movingFloorAssets){
    f.position.z+=speed*dt;
    if(f.position.z>8)f.position.z-=200;
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
