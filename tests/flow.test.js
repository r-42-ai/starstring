/*
  GETTING IN AND BACK OUT AGAIN

  Nea: "make that after the level 3 u come back to planet sight."

  Every level has to hand you back to the map when you finish it, and
  tick itself off on the way. That sounds obvious, and it was already
  true — but it lived in the middle of `loop()`, tangled up with frame
  timing and requestAnimationFrame, so nothing could ever check it.
  Anything that can't be tested quietly stops being true one day.

  That's why Game.step() exists: one step of a level, no frames, no
  drawing, no browser. Which means a test can play the ending.

  This file also checks the OTHER rule Nea gave about levels, which is
  about hints:

    "the rules you had in lev 1 dont have to pop up again in lev 2"
    "in the illusions there are to many clues"

  Both are the same rule from two directions: say a thing once. So a
  test counts hints and makes sure they never go back up.
*/
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const check = (n, c, e = '') =>
  c ? (pass++, console.log('  PASS  ' + n))
    : (fail++, console.log('  FAIL  ' + n + '  ' + e));

/*
   A canvas that draws nothing.

   The one trap: createLinearGradient has to return something with an
   addColorStop on it. Returning undefined makes terrain.js die deep
   inside a function that has nothing to do with what we're testing,
   with an error that tells you nothing.
*/
function fakeCanvas(w = 1280, h = 720) {
  const gradient = { addColorStop() {} };
  const ctx = new Proxy({}, {
    get(_, k) {
      if (k === 'createLinearGradient' || k === 'createRadialGradient' ||
          k === 'createPattern') return () => gradient;
      if (k === 'measureText') return () => ({ width: 0 });
      if (k === 'canvas') return canvas;
      if (k === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      return () => {};
    },
    set() { return true; },
  });
  const canvas = {
    width: w, height: h, style: {},
    getContext: () => ctx,
    addEventListener() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: w, height: h }),
    toDataURL: () => '',
  };
  return canvas;
}

function makeGame() {
  const canvas = fakeCanvas();
  const store = {};
  const sb = {
    console: { log() {}, warn() {}, error() {} }, Math,
    Image: class { set src(v) {} },
    performance: { now: () => 0 },
    requestAnimationFrame() {},
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
    },
    document: {
      getElementById: () => canvas,
      addEventListener() {},
      createElement: () => fakeCanvas(8, 8),
    },
  };
  sb.window = sb;
  sb.addEventListener = () => {};
  sb.innerWidth = 1280; sb.innerHeight = 720;
  vm.createContext(sb);
  for (const f of ['js/config.js', 'js/assets.js', 'js/input.js', 'js/level.js',
                   'js/camera.js', 'js/background.js', 'js/terrain.js',
                   'js/grapple.js', 'js/player.js', 'js/title.js',
                   'js/planetdraw.js', 'js/planet.js', 'js/game.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f });
  const G = n => vm.runInContext(n, sb);
  const Game = G('Game');
  Game.canvas = canvas;
  Game.ctx = canvas.getContext('2d');
  G('Planet').init();
  G('Input')._defineButtons();
  return { Game, Planet: G('Planet'), Level: G('Level'), CONFIG: G('CONFIG') };
}

// Play a level's ending: stand in the portal and let time run.
function finish(key) {
  const { Game, Planet, Level, CONFIG } = makeGame();
  Planet.levels.forEach(l => { l.done = true; });   // everything open
  Game.startLevel(key);
  const startedIn = Game.mode;

  const P = Level.portal;
  Game.player.x = P.col * CONFIG.TILE;
  Game.player.y = P.row * CONFIG.TILE;
  Game.player.vx = 0; Game.player.vy = 0;

  let steps = 0;
  while (Game.mode === 'playing' && steps < 60 * 30) { Game.step(); steps++; }
  return { Game, Planet, startedIn, seconds: steps * CONFIG.STEP };
}

// Every level that exists, in the order the map offers them -- so a new
// level is covered the moment it's added to Planet, with no edit here.
const BUILT = (() => {
  const { Planet } = makeGame();
  return Planet.levels.filter(l => l.key).map(l => [l.key, l.name]);
})();

console.log('\n--- every level hands you back to the map ---');
for (const [key, name] of BUILT) {
  const r = finish(key);
  check(`${name}: starts in the level`, r.startedIn === 'playing', r.startedIn);
  check(`${name}: the portal takes you back out to the planet`,
        r.Game.mode === 'planet', `ended in ${r.Game.mode}`);
  check(`${name}: and it is ticked off on the map`,
        r.Planet.levels.find(l => l.key === key).done === true);
  check(`${name}: the way out is a moment, not a wait`,
        r.seconds > 0.2 && r.seconds < 6, `${r.seconds.toFixed(2)}s`);
}

console.log('\n--- finishing level 3 does not promise a level 4 ---');
{
  const { Game, Planet } = makeGame();
  // Whichever level is next to be BUILT -- not a hardcoded number,
  // which goes stale the moment that level ships.
  const nextUp = Planet.levels.findIndex(l => !l.key);
  Planet.levels.forEach((l, i) => { l.done = i < nextUp; });
  check(`all ${nextUp} built levels are done`,
        Planet.levels.slice(0, nextUp).every(l => l.done));
  check(`level ${nextUp + 1} is unlocked...`, Planet.isUnlocked(nextUp));
  check('...but it is not offered as playable', !Planet.isPlayable(nextUp));
  check('nothing was left running in a level', Game.mode !== 'playing');
}

console.log('\n--- each level only says what the one before it did not ---');
{
  const { Level } = makeGame();
  const LEVELS = BUILT.map(([k]) => {
    Level.load(k);
    return { key: k, name: Level.name, hints: (Level.hints || []).map(h => h.text) };
  });

  const counts = LEVELS.map(l => l.hints.length);
  console.log('  hints per level: ' + counts.join(' -> '));
  check('level 1 teaches the most, because it teaches everything',
        counts[0] > counts[1], counts.join(','));
  check('and it never goes back up again',
        counts.every((c, i) => i === 0 || c <= counts[i - 1]), counts.join(','));

  // The words level 1 already owns. If a later level says one of these
  // it is re-teaching something the player has already been shown.
  /*
     Whole words only. The first version of this test used includes(),
     and "the clock is RUNning" failed for re-explaining how to run.
     A substring is not a word.
  */
  const taught = ['GREEN', 'RED', 'FLAG', 'JUMP', 'GRAPPLE', 'run', 'swing'];
  for (const l of LEVELS.slice(1))
    for (const word of taught) {
      const re = new RegExp('\\b' + word + '\\b');
      check(`${l.name} does not re-explain "${word}"`,
            !l.hints.some(t => re.test(t)),
            l.hints.find(t => re.test(t)) || '');
    }

  check('The Illusions gives the rule and never an answer',
        LEVELS[2].hints.length === 1, LEVELS[2].hints.join(' | '));
  for (const l of LEVELS.slice(3))
    check(`${l.name} says one thing and then shuts up`,
          l.hints.length <= 1, `${l.hints.length} hints`);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
