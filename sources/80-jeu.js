/* ================================================================
   LE JEU — état, simulation, combat, capacités
   ================================================================ */

var cam = { px:0, py:0, z:0.5 };
var carte = null;
var jeu = null;
var W = 960, H = 600, dpr = 1;

/* ---------------------------------------------------------------
   Création d'une carte
   --------------------------------------------------------------- */
/* ================================================================
   LES NUAGES, SUR LES SIX CARTES

   Ils n'existaient que sur la jungle : la fabrication était
   conditionnée à la présence de geysers, si bien que jeu.nuages était
   un tableau VIDE sur les cinq îles ordinaires — la dérive tournait à
   vide et le dessin ne trouvait rien. Leur ciel n'avait tout
   simplement rien dedans.

   Deux climats, et ils ne demandent pas les mêmes nuages.

   L'ORAGE : QUATRE, ET ILS VONT VITE. Peu, parce qu'un ciel couvert
   n'est plus une menace, c'est un décor. Des masses qu'on suit du
   regard, c'est une information — celle qui dit où la foudre va
   tomber. Leur vitesse est le DOUBLE de celle d'une troupe : on ne
   distance pas un orage, on ne peut que sortir de son chemin.

   LE BEAU TEMPS : CINQ, ET ILS PRENNENT LEUR TEMPS. Ils ne menacent
   de rien, donc ils n'ont pas à être comptés ni suivis : ils habitent
   le ciel. Plus larges, trois fois plus lents, et ils virent
   mollement — un nuage de beau temps qui filerait aurait l'air d'un
   nuage d'orage sans la couleur.

   Le tirage est Math.random et non le prng de la carte, à dessein :
   le ciel n'appartient pas au terrain, deux joueurs sur la même île
   n'ont pas à voir les mêmes nuages au même endroit.
   ================================================================ */
/* TROIS NUAGES D'ORAGE SONT DEVENUS QUATRE, et c'est une mesure qui
   l'a décidé, pas un goût. Au zoom de jeu on voit environ un cinquième
   de l'île : avec trois masses tirées au hasard sur toute sa surface,
   il n'y a de nuage dans le champ qu'une fois sur deux — donc, une
   fois sur deux, il pleut sans qu'on voie d'où. Un quatrième porte
   cette chance aux trois cinquièmes, et il est un peu plus petit pour
   que la surface d'ombre totale — le seul poste qui se paie au pixel —
   n'augmente presque pas. */
function fabriqueNuages(orage){
  /* DIX NUAGES AU LIEU DE CINQ, sur les îles sans orage. C'est un
     réglage de CIEL, et il faut le dire parce que la mesure a dit le
     contraire de ce qu'on espérait : doubler les nuages ne change
     RIEN à la fréquence des tornades — elles naissent sous eux, mais
     un nuage traverse l'île en deux minutes, si bien que leurs points
     de naissance couvrent déjà toute la carte au bout de quelques
     minutes. Ce qui enfermait la tornade était la marge de bord, pas
     le nombre de nuages.
     On les double quand même : cinq nuages sur une île de cent
     trente-trois cases, c'est un ciel vide — et comme la tornade naît
     sous l'un d'eux, en avoir plus veut dire la voir venir plus
     souvent. L'orage de la jungle garde ses quatre grosses masses :
     elles font trois fois la taille des autres, et dix noieraient
     l'île sous une couverture continue. */
  var n = orage ? 4 : 10;
  var out = [], i;
  for(i = 0; i < n; i++){
    out.push({ gx:Math.random() * PLAGE_X0, gy:Math.random() * GH,
               r:orage ? 9 + Math.random() * 5.5 : 13 + Math.random() * 9,
               cap:Math.random() * 6.2832,
               /* le cap voulu, vers lequel le vrai cap glisse : c'est
                  cette inertie qui donne une dérive erratique plutôt
                  qu'un zigzag mécanique */
               capBut:Math.random() * 6.2832,
               vire:1 + Math.random() * 3,
               v:EQ.NUAGE_VITESSE * (orage ? 0.85 + Math.random() * 0.3
                                           : 0.26 + Math.random() * 0.14),
               ph:i * 2.3 });
  }
  return out;
}

function nouvelleCarte(index, pvConnu){
  /* les panneaux de commande, effacés pendant la séquence finale de
     l'île précédente, reviennent avec la nouvelle */
  var hud = document.getElementById("hud");
  if(hud) hud.classList.remove("fin");
  /* LES BADGES DEVIENNENT DES IMAGES ICI, UNE FOIS. La plaque de nom
     d'un joueur les dessine à chaque image ; sans ce passage, les
     premières secondes de sa présence se joueraient sans badge, le
     temps que le navigateur charge une image de trente-deux pixels. */
  if(typeof prechargeBadges === "function") prechargeBadges();
  /* La carte suit le plan du salon et son tirage courant : c'est ce
     couple, diffusé dans l'instantané retenu, qui garantit que tout le
     monde voit exactement les mêmes défenses. */
  /* planDeCarte tranche : la jungle joue son plan gravé, les cinq îles
     celui du salon. L'éditeur de défenses ne touche donc jamais à la
     carte événement — sa densité est une décision de conception, pas
     un réglage de partie. */
  /* Le compteur de score change d'île AVANT que jeu.degatsMoi ne
     reparte à zéro : ce qu'on a fait sur la précédente est replié
     dans le cumul, et le nouveau départ se pose par-dessus ce que
     CETTE île portait déjà. */
  if(typeof ouvreCarteScore === "function") ouvreCarteScore(index);
  carte = genereCarte(CODE_SALON, index, planDeCarte(index, planSalon), tirageSalon);
  jeu = {
    index:index,
    tps:0,
    qg:{ gx:carte.qg.gx, gy:carte.qg.gy, pv:carte.qg.pvMax, pvMax:carte.qg.pvMax },
    file:new FileDegats(carte.qg.pvMax),
    serieDeg:0,
    batiments:carte.batiments.map(function(b){
      return { t:b.t, gx:b.gx, gy:b.gy, pv:b.pv, pvMax:b.pvMax, e:b.e, n:b.n,
               vivant:1, angle:b.ang, cible:null, prochainTir:0, prochainCiblage:0,
               flash:0, recul:0, chargement:0 };
    }),
    creatures:carte.creatures.map(function(k, i){
      var f = CRE[k.t];
      return { t:k.t, gx:k.gx, gy:k.gy, ox:k.gx, oy:k.gy, pv:f.pv, n:i, teinte:k.teinte,
               phase:i * 0.7, ph:i * 1.31, droite:true, etat:"repos", cible:null,
               prochainTir:0, but:null, minuteur:0, gonfle:0, ang:0,
               /* un panda sur deux est assis à manger : une jungle où
                  tout le monde marche est une jungle en fuite */
               assis:k.assis || 0 };
    }),
    unites:[], projectiles:[], effets:[], crateres:[], flaques:[], glu:[],
    brouillards:[], soin:[], balise:null, poulets:[], cryos:[],
    /* Le bouclier du Brasier : les cinq cellules, leurs câbles, et le
       compte de celles qui tiennent encore. */
    reacteurs:[], cables:[], bouclier:0, boucliercoups:0, boucliertouche:0, coupure:0,
    /* LA JUNGLE. Les trois listes sont vides sur les cinq îles
       ordinaires, et tout le rendu s'appuie sur ce fait : un tableau
       vide ne coûte rien à parcourir. */
    geysers:(carte.geysers || []).map(function(g){
      return nouveauGeyser(g.gx, g.gy, g.sommeil);
    }),
    eclairs:[], prochainEclair:periodeEclair(index) * (0.4 + 0.5 * Math.random()),
    /* Les tornades de flammes des ténèbres, et la terre qu'elles
       laissent en feu derrière elles. Vides ailleurs : c'est
       carteTornades(index) qui décide, et lui seul. La première ne
       tombe pas tout de suite — on doit avoir eu le temps de débarquer
       avant de voir arriver la première. */
    tornades:[], brulures:[],
    /* La foule de la scène d'Ibiza. Vide ailleurs : c'est carteScene()
       qui décide, et elle seule. Elle ne bouge jamais de place — les
       danseurs dansent, ils ne marchent pas — donc rien à mettre à
       jour dans la boucle : leur mouvement est une fonction du temps
       et de leur décalage sur le battement. */
    danseurs:carteScene(index) ? fabriqueDanseurs() : [],
    /* IL N'Y A PLUS DE COMPTE À REBOURS. Les tornades ne naissent plus
       quand un compteur local arrive à zéro — ce compteur était privé,
       donc chaque joueur avait sa propre météo. Elles naissent
       maintenant dans des CRÉNEAUX du temps partagé, et le moteur
       demande à l'horloge quels créneaux sont en cours. Voir l'en-tête
       de 33-tenebres-tornade.js.
       Le champ reste, à zéro, parce qu'une sauvegarde ou un banc plus
       ancien peut encore l'écrire : mieux vaut un champ inerte qu'un
       accès à undefined. */
    prochaineTornade:0,
    /* QUATRE NUAGES D'ORAGE, et ils vont vite.
       Peu, parce qu'un ciel couvert n'est plus une menace : c'est un
       décor. Des masses qu'on peut suivre du regard, c'est une
       information — celle qui dit où la foudre va tomber.
       Leur vitesse est le DOUBLE de celle d'une troupe : on ne
       distance pas un orage, on ne peut que sortir de son chemin. */
    /* le ciel se lit sur l'ÎLE, pas sur le tirage des geysers :
       voir carteOrageuse dans 10-noyau.js */
    nuages:fabriqueNuages(carteOrageuse(index) ? 1 : 0),
    navettes:[],
    energie:EQ.ENERGIE_DEPART, novaDispo:EQ.NOVA_PAR_VIE,
    tueurGege:"", tueurTweety:"",   // les responsables, une fois pour toutes
    messageTweety:0,
    /* Les trois chats de Mily : qui a tué lequel, et la riposte en cours. */
    tueurChats:{ chat:"", chaton:"", chatte:"" },
    /* LA PLUIE D'ÉTOILES. Seuls les vœux POSÉS ont un état — pris ou
       pas pris ; les étoiles en chute sont une fonction du temps et
       n'existent nulle part. Voir 46-nuits-pluie.js. */
    voeux:[], voeuxVus:{}, pluieCreneau:-1,
    vengeance:null,
    usages:{ nova:0, poulets:0, brouillard:0, salve:0, cryo:0, soin:0, balise:0, viper:0,
             speed:0 },
    barges:[],
    bargeSel:0,
    capArmee:null,
    degatsMoi:0,
    /* LA MONTÉE EN PUISSANCE, relue une fois par image et non à chaque
       coup : trois cents tirs par seconde n'ont pas à reparcourir la
       table des paliers. `puissance` multiplie ce que les troupes
       infligent, `palier` sert au visuel et part sur le réseau. */
    /* `rangNova` est le calibre EFFECTIF — barème et verrou de
       chantier réunis ; `novaMerite` est celui que le seul barème
       accorde. Les deux existent parce qu'ils ont chacun une nouvelle
       à annoncer, et qu'elles n'arrivent plus au même moment. */
    puissance:1, palier:0, rangNova:0, novaMerite:0,
    /* LES RELIQUES DU PSEUDO, relues seulement quand elles bougent.
       `multAssaut` multiplie ce que les troupes infligent, `multGarde`
       la vie qu'elles reçoivent à leur création — voir creeUnite. Ce
       sont deux facteurs de plus dans une chaîne qui en portait déjà :
       base × relique × palier de carte, exactement le cumul demandé.
       `millionsVus` est le garde-fou GRATUIT du déclenchement : il se
       lit dans un compteur local, et tant qu'il ne bouge pas on ne
       touche pas au tableau partagé, qui coûte un décodage.
       `reliquesVues` est la VÉRITÉ — le compte partagé — et c'est
       elle qui décide combien de roues doivent tourner. */
    multAssaut:1, multGarde:1, millionsVus:0, reliquesVues:0, roue:null,
    /* SPEED, ET LUI SEUL. On garde une référence directe plutôt que de
       balayer la liste : la zone d'attraction se teste sur CHAQUE
       unité à chaque image, et retrouver le héros à chaque test
       coûterait cent recherches par image pour un objet unique. */
    heros:null, herosNe:0, herosEnRoute:0,
    detruitsMoi:0,
    mort:false, tempsRenfort:0, fantome:null, messageGege:0,
    qgProchaine:6, qgTelegraphe:0, qgForme:0, qgPointsPluie:null,
    vague:null,
    secousse:0,
    fin:null,
    nSuiv:0
  };
  /* composition des barges depuis le briefing */
  for(var i = 0; i < EQ.NB_BARGES; i++){
    jeu.barges.push({ type:compoBarges[i].type, n:compoBarges[i].n, num:i + 1 });
  }
  /* ════════════════════════════════════════════════════════════
     LA NEUVIÈME NAVETTE — CELLE QUI N'EN EST PAS UNE

     « Le héros a une petite barge à lui, il ne prend pas une des huit
     barges. »

     Elle est posée APRÈS les huit, et elle ne leur ressemble en rien :
     on ne la compose pas au briefing, elle ne se consomme pas quand on
     l'emploie, et elle ne coûte pas des places de navette mais de
     l'ÉNERGIE. Elle reste donc en bout de ligne toute la partie —
     grisée tant que le héros est sur le terrain ou que l'Énergie
     manque, dorée dès qu'on peut l'envoyer.
     ════════════════════════════════════════════════════════════ */
  /* Le monde n'est pas neuf : on éteint d'abord les bâtiments que
     l'instantané du salon déclare détruits, et on abaisse les PV du
     Brasier — AVANT construitGrilles(), qui fige les emprises. */
  if(typeof monde !== "undefined" && monde && monde.c === index &&
     (monde.cy | 0) === (typeof cycleSalon === "number" ? cycleSalon : 0)){
    var bitsM = decodeBits(monde.d, jeu.batiments.length);
    for(var q = 0; q < jeu.batiments.length; q++){
      if(bitsM[q]){ jeu.batiments[q].vivant = 0; jeu.batiments[q].pv = 0; }
    }
    /* ET LES BLESSURES, sur ce qui est encore debout — APRÈS le bitmap
       des morts, et seulement sur les survivants. */
    appliqueBlessuresAuJeu(monde.bl);
    /* `monde.pv` compte dans l'échelle d'ORIGINE de la carte : on le
       ramène à la nôtre avant de le comparer, sinon un Brasier réglé
       à cinq millions adopterait les cinquante millions du réseau et
       repartirait intact. */
    jeu.file.adopteMinimum(versEchelleIle(monde.pv, index));
    jeu.qg.pv = jeu.file.pv;
    if(monde.g){
      /* quelqu'un l'a déjà tuée dans ce salon : elle reste morte */
      jeu.tueurGege = String(monde.g).substr(0, 14);
      for(var w = 0; w < jeu.creatures.length; w++)
        if(jeu.creatures[w].t === "belette") jeu.creatures[w].pv = 0;
    }
    if(monde.w){
      jeu.tueurTweety = String(monde.w).substr(0, 14);
      for(var w2 = 0; w2 < jeu.creatures.length; w2++)
        if(jeu.creatures[w2].t === "tweety") jeu.creatures[w2].pv = 0;
    }
    /* Les chats déjà tués dans ce salon le restent — et sans riposte :
       Mily s'est déjà vengée, ce n'est pas à celui qui arrive de payer. */
    if(monde.k){
      jeu.tueurChats = decodeChats(monde.k);
      for(var w3 = 0; w3 < jeu.creatures.length; w3++){
        var kk = jeu.creatures[w3];
        if(jeu.tueurChats[kk.t]) kk.pv = 0;
      }
    }
  }
  /* ================================================================
     ON DÉBARQUE DANS UNE EXPÉDITION DÉJÀ COMMENCÉE

     La campagne vit dans `c`, une expédition dans sa voie — et le test
     ci-dessus, écrit du temps où il n'y avait que la campagne, ne
     pouvait pas la reconnaître : `monde.c` désigne l'île, jamais la
     carte spéciale. Un joueur qui rejoignait une expédition en cours
     bâtissait donc une jungle INTACTE, avec un Brasier plein, pendant
     que les autres se battaient dans les ruines. Chacun sa jungle.

     Mesuré : Roro détruit six défenses, publie ; la voie porte bien
     ses 360 caractères de destructions ; Lu rejoint et les six sont
     DEBOUT chez lui. L'écriture était juste, la lecture n'existait
     nulle part.

     Les destructions, les blessures et les PV du Brasier viennent donc
     de la voie, exactement comme ils viennent de `d`, `bl` et `pv`
     pour la campagne.
     ================================================================ */
  /* même règle qu'appliqueMondeAuJeu : la visite montre la carte
     intacte, l'observation montre l'expédition telle qu'elle est */
  if(typeof monde !== "undefined" && monde && carteSpeciale(index) &&
     !((typeof modeApercu !== "undefined" && modeApercu) &&
       !(typeof modeObserve !== "undefined" && modeObserve)) &&
     typeof voieDeCarte === "function" && voieDeCarte(index) &&
     evenementEnCours(monde, voieDeCarte(index))){
    var ve = voieLue(monde, voieDeCarte(index), index);
    var bitsE = decodeBits(ve.d, jeu.batiments.length);
    for(var qe = 0; qe < jeu.batiments.length; qe++){
      if(bitsE[qe]){ jeu.batiments[qe].vivant = 0; jeu.batiments[qe].pv = 0; }
    }
    appliqueBlessuresAuJeu(ve.bl);
    /* q vaut 0 tant que personne n'a encore publié depuis la carte :
       le Brasier reste alors plein, ce qui est la vérité. */
    if(ve.q){ jeu.file.adopteMinimum(versEchelleIle(ve.q, index)); jeu.qg.pv = jeu.file.pv; }
  }
  /* `pvConnu` vient déjà de chez nous — c'est la vie que l'appelant
     avait sous les yeux, dans notre échelle. Elle ne se convertit pas. */
  if(typeof pvConnu === "number" && pvConnu >= 0 && pvConnu < jeu.qg.pvMax){
    jeu.file.adopteMinimum(pvConnu);
    jeu.qg.pv = jeu.file.pv;
  }
  /* les compteurs réseau appartiennent à la carte, pas à la session :
     des dégâts restés en attente à la chute d'une île étaient recrachés
     dans le premier message de la suivante */
  degatsEnAttente = 0;
  serieReseau = 0;
  construitGrilles();
  construitCables();
  construitContourIle();
  construitSol(carte);
  centreSurPlage();
}

/* ================================================================
   POSER LES BLESSURES SUR LA CARTE

   « Si Roro a détruit un Frelon à cinquante pour cent, pourquoi
   est-ce que j'aurais cent pour cent à redétruire ? »

   Trois endroits en ont besoin, et ils veulent tous exactement la
   même chose : le chargement d'une carte de campagne, le chargement
   d'une expédition en cours, et l'arrivée d'un instantané pendant
   qu'on joue. D'où une seule fonction.

   DEUX RÈGLES, ET ELLES NE SE DISCUTENT PAS.

   `d` GAGNE. Un bâtiment que l'instantané déclare tombé ne peut pas
   être en même temps blessé : on éteint les morts d'abord, et ce qui
   suit ne touche plus qu'aux survivants. Sans cet ordre, une vieille
   blessure ressusciterait un bâtiment détruit avec un point de vie.

   ON NE REND JAMAIS DE VIE. Le cran reçu n'est appliqué que s'il
   descend plus bas que ce qu'on a déjà. C'est ce qui rend l'opération
   monotone, donc rejouable dans n'importe quel ordre, autant de fois
   qu'on veut — la même discipline que `adopteMinimum` pour le Brasier
   et que `unionBits` pour les morts. Un instantané en retard ne peut
   pas défaire le travail d'un instantané en avance.

   Le plancher à 1 PV est l'autre face de la même règle : le cran 0
   veut dire « à l'agonie », pas « mort ». Seule une destruction tue,
   et une destruction passe par `d`.

   ET LES PV RESTENT FRACTIONNAIRES. Les arrondir semblait propre : un
   bâtiment à 537,14 PV valait bien 537. Sauf que 537 sur 720 ne rend
   plus le cran 47 mais le cran 46, et qu'on republie toutes les deux
   secondes — le bâtiment perdait donc de la vie à chaque tour, sans
   que personne ne lui tire dessus. Mesuré : 75,0 → 74,6 → 73,1 %.
   Sans l'arrondi, le cycle se referme sur lui-même dès le premier pas.
   Voir cranBlessure dans 10-noyau.js, qui porte l'autre moitié de la
   correction. Les PV du jeu sont flottants partout ailleurs — les
   dégâts se comptent en points par seconde — donc rien ne réclamait
   cet entier.
   ================================================================ */
/* ================================================================
   LE BLINDAGE CHANGE PENDANT QU'ON JOUE

   « Dès qu'on modifie un paramètre à l'accueil, ça doit directement
   être appliqué sur la map. »

   ON NE REFAIT PAS LA CARTE. La refaire relèverait tout ce qui est
   tombé, effacerait les blessures et rendrait au Brasier une vie
   qu'on lui a prise : ce serait exactement la réinitialisation qu'on
   s'interdit. On MET LES BÂTIMENTS À L'ÉCHELLE, ce qui est la seule
   opération qui garde tout.

   LA FRACTION DE VIE EST L'INVARIANT. Un bâtiment à 40 % reste à
   40 % : on multiplie sa vie maximale ET sa vie courante par le même
   rapport. C'est aussi ce que le réseau enregistre — `cranBlessure`
   range la vie sur soixante-trois crans de la vie MAXIMALE — donc le
   changement ne fait bouger aucune blessure partagée, chez personne.
   Un bâtiment DÉTRUIT reste détruit : sa vie vaut zéro, et zéro fois
   n'importe quoi vaut zéro. On n'a même pas à le traiter à part.

   TROIS CHOSES NE BOUGENT PAS, et ce sont celles de la demande : le
   Brasier (« pas sur le QG »), la cellule à récolter et le réacteur du
   bouclier, dont les 200 000 PV sont annoncés au briefing.

   LE RAPPORT SE CALCULE D'UN FACTEUR À L'AUTRE — (1 + après) sur
   (1 + avant) — et non depuis la vie d'origine, qu'on ne garde nulle
   part. Deux réglages successifs se composent donc, MAIS PAS AU POINT
   PRÈS : chaque passage arrondit, et une suite de réglages peut
   laisser quelques points d'écart avec le calcul direct. Mesuré sur
   mille suites tirées au hasard : jamais plus de trois millièmes de la
   vie d'un bâtiment, et l'aller-retour d'un réglage vers zéro retombe
   exactement sur ses pieds tant que le rapport est simple.
   On ne cherche pas mieux, et il faut dire pourquoi : garder la vie
   d'origine de chaque bâtiment coûterait un champ de plus sur douze
   cents bâtiments, qu'il faudrait faire survivre à chaque
   régénération de carte — beaucoup de mécanique pour trois millièmes
   qu'aucun joueur ne peut voir.
   ================================================================ */
function reblindeLeJeu(index, avant, apres){
  if(!jeu || jeu.index !== index) return 0;
  if((avant | 0) === (apres | 0)) return 0;
  var r = (1 + (apres | 0) / 100) / (1 + (avant | 0) / 100);
  var n = 0;
  for(var i = 0; i < jeu.batiments.length; i++){
    var b = jeu.batiments[i];
    if(b.t === "cellule" || b.t === "reacteur") continue;
    b.pvMax = Math.round(b.pvMax * r);
    b.pv = Math.min(b.pvMax, Math.round(b.pv * r));
    n++;
  }
  if(typeof demandeMajBarres === "function") demandeMajBarres();
  if(typeof message === "function")
    message("Blindage des défenses : " + ((apres | 0) >= 0 ? "+" : "")
            + (apres | 0) + " % — " + n + " défenses remises à l'échelle.");
  return n;
}

/* ================================================================
   ET LE BRASIER, REMIS À L'ÉCHELLE EN PLEINE BATAILLE

   « Si une map en cours fait cinquante millions et que moi je mets
   cinq millions, le pourcentage qui est déjà détruit doit suivre. »

   C'est ici que cette phrase devient du code, et elle tient en une
   multiplication parce que tout le reste a été mis en place pour
   qu'elle y tienne. On multiplie la vie MAXIMALE et la vie COURANTE
   par le même rapport : un Brasier entamé de quarante pour cent reste
   entamé de quarante pour cent.

   ON TOUCHE À `jeu.file` ET PAS SEULEMENT À `jeu.qg`. La file est
   l'autorité — `jeu.qg.pv` n'en est que le reflet, recopié après
   chaque coup. Ne remettre à l'échelle que l'affichage donnerait un
   Brasier qui reprend sa vraie valeur au premier obus suivant, et
   c'est le genre de correction qui passe pour un bogue de réseau.

   RIEN N'EST PUBLIÉ D'INHABITUEL, et c'est le point : l'instantané
   compte la vie du Brasier dans l'échelle d'ORIGINE de la carte (voir
   `versEchelleFiche`), or cette remise à l'échelle ne change pas la
   fraction. Ce qui part sur le réseau après est donc mot pour mot ce
   qui en partait avant. Personne n'a rien à adopter, rien à refuser,
   et la fusion monotone n'a aucune occasion de dire non.
   ================================================================ */
function remetLeBrasierALEchelle(index, avantMax, apresMax){
  if(!jeu || jeu.index !== index) return 0;
  if(!(avantMax > 0) || !(apresMax > 0) || avantMax === apresMax) return 0;
  var r = apresMax / avantMax;
  var part = jeu.file.pvMax > 0 ? (jeu.file.pv / jeu.file.pvMax) : 1;
  jeu.file.pvMax = apresMax;
  jeu.file.pv    = Math.max(0, Math.round(jeu.file.pv * r));
  jeu.qg.pvMax   = apresMax;
  jeu.qg.pv      = jeu.file.pv;
  if(typeof demandeMajBarres === "function") demandeMajBarres();
  if(typeof message === "function")
    message("Santé du Brasier : " + Math.round(apresMax / 1e6 * 10) / 10
            + " M — " + Math.round(part * 100) + " % restant, comme avant.");
  return 1;
}

function appliqueBlessuresAuJeu(chaine){
  if(!jeu || !chaine) return 0;
  var bl = decodeBlessures(chaine), n = 0;
  for(var i in bl){
    var b = jeu.batiments[i | 0];
    if(!b || !b.vivant) continue;
    var pv = b.pvMax * (bl[i] / BLESSURE_CRANS);
    if(pv < b.pv){ b.pv = Math.max(1, pv); n++; }
  }
  return n;
}

/* ---------------------------------------------------------------
   LES CÂBLES DU BOUCLIER
   Chaque cellule électrique est reliée au Brasier par un câble posé
   au sol. On le trace APRÈS construitGrilles() : c'est la carte
   d'occupation qui dit où sont les bâtiments, et le câble doit les
   contourner au lieu de leur passer au travers.
   Le tracé est quasi rectiligne : on avance vers le Brasier, et
   lorsqu'un pas tombe sur un obstacle on cherche le décalage LATÉRAL
   le plus faible qui dégage — d'abord un demi-pas, puis un pas entier,
   jusqu'à trois. Le câble épouse donc le bâtiment et reprend aussitôt
   sa ligne, sans jamais partir en zigzag.
   --------------------------------------------------------------- */
/* Un segment de câble est-il posable ? On échantillonne finement : un
   simple test d'arrivée laisserait le câble traverser un bâtiment de
   part en part pour atterrir libre de l'autre côté. */
var cableDepart = null;          // la cellule d'où part le tracé en cours
function cableLibre(x0, y0, x1, y1){
  var n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.35));
  for(var i = 0; i <= n; i++){
    var f = i / n;
    var x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * f;
    /* le pied du Brasier est forcément « bloqué » : c'est justement là
       qu'on veut arriver. Idem pour l'emprise de la cellule elle-même,
       d'où le câble sort. */
    if(Math.hypot(x - jeu.qg.gx, y - jeu.qg.gy) < RAYON_QG + 2) continue;
    if(cableDepart && Math.hypot(x - cableDepart.gx, y - cableDepart.gy) < 3) continue;
    if(bloque(x, y)) return 0;
  }
  return 1;
}

function construitCables(){
  jeu.reacteurs = [];
  jeu.cables = [];
  var lst = carte.reacteurs || [];
  for(var i = 0; i < lst.length; i++){
    var bat = jeu.batiments[lst[i].n];
    if(!bat || bat.t !== "reacteur") continue;
    jeu.reacteurs.push({ bat:bat, gx:bat.gx, gy:bat.gy, n:i });

    cableDepart = bat;
    var pts = [{ gx:bat.gx, gy:bat.gy }];
    var cx = bat.gx, cy = bat.gy;
    var garde = 0;
    while(Math.hypot(cx - jeu.qg.gx, cy - jeu.qg.gy) > RAYON_QG + 1.2 && garde++ < 700){
      var dx = jeu.qg.gx - cx, dy = jeu.qg.gy - cy;
      var l = Math.hypot(dx, dy) || 1;
      dx /= l; dy /= l;
      var pas = 1.4;
      var nx = cx + dx * pas, ny = cy + dy * pas;
      if(!cableLibre(cx, cy, nx, ny)){
        /* obstacle : on longe. Décalages latéraux croissants, des deux
           côtés, on garde le premier qui dégage — et c'est bien tout le
           SEGMENT qu'on teste, pas seulement son arrivée : sinon le
           câble atterrit à côté du bâtiment en lui passant au travers. */
        var tx = -dy, ty = dx, ok = 0;
        for(var e = 1; e <= 11 && !ok; e++){
          for(var sg = 1; sg >= -1 && !ok; sg -= 2){
            var ex = cx + dx * pas * 0.45 + tx * sg * e * 0.62;
            var ey = cy + dy * pas * 0.45 + ty * sg * e * 0.62;
            if(cableLibre(cx, cy, ex, ey)){ nx = ex; ny = ey; ok = 1; }
          }
        }
        /* dernier recours : reculer perpendiculairement pour se dégager
           d'un cul-de-sac, sinon on passe outre plutôt que boucler */
        if(!ok){
          for(var e2 = 1; e2 <= 8 && !ok; e2++){
            for(var sg2 = 1; sg2 >= -1 && !ok; sg2 -= 2){
              var fx = cx + tx * sg2 * e2 * 0.7 - dx * 0.5;
              var fy = cy + ty * sg2 * e2 * 0.7 - dy * 0.5;
              if(cableLibre(cx, cy, fx, fy)){ nx = fx; ny = fy; ok = 1; }
            }
          }
        }
        if(!ok){ nx = cx + dx * pas; ny = cy + dy * pas; }
      }
      cx = nx; cy = ny;
      pts.push({ gx:cx, gy:cy });
    }
    pts.push({ gx:jeu.qg.gx, gy:jeu.qg.gy });
    /* longueur cumulée : elle sert au rendu pour faire courir
       l'impulsion lumineuse à vitesse constante */
    var lg = 0;
    for(var k = 1; k < pts.length; k++){
      lg += Math.hypot(pts[k].gx - pts[k - 1].gx, pts[k].gy - pts[k - 1].gy);
      pts[k].d = lg;
    }
    pts[0].d = 0;
    jeu.cables.push({ pts:pts, lg:lg, bat:bat, n:i });
  }
  jeu.bouclier = reacteursVivants();
}

/* ---------------------------------------------------------------
   Grilles d'accélération
   --------------------------------------------------------------- */
var occ = null;                 // occupation (bâtiments + bords)
var grilleBat = null;           // index spatial des bâtiments
var GB = 8;                     // taille d'une case d'index
var GBW = 0, GBH = 0;

function construitGrilles(){
  occ = new Uint8Array(GW * GH);
  /* MONDE NEUF, CHAMPS À JETER. Sans cette ligne, la limite d'un
     rebâtissement par image (voir champVers) pourrait servir, le temps
     d'une image, un champ calculé sur l'ÎLE PRÉCÉDENTE : des troupes
     qui contournent des défenses disparues. Le numéro de génération ne
     suffit pas, puisqu'il n'interdit que de RECALCULER, pas de servir. */
  chemins.length = 0;
  var i, j, k;
  /* bords infranchissables */
  for(i = 0; i < GW; i++){
    for(j = 0; j < 2; j++){ occ[j * GW + i] = 1; occ[(GH - 1 - j) * GW + i] = 1; }
  }
  for(j = 0; j < GH; j++){ occ[j * GW] = 1; occ[j * GW + 1] = 1; }
  /* emprises des bâtiments */
  /* un bâtiment déjà tombé (instantané du salon adopté avant la
     construction de la grille) ne doit pas continuer à barrer
     le passage */
  jeu.batiments.forEach(function(b){ if(b.vivant) marqueEmprise(b, 1); });
  /* ================================================================
     L'EMPRISE DU BRASIER EST RONDE, COMME LUI

     Elle était un carré de treize cases de côté. Le Brasier, lui, est
     rond : c'est `RAYON_QG` qui dit où les troupes s'arrêtent, et tout
     le jeu mesure les distances à son bord circulaire. Les COINS du
     carré débordaient donc de deux cases et demie au-delà de sa vraie
     emprise, et ils débordaient dans les quatre diagonales — juste là
     où les troupes voulaient se placer.

     MESURÉ : quarante-quatre pour cent de l'anneau de tir du PYR-120
     autour du Brasier était infranchissable, vingt-huit pour cent de
     celui du TX-90. Les véhicules ne pouvaient donc pas faire le tour
     de l'objectif : ils s'entassaient sur les quatre arcs libres, et
     les derniers arrivés restaient dehors. C'est la moitié de ce que
     le joueur a vu, et ce n'était pas un défaut de placement — c'était
     un mur invisible en forme de carré autour d'une tour ronde.

     Un disque au rayon du Brasier libère l'anneau entier sans laisser
     personne entrer dans ses murs. La marge tient les troupes à
     distance de sa base peinte, rien de plus.

     CETTE GRILLE NE SERT QU'À MARCHER. Elle est bâtie au lancement à
     partir de la carte, ne repart jamais sur le réseau et n'entre pas
     dans le tableau des bâtiments : la changer ne déplace pas une
     seule défense et ne touche pas à l'index de la campagne.
     ================================================================ */
  var rq = RAYON_QG + 0.2, rq2 = rq * rq, dqx, dqy;
  for(i = -7; i <= 7; i++) for(j = -7; j <= 7; j++){
    dqx = (jeu.qg.gx + i | 0) + 0.5 - jeu.qg.gx;
    dqy = (jeu.qg.gy + j | 0) + 0.5 - jeu.qg.gy;
    if(dqx * dqx + dqy * dqy > rq2) continue;
    var x = (jeu.qg.gx + i) | 0, y = (jeu.qg.gy + j) | 0;
    /* le Brasier compte comme un corps de plus, il n'écrase plus la
       case : une défense posée sous sa jupe garde la sienne */
    if(x >= 0 && x < GW && y >= 0 && y < GH && occ[y * GW + x] < 250) occ[y * GW + x]++;
  }
  /* index spatial */
  GBW = Math.ceil(GW / GB); GBH = Math.ceil(GH / GB);
  grilleBat = [];
  for(k = 0; k < GBW * GBH; k++) grilleBat.push([]);
  jeu.batiments.forEach(function(b){
    var cx = Math.min(GBW - 1, Math.max(0, (b.gx / GB) | 0));
    var cy = Math.min(GBH - 1, Math.max(0, (b.gy / GB) | 0));
    grilleBat[cy * GBW + cx].push(b);
  });
}
/* Chaque fois qu'une emprise change, les champs de distance déjà
   calculés deviennent périmés : une défense tombée OUVRE un passage
   qu'ils ne connaissent pas. On ne les recalcule pas tout de suite —
   ils se refont à la demande — mais on marque qu'ils ont vieilli. */
var GEN_CHEMIN = 0;
/* ════════════════════════════════════════════════════════════════
   L'EMPRISE EST UN DISQUE, ET C'ÉTAIT UN CARRÉ TROP GRAND

   « Une défense est visuellement implantée sur une case carrée, mais
   il ne faut pas considérer toute cette case comme absolument
   infranchissable. Une troupe doit pouvoir raser une défense et
   passer presque en file indienne sur son côté. »

   CE QUI SE PASSAIT, MESURÉ SUR LES TÉNÈBRES. La boucle balayait de
   floor(gx − e/2) à ceil(gx + e/2) − 1. Sur un bâtiment dont le
   centre tombe sur un entier — c'est le cas de presque tous — une
   emprise de trois cases murait QUATRE cases de côté, soit SEIZE
   cases pour un objet dont le rayon solide vaut 1,26. Il y a
   six cent soixante-six bâtiments d'emprise trois sur cette île.

   Résultat : 14 239 cases murées sur 20 672, SOIXANTE-NEUF POUR CENT
   DE LA CARTE. Et le vide restant n'était pas d'un seul tenant — il
   était brisé en poches sans communication : depuis une balise posée
   au milieu de l'île, 545 cases seulement étaient atteignables sur
   6 433 libres, et le point de débarquement n'en faisait pas partie.

   IL N'Y AVAIT DONC PAS DE DÉTOUR : IL N'Y AVAIT PAS DE CHEMIN. Tout
   ce que le joueur voit — les troupes qui s'écartent, qui piétinent,
   qui repartent de travers — n'était que le comportement de repli
   d'un pathfinding à qui l'on demandait l'impossible.

   LE DISQUE, ET SON RAYON N'EST PAS INVENTÉ. `e × 0,42` est le rayon
   solide que TOUT LE RESTE du jeu emploie déjà : c'est à cette
   distance que les troupes s'arrêtent pour tirer (voir rayonCible),
   c'est lui qui borne le cratère et le souffle. La grille de marche
   disait autre chose que le reste du programme ; elle dit maintenant
   la même chose. Les coins se libèrent — c'est-à-dire exactement les
   diagonales par lesquelles on passe — et le côté d'une défense
   redevient franchissable.

   C'EST LA MÊME CORRECTION QUE CELLE DÉJÀ FAITE POUR LE BRASIER,
   trente lignes plus haut, et pour la même raison écrite noir sur
   blanc : « les coins du carré débordaient de deux cases et demie
   au-delà de sa vraie emprise ». Elle n'avait jamais été appliquée
   aux mille deux cents défenses.

   ON COMPTE AU LIEU DE MARQUER. Deux disques peuvent se recouvrir ;
   avec un drapeau, la chute de l'un rouvrait les cases de l'autre et
   les troupes traversaient un bâtiment debout. La case porte donc le
   NOMBRE de corps qui l'occupent, et zéro veut toujours dire libre.
   ════════════════════════════════════════════════════════════════ */
