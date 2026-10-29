// Correctness gate for the shapes and progressions: `npm run verify`.
//
// Everything this app teaches is hand-entered in App.jsx, so this lifts the
// data and the pure helpers out of it by name and checks them against the
// scales typed out again here, from first principles — never against the
// app's own tables, which would only prove they agree with themselves.
import fs from 'fs';

const SRC = fs.readFileSync(new URL('../App.jsx', import.meta.url), 'utf8');

// The source text of a top-level `const NAME = …` or `function NAME(…) {…}`,
// found by matching brackets (strings and comments skipped).
function lift(name) {
  const m = new RegExp(`\\n(const ${name}\\s*=\\s*|function ${name}\\s*\\()`).exec(SRC);
  if (!m) throw new Error(`${name} not found in App.jsx`);
  let i = m.index + m[0].length, depth = 0, str = null, opened = false;
  if (m[1].startsWith('function')) i = SRC.indexOf('{', i);
  for (; i < SRC.length; i++) {
    const c = SRC[i], d = SRC[i + 1];
    if (str) { if (c === '\\') i++; else if (c === str) str = null; continue; }
    if (c === '/' && d === '/') { i = SRC.indexOf('\n', i); continue; }
    if (c === '/' && d === '*') { i = SRC.indexOf('*/', i) + 1; continue; }
    if (c === '"' || c === "'" || c === '`') { str = c; continue; }
    if ('[{('.includes(c)) { depth++; opened = true; }
    else if (']})'.includes(c)) { depth--; if (depth === 0 && opened) { i++; break; } }
    else if (!opened && (c === ';' || c === '\n')) break;
  }
  return SRC.slice(m.index + 1, i);
}
const NAMES = ['OPEN_MIDI', 'NOTE_NAMES', 'SHAPE_MAJOR_L7', 'SHAPE_MAJOR_LL', 'SHAPE_MINOR_L7', 'SHAPE_MINOR_LL', 'SHAPE_JIMMY_T',
  'ALL_SHAPES', 'MAJ_QUALITY', 'MIN_QUALITY', 'DIATONIC_ST', 'MIN_ST', 'PRACTICE_PROGS', 'RN_BASE',
  'getRootFret', 'shapeRootFret', 'degreeNote', 'rnOffset', 'progChordName', 'rootShift'];
const app = new Function(`${NAMES.map(lift).join('\n')}\nreturn { ${NAMES.join(', ')} };`)();

// ── Ground truth, typed here ────────────────────────────────────────────────
const OPEN = [40, 45, 50, 55, 59, 64];                    // E A D G B e
const MAJOR = [0, 2, 4, 5, 7, 9, 11], NAT_MINOR = [0, 2, 3, 5, 7, 8, 10];
const LETTER = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const pc = n => ((n % 12) + 12) % 12;
const nameToPc = n => pc(LETTER[n[0]] + (n[1] === '#' ? 1 : n[1] === 'b' ? -1 : 0));
// A triad's quality from the scale itself: stack the 3rd and 5th above a degree.
const triad = (st, d) => {
  const third = pc(st[(d + 2) % 7] - st[d]), fifth = pc(st[(d + 4) % 7] - st[d]);
  return third === 4 && fifth === 7 ? 'maj' : third === 3 && fifth === 7 ? 'min' : third === 3 && fifth === 6 ? 'dim' : '?';
};
const NUMERAL = { I: 0, II: 2, III: 4, IV: 5, V: 7, VI: 9, VII: 11 };

let n = 0;
const fails = [];
const check = (ok, msg) => { n++; if (!ok) fails.push(msg); };
let mark = 0;
const section = name => { console.log(`\n${name}`); mark = fails.length; };
const done = label => { console.log(`  ${fails.length > mark ? '✗' : '✓'} ${label}`); mark = fails.length; };

section('scales and chord qualities');
check(JSON.stringify(app.DIATONIC_ST) === JSON.stringify(MAJOR), 'DIATONIC_ST is not the major scale');
check(JSON.stringify(app.MIN_ST) === JSON.stringify(NAT_MINOR), 'MIN_ST is not the natural minor scale');
for (let d = 0; d < 7; d++) {
  check(app.MAJ_QUALITY[d] === triad(MAJOR, d), `major degree ${d + 1} is ${triad(MAJOR, d)}, table says ${app.MAJ_QUALITY[d]}`);
  check(app.MIN_QUALITY[d] === triad(NAT_MINOR, d), `minor degree ${d + 1} is ${triad(NAT_MINOR, d)}, table says ${app.MIN_QUALITY[d]}`);
}
for (let k = 0; k < 12; k++) for (let d = 0; d < 7; d++) for (const minor of [false, true])
  check(nameToPc(app.degreeNote(k, d, minor)) === pc(k + (minor ? NAT_MINOR : MAJOR)[d]), `degreeNote(${k}, ${d}, ${minor})`);
