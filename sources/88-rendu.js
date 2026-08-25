/* ================================================================
   RENDU — élagage à la vue, tri de profondeur, effets
   ================================================================ */

var cv = null, ctx = null;
var secX = 0, secY = 0;                 // décalage de la secousse d'écran
function repereMonde(c){
  c.setTransform(dpr * cam.z, 0, 0, dpr * cam.z,
                 (secX + cam.px) * dpr, (secY + cam.py) * dpr);
}
function repereEcran(c){ c.setTransform(dpr, 0, 0, dpr, secX * dpr, secY * dpr); }
var miniCv = null, miniCtx = null, miniFond = null, miniProchain = 0;
var pile = [];

function rectVisible(m){
  m = m || 0;
  return {
    x0:(0 - cam.px) / cam.z - m, y0:(0 - cam.py) / cam.z - m,
    x1:(W - cam.px) / cam.z + m, y1:(H - cam.py) / cam.z + m
  };
}
/* Le rectangle visible touche-t-il la côte ? Quand la caméra est bien à
   l'intérieur des terres, l'île couvre tout l'écran : inutile de peindre
   la mer, l'écume et le ressac sous un sol opaque. */
function coteVisible(vue){
  var a = deIso(vue.x0, vue.y0), b = deIso(vue.x1, vue.y0);
  var c = deIso(vue.x1, vue.y1), d = deIso(vue.x0, vue.y1);
  var gx0 = Math.min(a.gx, b.gx, c.gx, d.gx), gx1 = Math.max(a.gx, b.gx, c.gx, d.gx);
  var gy0 = Math.min(a.gy, b.gy, c.gy, d.gy), gy1 = Math.max(a.gy, b.gy, c.gy, d.gy);
  return !(gx0 > 1.5 && gx1 < GW - 1.5 && gy0 > 1.5 && gy1 < GH - 1.5);
}
function visible(vue, gx, gy){
  var p = iso(gx, gy);
  return p.x > vue.x0 - 90 && p.x < vue.x1 + 90 && p.y > vue.y0 - 200 && p.y < vue.y1 + 110;
}

/* ---------------------------------------------------------------
   Effets
   --------------------------------------------------------------- */