var EMPRISE_SOLIDE = 0.42;          // le même rayon que rayonCible
function marqueEmprise(b, v){
  GEN_CHEMIN++;
  var r = b.e * EMPRISE_SOLIDE, r2 = r * r;
  var i0 = Math.floor(b.gx - r), i1 = Math.ceil(b.gx + r);
  var j0 = Math.floor(b.gy - r), j1 = Math.ceil(b.gy + r);
  var pose = 0;
  for(var i = i0; i <= i1; i++){
    for(var j = j0; j <= j1; j++){
      if(i < 0 || i >= GW || j < 0 || j >= GH) continue;
      var dx = i + 0.5 - b.gx, dy = j + 0.5 - b.gy;
      if(dx * dx + dy * dy > r2) continue;
      var c = j * GW + i;
      if(v > 0){ if(occ[c] < 250) occ[c]++; }
      else if(occ[c] > 0) occ[c]--;
      pose++;
    }
  }
  /* UNE EMPRISE NE PEUT PAS ÊTRE VIDE. Une cellule énergétique
     d'emprise un a un rayon de 0,42 : si son centre tombe pile sur un
     coin de case, aucun centre de case n'est dans le disque et le
     bâtiment ne bloquerait rien — on marcherait au travers. On mure
     alors sa case, et une seule. */
  if(!pose){
    var ci = b.gx | 0, cj = b.gy | 0;
    if(ci >= 0 && ci < GW && cj >= 0 && cj < GH){
      var cc = cj * GW + ci;
      if(v > 0){ if(occ[cc] < 250) occ[cc]++; }
      else if(occ[cc] > 0) occ[cc]--;
    }
  }
}
function bloque(gx, gy){
  var i = gx | 0, j = gy | 0;
  if(i < 0 || i >= GW || j < 0 || j >= GH) return gx < 0 || gy < 0 || gy >= GH;
  return occ[j * GW + i] !== 0;
}

/* ================================================================
   LES CHAMPS DE DISTANCE, EN CACHE

   Un champ coûte un balayage des vingt mille cases : c'est peu, mais
   pas à chaque image et pas par troupe. On les garde donc par CASE DE
   BUT — et c'est ce qui rend l'affaire gratuite, parce que douze
   troupes qui visent le même bâtiment partagent le même champ, et que
   toutes celles qui suivent la même balise n'en font qu'un.

   HUIT AU PLUS, et le plus vieux cède sa place. Huit buts distincts en
   même temps, c'est déjà plus que ce qu'une île offre ; au-delà, le
   coût du calcul reviendrait moins cher que la mémoire immobilisée.

   ET ILS SE REFONT QUAND UNE DÉFENSE TOMBE, parce qu'elle ouvre un
   passage : le numéro de génération le dit, et le champ se rebâtit à
   la première demande d'après. On ne recalcule pas au moment de la
   destruction — ce serait payer pour des buts que plus personne ne
   vise.
   ================================================================ */
/* ════════════════════════════════════════════════════════════════
   LE DÉGAGEMENT, CALCULÉ UNE FOIS PAR ÉTAT DE GRILLE

   Deux balayages sur vingt mille cases : moins cher qu'un seul champ
   de chemin, et il sert à TOUS les gabarits. On le refait quand une
   défense tombe — elle élargit un couloir, et c'est justement ce que
   le dégagement doit savoir.
   ════════════════════════════════════════════════════════════════ */
var degOcc = null, degGen = -1;
function degagementCourant(){
  if(degGen !== GEN_CHEMIN || !degOcc){
    degOcc = champDegagement(occ, GW, GH);
    degGen = GEN_CHEMIN;
  }
  return degOcc;
}
/* Ce qu'il faut à cette troupe. Une Furie ne paie jamais rien —
   aucune case libre n'est trop étroite pour elle. */
function degagementDeType(t){
  var f = UNI[t];
  return degagementRequis((f && f.rayon) || 0.4);
}

var CHEMIN_MAX = 8;
var chemins = [];                 // { cle, dm, champ, gen, vu }
var cheminHorloge = 0;
/* UN SEUL REBÂTISSEMENT PAR IMAGE, et c'est une mesure qui l'impose.
   Une défense qui tombe périme les huit champs d'un coup ; s'ils sont
   tous redemandés dans la même image, on les refait tous dans la même
   image. Mesuré sur un assaut de 150 s aux ténèbres : 78 champs
   rebâtis, dont 15 images en RAFALE, la pire en refaisant sept — de
   quoi tenir ici, et de quoi faire un à-coup visible sur une tablette,
   quinze fois par assaut.

   Servir un champ d'une image en retard ne coûte rien : la troupe le
   relit à l'image suivante, et une défense tombée n'ouvre jamais qu'un
   passage — le chemin d'avant reste praticable, il est seulement un
   peu plus long pendant un seizième de seconde.

   ET LA RÈGLE VAUT AUSSI POUR UN BUT ENCORE INCONNU, faute de quoi
   elle ne bornait rien : trente troupes qui attaquent trente bâtiments
   différents demandent trente champs neufs, qu'aucun cache ne peut
   servir. On a d'abord cru à un cache trop petit, et agrandi de huit à
   vingt-quatre entrées : 85 rebâtissements devenaient 63, la pire
   rafale restait de quatre, et l'on payait un mégaoctet. Ce n'était
   pas la taille du cache, c'était le nombre de buts. On rend donc null
   — la troupe marche en ligne droite pour cette image-là, comme avant,
   et reçoit son champ à la suivante. Une demi-seconde au pire pour que
   trente troupes soient servies. */
var cheminImage = -1;
/* LE CACHE EST DÉSORMAIS PAR (BUT, GABARIT), et il le fallait : deux
   gabarits ne suivent plus le même chemin, donc ils ne peuvent plus
   partager le même champ. Les fantassins se ramènent tous au même
   `dm` — leur exigence est identique et jamais contraignante —, donc
   cent Furies continuent de n'en demander qu'un seul. */
function champVers(bx, by, dm){
  var i = bx | 0, j = by | 0;
  if(i < 0 || i >= GW || j < 0 || j >= GH) return null;
  dm = dm | 0;
  var cle = j * GW + i, k, e;
  for(k = 0; k < chemins.length; k++){
    e = chemins[k];
    if(e.cle !== cle || e.dm !== dm) continue;
    if(e.gen === GEN_CHEMIN){ e.vu = ++cheminHorloge; return e.champ; }
    /* périmé : on le sert tel quel si l'image a déjà bâti le sien */
    if(cheminImage === jeu.tps) return e.champ;
    break;
  }
  if(cheminImage === jeu.tps) return null;   // rien à servir, et l'image est prise
  cheminImage = jeu.tps;
  var champ = champDepuis(occ, GW, GH, i, j, degagementCourant(), dm);
  if(k < chemins.length){                    // on remplace le périmé
    chemins[k] = { cle:cle, dm:dm, champ:champ, gen:GEN_CHEMIN, vu:++cheminHorloge };
    return champ;
  }
  if(chemins.length >= CHEMIN_MAX){
    var vieux = 0;
    for(k = 1; k < chemins.length; k++) if(chemins[k].vu < chemins[vieux].vu) vieux = k;
    chemins.splice(vieux, 1);
  }
  chemins.push({ cle:cle, dm:dm, champ:champ, gen:GEN_CHEMIN, vu:++cheminHorloge });
  return champ;
}
/* La direction à prendre pour se rapprocher du but en CONTOURNANT ce
   qu'il y a entre les deux. Rend null quand il n'y a rien à contourner
   — près du but, ou si le but est inatteignable —, et l'appelant
   reprend alors la ligne droite : c'est elle qui porte l'éventail
   d'arrivée, et il ne faut pas la lui enlever. */
var DIR_CHEMIN = { x:0, y:0 };
/* JUSQU'OÙ LA TROUPE REGARDE AVANT DE SE POSER LA QUESTION. Trop court,
   elle marche dans le mur et ne fait appel au champ qu'au contact ;
   trop long, le champ reprend la main dès qu'un bâtiment traîne à
   l'horizon et l'on retrouve le coude en terrain dégagé. Douze cases
   valent la largeur d'un pâté de défenses et de sa ruelle. */
var CHEMIN_VUE = 12;
/* ET UNE FOIS QU'ELLE CONTOURNE, ELLE S'Y TIENT UN INSTANT.
   Sans ce délai, la vue se dégage et se rebouche d'une image à l'autre
   pendant qu'on longe un pâté : la troupe rend alternativement la
   ligne droite et le champ, et chaque bascule est un coup de barre.

   MESURÉ SUR LA TRAVERSÉE DES TÉNÈBRES, 259 cases de chemin praticable.
   Le balayage de la tenue, de zéro à deux secondes, donne une pente
   régulière et sans surprise : plus on tient, moins on braque. Sur ce
   balayage, RIEN D'AUTRE NE BOUGE — douze arrivées sur douze partout,
   détour 0,99 partout, 258 secondes partout. La tenue n'achète que du
   lissage, elle ne coûte ni un pas ni une seconde.

   Aux 1,2 s retenues, et face à la version qui n'avait que le champ :

                     virage total    arrivées   détour   durée
     le champ seul    692° / 471°      12/12      0,99    257 s
     corrigé          858° / 566°      12/12      0,99    258 s
                    (commando / furie)

   Il reste donc un cinquième de braquage en plus, et c'est le prix
   honnête de l'alternance : on redresse vers le but à chaque fois que
   la vue se dégage. Sans la tenue, ce prix était de moitié.

   ELLE NE RAMÈNE PAS LE DÉFAUT, et c'était la crainte : la part
   d'images passées PLEIN AXE reste à zéro pour cent jusqu'à deux
   secondes de tenue, contre 61 % avec le champ seul. C'est logique —
   la tenue ne s'arme QU'APRÈS avoir vu un obstacle, donc pendant un
   contournement réel, jamais en terrain dégagé.

   On prend 1,2 s : l'essentiel du lissage, et la moitié de
   l'engagement de deux secondes — assez pour dépasser le coin qu'on
   contourne, assez peu pour ne pas s'entêter devant une ouverture. */
var CHEMIN_TENUE = 1.2;
function capChemin(u, bx, by, dLoin){
  /* TROP PRÈS, ON NE PLANIFIE PLUS. Les dernières cases se font en
     ligne droite : c'est là que l'éventail écarte la troupe autour de
     son objectif, et un champ de distance ramènerait tout le monde sur
     la même case. */
  if(dLoin < 3){ u.contourneJusque = 0; return null; }
  /* LA VUE DIRECTE PASSE AVANT LE CHAMP. Tant que rien ne barre le
     segment, on y va tout droit : c'est ce que fait l'œil, et c'est ce
     que le champ ne sait pas faire (voir `voieLibre` dans le noyau —
     sa vague ne distingue pas la droite du coude, et la troupe partait
     plein axe). Dès qu'un bâtiment entre dans sa vue, le champ reprend
     la main — et le garde `CHEMIN_TENUE` secondes, le temps de dépasser
     le coin au lieu de rebasculer à l'image suivante. */
  if(!((u.contourneJusque || 0) > jeu.tps)){
    if(voieLibre(occ, GW, GH, u.gx, u.gy, bx, by, Math.min(CHEMIN_VUE, dLoin))){
      u.contourneJusque = 0;
      return null;
    }
    u.contourneJusque = jeu.tps + CHEMIN_TENUE;
  }
  var champ = champVers(bx, by, degagementDeType(u.t));
  if(!champ) return null;
  var v = pasVersLeBut(champ, occ, GW, GH, u.gx, u.gy);
  if(v < 0) return null;
  /* on vise le CENTRE de la case voisine : viser son coin ferait
     raser les murs et accrocher les angles */
  DIR_CHEMIN.x = (v % GW) + 0.5 - u.gx;
  DIR_CHEMIN.y = ((v / GW) | 0) + 0.5 - u.gy;
  return DIR_CHEMIN;
}

/* ════════════════════════════════════════════════════════════════
   SERRER LA COLONNE — SANS RALENTIR PERSONNE

   « Elles doivent avoir une direction générale commune ; ensuite les
   unités se répartissent légèrement autour de cette trajectoire. Un
   gros groupe devrait occuper soixante-dix pour cent du diamètre du
   brouillard au maximum. »

   D'OÙ VIENT LA LARGEUR. Mesurée à cent Furies sur la diagonale des
   ténèbres : seize cases et demie, deux fois le brouillard. La
   séparation seule n'en explique que sept — cent Furies à 0,68 de
   distance tiennent dans un disque de sept cases. Les dix autres
   viennent de la ROUTE : deux unités séparées d'une case ne
   descendent pas forcément la même pente du champ, et l'écart, une
   fois pris, ne se rattrape jamais.

   ON NE TIRE QUE DE CÔTÉ, et c'est toute l'astuce. Une attraction
   vers le centre du groupe freinerait les premières et pousserait les
   dernières — le groupe avancerait au rythme du milieu. On projette
   donc le rappel sur la PERPENDICULAIRE à la marche : il resserre la
   colonne sans qu'aucune unité y perde une seule case d'avance.

   ET IL NE S'ARME QU'AU-DELÀ DU RAYON DE FORMATION : à l'intérieur,
   la séparation fait déjà son travail, et deux forces contraires sur
   la même paire ne produiraient qu'un frisson.
   ════════════════════════════════════════════════════════════════ */
/* LE PLANCHER EST PHYSIQUE, ET IL EST MESURÉ. Cent Furies séparées de
   0,68 case tiennent au mieux dans un disque de 7,1 cases de diamètre
   — soit 85 % du brouillard. Les 70 % demandés valent 5,9 cases : ils
   sont hors d'atteinte à CENT unités, quelle que soit la force du
   rappel ; ils le sont en revanche pour un groupe ordinaire, et c'est
   ce que règle FORMATION_PART_SURFACE.

   LA FORCE A ÉTÉ CHOISIE PAR BALAYAGE, pas au jugé. Cent Furies sur
   la diagonale des ténèbres :
     rappel   largeur   détour   virage    bloquées
      aucun     16,5     ×1,10    21 100°     0
      0,55      13,1     ×1,12    24 900°     0
      0,80      12,0     ×1,14    35 500°     0
      1,35      12,1     ×1,24    53 400°     7
   Au-delà de 0,55 on paie le virage — c'est-à-dire le dandinement
   qu'on voit à l'écran — pour une case et demie de largeur, et à 1,35
   la colonne se met à se gêner elle-même. On prend 0,55 : trois cases
   et demie de moins qu'avant, et rien de perdu. */
var COL_RAPPEL = 0.55;              // part du rappel latéral reprise
var COL_SEUIL  = 1.00;              // … et il s'arme à cette part du rayon
var colX = 0, colY = 0, colN = 0, colTps = -1;
function centreColonne(){
  /* une fois par image, et pour tout le monde : les troupes d'un même
     joueur marchent ensemble, c'est ce centre-là qui les rassemble */
  if(colTps === jeu.tps) return colN;
  colTps = jeu.tps; colX = 0; colY = 0; colN = 0;
  for(var i = 0; i < jeu.unites.length; i++){
    var u = jeu.unites[i];
    if(u.pv <= 0) continue;
    colX += u.gx; colY += u.gy; colN++;
  }
  if(colN){ colX /= colN; colY /= colN; }
  return colN;
}
var COL_DIR = { x:0, y:0 };
function serreLaColonne(u, vx, vy){
  COL_DIR.x = vx; COL_DIR.y = vy;
  if(centreColonne() < 8) return COL_DIR;         // un petit groupe n'a rien à serrer
  var ex = colX - u.gx, ey = colY - u.gy;
  var d = Math.hypot(ex, ey), rf = rayonFormation() * COL_SEUIL;
  if(d <= rf || d < 1e-6) return COL_DIR;
  var l = Math.hypot(vx, vy);
  if(l < 1e-6) return COL_DIR;
  /* la part du rappel qui est PERPENDICULAIRE à la marche */
  var ux = vx / l, uy = vy / l;
  var proj = ex * ux + ey * uy;
  var px = ex - ux * proj, py = ey - uy * proj;
  var pl = Math.hypot(px, py);
  if(pl < 1e-6) return COL_DIR;
  /* l'excédent au-delà du rayon dit la force, plafonnée à une
     demi-case de correction par pas : au-delà, on verrait braquer */
  var trop = Math.min(1, (d - rf) / rf);
  var g = COL_RAPPEL * trop * l / pl;
  COL_DIR.x = vx + px * g;
  COL_DIR.y = vy + py * g;
  return COL_DIR;
}

/* Index spatial des unités, reconstruit à chaque image */
var grilleUni = null, GU = 4, GUW = 0, GUH = 0;
function construitGrilleUnites(){
  GUW = Math.ceil((GW + 12) / GU); GUH = Math.ceil(GH / GU);
  if(!grilleUni || grilleUni.length !== GUW * GUH){
    grilleUni = [];
    for(var k = 0; k < GUW * GUH; k++) grilleUni.push([]);
  }else{
    for(var m = 0; m < grilleUni.length; m++) grilleUni[m].length = 0;
  }
  function range(u){
    var cx = Math.min(GUW - 1, Math.max(0, (u.gx / GU) | 0));
    var cy = Math.min(GUH - 1, Math.max(0, (u.gy / GU) | 0));
    grilleUni[cy * GUW + cx].push(u);
  }
  for(var i = 0; i < jeu.unites.length; i++) range(jeu.unites[i]);
  /* les poulets entrent dans la grille : les défenses les prennent
     pour des troupes et gaspillent leurs munitions dessus */
  for(var k2 = 0; k2 < jeu.poulets.length; k2++) range(jeu.poulets[k2]);
}
/* ---------------------------------------------------------------
   SÉPARATION LOCALE
   L'ancre de formation étale le groupe à l'approche ; la séparation
   l'empêche de s'empiler une fois arrivé — à l'arrêt, en train de
   tirer, ou tassé contre un mur.

   Grille dédiée, de maille égale au diamètre de confort : une unité
   n'a donc que ses huit cases voisines à consulter. Tri par comptage
   dans des tableaux typés réutilisés d'une image à l'autre — aucune
   allocation par image, et le coût suit le nombre de voisines réelles,
   pas l'effectif total.
   --------------------------------------------------------------- */
var sepDebut = null, sepTete = null, sepOrdre = null, sepW = 0, sepH = 0;
var sepX = null, sepY = null, sepR = null, sepPx = null, sepPy = null;

function reserveSeparation(n){
  if(sepX && sepX.length >= n) return;
  var cap = Math.max(256, n * 2);
  sepX = new Float32Array(cap); sepY = new Float32Array(cap);
  sepR = new Float32Array(cap);
  sepPx = new Float32Array(cap); sepPy = new Float32Array(cap);
  sepOrdre = new Int32Array(cap);
}

function separeUnites(dt){
  var lst = jeu.unites, n = lst.length;
  if(n < 2) return;
  reserveSeparation(n);
  var maille = EQ.SEPARATION_MAILLE;
  var w = Math.ceil(GW / maille) + 1;
  if(sepW !== w){
    sepW = w; sepH = Math.ceil(GH / maille) + 1;
    sepDebut = new Int32Array(sepW * sepH + 1);
    sepTete = new Int32Array(sepW * sepH);
  }
  var nc = sepW * sepH, i, c;
  sepDebut.fill(0); sepTete.fill(0);
  var serre = serreSelonEffectif(n);

  /* copie plate + comptage par case */
  var rayonMax = 0;
  for(i = 0; i < n; i++){
    var u = lst[i];
    /* ALLIÉE GÊNANTE, JAMAIS ALLIÉE-MUR. « Je préfère largement un
       léger chevauchement visuel à un tank qui reste bloqué derrière
       un autre tank. » Une unité qui n'avance plus depuis une seconde
       rentre donc son rayon : ses voisines la traversent presque, le
       bouchon se défait, et elle le retrouve dès qu'elle repart. */
    sepX[i] = u.gx; sepY[i] = u.gy;
    sepR[i] = UNI[u.t].rayon * serre * ((u.figeT || 0) > FIGE_MOU ? FIGE_SEP : 1);
    if(sepR[i] > rayonMax) rayonMax = sepR[i];
    sepPx[i] = 0; sepPy[i] = 0;
    var cx = (u.gx / maille) | 0, cy = (u.gy / maille) | 0;
    if(cx < 0) cx = 0; else if(cx >= sepW) cx = sepW - 1;
    if(cy < 0) cy = 0; else if(cy >= sepH) cy = sepH - 1;
    u.sepC = cy * sepW + cx;
    sepDebut[u.sepC + 1]++;
  }
  for(c = 0; c < nc; c++) sepDebut[c + 1] += sepDebut[c];
  for(i = 0; i < n; i++){
    c = lst[i].sepC;
    sepOrdre[sepDebut[c] + sepTete[c]] = i;
    sepTete[c]++;
  }

  /* Portée de recherche, en CASES DE GRILLE. Deux unités se repoussent
     jusqu'à sepR[i] + sepR[j] ; il faut donc balayer assez de cases
     pour que la plus grosse paire possible se voie. Une fenêtre 3×3
     fixe suffisait tant que toutes les troupes tenaient dans la maille
     — avec l'Ogre, deux d'entre eux s'ignoraient dès qu'ils n'étaient
     pas dans des cases voisines, et ils se traversaient. La fenêtre ne
     s'élargit QUE si une grosse unité est sur le terrain : sans Ogre,
     rayonMax vaut 0,42 et on retombe exactement sur l'ancien 3×3. */
  var portee = Math.max(1, Math.ceil((rayonMax * 2) / maille));

  /* répulsion : chaque paire traitée une seule fois (j > i) */
  for(i = 0; i < n; i++){
    var cx0 = lst[i].sepC % sepW, cy0 = (lst[i].sepC / sepW) | 0;
    for(var jy = cy0 - portee; jy <= cy0 + portee; jy++){
      if(jy < 0 || jy >= sepH) continue;
      for(var jx = cx0 - portee; jx <= cx0 + portee; jx++){
        if(jx < 0 || jx >= sepW) continue;
        var cc = jy * sepW + jx;
        for(var k = sepDebut[cc]; k < sepDebut[cc + 1]; k++){
          var j = sepOrdre[k];
          if(j <= i) continue;
          var dx = sepX[i] - sepX[j], dy = sepY[i] - sepY[j];
          var conf = sepR[i] + sepR[j];
          var d2 = dx * dx + dy * dy;
          if(d2 >= conf * conf) continue;
          var d = Math.sqrt(d2);
          if(d < 1e-4){
            /* exactement superposées : on les sépare sur un axe stable */
            var a = (i * ANGLE_OR) % 6.2832;
            dx = Math.cos(a); dy = Math.sin(a); d = 1;
          }else{ dx /= d; dy /= d; }
          var chev = (conf - d) * 0.5;
          sepPx[i] += dx * chev; sepPy[i] += dy * chev;
          sepPx[j] -= dx * chev; sepPy[j] -= dy * chev;
        }
      }
    }
  }

  /* application, plafonnée pour rester stable quel que soit dt — et
     JAMAIS au-dessus de la vitesse propre de l'unité : une troupe que
     ses voisines déplacent plus vite qu'elle ne marche n'avance plus,
     elle est ballottée. */
  for(i = 0; i < n; i++){
    var px = sepPx[i], py = sepPy[i];
    var l = Math.hypot(px, py);
    if(l < 1e-5) continue;
    var vmax = Math.min(EQ.SEPARATION_VITESSE,
                        UNI[lst[i].t].vitesse * EQ.SEPARATION_PART_VIT) * dt;
    var g = glisseAutourDeSaCible(lst[i], px, py);
    px = g.x; py = g.y;
    l = Math.hypot(px, py);
    if(l < 1e-5) continue;
    if(l > vmax) l = vmax;
    deplace(lst[i], px, py, l);
  }
}

/* ================================================================
   UN VÉHICULE ARRIVÉ NE SE FAIT PLUS POUSSER EN ARRIÈRE : IL GLISSE

   « Il faut voir comment les TX-90 et PYR-120 se placent entre eux :
   il y en a deux bloqués par les autres. »

   MESURÉ AVANT DE TOUCHER À QUOI QUE CE SOIT. Huit chars lâchés au
   pied du Brasier, abords dégagés : tous les huit tirent. Ils ne sont
   donc pas empêchés de combattre. Mais leurs distances à l'objectif
   disent l'autre moitié de l'histoire — 2,79 2,80 4,63 4,84 5,17 5,18
   5,18 5,19 : ils s'entassent tous sur l'arc par lequel ils arrivent,
   et deux se retrouvent poussés DANS un rang plus proche, derrière
   leurs voisins. C'est ce que le joueur a vu.

   POURQUOI. La séparation repousse deux voisins l'un de l'autre selon
   la droite qui les joint. Quand huit véhicules se serrent sur le même
   arc, cette droite est à peu près RADIALE : la poussée les envoie
   donc vers l'objectif ou loin de lui, jamais sur les côtés. Elle
   défait le placement au lieu de le faire.

   CE QU'ON CHANGE. Pour un véhicule DÉJÀ ARRIVÉ à sa distance de tir,
   on retire à la poussée sa composante radiale : il ne lui reste que
   la tangente, c'est-à-dire le tour de l'objectif. Deux véhicules qui
   se gênent s'écartent alors EN TOURNANT autour de leur cible au lieu
   de se chasser vers l'avant ou vers l'arrière. Le cercle de tir se
   garnit tout seul, sans qu'aucun d'eux ait à savoir où sont les
   autres ni à faire le tour exprès.

   RÉSERVÉ AUX VÉHICULES, et pour une raison de forme : ils ont une
   tourelle, donc ils tirent où qu'ils regardent, et glisser sur le
   cercle ne leur coûte pas une seconde de tir. Une troupe à pied doit
   se retourner pour viser ; lui faire faire le tour de l'objectif lui
   coûterait ce qu'elle est venue faire.

   ET SEULEMENT UNE FOIS ARRIVÉE. En approche, la poussée radiale est
   utile : c'est elle qui défait les bouchons dans les couloirs entre
   les défenses. On ne la retire que là où elle nuit.
   ================================================================ */
var GLISSE = { x:0, y:0 };
function glisseAutourDeSaCible(u, px, py){
  GLISSE.x = px; GLISSE.y = py;
  var f = UNI[u.t];
  if(!f || !f.tourelle) return GLISSE;
  /* la cible du moment : celle qu'elle a choisie, ou le Brasier */
  var c = u.cible;
  var cx, cy, rc;
  if(c && c.o){
    cx = c.o.gx; cy = c.o.gy;
    rc = c.k === "bat" ? c.o.e * 0.42 : (c.k === "qg" ? RAYON_QG : 0.3);
  }else{
    cx = jeu.qg.gx; cy = jeu.qg.gy; rc = RAYON_QG;
  }
  var vx = u.gx - cx, vy = u.gy - cy;
  var d = Math.hypot(vx, vy);
  if(d < 1e-4) return GLISSE;
  /* arrivée ? le même critère que la marche, pas un autre */
  if(d - rc > f.arret) return GLISSE;
  vx /= d; vy /= d;
  var radial = px * vx + py * vy;
  var tx = px - radial * vx, ty = py - radial * vy;
  /* ON REND À LA POUSSÉE SA LONGUEUR, ET C'EST INDISPENSABLE.
     Projetée telle quelle, elle perd tout ce qui était radial — c'est-
     à-dire presque tout, puisque des voisins serrés sur un même arc se
     poussent à peu près selon le rayon. Il ne restait qu'un filet de
     tangente, et le cercle se garnissait dix fois trop lentement :
     mesuré, huit chars n'occupaient que quatre-vingt-onze degrés, et
     un PYR-120 perdait même sa place faute de pouvoir s'écarter.
     On garde donc la DIRECTION tangentielle et la FORCE d'origine :
     ils tournent aussi vite qu'ils se repoussaient. */
  var lt = Math.hypot(tx, ty);
  if(lt < 1e-4){
    /* poussée exactement radiale : aucune tangente à garder. On en
       choisit une, stable par unité, plutôt que de la laisser figée —
       deux véhicules parfaitement alignés sur leur cible ne doivent
       pas rester collés pour l'éternité. */
    var s = (bruitStable(u.n, 1) < 0.5) ? 1 : -1;
    tx = -vy * s; ty = vx * s; lt = 1;
  }
  var l0 = Math.hypot(px, py);
  GLISSE.x = tx / lt * l0;
  GLISSE.y = ty / lt * l0;
  return GLISSE;
}

function unitesAutour(gx, gy, r, sortie){
  sortie.length = 0;
  var x0 = Math.max(0, ((gx - r) / GU) | 0), x1 = Math.min(GUW - 1, ((gx + r) / GU) | 0);
  var y0 = Math.max(0, ((gy - r) / GU) | 0), y1 = Math.min(GUH - 1, ((gy + r) / GU) | 0);
  for(var j = y0; j <= y1; j++){
    for(var i = x0; i <= x1; i++){
      var t = grilleUni[j * GUW + i];
      for(var k = 0; k < t.length; k++) sortie.push(t[k]);
    }
  }
  return sortie;
}
function batimentsAutour(gx, gy, r, sortie){
  sortie.length = 0;
  var x0 = Math.max(0, ((gx - r) / GB) | 0), x1 = Math.min(GBW - 1, ((gx + r) / GB) | 0);
  var y0 = Math.max(0, ((gy - r) / GB) | 0), y1 = Math.min(GBH - 1, ((gy + r) / GB) | 0);
  for(var j = y0; j <= y1; j++){
    for(var i = x0; i <= x1; i++){
      var t = grilleBat[j * GBW + i];
      for(var k = 0; k < t.length; k++) if(t[k].vivant) sortie.push(t[k]);
    }
  }
  return sortie;
}

/* ---------------------------------------------------------------
   Débarquement
   --------------------------------------------------------------- */
function centreSurPlage(){
  var p = iso(PLAGE_X0 + 2, GH / 2);
  /* Sur un très grand écran, le plancher peut dépasser 0,62 : mieux vaut
     débarquer au bon zoom que se faire rectifier à la première image. */
  cam.z = Math.max(0.62, zoomPlancher(W, H));
  cam.px = W / 2 - p.x * cam.z;
  cam.py = H / 2 - p.y * cam.z;
}
function centreSur(gx, gy){
  var p = iso(gx, gy);
  cam.px = W / 2 - p.x * cam.z;
  cam.py = H / 2 - p.y * cam.z;
}

/* ---------------------------------------------------------------
   LE DÉBARQUEMENT
   Les troupes n'apparaissent plus par magie à l'intérieur des terres :
   une navette arrive du large, ralentit, accoste, ouvre sa rampe, et
   les soldats en sortent par petits groupes avant de gagner le sable.

   Trois états : "approche" -> "accostage" -> "retrait". Les unités ne
   sont créées qu'une fois la rampe ouverte, à la sortie de la rampe.
   --------------------------------------------------------------- */
/* Le rivage JOUABLE n'est pas PLAGE_X0 (première colonne de sable, à
   140) mais le bord est de la grille : deplace() borne les unités à
   GW - 0.5, et le sable mouillé de matiereCase() commence vers GW - 6.
   La navette accoste donc là où est vraiment l'eau — c'est ce décalage
   de onze cases qui faisait « apparaître » les troupes en pleine terre. */
/* Le contour visible de l'île s'arrête à GW + 2.2 (traceIle, dilatation
   2.2) : la navette flotte donc juste au-delà du sable, et le pied de
   sa rampe retombe sur la dernière case praticable — deplace() borne
   les unités à GW - 0.5, une troupe créée plus à l'est serait recalée
   d'un coup sec. */
var RIVAGE_GX = GW + 1.6;      // la navette flotte : elle s'arrête DANS l'eau
var RAMPE_GX  = GW - 0.6;      // pied de rampe : dernière case où l'on marche

var NAV = {
  DEPART      : 13.0,   // cases au large : elle arrive franchement du large
  APPROCHE    : 1.0,    // s pour rallier le rivage, quelle que soit la distance
  RAMPE       : 0.40,   // s pour abaisser la rampe
  CADENCE     : 0.075,  // s entre deux soldats qui sortent
  PAUSE       : 0.30,   // s avant de repartir
  RETRAIT     : 2.4     // s de marche arrière avant disparition
};

function poseBarge(gx, gy){
  /* EN VISITE, ON REGARDE — ON NE DÉBARQUE PAS. L'île n'est pas encore
     ouverte : y poser des troupes donnerait une bataille dont rien ne
     serait retenu, ni les dégâts, ni le champion, ni la progression.
     Mieux vaut le dire tout de suite que le laisser découvrir après
     coup.
     EN ESSAI, SI. C'est exactement la porte que l'essai ouvre, et la
     seule : rien de ce qui suit ne sortira davantage de l'appareil
     qu'en visite — tous les robinets restent commandés par
     `modeApercu`, qui reste levé. Voir modeEssai dans 85-reseau.js. */
  if(typeof modeApercu !== "undefined" && modeApercu
     && !(typeof modeEssai !== "undefined" && modeEssai))
    return message((typeof modeObserve !== "undefined" && modeObserve)
      ? "Observation : tu regardes la bataille, tu n'y débarques pas."
      : "Visite : tu peux tout regarder, mais pas débarquer ici.");
  if(jeu.mort) return message("Ta flotte est perdue, attends le renfort.");
  var b = jeu.barges[jeu.bargeSel];
  if(!b) return message("Plus aucune navette.");
  /* ════════════════════════════════════════════════════════════
     LE CLIC DIT DEUX CHOSES, ET NON PLUS UNE

     Il disait seulement OÙ LE LONG DU RIVAGE : le gx était jeté, la
     navette se posait sur RIVAGE_GX et les troupes partaient à
     l'assaut depuis le pied de la rampe. Toutes les barges arrivaient
     donc au même endroit, et l'on ne pouvait pas étaler un
     débarquement.

     Il dit maintenant AUSSI JUSQU'OÙ ELLES AVANCENT avant de se battre.
     La navette accoste toujours au bord de l'eau — elle flotte, c'est
     la seule chose qu'elle sache faire — mais elle emporte un POINT DE
     RALLIEMENT, et ses douze soldats y marchent avant de reprendre
     l'assaut. Huit barges, huit points : une au tout début de la plage,
     une devant la première défense, comme demandé.

     ET LE POINT EST BORNÉ À LA BANDE DE SABLE. Voir DEBARQ_GX_MIN et
     DEBARQ_GX_MAX dans le noyau : du pied de la rampe à la frontière de
     la première défense. Un point posé plus loin ferait de chaque
     débarquement une Balise gratuite, et la capacité Balise — qui, elle,
     coûte de l'énergie et emmène TOUT LE MONDE en profondeur — n'aurait
     plus de raison d'être. ════════════════════════════════════════ */
  gy = borne(gy, DEBARQ_GY_MIN, DEBARQ_GY_MAX);
  var ralGx = borne(gx, DEBARQ_GX_MIN, DEBARQ_GX_MAX);
  var gxA = RIVAGE_GX;
  jeu.navettes.push({
    type:b.type, reste:b.n, sortis:0,
    /* le point de ralliement voyage avec la navette : c'est elle qui le
       transmet à chaque soldat qui descend la rampe */
    ral:{ gx:ralGx, gy:gy },
    gx:gxA + NAV.DEPART, gy:gy, gxA:gxA, gx0:gxA + NAV.DEPART,
    etat:"approche", rampe:0, minuteur:0, tangage:Math.random() * 6.2832,
    n:jeu.nSuiv++,
    /* IL EMBARQUE SUR LA PREMIÈRE NAVETTE DE LA VIE, et sur elle
       seule. Le drapeau est posé ICI plutôt que lu à l'accostage :
       deux navettes envoyées coup sur coup accosteraient toutes deux
       avant que la première n'ait fait naître le héros, et il serait
       descendu deux fois. */
    avecHeros:(jeu.herosNe ? 0 : (jeu.herosEnRoute ? 0 : (jeu.herosEnRoute = 1)))
  });
  jeu.barges.splice(jeu.bargeSel, 1);
  if(jeu.bargeSel >= jeu.barges.length) jeu.bargeSel = Math.max(0, jeu.barges.length - 1);
  demandeMajBarres();
  son.debarque();
  /* ET CE PASSAGE COMPTE COMME UNE PARTIE JOUÉE. C'est ICI qu'on le
     note, et pas à l'entrée sur la carte : ouvrir une île pour la
     regarder n'est pas y jouer, et c'est justement la distinction que
     la page des passages doit savoir faire. La navette qui accoste,
     elle, ne laisse aucun doute. La fonction ne republie qu'une fois
     par visite — les navettes suivantes ne diraient rien de plus. */
  if(typeof noteQueJeJoue === "function") noteQueJeJoue(jeu.index);
}

