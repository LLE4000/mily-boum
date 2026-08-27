/* ================================================================
   LA FAUNE DE « MILY DANS LA JUNGLE » — six espèces
   ================================================================
   Le cahier des charges de cette carte tient en une phrase : elle doit
   être BEAUCOUP plus vivante que les autres. Pas plus dangereuse — plus
   habitée. Un singe qui se gratte l'oreille au pied d'un arbre, un
   panda assis qui mâche sa canne de bambou, un koala qui dort accroché
   à rien du tout, et trois insectes qui traversent le champ : voilà ce
   qui doit rester au joueur quand il repense à la jungle.

   D'où quatre partis pris, tous hérités des trois chats de Mily
   (72-chats.js) et vérifiés au même endroit — dans le VRAI jeu, entre
   z = 0,5 et z = 1,7, pas sur une planche isolée.

   1. TÊTE DE TROIS QUARTS SUR CORPS DE PROFIL, donc DEUX YEUX. C'est
      la seule chose qui sépare une bestiole attachante d'une bestiole
      seulement jolie : deux points sombres sur une face claire, l'œil
      humain les lit comme un visage avant même de reconnaître l'animal.
      Les six espèces l'appliquent, jusqu'au bourdon.
   2. UNE SILHOUETTE PAR ESPÈCE, lisible en ombre chinoise. La queue en
      crosse du singe monte plus haut que sa tête ; le panda est deux
      taches noires sur une masse blanche ; le koala est deux oreilles
      énormes et un nez en cuiller. Sur la terre presque noire de la
      jungle (#2e4428), c'est le CONTRASTE qui porte, pas la teinte.
   3. LES TROIS MAMMIFÈRES SONT CLAIRS ET CHAUDS. La jungle est verte et
      sombre ; un animal vert-brun s'y dissout. Le singe est doré, le
      panda est blanc, le koala est gris pâle — trois valeurs hautes sur
      un fond bas.
   4. AUCUN DÉTAIL QUI NE SURVIVE PAS À LA RÉDUCTION. À z = 0,6 un
      panda de 30 unités en fait 18 à l'écran : les taches oculaires
      sont grandes, le nez est gros, les oreilles débordent du crâne.

   Repère local, comme tout le bestiaire : le point de contact au sol en
   (0,0), les y NÉGATIFS vers le haut, et la bête regarde à DROITE —
   c'est dessineCreature() qui applique scale(-1,1) pour l'autre sens,
   donc jamais de miroir en dur ici. Les trois insectes volent : ils
   dessinent leur ombre au sol en (0,0) et se placent eux-mêmes en l'air.

   Aucun Math.random : toute la variation sort de tps, k.ph et k.n. Deux
   pandas côte à côte ne doivent pas mâcher en chœur, mais un panda doit
   se dessiner pareil deux fois de suite au même instant.

   ---- CE QUE L'APPELANT PEUT POSER SUR UNE CRÉATURE ----
   k.etat === "fuite"  déjà en place — change la POSTURE, pas seulement
                       la vitesse : le singe détale à plat ventre, le
                       panda galope langue dehors, le koala se dresse
                       et cherche une branche au-dessus de lui.
   k.assis             pandas seulement : pose assise qui mange. Le
                       cahier des charges en veut beaucoup, tranquilles,
                       dans les zones végétales protégées.
   k.sursaut           POINT D'ENTRÉE AJOUTÉ ICI (voir fauneSursaut) :
                       l'appelant y pose jeu.tps au moment d'une
                       explosion, et la bête se recroqueville pendant
                       neuf dixièmes de seconde. Rien à décrémenter :
                       c'est une date, pas un compteur.
   ================================================================ */

/* La liste, pour que le poseur de carte n'ait pas à la réécrire. */
var FAUNE_JUNGLE = ["singe", "panda", "koala", "bourdon", "papillon", "luciole"];

/* ---------------------------------------------------------------
   PALETTES
   Sorties des fonctions de dessin, comme celles des chats : c'est le
   seul endroit où l'on vérifie d'un coup d'œil que les six espèces ne
   se ressemblent pas, et qu'aucune ne partage la valeur du sol.
   --------------------------------------------------------------- */

/* Singe. Doré franc — la seule chose chaude et saturée qui bouge au
   sol. Le premier essai était brun-olive « réaliste » : sur la terre de
   jungle, il disparaissait aussi bien qu'un caillou. */
var PAL_SINGE = {
  dos:"#c89453", flanc:"#9d7038", ventreO:"#6b4c28", cape:"#4a3520",
  face:"#f4d7ae", faceO:"#cfa87c", museau:"#fbecd2",
  main:"#3b2a1a", nez:"#7a4c39", chair:"#cd8d74", dents:"#f6f0e2"
};

/* Panda. Le blanc n'est pas blanc : tiré vers le crème, sinon il fait
   un trou dans l'image. Et le noir n'est pas noir : #231f28 garde un
   peu de violet pour que les taches oculaires ne se collent pas au
   fond quand la nuit d'orage tombe sur la carte. */
var PAL_PANDA = {
  blanc:"#f4f0e6", blancC:"#fffdf7", blancO:"#cdc7b8",
  noir:"#231f28", noirC:"#3d3846", noirO:"#141219",
  nez:"#191620", langue:"#d47a78",
  cane:"#79b545", caneO:"#3f7527", feuille:"#98dc72", feuilleO:"#4c8b2c"
};

/* Koala. Gris bleuté : la seule espèce froide du lot, et c'est voulu —
   posé contre un tronc, il ne doit pas être pris pour un singe. Le
   poitrail crème et les touffes d'oreille presque blanches sont ce qui
   le sauve à petite taille. */
var PAL_KOALA = {
  dos:"#9ba4b0", flanc:"#7c8592", ombre:"#59616d",
  ventre:"#ecf0f3", ventreO:"#c3cad2",
  touffe:"#f6f6f4", touffeO:"#c3c8cf",
  nez:"#2b262e", nezC:"#544c58", griffe:"#2e2930", face:"#c8ced6"
};

/* Bourdon. Le jaune est mis très haut et le noir très bas : à 9 unités
   il ne reste que le rythme des bandes, et c'est ce rythme-là qui dit
   « bourdon » et pas « mouche ». */
var PAL_BOURDON = {
  poil:"#f6c92e", poilO:"#c1930f", noir:"#221c1e", noirC:"#3d3437",
  bout:"#f8f1e4", aile:"#e8f1fb", oeil:"#151113", patte:"#241d1f"
};

/* Papillon : trois livrées, choisies sur k.n. Une seule espèce aurait
   fait un semis de photocopies ; trois suffisent à donner l'illusion
   d'un papillon par buisson. Le morpho bleu est là pour les zones
   d'ombre, le tigré orange pour les clairières. */
var PAL_PAPILLON = [
  { haut:"#5aa8f0", bas:"#2f6fd0", bord:"#1b2440", tache:"#eaf4ff", corps:"#251f2c" },
  { haut:"#f4a72e", bas:"#cf7212", bord:"#2c1d13", tache:"#ffeec2", corps:"#2a201a" },
  { haut:"#f7ead6", bas:"#dcbaa9", bord:"#6d4a44", tache:"#d8607a", corps:"#2e2428" }
];

/* Luciole : le corps est un détail, la LUEUR est l'animal. */
var PAL_LUCIOLE = {
  corps:"#3a2f26", corselet:"#d98a3a", elytre:"#4d3f31",
  feu:"#c8ff6e", coeur:"#f2ffd0"
};

/* ---------------------------------------------------------------
   OUTILS COMMUNS
   --------------------------------------------------------------- */

/* Clignement : rare et sec. Un animal dont les yeux se ferment souvent
   a l'air endormi, pas vivant — sauf le koala, qui a justement le droit
   d'avoir l'air endormi, et à qui on passe une période très courte.
   Renvoie l'ouverture, 0 fermé à 1 ouvert. */
function fauneClin(tps, ph, periode){
  var p = (tps + ph * 2.31) % periode;
  if(p > 0.19) return 1;
  return Math.abs(Math.cos(p / 0.19 * 3.1416));
}

/* Fenêtre d'action : zéro la plupart du temps, une bosse de sinus
   pendant « duree » toutes les « periode » secondes. C'est ce qui
   déclenche le grattage du singe, la mâchée du panda, le bâillement du
   koala — un geste isolé sur une bête par ailleurs immobile fait plus
   pour la croire vivante qu'une agitation permanente. */
function fauneFenetre(tps, ph, periode, duree){
  var p = (tps + ph * 3.71) % periode;
  if(p < 0 || p > duree) return 0;
  return Math.sin(p / duree * 3.1416);
}

/* ---- SURSAUT ----------------------------------------------------
   « Les animaux réagissent aux explosions. » L'appelant pose
   k.sursaut = jeu.tps quand quelque chose saute à côté ; on lit ici
   l'âge de cette date. Aucune décrémentation à faire ailleurs, donc
   aucun risque d'oublier de la faire : une créature hors écran ne
   coûte rien et se réveille quand même dans le bon état.
   Renvoie 0..1 : 1 juste après le coup, puis une retombée en carré
   avec un frisson dessus. */
function fauneSursaut(k, tps){
  if(!k.sursaut) return 0;
  var a = tps - k.sursaut;
  if(a < 0 || a > 0.9) return 0;
  var s = 1 - a / 0.9;
  return s * s * (0.86 + 0.14 * Math.cos(a * 34));
}
/* Le déclencheur, à appeler depuis le code d'explosion. Il est ici et
   pas dans 80-jeu.js parce que c'est le dessin qui définit ce que veut
   dire « sursauter » — le jeu n'a qu'à dire où ça a pété. */
