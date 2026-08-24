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
                   'js/grapple.js', 'js/monsters.js', 'js/player.js', 'js/title.js',
                   'js/planetdraw.js', 'js/planet.js', 'js/game.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f });
  const G = n => vm.runInContext(n, sb);
  const Game = G('Game');
  Game.canvas = canvas;
  Game.ctx = canvas.getContext('2d');
  G('Planet').init();
  G('Input')._defineButtons();
  return { Game, Planet: G('Planet'), Level: G('Level'), CONFIG: G('CONFIG'),
           Input: G('Input') };
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

console.log('\n--- running out of time puts you back on the planet ---');
{
  /*
     Nea: "at lev 4 you go back to the start of the level not to the
     planet map change that."

     It used to restart the level in place, silently -- same screen, hero
     back at the beginning, no explanation. On levels 2 and 3 the clock
     is generous enough that you rarely saw it; level 4 is the first one
     tight enough to really run out.

     The two punishments still differ, which is the whole reason for
     having a clock:

       fall in a hole   -> back to the last flag, keep playing
       run out of time  -> out of the level altogether

     What changed is that the harsher one is now VISIBLE.
  */
  for (const [key, name] of BUILT) {
    const { Game, Planet, Level, CONFIG } = makeGame();
    Planet.levels.forEach(l => { l.done = true; });
    Game.startLevel(key);
    if (!Level.timeLimit) {
      check(`${name} has no clock to run out`, key === 'tutorial');
      continue;
    }
    Planet.levels.find(l => l.key === key).done = false;

    Game.timeLeft = CONFIG.STEP;          // one step left on the clock
    let steps = 0;
    while (Game.mode === 'playing' && steps < 60 * 20) { Game.step(); steps++; }

    check(`${name}: the clock running out takes you to the planet`,
          Game.mode === 'planet', `ended in ${Game.mode}`);
    check(`${name}: ...and does NOT tick the level off`,
          Planet.levels.find(l => l.key === key).done === false);
    check(`${name}: ...after a moment to read why`,
          steps * CONFIG.STEP > 0.5 && steps * CONFIG.STEP < 5,
          `${(steps * CONFIG.STEP).toFixed(2)}s`);
  }
}

console.log('\n--- your thumb cannot restart the level you just finished ---');
{
  /*
     Nea: "in level 3 when you complete the level it just starts again.
     it should go back to the planet map."

     It DID go back -- for one frame. Her thumb was still on the glass
     from playing, the touch ended a moment after the mode flipped, and
     landed on the map as a TAP. Taps on the map start levels. From the
     outside: the level restarted itself.

     Every earlier test missed it because tests have no thumbs -- they
     all finished levels with no touches on screen. This one taps the
     map deliberately in the first instant after arriving, right on a
     level marker, and expects NOTHING to happen. Half a second later
     the same tap must work normally, because a map that has gone deaf
     is its own bug.
  */
  const { Game, Planet, Level, CONFIG, Input } = makeGame();
  Planet.levels.forEach(l => { l.done = true; });
  Game.startLevel('illusions');
  const P = Level.portal;
  Game.player.x = P.col * CONFIG.TILE;
  Game.player.y = P.row * CONFIG.TILE;
  Game.player.vx = 0; Game.player.vy = 0;
  let steps = 0;
  while (Game.mode === 'playing' && steps < 60 * 30) { Game.step(); steps++; }
  check('the portal put us on the planet', Game.mode === 'planet');

  // The thumb lifts NOW, exactly on the marker of the level just played
  const lvl = Planet.levels.find(l => l.key === 'illusions');
  Planet.yaw = -lvl.lon; Planet.pitch = lvl.lat;
  const spot = Planet.project(lvl.lat, lvl.lon);
  Input.tapped = { x: spot.x, y: spot.y };
  Planet.update(1 / 60);
  check('a tap in the first instant on the map starts nothing',
        Game.mode === 'planet', `started a level: mode ${Game.mode}`);
  check('...and the stale tap is thrown away', Input.tapped === null);

  // Let the grace pass, then the very same tap must work
  for (let i = 0; i < 40; i++) Planet.update(1 / 60);
  Input.tapped = { x: spot.x, y: spot.y };
  Planet.update(1 / 60);
  check('the same tap half a second later works normally',
        Game.mode === 'playing', `still in ${Game.mode}`);
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

console.log('\n--- the teaching level teaches monsters too ---');
{
  /*
     Nea: "conclude monsters to the teaching level."

     A thing the game can kill you with, that it never showed you how to
     deal with, is not difficulty -- it's a trap. Level 1 introduces both
     of her ways of fighting back, in the order you can use them: a
     crawler you can land on, and a flyer hanging where you'll swing
     through it.
  */
  const { Level, CONFIG } = makeGame();
  const kinds = Object.keys(CONFIG.MONSTERS.LETTERS);
  const count = key => {
    Level.load(key);
    return Level.map.join('').split('')
                .filter(ch => kinds.includes(ch)).length;
  };

  const tut = count('tutorial');
  console.log('  monsters per level:  ' +
              BUILT.map(([k, n]) => `${n} ${count(k)}`).join('   '));
  check('there are monsters in the tutorial', tut > 0, `${tut}`);

  Level.load('tutorial');
  const text = Level.hints.map(h => h.text).join(' ');
  check('and it says what to do about them',
        /MONSTER/i.test(text), text);
  check('...both of the ways Nea picked',
        /HEAD/i.test(text) && /through/i.test(text), text);

  check('every level after the tutorial has some too',
        BUILT.slice(1).every(([k]) => count(k) > 0),
        BUILT.slice(1).filter(([k]) => !count(k)).map(([, n]) => n).join(', '));

  /*
     Nea: "more monsters there are much to little."

     She was right -- the first pass put four in a level two hundred and
     thirty-six blocks long, which is a monster every sixty blocks, so
     you could play the whole thing and barely meet one. The rule now is
     roughly one every ten blocks outside the tutorial, and this test is
     what stops it quietly drifting back down: monsters are the first
     thing to get thrown out when a level stops being finishable, and
     without a floor under the count, "make it work again" and "take the
     monsters out" are the same move.
  */
  const width = key => { Level.load(key); return Level.cols; };
  console.log('  one monster every:  ' +
              BUILT.map(([k, n]) => `${n} ${(width(k) / count(k)).toFixed(0)}`).join('   '));
  for (const [k, n] of BUILT.slice(1))
    check(`${n} is properly infested`, width(k) / count(k) <= 10,
          `one every ${(width(k) / count(k)).toFixed(1)} blocks`);

  // The tutorial is deliberately the quiet one -- it is still teaching.
  check('...but the tutorial stays calmer than the rest',
        width('tutorial') / count('tutorial') >
        Math.max(...BUILT.slice(1).map(([k]) => width(k) / count(k))));

  const kindsIn = key => {
    Level.load(key);
    return new Set(Level.map.join('').split('').filter(ch => kinds.includes(ch)));
  };
  const everywhere = new Set();
  for (const [k] of BUILT) for (const ch of kindsIn(k)) everywhere.add(ch);
  check('all five kinds are actually used somewhere',
        everywhere.size === kinds.length,
        `missing ${kinds.filter(c => !everywhere.has(c)).join(' ')}`);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