function majNavettes(dt){
  for(var i = jeu.navettes.length - 1; i >= 0; i--){
    var v = jeu.navettes[i];
    v.tangage += dt * 2.4;
    if(v.etat === "approche"){
      /* Une seconde du large au rivage, pas une de plus : la course est
         interpolée dans le TEMPS et non à vitesse constante. La courbe
         part vite et se pose en douceur — elle ralentit donc bien en
         approchant du sable, sans jamais allonger l'attente. */
      v.minuteur += dt;
      var t = Math.min(1, v.minuteur / NAV.APPROCHE);
      var e = 1 - (1 - t) * (1 - t) * (1 - t);        // sortie cubique
      v.gx = v.gx0 + (v.gxA - v.gx0) * e;
      if(t >= 1){
        v.gx = v.gxA;
        v.etat = "accostage";
        v.minuteur = 0;
        son.rampe();
      }
      continue;
    }
    if(v.etat === "accostage"){
      v.minuteur += dt;
      v.rampe = Math.min(1, v.minuteur / NAV.RAMPE);
      if(v.rampe < 1) continue;
      /* les soldats sortent en file, pas tous d'un bloc */
      var du = v.minuteur - NAV.RAMPE;
      var voulus = Math.min(v.reste, Math.floor(du / NAV.CADENCE) + 1);
      while(v.sortis < voulus){
        sortDeNavette(v);
        v.sortis++;
      }
      if(v.sortis >= v.reste && du > v.reste * NAV.CADENCE + NAV.PAUSE){
        /* LE HÉROS DESCEND EN DERNIER, derrière ses passagers : la
           rampe est libre, et on le voit arriver au lieu de le
           découvrir noyé dans la file. */
        if(v.avecHeros && !jeu.herosNe) faitDebarquerHeros(v);
        v.etat = "retrait";
        v.minuteur = 0;
      }
      continue;
    }
    /* retrait : elle repart au large, rampe relevée */
    v.minuteur += dt;
    v.rampe = Math.max(0, 1 - v.minuteur / NAV.RAMPE);
    v.gx += (2.2 + v.minuteur * 4.0) * dt;
    if(v.minuteur > NAV.RETRAIT) jeu.navettes.splice(i, 1);
  }
}

/* Un soldat descend la rampe : il naît au pied de celle-ci, un peu
   devant la coque, avec une petite dispersion latérale. La séparation
   locale et l'ancre de formation font le reste dès la frame suivante. */
function sortDeNavette(v){
  var k = v.sortis;
  var lat = ((k % 5) - 2) * 0.34 + (bruitStable(v.n * 31 + k, 0) - 0.5) * 0.30;
  var av = (k % 3) * 0.30;
  var x = RAMPE_GX - av, y = v.gy + lat;
  /* si le pied de rampe est encombré, on décale le long du rivage */
  for(var essai = 0; essai < 8 && bloque(x, y); essai++){
    y += (essai % 2 ? 1 : -1) * 0.42 * (essai + 1);
    x = RAMPE_GX - av;
  }
  if(bloque(x, y)){ x = RAMPE_GX; y = v.gy; }
  var u = creeUnite(v.type, borne(x, 0.6, GW - 0.6), borne(y, 0.6, GH - 0.6));
  /* LE POINT DE RALLIEMENT DE SA BARGE. On ne le pose que s'il vaut la
     peine d'être marché : cliquer au ras de l'eau, c'est débarquer
     comme avant, et une unité qui naît déjà sur son point n'a rien à
     faire de l'ordre. */
  if(u && v.ral && Math.hypot(v.ral.gx - u.gx, v.ral.gy - u.gy) > EQ.BALISE_RAYON)
    u.ral = v.ral;
  return u;
}
function creeUnite(type, gx, gy){
  var f = UNI[type];
  var n = jeu.nSuiv++;
  var an = ancreFormation(n);
  /* LA RELIQUE DE GARDE ÉPAISSIT LA TROUPE À SA NAISSANCE, et c'est le
     seul endroit où elle a besoin d'exister : la barre de vie, les
     soins du Doc, les vulnérabilités et la mort lisent tous `pvMax`,
     et n'ont donc rien à apprendre. Une troupe déjà au sol quand la
     relique monte garde la vie qu'elle avait — on ne soigne pas
     rétroactivement, on débarque plus solide. */
  var pv = Math.round(f.pv * jeu.multGarde);
  jeu.unites.push({
    t:type, gx:gx, gy:gy, pv:pv, pvMax:pv, n:n,
    /* place stable dans le disque unité : c'est elle qui donne au
       groupe sa surface au lieu d'un empilement sur un point */
    ancX:an.x, ancY:an.y, sepC:0,
    phase:Math.random() * 6.2832, var:(Math.random() * 3) | 0, droite:false,
    cible:null, prochainCiblage:Math.random() * EQ.PERIODE_CIBLAGE,
    prochainTir:0, tir:0, brulure:0, ralenti:0, ralentiType:"", vitMod:1,
    /* Ordre de Balise, STRICTEMENT individuel : il vaut l'identifiant
       de la balise tant que CETTE unité ne l'a pas atteinte, et 0
       ensuite. Une unité qui débarque pendant qu'une balise est active
       reçoit l'ordre elle aussi. */
    baliseOrdre:(jeu && jeu.balise) ? jeu.balise.id : 0,
    baliseMeilleure:1e9, baliseStagne:0, cote:0,
    /* Seuil d'enlisement propre à chaque unité. Deux voisines collées
       au même mur cesseraient de progresser à la même image ; avec un
       seuil identique elles se libéreraient ensemble, ce qui ressemble
       à une libération de groupe.
       Le seuil est LARGE — sept à onze secondes — parce que c'est un
       dernier recours, pas un mode de fonctionnement. À trois secondes
       il se déclenchait dès qu'une troupe longeait un bâtiment, et une
       bonne moitié du groupe abandonnait la Balise en chemin pour
       tirer sur ce qui passait. */
    baliseSeuil:7.0 + Math.random() * 4.0,
    /* LE DÉTECTEUR D'ENLISEMENT, COMMUN À TOUTES LES BRANCHES.
       `figeX/figeY` est le témoin de position, `figeT` le temps écoulé
       depuis qu'elle s'en est éloignée d'un demi-pas. Il ne mesure PAS
       « est-ce que je me rapproche du but » — une troupe qui contourne
       un bâtiment ne s'en rapproche pas pendant tout le contournement,
       et c'est exactement ce qui faisait renoncer tout le monde. Il
       mesure « est-ce que je bouge », ce qui est la seule question à
       laquelle un blocage réponde non. */
    figeX:gx, figeY:gy, figeT:0,
    pousse:{ x:0, y:0 },
    /* LES CINQ CHAMPS DU CHAR. Ils ne coûtent rien aux autres troupes
       — cinq nombres par unité — et les avoir ici plutôt que créés à
       la volée évite la classe cachée qui change en cours de partie.
         angBase / angTour  les deux caps, lissés vers capBase / capTour
         chenille           la distance parcourue : c'est elle, et pas
                            l'horloge, qui fait défiler les maillons
         recul / flash      le départ du coup, qui retombe vers zéro */
    angBase:0, angTour:0, capBase:0, capTour:0,
    chenille:0, recul:0, flash:0, roule:0, gxP:gx, gyP:gy,
    /* SOUS L'AILE DU HÉROS, et sa vitesse vue. Le premier est relu par
       la marche, la cadence de tir et le dessin ; la seconde ne sert
       qu'aux traits de vitesse de Speed lui-même.

       `auraReste` EST LE COMPTE À REBOURS DE SON AURA, et non de sa
       vie. « Speed ne doit pas apparaître et disparaître : il
       débarque avec nous, il a une santé, c'est comme une troupe en
       plus. » Il est donc là du débarquement à sa mort, comme
       n'importe qui ; ce qui dure dix secondes, c'est le DOPAGE, et
       c'est cela seul que ce compteur mesure. À zéro, il court
       toujours — il n'accélère plus personne. */
    auraReste:0,
    dope:0, vitVue:0, escorte:null,
    escX:undefined, escY:0, escorteVue:null, capEX:0, capEY:0,
    /* L'INTERCEPTEUR : son cap, son départ de charge, et LE COMPTEUR
       qui décide. Une roquette de Frelon sur deux — le compteur, pas
       un tirage au sort : voir UNI.tank dans 10-noyau.js. */
    angInter:0, capInter:0, viseeInter:0, interFlash:0, interCompte:0
  });
  return jeu.unites[jeu.unites.length - 1];
}

/* ================================================================
   LE CAP D'UNE UNITÉ

   Pour presque toutes, c'est un booléen : elle regarde à gauche ou à
   droite, et son dessin est retourné. Le Tank est le premier qui ait
   besoin d'un VRAI angle — et même de deux, parce que sa tourelle
   pointe la défense qu'il vise pendant que sa caisse suit sa route.

   L'angle est celui de la GRILLE, pas de l'écran : l'isométrie est
   appliquée au moment du dessin (voir ptT dans 61-tank.js). Le
   convertir ici reviendrait à le convertir deux fois.

   `marche` dit si l'unité avance. À l'arrêt, la caisse GARDE le cap
   où elle s'est immobilisée — un char arrêté ne pivote pas sur place
   pour rien —, mais la tourelle continue de suivre sa cible. C'est
   précisément cet écart-là qu'on veut voir.
   ================================================================ */
function capUnite(u, dx, dy, marche){
  u.droite = (dx - dy) > 0;
  if(!UNI[u.t].tourelle) return;
  u.capTour = Math.atan2(dy, dx);
  if(marche) u.capBase = u.capTour;
}
/* Le même, quand la direction de MARCHE diffère de la direction de
   VISÉE : la troupe aborde son objectif en éventail, donc elle ne
   marche pas exactement vers lui. */
function capMarcheUnite(u, dx, dy){
  if(!UNI[u.t].tourelle) return;
  if(dx || dy) u.capBase = Math.atan2(dy, dx);
}

/* ================================================================
   UN VÉHICULE SOUS BALISE TIRE QUAND MÊME SUR LES BESTIOLES

   « Que ce soit le TX-90 ou le PYR-120, quand elles sont guidées par
   une balise elles peuvent quand même tirer sur toutes les petites
   bêtes qui viennent les attaquer durant leur avancée. »

   POURQUOI C'ÉTAIT INTERDIT, ET POURQUOI ÇA NE L'EST PLUS.

   Deux règles se croisaient ici, chacune bonne pour sa raison.

   La première : sous balise, on MARCHE. Une troupe qui s'arrête pour
   tirer n'arrive jamais, et une balise qui n'amène personne ne sert à
   rien — d'où le `u.cible = null` de la marche.

   La seconde : un char ne perd pas son temps avec ce qui ne peut pas
   le blesser. Le TX-90 est immunisé aux bestioles (vuln.bete = 0), le
   PYR-120 aussi ; s'arrêter quatre secondes pour tuer au canon un
   piqueur qui ne leur fait rien pendant qu'une tour de guet leur prend
   deux cent vingt-quatre points par balle, c'est le pire des échanges.

   OR LES DEUX RAISONS TIENNENT AU MÊME MOT : « s'arrêter ». Et un
   véhicule ne s'arrête pas pour tirer — il a DEUX caps. La caisse
   continue vers la balise, seule la tourelle tourne. Le tir est donc
   littéralement gratuit : il ne coûte ni une seconde de marche, ni un
   pas de retard. Ce qui rendait la règle juste a disparu.

   Et il rapporte : les bestioles ne peuvent rien contre le blindé,
   mais elles peuvent beaucoup contre les Furies qui avancent derrière
   lui. Un char qui balaie la vermine en roulant protège le groupe
   sans rien lui coûter — c'est exactement le rôle qu'on lui demande.

   RÉSERVÉ AUX VÉHICULES, et le drapeau `tourelle` le dit : une troupe
   à pied n'a qu'un cap, elle devrait s'arrêter et se tourner, donc
   pour elle la première règle vaut toujours.
   ================================================================ */
function betePresVehicule(u, f){
  var meilleure = null, md = f.portee, k, cr, d;
  for(k = 0; k < jeu.creatures.length; k++){
    cr = jeu.creatures[k];
    if(cr.pv <= 0) continue;
    d = Math.hypot(cr.gx - u.gx, cr.gy - u.gy);
    if(d < md){ md = d; meilleure = cr; }
  }
  return meilleure;
}
/* Rend 1 si la tourelle s'occupe d'une bestiole : l'appelant sait
   alors qu'il ne doit PAS réécrire le cap de l'arme par-dessus. */
function tirBeteEnMarche(u, f, dt, cachee){
  if(!f.tourelle) return 0;
  var cr = betePresVehicule(u, f);
  if(!cr) return 0;
  u.capTour = Math.atan2(cr.gy - u.gy, cr.gx - u.gx);
  /* Sous Brouillard on vise sans tirer, comme partout ailleurs. */
  if(cachee){ armeSansTirer(u); return 1; }
  u.prochainTir -= dt * 1000;
  if(u.prochainTir > 0) return 1;
  /* et il ne tire pas de travers : la tourelle doit être en ligne */
  if(!tankAligne(u)){ u.prochainTir = 0; return 1; }
  u.prochainTir = f.cadence;
  u.tir = 1;
  tireUnite(u, { gx:cr.gx, gy:cr.gy }, { k:"cre", o:cr });
  return 1;
}

/* ================================================================
   LE CHAR, D'UNE IMAGE À L'AUTRE

   Trois choses, et elles tiennent en quinze lignes parce qu'elles
   sont toutes les trois des mesures et non des décisions.

   LES CHENILLES SE LISENT SUR LE DÉPLACEMENT RÉEL, pas sur une
   horloge. On mesure de combien l'unité a bougé depuis l'image
   précédente : un char à l'arrêt a des chenilles à l'arrêt, un char
   englué les fait défiler au ralenti, un char poussé par un sanglier
   les fait défiler aussi. Aucune de ces trois situations n'aurait été
   juste avec un compteur de temps, et il aurait fallu y penser trois
   fois.

   LES DEUX CAPS SONT LISSÉS, à deux vitesses différentes. La tourelle
   balaye vite — deux tours par seconde et demie —, la caisse manœuvre
   lentement : c'est ce contraste, et lui seul, qui fait sentir qu'il
   y a deux pièces et non une.

   LE RECUL ET LA LUEUR retombent vers zéro. Ils sont posés à 1 au
   départ du coup, dans tireUnite.
   ================================================================ */
var TANK_TOURELLE = 2.6;      // rad/s : la tourelle balaye
var TANK_CAISSE   = 1.5;      // rad/s : la caisse manœuvre
var TANK_INTER    = 4.2;      // rad/s : l'intercepteur, le plus vif des trois
var TANK_ALIGNE   = 0.13;     // rad : au-delà, le canon n'est pas en ligne
var TANK_VEILLE   = 0.55;     // rad/s : le balayage de veille de l'intercepteur
function majTank(u, dt){
  /* LE DÉPLACEMENT RÉEL, mesuré. Vingt-six pixels par case : c'est la
     demi-largeur d'une tuile, donc l'unité dans laquelle le dessin du
     char est exprimé (voir ptT dans 61-tank.js). */
  var d = Math.hypot(u.gx - u.gxP, u.gy - u.gyP);
  u.chenille += d * 26;
  /* la vitesse lissée : elle sert à lever la poussière derrière les
     chenilles, et un simple d/dt sautillerait d'une image à l'autre */
  u.roule += ((dt > 0 ? d / dt : 0) - u.roule) * Math.min(1, dt * 8);
  u.gxP = u.gx; u.gyP = u.gy;
  u.angTour += borne(ecartAngulaire(u.capTour, u.angTour), -TANK_TOURELLE * dt, TANK_TOURELLE * dt);
  u.angBase += borne(ecartAngulaire(u.capBase, u.angBase), -TANK_CAISSE * dt, TANK_CAISSE * dt);
  /* L'INTERCEPTEUR. Il n'a de cap désigné que le temps d'une
     interception ; le reste du temps il BALAYE — lentement, dans le
     même sens, sans jamais s'arrêter. C'est ce balayage de veille qui
     dit qu'il est allumé, et c'est ce qui rend son brusque
     braquage lisible quand une roquette arrive. */
  if(u.capInter) u.angInter += borne(ecartAngulaire(u.capInter, u.angInter),
                                     -TANK_INTER * dt, TANK_INTER * dt);
  else u.angInter += TANK_VEILLE * dt;
  if(u.recul > 0) u.recul = Math.max(0, u.recul - dt * 3.4);
  if(u.flash > 0) u.flash = Math.max(0, u.flash - dt * 9);
  if(u.interFlash > 0) u.interFlash = Math.max(0, u.interFlash - dt * 6);
  /* LE BRAQUAGE DURE PLUS LONGTEMPS QUE LE COUP.
     Premier réglage : le cap désigné était effacé dès que la lueur de
     bouche s'éteignait — un sixième de seconde. À 4,2 rad/s le
     tourillon tournait de 0,7 radian et repartait aussitôt en veille :
     il tirait donc dans la direction où il balayait, pas vers la
     roquette, et le braquage était strictement invisible. C'était le
     seul mouvement qui devait se lire, et c'était le seul qu'on ne
     voyait pas.
     Il garde maintenant sa cible une seconde et demie — le temps de
     s'y poser, d'y rester, puis de reprendre sa ronde. */
  if(u.viseeInter > 0){
    u.viseeInter = Math.max(0, u.viseeInter - dt);
    if(u.viseeInter === 0) u.capInter = 0;      // il retourne en veille
  }
}
/* ================================================================
   L'INTERCEPTION D'UNE ROQUETTE

   Appelée au moment où une roquette de Frelon naît, une seule fois,
   et le verdict est posé sur la roquette elle-même. La décision
   pouvait se prendre à trois moments ; celui-ci est le seul qui
   tienne :

     À LA NAISSANCE (retenu) — le verdict est stable pour toute la
       durée du vol, et il ne dépend d'aucune position. La roquette
       porte son sort avec elle.
     À CHAQUE IMAGE — il aurait fallu tirer à chaque image sans
       jamais intercepter deux fois la même, donc y remettre un
       drapeau : la même chose en plus compliqué.
     À L'APPROCHE — le plus tentant, et le pire : une roquette qui
       change de cible en vol (le Frelon a un verrou, mais le
       Brouillard le casse) serait comptée deux fois par deux chars
       différents, et la moitié promise n'en serait plus une.

   LE COMPTEUR PLUTÔT QUE LE HASARD. `intercepteur: 2` est un
   DIVISEUR : une roquette sur deux, exactement, pour chaque char.
   Voir le commentaire de UNI.tank — un tirage au sort donnerait
   parfois quatre échecs d'affilée, et un joueur qui perd un char
   pour cette raison n'a rien appris.
   ================================================================ */
function marqueInterception(cible){
  if(!cible || !cible.t) return 0;
  var f = UNI[cible.t];
  if(!f || !f.intercepteur) return 0;
  cible.interCompte = (cible.interCompte || 0) + 1;
  return (cible.interCompte % f.intercepteur) === 0 ? 1 : 0;
}
/* La roquette est arrivée dans le périmètre de l'intercepteur : il se
   braque dessus, tire, et elle éclate en l'air. Elle ne touche donc
   NI la cible, NI le sol : c'est une destruction, pas un détournement. */
var TANK_INTER_PORTEE = 2.4;      // en cases : là où la charge la cueille
var TANK_VISEE = 1.5;             // s : le temps qu'il reste braqué
function abatRoquette(p, u){
  u.capInter = Math.atan2(p.gy - u.gy, p.gx - u.gx) || 0.0001;
  u.viseeInter = TANK_VISEE;
  u.interFlash = 1;
  jeu.effets.push({ t:"interception", gx:p.gx, gy:p.gy, z:p.z || 0, age:0, duree:0.42 });
  if(son.interception) son.interception();
}
/* Le canon est-il en ligne ? Tant qu'il ne l'est pas, le char ne tire
   pas — il n'attend pas non plus, il garde le doigt sur la détente.
   C'est ce qui donne au tir sa gravité : on VOIT la tourelle se poser
   sur la cible avant que le coup parte. */
function tankAligne(u){
  return Math.abs(ecartAngulaire(u.capTour, u.angTour)) <= TANK_ALIGNE;
}

/* ---------------------------------------------------------------
   Dégâts
   --------------------------------------------------------------- */
/* Combien une troupe encaisse d'une ARME DE PRÉCISION : la roquette
   du Frelon, la balle du tireur d'élite du Mirador. Un pour tout le
   monde, cinq pour l'Ogre — un corps de trois mètres qui avance en
   ligne droite est exactement ce dont rêve un tireur posé.
   Ça ne vaut QUE pour ces deux-là. Ni les mitrailleuses, ni le
   chalumeau, ni la bobine, ni les créatures, ni les éruptions du
   Brasier, ni les capacités — et surtout pas les bâtiments, qui ne
   passent jamais par ici. */
function multVuln(u, arme){
  var f = UNI[u.t];
  if(!f || !f.vuln) return 1;
  var m = f.vuln[arme];
  /* ZÉRO EST UNE VALEUR — L'IMMUNITÉ —, PAS UNE ABSENCE.
     L'écriture d'origine était `(f.vuln[arme]) || 1` : elle allait
     très bien tant que toutes les vulnérabilités étaient des
     multiplicateurs supérieurs à un. Le Tank est immunisé aux
     bestioles, c'est-à-dire vuln.bete = 0, et ce zéro-là serait
     retombé à 1 en silence : les sangliers auraient continué de le
     charger pour soixante-dix points, et rien dans le code n'aurait
     eu l'air faux. */
  return (typeof m === "number") ? m : 1;
}
function toucheUnite(u, degats, opt){
  if(u.pv <= 0) return;
  if(opt && opt.arme) degats *= multVuln(u, opt.arme);
  u.pv -= degats;
  if(opt){
    if(opt.brulure) u.brulure = Math.max(u.brulure, EQ.BRULURE_DUREE);
    if(opt.ralenti){ u.ralenti = Math.max(u.ralenti, opt.ralenti); u.ralentiType = opt.type || "elec"; }
    if(opt.pousse){ u.pousse.x += opt.pousse.x; u.pousse.y += opt.pousse.y; }
  }
  if(u.pv <= 0 && !u.leurre){
    jeu.effets.push({ t:"mort", gx:u.gx, gy:u.gy, age:0, duree:0.55, typ:u.t });
    /* UN CHAR NE DISPARAÎT PAS. Les autres troupes tombent et
       s'effacent en une demi-seconde ; une masse pareille qui
       s'évaporerait laisserait un trou dans l'image et dans la tête
       du joueur. On laisse donc une ÉPAVE qui fume six secondes —
       assez pour qu'on voie où la colonne s'est arrêtée, et pour que
       le joueur comprenne d'où venait le coup. */
    if(u.t === "tank"){
      jeu.effets.push({ t:"epaveTank", gx:u.gx, gy:u.gy, age:0, duree:6.0,
                        ang:u.angBase || 0, angT:u.angTour || 0, n:u.n });
      jeu.secousse = Math.min(8, jeu.secousse + 3.0);
      if(son.tankDetruit) son.tankDetruit();
    }
    /* LE PYR-120 LAISSE UNE ÉPAVE, ET PLUS LONGTEMPS QUE LE CHAR.
       C'est la troupe qu'on envoie devant pour qu'elle encaisse :
       l'endroit où elle a fini est une information — c'est là que la
       colonne s'est heurtée à quelque chose. Et il transporte deux
       fûts de naphte, donc il part plus fort. */
    if(u.t === "pyr"){
      jeu.effets.push({ t:"epavePyr", gx:u.gx, gy:u.gy, age:0, duree:8.0,
                        ang:u.angBase || 0, angT:u.angTour || 0, n:u.n });
      jeu.secousse = Math.min(9, jeu.secousse + 4.0);
      if(son.pyrDetruit) son.pyrDetruit();
    }
    /* Un Ogre abattu d'une seule balle, ça doit se VOIR : sans marque
       propre, le joueur voit sa plus grosse unité disparaître d'une
       image à l'autre sans comprendre ce qui l'a touchée. */
    if(opt && opt.arme && multVuln(u, opt.arme) > 1){
      jeu.effets.push({ t:"abattu", gx:u.gx, gy:u.gy, age:0, duree:0.9 });
      jeu.secousse = Math.min(7, jeu.secousse + 2.2);
    }
    if(jeu.fantome === null) jeu.dernierePerte = { gx:u.gx, gy:u.gy };
  }
}
function degatsZone(gx, gy, rayon, degats, opt){
  var tmp = [];
  unitesAutour(gx, gy, rayon + 1, tmp);
  for(var i = 0; i < tmp.length; i++){
    var u = tmp[i];
    if(Math.hypot(u.gx - gx, u.gy - gy) > rayon) continue;
    /* Souffle d'une arme de DÉFENSE : il épargne ce que le Brouillard
       cache. Sans cela, une roquette qui perdait le contact retombait
       en aveugle sur la dernière position connue — c'est-à-dire pile
       sur la troupe cachée — et le souffle la blessait quand même. La
       fumée promet l'invisibilité : elle doit aussi tenir cette
       promesse contre les coups déjà partis. Le QG, la Salve du joueur
       et la Nova ne posent pas ce drapeau : leurs bombardements de
       zone restent aveugles et indiscriminés. */
    if(opt && opt.epargneCachees && masquee(u)) continue;
    toucheUnite(u, degats, opt);
  }
}
function degatsZoneEnnemis(gx, gy, rayon, degats){
  var bs = [];
  batimentsAutour(gx, gy, rayon + 3, bs);
  for(var i = 0; i < bs.length; i++){
    var b = bs[i];
    if(Math.hypot(b.gx - gx, b.gy - gy) <= rayon + b.e * 0.4) abimeBatiment(b, degats);
  }
  for(var k = 0; k < jeu.creatures.length; k++){
    var c = jeu.creatures[k];
    if(c.pv > 0 && Math.hypot(c.gx - gx, c.gy - gy) <= rayon) abimeCreature(c, degats);
  }
  if(Math.hypot(jeu.qg.gx - gx, jeu.qg.gy - gy) <= rayon + RAYON_QG) abimeQG(degats);
}
function abimeBatiment(b, d){
  if(!b.vivant) return;
  /* MÊME GARDE QUE LE BRASIER, et pour la même raison. Le
     « Math.min(d, b.pv) » ci-dessous borne le haut, mais il ne dit
     rien d'un NaN : Math.min(NaN, pv) vaut NaN, Math.max(0, NaN) vaut
     NaN, et jeu.degatsMoi devient NaN POUR LE RESTE DE LA PARTIE — un
     score qui ne se répare pas et qui part sur le réseau. */
  if(!(d > 0)) return;
  /* Le classement s'appelle TOP DÉGÂTS : il doit compter TOUS les
     dégâts, pas seulement ceux portés au Brasier. Un joueur qui démonte
     des centaines de défenses sans jamais atteindre la forteresse
     restait affiché à zéro. On ne compte que ce qui est réellement
     retiré, pour qu'un coup fatal surdimensionné ne gonfle pas le score. */
  jeu.degatsMoi += Math.max(0, Math.min(d, b.pv));
  b.pv -= d;
  if(b.pv <= 0){
    b.vivant = 0;
    marqueEmprise(b, -1);          // on RETIRE un corps, on ne vide pas la case
    /* une fusée posée sur ce bâtiment cesse d'agir dès qu'il tombe */
    if(jeu.balise && jeu.balise.cible === b){
      jeu.balise = null;
      libereBalise();
    }
    jeu.energie += DEF[b.t].recolte ? EQ.ENERGIE_PAR_CELLULE : EQ.ENERGIE_PAR_BATIMENT;
    jeu.detruitsMoi++;
    if(DEF[b.t].recolte){
      /* une cellule se vide, elle n'explose pas : pas de cratère, pas
         de secousse, juste un éclat et le tintement de la récolte */
      jeu.effets.push({ t:"recolte", gx:b.gx, gy:b.gy, age:0, duree:0.6 });
      son.recolte();
    }else{
      jeu.effets.push({ t:"boum", gx:b.gx, gy:b.gy, age:0, duree:0.75, r:b.e * 0.7, force:1 });
      jeu.crateres.push({ gx:b.gx, gy:b.gy, r:b.e * 0.45 });
      if(jeu.crateres.length > 160) jeu.crateres.shift();
      jeu.secousse = Math.min(9, jeu.secousse + 3);
      son.boum(0.42);
    }
    son.energie();
    envoieDestruction(b.n);
    demandeMajBarres();
  }
}
/* Une balise qui s'éteint ne laisse personne sous ses ordres : sans
   ça, le drapeau resterait posé sur des unités jusqu'à leur mort. */
function libereBalise(){
  for(var i = 0; i < jeu.unites.length; i++){
    jeu.unites[i].baliseOrdre = 0;
    jeu.unites[i].cible = null;
    jeu.unites[i].prochainCiblage = 0;
  }
}

function abimeCreature(c, d){
  if(c.pv <= 0) return;
  c.pv -= d;
  if(c.pv <= 0){
    jeu.effets.push({ t:"mortCre", gx:c.gx, gy:c.gy, age:0, duree:0.7, typ:c.t });
    jeu.energie += EQ.ENERGIE_PAR_CREATURE;
    if(c.t === "belette"){
      jeu.messageGege = 3.0;                       // trois secondes de deuil
      jeu.tueurGege = monNom;
      son.gege();
      envoieGege();                                // que tout le salon le sache
      signaleMonde();
    }
    if(c.t === "tweety"){
      jeu.messageTweety = 3.0;
      jeu.tueurTweety = monNom;
      son.tweety();
      envoieTweety();
      signaleMonde();
    }
    /* Un des trois chats de Mily. Là, il ne s'agit plus de deuil. */
    if(CRE[c.t].protege && !jeu.tueurChats[c.t]){
      jeu.tueurChats[c.t] = monNom;
      declencheVengeance(c.t, monNom, c.gx, c.gy);
      envoieVengeance(c.t, c.gx, c.gy);
      signaleMonde();
    }
    demandeMajBarres();
  }
}

/* ================================================================
   LA VENGEANCE DE MILY
   Elle se joue en quatre temps, et l'ordre est tout le sujet : ce
   qui fait peur, ce n'est pas le rayon, c'est les trois secondes
   pendant lesquelles on le voit venir sans pouvoir rien faire.

     1. « message »  le nom du coupable s'inscrit, les yeux du visage
                     du Brasier virent au rouge et se chargent. Rien
                     ne part encore.
     2. « tir »      DEUX rayons, un par œil, convergent sur la troupe
                     désignée — quelle que soit la distance. Impact.
                     Puis les deux faisceaux CONTINUENT au sol, en V,
                     sur une dizaine de cases, en laissant deux
                     traînées de flammes.
     3. « retrait »  extinction, les braises restent.

   La cible est choisie localement par chaque client, au moment du
   tir : le coupable vise sa propre troupe la plus proche du chat,
   les autres visent le fantôme du coupable. Personne n'a besoin
   d'envoyer de coordonnées, et chaque client reste seul juge des
   dégâts subis par SES troupes — c'est le modèle du reste du jeu.
   ================================================================ */
/* LE COMPTEUR DE VENGEANCES. Il sert à marquer les troupes déjà
   punies et les braises d'une même riposte : sans lui, une troupe
   punie par la première vengeance reprendrait 90 % en marchant dans
   les braises de la seconde, et une troupe punie tout court les
   reprendrait à chaque image. Il ne sort jamais de l'appareil. */
var vengN = 0;
function declencheVengeance(espece, tueur, kx, ky){
  if(!jeu || jeu.fin) return;
  var k = null;
  for(var i = 0; i < jeu.creatures.length; i++)
    if(jeu.creatures[i].t === espece){ k = jeu.creatures[i]; break; }
  /* LE LIEU DU CRIME VOYAGE AVEC LE MESSAGE, et il le faut.
     Les créatures ne transitent jamais par le réseau : elles fuient
     les troupes LOCALES, chacune sur son appareil, si bien que le
     même chat n'est pas au même endroit chez deux joueurs. En
     cherchant le chat localement, chaque client visait un point
     différent et voyait une autre riposte. Le coupable envoie donc
     SES coordonnées, et tout le salon regarde le même tir. */
  var vx = (typeof kx === "number" && isFinite(kx)) ? kx : (k ? k.gx : jeu.qg.gx);
  var vy = (typeof ky === "number" && isFinite(ky)) ? ky : (k ? k.gy : jeu.qg.gy);
  jeu.vengeance = {
    ph:"message", t:0, id:++vengN,
    espece:espece,
    nomBete:CRE[espece].nom,
    tueur:String(tueur || "?").substr(0, 14),
    kx:vx, ky:vy,
    cx:0, cy:0,                 // point d'impact, fixé au moment du tir
    dir:[], puni:0
  };
  if(son.vengeance) son.vengeance();
}

/* Qui paie ? La troupe la plus proche du chat, parmi celles du
   coupable. Sur le client du coupable ce sont ses unités ; ailleurs,
   ce sont les fantômes qu'il diffuse. Sans aucune des deux — il a
   fermé l'onglet, il n'a plus rien en vie — le rayon tombe sur le
   cadavre du chat, ce qui reste parfaitement lisible. */
function cibleVengeance(V){
  var mx = V.kx, my = V.ky, meilleur = Infinity, i, u, d;
  var lot = null;
  if(V.tueur === monNom){
    lot = jeu.unites;
  }else if(typeof autresJoueurs === "object"){
    for(var id in autresJoueurs){
      var j2 = autresJoueurs[id];
      if(j2 && j2.nom === V.tueur && j2.unites && j2.unites.length){ lot = j2.unites; break; }
    }
  }
  if(lot){
    for(i = 0; i < lot.length; i++){
      u = lot[i];
      if(u.pv !== undefined && u.pv <= 0) continue;
      d = Math.hypot(u.gx - V.kx, u.gy - V.ky);
      if(d < meilleur){ meilleur = d; mx = u.gx; my = u.gy; }
    }
  }
  return { x:mx, y:my };
}

/* LES TRAÎNÉES QUI BRÛLENT ENCORE, et les deux règles qu'elles
   tiennent — deux règles écrites noir sur blanc dans la
   spécification, et que le code ne tenait qu'à moitié.

   « TOUTES LES TROUPES TOUCHÉES, soit par l'impact, soit par les
   traînées enflammées derrière, perdent 90 % de leur vie. » La peine
   ne tombait qu'à l'instant du tir : une troupe qui entrait dans une
   traînée une image plus tard ne prenait que les neuf dégâts par
   seconde de la braise, c'est-à-dire rien. Elle prend maintenant ses
   90 %, UNE FOIS — le marquage `vengPuni` sert exactement à ça.

   « 90 % DES PV, JAMAIS LA MORT. » Le commentaire de EQ.VENG_BRAISE_DPS
   l'affirmait déjà, et c'était faux : à onze points de vie, une Furie
   mourait en une seconde et quart de braise. La brûlure s'arrête donc
   à un point de vie. On doit dégager ; on ne doit pas y rester.

   Distance d'un point au segment [a,b] — le test de brûlure des
   traînées. Écrit ici plutôt qu'appelé partout : c'est la seule
   géométrie du jeu qui en ait besoin. */
function distSegment(px, py, ax, ay, bx, by){
  var vx = bx - ax, vy = by - ay;
  var l2 = vx * vx + vy * vy;
  if(l2 < 1e-9) return Math.hypot(px - ax, py - ay);
  var t = borne(((px - ax) * vx + (py - ay) * vy) / l2, 0, 1);
  return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
}

function brulureVengeance(fl, dt){
  var tmp = [];
  unitesAutour(fl.gx, fl.gy, fl.r + 1, tmp);
  for(var i = 0; i < tmp.length; i++){
    var u = tmp[i];
    if(u.pv <= 0) continue;
    if(Math.hypot(u.gx - fl.gx, u.gy - fl.gy) > fl.r) continue;
    if(u.vengPuni !== fl.veng){
      /* elle découvre la traînée : c'est le même châtiment que pour
         celles qui étaient là au moment du tir */
      u.vengPuni = fl.veng;
      toucheUnite(u, u.pv * EQ.VENG_PERTE);
      continue;
    }
    /* déjà punie : il ne reste que la braise, et elle ne tue pas */
    var perte = Math.min(EQ.VENG_BRAISE_DPS * dt, Math.max(0, u.pv - 1));
    if(perte > 0) toucheUnite(u, perte);
  }
}

/* La peine. 90 % des PV, jamais la mort : une barge amputée revient,
   une barge effacée fait fermer l'onglet. Elle tombe une seule fois,
   à l'instant de l'impact, sur tout ce qui se trouve dans le disque
   ou sous l'une des deux traînées. */
function punitVengeance(V){
  var n = 0;
  for(var i = 0; i < jeu.unites.length; i++){
    var u = jeu.unites[i];
    if(u.pv <= 0) continue;
    var pris = Math.hypot(u.gx - V.cx, u.gy - V.cy) <= EQ.VENG_RAYON;
    for(var d = 0; !pris && d < V.dir.length; d++){
      var t = V.dir[d];
      pris = distSegment(u.gx, u.gy, V.cx, V.cy, t.x1, t.y1) <= EQ.VENG_LARGEUR;
    }
    if(!pris) continue;
    toucheUnite(u, u.pv * EQ.VENG_PERTE);
    u.vengPuni = V.id;                 // punie par CETTE riposte, une fois
    n++;
  }
  /* les traînées continuent de brûler après coup */
  for(var e = 0; e < V.dir.length; e++){
    var s = V.dir[e];
    for(var p = 0.12; p <= 1.001; p += 0.16){
      jeu.flaques.push({ gx:V.cx + (s.x1 - V.cx) * p, gy:V.cy + (s.y1 - V.cy) * p,
                         r:EQ.VENG_LARGEUR, age:0, duree:EQ.VENG_BRAISE_DUREE, veng:V.id });
    }
  }
  jeu.flaques.push({ gx:V.cx, gy:V.cy, r:EQ.VENG_RAYON, age:0,
                     duree:EQ.VENG_BRAISE_DUREE, veng:V.id });
  jeu.crateres.push({ gx:V.cx, gy:V.cy, r:EQ.VENG_RAYON * 0.8 });
  jeu.effets.push({ t:"vengBoum", gx:V.cx, gy:V.cy, age:0, duree:0.9 });
  jeu.effets.push({ t:"onde", gx:V.cx, gy:V.cy, age:0, duree:0.55, r:EQ.VENG_RAYON });
  jeu.secousse = Math.min(9, jeu.secousse + 8.2);
  if(son.vengeanceImpact) son.vengeanceImpact();
  return n;
}

