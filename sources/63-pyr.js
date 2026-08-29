/* ================================================================
   LE PYR-120 — blindé lourd lance-flammes

   « Un énorme véhicule blindé de très courte portée. Très grosse
   santé, faibles dégâts. Il doit être impressionnant parce qu'il
   refuse de mourir, pas parce qu'il détruit tout. »

   ────────────────────────────────────────────────────────────────
   CE QU'IL EMPRUNTE AU TX-90, ET CE QU'IL N'EMPRUNTE PAS

   Il emprunte les PRIMITIVES de 61-tank.js — la projection `ptT`, les
   faces dégradées, les boîtes, les rivets, les arêtes de lumière.
   Ce sont des outils de dessin isométrique, pas des morceaux de char :
   les réécrire aurait donné deux projections qui divergent au premier
   réglage. Rien du TX-90 n'est modifié ; ce fichier ne fait que lire.

   Il n'emprunte AUCUNE de ses formes. Pas la même caisse, pas les
   mêmes chenilles, pas de tourelle ronde, pas de canon. Un TX-90
   grossi et repeint aurait été le contraire de ce qu'on demande.

   ────────────────────────────────────────────────────────────────
   LA SILHOUETTE

   Là où le TX-90 est un chasseur — bas, fuyant, une tourelle ronde et
   un tube long —, le PYR-120 est un BÉLIER : tout est horizontal et
   surdimensionné. Une caisse qui déborde par-dessus ses chenilles en
   encorbellement, un glacis très incliné qui fait glisser les coups,
   des plaques de blindage rapportées et boulonnées PAR-DESSUS le
   blindage, deux réservoirs de naphte à l'arrière, une tuyauterie de
   cuivre qui les relie à l'arme, et pour toute arme une buse courte
   dans une gueule de protection.

   Les chenilles font trente-neuf de large contre trente et un au
   TX-90, et la caisse déborde encore de quatre au-dessus : vues du
   dessus, ce sont elles qui donnent la masse.

   ────────────────────────────────────────────────────────────────
   LA COULEUR — DE L'ARDOISE, PAS DU KAKI, ET SURTOUT PAS DU ROUGE

   « Choisis une couleur militaire qui fonctionne très bien avec le
   feu et qui permet surtout de bien distinguer le véhicule de ses
   flammes. »

   Le kaki du TX-90 était le bon choix pour un char qui tire des obus ;
   il serait le mauvais ici, parce que l'olive et l'orange sont
   voisines et qu'un véhicule kaki noyé dans ses propres flammes
   deviendrait illisible. On prend donc le CONTRAIRE de la flamme sur
   la roue des couleurs : une ardoise froide, bleutée, presque marine
   dans les ombres. Une flamme orange posée dessus se découpe comme un
   néon sur un mur mouillé.

   Le seul accent chaud est le CUIVRE de la tuyauterie — et il est
   voulu : c'est le circuit du carburant, il doit se lire comme la
   partie brûlante de la machine. Il est assez sombre et assez
   métallique pour ne jamais se confondre avec le feu lui-même.
   ================================================================ */

var C_PYR = {
  /* l'ardoise d'usine, trois valeurs d'une même famille froide */
  coque:"#4d5a67", coqueO:"#36414d", coqueN:"#232b34",
  toit:"#5e6d7b", liseré:"#131920",
  /* les plaques rapportées : plus sombres, plus mates, boulonnées */
  plaque:"#3d4854", plaqueC:"#71818f",
  /* la superstructure, un cran plus clair pour qu'elle se détache */
  casem:"#556472", casemT:"#6d7e8d",
  /* les chenilles et le train de roulement */
  chenille:"#242a30", chenilleC:"#3b444c", maillon:"#12161a",
  roue:"#333c45", roueC:"#5b6772", moyeu:"#8d99a4",
  /* le circuit du naphte : cuivre et laiton, la seule chaleur */
  cuivre:"#9c6130", cuivreC:"#d99a58", laiton:"#b08b3c",
  /* la buse et sa gueule de protection : de l'acier nu, plus clair */
  buse:"#39424b", buseC:"#8b97a2", gueule:"#2b333b",
  /* les grilles moteur et les échappements */
  grille:"#191e24", echap:"#463f38", echapC:"#6d6156",
  /* la veilleuse, minuscule, toujours allumée */
  veilleuse:"255,164,72",
  poussiere:"#8f9aa4"
};

/* La palette d'une épave : tout ce qui était peint devient charbon,
   tout ce qui était cuivre devient rouille. Même patron que le char —
   c'est la seule façon d'avoir une épave qui ressemble encore à son
   véhicule. */
var C_PYR_BRULE = null;
function paletteBruleePyr(){
  if(C_PYR_BRULE) return C_PYR_BRULE;
  var o = {}, k;
  for(k in C_PYR) o[k] = C_PYR[k];
  o.coque = "#2a2724"; o.coqueO = "#201e1c"; o.coqueN = "#141312";
  o.toit = "#332f2b"; o.plaque = "#262421"; o.plaqueC = "#413c36";
  o.casem = "#2e2b28"; o.casemT = "#3a3631";
  o.cuivre = "#5c3a22"; o.cuivreC = "#7a5334"; o.laiton = "#5f4c26";
  o.buse = "#221f1d"; o.buseC = "#4a453f";
  return (C_PYR_BRULE = o);
}

/* ----------------------------------------------------------------
   LES COTES, en pixels d'écran à zoom 1 — le même repère que TK.
   x vers l'avant, y vers sa gauche, z vers le ciel.
   ---------------------------------------------------------------- */
var PY = {
  /* les chenilles : plus longues, BEAUCOUP plus larges, plus hautes */
  chX:31, chYe:19.5, chYi:9.0, chZ:14.5,
  /* la caisse. Elle déborde des chenilles — l'encorbellement est ce
     qui fait qu'on la voit d'abord, elle, et pas le train. */
  coX0:-28, coX1:24, coY:23.5, coZ0:11, coZ1:27,
  /* le glacis : très incliné, il monte de l'avant de caisse au toit */
  glX:31, glZ:27, glY:20,
  /* la casemate : basse, large, décentrée vers l'avant */
  csX0:-13, csX1:13, csY:14.5, csZ0:27, csZ1:39,
  /* les deux réservoirs de naphte, couchés sur le pont arrière */
  reX0:-27, reX1:-13, reY:11.5, reR:6.2, reZ:33,
  /* les grilles moteur, entre les réservoirs */
  grX0:-26, grX1:-15,
  /* les échappements, sur les flancs arrière */
  ecX:-21, ecZ0:27, ecZ1:41, ecR:2.6,
  /* LE LANCE-FLAMMES, dans le repère de la tourelle. Court et gros :
     c'est une buse, pas un tube. */
  buX0:2, buX1:27, buR:4.2, buZ:34,
  /* la gueule de protection qui l'entoure */
  guX0:12, guX1:29, guR:7.4,
  /* le tourillon */
  tuR:9.5, tuZ0:39, tuZ1:47
};

