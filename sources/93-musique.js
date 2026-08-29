/*
 * mily-music.js — bande-son générative du jeu « Mily Boum »
 *
 * Morceau French house de 144 mesures, entièrement synthétisé en direct
 * avec la Web Audio API. Aucun fichier audio, aucun réseau, aucune
 * dépendance : le fichier suffit.
 *
 * Usage minimal :
 *     bouton.addEventListener('click', function(){ MilyMusic.play(); });
 *
 * IMPORTANT : play() doit partir d'un geste utilisateur (clic / toucher),
 * sinon les navigateurs bloquent le son. Voir INTEGRATION.md.
 *
 * ----------------------------------------------------------------------
 * CE QUI A ÉTÉ CHANGÉ POUR L'INTÉGRER AU JEU, et rien d'autre :
 *
 *   1. La balise <script> de l'exemple d'usage, en commentaire, est
 *      partie. Le jeu est UN fichier avec UNE balise de script : une
 *      fermeture de balise écrite dans un commentaire ferme quand même
 *      le script, l'analyseur HTML ne lit pas les commentaires du
 *      JavaScript. C'était une bombe à retardement de deux caractères.
 *   2. Deux lectures se sont ajoutées à l'API, `debloque()` et
 *      `horloge()`. Elles n'écrivent rien et ne jouent rien — voir
 *      leur commentaire tout en bas. Le moteur, lui, est intact.
 * ---------------------------------------------------------------------- */
