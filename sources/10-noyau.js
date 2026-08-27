/*==NOYAU_DEBUT==*/
/* ================================================================
   MILY BOUM — NOYAU
   Tout ce qui est ici est du calcul pur : aucune référence au DOM,
   au canevas ni à Math.random. C'est ce bloc que les tests Node
   extraient du fichier et exécutent tel quel.
   ================================================================ */

/* Version du jeu — une seule définition, affichée en haut à droite et
   dans le pied du briefing. Elle monte d'un centième à chaque mise en
   ligne : v0.01, v0.02, v0.03… */
var VERSION = "v0.15";

/* ----------------------------------------------------------------
   ÉQUILIBRAGE — toutes les constantes réglables sont ici.
   ---------------------------------------------------------------- */
var EQ = {
  /* Économie — l'Énergie tactique alimente les capacités.
     Revue à la hausse : le jeu est plus vivant quand on peut relancer
     régulièrement Brouillard, Balise, Cryo, Soin, Salve, Viper et
     Poulets, sans pour autant que ce soit gratuit. */
  ENERGIE_DEPART       : 220,   // énergie au début de chaque carte
  ENERGIE_PAR_BATIMENT : 5,     // gain par bâtiment détruit
  ENERGIE_PAR_CELLULE  : 9,     // gain par cellule énergétique récoltée
  ENERGIE_PAR_CREATURE : 2,     // gain par créature abattue
  ENERGIE_BONUS_RENFORT: 90,    // bonus quand la flotte revient après la mort

  /* Nova : une seule charge par vie, jamais cumulable */
  NOVA_PAR_VIE         : 1,

  /* Débarquement */
  NB_BARGES            : 8,
  /* Plafond absolu d'une navette. La capacité réelle dépend du type
     embarqué (UNI[t].places) : une Meuf et son gros fusil tiennent
     moins nombreuses qu'un Mec. */
  PLACES_PAR_BARGE     : 15,

  /* Mort / renaissance */
  ATTENTE_RENFORT      : 15,    // secondes

  /* QG */
  QG_ERUPTION_MIN      : 7.0,   // secondes entre deux éruptions
  QG_ERUPTION_MAX      : 11.0,
  QG_TELEGRAPHE        : 1.4,   // préavis en secondes
  QG_SEUIL_FRENESIE    : 0.30,  // sous 30 % de vie
  QG_GAIN_FRENESIE     : 0.60,  // +60 % de cadence
  QG_PLUIE_MIN         : 22,    // boules de feu
  QG_PLUIE_MAX         : 32,
  QG_PLUIE_RAYON       : 21,    // cases
  QG_FLAQUE_DUREE      : 5.0,
  QG_FLAQUE_DPS        : 26,
  QG_VAGUE_PORTEE      : 24,    // cases
  QG_VAGUE_VITESSE     : 8.5,   // cases/s
  QG_VAGUE_DEGATS      : 62,

  /* LA VENGEANCE DE MILY. Une seule règle de conception :
     la peine tombe TOUJOURS, quelle que soit la distance, et elle ne
     tue jamais. Un joueur qui perd 90 % de sa barge la ramène ; un
     joueur dont la barge est effacée ferme l'onglet. */
  VENG_MESSAGE         : 3.6,   // le message et la charge des yeux
  VENG_TIR             : 1.50,  // les deux rayons balaient le sol
  VENG_RETRAIT         : 1.10,  // extinction
  VENG_PERTE           : 0.90,  // 90 % des PV, jamais la mort
  VENG_RAYON           : 2.6,   // rayon de l'impact, en cases
  VENG_LARGEUR         : 1.7,   // demi-largeur d'une traînée
  VENG_TRAINEE         : 15,    // longueur des traînées, en cases
  VENG_ECART           : 0.17,  // demi-angle du V des deux rayons, en radians
  /* Les braises qui restent ne sont PAS un second châtiment : à
     90 % de PV perdus, une troupe finit à onze points de vie, et un
     brasier à trente dégâts par seconde la tuerait sans qu'elle ait
     eu sa chance. Neuf, c'est assez pour qu'il faille dégager, pas
     assez pour que rester une seconde de trop soit fatal. */
  VENG_BRAISE_DUREE    : 5.0,   // les traînées continuent de brûler
  VENG_BRAISE_DPS      : 9,

  /* LA CARTE ÉVÉNEMENT. Le minimum de joueurs est un DÉFAUT : il vit
     dans l'instantané partagé et se règle depuis le panneau
     administrateur, donc c'est la valeur du salon qui fait foi.
     Celle-ci ne sert qu'au tout premier salon, avant tout réglage. */
  JUNGLE_MIN_JOUEURS   : 7,
  JUNGLE_ATTENTE_H     : 48,    // heures de verrou après une victoire
  JUNGLE_ECLAIR        : 15,    // secondes entre deux impacts de foudre
  JUNGLE_GEYSERS       : 22,    // ouvertures de feu sur l'île
  /* LE DURCISSEMENT DE LA CARTE ÉVÉNEMENT.
     Les défenses de la jungle sont plus dures et frappent plus fort
     que partout ailleurs — mais le Brasier, lui, garde EXACTEMENT sa
     vie : c'est une carte plus défendue, pas une carte plus longue.
     Le bonus de PV vit dans l'instantané partagé et se règle depuis
     le panneau administrateur ; celui-ci n'est que son défaut. */
  JUNGLE_PV_BONUS      : 100,   // % de PV en plus sur les défenses
  JUNGLE_DEG_BONUS     : 50,    // % de dégâts en plus sur les défenses
  /* La foudre de la jungle : elle TUE net ce qu'elle touche, puis le
     courant court sur la terre mouillée en s'élargissant. */
  ECLAIR_RAYON_TUE     : 1.6,   // cases — au point d'impact, c'est mortel
  ECLAIR_RAYON_NAPPE   : 7.5,   // cases — jusqu'où le courant se diffuse
  ECLAIR_NAPPE_DUREE   : 2.6,   // secondes d'expansion
  ECLAIR_NAPPE_DEGATS  : 260,   // dégâts au passage du front
  /* La vitesse des nuages : le DOUBLE de celle d'une troupe. La Meuf
     avance à 1,62 case par seconde ; l'orage à 3,24. On ne distance
     donc pas un nuage — on ne peut que sortir de son chemin, et c'est
     ce qui en fait une menace plutôt qu'un décor. */
  NUAGE_VITESSE        : 3.24,

  /* Réglages fins demandés */
  MITRA_SEUIL_PRECISION: 4.2,   // au-delà, la crible rate
  MITRA_CHANCE_LOIN    : 1 / 3, // une balle sur trois touche
  BRULURE_DPS          : 14,
  BRULURE_DUREE        : 3.0,

  /* Réseau */
  PERIODE_ETAT         : 420,   // ms entre deux messages d'état
  UNITES_DIFFUSEES     : 20,    // unités échantillonnées par joueur
  PERIODE_PING         : 20000, // ms

  /* Balise */
  BALISE_RAYON         : 1.1,   // tolérance d'arrivée sur le point de ralliement

  /* Formation et dispersion des troupes
     Le groupe doit occuper environ 80 % de la surface d'un Brouillard :
     un disque de 80 % de surface a un rayon de sqrt(0,8) ≈ 0,894 fois
     celui du Brouillard. Le reste du calibrage (l'entraxe entre deux
     soldats) tombe tout seul, cf. ancreFormation() et separeUnites(). */
  FORMATION_PART_SURFACE: 0.80, // part du cercle de Brouillard occupée
  FORMATION_EFFECTIF    : 128,  // effectif de référence de la spirale
  SEPARATION_MAILLE     : 0.9,  // maille de la grille de répulsion, en cases
  SEPARATION_VITESSE    : 2.2,  // cases/s : plafond de l'écartement

  /* Divers */
  PERIODE_CIBLAGE      : 400,   // ms entre deux recherches de cible
  BILAN_SECONDES       : 8
};

/* Combien de troupes de ce type tiennent dans une navette. */
function placesNavette(type){
  var f = UNI[type];
  return Math.min(EQ.PLACES_PAR_BARGE, (f && f.places) || EQ.PLACES_PAR_BARGE);
}
/* Effectif maximum d'une vie, toutes navettes au plus gros type. */
function flotteMaximum(){
  var m = 0;
  for(var t in UNI) m = Math.max(m, placesNavette(t));
  return EQ.NB_BARGES * m;
}

/* Rayon dans lequel un groupe complet doit s'étaler. Calé sur le
   Brouillard : c'est lui qui sert de référence visuelle au joueur. */
function rayonFormation(){
  return CAP.brouillard.rayon * Math.sqrt(EQ.FORMATION_PART_SURFACE);
}

/* ----------------------------------------------------------------
   ANCRE DE FORMATION
   Chaque unité reçoit une place stable dans le disque unité, tirée
   d'une spirale de Vogel (angle d'or). La spirale couvre le disque
   régulièrement sans jamais former de rangées — donc pas de grille
   militaire — et le bruit stable ajouté ensuite lui rend une
   irrégularité organique. L'unité vise SA place, pas celle de sa
   voisine : le groupe s'étale avant même de se toucher.
   ---------------------------------------------------------------- */
var ANGLE_OR = 2.399963229728653;
function bruitStable(n, sel){
  var v = Math.sin(n * (sel ? 78.233 : 12.9898) + sel * 4.1) * 43758.5453;
  return v - Math.floor(v);
}
/* Inverse radical en base 2 (van der Corput) : pour TOUTE plage
   contiguë de n, la suite couvre [0,1[ régulièrement. Une rampe
   « n modulo effectif » ne le fait pas : les quinze soldats d'une même
   navette, dont les n se suivent, recevaient tous un rayon voisin et
   se retrouvaient sur un mince anneau au lieu d'un disque. */
function inverseRadical(n){
  var b = 0, f = 0.5, m = (n | 0) + 1;
  while(m){ if(m & 1) b += f; f *= 0.5; m >>= 1; }
  return b;
}
function ancreFormation(n){
  /* Le bruit reste modeste : au-delà, deux places voisines finissent
     par se confondre et la spirale perd l'intérêt qu'elle avait. */
  var a = n * ANGLE_OR + (bruitStable(n, 1) - 0.5) * 0.34;
  var r = Math.sqrt(inverseRadical(n));
  r = Math.min(1, r * (1 + (bruitStable(n, 0) - 0.5) * 0.13));
  return { x:Math.cos(a) * r, y:Math.sin(a) * r };
}

/* ----------------------------------------------------------------
   Générateur pseudo-aléatoire déterministe (xorshift 32 bits)
   ---------------------------------------------------------------- */