function majVengeance(dt){
  var V = jeu.vengeance;
  if(!V) return;
  V.t += dt;
  if(V.ph === "message"){
    if(V.t < EQ.VENG_MESSAGE) return;
    /* LE TIR. On fige la cible ici, et pas au moment du crime : la
       troupe a marché pendant tout le message, le rayon doit tomber
       là où elle est MAINTENANT. */
    var b = cibleVengeance(V);
    V.cx = b.x; V.cy = b.y;
    /* Les deux faisceaux arrivent des deux yeux : passé l'impact ils
       divergent, ce qui donne le V au sol. L'écart est un angle fixe
       et non l'écartement réel des yeux : à trente cases du Brasier,
       le vrai écartement donnerait deux traînées confondues. */
    var ax = V.cx - jeu.qg.gx, ay = V.cy - jeu.qg.gy;
    var an = Math.atan2(ay, ax);
    V.dir = [-1, 1].map(function(s){
      var a2 = an + s * EQ.VENG_ECART;
      return { x1:V.cx + Math.cos(a2) * EQ.VENG_TRAINEE,
               y1:V.cy + Math.sin(a2) * EQ.VENG_TRAINEE, s:s };
    });
    V.ph = "tir"; V.t = 0;
    if(son.vengeanceTir) son.vengeanceTir();
    return;
  }
  if(V.ph === "tir"){
    /* la peine tombe à l'instant où les faisceaux touchent, pas à la
       fin du balayage */
    if(!V.puni && V.t >= 0.16){ V.puni = 1; punitVengeance(V); }
    if(V.t < EQ.VENG_TIR) return;
    V.ph = "retrait"; V.t = 0;
    return;
  }
  if(V.t >= EQ.VENG_RETRAIT) jeu.vengeance = null;
}
/* De 0 à 1 : à quel point les yeux du visage sont chargés. Le rendu
   ne fait que lire cette valeur — il ne décide de rien. */
function chargeVengeance(){
  var V = jeu.vengeance;
  if(!V) return 0;
  if(V.ph === "message") return borne(V.t / EQ.VENG_MESSAGE, 0, 1);
  if(V.ph === "tir") return 1;
  return Math.max(0, 1 - V.t / EQ.VENG_RETRAIT);
}
/* Combien de cellules électriques alimentent encore le bouclier. */
function reacteursVivants(){
  var n = 0;
  for(var i = 0; i < jeu.reacteurs.length; i++) if(jeu.reacteurs[i].bat.vivant) n++;
  return n;
}

/* ---------------------------------------------------------------
   LE BOUCLIER, IMAGE PAR IMAGE
   Une cellule peut tomber par trois chemins très différents : sous nos
   propres tirs, par le message « det » d'un autre joueur, ou d'un coup
   à la lecture d'un instantané de salon. Plutôt que de greffer le même
   traitement à trois endroits — et d'en oublier un quatrième demain —
   on regarde simplement, à chaque image, quelles cellules viennent de
   s'éteindre. La mise en scène part de là, quelle qu'en soit la cause.
   --------------------------------------------------------------- */
function majBouclier(dt){
  if(jeu.coupure > 0) jeu.coupure = Math.max(0, jeu.coupure - dt);
  if(jeu.boucliertouche > 0) jeu.boucliertouche = Math.max(0, jeu.boucliertouche - dt);
  for(var ic = 0; ic < jeu.cables.length; ic++){
    var cc = jeu.cables[ic];
    if(cc.morte && cc.fondu > 0) cc.fondu = Math.max(0, cc.fondu - dt);
  }
  var n = 0, i, r;
  for(i = 0; i < jeu.reacteurs.length; i++){
    r = jeu.reacteurs[i];
    var vif = !!r.bat.vivant;
    if(vif) n++;
    if(r.etaitVive === undefined){ r.etaitVive = vif; continue; }
    if(r.etaitVive && !vif){
      r.etaitVive = false;
      r.eteinte = jeu.tps;                 // l'heure exacte de sa mort
      tombeReacteur(r);
    }
  }
  var avant = jeu.bouclier;
  jeu.bouclier = n;
  if(avant > 0 && n === 0 && !jeu.fin) coupeLeCourant();
}

/* Une cellule s'effondre : décharge incontrôlée, arcs qui partent dans
   tous les sens, petite explosion, et la lumière qui s'éteint. Son
   câble cesse de battre mais reste posé au sol. */
function tombeReacteur(r){
  var b = r.bat;
  jeu.effets.push({ t:"cellHS", gx:b.gx, gy:b.gy, age:0, duree:1.8 });
  jeu.effets.push({ t:"boum", gx:b.gx, gy:b.gy, age:0, duree:0.9, r:2.6, force:1.3 });
  jeu.secousse = Math.min(11, jeu.secousse + 5);
  for(var i = 0; i < jeu.cables.length; i++){
    if(jeu.cables[i].bat === b){ jeu.cables[i].morte = 1; jeu.cables[i].fondu = 1.4; }
  }
  if(son && son.boum) son.boum(0.55);
}

/* La dernière cellule vient de tomber. Le courant lâche d'un coup :
   toute l'énergie encore prise dans les câbles reflue vers le Brasier
   et claque, puis plus rien. Le Brasier devient enfin attaquable. */
function coupeLeCourant(){
  jeu.coupure = 2.6;
  jeu.effets.push({ t:"coupure", gx:jeu.qg.gx, gy:jeu.qg.gy, age:0, duree:2.6 });
  jeu.secousse = Math.min(14, jeu.secousse + 9);
  if(son && son.boum) son.boum(0.85);
  /* la bannière est peinte sur le canevas par dessineCoupure() : elle
     tient les 2,6 s de la coupure, bien plus visible que le bandeau
     ordinaire, et elle crépite. */
}
function abimeQG(d){
  if(jeu.qg.pv <= 0) return;
  /* LE BOUCLIER. Tant qu'une seule cellule électrique tient debout, le
     Brasier ne perd pas un point de vie. Les troupes peuvent tirer —
     c'est même voulu, les impacts crépitent sur le champ — mais rien
     n'entame la coque. Le joueur doit d'abord faire tomber les cinq
     cellules, ce qui l'oblige à se répartir sur toute l'île. */
  if(jeu.bouclier > 0){
    jeu.boucliercoups = (jeu.boucliercoups || 0) + 1;
    jeu.boucliertouche = 0.22;        // le champ encaisse : ça doit se voir
    if(jeu.boucliercoups % 40 === 1 && !jeu.fin){
      message("Le Brasier est protégé : détruis les " + jeu.bouclier
            + " cellule" + (jeu.bouclier > 1 ? "s" : "") + " électrique"
            + (jeu.bouclier > 1 ? "s" : "") + " qui l'alimentent.");
    }
    return;
  }
  d = Math.round(d);
  /* « !(d > 0) » et NON « d <= 0 » : NaN passe le second test sans se
     faire voir. Un NaN glissé dans la file empoisonne les points de vie
     du Brasier pour TOUT LE SALON — jeu.file.pv devient NaN, et NaN ne
     redescend jamais à zéro : la carte ne peut plus être finie. La
     comparaison inversée le rejette, comme toute valeur non finie. */
  if(!(d > 0)) return;
  jeu.serieDeg++;
  /* ON NE COMPTE QUE CE QUI EST RÉELLEMENT RETIRÉ.
     abimeBatiment le fait depuis toujours — « Math.min(d, b.pv) », et
     son commentaire dit pourquoi : « pour qu'un coup fatal
     surdimensionné ne gonfle pas le score ». Le Brasier, lui, n'avait
     pas cette borne : il créditait `d` en entier. Une salve de 400 000
     sur un Brasier auquel il reste 12 000 points de vie inscrivait
     400 000 au classement, dont 388 000 qui n'ont jamais existé — et
     c'est le DERNIER coup de chaque île, donc celui que tout le monde
     regarde.
     La borne ne peut pas s'écrire à l'avance comme celle des
     bâtiments : la file est PARTAGÉE, et les coups des autres joueurs
     peuvent l'avoir vidée entre deux images. On mesure donc de part et
     d'autre de l'application, ce qui donne aussi zéro sur un doublon
     rejeté par la fenêtre glissante — exactement ce qu'il faut. */
  var avantCoup = jeu.file.pv;
  jeu.file.applique(monId, jeu.serieDeg, d);
  jeu.qg.pv = jeu.file.pv;
  var retire = Math.max(0, avantCoup - jeu.file.pv);
  jeu.degatsMoi += retire;
  /* on diffuse ce qu'on a compté, pas ce qu'on a tiré : les autres
     clients rejouent la même séquence, ils doivent voir le même chiffre */
  degatsEnAttente += retire;
  if(jeu.qg.pv <= 0 && !jeu.fin) declencheFin();
}

/* ---------------------------------------------------------------
   Déplacement avec évitement simple
   --------------------------------------------------------------- */
/* ================================================================
   LE DOC, IMAGE PAR IMAGE

   Trois questions, dans cet ordre, et la première qui répond gagne :
     1. y a-t-il un blessé à portée de recherche ? on va le recoudre ;
     2. sinon, où est la troupe ? on s'y recolle ;
     3. et dans tous les cas, on soigne tout ce qui saigne autour.

   IL PREND LA VITESSE DE CELUI QU'IL SUIT, et c'est le cœur du
   personnage. Sa vitesse propre est un PLAFOND, pas une consigne :
   assez haute pour rattraper un Ogre lancé, jamais pour le doubler.
   Un soigneur qui distance sa troupe arrive seul au contact et meurt
   le premier ; un soigneur qui traîne ne soigne personne. Il regarde
   donc ce qu'il escorte et se cale dessus.
   ================================================================ */
var docAutour = [];
function majDoc(u, f, dt, cachee){
  u.cible = null;
  u.tir = 0;
  u.arme = 0;

  /* --- 1. LE PLUS MAL EN POINT, à portée de recherche ---
     On rafraîchit ce choix comme tout le reste : à espacement, sinon
     quarante Docs balaieraient la grille à chaque image. Mais on le
     rafraîchit AUSSI dès que le patient est guéri ou tombé, sans quoi
     le Doc resterait planté au chevet d'un mort. */
  var pat = u.patient;
  var patOk = pat && pat.pv > 0 && pat.pv < pat.pvMax && !pat.leurre &&
              Math.hypot(pat.gx - u.gx, pat.gy - u.gy) < EQ.DOC_RECHERCHE * 1.4;
  u.prochainCiblage -= dt * 1000;
  if(!patOk || u.prochainCiblage <= 0){
    u.prochainCiblage = 320 + Math.random() * 240;
    u.patient = chercheBlesseAutour(u, EQ.DOC_RECHERCHE);
    pat = u.patient;
  }

  /* --- 2. SINON, ON SUIT LA TROUPE ---
     L'escorte sert à deux choses : donner une direction, et donner une
     VITESSE. On garde l'unité suivie d'une image à l'autre tant qu'elle
     vit, pour que le Doc ne saute pas d'un soldat à l'autre. */
  var but = pat, escorte = pat;
  if(!but){
    if(!u.escorte || u.escorte.pv <= 0 ||
       Math.hypot(u.escorte.gx - u.gx, u.escorte.gy - u.gy) > 26){
      u.escorte = chercheCompagnon(u);
    }
    but = escorte = u.escorte;
  }

  /* LA VITESSE ADOPTÉE. On plafonne par la sienne, et l'on ajoute une
     marge de rattrapage quand on est loin derrière : sans elle, un Doc
     qui a pris du retard ne le rattraperait jamais, puisqu'il irait
     exactement à la vitesse de celui qu'il poursuit. */
  var vitBase = f.vitesse;
  if(escorte && UNI[escorte.t]) vitBase = Math.min(f.vitesse, UNI[escorte.t].vitesse);
  var loin = but ? Math.hypot(but.gx - u.gx, but.gy - u.gy) : 0;
  if(loin > 6) vitBase = Math.min(f.vitesse, vitBase * 1.35);
  var vit = vitBase * (u.ralenti > 0 ? EQ.CRYO_RALENTI : 1);

  if(but){
    var dx = but.gx - u.gx, dy = but.gy - u.gy;
    var dd = Math.hypot(dx, dy);
    u.droite = (dx - dy) > 0;
    /* il se tient À CÔTÉ de son patient, pas dessus : sa place dans la
       spirale de formation lui sert de décalage, comme aux autres */
    var vise = pat ? f.arret : 2.2;
    if(dd > vise){
      deplace(u, dx + u.ancX * 1.4, dy + u.ancY * 1.4, vit * dt);
      u.phase += dt * 7.4;
    }else{
      u.phase += dt * 1.5;
    }
  }else{
    u.phase += dt * 1.5;
  }

  /* --- 3. LA SOIGNE ---
     Elle ne dépend PAS d'avoir un patient désigné : tout ce qui saigne
     dans le rayon en profite, blessé de passage compris. Un Doc qui
     court vers un éclopé soigne au passage ceux qu'il croise, et c'est
     ce qui le rend agréable à jouer.
     La fumée l'arrête, comme elle arrête les tirs : sous Brouillard on
     se planque, on ne travaille pas. */
  if(cachee) return;
  unitesAutour(u.gx, u.gy, f.portee, docAutour);
  var rendu = 0;
  for(var i = 0; i < docAutour.length; i++){
    var a = docAutour[i];
    if(a.leurre || a.pv <= 0 || a.pv >= a.pvMax) continue;
    if(Math.hypot(a.gx - u.gx, a.gy - u.gy) > f.portee) continue;
    a.pv = Math.min(a.pvMax, a.pv + f.soin * dt);
    if(a.brulure > 0) a.brulure = Math.max(0, a.brulure - dt * 1.4);
    rendu++;
  }
  /* `soigne` sert au dessin : la mallette s'ouvre et la croix
     s'allume tant qu'il y a du travail. */
  u.soigne = rendu;
  if(rendu) u.tir = 1;
}

/* Le blessé le plus mal en point dans un rayon. On compare la PART de
   vie perdue et non les points perdus : sans ça le Doc irait toujours
   au Commando, qui a cinq fois plus de vie qu'une Furie et perd donc
   cinq fois plus de points pour la même égratignure. */
function chercheBlesseAutour(u, r){
  unitesAutour(u.gx, u.gy, r, docAutour);
  var pire = null, pireP = 0.999;
  for(var i = 0; i < docAutour.length; i++){
    var a = docAutour[i];
    if(a === u || a.leurre || a.pv <= 0 || a.pv >= a.pvMax) continue;
    if(Math.hypot(a.gx - u.gx, a.gy - u.gy) > r) continue;
    var part = a.pv / a.pvMax;
    if(part < pireP){ pireP = part; pire = a; }
  }
  return pire;
}

/* ════════════════════════════════════════════════════════════════
   ON APPUIE SUR SA TÊTE, ET IL EST LÀ

   « Quand je débarque mes troupes avec le héros, j'ai directement
   l'affluence. Ce n'est pas ça qu'il faut. Je débarque mes troupes,
   j'avance, PUIS j'appuie sur Speed, et là il y a le compte à rebours
   qui commence. »

   LA NAVETTE ÉTAIT L'ERREUR, ET ELLE COÛTAIT LES DIX SECONDES. Le
   héros traversait la mer comme une troupe, débarquait au rivage, et
   son horloge partait de là — à l'autre bout de la carte de troupes
   qui avaient déjà avancé. Envoyé avec le débarquement, il grillait
   ses dix secondes sur le sable ; envoyé plus tard, il en passait la
   moitié à courir après le groupe. Dans les deux cas la capacité se
   dépensait AVANT de servir.

   IL APPARAÎT DONC AU MILIEU DE LA TROUPE, tout de suite. C'est la
   seule position qui rende les dix secondes entièrement utiles : sa
   zone fait onze cases de rayon, le centre du groupe la met sous
   l'aile en entier dès la première image. Au front, elle ne couvrirait
   que la moitié avancée ; au rivage, personne.

   SANS TROUPE, ON NE PRÉLÈVE RIEN. Il n'a pas d'arme et ne dope que
   les autres : activé sur une île vide, il ferait payer dix d'Énergie
   pour un personnage qui court tout seul. Le refus est gratuit.
   ════════════════════════════════════════════════════════════════ */
function activeHeros(cle){
  var H = estHeros(cle);
  if(!H) return;
  var fh = UNI[H.unite];
  /* même règle qu'à poseBarge : la visite refuse, l'essai autorise */
  if(typeof modeApercu !== "undefined" && modeApercu
     && !(typeof modeEssai !== "undefined" && modeEssai))
    return message("Visite : tu peux tout regarder, mais pas jouer ici.");
  if(jeu.mort) return message("Ta flotte est perdue, attends le renfort.");
  /* IL FAUT QU'IL SOIT LÀ. Il débarque avec la troupe et vit sa vie ;
     tombé, il ne revient qu'avec la flotte suivante. */
  var h = null;
  for(var i = 0; i < jeu.unites.length; i++){
    var u = jeu.unites[i];
    if(u.pv > 0 && u.t === H.unite){ h = u; break; }
  }
  if(!h) return message(jeu.herosNe ? H.nom + " est tombé — il revient au renfort."
                                    : H.nom + " débarque avec ta première navette.");
  if(h.auraReste > 0)
    return message(H.nom + " court déjà — encore " + Math.ceil(h.auraReste) + " s.");
  var cout = coutActuel(H.cle, jeu.usages);
  if(jeu.energie < cout)
    return message("Il faut " + cout + " d'Énergie pour lancer " + H.nom + ".");
  jeu.energie -= cout;
  jeu.usages[H.cle] = (jeu.usages[H.cle] || 0) + 1;
  h.auraReste = fh.duree;
  jeu.effets.push({ t:"speedPart", gx:h.gx, gy:h.gy, age:0, duree:0.7, arrivee:1 });
  if(son && son.speedDebut) son.speedDebut();
  demandeMajBarres();
  majMenu();
  if(typeof noteQueJeJoue === "function") noteQueJeJoue(jeu.index);
}

/* ════════════════════════════════════════════════════════════════
   IL DÉBARQUE AVEC LA TROUPE, UNE FOIS PAR VIE

   « Speed ne doit pas apparaître dans nos troupes : il doit débarquer
   avec nous, il a une santé. Ce n'est pas quelque chose qui apparaît
   et qui disparaît. C'est comme si c'était une troupe en plus. »

   Il descend donc la rampe de la PREMIÈRE navette de chaque vie,
   derrière ses passagers. Il n'occupe aucune place — les douze Furies
   restent douze — et il ne coûte rien à faire venir : ce qui se paie,
   c'est son aura, pas sa présence.

   TOMBÉ, IL NE REVIENT QU'AU RENFORT, comme la flotte. C'est ce qui
   fait de lui une troupe et non une capacité : on peut le perdre.
   ════════════════════════════════════════════════════════════════ */
function faitDebarquerHeros(v){
  var H = HEROS[0];
  if(!H) return;
  var x = RAMPE_GX - 0.9, y = v.gy;
  for(var essai = 0; essai < 10 && bloque(x, y); essai++){
    y = v.gy + (essai % 2 ? 1 : -1) * 0.5 * (essai + 1);
    x = RAMPE_GX - 0.9;
  }
  if(bloque(x, y)){ x = RAMPE_GX; y = v.gy; }
  creeUnite(H.unite, borne(x, 0.6, GW - 0.6), borne(y, 0.6, GH - 0.6));
  jeu.herosNe = 1;
  demandeMajBarres();
}

/* ════════════════════════════════════════════════════════════════
   LES DIX SECONDES SONT PASSÉES

   L'AURA S'ÉTEINT, ET LUI RESTE. Il ne s'efface plus : « ce n'est pas
   quelque chose qui apparaît et qui disparaît ». Il continue de
   courir avec la troupe, simplement il n'accélère plus personne —
   jusqu'à ce qu'on le relance, ou qu'il tombe.

   L'ÉCLAT ET LES TROIS NOTES RESTENT : sans eux, la troupe cesserait
   d'aller vite sans que rien ne le dise, et l'on croirait à un
   ralentissement du jeu.
   ════════════════════════════════════════════════════════════════ */
function finDeSpeed(u){
  u.auraReste = 0;
  /* l'éclat doré : c'est lui qui DIT que l'effet s'arrête */
  jeu.effets.push({ t:"speedPart", gx:u.gx, gy:u.gy, age:0, duree:0.85 });
  if(son && son.speedFin) son.speedFin();
  demandeMajBarres();
  majMenu();
  /* ni au départ : l'éclat doré et les trois notes qui descendent
     disent la même chose sans couvrir le terrain */
}

/* ════════════════════════════════════════════════════════════════
   LE PLANCHER DE SÉCURITÉ DU HÉROS

   Il n'a pas d'arme et ne sert à rien au contact. On repousse donc le
   point qu'il vise à la distance où SON ESCORTE se tient — « un petit
   peu comme les filles ».

   LA RÈGLE EST RELATIVE, ET LA MESURE A DIT POURQUOI. Tenu à la plus
   longue portée de contact — 6,2 cases — de TOUTE défense debout, il
   était chassé à DIX-SEPT cases de l'objectif sur les ténèbres, où
   trente défenses tiennent dans neuf cases : les répulsions
   s'additionnaient et le sortaient de sa propre aura de onze. Il
   n'accélérait plus personne. Le plancher est donc celui que son
   escorte tient déjà — toujours réalisable, puisqu'elle s'y tient —
   plafonné à la portée de contact pour qu'une escorte très éloignée
   ne le fasse pas reculer sans raison.

   On rend x par la valeur et y par ECARTE_Y : deux retours pour une
   fonction appelée à chaque image d'un héros — un objet par image
   serait de l'ordure à ramasser pour rien.
   ════════════════════════════════════════════════════════════════ */
var ECARTE_Y = 0;
function ecarteDesDefenses(u, e, x, y){
  ECARTE_Y = y;
  if(!e || e.pv <= 0) return x;
  batimentsAutour(x, y, PORTEE_COURTE_MAX + 5, tmpBat);
  for(var i = 0; i < tmpBat.length; i++){
    var b = tmpBat[i];
    if(!b.vivant) continue;
    var dx = x - b.gx, dy = y - b.gy;
    var d = Math.hypot(dx, dy);
    var mini = Math.min(Math.hypot(e.gx - b.gx, e.gy - b.gy),
                        PORTEE_COURTE_MAX + b.e * 0.42);
    if(d >= mini || d < 1e-4) continue;
    /* on le repousse dans l'axe bâtiment → point visé : la sortie la
       plus courte, et elle garde le sens de sa marche */
    x = b.gx + dx / d * mini;
    y = b.gy + dy / d * mini;
    ECARTE_Y = y;
  }
  return x;
}

/* ════════════════════════════════════════════════════════════════
   IL NE VA JAMAIS PLUS VITE QUE LA PLUS RAPIDE DES TROUPES

   « Speed est beaucoup plus rapide que mes Furies. Est-ce qu'il ne
   s'adapterait pas à la vitesse de la troupe la plus rapide qu'on a
   sur la plage ? Là, il va beaucoup trop vite par rapport à ma
   Furie. »

   IL A RAISON, ET LE CHIFFRE LE DIT : sa fiche porte 3,30 quand une
   Furie marche à 1,62 et un Commando à 1,008. Le plus rapide de tout
   ce qui débarque est le Doc, à 2,10. Lancé au rattrapage, le héros
   filait donc à plus du double de ce qu'il escortait — on ne voyait
   plus un compagnon de route mais quelque chose qui traverse l'écran.

   SON PLAFOND EST DONC CELUI DU TERRAIN, et non plus le sien. On
   prend la plus rapide des troupes vivantes, dopage compris — dopée,
   une Furie court à 3,24 et il doit pouvoir la suivre. Sa fiche garde
   ses 3,30 comme borne absolue : elle ne sert plus qu'à empêcher
   qu'un jour une troupe très rapide ne l'emporte au-delà de ce que
   son dessin sait montrer.

   S'IL N'Y A PLUS PERSONNE, la question ne se pose pas : il s'arrête
   de toute façon, faute d'escorte. */
function vitesseTroupeMax(){
  var m = 0;
  for(var i = 0; i < jeu.unites.length; i++){
    var u = jeu.unites[i];
    if(u.pv <= 0 || u.leurre) continue;
    var f = UNI[u.t];
    if(!f || f.heros) continue;
    var v = f.vitesse * (u.dope ? EQ.SPEED_MULT : 1);
    if(v > m) m = v;
  }
  return m;
}

/* ════════════════════════════════════════════════════════════════
   ET IL SUIT PLUTÔT LA PLUS RAPIDE

   « Imaginons que j'ai un PYR qui va vite et des Commandos qui vont
   doucement : il va plutôt suivre le PYR. »

   Escorter le plus PROCHE le collait au premier venu — souvent un
   Commando à 1,008, la plus lente du jeu —, et le groupe rapide
   partait devant sans son aura. On choisit donc la plus rapide de
   celles qui sont DANS SA ZONE : celles-là, il les dope déjà, et les
   suivre ne l'éloigne de personne. Hors zone, on retombe sur la plus
   proche — il faut bien rejoindre quelqu'un.
   ════════════════════════════════════════════════════════════════ */
function chercheEscorte(u){
  unitesAutour(u.gx, u.gy, EQ.SPEED_ATTRACTION, docAutour);
  var zone = EQ.SPEED_ATTRACTION * EQ.SPEED_ATTRACTION;
  var vive = null, mv = -1, pres = null, dPres = 1e9;
  for(var i = 0; i < docAutour.length; i++){
    var a = docAutour[i];
    if(a === u || a.leurre || a.pv <= 0) continue;
    var f = UNI[a.t];
    if(!f || f.heros) continue;
    var dx = a.gx - u.gx, dy = a.gy - u.gy, d2 = dx * dx + dy * dy;
    if(d2 > zone) continue;
    if(f.vitesse > mv){ mv = f.vitesse; vive = a; }
    if(d2 < dPres){ dPres = d2; pres = a; }
  }
  return vive || pres || chercheCompagnon(u);
}

/* Le soldat le plus proche qui n'est pas un Doc : c'est lui qu'on
   escorte. Entre Docs on se suivrait en ronde sans jamais rejoindre
   l'assaut. */
function chercheCompagnon(u){
  var r = 30;
  unitesAutour(u.gx, u.gy, r, docAutour);
  var pres = null, dPres = 1e9;
  for(var i = 0; i < docAutour.length; i++){
    var a = docAutour[i];
    if(a === u || a.t === "doc" || a.leurre || a.pv <= 0) continue;
    var d = Math.hypot(a.gx - u.gx, a.gy - u.gy);
    if(d < dPres){ dPres = d; pres = a; }
  }
  return pres;
}

/* ════════════════════════════════════════════════════════════════
   SPEED, IMAGE PAR IMAGE

   « Il irait de la même vitesse que les troupes qu'on a, elle
   s'adapte. En fait elle suit notre troupe la plus proche. »

   IL SUIT LA PLUS PROCHE, ET IL LA GARDE. Rechercher à chaque image
   le voisin le plus proche ferait sauter le héros d'une troupe à
   l'autre au moindre croisement — on garde donc son escorte tant
   qu'elle vit et qu'elle ne l'a pas semé. C'est la règle du Doc, et
   elle vaut pour les mêmes raisons.

   SA VITESSE EST CELLE DE SON ESCORTE, et c'est tout le sens de
   « elle s'adapte » : il ne double jamais le groupe qu'il emmène. Sa
   vitesse propre — trois cases et demie — ne sert qu'au rattrapage,
   quand il s'est laissé distancer au-delà de sa laisse.

   IL SE TIENT DEVANT, PAS DESSUS. Deux cases et demie d'avance sur le
   cap de son escorte : de là, la zone d'attraction couvre le groupe
   entier, et le héros est visible en tête plutôt que noyé dedans.

   IL NE COMBAT PAS. Ni cible, ni tir, ni armement : les trois champs
   sont remis à zéro à chaque image, sans quoi un reste d'un ordre de
   balise le ferait viser dans le vide.

   ET IL S'EN VA AU BOUT DE DIX SECONDES. Le compte à rebours tourne
   ICI plutôt que dans la boucle générale : c'est la seule fonction
   que le héros traverse, et la boucle générale n'a pas à connaître
   une règle qui ne concerne qu'une unité sur mille. Quand il tombe à
   zéro, on met les points de vie à zéro : `majUnites` retire alors
   l'unité en tête de son parcours, sans passer par `toucheUnite`,
   donc sans mort, sans sang, sans épave — il n'est pas abattu, il
   repart. L'éclat doré, lui, est posé à la main.
   ════════════════════════════════════════════════════════════════ */
function majSpeed(u, f, dt){
  u.cible = null; u.tir = 0; u.arme = 0;
  /* L'AURA S'ÉTEINT, LE HÉROS RESTE. Il ne disparaît plus au bout de
     dix secondes : c'est le dopage qui s'arrête, lui continue de
     courir avec la troupe jusqu'à ce qu'on le relance — ou qu'il
     tombe. Décompté AVANT tout déplacement : une image de course de
     plus après la fin serait une image de dopage volée. */
  if(u.auraReste > 0){
    u.auraReste -= dt;
    if(u.auraReste <= 0){ u.auraReste = 0; finDeSpeed(u); }
  }
  /* ON GARDE SON ESCORTE tant qu'elle vit et reste à portée de vue. */
  if(!u.escorte || u.escorte.pv <= 0 || u.escorte === u ||
     Math.hypot(u.escorte.gx - u.gx, u.escorte.gy - u.gy) > EQ.SPEED_ATTRACTION * 2.4){
    u.escorte = chercheEscorte(u);
  }else{
    /* ET IL CHANGE POUR PLUS RAPIDE, mais pas pour un cheveu. Le
       choix se faisait une fois pour toutes : parti de loin, il
       accrochait le premier venu — souvent un Commando à 1,008 —
       et gardait ce pas-là même quand un PYR à 2,00 courait à côté
       de lui. Il ne change donc que pour un type FRANCHEMENT plus
       rapide, quinze pour cent au moins : les vitesses de fiche ne
       bougeant pas, ce seuil ne peut pas produire d'hésitation. */
    var mieux = chercheEscorte(u);
    if(mieux && UNI[mieux.t].vitesse > UNI[u.escorte.t].vitesse * 1.15)
      u.escorte = mieux;
  }
  var e = u.escorte;
  if(!e){
    /* PERSONNE À SUIVRE : il s'arrête et attend. Le faire marcher vers
       le Brasier tout seul serait l'envoyer mourir pour rien — il n'a
       pas d'arme. */
    u.phase += dt * 2.0;
    u.vitVue = 0;
    return;
  }
  /* la vitesse de l'escorte, dopage compris : il doit pouvoir la
     suivre quand elle-même court deux fois plus vite */
  var vitE = UNI[e.t].vitesse * (e.dope ? EQ.SPEED_MULT : 1);
  var dx = e.gx - u.gx, dy = e.gy - u.gy;
  var d = Math.hypot(dx, dy);
  /* LE CAP DE L'ESCORTE, MÉMORISÉ PAR LE HÉROS LUI-MÊME.
     `gxP` n'est tenu à jour que par les véhicules — un fantassin garde
     celui de sa naissance, et s'en servir aurait fait viser un point
     figé depuis le débarquement. Le héros garde donc sa propre trace
     de l'image précédente, lissée : brute, elle sautille d'un pas à
     l'autre et le point visé danserait devant l'escorte. */
  if(u.escX === undefined || u.escorteVue !== e){
    u.escX = e.gx; u.escY = e.gy; u.escorteVue = e;
    u.capEX = 0; u.capEY = 0;
  }
  var vx = e.gx - u.escX, vy = e.gy - u.escY;
  u.escX = e.gx; u.escY = e.gy;
  var k = Math.min(1, dt * 4);
  u.capEX += (vx - u.capEX) * k;
  u.capEY += (vy - u.capEY) * k;
  /* ════════════════════════════════════════════════════════════
     IL SE TIENT DEVANT QUAND ON MARCHE, À CÔTÉ QUAND ON TIRE

     « Quand je m'arrête sous fumi avec les filles et qu'on vise une
     défense, le héros vient se mettre vraiment très proche. Il faut
     qu'il reste à distance, un peu comme les filles — à distance de
     la portée du lance-flammes par exemple. »

     LES DEUX CASES ET DEMIE D'AVANCE N'ONT DE SENS QU'EN MARCHE.
     Elles servaient à ce qu'on le voie en tête plutôt que noyé dans
     le groupe ; l'escorte arrêtée à SA portée du bâtiment, elles ne
     faisaient plus que le pousser deux cases et demie plus près — au
     contact d'une défense qui, elle, tire.

     ON MESURE DONC L'ESCORTE, PAS UNE INTENTION : `capEX/capEY` est
     déjà sa trace lissée d'une image à l'autre. Immobile, elle tend
     vers zéro, et l'avance s'efface avec elle. Aucun état de plus à
     tenir, et l'on suit tout ce qui l'arrête — la fumée, un tir, un
     ordre —, pas seulement les cas qu'on aurait pensé à écrire. */
  var ex = e.gx, ey = e.gy;
  var vl = Math.hypot(u.capEX, u.capEY);
  if(vl > 1e-4){
    /* l'avance est proportionnelle à ce que l'escorte parcourt
       vraiment : pleine à sa vitesse de croisière, nulle à l'arrêt */
    var part = Math.min(1, vl / (UNI[e.t].vitesse * dt * 0.6));
    ex += u.capEX / vl * EQ.SPEED_LAISSE * part;
    ey += u.capEY / vl * EQ.SPEED_LAISSE * part;
  }
  /* ET LE POINT VISÉ NE VA PAS PLUS PRÈS QUE L'ESCORTE : sans cela,
     un cap dirigé vers le bâtiment qu'elle attaque l'y menait quand
     même, et il fallait ensuite l'en tirer image après image. */
  ex = ecarteDesDefenses(u, e, ex, ey);
  ey = ECARTE_Y;
  var px = ex - u.gx, py = ey - u.gy;
  var pd = Math.hypot(px, py);
  /* SA VITESSE EST CELLE DE L'ESCORTE, sauf s'il a du retard : au-delà
     de sa laisse il reprend la sienne, qui est plus haute. */
  /* SON PLAFOND EST CELUI DU TERRAIN : jamais plus vite que la plus
     rapide des troupes vivantes. Sa fiche ne sert plus que de borne
     absolue, pour qu'aucune troupe future ne l'emporte au-delà de ce
     que son dessin sait montrer. */
  var plafond = Math.min(f.vitesse, vitesseTroupeMax() || f.vitesse);
  var vit = (d > EQ.SPEED_LAISSE * 2) ? plafond : Math.min(plafond, vitE);
  if(pd > 0.4){
    var ch = capChemin(u, ex, ey, pd);
    var mx = ch ? ch.x : px, my = ch ? ch.y : py;
    deplace(u, mx, my, vit * dt);
    capUnite(u, mx, my, 1);
    /* LA CADENCE DE SA FOULÉE SUIT SA VITESSE, et c'est ce qui rend la
       course crédible : à deux fois l'allure, deux fois plus de pas. */
    u.phase += dt * (5.2 + vit * 2.2);
    u.vitVue = vit;
  }else{
    /* arrivé à sa place : il piétine sur place, il ne se fige pas */
    u.phase += dt * 3.0;
    u.vitVue = 0;
  }
}

/* Caps de contournement, de plus en plus écartés du cap voulu : un
   frôlement, un évitement franc, la parallèle au mur, puis des caps de
   dégagement vers l'arrière pour sortir d'un cul-de-sac. */
var CAPS_EVITEMENT = [0.55, 1.05, 1.57, 2.10, 2.60];

/* ════════════════════════════════════════════════════════════════
   L'ENLISEMENT : TROIS SEUILS, ET RIEN N'EST DÉFINITIF

   « Une troupe ne doit jamais rester vingt secondes immobile
   simplement parce que deux alliés se touchent. »

   FIGE_PAS   ce qu'il faut parcourir pour dire qu'on avance. Un demi-
              pas : en dessous, une troupe qui piétine contre un mur
              passerait pour une troupe qui marche.
   FIGE_MOU   au bout d'une seconde sans avancer, on RELÂCHE LA
              SÉPARATION : l'unité accepte de chevaucher ses voisines.
              C'est le premier recours, et c'est presque toujours le
              seul qui serve — un bouchon entre alliés se défait tout
              seul dès qu'ils s'autorisent à se traverser un peu.
   FIGE_LATER au bout de deux secondes, on ajoute un pas DE CÔTÉ :
              contre un angle, il n'existe parfois aucun cap avant qui
              passe, et il faut reculer de biais pour se dégager.

   Le renoncement, lui, n'arrive qu'après sept secondes au moins — et
   il ne concerne que la balise. Voir le garde-fou de majUnites.
   ════════════════════════════════════════════════════════════════ */
var FIGE_PAS   = 0.5;
var FIGE_MOU   = 1.0;
var FIGE_LATER = 2.0;
var FIGE_SEP   = 0.42;              // ce qui reste du rayon quand ça coince

