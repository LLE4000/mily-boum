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

/* Matériaux communs */
var MAT = {
  beton:"#9b978d", betonO:"#5f5c56",
  acier:"#6d6a63", acierC:"#a8a49a", acierO:"#3e3c38",
  olive:"#5b6b3a", oliveO:"#38431f",
  rouille:"#8a5a30", cuivre:"#c9822e",
  danger:"#e8c437", cyan:"#2c8fa8", cyanC:"#7de6ff"
};

/* petit détail réutilisé : une plaque boulonnée */
function plaqueBoulonnee(c, x, y, w, h, coul){
  c.fillStyle = coul;
  c.fillRect(x, y, w, h);
  c.fillStyle = "rgba(0,0,0,.32)";
  for(var i = 0; i < 4; i++){
    var bx = x + (i % 2 ? w - 2.4 : 1.4), by = y + (i < 2 ? 1.4 : h - 2.4);
    c.beginPath(); c.arc(bx, by, 0.9, 0, 6.2832); c.fill();
  }
  c.strokeStyle = "rgba(255,255,255,.14)"; c.lineWidth = 0.7;
  c.beginPath(); c.moveTo(x, y + 0.5); c.lineTo(x + w, y + 0.5); c.stroke();
}
/* échelle de service */
function echelle(c, x, y, h){
  c.strokeStyle = MAT.acier; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x - 3, y - h); c.stroke();
  c.beginPath(); c.moveTo(x + 3, y); c.lineTo(x + 3, y - h); c.stroke();
  c.strokeStyle = MAT.acierC; c.lineWidth = 1;
  for(var i = 1; i * 5 < h; i++){
    c.beginPath(); c.moveTo(x - 3, y - i * 5); c.lineTo(x + 3, y - i * 5); c.stroke();
  }
}
/* faisceau de câbles qui court au sol */
function cables(c, x0, y0, x1, y1, n, coul){
  c.strokeStyle = coul || "#22201e";
  for(var i = 0; i < n; i++){
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(x0, y0 + i * 1.6);
    c.bezierCurveTo((x0 + x1) / 2 + i * 3, y0 + 8 + i * 2, (x0 + x1) / 2 - i * 4, y1 - 6, x1, y1 + i * 1.4);
    c.stroke();
  }
}

/* ================================================================
   CRIBLE — tourelle automatique jumelée.
   Silhouette : très basse et très large, un nid de sacs de sable.
   ================================================================ */
