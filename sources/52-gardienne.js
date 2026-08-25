/* ================================================================
   LA GARDIENNE DU BRASIER — le visage de la forteresse.

   Le visage n'est pas « inspiré » de la photo de référence : il en est
   DÉCALQUÉ. outils/tracer-visage.py postérise la photo, extrait le
   contour exact de chaque aplat, le simplifie, et écrit le résultat en
   polygones dans 51-visage-trace.js. Le fichier reste autonome : il n'y
   a aucune image embarquée, seulement des coordonnées et une palette.

   Ici on se contente de :
     - dessiner la chevelure qui prolonge celle du décalque et retombe
       sur les terrasses ;
     - poser le décalque par-dessus, découpé au contour de la tête ;
     - rallumer les yeux en direct (la braise pulse) ;
     - fondre le bas du visage dans le gorgerin de pierre du Brasier.

   Repère local : yeux sur y = −17,5, menton à y = +14,5,
   largeur du visage = 38 unités. Échelle de jeu : ×4.
   ================================================================ */

var C_CHEVEUX = ["#2a1a10", "#402615", "#5f3a20", "#8a5730", "#b47844"];
var C_PEAU    = ["#dcaa7c", "#cb9668"];
var C_PEAU_O  = "#a97148";
var C_YEUX    = ["#d4232c", "#780b12", "#ff8a68"];
var LG_CHEV   = 96;                 // longueur de la chevelure

/* ---------------------------------------------------------------
   Contours de la chevelure et du gorgerin
   --------------------------------------------------------------- */
/* masse de cheveux : elle prend le relais du décalque et descend
   jusque sur les terrasses de la forteresse */
function cheminCheveux(c){
  var b = LG_CHEV;
  c.beginPath();
  c.moveTo(-30, -34);
  c.bezierCurveTo(-38, -20, -39, 4, -36, b - 22);
  c.lineTo(-30, b + 2);
  c.lineTo(-21, b - 16);
  c.lineTo(-11, b + 8);
  c.lineTo(-1, b - 14);
  c.lineTo(9, b + 8);
  c.lineTo(19, b - 16);
  c.lineTo(28, b + 2);
  c.lineTo(34, b - 22);
  c.bezierCurveTo(37, 4, 36, -20, 28, -34);
  c.closePath();
}
/* contour de la tête : c'est lui qui découpe le décalque et supprime
   les morceaux de forteresse restés dans les coins de la photo */
function cheminTete(c){
  c.beginPath();
  c.moveTo(-30.5, -6);
  c.bezierCurveTo(-31.5, -34, -20, -50, 0, -50.2);
  c.bezierCurveTo(20, -50, 31.5, -34, 30.5, -6);
  c.lineTo(30, 20);
  c.bezierCurveTo(20, 29, -20, 29, -30, 20);
  c.closePath();
}
/* gorgerin : l'armure de pierre qui enserre le cou et s'évase en
   épaulières — c'est elle qui soude le visage à la maçonnerie */
function cheminGorgerin(c){
  c.beginPath();
  c.moveTo(-16, 24);
  c.bezierCurveTo(-18, 31, -27, 34, -35, 38);
  c.bezierCurveTo(-45, 43, -51, 49, -53, 66);
  c.lineTo(53, 66);
  c.bezierCurveTo(51, 49, 45, 43, 35, 38);
  c.bezierCurveTo(27, 34, 18, 31, 16, 24);
  c.bezierCurveTo(10, 29, -10, 29, -16, 24);
  c.closePath();
}

/* ---------------------------------------------------------------
   Sprite de la gardienne — construit une seule fois
   --------------------------------------------------------------- */
var spriteGardienne = null;
var SG_ECH = 7, SG_X0 = -58, SG_Y0 = -58, SG_W = 116, SG_H = 162;