function deplace(u, dx, dy, pas){
  var l = Math.hypot(dx, dy);
  if(l < 1e-6) return;
  dx /= l; dy /= l;
  var nx = u.gx + dx * pas, ny = u.gy + dy * pas;
  if(!bloque(nx, ny) && !bloque(nx, u.gy) && !bloque(u.gx, ny)){
    /* Le bornage vaut AUSSI ici : bloque() considère tout gx >= GW comme
       libre, et la séparation locale est le premier code à pousser une
       unité vers l'est. Sans ces deux bornes, les troupes serrées au
       pied de la rampe finissaient debout sur la mer. */
    u.gx = borne(nx, 0.4, GW - 0.5);
    u.gy = borne(ny, 0.4, GH - 0.5);
    u.cote = 0;                       // route libre : plus de contournement
    return;
  }

  /* CONTOURNEMENT À PLEINE VITESSE.
     L'ancien code glissait sur un seul axe (vitesse amputée de la
     composante perdue) ou tentait deux tangentes fixes : contre un
     angle de bâtiment, la troupe zigzaguait sur place, et dans une
     poche entre plusieurs bâtiments elle s'arrêtait net. Ici on balaie
     des caps de plus en plus écartés du cap voulu — côté mémorisé
     d'abord, l'autre ensuite — et on prend le PREMIER cap libre, au
     pas entier. Une troupe n'est donc jamais ralentie tant qu'il
     existe une direction praticable : elle épouse le mur, contourne
     l'angle, ressort de la poche, et reprend sa route. Le côté
     mémorisé (u.cote) l'empêche d'hésiter entre gauche et droite ;
     elle n'en change que si son côté est réellement muré. */
  if(!u.cote) u.cote = (bruitStable(u.n, 0) < 0.5) ? 1 : -1;
  for(var cote = 0; cote < 2; cote++){
    var s = cote ? -u.cote : u.cote;
    for(var k = 0; k < CAPS_EVITEMENT.length; k++){
      var a = CAPS_EVITEMENT[k] * s;
      var ca = Math.cos(a), sa = Math.sin(a);
      var vx = dx * ca - dy * sa, vy = dx * sa + dy * ca;
      var tx = u.gx + vx * pas, ty = u.gy + vy * pas;
      if(!bloque(tx, ty)){
        if(cote) u.cote = -u.cote;    // le côté préféré était muré : on en change
        u.gx = borne(tx, 0.4, GW - 0.5);
        u.gy = borne(ty, 0.4, GH - 0.5);
        return;
      }
    }
  }
  /* ════════════════════════════════════════════════════════════
     MURÉE DEVANT : ON ESSAIE DE CÔTÉ

     Le balayage ci-dessus ne teste que des caps ÉCARTÉS du cap voulu,
     jamais un pas franchement latéral ni un pas en arrière. Contre un
     angle rentrant — deux bâtiments qui se rejoignent — il n'existe
     aucun cap avant praticable, et la troupe restait immobile jusqu'à
     ce que quelqu'un la pousse. C'était le blocage définitif.

     On ne tente ce dégagement QUE si elle est vraiment enlisée : une
     unité momentanément gênée doit continuer d'appuyer vers l'avant,
     sans quoi tout le groupe se mettrait à louvoyer au moindre
     contact. */
  if((u.figeT || 0) < FIGE_LATER) return;
  var px = -dy, py = dx;                          // la perpendiculaire
  for(var c2 = 0; c2 < 2; c2++){
    var sg = c2 ? -u.cote : u.cote;
    var lx = u.gx + px * sg * pas, ly = u.gy + py * sg * pas;
    if(!bloque(lx, ly)){
      u.gx = borne(lx, 0.4, GW - 0.5);
      u.gy = borne(ly, 0.4, GH - 0.5);
      return;
    }
  }
  /* et, tout à fait en dernier, un demi-pas en arrière : mieux vaut
     perdre une demi-case que rester plantée là */
  var rx = u.gx - dx * pas * 0.5, ry = u.gy - dy * pas * 0.5;
  if(!bloque(rx, ry)){
    u.gx = borne(rx, 0.4, GW - 0.5);
    u.gy = borne(ry, 0.4, GH - 0.5);
  }
}

/* ---------------------------------------------------------------
   Mise à jour des unités
   --------------------------------------------------------------- */
var tmpBat = [], tmpUni = [];
/* ════════════════════════════════════════════════════════════════
   LA ZONE D'ATTRACTION DE SPEED

   « Il a une grosse zone d'attraction. Les troupes rouleraient deux
   fois plus vite, et elles tirent deux fois plus vite. Si une troupe
   sort de la zone, elle ralentit. »

   ON RETIENT LE HÉROS UNE FOIS PAR IMAGE, et l'on ne teste ensuite
   qu'une distance par unité — c'est le prix le plus bas possible pour
   un effet qui touche tout le monde. `u.dope` vaut un ou zéro, il est
   relu par la marche, par la cadence de tir et par le dessin : un
   seul drapeau pour un seul effet.

   LE HÉROS NE SE DOPE PAS LUI-MÊME. Il court déjà à l'allure de son
   escorte ; le doubler le ferait tourner autour d'elle.
   ════════════════════════════════════════════════════════════════ */
function chercheHeros(){
  var h = jeu.heros;
  if(h && h.pv > 0) return h;
  jeu.heros = null;
  for(var i = 0; i < jeu.unites.length; i++){
    var u = jeu.unites[i];
    if(u.pv > 0 && UNI[u.t] && UNI[u.t].heros){ jeu.heros = u; break; }
  }
  return jeu.heros;
}
/* La cadence d'une troupe, doublée sous l'aile du héros. Un seul
   endroit qui sache faire ce calcul : il est employé par les trois
   branches de tir, et trois copies auraient divergé. */
function cadenceDe(u, f){
  return (u.dope ? f.cadence / EQ.SPEED_MULT : f.cadence);
}

function majUnites(dt){
  var i, u;
  var balise = jeu.balise;
  /* LE HÉROS NE DOPE QUE SON AURA ALLUMÉE. Présent en permanence
     depuis qu'il débarque avec la troupe, il ne vaut plus par sa
     seule présence : sans ce filtre, l'activation ne servirait à
     rien et le doublement serait redevenu gratuit. */
  var heros = chercheHeros();
  if(heros && !(heros.auraReste > 0)) heros = null;
  var zone2 = EQ.SPEED_ATTRACTION * EQ.SPEED_ATTRACTION;
  for(i = jeu.unites.length - 1; i >= 0; i--){
    u = jeu.unites[i];
    if(u.pv <= 0){ jeu.unites.splice(i, 1); continue; }

    /* états */
    if(u.brulure > 0){
      u.brulure -= dt;
      /* MOURIR BRÛLÉ EST UNE MORT COMME UNE AUTRE, et elle ne l'était
         pas. La ligne retirait les points de vie À LA MAIN puis
         appelait toucheUnite(u, 0) pour « déclencher la mort » — sauf
         que toucheUnite commence par `if(u.pv <= 0) return;`. Elle
         sortait donc immédiatement, sans pousser l'effet de mort, sans
         noter la dernière perte, et — depuis le TX-90 — sans laisser
         d'épave. Une troupe qui brûlait s'évaporait en silence.
         On laisse maintenant toucheUnite retirer les points elle-même :
         c'est le seul endroit du jeu qui sache mourir. */
      var brl = EQ.BRULURE_DPS * dt;
      toucheUnite(u, brl);
      if(u.pv <= 0){ jeu.unites.splice(i, 1); continue; }
    }
    /* L'ENLISEMENT SE MESURE ICI, une fois, avant tout le reste : le
       déplacement de l'image précédente est déjà inscrit dans gx/gy,
       quelle que soit la branche qui l'a produit. */
    var fdx = u.gx - u.figeX, fdy = u.gy - u.figeY;
    if(fdx * fdx + fdy * fdy > FIGE_PAS * FIGE_PAS){
      u.figeX = u.gx; u.figeY = u.gy; u.figeT = 0;
    }else u.figeT += dt;

    /* SOUS L'AILE DU HÉROS ? Une soustraction et un carré : c'est le
       test le moins cher qui réponde, et il tombe à zéro dès que le
       héros n'est plus là. */
    if(heros && heros !== u){
      var hx = u.gx - heros.gx, hy = u.gy - heros.gy;
      u.dope = (hx * hx + hy * hy <= zone2) ? 1 : 0;
    }else u.dope = 0;

    var vit = UNI[u.t].vitesse;
    /* ET LE DOPAGE SE MULTIPLIE AVANT LES MALUS, pas après : une
       troupe englacée sous l'aile du héros récupère la moitié de ce
       qu'elle a perdu, elle ne devient pas immunisée. */
    if(u.dope) vit *= EQ.SPEED_MULT;
    if(u.ralenti > 0){
      u.ralenti -= dt;
      vit *= (u.ralentiType === "glu") ? 0.4 : 0.45;
    }
    if(u.tir > 0) u.tir -= dt * 3;

    /* poussée (sanglier) */
    if(u.pousse.x || u.pousse.y){
      deplace(u, u.pousse.x, u.pousse.y, Math.min(1, Math.hypot(u.pousse.x, u.pousse.y)) * dt * 9);
      u.pousse.x *= Math.max(0, 1 - dt * 6);
      u.pousse.y *= Math.max(0, 1 - dt * 6);
      if(Math.abs(u.pousse.x) < 0.01) u.pousse.x = 0;
      if(Math.abs(u.pousse.y) < 0.01) u.pousse.y = 0;
    }

    var f = UNI[u.t];
    /* LE CHAR : ses chenilles, ses deux caps et son recul, AVANT tout
       le reste. Ici et nulle part ailleurs : le déplacement de
       l'image précédente est déjà inscrit dans gx/gy, quelle que soit
       la branche qui l'a produit — la marche ordinaire, la balise, la
       poussée d'un sanglier. */
    if(f.tourelle) majTank(u, dt);
    /* Le lance-flammes a son propre état — la montée et la retombée
       de la flamme, et le souffle. Posé APRÈS majTank : il lit le cap
       de l'arme que celui-ci vient de lisser. */
    if(f.flamme && typeof majPyr === "function") majPyr(u, dt);

    /* --- SOUS BROUILLARD : postée, muette ---------------------------
       Tant que l'unité est dans la fumée, elle est cachée. Elle
       continue d'avancer et de se placer normalement — jusqu'à SA
       propre portée, celle de son type : 4,75 case pour une Furie,
       1,70 pour un Commando, jamais une distance générique — puis elle
       s'arrête et se tait. Elle ne tire pas, elle n'engage pas, et
       les défenses ne la voient pas (cf. masquee(), côté défense et
       côté créature). C'est tout l'intérêt de la fumée : venir se
       poster au contact sans déclencher le combat.
       u.cachee sert aussi au rendu, qui estompe la troupe. */
    var cachee = masquee(u);
    u.cachee = cachee;

    /* ════════════════════════════════════════════════════════════
       LE HÉROS PASSE AVANT TOUT LE RESTE, ET NE PREND PAS D'ORDRE

       Trouvé en mesurant sa vitesse : sous une Balise, il ne
       traversait JAMAIS majSpeed. La branche de balise vient avant
       et se termine par un `continue` — il partait donc au but comme
       une troupe, seul, à ses 3,30 de fiche, sans escorte et sans
       plafond. Tout ce qu'on venait d'écrire sur son allure ne
       s'appliquait qu'aux images où le joueur n'avait pas posé de
       balise.

       IL N'A DE TOUTE FAÇON RIEN À FAIRE D'UN ORDRE : il n'a pas
       d'arme, et il suit une escorte qui, elle, obéit à la balise —
       il y va donc, mais à l'allure de la troupe et à côté d'elle,
       ce qui est exactement ce qu'on lui demande.
       ════════════════════════════════════════════════════════════ */
    if(f.heros){ u.baliseOrdre = 0; majSpeed(u, f, dt); continue; }

    /* --- BALISE : un ordre individuel, prioritaire sur tout ------------
       Tant que u.baliseOrdre vaut l'identifiant de la balise en cours,
       cette unité — et elle seule — est sous les ordres. Rien ne l'en
       libère : ni une défense à portée, ni le Brouillard, ni un
       changement de zone. Seul le fait QU'ELLE ait atteint ou franchi
       la zone remet son drapeau à zéro, sans toucher à ses voisines. */
    if(balise && u.baliseOrdre === balise.id){
      var bc = balise.cible;
      var qgVise = !!balise.surQG;
      /* Debout ? Un bâtiment a un drapeau `vivant`, le Brasier a des
         points de vie : la question ne se pose pas de la même façon. */
      var cibleDebout = bc && (qgVise ? bc.pv > 0 : bc.vivant);
      if(cibleDebout){
        /* Balise posée sur une cible : elle devient prioritaire, et
           l'ordre tient tant qu'elle est debout. Les troupes s'arrêtent
           à LEUR portée du bord de l'objectif et TIRENT dessus — elles
           n'essaient jamais d'entrer dedans. Le rayon du Brasier
           (5,6 cases) est bien plus large que celui d'une défense :
           sans ce calcul, elles fonçaient dans ses murs. */
        var rc = qgVise ? RAYON_QG : bc.e * 0.42;
        var dxb = bc.gx - u.gx, dyb = bc.gy - u.gy;
        var db = Math.hypot(dxb, dyb) - rc;
        capUnite(u, dxb, dyb, db > f.arret);
        u.cible = qgVise ? { k:"qg", o:bc } : { k:"bat", o:bc };
        if(db > f.arret){
          /* ════════════════════════════════════════════════════
             LE FILET, MAINTENANT QUE L'ORDRE NE S'ÉTEINT PLUS

             Tant que la balise expirait au bout de trente secondes,
             une troupe murée devant l'objectif était libérée par la
             minuterie. L'ordre tient désormais jusqu'à ce que la
             cible tombe : sans ce garde-fou, celle qui ne peut PAS
             l'atteindre marcherait contre un mur jusqu'à la fin de
             la partie.

             On relâche CETTE unité-là, pas les autres : c'est la
             même règle qu'au ralliement, et pour la même raison —
             on mesure qu'elle ne bouge plus, jamais qu'elle ne se
             rapproche. Celles qui tirent, elles, ne bougent pas non
             plus, mais elles passent par l'autre branche. */
          if(u.figeT > (u.baliseSeuil || 7.0)){ u.baliseOrdre = 0; u.cible = null; }
          var eb = Math.min(rayonFormation() * 0.55, (f.arret + rc) * 0.7);
          /* LE CHEMIN D'ABORD, L'ÉVENTAIL ENSUITE. Loin de l'objectif
             on suit le champ de distance — il contourne ce qui est
             entre les deux. Près de lui, capChemin rend null et l'on
             reprend la ligne droite avec son écart de formation : c'est
             elle qui range la troupe en arc autour de la cible, et un
             champ de distance les ramènerait toutes sur la même case. */
          var chb = capChemin(u, bc.gx, bc.gy, db);
          var sb = serreLaColonne(u, chb ? chb.x : dxb + u.ancX * eb,
                                     chb ? chb.y : dyb + u.ancY * eb);
          var mvx = sb.x, mvy = sb.y;
          capMarcheUnite(u, mvx, mvy);
          deplace(u, mvx, mvy, vit * dt);
          u.phase += dt * (u.t === "commando" ? 6.2 : 8.6);
          /* EN ROULANT VERS L'OBJECTIF, la tourelle reste libre :
             elle balaie les bestioles pendant que la caisse avance.
             Posé APRÈS capUnite et capMarcheUnite, qui viennent
             d'écrire les deux caps — celui de l'arme est le seul
             qu'on reprend. */
          tirBeteEnMarche(u, f, dt, cachee);
        }else{
          u.phase += dt * 1.5;
          u.prochainTir -= dt * 1000;
          if(cachee){
            armeSansTirer(u);
          }else if(u.prochainTir <= 0){
            /* le char attend que sa tourelle soit en ligne */
            if(f.tourelle && !tankAligne(u)){ u.prochainTir = 0; }
            else{
              u.prochainTir = cadenceDe(u, f);
              u.tir = 1;
              tireUnite(u, { gx:bc.gx, gy:bc.gy }, u.cible);
            }
          }
        }
        continue;
      }
      if(!bc){
        /* ════════════════════════════════════════════════════════
           UN CAP COMMUN D'ABORD, SA PLACE SEULEMENT À L'ARRIVÉE

           « Lorsqu'il y a cent Furies allant vers la même balise, je
           ne veux pas que chacune choisisse une trajectoire totalement
           différente. Elles doivent avoir une direction générale
           commune ; ensuite les unités se répartissent légèrement
           autour de cette trajectoire. »

           Chacune visait SA place dans le cercle d'arrivée dès le
           premier pas — donc cent buts distincts, écartés jusqu'à un
           rayon de formation les uns des autres, et cet écart-là se
           payait sur TOUTE la longueur du trajet. Le groupe partait
           déjà éclaté.

           On vise donc le CENTRE tant qu'on est loin, et sa place
           seulement dans les dernières longueurs — le fondu se fait
           sur deux rayons de formation, assez pour que l'éventail
           s'ouvre sans qu'on voie personne braquer. */
        var rf = rayonFormation();
        var dCentreAv = Math.hypot(balise.gx - u.gx, balise.gy - u.gy);
        var ouvre = Math.max(0, Math.min(1, (2 * rf - dCentreAv) / rf));
        var pvx = balise.gx + u.ancX * rf * ouvre;
        var pvy = balise.gy + u.ancY * rf * ouvre;
        var dxf = pvx - u.gx, dyf = pvy - u.gy;
        var df = Math.hypot(dxf, dyf);
        var dCentre = Math.hypot(balise.gx - u.gx, balise.gy - u.gy);
        /* Atteinte de la zone : soit elle est sur sa place, soit elle a
           franchi le cercle — c'est le « atteint OU dépassé » demandé.
           Le repli sur le cercle sert aussi de filet quand la place
           assignée tombe dans l'eau ou dans un mur. */
        var arrivee = (df <= EQ.BALISE_RAYON) ||
                      (dCentre <= rf && (dCentre <= EQ.BALISE_RAYON || bloque(pvx, pvy)));
        /* ════════════════════════════════════════════════════════
           LE GARDE-FOU NE MESURE PLUS LE BON SIGNAL

           Il lisait « est-ce que je me RAPPROCHE de la balise ? » et
           libérait l'unité après sept à onze secondes sans gain. Or
           une troupe qui contourne un pâté de défenses ne se rapproche
           pas de son but pendant tout le contournement : elle marche
           en travers, parfois même en s'éloignant, et c'est justement
           ce qu'on lui demande de faire.

           MESURÉ, SUR LA SCÈNE DE SA PHOTO : cent Furies, une balise à
           soixante-dix-neuf cases. ZÉRO sur cent arrivaient. Les cent
           renonçaient, toutes, en une dizaine de secondes — puis
           partaient chacune sur le bâtiment le plus proche. C'est
           exactement ce qu'il décrit : « elles s'écartent bizarrement,
           elles partent à gauche et à droite ». Elles n'allaient pas
           à la balise : elles avaient abandonné.

           ON MESURE DONC LE MOUVEMENT, pas le rapprochement. Une
           troupe qui avance fait son travail, où qu'elle aille ; une
           troupe qui n'avance plus est vraiment coincée. Et l'on ne
           renonce qu'après avoir ESSAYÉ (voir figeT plus haut et
           l'assouplissement de la séparation) — le renoncement est le
           dernier recours, plus le premier réflexe.
           ════════════════════════════════════════════════════════ */
        if(u.figeT > (u.baliseSeuil || 7.0)) arrivee = true;
        if(!arrivee){
          /* même règle : on contourne tant qu'on est loin, on vise sa
             place dans le cercle une fois arrivé dessus */
          var chf = capChemin(u, balise.gx, balise.gy, dCentre);
          var sf = serreLaColonne(u, chf ? chf.x : dxf, chf ? chf.y : dyf);
          var fvx = sf.x, fvy = sf.y;
          deplace(u, fvx, fvy, vit * dt);
          u.phase += dt * 9;
          capUnite(u, fvx, fvy, 1);
          u.cible = null;
          /* … SAUF LA VERMINE. capUnite vient de poser les deux caps
             sur la balise ; si une bestiole est à portée, la tourelle
             la reprend pour elle et la caisse garde le sien. Voir
             tirBeteEnMarche : c'est gratuit, un véhicule ne s'arrête
             pas pour tirer. */
          tirBeteEnMarche(u, f, dt, cachee);
          continue;                       // rien d'autre ne la concerne
        }
      }
      /* CETTE unité est arrivée — ou sa cible désignée est tombée.
         Elle seule est libérée, et elle repart aussitôt en chasse. */
      u.baliseOrdre = 0;
      u.cible = null;
      u.prochainCiblage = 0;
    }

    /* ════════════════════════════════════════════════════════════
       LE POINT DE RALLIEMENT DE SA BARGE

       « Chaque barge a sa balise : dès qu'on débarque, ça met une
         balise et la troupe va jusque-là. » Et une fois arrivée : elle
         reprend l'assaut normal.

       CE N'EST PAS LA BALISE DE LA CAPACITÉ, et les deux ne se
       ressemblent que de loin. Celle-ci est GRATUITE, elle ne concerne
       QUE les douze soldats d'une barge, elle ne vise aucune cible, et
       elle est bornée à la bande de sable. L'autre coûte de l'énergie,
       emmène TOUT LE MONDE, peut désigner un bâtiment et va n'importe
       où sur l'île. C'est pour cela qu'elles cohabitent au lieu de se
       remplacer.

       PLACÉE APRÈS LA BALISE PARTAGÉE, exprès : un ordre payé doit
       primer sur un ralliement gratuit. La branche du dessus `continue`
       tant qu'elle marche, donc on n'arrive ici que si aucun ordre de
       balise ne tient — et poser une balise efface le ralliement, pour
       qu'une troupe rappelée ne reparte pas ensuite vers son sable.

       ELLE NE FAIT QUE MARCHER. Pas de cible, pas de tir choisi, pas de
       formation en arc : les douze soldats vont à leur point et s'en
       libèrent. C'est le sens de « elles reprennent l'assaut normal » —
       le ralliement choisit leur point de départ, pas leur combat.
       ════════════════════════════════════════════════════════════ */
    if(u.ral){
      var dxr = u.ral.gx - u.gx, dyr = u.ral.gy - u.gy;
      var dr = Math.hypot(dxr, dyr);
      /* LE MÊME FILET QUE LA BALISE, et pour la même raison : une unité
         qui n'avance plus doit être libérée, sinon elle pousse contre
         un obstacle jusqu'à la fin de la partie. On mesure qu'elle ne
         BOUGE plus, jamais qu'elle ne se rapproche — une troupe qui
         contourne s'éloigne un moment, et c'est son travail. */
      if(dr <= EQ.BALISE_RAYON || u.figeT > (u.baliseSeuil || 7.0)){
        u.ral = null;
        u.prochainCiblage = 0;
      }else{
        var chr = capChemin(u, u.ral.gx, u.ral.gy, dr);
        var sr = serreLaColonne(u, chr ? chr.x : dxr, chr ? chr.y : dyr);
        deplace(u, sr.x, sr.y, vit * dt);
        u.phase += dt * 9;
        capUnite(u, sr.x, sr.y, 1);
        u.cible = null;
        tirBeteEnMarche(u, f, dt, cachee);
        continue;
      }
    }

    /* --- SPEED : il ne cherche ni cible ni blessé, il suit la troupe ---
       Placé AVANT le Doc et APRÈS la balise : un héros sous balise
       marche avec le groupe comme tout le monde, et se remet à suivre
       en arrivant. */

    /* --- LE DOC : il ne cherche pas de cible, il cherche un blessé ---
       Placé APRÈS la balise, donc un Doc sous fusée marche avec le
       groupe comme tout le monde, et se remet à soigner en arrivant.
       Et placé AVANT le ciblage, donc il ne consomme jamais une
       recherche de bâtiment qui ne lui servirait à rien. */
    if(u.t === "doc"){ majDoc(u, f, dt, cachee); continue; }

    /* --- recherche de cible, espacée --- */
    /* ════════════════════════════════════════════════════════════
       SOUS LA FUMÉE, ON NE CHANGE PAS D'AVIS

       « Mes Furies sont sous le brouillard, une défense est juste
       devant elles, elles sont déjà à leur bonne distance de tir et
       elles sont protégées. Je veux qu'elles restent intelligemment
       sous le brouillard au lieu d'en sortir inutilement. »

       Le ciblage repasse toutes les quatre dixièmes de seconde et
       reprend LA PLUS PROCHE. Une défense un demi-pas plus près, mais
       hors de la fumée, faisait donc lever la troupe et sortir du
       nuage pour aller se poster ailleurs — sans avoir tiré un coup,
       puisqu'elle était couverte. Elle perdait sa couverture pour un
       demi-pas.

       Tant qu'elle est cachée ET qu'elle tient déjà quelqu'un à sa
       portée, elle garde sa cible. Elle ne cherche à nouveau que si
       sa cible tombe, ou si la fumée se dissipe. Rien d'autre ne
       change : elle vise, elle ne tire pas, elle ne bouge plus.
       ════════════════════════════════════════════════════════════ */
    u.prochainCiblage -= dt * 1000;
    if(u.prochainCiblage <= 0){
      u.prochainCiblage = EQ.PERIODE_CIBLAGE + Math.random() * 260;
      if(!(cachee && cibleTenue(u, f))) u.cible = chercheCibleUnite(u);
    }
    var c = u.cible;
    if(c && ((c.k === "bat" && !c.o.vivant) || (c.k === "cre" && c.o.pv <= 0))) { c = u.cible = null; }

    var but = null, portee = f.arret, rayonCible = 0;
    if(c){
      but = { gx:c.o.gx, gy:c.o.gy };
      rayonCible = c.k === "bat" ? c.o.e * 0.42 : (c.k === "qg" ? RAYON_QG : 0.3);
    }else{
      but = { gx:jeu.qg.gx, gy:jeu.qg.gy };
      rayonCible = RAYON_QG;
    }
    var dx = but.gx - u.gx, dy = but.gy - u.gy;
    var d = Math.hypot(dx, dy) - rayonCible;
    capUnite(u, dx, dy, d > portee);

    if(d > portee){
      /* on marche vers SA place autour de la cible, pas vers le centre :
         la troupe aborde l'objectif en éventail au lieu de s'entasser
         sur l'arc le plus proche. La portée, elle, reste mesurée au
         centre — le décalage n'avantage ni ne pénalise personne. */
      var etal = Math.min(rayonFormation() * 0.55, (portee + rayonCible) * 0.7);
      /* LA CAISSE SUIT LA ROUTE, PAS LA CIBLE. Elle ne marche pas vers
         le centre de l'objectif mais vers SA place dans l'éventail :
         c'est cette direction-là que le char doit prendre, et c'est
         elle qui, un peu écartée de la visée, met en évidence que la
         tourelle ne regarde pas où l'on va. */
      /* et la marche libre suit la même règle que les deux branches
         sous balise : le champ de distance porte la route, l'éventail
         porte l'arrivée */
      var chl = capChemin(u, but.gx, but.gy, d);
      var sl = serreLaColonne(u, chl ? chl.x : dx + u.ancX * etal,
                                 chl ? chl.y : dy + u.ancY * etal);
      var lvx = sl.x, lvy = sl.y;
      capMarcheUnite(u, lvx, lvy);
      deplace(u, lvx, lvy, vit * dt);
      /* ================================================================
         ET LA VERMINE, ICI AUSSI — LA MARCHE LIBRE VALAIT LA MARCHE
         SOUS BALISE.

         « Quand on lance une balise les deux tirent sur les animaux,
         c'est bien ; mais quand ils roulent de manière libre ils ne le
         font pas. »

         C'est exact, et c'était une inconséquence de ma part : la règle
         que j'avais écrite ne parle pas de balise, elle parle de
         MARCHE. Un véhicule a deux caps — la caisse et la tourelle — et
         c'est pour ça que le tir ne lui coûte rien. Ce fait ne dépend
         évidemment pas de la manière dont l'ordre lui est venu. Le tir
         est donc libre ici exactement comme là-bas.

         ET SEULEMENT EN MARCHE, ce qui est l'autre moitié de la règle.
         Arrêté devant son bâtiment, le véhicule a sa tourelle POSÉE sur
         lui : la tourner vers une bestiole lui coûterait un vrai obus
         sur l'objectif, et l'obus vaut mieux. La branche d'arrivée, en
         dessous, ne l'appelle donc pas. */
      tirBeteEnMarche(u, f, dt, cachee);
      /* Cadence du cycle de marche, en radians par seconde. Elle dit le
         NOMBRE de pas, pas la vitesse : l'Ogre avance plus vite qu'une
         Furie (1,782 contre 1,62) tout en faisant deux fois moins de pas
         pour la même distance. C'est exactement ça, une enjambée — et
         c'est pour ça qu'il ne faut surtout pas ralentir son cycle en
         croyant ralentir le personnage. */
      u.phase += dt * (u.t === "ogre" ? 4.1 : (u.t === "commando" ? 6.2 : 8.6));
    }else{
      /* Arrivée à SA portée (f.arret, propre au type). Elle tire —
         sauf si la fumée la couvre, auquel cas elle se tient prête
         et ne bouge plus. */
      u.phase += dt * 1.5;
      u.prochainTir -= dt * 1000;
      if(cachee){
        armeSansTirer(u);
      }else if(f.armement && u.prochainTir > 0 && u.prochainTir <= f.armement * 1000){
        /* ARMEMENT. L'Ogre attrape une hache et ramène le bras en
           arrière AVANT de lancer : sans ce temps-là, la hache
           jaillirait d'un bras au repos. La fenêtre s'ouvre un peu
           avant l'échéance ; le lancer part quand elle expire.
           u.tir est REMIS À UN à chaque image de l'armement, sinon il
           se dégraderait pendant la montée du bras et la pose
           s'affaisserait juste avant le lancer. */
        u.arme = 1;
        u.tir = 1;
      }else if(u.prochainTir <= 0){
        /* LE CHAR NE TIRE PAS DE TRAVERS. Tant que sa tourelle n'est
           pas posée sur la cible, le coup ne part pas — le compteur
           reste à zéro, donc il partira à l'image même où l'alignement
           se fait, sans délai ajouté. C'est ce qui donne son poids au
           tir : on voit le canon venir se poser avant qu'il tonne. */
        if(f.tourelle && !tankAligne(u)){ u.prochainTir = 0; }
        else{
          u.prochainTir = cadenceDe(u, f);
          u.arme = 0;
          u.tir = 1;
          tireUnite(u, but, c);
        }
      }
    }
  }
}

/* Sous Brouillard, l'unité retient son tir mais garde le doigt sur la
   détente : le compte à rebours est ramené à zéro au lieu d'être
   rechargé. À l'image même où la fumée se dissipe, u.prochainTir
   repasse sous zéro et la salve part — aucun délai artificiel, comme
   demandé. Sans ce plafonnement le compteur plongerait dans les
   négatifs pendant vingt secondes, ce qui reviendrait au même, mais
   avec un nombre qui dérive sans raison. */
function armeSansTirer(u){
  if(u.prochainTir < 0) u.prochainTir = 0;
  u.tir = 0;
  u.arme = 0;
}
/* Sa cible actuelle est-elle encore debout ET à sa portée ? C'est la
   seule question qui compte pour décider de ne pas en chercher une
   autre. La marge d'un dixième évite qu'un frisson de séparation ne
   lui fasse relâcher sa prise à la limite exacte. */
function cibleTenue(u, f){
  var c = u.cible;
  if(!c) return false;
  if(c.k === "bat" && !c.o.vivant) return false;
  if(c.k === "cre" && c.o.pv <= 0) return false;
  if(c.k === "qg" && jeu.qg.pv <= 0) return false;
  var rc = c.k === "bat" ? c.o.e * 0.42 : (c.k === "qg" ? RAYON_QG : 0.3);
  return Math.hypot(c.o.gx - u.gx, c.o.gy - u.gy) - rc <= f.arret + 0.1;
}
function chercheCibleUnite(u){
  var meilleur = null, md = 1e9, f = UNI[u.t];
  /* CRÉATURES PROCHES D'ABORD — parce qu'elles nous agressent. MAIS
     PAS POUR CELUI QU'ELLES NE PEUVENT PAS BLESSER.
     Le TX-90 est immunisé aux bestioles ; il s'arrêtait pourtant
     quatre secondes pour tuer au canon un piqueur qui ne lui faisait
     rien, pendant que la tour de guet d'en face lui prenait deux cent
     vingt-quatre points par balle. Répondre à une agression qui ne
     peut pas vous atteindre, ce n'est pas de la prudence, c'est une
     perte de temps — et sur une troupe dont tout l'intérêt est
     d'avancer lentement mais sans s'arrêter, c'est le pire des
     défauts. La table de vulnérabilité dit déjà tout : si elle
     annonce zéro, on passe son chemin. */
  /* ════════════════════════════════════════════════════════════
     UN ANIMAL N'EST PAS UNE DESTINATION

     « Les unités ne doivent pas considérer les animaux comme des
     cibles de navigation automatiques. Les animaux peuvent garder
     leurs mécaniques propres, mais une troupe laissée libre ne doit
     pas décider : je vais marcher jusqu'au chat. »

     Toute créature à moins de six cases devenait la cible, donc la
     DESTINATION : la troupe quittait sa route pour aller rejoindre un
     chat qui, lui, ne l'attaquera jamais. Mesuré sur une scène montée
     exprès — un Crible à neuf cases, un chat à cinq : vingt Furies sur
     vingt partaient vers le chat.

     LA RÈGLE TIENT EN UN MOT : celles qui FUIENT ne se poursuivent
     pas. On garde les agressives — répondre à qui vous mord est une
     autre affaire, et leur portée de six cases ne change pas. Une
     bestiole pacifique reste une cible si elle est DÉJÀ sous le nez,
     à portée de tir : on ne renonce pas à l'abattre, on renonce à
     traverser la carte pour elle. C'est ce qui garde intacts les
     tableaux de chasse de Gégé, de Tweety et des trois chats.
     ════════════════════════════════════════════════════════════ */
  if(multVuln(u, "bete") > 0){
    for(var k = 0; k < jeu.creatures.length; k++){
      var cr = jeu.creatures[k];
      if(cr.pv <= 0) continue;
      var dc = Math.hypot(cr.gx - u.gx, cr.gy - u.gy);
      var fuit = CRE[cr.t] && CRE[cr.t].fuit;
      var limite = fuit ? f.arret : 6;
      if(dc < limite && dc < md){ md = dc; meilleur = { k:"cre", o:cr }; }
    }
  }
  if(meilleur) return meilleur;
  batimentsAutour(u.gx, u.gy, 11, tmpBat);
  for(var i = 0; i < tmpBat.length; i++){
    var b = tmpBat[i];
    var db = Math.hypot(b.gx - u.gx, b.gy - u.gy) - b.e * 0.42;
    if(db < md){ md = db; meilleur = { k:"bat", o:b }; }
  }
  var dq = Math.hypot(jeu.qg.gx - u.gx, jeu.qg.gy - u.gy) - RAYON_QG;
  if(dq < md && dq < 12) meilleur = { k:"qg", o:jeu.qg };
  return meilleur;
}
function tireUnite(u, but, c){
  var f = UNI[u.t];
  if(u.t === "ogre"){
    /* LA HACHE. Elle part de la hauteur d'épaule d'un ogre — soit très
       au-dessus de tout le reste — décrit une cloche et tourne sur
       elle-même pendant tout le vol. Sa vitesse angulaire est calée sur
       la durée du trajet, calculée ICI une fois pour toutes : réglée
       en dur, une hache lancée à bout portant tournait comme une
       toupie et une hache lancée au loin semblait planer. */
    var dh = Math.hypot(but.gx - u.gx, but.gy - u.gy) || 1;
    var duree = Math.max(0.18, dh / f.vitesseHache);
    /* La hache part de l'ÉPAULE, pas du nombril, et déjà un peu devant
       lui : lâchée au centre de l'unité, elle traversait visiblement
       son propre torse à l'image du lancer. La hauteur suit l'échelle
       du personnage — trente unités conviennent à une Furie, pas à un
       ogre qui en fait trois fois plus. */
    var ech = f.ech || 1;
    var ax = u.gx + (but.gx - u.gx) / dh * 0.55 * ech;
    var ay = u.gy + (but.gy - u.gy) / dh * 0.55 * ech;
    jeu.projectiles.push({
      t:"hache", gx:ax, gy:ay, x0:ax, y0:ay,
      cible:c, but:{ gx:but.gx, gy:but.gy },
      degats:f.degats, vit:f.vitesseHache, age:0, duree:duree,
      /* deux tours et demi à trois tours et demi de vol, selon la
         distance : c'est ce qui donne le poids */
      spin:(6.2832 * (2.5 + Math.min(1, dh / 6))) / duree,
      /* départ à hauteur d'épaule, arrivée au sol : la cloche est
         d'autant plus haute que le jet est long */
      haut:(20 + Math.min(26, dh * 3.6)) * ech,
      z0:30 * ech, ang:Math.atan2(but.gy - u.gy, but.gx - u.gx), n:jeu.nSuiv++
    });
    if(son.hache) son.hache();
    return;
  }
  if(u.t === "tank"){
    /* L'OBUS PART DE LA BOUCHE DU TUBE, jamais du nombril du char.
       Le canon fait vingt-quatre pixels et la tourelle neuf : à
       l'échelle de la carte, une case et demie. Un obus qui naît au
       centre du char lui traverse visiblement sa propre tourelle à
       l'image du départ — c'est la faute qu'on remarque tout de
       suite sans savoir la nommer. */
    var ct = Math.cos(u.angTour), st = Math.sin(u.angTour);
    var db2 = (TK.toR - 1.5 + TK.caL) / 26;        // pixels → cases
    jeu.projectiles.push({
      t:"obusTank", gx:u.gx + ct * db2, gy:u.gy + st * db2,
      cible:c, but:but, degats:f.degats, vit:f.vitesseObus, age:0,
      ang:u.angTour
    });
    /* le recul, la lueur de bouche, et la secousse : un canon de char
       n'est pas un fusil, ça se sent jusque dans la caméra */
    u.recul = 1; u.flash = 1;
    jeu.secousse = Math.min(6, jeu.secousse + 0.9);
    if(son.canonTank) son.canonTank();
    return;
  }
  if(u.t === "pyr"){
    /* LE LANCE-FLAMMES N'EST PAS UN TIR, C'EST UN ROBINET.

       Il n'y a donc ni projectile, ni départ de coup, ni recul : les
       dégâts s'appliquent tout de suite, et la seule chose qu'on
       laisse derrière soi est un compte à rebours. Tant que ce
       compteur n'est pas retombé à zéro, 63-pyr.js dessine le jet ;
       comme la cadence est de 120 ms et que le compteur vaut 0,22 s,
       il ne retombe jamais à zéro tant que l'engin tire — la flamme
       est donc CONTINUE, sans un trou entre deux coups, et elle
       s'éteint deux dixièmes après le dernier.

       Aucune secousse de caméra non plus : un jet de naphte ne
       recule pas, et la secousse est le langage des gros canons. */
    appliqueDegatsCible(c, f.degats, but);
    u.feuT = 0.22;
    return;
  }
  if(u.t === "furie"){
    jeu.projectiles.push({
      t:"roquetteJ", gx:u.gx, gy:u.gy - 0.2, vx:0, vy:0, cible:c, but:but,
      degats:f.degats, vit:11, age:0
    });
    son.tirFurie();
  }else{
    /* corps à corps : impact immédiat */
    appliqueDegatsCible(c, f.degats, but);
    jeu.effets.push({ t:"coup", gx:but.gx, gy:but.gy, age:0, duree:0.22 });
    son.coupCommando();
  }
}
/* L'IMPACT D'UNE HACHE. Quatre cents kilos d'acier lancés par un ogre :
   ça doit s'entendre et ça doit secouer. Un choc franc, un anneau de
   poussière, quelques éclats, et une secousse de caméra courte — assez
   pour qu'on la sente, pas assez pour gêner la visée. */
