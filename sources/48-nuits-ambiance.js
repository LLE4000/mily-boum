/* ================================================================
   L'AMBIANCE SONORE DES « MILY ET UNE NUITS »

   « Pas de gros tonnerre comme dans la jungle. Je voudrais plutôt :
   vent léger ; petites clochettes très discrètes ; sons cristallins ;
   bruit des fontaines ; petites notes magiques ponctuelles ; bruit
   léger lorsqu'une pluie d'étoiles arrive. Attention : je ne veux pas
   une musique ou des sons qui deviennent insupportables après dix
   minutes. Il faut rester très subtil. »

   ────────────────────────────────────────────────────────────────
   LE CRITÈRE QUI PRIME : DIX MINUTES

   Il passe avant la beauté, et il a décidé de tout. Ce qui use une
   oreille n'est pas le volume — c'est la RÉPÉTITION, et elle a trois
   visages qu'il faut traiter séparément :

     LA PÉRIODE. Un son qui revient à intervalle fixe devient un
     métronome. On tire donc chaque intervalle, et dans un rapport
     large : neuf à vingt-six secondes pour une clochette, et une fois
     sur cinq on multiplie encore par deux virgule huit. Ce trou de
     vingt-cinq à soixante-dix secondes est ce qui empêche le hasard
     de se transformer en DENSITÉ constante — et une densité
     constante est déjà un métronome, même sans période.

     LA HAUTEUR. C'est celui qu'on oublie. Les vingt-six vœux d'une
     pluie sonnaient tous sur les deux mêmes notes : au troisième, on
     les connaît. Toute note de cette île passe donc par une gamme, et
     deux notes qui se suivent sautent de deux ou trois degrés, jamais
     d'un seul — l'écart d'un degré est le pas de gamme, et c'est lui
     qui fabrique une mélodie qu'on retient.

     LE RÉGIME. Et c'est la vraie réponse. Il n'y a pas UNE ambiance
     mais quatre, et le joueur passe de l'une à l'autre toutes les
     deux minutes : île dézoomée, presque rien ; caméra posée près
     d'un bassin, le paysage le plus dense ; assaut, le lit à quarante
     pour cent et zéro clochette ; pluie d'étoiles, tout le reste se
     tait. Ce n'est pas que chaque son soit discret, c'est que ce
     qu'on entend change tout le temps.

   ────────────────────────────────────────────────────────────────
   LE PLAFOND, ANNONCÉ D'AVANCE

   Aucune source continue au-dessus de 0,018 ; la somme des continus
   sous 0,032. Repères du même fichier : la pluie de la jungle est à
   0,035, son vent à 0,055, le plus petit tir du jeu — le Mirador — à
   0,045, le canon du char à 0,15. LE DÉCOR ENTIER EST DEUX FOIS PLUS
   FAIBLE QUE LE PLUS PETIT TIR. C'est la seule façon de tenir dix
   minutes, et c'est aussi ce qui donne au vœu cueilli, resté à 0,075,
   ses quatre fois la clochette — obtenu en BAISSANT le décor et non
   en montant la récompense. C'est toujours dans ce sens qu'il faut le
   faire : monter la récompense, c'est se condamner à monter tout le
   reste ensuite.

   ────────────────────────────────────────────────────────────────
   TROIS HORLOGES, ET LE CHOIX DE L'HORLOGE EST TOUT LE DESSIN

     horlogePluie()  la seule PARTAGÉE — l'heure murale. Elle porte
                     l'annonce et les vingt-six poses, et rien
                     d'autre. Règle absolue : aucun Math.random dans
                     un son qu'elle déclenche, tout passe par
                     grainePluie, comme les étoiles elles-mêmes.
     des comptes à rebours en dt  pour tout ce qui dépend d'où est TA
                     caméra : clochettes, gouttes, notes. Ici le
                     hasard local est non seulement permis, il est
                     souhaitable.
     tempsGlobal     inutilisé. Il repart de zéro à chaque onglet.
   ================================================================ */

