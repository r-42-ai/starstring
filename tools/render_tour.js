const { createCanvas, loadImage } = require('/tmp/node_modules/@napi-rs/canvas');
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT=path.join(__dirname,'..');
(async()=>{
  const canvas=createCanvas(1280,720);
  const sb={console,Math,Image:class{},performance:{now:()=>Date.now()},requestAnimationFrame:()=>{},
    document:{getElementById:()=>canvas,addEventListener:()=>{},createElement:()=>createCanvas(8,8)}};
  sb.window=sb; sb.window.addEventListener=()=>{}; sb.window.innerWidth=1280; sb.window.innerHeight=720;
  canvas.addEventListener=()=>{}; canvas.style={};
  canvas.getBoundingClientRect=()=>({left:0,top:0,width:1280,height:720});
  vm.createContext(sb);
  for(const f of ['js/config.js','js/assets.js','js/input.js','js/level.js','js/camera.js','js/background.js','js/terrain.js','js/grapple.js','js/monsters.js','js/player.js','js/game.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),sb,{filename:f});
  const G=n=>vm.runInContext(n,sb);
  const Game=G('Game'),Assets=G('Assets'),Input=G('Input'),Level=G('Level'),CONFIG=G('CONFIG'),Camera=G('Camera');
  Game.canvas=canvas; Game.ctx=canvas.getContext('2d');
  Level.load('crystal-caves-1'); vm.runInContext('Monsters.load(Level)', sb); vm.runInContext('Terrain.build()', sb); Input._defineButtons();
  Game.player=new (G('Player'))(); Camera.init(Game.player);
  for(const [n,r] of Object.entries({btn_left:'assets/ui/btn_left.png',btn_right:'assets/ui/btn_right.png',
    btn_jump:'assets/ui/btn_jump.png',btn_grapple:'assets/ui/btn_grapple.png',
    hero_idle_1:'assets/sprites/hero_idle_1.png',anchor:'assets/sprites/anchor_idle.png'}))
    Assets.images[n]=await loadImage(path.join(ROOT,r));

  const spots = [ [155,10,'red rings'], [196,10,'the finale'], [226,8,'the portal'] ];
  const out=createCanvas(1280, 740*spots.length);
  const o=out.getContext('2d'); o.fillStyle='#000'; o.fillRect(0,0,out.width,out.height);
  for(let i=0;i<spots.length;i++){
    const [col,row]=spots[i];
    Game.player.x=col*64; Game.player.y=row*64-92; Game.player.vx=0; Game.player.vy=0;
    Camera.snap(Game.player); Game.clock = 1.2 + i*0.7;
    Level.flags.forEach(f=>f.lit = f.col < col);
    Game.draw(0);
    o.drawImage(await loadImage(canvas.toBuffer('image/png')),0,i*740);
  }
  fs.writeFileSync('/tmp/tour.png', out.toBuffer('image/png'));
  console.log('flags', Level.flags.map(f=>f.col).join(','), ' portal', Level.portal.col+','+Level.portal.row);
})();
