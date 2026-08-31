/* ================================================================
   LE SON — tout est synthétisé, aucun fichier
   ================================================================ */
/* Le volume du nœud maître quand le son est allumé. Nommé parce que
   la bascule doit pouvoir y revenir. */
var SON_MAITRE = 0.62;
var son = {
  actif:true, ac:null, maitre:null, bruit:null, dernierBoum:0,

  /* ================================================================
     LE BOUTON « SON COUPÉ » COUPE VRAIMENT

     `actif` n'était lu qu'à un seul endroit — ok(), qui garde
     l'entrée des sons PONCTUELS. Cela suffisait tant que tout le jeu
     était fait de coups : rien ne partait, donc plus rien ne
     s'entendait.

     Ce n'est plus vrai depuis qu'il existe des NAPPES CONTINUES.
     Elles sont déjà branchées sur le maître quand on appuie sur le
     bouton, et personne ne les rappelle : l'ambiance de la jungle
     continuait de pleuvoir sur un jeu qui s'annonçait muet. On baisse
     donc le MAÎTRE, ce qui coupe à la fois ce qui joue et ce qui va
     jouer, et l'on remonte au même endroit en rallumant.

     Un quart de seconde de rampe : coupé net, un son s'entend comme
     une panne, et l'on croit avoir cassé quelque chose.
     ================================================================ */
  bascule:function(){
    this.actif = !this.actif;
    if(this.ac && this.maitre){
      var t = this.ac.currentTime;
      this.maitre.gain.cancelScheduledValues(t);
      this.maitre.gain.setValueAtTime(this.maitre.gain.value, t);
      this.maitre.gain.linearRampToValueAtTime(this.actif ? SON_MAITRE : 0.0001, t + 0.25);
    }
    return this.actif;
  },

  reveille:function(){
    if(this.ac){ if(this.ac.state === "suspended") this.ac.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;
    this.ac = new AC();
    this.maitre = this.ac.createGain();
    this.maitre.gain.value = this.actif ? SON_MAITRE : 0.0001;
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
  /* `retard` a été ajouté APRÈS coup, comme sur bip() : aucun des
     appels existants ne passe cinq arguments, donc (retard || 0) est
     rétrocompatible au caractère près. */
  souffle:function(f0, f1, duree, vol, retard){
    if(!this.ok()) return;
    var t = this.ac.currentTime + (retard || 0);
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

  /* ================================================================
     MONTÉE — le souffle qui ENFLE au lieu de s'éteindre

     souffle() balaie sa bande de f0 vers f1, mais son enveloppe
     DESCEND toujours : monter la fréquence pendant que le volume
     s'efface ne fait pas une montée, ça fait une fusée qui s'éloigne.
     Une vraie montée enfle jusqu'à la dernière seconde puis lâche
     d'un coup — c'est ce qui fait attendre quelque chose. L'enveloppe
     était déjà écrite à la main dans la vengeance ; elle n'était
     simplement pas factorisée.
     ================================================================ */
  montee:function(f0, f1, duree, vol, retard){
    if(!this.ok()) return;
    var t = this.ac.currentTime + (retard || 0);
    var s = this.ac.createBufferSource();
    s.buffer = this.bruit; s.loop = true;
    var f = this.ac.createBiquadFilter();
    f.type = "bandpass"; f.Q.value = 1.4;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + duree);
    var g = this.ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + duree * 0.88);
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
  /* LE LANCE-FLAMMES DU PYR-120. Un canon claque ; un lance-flammes
     SOUFFLE — c'est du bruit blanc filtré, pas une note. Deux
     souffles qui se recouvrent : un grave long qui porte la masse
     d'air, un plus aigu et plus court qui donne le crépitement du
     naphte qui s'enflamme. Aucune fréquence tenue : la moindre
     hauteur reconnaissable transformerait le souffle en sirène, et
     il se répète toutes les quatre dixièmes de seconde. */
  lanceFlamme:function(){
    this.souffle(700, 190, 0.46, 0.15);
    this.souffle(2600, 900, 0.20, 0.10);
    this.bip("sawtooth", 68, 52, 0.20, 0.16);
  },
  /* Le PYR-120 qui part : il transporte deux fûts de naphte, donc
     c'est plus grave et plus long que le char, avec la déchirure de
     tôle par-dessus. */
  pyrDetruit:function(){
    this.bip("sawtooth", 150, 26, 0.44, 0.62);
    this.bip("sine", 62, 21, 0.50, 0.80);
    this.souffle(900, 120, 0.52, 0.55);
    this.souffle(3000, 700, 0.22, 0.24);
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
  /* ================================================================
     LE CRISTAL DE L'ÎLE — le passage obligé de toute note des nuits

     Trois sinus, et le deuxième est tout le sujet : 2,76 fois la
     fondamentale, un rapport qui n'est PAS un harmonique. Un rapport
     entier donne une flûte ; l'inharmonicité fait entendre du métal
     coulé. Et le partiel meurt le premier — c'est cette extinction en
     escalier qui fait « bronze » plutôt que « sinus ».

     Les six millisecondes d'attaque de bip() sont exactement
     l'attaque d'une frappe sur du métal. La primitive était faite
     pour ça sans le savoir.
     ================================================================ */
  dernierDegre:-1, dernierCristal:0,
  cristalNuits:function(i, vol, retard, duree){
    i = i < 0 ? 0 : (i > 19 ? 19 : i | 0);
    var f = NUITS_GAMME[i], d = duree || 0.62, r = retard || 0;
    this.bip("sine", f, f, d, vol, r);
    this.bip("sine", f * 2.76, f * 2.76, d * 0.34, vol * 0.34, r + 0.004);
    this.bip("sine", f * 5.42, f * 5.42, d * 0.09, vol * 0.20, r);
  },
  /* UNE CLOCHETTE. Le volume DÉCROÎT avec le registre : l'oreille est
     deux fois plus sensible à 3,5 kHz qu'à 1 kHz, et une clochette
     aiguë à volume égal s'entend comme une aiguille. 0,016 à do6,
     0,009 à la7. Et jamais deux fois le même degré de suite. */
  clocheNuits:function(){
    var i = 10 + ((Math.random() * 10) | 0);
    if(i % 5 === this.dernierDegre) i = 10 + ((i - 9) % 10);
    this.dernierDegre = i % 5;
    this.cristalNuits(i, 0.016 * (1 - (i - 10) * 0.045), 0, 1.90);
  },
  /* UNE GOUTTE. Sa hauteur MONTE, et c'est contre-intuitif : ce qu'on
     entend d'une goutte est la résonance d'une bulle d'air qui se
     referme, et cette résonance monte pendant ses cinquante
     millisecondes. Une goutte descendante s'entend immédiatement
     comme une goutte à l'envers.
     0,011 — le son le plus faible de la carte, à dessein : c'est
     celui qui revient le plus souvent. */
  goutteNuits:function(prox){
    var f = 1500 + Math.random() * 1400;
    this.bip("sine", f, f * 1.9, 0.055, 0.011 * (prox === undefined ? 1 : prox));
  },
  /* UNE PETITE NOTE MAGIQUE. Deux cristaux et une pellicule de savon.
     L'écart entre les deux notes est de DEUX ou TROIS degrés, jamais
     un : l'écart d'un degré est le pas de gamme, et c'est lui qui
     fabrique une ligne mélodique qu'on retient. L'écart de TEMPS est
     tiré lui aussi — deux notes toujours espacées pareil forment une
     cellule rythmique, et une cellule rythmique est déjà la moitié
     d'une mélodie. */
  noteMagique:function(){
    var i = 10 + ((Math.random() * 5) | 0);
    var e = (Math.random() < 0.5) ? 2 : 3;
    var j = i + (Math.random() < 0.55 ? e : -e);
    if(j < 8) j = i + e;
    if(j > 18) j = i - e;
    this.cristalNuits(i, 0.017, 0, 0.80);
    this.cristalNuits(j, 0.013, 0.17 + Math.random() * 0.10, 0.95);
    this.souffle(6200, 3400, 0.16, 0.008, 0.02);
  },
  /* ================================================================
     LA ROUE DES RELIQUES — LES CLIQUETIS, PUIS LE VERDICT

     DEUX SONS, ET LE SECOND DÉPEND DU PALIER. Le premier est le
     crépitement de la roue : une trentaine de clics dont l'écart
     s'allonge exactement comme la rotation ralentit — c'est LUI qui
     fait la tension, bien plus que l'image, parce qu'on entend le
     freinage avant de le voir.

     TOUT EST PROGRAMMÉ EN UN SEUL APPEL, par les retards, comme
     l'annonce de la pluie : la séquence est calée à l'échantillon
     près dans le contexte audio et elle survit à une image sautée.
     Un setTimeout par clic aurait dérivé au premier ralentissement.

     LES RETARDS SUIVENT LA MÊME COURBE QUE LA ROUE — une puissance
     cinquième —, et ce n'est pas une coïncidence : c'est la même
     formule, écrite deux fois parce que l'une vit dans le son et
     l'autre dans l'image. Si l'une change un jour, l'autre doit
     changer avec, et ce commentaire est là pour le rappeler. Voir
     ROUE_LANCE et le freinage de majRoueRelique.
     ================================================================ */
  reliqueRoue:function(){
    if(!this.ok()) return;
    var N = 34, lance = 3.1, i;
    for(i = 0; i < N; i++){
      /* on inverse la courbe de la roue : l'angle parcouru est
         régulier en i, donc le TEMPS qu'il faut pour l'atteindre est
         la réciproque du freinage */
      var u = i / N;
      var t = lance * (1 - Math.pow(1 - u, 1 / 5));
      this.bip("square", 1750 - u * 420, 900 - u * 260, 0.022, 0.030, t);
    }
  },
  /* LE VERDICT. Trois notes qui montent au palier de base, cinq et un
     souffle au sommet : le joueur doit savoir CE QU'IL A GAGNÉ avant
     d'avoir lu la phrase. Le palier max a droit à son éclat — trois
     pour cent, ça s'entend. */
  reliqueGagnee:function(palier){
    if(!this.ok()) return;
    var p = Math.max(0, Math.min(4, palier | 0));
    var base = [523, 659, 784, 988, 1175];          // do mi sol si ré
    var n = 3 + Math.min(2, p), i;
    for(i = 0; i < n; i++)
      this.bip("triangle", base[i], base[i] * 1.5, 0.19 + p * 0.02,
               0.055 + p * 0.012, i * 0.085);
    if(p >= 3) this.souffle(3200, 8600, 0.55, 0.014, n * 0.085);
    if(p >= 4){
      this.bip("triangle", 1568, 2093, 0.7, 0.075, n * 0.085 + 0.06);
      this.souffle(900, 240, 0.9, 0.020, n * 0.085 + 0.06);
    }
  },
  /* ================================================================
     L'ANNONCE DE LA PLUIE D'ÉTOILES — les trois temps de la demande

     « Une petite montée sonore ; quelques sons cristallins ; puis les
     étoiles qui tombent. »

     Tout est programmé EN UN SEUL APPEL, par les retards : pas de
     setTimeout, pas d'état à tenir, la séquence est calée à
     l'échantillon près dans le contexte audio et elle survit à une
     image sautée.

     `deja` est le temps déjà écoulé dans l'annonce, et c'est une
     CORRECTION, pas un ornement : un joueur qui rejoint l'expédition
     à la quatrième seconde entendait les sept secondes en entier,
     avec quatre secondes de retard — ses cristaux tombaient APRÈS que
     les étoiles avaient commencé à tomber. Avec `deja`, tout le monde
     entend la fin au même instant d'horloge murale, et le retardataire
     n'entend que ce qui reste.

     ET AUCUN Math.random ICI. Ce son part au même instant chez tout
     le monde — phasePluie ne lit que l'heure murale — donc il doit
     partir avec les MÊMES notes. Tout le hasard passe par la graine
     du créneau, exactement comme les étoiles elles-mêmes.

     LE TROISIÈME TEMPS N'EST PAS UN BRUITAGE : ce sont les vingt-six
     atterrissages. Entre le dernier cristal et la première étoile il
     y a deux secondes de silence, et c'est ce silence-là qui fait
     lever les yeux — la carte a parlé, puis s'est tue.
     ================================================================ */
  pluieAnnonce:function(n, deja){
    if(!this.ok()) return;
    var d = deja || 0;
    var al = (typeof grainePluie === "function")
           ? prng(grainePluie(n | 0, 907)) : function(){ return 0.5; };
    /* 1. LA MONTÉE, plus une pédale grave : un balayage seul se lit
          comme un effet spécial ; une note tenue en dessous se lit
          comme « quelque chose se prépare ». */
    if(d < 4.6){
      this.montee(240, 3200, 4.6 - d, 0.030, 0);
      this.bip("sine", 174.61, 174.61, 4.6 - d, 0.020, 0);
    }
    /* 2. LES TROIS CRISTAUX, du même bronze que les clochettes de
          l'île. La forme est constante — ça monte — et les hauteurs
          changent à chaque pluie. */
    var i0 = 10 + ((al() * 3) | 0);
    var i1 = i0 + 2 + ((al() * 2) | 0);
    var i2 = i1 + 2 + ((al() * 2) | 0);
    var r0 = 3.40 - d, r1 = 4.10 + al() * 0.16 - d, r2 = 4.85 + al() * 0.22 - d;
    if(r0 >= 0) this.cristalNuits(i0, 0.036, r0, 1.50);
    if(r1 >= 0) this.cristalNuits(i1, 0.032, r1, 1.40);
    if(r2 >= 0) this.cristalNuits(i2, 0.038, r2, 1.80);
  },
  /* UNE ÉTOILE SE POSE. Deux défauts corrigés d'un coup.
     LA HAUTEUR EST PARTAGÉE, LE VOLUME EST LOCAL. Vingt-six pings sur
     les deux mêmes notes, on les connaît au troisième : ce sont
     maintenant vingt-six degrés tirés de la graine du créneau, donc
     les mêmes chez tous les joueurs — deux joueurs peuvent se dire
     « tu as entendu ? », ce qui n'aurait aucun sens avec un tirage
     local. Et l'atténuation par la distance fait qu'on entend les
     quatre ou huit étoiles qui tombent AUTOUR DE SOI, au lieu des
     vingt-six réparties sur toute l'île. C'est déjà la règle du
     ramassage, qui est local.
     Le plancher de neuf centièmes est le même garde-fou que celui du
     souffle : la double boucle des naissances peut faire apparaître
     dix vœux dans la même image après un onglet réveillé. */
  voeuPose:function(s, k, att){
    if(!this.ok() || !(att > 0)) return;
    var t = this.ac.currentTime;
    if(t - this.dernierCristal < 0.09) return;
    this.dernierCristal = t;
    var al = (typeof grainePluie === "function")
           ? prng(grainePluie(s | 0, 500 + (k | 0))) : function(){ return 0.5; };
    var i = 12 + ((al() * 6) | 0);
    this.cristalNuits(i, (0.020 - (i - 12) * 0.0015) * att, 0, 0.40);
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
