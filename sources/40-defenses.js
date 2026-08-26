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

/* LE FRELON EST JAUNE. Il portait l'olive militaire des autres pièces,
   ce qui le noyait dans le décor alors que c'est la seule défense qui
   tire à trente cases : on doit le repérer de loin. Rampe propre à lui
   — le Crible garde MAT.olive, qu'il partageait jusqu'ici. */
var FRELON = {
  clair:"#c2992f", moyen:"#9c7a20", fonce:"#6a5215",
  trait:"#5c470f", nuit:"#463610", tube:"#b39230"
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
  ombreContact(c, 0, 0, 2.5, 2.4, 0.27);

  /* dalle octogonale sur deux niveaux */
  prisme(c, 0, 0, 1.14, 8, 0.3927, 0, 7, MAT.beton, MAT.betonO);
  prisme(c, 0, 0, 0.88, 8, 0.3927, 7, 5, ecl(MAT.beton, 1.06), ecl(MAT.betonO, 1.1));

  /* joints radiaux du niveau haut */
  c.save(); c.globalAlpha = 0.22; c.strokeStyle = "#3e3c38"; c.lineWidth = 1;
  for(var k = 0; k < 8; k++){
    var a = k / 8 * 6.2832 + 0.3927;
    var p1 = iso(Math.cos(a) * 0.30, Math.sin(a) * 0.30);
    var p2 = iso(Math.cos(a) * 0.84, Math.sin(a) * 0.84);
    c.beginPath(); c.moveTo(p1.x, p1.y - 12); c.lineTo(p2.x, p2.y - 12); c.stroke();
  }
  c.restore();

  var o0 = iso(0, 0);
  /* trace circulaire laissée par la rotation de la tourelle */
  c.save(); c.globalAlpha = 0.20; c.strokeStyle = "#2f2d2a"; c.lineWidth = 1.2;
  c.beginPath(); c.ellipse(o0.x, o0.y - 12, 0.60 * RX, 0.60 * RY, 0, 0.3, 2.6); c.stroke();
  c.beginPath(); c.ellipse(o0.x, o0.y - 12, 0.52 * RX, 0.52 * RY, 0, 3.4, 5.9); c.stroke();
  c.restore();

  /* éclats d'impacts sur le béton */
  var al = prng(2027);
  c.fillStyle = "rgba(46,44,40,.55)";
  for(var e = 0; e < 7; e++){
    var ae = al() * 6.2832, re = 0.35 + al() * 0.55;
    var pe = iso(Math.cos(ae) * re, Math.sin(ae) * re);
    c.beginPath();
    c.ellipse(pe.x, pe.y - 12, 1.6 + al() * 1.8, 0.9 + al() * 0.9, al() * 3, 0, 6.2832);
    c.fill();
  }

  /* bande d'avertissement peinte sur le niveau bas */
  c.save(); c.globalAlpha = 0.5;
  for(var d2 = 0; d2 < 16; d2++){
    var ad = d2 / 16 * 6.2832;
    var pd = iso(Math.cos(ad) * 1.04, Math.sin(ad) * 1.04);
    c.fillStyle = d2 % 2 ? MAT.danger : "#22201e";
    c.fillRect(pd.x - 2, pd.y - 8, 4, 2.2);
  }
  c.restore();

  /* boîtier électrique + câbles d'alimentation vers l'embase */
  var fb = faces("#3c4a3a");
  boite(c, -0.35, -0.62, 0.22, 0.18, 12, 9, fb.t, fb.g, fb.d);
  var pb = iso(-0.35, -0.62);
  c.fillStyle = "#ffd070";
  c.fillRect(pb.x - 2.6, pb.y - 19, 1.8, 1.8);
  cables(c, pb.x + 2, pb.y - 13, o0.x - 4, o0.y - 12, 2, "#22201e");

  /* couronne principale de sacs de sable, posée sur le niveau bas */
  sacs(c, 0, 0, 1.0, 7, 13, "#a89a6e", "#8d8054", 4711);

  /* second rang de sacs à l'arrière : parapet plus haut côté nord */
  var al2 = prng(933);
  for(var s = 0; s < 6; s++){
    var as = 2.45 + s * 0.36 + al2() * 0.1;
    var rs = 0.96 + al2() * 0.08;
    var sx = Math.cos(as) * rs, sy = Math.sin(as) * rs;
    var col = al2() > 0.5 ? "#a89a6e" : "#8d8054";
    var fS = faces(col);
    var sc = 0.82 + al2() * 0.24;
    boite(c, sx, sy, 0.40 * sc, 0.29 * sc, 13, 6.2 * sc, fS.t, fS.g, fS.d, true);
    var ps = iso(sx, sy);
    c.strokeStyle = "rgba(0,0,0,.18)"; c.lineWidth = 1;
    c.beginPath();
    c.moveTo(ps.x - 5 * sc, ps.y - 13 - 6.2 * sc);
    c.lineTo(ps.x + 5 * sc, ps.y - 13 - 6.2 * sc);
    c.stroke();
  }

  /* caisses de munitions ouvertes, bandes en laiton qui pendent */
  function caisse(gx, gy){
    var f = faces(MAT.olive);
    boite(c, gx, gy, 0.50, 0.36, 12, 10, f.t, f.g, f.d);
    var p = iso(gx, gy);
    /* intérieur sombre */
    c.fillStyle = "#2c3320";
    c.beginPath();
    c.moveTo(p.x - 7, p.y - 22); c.lineTo(p.x + 2, p.y - 27);
    c.lineTo(p.x + 9, p.y - 24); c.lineTo(p.x, p.y - 19);
    c.closePath(); c.fill();
    /* couvercle relevé */
    c.fillStyle = ecl(MAT.olive, 0.82);
    c.beginPath();
    c.moveTo(p.x - 10, p.y - 23); c.lineTo(p.x + 4, p.y - 33);
    c.lineTo(p.x + 14, p.y - 28); c.lineTo(p.x, p.y - 19);
    c.closePath(); c.fill();
    c.strokeStyle = "rgba(255,255,255,.14)"; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(p.x - 10, p.y - 23); c.lineTo(p.x + 4, p.y - 33); c.stroke();
    /* ferrures d'angle */
    c.strokeStyle = "#3a3a30"; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(p.x - 12, p.y - 20); c.lineTo(p.x - 12, p.y - 12); c.stroke();
    c.beginPath(); c.moveTo(p.x + 12, p.y - 19); c.lineTo(p.x + 12, p.y - 11); c.stroke();
    /* marquage pochoir */
    c.fillStyle = "rgba(232,196,55,.32)";
    c.fillRect(p.x - 6, p.y - 16, 9, 2);
    /* bande de cartouches qui déborde */
    c.strokeStyle = "#5a4a22"; c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(p.x + 2, p.y - 21);
    c.quadraticCurveTo(p.x + 13, p.y - 14, p.x + 9, p.y - 2);
    c.stroke();
    c.fillStyle = "#e0b84a";
    for(var i = 0; i < 6; i++){
      var tt = i / 5;
      c.fillRect(p.x + 2 + 11 * tt - 1.4, p.y - 21 + 19 * tt * tt - 1.4, 2.8, 3.4);
    }
    c.fillStyle = "rgba(255,255,255,.12)";
    c.fillRect(p.x - 11, p.y - 21, 22, 1.6);
  }
  caisse(-0.66, 0.54);
  caisse(0.58, 0.66);

  /* fanion sur piquet */
  var q = iso(-1.02, -0.38);
  c.strokeStyle = "#6b5a42"; c.lineWidth = 2.4; c.lineCap = "round";
  c.beginPath(); c.moveTo(q.x, q.y - 12); c.lineTo(q.x, q.y - 36); c.stroke();
  c.fillStyle = "#b8493a";
  c.beginPath();
  c.moveTo(q.x, q.y - 34); c.quadraticCurveTo(q.x - 13, q.y - 32, q.x - 10, q.y - 24);
  c.quadraticCurveTo(q.x - 6, q.y - 26, q.x, q.y - 24);
  c.closePath(); c.fill();

  /* nappe de douilles : concentrée côté éjection + éparpillées */
  var al3 = prng(551);
  for(var i2 = 0; i2 < 30; i2++){
    var conc = i2 < 16;
    var a2, r2;
    if(conc){ a2 = -0.5 + al3() * 1.4; r2 = 0.30 + al3() * 0.42; }
    else { a2 = al3() * 6.2832; r2 = 0.30 + al3() * 0.5; }
    var pp = iso(Math.cos(a2) * r2, Math.sin(a2) * r2);
    c.save(); c.translate(pp.x, pp.y - 12); c.rotate(al3() * 3.14);
    c.fillStyle = "#c9a54a";
    c.fillRect(-1.2, -0.7, 2.4, 1.4);
    c.fillStyle = "rgba(255,240,190,.3)";
    c.fillRect(-1.2, -0.7, 0.9, 1.4);
    c.restore();
  }

  /* canon de rechange posé devant le nid, manchon perforé visible */
  var pr = iso(0.30, 1.24);
  c.save();
  c.globalAlpha = 0.20; c.fillStyle = "#000";
  c.beginPath(); c.ellipse(pr.x, pr.y + 2, 17, 3.4, 0.1, 0, 6.2832); c.fill();
  c.restore();
  c.save();
  c.translate(pr.x, pr.y); c.rotate(0.16);
  c.fillStyle = "#3a3835"; c.fillRect(-16, -2.2, 32, 4.4);
  c.fillStyle = "#55524c"; c.fillRect(-16, -2.2, 32, 1.4);
  c.fillStyle = "#22201e";
  for(var h2 = 0; h2 < 5; h2++){
    c.beginPath(); c.arc(-10 + h2 * 4.4, 0.2, 0.8, 0, 6.2832); c.fill();
  }
  c.fillStyle = "#6b6861"; c.fillRect(14, -2.8, 3, 5.6);
  c.restore();

  /* embase : fût d'acier + couronne dentée + pivot */
  cylindre(c, 0, 0, 0.46, 12, 6, MAT.acierC, MAT.acierO);
  c.strokeStyle = "#55524c"; c.lineWidth = 2;
  for(var g = 0; g < 18; g++){
    var ag = g / 18 * 6.2832;
    var g1 = iso(Math.cos(ag) * 0.33, Math.sin(ag) * 0.33);
    var g2 = iso(Math.cos(ag) * 0.46, Math.sin(ag) * 0.46);
    c.beginPath(); c.moveTo(g1.x, g1.y - 18); c.lineTo(g2.x, g2.y - 18); c.stroke();
  }
  cylindre(c, 0, 0, 0.30, 18, 4, "#77746c", "#4f4c47");
};

/* ================================================================
   CHALUMEAU — projeteur incendiaire.
   Silhouette : deux grandes bonbonnes rouges dressées à l'arrière,
   une lance longue et fine à l'avant.
   ================================================================ */