function dessineEffet(c, e, tps){
  var t = e.age / e.duree;
  var p = versEcran(cam, e.gx, e.gy);
  var z = cam.z;
  if(e.t === "boum"){
    var r = (14 + e.r * 26) * (0.35 + t * 1.3) * z;
    c.save();
    c.globalCompositeOperation = "lighter";
    var g = c.createRadialGradient(p.x, p.y - r * 0.4, r * 0.1, p.x, p.y - r * 0.4, r);
    var a = (1 - t) * (1 - t);
    g.addColorStop(0, "rgba(255,246,214," + (0.95 * a) + ")");
    g.addColorStop(0.35, "rgba(255,160,50," + (0.8 * a) + ")");
    g.addColorStop(0.7, "rgba(220,60,20," + (0.45 * a) + ")");
    g.addColorStop(1, "rgba(120,20,10,0)");
    c.fillStyle = g;
    c.beginPath(); c.arc(p.x, p.y - r * 0.4, r, 0, 6.2832); c.fill();
    c.restore();
    /* éclats */
    var al = prng((e.gx * 977 + e.gy * 31) | 0);
    for(var i = 0; i < 7; i++){
      var ang = al() * 6.2832, dd = t * (24 + al() * 40) * z;
      c.fillStyle = "rgba(255," + (120 + al() * 100 | 0) + ",40," + (1 - t) + ")";
      c.beginPath();
      c.arc(p.x + Math.cos(ang) * dd, p.y - r * 0.35 + Math.sin(ang) * dd * 0.5 - t * 14 * z,
            (2.4 + al() * 2) * z * (1 - t * 0.6), 0, 6.2832);
      c.fill();
    }
    /* fumée qui reste */
    bouffee(c, p.x, p.y - (10 + t * 26) * z, (8 + t * 18) * z, (1 - t) * 0.34, "#3a3238");
  }else if(e.t === "traceur"){
    var q = versEcran(cam, e.ex, e.ey);
    c.save();
    c.globalCompositeOperation = "lighter";
    c.strokeStyle = e.perdue ? "rgba(255,220,150,.55)" : "rgba(255,240,190,.9)";
    c.lineWidth = (e.perdue ? 1.1 : 1.6) * Math.max(0.6, z);
    c.beginPath();
    c.moveTo(p.x, p.y - 18 * z); c.lineTo(q.x, q.y - 12 * z);
    c.stroke();
    c.restore();
  }else if(e.t === "poussiere"){
    c.save();
    c.globalAlpha = (1 - t) * 0.55;
    c.fillStyle = "#d8c9a4";
    c.beginPath(); c.ellipse(p.x, p.y - 3 * z, (4 + t * 9) * z, (2 + t * 4) * z, 0, 0, 6.2832); c.fill();
    c.restore();
  }else if(e.t === "cone"){
    c.save();
    c.globalCompositeOperation = "lighter";
    var n = 16;
    for(var k = 0; k < n; k++){
      var f2 = k / n;
      var aa = e.ang + (Math.random() - 0.5) * e.ouv * 2 * (0.3 + f2);
      var dd2 = e.portee * f2;
      var pp = versEcran(cam, e.gx + Math.cos(aa) * dd2, e.gy + Math.sin(aa) * dd2);
      var rr = (3 + f2 * 11) * z;
      var gg = c.createRadialGradient(pp.x, pp.y - 12 * z, 0, pp.x, pp.y - 12 * z, rr);
      gg.addColorStop(0, "rgba(255,240,190," + (0.7 * (1 - t)) + ")");
      gg.addColorStop(0.4, "rgba(255,140,30," + (0.55 * (1 - t)) + ")");
      gg.addColorStop(1, "rgba(200,40,10,0)");
      c.fillStyle = gg;
      c.beginPath(); c.arc(pp.x, pp.y - 12 * z, rr, 0, 6.2832); c.fill();
    }
    c.restore();
    /* lueur au sol */
    var pe = versEcran(cam, e.gx + Math.cos(e.ang) * e.portee * 0.5, e.gy + Math.sin(e.ang) * e.portee * 0.5);
    lueur(c, pe.x, pe.y, e.portee * 12 * z, "#ff8a1e", 0.16 * (1 - t));
  }else if(e.t === "souffle"){
    var d = vecteurEcran(e.ang);
    c.save();
    c.globalAlpha = (1 - t) * 0.5;
    for(var s = 0; s < 4; s++){
      bouffee(c, p.x - d.x * (10 + s * 9 + t * 30) * z, p.y - 22 * z - d.y * (10 + s * 9) * z,
              (4 + s * 2 + t * 10) * z, 0.5, "#6a6068");
    }
    c.restore();
  }else if(e.t === "eclair"){
    c.save();
    c.globalCompositeOperation = "lighter";
    c.strokeStyle = "rgba(160,240,255," + (1 - t) + ")";
    c.lineWidth = 2 * z;
    for(var b = 0; b < 5; b++){
      var a2 = b / 5 * 6.2832 + t * 3;
      c.beginPath();
      c.moveTo(p.x, p.y - 30 * z);
      var xx = p.x, yy = p.y - 30 * z;
      for(var m2 = 0; m2 < 4; m2++){
        xx += Math.cos(a2) * e.r * 9 * z / 4 + (Math.random() - 0.5) * 8 * z;
        yy += Math.sin(a2) * e.r * 5 * z / 4 + 7 * z + (Math.random() - 0.5) * 5 * z;
        c.lineTo(xx, yy);
      }
      c.stroke();
    }
    c.restore();
    lueur(c, p.x, p.y - 10 * z, e.r * 20 * z, "#7de6ff", 0.4 * (1 - t));
  }else if(e.t === "coup"){
    c.save();
    c.globalAlpha = 1 - t;
    c.strokeStyle = "#fff6e0"; c.lineWidth = 2.2 * z;
    for(var g2 = 0; g2 < 3; g2++){
      var ag = g2 * 2.1 + t * 2;
      c.beginPath();
      c.moveTo(p.x + Math.cos(ag) * 5 * z, p.y - 14 * z + Math.sin(ag) * 4 * z);
      c.lineTo(p.x + Math.cos(ag) * (11 + t * 8) * z, p.y - 14 * z + Math.sin(ag) * (8 + t * 5) * z);
      c.stroke();
    }
    c.restore();
  }else if(e.t === "piqure"){
    c.save();
    c.globalAlpha = 1 - t;
    c.fillStyle = "#ffe08a";
    c.beginPath(); c.arc(p.x, p.y - 14 * z, 3 * z, 0, 6.2832); c.fill();
    c.restore();
  }else if(e.t === "crachat"){
    var q2 = versEcran(cam, e.ex, e.ey);
    c.save();
    c.globalAlpha = 1 - t;
    c.strokeStyle = "#8ec63f"; c.lineWidth = 3 * z; c.lineCap = "round";
    c.beginPath();
    c.moveTo(p.x, p.y - 12 * z);
    c.quadraticCurveTo((p.x + q2.x) / 2, Math.min(p.y, q2.y) - 40 * z, q2.x, q2.y);
    c.stroke();
    c.restore();
  }else if(e.t === "drapeau"){
    var h = 26 * z;
    c.strokeStyle = "#e8e0d0"; c.lineWidth = 2 * z;
    c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x, p.y - h); c.stroke();
    c.fillStyle = "#ff8a1e";
    c.beginPath();
    c.moveTo(p.x, p.y - h);
    c.lineTo(p.x + 15 * z + Math.sin(tps * 5) * 2 * z, p.y - h + 5 * z);
    c.lineTo(p.x, p.y - h + 10 * z);
    c.closePath(); c.fill();
    c.save(); c.globalAlpha = 0.3 * (1 - t);
    c.strokeStyle = "#ff8a1e"; c.lineWidth = 2 * z;
    c.beginPath(); c.ellipse(p.x, p.y, (10 + t * 40) * z, (5 + t * 20) * z, 0, 0, 6.2832); c.stroke();
    c.restore();
  }else if(e.t === "mort" || e.t === "mortCre"){
    c.save();
    c.globalAlpha = 1 - t;
    c.fillStyle = e.t === "mort" ? "rgba(220,80,60,.6)" : "rgba(200,120,220,.6)";
    c.beginPath(); c.ellipse(p.x, p.y - 8 * z, (7 + t * 12) * z, (4 + t * 6) * z, 0, 0, 6.2832); c.fill();
    for(var d3 = 0; d3 < 5; d3++){
      var a3 = d3 * 1.4 + 0.4;
      c.beginPath();
      c.arc(p.x + Math.cos(a3) * t * 18 * z, p.y - 12 * z + Math.sin(a3) * t * 10 * z - t * 8 * z,
            2.2 * z * (1 - t), 0, 6.2832);
      c.fill();
    }
    c.restore();
  }else if(e.t === "frappe"){
    c.save();
    c.globalAlpha = 1 - t;
    c.strokeStyle = "#ffd070"; c.lineWidth = 2.4 * z;
    c.beginPath(); c.ellipse(p.x, p.y, (60 - t * 45) * z, (30 - t * 22) * z, 0, 0, 6.2832); c.stroke();
    c.restore();
  }else if(e.t === "cryo"){
    c.save();
    c.globalAlpha = 1 - t;
    c.strokeStyle = "#d8f4ff"; c.lineWidth = 3 * z;
    c.beginPath();
    c.ellipse(p.x, p.y, e.r * RX * z * (0.3 + t * 0.8), e.r * RY * z * (0.3 + t * 0.8), 0, 0, 6.2832);
    c.stroke();
    c.restore();
  }else if(e.t === "caisse"){
    c.save();
    c.globalAlpha = 1 - t;
    c.fillStyle = "#a5854e";
    c.fillRect(p.x - 9 * z, p.y - (10 + t * 20) * z, 18 * z, 12 * z);
    c.fillStyle = "rgba(255,255,255,.3)";
    c.fillRect(p.x - 9 * z, p.y - (10 + t * 20) * z, 18 * z, 3 * z);
    c.restore();
  }else if(e.t === "plumes"){
    c.save();
    c.globalAlpha = 1 - t;
    c.fillStyle = "#fff8ec";
    for(var pl2 = 0; pl2 < 6; pl2++){
      var apl = pl2 * 1.05 + 0.3;
      c.save();
      c.translate(p.x + Math.cos(apl) * t * 22 * z, p.y - 10 * z + Math.sin(apl) * t * 12 * z - t * 6 * z);
      c.rotate(apl + t * 3);
      c.beginPath(); c.ellipse(0, 0, 3.4 * z, 1.4 * z, 0, 0, 6.2832); c.fill();
      c.restore();
    }
    c.restore();
  }else if(e.t === "nova"){
    var a2 = 1 - t;
    c.save();
    /* flash */
    if(t < 0.16){
      c.fillStyle = "rgba(255,255,245," + (1 - t / 0.16) * 0.9 + ")";
      c.fillRect(-W, -H, W * 3, H * 3);
    }
    c.globalCompositeOperation = "lighter";
    /* boule de feu */
    var rb = e.r * RX * z * (0.4 + Math.min(1, t * 3) * 1.5);
    var gb2 = c.createRadialGradient(p.x, p.y - rb * 0.45, rb * 0.08, p.x, p.y - rb * 0.45, rb);
    gb2.addColorStop(0, "rgba(255,255,235," + (0.95 * a2) + ")");
    gb2.addColorStop(0.28, "rgba(255,196,80," + (0.85 * a2) + ")");
    gb2.addColorStop(0.62, "rgba(238,86,24," + (0.5 * a2) + ")");
    gb2.addColorStop(1, "rgba(120,20,8,0)");
    c.fillStyle = gb2;
    c.beginPath(); c.arc(p.x, p.y - rb * 0.45, rb, 0, 6.2832); c.fill();
    /* anneau de souffle au sol */
    var rr2 = e.r * RX * z * (0.5 + t * 3.2);
    c.strokeStyle = "rgba(255,236,190," + (0.55 * a2) + ")";
    c.lineWidth = (10 - t * 8) * z;
    c.beginPath(); c.ellipse(p.x, p.y, rr2, rr2 / 2, 0, 0, 6.2832); c.stroke();
    c.restore();
    /* le champignon */
    c.save();
    c.globalAlpha = Math.min(1, a2 * 1.4);
    var mt = Math.min(1, t * 1.5);
    var yc = p.y - (24 + mt * 150) * z;
    for(var s2 = 0; s2 < 7; s2++){
      bouffee(c, p.x + Math.sin(s2 * 1.7 + t * 3) * 8 * z,
              p.y - (14 + s2 * 18 * mt) * z, (9 + s2 * 2) * z * (0.5 + mt), 0.45, "#6a5a52");
    }
    for(var h2 = 0; h2 < 9; h2++){
      var ah = h2 / 9 * 6.2832;
      bouffee(c, p.x + Math.cos(ah) * (14 + mt * 46) * z, yc + Math.sin(ah) * (7 + mt * 16) * z,
              (16 + mt * 20) * z, 0.42, h2 % 2 ? "#7a6258" : "#94786a");
    }
    bouffee(c, p.x, yc - 8 * z, (22 + mt * 34) * z, 0.5, "#8a7264");
    c.restore();
  }else if(e.t === "baliseLancee"){
    c.save();
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = 1 - t;
    c.fillStyle = "#ffe9a0";
    c.beginPath(); c.arc(p.x, p.y - (10 + (1 - t) * 90) * z, 4 * z, 0, 6.2832); c.fill();
    c.restore();
  }
}