function impactHache(gx, gy){
  jeu.effets.push({ t:"hacheBoum", gx:gx, gy:gy, age:0, duree:0.42 });
  jeu.effets.push({ t:"onde", gx:gx, gy:gy, age:0, duree:0.34, r:1.1 });
  jeu.effets.push({ t:"poussiere", gx:gx, gy:gy, age:0, duree:0.55 });
  jeu.secousse = Math.min(6, jeu.secousse + 1.5);
  if(son.impactHache) son.impactHache();
}
/* LE POINT UNIQUE OÙ UNE TROUPE INFLIGE SES DÉGÂTS — et donc le seul
   endroit où la montée en puissance s'applique.
   Ses trois appelants sont tous des tirs de troupe : le corps à corps,
   le projectile, la roquette. Ce qui NE passe pas par ici et ne doit
   surtout pas être multiplié : la foudre et les geysers, qui vont
   droit à abimeBatiment par degatsZoneEnnemis, et les capacités, que
   le joueur a explicitement voulu laisser hors du bonus. Mettre le
   multiplicateur dans abimeBatiment aurait multiplié l'orage. */
function appliqueDegatsCible(c, d, but){
  /* LES DEUX FACTEURS SE MULTIPLIENT, ILS NE S'ADDITIONNENT PAS.
     « Ils auraient la base, plus ces pourcentages, PLUS APRÈS quand
     ils détruisent la map les dix trente cent pour cent — comme ça
     c'est cumulatif. » Une relique de Zénith et un palier plein font
     donc 1,33 × 2,00, et non 1 + 0,33 + 1,00 : c'est la même règle
     que partout ailleurs dans ce jeu, et la seule qui garde son sens
     si l'un des deux barèmes bouge un jour. */
  d *= jeu.puissance * jeu.multAssaut;
  if(!c){ if(but && Math.hypot(but.gx - jeu.qg.gx, but.gy - jeu.qg.gy) < RAYON_QG + 1) abimeQG(d); return; }
  if(c.k === "bat") abimeBatiment(c.o, d);
  else if(c.k === "cre") abimeCreature(c.o, d);
  else abimeQG(d);
}

/* ---------------------------------------------------------------
   Mise à jour des défenses
   --------------------------------------------------------------- */
function majDefenses(dt, tps){
  /* Boîte englobante de tout ce qui peut être PRIS pour une troupe :
     les unités ET les poulets leurres. L'ancien code s'endormait dès
     que jeu.unites était vide et sa boîte ignorait les poulets — des
     leurres largués seuls, flotte morte ou occupée ailleurs, ne
     réveillaient donc jamais une seule tourelle. C'est pourtant tout
     leur intérêt, et depuis que les capacités des autres joueurs
     agissent chez nous, leurs poulets aussi doivent détourner nos
     défenses simulées. */
  if(!jeu.unites.length && !jeu.poulets.length){
    for(var q = 0; q < jeu.batiments.length; q++){
      var bq = jeu.batiments[q];
      if(bq.flash > 0) bq.flash -= dt * 6;
      if(bq.recul > 0) bq.recul -= dt * 6;
    }
    return;
  }
  var bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
  for(var i = 0; i < jeu.unites.length; i++){
    var u = jeu.unites[i];
    if(u.gx < bx0) bx0 = u.gx; if(u.gx > bx1) bx1 = u.gx;
    if(u.gy < by0) by0 = u.gy; if(u.gy > by1) by1 = u.gy;
  }
  for(var i2 = 0; i2 < jeu.poulets.length; i2++){
    var u2 = jeu.poulets[i2];
    if(u2.gx < bx0) bx0 = u2.gx; if(u2.gx > bx1) bx1 = u2.gx;
    if(u2.gy < by0) by0 = u2.gy; if(u2.gy > by1) by1 = u2.gy;
  }

  for(var k = 0; k < jeu.batiments.length; k++){
    var b = jeu.batiments[k];
    if(b.flash > 0) b.flash -= dt * 6;
    if(b.recul > 0) b.recul -= dt * 6;
    if(b.chargement > 0) b.chargement -= dt * 3;
    if(!b.vivant) continue;
    var f = DEF[b.t];
    if(!f.portee) continue;
    if(geleeParCryo(b)){ b.cible = null; continue; }
    /* élagage par boîte englobante */
    var ddx = Math.max(bx0 - b.gx, 0, b.gx - bx1);
    var ddy = Math.max(by0 - b.gy, 0, b.gy - by1);
    if(Math.hypot(ddx, ddy) > f.portee + 1) continue;

    /* VERROU. Une batterie à verrou n'abandonne pas la cible qu'elle a
       accrochée pour la remplacer par une voisine plus proche à chaque
       balayage : elle la suit tant qu'elle vit, reste visible et reste
       dans sa fourchette de tir. Sans ce garde-fou, une troupe qui
       passe à portée volerait la cible d'un missile déjà en route. */
    var garde = false;
    if(f.verrou && b.cible && b.cible.pv > 0 && !masquee(b.cible)){
      var dv = Math.hypot(b.cible.gx - b.gx, b.cible.gy - b.gy);
      garde = dv <= f.portee && !(f.porteeMin && dv < f.porteeMin);
    }

    b.prochainCiblage -= dt * 1000;
    if(!garde && b.prochainCiblage <= 0){
      b.prochainCiblage = EQ.PERIODE_CIBLAGE + Math.random() * 220;
      b.cible = chercheCibleDefense(b, f);
    }
    var c = b.cible;
    if(c && (c.pv <= 0 || masquee(c))) c = b.cible = null;
    if(!c) continue;
    var dx = c.gx - b.gx, dy = c.gy - b.gy;
    var d = Math.hypot(dx, dy);
    /* Trop loin, ou trop près : on lâche la cible pour pouvoir en
       chercher une qu'on peut réellement atteindre. Rester verrouillé
       sur quelqu'un qu'on ne peut pas toucher ne servirait à rien. */
    if(d > f.portee + 0.4 || (f.porteeMin && d < f.porteeMin)){
      b.cible = null;
      b.prochainCiblage = 0;
      continue;
    }

    /* la tourelle vise */
    var vise = Math.atan2(dy, dx);
    var ec = ecartAngulaire(vise, b.angle);
    b.angle += ec * Math.min(1, dt * 7);

    b.prochainTir -= dt * 1000;
    if(b.prochainTir <= 0 && Math.abs(ec) < 0.5){
      b.prochainTir = f.cadence;
      tireDefense(b, f, c, d, tps);
    }
  }
}
/* La fumée vient de se dissiper : tout ce qui pouvait tirer sur la zone
   reprend ses droits À L'INSTANT MÊME. Sans ça, défenses et créatures
   auraient attendu leur prochain balayage de détection — jusqu'à six
   dixièmes de seconde de sursis offert aux troupes, exactement le délai
   artificiel qu'on ne veut pas. On remet donc leur minuterie de ciblage
   à zéro : à l'image suivante, elles rouvrent les yeux.
   Portée du réveil : le rayon de la zone plus la plus longue portée du
   jeu, pour n'oublier aucune tourelle capable d'atteindre la zone. */
var PORTEE_MAX_DEF = 0;
function porteeMaxDefense(){
  if(!PORTEE_MAX_DEF) for(var t in DEF) PORTEE_MAX_DEF = Math.max(PORTEE_MAX_DEF, DEF[t].portee || 0);
  return PORTEE_MAX_DEF;
}
function reveleZone(f){
  var p = f.r + porteeMaxDefense();
  batimentsAutour(f.gx, f.gy, p, tmpBat);
  for(var i = 0; i < tmpBat.length; i++) tmpBat[i].prochainCiblage = 0;
  for(var k = 0; k < jeu.creatures.length; k++){
    var cr = jeu.creatures[k];
    if(cr.pv > 0 && Math.hypot(cr.gx - f.gx, cr.gy - f.gy) <= p) cr.minuteur = 0;
  }
}

function masquee(u){
  for(var i = 0; i < jeu.brouillards.length; i++){
    var f = jeu.brouillards[i];
    if(Math.hypot(u.gx - f.gx, u.gy - f.gy) <= f.r) return true;
  }
  return false;
}
function chercheCibleDefense(b, f){
  unitesAutour(b.gx, b.gy, f.portee, tmpUni);
  var meilleur = null, md = 1e9;
  for(var i = 0; i < tmpUni.length; i++){
    var u = tmpUni[i];
    if(u.pv <= 0) continue;
    var d = Math.hypot(u.gx - b.gx, u.gy - b.gy);
    if(d > f.portee) continue;
    if(f.porteeMin && d < f.porteeMin) continue;
    if(masquee(u)) continue;
    if(d < md){ md = d; meilleur = u; }
  }
  return meilleur;
}
function tireDefense(b, f, c, d, tps){
  /* LE BONUS DE DÉGÂTS DE LA JUNGLE, appliqué ICI et nulle part
     ailleurs. Toutes les défenses du jeu passent par cette fonction,
     et toutes lisent leurs dégâts dans `f` : on substitue donc une
     fiche majorée le temps du tir, plutôt que d'aller multiplier les
     douze endroits où `f.degats` est lu — obus, roquette, balle,
     flamme, arc, chacun avec sa propre trajectoire. Une seule ligne
     à relire pour savoir ce que frappe une défense de la jungle. */
  var kd = multDegatsDefense();
  if(kd !== 1){
    /* Object.create et non une copie : la fiche majorée hérite de tous
       les autres champs — portée, cadence, zone, vitesse du projectile
       — sans qu'on ait à les recopier, donc sans risque d'en oublier
       un le jour où DEF en gagne un nouveau. */
    var fj = Object.create(f);
    fj.degats = Math.round(f.degats * kd);
    f = fj;
  }
  b.flash = 1;
  if(b.t === "crible"){
    b.recul = 1;
    var touche = mitraTouche(d, Math.random());
    /* Chaque balle finit quelque part : une gerbe de sable marque le
       point de chute. C'est cette grêle d'impacts qui fait comprendre,
       même en dézoomant, quelle zone la mitrailleuse est en train
       d'arroser — les traçantes seules sont trop fugaces. */
    var disp = touche ? 0.42 : 0.95;              // dispersion, en cases
    var ai = Math.random() * 6.2832, ri = Math.sqrt(Math.random()) * disp;
    var ex = c.gx + Math.cos(ai) * ri, ey = c.gy + Math.sin(ai) * ri;
    if(!touche){
      /* balle franchement perdue : elle part plus loin, au-delà */
      var a = Math.atan2(c.gy - b.gy, c.gx - b.gx) + (Math.random() - 0.5) * 0.30;
      var dd = d * (1.05 + Math.random() * 0.35);
      ex = b.gx + Math.cos(a) * dd; ey = b.gy + Math.sin(a) * dd;
    }else{
      toucheUnite(c, f.degats);
    }
    jeu.effets.push({ t:"traceur", gx:b.gx, gy:b.gy, ex:ex, ey:ey,
                      age:0, duree:0.10, perdue:touche ? 0 : 1 });
    jeu.effets.push({ t:"impact", gx:ex, gy:ey, age:0, duree:0.34 });
    son.tirCrible();
  }else if(b.t === "chalumeau"){
    /* cône de chalumeau : tout ce qui est dans le cône prend et brûle */
    var ang = b.angle;
    unitesAutour(b.gx, b.gy, f.portee, tmpUni);
    for(var i = 0; i < tmpUni.length; i++){
      var u = tmpUni[i];
      var du = Math.hypot(u.gx - b.gx, u.gy - b.gy);
      if(du > f.portee) continue;
      if(!dansCone(Math.atan2(u.gy - b.gy, u.gx - b.gx), ang, f.cone)) continue;
      if(masquee(u)) continue;              // la fumée coupe aussi le cône
      toucheUnite(u, f.degats, { brulure:1 });
    }
    jeu.effets.push({ t:"cone", gx:b.gx, gy:b.gy, ang:ang, portee:f.portee,
                      ouv:f.cone, age:0, duree:0.22 });
    son.jetFlamme();
  }else if(b.t === "frelon"){
    b.recul = 1;
    /* Les six tubes partent à tour de rôle : chaque départ sort d'une
       bouche différente, légèrement décalée, et chaque roquette reçoit
       SON profil de vol — apogée et dérive propres — pour que deux
       tirs ne dessinent jamais la même courbe dans le ciel. */
    b.tube = ((b.tube | 0) + 1) % 6;
    var ecT = (b.tube % 2 ? 1 : -1) * (0.22 + (b.tube % 3) * 0.14);
    var vol0 = Math.max(0.7, d / f.vitesseProj);
    jeu.projectiles.push({ t:"roquette",
      gx:b.gx - Math.sin(b.angle) * ecT, gy:b.gy + Math.cos(b.angle) * ecT,
      z:34, cible:c, but:{ gx:c.gx, gy:c.gy },
      degats:f.degats, vit:f.vitesseProj, age:0, brouillard:0,
      vol:vol0, apogee:26 + Math.min(110, d * 4.5) + (b.tube % 3) * 12,
      /* SON SORT EST SCELLÉ ICI, à sa naissance, et il ne changera
         plus : une roquette de Frelon sur deux visant un TX-90 sera
         abattue en vol par son intercepteur. Le verdict voyage avec
         la roquette — voir marqueInterception, qui explique pourquoi
         il ne peut pas être pris plus tard. */
      abattue:marqueInterception(c),
      tr:[] });
    jeu.effets.push({ t:"souffle", gx:b.gx, gy:b.gy, ang:b.angle, age:0, duree:0.5 });
    son.tirFrelon();
  }else if(b.t === "pilon"){
    b.recul = 1; b.chargement = 1;
    /* Une cloche haute et lente : c'est la lisibilité de la trajectoire
       qui dit d'où vient le coup. Trop tendue, on ne voit rien partir. */
    var vol = Math.max(0.85, d / f.vitesseProj);
    jeu.projectiles.push({ t:"bombe", gx:b.gx, gy:b.gy, x0:b.gx, y0:b.gy,
      cx:c.gx, cy:c.gy, duree:vol, age:0, degats:f.degats, zone:f.zone,
      mortier:f.mortier || 0, haut:34 + d * 4.6 });
    jeu.effets.push({ t:"souffle", gx:b.gx, gy:b.gy, ang:b.angle, age:0, duree:0.45 });
    son.tirPilon();
  }else if(b.t === "mirador"){
    /* LE TIREUR D'ÉLITE. Une balle, une cible, très loin, très vite —
       pas de zone, pas de gerbe, pas de rattrapage. Elle part avec le
       drapeau `precision`, celui qui déclenche le ×5 de l'Ogre : un
       corps de trois mètres qui avance en ligne droite est exactement
       ce dont rêve un homme posé dans une tour.
       Le projectile file à 26 cases/s — trois fois une roquette : à
       douze cases on doit voir le trait partir, pas le voir voyager. */
    b.recul = 1;
    var volM = Math.max(0.12, d / f.vitesseProj);
    jeu.projectiles.push({ t:"balle", gx:b.gx, gy:b.gy, x0:b.gx, y0:b.gy,
      cible:c, but:{ gx:c.gx, gy:c.gy }, duree:volM, age:0,
      /* la bouche du fusil, pas le milieu du treillis : le tireur est
         agenouillé sur le plancher du mirador, à 72 + 8 unités */
      degats:f.degats, z0:80 });
    jeu.effets.push({ t:"souffle", gx:b.gx, gy:b.gy, ang:b.angle, age:0, duree:0.28 });
    if(son.tirMirador) son.tirMirador();
  }else if(b.t === "bobine"){
    var vol2 = Math.max(0.7, d / f.vitesseProj);
    jeu.projectiles.push({ t:"bobine", gx:b.gx, gy:b.gy, x0:b.gx, y0:b.gy,
      cx:c.gx, cy:c.gy, duree:vol2, age:0, degats:f.degats, zone:f.zone,
      ralenti:f.ralenti, haut:30 + d * 2.6 });
    son.tirBobine();
  }
}

/* ---------------------------------------------------------------
   Projectiles
   --------------------------------------------------------------- */
function majProjectiles(dt){
  for(var i = jeu.projectiles.length - 1; i >= 0; i--){
    var p = jeu.projectiles[i];
    p.age += dt;
    if(p.t === "hache"){
      /* La hache suit une cloche entre le point de lancer et le point
         visé. On interpole dans le TEMPS, pas à vitesse constante :
         c'est la seule façon d'avoir une cloche propre, et ça garantit
         qu'elle arrive exactement au bout de sa durée quelle que soit
         la distance. Elle ne poursuit PAS sa cible : une hache lancée
         est lancée, elle tombe où elle a été jetée. */
      var kh = Math.min(1, p.age / p.duree);
      p.gx = p.x0 + (p.but.gx - p.x0) * kh;
      p.gy = p.y0 + (p.but.gy - p.y0) * kh;
      p.z = p.z0 * (1 - kh) + p.haut * 4 * kh * (1 - kh);
      p.rot = p.age * p.spin;
      if(kh >= 1){
        appliqueDegatsCible(p.cible, p.degats, p.but);
        impactHache(p.but.gx, p.but.gy);
        jeu.projectiles.splice(i, 1);
      }
      continue;
    }
    if(p.t === "balle"){
      /* La balle du Mirador ne poursuit pas : elle est tirée là où la
         cible SE TROUVAIT. Une troupe qui bouge s'en sort, une troupe
         postée la prend en pleine tête — et c'est très bien ainsi,
         puisque c'est précisément la troupe postée qu'elle est là pour
         punir. Elle épargne ce que le Brouillard cache : un tireur ne
         vise pas ce qu'il ne voit pas. */
      var kb = Math.min(1, p.age / p.duree);
      p.gx = p.x0 + (p.but.gx - p.x0) * kb;
      p.gy = p.y0 + (p.but.gy - p.y0) * kb;
      p.z = p.z0 * (1 - kb);
      if(kb >= 1){
        if(p.cible && p.cible.pv > 0 && !masquee(p.cible) &&
           Math.hypot(p.cible.gx - p.but.gx, p.cible.gy - p.but.gy) < 0.9){
          toucheUnite(p.cible, p.degats, { arme:"precision" });
        }else{
          degatsZone(p.but.gx, p.but.gy, 0.45, p.degats, { epargneCachees:1, arme:"precision" });
        }
        jeu.effets.push({ t:"impact", gx:p.but.gx, gy:p.but.gy, age:0, duree:0.30 });
        jeu.projectiles.splice(i, 1);
      }
      continue;
    }
    /* L'OBUS DE CHAR suit le même chemin qu'une roquette de Furie :
       il poursuit sa cible, et il applique ses dégâts par
       appliqueDegatsCible — donc la montée en puissance s'y applique
       comme au reste. Ce qui diffère est ailleurs : il va plus vite,
       il laisse un traceur au lieu d'une flamme, et son impact est
       un choc d'acier et non une gerbe de feu. */
    if(p.t === "roquetteJ" || p.t === "roquette" || p.t === "obusTank"){
      var bx = p.but.gx, by = p.but.gy;
      if(p.cible){
        if(p.cible.k){ if(p.cible.o && (p.cible.o.vivant !== 0)){ bx = p.cible.o.gx; by = p.cible.o.gy; } }
        else if(p.cible.pv > 0){
          /* la cible s'est glissée dans un Brouillard : la roquette
             perd le contact et tombe là où elle croyait la trouver */
          if(p.t === "roquette" && masquee(p.cible)){
            /* contact perdu : elle tombe là où elle croyait la trouver,
               et non au point de tir initial */
            p.but = { gx:p.cible.gx, gy:p.cible.gy };
            bx = p.but.gx; by = p.but.gy;
            p.cible = null;
          }else{ bx = p.cible.gx; by = p.cible.gy; }
        }
      }
      var dx = bx - p.gx, dy = by - p.gy, d = Math.hypot(dx, dy);
      var pas = p.vit * dt;
      p.ang = Math.atan2(dy, dx);
      /* L'INTERCEPTION. Elle se joue AVANT le test d'impact : une
         roquette cueillie à deux cases et demie ne doit ni toucher sa
         cible ni retomber au sol. La cible doit être encore vivante et
         encore la même — un char mort n'intercepte plus rien, et une
         roquette qui a perdu le contact dans le Brouillard n'est plus
         adressée à personne. */
      if(p.abattue && p.cible && p.cible.pv > 0 && !p.cible.k &&
         d <= TANK_INTER_PORTEE){
        abatRoquette(p, p.cible);
        jeu.projectiles.splice(i, 1);
        continue;
      }
      if(d <= pas || p.age > 6){
        if(p.t === "roquetteJ" || p.t === "obusTank"){
          appliqueDegatsCible(p.cible, p.degats, p.but);
          if(p.t === "obusTank"){
            /* L'IMPACT D'UN OBUS DE CHAR. Un choc d'acier, pas une
               gerbe de feu : une étincelle blanche, un anneau de
               poussière court, et une secousse. */
            jeu.effets.push({ t:"obusBoum", gx:bx, gy:by, age:0, duree:0.36 });
            jeu.effets.push({ t:"onde", gx:bx, gy:by, age:0, duree:0.28, r:0.9 });
            jeu.secousse = Math.min(6, jeu.secousse + 0.8);
            if(son.impactObus) son.impactObus();
          }
        }
        else{
          /* ceinture et bretelles : la cible est déjà lâchée dès
             qu'elle entre dans la fumée, mais si elle s'y glisse à
             l'image même de l'impact, la roquette ne la touche pas */
          /* precision:1 — c'est ce drapeau, et lui seul, qui déclenche
             la vulnérabilité de l'Ogre. Il est posé sur le coup au but
             ET sur le souffle : une roquette qui éclate à côté de lui
             doit faire mal elle aussi. */
          if(p.cible && p.cible.pv > 0 && !masquee(p.cible)) toucheUnite(p.cible, p.degats, { arme:"precision" });
          else degatsZone(bx, by, 0.8, p.degats, { epargneCachees:1, arme:"precision" });
        }
        if(p.t === "roquette"){
          /* une roquette qui pique du ciel doit marquer le sol : boule
             de feu plus franche, anneau de souffle, gerbe de sable */
          jeu.effets.push({ t:"boum", gx:bx, gy:by, age:0, duree:0.6, r:1.15, force:0.9 });
          jeu.effets.push({ t:"onde", gx:bx, gy:by, age:0, duree:0.4, r:1.7 });
          jeu.effets.push({ t:"impact", gx:bx + (Math.random() - 0.5) * 0.9,
                            gy:by + (Math.random() - 0.5) * 0.9, age:0, duree:0.35 });
        }else if(p.t !== "obusTank"){
          jeu.effets.push({ t:"boum", gx:bx, gy:by, age:0, duree:0.5, r:0.9, force:0.6 });
        }
        /* L'OBUS DE CHAR A DÉJÀ SON IMPACT, et il n'en veut pas deux.
           Il pousse son propre `obusBoum` et son propre son quelques
           lignes plus haut — un choc d'acier, sec et blanc. Le `else`
           générique lui ajoutait par-dessus la boule de feu orange
           d'une roquette, et `son.boum` par-dessus son claquement :
           deux explosions superposées à chaque coup, sur quatorze
           chars qui tirent toutes les quatre secondes. On entendait
           que quelque chose n'allait pas avant de pouvoir le nommer. */
        if(p.t !== "obusTank") son.boum(0.3);
        jeu.projectiles.splice(i, 1);
        continue;
      }
      p.gx += dx / d * pas; p.gy += dy / d * pas;
      /* Vol en cloche de la roquette de Frelon : elle part de la rampe
         (34 px), grimpe jusqu'à SON apogée puis pique sur la cible. Le
         guidage reste au sol — seule la hauteur dessinée suit la
         cloche, l'équilibrage n'y voit que du feu. Si la cible fuit et
         rallonge le vol, la roquette reste en descente rasante. */
      if(p.t === "roquette" && p.vol){
        var tz = Math.min(1, p.age / p.vol);
        p.z = (1 - tz) * 34 + Math.sin(tz * Math.PI) * p.apogee;
        p.tr.push(p.gx, p.gy, p.z);
        /* une demi-seconde de fumée derrière chaque roquette : c'est la
           traînée qui rend la trajectoire lisible dans le ciel */
        if(p.tr.length > 96) p.tr.splice(0, 3);
      }
    }else if(p.t === "viper"){
      var tv = p.age / p.duree;
      if(tv >= 1){
        degatsZoneEnnemis(p.cx, p.cy, p.zone, p.degats);
        degatsZone(p.cx, p.cy, p.zone, p.degats * 0.5);
        jeu.effets.push({ t:"boum", gx:p.cx, gy:p.cy, age:0, duree:0.8, r:p.zone * 1.6, force:1.4 });
        jeu.crateres.push({ gx:p.cx, gy:p.cy, r:p.zone * 0.7 });
        jeu.secousse = Math.min(14, jeu.secousse + 7);
        son.boum(0.95);
        jeu.projectiles.splice(i, 1);
        continue;
      }
      p.gx = p.x0 + (p.cx - p.x0) * tv;
      p.gy = p.y0 + (p.cy - p.y0) * tv;
      p.z = p.haut * (1 - tv) * (1 - tv);
    }else if(p.t === "nova"){
      var tn = p.age / p.duree;
      if(tn >= 1){
        explosionNova(p.cx, p.cy, p.distante);
        jeu.projectiles.splice(i, 1);
        continue;
      }
      p.gx = p.x0 + (p.cx - p.x0) * tn;
      p.gy = p.y0 + (p.cy - p.y0) * tn;
      p.z = p.haut * (1 - tn) * (1 - tn);
    }else if(p.t === "bombe" || p.t === "bobine"){
      var t = p.age / p.duree;
      if(t >= 1){
        if(p.t === "bombe"){
          if(p.allie) degatsZoneEnnemis(p.cx, p.cy, p.zone, p.degats);
          if(!p.allie || p.tousCamps)
            degatsZone(p.cx, p.cy, p.zone, p.degats,
                       (p.allie || p.braise) ? undefined
                         : { epargneCachees:1, arme:p.mortier ? "mortier" : "" });
          if(p.braise) jeu.flaques.push({ gx:p.cx, gy:p.cy, r:1.5, age:0, duree:EQ.QG_FLAQUE_DUREE });
          jeu.effets.push({ t:"boum", gx:p.cx, gy:p.cy, age:0,
                            duree:p.salve ? 0.85 : 0.62,
                            r:p.zone * (p.salve ? 1.5 : 1), force:p.salve ? 1.4 : 1 });
          jeu.crateres.push({ gx:p.cx, gy:p.cy, r:p.zone * 0.55 });
          if(jeu.crateres.length > 160) jeu.crateres.shift();
          /* Anneau de souffle au sol : c'est lui qui dit « obus » plutôt
             que « boule de feu ». Il reste discret pour un tir de Pilon
             et s'élargit franchement pour une Salve. */
          jeu.effets.push({ t:"onde", gx:p.cx, gy:p.cy, age:0,
                            duree:p.salve ? 0.55 : 0.42,
                            r:p.zone * (p.salve ? 2.2 : 1.5) });
          if(p.salve){
            /* onde au sol + gerbe de sable : quelque chose de lourd
               vient de tomber du ciel */
            for(var ge = 0; ge < 7; ge++){
              var age2 = Math.random() * 6.2832, rge = Math.random() * p.zone * 0.9;
              jeu.effets.push({ t:"impact",
                gx:p.cx + Math.cos(age2) * rge, gy:p.cy + Math.sin(age2) * rge,
                age:0, duree:0.4 });
            }
            jeu.secousse = Math.min(12, jeu.secousse + 3);
          }
          son.boum(p.salve ? 0.7 : 0.42);
        }else{
          degatsZone(p.cx, p.cy, p.zone, p.degats,
                     { ralenti:p.ralenti, type:"elec", epargneCachees:1 });
          jeu.effets.push({ t:"eclair", gx:p.cx, gy:p.cy, age:0, duree:0.42, r:p.zone });
          son.bobine();
        }
        jeu.projectiles.splice(i, 1);
        continue;
      }
      p.gx = p.x0 + (p.cx - p.x0) * t;
      p.gy = p.y0 + (p.cy - p.y0) * t;
      p.z = (p.haut || 30) * 4 * t * (1 - t);
    }
  }
}

/* ---------------------------------------------------------------
   Créatures
   --------------------------------------------------------------- */
function majCreatures(dt, tps){
  for(var i = 0; i < jeu.creatures.length; i++){
    var k = jeu.creatures[i];
    if(k.pv <= 0) continue;
    var f = CRE[k.t];
    /* cible : l'unité la plus proche dans le rayon de détection */
    k.minuteur -= dt;
    if(k.minuteur <= 0){
      k.minuteur = 0.35 + Math.random() * 0.3;
      unitesAutour(k.gx, k.gy, f.detection, tmpUni);
      var md = 1e9, best = null;
      for(var j = 0; j < tmpUni.length; j++){
        /* Cachée veut dire cachée de TOUT : les créatures ne voient pas
           plus dans la fumée que les tourelles. Sans ça un Braisard
           serait venu cogner une troupe qui, elle, a ordre de ne pas
           riposter — la fumée l'aurait condamnée au lieu de la
           protéger. Gégé et Tweety cessent aussi de fuir : elles ne
           repèrent plus personne. */
        if(masquee(tmpUni[j])) continue;
        var d2 = Math.hypot(tmpUni[j].gx - k.gx, tmpUni[j].gy - k.gy);
        if(d2 < md){ md = d2; best = tmpUni[j]; }
      }
      k.cible = (best && md <= f.detection) ? best : null;
    }
    var c = k.cible;
    /* la proie qui vient d'entrer dans la fumée est perdue de vue tout
       de suite, sans attendre le prochain balayage de détection */
    if(c && (c.pv <= 0 || masquee(c))) c = k.cible = null;

    if(k.t === "belette"){ majBelette(k, f, c, dt); continue; }
    if(k.t === "tweety"){ majTweety(k, f, c, dt); continue; }
    if(k.t === "sanglier"){ majSanglier(k, f, c, dt); continue; }
    if(k.t === "crapaud"){ majCrapaud(k, f, c, dt, tps); continue; }

    if(c){
      var dx = c.gx - k.gx, dy = c.gy - k.gy, d = Math.hypot(dx, dy);
      k.droite = (dx - dy) > 0;
      if(d > f.portee){
        deplaceCreature(k, dx, dy, f.vitesse * dt);
        k.phase += dt * (k.t === "piqueur" ? 14 : 9);
      }else{
        k.prochainTir -= dt * 1000;
        if(k.prochainTir <= 0){
          k.prochainTir = f.cadence;
          /* arme:"bete" — LE DRAPEAU DES BESTIOLES. Il ne change rien
             pour personne, sauf pour le Tank, qui porte vuln.bete = 0.
             Un blindé n'a rien à craindre d'un Braisard ni d'un
             Piqueur, et c'est ici que ça se décide : au point où la
             bestiole frappe, pas dans une liste d'exceptions ailleurs. */
          toucheUnite(c, f.degats,
                      k.t === "braisard" ? { brulure:0, arme:"bete" } : { arme:"bete" });
          if(k.t === "braisard"){
            jeu.effets.push({ t:"cone", gx:k.gx, gy:k.gy, ang:Math.atan2(dy, dx),
                              portee:f.portee, ouv:0.4, age:0, duree:0.18 });
          }else{
            jeu.effets.push({ t:"piqure", gx:c.gx, gy:c.gy, age:0, duree:0.2 });
          }
        }
      }
    }else{
      /* patrouille : retour au poste */
      var rx = k.ox - k.gx, ry = k.oy - k.gy, rd = Math.hypot(rx, ry);
      if(rd > 1.2){
        deplaceCreature(k, rx, ry, f.vitesse * 0.6 * dt);
        k.phase += dt * 5;
        k.droite = (rx - ry) > 0;
      }else{
        k.phase += dt * 1.4;
      }
    }
  }
}
function deplaceCreature(k, dx, dy, pas){
  var l = Math.hypot(dx, dy); if(l < 1e-6) return;
  var nx = k.gx + dx / l * pas, ny = k.gy + dy / l * pas;
  if(!bloque(nx, k.gy)) k.gx = nx;
  if(!bloque(k.gx, ny)) k.gy = ny;
}
/* Tweety : il alterne les postures. Posé, il sautille et picore ; on
   approche, il décolle en flèche ; puis il plane et redescend se poser
   un peu plus loin. L'altitude (k.z) est ce qui le distingue de tout le
   reste du bestiaire — elle sert au dessin et à son ombre. */
function majTweety(k, f, c, dt){
  k.z = k.z || 0;
  k.butT = (k.butT || 0) - dt;

  if(c){
    /* effarouché : décollage immédiat, à l'opposé et bien haut */
    var dx = k.gx - c.gx, dy = k.gy - c.gy;
    var d = Math.hypot(dx, dy) || 1;
    k.etat = "envol";
    k.z = Math.min(34, k.z + 58 * dt);
    var a = Math.atan2(dy, dx) + Math.sin(jeu.tps * 1.7 + k.n) * 0.45;
    deplaceCreature(k, Math.cos(a), Math.sin(a), f.vitesse * dt);
    k.phase += dt * 26;                       // battement d'ailes rapide
    k.droite = (Math.cos(a) - Math.sin(a)) > 0;
    k.butT = 1.6;
    return;
  }

  if(k.butT <= 0 || !k.but){
    /* il choisit un nouveau perchoir, ou décide de picorer sur place */
    if(k.etat === "vol" || Math.random() < 0.55){
      k.etat = "pose";
      k.butT = 2.4 + Math.random() * 4.5;
      k.but = null;
    }else{
      k.etat = "vol";
      k.butT = 1.8 + Math.random() * 2.6;
      k.but = { gx:borne(k.ox + (Math.random() - 0.5) * 22, 4, PLAGE_X0 - 3),
                gy:borne(k.oy + (Math.random() - 0.5) * 22, 4, GH - 5) };
    }
  }

  if(k.etat === "vol" && k.but){
    var vx = k.but.gx - k.gx, vy = k.but.gy - k.gy;
    var dv = Math.hypot(vx, vy);
    k.z = Math.min(26, k.z + 42 * dt);
    if(dv > 0.4){
      deplaceCreature(k, vx, vy, f.vitesse * 0.62 * dt);
      k.droite = (vx - vy) > 0;
    }else{ k.but = null; k.butT = 0; }
    k.phase += dt * 20;
    return;
  }

  /* posé : il redescend, puis sautille et picore */
  k.z = Math.max(0, k.z - 46 * dt);
  k.phase += dt * (k.z > 0.5 ? 20 : 5.5);
}

