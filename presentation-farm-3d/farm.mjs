import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { GLTFExporter } from './vendor/GLTFExporter.js';
import { CHAPTERS, DURATION, sampleState } from './simulation.mjs';

const $ = (id) => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = { chapter: 0, elapsed: 0, playing: false, orbit: false, labels: true, clean: false, selected: null, time: 0, roofOpen: false, roofProgress: 0 };
const roofPanels = [];
const equipment = [];
let renderer, scene, camera, controls, model, effects, cameraMove;
let scanPlane, scanBoxes, selectionRing, pumpRotor, statusLamp, cloudLink;
const routes = [], waterBeads = [], soilBeds = [];
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const materialCache = new Map();
function mat(color, extras = {}) {
  const key = `${color}:${JSON.stringify(extras)}`;
  if (!materialCache.has(key)) materialCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: .85, ...extras }));
  return materialCache.get(key);
}
const materials = { soil: mat('#82674a'), grass: mat('#8fa870'), edge: mat('#bdab86'), cream: mat('#f3ecd9'), dark: mat('#344e42'), orange: mat('#e99142'), metal: mat('#bac5b7', { metalness: .35 }), water: mat('#64afba', { roughness: .22 }), panel: mat('#243e51', { metalness: .3, roughness: .35 }) };
function mesh(geometry, material, position, parent = model) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...position); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
const box = (size, m, p, parent) => mesh(new THREE.BoxGeometry(...size), m, p, parent);
const cylinder = (r1, r2, h, m, p, parent, sides = 12) => mesh(new THREE.CylinderGeometry(r1, r2, h, sides), m, p, parent);
function rod(a, b, radius, material, parent = model) {
  const delta = b.clone().sub(a);
  const m = cylinder(radius, radius, delta.length(), material, a.clone().add(b).multiplyScalar(.5).toArray(), parent, 7);
  m.quaternion.setFromUnitVectors(v3(0, 1, 0), delta.normalize()); return m;
}
function group(name, position = [0, 0, 0], parent = model) { const g = new THREE.Group(); g.name = name; g.position.set(...position); parent.add(g); return g; }
function equipmentEntry(id, title, type, description, object, anchor) {
  const button = document.createElement('button'); button.className = 'equipment-label'; button.innerHTML = `<i></i>${title}`;
  button.setAttribute('aria-label', `Explore ${title}`); button.addEventListener('click', () => selectEquipment(id)); $('labels').append(button);
  const item = { id, title, type, description, object, anchor: v3(...anchor), button }; equipment.push(item);
  object.traverse((o) => { if (o.isMesh) o.userData.equipment = id; }); return item;
}

function makeGround() {
  box([18.2, .72, 12.4], materials.edge, [0, -.62, 0]);
  box([18.3, .16, 12.5], materials.grass, [0, -.2, 0]);
  box([3.1, .05, 11.6], mat('#d8c7a5'), [-6.8, -.09, 0]);
  box([14, .06, 1.25], mat('#cfbb97'), [.65, -.075, 5.25]);
  box([.9, .05, 10.1], mat('#d8c7a5'), [6.2, -.08, -.5]);
  // Visible strata turn the plot into a physical presentation model.
  box([18.24, .09, 12.44], mat('#977b59'), [0, -.69, 0]);
  box([18.27, .06, 12.47], mat('#d7c7a4'), [0, -.98, 0]);
  for (let row = 0; row < 6; row++) {
    const x = -3.9 + row * 1.7;
    soilBeds.push(box([1.25, .2, 9.3], mat('#82674a', { name: `soil-${row}` }), [x, .03, -.15]));
    box([.09, .14, 9.45], mat('#b19c72'), [x - .67, .01, -.15]);
    box([.09, .14, 9.45], mat('#b19c72'), [x + .67, .01, -.15]);
  }
  // Boundary stakes and two low rails frame the far edge without hiding the crop.
  for (let i = 0; i < 13; i++) cylinder(.065, .07, .95, mat('#b5a37e'), [-8.5 + i * 1.4, .34, -5.9], model, 6);
  for (const y of [.25, .65]) rod(v3(-8.5, y, -5.9), v3(8.3, y, -5.9), .035, mat('#d4c19b'));
}

function leafGeometry() {
  // A cupped five-lobed leaf, with a raised central vein.
  const outline = [[0,0],[-.24,.13],[-.5,.09],[-.37,.3],[-.59,.48],[-.29,.5],[-.3,.79],[-.12,.68],[0,1],[.12,.68],[.3,.79],[.29,.5],[.59,.48],[.37,.3],[.5,.09],[.24,.13]];
  const positions = [], colors = [];
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i], b = outline[(i + 1) % outline.length];
    positions.push(0,.095,.39,a[0],0,a[1],b[0],0,b[1]);
    colors.push(.96,1,.82,.75,.88,.66,.83,.94,.71);
  }
  const g = new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}