/* Projectiles */
function dessineProjectile(c, p, tps){
  var e = versEcran(cam, p.gx, p.gy);
  var z = cam.z;
  var zz = (p.z || 0) * z;
  if(p.t === "roquetteJ" || p.t === "roquette"){
    var d = vecteurEcran(p.ang || 0);
    c.save();
    c.translate(e.x, e.y - 18 * z - zz);
    c.rotate(Math.atan2(d.y, d.x));
    c.scale(z, z);
    c.fillStyle = p.t === "roquetteJ" ? "#e8672f" : "#8a9a62";
    c.beginPath();
    c.moveTo(6, 0); c.lineTo(-4, -2.2); c.lineTo(-4, 2.2);
    c.closePath(); c.fill();
    c.fillStyle = "#f7f1e2";
    c.fillRect(-4, -1.6, 2, 3.2);
    c.restore();
    /* traînée */
    c.save();
    c.globalCompositeOperation = "lighter";
    var g = c.createRadialGradient(e.x, e.y - 18 * z - zz, 0, e.x, e.y - 18 * z - zz, 9 * z);
    g.addColorStop(0, "rgba(255,200,120,.7)"); g.addColorStop(1, "rgba(255,120,30,0)");
    c.fillStyle = g;
    c.beginPath(); c.arc(e.x - (d ? d.x * 6 * z : 0), e.y - 18 * z - zz - (d ? d.y * 6 * z : 0), 9 * z, 0, 6.2832); c.fill();
    c.restore();
  }else if(p.t === "viper"){
    c.save();
    c.fillStyle = p.braise ? "#ff8a1e" : (p.allie ? "#ffd070" : "#d8b52e");
    c.beginPath(); c.ellipse(e.x, e.y - zz - 6 * z, 3 * z, 4.6 * z, 0, 0, 6.2832); c.fill();
    if(p.braise){
      c.globalCompositeOperation = "lighter";
      var g2 = c.createRadialGradient(e.x, e.y - zz - 6 * z, 0, e.x, e.y - zz - 6 * z, 14 * z);
      g2.addColorStop(0, "rgba(255,190,90,.8)"); g2.addColorStop(1, "rgba(255,80,20,0)");
      c.fillStyle = g2;
      c.beginPath(); c.arc(e.x, e.y - zz - 6 * z, 14 * z, 0, 6.2832); c.fill();
    }
    c.restore();
    /* ombre au sol */
    c.save(); c.globalAlpha = 0.22; c.fillStyle = "#000";
    c.beginPath(); c.ellipse(e.x, e.y, 4 * z, 2 * z, 0, 0, 6.2832); c.fill();
    c.restore();
  }else if(p.t === "viper" || p.t === "nova"){
    var nova = p.t === "nova";
    var hy = e.y - zz;
    /* traînée de fumée */
    c.save();
    c.globalAlpha = 0.5;
    for(var s3 = 1; s3 <= 9; s3++){
      var t3 = s3 / 9;
      var px3 = e.x + (versEcran(cam, p.x0, p.y0).x - e.x) * t3;
      var pz3 = p.z * (1 - (p.age / p.duree)) * 0;
      var py3 = hy + ((versEcran(cam, p.x0, p.y0).y - p.haut * cam.z) - hy) * t3;
      bouffee(c, px3, py3, (3 + t3 * (nova ? 13 : 8)) * cam.z, (1 - t3) * 0.5, "#b4aca8");
    }
    c.restore();
    c.save();
    c.translate(e.x, hy);
    c.rotate(Math.atan2(p.cy - p.y0 + 0.001, p.cx - p.x0) * 0 + 0.9);
    c.scale(cam.z, cam.z);
    if(nova){
      /* ogive trapue à ailerons, bandes de danger */
      c.fillStyle = "#d8d2c4";
      c.beginPath();
      c.moveTo(0, -16); c.quadraticCurveTo(9, -6, 8, 12);
      c.lineTo(-8, 12); c.quadraticCurveTo(-9, -6, 0, -16);
      c.closePath(); c.fill();
      c.fillStyle = "#e8c437";
      c.fillRect(-8, -2, 16, 5);
      c.fillStyle = "#1c1a18";
      for(var b3 = -1; b3 <= 1; b3++) c.fillRect(b3 * 5 - 1.4, -2, 2.8, 5);
      c.fillStyle = "#b8433a";
      c.beginPath(); c.moveTo(-8, 12); c.lineTo(-13, 19); c.lineTo(-4, 15); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(8, 12); c.lineTo(13, 19); c.lineTo(4, 15); c.closePath(); c.fill();
    }else{
      /* Viper : long, fin, ailerons nets */
      c.fillStyle = "#cfd6dc";
      c.beginPath();
      c.moveTo(0, -18); c.quadraticCurveTo(4.5, -6, 4, 12);
      c.lineTo(-4, 12); c.quadraticCurveTo(-4.5, -6, 0, -18);
      c.closePath(); c.fill();
      c.fillStyle = "#2f8ea4";
      c.fillRect(-4, -4, 8, 3.4);
      c.fillStyle = "#8a949c";
      c.beginPath(); c.moveTo(-4, 10); c.lineTo(-9, 17); c.lineTo(-2, 14); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(4, 10); c.lineTo(9, 17); c.lineTo(2, 14); c.closePath(); c.fill();
    }
    /* jet du propulseur */
    c.globalCompositeOperation = "lighter";
    var gj2 = c.createRadialGradient(0, 16, 0, 0, 16, nova ? 16 : 12);
    gj2.addColorStop(0, "rgba(255,240,190,.9)");
    gj2.addColorStop(0.45, "rgba(255,150,40,.6)");
    gj2.addColorStop(1, "rgba(255,80,20,0)");
    c.fillStyle = gj2;
    c.beginPath(); c.ellipse(0, 16, nova ? 9 : 6, nova ? 16 : 12, 0, 0, 6.2832); c.fill();
    c.restore();
    c.save(); c.globalAlpha = 0.2; c.fillStyle = "#000";
    c.beginPath(); c.ellipse(e.x, e.y, 6 * cam.z, 3 * cam.z, 0, 0, 6.2832); c.fill();
    c.restore();
  }else if(p.t === "bobine"){
    c.save();
    c.globalCompositeOperation = "lighter";
    var g3 = c.createRadialGradient(e.x, e.y - zz - 8 * z, 0, e.x, e.y - zz - 8 * z, 11 * z);
    g3.addColorStop(0, "rgba(220,250,255,.95)");
    g3.addColorStop(0.4, "rgba(125,230,255,.6)");
    g3.addColorStop(1, "rgba(60,160,220,0)");
    c.fillStyle = g3;
    c.beginPath(); c.arc(e.x, e.y - zz - 8 * z, 11 * z, 0, 6.2832); c.fill();
    c.restore();
  }
}

