/* ================================================================
   LA SCÈNE D'IBIZA — le DJ, les lasers, et ceux qui dansent

   « Au centre, un carré réservé et une sorte de scène avec un DJ qui
   met de la musique, des lasers qui pointent vers le ciel et une
   vingtaine de personnes qui dansent devant lui. »

   CE QUE C'EST, ET CE QUE CE N'EST PAS. La scène est du DÉCOR : elle
   n'a pas de points de vie, elle n'entre pas dans le tableau des
   bâtiments, on ne peut pas la détruire et elle ne rapporte rien.
   C'est délibéré — un objet destructible au milieu de la carte
   changerait l'index des bâtiments à chaque retouche du dessin, et
   surtout il donnerait des points pour avoir cassé une platine.
   Le seul effet de la scène sur les règles est le TROU qu'elle creuse
   dans le quadrillage militaire, et celui-là vit dans le noyau
   (SCENE_GX, dansLaScene) parce qu'il change la carte.

   POURQUOI LES DANSEURS SONT VIVANTS ET NON PEINTS. Tout le reste du
   décor de ce jeu est pré-cuit — une seule image, collée mille fois.
   Ceux-ci bougent : ils sautent, se balancent et lèvent les bras,
   chacun à son tempo. Vingt figurines animées coûtent quelques
   dizaines de tracés par image, et c'est le prix à payer : des
   danseurs figés ne dansent pas, ils attendent. C'est très
   exactement la différence entre une fête et un décor de fête.

   TOUT EST CALÉ SUR UN BATTEMENT COMMUN. `battement()` rend la phase
   du morceau, et les lasers, les lumières de la scène et les vingt
   danseurs la lisent tous. Sans elle chacun aurait son rythme et l'on
   verrait vingt personnes danser sur vingt musiques différentes — ce
   qui est exactement l'effet qu'on obtient quand on tire un
   Math.random() par danseur.
   ================================================================ */

/* ================================================================
   ET MAINTENANT, IL Y A VRAIMENT DE LA MUSIQUE

   « Dès qu'on entre sur la map, la musique doit commencer et les gens
   se mettent à danser. »

   Jusqu'ici la scène dansait sur un métronome imaginaire : 128 BPM
   écrits en dur, et l'horloge du jeu pour les compter. C'était la
   seule chose à faire tant qu'aucun son ne sortait — mais maintenant
   qu'un morceau joue pour de bon, un métronome indépendant est le
   pire des deux mondes : on VOIT un tempo et l'on en ENTEND un autre,
   et l'œil s'en aperçoit tout de suite. Une scène qui danse à côté de
   la musique est plus fausse qu'une scène muette.

   TOUT SE LIT DONC SUR LA MUSIQUE quand elle joue, et le métronome
   n'est plus qu'un filet de secours — son coupé, navigateur qui
   refuse l'audio, moteur absent : la fête continue, simplement elle
   ne sait plus sur quoi.

   ET LA PHASE SE LIT SUR L'HORLOGE AUDIO, pas sur les événements du
   moteur. `MilyMusic.horloge()` remonte à la date audio réelle (voir
   son commentaire dans 93-musique.js) ; l'événement 'section', lui,
   part quand la mesure est PROGRAMMÉE, avec jusqu'à 180 ms d'avance
   et pas la même à chaque fois. Deux images de gigue sur un jeu de
   lumière, ça se voit.
   ================================================================ */
/* Le tempo de secours, en battements par minute, quand rien ne joue.
   128 BPM : c'est le tempo de ce qu'on joue là-bas, et surtout c'est
   assez rapide pour qu'un saut se lise sans être épuisant à l'œil. */
var IBI_BPM = 128;

/* ────────────────────────────────────────────────────────────────
   CE QUE CHAQUE PARTIE DU MORCEAU VAUT EN LUMIÈRE

   Un jeu de lumière qui ne change jamais n'est pas un jeu de lumière,
   c'est un clignotant. Le morceau, lui, a une forme : un discours, une
   montée, deux drops, un break, une accalmie aux percussions. On lit
   cette forme et l'on en fait l'intensité de toute la scène — hauteur
   des sauts, longueur des lasers, force des projecteurs, stroboscope.

   Sur le drop on dépasse 1 : c'est le moment où tout doit partir.
   Sur le break on tombe à 0,45 : c'est le moment où l'on RESPIRE, et
   c'est lui qui fait exister le drop suivant. Une fête toujours à fond
   est plate.
   ──────────────────────────────────────────────────────────────── */
var IBI_FORCE = {
  discours:0.20, entree:0.60, montee:0.78, build:1.00,
  drop1:1.40,    break:0.45,  build2:1.05, drop2:1.50,
  descente:0.62, ibiza:0.72,  build3:1.10, final:1.60, boucle:0.85
};
/* Les sections où l'on lâche le stroboscope. Ailleurs : jamais. */
var IBI_STROBO = { drop1:1, drop2:1, final:1 };

/* L'horloge de la scène, lue UNE FOIS PAR IMAGE et mise en cache sur
   `tps`. Cinq cents danseurs demandent chacun le battement : sans ce
   cache, c'est cinq cents lectures de l'horloge audio par image. */
var IBI_HORLOGE = { tps:-1, t:0, mus:0, section:"", force:1, strobo:0 };
function horlogeIbiza(tps){
  var H = IBI_HORLOGE;
  if(H.tps === tps) return H;
  H.tps = tps;
  var h = (typeof musique !== "undefined" && musique) ? musique.horloge() : null;
  if(h){
    H.t = h.temps;                       // en noires, depuis la mesure 0
    H.mus = 1;
    H.section = h.section;
    H.force = IBI_FORCE[h.section] === undefined ? 1 : IBI_FORCE[h.section];
    H.strobo = IBI_STROBO[h.section] ? 1 : 0;
  }else{
    H.t = tps * IBI_BPM / 60;
    H.mus = 0; H.section = ""; H.force = 1; H.strobo = 0;
  }
  return H;
}
/* La phase dans le temps : 0 sur la frappe, 1 juste avant la suivante. */
function battement(tps){
  var t = horlogeIbiza(tps).t;
  return t - Math.floor(t);
}
/* Le numéro du temps écoulé. C'est lui qui fait tourner les couleurs
   et qui dit quel danseur saute ce coup-ci. */
function mesureIbiza(tps){ return Math.floor(horlogeIbiza(tps).t); }
/* Ce que vaut la section en cours, en lumière. */
function forceIbiza(tps){ return horlogeIbiza(tps).force; }
/* La frappe : 1 sur le temps, retombe vite. C'est elle qui fait
   « pomper » toute la scène. */
function frappe(tps){
  var b = battement(tps);
  return Math.exp(-b * 5.2);
}
/* ────────────────────────────────────────────────────────────────
   UN SAUT N'EST PAS UNE FRAPPE

   `frappe` monte d'un coup et retombe : c'est la bonne courbe pour
   une lumière, et la mauvaise pour un corps. Un corps qui saute
   décolle, monte, redescend — une parabole — puis RESTE AU SOL un
   instant avant de repartir. C'est ce petit repos qui fait qu'on voit
   l'appel du saut ; sans lui, les danseurs flottent.
   ──────────────────────────────────────────────────────────────── */
function sautIbiza(b, duree){
  if(b >= duree) return 0;
  var s = b / duree;
  return 4 * s * (1 - s);
}

/* ---------------------------------------------------------------
   LA GÉOMÉTRIE DE LA SCÈNE, en un seul endroit
   --------------------------------------------------------------- */
/* Le podium, le portique et les lasers doivent se tenir : si chacun
   redéfinit sa hauteur dans son coin, les faisceaux partent d'un
   point du ciel qui n'est pas le haut des mâts. Les trois cotes
   vivent donc ici. Elles sont en CASES pour les longueurs au sol et
   en pixels de scène pour les hauteurs — un pixel de scène étant ce
   que `c.scale(z, z)` rend. */
var IBI_DEMI = 3.5;      // demi-diagonale du plancher, en RAYONS-MONDE (voir plus bas)
var IBI_H    = 26;       // hauteur du praticable
var IBI_MH   = 96;       // hauteur des mâts au-dessus du plancher
/* ATTENTION AUX UNITÉS, elles se ressemblent et ne sont pas les
   mêmes. RX est la demi-largeur à l'écran d'un cercle de rayon UN,
   soit 52/√2 ; un déplacement d'UNE CASE en gx, lui, ne vaut que 26
   en x. Le plancher, tracé à ±IBI_DEMI * RX, mesure donc
   IBI_DEMI/√2 = 2,47 CASES du centre à chacun de ses quatre coins, et
   non 3,5. C'est cette confusion qui avait planté la foule une case
   et demie trop loin, avec un trou de sable entre elle et la scène. */
var IBI_COIN = IBI_DEMI * Math.SQRT1_2;   // 2,47 cases : le coin du plancher

/* ---------------------------------------------------------------
   LES DANSEURS
   --------------------------------------------------------------- */
/* Vingt personnes DEVANT la scène. « Devant », à l'écran, ce n'est
   pas « gy plus grand » : avancer d'une case en gy déplace vers le
   BAS-GAUCHE. Le sud de l'écran, celui où la foule doit être pour
   qu'on la voie entre le bord de l'image et le podium, c'est gx ET gy
   qui montent ensemble. La foule est donc semée dans un repère à
   deux axes d'écran : `t` la largeur (gx - gy, purement horizontal)
   et `s` la profondeur (gx + gy, purement vertical).
   Le tirage est DÉTERMINISTE : la même île rend toujours la même
   foule, sinon la piste se réorganiserait à chaque retour au
   briefing. */
/* ================================================================
   DEUX FOULES, ET C'EST LA PISTE QUI L'A EXIGÉ

   « Une étoile vide où il y a la scène avec des gens qui dansent dans
   l'étoile. »

   Tant que la piste était un carré de vingt-trois cases, vingt
   personnes serrées devant le podium la remplissaient. Devenue une
   étoile de soixante cases de large, elle avalait le même groupe sans
   qu'il paraisse : une scène, vingt danseurs collés dessous, et
   quarante cases de plancher noir tout autour. On avait donné à la
   fête une salle trop grande pour elle.

   La foule se fait donc en DEUX temps, et les deux sont nécessaires :

     LE PREMIER RANG    ceux qui sont venus pour le DJ. En arc serré
                        devant le podium, comme avant, et pour la même
                        raison : c'est là que l'œil va.
     LA PISTE           tous les autres, semés sur TOUTE l'étoile en
                        spirale d'or — l'angle d'or ne fait jamais deux
                        fois le même rayon, donc jamais de rangée, et
                        la densité décroît naturellement du centre vers
                        les pointes, ce qui est exactement la forme
                        d'une piste de danse.

   Et chacun est éprouvé par `dansLaScene` : une pointe d'étoile est
   pointue, un semis circulaire en déborde, et un danseur planté dehors
   se retrouverait dans les Frelons.
   ================================================================ */
/* ────────────────────────────────────────────────────────────────
   COMBIEN, ET DE QUELLE TAILLE

   « Les personnes 50 % plus grandes, et elles doivent presque saturer
   entre la scène et la délimitation. »

   LA TAILLE d'abord : une personne mesurait 1,5 à 2,1 ; elle en mesure
   maintenant la moitié en plus. C'est le seul réglage, et il porte les
   deux foules à la fois.

   LE NOMBRE ensuite, et il se calcule. L'étoile fait environ mille cinq
   cents cases carrées, moins le disque du podium. « Presque saturé »,
   pour des gens qui font six dixièmes de case de large, c'est un
   voisin toutes les deux cases environ — soit trois cases et demie par
   personne, soit un peu plus de quatre cents danseurs.

   On en TIRE huit cent vingt sur le disque qui contient l'étoile, et
   l'on garde ceux qui tombent dedans : une étoile occupe un peu plus
   de la moitié de son disque, et il en reste le compte voulu. Le tirage
   d'abord, le test ensuite — règle de la maison, et ici elle a une
   raison de plus : changer la forme de l'étoile ne rebat alors pas la
   foule entière, elle se recoupe simplement autrement.
   ──────────────────────────────────────────────────────────────── */