/* LA GAMME. Cinq degrés — do ré mi sol la — sur quatre octaves. L'île
   y était déjà : l'arpège du tourbillon (523 / 659 / 784) et les trois
   notes de l'annonce (523 / 784 / 1046) en sortent toutes. */
var NUITS_GAMME = [
  261.63,  293.66,  329.63,  392.00,  440.00,
  523.25,  587.33,  659.25,  783.99,  880.00,
  1046.50, 1174.66, 1318.51, 1567.98, 1760.00,
  2093.00, 2349.32, 2637.02, 3135.96, 3520.00
];

/* Les registres sont RÉSERVÉS, et c'est ce qui permet de rester à
   0,016 sans jamais monter le volume : le vent tient 300 Hz, l'eau
   1 800–5 200, les gouttes 1 500–2 900, les clochettes do6–la7. Le
   plafond de l'eau est à 5 200 et non 7 200 comme la pluie de la
   jungle, exprès : elle reste SOUS le partiel de bronze des
   clochettes, qui se lisent donc sans qu'on ait à les monter. */
var NUITS_EAU_HAUT = 5200;

/* ================================================================
   LE LIT — deux nappes, un seul groupe

   Montées UNE fois et laissées tourner, comme l'ambiance de la
   jungle, et pour la raison qu'elle écrit : « relancer une bouffée
   toutes les cent millisecondes coûterait cent fois plus cher et
   s'entendrait pomper ».

   LES DEUX BOUCLES DE BRUIT ONT DES LONGUEURS SANS RAPPORT SIMPLE —
   2,78 s et 1,48 s, obtenues en relisant le même tampon de deux
   secondes à deux vitesses. La périodicité du tampon ne se recale
   donc jamais. Et les deux oscillateurs lents sont à 0,043 70 et
   0,016 21 Hz, premiers entre eux : le motif complet ne se répète pas
   avant vingt-sept heures. Il n'y a pas de boucle à repérer — ce
   n'est pas une question de longueur de boucle.
   ================================================================ */