/* ---------------------------------------------------------------
   Zones au sol (dessinées en repère monde)
   --------------------------------------------------------------- */
function dessineZonesSol(c, tps){
  var i;
  /* cratères */
  c.save();
  c.globalAlpha = 0.34;
  for(i = 0; i < jeu.crateres.length; i++){
    var k = jeu.crateres[i], p = iso(k.gx, k.gy);
    c.fillStyle = "#2a2018";
    c.beginPath(); c.ellipse(p.x, p.y, k.r * RX, k.r * RY, 0, 0, 6.2832); c.fill();
    c.fillStyle = "rgba(80,60,40,.5)";
    c.beginPath(); c.ellipse(p.x, p.y - 1, k.r * RX * 0.7, k.r * RY * 0.7, 0, 0, 6.2832); c.fill();
  }
  c.restore();
  /* flaques enflammées */
  for(i = 0; i < jeu.flaques.length; i++){
    var f = jeu.flaques[i], q = iso(f.gx, f.gy);
    var a = Math.min(1, (f.duree - f.age) / 1.2);
    c.save();
    c.globalCompositeOperation = "lighter";
    var g = c.createRadialGradient(q.x, q.y, 2, q.x, q.y, f.r * RX);
    g.addColorStop(0, "rgba(255,200,90," + (0.55 * a) + ")");
    g.addColorStop(0.6, "rgba(255,90,20," + (0.35 * a) + ")");
    g.addColorStop(1, "rgba(200,30,10,0)");
    c.fillStyle = g;
    c.beginPath(); c.ellipse(q.x, q.y, f.r * RX, f.r * RY, 0, 0, 6.2832); c.fill();
    for(var n = 0; n < 5; n++){
      var an = n / 5 * 6.2832 + tps;
      flamme(c, q.x + Math.cos(an) * f.r * RX * 0.55, q.y + Math.sin(an) * f.r * RY * 0.55,
             10 * a, tps + n, 0.5);
    }
    c.restore();
  }
  /* glu */
  for(i = 0; i < jeu.glu.length; i++){
    var g2 = jeu.glu[i], r2 = iso(g2.gx, g2.gy);
    var a2 = Math.min(1, (g2.duree - g2.age) / 1.5) * 0.55;
    c.save();
    c.globalAlpha = a2;
    c.fillStyle = "#7db83a";
    c.beginPath(); c.ellipse(r2.x, r2.y, g2.r * RX, g2.r * RY, 0, 0, 6.2832); c.fill();
    c.fillStyle = "rgba(220,255,160,.5)";
    c.beginPath(); c.ellipse(r2.x - 6, r2.y - 3, g2.r * RX * 0.35, g2.r * RY * 0.35, 0, 0, 6.2832); c.fill();
    c.restore();
  }
  /* zones de soin */
  for(i = 0; i < jeu.soin.length; i++){
    var s = jeu.soin[i], t = iso(s.gx, s.gy);
    var a3 = Math.min(1, (s.duree - s.age) / 1.0);
    c.save();
    c.globalCompositeOperation = "lighter";
    var g3 = c.createRadialGradient(t.x, t.y, 2, t.x, t.y, s.r * RX);
    g3.addColorStop(0, "rgba(110,224,138," + (0.3 * a3) + ")");
    g3.addColorStop(1, "rgba(110,224,138,0)");
    c.fillStyle = g3;
    c.beginPath(); c.ellipse(t.x, t.y, s.r * RX, s.r * RY, 0, 0, 6.2832); c.fill();
    c.strokeStyle = "rgba(150,255,180," + (0.5 * a3) + ")"; c.lineWidth = 2;
    c.beginPath();
    c.ellipse(t.x, t.y, s.r * RX * (0.75 + 0.25 * Math.sin(tps * 3)),
              s.r * RY * (0.75 + 0.25 * Math.sin(tps * 3)), 0, 0, 6.2832);
    c.stroke();
    c.restore();
  }
  /* zones cryogéniques : les tourelles prises dedans sont muettes */
  for(i = 0; i < jeu.cryos.length; i++){
    var zc = jeu.cryos[i], pz = iso(zc.gx, zc.gy);
    var az = Math.min(1, zc.age * 3) * Math.min(1, (zc.duree - zc.age) / 1.5);
    c.save();
    var gz = c.createRadialGradient(pz.x, pz.y, 4, pz.x, pz.y, zc.r * RX);
    gz.addColorStop(0, "rgba(190,240,255," + (0.42 * az) + ")");
    gz.addColorStop(0.7, "rgba(120,200,255," + (0.26 * az) + ")");
    gz.addColorStop(1, "rgba(90,170,255,0)");
    c.fillStyle = gz;
    c.beginPath(); c.ellipse(pz.x, pz.y, zc.r * RX, zc.r * RY, 0, 0, 6.2832); c.fill();
    c.strokeStyle = "rgba(220,250,255," + (0.6 * az) + ")"; c.lineWidth = 2.4;
    c.beginPath(); c.ellipse(pz.x, pz.y, zc.r * RX, zc.r * RY, 0, 0, 6.2832); c.stroke();
    /* cristaux de givre */
    var alz = prng((zc.gx * 313 + zc.gy * 977) | 0);
    c.fillStyle = "rgba(230,250,255," + (0.5 * az) + ")";
    for(var q = 0; q < 18; q++){
      var aq = alz() * 6.2832, rq = Math.sqrt(alz()) * zc.r;
      var px2 = pz.x + Math.cos(aq) * rq * RX, py2 = pz.y + Math.sin(aq) * rq * RY;
      c.beginPath();
      c.moveTo(px2, py2 - 6); c.lineTo(px2 + 3, py2); c.lineTo(px2, py2 + 6); c.lineTo(px2 - 3, py2);
      c.closePath(); c.fill();
    }
    c.restore();
  }
  /* vague de feu */
  if(jeu.vague){
    var q2 = iso(jeu.qg.gx, jeu.qg.gy);
    var rv = jeu.vague.r;
    c.save();
    c.globalCompositeOperation = "lighter";
    c.strokeStyle = "rgba(255,150,40,.85)";
    c.lineWidth = 16;
    c.beginPath(); c.ellipse(q2.x, q2.y, rv * RX, rv * RY, 0, 0, 6.2832); c.stroke();
    c.strokeStyle = "rgba(255,240,190,.9)"; c.lineWidth = 5;
    c.beginPath(); c.ellipse(q2.x, q2.y, rv * RX, rv * RY, 0, 0, 6.2832); c.stroke();
    c.restore();
  }
  /* anneau de télégraphe */
  if(jeu.qgTelegraphe > 0){
    var q3 = iso(jeu.qg.gx, jeu.qg.gy);
    var tt = 1 - jeu.qgTelegraphe / EQ.QG_TELEGRAPHE;
    var rr = 3 + tt * (jeu.qgForme === 0 ? EQ.QG_PLUIE_RAYON : EQ.QG_VAGUE_PORTEE);
    c.save();
    c.strokeStyle = "rgba(255,70,30," + (0.35 + 0.45 * Math.sin(tt * 22)) + ")";
    c.lineWidth = 6;
    c.beginPath(); c.ellipse(q3.x, q3.y, rr * RX, rr * RY, 0, 0, 6.2832); c.stroke();
    c.restore();
  }
  /* point de ralliement */
  if(jeu.balise){
    var pf = iso(jeu.balise.gx, jeu.balise.gy);
    c.save();
    c.globalCompositeOperation = "lighter";
    var gf = c.createRadialGradient(pf.x, pf.y, 2, pf.x, pf.y, 90);
    gf.addColorStop(0, "rgba(255,230,140,.5)");
    gf.addColorStop(1, "rgba(255,180,60,0)");
    c.fillStyle = gf;
    c.beginPath(); c.ellipse(pf.x, pf.y, 90, 45, 0, 0, 6.2832); c.fill();
    c.restore();
    c.strokeStyle = "rgba(255,210,110,.75)"; c.lineWidth = 2.4;
    var rp = 26 + Math.sin(tps * 3) * 6;
    c.beginPath(); c.ellipse(pf.x, pf.y, rp, rp / 2, 0, 0, 6.2832); c.stroke();
  }
}

