import { useState, useEffect, useRef, useCallback } from "react";
import { AppHeader, TabBar } from "@fretworks/design";

// ─── CONSTANTS (matching ChordTrainer exactly) ─────────────────────────────────
const NOTE_NAMES = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
// ChordTrainer OPEN_MIDI: index 0=low-E(40), 1=A(45), 2=D(50), 3=G(55), 4=B(59), 5=high-e(64)
const OPEN_MIDI = [40, 45, 50, 55, 59, 64];
const STRING_LABELS = ['E','A','D','G','B','e']; // index 0=low-E

// ChordTrainer color palette
const BG = '#0f0e17';
const BG2 = '#13121f';
const BG3 = '#1a1928';
const BORDER = '#2a2840';
const BORDER2 = '#3d3960';
const TEXT0 = '#fffffe';
const TEXT1 = '#b0acc8';
const TEXT2 = '#6a6888';
const GOLD = '#ffd93d';
const RED = '#ff6b6b';
const TEAL = '#4ecdc4';
const PURPLE = '#a29bfe';
const GREEN = '#00b894';
const CORAL = '#e17055';
const PINK = '#fd79a8';

// Shape group colors — matching the diagram's red/teal
const COLOR_MAJ = '#ff6b6b';   // red group (I/IV/V in major; iv/v/i in minor)
const COLOR_MIN = '#4ecdc4';   // teal group (ii/iii/vi in major; bVI/bVII/bIII in minor)
const COLOR_DIM = '#a29bfe';   // dim chord
const COLOR_ROOT = '#ffd93d';  // root highlight

// ─── SHAPE DEFINITIONS ─────────────────────────────────────────────────────────
// Verified against diagram: str6(idx=0)=low-E, str5(idx=1)=A string
// All fret offsets are relative to the root fret

// MAJOR L7 — root on str6 (idx=0, low-E)
// str6: 7°@R-1, 1@R, 2m@R+2, 3m@R+4
// str5: 4@R+0, 5@R+2, 6m@R+4
const SHAPE_MAJOR_L7 = {
  id: 'major_l7',
  name: 'Major L7',
  shortName: 'L7',
  isMinor: false,
  rootStrIdx: 0, // low-E (idx 0 in OPEN_MIDI)
  upperStrIdx: 1, // A-string (idx 1)
  rootStrLabel: 'str6 (low-E)',
  desc: 'Root on low-E string. Red "7" shape: I, IV, V. Teal "L" shape: I, ii, iii, vi.',
  // dots: {d: degree index 0-6, si: string idx (0=low-E,1=A), fo: fret offset from root}
  dots: [
    { d:6, si:0, fo:-1 }, // 7°   str6, R-1
    { d:0, si:0, fo: 0 }, // 1    str6, R   ← ROOT
    { d:1, si:0, fo: 2 }, // 2m   str6, R+2
    { d:2, si:0, fo: 4 }, // 3m   str6, R+4
    { d:3, si:1, fo: 0 }, // 4    str5, R+0
    { d:4, si:1, fo: 2 }, // 5    str5, R+2
    { d:5, si:1, fo: 4 }, // 6m   str5, R+4
  ],
  // Color groups
  redGroup:  new Set([0,3,4]),   // I, IV, V
  tealGroup: new Set([0,1,2,5]), // I, ii, iii, vi
  // Shape connector paths for drawing the L and 7 outlines
  // Each path: array of {si, fo} points to connect with lines
  redPath:  [{si:0,fo:0},{si:1,fo:0},{si:1,fo:2}],           // 1(str6)→4(str5,same fr)→5(str5,+2) = "7"
  tealPath: [{si:0,fo:2},{si:0,fo:4},{si:1,fo:4}],           // 2m→3m(str6)→6m(str5) = "L"
};

// MAJOR LL — root on str6 (idx=0, low-E)
// str6: 6m@R-3, 7°@R-1, 1@R
// str5: 2m@R-3, 3m@R-1, 4@R, 5@R+2
const SHAPE_MAJOR_LL = {
  id: 'major_ll',
  name: 'Major LL',
  shortName: 'LL',
  isMinor: false,
  rootStrIdx: 0,
  upperStrIdx: 1,
  rootStrLabel: 'str6 (low-E)',
  desc: 'Root on low-E string. Two L shapes: I→IV→V forms one L upward; vi→ii→iii forms another.',
  dots: [
    { d:5, si:0, fo:-3 }, // 6m   str6, R-3
    { d:6, si:0, fo:-1 }, // 7°   str6, R-1
    { d:0, si:0, fo: 0 }, // 1    str6, R   ← ROOT
    { d:1, si:1, fo:-3 }, // 2m   str5, R-3
    { d:2, si:1, fo:-1 }, // 3m   str5, R-1
    { d:3, si:1, fo: 0 }, // 4    str5, R+0
    { d:4, si:1, fo: 2 }, // 5    str5, R+2
  ],
  redGroup:  new Set([0,3,4]),
  tealGroup: new Set([5,1,2]),
  redPath:  [{si:0,fo:0},{si:1,fo:0},{si:1,fo:2}],   // 1 up to 4, right to 5 = "L"
  tealPath: [{si:0,fo:-3},{si:1,fo:-3},{si:1,fo:-1}], // 6m up to 2m, right to 3m = "L"
};

// MINOR L7 — root on str5 (idx=1, A-string)
// str6: 2°@R-5, b3@R-4, 4m@R-2, 5m@R+0
// str5: b6@R-4, b7@R-2, 1m@R+0
// MIN_LABELS = ['1m','2°','b3','4m','5m','b6','b7']  idx: 0,1,2,3,4,5,6
// d:1 = '2°' (dim), d:6 = 'b7' (maj)
// Red group (minor chords): 1m(d=0), 4m(d=3), 5m(d=4)
// Teal group (major chords): b3(d=2), b6(d=5), b7(d=6)
// Dim: 2°(d=1)
const SHAPE_MINOR_L7 = {
  id: 'minor_l7',
  name: 'Minor L7',
  shortName: 'L7',
  isMinor: true,
  rootStrIdx: 1, // A-string (idx 1)
  upperStrIdx: 0, // low-E (idx 0)
  rootStrLabel: 'str5 (A)',
  desc: 'Root on A-string (str5). Teal group: 1m, 4m, 5m (minor chords). Red group: b3, b6, b7 (major chords).',
  dots: [
    { d:1, si:0, fo:-5 }, // 2°   str6, R-5  (d=1 → MIN_LABELS[1]='2°') ✓
    { d:2, si:0, fo:-4 }, // b3   str6, R-4
    { d:3, si:0, fo:-2 }, // 4m   str6, R-2
    { d:4, si:0, fo: 0 }, // 5m   str6, R+0
    { d:5, si:1, fo:-4 }, // b6   str5, R-4
    { d:6, si:1, fo:-2 }, // b7   str5, R-2  (d=6 → MIN_LABELS[6]='b7') ✓
    { d:0, si:1, fo: 0 }, // 1m   str5, R+0  ← ROOT
  ],
  redGroup:  new Set([2,5,6]),   // b3, b6, b7  (major chords → red)
  tealGroup: new Set([0,3,4]),   // 1m, 4m, 5m  (minor chords → teal)
  // Red path: b3(str6,-4) up to b6(str5,-4) right to b7(str5,-2) — L shape
  redPath:  [{si:0,fo:-4},{si:1,fo:-4},{si:1,fo:-2}],
  // Teal path: 1m(str5,0) down to 5m(str6,0) left to 4m(str6,-2)
  tealPath: [{si:1,fo:0},{si:0,fo:0},{si:0,fo:-2}],
};

// MINOR LL — root on str6 (idx=0, low-E)
// str6: 1m@R+0, 2°@R+2, b3@R+3
// str5: 4m@R+0, 5m@R+2, b6@R+3, b7@R+5
// d:1 = '2°' (dim), d:6 = 'b7' (maj)
const SHAPE_MINOR_LL = {
  id: 'minor_ll',
  name: 'Minor LL',
  shortName: 'LL',
  isMinor: true,
  rootStrIdx: 0,
  upperStrIdx: 1,
  rootStrLabel: 'str6 (low-E)',
  desc: 'Root on low-E string. Teal L: 1m→4m→5m (minor chords). Red L: b3→b6→b7 (major chords).',
  dots: [
    { d:0, si:0, fo: 0 }, // 1m   str6, R+0  ← ROOT
    { d:1, si:0, fo: 2 }, // 2°   str6, R+2  (d=1 → MIN_LABELS[1]='2°') ✓
    { d:2, si:0, fo: 3 }, // b3   str6, R+3
    { d:3, si:1, fo: 0 }, // 4m   str5, R+0
    { d:4, si:1, fo: 2 }, // 5m   str5, R+2
    { d:5, si:1, fo: 3 }, // b6   str5, R+3
    { d:6, si:1, fo: 5 }, // b7   str5, R+5  (d=6 → MIN_LABELS[6]='b7') ✓
  ],
  redGroup:  new Set([2,5,6]),   // b3, b6, b7  (major chords → red)
  tealGroup: new Set([0,3,4]),   // 1m, 4m, 5m  (minor chords → teal)
  // Red L: b3(str6,+3) up to b6(str5,+3) right to b7(str5,+5)
  redPath:  [{si:0,fo:3},{si:1,fo:3},{si:1,fo:5}],
  // Teal L: 1m(str6,0) up to 4m(str5,0) right to 5m(str5,+2)
  tealPath: [{si:0,fo:0},{si:1,fo:0},{si:1,fo:2}],
};

// JIMMY'S UPSIDE-DOWN T — root on str5 (idx=1, A-string), major key
// str5(idx=1): 7°@R-1, 1@R, 2@R+2
// str6(idx=0): 3@R-3, 4@R-2, 5@R+0, 6@R+2
// Verified in key of A (root=str5 fret0=A):
//   str5: 7°=fret-1(skip,open), 1=A✓, 2m=B✓(fret2)
//   str6: 3m=fret-3→use fret9(C#)✓, 4=D(fret-2→fret10? or relative)
// Shape: long horizontal bar on str6 (3→4→5→6), vertical stem up to 1 and 2 on str5
// Looks like an upside-down T
const SHAPE_JIMMY_T = {
  id: 'jimmy_t',
  name: "Jimmy's Upside-Down T",
  shortName: 'T',
  isMinor: false,
  rootStrIdx: 1, // A-string (idx 1)
  upperStrIdx: 0, // low-E (idx 0)
  rootStrLabel: 'str5 (A)',
  desc: "Root on A-string (str5). Long horizontal bar on str6: 3m–4–5–6m. Stem rises to 1 and 2m on str5. Forms an upside-down T shape.",
  dots: [
    { d:2, si:0, fo:-3 }, // 3m   str6, R-3
    { d:3, si:0, fo:-2 }, // 4    str6, R-2
    { d:4, si:0, fo: 0 }, // 5    str6, R+0  (same fret as root)
    { d:5, si:0, fo: 2 }, // 6m   str6, R+2
    { d:6, si:1, fo:-1 }, // 7°   str5, R-1
    { d:0, si:1, fo: 0 }, // 1    str5, R    ← ROOT
    { d:1, si:1, fo: 2 }, // 2m   str5, R+2
  ],
  redGroup:  new Set([0,3,4]),   // 1, 4, 5   (major chords → red)
  tealGroup: new Set([1,2,5]),   // 2m, 3m, 6m (minor chords → teal)
  // Red path: 4(str6,-2)→5(str6,0) horizontal, then 5(str6,0)→1(str5,0) vertical up
  redPath:  [{si:0,fo:-2},{si:0,fo:0},{si:1,fo:0}],
  // Teal path: 5(str6,0)→6m(str6,+2) horizontal only
  tealPath: [{si:0,fo:0},{si:0,fo:2}],
};

const ALL_SHAPES = [SHAPE_MAJOR_L7, SHAPE_MAJOR_LL, SHAPE_MINOR_L7, SHAPE_MINOR_LL, SHAPE_JIMMY_T];
const SHAPES_BY_ID = Object.fromEntries(ALL_SHAPES.map(s => [s.id, s]));

// ─── GUITAR-FRIENDLY KEYS ─────────────────────────────────────────────────────
// Ordered by how common they are in guitar-driven songs
const GUITAR_KEYS = [7,9,4,2,0,5,11,4]; // G,A,E,D,C,F,B — dedupe below
const GUITAR_KEY_IDXS = [7,9,4,2,0,5,11,3]; // G=7,A=9,E=4,D=2,C=0,F=5,B=11,Eb=3

