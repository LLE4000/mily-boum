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
var VERSION = "v0.76";

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

  /* Nova : une seule charge par vie, jamais cumulable. Ce qui monte
     avec les paliers, ce n'est pas le NOMBRE de Novas, c'est leur
     CALIBRE — voir calibreNova(). */
  NOVA_PAR_VIE         : 1,

  /* Débarquement */
  NB_BARGES            : 8,
  /* Plafond absolu d'une navette. La capacité réelle dépend du type
     embarqué (UNI[t].places) : une Furie et son gros fusil tiennent
     moins nombreuses qu'un Commando. */
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
  VENG_TRAINEE         : 19,    // longueur des traînées, en cases
  VENG_ECART           : 0.17,  // demi-angle du V des deux rayons, en radians
  /* ════════════════════════════════════════════════════════════
     LA TAILLE DESSINÉE — LE DESSIN GROSSIT, LA PEINE NON

     « Les rendre plus spectaculaires. » On applique ici la convention
     déjà écrite pour les tornades, et pour la même raison : ce facteur
     ne grossit QUE le dessin — la largeur des faisceaux, l'étoile de
     l'impact, l'anneau de souffle, le voile à l'écran. Le RAYON qui
     punit et la demi-largeur des traînées n'y touchent pas.

     Ce n'est pas de la prudence, c'est la promesse faite au joueur :
     la peine est de 90 % des PV sur ce qui se trouve dans le disque
     ou sous les traînées, et ces deux mesures-là sont annoncées.
     Grossir le dessin sans grossir la zone continue la convention du
     jeu — on voit une grosse tornade et un petit anneau, et c'est
     l'anneau qui dit la vérité.

     LA LONGUEUR DES TRAÎNÉES, ELLE, A BOUGÉ — quinze à dix-neuf
     cases — et c'est délibéré : la spécification demande des traînées
     « longues et visibles », et la longueur est la seule mesure de la
     peine que le joueur voit venir de loin. Il peut courir devant.
     ════════════════════════════════════════════════════════════ */
  VENG_ECH_VISUEL      : 1.40,
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
  /* La foudre des ténèbres est plus RARE que celle de la jungle, et ce
     n'est pas de la timidité : cette île porte déjà les tornades. Deux
     dangers qui tombent du ciel au même rythme ne se distinguent plus
     l'un de l'autre — on ne saurait plus lequel on esquive. */
  TENEBRES_ECLAIR      : 26,    // secondes entre deux impacts
  JUNGLE_GEYSERS       : 22,    // ouvertures de feu sur l'île
  /* LE DURCISSEMENT DE LA CARTE ÉVÉNEMENT.
     Les défenses de la jungle sont plus dures et frappent plus fort
     que partout ailleurs — mais le Brasier, lui, garde EXACTEMENT sa
     vie : c'est une carte plus défendue, pas une carte plus longue.
     Le bonus de PV vit dans l'instantané partagé et se règle depuis
     le panneau administrateur ; celui-ci n'est que son défaut. */
  /* ---- LES TORNADES DE FLAMMES, dans les ténèbres ----
     Elles descendent des nuages, marchent au sol sur une certaine
     longueur et laissent derrière elles une traînée de feu. Toute
     troupe prise dedans MEURT — elle n'est pas blessée.

     Trois de ces sept nombres existent uniquement pour que ce ne soit
     pas un piège :
       DESCENTE, le temps que met l'entonnoir à toucher terre. Rien
         n'est mortel pendant ce temps, et le point de contact est
         marqué au sol : on la voit venir et l'on a de quoi s'écarter.
       VITESSE, volontairement plus lente qu'une Furie (1,62) n'est
         rapide… non : plus RAPIDE, exprès — mais elle va TOUT DROIT,
         et l'on s'écarte de côté, pas en courant devant.
       RAYON et TRAINEE_R, étroits. Une tornade large ne se contourne
         pas, elle se subit.
     Le reste est du rythme. */
  TORNADE_PERIODE      : 34,    // s entre deux tornades
  TORNADE_DESCENTE     : 2.6,   // s : l'entonnoir descend — rien n'est mortel
  TORNADE_VIE          : 13,    // s : la marche au sol de référence
  /* LA LONGUEUR DU TRAJET, en multiples de TORNADE_VIE. « Elle devrait
     faire cinquante pour cent du trajet en plus, à parfois cent pour
     cent en plus, pour avoir différentes intensités. » C'est donc une
     PLAGE et non un nombre : chaque tornade tire la sienne, et deux
     tornades de la même partie ne se ressemblent pas. */
  TORNADE_TRAJET_MIN   : 1.5,   // × TORNADE_VIE  (+50 %)
  TORNADE_TRAJET_MAX   : 2.0,   // × TORNADE_VIE  (+100 %)
  /* ════════════════════════════════════════════════════════════
     LA MARGE DE BORD — ET POURQUOI ELLE EST PASSÉE DE 14 À 5

     C'est la distance au bord à laquelle la tornade commence à virer
     pour rester dans la zone de jeu. Assez large pour que le virage
     soit une courbe et non un rebond ; voilà pour l'intention.

     À QUATORZE, C'ÉTAIT UNE CLÔTURE. La tornade faisait demi-tour dès
     x > 126 ou x < 21, sur une terre praticable qui va de 7 à 152. Or
     ON DÉBARQUE À x ≥ 140 et LE BRASIER EST À x = 9 : les deux
     endroits où l'on passe son temps étaient hors de la clôture. La
     tornade tournait en rond au milieu de l'île, c'est-à-dire là où
     personne n'est.

     Mesuré, flotte postée, sur des heures de jeu simulées :

                          avant (14)    après (5)
       la plage             80 min       29 min
       le milieu            11 min       13 min
       devant le Brasier    28 min       18 min

     On a d'abord cherché ailleurs. Doubler les nuages : aucun effet
     mesurable — ils traversent l'île en deux minutes, donc leurs
     points de naissance couvrent déjà tout. Changer le point visé
     pour faire traverser l'île de part en part : aucun effet non
     plus. La clôture était la seule cause, et les deux autres pistes
     étaient des façons de ne pas la voir.

     1 % des tornades sortent maintenant du terrain, contre 0 %. C'est
     le prix, et il est négligeable.
     ════════════════════════════════════════════════════════════ */
  TORNADE_MARGE_BORD   : 5,     // cases
  TORNADE_VITESSE      : 2.9,   // cases/s
  TORNADE_RAYON        : 1.25,  // cases : le pied, mortel
  TORNADE_TRAINEE      : 5.0,   // s : la traînée reste mortelle
  TORNADE_TRAINEE_R    : 1.10,  // cases : demi-largeur de la traînée
  /* LE FLOTTEMENT DE LA NAISSANCE, en fraction de la période. Sans
     lui, les tornades tomberaient à intervalles rigoureusement égaux
     et l'on entendrait le métronome. */
  TORNADE_JITTER       : 0.5,
  /* ---- LE TOURBILLON D'ÉTOILES, dans les Mily et une nuits ----
     La même mécanique que la tornade de feu, en une fois et demie plus
     grand. Ce qui change vraiment tient en quatre nombres :
       ECH        tout est × 1,5 — le rayon qui tue et la hauteur ;
       TRAINEE_R  la traînée est PLUS large encore que le facteur ne le
                  voudrait (1,10 × 1,5 = 1,65, on met 1,80) : c'était
                  la demande, et c'est ce qui distingue une traînée de
                  poussière d'étoile d'un simple sillage ;
       DESCENTE   l'avertissement s'allonge dans la même proportion que
                  le couloir. Sinon la promesse ne tient plus : un
                  couloir une fois et demie plus large à préavis égal,
                  c'est un piège une fois et demie plus grand ;
       VITESSE    un peu plus lente. Une masse plus grande ne se
                  déplace pas aussi vif, et cela laisse à l'œil le
                  temps de la suivre. */
  /* ---- LA TORNADE CLASSIQUE, à la campagne ----
     Ni feu ni étoiles : de la poussière, de la terre et des débris —
     celle qu'on voit dans un champ. Deux réglages la distinguent, et
     les deux viennent de ce qu'elle traverse une île de CAMPAGNE,
     c'est-à-dire une île où l'on reste longtemps :
       VIE plus longue — « qu'elle dure un peu plus longtemps » : sa
         course passe de 19-26 s à 24-32 s ;
       PERIODE plus longue aussi, et c'est l'équilibre de la première :
         un phénomène qui dure plus doit revenir moins souvent, sinon
         l'île finit par en porter deux en permanence et ce n'est plus
         un événement, c'est un climat.
     Sa taille est celle d'origine : c'est la tornade de référence, les
     deux autres sont les variantes. */
  /* 46 → 36. Ouvrir la clôture répartit les tornades sur toute l'île,
     ce qui fait forcément BAISSER la fréquence au milieu — on ne peut
     pas monter les bords sans descendre le centre à nombre égal. Dix
     secondes de moins entre deux rendent au milieu ce que la
     répartition lui a pris, et l'on retombe sur les trois chiffres
     visés : 29, 13 et 18 minutes. */
  CLASSIQUE_PERIODE    : 36,    // s entre deux
  CLASSIQUE_DESCENTE   : 2.6,   // s d'avertissement — rien n'est mortel
  CLASSIQUE_VIE        : 16,    // s : la marche au sol de référence
  CLASSIQUE_VITESSE    : 2.5,   // cases/s
  CLASSIQUE_RAYON      : 1.25,  // cases : le pied, mortel
  CLASSIQUE_TRAINEE    : 4.0,   // s : la poussière retombe vite
  CLASSIQUE_TRAINEE_R  : 1.05,  // cases : demi-largeur de la traînée
  TOURBILLON_ECH       : 1.5,
  TOURBILLON_PERIODE   : 40,    // s entre deux : plus grosse, donc plus rare
  TOURBILLON_DESCENTE  : 3.4,   // s d'avertissement — 2,6 × 1,3
  TOURBILLON_VIE       : 13,    // s : la marche au sol de référence
  TOURBILLON_VITESSE   : 2.6,   // cases/s
  TOURBILLON_RAYON     : 1.875, // cases : le pied, mortel — 1,25 × 1,5
  TOURBILLON_TRAINEE   : 5.5,   // s : la traînée reste mortelle
  TOURBILLON_TRAINEE_R : 1.80,  // cases : demi-largeur, volontairement large
  /* ════════════════════════════════════════════════════════════
     DEUX À LA FOIS — « pour les Mily et une nuits il faudrait
     2 tornades en même temps »

     ELLES NAISSENT PAR PAIRES, pas par hasard. Deux tourbillons qui
     tireraient chacun leur instant de naissance seraient à dix
     secondes l'un de l'autre : on verrait deux tornades qui se
     suivent, jamais deux tornades EN MÊME TEMPS. L'instant appartient
     donc au créneau, et les jumelles le partagent ; ce qu'elles
     tirent chacune, c'est leur place, leur cap et leur course.

     ET ELLES NE SE SUPERPOSENT PAS. Chacune naît dans SA moitié de
     l'île, séparées par une bande de trente-quatre cases au milieu :
     deux entonnoirs collés l'un à l'autre ne feraient qu'un danger
     pour deux fois le calcul. Leurs trajectoires, elles, visent
     n'importe où — elles se croisent, et c'est bien.

     LE FLOTTEMENT PASSE DE MOITIÉ À UN QUART, et ce n'est pas un
     réglage d'humeur, c'est de l'arithmétique. Une paire vit au plus
     3,4 + 13 × 2 = 29,4 s. Pour qu'une paire soit toujours morte
     quand la suivante naît — sinon il y aurait QUATRE entonnoirs —
     il faut période − flottement ≥ 29,4, soit 40 − 10 = 30. Ça
     tient, avec six dixièmes de seconde de marge, et le test le
     vérifie sur dix mille créneaux.
     ════════════════════════════════════════════════════════════ */
  TOURBILLON_PAIRE     : 2,     // deux entonnoirs par créneau
  TOURBILLON_JITTER    : 0.25,  // et donc un flottement deux fois moindre
  TOURBILLON_ECART     : 34,    // cases : la bande vide entre les deux moitiés
  /* ════════════════════════════════════════════════════════════
     LA TAILLE DESSINÉE — 30 % DE PLUS, ET RIEN D'AUTRE

     Ce facteur ne grossit QUE le dessin : la hauteur de l'entonnoir
     et la largeur du bourrelet de débris. Le RAYON MORTEL n'y touche
     pas, et c'est délibéré.

     Ce n'est pas une prudence, c'est la convention déjà en place :
     le bourrelet de poussière au pied fait deux fois et demie
     l'entonnoir et NE TUE PAS — ce qui tue est l'anneau net qu'on
     trace dedans, à la mesure exacte du rayon. Le joueur voit donc
     une grosse tornade et un petit anneau, et c'est l'anneau qui dit
     la vérité. Grossir l'un sans l'autre continue cette convention au
     lieu de la casser.

     ET IL Y A UNE RAISON DURE DE NE PAS TOUCHER AU RAYON. Deux
     promesses en dépendent, toutes deux vérifiées par les tests :
       — le couloir mortel reste plus étroit qu'un débarquement, pour
         qu'une seule tornade ne puisse jamais balayer une flotte
         entière. Le tourbillon des nuits est DÉJÀ à la limite :
         1,875 × 2 = 3,75 pour un rayon de formation de 3,8. Trente
         pour cent de plus le ferait passer à 4,88, et la promesse
         tomberait.
       — l'avertissement seul suffit à sortir du couloir : la troupe
         la plus lente doit parcourir plus que le rayon pendant que
         l'entonnoir descend.
     Le dessin peut grossir librement ; le rayon, non.
     ════════════════════════════════════════════════════════════ */
  TORNADE_ECH_VISUEL   : 1.3,
  /* ════════════════════════════════════════════════════════════
     PLUS HAUTES, ET PLUS OUVERTES EN HAUT

     « Il faudrait les faire deux fois plus hautes, et le cône
     au-dessus une fois et demie plus large. »

     Les deux facteurs sont séparés parce qu'ils ne font pas le même
     travail, et qu'un seul des deux aurait donné une tornade grasse.

     LA HAUTEUR. Elle double, purement et simplement. C'est elle qui
     donne l'échelle : une colonne qui monte hors de l'écran ne se
     compare plus à un bâtiment, elle se compare au CIEL.

     LE CÔNE. torProfil ouvre l'entonnoir en u² — le pied reste serré,
     le sommet s'évase. On ne multiplie QUE ce terme-là : le sommet
     s'ouvre d'une fois et demie, le pied ne bouge pas d'un pixel. Ce
     qui fait le dessin d'une tornade, c'est le PINCEMENT entre les
     deux ; élargir le pied aussi l'aurait effacé, et l'on aurait
     obtenu un tube.

     ET NI L'UN NI L'AUTRE NE TOUCHE À CE QUI TUE. Même convention que
     partout ailleurs dans ce fichier : le dessin peut grossir
     librement, le rayon mortel non. Le joueur voit une grosse tornade
     et un petit anneau, et c'est l'anneau qui dit la vérité.

     ────────────────────────────────────────────────────────────
     ET LA HAUTEUR EST REVENUE À UN, APRÈS ESSAI À L'ÉCRAN

     « J'ai l'impression que toutes les tornades sont trop hautes
     maintenant ; à mon avis deux fois plus petites. »

     Elle avait été doublée à la demande — « deux fois plus hautes et
     le cône une fois et demie plus large » — et c'est le doublement
     qui était de trop : à deux, la colonne sort du cadre au zoom de
     jeu, et une colonne dont on ne voit pas le sommet ne se lit plus
     comme une tornade mais comme un trait vertical. Le cône, lui,
     reste à une fois et demie : c'est LUI qui fait l'impression, et
     il a été gardé.

     LE RAYON MORTEL N'A JAMAIS BOUGÉ, ni à la hausse ni à la baisse.
     Ces deux nombres ne touchent que le dessin — c'est toute la
     raison d'être de la convention rappelée juste au-dessus. Aucune
     partie en cours ne change de difficulté d'un point.
     ════════════════════════════════════════════════════════════ */
  TORNADE_HAUT_ECH     : 1.0,
  TORNADE_CONE_ECH     : 1.5,
  /* ---- LA TORNADE DE LA GUINGUETTE ----
     « Mily en guinguette, elle est un peu fade. Il faudrait mettre
     deux tornades dessus. » Elle emprunte tout à la tornade classique
     — même sorte, même taille, même traînée de poussière — et n'en
     change que deux nombres, les deux qu'impose la paire.

     LA PÉRIODE PASSE DE 36 À 52 SECONDES, et ce n'est pas un réglage
     d'humeur, c'est de l'arithmétique. Une tornade de campagne vit au
     plus 2,6 + 16 × 2 = 34,6 s. Pour qu'une paire soit toujours
     éteinte quand la suivante tombe — sinon il y en aurait quatre —
     il faut période − flottement ≥ 34,6. À 36 s le flottement devrait
     tomber à quatre pour cent, c'est-à-dire au métronome ; à 52 s il
     garde son quart, soit treize secondes de jeu, et il reste encore
     4,4 s de marge. Le test le vérifie sur dix mille créneaux. */
  GUINGUETTE_PERIODE   : 52,
  JUNGLE_PV_BONUS      : 100,   // % de PV en plus sur les défenses
  JUNGLE_DEG_BONUS     : 50,    // % de dégâts en plus sur les défenses
  /* La foudre de la jungle : elle TUE net ce qu'elle touche, puis le
     courant court sur la terre mouillée en s'élargissant. */
  ECLAIR_RAYON_TUE     : 1.6,   // cases — au point d'impact, c'est mortel
  ECLAIR_RAYON_NAPPE   : 7.5,   // cases — jusqu'où le courant se diffuse
  ECLAIR_NAPPE_DUREE   : 2.6,   // secondes d'expansion
  ECLAIR_NAPPE_DEGATS  : 260,   // dégâts au passage du front
  /* La vitesse des nuages : le DOUBLE de celle d'une troupe. La Furie
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
  /* Jusqu'où un Doc va chercher un blessé. Au-delà il renonce et se
     recolle à la troupe : un soigneur qui traverse la carte pour un
     éclopé isolé abandonne les vingt autres. */
  DOC_RECHERCHE        : 11.0,
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
/* LA MARGE VAUT POUR LES QUATRE CÔTÉS, et c'est une correction.
   Elle n'entrait que par gx, et seulement par sa borne haute : mesuré,
   208 pixels à l'est, 104 au sud, ZÉRO à l'ouest et au nord. L'île
   n'était donc pas centrée dans sa propre boîte, et la caméra pouvait
   s'écarter deux fois plus d'un côté que de l'autre.
   Elle passe de huit cases à quatre parce qu'elle compte maintenant
   quatre fois : à huit sur les quatre côtés, le plancher du zoom
   descendait de 0,182 à 0,168 — on aurait vu plus d'eau, exactement ce
   qu'on cherche à éviter. À quatre, symétrique, il vaut 0,177. */
var MARGE_MONDE = 4;
function boiteMonde(){
  var m = MARGE_MONDE;
  var a = iso(-m, GH + m), b = iso(GW + m, -m);        // extrêmes gauche / droite
  var c = iso(-m, -m),     d = iso(GW + m, GH + m);    // extrêmes haut / bas
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
  furie   :{ nom:"Furie",    role:"tireuse à distance",  pv:110, portee:5.0, arret:4.75,
             degats:54,  cadence:1300, vitesse:1.62,  rayon:0.34, places:12 },
  commando:{ nom:"Commando", role:"cogneur au contact", pv:560, portee:1.9, arret:1.70,
             degats:100, cadence:1600, vitesse:1.008, rayon:0.42, places:15 },

  /* ------------------------------------------------------------
     L'OGRE. Une navette n'en embarque qu'UN SEUL, et cet ogre doit
     valoir la barge de douze Furies qu'il remplace.

     Douze Furies : 54 dégâts toutes les 1,3 s, soit 41,54 dégâts/s
     chacune, donc 498,5 dégâts/s pour la barge entière. L'Ogre lance
     506 par hache toutes les 850 ms, soit 595,3 dégâts/s.

     IL FRAPPE DÉSORMAIS 19 % PLUS FORT QUE SA BARGE, et c'est voulu.
     La hache était à 440, soit 3,8 % de mieux que les douze Furies — un
     match nul, sur le papier. Sur le terrain il perdait : il traverse
     l'île SEUL, il encaisse cinq fois les roquettes du Frelon, et le
     mirador l'abat d'une balle. Une barge de douze, elle, perd trois
     Furies et continue. La stricte égalité des dégâts par seconde ne
     tenait donc pas compte de ce qu'il paie pour arriver à portée.
     Les quinze pour cent de plus achètent exactement ça.

     Les deux valeurs se règlent ENSEMBLE — changer l'une sans l'autre
     casse le rapport. La cadence est volontairement courte : il doit
     mitrailler le bâtiment de haches, pas poser une hache toutes les
     cinq secondes.
     Résistance : 110 × 1,5 = 165 PV. Plus dur à tuer qu'une Furie,
     jamais immortel.
     Faiblesse : il encaisse CINQ FOIS les dégâts d'un lance-roquettes
     (le Frelon). C'est sa contrepartie assumée — un ogre lâché seul
     sous une batterie de missiles fond à vue d'œil.
     Vitesse : 1,62 × 1,10 = 1,782. Il est plus RAPIDE qu'une Furie,
     malgré sa masse : son animation est lourde, pas son déplacement.
     ------------------------------------------------------------ */
  /* rayon : c'est l'ENCOMBREMENT, l'écart que deux unités s'imposent
     l'une à l'autre. Il ne joue sur rien d'autre — bloque() teste un
     point, pas un disque, donc il n'empêche pas de passer entre deux
     bâtiments. À 0,72 trois ogres se chevauchaient presque entièrement :
     leur corps fait trois fois celui d'une Furie et déborde largement de
     l'écart qui convient à une petite troupe. */
  /* LE DOC. `degats: 0` n'est pas un oubli : c'est ce qui le fait
     sortir de toute la chaîne de tir. `soin` est le champ qui le
     remplace, et il n'existe que sur lui. */
  doc     :{ nom:"Doc",      role:"soigne les blessés",  pv:300, portee:3.4, arret:2.6,
             degats:0,   cadence:0,    vitesse:1.85,  rayon:0.36, places:5, soin:12 },

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
         vuln:{ precision:5, mortier:2 } },

  /* ------------------------------------------------------------
     LE TANK. La troupe lourde : lente, blindée, régulière.

     ═══ CE QU'IL FAUT VALOIR ═══════════════════════════════════
     La composition visée est SEPT BARGES DE TANKS ET UNE DE DOCS,
     à DEUX TANKS PAR BARGE — quatorze chars. La référence est la
     même flotte en Furies : sept barges de douze, quatre-vingt-
     quatre Furies.

       84 Furies : 84 × 110       =  9 240 PV
                   84 × 54/1,3 s  =  3 489 dégâts/s

     Ce qui décide de ce qu'une flotte détruit avant de mourir n'est
     ni sa vie ni ses dégâts, c'est LE PRODUIT DES DEUX : sous un feu
     donné, elle tient PV/feu secondes et frappe dps × PV/feu. Les
     Furies valent donc 3 489 × 9 240 = 32,2 millions.

       14 Tanks : 14 × 1300       = 18 200 PV   (×1,97 les Furies)
                  14 × 480/4 s    =  1 680 dégâts/s (0,48 ×)
                  produit         = 30,6 millions, soit 95 %.

     C'est exactement ce qu'on cherchait : une flotte de puissance
     ÉQUIVALENTE, obtenue par l'autre bout — deux fois plus de vie
     pour deux fois moins de dégâts. On ne joue pas plus fort, on
     joue autrement : lentement, en encaissant.

     ═══ 480 PAR OBUS, ET PAS UN DE PLUS ════════════════════════
     « Sans détruire les défenses en un seul coup. » La défense la
     plus fragile de l'île est le Mirador, 640 PV : à 480, il en
     faut deux. Et la plus solide est le Frelon, 840 : à 960 pour
     deux obus, il en faut deux aussi.
     TOUTE défense tombe en EXACTEMENT DEUX OBUS. C'est une règle
     qu'un joueur lit en deux minutes de jeu et sur laquelle il peut
     compter — et elle interdit le coup unique par construction :
     monter les dégâts au-delà de 640 la casserait.

     ═══ LE COUPLE DE FORCE ET DE FAIBLESSE ═════════════════════
     `vuln` porte les deux, et c'est la table de l'Ogre qui sert :
       bete: 0        les bestioles ne peuvent RIEN contre un blindé.
                      Ni le Braisard, ni le Piqueur, ni la charge du
                      Sanglier. Zéro, pas « peu » : un char n'a pas
                      à craindre un cochon.
       precision: 3,2 le tireur d'élite du Mirador. 70 × 3,2 = 224
                      par balle, toutes les 2,2 s : un char seul sous
                      un Mirador meurt en treize secondes. C'est LE
                      contre, et il doit faire peur.
       mortier: 2     l'obus du Pilon. Un canon contre un char, c'est
                      la réponse logique — et le Pilon est la défense
                      la plus nombreuse de l'île.
     Ce qui reste au tarif plein : les mitrailleuses du Crible, le
     Chalumeau, la Bobine. Un char les traverse. C'est voulu.

     ═══ LE RESTE ═══════════════════════════════════════════════
     vitesse  1,30 contre 1,62 : vingt pour cent plus lent qu'une
              Furie, mais bien loin du Commando (1,008). « Un peu
              plus lent », pas injouable.
     portee   5,5 — un canon porte plus loin qu'une mitrailleuse. Il
              dépasse d'un cheveu le Crible (5,15), et reste sous le
              Chalumeau. C'est sa seule impunité, et elle est mince.
     rayon    1,22, contre 0,34 pour une Furie. C'est l'ENCOMBREMENT,
              l'écart que deux unités s'imposent — et un char en
              occupe la place. À 0,95, quatorze chars se
              chevauchaient d'un tiers et la colonne devenait une
              tache ; mesuré à l'image, corrigé à l'image.
     tourelle Le drapeau qui change tout au dessin ET au tir : le
              char ne fait feu qu'une fois sa tourelle ALIGNÉE. Voir
              61-tank.js et majUnites.

     ═══ L'INTERCEPTEUR ═════════════════════════════════════════
     « À l'arrière, un intercepteur qui explose les roquettes des
     Frelons. Ça doit intercepter 50 % des Frelons. »

     `intercepteur: 2` — UNE ROQUETTE SUR DEUX, PAS « À PEU PRÈS
     LA MOITIÉ ». Le champ est le DIVISEUR, et c'est un choix, pas
     une commodité : un tirage au sort à 50 % aurait donné, sur une
     poignée de roquettes, tantôt trois interceptions sur quatre et
     tantôt zéro sur quatre. Un joueur qui perd deux chars parce
     que le hasard lui a refusé quatre interceptions d'affilée n'a
     rien appris ; il a seulement été puni. Un compteur qui
     alterne donne exactement la moitié, à chaque char, à chaque
     partie — et il se teste au lieu de se sonder.

     Le Frelon reste dangereux : ses roquettes portent le drapeau
     `precision`, donc celles qui passent font 40 × 3,2 = 128. Une
     sur deux interceptée ramène cela à 64 en moyenne — encore
     plus qu'une Furie ne prend (40). Le Mirador, lui, n'est pas
     intercepté du tout : il reste LE contre du char, et c'est bien
     ainsi qu'on l'a voulu.
     ------------------------------------------------------------ */
  tank:{ nom:"TX-90", role:"blindé lourd à canon", pv:1300, portee:5.5, arret:5.2,
         degats:480, cadence:4000, vitesse:1.30, rayon:1.22, places:2,
         tourelle:1, vitesseObus:16, ech:2, intercepteur:2,
         vuln:{ bete:0, precision:3.2, mortier:2 } }
};
/* ================================================================
   LE DOC — la quatrième troupe, et la première qui ne tire pas.

   Cinq par navette. Il ne fait aucun dégât : il SUIT la troupe et il
   la recoud. Deux choses le distinguent de tout ce qui existait :

     1. IL N'A PAS DE CIBLE. Les trois autres cherchent un bâtiment et
        marchent dessus ; lui cherche un BLESSÉ, et à défaut il colle
        au soldat le plus proche. C'est un satellite, pas un
        assaillant.
     2. IL PREND LA VITESSE DE CELUI QU'IL SUIT. Sa vitesse propre
        (1,85) n'est qu'un plafond : elle est là pour qu'il puisse
        rattraper un Ogre lancé (1,782), jamais pour qu'il le double.
        Un soigneur qui distance sa troupe arrive seul au contact et
        meurt le premier ; un soigneur qui traîne ne soigne personne.
        Il adopte donc la vitesse du type qu'il escorte.

   `soin` est en points de vie par seconde, et il vaut douze : cinq
   Docs — une navette pleine — rendent soixante points par seconde à
   tout ce qui saigne autour d'eux, à comparer aux trente de la
   capacité Soin, qui est ponctuelle et coûte de l'énergie. C'est le
   chiffre à bouger si l'équilibre ne va pas ; tout le reste est de la
   plomberie. */
