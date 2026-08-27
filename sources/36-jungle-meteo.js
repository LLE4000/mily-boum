/* ================================================================
   MILY DANS LA JUNGLE — LA MÉTÉO
   Un orage tropical permanent, et un impact de foudre toutes les
   trente secondes. Quarante éclairs dans une partie de vingt minutes :
   c'est ce chiffre-là qui commande tout le fichier. Un effet qu'on
   subit quarante fois n'a pas le droit d'agresser, si spectaculaire
   soit-il. D'où trois règles que rien ne renégocie ici :

     1. le voile plein écran de l'éclair plafonne à 0,32 d'alpha et
        il est retombé sous 0,02 en 140 ms ;
     2. la pluie est un rideau PÂLE — trois couches, 270 traits fins,
        jamais un mur d'eau : on doit lire un combat au travers ;
     3. pluie + brume + ciel tiennent sous 2 ms par image, à plein
        écran, à toutes les images de la partie.

   Quatre couches, appelées depuis le rendu en repère ÉCRAN
   (repereEcran déjà fait) :

     dessineCielOrage    la LUMIÈRE de la carte : teinte verte
                         d'orage, flaques de clarté et d'ombre qui
                         dérivent avec les nuages, vignette, lueurs
                         des roulements derrière la couche de nuages.
                         C'est elle qui rend l'île belle au dézoom,
                         quand plus aucun détail ne porte.
     dessineBrumeSol     une haleine pâle collée au sol, ancrée au
                         MONDE : elle suit la caméra, elle ne colle
                         pas à l'écran.
     dessinePluieJungle  le rideau (écran) + les éclaboussures
                         (monde, elles marquent le sol).
     dessineEclairJungle l'événement, en quatre temps : le ciel
                         blanchit, l'éclair descend, il frappe,
                         il fume.

   ----------------------------------------------------------------
   CE QUI DICTE TOUTE L'ARCHITECTURE DU FICHIER : LE FILTRAGE.
   Trois nappes plein écran à chaque image, c'est le poste le plus
   dangereux de la carte. Mesuré au banc, canevas de 1500×900 :

     motif tuilé, décalage ENTIER, sans mise à l'échelle   0,34 ms
     fillRect plein écran en rgba                          0,39 ms
     drawImage 1:1 d'un canevas plein écran                0,47 ms
     drawImage 1:1 + globalAlpha                           0,96 ms
     12 sprites doux de 380 px, lissage COUPÉ              0,99 ms
     drawImage ÉTIRÉ plein écran (lissage actif)           4,25 ms
     motif tuilé AVEC un scale                             4,86 ms
     12 sprites doux de 380 px, lissage ACTIF              5,16 ms

   Autrement dit : dès qu'un pixel source ne tombe pas exactement sur
   un pixel de destination, le prix est multiplié par DIX. Toutes les
   nappes de ce fichier sont donc peintes en pixels d'écran RÉELS,
   avec un décalage ARRONDI À L'ENTIER et jamais de scale ; la
   variation d'échelle avec le zoom passe par des TUILES pré-rendues
   à plusieurs tailles, pas par un scale au moment de peindre.
   ================================================================ */

/* ---------------------------------------------------------------
   PALETTE
   La jungle est verte, donc la pluie et la brume le sont un peu
   aussi : une pluie grise posée sur du vert fait un rideau de
   télévision en panne. L'éclair, lui, est le SEUL élément froid et
   bleu de la carte — c'est ce qui le rend étranger et violent sans
   avoir besoin d'être fort.
   --------------------------------------------------------------- */
var MET_PLUIE  = "206,234,226";     // pluie : pâle, verte, jamais blanche
var MET_BRUME  = "158,186,172";     // la brume d'orage est GRISE-verte, pas laiteuse
var MET_OMBRE  = "4,16,13";         // l'ombre des nuages
var MET_CLARTE = "168,220,148";     // la trouée de lumière tropicale
var MET_FLASH  = "204,224,255";     // le voile d'écran de l'éclair
var MET_E_HALO = "58,110,214";
var MET_E_BLEU = "146,188,255";
var MET_E_PALE = "216,234,255";
var MET_E_VIF  = "255,255,255";
var MET_ETINC  = "255,208,146";     // les étincelles refroidissent en orange
var MET_BRAISE = "255,150,64";      // la terre reste chaude sous la fumée
var MET_FUMEE  = "196,206,198";     // pâle : une fumée sombre disparaît sur la jungle

/* ---------------------------------------------------------------
   LE VENT
   Une seule fonction, et tout ce qui bouge s'y accroche : la pluie,
   la brume, les nuages. C'est ce partage qui fait que la carte
   respire ENSEMBLE au lieu d'empiler trois animations étrangères les
   unes aux autres. Deux rafales de périodes premières entre elles :
   le motif ne se répète jamais à l'œil.
   --------------------------------------------------------------- */
function ventJungle(tps){
  return 0.27 + 0.15 * Math.sin(tps * 0.21) + 0.09 * Math.sin(tps * 0.53 + 1.7);
}

/* ================================================================
   LES PRÉ-RENDUS
   ================================================================ */

/* Disque à bord fondu, une copie par teinte. lueurRapide fait déjà ça
   pour l'additif ; ici on a besoin du même outil en source-over, pour
   ASSOMBRIR — une ombre de nuage n'est pas une lumière. */