function prng(s){
  var x = s >>> 0 || 1;
  return function(){
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5;  x >>>= 0;
    return x / 4294967296;
  };
}
function graineTexte(s){
  var h = 2166136261;
  for(var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return h >>> 0;
}
function graineCarte(code, index){ return graineTexte(code + "#" + index) >>> 0; }

/* ----------------------------------------------------------------
   Projection isométrique — losange 2:1
   ---------------------------------------------------------------- */
var TW = 52, TH = 26;
function iso(gx, gy){ return { x:(gx - gy) * TW / 2, y:(gx + gy) * TH / 2 }; }
function deIso(x, y){
  var dx = x / (TW / 2), dy = y / (TH / 2);
  return { gx:(dy + dx) / 2, gy:(dy - dx) / 2 };
}
function borne(v, a, b){ return v < a ? a : (v > b ? b : v); }

/* Caméra : écran = monde × z + p */
var ZMIN = 0.13, ZMAX = 1.7;

/* ----------------------------------------------------------------
   LE DÉZOOM MAXIMUM : l'île entière, et RIEN de plus.

   ZMIN était un nombre fixe. Sur une grande tablette, 0,13 laissait
   reculer bien au-delà de la côte : on gagnait alors du vide, pas de
   la carte, et l'île flottait au milieu d'un fond mort. Le bon
   plancher n'est pas une constante — il dépend de l'écran — c'est une
   MESURE : le zoom auquel la boîte du monde tient exactement dans le
   canevas. En deçà, on n'ajoute plus d'île, on ajoute du néant.

   MARGE_MONDE est la lisière de mer gardée à l'est du sable ; c'est
   la même que celle dont borneCamera se sert pour retenir la caméra,
   et ce n'est pas un hasard : le zoom plancher et la butée de
   déplacement doivent parler de la même boîte, sinon l'un montre ce
   que l'autre interdit d'atteindre.

   ZMIN reste, en plancher DUR. Sur un téléphone étroit, la largeur de
   l'île tiendrait à 0,05 : les cases feraient trois pixels et il n'y
   aurait plus rien à lire. Là, c'est la lisibilité qui commande et on
   ne voit pas l'île entière — mais on ne voit pas le vide non plus,
   puisqu'on est encore trop près pour l'atteindre.
   ---------------------------------------------------------------- */
var MARGE_MONDE = 8;
function boiteMonde(){
  var a = iso(0, GH), b = iso(GW + MARGE_MONDE, 0);   // extrêmes gauche / droite
  var c = iso(0, 0),  d = iso(GW + MARGE_MONDE, GH);  // extrêmes haut / bas
  return { x0:a.x, x1:b.x, y0:c.y, y1:d.y, l:b.x - a.x, h:d.y - c.y };
}
function zoomAjuste(w, h){
  var B = boiteMonde();
  if(!(w > 0) || !(h > 0) || !(B.l > 0) || !(B.h > 0)) return ZMIN;
  return Math.min(w / B.l, h / B.h);
}
/* Le plancher réel du zoom pour un canevas donné. Un seul endroit le
   calcule ; tout ce qui borne la caméra passe par lui. */
function zoomPlancher(w, h){
  return borne(Math.max(ZMIN, zoomAjuste(w, h)), ZMIN, ZMAX);
}
function versMonde(cam, sx, sy){ return deIso((sx - cam.px) / cam.z, (sy - cam.py) / cam.z); }
function versEcran(cam, gx, gy){
  var p = iso(gx, gy);
  return { x:p.x * cam.z + cam.px, y:p.y * cam.z + cam.py };
}

/* ----------------------------------------------------------------
   Pincement : zoom ET déplacement dans le même geste.
   On mémorise le point du monde sous le milieu des doigts, puis on
   repositionne la caméra pour qu'il y reste collé.
   ---------------------------------------------------------------- */
function debutPince(cam, ax, ay, bx, by){
  var mx = (ax + bx) / 2, my = (ay + by) / 2;
  return {
    d : Math.hypot(ax - bx, ay - by),
    z : cam.z,
    wx: (mx - cam.px) / cam.z,
    wy: (my - cam.py) / cam.z
  };
}
function appliquePince(cam, pincee, ax, ay, bx, by, zmin, zmax){
  if(zmin === undefined) zmin = ZMIN;
  if(zmax === undefined) zmax = ZMAX;
  var mx = (ax + bx) / 2, my = (ay + by) / 2;
  var d  = Math.hypot(ax - bx, ay - by);
  if(pincee.d < 1e-6) return cam;
  cam.z  = borne(pincee.z * (d / pincee.d), zmin, zmax);
  cam.px = mx - pincee.wx * cam.z;
  cam.py = my - pincee.wy * cam.z;
  return cam;
}

/* ----------------------------------------------------------------
   Angles — écart signé le plus court, correct au passage par ±π
   ---------------------------------------------------------------- */
function ecartAngulaire(a, b){
  var d = (a - b) % (Math.PI * 2);
  if(d >  Math.PI) d -= Math.PI * 2;
  if(d < -Math.PI) d += Math.PI * 2;
  return d;
}
function dansCone(angleCible, angleTourelle, demiAngle){
  return Math.abs(ecartAngulaire(angleCible, angleTourelle)) <= demiAngle;
}

/* ----------------------------------------------------------------
   Fiches techniques
   ---------------------------------------------------------------- */
/* Les défenses gardent une résistance MOYENNE : une poignée de tireuses
   doit en venir à bout en quelques secondes, pour que la progression
   dans la base reste vivante. Toute la dureté est dans le Brasier. */
var DEF = {
  crible:    { nom:"Crible",    desc:"tourelle automatique jumelée", pv:720, portee:5.15, degats:5,  cadence:110,  emprise:2, tourelle:1 },
  chalumeau: { nom:"Chalumeau", desc:"projeteur incendiaire",        pv:780, portee:5.6,  degats:10, cadence:150,  emprise:2, tourelle:1, cone:0.5 },
  /* Le Frelon tire de très loin — six fois la portée d'un Crible — mais
     il est aveugle de près : sous la portée d'une mitrailleuse, il ne
     peut plus abaisser ses rampes et se tait. Son verrou l'empêche de
     changer de cible en cours de route : la première qui entre dans son
     périmètre est suivie jusqu'au bout. */
  /* Cadence doublée, dégâts par roquette divisés par deux : les DPS
     sont inchangés au point près, mais le ciel se remplit — deux fois
     plus de départs, de traînées et d'impacts. C'est un choix de
     spectacle, pas d'équilibrage. */
  frelon:    { nom:"Frelon",    desc:"batterie de missiles",         pv:840, portee:30.9, degats:40, cadence:1350, emprise:3, tourelle:1, vitesseProj:8.5, porteeMin:5.15, verrou:1 },
  /* Le Pilon tire TROIS FOIS plus loin qu'avant — 8,2 → 24,6 cases.
     C'est désormais lui, et non le Frelon, qui tient le fond de l'île :
     il y en a 108 contre 12. Il reste aveugle sous 2,6 cases, si bien
     que le corps à corps continue de passer dessous. */
  pilon:     { nom:"Pilon",     desc:"obusier de siège",             pv:760, portee:24.6, degats:64, cadence:3200, emprise:3, tourelle:1, porteeMin:2.6, zone:1.5, vitesseProj:6.5, mortier:1 },
  bobine:    { nom:"Bobine",    desc:"pylône à arc",                 pv:700, portee:6.2,  degats:42, cadence:3400, emprise:2, tourelle:1, zone:1.9, ralenti:1.9, vitesseProj:9 },
  /* LE MIRADOR. La base n'avait aucune réponse entre 5 et 12 cases :
     le Crible décroche à 5,15, le Chalumeau à 5,6, la Bobine à 6,2, et
     au-delà il ne restait que 108 Pilons et 12 Frelons sur 488
     bâtiments. Mesuré : une troupe postée à 9 cases n'était JAMAIS
     exterminée, cinq minutes durant. Le mirador ferme cette zone
     franche — et il y en a beaucoup, c'est tout l'intérêt.
     Il est aveugle sous 4 cases : un tireur perché ne vise pas ses
     propres pieds. Celui qui accepte d'aller au contact lui échappe,
     comme il échappe déjà au Frelon et au Pilon. */
  mirador:   { nom:"Mirador",   desc:"tour de guet et son tireur d'élite",
               pv:640, portee:12.5, degats:70, cadence:2200, emprise:2, tourelle:1,
               porteeMin:4.0, vitesseProj:26, precision:1 },
  cuve:      { nom:"Cuve",      desc:"citerne de naphte",            pv:420, portee:0,    degats:0,  cadence:0,    emprise:2, tourelle:0 },
  silo:      { nom:"Silo",      desc:"réserve de matériel",          pv:500, portee:0,    degats:0,  cadence:0,    emprise:3, tourelle:0 },
  /* La cellule ne se défend pas et ne sert qu'à une chose : se faire
     récolter. Elles poussent par petits champs d'une quinzaine. */
  cellule:   { nom:"Cellule",   desc:"cellule énergétique",         pv:150, portee:0,    degats:0,  cadence:0,    emprise:1, tourelle:0, recolte:1 },
  /* LA CELLULE ÉLECTRIQUE. Cinq par île, quatre aux extrémités et une
     au centre : elles alimentent le bouclier du Brasier, qui est
     invulnérable tant qu'il en reste une debout. Elles ne tirent pas,
     mais elles encaissent — ce sont les objectifs intermédiaires qui
     obligent le salon à se répartir sur toute la carte. */
  reacteur:  { nom:"Cellule électrique", desc:"réacteur du bouclier du Brasier",
               pv:200000, portee:0, degats:0, cadence:0, emprise:3, tourelle:1, bouclier:1 }
};

/* Combien de cellules électriques protègent le Brasier. */
var NB_REACTEURS = 5;

/* Types de troupe. Une navette n'en embarque qu'un seul : la liste est
   faite pour qu'on puisse en ajouter d'autres sans rien casser. */
/* Vitesses relevées de vingt pour cent : 1,35 → 1,62 et 0,84 → 1,008.
   L'île fait cent trois cases de la plage au Brasier ; à l'ancienne
   allure la traversée seule mangeait la partie. */
var UNI = {
  meuf:{ nom:"Meuf", role:"tireuse à distance", pv:110, portee:5.0, arret:4.75,
         degats:54,  cadence:1300, vitesse:1.62, rayon:0.34, places:12 },
  mec :{ nom:"Mec",  role:"cogneur au contact", pv:560, portee:1.9, arret:1.70,
         degats:100, cadence:1600, vitesse:1.008, rayon:0.42, places:15 },

  /* ------------------------------------------------------------
     L'OGRE. Une navette n'en embarque qu'UN SEUL, et cet ogre doit
     valoir la barge de douze Meufs qu'il remplace.

     Douze Meufs : 54 dégâts toutes les 1,3 s, soit 41,54 dégâts/s
     chacune, donc 498,5 dégâts/s pour la barge entière. L'Ogre lance
     506 par hache toutes les 850 ms, soit 595,3 dégâts/s.

     IL FRAPPE DÉSORMAIS 19 % PLUS FORT QUE SA BARGE, et c'est voulu.
     La hache était à 440, soit 3,8 % de mieux que les douze Meufs — un
     match nul, sur le papier. Sur le terrain il perdait : il traverse
     l'île SEUL, il encaisse cinq fois les roquettes du Frelon, et le
     mirador l'abat d'une balle. Une barge de douze, elle, perd trois
     Meufs et continue. La stricte égalité des dégâts par seconde ne
     tenait donc pas compte de ce qu'il paie pour arriver à portée.
     Les quinze pour cent de plus achètent exactement ça.

     Les deux valeurs se règlent ENSEMBLE — changer l'une sans l'autre
     casse le rapport. La cadence est volontairement courte : il doit
     mitrailler le bâtiment de haches, pas poser une hache toutes les
     cinq secondes.
     Résistance : 110 × 1,5 = 165 PV. Plus dur à tuer qu'une Meuf,
     jamais immortel.
     Faiblesse : il encaisse CINQ FOIS les dégâts d'un lance-roquettes
     (le Frelon). C'est sa contrepartie assumée — un ogre lâché seul
     sous une batterie de missiles fond à vue d'œil.
     Vitesse : 1,62 × 1,10 = 1,782. Il est plus RAPIDE qu'une Meuf,
     malgré sa masse : son animation est lourde, pas son déplacement.
     ------------------------------------------------------------ */
  /* rayon : c'est l'ENCOMBREMENT, l'écart que deux unités s'imposent
     l'une à l'autre. Il ne joue sur rien d'autre — bloque() teste un
     point, pas un disque, donc il n'empêche pas de passer entre deux
     bâtiments. À 0,72 trois ogres se chevauchaient presque entièrement :
     leur corps fait trois fois celui d'une Meuf et déborde largement de
     l'écart qui convient à une petite troupe. */
  ogre:{ nom:"Ogre", role:"lanceur de haches", pv:165, portee:6.0, arret:5.7,
         degats:506, cadence:850, vitesse:1.782, rayon:1.6, places:1,
         vitesseHache:9.5, armement:0.28, ech:3,
         /* SES DEUX FAIBLESSES, par type d'arme. Une table plutôt que
            deux champs séparés : il y en aura d'autres, et le jour où
            l'on en ajoute une, seul ce littéral change.
            precision — la roquette du Frelon et la balle du Mirador :
            un corps de trois mètres qui avance en ligne droite est ce
            dont rêve un tireur posé.
            mortier — l'obus du Pilon : on ne rate pas une cible pareille
            avec une gerbe, et il n'a nulle part où se mettre à couvert. */
         vuln:{ precision:5, mortier:2 } }
};
var TYPES_TROUPE = ["meuf", "mec", "ogre"];

var CRE = {
  braisard:{ nom:"Braisard",           pv:210, detection:8.5, portee:2.5, degats:13, cadence:230,  vitesse:1.15, rayon:0.40 },
  piqueur :{ nom:"Piqueur",            pv:60,  detection:7.0, portee:0.9, degats:6,  cadence:400,  vitesse:2.60, rayon:0.26 },
  sanglier:{ nom:"Sanglier de cendre", pv:420, detection:7.5, portee:1.1, degats:70, cadence:1800, vitesse:0.55, rayon:0.55, charge:10, vitesseCharge:4.2 },
  crapaud :{ nom:"Crapaud gluant",     pv:180, detection:5.0, portee:5.0, degats:0,  cadence:2600, vitesse:0.0,  rayon:0.38, ralenti:0.6, dureeRalenti:4 },
  /* Gégé : inoffensive, elle ne fait que détaler. Ne la tuez pas. */
  belette :{ nom:"Gégé la belette",    pv:90,  detection:7.5, portee:0,   degats:0,  cadence:0,    vitesse:2.10, rayon:0.28, fuit:1 },
  /* Tweety : un canari. Il vole, se pose, sautille, et s'envole dès
     qu'on approche. Inoffensif, comme Gégé — et comme elle, on le
     regrettera. */
  tweety  :{ nom:"Tweety",             pv:60,  detection:9.0, portee:0,   degats:0,  cadence:0,    vitesse:3.40, rayon:0.22, fuit:1, vole:1 },
  /* LES TROIS PROTÉGÉS DE MILY. Aussi inoffensifs que Gégé, aussi
     faciles à écraser d'une rafale perdue — à un détail près : Mily
     les regarde. Le drapeau « protege » est le seul qui compte, tout
     le reste de la vengeance en découle. */
  chat    :{ nom:"Gribouille",         pv:130, detection:8.0, portee:0,   degats:0,  cadence:0,    vitesse:2.30, rayon:0.30, fuit:1, protege:1 },
  chaton  :{ nom:"Croquette",          pv:70,  detection:6.0, portee:0,   degats:0,  cadence:0,    vitesse:1.85, rayon:0.20, fuit:1, protege:1 },
  chatte  :{ nom:"Praline",            pv:110, detection:9.0, portee:0,   degats:0,  cadence:0,    vitesse:2.60, rayon:0.26, fuit:1, protege:1 }
};
/* L'ordre compte : c'est celui des trois cases de l'instantané. */
var ESPECES_PROTEGEES = ["chat", "chaton", "chatte"];

/* ----------------------------------------------------------------
   LA FAUNE DE LA JUNGLE
   Aucune ne se bat : elles sont là pour que la jungle soit HABITÉE.
   Toutes fuient, et c'est leur fuite qui raconte le combat — un singe
   qui détale dit qu'une explosion vient de tomber derrière lui.
   Les trois insectes volent, donc ils ne se posent jamais et ne
   gênent aucune trajectoire.
   ---------------------------------------------------------------- */
CRE.singe    = { nom:"Singe",    pv:110, detection:9.0,  portee:0, degats:0, cadence:0, vitesse:2.90, rayon:0.28, fuit:1 };
CRE.panda    = { nom:"Panda",    pv:260, detection:7.0,  portee:0, degats:0, cadence:0, vitesse:1.35, rayon:0.42, fuit:1 };
CRE.koala    = { nom:"Koala",    pv:140, detection:6.5,  portee:0, degats:0, cadence:0, vitesse:1.15, rayon:0.30, fuit:1 };
CRE.bourdon  = { nom:"Bourdon",  pv:30,  detection:6.0,  portee:0, degats:0, cadence:0, vitesse:3.10, rayon:0.16, fuit:1, vole:1 };
CRE.papillon = { nom:"Papillon", pv:20,  detection:7.5,  portee:0, degats:0, cadence:0, vitesse:2.40, rayon:0.14, fuit:1, vole:1 };
CRE.luciole  = { nom:"Luciole",  pv:15,  detection:5.0,  portee:0, degats:0, cadence:0, vitesse:1.60, rayon:0.10, fuit:1, vole:1 };
/* Le cochon d'Inde : la bestiole comique de la carte. Il vit en
   troupeau serré et détale par accélérations paniquées — c'est sa
   détection courte qui produit ça, il ne part qu'au dernier moment. */
CRE.cochon   = { nom:"Cochon d'Inde", pv:40, detection:4.5, portee:0, degats:0, cadence:0, vitesse:2.20, rayon:0.18, fuit:1 };

/* ----------------------------------------------------------------
   LES HUIT CAPACITÉS
   Chaque emploi renchérit le suivant : coût = base + pas × usages.
   ---------------------------------------------------------------- */
var COUT = {
  nova      :{ base:0,  pas:0, nom:"Nova" },
  poulets   :{ base:4,  pas:2, nom:"Poulets ×10" },
  brouillard:{ base:3,  pas:1, nom:"Brouillard" },
  salve     :{ base:10, pas:3, nom:"Salve" },
  cryo      :{ base:8,  pas:3, nom:"Cryo" },
  soin      :{ base:5,  pas:2, nom:"Soin" },
  balise    :{ base:1,  pas:1, nom:"Balise" },
  viper     :{ base:6,  pas:2, nom:"Viper" }
};
function coutActuel(m, usages){ return COUT[m].base + COUT[m].pas * (usages[m] || 0); }

/* Effets. La Nova est spectaculaire mais raisonnable : c'est le grand
   flash et le champignon qui font le spectacle, pas les chiffres. */
var CAP = {
  nova      :{ rayon:4.6, degats:130, rayonSouffle:7.0, degatsSouffle:45 },
  poulets   :{ nb:10, pv:40, duree:22, rayon:2.4 },
  brouillard:{ rayon:4.2, duree:20.0 },
  salve     :{ nb:16, rayon:4.2, duree:2.4, degats:60, zone:1.2 },
  cryo      :{ rayon:4.0, duree:12.0 },
  soin      :{ rayon:3.0, duree:6.0, pvParSeconde:30 },
  balise    :{ duree:30.0 },
  viper     :{ degats:220, rayon:1.5, vitesse:34 }
};

/* Les cinq îles, jouées dans l'ordre.
   Le Brasier est un objectif COLLECTIF : ~100 tireuses au contact font
   environ 4 100 dégâts/s. Seul et sans opposition, il faut donc à peu
   près une heure pour abattre la première île ; à quinze, quatre minutes.
   S'y ajoutent maintenant le million de PV des cinq cellules
   électriques, qu'il faut avoir démonté AVANT de pouvoir l'entamer.
   Elle s'appelle MILY. M-I-L-Y. Pas Millie, pas Milly. */
var CARTES = [
  { nom:"Mily à la plage",        biome:"plage",    pvQG:15000000,
    victoire:"Mily lui offre d'aller boire un verre !" },
  { nom:"Mily en forêt",          biome:"foret",    pvQG:20000000,
    victoire:"Mily l'invite dans sa cabane !" },
  { nom:"Mily à la campagne",     biome:"campagne", pvQG:26000000,
    victoire:"Mily l'invite à se rouler dans la paille !" },
  { nom:"Mily en soirée hippie",  biome:"hippie",   pvQG:31000000,
    victoire:"Mily t'invite à venir chez elle !" },
  { nom:"Mily dans le Sud",       biome:"sud",      pvQG:37000000,
    victoire:"Mily te dit qu'elle t'aime !" },
  /* ----------------------------------------------------------------
     LA CARTE ÉVÉNEMENT. Elle vit dans le MÊME tableau que les cinq
     autres — c'est ce qui lui donne gratuitement genereCarte, les
     biomes, le générateur de défenses, texteVictoire et tout le
     rendu. Ce qui la sépare tient dans un seul drapeau : special.
     La rotation des îles ne compte QUE les cartes ordinaires (voir
     NB_CARTES_NORMALES), donc l'enchaînement automatique ne peut
     jamais tomber sur elle. On n'y entre que par un lancement
     collectif, et sa progression vit dans une voie à part de
     l'instantané partagé (champs je/jf/jd/jpv, voir plus bas).
     ---------------------------------------------------------------- */
  { nom:"Mily dans la jungle",    biome:"jungle",   pvQG:60000000,
    special:1,
    victoire:"Mily lui offre un verre sous la pluie !" }
];
/* Combien de cartes participent à l'enchaînement ordinaire. Tout le
   reste du jeu compte les îles AVEC ce nombre et non CARTES.length :
   ajouter une carte événement ne doit pas rallonger la campagne. */
var NB_CARTES_NORMALES = (function(){
  var n = 0;
  for(var i = 0; i < CARTES.length; i++) if(!CARTES[i].special) n++;
  return n;
})();
/* L'index de la jungle dans CARTES. Calculé, jamais écrit en dur :
   le jour où une deuxième carte événement arrive, rien ne bouge. */
var IDX_JUNGLE = (function(){
  for(var i = 0; i < CARTES.length; i++)
    if(CARTES[i].biome === "jungle") return i;
  return -1;
})();
function carteSpeciale(i){ return !!(CARTES[i] && CARTES[i].special); }

/* Le message de victoire nomme celui qui a le plus contribué à faire
   tomber le Brasier, et change avec le thème de l'île. */
function texteVictoire(index, pseudo){
  var f = CARTES[index % CARTES.length];
  return [ (pseudo || "?") + " termine n°1 !", f.victoire ];
}

/* ----------------------------------------------------------------
   Dimensions du monde
   ---------------------------------------------------------------- */
var GW = 152, GH = 136;          // 20 672 cases — une île volontairement immense
var QG_GX = 9, QG_GY = 68;       // le Brasier, au fond ouest
var QG_EMPRISE = 12;      // le Brasier écrase tout le reste de la carte
var PLAGE_X0 = GW - 12;          // première colonne de sable praticable (140)
var MARGE_SOL = 8;               // marge de tuiles autour de la grille
var SOL_MPX_MAX = 7.0;           // budget mémoire du canevas de sol
var SOL_ECH = 0.5;               // recalculé par tailleSolPrecalcule()
/* Rayon en cases autour des bords où le sol devient rocailleux */
var LARGEUR_ROCHE = 7;
/* Rayon d'arrêt des troupes devant le Brasier (il est énorme) */
var RAYON_QG = 5.6;

/* Taille du canevas de sol pré-calculé — vérifiée par les tests */
function tailleSolPrecalcule(){
  var m = MARGE_SOL;
  var xs = [], ys = [];
  var coins = [[-m,-m],[GW+m,-m],[-m,GH+m],[GW+m,GH+m]];
  for(var i = 0; i < 4; i++){
    var p = iso(coins[i][0], coins[i][1]);
    xs.push(p.x); ys.push(p.y);
  }
  var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
  var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
  var lp = x1 - x0, hp = y1 - y0;              // pleine résolution
  /* L'échelle s'adapte pour que le canevas reste sous le budget mémoire.
     Seul le sol plat y est cuit : rochers, falaises et décors sont
     dessinés en direct, donc rien de net n'est perdu à l'agrandissement. */
  SOL_ECH = Math.min(0.5, Math.sqrt(SOL_MPX_MAX * 1e6 / (lp * hp)));
  var w = Math.ceil(lp * SOL_ECH), h = Math.ceil(hp * SOL_ECH);
  return { x0:x0, y0:y0, w:w, h:h, ech:SOL_ECH, mpx:(w * h) / 1e6,
           mpxPlein:(lp * hp) / 1e6 };
}

/* ----------------------------------------------------------------
   Génération de carte — strictement déterministe
   ---------------------------------------------------------------- */
function tirePondere(al, table){
  var t = 0, i;
  for(i = 0; i < table.length; i++) t += table[i][1];
  var r = al() * t;
  for(i = 0; i < table.length; i++){ r -= table[i][1]; if(r <= 0) return table[i][0]; }
  return table[table.length - 1][0];
}

/* plan   : chaîne encodée par encodePlan(), ou "" pour la carte d'origine
   tirage : numéro de tirage. À 0 et sans plan, la carte est au bit près
            celle d'avant l'éditeur — c'est ce qui protège les salons
            déjà en cours, dont le bitmap des destructions désigne les
            bâtiments par leur indice. */
function genereCarte(codeSalon, index, plan, tirage){
  tirage = tirage | 0;
  var gr  = tirage ? (graineTexte(codeSalon + "#" + index + "@" + tirage) >>> 0)
                   : graineCarte(codeSalon, index);
  var al  = prng(gr);
  var fic = CARTES[index % CARTES.length];
  /* Un plan dont toutes les zones sont « auto » N'EST PAS un plan : on
     repasse alors sur la séquence de tirages d'origine. Sans ça, une
     chaîne corrompue — ou un plan que le joueur vient de tout gommer —
     aurait donné une carte différente de la carte d'origine tout en
     n'exprimant aucune intention. */
  /* P porte TOUT ce que le plan sait dire : le quadrillage peint au
     doigt et les formes tracées au compas. genereCarte ne les
     distingue plus — il pose une question, planEn répond. */
  var P = (plan && typeof plan === "string" && plan.length) ? litPlan(plan, tirage) : null;
  var c = {
    index:index, graine:gr, nom:fic.nom, biome:fic.biome, tirage:tirage,
    batiments:[], rochers:[], decors:[], creatures:[],
    qg:{ gx:QG_GX, gy:QG_GY, pvMax:fic.pvQG, pv:fic.pvQG }
  };

  /* --- Bâtiments : lattice militaire tous les 5 carreaux, 30 % sautés --- */
  var bandeProche = [["frelon",0.38],["bobine",0.34],["pilon",0.18],["cuve",0.10]];
  var bandeMoy    = [["pilon",0.26],["bobine",0.45],["crible",0.19],["silo",0.10]];
  var bandeLoin   = [["crible",0.42],["chalumeau",0.20],["pilon",0.22],["silo",0.16]];
  /* LA JUNGLE TIRE DE PLUS LOIN ET PLUS FORT.
     Ses trois bandes basculent vers les armes à longue portée — le
     Frelon et son missile, le Pilon et son obus. Le Crible et le
     Chalumeau, qui ne portent qu'à cinq cases, laissent la place : sur
     une carte où l'on doit traverser mille défenses, ce sont les tirs
     lointains qui font la pression, pas ceux qu'on ne subit qu'au
     contact. Les stocks inertes (cuve, silo) disparaissent presque :
     ils ne tirent pas, et ici chaque emplacement doit menacer. */
  if(fic.biome === "jungle"){
    bandeProche = [["frelon",0.46],["bobine",0.24],["pilon",0.26],["cuve",0.04]];
    bandeMoy    = [["frelon",0.30],["pilon",0.36],["bobine",0.24],["crible",0.10]];
    bandeLoin   = [["pilon",0.40],["frelon",0.26],["crible",0.22],["chalumeau",0.12]];
  }

  for(var lx = 6; lx <= PLAGE_X0 - 3; lx += 5){
    for(var ly = 3; ly <= GH - 4; ly += 5){
      /* La zone du plan sous ce nœud décide de deux choses : combien on
         en saute ici, et quel type on y pose. Elle ne décide RIEN
         d'autre — la position, le jitter et l'orientation restent
         tirés comme avant. */
      var Q = P ? planEn(P, lx, ly) : null;
      var saut = Q ? Q.saut : 0.28;
      var dx = lx - QG_GX, dy = ly - QG_GY;
      var d = Math.hypot(dx, dy);
      var tAuto, rSaut, gx, gy, ang;

      if(P){
        /* AVEC PLAN : chaque nœud consomme le MÊME nombre de tirages,
           qu'on le garde ou qu'on le saute. C'est ce qui fait qu'un
           coup de pinceau ne change que ce qu'il touche. Court-circuiter
           sur « continue » suffirait à décaler toute la suite de la
           séquence : changer la densité d'une seule zone rebattrait la
           carte entière, jusqu'à l'autre bout de l'île. */
        rSaut = al();
        tAuto = d < 30 ? tirePondere(al, bandeProche)
              : d < 62 ? tirePondere(al, bandeMoy)
                       : tirePondere(al, bandeLoin);
        gx = lx + (al() - 0.5) * 0.7;
        gy = ly + (al() - 0.5) * 0.7;
        ang = al() * 6.2832;
        if(rSaut < saut) continue;                                // allées
        if(Math.abs(dx) <= 9 && Math.abs(dy) <= 9) continue;      // emprise du Brasier
      }else{
        /* SANS PLAN : la séquence d'origine, tirage pour tirage. C'est
           elle qui garantit que la carte des salons déjà en cours ne
           bouge pas d'un pouce. */
        if(al() < 0.28) continue;
        if(Math.abs(dx) <= 9 && Math.abs(dy) <= 9) continue;
        tAuto = d < 30 ? tirePondere(al, bandeProche)
              : d < 62 ? tirePondere(al, bandeMoy)
                       : tirePondere(al, bandeLoin);
        gx = lx + (al() - 0.5) * 0.7;
        gy = ly + (al() - 0.5) * 0.7;
        ang = al() * 6.2832;
      }

      var t = (Q && Q.t) ? TYPES_PLAN[Q.t] : tAuto;
      /* LA GOMME FORTE. Le test vient APRÈS tous les tirages : on
         consomme la séquence puis on jette le résultat, sinon effacer
         une zone rebattrait toute l'île derrière elle. */
      if(t === "vide") continue;
      var f = DEF[t];
      c.batiments.push({
        t:t, gx:gx, gy:gy, pv:f.pv, pvMax:f.pv, e:f.emprise,
        ang:ang, vivant:1, n:c.batiments.length
      });
    }
  }

  /* --- Champs de cellules énergétiques ---
     Des petits bosquets d'une quinzaine de cellules, posés dans les
     allées laissées libres par le quadrillage militaire. Ils ne se
     défendent pas : ils ne sont là que pour être récoltés. */
  c.champs = [];
  for(var cx = 14; cx <= PLAGE_X0 - 6; cx += 32){
    for(var cy = 12; cy <= GH - 9; cy += 40){
      if(al() < 0.22) continue;
      var fx = cx + (al() - 0.5) * 5, fy = cy + (al() - 0.5) * 6;
      if(Math.hypot(fx - QG_GX, fy - QG_GY) < 14) continue;   // pas au pied du Brasier
      var n = 13 + ((al() * 5) | 0);                          // treize à dix-sept
      /* La gomme forte emporte aussi les champs. Comme partout, on
         décide APRÈS avoir consommé les tirages du champ : seule la
         pose est annulée, jamais la séquence. */
      var champVide = P ? planEn(P, fx, fy).vide : 0;
      if(!champVide) c.champs.push({ gx:fx, gy:fy, n:n });
      var fc = DEF.cellule;
      for(var k = 0; k < n; k++){
        /* spirale d'or : le champ est dense mais jamais aligné */
        var a2 = k * 2.399963 + al() * 0.5;
        var r2 = 0.62 * Math.sqrt(k) + al() * 0.22;
        var bx = fx + Math.cos(a2) * r2, by = fy + Math.sin(a2) * r2 * 0.92;
        if(bx < 4 || bx > PLAGE_X0 - 2 || by < 3 || by > GH - 4) continue;
        var angc = al() * 6.2832;
        if(champVide) continue;
        /* CELLULE PAR CELLULE, et pas seulement au centre du champ.
           Une grappe est semée en spirale sur près de trois cases :
           décidée au seul centre, elle débordait dans la zone voisine
           et la gomme forte n'y pouvait rien. Mesuré : vingt-neuf
           cellules dans un couloir censé être nu. Le test vient après
           tous les tirages, comme partout. */
        if(P && planEn(P, bx, by).vide) continue;
        c.batiments.push({
          t:"cellule", gx:bx, gy:by, pv:fc.pv, pvMax:fc.pv, e:fc.emprise,
          ang:angc, vivant:1, n:c.batiments.length
        });
      }
    }
  }

  /* --- Falaises : murailles rocheuses infranchissables au nord, au sud
         et à l'ouest. Seule la plage de l'est est praticable. --- */
  c.falaises = [];
  function falaise(gx, gy, rang){
    c.falaises.push({
      gx:gx, gy:gy,
      r:0.72 + al() * 0.62,
      h:(rang === 0 ? 62 : rang === 1 ? 84 : 104) + al() * 26,
      s:al() * 6.2832, v:(al() * 3) | 0
    });
  }
  for(var x = -4.5; x < GW + 3; x += 0.72){
    falaise(x + al() * 0.35, -0.35 + al() * 0.4, 0);
    falaise(x + al() * 0.35, -1.65 + al() * 0.4, 1);
    falaise(x + al() * 0.35, -3.1 + al() * 0.5, 2);
    falaise(x + al() * 0.35, GH - 0.65 + al() * 0.4, 0);
    falaise(x + al() * 0.35, GH + 0.7 + al() * 0.4, 1);
    falaise(x + al() * 0.35, GH + 2.1 + al() * 0.5, 2);
  }
  for(var y = -3.5; y < GH + 3; y += 0.72){
    falaise(-0.35 + al() * 0.4, y + al() * 0.35, 0);
    falaise(-1.65 + al() * 0.4, y + al() * 0.35, 1);
    falaise(-3.1 + al() * 0.5, y + al() * 0.35, 2);
  }
  /* quelques rochers isolés dans les champs */
  for(var i = 0; i < 180; i++){
    var rx = 4 + al() * (PLAGE_X0 - 6), ry = 3 + al() * (GH - 6);
    if(Math.hypot(rx - QG_GX, ry - QG_GY) < 15) continue;
    c.rochers.push({ gx:rx, gy:ry, r:0.32 + al() * 0.4, s:al() * 6.2832, v:(al() * 3) | 0 });
  }

  /* --- Décors du biome --- */
  var nbDec = 520;
  for(var j = 0; j < nbDec; j++){
    var px = 1 + al() * (GW + 2), py = 1 + al() * (GH - 2);
    if(Math.hypot(px - QG_GX, py - QG_GY) < 13) continue;
    c.decors.push({ gx:px, gy:py, s:0.8 + al() * 0.5, v:(al() * 4) | 0 });
  }

  /* --- Créatures : quatre espèces hostiles, réparties sur toute l'île --- */
  var especes = ["braisard","piqueur","sanglier","crapaud"];
  var nbCre = 70 + ((al() * 31) | 0);
  var k = 0, poses = 0;
  while(c.creatures.length < nbCre && k < 4000){
    k++;
    var cx = 8 + al() * (PLAGE_X0 - 12), cy = 4 + al() * (GH - 8);
    if(Math.hypot(cx - QG_GX, cy - QG_GY) < 15) continue;
    /* les quatre premières espèces sont garanties, le reste est tiré au sort */
    var esp = (poses < 4) ? especes[poses] : especes[(al() * 4) | 0];
    poses++;
    if(esp === "piqueur"){                                        // essaim de 4 à 6
      var n = 4 + ((al() * 3) | 0);
      for(var q = 0; q < n && c.creatures.length < nbCre + 5; q++){
        c.creatures.push({ t:"piqueur", gx:cx + (al() - 0.5) * 2.4, gy:cy + (al() - 0.5) * 2.4, teinte:0 });
      }
    }else{
      c.creatures.push({ t:esp, gx:cx, gy:cy, teinte:(al() * 2) | 0 });
    }
  }
  /* Gégé la belette et Tweety le canari : un seul de chaque par île,
     quelque part à mi-chemin. */
  ["belette", "tweety"].forEach(function(esp2){
    for(var g = 0; g < 500; g++){
      var bx = 20 + al() * (PLAGE_X0 - 26), by = 6 + al() * (GH - 12);
      if(Math.hypot(bx - QG_GX, by - QG_GY) < 14) continue;
      c.creatures.push({ t:esp2, gx:bx, gy:by, teinte:0 });
      break;
    }
  });

  /* --- LES CINQ CELLULES ÉLECTRIQUES ---
     Quatre aux extrémités de la terre praticable, une au centre. Elles
     sont ajoutées EN DERNIER, exprès : le bitmap des destructions
     désigne les bâtiments par leur indice, et une insertion au milieu
     aurait fait pointer chaque bit sur le mauvais bâtiment dans tous
     les salons déjà en cours. En queue de liste, les anciens indices
     ne bougent pas d'un cran.
     On ne supprime aucun bâtiment existant pour leur faire place —
     même raison. On cherche plutôt, autour du point idéal, l'endroit
     libre le plus proche. */
  var marge = LARGEUR_ROCHE + 5;
  var ideals = [
    [marge + 4,        marge + 4],                 // extrémité nord-ouest
    [PLAGE_X0 - 9,     marge + 4],                 // extrémité nord-est
    [marge + 4,        GH - marge - 4],            // extrémité sud-ouest
    [PLAGE_X0 - 9,     GH - marge - 4],            // extrémité sud-est
    [(QG_GX + PLAGE_X0) / 2, GH / 2]               // le centre
  ];
  c.reacteurs = [];
  var fr = DEF.reacteur;
  for(var ir = 0; ir < ideals.length; ir++){
    var vx = ideals[ir][0], vy = ideals[ir][1];
    /* spirale de recherche : on s'écarte du point idéal jusqu'à trouver
       une place franche, loin du Brasier et des bâtiments déjà posés */
    var trouve = null;
    for(var pas = 0; pas < 90 && !trouve; pas++){
      var ang = pas * ANGLE_OR;
      var ray = pas * 0.85;
      var px2 = borne(vx + Math.cos(ang) * ray, marge, PLAGE_X0 - 5);
      var py2 = borne(vy + Math.sin(ang) * ray, marge, GH - marge);
      if(Math.hypot(px2 - QG_GX, py2 - QG_GY) < 20) continue;
      var libre = 1;
      for(var jb = 0; jb < c.batiments.length; jb++){
        var bb = c.batiments[jb];
        if(Math.hypot(bb.gx - px2, bb.gy - py2) < (fr.emprise + bb.e) * 0.55 + 1.2){ libre = 0; break; }
      }
      if(libre) trouve = { gx:px2, gy:py2 };
    }
    if(!trouve) trouve = { gx:vx, gy:vy };
    trouve.n = c.batiments.length;
    c.reacteurs.push(trouve);
    c.batiments.push({
      t:"reacteur", gx:trouve.gx, gy:trouve.gy, pv:fr.pv, pvMax:fr.pv,
      e:fr.emprise, ang:0, vivant:1, n:c.batiments.length
    });
  }

  /* --- RENFORT DE DÉFENSES : +15 % ---
     Posé sur son propre maillage, au CENTRE exact des mailles du
     quadrillage principal : chaque renfort se retrouve alors à 3,5
     cases des quatre nœuds qui l'entourent, ce qui suffit à garantir
     qu'il ne chevauchera jamais une défense d'origine — sans avoir à
     interroger la liste des bâtiments déjà posés.
     C'est ce détail qui rend le renfort ISOLABLE. Une vérification
     d'encombrement aurait lu des bâtiments dont le type et la présence
     dépendent du plan de défense : repeindre une seule zone aurait
     alors déplacé des renforts à l'autre bout de l'île. Même raison
     pour l'absence de plafond global sur le compte : un plafond couple
     toutes les zones entre elles, puisque atteindre le compte plus tôt
     change tout ce qui vient après.
     Ajouté à la fin du tableau, comme les cellules et les miradors :
     les indices des bâtiments d'origine ne bougent pas.
     Le renfort suit le plan du salon, type ET densité : sans quoi
     peindre une zone en Frelon y aurait laissé des défenses tirées au
     hasard. */
  for(var sx = 8.5; sx <= PLAGE_X0 - 5; sx += 5){
    for(var sy = 5.5; sy <= GH - 6; sy += 5){
      var Qs = P ? planEn(P, sx, sy) : null;
      /* La proportion gardée suit celle de la zone : un secteur
         clairsemé reçoit un renfort clairsemé, un secteur saturé un
         renfort saturé. 0,1486 est le rapport qui donne +15 % du
         quadrillage d'origine, lequel en garde 72 %.
         « Surchargé » court-circuite ce rapport et remplit aussi
         l'entre-deux : c'est là que la carte double de densité. */
      var sautSup = Qs ? Qs.sautSup : sautRenfort(0);
      /* Tirages consommés que le nœud soit gardé ou non : un coup de
         pinceau ne doit décaler la séquence de personne d'autre. */
      var rs  = al();
      var jxs = (al() - 0.5) * 1.2;
      var jys = (al() - 0.5) * 1.2;
      var angs = al() * 6.2832;
      var dss = Math.hypot(sx - QG_GX, sy - QG_GY);
      var tAutoS = dss < 30 ? tirePondere(al, bandeProche)
                 : dss < 62 ? tirePondere(al, bandeMoy)
                            : tirePondere(al, bandeLoin);
      if(rs < sautSup) continue;
      if(Math.abs(sx - QG_GX) <= 10 && Math.abs(sy - QG_GY) <= 10) continue;
      var ts = (Qs && Qs.t) ? TYPES_PLAN[Qs.t] : tAutoS;
      if(ts === "vide") continue;                    // la gomme forte
      var fs = DEF[ts];
      c.batiments.push({
        t:ts, gx:sx + jxs, gy:sy + jys, pv:fs.pv, pvMax:fs.pv, e:fs.emprise,
        ang:angs, vivant:1, sup:1, n:c.batiments.length
      });
    }
  }

  /* --- LES MIRADORS ---
     Posés EN DERNIER, après les cellules électriques, et pour la même
     raison qu'elles : le bitmap des destructions désigne les bâtiments
     par leur indice dans ce tableau. Tout ce qui s'insère avant décale
     les indices suivants et fait pointer chaque bit sur le mauvais
     bâtiment dans tous les salons déjà en cours. Ajouté à la fin, un
     mirador ne dérange rien — il occupe un indice qui n'existait pas.
     C'est aussi pour ça qu'ils ne sont PAS entrés dans les bandes de
     tirage du quadrillage principal : y toucher aurait rebattu le type
     de chacune des 488 défenses existantes.
     Leur propre quadrillage est plus lâche que celui des défenses
     ordinaires (7 cases contre 5) et décalé d'un demi-pas, pour qu'ils
     se posent dans les allées plutôt que sur les tourelles. */
  var fm = DEF.mirador;
  var margeM = LARGEUR_ROCHE + 3;
  for(var mx = margeM + 3; mx <= PLAGE_X0 - 4; mx += 7){
    for(var my = margeM + 4; my <= GH - margeM - 3; my += 7){
      /* Un tirage par nœud, gardé ou non : la séquence reste stable si
         l'on change un jour la proportion. */
      var rm = al();
      var gxm = mx + (al() - 0.5) * 2.2;
      var gym = my + (al() - 0.5) * 2.2;
      var angm = al() * 6.2832;
      if(rm < 0.18) continue;
      if(Math.abs(gxm - QG_GX) <= 10 && Math.abs(gym - QG_GY) <= 10) continue;
      /* la gomme forte vaut aussi pour les miradors — c'est même son
         intérêt principal, ce sont eux qui verrouillent le terrain */
      if(P && planEn(P, gxm, gym).vide) continue;
      /* on ne le plante pas dans un bâtiment déjà posé */
      var placeLibre = 1;
      for(var jm = 0; jm < c.batiments.length; jm++){
        var bm = c.batiments[jm];
        if(Math.abs(bm.gx - gxm) > 4 || Math.abs(bm.gy - gym) > 4) continue;
        if(Math.hypot(bm.gx - gxm, bm.gy - gym) < (fm.emprise + bm.e) * 0.5 + 0.6){ placeLibre = 0; break; }
      }
      if(!placeLibre) continue;
      c.batiments.push({
        t:"mirador", gx:gxm, gy:gym, pv:fm.pv, pvMax:fm.pv, e:fm.emprise,
        ang:angm, vivant:1, n:c.batiments.length
      });
    }
  }

  /* --- LES TROIS CHATS DE MILY ---
     Un chat, un chaton, une chatte par île. Ils sont tirés TOUT À LA
     FIN, après les miradors, et jamais au milieu des autres bestioles :
     chaque appel à al() décale la suite du tirage, et un tirage décalé
     ici aurait rebattu la position des cellules, des renforts et des
     miradors — donc l'indice de chaque bâtiment, donc le sens de
     chaque bit de destruction dans tous les salons en cours.
     En queue de fonction, ils ne coûtent rien à personne.
     On les pose à bonne distance du Brasier : ils doivent être
     rencontrés par accident, en pleine avancée, pas à la seconde où
     l'on débarque. */
  ESPECES_PROTEGEES.forEach(function(esp3){
    for(var g3 = 0; g3 < 500; g3++){
      var kx = 18 + al() * (PLAGE_X0 - 24), ky = 5 + al() * (GH - 10);
      if(Math.hypot(kx - QG_GX, ky - QG_GY) < 16) continue;
      c.creatures.push({ t:esp3, gx:kx, gy:ky, teinte:0 });
      break;
    }
  });

  /* --- LES CHAMPS DE CELLULES PEINTS À LA MAIN ---
     Le bit « champ » d'une zone du plan y sème des cellules
     énergétiques SANS toucher aux défenses : c'est une couche par
     -dessus, pas un remplacement. On peut donc miner une zone Frelon
     saturée, ce qui est exactement l'intérêt — de la récolte là où
     ça tire.
     En toute fin de fonction, après les chats : ces tirages-là
     dépendent du plan, et le plan ne doit décaler ni les bâtiments
     (leur indice porte le bitmap des destructions) ni les bestioles. */
  if(P){
    var fcp = DEF.cellule;
    for(var zi = 0; zi < NB_ZONES; zi++){
      var zcx = ((zi % ZONES_L) + 0.5) * PAS_ZONE;
      var zcy = (((zi / ZONES_L) | 0) + 0.5) * PAS_ZONE;
      /* Le pinceau à cellules ET les formes en couche « cellules »
         passent par la même question : on demande au plan, au centre
         de la zone, s'il veut de la récolte ici. Les champs restent
         donc calés sur le quadrillage — une forme plus petite qu'une
         zone n'en sèmera pas, et l'éditeur le dit. */
      if(!planEn(P, zcx, zcy).ch) continue;
      if(Math.hypot(zcx - QG_GX, zcy - QG_GY) < 12) continue;
      c.champs.push({ gx:zcx, gy:zcy, n:NB_CELL_PEINTES });
      for(var kp = 0; kp < NB_CELL_PEINTES; kp++){
        /* même spirale d'or que les champs d'origine, mais ouverte à
           la taille d'une zone : huit cases de côté */
        var ap = kp * 2.399963 + al() * 0.5;
        var rp = 0.78 * Math.sqrt(kp) + al() * 0.26;
        var bxp = zcx + Math.cos(ap) * rp, byp = zcy + Math.sin(ap) * rp * 0.92;
        var angp = al() * 6.2832;
        if(bxp < 4 || bxp > PLAGE_X0 - 2 || byp < 3 || byp > GH - 4) continue;
        /* même raison qu'au-dessus, et ici la grappe est plus large
           encore : quatre cases de rayon */
        if(planEn(P, bxp, byp).vide) continue;
        c.batiments.push({
          t:"cellule", gx:bxp, gy:byp, pv:fcp.pv, pvMax:fcp.pv, e:fcp.emprise,
          ang:angp, vivant:1, n:c.batiments.length
        });
      }
    }
  }

  /* --- LA JUNGLE : SA FLORE, SA FAUNE, SES GEYSERS ---
     Tout à la fin, après les cellules peintes : peupleLaJungle lit
     c.batiments pour ne rien planter sur une défense, et il doit
     donc les voir TOUS. Ces tirages ne concernent qu'une carte sur
     six ; les faire plus tôt décalerait la séquence des cinq autres. */
  /* SON PROPRE FLUX DE TIRAGE, et c'est la clé.
     peupleLaJungle recevait `al`, la séquence commune. Elle héritait
     donc de tout ce qui la précède — et deux passes en amont ne
     consomment PAS un nombre de tirages constant : le quadrillage,
     selon qu'il y a un plan ou non, et les champs de cellules peints,
     qui ne bouclent que sur les zones portant le bit « champ ».
     Cocher une case de récolte redessinait ainsi toute la végétation
     de l'île, à l'autre bout de la carte.
     Un flux à part, semé sur la seule graine de la carte, ferme la
     question pour de bon : plus rien de ce qui précède ne peut la
     décaler. Il ne reste que les tests d'encombrement, qui lisent les
     bâtiments — et ceux-là sont LOCAUX depuis que la marche des
     pousses hautes et les budgets d'essais sont à nombre fixe.
     Rien ne vient après, donc ce flux séparé ne décale personne. */
  if(CARTES[index] && CARTES[index].biome === "jungle")
    peupleLaJungle(c, prng((gr ^ 0x1DEA5EED) >>> 0));

  /* --- LE DURCISSEMENT DE LA JUNGLE ---
     Les défenses y sont plus dures qu'ailleurs. On applique le bonus
     ICI, en une seule passe finale sur le tableau complet, plutôt qu'à
     chaque endroit qui pose un bâtiment : il y en a cinq — quadrillage,
     renfort, cellules électriques, miradors, champs de cellules — et
     en oublier un donnerait une carte au durcissement inégal, très
     difficile à voir et impossible à expliquer.

     Trois exceptions, et elles comptent :
       — la CELLULE ÉLECTRIQUE du bouclier garde ses 200 000 PV, qui
         sont un chiffre annoncé au joueur dans le briefing ;
       — la cellule à récolter garde les siens, sinon la récolte
         devient deux fois plus lente sur la seule carte où elle est
         partout ;
       — le Brasier n'est pas dans ce tableau, donc sa vie ne bouge
         pas. C'était la demande expresse : une carte mieux défendue,
         pas une carte plus longue. */
  if(CARTES[index] && CARTES[index].biome === "jungle" && bonusPvJungle > 0){
    var kpv = 1 + bonusPvJungle / 100;
    for(var ib = 0; ib < c.batiments.length; ib++){
      var bb = c.batiments[ib];
      if(bb.t === "cellule" || bb.t === "reacteur") continue;
      bb.pvMax = Math.round(bb.pvMax * kpv);
      bb.pv = bb.pvMax;
    }
  }
  return c;
}

/* Le bonus de PV en vigueur. C'est une variable et non une constante :
   il vit dans l'instantané partagé, se règle depuis le panneau
   administrateur, et genereCarte() doit lire la valeur du salon — pas
   celle qui était vraie au chargement de la page. Le réseau la pose
   par poseBonusPvJungle() à chaque instantané reçu. */
var bonusPvJungle = EQ.JUNGLE_PV_BONUS;
function poseBonusPvJungle(p){
  var v = (typeof p === "number" && isFinite(p)) ? p : EQ.JUNGLE_PV_BONUS;
  bonusPvJungle = borne(Math.round(v), 0, 900);
  return bonusPvJungle;
}
/* Le multiplicateur de DÉGÂTS des défenses de la jungle. Il ne peut
   pas être appliqué à la génération comme les PV : les dégâts sont
   lus dans DEF au moment du tir, et DEF est partagé par les six
   cartes. On le lit donc au coup par coup, à l'unique endroit où une
   défense décide de ce qu'elle inflige. */
function multDegatsDefense(){
  return (jeu && jeu.index === IDX_JUNGLE) ? 1 + EQ.JUNGLE_DEG_BONUS / 100 : 1;
}

/* ----------------------------------------------------------------
   PEUPLER LA JUNGLE

   Le semis obéit à deux règles, et la seconde est la plus
   importante :

   1. LA DENSITÉ VIENT DES PETITES CHOSES. Un millier d'arbres ne fait
      pas une jungle — il fait une forêt clairsemée avec de gros
      objets. Ce sont les fougères, les herbes et les racines, par
      milliers, qui donnent le tapis végétal ; les grands arbres ne
      sont que la ponctuation.

   2. RIEN NE POUSSE SUR UNE DÉFENSE. Une plante posée sur une
      tourelle la cache, et le cahier des charges est formel : « les
      arbres et la végétation ne doivent pas cacher complètement les
      éléments importants ». On teste donc chaque pousse contre les
      bâtiments déjà posés — d'où la grille d'occupation ci-dessous,
      qui rend ce test constant au lieu de parcourir deux mille
      bâtiments par plante.
   ---------------------------------------------------------------- */
function peupleLaJungle(c, al){
  /* DEUX GRILLES D'OCCUPATION, ET C'EST TOUT LE SUJET.

     Une seule grille, qui interdirait toute pousse au voisinage d'un
     bâtiment, ne laisse rien passer sur une carte saturée : mesuré,
     674 plantes acceptées sur 8000 et vingt-quatre arbres pour toute
     une jungle. Or une fougère n'a pas les besoins d'un arbre.

     `occHaut` interdit ce qui CACHE : arbres, lianes, plantes
     tropicales, buissons. Ils gardent leurs distances avec les
     défenses, sans quoi la carte devient illisible.

     `occBas` n'interdit que le pied même du bâtiment : herbes,
     fougères, racines et rochers moussus s'y glissent entre les
     tourelles. C'est exactement ce que demande le cahier des charges
     — « végétation entre certaines défenses », et « les hautes herbes
     peuvent légèrement masquer les jambes des unités ». Ce tapis-là
     ne cache rien d'important : il passe sous la ligne de mire.

     Les grilles rendent le test constant : sans elles, tester huit
     mille pousses contre deux mille bâtiments coûterait seize
     millions de comparaisons à chaque génération de carte. */
  /* Combien de cases on tire pour chaque pousse haute, libres ou non.

     LE PIÈGE, ET IL EST JOLI. J'avais d'abord fait DESCENDRE la liste
     jusqu'à la première case libre : moins de tirages, et parfaitement
     local. Mais ça vide les clairières. Une case libre isolée au
     milieu d'un massif récolte tout ce qui tombe dans les trente cases
     encombrées au-dessus d'elle ; une case libre au milieu d'une
     clairière ne récolte qu'elle-même. Résultat mesuré à l'écran :
     l'intérieur de l'île se dépeuple et les massifs se tassent en
     grappes. Exactement l'inverse de ce qu'on veut — les trouées sont
     justement là pour qu'il y pousse des arbres.

     Le tirage par REJET n'a pas ce défaut : chaque case libre a
     exactement la même chance, où qu'elle soit. Sur la jungle saturée,
     777 cases sur 17 680 sont libres — 4,4 % — donc 120 essais donnent
     99,5 % de réussite. Et le budget est constant, ce qui est toute la
     raison d'être de l'exercice. */
  var ESSAIS_HAUTE = 120;

  var occHaut = {}, occBas = {}, i, b;
  function marque(grille, gx, gy, r){
    var x0 = Math.floor(gx - r), x1 = Math.ceil(gx + r);
    var y0 = Math.floor(gy - r), y1 = Math.ceil(gy + r);
    for(var x = x0; x <= x1; x++)
      for(var y = y0; y <= y1; y++) grille[x + "," + y] = 1;
  }
  for(i = 0; i < c.batiments.length; i++){
    b = c.batiments[i];
    marque(occHaut, b.gx, b.gy, b.e * 0.5 + 1.2);
    marque(occBas,  b.gx, b.gy, b.e * 0.28);
  }
  /* Le Brasier reste dégagé sur les deux grilles : c'est l'objectif,
     rien ne doit le voiler. */
  marque(occHaut, QG_GX, QG_GY, 14);
  marque(occBas,  QG_GX, QG_GY, 13);
  function dansLIle(gx, gy){
    return gx >= 3 && gx <= PLAGE_X0 - 2 && gy >= 3 && gy <= GH - 4;
  }
  function libre(gx, gy){
    return dansLIle(gx, gy) && !occHaut[Math.round(gx) + "," + Math.round(gy)];
  }
  function libreBas(gx, gy){
    return dansLIle(gx, gy) && !occBas[Math.round(gx) + "," + Math.round(gy)];
  }

  /* --- LA FLORE ---
     Les proportions font le tapis : pour un grand arbre, il y a une
     centaine de petites pousses. C'est ce RAPPORT, et non le nombre
     total, qui donne l'impression d'entrer dans une jungle — mille
     arbres feraient une forêt clairsemée avec de gros objets. */
  c.flore = [];

  /* LES CASES OÙ UN GRAND ARBRE PEUT TENIR, recensées UNE fois.
     Sur une carte saturée elles sont rares — l'essentiel se trouve
     dans les clairières du plan et le long de la ceinture rocheuse.
     Les tirer au hasard gaspillait quatre-vingt-dix-sept essais sur
     cent et ne donnait que trente arbres pour toute une jungle. En
     piochant dans la liste, on décide vraiment de leur nombre, et les
     clairières deviennent ce qu'elles doivent être : des trouées
     pleines d'arbres au milieu du champ de tir. */
/* LA LISTE NE REGARDE PLUS LES BÂTIMENTS, et c'est un correctif, pas
     une optimisation.

     LE DÉFAUT. Elle était bâtie sur occHaut, donc sur c.batiments :
     sa LONGUEUR et son ORDRE dépendaient du plan. Or on y pioche par
     indice — casesHautes[(al() * longueur) | 0]. Déplacer une seule
     tourelle changeait la longueur d'une unité, et les deux mille cent
     pousses hautes atterrissaient toutes ailleurs. Mesuré : repeindre
     UNE zone de la jungle laissait 3 792 pousses sur 7 915 en place,
     et 147 bêtes sur 777. Un joueur qui composait une clairière la
     perdait en revenant y retoucher un détail — et l'éditeur lui
     promettait le contraire.

     Aucune des cinq autres cartes n'avait ce défaut : leur décor ne
     lit pas les bâtiments. La jungle était le seul endroit du
     générateur à violer la règle de la maison — « le test vient APRÈS
     les tirages » — non pas en branchant, mais en faisant dépendre le
     SENS du tirage des bâtiments.

     LA CORRECTION. La liste ne retient plus que la forme de l'île et
     le dégagement du Brasier, deux choses qu'aucun plan ne touche :
     elle a donc toujours la même longueur et le même ordre. On tire
     ensuite ESSAIS_HAUTE candidates et l'on garde la première libre —
     un budget de tirages CONSTANT, quel que soit l'encombrement. Les
     effectifs sont relevés à la mesure pour compenser les rejets. */
  var occFixe = {};
  marque(occFixe, QG_GX, QG_GY, 14);
  var casesHautes = [];
  for(var cx = 3; cx <= PLAGE_X0 - 2; cx++){
    for(var cy = 3; cy <= GH - 4; cy++){
      if(!occFixe[cx + "," + cy]) casesHautes.push(cx + cy * 1000);
    }
  }
  function poseHaute(fam, n){
    if(!casesHautes.length) return;
    for(var k = 0; k < n; k++){
      /* On tire TOUJOURS ESSAIS_HAUTE cases, libres ou non, et l'on
         garde la première libre. Toujours le même nombre de tirages,
         donc rien derrière ne se décale ; et chaque case libre a la
         même chance, donc les clairières restent des clairières
         pleines d'arbres. Une pousse ne change de place que si SA
         première case libre a changé d'état — c'est local. */
      var e = -1, cand;
      for(var t = 0; t < ESSAIS_HAUTE; t++){
        cand = casesHautes[(al() * casesHautes.length) | 0];
        if(e < 0 && !occHaut[(cand % 1000) + "," + ((cand / 1000) | 0)]) e = cand;
      }
      /* la gigue est bornée à la demi-case : une pousse ne doit pas
         sortir de la case libre qu'on lui a trouvée */
      var jx = (al() - 0.5) * 0.9, jy = (al() - 0.5) * 0.9;
      var fv = al(), fs = al();
      if(e < 0) continue;                       // massif infranchissable
      var gx = (e % 1000) + jx, gy = ((e / 1000) | 0) + jy;
      if(!dansLIle(gx, gy)) continue;
      c.flore.push({ gx:gx, gy:gy, fam:fam, v:fv, s:fs });
    }
  }
  poseHaute("arbre",   420);
  poseHaute("liane",   300);
  poseHaute("plante",  620);
  poseHaute("buisson", 760);

  /* LE TAPIS. Lui n'a besoin de rien : il se glisse partout où il n'y
     a pas le pied d'un bâtiment, donc le tirage direct suffit. C'est
     lui, et non les arbres, qui fait la jungle. */
  var TAPIS = [
    { fam:"herbe",   n:5200 },
    { fam:"fougere", n:3600 },
    { fam:"racine",  n:2400 },
    { fam:"rocher",  n:1000 }
  ];
  for(i = 0; i < TAPIS.length; i++){
    var F = TAPIS[i];
    for(var k2 = 0; k2 < F.n; k2++){
      /* Un tirage par pousse, gardée ou non : la séquence reste
         stable si l'on change un jour un effectif. */
      var fx = 2 + al() * (PLAGE_X0 - 2);
      var fy = 2 + al() * (GH - 4);
      var fv2 = al(), fs2 = al();
      if(!libreBas(fx, fy)) continue;
      c.flore.push({ gx:fx, gy:fy, fam:F.fam, v:fv2, s:fs2 });
    }
  }

  /* --- LA FORÊT DU POURTOUR ---
     Au-delà de la ceinture rocheuse, l'île donnait sur un vert plat.
     On y plante une vraie masse forestière, pour que la zone de combat
     paraisse perdue au milieu d'une immense jungle qui continue au
     loin.

     Trois choses la rendent presque gratuite :
       — elle n'entre JAMAIS dans la logique de jeu. Ce sont des
         objets de décor, dans le même index spatial que le reste :
         hors champ, ils ne coûtent pas une instruction ;
       — elle réutilise les MÊMES sprites d'arbres que l'intérieur, à
         d'autres échelles. Zéro pixel de mémoire en plus ;
       — sa densité DÉCROÎT vers l'extérieur et ses tailles varient par
         rang. C'est ce dégradé qui donne la profondeur : la première
         rangée est nette et haute, les suivantes se tassent et se
         fondent dans la brume.

     Elle déborde largement de la grille jouable : les arbres les plus
     lointains sont posés bien au-delà, là où le sol pré-calculé
     s'arrête, et c'est exactement ce qu'on veut voir quand on dézoome
     au maximum.

     Les effectifs et les échelles sont réglés ENSEMBLE, à la mesure :
     un arbre lointain coûte exactement le même blit qu'un arbre
     proche, donc la seule façon de payer moins est d'en poser moins —
     et de compenser en les grossissant, pour que la masse reste la
     même à l'œil. Les rangs lointains sont donc peu nombreux et
     grands ; c'est la lisière, celle qu'on regarde vraiment, qui garde
     de la variété.
     Premier jet à 5 707 arbres : 77 ms d'image à pleine vue. */
  var RANGS_FORET = [
    { d0:1.5,  d1:9,   n:1300, ech:[1.05, 1.40] },   // lisière : haute et nette
    { d0:8,    d1:20,  n:800,  ech:[1.10, 1.55] },
    { d0:18,   d1:34,  n:450,  ech:[1.30, 1.90] },   // au loin : peu et gros
    { d0:30,   d1:52,  n:260,  ech:[1.60, 2.40] }
  ];
  for(var ir = 0; ir < RANGS_FORET.length; ir++){
    var R = RANGS_FORET[ir];
    for(var ka = 0; ka < R.n; ka++){
      /* On tire un point dans la couronne qui entoure l'île : d'abord
         un côté, puis une profondeur dans ce rang. */
      var cote = (al() * 4) | 0;
      var prof = R.d0 + al() * (R.d1 - R.d0);
      var lon, fx2, fy2;
      if(cote === 0){ lon = -R.d1 + al() * (GW + 2 * R.d1); fx2 = lon; fy2 = -prof; }
      else if(cote === 1){ lon = -R.d1 + al() * (GW + 2 * R.d1); fx2 = lon; fy2 = GH - 1 + prof; }
      else if(cote === 2){ lon = -R.d1 + al() * (GH + 2 * R.d1); fx2 = -prof; fy2 = lon; }
      else { lon = -R.d1 + al() * (GH + 2 * R.d1); fx2 = PLAGE_X0 - 1 + prof; fy2 = lon; }
      var v2 = al(), s2 = al();
      /* La plage de débarquement à l'est doit rester dégagée : c'est
         par là qu'on arrive, et un mur d'arbres devant la mer serait
         un contresens. */
      if(fx2 > PLAGE_X0 - 3 && fy2 > -4 && fy2 < GH + 3) continue;
      c.flore.push({ gx:fx2, gy:fy2, fam:"arbre", v:v2, s:s2,
                     ech:R.ech[0] + (R.ech[1] - R.ech[0]) * s2, fond:1 });
    }
  }

  /* --- LES GEYSERS DE FEU ---
     Répartis « intelligemment dans certaines zones » : en foyers, pas
     uniformément. C'est semeGeysers qui s'en charge ; on ne lui donne
     que le test de terrain libre. */
  c.geysers = [];
  /* MÊME DISCIPLINE QUE PARTOUT : on tire toujours autant, on garde
     ensuite. Cette boucle sortait dès qu'elle avait trouvé sa place,
     et le nombre de tirages dépendait donc de l'encombrement, donc du
     plan — c'est elle qui décalait la faune. Mesuré avant correction :
     une poignée de tourelles déplacées et 629 bêtes sur 777
     changeaient de place, alors que la flore, elle, tenait bon. */
  for(i = 0; i < EQ.JUNGLE_GEYSERS; i++){
    var pris = 0;
    for(var e = 0; e < 200; e++){
      var gx = 8 + al() * (PLAGE_X0 - 14), gy = 5 + al() * (GH - 10);
      var dodo = al() * 14;
      if(pris) continue;
      if(!libre(gx, gy)) continue;
      if(Math.hypot(gx - QG_GX, gy - QG_GY) < 18) continue;
      var trop = 0;
      for(var q = 0; q < c.geysers.length; q++){
        if(Math.hypot(c.geysers[q].gx - gx, c.geysers[q].gy - gy) < 6){ trop = 1; break; }
      }
      if(trop) continue;
      c.geysers.push({ gx:gx, gy:gy, sommeil:dodo });
      pris = 1;
    }
  }

  /* --- LA FAUNE ---
     « Beaucoup de pandas », dit le cahier des charges, et il a raison :
     c'est le nombre qui rend une jungle habitée, pas la variété. Les
     pandas sont donc les plus nombreux, et la moitié d'entre eux est
     assise à manger — une jungle où tout le monde marche est une
     jungle en fuite. */
  var BESTIOLES = [
    { t:"panda",    n:110, gr:3 },
    { t:"singe",    n:80,  gr:4 },
    { t:"koala",    n:55,  gr:2 },
    { t:"cochon",   n:130, gr:6 },
    { t:"bourdon",  n:80,  gr:3 },
    { t:"papillon", n:95,  gr:4 },
    { t:"luciole",  n:150, gr:7 }
  ];
  for(i = 0; i < BESTIOLES.length; i++){
    var B = BESTIOLES[i];
    /* On compte les bêtes RÉELLEMENT posées, avec un budget d'essais
       pour ne jamais boucler sans fin sur une carte qui n'aurait plus
       de place. Compter les essais au lieu des poses donnait des
       effectifs très en dessous de la consigne : sur une carte
       saturée, un groupe sur trois tombe au pied du Brasier ou dans
       une tourelle. */
    /* BUDGET D'ESSAIS FIXE, et non « jusqu'à ce que ça suffise ».
       Le `while(pose < B.n)` s'arrêtait plus ou moins tôt selon
       l'encombrement, donc selon le plan : le nombre de tirages
       consommés en dépendait, et tout ce qui suivait se décalait.
       Mesuré : 630 bêtes sur 777 changeaient de place pour UNE zone
       repeinte. On tire désormais toujours autant, et l'on cesse
       simplement de POSER une fois l'effectif atteint. */
    var pose = 0;
    for(var ess = 0; ess < B.n * 12; ess++){
      /* EN PETITS GROUPES, jamais un par un. Une jungle habitée, ce
         n'est pas une bestiole tous les vingt mètres : c'est une
         famille de cochons d'Inde qui détale ensemble, une bande de
         singes dans le même arbre, un nuage de lucioles au-dessus de
         la même flaque. Le semis uniforme donnait des bêtes solitaires
         qu'on ne remarquait jamais ; le groupe, lui, fait une SCÈNE. */
      var nb = 1 + ((al() * B.gr) | 0);
      var cx2 = 6 + al() * (PLAGE_X0 - 12), cy2 = 4 + al() * (GH - 8);
      /* le test du Brasier vient APRÈS, comme partout : on consomme
         les tirages du groupe même si on le jette */
      var auPied = Math.hypot(cx2 - QG_GX, cy2 - QG_GY) < 15;
      for(var g2 = 0; g2 < nb; g2++){
        var bx = cx2 + (al() - 0.5) * 3.4;
        var by = cy2 + (al() - 0.5) * 3.4;
        var teinte = (al() * 3) | 0;
        var assis = (B.t === "panda" && al() < 0.5) ? 1 : 0;
        if(auPied || pose >= B.n) continue;
        /* libreBas et non libre : une bête se faufile entre les
           tourelles comme les fougères, elle ne cache rien. Avec la
           contrainte des grands arbres, la carte saturée en rejetait
           quatre-vingt-treize pour cent et il ne restait que huit
           pandas pour toute une jungle. */
        if(!libreBas(bx, by)) continue;
        c.creatures.push({ t:B.t, gx:bx, gy:by, teinte:teinte, assis:assis });
        pose++;
      }
    }
  }
  return c;
}

/* Empreinte d'une carte — sert aux tests de déterminisme */
function empreinteCarte(c){
  var h = 2166136261;
  function m(v){ h ^= (v | 0); h = (h * 16777619) >>> 0; }
  m(c.graine); m(c.batiments.length); m(c.rochers.length); m(c.creatures.length);
  for(var i = 0; i < c.batiments.length; i++){
    var b = c.batiments[i];
    m(graineTexte(b.t)); m(Math.round(b.gx * 1000)); m(Math.round(b.gy * 1000)); m(b.pvMax);
  }
  for(var j = 0; j < c.creatures.length; j++){
    var k = c.creatures[j];
    m(graineTexte(k.t)); m(Math.round(k.gx * 1000)); m(Math.round(k.gy * 1000));
  }
  return h >>> 0;
}

/* ----------------------------------------------------------------
   MQTT 3.1.1 écrit à la main, directement sur WebSocket.
   ---------------------------------------------------------------- */
function utf8Octets(s){
  var o = [], i, c;
  for(i = 0; i < s.length; i++){
    c = s.charCodeAt(i);
    if(c < 0x80) o.push(c);
    else if(c < 0x800){ o.push(0xc0 | (c >> 6), 0x80 | (c & 63)); }
    else if(c >= 0xd800 && c <= 0xdbff && i + 1 < s.length){
      var c2 = s.charCodeAt(i + 1);
      var cp = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00); i++;
      o.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
    }else{ o.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63)); }
  }
  return o;
}
function texteUtf8(oct, deb, fin){
  var s = "", i = deb;
  while(i < fin){
    var b = oct[i++];
    if(b < 0x80) s += String.fromCharCode(b);
    else if(b < 0xe0) s += String.fromCharCode(((b & 31) << 6) | (oct[i++] & 63));
    else if(b < 0xf0) s += String.fromCharCode(((b & 15) << 12) | ((oct[i++] & 63) << 6) | (oct[i++] & 63));
    else{
      var cp = ((b & 7) << 18) | ((oct[i++] & 63) << 12) | ((oct[i++] & 63) << 6) | (oct[i++] & 63);
      cp -= 0x10000;
      s += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 1023));
    }
  }
  return s;
}
/* Longueur restante : varint sur 1 à 4 octets */
function encodeLongueur(n){
  var o = [];
  do{
    var b = n % 128;
    n = Math.floor(n / 128);
    if(n > 0) b |= 128;
    o.push(b);
  }while(n > 0);
  return o;
}
function decodeLongueur(oct, i){
  var mult = 1, val = 0, cpt = 0, b;
  do{
    if(i >= oct.length) return null;                 // paquet incomplet
    b = oct[i++];
    val += (b & 127) * mult;
    mult *= 128;
    if(++cpt > 4) return { erreur:true };
  }while(b & 128);
  return { valeur:val, suivant:i };
}
function chaineMqtt(s){
  var o = utf8Octets(s);
  return [ (o.length >> 8) & 255, o.length & 255 ].concat(o);
}
function trame(entete, corps){
  return new Uint8Array([entete].concat(encodeLongueur(corps.length), corps));
}
function paquetConnect(idClient, keepaliveSec){
  var corps = chaineMqtt("MQTT").concat([4, 0x02, (keepaliveSec >> 8) & 255, keepaliveSec & 255], chaineMqtt(idClient));
  return trame(0x10, corps);
}
function paquetSubscribe(idPaquet, sujet){
  var corps = [(idPaquet >> 8) & 255, idPaquet & 255].concat(chaineMqtt(sujet), [0]);
  return trame(0x82, corps);
}
/* retenu : le courtier conserve ce message et le sert d'office à tout
   nouvel abonné. C'est là-dessus que repose la persistance du monde —
   sans lui, un message n'atteint que les clients connectés à l'instant
   précis où il passe. */
