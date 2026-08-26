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
     440 par hache toutes les 850 ms, soit 517,6 dégâts/s : 3,8 % de
     mieux que les douze, ce qui reste dans le « très légèrement plus
     puissant » et pas au-delà. Les deux valeurs se règlent ENSEMBLE —
     changer l'une sans l'autre casse l'équivalence.
     La cadence est volontairement courte : il doit mitrailler le
     bâtiment de haches, pas poser une hache toutes les cinq secondes.

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
         degats:440, cadence:850, vitesse:1.782, rayon:1.6, places:1,
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
    victoire:"Mily te dit qu'elle t'aime !" }
];

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
  var zones = (plan && typeof plan === "string" && plan.length) ? decodePlan(plan) : null;
  if(zones && !zonesPeintes(zones)) zones = null;
  var c = {
    index:index, graine:gr, nom:fic.nom, biome:fic.biome, tirage:tirage,
    batiments:[], rochers:[], decors:[], creatures:[],
    qg:{ gx:QG_GX, gy:QG_GY, pvMax:fic.pvQG, pv:fic.pvQG }
  };

  /* --- Bâtiments : lattice militaire tous les 5 carreaux, 30 % sautés --- */
  var bandeProche = [["frelon",0.38],["bobine",0.34],["pilon",0.18],["cuve",0.10]];
  var bandeMoy    = [["pilon",0.26],["bobine",0.45],["crible",0.19],["silo",0.10]];
  var bandeLoin   = [["crible",0.42],["chalumeau",0.20],["pilon",0.22],["silo",0.16]];

  for(var lx = 6; lx <= PLAGE_X0 - 3; lx += 5){
    for(var ly = 3; ly <= GH - 4; ly += 5){
      /* La zone du plan sous ce nœud décide de deux choses : combien on
         en saute ici, et quel type on y pose. Elle ne décide RIEN
         d'autre — la position, le jitter et l'orientation restent
         tirés comme avant. */
      var z  = zones ? zones[zoneDePlan(lx, ly)] : 0;
      var zt = zoneType(z), zd = zoneDens(z);
      var saut = zd ? DENSITES[zd].saut : 0.28;
      var dx = lx - QG_GX, dy = ly - QG_GY;
      var d = Math.hypot(dx, dy);
      var tAuto, rSaut, gx, gy, ang;

      if(zones){
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

      var t = zt ? TYPES_PLAN[zt] : tAuto;
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
      var champVide = zones && zoneEstVide(zones[zoneDePlan(fx, fy)]);
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
      var zs  = zones ? zones[zoneDePlan(sx, sy)] : 0;
      var zts = zoneType(zs), zds = zoneDens(zs);
      /* La proportion gardée suit celle de la zone : un secteur
         clairsemé reçoit un renfort clairsemé, un secteur saturé un
         renfort saturé. 0,1486 est le rapport qui donne +15 % du
         quadrillage d'origine, lequel en garde 72 %.
         « Surchargé » court-circuite ce rapport et remplit aussi
         l'entre-deux : c'est là que la carte double de densité. */
      var sautSup = sautRenfort(zds);
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
      var ts = zts ? TYPES_PLAN[zts] : tAutoS;
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
      if(zones && zoneEstVide(zones[zoneDePlan(gxm, gym)])) continue;
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
  if(zones){
    var fcp = DEF.cellule;
    for(var zi = 0; zi < NB_ZONES; zi++){
      if(!zoneChamp(zones[zi])) continue;
      var zcx = ((zi % ZONES_L) + 0.5) * PAS_ZONE;
      var zcy = (((zi / ZONES_L) | 0) + 0.5) * PAS_ZONE;
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
        c.batiments.push({
          t:"cellule", gx:bxp, gy:byp, pv:fcp.pv, pvMax:fcp.pv, e:fcp.emprise,
          ang:angp, vivant:1, n:c.batiments.length
        });
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

function mondeVide(index, pvMax, cycle){
  return { v:0, cy:cycle | 0, c:index | 0, pv:pvMax, d:"", g:"", w:"",
           p:"", pn:0, tg:0, s:"", k:"" };
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
function fusionneMonde(a, b){
  if(!mondeValide(a)) return mondeValide(b) ? b : null;
  if(!mondeValide(b)) return a;
  var ra = rangMonde(a), rb = rangMonde(b);
  var pl = meilleurPlan(a, b);
  /* Une île plus avancée écrase la précédente : ses destructions ET
     son tableau des dégâts, exactement comme jeu.degatsMoi qui repart
     à zéro à chaque île. */
  if(rb > ra) return { v:Math.max(a.v, b.v) + 1, cy:b.cy | 0, c:b.c, pv:b.pv,
                       d:b.d || "", g:b.g || "", w:b.w || "",
                       p:pl.p, pn:pl.pn, tg:b.tg | 0, s:b.s || "", k:b.k || "" };
  if(ra > rb){
    /* Le raccourci « return a » perdrait un plan plus récent au profit
       d'une île plus avancée : on ne renvoie a tel quel que si c'est
       bien son plan qui l'emporte. */
    if(pl.p === (a.p || "") && pl.pn === (a.pn | 0)) return a;
    return { v:a.v, cy:a.cy | 0, c:a.c, pv:a.pv, d:a.d || "",
             g:a.g || "", w:a.w || "", p:pl.p, pn:pl.pn, tg:a.tg | 0,
             s:a.s || "", k:a.k || "" };
  }
  return {
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
  };
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
         (a.p || "") === (b.p || "") && (a.pn | 0) === (b.pn | 0);
}

/* Précision dégressive de la crible (réglage fin §5.3) */
function mitraTouche(distance, tirage){
  if(distance <= EQ.MITRA_SEUIL_PRECISION) return true;
  return tirage < EQ.MITRA_CHANCE_LOIN;
}
/*==NOYAU_FIN==*/
