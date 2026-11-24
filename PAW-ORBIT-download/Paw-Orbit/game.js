class SoftwareRenderer{
constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.shadowMap={};this.last=0;this.ratio=.8}setPixelRatio(r){this.ratio=r}setSize(w,h){this.canvas.width=Math.floor(w*.65);this.canvas.height=Math.floor(h*.65)}render(scene,camera){if(performance.now()-this.last<65)return;this.last=performance.now();scene.updateMatrixWorld();camera.updateMatrixWorld();const ctx=this.ctx,w=this.canvas.width,h=this.canvas.height;ctx.fillStyle='#080e18';ctx.fillRect(0,0,w,h);const vp=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),triangles=[];const v=new T.Vector3();if(exteriorSky.visible){
  ctx.fillStyle='#dce8ff';const positions=deckStars.geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
    v.fromBufferAttribute(positions,i).applyMatrix4(vp);
    if(v.z>0&&v.z<1&&Math.abs(v.x)<1&&Math.abs(v.y)<1)ctx.fillRect((v.x+1)*w/2,(1-v.y)*h/2,i%8?1:2,i%8?1:2);
  }
}scene.traverse(o=>{if(!o.isMesh)return;let q=o;while(q){if(!q.visible)return;q=q.parent}if(o.material.transparent)return;const g=o.geometry,a=g.attributes.position,idx=g.index, count=idx?idx.count:a.count, m=new T.Matrix4().multiplyMatrices(vp,o.matrixWorld),color=o.material.color;for(let i=0;i<count;i+=3){const pts=[];let z=0,skip=false;for(let j=0;j<3;j++){v.fromBufferAttribute(a,idx?idx.getX(i+j):i+j).applyMatrix4(m);if(v.z>1||v.z< -1)skip=true;pts.push([(v.x+1)*w/2,(1-v.y)*h/2]);z+=v.z}if(skip)continue;const cross=(pts[1][0]-pts[0][0])*(pts[2][1]-pts[0][1])-(pts[1][1]-pts[0][1])*(pts[2][0]-pts[0][0]);if(cross>=0)continue;const shade=o.userData.continuousSuit?.78+.16*new T.Vector3().fromBufferAttribute(g.attributes.normal,idx?idx.getX(i):i).transformDirection(o.matrixWorld).dot(new T.Vector3(.4,.7,.6).normalize()):.65+(i%9)*.025,faceColor=g.attributes.color?new T.Color().fromBufferAttribute(g.attributes.color,idx?idx.getX(i):i):color;triangles.push({pts,z:z/3,smooth:!!o.userData.continuousSuit,c:'#'+[faceColor.r,faceColor.g,faceColor.b].map(x=>Math.round(Math.min(1,Math.pow(x,1/2.2)*shade)*255).toString(16).padStart(2,'0')).join('')})}});triangles.sort((a,b)=>b.z-a.z);for(const t of triangles){ctx.fillStyle=t.c;ctx.beginPath();ctx.moveTo(...t.pts[0]);ctx.lineTo(...t.pts[1]);ctx.lineTo(...t.pts[2]);ctx.closePath();ctx.fill();if(t.smooth){ctx.strokeStyle=t.c;ctx.lineWidth=.6;ctx.stroke()}}scene.traverse(o=>{if(!o.userData.sign)return;const point=o.getWorldPosition(new T.Vector3()),normal=new T.Vector3(0,0,1).transformDirection(o.matrixWorld),toCamera=camera.position.clone().sub(point);if(normal.dot(toCamera)<0)return;const ray=new T.Raycaster(camera.position,toCamera.clone().negate().normalize(),.05,toCamera.length()-.3);if(ray.intersectObjects([...enclosure,...doors.flatMap(d=>d.panels)],false).length)return;const p=point.clone().project(camera);if(p.z>1||Math.abs(p.x)>1.2||Math.abs(p.y)>1.2)return;const left=o.localToWorld(new T.Vector3(-1.1,0,0)).project(camera),right=o.localToWorld(new T.Vector3(1.1,0,0)).project(camera),sw=Math.max(20,Math.hypot((right.x-left.x)*w/2,(right.y-left.y)*h/2)),sh=sw*.25,px=(p.x+1)*w/2,py=(1-p.y)*h/2;ctx.fillStyle=o.userData.floorLabel?'#000000':'#080d12';ctx.fillRect(px-sw/2,py-sh/2,sw,sh);ctx.strokeStyle=o.userData.floorLabel?'#ffffff':'#9abeb7';ctx.strokeRect(px-sw/2,py-sh/2,sw,sh);ctx.font=Math.max(8,Math.min(sh*.65,sw/(o.userData.sign.length+1)))+'px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#ffffff';ctx.fillText(o.userData.sign,px,py,sw*.92)})}}

