// Plays the chasm by swinging, and draws the whole path plus snapshots.
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
  const Game=G('Game'),Assets=G('Assets'),Input=G('Input'),Level=G('Level'),CONFIG=G('CONFIG'),Camera=G('Camera'),Grapple=G('Grapple');
  Game.canvas=canvas; Game.ctx=canvas.getContext('2d');
  Level.load('crystal-caves-1'); vm.runInContext('Monsters.load(Level)', sb); vm.runInContext('Terrain.build()', sb); Input._defineButtons();
  Game.player=new (G('Player'))(); Camera.init(Game.player);
  for(const [n,r] of Object.entries({btn_left:'assets/ui/btn_left.png',btn_right:'assets/ui/btn_right.png',
    btn_jump:'assets/ui/btn_jump.png',btn_grapple:'assets/ui/btn_grapple.png',
    hero_idle_1:'assets/sprites/hero_idle_1.png',anchor:'assets/sprites/anchor_idle.png'}))
    Assets.images[n]=await loadImage(path.join(ROOT,r));

  const p=Game.player;
  const trail=[]; const shots=[];
  let hold=0, maxX=0, swings=0, wasAttached=false, prevTapG=false, prevTapJ=false;

  for(let i=0;i<3200;i++){
    // --- a robot that runs right, jumps gaps, and grapples over the chasm ---
    const T=CONFIG.TILE;
    const aheadCol=Math.floor((p.x+p.w+40)/T), footRow=Math.floor((p.y+p.h+2)/T);
    const gapAhead=!Level.isSolidAt(aheadCol,footRow);
    const canGrab=!!Grapple.anchorInReach(p);

    // Controls are now TAP to grab, TAP to let go, JUMP to launch off.
    // So the robot has to press for exactly one frame, not hold.
    let tapGrapple=false, tapJump=false;
    if(Grapple.attached){
      Input._keys['ArrowRight']=Grapple.angVel>0;
      Input._keys['ArrowLeft']=Grapple.angVel<0;
      // launch off once we're swinging forwards past the bottom
      // Pump up for a couple of swings FIRST, then launch. Letting go
      // on the first small swing is the slowest possible moment.
      // launch when swinging forwards FAST — that's when you're
      // carrying the most speed, which is what crosses distance
      const fast = Math.abs(Grapple.angVel) > 1.55;
      if(fast && Grapple.angle>0.55 && Grapple.angVel>0) tapJump=true;
      if(Grapple.swings>=CONFIG.GRAPPLE.MAX_SWINGS-1 && Grapple.angVel>0 && Grapple.angle>0.05) tapJump=true;
    } else {
      Input._keys['ArrowLeft']=false;
      Input._keys['ArrowRight']=true;
      if(canGrab && (gapAhead || p.vy>0)) tapGrapple=true;
      if(p.grounded && gapAhead) hold=18;
      if(hold>0) hold--;
    }
    // press-release-press, so a missed attempt gets retried
    // hold shift while swinging; release to drop, or jump to launch off
    // keep holding shift the whole time we're swinging; letting go
    // would just drop her. Launching off is done with JUMP.
    Input._keys['ShiftLeft'] = Grapple.attached ? true : (tapGrapple && (i % 2 === 0));
    Input._keys['Space']     = tapJump ? (i % 2 === 0) : (hold > 0);

    Input.update(); p.update(CONFIG.STEP);
    if(p.justRespawned){ Camera.snap(p); p.justRespawned=false; trail.length=0; }
    else Camera.update(CONFIG.STEP,p);
    Game.clock += CONFIG.STEP;

    if(Grapple.attached && !wasAttached) swings++;
    wasAttached=Grapple.attached;
    maxX=Math.max(maxX,p.x);
    if(i%2===0) trail.push({x:p.x+p.w/2,y:p.y+p.h/2,rope:Grapple.attached});

    // grab frames DURING the swing, which is the bit worth looking at
    if(Grapple.attached && shots.length<3 && (i%22===0)){ Game.draw(0); shots.push(canvas.toBuffer('image/png')); }
  }

  // A map of the whole level with the path drawn on it
  const W=Level.pixelWidth(), H=Level.pixelHeight();
  const map=createCanvas(W,H); const m=map.getContext('2d');
  m.fillStyle='#140820'; m.fillRect(0,0,W,H);
  for(let r=0;r<Level.rows;r++)for(let c=0;c<Level.cols;c++)
    if(Level.isSolidAt(c,r)){ m.fillStyle='#5b3a7e'; m.fillRect(c*64,r*64,64,64);
      if(!Level.isSolidAt(c,r-1)){m.fillStyle='#ff5fd2'; m.fillRect(c*64,r*64,64,6);} }
  for(const a of Level.anchors){ m.strokeStyle='#3ee8ff'; m.lineWidth=6;
    m.beginPath(); m.ellipse(a.x,a.y,18,26,0,0,Math.PI*2); m.stroke(); }
  for(const t of trail){ m.fillStyle=t.rope?'#9df5ff':'#ffd34d'; m.fillRect(t.x-3,t.y-3,6,6); }
  fs.writeFileSync('/tmp/swing_map.png', map.toBuffer('image/png'));

  const strip=createCanvas(1280,720*shots.length+20*(shots.length-1));
  const sctx=strip.getContext('2d'); sctx.fillStyle='#000'; sctx.fillRect(0,0,strip.width,strip.height);
  for(let i=0;i<shots.length;i++) sctx.drawImage(await loadImage(shots[i]),0,i*740);
  fs.writeFileSync('/tmp/swing_shots.png', strip.toBuffer('image/png'));

  console.log('furthest reached:', Math.round(maxX), 'of', W, '   swings taken:', swings,
              '   crossed the chasm:', maxX > 38*64);
})();