done('both scales, the seven triad qualities of each, and every degree\'s note name in all 12 keys');

section('shapes');
for (const s of app.ALL_SHAPES) {
  const st = s.isMinor ? NAT_MINOR : MAJOR;
  check(s.dots.map(d => d.d).sort().join() === '0,1,2,3,4,5,6', `${s.id}: not one dot per degree`);
  const q = d => triad(st, d);
  for (const d of s.redGroup) check(q(d) === 'maj', `${s.id}: red group holds degree ${d + 1}, a ${q(d)} chord`);
  // The root may sit in both groups: Major L7's teal "L" is I–ii–iii–vi, and
  // it starts at the root. It still draws red (red is checked first).
  for (const d of s.tealGroup) check(q(d) === 'min' || (d === 0 && s.redGroup.has(0)), `${s.id}: teal group holds degree ${d + 1}, a ${q(d)} chord`);
  for (let k = 0; k < 12; k++) {
    const rf = app.shapeRootFret(k, s);
    for (const dot of s.dots) {
      const f = rf + dot.fo;
      check(f >= 0 && f <= 20, `${s.id} in key ${k}: degree ${dot.d + 1} at fret ${f}`);
      check(pc(OPEN[dot.si] + f) === pc(k + st[dot.d]), `${s.id} in key ${k}: degree ${dot.d + 1} sounds the wrong note`);
    }
  }
}
done(`${app.ALL_SHAPES.length} shapes: every dot is its degree in all 12 keys, none behind the nut, colour groups match chord quality`);

section('progressions');
for (const p of app.PRACTICE_PROGS) {
  const st = p.isMinor ? NAT_MINOR : MAJOR;
  for (const sh of p.shapes) {
    const s = app.ALL_SHAPES.find(x => x.id === sh.id);
    check(!!s, `${p.id}: unknown shape ${sh.id}`);
    check(s && s.isMinor === p.isMinor, `${p.id}: a ${p.isMinor ? 'minor' : 'major'} progression recommends ${s?.name}`);
  }
  for (const c of p.degrees) {
    const m = c.rn.match(/^([b#]?)([ivIV]+)(°?)(.*)$/);
    check(!!m && m[2].toUpperCase() in NUMERAL, `${p.id}: cannot read numeral ${c.rn}`);
    if (!m) continue;
    const off = pc(NUMERAL[m[2].toUpperCase()] + (m[1] === 'b' ? -1 : m[1] === '#' ? 1 : 0));
    const suffix = (m[3] ? '°' : m[2] === m[2].toLowerCase() ? 'm' : '') + m[4];
    for (let k = 0; k < 12; k++) {
      // The printed name: the numeral's own root and quality.
      const name = app.progChordName(k, c.rn);
      check(nameToPc(name) === pc(k + off) && name.replace(/^[A-G][#b]?/, '') === suffix, `${p.id} in key ${k}: ${c.rn} printed as ${name}`);
      // The root drawn: the dot it is filed under, moved by rootShift, must sound the numeral's root.
      for (const sh of p.shapes) {
        const s = app.ALL_SHAPES.find(x => x.id === sh.id);
        const dot = s.dots.find(x => x.d === c.d);
        const reach = Math.min(0, ...p.degrees.map(x => s.dots.find(y => y.d === x.d).fo + app.rootShift(x.rn, x.d, p.isMinor)));
        const f = app.shapeRootFret(k, s, reach) + dot.fo + app.rootShift(c.rn, c.d, p.isMinor);
        check(f >= 0 && pc(OPEN[dot.si] + f) === pc(k + off), `${p.id} [${s.name}] in key ${k}: ${c.rn} drawn at fret ${f}`);
      }
    }
    check(Math.abs(app.rootShift(c.rn, c.d, p.isMinor)) <= 2, `${p.id}: ${c.rn} is filed ${app.rootShift(c.rn, c.d, p.isMinor)} frets from its dot`);
    check(pc(off - st[c.d]) === pc(app.rootShift(c.rn, c.d, p.isMinor)), `${p.id}: rootShift for ${c.rn}`);
  }
}
done(`${app.PRACTICE_PROGS.length} progressions: every chord named from its numeral and drawn on its real root, in all 12 keys and every recommended shape`);

if (fails.length) {
  console.log(`\n${fails.length} of ${n} checks FAILED:`);
  for (const f of [...new Set(fails)].slice(0, 40)) console.log('  ' + f);
  process.exit(1);
}
console.log(`\nAll checks passed. ${n} assertions.`);
