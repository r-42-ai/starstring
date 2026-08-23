// The title screen and the tutorial's hints, without opening a browser.
const { createCanvas, loadImage } = require('/tmp/node_modules/@napi-rs/canvas');
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT=path.join(__dirname,'..');
(async()=>{
  const canvas=createCanvas(1280,720);
  const sb={console,Math,Image:class{},performance:{now:()=>Date.now()},requestAnimationFrame:()=>{},
    localStorage:{getItem:()=>null,setItem:()=>{}},
    document:{getElementById:()=>canvas,addEventListener:()=>{},createElement:()=>createCanvas(8,8)}};
  sb.window=sb; sb.window.addEventListener=()=>{}; sb.window.innerWidth=1280; sb.window.innerHeight=720;
  canvas.addEventListener=()=>{}; canvas.style={};
  canvas.getBoundingClientRect=()=>({left:0,top:0,width:1280,height:720});
  vm.createContext(sb);
  for(const f of ['js/config.js','js/assets.js','js/input.js','js/level.js','js/camera.js',
                  'js/background.js','js/terrain.js','js/title.js','js/planet.js','js/planetdraw.js',
                  'js/grapple.js','js/player.js','js/game.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),sb,{filename:f});
  const G=n=>vm.runInContext(n,sb);
  const Game=G('Game'),Assets=G('Assets'),Input=G('Input'),Level=G('Level'),CONFIG=G('CONFIG'),
        Camera=G('Camera'),Title=G('Title'),Planet=G('Planet');
  Game.canvas=canvas; Game.ctx=canvas.getContext('2d');
  for(const [n,r] of Object.entries({btn_left:'assets/ui/btn_left.png',btn_right:'assets/ui/btn_right.png',
    btn_jump:'assets/ui/btn_jump.png',btn_grapple:'assets/ui/btn_grapple.png',
    hero_idle_1:'assets/sprites/hero_idle_1.png',anchor:'assets/sprites/anchor_idle.png',
    blob:'assets/sprites/blob_idle_1.png'})) Assets.images[n]=await loadImage(path.join(ROOT,r));

  const shots=[];
  // 1 — the title
  Title.init(); Title.time=1.6; Title.draw(canvas.getContext('2d'));
  shots.push(canvas.toBuffer('image/png'));

  // 2,3,4 — the tutorial, at each hint
  Planet.init();
  Game.startLevel('tutorial');
  const spots = [[4,10],[15,10],[30,7]];
  for(const [col,row] of spots){
    Game.player.x=col*64; Game.player.y=row*64-92; Game.player.vx=0; Game.player.vy=0;
    Camera.snap(Game.player); Game.clock=1.1;
    for(let i=0;i<3;i++) Game.player.update(CONFIG.STEP);
    Game.draw(0);
    shots.push(canvas.toBuffer('image/png'));
  }

  const out=createCanvas(1280*2, 720*2);
  const o=out.getContext('2d');
  for(let i=0;i<shots.length;i++)
    o.drawImage(await loadImage(shots[i]), (i%2)*1280, ((i/2)|0)*720);
  fs.writeFileSync('/tmp/screens.png', out.toBuffer('image/png'));
  console.log('rendered', shots.length, 'screens');
})();