SOCLES.crible = function(c){
  ombreContact(c, 0, 0, 2.4, 2.4, 0.26);
  /* dalle octogonale sur deux niveaux, joints marqués */
  prisme(c, 0, 0, 1.10, 8, 0.3927, 0, 7, MAT.beton, MAT.betonO);
  prisme(c, 0, 0, 0.86, 8, 0.3927, 7, 5, ecl(MAT.beton, 1.06), ecl(MAT.betonO, 1.1));
  var o = iso(0, 0);
  c.save(); c.globalAlpha = 0.22; c.strokeStyle = "#3e3c38"; c.lineWidth = 1;
  for(var k = 0; k < 8; k++){
    var a = k / 8 * 6.2832 + 0.3927;
    var p1 = iso(Math.cos(a) * 0.3, Math.sin(a) * 0.3);
    var p2 = iso(Math.cos(a) * 0.84, Math.sin(a) * 0.84);
    c.beginPath(); c.moveTo(p1.x, p1.y - 12); c.lineTo(p2.x, p2.y - 12); c.stroke();
  }
  c.restore();
  /* bande d'avertissement peinte sur le bord */
  c.save(); c.globalAlpha = 0.5;
  for(var d2 = 0; d2 < 16; d2++){
    var ad = d2 / 16 * 6.2832;
    var pd = iso(Math.cos(ad) * 1.0, Math.sin(ad) * 1.0);
    c.fillStyle = d2 % 2 ? MAT.danger : "#22201e";
    c.fillRect(pd.x - 2, pd.y - 8, 4, 2.2);
  }
  c.restore();
  /* couronne de sacs de sable */
  sacs(c, 0, 0, 0.92, 12, 11, "#a89a6e", "#8d8054", 4711);
  /* deux caisses de munitions ouvertes, bandes qui pendent */
  function caisse(gx, gy){
    var f = faces(MAT.olive);
    boite(c, gx, gy, 0.48, 0.34, 12, 9, f.t, f.g, f.d);
    var p = iso(gx, gy);
    c.fillStyle = ecl(MAT.olive, 0.8);
    c.beginPath();
    c.moveTo(p.x - 9, p.y - 21); c.lineTo(p.x + 5, p.y - 31);
    c.lineTo(p.x + 14, p.y - 26); c.lineTo(p.x, p.y - 18);
    c.closePath(); c.fill();
    c.strokeStyle = "#b8912f"; c.lineWidth = 2;
    c.beginPath();
    c.moveTo(p.x + 2, p.y - 20);
    c.quadraticCurveTo(p.x + 13, p.y - 14, p.x + 9, p.y - 2);
    c.stroke();
    c.fillStyle = "#e0b84a";
    for(var i = 0; i < 6; i++){
      var tt = i / 5;
      c.fillRect(p.x + 2 + 11 * tt - 1.4, p.y - 20 + 18 * tt * tt - 1.4, 2.8, 3.4);
    }
    c.fillStyle = "rgba(255,255,255,.12)";
    c.fillRect(p.x - 10, p.y - 20, 20, 1.6);
  }
  caisse(-0.66, 0.54);
  caisse(0.58, 0.66);
  /* piquet à chiffon + antenne courte */
  var q = iso(0.76, -0.66);
  c.strokeStyle = "#6b5a42"; c.lineWidth = 2.4; c.lineCap = "round";
  c.beginPath(); c.moveTo(q.x, q.y - 12); c.lineTo(q.x, q.y - 34); c.stroke();
  c.fillStyle = "#b8493a";
  c.beginPath();
  c.moveTo(q.x, q.y - 32); c.quadraticCurveTo(q.x + 13, q.y - 30, q.x + 10, q.y - 22);
  c.quadraticCurveTo(q.x + 6, q.y - 24, q.x, q.y - 22);
  c.closePath(); c.fill();
  /* douilles éparpillées */
  c.fillStyle = "#c9a54a";
  for(var i2 = 0; i2 < 20; i2++){
    var a2 = i2 * 2.3, r2 = 0.45 + (i2 % 6) * 0.11;
    var pp = iso(Math.cos(a2) * r2, Math.sin(a2) * r2);
    c.save(); c.translate(pp.x, pp.y - 12); c.rotate(a2);
    c.fillRect(-1, -0.7, 2.2, 1.4);
    c.restore();
  }
  /* embase de la tourelle */
  cylindre(c, 0, 0, 0.34, 12, 4, MAT.acierC, MAT.acierO);
};

/* ================================================================
   CHALUMEAU — projeteur incendiaire.
   Silhouette : deux grandes bonbonnes rouges dressées à l'arrière,
   une lance longue et fine à l'avant.
   ================================================================ */