/* L'ORDRE EST UNE CLÉ, PAS UN CLASSEMENT. C'est l'INDICE dans cette
   liste qui part sur le réseau pour dire de quelle troupe il s'agit
   (voir 85-reseau.js). Un type qu'on intercale renomme toutes les
   troupes des joueurs déjà connectés : on ajoute À LA FIN, jamais
   ailleurs. */
var TYPES_TROUPE = ["furie", "commando", "ogre", "doc", "tank"];

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
   LE BESTIAIRE ENCHANTÉ DES MILY ET UNE NUITS

   La jungle est habitée par des bêtes qui VIVENT là. Ici on ne
   cherche pas la crédibilité, on cherche l'APPARITION : ces quatre-là
   ne sont pas des animaux qui habitent l'île, ce sont des animaux
   qu'on CROISE. Elles émettent leur propre lumière, elles laissent un
   sillage, et aucune n'est peinte à plein — voir 47-nuits-faune.js,
   qui les dessine.

   LEURS DÉTECTIONS SONT LONGUES, et c'est le seul réglage qui
   compte : une apparition qu'on peut approcher n'en est plus une.
   Le chat de lune a la plus longue de tout le jeu — dix cases : il
   part avant qu'on ait décidé de le regarder.

   ET AUCUNE N'EST PROTÉGÉE. Le chat de lune n'est pas un chat de
   Mily : il flotte, il est translucide, il a des yeux d'or. Les trois
   protégés, eux, marchent au sol et ont un nom. On peut tuer celui-ci
   sans que personne ne se venge — ce qui ne veut pas dire qu'il
   faille le faire.
   ---------------------------------------------------------------- */
CRE.paon          = { nom:"Paon",           pv:150, detection:8.0,  portee:0, degats:0, cadence:0, vitesse:1.30, rayon:0.34, fuit:1 };
CRE.chatlune      = { nom:"Chat de lune",   pv:90,  detection:10.0, portee:0, degats:0, cadence:0, vitesse:2.70, rayon:0.24, fuit:1 };
CRE.fennec        = { nom:"Fennec",         pv:70,  detection:9.5,  portee:0, degats:0, cadence:0, vitesse:3.20, rayon:0.22, fuit:1 };
CRE.papillongeant = { nom:"Papillon géant", pv:35,  detection:7.0,  portee:0, degats:0, cadence:0, vitesse:1.90, rayon:0.20, fuit:1, vole:1 };

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
/* ================================================================
   LA MONTÉE EN PUISSANCE

   Ce qu'elle sert. La fin d'une île, c'est le Brasier : soixante
   millions de points de vie sur la jungle, quand toutes les défenses
   réunies n'en font que deux millions sept. Le joueur qui reste seul
   à la fin y passe des heures — mesuré, environ six heures quarante de
   jeu continu à la puissance de feu d'un débarquement complet. La
   montée en puissance divise cette corvée par DEUX : la même corvée
   revient à trente et un millions de travail au lieu de soixante,
   quarante-sept pour cent de moins.

   LES PALIERS SONT DES VALEURS ABSOLUES, PAS UNE ACCUMULATION.
   À cinq cent mille on frappe à 105 % de sa base. À un million, 110 %
   — et non 105 plus 10. À deux millions 120 %, à trois millions 130 %,
   et ainsi de suite jusqu'à DEUX FOIS PLUS FORT à dix millions, où
   l'on plafonne. C'est une table qu'on lit, pas une somme qu'on
   empile.

   Le premier palier est à cinq cent mille et non à un million, et ce
   n'est pas un détail : un million demande près de quarante minutes de
   jeu utile, et un joueur qui vient d'arriver ne verrait jamais la
   moindre flamme. À cinq cent mille il en voit une avant d'avoir eu le
   temps de s'ennuyer.

   OÙ PASSE LE TEMPS, sur les soixante millions du Brasier : dix-neuf
   pour cent entre ×1,10 et ×1,90, et QUATRE-VINGTS POUR CENT au
   plafond. Le plafond n'est donc pas une décoration de fin de courbe,
   c'est la valeur à laquelle on joue presque tout le temps — d'où
   l'importance de ne pas le monter au-delà de deux.

   LE SEUIL EST FIXE et non indexé sur la taille de l'île, à dessein :
   il s'auto-équilibre. Sur la jungle (soixante millions) on gagne
   quarante-sept pour cent, sur la plage (quinze millions) trente-neuf.
   Plus la corvée est longue, plus l'aide est forte.

   CE QUE LE BONUS NE TOUCHE PAS : les capacités. Il ne multiplie que
   ce que les TROUPES infligent. La Nova, elle, a son propre saut —
   voir PALIER_SUPERNOVA.
   ================================================================ */
var PALIERS_PUISSANCE = [
  { seuil:        0, mult:1.00 },
  { seuil:   500000, mult:1.05 },
  { seuil:  1000000, mult:1.10 },
  { seuil:  2000000, mult:1.20 },
  { seuil:  3000000, mult:1.30 },
  { seuil:  4000000, mult:1.40 },
  { seuil:  5000000, mult:1.50 },
  { seuil:  6000000, mult:1.60 },
  { seuil:  7000000, mult:1.70 },
  { seuil:  8000000, mult:1.80 },
  { seuil:  9000000, mult:1.90 },
  { seuil: 10000000, mult:2.00 }      // plafond : deux fois plus fort
];
/* Le palier à partir duquel la Nova devient une SUPER Nova. Trois
   millions, c'est-à-dire toute la carte (deux millions sept) plus deux
   cent soixante-dix mille de Brasier : elle se débloque exactement au
   moment où l'on attaque le Brasier. */
var PALIER_SUPERNOVA = 4;             // l'indice de la ligne « 3 000 000 »
/* Et le palier où la super Nova prend son plein calibre : cinq
   millions, soit deux millions de Brasier déjà entamés. */
var PALIER_NOVA_MAX  = 6;             // l'indice de la ligne « 5 000 000 »

/* ================================================================
   LES TROIS CALIBRES DE LA NOVA.

   Ce n'est jamais le NOMBRE de Novas qui monte — on en a une par vie,
   du début à la fin — c'est leur calibre. Trois marches :

     avant 3 M   la Nova ordinaire        130 + 45      rayon ×1
     à 3 M       la SUPER Nova         50 000 + 16 000  rayon ×3
     à 5 M       son plein calibre    100 000 + 50 000  rayon ×3

   Le premier saut est celui qui compte : il tombe pile au moment où
   l'on cesse de démonter des défenses pour attaquer le Brasier. Le
   second récompense les deux millions suivants, tous pris sur la
   forteresse elle-même.

   POURQUOI CE N'EST PAS UN RACCOURCI. Au plein calibre une Nova retire
   150 000 points au Brasier, une fois par vie — et une vie ne se
   rejoue pas à volonté : il faut avoir perdu ses huit navettes ET
   toutes ses troupes pour en recevoir une neuve. Sur la plage (quinze
   millions) cela fait un pour cent de la forteresse par vie ; sur la
   jungle (soixante millions), un quart. Le bombardement à distance
   reste un ornement, jamais une stratégie.

   LE RAYON NE CHANGE PLUS APRÈS LE PREMIER SAUT, et le rayon ALLIÉ ne
   change jamais : voir explosionNova(). Une troupe qui était hors de
   portée ne doit pas se mettre à mourir parce que le joueur a
   progressé.
   ================================================================ */
var CALIBRES_NOVA = [
  { seuil:0,                degats:"degats",    souffle:"degatsSouffle",     ech:1 },
  { seuil:PALIER_SUPERNOVA, degats:"degatsSuper", souffle:"degatsSouffleSuper", ech:3 },
  { seuil:PALIER_NOVA_MAX,  degats:"degatsMax",  souffle:"degatsSouffleMax",  ech:3 }
];
/* Rend les trois chiffres du tir : le cœur, le souffle, et le facteur
   d'agrandissement du rayon côté ennemi. `rang` (0, 1, 2) sert au
   dessin et aux messages — c'est le seul endroit qui nomme la marche. */
function calibreNova(palier){
  var p = (palier | 0) > 0 ? (palier | 0) : 0, i, c = CALIBRES_NOVA[0], rang = 0;
  for(i = CALIBRES_NOVA.length - 1; i > 0; i--)
    if(p >= CALIBRES_NOVA[i].seuil){ c = CALIBRES_NOVA[i]; rang = i; break; }
  return { degats:CAP.nova[c.degats], souffle:CAP.nova[c.souffle],
           ech:c.ech, rang:rang };
}

/* L'indice du palier atteint. On parcourt du haut vers le bas : la
   table est courte et cette écriture rend le plafond gratuit. */
function palierPuissance(degatsCarte){
  var d = degatsCarte > 0 ? degatsCarte : 0;
  for(var i = PALIERS_PUISSANCE.length - 1; i > 0; i--)
    if(d >= PALIERS_PUISSANCE[i].seuil) return i;
  return 0;
}
function multPuissance(degatsCarte){
  return PALIERS_PUISSANCE[palierPuissance(degatsCarte)].mult;
}
/* Trois ÉTATS VISUELS seulement, pour douze paliers. Au zoom de jeu
   personne ne distingue ×1,40 de ×1,50 ; trois marches franches se
   lisent, onze nuances ne se lisent pas.
     0  rien
     1  un anneau d'énergie au sol            (×1,05 à ×1,30)
     2  l'anneau se resserre, des étincelles  (×1,40 à ×1,70)
     3  l'enveloppe                           (×1,80 à ×2,00) */
function auraPuissance(palier){
  if(palier <= 0) return 0;
  if(palier <= 4) return 1;
  if(palier <= 8) return 2;
  return 3;
}

