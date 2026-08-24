/*
  THE ROBOT

  A little automatic player. It runs right, jumps holes, grabs rings,
  pumps the swing and launches off. It isn't a good player — but it's
  a tireless one, and it will try a level thirty different ways.

  Shared by tests/playable.test.js and tools/measure_time.js, so there
  is only ever one robot to fix.
*/
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');

// A fresh, completely separate copy of the game
function makeGame() {
  const sandbox = { console: { log(){}, warn(){}, error(){} }, Math, performance: { now: () => 0 } };
  vm.createContext(sandbox);
  for (const f of ['js/config.js','js/level.js','js/camera.js','js/grapple.js','js/player.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'), sandbox, { filename: f });
  vm.runInContext('var Input={left:false,right:false,jump:false,jumpPressed:false,' +
                  'grapple:false,grapplePressed:false,up:false,down:false};', sandbox);
  const g = n => vm.runInContext(n, sandbox);
  return { CONFIG:g('CONFIG'), Level:g('Level'), Grapple:g('Grapple'),
           Input:g('Input'), Player:g('Player'), Camera:g('Camera') };
}

// One attempt at a level, in one particular playing style.
function attempt(style, levelKey, onFrame) {
  const { CONFIG, Level, Grapple, Input, Player } = makeGame();
  Level.load(levelKey);
  const p = new Player();
  const S = CONFIG.STEP, T = CONFIG.TILE;

  let maxX = p.x, hold = 0, grappleHeld = false, deaths = 0, stuck = 0, bestX = p.x, hanging = 0;
  let onRing = null, lastRing = null, avoidFor = 0;

  for (let i = 0; i < 6000; i++) {
    const inReach = !!Grapple.anchorInReach(p);
    const aheadCol = Math.floor((p.x + p.w + style.look) / T);
    const footRow  = Math.floor((p.y + p.h + 2) / T);
    const gapAhead = !Level.isSolidAt(aheadCol, footRow);

    if (Grapple.attached) {
      hanging++;
      onRing = Grapple.anchor;
      Input.left  = Grapple.angVel < 0;
      Input.right = Grapple.angVel > 0;
      Input.grapple = true; Input.grapplePressed = false;

      const ready = Grapple.swings >= style.minSwings ||
                    Grapple.swings >= Grapple.maxSwings() - 1;

      /*
         GIVE UP AND DROP after a few seconds.

         Without this the robot could hang forever, and it did. A GREEN
         ring never breaks, so if the swing damps down before reaching
         the angle it was waiting for, nothing ever makes it let go —
         it just dangles there until the level times out.

         A real player would obviously drop off. Green rings are safe
         to rest on, not somewhere to get stuck, and the robot should
         behave like a person rather than like something with infinite
         patience.
      */
      const boredOf = hanging > 4 * 60;

      const launch = (ready && Grapple.angVel > 0 && Grapple.angle > style.release) || boredOf;
      Input.jumpPressed = launch && (i % 2 === 0);
      Input.jump = Input.jumpPressed;
    } else {
      if (hanging > 0) { lastRing = onRing; avoidFor = 70; }
      hanging = 0;
      if (avoidFor > 0) avoidFor--; else lastRing = null;
      Input.left = false; Input.right = true;

      // Grab the rope only once AIRBORNE and falling. Grappling from
      // the ledge swings you straight back into that same ledge.
      /*
         Don't grab THE SAME ring again the instant you've let go of it.

         GREEN rings never go dark, so nothing stops you re-grabbing
         the one you just dropped off — and the robot did exactly that,
         over and over in the same spot, until the level ran out.

         The first attempt at this refused ALL rings for a moment after
         letting go, which fixed the tutorial and broke the big level:
         chaining six rings in a row depends on grabbing the NEXT one
         immediately. Refuse only the ring you just left.

         (Worth knowing as a designer too: a green ring is the one kind
         you can hang on indefinitely. That's the point of it, but it
         means a green ring is somewhere a stuck player can stay stuck.)
      */
      const target = Grapple.anchorInReach(p);
      const canGrab = target && target !== lastRing;
      Input.grapplePressed = canGrab && !p.grounded && p.vy > 0 &&
                             !grappleHeld && (i % 2 === 0);
      Input.grapple = Input.grapplePressed;
      grappleHeld = Input.grapple;

      // Jump at a hole — but not if a ring is in reach, because
      // jumping puts you ABOVE the ring and you can't grapple that.
      if (p.grounded && gapAhead && !inReach) hold = style.jumpHold;

      /*
         Jump at a WALL too: pressing right and going nowhere means
         something is in the way, and the answer is to jump onto it.

         Getting this right took three goes, and the wrong answers are
         instructive:

           "is my speed nearly zero?"  — no. Hitting a wall zeroes your
           speed, then you accelerate again next frame, so it flickers
           between 0 and 53 forever and never looks stuck twice running.

           "did I move since last frame?" — also no. Pressed against a
           wall she jitters: forward nine tenths of a pixel, shoved back
           nine tenths of a pixel, over and over. Frame to frame she IS
           moving. She just isn't getting anywhere.

           "have I got any FURTHER than my best so far?" — yes. That's
           the actual question, and it doesn't care about jitter.

         Worth remembering generally: measure progress over a stretch
         of time, not between two instants.
      */
      if (p.x > bestX + 1) { bestX = p.x; stuck = 0; }
      else if (p.grounded) stuck++;
      if (stuck > 12) { hold = style.jumpHold; stuck = 0; bestX = p.x; }

      if (hold > 0) hold--;
      Input.jump = hold > 0;
      Input.jumpPressed = (hold === style.jumpHold - 1);
    }

    p.update(S);
    if (p.justRespawned) { p.justRespawned = false; deaths++; }
    if (p.x > maxX) maxX = p.x;
    if (onFrame) onFrame(p, Grapple, i);
    if (Level.touchingPortal(p)) {
      return { maxX, deaths, reachedPortal: true, seconds: i * S };
    }
  }
  return { maxX, deaths, reachedPortal: false, seconds: 6000 * S };
}

// Cautious to reckless
const styles = [];
for (const release of [0.15, 0.3, 0.5, 0.75, 1.0])
  for (const minSwings of [0, 1, 3])
    for (const jumpHold of [14, 20])
      styles.push({ release, minSwings, jumpHold, look: 46 });

// Every style, best result first
function playAll(levelKey) {
  const runs = styles.map(st => ({ style: st, ...attempt(st, levelKey) }));
  runs.sort((a, b) =>
    (b.reachedPortal - a.reachedPortal) ||
    (a.reachedPortal ? a.seconds - b.seconds : b.maxX - a.maxX));
  return runs;
}

module.exports = { makeGame, attempt, styles, playAll };
