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

/* ────────────────────────────────────────────────────────────────
   LE CAMOUFLAGE DE NEIGE

   Ce n'est pas un véhicule blanc — un véhicule blanc est une tache
   blanche, et sur le sable de la première île il disparaîtrait. Un
   vrai camouflage d'hiver est une peinture blanche PASSÉE PAR-DESSUS
   la peinture d'usine, qui s'use et laisse voir le gris dessous. Il
   est donc fait de trois valeurs : le blanc froid de la neige, un
   gris de pierre, et l'ardoise d'origine qui reparaît aux angles.
   C'est cette rupture qui le rend lisible sur n'importe quel fond.

   ET LE TRAIN DE ROULEMENT RESTE SOMBRE. Une chenille blanche sous
   une caisse blanche donne une bouillie : c'est l'acier et la boue
   qui portent la silhouette par le bas, et ils ne se peignent pas.

   Le blanc va aussi très bien avec la flamme, et pour une autre
   raison que l'ardoise d'avant : là où l'ardoise TRANCHAIT sur
   l'orange, la neige le REÇOIT — un véhicule blanc éclairé par son
   propre jet prend la couleur du feu sur tout son flanc. C'est
   gratuit, et c'est le plus joli des deux.
   ──────────────────────────────────────────────────────────────── */
var C_PYR = {
  /* la peinture d'hiver : un blanc froid, jamais pur */
  coque:"#d6dfe7", coqueO:"#adbac6", coqueN:"#84919e",
  toit:"#e6edf2", liseré:"#2a333c",
  /* les plaques rapportées : le blanc y est plus usé */
  plaque:"#c2cdd7", plaqueC:"#f0f5f9",
  /* les taches du camouflage : un gris de pierre, une ardoise */
  camoB:"#69747f", camoV:"#252c33",
  /* LE TRAIN RESTE SOMBRE — voir plus haut, c'est délibéré */
  chenille:"#2b3138", chenilleC:"#454e57", maillon:"#161a1f",
  roue:"#3a434c", roueC:"#69747f", moyeu:"#9aa5b0",
  /* le circuit du naphte : cuivre et laiton, la seule chaleur */
  cuivre:"#95602f", cuivreC:"#c98f52", laiton:"#8f7433",
  /* la buse : de l'acier nu, SOMBRE — c'est la pièce qui doit se
     détacher sur le blanc, et le blanc sur blanc ne détache rien */
  buse:"#39424b", buseC:"#8b97a2", gueule:"#252c33",
  /* les grilles moteur et les échappements, noircis par l'usage */
  grille:"#1c2229", echap:"#3b3f44", echapC:"#5f666d",
  /* la veilleuse, minuscule, toujours allumée */
  veilleuse:"255,164,72",
  poussiere:"#ccd5dd"
};

/* Les taches, tirées une fois pour toutes d'une graine à nous. Plus
   grosses et moins nombreuses que celles du char : un camouflage
   d'hiver se peint au rouleau sur un engin de cette taille, pas au
   pinceau. */
