/* ================================================================
   MILY DANS LA JUNGLE — LA MÉTÉO
   Un orage tropical permanent, et un impact de foudre toutes les
   QUINZE secondes. Quatre-vingts éclairs dans une partie de vingt
   minutes : c'est ce chiffre-là qui commande tout le fichier. Un effet
   qu'on subit quatre-vingts fois n'a pas le droit d'agresser, si
   spectaculaire soit-il. D'où trois règles que rien ne renégocie :

     1. le voile plein écran de l'éclair plafonne à 0,23 d'alpha et
        il est retombé sous 0,01 en 120 ms. Il a été BAISSÉ de 0,32 à
        0,23 le jour où la cadence a doublé : ce qu'on gagne en
        fréquence, on le rend en douceur ;
     2. la pluie NE FAIT PAS DE LIGNES. Le rideau de traits existe
        encore, mais réduit à une suggestion : c'est le SOL qui dit
        qu'il pleut. La règle vient du joueur, mot pour mot — « les
        lignes verticales […] en image, ce n'est pas très joli ;
        juste voir les gouttes au sol, c'est bien ». Sur une canopée
        hachée de troncs, un trait pâle presque vertical ne se lit pas
        comme de l'eau, il se lit comme une rayure sur l'image ;
     3. pluie + brume + nappe de ciel tiennent sous 2,6 ms par image,
        à plein écran, à toutes les images de la partie. Ce plafond
        était à 2 quand la pluie vivait dans l'AIR ; il a été relevé
        le jour où elle est descendue au sol, parce qu'un anneau
        d'éclaboussure est une courbe et qu'une courbe se paie plus
        cher qu'un trait. Ce qui n'a pas bougé, et c'est ce qui
        compte, ce sont les images par seconde de bout en bout,
        mesurées avant/après sur la carte complète en rendu logiciel :
        17 / 13 / 16 à z = 0,45 / 0,9 / 1,2, identiques.

   Les couches, dans l'ordre où le rendu doit les empiler. Toutes en
   repère ÉCRAN (repereEcran déjà fait) :

   SOUS les entités — ce qui se passe AU SOL :
     dessineCielOrage    la nappe d'ombres et de trouées de lumière
                         qui dérive avec les nuages, plus l'ombre
                         portée des petits nuages. C'est elle qui rend
                         l'île belle au dézoom, quand plus aucun
                         détail ne porte.
     dessineBrumeSol     une haleine pâle collée au sol, ancrée au
                         MONDE : elle suit la caméra, elle ne colle
                         pas à l'écran.

   PAR-DESSUS la carte — ce qui se passe DANS L'AIR :
     dessineNuagesJungle les quatre nuages de `jeu.nuages`. Ce sont eux
                         qui donnent la CAUSE : la foudre part de l'un
                         d'eux, jamais de nulle part. Ils APPARTIENNENT
                         au jeu (80-jeu.js les fait dériver et choisit
                         le point d'impact sous l'un d'eux) ; ce
                         fichier ne fait que les peindre.
     dessineVoileOrage   la lumière de l'air entre la caméra et la
                         carte : teinte d'orage, vignette, lueur des
                         roulements lointains.
     dessineLueursVegetation  les points chauds dans les feuillages.
     dessineEclairJungle l'événement, en cinq temps : le nuage
                         s'allume, l'éclair descend, il frappe, LE
                         COURANT SE DIFFUSE AU SOL, ça fume.
     dessinePluieJungle  un reste de rideau (écran) et, surtout, LES
                         ÉCLABOUSSURES (monde, elles marquent le sol).
                         C'est la seule couche dont le poids s'est
                         déplacé depuis l'écriture du fichier : la
                         pluie ne se voit plus tomber, elle se voit
                         ARRIVER — et elle arrive plus dru sous les
                         nuages, ce qui est la seule chose qui relie
                         encore le ciel à l'eau.

   Les deux couches d'AIR ont un filet de sécurité : si le rendu ne les
   appelle pas explicitement, dessineLueursVegetation puis
   dessinePluieJungle s'en chargent. Un garde-fou sur `tps` fait qu'on
   ne les peint jamais deux fois dans la même image.

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

   Ce que ça donne, mesuré couche par couche sur la carte jungle
   complète, canevas 1500×900, dpr 1, rendu logiciel (donc bien plus
   pessimiste qu'une tablette). DEUX colonnes par zoom, et l'écart
   entre les deux est l'essentiel du fichier : « pire » ramène les
   QUATRE nuages au-dessus de la caméra, ce qui n'arrive jamais en
   partie — les quatre masses couvrent cinq pour cent de l'île — ;
   « courant » les laisse dispersés, ce qu'on voit vraiment.

                              z=0,35      z=0,9      z=1,2
                            pire cour  pire cour  pire cour
     ciel : nappe + ombres  0,60 0,45  1,45 0,41  2,05 0,45
     brume au sol           0,38 0,35  0,41 0,41  0,49 0,49
     nuages : les 4 masses  0,42 0,14  1,76 0,01  1,81 0,01
     voile d'air + vignette 0,49 0,48  0,47 0,47  0,48 0,47
     lueurs de végétation   0,09 0,08  0,15 0,17  0,14 0,20
     pluie + éclaboussures  0,25 0,22  0,54 0,47  2,06 1,45
     ── brume + pluie       0,63 0,57  0,95 0,88  2,55 1,94
     ── total permanent     2,23 1,72  4,78 1,94  7,03 3,07
   Et, quatre images toutes les quinze secondes, l'éclair à son pic :
   3,3 / 4,0 / 4,3 ms.

   La ligne à surveiller est « pluie + éclaboussures » à z = 1,2 : les
   anneaux au sol y coûtent désormais plus que les trois couches de
   traits qu'ils remplacent. C'est le prix assumé du réglage demandé —
   et le gouverneur de résolution (97-boucle.js) reste derrière pour
   les appareils qui ne suivraient pas.
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
/* LA PENTE MOYENNE A ÉTÉ MONTÉE de 0,27 à 0,40, et c'est un correctif
   de lisibilité, pas un réglage de météo. À 0,27, une goutte descend
   de quatre pixels pour un de côté : sur un fond de troncs et de
   lianes verticaux, l'œil range ça avec les troncs et lit une RAYURE
   posée sur l'image. À 0,40 — vingt-deux degrés — plus rien sur la
   carte ne penche comme ça, et le même trait redevient de l'eau qui
   tombe de travers. C'est gratuit : la pente ne change ni le nombre de
   traits, ni leur longueur, ni un seul appel à stroke.
   Tout ce qui dérive s'y accroche — pluie, brume, fumée —, donc la
   carte entière prend le vent d'un coup, ce qui est exactement le but. */