var IBI_TAILLE      = 2.25;  // une personne et demie : ce qui a été demandé
var IBI_NB_DANSEURS = 26;    // le premier rang, devant le podium
var IBI_NB_PISTE    = 820;   // et les candidats semés sur toute l'étoile
function fabriqueDanseurs(){
  var out = [], al = prng(0x1B12A), i;
  function habille(o){
    o.dec = al() * 0.34;
    o.style = (al() * 3) | 0;
    o.demi = al() < 0.5 ? 1 : 0;
    o.teinte = (al() * 6) | 0;
    o.taille = IBI_TAILLE * (1 + al() * 0.4);
    o.droite = al() < 0.5 ? 1 : -1;
    return o;
  }
  /* --- LA PISTE : la spirale d'or sur toute l'étoile ---
     Semée AVANT le premier rang pour que celui-ci garde sa place
     exacte : les tirages du premier rang viennent après, sur un flux
     qui ne dépend que de lui. */
  for(i = 0; i < IBI_NB_PISTE; i++){
    /* rayon en √ : la spirale d'or couvre alors un disque à densité
       constante, et non un anneau */
    var ang = i * 2.399963 + al() * 0.30;
    var ray = ETOILE_R * 0.97 * Math.sqrt((i + 0.6) / IBI_NB_PISTE);
    var px = SCENE_GX + Math.cos(ang) * ray;
    var py = SCENE_GY + Math.sin(ang) * ray;
    var o = habille({ gx:px, gy:py });
    /* le test APRÈS les tirages, comme partout : on consomme puis on
       jette, sinon une pointe d'étoile rebattrait toute la foule. Et
       l'on s'écarte du podium, qui est rond et qu'on ne piétine pas. */
    if(!dansLaScene(px, py)) continue;
    if(ray < IBI_DEMI + 1.1) continue;
    out.push(o);
  }
  for(i = 0; i < IBI_NB_DANSEURS; i++){
    /* La largeur, TIRÉE PAR TRANCHES : chaque danseur a sa bande, et
       tire sa place DEDANS. Un tirage libre sur vingt laisse toujours
       un trou quelque part et un tas ailleurs — et un trou au milieu
       du premier rang, devant le DJ, c'est le seul endroit où l'œil
       va. La profondeur, elle, reste libre : c'est elle qui casse
       l'alignement que les tranches créeraient. */
    var t = ((i + al()) / IBI_NB_DANSEURS * 2 - 1) * 3.4;
    /* la profondeur : le coin sud du plancher est à IBI_COIN, on se
       range juste derrière. Les bords reculent (|t| * 0.28) : une
       foule devant une scène fait un arc, pas une barre. */
    var s = IBI_COIN + 0.35 + al() * 3.2 + Math.abs(t) * 0.28;
    out.push({
      gx:SCENE_GX + t + s,
      gy:SCENE_GY - t + s,
      /* le décalage sur le battement : personne ne saute exactement
         en même temps que son voisin, et c'est ce petit désordre qui
         fait une foule plutôt qu'une chorégraphie */
      dec:al() * 0.34,
      /* trois façons de danser : sauter, se balancer, lever les bras */
      style:(al() * 3) | 0,
      /* la moitié saute un temps sur deux : à vingt qui sautent
         ensemble, la piste ressemble à un ressort */
      demi:al() < 0.5 ? 1 : 0,
      teinte:(al() * 6) | 0,
      taille:IBI_TAILLE * (1 + al() * 0.4),
      droite:al() < 0.5 ? 1 : -1
    });
  }
  return out;
}

/* Six tenues, franches : à cette taille, c'est la couleur qui
   distingue une personne d'une autre, pas son visage. */
var IBI_TENUES = [
  { haut:"#ff4d8d", bas:"#2a2740" }, { haut:"#3ee0d0", bas:"#243040" },
  { haut:"#ffd24a", bas:"#3a2c22" }, { haut:"#a97bff", bas:"#262038" },
  { haut:"#ffffff", bas:"#1f2a38" }, { haut:"#ff8a3c", bas:"#2e2436" }
];
var IBI_PEAUX = ["#f0d0ae", "#d8a878", "#a87448", "#7a5232"];

/* Un danseur, dans le repère du monde. Il tient en une vingtaine de
   tracés : à l'écran il fait vingt pixels de haut, et le détail qu'on
   y mettrait ne se verrait pas — ce qui se voit, c'est le MOUVEMENT. */