var ambianceNuits = {
  noeuds:null, prox:0, proxEcrite:-1, tic:0,
  tClochette:6, tGoutte:2, tNote:24,

  demarre:function(){
    if(this.noeuds || typeof son === "undefined" || !son.ok()) return;
    var ac = son.ac, t = ac.currentTime;
    var n = {};

    /* LE GROUPE. Tout passe par lui : c'est sur ce seul gain que
       jouent le zoom et le fracas des combats. */
    n.groupe = ac.createGain();
    n.groupe.gain.value = 0.0001;
    n.groupe.connect(son.maitre);

    /* LE VENT — l'air dans les arcades, et non le vent de la jungle,
       qui siffle dans des feuilles à 420 Hz. Ici c'est plus bas et
       plus large : de la pierre, pas du feuillage. */
    n.vent = ac.createBufferSource();
    n.vent.buffer = son.bruit; n.vent.loop = true;
    n.vent.playbackRate.value = 0.72;
    var fv = ac.createBiquadFilter();
    fv.type = "bandpass"; fv.frequency.value = 300; fv.Q.value = 1.10;
    n.gVent = ac.createGain();
    n.gVent.gain.setValueAtTime(0.0001, t);
    n.gVent.gain.linearRampToValueAtTime(0.013, t + 6);
    n.vent.connect(fv); fv.connect(n.gVent); n.gVent.connect(n.groupe);

    /* les deux souffles lents. A balaie la bande du vent sur
       vingt-trois secondes, B respire son volume sur soixante-deux. */
    n.lfoA = ac.createOscillator();
    n.lfoA.type = "sine"; n.lfoA.frequency.value = 0.04370;
    var gA = ac.createGain(); gA.gain.value = 130;
    n.lfoA.connect(gA); gA.connect(fv.frequency);

    n.lfoB = ac.createOscillator();
    n.lfoB.type = "sine"; n.lfoB.frequency.value = 0.01621;
    var gB = ac.createGain(); gB.gain.value = 0.005;
    n.lfoB.connect(gB); gB.connect(n.gVent.gain);

    /* L'EAU. Elle ne coule que si l'on est près d'un bassin : c'est
       `prox` qui la tient, et sur le sable elle est nulle. */
    n.eau = ac.createBufferSource();
    n.eau.buffer = son.bruit; n.eau.loop = true;
    n.eau.playbackRate.value = 1.35;
    var fh = ac.createBiquadFilter();
    fh.type = "highpass"; fh.frequency.value = 1800; fh.Q.value = 0.4;
    var fb = ac.createBiquadFilter();
    fb.type = "lowpass"; fb.frequency.value = NUITS_EAU_HAUT;
    n.gEau = ac.createGain();
    n.gEau.gain.value = 0.0001;
    n.eau.connect(fh); fh.connect(fb); fb.connect(n.gEau); n.gEau.connect(n.groupe);
    /* LE MÊME souffle lent B pilote la coupure de l'eau : zéro
       oscillateur de plus, et les deux nappes respirent ensemble
       sans jamais se caler l'une sur l'autre, puisque l'une agit sur
       un volume et l'autre sur une fréquence. */
    var gB2 = ac.createGain(); gB2.gain.value = 260;
    n.lfoB.connect(gB2); gB2.connect(fh.frequency);

    n.vent.start(t); n.eau.start(t); n.lfoA.start(t); n.lfoB.start(t);
    this.noeuds = n;
    this.proxEcrite = -1;
  },

  arrete:function(){
    var n = this.noeuds;
    this.noeuds = null;
    if(!n || typeof son === "undefined" || !son.ok()) return;
    var t = son.ac.currentTime;
    /* on descend en une seconde : une ambiance coupée net s'entend
       comme une panne de courant */
    n.groupe.gain.cancelScheduledValues(t);
    n.groupe.gain.setValueAtTime(n.groupe.gain.value, t);
    n.groupe.gain.linearRampToValueAtTime(0.0001, t + 1.0);
    n.vent.stop(t + 1.2); n.eau.stop(t + 1.2);
    n.lfoA.stop(t + 1.2); n.lfoB.stop(t + 1.2);
  },

  /* ================================================================
     LE BATTEMENT — trois soustractions et deux comparaisons par
     image. Cinquante-six images sur soixante s'arrêtent là.
     ================================================================ */
  suit:function(dt){
    var n = this.noeuds;
    if(!n) return;
    var ac = son.ac, t = ac.currentTime;

    /* LE ZOOM ÉTEINT TOUT. Vu de haut, on regarde une CARTE, pas un
       jardin : il n'y a aucune raison d'entendre une fontaine dont on
       ne distingue même pas le bassin. Les seuils sont ceux de l'air
       magique — c'est le même moment où les bulles et les papillons
       cessent d'être dessinés. Et une grande partie du temps de jeu
       se passe dézoomé : pendant tout ce temps, silence complet. */
    var z = (typeof cam !== "undefined" && cam) ? cam.z : 1;
    var fZoom = z < 0.24 ? 0 : (z > 0.52 ? 1 : (z - 0.24) / 0.28);
    /* LE FRACAS FAIT PLACE. Un décor qui reste par-dessus une
       explosion n'est plus un décor, c'est une gêne. On lit la date
       du dernier souffle, que le fichier du son tient déjà. */
    var fBoum = (t - son.dernierBoum) < 6 ? 0.40 : 1;
    var cible = fZoom * fBoum;
    n.groupe.gain.setTargetAtTime(Math.max(0.0001, cible), t, 0.45);

    /* --- la proximité des bassins, une image sur quatre --- */
    this.tic = (this.tic + 1) & 3;
    if(!this.tic) this.majProximite();
    var cibleEau = 0.014 * this.prox * fZoom;
    /* on n'écrit l'AudioParam que si la cible a VRAIMENT bougé : au
       plus quatre écritures par seconde au lieu de soixante */
    if(Math.abs(cibleEau - this.proxEcrite) > 0.004){
      this.proxEcrite = cibleEau;
      n.gEau.gain.setTargetAtTime(Math.max(0.0001, cibleEau), t, 0.35);
    }

    if(fZoom <= 0) return;                 // dézoomé : plus rien ne sonne

    /* LE JARDIN SE TAIT PENDANT LE PHÉNOMÈNE. La pluie d'étoiles a
       droit à toute l'oreille : c'est la signature de la carte. */
    var enPluie = (typeof phasePluie === "function" &&
                   typeof horlogePluie === "function") &&
                  phasePluie(horlogePluie()).phase !== 0;

    /* --- les gouttes : cadence divisée par la proximité --- */
    this.tGoutte -= dt;
    if(this.tGoutte <= 0){
      this.tGoutte = (1.2 + Math.random() * 2.6) / Math.max(0.15, this.prox);
      if(this.prox > 0.05 && son.goutteNuits) son.goutteNuits(this.prox);
    }
    if(enPluie) return;

    /* --- les clochettes --- */
    this.tClochette -= dt;
    if(this.tClochette <= 0){
      /* L'INTERVALLE EST TIRÉ DANS UN RAPPORT LARGE, et une fois sur
         cinq on l'allonge encore beaucoup : ce sont ces trous de
         soixante-dix secondes qui empêchent le hasard de se tasser en
         densité constante. */
      this.tClochette = (9 + Math.random() * 17) * (Math.random() < 0.2 ? 2.8 : 1);
      /* et l'on saute purement, on ne diffère pas : une clochette
         qu'on repousse finit par sonner juste après l'explosion */
      if((t - son.dernierBoum) > 2.5 && son.clocheNuits) son.clocheNuits();
    }

    /* --- les petites notes magiques --- */
    this.tNote -= dt;
    if(this.tNote <= 0){
      this.tNote = 38 + Math.random() * 62;
      /* PAS DE BULLE À L'ÉCRAN, PAS DE NOTE. 0,30 est le seuil auquel
         les bulles sont réellement dessinées : le son ne ment jamais
         sur ce qu'on voit. */
      if(z >= 0.30 && son.noteMagique) son.noteMagique();
    }
  },

  /* ================================================================
     OÙ SONT LES BASSINS

     Les fontaines sont les décors de variante 2 — voir le dessin des
     décors des nuits — et leur taille dit leur débit : une vasque
     compte pour 0,42, une fontaine à étages pour 0,66, une grande
     pour 1. On prend la plus forte contribution et non la somme :
     être entre deux vasques ne doit pas sonner comme un torrent.

     Distances au CARRÉ, sans racine, sauf sur le petit lot des
     candidats proches : cinq cents décors × quinze fois par seconde,
     une racine de trop se paie.
     ================================================================ */
  majProximite:function(){
    var C = (typeof carte !== "undefined" && carte) ? carte : null;
    if(!C || !C.decors || typeof centreCameraGx !== "function"){ this.prox = 0; return; }
    var gx = centreCameraGx(), gy = centreCameraGy();
    var meilleur = 0, POIDS = [0.42, 0.66, 1.0];
    for(var i = 0; i < C.decors.length; i++){
      var d = C.decors[i];
      if(d.v !== 2) continue;                       // seules les fontaines
      var ex = d.gx - gx, ey = d.gy - gy;
      var q = ex * ex + ey * ey;
      if(q > 121) continue;                          // au-delà de onze cases, rien
      var a = q < 9 ? 1 : (11 - Math.sqrt(q)) / 8;
      var p = a * POIDS[(typeof bandeNuits === "function" ? bandeNuits(d.s) : 1) | 0];
      if(p > meilleur) meilleur = p;
    }
    this.prox = meilleur;
  }
};

/* Le battement, appelé une fois par image sur la carte des nuits.
   `demarre` est RÉ-ESSAYÉ à chaque image, et il le faut : le contexte
   audio n'existe qu'après un geste du joueur, qui peut arriver
   longtemps après le débarquement. Un démarrage tenté une seule fois
   donnerait une carte définitivement muette pour un joueur sur
   trois. */
function majAmbianceNuits(dt){
  if(typeof son === "undefined" || !son.ok()) return;
  ambianceNuits.demarre();
  ambianceNuits.suit(dt);
}
