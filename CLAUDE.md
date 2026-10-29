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

## Theory — hand-entered, checked by `npm run verify`
The 5 shapes are hardcoded objects: `SHAPE_MAJOR_L7`, `SHAPE_MAJOR_LL`,
`SHAPE_MINOR_L7`, `SHAPE_MINOR_LL`, `SHAPE_JIMMY_T`. Each lists dots as
`{ d, si, fo }` — degree index (`d`: 0–6), string index (`si`: 0 = low E,
1 = A, …), fret offset from the root (`fo`). Chord qualities come from
`MAJ_QUALITY`/`MIN_QUALITY` lookup tables keyed by diatonic degree, with
`OPEN_MIDI` used to compute each shape's actual root fret for a given key.
**Always place a shape with `shapeRootFret(key, shape)`**, not `getRootFret`:
shapes reach up to five frets behind their root, so in the low keys some dots
used to fall below the nut and were simply not drawn (B♭ minor's L7 kept two
of its seven, and the quiz could ask about a dot that was not on screen).
`shapeRootFret` moves those keys up an octave.

Both boards (`Fretboard` for Learn/Quiz, `PracticeFretboard`) draw a note at
fret f in the space between wires f−1 and f — under its printed fret number —
with `startFret` as the wire at the left edge (the nut when 0) and an open
string just left of the nut. Until October 2026 every dot sat one space to the
right of its number, so the whole board read a fret high (C on the low E,
fret 8, sat under "9") while the tips said "fret 6" for B♭.
Chord **note names** come from `degreeNote(keyIdx, degIdx, isMinor)`, which
picks the right semitone table — `DIATONIC_ST` (major `[0,2,4,5,7,9,11]`) or
`MIN_ST` (natural minor `[0,2,3,5,7,8,10]`). Minor shapes **must** use
`MIN_ST`: the major table put the b3/b6/b7 roots a half-step too high (e.g.
A-minor bVII printed "Ab" where the dot is really G). Verified by re-deriving
every dot's pitch from `OPEN_MIDI` + fret across all shapes × keys.

**`npm run verify`** (`scripts/verify.mjs`) lifts the shapes, the
progressions and the pure helpers out of `App.jsx` by name and checks them
against the scales typed out again in the script — never against the app's
own tables. It covers: both scales and the seven triad qualities of each
(derived by stacking thirds); every dot's pitch in all 12 keys with nothing
behind the nut; red = major chords and teal = minor in every shape (the root
may sit in both — Major L7's teal L starts at it); and every progression
chord's printed name and drawn root, in all 12 keys and every recommended
shape. Run it before and after touching a shape, a table or a progression.

## Progressions library
`PRACTICE_PROGS` — 23 curated progressions across 6 genres (Jazz: ii–V–I,
turnarounds, Rhythm Changes; Blues: 12-bar, minor blues; Rock & Pop: I–V–vi–IV,
Andalusian cadence; plus Gospel, Neo-Soul, Bossa Nova). Each entry links to
recommended shapes and a short teaching tip — this is what drives the
Practice tab's "feel" picker.

Each chord is `{ rn, d }`: the Roman numeral, and the diatonic degree whose dot
holds (or sits next to) its root. **The printed name comes from the numeral**
(`progChordName`), never from the degree — naming by degree printed VI7 as
"Am7", a minor key's V as "Em" and C major's bVII as "B°". Two chords have a
root no shape contains — bVII in a major key and So What's bii — so
`rootShift(rn, d)` gives the frets between the numeral's root and its dot,
and the Practice board draws those as their own **dashed** dot (the scale dot
they are filed under stays unlit). The shift is worked out from the numeral,
so the data cannot drift from it; verify.mjs keeps every shift within two
frets, so a chord filed under the wrong degree fails.

The tips and shape reasons are prose, so verify cannot read them. In October
2026 about fifteen had to be corrected, most because they gave one shape's
layout under the other's name: **in L7, vi is on str5 (+4) and ii on str6
(+2); in LL, vi is on str6 and ii on str5, both at −3.** Check a tip against
the shape's `dots` before changing it.

## Tabs
Order (left→right): **Guide · Learn · Practice · Quiz · Settings.**
- **Guide** 📖 — reference text: all 5 shapes explained, quality rules, and
  when to reach for L7 vs LL. (Leftmost.)
- **Learn** 🎸 — interactive fretboard explorer: choose key + shape, tap dots
  to highlight chords, with a chord-grid legend showing all 7 chords and
  their fret positions.
- **Practice** 🎼 — pick a progression "feel" (genre), get a random progression
  from `PRACTICE_PROGS` with its recommended shape(s) and teaching tip.
  Borrowed roots are dashed dots (see *Progressions library*).
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
miss resets to tomorrow); a card counts as learned at `reps ≥ 2`, and every
grade bumps `seen`, which sync uses to settle two devices' copies. Progress widgets on the
Quiz setup come from `srsStats` / `breakdown` / `forecastStacked`.
localStorage (`dc_` prefix): **`dc_srs`** (schedule by cardId), **`dc_qcfg`**
(quiz config). Export/import via the shared `ProgressBackup` in the **Settings
tab** (`prefix="dc_"`).

## Not built yet
- No multi-level roadmap (unlike Triad's `LEVELS`/`STAGES`) — the 35-card deck
  is scoped only by the shape picker. A level ladder is a possible fast-follow.

## Before shipping any change
- `npm run verify` and `npm run build` must pass.
