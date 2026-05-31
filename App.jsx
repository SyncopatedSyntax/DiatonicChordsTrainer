import { useState, useEffect, useRef, useCallback } from "react";

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
  desc: 'Root on A-string (str5). Red group: 1m, 4m, 5m (minor chords). Teal group: b3, b6, b7 (major chords).',
  dots: [
    { d:1, si:0, fo:-5 }, // 2°   str6, R-5  (d=1 → MIN_LABELS[1]='2°') ✓
    { d:2, si:0, fo:-4 }, // b3   str6, R-4
    { d:3, si:0, fo:-2 }, // 4m   str6, R-2
    { d:4, si:0, fo: 0 }, // 5m   str6, R+0
    { d:5, si:1, fo:-4 }, // b6   str5, R-4
    { d:6, si:1, fo:-2 }, // b7   str5, R-2  (d=6 → MIN_LABELS[6]='b7') ✓
    { d:0, si:1, fo: 0 }, // 1m   str5, R+0  ← ROOT
  ],
  redGroup:  new Set([0,3,4]),   // 1m, 4m, 5m  (minor chords → red)
  tealGroup: new Set([2,5,6]),   // b3, b6, b7  (major chords → teal)
  // Red path: 1m(str5,0) down to 5m(str6,0) left to 4m(str6,-2) — backwards-7 shape
  redPath:  [{si:1,fo:0},{si:0,fo:0},{si:0,fo:-2}],
  // Teal path: b3(str6,-4) up to b6(str5,-4) right to b7(str5,-2) — L shape
  tealPath: [{si:0,fo:-4},{si:1,fo:-4},{si:1,fo:-2}],
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
  desc: 'Root on low-E string. Two L shapes: 1m→4m→5m and b3→b6→b7, each forming an upward L.',
  dots: [
    { d:0, si:0, fo: 0 }, // 1m   str6, R+0  ← ROOT
    { d:1, si:0, fo: 2 }, // 2°   str6, R+2  (d=1 → MIN_LABELS[1]='2°') ✓
    { d:2, si:0, fo: 3 }, // b3   str6, R+3
    { d:3, si:1, fo: 0 }, // 4m   str5, R+0
    { d:4, si:1, fo: 2 }, // 5m   str5, R+2
    { d:5, si:1, fo: 3 }, // b6   str5, R+3
    { d:6, si:1, fo: 5 }, // b7   str5, R+5  (d=6 → MIN_LABELS[6]='b7') ✓
  ],
  redGroup:  new Set([0,3,4]),   // 1m, 4m, 5m  (minor chords → red)
  tealGroup: new Set([2,5,6]),   // b3, b6, b7  (major chords → teal)
  // Red L: 1m(str6,0) up to 4m(str5,0) right to 5m(str5,+2)
  redPath:  [{si:0,fo:0},{si:1,fo:0},{si:1,fo:2}],
  // Teal L: b3(str6,+3) up to b6(str5,+3) right to b7(str5,+5)
  tealPath: [{si:0,fo:3},{si:1,fo:3},{si:1,fo:5}],
};

const ALL_SHAPES = [SHAPE_MAJOR_L7, SHAPE_MAJOR_LL, SHAPE_MINOR_L7, SHAPE_MINOR_LL];
const SHAPES_BY_ID = Object.fromEntries(ALL_SHAPES.map(s => [s.id, s]));

// Degree labels
const MAJ_LABELS = ['1','2m','3m','4','5','6m','7°'];
const MIN_LABELS = ['1m','2°','b3','4m','5m','b6','b7'];
const MAJ_QUALITY = ['maj','min','min','maj','maj','min','dim'];
const MIN_QUALITY = ['min','dim','maj','min','min','maj','maj'];
const DIATONIC_ST  = [0,2,4,5,7,9,11]; // semitones from root for each degree

function degLabel(d, isMinor) { return isMinor ? MIN_LABELS[d] : MAJ_LABELS[d]; }
function degQuality(d, isMinor) { return isMinor ? MIN_QUALITY[d] : MAJ_QUALITY[d]; }

