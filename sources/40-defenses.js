/* ================================================================
   LES CINQ DÉFENSES (+ réservoir et entrepôt)
   Le socle est pré-rendu une fois dans un sprite ; la tourelle est
   redessinée en direct par-dessus, orientée vers sa cible.
   ================================================================ */

var ECH_SPRITE = 1.5;               // sur-échantillonnage des sprites
var SP_W = 240, SP_H = 220, SP_OX = 120, SP_OY = 162;
var SPRITE_DEF = {};

/* Direction d'un angle du monde, projetée à l'écran (vecteur unitaire
   + facteur de raccourcissement) */
function vecteurEcran(ang){
  var cx = Math.cos(ang), cy = Math.sin(ang);
  var x = (cx - cy) * TW / 2, y = (cx + cy) * TH / 2;
  var l = Math.hypot(x, y) || 1;
  return { x:x / l, y:y / l, l:l };
}
/* Polygone défini dans le repère (avant, côté) de la tourelle */
function polyDir(c, ox, oy, d, pts, coul, contour){
  var nx = -d.y, ny = d.x;
  c.beginPath();
  for(var i = 0; i < pts.length; i++){
    var a = pts[i][0], b = pts[i][1];
    var x = ox + d.x * a + nx * b, y = oy + d.y * a + ny * b;
    if(i === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.closePath();
  if(coul){ c.fillStyle = coul; c.fill(); }
  if(contour){ c.strokeStyle = contour; c.lineWidth = 1; c.stroke(); }
}
function ptDir(ox, oy, d, a, b){
  return { x:ox + d.x * a - d.y * b, y:oy + d.y * a + d.x * b };
}

/* ================================================================
   SOCLES — dessinés une fois dans le sprite
   ================================================================ */
var SOCLES = {};

/* ---------------- Mitrailleuse ---------------- */
SOCLES.crible = function(c){
  ombreContact(c, 0, 0, 2.2, 2.2, 0.24);
  /* plateforme béton octogonale sur deux niveaux */
  prisme(c, 0, 0, 1.02, 8, 0.3927, 0, 8,  "#9b978d", "#615e58");
  prisme(c, 0, 0, 0.80, 8, 0.3927, 8, 6,  "#a9a598", "#6d6a63");
  /* joints de dalle */
  c.save(); c.globalAlpha = 0.25; c.strokeStyle = "#4b4944"; c.lineWidth = 1;
  for(var k = 0; k < 4; k++){
    var a = k / 4 * 6.2832 + 0.4;
    var p1 = iso(Math.cos(a) * 0.2, Math.sin(a) * 0.2), p2 = iso(Math.cos(a) * 0.78, Math.sin(a) * 0.78);
    c.beginPath(); c.moveTo(p1.x, p1.y - 14); c.lineTo(p2.x, p2.y - 14); c.stroke();
  }
  c.restore();
  /* couronne de neuf sacs de sable */
  sacs(c, 0, 0, 0.86, 14, 9, "#a89a6e", "#8d8054", 4711);
  /* deux caisses de munitions vertes ouvertes */
  function caisse(gx, gy, rot){
    var f = faces("#4b6a37");
    boite(c, gx, gy, 0.46, 0.32, 14, 10, f.t, f.g, f.d);
    var p = iso(gx, gy);
    /* couvercle relevé */
    c.fillStyle = ecl("#4b6a37", 0.85);
    c.beginPath();
    c.moveTo(p.x - 9, p.y - 24); c.lineTo(p.x + 5, p.y - 33);
    c.lineTo(p.x + 14, p.y - 28); c.lineTo(p.x, p.y - 20);
    c.closePath(); c.fill();
    /* bandes de cartouches qui pendent */
    c.strokeStyle = "#c8a13c"; c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(p.x + 2, p.y - 22);
    c.quadraticCurveTo(p.x + 12, p.y - 16, p.x + 9, p.y - 4);
    c.stroke();
    c.fillStyle = "#e0b84a";
    for(var i = 0; i < 5; i++){
      var tt = i / 4;
      var xx = p.x + 2 + (12 - 2) * tt * 1.1, yy = p.y - 22 + (18) * tt * tt;
      c.fillRect(xx - 1.4, yy - 1.4, 2.8, 3.4);
    }
    c.fillStyle = "rgba(255,255,255,.14)";
    c.fillRect(p.x - 10, p.y - 23, 20, 2);
  }
  caisse(-0.62, 0.5);
  caisse(0.55, 0.62);
  /* piquet avec chiffon */
  var q = iso(0.72, -0.62);
  c.strokeStyle = "#6b5a42"; c.lineWidth = 2.6; c.lineCap = "round";
  c.beginPath(); c.moveTo(q.x, q.y - 14); c.lineTo(q.x, q.y - 36); c.stroke();
  c.fillStyle = "#b8493a";
  c.beginPath();
  c.moveTo(q.x, q.y - 34); c.quadraticCurveTo(q.x + 13, q.y - 32, q.x + 10, q.y - 24);
  c.quadraticCurveTo(q.x + 6, q.y - 26, q.x, q.y - 24);
  c.closePath(); c.fill();
  /* douilles au sol */
  c.fillStyle = "#c9a54a";
  for(var i = 0; i < 14; i++){
    var a2 = i * 2.3, r2 = 0.5 + (i % 5) * 0.12;
    var pp = iso(Math.cos(a2) * r2, Math.sin(a2) * r2);
    c.fillRect(pp.x, pp.y - 14, 2, 1.4);
  }
};

/* ---------------- Lance-chalumeau ---------------- */
SOCLES.chalumeau = function(c){
  ombreContact(c, 0, 0, 2.2, 2.2, 0.24);
  /* dalle avec bandes d'avertissement */
  bandesDanger(c, 0, 0, 1.9, 1.9, 0, 8);
  c.save(); c.globalAlpha = 0.35; plaque(c, 0, 0, 1.9, 1.9, 0, "#20201e"); c.restore();
  /* socle de tôle */
  var f = faces("#6d6a63");
  boite(c, 0, 0, 1.35, 1.35, 0, 9, f.t, f.g, f.d);
  c.save(); c.globalAlpha = 0.2; c.fillStyle = "#000";
  var pl = iso(0, 0); c.fillRect(pl.x - 30, pl.y - 9, 60, 2); c.restore();
  /* boulons */
  c.fillStyle = "#4a4844";
  for(var i = 0; i < 8; i++){
    var a = i / 8 * 6.2832, p = iso(Math.cos(a) * 0.6, Math.sin(a) * 0.6);
    c.beginPath(); c.arc(p.x, p.y - 9, 1.6, 0, 6.2832); c.fill();
  }
  /* deux bonbonnes rouges à valves et manomètres */
  function bonbonne(gx, gy){
    cylindre(c, gx, gy, 0.26, 9, 26, "#d64432", "#a52f22");
    var p = iso(gx, gy);
    /* bandeau */
    c.fillStyle = "rgba(255,255,255,.25)";
    c.fillRect(p.x - 0.26 * RX, p.y - 9 - 18, 0.52 * RX, 3);
    /* col + valve */
    cylindre(c, gx, gy, 0.10, 35, 5, "#8d8a82", "#6a6761");
    c.fillStyle = "#c8c4b8";
    c.beginPath(); c.arc(p.x, p.y - 42, 3.2, 0, 6.2832); c.fill();
    /* manomètre */
    c.fillStyle = "#e8e4d8";
    c.beginPath(); c.arc(p.x + 6, p.y - 36, 3.4, 0, 6.2832); c.fill();
    c.strokeStyle = "#c33"; c.lineWidth = 1;
    c.beginPath(); c.moveTo(p.x + 6, p.y - 36); c.lineTo(p.x + 8, p.y - 38); c.stroke();
  }
  bonbonne(-0.42, -0.30);
  bonbonne(-0.08, -0.52);
  /* tuyau souple qui serpente jusqu'à la lance */
  var a1 = iso(-0.25, -0.4), b1 = iso(0.18, 0.3);
  c.strokeStyle = "#2a2a2c"; c.lineWidth = 4.4; c.lineCap = "round";
  c.beginPath();
  c.moveTo(a1.x, a1.y - 34);
  c.bezierCurveTo(a1.x + 16, a1.y - 6, b1.x - 22, b1.y - 4, b1.x, b1.y - 18);
  c.stroke();
  c.strokeStyle = "#464648"; c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(a1.x, a1.y - 35);
  c.bezierCurveTo(a1.x + 16, a1.y - 7, b1.x - 22, b1.y - 5, b1.x, b1.y - 19);
  c.stroke();
  /* réserve de fioul + salissures */
  var f2 = faces("#4d4b46");
  boite(c, 0.5, -0.2, 0.4, 0.5, 9, 12, f2.t, f2.g, f2.d);
  salissures(c, -22, -9, 44, 16, 7, 991);
};

/* ---------------- Lance-frelon ---------------- */
SOCLES.frelon = function(c){
  ombreContact(c, 0, 0, 3.0, 3.0, 0.25);
  /* quatre vérins hydrauliques */
  var coins = [[-0.95, -0.95], [0.95, -0.95], [0.95, 0.95], [-0.95, 0.95]];
  coins.sort(function(a, b){ return (a[0] + a[1]) - (b[0] + b[1]); });
  for(var i = 0; i < 4; i++){
    var v = coins[i];
    cylindre(c, v[0], v[1], 0.20, 0, 8, "#5a5852", "#3d3b37");     // pied
    cylindre(c, v[0], v[1], 0.11, 8, 16, "#c9c6bc", "#8e8b83");    // tige chromée
    var p = iso(v[0], v[1]);
    c.fillStyle = "rgba(255,255,255,.35)";
    c.fillRect(p.x - 1.5, p.y - 22, 1.4, 12);
  }
  /* plateforme */
  var f = faces("#6f6c64");
  boite(c, 0, 0, 1.9, 1.9, 24, 8, f.t, f.g, f.d);
  c.save(); c.globalAlpha = 0.35; c.strokeStyle = "#2f2d2a"; c.lineWidth = 1;
  var o = iso(0, 0);
  for(var k = -2; k <= 2; k++){
    var s1 = iso(-0.95, k * 0.4), s2 = iso(0.95, k * 0.4);
    c.beginPath(); c.moveTo(s1.x, s1.y - 32); c.lineTo(s2.x, s2.y - 32); c.stroke();
  }
  c.restore();
  /* boîtier de commande avec diodes (les diodes sont animées en direct) */
  var f2 = faces("#3c4a55");
  boite(c, -0.66, 0.62, 0.44, 0.34, 32, 14, f2.t, f2.g, f2.d);
  /* mât du radar */
  cylindre(c, 0.72, -0.66, 0.09, 32, 26, "#8e8b83", "#5d5a55");
  /* garde-corps */
  c.strokeStyle = "#7d7a72"; c.lineWidth = 1.6;
  var cc = [[-0.95, 0.95], [0.95, 0.95], [0.95, -0.95]];
  for(var j = 0; j < cc.length - 1; j++){
    var q1 = iso(cc[j][0], cc[j][1]), q2 = iso(cc[j + 1][0], cc[j + 1][1]);
    c.beginPath(); c.moveTo(q1.x, q1.y - 32); c.lineTo(q1.x, q1.y - 44);
    c.lineTo(q2.x, q2.y - 44); c.lineTo(q2.x, q2.y - 32); c.stroke();
  }
};

/* ---------------- Mortier ---------------- */
SOCLES.pilon = function(c){
  ombreContact(c, 0, 0, 3.0, 3.0, 0.25);
  /* dalle de béton */
  prisme(c, 0, 0, 1.35, 6, 0.5, 0, 9, "#a19d92", "#67645e");
  /* fosse creusée : anneau sombre en creux */
  var p = iso(0, 0);
  c.save();
  c.fillStyle = "#3a3833";
  c.beginPath(); c.ellipse(p.x, p.y - 9, 0.82 * RX, 0.82 * RY, 0, 0, 6.2832); c.fill();
  var g = c.createRadialGradient(p.x, p.y - 13, 2, p.x, p.y - 9, 0.82 * RX);
  g.addColorStop(0, "rgba(0,0,0,.75)"); g.addColorStop(1, "rgba(0,0,0,.1)");
  c.fillStyle = g;
  c.beginPath(); c.ellipse(p.x, p.y - 9, 0.82 * RX, 0.82 * RY, 0, 0, 6.2832); c.fill();
  c.fillStyle = "#5a564e";
  c.beginPath(); c.ellipse(p.x, p.y - 4, 0.55 * RX, 0.55 * RY, 0, 0, 6.2832); c.fill();
  c.restore();
  /* couronne de dix sacs de sable */
  sacs(c, 0, 0, 1.06, 9, 10, "#9d9068", "#847955", 8123);
  /* râtelier de trois obus jaunes */
  var f = faces("#4a4740");
  boite(c, 1.0, 0.5, 0.5, 0.3, 9, 6, f.t, f.g, f.d);
  for(var i = 0; i < 3; i++){
    var gx = 0.86 + i * 0.14, gy = 0.5 - i * 0.02;
    var q = iso(gx, gy);
    c.save();
    c.translate(q.x, q.y - 15); c.rotate(-0.32);
    c.fillStyle = "#d8b52e";
    c.beginPath(); c.roundRect ? c.roundRect(-3, -13, 6, 18, 2) : c.rect(-3, -13, 6, 18);
    c.fill();
    c.fillStyle = "#8c8a84";
    c.beginPath(); c.moveTo(-3, -12); c.lineTo(0, -19); c.lineTo(3, -12); c.closePath(); c.fill();
    c.fillStyle = "rgba(255,255,255,.28)"; c.fillRect(-2.6, -12, 1.6, 16);
    c.restore();
  }
  /* traces de suie */
  c.save(); c.globalAlpha = 0.16; c.fillStyle = "#000";
  for(var k = 0; k < 10; k++){
    var a = k * 1.7, r = 0.9 + (k % 3) * 0.15;
    var pp = iso(Math.cos(a) * r, Math.sin(a) * r);
    c.beginPath(); c.ellipse(pp.x, pp.y - 9, 7, 3.4, 0, 0, 6.2832); c.fill();
  }
  c.restore();
};

/* ---------------- Lance-électrobombes ---------------- */
SOCLES.bobine = function(c){
  ombreContact(c, 0, 0, 2.2, 2.2, 0.24);
  prisme(c, 0, 0, 0.98, 6, 0.2, 0, 8, "#8d8a82", "#5b5954");
  /* quatre isolateurs en céramique blanche à collerettes */
  var coins = [[-0.62, -0.62], [0.62, -0.62], [0.62, 0.62], [-0.62, 0.62]];
  coins.sort(function(a, b){ return (a[0] + a[1]) - (b[0] + b[1]); });
  for(var i = 0; i < 4; i++){
    var v = coins[i];
    for(var k = 0; k < 4; k++){
      cylindre(c, v[0], v[1], 0.17 - k * 0.005, 8 + k * 6, 3, "#f0ece0", "#c8c2b2");
      cylindre(c, v[0], v[1], 0.10, 11 + k * 6, 3, "#e2ddcf", "#b5ae9e");
    }
    cylindre(c, v[0], v[1], 0.09, 32, 4, "#8e8b83", "#5d5a55");
  }
  /* colonne centrale à anneaux de cuivre étagés */
  cylindre(c, 0, 0, 0.30, 8, 10, "#4a4844", "#33312e");
  for(var j = 0; j < 5; j++){
    var z = 18 + j * 7;
    cylindre(c, 0, 0, 0.26 - j * 0.018, z, 4, "#e0913c", "#a8632a");
    cylindre(c, 0, 0, 0.20 - j * 0.016, z + 4, 3, "#3c3a36", "#2a2825");
  }
  /* deux condensateurs cyan sur les flancs */
  function conda(gx, gy){
    cylindre(c, gx, gy, 0.15, 10, 20, "#2c8fa8", "#1c6b80");
    var p = iso(gx, gy);
    c.fillStyle = "rgba(125,230,255,.55)";
    c.fillRect(p.x - 2, p.y - 27, 4, 12);
    c.fillStyle = "#cfe9f2";
    c.beginPath(); c.arc(p.x, p.y - 31, 2.4, 0, 6.2832); c.fill();
  }
  conda(-0.5, 0.16);
  conda(0.16, 0.5);
  /* câbles */
  c.strokeStyle = "#26241f"; c.lineWidth = 1.8;
  for(var m = 0; m < 4; m++){
    var v2 = coins[m], p1 = iso(v2[0], v2[1]), p2 = iso(0, 0);
    c.beginPath();
    c.moveTo(p1.x, p1.y - 34);
    c.quadraticCurveTo((p1.x + p2.x) / 2, (p1.y + p2.y) / 2 - 26, p2.x, p2.y - 46);
    c.stroke();
  }
};

/* ---------------- Réservoir ---------------- */
SOCLES.cuve = function(c){
  ombreContact(c, 0, 0, 2.1, 2.1, 0.24);
  prisme(c, 0, 0, 0.9, 8, 0.3927, 0, 6, "#8d8a82", "#5b5954");
  cylindre(c, 0, 0, 0.62, 6, 30, "#b0873c", "#7d5f27");
  var p = iso(0, 0);
  c.save();
  c.globalAlpha = 0.5; c.strokeStyle = "#5d4519"; c.lineWidth = 1.4;
  for(var i = 0; i < 3; i++){
    c.beginPath(); c.ellipse(p.x, p.y - 12 - i * 9, 0.62 * RX, 0.62 * RY, 0, 0.15, Math.PI - 0.15); c.stroke();
  }
  c.restore();
  /* échelle */
  c.strokeStyle = "#6a6761"; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(p.x + 18, p.y - 6); c.lineTo(p.x + 18, p.y - 36); c.stroke();
  c.beginPath(); c.moveTo(p.x + 24, p.y - 8); c.lineTo(p.x + 24, p.y - 34); c.stroke();
  for(var k = 0; k < 5; k++){
    c.beginPath(); c.moveTo(p.x + 18, p.y - 10 - k * 6); c.lineTo(p.x + 24, p.y - 11 - k * 6); c.stroke();
  }
  /* coupole + tuyauterie */
  cylindre(c, 0, 0, 0.32, 36, 6, "#c49647", "#8d6c2c");
  c.strokeStyle = "#4a4844"; c.lineWidth = 3;
  c.beginPath(); c.moveTo(p.x - 6, p.y - 42); c.lineTo(p.x - 22, p.y - 30); c.lineTo(p.x - 22, p.y - 8); c.stroke();
  salissures(c, p.x - 22, p.y - 34, 44, 28, 8, 313);
  c.fillStyle = "#d8c060";
  c.font = "bold 9px sans-serif"; c.textAlign = "center";
  c.fillText("⛽", p.x, p.y - 20);
};

/* ---------------- Entrepôt ---------------- */
SOCLES.silo = function(c){
  ombreContact(c, 0, 0, 3.0, 3.0, 0.25);
  var f = faces("#7c6a4e");
  boite(c, 0, 0, 2.0, 1.7, 0, 26, f.t, f.g, f.d);
  /* toit en tôle ondulée */
  var f2 = faces("#8f5a3a");
  boite(c, 0, 0, 2.15, 1.85, 26, 5, f2.t, f2.g, f2.d);
  var p = iso(0, 0);
  c.save(); c.globalAlpha = 0.30; c.strokeStyle = "#3a2418"; c.lineWidth = 1;
  for(var i = -8; i <= 8; i++){
    var a = iso(i * 0.13, -0.92), b = iso(i * 0.13, 0.92);
    c.beginPath(); c.moveTo(a.x, a.y - 31); c.lineTo(b.x, b.y - 31); c.stroke();
  }
  c.restore();
  /* porte coulissante */
  var d1 = iso(1.0, -0.4), d2 = iso(1.0, 0.4);
  c.fillStyle = "#4a3c2a";
  c.beginPath();
  c.moveTo(d1.x, d1.y - 22); c.lineTo(d2.x, d2.y - 22);
  c.lineTo(d2.x, d2.y - 2); c.lineTo(d1.x, d1.y - 2);
  c.closePath(); c.fill();
  c.strokeStyle = "#6b5940"; c.lineWidth = 1.4; c.stroke();
  /* caisses devant */
  var f3 = faces("#a5854e");
  boite(c, 1.25, 0.55, 0.42, 0.42, 0, 12, f3.t, f3.g, f3.d);
  boite(c, 1.32, 0.05, 0.36, 0.36, 0, 10, f3.t, f3.g, f3.d);
  salissures(c, p.x - 30, p.y - 26, 60, 24, 9, 555);
};

/* ================================================================
   Construction des sprites
   ================================================================ */
function construitSpritesDefenses(){
  Object.keys(SOCLES).forEach(function(t){
    var cv = nouveauCanvas(SP_W * ECH_SPRITE, SP_H * ECH_SPRITE);
    var c = cv.getContext("2d");
    c.setTransform(ECH_SPRITE, 0, 0, ECH_SPRITE, SP_OX * ECH_SPRITE, SP_OY * ECH_SPRITE);
    SOCLES[t](c);
    SPRITE_DEF[t] = cv;
  });
}

/* ================================================================
   TOURELLES — redessinées en direct, orientées vers la cible
   ================================================================ */
var TOURELLES = {};

TOURELLES.crible = function(c, b, ang, tps){
  var d = vecteurEcran(ang);
  var o = { x:0, y:-22 };
  var rec = b.recul || 0;
  /* affût */
  cylindre(c, 0, 0, 0.26, 14, 5, "#77746c", "#4f4c47");
  /* tambour de munitions sur le côté */
  var td = ptDir(o.x, o.y, d, -2, 7);
  c.fillStyle = "#5f6b45";
  c.beginPath(); c.ellipse(td.x, td.y, 5.4, 4.4, 0, 0, 6.2832); c.fill();
  c.fillStyle = "#3f4a2c";
  c.beginPath(); c.ellipse(td.x + 1, td.y + 1, 3.2, 2.6, 0, 0, 6.2832); c.fill();
  /* corps */
  polyDir(c, o.x, o.y, d, [[-7, -4], [6, -4], [6, 4], [-7, 4]], "#5c5952");
  /* deux canons jumelés */
  var lg = 17 - rec * 3;
  polyDir(c, o.x - d.x * rec * 2, o.y - d.y * rec * 2, d, [[2, -3.2], [lg, -2.3], [lg, -0.9], [2, -1.5]], "#2f2d2b");
  polyDir(c, o.x - d.x * rec * 2, o.y - d.y * rec * 2, d, [[2, 1.5], [lg, 0.9], [lg, 2.3], [2, 3.2]], "#3a3835");
  /* bouclier d'acier boulonné devant */
  polyDir(c, o.x, o.y, d, [[3, -7.5], [7.5, -6], [7.5, 6], [3, 7.5]], "#8a877f", "rgba(0,0,0,.35)");
  var bp = ptDir(o.x, o.y, d, 5.5, 0);
  c.fillStyle = "#5f5c56";
  for(var i = -1; i <= 1; i++){
    var q = ptDir(o.x, o.y, d, 5.2, i * 4);
    c.beginPath(); c.arc(q.x, q.y, 1.1, 0, 6.2832); c.fill();
  }
  /* fente de visée */
  polyDir(c, o.x, o.y, d, [[6.2, -1.4], [7.6, -1.2], [7.6, 1.2], [6.2, 1.4]], "#22201f");
  /* éclair de bouche + douilles */
  if(b.flash > 0){
    var m1 = ptDir(o.x, o.y, d, lg + 2, -1.6), m2 = ptDir(o.x, o.y, d, lg + 2, 1.6);
    var a = b.flash;
    c.save(); c.globalCompositeOperation = "lighter";
    c.fillStyle = "rgba(255,220,140," + (0.8 * a) + ")";
    [m1, m2].forEach(function(m){
      c.beginPath();
      c.moveTo(m.x - d.y * 3.4, m.y + d.x * 3.4);
      c.lineTo(m.x + d.x * (7 + a * 5), m.y + d.y * (7 + a * 5));
      c.lineTo(m.x + d.y * 3.4, m.y - d.x * 3.4);
      c.closePath(); c.fill();
    });
    c.restore();
    lueur(c, m1.x, m1.y, 16, "#ffd07a", 0.35 * a);
  }
};

TOURELLES.chalumeau = function(c, b, ang, tps){
  var d = vecteurEcran(ang);
  var o = { x:0, y:-18 };
  /* pivot */
  cylindre(c, 0, 0, 0.22, 9, 5, "#7a776f", "#4f4c47");
  /* corps de la lance */
  polyDir(c, o.x, o.y, d, [[-6, -3.4], [5, -3.4], [5, 3.4], [-6, 3.4]], "#57544d");
  polyDir(c, o.x, o.y, d, [[-6, -3.4], [5, -3.4], [5, -1.8], [-6, -1.8]], "#6e6b63");
  /* bec */
  polyDir(c, o.x, o.y, d, [[5, -2.2], [16, -1.5], [16, 1.5], [5, 2.2]], "#3a3835");
  polyDir(c, o.x, o.y, d, [[14, -2.6], [17.5, -2.2], [17.5, 2.2], [14, 2.6]], "#8a877f");
  /* poignée */
  polyDir(c, o.x, o.y, d, [[-3, 3], [1, 3], [1, 6.5], [-3, 6.5]], "#2f2d2b");
  /* veilleuse toujours allumée au bout du bec */
  var v = ptDir(o.x, o.y, d, 19, -2.6);
  c.save();
  c.globalCompositeOperation = "lighter";
  var h2 = 6 + Math.sin(tps * 12) * 1.2;
  c.fillStyle = "rgba(255,150,40,.75)";
  c.beginPath();
  c.moveTo(v.x - 2, v.y + 2); c.quadraticCurveTo(v.x - 3, v.y - h2 * 0.5, v.x, v.y + 2 - h2);
  c.quadraticCurveTo(v.x + 3, v.y - h2 * 0.5, v.x + 2, v.y + 2);
  c.closePath(); c.fill();
  c.fillStyle = "rgba(255,240,180,.85)";
  c.beginPath();
  c.ellipse(v.x, v.y - h2 * 0.35, 1.2, h2 * 0.3, 0, 0, 6.2832); c.fill();
  c.restore();
};

TOURELLES.frelon = function(c, b, ang, tps){
  var d = vecteurEcran(ang);
  var o = { x:0, y:-40 };
  /* tourelle pivotante */
  cylindre(c, 0, 0, 0.42, 32, 7, "#6f6c64", "#494741");
  /* bloc lanceur à quatre tubes */
  var rec = b.recul || 0;
  var ox = o.x - d.x * rec * 3, oy = o.y - d.y * rec * 3;
  polyDir(c, ox, oy, d, [[-9, -8], [11, -8], [11, 8], [-9, 8]], "#5f6b45");
  polyDir(c, ox, oy, d, [[-9, -8], [11, -8], [11, -3], [-9, -3]], "#77855a");
  /* les quatre bouches, ogives rouges au fond */
  var dec = [[-4.4, -3.6], [-4.4, 3.6], [4.4, -3.6], [4.4, 3.6]];
  for(var i = 0; i < 4; i++){
    var q = ptDir(ox, oy, d, 11 + dec[i][0] * 0, dec[i][0]);
    var p = ptDir(ox, oy, d, 11, dec[i][0]);
    var p2 = { x:p.x, y:p.y + dec[i][1] * 0.55 };
    c.fillStyle = "#22201f";
    c.beginPath(); c.ellipse(p2.x, p2.y, 3.0, 2.6, 0, 0, 6.2832); c.fill();
    c.fillStyle = b.flash > 0 ? "#ffca6a" : "#b8352a";
    c.beginPath(); c.ellipse(p2.x, p2.y, 1.9, 1.6, 0, 0, 6.2832); c.fill();
  }
  /* rails et vérin d'élévation */
  polyDir(c, ox, oy, d, [[-11, -1.5], [-2, -1.5], [-2, 1.5], [-11, 1.5]], "#8e8b83");
  /* antenne radar parabolique qui tourne lentement */
  var ar = tps * 0.9;
  var dr = vecteurEcran(ar);
  var rp = { x:iso(0.72, -0.66).x, y:iso(0.72, -0.66).y - 58 };
  c.save();
  c.translate(rp.x, rp.y);
  c.scale(1, 0.55);
  c.rotate(Math.atan2(dr.y, dr.x));
  c.fillStyle = "#c9c6bc";
  c.beginPath(); c.ellipse(0, 0, 9, 9, 0, -1.35, 1.35); c.closePath(); c.fill();
  c.fillStyle = "#8e8b83";
  c.beginPath(); c.ellipse(0, 0, 9, 9, 0, 1.35, -1.35); c.closePath(); c.fill();
  c.restore();
  c.strokeStyle = "#6a6761"; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(rp.x, rp.y); c.lineTo(rp.x + 5, rp.y + 4); c.stroke();
  /* diodes clignotantes du boîtier */
  var bp = iso(-0.66, 0.62);
  var cl = [["#6ee08a", 0], ["#ffd070", 1.1], ["#ff5a4a", 2.3]];
  for(var k = 0; k < 3; k++){
    var on = (Math.sin(tps * 3 + cl[k][1] * 2) > 0.1) ? 1 : 0.25;
    c.fillStyle = rgba(cl[k][0], on);
    c.beginPath(); c.arc(bp.x - 6 + k * 6, bp.y - 42, 1.7, 0, 6.2832); c.fill();
  }
};

TOURELLES.pilon = function(c, b, ang, tps){
  /* le tube ne pivote que légèrement */
  var d = vecteurEcran(ang);
  var o = { x:0, y:-8 };
  /* bipied */
  c.strokeStyle = "#5f5c56"; c.lineWidth = 2.6; c.lineCap = "round";
  var j1 = ptDir(o.x, o.y, d, 5, -7), j2 = ptDir(o.x, o.y, d, 5, 7);
  c.beginPath(); c.moveTo(j1.x, j1.y + 4); c.lineTo(o.x + d.x * 2, o.y - 22); c.stroke();
  c.beginPath(); c.moveTo(j2.x, j2.y + 4); c.lineTo(o.x + d.x * 2, o.y - 22); c.stroke();
  /* plaque de base */
  c.fillStyle = "#4a4740";
  c.beginPath(); c.ellipse(o.x, o.y + 2, 11, 5.5, 0, 0, 6.2832); c.fill();
  /* tube épais quasi vertical, légèrement incliné vers la cible */
  var rec = b.recul || 0;
  var inc = 0.30;                                   // inclinaison
  var hx = d.x * inc * 26, hy = -34 + rec * 3;
  c.save();
  c.translate(o.x, o.y);
  var f = faces("#4f4c47");
  c.strokeStyle = f.g; c.lineWidth = 9.5; c.lineCap = "butt";
  c.beginPath(); c.moveTo(0, 0); c.lineTo(hx, hy); c.stroke();
  c.strokeStyle = f.t; c.lineWidth = 4;
  c.beginPath(); c.moveTo(-1.6, -1); c.lineTo(hx - 1.6, hy); c.stroke();
  /* bouche */
  c.fillStyle = "#1b1a19";
  c.beginPath(); c.ellipse(hx, hy, 5.2, 2.4, 0, 0, 6.2832); c.fill();
  c.strokeStyle = "#8a877f"; c.lineWidth = 1.4;
  c.beginPath(); c.ellipse(hx, hy, 5.2, 2.4, 0, 0, 6.2832); c.stroke();
  /* anneaux de renfort */
  c.fillStyle = "#6b6861";
  for(var i = 1; i <= 3; i++){
    var t2 = i / 4;
    c.beginPath(); c.ellipse(hx * t2, hy * t2, 5.6, 2.6, 0, 0, 6.2832); c.fill();
  }
  /* chargeur : l'obus tombe dans le tube */
  if(b.chargement > 0){
    var t3 = b.chargement;
    c.fillStyle = "#d8b52e";
    c.beginPath();
    c.ellipse(hx * (0.4 + t3 * 0.6), hy * (1.15 - t3 * 0.25), 2.6, 4.4, 0, 0, 6.2832);
    c.fill();
  }
  c.restore();
  if(b.flash > 0){
    var mx = o.x + hx, my = o.y + hy;
    c.save(); c.globalCompositeOperation = "lighter";
    c.fillStyle = "rgba(255,214,150," + (0.75 * b.flash) + ")";
    c.beginPath(); c.ellipse(mx, my - 6, 7 * b.flash + 3, 12 * b.flash + 4, 0, 0, 6.2832); c.fill();
    c.restore();
    lueur(c, mx, my, 26, "#ffb24a", 0.4 * b.flash);
  }
};

TOURELLES.bobine = function(c, b, ang, tps){
  var p = iso(0, 0);
  var puls = 0.5 + 0.5 * Math.sin(tps * 4.2);
  var chg = b.flash > 0 ? b.flash : 0;
  var zc = 58;
  /* sphère au sommet qui pulse */
  var coul = chg > 0 ? melange("#7de6ff", "#ffffff", chg) : melange("#2c8fa8", "#7de6ff", puls * 0.7);
  sphere(c, 0, 0, 0.24, zc, coul, "#7de6ff");
  /* quatre arcs électriques qui tournent */
  c.save();
  c.globalCompositeOperation = "lighter";
  c.strokeStyle = "rgba(160,240,255," + (0.45 + puls * 0.4) + ")";
  c.lineWidth = 1.5;
  for(var i = 0; i < 4; i++){
    var a0 = tps * 2.1 + i * 1.5708;
    c.beginPath();
    var r0 = 10 + puls * 3;
    c.moveTo(p.x + Math.cos(a0) * r0, p.y - zc + Math.sin(a0) * r0 * 0.5);
    for(var k = 1; k <= 5; k++){
      var aa = a0 + k * 0.42;
      var rr = r0 + Math.sin(k * 2.7 + tps * 9 + i) * 3.4;
      c.lineTo(p.x + Math.cos(aa) * rr, p.y - zc + Math.sin(aa) * rr * 0.5);
    }
    c.stroke();
  }
  c.restore();
  lueur(c, p.x, p.y - zc, 26 + puls * 10, "#7de6ff", 0.22 + puls * 0.16 + chg * 0.5);
};

TOURELLES.cuve = function(){};
TOURELLES.silo = function(){};

/* ================================================================
   Dessin complet d'un bâtiment
   ================================================================ */
function dessineBatiment(c, b, tps, z){
  var p = versEcran(cam, b.gx, b.gy);
  var detail = z > 0.34;                    // au loin, le socle suffit
  c.save();
  c.translate(p.x, p.y);
  c.scale(z, z);
  var sp = SPRITE_DEF[b.t];
  if(sp) c.drawImage(sp, -SP_OX, -SP_OY, SP_W, SP_H);
  if(detail && TOURELLES[b.t]) TOURELLES[b.t](c, b, b.angle, tps);

  /* état d'endommagement : fissures et fumée */
  var fr = b.pv / b.pvMax;
  if(detail && fr < 0.55){
    c.save();
    c.globalAlpha = (0.55 - fr) * 1.1;
    c.strokeStyle = "#1a120c"; c.lineWidth = 1.4;
    var al = prng(b.n * 977 + 3);
    for(var i = 0; i < 4; i++){
      var x0 = (al() - 0.5) * 34, y0 = -al() * 26;
      c.beginPath(); c.moveTo(x0, y0);
      c.lineTo(x0 + (al() - 0.5) * 12, y0 + 8);
      c.lineTo(x0 + (al() - 0.5) * 16, y0 + 17);
      c.stroke();
    }
    c.restore();
  }
  c.restore();

  if(detail && fr < 0.4){
    /* fumée qui s'échappe */
    var ph = (tps * 0.6 + b.n * 0.37) % 1;
    bouffee(c, p.x + Math.sin(tps + b.n) * 5 * z, p.y - (30 + ph * 34) * z,
            (4 + ph * 9) * z, (1 - ph) * 0.30, "#3a3438");
  }
  /* barre de vie si blessé */
  if(fr < 0.999 && z > 0.24){
    barreVie(c, p.x, p.y - 46 * z, 34 * z, fr);
  }
}