function paquetPublish(sujet, message, retenu){
  var corps = chaineMqtt(sujet).concat(utf8Octets(message));
  return trame(retenu ? 0x31 : 0x30, corps);
}
function paquetPing(){ return new Uint8Array([0xc0, 0x00]); }
function paquetDeconnexion(){ return new Uint8Array([0xe0, 0x00]); }

/* Décodeur à tampon : les trames WebSocket sont coupées ou collées */
function DecodeurMqtt(){ this.tampon = []; }
DecodeurMqtt.prototype.ajoute = function(octets){
  for(var i = 0; i < octets.length; i++) this.tampon.push(octets[i]);
};
DecodeurMqtt.prototype.suivant = function(){
  if(this.tampon.length < 2) return null;
  var r = decodeLongueur(this.tampon, 1);
  if(r === null) return null;
  if(r.erreur){ this.tampon.length = 0; return null; }
  var total = r.suivant + r.valeur;
  if(this.tampon.length < total) return null;
  var p = {
    type      : (this.tampon[0] >> 4) & 15,
    drapeaux  : this.tampon[0] & 15,
    corps     : this.tampon.slice(r.suivant, total)
  };
  this.tampon = this.tampon.slice(total);
  return p;
};
/* Lecture d'un PUBLISH QoS 0 */
function litPublish(corps){
  var lg = (corps[0] << 8) | corps[1];
  return { sujet:texteUtf8(corps, 2, 2 + lg), message:texteUtf8(corps, 2 + lg, corps.length) };
}

