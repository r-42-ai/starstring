// Headless test: load the real game files, stub the browser bits,
// and check the physics actually behaves.
const fs = require('fs');
const vm = require('vm');

const sandbox = { console, Math, performance: { now: () => 0 } };
vm.createContext(sandbox);

const ROOT = __dirname + '/..';
for (const f of ['js/config.js','js/level.js','js/camera.js','js/grapple.js','js/player.js'].map(p => ROOT + '/' + p)) {
  vm.runInContext(fs.readFileSync(f,'utf8'), sandbox, { filename: f });
}
// Minimal Input stub
vm.runInContext('var Input = { left:false, right:false, jump:false, jumpPressed:false, grapple:false, grapplePressed:false, up:false, down:false };', sandbox);

const get = n => vm.runInContext(n, sandbox);
const CONFIG = get('CONFIG'), Level = get('Level'), Input = get('Input');
sandbox.Player = get('Player');
// The tests get their OWN level, so they don't break every time
// Nea rearranges the real one. A long flat floor with high ceilings:
// plenty of room to run and jump without bumping into anything.
vm.runInContext(`LEVELS['__test__'] = {
  name: 'test',
  gravityScale: 0.8,
  map: [
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..P...........................',
    '##############################',
  ],
};`, sandbox);
Level.load('__test__');
const p = new sandbox.Player();
const S = CONFIG.STEP;
const step = (n=1) => { for (let i=0;i<n;i++) p.update(S); };

let pass = 0, fail = 0;
const check = (name, cond, extra='') => {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + '  ' + extra); }
};

console.log('\n--- level ---');
check('map rows all equal length', Level.map.every(r => r.length === Level.cols));
check('spawn found', Level.spawnX > 0 && Level.spawnY > 0, `x=${Level.spawnX} y=${Level.spawnY}`);
check('gravityScale is 0.8', Level.gravityScale === 0.8);

console.log('\n--- falling and landing ---');
const startY = p.y;
step(60);
check('lands on ground within 1s', p.grounded === true, `y=${p.y.toFixed(1)} vy=${p.vy.toFixed(1)}`);
check('does not sink into the floor', p.y + p.h <= Level.pixelHeight() - CONFIG.TILE + 0.6, `feet=${(p.y+p.h).toFixed(2)}`);
check('vertical speed zeroed on land', Math.abs(p.vy) < 1);

console.log('\n--- running ---');
Input.right = true;
step(30);
check('accelerates right', p.vx > 100, `vx=${p.vx.toFixed(1)}`);
step(90);
check('caps at MAX_SPEED', Math.abs(p.vx - CONFIG.PLAYER.MAX_SPEED) < 1, `vx=${p.vx.toFixed(1)}`);
check('facing right', p.facing === 1);
Input.right = false;
step(60);
check('stops when released', Math.abs(p.vx) < 1, `vx=${p.vx.toFixed(1)}`);

console.log('\n--- jumping ---');
const groundY = p.y;
Input.jump = true; Input.jumpPressed = true;
step(1);
Input.jumpPressed = false;
check('leaves the ground', p.vy < 0, `vy=${p.vy.toFixed(1)}`);
let peak = p.y;
for (let i=0;i<120;i++){ p.update(S); if (p.y < peak) peak = p.y; if (p.grounded && i>5) break; }
const height = groundY - peak;
check('full jump height 2-5 tiles', height > 128 && height < 320, `${(height/64).toFixed(2)} tiles`);
check('lands again', p.grounded === true);

console.log('\n--- variable jump height ---');
Input.jump = true; Input.jumpPressed = true; step(1); Input.jumpPressed = false;
const g2 = groundY;
let peak2 = p.y;
for (let i=0;i<120;i++){ if (i===6) Input.jump = false; p.update(S); if (p.y<peak2) peak2 = p.y; if (p.grounded && i>5) break; }
const shortH = g2 - peak2;
check('short hop is lower than full jump', shortH < height * 0.85, `short=${(shortH/64).toFixed(2)}t full=${(height/64).toFixed(2)}t`);
Input.jump = false;
step(60);

console.log('\n--- coyote time ---');
check('coyote timer full on ground', p.coyoteTimer > 0);

console.log('\n--- walls ---');
p.respawn();
step(30);
Input.left = true;
step(180);
check('blocked by left wall, does not escape level', p.x >= -1, `x=${p.x.toFixed(1)}`);
Input.left = false;


console.log('\n--- grounded flag is stable (the flicker bug) ---');
p.respawn();
Input.left = Input.right = Input.jump = Input.jumpPressed = false;
step(60);                       // let it settle on the floor
let flickers = 0, groundedFrames = 0;
for (let i = 0; i < 300; i++) {
  const before = p.grounded;
  p.update(S);
  if (p.grounded) groundedFrames++;
  if (p.grounded !== before) flickers++;
}
check('stays grounded every frame while standing still', groundedFrames === 300, `grounded on ${groundedFrames}/300 frames`);
check('never flickers while standing still', flickers === 0, `${flickers} changes`);

console.log('\n--- grounded goes false during a jump ---');
Input.jump = true; Input.jumpPressed = true;
p.update(S); Input.jumpPressed = false;
check('airborne right after jumping', p.grounded === false);
let airFrames = 0;
for (let i = 0; i < 120; i++) { p.update(S); if (!p.grounded) airFrames++; else break; }
check('spends real time in the air', airFrames > 20, `${airFrames} frames`);
Input.jump = false;
step(90);
check('grounded again after landing', p.grounded === true);

console.log('\n--- no NaN anywhere ---');
check('position is a real number', Number.isFinite(p.x) && Number.isFinite(p.y));
check('velocity is a real number', Number.isFinite(p.vx) && Number.isFinite(p.vy));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
