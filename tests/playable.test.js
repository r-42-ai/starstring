/*
  CAN THE LEVEL ACTUALLY BE FINISHED?

  This one plays the game. A little robot runs right, jumps gaps,
  grabs rings, pumps the swing and launches off. It tries a whole
  range of playing styles — cautious, reckless, patient — and the
  level passes if ANY of them gets to the end.

  For Nea: this is the test that answers "is my level possible?".
  It can't tell you whether it's FUN. But if this fails, nobody can
  finish your level, however good a player they are.
*/
const { makeGame, playAll } = require('./robot.js');

let pass=0, fail=0;
const check=(n,c,e='')=>{ c?(pass++,console.log('  PASS  '+n)):(fail++,console.log('  FAIL  '+n+'  '+e)); };

// The level ends AT THE PORTAL now, so that's what we aim for.
const probe = makeGame();
probe.Level.load('crystal-caves-1');
const portal = probe.Level.portal;
console.log(`\nThe level is ${probe.Level.cols} blocks wide.`);
console.log(portal ? `The portal is at block ${portal.col}, row ${portal.row}.\n`
                   : 'WARNING: this level has no portal (no X in the map).\n');

// A range of playing styles: cautious to reckless
const styles = [];
for (const release of [0.15, 0.3, 0.5, 0.75, 1.0])
  for (const minSwings of [0, 1, 3])
    for (const jumpHold of [14, 20])
      styles.push({ release, minSwings, jumpHold, look: 46 });

const runs = playAll('crystal-caves-1');
const best = runs[0];
const bestStyle = best.style;

const blocksReached = Math.round(best.maxX / probe.CONFIG.TILE);
console.log(`Best run reached block ${blocksReached} of ${probe.Level.cols}` +
            `  (release ${bestStyle.release}, wait ${bestStyle.minSwings} swings)\n`);

check('gets past the first small jumps',      best.maxX > 38*64,  `stuck at block ${blocksReached}`);
check('crosses the first rope gap',           best.maxX > 59*64,  `stuck at block ${blocksReached}`);
check('crosses the stepping stones',          best.maxX > 78*64,  `stuck at block ${blocksReached}`);
check('crosses THE GREAT CHASM',              best.maxX > 131*64, `stuck at block ${blocksReached}`);
check('gets through the low roof section',    best.maxX > 151*64, `stuck at block ${blocksReached}`);
check('crosses the second chasm',             best.maxX > 171*64, `stuck at block ${blocksReached}`);
check('reaches the six-ring finale',          best.maxX > 190*64, `stuck at block ${blocksReached}`);
check('SWINGS INTO THE PORTAL', best.reachedPortal,
      `got to block ${blocksReached}; the portal is at block ${portal ? portal.col : '?'}`);

console.log('\n--- is the time limit fair? ---');
const limit = probe.Level.timeLimit;
if (!limit) {
  console.log('  (this level has no time limit)');
} else {
  console.log(`  limit ${limit}s, robot finished in ${best.seconds.toFixed(1)}s`);
  check('the level CAN be finished inside the time limit',
        best.reachedPortal && best.seconds < limit,
        `robot took ${best.seconds.toFixed(1)}s but only gets ${limit}s`);
  // The robot never hesitates. A person needs a lot more room than it does.
  check('and with plenty of room for a person who is still learning',
        best.seconds < limit * 0.45,
        `robot uses ${(best.seconds/limit*100).toFixed(0)}% of the limit — too tight for a human`);
}

console.log('\n=== LEVEL 1: the tutorial ===');
// The teaching level has one job: NOBODY can fail to finish it.
// Not "a good player can" — anybody, playing any way at all.
const tut = makeGame();
tut.Level.load('tutorial');
check('the tutorial has no clock', tut.Level.timeLimit === 0,
      `it has ${tut.Level.timeLimit}s`);
check('the tutorial has hints', tut.Level.hints.length >= 4,
      `${tut.Level.hints.length} hints`);