function makeCrops() {
  const root = group('Okra crop — 60 illustrative plants');
  const stems = [], leaves = [], pods = [], petals = [], centers = [];
  const dummy = new THREE.Object3D();
  const matrix = (p, r, s) => { dummy.position.set(...p); dummy.rotation.set(...r); dummy.scale.set(...s);dummy.updateMatrix();return dummy.matrix.clone(); };
  const stemMatrix = (a,b,r) => { dummy.position.copy(a).add(b).multiplyScalar(.5); dummy.quaternion.setFromUnitVectors(v3(0,1,0),b.clone().sub(a).normalize());dummy.scale.set(r,a.distanceTo(b),r);dummy.updateMatrix();return dummy.matrix.clone(); };
  for(let row=0;row<6;row++) for(let plant=0;plant<10;plant++) {
    const x=-3.9+row*1.7, z=-4.15+plant*.89, h=1.18+((row*7+plant*3)%7)*.07;
    stems.push(stemMatrix(v3(x,.1,z),v3(x,h+.1,z),.033));
    for(let level=0;level<5;level++) {
      const a=level*2.4+plant*.35+row*.4, y=.35+level*.21;
      const tx=x+Math.sin(a)*.23, tz=z+Math.cos(a)*.23;
      stems.push(stemMatrix(v3(x,y-.06,z),v3(tx,y,tz),.014));
      const size=.58+(level<3?.13:0);
      leaves.push(matrix([tx,y,tz],[-.12,a,.05*Math.sin(a)],[size,size,size]));
      if(level===2 || level===4) pods.push(matrix([x+.13*Math.sin(a),y+.2,z+.13*Math.cos(a)],[.17,a,.2],[.073,.43+level*.02,.073]));
    }
    if((plant+row)%3===0){
      const fx=x+.2,fz=z-.15,fy=h-.1;
      for(let petal=0;petal<5;petal++){const a=petal*Math.PI*2/5;petals.push(matrix([fx+Math.sin(a)*.072,fy,fz+Math.cos(a)*.072],[0,a,0],[.073,.023,.105]));}
      centers.push(matrix([fx,fy+.025,fz],[0,0,0],[.032,.025,.032]));
    }
  }
  function instances(name, geometry, material, matrices) { const m=new THREE.InstancedMesh(geometry,material,matrices.length);m.name=name; matrices.forEach((a,i)=>m.setMatrixAt(i,a));m.castShadow=true;m.receiveShadow=true;root.add(m);return m; }
  instances('Okra stalks',new THREE.CylinderGeometry(1,1,1,5),mat('#658047'),stems);
  instances('Lobed okra leaves',leafGeometry(),mat('#477347',{side:THREE.DoubleSide,vertexColors:true}),leaves);
  instances('Ridged tapered okra pods',new THREE.CylinderGeometry(.07,1,1,5),mat('#81a345'),pods);
  instances('Okra flower petals',new THREE.SphereGeometry(1,6,4),mat('#f6dfa0'),petals);
  instances('Maroon flower centers',new THREE.SphereGeometry(1,6,4),mat('#773d48'),centers);
}

function makeTree(x,z,s=1) {
  const g=group('Boundary tree',[x,0,z]);g.scale.setScalar(s);
  cylinder(.11,.17,1.6,mat('#89745b'),[0,.65,0],g,6);
  for(const [a,b,c,r] of [[0,2,0,.75],[-.38,1.65,.2,.58],[.38,1.7,.05,.6],[0,1.8,-.35,.59]])mesh(new THREE.IcosahedronGeometry(r,1),mat(c<0?'#75916a':'#91a574'),[a,b,c],g);
}

function makeRoof() {
  const roof = group('Retractable greenhouse roof');
  const frame = mat('#7e998c', { metalness: .45, roughness: .45 });
  const glazing = mat('#b5dbd1', { transparent: true, opacity: .42, roughness: .28, side: THREE.DoubleSide, depthWrite: false });
  const left = -5.6, right = 5.7, center = .05, eave = 3.25, ridge = 4.75;
  for (const x of [left, right]) {
    for (const z of [-5.1, 0, 5.1]) {
      box([.32,.12,.32], materials.cream, [x,0,z], roof);
      box([.1,eave,.1], frame, [x,eave/2,z], roof);
    }
    box([.13,.14,10.5], frame, [x,eave,0], roof);
  }
  // Each pitched bay slides along the side rails, nesting at the rear.
  const halfWidth = (right-left)/2, rise = ridge-eave;
  for (let i = 0; i < 5; i++) {
    const panel = group(`Sliding roof bay ${i+1}`, [0,0,0], roof);
    for (const side of [-1,1]) {
      const glass = mesh(new THREE.PlaneGeometry(Math.hypot(halfWidth,rise),2.04), glazing, [center+side*halfWidth/2,(ridge+eave)/2,0], panel);
      glass.rotation.set(-Math.PI/2,side*Math.atan2(rise,halfWidth),0);
      glass.castShadow = false;
      for (const z of [-1.02,1.02]) rod(v3(center,ridge,z),v3(center+side*halfWidth,eave,z),.035,frame,panel);
      box([.06,.06,2.04],frame,[center+side*halfWidth,eave,0],panel);
    }
    box([.09,.09,2.04],frame,[center,ridge,0],panel);
    roofPanels.push(panel);
  }
  updateRoofGeometry();
}