SOCLES.chalumeau = function(c){
  ombreContact(c, 0, 0, 2.3, 2.3, 0.26);
  bandesDanger(c, 0, 0, 2.0, 2.0, 0, 8);
  c.save(); c.globalAlpha = 0.32; plaque(c, 0, 0, 2.0, 2.0, 0, "#1e1e1c"); c.restore();
  /* socle de tôle rivetée */
  var f = faces(MAT.acier);
  boite(c, 0, 0, 1.40, 1.40, 0, 10, f.t, f.g, f.d);
  var pl = iso(0, 0);
  c.fillStyle = "#3e3c38";
  for(var i = 0; i < 10; i++){
    var a = i / 10 * 6.2832, p = iso(Math.cos(a) * 0.62, Math.sin(a) * 0.62);
    c.beginPath(); c.arc(p.x, p.y - 10, 1.5, 0, 6.2832); c.fill();
  }
  /* deux grandes bonbonnes à l'arrière */
  function bonbonne(gx, gy, h){
    cylindre(c, gx, gy, 0.28, 10, h, "#d64432", "#8f2a1e");
    var p = iso(gx, gy);
    c.fillStyle = "rgba(255,255,255,.22)";
    c.fillRect(p.x - 0.28 * RX, p.y - 10 - h * 0.62, 0.56 * RX, 3);
    c.fillStyle = "rgba(0,0,0,.25)";
    c.fillRect(p.x - 0.28 * RX, p.y - 10 - h * 0.30, 0.56 * RX, 2);
    /* col, volant et manomètre */
    cylindre(c, gx, gy, 0.11, 10 + h, 6, MAT.acierC, MAT.acier);
    c.strokeStyle = "#c8c4b8"; c.lineWidth = 1.6;
    c.beginPath(); c.arc(p.x, p.y - 10 - h - 8, 3.6, 0, 6.2832); c.stroke();
    c.beginPath(); c.moveTo(p.x - 3.6, p.y - 10 - h - 8); c.lineTo(p.x + 3.6, p.y - 10 - h - 8); c.stroke();
    c.fillStyle = "#e8e4d8";
    c.beginPath(); c.arc(p.x + 7, p.y - 10 - h - 2, 3.4, 0, 6.2832); c.fill();
    c.strokeStyle = "#2a2a2a"; c.lineWidth = 0.8;
    c.beginPath(); c.arc(p.x + 7, p.y - 10 - h - 2, 3.4, 0, 6.2832); c.stroke();
    c.strokeStyle = "#c33"; c.lineWidth = 1;
    c.beginPath(); c.moveTo(p.x + 7, p.y - 10 - h - 2); c.lineTo(p.x + 9, p.y - 10 - h - 4); c.stroke();
  }
  bonbonne(-0.46, -0.34, 30);
  bonbonne(-0.12, -0.58, 26);
  /* cerclage qui tient les bonbonnes */
  var b1 = iso(-0.46, -0.34), b2 = iso(-0.12, -0.58);
  c.strokeStyle = MAT.acier; c.lineWidth = 2.2;
  c.beginPath(); c.moveTo(b1.x, b1.y - 26); c.lineTo(b2.x, b2.y - 24); c.stroke();
  /* tuyau souple qui serpente jusqu'à la lance */
  var a1 = iso(-0.30, -0.44), c1 = iso(0.20, 0.32);
  c.strokeStyle = "#232325"; c.lineWidth = 4.6; c.lineCap = "round";
  c.beginPath();
  c.moveTo(a1.x, a1.y - 34);
  c.bezierCurveTo(a1.x + 20, a1.y - 4, c1.x - 24, c1.y - 2, c1.x, c1.y - 18);
  c.stroke();
  c.strokeStyle = "#4a4a4c"; c.lineWidth = 1.4;
  for(var s = 0; s <= 10; s++){
    var t = s / 10;
    var xx = (1 - t) * (1 - t) * (1 - t) * a1.x + 3 * (1 - t) * (1 - t) * t * (a1.x + 20)
           + 3 * (1 - t) * t * t * (c1.x - 24) + t * t * t * c1.x;
    var yy = (1 - t) * (1 - t) * (1 - t) * (a1.y - 34) + 3 * (1 - t) * (1 - t) * t * (a1.y - 4)
           + 3 * (1 - t) * t * t * (c1.y - 2) + t * t * t * (c1.y - 18);
    c.beginPath(); c.moveTo(xx - 2.4, yy); c.lineTo(xx + 2.4, yy - 1); c.stroke();
  }
  /* réserve de naphte + traces de suie */
  var f2 = faces("#4d4b46");
  boite(c, 0.54, -0.24, 0.42, 0.52, 10, 14, f2.t, f2.g, f2.d);
  var pr = iso(0.54, -0.24);
  plaqueBoulonnee(c, pr.x - 6, pr.y - 22, 12, 6, "#3a3834");
  salissures(c, pl.x - 24, pl.y - 10, 48, 18, 9, 991);
  c.save(); c.globalAlpha = 0.22; c.fillStyle = "#100c0a";
  c.beginPath(); c.ellipse(pl.x + 24, pl.y - 2, 20, 9, 0, 0, 6.2832); c.fill();
  c.restore();
  /* embase pivotante */
  cylindre(c, 0, 0, 0.26, 10, 4, MAT.acierC, MAT.acierO);
};

/* ================================================================
   FRELON — batterie de missiles.
   Silhouette : plateforme HAUTE sur quatre vérins, rampe inclinée.
   ================================================================ */
