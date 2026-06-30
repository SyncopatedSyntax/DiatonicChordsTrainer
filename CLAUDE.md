# Diatonic Chord Trainer — project context

A single-file React PWA that teaches **named fretboard shapes** — L7, LL, and
Jimmy's T — for finding every diatonic chord's root across the whole neck.
Pick a key and a shape; the 7 diatonic degrees split into two visual
groupings (red = major-quality chords, teal = minor-quality, incl. vii°).
Tap dots to learn the mapping, or quiz yourself for fast root recall.
Sibling to ChordTrainer, MelodicMinorTrainer, AlteredTrainer, Circle of
Fifths, Triad Trainer in the **Fretworks** toolbox. Single dev + end user: Zak.

- Toolbox-wide conventions (git-dep workflow, multi-zone, single PWA,
  verify-in-prod, naming): `../CLAUDE.md`.

## Integration
- Single-file React (`App.jsx`, ~2300 lines) + `main.jsx` entry, Vite
  `base: '/diatonic/'`, served as a Vercel zone.
- Registered in `@fretworks/design` `tools.js`: `key:"diatonic"`,
  `name:"Diatonic Chord Trainer"`, `path:"/diatonic/"`, **accent red
  `#ff6b6b`**. Shared `AppHeader`/`TabBar` from `@fretworks/design`.
- PWA-ready: manifest, app icons, standalone-mode detection, install banner.
- No separate theory/data file — shapes and progressions are constants
  inside `App.jsx`.

## Theory — hand-entered, no automated verification yet
The 5 shapes are hardcoded objects: `SHAPE_MAJOR_L7`, `SHAPE_MAJOR_LL`,
`SHAPE_MINOR_L7`, `SHAPE_MINOR_LL`, `SHAPE_JIMMY_T`. Each lists dots as
`{ d, si, fo }` — degree index (`d`: 0–6), string index (`si`: 0 = low E,
1 = A, …), fret offset from the root (`fo`). Chord qualities come from
`MAJ_QUALITY`/`MIN_QUALITY` lookup tables keyed by diatonic degree, with
`DIATONIC_ST` (semitone offsets) and `OPEN_MIDI` used to compute each
shape's actual root fret for a given key.

**There's no `verify.mjs`** — shapes are hand-verified against diagrams via
inline code comments, not independently re-derived. Per the toolbox's
standard (exact correctness, not partial matches): before changing a shape
definition or a quality lookup, write a small Node script that re-derives
every dot's pitch class from first principles and checks it against what the
shape claims — the same pattern Altered Trainer and Circle of Fifths use.

## Progressions library
`PRACTICE_PROGS` — 32 curated progressions across 6 genres (Jazz: ii–V–I,
turnarounds, Rhythm Changes; Blues: 12-bar, minor blues; Rock & Pop: I–V–vi–IV,
Andalusian cadence; plus Gospel, Neo-Soul, Bossa Nova). Each entry links to
recommended shapes and a short teaching tip — this is what drives the
Practice tab's "feel" picker.

## Tabs
- **Learn** 🎸 — interactive fretboard explorer: choose key + shape, tap dots
  to highlight chords, with a chord-grid legend showing all 7 chords and
  their fret positions.
- **Practice** 🎼 — pick a progression "feel" (genre), get a random progression
  from `PRACTICE_PROGS` with its recommended shape(s) and teaching tip.
- **Quiz** 🎯 — timed single-choice quiz, configurable (shape, key mode:
  random/fixed/common, time limit, question count, hard mode). Answers are
  **two-part**: pick the degree number (1–7), then the chord quality
  (maj/min/dim). **Hard mode** strips every dot except the root and the
  target, forcing pure shape/fret memorisation. Tracks score + streak +
  best-streak for the session only — no cross-session history.
- **Guide** 📖 — reference text: all 5 shapes explained, quality rules, and
  when to reach for L7 vs LL.

## Not built yet
- No spaced repetition — this is an explorer + timed-quiz tool, not a drill
  scheduler (unlike Chord Trainer / Triad Trainer). If that changes, follow
  the toolbox's SM-2 pattern and a `dc_*` localStorage key prefix.
- No `verify.mjs` for the shape/quality data (see Theory above).

## Before shipping any change
- `npm run build` must pass.
- Any change to a shape definition or quality table: hand-check every dot's
  pitch class against the actual fretboard before shipping (see Theory).