function dessineDanseur(c, d, tps){
  var p = versEcran(cam, d.gx, d.gy);
  var z = cam.z * d.taille;
  if(z < 0.06) return;
  var T = IBI_TENUES[d.teinte];
  /* `HL` et non `H` : `H` est la hauteur de l'écran, une variable
     globale, et l'ombrer dans une fonction appelée cinq cents fois
     par image est le genre de piège qu'on ne trouve qu'à la loupe. */
  var HL = horlogeIbiza(tps);
  var tt = HL.t + d.dec;
  var b = tt - Math.floor(tt);
  /* un temps sur deux pour ceux qui lèvent le pied : le compte des
     battements écoulés dit lequel */
  var mesure = Math.floor(tt);
  var actif = d.demi ? (mesure % 2 === 0) : 1;
  var f = Math.exp(-b * 5.2) * (actif ? 1 : 0.35);

  /* ────────────────────────────────────────────────────────────
     « LES GENS DANSENT FORT ET JUMPENT »

     Ils se balançaient. Ils sautent maintenant, et ils sautent sur
     une PARABOLE — voir sautIbiza : un corps décolle, monte,
     retombe, puis attend le temps suivant. La différence avec
     l'ancienne courbe se voit à l'œil nu : un danseur qui montait
     d'un coup et redescendait mollement avait l'air tiré vers le
     haut par un fil.

     ET TOUT EST MULTIPLIÉ PAR LA SECTION EN COURS. Sur le drop, la
     piste décolle de moitié en plus ; sur le break, elle repose.
     C'est là que se joue l'essentiel de l'effet « calqué sur la
     musique » : ce n'est pas le clignotement qui fait qu'on voit la
     musique, c'est que la foule change d'énergie en même temps
     qu'elle.
     ──────────────────────────────────────────────────────────── */
  var F = HL.force;
  var saut = 0, pencheX = 0, bras = 0;
  if(d.style === 0){
    /* LE SAUTEUR : les deux pieds décollent, les bras montent avec */
    saut = sautIbiza(b, 0.74) * 9.0 * F * (actif ? 1 : 0.45);
    bras = 0.45 + sautIbiza(b, 0.74) * 0.55 * F;
  }else if(d.style === 1){
    /* LE BALANCIER : il ne saute pas, il pompe — et il pompe fort */
    pencheX = Math.sin(b * 6.2832) * 3.0 * d.droite * F;
    saut = sautIbiza(b, 0.9) * 2.2 * F;
    bras = 0.30 + f * 0.35 * F;
  }else{
    /* LES BRAS EN L'AIR, et un petit pogo dessous */
    bras = 0.30 + f * 0.62 * F;
    saut = sautIbiza(b, 0.8) * 4.0 * F;
  }
  /* ET LES BRAS SONT BORNÉS. Ils ne l'étaient pas : sur un drop, où
     tout est multiplié par une fois et demie, ils atteignaient onze
     unités sur un buste qui en fait six — cinq cents personnes avec
     des antennes. Un bras humain fait la longueur du buste, pas le
     double, et la borne est là pour le rappeler quelle que soit la
     section. */
  if(bras > 1.15) bras = 1.15;

  c.save();
  c.translate(p.x + pencheX * z, p.y - saut * z);
  c.scale(z, z);

  /* ================================================================
     DE LOIN, UNE SILHOUETTE — ET C'EST UNE QUESTION D'IMAGES PAR
     SECONDE, PAS DE GOÛT.

     La piste porte près de cinq cents personnes, chacune faite d'une
     douzaine de tracés : bras en courbe de Bézier, jambes, ombre,
     cheveux. Vu de l'île entière, tout cela tient dans HUIT PIXELS de
     haut — on ne distingue même pas les bras.

     ET LA MESURE DIT LA VÉRITÉ, qui n'est pas celle qu'on attendait :
     à l'échelle de l'île, l'image coûte soixante-dix millisecondes
     contre cinquante-deux à la guinguette, et la simplification n'en
     rend qu'une ou deux. Le prix est ailleurs — dans les huit cents
     défenses, qui sont l'objet même de cette carte. On garde tout de
     même la silhouette : elle retire quatre mille cinq cents tracés
     par image pour rien de visible, et ce qui ne coûte rien sur une
     machine de bureau se paie sur un téléphone.

     Le seuil porte sur le zoom EFFECTIF du danseur — `cam.z` multiplié
     par sa taille — et non sur celui de la caméra : depuis qu'ils sont
     une fois et demie plus grands, un seuil réglé sur la caméra ne se
     déclenchait plus jamais. Zéro quatre-vingt-cinq, c'est onze pixels
     de haut : en dessous, un bras ne fait plus un pixel. */
  /* L'OMBRE RÉTRÉCIT QUAND IL DÉCOLLE, et c'est elle qui donne la
     hauteur : sans ça, un danseur en l'air a l'air d'un danseur monté
     d'un cran, pas d'un danseur qui saute. Elle reste au sol — elle ne
     monte pas avec lui. */
  var om = 1 / (1 + saut * 0.085);
  if(z < 0.85){
    c.fillStyle = "rgba(30,40,70,.26)";
    c.beginPath();
    c.ellipse(-pencheX, saut, 3.4 * om, 1.5 * om, 0, 0, 6.2832); c.fill();
    c.fillStyle = T.haut;
    c.fillRect(-2.1, -10.4, 4.2, 7.0);
    c.fillStyle = IBI_PEAUX[d.teinte % 4];
    c.beginPath(); c.arc(0, -12.4, 2.0, 0, 6.2832); c.fill();
    c.restore();
    return;
  }

  c.fillStyle = "rgba(30,40,70,.26)";
  c.beginPath();
  c.ellipse(-pencheX, saut, 3.4 * om, 1.5 * om, 0, 0, 6.2832); c.fill();

  /* JAMBES. Elles se replient en l'air : un saut jambes tendues est un
     saut de mannequin. Le repli suit la hauteur, donc il se défait
     tout seul à l'atterrissage. */
  var repli = Math.min(1, saut / 6) * 1.5;
  c.strokeStyle = T.bas; c.lineWidth = 1.7; c.lineCap = "round";
  c.beginPath(); c.moveTo(-0.9, -4.4); c.lineTo(-1.5 - pencheX * 0.2, -repli); c.stroke();
  c.beginPath(); c.moveTo(0.9, -4.4); c.lineTo(1.5 - pencheX * 0.2, -repli); c.stroke();
  /* buste */
  c.fillStyle = T.haut;
  c.beginPath();
  if(c.roundRect) c.roundRect(-2.1, -10.4, 4.2, 6.4, 1.2);
  else c.rect(-2.1, -10.4, 4.2, 6.4);
  c.fill();
  /* bras : c'est eux qui portent la danse */
  c.strokeStyle = IBI_PEAUX[d.teinte % 4]; c.lineWidth = 1.3;
  var ay = -10.0, lev = bras * 4.2;
  c.beginPath();
  c.moveTo(-1.9, ay);
  c.quadraticCurveTo(-4.4, ay - lev * 0.5, -4.0 - bras, ay - lev);
  c.stroke();
  c.beginPath();
  c.moveTo(1.9, ay);
  c.quadraticCurveTo(4.4, ay - lev * 0.5, 4.0 + bras, ay - lev);
  c.stroke();
  /* tête */
  c.fillStyle = IBI_PEAUX[d.teinte % 4];
  c.beginPath(); c.arc(0, -12.4, 2.0, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(20,14,26,.75)";
  c.beginPath(); c.arc(0, -13.2, 2.0, 3.34, 6.08); c.fill();
  c.restore();
}

/* ---------------------------------------------------------------
   LA SCÈNE
   --------------------------------------------------------------- */
/* Elle est dans le TRI DE PROFONDEUR, comme un bâtiment : les troupes
   qui passent au sud doivent lui passer devant, et celles du nord
   derrière. Sans quoi une scène de trois mètres flotte au-dessus de
   tout le monde. */
var IBI_SC = {
  pont:"#333c4c", pontO:"#242c39", pontC:"#454f61",
  jupe:"#1e2836", metal:"#4a535f", metalC:"#79838f",
  enceinte:"#22262e", enceinteC:"#3a404a", membrane:"#12151a"
};
/* Les quatre teintes des projecteurs, changées à chaque temps. */
var IBI_TEINTES = ["255,77,141", "62,224,208", "255,210,74", "169,123,255"];

function dessineSceneIbiza(c, tps){
  var p = versEcran(cam, SCENE_GX, SCENE_GY);
  var z = cam.z;
  var f = frappe(tps);
  var i;
  c.save();
  c.translate(p.x, p.y);
  c.scale(z, z);

  /* --- 1. LE PODIUM, un losange iso en volume --- */
  /* L'ÉCHELLE, REFAITE UNE FOIS. Le podium mesurait 9,5 CASES de
     demi-largeur — dix-neuf cases de côté, la moitié du carré réservé —
     pendant que le mobilier était dessiné en unités de l'ordre du
     pixel : une estrade de terrain de football avec une platine de
     maison de poupée dessus. Tout est maintenant dans le même repère :
     le podium fait trois cases et demie de demi-diagonale, et le
     mobilier est à sa taille. Le carré réservé, lui, reste large —
     c'est la PISTE, et elle doit tenir la foule. */
  /* ================================================================
     ET LE PODIUM EST ROND.

     « La scène doit être ronde. »

     Il était un losange — c'est-à-dire un CARRÉ du monde vu en
     isométrie. Un cercle du monde, lui, se projette en ellipse DROITE
     de demi-axes 26 R √2 et 13 R √2 : et comme RX vaut très exactement
     26 √2 et RY 13 √2, l'ellipse de demi-axes IBI_DEMI × RX et
     IBI_DEMI × RY est le cercle de rayon IBI_DEMI CASES. Le podium
     rond a donc trois cases et demie de RAYON là où le losange n'avait
     que deux cases et demie de demi-côté : il grandit un peu, et c'est
     très bien — c'est ce que le croquis demandait.

     Les trois pieds du portique, eux, ne bougent pas d'un pixel : ils
     étaient aux coins ouest, nord et est du losange, rentrés de 10 %,
     et ces trois points-là sont sur l'ellipse. Un dessin juste se
     transpose sans se refaire. */
  var LX = IBI_DEMI * RX, LY = IBI_DEMI * RY, H = IBI_H;
  function dessus(dy){
    c.beginPath();
    c.ellipse(0, dy, LX, LY, 0, 0, 6.2832);
    c.closePath();
  }
  /* l'ombre portée */
  c.fillStyle = "rgba(30,45,80,.22)";
  dessus(2); c.fill();
  /* LA JUPE DU CYLINDRE : l'arc SUD du dessus, deux verticales, et
     l'arc sud du pied. C'est la seule partie du volume qu'on voit —
     le nord du cylindre est caché par son propre plateau. Sur le
     canevas, l'angle zéro est à l'est et l'angle π/2 au SUD (les y
     descendent) : l'arc de 0 à π est donc bien la moitié qu'on voit. */
  c.beginPath();
  c.moveTo(LX, -H);
  c.ellipse(0, -H, LX, LY, 0, 0, Math.PI, false);
  c.lineTo(-LX, 0);
  c.ellipse(0, 0, LX, LY, 0, Math.PI, 0, true);
  c.closePath();
  var gj = c.createLinearGradient(-LX, 0, LX, 0);
  gj.addColorStop(0, IBI_SC.jupe);
  gj.addColorStop(0.45, "#161d28");
  gj.addColorStop(1, "#0f151e");
  c.fillStyle = gj; c.fill();
  /* LE PLANCHER, SOMBRE. Il était couleur bois clair — c'est-à-dire
     très exactement la couleur du sable d'Ibiste autour : de loin le
     podium ne se lisait pas comme une scène mais comme un plateau de
     terrain surélevé. Un plancher de scène est NOIR, et ce qu'on y
     voit, ce sont les flaques de lumière des projecteurs. */
  var gp = c.createLinearGradient(-LX, -H, LX, -H);
  gp.addColorStop(0, IBI_SC.pontC); gp.addColorStop(0.5, IBI_SC.pont);
  gp.addColorStop(1, IBI_SC.pontO);
  c.fillStyle = gp;
  dessus(-H); c.fill();
  /* les lames du plancher, coupées au disque */
  c.save();
  dessus(-H); c.clip();
  c.strokeStyle = "rgba(255,255,255,.07)";
  c.lineWidth = 0.9;
  for(i = -4; i <= 4; i++){
    c.beginPath();
    c.moveTo(i * LX / 5, -LY - H); c.lineTo(i * LX / 5, LY - H);
    c.stroke();
  }
  c.restore();
  /* LES FLAQUES DE COULEUR. Elles sont posées AVANT le mobilier, et
     découpées au losange : sans le `clip`, la lumière de la scène
     baverait sur le sable et le podium perdrait son arête. */
  var mes = mesureIbiza(tps);
  c.save();
  dessus(-H); c.clip();
  c.globalCompositeOperation = "lighter";
  for(i = 0; i < 5; i++){
    var fx0 = (i - 2) * LX * 0.36;
    var fy0 = -H + LY * 0.30 - Math.abs(i - 2) * LY * 0.10;
    var gf = c.createRadialGradient(fx0, fy0, 0, fx0, fy0, LX * 0.40);
    var cf = IBI_TEINTES[(mes + i) % 4];
    gf.addColorStop(0, "rgba(" + cf + "," + (0.20 + f * 0.26) + ")");
    gf.addColorStop(1, "rgba(" + cf + ",0)");
    c.fillStyle = gf;
    c.save();
    c.translate(fx0, fy0); c.scale(1, 0.5); c.translate(-fx0, -fy0);
    c.beginPath(); c.arc(fx0, fy0, LX * 0.40, 0, 6.2832); c.fill();
    c.restore();
  }
  c.restore();
  /* le liseré lumineux du bord, qui pompe sur le battement */
  c.strokeStyle = "rgba(60,230,220," + (0.34 + f * 0.55) + ")";
  c.lineWidth = 2.4;
  dessus(-H); c.stroke();

  /* --- 2. LE PORTIQUE, derrière : trois mâts et deux poutres ---
     ET IL EST DESSINÉ AVANT LA RÉGIE, depuis qu'il y a un DJ à taille
     d'homme dessous. Le mât du nord tombe à x = 0, c'est-à-dire très
     exactement là où le DJ se tient : dessiné après lui, il lui
     barrait le buste d'un trait noir vertical. On peint donc du fond
     vers l'avant, comme il se doit — le portique au fond, la régie et
     le DJ au milieu, les enceintes devant. */
  /* LE PORTIQUE ÉTAIT PLAT. Il était fait de deux mâts verticaux aux
     deux extrémités de l'écran et d'une poutre HORIZONTALE entre eux :
     un rectangle dessiné dans le repère de l'écran, posé sur une image
     isométrique. Rien ne trahit plus vite un décor collé qu'une ligne
     horizontale au milieu d'un monde où AUCUNE arête ne l'est.
     Il suit maintenant les deux arêtes ARRIÈRE du plancher — ouest
     vers nord, nord vers est — donc trois mâts et deux poutres qui
     descendent chacune dans son axe iso. C'est le même objet, mais il
     est enfin DANS la scène au lieu d'être devant. */
  var mh = IBI_MH, ir = 0.90;                    // les pieds, rentrés sur le plancher
  var pieds = [
    { x:-LX * ir, y:-H },                        // coin ouest
    { x:0,        y:-H - LY * ir },              // coin nord
    { x: LX * ir, y:-H }                         // coin est
  ];
  /* Une poutre en treillis : deux membrures parallèles et un zigzag
     entre elles. À cette taille, c'est le zigzag qui dit « structure
     de scène » plutôt que « barre ». */
  function poutre(a, b, ep){
    var dx = b.x - a.x, dy = b.y - a.y;
    var n = Math.max(3, Math.round(Math.sqrt(dx * dx + dy * dy) / 13));
    c.strokeStyle = IBI_SC.metal; c.lineWidth = 2.6;
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    c.beginPath(); c.moveTo(a.x, a.y + ep); c.lineTo(b.x, b.y + ep); c.stroke();
    c.strokeStyle = "rgba(121,131,143,.72)"; c.lineWidth = 1.5;
    c.beginPath();
    for(var q = 0; q <= n; q++){
      var qx = a.x + dx * q / n, qy = a.y + dy * q / n + (q % 2 ? ep : 0);
      if(q === 0) c.moveTo(qx, qy); else c.lineTo(qx, qy);
    }
    c.stroke();
  }
  /* les trois mâts */
  for(i = 0; i < 3; i++){
    var mx2 = pieds[i].x, my2 = pieds[i].y;
    c.strokeStyle = IBI_SC.metal; c.lineWidth = 4.4;
    c.beginPath(); c.moveTo(mx2, my2); c.lineTo(mx2, my2 - mh); c.stroke();
    c.strokeStyle = "rgba(121,131,143,.6)"; c.lineWidth = 1.6;
    for(var k = 1; k < 9; k++){
      var yk = my2 - mh * k / 9;
      c.beginPath(); c.moveTo(mx2 - 4.2, yk); c.lineTo(mx2 + 4.2, yk - 3); c.stroke();
    }
    /* le socle */
    c.fillStyle = "#1c222c";
    c.beginPath(); c.ellipse(mx2, my2, 7, 3.2, 0, 0, 6.2832); c.fill();
  }
  /* les deux poutres, à la cote des sommets */
  var hauts = [
    { x:pieds[0].x, y:pieds[0].y - mh },
    { x:pieds[1].x, y:pieds[1].y - mh },
    { x:pieds[2].x, y:pieds[2].y - mh }
  ];
  poutre(hauts[0], hauts[1], 7);
  poutre(hauts[1], hauts[2], 7);

  /* LES PROJECTEURS pendus aux poutres : ils changent de couleur au
     battement, tous ensemble — c'est ce qui fait qu'on voit la
     musique. Quatre par poutre, le mât du nord en portant un seul :
     sept en tout, comme avant, mais chacun à sa place sur son axe.

     ILS BALAIENT MAINTENANT. Un projecteur fixe éclaire toujours la
     même flaque : au bout de dix secondes on ne le voit plus. Le
     leur oscille lentement, chacun à son rythme, et le cône suit —
     c'est le mouvement, pas la couleur, qui fait un jeu de lumière.
     Et tout est multiplié par la section : sur le drop les cônes
     s'ouvrent, sur le break ils se referment presque. */
  var Fs = forceIbiza(tps);
  for(i = 0; i < 7; i++){
    var seg = i < 4 ? 0 : 1;                     // sur quelle poutre
    var u = seg ? (i - 3) / 3 : i / 3;           // où, le long de la poutre
    var A = hauts[seg], B = hauts[seg + 1];
    var lx2 = A.x + (B.x - A.x) * u;
    var ly2 = A.y + (B.y - A.y) * u + 7;
    var col = IBI_TEINTES[(mes + i) % 4];
    c.fillStyle = "#1a1e26";
    c.fillRect(lx2 - 2.8, ly2, 5.6, 7);
    c.fillStyle = "rgba(" + col + "," + (0.40 + f * 0.6) + ")";
    c.beginPath(); c.ellipse(lx2, ly2 + 7.6, 3.2, 2.2, 0, 0, 6.2832); c.fill();
    /* le cône de lumière : il descend vers l'AVANT du plancher, pas
       droit sous la lampe — un projecteur de scène éclaire la scène,
       pas ses propres pieds — et il balaie */
    var bal = Math.sin(tps * (0.42 + i * 0.09) + i * 2.3) * LX * 0.34 * Fs;
    var cx2 = lx2 * 0.55 + bal, cy2 = -H + LY * 0.22;
    var gc = c.createLinearGradient(lx2, ly2 + 6, cx2, cy2);
    gc.addColorStop(0, "rgba(" + col + "," + ((0.15 + f * 0.24) * Fs) + ")");
    gc.addColorStop(1, "rgba(" + col + ",0)");
    c.fillStyle = gc;
    c.beginPath();
    c.moveTo(lx2 - 2.4, ly2 + 7.6);
    c.lineTo(lx2 + 2.4, ly2 + 7.6);
    c.lineTo(cx2 + 15 + Fs * 6, cy2);
    c.lineTo(cx2 - 15 - Fs * 6, cy2);
    c.closePath(); c.fill();
  }

  /* ================================================================
     LA BOULE À FACETTES, suspendue au milieu du portique

     Elle ne coûte que quelques tracés et elle dit « club » plus vite
     que tout le reste. Elle tourne lentement — une boule à facettes
     tourne TOUJOURS lentement, c'est ce qui la distingue d'un
     gyrophare — et elle jette des éclats qui tournent avec elle.
     ================================================================ */
  var bx = 0, by2 = hauts[1].y + 16;
  c.strokeStyle = "rgba(120,132,148,.7)"; c.lineWidth = 1;
  c.beginPath(); c.moveTo(bx, hauts[1].y + 7); c.lineTo(bx, by2 - 6); c.stroke();
  var gbo = c.createRadialGradient(bx - 2, by2 - 2, 0.5, bx, by2, 7);
  gbo.addColorStop(0, "#e8eef8"); gbo.addColorStop(0.6, "#8e9aab"); gbo.addColorStop(1, "#414b5a");
  c.fillStyle = gbo;
  c.beginPath(); c.arc(bx, by2, 6.2, 0, 6.2832); c.fill();
  c.save();
  c.globalCompositeOperation = "lighter";
  for(i = 0; i < 10; i++){
    var abo = tps * 0.5 + i * 0.6283;
    var rbo = 5.4 + (i % 3) * 3.4;
    var ebo = 0.22 + 0.5 * Math.max(0, Math.cos(abo));
    c.fillStyle = "rgba(215,235,255," + (ebo * (0.35 + f * 0.4)) + ")";
    c.beginPath();
    c.arc(bx + Math.cos(abo) * rbo * 2.6, by2 + Math.sin(abo * 0.6) * rbo * 0.8, 1.5, 0, 6.2832);
    c.fill();
  }
  c.restore();

  /* ================================================================
     3. LA RÉGIE, ET LE DJ DERRIÈRE

     (Troisième plan : derrière le portique, devant les enceintes.)

     « La table de mixage doit être plus grande et mieux dimensionnée,
     plus de détail. Le DJ en folie, une main en l'air. »

     CE QUI N'ALLAIT PAS, ET C'ÉTAIT UNE QUESTION D'ÉCHELLE, PAS DE
     DÉTAIL. La table faisait quarante unités de large sur un plateau
     qui en fait deux cent cinquante-sept : seize pour cent du
     diamètre. Sur la photo d'une vraie scène ronde, la régie en tient
     entre le tiers et la moitié — c'est un MEUBLE, avec une façade
     qu'on voit de loin et sur laquelle on colle un logo, pas une
     tablette posée là. Elle en fait maintenant quatre-vingt-douze, et
     elle a une façade de vingt-six de haut.

     ET ON LA CONSTRUIT EN TROIS PLANS, comme un vrai meuble vu de
     trois quarts au-dessus : la FAÇADE qu'on voit de face, le PLATEAU
     en raccourci au-dessus d'elle, et le MATÉRIEL posé sur le plateau.
     L'ancienne version n'avait qu'un rectangle et des ellipses
     dessus : rien ne disait dans quel sens le meuble était tourné.
     ================================================================ */
  /* Reculée d'un tiers vers le nord : le DJ joue au fond de la scène
     et laisse le devant du plancher vide, comme il se doit. */
  var tbase = -H - LY * 0.34;
  var BW = 46;                  // demi-largeur de la régie
  var BH = 26;                  // hauteur de la façade
  var BD = 14;                  // profondeur apparente du plateau
  var byF = tbase - BH;         // l'arête AVANT du plateau
  var byB = byF - BD;           // l'arête ARRIÈRE
  var tcol = IBI_TEINTES[mes % 4];

  /* --- 3a. L'OMBRE de la régie sur le plancher --- */
  c.fillStyle = "rgba(0,0,0,.30)";
  c.beginPath(); c.ellipse(0, tbase + 1.5, BW * 1.04, 5, 0, 0, 6.2832); c.fill();

  /* --- 3b. LA FAÇADE ---
     Un panneau sombre, un cadre métallique, et au milieu la plaque
     lumineuse qui porte le nom. C'est elle qu'on voit de loin, et
     c'est elle qui pompe sur le temps. */
  var gfa = c.createLinearGradient(0, byF, 0, tbase);
  gfa.addColorStop(0, "#20242e");
  gfa.addColorStop(0.55, "#151922");
  gfa.addColorStop(1, "#0c0f16");
  c.fillStyle = gfa;
  c.fillRect(-BW, byF, BW * 2, BH);
  /* les deux montants et la plinthe, en métal brossé */
  c.fillStyle = "#39404e";
  c.fillRect(-BW, byF, 3.2, BH);
  c.fillRect(BW - 3.2, byF, 3.2, BH);
  c.fillRect(-BW, tbase - 2.4, BW * 2, 2.4);
  /* LE BANDEAU DE LED en haut de la façade : douze segments qui
     défilent. Un ruban qui court, c'est le détail le moins cher et le
     plus reconnaissable d'une régie de club. */
  for(i = 0; i < 12; i++){
    var lu = (i - mes * 2) % 12; if(lu < 0) lu += 12;
    var lint = 0.16 + 0.74 * Math.exp(-lu * 0.55);
    c.fillStyle = "rgba(" + IBI_TEINTES[(mes + i) % 4] + "," + lint + ")";
    c.fillRect(-BW + 3.6 + i * (BW * 2 - 7.2) / 12, byF + 1.2,
               (BW * 2 - 7.2) / 12 - 1.1, 2.2);
  }
  /* LA PLAQUE DU NOM. Elle respire sur la frappe, et le nom s'écrit
     avec un Y — c'est MILY, et ça n'a jamais été autrement. */
  var pw = 34, ph = 12, pyy = byF + 7;
  c.fillStyle = "rgba(8,10,16,.9)";
  c.beginPath();
  if(c.roundRect) c.roundRect(-pw / 2, pyy, pw, ph, 2.4);
  else c.rect(-pw / 2, pyy, pw, ph);
  c.fill();
  c.strokeStyle = "rgba(" + tcol + "," + (0.35 + f * 0.55) + ")";
  c.lineWidth = 1.1; c.stroke();
  c.save();
  c.globalCompositeOperation = "lighter";
  c.fillStyle = "rgba(" + tcol + "," + (0.55 + f * 0.45) + ")";
  c.font = "900 9px 'Trebuchet MS', 'Segoe UI', sans-serif";
  c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText("MILY", 0, pyy + ph * 0.55);
  c.restore();
  /* LES DEUX VU-MÈTRES, de part et d'autre de la plaque. Huit
     segments qui montent avec la frappe et redescendent : c'est le
     seul cadran du jeu qui dise ce que la musique est en train de
     faire. */
  for(i = 0; i < 2; i++){
    var vx = (i ? 1 : -1) * 30;
    for(var vs = 0; vs < 8; vs++){
      var seuil = vs / 8;
      var on = (f * 0.85 + 0.12) * forceIbiza(tps) > seuil;
      c.fillStyle = on
        ? (vs > 5 ? "rgba(255,90,70,.95)" : (vs > 3 ? "rgba(255,205,70,.9)" : "rgba(90,235,150,.85)"))
        : "rgba(255,255,255,.07)";
      c.fillRect(vx - 4, byF + 19 - vs * 1.55, 8, 1.05);
    }
  }
  /* ================================================================
     3c. LE DJ, ET IL EST EN FOLIE

     « Le DJ doit être en folie, une main en l'air. »

     Il avait une main en l'air, et elle montait de onze unités sur la
     frappe : un salut poli. Ce qu'on demande ici, c'est autre chose —
     le bras est en l'air EN PERMANENCE, il pompe sur le temps, le
     corps saute avec, la tête suit, et l'autre main travaille la
     platine. Un DJ en folie ne lève pas le bras de temps en temps : il
     ne le baisse jamais.

     ET IL EST PLUS GRAND. Il faisait trente-huit unités de haut
     derrière une table de dix-sept ; la régie en fait maintenant
     quarante avec son plateau, et un DJ à sa taille d'avant
     disparaîtrait derrière son propre meuble. Un facteur d'échelle en
     tête de bloc, et tout le dessin suit.

     ET IL EST DESSINÉ AVANT LE PLATEAU, ce qui n'est pas un détail :
     un DJ posé PAR-DESSUS sa régie flotte devant elle, on l'a vu sur
     les premières photos. Dessiné dessous, le plateau lui coupe le
     bas du buste et sa main gauche disparaît derrière la platine
     qu'elle travaille. C'est l'ordre du peintre — le fond d'abord — et
     c'est lui, et pas le dessin du bonhomme, qui fait qu'il est DANS
     la scène.
     ================================================================ */
  c.save();
  c.translate(3, byB + 7);
  var DJE = 1.5;                                    // l'échelle du bonhomme
  c.scale(DJE, DJE);
  var bj = battement(tps);
  var Fj = forceIbiza(tps);
  var saut2 = sautIbiza(bj, 0.72) * 4.4 * Fj;       // il saute derrière sa régie
  /* LE BRAS EST TENDU, ET IL LE RESTE. La première version le levait
     de neuf à vingt-sept unités : au repos, un moignon collé à
     l'épaule ; au sommet, un bras plus long que le corps. Un bras fait
     la hauteur du buste, ni plus ni moins — la main part donc de
     trente-huit au-dessus de l'épaule et ne pompe que de sept. Ce
     qu'on veut voir n'est pas un bras qui s'allonge, c'est un bras
     qui SCANDE. */
  var lev2 = f * 7 * Fj;                            // le bras qui pompe
  var pen2 = Math.sin(bj * 6.2832) * 1.5;           // et le corps qui roule
  c.translate(pen2 * 0.6, -saut2);

  /* LE HALO DERRIÈRE LUI : un contre-jour. Sans lui, un bonhomme
     sombre devant un fond sombre n'a pas de silhouette. */
  c.save();
  c.globalCompositeOperation = "lighter";
  var ghd = c.createRadialGradient(0, -22, 2, 0, -22, 34);
  ghd.addColorStop(0, "rgba(" + tcol + "," + (0.20 + f * 0.26) + ")");
  ghd.addColorStop(1, "rgba(" + tcol + ",0)");
  c.fillStyle = ghd;
  c.beginPath(); c.arc(0, -22, 34, 0, 6.2832); c.fill();
  c.restore();

  c.fillStyle = "#20242e";                          // buste
  c.beginPath();
  if(c.roundRect) c.roundRect(-7.6 + pen2 * 0.3, -24, 15.2, 23, 4);
  else c.rect(-7.6 + pen2 * 0.3, -24, 15.2, 23);
  c.fill();
  /* le gilet fluo, qui prend la couleur du moment */
  c.fillStyle = "rgba(" + tcol + ",.28)";
  c.beginPath();
  if(c.roundRect) c.roundRect(-3.2 + pen2 * 0.3, -23, 6.4, 21, 2);
  else c.rect(-3.2 + pen2 * 0.3, -23, 6.4, 21);
  c.fill();

  c.strokeStyle = "#e2c39e"; c.lineWidth = 4.4; c.lineCap = "round";
  /* LA MAIN QUI TRAVAILLE : elle descend sur la platine de gauche et
     tressaute avec le disque. Elle va CHERCHER le plateau tournant —
     dont le centre tombe à peu près à (−21, 0) dans ce repère — et
     comme elle est dessinée avant lui, elle finit dessous : une main
     posée sur un disque, et non une main tendue à côté. */
  c.beginPath();
  c.moveTo(-7, -21);
  c.quadraticCurveTo(-13.5, -17, -17.5 - f * 1.4, -2.5 + f * 1.4);
  c.stroke();
  /* LA MAIN EN L'AIR : elle est là tout le temps, et elle pompe.
     Presque à la verticale de l'épaule — un bras tendu en l'air ne
     part pas de côté, il monte. */
  var hx = 10.5 + pen2 * 0.8, hy = -38 - lev2;
  c.beginPath();
  c.moveTo(7, -22);
  c.quadraticCurveTo(12.4, -30 - lev2 * 0.4, hx, hy);
  c.stroke();
  /* les deux doigts levés : c'est le geste, et il tient en deux
     traits — sans eux, la main en l'air est une boule au bout d'un
     bras */
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(hx - 1.2, hy - 1.6); c.lineTo(hx - 2.2, hy - 6.2); c.stroke();
  c.beginPath();
  c.moveTo(hx + 1.0, hy - 1.6); c.lineTo(hx + 1.8, hy - 6.0); c.stroke();
  c.lineWidth = 4.4;
  /* le poing, et l'éclat qui part de lui sur la frappe. Il est PLUS
     LARGE QUE LE BRAS — un poing plus fin que l'avant-bras qui le
     porte se lit comme un bras coupé net. */
  c.fillStyle = "#e8caa6";
  c.beginPath(); c.arc(hx, hy, 3.3, 0, 6.2832); c.fill();
  c.save();
  c.globalCompositeOperation = "lighter";
  var gpo = c.createRadialGradient(hx, hy, 0, hx, hy, 9 + f * 8);
  gpo.addColorStop(0, "rgba(255,240,210," + (0.16 + f * 0.42) + ")");
  gpo.addColorStop(1, "rgba(255,220,160,0)");
  c.fillStyle = gpo;
  c.beginPath(); c.arc(hx, hy, 9 + f * 8, 0, 6.2832); c.fill();
  c.restore();

  /* LA TÊTE, qui suit le mouvement : elle penche du côté du bras
     levé et hoche sur le temps. */
  var tex = pen2 * 0.9, tey = -30.4 + f * 0.9;
  c.fillStyle = "#e8caa6";
  c.beginPath(); c.arc(tex, tey, 7, 0, 6.2832); c.fill();
  c.fillStyle = "#1b1520";
  c.beginPath(); c.arc(tex, tey - 2.5, 7, 3.3, 6.12); c.fill();
  /* les lunettes noires : c'est le détail qui fait le personnage */
  c.fillStyle = "#0d1016";
  c.beginPath();
  if(c.roundRect) c.roundRect(tex - 5.4, tey - 1.6, 10.8, 3.2, 1.4);
  else c.rect(tex - 5.4, tey - 1.6, 10.8, 3.2);
  c.fill();
  c.fillStyle = "rgba(" + tcol + ",.45)";
  c.fillRect(tex - 4.6, tey - 1.0, 3.4, 1.1);
  /* la bouche ouverte : il crie quelque chose, on ne sait pas quoi */
  c.fillStyle = "#5b2530";
  c.beginPath();
  c.ellipse(tex, tey + 3.6, 1.7, 1.1 + f * 0.9, 0, 0, 6.2832); c.fill();
  /* le casque, une oreillette repoussée derrière — comme ils font */
  c.strokeStyle = "#12161d"; c.lineWidth = 2.7;
  c.beginPath(); c.arc(tex, tey - 0.6, 9.2, 3.34, 6.08); c.stroke();
  c.fillStyle = "#12161d";
  c.beginPath(); c.ellipse(tex - 8.9, tey, 2.9, 4.1, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(tex + 8.9, tey - 3.4, 2.9, 4.1, 0, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(62,224,208,.8)";
  c.beginPath(); c.ellipse(tex - 8.9, tey, 1.1, 1.9, 0, 0, 6.2832); c.fill();
  c.restore();

  /* --- 3d. LE PLATEAU, en raccourci ---
     Un trapèze : l'arête avant fait toute la largeur, l'arête arrière
     se resserre. C'est ce resserrement, et lui seul, qui dit que le
     meuble est vu d'au-dessus. */
  c.beginPath();
  c.moveTo(-BW, byF); c.lineTo(BW, byF);
  c.lineTo(BW * 0.94, byB); c.lineTo(-BW * 0.94, byB);
  c.closePath();
  var gpl = c.createLinearGradient(0, byB, 0, byF);
  gpl.addColorStop(0, "#2f3746"); gpl.addColorStop(1, "#1b202a");
  c.fillStyle = gpl; c.fill();
  c.strokeStyle = "rgba(255,255,255,.13)"; c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(-BW, byF); c.lineTo(BW, byF); c.stroke();

  /* --- 3e. LES DEUX PLATINES ---
     Socle, plateau tournant, repère qui tourne, écran, et le fader de
     réglage à côté. Le repère tourne à sa vitesse et non à celle de la
     musique : une platine ne tourne pas au tempo, elle tourne à
     trente-trois tours. */
  for(i = 0; i < 2; i++){
    var px2 = (i ? 1 : -1) * 29;
    var pcy = byB + BD * 0.52;
    c.fillStyle = "#0e1118";                       // le socle
    c.beginPath();
    if(c.roundRect) c.roundRect(px2 - 15, pcy - 7.2, 30, 14, 2);
    else c.rect(px2 - 15, pcy - 7.2, 30, 14);
    c.fill();
    c.strokeStyle = "rgba(140,152,170,.45)"; c.lineWidth = 0.7; c.stroke();
    /* le plateau tournant */
    var gpt = c.createRadialGradient(px2 - 3, pcy - 2, 1, px2, pcy, 11);
    gpt.addColorStop(0, "#b6bfcd"); gpt.addColorStop(1, "#6d7686");
    c.fillStyle = gpt;
    c.beginPath(); c.ellipse(px2, pcy, 10.5, 4.7, 0, 0, 6.2832); c.fill();
    c.fillStyle = "#171b24";                       // l'étiquette du disque
    c.beginPath(); c.ellipse(px2, pcy, 3.6, 1.6, 0, 0, 6.2832); c.fill();
    /* les sillons */
    c.strokeStyle = "rgba(20,24,32,.35)"; c.lineWidth = 0.5;
    for(var sg = 1; sg <= 3; sg++){
      c.beginPath();
      c.ellipse(px2, pcy, 4.4 + sg * 1.9, (4.4 + sg * 1.9) * 0.447, 0, 0, 6.2832);
      c.stroke();
    }
    /* le repère, qui tourne */
    var a2 = tps * (i ? 3.4 : -2.8);
    c.fillStyle = "#e8523c";
    c.beginPath();
    c.ellipse(px2 + Math.cos(a2) * 7.6, pcy + Math.sin(a2) * 3.4, 1.2, 0.7, 0, 0, 6.2832);
    c.fill();
    /* le petit écran de la platine, allumé */
    c.fillStyle = "rgba(60,220,200,.55)";
    c.fillRect(px2 - 13.4, pcy - 6.2, 6.4, 2.4);
    /* le fader de vitesse, du côté extérieur */
    var fvx = px2 + (i ? 12.4 : -12.4);
    c.fillStyle = "#0a0d12"; c.fillRect(fvx - 0.7, pcy - 1.4, 1.4, 7.2);
    c.fillStyle = "#c8d0dc";
    c.fillRect(fvx - 1.9, pcy + 1.2 + Math.sin(tps * 0.7 + i * 2.1) * 2.2, 3.8, 1.3);
  }

  /* --- 3f. LE MÉLANGEUR, au centre ---
     Quatre voies, trois potentiomètres d'égalisation par voie, quatre
     curseurs, et le crossfader devant. C'est la pièce qu'on regarde
     quand on regarde une régie. */
  var mw = 15;                                   // demi-largeur du mélangeur
  c.fillStyle = "#12151d";
  c.beginPath();
  if(c.roundRect) c.roundRect(-mw, byB + 0.8, mw * 2, BD - 1.6, 1.8);
  else c.rect(-mw, byB + 0.8, mw * 2, BD - 1.6);
  c.fill();
  c.strokeStyle = "rgba(150,162,180,.40)"; c.lineWidth = 0.7; c.stroke();
  for(i = 0; i < 4; i++){
    var vx2 = -10.5 + i * 7;
    /* les trois potentiomètres, avec leur trait de position */
    for(var kn = 0; kn < 3; kn++){
      var ky = byB + 3 + kn * 2.6;
      c.fillStyle = "#39404e";
      c.beginPath(); c.arc(vx2, ky, 1.15, 0, 6.2832); c.fill();
      var ka = (i * 1.7 + kn * 2.3 + 2.1);
      c.strokeStyle = "rgba(235,242,255,.75)"; c.lineWidth = 0.45;
      c.beginPath();
      c.moveTo(vx2, ky);
      c.lineTo(vx2 + Math.cos(ka) * 1.1, ky + Math.sin(ka) * 1.1);
      c.stroke();
    }
    /* le curseur de voie : il bouge sur la musique */
    var cy0 = byB + 10.4;
    c.fillStyle = "#080a0e"; c.fillRect(vx2 - 0.55, cy0, 1.1, 3.0);
    var cpos = cy0 + 0.4 + (0.5 + 0.5 * Math.sin(tps * 2.2 + i * 1.9)) * 1.6;
    c.fillStyle = i === 1 ? "#3ee0d0" : "#c8d0dc";
    c.fillRect(vx2 - 1.5, cpos, 3.0, 1.1);
  }
  /* le crossfader, couché devant */
  c.fillStyle = "#080a0e"; c.fillRect(-6.5, byF - 2.4, 13, 1.2);
  c.fillStyle = "#e6ecf6";
  c.fillRect(-1.4 + Math.sin(tps * 0.9) * 4.6, byF - 3.1, 2.8, 2.6);

  /* --- 3g. L'ORDINATEUR, au fond à droite, écran allumé --- */
  c.save();
  c.translate(BW * 0.62, byB + 2.4);
  c.fillStyle = "#1c212b";
  c.beginPath(); c.moveTo(-7, 0); c.lineTo(7, 0); c.lineTo(6, 3.2); c.lineTo(-6, 3.2);
  c.closePath(); c.fill();
  c.fillStyle = "#0f131a";
  c.fillRect(-6.4, -8.4, 12.8, 8.4);
  c.fillStyle = "rgba(70,180,255," + (0.30 + f * 0.32) + ")";
  c.fillRect(-5.6, -7.6, 11.2, 6.8);
  /* les deux formes d'onde qui défilent sur l'écran */
  c.strokeStyle = "rgba(255,255,255,.5)"; c.lineWidth = 0.4;
  for(i = 0; i < 2; i++){
    c.beginPath();
    for(var wv = 0; wv <= 11; wv++){
      var wy = -6.4 + i * 3.2 + Math.sin(wv * 1.7 + tps * 3 + i) * 0.9;
      if(wv === 0) c.moveTo(-5.4 + wv, wy); else c.lineTo(-5.4 + wv, wy);
    }
    c.stroke();
  }
  c.restore();


  /* --- 4. LES DEUX ENCEINTES, de part et d'autre : elles sont au
     SUD du plateau, donc au premier plan, donc peintes en dernier. --- */
  for(i = 0; i < 2; i++){
    /* sur le disque, et non plus au coin d'un losange : à 0,66 du
       rayon vers l'est et l'ouest, le plateau est encore sous elles. */
    var ex = (i ? 1 : -1) * LX * 0.66, ey = -H + LY * 0.14;
    c.save();
    c.translate(ex, ey);
    var eh = 46 + f * 1.8;              // elle tressaute sur la frappe
    c.fillStyle = IBI_SC.enceinte;
    c.fillRect(-10, -eh, 20, eh);
    c.fillStyle = IBI_SC.enceinteC;
    c.fillRect(-10, -eh, 5, eh);
    /* LE LISERÉ DE LA CAISSE. Sans lui, une enceinte est un rectangle
       noir posé sur une scène claire — un monolithe. Un mince trait de
       la couleur du moment suffit à en faire du matériel. */
    c.strokeStyle = "rgba(" + tcol + "," + (0.30 + f * 0.45) + ")";
    c.lineWidth = 1.1;
    c.strokeRect(-10, -eh, 20, eh);
    /* les deux haut-parleurs */
    c.fillStyle = IBI_SC.membrane;
    c.beginPath(); c.ellipse(0, -eh * 0.72, 7, 7, 0, 0, 6.2832); c.fill();
    c.beginPath(); c.ellipse(0, -eh * 0.28, 4.4, 4.4, 0, 0, 6.2832); c.fill();
    c.fillStyle = "rgba(255,255,255,.10)";
    c.beginPath(); c.ellipse(-1.6, -eh * 0.74, 2.8, 2.8, 0, 0, 6.2832); c.fill();
    /* le souffle : un anneau qui part de la membrane à chaque frappe */
    if(f > 0.12){
      c.strokeStyle = "rgba(160,240,255," + (f * 0.30) + ")";
      c.lineWidth = 2.2;
      c.beginPath();
      c.ellipse(0, -eh * 0.72, 7 + (1 - f) * 22, 7 + (1 - f) * 22, 0, 0, 6.2832);
      c.stroke();
    }
    c.restore();
  }

  c.restore();
}

/* ================================================================
   LES LASERS, ET LE JEU DE LUMIÈRE

   « Sur le pourtour de la scène ronde il y a des lasers lumineux qui
   vont très haut dans le ciel, avec un jeu de lumière impressionnant
   si possible calqué sur le rythme de la musique. »

   Ils pointent VERS LE CIEL, donc ils passent au-dessus de tout —
   comme les rayons de Mily. Ce sont des faisceaux dans l'air : rien
   ne peut les masquer, et ils ne sont donc PAS dans le tri de
   profondeur.

   TROIS ÉTAGES, ET CHACUN A SON RÔLE :

     LE POURTOUR    seize projecteurs plantés sur le BORD du disque,
                    à intervalle régulier. Ils tirent presque droit,
                    très haut, et s'inclinent tous ensemble vers
                    l'extérieur : c'est la couronne qu'on voit sur
                    les photos, et c'est elle qu'on a demandée.
     LES BALAYEURS  les six d'avant, sur le portique. Eux croisent,
                    et c'est le croisement qu'on regarde.
     LE STROBO      sur les drops seulement, un éclair blanc sur la
                    frappe. Ailleurs : jamais. Un stroboscope qui ne
                    s'arrête pas n'est plus un effet, c'est une
                    fatigue — et sur les huit minutes que dure une
                    partie, ça devient insupportable.

   LA HAUTEUR. « Très haut dans le ciel » : les faisceaux du pourtour
   font douze cents unités, soit près de dix fois la largeur de la
   scène. Ils sortent de l'écran par le haut à tous les zooms de jeu,
   et c'est exactement ce qu'on veut — un laser qui s'arrête quelque
   part est un laser qui a une longueur, donc un objet ; un laser qui
   sort du cadre monte au ciel.

   ET TOUT EST BORNÉ PAR LA SECTION. Sur le break, la couronne
   descend à presque rien ; sur le drop, elle double et le strobo
   part. C'est ça, « calqué sur le rythme » : pas un clignotement
   régulier, mais une scène qui a la même forme que le morceau.
   ================================================================ */
var IBI_LASER_N = 16;        // les projecteurs du pourtour
var IBI_LASER_H = 1800;      // leur portée, en unités de scène — « un peu plus haut »
/* Les six teintes des balayeurs du portique. */
var IBI_LASER_T = ["255,60,120", "62,224,208", "255,200,70", "150,110,255",
                   "80,255,160", "255,120,60"];

function dessineLasersIbiza(c, tps){
  var p = versEcran(cam, SCENE_GX, SCENE_GY);
  var z = cam.z;
  if(z < 0.10) return;
  var f = frappe(tps);
  var F = forceIbiza(tps);
  var mes = mesureIbiza(tps);
  var HH = horlogeIbiza(tps);
  var LX = IBI_DEMI * RX, LY = IBI_DEMI * RY, ir = 0.90;
  var i;
  c.save();
  c.globalCompositeOperation = "lighter";
  c.lineCap = "round";

  /* ────────────────────────────────────────────────────────────
     1. LA COURONNE DU POURTOUR

     Chaque projecteur est posé sur l'ELLIPSE du plateau — qui est le
     cercle du monde, voir le commentaire du podium — et tire vers le
     haut. Son inclinaison a deux parts : une part commune, qui
     respire lentement et ouvre la couronne en éventail, et une part
     propre, qui vient de sa position sur le cercle. Un projecteur à
     l'ouest se penche vers l'ouest ; celui d'en face vers l'est.
     Sans cette part-là on obtient seize traits parallèles, ce qui
     n'est pas une couronne mais une palissade.
     ──────────────────────────────────────────────────────────── */
  var ouv = (0.22 + 0.20 * Math.sin(tps * 0.45)) * F;   // l'ouverture commune
  for(i = 0; i < IBI_LASER_N; i++){
    var an = i / IBI_LASER_N * 6.2832;
    var ox = Math.cos(an) * LX * 0.99;
    var oy = -IBI_H + Math.sin(an) * LY * 0.99;
    var x0 = p.x + ox * z, y0 = p.y + oy * z;
    /* l'inclinaison : vers l'extérieur, plus un roulis qui tourne
       autour de la scène et qui fait « respirer » la couronne */
    var incl = Math.cos(an) * ouv + Math.sin(tps * 0.8 + an * 2) * 0.10 * F;
    var lg = (IBI_LASER_H * (0.55 + F * 0.42) + f * 220 * F) * z;
    var x1 = x0 + Math.sin(incl) * lg;
    var y1 = y0 - Math.cos(incl) * lg;
    /* la teinte tourne autour du cercle et change à chaque temps :
       c'est une chenille de couleur, pas un clignotant */
    var col = IBI_LASER_T[(i + mes) % 6];
    var op = (0.11 + f * 0.19) * F;
    /* ────────────────────────────────────────────────────────────
       LE FAISCEAU S'ALLUME À UNE DISTANCE FIXE, ET C'EST TOUT LE
       PIÈGE DE CE BLOC.

       POURQUOI IL S'ALLUME PLUS HAUT QUE SA LAMPE : à pleine
       intensité dès le bord du plateau, seize faisceaux font une
       palissade devant la scène et l'on ne voit plus ni le DJ ni la
       régie. Le bas du faisceau est donc éteint sur la hauteur d'un
       bonhomme — cent vingt unités de scène.

       POURQUOI EN DISTANCE ET NON EN FRACTION. C'était écrit « 0,10 »,
       soit un dixième de la course. Le jour où l'on a allongé les
       faisceaux de douze cents à dix-huit cents unités pour les faire
       monter plus haut, ce dixième a suivi : l'allumage est passé de
       cent vingt à cent quatre-vingts unités, puis la bande vive de
       456 à 684 — et tout le faisceau visible est sorti du cadre par
       le haut. On avait des lasers plus longs et INVISIBLES.
       La cote qui compte est en unités de monde, pas en pourcentage
       d'une longueur qu'on se réserve de changer.
       ──────────────────────────────────────────────────────────── */
    var mont = Math.min(0.30, 120 * z / lg);      // 120 unités, quelle que soit la portée
    var g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, "rgba(" + col + ",0)");
    g.addColorStop(mont, "rgba(" + col + "," + (op * 1.35) + ")");
    g.addColorStop(Math.min(0.9, mont * 3.5), "rgba(" + col + "," + op + ")");
    g.addColorStop(1, "rgba(" + col + ",0)");
    c.strokeStyle = g;
    /* deux passes : un halo doux, puis un cœur net. C'est ce qui
       distingue un faisceau dans la brume d'un trait de crayon — mais
       le halo reste MINCE : large, il fait de la purée grise. */
    c.lineWidth = (1.9 + f * 1.7) * F * z;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.lineWidth = (0.7 + f * 0.6) * z;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    /* la lampe elle-même, très nette : c'est elle qui plante le
       faisceau sur le bord du plateau au lieu de le laisser flotter */
    c.fillStyle = "rgba(" + col + "," + (0.45 + f * 0.5) + ")";
    c.beginPath(); c.arc(x0, y0, (0.9 + f * 0.9) * z, 0, 6.2832); c.fill();
  }

  /* ────────────────────────────────────────────────────────────
     2. LES BALAYEURS DU PORTIQUE

     L'ORIGINE EST CELLE DU PORTIQUE, pas une hauteur devinée. Elle
     était écrite « p.y - 47 * z » quand les mâts en faisaient 122 :
     les faisceaux naissaient à mi-hauteur, dans le vide au-dessus de
     la tête du DJ. Ils partent des deux poutres, chacun de son
     point, et le portique les tient vraiment.
     ──────────────────────────────────────────────────────────── */
  for(i = 0; i < 6; i++){
    /* réparti sur les deux poutres : ouest → nord, puis nord → est */
    var u = i / 5 * 2;                           // 0..2, la poutre est la partie entière
    var ax, ay, bx, by;
    if(u <= 1){ ax = -LX * ir; ay = -IBI_H;             bx = 0;        by = -IBI_H - LY * ir; }
    else      { ax = 0;        ay = -IBI_H - LY * ir;   bx = LX * ir;  by = -IBI_H;           u -= 1; }
    var px0 = ax + (bx - ax) * u;
    var py0 = ay + (by - ay) * u - IBI_MH;
    var sx0 = p.x + px0 * z, sy0 = p.y + py0 * z;
    /* le balayage : chaque faisceau a sa vitesse, mais ils repassent
       par le même point de temps en temps — c'est ce croisement qu'on
       attend en regardant des lasers */
    var a = Math.sin(tps * (0.34 + i * 0.055) + i * 1.9) * (0.52 + f * 0.22);
    var lgb = (300 + f * 90) * (0.6 + F * 0.5) * z;
    var sx1 = sx0 + Math.sin(a) * lgb;
    var sy1 = sy0 - Math.cos(a) * lgb;
    var gb = c.createLinearGradient(sx0, sy0, sx1, sy1);
    var opb = (0.16 + f * 0.24) * F;
    gb.addColorStop(0, "rgba(" + IBI_LASER_T[i] + "," + opb + ")");
    gb.addColorStop(0.5, "rgba(" + IBI_LASER_T[i] + "," + (opb * 0.55) + ")");
    gb.addColorStop(1, "rgba(" + IBI_LASER_T[i] + ",0)");
    c.strokeStyle = gb;
    c.lineWidth = (1.1 + f * 1.3) * z;
    c.beginPath(); c.moveTo(sx0, sy0); c.lineTo(sx1, sy1); c.stroke();
    c.fillStyle = "rgba(" + IBI_LASER_T[i] + "," + (0.5 + f * 0.4) + ")";
    c.beginPath(); c.arc(sx0, sy0, (0.9 + f * 0.7) * z, 0, 6.2832); c.fill();
  }

  /* ────────────────────────────────────────────────────────────
     3. LA COLONNE DE LUMIÈRE au-dessus de la scène

     Une nappe verticale qui monte du plateau et se perd. Elle ne
     fait rien d'autre que donner de l'AIR à la couronne : sans elle,
     seize traits partent d'un disque et le ciel entre eux reste
     noir, ce qui se lit comme seize traits et non comme une scène
     éclairée.

     ELLE DÉMARRE AU-DESSUS DE LA TÊTE DU DJ, et pas au plateau. Posée
     sur le plateau, elle noyait la régie sous un voile gris : toute
     la scène perdait son contraste, et c'est le premier défaut qu'on
     voyait sur les photos. Une nappe de brume commence là où l'on
     cesse de regarder les détails.
     ──────────────────────────────────────────────────────────── */
  var y0c = p.y - (IBI_H + 108) * z;
  var hc = 300 * (0.5 + F * 0.6) * z;
  var gcol = c.createLinearGradient(p.x, y0c, p.x, y0c - hc);
  var ccol = IBI_TEINTES[mes % 4];
  gcol.addColorStop(0, "rgba(" + ccol + ",0)");
  gcol.addColorStop(0.22, "rgba(" + ccol + "," + ((0.05 + f * 0.07) * F) + ")");
  gcol.addColorStop(1, "rgba(" + ccol + ",0)");
  c.fillStyle = gcol;
  c.beginPath();
  c.moveTo(p.x - LX * 0.9 * z, y0c);
  c.lineTo(p.x + LX * 0.9 * z, y0c);
  c.lineTo(p.x + LX * 1.8 * z, y0c - hc);
  c.lineTo(p.x - LX * 1.8 * z, y0c - hc);
  c.closePath(); c.fill();

  /* ================================================================
     3 bis. LES DOUZE TOURS, ET C'ÉTAIT LE BON ANCRAGE

     « Les lasers, on peut peut-être en remettre à certains endroits
     sur la map de manière harmonieuse. »

     On ne va pas en semer au hasard : une carte a déjà ses points
     forts, et en inventer d'autres fait du bruit. Ceux-ci existent —
     ce sont les DOUZE TOURS ÉLECTRIQUES, une au bout de chaque
     secteur, posées sur les bissectrices des couloirs. Elles sont
     déjà réparties tous les trente degrés autour du Brasier : la
     seule disposition parfaitement régulière de l'île, et personne
     n'a eu à la dessiner.

     Un faisceau sur chacune, et l'on obtient une seconde couronne,
     douze fois plus large que celle de la scène et concentrique avec
     elle. De l'île entière, les deux se répondent.

     ILS S'INCLINENT VERS LE CENTRE, et c'est ce qui fait le dessin :
     douze verticales seraient une palissade ; douze faisceaux qui
     convergent vers la scène font une TENTE de lumière au-dessus de
     la fête. L'inclinaison se lit sur la position de la tour — chacune
     penche vers le milieu, donc chacune penche autrement.

     ET UNE TOUR MORTE S'ÉTEINT. C'est gratuit — on lit `bat.vivant`,
     qui est déjà là — et ça dit quelque chose de vrai : à mesure qu'on
     démonte les cellules du Brasier, le show s'éteint secteur par
     secteur. La carte raconte la bataille.
     ================================================================ */
  if(jeu && jeu.reacteurs && z > 0.16){
    for(i = 0; i < jeu.reacteurs.length; i++){
      var R = jeu.reacteurs[i];
      if(!R.bat || !R.bat.vivant) continue;
      var pr = versEcran(cam, R.gx, R.gy);
      /* la lampe est en HAUT du mât, pas à ses pieds : soixante-deux
         unités, la hauteur d'une tour telle qu'elle est dessinée */
      var rx0 = pr.x, ry0 = pr.y - 62 * z;
      /* l'inclinaison vers la scène, lue sur la position à l'écran :
         une tour à l'ouest penche vers l'est, et réciproquement */
      var vers = (p.x - pr.x) / (Math.abs(p.x - pr.x) + 260);
      var inc = vers * 0.38 + Math.sin(tps * 0.6 + i * 0.9) * 0.10 * F;
      var lgt = (900 * (0.55 + F * 0.45) + f * 180 * F) * z;
      var ct = IBI_LASER_T[(i * 2 + mes) % 6];
      var opt = (0.07 + f * 0.15) * F;
      var gt = c.createLinearGradient(rx0, ry0, rx0 + Math.sin(inc) * lgt,
                                      ry0 - Math.cos(inc) * lgt);
      gt.addColorStop(0, "rgba(" + ct + ",0)");
      gt.addColorStop(0.09, "rgba(" + ct + "," + (opt * 1.3) + ")");
      gt.addColorStop(0.45, "rgba(" + ct + "," + opt + ")");
      gt.addColorStop(1, "rgba(" + ct + ",0)");
      c.strokeStyle = gt;
      c.lineWidth = (1.6 + f * 1.5) * F * z;
      c.beginPath();
      c.moveTo(rx0, ry0);
      c.lineTo(rx0 + Math.sin(inc) * lgt, ry0 - Math.cos(inc) * lgt);
      c.stroke();
      c.lineWidth = (0.6 + f * 0.5) * z;
      c.beginPath();
      c.moveTo(rx0, ry0);
      c.lineTo(rx0 + Math.sin(inc) * lgt, ry0 - Math.cos(inc) * lgt);
      c.stroke();
      /* la lampe au sommet du mât : c'est elle qui ancre le faisceau */
      c.fillStyle = "rgba(" + ct + "," + (0.40 + f * 0.5) + ")";
      c.beginPath(); c.arc(rx0, ry0, (0.8 + f * 0.8) * z, 0, 6.2832); c.fill();
    }
  }

  /* ================================================================
     3 ter. LES DEUX GROS PROJECTEURS DE CIEL

     « On ne mettrait pas sur la carte, à deux endroits symétriques,
     les gros lasers qui tournent dans le ciel verticalement en légère
     rotation ? Assez éloignés de la scène pour ne pas surcharger. »

     Ce sont les tours de ciel des grands festivals : un fût de lumière
     large, presque vertical, qui décrit lentement un cône. Deux, pas
     douze — ils tiennent leur effet de leur RARETÉ et de leur taille,
     et douze auraient refait la couronne qu'on a déjà.

     LA SYMÉTRIE EST CELLE DE L'ÉCRAN, pas celle de la grille. En
     isométrie, iso(gx,gy) met (gx−gy) en abscisse et (gx+gy) en
     ordonnée : deux points à ±d sur gx et ∓d sur gy ont donc la MÊME
     ordonnée et des abscisses opposées. Ils encadrent la scène
     exactement, à la même profondeur — ce qu'un décalage naïf de ±d
     sur gx seul n'aurait pas donné, il les aurait mis en diagonale.

     ILS SONT LOIN : quarante-deux cases du centre, contre trente pour
     le rayon de l'étoile. Ils se dressent donc dans les secteurs de
     défense, bien au-delà de la piste, et leurs faisceaux entrent dans
     le cadre par les côtés au lieu de passer sur la fête.

     LA ROTATION SE FAIT EN DEUX TEMPS, et c'est ce qui la rend
     crédible sur une image plate : l'inclinaison balance de gauche à
     droite, ET la largeur du fût respire sur le quart de tour d'écart.
     Un cône vu de face est large, vu de profil il est mince ; en liant
     les deux par un quart de période, on voit un fût qui TOURNE et non
     un fût qui se dandine. Les deux stations sont en opposition de
     phase : quand l'un s'ouvre, l'autre se referme, et ils se croisent
     au-dessus de la scène deux fois par tour.
     ================================================================ */
  var IBI_TOUR_D = 30;                     // l'écart, en cases, sur chaque axe
  for(i = 0; i < 2; i++){
    var sg = i ? 1 : -1;
    var st = versEcran(cam, SCENE_GX + sg * IBI_TOUR_D, SCENE_GY - sg * IBI_TOUR_D);
    var ph = tps * 0.20 + i * 3.1416;      // en opposition de phase
    var ang = Math.sin(ph) * 0.42;
    /* le quart de tour d'écart : le cône est large de face, mince de
       profil, et c'est ce déphasage qui fait qu'il TOURNE */
    var ouvre = 0.40 + 0.60 * Math.abs(Math.cos(ph));
    var hb = 34 * z;                        // la lanterne, au-dessus de son socle
    var bx2 = st.x, by2 = st.y - hb;
    var lgT = 1700 * (0.6 + F * 0.4) * z;
    var tx = bx2 + Math.sin(ang) * lgT, ty = by2 - Math.cos(ang) * lgT;
    /* le fût : un trapèze qui s'ouvre vers le ciel, et non un trait —
       un projecteur de ciel se voit à son ÉVASEMENT */
    var w0 = (7 + f * 3) * ouvre * z;
    var w1 = (34 + f * 14) * ouvre * z;
    var nx = Math.cos(ang), ny = Math.sin(ang);   // la normale au faisceau
    var gT = c.createLinearGradient(bx2, by2, tx, ty);
    var opT = (0.13 + f * 0.13) * F * ouvre;
    gT.addColorStop(0, "rgba(235,246,255," + (opT * 1.6) + ")");
    gT.addColorStop(0.35, "rgba(210,238,255," + (opT * 0.7) + ")");
    gT.addColorStop(1, "rgba(190,225,255,0)");
    c.fillStyle = gT;
    c.beginPath();
    c.moveTo(bx2 - nx * w0, by2 - ny * w0);
    c.lineTo(bx2 + nx * w0, by2 + ny * w0);
    c.lineTo(tx + nx * w1, ty + ny * w1);
    c.lineTo(tx - nx * w1, ty - ny * w1);
    c.closePath(); c.fill();
    /* le cœur du fût, plus net */
    c.strokeStyle = "rgba(255,255,255," + (opT * 1.4) + ")";
    c.lineWidth = (2.2 + f * 1.6) * ouvre * z;
    c.beginPath(); c.moveTo(bx2, by2); c.lineTo(tx, ty); c.stroke();
    /* la lanterne, et son halo au sol */
    var gl = c.createRadialGradient(bx2, by2, 0, bx2, by2, 26 * z);
    gl.addColorStop(0, "rgba(255,255,255," + (0.55 + f * 0.35) + ")");
    gl.addColorStop(1, "rgba(210,235,255,0)");
    c.fillStyle = gl;
    c.beginPath(); c.arc(bx2, by2, 26 * z, 0, 6.2832); c.fill();
  }

  /* ────────────────────────────────────────────────────────────
     4. LES CANONS À FUMÉE, une fois par mesure sur les drops

     Deux buses plantées sur le bord SUD du plateau, de part et
     d'autre du DJ, qui crachent une colonne blanche au premier temps
     de chaque mesure. C'est le geste le plus reconnaissable d'une
     grande scène, et il ne coûte que deux dégradés.

     UNE FOIS PAR MESURE, ET PAS UNE FOIS PAR TEMPS : un canon qui
     tire quatre fois par mesure n'est plus un événement, c'est un
     robinet. La phase se lit sur `t/4` — le compte des NOIRES divisé
     par quatre, donc la mesure — et le jet dure un cinquième de
     mesure, le temps de monter et de se dissoudre.
     ──────────────────────────────────────────────────────────── */
  if(HH.strobo && HH.mus){
    var pm = HH.t / 4;
    var phm = pm - Math.floor(pm);
    var jet = phm < 0.20 ? 1 - phm / 0.20 : 0;
    if(jet > 0.02){
      for(i = 0; i < 2; i++){
        var ab = i ? 2.199 : 0.942;                  // ±54° sous l'horizontale, au sud
        var jx = p.x + Math.cos(ab) * LX * 0.96 * z;
        var jy = p.y + (-IBI_H + Math.sin(ab) * LY * 0.96) * z;
        var mont = (1 - jet) * 1.0;                  // la colonne a déjà monté
        var haut = (60 + 210 * mont) * z;
        var larg = (5 + 26 * mont) * z;
        var gj2 = c.createLinearGradient(jx, jy, jx, jy - haut);
        /* en composite additif : blanc à pleine opacité, une colonne
           de CO₂ crève l'image. Un tiers suffit — c'est de la vapeur
           éclairée, pas un phare. */
        gj2.addColorStop(0, "rgba(255,255,255," + (jet * 0.34) + ")");
        gj2.addColorStop(0.45, "rgba(232,244,255," + (jet * 0.19) + ")");
        gj2.addColorStop(1, "rgba(220,238,255,0)");
        c.fillStyle = gj2;
        c.beginPath();
        c.moveTo(jx - larg * 0.22, jy);
        c.lineTo(jx + larg * 0.22, jy);
        c.lineTo(jx + larg, jy - haut);
        c.lineTo(jx - larg, jy - haut);
        c.closePath(); c.fill();
      }
    }
  }

  c.restore();

  /* ────────────────────────────────────────────────────────────
     5. LE STROBOSCOPE — sur les drops, et nulle part ailleurs

     Un éclair blanc sur la frappe, très court et très discret : six
     centièmes d'opacité suffisent à faire sursauter toute l'image,
     et au-delà on n'y voit plus rien. Il est HORS du composite
     « lighter » : c'est un voile sur toute la scène, pas une lampe.

     Il ne part que si la musique joue vraiment — un stroboscope sur
     une carte muette serait un défaut d'affichage, pas un effet.
     ──────────────────────────────────────────────────────────── */
  if(HH.strobo && HH.mus){
    var ecl = Math.max(0, 1 - (HH.t - Math.floor(HH.t)) * 14);
    if(ecl > 0.02){
      c.save();
      c.fillStyle = "rgba(240,248,255," + (ecl * 0.05) + ")";
      c.fillRect(0, 0, W, H);
      c.restore();
    }
  }
}

/* ================================================================
   LES DOUZE BANDES, ET C'EST ELLES QU'ON REGARDE

   « Ce sont les 12 bandes à illuminer, dans un jeu de lumière calé
   sur le rythme de la musique. » — avec le dessin qui va avec, douze
   traits rouges, bleus et jaunes posés sur les couloirs.

   Les douze couloirs sont la FIGURE de cette île : c'est le vide
   qu'ils creusent dans les défenses qui dessine l'étoile, et c'est
   par eux que l'œil arrive à la scène. Ils étaient peints dans le sol
   cuit, en couleurs fixes — magnifiques et immobiles. Ils bougent
   maintenant, et de deux façons qui ne se répètent pas ensemble :

     LA CRÊTE COURT VERS LE LARGE, un aller par MESURE. La lumière
     part du pied de la scène et file jusqu'au rivage : le DJ envoie
     la lumière dans les douze allées. C'est le mouvement qui se lit
     de l'île entière, celui qu'on voit avant de comprendre pourquoi.

     LA COULEUR TOURNE AUTOUR DE L'ÉTOILE, un cran par temps. Six
     teintes pour douze couloirs, comme dans le sol : deux couloirs
     opposés partagent la leur, et l'œil y lit une symétrie au lieu
     d'un arc-en-ciel. Ce sont les MÊMES six que les lasers — la
     bande au sol et le faisceau qui la surmonte passent au rose
     ensemble, et c'est ce qui fait croire à une seule régie.

   LA GÉOMÉTRIE EST CELLE DU SOL, prise aux mêmes fonctions : même
   angle, même `largeurPeinte`, même départ à FAISC_R0. Deux tracés
   calculés séparément se seraient désalignés à la première retouche
   d'un rayon — et un halo décalé d'une case sur son couloir se voit
   tout de suite.

   NEUF ARRÊTS PAR DÉGRADÉ, ÉVALUÉS, ET NON TROIS ARRÊTS DÉPLACÉS.
   Poser un arrêt « à la position de la crête » oblige à trier des
   bornes qui se croisent quand la crête approche de 0 ou de 1, et
   c'est le genre de code qui rend un dégradé invalide une image sur
   cent. Ici les neuf positions sont fixes et c'est l'ONDE qu'on y
   évalue : toujours croissantes, toujours valides.
   ================================================================ */
function dessineBandesIbiza(c, tps){
  var H = horlogeIbiza(tps);
  var f = frappe(tps), F = H.force, mes = mesureIbiza(tps);
  /* la phase dans la MESURE : un aller-retour de lumière par mesure */
  var vague = (H.t / 4) - Math.floor(H.t / 4);
  var i, k;
  c.save();
  c.globalCompositeOperation = "lighter";
  for(i = 0; i < FAISC_N; i++){
    var a = i / FAISC_N * 6.2832 - 0.5236;
    var ca = Math.cos(a), sa = Math.sin(a);
    var r0 = FAISC_R0 - 1, r1 = FAISC_R1;
    var w0 = largeurPeinte(r0) + 1.1, w1 = largeurPeinte(r1) + 1.1;
    /* la perpendiculaire au rayon, dans la grille */
    var A0 = iso(SCENE_GX + ca * r0 - sa * w0, SCENE_GY + sa * r0 + ca * w0);
    var B0 = iso(SCENE_GX + ca * r0 + sa * w0, SCENE_GY + sa * r0 - ca * w0);
    var A1 = iso(SCENE_GX + ca * r1 - sa * w1, SCENE_GY + sa * r1 + ca * w1);
    var B1 = iso(SCENE_GX + ca * r1 + sa * w1, SCENE_GY + sa * r1 - ca * w1);
    var D0 = iso(SCENE_GX + ca * r0, SCENE_GY + sa * r0);
    var D1 = iso(SCENE_GX + ca * r1, SCENE_GY + sa * r1);
    var col = IBI_LASER_T[(i + mes) % 6];
    var g = c.createLinearGradient(D0.x, D0.y, D1.x, D1.y);
    for(k = 0; k <= 8; k++){
      var u = k / 8;
      /* la distance DERRIÈRE la crête, en tournant : la traîne suit la
         lumière au lieu de la précéder */
      var d = u - vague; if(d < 0) d += 1;
      var onde = Math.exp(-d * 5.5);
      /* et l'on s'éteint vers le rivage, comme le faisceau du sol :
         un projecteur perd sa force avec la distance */
      var al = (0.045 + onde * 0.26 + f * 0.05) * (1 - u * 0.55) * F;
      g.addColorStop(u, "rgba(" + col + "," + al.toFixed(3) + ")");
    }
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(A0.x, A0.y); c.lineTo(A1.x, A1.y);
    c.lineTo(B1.x, B1.y); c.lineTo(B0.x, B0.y);
    c.closePath(); c.fill();
  }
  c.restore();
}

/* ================================================================
   LE CONTOUR DE L'ÉTOILE, VIVANT

   « Le contour de l'étoile peut aussi être lumineux et aller au
   rythme de la musique, en différentes couleurs. »

   La forme est cuite dans le sol, en sourdine (voir 30-terrain.js) ;
   ici on ne peint que la LUMIÈRE, et elle bouge de trois façons à la
   fois, ce qui suffit à ne jamais se répéter à l'œil :

     LA COULEUR change à chaque temps — les quatre teintes de la
     scène, dans l'ordre, les mêmes que les projecteurs. La piste et
     le portique passent donc au rose au même moment : c'est ce qui
     fait qu'on croit à UNE régie plutôt qu'à deux décors.

     L'ÉPAISSEUR pompe sur la frappe, comme le liseré du podium.

     ET UNE ONDE FAIT LE TOUR. C'est le détail qui coûte le moins et
     qui se voit le plus : on ne trace pas le contour d'un seul trait,
     mais segment par segment, chacun avec sa propre avance sur le
     battement. Une crête de lumière court alors le long de l'étoile,
     un tour par mesure. Un néon qui clignote entier est un néon ; un
     néon qui court est une piste de danse.

   OÙ ELLE EST PEINTE : dans le repère du MONDE, juste après le sol et
   avant tout le reste. Donc sous les danseurs, sous les défenses,
   sous la scène — c'est de la lumière AU SOL, et un danseur doit
   pouvoir se tenir dessus.
   ================================================================ */
var IBI_ONDE = 12;           // combien de segments par côté de l'étoile
function dessineEtoileIbiza(c, tps){
  var H = horlogeIbiza(tps);
  var f = frappe(tps), F = H.force, mes = mesureIbiza(tps);
  var n = ETOILE_G.length / 2, i, k;
  /* la phase dans la MESURE, pas dans le temps : l'onde fait un tour
     complet toutes les quatre noires */
  var tour = (H.t / 4) - Math.floor(H.t / 4);
  c.save();
  c.globalCompositeOperation = "lighter";
  c.lineCap = "round";
  for(i = 0; i < n; i++){
    var a = iso(ETOILE_G[i * 2], ETOILE_G[i * 2 + 1]);
    var b = iso(ETOILE_G[((i + 1) % n) * 2], ETOILE_G[((i + 1) % n) * 2 + 1]);
    for(k = 0; k < IBI_ONDE; k++){
      var u0 = k / IBI_ONDE, u1 = (k + 1) / IBI_ONDE;
      /* où en est ce morceau par rapport à la crête qui tourne */
      var pos = (i + u0) / n;
      var d = pos - tour; d -= Math.floor(d);        // 0 = la crête est ici
      var onde = Math.exp(-d * 7) + Math.exp(-(1 - d) * 7) * 0.35;
      var col = IBI_TEINTES[(mes + i) % 4];
      var vif = (0.20 + f * 0.30 + onde * 0.55) * F;
      c.strokeStyle = "rgba(" + col + "," + Math.min(0.95, vif * 0.5) + ")";
      c.lineWidth = (5 + onde * 9 + f * 4) * F;
      c.beginPath();
      c.moveTo(a.x + (b.x - a.x) * u0, a.y + (b.y - a.y) * u0);
      c.lineTo(a.x + (b.x - a.x) * u1, a.y + (b.y - a.y) * u1);
      c.stroke();
      /* LE CŒUR BLANC, MINCE, ET SEULEMENT SOUS LA CRÊTE. C'est lui qui
         donne l'arête nette — mais un second tracé sur chacun des cent
         quarante-quatre morceaux du contour, à chaque image, se paie en
         millisecondes sur une tablette. Or hors de la crête il est
         presque transparent : on ne dessinait rien, cher. Le seuil
         retire les trois quarts des tracés et ne retire aucun pixel
         qu'on voyait. */
      if(onde > 0.22){
        c.strokeStyle = "rgba(255,255,255," + Math.min(0.9, vif * 0.45) + ")";
        c.lineWidth = 1.1 + onde * 1.8;
        c.stroke();
      }
    }
  }
  c.restore();
}

/* Tout ce qui danse, dans le tri de profondeur. */
function danseursVisibles(vue, sortie){
  if(!jeu.danseurs) return;
  for(var i = 0; i < jeu.danseurs.length; i++){
    var d = jeu.danseurs[i];
    if(!visible(vue, d.gx, d.gy)) continue;
    sortie.push({ d:d.gx + d.gy, k:14, o:d });
  }
}