/* Nuage de fumigène — volumétrique, dans le tri de profondeur */
function dessineBrouillard(c, f, tps){
  var p = versEcran(cam, f.gx, f.gy);
  var z = cam.z;
  var a = Math.min(1, f.age * 3) * Math.min(1, (f.duree - f.age) / 1.2);
  c.save();
  c.globalAlpha = 0.72 * a;
  for(var i = 0; i < 12; i++){
    var ang = i / 12 * 6.2832 + tps * 0.25;
    var rr = f.r * (0.35 + (i % 3) * 0.25);
    var pp = versEcran(cam, f.gx + Math.cos(ang) * rr, f.gy + Math.sin(ang) * rr * 0.9);
    bouffee(c, pp.x, pp.y - (14 + (i % 4) * 7) * z + Math.sin(tps * 1.4 + i) * 3 * z,
            (11 + (i % 3) * 5) * z, 0.5, i % 2 ? "#8e8894" : "#a9a3ae");
  }
  bouffee(c, p.x, p.y - 20 * z, 26 * z, 0.55, "#9a94a2");
  c.restore();
}

/* La fusée éclairante elle-même, avec son décompte */
function dessineFusee(c, tps){
  var f = jeu.balise;
  var p = versEcran(cam, f.gx, f.gy);
  var z = cam.z;
  c.save();
  c.globalCompositeOperation = "lighter";
  var osc = Math.sin(tps * 4) * 3;
  var y = p.y - 46 * z + osc * z;
  var g = c.createRadialGradient(p.x, y, 0, p.x, y, 26 * z);
  g.addColorStop(0, "rgba(255,255,230,.95)");
  g.addColorStop(0.35, "rgba(255,200,90,.7)");
  g.addColorStop(1, "rgba(255,140,30,0)");
  c.fillStyle = g;
  c.beginPath(); c.arc(p.x, y, 26 * z, 0, 6.2832); c.fill();
  c.restore();
  /* petit parachute */
  c.strokeStyle = "rgba(240,230,210,.8)"; c.lineWidth = 1.2 * z;
  c.beginPath(); c.arc(p.x, p.y - 60 * z, 9 * z, Math.PI, 0); c.stroke();
  c.beginPath(); c.moveTo(p.x - 9 * z, p.y - 60 * z); c.lineTo(p.x, p.y - 48 * z);
  c.lineTo(p.x + 9 * z, p.y - 60 * z); c.stroke();
  texteCerne(c, Math.ceil(f.reste) + " s", p.x, p.y - 76 * z, Math.max(10, 13 * z), "#ffe9a0");
}

