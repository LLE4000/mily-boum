/* ================================================================
   LA VENGEANCE DE MILY — le rendu
   Trois morceaux, trois repères différents, et c'est tout le sujet :

     dessineYeuxVengeance   repère ÉCRAN, appelé juste après le
                            Brasier dans la pile de profondeur. Les
                            yeux du visage rougissent, chauffent,
                            crachent. On ne touche PAS au visage
                            décalqué : on pose une lueur PAR-DESSUS,
                            exactement là où sont ses yeux.
     dessineRayonsVengeance repère ÉCRAN, par-dessus toute la carte.
                            Deux faisceaux partent des deux yeux,
                            convergent sur la troupe désignée, puis
                            CONTINUENT au sol en V sur une dizaine de
                            cases.
     dessineMessageVengeance repère ÉCRAN, dans l'interface. Discret,
                            en haut, avec la jauge de charge : c'est
                            l'attente qui fait peur, pas le rayon.

   Le rendu ne décide de rien. Il lit jeu.vengeance et
   chargeVengeance(), tenus par majVengeance(dt) dans 80-jeu.js.
   ================================================================ */

/* Les yeux du visage décalqué, ramenés dans le repère local du
   Brasier : gardienne3D() translate en (0, Y_TETE) puis met à
   l'échelle ECH_GARD, et le décalque donne ses yeux dans le repère
   de la gardienne. On refait le même chemin, une fois pour toutes. */
function yeuxDuBrasier(){
  return [
    { x:ECH_GARD * VT_YEUX.g[0], y:Y_TETE + ECH_GARD * VT_YEUX.g[1] },
    { x:ECH_GARD * VT_YEUX.d[0], y:Y_TETE + ECH_GARD * VT_YEUX.d[1] }
  ];
}

/* ================================================================
   LA COULEUR DE LA COLÈRE

   Rouge de la colère : trois crans, du noyau blanc au halo sourd.
   C'est la palette d'origine, celle des onze îles à forteresse de
   lave, et elle ne bouge pas.

   MAIS ELLE SUIT LA FORTERESSE, et c'est un choix qu'il faut
   assumer : les rayons sortent des yeux du visage, le visage est
   serti dans la maçonnerie, et sur le palais des Mily et une nuits
   cette maçonnerie est de marbre et d'or. Le style de la forteresse
   porte donc sa propre colère — voir STYLES_QG dans 50-qg.js, champ
   `veng`. Une île sans palette propre retombe ici, sur le rouge.

   ON LIT LA PALETTE À CHAQUE APPEL, jamais une fois pour toutes :
   `SQ` change quand on change d'île, et une constante figée au
   chargement aurait donné du rouge sur le palais et de l'or sur le
   Brasier au premier changement de carte.
   ================================================================ */
var VENG_ROUGE = {
  noyau:"255,236,214", chair:"255,74,38", sang:"214,12,6",
  /* LE CORPS DU FAISCEAU, et c'est le réglage qui a tout décidé.
     traitRayon peint quatre passes de la plus large à la plus fine ;
     les deux plus larges portaient toutes les deux `sang`. Sur du
     rouge, cela marche — le sang est sombre, l'or du noyau ressort.
     Sur le palais, le halo est VIOLET et le corps devait être OR : en
     additif, un violet large sous un blanc étroit donne un rayon
     blanc-violet, et l'or disparaissait complètement. Mesuré à
     l'écran, pas deviné. Le corps a donc sa propre couleur, qui vaut
     `sang` sur le rouge — donc rien ne change pour les onze îles. */
  corps:"214,12,6",
  flaque:["255,244,222", "255,74,38", "214,12,6"],
  /* le panneau du message : le surtitre bat entre ces deux teintes,
     la menace est fixe, la plaque est le fond presque noir */
  surtitre:["255,90,70", "255,180,130"], menace:"255,120,86", plaque:"10,3,5"
};
function palVeng(){
  return (typeof SQ === "object" && SQ && SQ.veng) ? SQ.veng : VENG_ROUGE;
}
/* Mélange deux couleurs écrites « r,g,b ». Les utilitaires de
   20-outils.js travaillent en hexadécimal ; ici tout est en triplets
   parce que tout finit dans une rgba(). */