SOCLES.frelon = function(c){
  ombreContact(c, 0, 0, 3.1, 3.1, 0.27);
  /* dalle d'ancrage */
  prisme(c, 0, 0, 1.45, 4, 0.7854, 0, 5, ecl(MAT.beton, 0.94), MAT.betonO);
  /* quatre vérins hydrauliques */
  var coins = [[-1.00, -1.00], [1.00, -1.00], [1.00, 1.00], [-1.00, 1.00]];
  coins.sort(function(a, b){ return (a[0] + a[1]) - (b[0] + b[1]); });
  for(var i = 0; i < 4; i++){
    var v = coins[i], p = iso(v[0], v[1]);
    cylindre(c, v[0], v[1], 0.26, 0, 6, "#4a4844", "#2e2c29");    // patin
    cylindre(c, v[0], v[1], 0.19, 6, 12, MAT.acier, MAT.acierO);  // corps
    cylindre(c, v[0], v[1], 0.10, 18, 16, "#d2cfc6", "#8e8b83");  // tige chromée
    c.fillStyle = "rgba(255,255,255,.45)";
    c.fillRect(p.x - 1.6, p.y - 32, 1.3, 12);
    /* flexible hydraulique */
    c.strokeStyle = "#26241f"; c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(p.x, p.y - 14);
    c.quadraticCurveTo(p.x * 0.5, p.y - 6, 0, iso(0, 0).y - 4);
    c.stroke();
  }
  /* plateforme + caillebotis */
  var f = faces("#6f6c64");
  boite(c, 0, 0, 2.0, 2.0, 34, 7, f.t, f.g, f.d);
  c.save(); c.globalAlpha = 0.30; c.strokeStyle = "#2f2d2a"; c.lineWidth = 1;
  for(var k = -3; k <= 3; k++){
    var s1 = iso(-1.0, k * 0.3), s2 = iso(1.0, k * 0.3);
    c.beginPath(); c.moveTo(s1.x, s1.y - 41); c.lineTo(s2.x, s2.y - 41); c.stroke();
    var s3 = iso(k * 0.3, -1.0), s4 = iso(k * 0.3, 1.0);
    c.beginPath(); c.moveTo(s3.x, s3.y - 41); c.lineTo(s4.x, s4.y - 41); c.stroke();
  }
  c.restore();
  /* garde-corps sur trois côtés */
  c.strokeStyle = "#7d7a72"; c.lineWidth = 1.6;
  var cc = [[-1.0, 1.0], [1.0, 1.0], [1.0, -1.0]];
  for(var j = 0; j < cc.length - 1; j++){
    var q1 = iso(cc[j][0], cc[j][1]), q2 = iso(cc[j + 1][0], cc[j + 1][1]);
    c.beginPath(); c.moveTo(q1.x, q1.y - 41); c.lineTo(q1.x, q1.y - 55);
    c.lineTo(q2.x, q2.y - 55); c.lineTo(q2.x, q2.y - 41); c.stroke();
    c.beginPath(); c.moveTo(q1.x, q1.y - 48); c.lineTo(q2.x, q2.y - 48); c.stroke();
  }
  /* échelle d'accès */
  var pe = iso(1.0, 1.0);
  echelle(c, pe.x + 4, pe.y - 4, 38);
  /* pupitre à diodes */
  var f2 = faces("#3c4a55");
  boite(c, -0.70, 0.66, 0.46, 0.36, 41, 15, f2.t, f2.g, f2.d);
  var pb = iso(-0.70, 0.66);
  plaqueBoulonnee(c, pb.x - 7, pb.y - 54, 14, 5, "#2b3640");
  /* mât radar */
  cylindre(c, 0.76, -0.70, 0.10, 41, 30, MAT.acierC, MAT.acier);
  /* rampe : tourillon */
  cylindre(c, 0, 0, 0.46, 41, 8, ecl(MAT.acier, 1.18), MAT.acierO);
  /* caisses de rechange */
  var f3 = faces(MAT.olive);
  boite(c, 0.62, 0.76, 0.5, 0.34, 41, 10, f3.t, f3.g, f3.d);
};

/* ================================================================
   PILON — obusier de siège.
   Silhouette : une fosse creusée, un tube très épais quasi vertical.
   ================================================================ */