function construitSpriteGardienne(){
  var cv = nouveauCanvas(SG_W * SG_ECH, SG_H * SG_ECH);
  var c = cv.getContext("2d");
  c.setTransform(SG_ECH, 0, 0, SG_ECH, -SG_X0 * SG_ECH, -SG_Y0 * SG_ECH);
  c.lineJoin = "round";

  var gChev = c.createLinearGradient(0, -40, 0, LG_CHEV + 8);
  gChev.addColorStop(0.00, C_CHEVEUX[0]);
  gChev.addColorStop(0.38, C_CHEVEUX[1]);
  gChev.addColorStop(0.66, C_CHEVEUX[2]);
  gChev.addColorStop(0.88, C_CHEVEUX[3]);
  gChev.addColorStop(1.00, C_CHEVEUX[4]);

  /* ---- 1. la chevelure, dans le prolongement du décalque ---- */
  c.fillStyle = gChev;
  cheminCheveux(c); c.fill();
  c.save();
  cheminCheveux(c); c.clip();
  var gv = c.createLinearGradient(-38, 0, 38, 0);
  gv.addColorStop(0.00, "rgba(0,0,0,.58)");
  gv.addColorStop(0.14, "rgba(255,236,204,.12)");
  gv.addColorStop(0.36, "rgba(0,0,0,.20)");
  gv.addColorStop(0.58, "rgba(255,236,204,.07)");
  gv.addColorStop(0.80, "rgba(0,0,0,.18)");
  gv.addColorStop(1.00, "rgba(0,0,0,.55)");
  c.fillStyle = gv; c.fillRect(-40, -40, 80, LG_CHEV + 50);
  for(var m = -9; m <= 9; m++){
    var xo = m * 3.7;
    c.strokeStyle = (m % 2) ? "rgba(30,16,8,.26)" : "rgba(255,232,196,.12)";
    c.lineWidth = (m % 3 === 0) ? 1.6 : 0.9;
    c.beginPath();
    c.moveTo(xo * 0.6, -34);
    c.bezierCurveTo(xo * 0.9, 4, xo * 1.06, 44, xo * 1.12, LG_CHEV + 6);
    c.stroke();
  }
  var gao = c.createRadialGradient(0, -14, 12, 0, -6, 42);
  gao.addColorStop(0, "rgba(20,8,2,.55)");
  gao.addColorStop(1, "rgba(20,8,2,0)");
  c.fillStyle = gao; c.fillRect(-40, -40, 80, 90);
  c.restore();

  /* ---- 2. le gorgerin de pierre ---- */
  var gg = c.createLinearGradient(-53, 0, 53, 0);
  gg.addColorStop(0, "#1c151e");
  gg.addColorStop(0.30, "#584850");
  gg.addColorStop(0.52, "#68565e");
  gg.addColorStop(0.74, "#3b2f36");
  gg.addColorStop(1, "#181218");
  c.fillStyle = gg;
  cheminGorgerin(c); c.fill();
  c.save();
  cheminGorgerin(c); c.clip();
  c.strokeStyle = "rgba(10,6,10,.5)"; c.lineWidth = 0.9;
  for(var r = 0; r < 9; r++){
    var yy = 27 + r * 5.2;
    c.beginPath(); c.moveTo(-58, yy); c.lineTo(58, yy + 1.2); c.stroke();
    for(var k = -6; k <= 6; k++){
      var xx = k * 9.5 + (r % 2) * 4.75;
      c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx, yy + 5.2); c.stroke();
    }
  }
  c.restore();
  c.strokeStyle = "rgba(214,166,112,.5)"; c.lineWidth = 1.7;
  c.beginPath();
  c.moveTo(-16, 24); c.bezierCurveTo(-18, 31, -27, 34, -35, 38); c.stroke();
  c.beginPath();
  c.moveTo(16, 24); c.bezierCurveTo(18, 31, 27, 34, 35, 38); c.stroke();
  [-1, 1].forEach(function(s){
    for(var q = 0; q < 3; q++){
      var px = s * (31 + q * 8), py = 39 + q * 3.5;
      c.fillStyle = "#6a5158";
      c.beginPath();
      c.moveTo(px - 3.4, py); c.lineTo(px, py - 11); c.lineTo(px + 3.4, py);
      c.closePath(); c.fill();
      c.strokeStyle = "rgba(220,180,130,.35)"; c.lineWidth = 0.7;
      c.beginPath(); c.moveTo(px - 1.4, py - 4); c.lineTo(px, py - 11); c.stroke();
    }
  });

  /* ---- 3. le décalque, découpé au contour de la tête ---- */
  c.save();
  cheminTete(c); c.clip();
  dessineVisageTrace(c);
  /* le bas du décalque se fond dans la chevelure dessinée */
  var gf = c.createLinearGradient(0, 13, 0, 28);
  gf.addColorStop(0, "rgba(42,26,16,0)");
  gf.addColorStop(1, C_CHEVEUX[1]);
  c.fillStyle = gf;
  c.fillRect(-34, 13, 68, 17);
  /* les bords du décalque se noient dans la chevelure dessinée */
  var gbg = c.createLinearGradient(-31, 0, -19, 0);
  gbg.addColorStop(0, C_CHEVEUX[1]);
  gbg.addColorStop(1, "rgba(64,38,21,0)");
  c.fillStyle = gbg; c.fillRect(-34, -52, 16, 84);
  var gbd = c.createLinearGradient(31, 0, 19, 0);
  gbd.addColorStop(0, C_CHEVEUX[1]);
  gbd.addColorStop(1, "rgba(64,38,21,0)");
  c.fillStyle = gbd; c.fillRect(18, -52, 16, 84);
  var gbh = c.createLinearGradient(0, -50, 0, -38);
  gbh.addColorStop(0, C_CHEVEUX[0]);
  gbh.addColorStop(1, "rgba(42,26,16,0)");
  c.fillStyle = gbh; c.fillRect(-34, -52, 68, 15);
  c.restore();

  /* ---- 4. ombre de la tête sur le gorgerin ---- */
  c.save();
  cheminGorgerin(c); c.clip();
  var go = c.createRadialGradient(0, 20, 6, 0, 24, 36);
  go.addColorStop(0, "rgba(0,0,0,.62)");
  go.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = go; c.fillRect(-58, 18, 116, 44);
  c.restore();

  spriteGardienne = cv;
}