function updateRoofGeometry() {
  const p = state.roofProgress, eased = p*p*(3-2*p);
  roofPanels.forEach((panel,i) => {
    panel.position.z = (-4.08+i*2.04)*(1-eased)+(-4.08+i*.12)*eased;
    panel.position.y = i*.09*eased;
  });
}

function updateRoofUI() {
  const moving = state.roofProgress !== Number(state.roofOpen);
  $('roof-toggle').textContent = state.roofOpen ? 'Close roof' : 'Open roof';
  $('roof-toggle').setAttribute('aria-expanded',String(state.roofOpen));
  $('farm-mode').textContent = moving ? (state.roofOpen ? 'Opening roof…' : 'Closing roof…') : (state.roofOpen ? 'Outdoor farm · Roof open' : 'Indoor farm · Roof closed');
  $('farm-mode').dataset.mode = state.roofOpen ? 'outdoor' : 'indoor';
  if(state.chapter===0) $('chapter-note').textContent = state.roofOpen ? 'OPEN-AIR GROWING · RETRACTABLE ROOF' : 'COVERED GROWING · RETRACTABLE ROOF';
}

function toggleRoof() {
  state.roofOpen = !state.roofOpen;
  if(reducedMotion) { state.roofProgress = Number(state.roofOpen); updateRoofGeometry(); }
  updateRoofUI();
}