var CAMO_PYR = null;
function camoPYR(){
  if(CAMO_PYR) return CAMO_PYR;
  var al = prng(0x5E16E);
  function taches(n, rmin, rmax){
    var out = [], i, k;
    for(i = 0; i < n; i++){
      var cu = -0.18 + al() * 1.36, cv = -0.22 + al() * 1.44;
      var r = rmin + al() * (rmax - rmin);
      var m = 6 + ((al() * 4) | 0), pts = [];
      for(k = 0; k < m; k++){
        var a = k / m * 6.2832, rr = r * (0.55 + al() * 0.8);
        pts.push([cu + Math.cos(a) * rr, cv + Math.sin(a) * rr * 0.72]);
      }
      out.push({ pts:pts, t:al() < 0.60 ? 0 : 1 });
    }
    return out;
  }
  CAMO_PYR = {
    toit:taches(11, 0.10, 0.26),
    flanc:taches(12, 0.10, 0.28),
    glacis:taches(8, 0.11, 0.30),
    tourelle:taches(9, 0.10, 0.24),
    /* LE RESTE DU VÉHICULE. Le camouflage s'arrêtait aux quatre
       grandes surfaces, et ça se voyait : l'avant, l'arrière, les fûts
       et le manchon d'arme restaient d'un gris uni au milieu d'un engin
       tacheté, comme si on avait peint la moitié de l'atelier. Un
       camouflage qui s'arrête à une arête n'en est pas un — il désigne
       la pièce qu'il laisse nue. */
    avant:taches(6, 0.12, 0.30),
    arriere:taches(8, 0.11, 0.28),
    fut:taches(7, 0.10, 0.26),
    masque:taches(5, 0.14, 0.34),
    buse:taches(4, 0.12, 0.28)
  };
  return CAMO_PYR;
}

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
  /* LA TOURELLE EST RONDE, et c'est le seul volume du véhicule qui
     ne soit pas une boîte. Elle était rectangulaire au premier jet —
     une casemate fixe surmontée d'un bloc d'arme —, ce qui donnait
     une pile de caisses. Un cylindre légèrement conique par-dessus
     tout ce plat casse la silhouette et dit qu'il TOURNE : une
     tourelle carrée ne se lit pas comme une pièce mobile.

     Le cercle a une propriété commode dans cette projection : quel
     que soit le cap, un cercle de rayon R se projette TOUJOURS en une
     ellipse de demi-axes R√2 et R√2/2 — exactement deux pour un,
     comme les tuiles. On la trace donc directement à l'écran, et
     seuls ses DÉTAILS tournent avec l'arme. */
  tuR:13, tuRt:10.6, tuZ0:27, tuZ1:46,
  /* les deux réservoirs de naphte, couchés sur le pont arrière */
  reX0:-27, reX1:-13, reY:11.5, reR:6.2, reZ:33,
  /* les grilles moteur, entre les réservoirs */
  grX0:-26, grX1:-15,
  /* les échappements, sur les flancs arrière */
  ecX:-21, ecZ0:27, ecZ1:41, ecR:2.6,
  /* LE LANCE-FLAMMES, dans le repère de la tourelle. Court et gros :
     c'est une buse, pas un tube. */
  buX0:10, buX1:30, buR:4.2, buZ:36.5,
  /* le masque : le manchon cylindrique par lequel la buse sort de la
     tourelle, et qui la protège à sa racine */
  maX0:7, maX1:17, maR:7.6,
  /* la gueule de protection qui l'entoure */
  guX0:20, guX1:31, guR:7.2
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

/* ────────────────────────────────────────────────────────────────
   LE CAMOUFLAGE SUR UNE PIÈCE RONDE

   `camoFaceT` découpe à un quadrilatère plat ; il ne sait rien faire
   d'un fût ni d'un manchon. Ici la découpe est la silhouette du tube
   — le rectangle plus l'ellipse du bout — et les taches vivent en
   (le long, en travers).

   ET ELLES SE RESSERRENT SUR LES BORDS. Étalées linéairement en
   travers, elles donnaient un ruban plat collé sur le tube ; passées
   par un sinus, elles s'écrasent près de la silhouette exactement
   comme le ferait une peinture qui tourne autour du cylindre. C'est
   ce resserrement, et lui seul, qui dit que la pièce est ronde.
   ──────────────────────────────────────────────────────────────── */