/* ---------------------------------------------------------------
   Les yeux, rallumés en direct par-dessus le décalque.
   Ils vibrent au rythme des flammes de la forteresse.
   --------------------------------------------------------------- */
function oeilVivant(c, cx, cy, inten, tps, sens){
  /* scintillement synchronisé sur le feu */
  var vac = 0.78 + 0.14 * Math.sin(tps * 8.1 + cx)
                 + 0.08 * Math.sin(tps * 14.3 + 2.1)
                 + 0.05 * Math.sin(tps * 25.7);
  var f = (0.55 + inten * 0.85) * vac;
  /* le fond de l'iris s'embrase */
  c.save();
  c.globalCompositeOperation = "lighter";
  var gi = c.createRadialGradient(cx, cy, 0.15, cx, cy, 2.9);
  gi.addColorStop(0, "rgba(255,232,196," + Math.min(1, f * 1.05) + ")");
  gi.addColorStop(0.32, "rgba(255,120,50," + (f * 0.95) + ")");
  gi.addColorStop(0.72, "rgba(255,40,14," + (f * 0.55) + ")");
  gi.addColorStop(1, "rgba(255,30,10,0)");
  c.fillStyle = gi;
  c.beginPath(); c.arc(cx, cy, 2.9, 0, 6.2832); c.fill();
  /* petite flamme reflétée dans l'œil */
  var hf = 1.5 + Math.sin(tps * 9.3 + sens * 1.7) * 0.4;
  c.fillStyle = "rgba(255,200,120," + (f * 0.55) + ")";
  c.beginPath();
  c.moveTo(cx - 0.7, cy + 0.9);
  c.quadraticCurveTo(cx - 1.1 + Math.sin(tps * 7 + sens) * 0.3, cy - hf * 0.4,
                     cx + Math.sin(tps * 11 + sens) * 0.3, cy - hf);
  c.quadraticCurveTo(cx + 1.1, cy - hf * 0.4, cx + 0.7, cy + 0.9);
  c.closePath(); c.fill();
  /* halo qui déborde sur la paupière et la pommette */
  var gh = c.createRadialGradient(cx, cy, 0.5, cx, cy, 9.5);
  gh.addColorStop(0, "rgba(255,96,40," + (0.20 + inten * 0.36) * vac + ")");
  gh.addColorStop(1, "rgba(255,50,15,0)");
  c.fillStyle = gh;
  c.beginPath(); c.ellipse(cx, cy + 0.7, 9.5, 6.4, 0, 0, 6.2832); c.fill();
  c.restore();
  /* éclat spéculaire */
  c.fillStyle = "rgba(255,255,255," + Math.min(1, 0.55 + inten * 0.4) + ")";
  c.beginPath(); c.ellipse(cx - 0.9, cy - 1.1, 0.75, 0.55, -0.4, 0, 6.2832); c.fill();
}

/* ---------------------------------------------------------------
   Reflets du feu sur le visage et la chevelure
   --------------------------------------------------------------- */