/* ---------------------------------------------------------------
   Visée d'une capacité
   --------------------------------------------------------------- */
var viseur = { actif:false, x:0, y:0 };
function dessineVisee(c, tps){
  var m = jeu.capArmee;
  if(!m) return;
  var vue = rectVisible(60);
  /* cercles de portée de toutes les défenses */
  c.save();
  repereMonde(c);
  c.setLineDash([7, 6]);
  c.lineWidth = 1.4 / cam.z;
  for(var i = 0; i < jeu.batiments.length; i++){
    var b = jeu.batiments[i];
    if(!b.vivant || !DEF[b.t].portee) continue;
    if(!visible(vue, b.gx, b.gy)) continue;
    var p = iso(b.gx, b.gy);
    c.strokeStyle = "rgba(255,90,60,.30)";
    c.beginPath(); c.ellipse(p.x, p.y, DEF[b.t].portee * RX, DEF[b.t].portee * RY, 0, 0, 6.2832); c.stroke();
  }
  c.setLineDash([]);
  c.restore();
  repereEcran(c);

  if(!viseur.actif) return;
  var w = versMonde(cam, viseur.x, viseur.y);
  var r = m === "viper" ? CAP.viper.rayon : m === "salve" ? CAP.salve.rayon
        : m === "brouillard" ? CAP.brouillard.rayon : m === "soin" ? CAP.soin.rayon : 1.2;
  var pe = versEcran(cam, w.gx, w.gy);
  var coul = m === "soin" ? "#6ee08a" : m === "brouillard" ? "#c9c4d2" : m === "balise" ? "#ffd070" : "#ff8a1e";
  c.save();
  c.globalAlpha = 0.85;
  c.strokeStyle = coul; c.lineWidth = 2.2;
  c.beginPath(); c.ellipse(pe.x, pe.y, r * RX * cam.z, r * RY * cam.z, 0, 0, 6.2832); c.stroke();
  c.globalAlpha = 0.18;
  c.fillStyle = coul;
  c.beginPath(); c.ellipse(pe.x, pe.y, r * RX * cam.z, r * RY * cam.z, 0, 0, 6.2832); c.fill();
  c.globalAlpha = 0.9;
  c.strokeStyle = coul; c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(pe.x - 14, pe.y); c.lineTo(pe.x + 14, pe.y);
  c.moveTo(pe.x, pe.y - 8); c.lineTo(pe.x, pe.y + 8);
  c.stroke();
  c.restore();

}

/* ---------------------------------------------------------------
   Boucle de rendu
   --------------------------------------------------------------- */
function rendu(tps, dt){
  secX = 0; secY = 0;
  if(jeu.secousse > 0){
    secX = (Math.random() - 0.5) * jeu.secousse;
    secY = (Math.random() - 0.5) * jeu.secousse;
  }
  repereEcran(ctx);
  ctx.clearRect(-40, -40, W + 80, H + 80);

  var vue = rectVisible(0);

  /* ---- mer et terrain, dans le repère du monde ---- */
  repereMonde(ctx);
  var mer = coteVisible(vue);
  if(mer) dessineEau(ctx, tps, vue);
  dessineSol(ctx, vue);
  if(mer){ dessineEcume(ctx, tps); dessineRessac(ctx, tps); }
  dessineZonesSol(ctx, tps);
  repereEcran(ctx);

  /* ---- entités triées en profondeur ---- */
  pile.length = 0;
  var i;
  var vueL = rectVisible(0);
  /* décor : rochers, falaises et végétation, dans le tri de profondeur */
  decorVisible(vueL, pile);
  for(i = 0; i < jeu.batiments.length; i++){
    var b = jeu.batiments[i];
    if(!b.vivant) continue;
    if(!visible(vueL, b.gx, b.gy)) continue;
    pile.push({ d:b.gx + b.gy, k:0, o:b });
  }
  for(i = 0; i < jeu.unites.length; i++){
    var u = jeu.unites[i];
    if(!visible(vueL, u.gx, u.gy)) continue;
    pile.push({ d:u.gx + u.gy, k:1, o:u });
  }
  for(i = 0; i < jeu.poulets.length; i++){
    var pl = jeu.poulets[i];
    if(!visible(vueL, pl.gx, pl.gy)) continue;
    pile.push({ d:pl.gx + pl.gy, k:10, o:pl });
  }
  for(i = 0; i < jeu.creatures.length; i++){
    var k2 = jeu.creatures[i];
    if(k2.pv <= 0) continue;
    if(!visible(vueL, k2.gx, k2.gy)) continue;
    pile.push({ d:k2.gx + k2.gy, k:2, o:k2 });
  }
  /* unités grises des autres joueurs */
  for(var idj in autresJoueurs){
    var j = autresJoueurs[idj];
    for(var q = 0; q < j.unites.length; q++){
      var g = j.unites[q];
      if(!visible(vueL, g.gx, g.gy)) continue;
      pile.push({ d:g.gx + g.gy, k:3, o:g });
    }
    if(j.fantome && visible(vueL, j.fantome.gx, j.fantome.gy))
      pile.push({ d:j.fantome.gx + j.fantome.gy, k:4, o:j.fantome });
  }
  if(jeu.fantome) pile.push({ d:jeu.fantome.gx + jeu.fantome.gy, k:4, o:jeu.fantome });
  for(i = 0; i < jeu.projectiles.length; i++){
    var pr = jeu.projectiles[i];
    if(!visible(vueL, pr.gx, pr.gy)) continue;
    pile.push({ d:pr.gx + pr.gy + 0.3, k:5, o:pr });
  }
  for(i = 0; i < jeu.effets.length; i++){
    var ef = jeu.effets[i];
    if(!visible(vueL, ef.gx, ef.gy)) continue;
    pile.push({ d:ef.gx + ef.gy + 0.2, k:6, o:ef });
  }
  for(i = 0; i < jeu.brouillards.length; i++){
    pile.push({ d:jeu.brouillards[i].gx + jeu.brouillards[i].gy + 0.4, k:7, o:jeu.brouillards[i] });
  }
  pile.push({ d:jeu.qg.gx + jeu.qg.gy, k:8, o:jeu.qg });

  pile.sort(function(a, b2){ return a.d - b2.d; });
  for(i = 0; i < pile.length; i++){
    var it = pile[i];
    switch(it.k){
      case 0: dessineBatiment(ctx, it.o, tps, cam.z); break;
      case 1: dessineUniteMonde(ctx, it.o, tps); break;
      case 2: dessineCreature(ctx, it.o, tps); break;
      case 3: dessineUniteGrise(ctx, it.o); break;
      case 4: dessineFantome(ctx, it.o, tps); break;
      case 5: dessineProjectile(ctx, it.o, tps); break;
      case 6: dessineEffet(ctx, it.o, tps); break;
      case 7: dessineBrouillard(ctx, it.o, tps); break;
      case 8: dessineQG(ctx, tps); break;
      case 9: dessineDecorMonde(ctx, it); break;
      case 10: dessinePouletMonde(ctx, it.o, tps); break;
    }
  }
  if(jeu.balise) dessineFusee(ctx, tps);

  /* étiquettes des autres joueurs */
  for(var idj2 in autresJoueurs){
    var j2 = autresJoueurs[idj2];
    if(!j2.unites.length) continue;
    var mx = 0, my = 0;
    for(var m = 0; m < j2.unites.length; m++){ mx += j2.unites[m].gx; my += j2.unites[m].gy; }
    mx /= j2.unites.length; my /= j2.unites.length;
    if(!visible(vueL, mx, my)) continue;
    var pe = versEcran(cam, mx, my);
    texteCerne(ctx, j2.nom + " · " + j2.n, pe.x, pe.y - 62 * cam.z,
               Math.max(10, 12 * cam.z), "#c9c2ce");
  }

  /* visée */
  repereEcran(ctx);
  dessineVisee(ctx, tps);

  /* Gégé la belette */
  if(jeu.messageGege > 0) dessineGege(ctx, tps);

  /* séquence finale */
  if(jeu.fin) dessineFin(ctx, tps);

  /* minicarte */
  majMinicarte(tps);
}