function camoTubePY(c, a, b, r, ca, sa, lot, C, opa){
  if(!lot || !lot.length) return;
  var pa = ptT(a[0], a[1], a[2], ca, sa), pb = ptT(b[0], b[1], b[2], ca, sa);
  var dx = pb.x - pa.x, dy = pb.y - pa.y;
  var lg = Math.hypot(dx, dy) || 1;
  var ux = dx / lg, uy = dy / lg, nx = -uy, ny = ux;
  var i, k, t, u, v, o, x, y;
  c.save();
  c.beginPath();
  c.moveTo(pa.x + nx * r, pa.y + ny * r);
  c.lineTo(pb.x + nx * r, pb.y + ny * r);
  c.lineTo(pb.x - nx * r, pb.y - ny * r);
  c.lineTo(pa.x - nx * r, pa.y - ny * r);
  c.closePath();
  c.ellipse(pb.x, pb.y, r, r * 0.62, Math.atan2(dy, dx), 0, 6.2832);
  c.clip();
  c.globalAlpha = opa || 0.72;
  for(t = 0; t < 2; t++){
    c.beginPath();
    var rien = true;
    for(i = 0; i < lot.length; i++){
      if((lot[i].t ? 1 : 0) !== t) continue;
      rien = false;
      for(k = 0; k < lot[i].pts.length; k++){
        u = lot[i].pts[k][0]; v = lot[i].pts[k][1];
        o = Math.sin((v - 0.5) * 3.1416) * r;
        x = pa.x + ux * lg * u + nx * o;
        y = pa.y + uy * lg * u + ny * o;
        if(k === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.closePath();
    }
    if(rien) continue;
    c.fillStyle = t ? C.camoV : C.camoB;
    c.fill();
  }
  c.restore();
}

/* Le même peintre que celui du char, mais l'OPACITÉ SE RÈGLE.

   `camoFaceT` écrit 0,62 en dur, et cette valeur est juste — pour le
   TX-90, qui est vert foncé : des taches trop franches sur du vert
   font une peau de vache. Sur une coque blanche, la même opacité
   donne un gris lavé, et le PYR-120 se retrouvait avec une tourelle
   nettement camouflée posée sur une caisse presque nue — deux engins
   sur le même châssis. La tourelle peint à 0,85 ; la caisse doit en
   faire autant.

   On ne touche pas au peintre du char pour autant : il appartient au
   TX-90, et le TX-90 ne change pas. */
function camoFacePY(c, P, lot, ca, sa, C, opa){
  if(!lot || !lot.length) return;
  var i, k, t, b, p;
  c.save();
  cheminT(c, P, ca, sa);
  c.clip();
  c.globalAlpha = opa;
  for(t = 0; t < 2; t++){
    c.beginPath();
    var rien = true;
    for(i = 0; i < lot.length; i++){
      if((lot[i].t ? 1 : 0) !== t) continue;
      rien = false;
      for(k = 0; k < lot[i].pts.length; k++){
        b = bilinT(P, lot[i].pts[k][0], lot[i].pts[k][1]);
        p = ptT(b[0], b[1], b[2], ca, sa);
        if(k === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y);
      }
      c.closePath();
    }
    if(rien) continue;
    c.fillStyle = t ? C.camoV : C.camoB;
    c.fill();
  }
  c.restore();
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

  /* PAS DE GARDE-BOUE, ET C'EST LA CAISSE QUI L'A REMPLACÉ.

     Il y en avait un : une tôle posée sur toute la longueur de chaque
     chenille. Elle était peinte APRÈS la caisse pour la chenille de
     devant, à une hauteur qui tombe en plein dans le flanc — donc
     par-dessus lui, sous la forme d'une grande plaque blanche qui
     dépassait dans le vide. Invisible sur un engin sombre, criante
     sur un engin blanc.
     Et elle était de toute façon inutile : la caisse déborde des
     chenilles de quatre pixels en encorbellement, ce qui est
     exactement le rôle d'un garde-boue. On l'a retirée plutôt que de
     la replacer — une pièce qu'une autre fait déjà. */
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
     jusqu'au toit. C'est la pièce qui donne le profil de bélier.

     ET ON NE LE DESSINE QUE S'IL NOUS REGARDE. `boiteT` fait ce tri
     tout seul — c'est pour ça qu'il prend une teinte d'avant ET une
     d'arrière — mais le glacis est une face libre, ajoutée à la main,
     et rien ne la cachait. Résultat : quand le véhicule s'éloignait,
     son glacis restait peint PAR-DESSUS la caisse, sous la forme de
     deux coins blancs qui dépassaient de nulle part. On teste donc la
     normale, comme partout ailleurs dans ce fichier. Une CONDITION,
     pas une sortie : les grilles, les échappements et les plaques de
     flanc se voient dans tous les caps et n'ont rien à faire ici. */
  var devant = versNousT(ca, sa);
  if(devant){
    faceT(c, [[PY.coX1, -PY.coY, PY.coZ0], [PY.glX, -PY.glY, PY.coZ0 + 2],
              [PY.glX, PY.glY, PY.coZ0 + 2], [PY.coX1, PY.coY, PY.coZ0]],
          ca, sa, ecl(C.coque, 1.24), L);
    faceT(c, [[PY.glX, -PY.glY, PY.coZ0 + 2], [PY.coX1 - 2, -PY.glY + 2, PY.glZ],
              [PY.coX1 - 2, PY.glY - 2, PY.glZ], [PY.glX, PY.glY, PY.coZ0 + 2]],
          ca, sa, ecl(C.coque, 1.34), L);
  }

  if(!detail) return;

  /* LE GLACIS N'EST PAS UNE DALLE. C'est la plus grande surface du
     véhicule et celle qu'on voit en premier quand il arrive sur soi :
     laissée nue, elle aplatissait tout l'avant. Quatre pièces y
     tiennent — le volet du conducteur, deux crochets de remorquage et
     une plaque de choc boulonnée — et elles suffisent à donner
     l'échelle de la machine. */
  if(devant){
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
  }

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

  /* ---- LE CAMOUFLAGE, ET C'EST LUI QUI SAUVE LE BLANC ----
     Sans taches, une caisse blanche est un aplat : les faces se
     distinguent par leur seule valeur, et l'engin ressemble à une
     maquette non peinte. Les taches lui rendent une surface — et
     elles seules l'empêchent de disparaître sur le sable clair de la
     première île, où une peinture d'hiver n'a rien à faire.
     On réutilise le peintre du char, `camoFaceT` : il découpe à la
     face et n'ouvre que deux remplissages pour toutes les taches.

     IL VIENT APRÈS LES PIÈCES RAPPORTÉES, ET C'EST TOUT LE SUJET.
     Peint avant, il laissait blanches les seules pièces qu'on regarde
     de près — les trois plaques de flanc, le volet du conducteur, la
     plaque de choc — et le véhicule se retrouvait avec des rectangles
     nus au milieu des taches, comme un blindé qu'on aurait repeint en
     oubliant de démonter ses accessoires. Un atelier peint la machine
     montée : le rouleau passe sur les plaques, sur les boulons, sur
     tout. On peint donc en dernier, et la découpe à la face suffit à
     tenir la peinture sur la tôle. */
  var CA = camoPYR();
  var yc = devantG ? PY.coY : -PY.coY;
  camoFacePY(c, [[PY.coX0, yc, PY.coZ0], [PY.coX1, yc, PY.coZ0],
                [PY.coX1, yc, PY.coZ1], [PY.coX0, yc, PY.coZ1]],
             CA.flanc, ca, sa, C, 0.85);
  camoFacePY(c, [[PY.coX0, -PY.coY, PY.coZ1], [PY.coX1, -PY.coY, PY.coZ1],
                [PY.coX1, PY.coY, PY.coZ1], [PY.coX0, PY.coY, PY.coZ1]],
             CA.toit, ca, sa, C, 0.85);
  /* LE BOUT VISIBLE, avant OU arrière — jamais les deux. `boiteT`
     n'en montre qu'un, et peindre l'autre serait payer pour une face
     que personne ne verra. On se règle donc sur la même normale que
     lui : le tri est déjà fait, on le lit. */
  if(devant){
    camoFacePY(c, [[PY.glX, -PY.glY, PY.coZ0 + 2], [PY.coX1 - 2, -PY.glY + 2, PY.glZ],
                  [PY.coX1 - 2, PY.glY - 2, PY.glZ], [PY.glX, PY.glY, PY.coZ0 + 2]],
               CA.glacis, ca, sa, C, 0.85);
    camoFacePY(c, [[PY.coX1, -PY.coY, PY.coZ0], [PY.coX1, PY.coY, PY.coZ0],
                  [PY.coX1, PY.coY, PY.coZ1], [PY.coX1, -PY.coY, PY.coZ1]],
               CA.avant, ca, sa, C, 0.85);
  }else{
    camoFacePY(c, [[PY.coX0, -PY.coY, PY.coZ0], [PY.coX0, PY.coY, PY.coZ0],
                  [PY.coX0, PY.coY, PY.coZ1], [PY.coX0, -PY.coY, PY.coZ1]],
               CA.arriere, ca, sa, C, 0.85);
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
function CA_FUT(){ return camoPYR().fut; }
function reservoirsPY(c, ca, sa, C, detail){
  for(var k = 0; k < 2; k++){
    var y = (k ? 1 : -1) * PY.reY;
    tubePY(c, [PY.reX0, y, PY.reZ], [PY.reX1, y, PY.reZ], PY.reR, ca, sa,
           ecl(C.plaque, 1.14), ecl(C.plaqueC, 1.05));
    if(!detail) continue;
    /* LES FÛTS SONT PEINTS COMME LE RESTE. Ils sont posés sur le pont,
       à hauteur de toit, et c'est la première chose qu'on voit d'un
       PYR-120 vu de dos : deux cylindres unis suffisaient à trahir la
       machine sur la neige. Le deuxième fût prend l'autre moitié du
       lot pour que les deux ne soient pas jumeaux. */
    camoTubePY(c, [PY.reX0, y, PY.reZ], [PY.reX1, y, PY.reZ], PY.reR, ca, sa,
               k ? CA_FUT().slice(3) : CA_FUT().slice(0, 4), C, 0.66);
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
    tubePY(c, [PY.reX1 + 2, yt, zP], [-PY.tuR + 2, yt * 0.42, zP],
           1.05, ca, sa, C.cuivre, C.cuivreC);
    /* deux colliers qui le tiennent au pont */
    bagueP(c, [PY.reX1 + 4, yt * 0.86, zP], 1.7, ca, sa, "rgba(24,30,36,.55)");
    bagueP(c, [-PY.tuR - 2, yt * 0.55, zP], 1.7, ca, sa, "rgba(24,30,36,.55)");
  }
  /* le collecteur, une boîte de laiton posée au milieu du pont */
  boiteT(c, -PY.tuR - 6, -PY.tuR - 1, -4, 4, PY.coZ1, PY.coZ1 + 4.5, ca, sa,
         { avant:C.laiton, arriere:ecl(C.laiton, 0.7), flanc:ecl(C.laiton, 0.86),
           toit:ecl(C.laiton, 1.2), liseré:C.liseré });
}

/* ────────────────────────────────────────────────────────────────
   LA TOURELLE RONDE ET SON LANCE-FLAMMES

   Une seule pièce là où il y en avait deux. Le premier dessin posait
   une casemate rectangulaire sur la caisse et un bloc d'arme carré
   par-dessus : trois boîtes empilées, et rien qui dise que quoi que
   ce soit tourne. Une tourelle CYLINDRIQUE règle les deux à la fois —
   elle casse le plat de la caisse, et un cylindre au milieu d'un
   véhicule rectangulaire se lit immédiatement comme la pièce mobile.

   LE CERCLE EST GRATUIT DANS CETTE PROJECTION. Un cercle de rayon R
   à la hauteur z se projette toujours en une ellipse de demi-axes
   R√2 et R√2/2, quel que soit le cap — c'est le rapport deux pour un
   des tuiles. On trace donc le contour DIRECTEMENT à l'écran, sans
   passer par ptT, et seuls les détails posés dessus (le masque, la
   trappe, les épiscopes) tournent avec l'arme.

   La buse sort par un MASQUE — le manchon qui la protège à sa racine
   et suit ses mouvements — puis traverse une gueule de protection à
   trois arceaux. On protège un lance-flammes parce qu'il faut
   s'approcher pour s'en servir : cette cage dit toute la doctrine du
   véhicule, et c'est pour ça qu'elle doit se voir.

   La veilleuse brûle en permanence au bord de la buse, même à
   l'arrêt : c'est elle qui fait comprendre ce qu'on regarde avant
   même le premier jet.
   ──────────────────────────────────────────────────────────────── */
function tourellePYR(c, at, C, detail, feu, tps){
  var cat = Math.cos(at), sat = Math.sin(at);
  var L = C.liseré;
  var R2 = Math.SQRT2;                      // le facteur du cercle projeté
  var rb = PY.tuR * R2, rbY = rb * 0.5;     // l'ellipse du bas
  var rh = PY.tuRt * R2, rhY = rh * 0.5;    // celle du haut, plus petite
  var y0 = -PY.tuZ0, y1 = -PY.tuZ1;         // z monte, l'écran descend

  /* ---- LA JUPE : la moitié avant du cylindre, celle qu'on voit ----
     Un dégradé vertical, clair en haut où elle prend le ciel, sombre
     en bas où elle prend l'ombre de la caisse. */
  /* LE CHEMIN SE CROISAIT, ET C'EST POUR ÇA QUE LA PAROI MANQUAIT.

     L'arc du bas se termine à GAUCHE — à l'angle π, donc en (−rb, y0).
     Le trait qui rejoignait le haut partait vers (+rh, y1), c'est-à-
     dire vers la DROITE : la figure se refermait en nœud papillon et
     ne remplissait presque rien. Le disque du haut flottait donc au-
     dessus de celui du bas, sans rien entre les deux. On rejoint le
     même côté, et le cylindre existe.

     Le trajet, dans l'ordre : demi-ellipse du bas de la droite vers la
     gauche, montée à gauche, demi-ellipse du haut de la gauche vers la
     droite, et fermeture. */
  var g = degradeT(c, C.coqueO, y1, y0 + rbY);
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(0, y0, rb, rbY, 0, 0, Math.PI);       // le bas, → gauche
  c.lineTo(-rh, y1);                              // et non +rh
  c.ellipse(0, y1, rh, rhY, 0, Math.PI, 0, true); // le haut, → droite
  c.closePath();
  var jupe = new Path2D();
  jupe.ellipse(0, y0, rb, rbY, 0, 0, Math.PI);
  jupe.lineTo(-rh, y1);
  jupe.ellipse(0, y1, rh, rhY, 0, Math.PI, 0, true);
  jupe.closePath();
  c.fill();
  c.strokeStyle = L; c.lineWidth = 0.9; c.stroke();

  /* ---- LE CAMOUFLAGE SUR LA PAROI, découpé à elle ----
     Sans lui, la jupe est une bande grise unie et la tourelle a l'air
     d'être posée sur un tabouret. Les taches sont définies sur le
     CYLINDRE — en (angle, hauteur) — donc elles tournent avec l'arme,
     comme une peinture le ferait. */
  if(detail){
    c.save();
    c.clip(jupe);
    c.globalAlpha = 0.85;
    var rr = prng(0x2C1B7);
    for(var jt = 0; jt < 7; jt++){
      var th0 = rr() * 6.2832, zt = PY.tuZ0 + 2 + rr() * (PY.tuZ1 - PY.tuZ0 - 4);
      var lg2 = 0.5 + rr() * 1.1, ht = 2.5 + rr() * 6;
      c.fillStyle = rr() < 0.55 ? C.camoV : C.camoB;
      c.beginPath();
      for(var kt = 0; kt <= 9; kt++){
        var th = th0 + (kt / 9) * lg2;
        var zz = zt + Math.sin(kt * 1.7 + jt) * ht * 0.5;
        var pw = ptT(Math.cos(th) * PY.tuR, Math.sin(th) * PY.tuR, zz, cat, sat);
        if(kt === 0) c.moveTo(pw.x, pw.y); else c.lineTo(pw.x, pw.y);
      }
      for(var kb = 9; kb >= 0; kb--){
        var th2 = th0 + (kb / 9) * lg2;
        var zz2 = zt - ht + Math.sin(kb * 1.3 + jt) * ht * 0.4;
        var pw2 = ptT(Math.cos(th2) * PY.tuR, Math.sin(th2) * PY.tuR, zz2, cat, sat);
        c.lineTo(pw2.x, pw2.y);
      }
      c.closePath(); c.fill();
    }
    c.restore();
  }

  /* ---- LE TOIT ---- */
  c.fillStyle = ecl(C.toit, 1.04);
  c.beginPath(); c.ellipse(0, y1, rh, rhY, 0, 0, 6.2832); c.fill();
  c.strokeStyle = L; c.lineWidth = 0.8; c.stroke();
  /* l'arête de lumière sur le bord arrière du toit, celle qui monte */
  c.strokeStyle = "rgba(255,255,255,.45)"; c.lineWidth = 1.1;
  c.beginPath(); c.ellipse(0, y1 - 0.6, rh, rhY, 0, Math.PI, 6.2832); c.stroke();

  /* ---- LE CAMOUFLAGE sur le toit, découpé à l'ellipse ---- */
  if(detail){
    var CA = camoPYR();
    c.save();
    c.beginPath(); c.ellipse(0, y1, rh, rhY, 0, 0, 6.2832); c.clip();
    c.globalAlpha = 0.90;
    for(var tt = 0; tt < 2; tt++){
      c.beginPath();
      var rien = true;
      for(var it = 0; it < CA.tourelle.length; it++){
        var T = CA.tourelle[it];
        if((T.t ? 1 : 0) !== tt) continue;
        rien = false;
        for(var kt = 0; kt < T.pts.length; kt++){
          /* les taches vivent dans le carré unité : on les étale sur
             l'ellipse, ce qui les fait tourner avec la tourelle */
          var ux = (T.pts[kt][0] - 0.5) * 2 * PY.tuRt;
          var uy = (T.pts[kt][1] - 0.5) * 2 * PY.tuRt;
          var pt = ptT(ux, uy, PY.tuZ1, cat, sat);
          if(kt === 0) c.moveTo(pt.x, pt.y); else c.lineTo(pt.x, pt.y);
        }
        c.closePath();
      }
      if(!rien){ c.fillStyle = tt ? C.camoV : C.camoB; c.fill(); }
    }
    c.restore();
  }

  /* ---- LA COURONNE DE BOULONS à la base, et les anneaux de levage.
     Ce sont eux qui disent que la tourelle est POSÉE sur la caisse et
     non fondue avec elle. ---- */
  if(detail){
    c.fillStyle = "rgba(30,38,46,.5)";
    c.beginPath();
    for(var q = 0; q < 16; q++){
      var aq = q / 16 * 6.2832;
      var pq = ptT(Math.cos(aq) * (PY.tuR - 1.4), Math.sin(aq) * (PY.tuR - 1.4),
                   PY.tuZ0 + 1.2, cat, sat);
      c.moveTo(pq.x + 1.0, pq.y); c.arc(pq.x, pq.y, 1.0, 0, 6.2832);
    }
    c.fill();
    /* deux anneaux de levage sur le toit */
    for(var e = 0; e < 2; e++){
      var pe = ptT(-PY.tuRt * 0.55, (e ? 1 : -1) * PY.tuRt * 0.5, PY.tuZ1, cat, sat);
      c.strokeStyle = ecl(C.buseC, 0.85); c.lineWidth = 1.6;
      c.beginPath(); c.arc(pe.x, pe.y - 1.5, 2.4, 3.4, 6.1); c.stroke();
    }
    /* la trappe du chef, à l'arrière du toit */
    var ph = ptT(-PY.tuRt * 0.42, 0, PY.tuZ1, cat, sat);
    c.fillStyle = ecl(C.plaque, 0.96);
    c.beginPath(); c.ellipse(ph.x, ph.y, 6.4, 3.2, 0, 0, 6.2832); c.fill();
    c.strokeStyle = L; c.lineWidth = 0.8; c.stroke();
    /* et deux épiscopes devant elle */
    for(var v = 0; v < 2; v++){
      var pv2 = ptT(-PY.tuRt * 0.02, (v ? 1 : -1) * 5.2, PY.tuZ1, cat, sat);
      c.fillStyle = C.buseC;
      c.beginPath(); c.ellipse(pv2.x, pv2.y - 1.6, 2.1, 1.3, 0, 0, 6.2832); c.fill();
      c.fillStyle = "rgba(150,205,225,.6)";
      c.beginPath(); c.ellipse(pv2.x, pv2.y - 2.3, 1.3, 0.75, 0, 0, 6.2832); c.fill();
    }
  }

  /* ---- LE MASQUE : le manchon par lequel la buse sort ---- */
  tubePY(c, [PY.maX0, 0, PY.buZ], [PY.maX1, 0, PY.buZ], PY.maR,
         cat, sat, ecl(C.plaque, 0.94), ecl(C.plaqueC, 0.98));
  if(detail){
    /* Il est peint : c'est une pièce de tourelle, pas une pièce
       d'arme, et c'est la plus grosse masse de l'avant. Le laisser nu
       revenait à dessiner une cible grise au milieu du blanc. */
    camoTubePY(c, [PY.maX0, 0, PY.buZ], [PY.maX1, 0, PY.buZ], PY.maR,
               cat, sat, camoPYR().masque, C, 0.70);
    bagueP(c, [PY.maX1 - 1, 0, PY.buZ], PY.maR + 0.6, cat, sat, "rgba(30,38,46,.55)");
  }

  /* PAS DE FLEXIBLE SUR LE TOIT. Deux essais, deux échecs : quel que
     soit leur tracé, des tuyaux de cuivre posés sur une tourelle
     ronde se lisent comme deux baguettes orange en travers, et c'est
     la seule chose qu'on voit du véhicule. Le circuit du naphte est
     déjà raconté deux fois — par les fûts et par la tuyauterie qui
     longe le pont — et une troisième fois de trop ne raconte rien. */

  /* ---- LA BUSE. Acier sombre, et elle s'évase au bout — un pavillon,
     pas un tube coupé net.

     ELLE EST PEINTE, MAIS PAS JUSQU'AU BOUT. Sur les deux photos de
     référence le camouflage court jusque sur le tube : s'arrêter au
     manchon aurait laissé une barre grise en travers de tout l'avant.
     Le PAVILLON, lui, reste nu — et pas par oubli : c'est la pièce qui
     crache, aucune peinture n'y tiendrait une journée, et c'est aussi
     le seul repère sombre qui dise dans quel sens l'engin tire. Un
     camouflage qui va jusqu'à effacer la bouche du canon a cessé de
     camoufler pour se camoufler lui-même. ---- */
  tubePY(c, [PY.buX0, 0, PY.buZ], [PY.buX1, 0, PY.buZ], PY.buR,
         cat, sat, C.buse, ecl(C.buseC, 1.10));
  if(detail)
    camoTubePY(c, [PY.buX0, 0, PY.buZ], [PY.buX1 - 6, 0, PY.buZ], PY.buR,
               cat, sat, camoPYR().buse, C, 0.62);
  tubePY(c, [PY.buX1 - 5.5, 0, PY.buZ], [PY.buX1 + 1.5, 0, PY.buZ], PY.buR * 1.52,
         cat, sat, ecl(C.buse, 1.12), ecl(C.buseC, 0.98));
  if(detail){
    bagueP(c, [PY.buX0 + 5, 0, PY.buZ], PY.buR + 1.1, cat, sat, "rgba(10,14,18,.55)");
    bagueP(c, [PY.buX1 - 6, 0, PY.buZ], PY.buR + 1.4, cat, sat, "rgba(10,14,18,.60)");
    var pgo = ptT(PY.buX1 + 1.5, 0, PY.buZ, cat, sat);
    c.fillStyle = "rgba(8,10,12,.75)";
    c.beginPath();
    c.ellipse(pgo.x, pgo.y, PY.buR * 1.05, PY.buR * 0.66, 0, 0, 6.2832);
    c.fill();
  }

  /* ---- LA GUEULE DE PROTECTION : trois arceaux, ouverts vers l'avant ---- */
  if(detail){
    for(var k = 0; k < 3; k++){
      var xg = PY.guX0 + k * ((PY.guX1 - PY.guX0) / 2);
      var pg = ptT(xg, 0, PY.buZ, cat, sat);
      var rg = PY.guR * (1 - k * 0.06);
      c.strokeStyle = "rgba(12,16,20,.85)"; c.lineWidth = 2.6;
      c.beginPath(); c.ellipse(pg.x, pg.y, rg, rg * 0.62, 0, 0, 6.2832); c.stroke();
      c.strokeStyle = ecl(C.buseC, 1.1); c.lineWidth = 1.2;
      c.beginPath(); c.ellipse(pg.x, pg.y - 0.8, rg, rg * 0.62, 0, 3.6, 6.0); c.stroke();
    }
    for(var s = 0; s < 2; s++){
      var ys = (s ? 1 : -1) * PY.guR * 0.84;
      tubePY(c, [PY.guX0 - 1.5, ys, PY.buZ], [PY.guX1 + 0.5, ys, PY.buZ], 1.25, cat, sat,
             C.gueule, ecl(C.buseC, 0.95));
    }
  }

  /* ---- LA VEILLEUSE ---- */
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

  /* ---- LA BOUCHE QUAND ÇA TIRE ---- */
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
  chenillePY(c, gaucheDevant ? 1 : -1, ca, sa, defil, C, detail);
  tourellePYR(c, at, C, detail, feu || 0, tps);

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
      var iz = PY.coZ0 + r() * (PY.tuZ0 - PY.coZ0);
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

  /* D'OÙ, ET VERS OÙ. LE JET SORT DE LA BUSE, DONC IL SUIT LA
     TOURELLE — toujours, sans exception. C'est `u.cible` qu'on ne peut
     pas suivre : sous balise, la caisse roule vers un bâtiment
     désigné pendant que la tourelle brûle une bestiole qui mord le
     flanc (voir tirBeteEnMarche). Prendre la cible aurait dessiné la
     flamme vers le bâtiment et le feu aurait manqué la bête à
     l'écran alors qu'il la tue dans les chiffres.
     La cible ne sert donc plus qu'à UNE chose : la longueur. Et
     seulement quand l'arme la regarde vraiment — un quart de radian
     de tolérance, le temps que la tourelle finisse de tourner. */
  var b = bouchePYR(u);
  var A = versEcran(cam, b.gx, b.gy);
  A.y -= b.z * z;                        // la buse est en hauteur
  var cib = u.cible ? u.cible.o : null;
  var at = u.angTour || 0;
  var portee = (f.arret + 1.2);
  if(cib && Math.abs(ecartAngulaire(at,
       Math.atan2(cib.gy - u.gy, cib.gx - u.gx))) < 0.25){
    portee = Math.max(portee,
             Math.hypot(cib.gx - u.gx, cib.gy - u.gy));
  }
  var tx = u.gx + Math.cos(at) * portee, ty = u.gy + Math.sin(at) * portee;
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