/* ────────────────────────────────────────────────────────────────
   « NETTEMENT PLUS GROS QUE LE TX-90 » — ET C'EST UN NOMBRE

   Les cotes ci-dessus ont été dessinées à la main, et une fois posées
   à l'écran à côté d'un char elles ne donnaient que dix-neuf pour cent
   de longueur en plus : de quoi dire « un peu plus grand », pas « une
   autre catégorie de machine ». On les multiplie donc toutes d'un
   coup plutôt que de les retoucher une par une — c'est la seule façon
   de grossir l'engin sans déformer un seul de ses rapports.

   1,28 porte l'empreinte de 62 × 39 pixels à 79 × 50, contre 52 × 31
   pour le TX-90 : la moitié plus long, les deux tiers plus large. À
   l'écran, ça ne se discute plus.

   Tout ce qui lit PY passe par ici, y compris `bouchePYR` qui place le
   départ du jet : retoucher les cotes à la main aurait laissé la
   flamme partir d'un point qui n'existe plus. */
var PY_ECH = 1.28;
(function(){ for(var k in PY) PY[k] *= PY_ECH; })();

/* ────────────────────────────────────────────────────────────────
   UN TUBE — la pièce que le TX-90 n'avait pas besoin de savoir faire

   Le PYR-120 est fait de cylindres : réservoirs, tuyaux, buse,
   échappements. Un cylindre isométrique correct coûterait cher ; un
   quadrilatère en dégradé transversal en donne l'illusion complète,
   parce que ce qui dit « rond » n'est pas le contour, c'est la
   BANDE CLAIRE qui court le long de la pièce.
   ──────────────────────────────────────────────────────────────── */
function tubePY(c, a, b, r, ca, sa, teinte, clair){
  var pa = ptT(a[0], a[1], a[2], ca, sa), pb = ptT(b[0], b[1], b[2], ca, sa);
  var dx = pb.x - pa.x, dy = pb.y - pa.y;
  var lg = Math.hypot(dx, dy) || 1;
  var nx = -dy / lg, ny = dx / lg;
  var g = c.createLinearGradient(pa.x - nx * r, pa.y - ny * r,
                                 pa.x + nx * r, pa.y + ny * r);
  g.addColorStop(0, ecl(teinte, 0.62));
  g.addColorStop(0.34, clair || ecl(teinte, 1.32));
  g.addColorStop(0.62, teinte);
  g.addColorStop(1, ecl(teinte, 0.52));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(pa.x + nx * r, pa.y + ny * r);
  c.lineTo(pb.x + nx * r, pb.y + ny * r);
  c.lineTo(pb.x - nx * r, pb.y - ny * r);
  c.lineTo(pa.x - nx * r, pa.y - ny * r);
  c.closePath();
  c.fill();
  /* le bout : une ellipse, sinon le tube est un ruban */
  c.fillStyle = ecl(teinte, 1.12);
  c.beginPath();
  c.ellipse(pb.x, pb.y, r, r * 0.62, Math.atan2(dy, dx), 0, 6.2832);
  c.fill();
}

/* Un anneau de renfort autour d'un tube — deux traits suffisent. */
function bagueP(c, p, r, ca, sa, teinte){
  var q = ptT(p[0], p[1], p[2], ca, sa);
  c.strokeStyle = teinte; c.lineWidth = 1.5;
  c.beginPath(); c.ellipse(q.x, q.y, r, r * 0.66, 0, 0, 6.2832); c.stroke();
}

/* ────────────────────────────────────────────────────────────────
   LA CHENILLE DU PYR-120

   Même principe que celle du char — un profil fermé qu'on parcourt en
   bandes, et des maillons qui défilent selon la distance parcourue —
   mais un profil À ELLE : plus long, plus haut, et surtout plat sur
   le dessus au lieu d'être bombé. Un train de roulement d'engin de
   siège ne ressemble pas à celui d'un char rapide.

   SEPT galets, et de gros. Le TX-90 en a six petits ; ici c'est le
   nombre de points d'appui qui dit « ça ne s'enlise pas ».
   ──────────────────────────────────────────────────────────────── */
var PY_PROFIL = null;
function profilChenillePY(){
  if(PY_PROFIL) return PY_PROFIL;
  var X = PY.chX, Z = PY.chZ, p = [], i, a;
  var rB = Z * 0.5;                       // le rayon des extrémités
  /* le dessous, d'arrière en avant */
  p.push([-X + rB, 0]); p.push([X - rB, 0]);
  /* l'arrondi avant */
  for(i = 1; i < 7; i++){ a = -1.5708 + i / 7 * 3.1416; p.push([X - rB + Math.cos(a) * rB, rB + Math.sin(a) * rB]); }
  /* le dessus, plat, légèrement rentrant à l'avant */
  p.push([X - rB, Z]); p.push([-X + rB, Z]);
  /* l'arrondi arrière */
  for(i = 1; i < 7; i++){ a = 1.5708 + i / 7 * 3.1416; p.push([-X + rB + Math.cos(a) * rB, rB + Math.sin(a) * rB]); }
  return (PY_PROFIL = { p:p, per:(X - rB) * 4 + 6.2832 * rB });
}

function chenillePY(c, cote, ca, sa, defil, C, detail){
  var PR = profilChenillePY();
  var Ye = PY.chYe * cote, Yi = PY.chYi * cote;
  var i, k;
  var dehors = versNousT(-sa * cote, ca * cote);
  var yF = dehors ? Ye : Yi;

  /* la surface de roulement, bande par bande */
  var n = PR.p.length;
  for(i = 0; i < n; i++){
    var a = PR.p[i], b = PR.p[(i + 1) % n];
    var dx = b[0] - a[0], dz = b[1] - a[1];
    var lg = Math.hypot(dx, dz) || 1;
    var nx = dz / lg, nz = -dx / lg;
    if(!versNous3T(nx, 0, nz, ca, sa)) continue;
    var wx = nx * ca, wy = nx * sa;
    var lum = 0.42 + 0.58 * Math.max(0, (-(wx + wy) * 0.42 + nz * 0.92));
    faceT(c, [[a[0], Yi, a[1]], [b[0], Yi, b[1]], [b[0], Ye, b[1]], [a[0], Ye, a[1]]],
          ca, sa, ecl(C.chenille, 0.70 + lum * 0.88), null);
  }

  /* LE FLANC, et les galets dessus. C'est la face qu'on voit le plus
     et celle qui porte tout le détail du train. */
  var flanc = [];
  for(i = 0; i < n; i++) flanc.push([PR.p[i][0], yF, PR.p[i][1]]);
  faceT(c, flanc, ca, sa, ecl(C.chenilleC, dehors ? 1.0 : 0.78), C.liseré);

  if(detail){
    /* sept galets, deux barbotins plus gros aux extrémités */
    for(k = 0; k < 7; k++){
      var gx = -PY.chX + 7.4 + k * (2 * (PY.chX - 7.4) / 6);
      var gr = 4.6;
      var pg = ptT(gx, yF, PY.chZ * 0.38, ca, sa);
      c.fillStyle = ecl(C.roue, dehors ? 1 : 0.8);
      c.beginPath(); c.ellipse(pg.x, pg.y, gr, gr * 0.94, 0, 0, 6.2832); c.fill();
      c.strokeStyle = C.roueC; c.lineWidth = 0.9;
      c.beginPath(); c.ellipse(pg.x, pg.y, gr, gr * 0.94, 0, 0, 6.2832); c.stroke();
      /* le moyeu tourne : c'est lui qui dit que ça roule */
      var am = defil / 5.2 + k * 0.7;
      c.strokeStyle = C.moyeu; c.lineWidth = 1.1;
      for(var b2 = 0; b2 < 3; b2++){
        var ab2 = am + b2 * 1.047;
        c.beginPath();
        c.moveTo(pg.x - Math.cos(ab2) * gr * 0.62, pg.y - Math.sin(ab2) * gr * 0.58);
        c.lineTo(pg.x + Math.cos(ab2) * gr * 0.62, pg.y + Math.sin(ab2) * gr * 0.58);
        c.stroke();
      }
      c.fillStyle = C.moyeu;
      c.beginPath(); c.arc(pg.x, pg.y, 1.35, 0, 6.2832); c.fill();
    }
    /* LES MAILLONS. Ils défilent le long du profil : c'est la distance
       parcourue qui les déplace, jamais l'horloge — une chenille qui
       tourne à l'arrêt est le défaut qu'on voit tout de suite. */
    var PAS = 5.2;
    var nm = Math.floor(PR.per / PAS);
    var dep = (defil % PAS) / PR.per;
    c.strokeStyle = C.maillon; c.lineWidth = 1.25;
    c.beginPath();
    for(k = 0; k < nm; k++){
      var f = (k / nm + dep) % 1;
      var q = pointProfilPY(PR, f);
      var q2 = pointProfilPY(PR, (f + 0.004) % 1);
      var e1 = ptT(q[0], Yi, q[1], ca, sa), e2 = ptT(q2[0], Ye, q2[1], ca, sa);
      c.moveTo(e1.x, e1.y); c.lineTo(e2.x, e2.y);
    }
    c.stroke();
  }

  /* le garde-boue : une tôle posée sur toute la longueur, elle achève
     de faire tenir la chenille sous la caisse */
  faceT(c, [[-PY.chX - 1, Yi, PY.chZ + 1.6], [PY.chX + 1, Yi, PY.chZ + 1.6],
            [PY.chX + 1, Ye + 1.2, PY.chZ + 1.6], [-PY.chX - 1, Ye + 1.2, PY.chZ + 1.6]],
        ca, sa, ecl(C.plaque, 1.06), C.liseré);
}

