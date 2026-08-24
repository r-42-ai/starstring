// Runs the REAL game files against a real canvas implementation,
// with just enough browser stubbed out to let them load.
const { createCanvas, loadImage } = require('/tmp/node_modules/@napi-rs/canvas');
const fs = require('fs'); const vm = require('vm'); const path = require('path');
const ROOT = '/sessions/sleepy-vibrant-dirac/mnt/starstring';

(async () => {
  const canvas = createCanvas(1280, 720);
  const listeners = {};
  const sandbox = {
    console, Math, Image: class {}, performance: { now: () => Date.now() },
    requestAnimationFrame: () => {},
    document: { getElementById: () => canvas, addEventListener: () => {}, createElement: () => createCanvas(8,8) },
  };
  sandbox.window = sandbox;
  sandbox.window.addEventListener = (n, f) => { listeners[n] = f; };
  sandbox.window.innerWidth = 1280; sandbox.window.innerHeight = 720;
  canvas.addEventListener = () => {}; canvas.style = {};
  canvas.getBoundingClientRect = () => ({left:0,top:0,width:1280,height:720});
  vm.createContext(sandbox);

  for (const f of ['js/config.js','js/assets.js','js/input.js','js/level.js','js/camera.js','js/background.js','js/terrain.js','js/grapple.js','js/monsters.js','js/player.js','js/game.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'), sandbox, {filename:f});

  const get = n => vm.runInContext(n, sandbox);
  const Game = get('Game'), Assets = get('Assets'), Input = get('Input'), Level = get('Level');

  // Wire up the real game, then load the real PNGs into its asset store
  Game.canvas = canvas; Game.ctx = canvas.getContext('2d');
  Level.load('crystal-caves-1'); vm.runInContext('Monsters.load(Level)', sb); vm.runInContext('Terrain.build()', sandbox);
  Input._defineButtons();
  Game.player = new (get('Player'))();

  for (const [name, rel] of Object.entries({
    btn_left:'assets/ui/btn_left.png', btn_right:'assets/ui/btn_right.png',
    btn_jump:'assets/ui/btn_jump.png', btn_grapple:'assets/ui/btn_grapple.png',
    hero_idle_1:'assets/sprites/hero_idle_1.png',
  })) Assets.images[name] = await loadImage(path.join(ROOT, rel));

  const step = n => { for (let i=0;i<n;i++){ Input.update(); Game.player.update(get('CONFIG').STEP);} };

  step(90);                                     // settle on the ground
  Game.draw(0); fs.writeFileSync('/tmp/r_idle.png', canvas.toBuffer('image/png'));

  Input._keys['ArrowLeft'] = true; step(40);    // run left (tests the flip)
  Input._touches.set(1, {x:Input._buttons[0].x, y:Input._buttons[0].y});  // press LEFT
  Input._touches.set(2, {x:Input._buttons[2].x, y:Input._buttons[2].y});  // press JUMP
  Input.update();
  Game.draw(0); fs.writeFileSync('/tmp/r_left.png', canvas.toBuffer('image/png'));

  console.log('grounded:', Game.player.grounded, ' x:', Math.round(Game.player.x), ' facing:', Game.player.facing);
})();