SOCLES.pilon = function(c){
  ombreContact(c, 0, 0, 3.1, 3.1, 0.27);
  /* dalle hexagonale */
  prisme(c, 0, 0, 1.45, 6, 0.5236, 0, 10, MAT.beton, MAT.betonO);
  var p = iso(0, 0);
  /* la fosse : anneau creusé, avec sa paroi */
  c.save();
  c.fillStyle = "#3a3833";
  c.beginPath(); c.ellipse(p.x, p.y - 10, 0.92 * RX, 0.92 * RY, 0, 0, 6.2832); c.fill();
  var g = c.createRadialGradient(p.x, p.y - 16, 2, p.x, p.y - 10, 0.92 * RX);
  g.addColorStop(0, "rgba(0,0,0,.82)"); g.addColorStop(1, "rgba(0,0,0,.12)");
  c.fillStyle = g;
  c.beginPath(); c.ellipse(p.x, p.y - 10, 0.92 * RX, 0.92 * RY, 0, 0, 6.2832); c.fill();
  /* fond bétonné de la fosse */
  c.fillStyle = "#5a564e";
  c.beginPath(); c.ellipse(p.x, p.y - 3, 0.6 * RX, 0.6 * RY, 0, 0, 6.2832); c.fill();
  c.strokeStyle = "rgba(0,0,0,.4)"; c.lineWidth = 1;
  for(var a = 0; a < 6; a++){
    var an = a / 6 * 6.2832;
    c.beginPath();
    c.moveTo(p.x, p.y - 3);
    c.lineTo(p.x + Math.cos(an) * 0.6 * RX, p.y - 3 + Math.sin(an) * 0.6 * RY);
    c.stroke();
  }
  c.restore();
  /* couronne de sacs */
  sacs(c, 0, 0, 1.12, 10, 12, "#9d9068", "#847955", 8123);
  /* râtelier de trois obus jaunes */
  var f = faces("#4a4740");
  boite(c, 1.02, 0.54, 0.54, 0.32, 10, 7, f.t, f.g, f.d);
  for(var i = 0; i < 3; i++){
    var gx = 0.86 + i * 0.15, gy = 0.54 - i * 0.02;
    var q = iso(gx, gy);
    c.save();
    c.translate(q.x, q.y - 16); c.rotate(-0.30);
    c.fillStyle = "#d8b52e";
    c.beginPath();
    if(c.roundRect) c.roundRect(-3.2, -13, 6.4, 19, 2); else c.rect(-3.2, -13, 6.4, 19);
    c.fill();
    c.fillStyle = "#8c8a84";
    c.beginPath(); c.moveTo(-3.2, -12); c.lineTo(0, -20); c.lineTo(3.2, -12); c.closePath(); c.fill();
    c.fillStyle = "rgba(255,255,255,.26)"; c.fillRect(-2.6, -12, 1.6, 17);
    c.fillStyle = "#b8493a"; c.fillRect(-3.2, -4, 6.4, 2);
    c.restore();
  }
  /* potence de chargement */
  var pc = iso(-1.0, 0.6);
  c.strokeStyle = MAT.acier; c.lineWidth = 3;
  c.beginPath(); c.moveTo(pc.x, pc.y - 10); c.lineTo(pc.x, pc.y - 44); c.stroke();
  c.beginPath(); c.moveTo(pc.x, pc.y - 42); c.lineTo(pc.x + 26, pc.y - 38); c.stroke();
  c.strokeStyle = "#2a2825"; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(pc.x + 24, pc.y - 38); c.lineTo(pc.x + 24, pc.y - 26); c.stroke();
  c.fillStyle = MAT.acierO;
  c.fillRect(pc.x + 21, pc.y - 26, 6, 4);
  /* suie autour de la fosse */
  c.save(); c.globalAlpha = 0.16; c.fillStyle = "#000";
  for(var k = 0; k < 14; k++){
    var a2 = k * 1.7, r = 0.95 + (k % 3) * 0.16;
    var pp = iso(Math.cos(a2) * r, Math.sin(a2) * r);
    c.beginPath(); c.ellipse(pp.x, pp.y - 10, 8, 3.6, 0, 0, 6.2832); c.fill();
  }
  c.restore();
};

/* ================================================================
   BOBINE — pylône à arc.
   Silhouette : haute et fine, sphère au sommet.
   ================================================================ */