function melangeVeng(a, b, t){
  var x = a.split(","), y = b.split(",");
  return Math.round(+x[0] + (+y[0] - +x[0]) * t) + ","
       + Math.round(+x[1] + (+y[1] - +x[1]) * t) + ","
       + Math.round(+x[2] + (+y[2] - +x[2]) * t);
}

/* ---------------------------------------------------------------
   1. LES YEUX QUI VIRENT AU ROUGE
   La charge va de 0 à 1 pendant tout le message. Rien ne part tant
   qu'elle n'a pas atteint 1 — c'est la promesse faite au joueur.
   --------------------------------------------------------------- */
function dessineYeuxVengeance(c, tps){
  if(!jeu.vengeance || jeu.fin) return;
  var ch = chargeVengeance();
  if(ch <= 0.001) return;
  var PV = palVeng(), V_NOYAU = PV.noyau, V_CHAIR = PV.chair, V_SANG = PV.sang;
  var ECH = EQ.VENG_ECH_VISUEL || 1;
  var z = cam.z;
  if(z < 0.05) return;
  var p = versEcran(cam, jeu.qg.gx, jeu.qg.gy);
  var yx = yeuxDuBrasier();
  /* La montée n'est pas linéaire : les deux premières secondes sont
     une braise qui couve, la dernière est une lampe à arc. */
  var e = ch * ch;
  /* Battement de cœur, de plus en plus rapide à mesure que ça charge. */
  var bat = 0.78 + 0.22 * Math.sin(tps * (4 + ch * 22));

  c.save();
  c.translate(p.x, p.y);
  c.scale(z, z);
  c.globalCompositeOperation = "lighter";

  /* Le visage entier prend une lumière rouge par en dessous : sans
     elle les deux yeux flottent comme deux gommettes collées. */
  var gv = c.createRadialGradient(4, Y_TETE, 10, 4, Y_TETE, 150);
  gv.addColorStop(0, "rgba(" + V_CHAIR + "," + (0.30 * e * bat) + ")");
  gv.addColorStop(0.55, "rgba(" + V_SANG + "," + (0.17 * e * bat) + ")");
  gv.addColorStop(1, "rgba(" + V_SANG + ",0)");
  c.fillStyle = gv;
  c.beginPath(); c.arc(4, Y_TETE, 150, 0, 6.2832); c.fill();

  for(var i = 0; i < 2; i++){
    var o = yx[i];
    /* halo large — c'est lui qu'on voit de loin */
    var r = (16 + e * 54) * bat * ECH;
    var g1 = c.createRadialGradient(o.x, o.y, 0.5, o.x, o.y, r);
    g1.addColorStop(0, "rgba(" + V_NOYAU + "," + (0.55 * e) + ")");
    g1.addColorStop(0.22, "rgba(" + V_CHAIR + "," + (0.62 * e) + ")");
    g1.addColorStop(0.62, "rgba(" + V_SANG + "," + (0.30 * e) + ")");
    g1.addColorStop(1, "rgba(" + V_SANG + ",0)");
    c.fillStyle = g1;
    c.beginPath(); c.arc(o.x, o.y, r, 0, 6.2832); c.fill();

    /* la pupille elle-même : petite, dure, et de plus en plus blanche */
    var rp = 2.6 + e * 5.4;
    var g2 = c.createRadialGradient(o.x, o.y, 0, o.x, o.y, rp);
    g2.addColorStop(0, "rgba(" + V_NOYAU + "," + (0.30 + 0.70 * e) + ")");
    g2.addColorStop(0.55, "rgba(" + V_CHAIR + "," + (0.55 + 0.45 * e) + ")");
    g2.addColorStop(1, "rgba(" + V_SANG + ",0)");
    c.fillStyle = g2;
    c.beginPath(); c.arc(o.x, o.y, rp, 0, 6.2832); c.fill();

    /* Passé la moitié de la charge, l'énergie déborde : des arcs
       courts crépitent autour de l'orbite. Déterministes, pour ne
       pas scintiller différemment à chaque image. */
    if(e > 0.22){
      c.strokeStyle = "rgba(" + V_NOYAU + "," + (0.16 + 0.30 * e) + ")";
      c.lineWidth = 1.1 + e * 1.4;
      c.lineCap = "round";
      for(var a = 0; a < 7; a++){
        var an = a / 7 * 6.2832 + tps * (1.6 + i * 0.7) + i * 1.1;
        var r0 = rp * 1.25, r1 = rp + 5 + e * 15 + Math.sin(tps * 17 + a * 2.3) * 4;
        c.beginPath();
        c.moveTo(o.x + Math.cos(an) * r0, o.y + Math.sin(an) * r0 * 0.85);
        c.lineTo(o.x + Math.cos(an + 0.24) * r1 * 0.7,
                 o.y + Math.sin(an + 0.24) * r1 * 0.6);
        c.lineTo(o.x + Math.cos(an - 0.1) * r1, o.y + Math.sin(an - 0.1) * r1 * 0.85);
        c.stroke();
      }
    }
  }
  c.restore();
}

