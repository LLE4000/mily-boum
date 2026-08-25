/* ================================================================
   LA GARDIENNE
   Portrait vectoriel d'après la référence : longue chevelure lisse
   à dégradé brun → blond, raie au milieu, grands yeux rouges très
   ouverts, sourcils marqués, créole argentée à l'oreille droite.
   Les repères du visage (yeux à ±8,5 sur y = −16, ovale du visage,
   menton à y = +10) sont ceux de la version validée : seuls le
   modelé, la matière et la couleur ont été retravaillés en volume.
   ================================================================ */

var GARD      = { peau:1 };
var C_CHEVEUX = ["#3a2418", "#5c3f24", "#a97c42", "#e0c084", "#f2dcae"]; // racine → pointes
var C_PEAU    = ["#f9e0c4", "#f3d2ae"];
var C_PEAU_O  = "#d9a87e";
var C_YEUX    = ["#d1202a", "#8c0f18", "#ff6a52"];                        // iris, fond, éclat
var LG_GARD   = 68;

/* ---- contours réutilisés comme masques ---- */
function cheminCapuche(c){                 // l'arche de pierre derrière la tête
  c.beginPath();
  c.moveTo(-40, 26); c.lineTo(-40, -14);
  c.quadraticCurveTo(0, -62, 40, -14);
  c.lineTo(40, 26); c.closePath();
}
function cheminVisage(c){
  c.beginPath();
  c.moveTo(-19, -16);
  c.quadraticCurveTo(-20, -38, 0, -42);
  c.quadraticCurveTo(20, -38, 19, -16);
  c.quadraticCurveTo(17, 2, 0, 10);
  c.quadraticCurveTo(-17, 2, -19, -16);
  c.closePath();
}
/* masse de cheveux : elle encadre le visage et tombe bien plus bas */
function cheminCheveux(c){
  var b = LG_GARD - 18 + 22;               // pointes
  c.beginPath();
  c.moveTo(-21, -30);
  c.bezierCurveTo(-31, -20, -30, 6, -27, b);
  c.lineTo(-19, b + 6);
  c.lineTo(-14, b - 10);
  c.lineTo(-8, b + 2);
  c.lineTo(-2, b - 12);
  c.lineTo(4, b + 2);
  c.lineTo(10, b - 10);
  c.lineTo(16, b + 6);
  c.lineTo(27, b);
  c.bezierCurveTo(30, 6, 31, -20, 21, -30);
  c.closePath();
}
/* calotte + raie au milieu */
function cheminFrange(c){
  c.beginPath();
  c.moveTo(-22, -20);
  c.bezierCurveTo(-24, -42, -12, -50, 0, -50);
  c.bezierCurveTo(12, -50, 24, -42, 22, -20);
  c.bezierCurveTo(19, -32, 12, -38, 1.5, -40);
  c.bezierCurveTo(-11, -38, -19, -32, -22, -20);
  c.closePath();
}