function makeHardware() {
  const soil=group('Soil sensor node',[-4.95,0,1.5]);
  rod(v3(0,0,0),v3(0,1.65,0),.055,materials.metal,soil);
  box([.49,.59,.3],materials.cream,[0,1.5,0],soil);box([.42,.11,.32],materials.orange,[0,1.77,0],soil);
  box([.25,.17,.015],materials.dark,[0,1.57,.16],soil);mesh(new THREE.SphereGeometry(.035,8,6),mat('#75ba73',{emissive:'#357141',emissiveIntensity:.4}),[.14,1.38,.16],soil);
  rod(v3(.17,1.75,0),v3(.17,2.17,0),.016,materials.dark,soil);
  for(let i=0;i<3;i++) { rod(v3(.45+i*.16,.2,.35),v3(.45+i*.16,-.25,.35),.023,materials.metal,soil);rod(v3(.2,1.25,0),v3(.45+i*.16,.2,.35),.011,materials.dark,soil); }
  equipmentEntry('soil','Soil sensor','ESP32 · MOISTURE / pH / EC','Three probes measure water availability, acidity and nutrient concentration. The local controller can act on dry soil even without the internet.',soil,[-4.95,2.4,1.5]);

  const weather=group('Climate station',[-4.9,0,-3.9]);
  cylinder(.045,.07,2.8,materials.metal,[0,1.3,0],weather);
  for(let i=0;i<5;i++)cylinder(.22,.22,.055,materials.cream,[0,1.85+i*.09,0],weather);
  box([.4,.055,.35],materials.orange,[0,2.32,0],weather);
  rod(v3(-.6,2.65,0),v3(.6,2.65,0),.035,materials.metal,weather);
  cylinder(.13,.13,.055,materials.dark,[-.6,2.69,0],weather);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;rod(v3(.45,2.75,0),v3(.45+Math.cos(a)*.29,2.75,Math.sin(a)*.29),.015,materials.dark,weather);mesh(new THREE.SphereGeometry(.075,8,4),materials.cream,[.45+Math.cos(a)*.29,2.75,Math.sin(a)*.29],weather);}
  equipmentEntry('climate','Climate station','TEMPERATURE · HUMIDITY · LIGHT','A shaded sensor housing measures the air around the crop. Light readings establish daytime conditions; humidity and temperature help flag disease risk.',weather,[-4.9,3.15,-3.9]);

  const solar=group('Solar power system',[-7.2,0,-3.6]);
  cylinder(.07,.07,1.15,materials.metal,[0,.5,0],solar);
  const panel=group('Photovoltaic panel',[0,1.25,0],solar);panel.rotation.x=.38;
  box([1.9,.07,1.25],materials.metal,[0,0,0],panel);box([1.8,.04,1.15],materials.panel,[0,.05,0],panel);
  for(let col=0;col<6;col++)for(let row=0;row<3;row++)box([.27,.012,.34],mat((row+col)%2?'#345469':'#3e6074'),[-.745+col*.296,.079,-.38+row*.38],panel);
  box([.7,.45,.5],materials.dark,[0,.16,0],solar);box([.48,.17,.012],materials.orange,[0,.2,.26],solar);
  equipmentEntry('solar','Solar + battery','OFF-GRID POWER','A solar panel charges a battery for the field sensor node. This model illustrates the layout; panel and battery sizing depend on the actual hardware load.',solar,[-7.2,1.8,-3.6]);

  const gateway=group('LoRa gateway',[-7.1,0,3.65]);
  box([.75,.15,.75],materials.cream,[0,0,0],gateway);cylinder(.075,.09,4.6,materials.metal,[0,2.3,0],gateway);
  box([.6,.9,.4],materials.cream,[0,3.1,0],gateway);box([.61,.13,.41],materials.orange,[0,3.56,0],gateway);
  box([.27,.25,.02],materials.dark,[0,3.23,.21],gateway);statusLamp=mesh(new THREE.SphereGeometry(.046,8,6),mat('#7db58a',{emissive:'#367443',emissiveIntensity:.4}),[0,2.87,.24],gateway);
  rod(v3(0,4.25,0),v3(-.5,4.25,0),.03,materials.dark,gateway);rod(v3(-.5,4.25,0),v3(-.5,4.95,0),.02,materials.dark,gateway);
  rod(v3(0,4.5,0),v3(.45,4.5,0),.025,materials.dark,gateway);
  equipmentEntry('gateway','LoRa gateway','SHARED NETWORK · STORE & FORWARD','Low-bandwidth radio carries sensor readings and compact crop counts. The gateway bridges the field to the dashboard and buffers readings during an internet outage.',gateway,[-7.1,5.25,3.65]);

  const irrigation=group('Irrigation pump and tank',[-7.1,0,-.5]);
  cylinder(.68,.68,1.7,mat('#c1d2bc'),[0,.8,0],irrigation,18);
  for(const y of [.25,.7,1.2])cylinder(.696,.696,.06,mat('#a9bea7'),[0,y,0],irrigation,18);
  cylinder(.72,.72,.12,materials.cream,[0,1.69,0],irrigation,18);cylinder(.16,.16,.07,materials.dark,[0,1.79,0],irrigation);
  box([.84,.12,.64],materials.cream,[.5,.02,1.7],irrigation);box([.55,.32,.45],materials.dark,[.5,.25,1.7],irrigation);
  const pump=cylinder(.23,.23,.58,materials.orange,[.5,.47,1.7],irrigation);pump.rotation.z=Math.PI/2;
  pumpRotor=group('Pump rotor',[.81,.47,1.7],irrigation);for(let i=0;i<3;i++){const fin=box([.018,.32,.05],materials.cream,[0,0,0],pumpRotor);fin.rotation.x=i*Math.PI/3;}
  rod(v3(0,.25,.65),v3(.5,.25,1.7),.07,materials.dark,irrigation);
  equipmentEntry('pump','Drip irrigation','LOCAL RULE · PUMP + ROOT-ZONE WATERING','The controller runs a short pump cycle when soil is too dry. Drip lines deliver water near the roots. The tour accelerates a nominal 20-second cycle.',irrigation,[-6.65,1.2,1.2]);
  rod(v3(-6.6,.24,1.2),v3(-5.5,.24,4.4),.048,materials.dark);
  rod(v3(-5.5,.24,4.4),v3(4.7,.24,4.4),.048,materials.dark);
  for(let row=0;row<6;row++){
    const x=-3.9+row*1.7;
    rod(v3(x+.44,.23,4.4),v3(x+.44,.23,-4.4),.026,materials.dark);
    for(let p=0;p<10;p++){const z=-4.15+p*.89;box([.13,.07,.07],materials.water,[x+.39,.25,z]);}
    for(let i=0;i<6;i++){const bead=mesh(new THREE.SphereGeometry(.064,6,4),mat('#6ee2e6',{emissive:'#1b8a94',emissiveIntensity:.5}),[x+.44,.28,4.4],effects);waterBeads.push({bead,x:x+.44,offset:i/6});}
  }

  const cameraRig=group('Camera and edge AI',[6.85,0,-4.25]);
  box([.65,.18,.65],materials.cream,[0,0,0],cameraRig);cylinder(.06,.1,3.8,materials.metal,[0,1.9,0],cameraRig);
  rod(v3(0,3.65,0),v3(-.75,3.65,0),.055,materials.metal,cameraRig);
  const cam=group('Camera',[-.7,3.65,0],cameraRig);cam.rotation.z=.2;
  box([.64,.36,.39],materials.cream,[0,0,0],cam);box([.7,.06,.46],materials.orange,[0,.21,0],cam);
  const lens=cylinder(.12,.12,.12,materials.dark,[-.37,0,0],cam);lens.rotation.z=Math.PI/2;
  const glass=cylinder(.08,.08,.13,materials.water,[-.4,0,0],cam);glass.rotation.z=Math.PI/2;
  box([.47,.62,.32],materials.dark,[0,2.25,0],cameraRig);box([.22,.2,.02],materials.orange,[0,2.3,.17],cameraRig);
  equipmentEntry('camera','Camera + edge AI','FIXED CAMERA · RASPBERRY PI','The camera supplies consistent crop images. YOLO runs on the edge computer; only small detection messages need to travel over LoRa. The scan in this demo is scripted.',cameraRig,[6.4,4.35,-4.25]);
}