function getDotColor(d, shape, isRoot) {
  if (isRoot) return GOLD;
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

// ─── FRETBOARD SVG ─────────────────────────────────────────────────────────────
function Fretboard({ shape, rootFret, keyIdx, highlightDeg, onDotClick, quizMode, revealAll, size = 1 }) {
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
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', minWidth: W }}>

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

        {/* String lines */}
        {Array.from({ length: NUM_STRINGS }, (_, si) => {
          const y = sy(si);
          const isActive = si === shape.rootStrIdx || si === shape.upperStrIdx;
          const thick = [1.8, 1.4, 1.1, 0.9, 0.7, 0.5][si]; // idx 0=lowE thickest
          return (
            <line key={si} x1={ML} y1={y} x2={W - MR} y2={y}
              stroke={isActive ? BORDER2 : BORDER}
              strokeWidth={thick * (isActive ? 2 : 1)} />
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

        {/* Fret numbers */}
        {Array.from({ length: fretCount }, (_, i) => {
          const fret = startFret + i + 1;
          if (fret < 1) return null;
          return (
            <text key={fret} x={ML + (i + 0.5) * FS} y={H - 4}
              textAnchor="middle" fontSize={7 * size}
              fill={TEXT2} fontFamily="'Segoe UI',system-ui,sans-serif">
              {fret}fr
            </text>
          );
        })}

        {/* Shape connector lines — thick solid, always visible */}
        {(() => {
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
          const color = getDotColor(dot.d, shape, isRoot);

          // Quiz mode logic:
          // - target dot (isHl): solid filled, NO label
          // - other dots: hollow circle with bright stroke, NO label
          // - after reveal (revealAll): all dots show label
          const isTarget = quizMode && isHl;
          const showLabel = !quizMode || revealAll;

          // Fill: solid when not quiz, or when revealed, or when this is the target
          const isSolid = !quizMode || revealAll || isTarget;
          const fillColor = isSolid ? color : 'transparent';
          // Root dot in learn mode: yellow fill + red outline to show it belongs to major group
          const strokeColor = (!quizMode && isRoot) ? COLOR_MAJ : color;
          const strokeW = (!quizMode && isRoot) ? 2.5 : (isSolid ? 0 : 2);

          const dotOpacity = 1;

          const label = degLabel(dot.d, isMinor);
          const fontSize = label.length > 2 ? 7 * size : 8 * size;

          return (
            <g key={i}
              onClick={() => onDotClick && onDotClick(dot.d)}
              style={{ cursor: onDotClick ? 'pointer' : 'default' }}>
              {isHl && (
                <circle cx={cx} cy={cy} r={DR + 6 * size}
                  fill={color} opacity={0.18} />
              )}
              <circle cx={cx} cy={cy} r={DR}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeW}
                opacity={dotOpacity} />
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
  const color = getDotColor(d, shape, isRoot);
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

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('learn');
  const [shapeId, setShapeId] = useState('major_l7');
  const [keyIdx, setKeyIdx] = useState(9); // A
  const [hlDeg, setHlDeg] = useState(null);

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
  const timerRef = useRef(null);

  const shape = SHAPES_BY_ID[shapeId];
  const rootFret = getRootFret(keyIdx, shape.rootStrIdx);
  const isMinor = shape.isMinor;

  // ── Quiz logic ───────────────────────────────────────────────────────────────
  const makeQuestion = useCallback((sid, ki) => {
    const s = SHAPES_BY_ID[sid];
    // Pick random degree (0-6, include all)
    const pool = [0,1,2,3,4,5,6];
    const degIdx = pool[Math.floor(Math.random() * pool.length)];
    const dot = s.dots.find(d => d.d === degIdx);
    const rf = getRootFret(ki, s.rootStrIdx);
    const targetFret = rf + dot.fo;
    // correctNum: 1-based degree number (degIdx+1)
    const correctNum = degIdx + 1; // 1=root, 2=second, ... 7=seventh
    const correctType = degQuality(degIdx, s.isMinor); // 'maj'|'min'|'dim'
    return { sid, ki, degIdx, dot, targetFret, correctNum, correctType, rf };
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
          {ALL_SHAPES.map(s => {
            const active = shapeId === s.id;
            const c = s.isMinor ? TEAL : RED;
            return (
              <button key={s.id} onClick={() => { setShapeId(s.id); setHlDeg(null); }} style={{
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
          // Build legend labels from the shape's actual dot groups, sorted by degree index
          const redDots = shape.dots
            .filter(dot => dot.d !== 0 && shape.redGroup.has(dot.d))
            .sort((a, b) => a.d - b.d);
          const tealDots = shape.dots
            .filter(dot => shape.tealGroup.has(dot.d))
            .sort((a, b) => a.d - b.d);

          const redLabels = redDots.map(dot => degLabel(dot.d, isMinor));
          const tealLabels = tealDots.map(dot => degLabel(dot.d, isMinor));

          // Quality of each group — use majority vote (most common quality)
          const majorityQual = (dots) => {
            const counts = {};
            dots.forEach(dot => {
              const q = degQuality(dot.d, isMinor);
              counts[q] = (counts[q] || 0) + 1;
            });
            return Object.entries(counts).sort((a,b) => b[1]-a[1])[0]?.[0] || 'maj';
          };
          const redQual = majorityQual(redDots);
          const tealQual = majorityQual(tealDots);
          const redQualLabel = redQual === 'maj' ? 'Major' : 'Minor';
          const tealQualLabel = tealQual === 'maj' ? 'Major' : tealQual === 'min' ? 'Minor' : 'Dim';

          // Dim dot
          const dimDot = shape.dots.find(dot => isMinor ? dot.d === 1 : dot.d === 6);
          const dimLabel = dimDot ? degLabel(dimDot.d, isMinor) : null;

          const items = [
            [COLOR_MAJ, `${redQualLabel} (${['root', ...redLabels].join(', ')})`],
            [COLOR_MIN, `${tealQualLabel} (${tealLabels.join(', ')})`],
            dimLabel ? [COLOR_DIM, `Dim (${dimLabel})`] : null,
            [GOLD, `Root (${degLabel(0, isMinor)})`],
          ].filter(Boolean);

          return items.map(([c, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: TEXT1 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 }} />
              {label}
            </div>
          ));
        })()}
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
            const color = getDotColor(d, shape, isRoot);
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
                    fontFamily: "'Segoe UI',system-ui,sans-serif" }}>{label}</span>
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
            title: 'Shape', opts: ALL_SHAPES.map(s => ({ id: s.id, label: s.name })),
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
          <span style={{ fontSize: 11, color: TEXT2 }}>Q{qIdx + 1}/{qNumQ}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: GOLD }}>{qScore} pts</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: timerColor }}>{Math.ceil(qTimeLeft)}s</span>
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
            What is the highlighted dot?
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
    </div>
  );

  // ── Tabs ─────────────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'learn', icon: '🎸', label: 'Learn' },
    { id: 'quiz',  icon: '🎯', label: 'Quiz'  },
    { id: 'guide', icon: '📖', label: 'Guide' },
  ];

  return (
    <div style={{
      background: BG, minHeight: '100vh', color: TEXT0,
      fontFamily: "'Segoe UI',system-ui,sans-serif",
      maxWidth: '100vw', overflowX: 'hidden', paddingBottom: 80,
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${BG3}`,
        background: BG2, position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.1 }}>
          🎸 <span style={{ color: GOLD }}>L7</span> / <span style={{ color: TEAL }}>LL</span> Root Trainer
        </div>
        <div style={{ fontSize: 9, color: TEXT2, letterSpacing: 1, paddingLeft: 22, marginTop: 1 }}>
          DIATONIC CHORD ROOT PATTERNS
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', background: BG2, borderBottom: `1px solid ${BG3}`,
        position: 'sticky', top: 44, zIndex: 99,
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '10px 4px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase',
            color: tab === t.id ? GOLD : TEXT2,
            borderBottom: `2px solid ${tab === t.id ? GOLD : 'transparent'}`,
            minHeight: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            fontFamily: "'Segoe UI',system-ui,sans-serif",
          }}>
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {tab === 'learn' && renderLearn()}
        {tab === 'quiz'  && renderQuiz()}
        {tab === 'guide' && renderGuide()}
      </div>
    </div>
  );
}