SOCLES.bobine = function(c){
  ombreContact(c, 0, 0, 2.3, 2.3, 0.26);
  prisme(c, 0, 0, 1.02, 6, 0.2, 0, 9, MAT.beton, MAT.betonO);
  /* rigoles de mise à la terre */
  var o = iso(0, 0);
  c.save(); c.globalAlpha = 0.3; c.strokeStyle = MAT.cuivre; c.lineWidth = 1.4;
  for(var m = 0; m < 4; m++){
    var am = m / 4 * 6.2832 + 0.4;
    var e1 = iso(Math.cos(am) * 0.25, Math.sin(am) * 0.25);
    var e2 = iso(Math.cos(am) * 0.95, Math.sin(am) * 0.95);
    c.beginPath(); c.moveTo(e1.x, e1.y - 9); c.lineTo(e2.x, e2.y - 9); c.stroke();
  }
  c.restore();
  /* quatre isolateurs en céramique à collerettes */
  var coins = [[-0.64, -0.64], [0.64, -0.64], [0.64, 0.64], [-0.64, 0.64]];
  coins.sort(function(a, b){ return (a[0] + a[1]) - (b[0] + b[1]); });
  for(var i = 0; i < 4; i++){
    var v = coins[i];
    cylindre(c, v[0], v[1], 0.11, 9, 4, "#8e8b83", "#5d5a55");
    for(var k = 0; k < 5; k++){
      cylindre(c, v[0], v[1], 0.18 - k * 0.008, 13 + k * 7, 3.4, "#f4f0e4", "#c4bea6");
      cylindre(c, v[0], v[1], 0.105, 16.4 + k * 7, 3.6, "#e2ddcf", "#ada695");
    }
    cylindre(c, v[0], v[1], 0.09, 48, 5, MAT.acierC, MAT.acier);
  }
  /* colonne centrale à anneaux de cuivre */
  cylindre(c, 0, 0, 0.32, 9, 12, "#4a4844", "#2f2d2a");
  for(var j = 0; j < 7; j++){
    var z = 21 + j * 7.2;
    cylindre(c, 0, 0, 0.27 - j * 0.014, z, 4.2, ecl(MAT.cuivre, 1.25), ecl(MAT.cuivre, 0.68));
    cylindre(c, 0, 0, 0.21 - j * 0.012, z + 4.2, 3, "#3c3a36", "#242220");
  }
  /* deux condensateurs cyan */
  function conda(gx, gy){
    cylindre(c, gx, gy, 0.16, 10, 24, MAT.cyan, ecl(MAT.cyan, 0.6));
    var p = iso(gx, gy);
    c.fillStyle = "rgba(125,230,255,.55)";
    c.fillRect(p.x - 2.2, p.y - 32, 4.4, 14);
    c.fillStyle = "#cfe9f2";
    c.beginPath(); c.arc(p.x, p.y - 36, 2.6, 0, 6.2832); c.fill();
    c.strokeStyle = "rgba(0,0,0,.3)"; c.lineWidth = 0.9;
    c.beginPath(); c.arc(p.x, p.y - 36, 2.6, 0, 6.2832); c.stroke();
  }
  conda(-0.54, 0.18);
  conda(0.18, 0.54);
  /* câbles haute tension en caténaire */
  c.strokeStyle = "#201e1a"; c.lineWidth = 1.8;
  for(var n = 0; n < 4; n++){
    var v2 = coins[n], p1 = iso(v2[0], v2[1]), p2 = iso(0, 0);
    c.beginPath();
    c.moveTo(p1.x, p1.y - 50);
    c.quadraticCurveTo((p1.x + p2.x) / 2, (p1.y + p2.y) / 2 - 36, p2.x, p2.y - 66);
    c.stroke();
  }
  /* boîtier de commande */
  var f2 = faces("#33404a");
  boite(c, 0.72, -0.34, 0.34, 0.28, 9, 12, f2.t, f2.g, f2.d);
};

/* ================================================================
   CUVE — citerne de naphte couchée sur son berceau.
   ================================================================ */
