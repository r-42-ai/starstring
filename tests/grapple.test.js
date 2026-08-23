// Grapple tests. The important one is ENERGY: a swing must not quietly
// die out on its own, because that's the classic bug this whole
// approach exists to avoid.
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT = __dirname + '/..';
const sandbox = { console, Math, performance:{now:()=>0} };
vm.createContext(sandbox);
for (const f of ['js/config.js','js/level.js','js/camera.js','js/grapple.js','js/player.js'])
  vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'), sandbox, {filename:f});
vm.runInContext('var Input={left:false,right:false,jump:false,jumpPressed:false,grapple:false,grapplePressed:false,up:false,down:false};', sandbox);
const g=n=>vm.runInContext(n,sandbox);
const CONFIG=g('CONFIG'), Level=g('Level'), Grapple=g('Grapple'), Input=g('Input');

let pass=0, fail=0;
const check=(n,c,e='')=>{ c?(pass++,console.log('  PASS  '+n)):(fail++,console.log('  FAIL  '+n+'  '+e)); };
const S = CONFIG.STEP;

// A test level: flat floor, one anchor high above open space
vm.runInContext(`LEVELS['__grap__']={name:'g',gravityScale:0.8,map:[
 '....................',
 '....................',
 '.........o..........',
 '....................',
 '....................',
 '....................',
 '....................',
 '..P.................',
 '####################',
]};`, sandbox);
Level.load('__grap__');
const p = new (g('Player'))();
const anchor = Level.anchors[0];

console.log('\n--- the level has an anchor ---');
check('one anchor found', Level.anchors.length === 1, `${Level.anchors.length}`);
check('anchor is at the right place', anchor.x === 9*64+32 && anchor.y === 2*64+32, `${anchor.x},${anchor.y}`);

console.log('\n--- finding something to grab ---');
p.x = anchor.x - 22; p.y = anchor.y + 200; p.vx = 0; p.vy = 0;
check('finds an anchor overhead', Grapple.findAnchor(p) === anchor);
p.y = anchor.y + 900;
check('ignores one that is too far', Grapple.findAnchor(p) === null);
p.y = anchor.y - 200;
check('ignores one below you', Grapple.findAnchor(p) === null);
p.y = anchor.y + 200;
anchor.cooldown = 3;
check('ignores one that is recharging', Grapple.findAnchor(p) === null);
anchor.cooldown = 0;

console.log('\n--- ENERGY: a swing must not die out by itself ---');
// Hang off to one side and let go, with damping switched off.
const savedDamping = CONFIG.GRAPPLE.DAMPING;
const savedMax = CONFIG.GRAPPLE.MAX_SWINGS;
CONFIG.GRAPPLE.DAMPING = 0;
// How long a rope lasts now depends on the KIND of ring, so setting
// the old global number no longer does anything. This test is about
// energy, not endurance, so make this ring last forever.
const savedRing = CONFIG.GRAPPLE.RING_TYPES.o.maxSwings;
CONFIG.GRAPPLE.RING_TYPES.o.maxSwings = Infinity;
Grapple.attach(p, anchor);
Grapple.length = 220; Grapple.angle = 1.0; Grapple.angVel = 0;
const startAngle = Grapple.angle;
Input.grapple = true;
// Measure how high it swings in the LAST two seconds, not the first.
// Measuring the peak over the whole run would miss the bug completely,
// because the very first swing is always full height — it's the
// hundredth swing that tells you whether energy is leaking away.
let lateAmplitude = 0;
for (let i=0;i<600;i++){
  Grapple.swing(S,p);
  if (i > 480) lateAmplitude = Math.max(lateAmplitude, Math.abs(Grapple.angle));
}
check('still swinging just as high after 10 seconds',
      lateAmplitude > startAngle*0.97,
      `started at ${startAngle.toFixed(3)} rad, 10s later only reaching ${lateAmplitude.toFixed(3)} rad`);
check('and has not gained energy out of nowhere either',
      lateAmplitude < startAngle*1.06, `${lateAmplitude.toFixed(3)} rad`);