check('nothing in the tutorial is bottomless', (() => {
  for (let c = 0; c < tut.Level.cols; c++) {
    let solid = false;
    for (let r = 0; r < tut.Level.rows; r++) if (tut.Level.isSolidAt(c, r)) solid = true;
    if (!solid) return false;
  }
  return true;
})(), 'there is a column with no floor at all — you could fall out of the world');

const tutRuns = playAll('tutorial');
const tutWins = tutRuns.filter(r => r.reachedPortal).length;
console.log(`  ${tutWins} of ${tutRuns.length} playing styles finished it`);
check('every single playing style finishes the tutorial',
      tutWins === tutRuns.length,
      `only ${tutWins} of ${tutRuns.length} managed it \u2014 a teaching level must be unfailable`);

console.log('\n=== LEVEL 3: The Illusions ===');
const ill = makeGame();
ill.Level.load('illusions');
console.log(`  ${ill.Level.illusions.length} illusion blocks, ${ill.Level.anchors.length} rings`);
check('it is full of illusions', ill.Level.illusions.length > 40,
      `only ${ill.Level.illusions.length}`);

const illRuns = playAll('illusions');
const illBest = illRuns[0];
const illBlock = Math.round(illBest.maxX / 64);
console.log(`  best run reached block ${illBlock} of ${ill.Level.cols}` +
            (illBest.reachedPortal ? ` in ${illBest.seconds.toFixed(1)}s` : ''));
check('The Illusions can be finished at all', illBest.reachedPortal,
      `stuck at block ${illBlock}`);
check('...inside its time limit', illBest.reachedPortal && illBest.seconds < ill.Level.timeLimit,
      `${illBest.seconds.toFixed(1)}s of ${ill.Level.timeLimit}s`);

/*
   ===================== THE DIFFICULTY CURVE =====================

   Nea: "make lev 4 5 and 6 every level gets a bit harder."

   The obvious way to check that is to count how many of the thirty
   playing styles can finish each level, and expect the number to fall.
   I tried it, and it does not work.

   The robot has ONE strategy. It runs right, grabs a ring when it is
   falling, pumps, lets go at its release angle. It plays that strategy
   perfectly and identically every time. So a level either fits the
   strategy or it does not, and the count lands on 2 or 4 and stays
   there no matter what I do -- doubling the ring chains from 5 to 11
   moved it not at all. Worse, a robot is never FOOLED: level 3 is
   ninety blocks of illusion and the robot walks straight through them
   without noticing, so the one thing that makes level 3 hard for a
   person is invisible to the measurement.

   A test that cannot tell two things apart must not be used to rank
   them. So the robot's job is reduced to a single hard yes/no --
   CAN THIS BE FINISHED AT ALL, INSIDE ITS OWN CLOCK -- and the
   difficulty curve is measured from the levels themselves, using the
   two things Nea actually chose:

     "less and less ground"     -> what fraction is thin air
     "less time on the clock"   -> the robot's time as a share of the limit

   Both of those have real resolution, and both are exactly what she
   asked for. Her third choice -- "the portal at more difficult places
   to reach" -- is checked separately below, per level, because "hard to
   reach" is a shape rather than a number.
*/
const curve = ['the-long-fall', 'nothing-underneath', 'the-last-jump'];

function measure(key) {
  const g = makeGame();
  g.Level.load(key);
  const map = g.Level.map, W = g.Level.cols, H = g.Level.rows;
  let air = 0;
  for (let c = 0; c < W; c++) {
    let solid = false;
    for (let r = 0; r < H; r++) if (map[r][c] === '#') { solid = true; break; }
    if (!solid) air++;
  }
  const runs = playAll(key);
  const won = runs.filter(r => r.reachedPortal);
  return {
    name: g.Level.name, cols: W, limit: g.Level.timeLimit,
    portal: g.Level.portal,
    air: 100 * air / W,
    fastest: won.length ? Math.min(...won.map(r => r.seconds)) : Infinity,
    best: runs[0],
    map,
  };
}

console.log('\n=== LEVELS 4, 5 and 6 ===');
const m = curve.map(measure);