/* ----------------------------------------------------------------
   Convergence des points de vie du QG.
   Le relais ordonne les messages ; chaque client applique la même
   séquence. Les numéros de série évitent qu'un doublon compte deux fois.
   ---------------------------------------------------------------- */
function FileDegats(pvMax){ this.pv = pvMax; this.pvMax = pvMax; this.vus = {}; }
FileDegats.prototype.applique = function(idEmetteur, serie, degats){
  var e = this.vus[idEmetteur];
  if(!e) e = this.vus[idEmetteur] = { max:0, hors:{} };
  /* Fenêtre glissante : « max » est le plus grand numéro contigu déjà vu,
     « hors » retient les numéros arrivés dans le désordre. Un doublon est
     donc rejeté, et un message en retard n'est jamais perdu. */
  if(serie <= e.max || e.hors[serie]) return false;
  var d = Math.round(degats);
  if(d > 0) this.pv = Math.max(0, this.pv - d);
  e.hors[serie] = 1;
  while(e.hors[e.max + 1]){ delete e.hors[e.max + 1]; e.max++; }
  return true;
};
FileDegats.prototype.adopteMinimum = function(pv){
  if(typeof pv === "number" && pv >= 0 && pv < this.pv) this.pv = pv;
};

/* ----------------------------------------------------------------
   INSTANTANÉ DU MONDE — la persistance du salon
   Le monde ne vit plus seulement dans la mémoire de chaque navigateur :
   un instantané compact circule, et le courtier en garde le dernier
   (message MQTT RETENU). Quiconque arrive — en cours de partie ou des
   heures plus tard — le reçoit et reprend le monde là où il en était.

   L'instantané tient en cinq champs :
     v  numéro de version, monotone croissant
     cy numéro de campagne — il s'incrémente quand les cinq îles sont
        tombées et que l'on repart de la première. Sans lui, revenir à
        l'île 0 serait vu comme un instantané périmé et le salon
        resterait figé sur la dernière île à jamais.
     c  index de l'île en cours
     pv points de vie du Brasier
     d  bitmap des bâtiments détruits, six bits par caractère
     g  nom de qui a tué Gégé la belette (vide tant qu'elle vit)
     w  nom de qui a tué Tweety le canari (vide tant qu'il vit)

   Sa fusion est MONOTONE : une défense détruite ne se relève jamais,
   les PV du Brasier ne remontent jamais. C'est ce qui rend l'ordre
   d'arrivée des messages sans importance, et deux clients qui publient
   en même temps sans conséquence.
   ---------------------------------------------------------------- */