function makeFarmDetails() {
  const shed=group('Equipment shed',[7.2,0,3.55]);
  box([1.7,1.45,1.65],mat('#ebdec1'),[0,.67,0],shed);
  for(let i=0;i<8;i++)box([1.72,.022,1.67],mat('#d4c4a1'),[0,.1+i*.17,0],shed);
  for(const side of [-1,1]){const roof=box([1.18,.13,2.03],mat('#6a8070'),[side*.48,1.59,0],shed);roof.rotation.z=-side*.43;}
  box([.57,.97,.04],mat('#799582'),[0,.45,.85],shed);box([.35,.35,.04],mat('#9ab9b8'),[-.53,.86,.85],shed);
  for(let i=0;i<3;i++){const crate=group('Harvest crate',[4.85+i*.64,0,5.35]);box([.54,.08,.45],mat('#be8c53'),[0,.08,0],crate);for(let j=0;j<3;j++){box([.55,.07,.04],mat('#cf9a5f'),[0,.14+j*.08,.22],crate);box([.55,.07,.04],mat('#cf9a5f'),[0,.14+j*.08,-.22],crate);}for(const x of [-.25,.25])box([.05,.35,.47],mat('#bc8851'),[x,.2,0],crate);for(let p=0;p<6;p++){const pod=cylinder(.018,.055,.28,mat('#8da950'),[-.17+(p%3)*.15,.27,-.08+Math.floor(p/3)*.16],crate,5);pod.rotation.z=.9;}}
  for(const t of [[-8.1,-5.1,.8],[-6,-5.4,.65],[8,-5.2,1],[8.2,-2.5,.7],[8.35,.25,.75]])makeTree(...t);
  // Field marker faces the presentation camera.
  const sign=group('Field identification',[-1.2,0,5.75]);
  for(const x of [-.65,.65])rod(v3(x,0,0),v3(x,.67,0),.035,materials.dark,sign);
  box([1.7,.5,.085],materials.cream,[0,.63,0],sign);
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;const ctx=canvas.getContext('2d');ctx.fillStyle='#f3ecd9';ctx.fillRect(0,0,512,160);ctx.fillStyle='#344e42';ctx.font='bold 55px Arial';ctx.textAlign='center';ctx.fillText('FIELD A',256,75);ctx.font='20px Arial';ctx.fillText('CONNECTED OKRA FARM',256,118);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;mesh(new THREE.PlaneGeometry(1.66,.48),new THREE.MeshBasicMaterial({map:texture}),[0,.63,.047],sign);
}

function route(name, a, b, color, lift=2) {
  const mid=a.clone().add(b).multiplyScalar(.5);mid.y+=lift;
  const curve=new THREE.QuadraticBezierCurve3(a,mid,b);
  const geometry=new THREE.BufferGeometry().setFromPoints(curve.getPoints(50));
  const line=new THREE.Line(geometry,new THREE.LineDashedMaterial({color,transparent:true,opacity:.48,dashSize:.15,gapSize:.13}));line.computeLineDistances();line.name=name;effects.add(line);
  const particles=[];for(let i=0;i<3;i++)particles.push(mesh(new THREE.SphereGeometry(.065,7,5),mat(color,{emissive:color,emissiveIntensity:.45}),a.toArray(),effects));
  const r={name,curve,line,particles};routes.push(r);return r;
}

function makeEffects() {
  const gw=v3(-7.1,4.4,3.65);
  route('soil',v3(-4.95,2,1.5),gw,'#e18a37',1.4);
  route('climate',v3(-4.9,2.85,-3.9),gw,'#e18a37',2);
  route('camera',v3(6.2,3.65,-4.25),gw,'#72a666',2.1);
  const cloud=group('Dashboard uplink',[-7.4,6.8,-4.5],effects);
  for(const [x,y,r] of [[-.52,0,.38],[0,.2,.53],[.55,0,.35]])mesh(new THREE.SphereGeometry(r,14,9),mat('#f8f6e9'),[x,y,0],cloud);
  box([1.2,.32,.42],mat('#f8f6e9'),[0,-.12,0],cloud);
  cloudLink=route('internet',gw,v3(-7.4,6.8,-4.5),'#5e9fa0',1.1);
  equipmentEntry('dashboard','Farm dashboard','GATEWAY → CLOUD','The gateway uploads farm readings when internet is available. This demonstration uses no real cloud connection and sends no commands to your farm.',cloud,[-7.4,7.65,-4.5]);
  scanPlane=mesh(new THREE.PlaneGeometry(10.1,2.6),new THREE.MeshBasicMaterial({color:'#b7e3a2',side:THREE.DoubleSide,transparent:true,opacity:.16,depthWrite:false}),[.35,1.3,-4],effects);
  scanPlane.name='Illustrative AI scan';scanBoxes=group('Scripted pod detections',[0,0,0],effects);
  const edges=new THREE.EdgesGeometry(new THREE.BoxGeometry(.27,.62,.24));
  for(let i=0;i<12;i++){const outline=new THREE.LineSegments(edges,new THREE.LineBasicMaterial({color:'#eac667'}));outline.position.set(-3.77+(i%6)*1.7,1.15,-1.48+Math.floor(i/6)*1.78);scanBoxes.add(outline);}
  selectionRing=mesh(new THREE.RingGeometry(.55,.59,40),new THREE.MeshBasicMaterial({color:'#e88732',side:THREE.DoubleSide,transparent:true,opacity:.8}),[0,.18,0],effects);selectionRing.rotation.x=-Math.PI/2;selectionRing.visible=false;
}