/* Un point du profil à l'abscisse curviligne f (0 → 1). */
function pointProfilPY(PR, f){
  var d = f * PR.per, i, n = PR.p.length;
  for(i = 0; i < n; i++){
    var a = PR.p[i], b = PR.p[(i + 1) % n];
    var lg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if(d <= lg){ var u = lg ? d / lg : 0; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; }
    d -= lg;
  }
  return PR.p[0];
}

/* ────────────────────────────────────────────────────────────────
   LA CAISSE, LE GLACIS, LES PLAQUES

   Trois choses font le « lourd » : l'encorbellement de la caisse
   par-dessus les chenilles, l'inclinaison du glacis, et les plaques
   RAPPORTÉES — des tôles boulonnées par-dessus le blindage, qui
   dessinent des ombres franches et disent qu'on a rajouté de l'acier
   sur un engin qui en avait déjà.
   ──────────────────────────────────────────────────────────────── */
function caissePY(c, ca, sa, C, detail){
  var L = C.liseré;
  var devantG = versNousT(-sa, ca);
  var teintes = {
    avant:ecl(C.coque, 1.16), arriere:C.coqueO,
    flanc:devantG ? ecl(C.coque, 1.04) : ecl(C.coque, 0.86),
    toit:C.toit, liseré:L
  };
  boiteT(c, PY.coX0, PY.coX1, -PY.coY, PY.coY, PY.coZ0, PY.coZ1, ca, sa, teintes);

  /* LE GLACIS : une seule face, très inclinée, de l'avant de caisse
     jusqu'au toit. C'est la pièce qui donne le profil de bélier. */
  faceT(c, [[PY.coX1, -PY.coY, PY.coZ0], [PY.glX, -PY.glY, PY.coZ0 + 2],
            [PY.glX, PY.glY, PY.coZ0 + 2], [PY.coX1, PY.coY, PY.coZ0]],
        ca, sa, ecl(C.coque, 1.24), L);
  faceT(c, [[PY.glX, -PY.glY, PY.coZ0 + 2], [PY.coX1 - 2, -PY.glY + 2, PY.glZ],
            [PY.coX1 - 2, PY.glY - 2, PY.glZ], [PY.glX, PY.glY, PY.coZ0 + 2]],
        ca, sa, ecl(C.coque, 1.34), L);

  if(!detail) return;

  /* LE GLACIS N'EST PAS UNE DALLE. C'est la plus grande surface du
     véhicule et celle qu'on voit en premier quand il arrive sur soi :
     laissée nue, elle aplatissait tout l'avant. Quatre pièces y
     tiennent — le volet du conducteur, deux crochets de remorquage et
     une plaque de choc boulonnée — et elles suffisent à donner
     l'échelle de la machine. */
  var yv = 5.5;
  /* le volet blindé du conducteur, avec sa fente de vision */
  faceT(c, [[PY.glX - 2, -yv, PY.coZ0 + 4.5], [PY.coX1 - 4, -yv, PY.glZ - 3],
            [PY.coX1 - 4, yv, PY.glZ - 3], [PY.glX - 2, yv, PY.coZ0 + 4.5]],
        ca, sa, ecl(C.plaque, 1.16), C.liseré);
  var f1 = ptT(PY.glX - 4.5, -3.6, PY.coZ0 + 7.5, ca, sa);
  var f2 = ptT(PY.glX - 4.5, 3.6, PY.coZ0 + 7.5, ca, sa);
  c.strokeStyle = "rgba(8,10,12,.85)"; c.lineWidth = 2.0;
  c.beginPath(); c.moveTo(f1.x, f1.y); c.lineTo(f2.x, f2.y); c.stroke();
  /* les deux crochets de remorquage, en bas du glacis */
  for(var h = 0; h < 2; h++){
    var yh = (h ? 1 : -1) * 14;
    var ph = ptT(PY.glX - 1, yh, PY.coZ0 + 2.5, ca, sa);
    c.strokeStyle = ecl(C.buseC, 0.8); c.lineWidth = 2.2;
    c.beginPath(); c.arc(ph.x, ph.y, 2.6, 0.5, 4.2); c.stroke();
  }
  /* la plaque de choc, boulonnée en travers */
  faceT(c, [[PY.glX - 0.5, -PY.glY + 2, PY.coZ0 + 1], [PY.glX - 0.5, PY.glY - 2, PY.coZ0 + 1],
            [PY.coX1 + 1, PY.glY - 2, PY.coZ0 + 4], [PY.coX1 + 1, -PY.glY + 2, PY.coZ0 + 4]],
        ca, sa, C.plaque, C.liseré);
  rivetsT(c, [PY.glX - 0.5, -PY.glY + 4, PY.coZ0 + 1.4],
             [PY.glX - 0.5, PY.glY - 4, PY.coZ0 + 1.4], 6, ca, sa, C);

  /* LES PLAQUES RAPPORTÉES sur les flancs — trois par côté, boulonnées.
     On ne dessine que le flanc visible : l'autre ne se voit pas et
     coûterait le même prix. */
  var yP = devantG ? PY.coY + 0.6 : -PY.coY - 0.6;
  for(var k = 0; k < 3; k++){
    var x0 = PY.coX0 + 4 + k * 16, x1 = x0 + 13;
    faceT(c, [[x0, yP, PY.coZ0 + 2], [x1, yP, PY.coZ0 + 2],
              [x1, yP, PY.coZ1 - 2], [x0, yP, PY.coZ1 - 2]],
          ca, sa, k === 1 ? ecl(C.plaque, 1.1) : C.plaque, L);
    rivetsT(c, [x0 + 1, yP, PY.coZ0 + 3], [x1 - 1, yP, PY.coZ0 + 3], 4, ca, sa, C);
    rivetsT(c, [x0 + 1, yP, PY.coZ1 - 3], [x1 - 1, yP, PY.coZ1 - 3], 4, ca, sa, C);
  }
  /* et deux traits de tôle sur le toit, pour qu'il ne soit pas un aplat */
  toleT(c, [PY.coX0 + 6, -PY.coY, PY.coZ1], [PY.coX0 + 6, PY.coY, PY.coZ1], ca, sa);
  toleT(c, [PY.coX1 - 8, -PY.coY, PY.coZ1], [PY.coX1 - 8, PY.coY, PY.coZ1], ca, sa);

  /* LES GRILLES MOTEUR sur le pont arrière : des lames sombres, très
     rapprochées. C'est de là que sort la fumée quand il est blessé. */
  faceT(c, [[PY.grX0, -8, PY.coZ1 + 0.3], [PY.grX1, -8, PY.coZ1 + 0.3],
            [PY.grX1, 8, PY.coZ1 + 0.3], [PY.grX0, 8, PY.coZ1 + 0.3]],
        ca, sa, C.grille, L);
  c.strokeStyle = "rgba(150,166,180,.30)"; c.lineWidth = 0.8;
  c.beginPath();
  for(var g = 0; g < 7; g++){
    var xg = PY.grX0 + 1 + g * ((PY.grX1 - PY.grX0 - 2) / 6);
    var a1 = ptT(xg, -7.2, PY.coZ1 + 0.4, ca, sa), a2 = ptT(xg, 7.2, PY.coZ1 + 0.4, ca, sa);
    c.moveTo(a1.x, a1.y); c.lineTo(a2.x, a2.y);
  }
  c.stroke();

  /* LES DEUX ÉCHAPPEMENTS, debout sur les flancs arrière, avec leur
     collier et leur chapeau. Ils montent au-dessus du toit : c'est ce
     qui casse la ligne horizontale et empêche la silhouette d'être un
     pain de savon. */
  for(var e = 0; e < 2; e++){
    var ye = (e ? 1 : -1) * (PY.coY - 3.5);
    tubePY(c, [PY.ecX, ye, PY.ecZ0], [PY.ecX, ye, PY.ecZ1], PY.ecR, ca, sa, C.echap, ecl(C.echapC, 1.15));
    bagueP(c, [PY.ecX, ye, PY.ecZ0 + 5], PY.ecR + 0.7, ca, sa, "rgba(20,24,28,.55)");
    /* la suie au débouché */
    var pe = ptT(PY.ecX, ye, PY.ecZ1, ca, sa);
    c.fillStyle = "rgba(14,14,14,.62)";
    c.beginPath(); c.ellipse(pe.x, pe.y, PY.ecR * 0.72, PY.ecR * 0.46, 0, 0, 6.2832); c.fill();
  }
}

