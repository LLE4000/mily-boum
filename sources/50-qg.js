/* ================================================================
   LE QG — la forteresse de braise, et sa gardienne
   ================================================================ */

var QG_W = 620, QG_H = 580, QG_OX = 310, QG_OY = 430;
var spriteQG = null;

/* Couleurs de la forteresse */
var CQ = {
  pierre:"#3b2a4c", pierreT:"#523a68", pierreG:"#241a30", pierreD:"#2f2140",
  pierre2:"#332444", lave:"#ff6a1e", braise:"#ff9a32", or:"#e8c25a",
  banniere:"#a8232a", banniereO:"#7d1a20", fer:"#2a2430"
};

/* ---------------------------------------------------------------
   Sprite pré-calculé de la forteresse
   --------------------------------------------------------------- */
function construitSpriteQG(){
  var cv = nouveauCanvas(QG_W, QG_H);
  var c = cv.getContext("2d");
  c.setTransform(1, 0, 0, 1, QG_OX, QG_OY);

  ombreContact(c, 0, 0, 8.4, 8.4, 0.30);

  /* ---- trois terrasses empilées ---- */
  var terrasses = [
    { r:3.45, h:16, cr:26, ct:0.24 },
    { r:2.70, h:15, cr:20, ct:0.26 },
    { r:2.05, h:14, cr:0,  ct:0.28 }
  ];
  var z = 0;
  for(var i = 0; i < 3; i++){
    var t = terrasses[i];
    prisme(c, 0, 0, t.r, 8, 0.3927, z, t.h,
           ecl(CQ.pierre, 1.28 - i * 0.04), ecl(CQ.pierre, 0.52 + i * 0.05));
    /* appareillage de pierre */
    c.save();
    c.globalAlpha = 0.22; c.strokeStyle = "#160f1e"; c.lineWidth = 1;
    for(var k = 0; k < 3; k++){
      var p1 = iso(-t.r, 0), p2 = iso(t.r, 0);
      c.beginPath();
      c.moveTo(p1.x, p1.y - z - k * 5 - 4);
      c.lineTo(p2.x, p2.y - z - k * 5 - 4);
      c.stroke();
    }
    c.restore();
    z += t.h;
    if(t.cr) creneaux(c, 0, 0, t.r * 0.99, z, t.cr, ecl(CQ.pierre, 1.35), ecl(CQ.pierre, 0.55), t.ct);
  }

  /* ---- veines de lave sur la terrasse basse ---- */
  c.save();
  c.globalCompositeOperation = "lighter";
  for(var v = 0; v < 9; v++){
    var a0 = v / 9 * 6.2832 + 0.3;
    var p0 = iso(Math.cos(a0) * 0.9, Math.sin(a0) * 0.9);
    var p1b = iso(Math.cos(a0) * 3.3, Math.sin(a0) * 3.3);
    var gd = c.createLinearGradient(p0.x, p0.y - 16, p1b.x, p1b.y - 16);
    gd.addColorStop(0, "rgba(255,170,60,.85)");
    gd.addColorStop(1, "rgba(255,60,10,0)");
    c.strokeStyle = gd; c.lineWidth = 2.6; c.lineCap = "round";
    c.beginPath();
    c.moveTo(p0.x, p0.y - 16);
    c.quadraticCurveTo((p0.x + p1b.x) / 2 + Math.sin(v) * 12, (p0.y + p1b.y) / 2 - 16, p1b.x, p1b.y - 16);
    c.stroke();
  }
  c.restore();

  /* ---- donjon central ---- */
  var f = { t:ecl(CQ.pierre2, 1.30), g:ecl(CQ.pierre2, 0.55), d:ecl(CQ.pierre2, 0.78) };
  boite(c, 0, 0, 2.0, 2.0, z, 34, f.t, f.g, f.d);
  /* arcs gothiques incandescents */
  function arcGothique(gx, gy, zz, h, larg){
    var p = iso(gx, gy);
    var gd = c.createLinearGradient(p.x, p.y - zz - h, p.x, p.y - zz);
    gd.addColorStop(0, "rgba(255,190,80,.95)");
    gd.addColorStop(1, "rgba(200,40,10,.75)");
    c.fillStyle = gd;
    c.beginPath();
    c.moveTo(p.x - larg, p.y - zz);
    c.lineTo(p.x - larg, p.y - zz - h * 0.55);
    c.quadraticCurveTo(p.x, p.y - zz - h * 1.25, p.x + larg, p.y - zz - h * 0.55);
    c.lineTo(p.x + larg, p.y - zz);
    c.closePath(); c.fill();
  }
  arcGothique(1.0, 0.0, z + 8, 16, 4);
  arcGothique(0.0, 1.0, z + 8, 16, 4);
  /* toit du donjon */
  creneaux(c, 0, 0, 0.95, z + 34, 12, ecl(CQ.pierre, 1.4), ecl(CQ.pierre, 0.6), 0.26);
  cone3d(c, 0, 0, 0.75, z + 34, 30, ecl("#5a3a2e", 1.2), "#3d2620");
  /* fanal au sommet */
  cylindre(c, 0, 0, 0.16, z + 62, 6, CQ.or, ecl(CQ.or, 0.6));

  /* ---- huit tours ---- */
  var tours = [];
  var rT = 3.0;
  for(var k2 = 0; k2 < 8; k2++){
    var a = k2 / 8 * 6.2832 + 0.3927;
    var haute = (k2 % 2 === 0);
    tours.push({ gx:Math.cos(a) * rT, gy:Math.sin(a) * rT, h:haute ? 46 : 34, r:haute ? 0.46 : 0.38 });
  }
  tours.sort(function(p, q){ return (p.gx + p.gy) - (q.gx + q.gy); });
  for(var m = 0; m < 8; m++){
    var T = tours[m];
    cylindre(c, T.gx, T.gy, T.r, 0, T.h, ecl(CQ.pierre, 1.22), ecl(CQ.pierre, 0.58));
    /* bandeau de pierre */
    cylindre(c, T.gx, T.gy, T.r * 1.12, T.h - 8, 4, ecl(CQ.pierre, 1.32), ecl(CQ.pierre, 0.66));
    creneaux(c, T.gx, T.gy, T.r * 1.05, T.h - 4, 7, ecl(CQ.pierre, 1.4), ecl(CQ.pierre, 0.6), 0.18);
    /* vasque à brasero */
    cylindre(c, T.gx, T.gy, T.r * 0.55, T.h + 2, 5, "#241a2c", ecl(CQ.fer, 1.2));
    var pv = iso(T.gx, T.gy);
    c.fillStyle = "#1a1220";
    c.beginPath(); c.ellipse(pv.x, pv.y - T.h - 7, T.r * 0.55 * RX, T.r * 0.55 * RY, 0, 0, 6.2832); c.fill();
    /* meurtrières */
    c.fillStyle = "rgba(255,140,40,.55)";
    c.fillRect(pv.x - 1.6, pv.y - T.h * 0.6, 3.2, 7);
    /* gargouille */
    if(T.h === 46){
      c.fillStyle = ecl(CQ.pierre, 0.9);
      c.beginPath();
      c.moveTo(pv.x + T.r * RX * 0.8, pv.y - T.h + 6);
      c.lineTo(pv.x + T.r * RX * 1.7, pv.y - T.h + 10);
      c.lineTo(pv.x + T.r * RX * 0.8, pv.y - T.h + 13);
      c.closePath(); c.fill();
      c.fillStyle = "rgba(255,120,40,.6)";
      c.beginPath(); c.arc(pv.x + T.r * RX * 1.5, pv.y - T.h + 10, 1.2, 0, 6.2832); c.fill();
    }
  }
  /* ---- chaînes en caténaire entre les tours hautes ---- */
  c.strokeStyle = "rgba(30,22,38,.9)"; c.lineWidth = 2.2;
  var hautes = tours.filter(function(x){ return x.h === 46; }).sort(function(p, q){
    return Math.atan2(p.gy, p.gx) - Math.atan2(q.gy, q.gx);
  });
  for(var h2 = 0; h2 < hautes.length; h2++){
    var A2 = hautes[h2], B2 = hautes[(h2 + 1) % hautes.length];
    var pa = iso(A2.gx, A2.gy), pb = iso(B2.gx, B2.gy);
    var ya = pa.y - A2.h - 2, yb = pb.y - B2.h - 2;
    c.beginPath();
    c.moveTo(pa.x, ya);
    c.quadraticCurveTo((pa.x + pb.x) / 2, (ya + yb) / 2 + 24, pb.x, yb);
    c.stroke();
    /* maillons */
    c.fillStyle = "rgba(60,48,72,.9)";
    for(var s = 0.15; s < 0.9; s += 0.14){
      var xx = (1 - s) * (1 - s) * pa.x + 2 * (1 - s) * s * (pa.x + pb.x) / 2 + s * s * pb.x;
      var yy = (1 - s) * (1 - s) * ya + 2 * (1 - s) * s * ((ya + yb) / 2 + 24) + s * s * yb;
      c.beginPath(); c.arc(xx, yy, 1.6, 0, 6.2832); c.fill();
    }
  }
  /* braseros suspendus aux chaînes (vasques ; flamme en direct) */
  for(var b3 = 0; b3 < hautes.length; b3++){
    var A3 = hautes[b3], B3 = hautes[(b3 + 1) % hautes.length];
    var pa3 = iso(A3.gx, A3.gy), pb3 = iso(B3.gx, B3.gy);
    var mx = (pa3.x + pb3.x) / 2, my = ((pa3.y - 48) + (pb3.y - 48)) / 2 + 24;
    c.fillStyle = "#241a2c";
    c.beginPath(); c.ellipse(mx, my + 6, 5, 2.6, 0, 0, 6.2832); c.fill();
    c.strokeStyle = "rgba(30,22,38,.9)"; c.lineWidth = 1;
    c.beginPath(); c.moveTo(mx, my); c.lineTo(mx, my + 6); c.stroke();
  }

  /* ---- escalier de cinq marches vers la porte (côté est, face au joueur) ---- */
  for(var e = 0; e < 5; e++){
    var zz = e * 3.2;
    boite(c, 2.15 + (4 - e) * 0.28, 0, 0.5, 1.5, zz, 3.4,
          ecl(CQ.pierre, 1.30), ecl(CQ.pierre, 0.55), ecl(CQ.pierre, 0.75), true);
  }
  /* rampes */
  for(var r2 = -1; r2 <= 1; r2 += 2){
    boite(c, 2.6, r2 * 0.85, 1.6, 0.2, 0, 14,
          ecl(CQ.pierre, 1.2), ecl(CQ.pierre, 0.5), ecl(CQ.pierre, 0.7), true);
  }
  /* ---- porte en arc + herse ---- */
  var pd = iso(2.0, 0);
  c.fillStyle = "#150e1c";
  c.beginPath();
  c.moveTo(pd.x - 13, pd.y - 16);
  c.lineTo(pd.x - 13, pd.y - 40);
  c.quadraticCurveTo(pd.x, pd.y - 62, pd.x + 13, pd.y - 40);
  c.lineTo(pd.x + 13, pd.y - 16);
  c.closePath(); c.fill();
  /* encadrement */
  c.strokeStyle = ecl(CQ.pierre, 1.5); c.lineWidth = 3;
  c.stroke();
  /* herse */
  c.strokeStyle = "rgba(70,58,84,.85)"; c.lineWidth = 1.6;
  for(var hh = -3; hh <= 3; hh++){
    c.beginPath(); c.moveTo(pd.x + hh * 4, pd.y - 18); c.lineTo(pd.x + hh * 4, pd.y - 44); c.stroke();
  }
  for(var vv = 0; vv < 3; vv++){
    c.beginPath(); c.moveTo(pd.x - 12, pd.y - 22 - vv * 8); c.lineTo(pd.x + 12, pd.y - 22 - vv * 8); c.stroke();
  }

  /* ---- deux bannières rouges à médaillon d'or ---- */
  function banniere(gx, gy, zz){
    var p = iso(gx, gy);
    c.fillStyle = CQ.banniereO;
    c.beginPath();
    c.moveTo(p.x - 9, p.y - zz);
    c.lineTo(p.x + 9, p.y - zz);
    c.lineTo(p.x + 9, p.y - zz + 34);
    c.lineTo(p.x, p.y - zz + 28);
    c.lineTo(p.x - 9, p.y - zz + 34);
    c.closePath(); c.fill();
    c.fillStyle = CQ.banniere;
    c.beginPath();
    c.moveTo(p.x - 9, p.y - zz);
    c.lineTo(p.x + 2, p.y - zz);
    c.lineTo(p.x + 2, p.y - zz + 31);
    c.lineTo(p.x - 9, p.y - zz + 34);
    c.closePath(); c.fill();
    c.fillStyle = CQ.or;
    c.beginPath(); c.arc(p.x, p.y - zz + 14, 5, 0, 6.2832); c.fill();
    c.fillStyle = "#a8232a";
    c.beginPath(); c.arc(p.x, p.y - zz + 14, 2.6, 0, 6.2832); c.fill();
    c.strokeStyle = "#6a5a2a"; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(p.x - 11, p.y - zz - 1); c.lineTo(p.x + 11, p.y - zz - 1); c.stroke();
  }
  banniere(1.55, -1.25, 44);
  banniere(1.55, 1.25, 44);

  /* ---- suie sur les murs ---- */
  c.save();
  c.globalAlpha = 0.14; c.fillStyle = "#000";
  var al = prng(9911);
  for(var s2 = 0; s2 < 60; s2++){
    var ax = (al() - 0.5) * 220, ay = -al() * 90;
    c.fillRect(ax, ay, 1 + al() * 3, 6 + al() * 26);
  }
  c.restore();

  spriteQG = cv;
}