// ─── PRACTICE PROGRESSIONS ────────────────────────────────────────────────────
// degrees: array of {rn: Roman numeral string, degIdx: 0-6 diatonic index}
// degIdx is the diatonic scale degree (0=I/i, 1=ii/ii°, 2=iii/bIII, 3=IV/iv, 4=V/v, 5=vi/bVI, 6=vii°/bVII)
// For secondary dominants like VI7: we use the base diatonic degree (5 for vi)
// isMinor: whether this is a minor key progression
const PRACTICE_PROGS = [
  // ── JAZZ ──────────────────────────────────────────────────────────────────
  {
    id: 'iivi_c', title: 'ii–V–I', feel: 'Jazz', feelGroup: 'Jazz',
    isMinor: false,
    desc: 'The cornerstone of jazz. ii creates tension, V raises it, I resolves.',
    degrees: [{rn:'ii',d:1},{rn:'V',d:4},{rn:'I',d:0}],
    shapes: [
      {id:'major_l7', reason:'ii is on str6 +2fr, V on str5 +2fr, I is root on str6'},
      {id:'major_ll', reason:'Shows ii and V symmetrically around the root'},
    ],
    tip: 'Find the I root on str6 first. Then ii is 2 frets up on the same string — V is directly above ii on str5. Practice the root movement without looking.',
  },
  {
    id: 'i_vi_ii_v', title: 'I–VI–ii–V', feel: 'Jazz', feelGroup: 'Jazz',
    isMinor: false,
    desc: 'Classic turnaround. VI7 is a secondary dominant — same fret position as vi.',
    degrees: [{rn:'I',d:0},{rn:'VI7',d:5},{rn:'ii',d:1},{rn:'V',d:4}],
    shapes: [
      {id:'major_l7', reason:'All 4 roots visible in one shape'},
      {id:'major_ll', reason:'VI and ii cluster on the left side of the LL shape'},
    ],
    tip: 'VI7 shares the same root fret as vi — treat it as a coloured vi. In the L7 shape, notice how VI and ii are both on str6 close together.',
  },
  {
    id: 'jazz_turnaround', title: 'Jazz Turnaround · I–VI–ii–V', feel: 'Jazz', feelGroup: 'Jazz',
    isMinor: false,
    desc: 'Cmaj7–A7–Dm7–G7. Cycle-of-4ths with secondary dominant.',
    degrees: [{rn:'I',d:0},{rn:'VI7',d:5},{rn:'ii',d:1},{rn:'V',d:4}],
    shapes: [
      {id:'major_ll', reason:'I, VI, ii, V all sit within 3 frets in the LL shape'},
      {id:'major_l7', reason:'Classic view: I on str6, all others visible nearby'},
    ],
    tip: 'In the LL shape, I and VI are on str6 at root and −3fr. Then ii and V jump to str5. The whole turnaround fits in your hand without shifting.',
  },
  {
    id: 'autumn_leaves', title: 'Autumn Leaves', feel: 'Jazz Standard', feelGroup: 'Jazz',
    isMinor: false,
    desc: 'ii–V–I–IV descending through the cycle of 4ths.',
    degrees: [{rn:'ii',d:1},{rn:'V',d:4},{rn:'I',d:0},{rn:'IV',d:3}],
    shapes: [
      {id:'major_l7', reason:'ii on str6, V/IV on str5 — all visible in one shape'},
      {id:'major_ll', reason:'IV and I share the same fret on str5/str6 in LL'},
    ],
    tip: 'Notice that IV and I are the same fret on different strings in the L7 shape. The ii–V–I–IV movement cycles through all three fret columns of the shape.',
  },
  {
    id: 'drop2_iivi', title: 'Drop 2 · ii–V–I', feel: 'Jazz Comping', feelGroup: 'Jazz',
    isMinor: false,
    desc: 'Smooth voice leading with shell and drop 2 voicings.',
    degrees: [{rn:'ii',d:1},{rn:'V',d:4},{rn:'I',d:0}],
    shapes: [
      {id:'major_l7', reason:'Clearest view for ii-V-I root movement on bottom 2 strings'},
    ],
    tip: 'For jazz comping, find the root with L7 first, then build your shell chord (R-3-7) above each root. The root movement is the map.',
  },
  {
    id: 'rhythm_changes_a', title: 'Rhythm Changes · A section', feel: 'Bebop', feelGroup: 'Jazz',
    isMinor: false,
    desc: "Gershwin's I–VI–ii–V — backbone of bebop for 80+ years.",
    degrees: [{rn:'I',d:0},{rn:'VI7',d:5},{rn:'ii',d:1},{rn:'V',d:4}],
    shapes: [
      {id:'major_l7', reason:'Standard position — I on str6, all others close by'},
      {id:'major_ll', reason:'Shows the left-right symmetry of I/VI and ii/V pairs'},
    ],
    tip: 'This is the same as I–VI–ii–V. Master this shape in all 12 keys. Start with Bb (the original key) — root on str6 fret 6.',
  },
  {
    id: 'rhythm_changes_b', title: 'Rhythm Changes · B section', feel: 'Bebop', feelGroup: 'Jazz',
    isMinor: false,
    desc: 'III7–VI7–II7–V7: secondary dominants descending the circle of 5ths.',
    degrees: [{rn:'III7',d:2},{rn:'VI7',d:5},{rn:'II7',d:1},{rn:'V7',d:4}],
    shapes: [
      {id:'major_l7', reason:'All 4 secondary dominant roots sit within the L7 shape'},
    ],
    tip: 'Treat each chord as a temporary I with a L7 shape. III7 root is on str6 +4fr, VI7 on str6 +9fr (or same shape 5 frets up). Feel the descending 5ths.',
  },
  {
    id: 'minor_iivi', title: 'Minor ii–V–i', feel: 'Jazz', feelGroup: 'Jazz',
    isMinor: true,
    desc: 'Dark jazz minor cadence. Half-diminished and altered dominant.',
    degrees: [{rn:'ii°',d:1},{rn:'V',d:4},{rn:'i',d:0}],
    shapes: [
      {id:'minor_l7', reason:'ii° on str6 −5fr, V on str6 same fret, i (root) on str5'},
      {id:'minor_ll', reason:'All 3 chords in compact LL cluster'},
    ],
    tip: 'In Minor L7, the ii° is 5 frets below the root on str6. V is directly below the root on str6 at the same fret. Practice locating these without looking.',
  },
  // ── BLUES ────────────────────────────────────────────────────────────────
  {
    id: 'blues_12_e', title: '12-Bar Blues', feel: 'Blues', feelGroup: 'Blues',
    isMinor: false,
    desc: 'I7–IV7–V7. The foundation. Three dominant 7ths.',
    degrees: [{rn:'I',d:0},{rn:'IV',d:3},{rn:'V',d:4}],
    shapes: [
      {id:'major_l7', reason:'I on str6, IV and V on str5 at same fret and +2fr — the L7 7-shape'},
      {id:'jimmy_t', reason:'IV and V are the two str6 dots directly below I on str5'},
    ],
    tip: 'This is the shape in its purest form. I7 is the root on str6. IV is directly above on str5 (same fret). V is one step right on str5. Three chords, all reachable without shifting.',
  },
  {
    id: 'blues_minor', title: 'Minor Blues', feel: 'Blues', feelGroup: 'Blues',
    isMinor: true,
    desc: 'i7–iv7–V7b9. Darker, more melancholic than major blues.',
    degrees: [{rn:'i',d:0},{rn:'iv',d:3},{rn:'V',d:4}],
    shapes: [
      {id:'minor_l7', reason:'i on str5, iv and V on str6 adjacent — compact minor shape'},
      {id:'minor_ll', reason:'i at root, iv directly above on str5, V one step right'},
    ],
    tip: 'In Minor L7, root (i) is on str5. iv is directly below on str6 same fret. V is +2fr on str6. Feel the difference from major blues — the root string flips.',
  },
  // ── POP & ROCK ───────────────────────────────────────────────────────────
  {
    id: 'i_v_vi_iv', title: 'I–V–vi–IV', feel: 'Pop', feelGroup: 'Rock & Pop',
    isMinor: false,
    desc: 'The axis progression. Underlies hundreds of pop hits.',
    degrees: [{rn:'I',d:0},{rn:'V',d:4},{rn:'vi',d:5},{rn:'IV',d:3}],
    shapes: [
      {id:'major_l7', reason:'All 4 roots visible — I/vi on str6, V/IV on str5'},
      {id:'major_ll', reason:'vi sits left of root in LL — great for seeing I→vi movement'},
    ],
    tip: 'In the L7 shape, I and vi are both on str6. V and IV are on str5. Practice jumping between the two strings to feel the pop loop in your hands.',
  },
  {
    id: 'i_iv_v', title: 'I–IV–V', feel: 'Folk/Country', feelGroup: 'Rock & Pop',
    isMinor: false,
    desc: 'Three chords, a million songs. Folk, country, rock n roll.',
    degrees: [{rn:'I',d:0},{rn:'IV',d:3},{rn:'V',d:4}],
    shapes: [
      {id:'major_l7', reason:'The defining shape for I-IV-V — I on str6, IV/V on str5'},
      {id:'jimmy_t', reason:'IV and V are on str6 flanking the root on str5'},
    ],
    tip: 'The L7 "7 shape" IS the I–IV–V shape. The corner of the 7 is IV and V. Once you can find I anywhere on str6, you automatically know IV and V.',
  },
  {
    id: 'i_bvii_iv', title: 'I–bVII–IV', feel: 'Rock', feelGroup: 'Rock & Pop',
    isMinor: false,
    desc: 'Mixolydian borrowed bVII. Hendrix to Oasis.',
    degrees: [{rn:'I',d:0},{rn:'bVII',d:6},{rn:'IV',d:3}],
    shapes: [
      {id:'major_l7', reason:'I on str6, IV on str5 same fret; bVII is 7°position −1fr'},
    ],
    tip: 'bVII sits at the 7° position (one fret below I on str6). In the L7 shape it is already shown as the dim dot — just use it as a major chord instead. I→bVII→IV feels like a backwards walk.',
  },
  {
    id: 'i_iii_iv_v', title: 'I–iii–IV–V', feel: 'Pop/Soul', feelGroup: 'Rock & Pop',
    isMinor: false,
    desc: 'The mediant iii creates a flowing, optimistic quality.',
    degrees: [{rn:'I',d:0},{rn:'iii',d:2},{rn:'IV',d:3},{rn:'V',d:4}],
    shapes: [
      {id:'major_l7', reason:'I on str6, iii on str6 +4fr, IV and V on str5'},
    ],
    tip: 'iii shares a fret column with IV in the L7 shape — iii is on str6 where IV would be on str5. Practice the stepwise root movement: I → iii (+4) → IV (jump to str5) → V (+2).',
  },
  {
    id: 'i_vi_iv_v', title: 'I–vi–IV–V', feel: 'Pop/50s', feelGroup: 'Rock & Pop',
    isMinor: false,
    desc: 'The 50s doo-wop progression. Timeless.',
    degrees: [{rn:'I',d:0},{rn:'vi',d:5},{rn:'IV',d:3},{rn:'V',d:4}],
    shapes: [
      {id:'major_l7', reason:'I and vi on str6, IV and V on str5 — one shape covers all'},
      {id:'major_ll', reason:'vi sits at −3fr from root — LL groups I/vi naturally'},
    ],
    tip: 'In L7, vi is +9fr on str6 (or think of it as the top of the teal L). In LL, vi is only 3 frets left of root — much easier to navigate. Use LL for this progression.',
  },
  {
    id: 'andalusian', title: 'Andalusian Cadence', feel: 'Flamenco', feelGroup: 'Rock & Pop',
    isMinor: true,
    desc: 'i–bVII–bVI–V. Phrygian descent. Ancient and cinematic.',
    degrees: [{rn:'i',d:0},{rn:'bVII',d:6},{rn:'bVI',d:5},{rn:'V',d:4}],
    shapes: [
      {id:'minor_l7', reason:'i on str5, bVII/bVI are teal (major) dots on str6, V below root'},
      {id:'minor_ll', reason:'bVII and bVI are the teal L in minor LL — right side of shape'},
    ],
    tip: 'In Minor L7, bVII is on str5 at −2fr, bVI at −4fr — they are the teal group. The descending bass line i→bVII→bVI→V walks left along the shape. Feel the gravity pulling left.',
  },
  {
    id: 'i_bvii_bvi_v', title: 'i–bVII–bVI–V', feel: 'Rock/Classical', feelGroup: 'Rock & Pop',
    isMinor: true,
    desc: 'Natural minor descent. Flamenco to metal, film scores.',
    degrees: [{rn:'i',d:0},{rn:'bVII',d:6},{rn:'bVI',d:5},{rn:'V',d:4}],
    shapes: [
      {id:'minor_l7', reason:'Same shape as Andalusian — natural minor descent'},
      {id:'minor_ll', reason:'bVII and bVI form the teal L in minor LL'},
    ],
    tip: 'Identical to Andalusian in terms of root positions. The Minor L7 is your go-to shape for any natural minor descending progression.',
  },
  // ── SOUL & R&B ───────────────────────────────────────────────────────────
  {
    id: 'neo_soul', title: 'Neo-Soul · I–III7–IV–iv', feel: 'Neo-Soul/R&B', feelGroup: 'Soul & R&B',
    isMinor: false,
    desc: 'The chromatic III7→iv colour shift — the neo-soul signature.',
    degrees: [{rn:'I',d:0},{rn:'III7',d:2},{rn:'IV',d:3},{rn:'iv',d:3}],
    shapes: [
      {id:'major_l7', reason:'I on str6, III7 on str6 +4fr, IV on str5 same fret as root'},
    ],
    tip: 'III7 and IV share the same fret column (III7 on str6, IV on str5). The iv chord is same fret as IV — just a quality change. Practice feeling that chromatic colour shift without moving your hand.',
  },
  {
    id: 'gospel', title: 'Gospel · I–IV–V', feel: 'Gospel', feelGroup: 'Soul & R&B',
    isMinor: false,
    desc: 'The gospel shuffle. Dominant 7ths throughout.',
    degrees: [{rn:'I',d:0},{rn:'IV',d:3},{rn:'V',d:4}],
    shapes: [
      {id:'major_l7', reason:'Classic I-IV-V shape — the 7 shape corner IS the gospel move'},
      {id:'jimmy_t', reason:'IV and V on str6, I on str5 — upside-down view of the same move'},
    ],
    tip: 'Gospel favours the V7→I resolution heavily. In the L7 shape, practice jumping from V (str5 +2fr) back to I (str6 root) repeatedly until it feels automatic.',
  },
  // ── MINOR / JAZZ MINOR ────────────────────────────────────────────────────
  {
    id: 'dorian_vamp', title: 'Dorian Vamp · i–IV', feel: 'Jazz/Fusion', feelGroup: 'Jazz',
    isMinor: true,
    desc: 'Minor i7 to major IV7. The Dorian modal colour.',
    degrees: [{rn:'i',d:0},{rn:'IV',d:3}],
    shapes: [
      {id:'minor_l7', reason:'i on str5, IV is the red dot on str6 same fret — direct vertical move'},
      {id:'minor_ll', reason:'i and IV share the same fret column in Minor LL'},
    ],
    tip: 'The Dorian sound comes from the major IV chord against a minor tonic. In Minor L7, IV (red) sits directly below i on str6. The move is purely vertical — same fret, different string.',
  },
  {
    id: 'so_what', title: 'So What · i–bii', feel: 'Modal Jazz', feelGroup: 'Jazz',
    isMinor: true,
    desc: 'Modal vamp. i7 then a half-step up to bii. Miles Davis.',
    degrees: [{rn:'i',d:0},{rn:'bii',d:6}],
    shapes: [
      {id:'minor_ll', reason:'Root then +3fr on str5 — very compact, just a short slide'},
    ],
    tip: 'bii is only 3 frets to the right of the root in Minor LL. The whole progression is a slight rightward shift. Practice making this sound intentional, not like a mistake.',
  },
  {
    id: 'bossa_nova', title: 'Bossa Nova · I–vi–ii–V', feel: 'Bossa Nova', feelGroup: 'Jazz',
    isMinor: false,
    desc: 'The classic bossa loop. Smooth voice leading.',
    degrees: [{rn:'I',d:0},{rn:'vi',d:5},{rn:'ii',d:1},{rn:'V',d:4}],
    shapes: [
      {id:'major_ll', reason:'vi is left of root in LL — creates the smooth back-and-forth feel'},
      {id:'major_l7', reason:'Standard view with I/vi on str6, ii/V forward on str5'},
    ],
    tip: 'Bossa Nova is smooth, so favour the LL shape where vi (−3fr) and ii (str5, −3fr) mirror each other. The shape feels balanced left-right around the root.',
  },
  {
    id: 'samba', title: 'Samba · I–vi–ii–V', feel: 'Samba', feelGroup: 'Jazz',
    isMinor: false,
    desc: 'Same cycle as bossa but with a driving rhythmic feel.',
    degrees: [{rn:'I',d:0},{rn:'vi',d:5},{rn:'ii',d:1},{rn:'V',d:4}],
    shapes: [
      {id:'major_l7', reason:'Energetic I-vi-ii-V forward momentum in L7 shape'},
      {id:'major_ll', reason:'Shows the symmetry of the repeating cycle'},
    ],
    tip: 'Same roots as Bossa Nova — the difference is rhythmic. Practice this with a driving strumming pattern. In L7 the cycle goes: root str6 → vi str6 → jump to str5 for ii → V.',
  },
];