function ventJungle(tps){
  return 0.40 + 0.17 * Math.sin(tps * 0.21) + 0.10 * Math.sin(tps * 0.53 + 1.7);
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
  /* ASSOMBRI À LA DEMANDE DU JOUEUR — « il y avait une ambiance […]
     un peu sombre, ça faisait un peu plus jungle ». Le voile monte de
     0,21 à 0,30 au centre et de 0,54 à 0,66 au bord. C'est la seule
     valeur de tout le jeu qui teinte AUSSI les troupes et les
     bâtiments, donc la seule qu'on ne monte qu'après l'avoir regardée
     en capture : au-delà de 0,32 au centre, les barres de vie
     commencent à se lire de travers. */
  var v = nouveauCanvas(lw, lh);
  var g = v.getContext("2d");
  var gr = g.createRadialGradient(lw / 2, lh * 0.54, lh * 0.10,
                                  lw / 2, lh * 0.54, lh * 0.95);
  gr.addColorStop(0, "rgba(6,26,23,0.30)");
  gr.addColorStop(0.50, "rgba(4,20,19,0.39)");
  gr.addColorStop(1, "rgba(1,7,8,0.66)");
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
    gr.addColorStop(0, "rgba(" + MET_FUMEE + ",0.58)");
    gr.addColorStop(0.5, "rgba(" + MET_FUMEE + ",0.28)");
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
/* CE RÉGLAGE A ÉTÉ FAIT DEUX FOIS, DANS LES DEUX SENS.
   Le cycle avait d'abord été ALLONGÉ de 6,7 à 9,5 s, et le tirage
   resserré, quand la foudre est passée à un impact toutes les quinze
   secondes : entre les vrais coups et les lueurs lointaines, le ciel
   finissait par gronder sans arrêt.
   Le joueur a tranché dans l'autre sens — « il y avait une ambiance
   avec plus de coups de tonnerre » — et sur la carte finie il a
   raison : un grondement toutes les vingt et une secondes, sous une
   canopée qui mange déjà le ciel, ne s'entend pas. On redescend donc à
   6,8 s avec un tirage plus large : un roulement toutes les douze
   secondes environ, qui s'intercale entre les impacts de foudre sans
   jamais tomber dessus.
   Ce qu'on NE touche pas, c'est EQ.JUNGLE_ECLAIR : la foudre TUE des
   troupes. Le tonnerre, lui, ne fait que du bruit et de la lumière —
   c'est exactement pour ça qu'on peut en donner plus. */
var MET_ROULEMENT = 6.8;
function roulementJungle(tps){
  var n = Math.floor(tps / MET_ROULEMENT);
  var f = bruitStable(n, 1);
  if(f < 0.42) return 0;                      // près de trois cycles sur cinq
  /* Le retard dans le cycle est tiré SUR LE CYCLE, pas sur une durée
     écrite en dur. La version à 9,5 s tirait jusqu'à 7,8 s ; en
     raccourcissant le cycle sans y toucher, tout roulement tiré au-delà
     de 6,1 s serait tombé dans le cycle suivant — c'est-à-dire jamais.
     Un tiers des grondements aurait disparu au moment précis où l'on
     en demandait davantage. */
  var d = tps - n * MET_ROULEMENT - (0.4 + bruitStable(n, 0) * (MET_ROULEMENT - 1.4));
  if(d < 0 || d > 0.7) return 0;
  /* deux claquements : un vrai éclair lointain se réamorce */
  return Math.exp(-d * 6.5) * (0.62 + 0.38 * Math.sin(d * 44)) * (0.35 + f * 0.65);
}

/* TOUT CE QUI SE PASSE AU SOL : la nappe d'ombres et de trouées de
   lumière, puis l'ombre portée des petits nuages. Appelée tôt, sous
   les entités — c'est de l'ombre sur la terre, elle n'a rien à faire
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
  /* Les ombres portées des petits nuages, par-dessus la nappe : c'est
     ce qui rattache les masses du ciel au sol qu'elles survolent.
     Sans elles, les nuages flottent comme des autocollants. */
  dessineOmbresNuages(c, tps);
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
  /* LES ROULEMENTS, tout en haut de l'écran. Montés de 0,16 à 0,26 en
     même temps que le ciel s'assombrissait : sur un fond plus noir, un
     voile à 0,16 ne se voyait plus du tout, et l'on entendait un
     tonnerre sans jamais voir ce qui l'avait fait. C'est le même
     rattrapage que la pluie — ce qu'on assombrit, il faut le rendre
     ailleurs. */
  var r = roulementJungle(tps);
  if(r > 0.015){
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = r * 0.26;
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
/* …ET ON EST REVENU EN ARRIÈRE, parce que la jungle n'est pas la
   plage. Le rideau avait été réglé sur une capture de sable, où un
   trait pâle se voit ; sur une canopée hachée de troncs, de lianes et
   de deux mille tourelles, les mêmes traits ne se lisent plus comme de
   la pluie mais comme des RAYURES verticales posées par-dessus
   l'image. Le joueur l'a dit sans détour : « les lignes verticales […]
   ce n'est pas très joli, juste voir les gouttes au sol, c'est bien. »
   Il a raison, et c'est même le meilleur réglage physiquement : une
   averse tropicale vue de trois quarts, on ne la voit pas tomber, on
   la voit ARRIVER. Le rideau redescend donc au rang de suggestion —
   traits raccourcis d'un tiers, opacité rendue de moitié sur la couche
   de tête, celle qui faisait les rayures — et toute la dépense passe
   dans les impacts au sol, quinze lignes plus bas.
   La PENTE, elle, monte (voir ventJungle) : ce qui reste de traits
   penche franchement, et un trait penché ne se lit jamais comme une
   rayure. */
var MET_COUCHES_PLUIE = [
  { n:98,  v:560,  len:10, ep:0.70, a:0.075, sway:14 },
  { n:104, v:800,  len:14, ep:0.90, a:0.095, sway:22 },
  { n:68,  v:1090, len:20, ep:1.15, a:0.115, sway:30 }
];

/* COMBIEN IL PLEUT À CET ENDROIT-LÀ : 1 à l'écart de tout nuage,
   jusqu'à 1,75 en plein dessous, avec un bord fondu. C'est ce seul
   nombre qui porte tout le « la pluie tombe DES nuages » : il commande
   à la fois combien de cases éclaboussent et la taille des anneaux.
   On compare des CARRÉS — une racine par case et par nuage
   n'apporterait rien à un dégradé qu'on ne regarde pas de près — et
   l'on divise dy par le rapport RY/RX, parce que la zone battue est
   couchée dans le plan de l'île comme l'ombre qui la surplombe. */
var metAvX = [], metAvY = [], metAvR = [];
function facteurAverse(x, y){
  var f = 1;
  for(var q = 0; q < metAvR.length; q++){
    var dx = (x - metAvX[q]) / metAvR[q];
    var dy = (y - metAvY[q]) / (metAvR[q] * RY / RX);
    var d2 = dx * dx + dy * dy;
    if(d2 < 2.25){
      var v = 1 + 0.75 * (1 - d2 / 2.25);
      if(v > f) f = v;
    }
  }
  return f;
}

function dessinePluieJungle(c, tps){
  /* filets de sécurité : voir dessineVoileOrage. La pluie tombe DANS
     l'air voilé et SOUS les nuages, donc les deux passent avant elle. */
  dessineVoileOrage(c, tps);
  dessineNuagesJungle(c, tps);
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

  /* ================================================================
     LES ÉCLABOUSSURES — c'est ICI que se voit la pluie, désormais.

     Ancrées au MONDE : elles marquent le sol, pas l'écran — sans ça
     elles glissent dès qu'on déplace la caméra et tout l'effet
     s'effondre. On ne les paie qu'au-dessus du zoom où on les
     distingue ; en dessous ce ne serait qu'un pointillé gris de plus
     par-dessus la carte.

     ET ELLES DISENT D'OÙ VIENT L'EAU. C'est la vraie réponse à « la
     pluie qui tombait des nuages, c'était mieux », et elle ne coûte
     pas un tracé de plus : au lieu de faire descendre une colonne
     d'eau du nuage jusqu'au sol — ce qui donnait précisément les
     lignes verticales dont le joueur ne voulait pas —, on regarde le
     SOL. Sous un nuage, il tombe deux fois plus de gouttes et elles
     frappent plus large ; à l'écart, c'est un crépitement. Le nuage
     dérive, la zone battue dérive avec lui, et l'on comprend d'un coup
     d'œil que c'est lui qui pleut — sans qu'un seul trait ait été
     tracé entre les deux.
     ================================================================ */
  /* LE SEUIL ET LE PAS ONT ÉTÉ RESSERRÉS EN MÊME TEMPS, parce que
     les impacts portent maintenant seuls ce que trois couches de
     traits portaient avant. Un pas de 128 px ne mettait qu'une
     trentaine d'anneaux à l'écran : de la bruine. À 100 il y en a une
     cinquantaine, et moitié plus sous un nuage — c'est une averse.
     Le pas suit le zoom, donc le nombre de cases parcourues est le
     même à tous les zooms, et l'on trace toujours QUATRE chemins.
     92 avait été essayé, et mesuré : 2,46 ms au zoom maximum avec les
     quatre nuages ramenés dans le champ, contre un plafond de 2 au
     contrat. Un cas de figure introuvable en partie — les quatre
     masses couvrent cinq pour cent de l'île —, mais un plafond n'est
     un plafond que si on le respecte dans le pire cas. À 100, et avec
     le renfort d'averse borné à 1,75 au lieu de 2, on repasse dessous
     sans qu'on voie la différence.
     Le seuil descend de 0,44 à 0,34 : au dézoom, l'orage doit se voir
     aussi quand on prend toute l'île dans l'écran — c'est même là
     qu'on voit le mieux la zone battue dériver avec sa masse. */
  if(z < 0.34) return;
  var g = bornesGrille(100, 70);
  var vis = borne((z - 0.34) * 4.5, 0, 1);
  /* Les nuages sont projetés UNE fois, hors des quatre passes : au
     zoom de jeu la grille compte une centaine de cases, et refaire
     quatre projections par case serait payer quatre cents fois un
     calcul qui ne change pas. Le rayon retenu est celui de l'ombre
     portée, MET_OMBRE_PART — la zone battue et l'ombre au sol sont le
     même endroit, et c'est ce qui les fait lire ensemble.
     Les trois tableaux sont des MODULES, réutilisés d'une image à
     l'autre : cette fonction tourne soixante fois par seconde, elle
     n'a pas le droit d'allouer. */
  metAvX.length = 0; metAvY.length = 0; metAvR.length = 0;
  var nu = nuagesDuJeu();
  if(nu) for(i = 0; i < nu.length; i++){
    var pn = versEcran(cam, nu[i].gx, nu[i].gy);
    metAvX.push(pn.x); metAvY.push(pn.y);
    metAvR.push(nu[i].r * RX * z * MET_OMBRE_PART * 1.25);
  }
  c.save();
  c.lineWidth = Math.max(0.8, 1.1 * z);
  /* QUATRE TRACÉS, PAS SOIXANTE. Au zoom de jeu il y a une soixantaine
     d'anneaux à l'écran, chacun avec sa propre opacité selon son âge.
     Les tracer un par un revenait à changer soixante fois le style, et
     chaque changement force le rasteriseur à vider son lot en cours —
     c'était plus cher que toute la pluie. On range donc les anneaux
     dans quatre paliers d'opacité et on ne trace que quatre chemins.
     Quatre paliers suffisent : entre le plus jeune et le plus vieux
     anneau il n'y a de toute façon qu'un tiers d'opacité d'écart.
     Le moveTo avant chaque ellipse n'est pas décoratif — sans lui,
     ellipse() relie le nouvel anneau au précédent par un trait. */
  /* L'opacité est passée de 0,34 à 0,62 : ce que le rideau a rendu,
     les impacts le prennent. C'est le même orage, lu au sol au lieu
     d'être lu dans l'air. */
  for(var pal = 0; pal < 4; pal++){
    c.strokeStyle = "rgba(" + MET_PLUIE + "," + (((pal + 0.5) / 4) * 0.62 * vis) + ")";
    c.beginPath();
    for(i = g.i0; i <= g.i1; i++){
      for(var j = g.j0; j <= g.j1; j++){
        var n0 = i * 131.7 + j * 37.3;
        var b2 = bruitStable(i * 57.1 - j * 91.9, 1);
        var ph = (tps * 1.55 + b2) % 1;
        var b0 = bruitStable(n0, 0), b1 = bruitStable(n0, 1);
        var x = ((i + b0) * g.pas) * z + cam.px;
        var y = ((j + b1) * g.pas) * z + cam.py;
        /* LE TEST DU CADRE VIENT AVANT LE RESTE : il écarte les trois
           quarts des cases pour deux comparaisons, alors que la
           mesure du nuage en coûte quatre. */
        if(x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
        var pl = facteurAverse(x, y);
        /* Deux cases sur cinq à l'écart, quatre sur cinq sous un
           nuage : c'est ce SEUIL, plus que la taille des anneaux, qui
           fait qu'on voit l'averse se déplacer avec la masse. */
        if(ph > 0.42 * pl) continue;
        var u = ph / (0.42 * pl);
        if((((1 - u) * 4) | 0) !== pal) continue;
        /* LE RAYON PLAFONNE À z = 1. La POSITION, elle, suit le zoom
           sans réserve — c'est ce qui colle l'anneau au sol. Mais sa
           TAILLE n'a pas à suivre : au zoom maximum, un anneau qui
           grandissait avec la caméra faisait trente pixels de large,
           et la carte se couvrait de gros ovales pâles, vus en
           capture. Une éclaboussure est petite ; passé un certain
           rapprochement, on ne la grossit plus, on en voit simplement
           davantage. Bénéfice au passage : c'est aussi ce qui fait
           repasser la couche sous son plafond de temps à z = 1,2. */
        var rr = (2.5 + u * 9) * Math.min(z, 1) * (0.72 + pl * 0.34);
        c.moveTo(x + rr, y);
        c.ellipse(x, y, rr, rr * 0.5, 0, 0, 6.2832);
      }
    }
    c.stroke();
  }
  c.restore();
}

/* ================================================================
   4. LES PETITES LUMIÈRES DE LA VÉGÉTATION
   Hors contrat, mais c'est la même couche de lumière : des points
   chauds accrochés au sol, qui respirent. Au dézoom, quand plus
   aucune feuille n'est lisible, ce sont eux qui disent qu'il y a de
   la vie sous la canopée. Coût dérisoire : des blits de quinze
   pixels de côté, mesurés à 0,12 ms la vingtaine.
   ================================================================ */
function dessineLueursVegetation(c, tps){
  /* C'est la PREMIÈRE des couches empilées par-dessus la carte, donc
     le meilleur endroit pour les filets de sécurité : ainsi l'éclair,
     qui vient ensuite, perce le voile au lieu d'être posé dessous, et
     il part d'un nuage déjà peint. Voir dessineVoileOrage et
     dessineNuagesJungle — les deux ont un garde-fou sur `tps`, donc
     un appel explicite du rendu les rend ici inopérants. */
  dessineVoileOrage(c, tps);
  dessineNuagesJungle(c, tps);
  var z = cam.z;
  if(z < 0.18) return;
  var g = bornesGrille(170, 60);
  /* UN SEUL save/restore ET UN SEUL changement de mode pour toutes les
     lueurs. lueurRapide fait un save + un globalCompositeOperation +
     un restore À CHAQUE appel : sur une vingtaine de points ça coûtait
     2,4 ms par image au banc, plus que toutes les autres couches
     réunies. Ce ne sont pas les pixels qui coûtent — il y en a
     quelques milliers — ce sont les changements d'état, qui forcent le
     rasteriseur à vider son lot en cours. */
  var chaud = disqueMeteo("255,224,138"), froid = disqueMeteo("168,255,190");
  c.save();
  c.globalCompositeOperation = "lighter";
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
      var r = (5 + b1 * 5) * Math.max(0.55, z);
      c.globalAlpha = p * 0.17;
      c.drawImage(b1 > 0.55 ? chaud : froid, x - r, y - 9 * z - r, r * 2, r * 2);
    }
  }
  c.restore();
}

/* ================================================================
   5. LES QUATRE NUAGES D'ORAGE
   Ils ne sont pas décoratifs : ils sont la CAUSE. Un éclair qui tombe
   d'un ciel vide n'est qu'un effet posé sur la carte ; le même éclair
   parti d'une masse qu'on regardait dériver vers ses troupes est une
   information, et une raison de bouger.

   ILS APPARTIENNENT AU JEU, PAS À CE FICHIER. `jeu.nuages` est tenu
   par 80-jeu.js : quatre nuages, leur dérive erratique, leur vitesse
   (le double d'une troupe) et le tirage du point d'impact sous l'un
   d'eux. Ce fichier ne fait que les PEINDRE. Une seconde liste tenue
   ici donnerait des nuages dessinés à un endroit et une foudre qui
   tombe à un autre — précisément le défaut que ces nuages existent
   pour corriger.

   Un nuage porte { gx, gy, r, cap, capBut, vire, v, ph } : position au
   sol, rayon en cases, cap, et un déphasage `ph` stable par nuage. Ce
   ph sert ici de graine — silhouette et respiration en sont tirées,
   donc identiques chez tous les joueurs sans qu'aucun champ de plus
   ait besoin de circuler sur le réseau.
   ================================================================ */
/* LE VENTRE, ET LA LEÇON QU'IL A COÛTÉE.
   Il a été éclairci une fois — 18,32,34 vers 44,60,66 — au motif,
   juste en soi, qu'on regarde ce nuage depuis le SOUS-BOIS et que le
   ciel, même bouché, reste plus clair qu'une canopée. La capture a
   tranché autrement : au zoom de jeu, une masse de cinq cents pixels
   de large peinte en pâle par-dessus la carte ne se lit pas comme un
   nuage, elle se lit comme un BANC DE BROUILLARD posé sur les arbres.
   Ce qui fait qu'un nuage se voit n'est pas sa clarté, c'est son
   BORD : la crête éclairée, en haut. On revient donc à un ventre
   sombre — à peine relevé, pour qu'il ne soit pas noir pur — et l'on
   règle la lisibilité là où elle se joue vraiment, dans l'opacité qui
   suit le zoom (voir dessineNuagesJungle). */
var MET_NUAGE_G   = "26,40,46";     // le ventre du nuage d orage, sombre
var MET_NUAGE_G_H = "176,198,188";  // sa crête, qui prend ce qui reste de jour
/* La hauteur de la couche, en unités locales — la même pour les
   quatre. Un ciel d'orage est une NAPPE : quatre nuages à quatre
   altitudes différentes se liraient comme quatre objets sans rapport.
   C'est aussi de cette hauteur que part la foudre.
   Elle a été essayée à 285 pour faire tenir le haut des masses dans le
   cadre au zoom de jeu. Mauvais calcul : un nuage plus bas recouvre
   d'autant plus le terrain qu'on est en train de regarder. On la
   remet à 340 et l'on rend la place autrement — en effaçant la masse
   quand on se rapproche. */
var MET_NUAGE_ALT = 340;

/* Quatre silhouettes pré-rendues. Un nuage dessiné en direct coûterait
   une vingtaine de dégradés par image et par nuage ; celui-ci coûte un
   seul blit. Le rapport 2:1 de la tuile est celui de la projection :
   un nuage vu de trois quarts est un objet couché.
   Ils ne sont que QUATRE sur toute l'île : chacun doit donc porter
   seul, et la tuile est deux fois plus fine qu'à douze — 512 px, pour
   qu'un nuage occupant huit cents pixels d'écran ne soit pas un
   agrandissement de trois fois. */
/* LE NUAGE DE BEAU TEMPS.
   Les cinq îles ordinaires n avaient AUCUN nuage : la création était
   conditionnee aux geysers, donc a la seule jungle, et leur ciel etait
   vide. Mais on ne peut pas y poser les memes : un nuage d orage a le
   ventre presque noir et un rideau de pluie qui pend dessous — au
   dessus d une plage ensoleillee, c est un contresens.
   Meme silhouette, donc, meme code, mais deux couleurs et pas de
   virga : le ventre gris clair garde un degrade lisible sous la crete
   blanche, et rien ne tombe de ce nuage-la. */
var MET_NUAGE_C   = "176,190,210";
var MET_NUAGE_C_H = "255,255,255";
var metSpNuages = null, metSpNuagesC = null;
function spritesNuage(clair){
  if(clair && metSpNuagesC) return metSpNuagesC;
  if(!clair && metSpNuages) return metSpNuages;
  var out = [];
  var MET_NUAGE   = clair ? MET_NUAGE_C   : MET_NUAGE_G;
  var MET_NUAGE_H = clair ? MET_NUAGE_C_H : MET_NUAGE_G_H;
  var db = disqueMeteo(MET_NUAGE), dh = disqueMeteo(MET_NUAGE_H);
  for(var v = 0; v < 4; v++){
    var cv = nouveauCanvas(512, 256);
    var g = cv.getContext("2d");
    var al = prng(0x4E51 + v * 977);
    var n = 13 + ((al() * 5) | 0), i;

    /* 1. LA MASSE. Des lobes très opaques qui se recouvrent largement :
       ce qu'on cherche, c'est une SILHOUETTE franche à bords mous, pas
       un brouillard. Le premier essai empilait des lobes translucides
       et donnait une nappe grise indistincte des ombres du sol. */
    for(i = 0; i < n; i++){
      var x = 74 + al() * 364, r = 62 + al() * 96;
      var y = 148 + (al() - 0.5) * 40;
      g.globalAlpha = 0.62 + al() * 0.38;
      g.drawImage(db, x - r, y - r * 0.62, r * 2, r * 1.24);
    }
    /* le dessous, plus lourd et plus déchiqueté : c'est le ventre d'un
       nuage de pluie, il pend */
    for(i = 0; i < 5; i++){
      var xb = 110 + al() * 292, rb = 40 + al() * 54;
      g.globalAlpha = 0.55 + al() * 0.35;
      g.drawImage(db, xb - rb, 176 + al() * 16 - rb * 0.5, rb * 2, rb * 0.9);
    }

    /* 2. LE LISERÉ DU DESSUS, fabriqué par SOUSTRACTION.
       C'est LE point de tout ce sprite, et les deux essais précédents
       s'y sont cassé les dents. Un nuage rendu par un dégradé clair
       vers le haut donne une nappe pâle qui, posée sur une jungle
       sombre, se lit comme de la brume — jamais comme un objet. Ce qui
       fait un objet, c'est un BORD.
       On recopie donc la masse sur un canevas à part, on lui SOUSTRAIT
       la même masse décalée de douze pixels vers le bas, et il ne
       reste que la bande du haut — le contour supérieur exact de la
       silhouette, épais et mou comme il faut. Peint en clair par
       dessus, c'est le dessus d'un nuage qui prend ce qui reste de
       jour, et la masse en dessous peut rester franchement noire. */
    var lis = nouveauCanvas(512, 256);
    var gl2 = lis.getContext("2d");
    gl2.drawImage(cv, 0, 0);
    gl2.globalCompositeOperation = "destination-out";
    gl2.drawImage(cv, 0, 12);
    gl2.globalCompositeOperation = "source-in";
    gl2.fillStyle = "rgba(" + MET_NUAGE_H + ",1)";
    gl2.fillRect(0, 0, 512, 256);

    /* un peu de jour AU-DESSUS de la ligne médiane, dans la silhouette
       et nulle part ailleurs : « source-atop » interdit à ce qu'on
       peint de déborder de ce qui est déjà là */
    g.globalCompositeOperation = "source-atop";
    g.globalAlpha = 1;
    var gl = g.createLinearGradient(0, 58, 0, 156);
    gl.addColorStop(0, "rgba(" + MET_NUAGE_H + ",0.26)");
    gl.addColorStop(1, "rgba(" + MET_NUAGE_H + ",0)");
    g.fillStyle = gl;
    g.fillRect(0, 0, 512, 256);
    /* quelques bosses éclairées : sans elles, le dessus est un dégradé
       trop propre et le nuage retombe à un objet lisse */
    for(i = 0; i < 6; i++){
      var x3 = 120 + al() * 272, r3 = 30 + al() * 44;
      g.globalAlpha = 0.11 + al() * 0.15;
      g.drawImage(dh, x3 - r3, 78 + (al() - 0.5) * 36 - r3 * 0.55, r3 * 2, r3 * 1.05);
    }
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 0.60;
    g.drawImage(lis, 0, 0);

    /* 3. LA VIRGA — le rideau de pluie qui pend sous le ventre. C'est
       la signature d'un nuage d'orage, et c'est ce qui relie la masse
       du ciel à la pluie qui tombe partout ailleurs. Elle DÉBORDE du
       nuage vers le bas : on repasse donc en source-over. */
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
    if(clair){ out.push(cv); continue; }   // rien ne pend sous un beau nuage
    /* LA VIRGA N'EST PLUS UN PEIGNE, C'EST UN VOILE — et c'est le
       joueur qui a tranché, devant l'image.

       Elle était faite de trente traits presque verticaux, à peine
       visibles (0,085 × l'opacité de la masse, soit cinq millièmes).
       En les épaississant pour qu'on voie enfin d'où vient l'eau, on a
       obtenu exactement ce qu'il ne fallait pas : « les lignes
       verticales, je ne sais pas comment ça se passe, mais en tout cas
       en image, ce n'est pas très joli. » Il a raison, et la raison
       est mécanique — au zoom de jeu le sprite est peint à l'échelle
       un, donc chaque trait de virga mesure sur l'écran ce qu'il
       mesure dans la tuile : quatre-vingts pixels de rayure sur une
       canopée déjà hachée de troncs.

       Un voile n'a pas ce défaut : il n'a AUCUN bord. On remplace donc
       les traits par une haleine pâle qui pend sous le ventre et
       s'éteint. On y lit la même chose — il tombe quelque chose de
       là-dessous — sans une seule ligne, et pour trois blits au lieu
       de trente lineTo.
       Trois DISQUES FONDUS, et non un fillRect en dégradé : un
       rectangle, si fondu soit-il vers le bas, garde deux bords NETS
       sur les côtés — et l'on aurait remplacé trente lignes verticales
       par deux, ce qui n'est pas un progrès. Un disque fondu n'a
       aucun bord, dans aucune direction. */
    var dp = disqueMeteo(MET_PLUIE);
    g.globalAlpha = 0.075;
    for(i = 0; i < 3; i++){
      var vx = 158 + i * 98, rw = 122, rh = 54;
      g.drawImage(dp, vx - rw, 198 - rh, rw * 2, rh * 2);
    }
    g.globalAlpha = 1;
    out.push(cv);
  }
  if(clair) metSpNuagesC = out; else metSpNuages = out;
  return out;
}

/* HALO ADDITIF, en ellipse et SANS LISSAGE.
   lueurRapide fait le même travail, mais elle agrandit son sprite de
   128 px avec le filtrage actif. Sur les petites lueurs c'est sans
   conséquence ; sur les grandes — le nuage qui s'allume avant l'éclair
   fait cinq cents pixels de rayon au zoom de jeu — l'agrandissement
   filtré coûtait à lui seul quatre millisecondes sur l'image du
   flash. Coupé, il en coûte moins d'une, et sur un dégradé aussi doux
   la différence ne se voit pas.
   L'ellipse, elle, n'est pas décorative : une lueur de nuage ou une
   flaque de lumière au sol sont COUCHÉES dans le plan de l'île, et
   une ellipse écrasée coûte au passage la moitié des pixels. */
function haloMeteo(c, x, y, rx, ry, coul, a){
  if(!(a > 0.004) || !(rx > 0.5)) return;
  c.save();
  c.globalCompositeOperation = "lighter";
  c.imageSmoothingEnabled = false;
  c.globalAlpha = Math.min(1, a);
  c.drawImage(disqueMeteo(coul), x - rx, y - ry, rx * 2, ry * 2);
  c.restore();
}

/* La liste du jeu, ou rien. On ne fabrique jamais de nuages ici. */
function nuagesDuJeu(){
  return (typeof jeu !== "undefined" && jeu && jeu.nuages) ? jeu.nuages : null;
}

/* L'OMBRE PORTÉE. Elle vit avec les ombres du sol, donc SOUS les
   entités : c'est de l'ombre sur la terre, elle n'a rien à faire
   par-dessus les troupes. Appelée depuis dessineCielOrage.
   Elle est franche — 0,30 — parce qu'elle a un travail à faire en
   plus d'être jolie : c'est elle qui dit AU SOL où le nuage passe, et
   donc où le joueur ne doit pas laisser ses troupes. */
/* Le PRIX de cette ombre est le seul sujet, et il tient dans une
   règle : c'est une SURFACE, et une surface se paie au pixel. Trois
   ombres au rayon du nuage, au zoom de jeu, c'est trois millions et
   demi de pixels fondus par image. Mesuré, sur les trois variantes
   possibles :
     remplissage en dégradé radial   6,0 ms
     disque fondu, lissage ACTIF     6,5 ms
     disque fondu, lissage COUPÉ     3,5 ms
     ellipse PLATE                   0,7 ms
   L'ellipse plate est dix fois moins chère mais son bord est net, et
   un bord net ne peut pas passer pour une ombre. On garde donc le
   disque fondu, et on paie la surface en la RÉDUISANT : l'ombre ne
   fait que les trois cinquièmes du rayon du nuage. C'est trois fois moins de
   pixels, c'est physiquement juste — le soleil n'est jamais tout à
   fait à la verticale — et l'opacité rendue compense la taille. */
var MET_OMBRE_PART = 0.60;
/* `a` : l'opacité. Sous l'orage elle est franche — 0,36 — parce
   qu'elle a un travail à faire : dire au sol où le nuage passe, donc
   où la foudre peut tomber. Sur une île ensoleillée elle ne prévient
   de rien, elle habite : un tiers de cette valeur suffit à donner du
   relief au ciel sans salir le sable. */
function dessineOmbresNuages(c, tps, a){
  var nu = nuagesDuJeu();
  if(!nu || !nu.length) return;
  var z = cam.z;
  var d = disqueMeteo(MET_OMBRE);
  c.save();
  c.imageSmoothingEnabled = false;
  c.globalAlpha = a || 0.36;
  for(var i = 0; i < nu.length; i++){
    var u = nu[i];
    var p = versEcran(cam, u.gx, u.gy);
    var souffle = MET_OMBRE_PART * (1 + Math.sin(tps * 0.21 + u.ph) * 0.05);
    var rx = u.r * RX * z * souffle, ry = u.r * RY * z * souffle;
    if(p.x + rx < 0 || p.x - rx > W || p.y + ry < 0 || p.y - ry > H) continue;
    c.drawImage(d, p.x - rx, p.y - ry, rx * 2, ry * 2);
  }
  c.restore();
}

/* LA MASSE, en l'air, par-dessus la carte.
   Deux précautions que le mouvement impose. Ces nuages vont VITE — le
   double d'une troupe, soit une traversée d'écran en une quinzaine de
   secondes — et tout défaut de rendu qui serait invisible sur un objet
   fixe se met à ramper sur un objet qui file.
     1. Lissage COUPÉ : la silhouette est agrandie, et un
        agrandissement filtré coûte cinq fois le prix (5,2 ms contre
        1,0 ms pour douze sprites, mesuré).
     2. …mais un agrandissement NON filtré rampe quand la destination
        bouge d'une fraction de pixel. On ARRONDIT donc la taille ET
        la position à l'entier : le rapport source/destination devient
        constant, chaque pixel de destination échantillonne toujours
        le même pixel de source, et le nuage se contente de translater.
        Sans cet arrondi, sa texture grouillait pendant qu'il avançait. */
var metNuagesDessin = -1;
/* `clair` : le ciel des cinq îles ordinaires. Même silhouette, mais
   plus haute — un beau nuage est loin, pas au-dessus de la tête — et
   plus transparente, parce qu'elle ne menace de rien. */
function dessineNuagesJungle(c, tps, clair){
  if(tps === metNuagesDessin) return;
  metNuagesDessin = tps;
  var nu = nuagesDuJeu();
  if(!nu || !nu.length) return;
  var z = cam.z, sp = spritesNuage(clair ? 1 : 0);
  var alt = MET_NUAGE_ALT * (clair ? 1.35 : 1);
  c.save();
  c.imageSmoothingEnabled = false;
  for(var i = 0; i < nu.length; i++){
    var u = nu[i];
    var p = versEcran(cam, u.gx, u.gy);
    /* respiration très lente, décalée par nuage : quatre masses qui
       enflent en même temps se lisent comme un seul objet répété */
    var souffle = 1 + Math.sin(tps * 0.17 + u.ph) * 0.055;
    var w = Math.round(u.r * RX * 1.85 * z * souffle);
    var hh = Math.round(w * 0.5);
    var x = Math.round(p.x - w / 2);
    var y = Math.round(p.y - alt * z - hh * 0.52);
    if(x > W || x + w < 0 || y > H || y + hh < 0) continue;
    /* L'OPACITÉ DE LA MASSE SUIT LE ZOOM, ET C'EST TOUT LE RÉGLAGE.
       Un nuage est un objet du CIEL : de loin il doit peser, de près
       il est au-dessus de la tête et n'a rien à faire en travers du
       combat. À une valeur fixe, il fallait choisir entre les deux —
       0,58 donnait un ciel vide au dézoom, 0,74 un brouillard sur le
       terrain au zoom de jeu. En la faisant descendre avec le zoom on
       a les deux : 0,80 quand on prend toute l'île dans l'écran, 0,58
       au zoom de jeu, 0,41 collé au sol, où seuls comptent les
       impacts au sol et l'ombre portée.
       Le beau temps garde sa valeur fixe : ses nuages sont plus hauts
       (× 1,35) et ne recouvrent jamais rien. */
    c.globalAlpha = clair ? 0.62 : borne(1.10 - z * 0.58, 0.38, 0.80);
    c.drawImage(sp[((u.ph * 3.1) | 0) & 3], x, y, w, hh);
  }
  c.restore();
}

/* ================================================================
   6. L'ÉCLAIR
   Le joueur a demandé « quelque chose de précis qui tape le sol » —
   pas un gros trait spectaculaire, un TRAIT NET. Le fichier a donc
   été retourné dans ce sens : le canal est deux fois plus fin qu'au
   premier jet, son zigzag s'annule aux deux bouts (il part du nuage,
   il arrive sur le point visé, il ne cherche jamais sa cible), et
   toute la dépense est passée dans ce qui vient APRÈS — la nappe de
   courant qui se diffuse au sol.
   ================================================================ */

/* La chronologie, en secondes depuis e.age = 0. Elle NE dépend PAS de
   e.duree : c'est la durée du coup de foudre lui-même, la même qu'on
   laisse la trace fumante deux secondes ou six. */
var EC_DESC = 0.11;      // le temps que l'éclair met à descendre
var EC_VIE  = 0.28;      // ce qu'il vit encore après avoir touché

/* ---------------------------------------------------------------
   LA NAPPE — CE QU'ON DESSINE EST CE QUI TUE
   Le dégât ne tombe pas d'un coup sur un disque : il se DIFFUSE. Le
   calcul appartient à 80-jeu.js, qui pose sur chaque éclair :
     e.cx, e.cy   le nuage d'où le coup est parti, figé au tir
     e.front      le rayon atteint par le courant, EN CASES
   On ne recalcule rien ici : on lit e.front. C'est la seule façon que
   le cercle qu'on voit et le cercle qui tue soient le même — s'ils
   divergeaient d'un dixième de case, le joueur perdrait des troupes
   hors du halo et n'y comprendrait rien.
   Le repli n'existe que pour les bancs d'essai, qui fabriquent des
   éclairs à la main sans passer par la boucle. */
function rayonFoudre(e){
  if(e.front !== undefined) return e.front;
  var R = (typeof EQ !== "undefined" && EQ.ECLAIR_RAYON_NAPPE) || 7.5;
  var D = (typeof EQ !== "undefined" && EQ.ECLAIR_NAPPE_DUREE) || 2.6;
  return Math.sqrt(borne(e.age / D, 0, 1)) * R;
}
function rayonMaxFoudre(){
  return (typeof EQ !== "undefined" && EQ.ECLAIR_RAYON_NAPPE) || 7.5;
}

/* L'intensité du canal. Un éclair ne s'éteint pas d'un coup : il se
   réamorce deux fois. Ces deux bosses sont ce qui distingue un éclair
   d'un trait blanc qu'on efface. */
function eclatEclair(t){
  if(t < 0) return 0;
  if(t < EC_DESC) return 0.20 + 0.42 * (t / EC_DESC);
  var u = t - EC_DESC;
  if(u > EC_VIE) return 0;
  return Math.min(1, Math.exp(-u * 11)
                   + Math.exp(-Math.abs(u - 0.076) * 52) * 0.50
                   + Math.exp(-Math.abs(u - 0.152) * 62) * 0.28);
}

/* LE VOILE PLEIN ÉCRAN — la valeur la plus surveillée du fichier.
   Elle a été BAISSÉE quand la cadence est passée de trente à quinze
   secondes : quatre-vingts flashs dans une partie de vingt minutes au
   lieu de quarante, il fallait rendre la moitié de ce qu'on avait
   pris. Halo 0,16 au point de chute, fond uniforme 0,07, soit 0,23 au
   maximum — contre 0,32 avant, et un plafond de 0,35 au contrat.
   La décroissance est une exponentielle de constante 38 ms : à 120 ms
   il reste 4 % du pic, c'est-à-dire rien. */
var EC_VOILE_HALO = 0.16;
var EC_VOILE_FOND = 0.07;
function voileEclair(t){
  if(t < 0) return 0;
  if(t < EC_DESC) return 0.045 * (t / EC_DESC);   // le nuage blanchit AVANT
  return Math.exp(-(t - EC_DESC) / 0.038);
}

/* Le TRAJET, en coordonnées normalisées : x est un écart latéral en
   fraction de la hauteur de chute, y va de 0 (le nuage) à 1 (le sol).
   Construit UNE fois par impact et rangé sur l'objet : la caméra peut
   se déplacer, zoomer, dézoomer, l'éclair garde exactement la même
   forme. Un éclair retiré au hasard à chaque image grésille, et le
   grésillement est précisément ce qui rend un effet fatigant. */
function trajetFoudre(graine){
  var al = prng(graine || 7);
  var N = 17;
  var p = [0, 0];
  for(var k = 1; k <= N; k++){
    var f = k / N;
    /* Le zigzag s'annule AUX DEUX BOUTS. Au premier jet il partait
       d'un grand écart latéral qui se résorbait en descendant : ça
       faisait un éclair qui « cherchait » sa cible, exactement le
       contraire de la précision demandée. Une cloche de sinus donne
       un canal qui sort droit du nuage et arrive droit sur le point. */
    var amp = 0.045 * Math.sin(f * Math.PI);
    p.push((al() - 0.5) * 2 * amp);
    p.push(f + (al() - 0.5) * 0.018);
  }
  p[p.length - 2] = 0; p[p.length - 1] = 1;
  /* Les ramifications partent vers le bas et vers l'extérieur, et
     meurent en l'air. Une branche qui toucherait le sol ferait deux
     impacts : il n'y en a qu'un, et c'est celui que le joueur doit
     regarder. Deux seulement, et courtes — au-delà, le canal cesse
     d'être « précis » et redevient un buisson. */
  var br = [];
  for(var b = 0; b < 2; b++){
    var d0 = 3 + ((al() * 8) | 0);
    if(d0 * 2 + 1 >= p.length) continue;
    var bx = p[d0 * 2], by = p[d0 * 2 + 1];
    var sens = al() < 0.5 ? -1 : 1;
    var q = [bx, by];
    var nb = 2 + ((al() * 3) | 0);
    for(var m = 1; m <= nb; m++){
      bx += sens * (0.022 + al() * 0.048);
      by += 0.020 + al() * 0.042;
      q.push(bx); q.push(Math.min(1, by));
    }
    br.push(q);
  }
  return { p:p, n:N + 1, br:br };
}

/* Quatre passes, de la plus large à la plus fine — le procédé des
   rayons de Mily (74-vengeance.js). En additif, c'est la PROPORTION
   qui fait tout : un noyau blanc trop épais et l'éclair devient une
   barre fluo. Le halo bleu a été RESSERRÉ (4,6 → 2,9 fois la largeur)
   pour obtenir le trait net demandé : ce qu'on enlève en étalement,
   on le rend en opacité, si bien que l'éclair reste aussi visible
   tout en étant deux fois moins gros. */
var PASSES_FOUDRE = [
  { l:2.9,  col:MET_E_HALO, a:0.26 },
  { l:1.55, col:MET_E_BLEU, a:0.40 },
  { l:0.70, col:MET_E_PALE, a:0.62 },
  { l:0.28, col:MET_E_VIF,  a:0.97 }
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

/* ---------------------------------------------------------------
   LA NAPPE — le dégât qui se diffuse au sol.
   Trois choses, et l'ordre compte : la flaque déjà parcourue (faible,
   elle dit où le courant EST passé), le front qui avance (vif, c'est
   lui qu'on regarde), et les filaments (c'est eux qui font
   « électrique » plutôt qu'« onde de choc »).
   Les filaments grésillent sur place — c'est le seul endroit du
   fichier où le grésillement est voulu, parce que c'est ce que fait
   un arc électrique. Ils restent déterministes : le tremblement vient
   de sinus de tps, jamais de Math.random.
   --------------------------------------------------------------- */
function dessineNappeFoudre(c, e, ti, tps){
  var R = rayonFoudre(e);
  /* `u` mesure l'AVANCEMENT, pas le temps : c'est le rayon atteint
     rapporté au rayon final. En le tirant du front plutôt que de
     l'horloge, l'extinction reste calée sur la nappe même si la boucle
     change un jour sa loi d'expansion. */
  var u = borne(R / rayonMaxFoudre(), 0, 1);
  if(u >= 1 || R <= 0.02) return;
  var z = cam.z;
  var p = versEcran(cam, e.gx, e.gy);
  var rx = R * RX * z, ry = R * RY * z;
  if(p.x + rx < 0 || p.x - rx > W || p.y + ry < 0 || p.y - ry > H) return;
  /* elle s'éteint en s'élargissant : l'énergie se dilue */
  var vie = (1 - u) * (1 - u);
  var gr = ((e.gx * 977 + e.gy * 31) | 0);

  c.save();
  c.globalCompositeOperation = "lighter";
  /* un plancher sur la flaque : cette nappe TUE, et le joueur doit
     voir jusqu'où elle est allée même à la fin de sa course */
  c.fillStyle = "rgba(" + MET_E_HALO + "," + (0.09 + 0.14 * vie) + ")";
  c.beginPath(); c.ellipse(p.x, p.y, rx, ry, 0, 0, 6.2832); c.fill();

  /* Le front s'éteint en fin de course, mais PAS trop vite : au
     premier réglage il portait un (1-u) de trop et la nappe avait
     disparu à mi-parcours, alors qu'elle tuait encore. Ce qu'on voit
     et ce qui tue doivent durer aussi longtemps l'un que l'autre. */
  c.strokeStyle = "rgba(" + MET_E_PALE + "," + (0.30 + 0.60 * vie) * (1 - u * 0.55) + ")";
  c.lineWidth = Math.max(1.4, 4.6 * z * (1 - u * 0.5));
  c.beginPath(); c.ellipse(p.x, p.y, rx, ry, 0, 0, 6.2832); c.stroke();

  /* Les dix filaments sont tracés en DEUX passes seulement, chacune un
     unique beginPath/stroke : vingt polylignes coûteraient vingt
     appels à stroke, et c'est stroke qui coûte, pas les pixels. */
  var k, s;
  for(var q = 0; q < 2; q++){
    c.strokeStyle = q ? "rgba(" + MET_E_PALE + "," + (0.24 + 0.44 * vie) + ")"
                      : "rgba(" + MET_E_BLEU + "," + (0.10 + 0.20 * vie) + ")";
    c.lineWidth = q ? Math.max(1.1, 1.8 * z) : Math.max(2.2, 5.4 * z);
    c.beginPath();
    for(k = 0; k < 10; k++){
      var a0 = k / 10 * 6.2832 + bruitStable(gr + k, 0) * 0.62;
      c.moveTo(p.x, p.y);
      for(s = 1; s <= 4; s++){
        var fr = R * s / 4;
        var a = a0 + Math.sin(tps * 11 + k * 2.1 + s * 1.7) * 0.17 * s * 0.25;
        c.lineTo(p.x + Math.cos(a) * fr * RX * z, p.y + Math.sin(a) * fr * RY * z);
      }
    }
    c.stroke();
  }
  c.restore();
}

/* Tableaux réutilisés : projeter le trajet ne doit rien allouer. */
var metXs = [], metYs = [];

function dessineEclairJungle(c, e, tps){
  var t = e.age;
  var z = cam.z;
  /* Fondu de queue : la fumée et la braise s'éteignent AVEC e.duree,
     jamais d'un coup. */
  var queue = borne((e.duree - t) / 0.7, 0, 1);
  if(queue <= 0) return;

  var p = versEcran(cam, e.gx, e.gy);
  if(!e.trace) e.trace = trajetFoudre(((e.gx * 9377 + e.gy * 613) | 0) ^ 0x5b3);
  var tr = e.trace;
  var I = eclatEclair(t);
  var vo = voileEclair(t);
  var k;

  /* ---- 1 & 2. LE NUAGE S'ALLUME, PUIS L'ÉCLAIR DESCEND ---- */
  /* L'ORIGINE. On la cherche une fois, et on garde le NUAGE, pas sa
     position : il dérive pendant les deux secondes que dure l'effet,
     et le pied de l'éclair doit rester accroché à lui. Sans nuage
     (liste vide), on retombe sur le haut de l'écran — l'éclair
     traverse alors tout le cadre, ce qui reste correct. */
  var ox, oy;
  if(e.cx !== undefined){
    /* 80-jeu.js a figé, au moment du tir, le nuage d'où le coup part.
       On le lit tel quel : le nuage continue de dériver pendant que
       l'éclair tombe, mais le canal, lui, reste accroché à l'endroit
       d'où il est parti. C'est ce que fait la nature, et c'est surtout
       ce qui garantit que le pied du trait tombe pile sur le point que
       la boucle a choisi de foudroyer. */
    var pn = versEcran(cam, e.cx, e.cy);
    ox = pn.x; oy = pn.y - MET_NUAGE_ALT * z;
  }else{
    /* Pas de nuage d'origine (banc d'essai) : l'éclair descend de la
       couche de nuages à la verticale du point. */
    ox = p.x; oy = Math.min(p.y - 90, -Math.max(60, H * 0.10));
  }
  var haut = p.y - oy;

  if(I > 0.004 && haut > 40){
    /* L'ANNONCE. Au premier jet c'était un dégradé sur toute la
       largeur de l'écran ; maintenant qu'il y a un nuage, c'est LUI
       qui s'allume. C'est plus précis, plus joli, moins cher, et ça
       dit au joueur d'où le coup va partir. */
    var pre = borne(t / EC_DESC, 0, 1);
    if(t < EC_DESC + 0.09 && e.cx !== undefined){
      var rg = Math.max(70, 12 * RX * z);
      haloMeteo(c, ox, oy + 14 * z, rg, rg * 0.55, "207,224,255",
                0.62 * pre * (t < EC_DESC ? 1 : 1 - (t - EC_DESC) / 0.09));
    }

    /* La largeur ne suit PAS le zoom : un éclair est de la lumière
       dans l'air, il est aussi gros de près que de loin. Elle a été
       divisée par deux par rapport au premier jet — « pas trop large,
       quelque chose de précis ». */
    var larg = 1.3 + 3.1 * I;
    var f = t < EC_DESC ? t / EC_DESC : 1;
    var nb = Math.max(2, Math.min(tr.n, Math.ceil(f * tr.n)));

    c.save();
    c.globalCompositeOperation = "lighter";
    for(k = 0; k < nb; k++){
      var fy = tr.p[k * 2 + 1];
      metXs[k] = ox + (p.x - ox) * fy + tr.p[k * 2] * haut;
      metYs[k] = oy + haut * fy;
    }
    /* le dernier point est interpolé, sinon l'éclair descend par
       marches de sept pixels et on voit la construction */
    if(nb < tr.n){
      var av = (nb - 1) * 2, ap = nb * 2;
      var y0 = tr.p[av + 1], y1 = tr.p[ap + 1];
      var g0 = borne((f - y0) / Math.max(0.0001, y1 - y0), 0, 1);
      var yy = y0 + (y1 - y0) * g0;
      metXs[nb] = ox + (p.x - ox) * yy + (tr.p[av] + (tr.p[ap] - tr.p[av]) * g0) * haut;
      metYs[nb] = oy + haut * yy;
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
        var fb = q[s * 2 + 1];
        metXs[s] = ox + (p.x - ox) * fb + q[s * 2] * haut;
        metYs[s] = oy + haut * fb;
      }
      traitFoudre(c, metXs, metYs, m, larg * 0.5, I * 0.66);
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
    c.globalAlpha = vo * EC_VOILE_HALO;
    c.drawImage(ha, Math.round((p.x + secX) * dpr - ha.width / 2),
                    Math.round((p.y + secY) * dpr - ha.height / 2));
    /* le fond uniforme, faible : sans lui, le halo se lirait comme un
       projecteur braqué sur un coin de la carte */
    c.globalAlpha = 1;
    c.fillStyle = "rgba(" + MET_FLASH + "," + (vo * EC_VOILE_FOND) + ")";
    c.fillRect(0, 0, c.canvas.width, c.canvas.height);
    c.restore();
  }

  /* ---- 3. L'IMPACT AU SOL, PUIS LA NAPPE ---- */
  var ti = t - EC_DESC;
  if(ti < 0) return;

  dessineNappeFoudre(c, e, ti, tps);

  c.save();
  /* Le cœur blanc. C'est LUI qui donne la violence du coup, et il ne
     coûte rien au confort : il est local, il n'aplatit pas l'écran
     comme le ferait un voile. Quand on veut qu'un éclair frappe plus
     fort, c'est ce chiffre-là qu'on monte, jamais celui du voile. */
  var ec = Math.exp(-ti * 10);
  if(ec > 0.01){
    var rc = (40 + 92 * z) * (0.55 + ec * 1.0);
    haloMeteo(c, p.x, p.y - 8 * z, rc, rc * 0.78, "230,240,255", 0.90 * ec);
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
    var brz = queue * Math.exp(-ti * 0.9) * (0.72 + 0.28 * Math.sin(tps * 6.3 + e.gx));
    haloMeteo(c, p.x, p.y, RX * z * 0.72, RY * z * 0.72, MET_BRAISE, 0.40 * brz);
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
      var uu2 = ti / du;
      var ex = p.x + Math.cos(ang) * vit * ti * z;
      var ey = p.y + Math.sin(ang) * vit * 0.5 * ti * z + (vy * ti + 340 * ti * ti) * z;
      /* elles refroidissent : blanches au départ, orange à la fin */
      c.strokeStyle = "rgba(" + (uu2 < 0.35 ? MET_E_PALE : MET_ETINC) + ","
                    + ((1 - uu2) * (1 - uu2) * 0.95) + ")";
      /* plancher d'un pixel et demi : au dézoom, une étincelle plus
         fine qu'un pixel s'efface complètement au lieu de pâlir */
      c.lineWidth = Math.max(1.5, 2.4 * z * (1 - uu2));
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
    /* lissage COUPÉ : ces six bouffées sont agrandies de 96 à
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
   7. LE SON DE L'ORAGE
   Le contrat ne prévoyait pas de point d'entrée sonore ; on l'ajoute
   ici plutôt que de toucher à 95-son.js. Tout est synthétisé, comme
   le reste du jeu.

   ATTENTION À L'ORDRE : 95-son.js est assemblé APRÈS ce fichier-ci,
   donc `son` n'existe pas encore au moment où ces lignes s'exécutent.
   D'où des FONCTIONS libres et non des méthodes greffées sur `son` :
   elles ne le lisent qu'au moment de l'appel, quand il est là.
   ================================================================ */

/* LE TONNERRE, deuxième version — le joueur trouvait le premier trop
   discret, et il avait raison : c'était un « boum » filtré de plus, et
   le jeu en a déjà treize.
   Ce qui fait un GRAND tonnerre ne se règle pas au volume. Un son
   qu'on monte devient fatigant en trois minutes ; un son qu'on
   ALLONGE et qu'on CREUSE devient un ciel. Trois choses, donc, et
   c'est leur superposition qui fait la masse :

     1. LE CLAQUEMENT — court, large, et déjà sourd : l'air a mangé les
        aigus en route, un tonnerre n'a presque pas d'aigus.
     2. LE CORPS QUI ROULE — un second bruit, très bas, dont le gain
        ONDULE sur un oscillateur lent. C'est cette ondulation qu'on
        entend comme un roulement ; sans elle il ne reste qu'un souffle
        qui décroît, et un souffle qui décroît n'est pas un orage.
     3. LE SUB — deux sinus voisins (31 et 44 Hz) qui battent l'un
        contre l'autre. Le battement fait respirer la basse, et c'est
        lui qui donne la sensation de MASSE au-dessus de la tête.

   Six secondes pour un impact proche, dont cinq APRÈS le claquement.
   C'est la traîne qui fait peur, pas l'attaque.
   Le retard est ce qui donne la distance : 0 pour un impact sur la
   carte, une à trois secondes pour un roulement au loin. */
function tonnerreJungle(force, retard){
  if(typeof son === "undefined" || !son.ok()) return;
  force = force === undefined ? 1 : force;
  var ac = son.ac, t = ac.currentTime + (retard || 0);
  var duree = 3.2 + force * 3.2;

  /* --- 1. LE CLAQUEMENT --- */
  var s = ac.createBufferSource();
  s.buffer = son.bruit; s.loop = true;
  var f = ac.createBiquadFilter();
  f.type = "lowpass"; f.Q.value = 1.6;      // un peu de résonance : ça « craque »
  f.frequency.setValueAtTime(2600 * (0.35 + force * 0.75), t);
  f.frequency.exponentialRampToValueAtTime(160, t + 0.9);
  f.frequency.exponentialRampToValueAtTime(58, t + duree);
  var g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.30 * force, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.11 * force, t + 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  s.connect(f); f.connect(g); g.connect(son.maitre);
  s.start(t); s.stop(t + duree + 0.1);

  /* --- 2. LE CORPS QUI ROULE --- */
  var s2 = ac.createBufferSource();
  s2.buffer = son.bruit; s2.loop = true;
  s2.playbackRate.value = 0.55;              // le bruit lui-même descend d'une octave
  var f2 = ac.createBiquadFilter();
  f2.type = "lowpass"; f2.Q.value = 3.2;
  f2.frequency.setValueAtTime(420, t);
  f2.frequency.exponentialRampToValueAtTime(90, t + duree);
  var g2 = ac.createGain();
  g2.gain.setValueAtTime(0.0001, t);
  g2.gain.linearRampToValueAtTime(0.20 * force, t + 0.28);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  /* l'ondulation : deux fréquences non harmoniques, pour que le
     roulement ne batte jamais deux fois pareil */
  var lfo = ac.createOscillator();
  lfo.type = "sine"; lfo.frequency.value = 1.7;
  var lg = ac.createGain(); lg.gain.value = 0.11 * force;
  var lfo2 = ac.createOscillator();
  lfo2.type = "sine"; lfo2.frequency.value = 0.63;
  var lg2 = ac.createGain(); lg2.gain.value = 0.07 * force;
  lfo.connect(lg); lg.connect(g2.gain);
  lfo2.connect(lg2); lg2.connect(g2.gain);
  s2.connect(f2); f2.connect(g2); g2.connect(son.maitre);
  s2.start(t); s2.stop(t + duree + 0.1);
  lfo.start(t); lfo.stop(t + duree + 0.1);
  lfo2.start(t); lfo2.stop(t + duree + 0.1);

  /* --- 3. LE SUB, EN BATTEMENT --- */
  for(var i = 0; i < 2; i++){
    var o = ac.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime((i ? 44 : 31) * (0.9 + force * 0.25), t);
    o.frequency.exponentialRampToValueAtTime(i ? 26 : 19, t + duree * 0.8);
    var go = ac.createGain();
    go.gain.setValueAtTime(0.0001, t);
    go.gain.linearRampToValueAtTime((i ? 0.10 : 0.17) * force, t + 0.05);
    go.gain.exponentialRampToValueAtTime(0.0001, t + duree * 0.85);
    o.connect(go); go.connect(son.maitre);
    o.start(t); o.stop(t + duree);
  }
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
  var n = Math.floor(tps / MET_ROULEMENT);
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
