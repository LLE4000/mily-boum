/* ================================================================
   PORTRAITS DES TROUPES
   Illustrations vectorielles, dans le style du jeu : elles reprennent
   l'allure des personnages (combattante à longue chevelure noire et
   gros fusil, soldat casqué très charpenté) sans chercher la photo.
   Repère : 100 unités de large, origine en haut à gauche.
   ================================================================ */

var C_PORTRAIT = {
  fond1:"#3d2757", fond2:"#170e21", vignette:"rgba(10,5,16,.55)",
  peauF:"#f3ded0", peauFO:"#d3ac93", cheveuxF:"#17131c", cheveuxF2:"#31293c",
  tenueF:"#f0ebe3", tenueFO:"#c3bcb1", plastronF:"#2b2b30", plastronFC:"#4d4d56",
  peauH:"#e0b184", peauHO:"#b3835a", barbeH:"#7a5a34", cheveuxH:"#a8834c",
  giletH:"#6b6244", giletHC:"#8f855f", giletHO:"#443f2c",
  casqueH:"#7c7355", casqueHC:"#a0956f", casqueHO:"#484329",
  arme:"#33343a", armeC:"#5f6169", armeO:"#191a1e",
  laiton:"#c9a24a", accent:"#ff8a1e"
};

function fondPortrait(c, h){
  var g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, C_PORTRAIT.fond1);
  g.addColorStop(1, C_PORTRAIT.fond2);
  c.fillStyle = g;
  c.fillRect(0, 0, 100, h);
  /* halo derrière la tête */
  var r = c.createRadialGradient(50, h * 0.36, 4, 50, h * 0.38, 46);
  r.addColorStop(0, "rgba(255,170,80,.22)");
  r.addColorStop(1, "rgba(255,120,30,0)");
  c.fillStyle = r;
  c.fillRect(0, 0, 100, h);
}
function vignettePortrait(c, h){
  var g = c.createRadialGradient(50, h * 0.45, h * 0.30, 50, h * 0.5, h * 0.78);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, C_PORTRAIT.vignette);
  c.fillStyle = g;
  c.fillRect(0, 0, 100, h);
  /* voile sombre en bas : le nom du type de troupe s'y détache */
  var b = c.createLinearGradient(0, h * 0.48, 0, h);
  b.addColorStop(0, "rgba(12,7,18,0)");
  b.addColorStop(1, "rgba(12,7,18,.72)");
  c.fillStyle = b;
  c.fillRect(0, h * 0.48, 100, h * 0.52);
}

/* ---------------------------------------------------------------
   LA FURIE — buste trois quarts, longue chevelure, fusil sur l'épaule
   --------------------------------------------------------------- */