SOCLES.chalumeau = function(c){
  ombreContact(c, 0, 0, 2.4, 2.4, 0.27);

  /* ---- dalle octogonale + liseré d'avertissement ---- */
  prisme(c, 0, 0, 1.18, 8, 0.3927, 0, 6, MAT.beton, MAT.betonO);
  c.save(); c.globalAlpha = 0.5;
  for(var d0 = 0; d0 < 16; d0++){
    var a0 = d0 / 16 * 6.2832;
    var p0 = iso(Math.cos(a0) * 1.06, Math.sin(a0) * 1.06);
    c.fillStyle = d0 % 2 ? MAT.danger : "#22201e";
    c.fillRect(p0.x - 2, p0.y - 7.5, 4, 2.2);
  }
  c.restore();

  /* ---- platine d'acier rivetée ---- */
  var f = faces("#5b5851");
  boite(c, 0, 0, 1.42, 1.42, 6, 8, f.t, f.g, f.d);
  c.fillStyle = "#383632";
  for(var i = 0; i < 12; i++){
    var a1 = i / 12 * 6.2832, p1 = iso(Math.cos(a1) * 0.62, Math.sin(a1) * 0.62);
    c.beginPath(); c.arc(p1.x, p1.y - 14, 1.4, 0, 6.2832); c.fill();
  }
  /* joints de tôle sur le pont */
  c.save(); c.globalAlpha = 0.25; c.strokeStyle = "#2c2a27"; c.lineWidth = 1;
  var j1 = iso(-0.70, 0.18), j2 = iso(0.70, 0.18);
  c.beginPath(); c.moveTo(j1.x, j1.y - 14); c.lineTo(j2.x, j2.y - 14); c.stroke();
  var j3 = iso(0.20, -0.70), j4 = iso(0.20, 0.70);
  c.beginPath(); c.moveTo(j3.x, j3.y - 14); c.lineTo(j4.x, j4.y - 14); c.stroke();
  c.restore();

  /* ---- berceau des bonbonnes, à l'arrière ---- */
  var fb = faces("#46443f");
  boite(c, -0.36, -0.46, 1.10, 0.70, 14, 3, fb.t, fb.g, fb.d);

  /* ---- une bonbonne musclée ---- */
  function bonbonne(gx, gy, h){
    var p = iso(gx, gy), rx = 0.30 * RX, ry = 0.30 * RY;
    var z0 = 17, yt = p.y - z0 - h;
    cylindre(c, gx, gy, 0.30, z0, h, "#d64a38", "#a52e21");
    /* dôme d'épaule */
    c.fillStyle = "#d95340";
    c.beginPath();
    c.moveTo(p.x - rx, yt);
    c.ellipse(p.x, yt, rx, ry * 2.0, 0, Math.PI, 0, false);
    c.closePath(); c.fill();
    c.strokeStyle = "rgba(255,255,255,.34)"; c.lineWidth = 1.4;
    c.beginPath(); c.ellipse(p.x, yt, rx * 0.72, ry * 1.5, 0, 3.35, 4.6); c.stroke();
    /* spéculaire vertical */
    c.fillStyle = "rgba(255,255,255,.20)";
    c.fillRect(p.x - rx * 0.55, p.y - z0 - h * 0.92, 2.8, h * 0.78);
    /* cerclages boulonnés */
    for(var k = 0; k < 2; k++){
      var hb = z0 + h * (k ? 0.64 : 0.28);
      c.strokeStyle = "#332f2b"; c.lineWidth = 3;
      c.beginPath(); c.ellipse(p.x, p.y - hb, rx + 0.5, ry + 0.4, 0, 0, Math.PI); c.stroke();
      c.strokeStyle = "#918d84"; c.lineWidth = 1;
      c.beginPath(); c.ellipse(p.x, p.y - hb - 1.6, rx + 0.5, ry + 0.4, 0, 0.3, Math.PI - 0.3); c.stroke();
      c.fillStyle = "#22201e";
      c.fillRect(p.x - 1.6, p.y - hb + ry - 1.6, 3.2, 3.2);
      c.fillStyle = "#8d8a82";
      c.fillRect(p.x - 0.7, p.y - hb + ry - 0.7, 1.4, 1.4);
    }
    /* bande pochoir blanche près du col */
    c.fillStyle = "rgba(255,250,240,.82)";
    c.fillRect(p.x - rx, p.y - z0 - h * 0.90, rx * 2, 3.6);
    c.fillStyle = "rgba(40,20,14,.7)";
    for(var t = 0; t < 3; t++) c.fillRect(p.x - rx + 3.4 + t * 6, p.y - z0 - h * 0.90 + 1, 1.6, 1.6);
    /* pictogramme flamme */
    c.fillStyle = "#f2c445";
    c.beginPath();
    c.moveTo(p.x + 4, p.y - z0 - h * 0.42);
    c.quadraticCurveTo(p.x + 1, p.y - z0 - h * 0.42 - 5, p.x + 4, p.y - z0 - h * 0.42 - 9);
    c.quadraticCurveTo(p.x + 7, p.y - z0 - h * 0.42 - 5, p.x + 4, p.y - z0 - h * 0.42);
    c.closePath(); c.fill();
    /* suie en pied */
    c.save(); c.globalAlpha = 0.20; c.fillStyle = "#0c0a08";
    c.beginPath(); c.ellipse(p.x, p.y - z0 + 1, rx * 0.95, ry * 0.8, 0, 0, 6.2832); c.fill();
    c.restore();
    /* col + robinet à volant plein */
    cylindre(c, gx, gy, 0.085, z0 + h + 9, 7, "#b9b5aa", "#7c7970");
    var yv = p.y - z0 - h - 18;
    c.fillStyle = "#a8352a";
    c.beginPath(); c.ellipse(p.x, yv, 4.2, 2.4, 0, 0, 6.2832); c.fill();
    c.strokeStyle = "#5e1c14"; c.lineWidth = 1.1;
    c.beginPath(); c.ellipse(p.x, yv, 4.2, 2.4, 0, 0, 6.2832); c.stroke();
    c.strokeStyle = "#d89088"; c.lineWidth = 1;
    c.beginPath(); c.moveTo(p.x - 3.8, yv - 0.6); c.lineTo(p.x + 3.8, yv - 0.6); c.stroke();
    c.beginPath(); c.moveTo(p.x - 1.2, yv - 2); c.lineTo(p.x + 1.2, yv + 0.9); c.stroke();
    c.fillStyle = "#3c3a36";
    c.beginPath(); c.arc(p.x, yv - 0.4, 1.2, 0, 6.2832); c.fill();
    /* manomètre accolé au col */
    c.strokeStyle = "#8d8a82"; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(p.x + 3, yv + 8); c.lineTo(p.x + 7, yv + 7); c.stroke();
    c.fillStyle = "#e8e4d8";
    c.beginPath(); c.arc(p.x + 8.5, yv + 6.5, 3.2, 0, 6.2832); c.fill();
    c.strokeStyle = "#2a2a2a"; c.lineWidth = 0.9;
    c.beginPath(); c.arc(p.x + 8.5, yv + 6.5, 3.2, 0, 6.2832); c.stroke();
    c.strokeStyle = "#c23325"; c.lineWidth = 1;
    c.beginPath(); c.moveTo(p.x + 8.5, yv + 6.5); c.lineTo(p.x + 10.3, yv + 4.5); c.stroke();
  }
  bonbonne(-0.62, -0.26, 42);
  bonbonne(-0.10, -0.66, 36);

  /* ---- sangle d'acier commune qui tient les deux bonbonnes ---- */
  var s1 = iso(-0.62, -0.26), s2 = iso(-0.10, -0.66);
  c.strokeStyle = "#3c3a36"; c.lineWidth = 3.4;
  c.beginPath(); c.moveTo(s1.x - 11, s1.y - 40); c.lineTo(s2.x + 11, s2.y - 37); c.stroke();
  c.strokeStyle = "#8d8a82"; c.lineWidth = 1;
  c.beginPath(); c.moveTo(s1.x - 11, s1.y - 41.5); c.lineTo(s2.x + 11, s2.y - 38.5); c.stroke();
  c.fillStyle = "#22201e";
  c.beginPath(); c.arc(s1.x - 9, s1.y - 40, 1.3, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(s2.x + 9, s2.y - 37.4, 1.3, 0, 6.2832); c.fill();

  /* ---- collecteur derrière le pivot ---- */
  var fm = faces("#3c4a55");
  boite(c, -0.30, -0.30, 0.36, 0.28, 14, 10, fm.t, fm.g, fm.d);
  var pm = iso(-0.30, -0.30);
  plaqueBoulonnee(c, pm.x - 6, pm.y - 23, 12, 5, "#2b3640");

  /* ---- tuyaux gainés courts : cols -> collecteur ---- */
  function tuyau(x0, y0, x1, y1, cx1, cy1, cx2, cy2, lw){
    c.strokeStyle = "#232325"; c.lineWidth = lw; c.lineCap = "round";
    c.beginPath(); c.moveTo(x0, y0); c.bezierCurveTo(cx1, cy1, cx2, cy2, x1, y1); c.stroke();
    c.save(); c.setLineDash([2.4, 3.2]);
    c.strokeStyle = "#54545a"; c.lineWidth = lw * 0.45;
    c.beginPath(); c.moveTo(x0, y0); c.bezierCurveTo(cx1, cy1, cx2, cy2, x1, y1); c.stroke();
    c.restore();
  }
  tuyau(s1.x + 4, s1.y - 62, pm.x - 3, pm.y - 23,
        s1.x + 8, s1.y - 48, pm.x - 7, pm.y - 32, 4.2);
  tuyau(s2.x + 4, s2.y - 56, pm.x + 3, pm.y - 23,
        s2.x + 8, s2.y - 42, pm.x + 6, pm.y - 30, 4.2);

  /* ---- pivot cranté, haut ---- */
  cylindre(c, 0, 0, 0.40, 14, 10, ecl(MAT.acier, 1.15), MAT.acierO);
  c.fillStyle = "#2f2d2a";
  for(var g = 0; g < 9; g++){
    var ag = 0.25 + g / 8 * 2.65;
    var gx2 = Math.cos(ag) * 0.40 * RX;
    var gy2 = Math.sin(ag) * 0.40 * RY;
    c.fillRect(gx2 - 1.4, gy2 - 24, 2.8, 4.4);
  }
  /* moteur d'azimut + pignon + câble */
  var fmo = faces("#4a4844");
  boite(c, -0.46, 0.32, 0.26, 0.22, 14, 9, fmo.t, fmo.g, fmo.d);
  var pmo = iso(-0.46, 0.32);
  c.fillStyle = "#9b9890";
  c.beginPath(); c.ellipse(pmo.x + 5, pmo.y - 22, 3.6, 2.0, 0, 0, 6.2832); c.fill();
  c.fillStyle = "#4c4a43";
  c.beginPath(); c.ellipse(pmo.x + 5, pmo.y - 22, 1.3, 0.8, 0, 0, 6.2832); c.fill();
  c.strokeStyle = "#22201e"; c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(pmo.x - 3, pmo.y - 15);
  c.bezierCurveTo(pmo.x - 8, pmo.y - 10, pmo.x - 11, pmo.y - 8, pmo.x - 13, pmo.y - 5);
  c.stroke();

  /* ---- réserve de naphte à l'avant-gauche (hors ligne de tir) ---- */
  var fn = faces("#4d4b46");
  boite(c, 0.06, 0.62, 0.52, 0.40, 14, 13, fn.t, fn.g, fn.d);
  var pr = iso(0.06, 0.62);
  plaqueBoulonnee(c, pr.x - 7, pr.y - 25, 13, 6, "#3a3834");
  c.fillStyle = "#d8842e";
  c.beginPath();
  c.moveTo(pr.x + 1, pr.y - 15);
  c.quadraticCurveTo(pr.x - 2, pr.y - 19, pr.x + 1, pr.y - 23);
  c.quadraticCurveTo(pr.x + 4, pr.y - 19, pr.x + 1, pr.y - 15);
  c.closePath(); c.fill();
  /* conduite rigide qui rentre dans la platine */
  c.strokeStyle = "#3c3a36"; c.lineWidth = 2.8;
  c.beginPath();
  c.moveTo(pr.x + 8, pr.y - 20); c.lineTo(pr.x + 13, pr.y - 17); c.lineTo(pr.x + 13, pr.y - 11);
  c.stroke();

  /* ---- plaques pare-chaleur sur le pont + suie de l'avant ---- */
  plaqueBoulonnee(c, 10, -6, 14, 6, "#33312d");
  plaqueBoulonnee(c, 22, -12, 11, 5, "#2c2a26");
  c.save(); c.globalAlpha = 0.22; c.fillStyle = "#100c0a";
  c.beginPath(); c.ellipse(32, 8, 22, 8, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(16, 14, 14, 6, 0, 0, 6.2832); c.fill();
  c.restore();
  salissures(c, -26, -12, 52, 16, 9, 991);
};

/* ================================================================
   FRELON — batterie de missiles.
   Silhouette : plateforme HAUTE sur quatre vérins, rampe inclinée.
   ================================================================ */
SOCLES.frelon = function(c){
  ombreContact(c, 0, 0, 3.05, 3.05, 0.28);

  /* ---- dalle d'ancrage octogonale, joints rayonnants ---- */
  prisme(c, 0, 0, 1.48, 8, 0.3927, 0, 5, MAT.beton, MAT.betonO);
  var o = iso(0, 0);
  c.save(); c.globalAlpha = 0.20; c.strokeStyle = "#3e3c38"; c.lineWidth = 1;
  for(var k = 0; k < 8; k++){
    var a = k / 8 * 6.2832 + 0.3927;
    var p1 = iso(Math.cos(a) * 0.88, Math.sin(a) * 0.88);
    var p2 = iso(Math.cos(a) * 1.44, Math.sin(a) * 1.44);
    c.beginPath(); c.moveTo(p1.x, p1.y - 5); c.lineTo(p2.x, p2.y - 5); c.stroke();
  }
  c.restore();
  /* bande d'avertissement peinte au bord de la dalle */
  c.save(); c.globalAlpha = 0.5;
  for(var d2 = 0; d2 < 18; d2++){
    var ad = d2 / 18 * 6.2832;
    var pd = iso(Math.cos(ad) * 1.34, Math.sin(ad) * 1.34);
    c.fillStyle = d2 % 2 ? MAT.danger : "#22201e";
    c.fillRect(pd.x - 2, pd.y - 6.5, 4, 2.2);
  }
  c.restore();

  /* ---- quatre appuis vérinés aux diagonales ---- */
  function appui(gx, gy){
    var p = iso(gx, gy);
    var h = iso(gx * 0.52, gy * 0.52);
    /* bras caisson qui part du flanc du caisson */
    c.strokeStyle = "#4c4a43"; c.lineWidth = 7; c.lineCap = "butt";
    c.beginPath(); c.moveTo(h.x, h.y - 19); c.lineTo(p.x, p.y - 12); c.stroke();
    c.strokeStyle = "#7c796f"; c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(h.x, h.y - 22); c.lineTo(p.x, p.y - 15); c.stroke();
    /* patin, vis de calage chromée, chape */
    cylindre(c, gx, gy, 0.24, 0, 4, "#55524b", "#33312c");
    cylindre(c, gx, gy, 0.10, 4, 6, "#d2cfc6", "#8e8b83");
    c.fillStyle = "rgba(255,255,255,.42)";
    c.fillRect(p.x - 1.3, p.y - 10.2, 1.1, 5.4);
    cylindre(c, gx, gy, 0.16, 10, 3, "#6b6861", "#44423d");
    /* boulon du genou */
    c.fillStyle = "#22201e";
    c.beginPath(); c.arc(p.x, p.y - 13, 1.4, 0, 6.2832); c.fill();
  }
  /* les deux arrière AVANT le caisson, les deux avant APRÈS */
  appui(-1.08, -1.08);
  appui(1.08, -1.08);
  appui(-1.08, 1.08);

  /* ---- caisson blindé sur deux niveaux ---- */
  var f0 = faces("#565349");
  boite(c, 0, 0, 1.62, 1.46, 5, 9, f0.t, f0.g, f0.d);
  var f1 = faces("#67551a");
  boite(c, 0, 0, 1.42, 1.24, 14, 12, f1.t, f1.g, f1.d);

  /* rangée de boulons sur l'arête du niveau bas */
  c.fillStyle = "rgba(0,0,0,.35)";
  for(var i = 0; i < 7; i++){
    var t = -0.66 + i * 0.22;
    var pb = iso(t, 0.72);
    c.beginPath(); c.arc(pb.x, pb.y - 11, 1.1, 0, 6.2832); c.fill();
    var pb2 = iso(0.80, t);
    c.beginPath(); c.arc(pb2.x, pb2.y - 11, 1.1, 0, 6.2832); c.fill();
  }
  /* plaques boulonnées sur la face gauche du blindage */
  var pg = iso(-0.10, 0.62);
  plaqueBoulonnee(c, pg.x - 9, pg.y - 24, 15, 7, "#584916");
  plaqueBoulonnee(c, pg.x + 9, pg.y - 21, 12, 6, "#5e4d17");
  /* évents à persiennes sur la face droite */
  c.strokeStyle = "#3a3010"; c.lineWidth = 2.2;
  var pv = iso(0.71, -0.20);
  for(var j = 0; j < 3; j++){
    c.beginPath();
    c.moveTo(pv.x + 3, pv.y - 24 + j * 3.4);
    c.lineTo(pv.x - 6, pv.y - 19.5 + j * 3.4);
    c.stroke();
  }
  salissures(c, o.x - 26, o.y - 22, 52, 16, 9, 4177);

  /* ---- l'avant des appuis, par-dessus le caisson ---- */
  appui(1.08, 1.08);

  /* ---- plaque tournante crantée (l'axe de rotation) ---- */
  cylindre(c, 0, 0, 0.70, 26, 5, ecl(MAT.acier, 1.12), MAT.acierO);
  /* crans d'engrenage sur la moitié visible de la couronne */
  c.fillStyle = "#2f2d2a";
  for(var g = 0; g < 11; g++){
    var ag = 0.15 + g / 10 * 2.85;
    var gx2 = o.x + Math.cos(ag) * 0.70 * RX;
    var gy2 = o.y + Math.sin(ag) * 0.70 * RY;
    c.fillRect(gx2 - 1.6, gy2 - 31, 3.2, 5);
  }

  /* ---- moteur d'azimut + pignon qui mord la couronne ---- */
  var f2 = faces("#3c4a55");
  boite(c, -0.34, 0.70, 0.30, 0.26, 14, 12, f2.t, f2.g, f2.d);
  var pm = iso(-0.34, 0.70);
  plaqueBoulonnee(c, pm.x - 6, pm.y - 25, 12, 5, "#2b3640");
  /* pignon */
  c.fillStyle = "#9b9890";
  c.beginPath(); c.ellipse(pm.x + 6, pm.y - 28, 4.2, 2.4, 0, 0, 6.2832); c.fill();
  c.fillStyle = "#4c4a43";
  c.beginPath(); c.ellipse(pm.x + 6, pm.y - 28, 1.6, 0.9, 0, 0, 6.2832); c.fill();
  /* câble blindé du moteur qui descend le long du caisson */
  c.strokeStyle = "#22201e"; c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(pm.x - 4, pm.y - 20);
  c.bezierCurveTo(pm.x - 10, pm.y - 10, pm.x - 16, pm.y - 8, pm.x - 20, pm.y - 2);
  c.stroke();

  /* ---- râtelier de roquettes de rechange ---- */
  var f3 = faces(FRELON.moyen);
  boite(c, 1.14, 0.42, 0.52, 0.36, 5, 7, f3.t, f3.g, f3.d);
  var pr = iso(1.14, 0.42);
  for(var r2 = 0; r2 < 2; r2++){
    c.save();
    c.translate(pr.x - 3 + r2 * 7, pr.y - 14 - r2 * 3);
    c.rotate(0.42);
    c.fillStyle = FRELON.tube;
    if(c.roundRect){ c.beginPath(); c.roundRect(-11, -2.2, 20, 4.4, 2); c.fill(); }
    else c.fillRect(-11, -2.2, 20, 4.4);
    c.fillStyle = "#b8352a";
    c.beginPath(); c.moveTo(9, -2.2); c.lineTo(14, 0); c.lineTo(9, 2.2); c.closePath(); c.fill();
    c.fillStyle = "rgba(255,255,255,.22)";
    c.fillRect(-10, -1.8, 18, 1.2);
    c.restore();
  }

  /* ---- pupitre de tir relié par câbles ---- */
  boite(c, -0.92, 0.86, 0.40, 0.30, 5, 13, f2.t, f2.g, f2.d);
  var pp = iso(-0.92, 0.86);
  plaqueBoulonnee(c, pp.x - 7, pp.y - 25, 14, 6, "#2b3640");
  c.fillStyle = "#6ee08a"; c.beginPath(); c.arc(pp.x - 4, pp.y - 16, 1.1, 0, 6.2832); c.fill();
  c.fillStyle = "#ffd070"; c.beginPath(); c.arc(pp.x, pp.y - 16, 1.1, 0, 6.2832); c.fill();
  cables(c, pp.x + 6, pp.y - 6, o.x + 10, o.y - 8, 3);

  /* ---- antenne fouet sur le pupitre (toujours devant le bloc) ---- */
  var pa = iso(-0.92, 0.86);
  c.strokeStyle = "#8e8b83"; c.lineWidth = 1.3;
  c.beginPath(); c.moveTo(pa.x - 5, pa.y - 17); c.lineTo(pa.x - 9, pa.y - 44); c.stroke();
  c.fillStyle = "#b8352a";
  c.beginPath(); c.arc(pa.x - 9, pa.y - 44, 1.3, 0, 6.2832); c.fill();

  /* traces de brûlure des départs, derrière la machine */
  c.save(); c.globalAlpha = 0.18; c.fillStyle = "#0c0a08";
  c.beginPath(); c.ellipse(o.x - 34, o.y - 4, 16, 6, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(o.x - 18, o.y + 4, 12, 5, 0, 0, 6.2832); c.fill();
  c.restore();
};

/* ================================================================
   PILON — obusier de siège.
   Silhouette : une fosse creusée, un tube très épais quasi vertical.
   ================================================================ */
SOCLES.pilon = function(c){
  ombreContact(c, 0, 0, 3.1, 3.1, 0.28);

  /* ---- dalle hexagonale à deux niveaux ---- */
  prisme(c, 0, 0, 1.50, 6, 0.5236, 0, 7, MAT.beton, MAT.betonO);
  prisme(c, 0, 0, 1.30, 6, 0.5236, 7, 4, ecl(MAT.beton, 1.05), ecl(MAT.betonO, 1.10));
  var p = iso(0, 0);

  /* joints rayonnants du niveau bas */
  c.save(); c.globalAlpha = 0.22; c.strokeStyle = "#3e3c38"; c.lineWidth = 1;
  for(var k = 0; k < 6; k++){
    var a = k / 6 * 6.2832 + 0.5236;
    var j1 = iso(Math.cos(a) * 1.06, Math.sin(a) * 1.06);
    var j2 = iso(Math.cos(a) * 1.47, Math.sin(a) * 1.47);
    c.beginPath(); c.moveTo(j1.x, j1.y - 7); c.lineTo(j2.x, j2.y - 7); c.stroke();
  }
  c.restore();

  /* bandes d'avertissement peintes autour de la gueule de la fosse */
  c.save(); c.globalAlpha = 0.55;
  for(var d2 = 0; d2 < 20; d2++){
    var ad = d2 / 20 * 6.2832;
    var pd = iso(Math.cos(ad) * 1.03, Math.sin(ad) * 1.03);
    c.fillStyle = d2 % 2 ? MAT.danger : "#22201e";
    c.fillRect(pd.x - 2.2, pd.y - 12.2, 4.4, 2.4);
  }
  c.restore();

  /* ---- la fosse : gueule sombre creusée dans le niveau haut ---- */
  c.fillStyle = "#33312c";
  c.beginPath(); c.ellipse(p.x, p.y - 11, 0.95 * RX, 0.95 * RY, 0, 0, 6.2832); c.fill();
  var g = c.createRadialGradient(p.x, p.y - 13, 3, p.x, p.y - 11, 0.95 * RX);
  g.addColorStop(0, "rgba(0,0,0,.85)");
  g.addColorStop(0.72, "rgba(0,0,0,.30)");
  g.addColorStop(1, "rgba(0,0,0,.04)");
  c.fillStyle = g;
  c.beginPath(); c.ellipse(p.x, p.y - 11, 0.95 * RX, 0.95 * RY, 0, 0, 6.2832); c.fill();
  /* lèvre éclairée de la fosse (lumière haut-gauche) */
  c.strokeStyle = "rgba(255,246,225,.20)"; c.lineWidth = 1.2;
  c.beginPath(); c.ellipse(p.x, p.y - 11, 0.95 * RX, 0.95 * RY, 0, 3.5, 5.9); c.stroke();

  /* ---- fond bétonné + PLAQUE D'ASSISE CIRCULAIRE CRANTÉE ---- */
  c.fillStyle = "#57534b";
  c.beginPath(); c.ellipse(p.x, p.y - 5, 0.80 * RX, 0.80 * RY, 0, 0, 6.2832); c.fill();
  /* crans de la couronne (dents autour de la plaque) */
  c.fillStyle = "#2c2a26";
  for(var cr = 0; cr < 16; cr++){
    var ac = cr / 16 * 6.2832 + 0.19;
    var cxp = p.x + Math.cos(ac) * 0.70 * RX, cyp = p.y - 5 + Math.sin(ac) * 0.70 * RY;
    c.fillRect(cxp - 1.8, cyp - 1.2, 3.6, 2.6);
  }
  /* plaque d'acier */
  c.fillStyle = "#514e47";
  c.beginPath(); c.ellipse(p.x, p.y - 5.5, 0.64 * RX, 0.64 * RY, 0, 0, 6.2832); c.fill();
  c.fillStyle = "#413e39";
  c.beginPath(); c.ellipse(p.x, p.y - 6, 0.50 * RX, 0.50 * RY, 0, 0, 6.2832); c.fill();
  /* nervures rayonnantes */
  c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 1.2;
  for(var nr = 0; nr < 8; nr++){
    var an = nr / 8 * 6.2832 + 0.39;
    c.beginPath();
    c.moveTo(p.x + Math.cos(an) * 0.16 * RX, p.y - 6 + Math.sin(an) * 0.16 * RY);
    c.lineTo(p.x + Math.cos(an) * 0.60 * RX, p.y - 5.5 + Math.sin(an) * 0.60 * RY);
    c.stroke();
  }
  /* boulons d'ancrage */
  c.fillStyle = "#24221f";
  for(var bo = 0; bo < 8; bo++){
    var ab = bo / 8 * 6.2832;
    c.beginPath();
    c.arc(p.x + Math.cos(ab) * 0.57 * RX, p.y - 5.5 + Math.sin(ab) * 0.57 * RY, 1.3, 0, 6.2832);
    c.fill();
  }
  /* reflet de la plaque */
  c.strokeStyle = "rgba(255,246,225,.14)"; c.lineWidth = 1;
  c.beginPath(); c.ellipse(p.x, p.y - 5.5, 0.64 * RX, 0.64 * RY, 0, 3.4, 6.0); c.stroke();
  /* moyeu central sur lequel repose la culasse */
  cylindre(c, 0, 0, 0.22, 5, 4, "#6b6861", "#3a3833");

  /* ---- couronne de sacs de sable sur le niveau haut ---- */
  sacs(c, 0, 0, 1.16, 11, 13, "#9d9068", "#847955", 8123);

  /* ---- RÂTELIER D'OBUS bien fourni (sud-est) ---- */
  var f = faces("#4a4740");
  boite(c, 1.16, 0.48, 0.80, 0.42, 7, 4, f.t, f.g, f.d);
  /* rail dorsal contre lequel les obus s'appuient */
  c.strokeStyle = "#33312c"; c.lineWidth = 3;
  var ra = iso(0.94, 0.86), rb = iso(1.62, 0.18);
  c.beginPath(); c.moveTo(ra.x, ra.y - 24); c.lineTo(rb.x, rb.y - 24); c.stroke();
  c.strokeStyle = "#6b6861"; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(ra.x, ra.y - 25); c.lineTo(rb.x, rb.y - 25); c.stroke();
  /* montants du rail */
  c.strokeStyle = "#33312c"; c.lineWidth = 2;
  c.beginPath(); c.moveTo(ra.x, ra.y - 10); c.lineTo(ra.x, ra.y - 24); c.stroke();
  c.beginPath(); c.moveTo(rb.x, rb.y - 10); c.lineTo(rb.x, rb.y - 24); c.stroke();
  /* les obus debout, gros et jaunes */
  function obusDebout(gx, gy, pench){
    var q = iso(gx, gy);
    c.save();
    c.translate(q.x, q.y - 11); c.rotate(pench);
    c.fillStyle = "#241f12";
    c.beginPath();
    if(c.roundRect) c.roundRect(-4.4, -18, 8.8, 20, 2.6); else c.rect(-4.4, -18, 8.8, 20);
    c.fill();
    c.fillStyle = "#e2bd33";
    c.beginPath();
    if(c.roundRect) c.roundRect(-3.5, -17, 7, 18, 2.2); else c.rect(-3.5, -17, 7, 18);
    c.fill();
    c.fillStyle = "#8c8a84";
    c.beginPath(); c.moveTo(-3.5, -16.4); c.lineTo(0, -23); c.lineTo(3.5, -16.4); c.closePath(); c.fill();
    c.fillStyle = "#b8493a"; c.fillRect(-3.5, -6, 7, 2.6);
    c.fillStyle = "rgba(255,255,255,.30)"; c.fillRect(-2.7, -16, 1.8, 15.5);
    c.restore();
  }
  obusDebout(1.00, 0.76, -0.10);
  obusDebout(1.15, 0.61, -0.08);
  obusDebout(1.30, 0.46, -0.06);
  obusDebout(1.45, 0.31, -0.04);
  /* deux obus couchés devant le râtelier */
  var oc = iso(1.30, 0.78);
  c.save();
  c.translate(oc.x, oc.y - 9); c.rotate(0.46);
  c.fillStyle = "#241f12";
  if(c.roundRect){ c.beginPath(); c.roundRect(-10, -3.6, 20, 7.2, 3); c.fill(); }
  else c.fillRect(-10, -3.6, 20, 7.2);
  c.fillStyle = "#d4b02c";
  if(c.roundRect){ c.beginPath(); c.roundRect(-9.2, -2.8, 18.4, 5.6, 2.4); c.fill(); }
  else c.fillRect(-9.2, -2.8, 18.4, 5.6);
  c.fillStyle = "#8c8a84";
  c.beginPath(); c.moveTo(8.6, -2.8); c.lineTo(13, 0); c.lineTo(8.6, 2.8); c.closePath(); c.fill();
  c.fillStyle = "#b8493a"; c.fillRect(-8, -2.8, 2.6, 5.6);
  c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(-8.8, -2.2, 16, 1.5);
  c.restore();

  /* ---- POTENCE DE CHARGEMENT avec obus suspendu (ouest) ---- */
  var pc = iso(-1.08, 0.58);
  /* embase boulonnée */
  cylindre(c, -1.08, 0.58, 0.16, 7, 3, "#55524b", "#33312c");
  /* colonne */
  c.strokeStyle = "#4c4a43"; c.lineWidth = 4.6; c.lineCap = "butt";
  c.beginPath(); c.moveTo(pc.x, pc.y - 9); c.lineTo(pc.x, pc.y - 52); c.stroke();
  c.strokeStyle = "#8a877f"; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(pc.x - 1.4, pc.y - 10); c.lineTo(pc.x - 1.4, pc.y - 51); c.stroke();
  /* flèche vers la fosse */
  c.strokeStyle = "#4c4a43"; c.lineWidth = 3.6;
  c.beginPath(); c.moveTo(pc.x, pc.y - 50); c.lineTo(pc.x + 26, pc.y - 44); c.stroke();
  /* tirant diagonal */
  c.strokeStyle = "#33312c"; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(pc.x, pc.y - 38); c.lineTo(pc.x + 24, pc.y - 44); c.stroke();
  /* poulie + chaîne + obus suspendu */
  c.fillStyle = "#2c2a26";
  c.beginPath(); c.arc(pc.x + 25, pc.y - 44, 2.6, 0, 6.2832); c.fill();
  c.strokeStyle = "#22201e"; c.lineWidth = 1.3;
  c.beginPath(); c.moveTo(pc.x + 25, pc.y - 42); c.lineTo(pc.x + 25, pc.y - 30); c.stroke();
  c.save();
  c.translate(pc.x + 25, pc.y - 22);
  c.fillStyle = "#241f12";
  c.beginPath();
  if(c.roundRect) c.roundRect(-4.2, -8, 8.4, 17, 2.6); else c.rect(-4.2, -8, 8.4, 17);
  c.fill();
  c.fillStyle = "#e2bd33";
  c.beginPath();
  if(c.roundRect) c.roundRect(-3.3, -7, 6.6, 15, 2.2); else c.rect(-3.3, -7, 6.6, 15);
  c.fill();
  c.fillStyle = "#8c8a84";
  c.beginPath(); c.moveTo(-3.3, -6.6); c.lineTo(0, -12.4); c.lineTo(3.3, -6.6); c.closePath(); c.fill();
  c.fillStyle = "#b8493a"; c.fillRect(-3.3, 4, 6.6, 2.4);
  c.fillStyle = "rgba(255,255,255,.30)"; c.fillRect(-2.5, -6.4, 1.7, 12);
  c.restore();

  /* ---- pupitre de mise de feu + câbles vers la fosse ---- */
  var f2 = faces("#3c4a55");
  boite(c, -0.62, 1.02, 0.36, 0.28, 7, 12, f2.t, f2.g, f2.d);
  var pb = iso(-0.62, 1.02);
  plaqueBoulonnee(c, pb.x - 6, pb.y - 18, 12, 5, "#2b3640");
  c.fillStyle = "#6ee08a"; c.beginPath(); c.arc(pb.x - 3, pb.y - 10, 1.1, 0, 6.2832); c.fill();
  c.fillStyle = "#ff5a4a"; c.beginPath(); c.arc(pb.x + 1, pb.y - 10, 1.1, 0, 6.2832); c.fill();
  cables(c, pb.x + 6, pb.y - 6, p.x + 6, p.y - 8, 3);

  /* ---- suie de départ autour de la gueule ---- */
  c.save(); c.globalAlpha = 0.15; c.fillStyle = "#000";
  for(var s = 0; s < 12; s++){
    var a3 = s * 1.7, r3 = 1.02 + (s % 3) * 0.14;
    var pp = iso(Math.cos(a3) * r3, Math.sin(a3) * r3);
    c.beginPath(); c.ellipse(pp.x, pp.y - 11, 9, 3.8, 0, 0, 6.2832); c.fill();
  }
  c.restore();
  salissures(c, p.x - 30, p.y - 12, 60, 12, 8, 4451);
};

/* ================================================================
   BOBINE — pylône à arc.
   Silhouette : haute et fine, sphère au sommet.
   ================================================================ */
SOCLES.bobine = function(c){
  ombreContact(c, 0, 0, 2.3, 2.3, 0.26);
  /* dalle hexagonale */
  prisme(c, 0, 0, 1.06, 6, 0.2, 0, 9, MAT.beton, MAT.betonO);
  var o = iso(0, 0);
  /* rigoles de mise à la terre en cuivre, noyées dans la dalle */
  c.save(); c.globalAlpha = 0.4; c.strokeStyle = MAT.cuivre; c.lineWidth = 1.6;
  for(var m = 0; m < 4; m++){
    var am = m / 4 * 6.2832 + 0.8;
    var e1 = iso(Math.cos(am) * 0.2, Math.sin(am) * 0.2);
    var e2 = iso(Math.cos(am) * 0.92, Math.sin(am) * 0.92);
    c.beginPath(); c.moveTo(e1.x, e1.y - 9); c.lineTo(e2.x, e2.y - 9); c.stroke();
  }
  c.restore();
  /* boulons d'ancrage en couronne */
  c.fillStyle = "#3e3c38";
  for(var bn = 0; bn < 8; bn++){
    var ab = bn / 8 * 6.2832 + 0.4;
    var pb = iso(Math.cos(ab) * 0.85, Math.sin(ab) * 0.85);
    c.beginPath(); c.arc(pb.x, pb.y - 9, 1.3, 0, 6.2832); c.fill();
  }

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

  /* ---- colonne centrale ---- */
  /* socle-plinthe et tambour d'acier */
  prisme(c, 0, 0, 0.46, 8, 0.39, 9, 5, "#8a877f", "#55524c");
  cylindre(c, 0, 0, 0.33, 14, 8, "#4a4844", "#2f2d2a");
  plaqueBoulonnee(c, o.x - 6, o.y - 21, 12, 6, "#3a3834");
  /* bride basse */
  cylindre(c, 0, 0, 0.30, 22, 2.5, "#77746c", "#4a4844");

  /* LE BOBINAGE : cylindre de cuivre profond, spires serrées visibles */
  cylindre(c, 0, 0, 0.245, 24.5, 31.5, ecl(MAT.cuivre, 0.98), ecl(MAT.cuivre, 0.58));
  var rxB = 0.245 * RX, ryB = 0.245 * RY;
  c.save();
  c.strokeStyle = "rgba(72,38,8,.62)"; c.lineWidth = 1.0;
  for(var z = 26; z < 56; z += 2.4){
    c.beginPath();
    c.ellipse(o.x, o.y - z, rxB, ryB, 0, 0, Math.PI, false);
    c.stroke();
  }
  c.strokeStyle = "rgba(255,206,140,.5)"; c.lineWidth = 0.7;
  for(var z2 = 27.1; z2 < 56; z2 += 2.4){
    c.beginPath();
    c.ellipse(o.x, o.y - z2, rxB, ryB, 0, 0.6, Math.PI - 0.6, false);
    c.stroke();
  }
  /* reflet vertical du cuivre */
  c.fillStyle = "rgba(255,240,210,.30)";
  c.fillRect(o.x - rxB * 0.55, o.y - 55, 2.4, 30);
  c.restore();
  /* deux entretoises fines de cuivre poli, haut et bas seulement */
  cylindre(c, 0, 0, 0.262, 23.5, 2.4, ecl(MAT.cuivre, 1.1), ecl(MAT.cuivre, 0.5));
  cylindre(c, 0, 0, 0.262, 55, 2.4, ecl(MAT.cuivre, 1.1), ecl(MAT.cuivre, 0.5));
  /* deux barres de serrage verticales, boulonnées */
  c.strokeStyle = "#3c3a36"; c.lineWidth = 2.2; c.lineCap = "butt";
  c.beginPath(); c.moveTo(o.x - rxB - 1.6, o.y - 24); c.lineTo(o.x - rxB - 1.6, o.y - 57); c.stroke();
  c.beginPath(); c.moveTo(o.x + rxB + 1.6, o.y - 24); c.lineTo(o.x + rxB + 1.6, o.y - 57); c.stroke();
  c.fillStyle = "#8a877f";
  for(var jb = 0; jb < 4; jb++){
    c.fillRect(o.x - rxB - 2.6, o.y - 26 - jb * 9.5, 2, 1.6);
    c.fillRect(o.x + rxB + 0.6, o.y - 26 - jb * 9.5, 2, 1.6);
  }

  /* fil de cuivre qui sort du bas du bobinage vers chaque condensateur */
  c.strokeStyle = ecl(MAT.cuivre, 1.2); c.lineWidth = 1.4; c.lineCap = "round";
  var q1 = iso(-0.54, 0.18), q2 = iso(0.18, 0.54);
  c.beginPath();
  c.moveTo(o.x - rxB + 1, o.y - 26);
  c.quadraticCurveTo(q1.x + 6, o.y - 16, q1.x + 1, q1.y - 43);
  c.stroke();
  c.beginPath();
  c.moveTo(o.x + rxB - 1, o.y - 26);
  c.quadraticCurveTo(q2.x - 2, o.y - 14, q2.x - 1, q2.y - 43);
  c.stroke();

  /* isolateur sommital en céramique + collier d'acier */
  cylindre(c, 0, 0, 0.175, 56, 2.6, "#f4f0e4", "#c4bea6");
  cylindre(c, 0, 0, 0.145, 58.6, 2.6, "#e2ddcf", "#ada695");
  cylindre(c, 0, 0, 0.16, 61, 6, "#77746c", "#44423d");
  c.fillStyle = "#2f2d2a";
  c.fillRect(o.x - 4.5, o.y - 65, 1.6, 1.6);
  c.fillRect(o.x + 2.9, o.y - 65, 1.6, 1.6);

  /* ---- TROIS GRIFFES-ÉLECTRODES pointées vers la sphère (z=87) ---- */
  function griffe(x0, y0, x1, y1, x2, y2, ep){
    /* bras inférieur épais, avant-bras effilé, articulation ronde */
    c.lineCap = "round"; c.lineJoin = "round";
    c.strokeStyle = "#3a3834"; c.lineWidth = ep + 1.6;
    c.beginPath(); c.moveTo(o.x + x0, o.y + y0); c.lineTo(o.x + x1, o.y + y1); c.stroke();
    c.strokeStyle = "#55524c"; c.lineWidth = ep;
    c.beginPath(); c.moveTo(o.x + x0, o.y + y0); c.lineTo(o.x + x1, o.y + y1); c.stroke();
    c.strokeStyle = "#44423d"; c.lineWidth = ep - 0.6;
    c.beginPath(); c.moveTo(o.x + x1, o.y + y1); c.lineTo(o.x + x2, o.y + y2); c.stroke();
    c.strokeStyle = MAT.acierC; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(o.x + x0 - 0.5, o.y + y0 - 0.9); c.lineTo(o.x + x1 - 0.5, o.y + y1 - 0.9); c.stroke();
    /* articulation boulonnée au coude */
    c.fillStyle = "#77746c";
    c.beginPath(); c.arc(o.x + x1, o.y + y1, ep * 0.62, 0, 6.2832); c.fill();
    c.fillStyle = "#2f2d2a";
    c.beginPath(); c.arc(o.x + x1, o.y + y1, ep * 0.26, 0, 6.2832); c.fill();
    /* boule d'électrode au bout */
    c.fillStyle = "#e8e4d8";
    c.beginPath(); c.arc(o.x + x2, o.y + y2, 2.0, 0, 6.2832); c.fill();
    c.strokeStyle = "rgba(0,0,0,.4)"; c.lineWidth = 0.7;
    c.beginPath(); c.arc(o.x + x2, o.y + y2, 2.0, 0, 6.2832); c.stroke();
    c.fillStyle = "rgba(255,255,255,.6)";
    c.beginPath(); c.arc(o.x + x2 - 0.6, o.y + y2 - 0.6, 0.7, 0, 6.2832); c.fill();
  }
  /* tige porte-sphère centrale : la sphère ne flotte pas */
  c.strokeStyle = "#3a3834"; c.lineWidth = 3.4; c.lineCap = "butt";
  c.beginPath(); c.moveTo(o.x, o.y - 66); c.lineTo(o.x, o.y - 80); c.stroke();
  c.strokeStyle = "#6d6a63"; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(o.x - 0.8, o.y - 66); c.lineTo(o.x - 0.8, o.y - 80); c.stroke();
  /* galette isolante sur la tige */
  c.fillStyle = "#e2ddcf";
  c.beginPath(); c.ellipse(o.x, o.y - 73, 3.4, 1.5, 0, 0, 6.2832); c.fill();
  c.fillStyle = "#f4f0e4";
  c.beginPath(); c.ellipse(o.x, o.y - 74, 3.4, 1.5, 0, 0, 6.2832); c.fill();

  griffe(-4.5, -64, -16, -72, -11, -80, 3.4);
  griffe(4.5, -64, 16, -72, 11, -80, 3.4);
  griffe(1, -66, 8, -91, 3.4, -102, 3.0);

  /* ---- deux condensateurs cyan musclés ---- */
  function conda(gx, gy){
    var q = iso(gx, gy);
    cylindre(c, gx, gy, 0.155, 9, 3, "#4a4844", "#2f2d2a");
    cylindre(c, gx, gy, 0.185, 12, 26, MAT.cyan, ecl(MAT.cyan, 0.55));
    /* fenêtre de charge lumineuse, large et haute */
    c.fillStyle = "rgba(125,230,255,.8)";
    c.fillRect(q.x - 3.2, q.y - 36, 6.4, 20);
    c.fillStyle = "rgba(255,255,255,.55)";
    c.fillRect(q.x - 3.2, q.y - 36, 1.8, 20);
    c.strokeStyle = "rgba(10,40,50,.5)"; c.lineWidth = 0.8;
    c.strokeRect(q.x - 3.2, q.y - 36, 6.4, 20);
    /* cerclages d'acier fins */
    cylindre(c, gx, gy, 0.193, 16, 1.8, "#8e8b83", "#4f4c47");
    cylindre(c, gx, gy, 0.193, 30, 1.8, "#8e8b83", "#4f4c47");
    /* chapeau + borne isolée */
    cylindre(c, gx, gy, 0.12, 38, 4, MAT.acierC, MAT.acier);
    c.fillStyle = "#cfe9f2";
    c.beginPath(); c.arc(q.x, q.y - 44, 2.7, 0, 6.2832); c.fill();
    c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 0.9;
    c.beginPath(); c.arc(q.x, q.y - 44, 2.7, 0, 6.2832); c.stroke();
  }
  conda(-0.54, 0.18);
  conda(0.18, 0.54);

  /* câbles haute tension : caténaires fines, des isolateurs au collier */
  c.lineCap = "round";
  for(var n = 0; n < 4; n++){
    var v2 = coins[n], p1 = iso(v2[0], v2[1]);
    var fx = o.x + (v2[0] > 0 ? rxB + 1.6 : -rxB - 1.6), fy = o.y - 56;
    var mx2 = (p1.x + fx) / 2, my2 = Math.max(p1.y - 52, fy) + 10;
    c.strokeStyle = "#26241f"; c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(p1.x, p1.y - 52);
    c.quadraticCurveTo(mx2, my2, fx, fy);
    c.stroke();
    c.strokeStyle = "rgba(255,255,255,.14)"; c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(p1.x, p1.y - 52.6);
    c.quadraticCurveTo(mx2, my2 - 0.6, fx, fy - 0.6);
    c.stroke();
  }

  /* boîtier de commande + pictogramme haute tension */
  var f2 = faces("#33404a");
  boite(c, 0.72, -0.34, 0.34, 0.28, 9, 13, f2.t, f2.g, f2.d);
  var pb2 = iso(0.72, -0.34);
  c.fillStyle = MAT.danger;
  c.beginPath();
  c.moveTo(pb2.x + 2, pb2.y - 18); c.lineTo(pb2.x + 6.4, pb2.y - 16);
  c.lineTo(pb2.x + 4.2, pb2.y - 10.5); c.closePath(); c.fill();
  c.strokeStyle = "#1c1a18"; c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(pb2.x + 4.6, pb2.y - 16.4); c.lineTo(pb2.x + 3.6, pb2.y - 14.4);
  c.lineTo(pb2.x + 4.6, pb2.y - 14.2); c.lineTo(pb2.x + 3.8, pb2.y - 12.2);
  c.stroke();
  /* câble du boîtier vers la colonne */
  c.strokeStyle = "#22201e"; c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(pb2.x - 4, pb2.y - 10);
  c.quadraticCurveTo((pb2.x + o.x) / 2, o.y - 2, o.x + 8, o.y - 14);
  c.stroke();
  salissures(c, o.x - 20, o.y - 16, 40, 12, 7, 4242);
};

/* ================================================================
   LE MIRADOR — tour de guet, et le tireur d'élite qui l'habite.

   Il y en a une centaine par île. La silhouette doit donc se lire à
   la vitesse d'un coup d'œil et ne ressembler à AUCUNE des cinq
   autres défenses. Tout est construit à leur contre-pied :
     — elles sont assises sur un octogone de béton coulé ; lui est
       planté sur quatre plots et de la terre battue ;
     — elles sont grises, olive et acier ; il est en BOIS ;
     — elles sont larges et basses (126 à 160 px de large pour 57 à
       91 de haut) ; il est étroit et haut : 74 de large, 122 de haut ;
     — elles portent une machine ; il porte un HOMME.
   Et il reste quarante pixels sous la cellule électrique, qui demeure
   la chose la plus haute de l'île après le QG.

   DEUX REPÈRES ANGULAIRES, ET C'EST VOULU.
   Les quatre PIEDS sont aux diagonales du monde, comme tout le reste
   du jeu : c'est ce qui donne aux quatre faces du treillis leur
   parallélogramme, donc du volume. Les quatre POTEAUX de la cabane,
   eux, sont d'un quart de tour décalés — aux points cardinaux du
   monde, donc à gauche, à droite, en haut et en bas de l'écran. Ce
   quart de tour dégage le milieu de la plateforme : le tireur n'est
   JAMAIS derrière un poteau, et les deux faces latérales de la
   cabane, vues exactement par la tranche, ne coûtent rien à dessiner
   puisqu'elles sont ouvertes.
   ================================================================ */
var MIR_ZPONT  = 72;      // dessus du plancher
var MIR_ZTOIT  = 108;     // dessous de l'avant-toit
var MIR_ZFAITE = 122;     // pointe du toit
var MIR_RSOL   = 1.00;    // écartement des pieds au sol
var MIR_RCOL   = 0.42;    // et juste sous le plancher
var MIR_RPONT  = 0.74;    // rayon du plancher octogonal
var MIR_RPOT   = 0.66;    // les quatre poteaux de la cabane
var MIR_RTOIT  = 0.80;    // débord du toit
var MIR_ETAGES = [1, 25, 47, 67];        // les trois étages de croisillons
var MIR_ZMUR   = 96;                     // haut de la cloison arrière

/* Le bois d'un chantier qu'on n'a jamais repeint. */
var MIR_BOIS = "#6b5334", MIR_BOISC = "#93764a", MIR_BOISO = "#382a1a";
var MIR_TOLE = "#7d7568", MIR_ROUIL = "#8a5a30";

/* Écran du pied k à la hauteur z — les pieds fuient vers l'intérieur
   en montant, c'est ce fruit qui fait tenir la tour debout. */
function mirPied(k, z){
  var t = z / MIR_ZPONT;
  if(t < 0) t = 0; else if(t > 1) t = 1;
  var r = MIR_RSOL + (MIR_RCOL - MIR_RSOL) * t;
  var a = 0.7854 + (k & 3) * 1.5708;
  var p = iso(Math.cos(a) * r, Math.sin(a) * r);
  return { x:p.x, y:p.y - z };
}
/* Écran du poteau k de la cabane à la hauteur z */
function mirPoteau(k, z){
  var a = (k & 3) * 1.5708;
  var p = iso(Math.cos(a) * MIR_RPOT, Math.sin(a) * MIR_RPOT);
  return { x:p.x, y:p.y - z };
}
/* Sommet i d'un octogone de rayon r à la hauteur z */
function mirSommet(i, r, z){
  var a = (i & 7) * 0.7854;
  return { x:Math.cos(a) * r * RX, y:Math.sin(a) * r * RY - z };
}

SOCLES.mirador = function(c){
  var i, k, a, p, q, s1, s2;

  ombreContact(c, 0, 0, 2.05, 2.05, 0.24);

  /* ---- LE SOL ----
     Aucune dalle : on a creusé quatre trous, coulé quatre plots, et
     planté la tour dessus. La terre est tassée par les allées et
     venues, et les chutes du chantier n'ont jamais été ramassées. */
  c.save();
  c.globalAlpha = 0.26; c.fillStyle = "#4a3a26";
  c.beginPath(); c.ellipse(0, 0, 1.12 * RX, 1.12 * RY, 0, 0, 6.2832); c.fill();
  c.globalAlpha = 0.16; c.fillStyle = "#2a2016";
  c.beginPath(); c.ellipse(-4, 3, 0.62 * RX, 0.62 * RY, 0, 0, 6.2832); c.fill();
  c.restore();

  /* plots de béton, les deux du fond d'abord */
  var ordrePlots = [2, 1, 3, 0];
  for(i = 0; i < 4; i++){
    k = ordrePlots[i];
    a = 0.7854 + k * 1.5708;
    prisme(c, Math.cos(a) * MIR_RSOL, Math.sin(a) * MIR_RSOL, 0.24, 6, 0.3,
           0, 5, ecl(MAT.beton, 0.92), ecl(MAT.betonO, 0.95));
  }

  /* ---- LE TREILLIS ----
     Un montant, c'est un trait épais très sombre — le bois de bout —
     puis un trait plus clair par-dessus, et l'arête gauche qui prend
     la lumière. Les faces avant sont d'un ton plus chaud que les
     faces arrière : sans cet écart, la tour s'aplatit. */
  function montant(k, avant){
    var A = mirPied(k, -2), B = mirPied(k, MIR_ZPONT + 1);
    c.lineCap = "butt";
    c.strokeStyle = MIR_BOISO; c.lineWidth = 6.6;
    c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke();
    c.strokeStyle = avant ? MIR_BOIS : ecl(MIR_BOIS, 0.66); c.lineWidth = 4.4;
    c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke();
    c.strokeStyle = rgba(MIR_BOISC, avant ? 0.60 : 0.28); c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(A.x - 1.6, A.y); c.lineTo(B.x - 1.6, B.y); c.stroke();
    /* ferrure de pied, boulonnée dans le plot */
    c.fillStyle = "#3c3a34";
    c.fillRect(A.x - 4, A.y - 7, 8, 6);
    c.fillStyle = "rgba(255,255,255,.16)";
    c.fillRect(A.x - 4, A.y - 7, 8, 1.4);
    c.fillStyle = "#1b1917";
    c.beginPath(); c.arc(A.x, A.y - 4, 1.1, 0, 6.2832); c.fill();
  }
  /* croix de Saint-André d'une face, trois étages */
  function contrevent(k, avant){
    var e, za, zb, A, B, C, D, mx, my;
    for(e = 0; e < 3; e++){
      za = MIR_ETAGES[e]; zb = MIR_ETAGES[e + 1];
      A = mirPied(k, za); B = mirPied(k + 1, za);
      C = mirPied(k, zb); D = mirPied(k + 1, zb);
      c.lineCap = "butt";
      c.strokeStyle = MIR_BOISO; c.lineWidth = 3.6;
      c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(D.x, D.y);
      c.moveTo(B.x, B.y); c.lineTo(C.x, C.y);
      c.moveTo(C.x, C.y); c.lineTo(D.x, D.y);
      c.stroke();
      c.strokeStyle = avant ? "#61492b" : "#3d2f1e"; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(D.x, D.y);
      c.moveTo(B.x, B.y); c.lineTo(C.x, C.y);
      c.moveTo(C.x, C.y); c.lineTo(D.x, D.y);
      c.stroke();
      if(avant){
        /* le boulon de la croisée : quatre par face, c'est ce qui
           dit « assemblé à la va-vite » plutôt que « soudé » */
        mx = (A.x + B.x + C.x + D.x) / 4; my = (A.y + B.y + C.y + D.y) / 4;
        c.fillStyle = "#26241f";
        c.beginPath(); c.arc(mx, my, 1.7, 0, 6.2832); c.fill();
        c.fillStyle = "rgba(226,214,190,.30)";
        c.beginPath(); c.arc(mx - 0.5, my - 0.5, 0.7, 0, 6.2832); c.fill();
      }
    }
  }
  montant(2, 0);
  contrevent(1, 0); contrevent(2, 0);
  montant(1, 0); montant(3, 0);
  contrevent(0, 1); contrevent(3, 1);

  /* ---- L'ÉCHELLE ----
     Verticale, accrochée sous le débord du plancher et tenue à
     mi-hauteur par deux entretoises. C'est ainsi qu'on les monte :
     l'échelle ne suit pas le fruit de la tour, elle tombe droit. */
  var xEch = MIR_RPONT * RX - 1.4;
  var pE1 = mirPied(3, 30), pE2 = mirPied(3, 52);
  c.strokeStyle = "#4a4740"; c.lineWidth = 2;
  c.beginPath();
  c.moveTo(pE1.x, pE1.y); c.lineTo(xEch, pE1.y - 1);
  c.moveTo(pE2.x, pE2.y); c.lineTo(xEch, pE2.y - 1);
  c.stroke();
  echelle(c, xEch, 1, MIR_ZPONT - 2);

  montant(0, 1);

  /* ---- SOUS LE PLANCHER : aisseliers et solives ---- */
  for(i = 0; i < 4; i++){
    p = mirPied(i, MIR_ZPONT - 26);
    q = mirSommet(2 * i + 1, MIR_RPONT * 0.94, MIR_ZPONT - 5);
    c.strokeStyle = MIR_BOISO; c.lineWidth = 3.4;
    c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke();
    c.strokeStyle = i === 0 || i === 3 ? "#5b4529" : "#3a2c1c"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke();
  }
  prisme(c, 0, 0, MIR_RPONT * 0.97, 8, 0, MIR_ZPONT - 6, 6, "#4a3924", "#2b2015");

  /* ---- LE PLANCHER ---- */
  prisme(c, 0, 0, MIR_RPONT, 8, 0, MIR_ZPONT - 2.5, 2.5, "#7a6140", "#3d2f1d");
  /* les planches, dans l'axe gx, et l'usure au milieu du passage */
  c.save();
  c.beginPath();
  for(i = 0; i < 8; i++){
    q = mirSommet(i, MIR_RPONT, MIR_ZPONT);
    if(i === 0) c.moveTo(q.x, q.y); else c.lineTo(q.x, q.y);
  }
  c.closePath(); c.clip();
  c.strokeStyle = "rgba(40,28,16,.42)"; c.lineWidth = 1;
  for(i = -4; i <= 4; i++){
    s1 = iso(-1.1, i * 0.20); s2 = iso(1.1, i * 0.20);
    c.beginPath();
    c.moveTo(s1.x, s1.y - MIR_ZPONT); c.lineTo(s2.x, s2.y - MIR_ZPONT);
    c.stroke();
  }
  c.save(); c.globalAlpha = 0.18; c.fillStyle = "#2e2318";
  c.beginPath(); c.ellipse(0, -MIR_ZPONT + 2, 15, 7.6, 0, 0, 6.2832); c.fill();
  c.restore();
  /* la trappe, au débouché de l'échelle */
  plaque(c, 0.42, -0.42, 0.36, 0.36, MIR_ZPONT + 0.4, "#20180e");
  q = iso(0.42, -0.42);
  c.fillStyle = "#5c482c";
  c.beginPath();
  c.moveTo(q.x + 2, q.y - MIR_ZPONT - 1);
  c.lineTo(q.x + 11, q.y - MIR_ZPONT - 6);
  c.lineTo(q.x + 11, q.y - MIR_ZPONT - 15);
  c.lineTo(q.x + 2, q.y - MIR_ZPONT - 10);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 0.9; c.stroke();
  c.restore();

  /* ---- LA CABANE ----
     Poteaux du fond, cloison de planches, puis poteaux de devant. La
     cloison arrière sert de fond sombre : c'est sur elle que se
     détache le tireur, quel que soit l'angle où il vise. */
  function poteau(k, avant){
    var A = mirPoteau(k, MIR_ZPONT - 1), B = mirPoteau(k, MIR_ZTOIT + 2);
    c.lineCap = "butt";
    c.strokeStyle = MIR_BOISO; c.lineWidth = 5.4;
    c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke();
    c.strokeStyle = avant ? MIR_BOIS : ecl(MIR_BOIS, 0.62); c.lineWidth = 3.6;
    c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke();
    c.strokeStyle = rgba(MIR_BOISC, avant ? 0.55 : 0.24); c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(A.x - 1.3, A.y); c.lineTo(B.x - 1.3, B.y); c.stroke();
  }
  poteau(2, 0); poteau(3, 0);

  /* cloison de planches entre les deux poteaux du fond : on la voit
     par l'INTÉRIEUR, donc à l'ombre, et le jour passe entre les jeux */
  var xm = mirPoteau(3, 0).x, ym = -7.8;
  c.fillStyle = "#2f2418";
  c.fillRect(-xm, ym - MIR_ZMUR, xm * 2, MIR_ZMUR - MIR_ZPONT);
  for(i = 0; i < 9; i++){
    var xp = -xm + 1.4 + i * (xm * 2 - 2.8) / 8.6;
    c.fillStyle = i % 2 ? "#3a2d1c" : "#463623";
    c.fillRect(xp, ym - MIR_ZMUR + 1, 2.8, MIR_ZMUR - MIR_ZPONT - 1);
    c.fillStyle = "rgba(214,226,236,.11)";
    c.fillRect(xp + 2.8, ym - MIR_ZMUR + 2, 0.8, MIR_ZMUR - MIR_ZPONT - 3);
  }
  /* écharpe diagonale clouée par-dessus */
  c.strokeStyle = "#584429"; c.lineWidth = 2.6;
  c.beginPath();
  c.moveTo(-xm + 1, ym - MIR_ZPONT - 1); c.lineTo(xm - 1, ym - MIR_ZMUR + 2);
  c.stroke();
  c.strokeStyle = "rgba(0,0,0,.30)"; c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(-xm + 1, ym - MIR_ZPONT + 0.4); c.lineTo(xm - 1, ym - MIR_ZMUR + 3.4);
  c.stroke();
  /* meurtrière : une planche manque, on voit le ciel au travers */
  c.fillStyle = "#151b22";
  c.fillRect(-6, ym - MIR_ZMUR + 5, 12, 5);

  /* ---- LES SACS DE SABLE ----
     Un parapet complet, posé sur le plancher. Ils sont plus petits
     que ceux du Crible et du Pilon : le plancher ne fait que
     cinquante-cinq pixels de large et les sacs de l'atelier commun
     (0,42 case) l'avalaient tout entier.
     Ils sont trop bas pour recouvrir le tireur à l'écran — dans cette
     projection, ce qui est DEVANT est plus BAS — donc rien n'oblige à
     les repeindre par-dessus lui : la couche vivante n'a que l'homme
     à porter. */
  var alS = prng(3301), listeS = [], sc, fS;
  for(i = 0; i < 13; i++){
    a = i / 13 * 6.2832 + 0.24;
    var rs = 0.55 + alS() * 0.05;
    listeS.push({ x:Math.cos(a) * rs, y:Math.sin(a) * rs, s:0.78 + alS() * 0.30, t:alS() });
  }
  listeS.sort(function(u, v){ return (u.x + u.y) - (v.x + v.y); });
  for(i = 0; i < listeS.length; i++){
    sc = listeS[i];
    fS = faces(sc.t > 0.5 ? "#8d8054" : "#71653f");
    boite(c, sc.x, sc.y, 0.30 * sc.s, 0.21 * sc.s, MIR_ZPONT, 5.6 * sc.s,
          fS.t, fS.g, fS.d, true);
    q = iso(sc.x, sc.y);
    c.strokeStyle = "rgba(0,0,0,.20)"; c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(q.x - 3.4 * sc.s, q.y - MIR_ZPONT - 5.6 * sc.s);
    c.lineTo(q.x + 3.4 * sc.s, q.y - MIR_ZPONT - 5.6 * sc.s);
    c.stroke();
  }

  poteau(0, 1); poteau(1, 1);

  /* garde-corps sur les deux faces ouvertes, entre poteaux voisins */
  function lisse(k1, k2, z, ep, coul){
    var A = mirPoteau(k1, MIR_ZPONT + z), B = mirPoteau(k2, MIR_ZPONT + z);
    c.strokeStyle = coul; c.lineWidth = ep; c.lineCap = "butt";
    c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke();
  }
  lisse(1, 2, 15, 2.8, MIR_BOISO); lisse(1, 2, 14, 1.4, "#6d5533");
  lisse(3, 0, 15, 2.8, MIR_BOISO); lisse(3, 0, 14, 1.4, "#7a5f3a");
  lisse(0, 1, 15, 2.6, MIR_BOISO); lisse(0, 1, 14, 1.3, "#7a5f3a");

  /* ---- CE QUI TRAÎNE SUR LE PLANCHER ---- */
  /* caisse de munitions, contre la cloison */
  var fc = faces("#4d5a35");
  boite(c, -0.28, -0.30, 0.34, 0.24, MIR_ZPONT, 7, fc.t, fc.g, fc.d);
  q = iso(-0.28, -0.30);
  c.fillStyle = "rgba(232,196,55,.28)";
  c.fillRect(q.x - 4, q.y - MIR_ZPONT - 5, 6.5, 1.6);
  /* thermos, contre le poteau de gauche */
  cylindre(c, -0.40, 0.20, 0.05, MIR_ZPONT, 6, "#9a5238", "#5a2e20");
  /* douilles au sol : il tire d'ici depuis longtemps */
  var al = prng(7717);
  for(i = 0; i < 9; i++){
    a = al() * 6.2832;
    var rr = 0.16 + al() * 0.30;
    q = iso(Math.cos(a) * rr, Math.sin(a) * rr);
    c.save();
    c.translate(q.x, q.y - MIR_ZPONT); c.rotate(al() * 3.14);
    c.fillStyle = "#c9a54a"; c.fillRect(-1.1, -0.6, 2.2, 1.2);
    c.restore();
  }

  /* ---- LA CHARPENTE DU TOIT ---- */
  prisme(c, 0, 0, MIR_RPOT * 1.06, 8, 0, MIR_ZTOIT - 4, 4, "#544026", "#2c2115");

  /* ---- LE TOIT : huit pans de tôle ondulée ----
     Piège évité de justesse : un cône octogonal à faible pente, sans
     tranche visible et avec le centre plus clair que les bords, ne
     donne pas un toit — il donne un PARASOL. Trois choses le
     rattrapent : une pente franche (quatorze pixels de flèche), un
     écart de valeur brutal d'un pan à l'autre, et surtout une tranche
     de tôle bien noire sur tout le pourtour visible, qui rend son
     épaisseur au matériau. */
  var LUM_PAN = [];
  for(i = 0; i < 8; i++){
    var am = (i + 0.5) * 0.7854;
    LUM_PAN[i] = 0.80 + 0.52 * (-0.60 * Math.cos(am) - 0.80 * Math.sin(am));
  }
  /* la tranche d'abord : elle déborde sous les pans et fait l'ombre */
  c.fillStyle = "#2a251f";
  c.beginPath();
  for(i = 0; i <= 8; i++){
    q = mirSommet(i, MIR_RTOIT, MIR_ZTOIT);
    if(i === 0) c.moveTo(q.x, q.y); else c.lineTo(q.x, q.y);
  }
  for(i = 8; i >= 0; i--){
    q = mirSommet(i, MIR_RTOIT, MIR_ZTOIT - 4);
    c.lineTo(q.x, q.y);
  }
  c.closePath(); c.fill();
  for(i = 0; i < 8; i++){
    s1 = mirSommet(i, MIR_RTOIT, MIR_ZTOIT);
    s2 = mirSommet(i + 1, MIR_RTOIT, MIR_ZTOIT);
    c.fillStyle = ecl(MIR_TOLE, LUM_PAN[i]);
    c.beginPath();
    c.moveTo(0, -MIR_ZFAITE); c.lineTo(s1.x, s1.y); c.lineTo(s2.x, s2.y);
    c.closePath(); c.fill();
    /* les ondes de la tôle : deux nervures par pan, dans la pente */
    c.strokeStyle = "rgba(28,24,20,.30)"; c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(0, -MIR_ZFAITE);
    c.lineTo(s1.x * 0.66 + s2.x * 0.34, s1.y * 0.66 + s2.y * 0.34);
    c.moveTo(0, -MIR_ZFAITE);
    c.lineTo(s1.x * 0.34 + s2.x * 0.66, s1.y * 0.34 + s2.y * 0.66);
    c.stroke();
    /* l'arêtier, sombre côté ombre, clair côté lumière */
    c.strokeStyle = LUM_PAN[i] > 1 ? "rgba(255,246,225,.34)" : "rgba(26,22,18,.5)";
    c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(0, -MIR_ZFAITE); c.lineTo(s1.x, s1.y); c.stroke();
  }
  /* rouille : la tôle a vingt ans */
  c.save(); c.globalAlpha = 0.30; c.fillStyle = MIR_ROUIL;
  c.beginPath(); c.ellipse(-10, -MIR_ZTOIT - 6, 6, 3.0, -0.3, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(8, -MIR_ZTOIT - 8, 4.4, 2.4, 0.4, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(1, -MIR_ZTOIT + 4, 5, 1.9, 0, 0, 6.2832); c.fill();
  c.restore();
  /* faîtière : un capuchon de tôle, pas une boule */
  c.fillStyle = "#4a443d";
  c.beginPath();
  c.moveTo(-5, -MIR_ZFAITE + 2.4); c.lineTo(0, -MIR_ZFAITE - 1.6);
  c.lineTo(5, -MIR_ZFAITE + 2.4); c.lineTo(0, -MIR_ZFAITE + 4);
  c.closePath(); c.fill();
  c.fillStyle = "rgba(255,246,225,.26)";
  c.beginPath();
  c.moveTo(-5, -MIR_ZFAITE + 2.4); c.lineTo(0, -MIR_ZFAITE - 1.6);
  c.lineTo(0, -MIR_ZFAITE + 0.2); c.lineTo(-4.4, -MIR_ZFAITE + 3);
  c.closePath(); c.fill();

  /* ---- LA POTENCE ET SON PALAN ----
     On ne monte pas une caisse de cartouches à l'échelle : on la
     hisse. C'est le petit bras qui déborde à droite, et il achève de
     rendre la silhouette reconnaissable de loin. */
  var bx0 = mirSommet(0, MIR_RTOIT, MIR_ZTOIT).x - 3;
  var by0 = -MIR_ZTOIT - 1;
  c.strokeStyle = MIR_BOISO; c.lineWidth = 3.4; c.lineCap = "round";
  c.beginPath(); c.moveTo(bx0, by0); c.lineTo(bx0 + 15, by0 - 3); c.stroke();
  c.strokeStyle = "#6d5533"; c.lineWidth = 1.8;
  c.beginPath(); c.moveTo(bx0, by0 - 1); c.lineTo(bx0 + 15, by0 - 4); c.stroke();
  c.fillStyle = "#3c3a34";
  c.beginPath(); c.arc(bx0 + 15, by0 - 3, 2.2, 0, 6.2832); c.fill();
  c.strokeStyle = "#241f18"; c.lineWidth = 1;
  c.beginPath();
  c.moveTo(bx0 + 15, by0 - 1); c.lineTo(bx0 + 14.6, by0 + 12);
  c.stroke();
  /* le seau du palan, resté pendu au crochet */
  c.fillStyle = "#4c4a43";
  c.beginPath();
  c.moveTo(bx0 + 11, by0 + 13); c.lineTo(bx0 + 18.2, by0 + 13);
  c.lineTo(bx0 + 17.2, by0 + 20); c.lineTo(bx0 + 12, by0 + 20);
  c.closePath(); c.fill();
  c.fillStyle = "#6e6b62";
  c.fillRect(bx0 + 11, by0 + 13, 7.2, 1.6);
  c.strokeStyle = "#241f18"; c.lineWidth = 0.9;
  c.beginPath(); c.ellipse(bx0 + 14.6, by0 + 13, 3.6, 2.4, 0, 3.34, 6.08); c.stroke();

  /* ---- LA LANTERNE ----
     Accrochée sous l'avant-toit, elle brûle jour et nuit ; c'est le
     seul point chaud de la tour et il attire l'œil sur la cabane,
     donc sur l'homme. Son halo est peint ici une fois pour toutes :
     à cent tours, il ne coûtera pas une image de plus. */
  var lx = -14, ly = -MIR_ZTOIT + 5;
  c.strokeStyle = "#241f18"; c.lineWidth = 1;
  c.beginPath(); c.moveTo(lx, ly - 4); c.lineTo(lx, ly + 1); c.stroke();
  c.fillStyle = "#3c3a34";
  c.fillRect(lx - 2.6, ly + 1, 5.2, 1.6);
  c.fillStyle = "#e8b45a";
  c.fillRect(lx - 2.2, ly + 2.6, 4.4, 5);
  c.fillStyle = "#fff0c4";
  c.fillRect(lx - 1.1, ly + 3.6, 2.2, 3);
  c.fillStyle = "#3c3a34";
  c.fillRect(lx - 2.6, ly + 7.6, 5.2, 1.4);
  lueur(c, lx, ly + 5, 9, "#ffb347", 0.30);
  lueur(c, lx, ly + 5, 19, "#ff8a1e", 0.10);

  /* traces d'usure : la pluie coule des tôles le long des poteaux */
  salissures(c, -16, -MIR_ZTOIT + 12, 32, 20, 7, 6023);
  salissures(c, -22, -34, 44, 26, 8, 6199);
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

/* ================================================================
   LA CELLULE ÉLECTRIQUE — le réacteur du bouclier du Brasier.
   Cinq par île, quatre aux extrémités et une au centre.

   Le piège, ici, c'était la Bobine : elle est déjà pâle, déjà haute,
   déjà pleine d'arcs — et il y en a quatre-vingts par carte. Une
   cellule qui lui ressemble ne sert à rien. Tout est donc construit
   en opposition à elle :
     — la Bobine est claire, la cellule est NOIRE ;
     — la Bobine est cyan-blanc, la cellule est BLEU ÉLECTRIQUE ;
     — la Bobine culmine à cent pixels, la cellule à cent cinquante-six,
       c'est-à-dire tout le ciel que la planche de sprite autorise ;
     — la Bobine porte une petite sphère sur trois griffes, la cellule
       porte un ANNEAU ÉMETTEUR de quatre-vingts centièmes de case,
       posé à plat, avec l'orbe suspendu en son centre. Cette galette
       lumineuse ne ressemble à rien d'autre sur l'île.

   Les cotes sont partagées avec la couche animée : les arcs doivent
   tomber au pixel sur l'acier, pas à côté.
   ================================================================ */
/* Le bleu de la cellule. Il ne sert QUE là : partout ailleurs le jeu
   parle cyan (MAT.cyanC), et c'est justement pour ça qu'on la
   reconnaît du premier coup d'œil. */
var REAC_BLEU  = "#4d8cff";
var REAC_VIF   = "#8fc0ff";
var REAC_CLAIR = "#dce9ff";

var REAC_ANNEAUX = [                       // les quatre bobines : hauteur, rayon
  { z:46,  r:0.58 },
  { z:68,  r:0.54 },
  { z:90,  r:0.50 },
  { z:112, r:0.46 }
];
var REAC_BORNES = [[1.06, 0], [0, 1.06], [-1.06, 0], [0, -1.06]];
var REAC_ZBORNE = 33;                      // les boules d'électrode des contreforts
var REAC_ZMAT0 = 26, REAC_ZMAT1 = 122;     // le mât, du pied au collier
var REAC_RMAT0 = 0.40, REAC_RMAT1 = 0.28;  // et son fuselage, à peine fuselé
var REAC_ZCER = 134, REAC_RCER = 0.80;     // l'anneau émetteur
var REAC_NCER = 6;                         // ses plots d'électrode
var REAC_ZORBE = 134, REAC_RORBE = 11;     // l'orbe, suspendu au centre
var REAC_ZPOINTE = 151;                    // la pointe du paratonnerre

/* Rayon du treillis à la hauteur z */
function reacRayonMat(z){
  if(z <= REAC_ZMAT0) return REAC_RMAT0;
  if(z >= REAC_ZMAT1) return REAC_RMAT1;
  return REAC_RMAT0 + (REAC_RMAT1 - REAC_RMAT0) * (z - REAC_ZMAT0) / (REAC_ZMAT1 - REAC_ZMAT0);
}
/* Position écran du montant k à la hauteur z.
   Rappel : un cercle du monde de rayon r se projette en l'ellipse
   (cos a · r · RX, sin a · r · RY), où a est l'angle du monde décalé
   d'un quart de tour. Les quatre montants, les quatre contreforts et
   les plots de l'anneau partagent donc le même repère angulaire. */
function reacMontant(o, k, z){
  var a = (k & 3) * 1.5708 + 0.7854;
  var r = reacRayonMat(z);
  return { x:o.x + Math.cos(a) * r * RX, y:o.y - z + Math.sin(a) * r * RY };
}
/* Angle écran d'un contrefort (le même que celui du montant de rang k) */
function reacAngleBorne(i){ return i * 1.5708 + 0.7854; }

SOCLES.reacteur = function(c){
  var o = iso(0, 0);
  var i, k, m, s, a, p1, p2, q;

  ombreContact(c, 0, 0, 3.05, 3.05, 0.32);

  /* ---- dalle de fondation, deux niveaux ---- */
  prisme(c, 0, 0, 1.42, 12, 0.26, 0, 7, ecl(MAT.beton, 0.86), ecl(MAT.betonO, 0.9));
  prisme(c, 0, 0, 1.06, 8, 0.3927, 7, 7, ecl(MAT.beton, 0.94), ecl(MAT.betonO, 1.0));

  /* rigoles de mise à la terre : le cuivre file du mât vers le bord */
  c.save(); c.globalAlpha = 0.40; c.strokeStyle = MAT.cuivre; c.lineWidth = 1.9;
  for(k = 0; k < 8; k++){
    a = k / 8 * 6.2832 + 0.3927;
    p1 = iso(Math.cos(a) * 1.10, Math.sin(a) * 1.10);
    p2 = iso(Math.cos(a) * 1.38, Math.sin(a) * 1.38);
    c.beginPath(); c.moveTo(p1.x, p1.y - 7); c.lineTo(p2.x, p2.y - 7); c.stroke();
  }
  c.restore();
  /* bande d'avertissement peinte au bord de la dalle basse */
  c.save(); c.globalAlpha = 0.55;
  for(i = 0; i < 24; i++){
    a = i / 24 * 6.2832;
    p1 = iso(Math.cos(a) * 1.27, Math.sin(a) * 1.27);
    c.fillStyle = i % 2 ? MAT.danger : "#1c1a18";
    c.fillRect(p1.x - 2.2, p1.y - 8.4, 4.4, 2.3);
  }
  c.restore();
  /* boulons d'ancrage du niveau haut */
  c.fillStyle = "#2b2925";
  for(i = 0; i < 12; i++){
    a = i / 12 * 6.2832 + 0.26;
    p1 = iso(Math.cos(a) * 0.94, Math.sin(a) * 0.94);
    c.beginPath(); c.arc(p1.x, p1.y - 14, 1.4, 0, 6.2832); c.fill();
  }
  salissures(c, o.x - 32, o.y - 13, 64, 11, 11, 5150);

  /* ---- LES QUATRE CONTREFORTS ----
     Blocs blindés très bas et très noirs : ils élargissent l'assise
     sans voler un pixel de hauteur au mât, ils donnent aux arcs leurs
     quatre points d'attache au sol, et chacun avale un conduit qui
     plonge au bord de la dalle — c'est là que le câble du Brasier
     vient se brancher, de quelque côté qu'il arrive. */
  function contrefort(gx, gy){
    var w = iso(gx, gy);
    var f = faces("#252d36");
    boite(c, gx, gy, 0.58, 0.58, 7, 14, f.t, f.g, f.d);
    plaqueBoulonnee(c, w.x - 7, w.y - 19, 14, 6, "#1c232b");
    /* casque incliné et lentille bleue */
    prisme(c, gx, gy, 0.34, 6, 0.5236, 21, 4, "#414d5a", "#171d24");
    c.fillStyle = REAC_BLEU;
    c.beginPath(); c.ellipse(w.x, w.y - 25.4, 5.6, 2.8, 0, 0, 6.2832); c.fill();
    c.fillStyle = "rgba(233,242,255,.8)";
    c.beginPath(); c.ellipse(w.x - 1.4, w.y - 26, 2.4, 1.2, 0, 0, 6.2832); c.fill();
    /* la borne d'où partent les arcs */
    cylindre(c, gx, gy, 0.085, 25, 5, "#98a4b1", "#454f5a");
    c.fillStyle = "#eaf2ff";
    c.beginPath(); c.arc(w.x, w.y - REAC_ZBORNE, 3.0, 0, 6.2832); c.fill();
    c.strokeStyle = "rgba(6,16,30,.5)"; c.lineWidth = 0.9;
    c.beginPath(); c.arc(w.x, w.y - REAC_ZBORNE, 3.0, 0, 6.2832); c.stroke();
    /* conduit blindé vers le bord de la dalle */
    var e = iso(gx * 1.34, gy * 1.34);
    c.lineCap = "round";
    c.strokeStyle = "#12171d"; c.lineWidth = 6.4;
    c.beginPath(); c.moveTo(w.x, w.y - 12); c.quadraticCurveTo((w.x + e.x) / 2, w.y - 2, e.x, e.y - 1); c.stroke();
    c.strokeStyle = "#2c3540"; c.lineWidth = 3.8;
    c.beginPath(); c.moveTo(w.x, w.y - 13); c.quadraticCurveTo((w.x + e.x) / 2, w.y - 3, e.x, e.y - 2); c.stroke();
    /* collier de serrage à l'entrée du conduit */
    c.fillStyle = "#5a6674";
    c.beginPath(); c.ellipse(e.x, e.y - 1.5, 3.6, 2.2, 0, 0, 6.2832); c.fill();
    lueur(c, w.x, w.y - 27, 14, REAC_BLEU, 0.30);
  }
  for(i = 0; i < 4; i++){
    if(REAC_BORNES[i][0] + REAC_BORNES[i][1] < 0) contrefort(REAC_BORNES[i][0], REAC_BORNES[i][1]);
  }

  /* ---- pied du mât ---- */
  prisme(c, 0, 0, 0.60, 8, 0.3927, 14, 4, "#5f6a75", "#1e242b");
  cylindre(c, 0, 0, 0.46, 18, 8, "#2f3841", "#12171c");
  plaqueBoulonnee(c, o.x - 8, o.y - 24, 16, 6, "#1a2028");
  cylindre(c, 0, 0, 0.52, 26, 3, "#5b6672", "#1b2128");

  /* ---- treillis ---- */
  function montant(k, avant){
    var seg = 6, n, w;
    c.lineCap = "round"; c.lineJoin = "round";
    c.strokeStyle = "#0d1116"; c.lineWidth = 4.8;
    c.beginPath();
    for(n = 0; n <= seg; n++){
      w = reacMontant(o, k, REAC_ZMAT0 + (REAC_ZMAT1 - REAC_ZMAT0) * n / seg);
      if(n === 0) c.moveTo(w.x, w.y); else c.lineTo(w.x, w.y);
    }
    c.stroke();
    c.strokeStyle = avant ? "#3d4854" : "#1e252d"; c.lineWidth = 3.1;
    c.beginPath();
    for(n = 0; n <= seg; n++){
      w = reacMontant(o, k, REAC_ZMAT0 + (REAC_ZMAT1 - REAC_ZMAT0) * n / seg);
      if(n === 0) c.moveTo(w.x, w.y); else c.lineTo(w.x, w.y);
    }
    c.stroke();
    if(avant){
      c.strokeStyle = "rgba(186,210,240,.28)"; c.lineWidth = 1.1;
      c.beginPath();
      for(n = 0; n <= seg; n++){
        w = reacMontant(o, k, REAC_ZMAT0 + (REAC_ZMAT1 - REAC_ZMAT0) * n / seg);
        if(n === 0) c.moveTo(w.x - 1, w.y - 0.9); else c.lineTo(w.x - 1, w.y - 0.9);
      }
      c.stroke();
    }
  }
  /* croisillons d'une face : neuf panneaux en X, ceinturés */
  function panneaux(k, coul, ep){
    var np = 9, n, za, zb, A, B, C, D;
    c.strokeStyle = coul; c.lineWidth = ep; c.lineCap = "butt";
    for(n = 0; n < np; n++){
      za = REAC_ZMAT0 + (REAC_ZMAT1 - REAC_ZMAT0) * n / np;
      zb = REAC_ZMAT0 + (REAC_ZMAT1 - REAC_ZMAT0) * (n + 1) / np;
      A = reacMontant(o, k, za); B = reacMontant(o, k + 1, za);
      C = reacMontant(o, k, zb); D = reacMontant(o, k + 1, zb);
      c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(D.x, D.y); c.stroke();
      c.beginPath(); c.moveTo(B.x, B.y); c.lineTo(C.x, C.y); c.stroke();
      c.beginPath(); c.moveTo(C.x, C.y); c.lineTo(D.x, D.y); c.stroke();
    }
  }
  montant(2, 0); montant(3, 0);
  panneaux(2, "#141a20", 1.8);

  /* ---- moitié arrière des bobines ---- */
  function anneauArriere(an){
    var cy = o.y - an.z, rx = an.r * RX, ry = an.r * RY, n, aa, xx, yy;
    c.lineCap = "butt";
    c.strokeStyle = "#0c1015"; c.lineWidth = 9.4;
    c.beginPath(); c.ellipse(o.x, cy, rx, ry, 0, Math.PI, 6.2832); c.stroke();
    /* la gorge, éteinte du côté sombre */
    c.strokeStyle = "rgba(77,140,255,.42)"; c.lineWidth = 4.4;
    c.beginPath(); c.ellipse(o.x, cy, rx, ry, 0, Math.PI, 6.2832); c.stroke();
    c.strokeStyle = "#161d24"; c.lineWidth = 1.5;
    for(n = 0; n <= 18; n++){
      aa = Math.PI + n / 18 * Math.PI;
      xx = o.x + Math.cos(aa) * rx; yy = cy + Math.sin(aa) * ry;
      c.beginPath(); c.moveTo(xx, yy - 2.6); c.lineTo(xx, yy + 2.6); c.stroke();
    }
    c.strokeStyle = "#2c353f"; c.lineWidth = 2.2;
    c.beginPath(); c.ellipse(o.x, cy - 3.6, rx, ry, 0, Math.PI, 6.2832); c.stroke();
    c.beginPath(); c.ellipse(o.x, cy + 3.6, rx, ry, 0, Math.PI, 6.2832); c.stroke();
  }
  for(i = 0; i < REAC_ANNEAUX.length; i++) anneauArriere(REAC_ANNEAUX[i]);

  /* ---- L'ÂME : la colonne de lumière qui monte dans l'axe ----
     Elle est peinte dans le sprite et pas seulement dans la couche
     animée : au-delà d'un certain éloignement le jeu n'affiche plus
     que le sprite, et la cellule doit rester une torche. */
  var rxB = 0.205 * RX, rxH = 0.155 * RX;
  var gA = c.createLinearGradient(o.x - rxB, 0, o.x + rxB, 0);
  gA.addColorStop(0.00, "#0e2b56");
  gA.addColorStop(0.22, "#4d8cff");
  gA.addColorStop(0.50, "#f2f7ff");
  gA.addColorStop(0.78, "#5b96ff");
  gA.addColorStop(1.00, "#0b2246");
  c.fillStyle = gA;
  c.beginPath();
  c.moveTo(o.x - rxB, o.y - 22);
  c.lineTo(o.x - rxH, o.y - REAC_ZMAT1 - 2);
  c.lineTo(o.x + rxH, o.y - REAC_ZMAT1 - 2);
  c.lineTo(o.x + rxB, o.y - 22);
  c.closePath(); c.fill();
  /* stries horizontales : l'énergie est feuilletée, pas lisse */
  c.save(); c.globalAlpha = 0.26; c.strokeStyle = "#061a38"; c.lineWidth = 1;
  for(s = 26; s < REAC_ZMAT1; s += 5){
    var rs = rxB + (rxH - rxB) * (s - 22) / (REAC_ZMAT1 - 22);
    c.beginPath(); c.moveTo(o.x - rs, o.y - s); c.lineTo(o.x + rs, o.y - s); c.stroke();
  }
  c.restore();
  lueur(c, o.x, o.y - 38, 26, REAC_BLEU, 0.36);
  lueur(c, o.x, o.y - 66, 25, REAC_BLEU, 0.36);
  lueur(c, o.x, o.y - 94, 24, REAC_BLEU, 0.34);
  lueur(c, o.x, o.y - 118, 20, REAC_BLEU, 0.30);
  lueur(c, o.x, o.y - 74, 64, REAC_BLEU, 0.20);

  /* ---- montants avant, faces latérales et avant ---- */
  montant(0, 1); montant(1, 1);
  panneaux(1, "#1d242c", 1.9);
  panneaux(3, "#1d242c", 1.9);
  panneaux(0, "#2e3843", 2.0);
  echelle(c, o.x - 17, o.y - 13, 32);

  /* ---- moitié avant des bobines : une gorge de lumière prise entre
     deux joues d'acier noir. Pas de cuivre : la Bobine en a déjà, et
     l'orangé tirait toute la silhouette vers elle. ---- */
  function anneauAvant(an){
    var cy = o.y - an.z, rx = an.r * RX, ry = an.r * RY, n, aa, xx, yy;
    c.lineCap = "butt";
    c.strokeStyle = "#0a0e13"; c.lineWidth = 10.6;
    c.beginPath(); c.ellipse(o.x, cy, rx, ry, 0, 0, Math.PI); c.stroke();
    c.strokeStyle = "rgba(77,140,255,.92)"; c.lineWidth = 5.2;
    c.beginPath(); c.ellipse(o.x, cy, rx, ry, 0, 0, Math.PI); c.stroke();
    c.strokeStyle = "rgba(226,238,255,.9)"; c.lineWidth = 2.0;
    c.beginPath(); c.ellipse(o.x, cy + 0.4, rx, ry, 0, 0, Math.PI); c.stroke();
    /* barreaux de la cage, qui hachent la lumière */
    c.strokeStyle = "#161d25"; c.lineWidth = 1.8;
    for(n = 0; n <= 22; n++){
      aa = n / 22 * Math.PI;
      xx = o.x + Math.cos(aa) * rx; yy = cy + Math.sin(aa) * ry;
      c.beginPath(); c.moveTo(xx, yy - 3.1); c.lineTo(xx, yy + 3.1); c.stroke();
    }
    /* joue haute polie, joue basse dans l'ombre */
    c.strokeStyle = "#576372"; c.lineWidth = 2.6;
    c.beginPath(); c.ellipse(o.x, cy - 4.1, rx, ry, 0, 0, Math.PI); c.stroke();
    c.strokeStyle = "rgba(206,226,255,.34)"; c.lineWidth = 1.0;
    c.beginPath(); c.ellipse(o.x, cy - 5.1, rx * 0.99, ry * 0.99, 0, 0.14, Math.PI - 0.14); c.stroke();
    c.strokeStyle = "#0d1218"; c.lineWidth = 2.6;
    c.beginPath(); c.ellipse(o.x, cy + 4.1, rx, ry, 0, 0, Math.PI); c.stroke();
    /* quatre plots d'électrode sur la couronne */
    for(n = 0; n < 4; n++){
      aa = 0.42 + n * 0.76;
      xx = o.x + Math.cos(aa) * rx; yy = cy + Math.sin(aa) * ry;
      c.fillStyle = "#d6e6ff";
      c.beginPath(); c.arc(xx, yy + 5.8, 1.7, 0, 6.2832); c.fill();
    }
    lueur(c, o.x, cy + 2, an.r * RX * 1.7, REAC_BLEU, 0.24);
  }
  for(i = REAC_ANNEAUX.length - 1; i >= 0; i--) anneauAvant(REAC_ANNEAUX[i]);

  /* ---- contreforts avant ---- */
  for(i = 0; i < 4; i++){
    if(REAC_BORNES[i][0] + REAC_BORNES[i][1] > 0) contrefort(REAC_BORNES[i][0], REAC_BORNES[i][1]);
  }

  /* ---- LE SOMMET : collier, anneau émetteur, orbe, pointe ---- */
  cylindre(c, 0, 0, 0.26, 118, 5, "#5f6a76", "#1b2128");
  cylindre(c, 0, 0, 0.20, 123, 4, "#414c58", "#12171d");
  /* trois bras qui portent le cerceau */
  for(i = 0; i < 3; i++){
    a = i / 3 * 6.2832 + 0.5236;
    var sx0 = o.x + Math.cos(a) * 0.20 * RX, sy0 = o.y - 126 + Math.sin(a) * 0.20 * RY;
    var sx1 = o.x + Math.cos(a) * REAC_RCER * RX, sy1 = o.y - REAC_ZCER + Math.sin(a) * REAC_RCER * RY;
    c.lineCap = "round";
    c.strokeStyle = "#0d1116"; c.lineWidth = 4.6;
    c.beginPath(); c.moveTo(sx0, sy0); c.lineTo(sx1, sy1); c.stroke();
    c.strokeStyle = "#3a4652"; c.lineWidth = 2.8;
    c.beginPath(); c.moveTo(sx0, sy0); c.lineTo(sx1, sy1); c.stroke();
    c.strokeStyle = "rgba(200,222,255,.28)"; c.lineWidth = 1.0;
    c.beginPath(); c.moveTo(sx0, sy0 - 1); c.lineTo(sx1, sy1 - 1); c.stroke();
  }
  /* le cerceau, en deux moitiés : l'orbe se glisse entre les deux */
  function cerceau(deb, fin, sombre){
    var cy = o.y - REAC_ZCER, rx = REAC_RCER * RX, ry = REAC_RCER * RY;
    c.lineCap = "butt";
    c.strokeStyle = "#0a0e13"; c.lineWidth = 8.0;
    c.beginPath(); c.ellipse(o.x, cy, rx, ry, 0, deb, fin); c.stroke();
    c.strokeStyle = sombre ? "#1c232b" : "#333e4a"; c.lineWidth = 5.6;
    c.beginPath(); c.ellipse(o.x, cy, rx, ry, 0, deb, fin); c.stroke();
    /* la gorge lumineuse, tournée vers l'intérieur du cerceau */
    c.strokeStyle = sombre ? "rgba(77,140,255,.50)" : "rgba(143,192,255,.95)";
    c.lineWidth = 2.2;
    c.beginPath();
    c.ellipse(o.x, cy + (sombre ? -1.9 : 1.9), rx * 0.88, ry * 0.88, 0, deb, fin);
    c.stroke();
    c.strokeStyle = "rgba(198,220,255,.30)"; c.lineWidth = 1.1;
    c.beginPath(); c.ellipse(o.x, cy - 3.1, rx, ry, 0, deb, fin); c.stroke();
  }
  /* plots d'électrode du cerceau — les points d'attache des grands arcs */
  function plotsCerceau(avant){
    var cy = o.y - REAC_ZCER, rx = REAC_RCER * RX, ry = REAC_RCER * RY, n, aa, xx, yy;
    for(n = 0; n < REAC_NCER; n++){
      aa = n / REAC_NCER * 6.2832 + 0.5236;
      if((Math.sin(aa) > 0) !== !!avant) continue;
      xx = o.x + Math.cos(aa) * rx; yy = cy + Math.sin(aa) * ry;
      c.strokeStyle = "#2c353f"; c.lineWidth = 2.4;
      c.beginPath(); c.moveTo(xx, yy - 2); c.lineTo(xx, yy - 6); c.stroke();
      c.fillStyle = "#eaf2ff";
      c.beginPath(); c.arc(xx, yy - 7.4, 2.5, 0, 6.2832); c.fill();
      c.strokeStyle = "rgba(6,16,30,.45)"; c.lineWidth = 0.8;
      c.beginPath(); c.arc(xx, yy - 7.4, 2.5, 0, 6.2832); c.stroke();
      /* le halo des plots arrière est resserré : la planche de sprite
         s'arrête juste au-dessus, et un halo plus large s'y couperait net */
      lueur(c, xx, yy - 7.4, avant ? 9 : 5, REAC_VIF, 0.30);
    }
  }
  cerceau(Math.PI, 6.2832, 1);
  plotsCerceau(0);
  /* l'orbe : verre bleu sombre, la couche animée y met le feu */
  sphere(c, 0, 0, REAC_RORBE / RX, REAC_ZORBE, "#2f6ecd", null);
  c.fillStyle = "rgba(236,244,255,.66)";
  c.beginPath(); c.arc(o.x, o.y - REAC_ZORBE, REAC_RORBE * 0.42, 0, 6.2832); c.fill();
  c.strokeStyle = "rgba(216,232,255,.32)"; c.lineWidth = 1.1;
  c.beginPath();
  c.ellipse(o.x, o.y - REAC_ZORBE, REAC_RORBE * 0.92, REAC_RORBE * 0.34, 0, 0, 6.2832);
  c.stroke();
  lueur(c, o.x, o.y - REAC_ZORBE, 18, REAC_VIF, 0.38);
  /* paratonnerre : la pointe qui referme la silhouette */
  c.strokeStyle = "#12171d"; c.lineWidth = 3.2; c.lineCap = "butt";
  c.beginPath(); c.moveTo(o.x, o.y - REAC_ZORBE - 4); c.lineTo(o.x, o.y - REAC_ZPOINTE); c.stroke();
  c.strokeStyle = "#7b8794"; c.lineWidth = 1.3;
  c.beginPath(); c.moveTo(o.x - 0.7, o.y - REAC_ZORBE - 4); c.lineTo(o.x - 0.7, o.y - REAC_ZPOINTE); c.stroke();
  c.fillStyle = "#eaf2ff";
  c.beginPath(); c.arc(o.x, o.y - REAC_ZPOINTE, 2.3, 0, 6.2832); c.fill();
  lueur(c, o.x, o.y - REAC_ZPOINTE, 5, REAC_VIF, 0.34);
  cerceau(0, Math.PI, 0);
  plotsCerceau(1);

  /* ---- pupitre de couplage, au pied ---- */
  var fb = faces("#22303c");
  boite(c, 0.86, 0.50, 0.42, 0.32, 7, 14, fb.t, fb.g, fb.d);
  q = iso(0.86, 0.50);
  plaqueBoulonnee(c, q.x - 8, q.y - 20, 16, 6, "#1a262f");
  c.fillStyle = REAC_VIF; c.beginPath(); c.arc(q.x - 4, q.y - 12, 1.3, 0, 6.2832); c.fill();
  c.fillStyle = "#6ee08a"; c.beginPath(); c.arc(q.x, q.y - 12, 1.3, 0, 6.2832); c.fill();
  c.fillStyle = MAT.danger;
  c.beginPath();
  c.moveTo(q.x + 3.2, q.y - 19); c.lineTo(q.x + 7.6, q.y - 17.2);
  c.lineTo(q.x + 5.4, q.y - 12.0); c.closePath(); c.fill();
  cables(c, q.x - 7, q.y - 6, o.x + 11, o.y - 11, 3);

  /* halo au sol : la dalle baigne dans la lumière de la machine */
  lueur(c, o.x, o.y - 8, 46, REAC_BLEU, 0.22);
};

/* MESURE DE VITESSE, PIÈGE À ÉVITER.
   Sous un rastériseur LOGICIEL (Chromium headless en swiftshader, donc
   toutes les mesures faites hors d'un vrai appareil), le PREMIER blit
   d'une texture donnée dans une image coûte une vingtaine de
   millisecondes ; les suivants, de la même texture, sont gratuits. Un
   type de bâtiment qui n'apparaît qu'une seule fois à l'écran semble
   donc coûter à lui seul plus cher que toute la forteresse — et un
   canevas 360×330 entièrement VIDE coûte exactement autant que le
   sprite le plus chargé. C'est le cache de textures, pas le dessin.
   Vérifié sur le dépôt d'avant les cellules électriques : y ajouter un
   seul blit d'une texture neuve et vide coûtait déjà +21 ms.
   Conclusion : ne jamais conclure d'un profil ici qu'un sprite est trop
   chargé sans avoir d'abord échangé son contenu contre un canevas vide
   de même taille. Si le coût ne bouge pas, il n'y a rien à optimiser. */
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
  var dp = vecteurEcran(ang + 1.5708);     /* perpendiculaire MONDE, projetee */
  var rec = b.recul || 0;
  var fl = b.flash || 0;
  var sg = d.x >= 0 ? 1 : -1;              /* cote "proche" de l'ecran */

  /* plateforme rotative posee sur la couronne dentee */
  c.fillStyle = "#45433e";
  c.beginPath(); c.ellipse(0, -20.5, 13.6, 7.1, 0, 0, 6.2832); c.fill();
  c.fillStyle = "#67645d";
  c.beginPath(); c.ellipse(0, -22, 12.2, 6.2, 0, 0, 6.2832); c.fill();

  /* la culasse recule au tir ; les canons davantage */
  var ox = -d.x * rec * 2.6, oy = -27 - d.y * rec * 2.6;
  var bx = -d.x * rec * 5.0, by = -29 - d.y * rec * 5.0;

  /* culasse massive : jupe sombre + plateau bicolore */
  polyDir(c, ox, oy + 5, d, [[-10.5, -7.3], [5.3, -7.3], [5.3, 7.3], [-10.5, 7.3]], "#302e2a");
  polyDir(c, ox, oy, d, [[-10, -7], [5, -7], [5, 7], [-10, 7]], "#5c5952");
  polyDir(c, ox, oy, d, [[-10, -7], [5, -7], [5, -2.4], [-10, -2.4]], "#6f6c64");
  /* plaque arriere */
  polyDir(c, ox, oy, d, [[-11.6, -5.2], [-10, -5.8], [-10, 5.8], [-11.6, 5.2]], "#403e39");
  /* rainure de trappe + boulons du plateau */
  var h1 = ptDir(ox, oy, d, -6, -7), h2 = ptDir(ox, oy, d, -6, 7);
  c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 1;
  c.beginPath(); c.moveTo(h1.x, h1.y); c.lineTo(h2.x, h2.y); c.stroke();
  c.fillStyle = "#3a3835";
  c.beginPath();
  var bo = [[-8.6, -5.6], [-8.6, 5.6], [3.4, -5.6], [3.4, 5.6]];
  for(var k = 0; k < 4; k++){
    var qb = ptDir(ox, oy, d, bo[k][0], bo[k][1]);
    c.moveTo(qb.x + 0.9, qb.y); c.arc(qb.x, qb.y, 0.9, 0, 6.2832);
  }
  c.fill();

  /* viseur periscopique sur la culasse */
  polyDir(c, ox, oy, d, [[-7.8, -1], [-5.8, -1], [-5.8, 1], [-7.8, 1]], "#2c2a27");
  polyDir(c, ox, oy - 6, d, [[-8.6, -1.8], [-5.0, -1.8], [-5.0, 1.8], [-8.6, 1.8]], "#3a3835");
  var vs = ptDir(ox, oy - 6, d, -5.1, 0);
  c.fillStyle = "#7de6ff";
  c.fillRect(vs.x - 0.9, vs.y - 0.9, 1.8, 1.8);

  /* tambour de munitions debout sur la plateforme, cote proche */
  var tb = ptDir(ox, oy, d, -6.8, sg * 7.4);
  c.fillStyle = FRELON.fonce;
  c.beginPath(); c.ellipse(tb.x, tb.y + 1, 5.2, 3.8, 0, 0, 6.2832); c.fill();
  c.fillRect(tb.x - 5.2, tb.y - 7.5, 10.4, 8.5);
  c.fillStyle = FRELON.moyen;
  c.fillRect(tb.x - 5.2, tb.y - 7.5, 3.9, 8.5);
  c.fillStyle = FRELON.clair;
  c.beginPath(); c.ellipse(tb.x, tb.y - 7.5, 5.2, 3.8, 0, 0, 6.2832); c.fill();
  c.strokeStyle = FRELON.trait; c.lineWidth = 1;
  c.beginPath();
  c.moveTo(tb.x - 5.2, tb.y - 3); c.lineTo(tb.x + 5.2, tb.y - 3);
  c.moveTo(tb.x, tb.y - 7.5); c.lineTo(tb.x + 4.6, tb.y - 5.3);
  c.stroke();
  c.fillStyle = FRELON.nuit;
  c.beginPath(); c.arc(tb.x, tb.y - 7.5, 1.3, 0, 6.2832); c.fill();

  /* bande de laiton du tambour a la culasse, avec un leger ventre */
  var fp = ptDir(ox, oy, d, -2.8, sg * 5.2);
  var p0x = tb.x + sg * 1.5, p0y = tb.y - 10, p2x = fp.x, p2y = fp.y - 1.5;
  var cxm = (p0x + p2x) / 2, cym = Math.max(p0y, p2y) + 4;
  c.strokeStyle = "#33302a"; c.lineWidth = 4.6; c.lineCap = "round";
  c.beginPath(); c.moveTo(p0x, p0y); c.quadraticCurveTo(cxm, cym, p2x, p2y); c.stroke();
  c.fillStyle = "#e0b84a";
  for(var i = 0; i <= 5; i++){
    var t = 0.08 + i * 0.168, u = 1 - t;
    var qx = u * u * p0x + 2 * u * t * cxm + t * t * p2x;
    var qy = u * u * p0y + 2 * u * t * cym + t * t * p2y;
    c.fillRect(qx - 1.2, qy - 2.3, 2.4, 4.6);
  }

  /* bras de fixation du bouclier sur la culasse */
  c.strokeStyle = "#4a4741"; c.lineWidth = 2.6; c.lineCap = "round";
  var SxA = d.x * 7.5, SyA = -21 + d.y * 7.5;
  for(var st = 0; st < 2; st++){
    var ss = st ? 1 : -1;
    var a1 = ptDir(ox, oy, d, 3.5, ss * 5.2);
    c.beginPath();
    c.moveTo(a1.x, a1.y - 2);
    c.lineTo(SxA + ss * dp.x * 5.2 - d.x * 1.4, SyA + ss * dp.y * 5.2 - 6);
    c.stroke();
  }

  /* bouclier frontal : plaque verticale face a la cible, inclinee
     vers l'arriere, boulonnee ; fixe, les canons reculent derriere */
  var Sx = d.x * 7.5, Sy = -21 + d.y * 7.5;
  var g1x = Sx - dp.x * 9.2, g1y = Sy - dp.y * 9.2;    /* bas */
  var g2x = Sx + dp.x * 9.2, g2y = Sy + dp.y * 9.2;
  var t1x = Sx - dp.x * 8.1 - d.x * 3, t1y = Sy - dp.y * 8.1 - 12.5 - d.y * 3;
  var t2x = Sx + dp.x * 8.1 - d.x * 3, t2y = Sy + dp.y * 8.1 - 12.5 - d.y * 3;
  c.fillStyle = "#8d8a82";
  c.beginPath();
  c.moveTo(g1x, g1y); c.lineTo(g2x, g2y); c.lineTo(t2x, t2y); c.lineTo(t1x, t1y);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(0,0,0,.42)"; c.lineWidth = 1; c.stroke();
  /* chant superieur qui accroche la lumiere */
  c.fillStyle = "#b2ada2";
  c.beginPath();
  c.moveTo(t1x, t1y); c.lineTo(t2x, t2y);
  c.lineTo(t2x - d.x * 1.8, t2y - 1.6); c.lineTo(t1x - d.x * 1.8, t1y - 1.6);
  c.closePath(); c.fill();
  /* boulons du pourtour */
  c.fillStyle = "#4a4741";
  c.beginPath();
  for(var k2 = 0; k2 < 6; k2++){
    var sgn = k2 % 2 ? 1 : -1, vv = [0.12, 0.12, 0.5, 0.5, 0.88, 0.88][k2];
    var qx2 = Sx + sgn * dp.x * (7.6 - 0.8 * vv) - d.x * 3 * vv;
    var qy2 = Sy + sgn * dp.y * (7.6 - 0.8 * vv) - 12.5 * vv - d.y * 3 * vv;
    c.moveTo(qx2 + 0.9, qy2); c.arc(qx2, qy2, 0.9, 0, 6.2832);
  }
  c.fill();
  /* fente de visee horizontale pres du haut */
  c.strokeStyle = "#15140f"; c.lineWidth = 2;
  c.beginPath();
  c.moveTo(Sx - dp.x * 4.4 - d.x * 2.3, Sy - dp.y * 4.4 - 9.6 - d.y * 2.3);
  c.lineTo(Sx + dp.x * 4.4 - d.x * 2.3, Sy + dp.y * 4.4 - 9.6 - d.y * 2.3);
  c.stroke();

  /* sabords de passage des canons, dans le plan du bouclier */
  c.fillStyle = "#1d1c1a";
  c.beginPath();
  for(var n0 = 0; n0 < 2; n0++){
    var bb0 = n0 ? 4.2 : -4.2;
    var px0 = d.x * 8.2 + dp.x * bb0 - d.x * 1.6;
    var py0 = -29 + d.y * 8.2 + dp.y * bb0 - d.y * 1.6;
    c.moveTo(px0 + 3.1, py0); c.ellipse(px0, py0, 3.1, 2.5, 0, 0, 6.2832);
  }
  c.fill();

  /* canons jumeles : manchon perfore + tube + cache-flamme */
  var bbL = [-4.2, 4.2];
  for(var n = 0; n < 2; n++){
    var obx = bx + dp.x * bbL[n], oby = by + dp.y * bbL[n];
    polyDir(c, obx, oby, d, [[7.8, -2.3], [17.5, -2.15], [17.5, 2.15], [7.8, 2.3]], "#43413c");
    polyDir(c, obx, oby, d, [[7.8, -2.3], [17.5, -2.15], [17.5, -1.15], [7.8, -1.25]], "#75726a");
    polyDir(c, obx, oby, d, [[17.5, -1.3], [23.2, -1.2], [23.2, 1.2], [17.5, 1.3]], "#312f2c");
    polyDir(c, obx, oby, d, [[23.2, -1.9], [26.2, -1.75], [26.2, 1.75], [23.2, 1.9]], "#4c4a45");
  }
  /* perforations de refroidissement, deux rangees par manchon */
  c.fillStyle = "#191816";
  c.beginPath();
  for(var n2 = 0; n2 < 2; n2++){
    var ob2x = bx + dp.x * bbL[n2], ob2y = by + dp.y * bbL[n2];
    for(var h3 = 0; h3 < 5; h3++){
      var qa = 9.2 + h3 * 1.65;
      var qh = ptDir(ob2x, ob2y, d, qa, -0.95);
      c.moveTo(qh.x + 0.66, qh.y); c.arc(qh.x, qh.y, 0.66, 0, 6.2832);
      var qh2 = ptDir(ob2x, ob2y, d, qa + 0.8, 0.85);
      c.moveTo(qh2.x + 0.66, qh2.y); c.arc(qh2.x, qh2.y, 0.66, 0, 6.2832);
    }
  }
  c.fill();
  /* fentes du cache-flamme + bouches sombres */
  c.fillStyle = "#111110";
  c.beginPath();
  for(var s2 = 0; s2 < 2; s2++){
    var ob3x = bx + dp.x * bbL[s2], ob3y = by + dp.y * bbL[s2];
    var mm = ptDir(ob3x, ob3y, d, 26.2, 0);
    c.moveTo(mm.x + 1.3, mm.y); c.arc(mm.x, mm.y, 1.3, 0, 6.2832);
    var qs = ptDir(ob3x, ob3y, d, 24.4, -1.9);
    c.rect(qs.x - 0.5, qs.y - 0.4, 1.0, 1.6);
  }
  c.fill();

  /* TIR : double eclair en etoile + douilles ejectees cote oppose */
  if(fl > 0){
    var mA = { x: bx + dp.x * -4.2 + d.x * 26.6, y: by + dp.y * -4.2 + d.y * 26.6 };
    var mB = { x: bx + dp.x * 4.2 + d.x * 26.6, y: by + dp.y * 4.2 + d.y * 26.6 };
    c.save(); c.globalCompositeOperation = "lighter";
    c.fillStyle = "rgba(255,220,140," + (0.85 * fl) + ")";
    c.beginPath();
    var ms = [mA, mB];
    for(var f3 = 0; f3 < 2; f3++){
      var m = ms[f3];
      var L = 11 + 9 * fl, T = 5 + 3.4 * fl;
      c.moveTo(m.x - d.y * 3.0, m.y + d.x * 3.0);
      c.lineTo(m.x + d.x * L, m.y + d.y * L);
      c.lineTo(m.x + d.y * 3.0, m.y - d.x * 3.0);
      c.closePath();
      c.moveTo(m.x - d.y * T, m.y + d.x * T);
      c.lineTo(m.x + d.x * 2.2, m.y + d.y * 2.2);
      c.lineTo(m.x + d.y * T, m.y - d.x * T);
      c.lineTo(m.x - d.x * 1.8, m.y - d.y * 1.8);
      c.closePath();
    }
    c.fill();
    c.fillStyle = "rgba(255,255,235," + (0.9 * fl) + ")";
    c.beginPath();
    c.moveTo(mA.x + 2.0, mA.y); c.arc(mA.x, mA.y, 2.0, 0, 6.2832);
    c.moveTo(mB.x + 2.0, mB.y); c.arc(mB.x, mB.y, 2.0, 0, 6.2832);
    c.fill();
    c.restore();
    lueur(c, (mA.x + mB.x) / 2, (mA.y + mB.y) / 2, 24, "#ffd07a", 0.5 * fl);
    /* filets de fumee au bout des canons */
    c.save(); c.globalAlpha = 0.20 * fl; c.fillStyle = "#cfcac0";
    c.beginPath();
    c.arc(mA.x + d.x * 6, mA.y + d.y * 6 - 3, 3.4, 0, 6.2832);
    c.arc(mB.x + d.x * 7, mB.y + d.y * 7 - 4, 4.2, 0, 6.2832);
    c.fill();
    c.restore();
    /* douilles fumantes qui giclent a l'oppose du tambour */
    var tt = 1 - fl;
    c.fillStyle = "#e0b84a";
    for(var k3 = 0; k3 < 4; k3++){
      var e1 = ptDir(ox, oy, d, -2 - k3 * 1.2, -sg * (8 + tt * (10 + k3 * 4)));
      var ey = e1.y - 5 + tt * tt * 18 - tt * 8;
      c.fillRect(e1.x - 1.7, ey - 0.9, 3.4, 1.8);
    }
  }
};

TOURELLES.chalumeau = function(c, b, ang, tps){
  var d = vecteurEcran(ang);
  var fl = b.flash || 0, rec = (b.recul || 0) * 2.6;
  var o = { x:0, y:-31 };
  var ox = o.x - d.x * rec, oy = o.y - d.y * rec;

  /* plateforme rotative sur le pivot */
  c.fillStyle = "#4a4842";
  c.beginPath(); c.ellipse(0, -26, 11, 5.4, 0, 0, 6.2832); c.fill();
  c.strokeStyle = "#2b2926"; c.lineWidth = 1.1;
  c.beginPath(); c.ellipse(0, -26, 11, 5.4, 0, 0, 6.2832); c.stroke();

  /* tuyau souple gainé : collecteur -> arrière du projecteur */
  var q = ptDir(ox, oy, d, -12, 2);
  var pm = iso(-0.30, -0.30);
  c.strokeStyle = "#232325"; c.lineWidth = 4.4; c.lineCap = "round";
  c.beginPath();
  c.moveTo(pm.x, pm.y - 21);
  c.bezierCurveTo(pm.x + 2, pm.y - 30, q.x - 5, q.y - 9, q.x, q.y);
  c.stroke();
  c.save(); c.setLineDash([2.2, 3]);
  c.strokeStyle = "#54545a"; c.lineWidth = 2;
  c.beginPath();
  c.moveTo(pm.x, pm.y - 21);
  c.bezierCurveTo(pm.x + 2, pm.y - 30, q.x - 5, q.y - 9, q.x, q.y);
  c.stroke();
  c.restore();

  /* contrepoids arrière */
  polyDir(c, ox, oy, d, [[-14, -5], [-6, -6], [-6, 6], [-14, 5]], "#3a3835");
  polyDir(c, ox, oy, d, [[-14, -5], [-6, -6], [-6, -2.2], [-14, -1.8]], "#514e48");

  /* bloc central du projecteur */
  polyDir(c, ox, oy, d, [[-7, -7], [6, -7], [6, 7], [-7, 7]], "#5c5952");
  polyDir(c, ox, oy, d, [[-7, -7], [6, -7], [6, -2.8], [-7, -2.8]], "#74716a");
  var b1 = ptDir(ox, oy, d, -4, 4.8), b2 = ptDir(ox, oy, d, 2, 5.4);
  c.fillStyle = "#2f2d2b";
  c.beginPath(); c.arc(b1.x, b1.y, 1.1, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(b2.x, b2.y, 1.1, 0, 6.2832); c.fill();
  /* volant de réglage plein, posé sur le bloc */
  var vv = ptDir(ox, oy, d, -2, -5.5);
  c.fillStyle = "#44423d";
  c.beginPath(); c.ellipse(vv.x, vv.y - 3, 3.4, 2.2, 0, 0, 6.2832); c.fill();
  c.strokeStyle = "#c8c4b8"; c.lineWidth = 1.2;
  c.beginPath(); c.ellipse(vv.x, vv.y - 3, 3.4, 2.2, 0, 0, 6.2832); c.stroke();
  c.beginPath(); c.moveTo(vv.x - 3.4, vv.y - 3); c.lineTo(vv.x + 3.4, vv.y - 3); c.stroke();

  /* canon trapu à double paroi */
  polyDir(c, ox, oy, d, [[5, -6.2], [24, -5.2], [24, 5.2], [5, 6.2]], "#3a3733");
  polyDir(c, ox, oy, d, [[5, -6.2], [24, -5.2], [24, -2.1], [5, -2.5]], "#565349");
  polyDir(c, ox, oy, d, [[5, 4.2], [24, 3.5], [24, 5.2], [5, 6.2]], "#1d1c1a");
  /* deux bagues de refroidissement */
  polyDir(c, ox, oy, d, [[10, -6.0], [11.4, -5.9], [11.4, 5.9], [10, 6.0]], "#1b1a19");
  polyDir(c, ox, oy, d, [[15, -5.7], [16.4, -5.6], [16.4, 5.6], [15, 5.7]], "#1b1a19");

  /* pare-chaleur : bouclier de tôle noircie autour de la bouche */
  polyDir(c, ox, oy, d, [[21.5, -10.4], [26.5, -8.4], [26.5, 8.4], [21.5, 10.4]], "#262422", "rgba(255,255,255,.12)");
  polyDir(c, ox, oy, d, [[21.5, -10.4], [26.5, -8.4], [26.5, -5.6], [21.5, -7.0]], "#48443e");
  var e1 = ptDir(ox, oy, d, 22.8, -8.2), e2 = ptDir(ox, oy, d, 22.8, 8.2);
  c.fillStyle = "#0e0d0c";
  c.beginPath(); c.arc(e1.x, e1.y, 1, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(e2.x, e2.y, 1, 0, 6.2832); c.fill();

  /* bec : tube qui dépasse du bouclier, puis la bouche */
  polyDir(c, ox, oy, d, [[26, -3.8], [30.5, -3.4], [30.5, 3.4], [26, 3.8]], "#151413");
  polyDir(c, ox, oy, d, [[26, -3.8], [30.5, -3.4], [30.5, -1.8], [26, -2.0]], "#33302c");
  var m = ptDir(ox, oy, d, 30.4, 0);
  c.fillStyle = "#0c0b0a";
  c.beginPath(); c.ellipse(m.x, m.y, 3.1, 2.4, 0, 0, 6.2832); c.fill();
  var chaud = fl > 0 || b.prochainTir < 500;
  c.fillStyle = chaud ? "#ff7a2a" : "#42322a";
  c.beginPath(); c.ellipse(m.x, m.y, 1.9, 1.4, 0, 0, 6.2832); c.fill();
  if(chaud && !fl) lueurRapide(c, m.x, m.y, 8, "#ff7a2a", 0.35 + 0.2 * Math.sin(tps * 14));

  /* veilleuse qui danse juste au-dessus du bec */
  var v = ptDir(ox, oy, d, 29, -4.8);
  c.strokeStyle = "#55524b"; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(v.x - 1, v.y + 4); c.lineTo(v.x, v.y + 1.5); c.stroke();
  c.save();
  c.globalCompositeOperation = "lighter";
  var h2 = 6 + Math.sin(tps * 12) * 1.4;
  c.fillStyle = "rgba(255,150,40,.75)";
  c.beginPath();
  c.moveTo(v.x - 2, v.y + 2); c.quadraticCurveTo(v.x - 3, v.y - h2 * 0.5, v.x + Math.sin(tps * 9) * 1.2, v.y + 2 - h2);
  c.quadraticCurveTo(v.x + 3, v.y - h2 * 0.5, v.x + 2, v.y + 2);
  c.closePath(); c.fill();
  c.fillStyle = "rgba(255,240,180,.85)";
  c.beginPath(); c.ellipse(v.x, v.y - h2 * 0.35, 1.2, h2 * 0.3, 0, 0, 6.2832); c.fill();
  c.restore();

  /* ---- TIR : cône de feu en langues arrondies ---- */
  if(fl > 0){
    var nx = -d.y, ny = d.x;
    var jit = Math.sin(tps * 41) * 3;
    var L = 36 + 18 * fl + jit;
    function langue(l, w, coul){
      var b0 = ptDir(ox, oy, d, 29.5, 0);
      var g1x = b0.x + d.x * l * 0.55 + nx * w, g1y = b0.y + d.y * l * 0.55 + ny * w;
      var g2x = b0.x + d.x * l * 0.55 - nx * w, g2y = b0.y + d.y * l * 0.55 - ny * w;
      var tx = b0.x + d.x * (l + jit * 0.5), ty = b0.y + d.y * (l + jit * 0.5);
      c.fillStyle = coul;
      c.beginPath();
      c.moveTo(b0.x + nx * 2.4, b0.y + ny * 2.4);
      c.quadraticCurveTo(g1x, g1y, tx, ty);
      c.quadraticCurveTo(g2x, g2y, b0.x - nx * 2.4, b0.y - ny * 2.4);
      c.closePath(); c.fill();
    }
    c.save(); c.globalCompositeOperation = "lighter";
    langue(L, 12 + 4 * fl, "rgba(255,84,16," + (0.5 * fl) + ")");
    langue(L * 0.82, 8 + 2.5 * fl, "rgba(255,164,44," + (0.62 * fl) + ")");
    langue(L * 0.55, 4.4, "rgba(255,238,190," + (0.8 * fl) + ")");
    /* gouttes enflammées qui se détachent */
    c.fillStyle = "rgba(255,180,60," + (0.7 * fl) + ")";
    for(var k = 0; k < 3; k++){
      var ph = (tps * 3.1 + k * 0.37) % 1;
      var gx3 = m.x + d.x * (L * (0.7 + ph * 0.5)) + nx * Math.sin(tps * 17 + k * 2.6) * 6;
      var gy3 = m.y + d.y * (L * (0.7 + ph * 0.5)) + ny * Math.sin(tps * 17 + k * 2.6) * 6 - ph * 4;
      c.beginPath(); c.arc(gx3, gy3, 1.8 * (1 - ph * 0.5), 0, 6.2832); c.fill();
    }
    c.restore();
    /* pare-chaleur qui se découpe à contre-jour, liseré chauffé */
    c.save(); c.globalAlpha = 0.65 * fl;
    polyDir(c, ox, oy, d, [[21.5, -10.4], [26.5, -8.4], [26.5, 8.4], [21.5, 10.4]], "#0c0806");
    c.restore();
    polyDir(c, ox, oy, d, [[26.2, -8.4], [26.6, -8.4], [26.6, 8.4], [26.2, 8.4]], null,
            "rgba(255,130,40," + (0.55 * fl) + ")");
    lueurRapide(c, m.x, m.y, 16 + 9 * fl, "#ff8a1e", 0.55 * fl);
    lueurRapide(c, m.x + d.x * L * 0.6, m.y + d.y * L * 0.6, 26, "#ff8a1e", 0.35 * fl);
  }
};

TOURELLES.frelon = function(c, b, ang, tps){
  var d = vecteurEcran(ang), n2 = vecteurEcran(ang + 1.5708), nx = n2.x, ny = n2.y;
  var CE = 0.84, SE = 0.55;                 /* élévation ~33° */
  var ux = d.x * CE, uy = d.y * CE - SE;    /* axe des tubes (vers l'avant-haut) */
  var wx = -d.x * SE, wy = -d.y * SE - CE;  /* "haut" du bloc */
  var fl = b.flash || 0, rec = (b.recul || 0) * 2.8;
  var T0x = -d.x * 5, T0y = -39 - d.y * 5;            /* tourillon fixe */
  var Tx = T0x - ux * rec, Ty = T0y - uy * rec;       /* bloc, avec recul */
  var tR = -19, tF = 29, hw = 12, hh = 15;
  function P(t, s, h){ return { x:Tx + ux * t + nx * s + wx * h, y:Ty + uy * t + ny * s + wy * h }; }

  /* plaque tournante */
  c.fillStyle = "#57544d";
  c.beginPath(); c.ellipse(0, -31, 22, 11, 0, 0, 6.2832); c.fill();
  c.strokeStyle = "#2f2d2a"; c.lineWidth = 1.2;
  c.beginPath(); c.ellipse(0, -31, 22, 11, 0, 0, 6.2832); c.stroke();
  /* boulons de la couronne */
  c.fillStyle = "#33312c";
  c.beginPath(); c.arc(d.x * 18, -31 + d.y * 18, 1.3, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(nx * 16, -31 + ny * 16, 1.3, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(-nx * 16, -31 - ny * 16, 1.3, 0, 6.2832); c.fill();

  /* flasques du berceau : deux joues trapèzes ancrées sur la plaque */
  var s, tt;
  for(var i = 0; i < 2; i++){
    s = (i === 0 ? 1 : -1) * (ny < 0 ? 8 : -8);
    c.fillStyle = i === 0 ? "#45433d" : "#525049";
    c.beginPath();
    c.moveTo(T0x + d.x * -10 + nx * s, -31 + d.y * -10 + ny * s);
    c.lineTo(T0x + d.x * 5 + nx * s, -31 + d.y * 5 + ny * s);
    c.lineTo(T0x + ux * 0 + nx * s, T0y + uy * 0 + ny * s);
    c.lineTo(T0x + ux * -12 + nx * s, T0y + uy * -12 + ny * s);
    c.closePath(); c.fill();
  }
  /* axe du tourillon */
  c.fillStyle = "#23221f";
  c.beginPath(); c.arc(T0x - ux * 6, T0y - uy * 6, 2.4, 0, 6.2832); c.fill();

  /* vérin d'élévation sous l'avant du bloc */
  var j1x = d.x * 13, j1y = -31 + d.y * 13;
  var j2 = P(13, 0, 1);
  c.strokeStyle = "#2c2a26"; c.lineWidth = 4.6; c.lineCap = "butt";
  c.beginPath(); c.moveTo(j1x, j1y); c.lineTo(j1x * 0.45 + j2.x * 0.55, j1y * 0.45 + j2.y * 0.55); c.stroke();
  c.strokeStyle = "#d8d5cc"; c.lineWidth = 2;
  c.beginPath(); c.moveTo(j1x * 0.5 + j2.x * 0.5, j1y * 0.5 + j2.y * 0.5); c.lineTo(j2.x, j2.y); c.stroke();
  c.fillStyle = "#3a3833";
  c.beginPath(); c.arc(j1x, j1y, 2.2, 0, 6.2832); c.fill();

  /* --- bloc de six tubes --- */
  var sFar = ny < 0 ? hw : -hw, sNear = -sFar;
  var q1, q2, q3, q4;
  /* dessous (évite le bloc « creux » vu de face) */
  q1 = P(tR, -hw, 0); q2 = P(tF, -hw, 0); q3 = P(tF, hw, 0); q4 = P(tR, hw, 0);
  c.fillStyle = "#392f11";
  c.beginPath(); c.moveTo(q1.x, q1.y); c.lineTo(q2.x, q2.y); c.lineTo(q3.x, q3.y); c.lineTo(q4.x, q4.y); c.closePath(); c.fill();
  /* flanc éloigné */
  q1 = P(tR, sFar, 0); q2 = P(tF, sFar, 0); q3 = P(tF, sFar, hh); q4 = P(tR, sFar, hh);
  c.fillStyle = "#6e5a1d";
  c.beginPath(); c.moveTo(q1.x, q1.y); c.lineTo(q2.x, q2.y); c.lineTo(q3.x, q3.y); c.lineTo(q4.x, q4.y); c.closePath(); c.fill();
  /* face arrière (échappement) si visible */
  if(uy < -0.1){
    q1 = P(tR, -hw, 0); q2 = P(tR, hw, 0); q3 = P(tR, hw, hh); q4 = P(tR, -hw, hh);
    c.fillStyle = "#40350f";
    c.beginPath(); c.moveTo(q1.x, q1.y); c.lineTo(q2.x, q2.y); c.lineTo(q3.x, q3.y); c.lineTo(q4.x, q4.y); c.closePath(); c.fill();
  }
  /* flanc proche */
  q1 = P(tR, sNear, 0); q2 = P(tF, sNear, 0); q3 = P(tF, sNear, hh); q4 = P(tR, sNear, hh);
  c.fillStyle = "#4e4113";
  c.beginPath(); c.moveTo(q1.x, q1.y); c.lineTo(q2.x, q2.y); c.lineTo(q3.x, q3.y); c.lineTo(q4.x, q4.y); c.closePath(); c.fill();
  /* bande de renfort boulonnée du flanc proche */
  var r1 = P(-4, sNear, 2), r2 = P(16, sNear, 2);
  c.strokeStyle = "rgba(0,0,0,.30)"; c.lineWidth = 2;
  c.beginPath(); c.moveTo(r1.x, r1.y); c.lineTo(r2.x, r2.y); c.stroke();
  /* dessus */
  q1 = P(tR, -hw, hh); q2 = P(tF, -hw, hh); q3 = P(tF, hw, hh); q4 = P(tR, hw, hh);
  c.fillStyle = "#977d2b";
  c.beginPath(); c.moveTo(q1.x, q1.y); c.lineTo(q2.x, q2.y); c.lineTo(q3.x, q3.y); c.lineTo(q4.x, q4.y); c.closePath(); c.fill();
  c.strokeStyle = "rgba(255,246,225,.25)"; c.lineWidth = 1;
  c.beginPath(); c.moveTo(q1.x, q1.y); c.lineTo(q2.x, q2.y); c.stroke();
  /* rainures des trois colonnes de tubes + une sangle */
  c.strokeStyle = "rgba(0,0,0,.28)"; c.lineWidth = 1.2;
  var g1 = P(tR + 2, -hw / 3, hh), g2 = P(tF - 1, -hw / 3, hh);
  c.beginPath(); c.moveTo(g1.x, g1.y); c.lineTo(g2.x, g2.y); c.stroke();
  g1 = P(tR + 2, hw / 3, hh); g2 = P(tF - 1, hw / 3, hh);
  c.beginPath(); c.moveTo(g1.x, g1.y); c.lineTo(g2.x, g2.y); c.stroke();
  g1 = P(4, -hw, hh); g2 = P(4, hw, hh);
  c.beginPath(); c.moveTo(g1.x, g1.y); c.lineTo(g2.x, g2.y); c.stroke();

  /* --- face de bouche : 6 tubes en 2×3, ogives visibles --- */
  q1 = P(tF, -hw, 0); q2 = P(tF, hw, 0); q3 = P(tF, hw, hh); q4 = P(tF, -hw, hh);
  c.fillStyle = "#382e10";
  c.beginPath(); c.moveTo(q1.x, q1.y); c.lineTo(q2.x, q2.y); c.lineTo(q3.x, q3.y); c.lineTo(q4.x, q4.y); c.closePath(); c.fill();
  /* cloisons de l'alvéolage 2×3 */
  c.strokeStyle = "rgba(0,0,0,.4)"; c.lineWidth = 1;
  var v1 = P(tF, -hw / 3, 0.5), v2 = P(tF, -hw / 3, hh - 0.5);
  c.beginPath(); c.moveTo(v1.x, v1.y); c.lineTo(v2.x, v2.y); c.stroke();
  v1 = P(tF, hw / 3, 0.5); v2 = P(tF, hw / 3, hh - 0.5);
  c.beginPath(); c.moveTo(v1.x, v1.y); c.lineTo(v2.x, v2.y); c.stroke();
  v1 = P(tF, -hw + 0.5, hh / 2); v2 = P(tF, hw - 0.5, hh / 2);
  c.beginPath(); c.moveTo(v1.x, v1.y); c.lineTo(v2.x, v2.y); c.stroke();
  var col, row, m;
  for(var t2 = 0; t2 < 6; t2++){
    col = t2 % 3; row = (t2 / 3) | 0;
    m = P(tF + 0.5, -7.8 + col * 7.8, 4.2 + row * 6.8);
    /* lèvre du tube, puis fond, puis ogive à pointe claire */
    c.fillStyle = "#776220";
    c.beginPath(); c.ellipse(m.x, m.y, 3.5, 3.1, 0, 0, 6.2832); c.fill();
    c.fillStyle = "#141310";
    c.beginPath(); c.ellipse(m.x, m.y, 2.8, 2.5, 0, 0, 6.2832); c.fill();
    c.fillStyle = (fl > 0 && t2 === b.tube) ? "#ffca6a" : "#93362a";
    c.beginPath(); c.ellipse(m.x, m.y + 0.2, 1.9, 1.7, 0, 0, 6.2832); c.fill();
    c.fillStyle = (fl > 0 && t2 === b.tube) ? "#fff3d0" : "#d8a05a";
    c.beginPath(); c.arc(m.x - 0.5, m.y - 0.4, 0.7, 0, 6.2832); c.fill();
  }

  /* diode d'armement : rouge quand le tir est imminent */
  var dqx = -d.x * 17 + nx * (ny < 0 ? -8 : 8), dqy = -35 - d.y * 17 + ny * (ny < 0 ? -8 : 8);
  var chaud = b.prochainTir < 500;
  c.fillStyle = "#22211e"; c.fillRect(dqx - 2.2, dqy - 2.2, 4.4, 4.4);
  c.fillStyle = chaud ? (Math.sin(tps * 16) > 0 ? "#ff5a4a" : "#7a2018") : "#5fae6e";
  c.beginPath(); c.arc(dqx, dqy, 1.3, 0, 6.2832); c.fill();
  if(chaud) lueurRapide(c, dqx, dqy, 6, "#ff5a4a", 0.5);

  /* --- TIR : flash en étoile à la bouche + jet d'échappement arrière --- */
  if(fl > 0){
    col = (b.tube || 0) % 3; row = ((b.tube || 0) / 3) | 0;
    m = P(tF + 1.5, -7.8 + col * 7.8, 4.2 + row * 6.8);
    c.save(); c.globalCompositeOperation = "lighter";
    /* grande langue dans l'axe des tubes */
    c.fillStyle = "rgba(255,235,170," + (0.85 * fl) + ")";
    c.beginPath();
    c.moveTo(m.x + nx * (3.6 + 2 * fl), m.y + ny * (3.6 + 2 * fl));
    c.lineTo(m.x + ux * (16 + 13 * fl), m.y + uy * (16 + 13 * fl));
    c.lineTo(m.x - nx * (3.6 + 2 * fl), m.y - ny * (3.6 + 2 * fl));
    c.lineTo(m.x - ux * 3, m.y - uy * 3);
    c.closePath(); c.fill();
    /* croix perpendiculaire, plus courte */
    c.fillStyle = "rgba(255,220,150," + (0.6 * fl) + ")";
    c.beginPath();
    c.moveTo(m.x + ux * 2.4, m.y + uy * 2.4);
    c.lineTo(m.x + nx * (9 + 5 * fl), m.y + ny * (9 + 5 * fl));
    c.lineTo(m.x - ux * 2.4, m.y - uy * 2.4);
    c.lineTo(m.x - nx * (9 + 5 * fl), m.y - ny * (9 + 5 * fl));
    c.closePath(); c.fill();
    /* cœur blanc */
    c.fillStyle = "rgba(255,255,244," + (0.9 * fl) + ")";
    c.beginPath(); c.arc(m.x + ux * 2, m.y + uy * 2, 3, 0, 6.2832); c.fill();
    c.restore();
    lueur(c, m.x + ux * 4, m.y + uy * 4, 16 + 26 * fl, "#ffd07a", 0.65 * fl);
    /* jet d'échappement qui jaillit vers l'ARRIÈRE du bloc */
    var rr = P(tR - 1, (-7.8 + col * 7.8) * 0.5, (4.2 + row * 6.8) * 0.6);
    c.save(); c.globalCompositeOperation = "lighter";
    c.fillStyle = "rgba(255,160,70," + (0.5 * fl) + ")";
    c.beginPath();
    c.moveTo(rr.x + nx * 4, rr.y + ny * 4);
    c.lineTo(rr.x - ux * (20 + 12 * (1 - fl)), rr.y - uy * (20 + 12 * (1 - fl)) + 3);
    c.lineTo(rr.x - nx * 4, rr.y - ny * 4);
    c.closePath(); c.fill();
    c.restore();
    lueur(c, rr.x - ux * 8, rr.y - uy * 8, 14 + 10 * fl, "#ff9a3e", 0.4 * fl);
    bouffee(c, rr.x - ux * (14 + 18 * (1 - fl)), rr.y - uy * (14 + 18 * (1 - fl)) + 2,
            5.5 + 8 * (1 - fl), 0.5 * fl, "#a39a8d");
    bouffee(c, rr.x - ux * (24 + 26 * (1 - fl)) + nx * 4, rr.y - uy * (22 + 24 * (1 - fl)) + 6,
            4.5 + 8 * (1 - fl), 0.36 * fl, "#948f89");
  }
};

TOURELLES.pilon = function(c, b, ang, tps){
  var d = vecteurEcran(ang);
  var fl = b.flash || 0, rec = b.recul || 0, chg = b.chargement || 0;
  var o = { x:0, y:-8 };                       /* culasse, sur le moyeu de l'assise */
  /* axe du tube : quasi vertical, LÉGÈREMENT incliné vers la cible */
  var ax = d.x * 0.20, ay = -1;
  var nn = Math.hypot(ax, ay); ax /= nn; ay /= nn;
  var px = -ay, py = ax;                        /* perpendiculaire écran */
  var th = Math.atan2(ay, ax);                  /* angle écran de l'axe */
  var L = 60 - rec * 8;                         /* le recul ENFONCE le tube */
  var mx = o.x + ax * L, my = o.y + ay * L;     /* bouche */
  var trx = o.x + ax * 8, try_ = o.y + ay * 8;  /* tourillon */

  /* ---- culasse massive ---- */
  c.fillStyle = "#3a3833";
  c.beginPath(); c.ellipse(o.x, o.y + 2, 13.5, 7, 0, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,246,225,.10)";
  c.beginPath(); c.ellipse(o.x - 2, o.y, 10, 4.6, 0, 0, 6.2832); c.fill();

  /* ---- arc denté d'élévation + volant, sur le devant de la fosse ---- */
  var fr = d.x >= 0 ? 2.02 : 1.12;              /* secteur bas, côté libre */
  c.fillStyle = "#77746c";
  c.beginPath();
  c.moveTo(trx, try_);
  c.arc(trx, try_, 15.5, fr - 0.5, fr + 0.5);
  c.closePath(); c.fill();
  c.strokeStyle = "#96938b"; c.lineWidth = 2.2;
  c.beginPath(); c.arc(trx, try_, 15.5, fr - 0.5, fr + 0.5); c.stroke();
  /* crans de l'arc */
  c.strokeStyle = "#2c2a26"; c.lineWidth = 1.4;
  c.beginPath();
  for(var t2 = 0; t2 < 5; t2++){
    var at = fr - 0.4 + t2 * 0.2;
    c.moveTo(trx + Math.cos(at) * 14.2, try_ + Math.sin(at) * 14.2);
    c.lineTo(trx + Math.cos(at) * 16.9, try_ + Math.sin(at) * 16.9);
  }
  c.stroke();
  /* volant de pointage sur son pignon */
  var vx = trx + Math.cos(fr) * 21, vy = try_ + Math.sin(fr) * 21;
  c.strokeStyle = "#33312c"; c.lineWidth = 2;
  c.beginPath(); c.moveTo(trx + Math.cos(fr) * 15, try_ + Math.sin(fr) * 15); c.lineTo(vx, vy); c.stroke();
  c.strokeStyle = "#23221f"; c.lineWidth = 2.6;
  c.beginPath(); c.ellipse(vx, vy, 5.2, 3.4, 0.25, 0, 6.2832); c.stroke();
  c.strokeStyle = "#a8a49a"; c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(vx - 4.4, vy - 1.5); c.lineTo(vx + 4.4, vy + 1.5);
  c.moveTo(vx + 1.5, vy - 3.2); c.lineTo(vx - 1.5, vy + 3.2);
  c.stroke();
  c.fillStyle = "#33312c";
  c.beginPath(); c.arc(vx, vy, 1.6, 0, 6.2832); c.fill();

  /* ---- vérins amortisseurs de recul, courts et trapus ---- */
  var w0 = 12, w1 = 9;
  function verin(sg){
    var aX = o.x + px * sg * 19, aY = o.y + py * sg * 19 + 9;      /* ancrage assise */
    var cX = o.x + ax * L * 0.36 + px * sg * (w0 + 3.5);           /* collier tube */
    var cY = o.y + ay * L * 0.36 + py * sg * (w0 + 3.5);
    var mX = aX + (cX - aX) * 0.60, mY = aY + (cY - aY) * 0.60;
    c.fillStyle = "#1e1d1a";
    c.beginPath(); c.arc(aX, aY, 3.4, 0, 6.2832); c.fill();
    c.strokeStyle = "#2e2c28"; c.lineWidth = 8.5; c.lineCap = "butt";
    c.beginPath(); c.moveTo(aX, aY); c.lineTo(mX, mY); c.stroke();
    c.strokeStyle = "#5d5a54"; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(aX - 2.4, aY - 1.4); c.lineTo(mX - 2.4, mY - 1.4); c.stroke();
    c.strokeStyle = "#d8d5cc"; c.lineWidth = 3.4;
    c.beginPath(); c.moveTo(mX, mY); c.lineTo(cX, cY); c.stroke();
    c.fillStyle = "#44423d";
    c.beginPath(); c.arc(cX, cY, 3.2, 0, 6.2832); c.fill();
  }
  /* le vérin éloigné d'abord, le proche après le tube */
  var sgFar = py >= 0 ? -1 : 1;
  verin(sgFar);

  /* ---- LE TUBE : gros fût conique ---- */
  c.fillStyle = "#4b4843";
  c.beginPath();
  c.moveTo(o.x - px * w0, o.y - py * w0);
  c.lineTo(mx - px * w1, my - py * w1);
  c.lineTo(mx + px * w1, my + py * w1);
  c.lineTo(o.x + px * w0, o.y + py * w0);
  c.closePath(); c.fill();
  /* méplat éclairé côté gauche, ombre côté droit */
  c.fillStyle = "rgba(255,246,225,.20)";
  c.beginPath();
  c.moveTo(o.x - px * w0, o.y - py * w0);
  c.lineTo(mx - px * w1, my - py * w1);
  c.lineTo(mx - px * (w1 - 3.4), my - py * (w1 - 3.4));
  c.lineTo(o.x - px * (w0 - 4.4), o.y - py * (w0 - 4.4));
  c.closePath(); c.fill();
  c.fillStyle = "rgba(0,0,0,.26)";
  c.beginPath();
  c.moveTo(o.x + px * w0, o.y + py * w0);
  c.lineTo(mx + px * w1, my + py * w1);
  c.lineTo(mx + px * (w1 - 3), my + py * (w1 - 3));
  c.lineTo(o.x + px * (w0 - 3.8), o.y + py * (w0 - 3.8));
  c.closePath(); c.fill();
  /* deux frettes discrètes (bandes sombres + filet clair) */
  var fb, fw, f1x, f1y;
  c.fillStyle = "rgba(0,0,0,.30)";
  for(fb = 0; fb < 2; fb++){
    var tt = 0.22 + fb * 0.20;
    fw = w0 + (w1 - w0) * tt + 0.6;
    f1x = o.x + ax * L * tt; f1y = o.y + ay * L * tt;
    c.beginPath();
    c.moveTo(f1x - px * fw, f1y - py * fw);
    c.lineTo(f1x - px * fw + ax * 2.6, f1y - py * fw + ay * 2.6);
    c.lineTo(f1x + px * fw + ax * 2.6, f1y + py * fw + ay * 2.6);
    c.lineTo(f1x + px * fw, f1y + py * fw);
    c.closePath(); c.fill();
  }
  /* le vérin proche, PAR-DESSUS le tube */
  verin(-sgFar);

  /* ---- bouche : frette + gueule noire ---- */
  c.fillStyle = "#7a776f";
  c.beginPath(); c.ellipse(mx, my, w1 + 2.6, (w1 + 2.6) * 0.46, th + 1.5708, 0, 6.2832); c.fill();
  c.fillStyle = "#14130f";
  c.beginPath(); c.ellipse(mx, my, w1 - 1.4, (w1 - 1.4) * 0.46, th + 1.5708, 0, 6.2832); c.fill();
  c.strokeStyle = "rgba(255,246,225,.22)"; c.lineWidth = 1.1;
  c.beginPath(); c.ellipse(mx, my, w1 + 2.6, (w1 + 2.6) * 0.46, th + 1.5708, 2.6, 5.6); c.stroke();

  /* ---- montée en charge : lampe rouge qui bat avant le tir ---- */
  if(!fl && b.prochainTir < 600){
    var bat = Math.sin(tps * 14) > 0;
    c.fillStyle = bat ? "#ff5a4a" : "#6b241c";
    c.beginPath(); c.arc(o.x - px * 12, o.y - py * 12 - 2, 1.7, 0, 6.2832); c.fill();
    if(bat) lueurRapide(c, o.x - px * 12, o.y - py * 12 - 2, 7, "#ff5a4a", 0.5);
  }

  /* ---- TIR : boule de feu, panache et ANNEAU DE FUMÉE ---- */
  if(fl > 0){
    c.save(); c.globalCompositeOperation = "lighter";
    /* boule de feu orange à la bouche */
    c.fillStyle = "rgba(255,150,60," + (0.5 * fl) + ")";
    c.beginPath(); c.arc(mx + ax * 6, my + ay * 6, 11 + 8 * fl, 0, 6.2832); c.fill();
    /* langue orange, ronde du bout */
    c.fillStyle = "rgba(255,190,90," + (0.6 * fl) + ")";
    c.beginPath();
    c.moveTo(mx + px * (10 + 3 * fl), my + py * (10 + 3 * fl));
    c.quadraticCurveTo(mx + px * (10 + 3 * fl) + ax * 16, my + py * (10 + 3 * fl) + ay * 16,
                       mx + ax * (20 + 12 * fl), my + ay * (20 + 12 * fl));
    c.quadraticCurveTo(mx - px * (10 + 3 * fl) + ax * 16, my - py * (10 + 3 * fl) + ay * 16,
                       mx - px * (10 + 3 * fl), my - py * (10 + 3 * fl));
    c.closePath(); c.fill();
    /* langue jaune plus courte */
    c.fillStyle = "rgba(255,240,190," + (0.8 * fl) + ")";
    c.beginPath();
    c.moveTo(mx + px * 6, my + py * 6);
    c.quadraticCurveTo(mx + px * 5 + ax * 9, my + py * 5 + ay * 9,
                       mx + ax * (13 + 7 * fl), my + ay * (13 + 7 * fl));
    c.quadraticCurveTo(mx - px * 5 + ax * 9, my - py * 5 + ay * 9,
                       mx - px * 6, my - py * 6);
    c.closePath(); c.fill();
    /* cœur blanc */
    c.fillStyle = "rgba(255,255,244," + (0.85 * fl) + ")";
    c.beginPath(); c.arc(mx + ax * 4, my + ay * 4, 4.4, 0, 6.2832); c.fill();
    c.restore();
    lueur(c, mx + ax * 6, my + ay * 6, 18 + 18 * fl, "#ffcf7a", 0.5 * fl);
    /* anneau de fumée qui monte et s'élargit au-dessus de la bouche */
    var rr = 11 + (1 - fl) * 16;
    var rx2 = mx + ax * (14 + (1 - fl) * 26), ry2 = my + ay * (14 + (1 - fl) * 26);
    c.strokeStyle = "rgba(168,161,150," + (0.75 * fl) + ")";
    c.lineWidth = 4.4 + (1 - fl) * 2.6;
    c.beginPath(); c.ellipse(rx2, ry2, rr, rr * 0.44, th + 1.5708, 0, 6.2832); c.stroke();
    c.strokeStyle = "rgba(120,114,106," + (0.30 * fl) + ")";
    c.lineWidth = 2.2;
    c.beginPath();
    c.ellipse(mx + ax * (6 + (1 - fl) * 16), my + ay * (6 + (1 - fl) * 16), rr * 0.6, rr * 0.25, th + 1.5708, 0, 6.2832);
    c.stroke();
    /* poussière soulevée dans la fosse par le départ */
    c.fillStyle = "rgba(140,132,118," + (0.30 * fl) + ")";
    c.beginPath(); c.ellipse(o.x, o.y + 5, 26, 9, 0, 0, 6.2832); c.fill();
  }

  /* ---- chargement : l'obus jaune tombe dans la gueule ----
     dessiné en dernier pour que le jaune se détache toujours */
  if(chg > 0){
    var obx = mx + ax * (3 + (1 - chg) * 17), oby = my + ay * (3 + (1 - chg) * 17);
    c.save();
    c.translate(obx, oby); c.rotate(th + 1.5708);
    c.fillStyle = "#241f12";
    c.beginPath();
    if(c.roundRect) c.roundRect(-4.4, -11, 8.8, 18, 2.6); else c.rect(-4.4, -11, 8.8, 18);
    c.fill();
    c.fillStyle = "#eec93f";
    c.beginPath();
    if(c.roundRect) c.roundRect(-3.4, -10, 6.8, 16, 2.2); else c.rect(-3.4, -10, 6.8, 16);
    c.fill();
    c.fillStyle = "#9a978f";
    c.beginPath(); c.moveTo(-3.4, -9.6); c.lineTo(0, -15.4); c.lineTo(3.4, -9.6); c.closePath(); c.fill();
    c.fillStyle = "#b8493a"; c.fillRect(-3.4, 3, 6.8, 2.4);
    c.fillStyle = "rgba(255,255,255,.30)"; c.fillRect(-2.6, -9.4, 1.7, 13);
    c.restore();
  }
};

TOURELLES.bobine = function(c, b, ang, tps){
  var p = iso(0, 0);
  var zc = 87;
  var cx = p.x, cy = p.y - zc;
  var puls = 0.5 + 0.5 * Math.sin(tps * 4.2);
  var fl = b.flash > 0 ? b.flash : 0;
  var pt = (b.prochainTir === undefined) ? 2000 : b.prochainTir;
  var chg = (fl > 0) ? 0 : (pt < 900 ? 1 - pt / 900 : 0);

  /* lueur qui monte le long de la colonne pendant la charge */
  if(chg > 0.05){
    lueurRapide(c, p.x, p.y - 22 - chg * 36, 12 + chg * 12, "#7de6ff", chg * 0.4);
    lueurRapide(c, p.x, p.y - 40, 10, "#7de6ff", chg * 0.28);
  }
  /* condensateurs qui palpitent (leurs bornes) */
  var k1 = iso(-0.54, 0.18), k2 = iso(0.18, 0.54);
  lueurRapide(c, k1.x, k1.y - 44, 7 + chg * 4, "#7de6ff", 0.15 + puls * 0.13 + chg * 0.4);
  lueurRapide(c, k2.x, k2.y - 44, 7 + chg * 4, "#7de6ff", 0.15 + (1 - puls) * 0.13 + chg * 0.4);

  /* la sphère : gonfle et blanchit en charge, se vide au tir */
  var r = 9.8 + chg * 3.4 + puls * 0.5 - fl * 3.2;
  var coul = fl > 0
    ? melange("#123039", "#2c8fa8", 1 - fl)
    : melange(melange("#2c8fa8", "#7de6ff", 0.30 + puls * 0.30), "#ffffff", chg * 0.65);
  c.fillStyle = coul;
  c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.fill();
  c.strokeStyle = "rgba(10,40,48,.55)"; c.lineWidth = 1.4;
  c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.stroke();
  c.fillStyle = "rgba(255,255,255," + (0.28 + chg * 0.3 - fl * 0.2) + ")";
  c.beginPath(); c.arc(cx - r * 0.32, cy - r * 0.36, r * 0.42, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,255,255," + (0.5 + chg * 0.4 - fl * 0.3) + ")";
  c.beginPath(); c.arc(cx - r * 0.38, cy - r * 0.42, r * 0.18, 0, 6.2832); c.fill();

  /* arcs : des griffes vers la sphère */
  var tips = [[-11, -80], [11, -80], [3.4, -102]];
  c.save();
  c.globalCompositeOperation = "lighter";
  for(var i = 0; i < 3; i++){
    var act = fl > 0 ? 1
      : chg > 0 ? (i < 1 + chg * 2.2 ? 1 : 0)
      : (((Math.floor(tps * 6) + i) % 3) === 0 ? 1 : 0);
    if(!act) continue;
    var tx = p.x + tips[i][0], ty = p.y + tips[i][1];
    lueurRapide(c, tx, ty, 6 + chg * 4, "#7de6ff", 0.3 + chg * 0.3 + fl * 0.3);
    var vx = cx - tx, vy = cy - ty, l = Math.hypot(vx, vy) || 1;
    var ex = cx - vx / l * r, ey = cy - vy / l * r;
    var nx = -vy / l, ny = vx / l;
    c.strokeStyle = "rgba(200,245,255," + (0.7 + chg * 0.3 + fl * 0.3) + ")";
    c.lineWidth = 1.5 + chg * 0.8 + fl * 0.8;
    c.beginPath(); c.moveTo(tx, ty);
    for(var k = 1; k <= 3; k++){
      var tt = k / 4;
      var dz = Math.sin(tps * 53 + i * 7 + k * 5.3) * (2.2 + chg * 2 + fl * 2);
      c.lineTo(tx + (ex - tx) * tt + nx * dz, ty + (ey - ty) * tt + ny * dz);
    }
    c.lineTo(ex, ey); c.stroke();
  }
  /* couronne d'arcs rampant sur la sphère quand l'énergie monte */
  if(chg > 0.3 || fl > 0){
    c.strokeStyle = "rgba(180,240,255," + (0.35 + chg * 0.4 + fl * 0.4) + ")";
    c.lineWidth = 1.1;
    for(var j = 0; j < 2; j++){
      var a0 = tps * 3.1 + j * 3.14;
      c.beginPath();
      c.moveTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r * 0.6);
      for(var kk = 1; kk <= 4; kk++){
        var aa = a0 + kk * 0.5;
        var rr = r + Math.sin(kk * 2.7 + tps * 11 + j * 4) * 2.6;
        c.lineTo(cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr * 0.6);
      }
      c.stroke();
    }
  }
  /* décharge : éclats radiaux violents */
  if(fl > 0){
    c.strokeStyle = "rgba(255,255,255," + (0.85 * fl) + ")";
    c.lineWidth = 2;
    for(var s = 0; s < 5; s++){
      var as = s * 1.2566 + 0.35;
      var ln = 12 + fl * 15;
      var mx = cx + Math.cos(as) * (r + ln * 0.5) + Math.sin(s * 9.7) * 3;
      var my = cy + Math.sin(as) * (r + ln * 0.5) * 0.8 + Math.cos(s * 7.3) * 3;
      c.beginPath();
      c.moveTo(cx + Math.cos(as) * r, cy + Math.sin(as) * r * 0.8);
      c.lineTo(mx, my);
      c.lineTo(cx + Math.cos(as) * (r + ln), cy + Math.sin(as) * (r + ln) * 0.8);
      c.stroke();
    }
  }
  c.restore();

  /* halos (dégradés en cache, teintes fixes) */
  lueurRapide(c, cx, cy, 24 + puls * 8 + chg * 14, "#7de6ff", 0.20 + puls * 0.12 + chg * 0.45);
  if(fl > 0){
    lueurRapide(c, cx, cy, 26 + fl * 14, "#ffffff", fl * 0.6);
    lueurRapide(c, cx, cy, 58, "#7de6ff", fl * 0.4);
    lueurRapide(c, p.x, p.y - 40, 20, "#7de6ff", fl * 0.3);
  }
};

/* ----------------------------------------------------------------
   LES ARCS DE LA CELLULE ÉLECTRIQUE
   Les deux fonctions ci-dessous ne font que TRACER : ni beginPath ni
   stroke. C'est voulu.
   La première version peignait chaque arc à part — une passe large
   pour le halo, une passe fine pour le cœur — soit une trentaine de
   tracés composités en « lighter » par cellule, et cinq cellules à
   l'écran coûtaient dix fois une Bobine. Or tous ces arcs partagent
   exactement les deux mêmes passes : on accumule donc TOUT dans un
   seul chemin, qu'on repasse deux fois. Deux opérations au lieu de
   trente, pour un résultat identique au pixel.

   Le bruit vient de sinus et non d'un tirage au sort : à graine égale
   le trait est identique d'une image à l'autre, ce qui permet de le
   tenir immobile quelques images puis de le faire sauter d'un coup —
   c'est ce claquement discret qui fait « électrique », là où un bruit
   renouvelé à chaque image ne donne que du grésil.
   ---------------------------------------------------------------- */
function traceEclair(c, x0, y0, x1, y1, n, amp, gr){
  var vx = x1 - x0, vy = y1 - y0;
  var l = Math.hypot(vx, vy) || 1;
  var nx = -vy / l, ny = vx / l;
  c.moveTo(x0, y0);
  for(var i = 1; i < n; i++){
    var t = i / n;
    var d = Math.sin(gr * 1.7 + i * 2.399) * amp * Math.sin(t * Math.PI);
    c.lineTo(x0 + vx * t + nx * d, y0 + vy * t + ny * d);
  }
  c.lineTo(x1, y1);
}
/* Grand arc de cage : du cerceau à un contrefort, en s'écartant de la
   tour pour rester lisible en dehors de sa silhouette. */
function traceCage(c, x0, y0, x1, y1, cambre, amp, gr){
  var vx = x1 - x0, vy = y1 - y0;
  var l = Math.hypot(vx, vy) || 1;
  var nx = -vy / l, ny = vx / l;
  c.moveTo(x0, y0);
  for(var i = 1; i < 8; i++){
    var t = i / 8;
    var d = (cambre + Math.sin(gr * 1.7 + i * 2.399) * amp) * Math.sin(t * Math.PI);
    c.lineTo(x0 + vx * t + nx * d, y0 + vy * t + ny * d);
  }
  c.lineTo(x1, y1);
}

/* ================================================================
   CELLULE ÉLECTRIQUE — la couche vivante.
   Rien ne s'y arrête jamais : l'onde de terre bat sur la dalle, l'âme
   pulse, les arcs rampent autour des quatre bobines, DE GRANDS ARCS
   DE CAGE tombent du cerceau sur les contreforts, l'orbe brûle et le
   panache monte au-dessus du paratonnerre. Tout est déphasé par b.n
   pour que les cinq cellules de l'île ne battent pas la même mesure,
   et tout s'affole à mesure que les PV tombent.
   ================================================================ */
/* Quel plot du cerceau reçoit l'arc de quel contrefort */
var REAC_PLOTS = [0, 2, 3, 5];

TOURELLES.reacteur = function(c, b, ang, tps){
  var o = iso(0, 0);
  var i, k, a, an, x0, y0, x1, y1, vx, vy, l;
  var dep = (b.n || 0) * 1.37;
  var pvm = b.pvMax || 1;
  var fr = Math.max(0, Math.min(1, b.pv / pvm));
  var mal = 1 - fr;                            // 0 intacte, 1 à l'agonie
  /* Scintillement : sous les coups le courant hoquette. Deux sinus de
     périodes premières entre elles, pour que la panne ne tombe jamais
     deux fois au même moment. */
  var vac = 1;
  if(mal > 0.2){
    var hic = Math.sin(tps * 17.3 + dep * 3.1) * Math.sin(tps * 6.7 + dep);
    vac = 1 - (mal - 0.2) * 1.05 * Math.max(0, hic);
  }
  var puls = 0.5 + 0.5 * Math.sin(tps * 2.35 + dep);
  var nerf = 1 + mal * 1.8;                    // amplitude des arcs
  var tic = Math.floor(tps * (8 + mal * 7) + dep * 5);   // horloge des claquements
  var cyC = o.y - REAC_ZCER, rxC = REAC_RCER * RX, ryC = REAC_RCER * RY;
  var ox = o.x, oy = o.y - REAC_ZORBE;
  var tx = o.x, ty = o.y - REAC_ZPOINTE;

  c.save();
  c.globalCompositeOperation = "lighter";
  /* Jonctions en biseau et bouts francs : sur un chemin d'arcs de six
     cents pixels, des raccords ronds coûtent presque le double à
     tracer — et l'électricité casse net, elle n'arrondit pas. */
  c.lineCap = "butt"; c.lineJoin = "bevel";

  /* ---- l'onde de terre ----
     Toutes les trois secondes la cellule pousse un anneau de lumière
     sur sa dalle. Une silhouette, même haute, se perd dans une base
     qui compte cent bâtiments ; ce battement lent, lui, attire l'œil
     d'un bout à l'autre de l'île. */
  for(i = 0; i < 2; i++){
    var po = (tps * 0.32 + i * 0.5 + dep * 0.17) % 1;
    var ao = (1 - po) * 0.80 * vac;
    if(ao > 0.03){
      var ro = 0.6 + po * 2.7;
      c.strokeStyle = "rgba(72,132,238," + (ao * 0.62).toFixed(3) + ")";
      c.lineWidth = 3.6 - po * 2.2;
      c.beginPath();
      c.ellipse(o.x, o.y - 4, ro * RX, ro * RY, 0, 0, 6.2832);
      c.stroke();
    }
  }

  /* ================================================================
     TOUS LES ARCS DANS UN SEUL CHEMIN
     ================================================================ */
  c.beginPath();

  /* LES GRANDS ARCS DE CAGE. Un seul des quatre à la fois — deux quand
     la cellule agonise — et l'horloge des claquements le fait tourner
     d'un contrefort à l'autre. Ils courent sur toute la hauteur, en
     dehors de la silhouette : c'est la seule chose de la couche vivante
     qui reste lisible à un zoom de carte, et donc celle qui dit « c'est
     ça qu'il faut abattre ». */
  for(i = 0; i < 4; i++){
    if(((tic + i * 5) % 4) > (mal > 0.4 ? 1 : 0)) continue;
    a = REAC_PLOTS[i] / REAC_NCER * 6.2832 + 0.5236;
    x0 = o.x + Math.cos(a) * rxC;
    y0 = cyC + Math.sin(a) * ryC - 7.4;
    var w = iso(REAC_BORNES[i][0], REAC_BORNES[i][1]);
    x1 = w.x; y1 = w.y - REAC_ZBORNE;
    traceCage(c, x0, y0, x1, y1,
              (x0 > o.x ? -1 : 1) * (13 + puls * 5), 7 * nerf, tic * 3 + i);
  }

  /* un arc rampe autour de chaque bobine, en sens alternés */
  for(i = 0; i < REAC_ANNEAUX.length; i++){
    an = REAC_ANNEAUX[i];
    var sens = (i % 2) ? -1 : 1;
    var a0 = tps * (0.85 + i * 0.29) * sens + dep + i * 1.9;
    var rxA = an.r * RX, ryA = an.r * RY, cyA = o.y - an.z;
    for(k = 0; k <= 7; k++){
      a = a0 + k * 0.27;
      var rr = 1 + Math.sin(tps * (21 + i * 5) + k * 2.7 + dep) * 0.07 * nerf;
      var px = o.x + Math.cos(a) * rxA * rr;
      var py = cyA + Math.sin(a) * ryA * rr + Math.sin(tps * 29 + k * 3.3 + i) * 1.8 * nerf;
      if(k === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
  }

  /* décharges verticales d'une bobine à la suivante */
  for(i = 0; i < REAC_ANNEAUX.length - 1; i++){
    if(((tic + i * 3) % 5) > (mal > 0.4 ? 2 : 1)) continue;
    var ab = (tic * 1.7 + i * 2.3) % 6.2832;
    var A = REAC_ANNEAUX[i], B = REAC_ANNEAUX[i + 1];
    traceEclair(c,
      o.x + Math.cos(ab) * A.r * RX, o.y - A.z + Math.sin(ab) * A.r * RY,
      o.x + Math.cos(ab + 0.5) * B.r * RX, o.y - B.z + Math.sin(ab + 0.5) * B.r * RY,
      5, 4.8 * nerf, tic + i);
  }

  /* le cerceau nourrit l'orbe */
  var tc = Math.floor(tps * 5.5 + dep * 3);
  for(i = 0; i < REAC_NCER; i++){
    if(((tc + i) % 3) !== 0) continue;
    a = i / REAC_NCER * 6.2832 + 0.5236;
    x0 = o.x + Math.cos(a) * rxC;
    y0 = cyC + Math.sin(a) * ryC - 7.4;
    vx = ox - x0; vy = oy - y0; l = Math.hypot(vx, vy) || 1;
    traceEclair(c, x0, y0, ox - vx / l * REAC_RORBE, oy - vy / l * REAC_RORBE,
                4, 3.8 * nerf, tc + i * 3);
  }

  /* un arc rampe sur le cerceau lui-même */
  var acer = tps * 1.25 + dep;
  for(i = 0; i <= 8; i++){
    a = acer + i * 0.30;
    var rc = 1 + Math.sin(tps * 17 + i * 2.4 + dep) * 0.06 * nerf;
    if(i === 0) c.moveTo(o.x + Math.cos(a) * rxC * rc, cyC + Math.sin(a) * ryC * rc);
    else c.lineTo(o.x + Math.cos(a) * rxC * rc, cyC + Math.sin(a) * ryC * rc);
  }

  /* la couronne d'arcs qui tourne autour de l'orbe */
  for(k = 0; k < 2; k++){
    var ae = tps * 2.6 + k * 3.1416 + dep;
    c.moveTo(ox + Math.cos(ae) * REAC_RORBE, oy + Math.sin(ae) * REAC_RORBE * 0.55);
    for(i = 1; i <= 5; i++){
      var aa2 = ae + i * 0.52;
      var r2 = REAC_RORBE + Math.sin(i * 2.7 + tps * 9 + k * 4 + dep) * 2.8 * nerf;
      c.lineTo(ox + Math.cos(aa2) * r2, oy + Math.sin(aa2) * r2 * 0.55);
    }
  }

  /* la pointe grésille */
  if((tic % 3) === 0){
    for(k = 0; k < 2; k++){
      var ak = (tic * 2.1 + k * 3.7) % 6.2832;
      traceEclair(c, tx, ty, tx + Math.cos(ak) * 13,
                  ty - 5 - Math.abs(Math.sin(ak)) * 11, 3, 3.0, tic + k);
    }
  }

  /* les deux passes du chemin unique : le halo, puis le cœur */
  c.strokeStyle = "rgba(77,140,255," + (0.34 * vac).toFixed(3) + ")";
  c.lineWidth = 4.8;
  c.stroke();
  c.strokeStyle = "rgba(230,240,255," + ((0.78 + puls * 0.14) * vac).toFixed(3) + ")";
  c.lineWidth = 1.9 + mal * 0.7;
  c.stroke();

  /* ---- l'orbe : cœur blanc ---- */
  var rO = 5.8 + puls * 1.8;
  c.fillStyle = "rgba(255,255,255," + ((0.48 + puls * 0.30) * vac).toFixed(3) + ")";
  c.beginPath(); c.arc(ox, oy, rO, 0, 6.2832); c.fill();

  /* ---- LE PANACHE ----
     La planche de sprite s'arrête à cent soixante-deux pixels au-dessus
     du sol, et la cellule y touche déjà. La couche vivante, elle, n'est
     pas rognée : c'est le seul endroit où la cellule peut encore gagner
     de la hauteur. Une trentaine de pixels de lumière au-dessus du
     paratonnerre, et elle dépasse franchement tout le reste de l'île. */
  var hp = 34 + puls * 10;
  var dv = Math.sin(tps * 2.7 + dep) * 2.6;
  c.fillStyle = "rgba(214,232,255," + (0.30 * vac).toFixed(3) + ")";
  c.beginPath();
  c.moveTo(tx - 3.4, ty + 2);
  c.lineTo(tx + dv * 0.6, ty - hp * 0.62);
  c.lineTo(tx + dv, ty - hp);
  c.lineTo(tx + dv * 0.6 + 1.2, ty - hp * 0.62);
  c.lineTo(tx + 3.4, ty + 2);
  c.closePath(); c.fill();
  c.fillStyle = "rgba(246,251,255," + (0.42 * vac).toFixed(3) + ")";
  c.beginPath();
  c.moveTo(tx - 1.5, ty + 2);
  c.lineTo(tx + dv, ty - hp * 0.86);
  c.lineTo(tx + 1.5, ty + 2);
  c.closePath(); c.fill();

  /* ---- étincelles arrachées quand la cellule souffre ---- */
  if(mal > 0.35){
    c.fillStyle = "rgba(196,220,255,.85)";
    c.beginPath();
    for(i = 0; i < 5; i++){
      var pe = (tps * 1.15 + i * 0.31 + dep) % 1;
      var ze = 104 - pe * pe * 96;
      var xe = o.x + Math.sin(tps * 3 + i * 2.2) * (10 + i * 4);
      c.moveTo(xe + 1.9, o.y - ze);
      c.arc(xe, o.y - ze, 1.5 * (1 - pe) + 0.4, 0, 6.2832);
    }
    c.fill();
  }

  /* ---- les halos, en dégradés mis en cache ---- */
  /* l'âme : deux impulsions qui montent le long du mât */
  for(i = 0; i < 2; i++){
    var mt = (tps * 0.42 + i / 2 + dep * 0.21) % 1;
    var am = Math.sin(mt * Math.PI) * 0.62 * vac;
    lueurRapide(c, o.x, o.y - (26 + mt * 96), 14 + am * 8, REAC_VIF, am * 1.1);
  }
  /* la perle qui fait le tour d'une bobine */
  an = REAC_ANNEAUX[tic & 3];
  a = tps * (0.85 + (tic & 3) * 0.29) * (((tic & 3) % 2) ? -1 : 1) + dep + (tic & 3) * 1.9 + 1.89;
  lueurRapide(c, o.x + Math.cos(a) * an.r * RX, o.y - an.z + Math.sin(a) * an.r * RY,
              11 + puls * 4, "#ffffff", 0.48 * vac);
  /* le panache, l'orbe, la pointe, et l'aura de toute la colonne */
  for(i = 0; i < 2; i++){
    var tp = (i + 0.75) / 2;
    lueurRapide(c, tx + Math.sin(tps * 2.1 + i * 1.7 + dep) * 3 * tp, ty - hp * tp,
                (10 - i * 3.4) * (1 + puls * 0.22),
                i ? REAC_BLEU : REAC_CLAIR, (0.38 - i * 0.12) * vac);
  }
  lueurRapide(c, ox, oy, 30 + puls * 10, REAC_VIF, (0.42 + puls * 0.18) * vac);
  lueurRapide(c, ox, oy, 13, "#ffffff", (0.32 + puls * 0.20) * vac);
  lueurRapide(c, tx, ty, 10 + puls * 4, REAC_CLAIR, (0.36 + puls * 0.24) * vac);
  /* L'aura de la colonne est le poste le plus cher de toute la couche
     vivante : un disque additif large comme la cellule est haute. On la
     resserre d'un quart et on compense en opacité — même halo à l'œil,
     moitié moins de pixels mélangés. */
  lueurRapide(c, o.x, o.y - 60, 58 + puls * 8, REAC_BLEU, (0.36 + puls * 0.14) * vac);
  c.restore();
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