/* ---- un œil ---- */
function oeilGardienne(c, cx, sens, inten){
  var ry = 4.7, rx = 6.4;
  /* creux de l'orbite */
  c.fillStyle = "rgba(150,96,64,.18)";
  c.beginPath(); c.ellipse(cx, -16.5, rx + 3.4, ry + 3.2, 0, 0, 6.2832); c.fill();
  /* blanc de l'œil, en amande */
  c.save();
  c.beginPath();
  c.moveTo(cx - rx * sens, -15.6);
  c.bezierCurveTo(cx - rx * 0.5 * sens, -16 - ry, cx + rx * 0.55 * sens, -16 - ry, cx + rx * sens, -17.2);
  c.bezierCurveTo(cx + rx * 0.6 * sens, -16 + ry * 0.95, cx - rx * 0.5 * sens, -16 + ry, cx - rx * sens, -15.6);
  c.closePath();
  c.clip();
  var gb = c.createLinearGradient(0, -16 - ry, 0, -16 + ry);
  gb.addColorStop(0, "#d9d2cc"); gb.addColorStop(0.45, "#fbf7f2"); gb.addColorStop(1, "#efe6dc");
  c.fillStyle = gb;
  c.fillRect(cx - 10, -24, 20, 16);
  /* iris rouge */
  var gi = c.createRadialGradient(cx - 1, -17.4, 0.5, cx, -16, 3.9);
  gi.addColorStop(0, C_YEUX[2]);
  gi.addColorStop(0.45, C_YEUX[0]);
  gi.addColorStop(1, C_YEUX[1]);
  c.fillStyle = gi;
  c.beginPath(); c.arc(cx, -16, 3.8, 0, 6.2832); c.fill();
  /* stries de l'iris */
  c.strokeStyle = "rgba(255,120,90,.45)"; c.lineWidth = 0.5;
  for(var i = 0; i < 10; i++){
    var a = i / 10 * 6.2832;
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * 1.6, -16 + Math.sin(a) * 1.6);
    c.lineTo(cx + Math.cos(a) * 3.5, -16 + Math.sin(a) * 3.5);
    c.stroke();
  }
  c.strokeStyle = "#5a0a10"; c.lineWidth = 0.8;
  c.beginPath(); c.arc(cx, -16, 3.8, 0, 6.2832); c.stroke();
  /* pupille */
  c.fillStyle = "#120a0c";
  c.beginPath(); c.arc(cx, -16, 1.55, 0, 6.2832); c.fill();
  /* braise dans le regard */
  c.save();
  c.globalCompositeOperation = "lighter";
  var gl = c.createRadialGradient(cx, -16, 0.6, cx, -16, 5.4);
  gl.addColorStop(0, "rgba(255,120,40," + (0.20 + inten * 0.55) + ")");
  gl.addColorStop(1, "rgba(255,60,10,0)");
  c.fillStyle = gl;
  c.beginPath(); c.arc(cx, -16, 5.4, 0, 6.2832); c.fill();
  c.restore();
  /* ombre de la paupière supérieure */
  var go = c.createLinearGradient(0, -16 - ry, 0, -16);
  go.addColorStop(0, "rgba(60,26,16,.45)");
  go.addColorStop(1, "rgba(60,26,16,0)");
  c.fillStyle = go;
  c.fillRect(cx - 10, -24, 20, 9);
  /* reflets */
  c.fillStyle = "rgba(255,255,255,.95)";
  c.beginPath(); c.ellipse(cx - 1.5, -17.7, 1.35, 1.05, -0.4, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,255,255,.55)";
  c.beginPath(); c.arc(cx + 1.7, -14.6, 0.62, 0, 6.2832); c.fill();
  c.restore();

  /* trait de cils supérieur, épais, avec la pointe relevée */
  c.strokeStyle = "#1c1014"; c.lineCap = "round";
  c.lineWidth = 1.9;
  c.beginPath();
  c.moveTo(cx - rx * sens, -15.4);
  c.bezierCurveTo(cx - rx * 0.5 * sens, -16.2 - ry, cx + rx * 0.55 * sens, -16.2 - ry, cx + rx * 1.06 * sens, -17.6);
  c.stroke();
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(cx + rx * 0.95 * sens, -17.3);
  c.lineTo(cx + rx * 1.45 * sens, -19.2);
  c.stroke();
  /* cils inférieurs, discrets */
  c.strokeStyle = "rgba(40,22,26,.5)"; c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(cx - rx * 0.75 * sens, -14.9);
  c.bezierCurveTo(cx - rx * 0.3 * sens, -16 + ry * 0.95, cx + rx * 0.5 * sens, -16 + ry * 0.8, cx + rx * 0.9 * sens, -16.6);
  c.stroke();
  /* paupière : pli au-dessus */
  c.strokeStyle = "rgba(120,70,50,.42)"; c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(cx - rx * 0.85 * sens, -18.4);
  c.bezierCurveTo(cx - rx * 0.3 * sens, -22.2, cx + rx * 0.4 * sens, -22.2, cx + rx * 0.95 * sens, -19.6);
  c.stroke();
}

/* ================================================================
   Le portrait complet
   ================================================================ */