function init() {
  scene=new THREE.Scene();scene.background=new THREE.Color('#f5f2e9');scene.fog=new THREE.Fog('#f5f2e9',48,100);
  camera=new THREE.PerspectiveCamera(37,innerWidth/innerHeight,.1,140);
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.27;$('stage').append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','3D farm. Drag to rotate and scroll to zoom. Equipment is also available through the labeled buttons.');
  const ambient=new THREE.HemisphereLight('#fff9e4','#8e9f77',2.4);scene.add(ambient);
  const sun=new THREE.DirectionalLight('#fff0ce',3.4);sun.position.set(-7,18,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-17,right:17,top:16,bottom:-16,near:.5,far:50});sun.shadow.normalBias=.055;sun.shadow.bias=-.0002;scene.add(sun);
  const fill=new THREE.DirectionalLight('#d0e5ed',1.3);fill.position.set(10,8,-10);scene.add(fill);
  const floor=mesh(new THREE.PlaneGeometry(200,200),mat('#eeeddf'),[0,-1.1,0],scene);floor.rotation.x=-Math.PI/2;floor.castShadow=false;
  model=group('Okradesu — Connected Field A',[0,0,0],scene);effects=group('Simulation overlays',[0,0,0],scene);
  makeGround();makeCrops();makeHardware();makeFarmDetails();makeRoof();makeEffects();
  controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.065;controls.minDistance=12;controls.maxDistance=47;controls.maxPolarAngle=Math.PI*.465;controls.minPolarAngle=.2;controls.enablePan=false;controls.autoRotateSpeed=.45;
  controls.addEventListener('start',()=>{cameraMove=null;pause();});
  renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);
  window.addEventListener('resize',resize);resize();
  bindUI();setChapter(0,true);updateSimulation();$('loading').hidden=true;
  renderer.domElement.addEventListener('webglcontextlost',(e)=>{e.preventDefault();pause();$('error-message').textContent='The browser lost its graphics context. Close other GPU-heavy tabs, then reload the demo.';$('error').hidden=false;});
  let previous=performance.now();
  renderer.setAnimationLoop((now)=>{const dt=Math.max(0,(now-previous)/1000);previous=now;tick(dt);});
  // Read-only diagnostics used by the local verification script.
  window.farmDemo={getState:()=>({...state,...sampleState(state.chapter,state.elapsed),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles}),exportModel:exportModel};
}

