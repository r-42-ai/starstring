// Four views of the planet map, turned to different angles.
const { createCanvas, loadImage } = require('/tmp/node_modules/@napi-rs/canvas');
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT=path.join(__dirname,'..');
const canvas=createCanvas(1280,720);
const sb={console,Math,localStorage:{getItem:()=>null,setItem:()=>{}}};
vm.createContext(sb);
for(const f of ['js/config.js','js/planet.js','js/planetdraw.js'])
  vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),sb,{filename:f});
vm.runInContext("var Input={_touches:new Map()}; var Game={startLevel(){}};\nvar Assets={images:{},has(n){return !!this.images[n];},get(n){return this.images[n];}};", sb);
const g=n=>vm.runInContext(n,sb);
const Planet=g('Planet'), PlanetDraw=g('PlanetDraw'), CONFIG=g('CONFIG');
Planet.init();

(async()=>{
const Assets=g('Assets');
Assets.images['hero_idle_1']=await loadImage(path.join(ROOT,'assets/sprites/hero_idle_1.png'));
const views = [
  { yaw:0.6,  pitch:-0.25, zoom:1,    done:0, label:'nothing finished yet' },
  { yaw:2.1,  pitch: 0.35, zoom:1,    done:3, label:'turned round, three done' },
  { yaw:3.6,  pitch:-0.5,  zoom:1.9,  done:6, label:'zoomed in' },
  { yaw:5.0,  pitch: 0.1,  zoom:0.62, done:9, label:'zoomed out' },
];
const out=createCanvas(1280*2, 720*2);
const o=out.getContext('2d');
views.forEach((v,i)=>{
  Planet.yaw=v.yaw; Planet.pitch=v.pitch; Planet.zoom=v.zoom;
  Planet.levels.forEach((l,k)=>{ l.done = k < v.done; });
  Planet.selected = -1;
  Planet.lastPlayed = Math.max(0, v.done - 1);
  PlanetDraw.draw(canvas.getContext('2d'), 1.4 + i);
  o.drawImage(canvas, (i%2)*1280, ((i/2)|0)*720);
});
fs.writeFileSync('/tmp/planet.png', out.toBuffer('image/png'));
console.log('rendered 4 views');
})();