/* ────────────────────────────────────────────────────────────────
   LES RÉSERVOIRS ET LEUR TUYAUTERIE

   Deux fûts de naphte couchés sur le pont arrière, cerclés, avec un
   bouchon et un manomètre. De chacun part un tuyau de cuivre qui
   court vers l'avant et monte à la casemate : c'est ce trajet visible
   du carburant qui explique l'arme sans un mot.
   ──────────────────────────────────────────────────────────────── */
function reservoirsPY(c, ca, sa, C, detail){
  for(var k = 0; k < 2; k++){
    var y = (k ? 1 : -1) * PY.reY;
    tubePY(c, [PY.reX0, y, PY.reZ], [PY.reX1, y, PY.reZ], PY.reR, ca, sa,
           ecl(C.plaque, 1.14), ecl(C.plaqueC, 1.05));
    if(!detail) continue;
    /* les cercles de renfort */
    for(var b = 0; b < 3; b++){
      var xb = PY.reX0 + 3 + b * ((PY.reX1 - PY.reX0 - 6) / 2);
      bagueP(c, [xb, y, PY.reZ], PY.reR + 0.5, ca, sa, "rgba(18,24,30,.50)");
    }
    /* le bouchon de remplissage, sur le dessus */
    var pb = ptT(PY.reX0 + 3.5, y, PY.reZ + PY.reR * 0.8, ca, sa);
    c.fillStyle = C.laiton;
    c.beginPath(); c.ellipse(pb.x, pb.y, 2.1, 1.35, 0, 0, 6.2832); c.fill();
    c.strokeStyle = "rgba(20,16,8,.5)"; c.lineWidth = 0.7; c.stroke();
  }
  if(!detail) return;
  /* LA TUYAUTERIE COURT SUR LE PONT, ELLE NE VOLE PAS.

     Premier tracé : deux segments qui montaient du fût vers le haut de
     la casemate. Ils passaient dans l'air, par-dessus tout, et se
     lisaient comme deux baguettes orange posées sur le toit — pas
     comme un circuit. Un tuyau de carburant est plaqué contre la
     tôle, il suit les angles du véhicule, et il est MINCE : c'est sa
     finesse qui le distingue d'un canon.

     Il longe donc le pont au ras du toit, du fût jusqu'au collecteur,
     avec un coude au passage. Et il passe SOUS la casemate, qui est
     dessinée après lui — donc il disparaît derrière elle, comme un
     vrai tuyau qui rentre dans la caisse. */
  for(var t = 0; t < 2; t++){
    var yt = (t ? 1 : -1) * PY.reY;
    var zP = PY.coZ1 + 1.4;                 // au ras du pont
    tubePY(c, [PY.reX1 - 1, yt, PY.reZ - PY.reR * 0.6], [PY.reX1 + 2, yt, zP],
           1.05, ca, sa, C.cuivre, C.cuivreC);
    tubePY(c, [PY.reX1 + 2, yt, zP], [PY.csX0 + 3, yt * 0.42, zP],
           1.05, ca, sa, C.cuivre, C.cuivreC);
    /* deux colliers qui le tiennent au pont */
    bagueP(c, [PY.reX1 + 4, yt * 0.86, zP], 1.7, ca, sa, "rgba(24,30,36,.55)");
    bagueP(c, [PY.csX0 - 1, yt * 0.55, zP], 1.7, ca, sa, "rgba(24,30,36,.55)");
  }
  /* le collecteur, une boîte de laiton posée au milieu du pont */
  boiteT(c, PY.csX0 - 4, PY.csX0 + 1, -4, 4, PY.coZ1, PY.coZ1 + 4.5, ca, sa,
         { avant:C.laiton, arriere:ecl(C.laiton, 0.7), flanc:ecl(C.laiton, 0.86),
           toit:ecl(C.laiton, 1.2), liseré:C.liseré });
}

/* ────────────────────────────────────────────────────────────────
   LA CASEMATE ET LE LANCE-FLAMMES

   Pas de tourelle ronde — une casemate rectangulaire à pans coupés,
   et sur elle un tourillon qui porte l'arme. La buse est COURTE et
   GROSSE, enfermée dans une gueule de protection ouverte vers
   l'avant : on protège un lance-flammes parce qu'il faut s'approcher
   pour s'en servir, et cette protection-là dit toute la doctrine du
   véhicule.

   La veilleuse — une flamme pilote grosse comme un pixel — brûle en
   permanence au bord de la buse, même quand l'arme ne tire pas. C'est
   le détail qui fait qu'on comprend ce qu'on regarde avant même le
   premier jet.
   ──────────────────────────────────────────────────────────────── */