function resize() {
  const {width,height}=$('stage').getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();
  if(controls)moveCamera(CHAPTERS[state.chapter],true);
}
function cameraPosition(chapter) {
  const p=v3(...chapter.position);
  if(CHAPTERS.indexOf(chapter)>0&&CHAPTERS.indexOf(chapter)<5)p.multiplyScalar(1.13);
  if(camera.aspect<1)p.multiplyScalar(1.46);else if(camera.aspect<1.4)p.multiplyScalar(1.15);
  return p;
}
function moveCamera(chapter,instant=false) {
  const pos=cameraPosition(chapter),target=v3(...chapter.target);
  if(instant||reducedMotion){camera.position.copy(pos);controls.target.copy(target);controls.update();cameraMove=null;}
  else cameraMove={from:camera.position.clone(),to:pos,fromTarget:controls.target.clone(),toTarget:target,t:0};
}
function setChapter(index,instant=false,elapsed=0) {
  state.chapter=index;state.elapsed=elapsed;state.selected=null;selectionRing.visible=false;$('inspector').hidden=true;
  const c=CHAPTERS[index];$('chapter-no').textContent=`${String(index+1).padStart(2,'0')} / 07`;$('chapter-category').textContent=c.category;$('chapter-title').innerHTML=c.title;$('chapter-description').textContent=c.description;$('chapter-note').textContent=c.note;$('recording-step').textContent=`${String(index+1).padStart(2,'0')} — ${c.name}`;
  document.querySelectorAll('#chapters button').forEach((b,i)=>{if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});moveCamera(c,instant);updateSimulation();updateRoofUI();
}
function pause(){state.playing=false;$('play').textContent=state.chapter===6&&state.elapsed>=DURATION?'▶ Replay guided tour':'▶ Play guided tour';}
function play(){if(state.chapter===6&&state.elapsed>=DURATION)setChapter(0);state.playing=true;state.orbit=false;controls.autoRotate=false;$('orbit').setAttribute('aria-pressed','false');$('play').textContent='Ⅱ Pause tour';}
function togglePlay(){if(state.playing)pause();else play();}
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,3500);}
function toggleClean(){state.clean=!state.clean;$('experience').classList.toggle('clean',state.clean);$('clean').setAttribute('aria-pressed',String(state.clean));$('exit-clean').hidden=!state.clean;}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await $('experience').requestFullscreen();}catch{toast('Full screen is unavailable here. Open index.html in your browser.');}}
function bindUI(){
  CHAPTERS.forEach((c,i)=>{const button=document.createElement('button');button.innerHTML=`<span>${String(i+1).padStart(2,'0')}</span>${c.name}`;button.addEventListener('click',()=>{pause();setChapter(i,false,i===0?0:4);});$('chapters').append(button);});
  $('play').addEventListener('click',togglePlay);$('restart').addEventListener('click',()=>{pause();setChapter(0);});
  $('brand-home').addEventListener('click',(e)=>{e.preventDefault();pause();setChapter(0);});
  $('fullscreen').addEventListener('click',fullscreen);document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'Exit full screen ↙':'Full screen ↗';});
  $('orbit').addEventListener('click',()=>{pause();cameraMove=null;state.orbit=!state.orbit;controls.autoRotate=state.orbit;$('orbit').setAttribute('aria-pressed',String(state.orbit));});
  $('label-toggle').addEventListener('click',()=>{state.labels=!state.labels;$('label-toggle').setAttribute('aria-pressed',String(state.labels));});
  $('clean').addEventListener('click',toggleClean);$('exit-clean').addEventListener('click',toggleClean);
  $('roof-toggle').addEventListener('click',toggleRoof);
  document.addEventListener('keydown',(e)=>{if(!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&!e.target.isContentEditable&&e.key.toLowerCase()==='r')toggleRoof();});
  $('close-inspector').addEventListener('click',()=>{state.selected=null;selectionRing.visible=false;$('inspector').hidden=true;});
  $('export-model').addEventListener('click',async()=>{const b=$('export-model');b.disabled=true;b.textContent='Exporting…';try{const data=await exportModel();download(new Blob([data],{type:'model/gltf-binary'}),'okradesu-connected-field.glb');toast('3D model exported. Open it in Blender or compatible slide software.');}catch(e){toast(`Export failed: ${e.message}`);}finally{b.disabled=false;b.textContent='Export 3D';}});
  document.addEventListener('keydown',(e)=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.code==='Space'&&e.target.tagName!=='BUTTON'){e.preventDefault();togglePlay();}else if(e.key.toLowerCase()==='h')toggleClean();else if(e.key.toLowerCase()==='f')fullscreen();else if(e.key==='Escape'&&state.clean)toggleClean();else if(e.key==='ArrowRight'){pause();setChapter(Math.min(6,state.chapter+1),false,4);}else if(e.key==='ArrowLeft'){pause();setChapter(Math.max(0,state.chapter-1),false,4);}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
async function exportModel(){model.updateMatrixWorld(true);return new GLTFExporter().parseAsync(model,{binary:true,onlyVisible:true,trs:true});}
function selectEquipment(id){const item=equipment.find(e=>e.id===id);if(!item)return;pause();state.selected=id;$('equipment-type').textContent=item.type;$('equipment-title').textContent=item.title;$('equipment-description').textContent=item.description;$('inspector').hidden=false;selectionRing.position.set(item.object.position.x,.17,item.object.position.z);selectionRing.visible=id!=='dashboard';}
let down=null;
function pointerDown(e){down={x:e.clientX,y:e.clientY};}
function pointerUp(e){if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;const rect=renderer.domElement.getBoundingClientRect();const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1),camera);const hits=ray.intersectObjects(equipment.map(e=>e.object),true);const hit=hits.find(h=>h.object.userData.equipment);if(hit)selectEquipment(hit.object.userData.equipment);}

