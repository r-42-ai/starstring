// Render a strip of frames mid-run, to check the bounce/lean/squash read
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
  for(const f of ['js/config.js','js/assets.js','js/input.js','js/level.js','js/camera.js','js/background.js','js/terrain.js','js/grapple.js','js/monsters.js','js/player.js','js/game.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),sandbox,{filename:f});
  const get=n=>vm.runInContext(n,sandbox);
  const Game=get('Game'),Assets=get('Assets'),Input=get('Input'),Level=get('Level'),CONFIG=get('CONFIG');
  Game.canvas=canvas; Game.ctx=canvas.getContext('2d');
  vm.runInContext(`LEVELS['__anim__']={name:'anim',gravityScale:0.8,map:[
    '..............................','..............................',
    '..............................','..............................',
    '..............................','..............................',
    '..P...........................','##############################']};`, sandbox);
  Level.load('__anim__'); vm.runInContext('Monsters.load(Level)', sb); Input._defineButtons(); Game.player=new (get('Player'))();
  Assets.images['hero_idle_1']=await loadImage(path.join(ROOT,'assets/sprites/hero_idle_1.png'));

  const step=n=>{for(let i=0;i<n;i++){Input.update();Game.player.update(CONFIG.STEP);}};
  step(60);
  Input._keys['ArrowRight']=true; step(45);   // up to full speed

  // capture 8 frames across one running stride
  const out=createCanvas(8*150, 200);
  const octx=out.getContext('2d');
  octx.fillStyle='#1a0c28'; octx.fillRect(0,0,out.width,out.height);
  for(let i=0;i<8;i++){
    step(4);
    Game.draw(0);
    const p=Game.player;
    octx.drawImage(canvas, p.x-55, p.y-40, 150, 200, i*150, 0, 150, 200);
  }
  fs.writeFileSync('/tmp/anim_strip.png', out.toBuffer('image/png'));
  console.log('stepPhase', Game.player.stepPhase.toFixed(2), 'squash', Game.player.squash.toFixed(3), 'vx', Math.round(Game.player.vx));
})();