function effraieFaune(gx, gy, rayon, tps){
  if(typeof jeu === "undefined" || !jeu || !jeu.creatures) return;
  var r2 = rayon * rayon;
  for(var i = 0; i < jeu.creatures.length; i++){
    var k = jeu.creatures[i];
    if(k.pv <= 0) continue;
    var dx = k.gx - gx, dy = k.gy - gy;
    if(dx * dx + dy * dy <= r2) k.sursaut = tps;
  }
}

/* L'ŒIL. Volontairement plus simple que celui des chats : un chat a un
   iris coloré qui remplit l'œil, un singe ou un panda a une bille
   sombre. On ne garde donc que la bille, le blanc autour (facultatif —
   le panda n'en a pas, sa tache noire fait le travail) et DEUX reflets,
   un gros et un petit. Les deux reflets ne sont pas de la coquetterie :
   c'est ce qui empêche l'œil de se lire comme un trou.
   ouv : ouverture 0..1. reg : décalage du regard, -1..1. */
function oeilFaune(c, x, y, r, ouv, blanc, reg){
  if(ouv < 0.42){
    /* fermé : un arc vers le bas, celui de la bête contente. Passer par
       zéro d'ouverture écrasait l'œil en lentille couchée et donnait
       l'air de loucher — un clin dure trois images, il doit claquer. */
    c.strokeStyle = "rgba(26,19,22,.85)";
    c.lineWidth = Math.max(0.45, r * 0.44); c.lineCap = "round";
    c.beginPath();
    c.moveTo(x - r * 1.05, y - r * 0.12);
    c.quadraticCurveTo(x, y + r * 0.78, x + r * 1.05, y - r * 0.12);
    c.stroke();
    return;
  }
  c.save();
  c.translate(x, y);
  c.scale(1, 0.56 + 0.76 * (ouv - 0.42));
  if(blanc){
    c.fillStyle = blanc;
    c.beginPath(); c.ellipse(0, 0, r * 1.42, r * 1.30, 0, 0, 6.2832); c.fill();
  }
  c.fillStyle = "#17131a";
  c.beginPath(); c.arc(reg * r * 0.22, 0, r, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,255,255,.94)";
  c.beginPath(); c.arc(-r * 0.34, -r * 0.42, r * 0.36, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,255,255,.44)";
  c.beginPath(); c.arc(r * 0.38, r * 0.36, r * 0.18, 0, 6.2832); c.fill();
  c.restore();
}

/* Un membre : le boudin effilé de 72-chats.js, plus une main ou un
   pied au bout. On ne le réécrit pas ici — un boudin qui s'effile le
   long d'une quadratique, c'est exactement ce qu'il faut pour un bras
   de singe comme pour une patte de panda, et deux copies du même code
   c'est deux fois le même défaut à corriger. (chatBoudin est une
   déclaration de fonction : elle est hissée au niveau du script
   assemblé, donc disponible ici bien que 72- vienne après 34-.) */
function membreFaune(c, x0, y0, cx, cy, x1, y1, e0, e1, coul, main, rm){
  /* Le nombre de disques se déduit de la LONGUEUR. Fixé à sept comme
     pour les pattes de chat, un bras de singe de treize unités sortait
     en chapelet de perles : les disques ne se recouvraient plus. On
     espace donc d'un peu moins d'un rayon, et on plafonne à vingt-deux
     pour qu'un membre très long ne coûte pas un tir de mitraillette. */
  var l = Math.hypot(x1 - x0, y1 - y0) + Math.hypot(cx - x0, cy - y0) * 0.35;
  var n = Math.round(l / Math.max(0.35, Math.min(e0, e1) * 1.1));
  chatBoudin(c, [[x0, y0, cx, cy, x1, y1]],
             { n:Math.max(5, Math.min(22, n)), e0:e0, e1:e1, coul:coul });
  if(main){
    c.fillStyle = main;
    c.beginPath(); c.ellipse(x1, y1 + 0.15, rm, rm * 0.74, 0, 0, 6.2832); c.fill();
  }
}

/* Ombre de contact. Elle rétrécit quand la bête décolle : sans ça, un
   animal en plein bond a l'air collé au sol. */
function ombreFaune(c, x, rx, ry, bond, a){
  c.fillStyle = "rgba(0,0,0," + a + ")";
  c.beginPath();
  c.ellipse(x, 0, rx - bond * rx * 0.18, ry - bond * ry * 0.22, 0, 0, 6.2832);
  c.fill();
}

/* ================================================================
   LE SINGE
   ================================================================
   Un macaque doré, à quatre pattes, la tête relevée et tournée vers
   nous. Il vit au sol et près des troncs, il se gratte, il regarde
   autour de lui, et il DÉTALE dès qu'un combat approche — c'est lui qui
   prévient le joueur qu'il y a du monde qui arrive.

   Sa signature de silhouette est la QUEUE : elle part de la croupe,
   monte plus haut que le crâne et s'enroule vers l'avant. C'est le
   point le plus élevé de la bête, et le seul contour qu'on reconnaisse
   quand il ne reste que quinze pixels.
   ================================================================ */
/* Le tronc. Court et rond, pas allongé : la première version, un long
   ovale plat, donnait un chameau. Un macaque à quatre pattes tient dans
   un corps à peine plus long que deux fois sa hauteur de flanc, et sa
   tête est ÉNORME par rapport à ce corps — c'est là toute la différence
   entre un singe et un chien. */
