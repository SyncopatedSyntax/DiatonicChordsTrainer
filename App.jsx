import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";

const DC={
  'R':'#ff4757','3':'#ffd93d','b3':'#ff9f43','7':'#ff6b6b','b7':'#fdcb6e',
  '9':'#2ed573','13':'#00b894','6':'#1e9e77','#11':'#0fbcf9','5':'#778ca3',
  'b9':'#7c5cbf','#9':'#6c5ce7','b13':'#9b2335','b5':'#fd79a8','#5':'#a29bfe',
  'bb7':'#b2bec3','4':'#74b9ff','2':'#b2d9ff','11':'#81ecec',
};
const CATS={
  cowboy:{label:'Cowboy Chords',color:'#74b9ff'},
  triad:{label:'Movable Triads',color:'#ffd93d'},
  barre:{label:'Barre Chords',color:'#ff6b6b'},
  shell:{label:'Shell Chords',color:'#a29bfe'},
  drop2:{label:'Drop 2',color:'#4ecdc4'},
  drop3:{label:'Drop 3',color:'#e8a838'},
  drop24:{label:'Drop 2 & 4',color:'#00b894'},
  spread:{label:'Spread Voicings',color:'#fdcb6e'},
  quartal:{label:'Quartal',color:'#b8f0e6'},
  ext:{label:'Extensions',color:'#fd79a8'},
  altered:{label:'Altered',color:'#e17055'},
};
const NOTE_NAMES=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
const OPEN_MIDI=[40,45,50,55,59,64];