function casematePY(c, ca, sa, C, detail){
  var L = C.liseré;
  var devantG = versNousT(-sa, ca);
  boiteT(c, PY.csX0, PY.csX1, -PY.csY, PY.csY, PY.csZ0, PY.csZ1, ca, sa,
         { avant:ecl(C.casem, 1.18), arriere:ecl(C.casem, 0.82),
           flanc:devantG ? ecl(C.casem, 1.05) : ecl(C.casem, 0.88),
           toit:C.casemT, liseré:L });
  if(!detail) return;
  /* le pan coupé avant : une joue inclinée de chaque côté */
  faceT(c, [[PY.csX1, -PY.csY, PY.csZ0], [PY.csX1 + 5, -PY.csY + 5, PY.csZ0 + 2],
            [PY.csX1 + 5, -PY.csY + 5, PY.csZ1 - 2], [PY.csX1, -PY.csY, PY.csZ1]],
        ca, sa, ecl(C.casem, 1.26), L);
  faceT(c, [[PY.csX1, PY.csY, PY.csZ0], [PY.csX1 + 5, PY.csY - 5, PY.csZ0 + 2],
            [PY.csX1 + 5, PY.csY - 5, PY.csZ1 - 2], [PY.csX1, PY.csY, PY.csZ1]],
        ca, sa, ecl(C.casem, 1.10), L);
  /* le périscope du chef et une trappe */
  var pp = ptT(PY.csX0 + 5, devantG ? 6 : -6, PY.csZ1, ca, sa);
  c.fillStyle = C.buseC;
  c.beginPath(); c.ellipse(pp.x, pp.y - 2.2, 2.0, 1.3, 0, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(120,190,210,.55)";
  c.beginPath(); c.ellipse(pp.x, pp.y - 3.0, 1.2, 0.7, 0, 0, 6.2832); c.fill();
  rivetsT(c, [PY.csX0 + 2, -PY.csY, PY.csZ1 - 1.5], [PY.csX1 - 2, -PY.csY, PY.csZ1 - 1.5], 6, ca, sa, C);
}

function lanceFlammePY(c, at, C, detail, feu, tps){
  var cat = Math.cos(at), sat = Math.sin(at);
  var L = C.liseré;
  /* LE TOURILLON : un cylindre bas, avec sa couronne de boulons. */
  var pt0 = ptT(0, 0, PY.tuZ0, cat, sat);
  c.fillStyle = ecl(C.casem, 1.1);
  c.beginPath(); c.ellipse(pt0.x, pt0.y - (PY.tuZ1 - PY.tuZ0), PY.tuR, PY.tuR * 0.56, 0, 0, 6.2832); c.fill();
  c.strokeStyle = L; c.lineWidth = 1; c.stroke();
  faceT(c, [[-PY.tuR, -PY.tuR * 0.8, PY.tuZ0], [PY.tuR, -PY.tuR * 0.8, PY.tuZ0],
            [PY.tuR, PY.tuR * 0.8, PY.tuZ0], [-PY.tuR, PY.tuR * 0.8, PY.tuZ0]],
        cat, sat, ecl(C.casem, 0.9), null);

  /* LE BLOC D'ARME : une masse trapue, décalée vers l'avant. */
  boiteT(c, -6, 12, -7.5, 7.5, PY.tuZ1 - 9, PY.tuZ1 + 1, cat, sat,
         { avant:ecl(C.buse, 1.3), arriere:ecl(C.buse, 0.82),
           flanc:ecl(C.buse, 1.05), toit:ecl(C.buseC, 0.72), liseré:L });

  /* LES DEUX FLEXIBLES, du bloc d'arme à la culasse de la buse. Fins
     et sombres : ce sont des tuyaux, pas des tubes d'arme. Ils
     restent PLAQUÉS contre le bloc au lieu de traverser l'air. */
  if(detail){
    /* DU CUIVRE ASSOMBRI, ET COURT. En pleine teinte ils faisaient
       deux bâtons orange en travers du toit — la seule chose qu'on
       voyait du véhicule, et la seule qui n'ait aucune importance.
       Un flexible sous une casemate est dans l'ombre : on le descend
       d'un tiers, et on le raccourcit pour qu'il longe le bloc au
       lieu de le traverser. */
    var som = ecl(C.cuivre, 0.62), somC = ecl(C.cuivreC, 0.70);
    tubePY(c, [-3, 6.4, PY.tuZ1 - 8.5], [PY.buX0, 5.0, PY.buZ + 1.6], 0.85, cat, sat, som, somC);
    tubePY(c, [-3, -6.4, PY.tuZ1 - 8.5], [PY.buX0, -5.0, PY.buZ + 1.6], 0.85, cat, sat, som, somC);
  }

  /* LA BUSE. Elle est la RAISON D'ÊTRE du véhicule, donc elle doit se
     lire avant tout le reste : grosse, claire, et elle S'ÉVASE au
     bout. Le premier dessin en faisait un tube gris de la couleur de
     la caisse, perdu au milieu d'une machine grise — on ne voyait pas
     l'arme, et un lance-flammes qu'on ne reconnaît pas ne sert à
     rien. Trois choses la sortent maintenant du fond : l'acier nu,
     plus clair que la peinture ; le pavillon évasé ; et la culasse
     noire qui la sépare du bloc. */
  faceT(c, [[PY.buX0 - 2, -5.5, PY.buZ - 5], [PY.buX0 + 3, -5.5, PY.buZ - 5],
            [PY.buX0 + 3, 5.5, PY.buZ - 5], [PY.buX0 - 2, 5.5, PY.buZ - 5]],
        cat, sat, C.gueule, null);
  tubePY(c, [PY.buX0, 0, PY.buZ], [PY.buX1, 0, PY.buZ], PY.buR,
         cat, sat, ecl(C.buse, 1.5), ecl(C.buseC, 1.18));
  /* le pavillon : un second tube plus court et plus gros au bout */
  tubePY(c, [PY.buX1 - 5.5, 0, PY.buZ], [PY.buX1 + 1.5, 0, PY.buZ], PY.buR * 1.52,
         cat, sat, ecl(C.buse, 1.25), ecl(C.buseC, 1.05));
  if(detail){
    bagueP(c, [PY.buX0 + 6, 0, PY.buZ], PY.buR + 1.1, cat, sat, "rgba(12,16,20,.55)");
    bagueP(c, [PY.buX1 - 6, 0, PY.buZ], PY.buR + 1.4, cat, sat, "rgba(12,16,20,.60)");
    /* la gorge du pavillon, noire : c'est elle qui creuse le bout */
    var pgo = ptT(PY.buX1 + 1.5, 0, PY.buZ, cat, sat);
    c.fillStyle = "rgba(10,12,14,.72)";
    c.beginPath();
    c.ellipse(pgo.x, pgo.y, PY.buR * 1.05, PY.buR * 0.66, 0, 0, 6.2832);
    c.fill();
  }

  /* LA GUEULE DE PROTECTION : trois arceaux d'acier autour de la buse,
     ouverts vers l'avant. On protège un lance-flammes parce qu'il faut
     s'approcher pour s'en servir — cette cage dit toute la doctrine du
     véhicule, et elle doit donc se voir. Trait épais, sombre en bas,
     clair sur le dessus : un anneau d'un seul gris est un cerceau. */
  if(detail){
    for(var k = 0; k < 3; k++){
      var xg = PY.guX0 + k * ((PY.guX1 - PY.guX0) / 2);
      var pg = ptT(xg, 0, PY.buZ, cat, sat);
      var rg = PY.guR * (1 - k * 0.06);
      c.strokeStyle = "rgba(14,18,22,.85)"; c.lineWidth = 2.6;
      c.beginPath(); c.ellipse(pg.x, pg.y, rg, rg * 0.62, 0, 0, 6.2832); c.stroke();
      c.strokeStyle = ecl(C.buseC, 1.1); c.lineWidth = 1.2;
      c.beginPath(); c.ellipse(pg.x, pg.y - 0.8, rg, rg * 0.62, 0, 3.6, 6.0); c.stroke();
    }
    /* les deux longerons qui tiennent les arceaux */
    for(var s = 0; s < 2; s++){
      var ys = (s ? 1 : -1) * PY.guR * 0.84;
      tubePY(c, [PY.guX0 - 1.5, ys, PY.buZ], [PY.guX1 + 0.5, ys, PY.buZ], 1.25, cat, sat,
             C.gueule, ecl(C.buseC, 0.95));
    }
  }

  /* LA VEILLEUSE. Elle brûle toujours — c'est elle qui dit, à l'arrêt,
     que cet engin est un lance-flammes. */
  var pv = ptT(PY.buX1 - 1, 3.0, PY.buZ + 2.4, cat, sat);
  var vac = 0.55 + 0.45 * Math.sin(tps * 11 + 1.3);
  c.save();
  c.globalCompositeOperation = "lighter";
  var gv = c.createRadialGradient(pv.x, pv.y, 0, pv.x, pv.y, 4.5 + vac);
  gv.addColorStop(0, "rgba(255,246,214,.95)");
  gv.addColorStop(0.35, "rgba(" + C.veilleuse + ",.72)");
  gv.addColorStop(1, "rgba(" + C.veilleuse + ",0)");
  c.fillStyle = gv;
  c.beginPath(); c.arc(pv.x, pv.y, 4.5 + vac, 0, 6.2832); c.fill();
  c.restore();

  /* LA BOUCHE QUAND ÇA TIRE : la buse rougit de l'intérieur. */
  if(feu > 0.02){
    var pb = ptT(PY.buX1, 0, PY.buZ, cat, sat);
    c.save();
    c.globalCompositeOperation = "lighter";
    var gb = c.createRadialGradient(pb.x, pb.y, 0, pb.x, pb.y, 14 * feu);
    gb.addColorStop(0, "rgba(255,252,232," + (0.9 * feu) + ")");
    gb.addColorStop(0.4, "rgba(255,176,70," + (0.6 * feu) + ")");
    gb.addColorStop(1, "rgba(255,110,30,0)");
    c.fillStyle = gb;
    c.beginPath(); c.arc(pb.x, pb.y, 14 * feu, 0, 6.2832); c.fill();
    c.restore();
  }
}

/* ────────────────────────────────────────────────────────────────
   L'ASSEMBLAGE
   ──────────────────────────────────────────────────────────────── */
function charPYR(c, ab, at, defil, abime, brule, detail, feu, tps){
  var C = brule ? paletteBruleePyr() : C_PYR;
  var ca = Math.cos(ab), sa = Math.sin(ab);
  if(detail === undefined) detail = 1;
  if(!tps) tps = 0;

  /* L'OMBRE : l'empreinte des chenilles, et elle est large. */
  c.fillStyle = "rgba(0,0,0,.26)";
  c.beginPath();
  var emp = [[-PY.chX, -PY.chYe], [PY.chX, -PY.chYe], [PY.chX, PY.chYe], [-PY.chX, PY.chYe]];
  for(var q = 0; q < 4; q++){
    var pe = ptT(emp[q][0], emp[q][1], 0, ca, sa);
    if(q === 0) c.moveTo(pe.x + 2.4, pe.y + 1.4); else c.lineTo(pe.x + 2.4, pe.y + 1.4);
  }
  c.closePath(); c.fill();

  /* la chenille du fond, la caisse, celle de devant : le seul ordre
     qui compte, et il se lit au signe de (−sa, ca). */
  var gaucheDevant = versNousT(-sa, ca);
  chenillePY(c, gaucheDevant ? -1 : 1, ca, sa, defil, C, detail);
  caissePY(c, ca, sa, C, detail);
  reservoirsPY(c, ca, sa, C, detail);
  casematePY(c, ca, sa, C, detail);
  chenillePY(c, gaucheDevant ? 1 : -1, ca, sa, defil, C, detail);
  lanceFlammePY(c, at, C, detail, feu || 0, tps);

  /* LES BLESSURES. Des impacts noircis qui apparaissent à mesure : le
     PYR-120 encaisse tellement qu'il faut VOIR qu'il encaisse, sinon
     sa grosse santé ne se lit nulle part. */
  if(abime > 0.12 && detail){
    var r = prng(0x9e77);
    var n = Math.floor(abime * 11);
    c.fillStyle = "rgba(16,18,20,.5)";
    for(var i = 0; i < n; i++){
      var ix = -PY.chX + r() * PY.chX * 2;
      var iy = (r() < 0.5 ? -1 : 1) * PY.coY;
      var iz = PY.coZ0 + r() * (PY.csZ1 - PY.coZ0);
      var pi = ptT(ix, iy, iz, ca, sa);
      c.beginPath(); c.ellipse(pi.x, pi.y, 1.6 + r() * 2.2, 1.2 + r() * 1.6, 0, 0, 6.2832);
      c.fill();
    }
  }
}

/* ================================================================
   LE JET DE FLAMMES

   « Vrai volume, mouvement naturel, cœur très lumineux, particules,
   fumée légère, chaleur, petites étincelles, lumière dynamique. »

   AUCUNE LISTE DE PARTICULES. Tout est une fonction du temps, de la
   position dans le jet et du numéro de l'unité — la même discipline
   que le reste du jeu, et la seule qui tienne quand huit PYR-120
   tirent en même temps sur une tablette. Un système de particules
   aurait donné le même rendu et huit fois le coût.

   UN SEUL DÉGRADÉ PAR JET, et c'est ce qui rend la chose gratuite :
   un dégradé de canevas vit dans le repère courant, donc un dégradé
   fabriqué une fois pour un disque de rayon 1 sert aux quatorze
   bouffées, chacune sous son propre translate/scale. Quatorze
   `createRadialGradient` par jet et par image, c'était le poste le
   plus cher de tout le véhicule.
   ================================================================ */
var PYR_N_BOUF = 14;     // les bouffées qui composent le corps du jet
var PYR_N_ETIN = 7;      // les étincelles
var PYR_N_FUM = 4;       // les bouffées de fumée

/* Le disque unité, teinté une fois par couche. */
function disquePY(c, a0, a1, a2){
  var g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, a0);
  g.addColorStop(0.42, a1);
  g.addColorStop(1, a2);
  return g;
}
function poseDisquePY(c, g, x, y, r, ap){
  c.save();
  c.globalAlpha = ap;
  c.translate(x, y); c.scale(r, r);
  c.fillStyle = g;
  c.beginPath(); c.arc(0, 0, 1, 0, 6.2832); c.fill();
  c.restore();
}

