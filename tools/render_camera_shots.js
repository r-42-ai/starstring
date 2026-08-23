// Three shots across the level, to see the camera actually working
const { createCanvas, loadImage } = require('/tmp/node_modules/@napi-rs/canvas');
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT='/sessions/sleepy-vibrant-dirac/mnt/starstring';
(async()=>{
  const canvas=createCanvas(1280,720);
  const sandbox={console,Math,Image:class{},performance:{now:()=>Date.now()},requestAnimationFrame:()=>{},
    document:{getElementById:()=>canvas,addEventListener:()=>{},createElement:()=>createCanvas(8,8)}};
  sandbox.window=sandbox; sandbox.window.addEventListener=()=>{};
  sandbox.window.innerWidth=1280; sandbox.window.innerHeight=720;
  canvas.addEventListener=()=>{}; canvas.style={};
  canvas.getBoundingClientRect=()=>({left:0,top:0,width:1280,height:720});
  vm.createContext(sandbox);
  for(const f of ['js/config.js','js/assets.js','js/input.js','js/level.js','js/camera.js','js/background.js','js/terrain.js','js/grapple.js','js/player.js','js/game.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),sandbox,{filename:f});
  const g=n=>vm.runInContext(n,sandbox);
  const Game=g('Game'),Assets=g('Assets'),Input=g('Input'),Level=g('Level'),CONFIG=g('CONFIG'),Camera=g('Camera');
  Game.canvas=canvas; Game.ctx=canvas.getContext('2d');
  Level.load('crystal-caves-1'); vm.runInContext('Terrain.build()', sandbox); Input._defineButtons();
  Game.player=new (g('Player'))(); Camera.init(Game.player);
  for(const [n,r] of Object.entries({btn_left:'assets/ui/btn_left.png',btn_right:'assets/ui/btn_right.png',
    btn_jump:'assets/ui/btn_jump.png',btn_grapple:'assets/ui/btn_grapple.png',
    hero_idle_1:'assets/sprites/hero_idle_1.png'})) Assets.images[n]=await loadImage(path.join(ROOT,r));

  let tick=0, hold=0;
  const step=n=>{for(let i=0;i<n;i++){
    // jump automatically when there's no floor a bit ahead, so the
    // hero actually crosses the gaps instead of falling in forever
    const p=Game.player, T=CONFIG.TILE;
    const aheadCol=Math.floor((p.x+p.w+40)/T), footRow=Math.floor((p.y+p.h+2)/T);
    const gapAhead=!Level.isSolidAt(aheadCol, footRow);
    // Hold the button down for a while after taking off. Letting go
    // immediately gives the shortest possible hop, because the game
    // has variable jump height — which is correct, but useless here.
    if (p.grounded && gapAhead) hold = 18;
    if (hold > 0) hold--;
    Input._keys['Space'] = hold > 0;
    tick++;
    Input.update();Game.player.update(CONFIG.STEP);
    if(Game.player.justRespawned){Camera.snap(Game.player);Game.player.justRespawned=false;}
    else Camera.update(CONFIG.STEP,Game.player);}};

  const shots=[];
  step(60); Game.draw(0); shots.push(canvas.toBuffer('image/png'));
  Input._keys['ArrowRight']=true; step(150);
  Input._keys['ArrowRight']=false; step(40);
  // three snapshots a fraction of a second apart, standing still, so
  // the only thing that changes is the glitter
  for(let k=0;k<2;k++){ Game.clock += 0.32; step(6); Game.draw(0); shots.push(canvas.toBuffer('image/png')); }

  // stack them into one tall image
  const out=createCanvas(1280, 720*3+20);
  const o=out.getContext('2d'); o.fillStyle='#000'; o.fillRect(0,0,out.width,out.height);
  for(let i=0;i<3;i++) o.drawImage(await loadImage(shots[i]),0,i*730);
  fs.writeFileSync('/tmp/cam.png', out.toBuffer('image/png'));
  console.log('camX', Camera.x.toFixed(0), 'of max', (Level.pixelWidth()-CONFIG.WIDTH), ' playerX', Math.round(Game.player.x));
})();