function singeTorse(c, d){
  c.beginPath();
  c.moveTo(-6.4, -9.6);                                   /* croupe */
  c.quadraticCurveTo(-8.6, -15.2 - d, -2.6, -16.0 - d);   /* dos rond */
  c.quadraticCurveTo(3.2, -16.8 - d, 6.8, -14.2);         /* garrot */
  c.quadraticCurveTo(9.4, -12.6, 8.6, -9.6);              /* poitrail */
  c.quadraticCurveTo(7.8, -7.2, 4.6, -7.0);
  c.quadraticCurveTo(0.2, -6.4, -3.0, -7.2);              /* ventre */
  c.quadraticCurveTo(-5.4, -7.7, -6.4, -9.6);
  c.closePath();
}
function singeDos(c, d){
  c.beginPath();
  c.moveTo(-6.6, -9.4);
  c.quadraticCurveTo(-8.6, -15.2 - d, -2.6, -16.0 - d);
  c.quadraticCurveTo(3.2, -16.8 - d, 6.8, -14.2);
  c.quadraticCurveTo(8.8, -13.2, 8.8, -10.8);
}
function singeVentre(c){
  c.beginPath();
  c.moveTo(8.2, -7.2);
  c.quadraticCurveTo(0.2, -6.0, -3.0, -6.8);
  c.quadraticCurveTo(-5.2, -7.3, -6.2, -9.0);
}
function dessineSinge(c, k, tps){
  var P = PAL_SINGE;
  var ph = k.ph || 0, pas = k.phase || 0;
  var fuit = k.etat === "fuite";
  var sur = fauneSursaut(k, tps);
  var bond = Math.abs(Math.sin(pas));
  var saut = fuit ? bond * 3.2 : bond * 0.7;
  var d = fuit ? -1.7 : Math.sin(pas) * 0.5;
  var ec = Math.sin(pas) * (fuit ? 5.2 : 3.0);
  /* Le sursaut écrase la bête vers le sol. C'est un réflexe, pas une
     décision : il vient avant même que le singe décide de partir. */
  var tapi = sur * 2.6;
  var alerte = fuit || sur > 0.15;
  var ouv = alerte ? 1 : fauneClin(tps, ph, 3.6);
  var lacet = fuit ? -0.30 : (sur > 0.15 ? 0.24 : Math.sin(tps * 0.63 + ph * 1.7) * 0.34);
  /* Le grattage d'oreille : six secondes d'immobilité, puis neuf
     dixièmes de patte arrière qui frotte. C'est LE geste qui fait
     croire à un animal et pas à un pion qui glisse. */
  var gratte = alerte ? 0 : fauneFenetre(tps, ph, 6.3, 0.9);

  ombreFaune(c, 0.8, 9.2, 3.2, bond, 0.26);

  c.save();
  c.translate(0, -saut + tapi);
  c.rotate(fuit ? 0.06 : Math.sin(tps * 1.1 + ph) * 0.026);

  /* ---- la queue, derrière tout le reste ----
     Au repos elle s'enroule très haut : c'est le signal de silhouette.
     En fuite elle se tend droit derrière, presque à l'horizontale — un
     singe qui court ne porte pas sa queue en crosse, et cette bascule
     se lit d'un seul coup d'œil même sans voir les pattes. */
  var onde = fuit ? 0 : Math.sin(tps * 1.35 + ph) * 2.2;
  var q = fuit
    ? [[-6.4, -10.0, -13.6, -11.8, -19.4, -13.8],
       [-19.4, -13.8, -24.0, -15.4, -26.4, -17.6]]
    : [[-6.4, -10.2, -12.6 + onde * 0.3, -12.6, -13.2 + onde * 0.6, -18.4],
       [-13.2 + onde * 0.6, -18.4, -13.8 + onde * 1.0, -23.4, -8.2 + onde * 1.3, -24.2],
       [-8.2 + onde * 1.3, -24.2, -4.6 + onde * 1.5, -24.6, -5.4 + onde * 1.6, -21.2]];
  /* Vingt-six disques et pas quatorze : à quatorze, sur un tracé de
     trente-cinq unités, la queue sortait en collier de perles. */
  chatBoudin(c, q, { n:21, e0:1.7, e1:0.8, coul:P.flanc, bout:P.cape, tBout:0.84 });

  /* ---- membres du fond : plus sombres, ils reculent ---- */
  membreFaune(c, -4.6, -9.8, -6.4, -5.2, -5.4 - ec, -1.0, 1.85, 1.15, P.ventreO, P.main, 1.6);
  membreFaune(c, 4.8, -12.2, 4.0, -6.8, 4.2 - ec, -1.0, 1.7, 1.05, P.ventreO, P.main, 1.5);

  /* ---- le torse ---- */
  c.fillStyle = degCache(c, "singeTorse", function(){
    var g = c.createLinearGradient(0, -17.2, 0, -5.4);
    g.addColorStop(0, PAL_SINGE.dos);
    g.addColorStop(0.52, PAL_SINGE.flanc);
    g.addColorStop(1, PAL_SINGE.ventreO);
    return g;
  });
  singeTorse(c, d); c.fill();

  /* La cape : une nappe de poil plus sombre POSÉE SUR LES ÉPAULES, pas
     sur tout le dos. Étalée, elle faisait une selle beige au milieu du
     flanc et le singe prenait un air de poney. */
  c.save();
  singeTorse(c, d); c.clip();
  c.fillStyle = "rgba(74,53,32,.30)";
  c.beginPath(); c.ellipse(5.2, -14.8 - d, 5.2, 3.2, -0.22, 0, 6.2832); c.fill();
  /* Le ventre crème est venu et reparti : même en bande fine, posé au
     milieu du flanc, il se lisait comme un hublot pâle collé sur la
     bête. Le dégradé du tronc suffit — le ventre s'éclaircit tout seul
     là où il faut, et le liseré de volume finit le travail. */
  c.restore();

  chatVolume(c, function(cc){ singeTorse(cc, d); },
                function(cc){ singeDos(cc, d); },
                singeVentre,
                "rgba(255,244,216,.22)", "rgba(58,40,22,.30)");

  /* Cuisse et épaule : deux masses rondes greffées sur le tronc, sans
     lesquelles les membres ont l'air vissés sur un ballon. Elles sont
     remplies avec LE MÊME dégradé que le tronc — un CanvasGradient est
     résolu dans le repère courant, pas dans la forme, donc il se
     raccorde exactement. Peintes en aplat, elles ressortaient en deux
     ballons plus clairs collés sur la bête. Le modelé vient ensuite,
     d'un simple pli. */
  c.beginPath(); c.ellipse(-4.4, -10.6, 3.3, 3.4, -0.12, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(5.4, -12.4, 2.4, 2.6, 0.16, 0, 6.2832); c.fill();
  c.strokeStyle = "rgba(58,40,22,.26)"; c.lineWidth = 0.7; c.lineCap = "round";
  c.beginPath();
  c.moveTo(-2.0, -14.0); c.quadraticCurveTo(-0.8, -11.0, -2.2, -8.2);
  c.stroke();

  /* ---- membres de devant, par-dessus le torse ----
     Le bras proche va se gratter l'oreille : on interpole entre sa
     position de marche et le crâne, la main tremblant à 26 Hz. */
  var mgx = 7.8 + ec * 0.9, mgy = -1.0;
  if(gratte > 0){
    mgx = mgx + (9.4 - mgx) * gratte;
    mgy = mgy + (-18.8 + Math.sin(tps * 26) * 0.7 - mgy) * gratte;
  }
  membreFaune(c, -3.0, -9.6, -4.6, -5.0, -2.6 + ec, -1.0, 1.95, 1.2, P.flanc, P.main, 1.7);
  membreFaune(c, 6.6, -12.6, 7.8 + gratte * 2.4, -7.0 - gratte * 3.0, mgx, mgy,
              1.8, 1.1, P.dos, P.main, 1.6);

  /* le cou : sans lui, la tête flottait au-dessus du garrot */
  chatBoudin(c, [[6.6, -13.4, 8.6, -15.0, 10.2, -16.2]],
             { n:7, e0:1.9, e1:1.7, coul:P.flanc });

  /* ---- LA TÊTE. Relevée, tournée aux trois quarts, et volontairement
     trop grosse : c'est le rapport tête/corps qui fait le singe. ---- */
  c.save();
  c.translate(11.4, -18.2 + (fuit ? 2.2 : 0) + sur * 1.4);
  c.rotate((fuit ? 0.22 : Math.sin(tps * 0.63 + ph * 1.7) * 0.07) - sur * 0.16);

  /* Oreilles : de vraies assiettes plantées sur le côté du crâne. En
     fuite elles se plaquent — donc plus près du crâne ET plus petites,
     parce qu'à cette taille rabattre une oreille ne se voit que si sa
     surface change. */
  /* Les oreilles, plantées DEHORS. Première version calée à ±3,8 sur un
     crâne de 4,5 de rayon : elles étaient entièrement à l'intérieur du
     crâne, donc invisibles. Une oreille de singe doit dépasser — c'est
     la moitié de sa silhouette. */
  var pl = alerte ? 1 : 0;
  c.fillStyle = P.flanc;
  c.beginPath(); c.ellipse(-4.6 + pl * 1.4, -0.9, 2.4 - pl * 0.6, 2.8 - pl * 0.9, -0.2, 0, 6.2832); c.fill();
  c.fillStyle = P.dos;
  c.beginPath(); c.ellipse(5.2 - pl * 1.4, -0.7, 2.5 - pl * 0.6, 2.9 - pl * 0.9, 0.2, 0, 6.2832); c.fill();
  c.fillStyle = P.chair;
  c.beginPath(); c.ellipse(5.4 - pl * 1.4, -0.6, 1.2 - pl * 0.4, 1.6 - pl * 0.6, 0.2, 0, 6.2832); c.fill();

  /* crâne : rond, avec une calotte de poil sombre qui déborde sur le
     front. C'est elle qui donne au singe son air soucieux. */
  c.fillStyle = P.flanc;
  c.beginPath(); c.ellipse(0.2, -0.6, 4.9, 4.7, 0, 0, 6.2832); c.fill();
  c.fillStyle = P.cape;
  c.beginPath();
  c.moveTo(-4.8, -1.8);
  c.quadraticCurveTo(-3.7, -6.1, 0.6, -5.9);
  c.quadraticCurveTo(4.8, -5.7, 5.0, -1.6);
  c.quadraticCurveTo(2.4, -3.3, -0.4, -3.1);
  c.quadraticCurveTo(-2.8, -2.9, -4.8, -1.8);
  c.closePath(); c.fill();

  /* La face claire, en cœur : c'est le fond sur lequel les deux yeux
     font tache. Sans elle, deux billes noires sur une tête brune ne se
     voient pas à z = 0,6. */
  c.fillStyle = P.face;
  c.beginPath();
  c.moveTo(-3.5 + lacet * 1.6, -1.6);
  c.quadraticCurveTo(-3.9 + lacet * 1.6, 2.2, -0.4 + lacet * 1.8, 4.0);
  c.quadraticCurveTo(3.2 + lacet * 1.8, 2.4, 3.6 + lacet * 1.6, -1.4);
  c.quadraticCurveTo(1.6 + lacet * 1.6, -2.9, -0.2 + lacet * 1.6, -2.8);
  c.quadraticCurveTo(-2.2 + lacet * 1.6, -2.7, -3.5 + lacet * 1.6, -1.6);
  c.closePath(); c.fill();

  /* museau saillant et narines. Le singe pousse la bouche en avant, ce
     qui le distingue tout de suite du chat au même gabarit. */
  c.fillStyle = P.museau;
  c.beginPath(); c.ellipse(1.4 + lacet * 1.9, 2.5, 2.5, 1.9, 0.06, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(122,76,57,.75)";
  c.beginPath(); c.ellipse(0.5 + lacet * 1.9, 1.7, 0.36, 0.28, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(2.2 + lacet * 1.9, 1.75, 0.36, 0.28, 0, 0, 6.2832); c.fill();

  if(alerte){
    /* la grimace d'alarme : gueule ouverte, dents du haut visibles.
       Un singe qui fuit crie ; sans cette bouche il avait juste l'air
       de trottiner. */
    c.fillStyle = "#5b2f28";
    c.beginPath(); c.ellipse(1.5 + lacet * 1.9, 3.5, 1.7, 1.15, 0, 0, 6.2832); c.fill();
    c.fillStyle = P.dents;
    c.beginPath(); c.ellipse(1.5 + lacet * 1.9, 2.9, 1.5, 0.5, 0, 0, 6.2832); c.fill();
  }else{
    c.strokeStyle = "rgba(96,58,42,.6)"; c.lineWidth = 0.42; c.lineCap = "round";
    c.beginPath();
    c.moveTo(-0.2 + lacet * 1.9, 3.4);
    c.quadraticCurveTo(1.4 + lacet * 1.9, 4.2, 3.0 + lacet * 1.9, 3.3);
    c.stroke();
  }

  /* Les deux yeux, sous une arcade sourcilière marquée. Le lointain est
     plus petit : c'est ce qui fait tourner la tête sans la redessiner. */
  var lo = 0.82 + lacet * 0.36;
  var ry = alerte ? 1.55 : 1.4;
  oeilFaune(c, -1.9 + lacet * 2.2, -0.5, ry * lo, ouv, P.museau, lacet);
  oeilFaune(c, 2.2 + lacet * 1.8, -0.5, ry, ouv, P.museau, lacet);
  c.strokeStyle = "rgba(74,53,32,.5)"; c.lineWidth = 0.6; c.lineCap = "round";
  c.beginPath();
  c.moveTo(-3.4 + lacet * 2.0, -2.2);
  c.quadraticCurveTo(0.0 + lacet * 2.0, -3.4, 3.5 + lacet * 1.8, -2.1);
  c.stroke();

  c.restore();
  c.restore();
}

/* ================================================================
   LE PANDA
   ================================================================
   La bête la plus demandée de la carte : il en faut BEAUCOUP, et
   surtout beaucoup d'ATTITUDES. Deux poses, choisies par k.assis et
   fixées une fois pour toutes à la pose de la carte :

   — debout, il marche en se dandinant, la tête basse, le pas lourd ;
   — assis, il mâche une canne de bambou, et c'est là toute la scène :
     il mastique par salves de cinq, s'arrête, remonte la canne, repart.

   Il n'y a pas de transition animée entre les deux, et c'est assumé :
   un panda ne se lève jamais en cours de partie. Ce qu'on gagne, c'est
   deux dessins vraiment différents plutôt qu'un compromis mou.

   Sa silhouette : une masse blanche, quatre pattes noires, deux
   oreilles noires — trois valeurs, aucune couleur. Il tient donc à
   n'importe quelle taille et sous n'importe quelle lumière d'orage.
   ================================================================ */
function pandaTorse(c, d){
  c.beginPath();
  c.moveTo(-11.6, -11.8);                                 /* croupe */
  c.quadraticCurveTo(-13.4, -18.8 - d, -5.0, -20.6 - d);  /* dos */
  c.quadraticCurveTo(4.0, -22.4 - d, 10.6, -19.6);        /* garrot */
  c.quadraticCurveTo(14.0, -17.4, 13.4, -12.6);           /* poitrail */
  c.quadraticCurveTo(12.8, -7.8, 7.4, -7.4);
  c.quadraticCurveTo(-0.4, -6.4, -6.0, -7.8);             /* ventre lourd */
  c.quadraticCurveTo(-10.0, -8.7, -11.6, -11.8);
  c.closePath();
}
function pandaDos(c, d){
  c.beginPath();
  c.moveTo(-11.8, -11.6);
  c.quadraticCurveTo(-13.4, -18.8 - d, -5.0, -20.6 - d);
  c.quadraticCurveTo(4.0, -22.4 - d, 10.6, -19.6);
  c.quadraticCurveTo(13.0, -18.4, 13.4, -14.6);
}
function pandaVentre(c){
  c.beginPath();
  c.moveTo(12.4, -8.0);
  c.quadraticCurveTo(-0.4, -5.8, -6.0, -7.2);
  c.quadraticCurveTo(-9.4, -8.1, -11.4, -10.6);
}

/* La tête, commune aux deux poses : on la place, on l'oriente, et elle
   se dessine pareil. Le seul paramètre de jeu est « mach », l'ouverture
   de mâchoire, qui ne sert qu'assis.
   « pl » plaque les oreilles (fuite, sursaut), « lacet » tourne. */
function panda_tete(c, lacet, ouv, mach, pl, tire_langue){
  var P = PAL_PANDA;
  /* Oreilles : deux disques noirs BIEN détachés du crâne. Collées,
     elles fondaient dans la tache oculaire et le panda perdait sa
     signature. */
  c.fillStyle = P.noirO;
  c.beginPath(); c.ellipse(-3.8 + pl * 1.6, -5.0 + pl * 1.4, 2.9, 3.1, -0.25, 0, 6.2832); c.fill();
  c.fillStyle = P.noir;
  c.beginPath(); c.ellipse(3.6 - pl * 1.4, -5.2 + pl * 1.4, 2.7, 2.9, 0.25, 0, 6.2832); c.fill();

  /* crâne */
  c.fillStyle = degCache(c, "pandaCrane", function(){
    var g = c.createRadialGradient(-1.6, -3.4, 0.8, 0, -0.4, 7.4);
    g.addColorStop(0, PAL_PANDA.blancC);
    g.addColorStop(0.6, PAL_PANDA.blanc);
    g.addColorStop(1, PAL_PANDA.blancO);
    return g;
  });
  c.beginPath(); c.ellipse(0, 0, 6.1, 5.7, 0, 0, 6.2832); c.fill();

  /* Les deux taches oculaires, en goutte inclinée. Elles sont GRANDES —
     plus grandes que ce qu'un panda a vraiment — parce que c'est le
     seul dessin de la tête qui survive au dézoom, et parce qu'elles
     donnent les deux points sombres sur fond clair. */
  c.save();
  c.translate(lacet * 2.0, 0);
  c.fillStyle = P.noirO;
  c.save(); c.translate(-2.4, -0.9); c.rotate(-0.44);
  c.beginPath(); c.ellipse(0, 0, 2.0, 2.7, 0, 0, 6.2832); c.fill();
  c.restore();
  c.fillStyle = P.noir;
  c.save(); c.translate(2.5, -0.7); c.rotate(0.40);
  c.beginPath(); c.ellipse(0, 0, 2.1, 2.8, 0, 0, 6.2832); c.fill();
  c.restore();
  /* les yeux DANS les taches : sans le petit rond clair autour, la
     bille noire disparaissait purement et simplement dans la tache */
  oeilFaune(c, -2.3, -1.0, 0.92, ouv, "rgba(226,220,206,.85)", lacet);
  oeilFaune(c, 2.6, -0.8, 1.00, ouv, "rgba(232,226,212,.9)", lacet);
  c.restore();

  /* museau court et nez large */
  c.fillStyle = P.blancC;
  c.beginPath(); c.ellipse(1.6 + lacet * 2.4, 3.2 + mach * 0.5, 3.4, 2.5, 0.05, 0, 6.2832); c.fill();
  c.fillStyle = P.nez;
  c.beginPath();
  c.moveTo(0.2 + lacet * 2.6, 1.9);
  c.quadraticCurveTo(1.7 + lacet * 2.6, 1.2, 3.2 + lacet * 2.6, 1.9);
  c.quadraticCurveTo(3.0 + lacet * 2.6, 3.2, 1.7 + lacet * 2.6, 3.4);
  c.quadraticCurveTo(0.4 + lacet * 2.6, 3.2, 0.2 + lacet * 2.6, 1.9);
  c.closePath(); c.fill();
  /* la mâchoire : une ellipse sombre qui descend. Une bouche tracée au
     trait ne se voyait plus dès le premier cran de dézoom ; une tache
     qui s'ouvre et se ferme, si. */
  if(mach > 0.02){
    /* La gueule s'ouvre DANS le museau. Pendue dessous, la première
       version faisait une langue qui traîne, et un panda qui mâche
       avait l'air d'un chien qui halète. */
    c.fillStyle = "#241a22";
    c.beginPath(); c.ellipse(2.1 + lacet * 2.6, 4.3 + mach * 0.35, 2.1, 0.32 + mach * 0.85, 0, 0, 6.2832); c.fill();
  }else{
    c.strokeStyle = "rgba(52,40,48,.6)"; c.lineWidth = 0.5; c.lineCap = "round";
    c.beginPath();
    c.moveTo(0.8 + lacet * 2.6, 4.2);
    c.quadraticCurveTo(2.2 + lacet * 2.6, 5.0, 3.6 + lacet * 2.6, 4.1);
    c.stroke();
  }
  if(tire_langue){
    c.fillStyle = PAL_PANDA.langue;
    c.beginPath(); c.ellipse(4.4 + lacet * 2.6, 5.0, 1.5, 0.9, 0.4, 0, 6.2832); c.fill();
  }
}

/* La canne de bambou. Elle n'existe qu'assis, mais c'est elle qui
   raconte la scène : sans elle, un panda assis n'est qu'un panda qui
   attend. Trois entre-nœuds, un renflement à chaque nœud, deux feuilles
   au bout — et le tout bouge d'un bloc quand il mastique. */
/* (x, y) est le bout MÂCHÉ, celui qui est dans la gueule ; « rot »
   oriente la canne de sorte que le +y local descende le long de la
   tige, loin de la bouche. Les feuilles sortent aux deux tiers, sur le
   côté : au bout de la tige, elles se plantaient soit dans la gueule du
   panda, soit dans le sol. */
function panda_bambou(c, x, y, rot, lon, bal){
  var P = PAL_PANDA;
  c.save();
  c.translate(x, y);
  c.rotate(rot + bal * 0.045);
  c.fillStyle = P.caneO;
  c.fillRect(-1.15, -0.6, 2.3, lon);
  c.fillStyle = P.cane;
  c.fillRect(-1.15, -0.6, 1.25, lon);
  c.fillStyle = "rgba(18,38,12,.5)";
  for(var i = 1; i <= 3; i++) c.fillRect(-1.45, lon * i / 3.6, 2.9, 0.75);
  /* le bout mâché : plus clair et effiloché, c'est ce qui dit qu'il
     mange et pas qu'il tient un bâton */
  c.fillStyle = "#d3e8a6";
  c.beginPath(); c.ellipse(0, -0.4, 1.35, 0.95, 0, 0, 6.2832); c.fill();
  var d = lon * 0.68, f = bal * 0.55;
  c.fillStyle = P.feuille;
  c.beginPath();
  c.moveTo(0, d);
  c.quadraticCurveTo(-5.4, d - 1.2 + f, -9.8, d - 4.2 + f);
  c.quadraticCurveTo(-5.2, d + 0.8, 0, d + 1.1);
  c.closePath(); c.fill();
  c.fillStyle = P.feuilleO;
  c.beginPath();
  c.moveTo(0, d + 1.8);
  c.quadraticCurveTo(-4.8, d + 3.0 - f, -8.6, d + 2.0 - f);
  c.quadraticCurveTo(-4.6, d + 4.4, 0, d + 3.2);
  c.closePath(); c.fill();
  c.restore();
}

/* ---- PANDA ASSIS : la scène qui mange -------------------------- */
function panda_assis(c, k, tps, sur, alerte, fuit){
  var P = PAL_PANDA;
  var ph = k.ph || 0;
  /* La mastication par salves : cinq coups de mâchoire serrés, puis
     deux secondes à regarder ailleurs. Une mâchoire qui bat sans arrêt
     donne un automate ; c'est la PAUSE qui fait le panda. */
  var cyc = (tps * 0.42 + ph * 0.27) % 1;
  var croque = cyc < 0.62 ? 1 : 0;
  var mach = alerte ? 0 : croque * (0.5 + 0.5 * Math.sin(tps * 11.5 + ph * 2)) * 0.9;
  var resp = Math.sin(tps * 1.15 + ph) * 0.45;
  var bal = Math.sin(tps * 11.5 + ph * 2) * (alerte ? 0 : croque);
  var ouv = alerte ? 1 : fauneClin(tps, ph, 4.4);
  var lacet = alerte ? -0.22 : Math.sin(tps * 0.42 + ph * 1.3) * 0.22;
  /* Effrayé, il ne se lève pas — il se ramasse, serre la canne contre
     lui et rentre la tête. Un panda assis qu'on effraie reste assis :
     c'est précisément ce qui le rend drôle. */
  var serre = alerte ? 1 : 0;
  var tapi = sur * 1.8 + (fuit ? 1.2 : 0);

  ombreFaune(c, 1.4, 13.0, 4.4, 0, 0.3);

  c.save();
  c.translate(0, tapi);

  /* ---- patte arrière du fond, allongée vers l'avant ---- */
  c.fillStyle = P.noirO;
  c.beginPath(); c.ellipse(4.0, -3.4, 6.4, 3.1, -0.10, 0, 6.2832); c.fill();

  /* ---- le corps : une poire posée sur ses fesses, le ventre en
     avant. Il respire — le poitrail se soulève, et c'est à peu près la
     seule chose qui bouge chez un panda qui ne mâche pas. ---- */
  c.fillStyle = degCache(c, "pandaAssis", function(){
    var g = c.createLinearGradient(0, -21, 0, -1);
    g.addColorStop(0, PAL_PANDA.blancC);
    g.addColorStop(0.5, PAL_PANDA.blanc);
    g.addColorStop(1, PAL_PANDA.blancO);
    return g;
  });
  c.beginPath();
  c.moveTo(-9.4, -1.4);
  c.quadraticCurveTo(-12.4, -8.6, -10.2, -14.8);
  c.quadraticCurveTo(-7.8, -20.2, -0.8, -20.4);
  c.quadraticCurveTo(6.6, -20.6, 9.2, -14.2 - resp);
  c.quadraticCurveTo(11.8, -7.4, 8.0, -2.6);
  c.quadraticCurveTo(3.0, -0.2, -3.2, -0.5);
  c.quadraticCurveTo(-7.2, -0.8, -9.4, -1.4);
  c.closePath(); c.fill();

  /* ---- patte arrière proche, plante de pied tournée vers nous. La
     plante claire est un détail gratuit qui rapporte beaucoup : c'est
     ce qu'on voit d'un panda assis sur toutes les photos. ---- */
  c.fillStyle = P.noir;
  c.beginPath(); c.ellipse(6.8, -2.9, 7.0, 3.5, -0.14, 0, 6.2832); c.fill();
  c.fillStyle = P.noirC;
  c.beginPath(); c.ellipse(12.0, -3.8, 2.5, 3.0, -0.18, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,255,255,.10)";
  c.beginPath(); c.ellipse(12.2, -4.2, 1.5, 1.9, -0.18, 0, 6.2832); c.fill();

  /* ---- le baudrier noir des épaules, écrêté par le corps ---- */
  c.save();
  c.beginPath();
  c.moveTo(-9.4, -1.4);
  c.quadraticCurveTo(-12.4, -8.6, -10.2, -14.8);
  c.quadraticCurveTo(-7.8, -20.2, -0.8, -20.4);
  c.quadraticCurveTo(6.6, -20.6, 9.2, -14.2 - resp);
  c.quadraticCurveTo(11.8, -7.4, 8.0, -2.6);
  c.quadraticCurveTo(3.0, -0.2, -3.2, -0.5);
  c.quadraticCurveTo(-7.2, -0.8, -9.4, -1.4);
  c.closePath(); c.clip();
  c.fillStyle = P.noir;
  c.beginPath();
  c.moveTo(-11.0, -15.0);
  c.quadraticCurveTo(-2.4, -20.2, 8.2, -17.0);
  c.quadraticCurveTo(9.4, -14.8, 8.8, -12.6);
  c.quadraticCurveTo(-1.8, -16.0, -11.4, -12.2);
  c.closePath(); c.fill();
  c.restore();

  /* ---- LA CANNE ET LES DEUX BRAS ----
     Le bout mâché part de la gueule et la tige descend en travers du
     ventre BLANC : c'est le seul fond sur lequel un vert de bambou se
     voie vraiment. Première version, la canne était derrière le corps —
     il ne restait qu'une feuille qui dépassait, et le panda avait
     simplement l'air de bâiller. */
  var bx = 7.0 - serre * 1.8, by = -18.4 + serre * 1.0;
  var rot = 0.576 + serre * 0.26;
  var lon = 18.4;
  /* les deux paumes, prises sur la tige elle-même */
  function surCanne(t){
    return { x:bx - Math.sin(rot) * lon * t, y:by + Math.cos(rot) * lon * t };
  }
  /* Les paumes sont prises BAS sur la tige, largement sous le
     baudrier : serrées plus haut, les deux bras noirs tombaient dans la
     bande noire des épaules et disparaissaient purement et simplement —
     le panda avait l'air de tenir le bambou par la pensée. */
  var pn = surCanne(0.44), pf = surCanne(0.68);
  /* bras du fond, puis la canne, puis le bras de devant : la tige est
     ainsi vraiment PRISE entre les deux paumes */
  membreFaune(c, -1.6, -16.4, -0.6, -12.4, pf.x, pf.y, 2.4, 1.9, P.noirO, P.noirO, 2.1);
  panda_bambou(c, bx, by, rot, lon, bal);
  membreFaune(c, 5.6, -16.8, 6.4, -13.6, pn.x, pn.y, 2.5, 2.0, P.noirC, P.noir, 2.3);

  /* ---- la tête, penchée sur la canne ---- */
  c.save();
  c.translate(4.4 + serre * 0.4, -22.4 + mach * 0.5 + serre * 1.2);
  c.rotate(0.14 + mach * 0.05 + serre * 0.12);
  panda_tete(c, lacet, ouv, mach, serre, 0);
  c.restore();

  c.restore();
}

/* ---- PANDA DEBOUT : il marche, il se dandine ------------------- */
function panda_debout(c, k, tps, sur, alerte, fuit){
  var P = PAL_PANDA;
  var ph = k.ph || 0, pas = k.phase || 0;
  var bond = Math.abs(Math.sin(pas));
  var saut = fuit ? bond * 2.4 : bond * 0.45;
  var d = fuit ? -1.4 : Math.sin(pas) * 0.55;
  var ec = Math.sin(pas) * (fuit ? 6.4 : 3.4);
  var ouv = alerte ? 1 : fauneClin(tps, ph, 4.4);
  var lacet = fuit ? -0.26 : Math.sin(tps * 0.44 + ph * 1.5) * 0.26;
  var tapi = sur * 2.4;
  /* Le dandinement : un panda ne marche pas droit, il roule d'une
     épaule sur l'autre. C'est cette bascule, plus que le pas, qui donne
     le poids de la bête. */
  var roule = fuit ? 0.07 : Math.sin(tps * 1.2 + ph) * 0.035;

  ombreFaune(c, 0.4, 13.6, 4.6, bond, 0.3);

  c.save();
  c.translate(0, -saut + tapi);
  c.rotate(roule);

  /* pattes du fond */
  membreFaune(c, -7.6, -11.0, -9.4, -6.0, -8.2 - ec, -1.2, 2.8, 1.9, P.noirO, P.noirO, 2.4);
  membreFaune(c, 8.2, -12.4, 9.6, -6.6, 8.8 - ec, -1.2, 2.8, 1.9, P.noirO, P.noirO, 2.4);

  /* le corps */
  c.fillStyle = degCache(c, "pandaTorse", function(){
    var g = c.createLinearGradient(0, -24, 0, -8);
    g.addColorStop(0, PAL_PANDA.blancC);
    g.addColorStop(0.5, PAL_PANDA.blanc);
    g.addColorStop(1, PAL_PANDA.blancO);
    return g;
  });
  pandaTorse(c, d); c.fill();

  /* La ceinture noire des épaules, écrêtée par le corps. Elle ne
     descend PAS jusqu'au ventre : un panda a un baudrier, pas une
     moitié avant noire — première version, on croyait à deux animaux
     accolés. */
  c.save();
  pandaTorse(c, d); c.clip();
  c.fillStyle = P.noir;
  c.beginPath();
  c.moveTo(4.2, -23.0);
  c.quadraticCurveTo(11.4, -21.4, 14.6, -16.2);
  c.lineTo(14.6, -6.0);
  c.lineTo(8.4, -6.0);
  c.quadraticCurveTo(9.0, -14.6, 4.2, -23.0);
  c.closePath(); c.fill();
  /* et la culotte noire de la croupe : c'est elle qui rattache la patte
     arrière au corps au lieu de la laisser vissée dessus */
  c.beginPath(); c.ellipse(-9.6, -11.4, 4.6, 4.6, 0, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,255,255,.10)";
  c.beginPath(); c.ellipse(7.0, -19.4, 4.4, 2.6, -0.3, 0, 6.2832); c.fill();
  c.restore();

  chatVolume(c, function(cc){ pandaTorse(cc, d); },
                function(cc){ pandaDos(cc, d); },
                pandaVentre,
                "rgba(255,255,248,.34)", "rgba(90,84,76,.26)");

  /* pattes de devant */
  /* Les quatre pieds sont NOIRS. Posés en gris pâle, ils faisaient
     quatre chaussettes claires au ras du sol : le panda avait l'air
     chaussé, et à petite taille ces quatre points clairs devenaient le
     détail le plus visible de la bête. */
  membreFaune(c, -5.2, -11.2, -6.8, -6.2, -5.0 + ec, -1.2, 3.0, 2.0, P.noir, P.noir, 2.6);
  membreFaune(c, 10.4, -12.8, 11.8, -6.8, 11.2 + ec, -1.2, 3.0, 2.0, P.noir, P.noir, 2.6);

  /* la tête, portée bas — un panda regarde toujours le sol */
  c.save();
  c.translate(15.2 + (fuit ? 1.6 : 0), -20.4 + (fuit ? 2.6 : 0) + sur * 1.6);
  c.rotate((fuit ? 0.2 : Math.sin(tps * 0.44 + ph * 1.5) * 0.05) + roule * 0.5);
  panda_tete(c, lacet, ouv, fuit ? 0.55 : 0, alerte ? 1 : 0, fuit ? 1 : 0);
  c.restore();

  c.restore();
}

function dessinePanda(c, k, tps){
  var fuit = k.etat === "fuite";
  var sur = fauneSursaut(k, tps);
  var alerte = fuit || sur > 0.15;
  if(k.assis) panda_assis(c, k, tps, sur, alerte, fuit);
  else panda_debout(c, k, tps, sur, alerte, fuit);
}

/* ================================================================
   LE KOALA
   ================================================================
   Associé aux arbres : le poseur de carte le colle au pied d'un tronc,
   et il ne bouge quasiment pas. C'est donc le seul du bestiaire dont on
   ne verra JAMAIS la démarche — ce qui autorise à tout miser sur la
   pose assise et le visage.

   Deux oreilles énormes et un nez en cuiller, c'est tout le koala. À
   z = 0,5 il ne reste que ça, et ça suffit : aucune autre bête de l'île
   n'a cette silhouette de trèfle.

   En fuite, il ne court pas — il n'a jamais couru de sa vie. Il se
   DRESSE et tend les deux bras vers le haut, à la recherche d'une
   branche. Un koala paniqué grimpe : la posture doit le dire.
   ================================================================ */
function koalaTorse(c, resp, dresse){
  c.beginPath();
  c.moveTo(-6.6, -1.0);
  c.quadraticCurveTo(-9.0, -6.8 - dresse * 3.0, -6.4, -11.4 - dresse * 4.4);
  c.quadraticCurveTo(-3.6, -15.4 - dresse * 5.0, 1.6, -14.6 - dresse * 5.2);
  c.quadraticCurveTo(6.4, -13.8 - dresse * 4.8, 7.4, -9.0 - resp - dresse * 3.4);
  c.quadraticCurveTo(8.6, -4.0, 5.2, -1.0);
  c.quadraticCurveTo(0.0, 0.3, -6.6, -1.0);
  c.closePath();
}
/* L'oreille : un disque de fourrure ébouriffée. Les pointes sont
   grosses et peu nombreuses — six dents fines devenaient un bord flou
   dès le premier cran de dézoom, cinq grosses restent une oreille
   poilue. */
function koala_oreille(c, x, y, r, ext, poil, ang){
  c.save();
  c.translate(x, y); c.rotate(ang);
  c.fillStyle = poil;
  for(var i = 0; i < 7; i++){
    var a = -2.5 + i * 0.72;
    c.beginPath();
    c.arc(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82, r * 0.44, 0, 6.2832);
    c.fill();
  }
  c.fillStyle = ext;
  c.beginPath(); c.arc(0, 0, r * 0.86, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(60,52,46,.28)";
  c.beginPath(); c.arc(r * 0.16, r * 0.14, r * 0.5, 0, 6.2832); c.fill();
  c.restore();
}
function dessineKoala(c, k, tps){
  var P = PAL_KOALA;
  var ph = k.ph || 0;
  var fuit = k.etat === "fuite";
  var sur = fauneSursaut(k, tps);
  var alerte = fuit || sur > 0.15;
  var dresse = fuit ? 1 : 0;
  var resp = Math.sin(tps * 0.95 + ph) * 0.55;
  /* Il dort à moitié : au repos les paupières sont à mi-course et ne
     s'ouvrent en grand que par à-coups. C'est le seul du bestiaire dont
     la valeur par défaut n'est pas « yeux grands ouverts », et c'est
     exactement ce qui le rend attachant. */
  var reveil = fauneFenetre(tps, ph, 7.6, 1.6);
  var ouv = alerte ? 1 : 0.5 + reveil * 0.5;
  if(!alerte && fauneClin(tps, ph + 1.7, 5.2) < 0.5) ouv = 0.2;
  var lacet = alerte ? -0.2 : Math.sin(tps * 0.36 + ph * 1.1) * 0.3;
  var tremble = fuit ? Math.sin(tps * 13 + ph) * 0.5 : 0;
  var tapi = sur * 1.4;

  ombreFaune(c, 0.4, 8.0, 3.0, 0, 0.28);

  c.save();
  c.translate(0, tapi);
  c.rotate((fuit ? -0.1 : 0) + Math.sin(tps * 0.95 + ph) * 0.014);

  /* patte arrière du fond, puis la proche par-dessus le ventre */
  membreFaune(c, -3.2, -8.0 - dresse * 3.4, -5.4, -4.6, -4.0, -0.8, 2.0, 1.6, P.ombre, P.griffe, 1.8);

  /* le corps */
  c.fillStyle = degCache(c, "koalaTorse", function(){
    var g = c.createLinearGradient(0, -16, 0, -1);
    g.addColorStop(0, PAL_KOALA.dos);
    g.addColorStop(0.55, PAL_KOALA.flanc);
    g.addColorStop(1, PAL_KOALA.ombre);
    return g;
  });
  koalaTorse(c, resp, dresse); c.fill();

  /* le plastron crème : la tache claire du poitrail, celle qui accroche
     l'œil quand le koala est à l'ombre d'un tronc */
  c.save();
  koalaTorse(c, resp, dresse); c.clip();
  c.fillStyle = P.ventre;
  c.beginPath();
  c.ellipse(3.6, -7.0 - dresse * 3.4, 4.2, 5.4 + dresse * 2.0, 0.14, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,255,255,.16)";
  c.beginPath(); c.ellipse(-3.0, -11.0 - dresse * 4.0, 3.4, 3.0, -0.3, 0, 6.2832); c.fill();
  c.restore();

  /* les deux bras. Assis, ils se croisent sur le ventre ; dressé, ils
     partent chercher une branche au-dessus de la tête. */
  if(dresse){
    membreFaune(c, -2.0, -16.0, -4.6, -22.0, -5.6 + tremble, -27.4, 1.9, 1.4, P.ombre, P.griffe, 1.6);
    membreFaune(c, 4.4, -16.6, 7.0, -22.6, 6.4 + tremble, -28.2, 2.0, 1.5, P.flanc, P.griffe, 1.7);
  }else{
    membreFaune(c, -1.6, -10.0, -1.0, -5.6, 3.0, -4.4, 1.9, 1.5, P.ombre, P.griffe, 1.6);
    membreFaune(c, 5.4, -10.6, 5.4, -5.8, 1.2, -4.0, 2.0, 1.6, P.flanc, P.griffe, 1.7);
  }
  /* patte proche, repliée sous le ventre */
  c.fillStyle = P.flanc;
  c.beginPath(); c.ellipse(4.4, -2.4, 3.4, 2.2, -0.1, 0, 6.2832); c.fill();
  c.fillStyle = P.griffe;
  c.beginPath(); c.ellipse(6.8, -1.6, 1.6, 1.2, -0.1, 0, 6.2832); c.fill();

  /* ---- LA TÊTE ---- */
  c.save();
  c.translate(2.6, -15.8 - dresse * 6.2);
  c.rotate((alerte ? -0.14 : Math.sin(tps * 0.36 + ph * 1.1) * 0.07) + tremble * 0.03);

  /* les deux oreilles, plus larges que le crâne n'est haut */
  koala_oreille(c, -3.8 + (alerte ? 0.9 : 0), -2.2 + (alerte ? 1.0 : 0),
                3.5, P.flanc, P.touffeO, -0.5);
  koala_oreille(c, 7.0 - (alerte ? 0.8 : 0), -1.6 + (alerte ? 1.0 : 0),
                3.2, P.dos, P.touffe, 0.5);

  /* crâne */
  c.fillStyle = degCache(c, "koalaCrane", function(){
    var g = c.createRadialGradient(-1.4, -2.6, 0.6, 0.4, 0, 6.2);
    g.addColorStop(0, PAL_KOALA.dos);
    g.addColorStop(0.7, PAL_KOALA.flanc);
    g.addColorStop(1, PAL_KOALA.ombre);
    return g;
  });
  c.beginPath(); c.ellipse(0.6, 0, 4.7, 4.5, 0, 0, 6.2832); c.fill();
  /* la face pâle : c'est elle qui fait exister les deux yeux */
  c.fillStyle = P.face;
  c.beginPath(); c.ellipse(1.6 + lacet * 1.6, 1.0, 3.6, 3.4, 0.06, 0, 6.2832); c.fill();

  /* LE NEZ EN CUILLER. Énorme, presque noir, luisant : la moitié de la
     reconnaissance du koala tient là-dedans, et il est le seul élément
     du bestiaire qu'on distingue encore à z = 0,4. */
  var nx = 2.6 + lacet * 1.8;
  c.fillStyle = P.nez;
  c.beginPath();
  c.moveTo(nx - 1.3, 1.2);                       /* arête, étroite */
  c.quadraticCurveTo(nx, 0.4, nx + 1.3, 1.2);
  c.quadraticCurveTo(nx + 2.6, 2.0, nx + 2.15, 3.4);  /* narine droite */
  c.quadraticCurveTo(nx + 1.25, 4.5, nx, 4.2);
  c.quadraticCurveTo(nx - 1.35, 4.5, nx - 2.15, 3.4);
  c.quadraticCurveTo(nx - 2.6, 2.0, nx - 1.3, 1.2);
  c.closePath(); c.fill();
  /* Deux reflets, un large en haut et un point vif : c'est ce qui rend
     le nez CUIR et non pas trou. Sans eux, la première version se
     lisait comme une gueule grande ouverte au milieu de la face. */
  c.fillStyle = "rgba(255,255,255,.22)";
  c.beginPath(); c.ellipse(nx - 0.2, 2.2, 1.7, 0.85, -0.16, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,255,255,.55)";
  c.beginPath(); c.ellipse(nx - 1.0, 1.9, 0.55, 0.36, -0.3, 0, 6.2832); c.fill();
  /* les deux narines, deux encoches claires en bas */
  c.fillStyle = "rgba(120,112,124,.75)";
  c.beginPath(); c.ellipse(nx - 1.05, 3.55, 0.45, 0.3, 0.3, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(nx + 1.05, 3.55, 0.45, 0.3, -0.3, 0, 6.2832); c.fill();

  /* les yeux, petits et très écartés, posés haut sur la face */
  var lo = 0.84 + lacet * 0.3;
  oeilFaune(c, -1.7 + lacet * 2.0, -1.0, 1.05 * lo, ouv, "rgba(246,244,240,.55)", lacet);
  oeilFaune(c, 3.0 + lacet * 1.7, -1.3, 1.15, ouv, "rgba(246,244,240,.6)", lacet);

  c.restore();
  c.restore();
}

/* ================================================================
   LE BOURDON
   ================================================================
   « Facile à reconnaître, et son vol peut être amusant. » Le dessin est
   donc secondaire : ce qui doit faire rire, c'est la TRAJECTOIRE.

   Un bourdon ne plane pas — il fonce en ligne à peu près droite,
   s'arrête NET, reste planté en l'air à réfléchir, puis repart ailleurs.
   Et il est lourd : quand il freine il s'affaisse, quand il accélère il
   pique du nez, et ses trois paires de pattes traînent derrière.

   Tout ça sort de volBourdon(), qui n'utilise aucun hasard : une suite
   de points d'arrêt tirés d'un haché du numéro de segment, et une
   interpolation adoucie qui occupe les six premiers dixièmes du
   segment. Le reste du temps, il est immobile — d'où l'arrêt net.
   ================================================================ */
/* Point d'arrêt n° i. Haché déterministe : le même i redonne toujours
   le même point, à toutes les images et sur toutes les machines. */
function bourdonHalte(i, n){
  var a = Math.sin(i * 12.9898 + n * 4.137) * 43758.5453;
  var b = Math.sin(i * 78.233 + n * 7.719) * 24634.6345;
  return { x:(a - Math.floor(a) - 0.5) * 30,
           y:-23 - (b - Math.floor(b)) * 15 };
}
/* Renvoie { x, y, vx, vy, vit } : position, vitesse, et l'intensité de
   l'élan (0 à l'arrêt, 1 en pleine ruée). */
function volBourdon(tps, ph, n){
  var seg = tps * 0.66 + ph * 0.41;
  var i = Math.floor(seg), u = seg - i;
  var a = bourdonHalte(i, n), b = bourdonHalte(i + 1, n);
  var e, vit;
  if(u < 0.6){
    var w = u / 0.6;
    e = w * w * (3 - 2 * w);       /* départ et arrivée en douceur */
    vit = 6 * w * (1 - w);         /* la dérivée de la même courbe */
  }else{ e = 1; vit = 0; }
  var dx = b.x - a.x, dy = b.y - a.y;
  /* Planté en l'air, il ne tient pas parfaitement : il vibre et il
     s'affaisse un peu. C'est ce petit affaissement qui donne le poids. */
  var flotte = (1 - vit) * (1.5 + Math.sin(tps * 5.7 + ph * 2.3) * 0.9);
  return { x:a.x + dx * e, y:a.y + dy * e + flotte,
           vx:dx * vit, vy:dy * vit, vit:vit };
}
/* Le corps seul, à l'origine, sans vol ni ombre : c'est cette fonction
   qu'on mesure au banc, et c'est elle que réutilise la planche. */
function corpsBourdon(c, tps, ph, pique){
  var P = PAL_BOURDON;
  /* Les ailes. Une aile qui bat à 40 Hz sur un rendu à 60 images/s ne
     peut pas être dessinée « à sa vraie position » : on verrait un
     scintillement aléatoire. On dessine donc le FLOU — deux ellipses
     pâles aux deux extrêmes de la course — plus une aile nette à la
     position courante. Ça ressemble à un battement quelle que soit la
     cadence d'affichage. */
  var bat = Math.sin(tps * 44 + ph * 5.1);
  c.save();
  c.globalAlpha = 0.20; c.fillStyle = P.aile;
  c.beginPath(); c.ellipse(-0.6, -4.6, 6.4, 2.1, -0.62, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(-0.2, -2.6, 6.0, 1.9, -0.12, 0, 6.2832); c.fill();
  c.globalAlpha = 0.42;
  c.beginPath(); c.ellipse(-0.4, -3.6 - bat * 0.9, 6.2, 1.7, -0.38 - bat * 0.22, 0, 6.2832); c.fill();
  c.restore();

  /* Les pattes, qui pendent et traînent. Elles disent le poids à elles
     seules : un insecte qui vole pattes rentrées a l'air vif, pattes
     pendantes il a l'air de peiner — et un bourdon peine. */
  c.strokeStyle = P.patte; c.lineWidth = 0.85; c.lineCap = "round";
  for(var j = 0; j < 3; j++){
    var lx = -1.6 + j * 1.9;
    c.beginPath();
    c.moveTo(lx, 1.8);
    c.quadraticCurveTo(lx - 0.4 - pique * 1.2, 3.6, lx - 1.4 - pique * 3.0, 4.6);
    c.stroke();
  }

  /* Abdomen : trois bandes, dont deux jaunes bien larges, et un bout
     blanc. C'est le rythme noir-jaune-noir-jaune-blanc qui dit
     « bourdon » plutôt que « grosse mouche ». */
  c.fillStyle = P.noir;
  c.beginPath(); c.ellipse(-3.4, 0.2, 4.9, 3.6, -0.18, 0, 6.2832); c.fill();
  c.fillStyle = P.poil;
  c.beginPath(); c.ellipse(-2.4, -0.2, 2.0, 3.3, -0.18, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(-5.6, 0.5, 1.4, 2.7, -0.18, 0, 6.2832); c.fill();
  c.fillStyle = P.bout;
  c.beginPath(); c.ellipse(-7.6, 1.0, 1.2, 1.9, -0.18, 0, 6.2832); c.fill();

  /* Thorax : la grosse boule de poil. Le halo pâle autour est le poil
     lui-même — sans lui, le bourdon est lisse, donc ce n'est plus un
     bourdon. */
  c.fillStyle = "rgba(246,201,46,.34)";
  c.beginPath(); c.arc(1.4, -0.9, 4.3, 0, 6.2832); c.fill();
  c.fillStyle = P.poil;
  c.beginPath(); c.arc(1.4, -0.9, 3.4, 0, 6.2832); c.fill();
  c.fillStyle = P.poilO;
  c.beginPath(); c.ellipse(1.0, 0.9, 3.0, 1.5, 0, 0, 6.2832); c.fill();

  /* Tête et DEUX yeux — oui, même sur un insecte : c'est ce qui fait la
     différence entre une bestiole et une tache qui passe. */
  c.fillStyle = P.noirC;
  c.beginPath(); c.ellipse(5.4, -1.4, 2.5, 2.3, 0, 0, 6.2832); c.fill();
  c.fillStyle = P.oeil;
  c.beginPath(); c.ellipse(6.4, -2.0, 1.15, 1.35, 0.2, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(4.4, -2.4, 0.85, 1.05, 0.2, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,255,255,.75)";
  c.beginPath(); c.arc(6.1, -2.5, 0.4, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(4.2, -2.8, 0.3, 0, 6.2832); c.fill();
  /* antennes coudées */
  c.strokeStyle = P.noir; c.lineWidth = 0.6;
  c.beginPath(); c.moveTo(6.0, -3.4); c.quadraticCurveTo(8.0, -5.0, 9.4, -4.2); c.stroke();
  c.beginPath(); c.moveTo(4.6, -3.7); c.quadraticCurveTo(6.4, -5.8, 8.0, -5.6); c.stroke();
}
function dessineBourdon(c, k, tps){
  var ph = k.ph || 0, n = k.n || 0;
  var sur = fauneSursaut(k, tps);
  var v = volBourdon(tps, ph, n);
  /* Effrayé, il ne fuit pas au sol : il monte d'un coup et part de
     côté. Une explosion doit se voir jusque sur les insectes. */
  var x = v.x + sur * 6.5, y = v.y - sur * 9.0;
  /* pique du nez à l'accélération, se cabre au freinage */
  var pique = Math.max(-1, Math.min(1, v.vx * 0.05));

  /* Ombre au sol, à l'aplomb : elle suit le bourdon en x et fond quand
     il monte. C'est elle qui raccroche l'insecte au terrain. */
  var f = Math.max(0.12, 1 + y / 46);
  c.fillStyle = "rgba(0,0,0," + (0.22 * f) + ")";
  c.beginPath(); c.ellipse(x * 0.75, 0, 3.4 * f + 0.8, 1.3 * f + 0.3, 0, 0, 6.2832); c.fill();

  c.save();
  c.translate(x, y);
  c.rotate(pique * 0.30 + v.vy * 0.012);
  corpsBourdon(c, tps, ph, pique);
  c.restore();
}

/* ================================================================
   LE PAPILLON
   ================================================================
   Il ne fait qu'une chose : monter et redescendre en zigzaguant, sans
   jamais aller droit. Le battement n'est pas une rotation d'aile mais
   un ÉCRASEMENT horizontal : ailes à plat on voit toute la surface,
   ailes jointes on ne voit plus qu'une tranche. C'est ce qui donne le
   clignotement caractéristique d'un papillon qui traverse.
   Trois livrées tirées de k.n, pour ne pas semer des photocopies.
   ================================================================ */
function papillon_aile(c, larg, haut, tache){
  /* Une paire d'ailes : la grande devant, la petite derrière, et un
     bord sombre qui les tient ensemble. Sans le bord, à petite taille,
     les deux ailes se confondaient en une bouillie colorée. */
  c.beginPath();
  c.moveTo(0, 0.6);
  c.quadraticCurveTo(larg * 0.5, -haut * 1.25, larg * 1.02, -haut * 0.42);
  c.quadraticCurveTo(larg * 1.06, haut * 0.16, larg * 0.42, haut * 0.18);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(larg * 0.16, 0.5);
  c.quadraticCurveTo(larg * 0.74, haut * 0.42, larg * 0.7, haut * 0.96);
  c.quadraticCurveTo(larg * 0.28, haut * 0.86, larg * 0.1, haut * 0.22);
  c.closePath();
  c.fill();
  if(tache){
    c.fillStyle = tache;
    c.beginPath(); c.ellipse(larg * 0.68, -haut * 0.46, larg * 0.12, haut * 0.15, 0, 0, 6.2832); c.fill();
    c.beginPath(); c.ellipse(larg * 0.44, -haut * 0.16, larg * 0.07, haut * 0.10, 0, 0, 6.2832); c.fill();
    c.beginPath(); c.ellipse(larg * 0.46, haut * 0.64, larg * 0.09, haut * 0.12, 0, 0, 6.2832); c.fill();
  }
}
function corpsPapillon(c, tps, ph, n){
  var P = PAL_PAPILLON[n % 3];
  /* ouverture : 0 ailes jointes (vues par la tranche), 1 ailes à plat */
  var o = 0.16 + 0.84 * (0.5 + 0.5 * Math.sin(tps * 8.4 + ph * 2.7));
  var lev = (1 - o) * 2.4;                   /* jointes, elles montent */

  /* la paire du fond, plus sombre : sans elle le papillon est plat */
  c.save();
  c.translate(0, -lev * 0.6);
  c.scale(-o * 0.82, 1);
  c.fillStyle = P.bas;
  papillon_aile(c, 7.6, 5.0, 0);
  /* même liseré sombre que devant : sans lui l'aile du fond n'était
     qu'une flaque bleue sans forme derrière le corps */
  c.strokeStyle = P.bord; c.lineWidth = 0.7 / Math.max(0.3, o * 0.82);
  c.beginPath();
  c.moveTo(0, 0.6); c.quadraticCurveTo(3.7, -5.75, 7.55, -1.93);
  c.stroke();
  c.restore();

  /* corps : un fuseau sombre, trois segments */
  c.fillStyle = P.corps;
  c.beginPath(); c.ellipse(0, 0, 1.05, 3.2, 0.06, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(0.2, -3.0, 1.15, 0, 6.2832); c.fill();
  /* antennes en massue */
  c.strokeStyle = P.corps; c.lineWidth = 0.42;
  c.beginPath(); c.moveTo(0.4, -3.8); c.quadraticCurveTo(2.2, -5.6, 3.4, -5.2); c.stroke();
  c.beginPath(); c.moveTo(-0.2, -3.9); c.quadraticCurveTo(-1.6, -6.0, -2.8, -5.6); c.stroke();
  c.fillStyle = P.corps;
  c.beginPath(); c.arc(3.5, -5.2, 0.42, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(-2.9, -5.6, 0.42, 0, 6.2832); c.fill();

  /* la paire de devant, en pleine lumière */
  c.save();
  c.translate(0, -lev);
  c.scale(o, 1);
  c.fillStyle = P.haut;
  papillon_aile(c, 8.0, 5.3, P.tache);
  /* le liseré sombre du bord d'aile, repassé au trait : c'est lui qui
     tient la forme quand les ailes se referment et qu'il ne reste
     qu'une ligne */
  c.strokeStyle = P.bord; c.lineWidth = Math.min(2.2, 0.75 / Math.max(0.2, o));
  c.beginPath();
  c.moveTo(0, 0.6);
  c.quadraticCurveTo(3.9, -6.1, 7.96, -2.06);
  c.stroke();
  c.restore();
}
function dessinePapillon(c, k, tps){
  var ph = k.ph || 0, n = k.n || 0;
  var sur = fauneSursaut(k, tps);
  /* Le vol : deux sinus incommensurables en horizontal, et en vertical
     une bosse asymétrique — il monte vite en battant, il redescend en
     planant. Le papillon qui monte en escalier, c'est tout le charme. */
  var t = tps * 0.55 + ph;
  var x = Math.sin(t * 1.9) * 9 + Math.sin(t * 0.73 + n) * 6;
  var mont = Math.sin(tps * 4.2 + ph * 2.7);
  var y = -24 - Math.sin(t * 1.31 + n * 0.7) * 7 - mont * 2.2 - sur * 10;
  var incl = Math.cos(t * 1.9) * 0.22 + mont * 0.06;

  var f = Math.max(0.12, 1 + y / 42);
  c.fillStyle = "rgba(0,0,0," + (0.16 * f) + ")";
  c.beginPath(); c.ellipse(x * 0.7, 0, 2.6 * f + 0.6, 1.0 * f + 0.25, 0, 0, 6.2832); c.fill();

  c.save();
  c.translate(x, y);
  c.rotate(incl);
  corpsPapillon(c, tps, ph, n);
  c.restore();
}

/* ================================================================
   LA LUCIOLE
   ================================================================
   Quatre unités de haut : à z = 0,7 elle mesure trois pixels. Son corps
   n'est donc PAS ce qui la rend visible — c'est sa lueur, et rien
   d'autre. D'où la règle qui a dicté tout le reste : le halo passe par
   lueurRapide (canevas pré-rendu, un drawImage), jamais par un
   createRadialGradient par image. À cinquante lucioles dans une
   clairière, la différence n'est pas discutable.

   Le clignotement : une bosse brève et franche, et entre deux bosses
   une braise faible qui ne s'éteint jamais tout à fait. Une luciole
   qui s'éteint complètement disparaît de la carte, et le joueur croit
   à un défaut d'affichage.
   ================================================================ */
function corpsLuciole(c, feu){
  var P = PAL_LUCIOLE;
  /* Élytres sombres, corselet orangé, tête noire : la vraie luciole.
     Personne ne verra ce détail au zoom de jeu, et c'est très bien —
     il est là pour le moment où le joueur monte à z = 1,7. */
  c.fillStyle = P.elytre;
  c.beginPath(); c.ellipse(-0.5, 0, 3.4, 1.9, -0.05, 0, 6.2832); c.fill();
  c.strokeStyle = "rgba(18,14,10,.6)"; c.lineWidth = 0.3;
  c.beginPath(); c.moveTo(-3.3, -0.15); c.lineTo(1.4, 0.15); c.stroke();
  c.fillStyle = P.corselet;
  c.beginPath(); c.ellipse(2.0, -0.45, 1.55, 1.4, 0, 0, 6.2832); c.fill();
  c.fillStyle = P.corps;
  c.beginPath(); c.ellipse(2.9, -0.5, 0.75, 0.65, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(1.7, -0.55, 0.36, 0, 6.2832); c.fill();
  /* La lanterne, au bout de l'abdomen. Elle est OPAQUE : posée en
     translucide sur le corps sombre, elle virait au gris verdâtre et la
     luciole avait l'air éteinte au moment même où elle s'allume. */
  c.fillStyle = feu > 0.5 ? "#f6ffe0" : "#cfe89a";
  c.globalAlpha = 0.45 + feu * 0.55;
  c.beginPath(); c.ellipse(-3.2, 0.5, 1.5 + feu * 0.5, 1.2 + feu * 0.4, 0, 0, 6.2832); c.fill();
  c.globalAlpha = 1;
}
function dessineLuciole(c, k, tps){
  var ph = k.ph || 0, n = k.n || 0;
  var sur = fauneSursaut(k, tps);
  /* dérive lente en huit : deux sinus de rapport irrationnel, jamais
     de boucle visible */
  var t = tps * 0.34 + ph;
  var x = Math.sin(t) * 11 + Math.sin(t * 0.41 + n) * 5;
  var y = -20 - Math.sin(t * 1.37 + n * 0.8) * 9 - sur * 12;

  /* Le clignotement. p < 0.16 : la bosse ; le reste : la braise. */
  var p = (tps * 0.62 + ph * 0.53 + n * 0.17) % 1;
  var feu = p < 0.16 ? Math.sin(p / 0.16 * 3.1416) : 0;
  feu = 0.18 + feu * 0.82;

  /* Deux passes de halo : une large et molle qui porte de loin, une
     petite et dure qui donne le point brillant. Deux drawImage d'un
     canevas déjà rendu — c'est tout le coût de la luciole. */
  lueurRapide(c, x - 2.6, y + 0.4, 14 + feu * 10, PAL_LUCIOLE.feu, 0.13 + feu * 0.32);

  c.save();
  c.translate(x, y);
  c.rotate(Math.cos(t) * 0.2);
  corpsLuciole(c, feu);
  c.restore();
  /* Le point dur PAR-DESSUS le corps : c'est lui qui fait le grain de
     lumière. Dessiné avant, il passait sous l'abdomen et la luciole
     n'était qu'une tache verte molle. */
  lueurRapide(c, x - 2.9, y + 0.4, 3.8 + feu * 2.4, PAL_LUCIOLE.coeur, 0.26 + feu * 0.62);
}