const PROG_FEEL_GROUPS = ['All','Jazz','Blues','Rock & Pop','Soul & R&B'];

// ─── PRACTICE KEY PRESETS ─────────────────────────────────────────────────────
// Guitar-friendly keys: G(7), A(9), E(4), D(2), C(0), F(5), B(11), Eb(3)
const COMMON_KEY_IDXS = [7, 9, 4, 2, 0, 5, 11, 3];

// Degree labels
const MAJ_LABELS = ['1','2m','3m','4','5','6m','7°'];
const MIN_LABELS = ['1m','2°','b3','4m','5m','b6','b7'];
const MAJ_QUALITY = ['maj','min','min','maj','maj','min','dim'];
const MIN_QUALITY = ['min','dim','maj','min','min','maj','maj'];
const DIATONIC_ST  = [0,2,4,5,7,9,11]; // semitones from root for each degree

function degLabel(d, isMinor) { return isMinor ? MIN_LABELS[d] : MAJ_LABELS[d]; }
function degQuality(d, isMinor) { return isMinor ? MIN_QUALITY[d] : MAJ_QUALITY[d]; }

function getDotColor(d, shape) {
  // Dim chord: in major it's d=6 (7°); in minor it's d=1 (2°)
  const isDim = shape.isMinor ? (d === 1) : (d === 6);
  if (isDim) return COLOR_DIM;
  if (shape.redGroup.has(d)) return COLOR_MAJ;
  if (shape.tealGroup.has(d)) return COLOR_MIN;
  return TEXT2;
}

// Get root fret for a given note on a given string
function getRootFret(noteIdx, strIdx) {
  const open = OPEN_MIDI[strIdx] % 12;
  let fret = (noteIdx - open + 12) % 12;
  if (fret === 0) fret = 12; // prefer non-open for moveable shape clarity
  return fret;
}

// Get the actual note name for a degree in a given key
function degreeNote(keyIdx, degIdx) {
  return NOTE_NAMES[(keyIdx + DIATONIC_ST[degIdx]) % 12];
}

function chordName(keyIdx, degIdx, isMinor) {
  const note = degreeNote(keyIdx, degIdx);
  const q = degQuality(degIdx, isMinor);
  if (q === 'maj') return note;
  if (q === 'min') return note + 'm';
  if (q === 'dim') return note + '°';
  return note;
}