/* ================================================================
   Dessin du QG en direct
   ================================================================ */
function dessineQG(c, tps){
  var q = jeu.qg;
  var p = versEcran(cam, q.gx, q.gy);
  var z = cam.z;
  var fr = Math.max(0, q.pv / q.pvMax);

  c.save();
  c.translate(p.x, p.y);
  c.scale(z, z);

  if(spriteQG) c.drawImage(spriteQG, -QG_OX, -QG_OY, QG_W, QG_H);

  /* --- fissures orange sous 66 % de vie --- */
  if(fr < 0.66){
    var ouv = (0.66 - fr) / 0.66;
    var al = prng(4242);
    c.save();
    c.lineCap = "round";
    for(var i = 0; i < 16; i++){
      var x0 = (al() - 0.5) * 210, y0 = -al() * 96;
      var gd = c.createLinearGradient(x0, y0, x0 + 20, y0 + 30);
      gd.addColorStop(0, "rgba(255,180,60," + (0.35 + ouv * 0.55) + ")");
      gd.addColorStop(1, "rgba(255,60,10,.15)");
      c.strokeStyle = gd;
      c.lineWidth = 0.8 + ouv * 3.2;
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x0 + (al() - 0.5) * 26, y0 + 14);
      c.lineTo(x0 + (al() - 0.5) * 34, y0 + 30);
      c.stroke();
    }
    c.restore();
  }

  /* --- flammes des huit braseros --- */
  var rT = 3.0;
  for(var k = 0; k < 8; k++){
    var a = k / 8 * 6.2832 + 0.3927;
    var haute = (k % 2 === 0);
    var pv = iso(Math.cos(a) * rT, Math.sin(a) * rT);
    var hT = haute ? 46 : 34;
    flamme(c, pv.x, pv.y - hT - 6, 15 + Math.sin(tps * 3 + k) * 3, tps + k * 0.7, 0.8);
  }
  /* braseros suspendus */
  var hautes = [];
  for(var m = 0; m < 8; m += 2){
    var am = m / 8 * 6.2832 + 0.3927;
    hautes.push(iso(Math.cos(am) * rT, Math.sin(am) * rT));
  }
  for(var h = 0; h < hautes.length; h++){
    var A = hautes[h], B = hautes[(h + 1) % hautes.length];
    var mx = (A.x + B.x) / 2, my = ((A.y - 48) + (B.y - 48)) / 2 + 24;
    flamme(c, mx, my + 4, 9, tps + h * 1.3, 0.5);
  }
  /* fanal du donjon */
  var zz = 16 + 15 + 14;
  flamme(c, 0, -zz - 68, 13, tps * 1.3, 0.7);

  /* --- fournaise de la porte, qui pulse --- */
  var pd = iso(2.0, 0);
  var pouls = 0.5 + 0.5 * Math.sin(tps * 2.4);
  var intense = jeu.qgTelegraphe > 0 ? 1 : pouls;
  c.save();
  c.globalCompositeOperation = "lighter";
  var gf = c.createRadialGradient(pd.x, pd.y - 30, 3, pd.x, pd.y - 30, 34 + intense * 14);
  gf.addColorStop(0, "rgba(255,220,150," + (0.55 + intense * 0.4) + ")");
  gf.addColorStop(0.45, "rgba(255,110,25," + (0.35 + intense * 0.3) + ")");
  gf.addColorStop(1, "rgba(255,60,10,0)");
  c.fillStyle = gf;
  c.beginPath();
  c.moveTo(pd.x - 13, pd.y - 16);
  c.lineTo(pd.x - 13, pd.y - 40);
  c.quadraticCurveTo(pd.x, pd.y - 62, pd.x + 13, pd.y - 40);
  c.lineTo(pd.x + 13, pd.y - 16);
  c.closePath(); c.fill();
  c.restore();
  /* brume de chaleur au-dessus de la porte */
  c.save();
  c.globalAlpha = 0.10;
  for(var b = 0; b < 5; b++){
    var ph = (tps * 0.5 + b * 0.2) % 1;
    c.fillStyle = "#ffcf9a";
    c.beginPath();
    c.ellipse(pd.x + Math.sin(tps * 2 + b * 2) * 6, pd.y - 62 - ph * 40,
              10 + ph * 14, 4 + ph * 5, 0, 0, 6.2832);
    c.fill();
  }
  c.restore();

  /* --- la gardienne, au-dessus de la porte --- */
  var inten = Math.min(1, 0.3 + pouls * 0.3 + (jeu.qgTelegraphe > 0 ? 0.4 : 0) + (1 - fr) * 0.4);
  gardienne3D(c, pd.x, pd.y - 104, 1.05, inten);

  c.restore();
}