/* Le bout de la buse, en coordonnées de CASE, pour une unité donnée. */
function bouchePYR(u){
  var at = u.angTour || 0;
  /* PY.buX1 pixels vers l'avant de la tourelle, ramenés en cases :
     vingt-six pixels par case, comme partout dans ce fichier. */
  var d = PY.buX1 / 26;
  return { gx:u.gx + Math.cos(at) * d, gy:u.gy + Math.sin(at) * d,
           z:PY.buZ };
}

function dessineJetPYR(c, u, tps){
  var feu = u.flamme || 0;
  if(feu <= 0.02) return;
  var f = UNI[u.t];
  var z = cam.z;
  if(z < 0.06) return;

  /* D'OÙ, ET VERS OÙ. La bouche suit la tourelle ; la cible est celle
     que l'unité a vraiment choisie — sinon le jet part tout droit
     pendant que l'arme, elle, s'est déjà tournée. */
  var b = bouchePYR(u);
  var A = versEcran(cam, b.gx, b.gy);
  A.y -= b.z * z;                        // la buse est en hauteur
  var cib = u.cible ? u.cible.o : null;
  var at = u.angTour || 0;
  var portee = (f.arret + 1.2);
  var tx, ty;
  if(cib){ tx = cib.gx; ty = cib.gy; }
  else { tx = u.gx + Math.cos(at) * portee; ty = u.gy + Math.sin(at) * portee; }
  var B = versEcran(cam, tx, ty);
  B.y -= 8 * z;                          // on vise le corps, pas les pieds

  var dx = B.x - A.x, dy = B.y - A.y;
  var lg = Math.hypot(dx, dy) || 1;
  /* LE JET DÉPASSE SA CIBLE. Une flamme qui s'arrête pile au contact
     a l'air d'être aspirée ; celle-ci lèche le bâtiment et remonte. */
  var por = lg * 1.14;
  var ux = dx / lg, uy = dy / lg;
  var nx = -uy, ny = ux;

  c.save();
  c.globalCompositeOperation = "lighter";

  /* ── 1. LA LUMIÈRE AU SOL. Elle vient AVANT le feu : c'est elle qui
     fait que le sol, le véhicule et la cible sont éclairés par la
     flamme au lieu d'être posés derrière. ── */
  var gS = disquePY(c, "rgba(255,190,110,.30)", "rgba(255,130,44,.16)", "rgba(255,90,20,0)");
  poseDisquePY(c, gS, A.x + ux * por * 0.45, A.y + uy * por * 0.45 + 6 * z,
               por * 0.72, feu * (0.72 + 0.28 * Math.sin(tps * 13 + u.n)));

  /* ── 2. LA FUMÉE, derrière tout le reste et montante ── */
  for(var s = 0; s < PYR_N_FUM; s++){
    var ph = ((tps * 0.55 + s / PYR_N_FUM + u.n * 0.17) % 1);
    var ds = 0.35 + ph * 0.8;
    if(ds > 1.25) continue;
    var wob = Math.sin(tps * 2.2 + s * 2.1 + u.n) * 7 * z * ds;
    poseDisquePY(c,
      disquePY(c, "rgba(120,110,104,.13)", "rgba(86,80,76,.08)", "rgba(60,56,54,0)"),
      A.x + ux * por * ds + nx * wob, A.y + uy * por * ds + ny * wob - ph * 26 * z,
      (7 + ph * 22) * z, feu * (1 - ph) * 0.9);
  }

  /* ── 3. LE CORPS DU JET ──
     Quatorze bouffées le long de l'axe. Trois choses les animent, et
     c'est leur combinaison qui donne le « mouvement naturel » :
       — elles GROSSISSENT avec la distance : un jet s'ouvre en cône ;
       — elles ONDULENT, de plus en plus loin de l'axe ;
       — elles DÉFILENT, chacune parcourant le jet en boucle, si bien
         que la matière semble sortir de la buse en continu.
     Et elles refroidissent : blanc à la buse, rouge sombre au bout. */
  var gChaud = disquePY(c, "rgba(255,250,226,.95)", "rgba(255,196,88,.55)", "rgba(255,120,30,0)");
  var gTiede = disquePY(c, "rgba(255,206,120,.80)", "rgba(255,132,40,.46)", "rgba(214,58,12,0)");
  var gFroid = disquePY(c, "rgba(255,150,66,.55)", "rgba(216,66,18,.30)", "rgba(140,28,8,0)");
  for(var i = 0; i < PYR_N_BOUF; i++){
    /* le défilement : chaque bouffée refait le trajet en boucle */
    var t0 = ((tps * 2.3 + i / PYR_N_BOUF + u.n * 0.11) % 1);
    /* la montée en puissance ronge le bout du jet : à l'allumage la
       flamme est courte, elle s'allonge ensuite */
    if(t0 > feu * 1.08) continue;
    var d0 = t0 * por;
    /* l'ondulation, nulle à la buse, franche au bout */
    var amp = t0 * t0 * 13 * z;
    var w = Math.sin(tps * 7.5 + i * 1.31 + u.n * 0.9) * amp
          + Math.sin(tps * 12.1 + i * 2.7) * amp * 0.35;
    /* LE JET EST COURT — la portée l'impose — DONC IL DOIT ÊTRE
       ÉPAIS. Un cône fin sur cinquante pixels se lit comme une bavure
       orange ; le même volume ramassé en bouffées larges se lit comme
       un torrent. C'est l'épaisseur qui porte ici, pas la longueur. */
    var r = (4.4 + t0 * 23) * z;
    var g = t0 < 0.26 ? gChaud : (t0 < 0.62 ? gTiede : gFroid);
    var ap = feu * (t0 < 0.08 ? t0 / 0.08 : 1) * (1 - t0 * 0.35);
    poseDisquePY(c, g, A.x + ux * d0 + nx * w, A.y + uy * d0 + ny * w - t0 * 5 * z, r, ap);
  }

  /* ── 4. LE CŒUR. Une langue étroite et très claire collée à la
     buse : sans elle, le jet est une nuée orange sans origine. ── */
  var gC = c.createLinearGradient(A.x, A.y, A.x + ux * por * 0.42, A.y + uy * por * 0.42);
  gC.addColorStop(0, "rgba(255,255,246," + (0.92 * feu) + ")");
  gC.addColorStop(0.45, "rgba(255,232,170," + (0.62 * feu) + ")");
  gC.addColorStop(1, "rgba(255,150,50,0)");
  c.fillStyle = gC;
  c.beginPath();
  var w0 = 3.4 * z * feu, w1 = 9 * z * feu;
  c.moveTo(A.x + nx * w0, A.y + ny * w0);
  c.lineTo(A.x + ux * por * 0.42 + nx * w1, A.y + uy * por * 0.42 + ny * w1);
  c.lineTo(A.x + ux * por * 0.42 - nx * w1, A.y + uy * por * 0.42 - ny * w1);
  c.lineTo(A.x - nx * w0, A.y - ny * w0);
  c.closePath(); c.fill();

  /* ── 5. LA CHALEUR. Pas de vraie distorsion — le canevas ne sait pas
     la faire sans repasser toute l'image — mais son effet visible :
     deux arcs très pâles qui montent en ondulant au-dessus du jet.
     L'œil lit « air qui tremble » et ne demande pas comment. ── */
  c.strokeStyle = "rgba(255,236,206,.10)";
  c.lineWidth = Math.max(0.6, 2.2 * z);
  for(var h = 0; h < 2; h++){
    c.beginPath();
    for(var j = 0; j <= 8; j++){
      var tj = j / 8;
      var wj = Math.sin(tps * 4.5 + tj * 5.4 + h * 2.2 + u.n) * tj * 10 * z;
      var xj = A.x + ux * por * tj + nx * wj;
      var yj = A.y + uy * por * tj + ny * wj - (10 + tj * 20) * z - h * 5 * z;
      if(j === 0) c.moveTo(xj, yj); else c.lineTo(xj, yj);
    }
    c.stroke();
  }

  /* ── 6. LES ÉTINCELLES. Elles vont plus loin que la flamme et
     retombent : ce sont elles qui donnent l'échelle du jet. ── */
  c.fillStyle = "rgba(255,238,196,.9)";
  for(var e = 0; e < PYR_N_ETIN; e++){
    var te = ((tps * 1.55 + e / PYR_N_ETIN + u.n * 0.29) % 1);
    if(te > feu) continue;
    var de = te * por * 1.25;
    var we = Math.sin(tps * 9 + e * 2.3 + u.n) * te * 22 * z;
    var che = te * te * 16 * z;          // la chute
    c.globalAlpha = (1 - te) * feu;
    c.beginPath();
    c.arc(A.x + ux * de + nx * we, A.y + uy * de + ny * we + che,
          Math.max(0.5, (1.9 - te) * z), 0, 6.2832);
    c.fill();
  }
  c.globalAlpha = 1;

  /* ── 7. L'IMPACT. Là où la flamme touche, elle s'écrase et remonte :
     un disque clair, et deux langues qui lèchent vers le haut. ── */
  var I = { x:A.x + ux * lg, y:A.y + uy * lg };
  poseDisquePY(c, gChaud, I.x, I.y, 15 * z * feu,
               feu * (0.55 + 0.45 * Math.sin(tps * 16 + u.n * 2)));
  for(var m = 0; m < 3; m++){
    var tm = ((tps * 1.9 + m / 3 + u.n * 0.2) % 1);
    poseDisquePY(c, gTiede, I.x + Math.sin(tps * 5 + m * 2) * 9 * z * tm,
                 I.y - tm * 26 * z, (5 + tm * 9) * z, feu * (1 - tm) * 0.65);
  }
  c.restore();
}