var ALPHA_BITS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-";

function encodeBits(bits){
  var s = "", i, k, v;
  for(i = 0; i < bits.length; i += 6){
    v = 0;
    for(k = 0; k < 6; k++) if(bits[i + k]) v |= (1 << k);
    s += ALPHA_BITS.charAt(v);
  }
  return s;
}
function decodeBits(s, n){
  var bits = [], i, k, v, j;
  for(i = 0; i < n; i++) bits.push(0);
  if(typeof s !== "string") return bits;
  for(i = 0; i < s.length; i++){
    v = ALPHA_BITS.indexOf(s.charAt(i));
    if(v < 0) continue;
    for(k = 0; k < 6; k++){
      j = i * 6 + k;
      if(j < n && (v & (1 << k))) bits[j] = 1;
    }
  }
  return bits;
}
/* OU bit à bit de deux bitmaps encodés, sans les décoder entièrement */
function unionBits(a, b){
  a = typeof a === "string" ? a : "";
  b = typeof b === "string" ? b : "";
  var n = Math.max(a.length, b.length), s = "", i, va, vb;
  for(i = 0; i < n; i++){
    va = i < a.length ? ALPHA_BITS.indexOf(a.charAt(i)) : 0;
    vb = i < b.length ? ALPHA_BITS.indexOf(b.charAt(i)) : 0;
    if(va < 0) va = 0;
    if(vb < 0) vb = 0;
    s += ALPHA_BITS.charAt(va | vb);
  }
  return s;
}
function compteBits(s){
  var n = 0, i, v, k;
  if(typeof s !== "string") return 0;
  for(i = 0; i < s.length; i++){
    v = ALPHA_BITS.indexOf(s.charAt(i));
    if(v <= 0) continue;
    for(k = 0; k < 6; k++) if(v & (1 << k)) n++;
  }
  return n;
}

/* ----------------------------------------------------------------
   LE PLAN DE DÉFENSE
   La carte est découpée en zones de huit cases. Pour chacune, le
   plan retient DEUX choses : le type de défense qu'on veut y voir, et
   la densité de remplissage. Ce n'est pas un plan au sens d'un calque
   figé, c'est une RECETTE : « ici des Frelons, et serré ». Le tirage
   qui la réalise change à chaque remise à zéro, si bien qu'on ne
   rejoue jamais deux fois la même carte tout en gardant le même esprit.

   Un même type peut occuper autant de zones qu'on veut : rien ne les
   relie entre elles, chaque zone est décidée dans son coin.
   ---------------------------------------------------------------- */
var PAS_ZONE = 8;                            // côté d'une zone, en cases
var ZONES_L  = Math.ceil(GW / PAS_ZONE);     // 19
var ZONES_H  = Math.ceil(GH / PAS_ZONE);     // 17
var NB_ZONES = ZONES_L * ZONES_H;            // 323

/* L'ordre de cette liste est GRAVÉ : il est encodé dans les chaînes de
   plan qui circulent entre les joueurs et dorment dans leur navigateur.
   On ajoute à la fin, jamais au milieu. L'indice 0 veut dire « laisse
   la génération décider », c'est le pinceau neutre. La cellule
   énergétique n'y est pas : elle a son propre bit, parce qu'un champ
   de cellules se pose PAR-DESSUS les défenses, il ne les remplace pas.

   « vide » est la gomme forte : là où elle passe, RIEN ne pousse —
   ni défense du quadrillage, ni renfort, ni mirador, ni champ de
   cellules. C'est le seul type qui retire au lieu d'ajouter. */