/* Gégé : elle vaque à ses affaires et détale dès qu'on approche. */
function majBelette(k, f, c, dt){
  if(c){
    var dx = k.gx - c.gx, dy = k.gy - c.gy;
    var d = Math.hypot(dx, dy) || 1;
    k.etat = "fuite";
    /* elle fuit en s'écartant un peu, pas en ligne droite */
    var a = Math.atan2(dy, dx) + Math.sin(jeu.tps * 2.2 + k.n) * 0.5;
    deplaceCreature(k, Math.cos(a), Math.sin(a), f.vitesse * dt);
    k.phase += dt * 17;
    k.droite = (Math.cos(a) - Math.sin(a)) > 0;
    k.minuteur2 = 2.2;
    return;
  }
  k.etat = (k.minuteur2 > 0) ? "trot" : "flane";
  if(k.minuteur2 > 0) k.minuteur2 -= dt;
  /* flânerie : elle se choisit un but toutes les quelques secondes */
  k.butT = (k.butT || 0) - dt;
  if(k.butT <= 0 || !k.but){
    k.butT = 2.5 + Math.random() * 4;
    k.but = { gx:borne(k.ox + (Math.random() - 0.5) * 14, 3, PLAGE_X0 - 2),
              gy:borne(k.oy + (Math.random() - 0.5) * 14, 3, GH - 3) };
    if(Math.random() < 0.3) k.but = null;          // parfois elle s'arrête et renifle
  }
  if(k.but){
    var bx = k.but.gx - k.gx, by = k.but.gy - k.gy;
    var bd = Math.hypot(bx, by);
    if(bd > 0.5){
      deplaceCreature(k, bx, by, f.vitesse * (k.etat === "trot" ? 0.55 : 0.32) * dt);
      k.phase += dt * (k.etat === "trot" ? 11 : 7);
      k.droite = (bx - by) > 0;
    }else k.but = null;
  }else{
    k.phase += dt * 1.6;
  }
}
function majSanglier(k, f, c, dt){
  if(k.etat === "charge"){
    k.chargeT -= dt;
    deplaceCreature(k, Math.cos(k.ang), Math.sin(k.ang), f.vitesseCharge * dt);
    k.phase += dt * 16;
    unitesAutour(k.gx, k.gy, 1.2, tmpUni);
    for(var i = 0; i < tmpUni.length; i++){
      var u = tmpUni[i];
      if(u.touchePar === k.n) continue;
      if(Math.hypot(u.gx - k.gx, u.gy - k.gy) < 1.1){
        u.touchePar = k.n;
        /* LA CHARGE DU SANGLIER. Elle porte le même drapeau que les
           autres bestioles : soixante-dix points contre une Furie,
           zéro contre un char. La POUSSÉE, elle, s'applique quand
           même — quatre cents kilos lancés à quatre cases par
           seconde bousculent tout, blindé compris. Ce n'est pas une
           blessure, c'est de la mécanique. */
        toucheUnite(u, f.degats, { arme:"bete",
                                   pousse:{ x:Math.cos(k.ang) * 2.4, y:Math.sin(k.ang) * 2.4 } });
      }
    }
    if(k.chargeT <= 0){ k.etat = "retourne"; k.minuteur2 = 1.6; }
  }else if(k.etat === "retourne"){
    k.minuteur2 -= dt;
    k.phase += dt * 2;
    if(k.minuteur2 <= 0) k.etat = "repos";
  }else{
    if(c){
      var d = Math.hypot(c.gx - k.gx, c.gy - k.gy);
      k.ang = Math.atan2(c.gy - k.gy, c.gx - k.gx);
      k.droite = (Math.cos(k.ang) - Math.sin(k.ang)) > 0;
      if(d < f.detection){
        k.etat = "charge";
        k.chargeT = f.charge / f.vitesseCharge;
        for(var m = 0; m < jeu.unites.length; m++) jeu.unites[m].touchePar = -1;
        son.grogne();
      }
    }else{
      var rx = k.ox - k.gx, ry = k.oy - k.gy;
      if(Math.hypot(rx, ry) > 1.4){ deplaceCreature(k, rx, ry, f.vitesse * dt); k.phase += dt * 3; }
      else k.phase += dt * 1.2;
    }
  }
}
function majCrapaud(k, f, c, dt, tps){
  if(c){
    var d = Math.hypot(c.gx - k.gx, c.gy - k.gy);
    k.droite = (c.gx - k.gx - (c.gy - k.gy)) > 0;
    if(d <= f.portee){
      k.prochainTir -= dt * 1000;
      k.gonfle = Math.min(1, k.gonfle + dt * 1.4);
      if(k.prochainTir <= 0){
        k.prochainTir = f.cadence;
        k.gonfle = 0;
        jeu.glu.push({ gx:c.gx, gy:c.gy, r:1.6, age:0, duree:f.dureeRalenti + 2 });
        jeu.effets.push({ t:"crachat", gx:k.gx, gy:k.gy, ex:c.gx, ey:c.gy, age:0, duree:0.35 });
      }
    }else k.gonfle = Math.max(0, k.gonfle - dt);
  }else k.gonfle = Math.max(0, k.gonfle - dt);
}

/* ---------------------------------------------------------------
   Zones persistantes : glu, flaques enflammées, fumigènes, soin
   --------------------------------------------------------------- */
function majZones(dt){
  var i;
  for(i = jeu.glu.length - 1; i >= 0; i--){
    var g = jeu.glu[i]; g.age += dt;
    if(g.age > g.duree){ jeu.glu.splice(i, 1); continue; }
    var t = [];
    unitesAutour(g.gx, g.gy, g.r, t);
    for(var k = 0; k < t.length; k++){
      if(Math.hypot(t[k].gx - g.gx, t[k].gy - g.gy) <= g.r){
        t[k].ralenti = Math.max(t[k].ralenti, 0.4); t[k].ralentiType = "glu";
      }
    }
  }
  for(i = jeu.flaques.length - 1; i >= 0; i--){
    var fl = jeu.flaques[i]; fl.age += dt;
    if(fl.age > fl.duree){ jeu.flaques.splice(i, 1); continue; }
    if(fl.veng) brulureVengeance(fl, dt);
    else degatsZone(fl.gx, fl.gy, fl.r, EQ.QG_FLAQUE_DPS * dt);
  }
  for(i = jeu.brouillards.length - 1; i >= 0; i--){
    jeu.brouillards[i].age += dt;
    if(jeu.brouillards[i].age > jeu.brouillards[i].duree){
      reveleZone(jeu.brouillards[i]);
      jeu.brouillards.splice(i, 1);
    }
  }
  for(i = jeu.soin.length - 1; i >= 0; i--){
    var s = jeu.soin[i]; s.age += dt;
    if(s.age > s.duree){ jeu.soin.splice(i, 1); continue; }
    var t2 = [];
    unitesAutour(s.gx, s.gy, s.r, t2);
    for(var m = 0; m < t2.length; m++){
      var u = t2[m];
      if(u.leurre) continue;
      if(Math.hypot(u.gx - s.gx, u.gy - s.gy) <= s.r){
        u.pv = Math.min(u.pvMax, u.pv + CAP.soin.pvParSeconde * dt);
        if(u.brulure > 0) u.brulure = Math.max(0, u.brulure - dt * 2);
      }
    }
  }
  for(i = jeu.cryos.length - 1; i >= 0; i--){
    jeu.cryos[i].age += dt;
    if(jeu.cryos[i].age > jeu.cryos[i].duree) jeu.cryos.splice(i, 1);
  }
  /* ════════════════════════════════════════════════════════════
     UNE BALISE POSÉE SUR UN OBJECTIF NE MEURT PAS À L'HEURE

     « Quand je fixe le générateur, après ça commence à détruire
     toutes les défenses à côté. Non : les troupes focus la défense
     qui est sur ma balise et détruisent CELLE-LÀ en priorité. Puis
     alors après, ça pète les défenses aux alentours. »

     MESURÉ, SUR SA SCÈNE. Vingt Furies, une balise posée sur une
     cellule électrique — deux cent mille points de vie. Pendant
     trente secondes, vingt sur vingt tapaient dessus et pas une
     seule voisine n'était touchée : la priorité marchait. À la
     trente-et-unième la balise expirait, l'ordre tombait, et cinq
     secondes plus tard quinze des vingt étaient parties sur les
     voisines. Le réacteur avait perdu neuf pour cent de sa vie.
     Trente secondes ne suffisent à abattre que les petites défenses,
     et c'est très exactement pour les grosses qu'on pose une balise
     dessus.

     LA MINUTERIE GOUVERNE LE RALLIEMENT, PAS LE FOCUS. Posée au sol,
     la balise est un point de rendez-vous et trente secondes sont
     largement assez. Posée sur une cible, elle est un ORDRE, et un
     ordre se termine quand il est exécuté : la cible tombe, et
     `jeu.balise` est mise à null au même endroit que toutes les
     autres morts de bâtiment — les troupes reprennent alors leur
     ciblage normal, c'est-à-dire les défenses aux alentours.
     ════════════════════════════════════════════════════════════ */
  /* ════════════════════════════════════════════════════════════
     PLUS DE CHRONO : ELLE TIENT JUSQU'À CE QU'ON Y SOIT

     « Coupe le chrono. Les troupes vont jusque-là, on n'est pas
     obligé de recharger : on peut envoyer une seule balise qui fait
     toute la carte, les troupes ne s'arrêteront jamais tant qu'elles
     ne passent pas la balise. »

     LES TRENTE SECONDES ÉTAIENT UNE DURÉE DE VIE, ET C'EST CE QUI
     CLOCHAIT. Une balise n'est pas un effet qui s'use, c'est un
     ORDRE : il se termine quand il est exécuté, pas quand une
     horloge le décide. Posée à l'autre bout de l'île, elle expirait
     en chemin et la troupe s'arrêtait là où elle en était.

     ELLE MEURT DONC DE DEUX FAÇONS, ET DE DEUX SEULEMENT : sa cible
     tombe (traité avec les autres morts de bâtiment), ou plus
     personne ne la porte — c'est-à-dire que tout le monde est arrivé.
     Chaque unité rend son ordre en franchissant la zone, comme avant ;
     quand la dernière l'a rendu, la balise s'éteint d'elle-même. */
  if(jeu.balise){
    var bcv = jeu.balise.cible;
    var viseDebout = bcv && (jeu.balise.surQG ? bcv.pv > 0 : bcv.vivant);
    if(!viseDebout){
      var porteeEncore = 0;
      for(var ib = 0; ib < jeu.unites.length; ib++){
        var ub = jeu.unites[ib];
        if(ub.pv > 0 && ub.baliseOrdre === jeu.balise.id){ porteeEncore = 1; break; }
      }
      if(!porteeEncore){ jeu.balise = null; libereBalise(); }
    }
  }
}

/* ---------------------------------------------------------------
   Le QG : éruptions
   --------------------------------------------------------------- */
function majQG(dt, tps){
  if(jeu.qg.pv <= 0) return;
  var fr = jeu.qg.pv / jeu.qg.pvMax;
  var accel = fr < EQ.QG_SEUIL_FRENESIE ? (1 + EQ.QG_GAIN_FRENESIE) : 1;

  if(jeu.qgTelegraphe > 0){
    jeu.qgTelegraphe -= dt;
    if(jeu.qgTelegraphe <= 0) lanceEruption();
  }else{
    jeu.qgProchaine -= dt * accel;
    if(jeu.qgProchaine <= 0 && jeu.unites.length > 0){
      jeu.qgTelegraphe = EQ.QG_TELEGRAPHE;
      jeu.qgForme = Math.random() < 0.5 ? 0 : 1;
      jeu.qgProchaine = EQ.QG_ERUPTION_MIN + Math.random() * (EQ.QG_ERUPTION_MAX - EQ.QG_ERUPTION_MIN);
      montreAlerte(jeu.qgForme === 0 ? "⚠ PLUIE DE BRAISE ⚠" : "⚠ VAGUE DE FEU ⚠");
      son.telegraphe();
    }else if(jeu.qgProchaine <= 0){
      jeu.qgProchaine = 3;
    }
  }

  /* vague de feu en cours */
  if(jeu.vague){
    var v = jeu.vague;
    var r0 = v.r;
    v.r += EQ.QG_VAGUE_VITESSE * dt;
    for(var i = 0; i < jeu.unites.length; i++){
      var u = jeu.unites[i];
      if(u.vagueVue === v.id) continue;
      var d = Math.hypot(u.gx - jeu.qg.gx, u.gy - jeu.qg.gy);
      if(d >= r0 && d < v.r){
        u.vagueVue = v.id;
        toucheUnite(u, EQ.QG_VAGUE_DEGATS);
      }
    }
    if(v.r > EQ.QG_VAGUE_PORTEE) jeu.vague = null;
  }
}
function lanceEruption(){
  cacheAlerte();
  if(jeu.qgForme === 0){
    var n = EQ.QG_PLUIE_MIN + ((Math.random() * (EQ.QG_PLUIE_MAX - EQ.QG_PLUIE_MIN + 1)) | 0);
    for(var i = 0; i < n; i++){
      var a = Math.random() * 6.2832;
      var r = 3 + Math.random() * EQ.QG_PLUIE_RAYON;
      var cx = jeu.qg.gx + Math.cos(a) * r, cy = jeu.qg.gy + Math.sin(a) * r;
      jeu.projectiles.push({ t:"bombe", gx:jeu.qg.gx, gy:jeu.qg.gy, x0:jeu.qg.gx, y0:jeu.qg.gy,
        cx:cx, cy:cy, duree:0.9 + Math.random() * 0.9 + i * 0.035, age:0,
        degats:46, zone:1.4, haut:70, braise:1 });
    }
    son.boum(1.0);
  }else{
    jeu.vague = { r:2, id:Math.random() };
    son.boum(1.35);
  }
  jeu.secousse = Math.min(14, jeu.secousse + 7);
}

/* ---------------------------------------------------------------
   Capacités
   --------------------------------------------------------------- */
/* La Nova ne se paie pas en Énergie : on en a UNE par vie, point.
   C'est ce qui la garde rare, et ce qui rend son emploi mémorable. Ce
   qui monte avec les paliers, c'est son CALIBRE — voir calibreNova(). */
function capaciteDisponible(m){
  if(m === "nova") return jeu.novaDispo > 0;
  return jeu.energie >= coutActuel(m, jeu.usages);
}
function armeCapacite(m){
  if(!capaciteDisponible(m)){
    message(m === "nova" ? "Nova déjà employée : il faut une nouvelle vie."
                         : "Pas assez d'Énergie pour " + COUT[m].nom + ".");
    return;
  }
  jeu.capArmee = (jeu.capArmee === m) ? null : m;
  majMenu();
  if(jeu.capArmee) son.gong();
}
function utiliseCapacite(m, gx, gy){
  if(!capaciteDisponible(m)){
    jeu.capArmee = null;
    majMenu();
    message(m === "nova" ? "Nova déjà employée pendant cette vie."
                         : "Plus assez d'Énergie : " + COUT[m].nom + " désarmée.");
    return;
  }
  if(m === "nova") jeu.novaDispo--;
  else jeu.energie -= coutActuel(m, jeu.usages);
  jeu.usages[m]++;

  if(m === "balise"){
    /* Sur quoi la fusée est-elle tombée ? Le BRASIER d'abord — il est
       énorme et prioritaire : posée dessus, la Balise doit lancer
       l'assaut du QG, pas envoyer les troupes s'entasser contre ses
       murs en essayant d'entrer. Un bâtiment ensuite. Sinon, c'est un
       simple point de ralliement au sol. */
    var vise = null, surQG = 0, mdv = 1e9;
    if(Math.hypot(gx - jeu.qg.gx, gy - jeu.qg.gy) <= RAYON_QG + 2.5 && jeu.qg.pv > 0){
      vise = jeu.qg; surQG = 1;
    }else{
      batimentsAutour(gx, gy, 3, tmpBat);
      for(var v = 0; v < tmpBat.length; v++){
        var bv = tmpBat[v];
        var dv = Math.hypot(bv.gx - gx, bv.gy - gy);
        if(dv <= bv.e * 0.62 + 0.5 && dv < mdv){ mdv = dv; vise = bv; }
      }
    }
    jeu.idBalise = (jeu.idBalise || 0) + 1;
    /* `reste` et `duree` ne servent plus à l'expiration — ils restent
       pour les repères d'écran, qui savent depuis quand elle est
       posée. */
    jeu.balise = { gx:gx, gy:gy, reste:CAP.balise.duree, duree:CAP.balise.duree,
                   id:jeu.idBalise, cible:vise, surQG:surQG, tps:jeu.tps };
    /* L'ordre est donné à CHAQUE unité vivante, une par une. Il écrase
       le ciblage en cours : aucune ne doit continuer à taper une
       défense proche tant qu'elle n'a pas rejoint la balise. */
    for(var z2 = 0; z2 < jeu.unites.length; z2++){
      jeu.unites[z2].baliseOrdre = jeu.balise.id;
      /* un ordre payé remplace le ralliement gratuit : sans cela, la
         troupe rappelée repartirait vers son sable en arrivant */
      jeu.unites[z2].ral = null;
      jeu.unites[z2].baliseMeilleure = 1e9;
      jeu.unites[z2].baliseStagne = 0;
      jeu.unites[z2].baliseSeuil = 7.0 + Math.random() * 4.0;
      jeu.unites[z2].cible = null;
    }
    jeu.effets.push({ t:"baliseLancee", gx:gx, gy:gy, age:0, duree:0.6 });
    son.balise();

  }else{
    lanceCapacite(m, gx, gy, false);
  }

  /* Les autres joueurs de l'île doivent VOIR cette capacité — et ses
     zones doivent agir chez eux aussi. La Balise, elle, n'ordonne
     qu'à nos propres troupes : rien à montrer. */
  if(m !== "balise") envoie({ t:"cap", m:m, x:gx, y:gy, c:jeu.index });

  demandeMajBarres();
  majMenu();
  if(!capaciteDisponible(m)){
    jeu.capArmee = null;
    majMenu();
    if(m !== "nova") message(COUT[m].nom + " désarmée : Énergie insuffisante.");
  }
}

/* Fait exister une capacité sur le terrain. `distante` distingue la
   nôtre de celle d'un AUTRE joueur du salon : la sienne est montrée à
   l'identique et ses ZONES agissent pour de vrai — son Cryo gèle nos
   défenses simulées, son Brouillard cache nos troupes, son Soin les
   répare, ses Poulets détournent les tourelles — mais elle n'inflige
   AUCUN dégât local. Ses dégâts à lui voyagent déjà par « deg » et
   « det » : les rejouer ici les compterait deux fois. */
function lanceCapacite(m, gx, gy, distante){
  if(m === "brouillard"){
    jeu.brouillards.push({ gx:gx, gy:gy, r:CAP.brouillard.rayon, age:0, duree:CAP.brouillard.duree });
    son.brouillard();

  }else if(m === "soin"){
    jeu.soin.push({ gx:gx, gy:gy, r:CAP.soin.rayon, age:0, duree:CAP.soin.duree });
    son.soin();

  }else if(m === "cryo"){
    jeu.cryos.push({ gx:gx, gy:gy, r:CAP.cryo.rayon, age:0, duree:CAP.cryo.duree });
    /* les tourelles prises dans la glace lâchent leur cible sur-le-champ */
    var bs = [];
    batimentsAutour(gx, gy, CAP.cryo.rayon + 2, bs);
    for(var k = 0; k < bs.length; k++){
      if(Math.hypot(bs[k].gx - gx, bs[k].gy - gy) <= CAP.cryo.rayon){
        bs[k].cible = null;
        bs[k].prochainTir = Math.max(bs[k].prochainTir, 200);
      }
    }
    jeu.effets.push({ t:"cryo", gx:gx, gy:gy, age:0, duree:0.8, r:CAP.cryo.rayon });
    son.cryo();

  }else if(m === "poulets"){
    /* dix leurres : les défenses les prennent pour des troupes */
    for(var q = 0; q < CAP.poulets.nb; q++){
      var ap = q / CAP.poulets.nb * 6.2832 + Math.random();
      var rp = Math.random() * CAP.poulets.rayon;
      creePoulet(gx + Math.cos(ap) * rp, gy + Math.sin(ap) * rp);
    }
    jeu.effets.push({ t:"caisse", gx:gx, gy:gy, age:0, duree:0.7 });
    son.poulets();

  }else if(m === "viper"){
    /* un seul missile, très rapide, arrivée quasi verticale */
    jeu.projectiles.push({
      t:"viper", gx:gx - 5.5, gy:gy - 5.5, x0:gx - 5.5, y0:gy - 5.5,
      cx:gx, cy:gy, age:0, duree:Math.max(0.45, 9 / CAP.viper.vitesse),
      degats:distante ? 0 : CAP.viper.degats, zone:CAP.viper.rayon, haut:230, fumee:[]
    });
    jeu.effets.push({ t:"frappe", gx:gx, gy:gy, age:0, duree:0.5 });
    son.viper();

  }else if(m === "salve"){
    /* plusieurs missiles presque simultanés, impacts dispersés :
       ils touchent bâtiments, créatures ET troupes, alliées comprises */
    for(var i = 0; i < CAP.salve.nb; i++){
      var a = Math.random() * 6.2832, r = Math.sqrt(Math.random()) * CAP.salve.rayon;
      /* Ils partent de haut et de loin, et retombent en piqué : on doit
         VOIR quelque chose tomber du ciel, pas une explosion qui naît
         au sol. La hauteur de cloche est franche, et les départs sont
         échelonnés pour que la salve dure. */
      var ad = Math.random() * 6.2832;
      jeu.projectiles.push({
        t:"bombe", salve:1,
        gx:gx + Math.cos(ad) * 26, gy:gy + Math.sin(ad) * 26 - 22,
        x0:gx + Math.cos(ad) * 26, y0:gy + Math.sin(ad) * 26 - 22,
        cx:gx + Math.cos(a) * r, cy:gy + Math.sin(a) * r,
        duree:0.75 + i / CAP.salve.nb * CAP.salve.duree, age:0,
        degats:distante ? 0 : CAP.salve.degats, zone:CAP.salve.zone, haut:150,
        allie:1, tousCamps:1
      });
    }
    son.salve();

  }else if(m === "nova"){
    /* gros spectacle, dégâts mesurés */
    jeu.projectiles.push({
      t:"nova", gx:gx - 3, gy:gy - 9, x0:gx - 3, y0:gy - 9,
      cx:gx, cy:gy, age:0, duree:1.15, haut:300, distante:distante ? 1 : 0
    });
    son.nova();
  }
}

/* --------------- Nova : le champignon --------------- */
function explosionNova(gx, gy, distante){
  var C = CAP.nova;
  /* LES TROIS CALIBRES — ordinaire, super à trois millions, plein
     calibre à cinq. Ils ne changent que le côté ENNEMI : les dégâts du
     cœur, ceux du souffle, et le rayon. RIEN côté allié, ni les
     dégâts ni le rayon : une troupe qui était hors de portée avant ne
     doit pas se mettre à mourir parce que le joueur a progressé, et
     sans cette dissymétrie la super Nova tuerait tout le débarquement
     à chaque emploi. */
  /* LES DÉGÂTS, ET PLUS LE PALIER : la Nova a ses propres seuils
     depuis que le barème de puissance plafonne à un million. Et
     depuis le verrou de chantier, les dégâts ne suffisent plus : il
     faut aussi que l'île soit démontée — voir calibreNovaCourant. */
  var cal = calibreNovaCourant();
  var sup = cal.rang > 0;
  var rC = C.rayon * cal.ech, rS = C.rayonSouffle * cal.ech;
  if(!distante){
    /* cœur : tout ce qui traîne dedans prend cher, alliés compris */
    degatsZoneEnnemis(gx, gy, rC, cal.degats);
    degatsZone(gx, gy, C.rayon, C.degats);
    /* souffle : plus large, beaucoup plus doux */
    degatsZoneEnnemis(gx, gy, rS, cal.souffle);
    degatsZone(gx, gy, C.rayonSouffle, C.degatsSouffle);
  }
  jeu.effets.push({ t:"nova", gx:gx, gy:gy, age:0,
                    duree:sup ? 4.2 : 3.2, r:rC, sup:sup ? 1 : 0 });
  jeu.crateres.push({ gx:gx, gy:gy, r:rC * 0.75 });
  if(jeu.crateres.length > 160) jeu.crateres.shift();
  jeu.secousse = 22;
  son.boum(1.9);
}

/* --------------- Les poulets leurres --------------- */
function creePoulet(gx, gy){
  jeu.poulets.push({
    t:"poulet", leurre:1, gx:borne(gx, 1, GW - 1), gy:borne(gy, 1, GH - 1),
    pv:CAP.poulets.pv, pvMax:CAP.poulets.pv, reste:CAP.poulets.duree,
    phase:Math.random() * 6.2832, droite:Math.random() < 0.5,
    but:null, butT:0, n:jeu.nSuiv++, brulure:0, ralenti:0, ralentiType:"",
    pousse:{ x:0, y:0 }
  });
}
function majPoulets(dt){
  for(var i = jeu.poulets.length - 1; i >= 0; i--){
    var p = jeu.poulets[i];
    p.reste -= dt;
    if(p.brulure > 0){ p.brulure -= dt; p.pv -= EQ.BRULURE_DPS * dt; }
    if(p.ralenti > 0) p.ralenti -= dt;
    if(p.pv <= 0 || p.reste <= 0){
      jeu.effets.push({ t:"plumes", gx:p.gx, gy:p.gy, age:0, duree:0.8 });
      if(p.pv <= 0) son.poulet();
      jeu.poulets.splice(i, 1);
      continue;
    }
    /* ils détalent au hasard : c'est tout l'intérêt du leurre */
    p.butT -= dt;
    if(p.butT <= 0 || !p.but){
      p.butT = 0.5 + Math.random() * 1.1;
      var a = Math.random() * 6.2832, r = 1.5 + Math.random() * 3;
      p.but = { gx:p.gx + Math.cos(a) * r, gy:p.gy + Math.sin(a) * r };
    }
    var dx = p.but.gx - p.gx, dy = p.but.gy - p.gy;
    var d = Math.hypot(dx, dy);
    if(d > 0.25){
      deplaceCreature(p, dx, dy, 2.3 * (p.ralenti > 0 ? 0.45 : 1) * dt);
      p.phase += dt * 16;
      p.droite = (dx - dy) > 0;
    }else p.but = null;
  }
}

/* Une défense prise dans le Cryo ne tire plus du tout */
function geleeParCryo(b){
  for(var i = 0; i < jeu.cryos.length; i++){
    var z = jeu.cryos[i];
    if(Math.hypot(b.gx - z.gx, b.gy - z.gy) <= z.r) return true;
  }
  return false;
}

/* ---------------------------------------------------------------
   Mort, fantôme, renaissance
   --------------------------------------------------------------- */
function majMort(dt){
  if(!jeu.mort){
    if(jeu.unites.length === 0 && jeu.barges.length === 0 &&
       jeu.navettes.length === 0 && jeu.tps > 3){
      jeu.mort = true;
      jeu.tempsRenfort = EQ.ATTENTE_RENFORT;
      var p = jeu.dernierePerte || { gx:PLAGE_X0 + 2, gy:GH / 2 };
      jeu.fantome = { gx:p.gx, gy:p.gy, bx:p.gx, by:p.gy, ph:Math.random() * 6, prochain:0, nom:monNom };
      montreBandeauFantome(true);
    }
    return;
  }
  jeu.tempsRenfort -= dt;
  var f = jeu.fantome;
  f.prochain -= dt;
  if(f.prochain <= 0){
    f.prochain = 8 + Math.random() * 7;
    f.bx = borne(f.gx + (Math.random() - 0.5) * 26, 4, GW + 4);
    f.by = borne(f.gy + (Math.random() - 0.5) * 26, 4, GH - 4);
  }
  var dx = f.bx - f.gx, dy = f.by - f.gy, d = Math.hypot(dx, dy);
  if(d > 0.2){ f.gx += dx / d * 0.95 * dt; f.gy += dy / d * 0.95 * dt; }
  majBandeauFantome(jeu.tempsRenfort);
  if(jeu.tempsRenfort <= 0){
    jeu.mort = false;
    jeu.fantome = null;
    jeu.barges = [];
    for(var i = 0; i < EQ.NB_BARGES; i++)
      jeu.barges.push({ type:compoBarges[i].type, n:compoBarges[i].n, num:i + 1 });
      jeu.bargeSel = 0;
    /* UNE FLOTTE NEUVE, UN HÉROS NEUF. Il se perd comme une troupe :
       il revient donc avec elles, et pas avant. */
    jeu.herosNe = 0; jeu.herosEnRoute = 0; jeu.heros = null;
    jeu.energie += EQ.ENERGIE_BONUS_RENFORT;
    jeu.novaDispo = EQ.NOVA_PAR_VIE;   // une vie neuve, une Nova neuve
    /* Une vie neuve, des tarifs neufs. Chaque emploi d'une capacité en
       renchérit le suivant ; après trois ou quatre morts, la note était
       telle qu'on ne pouvait plus rien lancer du tout. Le compteur
       d'usages repart donc à zéro avec la flotte. */
    for(var cu in jeu.usages) jeu.usages[cu] = 0;
    montreBandeauFantome(false);
    majBarres();
    message("Flotte neuve ! +" + EQ.ENERGIE_BONUS_RENFORT + " d'Énergie, Nova rechargée.");
    son.renfort();
  }
}

/* ---------------------------------------------------------------
   Chute du QG : la séquence finale
   --------------------------------------------------------------- */
/* Qui a le plus contribué ? Le classement local vaut ce que valent les
   messages reçus, mais c'est la même information que le TOP DÉGÂTS que
   tout le monde a sous les yeux depuis le début de la partie. */
/* LE CHAMPION D'UNE ÎLE EST CELUI QUI A LE PLUS FRAPPÉ SUR CETTE ÎLE.

   Il lisait le classement du SALON, c'est-à-dire le total de CARRIÈRE,
   toutes îles confondues. Celui qui avait le plus gros cumul du salon
   était donc sacré même s'il n'avait pas tiré un coup ici — pendant
   que le Top 3, sur la même vignette, comptait bien par carte. Les
   deux se contredisaient à quinze pixels l'un de l'autre.

   Il lit maintenant la même chose que ce Top 3 : totalParJoueurCarte.
   Rien n'est recalculé, rien n'est migré, aucun score ne bouge — on
   change seulement QUEL NOM on lit dans une table qui existait déjà.

   Le repli sur le classement de carrière n'est pas décoratif : sur une
   île où personne n'a encore de contribution enregistrée — le tableau
   partagé n'est publié que toutes les deux secondes —, mieux vaut
   sacrer quelqu'un du salon que « Anonyme ». */
function championDeLaPartie(){
  var par = (typeof totalParJoueurCarte === "function" && typeof scoresAJour === "function")
            ? totalParJoueurCarte(scoresAJour(), jeu.index) : null;
  /* ON NE SACRE PAS UN NOM RETIRÉ. Le badge hors échelle, lui, reste
     éligible — « il peut rester dans le top des maps » —, et c'est
     exactement la différence entre les deux drapeaux. */
  var l = par ? sansRetires(classementDepuis(par),
                            typeof monde !== "undefined" && monde && monde.bo) : null;
  if(l && l.length){
    return { nom:l[0].nom, g:l[0].g, moi:(l[0].nom === monNom) ? 1 : 0 };
  }
  /* Personne sur cette île : on retombe sur le salon, puis sur soi. */
  /* ET ON NE FILTRE PAS LE BADGE D'HONNEUR ICI, contrairement au Top
     carrière. Ce champion-là est celui d'une ÎLE — « il peut rester
     dans le top des maps » —, et ce repli ne sert qu'au cas où personne
     n'a de contribution enregistrée sur celle-ci : retirer le seul nom
     qu'on ait sous la main nous ferait sacrer « Anonyme » la fois où
     c'est justement lui qui vient de tout détruire. */
  var s = (typeof classementSalon === "function") ? classementSalon() : null;
  if(s && s.length) return { nom:s[0].nom, g:s[0].g, moi:s[0].moi };
  return { nom:monNom || "Anonyme", g:jeu.degatsMoi, moi:1 };
}

function declencheFin(){
  jeu.fin = {
    age:0, tete:null, confettis:null, texte:0,
    champion:championDeLaPartie(),
    effondrement:0,          // 0 → 1 : la forteresse s'enfonce et penche
    debris:[], ondes:[], colonne:[],
    /* LA MATIÈRE DE LA DÉSINTÉGRATION. `grains` porte la forteresse
       réduite en poussière — un grain par pixel lu —, `aspires` les
       braises happées pendant le temps suspendu, et `poussiere` dit au
       dessin que la forteresse n'existe plus. */
    grains:null, aspires:[], aspire:0, poussiere:0,
    prochaineFumee:0
  };
  /* On annonce l'île d'APRÈS au sens de la campagne, pas l'index
     suivant : depuis que trois îles vivent après la jungle dans le
     tableau, « + 1 » désignait la carte événement en sortant de la
     cinquième. Quand il n'y a plus d'île après, on n'annonce rien —
     c'est nouvelleCampagneSalon() qui publiera le monde neuf. */
  var apresMoi = carteSuivante(jeu.index);
  if(apresMoi >= 0) envoieCarte(apresMoi);
  /* les panneaux de commande s'effacent : plus rien à commander, et
     ils masqueraient la chute de la forteresse */
  var h = document.getElementById("hud");
  if(h) h.classList.add("fin");
  son.grondement();
}
/* ================================================================
   LA CHUTE DU BRASIER — LE MINUTAGE, ET POURQUOI IL A CHANGÉ

   « Il faut vraiment que ça ait un bel effet… un peu plus
   professionnel, pas un truc en français. Ça ne doit pas faire
   gadget. »

   CE QUI MANQUAIT N'ÉTAIT PAS DE LA MATIÈRE, C'ÉTAIT UN TEMPS. La
   version d'avant enchaînait l'effondrement et la déflagration sans
   respirer : la boule de feu partait sur une image pleine de fumée, de
   débris et de confettis, et rien ne ressortait. Une explosion ne se
   lit pas à sa taille, elle se lit au SILENCE qui la précède.

   On ajoute donc une ASPIRATION : six dixièmes de seconde pendant
   lesquels tout est tiré vers le Brasier — la lumière, les braises, la
   fumée — pendant que l'image s'assombrit et que le son monte. Puis le
   flash. C'est le seul ajout de rythme, et c'est lui qui fait la
   différence entre une explosion et un feu d'artifice.

     0,0 → 2,6   la forteresse s'enfonce, se déchire, fume
     2,6 → 3,2   L'ASPIRATION : tout rentre, l'écran s'éteint
     3,2         LE FLASH, et la forteresse part en pixels
     3,2 → 5,6   la poussière retombe, la boule d'énergie s'ouvre
     4,4 →       le titre, puis le sacre
   ================================================================ */
/* LE FOYER DE LA DÉFLAGRATION, en unités locales de la forteresse. Pas
   son centre géométrique : le cœur du Brasier est au tiers de sa
   hauteur, sous la gardienne, et c'est de là que la matière doit
   partir. Placé au centre, la robe et le visage s'envolaient vers le
   haut pendant que le socle descendait — deux mouvements contraires,
   et l'œil ne savait plus où était l'explosion. */
var PIX_FOYER_Y = -260;

var FIN_EFFONDREMENT = 2.6;      // s : la forteresse s'écroule d'abord
var FIN_ASPIRATION = 0.6;        // s : le temps suspendu avant le coup
var FIN_SOUFFLE = 3.2;           // s : instant de la déflagration

/* ════════════════════════════════════════════════════════════════
   LA FABRIQUE DES GRAINS

   Elle est appelée PENDANT L'ASPIRATION, six dixièmes de seconde avant
   la déflagration, et c'est tout son intérêt : lire les pixels de la
   forteresse et allouer six mille cinq cents objets coûte une
   soixantaine de millisecondes — un hoquet parfaitement visible, et il
   tombait PILE sur l'image qu'on veut la plus nette de la partie.
   Fait ici, il tombe pendant que l'écran s'assombrit et qu'il ne se
   passe rien d'autre.

   Les grains sont fabriqués À L'ARRÊT : leur position est celle du
   pixel, leur vitesse est calculée mais ne s'applique qu'au
   déclenchement. Rien ne bouge avant l'heure.
   ════════════════════════════════════════════════════════════════ */
function fabriqueGrains(){
  var px = (typeof pixelsDuBrasier === "function") ? pixelsDuBrasier() : [];
  var out = [];
  for(var g = 0; g < px.length; g++){
    var P = px[g];
    var ddx = P.lx, ddy = P.ly - PIX_FOYER_Y;
    var dd = Math.hypot(ddx, ddy) || 1;
    var vit = (60 + dd * 1.15) * (0.72 + Math.random() * 0.62);
    out.push({
      x:P.lx, y:P.ly,
      vx:ddx / dd * vit + (Math.random() - 0.5) * 60,
      vy:ddy / dd * vit - 130 - Math.random() * 90,
      r:P.r, v:P.v, b:P.b,
      retard:dd / 1500 * (0.7 + Math.random() * 0.6),
      age:0, duree:1.9 + Math.random() * 1.5
    });
  }
  return out;
}

