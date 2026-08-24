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

// Harder than level 2, but not by so much that it stops being fun
const easyWins = playAll('crystal-caves-1').filter(r => r.reachedPortal).length;
const hardWins = illRuns.filter(r => r.reachedPortal).length;
console.log(`  level 2: ${easyWins}/30 styles finish   level 3: ${hardWins}/30`);
check('it is HARDER than level 2', hardWins <= easyWins,
      `level 3 was finished by ${hardWins} styles, level 2 by ${easyWins} — that makes it easier`);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail?1:0);