/* ---------------------------------------------------------------
   2. LES DEUX RAYONS
   Un faisceau se peint en trois passes de la plus large à la plus
   fine : halo sourd, chair, noyau blanc. C'est ce qui fait la
   différence entre un rayon et un trait rouge.
   --------------------------------------------------------------- */
/* Quatre passes, de la plus large à la plus fine. La proportion est
   le seul réglage qui compte : en additif, un noyau blanc trop épais
   mange tout et le rayon vire au jaune. Le blanc ne fait donc qu'un
   dixième de la largeur — juste de quoi donner la brûlure — et les
   trois quarts de l'énergie sont rouges. */
function traitRayon(c, pts, larg, alpha){
  var PV = palVeng(), V_NOYAU = PV.noyau, V_CHAIR = PV.chair, V_SANG = PV.sang;
  var V_CORPS = PV.corps || V_SANG;
  var passes = [
    { l:larg * 1.7,  col:V_SANG,  a:0.20 * alpha },
    { l:larg,        col:V_CORPS, a:0.46 * alpha },
    { l:larg * 0.42, col:V_CHAIR, a:0.66 * alpha },
    { l:larg * 0.10, col:V_NOYAU, a:0.95 * alpha }
  ];
  c.lineCap = "round";
  c.lineJoin = "round";
  for(var q = 0; q < passes.length; q++){
    var P = passes[q];
    c.strokeStyle = "rgba(" + P.col + "," + P.a + ")";
    c.lineWidth = Math.max(0.8, P.l);
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);
    for(var i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
    c.stroke();
  }
}

/* La traînée au sol : DROITE, elle aussi. Le rayon ne se tord pas
   parce qu'il rase la terre, il continue tout droit.
   Deux points suffisent : versEcran() est affine, donc un segment
   droit dans le monde reste un segment droit à l'écran. On passe
   quand même par elle et non par des coordonnées d'écran, pour que
   la traînée soit bien couchée dans le plan de l'île. */
function pointsTrainee(V, k, fraction){
  var s = V.dir[k];
  return [
    versEcran(cam, V.cx, V.cy),
    versEcran(cam, V.cx + (s.x1 - V.cx) * fraction,
                   V.cy + (s.y1 - V.cy) * fraction)
  ];
}

