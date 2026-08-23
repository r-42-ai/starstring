/*
  HOW LONG DOES THIS LEVEL TAKE?

  Runs the robot every way it knows and reports the times, so a time
  limit can be set from evidence instead of guessed at.
*/
const { playAll } = require('../tests/robot.js');

const runs = playAll('crystal-caves-1');
const finished = runs.filter(r => r.reachedPortal).map(r => r.seconds).sort((a,b) => a-b);

console.log(`\n${finished.length} of ${runs.length} playing styles finished the level.\n`);
if (!finished.length) { console.log('Nobody finished — no point setting a time limit yet.'); process.exit(1); }

const fastest = finished[0];
const slowest = finished[finished.length - 1];
const median  = finished[Math.floor(finished.length / 2)];

console.log(`  fastest run   ${fastest.toFixed(1)}s`);
console.log(`  typical run   ${median.toFixed(1)}s`);
console.log(`  slowest run   ${slowest.toFixed(1)}s`);
console.log(`\nThe robot never hesitates, never looks around, never misses a`);
console.log(`swing and never changes its mind. A person playing a level for`);
console.log(`the first time is several times slower than that — so the limit`);
console.log(`wants to be about FIVE times the robot's run, not double it.`);
console.log(`\n  suggested timeLimit: ${Math.ceil(slowest * 5 / 30) * 30} seconds\n`);