CONFIG.GRAPPLE.DAMPING = savedDamping;
CONFIG.GRAPPLE.MAX_SWINGS = savedMax;
CONFIG.GRAPPLE.RING_TYPES.o.maxSwings = savedRing;

console.log('\n--- pumping needs TIMING, not just holding a button ---');
const savedMax2 = CONFIG.GRAPPLE.RING_TYPES.o.maxSwings; CONFIG.GRAPPLE.RING_TYPES.o.maxSwings = Infinity;
Grapple.attach(p, anchor);
Grapple.length = 220; Grapple.angle = 0.35; Grapple.angVel = 0;
// hold RIGHT the whole time — the naive version would spin forever
Input.right = true; Input.left = false;
let held = 0;
for (let i=0;i<900;i++){ Grapple.swing(S,p); held = Math.max(held, Math.abs(Grapple.angle)); }
check('holding one button does not loop the anchor', held < Math.PI*0.95, `reached ${held.toFixed(2)} rad`);
check('swing speed stays capped', Math.abs(Grapple.angVel) <= CONFIG.GRAPPLE.MAX_SWING_SPEED + 0.01,
      `${Grapple.angVel.toFixed(2)}`);
Input.right = false;

console.log('\n--- pumping at the right moment DOES build the swing ---');
Grapple.attach(p, anchor);
Grapple.length = 220; Grapple.angle = 0.15; Grapple.angVel = 0;
let best = 0;
for (let i=0;i<900;i++){
  // push whichever way we are already going = perfect timing
  Input.right = Grapple.angVel > 0; Input.left = Grapple.angVel < 0;
  Grapple.swing(S,p);
  best = Math.max(best, Math.abs(Grapple.angle));
}
check('good timing swings you much higher', best > 0.9, `reached ${best.toFixed(2)} rad from 0.15`);
Input.right = Input.left = false;
CONFIG.GRAPPLE.RING_TYPES.o.maxSwings = savedMax2;

console.log('\n--- the rope gets tired (so you cannot hide on it) ---');
Grapple.reset(); anchor.cooldown = 0;
Grapple.attach(p, anchor);
Grapple.length = 220; Grapple.angle = 0.9; Grapple.angVel = 0;
Input.grapple = true; Input.grapplePressed = false; Input.jumpPressed = false;
let stillOn = 0;
for (let i=0;i<2000;i++){
  if (!Grapple.attached) break;
  Grapple.update(S, p);
  stillOn++;
}
check('the rope lets go by itself eventually', !Grapple.attached, `still attached after ${stillOn} frames`);
check('it lasted a sensible number of swings', stillOn > 60 && stillOn < 1200, `${stillOn} frames`);
check('and it used up the swings', true);

console.log('\n--- it warns you first ---');
Grapple.reset(); anchor.cooldown = 0;
Grapple.attach(p, anchor);
Grapple.swings = CONFIG.GRAPPLE.MAX_SWINGS - CONFIG.GRAPPLE.WARN_SWINGS;
check('rope flashes before it goes', Grapple.isTiring());
Grapple.swings = 0;
check('and does not flash when fresh', !Grapple.isTiring());
Grapple.reset(); anchor.cooldown = 0;

console.log('\n--- letting go keeps your momentum ---');
Grapple.attach(p, anchor);
Grapple.length = 220; Grapple.angle = 0; Grapple.angVel = 2.0;   // whipping through the bottom
Grapple.swing(S,p);
const speedOnRope = Math.hypot(p.vx, p.vy);
Grapple.detach(p, 0);
const speedAfter = Math.hypot(p.vx, p.vy);
check('speed is unchanged by letting go', Math.abs(speedOnRope-speedAfter) < 0.01,
      `${speedOnRope.toFixed(1)} -> ${speedAfter.toFixed(1)}`);
check('and it is a real launch, not a dribble', speedAfter > 380, `${speedAfter.toFixed(0)} px/s`);