SOCLES.cuve = function(c){
  ombreContact(c, 0, 0, 2.2, 2.2, 0.26);
  prisme(c, 0, 0, 0.96, 8, 0.3927, 0, 6, MAT.beton, MAT.betonO);
  /* berceaux */
  var f = faces("#4a4844");
  boite(c, -0.42, -0.42, 0.34, 0.34, 6, 10, f.t, f.g, f.d);
  boite(c, 0.42, 0.42, 0.34, 0.34, 6, 10, f.t, f.g, f.d);
  /* la citerne, couchée en diagonale */
  var a = iso(-0.55, -0.55), b = iso(0.55, 0.55);
  var g = c.createLinearGradient(0, a.y - 30, 0, b.y - 8);
  g.addColorStop(0, "#c9963f"); g.addColorStop(0.45, "#a87c2e"); g.addColorStop(1, "#6f5220");
  c.save();
  c.translate((a.x + b.x) / 2, (a.y + b.y) / 2 - 22);
  c.rotate(Math.atan2(b.y - a.y, b.x - a.x));
  c.fillStyle = g;
  c.beginPath();
  if(c.roundRect) c.roundRect(-30, -12, 60, 24, 11); else c.rect(-30, -12, 60, 24);
  c.fill();
  /* cerclages */
  c.strokeStyle = "rgba(60,44,14,.55)"; c.lineWidth = 1.6;
  for(var i = -2; i <= 2; i++){
    c.beginPath(); c.moveTo(i * 11, -12); c.lineTo(i * 11, 12); c.stroke();
  }
  c.fillStyle = "rgba(255,255,255,.18)";
  c.fillRect(-28, -10, 56, 3);
  /* trappe et manomètre */
  c.fillStyle = "#8d8a82";
  c.beginPath(); c.arc(-6, -6, 4.2, 0, 6.2832); c.fill();
  c.fillStyle = "#e8e4d8";
  c.beginPath(); c.arc(10, -5, 2.6, 0, 6.2832); c.fill();
  /* pictogramme inflammable */
  c.fillStyle = "#c8452f";
  c.beginPath();
  c.moveTo(0, 8); c.quadraticCurveTo(-4, 2, 0, -3);
  c.quadraticCurveTo(4, 2, 0, 8);
  c.closePath(); c.fill();
  c.restore();
  /* tuyauterie et vanne */
  var pv = iso(0.6, -0.6);
  c.strokeStyle = "#4a4844"; c.lineWidth = 3.4;
  c.beginPath();
  c.moveTo(pv.x - 6, pv.y - 24); c.lineTo(pv.x + 8, pv.y - 24); c.lineTo(pv.x + 8, pv.y - 4);
  c.stroke();
  c.strokeStyle = "#c8c4b8"; c.lineWidth = 1.6;
  c.beginPath(); c.arc(pv.x + 8, pv.y - 18, 3.4, 0, 6.2832); c.stroke();
  echelle(c, iso(-0.7, 0.7).x, iso(-0.7, 0.7).y - 6, 22);
  salissures(c, iso(0, 0).x - 22, iso(0, 0).y - 26, 44, 22, 8, 313);
};

/* ================================================================
   SILO — réserve de matériel : hangar à toit en bâtière.
   ================================================================ */