const CHORDS=[
  {id:'cC',name:'C Major',sym:'C',cat:'cowboy',voicings:[{label:'Open',str:[-1,3,2,0,1,0],deg:[null,'R','3','5','R','3'],sf:1}]},
  {id:'cG',name:'G Major',sym:'G',cat:'cowboy',voicings:[{label:'Open',str:[3,2,0,0,0,3],deg:['R','3','5','R','3','R'],sf:1}]},
  {id:'cD',name:'D Major',sym:'D',cat:'cowboy',voicings:[{label:'Open',str:[-1,-1,0,2,3,2],deg:[null,null,'R','5','R','3'],sf:1}]},
  {id:'cE',name:'E Major',sym:'E',cat:'cowboy',voicings:[{label:'Open',str:[0,2,2,1,0,0],deg:['R','5','R','3','5','R'],sf:1}]},
  {id:'cA',name:'A Major',sym:'A',cat:'cowboy',voicings:[{label:'Open',str:[-1,0,2,2,2,0],deg:[null,'R','5','R','3','5'],sf:1}]},
  {id:'cF',name:'F Major',sym:'F',cat:'cowboy',voicings:[{label:'1st pos barre',str:[1,3,3,2,1,1],deg:['R','5','R','3','5','R'],sf:1}]},
  {id:'cEm',name:'E Minor',sym:'Em',cat:'cowboy',voicings:[{label:'Open',str:[0,2,2,0,0,0],deg:['R','5','R','b3','5','R'],sf:1}]},
  {id:'cAm',name:'A Minor',sym:'Am',cat:'cowboy',voicings:[{label:'Open',str:[-1,0,2,2,1,0],deg:[null,'R','5','R','b3','5'],sf:1}]},
  {id:'cDm',name:'D Minor',sym:'Dm',cat:'cowboy',voicings:[{label:'Open',str:[-1,-1,0,2,3,1],deg:[null,null,'R','5','R','b3'],sf:1}]},
  {id:'cE7',name:'E7',sym:'E7',cat:'cowboy',voicings:[{label:'Open',str:[0,2,0,1,0,0],deg:['R','5','b7','3','5','R'],sf:1}]},
  {id:'cA7',name:'A7',sym:'A7',cat:'cowboy',voicings:[{label:'Open',str:[-1,0,2,0,2,0],deg:[null,'R','5','b7','3','5'],sf:1}]},
  {id:'cD7',name:'D7',sym:'D7',cat:'cowboy',voicings:[{label:'Open',str:[-1,-1,0,2,1,2],deg:[null,null,'R','5','b7','3'],sf:1}]},
  {id:'cG7',name:'G7',sym:'G7',cat:'cowboy',voicings:[{label:'Open',str:[3,2,0,0,0,1],deg:['R','3','5','R','3','b7'],sf:1}]},
  {id:'cC7',name:'C7',sym:'C7',cat:'cowboy',voicings:[{label:'Open',str:[-1,3,2,3,1,0],deg:[null,'R','3','b7','R','3'],sf:1}]},
  {id:'cB7',name:'B7',sym:'B7',cat:'cowboy',voicings:[{label:'Open',str:[-1,2,1,2,0,2],deg:[null,'R','3','b7','R','5'],sf:1}]},
  {id:'cEm7',name:'Em7',sym:'Em7',cat:'cowboy',voicings:[{label:'Open',str:[0,2,2,0,3,0],deg:['R','5','R','b3','b7','R'],sf:1}]},
  {id:'cAm7',name:'Am7',sym:'Am7',cat:'cowboy',voicings:[{label:'Open',str:[-1,0,2,0,1,0],deg:[null,'R','5','b7','b3','5'],sf:1}]},
  {id:'cDm7',name:'Dm7',sym:'Dm7',cat:'cowboy',voicings:[{label:'Open',str:[-1,-1,0,2,1,1],deg:[null,null,'R','5','b7','b3'],sf:1}]},
  {id:'cCmaj7',name:'Cmaj7',sym:'Cmaj7',cat:'cowboy',voicings:[{label:'Open',str:[-1,3,2,0,0,0],deg:[null,'R','3','5','7','3'],sf:1}]},
  {id:'cGmaj7',name:'Gmaj7',sym:'Gmaj7',cat:'cowboy',voicings:[{label:'Open',str:[3,2,0,0,0,2],deg:['R','3','5','R','3','7'],sf:1}]},
  {id:'cDmaj7',name:'Dmaj7',sym:'Dmaj7',cat:'cowboy',voicings:[{label:'Open',str:[-1,-1,0,2,2,2],deg:[null,null,'R','5','7','3'],sf:1}]},
  {id:'cAmaj7',name:'Amaj7',sym:'Amaj7',cat:'cowboy',voicings:[{label:'Open',str:[-1,0,2,1,2,0],deg:[null,'R','5','7','3','5'],sf:1}]},
  {id:'cFmaj7',name:'Fmaj7',sym:'Fmaj7',cat:'cowboy',voicings:[{label:'Open',str:[-1,3,3,2,1,0],deg:[null,'5','R','3','5','7'],sf:1}]},
  {id:'cDsus2',name:'Dsus2',sym:'Dsus2',cat:'cowboy',voicings:[{label:'Open',str:[-1,-1,0,2,3,0],deg:[null,null,'R','5','R','2'],sf:1}]},
  {id:'cDsus4',name:'Dsus4',sym:'Dsus4',cat:'cowboy',voicings:[{label:'Open',str:[-1,-1,0,2,3,3],deg:[null,null,'R','5','R','4'],sf:1}]},
  {id:'cAsus2',name:'Asus2',sym:'Asus2',cat:'cowboy',voicings:[{label:'Open',str:[-1,0,2,2,0,0],deg:[null,'R','5','R','2','5'],sf:1}]},
  {id:'cAsus4',name:'Asus4',sym:'Asus4',cat:'cowboy',voicings:[{label:'Open',str:[-1,0,2,2,3,0],deg:[null,'R','5','R','4','5'],sf:1}]},
  {id:'cEsus4',name:'Esus4',sym:'Esus4',cat:'cowboy',voicings:[{label:'Open',str:[0,2,2,2,0,0],deg:['R','5','R','4','5','R'],sf:1}]},
  {id:'cCadd9',name:'Cadd9',sym:'Cadd9',cat:'cowboy',voicings:[{label:'Open',str:[-1,3,2,0,3,0],deg:[null,'R','3','5','9','3'],sf:1}]},
  {id:'cGadd9',name:'Gadd9',sym:'Gadd9',cat:'cowboy',voicings:[{label:'Open',str:[3,2,0,2,0,3],deg:['R','3','5','9','3','R'],sf:1}]},
  {id:'cEm9',name:'Em9',sym:'Em9',cat:'cowboy',voicings:[{label:'Open',str:[0,2,2,0,3,2],deg:['R','5','R','b3','b7','9'],sf:1}]},
  {id:'cCmaj9',name:'Cmaj9',sym:'Cmaj9',cat:'cowboy',voicings:[{label:'Open x30000',str:[-1,3,0,0,0,0],deg:[null,'R','9','5','7','3'],sf:1}]},
  {id:'cDfsh',name:'D/F#',sym:'D/F#',cat:'cowboy',voicings:[{label:'Open 1st inv',str:[2,0,0,2,3,2],deg:['3','5','R','5','R','3'],sf:1}]},
  {id:'cGb',name:'G/B',sym:'G/B',cat:'cowboy',voicings:[{label:'Open 1st inv',str:[-1,2,0,0,3,3],deg:[null,'3','5','R','5','R'],sf:1}]},
  {id:'cE7s9',name:'E7#9',sym:'E7#9',cat:'cowboy',voicings:[{label:'Hendrix chord',str:[0,2,0,0,3,0],deg:['R','5','b7','b3','b7','R'],sf:1}]},
  {id:'tMr_dgb',name:'Major root pos',sym:'maj',cat:'triad',movable:true,voicings:[{label:'D-G-B R-3-5 · ex A@5fr',str:[-1,-1,7,6,5,-1],deg:[null,null,'R','3','5',null],sf:5}]},
  {id:'tM1_dgb',name:'Major 1st inv',sym:'maj/3',cat:'triad',movable:true,voicings:[{label:'D-G-B 3-5-R · ex D@4fr',str:[-1,-1,4,2,3,-1],deg:[null,null,'3','5','R',null],sf:2}]},
  {id:'tM2_dgb',name:'Major 2nd inv',sym:'maj/5',cat:'triad',movable:true,voicings:[{label:'D-G-B 5-R-3 · ex A@2fr',str:[-1,-1,2,2,2,-1],deg:[null,null,'5','R','3',null],sf:2}]},
  {id:'tmr_dgb',name:'Minor root pos',sym:'min',cat:'triad',movable:true,voicings:[{label:'D-G-B R-b3-5 · ex Am@5fr',str:[-1,-1,7,5,5,-1],deg:[null,null,'R','b3','5',null],sf:5}]},
  {id:'tm1_dgb',name:'Minor 1st inv',sym:'min/b3',cat:'triad',movable:true,voicings:[{label:'D-G-B b3-5-R · ex Em@4fr',str:[-1,-1,5,4,5,-1],deg:[null,null,'b3','5','R',null],sf:4}]},
  {id:'tm2_dgb',name:'Minor 2nd inv',sym:'min/5',cat:'triad',movable:true,voicings:[{label:'D-G-B 5-R-b3 · ex Am@1fr',str:[-1,-1,2,2,1,-1],deg:[null,null,'5','R','b3',null],sf:1}]},
  {id:'taug_dgb',name:'Augmented',sym:'aug',cat:'triad',movable:true,voicings:[{label:'D-G-B R-3-#5',str:[-1,-1,3,2,2,-1],deg:[null,null,'R','3','#5',null],sf:2}]},
  {id:'tdim_dgb',name:'Diminished',sym:'dim',cat:'triad',movable:true,voicings:[{label:'D-G-B R-b3-b5',str:[-1,-1,9,7,6,-1],deg:[null,null,'R','b3','b5',null],sf:6}]},
  {id:'tsus2_dgb',name:'Sus2',sym:'sus2',cat:'triad',movable:true,voicings:[{label:'D-G-B R-2-5',str:[-1,-1,5,2,3,-1],deg:[null,null,'R','2','5',null],sf:2}]},
  {id:'tsus4_dgb',name:'Sus4',sym:'sus4',cat:'triad',movable:true,voicings:[{label:'D-G-B R-4-5',str:[-1,-1,7,7,5,-1],deg:[null,null,'R','4','5',null],sf:5}]},
  {id:'tMr_gbe',name:'Major root pos',sym:'maj',cat:'triad',movable:true,voicings:[{label:'G-B-e R-3-5 · ex C@3fr',str:[-1,-1,-1,5,5,3],deg:[null,null,null,'R','3','5'],sf:3}]},
  {id:'tM1_gbe',name:'Major 1st inv',sym:'maj/3',cat:'triad',movable:true,voicings:[{label:'G-B-e 3-5-R · ex G@3fr',str:[-1,-1,-1,4,3,3],deg:[null,null,null,'3','5','R'],sf:3}]},
  {id:'tM2_gbe',name:'Major 2nd inv',sym:'maj/5',cat:'triad',movable:true,voicings:[{label:'G-B-e 5-R-3 · ex F@5fr',str:[-1,-1,-1,5,6,5],deg:[null,null,null,'5','R','3'],sf:5}]},
  {id:'tmr_gbe',name:'Minor root pos',sym:'min',cat:'triad',movable:true,voicings:[{label:'G-B-e R-b3-5 · ex Bm@2fr',str:[-1,-1,-1,4,3,2],deg:[null,null,null,'R','b3','5'],sf:2}]},
  {id:'tm1_gbe',name:'Minor 1st inv',sym:'min/b3',cat:'triad',movable:true,voicings:[{label:'G-B-e b3-5-R · ex Am@5fr',str:[-1,-1,-1,5,5,5],deg:[null,null,null,'b3','5','R'],sf:5}]},
  {id:'tm2_gbe',name:'Minor 2nd inv',sym:'min/5',cat:'triad',movable:true,voicings:[{label:'G-B-e 5-R-b3 · ex Em@3fr',str:[-1,-1,-1,4,5,3],deg:[null,null,null,'5','R','b3'],sf:3}]},
  {id:'taug_gbe',name:'Augmented',sym:'aug',cat:'triad',movable:true,voicings:[{label:'G-B-e R-3-#5',str:[-1,-1,-1,5,5,4],deg:[null,null,null,'R','3','#5'],sf:4}]},
  {id:'tdim_gbe',name:'Diminished',sym:'dim',cat:'triad',movable:true,voicings:[{label:'G-B-e R-b3-b5',str:[-1,-1,-1,4,3,1],deg:[null,null,null,'R','b3','b5'],sf:1}]},
  {id:'tsus2_gbe',name:'Sus2',sym:'sus2',cat:'triad',movable:true,voicings:[{label:'G-B-e R-2-5',str:[-1,-1,-1,5,3,3],deg:[null,null,null,'R','2','5'],sf:3}]},
  {id:'tsus4_gbe',name:'Sus4',sym:'sus4',cat:'triad',movable:true,voicings:[{label:'G-B-e R-4-5',str:[-1,-1,-1,5,6,3],deg:[null,null,null,'R','4','5'],sf:3}]},
  // ── E-A-D string set (str indices 0-1-2) ─────────────────────────────────
  // Pitches: E2=40  A2=45  D3=50. All movable — no open strings.
  // ex A root: E fret5=45=A(R), A fret4=49=C#(3), D fret2=52=E(5)
  {id:'tMr_ead',  name:'Major root pos', sym:'maj',   cat:'triad',movable:true,voicings:[{label:'E-A-D R-3-5 · ex A@5fr',    str:[5,4,2,-1,-1,-1],deg:['R','3','5',null,null,null],    sf:2}]},
  {id:'tM1_ead',  name:'Major 1st inv',  sym:'maj/3', cat:'triad',movable:true,voicings:[{label:'E-A-D 3-5-R · ex Gmaj/B@5fr', str:[7,5,5,-1,-1,-1],deg:['3','5','R',null,null,null],    sf:5}]},
  {id:'tM2_ead',  name:'Major 2nd inv',  sym:'maj/5', cat:'triad',movable:true,voicings:[{label:'E-A-D 5-R-3 · ex Cmaj/G@2fr', str:[3,3,2,-1,-1,-1],deg:['5','R','3',null,null,null],    sf:2}]},
  {id:'tmr_ead',  name:'Minor root pos', sym:'min',   cat:'triad',movable:true,voicings:[{label:'E-A-D R-b3-5 · ex Am@5fr',   str:[5,3,2,-1,-1,-1],deg:['R','b3','5',null,null,null],   sf:2}]},
  {id:'tm1_ead',  name:'Minor 1st inv',  sym:'min/b3',cat:'triad',movable:true,voicings:[{label:'E-A-D b3-5-R · ex Gm/Bb@5fr', str:[6,5,5,-1,-1,-1],deg:['b3','5','R',null,null,null],   sf:5}]},
  {id:'tm2_ead',  name:'Minor 2nd inv',  sym:'min/5', cat:'triad',movable:true,voicings:[{label:'E-A-D 5-R-b3 · ex Cm/G@1fr',  str:[3,3,1,-1,-1,-1],deg:['5','R','b3',null,null,null],   sf:1}]},
  {id:'taug_ead', name:'Augmented',      sym:'aug',   cat:'triad',movable:true,voicings:[{label:'E-A-D R-3-#5 · ex A+@5fr',    str:[5,4,3,-1,-1,-1],deg:['R','3','#5',null,null,null],   sf:3}]},
  {id:'tdim_ead', name:'Diminished',     sym:'dim',   cat:'triad',movable:true,voicings:[{label:'E-A-D R-b3-b5 · ex A°@5fr',   str:[5,3,1,-1,-1,-1],deg:['R','b3','b5',null,null,null],  sf:1}]},
  {id:'tsus2_ead',name:'Sus2',           sym:'sus2',  cat:'triad',movable:true,voicings:[{label:'E-A-D R-2-5 · ex Asus2@5fr',  str:[5,2,2,-1,-1,-1],deg:['R','2','5',null,null,null],    sf:2}]},
  {id:'tsus4_ead',name:'Sus4',           sym:'sus4',  cat:'triad',movable:true,voicings:[{label:'E-A-D R-4-5 · ex Asus4@5fr',  str:[5,5,2,-1,-1,-1],deg:['R','4','5',null,null,null],    sf:2}]},
  // ── A-D-G string set (str indices 1-2-3) ─────────────────────────────────
  // Pitches: A2=45  D3=50  G3=55. All movable — no open strings.
  // ex D root: A fret5=50=D(R), D fret4=54=F#(3), G fret2=57=A(5)
  {id:'tMr_adg',  name:'Major root pos', sym:'maj',   cat:'triad',movable:true,voicings:[{label:'A-D-G R-3-5 · ex D@5fr',      str:[-1,5,4,2,-1,-1],deg:[null,'R','3','5',null,null],    sf:2}]},
  {id:'tM1_adg',  name:'Major 1st inv',  sym:'maj/3', cat:'triad',movable:true,voicings:[{label:'A-D-G 3-5-R · ex Cmaj/E@5fr', str:[-1,7,5,5,-1,-1],deg:[null,'3','5','R',null,null],    sf:5}]},
  {id:'tM2_adg',  name:'Major 2nd inv',  sym:'maj/5', cat:'triad',movable:true,voicings:[{label:'A-D-G 5-R-3 · ex Fmaj/C@2fr', str:[-1,3,3,2,-1,-1],deg:[null,'5','R','3',null,null],    sf:2}]},
  {id:'tmr_adg',  name:'Minor root pos', sym:'min',   cat:'triad',movable:true,voicings:[{label:'A-D-G R-b3-5 · ex Dm@5fr',    str:[-1,5,3,2,-1,-1],deg:[null,'R','b3','5',null,null],   sf:2}]},
  {id:'tm1_adg',  name:'Minor 1st inv',  sym:'min/b3',cat:'triad',movable:true,voicings:[{label:'A-D-G b3-5-R · ex Cm/Eb@5fr', str:[-1,6,5,5,-1,-1],deg:[null,'b3','5','R',null,null],   sf:5}]},
  {id:'tm2_adg',  name:'Minor 2nd inv',  sym:'min/5', cat:'triad',movable:true,voicings:[{label:'A-D-G 5-R-b3 · ex Am/E@5fr',  str:[-1,7,7,5,-1,-1],deg:[null,'5','R','b3',null,null],   sf:5}]},
  {id:'taug_adg', name:'Augmented',      sym:'aug',   cat:'triad',movable:true,voicings:[{label:'A-D-G R-3-#5 · ex D+@5fr',    str:[-1,5,4,3,-1,-1],deg:[null,'R','3','#5',null,null],   sf:3}]},
  {id:'tdim_adg', name:'Diminished',     sym:'dim',   cat:'triad',movable:true,voicings:[{label:'A-D-G R-b3-b5 · ex D°@5fr',   str:[-1,5,3,1,-1,-1],deg:[null,'R','b3','b5',null,null],  sf:1}]},
  {id:'tsus2_adg',name:'Sus2',           sym:'sus2',  cat:'triad',movable:true,voicings:[{label:'A-D-G R-2-5 · ex Dsus2@5fr',  str:[-1,5,2,2,-1,-1],deg:[null,'R','2','5',null,null],    sf:2}]},
  {id:'tsus4_adg',name:'Sus4',           sym:'sus4',  cat:'triad',movable:true,voicings:[{label:'A-D-G R-4-5 · ex Dsus4@5fr',  str:[-1,5,5,2,-1,-1],deg:[null,'R','4','5',null,null],    sf:2}]},
  {id:'bEMaj',name:'Maj E-shape',sym:'maj',cat:'barre',movable:true,voicings:[{label:'6th-str root · ex A@5fr',str:[5,7,7,6,5,5],deg:['R','5','R','3','5','R'],sf:5}]},
  {id:'bEMin',name:'Min E-shape',sym:'min',cat:'barre',movable:true,voicings:[{label:'6th-str root · ex Am@5fr',str:[5,7,7,5,5,5],deg:['R','5','R','b3','5','R'],sf:5}]},
  {id:'bE7',name:'Dom7 E-shape',sym:'7',cat:'barre',movable:true,voicings:[{label:'6th-str root · ex A7@5fr',str:[5,7,5,6,5,5],deg:['R','5','b7','3','5','R'],sf:5}]},
  {id:'bEMaj7',name:'Maj7 E-shape',sym:'maj7',cat:'barre',movable:true,voicings:[{label:'6th-str root · ex Amaj7@5fr',str:[5,7,6,6,5,5],deg:['R','5','7','3','5','R'],sf:5}]},
  {id:'bESus4',name:'Sus4 E-shape',sym:'sus4',cat:'barre',movable:true,voicings:[{label:'6th-str root · ex Asus4@5fr',str:[5,7,7,7,5,5],deg:['R','5','R','4','5','R'],sf:5}]},
  {id:'bAMaj',name:'Maj A-shape',sym:'maj',cat:'barre',movable:true,voicings:[{label:'5th-str root · ex D@5fr',str:[-1,5,7,7,7,5],deg:[null,'R','5','R','3','5'],sf:5}]},
  {id:'bAMin',name:'Min A-shape',sym:'min',cat:'barre',movable:true,voicings:[{label:'5th-str root · ex Dm@5fr',str:[-1,5,7,7,6,5],deg:[null,'R','5','R','b3','5'],sf:5}]},
  {id:'bA7',name:'Dom7 A-shape',sym:'7',cat:'barre',movable:true,voicings:[{label:'5th-str root · ex D7@5fr',str:[-1,5,7,5,7,5],deg:[null,'R','5','b7','3','5'],sf:5}]},
  {id:'bAMaj7',name:'Maj7 A-shape',sym:'maj7',cat:'barre',movable:true,voicings:[{label:'5th-str root · ex Dmaj7@5fr',str:[-1,5,7,6,7,5],deg:[null,'R','5','7','3','5'],sf:5}]},
  {id:'bASus4',name:'Sus4 A-shape',sym:'sus4',cat:'barre',movable:true,voicings:[{label:'5th-str root · ex Dsus4@5fr',str:[-1,5,7,7,8,5],deg:[null,'R','5','R','4','5'],sf:5}]},
  {id:'sh7_6',name:'Dom7 Shell 6th',sym:'7',cat:'shell',movable:true,voicings:[{label:'6-4-3 R-b7-3 · ex G7',str:[3,-1,3,4,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}]},
  {id:'sh7_5',name:'Dom7 Shell 5th',sym:'7',cat:'shell',movable:true,voicings:[{label:'5-4-3 R-3-b7 · ex D7',str:[-1,5,4,5,-1,-1],deg:[null,'R','3','b7',null,null],sf:4}]},
  {id:'shMaj7_6',name:'Maj7 Shell 6th',sym:'Δ',cat:'shell',movable:true,voicings:[{label:'6-4-3 R-7-3 · ex Gmaj7',str:[3,-1,4,4,-1,-1],deg:['R',null,'7','3',null,null],sf:1}]},
  {id:'shMaj7_5',name:'Maj7 Shell 5th',sym:'Δ',cat:'shell',movable:true,voicings:[{label:'5-4-3 R-3-7 · ex Cmaj7',str:[-1,3,2,4,-1,-1],deg:[null,'R','3','7',null,null],sf:1}]},
  {id:'shm7_6',name:'Min7 Shell 6th',sym:'m7',cat:'shell',movable:true,voicings:[{label:'6-4-3 R-b7-b3 · ex Am7',str:[5,-1,5,5,-1,-1],deg:['R',null,'b7','b3',null,null],sf:5}]},
  {id:'shm7_5',name:'Min7 Shell 5th',sym:'m7',cat:'shell',movable:true,voicings:[{label:'5-4-3 R-b3-b7 · ex Cm7',str:[-1,3,1,3,-1,-1],deg:[null,'R','b3','b7',null,null],sf:1}]},
  {id:'shdim7',   name:'Dim7 Shell',        sym:'°7', cat:'shell',movable:true,voicings:[{label:'5-4-3 R-b5-bb7 · ex Cdim7@2fr',str:[-1,3,4,2,-1,-1],deg:[null,'R','b5','bb7',null,null],sf:2}]},
  {id:'shm7b5',   name:'Half-dim Shell',    sym:'ø',  cat:'shell',movable:true,voicings:[{label:'5-4-3 R-b5-b7 · ex Cø@3fr',  str:[-1,3,4,3,-1,-1],deg:[null,'R','b5','b7',null,null],sf:3}]},
  {id:'d2maj7_6',name:'Maj7 Drop2',sym:'Δ',cat:'drop2',movable:true,voicings:[{label:'6543 5-R-3-7',str:[3,3,2,4,-1,-1],deg:['5','R','3','7',null,null],sf:2}]},
  {id:'d2dom7_6',name:'Dom7 Drop2',sym:'7',cat:'drop2',movable:true,voicings:[{label:'6543 5-R-3-b7',str:[3,3,2,3,-1,-1],deg:['5','R','3','b7',null,null],sf:2}]},
  {id:'d2min7_6',name:'Min7 Drop2',sym:'m7',cat:'drop2',movable:true,voicings:[{label:'6543 5-R-b3-b7',str:[3,3,1,3,-1,-1],deg:['5','R','b3','b7',null,null],sf:1}]},
  {id:'d2m7b5_6',name:'m7b5 Drop2',sym:'ø',cat:'drop2',movable:true,voicings:[{label:'6543 b5-R-b3-b7',str:[2,3,1,3,-1,-1],deg:['b5','R','b3','b7',null,null],sf:1}]},
  {id:'d2maj7_5',name:'Maj7 Drop2',sym:'Δ',cat:'drop2',movable:true,voicings:[{label:'5432 5-R-3-7 · ex Gmaj7',str:[-1,5,5,4,7,-1],deg:[null,'5','R','3','7',null],sf:4}]},
  {id:'d2dom7_5',name:'Dom7 Drop2',sym:'7',cat:'drop2',movable:true,voicings:[{label:'5432 5-R-3-b7 · ex G7',str:[-1,5,5,4,6,-1],deg:[null,'5','R','3','b7',null],sf:4}]},
  {id:'d2min7_5',name:'Min7 Drop2',sym:'m7',cat:'drop2',movable:true,voicings:[{label:'5432 5-R-b3-b7 · ex Gm7',str:[-1,5,5,3,6,-1],deg:[null,'5','R','b3','b7',null],sf:3}]},
  {id:'d2m7b5_5',name:'m7b5 Drop2',sym:'ø',cat:'drop2',movable:true,voicings:[{label:'5432 b5-R-b3-b7',str:[-1,4,5,3,6,-1],deg:[null,'b5','R','b3','b7',null],sf:3}]},
  {id:'d2dim7_5',name:'Dim7 Drop2',sym:'°7',cat:'drop2',movable:true,voicings:[{label:'5432 R-b5-bb7-b3',str:[-1,2,3,1,3,-1],deg:[null,'R','b5','bb7','b3',null],sf:1}]},
  {id:'d2maj7_4',name:'Maj7 Drop2',sym:'Δ',cat:'drop2',movable:true,voicings:[{label:'4321 5-R-3-7',str:[-1,-1,5,5,5,7],deg:[null,null,'5','R','3','7'],sf:5}]},
  {id:'d2dom7_4',name:'Dom7 Drop2',sym:'7',cat:'drop2',movable:true,voicings:[{label:'4321 5-R-3-b7',str:[-1,-1,5,5,5,6],deg:[null,null,'5','R','3','b7'],sf:5}]},
  {id:'d2min7_4',name:'Min7 Drop2',sym:'m7',cat:'drop2',movable:true,voicings:[{label:'4321 5-R-b3-b7',str:[-1,-1,5,5,4,6],deg:[null,null,'5','R','b3','b7'],sf:4}]},
  {id:'d2m7b5_4',name:'m7b5 Drop2',sym:'ø',cat:'drop2',movable:true,voicings:[{label:'4321 b5-R-b3-b7',str:[-1,-1,4,5,4,6],deg:[null,null,'b5','R','b3','b7'],sf:4}]},
  {id:'d24maj7',name:'Maj7 Drop2&4',sym:'Δ',cat:'drop24',movable:true,voicings:[{label:'6-4-3-2 R-7-3-5',str:[5,-1,6,6,5,-1],deg:['R',null,'7','3','5',null],sf:5}]},
  {id:'d24dom7',name:'Dom7 Drop2&4',sym:'7',cat:'drop24',movable:true,voicings:[{label:'6-4-3-2 R-b7-3-5',str:[5,-1,5,6,5,-1],deg:['R',null,'b7','3','5',null],sf:5}]},
  {id:'d24min7',name:'Min7 Drop2&4',sym:'m7',cat:'drop24',movable:true,voicings:[{label:'6-4-3-2 R-b7-b3-5',str:[5,-1,5,5,5,-1],deg:['R',null,'b7','b3','5',null],sf:5}]},
  {id:'d24m7b5',name:'m7b5 Drop2&4',sym:'ø',cat:'drop24',movable:true,voicings:[{label:'6-4-3-2 R-b7-b3-b5',str:[5,-1,5,5,4,-1],deg:['R',null,'b7','b3','b5',null],sf:4}]},
  {id:'d24maj6',name:'Maj6 Drop2&4',sym:'6',cat:'drop24',movable:true,voicings:[{label:'6-4-3-2 R-6-3-5',str:[5,-1,4,6,5,-1],deg:['R',null,'6','3','5',null],sf:4}]},
  {id:'d247sus4',name:'7sus4 Drop2&4',sym:'7sus4',cat:'drop24',movable:true,voicings:[{label:'6-4-3-2 R-b7-4-5',str:[3,-1,3,5,3,-1],deg:['R',null,'b7','4','5',null],sf:1}]},
  {id:'dom9',name:'Dom 9',sym:'9',cat:'ext',movable:true,voicings:[{label:'6543 R-3-b7-9 · ex G9',str:[3,2,3,2,-1,-1],deg:['R','3','b7','9',null,null],sf:1}]},
  {id:'maj9',name:'Maj 9',sym:'maj9',cat:'ext',movable:true,voicings:[{label:'6543 R-3-7-9 · ex Gmaj9',str:[3,2,4,2,-1,-1],deg:['R','3','7','9',null,null],sf:1}]},
  {id:'min9',name:'Min 9',sym:'m9',cat:'ext',movable:true,voicings:[{label:'6543 R-b3-b7-9 · ex Gm9',str:[3,1,3,2,-1,-1],deg:['R','b3','b7','9',null,null],sf:1}]},
  {id:'dom13',name:'Dom 13',sym:'13',cat:'ext',movable:true,voicings:[{label:'6-5-4-2 R-3-b7-13',str:[3,2,3,-1,5,-1],deg:['R','3','b7',null,'13',null],sf:2}]},
  {id:'maj7s11',name:'Maj7 #11',sym:'Δ#11',cat:'ext',movable:true,voicings:[{label:'6543 R-3-7-#11 Lydian',str:[3,2,4,6,-1,-1],deg:['R','3','7','#11',null,null],sf:2}]},
  {id:'maj6',name:'Major 6',sym:'6',cat:'ext',movable:true,voicings:[{label:'6-4-3-2 R-6-3-5',str:[3,-1,2,4,3,-1],deg:['R',null,'6','3','5',null],sf:1}]},
  {id:'min6',name:'Minor 6',sym:'m6',cat:'ext',movable:true,voicings:[{label:'6-4-3-2 R-6-b3-5',str:[5,-1,4,5,5,-1],deg:['R',null,'6','b3','5',null],sf:4}]},
  {id:'dom69',name:'6/9 Chord',sym:'6/9',cat:'ext',movable:true,voicings:[{label:'6543 R-3-6-9',str:[3,2,2,2,-1,-1],deg:['R','3','6','9',null,null],sf:2}]},
  {id:'dom11',name:'Dom 11',sym:'11',cat:'ext',movable:true,voicings:[{label:'6-4-3-2 R-b7-9-11',str:[3,-1,3,2,1,-1],deg:['R',null,'b7','9','11',null],sf:1}]},
  {id:'dom7sus4',name:'Dom7 Sus4',sym:'7sus4',cat:'ext',movable:true,voicings:[{label:'6-5-4-3 R-5-b7-4',str:[3,5,3,5,-1,-1],deg:['R','5','b7','4',null,null],sf:3}]},
  {id:'dom7b9',name:'Dom 7b9',sym:'7b9',cat:'altered',movable:true,voicings:[{label:'6543 R-3-b7-b9 · ex G7b9',str:[3,2,3,1,-1,-1],deg:['R','3','b7','b9',null,null],sf:1}]},
  {id:'dom7s9',name:'Dom 7#9',sym:'7#9',cat:'altered',movable:true,voicings:[{label:'6543 R-3-b7-#9 Hendrix',str:[3,2,3,3,-1,-1],deg:['R','3','b7','#9',null,null],sf:1}]},
  {id:'dom7s11',name:'Dom 7#11',sym:'7#11',cat:'altered',movable:true,voicings:[{label:'6543 R-3-b7-#11',str:[3,2,3,6,-1,-1],deg:['R','3','b7','#11',null,null],sf:1}]},
  {id:'dom7b13',name:'Dom 7b13',sym:'7b13',cat:'altered',movable:true,voicings:[{label:'6543 R-3-b7-b13',str:[3,2,3,4,-1,-1],deg:['R','3','b7','b13',null,null],sf:1}]},
  {id:'m7b5',name:'Half-dim m7b5',sym:'ø',cat:'altered',movable:true,voicings:[{label:'6543 R-b3-b5-b7 · ex Bø',str:[7,5,3,2,-1,-1],deg:['R','b3','b5','b7',null,null],sf:2}]},
  {id:'dim7',name:'Dim7 Full',sym:'°7',cat:'altered',movable:true,voicings:[{label:'5432 R-b5-bb7-b3',str:[-1,2,3,1,3,-1],deg:[null,'R','b5','bb7','b3',null],sf:1}]},
  // ── COWBOY / OPEN additions ────────────────────────────────────────────
  // Power chords (5th chords) — rock/metal essential
  // E5: E0=E(R), A2=B(5), D2=E(R)
  {id:'cE5',name:'E5',sym:'E5',cat:'cowboy',voicings:[{label:'Power chord',str:[0,2,2,-1,-1,-1],deg:['R','5','R',null,null,null],sf:1}]},
  // A5: A0=A(R), D2=E(5), G2=A(R)
  {id:'cA5',name:'A5',sym:'A5',cat:'cowboy',voicings:[{label:'Power chord',str:[-1,0,2,2,-1,-1],deg:[null,'R','5','R',null,null],sf:1}]},
  // D5: D0=D(R), G2=A(5): 55+2=57=A✓, B3=D(R): 59+3=62=D✓
  {id:'cD5',name:'D5',sym:'D5',cat:'cowboy',voicings:[{label:'Power chord',str:[-1,-1,0,2,3,-1],deg:[null,null,'R','5','R',null],sf:1}]},
  // Open B minor — A2=B(R): 47, D4=F#(5): 54, G4=B(R): 59, B3=D(b3): 62, e2=F#(5): 66
  {id:'cBm',name:'B Minor',sym:'Bm',cat:'cowboy',voicings:[{label:'Open',str:[-1,2,4,4,3,2],deg:[null,'R','5','R','b3','5'],sf:2}]},
  // Am(maj7) open: A0=A(R), D2=E(5): 52, G1=G#(7): 56, B1=C(b3): 60, e0=E(5)
  {id:'cAmMaj7',name:'Am(maj7)',sym:'Am(Δ)',cat:'cowboy',voicings:[{label:'Open',str:[-1,0,2,1,1,0],deg:[null,'R','5','7','b3','5'],sf:1}]},
  // Am6 open: A0=A(R), D2=E(5): 52, G2=A(R): 57, B1=C(b3): 60, e2=F#(6): 66
  {id:'cAm6',name:'Am6',sym:'Am6',cat:'cowboy',voicings:[{label:'Open',str:[-1,0,2,2,1,2],deg:[null,'R','5','R','b3','6'],sf:1}]},
  // ── BARRE additions ────────────────────────────────────────────────────
  // Min7 E-shape barre — ex Am7@5fr: E5=A(R), A7=E(5): 52, D7=A(R): 57, G5=C(b3): 60, B8=G(b7): 67, e5=A(R): 69
  {id:'bEMin7',name:'Min7 E-shape',sym:'m7',cat:'barre',movable:true,voicings:[{label:'6th-str root · ex Am7@5fr',str:[5,7,7,5,8,5],deg:['R','5','R','b3','b7','R'],sf:5}]},
  // Min7 A-shape barre — ex Dm7@5fr: A5=D(R), D7=A(5): 57, G5=C(b7): 60, B6=F(b3): 65, e5=A(5): 69
  {id:'bAMin7',name:'Min7 A-shape',sym:'m7',cat:'barre',movable:true,voicings:[{label:'5th-str root · ex Dm7@5fr',str:[-1,5,7,5,6,5],deg:[null,'R','5','b7','b3','5'],sf:5}]},
  // Dom9 A-shape barre — ex D9@5fr: A5=D(R), D7=A(5): 57, G5=C(b7): 60, B5=E(9): 64, e5=A(5): 69
  {id:'bA9',name:'Dom9 A-shape',sym:'9',cat:'barre',movable:true,voicings:[{label:'5th-str root · ex D9@5fr',str:[-1,5,7,5,5,5],deg:[null,'R','5','b7','9','5'],sf:5}]},
  // ── SHELL additions ────────────────────────────────────────────────────
  // min(maj7) shell 6th string: R-7-b3 on 6-4-3 — ex GmΔ7@1fr: E3=G(R), D4=F#(7): 54, G3=Bb(b3): 58
  {id:'shMinMaj7_6',name:'min(Δ7) Shell 6th',sym:'m(Δ)',cat:'shell',movable:true,voicings:[{label:'6-4-3 R-7-b3 · ex GmΔ@1fr',str:[3,-1,4,3,-1,-1],deg:['R',null,'7','b3',null,null],sf:1}]},
  // min(maj7) shell 5th string: R-b3-7 on 5-4-3 — ex CmΔ7@1fr: A3=C(R), D1=Eb(b3): 51, G4=B(7): 59
  {id:'shMinMaj7_5',name:'min(Δ7) Shell 5th',sym:'m(Δ)',cat:'shell',movable:true,voicings:[{label:'5-4-3 R-b3-7 · ex CmΔ@1fr',str:[-1,3,1,4,-1,-1],deg:[null,'R','b3','7',null,null],sf:1}]},
  // Maj6 shell 6th string: R-6-3 on 6-4-3 — ex G6@1fr: E3=G(R), D2=E(6): 52, G4=B(3): 59
  {id:'shMaj6_6',name:'Maj6 Shell 6th',sym:'6',cat:'shell',movable:true,voicings:[{label:'6-4-3 R-6-3 · ex G6@1fr',str:[3,-1,2,4,-1,-1],deg:['R',null,'6','3',null,null],sf:1}]},
  // Min6 shell 6th string: R-6-b3 on 6-4-3 — ex Am6@5fr: E5=A(R), D4=F#(6): 54, G5=C(b3): 60
  {id:'shMin6_6',name:'Min6 Shell 6th',sym:'m6',cat:'shell',movable:true,voicings:[{label:'6-4-3 R-6-b3 · ex Am6@5fr',str:[5,-1,4,5,-1,-1],deg:['R',null,'6','b3',null,null],sf:4}]},
  // ── DROP 2 additions ───────────────────────────────────────────────────
  // Dim7 Drop2 on 6543 — Cdim7: b5=F#(E2+2=42), R=C(A+3=48), b3=Eb(D+1=51), bb7=A(G+2=57)
  {id:'d2dim7_6',name:'Dim7 Drop2',sym:'°7',cat:'drop2',movable:true,voicings:[{label:'6543 b5-R-b3-bb7 · ex Cdim7',str:[2,3,1,2,-1,-1],deg:['b5','R','b3','bb7',null,null],sf:1}]},
  // Min6 Drop2 on 5432 — 5-R-b3-6: ex Gm6@3fr: A5=D(5), D5=G(R), G3=Bb(b3), B5=E(6)
  {id:'d2min6_5',name:'Min6 Drop2',sym:'m6',cat:'drop2',movable:true,voicings:[{label:'5432 5-R-b3-6 · ex Gm6@3fr',str:[-1,5,5,3,5,-1],deg:[null,'5','R','b3','6',null],sf:3}]},
  // Maj6 Drop2 on 5432 — 5-R-3-6: ex G6@4fr: A5=D(5), D5=G(R), G4=B(3), B5=E(6)
  {id:'d2maj6_5',name:'Maj6 Drop2',sym:'6',cat:'drop2',movable:true,voicings:[{label:'5432 5-R-3-6 · ex G6@4fr',str:[-1,5,5,4,5,-1],deg:[null,'5','R','3','6',null],sf:4}]},
  // min(Δ7) Drop2 on 5432 — 5-R-b3-7: ex GmΔ@3fr: A5=D(5), D5=G(R), G3=Bb(b3), B7=F#(7)
  {id:'d2minMaj7_5',name:'min(Δ7) Drop2',sym:'m(Δ)',cat:'drop2',movable:true,voicings:[{label:'5432 5-R-b3-7 · ex GmΔ@3fr',str:[-1,5,5,3,7,-1],deg:[null,'5','R','b3','7',null],sf:3}]},
  // ── DROP 3 — strings 6-5-3-2 (D string muted) ──────────────────────────
  // Drop 3: 3rd note from top of close voicing dropped an octave → spread voicing on non-adjacent strings.
  // All examples at G root (fret 3 on E string). String 4 (D) is always muted.
  // Gmaj7: E3=G(R), A5=D(5): 50, G4=B(3): 59, B7=F#(7): 66
  {id:'d3maj7_6',name:'Maj7 Drop3',sym:'Δ',cat:'drop3',movable:true,voicings:[{label:'6-5-3-2 R-5-3-7 · ex Gmaj7@3fr',str:[3,5,-1,4,7,-1],deg:['R','5',null,'3','7',null],sf:3}]},
  // G7: E3=G(R), A5=D(5): 50, G4=B(3): 59, B6=F(b7): 65
  {id:'d3dom7_6',name:'Dom7 Drop3',sym:'7',cat:'drop3',movable:true,voicings:[{label:'6-5-3-2 R-5-3-b7 · ex G7@3fr',str:[3,5,-1,4,6,-1],deg:['R','5',null,'3','b7',null],sf:3}]},
  // Gm7: E3=G(R), A5=D(5): 50, G3=Bb(b3): 58, B6=F(b7): 65
  {id:'d3min7_6',name:'Min7 Drop3',sym:'m7',cat:'drop3',movable:true,voicings:[{label:'6-5-3-2 R-5-b3-b7 · ex Gm7@3fr',str:[3,5,-1,3,6,-1],deg:['R','5',null,'b3','b7',null],sf:3}]},
  // Gø: E3=G(R), A4=Db(b5): 49, G3=Bb(b3): 58, B6=F(b7): 65
  {id:'d3m7b5_6',name:'m7b5 Drop3',sym:'ø',cat:'drop3',movable:true,voicings:[{label:'6-5-3-2 R-b5-b3-b7 · ex Gø@3fr',str:[3,4,-1,3,6,-1],deg:['R','b5',null,'b3','b7',null],sf:3}]},
  // Gdim7: E3=G(R), A4=Db(b5): 49, G3=Bb(b3): 58, B5=E(bb7): 64 [bb7 of G = E]
  {id:'d3dim7_6',name:'Dim7 Drop3',sym:'°7',cat:'drop3',movable:true,voicings:[{label:'6-5-3-2 R-b5-b3-bb7 · ex Gdim7@3fr',str:[3,4,-1,3,5,-1],deg:['R','b5',null,'b3','bb7',null],sf:3}]},
  // GmΔ7: E3=G(R), A5=D(5): 50, G3=Bb(b3): 58, B7=F#(7): 66
  {id:'d3minMaj7_6',name:'min(Δ7) Drop3',sym:'m(Δ)',cat:'drop3',movable:true,voicings:[{label:'6-5-3-2 R-5-b3-7 · ex GmΔ@3fr',str:[3,5,-1,3,7,-1],deg:['R','5',null,'b3','7',null],sf:3}]},
  // Drop 3 — strings 5-4-2-1 (G string muted) ─────────────────────────
  // All examples at C root (fret 3 on A string). String 3 (G) is always muted.
  // Cmaj7: A3=C(R), D5=G(5): 55, B5=E(3): 64, e7=B(7): 71
  {id:'d3maj7_5',name:'Maj7 Drop3',sym:'Δ',cat:'drop3',movable:true,voicings:[{label:'5-4-2-1 R-5-3-7 · ex Cmaj7@3fr',str:[-1,3,5,-1,5,7],deg:[null,'R','5',null,'3','7'],sf:3}]},
  // C7: A3=C(R), D5=G(5): 55, B5=E(3): 64, e6=Bb(b7): 70
  {id:'d3dom7_5',name:'Dom7 Drop3',sym:'7',cat:'drop3',movable:true,voicings:[{label:'5-4-2-1 R-5-3-b7 · ex C7@3fr',str:[-1,3,5,-1,5,6],deg:[null,'R','5',null,'3','b7'],sf:3}]},
  // Cm7: A3=C(R), D5=G(5): 55, B4=Eb(b3): 63, e6=Bb(b7): 70
  {id:'d3min7_5',name:'Min7 Drop3',sym:'m7',cat:'drop3',movable:true,voicings:[{label:'5-4-2-1 R-5-b3-b7 · ex Cm7@3fr',str:[-1,3,5,-1,4,6],deg:[null,'R','5',null,'b3','b7'],sf:3}]},
  // ── EXTENSION additions ────────────────────────────────────────────────
  // min(Δ7) full voicing 6543 — ex Am(Δ7)@5fr: E5=A(R), A3=C(b3): 48, D2=E(5): 52, G1=G#(7): 56
  {id:'minMaj7',name:'min(maj7)',sym:'m(Δ)',cat:'ext',movable:true,voicings:[{label:'6543 R-b3-5-7 · ex Am(Δ)@5fr',str:[5,3,2,1,-1,-1],deg:['R','b3','5','7',null,null],sf:1}]},
  // Dom7#5 (augmented dominant): E3=G(R), A6=D#(#5): 51, D3=F(b7): 53, G4=B(3): 59
  {id:'dom7s5',name:'Dom 7#5',sym:'7#5',cat:'ext',movable:true,voicings:[{label:'6543 R-#5-b7-3 · ex G7#5@3fr',str:[3,6,3,4,-1,-1],deg:['R','#5','b7','3',null,null],sf:3}]},
  // Dom7b5 (tritone colour): E3=G(R), A2=B(3): 47, D3=F(b7): 53, G6=Db(b5): 61
  {id:'dom7b5',name:'Dom 7b5',sym:'7b5',cat:'ext',movable:true,voicings:[{label:'6543 R-3-b7-b5 · ex G7b5@2fr',str:[3,2,3,6,-1,-1],deg:['R','3','b7','b5',null,null],sf:2}]},
  // Minor 11 (modal): E3=G(R), A1=Bb(b3): 46, D3=F(b7): 53, G5=C(11): 60
  {id:'min11',name:'Minor 11',sym:'m11',cat:'ext',movable:true,voicings:[{label:'6543 R-b3-b7-11 · ex Gm11@1fr',str:[3,1,3,5,-1,-1],deg:['R','b3','b7','11',null,null],sf:1}]},
  // Maj13: E3=G(R), A2=B(3): 47, D4=F#(7): 54, B5=E(13): 64 [13th of G=E]
  {id:'maj13',name:'Major 13',sym:'maj13',cat:'ext',movable:true,voicings:[{label:'6-5-4-2 R-3-7-13 · ex Gmaj13@2fr',str:[3,2,4,-1,5,-1],deg:['R','3','7',null,'13',null],sf:2}]},
  // ── ALTERED additions ──────────────────────────────────────────────────
  // 7alt (R-b7-#9-b13): fully altered dominant on 6-4-3-2
  // E3=G(R), D3=F(b7): 53, G3=Bb(#9): 58, B4=Eb(b13): 63 [b13 of G=Eb]
  {id:'dom7alt',name:'Dom 7alt',sym:'7alt',cat:'altered',movable:true,voicings:[{label:'6-4-3-2 R-b7-#9-b13 · ex G7alt@3fr',str:[3,-1,3,3,4,-1],deg:['R',null,'b7','#9','b13',null],sf:3}]},
  // 7#9#5 (super-altered): E3=G(R), A6=D#(#5): 51, D3=F(b7): 53, G3=Bb(#9): 58
  {id:'dom7s9s5',name:'Dom 7#9#5',sym:'7#9#5',cat:'altered',movable:true,voicings:[{label:'6543 R-#5-b7-#9 · ex G7#9#5@3fr',str:[3,6,3,3,-1,-1],deg:['R','#5','b7','#9',null,null],sf:3}]},
  // 7b9b13: E3=G(R), D3=F(b7): 53, G1=Ab(b9): 56, B4=Eb(b13): 63
  {id:'dom7b9b13',name:'Dom 7b9b13',sym:'7b9b13',cat:'altered',movable:true,voicings:[{label:'6-4-3-2 R-b7-b9-b13 · ex G7b9b13@1fr',str:[3,-1,3,1,4,-1],deg:['R',null,'b7','b9','b13',null],sf:1}]},

  // ── SPREAD VOICINGS ────────────────────────────────────────────────────
  // Open-voiced 7ths spanning more than an octave. Pianistic sound — common in jazz chord melody and solo guitar.
  // All examples at G root (fret 3 on low E). OPEN_MIDI=[40,45,50,55,59,64]
  // E fret 3=43=G(R), G fret 4=59=B(3), G fret 3=58=Bb(b3), B fret 7=66=F#(7), B fret 6=65=F(b7), e fret 7=71=B(3), e fret 6=70=Bb(b3)
  {id:'spMaj7',    name:'Spread Maj7',    sym:'Δ',   cat:'spread',movable:true,voicings:[{label:'6-3-2-1 R-3-7-3 · ex Gmaj7@3fr',  str:[3,-1,-1,4,7,7],  deg:['R',null,null,'3','7','3'],    sf:3}]},
  {id:'spDom7',    name:'Spread Dom7',    sym:'7',   cat:'spread',movable:true,voicings:[{label:'6-3-2-1 R-3-b7-3 · ex G7@3fr',    str:[3,-1,-1,4,6,7],  deg:['R',null,null,'3','b7','3'],  sf:3}]},
  {id:'spMin7',    name:'Spread Min7',    sym:'m7',  cat:'spread',movable:true,voicings:[{label:'6-3-2-1 R-b3-b7-b3 · ex Gm7@3fr', str:[3,-1,-1,3,6,6],  deg:['R',null,null,'b3','b7','b3'],sf:3}]},
  // Spread major triad: E3=G(R), D7=A(5): 57=A3=5th✓, e7=B(3): 71✓
  {id:'spMaj',     name:'Spread Major',   sym:'maj', cat:'spread',movable:true,voicings:[{label:'6-3-1 R-3-R · ex G@3fr',           str:[3,-1,-1,4,-1,3], deg:['R',null,null,'3',null,'R'],  sf:3}]},
  // Spread 6/9 (classic open jazz colour): E3=G(R), D2=E(6): 52=E3=6th✓, G2=A(9): 57=A3=9th✓, e7=B(3): 71✓
  {id:'sp69',      name:'Spread 6/9',     sym:'6/9', cat:'spread',movable:true,voicings:[{label:'6-4-3 R-6-9 · ex G6/9@2fr',     str:[3,-1,2,2,-1,-1],  deg:['R',null,'6','9',null,null],   sf:2}]},
  // Spread min(Δ7): E3=G(R), G3=Bb(b3): 58✓, B7=F#(7): 66✓
  {id:'spMinMaj7', name:'Spread min(Δ7)', sym:'m(Δ)',cat:'spread',movable:true,voicings:[{label:'6-3-2 R-b3-7 · ex GmΔ7@3fr',       str:[3,-1,-1,3,7,-1], deg:['R',null,null,'b3','7',null],  sf:3}]},
  // Spread m7b5: E3=G(R), G3=Bb(b3): 58✓, B6=F(b7): 65✓
  {id:'spHalfDim', name:'Spread m7b5',    sym:'ø',   cat:'spread',movable:true,voicings:[{label:'6-3-2 R-b3-b7 · ex Gø@3fr',        str:[3,-1,-1,3,6,-1], deg:['R',null,null,'b3','b7',null], sf:3}]},
  // Spread min6: E3=G(R), G3=Bb(b3): 58✓, B5=E(6): 64✓ (6th of Gm=E✓)
  {id:'spMin6',    name:'Spread Min6',    sym:'m6',  cat:'spread',movable:true,voicings:[{label:'6-3-2 R-b3-6 · ex Gm6@3fr',        str:[3,-1,-1,3,5,-1], deg:['R',null,null,'b3','6',null],  sf:3}]},

  // ── COWBOY / OPEN additions ─────────────────────────────────────────────
  // G sus4 open: E3=G(R)✓, A3=C(4): 48✓, D0=D(5): 50✓, G0=G(R): 55✓, B1=C(4): 60✓, e3=G(R): 67✓
  {id:'cGsus4',    name:'G Sus4',         sym:'Gsus4',cat:'cowboy',voicings:[{label:'Open',str:[3,3,0,0,1,3],deg:['R','4','5','R','4','R'],sf:1}]},
  // C sus2 open: A3=C(R)✓, D0=D(2): 50✓, G0=G(5): 55✓, B3=D(2): 62✓, e3=G(5): 67✓
  {id:'cCsus2',    name:'Csus2',          sym:'Csus2',cat:'cowboy',voicings:[{label:'Open',str:[-1,3,0,0,3,3],deg:[null,'R','2','5','2','5'],sf:1}]},
  // D7sus4 open: D0=D(R)✓, G2=A(5): 57✓, B1=C(b7): 60✓, e3=G(4): 67✓
  {id:'cD7sus4',   name:'D7sus4',         sym:'D7sus4',cat:'cowboy',voicings:[{label:'Open',str:[-1,-1,0,2,1,3],deg:[null,null,'R','5','b7','4'],sf:1}]},

  // ── SUS barre ──────────────────────────────────────────────────────────
  // Sus2 E-shape barre: E5=A(R)✓, A7=E(5): 52✓, D7=A(R): 57✓, G4=B(2): 59✓ (2nd of A=B✓), B5=E(5): 64✓, e5=A(R): 69✓
  {id:'bSus2_E',   name:'Sus2 E-shape',   sym:'sus2',cat:'barre',movable:true,voicings:[{label:'6th-str root · ex Asus2@5fr',str:[5,7,7,4,5,5],deg:['R','5','R','2','5','R'],sf:4}]},
  // Augmented A-shape barre (3-note): A3=C(R)✓, D2=E(3): 52✓, G1=Ab(#5): 56✓ (#5 of C=G#/Ab✓)
  {id:'bAug',      name:'Aug A-shape',    sym:'+',   cat:'barre',movable:true,voicings:[{label:'5th-str root · ex C+@1fr',str:[-1,3,2,1,-1,-1],deg:[null,'R','3','#5',null,null],sf:1}]},

  // ── SHELL additions ─────────────────────────────────────────────────────
  // Maj7sus2 shell: E3=G(R)✓, D4=F#(7): 54✓, G2=A(2): 57✓ (2nd of G=A✓)
  {id:'shMaj7sus2',name:'Maj7sus2 Shell', sym:'Δsus2',cat:'shell',movable:true,voicings:[{label:'6-4-3 R-7-2 · ex Gmaj7sus2@2fr',str:[3,-1,4,2,-1,-1],deg:['R',null,'7','2',null,null],sf:2}]},

  // ── DROP 2 additions ───────────────────────────────────────────────────
  // Maj6 Drop2 on 6543: E3=G(R)✓, A5=D(5): 50✓, D2=E(6): 52✓ (6th of G=E✓), G4=B(3): 59✓
  {id:'d2maj6_6',  name:'Maj6 Drop2',     sym:'6',   cat:'drop2',movable:true,voicings:[{label:'6543 R-5-6-3 · ex G6@2fr', str:[3,5,2,4,-1,-1],deg:['R','5','6','3',null,null],sf:2}]},
  // Min6 Drop2 on 6543: E5=A(R)✓, A7=E(5): 52✓, D4=F#(6): 54✓ (6th of Am=F#✓), G5=C(b3): 60✓
  {id:'d2min6_6',  name:'Min6 Drop2',     sym:'m6',  cat:'drop2',movable:true,voicings:[{label:'6543 R-5-6-b3 · ex Am6@4fr',str:[5,7,4,5,-1,-1],deg:['R','5','6','b3',null,null],sf:4}]},
  // Maj6 Drop2 on 4321: D5=G(R): 55✓, G4=B(3): 59✓, B5=E(6): 64✓ (6th of G=E✓), e7=B(3): 71✓
  {id:'d2maj6_4',  name:'Maj6 Drop2',     sym:'6',   cat:'drop2',movable:true,voicings:[{label:'4321 R-3-6-3 · ex G6@5fr', str:[-1,-1,5,4,5,7],deg:[null,null,'R','3','6','3'],sf:4}]},

  // ── EXTENSION additions ─────────────────────────────────────────────────
  // 9sus4: A3=C(R)✓, D3=F(4): 53✓, G3=Bb(b7): 58✓, B3=D(9): 62✓
  {id:'dom9sus4',  name:'Dom 9sus4',      sym:'9sus4',cat:'ext',movable:true,voicings:[{label:'5432 R-4-b7-9 · ex C9sus4@3fr', str:[-1,3,3,3,3,-1],deg:[null,'R','4','b7','9',null],sf:3}]},
  // 13sus4: E3=G(R)✓, D3=F(b7): 53✓, G5=C(4): 60✓, B5=E(13): 64✓ (13th of G=E✓)
  {id:'dom13sus4', name:'Dom 13sus4',     sym:'13sus4',cat:'ext',movable:true,voicings:[{label:'6-4-3-2 R-b7-4-13 · ex G13sus4@3fr',str:[3,-1,3,5,5,-1],deg:['R',null,'b7','4','13',null],sf:3}]},
  // Maj7#5: E3=G(R)✓, A2=B(3): 47✓, D4=F#(7): 54✓, B4=Eb(#5): 63✓ (#5 of G=D#/Eb✓)
  {id:'maj7s5',    name:'Maj7#5',         sym:'Δ#5', cat:'ext',movable:true,voicings:[{label:'6-5-4-2 R-3-7-#5 · ex Gmaj7#5@2fr',str:[3,2,4,-1,4,-1],deg:['R','3','7',null,'#5',null],sf:2}]},
  // Maj9 on 5432: A3=C(R)✓, D2=E(3): 52✓, G4=B(7): 59✓, B3=D(9): 62✓
  {id:'maj9_5',    name:'Maj9',           sym:'maj9',cat:'ext',movable:true,voicings:[{label:'5432 R-3-7-9 · ex Cmaj9@1fr', str:[-1,3,2,4,3,-1],deg:[null,'R','3','7','9',null],sf:1}]},
  // Minor 13: A5=D(R)✓:50, D3=F(b3):53✓, G4=B(13):59✓ (13th/6th of Dm=B✓), B1=C(b7):60✓
  {id:'min13',     name:'Minor 13',       sym:'m13', cat:'ext',movable:true,voicings:[{label:'5432 R-b3-13-b7 · ex Dm13@1fr', str:[-1,5,3,4,1,-1],deg:[null,'R','b3','13','b7',null],sf:1}]},
  // Maj9#11 (Lydian): A3=C(R)✓, D2=E(3):52✓, G4=B(7):59✓, B3=D(9):62✓, e2=F#(#11):66✓
  {id:'maj9s11',   name:'Maj9#11',        sym:'Δ9#11',cat:'ext',movable:true,voicings:[{label:'5-4-3-2-1 R-3-7-9-#11 · ex CΔ9#11',str:[-1,3,2,4,3,2],deg:[null,'R','3','7','9','#11'],sf:2}]},
  // Dom9#11 (Lydian dominant): A3=C(R)✓, D2=E(3):52✓, G3=Bb(b7):58✓, B3=D(9):62✓, e2=F#(#11):66✓
  {id:'dom9s11',   name:'Dom 9#11',       sym:'9#11',cat:'ext',movable:true,voicings:[{label:'5-4-3-2-1 R-3-b7-9-#11 · ex C9#11', str:[-1,3,2,3,3,2],deg:[null,'R','3','b7','9','#11'],sf:2}]},

  // ── QUARTAL VOICINGS ─────────────────────────────────────────────────────
  // Chords built from stacked 4ths — the harmonic language of McCoy Tyner, Herbie Hancock,
  // Bill Frisell, Pat Metheny. Ambiguous tonality; context determines quality.

  // 3-note quartal (6-5-4): R→+P4→+P4 — same fret on bottom 3 strings
  // ex G: E3=G(R)✓, A3=C(4):48✓, D3=F(b7):53✓  stacked P4ths G→C→F
  {id:'q3_654',    name:'Quartal Shell',   sym:'(4)',  cat:'quartal',movable:true,voicings:[{label:'6-5-4 R-4-b7 same fret · ex G@3fr',str:[3,3,3,-1,-1,-1],deg:['R','4','b7',null,null,null],sf:3}]},

  // Quartal + major 3rd (6-5-4-3): adds 3rd above the quartal shell
  // ex G: +G4=B(3):59✓ — R-4-b7-3 — adds tonal colour for major/dominant context
  {id:'q4_6543',   name:'Quartal Major',   sym:'(4)M', cat:'quartal',movable:true,voicings:[{label:'6-5-4-3 R-4-b7-3 · ex G@3fr',    str:[3,3,3,4,-1,-1],deg:['R','4','b7','3',null,null],sf:3}]},

  // Quartal minor 3rd (6-5-4-3): adds minor 3rd instead
  // ex G: +G3=Bb(b3):58✓ — R-4-b7-b3
  {id:'q4m_6543',  name:'Quartal Minor',   sym:'(4)m', cat:'quartal',movable:true,voicings:[{label:'6-5-4-3 R-4-b7-b3 · ex Gm@3fr',   str:[3,3,3,3,-1,-1],deg:['R','4','b7','b3',null,null],sf:3}]},

  // So What chord (5-4-3-2): R-4-b7-b3 — stacked 4ths with m3 on top (the Miles Davis/McCoy sound)
  // A5=D(R):50✓, D5=G(4):55✓, G5=C(b7):60✓, B6=F(b3):65✓
  {id:'qSoWhat',   name:'So What (quartal)',sym:'SW',  cat:'quartal',movable:true,voicings:[{label:'5-4-3-2 R-4-b7-b3 · ex D@5fr',    str:[-1,5,5,5,6,-1],deg:[null,'R','4','b7','b3',null],sf:5}]},

  // Quartal Dorian (6-4-3-2): R-b7-4-13 — adds the characteristic Dorian natural 6th
  // E3=G(R):43✓, D3=F(b7):53✓, G5=C(4):60✓, B5=E(13):64✓  (13th/6th of G Dorian=E✓)
  {id:'qDorian',   name:'Quartal Dorian',  sym:'(4)D', cat:'quartal',movable:true,voicings:[{label:'6-4-3-2 R-b7-4-13 · ex G Dorian@3fr',str:[3,-1,3,5,5,-1],deg:['R',null,'b7','4','13',null],sf:3}]},

  // Quartal Sus2 (5-4-3-2-1): voiced in stacked 4ths over a sus2 colour
  // A3=C(R):48✓, D2=E(9? — wait 2nd/9th of C=D not E). Hmm: 2nd of C=D: D str open=50=D✓ but fret 0 not movable.
  // Use: A5=D(R):50✓, D4=G(4):54? 50+4=54=F#... nope. Let me use: A3=C(R):48, D5=G(5):55, G5=C(R):60, B3=D(9):62✓
  // Actually for quartal sus2 — R-5-9 on 5-3-2: A3=C(R), G4=B(7)? Not sus. Skip complex one.
  // Simple: 5-4-3 R-5-2: A3=C(R):48, D5=G(5):55, G2=A(9? — 2nd/9th of C=D not A. G2=57=A=6th not 9th.
  // Skip quartal sus2 — can't make it clean without open strings or losing movability.

  // ── COWBOY additions ─────────────────────────────────────────────────────
  // Em(maj7) open — hauntingly beautiful, used in My Funny Valentine descending bass
  // E0=E(R):40✓, A2=B(5):47✓, D1=D#(7):51✓ (maj7 of E=D#✓), G0=G(b3):55✓, B0=B(5):59✓, e0=E(R):64✓
  {id:'cEmMaj7',  name:'Em(maj7)',         sym:'Em(Δ)',cat:'cowboy',voicings:[{label:'Open',str:[0,2,1,0,0,0],deg:['R','5','7','b3','5','R'],sf:1}]},
  // Bm7 open position: A2=B(R):47✓, D4=F#(5):54✓, G2=A(b7):57✓, B3=D(b3):62✓, e2=F#(5):66✓
  {id:'cBm7',     name:'Bm7',              sym:'Bm7',  cat:'cowboy',voicings:[{label:'Open',str:[-1,2,4,2,3,2],deg:[null,'R','5','b7','b3','5'],sf:2}]},
  // E9 open: E0=E(R):40✓, A2=B(5):47✓, D0=D(b7):50✓, G1=Ab/G#(3):56✓, B0=B(5):59✓, e2=F#(9):66✓
  {id:'cE9',      name:'E9',               sym:'E9',   cat:'cowboy',voicings:[{label:'Open',str:[0,2,0,1,0,2],deg:['R','5','b7','3','5','9'],sf:1}]},
  // G6 open: E3=G(R):43✓, A2=B(3):47✓, D0=D(5):50✓, G0=G(R):55✓, B0=B(3):59✓, e0=E(6):64✓
  {id:'cG6',      name:'G6',               sym:'G6',   cat:'cowboy',voicings:[{label:'Open',str:[3,2,0,0,0,0],deg:['R','3','5','R','3','6'],sf:1}]},
  // Am9 open: A0=A(R):45✓, D2=E(5):52✓, G4=B(9):59✓ (9th=B✓), B1=C(b3):60✓, e0=E(5):64✓
  {id:'cAm9',     name:'Am9',              sym:'Am9',  cat:'cowboy',voicings:[{label:'Open',str:[-1,0,2,4,1,0],deg:[null,'R','5','9','b3','5'],sf:1}]},
  // G9 open: E3=G(R):43✓, A0=A(9):45✓, D0=D(5):50✓, G0=G(R):55✓, B0=B(3):59✓, e1=F(b7):65✓
  {id:'cG9',      name:'G9',               sym:'G9',   cat:'cowboy',voicings:[{label:'Open',str:[3,0,0,0,0,1],deg:['R','9','5','R','3','b7'],sf:1}]},

  // ── SHELL additions ──────────────────────────────────────────────────────
  // Dom9 shell (R-b7-9): E3=G(R):43✓, D3=F(b7):53✓, G2=A(9):57✓ (9th of G=A✓)
  {id:'shDom9_6', name:'Dom9 Shell 6th',   sym:'9',    cat:'shell',movable:true,voicings:[{label:'6-5-4-3 R-3-b7-9 · ex G9@2fr',  str:[3,2,3,2,-1,-1],deg:['R','3','b7','9',null,null],  sf:2}]},
  // 7#9 shell (R-b7-#9): E3=G(R):43✓, D3=F(b7):53✓, G3=Bb(#9):58✓ (#9 of G=A#=Bb✓)
  // 7#9 shell must include major 3rd to distinguish from m7 (#9=b3 enharmonically).
  // E3=G(R):43✓, A2=B(3):47✓, D3=F(b7):53✓, G3=Bb(#9):58✓ (A#/Bb = #9 of G)
  {id:'sh7s9_6',  name:'7#9 Shell',        sym:'7#9',  cat:'shell',movable:true,voicings:[{label:'6-5-4-3 R-3-b7-#9 · ex G7#9@2fr',str:[3,2,3,3,-1,-1],deg:['R','3','b7','#9',null,null], sf:2}]},
  // min(Δ7) shell 5th str: A3=C(R):48✓, D1=Eb(b3):51✓, G4=B(7):59✓ (maj7 of C=B✓)
  // shMinMaj7_5b removed — was exact duplicate of shMinMaj7_5

  // ── DROP 3 completions (5-4-2-1) ─────────────────────────────────────────
  // m7b5 Drop3 5-4-2-1: A3=C(R):48✓, D4=F#(b5):54✓ (b5 of C=F#/Gb✓), B4=Eb(b3):63✓, e6=Bb(b7):70✓
  {id:'d3m7b5_5', name:'m7b5 Drop3',       sym:'ø',    cat:'drop3',movable:true,voicings:[{label:'5-4-2-1 R-b5-b3-b7 · ex Cø@3fr',str:[-1,3,4,-1,4,6],deg:[null,'R','b5',null,'b3','b7'],sf:3}]},
  // dim7 Drop3 5-4-2-1: A3=C(R):48✓, D4=F#(b5):54✓, B4=Eb(b3):63✓, e5=A(bb7):69✓ (bb7 of C=A✓)
  {id:'d3dim7_5', name:'Dim7 Drop3',       sym:'°7',   cat:'drop3',movable:true,voicings:[{label:'5-4-2-1 R-b5-b3-bb7 · ex Cdim7@3fr',str:[-1,3,4,-1,4,5],deg:[null,'R','b5',null,'b3','bb7'],sf:3}]},
  // min(Δ7) Drop3 5-4-2-1: A3=C(R):48✓, D5=G(5):55✓, B4=Eb(b3):63✓, e7=B(7):71✓ (maj7 of C=B✓)
  {id:'d3mMaj7_5',name:'min(Δ7) Drop3',    sym:'m(Δ)', cat:'drop3',movable:true,voicings:[{label:'5-4-2-1 R-5-b3-7 · ex Cm(Δ)@3fr',str:[-1,3,5,-1,4,7],deg:[null,'R','5',null,'b3','7'],sf:3}]},

  // ── SPREAD additions ─────────────────────────────────────────────────────
  // Spread Aug (6-3-2): E3=G(R):43✓, G4=B(3):59✓, B4=Eb(#5):63✓ (#5 of G=D#/Eb✓)
  {id:'spAug',    name:'Spread Aug',        sym:'+',    cat:'spread',movable:true,voicings:[{label:'6-3-2 R-3-#5 · ex G+@3fr',str:[3,-1,-1,4,4,-1],deg:['R',null,null,'3','#5',null],sf:3}]},
  // Spread Dom9 (6-3-2): E3=G(R):43✓, G2=A(9):57✓ (9th of G=A✓), B6=F(b7):65✓
  {id:'spDom9',   name:'Spread Dom9',       sym:'9',    cat:'spread',movable:true,voicings:[{label:'6-3-2 R-9-b7 · ex G9@2fr',str:[3,-1,-1,2,6,-1],deg:['R',null,null,'9','b7',null],sf:2}]},
  // Spread Maj6/9 (6-3-2): E3=G(R):43✓, G2=A(9):57✓, B5=E(6):64✓ (6th/13th of G=E✓)
  {id:'spMaj69',  name:'Spread 6/9',        sym:'6/9',  cat:'spread',movable:true,voicings:[{label:'6-3-2 R-9-6 · ex G6/9@2fr',str:[3,-1,-1,2,5,-1],deg:['R',null,null,'9','6',null],sf:2}]},

  // ── DROP 2 INVERSIONS (6543 string set) ─────────────────────────────────
  // 2nd inversion (root in bass, 5th voiced above):
  // Gmaj7: E3=G(R:43✓), A5=D(5:50✓), D4=F#(7:54✓), G4=B(3:59✓)
  {id:'d2maj7_6_2i',name:'Maj7 Drop2 2nd inv', sym:'Δ/R', cat:'drop2',movable:true,voicings:[{label:'6543 R-5-7-3 · ex Gmaj7@3fr',str:[3,5,4,4,-1,-1],deg:['R','5','7','3',null,null],sf:3}]},
  // G7: E3=G(R:43✓), A5=D(5:50✓), D3=F(b7:53✓), G4=B(3:59✓)
  {id:'d2dom7_6_2i',name:'Dom7 Drop2 2nd inv',  sym:'7/R', cat:'drop2',movable:true,voicings:[{label:'6543 R-5-b7-3 · ex G7@3fr',  str:[3,5,3,4,-1,-1],deg:['R','5','b7','3',null,null],sf:3}]},
  // 3rd inversion (7th in bass — smooth resolution voice):
  // CMaj7: E7=B(7:47✓), A7=E(3:52✓), D5=G(5:55✓), G5=C(R:60✓) — span=2
  {id:'d2maj7_6_3i',name:'Maj7 Drop2 3rd inv',  sym:'Δ/7', cat:'drop2',movable:true,voicings:[{label:'6543 7-3-5-R · ex Cmaj7@5fr',str:[7,7,5,5,-1,-1],deg:['7','3','5','R',null,null],sf:5}]},
  // C7: E6=Bb(b7:46✓), A7=E(3:52✓), D5=G(5:55✓), G5=C(R:60✓)
  {id:'d2dom7_6_3i',name:'Dom7 Drop2 3rd inv',   sym:'7/b7',cat:'drop2',movable:true,voicings:[{label:'6543 b7-3-5-R · ex C7@5fr',  str:[6,7,5,5,-1,-1],deg:['b7','3','5','R',null,null],sf:5}]},
  // Cm7: E6=Bb(b7:46✓), A6=Eb(b3:51✓), D5=G(5:55✓), G5=C(R:60✓) — span=1
  {id:'d2min7_6_3i',name:'Min7 Drop2 3rd inv',   sym:'m7/b7',cat:'drop2',movable:true,voicings:[{label:'6543 b7-b3-5-R · ex Cm7@5fr',str:[6,6,5,5,-1,-1],deg:['b7','b3','5','R',null,null],sf:5}]},
  // Cø: E6=Bb(b7:46✓), A6=Eb(b3:51✓), D4=Gb(b5:54✓), G5=C(R:60✓)
  {id:'d2m7b5_6_3i',name:'m7b5 Drop2 3rd inv',   sym:'ø/b7',cat:'drop2',movable:true,voicings:[{label:'6543 b7-b3-b5-R · ex Cø@4fr',str:[6,6,4,5,-1,-1],deg:['b7','b3','b5','R',null,null],sf:4}]},

  // ── SHELL INVERSIONS ─────────────────────────────────────────────────────
  // 3-note shell chords with 3rd or 7th in the bass — real jazz voice-leading voicings.
  // All verified MIDI. All spans ≤ 4 frets.
  // Dom7 1st inv (3 in bass) 6-5-4: E7=B(3):47✓ A8=F(b7):53✓ D5=G(R):55✓
  {id:'sh7_6_1i',   name:'Dom7 Shell 1st inv', sym:'7/3',  cat:'shell',movable:true,voicings:[{label:'6-5-4 3-b7-R · ex G7/B@5fr',    str:[7,8,5,-1,-1,-1],deg:['3','b7','R',null,null,null],  sf:5}]},
  // Dom7 2nd inv (b7 in bass) 5-4-3: A8=F(b7):53✓ D5=G(R):55✓ G4=B(3):59✓
  {id:'sh7_5_2i',   name:'Dom7 Shell 2nd inv', sym:'7/b7', cat:'shell',movable:true,voicings:[{label:'5-4-3 b7-R-3 · ex G7/F@4fr',    str:[-1,8,5,4,-1,-1],deg:[null,'b7','R','3',null,null],  sf:4}]},
  // Maj7 1st inv (3 in bass) 6-5-4: E7=B(3):47✓ A9=F#(7):54✓ D5=G(R):55✓
  {id:'shMaj7_6_1i',name:'Maj7 Shell 1st inv', sym:'Δ/3',  cat:'shell',movable:true,voicings:[{label:'6-5-4 3-7-R · ex Gmaj7/B@5fr',  str:[7,9,5,-1,-1,-1],deg:['3','7','R',null,null,null],   sf:5}]},
  // Maj7 2nd inv (7 in bass) 4-3-2: D5=G(R):55✓ G4=B(3):59✓ B7=F#(7):66✓
  {id:'shMaj7_4_2i',name:'Maj7 Shell 2nd inv', sym:'Δ/7',  cat:'shell',movable:true,voicings:[{label:'4-3-2 R-3-7 · ex Gmaj7/F#@5fr', str:[-1,-1,5,4,7,-1],deg:[null,null,'R','3','7',null],   sf:4}]},
  // Min7 1st inv (b3 in bass) 6-5-4: E6=Bb(b3):46✓ A8=F(b7):53✓ D5=G(R):55✓
  {id:'shm7_6_1i',  name:'Min7 Shell 1st inv', sym:'m7/b3',cat:'shell',movable:true,voicings:[{label:'6-5-4 b3-b7-R · ex Gm7/Bb@4fr', str:[6,8,5,-1,-1,-1],deg:['b3','b7','R',null,null,null], sf:4}]},
  // Min7 2nd inv (b7 in bass) 4-3-2: D5=G(R):55✓ G3=Bb(b3):58✓ B6=F(b7):65✓
  {id:'shm7_4_2i',  name:'Min7 Shell 2nd inv', sym:'m7/b7',cat:'shell',movable:true,voicings:[{label:'4-3-2 R-b3-b7 · ex Gm7/F@5fr',  str:[-1,-1,5,3,6,-1],deg:[null,null,'R','b3','b7',null],  sf:3}]},
  // m7b5 1st inv shares fingering with Min7 1st inv (shell omits b5) — not included as duplicate
  // m7b5 2nd inv on 5-4-3 is an unplayable 5-fret span — omitted
  // Dim7 1st inv (b3 in bass) 6-5-4: E6=Bb(b3):46✓ A7=E(bb7):52✓ D5=G(R):55✓
  {id:'shdim7_6_1i',name:'Dim7 Shell 1st inv', sym:'°7/b3',cat:'shell',movable:true,voicings:[{label:'6-5-4 b3-bb7-R · ex G°7/Bb@4fr', str:[6,7,5,-1,-1,-1],deg:['b3','bb7','R',null,null,null], sf:4}]},
];
const PROGS=[
  {title:'ii–V–I · C major',feel:'Jazz',desc:'The cornerstone of jazz. Dm7 creates tension, G7 raises it, Cmaj7 resolves.',chords:[{sym:'Dm7',rn:'ii',v:{str:[-1,5,3,5,-1,-1],deg:[null,'R','b3','b7',null,null],sf:3}},{sym:'G7',rn:'V',v:{str:[3,-1,3,4,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}},{sym:'Cmaj7',rn:'I',v:{str:[-1,3,2,4,-1,-1],deg:[null,'R','3','7',null,null],sf:1}}]},
  {title:'I–VI–ii–V · C major',feel:'Jazz',desc:'Classic turnaround — relative minor and subdominant before resolving.',chords:[{sym:'Cmaj7',rn:'I',v:{str:[-1,3,2,4,-1,-1],deg:[null,'R','3','7',null,null],sf:1}},{sym:'Am7',rn:'vi',v:{str:[5,-1,5,5,-1,-1],deg:['R',null,'b7','b3',null,null],sf:5}},{sym:'Dm7',rn:'ii',v:{str:[-1,5,3,5,-1,-1],deg:[null,'R','b3','b7',null,null],sf:3}},{sym:'G7',rn:'V',v:{str:[3,-1,3,4,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}}]},
  {title:'12-Bar Blues · E',feel:'Blues',desc:'The foundation of blues, rock, and jazz. Three open dominant 7ths.',chords:[{sym:'E7',rn:'I7',v:{str:[0,2,0,1,0,0],deg:['R','5','b7','3','5','R'],sf:1}},{sym:'A7',rn:'IV7',v:{str:[-1,0,2,0,2,0],deg:[null,'R','5','b7','3','5'],sf:1}},{sym:'B7',rn:'V7',v:{str:[-1,2,1,2,0,2],deg:[null,'R','3','b7','R','5'],sf:1}}]},
  {title:'Minor ii–V–i · A minor',feel:'Jazz',desc:'The half-diminished and altered dominant are hallmarks of jazz minor.',chords:[{sym:'Bø',rn:'iiø',v:{str:[7,5,3,2,-1,-1],deg:['R','b3','b5','b7',null,null],sf:2}},{sym:'E7b9',rn:'V7b9',v:{str:[0,2,3,1,3,0],deg:['R','5','b9','3','b7','R'],sf:1}},{sym:'Am7',rn:'i',v:{str:[-1,0,2,0,1,0],deg:[null,'R','5','b7','b3','5'],sf:1}}]},
  {title:'I–IV–V · G major',feel:'Folk/Country',desc:'Three chords, a million songs. The backbone of folk, country, and rock.',chords:[{sym:'G',rn:'I',v:{str:[3,2,0,0,0,3],deg:['R','3','5','R','3','R'],sf:1}},{sym:'C',rn:'IV',v:{str:[-1,3,2,0,1,0],deg:[null,'R','3','5','R','3'],sf:1}},{sym:'D',rn:'V',v:{str:[-1,-1,0,2,3,2],deg:[null,null,'R','5','R','3'],sf:1}}]},
  {title:'I–V–vi–IV · G major',feel:'Pop',desc:'The "4 chord" pop progression — underlies hundreds of hit songs.',chords:[{sym:'G',rn:'I',v:{str:[3,2,0,0,0,3],deg:['R','3','5','R','3','R'],sf:1}},{sym:'D',rn:'V',v:{str:[-1,-1,0,2,3,2],deg:[null,null,'R','5','R','3'],sf:1}},{sym:'Em',rn:'vi',v:{str:[0,2,2,0,0,0],deg:['R','5','R','b3','5','R'],sf:1}},{sym:'C',rn:'IV',v:{str:[-1,3,2,0,1,0],deg:[null,'R','3','5','R','3'],sf:1}}]},
  {title:'Andalusian Cadence · Am',feel:'Flamenco',desc:'Am–G–F–E. Descending minor with Phrygian flavour. Ancient and cinematic.',chords:[{sym:'Am',rn:'i',v:{str:[-1,0,2,2,1,0],deg:[null,'R','5','R','b3','5'],sf:1}},{sym:'G',rn:'VII',v:{str:[3,2,0,0,0,3],deg:['R','3','5','R','3','R'],sf:1}},{sym:'F',rn:'VI',v:{str:[1,3,3,2,1,1],deg:['R','5','R','3','5','R'],sf:1}},{sym:'E',rn:'V',v:{str:[0,2,2,1,0,0],deg:['R','5','R','3','5','R'],sf:1}}]},
  {title:'Drop 2 · ii–V–I in G',feel:'Jazz Comping',desc:'Smooth voice leading with Drop 2 voicings on strings 5-4-3-2.',chords:[{sym:'Am7',rn:'ii',v:{str:[-1,7,7,5,8,-1],deg:[null,'5','R','b3','b7',null],sf:5}},{sym:'D7',rn:'V',v:{str:[-1,5,4,5,-1,-1],deg:[null,'R','3','b7',null,null],sf:4}},{sym:'Gmaj7',rn:'I',v:{str:[-1,5,5,4,7,-1],deg:[null,'5','R','3','7',null],sf:4}}]},
  {title:'Autumn Leaves · opening',feel:'Jazz Standard',desc:'Dm7–G7–Cmaj7–Fmaj7, descending through the cycle of 4ths.',chords:[{sym:'Dm7',rn:'ii',v:{str:[-1,5,3,5,-1,-1],deg:[null,'R','b3','b7',null,null],sf:3}},{sym:'G7',rn:'V',v:{str:[3,-1,3,4,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}},{sym:'Cmaj7',rn:'I',v:{str:[-1,3,2,4,-1,-1],deg:[null,'R','3','7',null,null],sf:1}},{sym:'Fmaj7',rn:'IV',v:{str:[1,-1,2,2,-1,-1],deg:['R',null,'7','3',null,null],sf:1}}]},
  {title:'Bossa Nova · F major',feel:'Bossa Nova',desc:'Fmaj7–Dm7–Gm7–C7sus4. Cool, laid-back Brazilian jazz harmony.',chords:[{sym:'Fmaj7',rn:'I',v:{str:[-1,3,3,2,1,0],deg:[null,'5','R','3','5','7'],sf:1}},{sym:'Dm7',rn:'vi',v:{str:[-1,-1,0,2,1,1],deg:[null,null,'R','5','b7','b3'],sf:1}},{sym:'Gm7',rn:'ii',v:{str:[3,-1,3,3,-1,-1],deg:['R',null,'b7','b3',null,null],sf:1}},{sym:'C7sus4',rn:'V',v:{str:[-1,3,3,3,-1,-1],deg:[null,'R','4','b7',null,null],sf:1}}]},
  {title:'Rhythm Changes · A section',feel:'Bebop',desc:"Gershwin's I Got Rhythm in Bb — backbone of bebop for 80+ years.",chords:[{sym:'Bbmaj7',rn:'I',v:{str:[6,-1,7,7,-1,-1],deg:['R',null,'7','3',null,null],sf:5}},{sym:'Gm7',rn:'vi',v:{str:[3,-1,3,3,-1,-1],deg:['R',null,'b7','b3',null,null],sf:1}},{sym:'Cm7',rn:'ii',v:{str:[-1,3,1,3,-1,-1],deg:[null,'R','b3','b7',null,null],sf:1}},{sym:'F7',rn:'V',v:{str:[1,-1,1,2,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}}]},
  {title:'Jazz Turnaround · C',feel:'Jazz',desc:'Cmaj7–A7–Dm7–G7. Cycle-of-4ths turnaround with secondary dominant.',chords:[{sym:'Cmaj7',rn:'I',v:{str:[-1,3,2,4,-1,-1],deg:[null,'R','3','7',null,null],sf:1}},{sym:'A7',rn:'VI7',v:{str:[5,-1,5,6,-1,-1],deg:['R',null,'b7','3',null,null],sf:5}},{sym:'Dm7',rn:'ii',v:{str:[-1,5,3,5,-1,-1],deg:[null,'R','b3','b7',null,null],sf:3}},{sym:'G7',rn:'V',v:{str:[3,-1,3,4,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}}]},
  {title:'Giant Steps · opening',feel:'Bebop/Modern',desc:"Coltrane's Maj7 chords a major 3rd apart — a cycle that shook jazz harmony.",chords:[{sym:'Bmaj7',rn:'I',v:{str:[7,-1,8,8,-1,-1],deg:['R',null,'7','3',null,null],sf:6}},{sym:'D7',rn:'V/G',v:{str:[-1,5,4,5,-1,-1],deg:[null,'R','3','b7',null,null],sf:4}},{sym:'Gmaj7',rn:'I',v:{str:[3,-1,4,4,-1,-1],deg:['R',null,'7','3',null,null],sf:1}}]},
  {title:'12-Bar Blues · A',feel:'Blues',desc:'Classic shuffle in A — I7, IV7, V7.',chords:[{sym:'A7',rn:'I7',v:{str:[-1,0,2,0,2,0],deg:[null,'R','5','b7','3','5'],sf:1}},{sym:'D7',rn:'IV7',v:{str:[-1,-1,0,2,1,2],deg:[null,null,'R','5','b7','3'],sf:1}},{sym:'E7',rn:'V7',v:{str:[0,2,0,1,0,0],deg:['R','5','b7','3','5','R'],sf:1}}]},
  {title:'So What · D minor',feel:'Modal Jazz',desc:"Miles Davis Kind of Blue. The 'So What' chord stacks 4ths, creating a floating Dorian quality.",chords:[{sym:'Dm11',rn:'i',v:{str:[-1,5,5,5,6,-1],deg:[null,'R','4','b7','b3',null],sf:5}},{sym:'Ebm11',rn:'bii',v:{str:[-1,6,6,6,7,-1],deg:[null,'R','4','b7','b3',null],sf:6}}]},
  {title:'Rhythm Changes · B section',feel:'Bebop',desc:'D7–G7–C7–F7. The circle-of-dominants bridge — each chord a 5th apart.',chords:[{sym:'D7',rn:'VI7',v:{str:[-1,5,4,5,-1,-1],deg:[null,'R','3','b7',null,null],sf:4}},{sym:'G7',rn:'II7',v:{str:[3,-1,3,4,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}},{sym:'C7',rn:'V7',v:{str:[-1,3,2,3,-1,-1],deg:[null,'R','3','b7',null,null],sf:1}},{sym:'F7',rn:'I7',v:{str:[1,-1,1,2,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}}]},
  {title:'Minor Blues · Am',feel:'Blues',desc:'Am7–Dm7–E7b9. Darker and more melancholic than the major blues.',chords:[{sym:'Am7',rn:'i7',v:{str:[-1,0,2,0,1,0],deg:[null,'R','5','b7','b3','5'],sf:1}},{sym:'Dm7',rn:'iv7',v:{str:[-1,-1,0,2,1,1],deg:[null,null,'R','5','b7','b3'],sf:1}},{sym:'E7b9',rn:'V7b9',v:{str:[0,2,3,1,3,0],deg:['R','5','b9','3','b7','R'],sf:1}}]},
  {title:'I–bVII–IV · G major',feel:'Rock',desc:'G–F–C. Borrowing the bVII from Mixolydian gives rock its raw, anthemic quality.',chords:[{sym:'G',rn:'I',v:{str:[3,2,0,0,0,3],deg:['R','3','5','R','3','R'],sf:1}},{sym:'F',rn:'bVII',v:{str:[1,3,3,2,1,1],deg:['R','5','R','3','5','R'],sf:1}},{sym:'C',rn:'IV',v:{str:[-1,3,2,0,1,0],deg:[null,'R','3','5','R','3'],sf:1}}]},
  {title:'i–bVII–bVI–V · A minor',feel:'Rock / Classical',desc:'Am–G–F–E. Natural minor descent. Dramatic and cinematic.',chords:[{sym:'Am',rn:'i',v:{str:[-1,0,2,2,1,0],deg:[null,'R','5','R','b3','5'],sf:1}},{sym:'G',rn:'bVII',v:{str:[3,2,0,0,0,3],deg:['R','3','5','R','3','R'],sf:1}},{sym:'F',rn:'bVI',v:{str:[1,3,3,2,1,1],deg:['R','5','R','3','5','R'],sf:1}},{sym:'E',rn:'V',v:{str:[0,2,2,1,0,0],deg:['R','5','R','3','5','R'],sf:1}}]},
  {title:'I–iii–IV–V · C major',feel:'Pop / Soul',desc:'Cmaj7–Em7–Fmaj7–G7. The mediant (iii) gives a flowing, optimistic quality.',chords:[{sym:'Cmaj7',rn:'I',v:{str:[-1,3,2,4,-1,-1],deg:[null,'R','3','7',null,null],sf:1}},{sym:'Em7',rn:'iii',v:{str:[0,2,2,0,3,0],deg:['R','5','R','b3','b7','R'],sf:1}},{sym:'Fmaj7',rn:'IV',v:{str:[-1,3,3,2,1,0],deg:[null,'5','R','3','5','7'],sf:1}},{sym:'G7',rn:'V',v:{str:[3,2,0,0,0,1],deg:['R','3','5','R','3','b7'],sf:1}}]},
  {title:'Gospel · G major',feel:'Gospel',desc:'G–C–D7–G. The timeless gospel cadence. Simple, powerful.',chords:[{sym:'G',rn:'I',v:{str:[3,2,0,0,0,3],deg:['R','3','5','R','3','R'],sf:1}},{sym:'C',rn:'IV',v:{str:[-1,3,2,0,1,0],deg:[null,'R','3','5','R','3'],sf:1}},{sym:'D7',rn:'V7',v:{str:[-1,-1,0,2,1,2],deg:[null,null,'R','5','b7','3'],sf:1}},{sym:'G',rn:'I',v:{str:[3,2,0,0,0,3],deg:['R','3','5','R','3','R'],sf:1}}]},
  {title:'Dorian Vamp · Dm',feel:'Jazz / Fusion',desc:'Dm7–G7 with no resolution. Modal floating quality.',chords:[{sym:'Dm7',rn:'i7',v:{str:[-1,5,3,5,-1,-1],deg:[null,'R','b3','b7',null,null],sf:3}},{sym:'G7',rn:'IV7',v:{str:[3,-1,3,4,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}}]},
  {title:'Neo-Soul · C major',feel:'Neo-Soul / R&B',desc:'Cmaj7–E7–Fmaj7–Fm7. The chromatic III7→iv shift is the signature neo-soul colour change.',chords:[{sym:'Cmaj7',rn:'I',v:{str:[-1,3,2,4,-1,-1],deg:[null,'R','3','7',null,null],sf:1}},{sym:'E7',rn:'III7',v:{str:[0,2,0,1,0,0],deg:['R','5','b7','3','5','R'],sf:1}},{sym:'Fmaj7',rn:'IV',v:{str:[-1,3,3,2,1,0],deg:[null,'5','R','3','5','7'],sf:1}},{sym:'Fm7',rn:'iv7',v:{str:[-1,8,6,8,-1,-1],deg:[null,'R','b3','b7',null,null],sf:6}}]},
  {title:'Tritone Sub · C',feel:'Jazz',desc:'Cmaj7–Db7–Dm7–G7. Db7 substitutes for G7, creating a smooth chromatic bass line.',chords:[{sym:'Cmaj7',rn:'I',v:{str:[-1,3,2,4,-1,-1],deg:[null,'R','3','7',null,null],sf:1}},{sym:'Db7',rn:'bII7',v:{str:[9,-1,9,10,-1,-1],deg:['R',null,'b7','3',null,null],sf:9}},{sym:'Dm7',rn:'ii',v:{str:[-1,5,3,5,-1,-1],deg:[null,'R','b3','b7',null,null],sf:3}},{sym:'G7',rn:'V',v:{str:[3,-1,3,4,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}}]},
  {title:'Samba · G major',feel:'Samba / Brazilian',desc:'G–Em7–Am7–D7. Circular I–vi–ii–V with a driving Brazilian rhythmic feel.',chords:[{sym:'G',rn:'I',v:{str:[3,2,0,0,0,3],deg:['R','3','5','R','3','R'],sf:1}},{sym:'Em7',rn:'vi',v:{str:[0,2,2,0,3,0],deg:['R','5','R','b3','b7','R'],sf:1}},{sym:'Am7',rn:'ii',v:{str:[-1,0,2,0,1,0],deg:[null,'R','5','b7','b3','5'],sf:1}},{sym:'D7',rn:'V7',v:{str:[-1,-1,0,2,1,2],deg:[null,null,'R','5','b7','3'],sf:1}}]},
  {title:'Coltrane Cycle · C',feel:'Bebop / Modern',desc:'Cmaj7–Abmaj7–E7–Abmaj7. Simplified Giant Steps cycle — three tonal centres a major 3rd apart.',chords:[{sym:'Cmaj7',rn:'I',v:{str:[-1,3,2,4,-1,-1],deg:[null,'R','3','7',null,null],sf:1}},{sym:'Abmaj7',rn:'bVI',v:{str:[4,-1,5,5,-1,-1],deg:['R',null,'7','3',null,null],sf:4}},{sym:'E7',rn:'III7',v:{str:[0,-1,0,1,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}},{sym:'Abmaj7',rn:'bVI',v:{str:[4,-1,5,5,-1,-1],deg:['R',null,'7','3',null,null],sf:4}}]},
  {title:'Jazz Waltz · C',feel:'Jazz Waltz',desc:'Cmaj7–Am7–Dm7–G7 in 3/4. The lilting waltz feel gives familiar harmony new life.',chords:[{sym:'Cmaj7',rn:'I',v:{str:[-1,3,2,4,-1,-1],deg:[null,'R','3','7',null,null],sf:1}},{sym:'Am7',rn:'vi',v:{str:[5,-1,5,5,-1,-1],deg:['R',null,'b7','b3',null,null],sf:5}},{sym:'Dm7',rn:'ii',v:{str:[-1,5,3,5,-1,-1],deg:[null,'R','b3','b7',null,null],sf:3}},{sym:'G7',rn:'V',v:{str:[3,-1,3,4,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}}]},
];

const DEG_HINT={
  'R':'root — tonal centre','3':'major 3rd — makes it major','b3':'minor 3rd — makes it minor',
  'b7':'dominant 7th — tension','7':'major 7th — colour & lift','b9':'flat 9 — dark tension',
  '#9':'sharp 9 — Hendrix note','#11':'sharp 11 — Lydian brightness','b13':'flat 13 — altered colour',
  '5':'perfect 5th — stability','b5':'flat 5 — tritone','#5':'augmented 5th',
  '13':'13th — open extension','9':'9th — extension','6':'6th — sweet addition',
  'bb7':'diminished 7th','4':'suspended 4th','2':'sus2 open',
};

// ── CHORD FAMILY FILTER ── Option A: sonic families ──────────────────────
const FAMILIES=[
  {id:'major',    label:'Major',    sym:'maj', color:'#ffd93d', desc:'Triads · maj7 · add9 · 6/9'},
  {id:'dominant', label:'Dominant', sym:'7',   color:'#fd79a8', desc:'Dom7 · 9 · 13 · altered'},
  {id:'minor',    label:'Minor',    sym:'m',   color:'#74b9ff', desc:'Minor triads · m7 · m9 · m6'},
  {id:'halfdim',  label:'Half-dim', sym:'ø',   color:'#fdcb6e', desc:'m7♭5 — minor triad + ♭5 + ♭7'},
  {id:'dim',      label:'Dim',      sym:'°',   color:'#b2bec3', desc:'Dim triads · dim7 — fully symmetric'},
  {id:'aug',      label:'Aug',      sym:'+',   color:'#a29bfe', desc:'Augmented — major triad + ♯5'},
  {id:'sus',      label:'Sus',      sym:'sus', color:'#55efc4', desc:'Sus2 · Sus4 · 7sus4 — no 3rd'},
];
// Each test is lenient on shell chords (3-note voicings that omit the 3rd by design)
const FAMILY_TESTS={
  major:    d=>d.has('3')&&!d.has('b3')&&!d.has('b7'),           // major triad quality, no ♭7 (excludes dom)
  dominant: d=>d.has('3')&&d.has('b7')&&!d.has('b3'),            // major triad + ♭7
  minor:    d=>d.has('b3')&&!d.has('b5')&&!d.has('bb7'),         // minor triad, no flat 5 (excludes halfdim/dim)
  halfdim:  d=>d.has('b5')&&d.has('b7')&&!d.has('bb7'),          // ♭5 + ♭7 (lenient: catches shells without ♭3)
  dim:      d=>d.has('b5')&&!d.has('b7')&&(d.has('b3')||d.has('bb7')), // ♭5 + no ♭7; needs ♭3 or °7 (catches dim shells)
  aug:      d=>d.has('#5'),
  sus:      d=>(d.has('4')||d.has('2'))&&!d.has('3')&&!d.has('b3'),
};

// ── CHORD BUILDER ── Option C: additive construction ──────────────────────
const TRIADS=[
  {id:'major',sym:'maj',label:'Major', color:'#ffd93d',hint:'R · 3 · 5'},
  {id:'minor',sym:'m',  label:'Minor', color:'#74b9ff',hint:'R · ♭3 · 5'},
  {id:'sus2', sym:'sus2',label:'Sus 2',color:'#55efc4',hint:'R · 2 · 5'},
  {id:'sus4', sym:'sus4',label:'Sus 4',color:'#00b894',hint:'R · 4 · 5'},
  {id:'aug',  sym:'+',  label:'Aug',   color:'#a29bfe',hint:'R · 3 · ♯5'},
  {id:'dim',  sym:'°',  label:'Dim',   color:'#b2bec3',hint:'R · ♭3 · ♭5'},
];
// Triad tests — "dim" is lenient to catch shell voicings that omit ♭3
const TRIAD_TESTS={
  major: d=>d.has('3')&&!d.has('b3')&&!d.has('b5')&&!d.has('#5'),
  minor: d=>d.has('b3')&&!d.has('b5'),   // pure minor quality, no flat 5
  sus2:  d=>d.has('2')&&!d.has('3')&&!d.has('b3'),
  sus4:  d=>d.has('4')&&!d.has('3')&&!d.has('b3'),
  aug:   d=>d.has('#5'),
  dim:   d=>d.has('b5')&&!d.has('3'),    // lenient: any chord with ♭5 and no major 3rd
};

const SEVENTHS=[
  {id:'dom', sym:'♭7',label:'Min 7th', color:'#fd79a8',hint:'minor 7th interval'},
  {id:'maj', sym:'Δ7', label:'Maj 7th', color:'#00b894',hint:'major 7th interval'},
  {id:'dim7',sym:'°7', label:'Dim 7th', color:'#e17055',hint:'diminished 7th (♭♭7)'},
];
const SEVENTH_TESTS={
  dom:  d=>d.has('b7')&&!d.has('bb7'),
  maj:  d=>d.has('7'),
  dim7: d=>d.has('bb7'),
};

// Builder combination labels (triad|seventh)
const BUILDER_COMBO={
  'major|dom': {label:'Dominant 7th',    color:'#fd79a8'},
  'major|maj': {label:'Major 7th',       color:'#00b894'},
  'minor|dom': {label:'Minor 7th',       color:'#4ecdc4'},
  'minor|maj': {label:'Minor-Maj 7',     color:'#a8e6cf'},
  'dim|dom':   {label:'Half-dim  ø',     color:'#fdcb6e'},
  'dim|dim7':  {label:'Full Dim  °7',    color:'#e17055'},
  'sus4|dom':  {label:'Dom 7sus4',       color:'#0984e3'},
  'sus2|dom':  {label:'Dom 7sus2',       color:'#55efc4'},
  'aug|dom':   {label:'Aug Dominant',    color:'#a29bfe'},
};

const EXTS=[
  {id:'6',   sym:'6',    color:'#1e9e77'},
  {id:'9',   sym:'9',    color:'#2ed573'},
  {id:'b9',  sym:'♭9',   color:'#e17055'},
  {id:'s9',  sym:'♯9',   color:'#6c5ce7'},
  {id:'11',  sym:'11',   color:'#81ecec'},
  {id:'s11', sym:'♯11',  color:'#0fbcf9'},
  {id:'13',  sym:'13',   color:'#00b894'},
  {id:'b13', sym:'♭13',  color:'#d63031'},
];
const EXT_TESTS={
  '6':   d=>d.has('6'),
  '9':   d=>d.has('9'),
  'b9':  d=>d.has('b9'),
  's9':  d=>d.has('#9'),
  '11':  d=>d.has('11'),
  's11': d=>d.has('#11'),
  '13':  d=>d.has('13'),
  'b13': d=>d.has('b13'),
};



const FEEL_TO_CAT={
  'Jazz':'Jazz','Bebop':'Jazz','Bebop/Modern':'Jazz','Jazz Standard':'Jazz','Jazz Waltz':'Jazz','Modal Jazz':'Jazz','Jazz / Fusion':'Jazz','Jazz Comping':'Jazz','Jazz Fusion':'Jazz','Jazz Minor':'Jazz','Smooth Jazz':'Jazz',
  'Blues':'Blues','Gospel/Blues':'Blues','Minor Blues':'Blues',
  'Pop':'Rock & Pop','Pop/50s':'Rock & Pop','Pop/Soul':'Rock & Pop','Pop / Soul':'Rock & Pop','Pop/Rock':'Rock & Pop','Folk/Country':'Rock & Pop','Rock':'Rock & Pop','Rock/Classical':'Rock & Pop','Rock/Modal':'Rock & Pop','Rock / Classical':'Rock & Pop','Classical/Pop':'Rock & Pop',
  'R&B/Soul':'Soul & R&B','Neo-Soul/R&B':'Soul & R&B','Neo-Soul':'Soul & R&B','Neo-Soul / R&B':'Soul & R&B','Funk/Soul':'Soul & R&B','Gospel':'Soul & R&B','Soul/R&B':'Soul & R&B',
  'Bossa Nova':'Latin','Samba':'Latin','Samba / Brazilian':'Latin','Flamenco':'Latin','Tango':'Latin',
  'Classical':'Classical',
};
const BROAD_CATS=[
  {id:'Jazz',label:'Jazz',emoji:'🎷',color:'#a29bfe'},
  {id:'Blues',label:'Blues',emoji:'🎸',color:'#ff6b6b'},
  {id:'Rock & Pop',label:'Rock & Pop',emoji:'🎵',color:'#ffd93d'},
  {id:'Soul & R&B',label:'Soul & R&B',emoji:'🎹',color:'#fd79a8'},
  {id:'Latin',label:'Latin',emoji:'🪗',color:'#00b894'},
  {id:'Classical',label:'Classical',emoji:'🎼',color:'#74b9ff'},
];

// ── PERSISTENT STORAGE ───────────────────────────────────────────────────
// localStorage persists across sessions in standalone PWA (home screen launch).
// window.storage is Claude's artifact sandbox API — works inside claude.ai but
// starts fresh when Safari launches the page as a standalone PWA.
// Strategy: write to BOTH, read localStorage first.
const store={
  async get(key){
    try{const v=localStorage.getItem(key);if(v!==null)return{value:v};}catch(e){}
    try{if(typeof window.storage!=='undefined'){const r=await window.storage.get(key);if(r)return r;}}catch(e){}
    return null;
  },
  async set(key,value){
    try{localStorage.setItem(key,value);}catch(e){}
    try{if(typeof window.storage!=='undefined')await store.set(key,value);}catch(e){}
  },
};

const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
const todayStr=()=>new Date().toISOString().split('T')[0];
const addDays=(d,n)=>{const dt=new Date(d);dt.setDate(dt.getDate()+n);return dt.toISOString().split('T')[0];};

function updateSRS(card,correct){
  const ef=card?.ef??2.5,reps=card?.reps??0,interval=card?.interval??1;
  if(correct){const nef=Math.min(2.5,Math.max(1.3,ef+0.1));const nreps=reps+1;const nint=nreps===1?1:nreps===2?6:Math.round(interval*nef);return{ef:nef,interval:nint,reps:nreps,nextDue:addDays(todayStr(),nint)};}
  return{ef:Math.max(1.3,ef-0.2),interval:1,reps:0,nextDue:addDays(todayStr(),1)};
}
function getWeakChords(history,srs){
  const map={};
  for(const h of history){if(!map[h.id])map[h.id]={ok:0,n:0};map[h.id].n++;if(h.correct)map[h.id].ok++;}
  const weak=new Set();
  for(const[id,s]of Object.entries(map)){if(s.ok<s.n)weak.add(id);}
  for(const[id,s]of Object.entries(srs||{})){if(s.ef<2.0)weak.add(id);}
  return CHORDS.filter(c=>weak.has(c.id)).map(c=>({...c,stats:map[c.id]||{ok:0,n:0},srsEf:srs?.[c.id]?.ef}))
    .sort((a,b)=>{const pa=a.stats.n>0?a.stats.ok/a.stats.n:0.5;const pb=b.stats.n>0?b.stats.ok/b.stats.n:0.5;return pa-pb;});
}
function getWeakDegrees(degHist){
  const map={};
  for(const h of degHist){const k=h.id+'|'+h.deg;if(!map[k])map[k]={id:h.id,deg:h.deg,ok:0,n:0};map[k].n++;if(h.correct)map[k].ok++;}
  return Object.values(map).filter(r=>r.ok/r.n<0.7)
    .map(r=>({...r,chord:CHORDS.find(c=>c.id===r.id)})).filter(r=>r.chord)
    .sort((a,b)=>a.ok/a.n-b.ok/b.n);
}
// Seeded pseudo-random number generator (mulberry32) — deterministic for a given seed
function seededRng(seed){
  return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
}
// Simple string → number hash for seeding
function strHash(s){let h=0;for(let i=0;i<s.length;i++){h=Math.imul(31,h)+s.charCodeAt(i)|0;}return h;}

function seededShuffle(arr,seed){
  const a=[...arr],rng=seededRng(seed);
  for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

function getDailyChords(srsData,mastered){
  const td=todayStr();
  const seed=strHash(td);
  // Exclude mastered chords from both due and fresh pools
  const due=CHORDS.filter(c=>srsData[c.id]?.nextDue<=td&&!(mastered&&mastered.has(c.id)));
  const fresh=CHORDS.filter(c=>!srsData[c.id]&&!(mastered&&mastered.has(c.id)));
  const seen=new Set();const result=[];
  for(const c of [...seededShuffle(due,seed),...seededShuffle(fresh,seed+1)]){
    if(!seen.has(c.id)){seen.add(c.id);result.push(c);}
    if(result.length>=5)break;
  }
  return result;
}
function getCharDegs(chord){
  const degs=[...new Set((chord.voicings[0].deg||[]).filter(Boolean))];
  const nonRoot=degs.filter(d=>d!=='R');
  const prio=['b9','#9','#11','b13','13','9','b7','7','b3','3','b5','#5','6','bb7','4','2','5'];
  const found=prio.filter(d=>nonRoot.includes(d));
  const interesting=found.filter(d=>d!=='5');
  return interesting.length>0?interesting.slice(0,3):(found.length>0?found.slice(0,2):nonRoot.slice(0,2));
}

function getRootNote(v){
  for(let i=0;i<v.str.length;i++){if(v.deg?.[i]==='R'&&v.str[i]>=0)return((OPEN_MIDI[i]+v.str[i])%12+12)%12;}
  return null;
}
function getValidTransposeRoots(v){
  const rootIdx=v.deg.findIndex((d,i)=>d==='R'&&v.str[i]>0);
  if(rootIdx===-1)return new Set();
  const currentNote=((OPEN_MIDI[rootIdx]+v.str[rootIdx])%12+12)%12;
  const valid=new Set();
  for(let target=0;target<12;target++){
    let shift=((target-currentNote)+12)%12;if(shift>6)shift-=12;
    const newStr=v.str.map(f=>f>0?f+shift:f);
    if(v.str.every((f,i)=>f<=0||newStr[i]>=1))valid.add(target);
  }
  return valid;
}
function transposeVoicing(v,targetNote){
  const rootIdx=v.deg.findIndex((d,i)=>d==='R'&&v.str[i]>0);
  if(rootIdx===-1)return v;
  const currentNote=((OPEN_MIDI[rootIdx]+v.str[rootIdx])%12+12)%12;
  let shift=((targetNote-currentNote)+12)%12;if(shift>6)shift-=12;if(shift===0)return v;
  const newStr=v.str.map(f=>f>0?f+shift:f);
  if(!v.str.every((f,i)=>f<=0||newStr[i]>=1))return v;
  const active=newStr.filter(f=>f>0);
  return{...v,str:newStr,sf:Math.max(1,active.length>0?Math.min(...active):1)};
}

let _ctx=null,_unlocked=false;
function getCtx(){if(!_ctx)_ctx=new(window.AudioContext||window.webkitAudioContext)();if(_ctx.state==='suspended')_ctx.resume();return _ctx;}
function unlockAudio(){
  if(_unlocked)return;
  // ── iOS silent switch fix ─────────────────────────────────────────────
  // Web Audio alone respects the iOS hardware mute switch (ambient session).
  // Playing a real <audio> element — even a silent one — promotes the iOS
  // audio session to "playback" category, which bypasses the silent switch.
  // Web Audio then inherits that session and plays through regardless of mute.
  try{
    // Inline silent MP3 (44-byte minimal valid MP3 frame, base64 encoded)
    const SILENT_MP3='data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAFhpbmcAAAAPAAAAAwAAA7AAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tb////////////////////////////////////////////////////////////////AAAA8ExBTUUzLjk5LjVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=';
    const audio=new Audio(SILENT_MP3);
    audio.volume=0.001;
    // Must be triggered from a user gesture — this function is called from PlayButtons onClick
    const p=audio.play();
    if(p&&p.then)p.then(()=>{}).catch(()=>{});
  }catch(e){}
  // Also unlock Web Audio context
  const ctx=getCtx();
  const buf=ctx.createBuffer(1,1,22050);const src=ctx.createBufferSource();
  src.buffer=buf;src.connect(ctx.destination);src.start(0);
  ctx.resume().then(()=>{_unlocked=true;});
}
function pluckNote(ctx,freq,when,vol=0.16){
  [[1,1.0],[2,0.45],[3,0.22],[4,0.09],[6,0.04]].forEach(([h,a])=>{
    const osc=ctx.createOscillator(),g=ctx.createGain(),filt=ctx.createBiquadFilter();
    osc.type='sine';osc.frequency.value=freq*h;filt.type='lowpass';filt.frequency.value=Math.min(3200,freq*h*3);
    g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(vol*a,when+0.005);g.gain.exponentialRampToValueAtTime(0.0001,when+(h===1?1.6:0.9));
    osc.connect(filt);filt.connect(g);g.connect(ctx.destination);osc.start(when);osc.stop(when+2);
  });
}
function midiToHz(m){return 440*Math.pow(2,(m-69)/12);}
// Module-level callback registry for first-play notification.
// BannerStack registers a callback; playVoicing calls it once.
// No DOM events, no timing issues, no Strict Mode double-fire problems.
let _onFirstPlay=null;
let _firstPlayFired=false;
// Debug trigger callbacks — set by App, called by DebugPanel
let _debugShowAudio=null;
let _debugShowInstall=null;
function playVoicing(v,mode){
  unlockAudio();
  if(!_firstPlayFired){
    _firstPlayFired=true;
    if(_onFirstPlay){_onFirstPlay();_onFirstPlay=null;}
  }
  const ctx=getCtx(),now=ctx.currentTime+0.04;
  const notes=v.str.map((f,i)=>f>=0?midiToHz(OPEN_MIDI[i]+f):null).filter(Boolean);
  const gap=mode==='arp'?0.10:0.016;
  notes.forEach((hz,i)=>pluckNote(ctx,hz,now+i*gap));
}
function PlayButtons({v,size,stack}){
  const[active,setActive]=useState(null);
  const nc=v.str.filter(f=>f>=0).length;
  const play=mode=>{setActive(mode);playVoicing(v,mode);setTimeout(()=>setActive(null),mode==='arp'?nc*110+800:600);};
  const sm=size==='sm';
  const btn=mode=>({background:active===mode?'#ffd93d15':'transparent',border:`1px solid ${active===mode?'#ffd93d':'#2a2840'}`,color:active===mode?'#ffd93d':'#888',borderRadius:'7px',padding:sm?'4px 9px':'7px 15px',fontSize:sm?'11px':'12px',cursor:'pointer',fontWeight:600,transition:'all .15s',minHeight:sm?'30px':'38px',width:stack?'100%':'auto'});
  // stopPropagation on both onClick AND onTouchStart:
  // Safari synthesises a click from touchend and bubbles it up through the DOM,
  // reaching any parent tappable div (e.g. the chord detail opener). Firefox Mobile
  // doesn't exhibit this — it consumes the touch at the button level. Blocking both
  // events ensures the play action never opens the chord detail on any browser.
  const stop=e=>e.stopPropagation();
  return(
    <div
      style={{display:'flex',flexDirection:stack?'column':'row',gap:'5px',alignItems:'stretch'}}
      onClick={stop}
      onTouchStart={stop}
    >
      <button onClick={e=>{stop(e);play('arp');}} style={btn('arp')}>♩ Arp</button>
      <button onClick={e=>{stop(e);play('strum');}} style={btn('strum')}>♬ Strum</button>
    </div>
  );
}

function ChordDiagram({v,showDeg,size}){
  const sc=size||1;if(!v)return null;
  const{str,deg,sf}=v;
  const active=str.filter(f=>f>0);
  const maxF=active.length>0?Math.max(...active):sf;
  const nFrets=Math.max(5,maxF-sf+1);
  const ML=12,GW=64,RPAD=46,MT=30,MB=6,FS=21;
  const W=ML+GW+RPAD,H=MT+nFrets*FS+MB,SS=GW/5,DR=5.2;
  const sx=i=>ML+i*SS,fy=f=>MT+(f-sf+0.5)*FS;
  const dots=[];
  for(let i=0;i<str.length;i++){
    const fret=str[i],x=sx(i),d=deg?.[i],isR=d==='R';
    if(fret===-1){const y=MT-14,s=3.5;dots.push(<g key={i}><line x1={x-s} y1={y-s} x2={x+s} y2={y+s} stroke="#e74c3c" strokeWidth={1.9} strokeLinecap="round"/><line x1={x+s} y1={y-s} x2={x-s} y2={y+s} stroke="#e74c3c" strokeWidth={1.9} strokeLinecap="round"/></g>);}
    else if(fret===0){
      const cy=MT-14,fill=showDeg&&d?(DC[d]||'#74b9ff'):(isR?'#ff4757':'none'),strokeC=showDeg&&d?(DC[d]||'#74b9ff'):(isR?'#ff4757':'#74b9ff'),tFill=fill==='none'?'#74b9ff':'#111';
      dots.push(<g key={i}><circle cx={x} cy={cy} r={4.25} fill={fill} stroke={strokeC} strokeWidth={1.9}/>{d&&showDeg&&<text x={x} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={d.length>2?5:d.length>1?6:7} fill={tFill} fontWeight="bold" fontFamily="sans-serif">{d}</text>}</g>);
    }else{
      const cy=fy(fret),fill=showDeg&&d?(DC[d]||'#ffd93d'):(isR?'#ff4757':'#ffd93d');
      dots.push(<g key={i}><circle cx={x} cy={cy} r={DR} fill={fill}/>{d&&showDeg&&<text x={x} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={d.length>2?5:d.length>1?6:7} fill="#111" fontWeight="bold" fontFamily="sans-serif">{d}</text>}</g>);
    }
  }
  return(<svg viewBox={`0 0 ${W} ${H}`} width={W*sc} height={H*sc} style={{display:'block',userSelect:'none',WebkitUserSelect:'none',touchAction:'manipulation'}}>
    {Array.from({length:nFrets+1},(_,j)=><line key={j} x1={ML} y1={MT+j*FS} x2={ML+GW} y2={MT+j*FS} stroke={j===0&&sf===1?'#bbb':'#2a2840'} strokeWidth={j===0&&sf===1?3:1.5}/>)}
    {[0,1,2,3,4,5].map(i=><line key={i} x1={sx(i)} y1={MT} x2={sx(i)} y2={MT+nFrets*FS} stroke="#2a2840" strokeWidth={1.5}/>)}
    {sf>1&&<text x={ML+GW+10} y={MT+FS*0.68} fontSize={10} fill="#bbb" fontFamily="monospace" textAnchor="start">{sf}fr</text>}
    {dots}
  </svg>);
}

function ClickableDiagram({v,onDotClick,selIdx,revealed,targetDeg,size}){
  const sc=size||2;if(!v)return null;
  const{str,deg,sf}=v;
  const active=str.filter(f=>f>0),maxF=active.length>0?Math.max(...active):sf,nFrets=Math.max(5,maxF-sf+1);
  const ML=12,GW=64,RPAD=46,MT=30,MB=6,FS=21;
  const W=ML+GW+RPAD,H=MT+nFrets*FS+MB,SS=GW/5,DR=5.2;
  const sx=i=>ML+i*SS,fy=f=>MT+(f-sf+0.5)*FS;
  const dots=[];
  for(let i=0;i<str.length;i++){
    const fret=str[i],x=sx(i),d=deg?.[i],isR=d==='R';
    if(fret===-1){const y=MT-14,s=3.5;dots.push(<g key={i}><line x1={x-s} y1={y-s} x2={x+s} y2={y+s} stroke="#e74c3c" strokeWidth={1.9} strokeLinecap="round"/><line x1={x+s} y1={y-s} x2={x-s} y2={y+s} stroke="#e74c3c" strokeWidth={1.9} strokeLinecap="round"/></g>);}
    else if(fret===0){
      const cy=MT-14,isSel=selIdx===i,isC=revealed&&d===targetDeg,isW=revealed&&isSel&&!isC;
      const fill=revealed?(isC?'#00b894':isW?'#ff6363':(d?(DC[d]||'#74b9ff'):(isR?'#ff4757':'none'))):(isSel?'#a29bfe':(isR?'#ff4757':'none'));
      const strokeC=revealed?(isC?'#00b894':isW?'#ff6363':(d?(DC[d]||'#74b9ff'):'#74b9ff')):(isSel?'#a29bfe':isR?'#ff4757':'#74b9ff');
      const tFill=fill==='none'?'#74b9ff':'#111';
      dots.push(<g key={i} onClick={()=>onDotClick&&onDotClick(i)} style={{cursor:onDotClick?'pointer':'default'}}>
        <circle cx={x} cy={cy} r={DR*2.8} fill="transparent"/>
        <circle cx={x} cy={cy} r={4.25} fill={fill} stroke={strokeC} strokeWidth={(isC||isSel)?2.5:1.9}/>
        {revealed&&d&&<text x={x} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={d.length>2?5:d.length>1?6:7} fill={tFill} fontWeight="bold" fontFamily="sans-serif">{d}</text>}
      </g>);
    }else{
      const cy=fy(fret),isSel=selIdx===i,isC=revealed&&d===targetDeg,isW=revealed&&isSel&&!isC;
      let fill=isR?'#ff4757':'#ffd93d';
      if(revealed){fill=DC[d]||'#ffd93d';if(isC)fill='#00b894';if(isW)fill='#ff6363';}
      else if(isSel)fill='#a29bfe';
      dots.push(<g key={i} onClick={()=>onDotClick&&onDotClick(i)} style={{cursor:onDotClick?'pointer':'default'}}>
        <circle cx={x} cy={cy} r={DR*2.8} fill="transparent"/>
        <circle cx={x} cy={cy} r={DR} fill={fill}/>
        {revealed&&d&&<text x={x} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={d.length>2?5:d.length>1?6:7} fill={isC||isW?'#fff':'#111'} fontWeight="bold" fontFamily="sans-serif">{d}</text>}
      </g>);
    }
  }
  return(<svg viewBox={`0 0 ${W} ${H}`} width={W*sc} height={H*sc} style={{display:'block',touchAction:'manipulation',userSelect:'none',WebkitUserSelect:'none'}}>
    {Array.from({length:nFrets+1},(_,j)=><line key={j} x1={ML} y1={MT+j*FS} x2={ML+GW} y2={MT+j*FS} stroke={j===0&&sf===1?'#bbb':'#2a2840'} strokeWidth={j===0&&sf===1?3:1.5}/>)}
    {[0,1,2,3,4,5].map(i=><line key={i} x1={sx(i)} y1={MT} x2={sx(i)} y2={MT+nFrets*FS} stroke="#2a2840" strokeWidth={1.5}/>)}
    {sf>1&&<text x={ML+GW+10} y={MT+FS*0.68} fontSize={10} fill="#bbb" fontFamily="monospace" textAnchor="start">{sf}fr</text>}
    {dots}
  </svg>);
}

const DEG_TIERS=[
  {label:'Guide Tones ★★★',degs:['3','b3','7','b7']},
  {label:'Safe Extensions ★★',degs:['9','13','6','#11']},
  {label:'Tension Tones ⚡',degs:['b9','#9','b13','b5','#5','bb7']},
  {label:'Root & Neutral',degs:['R','5']},
  {label:'Suspended',degs:['4','2','11']},
];
const DEFAULT_DEGS=new Set(['3','b3','7','b7','9','13','6','#11','b9','#9','b13','b5','#5','bb7']);
const DEG_TOTAL=10;

function ScaleDegreeQuiz({onSaveDeg}){
  const[phase,setPhase]=useState('intro');
  const[selDegs,setSelDegs]=useState(DEFAULT_DEGS);
  const[chord,setChord]=useState(null);
  const[targetDeg,setTargetDeg]=useState(null);
  const[selIdx,setSelIdx]=useState(-1);
  const[revealed,setRevealed]=useState(false);
  const[score,setScore]=useState(0);
  const[qi,setQi]=useState(0);
  const[waitNext,setWaitNext]=useState(false);
  const[sessionResults,setSessionResults]=useState([]);
  const toggleDeg=d=>setSelDegs(prev=>{const n=new Set(prev);if(n.has(d)){if(n.size>1)n.delete(d);}else n.add(d);return n;});
  const nextQ=useCallback((activeDegSet)=>{
    let c,deg,tries=0;
    do{c=shuffle([...CHORDS])[0];const av=getCharDegs(c).filter(d=>activeDegSet.has(d));deg=av.length>0?av[Math.floor(Math.random()*av.length)]:null;tries++;}while(!deg&&tries<40);
    if(!deg)return;
    setChord(c);setTargetDeg(deg);setSelIdx(-1);setRevealed(false);setWaitNext(false);
  },[]);
  const start=()=>{setScore(0);setQi(0);setSessionResults([]);nextQ(selDegs);setPhase('quiz');};
  const handleNext=()=>{const nqi=qi+1;if(nqi>=DEG_TOTAL){onSaveDeg&&onSaveDeg(sessionResults);setPhase('done');}else{setQi(nqi);nextQ(selDegs);}};
  const handleDot=idx=>{
    if(revealed)return;
    const v=chord.voicings[0];if(v.str[idx]===-1)return;
    setSelIdx(idx);
    const correct=v.deg?.[idx]===targetDeg;
    const res={id:chord.id,deg:targetDeg,correct};
    setSessionResults(p=>[...p,res]);
    if(correct){setScore(s=>s+1);setRevealed(true);setTimeout(()=>{const nqi=qi+1;if(nqi>=DEG_TOTAL){onSaveDeg&&onSaveDeg([...sessionResults,res]);setPhase('done');}else{setQi(nqi);nextQ(selDegs);}},1200);}
    else{setRevealed(true);setWaitNext(true);}
  };
  if(phase==='intro')return(
    <div style={{padding:'18px 16px',maxWidth:'420px',margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:'14px'}}>
        <div style={{fontSize:'40px',marginBottom:'6px'}}>🎼</div>
        <h2 style={{fontSize:'22px',fontWeight:900,margin:'0 0 8px',color:'#fff'}}>Scale Degree Trainer</h2>
        <p style={{color:'#ccc',margin:'0',fontSize:'13px',lineHeight:'1.6'}}>Tap the dot matching the asked degree.</p>
      </div>
      <div style={{marginBottom:'14px'}}>
        <div style={{fontSize:'11px',color:'#888',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'8px'}}>Degrees to practise · <span style={{color:'#ffd93d'}}>{selDegs.size} selected</span></div>
        <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
          {DEG_TIERS.map(tier=>(
            <div key={tier.label} style={{background:'#13121f',borderRadius:'9px',padding:'9px 10px',border:'1px solid #2a2840'}}>
              <div style={{fontSize:'10px',color:'#777',marginBottom:'6px',fontWeight:600}}>{tier.label}</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
                {tier.degs.map(d=>{const on=selDegs.has(d);return(
                  <button key={d} onClick={()=>toggleDeg(d)} style={{padding:'4px 10px',borderRadius:'12px',cursor:'pointer',fontSize:'12px',fontWeight:700,background:on?(DC[d]||'#ffd93d')+'22':'transparent',color:on?(DC[d]||'#ffd93d'):'#555',border:`1px solid ${on?(DC[d]||'#ffd93d')+'66':'#2a2840'}`,transition:'all .15s',minHeight:'30px'}}>{d}</button>
                );})}
              </div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={start} style={{display:'block',width:'100%',background:'#ffd93d',color:'#111',border:'none',padding:'14px',borderRadius:'11px',fontSize:'15px',fontWeight:900,cursor:'pointer'}}>Start Training 🎼</button>
    </div>
  );
  if(phase==='done'){
    const pct=Math.round(score/DEG_TOTAL*100);
    return(<div style={{padding:'28px 14px',maxWidth:'360px',margin:'0 auto',textAlign:'center'}}>
      <div style={{fontSize:'54px',marginBottom:'5px'}}>{pct===100?'🏆':pct>=80?'⭐':pct>=60?'🎯':'💪'}</div>
      <div style={{fontSize:'20px',fontWeight:800,marginBottom:'3px',color:'#fff'}}>{pct>=80?'Sharp ears!':pct>=60?'Getting there!':'Keep practising!'}</div>
      <div style={{fontSize:'58px',fontWeight:900,color:'#ffd93d',lineHeight:1,marginBottom:'3px'}}>{score}/{DEG_TOTAL}</div>
      <div style={{color:'#aaa',marginBottom:'18px'}}>{pct}% correct</div>
      <div style={{display:'flex',gap:'8px',justifyContent:'center'}}>
        <button onClick={()=>setPhase('intro')} style={{background:'transparent',border:'1px solid #2a2840',color:'#aaa',padding:'10px 20px',borderRadius:'9px',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>Settings</button>
        <button onClick={start} style={{background:'#ffd93d',color:'#111',border:'none',padding:'10px 28px',borderRadius:'9px',fontSize:'13px',fontWeight:800,cursor:'pointer'}}>Again</button>
      </div>
    </div>);
  }
  if(!chord||!targetDeg)return null;
  const v=chord.voicings[0];
  const isCorrect=revealed&&(v.deg||[]).some((d,i)=>d===targetDeg&&i===selIdx);
  return(
    <div style={{padding:'12px',maxWidth:'420px',margin:'0 auto'}}>
      <div style={{marginBottom:'10px'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}><span style={{color:'#999',fontSize:'11px'}}>Q{qi+1}/{DEG_TOTAL}</span><span style={{color:'#ffd93d',fontSize:'11px',fontWeight:700}}>{score} correct</span></div>
        <div style={{background:'#1a1928',borderRadius:'3px',height:'4px'}}><div style={{background:'linear-gradient(90deg,#ff6b6b,#ffd93d)',height:'4px',borderRadius:'3px',width:`${(qi/DEG_TOTAL)*100}%`,transition:'width .3s'}}/></div>
      </div>
      <div style={{textAlign:'center',marginBottom:'10px'}}>
        <div style={{fontSize:'22px',fontWeight:900,color:'#fff'}}>{chord.name}</div>
        <div style={{display:'flex',gap:'12px',justifyContent:'center',marginTop:'5px',fontSize:'12px'}}>
          <span><span style={{color:'#ff4757',fontWeight:700}}>●</span> <span style={{color:'#aaa'}}>Root</span></span>
          <span><span style={{color:'#ffd93d',fontWeight:700}}>●</span> <span style={{color:'#aaa'}}>Note</span></span>
          {revealed&&<><span><span style={{color:'#00b894',fontWeight:700}}>●</span> <span style={{color:'#aaa'}}>Correct</span></span><span><span style={{color:'#ff6363',fontWeight:700}}>●</span> <span style={{color:'#aaa'}}>Wrong</span></span></>}
        </div>
      </div>
      <div style={{textAlign:'center',marginBottom:'12px',padding:'9px',background:'#13121f',borderRadius:'10px',border:`1px solid ${DC[targetDeg]||'#ffd93d'}44`}}>
        <div style={{fontSize:'10px',color:'#888',textTransform:'uppercase',letterSpacing:'2px',marginBottom:'3px'}}>Tap the</div>
        <div style={{fontSize:'30px',fontWeight:900,color:DC[targetDeg]||'#ffd93d'}}>{targetDeg}</div>
        {revealed&&<div style={{fontSize:'11px',color:'#aaa',marginTop:'4px',fontStyle:'italic'}}>{DEG_HINT[targetDeg]||''}</div>}
      </div>
      <div style={{display:'flex',justifyContent:'center',marginBottom:'10px'}}>
        <div style={{background:'#13121f',borderRadius:'14px',padding:'14px',border:`1px solid ${!revealed?'#2a2840':isCorrect?'#00b894':'#ff6363'}`,transition:'border-color .3s'}}>
          <ClickableDiagram v={v} onDotClick={!revealed?handleDot:null} selIdx={selIdx} revealed={revealed} targetDeg={targetDeg} size={1.9}/>
        </div>
      </div>
      {revealed&&<div style={{textAlign:'center'}}>
        <div style={{fontSize:'14px',fontWeight:700,color:isCorrect?'#00b894':'#ff6363',marginBottom:'8px'}}>{isCorrect?'✓ Correct!':'✗ Not quite — degrees revealed above'}</div>
        {waitNext&&<button onClick={handleNext} style={{background:'#ffd93d',color:'#111',border:'none',padding:'11px 36px',borderRadius:'10px',fontSize:'14px',fontWeight:800,cursor:'pointer',minHeight:'44px'}}>Next →</button>}
      </div>}
    </div>
  );
}

function NameOpt({opt,picked,correctId,onPick}){
  const isSel=picked===opt,showFb=!!picked,isC=opt.id===correctId;
  return(<button onClick={()=>onPick(opt)} style={{background:!showFb?'#13121f':isC?'#00b89420':isSel?'#ff636320':'#13121f',border:`2px solid ${!showFb?'#2a2840':isC?'#00b894':isSel?'#ff6363':'#2a2840'}`,borderRadius:'10px',cursor:picked?'default':'pointer',padding:'10px 7px',transition:'border-color 0.2s',textAlign:'center',width:'100%',minHeight:'64px'}}>
    <div style={{fontSize:'19px',fontWeight:900,color:'#fff'}}>{opt.sym}</div>
    <div style={{fontSize:'10px',color:'#bbb',marginTop:'2px'}}>{opt.name}</div>
    <div style={{fontSize:'8px',color:CATS[opt.cat].color,marginTop:'1px',fontWeight:600}}>{CATS[opt.cat].label}</div>
    {showFb&&<div style={{fontSize:'13px',marginTop:'3px',color:isC?'#00b894':isSel?'#ff6363':'transparent'}}>{isC?'✓':isSel?'✗':' '}</div>}
  </button>);
}
function ShapeOpt({opt,picked,correctId,onPick,showDeg,hideLabel}){
  const isSel=picked===opt,showFb=!!picked,isC=opt.id===correctId;
  return(<button onClick={()=>onPick(opt)} style={{background:!showFb?'#13121f':isC?'#00b89420':isSel?'#ff636320':'#13121f',border:`2px solid ${!showFb?'#2a2840':isC?'#00b894':isSel?'#ff6363':'#2a2840'}`,borderRadius:'10px',cursor:picked?'default':'pointer',padding:'8px 5px',transition:'border-color 0.2s',display:'flex',flexDirection:'column',alignItems:'center',width:'100%'}}>
    <ChordDiagram v={opt.voicings[0]} showDeg={showDeg} size={0.88}/>
    {!hideLabel&&<div style={{fontSize:'8px',color:'#999',marginTop:'2px'}}>{opt.name}</div>}
    {showFb&&<div style={{fontSize:'13px',marginTop:'3px',color:isC?'#00b894':isSel?'#ff6363':'transparent'}}>{isC?'✓':isSel?'✗':' '}</div>}
  </button>);
}
const QL=10;
function makeQ(pool,mode){
  const c=pool[Math.floor(Math.random()*pool.length)];
  const qm=mode==='mixed'?(Math.random()<0.5?'n2s':'s2n'):mode;
  const same=shuffle(pool.filter(x=>x.id!==c.id&&x.cat===c.cat));
  const other=shuffle(pool.filter(x=>x.id!==c.id&&x.cat!==c.cat));
  return{chord:c,qm,opts:shuffle([c,...[...same,...other].slice(0,3)])};
}
function ChordQuiz({showDeg,onComplete,pool,onBack}){
  const allCatKeys=Object.keys(CATS);
  const[phase,setPhase]=useState('setup');
  const[mode,setMode]=useState('mixed');
  const[selCats,setSelCats]=useState(new Set(allCatKeys));
  const[qs,setQs]=useState([]);
  const[qi,setQi]=useState(0);
  const[ans,setAns]=useState([]);
  const[picked,setPicked]=useState(null);
  const filteredPool=useMemo(()=>{if(pool)return pool;const fp=CHORDS.filter(c=>selCats.has(c.cat));return fp.length>=4?fp:CHORDS;},[selCats,pool]);
  const toggleCat=k=>setSelCats(prev=>{const n=new Set(prev);if(n.has(k)){if(n.size>1)n.delete(k);}else n.add(k);return n;});
  const n=Math.min(QL,filteredPool.length);
  const start=()=>{const arr=[];const seen=new Set();for(let i=0;i<n*5&&arr.length<n;i++){const q=makeQ(filteredPool,mode);if(!seen.has(q.chord.id)){seen.add(q.chord.id);arr.push(q);}}setQs(arr);setQi(0);setAns([]);setPicked(null);setPhase('playing');};
  const pick=opt=>{if(picked)return;setPicked(opt);setTimeout(()=>{const correct=opt.id===qs[qi].chord.id;const na=[...ans,{id:qs[qi].chord.id,correct}];setAns(na);if(qi+1>=qs.length){onComplete&&onComplete(na);setPhase('done');}else{setQi(i=>i+1);setPicked(null);}},900);};
  const score=ans.filter(a=>a.correct).length;
  if(phase==='setup')return(
    <div style={{padding:'20px 14px',maxWidth:'460px',margin:'0 auto'}}>
      {onBack&&<button onClick={onBack} style={{display:'block',marginBottom:'12px',background:'transparent',border:'1px solid #2a2840',color:'#aaa',padding:'5px 14px',borderRadius:'8px',cursor:'pointer',fontSize:'12px'}}>← Back</button>}
      <div style={{textAlign:'center',marginBottom:'16px'}}><div style={{fontSize:'36px',marginBottom:'5px'}}>🎯</div><h2 style={{fontSize:'19px',fontWeight:900,margin:'0 0 2px',color:'#fff'}}>Chord Quiz</h2><p style={{color:'#aaa',margin:0,fontSize:'11px'}}>{pool?`Drilling ${filteredPool.length} weak chords`:`${n} questions · spaced repetition`}</p></div>
      <div style={{marginBottom:'12px'}}>
        <div style={{fontSize:'10px',color:'#888',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'6px'}}>Direction</div>
        <div style={{display:'flex',gap:'6px'}}>{[{id:'n2s',label:'Name→Shape'},{id:'s2n',label:'Shape→Name'},{id:'mixed',label:'⚡ Mixed'}].map(m=>(<button key={m.id} onClick={()=>setMode(m.id)} style={{flex:1,padding:'9px 4px',borderRadius:'9px',cursor:'pointer',border:mode===m.id?'2px solid #ffd93d':'1px solid #2a2840',background:mode===m.id?'#1e1c32':'#13121f',color:mode===m.id?'#ffd93d':'#aaa',fontSize:'11px',fontWeight:700}}>{m.label}</button>))}</div>
      </div>
      {!pool&&(<div style={{marginBottom:'16px'}}>
        <div style={{fontSize:'10px',color:'#888',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'6px'}}>Chord types · {selCats.size}/{allCatKeys.length} selected</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>{Object.entries(CATS).map(([k,c])=>{const on=selCats.has(k);const nc=CHORDS.filter(x=>x.cat===k).length;return(<button key={k} onClick={()=>toggleCat(k)} style={{padding:'4px 10px',borderRadius:'14px',cursor:'pointer',fontSize:'10px',fontWeight:700,border:`1px solid ${on?c.color:c.color+'33'}`,background:on?c.color+'22':'transparent',color:on?c.color:'#666'}}>{c.label} ({nc})</button>);})}</div>
        <div style={{fontSize:'10px',color:'#666',marginTop:'4px'}}>{filteredPool.length} chords in pool</div>
      </div>)}
      <button onClick={start} style={{display:'block',width:'100%',background:'#ffd93d',color:'#111',border:'none',padding:'13px',borderRadius:'11px',fontSize:'14px',fontWeight:900,cursor:'pointer'}}>Start Quiz 🎸</button>
    </div>
  );
  if(phase==='done'){
    const pct=Math.round(score/qs.length*100);
    return(<div style={{padding:'24px 14px',maxWidth:'380px',margin:'0 auto',textAlign:'center'}}>
      <div style={{fontSize:'50px',marginBottom:'4px'}}>{pct===100?'🏆':pct>=80?'⭐':pct>=60?'🎸':'💪'}</div>
      <div style={{fontSize:'18px',fontWeight:800,marginBottom:'2px',color:'#fff'}}>{pct===100?'Flawless!':pct>=80?'Great!':pct>=60?'Keep going!':'More practice!'}</div>
      <div style={{fontSize:'54px',fontWeight:900,color:'#ffd93d',lineHeight:1,marginBottom:'2px'}}>{score}/{qs.length}</div>
      <div style={{color:'#aaa',marginBottom:'14px'}}>{pct}% correct</div>
      <div style={{display:'flex',gap:'4px',justifyContent:'center',flexWrap:'wrap',marginBottom:'16px'}}>{ans.map((a,i)=>(<div key={i} style={{width:'26px',height:'26px',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:700,background:a.correct?'#00b89420':'#ff636320',border:`1px solid ${a.correct?'#00b894':'#ff6363'}`,color:a.correct?'#00b894':'#ff6363'}}>{a.correct?'✓':'✗'}</div>))}</div>
      <div style={{display:'flex',gap:'6px',justifyContent:'center'}}>
        {onBack&&<button onClick={onBack} style={{background:'transparent',border:'1px solid #2a2840',color:'#aaa',padding:'8px 14px',borderRadius:'9px',fontSize:'12px',cursor:'pointer'}}>Back</button>}
        <button onClick={()=>setPhase('setup')} style={{background:'transparent',border:'1px solid #2a2840',color:'#aaa',padding:'8px 14px',borderRadius:'9px',fontSize:'12px',cursor:'pointer'}}>Settings</button>
        <button onClick={start} style={{background:'#ffd93d',color:'#111',border:'none',padding:'8px 20px',borderRadius:'9px',fontSize:'13px',fontWeight:800,cursor:'pointer'}}>Again</button>
      </div>
    </div>);
  }
  const q=qs[qi];if(!q)return null;
  const isN2S=q.qm==='n2s';
  return(<div style={{padding:'12px',maxWidth:'540px',margin:'0 auto'}}>
    <div style={{marginBottom:'10px'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}><span style={{color:'#999',fontSize:'11px'}}>Q{qi+1}/{qs.length}</span><span style={{color:'#ffd93d',fontSize:'11px',fontWeight:700}}>{score} correct</span></div>
      <div style={{background:'#1a1928',borderRadius:'3px',height:'4px'}}><div style={{background:'linear-gradient(90deg,#ff6b6b,#ffd93d)',height:'4px',borderRadius:'3px',width:`${(qi/qs.length)*100}%`,transition:'width .3s'}}/></div>
      <span style={{fontSize:'9px',color:'#666',background:'#1a1928',padding:'1px 7px',borderRadius:'8px',marginTop:'4px',display:'inline-block'}}>{isN2S?'Name → Shape':'Shape → Name'}</span>
    </div>
    {isN2S?(<div>
      <div style={{textAlign:'center',marginBottom:'10px'}}><div style={{fontSize:'10px',color:'#888',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'4px'}}>Find the shape for:</div><div style={{fontSize:'44px',fontWeight:900,color:'#ffd93d',lineHeight:1}}>{q.chord.sym}</div><div style={{fontSize:'11px',color:'#bbb',marginTop:'2px'}}>{q.chord.name}</div></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'7px'}}>{q.opts.map(opt=><ShapeOpt key={opt.id} opt={opt} picked={picked} correctId={q.chord.id} onPick={pick} showDeg={showDeg} hideLabel={true}/>)}</div>
    </div>):(<div>
      <div style={{textAlign:'center',marginBottom:'10px'}}><div style={{fontSize:'10px',color:'#888',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'4px'}}>Name this chord:</div><div style={{background:'#13121f',borderRadius:'12px',padding:'10px',display:'inline-block',border:'1px solid #2a2840'}}><ChordDiagram v={q.chord.voicings[0]} showDeg={showDeg} size={1.55}/></div></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'7px'}}>{q.opts.map(opt=><NameOpt key={opt.id} opt={opt} picked={picked} correctId={q.chord.id} onPick={pick}/>)}</div>
    </div>)}
  </div>);
}
function QuizTab({showDeg,onChordQuizDone,onDegDone}){
  const[mode,setMode]=useState('chord');
  return(<div>
    <div style={{display:'flex',gap:'0',margin:'8px 12px 0',background:'#13121f',borderRadius:'10px',padding:'3px',border:'1px solid #2a2840'}}>
      {[{id:'chord',label:'🎸 Chord Quiz'},{id:'degree',label:'🎼 Scale Degrees'}].map(m=>(<button key={m.id} onClick={()=>setMode(m.id)} style={{flex:1,padding:'8px 4px',borderRadius:'8px',cursor:'pointer',border:'none',background:mode===m.id?'#2a2840':'transparent',color:mode===m.id?'#ffd93d':'#888',fontSize:'12px',fontWeight:700,transition:'all .15s'}}>{m.label}</button>))}
    </div>
    {mode==='chord'&&<ChordQuiz showDeg={showDeg} onComplete={onChordQuizDone}/>}
    {mode==='degree'&&<ScaleDegreeQuiz onSaveDeg={onDegDone}/>}
  </div>);
}

const RN_OFFSETS={
  'I':0,'bII':1,'II':2,'bIII':3,'III':4,'IV':5,'bV':6,'V':7,'bVI':8,'VI':9,'bVII':10,'VII':11,
  'i':0,'bii':1,'ii':2,'biii':3,'iii':4,'iv':5,'bv':6,'v':7,'bvi':8,'vi':9,'bvii':10,'vii':11,
};
const Q_SUFFIX={
  'maj7':'maj7','m7':'m7','7':'7','maj':'','min':'m','m7b5':'m7b5',
  'dim7':'dim7','7b9':'7b9','9':'9','maj9':'maj9','m9':'m9',
  '6':'6','7sus4':'7sus4','m6':'m6','sus2':'sus2','sus4':'sus4',
  'aug':'+','9sus4':'9sus4','13sus4':'13sus4','maj7s5':'maj7#5',
  'm13':'m13','maj9s11':'maj9#11','9s11':'9#11','mMaj7':'(Δ7)',
};
const QTMPL={
  // All templates rooted at C — A string fret 3 = MIDI 48 = C
  // ── Seventh chords: shell / 4-string — the jazz comping vocabulary ──────
  'maj7':   {str:[-1,3,2,4,-1,-1],deg:[null,'R','3','7',null,null],sf:1},
  'm7':     {str:[-1,3,1,3,-1,-1],deg:[null,'R','b3','b7',null,null],sf:1},
  '7':      {str:[-1,3,2,3,-1,-1],deg:[null,'R','3','b7',null,null],sf:1},
  'm7b5':   {str:[-1,3,4,3,-1,-1],deg:[null,'R','b5','b7',null,null],sf:3},
  'dim7':   {str:[-1,3,4,2,4,-1],deg:[null,'R','b5','bb7','b3',null],sf:2},
  '7b9':    {str:[-1,3,2,3,2,-1],deg:[null,'R','3','b7','b9',null],sf:2},
  '9':      {str:[-1,3,2,3,3,-1],deg:[null,'R','3','b7','9',null],sf:1},
  'maj9':   {str:[-1,3,2,4,3,-1],deg:[null,'R','3','7','9',null],sf:1},
  'm9':     {str:[-1,3,1,3,3,-1],deg:[null,'R','b3','b7','9',null],sf:1},
  '7sus4':  {str:[-1,3,3,3,-1,-1],deg:[null,'R','4','b7',null,null],sf:3},
  '6':      {str:[-1,3,2,2,3,-1],deg:[null,'R','3','6','9',null],sf:2},
  'm6':     {str:[-1,3,1,2,-1,-1],deg:[null,'R','b3','6',null,null],sf:1},
  '9sus4':  {str:[-1,3,3,3,3,-1],deg:[null,'R','4','b7','9',null],sf:3},
  'aug':    {str:[-1,3,2,1,-1,-1],deg:[null,'R','3','#5',null,null],sf:1},
  'maj7s5': {str:[3,2,4,-1,4,-1],deg:['R','3','7',null,'#5',null],sf:2},
  'mMaj7':  {str:[-1,3,1,4,-1,-1],deg:[null,'R','b3','7',null,null],sf:1},
  // ── Triads: COMPACT 4-string on 5-4-3-2 (no top-e barre) ───────────────
  // These are the shapes advanced rock, soul, and fusion players use —
  // not the full 6-string cowboy barre. Cleaner on-neck sound.
  // C major: A3=C(R):48✓, D5=G(5):55✓, G5=C(R):60✓, B5=E(3):64✓
  'maj':    {str:[-1,3,5,5,5,-1],deg:[null,'R','5','R','3',null],sf:3},
  // C minor: A3=C(R):48✓, D5=G(5):55✓, G5=C(R):60✓, B4=Eb(b3):63✓
  'min':    {str:[-1,3,5,5,4,-1],deg:[null,'R','5','R','b3',null],sf:3},
  // C sus2: B3=D(2):62✓ (2nd of C=D✓)
  'sus2':   {str:[-1,3,5,5,3,-1],deg:[null,'R','5','R','2',null],sf:3},
  // C sus4: B6=F(4):65✓ (4th of C=F✓)
  'sus4':   {str:[-1,3,5,5,6,-1],deg:[null,'R','5','R','4',null],sf:3},
};
const TMPL_ROOT=0;

// ── COWBOY VOICING MAP ────────────────────────────────────────────────────
// Precomputed at startup: maps `noteIndex_quality` → open/cowboy voicing.
// Used when the user enables "Open Pos." mode in the Progressions tab.
// Quality patterns tested against chord sym strings.
const COWBOY_Q={
  'maj': c=>/^[A-G][#b]?$/.test(c.sym),
  'min': c=>/^[A-G][#b]?m$/.test(c.sym),
  '7':   c=>/^[A-G][#b]?7$/.test(c.sym),
  'sus2':c=>c.sym.endsWith('sus2'),
  'sus4':c=>c.sym.endsWith('sus4'),
  'maj7':c=>/^[A-G][#b]?maj7$/.test(c.sym),
  'm7':  c=>/^[A-G][#b]?m7$/.test(c.sym),
};
const COWBOY_MAP=(()=>{
  const map={};
  Object.entries(COWBOY_Q).forEach(([q,test])=>{
    CHORDS.filter(c=>c.cat==='cowboy'&&test(c)).forEach(c=>{
      const root=getRootNote(c.voicings[0]);
      if(root!==null&&!map[`${root}_${q}`])map[`${root}_${q}`]=c.voicings[0];
    });
  });
  return map;
})();

function transposeFromTemplate(tmpl,targetNote){
  const shift=((targetNote-TMPL_ROOT)+12)%12;
  if(shift===0)return{...tmpl,label:''};
  const newStr=tmpl.str.map(f=>f>0?f+shift:f);
  const active=newStr.filter(f=>f>0);
  return{...tmpl,str:newStr,sf:active.length>0?Math.min(...active):1,label:''};
}
function getChordName(keyNote,rnStr,quality){
  const offset=RN_OFFSETS[rnStr]||0;
  const noteIdx=(keyNote+offset+12)%12;
  const sfx=Q_SUFFIX[quality]!==undefined?Q_SUFFIX[quality]:quality;
  return NOTE_NAMES[noteIdx]+sfx;
}
function getVoicing(keyNote,rnStr,quality,useCowboy=false){
  const offset=RN_OFFSETS[rnStr]||0;
  const targetNote=(keyNote+offset+12)%12;
  // Open-position mode: try cowboy lookup first
  if(useCowboy){
    const cv=COWBOY_MAP[`${targetNote}_${quality}`];
    if(cv)return cv;
  }
  const tmpl=QTMPL[quality];
  if(!tmpl)return null;
  return transposeFromTemplate(tmpl,targetNote);
}

const PROGS_RN=[
  {title:'ii–V–I',feel:'Jazz',desc:'The cornerstone of jazz. ii creates tension, V raises it, I resolves.',chords:[{rn:'ii',q:'m7'},{rn:'V',q:'7'},{rn:'I',q:'maj7'}]},
  {title:'I–VI–ii–V',feel:'Jazz',desc:'Classic turnaround moving through the relative minor and subdominant.',chords:[{rn:'I',q:'maj7'},{rn:'VI',q:'7'},{rn:'ii',q:'m7'},{rn:'V',q:'7'}]},
  {title:'iii–VI–ii–V',feel:'Jazz',desc:'Extended turnaround starting on the mediant. Common in AABA forms.',chords:[{rn:'iii',q:'m7'},{rn:'VI',q:'7'},{rn:'ii',q:'m7'},{rn:'V',q:'7'}]},
  {title:'I–IV–iii–VI–ii–V–I',feel:'Jazz',desc:'Long-form turnaround through the full diatonic cycle. Heard in standards like Misty.',chords:[{rn:'I',q:'maj7'},{rn:'IV',q:'maj7'},{rn:'iii',q:'m7'},{rn:'VI',q:'7'},{rn:'ii',q:'m7'},{rn:'V',q:'7'},{rn:'I',q:'maj7'}]},
  {title:'Minor ii–V–i',feel:'Jazz',desc:'Dark jazz minor cadence. Half-diminished creates tritone tension, altered dominant resolves.',chords:[{rn:'ii',q:'m7b5'},{rn:'V',q:'7b9'},{rn:'i',q:'m7'}]},
  {title:'Minor i–VI–ii–V',feel:'Jazz',desc:'Minor key turnaround. The bVI gives it its distinctively dark, cinematic quality.',chords:[{rn:'i',q:'m7'},{rn:'bVI',q:'maj7'},{rn:'ii',q:'m7b5'},{rn:'V',q:'7b9'}]},
  {title:'Backdoor ii–V',feel:'Jazz',desc:'bVII7 approaches I from below — the "backdoor" substitution for the standard V.',chords:[{rn:'I',q:'maj7'},{rn:'bVII',q:'7'},{rn:'IV',q:'maj7'},{rn:'I',q:'maj7'}]},
  {title:'Tritone Substitution',feel:'Jazz',desc:'bII7 replaces V7. The tritone relationship creates a smooth chromatic bass descent.',chords:[{rn:'ii',q:'m7'},{rn:'bII',q:'7'},{rn:'I',q:'maj7'}]},
  {title:'I–II7–V–I',feel:'Jazz',desc:'Secondary dominant II7 briefly tonicises V before resolving.',chords:[{rn:'I',q:'maj7'},{rn:'II',q:'7'},{rn:'V',q:'7'},{rn:'I',q:'maj7'}]},
  {title:'Coltrane Changes',feel:'Jazz',desc:'Three Imaj7 chords a major 3rd apart, each with its V7. A cycle that shook jazz harmony.',chords:[{rn:'I',q:'maj7'},{rn:'III',q:'7'},{rn:'bVI',q:'maj7'},{rn:'I',q:'7'},{rn:'IV',q:'maj7'},{rn:'bVI',q:'7'}]},
  {title:'Rhythm Changes · A section',feel:'Jazz',desc:"I–VI–ii–V in Bb — Gershwin's I Got Rhythm, backbone of bebop for 80+ years.",chords:[{rn:'I',q:'maj7'},{rn:'VI',q:'7'},{rn:'ii',q:'m7'},{rn:'V',q:'7'}]},
  {title:'Rhythm Changes · B section',feel:'Jazz',desc:'III7–VI7–II7–V7 — a chain of secondary dominants descending the circle of 5ths.',chords:[{rn:'III',q:'7'},{rn:'VI',q:'7'},{rn:'II',q:'7'},{rn:'V',q:'7'}]},
  {title:'Jazz Waltz · I–VI–ii–V',feel:'Jazz',desc:'Classic turnaround in 3/4. The lilting feel gives familiar harmony new life.',chords:[{rn:'I',q:'maj7'},{rn:'VI',q:'7'},{rn:'ii',q:'m7'},{rn:'V',q:'7'}]},
  {title:'So What / Modal Vamp',feel:'Jazz',desc:'i7 with a brief shift to bii7. Floating Dorian quality with no strong resolution.',chords:[{rn:'i',q:'m7'},{rn:'bii',q:'m7'}]},
  {title:'Dorian Vamp · i–IV',feel:'Jazz',desc:'Minor i7 to IV7. The major IV chord gives the Dorian mode its characteristic bright colour.',chords:[{rn:'i',q:'m7'},{rn:'IV',q:'7'}]},
  {title:'Autumn Leaves',feel:'Jazz',desc:'ii–V–I–IV descending through the cycle of 4ths. The most used standard template.',chords:[{rn:'ii',q:'m7'},{rn:'V',q:'7'},{rn:'I',q:'maj7'},{rn:'IV',q:'maj7'}]},
  {title:'Misty · opening',feel:'Jazz',desc:'Imaj7–bIII7–ii–V. The unexpected bIII7 secondary dominant gives Misty its lush opening.',chords:[{rn:'I',q:'maj7'},{rn:'bIII',q:'7'},{rn:'ii',q:'m7'},{rn:'V',q:'7'}]},
  {title:'12-Bar Blues',feel:'Blues',desc:'The foundation. I7–IV7–V7 pattern. Infinite expression.',chords:[{rn:'I',q:'7'},{rn:'IV',q:'7'},{rn:'V',q:'7'}]},
  {title:'Quick Change Blues',feel:'Blues',desc:'Bar 2 jumps to IV7 then back to I7. Creates extra movement in the first four bars.',chords:[{rn:'I',q:'7'},{rn:'IV',q:'7'},{rn:'I',q:'7'},{rn:'V',q:'7'}]},
  {title:'Minor Blues',feel:'Blues',desc:'The darker sibling. i7–iv7–V7b9 gives a melancholic, soulful quality.',chords:[{rn:'i',q:'m7'},{rn:'iv',q:'m7'},{rn:'V',q:'7b9'}]},
  {title:'Jazz Blues',feel:'Blues',desc:'Blues with jazz ii–V substitutions into IV. The Bird and Monk standard template.',chords:[{rn:'I',q:'7'},{rn:'IV',q:'7'},{rn:'ii',q:'m7'},{rn:'V',q:'7'},{rn:'I',q:'7'},{rn:'bVII',q:'7'}]},
  {title:'8-Bar Blues',feel:'Blues',desc:'Compact form: I–V–IV–I. Common in country blues and early rock.',chords:[{rn:'I',q:'7'},{rn:'V',q:'7'},{rn:'IV',q:'7'},{rn:'I',q:'7'}]},
  {title:'I–V–vi–IV',feel:'Pop',desc:'The "axis" progression. Underlies hundreds of hit songs across every era of pop music.',chords:[{rn:'I',q:'maj'},{rn:'V',q:'maj'},{rn:'vi',q:'min'},{rn:'IV',q:'maj'}]},
  {title:'vi–IV–I–V',feel:'Pop',desc:'Axis starting on the relative minor. Same four chords, distinctly darker feel.',chords:[{rn:'vi',q:'min'},{rn:'IV',q:'maj'},{rn:'I',q:'maj'},{rn:'V',q:'maj'}]},
  {title:'I–IV–V',feel:'Folk/Country',desc:'Three chords, a million songs. The backbone of folk, country, and rock n roll.',chords:[{rn:'I',q:'maj'},{rn:'IV',q:'maj'},{rn:'V',q:'maj'}]},
  {title:'I–vi–IV–V',feel:'Pop',desc:'The "50s progression". Doo-wop, early rock and roll, and countless ballads.',chords:[{rn:'I',q:'maj'},{rn:'vi',q:'min'},{rn:'IV',q:'maj'},{rn:'V',q:'maj'}]},
  {title:'I–V–vi–iii–IV',feel:'Pop',desc:'Extended pop loop. The iii minor adds unexpected depth before landing on IV.',chords:[{rn:'I',q:'maj'},{rn:'V',q:'maj'},{rn:'vi',q:'min'},{rn:'iii',q:'min'},{rn:'IV',q:'maj'}]},
  {title:'I–iii–IV–V',feel:'Pop',desc:'The mediant iii creates a flowing, optimistic quality heard in soul and pop classics.',chords:[{rn:'I',q:'maj'},{rn:'iii',q:'min'},{rn:'IV',q:'maj'},{rn:'V',q:'maj'}]},
  {title:'I–ii–IV–V',feel:'Pop',desc:'The ii minor adds a jazzy stepping-stone between I and IV. Smooth and melodic.',chords:[{rn:'I',q:'maj'},{rn:'ii',q:'min'},{rn:'IV',q:'maj'},{rn:'V',q:'maj'}]},
  {title:'IV–I–V–vi',feel:'Pop',desc:'Axis starting on IV. Opens with an immediate uplifting, anthemic feel.',chords:[{rn:'IV',q:'maj'},{rn:'I',q:'maj'},{rn:'V',q:'maj'},{rn:'vi',q:'min'}]},
  {title:'I–bVII–IV',feel:'Rock',desc:'Borrowing bVII from Mixolydian gives rock its raw, anthemic quality. Hendrix to Oasis.',chords:[{rn:'I',q:'maj'},{rn:'bVII',q:'maj'},{rn:'IV',q:'maj'}]},
  {title:'i–bVII–bVI–V',feel:'Rock',desc:'Natural minor descent. From Flamenco to metal to film scores — dark and inevitable.',chords:[{rn:'i',q:'min'},{rn:'bVII',q:'maj'},{rn:'bVI',q:'maj'},{rn:'V',q:'maj'}]},
  {title:'i–bVI–bVII–i',feel:'Rock',desc:'Aeolian loop. The bVI and bVII create an open-ended modal quality widely used in rock.',chords:[{rn:'i',q:'min'},{rn:'bVI',q:'maj'},{rn:'bVII',q:'maj'},{rn:'i',q:'min'}]},
  {title:'I–bVI–bVII–I',feel:'Rock',desc:'Borrowed from parallel minor in a major key. Dramatic and cinematic.',chords:[{rn:'I',q:'maj'},{rn:'bVI',q:'maj'},{rn:'bVII',q:'maj'},{rn:'I',q:'maj'}]},
  {title:'I–III7–IV–iv',feel:'Neo-Soul/R&B',desc:'The chromatic III7→iv colour shift is the neo-soul signature. Rich and sophisticated.',chords:[{rn:'I',q:'maj7'},{rn:'III',q:'7'},{rn:'IV',q:'maj7'},{rn:'iv',q:'m7'}]},
  {title:'I–IV–iii–vi',feel:'R&B/Soul',desc:'Stepping down from IV through iii to vi creates warmth and forward motion.',chords:[{rn:'I',q:'maj7'},{rn:'IV',q:'maj7'},{rn:'iii',q:'m7'},{rn:'vi',q:'m7'}]},
  {title:'ii–IV–I',feel:'R&B/Soul',desc:'Bypasses V entirely. Moving ii→IV→I feels lush and inevitable.',chords:[{rn:'ii',q:'m7'},{rn:'IV',q:'maj7'},{rn:'I',q:'maj7'}]},
  {title:'i–bIII–bVII–IV',feel:'Neo-Soul',desc:'Minor with borrowed major chords. Sophisticated, emotionally complex loop.',chords:[{rn:'i',q:'m7'},{rn:'bIII',q:'maj7'},{rn:'bVII',q:'7'},{rn:'IV',q:'maj7'}]},
  {title:'I–bIII–IV',feel:'Funk/Soul',desc:'Parallel minor bIII gives funk and soul its gritty edge. Direct and powerful.',chords:[{rn:'I',q:'7'},{rn:'bIII',q:'7'},{rn:'IV',q:'7'}]},
  {title:'I–IV Plagal Cadence',feel:'Gospel',desc:'The "Amen" movement. Foundational to gospel, blues, and spirituals.',chords:[{rn:'I',q:'7'},{rn:'IV',q:'7'}]},
  {title:'I7–IV7–V7',feel:'Gospel',desc:'The gospel shuffle. Dominant 7ths throughout give it raw, soulful energy.',chords:[{rn:'I',q:'7'},{rn:'IV',q:'7'},{rn:'V',q:'7'}]},
  {title:'I–I7–IV–iv',feel:'Gospel',desc:'Moving I→I7 tonicises IV, then iv minor adds bluesy colour before returning home.',chords:[{rn:'I',q:'maj'},{rn:'I',q:'7'},{rn:'IV',q:'maj'},{rn:'iv',q:'min'}]},
  {title:'Bossa Nova · I–vi–ii–V',feel:'Bossa Nova',desc:'The classic bossa loop. Smooth voice leading, gentle movement, Brazilian jazz.',chords:[{rn:'I',q:'maj7'},{rn:'vi',q:'m7'},{rn:'ii',q:'m7'},{rn:'V',q:'7sus4'}]},
  {title:'Samba · I–vi–ii–V',feel:'Samba',desc:'Same cycle as bossa but with a driving samba feel. Celebratory and energetic.',chords:[{rn:'I',q:'maj'},{rn:'vi',q:'min'},{rn:'ii',q:'min'},{rn:'V',q:'7'}]},
  {title:'Flamenco Cadence',feel:'Flamenco',desc:'i–bVII–bVI–V. Ancient Phrygian descent. Dramatic, cinematic, and deeply emotional.',chords:[{rn:'i',q:'min'},{rn:'bVII',q:'maj'},{rn:'bVI',q:'maj'},{rn:'V',q:'maj'}]},
  {title:'Tango · i–V',feel:'Tango',desc:'Minor-to-dominant oscillation gives tango its tense, seductive quality.',chords:[{rn:'i',q:'min'},{rn:'V',q:'7'}]},
  {title:'i–iv–V–i',feel:'Classical',desc:'Harmonic minor cadence. The raised 7th in V creates its characteristic pull to tonic.',chords:[{rn:'i',q:'min'},{rn:'iv',q:'min'},{rn:'V',q:'7'},{rn:'i',q:'min'}]},
  {title:'Pachelbel Canon',feel:'Classical',desc:"I–V–vi–iii–IV–I–IV–V. One of history's most reused progressions — timeless.",chords:[{rn:'I',q:'maj'},{rn:'V',q:'maj'},{rn:'vi',q:'min'},{rn:'iii',q:'min'},{rn:'IV',q:'maj'},{rn:'I',q:'maj'},{rn:'IV',q:'maj'},{rn:'V',q:'maj'}]},
  {title:'Perfect Cadence · V–I',feel:'Classical',desc:'V creates maximum harmonic tension; I resolves it. The most fundamental move in Western music.',chords:[{rn:'V',q:'7'},{rn:'I',q:'maj'}]},
  {title:'Deceptive Cadence · V–vi',feel:'Classical',desc:'V resolves to vi instead of I, surprising the listener. Creates forward momentum.',chords:[{rn:'V',q:'7'},{rn:'vi',q:'min'}]},
  {title:'Neapolitan · bII–V–I',feel:'Classical',desc:'The Neapolitan chord (bII major) adds a dramatic Romantic-era colour before V–I.',chords:[{rn:'bII',q:'maj'},{rn:'V',q:'7'},{rn:'I',q:'maj'}]},
  // ── SUS chord progressions ──────────────────────────────────────────────
  {title:'I–Vsus4–V–I',feel:'Classical/Pop',desc:'The suspended 4th on V delays resolution, creating anticipation. Heard in everything from Bach to pop ballads.',chords:[{rn:'I',q:'maj'},{rn:'V',q:'sus4'},{rn:'V',q:'maj'},{rn:'I',q:'maj'}]},
  {title:'I9sus4–I7–IV',feel:'Soul/R&B',desc:'The 9sus4 "floating" sound resolving through the dominant 7th to IV. A signature move in soul and gospel.',chords:[{rn:'I',q:'9sus4'},{rn:'I',q:'7'},{rn:'IV',q:'maj7'}]},
  {title:'IV9sus4–I–IV9sus4–V',feel:'Jazz Fusion',desc:'Suspended dominants create an unresolved modal floating quality. Classic Miles Davis electric era.',chords:[{rn:'IV',q:'9sus4'},{rn:'I',q:'maj7'},{rn:'IV',q:'9sus4'},{rn:'V',q:'7sus4'}]},
  {title:'i–Vsus4–V–i',feel:'Classical',desc:'Minor key suspension. The sus4 delay makes the resolution to harmonic minor V feel inevitable.',chords:[{rn:'i',q:'min'},{rn:'V',q:'sus4'},{rn:'V',q:'7'},{rn:'i',q:'min'}]},
  {title:'Isus2–I–IVsus2–IV',feel:'Rock/Pop',desc:'Sus2 colours give a hazy, impressionistic quality. Widely used in guitar-driven rock and singer-songwriter.',chords:[{rn:'I',q:'sus2'},{rn:'I',q:'maj'},{rn:'IV',q:'sus2'},{rn:'IV',q:'maj'}]},
  // ── AUGMENTED chord progressions ────────────────────────────────────────
  {title:'I–I+–IV–iv',feel:'Pop/Soul',desc:'The tonic augmented chord creates a rising chromatic bass line (R→#5→R of IV). James Taylor, Beatles, bossa nova.',chords:[{rn:'I',q:'maj'},{rn:'I',q:'aug'},{rn:'IV',q:'maj'},{rn:'iv',q:'min'}]},
  {title:'I–VI+–ii–V',feel:'Jazz',desc:'Augmented VI substitutes for the dominant VI7, creating a chromatic approach into ii. Lush and chromatic.',chords:[{rn:'I',q:'maj7'},{rn:'VI',q:'aug'},{rn:'ii',q:'m7'},{rn:'V',q:'7'}]},
  {title:'IΔ#5–IV–IΔ#5–V',feel:'Jazz',desc:'Maj7#5 as the tonic sound — the Lydian augmented quality. Static, dreamy, and harmonically ambiguous.',chords:[{rn:'I',q:'maj7s5'},{rn:'IV',q:'maj7'},{rn:'I',q:'maj7s5'},{rn:'V',q:'7'}]},
  // ── 6TH CHORD progressions ──────────────────────────────────────────────
  {title:'I6–vi–ii–V',feel:'Jazz',desc:'The major 6th tonic is warmer and less static than maj7. Common in older jazz standards and stride piano style.',chords:[{rn:'I',q:'6'},{rn:'vi',q:'m7'},{rn:'ii',q:'m7'},{rn:'V',q:'7'}]},
  {title:'I6/9–IV6/9–ii9–V13',feel:'Jazz',desc:'All-extensions progression. 6/9 tonics, a ii9, and a V13 — the fully voiced jazz harmony palette.',chords:[{rn:'I',q:'6'},{rn:'IV',q:'6'},{rn:'ii',q:'9'},{rn:'V',q:'9'}]},
  {title:'im6–iv–V7b9–im6',feel:'Jazz Minor',desc:'The minor 6 tonic chord (used by Wes Montgomery and Bill Evans) — richer than plain minor, no b7 tension.',chords:[{rn:'i',q:'m6'},{rn:'iv',q:'m7'},{rn:'V',q:'7b9'},{rn:'i',q:'m6'}]},
  {title:'I–I+–I6–I7',feel:'Blues/Soul',desc:'Chromatic voice leading on a static tonic: R→#5→6→b7. Common in slow blues and Ray Charles-style soul.',chords:[{rn:'I',q:'maj'},{rn:'I',q:'aug'},{rn:'I',q:'6'},{rn:'I',q:'7'}]},
  // ── LYDIAN progressions ─────────────────────────────────────────────────
  {title:'IΔ9#11–V–IΔ9#11',feel:'Modal Jazz',desc:'Maj9#11 as a static Lydian tonic. The #11 gives a shimmering, floating quality without strong resolution.',chords:[{rn:'I',q:'maj9s11'},{rn:'V',q:'7'},{rn:'I',q:'maj9s11'}]},
  {title:'IV9#11–I–IV9#11–bVII7',feel:'Jazz Fusion',desc:'Lydian dominant IV — the #11 lights up the IV chord. Combines with a bluesy bVII7 for fusion colour.',chords:[{rn:'IV',q:'9s11'},{rn:'I',q:'maj7'},{rn:'IV',q:'9s11'},{rn:'bVII',q:'7'}]},
  // ── QUARTAL progressions ──────────────────────────────────────────────
  {title:'Quartal Vamp · i–bii',feel:'Modal Jazz',desc:"Two quartal chords a half step apart — the So What sound. Harmonically ambiguous, no strong tonal pull. McCoy Tyner's signature.",chords:[{rn:'i',q:'m9'},{rn:'bii',q:'m9'}]},
  {title:'Quartal landing · IΔ9–V7sus4–IΔ9',feel:'Modal Jazz',desc:'Stable extended tonic with a suspended dominant. Pat Metheny and Keith Jarrett territory — diatonic but open-voiced.',chords:[{rn:'I',q:'maj9'},{rn:'V',q:'7sus4'},{rn:'I',q:'maj9'}]},
  {title:'Quartal blues · I9–IV9sus4–I9–V9sus4',feel:'Blues',desc:'Blues with quartal-flavoured dominant 9th and suspended chords. The Herbie Hancock Maiden Voyage harmonic world.',chords:[{rn:'I',q:'9'},{rn:'IV',q:'9sus4'},{rn:'I',q:'9'},{rn:'V',q:'9sus4'}]},
  // ── min(Δ7) progressions ──────────────────────────────────────────────
  {title:'i(Δ7)–im7–iv–V',feel:'Jazz Minor',desc:'The classic My Funny Valentine inner-voice descent: Δ7→b7 in the tonic, voice-leading into the subdominant.',chords:[{rn:'i',q:'mMaj7'},{rn:'i',q:'m7'},{rn:'iv',q:'m7'},{rn:'V',q:'7'}]},
  {title:'im(Δ7)–iv9–bVIΔ–V7b9',feel:'Jazz Minor',desc:'Minor-major 7th tonic into a dark jazz-minor cadence. Cinematic and emotionally rich.',chords:[{rn:'i',q:'mMaj7'},{rn:'iv',q:'m9'},{rn:'bVI',q:'maj7'},{rn:'V',q:'7b9'}]},
  // ── Chromatic inner-voice ─────────────────────────────────────────────
  {title:'I–I+–IVΔ7–IVm6',feel:'Pop/Soul',desc:"The chromatic 5th descent (R→#5→R of IV): I, I+, IVΔ, IVm. Beatles' Michelle, bossa nova, James Taylor.",chords:[{rn:'I',q:'maj'},{rn:'I',q:'aug'},{rn:'IV',q:'maj7'},{rn:'iv',q:'m6'}]},
  {title:'I–I+–IVΔ9–ivm',feel:'Soul/R&B',desc:'Same chromatic bass line as above but with extended maj9 tonic landing, giving a richer contemporary feel.',chords:[{rn:'I',q:'maj'},{rn:'I',q:'aug'},{rn:'IV',q:'maj9'},{rn:'iv',q:'min'}]},
  // ── Extended smooth jazz ──────────────────────────────────────────────
  {title:'IΔ9–iiim9–vim9–bVII9',feel:'Smooth Jazz',desc:'Smooth descending diatonic + borrowed 9th chords. Every note of movement is a 9th chord — the Wes Montgomery and Mike Stern vocabulary.',chords:[{rn:'I',q:'maj9'},{rn:'iii',q:'m9'},{rn:'vi',q:'m9'},{rn:'bVII',q:'9'}]},
  {title:'ii9–V9sus4–IΔ9',feel:'Jazz',desc:'Modern jazz landing: suspended V with extensions resolves to a fully voiced tonic. Herbie Hancock and Chick Corea hallmark.',chords:[{rn:'ii',q:'m9'},{rn:'V',q:'9sus4'},{rn:'I',q:'maj9'}]},
  {title:'IΔ9–iiim7–ii9–V9',feel:'Jazz',desc:'Smooth diatonic cycle: tonic→mediant→subdominant→dominant, all voiced with extensions. Sophisticated and forward-moving.',chords:[{rn:'I',q:'maj9'},{rn:'iii',q:'m7'},{rn:'ii',q:'9'},{rn:'V',q:'9'}]},
  // ── 6th chord jazz ────────────────────────────────────────────────────
  {title:'im6–bVIIΔ7–bVI6–V7',feel:'Jazz Minor',desc:'Minor 6th tonic — a warmer sound with no b7 tension. Through bVII and bVI6 before resolving. Grant Green, Wes Montgomery.',chords:[{rn:'i',q:'m6'},{rn:'bVII',q:'maj7'},{rn:'bVI',q:'6'},{rn:'V',q:'7'}]},
  {title:'I6–IV9–I6–V9',feel:'Blues',desc:'Jazz blues with 6th and 9th dominant chords throughout. The Grant Green and Wes Montgomery blues vocabulary.',chords:[{rn:'I',q:'6'},{rn:'IV',q:'9'},{rn:'I',q:'6'},{rn:'V',q:'9'}]},
];

function ProgressionsTab({showDeg}){
  const[keyNote,setKeyNote]=useState(0);
  const[broadCat,setBroadCat]=useState('all');
  const[search,setSearch]=useState('');
  const[sel,setSel]=useState(null);
  const[showCowboy,setShowCowboy]=useState(false);
  const list=useMemo(()=>{
    let r=broadCat==='all'?PROGS_RN:PROGS_RN.filter(p=>(FEEL_TO_CAT[p.feel]||'Jazz')===broadCat);
    if(search.trim()){const q=search.toLowerCase();r=r.filter(p=>p.title.toLowerCase().includes(q)||p.feel.toLowerCase().includes(q)||p.chords.some(c=>c.rn.toLowerCase().includes(q)));}
    return r;
  },[broadCat,search]);
  const prog=sel!=null?PROGS_RN[sel]:null;
  const getProgVoicings=useCallback(p=>p.chords.map(c=>({...c,name:getChordName(keyNote,c.rn,c.q),voicing:getVoicing(keyNote,c.rn,c.q,showCowboy)})),[keyNote,showCowboy]);

  if(prog){
    const slots=getProgVoicings(prog);
    const bc=BROAD_CATS.find(b=>b.id===(FEEL_TO_CAT[prog.feel]||'Jazz'));
    return(
      <div style={{padding:'14px',maxWidth:'600px',margin:'0 auto'}}>
        <button onClick={()=>setSel(null)} style={{background:'transparent',border:'1px solid #2a2840',color:'#aaa',padding:'5px 14px',borderRadius:'8px',cursor:'pointer',marginBottom:'12px',fontSize:'12px'}}>← Back</button>
        <div style={{marginBottom:'12px'}}>
          <div style={{display:'flex',gap:'6px',alignItems:'center',flexWrap:'wrap',marginBottom:'3px'}}>
            <div style={{fontSize:'20px',fontWeight:900,color:'#fff'}}>{prog.title}</div>
            {bc&&<span style={{fontSize:'9px',background:bc.color+'22',color:bc.color,padding:'2px 8px',borderRadius:'5px',fontWeight:700}}>{bc.emoji} {prog.feel}</span>}
          </div>
          <div style={{fontSize:'12px',color:'#bbb',lineHeight:'1.5',marginBottom:'8px'}}>{prog.desc}</div>
          <div style={{display:'flex',gap:'4px',alignItems:'center',flexWrap:'wrap'}}>
            {prog.chords.map((c,i)=>(
              <span key={i} style={{display:'flex',alignItems:'center',gap:'3px'}}>
                <span style={{background:'#1a1928',border:'1px solid #2a2840',borderRadius:'6px',padding:'3px 8px',fontSize:'12px',color:'#fff',fontWeight:700}}>{c.rn}<span style={{color:'#ffd93d',fontSize:'10px',marginLeft:'2px'}}>{Q_SUFFIX[c.q]||c.q}</span></span>
                {i<prog.chords.length-1&&<span style={{color:'#333',fontSize:'11px'}}>→</span>}
              </span>
            ))}
          </div>
        </div>
        <div style={{marginBottom:'14px',background:'#13121f',borderRadius:'9px',padding:'8px 10px',border:'1px solid #2a2840'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
            <div style={{fontSize:'10px',color:'#888',textTransform:'uppercase',letterSpacing:'2px'}}>Key: <span style={{color:'#ffd93d'}}>{NOTE_NAMES[keyNote]}</span></div>
            <button onClick={()=>setShowCowboy(p=>!p)} style={{fontSize:'10px',fontWeight:700,padding:'3px 10px',borderRadius:'8px',cursor:'pointer',touchAction:'manipulation',border:`1px solid ${showCowboy?'#74b9ff':'#2a2840'}`,background:showCowboy?'#74b9ff22':'transparent',color:showCowboy?'#74b9ff':'#555',transition:'all .15s'}}>
              {showCowboy?'🎸 Open Pos.':'🎸 Open Pos.'}
            </button>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
            {NOTE_NAMES.map((n,i)=>(
              <button key={i} onClick={()=>setKeyNote(i)} style={{padding:'4px 8px',borderRadius:'7px',cursor:'pointer',fontSize:'12px',fontWeight:700,border:`1px solid ${i===keyNote?'#ffd93d':'#2a2840'}`,background:i===keyNote?'#ffd93d22':'transparent',color:i===keyNote?'#ffd93d':'#777',transition:'all .15s',minHeight:'30px'}}>{n}</button>
            ))}
          </div>
          {showCowboy&&<div style={{fontSize:'10px',color:'#74b9ff',marginTop:'5px'}}>Using open/cowboy voicings where available</div>}
        </div>
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap',justifyContent:'center',marginBottom:'14px'}}>
          {slots.map((s,i)=>(
            <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
              <div style={{background:'#13121f',borderRadius:'10px',padding:'10px 8px 8px',border:'1px solid #2a2840',minWidth:'88px',textAlign:'center'}}>
                {s.voicing?(<>
                  <ChordDiagram v={s.voicing} showDeg={showDeg} size={0.95}/>
                  <div style={{fontSize:'13px',fontWeight:900,color:'#fff',marginTop:'3px'}}>{s.name}</div>
                  <div style={{fontSize:'10px',color:'#ffd93d',marginTop:'1px',marginBottom:'5px',fontWeight:700}}>{s.rn}</div>
                  <PlayButtons v={s.voicing} size="sm" stack/>
                </>):(
                  <div style={{padding:'20px 8px',color:'#555',fontSize:'11px'}}>{s.name}<br/><span style={{fontSize:'9px'}}>no voicing</span></div>
                )}
              </div>
              {i<slots.length-1&&<div style={{color:'#333',fontSize:'16px',marginTop:'6px'}}>→</div>}
            </div>
          ))}
        </div>
        <div style={{background:'#13121f',borderRadius:'10px',padding:'10px 12px',border:'1px solid #2a2840'}}>
          <div style={{fontSize:'10px',color:'#888',textTransform:'uppercase',letterSpacing:'2px',marginBottom:'8px'}}>Function in key of {NOTE_NAMES[keyNote]}</div>
          <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
            {slots.map((s,i)=>(
              <div key={i} style={{background:'#0f0e17',borderRadius:'7px',padding:'6px 10px',border:'1px solid #2a2840',textAlign:'center',minWidth:'56px'}}>
                <div style={{fontSize:'12px',fontWeight:900,color:'#ffd93d'}}>{s.rn}</div>
                <div style={{fontSize:'11px',color:'#fff',marginTop:'1px',fontWeight:700}}>{s.name}</div>
                <div style={{fontSize:'9px',color:'#666',marginTop:'1px'}}>{s.q}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return(
    <div style={{padding:'14px',maxWidth:'600px',margin:'0 auto'}}>
      <div style={{marginBottom:'10px'}}>
        <div style={{fontSize:'16px',fontWeight:900,color:'#fff',marginBottom:'2px'}}>Progressions</div>
        <div style={{fontSize:'11px',color:'#999'}}>{PROGS_RN.length} progressions · all styles · transpose to any key</div>
      </div>
      <div style={{background:'#13121f',borderRadius:'9px',padding:'8px 10px',border:'1px solid #2a2840',marginBottom:'10px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'5px'}}>
          <div style={{fontSize:'10px',color:'#888',textTransform:'uppercase',letterSpacing:'2px'}}>Key: <span style={{color:'#ffd93d',fontWeight:700}}>{NOTE_NAMES[keyNote]}</span></div>
          <button onClick={()=>setShowCowboy(p=>!p)} style={{fontSize:'10px',fontWeight:700,padding:'3px 10px',borderRadius:'8px',cursor:'pointer',touchAction:'manipulation',border:`1px solid ${showCowboy?'#74b9ff':'#2a2840'}`,background:showCowboy?'#74b9ff22':'transparent',color:showCowboy?'#74b9ff':'#555',transition:'all .15s'}}>
            🎸 Open Pos.
          </button>
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:'3px'}}>
          {NOTE_NAMES.map((n,i)=>(
            <button key={i} onClick={()=>setKeyNote(i)} style={{padding:'4px 7px',borderRadius:'6px',cursor:'pointer',fontSize:'11px',fontWeight:700,border:`1px solid ${i===keyNote?'#ffd93d':'#2a2840'}`,background:i===keyNote?'#ffd93d22':'transparent',color:i===keyNote?'#ffd93d':'#666',transition:'all .15s',minHeight:'28px'}}>{n}</button>
          ))}
        </div>
        {showCowboy&&<div style={{fontSize:'10px',color:'#74b9ff',marginTop:'5px'}}>Open/cowboy voicings where available</div>}
      </div>
      <div style={{position:'relative',marginBottom:'10px'}}>
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search progressions…"
          style={{width:'100%',background:'#13121f',border:'1px solid #2a2840',borderRadius:'9px',padding:'8px 32px 8px 12px',color:'#fff',fontSize:'13px',boxSizing:'border-box',outline:'none'}}/>
        {search&&<button onClick={()=>setSearch('')} style={{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',background:'transparent',border:'none',color:'#666',fontSize:'18px',cursor:'pointer',padding:'0',lineHeight:'1'}}>×</button>}
      </div>
      {!search&&(
        <div style={{display:'flex',gap:'5px',marginBottom:'10px',flexWrap:'wrap'}}>
          <button onClick={()=>setBroadCat('all')} style={{padding:'6px 12px',borderRadius:'20px',cursor:'pointer',fontSize:'11px',fontWeight:700,border:'none',background:broadCat==='all'?'#a29bfe':'#1a1928',color:broadCat==='all'?'#111':'#aaa',transition:'all .15s'}}>All ({PROGS_RN.length})</button>
          {BROAD_CATS.map(bc=>{const n=PROGS_RN.filter(p=>(FEEL_TO_CAT[p.feel]||'Jazz')===bc.id).length;const on=broadCat===bc.id;return(<button key={bc.id} onClick={()=>setBroadCat(bc.id)} style={{padding:'6px 12px',borderRadius:'20px',cursor:'pointer',fontSize:'11px',fontWeight:700,border:`1px solid ${on?bc.color:bc.color+'33'}`,background:on?bc.color+'22':'#1a1928',color:on?bc.color:'#aaa',transition:'all .15s'}}>{bc.emoji} {bc.label} <span style={{opacity:0.7}}>({n})</span></button>);})}
        </div>
      )}
      {search&&<div style={{fontSize:'10px',color:'#666',marginBottom:'6px'}}>{list.length} result{list.length!==1?'s':''}</div>}
      <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
        {list.map(p=>{
          const idx=PROGS_RN.indexOf(p);
          const chordNames=p.chords.map(c=>getChordName(keyNote,c.rn,c.q));
          const bc=BROAD_CATS.find(b=>b.id===(FEEL_TO_CAT[p.feel]||'Jazz'));
          return(
            <div key={idx} onClick={()=>setSel(idx)}
              style={{background:'#13121f',borderRadius:'10px',padding:'10px 12px',border:'1px solid #2a2840',cursor:'pointer',transition:'all .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#a29bfe';e.currentTarget.style.transform='translateY(-1px)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#2a2840';e.currentTarget.style.transform='none';}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'8px'}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'13px',fontWeight:700,color:'#fff',marginBottom:'4px'}}>{p.title}</div>
                  <div style={{display:'flex',gap:'3px',flexWrap:'wrap',alignItems:'center',marginBottom:'4px'}}>
                    {p.chords.map((c,ci)=>(
                      <span key={ci} style={{display:'flex',alignItems:'center',gap:'2px'}}>
                        <span style={{fontSize:'11px',fontWeight:700,color:'#ffd93d',background:'#ffd93d11',padding:'1px 6px',borderRadius:'4px',fontFamily:'monospace'}}>{c.rn}<span style={{fontSize:'9px',opacity:0.8}}>{Q_SUFFIX[c.q]||c.q}</span></span>
                        {ci<p.chords.length-1&&<span style={{color:'#2a2840',fontSize:'10px'}}>›</span>}
                      </span>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:'3px',flexWrap:'wrap',alignItems:'center'}}>
                    {chordNames.map((n,ci)=>(
                      <span key={ci} style={{display:'flex',alignItems:'center',gap:'2px'}}>
                        <span style={{fontSize:'10px',color:'#888',padding:'1px 5px',background:'#1a1928',borderRadius:'4px'}}>{n}</span>
                        {ci<chordNames.length-1&&<span style={{color:'#2a2840',fontSize:'10px'}}>›</span>}
                      </span>
                    ))}
                  </div>
                </div>
                {bc&&<span style={{fontSize:'9px',background:bc.color+'22',color:bc.color,padding:'2px 7px',borderRadius:'5px',fontWeight:700,whiteSpace:'nowrap',marginTop:'2px',flexShrink:0}}>{bc.emoji} {p.feel}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ── CHORD DETAIL ─────────────────────────────────────────────────────────
// Standalone detail view — shared by Library and ChordsOfDay.
// Automatically enables Scale Degrees while open and restores prior state.
function ChordDetail({chord,onBack,showDeg,setShowDeg,mastered,onToggleMastered}){
  const[transRoot,setTransRoot]=useState(null);
  // Local state so the button reflects instantly — parent's mastered prop may
  // not propagate if ChordDetail is inside a memo'd component (ChordsOfDay).
  const[localMastered,setLocalMastered]=useState(()=>!!(mastered&&chord&&mastered.has(chord.id)));

  useEffect(()=>{
    const prev=showDeg;
    setShowDeg(true);
    return()=>setShowDeg(prev);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  if(!chord)return null;
  const ci=CATS[chord.cat];
  const canMaster=!!onToggleMastered&&chord.id&&!chord.id.startsWith('prog_');
  const currentRoot=getRootNote(chord.voicings[0]);
  const canTranspose=chord.movable&&currentRoot!==null&&chord.voicings[0].deg.some((d,i)=>d==='R'&&chord.voicings[0].str[i]>0);
  const displayVoicings=transRoot===null?chord.voicings:chord.voicings.map(v=>transposeVoicing(v,transRoot));
  const uniqueDegs=[...new Set(displayVoicings[0].deg?.filter(Boolean)||[])];

  const handleToggle=()=>{
    const next=!localMastered;
    setLocalMastered(next); // instant UI update
    onToggleMastered(chord.id); // async persist to App state + storage
  };

  return(
    <div style={{padding:'14px',maxWidth:'560px',margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
        <button onClick={onBack} style={{background:'transparent',border:'1px solid #2a2840',color:'#aaa',padding:'5px 14px',borderRadius:'8px',cursor:'pointer',fontSize:'12px',touchAction:'manipulation'}}>← Back</button>
      </div>
      <div style={{textAlign:'center',marginBottom:'14px'}}>
        <span style={{fontSize:'10px',color:ci.color,fontWeight:700,letterSpacing:'3px',textTransform:'uppercase',background:ci.color+'18',padding:'3px 10px',borderRadius:'20px'}}>{ci.label}</span>
        <div style={{fontSize:'24px',fontWeight:900,margin:'8px 0 2px',color:'#fff'}}>{chord.name}</div>
        <div style={{fontSize:'13px',color:'#aaa',fontStyle:'italic'}}>{chord.sym}</div>
      </div>
      {canTranspose&&(()=>{
        const validRoots=getValidTransposeRoots(chord.voicings[0]);
        return(
          <div style={{marginBottom:'14px',background:'#13121f',borderRadius:'10px',padding:'10px 12px',border:'1px solid #2a2840'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'7px'}}>
              <div style={{fontSize:'10px',color:'#888',textTransform:'uppercase',letterSpacing:'2px'}}>Transpose root</div>
              {transRoot!==null&&<button onClick={()=>setTransRoot(null)} style={{fontSize:'10px',color:'#aaa',background:'transparent',border:'1px solid #2a2840',borderRadius:'6px',padding:'2px 8px',cursor:'pointer',touchAction:'manipulation'}}>Reset</button>}
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
              {NOTE_NAMES.map((n,i)=>{
                const isActive=transRoot===null?i===currentRoot:i===transRoot;
                const isOriginal=i===currentRoot;
                const canUse=validRoots.has(i);
                return(
                  <button key={i} onClick={()=>canUse&&setTransRoot(i===currentRoot?null:i)} disabled={!canUse}
                    style={{padding:'5px 8px',borderRadius:'7px',cursor:canUse?'pointer':'not-allowed',fontSize:'12px',fontWeight:700,
                      border:`1px solid ${isActive?'#ffd93d':canUse?'#2a2840':'#1a1928'}`,
                      background:isActive?'#ffd93d22':canUse?'transparent':'transparent',
                      color:isActive?'#ffd93d':canUse?'#888':'#333',
                      transition:'all .15s',minHeight:'32px',
                      textDecoration:!canUse?'line-through':'none',opacity:!canUse?0.35:1,
                      touchAction:'manipulation'}}>
                    {n}{isOriginal&&transRoot!==null?'*':''}
                  </button>
                );
              })}
            </div>
            {transRoot!==null&&<div style={{fontSize:'11px',color:'#ffd93d',marginTop:'6px'}}>Showing {NOTE_NAMES[transRoot]} · fret {displayVoicings[0].sf} &nbsp;<span style={{color:'#666',fontSize:'10px'}}>* = original root ({NOTE_NAMES[currentRoot]})</span></div>}
            {transRoot===null&&<div style={{fontSize:'10px',color:'#555',marginTop:'5px'}}>Greyed notes cannot be played in this shape</div>}
          </div>
        );
      })()}
      <div style={{display:'flex',flexWrap:'wrap',gap:'16px',justifyContent:'center',marginBottom:'14px'}}>
        {displayVoicings.map((v,i)=>(
          <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'8px'}}>
            <div style={{background:'#13121f',borderRadius:'12px',padding:'16px',border:`2px solid ${ci.color}44`}}><ChordDiagram v={v} showDeg={true} size={1.85}/></div>
            <div style={{fontSize:'10px',color:'#888',maxWidth:'160px',textAlign:'center'}}>{v.label}</div>
            <div style={{display:'flex',gap:'6px',alignItems:'center',flexWrap:'wrap',justifyContent:'center'}}>
              <PlayButtons v={v}/>
              {canMaster&&(
                <button onClick={handleToggle}
                  style={{display:'flex',alignItems:'center',gap:'4px',
                    background:localMastered?'#ffd93d22':'transparent',
                    border:`1px solid ${localMastered?'#ffd93d':'#2a2840'}`,
                    color:localMastered?'#ffd93d':'#666',
                    padding:'7px 10px',borderRadius:'7px',cursor:'pointer',fontSize:'11px',fontWeight:700,
                    minHeight:'38px',
                    transition:'background .2s,color .2s,border-color .2s',
                    touchAction:'manipulation',WebkitTapHighlightColor:'transparent'}}>
                  <span style={{fontSize:'13px'}}>{localMastered?'★':'☆'}</span>
                  {localMastered?'Mastered':'Master'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {uniqueDegs.length>0&&(
        <div style={{padding:'10px 12px',background:'#13121f',borderRadius:'10px',border:'1px solid #2a2840'}}>
          <div style={{fontSize:'10px',color:'#888',marginBottom:'8px',letterSpacing:'2px',textTransform:'uppercase'}}>Scale degree guide</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'5px',marginBottom:'10px'}}>
            {uniqueDegs.map(d=>(
              <span key={d} style={{background:DC[d]+'22',color:DC[d],padding:'3px 10px',borderRadius:'10px',fontSize:'12px',fontWeight:700,border:`1px solid ${DC[d]}44`}}>{d}</span>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
            {uniqueDegs.map(d=>(
              <div key={d} style={{display:'flex',alignItems:'center',gap:'8px',padding:'5px 8px',background:'#0f0e17',borderRadius:'7px',border:`1px solid ${DC[d]}33`}}>
                <div style={{width:'10px',height:'10px',borderRadius:'50%',background:DC[d],flexShrink:0}}/>
                <span style={{fontSize:'12px',fontWeight:700,color:DC[d],minWidth:'28px'}}>{d}</span>
                <span style={{fontSize:'11px',color:'#888',lineHeight:'1.3'}}>{DEG_HINT[d]||''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Library({showDeg,setShowDeg,mastered,onToggleMastered,scrollRef}){
  const[cat,setCat]=useState('all');
  const[sel,setSel]=useState(null);
  const[search,setSearch]=useState('');
  const savedScrollY=useRef(0);
  const[transRoot,setTransRoot]=useState(null);
  const[filterOpen,setFilterOpen]=useState(true);
  const[filterMode,setFilterMode]=useState('family');
  // Family filter
  const[family,setFamily]=useState(null);
  // Builder filter
  const[bTriad,setBTriad]=useState(null);
  const[bSeventh,setBSeventh]=useState(null);
  const[bExts,setBExts]=useState(new Set());

  const toggleExt=id=>setBExts(prev=>{const n=new Set(prev);if(n.has(id))n.delete(id);else n.add(id);return n;});
  const clearFilters=()=>{setFamily(null);setBTriad(null);setBSeventh(null);setBExts(new Set());setCat('all');};

  const activeFamilyCount=(family?1:0)+(cat!=='all'?1:0);
  const activeBuilderCount=(bTriad?1:0)+(bSeventh?1:0)+bExts.size+(cat!=='all'?1:0);
  const activeFilterCount=filterMode==='family'?activeFamilyCount:activeBuilderCount;

  const builderCombo=useMemo(()=>{
    if(!bTriad&&!bSeventh)return null;
    return BUILDER_COMBO[`${bTriad||'?'}|${bSeventh||'?'}`]||null;
  },[bTriad,bSeventh]);

  const list=useMemo(()=>{
    let r=cat==='all'?CHORDS:CHORDS.filter(c=>c.cat===cat);
    if(filterMode==='family'&&family){
      r=r.filter(chord=>{
        const degs=new Set((chord.voicings[0].deg||[]).filter(Boolean));
        return FAMILY_TESTS[family]&&FAMILY_TESTS[family](degs);
      });
    }else if(filterMode==='builder'){
      r=r.filter(chord=>{
        const degs=new Set((chord.voicings[0].deg||[]).filter(Boolean));
        if(bTriad&&!(TRIAD_TESTS[bTriad]&&TRIAD_TESTS[bTriad](degs)))return false;
        if(bSeventh&&!(SEVENTH_TESTS[bSeventh]&&SEVENTH_TESTS[bSeventh](degs)))return false;
        if(bExts.size>0){const ok=[...bExts].some(e=>EXT_TESTS[e]&&EXT_TESTS[e](degs));if(!ok)return false;}
        return true;
      });
    }
    return r;
  },[cat,filterMode,family,bTriad,bSeventh,bExts]);

  const chord=sel?CHORDS.find(c=>c.id===sel):null;
  const handleSel=id=>{
    savedScrollY.current=scrollRef&&scrollRef.current?scrollRef.current.scrollTop:0;
    if(scrollRef&&scrollRef.current)scrollRef.current.scrollTop=0;
    setSel(id);setTransRoot(null);
  };

  if(chord){
    return <ChordDetail chord={chord} onBack={()=>{setSel(null);setTransRoot(null);requestAnimationFrame(()=>{if(scrollRef&&scrollRef.current)scrollRef.current.scrollTop=savedScrollY.current;});}} showDeg={showDeg} setShowDeg={setShowDeg} mastered={mastered} onToggleMastered={onToggleMastered}/>;
  }

  // ── Helper: chord type strip (shared by both filter modes)
  const CatStrip=()=>(
    <div>
      <div style={{fontSize:'9px',color:'#555',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'6px',fontWeight:700}}>Chord Type</div>
      <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
        <button onClick={()=>setCat('all')} style={{padding:'5px 10px',borderRadius:'20px',cursor:'pointer',fontSize:'10px',fontWeight:700,border:'none',background:cat==='all'?'#ffd93d':'#0f0e17',color:cat==='all'?'#111':'#777',transition:'all .15s'}}>All</button>
        {Object.entries(CATS).map(([k,c])=>{const n=CHORDS.filter(x=>x.cat===k).length;const on=cat===k;return(
          <button key={k} onClick={()=>setCat(on?'all':k)} style={{padding:'5px 10px',borderRadius:'20px',cursor:'pointer',fontSize:'10px',fontWeight:700,border:`1px solid ${on?c.color:c.color+'33'}`,background:on?c.color+'22':'#0f0e17',color:on?c.color:'#666',transition:'all .15s'}}>
            {c.label} <span style={{opacity:0.7}}>({n})</span>
          </button>
        );})}</div>
    </div>
  );

  return(
    <div style={{padding:'12px',maxWidth:'760px',margin:'0 auto'}}>

      {/* ── FILTER PANEL ──────────────────────────────────────────── */}
      <div style={{background:'#13121f',borderRadius:'13px',border:`1px solid ${activeFilterCount>0?'#a29bfe66':'#2a2840'}`,marginBottom:'10px',overflow:'hidden',transition:'border-color .2s'}}>

        {/* Header */}
        <div onClick={()=>setFilterOpen(p=>!p)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',cursor:'pointer',userSelect:'none'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <span style={{fontSize:'14px'}}>🎛</span>
            <span style={{fontSize:'13px',fontWeight:700,color:'#fff'}}>Filter Chords</span>
            {activeFilterCount>0&&<span style={{background:'#a29bfe',color:'#111',borderRadius:'10px',padding:'1px 8px',fontSize:'10px',fontWeight:900}}>{activeFilterCount} active</span>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            {activeFilterCount>0&&<button onClick={e=>{e.stopPropagation();clearFilters();}} style={{background:'transparent',border:'1px solid #2a2840',color:'#aaa',padding:'3px 10px',borderRadius:'7px',cursor:'pointer',fontSize:'10px',fontWeight:600}}>Clear all</button>}
            <span style={{color:'#555',fontSize:'12px',transition:'transform .2s',display:'inline-block',transform:filterOpen?'rotate(180deg)':'none'}}>▾</span>
          </div>
        </div>

        {/* Collapsed summary chips */}
        {activeFilterCount>0&&!filterOpen&&(
          <div style={{padding:'0 12px 10px',display:'flex',flexWrap:'wrap',gap:'4px',alignItems:'center'}}>
            {cat!=='all'&&<span style={{background:CATS[cat].color+'22',color:CATS[cat].color,padding:'2px 9px',borderRadius:'10px',fontSize:'10px',fontWeight:700,border:`1px solid ${CATS[cat].color}44`}}>{CATS[cat].label}</span>}
            {filterMode==='family'&&family&&(()=>{const f=FAMILIES.find(x=>x.id===family);return f&&<span style={{background:f.color+'22',color:f.color,padding:'2px 9px',borderRadius:'10px',fontSize:'10px',fontWeight:700,border:`1px solid ${f.color}44`}}>{f.sym} {f.label}</span>;})()}
            {filterMode==='builder'&&<>
              {bTriad&&(()=>{const t=TRIADS.find(x=>x.id===bTriad);return t&&<span style={{background:t.color+'22',color:t.color,padding:'2px 9px',borderRadius:'10px',fontSize:'10px',fontWeight:700,border:`1px solid ${t.color}44`}}>{t.sym} {t.label}</span>;})()}
              {bSeventh&&(()=>{const s=SEVENTHS.find(x=>x.id===bSeventh);return s&&<span style={{background:s.color+'22',color:s.color,padding:'2px 9px',borderRadius:'10px',fontSize:'10px',fontWeight:700,border:`1px solid ${s.color}44`}}>{s.sym} {s.label}</span>;})()}
              {[...bExts].map(e=>{const ex=EXTS.find(x=>x.id===e);return ex&&<span key={e} style={{background:ex.color+'22',color:ex.color,padding:'2px 9px',borderRadius:'10px',fontSize:'10px',fontWeight:700,border:`1px solid ${ex.color}44`}}>{ex.sym}</span>;})}
              {builderCombo&&<span style={{background:builderCombo.color+'22',color:builderCombo.color,padding:'2px 9px',borderRadius:'10px',fontSize:'10px',fontWeight:700,border:`1px solid ${builderCombo.color}44`}}>= {builderCombo.label}</span>}
            </>}
            <span style={{color:'#555',fontSize:'10px',marginLeft:'2px'}}>→ {list.length} chord{list.length!==1?'s':''}</span>
          </div>
        )}

        {/* Expanded panel */}
        {filterOpen&&(
          <div style={{padding:'0 12px 14px',display:'flex',flexDirection:'column',gap:'12px'}}>

            <CatStrip/>

            {/* Mode tab switcher */}
            <div style={{display:'flex',gap:'0',background:'#0f0e17',borderRadius:'10px',padding:'3px',border:'1px solid #2a2840'}}>
              {[{id:'family',label:'🎯 Family'},{id:'builder',label:'🔧 Builder'}].map(m=>(
                <button key={m.id} onClick={()=>setFilterMode(m.id)} style={{flex:1,padding:'8px 4px',borderRadius:'8px',cursor:'pointer',border:'none',background:filterMode===m.id?'#1e1c32':'transparent',color:filterMode===m.id?'#ffd93d':'#666',fontSize:'12px',fontWeight:700,transition:'all .15s'}}>{m.label}</button>
              ))}
            </div>

            {/* ── FAMILY MODE ────────────────────────────────────────── */}
            {filterMode==='family'&&(
              <div>
                <div style={{fontSize:'9px',color:'#555',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'8px',fontWeight:700}}>Select a family — each is musically distinct</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
                  {FAMILIES.map(f=>{
                    const matchCount=CHORDS.filter(chord=>{
                      const degs=new Set((chord.voicings[0].deg||[]).filter(Boolean));
                      return FAMILY_TESTS[f.id]&&FAMILY_TESTS[f.id](degs);
                    }).length;
                    const on=family===f.id;
                    return(
                      <button key={f.id} onClick={()=>setFamily(on?null:f.id)}
                        style={{background:on?f.color+'22':'#0f0e17',border:`1.5px solid ${on?f.color:f.color+'33'}`,borderRadius:'11px',cursor:'pointer',padding:'10px 12px',textAlign:'left',transition:'all .18s',boxShadow:on?`0 0 14px ${f.color}33`:'none',transform:on?'translateY(-1px)':'none'}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
                          <span style={{fontSize:f.sym.length>1?'14px':'22px',fontWeight:900,color:on?f.color:'#444',letterSpacing:'-1px',lineHeight:1}}>{f.sym}</span>
                          <span style={{fontSize:'9px',background:on?f.color+'33':'#1a1928',color:on?f.color:'#555',padding:'2px 6px',borderRadius:'8px',fontWeight:700}}>{matchCount}</span>
                        </div>
                        <div style={{fontSize:'12px',fontWeight:700,color:on?f.color:'#999'}}>{f.label}</div>
                        <div style={{fontSize:'9px',color:on?f.color+'99':'#555',marginTop:'2px',lineHeight:1.3}}>{f.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── BUILDER MODE ───────────────────────────────────────── */}
            {filterMode==='builder'&&(
              <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>

                {/* Step 1 — Triad Base */}
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'8px'}}>
                    <span style={{background:'#ffd93d',color:'#111',width:'19px',height:'19px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:900,flexShrink:0}}>1</span>
                    <span style={{fontSize:'10px',color:'#bbb',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px'}}>Triad Base</span>
                    <span style={{marginLeft:'auto',padding:'2px 8px',borderRadius:'8px',background:'#ffd93d18',border:'1px solid #ffd93d33',color:'#ffd93d',fontSize:'9px',fontWeight:700}}>required · pick one</span>
                  </div>
                  <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                    {TRIADS.map(t=>{
                      const on=bTriad===t.id;
                      const isText=t.sym.length>1;
                      return(
                        <button key={t.id} onClick={()=>setBTriad(on?null:t.id)}
                          style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 10px',borderRadius:'10px',cursor:'pointer',
                            border:`1.5px solid ${on?t.color:t.color+'33'}`,background:on?t.color+'22':'#0f0e17',
                            transition:'all .18s',boxShadow:on?`0 0 10px ${t.color}44`:'none',transform:on?'translateY(-1px)':'none',minWidth:'56px'}}>
                          <span style={{fontSize:isText?'12px':'18px',fontWeight:900,color:on?t.color:'#555',lineHeight:1,letterSpacing:isText?'0':'-0.5px'}}>{t.sym}</span>
                          <span style={{fontSize:'10px',color:on?t.color:'#777',marginTop:'3px',fontWeight:600}}>{t.label}</span>
                          <span style={{fontSize:'8px',color:on?t.color+'88':'#444',marginTop:'1px'}}>{t.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2 — Seventh */}
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'8px'}}>
                    <span style={{background:bTriad?'#a29bfe':'#2a2840',color:bTriad?'#111':'#555',width:'19px',height:'19px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:900,flexShrink:0,transition:'all .2s'}}>2</span>
                    <span style={{fontSize:'10px',color:bTriad?'#bbb':'#555',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',transition:'color .2s'}}>Add a 7th</span>
                    <span style={{marginLeft:'auto',padding:'2px 8px',borderRadius:'8px',background:'#2a2840',border:'1px dashed #3a3855',color:'#666',fontSize:'9px',fontWeight:700}}>optional · skip for plain triad</span>
                  </div>
                  {/* Live combination label */}
                  {builderCombo&&(
                    <div style={{marginBottom:'8px',display:'inline-flex',alignItems:'center',gap:'5px',padding:'4px 10px',borderRadius:'8px',background:builderCombo.color+'18',border:`1px solid ${builderCombo.color}44`}}>
                      <span style={{fontSize:'10px',fontWeight:700,color:builderCombo.color}}>= {builderCombo.label}</span>
                    </div>
                  )}
                  <div style={{display:'flex',gap:'6px',flexWrap:'wrap',opacity:bTriad?1:0.4,transition:'opacity .2s',pointerEvents:bTriad?'auto':'none'}}>
                    {SEVENTHS.map(s=>{
                      const on=bSeventh===s.id;
                      return(
                        <button key={s.id} onClick={()=>setBSeventh(on?null:s.id)}
                          style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 16px',borderRadius:'10px',cursor:'pointer',
                            border:`1.5px solid ${on?s.color:s.color+'33'}`,background:on?s.color+'22':'#0f0e17',
                            transition:'all .18s',boxShadow:on?`0 0 10px ${s.color}44`:'none',transform:on?'translateY(-1px)':'none',minWidth:'74px'}}>
                          <span style={{fontSize:'16px',fontWeight:900,color:on?s.color:'#555'}}>{s.sym}</span>
                          <span style={{fontSize:'10px',color:on?s.color:'#777',marginTop:'3px',fontWeight:600}}>{s.label}</span>
                          <span style={{fontSize:'8px',color:on?s.color+'88':'#444',marginTop:'1px'}}>{s.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 3 — Extensions */}
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'8px'}}>
                    <span style={{background:(bTriad||bSeventh)?'#a29bfe':'#2a2840',color:(bTriad||bSeventh)?'#111':'#555',width:'19px',height:'19px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:900,flexShrink:0,transition:'all .2s'}}>3</span>
                    <span style={{fontSize:'10px',color:(bTriad||bSeventh)?'#bbb':'#555',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',transition:'color .2s'}}>Color Tones</span>
                    <span style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'4px',padding:'2px 8px',borderRadius:'8px',background:'#2a2840',border:'1px dashed #3a3855',color:'#666',fontSize:'9px',fontWeight:700}}>
                      <span style={{fontSize:'10px'}}>☑</span> optional · pick any combo
                    </span>
                  </div>
                  <div style={{display:'flex',gap:'5px',flexWrap:'wrap',opacity:(bTriad||bSeventh)?1:0.4,transition:'opacity .2s'}}>
                    {EXTS.map(e=>{
                      const on=bExts.has(e.id);
                      return(
                        <button key={e.id} onClick={()=>toggleExt(e.id)}
                          style={{padding:'6px 12px',borderRadius:'20px',cursor:'pointer',
                            border:`1.5px solid ${on?e.color:e.color+'44'}`,background:on?e.color+'28':'#0f0e17',
                            color:on?e.color:'#777',fontSize:'12px',fontWeight:700,
                            transition:'all .18s',boxShadow:on?`0 0 8px ${e.color}44`:'none',
                            display:'flex',alignItems:'center',gap:'4px'}}>
                          {on&&<span style={{fontSize:'9px'}}>✓</span>}{e.sym}
                        </button>
                      );
                    })}
                  </div>
                  {bExts.size>0&&<div style={{marginTop:'6px',fontSize:'9px',color:'#555'}}>tap again to deselect · {bExts.size} selected</div>}
                </div>

              </div>
            )}

          </div>
        )}
      </div>

      {/* ── RESULTS ───────────────────────────────────────────────── */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
        <div style={{fontSize:'11px',color:'#666'}}>
          {activeFilterCount>0
            ?<><span style={{color:'#a29bfe',fontWeight:700}}>{list.length}</span> chord{list.length!==1?'s':''} match</>
            :<><span style={{color:'#777',fontWeight:600}}>{list.length}</span> chords</>
          }
        </div>
        {activeFilterCount>0&&list.length===0&&<button onClick={clearFilters} style={{background:'transparent',border:'none',color:'#a29bfe',fontSize:'11px',cursor:'pointer',fontWeight:600}}>Clear filters</button>}
      </div>

      {list.length===0?(
        <div style={{textAlign:'center',padding:'40px 20px',color:'#888'}}>
          <div style={{fontSize:'32px',marginBottom:'8px'}}>🎸</div>
          <div style={{fontSize:'14px',fontWeight:700,color:'#ccc',marginBottom:'4px'}}>No chords match</div>
          <div style={{fontSize:'12px',color:'#666',marginBottom:'14px'}}>Try a different combination</div>
          <button onClick={clearFilters} style={{background:'#a29bfe',color:'#111',border:'none',padding:'8px 20px',borderRadius:'9px',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>Clear Filters</button>
        </div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(98px,1fr))',gap:'8px'}}>
          {list.map(chord=>{
            const ci=CATS[chord.cat];
            const isMast=mastered&&mastered.has(chord.id);
            return(<div key={chord.id} onClick={()=>handleSel(chord.id)}
              style={{background:'#13121f',borderRadius:'10px',padding:'8px 6px 6px',border:`1px solid ${isMast?'#ffd93d44':ci.color+'22'}`,cursor:'pointer',textAlign:'center',transition:'all .15s',display:'flex',flexDirection:'column',alignItems:'center',position:'relative'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=isMast?'#ffd93d':ci.color;e.currentTarget.style.transform='translateY(-2px)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=isMast?'#ffd93d44':`${ci.color}22`;e.currentTarget.style.transform='none';}}>
              {isMast&&<span style={{position:'absolute',top:'3px',right:'5px',fontSize:'10px',color:'#ffd93d',lineHeight:1}}>★</span>}
              <ChordDiagram v={chord.voicings[0]} showDeg={showDeg} size={0.78}/>
              <div style={{fontSize:'13px',fontWeight:900,marginTop:'4px',color:'#fff'}}>{chord.sym}</div>
              <div style={{fontSize:'9px',color:ci.color,fontWeight:600,marginTop:'1px',lineHeight:'1.2'}}>{chord.name}</div>
            </div>);
          })}
        </div>
      )}
    </div>
  );
}


function WeakTab({history,degHist,srs,showDeg,onComplete}){
  const[mode,setMode]=useState('chords');
  const weak=useMemo(()=>getWeakChords(history,srs),[history,srs]);
  const weakDegs=useMemo(()=>getWeakDegrees(degHist),[degHist]);
  const[drilling,setDrilling]=useState(false);
  if(drilling)return<ChordQuiz showDeg={showDeg} pool={weak} onComplete={r=>{onComplete(r);setDrilling(false);}} onBack={()=>setDrilling(false)}/>;
  return(<div style={{padding:'14px',maxWidth:'540px',margin:'0 auto'}}>
    <div style={{display:'flex',gap:'0',marginBottom:'14px',background:'#13121f',borderRadius:'10px',padding:'3px',border:'1px solid #2a2840'}}>
      {[{id:'chords',label:`🎸 Weak Chords (${weak.length})`},{id:'degrees',label:`🎼 Weak Degrees (${weakDegs.length})`}].map(m=>(<button key={m.id} onClick={()=>setMode(m.id)} style={{flex:1,padding:'8px 4px',borderRadius:'8px',cursor:'pointer',border:'none',background:mode===m.id?'#2a2840':'transparent',color:mode===m.id?'#ffd93d':'#888',fontSize:'11px',fontWeight:700,transition:'all .15s'}}>{m.label}</button>))}
    </div>
    {mode==='chords'&&(<div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px',flexWrap:'wrap',gap:'5px'}}>
        <div><div style={{fontSize:'15px',fontWeight:900,color:'#fff'}}>Weak Chords</div><div style={{color:'#999',fontSize:'11px',marginTop:'1px'}}>Any incorrect answer or degraded SRS score</div></div>
        {weak.length>0&&<button onClick={()=>setDrilling(true)} style={{background:'#ff6b6b',color:'#fff',border:'none',padding:'8px 14px',borderRadius:'9px',fontSize:'11px',fontWeight:700,cursor:'pointer',minHeight:'40px'}}>Drill ({weak.length}) 🎯</button>}
      </div>
      {weak.length===0?(<div style={{textAlign:'center',padding:'28px',color:'#888'}}><div style={{fontSize:'32px',marginBottom:'5px'}}>🎉</div><div style={{fontWeight:700,color:'#ccc',fontSize:'13px'}}>No weak chords yet!</div></div>):(
        <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
          {weak.map(chord=>{const ci=CATS[chord.cat],pct=chord.stats.n>0?Math.round(chord.stats.ok/chord.stats.n*100):null;return(
            <div key={chord.id} style={{background:'#13121f',borderRadius:'10px',padding:'9px',border:`1px solid ${ci.color}33`,display:'flex',alignItems:'center',gap:'8px'}}>
              <ChordDiagram v={chord.voicings[0]} showDeg={showDeg} size={0.72}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:'12px',color:'#fff'}}>{chord.name}</div>
                <div style={{fontSize:'8px',color:ci.color,marginBottom:'3px'}}>{ci.label}</div>
                {pct!==null&&<><div style={{background:'#1a1928',borderRadius:'3px',height:'3px',marginBottom:'2px'}}><div style={{background:pct>=70?'#00b894':'#ff6363',height:'3px',borderRadius:'3px',width:`${pct}%`}}/></div><div style={{fontSize:'8px',color:'#999'}}>{pct}% · {chord.stats.n} attempts</div></>}
              </div>
            </div>
          );})}
        </div>
      )}
    </div>)}
    {mode==='degrees'&&(<div>
      <div style={{marginBottom:'10px'}}><div style={{fontSize:'15px',fontWeight:900,color:'#fff'}}>Weak Scale Degrees</div><div style={{color:'#999',fontSize:'11px',marginTop:'1px'}}>Below 70% accuracy</div></div>
      {weakDegs.length===0?(<div style={{textAlign:'center',padding:'28px',color:'#888'}}><div style={{fontSize:'32px',marginBottom:'5px'}}>🎉</div><div style={{fontWeight:700,color:'#ccc',fontSize:'13px'}}>No weak degrees yet!</div><div style={{fontSize:'11px',marginTop:'3px'}}>Complete Scale Degree training to see results.</div></div>):(
        <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
          {weakDegs.map((r,i)=>{const ci=CATS[r.chord.cat],pct=Math.round(r.ok/r.n*100);return(
            <div key={i} style={{background:'#13121f',borderRadius:'10px',padding:'9px',border:`1px solid ${DC[r.deg]||'#ffd93d'}33`,display:'flex',alignItems:'center',gap:'8px'}}>
              <ChordDiagram v={r.chord.voicings[0]} showDeg={true} size={0.72}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:'12px',color:'#fff'}}>{r.chord.name}</div>
                <div style={{fontSize:'9px',color:ci.color,marginBottom:'3px'}}>{ci.label}</div>
                <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'3px'}}><span style={{fontSize:'10px',fontWeight:700,color:DC[r.deg]||'#ffd93d',background:(DC[r.deg]||'#ffd93d')+'22',padding:'1px 6px',borderRadius:'6px'}}>{r.deg}</span><span style={{fontSize:'9px',color:'#888'}}>{DEG_HINT[r.deg]||''}</span></div>
                <div style={{background:'#1a1928',borderRadius:'3px',height:'3px',marginBottom:'2px'}}><div style={{background:pct>=70?'#00b894':'#ff6363',height:'3px',borderRadius:'3px',width:`${pct}%`}}/></div>
                <div style={{fontSize:'8px',color:'#999'}}>{pct}% · {r.n} attempts</div>
              </div>
            </div>
          );})}
        </div>
      )}
    </div>)}
  </div>);
}

// Build a ChordDetail-compatible object directly from a progression chord {sym, rn, v}.
// Always uses the exact inline voicing shown in the progression — no library lookup.
function progChordToDetail(c){
  const s=c.sym||'';
  let cat='shell';
  if(/ø|m7b5/i.test(s))cat='altered';
  else if(/dim|°/i.test(s))cat='altered';
  else if(/maj7|Δ/i.test(s))cat='shell';
  else if(/m7|min7/i.test(s))cat='shell';
  else if(/7/.test(s)&&!/maj/i.test(s))cat='shell';
  else if(/^[A-G][#b]?m/.test(s))cat='cowboy';
  else cat='cowboy';
  return{
    id:`prog_${s}_${c.rn}`,
    name:s,
    sym:s,
    cat,
    movable:false,
    voicings:[{label:`${c.rn} — from Progression of the Day`,str:c.v.str,deg:c.v.deg,sf:c.v.sf}],
  };
}

function ProgressionOfDay({showDeg,setSelChord}){
  const prog=useMemo(()=>{const d=new Date();const doy=Math.floor((d-new Date(d.getFullYear(),0,0))/86400000);return PROGS[doy%PROGS.length];},[]);
  return(<div style={{padding:'0 14px 14px',maxWidth:'560px',margin:'0 auto'}}>
    <div style={{marginBottom:'8px'}}>
      <div style={{fontSize:'16px',fontWeight:900,color:'#fff'}}>Progression of the Day</div>
      <div style={{display:'flex',gap:'5px',alignItems:'center',marginTop:'2px',flexWrap:'wrap'}}>
        <span style={{fontSize:'12px',color:'#ffd93d',fontWeight:700}}>{prog.title}</span>
        <span style={{fontSize:'8px',background:'#ffd93d22',color:'#ffd93d',padding:'1px 6px',borderRadius:'5px',fontWeight:700}}>{prog.feel}</span>
      </div>
      <div style={{fontSize:'10px',color:'#999',marginTop:'3px',lineHeight:'1.4'}}>{prog.desc}</div>
    </div>
    <div style={{display:'flex',gap:'8px',paddingBottom:'4px',alignItems:'flex-start',justifyContent:'center',flexWrap:'wrap'}}>
      {prog.chords.map((c,i)=>(<div key={i} style={{flexShrink:0,textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center'}}>
        <div
          onClick={()=>setSelChord&&setSelChord(progChordToDetail(c))}
          style={{background:'#13121f',borderRadius:'9px',padding:'7px 5px 6px',border:'1px solid #2a2840',minWidth:'84px',cursor:setSelChord?'pointer':'default',touchAction:'manipulation',WebkitTapHighlightColor:'transparent'}}>
          <ChordDiagram v={c.v} showDeg={showDeg} size={0.78}/>
          <div style={{fontSize:'12px',fontWeight:900,color:'#fff',marginTop:'2px'}}>{c.sym}</div>
          <div style={{fontSize:'8px',color:'#666',marginTop:'1px',marginBottom:'5px'}}>{c.rn}</div>
          <PlayButtons v={c.v} size="sm" stack/>
        </div>
        {i<prog.chords.length-1&&<div style={{color:'#333',fontSize:'16px',marginTop:'4px'}}>→</div>}
      </div>))}
    </div>
  </div>);
}

const ChordsOfDay=memo(function ChordsOfDay({srsData,showDeg,setShowDeg,onMarkReviewed,mastered,onToggleMastered,scrollRef}){
  // Snapshot both daily chords AND srs data at mount — display never changes
  // after first render, so App re-renders (from saveSrs/saveHist) can't cause glitches.
  const[daily]=useState(()=>getDailyChords(srsData,mastered));
  const[srsSnap]=useState(()=>({...srsData}));
  const[reviewed,setReviewed]=useState(new Set());
  const[selChord,setSelChord]=useState(null);
  const savedScrollY=useRef(0);

  const mark=useCallback(id=>{
    setReviewed(p=>new Set([...p,id]));
    onMarkReviewed(id); // fire-and-forget — state updates happen in parent but don't re-render us
  },[onMarkReviewed]);

  // When a chord detail is open, render it (ChordDetail handles auto-showDeg internally)
  if(selChord){
    return <ChordDetail chord={selChord} onBack={()=>{setSelChord(null);requestAnimationFrame(()=>{if(scrollRef&&scrollRef.current)scrollRef.current.scrollTop=savedScrollY.current;});}} showDeg={showDeg} setShowDeg={setShowDeg} mastered={mastered} onToggleMastered={onToggleMastered}/>;
  }

  return(<div>
    <div style={{borderBottom:'1px solid #1a1928',paddingTop:'14px',paddingBottom:'14px'}}><ProgressionOfDay showDeg={showDeg} setSelChord={setSelChord}/></div>
    <div style={{padding:'14px',maxWidth:'560px',margin:'0 auto'}}>
      <div style={{marginBottom:'10px'}}>
        <div style={{fontSize:'16px',fontWeight:900,color:'#fff'}}>Chords of the Day</div>
        <div style={{color:'#999',fontSize:'11px',marginTop:'1px'}}>{new Date().toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})}</div>
        <div style={{marginTop:'6px',padding:'7px 10px',background:'#13121f',borderRadius:'8px',border:'1px solid #2a2840'}}>
          <div style={{fontSize:'11px',color:'#bbb',lineHeight:'1.5'}}>
            <span style={{color:'#ffd93d',fontWeight:700}}>Spaced Repetition (SRS)</span> — chords you know well appear less often. Chords you struggle with come back sooner. Mark each one "Got it" to update the schedule.
          </div>
        </div>
      </div>
      {daily.length===0?(
        <div style={{textAlign:'center',padding:'20px',color:'#888'}}>
          <div style={{fontSize:'26px',marginBottom:'4px'}}>✅</div>
          <div style={{fontWeight:700,color:'#ccc',fontSize:'12px'}}>All caught up for today!</div>
        </div>
      ):(
        <div>
          <div style={{marginBottom:'7px'}}><span style={{background:'#1a1928',borderRadius:'8px',padding:'3px 10px',fontSize:'10px',color:'#ffd93d'}}>{reviewed.size}/{daily.length} reviewed</span></div>
          <div style={{display:'flex',flexDirection:'column',gap:'7px'}}>
            {daily.map((chord,idx)=>{
              // Use SNAPSHOT values — stable, never changes mid-session
              const ci=CATS[chord.cat];
              const srsEntry=srsSnap[chord.id];
              const isNew=!srsEntry;
              const isDue=srsEntry&&srsEntry.nextDue<=todayStr();
              const done=reviewed.has(chord.id);
              return(
                <div key={chord.id} style={{
                  background:'#13121f',borderRadius:'11px',padding:'10px',
                  border:`1px solid ${done?'#00b89444':ci.color+'33'}`,
                  display:'flex',alignItems:'center',gap:'9px',
                  opacity:done?0.55:1,
                  willChange:'opacity',
                  transition:'opacity .25s ease',
                  userSelect:'none',
                  WebkitTapHighlightColor:'transparent',
                }}>
                  <div style={{fontSize:'13px',fontWeight:900,color:'#444',minWidth:'13px',textAlign:'center'}}>{idx+1}</div>
                  {/* Tappable area — opens chord detail */}
                  <div onClick={()=>{savedScrollY.current=scrollRef&&scrollRef.current?scrollRef.current.scrollTop:0;if(scrollRef&&scrollRef.current)scrollRef.current.scrollTop=0;setSelChord(chord);}} style={{display:'flex',alignItems:'center',gap:'9px',flex:1,minWidth:0,cursor:'pointer',touchAction:'manipulation',WebkitTapHighlightColor:'transparent'}}>
                    <ChordDiagram v={chord.voicings[0]} showDeg={showDeg} size={0.76}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:'4px',flexWrap:'wrap',marginBottom:'1px'}}>
                        <span style={{fontWeight:700,fontSize:'12px',color:'#fff'}}>{chord.name}</span>
                        {isNew&&<span style={{fontSize:'8px',background:'#a29bfe22',color:'#a29bfe',padding:'1px 5px',borderRadius:'5px',fontWeight:700}}>NEW</span>}
                        {isDue&&!isNew&&<span style={{fontSize:'8px',background:'#ffd93d22',color:'#ffd93d',padding:'1px 5px',borderRadius:'5px',fontWeight:700}}>REVIEW</span>}
                      </div>
                      <div style={{fontSize:'8px',color:ci.color,marginBottom:'1px'}}>{ci.label}</div>
                      <div style={{fontSize:'8px',color:'#777'}}>{chord.voicings[0].label}</div>
                      {/* Always render this line (stable height) — no conditional mount/unmount */}
                      <div style={{fontSize:'8px',color:'#555',marginTop:'1px',minHeight:'11px'}}>
                        {srsEntry?`${srsEntry.reps} reps · next in ${srsEntry.interval}d`:'\u00a0'}
                      </div>
                      <div style={{marginTop:'5px'}}>
                        <PlayButtons v={chord.voicings[0]} size="sm"/>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={()=>!done&&mark(chord.id)}
                    style={{
                      background:done?'#00b89422':'#ffd93d22',
                      color:done?'#00b894':'#ffd93d',
                      border:`1px solid ${done?'#00b89444':'#ffd93d88'}`,
                      padding:'7px 8px',borderRadius:'8px',
                      cursor:done?'default':'pointer',
                      fontSize:'11px',fontWeight:700,
                      whiteSpace:'nowrap',minHeight:'44px',minWidth:'64px',
                      // Hard lock: once done, no pointer events whatsoever
                      pointerEvents:done?'none':'auto',
                      // Only transition the visual properties, never layout/text
                      transition:'background .2s,color .2s,border-color .2s',
                      WebkitTapHighlightColor:'transparent',
                      touchAction:'manipulation',
                    }}
                  >{done?'✓ Done':'Got it'}</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  </div>);
// Custom memo comparator: only re-render when showDeg changes.
// srsData prop changes (from App's saveSrs/saveHist) are ignored because
// we already snapshotted it at mount. onMarkReviewed is stable (ref pattern in App).
},(prev,next)=>prev.showDeg===next.showDeg);

// ── INSTALL BANNER ────────────────────────────────────────────────────────
// Shows a native-feeling bottom sheet prompting the user to add to home screen.
// Hidden when: already running as standalone PWA, or not on a multiple-of-5 launch.
// ── AUDIO HINT BANNER ────────────────────────────────────────────────────
// iOS only. Shows on first play attempt when not suppressed.
// Two dismiss modes: "Got it" (suppresses for 10 launches), "Don't show again" (forever).
// ── BANNER STACK ─────────────────────────────────────────────────────────
// Renders both the install prompt and audio hint as floating cards in a
// shared column-reverse container so they stack naturally without overlapping.
// All button handlers use both onTouchEnd+onClick with preventDefault+stopPropagation
// to fix standalone PWA mode on iOS where position:fixed touch events can be eaten
// by the system gesture recognizer.

// ── AUDIO HINT PANEL ─────────────────────────────────────────────────────
// Renders inline inside the normal React tree (not position:fixed).
// Shown at the top of the Today tab content area — same approach as ChordDetail.
function AudioHintPanel({onDismiss10,onDismiss20}){
  return(
    <div style={{
      position:'fixed',
      bottom:'max(16px,env(safe-area-inset-bottom))',
      left:'12px',right:'12px',
      zIndex:9998,
      background:'#242235',
      borderRadius:'18px',
      border:'1px solid #2a2840',
      boxShadow:'0 8px 40px #000000aa',
      padding:'14px 14px 12px',
    }}>
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
        <div style={{fontSize:'20px',lineHeight:1,flexShrink:0}}>🔔</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:'13px',fontWeight:800,color:'#fff',marginBottom:'2px'}}>No sound?</div>
          <div style={{fontSize:'11px',color:'#888',lineHeight:'1.4'}}>Unmute your ringtone to hear chord audio.</div>
        </div>
        <button onClick={onDismiss10}
          style={{background:'transparent',border:'none',color:'#555',fontSize:'20px',cursor:'pointer',
            padding:'0 4px',lineHeight:1,minWidth:'36px',minHeight:'44px',flexShrink:0,
            display:'flex',alignItems:'center',justifyContent:'center',
            touchAction:'manipulation',WebkitTapHighlightColor:'transparent'}}>×</button>
      </div>
      <div style={{display:'flex',gap:'8px'}}>
        <button onClick={onDismiss10}
          style={{flex:1,background:'#ffd93d',color:'#111',border:'none',padding:'10px',
            borderRadius:'11px',fontSize:'13px',fontWeight:800,cursor:'pointer',minHeight:'44px',
            touchAction:'manipulation',WebkitTapHighlightColor:'transparent'}}>
          Got it
        </button>
        <button onClick={onDismiss20}
          style={{flex:1,background:'transparent',color:'#666',border:'1px solid #2a2840',
            padding:'10px',borderRadius:'11px',fontSize:'12px',fontWeight:600,cursor:'pointer',minHeight:'44px',
            touchAction:'manipulation',WebkitTapHighlightColor:'transparent'}}>
          Don't show again
        </button>
      </div>
    </div>
  );
}

function BannerStack(){
  const[showInstall,setShowInstall]=useState(false);
  const[deferredPrompt,setDeferredPrompt]=useState(null);

  const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone=window.matchMedia('(display-mode: standalone)').matches||
    window.navigator.standalone===true;

  // ── Increment launch counter unconditionally ──────────────────────────
  // Must run before any early returns so standalone PWA users always
  // have an up-to-date ct_launches value for suppression checks.
  const[launches]=useState(()=>{
    try{
      const n=parseInt(localStorage.getItem('ct_launches')||'0',10)+1;
      localStorage.setItem('ct_launches',String(n));
      return n;
    }catch(e){return 1;}
  });

  // ── Install banner logic ──────────────────────────────────────────────
  useEffect(()=>{
    if(isStandalone)return;
    if(launches!==1&&launches%5!==0)return;
    const isAndroidChrome=/android/i.test(navigator.userAgent)&&/chrome/i.test(navigator.userAgent);
    if(isIOS){
      const t=setTimeout(()=>setShowInstall(true),2500);
      return()=>clearTimeout(t);
    }
    if(isAndroidChrome){
      const handler=e=>{e.preventDefault();setDeferredPrompt(e);setShowInstall(true);};
      window.addEventListener('beforeinstallprompt',handler);
      return()=>window.removeEventListener('beforeinstallprompt',handler);
    }
  },[]);



  // ── Button tap handler ───────────────────────────────────────────────
  // onPointerDown fires before any iOS gesture recognizer can claim the touch.
  // We do NOT call preventDefault — it was preventing React from flushing
  // state updates in standalone PWA mode. stopPropagation is enough to keep
  // taps inside each card.
  const tap=cb=>e=>{e.stopPropagation();cb();};

  // Shared button style additions for reliable tapping
  const tapBtn=(extra={})=>({
    touchAction:'manipulation',
    WebkitTapHighlightColor:'transparent',
    pointerEvents:'auto',
    cursor:'pointer',
    position:'relative',
    zIndex:1,
    ...extra,
  });

  // ── Install actions ───────────────────────────────────────────────────
  const dismissInstall=()=>setTimeout(()=>setShowInstall(false),0);
  const installAndroid=async()=>{
    if(!deferredPrompt)return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismissInstall();
  };

  // ── Audio actions ─────────────────────────────────────────────────────


  if(!showInstall)return null;

  const sheetStyle={
    position:'fixed',
    bottom:'max(16px,env(safe-area-inset-bottom))',
    left:'12px',right:'12px',
    zIndex:9999,
    background:'#242235',
    borderRadius:'18px',
    border:'1px solid #2a2840',
    boxShadow:'0 8px 40px #000000aa',
    padding:'14px 14px 12px',
  };
  const btnClose={
    background:'transparent',border:'none',color:'#555',fontSize:'22px',
    padding:'0 4px',lineHeight:1,flexShrink:0,cursor:'pointer',
    touchAction:'manipulation',WebkitTapHighlightColor:'transparent',
    minWidth:'36px',minHeight:'44px',
    display:'flex',alignItems:'center',justifyContent:'center',
  };
  return(
    <>

      {/* Install sheet — always at bottom:0 */}
      {showInstall&&(
        <div style={{...sheetStyle}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:!isIOS?'10px':'0'}}>
            <div style={{fontSize:'22px',lineHeight:1,flexShrink:0}}>🎸</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'13px',fontWeight:800,color:'#fff',marginBottom:'2px'}}>
                {isIOS?'Get the full experience — add to Home Screen':'Practice anytime — install ChordTrainer'}
              </div>
              <div style={{fontSize:'11px',color:'#888'}}>
                {isIOS
                  ?<>Tap <span style={{color:'#ffd93d',fontWeight:700}}>Share ⎙</span> → <span style={{color:'#ffd93d',fontWeight:700}}>Add to Home Screen</span></>
                  :'Full-screen, works offline, opens instantly'}
              </div>
            </div>
            <button style={btnClose} onPointerDown={tap(dismissInstall)} onClick={tap(dismissInstall)}>×</button>
          </div>
          {!isIOS&&(
            <button onPointerDown={tap(installAndroid)} onClick={tap(installAndroid)}
              style={{display:'block',width:'100%',background:'#ffd93d',color:'#111',border:'none',
                padding:'10px',borderRadius:'9px',fontSize:'13px',fontWeight:800,cursor:'pointer',minHeight:'44px',
                touchAction:'manipulation',WebkitTapHighlightColor:'transparent'}}>
              Install
            </button>
          )}
        </div>
      )}
    </>
  );
}

// ── DEBUG PANEL ───────────────────────────────────────────────────────────
// Shown at the bottom of the Guide tab. Easy to remove — just delete this
// component and the <DebugPanel/> reference in HelpTab.
function DebugPanel(){
  const[,forceUpdate]=useState(0);
  const ls=k=>localStorage.getItem(k)||'(unset)';
  const ss=k=>sessionStorage.getItem(k)||'(unset)';
  const rows=[
    ['ct_launches',          ls('ct_launches')],
    ['ct_audio_hint_launch', ls('ct_audio_hint_launch')],
    ['ct_audio_hint_launch20',ls('ct_audio_hint_launch20')],
    ['ct_mastered count',    (()=>{try{const m=JSON.parse(ls('ct_mastered')||'[]');return String(m.length);}catch(e){return '?';}})()],
    ['ct_launched (session)',ss('ct_launched')],
    ['_firstPlayFired',      String(_firstPlayFired)],
    ['_onFirstPlay set',     String(!!_onFirstPlay)],
    ['isIOS',                String(/iphone|ipad|ipod/i.test(navigator.userAgent))],
    ['isStandalone',         String(window.matchMedia('(display-mode:standalone)').matches||window.navigator.standalone===true)],
    ['window.scrollY',       String(window.scrollY)],
  ];
  return(
    <div style={{background:'#0a0918',borderRadius:'10px',border:'1px solid #ff6b6b55',padding:'10px 12px',marginBottom:'10px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
        <div style={{fontSize:'10px',color:'#ff6b6b',fontWeight:700,letterSpacing:'1px'}}>🐛 DEBUG</div>
        <button onClick={()=>forceUpdate(n=>n+1)}
          style={{fontSize:'9px',color:'#888',background:'transparent',border:'1px solid #2a2840',borderRadius:'5px',padding:'2px 8px',cursor:'pointer',touchAction:'manipulation'}}>
          Refresh
        </button>
      </div>
      {rows.map(([k,v])=>(
        <div key={k} style={{display:'flex',gap:'8px',fontSize:'10px',fontFamily:'monospace',marginBottom:'3px'}}>
          <span style={{color:'#666',minWidth:'170px',flexShrink:0}}>{k}</span>
          <span style={{color:'#ffd93d'}}>{v}</span>
        </div>
      ))}
      <div style={{display:'flex',gap:'6px',marginTop:'10px',flexWrap:'wrap'}}>
        <button onClick={()=>{localStorage.clear();sessionStorage.clear();location.reload();}}
          style={{fontSize:'9px',color:'#ff6b6b',background:'transparent',border:'1px solid #ff6b6b44',borderRadius:'5px',padding:'4px 10px',cursor:'pointer',minHeight:'32px',touchAction:'manipulation'}}>
          Clear all & reload
        </button>
        <button onClick={()=>{if(_debugShowAudio)_debugShowAudio();}}
          style={{fontSize:'9px',color:'#ffd93d',background:'transparent',border:'1px solid #ffd93d44',borderRadius:'5px',padding:'4px 10px',cursor:'pointer',minHeight:'32px',touchAction:'manipulation'}}>
          Show unmute hint
        </button>
        <button onClick={()=>{
          try{localStorage.removeItem('ct_launches');sessionStorage.removeItem('ct_launched');}catch(e){}
          location.reload();
        }}
          style={{fontSize:'9px',color:'#74b9ff',background:'transparent',border:'1px solid #74b9ff44',borderRadius:'5px',padding:'4px 10px',cursor:'pointer',minHeight:'32px',touchAction:'manipulation'}}>
          Show install banner
        </button>
      </div>
    </div>
  );
}

function HelpTab(){
  const[openTier,setOpenTier]=useState(null);
  const toggleTier=id=>setOpenTier(cur=>cur===id?null:id);
  const sections=[
    {icon:'🧠',title:'Spaced Repetition',color:'#00b894',desc:"ChordTrainer uses the SM-2 algorithm (same as Anki) to schedule your practice. Each chord has an ease factor — answer correctly and the review interval grows; answer wrong and it resets to tomorrow. The higher the ease factor, the better you know the chord."},
    {icon:'🌅',title:'Today',color:'#74b9ff',desc:"Your daily practice hub. Opens with the Progression of the Day, followed by your SRS review queue. Tap any chord diagram to open its full detail view. Mark each chord 'Got it' to record your review and schedule the next one."},
    {icon:'📚',title:'Library',color:'#ffd93d',desc:'Browse all 120 chord voicings. Tap any card to open the full detail — diagram, transpose tool, degree guide, and audio. Use the 🎛 Filter Chords panel to narrow down by type and quality.',sub:[
      {label:'🎯 Family Filter',text:'Pick one of 7 mutually exclusive sonic families — Major, Dominant, Minor, Half-dim (ø), Diminished, Augmented, or Suspended. Dominant is correctly separated from Major (it has a ♭7). Half-dim has its own family rather than being lumped with minor.'},
      {label:'🔧 Builder Filter',text:'Build the chord you want in 3 steps: choose a Triad Base (maj, m, sus2, sus4, aug, dim) → optionally add a 7th interval (♭7, Δ7, or °7) → optionally add Color Tones (9, ♭9, ♯9, 11, ♯11, 13, ♭13, 6). A live label shows the resulting chord type as you build, e.g. Minor + ♭7 = "Minor 7th", or Dim + ♭7 = "Half-dim ø".'},
    ]},
    {icon:'🎯',title:'Quiz',color:'#4ecdc4',desc:'Two modes:',sub:[{label:'Chord Quiz',text:'Name→Shape or Shape→Name. Filter by category.'},{label:'Scale Degrees',text:'Tap the dot on the diagram matching the asked degree. Wrong answers reveal all degrees before you move on.'}]},
    {icon:'💪',title:'Weak',color:'#ff6b6b',desc:'Auto-tracks problem areas:',sub:[{label:'Weak Chords',text:'Chords answered incorrectly or with a degraded SRS ease factor.'},{label:'Weak Degrees',text:"Specific degree+chord combos you've struggled to identify."}]},
    {icon:'💾',title:'Export / Import',color:'#fd79a8',desc:"Your progress is saved automatically and persists across sessions. Use ⬆⬇ Data in the header to export a JSON backup or import on another device."},
  ];
  const tiers=[
    {id:'guide',tier:'Guide Tones',stars:'★★★',color:'#ffd93d',short:'3, b3, 7, b7 — define the chord. Target these.',desc:'The 3rd and 7th define chord quality and create smooth voice leading. Bass covers the root — soloists target guide tones.',degrees:[{d:'3',note:'Defines major quality'},{d:'b3',note:'Defines minor quality'},{d:'7',note:'Lift and colour'},{d:'b7',note:'Tension & resolution'}]},
    {id:'root',tier:'Root',stars:'★★',color:'#ff4757',short:'R — tonal anchor. Safe but use sparingly.',desc:'Strong landing point but bass owns it. Sitting on it too much makes a solo sound static.',degrees:[{d:'R',note:'Anchor — use sparingly'}]},
    {id:'ext',tier:'Safe Extensions',stars:'★★',color:'#2ed573',short:'9, 13, 6, #11 — add colour freely.',desc:'Consonant notes above the chord tones. Blend smoothly — you can linger on these.',degrees:[{d:'9',note:'Smooth over most chords'},{d:'13',note:'Open, airy'},{d:'6',note:'Sweet, consonant'},{d:'#11',note:'Lydian brightness'}]},
    {id:'neutral',tier:'Neutral',stars:'★',color:'#778ca3',short:'5 — stable but boring. Pass through it.',desc:'The perfect 5th is harmonically safe but the least interesting note to land on.',degrees:[{d:'5',note:'Stable but bland'}]},
    {id:'tension',tier:'Tension Tones',stars:'⚡',color:'#7c5cbf',short:'b9, #9, b13, b5 — use with intent, resolve.',desc:'Strong dissonance. Over a dominant chord heading to resolution these sound spectacular.',degrees:[{d:'b9',note:'Dark tension'},{d:'#9',note:'Hendrix note'},{d:'b13',note:'Altered colour'},{d:'b5',note:'Tritone'},{d:'#5',note:'Augmented tension'},{d:'bb7',note:'Diminished'}]},
    {id:'sus',tier:'Suspended',stars:'',color:'#74b9ff',short:'4, 2, 11 — floating, unresolved.',desc:'Sus chords replace the 3rd with a 2nd or 4th, creating a floating quality.',degrees:[{d:'4',note:'Resolves to 3rd'},{d:'2',note:'Open, unresolved'},{d:'11',note:'Upper 4th'}]},
  ];
  return(
    <div style={{padding:'14px',maxWidth:'560px',margin:'0 auto'}}>
      <a href="https://ko-fi.com/syncopatedsyntax" target="_blank" rel="noopener noreferrer"
        style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',
          background:'#FF5E5B',color:'#fff',borderRadius:'11px',padding:'12px 20px',
          textDecoration:'none',fontWeight:800,fontSize:'14px',
          boxShadow:'0 4px 14px #FF5E5B55',marginBottom:'10px',
          touchAction:'manipulation',WebkitTapHighlightColor:'transparent'}}>
        <span style={{fontSize:'18px'}}>☕</span> Buy me a coffee
      </a>
      <div style={{fontSize:'15px',fontWeight:900,color:'#fff',marginBottom:'8px'}}>App Features</div>
      <div style={{display:'flex',flexDirection:'column',gap:'5px',marginBottom:'20px'}}>
        {sections.map((s,i)=>(
          <div key={i} style={{background:'#13121f',borderRadius:'10px',border:`1px solid ${s.color}22`}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'11px 12px 6px'}}>
              <span style={{fontSize:'16px',flexShrink:0}}>{s.icon}</span>
              <span style={{fontWeight:700,fontSize:'13px',color:s.color}}>{s.title}</span>
            </div>
            <div style={{padding:'0 12px 11px'}}>
              <div style={{fontSize:'12px',color:'#ccc',lineHeight:'1.6'}}>{s.desc}</div>
              {s.sub&&<div style={{marginTop:'7px',display:'flex',flexDirection:'column',gap:'4px'}}>
                {s.sub.map((sub,j)=>(<div key={j} style={{background:'#0f0e17',borderRadius:'7px',padding:'7px 9px',border:'1px solid #2a2840'}}>
                  <div style={{fontSize:'11px',fontWeight:700,color:'#ffd93d',marginBottom:'2px'}}>{sub.label}</div>
                  <div style={{fontSize:'11px',color:'#aaa',lineHeight:'1.4'}}>{sub.text}</div>
                </div>))}
              </div>}
            </div>
          </div>
        ))}
      </div>
      <div style={{fontSize:'15px',fontWeight:900,color:'#fff',marginBottom:'4px'}}>Chord Diagrams & Degree Colours</div>
      <div style={{fontSize:'12px',color:'#bbb',lineHeight:'1.6',marginBottom:'10px'}}>
        <span style={{color:'#ffd93d',fontWeight:700}}>Tap any chord diagram</span> — on the Today tab, in the Progression of the Day, or in the Library — to open the full detail view. You'll see the voicing at a larger size, an audio player, a transpose tool for movable shapes, and the degree guide below.{' '}
        <span style={{color:'#ffd93d',fontWeight:700}}>Scale Degrees</span> turn on automatically when a detail opens, and restore to their previous state when you go back.
      </div>
      <div style={{padding:'9px 12px',background:'#13121f',borderRadius:'9px',border:'1px solid #2a2840',marginBottom:'12px'}}>
        <div style={{fontSize:'11px',color:'#bbb',lineHeight:'1.6'}}>Enable <span style={{color:'#ffd93d',fontWeight:700}}>Scale Degrees</span> in the header to colour-code every dot on every diagram throughout the app. The colours are grouped by harmonic function — tap any tier below to learn what each colour means and when to use those notes.</div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'5px',marginBottom:'16px'}}>
        {tiers.map(t=>{
          const open=openTier===t.id;
          return(
            <div key={t.id} style={{background:'#13121f',borderRadius:'10px',border:`1px solid ${open?t.color+'66':t.color+'22'}`,overflow:'hidden',transition:'border-color .2s'}}>
              <button onClick={()=>toggleTier(t.id)} style={{width:'100%',display:'flex',alignItems:'center',gap:'10px',padding:'11px 12px',background:'transparent',border:'none',cursor:'pointer',textAlign:'left'}}>
                <div style={{width:'12px',height:'12px',borderRadius:'50%',background:t.color,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                    <span style={{fontWeight:700,fontSize:'13px',color:t.color}}>{t.tier}</span>
                    {t.stars&&<span style={{fontSize:'10px',color:'#ffd93d'}}>{t.stars}</span>}
                  </div>
                  <div style={{fontSize:'11px',color:'#888',marginTop:'1px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.short}</div>
                </div>
                <span style={{color:'#555',fontSize:'14px',flexShrink:0,display:'inline-block',transition:'transform .2s',transform:open?'rotate(180deg)':'none'}}>▾</span>
              </button>
              {open&&(<div style={{padding:'0 12px 12px'}}>
                <div style={{fontSize:'12px',color:'#ccc',lineHeight:'1.6',marginBottom:'9px'}}>{t.desc}</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
                  {t.degrees.map(({d,note})=>(
                    <div key={d} style={{display:'flex',alignItems:'center',gap:'5px',background:'#0f0e17',borderRadius:'7px',padding:'5px 8px',border:`1px solid ${DC[d]}44`}}>
                      <div style={{width:'10px',height:'10px',borderRadius:'50%',background:DC[d],flexShrink:0}}/>
                      <span style={{fontSize:'11px',fontWeight:700,color:DC[d]}}>{d}</span>
                      <span style={{fontSize:'10px',color:'#888'}}>{note}</span>
                    </div>
                  ))}
                </div>
              </div>)}
            </div>
          );
        })}
      </div>
      {/* ── DEBUG ── */}
      <DebugPanel/>
      <div style={{textAlign:'center',padding:'10px',background:'#13121f',borderRadius:'10px',border:'1px solid #2a2840'}}>
        <div style={{fontSize:'12px',color:'#555'}}>Made with 🎸 by <span style={{color:'#ffd93d',fontWeight:700}}>Zak</span></div>
      </div>
    </div>
  );
}

export default function App(){
  const[tab,setTab]=useState('daily');
  const[showDeg,setShowDeg]=useState(false);
  const[srs,setSrs]=useState({});
  const[hist,setHist]=useState([]);
  const[degHist,setDegHist]=useState([]);
  const[mastered,setMastered]=useState(()=>new Set());
  const[showAudioHint,setShowAudioHint]=useState(false);
  const[loaded,setLoaded]=useState(false);
  const[showData,setShowData]=useState(false);
  const[importMsg,setImportMsg]=useState('');

  // Refs for async callbacks — always fresh values, never cause re-renders
  const scrollRef=useRef(null);
  const srsRef=useRef(srs);
  const histRef=useRef(hist);
  const degHistRef=useRef(degHist);
  const masteredRef=useRef(mastered);
  srsRef.current=srs;
  histRef.current=hist;
  degHistRef.current=degHist;
  masteredRef.current=mastered;
  // Wire debug triggers — allows DebugPanel to force-show notifications
  _debugShowAudio=()=>setShowAudioHint(true);
  _debugShowInstall=null; // install banner is in BannerStack, trigger via localStorage reset

  // ── Audio hint: wire _onFirstPlay from App's React tree ──────────────
  // Registering here (not in a fixed-position component) means the callback
  // triggers a normal in-tree state update — no coordinate or paint issues.
  useEffect(()=>{
    const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
    if(!isIOS)return;
    try{
      const launches=parseInt(localStorage.getItem('ct_launches')||'0',10);
      const sup10=parseInt(localStorage.getItem('ct_audio_hint_launch')||'0',10);
      const sup20=parseInt(localStorage.getItem('ct_audio_hint_launch20')||'0',10);
      if(Math.max(sup10,sup20)>=launches)return;
    }catch(e){}
    if(_firstPlayFired){setShowAudioHint(true);return;}
    _onFirstPlay=()=>setShowAudioHint(true);
    return()=>{_onFirstPlay=null;};
  },[]);
  useEffect(()=>{
    const style=document.createElement('style');
    style.textContent=`
      *{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}
      html,body{height:100%;overflow:hidden;background:#0f0e17;}
      button,a,label,[role=button]{touch-action:manipulation;-webkit-user-select:none;user-select:none;}
      input,textarea,select{font-size:16px!important;}
      svg{user-select:none;-webkit-user-select:none;pointer-events:none;}
      svg [onclick],svg [style*='cursor']{pointer-events:auto;}
      :root{--sat:env(safe-area-inset-top);--sab:env(safe-area-inset-bottom);}
    `;
    // Inject viewport meta synchronously — must exist before first paint in standalone mode.
    // useEffect runs after paint so we also set it here via DOM manipulation which is
    // synchronous within this script execution.
    (()=>{
      let vp=document.querySelector('meta[name="viewport"]');
      if(!vp){vp=document.createElement('meta');vp.name='viewport';document.head.prepend(vp);}
      vp.content='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
    })();
    // ── Generate app icon via canvas and inject as apple-touch-icon + manifest ──
    function makeIcon(size){
      const c=document.createElement('canvas');c.width=c.height=size;
      const ctx=c.getContext('2d');

      // Full-bleed dark background — let iOS/Android apply their own corner mask
      ctx.fillStyle='#0f0e17';
      ctx.fillRect(0,0,size,size);

      // ── Cadd9 open cowboy chord ──────────────────────────────────────────
      // str=[-1, 3, 2, 0, 3, 0]   deg=[null,'R','3','5','9','3']
      // Degree colours matching the app's DC object exactly:
      const DC={'R':'#ff4757','3':'#ffd93d','5':'#778ca3','9':'#2ed573'};

      // 20% padding = safe inside iOS squircle mask (≈22% corner radius)
      const pad=size*0.20;
      const openH=size*0.105; // space above nut for open/muted indicators

      const left=pad;
      const right=size-pad;
      const nutY=pad+openH;
      const bottom=size-pad*0.82;

      const gridW=right-left;
      const gridH=bottom-nutY;
      const nStrings=6;
      const nFrets=4;           // show 4 frets; Cadd9 uses frets 1-3
      const ss=gridW/(nStrings-1);
      const fs=gridH/nFrets;

      const sx=i=>left+i*ss;
      const fy=f=>nutY+f*fs;

      const lw=Math.max(2,size*0.006);
      const dotR=size*0.058;
      const openR=size*0.037;
      const nutW=Math.max(3,size*0.014);

      // Fret lines 1–4
      ctx.lineCap='butt';
      ctx.strokeStyle='#2d2b45';
      ctx.lineWidth=lw*0.9;
      for(let f=1;f<=nFrets;f++){
        ctx.beginPath();ctx.moveTo(left,fy(f));ctx.lineTo(right,fy(f));ctx.stroke();
      }

      // String lines
      ctx.strokeStyle='#3a3858';
      ctx.lineWidth=lw*0.8;
      for(let i=0;i<nStrings;i++){
        ctx.beginPath();ctx.moveTo(sx(i),nutY);ctx.lineTo(sx(i),bottom);ctx.stroke();
      }

      // Nut
      ctx.strokeStyle='#cccccc';
      ctx.lineWidth=nutW;
      ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(left,nutY);ctx.lineTo(right,nutY);ctx.stroke();

      // Notes — drawn per string
      const notes=[
        {fret:-1, deg:null},   // str0 low E — muted
        {fret:3,  deg:'R'},    // str1 A     — fret 3, root
        {fret:2,  deg:'3'},    // str2 D     — fret 2, major 3rd
        {fret:0,  deg:'5'},    // str3 G     — open, perfect 5th
        {fret:3,  deg:'9'},    // str4 B     — fret 3, major 9th
        {fret:0,  deg:'3'},    // str5 e     — open, major 3rd
      ];

      notes.forEach(({fret,deg},i)=>{
        const x=sx(i);
        const col=DC[deg]||'#ffd93d';
        const aboveY=nutY-openH*0.52;

        if(fret===-1){
          // Muted × — same style as app diagrams
          const xs=openR*0.65;
          ctx.strokeStyle='#555566';
          ctx.lineWidth=Math.max(1.5,lw*1.5);
          ctx.lineCap='round';
          ctx.beginPath();
          ctx.moveTo(x-xs,aboveY-xs);ctx.lineTo(x+xs,aboveY+xs);
          ctx.moveTo(x+xs,aboveY-xs);ctx.lineTo(x-xs,aboveY+xs);
          ctx.stroke();
        } else if(fret===0){
          // Open circle above nut, coloured by degree
          ctx.beginPath();ctx.arc(x,aboveY,openR,0,Math.PI*2);
          ctx.strokeStyle=col;
          ctx.lineWidth=Math.max(1.5,lw*1.7);
          ctx.lineCap='round';
          ctx.stroke();
        } else {
          // Filled dot, centred in fret slot (sf=1 so row = fret-1)
          const y=fy(fret-1)+fs*0.5;
          ctx.beginPath();ctx.arc(x,y,dotR,0,Math.PI*2);
          ctx.fillStyle=col;ctx.fill();
        }
      });

      return c.toDataURL('image/png');
    }

    const iconUrl=makeIcon(512);
    const iconUrl180=makeIcon(180);

    // apple-touch-icon (iOS home screen)
    const setLink=(rel,sizes,href)=>{
      let l=document.querySelector(`link[rel="${rel}"]${sizes?`[sizes="${sizes}"]`:''}`);
      if(!l){l=document.createElement('link');l.rel=rel;if(sizes)l.sizes=sizes;document.head.appendChild(l);}
      l.href=href;
    };
    setLink('apple-touch-icon','180x180',iconUrl180);
    setLink('icon','512x512',iconUrl);

    // ── iOS standalone scroll offset fix ─────────────────────────────────
    // In standalone PWA mode, WebKit initialises window.scrollY to the
    // safe-area-inset-top value (~50px). Touch events fire at layout coords
    // but the screen renders the visual viewport scrolled 50px down — causing
    // every tap to register 50px above where it visually appears.
    // Fix: immediately scroll to 0,0 and keep it there.
    window.scrollTo(0,0);
    const lockScroll=()=>{if(window.scrollY!==0||window.scrollX!==0)window.scrollTo(0,0);};
    window.addEventListener('scroll',lockScroll,{passive:true});

    document.head.appendChild(style);
    // Theme + viewport
    const setMeta=(name,content)=>{let m=document.querySelector(`meta[name="${name}"]`);if(!m){m=document.createElement('meta');m.name=name;document.head.appendChild(m);}m.content=content;};
    setMeta('theme-color','#0f0e17');
    setMeta('viewport','width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover');
    setMeta('apple-mobile-web-app-capable','yes');
    setMeta('apple-mobile-web-app-status-bar-style','black-translucent');
    setMeta('apple-mobile-web-app-title','ChordTrainer');

    // Web app manifest with generated icon
    const manifest={
      name:'ChordTrainer',short_name:'ChordTrainer',
      description:'Guitar chord training with SRS, scale degrees, and progressions.',
      start_url:'.',display:'standalone',orientation:'portrait',
      background_color:'#0f0e17',theme_color:'#0f0e17',
      icons:[
        {src:iconUrl180,sizes:'180x180',type:'image/png'},
        {src:iconUrl,sizes:'512x512',type:'image/png'},
      ],
    };
    const blob=new Blob([JSON.stringify(manifest)],{type:'application/json'});
    const murl=URL.createObjectURL(blob);
    let mlink=document.querySelector('link[rel="manifest"]');
    if(!mlink){mlink=document.createElement('link');mlink.rel='manifest';document.head.appendChild(mlink);}
    mlink.href=murl;

    return()=>{document.head.removeChild(style);window.removeEventListener('scroll',lockScroll);URL.revokeObjectURL(murl);};
  },[]);

  useEffect(()=>{
    (async()=>{
      try{
        const s=await store.get('ct_srs');
        const h=await store.get('ct_hist');
        const d=await store.get('ct_degh');
        const m=await store.get('ct_mastered');
        if(s)setSrs(JSON.parse(s.value));
        if(h)setHist(JSON.parse(h.value));
        if(d)setDegHist(JSON.parse(d.value));
        if(m)setMastered(new Set(JSON.parse(m.value)));
      }catch(e){}
      setLoaded(true);
    })();
  },[]);

  const saveSrs=async d=>{setSrs(d);try{await store.set('ct_srs',JSON.stringify(d));}catch(e){}};
  const saveHist=async d=>{setHist(d);try{await store.set('ct_hist',JSON.stringify(d));}catch(e){}};
  const saveDegHist=async d=>{setDegHist(d);try{await store.set('ct_degh',JSON.stringify(d));}catch(e){}};
  const saveMastered=async s=>{setMastered(s);try{await store.set('ct_mastered',JSON.stringify([...s]));}catch(e){}};

  const onToggleMastered=useCallback(async id=>{
    const s=new Set(masteredRef.current);
    if(s.has(id))s.delete(id);else s.add(id);
    await saveMastered(s);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  const onChordQuizDone=useCallback(async results=>{
    const ns={...srsRef.current},nh=[...histRef.current],td=todayStr();
    for(const r of results){ns[r.id]=updateSRS(ns[r.id],r.correct);nh.push({id:r.id,correct:r.correct,date:td});}
    await saveSrs(ns);await saveHist(nh);
  },[]); // eslint-disable-line

  const onDegDone=useCallback(async results=>{
    const nd=[...degHistRef.current,...results.map(r=>({...r,date:todayStr()}))];
    await saveDegHist(nd);
  },[]); // eslint-disable-line

  // STABLE callback — empty deps, reads fresh state via refs.
  // ChordsOfDay is React.memo'd and ignores srsData/onMarkReviewed prop changes,
  // so the 2 setSrs+setHist calls here never cause ChordsOfDay to re-render.
  const onMarkReviewed=useCallback(async id=>{
    const ns={...srsRef.current,[id]:updateSRS(srsRef.current[id],true)};
    const nh=[...histRef.current,{id,correct:true,date:todayStr()}];
    await saveSrs(ns);await saveHist(nh);
  },[]); // eslint-disable-line

  const exportData=()=>{
    const json=JSON.stringify({srs,hist,degHist,mastered:[...mastered],v:2,exported:new Date().toISOString()},null,2);
    const a=document.createElement('a');
    a.href='data:application/json;charset=utf-8,'+encodeURIComponent(json);
    a.download=`chordtrainer-${todayStr()}.json`;
    document.body.appendChild(a);a.click();document.body.removeChild(a);
  };

  const importData=e=>{
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=async ev=>{
      try{
        const data=JSON.parse(ev.target.result);
        if(data.srs)await saveSrs(data.srs);
        if(data.hist)await saveHist(data.hist);
        if(data.degHist)await saveDegHist(data.degHist);
        if(data.mastered)await saveMastered(new Set(data.mastered));
        setImportMsg('✓ Imported!');setTimeout(()=>setImportMsg(''),3000);
      }catch(err){setImportMsg('✗ Invalid file');}
      e.target.value='';
    };
    reader.readAsText(file);
  };

  if(!loaded)return(<div style={{background:'#0f0e17',minHeight:'100vh',minHeight:'-webkit-fill-available',display:'flex',alignItems:'center',justifyContent:'center',color:'#ffd93d',fontSize:'16px'}}>Loading…</div>);

  const TABS=[{id:'daily',label:'Today',icon:'🌅'},{id:'library',label:'Library',icon:'📚'},{id:'progs',label:'Progs',icon:'🎵'},{id:'quiz',label:'Quiz',icon:'🎯'},{id:'weak',label:'Weak',icon:'💪'},{id:'help',label:'Guide',icon:'📖'}];

  return(
    <div style={{background:'#0f0e17',height:'100dvh',display:'flex',flexDirection:'column',color:'#fffffe',fontFamily:"'Segoe UI',system-ui,sans-serif",WebkitFontSmoothing:'antialiased',paddingTop:'env(safe-area-inset-top)'}}>
      <div style={{padding:'10px 12px',borderBottom:'1px solid #1a1928',display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
        <div style={{display:'flex',flexDirection:'column'}}>
          <div style={{fontSize:'16px',fontWeight:900,lineHeight:'1.1'}}>🎸 <span style={{color:'#ffd93d'}}>Chord</span>Trainer</div>
          <div style={{fontSize:'9px',color:'#555',letterSpacing:'1px',paddingLeft:'22px'}}>by Zak</div>
        </div>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'7px',flexWrap:'wrap',justifyContent:'flex-end'}}>
          <button onClick={()=>setShowData(p=>!p)} style={{background:'transparent',border:'1px solid #2a2840',color:'#888',padding:'5px 9px',borderRadius:'7px',cursor:'pointer',fontSize:'10px',minHeight:'36px',whiteSpace:'nowrap',touchAction:'manipulation'}}>⬆⬇ Data</button>
          <button onClick={()=>setShowDeg(p=>!p)} style={{padding:'7px 12px',borderRadius:'9px',cursor:'pointer',fontSize:'11px',fontWeight:700,border:`2px solid ${showDeg?'#ffd93d':'#555'}`,background:showDeg?'#ffd93d':'transparent',color:showDeg?'#111':'#bbb',transition:'background .2s,color .2s,border-color .2s,box-shadow .2s',minHeight:'36px',whiteSpace:'nowrap',boxShadow:showDeg?'0 0 12px #ffd93d55':'none',touchAction:'manipulation'}}>
            {showDeg?'✦ Degrees ON':'Scale Degrees'}
          </button>
        </div>
      </div>
      {showData&&(
        <div style={{background:'#13121f',borderBottom:'1px solid #1a1928',padding:'9px 12px',display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
          <span style={{fontSize:'10px',color:'#888'}}>Progress backup:</span>
          <button onClick={exportData} style={{background:'#a29bfe22',color:'#a29bfe',border:'1px solid #a29bfe44',padding:'5px 12px',borderRadius:'7px',cursor:'pointer',fontSize:'10px',fontWeight:700,minHeight:'36px',touchAction:'manipulation'}}>Export ↓</button>
          <label style={{background:'#4ecdc422',color:'#4ecdc4',border:'1px solid #4ecdc444',padding:'5px 12px',borderRadius:'7px',cursor:'pointer',fontSize:'10px',fontWeight:700,minHeight:'36px',display:'flex',alignItems:'center',touchAction:'manipulation'}}>Import ↑<input type="file" accept=".json" onChange={importData} style={{display:'none'}}/></label>
          {importMsg&&<span style={{fontSize:'10px',color:importMsg.startsWith('✓')?'#00b894':'#ff6363',fontWeight:700}}>{importMsg}</span>}
          <span style={{fontSize:'9px',color:'#444',marginLeft:'auto'}}>{Object.keys(srs).length} SRS · {hist.length} history · {degHist.length} deg</span>
        </div>
      )}
      {/* Tab bar — 44px min-height per Apple HIG; overflowX hidden but scrollable to avoid clipping */}
      <div style={{display:'flex',borderBottom:'1px solid #1a1928',overflowX:'auto',WebkitOverflowScrolling:'touch',scrollbarWidth:'none'}}>
        {TABS.map(t=>(<button key={t.id} onClick={()=>{setTab(t.id);if(scrollRef.current)scrollRef.current.scrollTop=0;}} style={{flex:'0 0 auto',padding:'10px 10px',background:'transparent',border:'none',cursor:'pointer',fontSize:'10px',fontWeight:600,color:tab===t.id?'#ffd93d':'#888',borderBottom:tab===t.id?'2px solid #ffd93d':'2px solid transparent',whiteSpace:'nowrap',minHeight:'44px',touchAction:'manipulation'}}>{t.icon} {t.label}</button>))}
      </div>
      {/* Safe-area bottom padding + extra room for install banner */}
      {/* Scrollable content — flex:1 takes remaining height below header+tabbar */}
      <div ref={scrollRef} style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',overscrollBehaviorY:'none'}}>
        <div style={{paddingBottom:'max(32px,env(safe-area-inset-bottom))'}}>
        {tab==='daily'&&<ChordsOfDay srsData={srs} showDeg={showDeg} setShowDeg={setShowDeg} onMarkReviewed={onMarkReviewed} mastered={mastered} onToggleMastered={onToggleMastered} scrollRef={scrollRef}/>}
        {tab==='library'&&<Library showDeg={showDeg} setShowDeg={setShowDeg} mastered={mastered} onToggleMastered={onToggleMastered} scrollRef={scrollRef}/>}
        {tab==='progs'&&<ProgressionsTab showDeg={showDeg}/>}
        {tab==='quiz'&&<QuizTab showDeg={showDeg} onChordQuizDone={onChordQuizDone} onDegDone={onDegDone}/>}
        {tab==='weak'&&<WeakTab history={hist} degHist={degHist} srs={srs} showDeg={showDeg} onComplete={onChordQuizDone}/>}
        {tab==='help'&&<HelpTab/>}
      {showAudioHint&&(
          <AudioHintPanel
            onDismiss10={()=>{
              setShowAudioHint(false);
              try{const n=parseInt(localStorage.getItem('ct_launches')||'0',10);localStorage.setItem('ct_audio_hint_launch',String(n+10));}catch(e){}
            }}
            onDismiss20={()=>{
              setShowAudioHint(false);
              try{const n=parseInt(localStorage.getItem('ct_launches')||'0',10);localStorage.setItem('ct_audio_hint_launch20',String(n+20));}catch(e){}
            }}
          />
        )}
        </div>
      </div>
      <BannerStack/>
    </div>
  );
}