/* Tous les jets d'un coup, appelés APRÈS la pile de rendu : une
   flamme passe DEVANT le bâtiment qu'elle lèche, jamais derrière. */
function dessineFlammesPYR(c, tps){
  if(!jeu || !jeu.unites) return;
  for(var i = 0; i < jeu.unites.length; i++){
    var u = jeu.unites[i];
    if(u.pv <= 0 || u.leurre) continue;
    if(u.t !== "pyr" || !(u.flamme > 0.02)) continue;
    if(u.cachee) continue;               // sous Brouillard on ne tire pas
    dessineJetPYR(c, u, tps);
  }
}

/* ================================================================
   L'ÉTAT DU LANCE-FLAMMES

   `feuT` est un compte à rebours en secondes, rechargé à chaque coup
   par tireUnite. `flamme` le suit — vite pour s'éteindre, LENTEMENT
   pour s'allumer : un lance-flammes crache d'abord du carburant mal
   brûlé, la flamme s'installe en un tiers de seconde. C'est ce petit
   retard qui fait qu'on croit à la machine.
   ================================================================ */
function majPyr(u, dt){
  if(u.feuT === undefined){ u.feuT = 0; u.flamme = 0; u.souffleT = 0; }
  u.feuT = Math.max(0, u.feuT - dt);
  var but = u.feuT > 0 ? 1 : 0;
  var k = but ? 3.1 : 6.5;               // montée lente, coupure nette
  u.flamme += (but - u.flamme) * Math.min(1, dt * k);
  if(u.flamme < 0.004) u.flamme = 0;
  /* le souffle, relancé régulièrement tant que ça crache : un son par
     coup à huit coups par seconde serait un grésillement */
  if(but){
    u.souffleT -= dt;
    if(u.souffleT <= 0){ u.souffleT = 0.42; if(son.lanceFlamme) son.lanceFlamme(); }
  }else u.souffleT = 0;
}