/* ---------------------------------------------------------------
   « Oh non, vous avez tué Gégé la belette ! »
   --------------------------------------------------------------- */
function dessineGege(c, tps){
  var t = 1 - jeu.messageGege / 3;                 // 0 → 1 sur les trois secondes
  repereEcran(c);
  /* voile sombre qui s'estompe */
  c.fillStyle = "rgba(10,4,14," + (0.45 * Math.min(1, (1 - t) * 2.2)) + ")";
  c.fillRect(0, 0, W, H);
  /* rebond élastique à l'entrée, fuite vers le haut à la sortie */
  var ent = Math.min(1, t / 0.22);
  var ela = 1 + Math.sin(ent * 9) * Math.exp(-ent * 4) * 0.6;
  var sortie = t > 0.86 ? (t - 0.86) / 0.14 : 0;
  var alpha = 1 - sortie;
  c.save();
  c.globalAlpha = alpha;
  c.translate(W / 2, H * 0.44 - sortie * 60);
  c.scale(ela, ela);
  c.rotate(Math.sin(tps * 7) * 0.022);
  var taille = Math.min(W * 0.088, H * 0.13);
  c.font = "900 " + taille + "px 'Trebuchet MS', 'Segoe UI', sans-serif";
  c.textAlign = "center"; c.textBaseline = "middle";
  c.lineJoin = "round";
  /* halo */
  c.save();
  c.globalCompositeOperation = "lighter";
  var g0 = c.createRadialGradient(0, 0, 10, 0, 0, taille * 6);
  g0.addColorStop(0, "rgba(255,140,60,.35)");
  g0.addColorStop(1, "rgba(255,90,20,0)");
  c.fillStyle = g0;
  c.beginPath(); c.arc(0, 0, taille * 6, 0, 6.2832); c.fill();
  c.restore();
  var lignes = ["Oh non, vous avez tué", "Gégé la belette !"];
  for(var i = 0; i < 2; i++){
    var y = (i - 0.5) * taille * 1.15;
    c.lineWidth = taille * 0.24; c.strokeStyle = "#160702";
    c.strokeText(lignes[i], 0, y);
    var g = c.createLinearGradient(0, y - taille * 0.55, 0, y + taille * 0.55);
    g.addColorStop(0, "#fff0c8"); g.addColorStop(0.5, "#ffb03a"); g.addColorStop(1, "#d8401a");
    c.fillStyle = g;
    c.fillText(lignes[i], 0, y);
  }
  /* petite belette fantôme qui monte au ciel */
  c.save();
  c.translate(0, taille * 1.5 - t * taille * 1.6);
  c.globalAlpha = alpha * 0.9;
  c.scale(1.5, 1.5);
  dessineBelette(c, { phase:tps * 8, etat:"fuite" }, tps);
  c.restore();
  c.restore();
}

/* ---------------------------------------------------------------
   La séquence finale
   --------------------------------------------------------------- */