import * as T from './three.module.js';
const $=s=>document.querySelector(s);let canvas=$('#world');let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:false})}catch{const fresh=canvas.cloneNode();canvas.replaceWith(fresh);canvas=fresh;renderer=new SoftwareRenderer(canvas)}renderer.setPixelRatio(.8);renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
const scene=new T.Scene();scene.background=new T.Color('#070d18');scene.fog=new T.FogExp2('#070d18',.007);const camera=new T.PerspectiveCamera(70,innerWidth/innerHeight,.1,250);scene.add(new T.HemisphereLight(0xb3d2ef,0x393042,1.15));const sun=new T.DirectionalLight(0xffdfba,2);sun.position.set(-10,25,15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-40,right:40,top:40,bottom:-40});scene.add(sun);
function mat(c,em){return new T.MeshStandardMaterial({color:c,roughness:.9,flatShading:true,...(em?{emissive:c,emissiveIntensity:em}:{})})}const mats={floor:mat('#3b4854'),edge:mat('#192932'),wall:mat('#6e7980'),white:mat('#c4c6bb'),dark:mat('#202b35'),cyan:mat('#83cfc4',.7),amber:mat('#e6b572',.5),green:mat('#558a66')};
function box(x,y,z,w,h,d,m,parent=scene){const o=new T.Mesh(new T.BoxGeometry(w,h,d,Math.max(1,Math.ceil(w/2)),Math.max(1,Math.ceil(h/2)),Math.max(1,Math.ceil(d/2))),typeof m==='string'?mat(m):m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}function ball(x,y,z,r,m,parent=scene,seg=8){const o=new T.Mesh(new T.SphereGeometry(r,seg,6),typeof m==='string'?mat(m):m);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o}function cyl(x,y,z,r,h,m,parent=scene){const o=new T.Mesh(new T.CylinderGeometry(r,r,h,16),m);o.position.set(x,y,z);o.receiveShadow=true;parent.add(o);return o}
// Small pixel textures, baked locally onto low polygon geometry.
const tx=document.createElement('canvas');tx.width=tx.height=32;const cx=tx.getContext('2d');cx.fillStyle='#46525c';cx.fillRect(0,0,32,32);for(let i=0;i<150;i++){cx.fillStyle=i%2?'#4b5760':'#414d57';cx.fillRect(Math.random()*32|0,Math.random()*32|0,1,1)}cx.strokeStyle='#263641';cx.strokeRect(0,0,32,32);const texture=new T.CanvasTexture(tx);texture.magFilter=T.NearestFilter;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(8,8);mats.floor.map=texture;
const rooms=[{name:'중앙 통로',x:0,z:0,w:19,d:19,round:true},{name:'설비실',x:0,z:-17,w:22,d:8},{name:'손님방',x:-19,z:-10,w:11,d:8},{name:'재배실 · 부엌',x:-19,z:0,w:13,d:10},{name:'주인공 방',x:-18,z:11,w:12,d:8},{name:'화물실',x:0,z:17,w:13,d:8},{name:'관측실',x:19,z:0,w:10,d:16},{name:'도킹 입구',x:20,z:14,w:11,d:7}];const corridors=[[-10,-8,9,3],[-10,0,9,3],[-10,8,9,3],[0,-11,3,7],[0,11,3,7],[11,0,8,3],[20,9,3,5]];const walk=[];
function label(){} // Room names appear on doorway signs, never scattered on floors.
function doorSign(parent,name){const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle='#090e13';x.fillRect(0,0,512,128);x.strokeStyle='#93bbb7';x.lineWidth=3;x.strokeRect(5,5,502,118);x.font='bold 38px monospace';x.textAlign='center';x.fillStyle='#ffffff';x.fillText(name,256,79,470);const t=new T.CanvasTexture(c);for(const side of[-1,1]){const p=new T.Mesh(new T.PlaneGeometry(2.2,.55),new T.MeshBasicMaterial({map:t}));p.userData.sign=name;p.position.set(0,3.15,side*.245);if(side<0)p.rotation.y=Math.PI;parent.add(p)}}
for(const r of rooms){walk.push(r);if(r.round)cyl(r.x,-.25,r.z,10,.5,mats.floor);else box(r.x,-.25,r.z,r.w,.5,r.d,mats.floor);label(r.name,r.x,r.z+r.d/2-1);const l=new T.PointLight(0xbadce8,20,13,2);l.position.set(r.x,4,r.z);scene.add(l)}for(const [x,z,w,d]of corridors){box(x,-.23,z,w,.45,d,mats.floor);walk.push({x,z,w,d})}
cyl(0,.25,0,3.2,.5,mats.edge);const obstacles=[{x:0,z:0,w:6.2,d:6.2}];cyl(0,.65,0,2.6,.35,mats.dark);for(let i=0;i<8;i++){const a=i*Math.PI/4;const o=box(Math.sin(a)*2.2,1,Math.cos(a)*2.2,1.15,.1,.65,mats.cyan);o.rotation.y=a}ball(0,2,0,.7,mats.cyan);label('通信 / CONTROL',0,4.5);
const stars=new Float32Array(1800);for(let i=0;i<1800;i+=3){stars[i]=(Math.random()-.5)*220;stars[i+1]=10+Math.random()*70;stars[i+2]=(Math.random()-.5)*220}const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(stars,3));scene.add(new T.Points(sg,new T.PointsMaterial({color:0xc7d9ef,size:.13})));const planet=ball(45,8,-32,12,'#4b7186',scene,16);const ring=new T.Mesh(new T.RingGeometry(15,20,48),new T.MeshBasicMaterial({color:0x8d968f,side:T.DoubleSide,transparent:true,opacity:.4}));ring.position.copy(planet.position);ring.rotation.set(1.1,.3,.3);scene.add(ring);
// Furnishings, deliberately low and open so the cat remains visible.
for(let i=0;i<5;i++){box(-8+i*4,1,-18,2.6,2,1.4,mats.dark);for(let j=0;j<3;j++)box(-8+i*4,.55+j*.48,-17.27,1.9,.08,.04,j===1?mats.amber:mats.cyan)}
const plants=[];for(let i=0;i<4;i++){box(-23+i*2, .4,-2,1.5,.8,2,mats.white);box(-23+i*2,.83,-2,1.25,.1,1.7,'#302b25');const g=new T.Group();g.position.set(-23+i*2,.85,-2);scene.add(g);for(let j=0;j<3;j++){const leaf=ball((j-1)*.27,.35,-.2, .4,mats.green,g);leaf.scale.set(.5,1.4,.7)}plants.push(g)}
box(-19,.7,3,8,1.4,1.2,mats.white);box(-19,1.45,3,8,.1,1.4,mats.dark);cyl(-21,1.6,3,.35,.3,mats.amber);box(-16,1.8,3,.7,.7,.7,mats.dark);
function bed(x,z,color){box(x,.3,z,2.3,.6,3.5,mats.dark);box(x,.7,z,2,.25,3.2,color);box(x,.9,z-1,1.6,.3,.65,mats.white)}bed(-20,11,'#647c85');bed(-21,-10,'#93836d');box(-15,.8,12,1,1.6,2,mats.white);
const table=cyl(17,.8,2,1.25,.16,mats.white);for(const x of[15,19]){box(x,.4,2,.8,.8,.8,mats.dark);box(x,1,2.4,.8,.8,.15,mats.white)}box(22,.3,-4,1.4,.6,3,mats.dark);box(22,.7,-4,1.4,.2,3,'#827f79');const scope=cyl(18,1,-5,.16,2,mats.white);const tube=box(18,2,-5,.7,.7,2,mats.dark);tube.rotation.x=-.5;ball(18,2.4,-5.9,.35,mats.cyan);
for(let i=0;i<5;i++){box(-4+i*2,.5,18,1.4,1,1.4,i%2?mats.white:mat('#8c7657'));box(-4+i*2,1.02,18,.15,.03,1.4,mats.dark)}box(20,.05,16,4,.08,.15,mats.amber);label('AIRLOCK / 01',20,14);
function faceTexture(kind){const c=document.createElement('canvas');c.width=64;c.height=64;const x=c.getContext('2d');x.fillStyle=kind==='black'?'#151e2a':kind==='gray'?'#8f969e':'#e6bc79';x.fillRect(0,0,64,64);if(kind==='tabby'){x.fillStyle='#b57d45';for(const a of[15,29,43])x.fillRect(a,0,5,18);x.fillStyle='#f1dbac';x.fillRect(3,34,58,30)}if(kind==='tortie'){x.fillStyle='#403a36';x.fillRect(0,0,26,38);x.fillRect(40,28,24,36);x.fillStyle='#d98e40';x.fillRect(25,0,39,26);x.fillRect(0,38,24,26)}if(kind==='gray'){x.fillStyle='#e3e0d9';x.beginPath();x.moveTo(32,14);x.lineTo(42,43);x.lineTo(64,47);x.lineTo(64,64);x.lineTo(0,64);x.lineTo(0,47);x.lineTo(23,43);x.closePath();x.fill()}x.fillStyle=kind==='black'?'#a4c5cc':'#352b26';x.fillRect(17,28,5,6);x.fillRect(42,28,5,6);x.fillRect(30,38,4,3);x.fillRect(26,41,3,4);x.fillRect(35,41,3,4);x.fillRect(29,44,6,2);for(const a of[0,5]){x.fillRect(9,39+a,9,2);x.fillRect(46,39+a,9,2)}const t=new T.CanvasTexture(c);t.magFilter=T.NearestFilter;t.minFilter=T.NearestFilter;return t}
function surfacePart(geometry,predicate){const a=geometry.toNonIndexed(),pos=a.attributes.position,arr=[];for(let i=0;i<pos.count;i+=3){const z=(pos.getZ(i)+pos.getZ(i+1)+pos.getZ(i+2))/3;if(predicate(z))for(let j=0;j<3;j++)arr.push(pos.getX(i+j),pos.getY(i+j),pos.getZ(i+j))}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(arr,3));g.computeVertexNormals();return g}
function earSurface(values){const a=new T.Vector3(...values.slice(0,3)),b=new T.Vector3(...values.slice(3,6)),c=new T.Vector3(...values.slice(6,9)),positions=[],n=8;const point=(i,j)=>a.clone().addScaledVector(b.clone().sub(a),i/n).addScaledVector(c.clone().sub(a),j/n);const triangle=(p,q,r)=>positions.push(...p.toArray(),...q.toArray(),...r.toArray());for(let i=0;i<n;i++)for(let j=0;j<n-i;j++){triangle(point(i,j),point(i+1,j),point(i,j+1));if(i+j<n-1)triangle(point(i+1,j),point(i+1,j+1),point(i,j+1))}const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();return geometry}
function paintCatHead(head,color,kind){if(kind!=='tabby')return;const geom=new T.SphereGeometry(.70,24,16).toNonIndexed(),positions=geom.attributes.position,colors=[];const fur=new T.Color(color),stripe=new T.Color('#97683f');for(let i=0;i<positions.count;i+=3){const x=(positions.getX(i)+positions.getX(i+1)+positions.getX(i+2))/3,y=(positions.getY(i)+positions.getY(i+1)+positions.getY(i+2))/3,z=(positions.getZ(i)+positions.getZ(i+1)+positions.getZ(i+2))/3;const forehead=z>.22&&y>.23&&y<.61&&[-.22,0,.22].some(c=>Math.abs(x-c)<.043+(y-.23)*.07);const side=Math.abs(x)>.43&&z>.08&&[-.08,.10,.27].some(c=>Math.abs(y-c)<.04);const c=forehead||side?stripe:fur;for(let k=0;k<3;k++)colors.push(c.r,c.g,c.b)}geom.setAttribute('color',new T.Float32BufferAttribute(colors,3));head.geometry.dispose();geom.computeBoundingSphere();head.geometry=geom;head.material=head.material.clone();head.material.color.set('#ffffff');head.material.vertexColors=true;head.userData.paintedStripes=true}
function updateSuitNormals(geometry){
  geometry.computeVertexNormals();
  const position=geometry.attributes.position,normals=geometry.attributes.normal;
  if(!geometry.userData.normalGroups){
    const groups=new Map();
    for(let i=0;i<position.count;i++){
      const key=[position.getX(i),position.getY(i),position.getZ(i)].map(n=>n.toFixed(5)).join(',');
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(i);
    }
    geometry.userData.normalGroups=[...groups.values()];
  }
  const smooth=new T.Vector3(),face=new T.Vector3(),result=new T.Vector3();
  for(const group of geometry.userData.normalGroups){
    const facet=T.MathUtils.smoothstep(position.getY(group[0]),.45,.62);
    if(facet===1)continue;
    smooth.set(0,0,0);
    for(const i of group)smooth.add(face.fromBufferAttribute(normals,i));
    smooth.normalize();
    for(const i of group){
      result.copy(smooth).lerp(face.fromBufferAttribute(normals,i),facet).normalize();
      normals.setXYZ(i,result.x,result.y,result.z);
    }
  }
  normals.needsUpdate=true;
}
const catLegBase=.09;
const catLegHeight=y=>catLegBase+(y-catLegBase)*2/3;
const catLegPivot=catLegHeight(.45);
function suitGeometry(){
  const vertices=[];
  const triangle=(a,b,c)=>vertices.push(...a,...b,...c);
  const connect=(upper,lower)=>{
    for(let i=0;i<upper.length;i++){
      const next=(i+1)%upper.length;
      triangle(upper[i],upper[next],lower[i]);
      triangle(upper[next],lower[next],lower[i]);
    }
  };
  const cap=(ring,center,top)=>{
    for(let i=0;i<ring.length;i++){
      const next=(i+1)%ring.length;
      if(top)triangle(center,ring[next],ring[i]);
      else triangle(center,ring[i],ring[next]);
    }
  };

  // Broad facets wrap around the belly, with narrower rings at the collar and hips.
  const torso=[
    [1.46,.29,.21,0],
    [1.29,.37,.275,.015],
    [1.02,.435,.33,.035],
    [.78,.405,.307,.045],
    [.53,.325,.24,.025],
    [catLegHeight(.46),.235,.183,0],
  ].map(([y,width,depth,offset])=>Array.from({length:12},(_,i)=>{
    const angle=i*Math.PI/6;
    return [width*Math.cos(angle),y,offset+depth*Math.sin(angle)];
  }));
  cap(torso[0],[0,1.46,0],true);
  for(let i=1;i<torso.length;i++)connect(torso[i-1],torso[i]);

  // The two leg loops share the same crotch edges, keeping the suit a single surface.
  const hip=torso.at(-1),crotch=[0,catLegHeight(.36),0];
  for(const side of[1,-1]){
    const start=side===1?9:3;
    const upper=Array.from({length:7},(_,i)=>hip[(start+i)%12]);
    upper.push(crotch);
    const legRing=(y,width,depth)=>Array.from({length:8},(_,i)=>{
      const angle=(i-3)*Math.PI/4;
      return [side*(.14+width*Math.cos(angle)),y,side*depth*Math.sin(angle)];
    });
    const shin=legRing(catLegHeight(.28),.09,.135),ankle=legRing(catLegBase,.074,.107);
    connect(upper,shin);
    connect(shin,ankle);
    cap(ankle,[side*.14,.09,0],false);
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  updateSuitNormals(geometry);
  geometry.computeBoundingSphere();
  return geometry;
}
function continuousSuit(material,g){
  const suitMaterial=material.clone();
  suitMaterial.flatShading=false;
  const mesh=new T.Mesh(suitGeometry(),suitMaterial);
  mesh.castShadow=true;
  mesh.userData.continuousSuit=true;
  mesh.userData.restVertices=mesh.geometry.attributes.position.array.slice();
  g.add(mesh);
  g.userData.suitMesh=mesh;
  return mesh;
}
function deformSuit(g){const mesh=g.userData.suitMesh;if(!mesh)return;const angles=g.userData.limbs.map(l=>l.leg.rotation.x);if(mesh.userData.lastAngles?.every((a,i)=>a===angles[i]))return;mesh.userData.lastAngles=angles;const attr=mesh.geometry.attributes.position,rest=mesh.userData.restVertices;for(let i=0;i<attr.count;i++){const x=rest[i*3],y=rest[i*3+1],z=rest[i*3+2],limb=g.userData.limbs[x<0?0:1],weight=T.MathUtils.clamp((catLegHeight(.50)-y)/(.16*2/3),0,1),a=limb.leg.rotation.x*weight*T.MathUtils.smoothstep(Math.abs(x),0,.055),dy=y-catLegPivot;attr.setXYZ(i,x,catLegPivot+dy*Math.cos(a)-z*Math.sin(a),dy*Math.sin(a)+z*Math.cos(a))}attr.needsUpdate=true;updateSuitNormals(mesh.geometry)}
function addSuitSeams(body){
  const paths=[
    [[-.34,1.15],[-.24,1.09],[-.17,1.07]],
    [[.17,1.07],[.26,1.10],[.34,1.15]],
    [[-.03,1.04],[.12,1.03],[.13,1.11]],
    [[-.14,.96],[.12,.96],[.23,.81],[.34,.74]],
  ];
  const seamMaterial=mat('#4e5a62');
  const ray=new T.Raycaster(new T.Vector3(),new T.Vector3(0,0,-1));
  for(const path of paths){
    const points=[];
    for(let i=1;i<path.length;i++){
      const [x0,y0]=path[i-1], [x1,y1]=path[i];
      for(let step=i===1?0:1;step<=5;step++){
        const x=T.MathUtils.lerp(x0,x1,step/5),y=T.MathUtils.lerp(y0,y1,step/5);
        ray.ray.origin.set(x,y,1);
        const hit=ray.intersectObject(body,false)[0];
        if(hit)points.push(hit.point.add(new T.Vector3(0,0,.011)));
      }
    }
    if(points.length>1){
      const curve=new T.CatmullRomCurve3(points);
      body.add(new T.Mesh(new T.TubeGeometry(curve,points.length*2,.012,4,false),seamMaterial));
    }
  }
}
function cat(color,patch=false){const g=new T.Group(),kind=color==='#202631'?'black':color==='#8f959c'?'gray':color==='#b87942'?'tortie':'tabby';g.userData.kind=kind;const fur=mat(color),suit=kind==='black'?mat('#37363e'):mats.white;const trim=kind==='black'?mat('#74818a'):mats.white;const body=continuousSuit(suit,g);addSuitSeams(body);const collar=new T.Mesh(new T.CylinderGeometry(.41,.36,.11,12),trim);collar.position.y=1.43;collar.scale.z=.79;g.add(collar);const pack=ball(0,1.1,-.39,.4,kind==='black'?trim:mats.dark,g);pack.scale.set(.7,1.05,.46);for(const x of[-.21,.21])cyl(x,1.12,-.51,.11,.6,trim,g);
const head=ball(0,1.94,.02,.70,fur,g,12);head.scale.set(1,.96,.92);head.userData.fittedHead=true;paintCatHead(head,color,kind);
for(const side of[-1,1]){const cover=new T.Mesh(new T.ConeGeometry(.28,.55,4),suit);cover.position.set(side*.48,2.72,-.015);cover.rotation.y=Math.PI/4;cover.userData.earCover=true;g.add(cover);const x=side*.40;const vertices=[x-.15,2.22,.35,x+.15,2.22,.35,side*.48,2.80,-.015];const earGeometry=earSurface(vertices);const ear=new T.Mesh(earGeometry,new T.MeshStandardMaterial({color,side:T.DoubleSide,flatShading:true,roughness:1}));ear.userData.insideHelmetEar=true;g.add(ear);const innerGeometry=earSurface([x-.08,2.29,.303,x+.08,2.29,.303,side*.478,2.72,.016]);const inner=new T.Mesh(innerGeometry,new T.MeshStandardMaterial({color:'#b8868b',side:T.DoubleSide,roughness:1}));inner.userData.insideHelmetInnerEar=true;g.add(inner)}
const faceStart=g.children.length;
const muzzle=ball(0,1.76,.445,.32,kind==='black'?'#252d39':'#e9d6b5',g,10);muzzle.scale.set(1.4,.65,.32);const ink=kind==='black'?'#a4c5cc':'#352b26';for(const x of[-.21,.21]){const eye=ball(x,1.99,.475,.055,ink,g);eye.userData.expressionEye=true;}ball(0,1.81,.55,.038,ink,g);for(const x of[-.08,.08]){const m=box(x,1.75,.555,.1,.025,.02,ink,g);m.rotation.z=x<0?-.3:.3;m.userData.expressionMouth=true}for(const x of[-.35,.35])for(const y of[1.78,1.85]){const whisker=box(x,y,.51,.17,.018,.015,ink,g);whisker.rotation.z=x<0?-.15:.15}if(kind==='tortie'){const p=ball(-.32,2.16,.31,.22,'#403a36',g);p.scale.z=.4;ball(.4,1.76,.32,.16,'#403a36',g)}if(kind==='gray'){const p=ball(0,1.8,.47,.21,'#e2e0d6',g);p.scale.set(.7,1.7,.2)}
const faceParts=g.children.slice(faceStart);const faceGroup=new T.Group();faceGroup.position.set(0,1.94,.02);g.add(faceGroup);for(const part of faceParts){g.remove(part);part.position.sub(faceGroup.position);faceGroup.add(part)}faceGroup.scale.set(1.07,1.04,1.28);faceGroup.userData.faceGroup=true;
// A round enclosing shell with a circular curved window; no flat face image.
const shell=new T.Mesh(surfacePart(new T.SphereGeometry(.82,16,12),z=>z<.46),suit);shell.position.set(0,1.96,0);g.add(shell);const rim=new T.Mesh(new T.TorusGeometry(.675,.065,5,20),mats.dark);rim.position.set(0,1.96,.46);g.add(rim);const glassMaterial=new T.MeshStandardMaterial({color:'#a9d5df',transparent:true,opacity:.13,roughness:.12,metalness:.05,depthWrite:false,side:T.DoubleSide});const glass=new T.Mesh(surfacePart(new T.SphereGeometry(.825,16,12),z=>z>=.45),glassMaterial);glass.position.set(0,1.96,0);g.add(glass);const glint=new T.Mesh(new T.TorusGeometry(.58,.018,3,10,Math.PI*.32),mats.cyan);glint.position.set(-.03,2.02,.59);glint.rotation.z=.7;g.add(glint);for(const x of[-.82,.82]){const side=ball(x,1.96,0,.16,suit,g);side.scale.set(.5,1,1)}
const limbs=[];
for(const side of[-1,1]){
  const arm=new T.Group();
  arm.position.set(side*.29,1.12,0);
  arm.rotation.z=side*.38;
  g.add(arm);
  const sleeve=ball(0,-.215,0,.13,suit,arm);
  sleeve.scale.set(1,2.2,1);
  ball(0,-.54,.015,.07,kind==='black'?mats.dark:fur,arm);
  const leg=new T.Group();leg.position.set(side*.145,catLegPivot,0);leg.rotation.z=0;g.add(leg);const boot=ball(0,.13-catLegPivot,.18,.10,kind==='black'?trim:mats.dark,leg);boot.scale.set(.85,.75,1.15);boot.userData.roundPaw=true;for(const toe of[-1,0,1])ball(toe*.035,.13-catLegPivot,.26,.027,suit,leg);leg.userData.tapered=true;limbs.push({arm,leg,side})}g.userData.limbs=limbs;g.userData.lastPosition=new T.Vector3();if(kind==='black')for(const x of[-.23,.23]){box(x,1.8,-.58,.06,.8,.06,mats.dark,g);ball(x,2.2,-.58,.08,trim,g)}scene.add(g);return g}
function animateCat(g,dt){if(!g.userData.limbs)return;const prev=g.userData.lastPosition,dist=Math.hypot(g.position.x-prev.x,g.position.z-prev.z),moving=dist>.001&&dist<1;g.userData.step=(g.userData.step||0)+(moving?dt*11:0);const wave=moving?Math.sin(g.userData.step)*.65:0;for(const limb of g.userData.limbs){limb.arm.rotation.x=T.MathUtils.damp(limb.arm.rotation.x,wave*limb.side,14,dt);limb.leg.rotation.x=T.MathUtils.damp(limb.leg.rotation.x,-wave*limb.side,14,dt)}deformSuit(g);prev.copy(g.position)}
const player=cat('#d6a35e',true);player.position.set(-17,0,10);player.rotation.y=Math.PI/2;
function eye(g,x,y,z,r=.18){ball(x,y,z,r,'#e3e4ca',g);const iris=ball(x,y,z+r*.8,r*.65,'#262a40',g),shine=ball(x-.04,y+.05,z+r*1.35,r*.2,mats.white,g);if(r>.15){iris.userData.expressionEye=true;shine.userData.expressionEye=true}}
function alien(type){const g=new T.Group();if(type===0){const mossLimbs=[];const teal=mat('#328e88'),lime=mat('#acd44e'),cream=mat('#dad7b7'),purple=mat('#34334d');const body=ball(0,.75,0,.57,teal,g,12);body.scale.set(.9,1.15,.8);const belly=ball(0,.7,.37,.37,cream,g,12);belly.scale.set(.85,1.2,.3);const h=ball(0,1.68,0,.76,lime,g,14);h.scale.set(1.08,.86,.8);
// Soft three-lobed side fins from the reference, instead of spherical ears.
for(const side of[-1,1]){const sh=new T.Shape();sh.moveTo(.55,1.3);sh.bezierCurveTo(.92,1.12,.97,1.28,.85,1.45);sh.bezierCurveTo(1.17,1.55,1.12,1.73,.88,1.76);sh.bezierCurveTo(1.03,2.08,.8,2.12,.61,1.96);sh.lineTo(.55,1.3);const fin=new T.Mesh(new T.ExtrudeGeometry(sh,{depth:.12,bevelEnabled:false,curveSegments:3}),teal);fin.scale.x=side;fin.position.z=-.08;g.add(fin);const curve=new T.CatmullRomCurve3([new T.Vector3(side*.3,2.18,0),new T.Vector3(side*.36,2.48,0),new T.Vector3(side*.54,2.68,.01)]);g.add(new T.Mesh(new T.TubeGeometry(curve,6,.075,6,false),teal));ball(side*.54,2.68,.01,.18,lime,g,10);ball(side*.56,2.74,.14,.065,'#f2f0b9',g);const armPivot=new T.Group();armPivot.position.set(side*.43,1.04,.03);g.add(armPivot);const arm=ball(side*.04,-.14,.06,.18,teal,armPivot);arm.scale.set(.8,1.5,.8);ball(side*.05,-.29,.19,.12,lime,armPivot);const legPivot=new T.Group();legPivot.position.set(side*.3,.35,0);g.add(legPivot);const foot=ball(0,-.17,.12,.24,teal,legPivot);foot.scale.set(1.1,.65,1.3);ball(0,-.15,.34,.13,lime,legPivot);mossLimbs.push({arm:armPivot,leg:legPivot,side})}
function mossEye(x,y,z,r){const start=g.children.length;const socket=ball(x,y,z,r,purple,g,12);socket.scale.z=.45;ball(x-.04,y+.07,z+r*.42,r*.24,'#f1f0db',g);const low=ball(x+.03,y-.08,z+r*.39,r*.5,'#65628d',g);low.scale.z=.18;if(r>.2)for(const part of g.children.slice(start))part.userData.expressionEye=true}
mossEye(-.29,1.73,.54,.255);mossEye(.33,1.73,.54,.225);mossEye(.05,2.04,.48,.135);mossEye(-.57,1.46,.35,.095);const chin=ball(.02,1.35,.43,.35,cream,g);chin.scale.set(1.3,.48,.3);const mouth=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(-.12,1.46,.61),new T.Vector3(0,1.49,.64),new T.Vector3(.12,1.46,.61)]),5,.018,4,false),teal);mouth.userData.expressionMouth=true;g.add(mouth);
const tailCurve=new T.CatmullRomCurve3([new T.Vector3(.32,.4,-.27),new T.Vector3(.85,.5,-.5),new T.Vector3(1.11,.88,-.45),new T.Vector3(.98,1.2,-.35),new T.Vector3(.72,1.16,-.28)]);g.add(new T.Mesh(new T.TubeGeometry(tailCurve,12,.19,7,false),teal));ball(.72,1.16,-.28,.18,lime,g);for(const [x,y,z,r]of[[-.4,2.12,.27,.15],[.43,2.02,.37,.13],[-.18,1.13,.4,.07],[.24,.57,.4,.07],[.96,.81,-.28,.1]]){const p=ball(x,y,z,r,x>.7?lime:teal,g);p.scale.z=.28}
const collar=cyl(0,1.19,0,.47,.15,mats.dark,g);box(.05,1.19,.46,.24,.14,.1,mats.amber,g);const strap=box(-.12,.86,.45,.095,.71,.06,'#555c5d',g);strap.rotation.z=-.6;const bag=ball(-.54,.55,.3,.23,mats.dark,g);bag.scale.set(.9,1,.5);box(-.54,.61,.43,.11,.09,.03,mats.amber,g);
g.userData.limbs=mossLimbs;g.userData.lastPosition=new T.Vector3();}else if(type===1){
const ivory=mat('#eee3d0'),lavender=mat('#bca2d5'),mint=mat('#9dd5cf'),pink=mat('#e0b7d5'),purple=mat('#574d73'),gold=mat('#e2bd6c');
// Rounded, single-piece body: the reference has no separate head or neck.
const shape=new T.Shape(),w=1.12,h=1.24,r=.23;shape.moveTo(-w/2+r,-h/2);shape.lineTo(w/2-r,-h/2);shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);shape.lineTo(w/2,h/2-r);shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2);shape.lineTo(-w/2+r,h/2);shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);shape.lineTo(-w/2,-h/2+r);shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
const body=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.63,bevelEnabled:true,bevelThickness:.16,bevelSize:.16,bevelSegments:3,curveSegments:5}),ivory);body.position.set(0,1.14,-.315);body.castShadow=true;body.userData.lumiBody=true;g.add(body);
const spot=(x,y,z,rx,ry,color)=>{const o=ball(x,y,z,1,color,g,12);o.scale.set(rx,ry,.024);o.userData.lumiSpot=true;return o};
spot(-.43,1.76,.43,.17,.12,lavender);spot(-.22,1.86,.43,.12,.07,mint);spot(.37,1.81,.43,.21,.11,mint);spot(.51,1.64,.47,.10,.17,lavender);spot(-.52,1.43,.48,.11,.14,mint);spot(-.44,.98,.49,.15,.13,pink);spot(.43,.93,.49,.19,.12,lavender);spot(-.17,.53,.48,.28,.10,mint);spot(.25,.45,.41,.14,.07,pink);
const lumiLimbs=[];
for(const side of[-1,1]){const curve=new T.CatmullRomCurve3([new T.Vector3(side*.54,1.8,-.04),new T.Vector3(side*.77,1.62,.01),new T.Vector3(side*.89,1.36,.07),new T.Vector3(side*.79,1.27,.13)]);const ear=new T.Mesh(new T.TubeGeometry(curve,10,.185,8,false),lavender);ear.userData.lumiEar=true;ear.castShadow=true;g.add(ear);ball(side*.79,1.27,.13,.185,lavender,g,10);spot(side*.87,1.4,.24,.10,.14,mint);const arm=new T.Group();arm.position.set(side*.62,.98,.34);g.add(arm);
const hand=ball(0,-.15,.05,.13,ivory,arm,10);hand.scale.set(.85,1.1,.65);
const leg=new T.Group();leg.position.set(side*.30,.46,.02);g.add(leg);
const foot=ball(0,-.24,0,.18,ivory,leg,10);foot.scale.set(.9,.85,1.05);
lumiLimbs.push({arm,leg,side});
}
g.userData.limbs=lumiLimbs;g.userData.lastPosition=new T.Vector3();
// One oversized glossy eye, with the dark blue-violet iris from the sheet.
const sclera=ball(0,1.43,.50,.43,ivory,g,16);sclera.scale.z=.30;sclera.userData.keepOnSmile=true;const iris=ball(0,1.43,.635,.345,'#45445f',g,16);iris.scale.z=.48;const irisBottom=ball(.065,1.29,.79,.17,'#5b6b88',g,12);irisBottom.scale.set(1,.65,.12);const shine=ball(-.11,1.58,.80,.12,'#fff9e3',g,12);shine.scale.z=.2;const shineSmall=ball(.12,1.34,.808,.045,'#e5eee0',g,10);shineSmall.scale.z=.2;for(const part of[iris,irisBottom,shine,shineSmall])part.userData.expressionEye=true;
const belt=new T.Mesh(new T.TorusGeometry(.65,.055,5,24),purple);belt.position.set(0,.67,0);belt.rotation.x=Math.PI/2;belt.scale.set(1.1,.9,1);g.add(belt);const badge=new T.Mesh(new T.TorusGeometry(.155,.037,5,18),gold);badge.position.set(0,.67,.67);g.add(badge);const jewel=ball(0,.67,.69,.13,mint,g,12);jewel.scale.z=.45;ball(-.035,.71,.75,.045,'#f7fae6',g,10);
const antenna=new T.CatmullRomCurve3([new T.Vector3(0,1.94,0),new T.Vector3(.015,2.13,0),new T.Vector3(.07,2.30,0)]);g.add(new T.Mesh(new T.TubeGeometry(antenna,8,.038,6,false),purple));const starShape=new T.Shape();for(let n=0;n<10;n++){const angle=Math.PI/2+n*Math.PI/5,rad=n%2?.105:.205,x=Math.cos(angle)*rad,y=Math.sin(angle)*rad;if(n===0)starShape.moveTo(x,y);else starShape.lineTo(x,y)}starShape.closePath();const star=new T.Mesh(new T.ExtrudeGeometry(starShape,{depth:.065,bevelEnabled:true,bevelThickness:.018,bevelSize:.018,bevelSegments:1}),gold);star.position.set(.07,2.34,-.03);star.userData.lumiStar=true;g.add(star);
const tailCurve=new T.CatmullRomCurve3([new T.Vector3(.55,.52,-.2),new T.Vector3(.84,.47,-.37),new T.Vector3(1.01,.62,-.28),new T.Vector3(.98,.77,-.10)]);const tail=new T.Mesh(new T.TubeGeometry(tailCurve,12,.055,6,false),purple);tail.userData.lumiTail=true;g.add(tail);ball(.98,.77,-.10,.15,mint,g,12);
g.userData.lumi=true;
}else{const b=ball(0,.67,0,.83,'#4eaaa0',g);b.scale.set(1,1,.8);ball(0,1.5,0,.76,'#5eafa2',g);for(const x of[-.65,0,.65]){const l=ball(x,.18,0,.35,'#797bac',g);l.scale.y=.5}for(const [x,y,r]of[[-.3,1.6,.22],[.33,1.56,.19],[0,1.95,.14],[-.56,1.25,.11],[.55,1.23,.1]])eye(g,x,y,.53,r);for(const [x,y]of[[-.65,1.7],[.57,1.9],[-.45,.55]])ball(x,y,0,.21,'#8176aa',g);box(-.42,.65,.6,.5,.45,.22,'#81785d',g);const strap=box(0,1.05,.58,.11,1.15,.08,'#aaa084',g);strap.rotation.z=-.65}if(type===2)box(0,1.08,.37,1,.13,.2,mats.dark,g);scene.add(g);return g}
const visitors=[{name:'이끼',kind:'외계 식물 수집가',model:alien(0),drink:'허브차',line:'잎들이 아주 편안해 보여. 이 정거장에서는 식물도 여행자도 잘 쉴 수 있겠네.'},{name:'루미',kind:'별빛 기록가',model:alien(1),drink:'따뜻한 우유',line:'창가에 조금 더 앉아 있어도 돼? 저 행성이 가려지는 순간을 기록하고 싶어.'},{name:'누보',kind:'외계 탐험가',model:alien(2),drink:'허브차',line:'내 눈에는 별이 조금 다르게 보여. 다음에는 내가 그린 우주 지도를 가져올게.'},{name:'토티',kind:'보급선 비행사',model:cat('#b87942',true),drink:'따뜻한 우유',line:'첫 근무인데 꽤 잘하고 있네! 다음 보급 때도 이곳에서 쉬었다 가야겠어.'},{name:'애쉬',kind:'고양이 연구원',model:cat('#8f959c'),drink:'커피',line:'오늘 촬영한 천체 사진, 연구에 도움이 되겠어. 다음 연구 때 참고할게.'},{name:'녹스',kind:'검은 고양이 방랑자',model:cat('#202631'),drink:'커피',line:'항로에서 주웠어. 네 창가에 어울릴 것 같아서. …잘 지내. 또 들를게.'}];visitors.forEach(v=>v.model.visible=false);
let state={day:1,water:false,cargo:false,photo:false,served:0,gift:false,drink:null,active:-1,met:[],hour:8,pending:-1,visitIn:18+Math.random()*17,guestCare:{},repairStage:0};try{const s=JSON.parse(localStorage.getItem('paw-orbit-v1'));if(s)Object.assign(state,s)}catch{}state.guestCare??={};if(state.active===5)delete state.guestCare.favor;
state.bonds??={};state.knownLikes??={};state.journals??=[];
state.today??={guests:[],favors:[]};
if(state.active>=0&&!state.today.guests.includes(visitors[state.active].name))state.today.guests.push(visitors[state.active].name);
if(state.visit?.mode==='observe')state.visit.mode='roam';
state.messages??=[];state.noxGiftCount??=state.gift?1:0;state.roomDecor??={mobile:!!state.gift};state.visit??={mode:'roam',remaining:180,restRemaining:0};state.repairStage??=0;delete state.food;
for(const v of visitors){
  const known=state.knownLikes[v.name];
  if(known?.drink && known.drink!==v.drink)delete known.drink;
}
ensureDailyQuests();let running=false,angle=-Math.PI/2,zoom=8.8,near=null;const keys={};let elapsed=0;
let savedSnapshot;
function save(){
  try{
    const snapshot=JSON.stringify(state);
    if(snapshot===savedSnapshot)return;
    localStorage.setItem('paw-orbit-v1',snapshot);
    savedSnapshot=snapshot;
  }catch{}
}function toast(s){$('#toast').textContent=s;$('#toast').style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>$('#toast').style.display='none',4200)}function close(){if(dialogue)endDialogue();beginCameraTransition();$('#modal').style.display='none';running=true;Object.keys(keys).forEach(k=>keys[k]=false)}function modal(title,body,actions){if(dialogue)endDialogue();running=false;$('#modal').innerHTML='<section><small>스페이스 캣 · STATION TERMINAL</small><h2>'+title+'</h2><div>'+body+'</div><div id="actions"></div></section>';$('#modal').style.display='flex';for(const [text,fn]of actions){const b=document.createElement('button');b.textContent=text;b.onclick=fn;$('#actions').append(b)}}const questNames={water:'식물에 물 주기',cargo:'보급 화물 분류',photo:'천체 촬영',repair:'설비 점검·수리',ship:'선외 우주선 수리'};
function chooseDailyQuests(previous=[]){
  const pool=['water','cargo','photo','repair','ship'];
  const fresh=pool.filter(k=>!previous.includes(k));
  const first=fresh[Math.floor(Math.random()*fresh.length)]||pool[0];
  const options=pool.filter(k=>k!==first),result=[first];
  while(result.length<3)result.push(options.splice(Math.floor(Math.random()*options.length),1)[0]);
  return result;
}
function ensureDailyQuests(){if(state.questDay!==state.day||!Array.isArray(state.dailyQuests)||new Set(state.dailyQuests).size!==3||state.dailyQuests.some(k=>!['water','cargo','photo','repair','ship'].includes(k))){state.dailyQuests=chooseDailyQuests(state.dailyQuests);state.questDay=state.day}}
function questDone(k){return k==='repair'?state.repairStage>=4:!!state[k]}
function assigned(k){if(inTutorial())return false;if(state.dailyQuests.includes(k))return true;toast('오늘 배정된 업무가 아닙니다. 오늘의 퀘스트 3개를 확인해 주세요.');return false}
const questAudioState=new Map();let taskMarkup;function update(){ensureDailyQuests();ensureQuestDetails();for(const k of state.dailyQuests){const id=state.day+':'+k,done=questDone(k);if(done&&questAudioState.get(id)===false)globalThis.SpaceCatAudio?.fx(k);questAudioState.set(id,done)}const places={water:'재배실',cargo:'화물실',photo:'관측실',repair:'설비실',ship:'도킹 입구'};
const list=state.dailyQuests.map(k=>'<li class="'+(questDone(k)?'done':'')+'"><span>'+(questDone(k)?'✓':'·')+' '+questNames[k]+'</span><em>'+places[k]+'</em></li>').join('');
const notes=[];
if(state.active>=0)notes.push('방문 중 · '+visitors[state.active].name);
if(state.active>=0&&care().favor===1)notes.push('부탁 · '+favors[state.active][0]);
if(state.drink)notes.push('들고 있는 음료 · '+state.drink);
const markup='<div class="shift-time">'+state.day+'일차　'+String(Math.floor(state.hour)).padStart(2,'0')+':'+String(Math.floor(state.hour%1*60)).padStart(2,'0')+'</div><div class="shift-title"><strong>오늘의 업무</strong><span>'+state.dailyQuests.filter(questDone).length+' / '+state.dailyQuests.length+'</span></div><ul class="job-list">'+list+'</ul>'+notes.map(n=>'<div class="shift-note">'+n+'</div>').join('');if(markup!==taskMarkup){$('#tasks').innerHTML=markup;taskMarkup=markup}save()}
const arrivalGreetings=[
  '안녕! 이끼야. 저 창가에 새잎이 났네. 잠깐 둘러봐도 될까?',
  '안녕, 루미야. 오는 길에 별똥별을 세 개나 봤어!',
  '반가워! 누보야. 여기까지 오는 항로를 내 지도에 그려 놨어.',
  '토티, 무사히 도착! 문 열어 줘서 고마워. 잠깐 다리 좀 펼게.',
  '안녕, 애쉬야. 연구 일지를 덮고 잠깐 쉬러 왔어.'
];
function arrive(){if(state.active>=0||state.pending<0)return;if(lesson===3)finishWelcome();const i=state.pending;state.pending=-1;state.active=i;const v=visitors[i];if(!state.today.guests.includes(v.name))state.today.guests.push(v.name);v.model.visible=true;v.model.position.set(20,0,15.5);v.ready=false;v.model.rotation.x=0;state.visit={mode:'roam',remaining:150+Math.random()*90,restRemaining:0};state.guestCare={drink:false,activity:false,gift:false};v.route=[];v.pause=3;airlockTimer=6;if(i===5){
    if(giveArrivalGift())return;
    toast(v.name+' 입장. 손님이 정거장을 둘러봅니다.');
  }else{
    v.pause=0;
    v.route=findRoute(20,15.5,20,12,true);
    startDialogue(v,arrivalGreetings[i]);
    dialogue.autoCloseAfter=arrivalGreetings[i].length/34+2;
  }
  update();
}
function signalVisit(){if(state.active>=0||state.pending>=0)return;globalThis.SpaceCatAudio?.fx('arrival');const choices=visitors.map((v,i)=>i).filter(i=>i!==state.lastVisitor);state.pending=choices[Math.floor(Math.random()*choices.length)];state.lastVisitor=state.pending;$('#arrival').hidden=false;$('#arrival').textContent=visitors[state.pending].name+' 도착 · 도킹 입구에서 E로 맞이하세요.';update()}
let dialogue=null;
function happyFace(v){const i=visitors.indexOf(v),g=v.model,fx=new T.Group();g.add(fx);const eyes=i===0?[[-.29,1.73,.68,.2],[.33,1.73,.67,.18]]:i===1?[[0,1.43,.82,.28]]:i===2?[[-.3,1.6,.76,.17],[.33,1.56,.74,.15]]:[[-.225,1.992,.67,.056],[.225,1.992,.67,.056]];const hidden=[];g.traverse(o=>{if(o.isMesh&&(o.userData.expressionEye||o.userData.expressionMouth)){hidden.push({o,visible:o.visible});o.visible=false}});
for(const [x,y,z,r]of eyes){const curve=new T.CatmullRomCurve3([new T.Vector3(x-r,y-.01,z),new T.Vector3(x,y+r*.5,z+.01),new T.Vector3(x+r,y-.01,z)]);const smile=new T.Mesh(new T.TubeGeometry(curve,8,Math.max(.014,r*.11),5,false),mat('#242638'));fx.add(smile)}
const mouthY=i===0?1.43:i===1?1.12:i===2?1.19:1.74,mouthZ=i===0?.65:i===1?.54:i===2?.69:.72;const mouth=ball(0,mouthY,mouthZ,i>=3?.055:.095,'#bc7d88',fx);mouth.scale.set(1,.7,.25);for(const side of[-1,1]){const cheek=ball(side*(i>=3?.33:.48),mouthY+.09,mouthZ-.02,i>=3?.065:.09,'#d99b9d',fx);cheek.scale.set(1,.48,.2)}
const particles=[];for(let n=0;n<7;n++){const sparkle=new T.Mesh(new T.OctahedronGeometry(.065),mat(n%2?'#d9c898':'#a3d7cb',.8));sparkle.userData.phase=n*1.3;fx.add(sparkle);particles.push(sparkle)}return {fx,hidden,mouth,particles,scale:g.scale.clone(),y:g.position.y,roll:g.rotation.z,arms:(g.userData.limbs||[]).map(l=>({arm:l.arm,x:l.arm.rotation.x,z:l.arm.rotation.z}))}}
function endDialogue(){if(!dialogue)return;beginCameraTransition();const d=dialogue,g=d.visitor.model,e=d.expression;if(e){g.remove(e.fx);e.fx.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose()});for(const h of e.hidden)h.o.visible=h.visible;g.scale.copy(e.scale);g.position.y=e.y;g.rotation.z=e.roll;for(const a of e.arms){a.arm.rotation.x=a.x;a.arm.rotation.z=a.z}}player.rotation.y=d.playerHeading;dialogue=null;$('#dialogueText').textContent='';$('#dialogueName').textContent='';$('#dialogue').hidden=true;$('#dialogueChoices').replaceChildren();Object.keys(keys).forEach(k=>keys[k]=false)}
function startDialogue(v,lines,choices=[]){endDialogue();beginCameraTransition();$('#modal').style.display='none';running=true;Object.keys(keys).forEach(k=>keys[k]=false);dialogue={visitor:v,lines:Array.isArray(lines)?lines:[lines],index:0,shown:0,clock:0,choices,playerHeading:player.rotation.y,expression:state.visit.mode==='rest'?null:happyFace(v),time:0};player.rotation.y=Math.atan2(v.model.position.x-player.position.x,v.model.position.z-player.position.z);dialogue.cameraPose=dialogueCameraPose(player,v.model);if(state.visit.mode!=='rest'){const view=dialogue.cameraPose.position;v.model.rotation.y=Math.atan2(view.x-v.model.position.x,view.z-v.model.position.z);}$('#dialogue').hidden=false;$('#dialogueName').textContent=v.name+' / '+v.kind;showDialogueLine()}
function showDialogueLine(){if(!dialogue)return;globalThis.SpaceCatAudio?.fx('voice',visitors.indexOf(dialogue.visitor));dialogue.shown=0;$('#dialogueText').textContent='';$('#dialogueChoices').replaceChildren();$('#dialogueHint').textContent='E / SPACE · 문장 펼치기'}
function buildDialogueChoices(){if(!dialogue)return;const d=dialogue,container=$('#dialogueChoices');container.replaceChildren();if(d.index<d.lines.length-1){$('#dialogueHint').textContent='E / SPACE · 다음 대사';return}for(const [i,[name,fn]]of d.choices.entries()){const b=document.createElement('button');b.textContent=(i+1)+'. '+name;b.onclick=()=>{endDialogue();fn()};container.append(b)}const end=document.createElement('button');end.textContent='대화 마치기';end.onclick=endDialogue;container.append(end);$('#dialogueHint').textContent='숫자키 / 선택 버튼 · ESC 대화 마치기'}
function advanceDialogue(){if(!dialogue)return;const d=dialogue,line=d.lines[d.index];if(d.shown<line.length){d.shown=line.length;$('#dialogueText').textContent=line;buildDialogueChoices()}else if(d.index<d.lines.length-1){d.index++;showDialogueLine()}else if(!d.choices.length)endDialogue()}
function tickDialogue(dt){if(!dialogue)return;const d=dialogue;d.time+=dt;if(d.time>=d.autoCloseAfter){endDialogue();return}const line=d.lines[d.index];if(d.shown<line.length){const next=Math.min(line.length,d.shown+dt*34);if(Math.floor(next/3)>Math.floor(d.shown/3))globalThis.SpaceCatAudio?.fx('voice',visitors.indexOf(d.visitor));d.shown=next;$('#dialogueText').textContent=line.slice(0,Math.floor(next));if(next===line.length)buildDialogueChoices()}const e=d.expression;if(!e)return;const g=d.visitor.model,t=d.time;g.position.y=e.y+Math.abs(Math.sin(t*3.6))*.055;g.rotation.z=e.roll+Math.sin(t*2.8)*.035;g.scale.set(e.scale.x*(1+Math.sin(t*4)*.015),e.scale.y*(1+Math.sin(t*4)*.02),e.scale.z);e.mouth.scale.y=.5+Math.abs(Math.sin(t*12))*.7;for(const a of e.arms){a.arm.rotation.x=a.x+Math.sin(t*5)*.28;a.arm.rotation.z=a.z+Math.sin(t*4)*.1}for(const [n,p]of e.particles.entries()){const phase=t*.7+p.userData.phase;p.position.set(Math.sin(phase)*.95,2.25+((t*.32+n*.19)%1),Math.cos(phase)*.32);p.rotation.y=t*1.5;p.scale.setScalar(.7+Math.sin(t*5+n)*.25)}}
function care(){return state.guestCare??={}}
const favors=[
  ['재배실에서 새잎 수 세기','식물 돌보기','새잎이 세 장이나 났구나. 내 식물 수첩에 적어 둘게.','plant'],
  ['망원경 렌즈 닦기','망원경 관측','렌즈 너머 별 테두리가 또렷해졌어.','mobile'],
  ['중앙 통신기에서 항로 번호 확인','중앙 통신 · 손님 방명록','이 번호면 다음 기착지를 찾을 수 있어!','rug'],
  ['화물실에서 빈 상자 찾기','보급품 분류','이 상자에 부품을 담으면 딱 맞겠어.','rocket'],
  ['설비실 온도계 읽기','설비 점검 · 수리','그 온도라면 시료가 무사하겠네.','books'],
  ['도킹 입구에서 송신등 확인','입구 문 · 도착 손님 맞이','불빛이 켜졌구나. 이제 내 신호도 닿겠어.','crystal']
];
function gainBond(){const name=visitors[state.active].name;state.bonds[name]=(state.bonds[name]||0)+1}
function discover(key,value){
  const name=visitors[state.active].name;
  (state.knownLikes[name]??={})[key]=value;gainBond();
}
function showDecor(){
  const v=visitors[state.active],id=favors[state.active][3];
  const placed=Object.keys(decorNames).filter(k=>state.roomDecor[k]&&availableDecor()[k]);
  modal('방 장식 보여주기',placed.length?'':'<p>내 방 선반에서 장식을 먼저 배치해 주세요.</p>',[
    ...placed.map(k=>[decorNames[k],()=>{
      if(k===id&&!care().decor){care().decor=true;discover('decor',decorNames[k]);update()}
      startDialogue(v,k===id?'이건 내 방에도 두고 싶어. 기억해 줘서 고마워!':'네 방에 잘 어울리는 장식이네.')
    }]),['돌아가기',talk]]);
}
function finishFavor(){
  const c=care(),v=visitors[state.active],f=favors[state.active];
  if(state.active===5||c.favor!==1)return;
  c.favor=2;gainBond();state.today.favors.push(v.name+' · '+f[0]);update();
  modal('부탁 완료',f[0]+' 완료 · '+v.name+' 호감도 +1',[['확인',close]]);
}
function giveDrink(){if(state.active<0||!state.drink||care().drink)return;const v=visitors[state.active];const match=state.drink===v.drink;if(match){discover('drink',state.drink);toast(v.name+' 호감도 +1')}state.drink=null;care().drink=true;state.served++;update();startDialogue(v,match?'딱 마시고 싶었던 거야. 고마워!':'준비해 줘서 고마워. 덕분에 기운이 나!')}
function guideGuestToBed(){const v=visitors[state.active];v.model.rotation.x=0;state.visit.mode='restTravel';v.route=findRoute(v.model.position.x,v.model.position.z,-19,-9);v.pause=0;close();update();toast('손님이 침대로 이동합니다. 도착하면 약 1분 동안 누워 쉬어요.')}
function giveArrivalGift(){
  const item=noxGifts[state.noxGiftCount];
  if(state.active!==5||care().gift||!item)return false;
  state.noxGiftCount++;care().gift=true;state.gift=true;update();
  startDialogue(visitors[5],'오는 길에 네 생각이 났어. '+decorNames[item]+', 네 방에 두면 잘 어울릴 거야.');
  toast('녹스의 선물 · '+decorNames[item]+' 획득');
  return true;
}
function talk(){const i=state.active;if(i<0)return;const v=visitors[i],c=care(),mode=state.visit.mode;if(mode==='rest'||mode==='depart'){startDialogue(v,mode==='rest'?'잠깐 눈을 붙일게… 남은 휴식 '+Math.ceil(state.visit.restRemaining)+'초.':'잠깐 중앙에 인사를 남기고 갈게. 잘 지내!');return}const f=favors[i],actions=[];
actions.push(['이야기하기',()=>startDialogue(v,c.favor===2?f[2]:v.line)]);
if(i!==5&&!c.favor)actions.push(['작은 부탁 듣기',()=>startDialogue(v,f[0]+', 도와줄 수 있어?',[
  ['맡기',()=>{c.favor=1;update();startDialogue(v,'고마워. '+f[1]+' 위치에서 확인해 줘.') }],['나중에',close]])]);
if(!c.decor)actions.push(['방 장식 보여주기',showDecor]);
if(!c.drink&&state.drink)actions.push([state.drink+' 건네기',giveDrink]);if(mode!=='restTravel')actions.push(['손님방으로 안내하기',guideGuestToBed]);startDialogue(v,c.drink?'잘 쉬고 있어. 대접해 줘서 고마워.':'이곳에서 잠시 쉬어 가도 될까?',actions)}
function kitchen(){
  const actions=['허브차','따뜻한 우유','커피'].map(drink=>[drink+' 준비하기',()=>{
    state.drink=drink;close();update();toast(drink+' 준비 완료')
  }]);
  modal('부엌 / 음료 준비','<p>손님에게 가져갈 음료 한 잔을 고르세요.</p>',[...actions,['돌아가기',close]]);
}
function daySummary(){
  const completed=state.dailyQuests.filter(questDone).map(k=>questNames[k]).concat(state.today.favors);
  return '만난 손님 · '+(state.today.guests.join(', ')||'없음')+'<br>마친 일 · '+(completed.join(', ')||'없음');
}
function dayJournal(){
  state.nextJobs??=chooseDailyQuests(state.dailyQuests);save();
  const relations=visitors.map(v=>{
    const known=Object.values(state.knownLikes[v.name]||{}).join(' · ');
    return v.name+' ♡ '+(state.bonds[v.name]||0)+(known?' · '+known:'');
  }).join('<br>');
  modal(state.day+'일차 마감 일지','<p>'+daySummary()+'</p><p>지금까지 음료를 대접한 손님 · '+state.served+'명</p><h3>내일의 업무</h3><p>'+state.nextJobs.map(k=>questNames[k]).join(' · ')+'</p><h3>호감도와 발견한 취향</h3><p>'+relations+'</p>',[
    ['잠들기',sleep],['지난 일지',()=>modal('지난 일지',state.journals.slice().reverse().map(j=>'<p>'+j.day+'일차<br>'+j.summary+'</p>').join('')||'아직 마감한 날이 없습니다.',[['돌아가기',dayJournal]])],['더 깨어 있기',close]]);
}
function sleep(){const previous=availableDecor();const overnight=state.active>=0;state.journals.push({day:state.day,summary:daySummary()});state.today={guests:overnight?[visitors[state.active].name]:[],favors:[]};
state.dailyQuests=state.nextJobs||chooseDailyQuests(state.dailyQuests);state.nextJobs=null;
state.day++;state.questDay=state.day;state.ship=false;state.shipStage=0;state.hour=8;state.water=state.cargo=state.photo=false;state.repairStage=0;ensureDailyQuests();if(overnight){const v=visitors[state.active];v.model.rotation.x=0;v.model.position.set(-18,0,-9);v.route=[];v.pause=15;state.visit.mode='roam';state.visit.remaining=Math.max(state.visit.remaining,60)}close();update();toast(overnight?'좋은 아침입니다. 손님은 손님방에서 쉬고 있어요.':'새로운 하루입니다.');announceDecor(previous)}
const repairPlans=[{name:'산소 순환 장치',steps:[['풍량 저하 감지','안전하게 전원을 차단하세요.','전원 차단','작동 중 덮개 열기'],['필터 점검','먼지가 쌓인 부품을 교체하세요.','공기 필터 교체','통신 안테나 교체'],['전원 복구','교체 후 장치를 닫아 주세요.','덮개 닫고 전원 복구','덮개를 열어 두기'],['시험 운전','공기 순환 상태를 확인하세요.','풍량 측정','측정 없이 종료']]},{name:'냉각수 순환 장치',steps:[['과열 경보','먼저 냉각 회로를 안전하게 격리하세요.','순환 펌프 정지','펌프 속도 최대'],['누수 점검','연결부 패킹이 손상되었습니다.','밸브 잠그고 패킹 교체','테이프로만 감기'],['냉각수 보충','안전 표시선까지 보충하세요.','전용 냉각수 보충','음료수 붓기'],['온도 점검','펌프를 복구한 뒤 상태를 확인하세요.','펌프 가동 후 온도 측정','경보만 끄기']]},{name:'통신 안테나',steps:[['신호 손실','먼저 송신 장치를 안전 모드로 바꾸세요.','송신 대기 모드','출력 무조건 높이기'],['케이블 점검','신호선 커넥터가 느슨합니다.','커넥터 재연결','전원선 제거'],['주파수 보정','관제소 기준 신호에 맞추세요.','기준 주파수 동기화','무작위 주파수 입력'],['통신 시험','마지막으로 수신 상태를 확인하세요.','시험 신호 송수신','확인 없이 종료']]}];
const cargoPool=[['동결 건조 채소','식재료'],['생선 통조림','식재료'],['식량 팩','식재료'],['허브 씨앗','식재료'],['우유 분말','식재료'],['관측용 렌즈','장비'],['예비 전지','장비'],['산소 필터','장비'],['통신 케이블','장비'],['수리 공구','장비'],['빈 포장재','폐기물'],['사용한 필터','폐기물'],['파손된 완충재','폐기물'],['찢어진 식량 봉투','폐기물'],['고장 난 회로 기판','폐기물']];
const starColors=[{name:'붉은색',hex:'#ff7989'},{name:'파란색',hex:'#72baff'},{name:'노란색',hex:'#ffdb76'},{name:'보라색',hex:'#ce96ff'}];
function shuffled(list){return list.map(x=>({x,n:Math.random()})).sort((a,b)=>a.n-b.n).map(v=>v.x)}
function ensureQuestDetails(){if(state.detailsDay===state.day&&state.cargoManifest?.length===3&&state.starField?.length===12&&repairPlans[state.repairKind])return;state.detailsDay=state.day;state.cargoManifest=shuffled(cargoPool).slice(0,3);state.cargoIndex=0;state.repairKind=Math.floor(Math.random()*repairPlans.length);state.starTarget=Math.floor(Math.random()*starColors.length);state.starField=[];for(let i=0;i<12;i++){let x,y;do{x=34+Math.random()*332;y=30+Math.random()*160}while(state.starField.some(s=>Math.hypot(s.x-x,s.y-y)<32));state.starField.push({x,y,color:i%4})}save()}
function repair(){if(!assigned('repair'))return;ensureQuestDetails();const plan=repairPlans[state.repairKind];if(state.repairStage>=4){modal(plan.name+' / 정상','<p>오늘의 점검·수리가 완료되었습니다.</p>',[['돌아가기',close]]);return}const st=plan.steps[state.repairStage];modal(plan.name+' / '+st[0],'<p>'+st[1]+'</p>',[...shuffled([st[2],st[3]]).map(c=>[c,()=>{if(c!==st[2]){toast('점검 순서를 다시 확인해 주세요.');return}state.repairStage++;update();if(state.repairStage===4)toast(plan.name+' 점검 완료. 정상 작동합니다.');repair()}]),['나중에 계속하기',close]])}