var metDisques = {};
function disqueMeteo(coul){
  var s = metDisques[coul];
  if(s) return s;
  s = nouveauCanvas(128, 128);
  var g = s.getContext("2d");
  var gr = g.createRadialGradient(64, 64, 1, 64, 64, 64);
  gr.addColorStop(0, "rgba(" + coul + ",1)");
  gr.addColorStop(0.42, "rgba(" + coul + ",0.52)");
  gr.addColorStop(1, "rgba(" + coul + ",0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  metDisques[coul] = s;
  return s;
}

/* Une tuile de taches douces, RACCORDABLE : chaque tache est peinte
   neuf fois, décalée d'une tuile dans les huit directions, si bien
   que ce qui déborde d'un bord rentre par l'autre. C'est ce qui
   permet de couvrir tout l'écran d'UN SEUL fillRect au lieu de
   cinquante drawImage.
   « coulClaire » mélange des taches pâles aux taches sombres : la
   même passe donne alors les zones ÉCLAIRÉES et les zones d'ombre.
   Une seconde passe additive aurait doublé le prix pour rien. */
function tuileTaches(T, n, coulSombre, coulClaire, opaS, opaC, fond, graine){
  var cv = nouveauCanvas(T, T);
  var g = cv.getContext("2d");
  if(fond){ g.fillStyle = fond; g.fillRect(0, 0, T, T); }
  var al = prng(graine);
  var ds = disqueMeteo(coulSombre), dc = coulClaire ? disqueMeteo(coulClaire) : null;
  for(var i = 0; i < n; i++){
    var x = al() * T, y = al() * T, r = T * (0.13 + al() * 0.30);
    var clair = dc && al() < 0.42;
    g.globalAlpha = clair ? opaC * (0.45 + al() * 0.75) : opaS * (0.45 + al() * 0.85);
    var d = clair ? dc : ds;
    for(var ox = -1; ox <= 1; ox++)
      for(var oy = -1; oy <= 1; oy++)
        g.drawImage(d, x + ox * T - r, y + oy * T - r, r * 2, r * 2);
  }
  return cv;
}

/* Les nuages portent AUSSI la teinte de fond de l'orage : une passe
   de moins à l'écran, le voile vert et les taches arrivent ensemble.
   La brume, elle, n'a pas de fond — elle doit rester une respiration,
   pas un voile de plus. */
var MET_TEXTURES = {
  /* Les ombres pèsent trois fois les trouées de lumière. C'est
     volontaire : ce qu'on cherche n'est pas d'éclairer la carte —
     elle l'est déjà — mais de creuser des zones SOMBRES entre
     lesquelles le reste passe pour de la lumière. Le premier réglage
     mettait les deux à égalité et rendait une jungle laiteuse et
     plate, sans un seul noir. */
  nuages:{ n:26, sombre:MET_OMBRE, claire:MET_CLARTE, opaS:0.30, opaC:0.075,
           fond:"rgba(7,26,22,0.09)", graine:0x51A9E1 },
  brume: { n:20, sombre:MET_BRUME, claire:null,       opaS:0.055, opaC:0,
           fond:null,                graine:0x2C77B3 }
};

/* Les tuiles sont pré-rendues en PUISSANCES DE DEUX, et une seule
   maîtresse par texture est peinte à la main : les autres tailles en
   sont tirées par un unique agrandissement, une fois pour toutes. Le
   zoom choisit sa taille — on ne met jamais de scale à l'écran. */
var metTuiles = {};
function motifMeteo(c, nom, T){
  var cle = nom + T;
  var m = metTuiles[cle];
  if(m) return m;
  var d = MET_TEXTURES[nom];
  var maitresse = metTuiles[nom + "@"];
  if(!maitresse){
    maitresse = tuileTaches(256, d.n, d.sombre, d.claire, d.opaS, d.opaC, d.fond, d.graine);
    metTuiles[nom + "@"] = maitresse;
  }
  var src = maitresse;
  if(T !== 256){
    src = nouveauCanvas(T, T);
    src.getContext("2d").drawImage(maitresse, 0, 0, T, T);
  }
  m = c.createPattern(src, "repeat");
  metTuiles[cle] = m;
  return m;
}

/* La taille de tuile qui convient au zoom courant, arrondie à la
   puissance de deux la plus proche. L'arrondi n'est pas une
   coquetterie : il borne à quatre le nombre de tuiles construites
   dans une partie, et il évite qu'un pincement continu n'en
   fabrique une nouvelle à chaque image. */
function tailleTuile(cible){
  return borne(128 << Math.round(Math.log(cible / 128) / Math.LN2), 128, 1024);
}

/* PEINDRE UNE NAPPE PLEIN ÉCRAN — le cœur de la performance de ce
   fichier. On sort du repère du rendu pour travailler en pixels
   d'écran RÉELS : c'est le seul moyen de garantir que le décalage
   reste entier quelle que soit la définition choisie par le
   gouverneur (dpr 1, 1,25, 1,5, 2…). Un décalage fractionnaire fait
   basculer le rasteriseur en échantillonnage filtré, et 0,34 ms
   deviennent 12 ms — mesuré. */
function nappeMeteo(c, motif, dx, dy){
  var lw = c.canvas.width, lh = c.canvas.height;
  var ox = Math.round(dx), oy = Math.round(dy);
  c.save();
  c.setTransform(1, 0, 0, 1, ox, oy);
  c.fillStyle = motif;
  c.fillRect(-ox, -oy, lw, lh);
  c.restore();
}

/* ---------------------------------------------------------------
   LES VOILES PLEIN ÉCRAN
   Un dégradé étiré coûte dix fois un blit à l'échelle un. On peint
   donc la vignette et le voile de ciel À LA TAILLE EXACTE de
   l'écran, une fois, et on les repose sans jamais les
   redimensionner. Ils sont refaits quand le canevas change de
   taille — rotation de la tablette, ou un cran du gouverneur de
   définition, et rien d'autre.
   --------------------------------------------------------------- */
var metVoiles = { w:0, h:0, vignette:null, ciel:null };
function voilesOrage(c){
  var lw = c.canvas.width, lh = c.canvas.height;
  if(metVoiles.w === lw && metVoiles.h === lh) return metVoiles;
  metVoiles.w = lw; metVoiles.h = lh;

  /* LE VOILE D'AIR : la teinte d'orage et la vignette dans la MÊME
     image. Deux passes plein écran coûteraient deux fois le prix pour
     un résultat identique — le dégradé porte les deux. Il ne descend
     jamais à zéro au centre : c'est cette part uniforme qui fait la
     lumière d'orage sur toute la carte. */
  var v = nouveauCanvas(lw, lh);
  var g = v.getContext("2d");
  var gr = g.createRadialGradient(lw / 2, lh * 0.54, lh * 0.10,
                                  lw / 2, lh * 0.54, lh * 0.95);
  gr.addColorStop(0, "rgba(8,30,26,0.17)");
  gr.addColorStop(0.50, "rgba(6,24,22,0.24)");
  gr.addColorStop(1, "rgba(2,10,11,0.50)");
  g.fillStyle = gr;
  g.fillRect(0, 0, lw, lh);
  metVoiles.vignette = v;

  /* le ciel qui s'allume par le haut : sert aux roulements lointains
     comme à l'annonce de l'éclair */
  var hc = Math.max(2, Math.round(lh * 0.46));
  var s = nouveauCanvas(lw, hc);
  var g2 = s.getContext("2d");
  var gr2 = g2.createLinearGradient(0, 0, 0, hc);
  gr2.addColorStop(0, "rgba(" + MET_FLASH + ",1)");
  gr2.addColorStop(0.34, "rgba(" + MET_FLASH + ",0.34)");
  gr2.addColorStop(1, "rgba(" + MET_FLASH + ",0)");
  g2.fillStyle = gr2;
  g2.fillRect(0, 0, lw, hc);
  metVoiles.ciel = s;

  return metVoiles;
}

/* Le halo du flash, posé à L'ÉCHELLE UN autour du point d'impact.
   Il tombe bien à zéro sur son bord : c'est le fond uniforme, et lui
   seul, qui éclaire le reste de l'écran. Un halo qui s'arrêterait à
   0,2 dessinerait un cercle net en travers de la carte. */
var metHalo = null;
function haloFlash(c){
  if(metHalo) return metHalo;
  var R = tailleTuile(Math.max(c.canvas.width, c.canvas.height) * 0.85);
  metHalo = nouveauCanvas(R, R);
  var g = metHalo.getContext("2d");
  var gr = g.createRadialGradient(R / 2, R / 2, 1, R / 2, R / 2, R / 2);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.13, "rgba(" + MET_FLASH + ",0.72)");
  gr.addColorStop(0.44, "rgba(" + MET_FLASH + ",0.30)");
  gr.addColorStop(1, "rgba(" + MET_FLASH + ",0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, R, R);
  return metHalo;
}

/* Bouffée de fumée pré-rendue. bouffeeFloue crée trois dégradés par
   appel : parfait pour un Brouillard, ruineux pour cinq volutes
   redessinées à chaque image pendant deux secondes. */
var metFumee = null;
function spriteFumee(){
  if(metFumee) return metFumee;
  metFumee = nouveauCanvas(96, 96);
  var g = metFumee.getContext("2d");
  var lobes = [[48, 48, 40], [30, 54, 26], [64, 52, 24], [46, 34, 22]];
  for(var i = 0; i < 4; i++){
    var gr = g.createRadialGradient(lobes[i][0], lobes[i][1], 1,
                                    lobes[i][0], lobes[i][1], lobes[i][2]);
    gr.addColorStop(0, "rgba(" + MET_FUMEE + ",0.46)");
    gr.addColorStop(0.5, "rgba(" + MET_FUMEE + ",0.22)");
    gr.addColorStop(1, "rgba(" + MET_FUMEE + ",0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 96, 96);
  }
  return metFumee;
}

/* ---------------------------------------------------------------
   LA GRILLE ANCRÉE AU MONDE
   Tout ce qui doit COLLER AU SOL — éclaboussures, petites lumières —
   est posé sur une grille exprimée dans l'espace iso, pas à l'écran.
   Le pas de la grille suit le zoom, donc le nombre de cases visibles
   reste constant quel que soit le dézoom : on paie toujours le même
   prix.
   Le zoom employé est ARRONDI par demi-octave. Sans cet arrondi, le
   moindre pincement redistribuait toutes les éclaboussures ; avec
   lui, elles ne bougent qu'aux paliers, et jamais pendant qu'on se
   déplace — qui est le geste courant.
   --------------------------------------------------------------- */
var metGrille = { pas:0, i0:0, i1:0, j0:0, j1:0 };
function bornesGrille(pasEcran, marge){
  var z = cam.z;
  var zq = Math.pow(2, Math.round(Math.log(z) / Math.LN2 * 2) * 0.5);
  var pas = pasEcran / zq;
  var ax = (-cam.px - marge) / z, ay = (-cam.py - marge) / z;
  var g = metGrille;
  g.pas = pas;
  g.i0 = Math.floor(ax / pas); g.i1 = Math.floor((ax + (W + marge * 2) / z) / pas);
  g.j0 = Math.floor(ay / pas); g.j1 = Math.floor((ay + (H + marge * 2) / z) / pas);
  return g;
}

/* ================================================================
   1. LE CIEL
   ================================================================ */

/* Les roulements : au loin, derrière les nuages, un éclair qu'on ne
   voit pas frapper. C'est ce qui fait qu'on est DANS l'orage entre
   deux impacts, et non devant une carte verte qui attend son effet.
   Rare, faible, et toujours en haut de l'écran — un voile plein cadre
   toutes les sept secondes ne servirait qu'à fatiguer. */
function roulementJungle(tps){
  var n = Math.floor(tps / 6.7);
  var f = bruitStable(n, 1);
  if(f < 0.42) return 0;                      // un cycle sur deux, rien
  var d = tps - n * 6.7 - (0.4 + bruitStable(n, 0) * 5.2);
  if(d < 0 || d > 0.7) return 0;
  /* deux claquements : un vrai éclair lointain se réamorce */
  return Math.exp(-d * 6.5) * (0.62 + 0.38 * Math.sin(d * 44)) * (0.35 + f * 0.65);
}

/* LES OMBRES DE NUAGES, sur le SOL. Appelée tôt, sous les entités :
   c'est bien de l'ombre portée sur la terre, elle n'a rien à faire
   par-dessus les troupes. */
function dessineCielOrage(c, tps){
  var e = dpr;
  greffeSonJungle();
  /* Une seule nappe : les ombres et les trouées de lumière sont dans
     la même tuile. Elle est ancrée au monde à 85 % — pas 100 : ce
     léger glissement par rapport au sol suffit à lire les taches comme
     des nuages qui passent AU-DESSUS, et non comme une salissure
     peinte sur la terre. */
  var T = tailleTuile(250 * e * borne(cam.z * 1.7, 0.6, 2.3));
  nappeMeteo(c, motifMeteo(c, "nuages", T),
             (cam.px * 0.85 + secX + tps * 6.5) * e,
             (cam.py * 0.85 + secY + tps * 2.2) * e);
}

/* ---------------------------------------------------------------
   LE VOILE D'AIR — À APPELER EN DERNIER, APRÈS LA PLUIE.
   C'est le point d'entrée que le contrat ne prévoyait pas, et il
   s'est imposé à la première capture honnête : les ombres de nuages
   sont peintes SOUS les entités, or au zoom de jeu la carte est
   couverte de bâtiments et de canopée. Résultat, tout l'orage passait
   dessous et il ne restait, de près, qu'une jungle ensoleillée avec
   trois gouttes. Ce qui manque n'est pas une ombre au sol : c'est la
   lumière de l'AIR entre la caméra et la carte, et celle-là passe
   forcément par-dessus tout.
   Une seule image posée à l'échelle un : teinte d'orage et vignette
   dans le même dégradé, plus la lueur des roulements lointains.
   FILET DE SÉCURITÉ : si personne ne l'appelle, dessinePluieJungle
   s'en charge à la fin — la pluie est dans le même air. Le garde-fou
   sur `tps` fait que la couche n'est jamais peinte deux fois dans la
   même image, quel que soit celui des deux qui arrive le premier.
   --------------------------------------------------------------- */
var metVoileTps = -1;
function dessineVoileOrage(c, tps){
  if(tps === metVoileTps) return;
  metVoileTps = tps;
  var v = voilesOrage(c);
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.drawImage(v.vignette, 0, 0);
  /* LES ROULEMENTS, tout en haut de l'écran. */
  var r = roulementJungle(tps);
  if(r > 0.015){
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = r * 0.16;
    c.drawImage(v.ciel, 0, 0);
  }
  c.restore();
}

/* ================================================================
   2. LA BRUME AU SOL
   ================================================================ */
function dessineBrumeSol(c, tps){
  var e = dpr;
  /* Ancrée au monde à 100 % : la brume est POSÉE sur le sol, elle ne
     flotte pas devant l'objectif. Elle dérive dans le sens du vent —
     c'est la seule chose qui la distingue d'une tache sur la tuile de
     terrain. Sa tuile est plus grande que celle des nuages : au sol
     on voit de longues traînes, pas des moutons. */
  var T = tailleTuile(420 * e * borne(cam.z * 1.9, 0.7, 2.6));
  nappeMeteo(c, motifMeteo(c, "brume", T),
             (cam.px + secX + tps * ventJungle(tps) * 13) * e,
             (cam.py + secY + tps * 3.4) * e);
}

/* ================================================================
   3. LA PLUIE
   ================================================================ */

/* Trois couches de profondeur. Le rideau se lit par le CONTRASTE
   entre les gouttes lentes et fines du fond et les rapides du premier
   plan ; une seule couche uniforme ne donne qu'un grillage.
   270 traits au total, et surtout : chaque couche est UN SEUL
   beginPath/stroke. Ce sont les appels à stroke() qui coûtent, pas
   les pixels — 270 traits de quinze pixels ne remplissent rien du
   tout. Mesuré : 0,09 ms les trois couches, contre 0,31 ms les mêmes
   gouttes tracées une par une, et contre 0,34 ms la moindre nappe
   plein écran. La pluie est de loin la couche la moins chère. */
/* Les longueurs et les opacités du premier essai — 9 à 21 px, 0,07 à
   0,135 — donnaient une pluie littéralement INVISIBLE en capture. Une
   goutte se lit comme une TRAÎNÉE : c'est sa longueur, pas son
   opacité, qui la fait exister. On a donc allongé et éclairci, tout
   en gardant une surface couverte dérisoire — 270 traits d'un pixel
   et demi de large, c'est deux millièmes de l'écran. Il n'y a rien à
   cacher là-dedans. */
var MET_COUCHES_PLUIE = [
  { n:98,  v:560,  len:14, ep:0.75, a:0.11, sway:14 },
  { n:104, v:800,  len:21, ep:1.00, a:0.15, sway:22 },
  { n:68,  v:1090, len:31, ep:1.40, a:0.20, sway:30 }
];

function dessinePluieJungle(c, tps){
  /* filet de sécurité : voir dessineVoileOrage. La pluie tombe DANS
     l'air voilé, donc le voile passe avant elle. */
  dessineVoileOrage(c, tps);
  var z = cam.z;
  var pente = ventJungle(tps);
  /* Les gouttes rétrécissent au dézoom. Sinon, quand on prend toute
     l'île dans l'écran, le rideau garde sa taille et devient un
     grillage posé sur une carte devenue minuscule. */
  var ech = borne(0.62 + z * 0.50, 0.66, 1.30);
  var hh = H + 150;
  var l, i;

  c.save();
  c.lineCap = "butt";
  for(l = 0; l < 3; l++){
    var q = MET_COUCHES_PLUIE[l];
    var lg = q.len * ech;
    /* la rafale pousse tout le rideau de côté sans toucher aux
       gouttes une à une : c'est gratuit, et ça suffit à faire un
       vent */
    var derive = Math.sin(tps * 0.37 + l * 1.9) * q.sway
               + Math.sin(tps * 0.13 + l) * q.sway * 0.6;
    c.strokeStyle = "rgba(" + MET_PLUIE + "," + q.a + ")";
    c.lineWidth = q.ep * ech;
    c.beginPath();
    for(i = 0; i < q.n; i++){
      var bx = bruitStable(i + l * 911, 0);
      var by = bruitStable(i + l * 911, 1);
      var y = (by * hh + tps * q.v) % hh - 110;
      var x = bx * (W + 260) - 130 + derive;
      var ll = lg * (0.7 + bx * 0.6);
      c.moveTo(x, y);
      c.lineTo(x + pente * ll, y + ll);
    }
    c.stroke();
  }
  c.restore();

  /* LES ÉCLABOUSSURES. Ancrées au MONDE : elles marquent le sol, pas
     l'écran — sans ça elles glissent dès qu'on déplace la caméra et
     tout l'effet s'effondre. On ne les paie qu'au-dessus du zoom où
     on les distingue ; en dessous ce ne serait qu'un pointillé gris
     de plus par-dessus la carte. */
  if(z < 0.44) return;
  var g = bornesGrille(128, 70);
  var vis = borne((z - 0.44) * 4, 0, 1);
  c.save();
  c.lineWidth = Math.max(0.8, 1.1 * z);
  for(i = g.i0; i <= g.i1; i++){
    for(var j = g.j0; j <= g.j1; j++){
      var n0 = i * 131.7 + j * 37.3;
      var b0 = bruitStable(n0, 0), b1 = bruitStable(n0, 1);
      var b2 = bruitStable(i * 57.1 - j * 91.9, 1);
      var ph = (tps * 1.55 + b2) % 1;
      if(ph > 0.42) continue;                    // deux cases sur cinq
      var u = ph / 0.42;
      var x = ((i + b0) * g.pas) * z + cam.px;
      var y = ((j + b1) * g.pas) * z + cam.py;
      if(x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
      var rr = (2.5 + u * 9) * z;
      c.strokeStyle = "rgba(" + MET_PLUIE + "," + ((1 - u) * 0.34 * vis) + ")";
      c.beginPath();
      c.ellipse(x, y, rr, rr * 0.5, 0, 0, 6.2832);
      c.stroke();
    }
  }
  c.restore();
}

/* ================================================================
   4. LES PETITES LUMIÈRES DE LA VÉGÉTATION
   Hors contrat, mais c'est la même couche de lumière : des points
   chauds accrochés au sol, qui respirent. Au dézoom, quand plus
   aucune feuille n'est lisible, ce sont eux qui disent qu'il y a de
   la vie sous la canopée. Coût dérisoire : des blits de quinze
   pixels de côté, mesurés à 0,05 ms les quarante.
   ================================================================ */
function dessineLueursVegetation(c, tps){
  /* C'est la PREMIÈRE des couches empilées par-dessus la carte, donc
     le meilleur endroit pour le filet de sécurité du voile : ainsi
     l'éclair, qui vient ensuite, perce le voile au lieu d'être posé
     dessous. Voir dessineVoileOrage. */
  dessineVoileOrage(c, tps);
  var z = cam.z;
  if(z < 0.18) return;
  var g = bornesGrille(170, 60);
  for(var i = g.i0; i <= g.i1; i++){
    for(var j = g.j0; j <= g.j1; j++){
      var n0 = i * 91.3 + j * 173.9;
      var b0 = bruitStable(n0, 0), b1 = bruitStable(n0, 1);
      if(b0 < 0.62) continue;                    // clairsemé, sinon c'est un lampion
      var x = ((i + b1) * g.pas) * z + cam.px;
      var y = ((j + b0) * g.pas) * z + cam.py;
      if(x < 0 || x > W || y < 0 || y > H) continue;
      /* deux rythmes : la respiration lente et un battement rapide.
         C'est le battement qui donne l'illusion du vivant ; une lueur
         d'intensité fixe passe pour un pixel mort. */
      var p = 0.45 + 0.35 * Math.sin(tps * (0.8 + b1) + b0 * 6.28)
                   + 0.20 * Math.sin(tps * (3.1 + b0 * 2) + b1 * 6.28);
      if(p < 0.12) continue;
      lueurRapide(c, x, y - 9 * z, (5 + b1 * 5) * Math.max(0.55, z),
                  b1 > 0.55 ? "#ffe08a" : "#a8ffbe", p * 0.22);
    }
  }
}

/* ================================================================
   5. L'ÉCLAIR
   ================================================================ */

/* La chronologie, en secondes depuis e.age = 0. Elle NE dépend PAS de
   e.duree : c'est la durée du coup de foudre lui-même, et elle est la
   même qu'on laisse la trace fumante deux secondes ou six. e.duree ne
   pilote que la queue — fumée et brûlure au sol. */
var EC_DESC = 0.13;      // le temps que l'éclair met à descendre
var EC_VIE  = 0.30;      // ce qu'il vit encore après avoir touché

/* L'intensité du canal. Un éclair ne s'éteint pas d'un coup : il se
   réamorce deux fois. Ces deux bosses sont ce qui distingue un éclair
   d'un trait blanc qu'on efface. */
function eclatEclair(t){
  if(t < 0) return 0;
  if(t < EC_DESC) return 0.20 + 0.42 * (t / EC_DESC);
  var u = t - EC_DESC;
  if(u > EC_VIE) return 0;
  return Math.min(1, Math.exp(-u * 10.5)
                   + Math.exp(-Math.abs(u - 0.082) * 48) * 0.52
                   + Math.exp(-Math.abs(u - 0.163) * 58) * 0.30);
}

/* LE VOILE PLEIN ÉCRAN — la valeur la plus surveillée du fichier,
   puisqu'on la subit quarante fois par partie. Deux composantes : un
   halo centré sur l'impact (0,22 à son cœur) et un fond uniforme
   (0,10). Soit 0,32 au maximum, et seulement au point de chute.
   La décroissance est une exponentielle de constante 42 ms : à 140 ms
   il reste 3,5 % du pic, c'est-à-dire rien. */
function voileEclair(t){
  if(t < 0) return 0;
  if(t < EC_DESC) return 0.05 * (t / EC_DESC);   // le ciel blanchit AVANT
  return Math.exp(-(t - EC_DESC) / 0.042);
}

/* Le TRAJET, en coordonnées normalisées : x est un écart latéral en
   fraction de la hauteur de chute, y va de 0 (le ciel) à 1 (le sol).
   Construit UNE fois par impact et rangé sur l'objet : la caméra peut
   se déplacer, zoomer, dézoomer, l'éclair garde exactement la même
   forme. C'est indispensable — un éclair retiré au hasard à chaque
   image grésille, et le grésillement est précisément ce qui rend un
   effet fatigant. */
function trajetFoudre(graine){
  var al = prng(graine || 7);
  var N = 15;
  var x0 = (al() - 0.5) * 0.46;         // il ne tombe jamais à la verticale
  var p = [x0, 0];
  for(var k = 1; k <= N; k++){
    var f = k / N;
    /* le zigzag s'apaise en descendant : le canal se resserre sur son
       point d'arrivée, sinon l'éclair rate visiblement sa cible */
    var amp = 0.115 * (1 - f * 0.82);
    p.push(x0 * (1 - f) * (1 - f) + (al() - 0.5) * 2 * amp);
    p.push(f + (al() - 0.5) * 0.022);
  }
  p[p.length - 2] = 0; p[p.length - 1] = 1;
  /* Les ramifications partent vers le bas et vers l'extérieur, et
     meurent en l'air. Une branche qui toucherait le sol ferait deux
     impacts : il n'y en a qu'un, et c'est celui que le joueur doit
     regarder. */
  var br = [];
  for(var b = 0; b < 3; b++){
    var d0 = 2 + ((al() * 9) | 0);
    if(d0 * 2 + 1 >= p.length) continue;
    var bx = p[d0 * 2], by = p[d0 * 2 + 1];
    var sens = al() < 0.5 ? -1 : 1;
    var q = [bx, by];
    var nb = 3 + ((al() * 3) | 0);
    for(var m = 1; m <= nb; m++){
      bx += sens * (0.035 + al() * 0.075);
      by += 0.025 + al() * 0.055;
      q.push(bx); q.push(Math.min(1, by));
    }
    br.push(q);
  }
  return { p:p, n:N + 1, br:br };
}

/* Quatre passes, de la plus large à la plus fine — le procédé des
   rayons de Mily (74-vengeance.js). En additif, c'est la PROPORTION
   qui fait tout : un noyau blanc trop épais et l'éclair devient une
   barre fluo. Le blanc ne fait donc qu'un quart de la largeur, et les
   trois quarts de l'énergie sont bleus. */
var PASSES_FOUDRE = [
  { l:4.6,  col:MET_E_HALO, a:0.20 },
  { l:2.10, col:MET_E_BLEU, a:0.34 },
  { l:0.82, col:MET_E_PALE, a:0.56 },
  { l:0.26, col:MET_E_VIF,  a:0.95 }
];
function traitFoudre(c, xs, ys, n, larg, I){
  c.lineCap = "round";
  c.lineJoin = "round";
  for(var q = 0; q < 4; q++){
    var P = PASSES_FOUDRE[q];
    c.strokeStyle = "rgba(" + P.col + "," + (P.a * I) + ")";
    c.lineWidth = Math.max(0.7, P.l * larg);
    c.beginPath();
    c.moveTo(xs[0], ys[0]);
    for(var i = 1; i < n; i++) c.lineTo(xs[i], ys[i]);
    c.stroke();
  }
}

/* Tableaux réutilisés : projeter le trajet ne doit rien allouer. */
var metXs = [], metYs = [];

function dessineEclairJungle(c, e, tps){
  var t = e.age;
  var z = cam.z;
  /* Fondu de queue : la fumée et la brûlure s'éteignent AVEC e.duree,
     jamais d'un coup. */
  var queue = borne((e.duree - t) / 0.7, 0, 1);
  if(queue <= 0) return;

  var p = versEcran(cam, e.gx, e.gy);
  if(!e.trace) e.trace = trajetFoudre(((e.gx * 9377 + e.gy * 613) | 0) ^ 0x5b3);
  var tr = e.trace;
  var I = eclatEclair(t);
  var vo = voileEclair(t);
  var k;

  /* ---- 1 & 2. LE CIEL BLANCHIT, PUIS L'ÉCLAIR DESCEND ---- */
  /* Le sommet est TOUJOURS au-dessus du bord haut de l'écran : quel
     que soit le zoom, l'éclair traverse tout le cadre. C'est ce qui le
     rend spectaculaire sans coûter un pixel de plus. */
  var yCiel = -Math.max(70, H * 0.12);
  var haut = p.y - yCiel;

  if(I > 0.004 && haut > 60){
    /* l'annonce : la couche de nuages s'allume au-dessus de l'impact,
       une fraction de seconde avant que quoi que ce soit ne tombe */
    if(t < EC_DESC + 0.06){
      var vl = voilesOrage(c);
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = "lighter";
      c.globalAlpha = borne(t / EC_DESC, 0, 1) * 0.15;
      c.drawImage(vl.ciel, 0, 0);
      c.restore();
    }

    /* La largeur ne suit PAS le zoom : un éclair est de la lumière
       dans l'air, il est aussi gros de près que de loin. */
    var larg = 2.4 + 6.6 * I;
    var f = t < EC_DESC ? t / EC_DESC : 1;
    var nb = Math.max(2, Math.min(tr.n, Math.ceil(f * tr.n)));

    c.save();
    c.globalCompositeOperation = "lighter";
    for(k = 0; k < nb; k++){
      metXs[k] = p.x + tr.p[k * 2] * haut;
      metYs[k] = yCiel + tr.p[k * 2 + 1] * haut;
    }
    /* le dernier point est interpolé, sinon l'éclair descend par
       marches de sept pixels et on voit la construction */
    if(nb < tr.n){
      var av = (nb - 1) * 2, ap = nb * 2;
      var y0 = tr.p[av + 1], y1 = tr.p[ap + 1];
      var g0 = borne((f - y0) / Math.max(0.0001, y1 - y0), 0, 1);
      metXs[nb] = p.x + (tr.p[av] + (tr.p[ap] - tr.p[av]) * g0) * haut;
      metYs[nb] = yCiel + (y0 + (y1 - y0) * g0) * haut;
      nb++;
    }
    traitFoudre(c, metXs, metYs, nb, larg, I);

    /* les ramifications : plus fines, plus sourdes, et seulement une
       fois que le canal principal les a dépassées */
    for(var b = 0; b < tr.br.length; b++){
      var q = tr.br[b];
      if(q[1] > f) continue;
      var m = q.length >> 1;
      for(var s = 0; s < m; s++){
        metXs[s] = p.x + q[s * 2] * haut;
        metYs[s] = yCiel + q[s * 2 + 1] * haut;
      }
      traitFoudre(c, metXs, metYs, m, larg * 0.55, I * 0.72);
    }
    c.restore();
  }

  /* ---- LE VOILE D'ÉCRAN ---- */
  if(vo > 0.006){
    var ha = haloFlash(c);
    c.save();
    c.globalCompositeOperation = "lighter";
    /* le halo, centré sur l'impact et posé À L'ÉCHELLE UN : c'est lui
       qui allume les arbres AUTOUR du point de chute, plutôt que
       d'aplatir l'écran entier d'un coup de blanc */
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = vo * 0.22;
    c.drawImage(ha, Math.round((p.x + secX) * dpr - ha.width / 2),
                    Math.round((p.y + secY) * dpr - ha.height / 2));
    /* le fond uniforme, faible : sans lui, le halo se lirait comme un
       projecteur braqué sur un coin de la carte */
    c.globalAlpha = 1;
    c.fillStyle = "rgba(" + MET_FLASH + "," + (vo * 0.10) + ")";
    c.fillRect(0, 0, c.canvas.width, c.canvas.height);
    c.restore();
  }

  /* ---- 3. L'IMPACT AU SOL ---- */
  var ti = t - EC_DESC;
  if(ti < 0) return;

  c.save();
  /* Le cœur blanc. C'est LUI qui donne la violence du coup, et il ne
     coûte rien au confort : il est local, il n'aplatit pas l'écran
     comme le ferait un voile. Quand on veut qu'un éclair frappe plus
     fort, c'est ce chiffre-là qu'on monte, jamais celui du voile. */
  var ec = Math.exp(-ti * 10);
  if(ec > 0.01)
    lueurRapide(c, p.x, p.y - 8 * z, (46 + 104 * z) * (0.55 + ec * 1.0),
                "#e6f0ff", 0.86 * ec);
  /* l'anneau de souffle, en ellipse isométrique : c'est lui qui dit
     que le coup a touché LE SOL et pas l'air */
  if(ti < 0.62){
    var ao = ti / 0.62;
    c.globalCompositeOperation = "lighter";
    c.strokeStyle = "rgba(" + MET_E_PALE + "," + ((1 - ao) * (1 - ao) * 0.72) + ")";
    c.lineWidth = Math.max(1.2, 5.5 * z * (1 - ao));
    c.beginPath();
    c.ellipse(p.x, p.y, RX * z * (0.5 + ao * 3.9), RY * z * (0.5 + ao * 3.9),
              0, 0, 6.2832);
    c.stroke();
    c.globalCompositeOperation = "source-over";
  }
  /* LA BRÛLURE. Premier essai : un disque noir. Sur une terre de
     jungle déjà presque noire, il ne se voyait tout simplement pas.
     Ce qui se voit, c'est la BRAISE — la terre est restée chaude, et
     ce point orange sous la fumée est tout ce qu'il faut pour lire
     « quelque chose vient de brûler ici ». */
  if(z > 0.22){
    c.globalAlpha = 0.34 * queue * borne(ti * 6, 0, 1);
    c.fillStyle = "#0e0a06";
    c.beginPath();
    c.ellipse(p.x, p.y, RX * z * 0.80, RY * z * 0.80, 0, 0, 6.2832);
    c.fill();
    c.globalAlpha = 1;
    var br = queue * Math.exp(-ti * 0.9) * (0.72 + 0.28 * Math.sin(tps * 6.3 + e.gx));
    lueurRapide(c, p.x, p.y, RX * z * 0.62, "#ff9640", 0.34 * br);
  }
  c.restore();

  /* ---- 4. LES ÉTINCELLES ---- */
  if(ti < 0.85 && z > 0.2){
    c.save();
    c.globalCompositeOperation = "lighter";
    c.lineCap = "round";
    var al = prng(((e.gx * 313 + e.gy * 887) | 0) ^ 0x9e3);
    for(var s2 = 0; s2 < 16; s2++){
      var ang = al() * 6.2832;
      var vit = 55 + al() * 145;
      var vy = -(40 + al() * 110);
      var du = 0.35 + al() * 0.5;
      if(ti > du) continue;
      var u = ti / du;
      var ex = p.x + Math.cos(ang) * vit * ti * z;
      var ey = p.y + Math.sin(ang) * vit * 0.5 * ti * z + (vy * ti + 340 * ti * ti) * z;
      /* elles refroidissent : blanches au départ, orange à la fin */
      c.strokeStyle = "rgba(" + (u < 0.35 ? MET_E_PALE : MET_ETINC) + ","
                    + ((1 - u) * (1 - u) * 0.95) + ")";
      /* plancher d'un pixel et demi : au dézoom, une étincelle plus
         fine qu'un pixel s'efface complètement au lieu de pâlir */
      c.lineWidth = Math.max(1.5, 2.4 * z * (1 - u));
      c.beginPath();
      c.moveTo(ex, ey);
      c.lineTo(ex - Math.cos(ang) * 11 * z, ey - Math.sin(ang) * 5.5 * z);
      c.stroke();
    }
    c.restore();
  }

  /* ---- 5. LA TRACE FUMANTE ---- */
  if(ti > 0.10){
    var sp = spriteFumee();
    c.save();
    /* lissage COUPÉ : ces cinq bouffées sont agrandies de 96 à
       plusieurs centaines de pixels, et un agrandissement filtré coûte
       cinq fois le prix. Sur un dégradé aussi doux, l'escalier ne se
       voit pas — vérifié à l'écran. */
    c.imageSmoothingEnabled = false;
    for(var v = 0; v < 6; v++){
      var age = ti - (0.08 + v * 0.16);
      if(age < 0) continue;
      var uu = age / (1.7 + (v % 3) * 0.5);
      if(uu >= 1) continue;
      /* la bouffée GROSSIT en montant : c'est ce gonflement, plus que
         l'opacité, qui distingue une fumée d'une tache posée */
      var rr = (13 + uu * 44 + v * 2.5) * Math.max(0.42, z);
      var mx = p.x + Math.sin(tps * 0.7 + v * 2.1) * 9 * z * uu
                   + ventJungle(tps) * 46 * uu * z;
      var my = p.y - (8 + uu * 92) * z;
      c.globalAlpha = (1 - uu) * (1 - uu) * 0.80 * queue * borne(age * 4, 0, 1);
      c.drawImage(sp, mx - rr, my - rr, rr * 2, rr * 2);
    }
    c.restore();
  }
}

/* ================================================================
   6. LE SON DE L'ORAGE
   Le contrat ne prévoyait pas de point d'entrée sonore ; on l'ajoute
   ici plutôt que de toucher à 95-son.js. Tout est synthétisé, comme
   le reste du jeu.

   ATTENTION À L'ORDRE : 95-son.js est assemblé APRÈS ce fichier-ci,
   donc `son` n'existe pas encore au moment où ces lignes s'exécutent.
   D'où des FONCTIONS libres et non des méthodes greffées sur `son` :
   elles ne le lisent qu'au moment de l'appel, quand il est là.
   ================================================================ */

/* LE TONNERRE. Un vrai coup de tonnerre n'est pas une explosion :
   c'est un CLAQUEMENT sec suivi d'un grondement qui roule et met
   plusieurs secondes à mourir. Et il arrive APRÈS l'éclair — ce
   retard est ce qui donne la distance. On le passe donc en argument :
   0 pour un impact sur la carte, une à trois secondes pour un
   roulement au loin. */
function tonnerreJungle(force, retard){
  if(typeof son === "undefined" || !son.ok()) return;
  force = force === undefined ? 1 : force;
  var ac = son.ac, t = ac.currentTime + (retard || 0);
  var duree = 2.2 + force * 2.6;

  /* le claquement : bruit large dans un passe-bas qui s'effondre */
  var s = ac.createBufferSource();
  s.buffer = son.bruit; s.loop = true;
  var f = ac.createBiquadFilter();
  f.type = "lowpass"; f.Q.value = 0.7;
  f.frequency.setValueAtTime(3200 * (0.4 + force * 0.7), t);
  f.frequency.exponentialRampToValueAtTime(70, t + duree);
  var g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.30 * force, t + 0.010);
  /* le palier à 0,30 s, puis la longue traîne : c'est CE roulement qui
     fait l'orage. Sans lui on n'a qu'un « boum » de plus, et le jeu en
     a déjà treize. */
  g.gain.exponentialRampToValueAtTime(0.10 * force, t + 0.30);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  s.connect(f); f.connect(g); g.connect(son.maitre);
  s.start(t); s.stop(t + duree + 0.1);

  /* le sub : la pression dans la poitrine */
  var o = ac.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(64 * (0.8 + force * 0.4), t);
  o.frequency.exponentialRampToValueAtTime(21, t + duree * 0.6);
  var g2 = ac.createGain();
  g2.gain.setValueAtTime(0.0001, t);
  g2.gain.linearRampToValueAtTime(0.26 * force, t + 0.02);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + duree * 0.75);
  o.connect(g2); g2.connect(son.maitre);
  o.start(t); o.stop(t + duree);
}

/* Le grondement lointain, entre deux impacts. Plus sourd, plus long,
   sans claquement : on ne l'écoute pas, on le remarque. */
function grondementJungle(){
  tonnerreJungle(0.30, 0.2 + Math.random() * 1.4);
}

/* LA GREFFE. 80-jeu.js appelle `son.foudre()` au moment de l'impact,
   et `son` n'existe pas encore quand ce fichier s'exécute. On greffe
   donc les quatre sons la première fois qu'une image d'orage est
   peinte : à cet instant `son` est là, et l'appel est idempotent.
   C'est le seul endroit du fichier qui touche à un objet qui n'est
   pas le mien, et c'est pour ne pas avoir à modifier 95-son.js. */
var metSonGreffe = false;
function greffeSonJungle(){
  if(metSonGreffe || typeof son === "undefined") return;
  metSonGreffe = true;
  /* Le coup de foudre. Aucun retard : l'impact est SUR la carte, on
     est dedans. C'est ce que 80-jeu.js appelle. */
  son.foudre = function(){ tonnerreJungle(1, 0.02); };
  son.tonnerreJungle = tonnerreJungle;
  son.grondementJungle = grondementJungle;
  son.vegetationJungle = froissementJungle;
}

/* Le froissement de la végétation sous une rafale. Une bouffée de
   bruit passe-bande, courte : c'est le seul son qui dit qu'il y a des
   feuilles autour, et non de la pluie sur du béton. */
function froissementJungle(force){
  if(typeof son === "undefined" || !son.ok()) return;
  son.souffle(2600 + Math.random() * 2400, 900, 0.5 + Math.random() * 0.7,
              0.030 * (force || 1));
}

/* ---------------------------------------------------------------
   L'AMBIANCE CONTINUE — pluie et vent, en boucle.
   Deux sources de bruit filtré, montées UNE fois et laissées tourner.
   Relancer une bouffée toutes les cent millisecondes coûterait cent
   fois plus cher et s'entendrait pomper.
   Le vent respire tout seul, sur un LFO branché sur son filtre :
   c'est l'ondulation qui fait le vent, un bruit constant ne fait
   qu'un ventilateur.
   --------------------------------------------------------------- */
var ambianceJungle = {
  noeuds:null,

  demarre:function(){
    if(this.noeuds || typeof son === "undefined" || !son.ok()) return;
    var ac = son.ac, t = ac.currentTime;
    var n = {};

    /* LA PLUIE. Le volume est volontairement très bas : un jeu où la
       pluie couvre les tirs est un jeu qu'on coupe au bout de deux
       minutes. Elle doit se remarquer quand on y pense, pas avant. */
    n.pluie = ac.createBufferSource();
    n.pluie.buffer = son.bruit; n.pluie.loop = true;
    var fp = ac.createBiquadFilter();
    fp.type = "highpass"; fp.frequency.value = 1900; fp.Q.value = 0.5;
    var fp2 = ac.createBiquadFilter();
    fp2.type = "lowpass"; fp2.frequency.value = 7200;
    n.gp = ac.createGain();
    n.gp.gain.setValueAtTime(0.0001, t);
    n.gp.gain.linearRampToValueAtTime(0.035, t + 2.5);
    n.pluie.connect(fp); fp.connect(fp2); fp2.connect(n.gp); n.gp.connect(son.maitre);
    n.pluie.start(t);

    /* LE VENT */
    n.vent = ac.createBufferSource();
    n.vent.buffer = son.bruit; n.vent.loop = true;
    var fv = ac.createBiquadFilter();
    fv.type = "bandpass"; fv.frequency.value = 420; fv.Q.value = 0.9;
    n.lfo = ac.createOscillator();
    n.lfo.type = "sine"; n.lfo.frequency.value = 0.07;
    var lg = ac.createGain(); lg.gain.value = 230;
    n.lfo.connect(lg); lg.connect(fv.frequency);
    n.gv = ac.createGain();
    n.gv.gain.setValueAtTime(0.0001, t);
    n.gv.gain.linearRampToValueAtTime(0.055, t + 3.5);
    n.vent.connect(fv); fv.connect(n.gv); n.gv.connect(son.maitre);
    n.vent.start(t); n.lfo.start(t);

    this.noeuds = n;
  },

  arrete:function(){
    var n = this.noeuds;
    if(!n || typeof son === "undefined" || !son.ok()) return;
    var t = son.ac.currentTime;
    /* on descend en une seconde : une ambiance qu'on coupe net
       s'entend comme une panne de courant */
    n.gp.gain.cancelScheduledValues(t);
    n.gv.gain.cancelScheduledValues(t);
    n.gp.gain.setValueAtTime(n.gp.gain.value, t);
    n.gv.gain.setValueAtTime(n.gv.gain.value, t);
    n.gp.gain.linearRampToValueAtTime(0.0001, t + 1.2);
    n.gv.gain.linearRampToValueAtTime(0.0001, t + 1.2);
    n.pluie.stop(t + 1.4); n.vent.stop(t + 1.4); n.lfo.stop(t + 1.4);
    this.noeuds = null;
  }
};

/* Le battement de l'ambiance, à appeler une fois par image sur la
   carte jungle. Il ne dessine rien : il déclenche les grondements
   lointains et les froissements de feuillage, en suivant EXACTEMENT
   la courbe des lueurs que le rendu peint dans le ciel — l'oreille et
   l'œil doivent parler du même orage, sans quoi le tonnerre n'est
   qu'une bande-son posée à côté. */
var metDernierRoulement = -1, metProchainFroisse = 0;
function majMeteoJungle(dt, tps){
  greffeSonJungle();
  if(typeof son === "undefined" || !son.ok()) return;
  ambianceJungle.demarre();
  var n = Math.floor(tps / 6.7);
  if(n !== metDernierRoulement && roulementJungle(tps) > 0.05){
    metDernierRoulement = n;
    grondementJungle();
  }
  metProchainFroisse -= dt;
  if(metProchainFroisse <= 0){
    metProchainFroisse = 2.5 + Math.random() * 5;
    froissementJungle(0.6 + ventJungle(tps));
  }
}