function dessineRayonsVengeance(c, tps){
  var V = jeu.vengeance;
  if(!V || V.ph === "message") return;
  /* Le même garde-fou que pour les yeux : pendant la séquence finale
     la forteresse s'enfonce et penche, et les rayons, eux, partiraient
     encore des yeux d'AVANT l'effondrement — deux traits accrochés au
     ciel au-dessus d'une ruine. */
  if(jeu.fin) return;
  var PV = palVeng(), V_NOYAU = PV.noyau, V_CHAIR = PV.chair, V_SANG = PV.sang;
  var ECH = EQ.VENG_ECH_VISUEL || 1;
  var z = cam.z;
  var t = V.t;
  /* Fondu : plein pendant tout le tir, extinction ensuite. */
  var alpha = 1;
  if(V.ph === "tir" && t > EQ.VENG_TIR * 0.72)
    alpha = 1 - (t - EQ.VENG_TIR * 0.72) / (EQ.VENG_TIR * 0.28);
  else if(V.ph === "retrait") alpha = Math.max(0, 1 - V.t / (EQ.VENG_RETRAIT * 0.5));
  if(alpha <= 0.01) return;

  /* Deux tempos : la lance qui va de l'œil à la cible (rapide), puis
     la traînée qui court au sol (un peu plus lente, on doit la voir
     partir). */
  var lance = V.ph === "tir" ? borne(t / 0.16, 0, 1) : 1;
  var sol   = V.ph === "tir" ? borne((t - 0.16) / 0.34, 0, 1) : 1;

  var pq = versEcran(cam, jeu.qg.gx, jeu.qg.gy);
  var yx = yeuxDuBrasier();
  var pi = versEcran(cam, V.cx, V.cy);

  repereEcran(c);
  c.save();
  c.globalCompositeOperation = "lighter";

  /* LA LARGEUR. Elle ne suit pas le zoom de bout en bout : deux gros
     lasers doivent rester deux GROS lasers même quand on a dézoomé
     pour voir les deux bouts du tir à la fois — et c'est justement
     à ce moment-là qu'on les regarde. Un plancher franc, plus une
     part qui grandit avec le zoom. */
  var larg = (15 + 26 * z) * (0.88 + 0.12 * Math.sin(tps * 33)) * ECH;

  for(var k = 0; k < 2; k++){
    var ox = pq.x + yx[k].x * z, oy = pq.y + yx[k].y * z;
    /* le segment aérien œil → impact */
    var bx = ox + (pi.x - ox) * lance, by = oy + (pi.y - oy) * lance;
    /* DROIT. Deux traits tendus de l'œil à la cible, sans la moindre
       courbure : c'est un rayon, pas un jet. Ce qui les distingue l'un
       de l'autre, ce sont leurs deux départs — les yeux sont écartés —
       et leurs deux arrivées, puisque les traînées au sol repartent en
       V. Entre les deux ils se rejoignent, et c'est bien le propos :
       ils CONVERGENT sur la même troupe. */
    traitRayon(c, [{ x:ox, y:oy }, { x:bx, y:by }], larg, alpha);

    /* la continuation au sol, seulement une fois la cible touchée */
    if(sol > 0.001) traitRayon(c, pointsTrainee(V, k, sol), larg * 0.82, alpha);
  }

  /* L'IMPACT. Une étoile blanche, un anneau qui s'ouvre, et la
     brûlure au sol : c'est ce qui doit rester à l'écran une demi-
     seconde de trop. */
  if(lance >= 1){
    var age = Math.max(0, t - 0.16);
    var ec = Math.exp(-age * 3.4);
    var r = (26 + 48 * z) * (0.7 + ec * 1.5) * ECH;
    var gi = c.createRadialGradient(pi.x, pi.y, 0, pi.x, pi.y, r);
    gi.addColorStop(0, "rgba(255,255,255," + (0.95 * alpha * (0.35 + ec * 0.65)) + ")");
    gi.addColorStop(0.16, "rgba(" + V_NOYAU + "," + (0.70 * alpha * ec) + ")");
    gi.addColorStop(0.38, "rgba(" + V_CHAIR + "," + (0.58 * alpha) + ")");
    gi.addColorStop(0.72, "rgba(" + V_SANG + "," + (0.40 * alpha) + ")");
    gi.addColorStop(1, "rgba(" + V_SANG + ",0)");
    c.fillStyle = gi;
    c.beginPath(); c.arc(pi.x, pi.y, r, 0, 6.2832); c.fill();
    /* étoile à quatre branches, la signature d'une lumière trop forte */
    /* SIX BRANCHES, pas quatre. Une étoile à quatre branches se lit
       comme une croix ; à six, elle se lit comme une lumière qui
       déborde de l'objectif — et c'est ce qu'on veut dire. */
    c.strokeStyle = "rgba(255,255,255," + (0.5 * alpha * ec) + ")";
    c.lineWidth = Math.max(1, 3.4 * z * ECH);
    for(var b = 0; b < 6; b++){
      var ab = b * 1.0472 + 0.4;
      var lb = r * (b % 2 ? 1.6 : 2.9);
      c.beginPath();
      c.moveTo(pi.x - Math.cos(ab) * lb, pi.y - Math.sin(ab) * lb * 0.6);
      c.lineTo(pi.x + Math.cos(ab) * lb, pi.y + Math.sin(ab) * lb * 0.6);
      c.stroke();
    }
    /* anneau de souffle au sol, en ellipse isométrique */
    if(age < 0.6){
      var ao = age / 0.6;
      c.strokeStyle = "rgba(" + V_NOYAU + "," + (0.5 * (1 - ao) * alpha) + ")";
      c.lineWidth = Math.max(1, 5 * z * (1 - ao) * ECH);
      c.beginPath();
      c.ellipse(pi.x, pi.y, EQ.VENG_RAYON * RX * z * (0.4 + ao * 2.1),
                EQ.VENG_RAYON * RY * z * (0.4 + ao * 2.1), 0, 0, 6.2832);
      c.stroke();
    }
  }
  c.restore();

  /* Voile rouge sur tout l'écran au moment de l'impact : trois
     dixièmes de seconde, pas plus — c'est un coup de poing, pas une
     ambiance. */
  if(V.ph === "tir" && t > 0.16 && t < 0.62){
    var vv = 1 - (t - 0.16) / 0.46;
    c.save();
    c.globalCompositeOperation = "lighter";
    c.fillStyle = "rgba(" + V_SANG + "," + (0.34 * vv) + ")";
    c.fillRect(0, 0, W, H);
    c.restore();
  }
}