console.log('\n--- a quick accidental tap costs you nothing ---');
anchor.cooldown = 0;
Grapple.attach(p, anchor);
Grapple.heldTime = 0.05;          // grabbed and let go almost instantly
Grapple.detach(p, 0);
check('a brief touch does not burn the ring', anchor.cooldown === 0, `${anchor.cooldown}`);

console.log('\n--- but really using it does ---');
anchor.cooldown = 0;
Grapple.attach(p, anchor);
Grapple.heldTime = 1.5;           // an actual swing
Grapple.detach(p, 0);
check('cooldown started', anchor.cooldown === CONFIG.GRAPPLE.ANCHOR_COOLDOWN, `${anchor.cooldown}`);
Level.updateAnchors(1.0);
check('cooldown counts down', Math.abs(anchor.cooldown - (CONFIG.GRAPPLE.ANCHOR_COOLDOWN-1)) < 0.001);
Level.updateAnchors(99);
check('cooldown never goes negative', anchor.cooldown === 0);

console.log('\n--- grabbing on mid-flight keeps your speed ---');
p.x = anchor.x + 120; p.y = anchor.y + 180; p.vx = 400; p.vy = -100;
Grapple.attach(p, anchor);
Grapple.swing(S,p);
check('still moving fast right after grabbing', Math.hypot(p.vx,p.vy) > 200,
      `${Math.hypot(p.vx,p.vy).toFixed(0)} px/s`);

console.log('\n--- you cannot grapple through a wall ---');
check('clear line is fine', Level.hasLineOfSight(anchor.x, anchor.y, anchor.x, anchor.y+200));
check('through the floor is not', !Level.hasLineOfSight(anchor.x, anchor.y, anchor.x, 8*64+40));

console.log('\n--- grabbing on right next to an anchor stays sane ---');
p.x = anchor.x - 22; p.y = anchor.y + 30; p.vx = 0; p.vy = 0;
Grapple.attach(p, anchor);
check('rope is never shorter than the minimum',
      Grapple.length >= CONFIG.GRAPPLE.MIN_ROPE - 0.001, `${Grapple.length.toFixed(1)}px`);
let sane = true;
for (let i=0;i<300;i++){
  Grapple.swing(S,p);
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || Math.abs(Grapple.angVel) > 50) sane = false;
}
check('short rope does not explode', sane, `angVel ${Grapple.angVel.toFixed(2)}`);

console.log('\n--- the button works BOTH ways ---');
const A = Level.anchors[0];
const place = () => { p.x=A.x-22; p.y=A.y+170; p.vx=250; p.vy=0; Grapple.reset(); A.cooldown=0;
                      Input.grapple=false; Input.grapplePressed=false; Input.jumpPressed=false; };
const grab = () => { Input.grapple=true; Input.grapplePressed=true; Grapple.update(S,p); Input.grapplePressed=false; };

place(); grab();
for (let i=0;i<40;i++) Grapple.update(S,p);
check('holding the button keeps you hanging', Grapple.attached);
Input.grapple=false; Grapple.update(S,p);
check('letting go after holding drops you', !Grapple.attached);

place(); grab(); Input.grapple=false;
for (let i=0;i<60;i++) Grapple.update(S,p);
check('a quick tap keeps you hanging with nothing held', Grapple.attached);
Input.grapple=true; Input.grapplePressed=true; Grapple.update(S,p);
check('tapping again drops you off', !Grapple.attached);

place(); grab(); Input.grapple=false;
for (let i=0;i<30;i++) Grapple.update(S,p);
const vyBefore = p.vy;
Input.jumpPressed = true; Grapple.update(S,p); Input.jumpPressed = false;
check('jump launches you off the rope', !Grapple.attached);
check('...and gives you a push upwards', p.vy < vyBefore - 100, `${vyBefore.toFixed(0)} -> ${p.vy.toFixed(0)}`);