function refletsFeu(c, inten, tps){
  var vac = 0.80 + 0.13 * Math.sin(tps * 6.1)
                 + 0.09 * Math.sin(tps * 11.7 + 1.3)
                 + 0.05 * Math.sin(tps * 19.3);
  c.save();
  cheminCheveux(c); c.clip();
  c.globalCompositeOperation = "lighter";
  /* la fournaise de l'entrée éclaire toute la chevelure par en bas */
  var gb = c.createLinearGradient(0, LG_CHEV + 4, 0, -6);
  gb.addColorStop(0, "rgba(255,126,32," + (0.26 * vac) + ")");
  gb.addColorStop(0.45, "rgba(255,96,24," + (0.11 * vac) + ")");
  gb.addColorStop(1, "rgba(255,80,20,0)");
  c.fillStyle = gb;
  c.fillRect(-40, -40, 80, LG_CHEV + 50);
  /* les tours embrasent les mèches de chaque côté */
  [-1, 1].forEach(function(s){
    var gs = c.createRadialGradient(s * 40, 34, 2, s * 40, 30, 52);
    gs.addColorStop(0, "rgba(255,140,44," + (0.20 * vac) + ")");
    gs.addColorStop(1, "rgba(255,100,26,0)");
    c.fillStyle = gs;
    c.fillRect(-40, -30, 80, LG_CHEV + 40);
  });
  /* quelques mèches captent franchement la lumière */
  c.strokeStyle = "rgba(255,168,74," + (0.13 * vac) + ")";
  c.lineCap = "round";
  for(var m = -4; m <= 4; m++){
    if(m === 0) continue;
    var xo = m * 7.4;
    c.lineWidth = 1.6 + (m % 2) * 1.1;
    c.beginPath();
    c.moveTo(xo * 0.6, 6);
    c.bezierCurveTo(xo * 0.9, 34, xo * 1.05, 62, xo * 1.1, LG_CHEV);
    c.stroke();
  }
  c.restore();

  /* le visage prend la lumière du portail, par en dessous */
  c.save();
  cheminTete(c); c.clip();
  c.globalCompositeOperation = "lighter";
  var gv = c.createLinearGradient(0, 26, 0, -10);
  gv.addColorStop(0, "rgba(255,132,40," + (0.20 * vac) + ")");
  gv.addColorStop(1, "rgba(255,110,30,0)");
  c.fillStyle = gv;
  c.fillRect(-34, -20, 68, 54);
  [-1, 1].forEach(function(s){
    var gc2 = c.createLinearGradient(s * 16, 0, s * 34, 0);
    gc2.addColorStop(0, "rgba(255,130,50,0)");
    gc2.addColorStop(1, "rgba(255,140,58," + (0.15 * vac) + ")");
    c.fillStyle = gc2;
    c.fillRect(-34, -52, 68, 84);
  });
  c.restore();
}

/* ---------------------------------------------------------------
   Le portrait
   --------------------------------------------------------------- */
function gardienne(c, x, y, ech, inten, tps){
  if(!spriteGardienne) construitSpriteGardienne();
  tps = tps || 0;
  c.save();
  c.translate(x, y); c.scale(ech, ech);
  c.drawImage(spriteGardienne, SG_X0, SG_Y0, SG_W, SG_H);
  refletsFeu(c, inten, tps);
  oeilVivant(c, VT_YEUX.g[0], VT_YEUX.g[1], inten, tps, -1);
  oeilVivant(c, VT_YEUX.d[0], VT_YEUX.d[1], inten, tps, 1);
  c.restore();
}

/* ---------------------------------------------------------------
   Intégration : halo de braise, ombre portée, lumière rasante
   --------------------------------------------------------------- */
function gardienne3D(c, x, y, ech, inten, tps){
  c.save();
  c.translate(x, y); c.scale(ech, ech);
  c.save();
  c.globalCompositeOperation = "lighter";
  var halo = c.createRadialGradient(0, -6, 14, 0, -6, 132);
  halo.addColorStop(0, "rgba(255,150,50," + (0.08 + inten * 0.18) + ")");
  halo.addColorStop(1, "rgba(255,90,20,0)");
  c.fillStyle = halo;
  c.beginPath(); c.arc(0, -6, 132, 0, 6.2832); c.fill();
  c.restore();
  c.save();
  c.globalAlpha = 0.42; c.fillStyle = "#000";
  c.translate(8, 11);
  cheminCheveux(c); c.fill();
  cheminTete(c); c.fill();
  c.restore();
  c.restore();

  gardienne(c, x, y, ech, inten, tps);

  /* lumière rasante sur le contour : la forteresse brûle des deux côtés */
  c.save();
  c.translate(x, y); c.scale(ech, ech);
  c.globalCompositeOperation = "lighter";
  c.lineCap = "round";
  c.strokeStyle = "rgba(255,196,132,.11)"; c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(-36, LG_CHEV - 26);
  c.bezierCurveTo(-39, 4, -38, -20, -30, -34);
  c.bezierCurveTo(-30, -46, -18, -53, 0, -53.2);
  c.stroke();
  c.strokeStyle = "rgba(255,146,66," + (0.08 + inten * 0.14) + ")"; c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(0, -53.2);
  c.bezierCurveTo(20, -53, 30, -46, 28, -34);
  c.bezierCurveTo(36, -20, 37, 4, 34, LG_CHEV - 26);
  c.stroke();
  c.restore();
}
