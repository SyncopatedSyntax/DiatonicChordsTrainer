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
`OPEN_MIDI` used to compute each shape's actual root fret for a given key.
Chord **note names** come from `degreeNote(keyIdx, degIdx, isMinor)`, which
picks the right semitone table — `DIATONIC_ST` (major `[0,2,4,5,7,9,11]`) or
`MIN_ST` (natural minor `[0,2,3,5,7,8,10]`). Minor shapes **must** use
`MIN_ST`: the major table put the b3/b6/b7 roots a half-step too high (e.g.
A-minor bVII printed "Ab" where the dot is really G). Verified by re-deriving
every dot's pitch from `OPEN_MIDI` + fret across all shapes × keys.

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
Order (left→right): **Guide · Learn · Practice · Quiz · Settings.**
- **Guide** 📖 — reference text: all 5 shapes explained, quality rules, and
  when to reach for L7 vs LL. (Leftmost.)
- **Learn** 🎸 — interactive fretboard explorer: choose key + shape, tap dots
  to highlight chords, with a chord-grid legend showing all 7 chords and
  their fret positions.
- **Practice** 🎼 — pick a progression "feel" (genre), get a random progression
  from `PRACTICE_PROGS` with its recommended shape(s) and teaching tip.
- **Quiz** 🎯 — **spaced-repetition (SM-2) drill.** A dot lights up; answer is
  **two-part** — degree number (1–7), then quality (maj/min/dim). Auto-graded;
  a correct answer needs both parts right. Cards are scheduled and reviewed:
  config controls first, then the start button, then the progress panel at the
  bottom — New/Learning/Mastered/Due chips, a weak-areas heatmap (toggle by
  **degree** or **shape**), and a 7-day forecast. Config (shape/key-mode/time/
  count/hard mode) applies to the review session. **Hard mode** strips every
  dot except root + target. See *Spaced repetition*.
- **Settings** ⚙️ — progress backup (export/import), a **Reset progress**
  button (two-tap confirm; clears `dc_srs` only, keeps quiz config), and a
  diagnostics/debug panel. (Rightmost. Replaced the old header "⬆⬇ Data" button.)

## Spaced repetition
Same SM-2 engine + storage pattern as Triad Trainer, in `App.jsx`. A **card is
one degree of one shape** (`cardId = "shapeId.degIdx"`, 5 shapes × 7 degrees =
35 cards); the key is randomised per rep, so every review transposes. `store`
helper + `updateSRS(card, correct)` (correct grows the interval 1→6→×ease; a
miss resets to tomorrow); `isLearned` = `reps ≥ 2`. Progress widgets on the
Quiz setup come from `srsStats` / `breakdown` / `forecastStacked`.
localStorage (`dc_` prefix): **`dc_srs`** (schedule by cardId), **`dc_qcfg`**
(quiz config). Export/import via the shared `ProgressBackup` in the **Settings
tab** (`prefix="dc_"`).

## Not built yet
- No multi-level roadmap (unlike Triad's `LEVELS`/`STAGES`) — the 35-card deck
  is scoped only by the shape picker. A level ladder is a possible fast-follow.
- No `verify.mjs` for the shape/quality data (see Theory above).

## Before shipping any change
- `npm run build` must pass.
- Any change to a shape definition or quality table: hand-check every dot's
  pitch class against the actual fretboard before shipping (see Theory).