function gardienne(c, x, y, ech, inten){
  var peau = C_PEAU[GARD.peau];
  c.save();
  c.translate(x, y); c.scale(ech, ech);
  c.lineJoin = "round";

  /* ---------- 1. l'arche de pierre derrière la tête ---------- */
  var ga = c.createLinearGradient(0, -62, 0, 26);
  ga.addColorStop(0, "#3a2a44");
  ga.addColorStop(0.55, "#241a30");
  ga.addColorStop(1, "#170f1f");
  c.fillStyle = ga;
  cheminCapuche(c); c.fill();
  /* pierres de l'arche + veines de lave */
  c.save();
  cheminCapuche(c); c.clip();
  c.strokeStyle = "rgba(12,7,16,.55)"; c.lineWidth = 1.2;
  for(var s = -3; s <= 5; s++){
    c.beginPath(); c.moveTo(-42, -50 + s * 11); c.lineTo(42, -50 + s * 11); c.stroke();
  }
  c.save();
  c.globalCompositeOperation = "lighter";
  var gv = c.createLinearGradient(0, -60, 0, 26);
  gv.addColorStop(0, "rgba(255,120,30,.30)");
  gv.addColorStop(1, "rgba(255,60,10,.05)");
  c.fillStyle = gv;
  c.fillRect(-42, -62, 84, 90);
  c.restore();
  c.restore();

  /* ---------- 2. chevelure : masse arrière ---------- */
  var gc = c.createLinearGradient(0, -48, 0, LG_GARD + 12);
  gc.addColorStop(0.00, C_CHEVEUX[0]);
  gc.addColorStop(0.22, C_CHEVEUX[1]);
  gc.addColorStop(0.55, C_CHEVEUX[2]);
  gc.addColorStop(0.82, C_CHEVEUX[3]);
  gc.addColorStop(1.00, C_CHEVEUX[4]);
  c.fillStyle = gc;
  cheminCheveux(c); c.fill();

  /* volume de la chevelure */
  c.save();
  cheminCheveux(c); c.clip();
  var gcv = c.createLinearGradient(-32, 0, 32, 0);
  gcv.addColorStop(0.00, "rgba(0,0,0,.42)");
  gcv.addColorStop(0.16, "rgba(255,240,210,.16)");
  gcv.addColorStop(0.42, "rgba(0,0,0,.10)");
  gcv.addColorStop(0.72, "rgba(255,240,210,.10)");
  gcv.addColorStop(1.00, "rgba(0,0,0,.40)");
  c.fillStyle = gcv; c.fillRect(-34, -52, 70, 130);
  /* bande de brillance */
  var gsp = c.createLinearGradient(0, -26, 0, 10);
  gsp.addColorStop(0, "rgba(255,244,220,0)");
  gsp.addColorStop(0.5, "rgba(255,244,220,.34)");
  gsp.addColorStop(1, "rgba(255,244,220,0)");
  c.fillStyle = gsp;
  c.beginPath(); c.ellipse(-16, -12, 8.5, 17, -0.14, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(17, -10, 6.5, 15, 0.12, 0, 6.2832); c.fill();
  /* mèches lisses */
  c.lineCap = "round";
  for(var m = -6; m <= 6; m++){
    var xo = m * 4.4;
    c.strokeStyle = (m % 2) ? "rgba(60,34,20,.20)" : "rgba(255,240,210,.13)";
    c.lineWidth = (m % 3 === 0) ? 1.3 : 0.8;
    c.beginPath();
    c.moveTo(xo * 0.55, -34);
    c.bezierCurveTo(xo * 0.9, -8, xo * 1.08, 18, xo * 1.14, LG_GARD + 6);
    c.stroke();
  }
  /* ombre de la tête sur la chevelure */
  var gao = c.createRadialGradient(0, -18, 12, 0, -14, 30);
  gao.addColorStop(0, "rgba(30,14,8,.5)");
  gao.addColorStop(1, "rgba(30,14,8,0)");
  c.fillStyle = gao; c.fillRect(-34, -52, 70, 90);
  c.restore();

  /* ---------- 3. le cou ---------- */
  c.fillStyle = peau;
  c.fillRect(-7.5, 1, 15, 16);
  c.save();
  c.beginPath(); c.rect(-7.5, 1, 15, 16); c.clip();
  var gcou = c.createLinearGradient(-7.5, 0, 7.5, 0);
  gcou.addColorStop(0, "rgba(90,44,26,.34)");
  gcou.addColorStop(0.42, "rgba(255,240,220,.10)");
  gcou.addColorStop(1, "rgba(90,44,26,.38)");
  c.fillStyle = gcou; c.fillRect(-8, 1, 16, 16);
  var gom = c.createLinearGradient(0, 1, 0, 9);
  gom.addColorStop(0, "rgba(80,34,18,.55)");
  gom.addColorStop(1, "rgba(80,34,18,0)");
  c.fillStyle = gom; c.fillRect(-8, 1, 16, 9);
  c.restore();

  /* ---------- 4. le visage ---------- */
  var gp = c.createLinearGradient(-14, -40, 16, 10);
  gp.addColorStop(0, ecl(peau, 1.06));
  gp.addColorStop(0.55, peau);
  gp.addColorStop(1, C_PEAU_O);
  c.fillStyle = gp;
  cheminVisage(c); c.fill();

  c.save();
  cheminVisage(c); c.clip();
  /* lumière principale en haut à gauche */
  var gl2 = c.createRadialGradient(-7, -31, 2, -3, -22, 30);
  gl2.addColorStop(0, "rgba(255,250,240,.42)");
  gl2.addColorStop(1, "rgba(255,250,240,0)");
  c.fillStyle = gl2; c.fillRect(-22, -46, 44, 60);
  /* tempes et joues dans l'ombre */
  var gr = c.createLinearGradient(4, 0, 21, 0);
  gr.addColorStop(0, "rgba(140,76,48,0)");
  gr.addColorStop(1, "rgba(140,76,48,.36)");
  c.fillStyle = gr; c.fillRect(-22, -46, 44, 60);
  var gr2 = c.createLinearGradient(-20, 0, -8, 0);
  gr2.addColorStop(0, "rgba(140,76,48,.28)");
  gr2.addColorStop(1, "rgba(140,76,48,0)");
  c.fillStyle = gr2; c.fillRect(-22, -46, 44, 60);
  /* ombre de la calotte sur le front */
  var gf = c.createLinearGradient(0, -42, 0, -25);
  gf.addColorStop(0, "rgba(70,34,20,.50)");
  gf.addColorStop(1, "rgba(70,34,20,0)");
  c.fillStyle = gf; c.fillRect(-22, -46, 44, 24);
  /* pommettes chaudes */
  c.fillStyle = "rgba(214,112,88,.20)";
  c.beginPath(); c.ellipse(-11.5, -7.5, 6.6, 4.2, -0.2, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(11.5, -7.5, 6.6, 4.2, 0.2, 0, 6.2832); c.fill();
  /* nez : arête éclairée, aile et ombre portée */
  var gn = c.createLinearGradient(-3.2, -22, 3.4, -22);
  gn.addColorStop(0, "rgba(255,252,246,.34)");
  gn.addColorStop(0.5, "rgba(255,252,246,.05)");
  gn.addColorStop(1, "rgba(140,76,48,.26)");
  c.fillStyle = gn;
  c.beginPath(); c.ellipse(-0.2, -13, 3.2, 9.5, 0, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(150,82,54,.30)";
  c.beginPath(); c.ellipse(0.6, -5.4, 3.6, 2.0, 0, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,252,246,.45)";
  c.beginPath(); c.ellipse(-0.4, -6.6, 1.7, 1.2, 0, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(110,58,40,.42)";
  c.beginPath(); c.ellipse(-2.6, -5.0, 0.85, 0.6, 0.3, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(2.6, -5.0, 0.85, 0.6, -0.3, 0, 6.2832); c.fill();
  /* mâchoire et menton */
  var gm = c.createLinearGradient(0, 1, 0, 11);
  gm.addColorStop(0, "rgba(130,66,42,0)");
  gm.addColorStop(1, "rgba(130,66,42,.40)");
  c.fillStyle = gm; c.fillRect(-22, 0, 44, 14);
  c.fillStyle = "rgba(255,250,240,.26)";
  c.beginPath(); c.ellipse(0, 3.2, 4.6, 2.4, 0, 0, 6.2832); c.fill();
  /* reflet de la fournaise sous le menton */
  var gbr = c.createLinearGradient(0, 12, 0, 0);
  gbr.addColorStop(0, "rgba(255,120,30," + (0.18 + inten * 0.26) + ")");
  gbr.addColorStop(1, "rgba(255,120,30,0)");
  c.fillStyle = gbr; c.fillRect(-22, -2, 44, 16);
  c.restore();

  /* ---------- 5. les yeux ---------- */
  oeilGardienne(c, -8.5, -1, inten);
  oeilGardienne(c,  8.5,  1, inten);

  /* ---------- 6. les sourcils, marqués ---------- */
  c.fillStyle = "#3a2214";
  function sourcil(sens){
    c.save();
    c.scale(sens, 1);
    c.beginPath();
    c.moveTo(2.6, -23.4);
    c.bezierCurveTo(7.5, -27.4, 13.2, -27.6, 15.8, -24.4);
    c.bezierCurveTo(13.0, -25.9, 7.6, -25.4, 3.0, -21.9);
    c.closePath();
    c.fill();
    /* poils */
    c.strokeStyle = "rgba(20,10,6,.4)"; c.lineWidth = 0.5;
    for(var i = 0; i < 7; i++){
      var t = i / 6;
      var bx = 3.2 + t * 12, by = -23.2 - Math.sin(t * 3.14) * 3.2;
      c.beginPath(); c.moveTo(bx, by + 1.2); c.lineTo(bx + 1.1, by - 0.9); c.stroke();
    }
    c.restore();
  }
  sourcil(-1); sourcil(1);

  /* ---------- 7. la bouche ---------- */
  c.save();
  /* lèvre supérieure */
  var glv = c.createLinearGradient(0, -3, 0, 4);
  glv.addColorStop(0, "#a8464a");
  glv.addColorStop(0.42, "#c25a58");
  glv.addColorStop(1, "#d9756b");
  c.fillStyle = glv;
  c.beginPath();
  c.moveTo(-6.6, -0.8);
  c.quadraticCurveTo(-3.4, -3.0, -1.0, -1.4);
  c.quadraticCurveTo(0, -2.3, 1.0, -1.4);
  c.quadraticCurveTo(3.4, -3.0, 6.6, -0.8);
  c.quadraticCurveTo(3.4, 0.2, 0, 0.2);
  c.quadraticCurveTo(-3.4, 0.2, -6.6, -0.8);
  c.closePath(); c.fill();
  /* lèvre inférieure */
  c.fillStyle = "#cf6d63";
  c.beginPath();
  c.moveTo(-6.2, -0.4);
  c.quadraticCurveTo(0, 0.6, 6.2, -0.4);
  c.quadraticCurveTo(3.6, 3.6, 0, 3.8);
  c.quadraticCurveTo(-3.6, 3.6, -6.2, -0.4);
  c.closePath(); c.fill();
  c.fillStyle = "rgba(255,220,205,.42)";
  c.beginPath(); c.ellipse(-1.2, 2.0, 2.6, 1.0, -0.08, 0, 6.2832); c.fill();
  /* ligne des lèvres */
  c.strokeStyle = "rgba(110,40,40,.65)"; c.lineWidth = 0.75;
  c.beginPath();
  c.moveTo(-6.6, -0.7);
  c.quadraticCurveTo(-3.2, 0.35, 0, 0.15);
  c.quadraticCurveTo(3.2, 0.35, 6.6, -0.7);
  c.stroke();
  /* ombre sous la lèvre */
  c.fillStyle = "rgba(140,72,48,.24)";
  c.beginPath(); c.ellipse(0, 4.9, 3.6, 1.1, 0, 0, 6.2832); c.fill();
  c.restore();

  /* ---------- 8. la calotte de cheveux, raie au milieu ---------- */
  c.fillStyle = gc;
  cheminFrange(c); c.fill();
  c.save();
  cheminFrange(c); c.clip();
  var gcal = c.createLinearGradient(0, -50, 0, -18);
  gcal.addColorStop(0, "rgba(255,244,220,.24)");
  gcal.addColorStop(0.5, "rgba(255,255,255,0)");
  gcal.addColorStop(1, "rgba(0,0,0,.34)");
  c.fillStyle = gcal; c.fillRect(-26, -52, 52, 36);
  /* la raie */
  c.strokeStyle = "rgba(255,238,208,.30)"; c.lineWidth = 1.1;
  c.beginPath(); c.moveTo(0.6, -50); c.lineTo(1.2, -38); c.stroke();
  c.strokeStyle = "rgba(28,14,8,.45)"; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(-0.4, -50); c.lineTo(0.2, -37); c.stroke();
  /* mèches de la calotte, qui partent de la raie */
  for(var q = -5; q <= 5; q++){
    if(q === 0) continue;
    c.strokeStyle = (q % 2) ? "rgba(28,14,8,.24)" : "rgba(255,240,210,.16)";
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(0.4, -46);
    c.quadraticCurveTo(q * 3.2, -42, q * 4.4, -20);
    c.stroke();
  }
  c.restore();

  /* ---------- 9. la créole argentée ---------- */
  c.save();
  c.strokeStyle = "#4a4a52"; c.lineWidth = 2.6;
  c.beginPath(); c.ellipse(19.6, -5.4, 4.6, 6.2, 0.1, -0.5, Math.PI * 1.25); c.stroke();
  var gan = c.createLinearGradient(15, -12, 24, 2);
  gan.addColorStop(0, "#ffffff"); gan.addColorStop(0.5, "#c8c8d0"); gan.addColorStop(1, "#8e8e98");
  c.strokeStyle = gan; c.lineWidth = 1.8;
  c.beginPath(); c.ellipse(19.6, -5.6, 4.6, 6.2, 0.1, -0.5, Math.PI * 1.25); c.stroke();
  c.fillStyle = "#f0f0f4";
  c.beginPath(); c.arc(20.6, -11.2, 1.15, 0, 6.2832); c.fill();
  c.restore();

  c.restore();
}

/* ----------------------------------------------------------------
   Passe de volume : halo de braise derrière, ombre portée sur la
   maçonnerie, lumière rasante sur le contour.
   ---------------------------------------------------------------- */
function gardienne3D(c, x, y, ech, inten){
  /* --- derrière --- */
  c.save();
  c.translate(x, y); c.scale(ech, ech);
  c.save();
  c.globalCompositeOperation = "lighter";
  var halo = c.createRadialGradient(0, -14, 10, 0, -14, 104);
  halo.addColorStop(0, "rgba(255,150,50," + (0.10 + inten * 0.24) + ")");
  halo.addColorStop(1, "rgba(255,90,20,0)");
  c.fillStyle = halo;
  c.beginPath(); c.arc(0, -14, 104, 0, 6.2832); c.fill();
  c.restore();
  c.save();
  c.globalAlpha = 0.36; c.fillStyle = "#000";
  c.translate(6, 8);
  cheminCheveux(c); c.fill();
  cheminFrange(c); c.fill();
  c.restore();
  c.restore();

  /* --- le portrait --- */
  gardienne(c, x, y, ech, inten);

  /* --- lumière rasante sur le contour --- */
  c.save();
  c.translate(x, y); c.scale(ech, ech);
  c.globalCompositeOperation = "lighter";
  c.lineCap = "round";
  c.strokeStyle = "rgba(255,226,180,.46)"; c.lineWidth = 1.7;
  c.beginPath();
  c.moveTo(-27, LG_GARD - 8);
  c.bezierCurveTo(-30, 6, -31, -20, -21, -30);
  c.stroke();
  c.beginPath();
  c.moveTo(-22, -20); c.bezierCurveTo(-24, -42, -12, -50, 0, -50);
  c.stroke();
  c.strokeStyle = "rgba(255,170,90," + (0.24 + inten * 0.34) + ")"; c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(21, -30); c.bezierCurveTo(31, -20, 30, 6, 27, LG_GARD - 8);
  c.stroke();
  c.restore();
}