let sim=sampleState(0,0);
function updateSimulation(){
  sim=sampleState(state.chapter,state.elapsed);const m=Math.round(sim.moisture);
  $('moisture').textContent=m;$('moisture-meter').style.width=`${m}%`;$('moisture-meter').style.background=sim.dry?'#d98538':'#38714e';$('soil-state').textContent=sim.dry?'Dry soil · below 30%':m<35?'Recovering toward 35–45%':'Within the 35–45% target';
  $('connection').textContent=sim.internet?'Connected':'Internet offline';$('connection').style.color=sim.internet?'#38714e':'#bc7337';$('pump-state').textContent=sim.pump?'Watering':'Standby';$('pump-state').style.color=sim.pump?'#368693':'#243b32';$('camera-state').textContent=sim.scan?'12 pods · 8 flowers':'Scheduled';$('buffer-state').textContent=`${sim.buffered} readings`;
  const elapsed=Math.min(70,state.chapter*DURATION+state.elapsed);$('tour-time').textContent=`${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(Math.floor(elapsed%60)).padStart(2,'0')} / 01:10`;
  document.querySelectorAll('#chapters button').forEach((b,i)=>b.style.setProperty('--progress',`${i<state.chapter?100:i===state.chapter?sim.progress*100:0}%`));
  scanPlane.visible=sim.scan;scanBoxes.visible=sim.scan;waterBeads.forEach(({bead})=>bead.visible=sim.pump);
  const dryColor=new THREE.Color('#a48960'),wetColor=new THREE.Color('#69543e');soilBeds.forEach(b=>b.material.color.copy(dryColor).lerp(wetColor,Math.max(0,Math.min(1,(sim.moisture-24)/18))));
  statusLamp.material.color.set(sim.internet?'#7db58a':'#e9a341');cloudLink.line.material.color.set(sim.internet?'#5e9fa0':'#b2b6a6');cloudLink.line.material.opacity=sim.internet?.5:.25;
}
const projected=new THREE.Vector3();
function updateLabels(){
  const width=renderer.domElement.clientWidth,height=renderer.domElement.clientHeight;const used=[];
  const order=[...equipment].sort((a,b)=>(b.id===state.selected?1:0)-(a.id===state.selected?1:0));
  for(const item of order){
    projected.copy(item.anchor).project(camera);const x=(projected.x*.5+.5)*width,y=(-projected.y*.5+.5)*height;
    const r={left:x-70,right:x+70,top:y-27,bottom:y+10};
    let occluded=false;
    const panels=[document.querySelector('.story')];
    if(!state.clean)panels.push($('inspector').hidden?null:$('inspector'),document.querySelector('.telemetry'));
    for(const ui of panels){if(!ui)continue;const b=ui.getBoundingClientRect();if(r.right>b.left&&r.left<b.right&&r.bottom>b.top&&r.top<b.bottom)occluded=true;}
    const overlap=used.some(b=>r.right>b.left&&r.left<b.right&&r.bottom>b.top&&r.top<b.bottom);
    const visible=state.labels&&projected.z<1&&projected.z>-1&&x>60&&x<width-60&&y>(state.clean?25:90)&&y<height-(state.clean?55:180)&&!occluded&&!overlap;
    item.button.hidden=!visible;item.button.classList.toggle('selected',state.selected===item.id);
    if(visible){item.button.style.left=`${x}px`;item.button.style.top=`${y}px`;used.push(r);}
  }
}
let uiTime=0;
function tick(dt){
  if(state.playing){state.elapsed+=dt;while(state.elapsed>=DURATION){if(state.chapter<6)setChapter(state.chapter+1,false,state.elapsed-DURATION);else{state.elapsed=DURATION;pause();if(!state.clean)toast('Tour complete. Replay or explore the field.');break;}}}
  dt=Math.min(dt,.05);
  state.time+=dt;
  if(state.roofProgress!==Number(state.roofOpen)) {
    const target = Number(state.roofOpen), step = dt/1.6;
    state.roofProgress = state.roofOpen ? Math.min(target,state.roofProgress+step) : Math.max(target,state.roofProgress-step);
    updateRoofGeometry();
    if(state.roofProgress===target) updateRoofUI();
  }
  if(cameraMove){cameraMove.t=Math.min(1,cameraMove.t+dt/2.1);const t=cameraMove.t,tween=t*t*(3-2*t);camera.position.lerpVectors(cameraMove.from,cameraMove.to,tween);controls.target.lerpVectors(cameraMove.fromTarget,cameraMove.toTarget,tween);if(t>=1)cameraMove=null;}
  controls.update(dt);
  uiTime+=dt;if(uiTime>.08){updateSimulation();uiTime=0;}
  const animate=!reducedMotion||state.playing;
  for(const r of routes){
    const active=r.name==='internet'?sim.internet:r.name==='camera'?state.chapter===4:state.chapter===2||state.chapter===5;
    r.line.visible=active||r.name==='internet'||state.chapter===0;
    r.line.material.opacity=r.name==='internet'?(sim.internet?.5:.18):active?.64:.18;
    r.particles.forEach((p,i)=>{p.visible=active&&animate;p.position.copy(r.curve.getPoint((state.time*.23+i/3)%1));});
  }
  if(sim.pump&&animate){pumpRotor.rotation.x+=dt*7;waterBeads.forEach(({bead,x,offset})=>bead.position.set(x,.28,4.4-((state.time*.35+offset)%1)*8.8));}
  if(sim.scan){scanPlane.position.z=-4.4+((state.time*.13)%1)*8.8;scanBoxes.children.forEach((b,i)=>b.visible=((state.time*2+i)%4)>1);}
  updateLabels();renderer.render(scene,camera);
}

try{init();}catch(error){console.error(error);$('loading').hidden=true;$('error').hidden=false;$('error-message').textContent=`${error.message}. Try a current Chrome or Edge browser with hardware acceleration enabled.`;}