SOCLES.silo = function(c){
  ombreContact(c, 0, 0, 3.0, 3.0, 0.27);
  var f = faces("#7c6a4e");
  boite(c, 0, 0, 2.0, 1.7, 0, 24, f.t, f.g, f.d);
  var p = iso(0, 0);
  /* bardage vertical */
  c.save(); c.globalAlpha = 0.22; c.strokeStyle = "#3a2a18"; c.lineWidth = 1;
  for(var i = -9; i <= 9; i++){
    var a1 = iso(1.0, i * 0.09), a2 = iso(1.0, i * 0.09);
    c.beginPath(); c.moveTo(a1.x + i * 1.4, a1.y - 4); c.lineTo(a2.x + i * 1.4, a2.y - 24); c.stroke();
  }
  c.restore();
  /* toit à deux pentes, tôle ondulée */
  var f2 = faces("#8f5a3a");
  boite(c, 0, -0.22, 2.18, 0.96, 24, 12, f2.t, f2.g, f2.d);
  boite(c, 0, 0.46, 2.18, 0.96, 24, 6, ecl("#8f5a3a", 1.05), ecl("#8f5a3a", 0.5), ecl("#8f5a3a", 0.72));
  c.save(); c.globalAlpha = 0.28; c.strokeStyle = "#3a2418"; c.lineWidth = 1;
  for(var k = -8; k <= 8; k++){
    var b1 = iso(k * 0.13, -1.0), b2 = iso(k * 0.13, 1.0);
    c.beginPath(); c.moveTo(b1.x, b1.y - 33); c.lineTo(b2.x, b2.y - 27); c.stroke();
  }
  c.restore();
  /* faîtière */
  var fa1 = iso(-1.1, -0.22), fa2 = iso(1.1, -0.22);
  c.strokeStyle = "#5a3a26"; c.lineWidth = 3;
  c.beginPath(); c.moveTo(fa1.x, fa1.y - 36); c.lineTo(fa2.x, fa2.y - 36); c.stroke();
  /* porte coulissante + rail */
  var d1 = iso(1.0, -0.42), d2 = iso(1.0, 0.42);
  c.fillStyle = "#4a3c2a";
  c.beginPath();
  c.moveTo(d1.x, d1.y - 21); c.lineTo(d2.x, d2.y - 21);
  c.lineTo(d2.x, d2.y - 2); c.lineTo(d1.x, d1.y - 2);
  c.closePath(); c.fill();
  c.strokeStyle = "#6b5940"; c.lineWidth = 1.4; c.stroke();
  c.strokeStyle = "#8d8a82"; c.lineWidth = 2;
  c.beginPath(); c.moveTo(d1.x - 4, d1.y - 23); c.lineTo(d2.x + 4, d2.y - 23); c.stroke();
  /* caisses et fûts devant */
  var f3 = faces("#a5854e");
  boite(c, 1.28, 0.58, 0.44, 0.44, 0, 13, f3.t, f3.g, f3.d);
  boite(c, 1.34, 0.06, 0.36, 0.36, 0, 10, f3.t, f3.g, f3.d);
  cylindre(c, 1.20, -0.62, 0.22, 0, 13, "#7d8a46", "#4e5a28");
  salissures(c, p.x - 30, p.y - 26, 60, 24, 9, 555);
};

/* ================================================================
   Construction des sprites
   ================================================================ */
/* ---------------------------------------------------------------
   LA CELLULE ÉNERGÉTIQUE
   Ni arme ni défense : un petit fût ambré planté dans le sol, cerclé
   de métal, qu'on vient vider. Volontairement plus petit et plus clair
   que tout le reste, pour qu'un champ se repère de loin.
   --------------------------------------------------------------- */
SOCLES.cellule = function(c){
  ombreContact(c, 0, 0, 0.9, 0.9, 0.22);
  /* embase */
  prisme(c, 0, 0, 0.34, 6, 0.5236, 0, 3, "#5b5750", "#3a3733");
  /* le fût, en verre ambré */
  var p = iso(0, 0);
  var h = 17, rx = 0.24 * RX, ry = 0.24 * RY;
  var g = c.createLinearGradient(p.x - rx, 0, p.x + rx, 0);
  g.addColorStop(0.00, "#a8741c");
  g.addColorStop(0.34, "#ffcc55");
  g.addColorStop(0.62, "#ffe9a8");
  g.addColorStop(1.00, "#7d5312");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(p.x - rx, p.y - 3);
  c.lineTo(p.x - rx, p.y - 3 - h);
  c.ellipse(p.x, p.y - 3 - h, rx, ry, 0, Math.PI, 0, false);
  c.lineTo(p.x + rx, p.y - 3);
  c.ellipse(p.x, p.y - 3, rx, ry, 0, 0, Math.PI, false);
  c.closePath(); c.fill();
  /* cerclages */
  c.strokeStyle = "#6d6459"; c.lineWidth = 1.6;
  for(var k = 1; k <= 2; k++){
    c.beginPath();
    c.ellipse(p.x, p.y - 3 - h * k / 3, rx, ry, 0, 0, 6.2832);
    c.stroke();
  }
  /* coiffe métallique */
  c.fillStyle = "#8e857a";
  c.beginPath(); c.ellipse(p.x, p.y - 3 - h, rx * 1.16, ry * 1.16, 0, 0, 6.2832); c.fill();
  c.fillStyle = "#4a463f";
  c.beginPath(); c.ellipse(p.x, p.y - 4 - h, rx * 0.5, ry * 0.5, 0, 0, 6.2832); c.fill();
  /* halo : c'est lui qui fait repérer un champ de loin */
  lueur(c, p.x, p.y - 3 - h * 0.55, 22, "#ffc247", 0.30);
  lueur(c, p.x, p.y - 2, 15, "#ffb02a", 0.16);
};

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