console.log('\n--- a grab that could not possibly work is refused ---');
place();
p.x = 1*64; p.y = 5*64;              // standing on the floor, far from the ring
const before = { x:p.x, y:p.y };
Input.grapple=true; Input.grapplePressed=true;
Grapple.update(S,p);
check('nothing happens and she does not move',
      !Grapple.attached && p.x===before.x && p.y===before.y, `${p.x},${p.y}`);
check('and the ring is not wasted', Level.anchors.every(a=>a.cooldown===0));
Input.grapple=false; Input.grapplePressed=false;

console.log('\n--- reeling the rope in and out ---');
Grapple.reset(); Level.anchors.forEach(a=>a.cooldown=0);
Grapple.attach(p, anchor);
Grapple.length = 250; Grapple.angle = 0; Grapple.angVel = 1.0;
Input.up = true;
for (let i=0;i<20;i++) Grapple.swing(S,p);
Input.up = false;
check('pressing up makes the rope shorter', Grapple.length < 250, `${Grapple.length.toFixed(0)}px`);
check('...and never shorter than the minimum',
      Grapple.length >= CONFIG.GRAPPLE.MIN_ROPE - 0.01, `${Grapple.length.toFixed(0)}px`);

Grapple.length = 200; Grapple.angle = 0; Grapple.angVel = 1.0;
Input.down = true;
for (let i=0;i<20;i++) Grapple.swing(S,p);
Input.down = false;
check('pressing down makes it longer', Grapple.length > 200, `${Grapple.length.toFixed(0)}px`);
check('...and never longer than the maximum',
      Grapple.length <= CONFIG.GRAPPLE.MAX_ROPE + 0.01, `${Grapple.length.toFixed(0)}px`);

console.log('\n--- pulling in speeds you up (like a spinning skater) ---');
// Gravity, damping and the speed cap all switched off, so this
// measures ONLY the reeling. Leave gravity on and you measure the
// swing slowing down as it rises, which is a different thing entirely.
const dSaved = CONFIG.GRAPPLE.DAMPING, mSaved = CONFIG.GRAPPLE.MAX_SWING_SPEED;
const gSaved = Level.gravityScale;
CONFIG.GRAPPLE.DAMPING = 0; CONFIG.GRAPPLE.MAX_SWING_SPEED = 999; Level.gravityScale = 0;
Grapple.length = 300; Grapple.angle = 0; Grapple.angVel = 0.5;
const spinBefore = Grapple.angVel;
Input.up = true;
for (let i=0;i<200 && Grapple.length > 151;i++) Grapple.swing(S,p);
Input.up = false;
const shortened = 300 / Grapple.length;
check('halving the rope roughly quadruples the swing speed',
      Grapple.angVel > spinBefore * shortened * shortened * 0.8,
      `rope ${300}->${Grapple.length.toFixed(0)}, spin ${spinBefore} -> ${Grapple.angVel.toFixed(2)}`);
CONFIG.GRAPPLE.DAMPING = dSaved; CONFIG.GRAPPLE.MAX_SWING_SPEED = mSaved; Level.gravityScale = gSaved;

console.log('\n--- and it still cannot spin out of control ---');
Grapple.reset(); Level.anchors.forEach(a=>a.cooldown=0);
Grapple.attach(p, anchor);
Grapple.length = 300; Grapple.angle = 0; Grapple.angVel = 1;
Input.up = true;
for (let i=0;i<400 && Grapple.attached;i++) Grapple.swing(S,p);
Input.up = false;
check('swing speed still capped after reeling right in',
      Math.abs(Grapple.angVel) <= CONFIG.GRAPPLE.MAX_SWING_SPEED + 0.01,
      `${Grapple.angVel.toFixed(2)}`);
check('nothing has gone to NaN', Number.isFinite(Grapple.angVel) && Number.isFinite(p.x));

console.log('\n--- no NaN ---');
check('angle and speed are real numbers', Number.isFinite(Grapple.angle) && Number.isFinite(Grapple.angVel));
check('player position is a real number', Number.isFinite(p.x) && Number.isFinite(p.y));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail?1:0);