(function (root) {
  'use strict';

  var AC = root.AudioContext || root.webkitAudioContext;

  /* ------------------------------------------------------------------ */
  /* Carte du morceau                                                    */
  /* ------------------------------------------------------------------ */

  var SECTIONS = {
    intro: 0,      // discours présidentiel, ne se rejoue jamais après le 1er passage
    groove: 8,     // entrée du beat
    buildup: 24,   // montée vers le premier drop
    drop: 28,      // 4 mesures avant le drop, pour entendre la coupure
    drop2: 64,
    descent: 80,
    ibiza: 86,     // percussions, marimba
    final: 108     // build final puis drop accéléré
  };

  var LOOP_START = 16;   // après la mesure 143 on repart ici : plus de discours
  var LOOP_END = 143;

  function sectionName(b) {
    if (b < 8) return 'discours';
    if (b < 16) return 'entree';
    if (b < 24) return 'montee';
    if (b < 32) return 'build';
    if (b < 48) return 'drop1';
    if (b < 56) return 'break';
    if (b < 64) return 'build2';
    if (b < 80) return 'drop2';
    if (b < 88) return 'descente';
    if (b < 104) return 'ibiza';
    if (b < 112) return 'build3';
    if (b < 136) return 'final';
    return 'boucle';
  }
  function tempoMul(b) {
    return b < 104 ? 1 : (b < 112 ? 1.04 : (b < 136 ? 1.08 : (b < 140 ? 1.04 : 1)));
  }
  function cutAt(b) {
    if (b < 8) return 500;
    if (b < 12) return 900;
    if (b < 16) return 1500;
    if (b < 24) return 1200 + (b - 16) * 470;
    if (b < 32) return 1800 + (b - 24) * 1100;
    if (b < 48) return 9000;
    if (b < 52) return 3200;
    if (b < 56) return 1500;
    if (b < 64) return 1500 + (b - 56) * 1050;
    if (b < 80) return 9500;
    if (b < 88) return Math.max(700, 4200 - (b - 80) * 520);
    if (b < 92) return 1600;
    if (b < 96) return 2400;
    if (b < 100) return 4200;
    if (b < 104) return 5200 + (b - 100) * 900;
    if (b < 112) return 2200 + (b - 104) * 950;
    if (b < 136) return 10000;
    if (b < 144) return 9000 - (b - 136) * 800;
    return 3000;
  }

  /* Harmonie : La mineur — Am, F, C, G, une mesure par accord. */
  var CH = [[64, 69, 72, 76], [65, 69, 72, 77], [64, 67, 72, 76], [62, 67, 71, 74]];
  var RT = [45, 41, 48, 43];
  var BP = [[0, 1.7, 0], [2, 1, 0], [3, 1, 12], [6, 1.7, 0], [8, 1.7, 0], [10, 1, 0], [11, 1, 12], [14, 1.7, 0]];
  var SP = [[2, 1], [3, 1], [6, 1.6], [10, 1], [11, 1], [14, 1.6]];
  var LP = [
    [[0, 4, 81], [6, 2, 79], [8, 4, 76], [14, 2, 81]],
    [[0, 4, 84], [6, 2, 81], [8, 4, 77], [14, 2, 79]],
    [[0, 4, 79], [6, 2, 81], [10, 4, 84], [14, 2, 79]],
    [[0, 4, 83], [6, 2, 81], [10, 6, 79]]
  ];
  var IM = [
    [[0, 3, 76], [4, 2, 79], [8, 4, 81], [14, 2, 79]],
    [[0, 3, 81], [4, 2, 84], [8, 4, 81], [14, 2, 79]],
    [[0, 3, 79], [4, 2, 81], [8, 4, 84], [14, 2, 81]],
    [[0, 3, 81], [4, 2, 79], [10, 6, 76]]
  ];

  /* ------------------------------------------------------------------ */
  /* Voix : synthèse par formants (vocoder) + voix système pour l'intro  */
  /* ------------------------------------------------------------------ */

  /* [F1, F2, F3, amplitude voisée, amplitude bruit, fréquence bruit] */
  var PH = {
    'i': [300, 2300, 3000, 1, 0, 0], 'I': [420, 2000, 2600, 1, 0, 0], 'E': [600, 1750, 2450, 1, 0, 0],
    'a': [730, 1150, 2450, 1, 0, 0], 'O': [570, 850, 2400, 1, 0, 0], 'o': [450, 800, 2600, 1, 0, 0],
    'u': [320, 880, 2250, 1, 0, 0], 'V': [640, 1200, 2400, 1, 0, 0], '@': [500, 1450, 2450, 0.85, 0, 0],
    'm': [280, 900, 2200, 0.55, 0, 0], 'n': [300, 1600, 2600, 0.55, 0, 0], 'l': [380, 1100, 2700, 0.85, 0, 0],
    'r': [420, 1100, 1650, 0.85, 0, 0], 'w': [330, 700, 2200, 0.85, 0, 0],
    'z': [300, 1600, 2500, 0.7, 0.26, 4500], 'D': [350, 1400, 2400, 0.7, 0.18, 3000],
    's': [400, 1700, 2500, 0, 0.5, 6000], 'S': [400, 1700, 2500, 0, 0.5, 3400],
    'f': [400, 1400, 2400, 0, 0.3, 5000], 'h': [500, 1500, 2400, 0, 0.24, 2000],
    't': [400, 1700, 2500, 0, 0.44, 5000], 'k': [400, 1500, 2400, 0, 0.38, 3000],
    'p': [400, 1000, 2300, 0, 0.3, 1800], '.': [400, 1400, 2400, 0, 0, 2000]
  };
  var DW = {
    'i': 1, 'I': 1, 'E': 1, 'a': 1, 'O': 1, 'o': 1, 'u': 1, 'V': 1, '@': 0.8,
    'm': 0.5, 'n': 0.5, 'l': 0.5, 'r': 0.5, 'w': 0.5, 'z': 0.6, 'D': 0.5,
    's': 0.7, 'S': 0.7, 'f': 0.6, 'h': 0.5, 't': 0.35, 'k': 0.35, 'p': 0.35, '.': 1
  };

  /* Chaque entrée : [phonèmes, note MIDI, coefficient de durée] */
  var L = {
    in1: [['wi', 48], ['Ol', 47, 1.2], ['kEIm', 48], ['hir', 46, 1.3], ['.', 0, 0.6], ['fOr', 45], ['mI', 46], ['li', 43, 2]],
    in2: [['wEr', 47], ['Iz', 46], ['mI', 47], ['li', 50, 2]],
    thisIs: [['DIs', 69], ['Iz', 69], ['mI', 72, 1.2], ['li', 69, 2]],
    mily: [['mI', 72], ['li', 69, 2.2]],
    showUp: [['mI', 72], ['li', 69], ['.', 0, 0.5], ['So', 67], ['Vp', 69, 1.8]],
    where: [['wEr', 67], ['Iz', 69], ['mI', 72], ['li', 69, 2]],
    night: [['mI', 76], ['li', 72], ['In', 72, 0.7], ['D@', 71, 0.7], ['naIt', 72, 2]],
    light: [['mI', 76], ['li', 72], ['In', 72, 0.7], ['D@', 71, 0.7], ['laIt', 74, 2]],
    allN: [['mI', 74], ['li', 72], ['Ol', 69, 0.9], ['naIt', 72, 2]],
    oneM: [['wVn', 72], ['mOr', 71], ['taIm', 69, 1.6], ['fOr', 72], ['mI', 76], ['li', 74, 2]],
    big: [['DIs', 69, 2], ['.', 0, 1.4], ['Iz', 69, 2], ['.', 0, 1.4], ['mI', 72, 2.4], ['li', 76, 5]]
  };

  function ph(spec) {
    var out = [];
    spec.forEach(function (w) {
      var k = w[2] || 1;
      for (var i = 0; i < w[0].length; i++) {
        var c = w[0][i];
        out.push([c, (DW[c] || 0.6) * k, w[1]]);
      }
    });
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* État                                                                */
  /* ------------------------------------------------------------------ */

  var ctx = null, master, gate, side, drums, perc, cf, cg, bg, lg, voc, spk,
      verb, vs, dl, dfb, dsend, NB;
  var playing = false, bar = 0, st = 0, mul = 1, nt = 0, tid = null, pend = [];
  var bpm = 126, fMul = 1.38, vol = 0.72, vLvl = 1.1, voiceMode = 'system';
  var voices = [], listeners = { section: [], lyric: [], error: [] };

  function emit(ev, data) {
    var l = listeners[ev] || [];
    for (var i = 0; i < l.length; i++) {
      try { l[i](data); } catch (e) { /* un écouteur cassé ne doit pas couper le son */ }
    }
  }
  function fail(e) { emit('error', e && e.message ? e.message : String(e)); }

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function s16() { return 60 / (bpm * mul) / 4; }
  function bt() { return 60 / (bpm * mul); }

  /* ------------------------------------------------------------------ */
  /* Graphe audio                                                        */
  /* ------------------------------------------------------------------ */

  function impulse(dur, decay) {
    var n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = b.getChannelData(c);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
    }
    return b;
  }
  function ns() { var s = ctx.createBufferSource(); s.buffer = NB; s.loop = true; return s; }

  function build() {
    ctx = new AC();

    var n = ctx.sampleRate * 2;
    NB = ctx.createBuffer(1, n, ctx.sampleRate);
    var d0 = NB.getChannelData(0);
    for (var i = 0; i < n; i++) d0[i] = Math.random() * 2 - 1;

    var lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -8; lim.ratio.value = 10;
    lim.attack.value = 0.004; lim.release.value = 0.2;

    master = ctx.createGain(); master.gain.value = vol;
    gate = ctx.createGain(); gate.gain.value = 1;          // coupure avant les drops
    gate.connect(master); master.connect(lim); lim.connect(ctx.destination);

    side = ctx.createGain(); side.gain.value = 1; side.connect(gate);   // bus sidechainé
    drums = ctx.createGain(); drums.gain.value = 0.95; drums.connect(gate);
    perc = ctx.createGain(); perc.gain.value = 0.85; perc.connect(side);

    verb = ctx.createConvolver(); verb.buffer = impulse(2.6, 2.3);
    vs = ctx.createGain(); vs.gain.value = 0.27; vs.connect(verb); verb.connect(gate);

    dl = ctx.createDelay(1); dl.delayTime.value = 0.35;
    dfb = ctx.createGain(); dfb.gain.value = 0.4;
    dsend = ctx.createGain(); dsend.gain.value = 0.3;
    dsend.connect(dl); dl.connect(dfb); dfb.connect(dl); dl.connect(side); dl.connect(vs);

    cf = ctx.createBiquadFilter(); cf.type = 'lowpass';
    cf.frequency.value = 600; cf.Q.value = 6;
    cg = ctx.createGain(); cg.gain.value = 0.5;
    cf.connect(cg); cg.connect(side); cg.connect(vs);

    bg = ctx.createGain(); bg.gain.value = 0.8; bg.connect(side);
    lg = ctx.createGain(); lg.gain.value = 0.28;
    lg.connect(side); lg.connect(dsend); lg.connect(vs);

    var vc = ctx.createDynamicsCompressor();
    vc.threshold.value = -20; vc.ratio.value = 3.5;
    vc.attack.value = 0.006; vc.release.value = 0.14;
    voc = ctx.createGain(); voc.gain.value = 0.9 * vLvl;
    voc.connect(vc); vc.connect(side); vc.connect(dsend); vc.connect(vs);

    spk = ctx.createGain(); spk.gain.value = 1;
    spk.connect(gate); spk.connect(vs);
  }

  /* ------------------------------------------------------------------ */
  /* Instruments                                                         */
  /* ------------------------------------------------------------------ */

  function duck(t, a) {
    side.gain.cancelScheduledValues(t);
    side.gain.setValueAtTime(a, t);
    side.gain.linearRampToValueAtTime(1, t + Math.min(0.32, bt() * 0.6));
  }
  function kick(t, a) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.085);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(a, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(g); g.connect(drums); o.start(t); o.stop(t + 0.44);
    var s = ns(), hp = ctx.createBiquadFilter(), ng = ctx.createGain();
    hp.type = 'highpass'; hp.frequency.value = 1600;
    ng.gain.setValueAtTime(0.22 * a, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
    s.connect(hp); hp.connect(ng); ng.connect(drums); s.start(t); s.stop(t + 0.04);
  }
  function subHit(t) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(70, t);
    o.frequency.exponentialRampToValueAtTime(28, t + 0.7);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.7, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    o.connect(g); g.connect(drums); o.start(t); o.stop(t + 0.85);
  }
  function clap(t, a) {
    for (var i = 0; i < 3; i++) {
      var tt = t + i * 0.012, s = ns(), bq = ctx.createBiquadFilter(), g = ctx.createGain();
      bq.type = 'bandpass'; bq.frequency.value = 1500; bq.Q.value = 1.2;
      g.gain.setValueAtTime(0.0001, tt);
      g.gain.exponentialRampToValueAtTime(0.45 * a, tt + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.035);
      s.connect(bq); bq.connect(g); g.connect(drums); g.connect(vs);
      s.start(tt); s.stop(tt + 0.05);
    }
  }
  function hat(t, open, a) {
    var s = ns(), hp = ctx.createBiquadFilter(), g = ctx.createGain(), d = open ? 0.26 : 0.038;
    hp.type = 'highpass'; hp.frequency.value = 7600;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(a, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(hp); hp.connect(g); g.connect(drums);
    if (open) g.connect(vs);
    s.start(t); s.stop(t + d + 0.03);
  }
  function shaker(t, a) {
    var s = ns(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    hp.type = 'highpass'; hp.frequency.value = 6800;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(a, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    s.connect(hp); hp.connect(g); g.connect(perc); s.start(t); s.stop(t + 0.08);
  }
  function conga(t, f, a) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f * 1.7, t);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.035);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(a, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g); g.connect(perc); g.connect(vs); o.start(t); o.stop(t + 0.26);
  }
  function crash(t, a) {
    var s = ns(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    hp.type = 'highpass'; hp.frequency.value = 5000;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(a, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    s.connect(hp); hp.connect(g); g.connect(drums); g.connect(vs);
    s.start(t); s.stop(t + 1.7);
  }
  function crowd(t, dur) {
    var s = ns(), bq = ctx.createBiquadFilter(), g = ctx.createGain();
    bq.type = 'bandpass'; bq.frequency.value = 800; bq.Q.value = 0.8;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.05, t + 1.2);
    for (var i = 0; i < 10; i++) {
      g.gain.linearRampToValueAtTime(0.03 + Math.random() * 0.03, t + 1.2 + i * (dur / 10));
    }
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    s.connect(bq); bq.connect(g); g.connect(drums); g.connect(vs);
    s.start(t); s.stop(t + dur + 0.1);
  }
  function riser(t, dur, a) {
    var s = ns(), bq = ctx.createBiquadFilter(), g = ctx.createGain();
    bq.type = 'bandpass'; bq.Q.value = 3.2;
    bq.frequency.setValueAtTime(350, t);
    bq.frequency.exponentialRampToValueAtTime(9000, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(a, t + dur * 0.94);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
    s.connect(bq); bq.connect(g); g.connect(drums); g.connect(vs);
    s.start(t); s.stop(t + dur + 0.15);
  }
  function faller(t, dur) {
    var s = ns(), bq = ctx.createBiquadFilter(), g = ctx.createGain();
    bq.type = 'bandpass'; bq.Q.value = 2.6;
    bq.frequency.setValueAtTime(7000, t);
    bq.frequency.exponentialRampToValueAtTime(300, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(bq); bq.connect(g); g.connect(drums); g.connect(vs);
    s.start(t); s.stop(t + dur + 0.1);
  }
  function bass(t, m, dur) {
    var f = mtof(m), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    lp.type = 'lowpass'; lp.Q.value = 7;
    lp.frequency.setValueAtTime(300, t);
    lp.frequency.linearRampToValueAtTime(1700, t + 0.022);
    lp.frequency.exponentialRampToValueAtTime(380, t + 0.18);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.55, t + 0.007);
    g.gain.setTargetAtTime(0.32, t + 0.012, 0.08);
    g.gain.setTargetAtTime(0.0001, t + dur, 0.02);
    var a = ctx.createOscillator(); a.type = 'sawtooth'; a.frequency.value = f; a.detune.value = -6;
    var b = ctx.createOscillator(); b.type = 'sawtooth'; b.frequency.value = f; b.detune.value = 7;
    var c = ctx.createOscillator(); c.type = 'sine'; c.frequency.value = f / 2;
    a.connect(lp); b.connect(lp); c.connect(lp); lp.connect(g); g.connect(bg);
    [a, b, c].forEach(function (o) { o.start(t); o.stop(t + dur + 0.15); });
  }
  function subBass(t, m, dur) {
    var f = mtof(m), g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.4, t + 0.05);
    g.gain.setTargetAtTime(0.0001, t + dur, 0.12);
    var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f / 2;
    var p = ctx.createOscillator(); p.type = 'triangle'; p.frequency.value = f; p.detune.value = 5;
    var tg = ctx.createGain(); tg.gain.value = 0.25;
    o.connect(g); p.connect(tg); tg.connect(g); g.connect(bg);
    o.start(t); o.stop(t + dur + 0.5); p.start(t); p.stop(t + dur + 0.5);
  }
  function stab(t, notes, dur, oct, amp) {
    var g = ctx.createGain(), v = amp || 0.26;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.008);
    g.gain.setTargetAtTime(v * 0.45, t + 0.012, 0.05);
    g.gain.setTargetAtTime(0.0001, t + dur, 0.03);
    g.connect(cf);
    notes.forEach(function (m) {
      var f = mtof(m + (oct || 0));
      [-8, 9].forEach(function (dt) {
        var o = ctx.createOscillator(); o.type = 'sawtooth';
        o.frequency.value = f; o.detune.value = dt;
        o.connect(g); o.start(t); o.stop(t + dur + 0.18);
      });
    });
  }
  function pad(t, notes, dur, lvl) {
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(lvl || 0.09, t + dur * 0.4);
    g.gain.setTargetAtTime(0.0001, t + dur * 0.85, 0.4);
    g.connect(cf);
    notes.forEach(function (m) {
      var f = mtof(m - 12);
      [-7, 8].forEach(function (dt) {
        var o = ctx.createOscillator(); o.type = 'sawtooth';
        o.frequency.value = f; o.detune.value = dt;
        o.connect(g); o.start(t); o.stop(t + dur + 1.3);
      });
    });
  }
  function lead(t, m, dur) {
    var f = mtof(m), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    lp.type = 'lowpass'; lp.Q.value = 4;
    lp.frequency.setValueAtTime(1100, t);
    lp.frequency.linearRampToValueAtTime(5000, t + 0.05);
    lp.frequency.exponentialRampToValueAtTime(1800, t + dur + 0.1);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.015);
    g.gain.setTargetAtTime(0.2, t + 0.03, 0.09);
    g.gain.setTargetAtTime(0.0001, t + dur, 0.04);
    [-12, -9, 0, 10].forEach(function (dt, i) {
      var o = ctx.createOscillator();
      o.type = i === 0 ? 'square' : 'sawtooth';
      o.frequency.value = i === 0 ? f / 2 : f;
      o.detune.value = dt; o.connect(lp);
      o.start(t); o.stop(t + dur + 0.2);
    });
    lp.connect(g); g.connect(lg);
  }
  function marimba(t, m, a) {
    var f = mtof(m);
    [[1, 0.5, 0.7], [2, 0.22, 0.34], [4.01, 0.09, 0.17], [0.5, 0.14, 0.75]].forEach(function (p) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f * p[0];
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(p[1] * (a || 1), t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + p[2]);
      o.connect(g); g.connect(lg); o.start(t); o.stop(t + p[2] + 0.06);
    });
  }

  /* Synthèse par formants : trois filtres passe-bande suivent les voyelles */
  function sing(t, seq, dur, gv, spoken) {
    var tot = 0;
    seq.forEach(function (x) { tot += x[1]; });
    if (tot <= 0) return;

    var out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.linearRampToValueAtTime(gv, t + 0.014);
    out.connect(spoken ? spk : voc);

    var vd = ctx.createGain(); vd.gain.value = 0.0001;
    var nz = ctx.createGain(); nz.gain.value = 0.0001;
    var nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.Q.value = 1.4; nf.frequency.value = 3000;
    var bd = ctx.createBiquadFilter(); bd.type = 'lowpass'; bd.frequency.value = 460;
    var bgn = ctx.createGain(); bgn.gain.value = spoken ? 0.22 : 0.45;

    var Q = spoken ? [4, 5, 6] : [7, 8.5, 10];
    var G = spoken ? [1, 0.9, 0.42] : [1, 0.66, 0.3];
    var fs = [];
    for (var i = 0; i < 3; i++) {
      var bq = ctx.createBiquadFilter();
      bq.type = 'bandpass'; bq.Q.value = Q[i]; bq.frequency.value = 500;
      var gg = ctx.createGain(); gg.gain.value = G[i];
      vd.connect(bq); bq.connect(gg); gg.connect(out); fs.push(bq);
    }
    vd.connect(bd); bd.connect(bgn); bgn.connect(out);

    var nsr = ns(); nsr.connect(nf); nf.connect(nz); nz.connect(out);

    var os = [];
    (spoken ? [0, -4] : [-9, 0, 10]).forEach(function (dt) {
      var o = ctx.createOscillator(); o.type = 'sawtooth'; o.detune.value = dt;
      o.connect(vd); os.push(o);
    });

    var tt = t, gl = spoken ? 0.014 : 0.022;
    seq.forEach(function (x) {
      var p = PH[x[0]] || PH['@'], sd = dur * x[1] / tot;
      fs[0].frequency.setTargetAtTime(p[0], tt, gl);
      fs[1].frequency.setTargetAtTime(p[1], tt, gl);
      fs[2].frequency.setTargetAtTime(p[2], tt, gl);
      vd.gain.setTargetAtTime(Math.max(0.0001, p[3]), tt, 0.014);
      nf.frequency.setTargetAtTime(p[5] || 3000, tt, 0.008);
      nz.gain.setTargetAtTime(Math.max(0.0001, p[4]), tt, 0.01);
      if (x[2]) {
        os.forEach(function (o) { o.frequency.setTargetAtTime(mtof(x[2]), tt, 0.024); });
      }
      tt += sd;
    });
    vd.gain.setTargetAtTime(0.0001, tt, 0.03);
    nz.gain.setTargetAtTime(0.0001, tt, 0.02);
    out.gain.setValueAtTime(gv, tt);
    out.gain.linearRampToValueAtTime(0.0001, tt + 0.12);
    os.forEach(function (o) { o.start(t); o.stop(tt + 0.2); });
    nsr.start(t); nsr.stop(tt + 0.2);
  }

  function later(t, fn) {
    pend.push(setTimeout(fn, Math.max(0, (t - ctx.currentTime) * 1000)));
  }
  function hook(t, spec, beats, text, g) {
    if (text) later(t, function () { emit('lyric', text); });
    sing(t, ph(spec), beats * bt(), g || 0.55, false);
  }
  /* ================================================================
     LA VOIX DE L'INTRO — POURQUOI ELLE SONNAIT COMME UNE PETITE VIEILLE

     Le défaut n'est pas apparu, il s'est RÉVÉLÉ : le discours ne se
     jouait jamais avant qu'on le branche, puisqu'on entrait toujours à
     la mesure 24. Deux choses se sont additionnées, et il fallait
     corriger les deux.

     1. LE CHOIX DE LA VOIX. La liste des préférées ne contient que des
        noms d'ordinateur de bureau — Alex et Daniel chez Apple, David
        chez Microsoft, Google US English. Sur une TABLETTE, aucun de
        ces noms n'existe. On tombait donc sur le repli, « la première
        voix anglaise venue », et sur Android cette première-là est le
        plus souvent une voix de FEMME. On cherche maintenant aussi les
        noms des moteurs de téléphone, et surtout on garde une passe
        générique : toute voix dont le nom dit « male » sans dire
        « female » fait l'affaire, quel que soit le fabricant.

     2. LA HAUTEUR DEMANDÉE. `pitch` allait à 0,45 sur une plage qui va
        de 0 à 2, où 1 est le naturel. C'est un transposeur poussé de
        plus d'une octave vers le bas — et les moteurs vocaux des
        téléphones décrochent bien avant : en dessous de 0,7 environ, la
        voix se met à crisser et à chevroter. Une voix de femme
        descendue à 0,45, c'est exactement la petite vieille.
        Une voix GRAVE ne s'obtient pas en écrasant la hauteur d'une
        voix aiguë : elle s'obtient en choisissant une voix grave, puis
        en la posant à peine plus bas. 0,8, et le débit remonte de 0,7
        à 0,88 — présidentiel, pas ralenti.
     ================================================================ */
  function pickVoice() {
    if (!voices.length) return null;
    var pref = ['Aaron', 'Alex', 'Daniel', 'Fred', 'Arthur', 'Microsoft Guy',
                'Microsoft David', 'Microsoft Mark', 'Google US English',
                'Google UK English Male', 'Tom', 'Nathan',
                /* les moteurs de téléphone, absents de la liste d'origine */
                'English United States male', 'en-us-x-iom', 'en-us-x-tpd',
                'en-gb-x-gbb', 'Samsung', 'Rishi', 'James', 'Oliver'];
    var i, j;
    for (i = 0; i < pref.length; i++) {
      for (j = 0; j < voices.length; j++) {
        if (voices[j].name.indexOf(pref[i]) >= 0 && voices[j].lang.indexOf('en') === 0) return voices[j];
      }
    }
    /* la passe générique : « male » oui, « female » non — c'est le seul
       indice de genre que l'API laisse, et il vaut mieux que rien */
    for (j = 0; j < voices.length; j++) {
      var n = voices[j].name.toLowerCase();
      if (voices[j].lang.indexOf('en') === 0 &&
          n.indexOf('male') >= 0 && n.indexOf('female') < 0) return voices[j];
    }
    for (var k = 0; k < voices.length; k++) {
      if (voices[k].lang.indexOf('en') === 0) return voices[k];
    }
    return null;
  }
  function announce(t, spec, text, spoken, beats) {
    later(t, function () { emit('lyric', text); });
    if (voiceMode === 'system' && ('speechSynthesis' in root)) {
      later(t, function () {
        try {
          var u = new root.SpeechSynthesisUtterance(spoken);
          var v = pickVoice(); if (v) u.voice = v;
          /* 0,8 et non 0,45 : voir pickVoice. En dessous de 0,7 les
             moteurs vocaux des téléphones chevrotent. */
          u.rate = 0.88; u.pitch = 0.8; u.volume = 1; u.lang = 'en-US';
          root.speechSynthesis.speak(u);
        } catch (e) { /* silencieux : la voix système est optionnelle */ }
      });
    } else {
      sing(t, ph(spec), beats * bt(), 0.6, true);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Séquenceur : une mesure = 16 pas                                    */
  /* ------------------------------------------------------------------ */

  function step(b, s, t) {
    var ci = b % 4, d = s16();
    var cut = (b === 31 || b === 63 || b === 111);
    var pre = (b === 30 || b === 62 || b === 110);
    var dA = (b >= 32 && b < 48), dB = (b >= 64 && b < 80),
        fin = (b >= 112 && b < 136), turn = (b >= 136);
    var big = dA || dB || fin || turn;
    var desc = (b >= 80 && b < 88), ib = (b >= 88 && b < 104);
    var iA = (b >= 88 && b < 92), iB = (b >= 92 && b < 96), iD = (b >= 100 && b < 104);
    var bld = (b >= 24 && b < 32) || (b >= 56 && b < 64) || (b >= 104 && b < 112);
    var brk = (b >= 48 && b < 56), mont = (b >= 16 && b < 24);
    var noKick = (b >= 48 && b < 52) || iA;

    if (s === 0) {
      var fr = cf.frequency, a = cutAt(b) * fMul, z = cutAt(b + 1) * fMul;
      fr.cancelScheduledValues(t);
      fr.setValueAtTime(Math.max(120, a), t);
      fr.linearRampToValueAtTime(Math.max(120, z), t + d * 16);
      dl.delayTime.setValueAtTime(bt() * 0.75, t);
      if (b === 0) crowd(t, bt() * 32);
      if (b % 4 === 0 && (b < 16 || brk || desc || ib)) pad(t, CH[ci], d * 16, ib ? 0.11 : 0.09);
      if (b === 8 || b === 32 || b === 40 || b === 64 || b === 72 || b === 112 || b === 120 || b === 128) crash(t, 0.26);
      if (b === 32 || b === 64 || b === 112) subHit(t);
      if (b === 24 || b === 56 || b === 104) riser(t, bt() * 32, 0.16);
      if (b === 28 || b === 60 || b === 108) riser(t, bt() * 16, 0.2);
      if (b === 80) faller(t, bt() * 8);
      if (b === 102) riser(t, bt() * 8, 0.14);
    }

    /* Voix */
    if (b === 0 && s === 0) announce(t, L.in1, 'We all came here for Mily.', 'We all came here for Milly.', 7);
    if (b === 4 && s === 0) announce(t, L.in2, 'Where is Mily?', 'Where is Milly?', 4);
    if (b === 8 && s === 0) hook(t, L.thisIs, 4, 'This is Mily.', 0.6);
    if (b === 12 && s === 0) hook(t, L.showUp, 4, 'Mily… show up.');
    if (b === 16 && s === 0) hook(t, L.thisIs, 3.5, 'This is Mily.');
    if (b === 18 && s === 8) hook(t, L.mily, 2, 'Mily.');
    if (b === 20 && s === 0) hook(t, L.where, 4, 'Where is Mily?');
    if (b === 22 && s === 0) hook(t, L.night, 4, 'Mily in the night.');
    if ((b === 26 || b === 28 || b === 58 || b === 60 || b === 106) && s === 0) hook(t, L.mily, 2, 'Mily.');
    if (pre && s === 0) hook(t, L.big, 7, 'This… is… Mily.', 0.68);
    if (b === 56 && s === 0) hook(t, L.thisIs, 3.5, 'This is Mily.');
    if (b === 104 && s === 0) hook(t, L.oneM, 6, 'One more time for Mily.', 0.6);
    if (b === 108 && s === 0) hook(t, L.where, 4, 'Where is Mily?');
    if (b === 48 && s === 0) hook(t, L.night, 5, 'Mily in the night.', 0.6);
    if (b === 50 && s === 0) hook(t, L.light, 5, 'Mily in the light.', 0.6);
    if (b === 52 && s === 0) hook(t, L.where, 4, 'Where is Mily?');
    if (b === 54 && s === 0) hook(t, L.mily, 2.5, 'Mily.');
    if (b === 80 && s === 0) hook(t, L.where, 6, 'Where is Mily?', 0.5);
    if (b === 84 && s === 0) hook(t, L.mily, 5, 'Mily…', 0.45);
    if (b === 89 && s === 0) hook(t, L.light, 6, 'Mily in the light.', 0.55);
    if (b === 93 && s === 0) hook(t, L.night, 6, 'Mily in the night.', 0.55);
    if (b === 97 && s === 0) hook(t, L.thisIs, 4, 'This is Mily.', 0.6);
    if (b === 101 && s === 0) hook(t, L.allN, 4, 'Mily all night.', 0.6);
    if ((dA || dB || fin) && s === 0) {
      var lb = (b - (dA ? 32 : dB ? 64 : 112)) % 8;
      if (lb === 0) hook(t, L.thisIs, 3.5, 'This is Mily.');
      if (lb === 2) hook(t, L.allN, 4, 'Mily all night.');
      if (lb === 4) hook(t, L.mily, 2, 'Mily.');
      if (lb === 6) hook(t, fin ? L.light : L.night, 4, fin ? 'Mily in the light.' : 'Mily in the night.');
    }
    if (turn && s === 0 && b % 4 === 0) hook(t, L.mily, 2, 'Mily.');

    /* Coupure très courte avant chaque gros drop */
    if (cut && s === 13) {
      gate.gain.cancelScheduledValues(t);
      gate.gain.setValueAtTime(1, t);
      gate.gain.linearRampToValueAtTime(0.0001, t + 0.02);
      later(t, function () { emit('lyric', '…'); });
    }
    if ((b === 0 || b === 32 || b === 64 || b === 112) && s === 0) {
      gate.gain.cancelScheduledValues(t);
      gate.gain.setValueAtTime(0.0001, t);
      gate.gain.linearRampToValueAtTime(1, t + 0.01);
    }

    /* Batterie */
    if (b >= 4 && b < 8 && s === 0) kick(t, 0.5);
    if (b >= 8 && !cut && !noKick) {
      if (desc) { if (s === 0 || s === 8) { kick(t, 0.8); duck(t, 0.45); } }
      else if (pre) { if (s === 0 || s === 8) { kick(t, 0.85); duck(t, 0.4); } }
      else if (iB) { if (s % 4 === 0) { kick(t, 0.72); duck(t, 0.42); } }
      else if (s % 4 === 0) { kick(t, big ? 1 : 0.9); duck(t, big ? 0.3 : 0.36); }
    }
    if (noKick && s % 4 === 0) duck(t, 0.5);

    if (b >= 8 && !cut && !pre) {
      if (desc) {
        if (s === 4 || s === 12) hat(t, s === 12, 0.09);
      } else if (ib) {
        if (s % 2 === 0) shaker(t, iA ? 0.08 : 0.1);
        if (!iA && s % 4 === 2) hat(t, true, 0.08);
        if (s === 2) conga(t, 196, 0.3);
        if (s === 7) conga(t, 262, 0.24);
        if (!iA && s === 11) conga(t, 175, 0.26);
      } else {
        if (s % 2 === 0) hat(t, false, 0.11);
        if ((big || mont) && s % 4 === 2) hat(t, true, 0.085);
        if (big && (s === 7 || s === 15)) hat(t, false, 0.07);
      }
    }

    if (bld && !cut && !pre) {
      var io = b % 8;
      if (io < 4) { if (s === 4 || s === 12) clap(t, 0.9); }
      else if (io < 6) { if (s % 4 === 0) clap(t, 0.85); }
      else { if (s % 2 === 0) clap(t, 0.55 + s * 0.03); }
    } else if (ib) {
      if (!iA && (s === 4 || s === 12)) clap(t, iB ? 0.6 : 0.8);
      if (b === 103 && s % 2 === 0) clap(t, 0.5 + s * 0.03);
    } else if (b >= 10 && !cut && !pre && !noKick && !desc) {
      if (s === 4 || s === 12) clap(t, 0.85);
    } else if (noKick && s === 12 && !iA) {
      clap(t, 0.45);
    } else if (desc && s === 12 && b < 84) {
      clap(t, 0.5);
    }

    /* Basse */
    if (desc || iA) {
      if (s === 0) subBass(t, RT[ci], d * 15);
    } else if (iB) {
      if (s === 0 || s === 6 || s === 10) bass(t, RT[ci], d * 2.5);
    } else if (ib) {
      for (var q = 0; q < BP.length; q++) if (BP[q][0] === s) bass(t, RT[ci] + BP[q][2], d * BP[q][1]);
    } else if (b >= 12 && !cut && !pre && !(brk && b < 52)) {
      for (var i = 0; i < BP.length; i++) if (BP[i][0] === s) bass(t, RT[ci] + BP[i][2], d * BP[i][1]);
    }

    /* Accords */
    if (desc) {
      if (b < 84 && s === 6) stab(t, CH[ci], d * 3, 0, 0.14);
    } else if (ib) {
      if (iA) { if (s === 6) stab(t, CH[ci], d * 3, 0, 0.12); }
      else if (s === 2 || s === 6 || s === 10 || s === 14) stab(t, CH[ci], d * 1.5, 0, iB ? 0.16 : 0.24);
    } else if (b >= 16 && !cut && !pre) {
      for (var j = 0; j < SP.length; j++) {
        if (SP[j][0] === s) stab(t, CH[ci], d * SP[j][1], (big && b >= 36) ? 12 : 0);
      }
    }

    /* Mélodies */
    if (ib && !iD) {
      var im = IM[ci];
      for (var z = 0; z < im.length; z++) if (im[z][0] === s) marimba(t, im[z][2], iA ? 0.85 : 1);
    }
    if ((b >= 36 && b < 48) || (b >= 68 && b < 80) || (b >= 116 && b < 136)) {
      var ml = LP[ci];
      for (var k = 0; k < ml.length; k++) {
        if (ml[k][0] === s) lead(t, ml[k][2] + (b >= 124 ? 12 : 0), d * ml[k][1]);
      }
    }
  }

  function tick() {
    try {
      while (nt < ctx.currentTime + 0.18) {
        step(bar, st, nt);
        if (st === 0) emit('section', { bar: bar, section: sectionName(bar) });
        nt += s16(); st++;
        if (st === 16) {
          st = 0; bar++;
          if (bar > LOOP_END) bar = LOOP_START;
          mul = tempoMul(bar);
        }
      }
    } catch (e) { fail(e); }
  }

  function clearPending() {
    for (var i = 0; i < pend.length; i++) clearTimeout(pend[i]);
    pend = [];
  }
  function resolveBar(where) {
    if (typeof where === 'number') return Math.max(0, Math.min(LOOP_END, Math.floor(where)));
    if (typeof where === 'string' && SECTIONS.hasOwnProperty(where)) return SECTIONS[where];
    return 0;
  }

  /* ------------------------------------------------------------------ */
  /* API publique                                                        */
  /* ------------------------------------------------------------------ */

  var MilyMusic = {

    SECTIONS: SECTIONS,

    /* Démarre le morceau. DOIT être appelé depuis un geste utilisateur.
       where : nom de section, numéro de mesure, ou rien (= depuis le début). */
    play: function (where) {
      try {
        if (!AC) { fail(new Error('Web Audio non supporté par ce navigateur')); return false; }
        if (!ctx) build();
        if (ctx.state === 'suspended') ctx.resume();
        clearPending();
        master.gain.setValueAtTime(vol, ctx.currentTime);
        gate.gain.cancelScheduledValues(ctx.currentTime);
        gate.gain.setValueAtTime(1, ctx.currentTime);
        bar = resolveBar(where); st = 0; mul = tempoMul(bar);
        nt = ctx.currentTime + 0.15;
        if (tid) clearInterval(tid);
        tid = setInterval(tick, 25);
        playing = true;
        return true;
      } catch (e) { fail(e); return false; }
    },

    /* Arrête et coupe le son. */
    stop: function () {
      try {
        playing = false;
        if (tid) { clearInterval(tid); tid = null; }
        clearPending();
        if (ctx) master.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
        if ('speechSynthesis' in root) { try { root.speechSynthesis.cancel(); } catch (e) {} }
        emit('lyric', '');
      } catch (e) { fail(e); }
    },

    /* Descend le volume puis arrête. Pour un changement d'écran. */
    fadeOut: function (seconds) {
      try {
        if (!ctx || !playing) return;
        var s = seconds || 2;
        master.gain.setTargetAtTime(0, ctx.currentTime, s / 4);
        setTimeout(function () { MilyMusic.stop(); }, s * 1000);
      } catch (e) { fail(e); }
    },

    /* Saute à une section sans couper le son. */
    jumpTo: function (where) {
      try {
        if (!playing) return MilyMusic.play(where);
        clearPending();
        if ('speechSynthesis' in root) { try { root.speechSynthesis.cancel(); } catch (e) {} }
        bar = resolveBar(where); st = 0; mul = tempoMul(bar);
        nt = ctx.currentTime + 0.1;
        gate.gain.cancelScheduledValues(ctx.currentTime);
        gate.gain.setValueAtTime(1, ctx.currentTime);
        return true;
      } catch (e) { fail(e); return false; }
    },

    /* Suspend l'horloge audio (onglet caché, jeu en pause). */
    pause: function () { try { if (ctx) ctx.suspend(); } catch (e) { fail(e); } },
    resume: function () { try { if (ctx) ctx.resume(); } catch (e) { fail(e); } },

    setVolume: function (v) {
      vol = Math.max(0, Math.min(1, v));
      if (ctx && playing) master.gain.setTargetAtTime(vol, ctx.currentTime, 0.02);
    },
    /* Ouvre ou ferme le filtre global. 1 = normal, 0.3 = feutré, 2 = très ouvert. */
    setFilter: function (f) { fMul = Math.max(0.3, Math.min(2, f)); },
    setTempo: function (b) { bpm = Math.max(100, Math.min(140, b)); },
    setVocoderLevel: function (v) {
      vLvl = Math.max(0, Math.min(1.8, v));
      if (ctx) voc.gain.setTargetAtTime(0.9 * vLvl, ctx.currentTime, 0.05);
    },
    /* 'system' = voix du téléphone pour l'intro, 'synth' = voix synthétisée. */
    setVoiceMode: function (m) { voiceMode = (m === 'synth') ? 'synth' : 'system'; },

    isPlaying: function () { return playing; },
    getPosition: function () { return { bar: bar, section: sectionName(bar) }; },

    /* Événements : 'section' ({bar, section}), 'lyric' (texte), 'error' (message). */
    on: function (ev, cb) {
      if (listeners[ev] && typeof cb === 'function') listeners[ev].push(cb);
      return MilyMusic;
    },

    /* ================================================================
       LES DEUX AJOUTS DU JEU. Ils ne jouent rien et ne règlent rien :
       ce sont deux LECTURES.

       debloque() — OUVRIR LE ROBINET SANS FAIRE COULER D'EAU.
       Les navigateurs n'exigent pas qu'on appelle play() dans le
       gestionnaire du clic ; ils exigent que le CONTEXTE AUDIO ait été
       créé, ou repris, alors que la page avait reçu un geste. Or dans
       le jeu, l'entrée sur une carte événement passe par une bannière
       et un setTimeout de deux secondes et demie : quand play() part,
       le geste est loin. On crée donc le contexte au premier toucher
       de la page — build() ne fait qu'assembler des nœuds, il ne
       programme aucune note — et play() n'a plus qu'à démarrer une
       horloge déjà débloquée.

       horloge() — LA PHASE MUSICALE, LUE SUR L'HORLOGE AUDIO.
       Sans elle, le seul point de synchronisation offert est
       l'événement 'section', qui part au moment de la PROGRAMMATION
       d'une mesure : entre zéro et cent quatre-vingts millisecondes
       avant qu'on l'entende, et pas la même avance à chaque fois.
       Caler un jeu de lumière là-dessus, c'est le caler sur une gigue
       de deux images. Ici on remonte au temps réel : `nt` est la date
       audio du prochain seizième, `st` son rang dans la mesure, donc
       la position courante en seizièmes vaut
       bar*16 + st - (nt - maintenant)/durée. On la rend en TEMPS
       (noires), parce que c'est le battement que les danseurs suivent.
       Rend null si rien ne joue : l'appelant revient alors à son
       propre métronome.
       ================================================================ */
    debloque: function () {
      try {
        if (!AC) return false;
        if (!ctx) build();
        if (ctx.state === 'suspended') ctx.resume();
        return true;
      } catch (e) { fail(e); return false; }
    },
    horloge: function () {
      if (!playing || !ctx) return null;
      var d = s16();
      var reste = (nt - ctx.currentTime) / d;
      if (reste < 0) reste = 0;             // l'horloge audio a doublé le planificateur
      if (reste > 1) reste = 1;             // ou l'onglet revient d'une suspension
      /* JAMAIS NÉGATIF. `reste` est ce qui manque avant le prochain
         seizième : à la toute première mesure, bar et st valent zéro et
         `reste` peut valoir un, ce qui donne −0,25 noire. Un appelant
         qui en fait un indice de couleur — `teintes[mesure % 6]` —
         récolte alors −1, et en JavaScript −1 % 6 vaut −1, pas 5 : il
         lit hors du tableau et peint « undefined ». Le morceau ne
         commence pas avant son début ; on le dit ici, une fois, plutôt
         que dans chacun de ceux qui nous lisent. */
      var pos = (bar * 16 + st - reste) / 4;
      if (pos < 0) pos = 0;
      return {
        temps: pos,                           // en noires depuis la mesure 0
        mesure: bar,
        section: sectionName(bar),
        bpm: bpm * mul
      };
    },

    version: '1.0.0'
  };

  if ('speechSynthesis' in root) {
    voices = root.speechSynthesis.getVoices();
    root.speechSynthesis.onvoiceschanged = function () {
      voices = root.speechSynthesis.getVoices();
    };
  }

  root.MilyMusic = MilyMusic;
  if (typeof module === 'object' && module.exports) module.exports = MilyMusic;

})(typeof window !== 'undefined' ? window : this);