var TYPES_PLAN = ["auto", "crible", "chalumeau", "frelon", "pilon",
                  "bobine", "cuve", "silo", "vide"];

/* Densités. 0 = « comme d'habitude ». Les autres remplacent la
   proportion de nœuds sautés du quadrillage : plus on saute, plus la
   zone est clairsemée. Le quadrillage d'origine en saute 28 %.

   « saut » vaut pour le quadrillage principal, un nœud toutes les
   cinq cases. « sup », quand il est donné, vaut pour la passe de
   renfort intercalaire — celle qui pose une défense au CENTRE de
   chaque maille. À sup:0 les deux quadrillages sont pleins et la
   zone porte deux fois plus de défenses que « 100 % ». C'est le
   maximum absolu que la carte peut contenir. */
var DENSITES = [
  { nom:"d'origine", saut:0.28 },
  { nom:"clairsemé", saut:0.62 },
  { nom:"fourni",    saut:0.28 },
  { nom:"saturé",    saut:0.04 },
  { nom:"100 %",     saut:0.00 },
  { nom:"surchargé", saut:0.00, sup:0.00 }
];
/* Le saut de la passe de renfort : elle ne pose qu'un septième de ce
   que poserait le quadrillage principal, sauf densité qui le dit. */
function sautRenfort(zd){
  var D = zd ? DENSITES[zd] : null;
  if(D && typeof D.sup === "number") return D.sup;
  return 1 - (1 - (D ? D.saut : 0.28)) * 0.1486;
}

/* Une zone tient dans un octet : 4 bits de type, 3 de densité, 1 pour
   le champ de cellules. Un seul endroit sait le découper. */
function zoneType(z){ return z & 15; }
function zoneDens(z){ return (z >> 4) & 7; }
function zoneChamp(z){ return (z >> 7) & 1; }
function faitZone(t, d, champ){ return (t & 15) | ((d & 7) << 4) | (champ ? 128 : 0); }
function zoneEstVide(z){ return TYPES_PLAN[zoneType(z)] === "vide"; }

function zoneDePlan(gx, gy){
  var zx = (gx / PAS_ZONE) | 0, zy = (gy / PAS_ZONE) | 0;
  if(zx < 0) zx = 0; if(zx >= ZONES_L) zx = ZONES_L - 1;
  if(zy < 0) zy = 0; if(zy >= ZONES_H) zy = ZONES_H - 1;
  return zy * ZONES_L + zx;
}
/* ----------------------------------------------------------------
   DEUX FORMATS DE PLAN, ET IL FAUT LES DEUX

   v1 — cinq bits par zone : trois de type, deux de densité. Ce format
   circule déjà entre les joueurs et dort dans leur navigateur ; on ne
   peut pas le réinterpréter sans réécrire la carte de tous les salons
   en cours. Il se lit donc encore, exactement comme avant.

   v2 — huit bits par zone : quatre de type (il n'y avait plus de place
   pour la gomme forte), trois de densité (idem pour « 100 % » et
   « surchargé »), un pour le champ de cellules. Reconnaissable à son
   préfixe « ~ », qui n'appartient pas à l'alphabet d'encodeBits et ne
   peut donc jamais apparaître en tête d'une chaîne v1.

   323 zones × 8 = 2584 bits, soit 431 caractères. C'est le plus gros
   champ de l'instantané, et c'est sans conséquence : il voyage dans
   le même paquet JSON que le bitmap des destructions.
   ---------------------------------------------------------------- */
var MARQUE_PLAN2 = "~";
/* Cellules semées par une zone peinte au pinceau « Cellules ». Une
   zone fait 8×8 cases : vingt-huit cellules la remplissent sans la
   tasser. */
var NB_CELL_PEINTES = 28;

function encodePlan(zones){
  var bits = [], i, k, rien = 1;
  for(i = 0; i < NB_ZONES; i++){
    var z = zones[i] || 0;
    var t = zoneType(z), d = zoneDens(z), ch = zoneChamp(z);
    if(t >= TYPES_PLAN.length) t = 0;
    if(t || d || ch) rien = 0;
    for(k = 0; k < 4; k++) bits.push((t >> k) & 1);
    for(k = 0; k < 3; k++) bits.push((d >> k) & 1);
    bits.push(ch);
  }
  return rien ? "" : MARQUE_PLAN2 + encodeBits(bits);   // tout d'origine == rien à dire
}
/* decodeBits rend des zéros pour une entrée absente, inconnue ou
   tronquée : un plan corrompu dégénère zone par zone en « auto »,
   c'est-à-dire exactement la carte d'aujourd'hui. Le mode dégradé du
   plan est le jeu tel qu'il est. */
function decodePlan(s){
  var z = [], i, b, t, d;
  if(typeof s === "string" && s.charAt(0) === MARQUE_PLAN2){
    var b2 = decodeBits(s.substr(1), NB_ZONES * 8);
    for(i = 0; i < NB_ZONES; i++){
      b = i * 8;
      t = b2[b] | (b2[b+1] << 1) | (b2[b+2] << 2) | (b2[b+3] << 3);
      d = b2[b+4] | (b2[b+5] << 1) | (b2[b+6] << 2);
      if(t >= TYPES_PLAN.length) t = 0;
      z.push(faitZone(t, d, b2[b+7]));
    }
    return z;
  }
  var bits = decodeBits(s, NB_ZONES * 5);
  for(i = 0; i < NB_ZONES; i++){
    b = i * 5;
    t = bits[b] | (bits[b+1] << 1) | (bits[b+2] << 2);
    d = bits[b+3] | (bits[b+4] << 1);
    if(t >= TYPES_PLAN.length) t = 0;
    z.push(faitZone(t, d, 0));
  }
  return z;
}
function planVide(){
  var z = [], i;
  for(i = 0; i < NB_ZONES; i++) z.push(0);
  return z;
}
/* Combien de zones le joueur a réellement peintes. */
function zonesPeintes(zones){
  var n = 0, i;
  for(i = 0; i < NB_ZONES; i++) if(zones[i]) n++;
  return n;
}

/* ----------------------------------------------------------------
   LE PLAN INTÉGRÉ DE LA JUNGLE

   La carte événement doit être BEAUCOUP plus dense que les cinq
   autres. Plutôt qu'un générateur à part, elle porte son propre plan
   de défense : la même chaîne que produit l'éditeur, mais figée dans
   le code. genereCarte() ne voit donc aucune différence — c'est la
   machinerie du plan qui fait tout le travail, et la densité de la
   jungle se règle ici, à un endroit, en clair.

   La recette, et POURQUOI elle est ce qu'elle est :
     — « surchargé » dans le gros du terrain : les deux quadrillages
       pleins, soit deux fois la densité d'une carte normale ;
     — le type laissé en « auto », pour garder le bandage naturel du
       générateur : missiles près du Brasier, artillerie au loin ;
     — un semis de cellules énergétiques une zone sur cinq, en
       quinconce, pour que la récolte se fasse SOUS le feu ;
     — des CLAIRIÈRES à la gomme forte, en diagonale : de vrais
       passages, et des trouées où l'on voit le ciel. Sans elles une
       carte uniformément saturée n'est plus un terrain, c'est un mur ;
     — et surtout des ALLÉES clairsemées entre les massifs.

   Cette dernière ligne n'est pas décorative, elle est vitale. Mesuré :
   à « surchargé » partout, le générateur ne pose plus que DEUX
   miradors sur l'île au lieu de soixante-huit — sa passe de miradors
   cherche une place libre, et une carte saturée n'en a plus. Or le
   mirador est le seul contre-feu de l'Ogre. Les allées clairsemées lui
   rendent de la place : 24 miradors, pour 1022 défenses (1,65 fois une
   carte normale) et 1143 cellules. Les périodes 13 et 4 sont réglées à
   la mesure ; changer l'une d'elles se paie au comptant sur ces trois
   nombres, et la période 5 du semis de cellules ne doit pas tomber en
   phase avec celle des allées, faute de quoi la récolte s'effondre de
   1143 cellules à 115.

   Calculé à la demande et mémoïsé : NB_ZONES et faitZone() sont
   déclarés plus bas dans le fichier, un calcul au chargement ici
   lirait des variables encore vides.
   ---------------------------------------------------------------- */
var planJungleCache = null;
function planJungle(){
  if(planJungleCache !== null) return planJungleCache;
  var z = planVide(), i, zx, zy;
  for(i = 0; i < NB_ZONES; i++){
    zx = i % ZONES_L; zy = (i / ZONES_L) | 0;
    /* les clairières, rares : une diagonale sur treize */
    if((zx + zy) % 13 === 0){ z[i] = faitZone(8, 0, 0); continue; }
    /* les allées, régulières : c'est là que tiennent les miradors */
    if((zx - zy + 40) % 4 === 0){ z[i] = faitZone(0, 1, 0); continue; }
    /* et partout ailleurs, le mur de défenses */
    var champ = ((zx * 3 + zy * 2) % 5) === 0 ? 1 : 0;
    z[i] = faitZone(0, 5, champ);
  }
  planJungleCache = encodePlan(z);
  return planJungleCache;
}
/* ----------------------------------------------------------------
   UN PLAN PAR CARTE

   LE DÉFAUT QUE CECI CORRIGE. Le salon ne portait qu'UNE chaîne de
   plan, et genereCarte la recevait quel que soit l'index de l'île.
   Peindre la plage repeignait donc aussi la forêt, la campagne, la
   soirée hippie et le Sud — mesuré : un plan « Frelon saturé » sur la
   moitié gauche donnait 377, 393, 379, 390 et 384 Frelons sur les cinq
   cartes. Les cinq îles n'avaient pas d'identité : elles avaient le
   même plan sous cinq décors.

   LE PAQUET. Une seule chaîne porte désormais tous les plans, indexés
   par carte : « 0:~AAA|3:~BBB ». Seules les cartes réellement éditées
   y figurent, donc une campagne où l'on n'a touché qu'à la plage ne
   coûte pas plus qu'avant. Les deux séparateurs sont sûrs : l'alphabet
   d'encodeBits ne contient ni « : » ni « | », et la marque de version
   des plans est « ~ ».

   LA COMPATIBILITÉ. Un ancien plan global — une chaîne sans « : » —
   est relu comme le plan de la CARTE 0. C'est la lecture la moins
   surprenante : le joueur qui avait peint son plan pensait peindre la
   première île, et c'est ce qu'il obtient. Les quatre autres
   retrouvent leur carte d'origine du même coup.
   ---------------------------------------------------------------- */
function encodePlans(tab){
  var l = [], k;
  for(k in tab){
    var s = tab[k];
    if(!s || typeof s !== "string") continue;
    l.push((k | 0) + ":" + s);
  }
  /* tri par index : deux clients au même état doivent produire
     exactement la même chaîne, sinon ils se republieraient l'un
     l'autre sans fin */
  l.sort(function(a, b){ return parseInt(a, 10) - parseInt(b, 10); });
  return l.join("|");
}
function decodePlans(s){
  var out = {};
  if(!s || typeof s !== "string") return out;
  /* Un ancien plan global n'a pas de « index: » en tête. On le rend à
     la carte 0, celle que son auteur croyait peindre. */
  if(s.indexOf(":") < 0){ out[0] = s; return out; }
  var p = s.split("|");
  for(var i = 0; i < p.length; i++){
    var j = p[i].indexOf(":");
    if(j <= 0) continue;
    var idx = parseInt(p[i].substr(0, j), 10);
    var ch = p[i].substr(j + 1);
    if(!(idx >= 0) || !ch) continue;
    out[idx] = ch;
  }
  return out;
}
/* Le plan d'UNE carte, tiré du paquet du salon. */
function planCarte(paquet, index){
  var t = decodePlans(paquet);
  return t[index] || "";
}
/* Le plan que joue une carte donnée : le sien s'il est gravé (la
   jungle), le sien dans le paquet du salon sinon. Un seul endroit
   décide, et il ne regarde plus JAMAIS le plan d'une autre île. */
function planDeCarte(index, paquetSalon){
  if(CARTES[index] && CARTES[index].biome === "jungle"){
    /* La jungle porte un plan gravé, mais il reste éditable : un plan
       enregistré pour elle l'emporte sur celui du code. */
    return planCarte(paquetSalon, index) || planJungle();
  }
  return planCarte(paquetSalon, index);
}

/* ================================================================
   LES ZONES VECTORIELLES — dessiner au compas, plus seulement au doigt

   LE PINCEAU NE SUFFIT PLUS. Peindre des carrés de huit cases donne
   des cartes en escalier : on ne sait pas tracer un anneau de Frelons
   autour du Brasier, ni une ligne de Pilons en travers de l'île, ni
   un massif qui se vide vers ses bords. Le quadrillage n'est pas un
   défaut de l'éditeur, c'est la limite de son MODÈLE — un octet par
   zone ne peut porter qu'un type et une densité.

   CE QU'UNE FORME PORTE, ET QUE LA ZONE NE POUVAIT PAS :
     — une géométrie continue, au dixième de case et non au bloc de
       huit ;
     — une COMPOSITION : « 60 % de Frelons, 30 % de Pilons, 10 % de
       rien », là où la zone ne connaissait qu'un seul type ;
     — une RÉPARTITION : le même mélange semé au hasard, ou étalé au
       plus égal, ou en damier, ou concentré au cœur ;
     — sa propre graine, pour qu'un massif reste identique d'une
       partie à l'autre pendant que le reste de l'île se rejoue.

   COMMENT ELLE COHABITE AVEC LE PINCEAU. Les formes sont une couche
   AU-DESSUS du quadrillage, pas à sa place. Pour un point donné on
   demande d'abord aux formes — la dernière posée l'emporte — et à
   défaut on retombe sur la zone peinte, et à défaut sur « auto ».
   Un plan sans forme se comporte donc exactement comme avant, au bit
   près : c'est la seule façon de ne pas casser les salons en cours.

   LA RÈGLE QUI COMMANDE TOUT LE RESTE : une forme ne consomme AUCUN
   tirage du générateur. Tout ce qu'elle décide — quel type ici,
   quelle densité là — sort d'un hachage de la position. Sans ça,
   ajouter un cercle dans un coin rebattrait toute l'île derrière lui,
   et l'éditeur deviendrait inutilisable : on ne dessine pas quand
   chaque trait redessine le reste.
   ================================================================ */

/* L'ordre est GRAVÉ, comme celui des types : il est encodé dans les
   plans qui circulent entre les joueurs. On ajoute à la fin. */
var FORMES_PLAN = [
  { nom:"Cercle",    n:3, desc:"centre et rayon" },
  { nom:"Anneau",    n:4, desc:"centre, rayon intérieur et extérieur" },
  { nom:"Rectangle", n:4, desc:"coin, largeur et hauteur" },
  { nom:"Ligne",     n:5, desc:"deux bouts et une épaisseur" },
  { nom:"Polygone",  n:0, desc:"autant de sommets qu'on veut" }
];
/* Sur quoi la forme agit. Le champ de cellules se pose PAR-DESSUS les
   défenses, il ne les remplace pas — d'où le troisième choix. */
var COUCHES_PLAN = ["Défenses", "Cellules", "Les deux"];

/* Les répartitions. Toutes respectent les pourcentages demandés :
   elles ne changent pas les PROPORTIONS, elles changent la façon dont
   le mélange se pose sur le terrain. */
var REPARTITIONS = [
  { nom:"Au hasard",  desc:"tiré au sort case par case. Il se forme des paquets, et c'est ce qui fait l'air naturel." },
  { nom:"Harmonieux", desc:"étalé au plus égal : chaque type est partout, jamais en paquet. La suite R2, la même qui sème les étoiles sans grumeaux." },
  { nom:"Damier",     desc:"alterné en diagonale, maille par maille. Un mélange serré, parfaitement régulier." },
  { nom:"Bandes",     desc:"en bandes parallèles, du nord au sud." },
  { nom:"Cœur",       desc:"les premiers de la liste au centre, les derniers au bord — et ça se vide en s'éloignant." },
  { nom:"Pourtour",   desc:"l'inverse : le vide au milieu, la couronne dense." },
  { nom:"Dégradé",    desc:"on passe du premier au dernier d'un bout à l'autre de la forme." }
];

/* La marque qui sépare le quadrillage des formes dans une chaîne de
   plan. Ni « ~ » (la version du plan), ni « : » ou « | » (le paquet
   des six cartes), ni un caractère d'ALPHA_BITS : elle ne peut donc
   apparaître nulle part ailleurs par accident. */
var MARQUE_FORMES = "*";

/* ----------------------------------------------------------------
   LE HACHAGE DE POSITION
   Ce qui remplace le tirage aléatoire à l'intérieur d'une forme. Deux
   propriétés, et les deux sont vitales :
     — il ne consomme rien de la séquence du générateur ;
     — il rend toujours la même chose au même endroit, donc une forme
       se redessine à l'identique tant qu'on n'y touche pas.
   ---------------------------------------------------------------- */