var COULEURS_CONFETTIS = ["#ff5a4a", "#ffd070", "#6ee08a", "#7de6ff", "#c98adf", "#ff8a1e"];
function dessineFin(c, tps){
  var F = jeu.fin;
  repereEcran(c);
  /* flash blanc */
  if(F.flash > 0){
    c.fillStyle = "rgba(255,255,255," + Math.min(1, F.flash) + ")";
    c.fillRect(0, 0, W, H);
  }
  /* la tête qui décolle */
  if(F.tete && F.tete.age < 3){
    var p = versEcran(cam, jeu.qg.gx, jeu.qg.gy);
    var x = p.x, y = p.y + Y_TETE * cam.z + F.tete.y * cam.z;
    /* traînée de fumée en boules */
    for(var i = 0; i < 14; i++){
      var t = i / 14;
      bouffee(c, x + Math.sin(t * 9 + F.tete.age * 4) * 12 * t,
              y + t * 190 * cam.z, (5 + t * 22) * cam.z, (1 - t) * 0.4, "#6a6068");
    }
    c.save();
    c.translate(x, y);
    c.rotate(F.tete.rot);
    var eg = ECH_GARD * 0.55 * cam.z;
    c.scale(eg, eg);
    /* la gardienne, en version qui louche */
    gardienne3D(c, 0, 0, 1, 1, tps);
    /* yeux barrés d'une croix + bouche de travers */
    c.save();
    c.strokeStyle = "#150f18"; c.lineWidth = 2.2; c.lineCap = "round";
    [VT_YEUX.g, VT_YEUX.d].forEach(function(o){
      c.beginPath(); c.moveTo(o[0] - 4, o[1] - 4); c.lineTo(o[0] + 4, o[1] + 4); c.stroke();
      c.beginPath(); c.moveTo(o[0] + 4, o[1] - 4); c.lineTo(o[0] - 4, o[1] + 4); c.stroke();
    });
    c.strokeStyle = "#8a3a34"; c.lineWidth = 2.6;
    c.beginPath(); c.moveTo(-7, 8); c.quadraticCurveTo(0, 14, 7, 5); c.stroke();
    c.restore();
    c.restore();
  }
  /* confettis */
  if(F.confettis){
    for(var k = 0; k < F.confettis.length; k++){
      var cf = F.confettis[k];
      c.save();
      c.translate(cf.x * W, cf.y * H);
      c.rotate(cf.rot);
      c.fillStyle = COULEURS_CONFETTIS[cf.c];
      c.fillRect(-cf.w / 2, -cf.w / 4, cf.w, cf.w / 2);
      c.restore();
    }
  }
  /* MILY BOUM ! avec rebond élastique */
  if(F.age >= 2.4){
    var tt = Math.min(1, (F.age - 2.4) / 0.75);
    var ela = 1 + Math.sin(tt * 9) * Math.exp(-tt * 4) * 0.55;
    var osc = Math.sin(F.age * 3) * 0.035;
    c.save();
    c.translate(W / 2, H * 0.42);
    c.scale(ela, ela);
    c.rotate(osc);
    var taille = Math.min(W, H) * 0.155;
    c.font = "900 " + taille + "px 'Trebuchet MS', 'Segoe UI', sans-serif";
    c.textAlign = "center"; c.textBaseline = "middle";
    c.lineJoin = "round"; c.lineWidth = taille * 0.22;
    c.strokeStyle = "#180a04";
    c.strokeText("MILY BOUM !", 0, 0);
    var g = c.createLinearGradient(0, -taille * 0.6, 0, taille * 0.6);
    g.addColorStop(0, "#ffe6a8"); g.addColorStop(0.5, "#ff8a1e"); g.addColorStop(1, "#e0431a");
    c.fillStyle = g;
    c.fillText("MILY BOUM !", 0, 0);
    c.font = "700 " + (taille * 0.26) + "px 'Trebuchet MS', sans-serif";
    c.lineWidth = taille * 0.07;
    c.strokeText("la gardienne a décollé", 0, taille * 0.68);
    c.fillStyle = "#ffd9a8";
    c.fillText("la gardienne a décollé", 0, taille * 0.68);
    c.restore();
  }
}

/* ---------------------------------------------------------------
   Minicarte
   --------------------------------------------------------------- */
function construitFondMini(){
  var w = 264, h = 236;
  miniFond = nouveauCanvas(w, h);
  var c = miniFond.getContext("2d");
  var b = BIOMES[carte.biome];
  c.fillStyle = "#0d2634"; c.fillRect(0, 0, w, h);
  c.fillStyle = b.sol2; c.fillRect(2, 2, w - 4, h - 4);
  c.fillStyle = "#e3cd9c";
  c.fillRect(2 + (PLAGE_X0 / GW) * (w - 4), 2, (1 - PLAGE_X0 / GW) * (w - 4), h - 4);
  redessineFondMini();
}
function redessineFondMini(){
  if(!miniFond) return;
  var c = miniFond.getContext("2d");
  var w = miniFond.width, h = miniFond.height;
  var b = BIOMES[carte.biome];
  c.fillStyle = "#0d2634"; c.fillRect(0, 0, w, h);
  c.fillStyle = b.sol2; c.fillRect(2, 2, w - 4, h - 4);
  c.fillStyle = "#e3cd9c";
  c.fillRect(2 + (PLAGE_X0 / GW) * (w - 4), 2, (1 - PLAGE_X0 / GW) * (w - 4), h - 4);
  for(var i = 0; i < jeu.batiments.length; i++){
    var bt = jeu.batiments[i];
    if(!bt.vivant) continue;
    c.fillStyle = DEF[bt.t].portee ? "#c0453a" : "#7a6a52";
    c.fillRect(2 + bt.gx / GW * (w - 4) - 1.5, 2 + bt.gy / GH * (h - 4) - 1.5, 3, 3);
  }
}
function majMinicarte(tps){
  if(!miniCtx || !miniFond) return;
  if(tps > miniProchain){ miniProchain = tps + 0.7; redessineFondMini(); }
  var w = miniCv.width, h = miniCv.height;
  miniCtx.clearRect(0, 0, w, h);
  miniCtx.drawImage(miniFond, 0, 0, w, h);
  function px(gx, gy){ return { x:2 + gx / GW * (w - 4), y:2 + gy / GH * (h - 4) }; }
  /* QG */
  var q = px(jeu.qg.gx, jeu.qg.gy);
  miniCtx.fillStyle = "#ff8a1e";
  miniCtx.beginPath(); miniCtx.arc(q.x, q.y, 6, 0, 6.2832); miniCtx.fill();
  miniCtx.strokeStyle = "#ffe0a0"; miniCtx.lineWidth = 1.6;
  miniCtx.beginPath(); miniCtx.arc(q.x, q.y, 8 + Math.sin(tps * 3) * 1.6, 0, 6.2832); miniCtx.stroke();
  /* unités */
  miniCtx.fillStyle = "#7de6ff";
  for(var i = 0; i < jeu.unites.length; i++){
    var p = px(jeu.unites[i].gx, jeu.unites[i].gy);
    miniCtx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
  }
  miniCtx.fillStyle = "#b9b2c0";
  for(var id in autresJoueurs){
    var j = autresJoueurs[id];
    for(var k = 0; k < j.unites.length; k++){
      var p2 = px(j.unites[k].gx, j.unites[k].gy);
      miniCtx.fillRect(p2.x - 1.5, p2.y - 1.5, 3, 3);
    }
  }
  /* rectangle de vue */
  var v = rectVisible(0);
  var a = deIso(v.x0, v.y0), b2 = deIso(v.x1, v.y0), c2 = deIso(v.x1, v.y1), d2 = deIso(v.x0, v.y1);
  miniCtx.strokeStyle = "rgba(255,255,255,.7)"; miniCtx.lineWidth = 1.4;
  miniCtx.beginPath();
  [a, b2, c2, d2].forEach(function(pt, n){
    var e = px(borne(pt.gx, 0, GW), borne(pt.gy, 0, GH));
    if(n === 0) miniCtx.moveTo(e.x, e.y); else miniCtx.lineTo(e.x, e.y);
  });
  miniCtx.closePath(); miniCtx.stroke();
}