/* ================================================================
   LES TROIS ENTRÉES DE DESSIN
   ================================================================ */
function dessinePyrMonde(c, u, tps){
  var p = versEcran(cam, u.gx, u.gy);
  var z = cam.z;
  c.save();
  if(u.cachee) c.globalAlpha = 0.42;
  c.translate(p.x, p.y);
  c.scale(z, z);
  charPYR(c, u.angBase || 0, u.angTour || 0, u.chenille || 0,
          1 - (u.pv / u.pvMax), 0, z >= 0.5 ? 1 : 0, u.flamme || 0, tps);
  c.restore();

  /* LA POUSSIÈRE. Deux fois celle du char, et sur toute la largeur des
     chenilles : c'est le dernier indice du poids. */
  if(u.roule > 0.10 && z > 0.4){
    var ca2 = Math.cos(u.angBase || 0), sa2 = Math.sin(u.angBase || 0);
    for(var k = 0; k < 2; k++){
      var ph = ((tps * 1.6 + u.n * 0.41 + k * 0.5) % 1);
      var pd = ptT(-PY.chX - ph * 6, (k ? 1 : -1) * PY.chYe * 0.85, 1.6, ca2, sa2);
      bouffee(c, p.x + pd.x * z, p.y + (pd.y - ph * 10) * z,
              (2.6 + ph * 7.5) * z, (1 - ph) * 0.30 * Math.min(1, u.roule), C_PYR.poussiere);
    }
  }
  /* la fumée du moteur quand il souffre : elle sort des grilles */
  if(u.pv < u.pvMax * 0.55){
    var ph2 = (tps * 0.62 + u.n * 0.37) % 1;
    var fum = ptT((PY.grX0 + PY.grX1) / 2, 0, PY.coZ1 + 2,
                  Math.cos(u.angBase || 0), Math.sin(u.angBase || 0));
    bouffee(c, p.x + fum.x * z, p.y + (fum.y - ph2 * 26) * z,
            (2.8 + ph2 * 7) * z, (1 - ph2) * 0.34 * (1 - u.pv / u.pvMax), "#33383c");
  }
}

/* La pose fixe : trois quarts, arme légèrement tournée. C'est celle
   qui montre à la fois les chenilles, le glacis, les réservoirs et la
   gueule de protection. */
function dessinePyr(c, phase, variante, tir){
  charPYR(c, 0.62, 0.30, (phase || 0) * 5, 0, 0, 1, tir ? 0.85 : 0, phase || 0);
}

/* LE PORTRAIT DU BRIEFING.

   Même méthode que le TX-90, et pour la même raison : le cadre fait
   150 × 104, dessinePortrait y arrive décalé de (0, −14) et grossi
   d'une fois et demie. On MESURE la boîte réellement peinte dans
   cette pose plutôt que de la deviner — le PYR-120 est plus large et
   plus haut que le char, et deux réglages posés à l'œil l'auraient
   fait déborder par la gueule de protection, qui est justement ce
   qu'il faut voir.

   Boîte mesurée à l'échelle 1 dans cette pose : x de −44 à 58, z de
   0 à 52, ce qui donne à l'écran 102 de large sur 78 de haut. */
function portraitPyr(c){
  c.save();
  /* L'échelle a été divisée par PY_ECH le jour où le véhicule a
     grossi de 28 % : le cadre, lui, fait toujours 150 × 104. */
  c.translate(40.5, 57.0);
  c.scale(0.625, 0.625);
  charPYR(c, 0.56, -0.14, 0, 0, 0, 1, 0, 0);
  c.restore();
}
