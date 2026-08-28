/* ================================================================
   LE SON — tout est synthétisé, aucun fichier
   ================================================================ */
var son = {
  actif:true, ac:null, maitre:null, bruit:null, dernierBoum:0,

  reveille:function(){
    if(this.ac){ if(this.ac.state === "suspended") this.ac.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;
    this.ac = new AC();
    this.maitre = this.ac.createGain();
    this.maitre.gain.value = 0.62;
    this.maitre.connect(this.ac.destination);
    /* buffer de bruit blanc, réutilisé */
    var n = this.ac.sampleRate * 2;
    var b = this.ac.createBuffer(1, n, this.ac.sampleRate);
    var d = b.getChannelData(0);
    for(var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.bruit = b;
  },
  ok:function(){ return this.actif && this.ac && this.ac.state === "running"; },

  /* --- la déflagration : un vrai souffle, pas un bip --- */
  boum:function(force){
    if(!this.ok()) return;
    var t = this.ac.currentTime;
    if(t - this.dernierBoum < 0.028) return;      // on évite l'empilement
    this.dernierBoum = t;
    force = force || 1;
    var duree = 0.55 + force * 0.85;

    /* souffle : bruit blanc dans un passe-bas qui s'effondre */
    var s = this.ac.createBufferSource();
    s.buffer = this.bruit;
    s.loop = true;
    var f = this.ac.createBiquadFilter();
    f.type = "lowpass";
    f.Q.value = 0.9;
    f.frequency.setValueAtTime(2400 * (0.7 + force * 0.4), t);
    f.frequency.exponentialRampToValueAtTime(110, t + duree);
    var g = this.ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.55 * force, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    s.connect(f); f.connect(g); g.connect(this.maitre);
    s.start(t); s.stop(t + duree + 0.05);

    /* coup de sub */
    var o = this.ac.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(120 * (0.8 + force * 0.3), t);
    o.frequency.exponentialRampToValueAtTime(24, t + duree * 0.5);
    var g2 = this.ac.createGain();
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.linearRampToValueAtTime(0.55 * force, t + 0.012);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + duree * 0.7);
    o.connect(g2); g2.connect(this.maitre);
    o.start(t); o.stop(t + duree);
  },

  bip:function(type, f0, f1, duree, vol, retard){
    if(!this.ok()) return;
    var t = this.ac.currentTime + (retard || 0);
    var o = this.ac.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if(f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + duree);
    var g = this.ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    o.connect(g); g.connect(this.maitre);
    o.start(t); o.stop(t + duree + 0.02);
  },
  souffle:function(f0, f1, duree, vol){
    if(!this.ok()) return;
    var t = this.ac.currentTime;
    var s = this.ac.createBufferSource();
    s.buffer = this.bruit; s.loop = true;
    var f = this.ac.createBiquadFilter();
    f.type = "bandpass"; f.Q.value = 1.4;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + duree);
    var g = this.ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    s.connect(f); f.connect(g); g.connect(this.maitre);
    s.start(t); s.stop(t + duree + 0.05);
  },

  tirFurie:function(){ this.bip("square", 880, 420, 0.075, 0.055); },
  coupCommando:function(){ this.bip("sawtooth", 150, 62, 0.13, 0.10); },
  /* Le lancer de l'Ogre : un souffle grave qui monte, l'effort d'un
     bras énorme. L'impact, lui, descend d'un coup — c'est de la masse
     qui s'arrête, pas une déflagration. */
  hache:function(){ this.bip("triangle", 120, 260, 0.11, 0.07); },
  impactHache:function(){
    this.bip("sawtooth", 190, 44, 0.17, 0.13);
    this.bip("square", 720, 180, 0.05, 0.05);
  },
  /* LE CANON DU TANK. Il ne tire qu'une fois toutes les quatre
     secondes : il a droit à un vrai son, contrairement au Crible qui
     doit pouvoir crépiter cent fois sans saturer.
     Trois couches, et c'est l'ordre des trois qui fait une bouche à
     feu et non un bip : le CLAQUEMENT sec de la mise à feu, la
     DÉTONATION grave qui s'effondre en dessous, et le souffle de gaz
     qui s'échappe derrière. Chacune séparément ne serait rien. */
  canonTank:function(){
    this.bip("square", 1500, 300, 0.045, 0.055);
    this.bip("sawtooth", 210, 38, 0.30, 0.15);
    this.bip("sine", 96, 34, 0.34, 0.12);
    this.souffle(1200, 240, 0.26, 0.09);
  },
  /* L'INTERCEPTION. Deux temps très courts et très hauts : le départ
     de la charge, puis la roquette qui casse. Aigu, sec, et bref —
     c'est une bonne nouvelle qui doit s'entendre au milieu du
     vacarme sans y ajouter du grave, dont l'oreille du joueur est
     déjà saturée par les canons et les Pilons. */
  interception:function(){
    this.bip("square", 2400, 1100, 0.035, 0.040);
    this.bip("sawtooth", 1300, 320, 0.09, 0.055, 0.04);
    this.souffle(3200, 900, 0.14, 0.05);
  },
  /* L'obus qui arrive : de l'acier qui s'arrête. Court, dur, et une
     octave au-dessus du départ, sinon on confond les deux. */
  impactObus:function(){
    this.bip("square", 900, 210, 0.05, 0.05);
    this.bip("sawtooth", 260, 60, 0.15, 0.10);
  },
  /* ================================================================
     LA PLUIE D'ÉTOILES — trois sons, et aucun ne ressemble au reste
     du jeu

     Toute la bande-son de Mily Boum est faite d'explosions, de tôle
     et de moteurs : des bruits qui DESCENDENT — une attaque forte
     suivie d'une chute. Un vœu doit faire l'inverse, sinon l'oreille
     le range parmi les dégâts. Les trois sons ci-dessous MONTENT, ils
     sont tous en sinus pur (aucune harmonique dure), et ils tombent
     sur des intervalles justes — quinte et octave. C'est ce qui les
     rend audibles au milieu du vacarme sans y ajouter de violence.
     ================================================================ */
  /* L'annonce : le ciel s'ouvre. Trois notes très douces qui montent,
     largement espacées — on doit lever les yeux, pas sursauter. */
  pluieAnnonce:function(){
    this.bip("sine", 523, 523, 0.9, 0.055);
    this.bip("sine", 784, 784, 0.9, 0.048, 0.35);
    this.bip("sine", 1046, 1046, 1.4, 0.052, 0.75);
    this.souffle(2600, 1400, 1.6, 0.022);
  },
  /* Une étoile se pose : une clochette, courte et haute. Il y en a
     vingt-six par pluie, donc elle doit être MINCE — un son plein
     répété vingt-six fois devient un carillon insupportable. */
  voeuPose:function(){
    this.bip("sine", 1760, 1760, 0.34, 0.030);
    this.bip("sine", 2637, 2637, 0.22, 0.016, 0.02);
  },
  /* Un vœu cueilli : la même clochette, mais qui MONTE d'une octave,
     et deux notes au lieu d'une. C'est le seul son du jeu qui monte
     franchement — il ne peut se confondre avec rien. */
  voeuPris:function(soigne){
    this.bip("sine", 880, 1320, 0.30, 0.075);
    this.bip("sine", 1320, 1976, 0.34, 0.055, 0.07);
    if(soigne) this.bip("sine", 1760, 2637, 0.40, 0.040, 0.14);
    this.souffle(3400, 1800, 0.30, 0.030);
  },
  /* Un char qui meurt : les munitions partent. Une détonation plus
     longue et plus basse que son propre canon — c'est ce qui la
     distingue d'un tir, et c'est ce qui la rend triste. */
  tankDetruit:function(){
    this.bip("sawtooth", 170, 28, 0.55, 0.16);
    this.bip("sine", 70, 26, 0.70, 0.13);
    this.souffle(700, 120, 0.60, 0.11);
  },
  tirFrelon:function(){ this.souffle(900, 220, 0.35, 0.12); },
  tirPilon:function(){ this.bip("sine", 190, 70, 0.22, 0.13); },
  /* Le Mirador : un claquement sec et court, pas une déflagration.
     Il y en a une centaine sur l'île — le son doit pouvoir se répéter
     sans devenir un vacarme. */
  tirMirador:function(){ this.bip("square", 1400, 260, 0.045, 0.045); },
  tirBobine:function(){ this.bip("square", 1400, 620, 0.10, 0.05); },
  bobine:function(){ this.souffle(2600, 700, 0.28, 0.10); this.bip("sawtooth", 300, 90, 0.2, 0.06); },
  rampe:function(){ this.bip("sawtooth", 210, 90, 0.16, 0.05); },
  tirCrible:function(){ this.bip("square", 620, 240, 0.045, 0.020); },
  jetFlamme:function(){ this.souffle(900, 260, 0.20, 0.045); },
  impactSol:function(){ this.bip("triangle", 260, 120, 0.05, 0.025); },
  grondement:function(){ this.souffle(220, 40, 2.4, 0.16); this.bip("sine", 90, 34, 2.0, 0.12); },
  tweety:function(){ this.bip("sine", 1760, 980, 0.22, 0.07); this.bip("sine", 1320, 620, 0.30, 0.05); },
  recolte:function(){ this.bip("sine", 880, 1560, 0.09, 0.05); },
  energie:function(){ this.bip("triangle", 720, 1180, 0.10, 0.055); },
  gong:function(){ this.bip("sine", 520, 300, 0.30, 0.075); this.bip("sine", 780, 520, 0.22, 0.04); },
  balise:function(){ this.bip("sine", 300, 1500, 0.5, 0.07); },
  brouillard:function(){ this.souffle(1800, 400, 0.65, 0.09); },
  cryo:function(){ this.souffle(4200, 900, 0.5, 0.09); this.bip("sine", 1600, 420, 0.4, 0.05); },
  poulets:function(){
    for(var i = 0; i < 5; i++) this.bip("square", 900 + i * 90, 520 + i * 70, 0.07, 0.045, i * 0.07);
  },
  poulet:function(){ this.bip("square", 1200, 380, 0.12, 0.05); },
  viper:function(){ this.souffle(1400, 260, 0.55, 0.13); this.bip("sawtooth", 700, 180, 0.35, 0.06); },
  salve:function(){ for(var i = 0; i < 6; i++) this.souffle(1100, 300, 0.3, 0.05); },
  nova:function(){ this.souffle(600, 140, 1.1, 0.14); this.bip("sine", 90, 40, 1.2, 0.10); },
  soin:function(){ this.bip("sine", 520, 880, 0.28, 0.07); this.bip("sine", 660, 1040, 0.28, 0.05, 0.1); },

  debarque:function(){ this.bip("sine", 180, 300, 0.28, 0.10); this.souffle(500, 180, 0.5, 0.07); },
  renfort:function(){ this.bip("triangle", 440, 880, 0.35, 0.09); this.bip("triangle", 660, 1320, 0.3, 0.07, 0.14); },
  grogne:function(){ this.bip("sawtooth", 110, 62, 0.3, 0.08); },
  telegraphe:function(){ this.bip("square", 320, 320, 0.12, 0.07); this.bip("square", 320, 320, 0.12, 0.07, 0.2); },
  confettis:function(){ for(var i = 0; i < 6; i++) this.bip("triangle", 520 + i * 130, 900 + i * 160, 0.14, 0.05, i * 0.06); },

  /* LA VENGEANCE DE MILY, en trois sons.
     La charge dure toute la durée du message et ne fait que monter :
     c'est elle qui doit rendre les trois secondes insupportables. Le
     tir est un souffle qui descend, l'impact une masse qui s'arrête. */
  vengeance:function(){
    if(!this.ok()) return;
    var t = this.ac.currentTime, d = EQ.VENG_MESSAGE;
    var o = this.ac.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(58, t);
    o.frequency.exponentialRampToValueAtTime(430, t + d);
    var f = this.ac.createBiquadFilter();
    f.type = "lowpass"; f.Q.value = 8;
    f.frequency.setValueAtTime(180, t);
    f.frequency.exponentialRampToValueAtTime(2600, t + d);
    var g = this.ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.13, t + d * 0.94);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.06);
    o.connect(f); f.connect(g); g.connect(this.maitre);
    o.start(t); o.stop(t + d + 0.1);
    this.bip("sine", 40, 30, d, 0.09);
  },
  vengeanceTir:function(){
    this.souffle(5200, 320, 0.9, 0.20);
    this.bip("sawtooth", 1900, 130, 0.55, 0.13);
  },
  vengeanceImpact:function(){
    this.bip("sawtooth", 150, 32, 0.85, 0.20);
    this.bip("square", 900, 110, 0.14, 0.09);
    this.souffle(1400, 90, 1.4, 0.13);
  },

  /* ---- L'ORAGE DE LA JUNGLE ----
     Le tonnerre est un bruit filtré qui DESCEND : un grondement qui
     s'éloigne. Deux couches — la claque sèche du coup, puis le
     roulement qui traîne — parce qu'un tonnerre d'une seule couche
     sonne comme une porte qui claque. */
  tonnerre:function(){
    if(!this.ok()) return;
    var t = this.ac.currentTime;
    var s = this.ac.createBufferSource();
    s.buffer = this.bruit; s.loop = true;
    var f = this.ac.createBiquadFilter();
    f.type = "lowpass"; f.Q.value = 0.7;
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(60, t + 2.4);
    var g = this.ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.20, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.055, t + 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    s.connect(f); f.connect(g); g.connect(this.maitre);
    s.start(t); s.stop(t + 2.7);
    this.bip("sine", 46, 24, 2.0, 0.10);
  },
  /* Un grondement LOINTAIN : pas de claque, que le roulement. C'est
     lui qui tourne en fond d'ambiance, donc il reste très en dessous. */
  grondeLoin:function(){ this.souffle(160, 38, 3.2, 0.055); },
  /* La foudre qui touche vraiment le sol : un craquement sec, puis le
     tonnerre par-dessus. */
  foudre:function(){
    this.bip("sawtooth", 2400, 90, 0.20, 0.13);
    this.bip("square", 900, 60, 0.10, 0.07);
    this.tonnerre();
  },
  /* Le geyser : une bouffée qui monte et qui souffle. */
  geyser:function(){
    this.souffle(220, 1300, 0.30, 0.11);
    this.bip("sawtooth", 70, 190, 0.34, 0.08);
  },

  /* petit requiem pour Gégé */
  gege:function(){
    this.bip("triangle", 660, 620, 0.22, 0.10);
    this.bip("triangle", 520, 480, 0.24, 0.10, 0.22);
    this.bip("triangle", 392, 300, 0.55, 0.11, 0.46);
  },

  /* sifflement montant de la tête qui décolle : 420 → 2600 Hz */
  sifflet:function(){
    if(!this.ok()) return;
    var t = this.ac.currentTime;
    var o = this.ac.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(2600, t + 1.5);
    var v = this.ac.createOscillator();       // léger vibrato
    v.type = "sine"; v.frequency.value = 7;
    var vg = this.ac.createGain(); vg.gain.value = 40;
    v.connect(vg); vg.connect(o.frequency);
    var g = this.ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.05);
    g.gain.setValueAtTime(0.16, t + 1.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
    o.connect(g); g.connect(this.maitre);
    o.start(t); o.stop(t + 1.75);
    v.start(t); v.stop(t + 1.75);
  }
};