function portraitFurie(c){
  var P = C_PORTRAIT, H = 84;
  fondPortrait(c, H);
  c.save();
  c.translate(48, 6);
  c.lineJoin = "round";

  /* chevelure arrière, très longue */
  var gch = c.createLinearGradient(0, 4, 0, 80);
  gch.addColorStop(0, P.cheveuxF2); gch.addColorStop(0.4, P.cheveuxF); gch.addColorStop(1, "#0e0b12");
  c.fillStyle = gch;
  c.beginPath();
  c.moveTo(-21, 26);
  c.bezierCurveTo(-28, 34, -29, 58, -26, 80);
  c.lineTo(27, 80);
  c.bezierCurveTo(30, 58, 29, 34, 22, 26);
  c.bezierCurveTo(22.5, 5, 11.5, -2.6, 0.5, -2.8);
  c.bezierCurveTo(-10.5, -2.6, -21.5, 5, -21, 26);
  c.closePath(); c.fill();

  /* épaules et buste */
  var gt = c.createLinearGradient(-24, 46, 24, 78);
  gt.addColorStop(0, P.tenueF); gt.addColorStop(0.55, "#e2ddd4"); gt.addColorStop(1, P.tenueFO);
  c.fillStyle = gt;
  c.beginPath();
  c.moveTo(-25, 80);
  c.bezierCurveTo(-24, 58, -14, 48, 0, 47);
  c.bezierCurveTo(14, 48, 24, 58, 25, 80);
  c.closePath(); c.fill();
  /* plastron sombre */
  var gp = c.createLinearGradient(-14, 50, 14, 80);
  gp.addColorStop(0, P.plastronFC); gp.addColorStop(0.5, P.plastronF); gp.addColorStop(1, "#141418");
  c.fillStyle = gp;
  c.beginPath();
  c.moveTo(-16, 80);
  c.bezierCurveTo(-16, 60, -9, 52, 0, 51);
  c.bezierCurveTo(9, 52, 16, 60, 16, 80);
  c.closePath(); c.fill();
  /* sangles croisées + boucle */
  c.strokeStyle = "#141418"; c.lineWidth = 3.4; c.lineCap = "round";
  c.beginPath(); c.moveTo(-19, 55); c.lineTo(11, 76); c.stroke();
  c.beginPath(); c.moveTo(19, 55); c.lineTo(-11, 76); c.stroke();
  c.fillStyle = "#8d8d96";
  c.fillRect(-4, 62, 8, 6);
  c.fillStyle = P.accent;
  c.fillRect(-2.4, 63.4, 4.8, 3.2);
  /* col */
  c.fillStyle = P.peauFO;
  c.beginPath(); c.ellipse(0, 48, 7, 4, 0, 0, 6.2832); c.fill();

  /* cou */
  c.fillStyle = P.peauFO;
  c.fillRect(-5.4, 38, 10.8, 12);

  /* visage */
  var gv = c.createLinearGradient(-10, 8, 10, 44);
  gv.addColorStop(0, "#f7e2d1"); gv.addColorStop(0.55, P.peauF); gv.addColorStop(1, P.peauFO);
  c.fillStyle = gv;
  c.beginPath();
  c.moveTo(0, 6.5);
  c.bezierCurveTo(9.5, 6.6, 15, 12, 15.4, 21);
  c.bezierCurveTo(15.8, 30, 13, 37, 8.6, 41);
  c.bezierCurveTo(5, 44.2, 2, 45, 0, 45.1);
  c.bezierCurveTo(-2, 45, -5, 44.2, -8.6, 41);
  c.bezierCurveTo(-13, 37, -15.8, 30, -15.4, 21);
  c.bezierCurveTo(-15, 12, -9.5, 6.6, 0, 6.5);
  c.closePath(); c.fill();
  /* ombre du côté droit */
  var go = c.createLinearGradient(4, 0, 16, 0);
  go.addColorStop(0, "rgba(150,96,64,0)");
  go.addColorStop(1, "rgba(150,96,64,.34)");
  c.save();
  c.beginPath();
  c.moveTo(0, 6.5);
  c.bezierCurveTo(9.5, 6.6, 15, 12, 15.4, 21);
  c.bezierCurveTo(15.8, 30, 13, 37, 8.6, 41);
  c.bezierCurveTo(5, 44.2, 2, 45, 0, 45.1);
  c.bezierCurveTo(-2, 45, -5, 44.2, -8.6, 41);
  c.bezierCurveTo(-13, 37, -15.8, 30, -15.4, 21);
  c.bezierCurveTo(-15, 12, -9.5, 6.6, 0, 6.5);
  c.closePath(); c.clip();
  c.fillStyle = go; c.fillRect(-18, 4, 36, 44);
  /* pommettes */
  c.fillStyle = "rgba(214,124,104,.16)";
  c.beginPath(); c.ellipse(-8.6, 30, 5.4, 3.2, -0.2, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(8.6, 30, 5.4, 3.2, 0.2, 0, 6.2832); c.fill();
  c.restore();
  /* yeux en amande, iris sombres */
  [-6.4, 6.4].forEach(function(x, n){
    var sg = n ? 1 : -1;
    c.fillStyle = "#fbf6ef";
    c.beginPath();
    c.moveTo(x - 5 * sg, 25.6);
    c.bezierCurveTo(x - 2.4 * sg, 22.2, x + 3.4 * sg, 22.4, x + 5 * sg, 25.2);
    c.bezierCurveTo(x + 3 * sg, 28.2, x - 2.6 * sg, 28.4, x - 5 * sg, 25.6);
    c.closePath(); c.fill();
    c.fillStyle = "#4b3026";
    c.beginPath(); c.arc(x + 0.4 * sg, 25.3, 2.1, 0, 6.2832); c.fill();
    c.fillStyle = "#0e0a10";
    c.beginPath(); c.arc(x + 0.4 * sg, 25.3, 1.05, 0, 6.2832); c.fill();
    c.fillStyle = "rgba(255,255,255,.9)";
    c.beginPath(); c.arc(x - 0.5 * sg, 24.3, 0.75, 0, 6.2832); c.fill();
    c.strokeStyle = "#1b1118"; c.lineWidth = 1.4; c.lineCap = "round";
    c.beginPath();
    c.moveTo(x - 5.2 * sg, 25.4);
    c.bezierCurveTo(x - 2.4 * sg, 21.8, x + 3.4 * sg, 22.0, x + 5.6 * sg, 24.8);
    c.stroke();
    /* sourcil fin */
    c.strokeStyle = "#38262a"; c.lineWidth = 1.35; c.lineCap = "round";
    c.beginPath();
    c.moveTo(x - 5.0 * sg, 20.6);
    c.quadraticCurveTo(x - 0.4 * sg, 18.4, x + 5.4 * sg, 20.4);
    c.stroke();
  });
  /* nez */
  c.strokeStyle = "rgba(160,104,72,.5)"; c.lineWidth = 1.1;
  c.beginPath(); c.moveTo(0.6, 28.4); c.lineTo(1.2, 33.4); c.stroke();
  c.fillStyle = "rgba(160,104,72,.4)";
  c.beginPath(); c.ellipse(0.4, 34.6, 2.4, 1.1, 0, 0, 6.2832); c.fill();
  /* bouche */
  c.fillStyle = "#bf6a63";
  c.beginPath();
  c.moveTo(-4.4, 38.2);
  c.quadraticCurveTo(-2, 36.4, 0, 37.2);
  c.quadraticCurveTo(2, 36.4, 4.4, 38.2);
  c.quadraticCurveTo(2, 41, 0, 41.1);
  c.quadraticCurveTo(-2, 41, -4.4, 38.2);
  c.closePath(); c.fill();
  c.fillStyle = "rgba(255,220,206,.4)";
  c.beginPath(); c.ellipse(-0.8, 39.6, 1.8, 0.7, 0, 0, 6.2832); c.fill();

  /* frange et bandeaux, raie au milieu */
  c.fillStyle = P.cheveuxF;
  c.beginPath();
  c.moveTo(-18.6, 19);
  c.bezierCurveTo(-19.6, 3, -10, -2.4, 0.6, -2.6);
  c.bezierCurveTo(11.2, -2.4, 20.4, 3, 18.7, 19);
  c.bezierCurveTo(16.4, 14, 11.6, 10.6, 2, 9.8);
  c.bezierCurveTo(-6.4, 10.5, -13.8, 14, -18.6, 19);
  c.closePath(); c.fill();
  /* la frange projette son ombre sur le front */
  var gfr = c.createLinearGradient(0, 9, 0, 19);
  gfr.addColorStop(0, "rgba(78,44,34,.38)");
  gfr.addColorStop(1, "rgba(78,44,34,0)");
  c.fillStyle = gfr;
  c.beginPath();
  c.moveTo(-15.4, 19);
  c.bezierCurveTo(-12, 13.4, -6, 10.4, 2, 9.8);
  c.bezierCurveTo(11, 10.6, 15.6, 14, 16, 19);
  c.closePath(); c.fill();
  /* mèches devant les épaules */
  c.fillStyle = gch;
  c.beginPath();
  c.moveTo(-14.6, 12);
  c.bezierCurveTo(-21, 26, -23, 48, -21, 80);
  c.lineTo(-13, 80);
  c.bezierCurveTo(-13, 50, -11, 30, -8, 20);
  c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(14.6, 12);
  c.bezierCurveTo(21, 26, 23, 48, 21, 80);
  c.lineTo(13, 80);
  c.bezierCurveTo(13, 50, 11, 30, 8, 20);
  c.closePath(); c.fill();
  /* reflets dans les cheveux */
  c.strokeStyle = "rgba(190,200,225,.16)"; c.lineWidth = 2.2;
  c.beginPath(); c.moveTo(-11, 12); c.bezierCurveTo(-17, 26, -18, 50, -17, 74); c.stroke();
  c.beginPath(); c.moveTo(11, 12); c.bezierCurveTo(17, 26, 18, 50, 17, 74); c.stroke();
  c.restore();

  /* le gros fusil, en travers de l'épaule */
  c.save();
  c.translate(74, 30);
  c.rotate(-1.05);
  var ga = c.createLinearGradient(0, -7, 0, 7);
  ga.addColorStop(0, P.armeC); ga.addColorStop(0.45, P.arme); ga.addColorStop(1, P.armeO);
  c.fillStyle = ga;
  c.beginPath();
  if(c.roundRect) c.roundRect(-30, -6.5, 62, 13, 3); else c.rect(-30, -6.5, 62, 13);
  c.fill();
  c.fillStyle = P.armeO;
  c.fillRect(-16, -10, 28, 3.6);
  c.fillStyle = P.armeC;
  for(var r = 0; r < 8; r++) c.fillRect(-14 + r * 3.4, -9.6, 1.6, 2.8);
  c.fillStyle = P.arme;
  c.beginPath();
  c.moveTo(-8, 6); c.lineTo(-1, 6); c.lineTo(-3, 21); c.lineTo(-10, 21);
  c.closePath(); c.fill();
  c.fillStyle = P.armeO;
  c.beginPath();
  c.moveTo(5, 6); c.lineTo(11, 6); c.lineTo(13, 18); c.lineTo(7, 18);
  c.closePath(); c.fill();
  c.fillStyle = "#0f1014";
  c.beginPath(); c.ellipse(33, -0.4, 3, 5, 0, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(125,230,255,.35)";
  c.beginPath(); c.ellipse(33, -0.4, 1.4, 2.6, 0, 0, 6.2832); c.fill();
  c.restore();

  /* main gantée sur la crosse */
  c.save();
  c.translate(70, 52);
  c.fillStyle = "#2b2b2b";
  c.beginPath(); c.ellipse(0, 0, 6.4, 5, -0.4, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,255,255,.14)";
  c.beginPath(); c.ellipse(-1.6, -1.6, 2.6, 1.6, -0.4, 0, 6.2832); c.fill();
  c.restore();

  vignettePortrait(c, H);
}

/* ---------------------------------------------------------------
   LE COMMANDO — buste très large, casque, barbe, gilet tactique
   --------------------------------------------------------------- */
function portraitCommando(c){
  var P = C_PORTRAIT, H = 84;
  fondPortrait(c, H);
  c.save();
  c.translate(50, 6);
  c.lineJoin = "round";

  /* épaules énormes */
  var gg = c.createLinearGradient(-34, 46, 34, 80);
  gg.addColorStop(0, P.giletHC); gg.addColorStop(0.5, P.giletH); gg.addColorStop(1, P.giletHO);
  c.fillStyle = gg;
  c.beginPath();
  c.moveTo(-36, 80);
  c.bezierCurveTo(-35, 54, -20, 45, 0, 44);
  c.bezierCurveTo(20, 45, 35, 54, 36, 80);
  c.closePath(); c.fill();
  /* tee sombre au col */
  c.fillStyle = "#232325";
  c.beginPath();
  c.moveTo(-13, 80);
  c.bezierCurveTo(-13, 54, -7, 46, 0, 45);
  c.bezierCurveTo(7, 46, 13, 54, 13, 80);
  c.closePath(); c.fill();
  /* poches et sangles du gilet */
  c.fillStyle = P.giletHO;
  c.fillRect(-31, 58, 14, 12);
  c.fillRect(17, 58, 14, 12);
  c.strokeStyle = "rgba(28,26,16,.6)"; c.lineWidth = 2;
  c.beginPath(); c.moveTo(-33, 55); c.lineTo(33, 55); c.stroke();
  c.beginPath(); c.moveTo(-15, 70); c.lineTo(15, 70); c.stroke();
  /* bande de cartouches */
  c.fillStyle = P.laiton;
  for(var b = 0; b < 6; b++) c.fillRect(-26 + b * 9, 47, 5, 8);
  /* épaulières */
  c.fillStyle = P.giletHC;
  c.beginPath(); c.ellipse(-30, 52, 10, 7, -0.35, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(30, 52, 10, 7, 0.35, 0, 6.2832); c.fill();

  /* cou épais */
  c.fillStyle = P.peauHO;
  c.fillRect(-8.5, 34, 17, 14);

  /* visage carré */
  var gv = c.createLinearGradient(-12, 8, 12, 44);
  gv.addColorStop(0, "#efc79c"); gv.addColorStop(0.55, P.peauH); gv.addColorStop(1, P.peauHO);
  c.fillStyle = gv;
  c.beginPath();
  c.moveTo(0, 7);
  c.bezierCurveTo(11, 7.2, 16.6, 13, 17, 22);
  c.bezierCurveTo(17.2, 30, 14.4, 36.6, 9.6, 40.4);
  c.bezierCurveTo(6, 43.2, 2.4, 44, 0, 44.1);
  c.bezierCurveTo(-2.4, 44, -6, 43.2, -9.6, 40.4);
  c.bezierCurveTo(-14.4, 36.6, -17.2, 30, -17, 22);
  c.bezierCurveTo(-16.6, 13, -11, 7.2, 0, 7);
  c.closePath(); c.fill();
  /* barbe courte */
  c.fillStyle = P.barbeH;
  c.beginPath();
  c.moveTo(-15.4, 27);
  c.bezierCurveTo(-14.4, 38, -8, 44.4, 0, 44.6);
  c.bezierCurveTo(8, 44.4, 14.4, 38, 15.4, 27);
  c.bezierCurveTo(12.4, 33, 7, 34.6, 0, 34.6);
  c.bezierCurveTo(-7, 34.6, -12.4, 33, -15.4, 27);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(50,36,18,.35)"; c.lineWidth = 0.9;
  for(var k = -4; k <= 4; k++){
    c.beginPath();
    c.moveTo(k * 3, 35 + Math.abs(k) * 0.5);
    c.lineTo(k * 3.4, 41 - Math.abs(k) * 0.9);
    c.stroke();
  }
  /* yeux clairs et sourcils épais */
  [-7, 7].forEach(function(x, n){
    var sg = n ? 1 : -1;
    c.fillStyle = "#f6f2ea";
    c.beginPath(); c.ellipse(x, 25.6, 4.6, 2.7, 0, 0, 6.2832); c.fill();
    c.fillStyle = "#3f5a6c";
    c.beginPath(); c.arc(x + 0.4 * sg, 25.5, 2.1, 0, 6.2832); c.fill();
    c.fillStyle = "#101418";
    c.beginPath(); c.arc(x + 0.4 * sg, 25.5, 0.95, 0, 6.2832); c.fill();
    c.fillStyle = "rgba(255,255,255,.85)";
    c.beginPath(); c.arc(x - 0.6 * sg, 24.6, 0.7, 0, 6.2832); c.fill();
    c.strokeStyle = "#2a2118"; c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(x - 5 * sg, 24.8);
    c.bezierCurveTo(x - 2 * sg, 22.4, x + 3 * sg, 22.6, x + 5.2 * sg, 24.6);
    c.stroke();
    c.strokeStyle = "#544128"; c.lineWidth = 2.1; c.lineCap = "round";
    c.beginPath();
    c.moveTo(x - 5.8 * sg, 19.8);
    c.quadraticCurveTo(x - 0.4 * sg, 17.4, x + 6.0 * sg, 19.9);
    c.stroke();
  });
  /* nez droit */
  c.strokeStyle = "rgba(150,96,60,.55)"; c.lineWidth = 1.3;
  c.beginPath(); c.moveTo(0.6, 27.6); c.lineTo(1.2, 32.6); c.stroke();
  c.fillStyle = "rgba(150,96,60,.45)";
  c.beginPath(); c.ellipse(0.4, 33.6, 3, 1.3, 0, 0, 6.2832); c.fill();
  /* bouche */
  c.strokeStyle = "rgba(120,66,44,.8)"; c.lineWidth = 1.6; c.lineCap = "round";
  c.beginPath(); c.moveTo(-4.4, 38.2); c.quadraticCurveTo(0, 39.4, 4.4, 38.2); c.stroke();

  /* mèches qui dépassent du casque */
  c.fillStyle = P.cheveuxH;
  c.beginPath();
  c.moveTo(-16.6, 20); c.bezierCurveTo(-20, 12, -16, 6, -11, 5);
  c.bezierCurveTo(-13.4, 10, -14.6, 15, -14, 20);
  c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(16.6, 20); c.bezierCurveTo(20, 12, 16, 6, 11, 5);
  c.bezierCurveTo(13.4, 10, 14.6, 15, 14, 20);
  c.closePath(); c.fill();

  /* casque */
  var gc = c.createLinearGradient(-18, -6, 18, 16);
  gc.addColorStop(0, P.casqueHC); gc.addColorStop(0.55, P.casqueH); gc.addColorStop(1, P.casqueHO);
  c.fillStyle = gc;
  c.beginPath();
  c.moveTo(-18.4, 20);
  c.bezierCurveTo(-19.6, 1, -11, -8, 0, -8.2);
  c.bezierCurveTo(11, -8, 19.6, 1, 18.4, 20);
  c.bezierCurveTo(14, 13, 8, 10.4, 0, 10.2);
  c.bezierCurveTo(-8, 10.4, -14, 13, -18.4, 20);
  c.closePath(); c.fill();
  /* rails, cache-oreilles et accessoire frontal */
  c.fillStyle = P.casqueHO;
  c.fillRect(-20.4, 12, 6, 9);
  c.fillRect(14.4, 12, 6, 9);
  c.fillStyle = P.casqueHC;
  c.fillRect(-5, -10.6, 10, 4);
  c.fillStyle = "#2f2c22";
  c.fillRect(-3.2, -9.6, 6.4, 2.4);
  c.strokeStyle = "rgba(255,255,255,.26)"; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(-14, 6); c.quadraticCurveTo(-7, -5, 2, -6.4); c.stroke();
  /* jugulaire */
  c.strokeStyle = "rgba(40,38,28,.85)"; c.lineWidth = 1.8;
  c.beginPath(); c.moveTo(-16.6, 20); c.lineTo(-11, 36); c.stroke();
  c.beginPath(); c.moveTo(16.6, 20); c.lineTo(11, 36); c.stroke();
  c.restore();

  /* le fusil tenu en travers */
  c.save();
  c.translate(24, 62);
  c.rotate(-0.42);
  var ga = c.createLinearGradient(0, -5, 0, 5);
  ga.addColorStop(0, "#5a5a52"); ga.addColorStop(0.45, "#35352f"); ga.addColorStop(1, "#1e1e1a");
  c.fillStyle = ga;
  c.beginPath();
  if(c.roundRect) c.roundRect(-26, -4.6, 54, 9.2, 2.4); else c.rect(-26, -4.6, 54, 9.2);
  c.fill();
  c.fillStyle = "#5a5a52";
  c.fillRect(-12, -7.6, 22, 3);
  c.fillStyle = "#35352f";
  c.beginPath();
  c.moveTo(-6, 4.6); c.lineTo(0, 4.6); c.lineTo(-1.6, 17); c.lineTo(-7.6, 17);
  c.closePath(); c.fill();
  c.fillStyle = "#0f1010";
  c.beginPath(); c.ellipse(29, -0.2, 2.2, 3.6, 0, 0, 6.2832); c.fill();
  c.restore();
  /* main gantée */
  c.save();
  c.translate(30, 70);
  c.fillStyle = "#2b2b2b";
  c.beginPath(); c.ellipse(0, 0, 7.4, 5.6, -0.3, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,255,255,.13)";
  c.beginPath(); c.ellipse(-1.8, -1.8, 3, 1.8, -0.3, 0, 6.2832); c.fill();
  c.restore();

  vignettePortrait(c, H);
}

/* ---------------------------------------------------------------
   LE DOC — buste trois quarts, blouse blanche, chapeau bas

   Sa case du briefing était VIDE : PORTRAITS n'avait que la Furie et
   le Commando, et le repli « window.portraitOgre » ne pouvait pas
   deviner un portrait que personne n'avait dessiné. Une troupe qu'on
   peut embarquer sans jamais voir son visage n'existe qu'à moitié.

   Le cahier des charges tient en deux mots : BLOUSE BLANCHE, et un
   air louche. Le premier se règle par la surface — la blouse occupe
   presque tout le buste, c'est la plus grande tache claire du menu,
   on ne peut pas la manquer à côté du noir de la Furie et du kaki du
   Commando. Le second se règle par ce qu'on NE voit pas : le chapeau
   descend jusqu'aux verres, les verres sont opaques, et le regard
   part de côté. On lui laisse la mâchoire, le nez et la bouche —
   assez pour que ce soit un visage, pas assez pour savoir à qui on a
   affaire.
   --------------------------------------------------------------- */
var C_DOCP = {
  blouse:"#f2ede0", blouseC:"#fffdf6", blouseO:"#bfb8a6",
  dessous:"#2b2732", dessousC:"#403a4c",
  chapeau:"#241f19", chapeauC:"#3b332a", ruban:"#15120e",
  peau:"#e6c49f", peauO:"#b8916c",
  verre:"#191920", verreC:"#3a3b46", monture:"#0d0d10",
  croix:"#c23a30", croixC:"#e86152", fiole:"#8ce6a8", laiton:"#c9a24a"
};
function portraitDoc(c){
  var H = 84, D = C_DOCP, i;
  fondPortrait(c, H);
  c.save();
  c.translate(50, 6);
  c.lineJoin = "round";

  /* --- LA BLOUSE. Elle part large des épaules et descend hors cadre :
     c'est la masse claire du portrait, et tout le reste se pose
     dessus. --- */
  var gb = c.createLinearGradient(-30, 44, 30, 80);
  gb.addColorStop(0, D.blouseC); gb.addColorStop(0.55, D.blouse);
  gb.addColorStop(1, D.blouseO);
  c.fillStyle = gb;
  c.beginPath();
  c.moveTo(-33, 80);
  c.bezierCurveTo(-32, 55, -18, 46, 0, 45);
  c.bezierCurveTo(18, 46, 32, 55, 33, 80);
  c.closePath(); c.fill();

  /* le col ouvert en V, et ce qu'il porte dessous : sombre, fermé,
     cravate étroite — le contraste qui empêche la blouse de virer au
     tablier de boucher */
  c.fillStyle = D.dessous;
  c.beginPath();
  c.moveTo(-9, 47); c.lineTo(0, 66); c.lineTo(9, 47);
  c.lineTo(6, 45.4); c.lineTo(0, 57); c.lineTo(-6, 45.4);
  c.closePath(); c.fill();
  c.fillStyle = D.dessousC;
  c.beginPath();
  c.moveTo(-2.4, 58); c.lineTo(2.4, 58); c.lineTo(1.6, 80); c.lineTo(-1.6, 80);
  c.closePath(); c.fill();
  /* les deux revers de la blouse, posés par-dessus */
  c.fillStyle = D.blouseC;
  c.beginPath();
  c.moveTo(-10.4, 46); c.lineTo(-1.2, 67); c.lineTo(-15.4, 52);
  c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(10.4, 46); c.lineTo(1.2, 67); c.lineTo(15.4, 52);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(140,132,116,.55)"; c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(-10.4, 46); c.lineTo(-1.2, 67); c.stroke();
  c.beginPath(); c.moveTo(10.4, 46); c.lineTo(1.2, 67); c.stroke();
  /* poche poitrine, boutons, et la croix rouge — le seul accent franc */
  c.strokeStyle = D.blouseO; c.lineWidth = 1.1;
  c.strokeRect(-29, 58, 13, 11);
  c.fillStyle = D.croix;
  c.fillRect(-23.8, 60.4, 2.6, 7.4);
  c.fillRect(-27.2, 63, 7.4, 2.6);
  c.fillStyle = D.croixC;
  c.fillRect(-23.8, 60.4, 2.6, 3.2);
  c.fillStyle = D.blouseO;
  for(i = 0; i < 3; i++){ c.beginPath(); c.arc(6.4, 60 + i * 8, 1.5, 0, 6.2832); c.fill(); }
  /* la fiole qui dépasse de la poche : on est bien chez un soignant */
  c.fillStyle = D.fiole;
  c.beginPath();
  if(c.roundRect) c.roundRect(-25.6, 52.6, 4.4, 7.4, 1.4);
  else c.rect(-25.6, 52.6, 4.4, 7.4);
  c.fill();
  c.fillStyle = "rgba(255,255,255,.6)";
  c.fillRect(-25.0, 53.4, 1.3, 4.4);
  c.fillStyle = D.laiton;
  c.fillRect(-25.8, 51.4, 4.8, 1.8);

  /* --- cou, dans l'ombre du col --- */
  c.fillStyle = D.peauO;
  c.fillRect(-6.4, 36, 12.8, 12);

  /* --- LE VISAGE, tourné de trois quarts. Il est plus étroit que
     celui du Commando : le Doc n'est pas un gabarit, c'est un
     civil. --- */
  var gv = c.createLinearGradient(-11, 10, 11, 44);
  gv.addColorStop(0, "#f0d3ae"); gv.addColorStop(0.55, D.peau);
  gv.addColorStop(1, D.peauO);
  c.fillStyle = gv;
  c.beginPath();
  c.moveTo(1.5, 9);
  c.bezierCurveTo(11, 9.4, 15.4, 15, 15.4, 23);
  c.bezierCurveTo(15.4, 31, 12, 38.4, 6.6, 41.6);
  c.bezierCurveTo(3.6, 43.4, 0, 43.6, -2.2, 42.4);
  c.bezierCurveTo(-8, 39.4, -12.4, 32, -12.6, 23);
  c.bezierCurveTo(-12.8, 15, -8, 9.4, 1.5, 9);
  c.closePath(); c.fill();
  /* la mâchoire mal rasée : trois jours, pas une barbe */
  c.fillStyle = "rgba(44,34,26,.30)";
  c.beginPath();
  c.moveTo(-11.6, 28);
  c.bezierCurveTo(-10.6, 37, -5, 43, 1.4, 43.2);
  c.bezierCurveTo(8, 42.6, 13.4, 36, 14.4, 28);
  c.bezierCurveTo(11.4, 33.4, 6.6, 35, 1.4, 35);
  c.bezierCurveTo(-4.6, 35, -8.6, 33.4, -11.6, 28);
  c.closePath(); c.fill();
  /* nez et bouche : le peu de visage qu'on lui laisse */
  c.strokeStyle = "rgba(150,105,66,.55)"; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(2.6, 26); c.lineTo(3.6, 31.6); c.stroke();
  c.fillStyle = "rgba(150,105,66,.42)";
  c.beginPath(); c.ellipse(2.6, 32.6, 2.7, 1.2, 0, 0, 6.2832); c.fill();
  c.strokeStyle = "rgba(112,62,42,.75)"; c.lineWidth = 1.5; c.lineCap = "round";
  c.beginPath(); c.moveTo(-2.4, 37.4); c.quadraticCurveTo(2, 38, 6.4, 36.8); c.stroke();

  /* --- LES LUNETTES NOIRES, RONDES. Deux disques opaques : aucun
     regard ne sort de là, et c'est exactement ce qu'on cherche. --- */
  c.strokeStyle = D.monture; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(-3.2, 23.4); c.lineTo(3.2, 23.4); c.stroke();
  c.beginPath(); c.moveTo(-12.4, 22.4); c.lineTo(-9.6, 23.2); c.stroke();
  [[-6.4, 23.6], [6.6, 23.4]].forEach(function(v){
    c.fillStyle = D.verre;
    c.beginPath(); c.arc(v[0], v[1], 5.2, 0, 6.2832); c.fill();
    /* un seul reflet oblique, court : deux verres bien noirs valent
       mieux qu'un reflet bavard */
    c.fillStyle = D.verreC;
    c.save(); c.translate(v[0], v[1]); c.rotate(-0.7);
    c.beginPath(); c.ellipse(-1.4, -1.2, 2.6, 0.9, 0, 0, 6.2832); c.fill();
    c.restore();
    c.strokeStyle = D.monture; c.lineWidth = 1.6;
    c.beginPath(); c.arc(v[0], v[1], 5.2, 0, 6.2832); c.stroke();
  });

  /* --- LE CHAPEAU, RABATTU. Le bord passe juste au-dessus des verres
     et coupe le front entier : c'est la silhouette du personnage, et
     c'est ce qui le distingue de loin de la Furie et du Commando. --- */
  c.fillStyle = D.chapeau;
  c.beginPath();
  c.ellipse(1, 16.6, 26, 6.2, -0.045, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(0,0,0,.30)";
  c.beginPath();
  c.ellipse(1, 18.4, 24, 4.4, -0.045, 0, 6.2832); c.fill();
  /* la calotte, avec son pli */
  var gc = c.createLinearGradient(-14, -6, 16, 16);
  gc.addColorStop(0, D.chapeauC); gc.addColorStop(1, D.chapeau);
  c.fillStyle = gc;
  c.beginPath();
  c.moveTo(-13.6, 16.4);
  c.bezierCurveTo(-14.4, 1.6, -8, -5.4, 1.4, -5.6);
  c.bezierCurveTo(10.8, -5.4, 16.6, 1.6, 15.8, 16.4);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(0,0,0,.45)"; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(-3.4, -4.6); c.quadraticCurveTo(1.2, 2.4, 5.6, -4.4); c.stroke();
  /* le ruban */
  c.fillStyle = D.ruban;
  c.beginPath();
  c.moveTo(-13.9, 14.4);
  c.bezierCurveTo(-9, 11.4, 11, 11.4, 16, 14.4);
  c.lineTo(15.9, 17.2);
  c.bezierCurveTo(11, 14.2, -9, 14.2, -13.8, 17.2);
  c.closePath(); c.fill();
  c.fillStyle = D.laiton;
  c.fillRect(9.4, 12.4, 3, 3);

  c.restore();
  vignettePortrait(c, H);
}

var PORTRAITS = { furie:{ f:portraitFurie, h:84 }, commando:{ f:portraitCommando, h:84 },
                  doc:{ f:portraitDoc, h:84 } };

/* Dessine le portrait dans un rectangle de largeur donnée. */
function dessinePortrait(c, cle, x, y, larg){
  var p = PORTRAITS[cle];
  /* Une troupe peut apporter son propre portrait depuis un fichier
     chargé APRÈS celui-ci — c'est le cas de l'Ogre, qui vit dans
     62-ogre.js. On résout donc « portraitOgre » au premier appel plutôt
     qu'au chargement, où la fonction n'existe pas encore. */
  if(!p){
    var f = (typeof window !== "undefined")
          ? window["portrait" + cle.charAt(0).toUpperCase() + cle.slice(1)] : null;
    if(typeof f === "function") p = PORTRAITS[cle] = { f:f, h:84 };
  }
  if(!p) return;
  var k = larg / 100;
  c.save();
  c.translate(x, y);
  c.scale(k, k);
  p.f(c);
  c.restore();
}