var CAP = {
  /* La Nova ordinaire est spectaculaire mais raisonnable : c'est le
     grand flash et le champignon qui font le spectacle, pas les
     chiffres. La SUPER Nova, elle, arrive à trois millions et assume :
     cinquante mille au cœur, rayon triplé.
     Cinquante mille et non cent mille, et c'est le joueur qui a
     tranché : une vague de cent vingt Commandos au contact sort quatre
     cent cinquante mille : à cinquante mille la Nova pèse onze pour
     cent d'une vague, elle accompagne le débarquement au lieu de le
     remplacer.
     LES DÉGÂTS ALLIÉS NE SONT PAS MULTIPLIÉS, et le rayon allié non
     plus. La Nova frappe ses propres troupes — « alliés compris »,
     dit le code depuis toujours. À cinquante mille sur treize cases,
     elle tuerait tout le débarquement d'un coup, et comme c'est la
     mort de la flotte qui met fin à la vie, le joueur s'interromprait
     lui-même : la super Nova serait STRICTEMENT PIRE que l'ordinaire. */
  /* Les trois calibres se lisent ici et nulle part ailleurs ; c'est
     calibreNova(palier) qui choisit la ligne. `degats`/`degatsSouffle`
     servent AUSSI de dégâts alliés, à tous les calibres : eux ne
     montent jamais. */
  nova      :{ rayon:4.6, degats:130, rayonSouffle:7.0, degatsSouffle:45,
               degatsSuper:50000,  degatsSouffleSuper:16000,
               degatsMax:100000,   degatsSouffleMax:50000,   echSuper:3 },
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
  /* `voie` est la LETTRE que cet événement occupe dans l'instantané
     partagé. La jungle garde « j » — ses champs je/jf/jd/jq/jt/jm/jmn/jb
     dorment déjà dans l'instantané retenu de tous les salons du monde,
     et les renommer perdrait tout ce qu'ils portent. Toute carte
     événement neuve prend une lettre libre. */
  { nom:"Mily dans la jungle",    biome:"jungle",   pvQG:60000000,
    special:1, voie:"j",
    victoire:"Mily lui offre un verre sous la pluie !" },
  /* ----------------------------------------------------------------
     LES TROIS ÎLES AJOUTÉES APRÈS COUP, ET POURQUOI ELLES SONT ICI.

     Elles viennent APRÈS la jungle dans le tableau, alors qu'elles se
     jouent AVANT elle dans la campagne. Ce n'est pas une négligence,
     c'est la règle : l'index d'une carte est une CLÉ — les scores sont
     rangés sous « seau:carte », le cumul local sous mesDegats[index],
     les champions et le bitmap des destructions sous cet index. Les
     glisser à la place 5 aurait poussé la jungle à 8 et effacé tout ce
     que le salon y a fait. Un index attribué ne bouge jamais ; c'est
     ORDRE_CAMPAGNE qui dit dans quel ordre on les joue.

     Leurs PV prolongent la montée des cinq premières (15, 20, 26, 31,
     37) sans jamais rattraper la jungle, qui doit rester l'objectif
     collectif le plus lourd du jeu.
     ---------------------------------------------------------------- */
  { nom:"Mily en guinguette",     biome:"guinguette", pvQG:43000000,
    victoire:"Mily t'invite à danser sous les guirlandes !" },
  { nom:"Mily dans les ténèbres", biome:"tenebres",   pvQG:50000000,
    victoire:"Mily te ramène vers la lumière !" },
  { nom:"Mily à Ibiza",           biome:"ibiza",      pvQG:56000000,
    victoire:"Mily t'emmène finir la nuit au beach club !" },
  /* ----------------------------------------------------------------
     LA DEUXIÈME CARTE ÉVÉNEMENT — « Mily et les mille et une nuits »

     Elle est presque l'exact opposé de la jungle, et c'est délibéré :
     là où la jungle est dense, sauvage, végétale, orageuse et
     chaotique, celle-ci est nocturne, ordonnée, minérale, sereine et
     féérique. Deux cartes événement qui se ressembleraient ne
     donneraient qu'une carte jouée deux fois.

     Elle porte la voie « n ». Ses réglages sont les siens : c'est la
     plus lourde du jeu — l'objectif collectif ultime — donc ses
     défenses sont plus dures que celles de la jungle, et son verrou
     court indépendamment du sien. Un salon peut très bien avoir la
     jungle fermée et les nuits ouvertes : c'est même ce qu'on cherche,
     pour qu'il y ait presque toujours quelque chose à prendre.
     ---------------------------------------------------------------- */
  /* `chantier` : la carte est EN TRAVAUX. Elle apparaît sur l'accueil
     — c'est même le but, on veut la voir arriver — et tout le monde
     peut la VISITER, mais personne ne peut y entrer ni y rejoindre
     une expédition. Le drapeau ferme deux portes, plus trois : la
     visite ne publie rien, ne range aucun dégât et n'entame aucun
     verrou de 48 h, donc elle ne gardait plus rien.
     Retirer cette ligne le jour de la sortie suffit à l'ouvrir à tout
     le monde : c'est un seul mot à effacer, et rien d'autre à toucher. */
  { nom:"Les Mily et une nuits", biome:"nuits", pvQG:75000000,
    special:1, voie:"n", chantier:1,
    minJoueurs:7, attenteH:48, pvBonus:130, degBonus:60,
    victoire:"Mily t'emmène voir le jour se lever sur les dômes !" }
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

/* ================================================================
   UNE CARTE EN CHANTIER

   Une carte peut exister, être générée, être jouable dans le code —
   et ne pas être PRÊTE. Celle-là s'affiche sur l'accueil avec une
   étiquette « bientôt disponible », et trois portes lui sont fermées :
   on ne peut ni la lancer, ni la rejoindre, ni la visiter.

   Il reste une porte, et une seule : cinq secondes de doigt posé sur
   sa vignette, puis le mot de passe du salon. C'est exactement le
   geste qui gardait la visite avant qu'on l'ouvre à tout le monde —
   introuvable par hasard, et immédiat quand on le connaît.

   Pourquoi la montrer plutôt que la cacher : une carte qu'on voit
   arriver donne envie, une carte qui apparaît un matin surprend. Et
   surtout, la cacher voudrait dire la retirer de VOIES_EVT, donc de
   l'instantané partagé — sa voie disparaîtrait des messages, et le
   jour de l'ouverture tous les salons repartiraient de zéro dessus.
   ================================================================ */
function carteEnChantier(i){ return !!(CARTES[i] && CARTES[i].chantier); }

/* ================================================================
   LES VOIES D'ÉVÉNEMENT

   Une carte événement ne peut pas vivre dans le champ « c » de
   l'instantané : ce champ porte la campagne, sa fusion est monotone
   croissante, et une expédition qui se termine devrait faire
   REDESCENDRE l'index — ce que la fusion refuse par construction, et à
   raison. La jungle a donc sa propre voie depuis toujours : huit
   champs préfixés par « j ».

   Il y en a maintenant PLUSIEURS, et c'est le seul changement de fond
   de tout ce remaniement : la voie n'est plus « la jungle », c'est une
   LETTRE. Chaque carte événement porte la sienne dans CARTES, et les
   neuf champs se déduisent d'elle :

     <P>e   compteur de LANCEMENTS, ne fait qu'augmenter
     <P>f   compteur de FINS, ne fait qu'augmenter
            → une expédition est en cours si et seulement si e > f
     <P>d   bâtiments détruits,  <P>bl  bâtiments ENTAMÉS mais debout,
     <P>q   PV du Brasier
            → tous les trois portés par l'époque <P>e, comme d, bl et
              pv le sont par cy
     <P>t   heure de la dernière victoire, en ms epoch (le max gagne)
     <P>m   minimum de joueurs,  <P>mn  son numéro de réglage
     <P>b   bonus de PV des défenses, réglé avec le même numéro

   ATTENTION AUX NOMS : <P>b et <P>bl sont DEUX champs différents, le
   bonus de PV et les blessures. C'est la même discipline que <P>m et
   <P>mn, qui cohabitent depuis toujours — les clés d'un objet ne se
   confondent pas par leur préfixe.

   POURQUOI UNE LETTRE ET PAS UN TABLEAU. Parce que l'instantané est
   fusionné champ par champ par des clients qui ne connaissent pas
   forcément les mêmes cartes. Un client resté sur une ancienne version
   ne sait rien de la voie « n » : il la recopie sans la comprendre, ou
   plutôt il ne la recopie pas du tout — et c'est ce qu'il faut. Un
   tableau, lui, se serait fait tronquer en entier par le premier
   client en retard. Chaque voie est indépendante des autres et de la
   campagne : on peut être en avance sur l'une et en retard sur l'autre
   sans que rien ne se perde.

   `ch` (les champions) et `t3` (les podiums) restent COMMUNS : ils
   portent toutes les cartes à la fois, événements compris, et ils
   n'appartiennent à aucune voie.
   ================================================================ */
var VOIES_EVT = (function(){
  var o = [];
  for(var i = 0; i < CARTES.length; i++)
    if(CARTES[i].special && CARTES[i].voie) o.push({ i:i, P:CARTES[i].voie });
  return o;
})();
/* La lettre d'une carte, ou "" si ce n'est pas un événement. */
function voieDeCarte(i){ return (CARTES[i] && CARTES[i].voie) || ""; }
/* Et la carte d'une lettre. */
function carteDeVoie(P){
  for(var k = 0; k < VOIES_EVT.length; k++) if(VOIES_EVT[k].P === P) return VOIES_EVT[k].i;
  return -1;
}
/* ----------------------------------------------------------------
   LES RÉGLAGES D'UN ÉVÉNEMENT

   Ils étaient quatre constantes nommées JUNGLE_*, ce qui allait très
   bien tant qu'il n'y avait qu'une carte événement. Chaque événement
   peut maintenant porter les siens dans CARTES ; les constantes
   restent le DÉFAUT, et la jungle ne déclare rien, donc rien ne bouge
   pour elle.
   ---------------------------------------------------------------- */
function reglagesEvt(i){
  var c = CARTES[i] || {};
  return {
    minJoueurs:(c.minJoueurs  > 0) ? (c.minJoueurs | 0) : EQ.JUNGLE_MIN_JOUEURS,
    attenteH  :(c.attenteH    > 0) ? +c.attenteH        : EQ.JUNGLE_ATTENTE_H,
    pvBonus   :(c.pvBonus  !== undefined) ? (c.pvBonus  | 0) : EQ.JUNGLE_PV_BONUS,
    degBonus  :(c.degBonus !== undefined) ? (c.degBonus | 0) : EQ.JUNGLE_DEG_BONUS
  };
}

/* ================================================================
   L'ORDRE DE LA CAMPAGNE

   L'enchaînement était « index + 1 », et cela marchait tant que les
   cartes ordinaires occupaient le début du tableau. Ce n'est plus
   vrai : la jungle porte l'index 5, et les trois îles ajoutées après
   elle portent les index 6, 7 et 8.

   POURQUOI ON NE LES A PAS GLISSÉES AVANT LA JUNGLE, ce qui aurait
   gardé la formule. Parce que l'index d'une carte est une CLÉ, pas un
   rang d'affichage : les scores sont rangés sous « seau:carte », le
   cumul local sous mesDegats[index], les champions sous cet index, et
   le bitmap des destructions appartient à la carte de cet index.
   Décaler la jungle de 5 à 8 aurait effacé tout ce que le salon a fait
   dessus. UN INDEX ATTRIBUÉ NE BOUGE JAMAIS — même règle que pour les
   bâtiments, et pour exactement la même raison.

   On NOMME donc l'enchaînement au lieu de le déduire. Il se trouve
   qu'il reste croissant (0, 1, 2, 3, 4, 6, 7, 8), et c'est heureux :
   toutes les comparaisons « i < carteSalon » qui disent l'île déjà
   tombée, et le « Math.max » qui retient le salon le plus avancé,
   restent justes sans y toucher. Le jour où une carte événement
   s'intercalerait autrement, c'est rangCampagne() qu'il faudrait leur
   faire lire — et c'est pour ça qu'elle existe.
   ================================================================ */
var ORDRE_CAMPAGNE = (function(){
  var o = [];
  for(var i = 0; i < CARTES.length; i++) if(!CARTES[i].special) o.push(i);
  return o;
})();
/* Le rang d'une île dans la campagne, ou -1 si elle n'en fait pas
   partie (les cartes événement n'ont pas de rang). */
function rangCampagne(index){
  for(var i = 0; i < ORDRE_CAMPAGNE.length; i++)
    if(ORDRE_CAMPAGNE[i] === (index | 0)) return i;
  return -1;
}
/* L'île d'après. Rend -1 quand il n'y en a plus : c'est à l'appelant
   de décider ce que « plus d'île » veut dire — pour la campagne, une
   campagne neuve. */
function carteSuivante(index){
  var r = rangCampagne(index);
  if(r < 0 || r + 1 >= ORDRE_CAMPAGNE.length) return -1;
  return ORDRE_CAMPAGNE[r + 1];
}
/* La première île de la campagne — celle où l'on repart. */
function premiereCarte(){ return ORDRE_CAMPAGNE.length ? ORDRE_CAMPAGNE[0] : 0; }

/* ================================================================
   UNE ÎLE EST-ELLE ORAGEUSE ?

   Cette question paraît triviale, et elle a pourtant coûté une jungle
   ensoleillée à un joueur qui attendait l'orage.

   LE DÉFAUT. Tout l'orage — la nappe d'ombres, la brume, le voile
   d'air, les nuages, la pluie, la foudre, le son — était conditionné à
   `jeu.geysers.length`, en cinq endroits. Le raccourci se comprenait :
   seule la jungle a des geysers, donc « il y a des geysers » voulait
   dire « on est dans la jungle ». Sauf que le tableau des geysers est
   le résultat d'un TIRAGE AU SORT : sources/10-noyau.js demande
   vingt-deux ouvertures, s'accorde deux cents essais pour chacune, et
   si toutes butent sur une case occupée elle rend un tableau vide —
   sans repli, sans message, sans erreur. Mesuré : avec un plan
   suffisamment dense, zéro geyser sur vingt-deux demandés.

   Autrement dit, l'orage de la jungle dépendait d'une loterie de
   placement. Un plan enregistré dans le salon remplace le plan gravé
   (voir planDeCarte), et le plan gravé est le seul à réserver les
   clairières où un geyser tient ; il suffisait donc d'un plan un peu
   trop chargé pour que la carte événement perde son ciel.

   LA CORRECTION. Un orage n'est pas une propriété d'un tableau, c'est
   une propriété de l'ÎLE. On le lit donc sur le biome, qui ne dépend
   ni du plan, ni du tirage, ni du réseau, ni de rien que le joueur
   puisse changer. Et le jour où une deuxième île de jungle arrive,
   elle a son orage sans qu'on ait à y penser.
   ================================================================ */
function carteOrageuse(i){ return !!(CARTES[i] && CARTES[i].biome === "jungle"); }

/* Où tombent les tornades de flammes. Même raisonnement que
   carteOrageuse, et pour la même raison : c'est une propriété de
   l'ÎLE, jamais d'un tirage ni d'un tableau qui pourrait revenir
   vide. */
function carteTornades(i){ return !!(CARTES[i] && CARTES[i].biome === "tenebres"); }

/* Et où tournent les tourbillons d'étoiles. Même mécanique exactement
   — c'est le même code qui les fait naître, descendre, marcher et
   mourir — mais ni la même taille, ni la même couleur, ni la même
   traînée. */
function carteTourbillons(i){ return !!(CARTES[i] && CARTES[i].biome === "nuits"); }

/* Et où l'AIR LUI-MÊME est magique : la poussière d'étoile, les
   étoiles flottantes, les bulles et les papillons géants. Même
   raisonnement que carteOrageuse : une propriété de l'ÎLE, jamais
   d'un tirage. Voir 44-nuits-air.js. */
function carteAirMagique(i){ return !!(CARTES[i] && CARTES[i].biome === "nuits"); }

/* Et où passe la tornade CLASSIQUE — celle de poussière et de terre,
   la seule des trois qui ressemble à une vraie. Elle traverse une île
   de CAMPAGNE, c'est-à-dire une île qu'on joue longtemps : elle est
   donc plus longue et plus rare que les deux autres. */
function carteTornadeTerre(i){ return !!(CARTES[i] && CARTES[i].biome === "campagne"); }

/* Et où l'on danse sous les tornades : la guinguette. Même sorte que
   la campagne — de la poussière et des débris — mais par deux. */
function carteTornadeFete(i){ return !!(CARTES[i] && CARTES[i].biome === "guinguette"); }

/* ================================================================
   LE PROFIL D'UNE TORNADE

   Il y a deux tornades dans le jeu, et il n'y a qu'un seul moteur.
   C'était la bonne façon de faire la seconde : dupliquer quatre cents
   lignes de mise à jour aurait donné deux mécaniques qui divergent au
   premier réglage — l'une corrigée, l'autre oubliée, et personne pour
   s'en apercevoir avant qu'un joueur y perde sa flotte.

   Tout ce qui distingue les deux tient donc dans cette table. Le
   dessin, lui, est bien différent : `style` dit lequel.

     feu       les ténèbres. Une colonne de flammes, une traînée qui
               brûle la terre.
     etoiles   les Mily et une nuits. Une fois et demie plus grande,
               plus lente, avec une traînée plus large qui n'est pas du
               feu mais de la poussière d'étoile.
     poussiere la campagne. La tornade de référence : de la terre, des
               débris, un mur de poussière. Plus longue et plus rare —
               une île de campagne se joue longtemps.

   POURQUOI LA GRANDE DESCEND PLUS LENTEMENT. L'avertissement n'est
   pas de la décoration : c'est ce qui sépare un danger d'un piège. Le
   couloir mortel du tourbillon fait 3,75 cases contre 2,5 pour la
   tornade de feu ; à préavis égal, il faudrait courir une fois et
   demie plus vite pour en sortir. On allonge donc la descente dans la
   même proportion, et la promesse tient : le Commando, la troupe la
   plus lente du jeu, parcourt 3,4 cases pendant que l'entonnoir
   descend — presque le double du rayon qui tue.
   ================================================================ */
function profilTornade(i){
  if(carteTornades(i)) return {
    periode:EQ.TORNADE_PERIODE, descente:EQ.TORNADE_DESCENTE,
    vie:EQ.TORNADE_VIE, vitesse:EQ.TORNADE_VITESSE, rayon:EQ.TORNADE_RAYON,
    trainee:EQ.TORNADE_TRAINEE, traineeR:EQ.TORNADE_TRAINEE_R,
    trajetMin:EQ.TORNADE_TRAJET_MIN, trajetMax:EQ.TORNADE_TRAJET_MAX,
    marge:EQ.TORNADE_MARGE_BORD, ech:EQ.TORNADE_ECH_VISUEL,
    haut:330 * EQ.TORNADE_ECH_VISUEL * EQ.TORNADE_HAUT_ECH, style:"feu",
    paire:1, jitter:EQ.TORNADE_JITTER, ecart:0
  };
  if(carteTourbillons(i)) return {
    periode:EQ.TOURBILLON_PERIODE, descente:EQ.TOURBILLON_DESCENTE,
    vie:EQ.TOURBILLON_VIE, vitesse:EQ.TOURBILLON_VITESSE, rayon:EQ.TOURBILLON_RAYON,
    trainee:EQ.TOURBILLON_TRAINEE, traineeR:EQ.TOURBILLON_TRAINEE_R,
    trajetMin:EQ.TORNADE_TRAJET_MIN, trajetMax:EQ.TORNADE_TRAJET_MAX,
    marge:EQ.TORNADE_MARGE_BORD, ech:EQ.TORNADE_ECH_VISUEL,
    haut:330 * EQ.TOURBILLON_ECH * EQ.TORNADE_ECH_VISUEL * EQ.TORNADE_HAUT_ECH,
    style:"etoiles",
    paire:EQ.TOURBILLON_PAIRE, jitter:EQ.TOURBILLON_JITTER, ecart:EQ.TOURBILLON_ECART
  };
  if(carteTornadeTerre(i)) return {
    periode:EQ.CLASSIQUE_PERIODE, descente:EQ.CLASSIQUE_DESCENTE,
    vie:EQ.CLASSIQUE_VIE, vitesse:EQ.CLASSIQUE_VITESSE, rayon:EQ.CLASSIQUE_RAYON,
    trainee:EQ.CLASSIQUE_TRAINEE, traineeR:EQ.CLASSIQUE_TRAINEE_R,
    trajetMin:EQ.TORNADE_TRAJET_MIN, trajetMax:EQ.TORNADE_TRAJET_MAX,
    marge:EQ.TORNADE_MARGE_BORD, ech:EQ.TORNADE_ECH_VISUEL,
    haut:330 * EQ.TORNADE_ECH_VISUEL * EQ.TORNADE_HAUT_ECH, style:"poussiere",
    paire:1, jitter:EQ.TORNADE_JITTER, ecart:0
  };
  /* LA GUINGUETTE. Même tornade que la campagne, mais PAR DEUX : la
     carte manquait d'événement, et deux colonnes qui traversent une
     piste de danse en font un. */
  if(carteTornadeFete(i)) return {
    periode:EQ.GUINGUETTE_PERIODE, descente:EQ.CLASSIQUE_DESCENTE,
    vie:EQ.CLASSIQUE_VIE, vitesse:EQ.CLASSIQUE_VITESSE, rayon:EQ.CLASSIQUE_RAYON,
    trainee:EQ.CLASSIQUE_TRAINEE, traineeR:EQ.CLASSIQUE_TRAINEE_R,
    trajetMin:EQ.TORNADE_TRAJET_MIN, trajetMax:EQ.TORNADE_TRAJET_MAX,
    marge:EQ.TORNADE_MARGE_BORD, ech:EQ.TORNADE_ECH_VISUEL,
    haut:330 * EQ.TORNADE_ECH_VISUEL * EQ.TORNADE_HAUT_ECH, style:"poussiere",
    paire:EQ.TOURBILLON_PAIRE, jitter:EQ.TOURBILLON_JITTER, ecart:EQ.TOURBILLON_ECART
  };
  return null;
}
/* Combien d'entonnoirs ce profil met au sol d'un coup. Une seule
   lecture, pour que personne n'ait à se souvenir que « paire »
   pourrait manquer. */
function paireTornade(P){ return Math.max(1, (P && P.paire) | 0); }
/* Cette île a-t-elle des tornades, quelle qu'en soit la sorte ? */
function carteAvecTornades(i){ return !!profilTornade(i); }

/* ================================================================
   OÙ LA FOUDRE TOMBE

   Elle n'appartenait qu'à la jungle, parce que tout l'orage y était
   d'un bloc : le ciel vert, la brume, la pluie, les nuages, la foudre
   et le tonnerre tenaient dans un seul carteOrageuse(). Les ténèbres
   veulent la FOUDRE et LE TONNERRE, mais surtout pas la pluie ni la
   brume verte — il ne pleut pas sur un monde de lave.

   On sépare donc les deux questions. carteOrageuse() reste « cette
   île est-elle sous un orage tropical complet » ; carteFoudre() dit
   « le ciel y jette-t-il des éclairs et gronde-t-il ». La jungle
   répond oui aux deux, les ténèbres à la seconde seulement.
   ================================================================ */
function carteFoudre(i){ return carteOrageuse(i) || carteTornades(i); }

/* ================================================================
   LA SCÈNE D'IBIZA

   « Au centre, un carré qui soit réservé et une sorte de scène avec un
   DJ qui met de la musique, des lasers qui pointent vers le ciel et
   une vingtaine de personnes qui dansent devant lui. »

   LE CARRÉ RÉSERVÉ EST LA PARTIE SÉRIEUSE. La scène elle-même n'est
   que du décor — elle ne se détruit pas, elle ne compte pas, elle
   n'entre pas dans le tableau des bâtiments — mais le trou qu'elle
   creuse dans le quadrillage militaire, lui, EN FAIT PARTIE : les
   défenses qui auraient dû s'y poser n'existent plus, et le tableau
   change de longueur. C'est le seul endroit de l'île où le générateur
   saute des nœuds pour une raison qui n'est pas le hasard.

   Il est posé au milieu de la terre praticable — pas au milieu de la
   carte, qui compte la plage et le Brasier. C'est là qu'on le voit en
   traversant, et c'est là qu'il vaut quelque chose.
   ================================================================ */
var SCENE_GX = 76, SCENE_GY = 68, SCENE_DEMI = 11;
function carteScene(i){ return !!(CARTES[i] && CARTES[i].biome === "ibiza"); }
/* Le point est-il dans le carré réservé ? */
function dansLaScene(gx, gy){
  return Math.abs(gx - SCENE_GX) <= SCENE_DEMI && Math.abs(gy - SCENE_GY) <= SCENE_DEMI;
}
/* Le rythme des impacts, par île. */
function periodeEclair(i){
  return carteTornades(i) ? EQ.TENEBRES_ECLAIR : EQ.JUNGLE_ECLAIR;
}

/* ================================================================
   LE CIEL D'UNE ÎLE

   Même raisonnement que carteOrageuse, poussé d'un cran. L'orage est
   une propriété de l'île ; la COULEUR DES NUAGES en est une autre, et
   elle ne se déduit pas de la première.

   Le jeu n'avait que deux ciels : celui de l'orage, ventre presque
   noir, et celui du beau temps, ventre gris clair sous une crête
   blanche. Ce dernier était servi à toutes les îles non orageuses —
   ce qui allait très bien tant qu'elles étaient toutes de plein jour.
   Une nappe blanche au-dessus d'un monde de lave se lit comme de la
   neige ; au-dessus d'une guinguette de nuit, comme un projecteur.

   Quatre ciels, donc, nommés par ce qu'ils sont et choisis sur le
   biome — jamais sur un tirage, jamais sur l'index.
   ================================================================ */
var CIELS_ILE = { jungle:"orage", tenebres:"fumee", guinguette:"nuit",
                  nuits:"etoile" };
function styleCiel(i){
  var b = CARTES[i] && CARTES[i].biome;
  return (b && CIELS_ILE[b]) || "clair";
}

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
  /* ================================================================
     LES TÉNÈBRES SE DÉFENDENT VRAIMENT.

     « C'est trop gentil là, beaucoup de lance-roquettes, des
     lance-flammes aussi, et d'autres, de manière harmonieuse. »

     DEUX LEVIERS, ET C'EST LE PREMIER QUI COMPTE LE PLUS.
     La DENSITÉ d'abord : le quadrillage militaire saute 28 % de ses
     nœuds partout ; ici il n'en saute plus que 13 %. C'est ce nombre,
     et lui seul, qui fait passer l'île de sept cent quatre-vingts
     défenses à mille et quelques — changer les proportions sans
     toucher à la densité aurait donné une île tout aussi clairsemée,
     simplement peuplée d'autre chose.

     LA COMPOSITION ensuite, et « harmonieuse » est le mot juste : le
     piège serait de tout mettre en Frelons. Une île d'une seule arme
     se joue d'une seule façon — on trouve la parade une fois, et elle
     vaut partout. Chaque bande garde donc QUATRE armes actives et des
     rôles qui se complètent :
       — le FRELON, le lance-roquettes, est le fil rouge des trois
         bandes : c'est lui que le joueur a demandé en nombre, et sa
         longue portée fait la pression sur toute la traversée ;
       — le CHALUMEAU, le lance-flammes, est massé PRÈS du Brasier :
         il ne porte qu'à cinq cases et demie, c'est une arme de
         contact, et sa place est là où l'on arrive enfin. Sur une île
         de feu, c'est aussi l'arme qui va de soi ;
       — le PILON et le CRIBLE tiennent le milieu et le lointain, l'un
         par l'obus, l'autre par la rafale ;
       — les stocks inertes (cuve, silo) tombent à presque rien : ils
         ne tirent pas, et ici chaque emplacement doit menacer.
     ================================================================ */
  if(fic.biome === "tenebres"){
    bandeProche = [["chalumeau",0.34],["frelon",0.30],["bobine",0.20],["pilon",0.12],["cuve",0.04]];
    bandeMoy    = [["frelon",0.34],["pilon",0.26],["chalumeau",0.18],["crible",0.16],["silo",0.06]];
    bandeLoin   = [["frelon",0.36],["pilon",0.26],["crible",0.24],["chalumeau",0.10],["silo",0.04]];
  }
  /* LA DENSITÉ SE RÈGLE À DEUX ENDROITS, et le premier essai n'a
     touché que le mauvais.
       — LA PART DE NŒUDS SAUTÉS. Descendre de 28 % à 13 % ne pouvait
         donner au mieux que × 1,2 : on ne peut pas garder plus que
         tous les nœuds, et le plafond de ce levier seul était de
         onze cents défenses. Mesuré : 780 → 866, à peine plus.
       — LE PAS DU QUADRILLAGE, qui est le vrai levier. Il vaut cinq
         cases partout ; le resserrer à quatre multiplie le nombre de
         NŒUDS par (5/4)² = 1,56. C'est celui-là qu'il fallait bouger.
     Les deux ensemble portent les ténèbres à plus de treize cents
     défenses — presque le double des autres îles — sans jamais
     approcher les deux mille cent cinquante du plan gravé de la
     jungle, qui tiennent sur la même île sans se chevaucher. */
  var sautIle = (fic.biome === "tenebres") ? 0.10 : 0.28;
  var pasIle  = (fic.biome === "tenebres") ? 4    : 5;
  var scene   = (fic.biome === "ibiza");

  for(var lx = 6; lx <= PLAGE_X0 - 3; lx += pasIle){
    for(var ly = 3; ly <= GH - 4; ly += pasIle){
      /* La zone du plan sous ce nœud décide de deux choses : combien on
         en saute ici, et quel type on y pose. Elle ne décide RIEN
         d'autre — la position, le jitter et l'orientation restent
         tirés comme avant. */
      var Q = P ? planEn(P, lx, ly) : null;
      var saut = Q ? Q.saut : sautIle;
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
        if(al() < sautIle) continue;
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
      /* LA PISTE DE DANSE, sur la position FINALE — et sur elle seule.
         Il y avait ici deux tests : un premier sur le nœud du treillis,
         posé avant les tirages, et celui-ci. Le premier est parti, pour
         deux raisons. D'abord il enfreignait la règle de la maison — un
         « continue » avant les tirages saute la séquence au lieu de la
         consommer. Ensuite il ne servait à rien : le bâtiment se pose
         avec un jitter, donc seule la position FINALE dit s'il tombe
         sur la piste, et c'est exactement ce que teste cette ligne.
         Le garder élargissait le trou d'une demi-case tout autour et
         coûtait quarante-deux défenses pour rien.
         Comme la gomme forte : la séquence est consommée, seul le
         résultat est jeté. */
      if(scene && dansLaScene(gx, gy)) continue;
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
        if(scene && dansLaScene(bx, by)) continue;
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
    /* rien ne pousse sur la piste de danse : ni parasol ni transat.
       Le tirage est consommé quand même — sauter la ligne suivante
       sans consommer décalerait tous les décors suivants. */
    if(scene && dansLaScene(px, py)) continue;
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
      /* LA PISTE DE DANSE EST UN OBSTACLE POUR LA SPIRALE. La cinquième
         cellule vise le milieu de la terre praticable — très exactement
         le centre de la scène. Sans cette ligne elle se posait au
         milieu des danseurs. La spirale sait s'écarter : elle sort du
         carré en quelques pas, et l'île garde ses cinq cellules. */
      if(scene && dansLaScene(px2, py2)) continue;
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
      /* et la piste de danse, comme partout : après les tirages */
      if(scene && dansLaScene(sx + jxs, sy + jys)) continue;
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
      /* et pas de tour de guet au milieu de la piste */
      if(scene && dansLaScene(gxm, gym)) continue;
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

  /* --- LA GUINGUETTE PAVOISE ---
     Le dernier bâtiment posé de toute la fonction, et ce n'est pas un
     hasard : la figure AJOUTE À LA FIN du tableau. Les huit cent
     trente rangs d'origine ne bougent pas d'un cran, donc pas un bit
     de destruction des salons en cours ne change de sens, et les
     rangs neufs — que personne n'a jamais abattus — se lisent
     « intacts » dans un instantané plus ancien, ce qui est vrai.
     Son propre flux de tirage, comme la jungle et le jardin : rien de
     ce qui précède ne peut la décaler, et rien ne vient après elle. */
  if(CARTES[index] && CARTES[index].biome === "guinguette"){
    var avantPavois = c.batiments.length;
    var defAvant = compteDefenses(c);
    var cible = Math.round(defAvant * (1 + PAVOIS_HAUSSE));
    var alG = prng((gr ^ 0x6A17E7EE) >>> 0);
    /* On dessine, on rouvre, on complète, on rouvre encore. Deux tours
       et pas trois : le premier pose la figure, qui ferme des
       secteurs ; le second pose des lampions isolés, qui n'en ferment
       pratiquement aucun — mesuré, le deuxième passage d'ouverture ne
       retire plus qu'une poignée de bâtiments. */
    pavoiseLaGuinguette(c, alG);
    ouvreLaFete(c, avantPavois);
    lampionsGuinguette(c, alG, cible);
    ouvreLaFete(c, avantPavois);
    /* --- ET LE RENFORT, PAR-DESSUS, SANS TOUCHER À RIEN ---
       Tout ce qui précède est exactement la guinguette de la v0.74,
       tirage pour tirage : elle est en ligne, ses rangs sont l'index
       des destructions. Le renfort s'ajoute derrière, et l'ouverture
       qui le suit reçoit pour plancher la longueur atteinte ici — elle
       ne peut donc défaire que l'ouvrage du renfort. */
    var geleV074 = c.batiments.length;
    renfortGuinguette(c, alG, Math.round(defAvant * (1 + PAVOIS_RENFORT)));
    ouvreLaFete(c, geleV074, PAVOIS_POCHE_RENFORT, 1, PAVOIS_PASSES_RENFORT);
  }

  /* --- LES CHATS DE MILY SORTENT DES MURS ---
     Ici, et pas plus haut : à cette place tous les bâtiments sont
     posés, cellules peintes ET pavois compris, et rien de ce qui suit
     ne lit la position des chats. */
  degageLesProteges(c);

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

  /* --- LES NUITS : LEUR BESTIAIRE ENCHANTÉ ---
     Même place et même précaution que la jungle, et pour la même
     raison : son PROPRE flux de tirage, semé sur la seule graine de
     la carte. Rien de ce qui précède ne peut le décaler, et comme
     rien ne vient après lui, il ne décale personne — l'indice de
     chaque bâtiment, donc chaque bit de destruction de chaque salon
     en cours, ne bouge pas d'un cran. Le sel diffère de celui de la
     jungle, sans quoi les deux îles peupleraient aux mêmes endroits. */
  if(CARTES[index] && CARTES[index].biome === "nuits")
    peupleLesNuits(c, prng((gr ^ 0x0F17A11E) >>> 0));

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
  /* Le durcissement vaut pour TOUTE carte événement, chacune avec son
     propre bonus : il se lisait sur le biome « jungle », ce qui aurait
     laissé la deuxième carte spéciale avec des défenses de campagne. */
  /* DEUX FACTEURS, UNE SEULE PASSE. Le bonus de la carte événement
     (réglé par voie, hérité de la jungle) et le BLINDAGE réglé à
     l'accueil (une carte quelconque, y compris de campagne) se
     multiplient : ils répondent à deux questions différentes — « cette
     expédition est-elle plus dure que la campagne ? » et « de combien
     veut-on durcir CETTE île ? » — et rien n'oblige à choisir.
     Les trois mêmes exceptions dans les deux cas : la cellule à
     récolter, le réacteur du bouclier, et le Brasier qui n'est pas
     dans ce tableau. */
  var bpv = bonusPvDeCarte(index), kbl = facteurBlindage(index);
  var kpv = (1 + bpv / 100) * kbl;
  if(kpv !== 1){
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
/* Un bonus PAR ÉVÉNEMENT, et non plus un seul pour tout le jeu : deux
   cartes spéciales n'ont aucune raison d'avoir des défenses de la même
   dureté, et leurs deux réglages voyagent sur deux voies séparées. */
var bonusPvEvt = (function(){
  var o = {};
  for(var k = 0; k < VOIES_EVT.length; k++)
    o[VOIES_EVT[k].P] = reglagesEvt(VOIES_EVT[k].i).pvBonus;
  return o;
})();
/* Gardée sous son nom : l'accueil affiche « Défenses +N % PV » et lit
   celle-ci. C'est la valeur de la jungle. */
var bonusPvJungle = EQ.JUNGLE_PV_BONUS;
function poseBonusPvEvt(P, p){
  if(!P) return 0;
  var def = reglagesEvt(carteDeVoie(P)).pvBonus;
  var v = (typeof p === "number" && isFinite(p)) ? p : def;
  bonusPvEvt[P] = borne(Math.round(v), 0, 900);
  if(P === "j") bonusPvJungle = bonusPvEvt[P];
  return bonusPvEvt[P];
}
function poseBonusPvJungle(p){ return poseBonusPvEvt("j", p); }
/* Le bonus en vigueur pour une carte. Zéro pour une île de campagne :
   c'est ce zéro qui fait que le durcissement ne la touche jamais. */
function bonusPvDeCarte(i){
  var P = voieDeCarte(i);
  if(!P) return 0;
  /* Tant que le salon n'a rien posé, c'est le défaut DE LA CARTE qui
     vaut — jamais zéro. Sans ce repli, une carte événement bâtie avant
     le premier instantané reçu sortait du générateur avec des défenses
     de campagne, et personne n'aurait vu pourquoi. */
  return (bonusPvEvt[P] !== undefined) ? (bonusPvEvt[P] | 0) : reglagesEvt(i).pvBonus;
}
/* Le multiplicateur de DÉGÂTS des défenses d'une carte événement. Il
   ne peut pas être appliqué à la génération comme les PV : les dégâts
   sont lus dans DEF au moment du tir, et DEF est partagé par toutes
   les cartes. On le lit donc au coup par coup, à l'unique endroit où
   une défense décide de ce qu'elle inflige. */
function multDegatsDefense(){
  if(!jeu || !carteSpeciale(jeu.index)) return 1;
  return 1 + reglagesEvt(jeu.index).degBonus / 100;
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
/* ================================================================
   LA TAILLE DES ARBRES DE L'INTÉRIEUR, ET LEUR NOMBRE

   Trois réglages successifs, et il fallait les trois pour tomber
   juste. À l'échelle 1 ils ne lisaient pas comme une forêt ; montés à
   1,25–1,85 ils lisaient enfin, mais ils sont devenus trop GROS une
   fois autorisés à pousser entre les tourelles — une masse de
   feuillage par tourelle, ce n'est plus une jungle, c'est un
   couvercle.

   On les rend donc deux fois et demie plus petits, et l'on en met
   BEAUCOUP PLUS : c'est le rapport qui fait une forêt, pas la taille.
   Un arbre coûte le même blit quelle que soit sa taille, donc en
   ajouter se paie ; les rétrécir, non. Le renfort est posé À LA FIN
   de la génération, après la faune, précisément pour que pas un seul
   tirage de ce qui existe déjà ne se décale : les tourelles, le
   tapis, les geysers et les bêtes restent exactement où ils sont.
   ================================================================ */
var ECH_ARBRE_MIN     = 0.52;
var ECH_ARBRE_ETENDUE = 0.26;   // 0,52 à 0,78 — deux fois et demie plus petit
var RENFORT_ARBRES    = 900;    // dans l'île, en plus des 420 d'origine
var RENFORT_POURTOUR  = 1500;   // dans la ceinture, en plus des 2 810

/* ================================================================
   LES TROIS CHATS NE NAISSENT PLUS DANS UNE TOURELLE

   Leur semis est le seul du fichier qui ne consulte ni l'occupation
   ni le plan : il tire une place, vérifie qu'elle est loin du
   Brasier, et pose la bête. Sur une île à mille deux cent cinquante
   bâtiments, un chat sur trois pouvait donc naître SOUS un Pilon —
   un appât qu'on ne voit pas, dont la mort déclenche pourtant la
   vengeance.

   ────────────────────────────────────────────────────────────────
   POURQUOI ON NE CORRIGE PAS LE TIRAGE, MAIS SON RÉSULTAT

   Ajouter un test d'occupation à la boucle de semis serait la façon
   naturelle de faire, et elle est interdite ici. Le semis tire deux
   nombres par tentative et s'arrête à la première qui passe : rendre
   le test plus sévère fait échouer plus de tentatives, donc consommer
   plus de tirages, donc DÉCALER tout ce qui suit — et ce qui suit,
   ce sont les champs de cellules peints, qui posent des BÂTIMENTS.
   Un bâtiment décalé, c'est l'indice de tous les suivants qui glisse,
   et le bitmap des destructions de tous les salons en cours qui ne
   veut plus rien dire.

   On tire donc exactement comme avant, et l'on DÉGAGE ensuite : une
   spirale à pas fixes, sans un seul appel au générateur. C'est la
   règle de la maison, celle des tornades jumelles — on tire d'abord,
   on corrige après.
   ================================================================ */
function degageLesProteges(c){
  /* la grille des cases occupées, dressée une fois */
  var occ = {}, i, dx, dy;
  for(i = 0; i < c.batiments.length; i++){
    var b = c.batiments[i];
    if(b.t === "cellule") continue;          // une cellule ne cache pas un chat
    var ax = Math.round(b.gx), ay = Math.round(b.gy), r = Math.ceil((b.e || 2) * 0.5);
    for(dx = -r; dx <= r; dx++)
      for(dy = -r; dy <= r; dy++) occ[(ax + dx) + "," + (ay + dy)] = 1;
  }
  function libre(x, y){
    return x > 4 && x < PLAGE_X0 - 2 && y > 3 && y < GH - 4 &&
           !occ[Math.round(x) + "," + Math.round(y)];
  }
  for(i = 0; i < c.creatures.length; i++){
    var k = c.creatures[i];
    if(!CRE[k.t] || !CRE[k.t].protege) continue;
    if(libre(k.gx, k.gy)) continue;
    /* LA SPIRALE. Pas fixes, sans hasard : le premier point libre
       gagne, et le chat ne s'éloigne jamais de plus de six cases de
       l'endroit qu'il avait tiré. */
    for(var t = 1; t <= 6; t++){
      var trouve = 0;
      for(var a = 0; a < 12; a++){
        var an = a / 12 * 6.2832 + t * 0.4;
        var nx = k.gx + Math.cos(an) * t, ny = k.gy + Math.sin(an) * t;
        if(libre(nx, ny) && Math.hypot(nx - QG_GX, ny - QG_GY) >= 16){
          k.gx = nx; k.gy = ny; trouve = 1; break;
        }
      }
      if(trouve) break;
    }
  }
}

/* ================================================================
   LE PEUPLEMENT DES MILY ET UNE NUITS

   Quatre-vingts bêtes, contre sept cent soixante-dix-sept pour la
   jungle, et c'est délibéré. Une jungle doit GROUILLER ; un jardin de
   palais doit être habité par des apparitions, c'est-à-dire par des
   bêtes qu'on ne voit pas toutes en même temps. Le chiffre est celui
   d'une île ordinaire — environ quatre-vingt-cinq — et l'effet n'a
   rien à voir, parce que chacune de ces quatre-là s'annonce de loin.

   ────────────────────────────────────────────────────────────────
   CHACUNE A SON QUARTIER, ET LA GÉOMÉTRIE SUFFIT À LE DIRE

   La jungle recense sa flore case par case pour savoir où vit un
   koala. Ici il n'y a pas de flore : il y a un JARDIN, dont on
   connaît le plan par cœur puisqu'on l'a gravé. Un cercle et deux
   bornes suffisent donc, et ça ne coûte pas une grille :

     le paon        au cœur, dans l'enceinte de l'allée circulaire —
                    c'est la volière du palais, et sa roue mérite le
                    médaillon derrière elle ;
     le chat de lune dans le VIDE : les allées, le pourtour du bassin,
                    tout ce qui n'a pas de tourelle à quatre cases.
                    Il apparaît donc là où l'on marche, jamais dans
                    un massif ;
     le fennec      sur les bords, contre le rempart : c'est le
                    renard du désert, il vient des dunes ;
     le papillon    n'importe où — il vole, rien ne le retient.

   ────────────────────────────────────────────────────────────────
   LE BUDGET DE TIRAGES EST FIXE, comme partout dans ce fichier : on
   tire toujours le même nombre de groupes et l'on cesse simplement de
   POSER une fois l'effectif atteint. Une carte plus encombrée donne
   donc moins de bêtes, jamais une séquence différente.
   ================================================================ */
/* ================================================================
   LA GUINGUETTE PAVOISE — cinquante pour cent de défenses en plus,
   et elles dessinent la fête

   « À la guinguette il faut mettre 50 % de défenses en plus et les
   disposer de manière graphique guinguette. »

   ────────────────────────────────────────────────────────────────
   POURQUOI CE N'EST PAS UN PLAN GRAVÉ

   Le jardin des Mily et une nuits a été dessiné par un plan gravé —
   `planNuits()` — et c'est l'outil fait pour ça. Il est ici
   INTERDIT, et la raison n'a rien d'un détail de mise en œuvre.

   Un plan gravé passe par le quadrillage : il décide, nœud par nœud,
   ce qu'on pose et ce qu'on saute. Il REDESSINE donc l'île depuis le
   premier bâtiment, et le tableau `c.batiments` est un index — c'est
   lui qui porte le sens de chaque bit de destruction. Le jardin
   pouvait se permettre : sa carte était en chantier, fermée, aucune
   partie derrière elle. La guinguette est OUVERTE et jouée. Graver
   son plan, c'est rendre fausses les ruines de la partie en cours.

   D'où la seule construction admissible : on ne touche à RIEN de ce
   qui existe, et l'on AJOUTE À LA FIN du tableau. Les huit cent
   trente bâtiments d'origine gardent leur rang au bit près ; les
   nouveaux occupent des rangs qui n'ont jamais été employés, et
   qu'un instantané plus ancien lit donc comme « intact » — ce qui
   est exactement vrai : personne ne les a encore abattus.

   Deuxième conséquence, moins évidente : la figure ne peut pas faire
   de place. Elle ne déplace ni ne retire une seule tourelle
   existante. Elle se lit donc comme un SURCROÎT de densité sur un
   champ régulier — c'est déjà ce qui a fait les haies du jardin, et
   c'est ce qui marche : l'œil lit une ligne dense contre un semis
   régulier bien avant de lire une forme isolée.

   ────────────────────────────────────────────────────────────────
   LA FIGURE : LE BAL SOUS LES GUIRLANDES

   Une guinguette vue d'en haut, c'est une seule image, et tout le
   monde l'a en tête : un grand mât planté au milieu, des guirlandes
   qui rayonnent jusqu'à une couronne de lampadaires, et entre les
   lampadaires le feston qui retombe. Autour, les guéridons.

     LE PLANCHER DE BAL  au milieu de l'île, cerné de deux anneaux de
                      chalumeaux — les torches, et la barrière.
     CINQ FESTONS     des mâts régulièrement espacés, et d'un mât à
                      l'autre DEUX cordes qui retombent VERS
                      L'EXTÉRIEUR. C'est ce creux, et lui seul, qui
                      fait lire « guirlande » plutôt que « cercle » :
                      une corde tendue n'est pas une guirlande.
     LES LAMPADAIRES  un mirador à chaque mât.
     LES GUÉRIDONS    partout sur l'île : un silo — la table ronde —
                      et cinq cuves autour, les tonneaux.
     LES LAMPIONS     et, pour finir, des lanternes et des braseros
                      seuls, semés jusqu'à ce que le compte y soit.

   ET LES PERLES ALTERNENT SUR TROIS TEMPS : bobine, cuve, chalumeau.
   Une guirlande de fête n'est jamais d'une seule couleur — et c'est
   aussi le seul réglage d'équilibre de toute la figure, voir plus
   bas `bille()`.

   ────────────────────────────────────────────────────────────────
   CE QUI EST AJOUTÉ, ET CE QUE ÇA CHANGE VRAIMENT

   Mesuré sur huit salons : huit cent trente bâtiments deviennent
   onze cent soixante ; six cent soixante-huit DÉFENSES deviennent
   mille — cinquante pour cent tout rond, ce qui était la demande.
   Les dégâts par seconde de l'île montent de trente-huit pour cent,
   et la vie à démonter d'autant.

   LA PORTÉE, ELLE, NE BOUGE PAS. Rien de neuf ne tire à plus de
   douze cases : ni Frelon ni Pilon dans la figure. Le tir de loin
   augmente de huit pour cent, et le tir sur la plage de débarquement
   de trois. On aborde donc l'île comme avant, et la différence se
   paie EN ENTRANT DANS LA FÊTE. C'est la lecture juste de la demande
   — une guinguette mieux gardée, pas une île qu'on ne peut plus
   approcher.

   L'encombrement. La figure ne pose jamais un bâtiment à moins de
   `PAVOIS_ECART` d'un autre : c'est la règle des miradors, à
   l'identique. Les perles refusées laissent des trous dans la
   guirlande — et une guirlande à trous reste une guirlande.

   ────────────────────────────────────────────────────────────────
   SON PROPRE FLUX, ET PAS UN TIRAGE À LA SÉQUENCE COMMUNE

   Même précaution que la jungle et le jardin, pour la même raison :
   un seul `al()` pris à la séquence commune décalerait tout ce qui
   suit. Ici, en outre, la fonction est appelée APRÈS le dernier
   bâtiment de toutes les autres passes — rien ne vient derrière elle
   qui puisse être décalé.
   ================================================================ */
var PAVOIS_ECART    = 0.6;   // la marge des miradors, à l'identique
var PAVOIS_PAS      = 2.9;   // l'écart des perles sur la corde
var PAVOIS_JEU      = 0.18;  // le frisson d'une perle, en cases
var PAVOIS_CX       = 72;    // le milieu de la piste
var PAVOIS_CY       = 67;
var PAVOIS_PISTE    = 13;    // le rayon du plancher de bal
var PAVOIS_TABLES   = 150;   // guéridons tentés, sur toute l'île
var PAVOIS_LAMPIONS = 2400;  // essais de la passe qui tient le compte
var PAVOIS_HAUSSE   = 0.50;  // « cinquante pour cent de défenses en plus »

/* ================================================================
   LE RENFORT — « encore vingt pour cent, et une majorité de Frelons »

   C'EST UNE TROISIÈME PASSE, ET C'EST TOUT LE POINT. La guinguette
   pavoisée est en ligne depuis la v0.74 : ses onze cent soixante-deux
   rangs sont, dès maintenant, l'index qui porte le bitmap des
   destructions de quiconque y débarque. On n'y touche donc pas —
   ni la figure, ni le motif peint au sol, ni la passe qui tenait le
   compte à cinquante pour cent, ni même l'ouverture qui la suivait.
   Tout cela reste bit pour bit ce qu'il était, et le renfort s'ajoute
   DERRIÈRE, sur des rangs qui n'ont jamais existé pour personne.

   La conséquence pratique, et elle commande le code : l'ouverture qui
   suit le renfort ne reçoit plus 830 comme plancher mais la longueur
   ATTEINTE APRÈS la v0.74. Elle ne peut donc rouvrir que ce que le
   renfort a lui-même fermé. C'est une meilleure règle en soi — une
   passe ne défait que son propre ouvrage — et c'est elle qui rend le
   troisième étage possible.

   LA MARGE Y EST PLUS COURTE, et il faut le dire franchement. La
   figure garde celle des miradors — 0,6 — parce que c'est elle qui
   donne aux festons leur allure de guirlande et non de muraille. Le
   renfort, lui, pose des bâtiments ISOLÉS dans ce qui reste, et à 0,6
   il ne restait plus rien : l'île plafonnait à mille défenses. À
   0,30, deux bâtiments d'emprise deux sont à 2,3 case l'un de
   l'autre — leurs emprises se frôlent et ne se chevauchent jamais, le
   seuil réel étant 2,0.

   ET LE GROS PASSE D'ABORD. Le Frelon tient trois cases, il lui faut
   trois cases et demie de dégagement : posé après les petits, il ne
   trouve plus une seule place. Deux tours, donc — les Frelons, puis
   le reste — et c'est cet ordre, et lui seul, qui fait la majorité
   demandée. Mesuré : dans l'autre sens, quatorze Frelons au lieu de
   cent quatre-vingts.
   ================================================================ */
var PAVOIS_RENFORT   = 0.80;  // la cible finale, toujours comptée sur les 668 d'origine
var PAVOIS_TAMIS     = [3, 1.5, 0.75, 0.4];  // le balayage, du gros au fin
var PAVOIS_RECOIN    = 1;     // en deçà, un groupe de cases n'est pas un passage     // en deçà, un groupe de cases n'est pas un passage
/* ET LE SEUIL DE POCHE Y EST BIEN PLUS HAUT — mesuré, pas choisi.
   À trois cases, l'ouverture reprenait cent trente et un Frelons sur
   deux cent deux : le renfort se défaisait aux deux tiers. Or une
   case libre inatteignable ne fait de mal à personne — aucune troupe
   ne peut s'y trouver, puisqu'aucune ne peut y aller. Ce qui ferait
   du mal, c'est un SECTEUR muré, où l'on entre par un côté qui se
   referme, et c'est un bâtiment qu'on ne pourrait plus abattre : la
   carte ne serait jamais rasée et le score jamais complet. Les deux
   sont contrôlés par les tests, pas par ce seuil. */
var PAVOIS_POCHE_RENFORT = 30;
/* ET PLUS DE PASSES. Chaque passe ne perce QU'UNE porte par poche :
   un mur de deux bâtiments d'épaisseur en demande deux, un de trois en
   demande trois. Six suffisaient à la figure, qui est faite de cordes
   d'une seule perle d'épaisseur ; le renfort, lui, s'appuie contre ce
   qui est déjà là et peut doubler un mur. Mesuré : à six passes, cinq
   bâtiments restaient hors d'atteinte sur certains salons. */
var PAVOIS_PASSES_RENFORT = 12;

/* CINQ COURONNES CONCENTRIQUES, et c'est la deuxième version.

   La première rayonnait : seize guirlandes partant du mât vers une
   couronne, comme une tente de fête. À l'écran, illisible — seize
   rayons sur un semis régulier ne font pas une étoile, ils font du
   bruit, et l'œil n'a rien à quoi se raccrocher. Des FESTONS
   emboîtés, eux, se lisent d'un coup : le cerveau reconnaît la
   répétition d'une même courbe bien avant de reconnaître une forme.

   Chaque couronne : des mâts régulièrement espacés, et d'un mât à
   l'autre une corde qui PEND VERS L'EXTÉRIEUR. C'est ce creux, et lui
   seul, qui fait lire « guirlande » plutôt que « polygone ».

   Les rayons s'arrêtent à cinquante-sept : au-delà, le creux du
   feston sort de l'île à l'est et une guirlande coupée par le bord ne
   se lit plus comme une guirlande. */
var PAVOIS_COURONNES = [
  { r:18, mats: 6, creux:5.5 },
  { r:28, mats: 9, creux:6.5 },
  { r:38, mats:12, creux:7.0 },
  { r:48, mats:15, creux:7.0 },
  { r:57, mats:18, creux:7.0 }
];

/* COMMENT LE FIL CONTOURNE. Une perle empêchée n'est pas perdue : on
   la fait glisser PERPENDICULAIREMENT à la corde, d'une case puis de
   deux, d'un côté puis de l'autre. C'est ce que fait une vraie
   guirlande quand elle rencontre une branche.
   Perpendiculairement, et c'est tout le point : la première version
   drapait le long de la corde, donc poussait chaque perle sur sa
   voisine — le rendement n'a pas bougé d'un pouce et j'ai mis un
   moment à voir pourquoi. */
var PAVOIS_DRAPE = [0, 1.5, -1.5, 3.0, -3.0];
/* et pour ce qui n'a pas de corde — mâts, torches, guéridons,
   lampions — seize directions autour de la place visée, à pas fixes :
   aucun tirage de plus. */
var PAVOIS_TOUR = [[0,0],
                   [1.6,0], [-1.6,0], [0,1.6], [0,-1.6],
                   [1.6,1.6], [-1.6,1.6], [1.6,-1.6], [-1.6,-1.6],
                   [3.2,0], [-3.2,0], [0,3.2], [0,-3.2],
                   [2.4,2.4], [-2.4,2.4], [2.4,-2.4], [-2.4,-2.4]];

/* ================================================================
   LES QUATRE ALLÉES — ET CE N'EST PAS UNE DÉCORATION

   Mesuré sur la grille d'occupation du jeu, celle que `bloque()`
   consulte : cinq festons posés au pas de trois cases FERMENT l'île.
   Un bâtiment d'emprise deux occupe deux cases pleines, et deux
   bâtiments à trois cases d'écart n'en laissent aucune entre eux —
   la corde n'est pas une file de perles, c'est un mur. L'inondation
   depuis la plage tombait de quatre-vingt-dix-neuf virgule huit pour
   cent des cases libres à soixante-dix-huit : deux mille trois cents
   cases enfermées dans les anneaux, où une troupe entrée ne serait
   plus ressortie.

   On ouvre donc quatre allées franches, du plancher de bal jusqu'au
   dehors, à quarante-cinq degrés — sur l'écran, elles tombent droit.
   Rien n'y est posé : ni perle, ni mât, ni guéridon. Chaque anneau
   est ainsi coupé en quatre arcs, tous reliés à leurs voisins.

   Et c'est la bonne image, pas un rustine : une guinguette a des
   entrées. Une guirlande qui ferait le tour complet sans laisser
   passer personne ne serait pas une guirlande, ce serait une
   clôture.
   ================================================================ */
var PAVOIS_ECHELON = 3.4;    // l'écart entre les deux cordes d'une travée
var PAVOIS_ALLEE = 2.7;      // demi-largeur d'une allée, en cases

function dansAlleeGuinguette(x, y){
  var dx = x - PAVOIS_CX, dy = y - PAVOIS_CY;
  /* les quatre rayons à 45°, 135°, 225°, 315° : leurs directions
     sont (±1, ±1)/√2, et la distance d'un point à un tel rayon est
     la valeur absolue du produit vectoriel — pas de trigonométrie,
     pas d'atan2, et le test tourne mille fois par carte. */
  var u = 0.70711;
  if(Math.abs(dx * u - dy * u) <= PAVOIS_ALLEE) return 1;   // les deux à 45°/225°
  if(Math.abs(dx * u + dy * u) <= PAVOIS_ALLEE) return 1;   // et ceux à 135°/315°
  return 0;
}

function cordeGuinguette(A, B, nx, ny, creux, pas){
  /* la parabole du fil, échantillonnée à LONGUEUR D'ARC constante et
     non à paramètre constant : avec un creux de sept cases sur une
     corde de vingt, le paramètre seul entasse les perles aux
     extrémités et vide le fond du feston — exactement l'endroit qu'on
     regarde. */
  function fil(u){
    var s = 4 * u * (1 - u);
    return [A[0] + (B[0] - A[0]) * u + nx * creux * s,
            A[1] + (B[1] - A[1]) * u + ny * creux * s];
  }
  var CRANS = 48, L = 0, i, P0 = fil(0), P1, dl = [];
  for(i = 1; i <= CRANS; i++){
    P1 = fil(i / CRANS);
    dl.push(Math.hypot(P1[0] - P0[0], P1[1] - P0[1]));
    L += dl[i - 1];
    P0 = P1;
  }
  var n = Math.max(3, Math.round(L / pas)), pts = [], k, q, acc, vise, u;
  for(k = 1; k < n; k++){
    vise = L * k / n; acc = 0; u = 1;
    for(q = 0; q < CRANS; q++){
      if(acc + dl[q] >= vise){ u = (q + (vise - acc) / dl[q]) / CRANS; break; }
      acc += dl[q];
    }
    pts.push(fil(u));
  }
  return { pts:pts, fil:fil, L:L };
}

/* ================================================================
   LA FIGURE, EN GÉOMÉTRIE PURE — ET UNE SEULE FOIS

   Elle sert DEUX fois : les défenses s'y accrochent, et le sol la
   peint. Deux tracés calculés séparément se seraient désalignés à la
   première retouche d'un rayon — c'est le genre d'écart qu'on ne voit
   qu'à l'écran, longtemps après. Une seule fonction, deux lecteurs.

   Aucun tirage, aucun état : la même figure pour tous les joueurs,
   pour tous les salons, à toutes les versions.
   ================================================================ */
function figureGuinguette(){
  var CX = PAVOIS_CX, CY = PAVOIS_CY, C = [], ic, i;
  for(ic = 0; ic < PAVOIS_COURONNES.length; ic++){
    var K = PAVOIS_COURONNES[ic], mats = [];
    for(i = 0; i < K.mats; i++){
      var am = i / K.mats * 6.2832;
      mats.push([CX + Math.cos(am) * K.r, CY + Math.sin(am) * K.r]);
    }
    var cordes = [];
    for(i = 0; i < mats.length; i++){
      var A = mats[i], B = mats[(i + 1) % mats.length];
      var mx = (A[0] + B[0]) * 0.5, my = (A[1] + B[1]) * 0.5;
      var dm = Math.hypot(mx - CX, my - CY) || 1;
      var nx = (mx - CX) / dm, ny = (my - CY) / dm;   // la normale sortante
      /* DEUX CORDES PAR TRAVÉE, accrochées aux mêmes mâts et pendant
         de trois cases d'écart. C'est ainsi qu'on pavoise vraiment —
         une seule corde fait une clôture décorée, deux font une fête
         — et c'est aussi ce qui a permis d'atteindre le compte
         demandé : le semis d'origine est trop régulier pour qu'on
         puisse serrer une corde davantage, mais rien n'empêche d'en
         pendre une seconde. */
      for(var ib = 0; ib < 2; ib++){
        var cx2 = K.creux + ib * PAVOIS_ECHELON;
        var co = cordeGuinguette(A, B, nx, ny, cx2, PAVOIS_PAS);
        cordes.push({ a:A, b:B, nx:nx, ny:ny, creux:cx2, pts:co.pts, fil:co.fil });
      }
    }
    C.push({ r:K.r, mats:mats, cordes:cordes });
  }
  return { cx:CX, cy:CY, piste:PAVOIS_PISTE, couronnes:C };
}

/* ================================================================
   L'ATELIER DE POSE — la table des places prises, et le drapage

   Il sert deux fois : au pavois, puis aux lampions qui complètent le
   compte après la passe d'ouverture. Comme celle-ci retire des
   bâtiments, l'atelier est RECONSTRUIT entre les deux : une table
   d'occupation qui garde des places libérées referait poser dans le
   vide qu'on vient d'ouvrir, et l'on rouvrirait indéfiniment.
   ================================================================ */
function atelierPavois(c, al, ecart){
  /* La table des cases prises, dressée une fois : mille bâtiments
     contre mille candidats feraient un million de comparaisons par
     carte, et genereCarte tourne aussi pour les vignettes de
     l'accueil. Une case peut porter plusieurs voisins : on garde la
     LISTE, sans quoi un bâtiment en cache un autre et la figure se
     pose dessus. */
  /* DES SEAUX DE QUATRE CASES, et non une empreinte étalée case par
     case. La première version inscrivait chaque bâtiment dans les
     quatre-vingt-une cases de son voisinage : quatre-vingt-dix mille
     écritures par carte, et l'atelier étant dressé deux fois, la
     génération de cette île passait de cinquante-huit à deux cent
     quarante-huit millisecondes — payées à chaque vignette de
     l'accueil. Un seau par bâtiment, neuf seaux consultés par
     candidat : le plus grand écart possible entre deux gênes est de
     3,6 case, donc strictement moins qu'un seau, donc les neuf seaux
     voisins suffisent et rien ne peut être manqué. */
  var seaux = {}, i, SEAU = 4;
  var MARGE = (ecart === undefined) ? PAVOIS_ECART : ecart;
  /* LA GRILLE DE CASES, celle que `bloque()` consulte en jeu. Elle sert
     au seul test `bouche()` ci-dessous, mais elle doit être tenue à
     jour à chaque pose, sinon deux bâtiments posés coup sur coup ne se
     voient pas boucher le même couloir. */
  var sol = [];
  for(i = 0; i < GW * GH; i++) sol.push(0);
  function marque(b){
    var r = (b.e || 2) / 2, x, y;
    for(x = Math.floor(b.gx - r); x <= Math.ceil(b.gx + r) - 1; x++)
      for(y = Math.floor(b.gy - r); y <= Math.ceil(b.gy + r) - 1; y++)
        if(x >= 0 && x < GW && y >= 0 && y < GH) sol[y * GW + x] = 1;
  }
  function sac(x, y){ return Math.floor(x / SEAU) + "," + Math.floor(y / SEAU); }
  function inscris(b){
    var k = sac(b.gx, b.gy);
    (seaux[k] || (seaux[k] = [])).push(b);
  }
  for(i = 0; i < c.batiments.length; i++){ inscris(c.batiments[i]); marque(c.batiments[i]); }

  /* ================================================================
     BOUCHE-T-ELLE UN COULOIR ?

     C'est LE test qui manquait, et il vaut d'être expliqué parce qu'il
     commande toute densification future.

     L'espace libre qui reste sur une île bien remplie N'EST PAS de
     l'espace perdu : c'est exactement l'espace où l'on MARCHE. Chaque
     bâtiment de plus le prend à quelqu'un. Poser deux cents pièces au
     hasard dans ce qui reste faisait tomber l'île de 99 % de cases
     atteignables à 79 %, et la passe d'ouverture en reprenait aussitôt
     les deux tiers : on payait le calcul pour rien.

     On regarde donc AVANT de poser. Autour de la place visée, on
     compte les groupes de cases libres — d'abord tels quels, puis avec
     le bâtiment en place. Si le nombre de groupes AUGMENTE, c'est que
     la pose vient de couper un passage en deux : on refuse. Le
     bâtiment ira ailleurs, et il y a de la place ailleurs.

     C'est un test LOCAL, sur une fenêtre de neuf cases de côté. Il ne
     prouve pas que l'île reste connexe — ouvreLaFete s'en charge, et
     ne trouve plus grand-chose à faire. Il suffit à écarter le cas qui
     coûte : le bouchon de couloir.

     Et il ne tourne QUE sur les candidats qui ont déjà passé
     l'encombrement — quelques centaines, pas les trente mille du
     balayage. */
  var VOIS8 = [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]];
  function groupes(x0, y0, r, sx, sy, se){
    /* Nombre de groupes de cases libres dans la fenêtre, le bâtiment
       hypothétique (sx, sy, se) étant compté comme occupé — et l'on ne
       compte QUE les groupes d'au moins PAVOIS_RECOIN cases.
       Sans ce plancher, le test refusait tout : sur une île déjà
       dense, presque toute pose détache un recoin d'une ou deux cases
       où personne n'irait jamais, et l'on écartait ainsi les trois
       quarts des places valables. Ce qu'il faut interdire, c'est de
       couper un PASSAGE en deux, pas de fermer une encoignure. */
    var L = r * 2 + 1, vu = [], n = 0, i2, j2;
    for(i2 = 0; i2 < L * L; i2++) vu.push(0);
    function pris(x, y){
      if(x < 0 || x >= GW || y < 0 || y >= GH) return 1;
      if(sx !== undefined){
        var rr = se / 2;
        if(x >= Math.floor(sx - rr) && x <= Math.ceil(sx + rr) - 1 &&
           y >= Math.floor(sy - rr) && y <= Math.ceil(sy + rr) - 1) return 1;
      }
      return sol[y * GW + x];
    }
    for(i2 = 0; i2 < L; i2++)
      for(j2 = 0; j2 < L; j2++){
        if(vu[j2 * L + i2]) continue;
        if(pris(x0 - r + i2, y0 - r + j2)) continue;
        var taille = 0;
        var pile = [j2 * L + i2];
        vu[j2 * L + i2] = 1;
        while(pile.length){
          taille++;
          var k2 = pile.pop(), cx = k2 % L, cy = (k2 / L) | 0, d2;
          for(d2 = 0; d2 < 8; d2++){
            var nx = cx + VOIS8[d2][0], ny = cy + VOIS8[d2][1];
            if(nx < 0 || nx >= L || ny < 0 || ny >= L) continue;
            if(vu[ny * L + nx]) continue;
            if(pris(x0 - r + nx, y0 - r + ny)) continue;
            vu[ny * L + nx] = 1; pile.push(ny * L + nx);
          }
        }
        if(taille >= PAVOIS_RECOIN) n++;
      }
    return n;
  }
  function bouche(t, x, y){
    var e = DEF[t].emprise, r = Math.ceil(e * 0.5) + 2;
    var cx = Math.round(x), cy = Math.round(y);
    return groupes(cx, cy, r, x, y, e) > groupes(cx, cy, r);
  }

  function libre(t, x, y){
    if(x < 6 || x > PLAGE_X0 - 3 || y < 3 || y > GH - 4) return 0;
    if(Math.abs(x - QG_GX) <= 10 && Math.abs(y - QG_GY) <= 10) return 0;
    /* LES ALLÉES RESTENT FRANCHES, drapage compris : c'est le premier
       des deux garde-fous qui gardent l'île traversable, il ne souffre
       aucune exception. */
    if(dansAlleeGuinguette(x, y)) return 0;
    var e = DEF[t].emprise, sx = Math.floor(x / SEAU), sy = Math.floor(y / SEAU);
    for(var dx = -1; dx <= 1; dx++)
      for(var dy = -1; dy <= 1; dy++){
        var l = seaux[(sx + dx) + "," + (sy + dy)];
        if(!l) continue;
        for(var j = 0; j < l.length; j++){
          var b = l[j];
          if(Math.hypot(b.gx - x, b.gy - y) < (e + (b.e || 2)) * 0.5 + MARGE) return 0;
        }
      }
    return 1;
  }

  /* LE TIRAGE VIENT AVANT LE TEST, comme partout dans ce fichier : on
     consomme les trois nombres de la perle, PUIS on cherche où la
     pendre. Rien ne dépend de ce flux après lui, mais la règle se
     tient d'elle-même — c'est elle qui rend une figure modifiable
     sans tout rebattre.
     Et L'ENCOMBREMENT NE SE DESSERRE JAMAIS : on drape, on ne serre
     pas. Une couronne posée au contact ferait un mur que les troupes
     ne pourraient plus franchir ; une couronne à trous reste une
     guirlande, et une guirlande, ça se traverse. */
  function pose(t, x, y, px, py){
    var jx = x + (al() - 0.5) * PAVOIS_JEU * 2;
    var jy = y + (al() - 0.5) * PAVOIS_JEU * 2;
    var ang = al() * 6.2832;
    var T = (px === undefined) ? PAVOIS_TOUR : null;
    var n = T ? T.length : PAVOIS_DRAPE.length;
    for(var d = 0; d < n; d++){
      var ax = T ? jx + T[d][0] : jx + px * PAVOIS_DRAPE[d];
      var ay = T ? jy + T[d][1] : jy + py * PAVOIS_DRAPE[d];
      if(!libre(t, ax, ay)) continue;
      var f = DEF[t];
      var b = { t:t, gx:ax, gy:ay, pv:f.pv, pvMax:f.pv, e:f.emprise,
                ang:ang, vivant:1, n:c.batiments.length };
      c.batiments.push(b);
      inscris(b); marque(b);
      return b;
    }
    return null;
  }
  return { libre:libre, pose:pose, bouche:bouche };
}

function pavoiseLaGuinguette(c, al){
  var F = figureGuinguette(), CX = F.cx, CY = F.cy, i;
  var pose = atelierPavois(c, al).pose;

  var perle = 0;
  /* LES PERLES ALTERNENT SUR TROIS TEMPS — bobine, cuve, chalumeau.
     C'est le détail qui fait la guirlande : une guirlande de fête
     n'est jamais d'une seule couleur.

     ET C'EST AUSSI LE SEUL RÉGLAGE D'ÉQUILIBRE DE TOUTE LA FIGURE.
     Une corde purement bobine et cuve, mesurée, donnait cinquante
     pour cent de bâtiments en plus pour douze pour cent de vie à
     démonter : la Bobine ne fait que douze dégâts par seconde et la
     Cuve aucun. Le Chalumeau en fait soixante-sept — le plus fort du
     jeu au contact — et c'est lui qui rend à la fête son mordant.
     Un tiers de perles inertes, un tiers de lumière, un tiers de feu.

     La Cuve reste, et pas seulement pour l'équilibre : c'est le
     bâtiment le plus rare de cette île — six exemplaires — donc la
     ligne se détache du semis au lieu de s'y fondre. Elle est le
     lampion rouge de la guirlande, celui qu'on voit de loin. */
  function bille(){
    var k = perle++ % 3;
    return k === 0 ? "bobine" : (k === 1 ? "cuve" : "chalumeau");
  }

  /* --- LE GRAND MÂT ET LE PLANCHER DE BAL ---
     Un anneau de torches, et le plancher dedans : c'est la piste. On
     ne peut pas la vider — les tourelles d'origine y sont et l'index
     les garde — mais on peut la CERNER, et un anneau serré se lit
     comme un bord. */
  /* PAS DE MÂT AU MILIEU. Il tombait au croisement des quatre allées,
     c'est-à-dire à l'endroit précis qu'il ne faut pas boucher — et un
     plancher de bal vide vaut de toute façon mieux qu'un poteau
     planté au milieu de la piste. */
  /* DEUX anneaux : le bord du plancher, et la barrière une brasse
     plus loin. Un seul anneau à trous ne se lit pas comme un bord —
     et c'est précisément un bord qu'il faut, puisque le plancher, on
     ne peut pas le vider de ses tourelles d'origine. */
  for(var ia = 0; ia < 2; ia++){
    var ra = F.piste + ia * 3.6;
    var tPiste = Math.max(8, Math.round(6.2832 * ra / 3.4));
    for(i = 0; i < tPiste; i++){
      var ap = i / tPiste * 6.2832 + ia * 0.14;
      pose("chalumeau", CX + Math.cos(ap) * ra, CY + Math.sin(ap) * ra,
           Math.cos(ap), Math.sin(ap));
    }
  }

  /* --- LES CINQ FESTONS --- */
  for(var ic = 0; ic < F.couronnes.length; ic++){
    var K = F.couronnes[ic];
    /* les mâts d'abord : ce sont eux qui tiennent la figure, et une
       corde sans ses deux poteaux ne veut plus rien dire */
    for(i = 0; i < K.mats.length; i++){
      var M = K.mats[i], dm = Math.hypot(M[0] - CX, M[1] - CY) || 1;
      pose("mirador", M[0], M[1], (M[0] - CX) / dm, (M[1] - CY) / dm);
    }
    for(i = 0; i < K.cordes.length; i++){
      var CO = K.cordes[i];
      for(var k = 0; k < CO.pts.length; k++)
        pose(bille(), CO.pts[k][0], CO.pts[k][1], CO.nx, CO.ny);
    }
  }

  /* --- LES GUÉRIDONS ---
     Un silo — la table ronde — et cinq cuves autour — les tonneaux.
     Semés au pas d'or entre les couronnes : sur un cercle régulier,
     trente tables font un cinquième feston et l'on ne comprend plus
     rien. */
  for(i = 0; i < PAVOIS_TABLES; i++){
    /* SUR TOUTE L'ÎLE, et pas seulement autour de la piste. C'est ce
       qui a permis d'atteindre le compte : les festons sont des
       courbes FERMÉES, et l'on ne peut pas les serrer indéfiniment
       sans enfermer des secteurs — la passe d'ouverture reprend
       aussitôt ce qu'on ajoute. Un guéridon, lui, n'enferme rien :
       c'est un îlot. On peut donc en semer autant qu'il reste de
       place, et une guinguette a des tables partout, pas seulement
       au bord de la piste.
       Suite de Roberts — deux irrationnels premiers entre eux — et
       non le hasard : elle couvre l'île à peu près également sans
       jamais aligner deux tables, là où un tirage laisse des trous
       et des paquets. */
    var ux = (i * 0.7548776662) % 1, uy = (i * 0.5698402910) % 1;
    var T2 = pose("silo", 9 + ux * (PLAGE_X0 - 18), 5 + uy * (GH - 12));
    var at = i * ANGLE_OR;                          // l'orientation des tonneaux
    if(!T2) continue;                               // pas de table, pas de tonneaux
    /* les tonneaux suivent le silo RÉELLEMENT posé, pas la place
       visée : la table a pu glisser d'une case ou deux */
    for(var s2 = 0; s2 < 5; s2++){
      var a5 = s2 / 5 * 6.2832 + at;
      pose("cuve", T2.gx + Math.cos(a5) * 3.6, T2.gy + Math.sin(a5) * 3.6);
    }
  }
}


/* ================================================================
   LES LAMPIONS — LA PASSE QUI TIENT LE COMPTE

   La demande porte un NOMBRE : cinquante pour cent de défenses en
   plus. Les festons, eux, ne le tiennent pas — et pour une raison de
   géométrie, pas de réglage : une courbe fermée partitionne un plan,
   donc plus on serre les cordes, plus la passe d'ouverture reprend
   ce qu'on vient de poser. Mesuré : à deux cordes par travée et cent
   cinquante guéridons, l'île plafonne à quarante-quatre pour cent.

   D'où cette dernière passe, qui ne dessine rien et ne ferme rien :
   des lampions seuls, semés un par un jusqu'à ce que le compte y
   soit. Un bâtiment isolé n'enferme personne — c'est un îlot — et
   une guinguette a des lanternes accrochées partout, pas seulement
   sur ses guirlandes. La figure porte le dessin, les lampions
   portent le nombre.

   Suite de Roberts, comme les guéridons, mais décalée d'un demi-pas :
   elle couvre l'île également sans jamais retomber sur les mêmes
   places.
   ================================================================ */
function compteDefenses(c){
  var n = 0;
  for(var i = 0; i < c.batiments.length; i++){
    var t = c.batiments[i].t;
    if(t !== "cellule" && t !== "reacteur") n++;
  }
  return n;
}

function lampionsGuinguette(c, al, cible){
  var pose = atelierPavois(c, al).pose, n = compteDefenses(c), i;
  for(i = 0; i < PAVOIS_LAMPIONS && n < cible; i++){
    /* décalée d'un demi-pas par rapport aux guéridons : la suite
       couvre l'île également sans jamais retomber sur leurs places */
    var ux = (0.5 + i * 0.7548776662) % 1, uy = (0.5 + i * 0.5698402910) % 1;
    /* lampion et brasero, en alternance : les deux TIRENT. Cette passe
       porte le nombre, pas le dessin — elle n'a donc aucune raison de
       poser des tonneaux inertes. */
    if(pose((i & 1) ? "chalumeau" : "bobine",
            9 + ux * (PLAGE_X0 - 18), 5 + uy * (GH - 12))) n++;
  }
  return n;
}

/* ================================================================
   LE RENFORT SE BALAIE, IL NE S'ÉCHANTILLONNE PAS

   Et c'est la quatrième tentative. Les trois premières ont échoué sur
   le même malentendu, qui valait d'être levé.

   J'AI CRU L'ÎLE PLEINE. Les guéridons et les lampions de la v0.74
   sont semés sur une suite de Roberts : deux mille quatre cents
   points sur dix-sept mille cases, soit un tous les sept. Quand elle
   a cessé de trouver des places, j'en ai conclu que l'île n'en avait
   plus. C'était faux. Un balayage systématique à la demi-case en
   trouve CENT QUARANTE-SEPT pour un Frelon et quatre cent
   vingt-et-une pour une bobine, à la marge normale de 0,6 — celle de
   la figure, celle des miradors, sans rien desserrer du tout.

   La leçon vaut d'être écrite : une suite à faible discrépance
   répartit bien, elle ne cherche pas. Pour COMPTER des places, il
   faut les balayer.

   LE BALAYAGE EST DITHÉRÉ, du gros au fin — trois cases, une et
   demie, trois quarts. Un balayage en lignes remplirait l'ouest
   d'abord et laisserait l'est nu dès que le compte est atteint ; en
   passes de plus en plus fines, chaque arrêt laisse une île
   uniformément garnie.

   ET LE GROS PASSE D'ABORD. Le Frelon tient trois cases, il lui faut
   trois cases et demie de dégagement ; posé après les petits, il n'en
   trouve plus une seule — mesuré, quatorze au lieu de cent
   quarante-sept. C'est cet ordre, et lui seul, qui fait la majorité
   de Frelons demandée.
   ================================================================ */
function renfortGuinguette(c, al, cible){
  var A = atelierPavois(c, al), pose = A.pose, libre = A.libre, bouche = A.bouche;
  var n = compteDefenses(c), frelons = 0, petits = 0, ip, x, y;

  /* L'ORDRE DES DEUX TESTS EST UN CHOIX DE COÛT, PAS DE GOÛT.
     `libre` coûte huit comparaisons ; `bouche` en coûte deux cents —
     deux inondations dans une fenêtre de neuf cases. Le balayage
     propose trente mille places, dont deux cents tiennent. Tester
     l'encombrement d'abord fait tomber la génération de sept secondes
     à quelques dizaines de millisecondes, pour exactement le même
     résultat. */
  function essaie(t, x, y){
    return libre(t, x, y) && !bouche(t, x, y) && !!pose(t, x, y, 0, 0);
  }

  /* 1. LES FRELONS, aussi loin que le balayage en trouve. Le gros
        passe d'abord : posé après les petits, il ne trouve plus une
        seule place — mesuré, quatorze au lieu de cent. */
  for(ip = 0; ip < PAVOIS_TAMIS.length && n < cible; ip++){
    var pas = PAVOIS_TAMIS[ip];
    for(x = 6 + pas * 0.5; x <= PLAGE_X0 - 3 && n < cible; x += pas)
      for(y = 3 + pas * 0.5; y <= GH - 4 && n < cible; y += pas)
        if(essaie("frelon", x, y)){ n++; frelons++; }
  }

  /* 2. ET LE COMPTE SE FINIT AU LAMPION ET AU BRASERO — mais JAMAIS
        PLUS QU'IL N'Y A DE FRELONS. C'était la demande : « une
        majorité de Frelons ». Le Frelon tient trois cases contre deux,
        il bouche donc bien plus facilement un couloir, et l'île en
        accueille forcément moins ; si on laissait les petits finir le
        compte librement, ils seraient deux fois plus nombreux et la
        majorité serait perdue. On plafonne. */
  var pair = 0;
  for(ip = 0; ip < PAVOIS_TAMIS.length && n < cible && petits < frelons; ip++){
    var pas2 = PAVOIS_TAMIS[ip];
    for(x = 6 + pas2 * 0.25; x <= PLAGE_X0 - 3 && n < cible && petits < frelons; x += pas2)
      for(y = 3 + pas2 * 0.25; y <= GH - 4 && n < cible && petits < frelons; y += pas2){
        var t2 = (pair & 1) ? "chalumeau" : "bobine";
        if(essaie(t2, x, y)){ n++; petits++; pair++; }
      }
  }
  return { total:n, frelons:frelons, petits:petits };
}

/* ================================================================
   ON ROUVRE CE QUI S'EST FERMÉ

   Le pavois dessine des courbes FERMÉES, et une courbe fermée
   partitionne un plan. Mesuré sur la grille d'occupation du jeu — la
   même que consulte `bloque()` — cinq festons au pas de trois cases
   enfermaient deux mille trois cents cases : une troupe entrée dans
   un secteur n'en serait plus ressortie.

   Les quatre allées ne suffisent pas, et il faut dire pourquoi :
   elles n'écartent que les bâtiments NEUFS. Le semis d'origine, lui,
   est intouchable — son rang porte le bitmap des destructions — et
   il pose une tourelle toutes les cinq cases, y compris en travers
   d'une allée. Élargir l'allée ne rattrape rien : à dix cases de
   large, il restait encore cinq cents cases enfermées. J'ai essayé,
   c'est ce qui a mené ici.

   On mesure donc, et l'on ouvre. Inondation depuis la plage, et tout
   bâtiment DU PAVOIS qui borde une poche isolée est retiré. Quatre
   passes suffisent à percer la coquille d'un secteur. Les poches que
   seul le semis d'origine enferme restent — on ne peut pas y toucher
   — et ce sont exactement les trente-deux cases que l'île avait déjà
   avant nous.

   L'INDEX RESTE INTACT. On ne retire que des rangs postérieurs à
   `depart`, c'est-à-dire des bâtiments qui n'ont jamais existé pour
   personne : aucun instantané enregistré ne les désigne. Les huit
   cent trente premiers ne bougent pas d'un cran.
   ================================================================ */
var PAVOIS_PASSES = 6;      // au plus six percées successives
var PAVOIS_POCHE  = 3;      // en deçà, c'est un recoin, pas une prison

function ouvreLaFete(c, depart, seuil, exige, passes){
  var n = GW * GH, i, j, k, x, y, nx, ny, kk;
  var POCHE = (seuil === undefined) ? PAVOIS_POCHE : seuil;
  var VOIS = [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]];

  /* les quatre tableaux sont alloués UNE fois pour toutes les passes :
     vingt mille cases recréées six fois coûtaient plus cher que tout
     le reste de la fonction réunie */
  var occ = [], qui = [], vu = [], lot = [];
  for(i = 0; i < n; i++){ occ.push(0); qui.push(-1); vu.push(0); lot.push(0); }

  for(var passe = 0; passe < (passes || PAVOIS_PASSES); passe++){
    /* 1. la grille d'occupation, exactement comme marqueEmprise, et
          l'on retient QUEL bâtiment tient chaque case — le dernier
          inscrit, donc le plus neuf, donc celui qu'on a le droit de
          retirer. */
    for(i = 0; i < n; i++){ occ[i] = 0; qui[i] = -1; vu[i] = 0; lot[i] = 0; }
    for(i = 0; i < c.batiments.length; i++){
      var b = c.batiments[i], r = b.e / 2;
      for(x = Math.floor(b.gx - r); x <= Math.ceil(b.gx + r) - 1; x++)
        for(y = Math.floor(b.gy - r); y <= Math.ceil(b.gy + r) - 1; y++)
          if(x >= 0 && x < GW && y >= 0 && y < GH){
            k = y * GW + x;
            occ[k] = 1;
            if(i >= depart) qui[k] = i;
          }
    }
    /* 2. l'inondation depuis la plage, en huit voisins : c'est ainsi
          que les troupes se déplacent, `avanceUnite` retombant sur un
          axe quand la diagonale est prise. */
    var pile = [];
    for(y = 0; y < GH; y++){
      k = y * GW + PLAGE_X0;
      if(!occ[k]){ vu[k] = 1; pile.push(k); }
    }
    while(pile.length){
      k = pile.pop(); x = k % GW; y = (k / GW) | 0;
      for(j = 0; j < 8; j++){
        nx = x + VOIS[j][0]; ny = y + VOIS[j][1];
        if(nx < 0 || nx >= GW || ny < 0 || ny >= GH) continue;
        kk = ny * GW + nx;
        if(vu[kk] || occ[kk]) continue;
        vu[kk] = 1; pile.push(kk);
      }
    }
    /* 3. les poches, une par une. UNE SEULE PORTE PAR POCHE ET PAR
          PASSE : retirer toute la coquille coûtait cent quatre-vingt
          -quatorze tourelles sur trois cent trente-trois, et rendait
          le pavois plus troué que dense. On perce, on ne rase pas.
          La porte préférée est le bâtiment qui touche À LA FOIS la
          poche et le dehors — c'est là que le mur est mince. */
    var aOter = {}, combien = 0;
    for(y = 0; y < GH; y++)
      for(x = 6; x < PLAGE_X0; x++){
        k = y * GW + x;
        if(occ[k] || vu[k] || lot[k]) continue;
        /* la poche, et ses bâtiments de bordure */
        var p2 = [k], taille = 0, bord = {};
        lot[k] = 1;
        while(p2.length){
          var q = p2.pop(); taille++;
          var qx = q % GW, qy = (q / GW) | 0;
          for(j = 0; j < 8; j++){
            nx = qx + VOIS[j][0]; ny = qy + VOIS[j][1];
            if(nx < 0 || nx >= GW || ny < 0 || ny >= GH) continue;
            kk = ny * GW + nx;
            if(occ[kk]){ if(qui[kk] >= 0) bord[qui[kk]] = 1; continue; }
            if(vu[kk] || lot[kk]) continue;
            lot[kk] = 1; p2.push(kk);
          }
        }
        /* ══ FAUT-IL OUVRIR CETTE POCHE ? DEUX RAISONS, ET LA
           SECONDE NE SE NÉGOCIE PAS.

           Le CONFORT : une poche large est un secteur muré, où l'on
           entre par un côté qui se referme. En deçà de POCHE cases,
           c'est une encoignure, et une encoignure ne gêne personne —
           aucune troupe ne peut s'y trouver, puisqu'aucune ne peut y
           aller.

           LA CORRECTION : un bâtiment dont AUCUNE case atteignable
           n'est à portée de tir ne pourra jamais être abattu. L'île ne
           serait plus rasable à cent pour cent et le score jamais
           complet. Cinq cases : la portée de la Furie, celle qui fait
           le gros des flottes. Cette poche-là s'ouvre quelle que soit
           sa taille. */
        var doit = (taille >= POCHE);
        /* LA RÈGLE DE PORTÉE EST NEUVE, ET ELLE NE VAUT QUE POUR LE
           RENFORT. Ce n'est pas une faveur faite au passé : la
           guinguette de la v0.74 la respecte déjà — zéro bâtiment hors
           d'atteinte, le test le vérifie à chaque exécution — mais
           l'appliquer à ses deux passes d'ouverture leur ferait
           percer d'autres portes, donc retirer d'autres bâtiments,
           donc DÉCALER ses rangs. Or ses rangs sont en ligne. On la
           branche là où elle a du travail, et nulle part ailleurs. */
        if(!doit && exige)
          for(var cs in bord){
            var bs = c.batiments[cs | 0], vus = 0, ds, es;
            for(ds = -5; ds <= 5 && !vus; ds++)
              for(es = -5; es <= 5 && !vus; es++){
                if(ds * ds + es * es > 25) continue;
                var xs = Math.round(bs.gx) + ds, ys = Math.round(bs.gy) + es;
                if(xs >= 0 && xs < GW && ys >= 0 && ys < GH && vu[ys * GW + xs]) vus = 1;
              }
            if(!vus){ doit = 1; break; }
          }
        if(!doit) continue;
        /* la meilleure porte : celle qui donne déjà sur le dehors */
        var porte = -1, mieux = -1;
        for(var cb in bord){
          var ib = cb | 0, bb = c.batiments[ib], rb = bb.e / 2, dehors = 0;
          for(var ex = Math.floor(bb.gx - rb) - 1; ex <= Math.ceil(bb.gx + rb); ex++)
            for(var ey = Math.floor(bb.gy - rb) - 1; ey <= Math.ceil(bb.gy + rb); ey++)
              if(ex >= 0 && ex < GW && ey >= 0 && ey < GH && vu[ey * GW + ex]) dehors++;
          /* à égalité, le plus petit rang : la figure doit être la
             même pour tous les joueurs, donc le choix ne peut pas
             dépendre de l'ordre d'un objet */
          if(dehors > mieux || (dehors === mieux && porte >= 0 && ib < porte)){
            mieux = dehors; porte = ib;
          }
        }
        if(porte >= 0 && !aOter[porte]){ aOter[porte] = 1; combien++; }
      }
    /* ══ ET LA DÉLIVRANCE, QUI NE PASSE PLUS PAR LES POCHES.
       Percer la porte d'une poche suppose qu'un bâtiment NEUF borde
       cette poche. Ce n'est pas toujours vrai : le renfort peut
       rétrécir un passage à dix cases de là et enfermer un bâtiment
       derrière un mur qui, lui, est entièrement d'origine — donc
       intouchable. Mesuré : six bâtiments hors d'atteinte, puis deux
       en montant le nombre de passes ; jamais zéro.
       On s'y prend donc par l'autre bout. On cherche les bâtiments
       qu'on ne peut plus atteindre, et l'on retire autour d'eux le
       bâtiment NEUF le plus proche — celui qui, de proche en proche,
       finit par rendre le chemin. C'est la seule règle du fichier qui
       raisonne sur le résultat plutôt que sur la cause, et c'est
       assumé : le résultat est ce qui compte. */
    if(exige)
      for(i = 0; i < c.batiments.length; i++){
        var bx2 = c.batiments[i], atteint = 0, dx2, dy2;
        for(dx2 = -5; dx2 <= 5 && !atteint; dx2++)
          for(dy2 = -5; dy2 <= 5 && !atteint; dy2++){
            if(dx2 * dx2 + dy2 * dy2 > 25) continue;
            var ax2 = Math.round(bx2.gx) + dx2, ay2 = Math.round(bx2.gy) + dy2;
            if(ax2 >= 0 && ax2 < GW && ay2 >= 0 && ay2 < GH && vu[ay2 * GW + ax2]) atteint = 1;
          }
        if(atteint) continue;
        /* le plus proche des neufs, à huit cases au plus */
        var pres = -1, dPres = 1e9;
        for(j = depart; j < c.batiments.length; j++){
          if(aOter[j]) continue;
          var cj = c.batiments[j];
          var dj = Math.hypot(cj.gx - bx2.gx, cj.gy - bx2.gy);
          if(dj < dPres && dj <= 8){ dPres = dj; pres = j; }
        }
        if(pres >= 0){ aOter[pres] = 1; combien++; }
      }
    if(!combien) break;                          // l'île est ouverte
    var reste = [];
    for(i = 0; i < c.batiments.length; i++)
      if(!(i >= depart && aOter[i])) reste.push(c.batiments[i]);
    c.batiments = reste;
  }
  /* le rang de chaque bâtiment EST son identité : on renumérote */
  for(i = 0; i < c.batiments.length; i++) c.batiments[i].n = i;
}

function peupleLesNuits(c, al){
  /* La grille d'occupation, dressée UNE fois. Douze cents bâtiments
     contre quatre-vingts bestioles feraient cent mille comparaisons ;
     une table de cases prises n'en fait aucune. */
  var occ = {}, i, dx, dy;
  for(i = 0; i < c.batiments.length; i++){
    var b = c.batiments[i];
    var ax = Math.round(b.gx), ay = Math.round(b.gy), r = Math.ceil((b.e || 2) * 0.5);
    for(dx = -r; dx <= r; dx++)
      for(dy = -r; dy <= r; dy++) occ[(ax + dx) + "," + (ay + dy)] = 1;
  }
  function prise(x, y){ return !!occ[Math.round(x) + "," + Math.round(y)]; }
  /* « du vide autour » : rien de bâti dans un carré de rayon r */
  function degage(x, y, r){
    var ax = Math.round(x), ay = Math.round(y);
    for(var ex = -r; ex <= r; ex++)
      for(var ey = -r; ey <= r; ey++) if(occ[(ax + ex) + "," + (ay + ey)]) return 0;
    return 1;
  }
  var MED_X = 74, MED_Y = 68;                    // le médaillon, cœur du jardin
  var NUITEUX = [
    { t:"paon",          n:14, gr:2,
      aime:function(x, y){ return Math.hypot(x - MED_X, y - MED_Y) < 34; } },
    { t:"chatlune",      n:18, gr:2,
      aime:function(x, y){ return degage(x, y, 4); } },
    { t:"fennec",        n:22, gr:3,
      aime:function(x, y){ return x < 26 || x > 116 || y < 24 || y > 112; } },
    { t:"papillongeant", n:26, gr:4, aime:null }
  ];
  var ESSAIS_NUITS = 4;
  for(i = 0; i < NUITEUX.length; i++){
    var B = NUITEUX[i], pose = 0;
    for(var ess = 0; ess < B.n * 10; ess++){
      var nb = 1 + ((al() * B.gr) | 0);
      /* QUATRE CANDIDATS TIRÉS, TOUJOURS LES QUATRE, et l'on garde le
         premier qui plaît à l'espèce — sinon le premier tout court.
         C'est le tour de la jungle, et il est là pour la même raison :
         un `if` qui saute un tirage décale toute la suite. */
      var cx = 0, cy = 0, choisi = 0;
      for(var ec = 0; ec < ESSAIS_NUITS; ec++){
        var ex = 8 + al() * (PLAGE_X0 - 16), ey = 6 + al() * (GH - 12);
        if(!ec){ cx = ex; cy = ey; }
        if(!choisi && (!B.aime || B.aime(ex, ey))){ cx = ex; cy = ey; choisi = 1; }
      }
      /* le test du Brasier vient APRÈS, comme partout : on consomme
         les tirages du groupe même si on le jette */
      var auPied = Math.hypot(cx - QG_GX, cy - QG_GY) < 16;
      for(var g = 0; g < nb; g++){
        var bx = cx + (al() - 0.5) * 4.2;
        var by = cy + (al() - 0.5) * 4.2;
        var teinte = (al() * 3) | 0;
        if(auPied || pose >= B.n) continue;
        /* un papillon géant vole : il passe au-dessus des tourelles */
        if(!CRE[B.t].vole && prise(bx, by)) continue;
        c.creatures.push({ t:B.t, gx:bx, gy:by, teinte:teinte });
        pose++;
      }
    }
  }
}

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

  var occHaut = {}, occBas = {}, occArbre = {}, i, b;
  function marque(grille, gx, gy, r){
    var x0 = Math.floor(gx - r), x1 = Math.ceil(gx + r);
    var y0 = Math.floor(gy - r), y1 = Math.ceil(gy + r);
    for(var x = x0; x <= x1; x++)
      for(var y = y0; y <= y1; y++) grille[x + "," + y] = 1;
  }
  for(i = 0; i < c.batiments.length; i++){
    b = c.batiments[i];
    marque(occHaut,  b.gx, b.gy, b.e * 0.5 + 1.2);
    marque(occArbre, b.gx, b.gy, b.e * 0.35 + 0.5);
    marque(occBas,   b.gx, b.gy, b.e * 0.28);
  }
  /* Le Brasier reste dégagé sur les trois grilles : c'est l'objectif,
     rien ne doit le voiler. */
  marque(occHaut,  QG_GX, QG_GY, 14);
  marque(occArbre, QG_GX, QG_GY, 14);
  marque(occBas,   QG_GX, QG_GY, 13);
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
      /* L'ARBRE A SA PROPRE GRILLE, PLUS SERRÉE QUE LES AUTRES.
         Avec occHaut — rayon × 0,5 + 1,2 — il ne restait que 777 cases
         libres sur 17 680, toutes dans les clairières : mesuré, QUATRE
         grands arbres sur 377 se trouvaient dans la zone dense, et ce
         qui poussait entre les tourelles n'était plus que de l'herbe,
         des fougères et des racines, toutes à l'échelle 1. La zone des
         défenses ne ressemblait plus à une jungle.
         occArbre — rayon × 0,35 + 0,5 — laisse le tronc hors du socle
         mais autorise l'arbre à se glisser ENTRE les tourelles. Les
         lianes, plantes et buissons gardent occHaut : eux sont
         nombreux et touffus, et les laisser entrer rendrait vraiment
         la carte illisible. */
      var grille = (fam === "arbre") ? occArbre : occHaut;
      var e = -1, cand;
      for(var t = 0; t < ESSAIS_HAUTE; t++){
        cand = casesHautes[(al() * casesHautes.length) | 0];
        if(e < 0 && !grille[(cand % 1000) + "," + ((cand / 1000) | 0)]) e = cand;
      }
      /* la gigue est bornée à la demi-case : une pousse ne doit pas
         sortir de la case libre qu'on lui a trouvée */
      var jx = (al() - 0.5) * 0.9, jy = (al() - 0.5) * 0.9;
      var fv = al(), fs = al();
      if(e < 0) continue;                       // massif infranchissable
      var gx = (e % 1000) + jx, gy = ((e / 1000) | 0) + jy;
      if(!dansLIle(gx, gy)) continue;
      /* LES GRANDS ARBRES DE L'INTÉRIEUR ONT UNE ÉCHELLE, EUX AUSSI.
         Ils étaient dessinés à 1 quand la forêt du pourtour va de 1,05
         à 2,40 : à côté d'une ceinture d'arbres deux fois plus hauts,
         et sous deux mille tourelles, les 377 de l'intérieur ne
         lisaient plus comme une forêt — d'où « tu as retiré les grands
         arbres ? ». Ils n'avaient jamais été retirés : comptés avant
         et après la dernière retouche de la jungle, 380 puis 377.
         C'était un problème d'échelle, pas de nombre.

         On les grossit plutôt que d'en ajouter, et c'est le point :
         un arbre coûte exactement le même blit quelle que soit sa
         taille. À 1,25–1,85 la surface de feuillage double sans qu'une
         seule pousse de plus soit dessinée — la jungle s'épaissit pour
         zéro image par seconde.

         `fs` est DÉJÀ TIRÉ deux lignes plus haut et ne servait à rien
         pour cette famille (le sprite se choisit sur `fv`) : on s'en
         sert, donc la séquence de tirages ne bouge pas d'un cran et
         aucune carte ne se redessine ailleurs. */
      var o = { gx:gx, gy:gy, fam:fam, v:fv, s:fs };
      if(fam === "arbre") o.ech = ECH_ARBRE_MIN + fs * ECH_ARBRE_ETENDUE;
      c.flore.push(o);
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
  /* LE REPLI — pour qu'un semis vide ne passe plus jamais inaperçu.
     La boucle ci-dessus n'a aucun filet : vingt-deux ouvertures
     demandées, deux cents essais chacune, et si toutes butent sur une
     case occupée elle rend un tableau VIDE, en silence. Mesuré : avec
     un plan assez dense, zéro sur vingt-deux. Une jungle sans geyser
     n'est plus une jungle — et jusqu'à la version précédente elle y
     perdait aussi tout son orage, puisque le ciel se lisait sur ce
     tableau.

     Ce repli ne teste plus que la FORME DE L'ÎLE et le dégagement du
     Brasier : deux choses qu'aucun plan ne peut boucher. Il accepte de
     poser un geyser au pied d'une tourelle, ce que la boucle normale
     refuse — c'est moins joli, et c'est infiniment mieux que rien.

     IL NE CONSOMME AUCUN TIRAGE quand tout va bien, et c'est la
     condition pour qu'il existe : le test vient avant la boucle, donc
     sur les six cartes d'aujourd'hui — vingt et un geysers sur le plan
     gravé — il ne s'exécute pas du tout, et pas une pousse, pas une
     bête, pas un arbre ne change de place. */
  if(!c.geysers.length){
    for(i = 0; i < EQ.JUNGLE_GEYSERS; i++){
      var rx = 8 + al() * (PLAGE_X0 - 14), ry = 5 + al() * (GH - 10);
      var rdodo = al() * 14;
      if(!dansLIle(rx, ry)) continue;
      if(Math.hypot(rx - QG_GX, ry - QG_GY) < 18) continue;
      var voisin = 0;
      for(var w = 0; w < c.geysers.length; w++){
        if(Math.hypot(c.geysers[w].gx - rx, c.geysers[w].gy - ry) < 6){ voisin = 1; break; }
      }
      if(voisin) continue;
      c.geysers.push({ gx:rx, gy:ry, sommeil:rdodo });
    }
  }

  /* ================================================================
     LA FAUNE, ET SON HABITAT

     « Beaucoup de pandas », dit le cahier des charges, et il a raison :
     c'est le nombre qui rend une jungle habitée, pas la variété. Les
     pandas sont donc les plus nombreux, et la moitié d'entre eux est
     assise à manger — une jungle où tout le monde marche est une
     jungle en fuite.

     CE QUI MANQUAIT : L'INTENTION. Le semis était habitat-AVEUGLE. Les
     sept espèces tiraient dans la même urne uniforme, et si les bêtes
     finissaient tout de même sous les arbres — 63 % à moins de deux
     cases d'un grand arbre, contre 33 % pour des points tirés au
     hasard —, ce n'était pas un choix : c'était le rejet des pieds de
     tourelles qui les y poussait, puisque là où il y a une tourelle il
     n'y a pas d'arbre. Mesuré espèce par espèce, le résultat était même
     à l'envers du bon sens : le SINGE, la plus arboricole des sept,
     était la moins souvent près d'un arbre (60 %) et sous le plus
     maigre couvert (12,6 pousses hautes autour, contre 26,7 pour le
     koala, qui n'y était arrivé que par hasard).

     ON DONNE DONC À CHACUNE SON COIN, et `aime` dit lequel :
       singe, koala  au pied des grands arbres — ils y vivent ;
       luciole       sous le couvert, là où il fait sombre : une
                     luciole en plein soleil n'éclaire rien ;
       papillon      À L'INVERSE, dans les trouées de lumière — c'est
                     la seule espèce qu'on veut voir dans le vide ;
       bourdon       sur les fleurs, c'est-à-dire la famille « plante » ;
       panda         dans le fourré : buissons et plantes, de quoi
                     mâcher assis ;
       cochon        dans les herbes hautes des clairières, loin des
                     grands arbres — une famille qui détale à
                     découvert, c'est ce qui la rend visible.

     LE BUDGET DE TIRAGES RESTE CONSTANT, comme partout dans ce
     fichier : on tire TOUJOURS ESSAIS_FAUNE centres de groupe, et l'on
     garde le premier qui plaît à l'espèce — ou le premier tout court
     si aucun ne convient, pour que l'effectif soit tenu. Rien derrière
     ne se décale, et la carte reste reproductible au millième de case.
     ================================================================ */
  /* Les grilles d'habitat, recensées UNE fois sur la flore déjà posée.
     Un compte par case, pas un booléen : « sous le couvert » et « dans
     une trouée » sont deux bouts de la même mesure, et il faut pouvoir
     dire combien. */
  var grArbre = {}, grFleur = {}, grFourre = {};
  for(i = 0; i < c.flore.length; i++){
    var fo = c.flore[i];
    if(fo.fond) continue;                    // la ceinture ne compte pas
    var cle = Math.round(fo.gx) + "," + Math.round(fo.gy);
    if(fo.fam === "arbre")        grArbre[cle]  = (grArbre[cle]  || 0) + 1;
    else if(fo.fam === "plante")  grFleur[cle]  = (grFleur[cle]  || 0) + 1;
    else if(fo.fam === "buisson") grFourre[cle] = (grFourre[cle] || 0) + 1;
  }
  /* Combien de pousses de cette famille dans un carré de rayon r. */
  function autour(g, gx, gy, r){
    var n = 0, ax = Math.round(gx), ay = Math.round(gy);
    for(var dx = -r; dx <= r; dx++)
      for(var dy = -r; dy <= r; dy++)
        n += g[(ax + dx) + "," + (ay + dy)] || 0;
    return n;
  }
  var ESSAIS_FAUNE = 4;
  var BESTIOLES = [
    { t:"panda",    n:110, gr:3,
      aime:function(x, y){ return autour(grFourre, x, y, 2) + autour(grFleur, x, y, 2) >= 2; } },
    { t:"singe",    n:80,  gr:4,
      aime:function(x, y){ return autour(grArbre, x, y, 2) >= 1; } },
    { t:"koala",    n:55,  gr:2,
      aime:function(x, y){ return autour(grArbre, x, y, 1) >= 1; } },
    { t:"cochon",   n:130, gr:6,
      aime:function(x, y){ return autour(grArbre, x, y, 3) === 0; } },
    { t:"bourdon",  n:80,  gr:3,
      aime:function(x, y){ return autour(grFleur, x, y, 2) >= 1; } },
    { t:"papillon", n:95,  gr:4,
      aime:function(x, y){ return autour(grArbre, x, y, 2) === 0; } },
    { t:"luciole",  n:150, gr:7,
      aime:function(x, y){ return autour(grArbre, x, y, 2) >= 3; } }
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
      /* LE CENTRE DU GROUPE SE CHOISIT, il ne se subit plus. Quatre
         candidats tirés, TOUJOURS les quatre — c'est ce qui garde la
         séquence stable —, et l'on garde le premier qui plaît à
         l'espèce. Si aucun ne convient, on garde le premier : mieux
         vaut un singe mal placé qu'une jungle à moitié vide, et de
         toute façon un habitat qui couvre un tiers de l'île est trouvé
         trois fois sur quatre. */
      var cx2 = 0, cy2 = 0, choisi = 0;
      for(var ec = 0; ec < ESSAIS_FAUNE; ec++){
        var ex2 = 6 + al() * (PLAGE_X0 - 12), ey2 = 4 + al() * (GH - 8);
        if(!ec){ cx2 = ex2; cy2 = ey2; }
        if(!choisi && B.aime(ex2, ey2)){ cx2 = ex2; cy2 = ey2; choisi = 1; }
      }
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

  /* --- LE RENFORT D'ARBRES, TOUT À LA FIN ---
     Ici et nulle part ailleurs : un tirage ajouté plus haut décalerait
     tout ce qui suit, et l'île entière se redessinerait. À cette
     place, ce qui existe déjà ne bouge pas d'un millième de case — ni
     les tourelles, ni le tapis, ni les geysers, ni les bêtes.

     DANS L'ÎLE, on repasse par poseHaute : même grille occArbre, même
     tirage par rejet, donc les nouveaux se glissent entre les
     tourelles exactement comme les premiers.

     AU POURTOUR, on épaissit surtout la LISIÈRE — le premier rang,
     celui qu'on regarde vraiment. Les rangs lointains sont déjà peu
     nombreux et gros par construction : en rajouter là coûterait
     autant de blits et se verrait beaucoup moins. */
  poseHaute("arbre", RENFORT_ARBRES);
  var RENFORT_RANGS = [
    { d0:1.5, d1:11, n:Math.round(RENFORT_POURTOUR * 0.62), ech:[0.60, 0.95] },
    { d0:9,   d1:24, n:Math.round(RENFORT_POURTOUR * 0.38), ech:[0.80, 1.30] }
  ];
  for(var ir2 = 0; ir2 < RENFORT_RANGS.length; ir2++){
    var R2 = RENFORT_RANGS[ir2];
    for(var kr = 0; kr < R2.n; kr++){
      var co = (al() * 4) | 0;
      var pr = R2.d0 + al() * (R2.d1 - R2.d0);
      var lo2, fx3, fy3;
      if(co === 0){ lo2 = -R2.d1 + al() * (GW + 2 * R2.d1); fx3 = lo2; fy3 = -pr; }
      else if(co === 1){ lo2 = -R2.d1 + al() * (GW + 2 * R2.d1); fx3 = lo2; fy3 = GH - 1 + pr; }
      else if(co === 2){ lo2 = -R2.d1 + al() * (GH + 2 * R2.d1); fx3 = -pr; fy3 = lo2; }
      else { lo2 = -R2.d1 + al() * (GH + 2 * R2.d1); fx3 = PLAGE_X0 - 1 + pr; fy3 = lo2; }
      var v3 = al(), s3 = al();
      /* la plage de débarquement reste dégagée, comme pour la forêt
         d'origine : c'est par là qu'on arrive */
      if(fx3 > PLAGE_X0 - 3 && fy3 > -4 && fy3 < GH + 3) continue;
      c.flore.push({ gx:fx3, gy:fy3, fam:"arbre", v:v3, s:s3,
                     ech:R2.ech[0] + (R2.ech[1] - R2.ech[0]) * s3, fond:1 });
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
/* ================================================================
   LES BLESSURES DES BÂTIMENTS

   « Si Roro attaque un Frelon et qu'il l'a détruit à cinquante pour
   cent, pourquoi est-ce que moi j'aurais cent pour cent à redétruire,
   et pourquoi est-ce que Roro aussi ? »

   Parce que l'instantané ne savait dire qu'une chose d'un bâtiment :
   DEBOUT ou TOMBÉ. Un bit chacun, dans `d`. Il n'existait nulle part
   où écrire « à moitié fait ». Le Brasier, lui, a toujours eu ses
   points de vie — c'est pour ça que ses dégâts survivaient et que
   ceux des défenses non.

   ────────────────────────────────────────────────────────────────
   UNE LISTE CREUSE, ET NON UN TABLEAU PLEIN

   Le réflexe serait d'ajouter la vie de CHAQUE bâtiment. Sur la
   jungle gravée, c'est 2 158 valeurs : à deux bits chacune, 720
   caractères ajoutés à un instantané qui en fait quatre cents. On
   triplerait le message pour décrire deux mille bâtiments dont la
   quasi-totalité est intacte ou détruite.

   Mesuré pendant un assaut complet, quatre-vingt-quatre Furies
   lâchées sur une île : à tout instant, il y a UN OU DEUX bâtiments
   entamés-mais-debout. Pas vingt, pas cent. Deux. Les troupes
   concentrent leur feu, un bâtiment tombe en quelques secondes, et
   elles passent au suivant.

   On ne liste donc que les BLESSÉS. Trois caractères chacun — deux
   pour l'index, un pour le cran de vie — soit six caractères en jeu
   réel. C'est le poste le moins cher de tout l'instantané.

   ────────────────────────────────────────────────────────────────
   SOIXANTE-QUATRE CRANS, ET POURQUOI PAS LA VIE EXACTE

   La vie est rangée en soixante-quatre crans, du plein au presque
   mort — un cran et demi pour cent. Trois raisons, et la troisième
   est la vraie :

     elle tient sur UN caractère au lieu de trois ;
     un cran et demi pour cent est en dessous de ce qu'un joueur
       distingue sur une barre de vie ;
     et surtout, elle CHANGE RAREMENT. Une valeur exacte changerait à
       chaque image, donc l'instantané serait « sale » en permanence
       et l'on republierait sans arrêt pendant tout un assaut. Le cran
       ne bouge que soixante-quatre fois dans la vie d'un bâtiment.

   L'ARRONDI VA VERS LE BAS, toujours : le cran retenu dit un peu plus
   de dégâts que la réalité, jamais moins. C'est le sens sûr — une
   fusion ne peut ainsi jamais rendre de la vie à un bâtiment.

   ────────────────────────────────────────────────────────────────
   LA FUSION : UNION, ET LE MINIMUM PAR INDEX

   Absent veut dire INTACT. Fusionner, c'est donc prendre l'union des
   deux listes et, pour un index présent des deux côtés, le plus bas
   des deux crans. C'est commutatif, associatif et idempotent — les
   trois propriétés qui font que l'ordre d'arrivée des messages n'a
   aucune importance, comme pour tout le reste de l'instantané.

   ET `d` GAGNE TOUJOURS. Un bâtiment déclaré détruit ne peut pas être
   en même temps blessé : au chargement, on éteint d'abord ce que `d`
   dit mort, et les blessures ne s'appliquent qu'aux survivants.
   ================================================================ */
/* Le nombre de crans, moins un : le cran 63 est la pleine vie et ne
   se transmet jamais — c'est ce que veut dire « absent ». */
var BLESSURE_CRANS = 63;
/* Au-delà de cette longueur, on ne garde que les plus abîmés. En jeu
   réel on en compte un ou deux ; ce plafond n'est pas un réglage, c'est
   un garde-fou contre un cas qu'on n'a pas su imaginer. Ce qui tombe
   est ce qui était le MOINS entamé, donc ce qui coûte le moins cher à
   refaire. */
var BLESSURES_MAX = 64;

/* Un index sur douze bits — deux caractères — et un cran sur six —
   un caractère. La jungle gravée compte 2 158 bâtiments, le plafond
   de douze bits en tient 4 096. */
function encodeBlessures(liste){
  if(!liste || !liste.length) return "";
  var l = liste.slice(0);
  /* les plus abîmés d'abord : si l'on doit couper, on coupe ce qui
     compte le moins */
  l.sort(function(a, b){ return a.n - b.n; });
  if(l.length > BLESSURES_MAX) l.length = BLESSURES_MAX;
  /* mais on les range par index : deux clients qui ont les mêmes
     blessures doivent produire exactement la même chaîne, sinon
     memeMonde les croit différents et l'on republie en boucle */
  l.sort(function(a, b){ return a.i - b.i; });
  var s = "", k;
  for(k = 0; k < l.length; k++){
    var i = l[k].i | 0, n = l[k].n | 0;
    if(i < 0 || i > 4095) continue;
    if(n < 0) n = 0;
    if(n >= BLESSURE_CRANS) continue;         // intact : rien à dire
    s += ALPHA_BITS.charAt(i & 63) + ALPHA_BITS.charAt((i >> 6) & 63)
       + ALPHA_BITS.charAt(n);
  }
  return s;
}
function decodeBlessures(s){
  var o = {};
  if(typeof s !== "string") return o;
  for(var k = 0; k + 2 < s.length; k += 3){
    var a = ALPHA_BITS.indexOf(s.charAt(k));
    var b = ALPHA_BITS.indexOf(s.charAt(k + 1));
    var n = ALPHA_BITS.indexOf(s.charAt(k + 2));
    if(a < 0 || b < 0 || n < 0) continue;
    var i = a + (b << 6);
    /* le plus bas gagne, même à l'intérieur d'une seule chaîne : une
       chaîne malformée qui répéterait un index ne doit pas rendre de
       la vie */
    if(o[i] === undefined || n < o[i]) o[i] = n;
  }
  return o;
}
/* Union des deux listes, minimum par index. Absent = intact. */
function fusionneBlessures(a, b){
  var x = decodeBlessures(a), y = decodeBlessures(b), i, out = [];
  for(i in y) if(x[i] === undefined || y[i] < x[i]) x[i] = y[i];
  for(i in x) out.push({ i:i | 0, n:x[i] | 0 });
  return encodeBlessures(out);
}
/* ----------------------------------------------------------------
   LE CRAN D'UN BÂTIMENT, ARRONDI VERS LE BAS

   ET LE POINT FIXE. Un bâtiment blessé fait l'aller-retour sans arrêt :
   ses PV donnent un cran, le cran repose des PV, qui redonnent un cran.
   Si ce cycle n'est pas STABLE, chaque tour rabote un peu de vie — des
   dégâts gratuits, offerts par l'arrondi et non par une troupe.

   Mesuré avant correction, sur une défense de 720 PV publiée toutes les
   deux secondes : 75,0 → 74,6 → 73,1 %. Deux crans perdus pour rien, et
   l'ampleur dépendait des PV max du bâtiment — 700 PV en perdait trois.
   La cause était un Math.round sur les PV reposés : 47/63 de 720 vaut
   537,14, arrondi à 537, qui redonne le cran 46 et non 47.

   Deux gestes suffisent, et il faut les deux : les PV reposés restent
   FRACTIONNAIRES (voir appliqueBlessuresAuJeu), et le plancher ici se
   prend avec un epsilon qui absorbe le bruit du flottant. Le cycle est
   alors un point fixe atteint en UN pas, quels que soient les PV max.
   ---------------------------------------------------------------- */
function cranBlessure(pv, pvMax){
  if(!(pvMax > 0)) return BLESSURE_CRANS;
  var f = pv / pvMax;
  if(!(f > 0)) return 0;
  if(f >= 1) return BLESSURE_CRANS;
  var n = Math.floor(f * BLESSURE_CRANS + 1e-6);
  return n < 0 ? 0 : (n > BLESSURE_CRANS ? BLESSURE_CRANS : n);
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
/* ================================================================
   LE JARDIN DE MILY — le plan gravé des « Mily et une nuits »

   « Il faut mettre cinquante pour cent de défenses en plus, et les
   disposer de manière élégante. »

   Les deux moitiés de la phrase se battent. Une île plus dense est
   une île plus UNIFORME : on remplit, et le remplissage n'a pas de
   forme. C'est exactement ce qu'ont donné les premiers essais —
   huit cent quarante défenses réparties au petit bonheur, soit une
   moquette. Le compte était juste et il n'y avait rien à regarder.

   ────────────────────────────────────────────────────────────────
   CE QUI REND UN MOTIF VISIBLE, ET CE N'EST PAS SA COULEUR
   ────────────────────────────────────────────────────────────────

   Premier essai : tout le monde à la même densité, et les motifs
   décrits par leurs TYPES — un croissant « 40 % de Bobines, 34 % de
   Cribles, 26 % de Silos » sur un fond lui aussi mélangé. Invisible.
   Mesuré sur une carte tracée à plat : on ne distinguait rien du
   tout. Un mélange sur un mélange ne fait pas une frontière.

   Il a fallu deux choses, et les deux ensemble :

     UN SEUL TYPE PAR MOTIF. Un croissant n'est plus « surtout des
     Bobines », il est FAIT de Bobines, à cent pour cent. La bordure
     est faite de Cribles et de Pilons, les étoiles de Chalumeaux, le
     bassin de Cuves, la garde du Brasier de Frelons. Le motif se lit
     alors comme une couleur pleine sur un fond tramé.

     DU VIDE AUTOUR. Les allées ne sont pas un ornement : ce sont
     elles qui donnent aux motifs un bord. Une île pleine du bord à
     bord n'a pas de dessin, elle a une surface. On perd des défenses
     dans les allées, et on les reprend en saturant les carrés — le
     compte final est le même, la lecture n'a rien à voir.

   ────────────────────────────────────────────────────────────────
   LE BUDGET PAR TYPE, ET POURQUOI IL COMMANDE LA GÉOMÉTRIE
   ────────────────────────────────────────────────────────────────

   Il y a ONZE Frelons sur cette carte aujourd'hui. Un premier jet
   faisait une bordure de Frelons tout autour de l'île : deux cent
   cinquante-cinq. Vingt-trois fois plus, sur la défense à longue
   portée — la carte devenait injouable, et « cinquante pour cent en
   plus » aurait voulu dire tout autre chose.

   Chaque type garde donc sa part d'aujourd'hui, à cinquante pour
   cent près, et c'est CE BUDGET qui décide de la taille des motifs :
   les Frelons sont rares, donc leur anneau est mince et c'est la
   garde rapprochée du Brasier ; les Cribles sont nombreux, donc ils
   font la bordure. La géométrie sort de l'équilibrage, et non
   l'inverse.

   ────────────────────────────────────────────────────────────────
   LA COMPOSITION — un tapis persan, et sa lecture
   ────────────────────────────────────────────────────────────────

   Le fond, la bordure, quatre carrés séparés par deux allées, un
   médaillon au croisement. C'est le plan d'un chahar bagh, le jardin
   à quatre parterres, et il tombe juste ici pour une raison qui n'a
   rien de décorative : l'allée d'honneur va de la plage au Brasier.
   Elle offre à l'assaillant un chemin dégagé — qui passe entre les
   quatre carrés saturés, sous le feu croisé des croissants.

   La pile de calques, du fond vers le dessus (le dernier posé
   l'emporte, comme dans l'éditeur) :

     1. LE FOND          le mélange d'aujourd'hui, fourni
     2. LA BORDURE       le rempart du palais, Cribles et Pilons
     3. LES QUATRE CARRÉS saturés — c'est là que sont les cinquante
                          pour cent en plus
     4. LA ROSACE        trois anneaux d'un seul type autour du
                          Brasier, et sept rayons de vide qui les
                          traversent
     5. LES CROISSANTS   deux, à l'ouest, ouverts vers la plage
     6. LES ÉTOILES      deux khatim à huit branches, à l'est
     7. LE MÉDAILLON     l'étoile centrale, son anneau et son bassin
     8. LES ALLÉES       taillées EN DERNIER, sinon elles ne
                          couperaient rien
     9. LES HAIES        le tracé du joueur, par-dessus tout — y
                          compris par-dessus les allées, puisque la
                          ligne de plage doit être CONTINUE

   Mesuré : 849 défenses contre 559, soit +51,9 %, et chaque type à
   moins de vingt pour cent de sa part d'origine. Puis les haies, qui
   portent le total à 1 240 bâtiments contre 788 sur l'île nue.
   ================================================================ */
/* Les indices de TYPES_PLAN, écrits une fois pour que la composition
   se lise comme un dessin et non comme une suite de nombres. */
var PN_CRIBLE = 1, PN_CHALUMEAU = 2, PN_FRELON = 3, PN_PILON = 4,
    PN_BOBINE = 5, PN_CUVE = 6, PN_SILO = 7, PN_VIDE = 8;
var planNuitsCache = null;
function planNuits(){
  if(planNuitsCache !== null) return planNuitsCache;
  var AX = 68;                     // l'axe de symétrie : celui du Brasier
  var F = [], g = 1;
  /* Les cinq formes, sous les noms du dessin. `x:1` fige la graine :
     un motif gravé ne doit pas se rejouer d'une partie à l'autre. */
  function cercle(x, y, r, C, d, rep){
    F.push({ f:0, k:0, d:d, r:rep | 0, x:1, g:g++, G:[x, y, r], C:C }); }
  function anneau(x, y, ri, re, C, d, rep){
    F.push({ f:1, k:0, d:d, r:rep | 0, x:1, g:g++, G:[x, y, ri, re], C:C }); }
  function pave(x, y, w, h, C, d, rep){
    F.push({ f:2, k:0, d:d, r:rep | 0, x:1, g:g++, G:[x, y, w, h], C:C }); }
  function trait(x1, y1, x2, y2, e, C, d, rep){
    F.push({ f:3, k:0, d:d, r:rep | 0, x:1, g:g++, G:[x1, y1, x2, y2, e], C:C }); }
  /* L'étoile à huit branches — le khatim, celui des mosaïques. Un
     polygone de seize sommets qui alternent le rayon long et le
     rayon court. */
  function etoile(x, y, re, ri, n, C, d, rep){
    var P = [], k;
    for(k = 0; k < n * 2; k++){
      var a = k * Math.PI / n - Math.PI / 2, R = (k & 1) ? ri : re;
      P.push(Math.round(x + Math.cos(a) * R), Math.round(y + Math.sin(a) * R));
    }
    F.push({ f:4, k:0, d:d, r:rep | 0, x:1, g:g++, G:P, C:C });
  }
  var UN = function(t){ return [[t, 100]]; };
  var VIDE = UN(PN_VIDE);
  /* Le mélange du fond garde les proportions d'aujourd'hui : c'est
     lui qui porte le gros des effectifs, donc c'est lui qui tient
     l'équilibrage. */
  var FOND = [[PN_CRIBLE, 31], [PN_PILON, 26], [PN_BOBINE, 15],
              [PN_CHALUMEAU, 14], [PN_SILO, 12], [PN_FRELON, 2]];

  /* 1. LE FOND */
  pave(4, 2, 134, 130, FOND, 1, 1);

  /* 2. LA BORDURE — un rempart de NEUF cases tout autour. On peint
     l'île entière, puis on rend l'intérieur au fond : c'est ainsi
     qu'on obtient un cadre, faute d'opération de soustraction.

     SON ÉPAISSEUR EST LE RÉGLAGE FIN DU TOTAL, et c'est une surprise
     de la mesure : ni la taille des carrés — de vingt à cinquante
     cases de côté, le total ne bouge que de cinquante défenses — ni
     la densité du fond ne pèsent grand-chose. Le rempart, lui, court
     sur tout le pourtour de l'île : chaque case d'épaisseur en plus
     vaut vingt défenses. C'est donc par lui qu'on atterrit sur les
     cinquante pour cent, à sept près. */
  pave(4, 2, 134, 130, [[PN_PILON, 50], [PN_CRIBLE, 50]], 5, 2);
  pave(13, 11, 116, 112, FOND, 1, 1);

  /* 3. LES QUATRE CARRÉS DU JARDIN, saturés. Ils donnent au jardin
     ses quatre parterres, et pèsent bien moins qu'on ne croirait sur
     le total : voir la bordure ci-dessus. */
  pave(22, 20, 41, 37, FOND, 5, 1);
  pave(85, 20, 37, 37, FOND, 5, 1);
  pave(22, 80, 41, 37, FOND, 5, 1);
  pave(85, 80, 37, 37, FOND, 5, 1);

  /* 4. LA GARDE DU BRASIER, et pourquoi ce n'est pas une rosace.
     Le premier dessin faisait trois anneaux concentriques traversés
     de sept rayons — sur le papier, une rosace de cathédrale. À
     l'écran, rien du tout, et la raison est arithmétique : il y a UNE
     défense toutes les cinq cases, donc un anneau de six cases
     d'épaisseur est épais d'UNE tour. Une rosace de traits fins ne
     peut pas exister sur cette grille.
     Les Frelons imposaient d'ailleurs leur propre limite : il y en a
     onze sur la carte d'origine, et un anneau autour du Brasier en
     aurait demandé quatre-vingts. Ils font donc ce qu'ils savent
     faire de mieux — un poing serré devant la porte. */
  cercle(9, AX, 14, UN(PN_FRELON), 5, 1);
  anneau(9, AX, 22, 34, UN(PN_PILON),  5, 1);
  anneau(9, AX, 43, 56, UN(PN_CRIBLE), 5, 1);

  /* 5 et 6. LES DEUX COMPARTIMENTS DE CHAQUE CÔTÉ DE L'AXE.
     Un croissant à l'ouest, un œil à l'est, et le tout en miroir : la
     symétrie est ce qui distingue un jardin d'un terrain vague. */
  for(var k = -1; k <= 1; k += 2){
    var y = AX + k * 30;
    /* LE CROISSANT, obtenu comme un vrai : un disque, moins un
       disque décalé. Le second ne pose pas du vide mais LE FOND —
       creuser au vide arrachait la moitié de l'île, mesuré. Le
       décalage est calculé pour que le limbe reste épais de trois
       tours au plus mince : en dessous, il se rompt. */
    cercle(42, y, 24, UN(PN_BOBINE), 5, 1);
    cercle(55, y - k * 8, 21, FOND, 1, 1);
    /* L'ŒIL : un disque plein et son anneau. L'étoile à huit branches
       qu'il remplace était le bon symbole et la mauvaise échelle —
       ses pointes faisaient dix cases, donc deux tours, et il n'en
       restait qu'une tache. */
    cercle(103, y, 17, UN(PN_CHALUMEAU), 5, 1);
    anneau(103, y, 24, 29, UN(PN_SILO), 5, 1);
  }

  /* 7. LE MÉDAILLON, au croisement des deux allées */
  anneau(74, AX, 16, 28, UN(PN_CRIBLE), 5, 1);
  anneau(74, AX,  9, 13, UN(PN_CUVE), 5, 1);
  cercle(74, AX, 7, VIDE, 0, 0);                // le bassin

  /* 8. LES ALLÉES, taillées en dernier, et LARGES : quatorze cases,
     soit trois pas de la grille. À neuf elles ne se lisaient pas —
     une allée d'une tour de large n'est pas une allée, c'est un
     trou. */
  /* LES ALLÉES S'ARRÊTENT AU BASSIN, et ce n'est pas une coquetterie :
     tracées d'un bord à l'autre, elles passaient par-dessus le
     médaillon et l'effaçaient — mesuré, il ne restait pas une seule
     Cuve sur l'île. Une allée de jardin mène au bassin, elle ne le
     traverse pas. */
  trait(134, AX, 104, AX, 14, VIDE, 0, 0);      // l'allée d'honneur, côté plage
  trait(44, AX, 30, AX, 14, VIDE, 0, 0);        // et côté Brasier
  trait(74, 22, 74, 46, 14, VIDE, 0, 0);        // la transversale, au nord
  trait(74, 90, 74, 114, 14, VIDE, 0, 0);       // et au sud
  /* L'allée circulaire n'est PAS vide : elle est clairsemée, et
     c'est là que tiennent les miradors — le même tour que dans la
     jungle. Vidée pour de bon, il n'en restait plus deux sur l'île. */
  anneau(74, AX, 30, 38, [], 1, 0);

  /* ════════════════════════════════════════════════════════════
     9. LES HAIES — le tracé du joueur

     « Il faudrait rajouter des silos, une ligne bien dense de
     frelons selon les lignes jaunes que j'ai dessinées, dont une
     ligne continue le long de la plage. »

     Les lignes ont été relevées sur la capture, en repassant la
     projection isométrique à l'envers : le portrait de Mily donne le
     Brasier en (9, 68), et le trait droit du bas retombe sur gx ≈ 139
     à ses deux bouts — c'est-à-dire exactement le bord de la plage.
     Les deux repères s'accordent, donc le relevé tient.

     CE QUE LES QUATRE TRACÉS SONT DEVENUS
       — la ligne de plage, du nord au sud, CONTINUE : elle ne
         s'interrompt pas pour laisser passer l'allée d'honneur, et
         c'était la moitié de la demande ;
       — deux diagonales, des flancs du Brasier aux deux yeux, qui se
         croisent à l'ouest du médaillon ;
       — un arc à l'est, qui referme la boucle par le nord et le sud.

     ELLES CONTOURNENT LE MÉDAILLON, et c'est la seule liberté prise
     sur le relevé : tracées au plus court, les diagonales passaient à
     douze cases du bassin et emportaient les deux tiers de l'anneau
     de Cuves — mesuré, 26 Cuves tombaient à 8. On les écarte à
     dix-sept cases, le croisement ne bouge pas d'une case, et le
     médaillon reste entier.

     LA HAIE EST DOUBLE, et c'est ainsi qu'on met les Silos demandés
     sans étouffer le jardin : une bande large de Silos, puis
     l'échine de Frelons posée dessus. On voit donc une ligne de
     Frelons bordée de Silos, et non deux dessins qui se disputent.
     Un premier essai posait une bande de Silos de vingt cases : le
     compte était bon et les yeux de Chalumeaux disparaissaient.

     CE QUE ÇA CHANGE, MESURÉ, ET IL FAUT LE DIRE. Le feu TOTAL de
     l'île baisse — 29 995 → 27 995 dégâts par seconde — parce qu'un
     Frelon tape moins vite qu'un Crible. Mais le feu à LONGUE PORTÉE
     est multiplié par deux et demi (4 313 → 10 573), et surtout le
     débarquement se fait arroser quatre fois plus : de 280 dégâts
     par seconde reçus sur la plage à 1 100 environ, et cette fois sur
     TOUTE sa longueur. L'île n'est pas plus puissante, elle est
     beaucoup plus difficile à ABORDER — c'est bien ce qu'une haie de
     batteries de missiles le long d'une plage veut dire.
     ════════════════════════════════════════════════════════════ */
  /* Un tracé du joueur : une ligne brisée, passée deux fois. */
  function chemin(pts, e, C){
    for(var i = 0; i + 1 < pts.length; i++)
      trait(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], e, C, 5, 1);
  }
  /* ════════════════════════════════════════════════════════════
     DEUX CENTS FRELONS, ET RÉPARTIS

     « Tu peux en mettre que deux cents — entre guillemets, que deux
     cents — et tu les répartis correctement. »

     Les deux moitiés de la phrase demandaient deux gestes opposés, et
     c'est la seconde qui a commandé.

     LE COMPTE. L'échine passe de sept cases à quatre et demie : 263
     Frelons deviennent 208. On ne peut pas viser 200 pile — la grille
     des défenses pose une tour toutes les cinq cases, si bien que la
     largeur de la bande fait sauter le compte par paliers : 208 ou
     241, rien entre les deux.

     LA RÉPARTITION, et c'est là qu'était le vrai défaut. Mesuré en
     découpant l'île en neuf : le nord-ouest et le sud-ouest portaient
     ZÉRO Frelon. Le tracé relevé sur la capture couvrait la moitié
     est — c'est celle que le joueur avait sous les yeux quand il a
     dessiné — et les deux quartiers derrière le Brasier restaient
     sans une seule batterie à longue portée.

     On complète donc la figure plutôt que de la corriger : les deux
     diagonales qui partent des flancs du Brasier vers l'est reçoivent
     leurs deux SŒURS vers l'ouest. Ce n'est plus une croix, c'est une
     étoile à six branches dont le Brasier est le centre — et c'est ce
     que le tracé demandait sans le dire, puisqu'il ne pouvait tracer
     que ce qui tenait dans l'écran.

     Résultat mesuré, par neuvième d'île :
         13  24  15          0  34  23
         41  27  32   contre  51  44  51
         13  24  19          0  30  30
     Le neuvième le plus pauvre passe de zéro à treize, et la ligne de
     plage reste continue — quarante-neuf Frelons, pas un trou de plus
     de 3,4 cases.
     ════════════════════════════════════════════════════════════ */
  var HAIES = [
    [[132, 8], [132, 128]],                                  // la plage, continue
    [[20, 55], [100, 101]],                                  // du Brasier à l'œil sud
    [[20, 87], [100, 33]],                                   // du Brasier à l'œil nord
    [[68, 21], [100, 50], [112, 66], [104, 100], [82, 119]], // l'arc de l'est
    [[20, 55], [32, 26], [64, 16]],                          // la branche du nord-ouest
    [[20, 87], [32, 116], [64, 126]]                         // et celle du sud-ouest
  ];
  var HAIE_SILO = 12, HAIE_FRELON = 4.4;
  for(var h = 0; h < HAIES.length; h++) chemin(HAIES[h], HAIE_SILO,   UN(PN_SILO));
  for(h = 0; h < HAIES.length; h++)     chemin(HAIES[h], HAIE_FRELON, UN(PN_FRELON));

  planNuitsCache = encodePlanComplet(planVide(), F);
  return planNuitsCache;
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
  /* Les Mily et une nuits portent le leur — le jardin. Même règle :
     un plan enregistré pour cette carte reprend la main. */
  if(CARTES[index] && CARTES[index].biome === "nuits"){
    return planCarte(paquetSalon, index) || planNuits();
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

/* ================================================================
   LE BLINDAGE DES DÉFENSES — UN POURCENTAGE PAR CARTE

   « J'aimerais bien que sur chaque carte on mette à l'accueil un
   pourcentage, uniquement sur les défenses, pas sur le QG. Ce
   pourcentage doit être défini dans les paramètres de la page
   d'accueil, et dès qu'on le modifie ça doit directement être
   appliqué sur la map. Par exemple, une défense qui a trois mille de
   vie, si je mets plus cent pour cent, elle en aura six mille. »

   ────────────────────────────────────────────────────────────────
   POURQUOI C'EST UN POURCENTAGE ET PAS DES POINTS DE VIE

   Parce que les blessures voyagent en FRACTION. `cranBlessure` range
   la vie d'un bâtiment sur soixante-trois crans de sa vie MAXIMALE,
   pas en points : un bâtiment à moitié abattu vaut « cran 31 » chez
   tout le monde, quelle que soit sa vie totale. Multiplier la vie
   maximale ne touche donc à AUCUNE blessure enregistrée — celui qui
   était à moitié reste à moitié. C'est cette propriété, et elle
   seule, qui permet d'appliquer le réglage à une partie EN COURS
   sans rien réinitialiser. Si les blessures avaient été rangées en
   points, il aurait fallu choisir entre les perdre et les fausser.

   Le bitmap des destructions, lui, ne connaît que des rangs : il ne
   voit même pas passer le changement.

   ────────────────────────────────────────────────────────────────
   CE QU'IL NE TOUCHE PAS, ET C'EST DIT DANS LA DEMANDE

   LE BRASIER. Il n'est pas dans `c.batiments` — sa vie est un chiffre
   annoncé au joueur sur la vignette d'accueil, et il reste ce qu'il
   est. « Uniquement sur les défenses, pas sur le QG. »

   LA CELLULE À RÉCOLTER, qui n'est pas une défense mais de la
   récolte : la blinder rendrait la moisson deux fois plus lente sur
   la seule carte où l'on en veut.

   LE RÉACTEUR du bouclier, dont les 200 000 PV sont annoncés au
   briefing — « PROTÉGÉ, 5 cellules électriques ». Un chiffre annoncé
   ne se multiplie pas dans le dos du joueur.

   Ce sont exactement les trois exceptions du bonus des cartes
   événement, et pour exactement les mêmes raisons.

   ────────────────────────────────────────────────────────────────
   ET LE PRIX À CONNAÎTRE : LE SCORE SE COMPTE EN POINTS DE VIE

   `jeu.degatsMoi += Math.min(d, b.pv)` — le TOP DÉGÂTS compte les
   points de vie réellement retirés. Blinder une carte à +100 %, c'est
   donc rendre les scores futurs deux fois plus gros que les scores
   déjà inscrits SUR CETTE CARTE. Ce n'est pas un défaut qu'on pourrait
   corriger sans changer la nature du classement ; c'est un fait dont
   il faut tenir compte, et c'est pour cela que le réglage vaut ZÉRO
   partout par défaut, et que le panneau d'administration le dit en
   toutes lettres avant de laisser toucher une carte déjà jouée.

   ────────────────────────────────────────────────────────────────
   COMMENT IL VOYAGE

   Deux champs de l'instantané, sur le modèle exact du plan :
     bd   la table, encodée « index:pourcentage|index:pourcentage »
     bn   un compteur monotone — la dernière édition l'emporte
   À numéro égal, la chaîne la plus grande gagne : deux clients qui
   éditeraient en même temps convergent au lieu de se renvoyer la
   balle indéfiniment. C'est mot pour mot meilleurPlan().
   ================================================================ */
var BLINDAGE_MAX = 900;

function encodeBlindages(o){
  if(!o) return "";
  var l = [], k, cles = [];
  /* ON PARCOURT LES CLÉS DE LA TABLE, PAS LE TABLEAU DES CARTES. La
     première écriture bouclait sur CARTES.length, ce qui paraissait
     plus sûr et l'était moins : le jour où une île s'ajoute, un client
     resté sur l'ancienne version relit la table, la ré-encode, et
     efface au passage le réglage de la carte qu'il ne connaît pas. Ici
     il le recopie sans le comprendre, ce qui est exactement ce qu'on
     veut d'un client en retard. */
  for(k in o) if(o.hasOwnProperty(k) && (k | 0) >= 0 && String(k | 0) === String(k))
    cles.push(k | 0);
  /* rangé par index : deux clients qui portent la même table doivent
     produire exactement la même chaîne, sinon memeMonde les croit
     différents et l'on republie en boucle */
  cles.sort(function(a, b){ return a - b; });
  for(var i = 0; i < cles.length; i++){
    var v = borne(Math.round(o[cles[i]] || 0), 0, BLINDAGE_MAX);
    if(v > 0) l.push(cles[i] + ":" + v);
  }
  return l.join("|");
}
function decodeBlindages(s){
  var o = {};
  if(!s || typeof s !== "string") return o;
  var p = s.split("|");
  for(var i = 0; i < p.length; i++){
    var j = p[i].indexOf(":");
    if(j <= 0) continue;
    var idx = parseInt(p[i].substr(0, j), 10);
    var v = parseInt(p[i].substr(j + 1), 10);
    if(!(idx >= 0) || !(v > 0)) continue;
    o[idx] = borne(Math.round(v), 0, BLINDAGE_MAX);
  }
  return o;
}
/* Le blindage d'UNE carte, tiré d'une table encodée. */
function blindageDans(s, index){
  var t = decodeBlindages(s);
  return t[index] | 0;
}
/* Lequel des deux instantanés porte le blindage qui fait foi. Copie
   conforme de meilleurPlan : le numéro tranche, et à numéro égal la
   chaîne la plus grande — pour que deux clients convergent. */
function meilleurBlindage(a, b){
  var ba = (a && typeof a.bd === "string") ? a.bd : "", na = a ? (a.bn | 0) : 0;
  var bb = (b && typeof b.bd === "string") ? b.bd : "", nb = b ? (b.bn | 0) : 0;
  if(nb > na) return { bd:bb, bn:nb };
  if(na > nb) return { bd:ba, bn:na };
  return bb > ba ? { bd:bb, bn:nb } : { bd:ba, bn:na };
}

/* LA TABLE EN VIGUEUR, côté client. Même rôle et même discipline que
   `planSalon` : le réseau la pose à chaque instantané reçu, et tout
   ce qui publie la ré-estampille. `genereCarte` la lit — jamais une
   valeur figée au chargement de la page. */
var blindageSalon = "", numeroBlindage = 0;
function poseBlindageSalon(bd, bn){
  blindageSalon = (typeof bd === "string") ? bd : "";
  numeroBlindage = bn | 0;
  return blindageSalon;
}
/* Le facteur en vigueur pour une carte : 1 si rien n'est réglé. */
function blindageDeCarte(i){ return blindageDans(blindageSalon, i); }
function facteurBlindage(i){ return 1 + blindageDeCarte(i) / 100; }

/* La vie totale des DÉFENSES d'une carte, blindage compris — c'est
   ce chiffre-là que l'accueil doit montrer, et un seul : « six
   mille », jamais « trois mille plus trois mille ». */
function pvDefensesCarte(c){
  var n = 0;
  for(var i = 0; i < c.batiments.length; i++){
    var b = c.batiments[i];
    if(b.t === "cellule" || b.t === "reacteur") continue;
    n += b.pvMax;
  }
  return n;
}

function mondeVide(index, pvMax, cycle){
  var o = { v:0, cy:cycle | 0, c:index | 0, pv:pvMax, d:"", bl:"", g:"", w:"",
            p:"", pn:0, tg:0, s:"", k:"", ch:"", t3:"", bd:"", bn:0 };
  /* une voie neuve par carte événement, chacune avec SES défauts */
  for(var q = 0; q < VOIES_EVT.length; q++){
    var V = VOIES_EVT[q], R = reglagesEvt(V.i);
    voiePosee(o, V.P, { e:0, f:0, d:"", bl:"", q:0, t:0, mj:R.minJoueurs, mn:0, b:R.pvBonus });
  }
  return o;
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
/* ----------------------------------------------------------------
   LE PLAFOND DU TABLEAU — EN OCTETS, ET PAR APPAREIL

   Il était de SOIXANTE ENTRÉES, et c'était deux erreurs en une.

   La première : une entrée n'est pas un joueur, c'est un joueur SUR
   UNE ÎLE. Six îles, soixante entrées : le salon ne tenait que DIX
   appareils. Au onzième, un joueur entier disparaissait du tableau
   retenu — et n'y revenait jamais s'il avait fermé son navigateur,
   puisque plus personne ne republiait sa part.

   La seconde : la coupe triait les ENTRÉES une à une et sortait les
   plus petites. Le joueur régulier, celui qui étale ses dégâts sur
   les six îles, présentait six petits nombres là où un joueur d'un
   soir en présentait un gros : il se faisait sortir six fois plus
   facilement, alors que son TOTAL était le plus gros du salon. Mesuré :
   6 000 000 de dégâts affichés 1 000 000, pendant qu'un joueur à
   1 500 001 restait intact.

   On coupe donc désormais PAR APPAREIL et EN OCTETS :
     — on somme les dégâts par seau, on trie les SEAUX par ce total,
       et l'on garde des seaux ENTIERS. Un appareil est là tout
       entier, ou pas du tout : jamais amputé de certaines de ses îles.
     — le budget est une taille, pas un compte. Huit kilo-octets
       portent une soixantaine d'appareils sur six îles, là où
       soixante entrées n'en portaient que dix. L'instantané complet
       pesait deux kilo-octets et MQTT 3.1.1 en admet 268 millions :
       la contrainte n'a jamais été le transport.

   Ce que ce plafond ne peut pas faire, et il faut le dire : aucune
   borne ne rend la fusion parfaitement monotone. Un message borné ne
   peut pas porter un tableau non borné. Ce qu'on peut faire, c'est
   le placer assez haut pour qu'un salon réel ne l'atteigne jamais, et
   couper d'une manière stable et compréhensible quand il l'atteint.
   Un joueur coupé qui est encore connecté revient de lui-même : son
   propre appareil réinjecte sa part à chaque publication.
   ---------------------------------------------------------------- */
var SCORES_OCTETS = 8192;       // budget du tableau dans l'instantané
var SCORES_GARDES = 512;        // garde-fou dur, très au-dessus du budget
var MARQUE_SCORES = "~";        // en tête : format « seau », par opposition à l'ancien

/* La taille réelle d'une chaîne une fois transmise. Les pseudos ne
   sont pas de l'ASCII : « Gégé » pèse six octets pour quatre signes,
   et un plafond compté en caractères mentirait d'autant. */
function octetsUtf8(s){
  var n = 0, i, c;
  for(i = 0; i < s.length; i++){
    c = s.charCodeAt(i);
    if(c < 0x80) n += 1;
    else if(c < 0x800) n += 2;
    else if(c >= 0xD800 && c < 0xDC00){ n += 4; i++; }   // paire de substitution
    else n += 3;
  }
  return n;
}

/* ----------------------------------------------------------------
   LE SCORE — L'IDENTITÉ EST L'APPAREIL, LE PSEUDO N'EST QU'UNE
   ÉTIQUETTE

   DEUX DÉFAUTS SUCCESSIFS, ET CELUI-CI EST LE PLUS PROFOND.

   Le premier : le score était le PLUS GRAND nombre de dégâts jamais vu
   pour un pseudo, et le nombre publié repartait de zéro à chaque île.
   Un joueur à 302 475 restait donc figé à 302 475.

   Le second, constaté juste après : trois lignes au classement pour
   UNE seule personne — « Roro », « Roro-1 », « Roro-1-1 », toutes au
   même score. Le jeu ne renomme personne, c'est la saisie qui varie
   (le navigateur propose une variante, on tape une majuscule, on
   ajoute un espace). Mais le score était rangé SOUS LE PSEUDO : un
   caractère de différence, et c'était un autre joueur, avec son propre
   compteur reparti de zéro.

   L'IDENTITÉ EST DONC L'APPAREIL. La clé est « seau · carte », le
   seau étant l'appareil — quatre caractères tirés de son identifiant
   stable, gardé dans le navigateur. Le pseudo voyage À CÔTÉ, comme
   une étiquette : on peut le changer autant qu'on veut, le compteur
   ne bouge pas, il change juste de nom à l'affichage.

   D'où, sans rien de plus :
     — trois façons d'écrire son pseudo sur le même appareil : UNE
       ligne, un seul compteur, celui qui continue ;
     — le même pseudo sur deux appareils : deux seaux, additionnés
       sous une seule ligne au classement ;
     — deux appareils qui jouent en même temps : chacun son seau,
       aucune écriture concurrente, rien d'écrasé ;
     — et la CARTE sépare le total d'un joueur des dégâts d'une
       bataille précise. Une seule clé sert aux deux.

   LA FUSION reste monotone, commutative, associative et idempotente :
   pour chaque clé on garde le plus grand nombre de dégâts, et
   l'étiquette qui vient avec — à égalité de dégâts, la plus petite
   dans l'ordre des chaînes, pour que deux clients tranchent pareil.

   Format : « ~seau:nom:carte:dégâts|seau:nom:carte:dégâts ». Le « ~ »
   de tête distingue ce format des deux précédents, qui se relisent
   encore : « nom:dégâts » (le tout premier) et « nom:seau:carte:
   dégâts » (celui d'il y a une heure). Des dégâts gagnés ne se jettent
   pas.
   ---------------------------------------------------------------- */
function nettoieNomScore(n){
  return String(n == null ? "" : n).replace(/[|:~]/g, "").trim().substr(0, 14);
}
function nettoieSeau(s){
  return String(s == null ? "" : s).replace(/[^A-Za-z0-9]/g, "").substr(0, 4);
}
/* La clé d'une contribution : un appareil, une île. Le pseudo n'y est
   pas — c'est tout l'intérêt. */
function cleScore(seau, carte){
  return nettoieSeau(seau) + ":" + (carte | 0);
}
/* tab : { "seau:carte" -> { n:pseudo, g:dégâts } } */
function encodeScores(tab){
  var l = [], k;
  for(k in tab){
    var e = tab[k];
    if(!e) continue;
    var g = Math.max(0, Math.round(e.g || 0));
    if(!g) continue;
    var p = String(k).split(":");
    var seau = nettoieSeau(p[0]);
    var ca = p.length > 1 ? (parseInt(p[1], 10) | 0) : -1;
    l.push({ s:seau, n:nettoieNomScore(e.n), c:ca, g:g });
  }
  /* L'ORDRE EST GRAVÉ, et il suit les CLÉS, jamais les scores : deux
     clients au même état doivent produire exactement la même chaîne,
     sinon ils se republient l'un l'autre sans fin. Trier par score
     ferait changer la chaîne au moindre coup de hache. */
  l.sort(function(a, b){
    return (a.s < b.s ? -1 : a.s > b.s ? 1 : 0) || (a.c - b.c);
  });
  function morceau(e){ return e.s + ":" + e.n + ":" + e.c + ":" + e.g; }
  /* LA COUPE, PAR APPAREIL ET EN OCTETS. On somme par seau, on classe
     les seaux par total, et l'on en garde autant que le budget en
     porte — ENTIERS. L'ordre de départage à total égal est le nom du
     seau : deux clients au même état doivent couper au même endroit,
     sinon ils se republient l'un l'autre sans fin. */
  var cout = {}, total = {}, nb = {}, seaux = [], k2, poids = 0;
  for(var i2 = 0; i2 < l.length; i2++){
    var s2 = l[i2].s, o2 = octetsUtf8(morceau(l[i2])) + 1;   // +1 pour le « | »
    if(cout[s2] === undefined){ cout[s2] = 0; total[s2] = 0; nb[s2] = 0; seaux.push(s2); }
    cout[s2] += o2; total[s2] += l[i2].g; nb[s2]++;
    poids += o2;
  }
  if(poids > SCORES_OCTETS || l.length > SCORES_GARDES){
    seaux.sort(function(a, b){
      return (total[b] - total[a]) || (a < b ? -1 : a > b ? 1 : 0);
    });
    /* Les DEUX bornes valent en même temps : le budget d'octets pour
       le transport, le garde-fou d'entrées pour n'avoir jamais à
       parcourir un tableau démesuré. Un seau qui ne rentre pas dans
       l'une ou l'autre est sauté, et l'on continue : un gros seau ne
       doit pas condamner les suivants, qui tiennent peut-être. */
    var garde = {}, octets = SCORES_OCTETS, places = SCORES_GARDES, pris = 0;
    for(k2 = 0; k2 < seaux.length; k2++){
      var sq = seaux[k2];
      if(cout[sq] > octets || nb[sq] > places) continue;
      garde[sq] = 1;
      octets -= cout[sq];
      places -= nb[sq];
      pris++;
    }
    /* Un seul appareil dont la part dépasse à elle seule le budget :
       on le garde quand même, plutôt que de publier un tableau vide. */
    if(!pris) garde[seaux[0]] = 1;
    l = l.filter(function(e){ return garde[e.s]; });
  }
  if(!l.length) return "";
  return MARQUE_SCORES + l.map(morceau).join("|");
}
/* ----------------------------------------------------------------
   LE PLAFOND D'UN SCORE — la seule borne du côté RÉSEAU.

   Un score arrive sous forme de texte et devient un nombre par un
   parseInt sans filet. Ce nombre entre ensuite dans un compteur dont
   la fusion est un MAXIMUM : ce qui est entré une fois n'en ressort
   jamais. Une chaîne de vingt-et-un chiffres — une main maladroite,
   un octet retourné en route, ou quelqu'un qui s'amuse — s'installait
   donc en tête du classement DÉFINITIVEMENT, et repartait dans
   l'instantané retenu, chez tout le monde.

   Le plafond se DÉDUIT des cartes plutôt que d'être écrit en dur : une
   île plus grosse ajoutée demain ne doit pas se faire tronquer ses
   scores. On additionne les Brasiers des six îles — ils font 96 % des
   dégâts d'une carte —, on multiplie par une marge large, et l'on
   ajoute de quoi couvrir toutes les défenses. Un seau ne peut pas
   contenir davantage, quel que soit le multiplicateur de puissance
   d'un joueur : les dégâts sont bornés aux points de vie retirés.

   On REJETTE plutôt que d'on ne borne : une valeur au-dessus de ce
   plafond n'est pas un score un peu trop grand, c'est une valeur qui
   n'a pas pu être produite en jouant. La ramener à 300 millions
   laisserait le tricheur en tête ; l'écarter le renvoie à ce qu'il a
   vraiment fait. */
var scorePlafond = 0;
function plafondScore(){
  if(scorePlafond) return scorePlafond;
  var m = 0;
  for(var i = 0; i < CARTES.length; i++) m += CARTES[i].pvQG || 0;
  scorePlafond = Math.round(m * 1.5 + 20e6);
  return scorePlafond;
}

function decodeScores(s){
  var out = {};
  if(!s || typeof s !== "string") return out;
  var neuf = s.charAt(0) === MARQUE_SCORES;
  var p = (neuf ? s.substr(1) : s).split("|");
  for(var i = 0; i < p.length; i++){
    if(!p[i]) continue;
    var ch = p[i].split(":"), seau, nom, ca, g;
    if(neuf && ch.length >= 4){
      seau = nettoieSeau(ch[0]); nom = nettoieNomScore(ch[1]);
      ca = parseInt(ch[2], 10) | 0; g = parseInt(ch[3], 10);
    }else if(ch.length >= 4){
      /* FORMAT INTERMÉDIAIRE « nom:seau:carte:dégâts ». */
      nom = nettoieNomScore(ch[0]); seau = nettoieSeau(ch[1]);
      ca = parseInt(ch[2], 10) | 0; g = parseInt(ch[3], 10);
    }else if(ch.length === 2){
      /* TOUT PREMIER FORMAT « nom:dégâts ». Il n'a pas de seau : on
         lui en fabrique un à partir du pseudo, stable et distinct de
         tout seau d'appareil, pour qu'il garde sa place sans jamais
         écraser personne. */
      nom = nettoieNomScore(ch[0]); ca = -1; g = parseInt(ch[1], 10);
      seau = seauHerite(nom);
    }else continue;
    /* « !(g > 0) » écarte déjà NaN et le négatif ; le plafond écarte
       l'impossible par le haut. Les deux bornes encadrent la seule
       valeur du protocole qui entre dans un maximum irréversible. */
    if(!(g > 0) || g > plafondScore()) continue;
    if(!seau) seau = seauHerite(nom);
    var k = seau + ":" + ca;
    var av = out[k];
    if(!av || g > av.g || (g === av.g && nom < av.n)) out[k] = { n:nom, g:g };
  }
  return out;
}
/* Un seau de repli pour les entrées qui n'en avaient pas : quatre
   caractères tirés du pseudo.

   CE COMMENTAIRE AFFIRMAIT DEUX IMPOSSIBILITÉS, et ni l'une ni l'autre
   n'est vraie. Il disait que deux joueurs ne peuvent pas partager ce
   seau, et qu'il ne peut pas tomber sur celui d'un appareil réel « —
   celui-ci vient d'un identifiant tiré au hasard ». Les deux seaux
   sortent en fait du MÊME espace : quatre caractères en base 36, soit
   1 679 616 valeurs. Rien n'interdit une collision, ni entre deux
   pseudos, ni entre un pseudo et un appareil ; c'est simplement rare.

   L'ORDRE DE GRANDEUR, puisqu'il vaut mieux le connaître que
   l'ignorer : sur 1 679 616 valeurs, la probabilité qu'au moins deux
   seaux se rencontrent est d'environ 0,3 % à 100 appareils, 1,2 % à
   200, 7 % à 500. Une collision n'efface rien : les deux appareils
   partagent alors un compteur, et leurs contributions se prennent au
   maximum au lieu de s'additionner — le plus petit des deux scores est
   absorbé par le plus gros.

   On garde quatre caractères quand même, et c'est un choix, pas un
   oubli : élargir le seau CHANGE TOUTES LES CLÉS, donc remet à zéro le
   score de tout le monde, et une migration qui recopierait l'ancien
   seau vers le nouveau ferait compter deux fois — le total d'un joueur
   étant la somme de ses seaux. Le remède coûterait plus cher que le
   mal tant qu'un salon compte quelques dizaines d'appareils. */
function seauHerite(nom){
  var h = graineTexte("hérité:" + (nom || "?")) >>> 0;
  var a = "abcdefghijklmnopqrstuvwxyz0123456789", s = "";
  for(var i = 0; i < 4; i++){ s += a.charAt(h % 36); h = (h / 36) | 0; }
  return s;
}
/* Union clé par clé : le plus grand nombre de dégâts, et l'étiquette
   qui vient avec. À égalité, la plus petite étiquette dans l'ordre des
   chaînes — il faut que deux clients tranchent PAREIL. */
function fusionneScores(a, b){
  var x = decodeScores(a), y = decodeScores(b), k;
  for(k in y){
    var e = y[k], v = x[k];
    if(!v || e.g > v.g || (e.g === v.g && e.n < v.n)) x[k] = { n:e.n, g:e.g };
  }
  return encodeScores(x);
}
/* Le nom courant de chaque seau : celui de sa plus grosse
   contribution. Un appareil qui a changé de pseudo garde donc une
   étiquette stable, et non celle de sa dernière escarmouche. */
function nomsDesSeaux(tab){
  var meilleur = {}, k;
  for(k in tab){
    var seau = String(k).split(":")[0], e = tab[k];
    if(!e || !e.n) continue;
    var m = meilleur[seau];
    if(!m || e.g > m.g || (e.g === m.g && e.n < m.n)) meilleur[seau] = e;
  }
  var out = {};
  for(k in meilleur) out[k] = meilleur[k].n;
  return out;
}
/* Le total de chaque joueur : la somme de tous les seaux qui portent
   son étiquette, toutes cartes confondues. C'est le classement
   PERSISTANT. */
function totalParJoueur(tab){
  var noms = nomsDesSeaux(tab), out = {}, k;
  for(k in tab){
    var seau = String(k).split(":")[0];
    var n = noms[seau];
    if(!n) continue;
    out[n] = (out[n] || 0) + tab[k].g;
  }
  return out;
}
/* Les dégâts d'une BATAILLE. Les entrées du tout premier format
   (carte -1) n'y figurent pas : elles ne savent pas de quelle île
   elles viennent, et l'inventer serait mentir. */
function totalParJoueurCarte(tab, carte){
  var noms = nomsDesSeaux(tab), out = {}, k;
  for(k in tab){
    var p = String(k).split(":");
    if((p[1] | 0) !== (carte | 0)) continue;
    var n = noms[p[0]];
    if(!n) continue;
    out[n] = (out[n] || 0) + tab[k].g;
  }
  return out;
}
/* Le classement d'un tableau { nom -> dégâts }, trié comme partout :
   score décroissant, puis nom, pour que deux appareils affichent le
   même ordre. */
function classementDepuis(par){
  var l = [], k;
  for(k in par) if(par[k] > 0) l.push({ nom:k, g:par[k] });
  l.sort(function(a, b){ return b.g - a.g || (a.nom < b.nom ? -1 : a.nom > b.nom ? 1 : 0); });
  return l;
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
   UNE VOIE D'ÉVÉNEMENT — une progression parallèle à la campagne

   La discipline est celle décrite plus haut, à VOIES_EVT. Lancer,
   c'est e = max(e,f)+1 ; terminer, c'est f = e. Deux compteurs
   monotones décrivent un état qui va et vient : c'est ce qui rend la
   chose fusionnable, et c'est ce qui garantit que dix joueurs qui
   appuient dans la même seconde ne lancent qu'UNE expédition — ils
   calculent tous le même nombre.

   `voieLue` et `voiePosee` sont les deux seuls endroits du programme
   qui connaissent les noms de champs. Tout le reste manipule la forme
   canonique { e, f, d, bl, q, t, mj, mn, b }, où rien ne rappelle plus
   la jungle.
   ================================================================ */
function voieLue(m, P, i){
  var R = reglagesEvt(i >= 0 ? i : carteDeVoie(P));
  m = m || {};
  return {
    e : m[P + "e"] | 0,
    f : m[P + "f"] | 0,
    d : m[P + "d"] || "",
    bl: m[P + "bl"] || "",
    q : m[P + "q"] | 0,
    t : msMonde(m[P + "t"]),
    mj: (m[P + "m"] | 0) || R.minJoueurs,
    mn: m[P + "mn"] | 0,
    b : (m[P + "b"] !== undefined) ? (m[P + "b"] | 0) : R.pvBonus
  };
}
function voiePosee(o, P, v){
  o[P + "e"]  = v.e;  o[P + "f"]  = v.f;
  o[P + "d"]  = v.d;  o[P + "q"]  = v.q;
  o[P + "t"]  = v.t;  o[P + "m"]  = v.mj;
  o[P + "mn"] = v.mn; o[P + "b"]  = v.b;
  o[P + "bl"] = v.bl || "";
  return o;
}
/* Une expédition est-elle en cours sur cette voie ? */
function evenementEnCours(m, P){ return !!m && ((m[P + "e"] | 0) > (m[P + "f"] | 0)); }
/* Le cas particulier de la jungle, gardé sous son nom : c'est celui
   que le reste du programme appelle depuis toujours. */
function jungleEnCours(m){ return evenementEnCours(m, "j"); }
/* Y a-t-il une expédition en cours, n'importe où ? Sert à l'accueil,
   qui doit pouvoir dire « une expédition est partie » sans savoir
   laquelle. */
function carteEvenementEnCours(m){
  for(var k = 0; k < VOIES_EVT.length; k++)
    if(evenementEnCours(m, VOIES_EVT[k].P)) return VOIES_EVT[k].i;
  return -1;
}

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

/* Le réglage administrateur d'une voie, tranché comme meilleurPlan :
   le numéro d'abord, la valeur ensuite. Commutatif, associatif,
   idempotent — c'est ce qui fait converger deux administrateurs qui
   règlent en même temps, au lieu de les faire se réécrire en boucle. */
function meilleurReglage(a, b, P){
  var va = a ? (a[P + "m"] | 0) : 0, na = a ? (a[P + "mn"] | 0) : 0;
  var vb = b ? (b[P + "m"] | 0) : 0, nb = b ? (b[P + "mn"] | 0) : 0;
  if(nb > na) return { mj:vb, mn:nb };
  if(na > nb) return { mj:va, mn:na };
  return vb > va ? { mj:vb, mn:nb } : { mj:va, mn:na };
}
/* Le même, sous son nom d'origine et dans les noms de champs de la
   jungle. */
function meilleurMinJoueurs(a, b){
  var r = meilleurReglage(a, b, "j");
  return { jm:r.mj, jmn:r.mn };
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

/* ================================================================
   LE TOP 3 DE CHAQUE CARTE, GELÉ À SA CHUTE

   Le champion — le premier — voyageait déjà. Ce qui manquait, c'est le
   PODIUM : les trois premiers d'une bataille, figés au moment où le
   Brasier tombe, et gardés jusqu'à ce que cette même île soit
   reconquise. Une carte verrouillée continue donc d'afficher qui l'a
   prise la dernière fois — le verrouillage de progression n'efface pas
   l'histoire.

   Pourquoi un champ à part, plutôt que le classement vivant ? Parce
   que le classement vivant appartient à la CAMPAGNE en cours : il
   repart à zéro à chaque remise à zéro du salon, et il ne saurait rien
   dire d'une île tombée au cycle précédent. Le podium gelé, lui,
   survit — comme le champion, et pour la même raison.

   Format : « carte:numéro:nom:dégâts:nom:dégâts:nom:dégâts », les
   cartes séparées par « | ». Le numéro est celui de la victoire, le
   même compteur que le champion : à la fusion, la victoire la plus
   récente l'emporte, et à numéro égal la chaîne tranche — il faut que
   deux clients arrivent au même résultat quel que soit l'ordre.
   ================================================================ */
var TOP3_GARDES = 3;
function encodeTop3(tab){
  var l = [], k;
  for(k in tab){
    var e = tab[k];
    if(!e || !e.l || !e.l.length) continue;
    var bouts = [(k | 0), Math.max(1, e.n | 0)];
    for(var i = 0; i < e.l.length && i < TOP3_GARDES; i++){
      var nom = nettoieNomScore(e.l[i].nom);
      var g = Math.max(0, Math.round(e.l[i].g || 0));
      if(!nom || !g) continue;
      bouts.push(nom, g);
    }
    if(bouts.length < 4) continue;                 // pas même un premier
    l.push(bouts.join(":"));
  }
  /* tri par index de carte : deux clients au même état doivent
     produire exactement la même chaîne */
  l.sort(function(x, y){ return parseInt(x, 10) - parseInt(y, 10); });
  return l.join("|");
}
function decodeTop3(s){
  var out = {};
  if(!s || typeof s !== "string") return out;
  var p = s.split("|");
  for(var i = 0; i < p.length; i++){
    if(!p[i]) continue;
    var m = p[i].split(":");
    if(m.length < 4) continue;
    var idx = parseInt(m[0], 10), n = parseInt(m[1], 10);
    if(!(idx >= 0) || !(n > 0)) continue;
    var l = [];
    for(var j = 2; j + 1 < m.length && l.length < TOP3_GARDES; j += 2){
      var nom = nettoieNomScore(m[j]), g = parseInt(m[j + 1], 10);
      if(!nom || !(g > 0)) continue;
      l.push({ nom:nom, g:g });
    }
    if(!l.length) continue;
    var av = out[idx];
    if(!av || n > av.n) out[idx] = { n:n, l:l };
  }
  return out;
}
/* Par carte, la victoire de plus haut numéro l'emporte. À numéro égal,
   la chaîne tranche : l'ordre d'arrivée ne doit rien changer. */
function fusionneTop3(a, b){
  var x = decodeTop3(a), y = decodeTop3(b), k;
  for(k in y){
    if(!x[k] || y[k].n > x[k].n){ x[k] = y[k]; continue; }
    if(y[k].n === x[k].n){
      var ax = encodeTop3((function(){ var o = {}; o[k] = x[k]; return o; })());
      var ay = encodeTop3((function(){ var o = {}; o[k] = y[k]; return o; })());
      if(ay < ax) x[k] = y[k];
    }
  }
  return encodeTop3(x);
}
/* Le podium gelé d'une carte, ou null si elle n'est jamais tombée. */
function top3DeCarte(s, index){
  var t = decodeTop3(s);
  return t[index | 0] ? t[index | 0].l : null;
}
/* Inscrit un podium pour une carte, en montant d'un cran son numéro de
   victoire. Symétrique d'inscritChampion, et volontairement : les deux
   décrivent la même victoire. */
function inscritTop3(s, index, liste){
  var t = decodeTop3(s);
  var n = (t[index | 0] ? t[index | 0].n : 0) + 1;
  t[index | 0] = { n:n, l:(liste || []).slice(0, TOP3_GARDES) };
  return encodeTop3(t);
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
/* Les voies d'événement se fusionnent À PART, et leur résultat est
   posé dans les TROIS branches de fusionneMonde. C'est indispensable :
   un client peut très bien être en avance sur la campagne et en
   retard sur l'expédition. Si la branche « île plus avancée » rendait
   son instantané tel quel, elle emporterait avec elle une jungle
   périmée — et le verrou de 48 h sauterait chez tout le monde.
   Et comme les voies sont indépendantes ENTRE ELLES, le même
   raisonnement vaut deux fois : on peut être en avance sur la jungle
   et en retard sur les nuits. */
function fusionneVoie(a, b, P, i){
  var va = voieLue(a, P, i), vb = voieLue(b, P, i);
  var mj = meilleurReglage(a, b, P);
  var o = {
    e : Math.max(va.e, vb.e),
    f : Math.max(va.f, vb.f),
    /* t ne redescend jamais : une victoire plus récente écrase
       toujours une plus ancienne, donc personne ne peut raccourcir
       le verrou en republiant un vieil instantané. */
    t : Math.max(va.t, vb.t),
    mj: mj.mj, mn: mj.mn,
    /* Le bonus de PV suit le MÊME numéro de réglage que le minimum de
       joueurs : ils se règlent au même endroit, dans le même panneau,
       donc ils voyagent ensemble. Un seul compteur à tenir.

       À NUMÉRO ÉGAL, C'EST LA PLUS GRANDE VALEUR QUI L'EMPORTE, et
       c'est une correction. La règle d'avant était « si les numéros
       sont à égalité, prends celle de b » — ce qui n'est pas une règle
       mais un ordre d'arrivée. Deux administrateurs qui règlent dans la
       même seconde calculent le même numéro et peuvent poser deux
       valeurs différentes : fusionner A puis B ne donnait alors pas le
       même monde que B puis A, les deux appareils ne convergeaient
       jamais et se republiaient l'un l'autre sans fin. Le maximum,
       lui, est commutatif, associatif et idempotent — exactement comme
       celui que meilleurReglage applique déjà au minimum de joueurs
       deux lignes plus haut. */
    b : (vb.mn > va.mn) ? vb.b : (va.mn > vb.mn) ? va.b : Math.max(va.b, vb.b)
  };
  /* d, bl et q appartiennent à l'époque e, comme d, bl et pv
     appartiennent à cy : une expédition plus récente balaie les
     destructions ET LES BLESSURES de la précédente, qui ne désignent
     plus rien. Les trois voyagent donc toujours ensemble — séparer les
     blessures des morts laisserait des bâtiments à moitié détruits sur
     une expédition toute neuve. */
  if(vb.e > va.e){ o.d = vb.d; o.bl = vb.bl; o.q = vb.q; }
  else if(va.e > vb.e){ o.d = va.d; o.bl = va.bl; o.q = va.q; }
  else{
    o.d = unionBits(va.d, vb.d);
    /* Même règle que pour la campagne : union des deux listes, et le
       plus bas cran par index. Absent veut dire intact. */
    o.bl = fusionneBlessures(va.bl, vb.bl);
    /* à époque égale, les PV ne remontent jamais — sauf quand l'un
       des deux n'a pas encore vu le lancement et porte encore un 0 */
    o.q = (va.q && vb.q) ? Math.min(va.q, vb.q) : (va.q || vb.q);
  }
  return o;
}
/* TOUT l'état d'événement d'un instantané : chaque voie, plus les deux
   champs communs à toutes les cartes. */
function fusionneEvenements(a, b){
  var E = { v:{}, ch:fusionneChampions(a && a.ch, b && b.ch),
                  t3:fusionneTop3(a && a.t3, b && b.t3) };
  for(var k = 0; k < VOIES_EVT.length; k++){
    var V = VOIES_EVT[k];
    E.v[V.P] = fusionneVoie(a, b, V.P, V.i);
  }
  return E;
}
/* Recopie cet état dans un instantané fusionné. */
function poseEvenements(o, E){
  for(var k = 0; k < VOIES_EVT.length; k++){
    var V = VOIES_EVT[k];
    if(E.v[V.P]) voiePosee(o, V.P, E.v[V.P]);
  }
  o.ch = E.ch; o.t3 = E.t3;
  return o;
}
/* Les deux noms d'origine, gardés : la jungle est UN événement, et
   c'est sous ces noms-là que le reste du programme la connaît. */
function fusionneJungle(a, b){
  var E = fusionneEvenements(a, b), j = E.v.j;
  return { je:j.e, jf:j.f, jd:j.d, jbl:j.bl, jq:j.q, jt:j.t,
           jm:j.mj, jmn:j.mn, jb:j.b, ch:E.ch, t3:E.t3 };
}
function poseJungle(o, j){
  voiePosee(o, "j", { e:j.je, f:j.jf, d:j.jd, bl:j.jbl || "", q:j.jq,
                      t:j.jt, mj:j.jm, mn:j.jmn, b:j.jb });
  o.ch = j.ch; o.t3 = j.t3;
  return o;
}

function fusionneMonde(a, b){
  if(!mondeValide(a)) return mondeValide(b) ? b : null;
  if(!mondeValide(b)) return a;
  var ra = rangMonde(a), rb = rangMonde(b);
  var pl = meilleurPlan(a, b);
  /* Le blindage suit son propre numéro, comme le plan : il n'a rien à
     voir avec l'avancée de la campagne. Un client peut très bien être
     en retard sur l'île et en avance sur le réglage. */
  var bd = meilleurBlindage(a, b);
  var jg = fusionneEvenements(a, b);
  /* Une île plus avancée écrase la précédente : ses destructions n'ont
     rien à voir avec celles de la précédente. La jungle, elle, suit sa
     propre voie.

     LE TABLEAU DES DÉGÂTS, LUI, APPARTIENT AU SALON, PAS À L'ÎLE.
     Il l'a suivie tant que le score était jeu.degatsMoi, qui repart
     bien à zéro à chaque île — et ce commentaire disait encore ça.
     Depuis que le total est la SOMME des contributions île par île,
     jeter la table en changeant d'île rouvre exactement le défaut
     qu'on venait de fermer : il suffit qu'un client passe à l'île
     suivante avec une table qui n'a pas encore intégré la dernière
     publication d'un autre, et le score de celui-ci disparaît — pour
     de bon s'il a fermé son navigateur, puisque plus personne ne le
     republie.

     Une CAMPAGNE ou un TIRAGE neufs effacent en revanche bien tout :
     c'est ce que demandent remetSalonAZero, nouveauTirageSalon et
     enregistrePlan, qui publient s:"" avec un cy plus grand. Le
     partage se fait donc là : même guerre, on fusionne ; guerre
     neuve, la plus récente impose sa table. */
  var memeGuerre = (a.cy | 0) === (b.cy | 0) && (a.tg | 0) === (b.tg | 0);
  var sc = memeGuerre ? fusionneScores(a.s, b.s)
                      : ((rb > ra) ? (b.s || "") : (a.s || ""));
  if(rb > ra) return poseEvenements({ v:Math.max(a.v, b.v) + 1, cy:b.cy | 0, c:b.c, pv:b.pv,
                       d:b.d || "", bl:b.bl || "", g:b.g || "", w:b.w || "",
                       p:pl.p, pn:pl.pn, tg:b.tg | 0, s:sc, k:b.k || "",
                       bd:bd.bd, bn:bd.bn }, jg);
  if(ra > rb){
    /* Le raccourci « return a » perdrait un plan plus récent au profit
       d'une île plus avancée : on ne renvoie a tel quel que si c'est
       bien son plan qui l'emporte — ET si b n'apporte rien à la
       jungle, dont l'état est indépendant de l'avancée de campagne,
       ni au tableau des dégâts, qui ne l'est pas davantage. */
    if(pl.p === (a.p || "") && pl.pn === (a.pn | 0) && memeEvenements(a, jg) &&
       bd.bd === (a.bd || "") && bd.bn === (a.bn | 0) &&
       sc === (a.s || "")) return a;
    return poseEvenements({ v:a.v, cy:a.cy | 0, c:a.c, pv:a.pv, d:a.d || "",
             bl:a.bl || "", g:a.g || "", w:a.w || "", p:pl.p, pn:pl.pn, tg:a.tg | 0,
             s:sc, k:a.k || "", bd:bd.bd, bn:bd.bn }, jg);
  }
  return poseEvenements({
    v : Math.max(a.v, b.v),
    cy: a.cy | 0,
    c : a.c,
    pv: Math.min(a.pv, b.pv),
    d : unionBits(a.d, b.d),
    /* LES BLESSURES : union des deux listes, le plus bas cran par
       index. Absent veut dire intact, donc l'union suffit — et le
       minimum garantit qu'aucune fusion ne rend de la vie. */
    bl: fusionneBlessures(a.bl, b.bl),
    /* Gégé et Tweety ne meurent qu'une fois : le premier nom inscrit
       y reste, quel que soit l'ordre d'arrivée des messages. */
    g : a.g || b.g || "",
    w : a.w || b.w || "",
    /* et les trois chats de Mily non plus */
    k : fusionneChats(a.k, b.k),
    /* le meilleur score de chacun survit à sa déconnexion */
    s : sc,
    p : pl.p, pn: pl.pn, tg: a.tg | 0,
    bd: bd.bd, bn: bd.bn
  }, jg);
}
/* L'instantané a-t-il déjà exactement cet état d'événements fusionné ?
   Sert au raccourci « return a » de fusionneMonde : sans lui, une île
   plus avancée emporterait avec elle des voies périmées. */
function memeEvenements(m, E){
  if((m.ch || "") !== E.ch || (m.t3 || "") !== (E.t3 || "")) return false;
  for(var k = 0; k < VOIES_EVT.length; k++){
    var V = VOIES_EVT[k], u = E.v[V.P];
    if(!u) continue;
    var w = voieLue(m, V.P, V.i);
    /* les blessures comptent comme le reste : sans cette comparaison,
       une défense qu'on vient d'entamer en expédition ne rendrait pas
       l'instantané « sale », et personne ne la verrait jamais */
    if(w.e !== u.e || w.f !== u.f || w.d !== u.d || w.q !== u.q ||
       w.bl !== (u.bl || "") ||
       w.t !== u.t || w.mj !== u.mj || w.mn !== u.mn || w.b !== u.b) return false;
  }
  return true;
}
/* Le même, dans les noms de champs de la jungle. */
function memeJungle(m, j){
  return memeEvenements(m, { v:{ j:{ e:j.je, f:j.jf, d:j.jd, bl:j.jbl || "", q:j.jq,
                                     t:j.jt, mj:j.jm, mn:j.jmn, b:j.jb } },
                             ch:j.ch, t3:j.t3 });
}
/* Deux instantanés décrivent-ils le même monde ? Sert à n'republier
   que lorsqu'on apporte réellement du nouveau — sans quoi deux clients
   se renverraient l'instantané en boucle. */
function memeMonde(a, b){
  if(!mondeValide(a) || !mondeValide(b)) return false;
  return rangMonde(a) === rangMonde(b) && a.pv === b.pv &&
         (a.d || "") === (b.d || "") && (a.bl || "") === (b.bl || "") &&
         (a.g || "") === (b.g || "") &&
         (a.w || "") === (b.w || "") && (a.s || "") === (b.s || "") &&
         (a.k || "") === (b.k || "") &&
         /* sans ces deux-là, un plan modifié ne serait jamais republié */
         (a.p || "") === (b.p || "") && (a.pn | 0) === (b.pn | 0) &&
         /* ni un blindage : le réglage doit partir sur le réseau à la
            seconde où on le change, c'est toute la demande */
         (a.bd || "") === (b.bd || "") && (a.bn | 0) === (b.bn | 0) &&
         /* ni un champion, ni un podium */
         (a.ch || "") === (b.ch || "") && (a.t3 || "") === (b.t3 || "") &&
         /* ni un lancement d'expédition, sur AUCUNE des voies : sans
            cette boucle, une carte événement neuve serait muette — son
            lancement ne serait jamais republié, donc personne d'autre
            ne la verrait partir */
         memeVoies(a, b);
}
function memeVoies(a, b){
  for(var k = 0; k < VOIES_EVT.length; k++){
    var V = VOIES_EVT[k];
    var x = voieLue(a, V.P, V.i), y = voieLue(b, V.P, V.i);
    if(x.e !== y.e || x.f !== y.f || x.d !== y.d || x.q !== y.q ||
       x.t !== y.t || x.mj !== y.mj || x.mn !== y.mn || x.b !== y.b) return false;
  }
  return true;
}

/* Précision dégressive de la crible (réglage fin §5.3) */
function mitraTouche(distance, tirage){
  if(distance <= EQ.MITRA_SEUIL_PRECISION) return true;
  return tirage < EQ.MITRA_CHANCE_LOIN;
}
/*==NOYAU_FIN==*/