function leave(){if(state.active<0)return;const v=visitors[state.active];v.model.visible=false;v.model.rotation.x=0;const previous=availableDecor();state.met.push(v.name);state.active=-1;state.visitIn=25+Math.random()*35;$('#arrival').hidden=true;update();announceDecor(previous)}
function farewell(){if(state.active<0)return;const v=visitors[state.active];const message=v.name+' — “'+(care().drink||care().food?'대접해 줘서 고마워. 다음 항로에서도 이곳을 기억할게.':'잠깐 쉬어 갈 수 있어서 좋았어. 다음에 또 들를게.')+'”';state.messages.unshift({day:state.day,text:message});state.messages=state.messages.slice(0,6);toast('중앙에 남긴 인사: '+message);$('#farewell').textContent=message;$('#farewell').hidden=false;setTimeout(()=>$('#farewell').hidden=true,14000);leave()}
function centralTerminal(){modal('중앙 통신 / 방문객 방명록','<p>매일 업무 3개가 배정됩니다. 손님은 중앙에 인사를 남긴 뒤 스스로 떠납니다.</p><h3>남겨진 인사</h3>'+(state.messages.length?state.messages.map(m=>'<p class="muted">DAY '+m.day+' · '+m.text+'</p>').join(''):'<p class="muted">아직 남겨진 인사가 없습니다.</p>'),[['돌아가기',close]])}
const stations=[{x:0,z:4,name:'중앙 통신 · 손님 방명록',prompt:'[ E ] 눌러 확인하기 · 중앙 통신기',run:centralTerminal},{x:-20,z:-2,name:'식물 돌보기',run:()=>{if(!assigned('water'))return;if(state.water){toast('흙이 촉촉합니다. 오늘은 충분히 물을 주었어요.');return}plants.forEach(p=>p.scale.setScalar(1.2));state.water=true;toast('물을 주었습니다. 잎이 조금 더 활짝 펴졌어요.');update()}},{x:-19,z:3,name:'음료 준비',run:kitchen},{x:0,z:18,name:'보급품 분류',run:()=>cargo(0)},{x:18,z:-5,name:'망원경 관측',run:observe},{x:20,z:15.5,name:'입구 문 · 도착 손님 맞이',run:()=>modal('에어록 / 방문 신호',`<p>${state.pending>=0?visitors[state.pending].name+' 도착. 문 밖에서 기다리고 있습니다.':state.active>=0?'손님이 정거장을 둘러보는 중입니다.':'아직 방문 신호가 없습니다. 업무를 보며 기다려 주세요.'}</p>`,[...(state.pending>=0?[['문 열어 맞이하기',()=>{close();arrive();$('#arrival').hidden=true}]]:[]),...(inTutorial()?[]:[['선외 정비 구역으로 나가기',()=>transferDeck(true)]]),['돌아가기',close]])},{x:-20,z:11,name:'취침 · 다음 날',run:dayJournal},{x:0,z:-17,name:'설비 점검 · 수리',run:repair},{x:-19,z:-10,name:'손님방 확인',run:()=>modal('손님방','<p>긴 여행을 마친 손님을 위한 작은 침실입니다.</p><p class="muted">손님이 머무는 중에 잠들면 이곳에서 밤을 보냅니다.</p>',[['돌아가기',close]])}];
function cargo(n){if(!assigned('cargo'))return;ensureQuestDetails();if(state.cargo){toast('오늘의 보급품은 모두 정리되었습니다.');return}n=state.cargoIndex||0;const [item,correct]=state.cargoManifest[n];modal('화물 분류 / '+(n+1)+' of 3',`<p>${item}</p><p>어느 보관함에 넣을까요?</p>`,['식재료','장비','폐기물'].map(x=>[x,()=>{if(x!==correct){toast('상자 라벨을 다시 확인해 보세요.');return}state.cargoIndex=n+1;if(n<2){save();cargo(n+1)}else{state.cargo=true;close();update();toast('보급품 세 상자를 올바르게 정리했습니다.')}}]))}
function observe(){if(!assigned('photo'))return;ensureQuestDetails();if(state.photo){toast('오늘의 목표 별 촬영을 완료했습니다.');return}aim={x:200,y:110};modal('관측 / 색깔 별 찾기','<p>오늘의 촬영 대상: <b style="color:'+starColors[state.starTarget].hex+'">'+starColors[state.starTarget].name+' 별</b><br>방향키로 조준점을 움직여 목표 색의 별 위에 놓으세요.</p><canvas id="sky" width="400" height="220" style="width:100%;height:auto;background:#070c16"></canvas>',[['촬영',photograph],['돌아가기',close]]);drawSky()}
function photograph(){const nearby=state.starField.map(s=>({...s,distance:Math.hypot(s.x-aim.x,s.y-aim.y)})).filter(s=>s.distance<16).sort((a,b)=>a.distance-b.distance);if(!nearby.length){toast('조준점을 별에 더 가까이 옮겨 주세요.');return false}if(nearby[0].color!==state.starTarget){toast('다른 색의 별입니다. '+starColors[state.starTarget].name+' 별을 찾아 주세요.');return false}state.photo=true;close();update();toast(starColors[state.starTarget].name+' 별 촬영 완료. 관측 기록에 저장했습니다.');return true}
let aim=null;function drawSky(){const c=$('#sky');if(!c||!aim)return;const ctx=c.getContext('2d');ctx.fillStyle='#080d17';ctx.fillRect(0,0,400,220);ctx.fillStyle='#64758c';for(let i=0;i<32;i++)ctx.fillRect(i*73%400,i*47%220,2,2);for(const star of state.starField||[]){const x=star.x,y=star.y;ctx.fillStyle=starColors[star.color].hex;ctx.fillRect(x-4,y-4,8,8);ctx.fillRect(x-1,y-7,2,14);ctx.fillRect(x-7,y-1,14,2)}ctx.strokeStyle='#ddd';ctx.beginPath();ctx.arc(aim.x,aim.y,16,0,7);ctx.moveTo(aim.x-23,aim.y);ctx.lineTo(aim.x+23,aim.y);ctx.moveTo(aim.x,aim.y-23);ctx.lineTo(aim.x,aim.y+23);ctx.stroke()}

