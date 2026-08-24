/*
  WHERE DOES SHE ACTUALLY FLY?      node tools/flight.js <level> <col>

  Plays the level thirty different ways and prints a map of every place
  she ends up after letting go of the ring at <col>. The busiest square
  is where the game naturally sends people -- so that is where the
  portal goes.

  This exists because placing a portal by eye does not work. Level 2's
  portal took five attempts before I stopped guessing and measured; the
  answer was two rows below where it looked right. Level 4's portal sits
  at the peak of the arc, level 5's behind a two-row slot and level 6's
  inside a pocket, and all three columns came off this map.
*/
// After the LAST ring, where does she actually fly? Every style, so we
// can put the portal where the game already sends people.
const R = require('/sessions/sleepy-vibrant-dirac/mnt/starstring/tests/robot.js');
const key = process.argv[2], lastRing = +process.argv[3];
const grid = {};
for (const st of R.styles) {
  let released = false;
  R.attempt(st, key, (p, G) => {
    if (p.x > lastRing*64 && !G.attached) released = true;
    if (G.attached) released = false;
    if (released && p.x > lastRing*64) {
      const c = Math.floor((p.x+p.w/2)/64), r = Math.floor((p.y+p.h/2)/64);
      grid[c+','+r] = (grid[c+','+r]||0)+1;
    }
  });
}
const cols = {}, rows = new Set();
for (const k in grid){ const [c,r]=k.split(',').map(Number); (cols[c]=cols[c]||{})[r]=grid[k]; rows.add(r); }
const rs=[...rows].sort((a,b)=>a-b), cs=Object.keys(cols).map(Number).sort((a,b)=>a-b);
process.stdout.write('row\\col '); cs.forEach(c=>process.stdout.write(String(c%100).padStart(4))); console.log();
for(const r of rs){ if(r>17) continue; process.stdout.write(String(r).padStart(6)+' ');
  cs.forEach(c=>process.stdout.write(String(cols[c][r]||'.').padStart(4))); console.log(); }