function bruitForme(gx, gy, sel){
  var x = Math.round(gx * 4), y = Math.round(gy * 4);
  var h = ((x * 73856093) ^ (y * 19349663) ^ ((sel | 0) * 83492791)) >>> 0;
  h ^= h >>> 13; h = (h * 1274126177) >>> 0; h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/* ----------------------------------------------------------------
   GÉOMÉTRIE
   formeContient dit si un point est dedans. paramForme rend 0 au cœur
   et 1 au bord — c'est lui qui porte « concentré ». longForme rend 0
   à un bout et 1 à l'autre, pour le dégradé.
   ---------------------------------------------------------------- */
function formeContient(F, gx, gy){
  var G = F.G;
  if(!G) return false;
  switch(F.f){
    case 0: return Math.hypot(gx - G[0], gy - G[1]) <= G[2];
    case 1: var dA = Math.hypot(gx - G[0], gy - G[1]);
            return dA >= Math.min(G[2], G[3]) && dA <= Math.max(G[2], G[3]);
    case 2: return gx >= G[0] && gx <= G[0] + G[2] && gy >= G[1] && gy <= G[1] + G[3];
    case 3: return distSegmentPlan(gx, gy, G[0], G[1], G[2], G[3]) <= G[4] * 0.5;
    case 4: return dansPolygone(G, gx, gy);
  }
  return false;
}
function distSegmentPlan(px, py, x1, y1, x2, y2){
  var dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
  if(l2 < 1e-9) return Math.hypot(px - x1, py - y1);
  var t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = t < 0 ? 0 : (t > 1 ? 1 : t);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
/* Lancer de rayon horizontal, la méthode de parité. Un sommet posé
   exactement sur la ligne du rayon ne compte qu'une fois grâce à la
   comparaison asymétrique sur y. */
function dansPolygone(G, px, py){
  var n = G.length >> 1;
  if(n < 3) return false;
  var dedans = false, i, j;
  for(i = 0, j = n - 1; i < n; j = i++){
    var xi = G[i * 2], yi = G[i * 2 + 1], xj = G[j * 2], yj = G[j * 2 + 1];
    if((yi > py) !== (yj > py) &&
       px < (xj - xi) * (py - yi) / ((yj - yi) || 1e-9) + xi) dedans = !dedans;
  }
  return dedans;
}
/* Le centre d'une forme, et sa demi-étendue : de quoi normaliser une
   position sans refaire un cas par forme partout. */
function centreForme(F){
  var G = F.G, i, sx = 0, sy = 0, n;
  switch(F.f){
    case 0: case 1: return { x:G[0], y:G[1], r:Math.max(G[2], G[3] || 0) || 1 };
    case 2: return { x:G[0] + G[2] / 2, y:G[1] + G[3] / 2,
                     r:Math.max(Math.abs(G[2]), Math.abs(G[3])) / 2 || 1 };
    case 3: return { x:(G[0] + G[2]) / 2, y:(G[1] + G[3]) / 2,
                     r:Math.max(Math.hypot(G[2] - G[0], G[3] - G[1]) / 2, G[4] / 2) || 1 };
    case 4:
      n = G.length >> 1;
      for(i = 0; i < n; i++){ sx += G[i * 2]; sy += G[i * 2 + 1]; }
      var cx = sx / n, cy = sy / n, r = 1;
      for(i = 0; i < n; i++) r = Math.max(r, Math.hypot(G[i * 2] - cx, G[i * 2 + 1] - cy));
      return { x:cx, y:cy, r:r };
  }
  return { x:0, y:0, r:1 };
}
/* 0 au cœur, 1 au bord. L'anneau est le seul cas où « le cœur » n'est
   pas le centre géométrique : c'est le milieu de la couronne. */
function paramForme(F, gx, gy){
  var G = F.G, C;
  if(F.f === 1){
    var r0 = Math.min(G[2], G[3]), r1 = Math.max(G[2], G[3]);
    var d = Math.hypot(gx - G[0], gy - G[1]);
    var mi = (r0 + r1) / 2, dm = (r1 - r0) / 2 || 1;
    return Math.min(1, Math.abs(d - mi) / dm);
  }
  C = centreForme(F);
  return Math.min(1, Math.hypot(gx - C.x, gy - C.y) / C.r);
}
/* 0 à un bout, 1 à l'autre. Pour une ligne c'est sa longueur ; pour
   tout le reste, l'axe le plus long de la boîte. */
function longForme(F, gx, gy){
  var G = F.G;
  if(F.f === 3){
    var dx = G[2] - G[0], dy = G[3] - G[1], l2 = dx * dx + dy * dy;
    if(l2 < 1e-9) return 0;
    return Math.min(1, Math.max(0, ((gx - G[0]) * dx + (gy - G[1]) * dy) / l2));
  }
  var C = centreForme(F);
  if(F.f === 2 && Math.abs(G[3]) > Math.abs(G[2])){
    return Math.min(1, Math.max(0, (gy - G[1]) / (G[3] || 1)));
  }
  return Math.min(1, Math.max(0, (gx - (C.x - C.r)) / (C.r * 2)));
}

/* ----------------------------------------------------------------
   CE QUE LA FORME DÉCIDE EN UN POINT
   ---------------------------------------------------------------- */
/* ----------------------------------------------------------------
   LA FRACTION D'AIRE — ce qui fait qu'un 70 / 30 concentré donne bien
   soixante-dix pour cent.

   LE PIÈGE, et il est joli : paramForme rend une fraction de RAYON, et
   sur un disque la moitié du rayon ne couvre que le quart de la
   surface. Ranger « les 70 premiers pour cent au cœur » d'après le
   rayon donnait donc 38 % de Frelons pour 70 % demandés — mesuré, et
   c'est exactement π·0,7² / 4 sur un carré. Le joueur aurait réglé un
   curseur sur 70 et obtenu 38 : le curseur aurait menti.

   La correction n'a pas de forme close pour un polygone quelconque, et
   n'en a pas besoin : on MESURE la forme une fois — seize cents points
   sur sa boîte — et la table qui en sort convertit une distance en
   fraction de surface. Elle dort sur la forme, donc une carte de mille
   nœuds ne la calcule qu'une fois. L'éditeur l'efface dès qu'il touche
   à la géométrie, sinon elle mentirait à son tour.
   ---------------------------------------------------------------- */
var SEAUX_FORME = 64;
function boiteForme(F){
  var G = F.G, i, n, x0, y0, x1, y1, R, e;
  switch(F.f){
    case 0: return { x0:G[0] - G[2], y0:G[1] - G[2], x1:G[0] + G[2], y1:G[1] + G[2] };
    case 1: R = Math.max(G[2], G[3]);
            return { x0:G[0] - R, y0:G[1] - R, x1:G[0] + R, y1:G[1] + R };
    case 2: return { x0:Math.min(G[0], G[0] + G[2]), y0:Math.min(G[1], G[1] + G[3]),
                     x1:Math.max(G[0], G[0] + G[2]), y1:Math.max(G[1], G[1] + G[3]) };
    case 3: e = G[4] * 0.5;
            return { x0:Math.min(G[0], G[2]) - e, y0:Math.min(G[1], G[3]) - e,
                     x1:Math.max(G[0], G[2]) + e, y1:Math.max(G[1], G[3]) + e };
    case 4: n = G.length >> 1; x0 = y0 = 1e9; x1 = y1 = -1e9;
            for(i = 0; i < n; i++){
              x0 = Math.min(x0, G[i * 2]); x1 = Math.max(x1, G[i * 2]);
              y0 = Math.min(y0, G[i * 2 + 1]); y1 = Math.max(y1, G[i * 2 + 1]);
            }
            return { x0:x0, y0:y0, x1:x1, y1:y1 };
  }
  return { x0:0, y0:0, x1:1, y1:1 };
}
/* Le paramètre que la répartition choisie fait varier : la distance au
   cœur, ou la position le long de l'axe. */
function parametreRange(F, gx, gy){
  if(F.r === 6) return longForme(F, gx, gy);
  if(F.r === 5) return 1 - paramForme(F, gx, gy);
  return paramForme(F, gx, gy);
}
function tableForme(F){
  if(F._q) return F._q;
  var B = boiteForme(F), M = 40, h = [], i, j, k, tot = 0;
  for(i = 0; i < SEAUX_FORME; i++) h.push(0);
  for(i = 0; i < M; i++) for(j = 0; j < M; j++){
    var gx = B.x0 + (B.x1 - B.x0) * (i + 0.5) / M;
    var gy = B.y0 + (B.y1 - B.y0) * (j + 0.5) / M;
    if(!formeContient(F, gx, gy)) continue;
    k = Math.floor(parametreRange(F, gx, gy) * SEAUX_FORME);
    h[k < 0 ? 0 : (k >= SEAUX_FORME ? SEAUX_FORME - 1 : k)]++;
    tot++;
  }
  var c = [], cum = 0;
  for(i = 0; i < SEAUX_FORME; i++){
    cum += h[i];
    c.push(tot ? cum / tot : (i + 1) / SEAUX_FORME);
  }
  F._q = c;
  return c;
}
function fractionAire(F, p){
  var c = tableForme(F);
  var e = p * SEAUX_FORME;
  var k = Math.floor(e);
  if(k < 0) k = 0; else if(k >= SEAUX_FORME) k = SEAUX_FORME - 1;
  var bas = k ? c[k - 1] : 0;
  return bas + (c[k] - bas) * Math.min(1, Math.max(0, e - k));
}
/* À appeler dès qu'on touche à la géométrie ou à la répartition d'une
   forme : la table mesurée ne vaut plus rien. */
function formeChangee(F){ if(F) F._q = null; return F; }

/* La position dans le mélange, entre 0 et 1. C'est ELLE qui porte la
   répartition ; la conversion en type est la même pour toutes, si
   bien qu'aucun mode ne peut trahir les pourcentages demandés. */
function placeDansMelange(F, gx, gy, sel){
  var t, b = bruitForme(gx, gy, sel), i, j;
  switch(F.r){
    case 1:   /* harmonieux — la suite R2, du nombre plastique. Elle
                 couvre le plan sans grumeau ni alignement, ce qu'aucun
                 tirage au sort ne sait faire. */
      t = (gx * 0.7548776662 + gy * 0.5698402909 + sel * 0.1010101);
      return t - Math.floor(t);
    case 2:   /* damier — la diagonale, hachée par un pas premier avec
                 cent pour que deux voisines ne tombent jamais dans la
                 même bande */
      i = Math.round(gx) + Math.round(gy);
      return (((i * 37) % 100) + 0.5) / 100;
    case 3:   /* bandes */
      j = Math.round(gy);
      return (((j * 37) % 100) + 0.5) / 100;
    /* Les trois qui suivent rangent les types selon la POSITION, et
       passent donc par la fraction d'aire : sans elle, le curseur des
       pourcentages mentirait. Un peu de bruit par-dessus, pour que la
       frontière entre deux types ne soit pas un cercle tracé au
       compas — symétrique, donc sans effet sur les proportions. */
    case 4:   /* cœur — les premiers au centre */
    case 5:   /* pourtour — l'inverse */
    case 6:   /* dégradé — d'un bout à l'autre */
      return Math.min(0.999, Math.max(0,
        fractionAire(F, parametreRange(F, gx, gy)) + (b - 0.5) * 0.10));
  }
  return b;                                   /* 0 — au hasard */
}
/* La graine qui sert le hachage. Une forme « fixe » garde la sienne
   d'une partie à l'autre ; les autres suivent le tirage du salon, donc
   se rejouent différemment à chaque remise à zéro — c'est l'esprit du
   plan : une recette, pas un calque. */
function selForme(F, tirage){
  return F.x ? (F.g | 0) : ((F.g | 0) + (tirage | 0) * 7919);
}
/* Le type posé en un point : la bande du mélange où tombe la place. */
function typeDeForme(F, gx, gy, tirage){
  var C = F.C;
  if(!C || !C.length) return 0;                       // rien de dit : « auto »
  if(C.length === 1) return C[0][0];
  var u = placeDansMelange(F, gx, gy, selForme(F, tirage));
  var somme = 0, i;
  for(i = 0; i < C.length; i++) somme += C[i][1];
  if(somme <= 0) return C[0][0];
  var seuil = u * somme, cum = 0;
  for(i = 0; i < C.length; i++){
    cum += C[i][1];
    if(seuil < cum) return C[i][0];
  }
  return C[C.length - 1][0];
}
/* La proportion de nœuds sautés. « Cœur » et « Pourtour » ne font pas
   que trier les types : ils font aussi VARIER la densité, sinon le mot
   « concentré » ne voudrait rien dire. */
function sautDeForme(F){
  var D = DENSITES[F.d] || DENSITES[0];
  return D.saut;
}
function sautModuleForme(F, gx, gy){
  var s = sautDeForme(F);
  if(F.r !== 4 && F.r !== 5) return s;
  var t = paramForme(F, gx, gy);
  var k = (F.r === 4) ? t : (1 - t);
  return s + (1 - s) * Math.pow(k, 1.6) * 0.85;
}

/* ----------------------------------------------------------------
   ENCODAGE
   Champs positionnels séparés par des virgules, formes séparées par
   des points-virgules, listes séparées par des points. Aucun de ces
   trois caractères n'appartient à ALPHA_BITS ni aux séparateurs du
   paquet des six cartes : une chaîne de formes ne peut donc jamais
   être confondue avec autre chose.

     forme , couche , densité , répartition , fixe , graine ,
     géométrie , composition

   Exemple : « 1,0,3,4,0,0,76.68.18.34,3.60.4.40 » — un anneau de
   rayons 18 à 34 autour du Brasier, saturé, concentré au cœur,
   soixante pour cent de Frelons et quarante de Pilons.
   ---------------------------------------------------------------- */
function entierPlan(v){
  var n = Math.round(+v);
  if(!isFinite(n)) return 0;
  return n < -9999 ? -9999 : (n > 9999 ? 9999 : n);
}
function encodeFormes(l){
  if(!l || !l.length) return "";
  var out = [], i, j;
  for(i = 0; i < l.length; i++){
    var F = l[i], G = [], C = [];
    for(j = 0; j < F.G.length; j++) G.push(entierPlan(F.G[j]));
    for(j = 0; j < F.C.length; j++) C.push((F.C[j][0] | 0) + "." + entierPlan(F.C[j][1]));
    out.push([F.f | 0, F.k | 0, F.d | 0, F.r | 0, F.x ? 1 : 0, entierPlan(F.g),
              G.join("."), C.join(".")].join(","));
  }
  return out.join(";");
}
/* Défensif de bout en bout : une forme illisible est jetée, pas
   devinée. Le mode dégradé du plan reste la carte d'aujourd'hui. */
function decodeFormes(s){
  var l = [];
  if(!s || typeof s !== "string") return l;
  var p = s.split(";"), i, j;
  for(i = 0; i < p.length; i++){
    if(!p[i]) continue;
    var ch = p[i].split(",");
    if(ch.length < 8) continue;
    var f = parseInt(ch[0], 10) | 0;
    if(!(f >= 0) || f >= FORMES_PLAN.length) continue;
    var G = [], gs = ch[6].split(".");
    for(j = 0; j < gs.length; j++){
      var v = parseFloat(gs[j]);
      if(!isFinite(v)) { G = []; break; }
      G.push(v);
    }
    var att = FORMES_PLAN[f].n;
    if(att ? G.length !== att : (G.length < 6 || G.length & 1)) continue;
    var C = [], cs = ch[7] ? ch[7].split(".") : [];
    for(j = 0; j + 1 < cs.length; j += 2){
      var t = parseInt(cs[j], 10), pc = parseFloat(cs[j + 1]);
      if(!(t >= 0) || t >= TYPES_PLAN.length || !isFinite(pc) || pc <= 0) continue;
      C.push([t, pc]);
    }
    var d = parseInt(ch[2], 10) | 0, r = parseInt(ch[3], 10) | 0, k = parseInt(ch[1], 10) | 0;
    l.push({
      f:f, k:(k >= 0 && k < COUCHES_PLAN.length) ? k : 0,
      d:(d >= 0 && d < DENSITES.length) ? d : 0,
      r:(r >= 0 && r < REPARTITIONS.length) ? r : 0,
      x:parseInt(ch[4], 10) ? 1 : 0, g:parseInt(ch[5], 10) | 0,
      G:G, C:C
    });
  }
  return l;
}
/* Une chaîne de plan complète : le quadrillage, puis les formes. */
function encodePlanComplet(zones, formes){
  var a = encodePlan(zones), b = encodeFormes(formes);
  return b ? (a + MARQUE_FORMES + b) : a;
}
function partieQuadrillage(s){
  if(typeof s !== "string") return "";
  var i = s.indexOf(MARQUE_FORMES);
  return i < 0 ? s : s.substr(0, i);
}
function partieFormes(s){
  if(typeof s !== "string") return "";
  var i = s.indexOf(MARQUE_FORMES);
  return i < 0 ? "" : s.substr(i + 1);
}

/* ----------------------------------------------------------------
   LA LECTURE DU PLAN PAR LE GÉNÉRATEUR
   Un seul objet, un seul point d'interrogation. genereCarte ne sait
   plus si la réponse vient d'un cercle ou d'un coup de pinceau — et
   c'est exactement ce qu'on veut : le jour où l'on ajoutera une
   troisième façon de décrire une carte, elle entrera ici.
   ---------------------------------------------------------------- */
function litPlan(chaine, tirage){
  var q = partieQuadrillage(chaine);
  var zones = (q && q.length) ? decodePlan(q) : null;
  if(zones && !zonesPeintes(zones)) zones = null;
  var formes = decodeFormes(partieFormes(chaine));
  if(!zones && !formes.length) return null;      // aucune intention : carte d'origine
  return { zones:zones, formes:formes, tirage:tirage | 0 };
}
/* La dernière forme posée l'emporte : c'est l'ordre d'une pile de
   calques, celui que l'œil attend quand on empile des dessins. */
function formeSous(P, gx, gy){
  var l = P.formes, i;
  for(i = l.length - 1; i >= 0; i--) if(formeContient(l[i], gx, gy)) return l[i];
  return null;
}
/* CE QUE LE PLAN DIT D'UN POINT. Cinq endroits de genereCarte posent
   cette question ; ils la posent tous ici.
     t       indice dans TYPES_PLAN, 0 pour « laisse la génération
             décider »
     ch      1 si l'on veut un champ de cellules
     saut    proportion de nœuds sautés par le quadrillage principal
     sautSup la même chose pour la passe de renfort */
function planEn(P, gx, gy){
  var zr = (P.zones ? P.zones[zoneDePlan(gx, gy)] : 0) || 0;
  var t = zoneType(zr), d = zoneDens(zr), ch = zoneChamp(zr);
  var F = P.formes.length ? formeSous(P, gx, gy) : null;
  if(F){
    /* La couche décide de ce que la forme touche. « Cellules » ne
       remplace rien : elle ajoute sa couche et laisse les défenses au
       quadrillage, exactement comme le pinceau à cellules. */
    if(F.k !== 1){
      t = typeDeForme(F, gx, gy, P.tirage);
      return { t:t, ch:(F.k === 2 ? 1 : ch), vide:(TYPES_PLAN[t] === "vide") ? 1 : 0,
               saut:sautModuleForme(F, gx, gy), sautSup:sautRenfort(F.d) };
    }
    ch = 1;
  }
  return { t:t, ch:ch, vide:(TYPES_PLAN[t] === "vide") ? 1 : 0,
           saut:d ? DENSITES[d].saut : 0.28, sautSup:sautRenfort(d) };
}
/* Combien de formes, et combien de zones : de quoi dire à l'éditeur
   si un plan est vide sans avoir à le regarder en détail. */
function planEstVide(P){
  return !P || (!P.formes.length && (!P.zones || !zonesPeintes(P.zones)));
}

function mondeVide(index, pvMax, cycle){
  return { v:0, cy:cycle | 0, c:index | 0, pv:pvMax, d:"", g:"", w:"",
           p:"", pn:0, tg:0, s:"", k:"",
           je:0, jf:0, jd:"", jq:0, jt:0, jm:EQ.JUNGLE_MIN_JOUEURS, jmn:0, ch:"",
           jb:EQ.JUNGLE_PV_BONUS };
}
function mondeValide(m){
  return !!m && typeof m.c === "number" && typeof m.pv === "number" &&
         typeof m.v === "number" && m.c >= 0 && m.pv >= 0;
}

/* ----------------------------------------------------------------
   LE TABLEAU DES DÉGÂTS, DANS L'INSTANTANÉ PARTAGÉ

   Il ne vivait que dans la mémoire de chaque joueur : celui qui avait
   démonté trois millions de points de défenses disparaissait du
   classement dès qu'il fermait son navigateur, et un joueur arrivé
   après lui ne l'y voyait jamais. Le score appartient au SALON, pas à
   la session qui l'a observé — il part donc dans l'instantané retenu,
   au même titre que les bâtiments détruits.

   Format : « nom:dégâts|nom:dégâts ». Les deux séparateurs sont
   retirés des pseudos à l'encodage, ce qui suffit : un pseudo fait au
   plus quatorze caractères et n'a pas d'autre structure à préserver.
   ---------------------------------------------------------------- */
var SCORES_GARDES = 8;          // on retient les huit meilleurs, on affiche trois

function encodeScores(tab){
  var l = [], k;
  for(k in tab){
    var n = String(k).replace(/[|:]/g, "").substr(0, 14);
    var g = Math.max(0, Math.round(tab[k] || 0));
    if(!n || !g) continue;
    l.push({ n:n, g:g });
  }
  /* tri décroissant, puis par nom : deux clients qui ont les mêmes
     scores doivent produire exactement la même chaîne, sinon ils se
     republieraient mutuellement à l'infini */
  l.sort(function(a, b){ return b.g - a.g || (a.n < b.n ? -1 : a.n > b.n ? 1 : 0); });
  l = l.slice(0, SCORES_GARDES);
  return l.map(function(e){ return e.n + ":" + e.g; }).join("|");
}
function decodeScores(s){
  var out = {};
  if(!s || typeof s !== "string") return out;
  var p = s.split("|");
  for(var i = 0; i < p.length; i++){
    var j = p[i].lastIndexOf(":");
    if(j <= 0) continue;
    var n = p[i].substr(0, j), g = parseInt(p[i].substr(j + 1), 10);
    if(!n || !(g > 0)) continue;
    if(!out[n] || g > out[n]) out[n] = g;
  }
  return out;
}
/* Union par pseudo, en gardant le PLUS GRAND score de chacun. Comme
   unionBits : commutative, associative, idempotente, et monotone — un
   score ne redescend jamais, quel que soit l'ordre d'arrivée. */
function fusionneScores(a, b){
  var x = decodeScores(a), y = decodeScores(b), k;
  for(k in y) if(!x[k] || y[k] > x[k]) x[k] = y[k];
  return encodeScores(x);
}
/* ----------------------------------------------------------------
   LES TROIS CHATS, DANS L'INSTANTANÉ PARTAGÉ
   Trois cases séparées par « | », dans l'ordre de ESPECES_PROTEGEES :
   le pseudo de qui a tué chacun, vide tant qu'il vit. Trois cases
   plutôt qu'un nom unique, parce que trois joueurs différents peuvent
   très bien s'y coller chacun leur tour — et que le tableau d'honneur
   doit pouvoir les nommer tous les trois.
   ---------------------------------------------------------------- */
function encodeChats(o){
  var l = ESPECES_PROTEGEES.map(function(e){
    return String((o && o[e]) || "").replace(/\|/g, "").substr(0, 14);
  });
  /* « || » est un instantané vierge : on le rend sous sa forme vide,
     sinon memeMonde() verrait une différence avec mondeVide() et les
     clients se republieraient l'instantané en boucle. */
  return l.join("") ? l.join("|") : "";
}
function decodeChats(s){
  var p = (typeof s === "string" ? s : "").split("|"), o = {};
  for(var i = 0; i < ESPECES_PROTEGEES.length; i++) o[ESPECES_PROTEGEES[i]] = p[i] || "";
  return o;
}
/* Un chat ne meurt qu'une fois : une case remplie ne se vide jamais.
   Reste le cas où DEUX clients ont écrit un nom différent dans la
   même case avant de se parler — chacun a bien tué son propre chat,
   chacun a raison. « x || y » choisirait alors selon l'ordre des
   arguments, et adopteMonde passant toujours le local en premier, les
   deux se réécriraient l'instantané en boucle sans jamais converger.
   On tranche donc par le NOM, comme meilleurPlan tranche par la
   chaîne : commutatif, associatif, idempotent, et le salon converge. */
function fusionneChats(a, b){
  var x = decodeChats(a), y = decodeChats(b), o = {};
  for(var i = 0; i < ESPECES_PROTEGEES.length; i++){
    var e = ESPECES_PROTEGEES[i];
    o[e] = (x[e] && y[e]) ? (x[e] < y[e] ? x[e] : y[e]) : (x[e] || y[e] || "");
  }
  return encodeChats(o);
}

/* ================================================================
   LA VOIE DE LA JUNGLE — une progression parallèle à la campagne

   La carte événement ne peut pas vivre dans le champ « c » : ce
   champ porte la campagne, sa fusion est monotone croissante, et une
   expédition qui se termine devrait faire REDESCENDRE l'index — ce
   que la fusion refuse par construction, et à raison.

   Elle a donc sa propre voie, avec exactement la même discipline :

     je  compteur de LANCEMENTS, ne fait qu'augmenter
     jf  compteur de FINS, ne fait qu'augmenter
         → une expédition est en cours si, et seulement si, je > jf.
           Lancer, c'est je = max(je,jf)+1 ; terminer, c'est jf = je.
           Deux incréments monotones décrivent un état qui va et
           vient : c'est ce qui rend la chose fusionnable.
     jd  bâtiments détruits, jq  PV du Brasier de la jungle
         → portés par l'époque je, comme d et pv le sont par cy.
     jt  heure de la dernière victoire, en millisecondes epoch
         → le maximum gagne : une victoire plus récente écrase
           toujours une plus ancienne, donc le verrou de 48 h ne peut
           pas être raccourci par un client en retard.
     jm  minimum de joueurs, jmn son numéro de réglage
         → même motif que le plan de défense : le numéro tranche,
           puis la valeur, pour que deux administrateurs simultanés
           convergent au lieu de se réécrire en boucle.
   ================================================================ */
function jungleEnCours(m){ return !!m && (m.je | 0) > (m.jf | 0); }

/* UNE HEURE EPOCH NE TIENT PAS DANS TRENTE-DEUX BITS. Date.now() vaut
   aujourd'hui 1,77 × 10¹², et « | 0 » — l'idiome employé partout
   ailleurs dans ce fichier pour assainir un entier — le tronque en un
   nombre sans rapport, souvent négatif. Le verrou de 48 heures
   s'ouvrait alors immédiatement. Toute heure passe donc par ici, et
   par nulle part d'autre. */
function msMonde(x){
  var v = +x;
  return (isFinite(v) && v > 0) ? Math.floor(v) : 0;
}

/* Le réglage administrateur, tranché comme meilleurPlan : le numéro
   d'abord, la valeur ensuite. Commutatif, associatif, idempotent. */
function meilleurMinJoueurs(a, b){
  var va = a ? (a.jm | 0) : 0, na = a ? (a.jmn | 0) : 0;
  var vb = b ? (b.jm | 0) : 0, nb = b ? (b.jmn | 0) : 0;
  if(nb > na) return { jm:vb, jmn:nb };
  if(na > nb) return { jm:va, jmn:na };
  return vb > va ? { jm:vb, jmn:nb } : { jm:va, jmn:na };
}

/* ----------------------------------------------------------------
   LES CHAMPIONS — un par carte, indépendants les uns des autres

   « Détruite par Johan. Johan est le champion de cette carte. »
   Chaque entrée porte le NUMÉRO de la victoire qui l'a posée : c'est
   lui qui rend la fusion monotone. Sans ce numéro, « le dernier
   gagne » dépendrait de l'ordre d'arrivée des messages, et deux
   clients ne s'accorderaient jamais.

   Format : « index:nom:numéro|index:nom:numéro ». Les trois
   séparateurs sont retirés des pseudos à l'encodage — un pseudo fait
   au plus quatorze caractères et n'a pas d'autre structure à
   préserver.
   ---------------------------------------------------------------- */
function encodeChampions(tab){
  var l = [], k;
  for(k in tab){
    var e = tab[k];
    if(!e || !e.nom) continue;
    var nom = String(e.nom).replace(/[|:]/g, "").substr(0, 14);
    if(!nom) continue;
    l.push((k | 0) + ":" + nom + ":" + Math.max(1, e.n | 0));
  }
  /* tri par index : deux clients au même état doivent produire
     exactement la même chaîne, sinon ils se republieraient l'un
     l'autre sans fin */
  l.sort(function(x, y){ return (parseInt(x, 10) - parseInt(y, 10)); });
  return l.join("|");
}
function decodeChampions(s){
  var out = {};
  if(!s || typeof s !== "string") return out;
  var p = s.split("|");
  for(var i = 0; i < p.length; i++){
    var m = p[i].split(":");
    if(m.length !== 3) continue;
    var idx = parseInt(m[0], 10), n = parseInt(m[2], 10);
    if(!(idx >= 0) || !(n > 0) || !m[1]) continue;
    if(!out[idx] || n > out[idx].n) out[idx] = { nom:m[1], n:n };
  }
  return out;
}
/* Par carte, la victoire de plus haut numéro l'emporte. À numéro
   égal — deux joueurs qui publient la même victoire — le nom tranche,
   pour que l'ordre d'arrivée ne change rien. */
function fusionneChampions(a, b){
  var x = decodeChampions(a), y = decodeChampions(b), k;
  for(k in y){
    if(!x[k] || y[k].n > x[k].n) x[k] = y[k];
    else if(y[k].n === x[k].n && y[k].nom < x[k].nom) x[k] = y[k];
  }
  return encodeChampions(x);
}

/* Position d'un instantané dans la progression. Le TIRAGE domine tout :
   changer de tirage, c'est rebattre les défenses de l'île, donc les
   destructions de l'ancien tirage ne désignent plus rien. Vient
   ensuite la campagne, puis l'île. C'est cet ordre qui décide qui
   écrase qui. */
function rangMonde(m){ return (m.tg | 0) * 1000000 + (m.cy | 0) * 1000 + (m.c | 0); }

/* Deux plans concurrents. Le numéro tranche ; à numéro égal, la chaîne
   tranche. Commutatif, associatif, idempotent : converge quel que soit
   l'ordre d'arrivée, comme Math.min sur les PV. Un « a.p || b.p »
   n'aurait PAS cette propriété — adopteMonde passe toujours le local
   en premier, donc chacun aurait gardé le sien à jamais et les deux
   clients se seraient réécrit l'instantané en boucle. */
function meilleurPlan(a, b){
  var pa = (a && typeof a.p === "string") ? a.p : "", na = a ? (a.pn | 0) : 0;
  var pb = (b && typeof b.p === "string") ? b.p : "", nb = b ? (b.pn | 0) : 0;
  if(nb > na) return { p:pb, pn:nb };
  if(na > nb) return { p:pa, pn:na };
  return pb > pa ? { p:pb, pn:nb } : { p:pa, pn:na };
}

/* Fusion monotone. Une île plus avancée écrase tout : ses bâtiments
   n'ont rien à voir avec ceux de la précédente. À rang égal, une
   défense détruite ne se relève jamais et les PV ne remontent jamais —
   c'est ce qui rend l'ordre d'arrivée des messages sans importance. */
/* La voie de la jungle se fusionne À PART, et son résultat est posé
   dans les TROIS branches de fusionneMonde. C'est indispensable :
   un client peut très bien être en avance sur la campagne et en
   retard sur l'expédition. Si la branche « île plus avancée » rendait
   son instantané tel quel, elle emporterait avec elle une jungle
   périmée — et le verrou de 48 h sauterait chez tout le monde. */
function fusionneJungle(a, b){
  var je = Math.max(a.je | 0, b.je | 0);
  var jf = Math.max(a.jf | 0, b.jf | 0);
  var mj = meilleurMinJoueurs(a, b);
  var o = {
    je : je,
    jf : jf,
    /* jt ne redescend jamais : une victoire plus récente écrase
       toujours une plus ancienne, donc personne ne peut raccourcir
       le verrou en republiant un vieil instantané. */
    jt : Math.max(msMonde(a.jt), msMonde(b.jt)),
    jm : mj.jm, jmn : mj.jmn,
    /* Le bonus de PV suit le MÊME numéro de réglage que le minimum de
       joueurs : ils se règlent au même endroit, dans le même panneau,
       donc ils voyagent ensemble. Un seul compteur à tenir. */
    jb : (mj.jmn === (b.jmn | 0) && b.jb !== undefined) ? (b.jb | 0)
       : (a.jb !== undefined ? (a.jb | 0) : EQ.JUNGLE_PV_BONUS),
    ch : fusionneChampions(a.ch, b.ch)
  };
  /* jd et jq appartiennent à l'époque je, comme d et pv appartiennent
     à cy : une expédition plus récente balaie les destructions de la
     précédente, qui ne désignent plus rien. */
  var ea = a.je | 0, eb = b.je | 0;
  if(eb > ea){ o.jd = b.jd || ""; o.jq = b.jq | 0; }
  else if(ea > eb){ o.jd = a.jd || ""; o.jq = a.jq | 0; }
  else{
    o.jd = unionBits(a.jd, b.jd);
    /* à époque égale, les PV ne remontent jamais — sauf quand l'un
       des deux n'a pas encore vu le lancement et porte encore un 0 */
    var qa = a.jq | 0, qb = b.jq | 0;
    o.jq = (qa && qb) ? Math.min(qa, qb) : (qa || qb);
  }
  return o;
}
/* Recopie les champs de la jungle dans un instantané fusionné. */
function poseJungle(o, j){
  o.je = j.je; o.jf = j.jf; o.jd = j.jd; o.jq = j.jq;
  o.jt = j.jt; o.jm = j.jm; o.jmn = j.jmn; o.jb = j.jb; o.ch = j.ch;
  return o;
}

function fusionneMonde(a, b){
  if(!mondeValide(a)) return mondeValide(b) ? b : null;
  if(!mondeValide(b)) return a;
  var ra = rangMonde(a), rb = rangMonde(b);
  var pl = meilleurPlan(a, b);
  var jg = fusionneJungle(a, b);
  /* Une île plus avancée écrase la précédente : ses destructions ET
     son tableau des dégâts, exactement comme jeu.degatsMoi qui repart
     à zéro à chaque île. La jungle, elle, suit sa propre voie. */
  if(rb > ra) return poseJungle({ v:Math.max(a.v, b.v) + 1, cy:b.cy | 0, c:b.c, pv:b.pv,
                       d:b.d || "", g:b.g || "", w:b.w || "",
                       p:pl.p, pn:pl.pn, tg:b.tg | 0, s:b.s || "", k:b.k || "" }, jg);
  if(ra > rb){
    /* Le raccourci « return a » perdrait un plan plus récent au profit
       d'une île plus avancée : on ne renvoie a tel quel que si c'est
       bien son plan qui l'emporte — ET si b n'apporte rien à la
       jungle, dont l'état est indépendant de l'avancée de campagne. */
    if(pl.p === (a.p || "") && pl.pn === (a.pn | 0) && memeJungle(a, jg)) return a;
    return poseJungle({ v:a.v, cy:a.cy | 0, c:a.c, pv:a.pv, d:a.d || "",
             g:a.g || "", w:a.w || "", p:pl.p, pn:pl.pn, tg:a.tg | 0,
             s:a.s || "", k:a.k || "" }, jg);
  }
  return poseJungle({
    v : Math.max(a.v, b.v),
    cy: a.cy | 0,
    c : a.c,
    pv: Math.min(a.pv, b.pv),
    d : unionBits(a.d, b.d),
    /* Gégé et Tweety ne meurent qu'une fois : le premier nom inscrit
       y reste, quel que soit l'ordre d'arrivée des messages. */
    g : a.g || b.g || "",
    w : a.w || b.w || "",
    /* et les trois chats de Mily non plus */
    k : fusionneChats(a.k, b.k),
    /* le meilleur score de chacun survit à sa déconnexion */
    s : fusionneScores(a.s, b.s),
    p : pl.p, pn: pl.pn, tg: a.tg | 0
  }, jg);
}
/* L'instantané a-t-il déjà exactement l'état de jungle fusionné ? */
function memeJungle(m, j){
  return (m.je | 0) === j.je && (m.jf | 0) === j.jf &&
         (m.jd || "") === j.jd && (m.jq | 0) === j.jq &&
         msMonde(m.jt) === j.jt && (m.jm | 0) === j.jm &&
         (m.jmn | 0) === j.jmn && (m.jb | 0) === (j.jb | 0) &&
         (m.ch || "") === j.ch;
}
/* Deux instantanés décrivent-ils le même monde ? Sert à n'republier
   que lorsqu'on apporte réellement du nouveau — sans quoi deux clients
   se renverraient l'instantané en boucle. */
function memeMonde(a, b){
  if(!mondeValide(a) || !mondeValide(b)) return false;
  return rangMonde(a) === rangMonde(b) && a.pv === b.pv &&
         (a.d || "") === (b.d || "") && (a.g || "") === (b.g || "") &&
         (a.w || "") === (b.w || "") && (a.s || "") === (b.s || "") &&
         (a.k || "") === (b.k || "") &&
         /* sans ces deux-là, un plan modifié ne serait jamais republié */
         (a.p || "") === (b.p || "") && (a.pn | 0) === (b.pn | 0) &&
         /* ni un lancement d'expédition, ni un champion, ni le verrou */
         (a.je | 0) === (b.je | 0) && (a.jf | 0) === (b.jf | 0) &&
         (a.jd || "") === (b.jd || "") && (a.jq | 0) === (b.jq | 0) &&
         msMonde(a.jt) === msMonde(b.jt) && (a.jm | 0) === (b.jm | 0) &&
         (a.jmn | 0) === (b.jmn | 0) && (a.jb | 0) === (b.jb | 0) &&
         (a.ch || "") === (b.ch || "");
}

/* Précision dégressive de la crible (réglage fin §5.3) */
function mitraTouche(distance, tirage){
  if(distance <= EQ.MITRA_SEUIL_PRECISION) return true;
  return tirage < EQ.MITRA_CHANCE_LOIN;
}
/*==NOYAU_FIN==*/