function map(){
  const learningMap=lesson===1;
  const footprint=rooms.map(r=>r.round
    ? '<circle cx="0" cy="0" r="9.9"/>'
    : '<rect x="'+(r.x-r.w/2)+'" y="'+(r.z-r.d/2)+'" width="'+r.w+'" height="'+r.d+'"/>');
  for(const [x,z,w,d] of corridors)footprint.push('<rect x="'+(x-w/2)+'" y="'+(z-d/2)+'" width="'+w+'" height="'+d+'"/>');
  for(const [x,z,w,d] of deckSections)footprint.push('<rect x="'+(x-w/2)+'" y="'+(z-d/2)+'" width="'+w+'" height="'+d+'"/>');
  const plan=footprint.join('');
  const labels=rooms.map(r=>'<text x="'+r.x+'" y="'+(r.z+.45)+'">'+r.name+'</text>').join('');
  const marker='<g transform="translate('+player.position.x+' '+player.position.z+') rotate('+(-player.rotation.y*180/Math.PI)+')"><path d="M0 1.05 L-.66 -.72 L0 -.4 L.66 -.72 Z" fill="#ff4545" stroke="white" stroke-width=".16" transform="scale(1.5)"/></g>';
  refreshGuide();
  const trail=guidePath.length?'<polyline fill="none" stroke="#8fffe1" stroke-width=".4" stroke-dasharray=".55 .5" points="'+guidePath.map(p=>p.x+','+p.z).join(' ')+'"/>':'';
  const drawing='<svg class="station-map" viewBox="'+(player.position.x>30?'29 11 29 27':'-28 -24 84 62')+'" role="img" aria-label="정거장 평면도와 현재 위치"><g fill="black" stroke="white" stroke-width=".28">'+plan+'</g><g fill="black">'+plan+'</g>'+trail+'<g class="room-labels">'+labels+'<text x="43" y="24">선외 정비</text>'+ (player.position.x>30?servicePoints.map((p,i)=>'<text x="'+p.x+'" y="'+(p.z+1.6)+'">'+(i+1)+' '+p.name+'</text>').join('')+'<text x="35" y="31">복귀</text>':'') + '</g>'+marker+'</svg>';
  modal('정거장 지도',drawing+'<p class="map-key"><b style="color:#ff4545">▲</b> 내 위치 · 바라보는 방향</p>',[[learningMap?'내 위치 확인했어요':'돌아가기',()=>{close();if(learningMap)showLesson(2)}]]);
}
const lessons=[
  ['이동키 익히기','W / S로 앞뒤로 걷고 A / D로 방향을 바꿔 보세요. 방향키도 쓸 수 있어요.'],
  ['지도 확인하기','Tab을 눌러 빨간 화살표로 내 위치를 찾고, 화물실 위치도 확인하세요.'],
  ['퀘스트 플레이 해보기','중앙 통로에서 화물실로 들어가 상자 앞에서 E를 누르세요.'],
  ['손님 맞이하기','관측실을 지나 도킹 입구로 가세요. 문 앞에서 E를 눌러 손님을 맞이하세요.']
];
function trainingCargo(){
  modal('첫 퀘스트 · 보급품 분류','<p>상자에 감자가 들어 있어요. 어느 보관함에 넣을까요?</p>',
    ['식재료','장비','폐기물'].map(label=>[label,()=>{
      if(label!=='식재료'){toast('감자는 요리에 써요. 식재료 보관함을 골라 보세요.');return}
      close();showLesson(3);
    }]));
}
function lessonTarget(){
  if(lesson===2)return stations.find(s=>s.name==='보급품 분류');
  if(lesson!==3)return null;
  if(state.active>=0){
    const v=visitors[state.active];
    return {x:v.model.position.x,z:v.model.position.z,name:v.name+'에게 인사하기',run:()=>{finishWelcome();talk()}};
  }
  return stations.find(s=>s.name==='입구 문 · 도착 손님 맞이');
}
let lesson=-1,lessonOrigin;
// Reuse one set of floor lights as the player follows the route.
const guideLights=new T.Group();scene.add(guideLights);
const lightShape=new T.CircleGeometry(.19,12);
const lightPaint=new T.MeshBasicMaterial({color:0x8fffe1});
for(let i=0;i<48;i++){
  const dot=new T.Mesh(lightShape,lightPaint);
  dot.rotation.x=-Math.PI/2;dot.visible=false;guideLights.add(dot);
}
let routeAnchor=null,guidePath=[];
function guideWalkable(x,z){return valid(x,z)&&!furnitureBlocked(x,z)}
function refreshGuide(){
  const target=lessonTarget();
  guideLights.visible=!!target&&player.position.x<30;
  if(!guideLights.visible){guidePath=[];routeAnchor=null;return}
  const pos=player.position;
  if(routeAnchor&&Math.hypot(pos.x-routeAnchor.x,pos.z-routeAnchor.z)<1.5)return;
  routeAnchor=pos.clone();
  const goalZ=lesson===2?16:target.z;
  guidePath=findRoute(pos.x,pos.z,target.x,goalZ,false,guideWalkable);
  guideLights.children.forEach((dot,i)=>{
    const point=guidePath[i*3+1];dot.visible=!!point;
    if(point)dot.position.set(point.x,.085,point.z);
  });
  let hint;
  if(Math.hypot(pos.x-target.x,pos.z-target.z)<2.7)hint=lesson===2?'도착했어요. E를 눌러 화물을 분류하세요.':'도착했어요. E를 눌러 손님을 맞이하세요.';
  else if(lesson===3&&state.active>=0)hint=visitors[state.active].name+'에게 다가가 E로 인사하세요.';
  else if(lesson===2)hint=pos.z>12&&Math.abs(pos.x)<7?'화물실 안쪽의 보급 상자 앞으로 가세요.':'바닥의 민트색 불빛을 따라 중앙 통로의 화물실 문으로 가세요.';
  else hint=pos.z>12&&Math.abs(pos.x)<7?'화물실을 나와 중앙 통로로 돌아가세요.':pos.x<14?'민트색 불빛을 따라 관측실 문으로 가세요.':'관측실에서 도킹 입구 문을 지나 에어록 앞으로 가세요.';
  $('#lesson').textContent=hint;
}
function finishWelcome(){
  state.welcomeNote=true;
  showLesson(4);
}
function welcomeNote(){
  modal('첫 손님을 맞이했어요',
    '<h3>손님과 함께</h3><p>손님 곁에서 E를 눌러 이야기를 나눠 보세요. 작은 부탁을 듣거나 부엌에서 음료를 준비해 건넬 수 있어요. 좋아하는 음료를 발견하면 호감도가 올라요.</p>'+
    '<h3>이제 나의 첫 근무</h3><p>왼쪽에서 오늘의 업무 하나를 고르고, Tab 지도로 방을 찾아가세요. 하루를 마치고 싶을 때는 주인공 방 침대에서 E를 눌러 일지와 내일의 업무를 확인하세요.</p>',
    [['근무 계속하기',close]]);
  state.welcomeNote=false;save();
}
function inTutorial(){return lesson>=0&&lesson<lessons.length}
function showLesson(step){
  near=null;
  routeAnchor=null;lesson=step;
  state.tutorialStep=step;state.tutorialVersion=2;
  if(step===3&&state.active<0&&state.pending<0)signalVisit();
  save();
  $('#tasks').hidden=inTutorial();
  $('#arrival').hidden=inTutorial()||state.pending<0;
  $('#tutorial').hidden=!inTutorial();
  if(!$('#tutorial').hidden){
    $('#lessonTitle').textContent=(step+1)+' / '+lessons.length+'　'+lessons[step][0];
    $('#lesson').textContent=step===3&&state.active>=0?visitors[state.active].name+'에게 다가가 E를 눌러 인사하세요.':lessons[step][1];
    lessonOrigin=player.position.clone();
  }
}
$('#skipLesson').onclick=()=>showLesson(lessons.length);
$('#start').onclick=()=>{globalThis.SpaceCatAudio?.unlock();close();showLesson(state.tutorialVersion!==2&&state.tutorialStep===3?4:(state.tutorialStep??0));if(!inTutorial()&&state.active===5)giveArrivalGift()};$('#help').onclick=()=>modal('플레이 안내',`
<div class="guide">
<details open><summary>이동과 상호작용</summary><dl><dt>W / S 또는 ↑ / ↓</dt><dd>앞뒤로 이동</dd><dt>A / D 또는 ← / →</dt><dd>몸의 방향 전환</dd><dt>E</dt><dd>가까운 대상 조사 · 대화</dd><dt>Tab / Esc</dt><dd>지도 열기 / 창 닫기</dd><dt>드래그 / 휠</dt><dd>시점 회전 / 거리 조절</dd></dl></details>
<details><summary>오늘의 업무와 선외 수리</summary><p>왼쪽 업무 목록에 표시된 방으로 이동하세요. 작업대에 다가가 E를 누르면 그 일의 진행 방법이 열려요.</p><p>선외 수리는 도킹 입구에서 출발해요. 밖에서는 W/S 또는 ↑/↓로 전후 이동하고 A/D 또는 ←/→로 방향을 바꾸세요. Shift를 누른 채 이동하면 추진 속도가 빨라져요. Tab 지도에 작업 순서가 표시돼요. 상단의 ‘정거장 복귀’로 돌아올 수 있어요.</p></details>
<details><summary>손님 맞이와 호감도</summary><p>도착 신호가 뜨면 도킹 입구에서 문을 열어 주세요. 손님에게 다가가 E를 누르면 대화하거나 작은 부탁을 들을 수 있어요. 녹스는 방문 선물을 직접 건네요.</p><p>부엌에서 준비한 음료를 건네거나 방에 배치한 장식을 보여 주세요. 취향을 맞히면 호감도가 올라요. 떠난 손님의 인사는 중앙 통신기에 남아요.</p></details>
<details><summary>방 꾸미기와 하루 마감</summary><p>주인공 방 선반에서 날짜, 배웅 횟수, 녹스의 선물로 얻은 장식을 배치하세요.</p><p>침대에서 E를 누르면 오늘 만난 손님과 마친 일, 호감도, 내일의 업무를 볼 수 있어요. ‘잠들기’를 선택하면 다음 날이 시작돼요.</p></details>
</div>`,[['계속하기',close],['튜토리얼 다시 하기',()=>{close();showLesson(0)}],['저장 초기화',()=>modal('저장 초기화','<p>이 기기의 진행 상황을 지울까요?</p>',[['초기화',()=>{localStorage.removeItem('paw-orbit-v1');location.reload()}],['취소',close]])]]);
function movementKey(e){return ({KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',ArrowUp:'arrowup',ArrowDown:'arrowdown',ArrowLeft:'arrowleft',ArrowRight:'arrowright'})[e.code]||e.key.toLowerCase()}
addEventListener('keydown',e=>{if(lesson===-1&&!running&&$('#modal').querySelector?.('#start'))return;const movement=movementKey(e),isMove=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(movement);if(dialogue&&isMove){endDialogue();running=true}if(dialogue){if(['e','E',' ','Escape'].includes(e.key)||/^[1-9]$/.test(e.key)){e.preventDefault();if(e.repeat)return;if(e.key==='Escape')endDialogue();else if(/^[1-9]$/.test(e.key)&&dialogue.shown>=dialogue.lines[dialogue.index].length&&dialogue.index===dialogue.lines.length-1){const option=dialogue.choices[Number(e.key)-1];if(option){endDialogue();option[1]()}}else advanceDialogue()}return;}if(['Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[movement]=true;if(e.key==='Escape')close();if(e.key==='Tab')map();if(!running&&aim&&$('#sky')){if(e.key==='ArrowLeft')aim.x-=8;if(e.key==='ArrowRight')aim.x+=8;if(e.key==='ArrowUp')aim.y-=8;if(e.key==='ArrowDown')aim.y+=8;aim.x=T.MathUtils.clamp(aim.x,8,392);aim.y=T.MathUtils.clamp(aim.y,8,212);drawSky()}if(running&&(e.code==='KeyE'||e.key.toLowerCase()==='e')&&!e.repeat){if(inTutorial()){if(near&&lesson===2)trainingCargo();else if(near&&lesson===3)near.run();return}if(near?.guest)talk();else if(state.active>=0&&care().favor===1&&near?.name===favors[state.active][1]){
  modal('작은 부탁',favors[state.active][0],[['부탁 수행',finishFavor],['평소 작업',near.run],['돌아가기',close]])
}else near?.run()}});addEventListener('keyup',e=>{keys[movementKey(e)]=false});addEventListener('blur',()=>Object.keys(keys).forEach(k=>keys[k]=false));const cameraDrag={pointerId:null,x:0,manual:false};
function stopCameraDrag(){const id=cameraDrag.pointerId;cameraDrag.pointerId=null;if(id!==null&&canvas.hasPointerCapture?.(id))canvas.releasePointerCapture(id);canvas.style.cursor='grab'}
canvas.style.touchAction='none';canvas.style.cursor='grab';
canvas.addEventListener('pointerdown',e=>{if(!running||dialogue||cameraDrag.pointerId!==null||![0,2].includes(e.button))return;e.preventDefault();cameraDrag.pointerId=e.pointerId;cameraDrag.x=e.clientX;canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing'});
canvas.addEventListener('pointermove',e=>{if(cameraDrag.pointerId!==e.pointerId)return;const dx=e.clientX-cameraDrag.x;cameraDrag.x=e.clientX;if(dx){angle-=dx*.004;cameraDrag.manual=true}});
canvas.addEventListener('pointerup',e=>{if(cameraDrag.pointerId===e.pointerId)stopCameraDrag()});
canvas.addEventListener('pointercancel',e=>{if(cameraDrag.pointerId===e.pointerId)stopCameraDrag()});
canvas.addEventListener('lostpointercapture',e=>{if(cameraDrag.pointerId===e.pointerId){cameraDrag.pointerId=null;canvas.style.cursor='grab'}});
canvas.addEventListener('contextmenu',e=>e.preventDefault());addEventListener('blur',stopCameraDrag);
function updateCameraOrbit(heading,dt,moving){if(cameraDrag.pointerId!==null)return;if(moving)cameraDrag.manual=false;if(!cameraDrag.manual)angle=followCameraAngle(angle,heading,dt)}
canvas.addEventListener('wheel',e=>{zoom=T.MathUtils.clamp(zoom+e.deltaY*.006,5.5,12)},{passive:true});addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});
function valid(x,z){return walk.some(r=>r.round?Math.hypot(x,z)<9.6:Math.abs(x-r.x)<r.w/2-.25&&Math.abs(z-r.z)<r.d/2-.25)&&!obstacles.some(o=>Math.abs(x-o.x)<o.w/2+.35&&Math.abs(z-o.z)<o.d/2+.35)}
const walls=[],doors=[];let airlockTimer=0;
function wall(x,z,w,d){const o=box(x,1.8,z,w,3.6,d,mat('#566977'));walls.push(o);obstacles.push({x,z,w,d});return o}
function doorway(x,z,axis,name,manual=false){const group=new T.Group();group.position.set(x,0,z);if(axis==='z')group.rotation.y=Math.PI/2;scene.add(group);for(const side of[-1,1])box(side*1.32,1.5,0,.2,3,.45,mats.white,group);box(0,3.1,0,2.85,1,.45,mats.white,group);box(0,2.75,.25,1.7,.08,.05,mats.cyan,group);const panels=[-1,1].map(side=>box(side*.6,1.3,0,1.18,2.6,.17,mats.dark,group));for(const side of[-1,1])box(side*.12,1.3,.1,.035,2.1,.03,mats.cyan,group);doors.push({x,z,axis,name,manual,panels,open:0});doorSign(group,name)}
const portals={1:[['s',0]],2:[['e',-8]],3:[['e',0]],4:[['e',8]],5:[['n',0]],6:[['w',0],['s',20]],7:[['n',20],['s',20]]};
for(let i=1;i<rooms.length;i++){const r=rooms[i];for(const side of['n','s','w','e']){const horizontal=side==='n'||side==='s',fixed=horizontal?r.z+(side==='n'?-r.d/2:r.d/2):r.x+(side==='w'?-r.w/2:r.w/2),lo=horizontal?r.x-r.w/2:r.z-r.d/2,hi=horizontal?r.x+r.w/2:r.z+r.d/2,portal=portals[i].find(p=>p[0]===side);const intervals=portal?[[lo,portal[1]-1.3],[portal[1]+1.3,hi]]:[[lo,hi]];for(const [a,b]of intervals)if(b>a)wall(horizontal?(a+b)/2:fixed,horizontal?fixed:(a+b)/2,horizontal?b-a:.18,horizontal?.18:b-a);if(portal)doorway(horizontal?portal[1]:fixed,horizontal?fixed:portal[1],horizontal?'x':'z',i===7&&side==='s'?'AIRLOCK':r.name,i===7&&side==='s')}}
// Four service bridges form a circuit around the moored spacecraft.
const deckSections=[[35,24,5,20],[43,16,20,4],[51,24,5,20],[43,32,20,4]];
for(const [x,z,w,d] of deckSections){
  walk.push({x,z,w,d});box(x,-.33,z,w,.48,d,mats.edge);
  box(x,-.075,z,w-.24,.14,d-.24,mats.floor);
}
for(let z=16;z<=32;z+=2){
  for(const x of [32.7,53.3])box(x,.04,z,.14,.1,.65,mats.cyan);
}
for(let x=35;x<=51;x+=2){
  for(const z of [14.25,33.75])box(x,.04,z,.65,.1,.14,mats.cyan);
}
const shuttle=ball(43,1.4,24,1,mats.white);shuttle.scale.set(2.3,1.65,5.8);
const canopy=ball(43,2.35,26.8,1,mats.dark);canopy.scale.set(1.5,1,2.6);
for(const side of [-1,1]){
  box(43+side*3,1,23,2.7,.26,3.2,mats.white);
  const engine=ball(43+side*1.45,1.2,20,.9,mats.edge);engine.scale.z=2;
  box(43+side*1.45,1.2,18.5,.82,.45,.25,mats.cyan);
}
const servicePoints=[
  {x:35,z:23,name:'전원 분전반',task:'정비 회로의 전원을 차단하세요.',action:'전원 차단'},
  {x:43,z:16,name:'엔진 정비대',task:'손상된 추진기 모듈을 교체하세요.',action:'모듈 교체'},
  {x:51,z:27,name:'항법 단말',task:'전원을 복구하고 항법 신호를 확인하세요.',action:'복구 진단'}
];
for(const [i,p] of servicePoints.entries()){
  box(p.x,.55,p.z,.85,1.1,.65,mats.dark);
  obstacles.push({x:p.x,z:p.z,w:.85,d:.65});
  box(p.x,1.14,p.z,.92,.14,.72,mats.amber);
  stations.push({...p,run:()=>repairShip(i)});
}
function transferDeck(out){
  stopCameraDrag();cameraDrag.manual=false;
  player.position.set(out?35:20,0,out?32:13);angle=0;player.rotation.y=Math.PI;facingCamera=false;near=null;
  $('#deckReturn').hidden=!out;exteriorSky.visible=out;
  close();cameraTransition=null;update();
  const footer=$('footer');
  footer.dataset.indoor??=footer.textContent;
  footer.textContent=out?'W/S 전후 이동　 A/D 방향 전환　 Shift 추진　 드래그 둘러보기　 Tab 정비 지도':footer.dataset.indoor;
  if(!out)toast('에어록 통과 · 도킹 입구로 복귀했습니다.');
  if(out)toast('선외 정비 구역 · Tab으로 작업 순서를 확인하세요');
}
function repairShip(i){
  if(!assigned('ship'))return;
  if(state.ship){toast('오늘 우주선 수리를 마쳤어요.');return}
  const n=state.shipStage||0,p=servicePoints[n];
  if(i!==n){toast(p.name+'에서 먼저 작업하세요.');return}
  modal(p.name,'<p>'+p.task+'</p>',[[p.action,()=>{
    state.shipStage=n+1;state.ship=state.shipStage===servicePoints.length;
    close();update();toast(state.ship?'우주선 수리 완료 · 항법 장치 정상':'다음 작업 · '+servicePoints[n+1].name)
  }],['잠시 중단',close]]);
}
stations.push({x:35,z:32,name:'정거장 복귀',run:()=>transferDeck(false)});
const returnArch=new T.Group();
returnArch.position.set(35,0,32.8);scene.add(returnArch);
for(const x of [-1.45,1.45])box(x,1.5,0,.18,3,.25,mats.cyan,returnArch);
box(0,3,0,3.1,.32,.3,mats.white,returnArch);doorSign(returnArch,'정거장 복귀');
$('#deckReturn').onclick=()=>transferDeck(false);

const exteriorSky=new T.Group();scene.add(exteriorSky);exteriorSky.visible=false;
const skyPositions=[];
for(let i=0;i<1250;i++){
  const y=2*(i+.5)/1250-1,azimuth=i*2.399963,radial=Math.sqrt(1-y*y);
  skyPositions.push(43+104*radial*Math.cos(azimuth),104*y,24+104*radial*Math.sin(azimuth));
}
const skyGeometry=new T.BufferGeometry();
skyGeometry.setAttribute('position',new T.Float32BufferAttribute(skyPositions,3));
const deckStars=new T.Points(skyGeometry,new T.PointsMaterial({color:0xdce8ff,size:.24,fog:false}));
exteriorSky.add(deckStars);
const gasGiant=ball(75,-39,-33,11,mat('#bd9478',.18),exteriorSky,24);
const halo=new T.Mesh(new T.RingGeometry(14,18,64),new T.MeshBasicMaterial({color:0xbda48e,side:T.DoubleSide}));
halo.position.copy(gasGiant.position);halo.rotation.set(1.12,-.24,-.32);exteriorSky.add(halo);
ball(17,-37,-39,4.6,mat('#7499bf',.2),exteriorSky,16);
ball(10,-34,-41,1.45,mat('#c4bfc7',.18),exteriorSky);
function moveOutside(forward,turn,dt){
  player.rotation.y+=turn*dt*2.5;
  updateCameraOrbit(player.rotation.y,dt,!!(turn||forward));
  if(!forward){player.position.y=.12;return}
  const speed=forward*(keys.shift?7.8:4.5)*dt;
  const dx=Math.sin(player.rotation.y)*speed;
  const dz=Math.cos(player.rotation.y)*speed;
  if(valid(player.position.x+dx,player.position.z))player.position.x+=dx;
  if(valid(player.position.x,player.position.z+dz))player.position.z+=dz;
  player.position.y=.16+.04*Math.sin(elapsed*5);
}
function doorClear(x,z){return !doors.some(d=>d.open<.75&&(d.axis==='x'?Math.abs(z-d.z)<.4&&Math.abs(x-d.x)<1.2:Math.abs(x-d.x)<.4&&Math.abs(z-d.z)<1.2))}
function tickDoors(dt){airlockTimer=Math.max(0,airlockTimer-dt);for(const d of doors){const closeTo=o=>Math.hypot(o.position.x-d.x,o.position.z-d.z)<3.2;const active=state.active>=0?visitors[state.active].model:null;const want=d.manual?airlockTimer>0:closeTo(player)||(active&&closeTo(active));if(want&&!d.wasOpen)globalThis.SpaceCatAudio?.fx('door');d.wasOpen=!!want;d.open=T.MathUtils.damp(d.open,want?1:0,8,dt);for(let i=0;i<2;i++)d.panels[i].position.x=(i?1:-1)*(.6+d.open*1.17)}}
function fadeWalls(){} // Walls remain opaque; camera collision keeps the view inside.
const enclosure=[...walls];for(const r of rooms){const roof=r.round?cyl(r.x,3.65,r.z,10,.2,mats.dark):box(r.x,3.65,r.z,r.w,.2,r.d,mats.dark);roof.userData.cameraCeiling=true;roof.material=roof.material.clone();enclosure.push(roof)}for(const [x,z,w,d]of corridors){const roof=box(x,3.65,z,w,.2,d,mats.dark);roof.userData.cameraCeiling=true;roof.material=roof.material.clone();enclosure.push(roof);}
function corridorSide(x1,z1,x2,z2){
  const horizontal=z1===z2;
  const length=Math.hypot(x2-x1,z2-z1)+.18;
  enclosure.push(box((x1+x2)/2,1.8,(z1+z2)/2,horizontal?length:.22,3.6,horizontal?.22:length,mats.wall));
}
const hubRadius=9.9;
for(const [x,z,w,d] of corridors){
  for(const side of[-1,1]){
    if(w>d){
      const edge=z+side*d/2;
      const room=rooms.find(r=>!r.round&&Math.abs(r.z-z)<r.d/2&&Math.sign(r.x)===Math.sign(x)&&Math.abs(r.x-x)<w/2+r.w/2);
      corridorSide(Math.sign(x)*Math.sqrt(hubRadius**2-edge**2),edge,room.x-Math.sign(x)*room.w/2,edge);
    }else if(x===0){
      const edge=side*w/2;
      corridorSide(edge,Math.sign(z)*Math.sqrt(hubRadius**2-edge**2),edge,Math.sign(z)*13);
    }else corridorSide(x+side*w/2,8,x+side*w/2,10.5);
  }
}
// End each circular wall span at the exact corridor edge.
const cuts=[0,2*Math.PI];
for(const [x,z,w,d] of corridors.slice(0,6))for(const side of[-1,1]){
  const px=w>d?Math.sign(x)*Math.sqrt(hubRadius**2-(z+side*d/2)**2):x+side*w/2;
  const pz=w>d?z+side*d/2:Math.sign(z)*Math.sqrt(hubRadius**2-px**2);
  cuts.push((Math.atan2(px,pz)+2*Math.PI)%(2*Math.PI));
}
cuts.sort((a,b)=>a-b);
for(let i=1;i<cuts.length;i++){
  const lo=cuts[i-1],hi=cuts[i],mid=(lo+hi)/2,x=hubRadius*Math.sin(mid),z=hubRadius*Math.cos(mid);
  if(corridors.slice(0,6).some(([cx,cz,w,d])=>w>d?x*cx>0&&Math.abs(z-cz)<d/2:z*cz>0&&Math.abs(x-cx)<w/2))continue;
  const count=Math.ceil((hi-lo)*16);
  for(let j=0;j<count;j++){
    const step=(hi-lo)/count,a=lo+(j+.5)*step;
    const wall=box(hubRadius*Math.sin(a),1.8,hubRadius*Math.cos(a),2*hubRadius*Math.sin(step/2)+.12,3.6,.21,mats.wall);
    wall.rotation.y=a;enclosure.push(wall);
  }
}
for(const [name,x,z,yaw] of [['설비실',0,-7,0],['손님방',-4.8,-7.1,Math.PI/2],['재배실 · 부엌',-7,0,Math.PI/2],['주인공 방',-4.8,7.1,Math.PI/2],['화물실',0,7,Math.PI],['관측실 · 도킹 입구',7,0,-Math.PI/2],['도킹 입구',20,6.7,Math.PI]]){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=256;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#000000';ctx.fillRect(0,0,768,256);
  ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.font='bold 58px sans-serif';ctx.fillText('▲',384,68);
  ctx.fillStyle='#ffffff';ctx.font='bold 84px sans-serif';ctx.fillText(name,384,187,722);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const marker=new T.Mesh(new T.PlaneGeometry(4.2,1.75),new T.MeshBasicMaterial({map:texture}));
  marker.rotation.order='YXZ';marker.rotation.y=yaw;marker.rotation.x=-Math.PI/2;
  marker.position.set(x,.025,z);marker.userData.floorLabel=true;marker.userData.sign=name;scene.add(marker);
}
// A recessed observation window, rather than a view through every room.
const windowPanel=box(23.87,1.8,0,.035,2,5,mat('#162c43'));enclosure.push(windowPanel);for(const z of[-2.6,2.6])box(23.8,1.8,z,.12,2.2,.1,mats.white);box(23.8,2.85,0,.12,.1,5.3,mats.white);box(23.8,.75,0,.12,.1,5.3,mats.white);for(let i=0;i<15;i++)ball(23.72,1+Math.random()*1.5,(Math.random()-.5)*4.6,.018,mats.white);const windowPlanet=ball(23.7,1.8,-.3,.65,'#5a8d9a');windowPlanet.scale.x=.03;
// Choose once per conversation; animated faces never drive camera movement.
let cameraTransition=null;
function beginCameraTransition(){cameraTransition={time:0,position:camera.position.clone(),target:cameraFollowTarget.clone()}}
function screenHeadBounds(cam,center,radius){const p=center.clone().project(cam),distance=Math.max(.1,center.distanceTo(cam.position)),vertical=radius/(distance*Math.tan(cam.fov*Math.PI/360));return {x:p.x,y:p.y,rx:vertical/cam.aspect,ry:vertical}}
function dialogueCameraPose(actor,guest){const forward=guest.position.clone().sub(actor.position).setY(0);if(forward.lengthSq()<.01)forward.set(Math.sin(actor.rotation.y),0,Math.cos(actor.rotation.y));forward.normalize();const right=new T.Vector3(-forward.z,0,forward.x);const face=guest.position.clone().setY(state.visit.mode==='rest'?1.2:guest.userData.lumi?1.43:guest.userData.suitMesh?1.91:1.7),head=actor.position.clone().setY(2);let best=null;
for(const side of[1,-1])for(const offset of[1.15,1.45,1.8,2.2,2.7,3.4,4.2]){const target=face.clone().addScaledVector(right,-side*.22);const desired=actor.position.clone().addScaledVector(forward,-2.25).addScaledVector(right,side*offset).setY(2.35);const position=cameraInside(target,desired);const probe=new T.PerspectiveCamera(70,camera.aspect,.05,100);probe.position.copy(position);probe.lookAt(target);probe.updateMatrixWorld();const h=screenHeadBounds(probe,head,.95),n=screenHeadBounds(probe,face,.72);const gap=Math.abs(h.x-n.x)-h.rx-n.rx;const direction=face.clone().sub(position),length=direction.length();const hit=new T.Raycaster(position,direction.normalize(),.05,length-.15).intersectObjects([...enclosure,...doors.flatMap(d=>d.panels)],false)[0];const score=Math.max(0,.09-gap)*100+Math.abs(.92-Math.abs(h.x))*6+(hit?100:0)+offset*.08+(side===-1?.15:0);const pose={position,target,gap,side,offset,score};if(!best||score<best.score)best=pose}best.hidePlayer=best.gap<.09;return best}
function applyCameraPose(target,desired,dt){let safe=cameraInside(target,desired),look=target.clone();if(cameraTransition){const t=cameraTransition;t.time=Math.min(.5,t.time+dt);const u=t.time/.5,blend=u*u*(3-2*u);safe=t.position.clone().lerp(safe,blend);look=t.target.clone().lerp(look,blend);safe=cameraInside(look,safe);if(t.time>=.5)cameraTransition=null}camera.position.copy(safe);cameraFollowTarget.copy(look);updateCameraCeilings(look,camera.position);smoothCameraLook(look,dt)}
function cameraInside(target,desired){scene.updateMatrixWorld();const dir=desired.clone().sub(target),length=dir.length(),ray=new T.Raycaster(target,dir.normalize(),.05,length);const colliders=[...enclosure,...doors.flatMap(d=>d.panels)];const hit=ray.intersectObjects(colliders,false)[0];if(hit)return target.clone().addScaledVector(dir,Math.max(.75,hit.distance-.22));return desired}
const furniture=[{name:'손님방 침대',x:-21,z:-10,w:2.3,d:3.5},{name:'조리대',x:-19,z:3,w:8,d:1.4},{name:'관측실 식탁',x:17,z:2,r:1.25},{name:'왼쪽 의자',x:15,z:2,w:.8,d:1},{name:'오른쪽 의자',x:19,z:2,w:.8,d:1},{name:'관측실 소파',x:22,z:-4,w:1.4,d:3},{name:'망원경',x:18,z:-5,r:.65},...[-23,-21,-19,-17].map(x=>({name:'재배 화분',x,z:-2,w:1.5,d:2}))];
function furnitureBlocked(x,z){const padding=.6;return furniture.some(o=>o.r?Math.hypot(x-o.x,z-o.z)<o.r+padding:Math.abs(x-o.x)<o.w/2+padding&&Math.abs(z-o.z)<o.d/2+padding)}
box(-16,1.05,14.25,1.8,.14,.7,mats.white);for(const x of[-16.65,-15.35])box(x,.52,14.25,.1,1.04,.5,mats.dark);const decorMeshes={};
for(const id of ['blanket','lamp','plant','mobile','rug','books','cushion','bouquet','crystal','rocket']){
  decorMeshes[id]=new T.Group();
  scene.add(decorMeshes[id]);
}
const {blanket,lamp,plant,mobile}=decorMeshes;
box(-20,.85,11.55,2.05,.13,2.05,'#344e77',blanket);
const starPattern=new T.Shape();
for(let i=0;i<10;i++){
  const a=i*Math.PI/5,r=i%2?.055:.13;
  starPattern[i?'lineTo':'moveTo'](Math.sin(a)*r,Math.cos(a)*r);
}
starPattern.closePath();
for(const [x,z] of [[-.57,-.55],[.45,-.48],[-.12,-.08],[-.52,.55],[.53,.56]]){
  const star=new T.Mesh(new T.ShapeGeometry(starPattern),new T.MeshBasicMaterial({color:0xffe7ad,side:T.DoubleSide}));
  star.position.set(-20+x,.92,11.55+z);star.rotation.x=-Math.PI/2;blanket.add(star);
}
cyl(-18.4,.08,10,.35,.16,mats.dark,lamp);
cyl(-18.4,.48,10,.06,.78,mats.white,lamp);
ball(-18.4,1.02,10,.33,mat('#ffe6aa',.75),lamp,12);
cyl(-22.5,.24,12,.30,.48,'#bc8a74',plant);
for(const [x,h,angle] of [[-.19,.61,.65],[0,.75,0],[.19,.64,-.65]]){
  const leaf=ball(-22.5+x,h,12,.22,mats.green,plant);
  leaf.scale.set(.56,1.55,.48);leaf.rotation.z=angle;
}
cyl(-16,1.18,14.25,.28,.12,mats.dark,mobile);
box(-16.23,1.65,14.25,.045,.95,.045,mats.white,mobile);
box(-16.02,2.12,14.25,.46,.045,.045,mats.white,mobile);
cyl(-15.83,1.96,14.25,.012,.30,mats.white,mobile);
ball(-15.83,1.66,14.25,.17,'#dfb885',mobile,12);
const planetRing=new T.Mesh(new T.TorusGeometry(.25,.027,5,18),mats.white);
planetRing.position.set(-15.83,1.66,14.25);planetRing.rotation.set(1.1,.1,-.28);mobile.add(planetRing);
const {rug,books,cushion,bouquet,crystal,rocket}=decorMeshes;
const matBase=cyl(-18,.027,12.6,.96,.045,'#4d878b',rug);
matBase.scale.z=.73;
for(const offset of[-.24,0,.24])box(-18+offset,.055,12.6,.065,.018,.87,'#cfccaa',rug);
for(const [i,color] of ['#62878d','#be9575','#7784ab'].entries()){
  const book=box(-15.04,1.68+i*.115,12,.61,.10,.39,color,books);
  book.rotation.y=i*.09;
}
const pillow=ball(-20,.99,9.97,.40,'#bb91a3',cushion,10);
pillow.scale.set(1,.48,.75);
cyl(-16.63,1.29,14.25,.13,.35,'#77978a',bouquet);
for(const [x,height] of [[-.09,.29],[.02,.42],[.13,.32]]){
  cyl(-16.63+x,1.44+height/2,14.25,.014,height,mats.green,bouquet);
  ball(-16.63+x,1.44+height,14.25,.08,'#e2b4b5',bouquet);
}
cyl(-15.35,1.15,14.25,.19,.06,mats.dark,crystal);
for(const [x,h] of [[-.09,.20],[.02,.32],[.12,.15]]){
  const shard=new T.Mesh(new T.OctahedronGeometry(.095),mat('#80cbbd',.3));
  shard.scale.y=h/.095;shard.position.set(-15.35+x,1.16+h,14.25);crystal.add(shard);
}
cyl(-14.97,1.84,11.42,.13,.43,mats.white,rocket);
const nose=new T.Mesh(new T.ConeGeometry(.14,.22,8),mat('#be795e'));
nose.position.set(-14.97,2.16,11.42);rocket.add(nose);
for(const side of[-1,1])box(-14.97+side*.14,1.72,11.42,.09,.17,.08,'#be795e',rocket);
ball(-14.97,1.90,11.54,.05,mats.cyan,rocket);
const noxGifts=['mobile','crystal','rocket'];
const decorNames={blanket:'별무늬 이불',lamp:'달 조명',plant:'작은 화분',mobile:'토성 모빌',rug:'궤도 러그',books:'항해 일지 세트',cushion:'노을빛 쿠션',bouquet:'별꽃 화병',crystal:'오로라 수정',rocket:'소형 로켓 모형'};
function availableDecor(){
  return {blanket:state.day>=2,lamp:state.met.length>=1,plant:state.day>=3&&state.met.length>=2,mobile:!!state.gift,crystal:state.noxGiftCount>=2,rocket:state.noxGiftCount>=3,rug:state.day>=4,books:state.day>=7,cushion:state.met.length>=3,bouquet:state.met.length>=6};
}
function announceDecor(previous){
  const now=availableDecor();
  const names=Object.keys(now).filter(id=>now[id]&&!previous[id]).map(id=>decorNames[id]);
  if(names.length)toast(names.join(' · ')+' 획득! 내 방 선반에서 배치할 수 있어요.');
}
function renderGiftDisplay(){
  const available=availableDecor();
  for(const id of Object.keys(decorMeshes))decorMeshes[id].visible=!!(available[id]&&state.roomDecor[id]);
}
function giftShelf(){
  const available=availableDecor();
  const visits=state.met.length;
  const hints={blanket:'첫 근무를 마치고 잠들기',lamp:'첫 손님 배웅하기',plant:'3일차 도달 ('+Math.min(state.day,3)+'/3) · 손님 배웅 ('+Math.min(visits,2)+'/2)',mobile:'녹스의 첫 선물',crystal:'녹스의 두 번째 선물',rocket:'녹스의 세 번째 선물',rug:'4일차 도달',books:'7일차 도달',cushion:'손님 배웅 '+Math.min(visits,3)+'/3회',bouquet:'손님 배웅 '+Math.min(visits,6)+'/6회'};
  const icons={blanket:'🌠',lamp:'🌙',plant:'🪴',mobile:'🪐',rug:'🌀',books:'📚',cushion:'🛋️',bouquet:'💐',crystal:'💎',rocket:'🚀'};
  modal('내 방 / 방 꾸미기','<div class="decor-grid" id="decorGrid"></div>',[['돌아가기',close]]);
  for(const [id,name] of Object.entries(decorNames)){
    const owned=available[id],placed=owned&&state.roomDecor[id];
    const card=document.createElement('button');
    card.className='decor-card'+(placed?' placed':'');card.disabled=!owned;
    card.innerHTML='<span class="decor-art" aria-hidden="true">'+icons[id]+'</span><strong>'+name+'</strong><small>'+(owned?(placed?'배치 중 · 보관하기':'보관 중 · 배치하기'):hints[id])+'</small>';
    card.onclick=()=>{if(!owned)return;state.roomDecor[id]=!placed;renderGiftDisplay();save();giftShelf()};
    card.dataset.item=id;$('#decorGrid').append(card);
  }
}
stations.push({x:-16,z:13.2,name:'방 꾸미기 · 선반',run:giftShelf});
const guestRooms=[rooms[0],rooms[2],rooms[3],rooms[6],rooms[7]],guestCorridors=[corridors[0],corridors[1],corridors[5],corridors[6]];
function guestAllowed(x,z){return valid(x,z)&&!furnitureBlocked(x,z)&&(guestRooms.some(r=>r.round?Math.hypot(x,z)<9.6:Math.abs(x-r.x)<r.w/2-.25&&Math.abs(z-r.z)<r.d/2-.25)||guestCorridors.some(([a,b,w,d])=>Math.abs(x-a)<w/2-.25&&Math.abs(z-b)<d/2-.25))}
function findRoute(x,z,tx,tz,avoidPlayer=false,canWalk=guestAllowed){const start=[Math.round(x*2),Math.round(z*2)],goal=[Math.round(tx*2),Math.round(tz*2)],key=p=>p.join(','),q=[start],prev=new Map([[key(start),null]]);let reached=null;for(let i=0;i<q.length&&i<16000;i++){const p=q[i];if(p[0]===goal[0]&&p[1]===goal[1]){reached=p;break}for(const n of[[p[0]+1,p[1]],[p[0]-1,p[1]],[p[0],p[1]+1],[p[0],p[1]-1]])if(!prev.has(key(n))&&(!avoidPlayer||Math.hypot(n[0]/2-player.position.x,n[1]/2-player.position.z)>1||Math.hypot(n[0]/2-player.position.x,n[1]/2-player.position.z)>Math.hypot(p[0]/2-player.position.x,p[1]/2-player.position.z))&&canWalk(n[0]/2,n[1]/2)&&canWalk((p[0]+n[0])/4,(p[1]+n[1])/4)){prev.set(key(n),p);q.push(n)}}const route=[];while(reached&&prev.get(key(reached))){route.unshift(new T.Vector3(reached[0]/2,0,reached[1]/2));reached=prev.get(key(reached))}return route}
const destinations=[[5,0],[-18,-9],[-17,1],[17,-1],[20,14]];
function inObservatory(p){return p.x>14.5&&p.x<23.5&&p.z> -7.5&&p.z<7.5}
function moveGuest(v,dt){if(!v.route.length)return;const target=v.route[0],diff=target.clone().sub(v.model.position);diff.y=0;const dist=diff.length();if(dist<.12){v.model.position.x=target.x;v.model.position.z=target.z;v.route.shift();return}diff.normalize();const nx=v.model.position.x+diff.x*dt*1.65,nz=v.model.position.z+diff.z*dt*1.65;if(guestAllowed(nx,nz)&&doorClear(nx,nz)&&(state.visit.mode==='depart'||Math.hypot(nx-player.position.x,nz-player.position.z)>.8||Math.hypot(nx-player.position.x,nz-player.position.z)>Math.hypot(v.model.position.x-player.position.x,v.model.position.z-player.position.z))){v.model.position.x=nx;v.model.position.z=nz;v.model.rotation.y=Math.atan2(diff.x,diff.z)}}
function tickVisits(dt){if(state.active<0){if(state.pending<0){state.visitIn-=dt;if(state.visitIn<=0)signalVisit()}return}const v=visitors[state.active],visit=state.visit;if(dialogue?.visitor===v)return;v.route??=[];v.pause??=2;
if(visit.mode==='rest'){visit.restRemaining=Math.max(0,visit.restRemaining-dt);if(visit.restRemaining>0){v.model.position.set(-21,.95,-8.9);v.model.rotation.x=-Math.PI/2;return}v.model.rotation.x=0;v.model.position.set(-19,0,-9);visit.mode='roam';v.pause=4;toast(v.name+'가 침대에서 일어났습니다.');update();return}
if(visit.mode==='roam'){visit.remaining-=dt;if(visit.remaining<=0){visit.mode='depart';v.route=findRoute(v.model.position.x,v.model.position.z,5,0);v.pause=0}}
if(visit.mode==='depart'&&Math.hypot(v.model.position.x-5,v.model.position.z)<1.1){farewell();return}
moveGuest(v,dt);
if(visit.mode==='restTravel'&&(!v.route.length||Math.hypot(v.model.position.x+19,v.model.position.z+9)<1.1)){visit.mode='rest';visit.restRemaining=60;v.model.position.set(-21,.95,-8.9);v.model.rotation.set(-Math.PI/2,0,0);toast(v.name+'가 침대에 누웠습니다. 약 1분 동안 쉬어요.');update();return}
if(visit.mode==='depart')return;
if(!v.route.length){v.pause-=dt;if(v.pause<=0){const choices=destinations.filter(p=>Math.hypot(p[0]-v.model.position.x,p[1]-v.model.position.z)>2),dest=choices[Math.floor(Math.random()*choices.length)];v.route=findRoute(v.model.position.x,v.model.position.z,...dest);v.pause=5+Math.random()*7}}}
const cameraFollowTarget=new T.Vector3(-17,1.1,10);let cameraInitialized=false;
function followCameraAngle(current,heading,dt){return heading+Math.PI}
function updateCameraCeilings(){for(const roof of enclosure.filter(o=>o.userData.cameraCeiling)){roof.material.transparent=false;roof.material.opacity=1;roof.material.depthWrite=true}}
function cameraRise(distance){return Math.min(distance*Math.tan(17*Math.PI/180),2.12)}
function smoothCameraLook(target,dt){camera.lookAt(target)}
if(state.pending>=0){$('#arrival').hidden=false;$('#arrival').textContent=visitors[state.pending].name+' 도착 · 도킹 입구에서 E로 맞이하세요.'}
if(state.active>=0){const v=visitors[state.active];v.model.visible=true;v.model.rotation.x=0;v.model.position.set(17,0,0);v.route=[];v.pause=2;if(state.visit.mode==='rest'){v.model.position.set(-21,.95,-8.9);v.model.rotation.set(-Math.PI/2,0,0)}else if(state.visit.mode==='restTravel')v.route=findRoute(17,0,-19,-9);else if(state.visit.mode==='depart')v.route=findRoute(17,0,5,0)}renderGiftDisplay();update();let lastTime=performance.now();const clock={getDelta(){const now=performance.now(),d=(now-lastTime)/1000;lastTime=now;return d}};let facingCamera=false;
function orientPlayer(forward,turn,dt){
  if(forward<0){
    angle+=turn*dt*2.5;
    player.rotation.y=angle;
    facingCamera=true;
    return;
  }
  if(facingCamera){
    if(!forward&&!turn)return;
    player.rotation.y=angle+Math.PI;
    facingCamera=false;
  }
  player.rotation.y+=turn*dt*2.5;
  updateCameraOrbit(player.rotation.y,dt,!!(turn||forward));
}
let frameRequest=null;
function frame(){frameRequest=requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);elapsed+=dt;if(running){if(!inTutorial()){tickVisits(dt);state.hour=Math.min(23.99,state.hour+dt/80)}const turn=dialogue?0:(keys.a||keys.arrowleft?1:0)-(keys.d||keys.arrowright?1:0);const forward=dialogue?0:(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0);if(player.position.x>30)moveOutside(forward,turn,dt);else{if(!dialogue)orientPlayer(forward,turn,dt);if(forward){const speed=dt*4.5,v=new T.Vector3(Math.sin(player.rotation.y),0,Math.cos(player.rotation.y));if(valid(player.position.x+v.x*speed,player.position.z)&&doorClear(player.position.x+v.x*speed,player.position.z))player.position.x+=v.x*speed;if(valid(player.position.x,player.position.z+v.z*speed)&&doorClear(player.position.x,player.position.z+v.z*speed))player.position.z+=v.z*speed;player.position.y=Math.sin(elapsed*15)*.025}else player.position.y=0;}if(Math.floor(elapsed*2)!==frame.tick){frame.tick=Math.floor(elapsed*2);update()}}
refreshGuide();
if(running&&!dialogue&&state.welcomeNote&&!inTutorial())welcomeNote();
if(lesson===0&&Math.hypot(player.position.x-lessonOrigin.x,player.position.z-lessonOrigin.z)>.6)showLesson(1);
near=null;let min=2.8;const candidates=inTutorial()?[lessonTarget()].filter(Boolean):[...stations];if(!inTutorial()&&state.active>=0){const v=visitors[state.active];candidates.push({x:v.model.position.x,z:v.model.position.z,name:v.name+'와 대화',guest:true})}for(const s of candidates){const d=Math.hypot(player.position.x-s.x,player.position.z-s.z);if(d<min){min=d;near=s;if(s.run===centralTerminal)break;}}$('#prompt').textContent=running&&!dialogue&&near?(near.prompt??'[ E ] '+near.name):'';let loc=rooms.find(r=>!r.round&&Math.abs(player.position.x-r.x)<r.w/2&&Math.abs(player.position.z-r.z)<r.d/2);$('#location').textContent=player.position.x>30?'선외 정비 구역'+(state.dailyQuests.includes('ship')&&!state.ship?' · '+servicePoints[state.shipStage||0].name:''):loc?.name||'중앙 통로';const view=dialogue?(dialogue.cameraPose??=dialogueCameraPose(player,dialogue.visitor.model)):null;const actualTarget=view?view.target:new T.Vector3(player.position.x,1.1,player.position.z);const target=actualTarget;if(player.position.x>30){
  const heading=angle-Math.PI;
  cameraTransition=null;
  applyCameraPose(target,target.clone().add(new T.Vector3(-Math.sin(heading)*zoom,zoom*.84,-Math.cos(heading)*zoom)),dt);
}else{
  const desired=view?view.position:target.clone().add(new T.Vector3(Math.sin(angle)*zoom+Math.cos(angle)*.55,cameraRise(zoom),Math.cos(angle)*zoom-Math.sin(angle)*.55));
  applyCameraPose(target,desired,dt);
}cameraInitialized=true;animateCat(player,dt);for(const v of visitors)if(v.model.visible){if(dialogue?.visitor!==v)animateCat(v.model,dt);if(!v.model.userData.limbs&&state.visit.mode!=='rest')v.model.position.y=Math.sin(elapsed*2)*.035;}tickDialogue(dt);tickDoors(dt);fadeWalls();const playerVisible=player.visible;if(view?.hidePlayer)player.visible=false;renderer.render(scene,camera);player.visible=playerVisible}camera.position.set(-24,4,10);frame();
addEventListener('pagehide',()=>{
  if(frameRequest!==null)cancelAnimationFrame(frameRequest);
  frameRequest=null;
});
addEventListener('pageshow',()=>{
  if(frameRequest!==null)return;
  lastTime=performance.now();
  frame();
});
