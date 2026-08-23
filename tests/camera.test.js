// Camera tests: does the view stay inside the level, does it follow,
// and does it stay still while jumping?
const fs = require('fs'); const vm = require('vm'); const path = require('path');
const ROOT = __dirname + '/..';
const sandbox = { console, Math, performance: { now: () => 0 } };
vm.createContext(sandbox);
for (const f of ['js/config.js','js/level.js','js/camera.js','js/grapple.js','js/player.js'])
  vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'), sandbox, { filename: f });
vm.runInContext('var Input = { left:false, right:false, jump:false, jumpPressed:false, grapple:false, grapplePressed:false, up:false, down:false };', sandbox);
const get = n => vm.runInContext(n, sandbox);
const CONFIG = get('CONFIG'), Level = get('Level'), Camera = get('Camera'), Input = get('Input');

let pass=0, fail=0;
const check=(n,c,e='')=>{ c ? (pass++, console.log('  PASS  '+n)) : (fail++, console.log('  FAIL  '+n+'  '+e)); };

// A long flat level of our own, so these tests measure the CAMERA
// and not whether the hero happened to fall down a hole.
vm.runInContext(`LEVELS['__camtest__'] = { name:'camtest', gravityScale:0.8, map:[
  '........................................',
  '........................................',
  '........................................',
  '........................................',
  '........................................',
  '........................................',
  '........................................',
  '........................................',
  '........................................',
  '....P...................................',
  '########################################',
  '########################################',
]};`, sandbox);
Level.load('__camtest__');
const p = new (get('Player'))();
Camera.init(p);
const S = CONFIG.STEP;
const step = n => { for(let i=0;i<n;i++){ p.update(S); Camera.update(S,p); } };

console.log('\n--- the level is bigger than the screen ---');
check('level wider than screen', Level.pixelWidth() > CONFIG.WIDTH, `${Level.pixelWidth()} vs ${CONFIG.WIDTH}`);

console.log('\n--- camera never shows outside the level ---');
let worstX = 0, worstY = 0;
Input.right = true;
for (let i=0;i<900;i++){
  p.update(S); Camera.update(S,p);
  worstX = Math.max(worstX, -Math.min(0,Camera.x), Math.max(0, Camera.x-(Level.pixelWidth()-CONFIG.WIDTH)));
  worstY = Math.max(worstY, -Math.min(0,Camera.y), Math.max(0, Camera.y-(Level.pixelHeight()-CONFIG.HEIGHT)));
}
check('never scrolls past the left/right edge', worstX < 0.001, `overshoot ${worstX.toFixed(2)}px`);
check('never scrolls past the top/bottom edge', worstY < 0.001, `overshoot ${worstY.toFixed(2)}px`);
check('actually scrolled somewhere', Camera.x > 100, `x=${Camera.x.toFixed(0)}`);
Input.right = false;
step(120);

console.log('\n--- camera follows the hero ---');
check('hero stays on screen', p.x - Camera.x > -50 && p.x - Camera.x < CONFIG.WIDTH,
      `screen x = ${(p.x-Camera.x).toFixed(0)}`);

console.log('\n--- jumping does not shake the view ---');
step(60);
const camYBefore = Camera.y;
let maxDrift = 0;
Input.jump = true; Input.jumpPressed = true;
p.update(S); Camera.update(S,p); Input.jumpPressed = false;
for (let i=0;i<90;i++){ if(i===25) Input.jump=false; p.update(S); Camera.update(S,p);
  maxDrift = Math.max(maxDrift, Math.abs(Camera.y - camYBefore)); }
check('view barely moves during a normal jump', maxDrift < 12, `drifted ${maxDrift.toFixed(1)}px`);
Input.jump = false;

console.log('\n--- looking ahead ---');
// Put the hero in the MIDDLE of the level, away from both edges,
// or the camera is clamped against a wall and can't look anywhere.
p.x = 20 * CONFIG.TILE; p.vx = 0; Camera.snap(p); step(30);
Input.right = true; step(70);
const aheadR = Camera.x + CONFIG.WIDTH/2 - (p.x + p.w/2);
Input.right = false; Input.left = true; step(140);
const aheadL = Camera.x + CONFIG.WIDTH/2 - (p.x + p.w/2);
check('peeks the way you are running', aheadR > 40 && aheadL < -40, `right=${aheadR.toFixed(0)} left=${aheadL.toFixed(0)}`);
Input.left = false;

console.log('\n--- falling in a pit (the real level) ---');
Level.load('crystal-caves-1');
p.respawn(); Camera.snap(p);
// Find a real bottomless column rather than hard-coding one — the
// level gets redesigned constantly and the holes move about.
let pitCol = -1;
for (let c = 0; c < Level.cols && pitCol < 0; c++) {
  let anySolid = false;
  for (let r = 0; r < Level.rows; r++) if (Level.isSolidAt(c, r)) anySolid = true;
  if (!anySolid) pitCol = c;
}
check('the level has a bottomless pit to test with', pitCol >= 0);
p.x = pitCol*CONFIG.TILE + 10; p.y = 4*CONFIG.TILE; p.vx = 0; p.vy = 0;
p.justRespawned = false;
let respawned = false;
for (let i=0;i<400;i++){ p.update(S);
  if (p.justRespawned) { Camera.snap(p); p.justRespawned = false; respawned = true; break; }
  Camera.update(S,p); }
check('falling in a pit respawns you', respawned);
check('camera snaps back with you', Math.abs(Camera.x - 0) < 400, `x=${Camera.x.toFixed(0)}`);

console.log('\n--- no NaN ---');
check('camera position is a real number', Number.isFinite(Camera.x) && Number.isFinite(Camera.y));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail?1:0);