for (const L of m) {
  const block = Math.round(L.best.maxX / 64);
  console.log(`  ${L.name.padEnd(20)} ${String(L.cols).padStart(3)} wide  ` +
              `${L.air.toFixed(1)}% air  ` +
              `${L.fastest === Infinity ? '  --  ' : L.fastest.toFixed(1) + 's'} of ${L.limit}s`);
  check(`${L.name} can be finished at all`, L.best.reachedPortal,
        `stuck at block ${block} of ${L.cols}`);
  check(`${L.name} fits inside its own clock`,
        L.best.reachedPortal && L.fastest < L.limit,
        `${L.fastest.toFixed(1)}s of ${L.limit}s`);
}

console.log('\n--- less and less ground ---');
const air3 = measure('illusions').air;
console.log('  ' + [air3, ...m.map(L => L.air)].map(a => a.toFixed(1) + '%').join('  ->  '));
for (let i = 0; i < m.length; i++) {
  const before = i ? m[i-1] : { name: 'The Illusions', air: air3 };
  check(`${m[i].name} has less ground than ${before.name}`,
        m[i].air > before.air,
        `${m[i].air.toFixed(1)}% vs ${before.air.toFixed(1)}%`);
}

console.log('\n--- less and less time ---');
const l3 = measure('illusions');
const press = L => 100 * L.fastest / L.limit;
console.log('  seconds:  ' + [l3, ...m].map(L => L.limit + 's').join('  ->  '));
console.log('  pressure: ' + [l3, ...m].map(L => press(L).toFixed(1) + '%').join('  ->  '));
for (let i = 0; i < m.length; i++) {
  const before = i ? m[i-1] : l3;
  check(`${m[i].name} gives fewer seconds than ${before.name}`,
        m[i].limit < before.limit, `${m[i].limit}s vs ${before.limit}s`);
  check(`...and less slack inside them`,
        press(m[i]) > press(before),
        `${press(m[i]).toFixed(1)}% vs ${press(before).toFixed(1)}%`);
}

console.log('\n--- the portal gets harder to reach ---');
/*
   Nea's third pick. Not a number, so each level asserts its own shape.
   What they share: from level 4 on you can never simply WALK to the
   portal. There is no floor anywhere in its column.
*/
/*
   How hard a portal is to reach isn't a number of rocks -- my first go
   counted the rock within four blocks and made level 5 look harder than
   level 6, because a slot has a thicker roof than a pocket does. What
   actually matters is how many DIRECTIONS are closed off:

     level 4   nothing around it        you must arrive at the top of the arc
     level 5   rock above and below     a slot to fly through
     level 6   above, below and behind  a pocket with one way in
*/
function wallsAround(L, reach = 4) {
  const solid = (c, r) => !!(L.map[r] && L.map[r][c] === '#');
  const P = L.portal;
  let n = 0;
  for (const [dc, dr] of [[0,-1],[0,1],[1,0],[-1,0]])
    for (let d = 1; d <= reach; d++)
      if (solid(P.col + dc*d, P.row + dr*d)) { n++; break; }
  return n;
}

for (const L of m) {
  // Nothing to stand on right beside it, and no real floor in its
  // column at all -- you can only ever arrive flying.
  const standing = L.map[L.portal.row + 1] &&
                   L.map[L.portal.row + 1][L.portal.col] === '#';
  const groundBelow = L.map.slice(13).some(row => row[L.portal.col] === '#');
  check(`${L.name}: you cannot walk to the portal`, !standing && !groundBelow,
        standing ? 'you can stand right under it' : 'the floor runs under it');
}

const walls = m.map(L => wallsAround(L));
console.log('  sides walled off:  ' + walls.join('  ->  '));
check('level 4 hangs its portal in open air', walls[0] === 0, `${walls[0]} sides`);
check('level 5 closes off more sides than level 4', walls[1] > walls[0],
      `${walls[1]} vs ${walls[0]}`);
check('level 6 closes off more sides than level 5', walls[2] > walls[1],
      `${walls[2]} vs ${walls[1]}`);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail?1:0);