/* ---------------------------------------------------------------
   3. LE MESSAGE
   Discret, en haut, hors du champ de bataille : le joueur doit
   pouvoir continuer à jouer pendant qu'il le lit — et comprendre,
   à la jauge, qu'il lui reste trois secondes pour dégager ses
   troupes. Il n'y arrivera pas. C'est le but.
   --------------------------------------------------------------- */
function dessineMessageVengeance(c, tps){
  var V = jeu.vengeance;
  if(!V) return;
  var PV = palVeng(), V_NOYAU = PV.noyau, V_SANG = PV.sang;
  var ECH_TXT = 1;
  var ch = chargeVengeance();
  if(V.ph !== "message" && ch <= 0.01) return;
  var mien = V.tueur === monNom;

  repereEcran(c);

  /* Le rouge monte par les bords de l'écran à mesure que ça charge.
     Une vignette, jamais un voile plein : on doit continuer à voir
     le terrain. */
  if(ch > 0.02){
    var gv = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.30,
                                    W / 2, H / 2, Math.max(W, H) * 0.74);
    gv.addColorStop(0, "rgba(" + V_SANG + ",0)");
    gv.addColorStop(1, "rgba(" + V_SANG + "," + (0.40 * ch * ch) + ")");
    c.fillStyle = gv;
    c.fillRect(0, 0, W, H);
  }
  if(V.ph !== "message") return;

  var ent = Math.min(1, V.t / 0.3);
  var sortie = ch > 0.94 ? (ch - 0.94) / 0.06 : 0;
  var al = ent * (1 - sortie * 0.35);

  var ech = Math.min(W / 900, H / 620);
  ech = borne(ech, 0.62, 1.5);
  var tt = 25 * ech;                         // corps du texte principal
  /* Sous la bannière d'objectif, jamais dessus : elle occupe déjà le
     haut de l'écran et dit combien de cellules tiennent encore. */
  var y0 = H * 0.115 + (1 - ent) * -24;

  /* on mesure avant de peindre la plaque : le pseudo peut être long */
  var titre = mien
    ? "Vous venez de tuer " + V.nomBete + "."
    : V.tueur + " vient de tuer " + V.nomBete + ".";
  c.font = "700 " + tt + "px 'Trebuchet MS', 'Segoe UI', sans-serif";
  var larg = Math.max(c.measureText(titre).width, 250 * ech);
  var pw = larg + 56 * ech, phh = 108 * ech;
  var px = W / 2 - pw / 2, py = y0;

  c.save();
  c.globalAlpha = al;

  /* plaque : presque noire, cerclée d'un rouge qui s'allume */
  c.fillStyle = "rgba(" + (PV.plaque || "10,3,5") + ",.80)";
  cadreArrondi(c, px, py, pw, phh, 6 * ech);
  c.fill();
  c.strokeStyle = "rgba(" + V_SANG + "," + (0.35 + 0.55 * ch) + ")";
  c.lineWidth = 1.6 * ech;
  cadreArrondi(c, px, py, pw, phh, 6 * ech);
  c.stroke();

  c.textAlign = "center";
  c.textBaseline = "middle";

  /* surtitre : l'œil, puis MILY A VU */
  var ys = py + 22 * ech;
  c.font = "700 " + (12 * ech) + "px 'Trebuchet MS', 'Segoe UI', sans-serif";
  var pouls = 0.55 + 0.45 * Math.sin(tps * (5 + ch * 14));
  var ST = PV.surtitre || ["255,90,70", "255,180,130"];
  c.fillStyle = "rgba(" + melangeVeng(ST[0], ST[1], pouls) + ",1)";
  espaceLettres(c, "M I L Y   A   V U", W / 2, ys, 2.6 * ech);

  /* le fait, sobrement */
  c.font = "700 " + tt + "px 'Trebuchet MS', 'Segoe UI', sans-serif";
  c.fillStyle = "#f0e4e2";
  c.fillText(titre, W / 2, py + 54 * ech);

  /* La menace n'arrive qu'à mi-charge : d'abord on encaisse le fait,
     ensuite seulement on comprend ce qui va suivre. */
  if(ch > 0.42){
    var am = Math.min(1, (ch - 0.42) / 0.20);
    c.globalAlpha = al * am;
    c.font = "italic 700 " + (15 * ech) + "px 'Trebuchet MS', 'Segoe UI', sans-serif";
    c.fillStyle = "rgba(" + (PV.menace || "255,120,86") + "," + (0.55 + 0.45 * pouls) + ")";
    c.fillText("Elle ne pardonne pas.", W / 2, py + 82 * ech);
    c.globalAlpha = al;
  }

  /* la jauge de charge, collée au bas de la plaque : le compte à
     rebours dont on ne peut rien faire */
  var jx = px + 14 * ech, jw = pw - 28 * ech, jy = py + phh - 6 * ech;
  c.fillStyle = "rgba(255,255,255,.10)";
  c.fillRect(jx, jy, jw, 3 * ech);
  var gj = c.createLinearGradient(jx, 0, jx + jw, 0);
  gj.addColorStop(0, "rgba(" + V_SANG + ",1)");
  gj.addColorStop(1, "rgba(" + V_NOYAU + ",1)");
  c.fillStyle = gj;
  c.fillRect(jx, jy, jw * ch, 3 * ech);
  c.restore();
}

/* Deux utilitaires de texte que seul ce panneau utilise. */
function cadreArrondi(c, x, y, w, h, r){
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
/* Un surtitre espacé, à la main : letterSpacing n'existe pas partout
   sur un contexte 2D, et on ne veut pas d'un rendu qui varie selon
   le navigateur. */
function espaceLettres(c, s, cx, y, esp){
  var i, l = 0;
  for(i = 0; i < s.length; i++) l += c.measureText(s.charAt(i)).width + esp;
  l -= esp;
  var x = cx - l / 2;
  var av = c.textAlign;
  c.textAlign = "left";
  for(i = 0; i < s.length; i++){
    c.fillText(s.charAt(i), x, y);
    x += c.measureText(s.charAt(i)).width + esp;
  }
  c.textAlign = av;
}