// ─── PULSE ANIMATION ──────────────────────────────────────────────────────────
// Use transform-based animation (scale + opacity) — works reliably on iOS Safari.
// SVG `r` attribute CSS animation is not supported in WebKit/mobile browsers.
if (typeof document !== 'undefined' && !document.getElementById('ct-pulse-style')) {
  const style = document.createElement('style');
  style.id = 'ct-pulse-style';
  style.textContent = `
    @keyframes ctPulse1 {
      0%   { transform: scale(1);   opacity: 0.85; }
      100% { transform: scale(2.4); opacity: 0; }
    }
    @keyframes ctPulse2 {
      0%   { transform: scale(1);   opacity: 0.6; }
      100% { transform: scale(1.8); opacity: 0; }
    }
    .ct-pulse-ring-1 {
      animation: ctPulse1 1.4s ease-out infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
    .ct-pulse-ring-2 {
      animation: ctPulse2 1.4s ease-out 0.4s infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
  `;
  document.head.appendChild(style);
}
// ─── PRACTICE FRETBOARD ────────────────────────────────────────────────────────
function PracticeFretboard({ shape, rootFret, progDegSet, progDegrees }) {
  const isMinor = shape.isMinor;
  const size = 1;
  const allFrets = shape.dots.map(d => rootFret + d.fo).filter(f => f >= 0);
  const minF = Math.max(0, Math.min(...allFrets) - 1);
  const maxF = Math.max(...allFrets) + 1;
  const fretCount = Math.max(7, maxF - minF + 1);
  const startFret = minF;
  const ML = 22, MR = 8, MT = 22, MB = 10;
  const NUM_STRINGS = 6;
  const SS = 26, FS = 34, DR_NORMAL = 10, DR_PROG = 13;
  const W = ML + MR + fretCount * FS;
  const H = MT + MB + (NUM_STRINGS - 1) * SS;
  const fx = fret => ML + (fret - startFret) * FS + FS / 2;
  const sy = si => MT + (5 - si) * SS;
  const INLAYS = [3,5,7,9,12,15,17,19,21];
  // Sequence map: first occurrence of each degree in the progression
  const seqMap = {};
  progDegrees.forEach((c, i) => { if (!(c.d in seqMap)) seqMap[c.d] = i + 1; });

  return (
    <div style={{ overflowX: 'visible', overflowY: 'visible', display: 'flex', justifyContent: 'center' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible', height: 280, width: 'auto', maxWidth: '100%' }}>
        {/* Inlays */}
        {INLAYS.filter(f => f > startFret && f < startFret + fretCount).map(f => (
          <circle key={f} cx={fx(f) - FS/2} cy={H/2} r={3} fill={BG3} opacity={0.8} />
        ))}
        {/* Fret numbers above strings */}
        {Array.from({ length: fretCount }, (_, i) => {
          const fret = startFret + i + 1;
          return fret < 1 ? null : (
            <text key={fret} x={ML + (i + 0.5) * FS} y={MT - 7}
              textAnchor="middle" fontSize={7} fill={TEXT2}
              fontFamily="'Segoe UI',system-ui,sans-serif">{fret}</text>
          );
        })}
        {/* Fret lines */}
        {Array.from({ length: fretCount + 1 }, (_, i) => {
          const x = ML + i * FS;
          const isNut = startFret === 0 && i === 0;
          return <line key={i} x1={x} y1={MT} x2={x} y2={H - MB}
            stroke={isNut ? '#c8c4dc' : BORDER} strokeWidth={isNut ? 3 : 1} strokeLinecap="round" />;
        })}
        {/* String lines */}
        {Array.from({ length: NUM_STRINGS }, (_, si) => {
          const isActive = si === shape.rootStrIdx || si === shape.upperStrIdx;
          const thick = [1.8,1.4,1.1,0.9,0.7,0.5][si];
          return (
            <g key={si}>
              <line x1={ML} y1={sy(si)} x2={W - MR} y2={sy(si)}
                stroke={isActive ? BORDER2 : BORDER} strokeWidth={thick} />
              <text x={ML - 5} y={sy(si)} textAnchor="end" dominantBaseline="central"
                fontSize={8} fill={isActive ? TEXT1 : TEXT2}
                fontWeight={isActive ? '700' : '400'}
                fontFamily="'Segoe UI',system-ui,sans-serif">{STRING_LABELS[si]}</text>
            </g>
          );
        })}
        {/* Connector lines — full opacity between prog dots, dim otherwise */}
        {[
          { path: shape.redPath,  color: COLOR_MAJ },
          { path: shape.tealPath, color: COLOR_MIN },
        ].map(({ path, color }) =>
          path.slice(0,-1).map((a, i) => {
            const b = path[i+1];
            const dotA = shape.dots.find(d => d.si === a.si && d.fo === a.fo);
            const dotB = shape.dots.find(d => d.si === b.si && d.fo === b.fo);
            const aIn = dotA && progDegSet.has(dotA.d);
            const bIn = dotB && progDegSet.has(dotB.d);
            const af = rootFret + a.fo, bf = rootFret + b.fo;
            if (af < 0 || bf < 0) return null;
            const op = aIn && bIn ? 0.9 : 0.2;
            return <line key={`${color}${i}`}
              x1={fx(af)} y1={sy(a.si)} x2={fx(bf)} y2={sy(b.si)}
              stroke={color} strokeWidth={op > 0.5 ? 3 : 1.5}
              strokeLinecap="round" opacity={op} />;
          })
        )}
        {/* Dots */}
        {shape.dots.map((dot, i) => {
          const fret = rootFret + dot.fo;
          if (fret < 0) return null;
          const cx = fx(fret), cy = sy(dot.si);
          const isRoot = dot.d === 0;
          const inProg = progDegSet.has(dot.d);
          const color = getDotColor(dot.d, shape);
          const dr = inProg ? DR_PROG : DR_NORMAL;
          const op = inProg ? 1 : 0.3;
          const label = degLabel(dot.d, isMinor);
          const seq = seqMap[dot.d];
          const fs = label.length > 2 ? 7 : 8;
          return (
            <g key={i}>
              {isRoot && (<>
                <circle className="ct-pulse-ring-1" cx={cx} cy={cy} r={dr}
                  fill="none" stroke={color} strokeWidth={2.5} opacity={op} />
                <circle className="ct-pulse-ring-2" cx={cx} cy={cy} r={dr}
                  fill="none" stroke={color} strokeWidth={1.5} opacity={op} />
              </>)}
              {inProg && !isRoot && (
                <circle cx={cx} cy={cy} r={dr + 2.5}
                  fill="none" stroke="#fff" strokeWidth={1.5} opacity={0.35} />
              )}
              <circle cx={cx} cy={cy} r={dr} fill={color} opacity={op} />
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                fontSize={fs} fill="#111" fontWeight="800"
                fontFamily="'Segoe UI',system-ui,sans-serif" opacity={inProg ? 1 : 0.5}>
                {label}
              </text>
              {inProg && seq && (<>
                <circle cx={cx + dr * 0.75} cy={cy - dr * 0.75} r={6}
                  fill={BG} stroke={color} strokeWidth={1} />
                <text x={cx + dr * 0.75} y={cy - dr * 0.75}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={6} fill={color} fontWeight="900"
                  fontFamily="'Segoe UI',system-ui,sans-serif">{seq}</text>
              </>)}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Fretboard({ shape, rootFret, keyIdx, highlightDeg, onDotClick, quizMode, revealAll, hardMode = false, size = 1 }) {
  const isMinor = shape.isMinor;

  // Fret window: show enough context around the shape
  const allFrets = shape.dots.map(d => rootFret + d.fo).filter(f => f >= 0);
  const minF = Math.max(0, Math.min(...allFrets) - 1);
  const maxF = Math.max(...allFrets) + 1;
  const fretCount = Math.max(7, maxF - minF + 1);
  const startFret = minF;

  // Layout
  const ML = 22, MR = 8, MT = 22, MB = 18;
  const NUM_STRINGS = 6;
  const SS = 26 * size; // string spacing
  const FS = 34 * size; // fret spacing
  const DR = 11 * size; // dot radius
  const W = ML + MR + fretCount * FS;
  const H = MT + MB + (NUM_STRINGS - 1) * SS;

  // Fret x coord (fret 0 = nut)
  const fx = (fret) => ML + (fret - startFret) * FS + FS / 2;
  // String y coord: idx 0=low-E at BOTTOM, idx 5=high-e at TOP (standard orientation)
  const sy = (strIdx) => MT + (5 - strIdx) * SS;

  const INLAYS = [3,5,7,9,12,15,17,19,21];
  const nutX = ML;

  return (
    <div style={{ overflowX: 'visible', overflowY: 'visible', display: 'flex', justifyContent: 'center' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', overflow: 'visible', height: 280, width: 'auto', maxWidth: '100%' }}>

        {/* Inlay dots */}
        {INLAYS.filter(f => f > startFret && f < startFret + fretCount).map(f => (
          <circle key={f} cx={fx(f) - FS/2} cy={H/2} r={3 * size}
            fill={BG3} opacity={0.8} />
        ))}
        {/* Double dot at 12 */}
        {12 > startFret && 12 < startFret + fretCount && (
          <>
            <circle cx={fx(12) - FS/2} cy={sy(1)} r={3 * size} fill={BG3} opacity={0.8} />
            <circle cx={fx(12) - FS/2} cy={sy(4)} r={3 * size} fill={BG3} opacity={0.8} />
          </>
        )}

        {/* Fret numbers — above top string, so dots never cover them */}
        {Array.from({ length: fretCount }, (_, i) => {
          const fret = startFret + i + 1;
          if (fret < 1) return null;
          return (
            <text key={fret} x={ML + (i + 0.5) * FS} y={MT - 7}
              textAnchor="middle" fontSize={7 * size}
              fill={TEXT2} fontFamily="'Segoe UI',system-ui,sans-serif">
              {fret}
            </text>
          );
        })}

        {/* Fret lines */}
        {Array.from({ length: fretCount + 1 }, (_, i) => {
          const x = ML + i * FS;
          const isNut = startFret === 0 && i === 0;
          return (
            <line key={i} x1={x} y1={MT} x2={x} y2={H - MB}
              stroke={isNut ? '#c8c4dc' : BORDER}
              strokeWidth={isNut ? 3 : 1} strokeLinecap="round" />
          );
        })}

        {/* String lines — uniform realistic gauge, no active-string thickening */}
        {Array.from({ length: NUM_STRINGS }, (_, si) => {
          const y = sy(si);
          const isActive = si === shape.rootStrIdx || si === shape.upperStrIdx;
          const thick = [1.8, 1.4, 1.1, 0.9, 0.7, 0.5][si]; // idx 0=lowE thickest
          return (
            <line key={si} x1={ML} y1={y} x2={W - MR} y2={y}
              stroke={isActive ? BORDER2 : BORDER}
              strokeWidth={thick} />
          );
        })}

        {/* String labels */}
        {Array.from({ length: NUM_STRINGS }, (_, si) => {
          const isActive = si === shape.rootStrIdx || si === shape.upperStrIdx;
          return (
            <text key={si} x={ML - 5} y={sy(si)} textAnchor="end"
              dominantBaseline="central" fontSize={8 * size}
              fill={isActive ? TEXT1 : TEXT2}
              fontWeight={isActive ? '700' : '400'}
              fontFamily="'Segoe UI',system-ui,sans-serif">
              {STRING_LABELS[si]}
            </text>
          );
        })}

        {/* Shape connector lines — hidden in hard mode until revealed */}
        {(!quizMode || revealAll || !hardMode) && (() => {
          const lines = [];
          const drawPath = (path, color) => {
            for (let i = 0; i < path.length - 1; i++) {
              const a = path[i], b = path[i + 1];
              const af = rootFret + a.fo, bf = rootFret + b.fo;
              if (af < 0 || bf < 0) continue;
              // Shadow/glow layer
              lines.push(
                <line key={`${color}glow${i}`}
                  x1={fx(af)} y1={sy(a.si)}
                  x2={fx(bf)} y2={sy(b.si)}
                  stroke={color} strokeWidth={7 * size}
                  strokeLinecap="round"
                  opacity={0.18} />
              );
              // Main line
              lines.push(
                <line key={`${color}${i}`}
                  x1={fx(af)} y1={sy(a.si)}
                  x2={fx(bf)} y2={sy(b.si)}
                  stroke={color} strokeWidth={3 * size}
                  strokeLinecap="round"
                  opacity={0.9} />
              );
            }
          };
          drawPath(shape.redPath, COLOR_MAJ);
          drawPath(shape.tealPath, COLOR_MIN);
          return lines;
        })()}

        {/* Dots */}
        {shape.dots.map((dot, i) => {
          const fret = rootFret + dot.fo;
          if (fret < 0) return null;
          const cx = fx(fret);
          const cy = sy(dot.si);
          const isRoot = dot.d === 0;
          const isHl = highlightDeg === dot.d;
          const color = getDotColor(dot.d, shape);

          // Hard mode in quiz: only show root dot and target dot before reveal
          const isHardHidden = hardMode && quizMode && !revealAll && !isRoot && !isHl;
          if (isHardHidden) return null;

          // Quiz mode logic:
          // - target dot (isHl): solid filled, NO label
          // - other dots: hollow circle with bright stroke, NO label
          // - after reveal (revealAll): all dots show label
          const isTarget = quizMode && isHl;
          const showLabel = !quizMode || revealAll;

          // Fill: solid when not quiz, or when revealed, or when this is the target
          const isSolid = !quizMode || revealAll || isTarget;
          const fillColor = isSolid ? color : 'transparent';
          const strokeColor = color;
          const strokeW = isSolid ? 0 : 2;

          const label = degLabel(dot.d, isMinor);
          const fontSize = label.length > 2 ? 7 * size : 8 * size;

          // Show pulse on root when: solid in learn/reveal, OR hollow during quiz question
          const showPulse = isRoot && (isSolid || (quizMode && !revealAll));

          return (
            <g key={i}
              onClick={() => onDotClick && onDotClick(dot.d)}
              style={{ cursor: onDotClick ? 'pointer' : 'default' }}>
              {/* Dual pulsing rings for root — transform-based for iOS Safari */}
              {showPulse && (
                <>
                  <circle
                    className="ct-pulse-ring-1"
                    cx={cx} cy={cy} r={DR}
                    fill="none"
                    stroke={color}
                    strokeWidth={2.5} />
                  <circle
                    className="ct-pulse-ring-2"
                    cx={cx} cy={cy} r={DR}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.5} />
                </>
              )}
              {/* Highlight glow when tapped in learn mode */}
              {isHl && !quizMode && (
                <circle cx={cx} cy={cy} r={DR + 6 * size}
                  fill={color} opacity={0.18} />
              )}
              <circle cx={cx} cy={cy} r={DR}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeW} />
              {showLabel && (
                <text x={cx} y={cy} textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={fontSize} fill="#111"
                  fontWeight="800"
                  fontFamily="'Segoe UI',system-ui,sans-serif">
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── CHORD PILL ────────────────────────────────────────────────────────────────
function ChordPill({ d, shape, keyIdx, rootFret, onClick, highlighted }) {
  const isMinor = shape.isMinor;
  const label = degLabel(d, isMinor);
  const quality = degQuality(d, isMinor);
  const noteName = chordName(keyIdx, d, isMinor);
  const dot = shape.dots.find(x => x.d === d);
  const fret = dot ? rootFret + dot.fo : '?';
  const strLabel = dot ? (dot.si === 0 ? 'E' : 'A') : '';
  const isRoot = d === 0;
  const color = getDotColor(d, shape);
  const ci = COLORS_CAT[quality] || TEXT2;

  return (
    <div onClick={onClick} style={{
      background: highlighted ? color + '18' : BG2,
      border: `1px solid ${highlighted ? color : BORDER}`,
      borderRadius: 10, padding: '8px 10px', cursor: 'pointer',
      transition: 'all .15s', display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 900, color,
          fontFamily: "'Segoe UI',system-ui,sans-serif" }}>{label}</span>
        <span style={{ fontSize: 9, color: TEXT2 }}>str{dot?.si === 0 ? '6' : '5'} fr{fret}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: TEXT0 }}>{noteName}</div>
      <div style={{ fontSize: 9, color: TEXT2 }}>{quality}</div>
    </div>
  );
}

const COLORS_CAT = { maj: COLOR_MAJ, min: COLOR_MIN, dim: COLOR_DIM };

// ─── DEBUG TRIGGERS ────────────────────────────────────────────────────────────
let _debugShowInstall = null;

// ─── DEBUG PANEL ───────────────────────────────────────────────────────────────
function DebugPanel() {
  const [, forceUpdate] = useState(0);
  const ls = k => { try { return localStorage.getItem(k) || '(unset)'; } catch(e) { return '(unset)'; } };
  const rows = [
    ['l7_launches',   ls('l7_launches')],
    ['isIOS',         String(/iphone|ipad|ipod/i.test(navigator.userAgent))],
    ['isStandalone',  String(window.matchMedia('(display-mode:standalone)').matches || window.navigator.standalone === true)],
    ['window.scrollY',String(window.scrollY)],
  ];
  return (
    <div style={{ background: '#0a0918', borderRadius: 10, border: `1px solid ${RED}55`, padding: '10px 12px', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: RED, fontWeight: 700, letterSpacing: 1 }}>🐛 DEBUG</div>
        <button onClick={() => forceUpdate(n => n + 1)} style={{
          fontSize: 9, color: TEXT2, background: 'transparent',
          border: `1px solid ${BORDER}`, borderRadius: 5, padding: '2px 8px', cursor: 'pointer',
        }}>Refresh</button>
      </div>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: 'flex', gap: 8, fontSize: 10, fontFamily: 'monospace', marginBottom: 3 }}>
          <span style={{ color: TEXT2, minWidth: 140, flexShrink: 0 }}>{k}</span>
          <span style={{ color: GOLD }}>{v}</span>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        <button onClick={() => { try { localStorage.clear(); } catch(e) {} location.reload(); }}
          style={{ fontSize: 9, color: RED, background: 'transparent', border: `1px solid ${RED}44`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', minHeight: 32, touchAction: 'manipulation' }}>
          Clear all & reload
        </button>
        <button onClick={() => { try { localStorage.removeItem('l7_launches'); } catch(e) {} location.reload(); }}
          style={{ fontSize: 9, color: '#74b9ff', background: 'transparent', border: '1px solid #74b9ff44', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', minHeight: 32, touchAction: 'manipulation' }}>
          Show install banner
        </button>
      </div>
    </div>
  );
}

// ─── INSTALL BANNER ────────────────────────────────────────────────────────────
function BannerStack() {
  const [showInstall, setShowInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  // Increment launch counter unconditionally (before any early returns)
  const [launches] = useState(() => {
    try {
      const n = parseInt(localStorage.getItem('l7_launches') || '0', 10) + 1;
      localStorage.setItem('l7_launches', String(n));
      return n;
    } catch(e) { return 1; }
  });

  useEffect(() => {
    if (isStandalone) return;
    if (launches !== 1 && launches % 5 !== 0) return;
    const isAndroidChrome = /android/i.test(navigator.userAgent) && /chrome/i.test(navigator.userAgent);
    if (isIOS) {
      const t = setTimeout(() => setShowInstall(true), 2500);
      return () => clearTimeout(t);
    }
    if (isAndroidChrome) {
      const handler = e => { e.preventDefault(); setDeferredPrompt(e); setShowInstall(true); };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const tap = cb => e => { e.stopPropagation(); cb(); };

  const dismissInstall = () => setTimeout(() => setShowInstall(false), 0);
  const installAndroid = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismissInstall();
  };

  if (!showInstall) return null;

  const sheetStyle = {
    position: 'fixed',
    bottom: 'max(16px,env(safe-area-inset-bottom))',
    left: 12, right: 12,
    zIndex: 9999,
    background: '#242235',
    borderRadius: 18,
    border: `1px solid ${BORDER}`,
    boxShadow: '0 8px 40px #000000aa',
    padding: '14px 14px 12px',
  };
  const btnClose = {
    background: 'transparent', border: 'none', color: '#555', fontSize: 22,
    padding: '0 4px', lineHeight: 1, flexShrink: 0, cursor: 'pointer',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    minWidth: 36, minHeight: 44,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <div style={sheetStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: !isIOS ? 10 : 0 }}>
        <div style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>🎸</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: TEXT0, marginBottom: 2 }}>
            {isIOS ? 'Add to Home Screen for offline use' : 'Practice anytime — install L7/LL Trainer'}
          </div>
          <div style={{ fontSize: 11, color: TEXT2 }}>
            {isIOS
              ? <><span style={{ color: GOLD, fontWeight: 700 }}>Share ⎙</span> → <span style={{ color: GOLD, fontWeight: 700 }}>Add to Home Screen</span></>
              : 'Full-screen, works offline, opens instantly'}
          </div>
        </div>
        <button style={btnClose} onPointerDown={tap(dismissInstall)} onClick={tap(dismissInstall)}>×</button>
      </div>
      {!isIOS && (
        <button onPointerDown={tap(installAndroid)} onClick={tap(installAndroid)}
          style={{
            display: 'block', width: '100%', background: GOLD, color: '#111',
            border: 'none', padding: 10, borderRadius: 9, fontSize: 13,
            fontWeight: 800, cursor: 'pointer', minHeight: 44,
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
          Install
        </button>
      )}
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('learn');
  const [shapeId, setShapeId] = useState('major_l7');
  const [keyIdx, setKeyIdx] = useState(9); // A
  const [hlDeg, setHlDeg] = useState(null);
  const [showData, setShowData] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  // v3-style global style + PWA meta + canvas icon + scroll lock
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      *{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}
      html,body{height:100%;overflow:hidden;background:#0f0e17;}
      button,a,label,[role=button]{touch-action:manipulation;-webkit-user-select:none;user-select:none;}
      input,textarea,select{font-size:16px!important;}
      svg{user-select:none;-webkit-user-select:none;pointer-events:none;}
      svg [onclick],svg [style*='cursor']{pointer-events:auto;}
      :root{--sat:env(safe-area-inset-top);--sab:env(safe-area-inset-bottom);}
    `;
    (() => {
      let vp = document.querySelector('meta[name="viewport"]');
      if (!vp) { vp = document.createElement('meta'); vp.name = 'viewport'; document.head.prepend(vp); }
      vp.content = 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
    })();

    // Generate canvas icon
    function makeIcon(size) {
      const c = document.createElement('canvas'); c.width = c.height = size;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#0f0e17'; ctx.fillRect(0, 0, size, size);
      // Draw fretboard-style graphic: two horizontal strings with dots
      const mid = size * 0.5;
      const str1y = size * 0.38, str2y = size * 0.62;
      const pad = size * 0.12;
      // Strings
      ctx.strokeStyle = '#3a3858'; ctx.lineWidth = size * 0.025; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(pad, str1y); ctx.lineTo(size - pad, str1y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, str2y); ctx.lineTo(size - pad, str2y); ctx.stroke();
      // Dots: red on str1, teal on str2
      const dotR = size * 0.07;
      const positions = [
        { x: size * 0.35, y: str1y, color: '#ff6b6b' }, // 1 root
        { x: size * 0.55, y: str1y, color: '#ff6b6b' }, // 2
        { x: size * 0.75, y: str1y, color: '#4ecdc4' }, // 3
        { x: size * 0.35, y: str2y, color: '#ff6b6b' }, // 4
        { x: size * 0.55, y: str2y, color: '#4ecdc4' }, // 5
        { x: size * 0.75, y: str2y, color: '#4ecdc4' }, // 6
      ];
      positions.forEach(({ x, y, color }) => {
        ctx.beginPath(); ctx.arc(x, y, dotR, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
      });
      return c.toDataURL('image/png');
    }

    const iconUrl = makeIcon(512);
    const iconUrl180 = makeIcon(180);

    const setLink = (rel, sizes, href) => {
      let l = document.querySelector(`link[rel="${rel}"]${sizes ? `[sizes="${sizes}"]` : ''}`);
      if (!l) { l = document.createElement('link'); l.rel = rel; if (sizes) l.sizes = sizes; document.head.appendChild(l); }
      l.href = href;
    };
    setLink('apple-touch-icon', '180x180', iconUrl180);
    setLink('icon', '512x512', iconUrl);

    // iOS standalone scroll lock
    window.scrollTo(0, 0);
    const lockScroll = () => { if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0); };
    window.addEventListener('scroll', lockScroll, { passive: true });

    document.head.appendChild(style);
    const setMeta = (name, content) => {
      let m = document.querySelector(`meta[name="${name}"]`);
      if (!m) { m = document.createElement('meta'); m.name = name; document.head.appendChild(m); }
      m.content = content;
    };
    setMeta('theme-color', '#0f0e17');
    setMeta('viewport', 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover');
    setMeta('apple-mobile-web-app-capable', 'yes');
    setMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
    setMeta('apple-mobile-web-app-title', 'Fretworks');

    const manifest = {
      name: 'L7 / LL Root Trainer', short_name: 'RootTrainer',
      description: 'Diatonic chord root note patterns for guitar.',
      start_url: '.', display: 'standalone', orientation: 'portrait',
      background_color: '#0f0e17', theme_color: '#0f0e17',
      icons: [
        { src: iconUrl180, sizes: '180x180', type: 'image/png' },
        { src: iconUrl,    sizes: '512x512', type: 'image/png' },
      ],
    };
    // Single PWA: reference the unified shell manifest (one manifest per origin)
    // instead of the per-app manifest built above.
    let mlink = document.querySelector('link[rel="manifest"]');
    if (!mlink) { mlink = document.createElement('link'); mlink.rel = 'manifest'; document.head.appendChild(mlink); }
    mlink.href = '/manifest.webmanifest';

    return () => {
      document.head.removeChild(style);
      window.removeEventListener('scroll', lockScroll);
    };
  }, []);

  // Quiz
  const [qPhase, setQPhase] = useState('setup'); // setup | playing | done
  const [qShapeId, setQShapeId] = useState('major_l7');
  const [qKeyMode, setQKeyMode] = useState('random');
  const [qFixedKey, setQFixedKey] = useState(9);
  const [qTimeLimit, setQTimeLimit] = useState(8);
  const [qNumQ, setQNumQ] = useState(10);
  const [qQuestion, setQQuestion] = useState(null);
  const [qAnswer, setQAnswer] = useState(null);
  const [qTimeLeft, setQTimeLeft] = useState(8);
  const [qScore, setQScore] = useState(0);
  const [qStreak, setQStreak] = useState(0);
  const [qBest, setQBest] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [qHistory, setQHistory] = useState([]);
  // Two-part answer state
  const [qPickedNum, setQPickedNum] = useState(null);   // 1-7 (scale degree number)
  const [qPickedType, setQPickedType] = useState(null); // 'maj' | 'min' | 'dim'
  const [qHardMode, setQHardMode] = useState(false);    // hard mode: only root + target shown
  const timerRef = useRef(null);

  const shape = SHAPES_BY_ID[shapeId];
  const rootFret = getRootFret(keyIdx, shape.rootStrIdx);
  const isMinor = shape.isMinor;

  // ── Quiz logic ───────────────────────────────────────────────────────────────
  const makeQuestion = useCallback((sid, ki) => {
    // Mixed mode: pick a random shape each question
    const resolvedSid = sid === 'mixed'
      ? ALL_SHAPES[Math.floor(Math.random() * ALL_SHAPES.length)].id
      : sid;
    const s = SHAPES_BY_ID[resolvedSid];
    // Pick random degree (0-6, include all)
    const pool = [0,1,2,3,4,5,6];
    const degIdx = pool[Math.floor(Math.random() * pool.length)];
    const dot = s.dots.find(d => d.d === degIdx);
    const rf = getRootFret(ki, s.rootStrIdx);
    const targetFret = rf + dot.fo;
    // correctNum: 1-based degree number (degIdx+1)
    const correctNum = degIdx + 1; // 1=root, 2=second, ... 7=seventh
    const correctType = degQuality(degIdx, s.isMinor); // 'maj'|'min'|'dim'
    return { sid: resolvedSid, ki, degIdx, dot, targetFret, correctNum, correctType, rf };
  }, []);

  const quitQuiz = useCallback(() => {
    clearInterval(timerRef.current);
    setQPhase('setup');
    setQAnswer(null);
    setQPickedNum(null);
    setQPickedType(null);
  }, []);

  const startQuiz = useCallback(() => {
    const ki = qKeyMode === 'random' ? Math.floor(Math.random() * 12)
      : qKeyMode === 'fixed' ? qFixedKey
      : [0,2,4,5,7,9,11][Math.floor(Math.random() * 7)]; // common keys
    const q = makeQuestion(qShapeId, ki);
    setQQuestion(q); setQAnswer(null);
    setQPickedNum(null); setQPickedType(null);
    setQTimeLeft(qTimeLimit); setQScore(0); setQStreak(0);
    setQBest(0); setQIdx(0); setQHistory([]);
    setQPhase('playing');
  }, [qShapeId, qKeyMode, qFixedKey, qTimeLimit, makeQuestion]);

  const advanceQuiz = useCallback((wasCorrect) => {
    const next = qIdx + 1;
    if (next >= qNumQ) { setQPhase('done'); return; }
    setQIdx(next);
    const ki = qKeyMode === 'random' ? Math.floor(Math.random() * 12)
      : qKeyMode === 'fixed' ? qFixedKey
      : [0,2,4,5,7,9,11][Math.floor(Math.random() * 7)];
    setQQuestion(makeQuestion(qShapeId, ki));
    setQAnswer(null);
    setQPickedNum(null);
    setQPickedType(null);
    setQTimeLeft(qTimeLimit);
  }, [qIdx, qNumQ, qShapeId, qKeyMode, qFixedKey, qTimeLimit, makeQuestion]);

  // Timer effect
  useEffect(() => {
    if (qPhase !== 'playing' || qAnswer !== null) {
      clearInterval(timerRef.current); return;
    }
    timerRef.current = setInterval(() => {
      setQTimeLeft(t => {
        if (t <= 0.1) {
          clearInterval(timerRef.current);
          setQAnswer(-1); // timeout
          setQStreak(0);
          setQHistory(h => [...h, { correct: false }]);
          // No auto-advance — user clicks Next
          return 0;
        }
        return +(t - 0.1).toFixed(1);
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [qPhase, qAnswer, advanceQuiz]);

  const handleSubmit = () => {
    if (qAnswer !== null || !qQuestion || qPickedNum === null || qPickedType === null) return;
    clearInterval(timerRef.current);
    const correctNum = qQuestion.correctNum;
    const correctType = qQuestion.correctType;
    const numCorrect = qPickedNum === correctNum;
    const typeCorrect = qPickedType === correctType;
    const correct = numCorrect && typeCorrect;
    setQAnswer({ pickedNum: qPickedNum, pickedType: qPickedType, correct, numCorrect, typeCorrect });
    if (correct) {
      setQScore(s => s + 1);
      setQStreak(s => { const ns = s + 1; setQBest(b => Math.max(b, ns)); return ns; });
    } else {
      setQStreak(0);
    }
    setQHistory(h => [...h, { correct }]);
    // No auto-advance — user clicks Next
  };

  // Auto-submit when both degree and type are picked
  useEffect(() => {
    if (qPhase === 'playing' && qAnswer === null && qPickedNum !== null && qPickedType !== null) {
      handleSubmit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qPickedNum, qPickedType]);

  const scrollRef = useRef(null);
  const timerPct = qTimeLeft / qTimeLimit * 100;
  const timerColor = timerPct > 60 ? TEAL : timerPct > 30 ? GOLD : RED;

  // ── Learn tab ────────────────────────────────────────────────────────────────
  const renderLearn = () => (
    <div style={{ paddingBottom: 8 }}>
      {/* Key selector */}
      <div style={{ padding: '10px 14px 6px' }}>
        <div style={{ fontSize: 10, color: TEXT2, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Key</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {NOTE_NAMES.map((n, i) => (
            <button key={i} onClick={() => setKeyIdx(i)} style={{
              padding: '5px 9px', borderRadius: 8,
              border: `1px solid ${i === keyIdx ? GOLD : BORDER}`,
              background: i === keyIdx ? GOLD + '22' : 'transparent',
              color: i === keyIdx ? GOLD : TEXT2,
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Segoe UI',system-ui,sans-serif",
            }}>{n}</button>
          ))}
        </div>
      </div>

      {/* Shape selector */}
      <div style={{ padding: '6px 14px 8px' }}>
        <div style={{ fontSize: 10, color: TEXT2, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Shape</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {ALL_SHAPES.map((s, idx) => {
            const active = shapeId === s.id;
            const c = s.isMinor ? TEAL : RED;
            const isLastOdd = idx === ALL_SHAPES.length - 1 && ALL_SHAPES.length % 2 === 1;
            return (
              <button key={s.id} onClick={() => { setShapeId(s.id); setHlDeg(null); }} style={{
                gridColumn: isLastOdd ? '1 / -1' : undefined,
                padding: '10px 8px', borderRadius: 10,
                border: `1px solid ${active ? c : BORDER}`,
                background: active ? c + '18' : BG2,
                color: active ? c : TEXT1,
                cursor: 'pointer', textAlign: 'center',
                fontFamily: "'Segoe UI',system-ui,sans-serif",
                transition: 'all .15s',
              }}>
                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1 }}>{s.name}</div>
                <div style={{ fontSize: 9, marginTop: 2, opacity: 0.7 }}>
                  {s.isMinor ? 'Minor' : 'Major'} · root on {s.rootStrLabel}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div style={{
        margin: '0 14px 10px',
        background: BG2, border: `1px solid ${BORDER}`,
        borderRadius: 10, padding: '8px 12px',
        fontSize: 11, color: TEXT1, lineHeight: 1.6,
      }}>{shape.desc}</div>

      {/* Fretboard */}
      <div style={{
        margin: '0 14px 10px',
        background: BG2, border: `1px solid ${BORDER2}`,
        borderRadius: 12, padding: '12px 6px 8px',
      }}>
        <Fretboard shape={shape} rootFret={rootFret} keyIdx={keyIdx}
          highlightDeg={hlDeg}
          onDotClick={d => setHlDeg(hlDeg === d ? null : d)}
          quizMode={false} revealAll={true} />
      </div>

      {/* Legend — derived from current shape */}
      <div style={{ display: 'flex', gap: 14, padding: '0 14px 10px', flexWrap: 'wrap' }}>
        {(() => {
          // Exclude root (d=0) from both groups — handle it separately with pulse indicator
          const redDots = shape.dots
            .filter(dot => dot.d !== 0 && shape.redGroup.has(dot.d))
            .sort((a, b) => a.d - b.d);
          const tealDots = shape.dots
            .filter(dot => dot.d !== 0 && shape.tealGroup.has(dot.d))
            .sort((a, b) => a.d - b.d);

          const redLabels  = redDots.map(dot => degLabel(dot.d, isMinor));
          const tealLabels = tealDots.map(dot => degLabel(dot.d, isMinor));

          // Quality of each group — majority vote on non-root dots
          const majorityQual = (dots) => {
            const counts = {};
            dots.forEach(dot => {
              const q = degQuality(dot.d, isMinor);
              counts[q] = (counts[q] || 0) + 1;
            });
            return Object.entries(counts).sort((a,b) => b[1]-a[1])[0]?.[0] || 'maj';
          };
          const redQual  = majorityQual(redDots);
          const tealQual = majorityQual(tealDots);
          const redQualLabel  = redQual  === 'maj' ? 'Major' : 'Minor';
          const tealQualLabel = tealQual === 'maj' ? 'Major' : 'Minor';

          // Dim dot
          const dimDot = shape.dots.find(dot => isMinor ? dot.d === 1 : dot.d === 6);
          const dimLabel = dimDot ? degLabel(dimDot.d, isMinor) : null;

          // Root label and which color it belongs to
          const rootLabel = degLabel(0, isMinor);  // '1' or '1m'
          const rootInRed = shape.redGroup.has(0);
          const rootColor = rootInRed ? COLOR_MAJ : COLOR_MIN;

          const redFull  = rootInRed
            ? `${redQualLabel} (${[rootLabel + ' ◎', ...redLabels].join(', ')})`
            : `${redQualLabel} (${redLabels.join(', ')})`;
          const tealFull = !rootInRed
            ? `${tealQualLabel} (${[rootLabel + ' ◎', ...tealLabels].join(', ')})`
            : `${tealQualLabel} (${tealLabels.join(', ')})`;

          const items = [
            [COLOR_MAJ, redFull],
            [COLOR_MIN, tealFull],
            dimLabel ? [COLOR_DIM, `Dim (${dimLabel})`] : null,
          ].filter(Boolean);

          return items.map(([c, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: TEXT1 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 }} />
              {label}
            </div>
          ));
        })()}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: TEXT2 }}>
          <span>◎</span> = root (pulses)
        </div>
      </div>

      {/* Chord grid */}
      <div style={{ padding: '0 14px' }}>
        <div style={{ fontSize: 10, color: TEXT2, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
          All 7 chords in {NOTE_NAMES[keyIdx]} {isMinor ? 'minor' : 'major'} — tap to highlight
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {shape.dots.map(dot => {
            const d = dot.d;
            const label = degLabel(d, isMinor);
            const quality = degQuality(d, isMinor);
            const noteName = chordName(keyIdx, d, isMinor);
            const isRoot = d === 0;
            const color = getDotColor(d, shape);
            const fret = rootFret + dot.fo;
            const strName = dot.si === 0 ? 'str6' : 'str5';
            const isHL = hlDeg === d;

            return (
              <div key={d} onClick={() => setHlDeg(isHL ? null : d)} style={{
                background: isHL ? color + '18' : BG2,
                border: `1px solid ${isHL ? color : BORDER}`,
                borderRadius: 10, padding: '9px 10px',
                cursor: 'pointer', transition: 'all .15s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color,
                    fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
                    {label}{isRoot ? ' ◎' : ''}
                  </span>
                  <span style={{ fontSize: 9, color: TEXT2 }}>{strName} fr{fret}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: TEXT0 }}>{noteName}</div>
                <div style={{ fontSize: 9, color: TEXT2, marginTop: 1 }}>{quality}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── Quiz tab ─────────────────────────────────────────────────────────────────
  const renderQuiz = () => {
    if (qPhase === 'setup') return (
      <div style={{ padding: '14px', maxWidth: 440, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '14px 0 12px' }}>
          <div style={{ fontSize: 30, marginBottom: 5 }}>⚡</div>
          <div style={{ fontSize: 17, fontWeight: 900, color: GOLD }}>Root Note Quiz</div>
          <div style={{ fontSize: 11, color: TEXT2, marginTop: 4 }}>
            A dot lights up on the fretboard — name the degree. Beat the clock.
          </div>
        </div>

        {[
          {
            title: 'Shape',
            opts: [
              ...ALL_SHAPES.map(s => ({ id: s.id, label: s.name })),
              { id: 'mixed', label: '⚡ Mixed' },
            ],
            val: qShapeId, set: setQShapeId,
          },
          {
            title: 'Keys',
            opts: [
              { id: 'random', label: 'All 12' },
              { id: 'common', label: 'Common' },
              { id: 'fixed', label: 'One key' },
            ],
            val: qKeyMode, set: setQKeyMode,
          },
          {
            title: 'Time per question',
            opts: [4,6,8,12,20].map(t => ({ id: t, label: `${t}s` })),
            val: qTimeLimit, set: setQTimeLimit,
          },
          {
            title: 'Questions',
            opts: [5,10,15,20].map(n => ({ id: n, label: String(n) })),
            val: qNumQ, set: setQNumQ,
          },
        ].map(({ title, opts, val, set }) => (
          <div key={title} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: TEXT2, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 7 }}>{title}</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {opts.map(o => (
                <button key={o.id} onClick={() => set(o.id)} style={{
                  padding: '6px 11px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${val === o.id ? GOLD : BORDER}`,
                  background: val === o.id ? GOLD + '22' : BG2,
                  color: val === o.id ? GOLD : TEXT1,
                  fontSize: 11, fontWeight: 700,
                  fontFamily: "'Segoe UI',system-ui,sans-serif",
                }}>{o.label}</button>
              ))}
            </div>
            {/* Fixed key sub-picker */}
            {title === 'Keys' && qKeyMode === 'fixed' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                {NOTE_NAMES.map((n, i) => (
                  <button key={i} onClick={() => setQFixedKey(i)} style={{
                    padding: '4px 8px', borderRadius: 7, cursor: 'pointer',
                    border: `1px solid ${qFixedKey === i ? GOLD : BORDER}`,
                    background: qFixedKey === i ? GOLD + '22' : 'transparent',
                    color: qFixedKey === i ? GOLD : TEXT2,
                    fontSize: 11, fontWeight: 700,
                    fontFamily: "'Segoe UI',system-ui,sans-serif",
                  }}>{n}</button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Difficulty */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: TEXT2, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 7 }}>
            Difficulty
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setQHardMode(false)} style={{
              flex: 1, padding: '9px 8px', borderRadius: 9, cursor: 'pointer',
              border: `1px solid ${!qHardMode ? GOLD : BORDER}`,
              background: !qHardMode ? GOLD + '22' : BG2,
              color: !qHardMode ? GOLD : TEXT1,
              fontSize: 11, fontWeight: 700,
              fontFamily: "'Segoe UI',system-ui,sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <span>💡</span> Normal
            </button>
            <button onClick={() => setQHardMode(true)} style={{
              flex: 1, padding: '9px 8px', borderRadius: 9, cursor: 'pointer',
              border: `1px solid ${qHardMode ? RED : BORDER}`,
              background: qHardMode ? RED + '22' : BG2,
              color: qHardMode ? RED : TEXT1,
              fontSize: 11, fontWeight: 700,
              fontFamily: "'Segoe UI',system-ui,sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <span>🔥</span> Hard
            </button>
          </div>
          <div style={{ fontSize: 9, color: TEXT2, marginTop: 5 }}>
            {qHardMode ? '🔥 Hard: only root (pulsing) + target dot shown' : '💡 Normal: all dots and shape lines visible'}
          </div>
        </div>

        <button onClick={startQuiz} style={{
          display: 'block', width: '100%', padding: 14,
          background: GOLD, color: '#111', border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 900, cursor: 'pointer', letterSpacing: 1,
          fontFamily: "'Segoe UI',system-ui,sans-serif",
        }}>Start Quiz 🎸</button>
      </div>
    );

    if (qPhase === 'done') {
      const pct = Math.round(qScore / qNumQ * 100);
      return (
        <div style={{ padding: '28px 14px', maxWidth: 380, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 50, marginBottom: 5 }}>
            {pct === 100 ? '🏆' : pct >= 80 ? '⭐' : pct >= 60 ? '🎸' : '💪'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: TEXT0, marginBottom: 2 }}>
            {pct === 100 ? 'Flawless!' : pct >= 80 ? 'Sharp ears!' : pct >= 60 ? 'Getting there!' : 'Keep practising!'}
          </div>
          <div style={{ fontSize: 54, fontWeight: 900, color: GOLD, lineHeight: 1, marginBottom: 2 }}>
            {qScore}/{qNumQ}
          </div>
          <div style={{ color: TEXT2, fontSize: 12, marginBottom: 6 }}>
            {pct}% · best streak: {qBest}
          </div>

          {/* History dots */}
          <div style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
            {qHistory.map((h, i) => (
              <div key={i} style={{
                width: 26, height: 26, borderRadius: 6,
                background: h.correct ? GREEN + '20' : RED + '20',
                border: `1px solid ${h.correct ? GREEN : RED}`,
                color: h.correct ? GREEN : RED,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
              }}>{h.correct ? '✓' : '✗'}</div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => setQPhase('setup')} style={{
              background: 'transparent', border: `1px solid ${BORDER}`,
              color: TEXT1, padding: '10px 18px', borderRadius: 10,
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Segoe UI',system-ui,sans-serif",
            }}>Settings</button>
            <button onClick={startQuiz} style={{
              background: GOLD, color: '#111', border: 'none',
              padding: '10px 28px', borderRadius: 10,
              fontSize: 13, fontWeight: 800, cursor: 'pointer',
              fontFamily: "'Segoe UI',system-ui,sans-serif",
            }}>Again</button>
          </div>
        </div>
      );
    }

    // Playing
    if (!qQuestion) return null;
    const qs = SHAPES_BY_ID[qQuestion.sid];
    const qIsMinor = qs.isMinor;
    const answered = qAnswer !== null;
    const isTimeout = qAnswer === -1;
    const isCorrect = answered && !isTimeout && qAnswer.correct;

    // Border color for fretboard: green=correct, red=wrong/timeout, neutral=unanswered
    const fbBorder = !answered ? BORDER2 : isCorrect ? GREEN : RED;

    return (
      <div style={{ padding: '12px 14px', maxWidth: 440, margin: '0 auto' }}>
        {/* Score bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: TEXT2 }}>Q{qIdx + 1}/{qNumQ}</span>
            {qHardMode && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: RED,
                background: RED + '18', border: `1px solid ${RED}44`,
                borderRadius: 5, padding: '1px 5px',
              }}>🔥 HARD</span>
            )}
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: GOLD }}>{qScore} pts</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: timerColor }}>{Math.ceil(qTimeLeft)}s</span>
            <button onClick={quitQuiz} style={{
              background: RED + '18',
              border: `1px solid ${RED}66`,
              color: RED, borderRadius: 7,
              padding: '3px 9px', fontSize: 10,
              fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Segoe UI',system-ui,sans-serif",
              letterSpacing: 0.5,
            }}>✕ Quit</button>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: BG3, borderRadius: 3, height: 3, marginBottom: 6 }}>
          <div style={{
            background: `linear-gradient(90deg,${RED},${GOLD})`,
            height: 3, borderRadius: 3,
            width: `${(qIdx / qNumQ) * 100}%`, transition: 'width .3s',
          }} />
        </div>

        {/* Timer bar */}
        <div style={{ background: BG3, borderRadius: 3, height: 4, marginBottom: 12 }}>
          <div style={{
            background: timerColor, height: 4, borderRadius: 3,
            width: `${timerPct}%`, transition: 'width .1s linear',
          }} />
        </div>

        {/* Prompt */}
        <div style={{
          background: BG2, border: `1px solid ${BORDER}`,
          borderRadius: 12, padding: '10px 12px', marginBottom: 10, textAlign: 'center',
        }}>
          <div style={{ fontSize: 10, color: TEXT2, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3 }}>
            {qs.name} · Key of {NOTE_NAMES[qQuestion.ki]}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: TEXT0 }}>
            What chord should have the solid dot as root?
          </div>
          <div style={{ fontSize: 11, color: TEXT2, marginTop: 2 }}>
            str{qQuestion.dot.si === 0 ? '6' : '5'} · fret {qQuestion.targetFret}
          </div>
        </div>

        {/* Fretboard */}
        <div style={{
          background: BG2, borderRadius: 12, padding: '10px 6px 8px', marginBottom: 12,
          border: `1px solid ${fbBorder}`, transition: 'border-color .3s',
        }}>
          <Fretboard
            shape={qs}
            rootFret={qQuestion.rf}
            keyIdx={qQuestion.ki}
            highlightDeg={qQuestion.degIdx}
            onDotClick={null}
            quizMode={true}
            revealAll={answered}
            hardMode={qHardMode}
          />
        </div>

        {/* Two-part answer UI */}
        {!answered && (
          <>
            {/* Row 1: Scale degree number 1–7 */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: TEXT2, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
                Scale degree
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
                {[1,2,3,4,5,6,7].map(n => {
                  const picked = qPickedNum === n;
                  return (
                    <button key={n} onClick={() => setQPickedNum(n)} style={{
                      padding: '10px 0', borderRadius: 9,
                      border: `1.5px solid ${picked ? GOLD : BORDER}`,
                      background: picked ? GOLD + '28' : BG2,
                      color: picked ? GOLD : TEXT1,
                      fontSize: 18, fontWeight: 900, cursor: 'pointer',
                      transition: 'all .12s', textAlign: 'center',
                      fontFamily: "'Segoe UI',system-ui,sans-serif",
                    }}>{n}</button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Chord type */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: TEXT2, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
                Chord type
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7 }}>
                {[
                  { id: 'maj', label: 'Major', color: COLOR_MAJ },
                  { id: 'min', label: 'Minor', color: COLOR_MIN },
                  { id: 'dim', label: 'Dim',   color: COLOR_DIM },
                ].map(({ id, label, color }) => {
                  const picked = qPickedType === id;
                  return (
                    <button key={id} onClick={() => setQPickedType(id)} style={{
                      padding: '11px 6px', borderRadius: 10,
                      border: `1.5px solid ${picked ? color : BORDER}`,
                      background: picked ? color + '28' : BG2,
                      color: picked ? color : TEXT1,
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      transition: 'all .12s', textAlign: 'center',
                      fontFamily: "'Segoe UI',system-ui,sans-serif",
                    }}>{label}</button>
                  );
                })}
              </div>
            </div>

            {/* Hint when one part is picked */}
            {(qPickedNum !== null) !== (qPickedType !== null) && (
              <div style={{ textAlign: 'center', fontSize: 11, color: TEXT2, marginBottom: 4 }}>
                {qPickedNum !== null ? 'Now pick chord type →' : 'Now pick scale degree →'}
              </div>
            )}
          </>
        )}

        {/* Feedback after answer — with Next button */}
        {answered && (
          <div style={{
            background: isCorrect ? GREEN + '15' : RED + '15',
            border: `1px solid ${isCorrect ? GREEN : RED}`,
            borderRadius: 11, padding: '12px 14px',
          }}>
            {isTimeout ? (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: RED, marginBottom: 4 }}>⏱ Time up!</div>
                <div style={{ fontSize: 12, color: TEXT1, marginBottom: 12 }}>
                  Answer: <span style={{ color: GOLD, fontWeight: 700 }}>
                    {qQuestion.correctNum} · {qQuestion.correctType}
                  </span> — {degLabel(qQuestion.degIdx, qIsMinor)} ({chordName(qQuestion.ki, qQuestion.degIdx, qIsMinor)})
                </div>
              </>
            ) : isCorrect ? (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: GREEN, marginBottom: 4 }}>✓ Correct!</div>
                <div style={{ fontSize: 12, color: TEXT1, marginBottom: 12 }}>
                  {degLabel(qQuestion.degIdx, qIsMinor)} — {chordName(qQuestion.ki, qQuestion.degIdx, qIsMinor)} · {qQuestion.correctType}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: RED, marginBottom: 4 }}>
                  ✗ {!qAnswer.numCorrect && !qAnswer.typeCorrect ? 'Both wrong'
                    : !qAnswer.numCorrect ? 'Wrong degree'
                    : 'Wrong type'}
                </div>
                <div style={{ fontSize: 12, color: TEXT1, marginBottom: 2 }}>
                  You picked: <span style={{ color: TEXT0, fontWeight: 700 }}>
                    {qAnswer.pickedNum} · {qAnswer.pickedType}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: TEXT1, marginBottom: 12 }}>
                  Correct: <span style={{ color: GOLD, fontWeight: 700 }}>
                    {qQuestion.correctNum} · {qQuestion.correctType}
                  </span> — {degLabel(qQuestion.degIdx, qIsMinor)} ({chordName(qQuestion.ki, qQuestion.degIdx, qIsMinor)})
                </div>
              </>
            )}
            <button
              onClick={() => advanceQuiz(isCorrect)}
              style={{
                width: '100%', padding: '11px',
                background: GOLD, color: '#111',
                border: 'none', borderRadius: 9,
                fontSize: 13, fontWeight: 900, cursor: 'pointer',
                fontFamily: "'Segoe UI',system-ui,sans-serif",
              }}>
              {qIdx + 1 >= qNumQ ? 'See results →' : 'Next →'}
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── Practice tab state ───────────────────────────────────────────────────────
  const [practiceProgIdx, setPracticeProgIdx] = useState(null);
  const [practiceFeel, setPracticeFeel] = useState('All');
  const [practiceShapeId, setPracticeShapeId] = useState(null);
  const [practiceTipOpen, setPracticeTipOpen] = useState(true);
  const [practiceKeyIdx, setPracticeKeyIdx] = useState(7); // G default
  const [showAllKeys, setShowAllKeys] = useState(false);

  const getFilteredProgs = useCallback((feelFilter) => {
    if (feelFilter === 'All') return PRACTICE_PROGS;
    return PRACTICE_PROGS.filter(p => p.feelGroup === feelFilter);
  }, []);

  const loadRandomProg = useCallback((feelFilter) => {
    const pool = getFilteredProgs(feelFilter);
    if (!pool.length) return;
    const idx = PRACTICE_PROGS.indexOf(pool[Math.floor(Math.random() * pool.length)]);
    setPracticeProgIdx(idx);
    const prog = PRACTICE_PROGS[idx];
    // Auto-select first recommended shape
    if (prog.shapes.length > 0) setPracticeShapeId(prog.shapes[0].id);
    setPracticeTipOpen(true);
  }, [getFilteredProgs]);

  // ── Practice tab render ──────────────────────────────────────────────────────
  const renderPractice = () => {
    const prog = practiceProgIdx !== null ? PRACTICE_PROGS[practiceProgIdx] : null;
    const activeShape = prog && practiceShapeId ? SHAPES_BY_ID[practiceShapeId] : null;
    const rf = activeShape ? getRootFret(practiceKeyIdx, activeShape.rootStrIdx) : 0;

    // Which degree indices are in this progression
    const progDegSet = prog ? new Set(prog.degrees.map(c => c.d)) : new Set();

    return (
      <div style={{ paddingBottom: 8 }}>

        {/* ── Random drill card ─────────────────────────────────────────── */}
        <div style={{ padding: '10px 14px 0' }}>
          {/* Feel filter */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
            {PROG_FEEL_GROUPS.map(g => (
              <button key={g} onClick={() => setPracticeFeel(g)} style={{
                padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
                border: `1px solid ${practiceFeel === g ? GOLD : BORDER}`,
                background: practiceFeel === g ? GOLD + '22' : BG2,
                color: practiceFeel === g ? GOLD : TEXT2,
                fontSize: 10, fontWeight: 700,
                fontFamily: "'Segoe UI',system-ui,sans-serif",
              }}>{g} ({getFilteredProgs(g).length})</button>
            ))}
          </div>

          {/* Random button */}
          <button onClick={() => loadRandomProg(practiceFeel)} style={{
            display: 'block', width: '100%', padding: '16px',
            background: GOLD,
            color: '#111',
            border: 'none',
            borderRadius: 13, fontSize: 15, fontWeight: 900,
            cursor: 'pointer', marginBottom: 10,
            letterSpacing: 0.5,
            boxShadow: `0 4px 18px ${GOLD}44`,
            fontFamily: "'Segoe UI',system-ui,sans-serif",
          }}>
            {prog ? '↺  New Random Progression' : '🎲  Pick a Random Progression'}
          </button>
        </div>

        {/* ── Drill card ────────────────────────────────────────────────── */}
        {prog && (
          <div style={{ padding: '0 14px 14px' }}>

            {/* Title + feel */}
            <div style={{
              background: BG2, border: `1px solid ${BORDER2}`,
              borderRadius: 12, padding: '11px 12px 10px', marginBottom: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: TEXT0 }}>{prog.title}</div>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                  background: PURPLE + '22', color: PURPLE, flexShrink: 0,
                }}>{prog.feel}</span>
              </div>
              <div style={{ fontSize: 11, color: TEXT1, lineHeight: 1.5, marginBottom: 8 }}>{prog.desc}</div>

              {/* Degree sequence */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                {prog.degrees.map((c, i) => {
                  const color = getDotColor(c.d, activeShape || SHAPES_BY_ID[prog.shapes[0].id]);
                  return (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{
                        background: color + '22', color, border: `1px solid ${color}44`,
                        borderRadius: 6, padding: '2px 7px',
                        fontSize: 12, fontWeight: 700,
                        fontFamily: "'Segoe UI',system-ui,sans-serif",
                      }}>{c.rn}</span>
                      {i < prog.degrees.length - 1 && (
                        <span style={{ color: TEXT2, fontSize: 10 }}>→</span>
                      )}
                    </span>
                  );
                })}
              </div>

              {/* Key selector */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 9, color: TEXT2, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 5 }}>
                  Key
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(showAllKeys ? NOTE_NAMES.map((_,i) => i) : COMMON_KEY_IDXS).map(ki => (
                    <button key={ki} onClick={() => setPracticeKeyIdx(ki)} style={{
                      padding: '4px 8px', borderRadius: 7, cursor: 'pointer',
                      border: `1px solid ${ki === practiceKeyIdx ? GOLD : BORDER}`,
                      background: ki === practiceKeyIdx ? GOLD + '22' : 'transparent',
                      color: ki === practiceKeyIdx ? GOLD : TEXT2,
                      fontSize: 11, fontWeight: 700,
                      fontFamily: "'Segoe UI',system-ui,sans-serif",
                    }}>{NOTE_NAMES[ki]}</button>
                  ))}
                  <button onClick={() => setShowAllKeys(p => !p)} style={{
                    padding: '4px 8px', borderRadius: 7, cursor: 'pointer',
                    border: `1px solid ${BORDER}`,
                    background: 'transparent', color: TEXT2,
                    fontSize: 11, fontWeight: 700,
                    fontFamily: "'Segoe UI',system-ui,sans-serif",
                  }}>{showAllKeys ? '−' : '+ more'}</button>
                </div>
              </div>

              {/* Chord names in selected key */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                {prog.degrees.map((c, i) => {
                  const noteIdx = (practiceKeyIdx + DIATONIC_ST[c.d]) % 12;
                  const q = prog.isMinor ? MIN_QUALITY[c.d] : MAJ_QUALITY[c.d];
                  const name = NOTE_NAMES[noteIdx] + (q === 'min' ? 'm' : q === 'dim' ? '°' : '');
                  // Apply alteration from rn label if present
                  const rn = c.rn;
                  const isAltered = rn.includes('7') || rn.includes('b9') || rn.includes('#');
                  const suffix = isAltered && !rn.includes('ii') && !rn.includes('IV') ? '7' : '';
                  return (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 11, color: TEXT0, fontWeight: 700 }}>{name}{suffix}</span>
                      {i < prog.degrees.length - 1 && <span style={{ color: TEXT2, fontSize: 10 }}>→</span>}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Shape selector */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: TEXT2, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
                Recommended shape{prog.shapes.length > 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {prog.shapes.map(sh => {
                  const s = SHAPES_BY_ID[sh.id];
                  const active = practiceShapeId === sh.id;
                  const c = s.isMinor ? TEAL : RED;
                  return (
                    <button key={sh.id} onClick={() => setPracticeShapeId(sh.id)} style={{
                      flex: 1, minWidth: 0, padding: '8px 8px', borderRadius: 9, cursor: 'pointer',
                      border: `1px solid ${active ? c : BORDER}`,
                      background: active ? c + '18' : BG2,
                      color: active ? c : TEXT1,
                      textAlign: 'left',
                      fontFamily: "'Segoe UI',system-ui,sans-serif",
                      transition: 'all .15s',
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>{s.name}</div>
                      <div style={{ fontSize: 9, color: active ? c + 'cc' : TEXT2, marginTop: 2, lineHeight: 1.4 }}>{sh.reason}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fretboard */}
            {activeShape && (
              <div style={{
                background: BG2, border: `1px solid ${BORDER2}`,
                borderRadius: 12, padding: '22px 18px', marginBottom: 10,
                overflow: 'visible',
              }}>
                <PracticeFretboard
                  shape={activeShape}
                  rootFret={rf}
                  progDegSet={progDegSet}
                  progDegrees={prog.degrees}
                />
              </div>
            )}

            {/* Practice tip */}
            <div style={{
              background: GOLD + '0e', border: `1px solid ${GOLD}33`,
              borderRadius: 11, overflow: 'hidden',
            }}>
              <button onClick={() => setPracticeTipOpen(p => !p)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 12px', background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: "'Segoe UI',system-ui,sans-serif",
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>💡 Practice tip</span>
                <span style={{
                  color: GOLD, fontSize: 13,
                  transform: practiceTipOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform .2s', display: 'inline-block',
                }}>▾</span>
              </button>
              {practiceTipOpen && (
                <div style={{ padding: '0 12px 11px', fontSize: 11, color: TEXT1, lineHeight: 1.7 }}>
                  {prog.tip}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Browse list ────────────────────────────────────────────────── */}
        <div style={{ padding: '0 14px 8px' }}>
          <div style={{ fontSize: 10, color: TEXT2, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
            All progressions
          </div>
          {PROG_FEEL_GROUPS.filter(g => g !== 'All').map(group => {
            const groupProgs = PRACTICE_PROGS.filter(p => p.feelGroup === group);
            if (!groupProgs.length) return null;
            return (
              <div key={group} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: TEXT2, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 5, paddingLeft: 2 }}>
                  {group}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {groupProgs.map(p => {
                    const idx = PRACTICE_PROGS.indexOf(p);
                    const isActive = practiceProgIdx === idx;
                    return (
                      <div key={p.id} onClick={() => {
                        setPracticeProgIdx(idx);
                        setPracticeShapeId(p.shapes[0].id);
                        setPracticeTipOpen(true);
                        if (scrollRef.current) scrollRef.current.scrollTop = 0;
                      }} style={{
                        background: isActive ? BG3 : BG2,
                        border: `1px solid ${isActive ? GOLD : BORDER}`,
                        borderRadius: 9, padding: '8px 10px', cursor: 'pointer',
                        transition: 'all .15s',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? GOLD : TEXT0, marginBottom: 3 }}>
                              {p.title}
                            </div>
                            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                              {p.shapes.map(sh => {
                                const s = SHAPES_BY_ID[sh.id];
                                const c = s.isMinor ? TEAL : RED;
                                return (
                                  <span key={sh.id} style={{
                                    fontSize: 8, fontWeight: 700, padding: '1px 5px',
                                    borderRadius: 4, background: c + '18', color: c,
                                    border: `1px solid ${c}33`,
                                  }}>{s.shortName}</span>
                                );
                              })}
                            </div>
                          </div>
                          <span style={{
                            fontSize: 9, color: PURPLE, background: PURPLE + '18',
                            border: `1px solid ${PURPLE}33`, padding: '1px 6px',
                            borderRadius: 4, flexShrink: 0, fontWeight: 700,
                          }}>{p.feel}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Guide tab ────────────────────────────────────────────────────────────────
  const renderGuide = () => (
    <div style={{ padding: '12px 14px' }}>
      {[
        {
          title: 'Major L7 Shape',
          color: RED,
          lines: [
            'Root sits on the low-E string (str 6). This is your E-shape barre chord position.',
            'Red "7" shape: 1 (root), IV, V all cluster together. From 1, jump up to str5 at the same fret — that\'s IV. One step right = V. The path looks like a backwards 7.',
            'Teal "L" shape: 1, 2m, 3m run along str6 at +0, +2, +4 frets. Then 6m jumps up to str5 at +4fr. The path traces an L.',
            '7° sits one fret below the root on str6 — rarely used as a chord, marks the boundary.',
          ],
        },
        {
          title: 'Major LL Shape',
          color: TEAL,
          lines: [
            'Root still on low-E (str 6). Same 7 chords, grouped differently — both groups form upward L shapes.',
            'Red L: 1 (str6) jumps UP to str5 at same fret = IV, then steps right to V at +2fr. Vertical then horizontal = L.',
            'Teal L: 6m (str6, -3fr) jumps UP to str5 at -3fr = 2m, then steps right to 3m at -1fr. Another L.',
            'Use LL when your 1 chord appears in the middle of the neck and you need to see chords both behind and ahead.',
          ],
        },
        {
          title: 'Minor L7 Shape',
          color: PURPLE,
          lines: [
            'Root sits on the A-string (str 5). Root is on the upper of the two active strings.',
            'Red group (minor chords): 1m, 4m, 5m — the three minor chords. 5m sits on str6 at the same fret as 1m, and 4m is 2 frets left of 5m.',
            'Teal group (major chords): b3, b6, b7 — the three major chords borrowed from the relative major. b3 is on str6, b6 and b7 are on str5.',
            'Dim: 2° sits on str6, 5 frets below the root — rarely used, marks the edge of the shape.',
          ],
        },
        {
          title: 'Minor LL Shape',
          color: PINK,
          lines: [
            'Root on low-E (str 6). Same LL geometry as Major LL, with minor-key chord qualities.',
            'Red L: 1m (str6) jumps UP to 4m (str5, same fret), then right to 5m (+2fr). Vertical then horizontal = L.',
            'Teal L: b3 (str6, +3fr) jumps UP to b6 (str5, +3fr), then right to b7 (+5fr). Another L.',
            'b7 (the bVII major chord) is the rightmost dot — extremely common in rock and pop minor keys.',
          ],
        },
        {
          title: 'The quality rule — always',
          color: GOLD,
          lines: [
            'Major keys: 1=maj, 2m=min, 3m=min, 4=maj, 5=maj, 6m=min, 7°=dim',
            'Minor keys: 1m=min, 2°=dim, b3=maj, 4m=min, 5m=min, b6=maj, b7=maj',
            'Red dots are always major chords. Teal dots are always minor chords. This never changes regardless of key — only the fret positions move.',
          ],
        },
        {
          title: "Jimmy's Upside-Down T",
          color: GOLD,
          lines: [
            'Root on A-string (str5). A unique major key shape combining a long horizontal bar on str6 with a short stem on str5.',
            'Red group (major): 1 (root), 4, 5 — the T-stem. 4 and 5 run along str6 to the root fret, then 1 sits above on str5.',
            'Teal group (minor): 2m, 3m, 6m — the T-bar. 3m and 4 extend left on str6, 6m extends right, and 2m hangs above the right end on str5.',
            'The shape earns its name from the cross-bar on str6 (–3 to +2 frets) with the stem pointing upward to str5 — an upside-down T.',
          ],
        },
        {
          title: 'L7 vs LL — when to use each',
          color: TEXT1,
          lines: [
            'L7: The root is the leftmost important chord. You\'re thinking forward — I → IV → V to the right.',
            'LL: The root sits on the right side of one group and the left of the other. Good when you need to reach back (vi, ii) AND forward (IV, V) from the root.',
            'In practice: learn L7 first to lock in root positions. Add LL once L7 feels automatic — it fills in the "backward" chords you couldn\'t easily reach.',
          ],
        },
      ].map((sec, i) => (
        <div key={i} style={{
          background: BG2, border: `1px solid ${sec.color}33`,
          borderRadius: 12, padding: '11px 12px', marginBottom: 8,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: sec.color, marginBottom: 7, letterSpacing: 1 }}>
            {sec.title}
          </div>
          {sec.lines.map((line, j) => (
            <div key={j} style={{ fontSize: 11, color: TEXT1, lineHeight: 1.7, marginBottom: j < sec.lines.length - 1 ? 4 : 0 }}>
              · {line}
            </div>
          ))}
        </div>
      ))}
      <DebugPanel />
    </div>
  );

  // ── Return ────────────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'learn',    icon: '🎸', label: 'Learn'    },
    { id: 'practice', icon: '🎼', label: 'Practice' },
    { id: 'quiz',     icon: '🎯', label: 'Quiz'     },
    { id: 'guide',    icon: '📖', label: 'Guide'    },
  ];

  const CW = 600; // centered content max-width (matches AlteredTrainer)

  return (
    <div style={{
      background: BG,
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      color: TEXT0,
      fontFamily: "var(--font-body)",
      WebkitFontSmoothing: 'antialiased',
      paddingTop: 'env(safe-area-inset-top)',
    }}>
      <AppHeader toolKey="diatonic">
        <button className="fw-header-btn" onClick={() => setShowData(p => !p)}>⬆⬇ Data</button>
      </AppHeader>

      {/* Data panel */}
      {showData && (
        <div style={{
          background: BG2, borderBottom: `1px solid ${BG3}`,
          padding: '9px 14px', display: 'flex', alignItems: 'center',
          gap: 8, flexWrap: 'wrap', flexShrink: 0,
        }}>
          <span style={{ fontSize: 10, color: TEXT2 }}>Progress backup:</span>
          <button onClick={() => {
            const data = { v: 1, exported: new Date().toISOString() };
            const a = document.createElement('a');
            a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
            a.download = `l7ll-trainer-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
          }} style={{
            background: PURPLE + '22', color: PURPLE,
            border: `1px solid ${PURPLE}44`, padding: '5px 12px',
            borderRadius: 7, cursor: 'pointer', fontSize: 10, fontWeight: 700, minHeight: 34,
            touchAction: 'manipulation',
          }}>Export ↓</button>
          <label style={{
            background: TEAL + '22', color: TEAL,
            border: `1px solid ${TEAL}44`, padding: '5px 12px',
            borderRadius: 7, cursor: 'pointer', fontSize: 10, fontWeight: 700,
            minHeight: 34, display: 'flex', alignItems: 'center', touchAction: 'manipulation',
          }}>
            Import ↑
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={e => {
              const file = e.target.files[0]; if (!file) return;
              const reader = new FileReader();
              reader.onload = ev => {
                try { JSON.parse(ev.target.result); setImportMsg('✓ Imported!'); setTimeout(() => setImportMsg(''), 3000); }
                catch { setImportMsg('✗ Invalid file'); }
              };
              reader.readAsText(file); e.target.value = '';
            }} />
          </label>
          {importMsg && (
            <span style={{ fontSize: 10, fontWeight: 700, color: importMsg.startsWith('✓') ? GREEN : RED }}>
              {importMsg}
            </span>
          )}
          <span style={{ fontSize: 9, color: TEXT2, marginLeft: 'auto' }}>by Zak</span>
        </div>
      )}

      <TabBar toolKey="diatonic" tabs={TABS} active={tab} onChange={(id) => { setTab(id); if (scrollRef.current) scrollRef.current.scrollTop = 0; }} />

      {/* Scrollable content */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        overscrollBehaviorY: 'none',
      }}>
        <div style={{ maxWidth: CW, margin: '0 auto', paddingBottom: 'max(32px,env(safe-area-inset-bottom))' }}>
          {tab === 'learn'    && renderLearn()}
          {tab === 'practice' && renderPractice()}
          {tab === 'quiz'     && renderQuiz()}
          {tab === 'guide'    && renderGuide()}
        </div>
      </div>

      {/* Install banner (fixed, bottom sheet) */}
      <BannerStack />
    </div>
  );
}