function majFin(dt){
  var F = jeu.fin;
  F.age += dt;
  var p = jeu.qg;

  /* ---- 0. LA CAMÉRA REVIENT SUR LE BRASIER ----
     C'est le seul moment de la partie qui mérite d'être regardé, et le
     joueur est presque toujours ailleurs quand il tombe — au fond de la
     plage, ou sur la cellule qu'il achevait. On le ramène en douceur,
     sans coupure, et on recule un peu : la déflagration monte très
     haut. Ensuite plus personne ne touche à la caméra. */
  cadreLaFin(dt);

  /* ---- 1. l'effondrement : elle s'enfonce, penche, et se déchire ---- */
  if(F.age < FIN_EFFONDREMENT){
    var t = F.age / FIN_EFFONDREMENT;
    /* courbe accélérée : imperceptible d'abord, brutale à la fin */
    F.effondrement = t * t * t;
    F.prochain = (F.prochain || 0) - dt;
    if(F.prochain <= 0){
      /* les explosions remontent les terrasses au fur et à mesure */
      F.prochain = 0.10 - t * 0.062;
      var a = Math.random() * 6.2832, r = (0.6 + Math.random() * 3.2) * (1 - t * 0.4);
      jeu.effets.push({ t:"boum", gx:p.gx + Math.cos(a) * r, gy:p.gy + Math.sin(a) * r,
                        age:0, duree:0.5 + Math.random() * 0.3,
                        r:0.7 + Math.random() * (0.8 + t * 1.6), force:1 });
      jeu.secousse = Math.min(18, jeu.secousse + 1.0 + t * 4);
      son.boum(0.28 + Math.random() * 0.28 + t * 0.3);
      /* des débris partent déjà, arrachés à la maçonnerie */
      if(Math.random() < 0.5 + t) ajouteDebris(F, 1 + (t * 3 | 0), 0.6 + t);
    }
    /* colonne de fumée qui grossit tout au long de la chute */
    F.prochaineFumee -= dt;
    if(F.prochaineFumee <= 0){
      F.prochaineFumee = 0.12;
      F.colonne.push({ x:(Math.random() - 0.5) * 60, y:0, vy:-38 - Math.random() * 40,
                       r:14 + Math.random() * 22, age:0, duree:3.2 + Math.random() * 2 });
    }
  }

  /* ---- 1 bis. L'ASPIRATION — le temps suspendu ----
     Tout rentre : la fumée redescend vers le foyer, des braises
     convergent, et l'écran s'éteint. C'est le seul moment de la
     séquence où il ne se passe RIEN de bruyant, et c'est lui qui donne
     sa force au coup d'après. */
  if(F.age >= FIN_EFFONDREMENT && F.age < FIN_SOUFFLE){
    var ta = (F.age - FIN_EFFONDREMENT) / FIN_ASPIRATION;
    F.aspire = ta;
    F.effondrement = 1;
    /* la fumée déjà en l'air est happée vers le bas */
    for(var fa = 0; fa < F.colonne.length; fa++){
      var cf = F.colonne[fa];
      cf.vy += 260 * dt;
      cf.x *= 1 - dt * 1.4;
    }
    /* des braises arrivent de partout et convergent sur le foyer */
    F.prochaineBraise = (F.prochaineBraise || 0) - dt;
    if(F.prochaineBraise <= 0){
      F.prochaineBraise = 0.012;
      var ab = Math.random() * 6.2832, rb = 320 + Math.random() * 520;
      F.aspires.push({ x:Math.cos(ab) * rb, y:Math.sin(ab) * rb * 0.55 - 180,
                       age:0, duree:0.30 + Math.random() * 0.22,
                       r:1.4 + Math.random() * 2.4 });
    }
    if(!F.souffleAnnonce){
      F.souffleAnnonce = 1;
      son.sifflet();
      /* ════════════════════════════════════════════════════════
         ON PRÉPARE PENDANT LE TEMPS MORT, ET C'EST TOUT L'INTÉRÊT
         D'AVOIR UN TEMPS MORT.

         La lecture des pixels de la forteresse coûte treize
         millisecondes et demie, et l'allocation du tampon des grains
         en coûtait autant : faites à l'instant de la déflagration,
         elles donnaient une image à soixante-douze millisecondes —
         un hoquet visible, PILE sur le coup qu'on veut spectaculaire.

         Faites ici, six dixièmes de seconde plus tôt, elles tombent
         pendant que l'écran s'assombrit et qu'il ne se passe rien.
         Mesuré : l'image de la déflagration retombe dans le rang.
         ════════════════════════════════════════════════════════ */
      F.grainsPrets = fabriqueGrains();
      if(typeof preparerGrains === "function") preparerGrains();
    }
  }
  for(var qa = F.aspires.length - 1; qa >= 0; qa--){
    var br = F.aspires[qa];
    br.age += dt;
    var ka = Math.min(1, br.age / br.duree);
    /* course accélérée vers le foyer : elles arrivent toutes ensemble */
    br.x *= 1 - dt * (3 + ka * 9);
    br.y = (br.y + 180) * (1 - dt * (3 + ka * 9)) - 180;
    if(br.age >= br.duree) F.aspires.splice(qa, 1);
  }

  /* ---- 2. la déflagration ---- */
  if(F.age >= FIN_SOUFFLE && !F.tete){
    F.flash = 1.15;
    F.effondrement = 1;
    F.aspire = 0;
    F.aspires.length = 0;
    F.tete = { x:0, y:0, vy:-340, rot:0, age:0 };
    jeu.secousse = 34;
    son.boum(2.4);
    /* ════════════════════════════════════════════════════════
       LA FORTERESSE PART EN PIXELS.

       On lit ses propres pixels (voir `pixelsDuBrasier`) et chacun
       devient un grain qui garde SA couleur. Trois réglages font tout
       le rendu, et aucun n'est décoratif :

         LA VITESSE CROÎT AVEC LA DISTANCE AU FOYER. C'est ce qui fait
         que la silhouette s'ÉTIRE au lieu de se disperser : pendant
         deux ou trois dixièmes de seconde on reconnaît encore la
         forteresse, dilatée. Une vitesse uniforme donne un nuage tout
         de suite, et l'on ne voit plus ce qui explose.

         CHAQUE GRAIN A SON RETARD, proportionnel à sa distance : la
         désintégration BALAIE la forteresse du foyer vers les bords,
         en un tiers de seconde. Sans ce retard, tout part à la même
         image et l'on perd le mouvement.

         ILS PARTENT BLANCS ET REVIENNENT À LEUR COULEUR. Au premier
         instant tout est chauffé à blanc ; la teinte propre du pixel
         reparaît en trois dixièmes de seconde, puis s'éteint en
         braise. C'est ce dégradé qui donne l'impression de matière
         qui brûle plutôt que de peinture qui s'envole.
       ════════════════════════════════════════════════════════ */
    /* fabriqués pendant l'aspiration ; le repli n'est là que si l'on
       arrive ici sans être passé par elle */
    F.grains = F.grainsPrets || fabriqueGrains();
    F.grainsPrets = null;
    F.poussiere = 1;              // la forteresse cesse d'être dessinée
    /* trois ondes de choc concentriques */
    for(var o = 0; o < 3; o++) F.ondes.push({ age:-o * 0.16, r:0 });
    /* QUELQUES BLOCS, ET PLUS UNE PLUIE. Ils étaient quatre-vingt-dix
       petits rectangles bruns : au milieu de six mille grains
       incandescents, ils ne lisaient plus comme de la maçonnerie mais
       comme des confettis — exactement ce qu'on venait de retirer
       ailleurs. Vingt-deux suffisent, et ils servent à autre chose
       qu'avant : ce sont les seules formes SOMBRES de l'image, donc
       les seules qui donnent l'échelle de la boule derrière elles. */
    ajouteDebris(F, 22, 2.9);
    /* le champignon de fumée */
    for(var m = 0; m < 26; m++){
      F.colonne.push({ x:(Math.random() - 0.5) * 130, y:-Math.random() * 90,
                       vy:-52 - Math.random() * 70, r:22 + Math.random() * 36,
                       age:0, duree:4.5 + Math.random() * 3 });
    }
  }

  /* ---- 2 bis. la vie des grains ---- */
  if(F.grains){
    for(var gi = F.grains.length - 1; gi >= 0; gi--){
      var G = F.grains[gi];
      G.age += dt;
      if(G.age < G.retard) continue;         // il n'est pas encore parti
      G.x += G.vx * dt;
      G.y += G.vy * dt;
      G.vy += 210 * dt;                      // gravité
      var fr2 = 1 - dt * 0.9;                // et l'air les freine
      G.vx *= fr2; G.vy *= fr2;
      if(G.age > G.duree + G.retard) F.grains.splice(gi, 1);
    }
  }

  /* ---- 3. la vie des morceaux ---- */
  for(var i = F.debris.length - 1; i >= 0; i--){
    var d = F.debris[i];
    d.age += dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.vy += 340 * dt;                     // gravité
    d.rot += d.vr * dt;
    if(d.y > d.sol){                      // rebond amorti, puis il s'immobilise
      d.y = d.sol;
      d.vy = -d.vy * 0.34;
      d.vx *= 0.6; d.vr *= 0.5;
      if(Math.abs(d.vy) < 24){ d.vy = 0; d.vx = 0; d.vr = 0; }
    }
    if(d.age > d.duree) F.debris.splice(i, 1);
  }
  for(var q = F.ondes.length - 1; q >= 0; q--){
    F.ondes[q].age += dt;
    F.ondes[q].r = Math.max(0, F.ondes[q].age) * 900;
    if(F.ondes[q].age > 1.5) F.ondes.splice(q, 1);
  }
  for(var f2 = F.colonne.length - 1; f2 >= 0; f2--){
    var fu = F.colonne[f2];
    fu.age += dt;
    fu.y += fu.vy * dt;
    fu.vy *= (1 - dt * 0.5);              // elle ralentit en montant
    fu.r += dt * 22;
    if(fu.age > fu.duree) F.colonne.splice(f2, 1);
  }
  if(F.tete){
    F.tete.age += dt;
    F.tete.y += F.tete.vy * dt;
    F.tete.vy += 60 * dt;
    F.tete.rot += dt * 7;
  }
  /* ════════════════════════════════════════════════════════════
     DES BRAISES, ET PLUS DES CONFETTIS.

     Cent soixante rectangles roses, verts et bleus qui tombaient sur
     une île en feu : c'est le seul endroit du jeu où le décor disait
     « goûter d'anniversaire » pendant que l'image disait « forteresse
     rasée ». Ce qui retombe après une explosion, ce sont des cendres
     qui rougeoient, et elles montent autant qu'elles descendent.

     Elles remplacent les confettis un pour un, au même instant et au
     même endroit dans le code : rien d'autre n'a bougé.
     ════════════════════════════════════════════════════════════ */
  if(F.age >= FIN_SOUFFLE + 1.0 && !F.confettis){
    F.confettis = [];
    for(var i = 0; i < 110; i++){
      F.confettis.push({
        x:Math.random(), y:0.15 + Math.random() * 1.1,
        /* elles DÉRIVENT, elles ne tombent pas : une braise chaude
           monte, une braise froide descend, et le mélange des deux est
           ce qui fait vivre un ciel après un incendie. */
        vy:-0.055 + Math.random() * 0.13,
        vx:(Math.random() - 0.5) * 0.045,
        ph:Math.random() * 6.2832, vp:0.7 + Math.random() * 1.7,
        w:1.1 + Math.random() * 2.3, ch:Math.random()
      });
    }
  }
  if(F.confettis){
    for(var k = 0; k < F.confettis.length; k++){
      var c = F.confettis[k];
      c.y += c.vy * dt;
      c.x += (c.vx + Math.sin(c.ph + F.age * c.vp) * 0.012) * dt;
      if(c.y > 1.15){ c.y = -0.05; c.x = Math.random(); }
      if(c.y < -0.15){ c.y = 1.1; c.x = Math.random(); }
    }
  }
  /* LE FLASH EST BREF, ET C'EST TOUT SON INTÉRÊT. Il durait presque une
     seconde pleine à l'écran blanc : on ne voyait ni la forteresse
     partir en poussière, ni la boule s'ouvrir — le moment le plus
     spectaculaire de la partie était caché derrière un rectangle blanc.
     Un flash d'appareil photo dure un centième de seconde ; celui-ci
     tient le blanc un dixième, puis s'efface en deux dixièmes. */
  if(F.flash > 0) F.flash -= dt * 7.5;
  /* le sacre doit avoir le temps d'être lu avant que le tableau
     de bilan ne recouvre l'écran */
  if(F.age >= 10.5 && !F.bilanMontre){
    F.bilanMontre = 1;
    montreBilan();
  }
}

/* Le cadrage de la séquence finale. On vise un zoom qui laisse tenir la
   forteresse ET sa colonne de fumée dans la hauteur disponible : sur une
   tablette en portrait, la hauteur est le facteur limitant, en paysage
   c'est la largeur. Le point visé est légèrement AU-DESSUS du pied de la
   forteresse, sinon l'explosion sort par le haut de l'écran. */
function cadreLaFin(dt){
  var zBut = borne(Math.min(W / 1000, H / 900), zoomPlancher(W, H), 0.7);
  var pBut = iso(jeu.qg.gx, jeu.qg.gy);
  /* approche exponentielle : rapide au début, elle se pose sans à-coup */
  var k = 1 - Math.exp(-dt * 2.6);
  cam.z += (zBut - cam.z) * k;
  cam.px += (W / 2 - pBut.x * cam.z - cam.px) * k;
  cam.py += (H * 0.60 - pBut.y * cam.z - cam.py) * k;
}

/* Éclats de maçonnerie projetés. Ils vivent en coordonnées ÉCRAN
   relatives au pied du Brasier : le tri de profondeur n'a rien à leur
   apprendre, ils volent au-dessus de tout. */
function ajouteDebris(F, n, force){
  for(var i = 0; i < n; i++){
    var a = Math.random() * 6.2832;
    var v = (90 + Math.random() * 320) * force;
    F.debris.push({
      x:(Math.random() - 0.5) * 40, y:-40 - Math.random() * 220,
      vx:Math.cos(a) * v, vy:-Math.abs(Math.sin(a)) * v - 120 * force,
      rot:Math.random() * 6.2832, vr:(Math.random() - 0.5) * 15,
      w:4 + Math.random() * 13, sol:20 + Math.random() * 90,
      teinte:(Math.random() * 3) | 0, feu:Math.random() < 0.34,
      age:0, duree:3.4 + Math.random() * 2.6
    });
  }
}

/* ---------------------------------------------------------------
   Boucle de simulation
   --------------------------------------------------------------- */
/* CE QUE J'AI FAIT SUR CETTE ÎLE, à l'instant même.
   Deux morceaux, et il faut les deux :
     — `mesDegats[carte]`, le cumul déjà rangé, qui survit à une
       déconnexion (il est écrit dans le stockage local avec le numéro
       de campagne) et qui repart de zéro à l'île suivante puisqu'il
       est indexé PAR CARTE. Le cahier des charges de la montée en
       puissance décrivait exactement le comportement de ce compteur-là,
       qui existait déjà ;
     — ce que la partie en cours a fait depuis le dernier rangement,
       soit jeu.degatsMoi moins la part déjà repliée. Sans lui, le
       palier ne bougerait qu'aux replis, toutes les quelques secondes,
       et l'on verrait l'aura sauter au lieu de monter. */
function degatsMaCarte(){
  var range = (typeof mesDegats !== "undefined" && mesDegats)
              ? (mesDegats[jeu.index] || 0) : 0;
  var vif = (jeu.degatsMoi | 0) - ((typeof degatsReplies === "number") ? degatsReplies : 0);
  if(!(vif > 0)) vif = 0;
  return range + vif;
}

/* ════════════════════════════════════════════════════════════════
   OÙ EN EST L'ÎLE — LE SECOND CHIFFRE DE LA NOVA

   La part des défenses tombées, celles de tout le salon comprises :
   `jeu.batiments` est déjà la fusion de ce que le monde partagé a
   détruit et de ce qu'on démonte soi-même, si bien qu'il n'y a rien à
   aller chercher ailleurs. C'est ce chiffre que `calibreNova` exige
   pour ouvrir la SUPER Nova — voir NOVA_SEUIL_DETRUIT.

   MÊME DÉFINITION DU MOT « DÉFENSE » QUE `compteDefenses`, et pas une
   autre : ni les cellules à récolter, ni les cinq cellules
   électriques. Les deux fonctions ne peuvent pas être fusionnées —
   celle-ci lit une partie en cours, l'autre une carte fraîchement
   générée dans le noyau pur — mais la règle qu'elles appliquent doit
   rester la même, sans quoi la jauge et le verrou parleraient de deux
   îles différentes.

   RECOMPTÉ AU PLUS QUATRE FOIS PAR SECONDE. Douze cents bâtiments
   relus à chaque image pour une valeur qui bouge d'un millième, c'est
   le genre de boucle qu'on ne remarque pas et qui coûte pourtant. Le
   verrou se joue à un pour cent près : un quart de seconde de retard
   ne se voit nulle part.

   ET LE CACHE SE PURGE TOUT SEUL À LA PARTIE SUIVANTE : `jeu.tps`
   repart de zéro, donc un horodatage postérieur au temps courant est
   la preuve qu'il appartient à une autre partie.
   ════════════════════════════════════════════════════════════════ */
var partDetT = -1, partDetV = 0;
function partDefensesDetruites(){
  if(!jeu || !jeu.batiments) return 0;
  var t = jeu.tps;
  if(partDetT >= 0 && t >= partDetT && t - partDetT < 0.25) return partDetV;
  var total = 0, morts = 0;
  for(var i = 0; i < jeu.batiments.length; i++){
    var b = jeu.batiments[i];
    if(b.t === "cellule" || b.t === "reacteur") continue;
    total++;
    if(!b.vivant) morts++;
  }
  partDetT = t;
  partDetV = total > 0 ? morts / total : 0;
  return partDetV;
}
/* Le calibre effectif, ici et maintenant : les deux chiffres réunis.
   Tout le jeu passe par là — l'explosion, l'annonce et la tuile du
   menu — pour qu'il n'existe jamais deux façons de répondre à la
   question « ma Nova est-elle une SUPER Nova ? ». */
function calibreNovaCourant(){
  return calibreNova(degatsMaCarte(), partDefensesDetruites());
}

/* ════════════════════════════════════════════════════════════════
   DEUX BARÈMES, DONC DEUX ANNONCES

   Elles n'en faisaient qu'une : la marche de la Nova était un palier de
   puissance, donc le message des troupes portait la nouvelle de la
   Nova en incise. Depuis que les deux barèmes ont leurs propres seuils
   — la puissance plafonne à un million, la Nova monte à cinq — ils ne
   tombent plus jamais ensemble, et une incise sur un message qui ne
   part pas ne dirait rien à personne.

   On surveille donc les deux séparément, et chacun parle quand il a
   quelque chose à dire. La Nova a droit à sa propre ligne : passer de
   130 à 5 000 dégâts, puis de 5 000 à 50 000, mérite mieux qu'une
   parenthèse.
   ════════════════════════════════════════════════════════════════ */
function majPuissance(){
  var d = degatsMaCarte();
  var p = palierPuissance(d);
  if(p !== jeu.palier){
    jeu.palier = p;
    jeu.puissance = PALIERS_PUISSANCE[p].mult;
    /* on ne fête que la montée, et une seule fois par palier */
    if(p > 0 && typeof message === "function")
      message("Palier " + p + " — tes troupes frappent à "
            + Math.round(jeu.puissance * 100) + " %.");
  }
  /* LA NOVA, SUR SON PROPRE BARÈME. La tuile du menu change de visage
     toute seule (voir majTuileNova), mais on peut très bien être en
     train de regarder l'île et non le menu au moment où la marche se
     franchit. */
  var rg = calibreNovaCourant().rang | 0, av = jeu.rangNova | 0;
  if(rg !== av){
    jeu.rangNova = rg;
    /* ON ANNONCE L'OUVERTURE, PAS LA MARCHE, et le verrou de chantier
       a rendu la distinction obligatoire. Tant que le calibre suivait
       les seuls dégâts, il montait cran par cran et la première marche
       tombait toujours en premier : « ta Nova devient une SUPER Nova »
       arrivait forcément avant « elle passe à son plein calibre ».
       Maintenant le verrou libère D'UN COUP tout le calibre déjà
       mérité, et le saut de zéro au plein calibre est le cas ORDINAIRE
       pour un joueur qui arrive avec ses six millions. Il s'entendait
       alors dire que sa SUPER Nova montait en calibre sans en avoir
       jamais eu une. C'est le rang de DÉPART qui choisit la phrase. */
    if(rg > av && rg > 0 && typeof message === "function")
      message(!av
        ? "L'île est démontée : ta Nova devient une SUPER Nova"
          + (rg > RANG_SUPERNOVA
             ? ", " + nombre(CALIBRES_NOVA[rg].degats) + " au cœur." : ".")
        : rg === RANG_NOVA_MAX
        ? "Ta SUPER Nova passe à son plein calibre : "
          + nombre(CALIBRES_NOVA[rg].degats) + " au cœur."
        : "Ta SUPER Nova monte en calibre : "
          + nombre(CALIBRES_NOVA[rg].degats) + " au cœur.");
  }
  /* ET LE VERROU, QUI A SA PROPRE NOUVELLE À ANNONCER. Franchir deux
     millions ne change plus rien de visible tant que l'île tient
     debout : sans cette ligne, le joueur atteindrait son seuil et ne
     verrait strictement rien se produire, ce qui se lit comme une
     panne. On le dit donc une fois, au moment où c'est vrai — la
     tuile du menu porte le compte à rebours ensuite. */
  var me = rangNovaMerite(d) | 0, avM = jeu.novaMerite | 0;
  if(me !== avM){
    jeu.novaMerite = me;
    /* UNE FOIS PAR BATAILLE, ET PAS UNE DE PLUS. La nouvelle est
       toujours la même — « il faudra démonter l'île » — et le barème
       compte six marches : la dire à chacune, c'est la répéter six
       fois pour ne rien apprendre de neuf. Seul le passage de rien à
       quelque chose est une nouvelle ; le compte à rebours, lui, vit
       sur la tuile du menu, où on le regarde quand on veut. */
    if(!avM && me > 0 && !rg && typeof message === "function")
      message("SUPER Nova méritée — elle s'ouvrira à "
            + Math.round(NOVA_SEUIL_DETRUIT * 100) + " % de l'île démontée.");
  }
}

/* ════════════════════════════════════════════════════════════════
   LES RELIQUES, PENDANT LA BATAILLE

   ─── CE QUI DÉCLENCHE, ET CE QUI EST VRAI ──────────────────────
   Deux compteurs, et il faut absolument les distinguer.

   `millionsVus` est LOCAL et il ne sert qu'à savoir s'il faut
   regarder. Le lire coûte une soustraction ; le tableau des dégâts
   partagé, lui, coûte le décodage d'une longue chaîne, et on ne fait
   pas ça soixante fois par seconde pour un événement qui arrive une
   fois par million.

   `reliquesVues` est LA VÉRITÉ : le compte que tout le salon partage.
   C'est lui qui décide combien de roues doivent tourner et QUELLE
   relique chacune montre. Un joueur qui viderait son navigateur
   remettrait `millionsVus` à zéro et reverrait des roues — mais
   `reliquesVues` ne bougerait pas d'un cran, parce qu'il se lit dans
   le tableau publié, fusionné par maximum, que personne ne peut faire
   redescendre tout seul. On refarme l'animation, jamais la relique.

   ─── RIEN N'EST ÉCRIT ICI, ET C'EST VOULU ──────────────────────
   Gagner une relique ne demande AUCUNE publication : le compte vaut
   « acquis + millions du tableau partagé », et ces millions y sont
   déjà — ils partent avec le score, comme depuis toujours. Le seul
   moment où `rq` grossit est la clôture de campagne, quand le tableau
   va être effacé. Une loterie qui n'écrit rien ne peut pas se
   désaccorder entre deux appareils.
   ════════════════════════════════════════════════════════════════ */
function relisReliques(){
  var b = (typeof bonusReliques === "function" && typeof monde !== "undefined")
          ? bonusReliques(monde && monde.rq, scoresDesReliques(), monNom)
          : { assaut:0, garde:0, pa:-1, pg:-1, n:0 };
  jeu.multAssaut = multAssautRelique(b);
  jeu.multGarde  = multGardeRelique(b);
  return b;
}
/* À l'entrée sur l'île : on adopte l'état SANS rien fêter. Les
   millions déjà faits ne sont pas des nouvelles. */
function amorceReliques(){
  if(!jeu) return;
  jeu.millionsVus = Math.floor(degatsMaCarte() / RELIQUE_SEUIL);
  jeu.reliquesVues = carteSpeciale(jeu.index)
    ? comptesReliques(monde && monde.rq, scoresDesReliques(), monNom, jeu.index) : 0;
  relisReliques();
}
var RELIQUE_GUET = 0.25;                    // on ne guette que quatre fois par seconde
var reliqueGuet = 0;
function majReliques(dt){
  /* LES DEUX CARTES BONUS, ET ELLES SEULES. « Si on joue tout le temps,
     au final on aura toujours le pourcentage max ; mais si on dit que
     sur les deux cartes bonus il y a ce truc-là à gagner, ça c'est
     bien. » La visite ne compte pas non plus : rien n'en sort, donc
     rien n'y est gagné. */
  if(!carteSpeciale(jeu.index)) return;
  if(typeof modeApercu !== "undefined" && modeApercu) return;
  /* LE GUICHET LOCAL, GRATUIT : tant que mon propre compteur n'a pas
     franchi un million de plus, il n'y a rien à regarder. */
  var m = Math.floor(degatsMaCarte() / RELIQUE_SEUIL);
  if(m <= jeu.millionsVus) return;
  /* ET IL NE SE CONSOMME PAS TANT QUE LE PARTAGÉ N'A PAS SUIVI.
     C'était le piège : avancer `millionsVus` ici, avant d'avoir la
     confirmation, aurait refermé le guichet pendant les deux secondes
     qui séparent le coup de hache de sa publication — et la relique
     aurait été gagnée sans que personne ne voie la roue. On garde
     donc le guichet ouvert et l'on repasse, quatre fois par seconde
     le temps que la publication arrive. */
  reliqueGuet += (typeof dt === "number" ? dt : 0.016);
  if(reliqueGuet < RELIQUE_GUET) return;
  reliqueGuet = 0;
  var n = comptesReliques(monde && monde.rq, scoresDesReliques(), monNom, jeu.index);
  if(n <= jeu.reliquesVues) return;
  jeu.millionsVus = m;
  /* PLUSIEURS D'UN COUP : une salve peut franchir deux millions dans
     la même image, et un cumul local en avance sur le partagé peut en
     libérer plusieurs à la fois. On ne montre que la DERNIÈRE — deux
     roues qui se chevauchent ne se lisent pas — mais on les compte
     toutes, et c'est le compte qui donne le bonus. */
  var r = tireRelique(monNom, jeu.index, n);
  jeu.reliquesVues = n;
  relisReliques();
  if(typeof ouvreRoueRelique === "function") ouvreRoueRelique(r, n);
}

function majJeu(dt){
  jeu.tps += dt;
  majPuissance();
  majReliques(dt);
  if(jeu.messageGege > 0) jeu.messageGege = Math.max(0, jeu.messageGege - dt);
  if(jeu.messageTweety > 0) jeu.messageTweety = Math.max(0, jeu.messageTweety - dt);
  if(jeu.secousse > 0) jeu.secousse = Math.max(0, jeu.secousse - dt * 22);
  majBouclier(dt);
  /* La vengeance tourne même pendant la séquence finale : elle doit
     aller au bout, la forteresse peut bien tomber pendant ce temps. */
  majVengeance(dt);
  construitGrilleUnites();
  if(jeu.fin){ majFin(dt); majEffets(dt); return; }
  majNavettes(dt);
  majUnites(dt);
  separeUnites(dt);
  majPoulets(dt);
  /* LES TORNADES DES TÉNÈBRES. Posé ici, avec les autres dangers du
     décor et AVANT les défenses : ce qu'une tornade vient de tuer ne
     doit pas tirer une dernière fois dans la même image. */
  if(carteAvecTornades(jeu.index)){ greffeSonTornade(); majTornades(dt); }
  /* LE BALAYAGE DE MILY, au même endroit et pour la même raison : un
     danger du décor, avant les défenses, pour que ce qu'il vient de
     tuer ne tire pas une dernière fois dans la même image. */
  if(carteScene(jeu.index)) majLaserMily(dt);
  majPluieEtoiles(dt);
  majFoudre(dt);
  majDefenses(dt, jeu.tps);
  majCreatures(dt, jeu.tps);
  majProjectiles(dt);
  majZones(dt);
  majNuages(dt);          // le ciel n appartient pas à la jungle
  majJungle(dt);
  majQG(dt, jeu.tps);
  majEffets(dt);
  majMort(dt);
}
/* ================================================================
   LA VIE DE LA JUNGLE — geysers, foudre, et la faune qui s'égaille

   Rien de tout cela ne tourne sur les cinq îles ordinaires : les
   listes y sont vides et la fonction sort à la première ligne. C'est
   ce qui permet à la carte événement d'être aussi chargée sans rien
   coûter aux autres.
   ================================================================ */
/* ================================================================
   LA DÉRIVE DES NUAGES — SUR LES SIX CARTES

   Elle vivait DANS majJungle, qui sort à sa première ligne quand il
   n y a pas de geysers : sur les cinq îles ordinaires, elle ne
   tournait jamais. Leurs nuages, une fois enfin fabriqués, seraient
   restés cloués au ciel — vérifié avant correction, cinq nuages
   immobiles au dixième de case près après quatre secondes.
   Le ciel n appartient pas à la jungle : la dérive en sort.
   ================================================================ */
function majNuages(dt){
  for(var i = 0; i < jeu.nuages.length; i++){
    var nu = jeu.nuages[i];
    /* UNE DÉRIVE ERRATIQUE, pas un zigzag. Le nuage se choisit un
       nouveau cap de temps en temps, et son cap réel GLISSE vers
       celui-là au lieu d'y sauter. C'est cette inertie qui donne une
       trajectoire de nuage — de longues courbes molles, imprévisibles
       mais jamais saccadées. Un changement de cap instantané aurait
       donné un insecte, pas un orage. */
    nu.vire -= dt;
    if(nu.vire <= 0){
      nu.vire = 2.5 + Math.random() * 5;
      nu.capBut = Math.random() * 6.2832;
    }
    /* on tourne par le plus court chemin, sinon un cap qui passe par
       zéro fait faire un tour complet au nuage */
    var ec = ((nu.capBut - nu.cap + 9.4248) % 6.2832) - 3.1416;
    nu.cap += borne(ec, -0.55 * dt, 0.55 * dt);
    nu.gx += Math.cos(nu.cap) * nu.v * dt;
    nu.gy += Math.sin(nu.cap) * nu.v * dt;
    /* Ils font le tour : sorti d'un bord, un nuage rentre par l'autre.
       Sans ce recyclage, les trois finissaient par dériver au large et
       le ciel se vidait au bout de quelques minutes. */
    if(nu.gx < -22) nu.gx = PLAGE_X0 + 20;
    if(nu.gx > PLAGE_X0 + 22) nu.gx = -20;
    if(nu.gy < -22) nu.gy = GH + 20;
    if(nu.gy > GH + 22) nu.gy = -20;
  }
}

function majJungle(dt){
  /* la vie de la jungle — geysers ET foudre — appartient à l'île,
     pas au tableau des geysers : un semis vide ne doit pas éteindre
     l'orage. La boucle des geysers plus bas tourne à vide sans se
     plaindre si le tableau est vide, c'est exactement ce qu'il faut. */
  if(!carteOrageuse(jeu.index)) return;
  var i;

  /* --- LES GEYSERS ---
     Chacun a sa propre horloge, tirée à la génération : deux bouches
     voisines ne soufflent jamais ensemble, sans quoi la carte
     ressemblerait à un métronome. */
  for(i = 0; i < jeu.geysers.length; i++){
    var g = jeu.geysers[i], avant = g.phase;
    majGeyser(g, dt);
    /* le souffle ne s'entend que si l'on est à portée de l'écran :
       vingt-deux bouches qui grondent toutes ensemble seraient un
       vacarme, et la plupart sont hors champ */
    if(g.phase === "feu" && avant !== "feu" && son.geyser &&
       Math.abs(g.gx - centreCameraGx()) < 26 && Math.abs(g.gy - centreCameraGy()) < 26){
      son.geyser();
    }
  }


}

/* ================================================================
   LA FOUDRE — la jungle ET les ténèbres

   Elle vivait dans majJungle(), avec les geysers, sous le même
   verrou : carteOrageuse(). C'était juste tant qu'une seule île avait
   un ciel. Les ténèbres veulent la foudre et le tonnerre, mais surtout
   pas la pluie ni la brume verte — il ne pleut pas sur un monde de
   lave. On sort donc la foudre de la jungle : elle a son verrou à
   elle, carteFoudre(), et son rythme par île, periodeEclair().

   Rien d'autre ne change. Le même éclair, le même impact mortel, la
   même nappe qui court sur la terre. Un éclair blanc-bleu au-dessus
   d'une île qui brûle est d'ailleurs le seul élément FROID de cette
   carte-là — c'est très exactement ce qu'il y fait de mieux.
   ================================================================ */
function majFoudre(dt){
  if(!carteFoudre(jeu.index)) return;
  if(!jeu.nuages || !jeu.nuages.length) return;
  /* --- LA FOUDRE ---
     Un impact toutes les quinze secondes. Le point n'est pas tiré au
     hasard sur la carte : il tombe SOUS UN NUAGE, avec un peu de
     dérive. Jamais sur le Brasier — un éclair qui frapperait
     l'objectif ferait croire à un dégât qui n'existe pas. */
  jeu.prochainEclair -= dt;
  if(jeu.prochainEclair <= 0){
    jeu.prochainEclair = periodeEclair(jeu.index) * (0.72 + Math.random() * 0.56);
    var nu2 = jeu.nuages[(Math.random() * jeu.nuages.length) | 0];
    var ex, ey, essais = 0;
    do{
      var an = Math.random() * 6.2832, ra = Math.sqrt(Math.random()) * 5.5;
      ex = borne(nu2.gx + Math.cos(an) * ra, 5, PLAGE_X0 - 4);
      ey = borne(nu2.gy + Math.sin(an) * ra, 4, GH - 5);
    }while(Math.hypot(ex - jeu.qg.gx, ey - jeu.qg.gy) < 20 && ++essais < 20);
    jeu.eclairs.push({ gx:ex, gy:ey, age:0, duree:EQ.ECLAIR_NAPPE_DUREE + 0.9,
                       cx:nu2.gx, cy:nu2.gy, front:0, puni:0 });
    if(son.foudre) son.foudre();
    jeu.secousse = Math.min(6, jeu.secousse + 2.2);
    /* les bêtes détalent : c'est ce qui rend la jungle habitée plutôt
       que décorée */
    if(typeof effraieFaune === "function") effraieFaune(ex, ey, 26, jeu.tps);
  }

  /* --- L'IMPACT, PUIS LE COURANT QUI COURT SUR LA TERRE ---
     Deux effets distincts, et c'est voulu :
       — au POINT D'IMPACT, c'est mortel. Une troupe touchée par la
         foudre meurt, elle n'est pas blessée. C'est ce qui rend
         l'orage vraiment dangereux plutôt que gênant ;
       — puis le courant se DIFFUSE sur la terre mouillée, en cercle
         qui s'élargit. Le front frappe fort mais une seule fois par
         unité : sans ce marquage, une troupe restée sur place aurait
         encaissé la nappe à chaque image et le rayon de mort aurait
         valu sept cases au lieu de deux. */
  for(var i = jeu.eclairs.length - 1; i >= 0; i--){
    var e2 = jeu.eclairs[i];
    var avant = e2.front;
    e2.age += dt;
    if(!e2.puni){
      e2.puni = 1;
      foudroieAuSol(e2.gx, e2.gy);
    }
    /* le front avance en racine du temps : très vite au départ, il
       ralentit — c'est ainsi que se propage une décharge dans un sol
       conducteur, et c'est aussi ce qui laisse une chance de fuir */
    var t2 = borne(e2.age / EQ.ECLAIR_NAPPE_DUREE, 0, 1);
    e2.front = Math.sqrt(t2) * EQ.ECLAIR_RAYON_NAPPE;
    if(e2.front > avant) nappeElectrique(e2, avant, e2.front);
    if(e2.age > e2.duree) jeu.eclairs.splice(i, 1);
  }
}

/* Le coup de foudre lui-même : ce qu'il touche meurt. */
function foudroieAuSol(gx, gy){
  var t = [];
  unitesAutour(gx, gy, EQ.ECLAIR_RAYON_TUE, t);
  for(var i = 0; i < t.length; i++){
    var u = t[i];
    if(u.pv <= 0) continue;
    if(Math.hypot(u.gx - gx, u.gy - gy) > EQ.ECLAIR_RAYON_TUE) continue;
    toucheUnite(u, u.pv + 1);          // la foudre ne blesse pas, elle tue
  }
  degatsZoneEnnemis(gx, gy, EQ.ECLAIR_RAYON_TUE, EQ.ECLAIR_NAPPE_DEGATS * 2);
  jeu.crateres.push({ gx:gx, gy:gy, r:1.1 });
  jeu.effets.push({ t:"onde", gx:gx, gy:gy, age:0, duree:0.45, r:1.4 });
}
/* Le courant qui s'élargit. On ne frappe QUE la couronne franchie
   depuis l'image précédente : une unité est donc touchée une fois,
   au passage du front, et pas tant qu'elle reste dedans. */
function nappeElectrique(e, r0, r1){
  var t = [];
  unitesAutour(e.gx, e.gy, r1, t);
  for(var i = 0; i < t.length; i++){
    var u = t[i];
    if(u.pv <= 0 || u.zappe === e) continue;
    var d = Math.hypot(u.gx - e.gx, u.gy - e.gy);
    if(d > r1 || d <= r0) continue;
    u.zappe = e;                        // marqué par CET éclair, une fois
    toucheUnite(u, EQ.ECLAIR_NAPPE_DEGATS);
  }
}
/* Le centre de l'écran, en cases — sert à ne pas jouer le son d'un
   geyser situé à l'autre bout de l'île. */
function centreCameraGx(){ return versMonde(cam, W / 2, H / 2).gx; }
function centreCameraGy(){ return versMonde(cam, W / 2, H / 2).gy; }

function majEffets(dt){
  for(var i = jeu.effets.length - 1; i >= 0; i--){
    var e = jeu.effets[i];
    e.age += dt;
    if(e.age > e.duree) jeu.effets.splice(i, 1);
  }
}
