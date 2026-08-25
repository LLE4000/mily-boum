/* ================================================================
   TERRAIN : sol pré-calculé, eau vivante, falaises, décors, faune
   ================================================================ */

var BIOMES = {
  plage: {
    sol1:"#e9d7a8", sol2:"#e3cf9c", sable:"#ecdcb2", sableO:"#c9ab74",
    herbe:"#c2c079", allee:"#f3e9cc", roche:"#8a8290",
    eauC:"#63e0dc", eau:"#1fa9b8", eauO:"#0d6b82", ecume:"#eafcff",
    fond:"#57cfcb", basFond:"#a9e8dc", ciel:"#0d3a48"
  },
  foret: {
    sol1:"#5d7c3d", sol2:"#4e6b32", sable:"#d8caa0", sableO:"#a89568",
    herbe:"#3f5a28", allee:"#7d6b43", roche:"#6e6a74",
    eauC:"#7fd0e8", eau:"#2a7fa8", eauO:"#134a68", ecume:"#eaf7ff",
    fond:"#4a9cbe", basFond:"#8fd2df", ciel:"#0b2a3a"
  },
  campagne: {
    sol1:"#bb9e60", sol2:"#aa8d51", sable:"#dcc894", sableO:"#ab8f5c",
    herbe:"#8f9a52", allee:"#dcc890", roche:"#7a7480",
    eauC:"#86c6e8", eau:"#2f76a6", eauO:"#154566", ecume:"#f0f8ff",
    fond:"#4a92bc", basFond:"#96cfe2", ciel:"#0c2836"
  }
};

var solCv = null, solCtx = null, solInfo = null;
var eauMotif1 = null, eauMotif2 = null;
var cheminIle = null;
var CENTRE_X = 0, CENTRE_Y = 0;

/* ================================================================
   FALAISES — les trois bords fermés
   ================================================================ */
function dessineFalaise(c, f){
  var b = BIOMES[carte.biome];
  var p = iso(f.gx, f.gy);
  var n = 6, pts = [], i;
  for(i = 0; i < n; i++){
    var a = f.s + i / n * 6.2832;
    var rr = f.r * (0.78 + ((Math.sin(a * 2.7 + f.s * 3) + 1) / 2) * 0.44);
    pts.push({ x:p.x + Math.cos(a) * rr * RX, y:p.y + Math.sin(a) * rr * RY });
  }
  var h = f.h;
  var base = ["#6f6878", "#7c7484", "#615a6c"][f.v % 3];
  /* corps de la falaise, en dégradé du bas sombre vers le haut clair */
  var g = c.createLinearGradient(0, p.y - h, 0, p.y + 6);
  g.addColorStop(0, ecl(base, 0.92));
  g.addColorStop(0.45, ecl(base, 0.60));
  g.addColorStop(1, ecl(base, 0.32));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y);
  for(i = 1; i < n; i++) c.lineTo(pts[i].x, pts[i].y);
  for(i = n - 1; i >= 0; i--) c.lineTo(pts[i].x, pts[i].y - h);
  c.closePath(); c.fill();
  /* strates */
  c.save();
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y);
  for(i = 1; i < n; i++) c.lineTo(pts[i].x, pts[i].y);
  for(i = n - 1; i >= 0; i--) c.lineTo(pts[i].x, pts[i].y - h);
  c.closePath(); c.clip();
  c.strokeStyle = "rgba(20,14,26,.22)"; c.lineWidth = 1.4;
  for(var s = 1; s < 7; s++){
    var yy = p.y - h * s / 7 + Math.sin(f.s + s) * 3;
    c.beginPath();
    c.moveTo(p.x - f.r * RX * 1.2, yy);
    c.lineTo(p.x + f.r * RX * 1.2, yy + 3);
    c.stroke();
  }
  /* fissures */
  c.strokeStyle = "rgba(14,10,18,.30)"; c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(p.x - f.r * 6, p.y - h * 0.85);
  c.lineTo(p.x - f.r * 2, p.y - h * 0.5);
  c.lineTo(p.x - f.r * 7, p.y - h * 0.12);
  c.stroke();
  c.restore();
  /* dessus facetté */
  c.fillStyle = ecl(base, 1.06);
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y - h);
  for(i = 1; i < n; i++) c.lineTo(pts[i].x, pts[i].y - h);
  c.closePath(); c.fill();
  /* pointe éclairée */
  c.fillStyle = ecl(base, 1.35);
  c.beginPath();
  c.moveTo(p.x - f.r * 3, p.y - h - f.r * 7);
  c.lineTo(pts[n - 1].x, pts[n - 1].y - h);
  c.lineTo(pts[0].x, pts[0].y - h);
  c.lineTo(pts[1].x, pts[1].y - h);
  c.closePath(); c.fill();
  /* liseré */
  c.strokeStyle = "rgba(255,250,240,.26)"; c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(pts[n - 1].x, pts[n - 1].y - h);
  c.lineTo(pts[0].x, pts[0].y - h);
  c.lineTo(pts[1].x, pts[1].y - h);
  c.stroke();
  /* végétation ou mousse au pied */
  if(f.v % 3 === 0){
    c.fillStyle = carte.biome === "plage" ? "rgba(90,140,70,.45)" : "rgba(60,100,50,.5)";
    c.beginPath();
    c.ellipse(p.x - f.r * 5, p.y - h * 0.05, f.r * 9, f.r * 4, 0, 0, 6.2832);
    c.fill();
  }
}

/* ---------------- Rochers isolés ---------------- */
function dessineRocher(c, gx, gy, r, s, v){
  var gris = ["#6d6a75", "#7a7480", "#5f5c68"][v % 3];
  var p = iso(gx, gy);
  ombreRonde(c, gx, gy, r * 1.15, 0.26);
  var n = 5, pts = [], i;
  for(i = 0; i < n; i++){
    var a = s + i / n * 6.2832;
    var rr = r * (0.72 + ((Math.sin(a * 3.1 + s * 5) + 1) / 2) * 0.5);
    pts.push({ x:p.x + Math.cos(a) * rr * RX, y:p.y + Math.sin(a) * rr * RY });
  }
  var h = r * 26;
  c.fillStyle = ecl(gris, 0.62);
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y);
  for(i = 1; i < n; i++) c.lineTo(pts[i].x, pts[i].y);
  for(i = n - 1; i >= 0; i--) c.lineTo(pts[i].x, pts[i].y - h);
  c.closePath(); c.fill();
  c.fillStyle = gris;
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y - h);
  for(i = 1; i < n; i++) c.lineTo(pts[i].x, pts[i].y - h);
  c.closePath(); c.fill();
  c.fillStyle = ecl(gris, 1.22);
  c.beginPath();
  c.moveTo(p.x, p.y - h - r * 5);
  c.lineTo(pts[0].x, pts[0].y - h);
  c.lineTo(pts[1].x, pts[1].y - h);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(255,250,240,.22)"; c.lineWidth = 1;
  c.beginPath(); c.moveTo(pts[n - 1].x, pts[n - 1].y - h); c.lineTo(pts[0].x, pts[0].y - h); c.stroke();
}

/* ================================================================
   DÉCORS
   ================================================================ */
function palmier(c, gx, gy, s){
  var p = iso(gx, gy);
  ombreRonde(c, gx, gy, 0.5 * s, 0.2);
  var h = 46 * s;
  c.strokeStyle = "#7a5c3a"; c.lineWidth = 4.6 * s; c.lineCap = "round";
  c.beginPath(); c.moveTo(p.x, p.y); c.quadraticCurveTo(p.x - 5 * s, p.y - h * 0.6, p.x - 9 * s, p.y - h); c.stroke();
  c.strokeStyle = "#a5825a"; c.lineWidth = 2.4 * s;
  c.beginPath(); c.moveTo(p.x - 1 * s, p.y - 2); c.quadraticCurveTo(p.x - 6 * s, p.y - h * 0.6, p.x - 9.8 * s, p.y - h); c.stroke();
  /* anneaux du tronc */
  c.strokeStyle = "rgba(60,40,20,.35)"; c.lineWidth = 1 * s;
  for(var k = 1; k < 6; k++){
    var t = k / 6;
    var tx = p.x - 9 * s * t * t, ty = p.y - h * t;
    c.beginPath(); c.moveTo(tx - 2.4 * s, ty); c.lineTo(tx + 2.4 * s, ty + 0.6 * s); c.stroke();
  }
  var tx2 = p.x - 9 * s, ty2 = p.y - h;
  for(var i = 0; i < 7; i++){
    var a = -Math.PI - 0.2 + i / 6 * (Math.PI + 0.4);
    var ex = tx2 + Math.cos(a) * 22 * s, ey = ty2 + Math.sin(a) * 10 * s + 6 * s;
    var gg = c.createLinearGradient(tx2, ty2, ex, ey);
    gg.addColorStop(0, "#3f9a58"); gg.addColorStop(1, i % 2 ? "#25603a" : "#317a48");
    c.strokeStyle = gg;
    c.lineWidth = 4.2 * s;
    c.beginPath(); c.moveTo(tx2, ty2);
    c.quadraticCurveTo((tx2 + ex) / 2, ty2 - 13 * s, ex, ey); c.stroke();
    c.strokeStyle = "rgba(180,240,180,.25)"; c.lineWidth = 1.2 * s;
    c.beginPath(); c.moveTo(tx2, ty2);
    c.quadraticCurveTo((tx2 + ex) / 2, ty2 - 14 * s, ex, ey); c.stroke();
  }
  c.fillStyle = "#c8892f";
  c.beginPath(); c.arc(tx2 + 1 * s, ty2 + 3 * s, 2.6 * s, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(tx2 + 4 * s, ty2 + 4.5 * s, 2.2 * s, 0, 6.2832); c.fill();
}
function sapin(c, gx, gy, s){
  var p = iso(gx, gy);
  ombreRonde(c, gx, gy, 0.55 * s, 0.24);
  c.fillStyle = "#5a4126";
  c.fillRect(p.x - 2 * s, p.y - 10 * s, 4 * s, 10 * s);
  for(var i = 0; i < 4; i++){
    var y = p.y - 6 * s - i * 12 * s;
    var w = (20 - i * 3.6) * s;
    var g = c.createLinearGradient(p.x - w, 0, p.x + w, 0);
    g.addColorStop(0, ["#3a6a3a", "#427a42", "#4a8a46", "#549a4e"][i]);
    g.addColorStop(0.5, ["#274d28", "#2e5c2e", "#356a34", "#3d7a3a"][i]);
    g.addColorStop(1, ["#1c3a1e", "#234522", "#285028", "#2f5c2c"][i]);
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(p.x, y - 20 * s); c.lineTo(p.x + w, y); c.lineTo(p.x - w, y);
    c.closePath(); c.fill();
  }
}
function meule(c, gx, gy, s){
  var p = iso(gx, gy);
  ombreRonde(c, gx, gy, 0.62 * s, 0.24);
  cylindre(c, gx, gy, 0.5 * s, 0, 16 * s, "#d8b45e", "#b3903f");
  c.strokeStyle = "rgba(120,88,30,.5)"; c.lineWidth = 1;
  for(var i = 0; i < 5; i++){
    var y = p.y - 3 - i * 3.2 * s;
    c.beginPath(); c.ellipse(p.x, y, 0.5 * s * RX * 0.96, 0.5 * s * RY * 0.96, 0, 0.2, Math.PI - 0.2); c.stroke();
  }
  cone3d(c, gx, gy, 0.52 * s, 16 * s, 12 * s, "#e6c674", "#c19a45");
}
function buisson(c, gx, gy, s, coul){
  var p = iso(gx, gy);
  ombreRonde(c, gx, gy, 0.38 * s, 0.2);
  for(var i = 0; i < 4; i++){
    var a = i / 4 * 6.2832 + s;
    c.fillStyle = i === 0 ? ecl(coul, 1.25) : ecl(coul, 1 - i * 0.08);
    c.beginPath();
    c.ellipse(p.x + Math.cos(a) * 5 * s, p.y - 4 * s + Math.sin(a) * 2.5 * s, 6.5 * s, 5 * s, 0, 0, 6.2832);
    c.fill();
  }
}
function clotureBout(c, gx, gy, s){
  var p = iso(gx, gy);
  c.strokeStyle = "#7a5c38"; c.lineWidth = 2.4 * s; c.lineCap = "round";
  c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x, p.y - 13 * s); c.stroke();
  c.beginPath(); c.moveTo(p.x - 10 * s, p.y - 9 * s); c.lineTo(p.x + 10 * s, p.y - 11 * s); c.stroke();
}
function dessineDecor(c, biome, d){
  if(biome === "plage"){
    if(d.v === 0) palmier(c, d.gx, d.gy, d.s);
    else if(d.v === 1) buisson(c, d.gx, d.gy, d.s, "#3d9152");
    else if(d.v === 2) buisson(c, d.gx, d.gy, d.s * 0.7, "#c9b579");
    else {
      var p = iso(d.gx, d.gy);
      c.fillStyle = "#f6efe2";
      c.beginPath(); c.ellipse(p.x, p.y - 1, 4.5 * d.s, 2.6 * d.s, 0.4, 0, 6.2832); c.fill();
      c.strokeStyle = "rgba(190,160,130,.7)"; c.lineWidth = 0.7;
      for(var k = -2; k <= 2; k++){
        c.beginPath(); c.moveTo(p.x, p.y - 1); c.lineTo(p.x + k * 1.6, p.y + 1.4); c.stroke();
      }
    }
  }else if(biome === "foret"){
    if(d.v <= 1) sapin(c, d.gx, d.gy, d.s);
    else if(d.v === 2) buisson(c, d.gx, d.gy, d.s, "#2f6b34");
    else cylindre(c, d.gx, d.gy, 0.24 * d.s, 0, 6 * d.s, "#8a6a44", "#5a4126");
  }else{
    if(d.v === 0) meule(c, d.gx, d.gy, d.s);
    else if(d.v === 1) buisson(c, d.gx, d.gy, d.s * 0.8, "#7d8a46");
    else if(d.v === 2) clotureBout(c, d.gx, d.gy, d.s);
    else {
      var q = iso(d.gx, d.gy);
      c.fillStyle = "rgba(90,70,40,.35)";
      c.beginPath(); c.ellipse(q.x, q.y, 9 * d.s, 4 * d.s, 0, 0, 6.2832); c.fill();
    }
  }
}

/* ================================================================
   L'EAU — motif raccordable, vagues fines et continues
   ================================================================ */
function construitMotifEau(b){
  function tuile(freq, angle, alpha, contraste){
    var N = 256;
    var cv = nouveauCanvas(N, N), c = cv.getContext("2d");
    var img = c.createImageData(N, N), d = img.data;
    var ca = Math.cos(angle), sa = Math.sin(angle);
    var cb = Math.cos(angle + 1.31), sb = Math.sin(angle + 1.31);
    var cc = Math.cos(angle - 0.72), sc = Math.sin(angle - 0.72);
    var creux = versRgb(b.eauO), moy = versRgb(b.eau), crete = versRgb(b.eauC);
    for(var y = 0; y < N; y++){
      for(var x = 0; x < N; x++){
        /* fréquences entières : la tuile se raccorde parfaitement */
        var u = (x * ca + y * sa) / N * 6.2832 * freq;
        var v = (x * cb + y * sb) / N * 6.2832 * (freq + 3);
        var w = (x * cc + y * sc) / N * 6.2832 * (freq + 7);
        var w2 = (x * sa - y * ca) / N * 6.2832 * (freq + 11);
        /* les crêtes se déforment les unes les autres : plus de réseau régulier */
        var hh = Math.sin(u + Math.sin(v) * 0.7) * 0.46
               + Math.sin(v + Math.sin(w) * 0.5) * 0.26
               + Math.sin(w) * 0.16 + Math.sin(w2) * 0.12;
        hh *= contraste;
        var t = (hh + 1) / 2;                       // 0 creux → 1 crête
        var r2, g2, b2;
        if(t < 0.5){
          var k = t * 2;
          r2 = creux[0] + (moy[0] - creux[0]) * k;
          g2 = creux[1] + (moy[1] - creux[1]) * k;
          b2 = creux[2] + (moy[2] - creux[2]) * k;
        }else{
          var k2 = (t - 0.5) * 2;
          k2 = k2 * k2;                             // les crêtes restent fines
          r2 = moy[0] + (crete[0] - moy[0]) * k2;
          g2 = moy[1] + (crete[1] - moy[1]) * k2;
          b2 = moy[2] + (crete[2] - moy[2]) * k2;
        }
        var o = (y * N + x) * 4;
        d[o] = r2; d[o + 1] = g2; d[o + 2] = b2;
        d[o + 3] = Math.round(alpha * 255);
      }
    }
    c.putImageData(img, 0, 0);
    return c.createPattern(cv, "repeat");
  }
  eauMotif1 = tuile(4, 0.37, 1, 1.0);
  eauMotif2 = tuile(7, 2.11, 0.42, 0.8);
}

/* ================================================================
   Contour de l'île
   ================================================================ */
function construitContourIle(){
  var m = 2.2;
  var pts = [], n = 46, i;
  function bord(gx, gy){ pts.push(iso(gx, gy)); }
  for(i = 0; i <= n; i++) bord(-m + (GW + 2 * m) * i / n, -m);
  for(i = 1; i <= n; i++) bord(GW + m, -m + (GH + 2 * m) * i / n);
  for(i = n - 1; i >= 0; i--) bord(-m + (GW + 2 * m) * i / n, GH + m);
  for(i = n - 1; i >= 1; i--) bord(-m, -m + (GH + 2 * m) * i / n);
  cheminIle = pts;
  CENTRE_X = (GW - GH) * TW / 4;
  CENTRE_Y = (GW + GH) * TH / 4;
}
function traceIle(c, dilat, ond, t, suite){
  if(!suite) c.beginPath();
  for(var i = 0; i < cheminIle.length; i++){
    var p = cheminIle[i];
    var d = dilat + (ond ? Math.sin(t * 2.1 + i * 0.35) * ond : 0);
    var vx = p.x - CENTRE_X, vy = (p.y - CENTRE_Y) * 2;
    var l = Math.hypot(vx, vy) || 1;
    var cx = p.x + vx / l * d, cy = p.y + vy / l * d * 0.5;
    if(i === 0) c.moveTo(cx, cy); else c.lineTo(cx, cy);
  }
  c.closePath();
}

/* ================================================================
   SOL PRÉ-CALCULÉ
   ================================================================ */
function construitSol(carteC){
  var b = BIOMES[carteC.biome];
  solInfo = tailleSolPrecalcule();
  if(!solCv || solCv.width !== solInfo.w || solCv.height !== solInfo.h){
    solCv = nouveauCanvas(solInfo.w, solInfo.h);
    solCtx = solCv.getContext("2d");
  }
  var c = solCtx;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, solCv.width, solCv.height);
  c.setTransform(SOL_ECH, 0, 0, SOL_ECH, -solInfo.x0 * SOL_ECH, -solInfo.y0 * SOL_ECH);

  var al = prng(carteC.graine ^ 0x5bd1);
  var i, j;

  /* --- masse de l'île --- */
  traceIle(c, 5, 0, 0);
  c.fillStyle = b.sable;
  c.fill();
  traceIle(c, 0, 0, 0);
  c.fillStyle = b.sol2;
  c.fill();

  /* --- damier très discret + variation de teinte --- */
  for(j = 0; j < GH; j++){
    for(i = 0; i < GW; i++){
      var plage = i >= PLAGE_X0;
      var lisiere = i >= PLAGE_X0 - 5 && i < PLAGE_X0;
      var base;
      if(plage) base = b.sable;
      else if(lisiere) base = melange(b.sol1, b.sable, (i - (PLAGE_X0 - 5)) / 5);
      else base = b.sol1;
      /* bruit doux à plusieurs échelles */
      var n1 = Math.sin(i * 0.31 + j * 0.19) + Math.sin(i * 0.11 - j * 0.43);
      var n2 = Math.sin(i * 1.7 + j * 2.3) * 0.4;
      var damier = ((i + j) & 1) ? 0.012 : -0.012;
      c.fillStyle = ecl(base, 1 + n1 * 0.028 + n2 * 0.02 + damier);
      var a = iso(i, j), e = iso(i + 1, j), f = iso(i + 1, j + 1), g = iso(i, j + 1);
      c.beginPath();
      c.moveTo(a.x, a.y); c.lineTo(e.x, e.y); c.lineTo(f.x, f.y); c.lineTo(g.x, g.y);
      c.closePath(); c.fill();
    }
  }

  /* --- grandes dunes / reliefs doux --- */
  c.save();
  traceIle(c, 0, 0, 0); c.clip();
  for(i = 0; i < 70; i++){
    var dx = al() * GW, dy = al() * GH;
    var p = iso(dx, dy);
    var rr = 120 + al() * 320;
    var clair = al() < 0.5;
    var gd = c.createRadialGradient(p.x, p.y, 4, p.x, p.y, rr);
    gd.addColorStop(0, clair ? "rgba(255,246,220,.14)" : "rgba(90,66,36,.13)");
    gd.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = gd;
    c.beginPath(); c.ellipse(p.x, p.y, rr, rr / 2, 0, 0, 6.2832); c.fill();
  }
  c.restore();

  /* --- allées du lattice militaire --- */
  c.save();
  c.globalAlpha = 0.22;
  c.fillStyle = b.allee;
  for(i = 3; i < PLAGE_X0; i += 5){
    var a1 = iso(i + 1.55, 0), a2 = iso(i + 2.45, 0), a3 = iso(i + 2.45, GH), a4 = iso(i + 1.55, GH);
    c.beginPath(); c.moveTo(a1.x, a1.y); c.lineTo(a2.x, a2.y); c.lineTo(a3.x, a3.y); c.lineTo(a4.x, a4.y);
    c.closePath(); c.fill();
  }
  for(j = 0; j < GH; j += 5){
    var b1 = iso(0, j + 1.55), b2 = iso(0, j + 2.45), b3 = iso(PLAGE_X0, j + 2.45), b4 = iso(PLAGE_X0, j + 1.55);
    c.beginPath(); c.moveTo(b1.x, b1.y); c.lineTo(b2.x, b2.y); c.lineTo(b3.x, b3.y); c.lineTo(b4.x, b4.y);
    c.closePath(); c.fill();
  }
  c.restore();

  /* --- textures propres au biome --- */
  if(carteC.biome === "campagne"){
    c.save(); c.globalAlpha = 0.16; c.strokeStyle = "#6d5527"; c.lineWidth = 2;
    for(j = 2; j < GH - 2; j += 0.9){
      var s1 = iso(2, j), s2 = iso(PLAGE_X0 - 2, j);
      c.beginPath(); c.moveTo(s1.x, s1.y); c.lineTo(s2.x, s2.y); c.stroke();
    }
    c.restore();
  }
  if(carteC.biome === "foret"){
    c.save(); c.globalAlpha = 0.18;
    for(i = 0; i < 1100; i++){
      var mx = al() * PLAGE_X0, my = al() * GH;
      var pp = iso(mx, my);
      c.fillStyle = al() < 0.5 ? "#39562a" : "#6f9046";
      c.beginPath(); c.ellipse(pp.x, pp.y, 14 + al() * 26, 7 + al() * 12, 0, 0, 6.2832); c.fill();
    }
    c.restore();
  }

  /* --- la plage : sable mouillé, rides de vent, coquillages --- */
  c.save();
  traceIle(c, 2, 0, 0); c.clip();
  /* bande de sable mouillé le long du rivage est */
  var gm = c.createLinearGradient(iso(GW - 6, 0).x, 0, iso(GW + 2, 0).x, 0);
  gm.addColorStop(0, "rgba(150,116,70,0)");
  gm.addColorStop(0.55, "rgba(150,116,70,.20)");
  gm.addColorStop(1, "rgba(110,86,54,.42)");
  c.fillStyle = gm;
  var w1 = iso(GW - 8, -3), w2 = iso(GW + 3, -3), w3 = iso(GW + 3, GH + 3), w4 = iso(GW - 8, GH + 3);
  c.beginPath(); c.moveTo(w1.x, w1.y); c.lineTo(w2.x, w2.y); c.lineTo(w3.x, w3.y); c.lineTo(w4.x, w4.y);
  c.closePath(); c.fill();
  /* rides de vent parallèles au rivage */
  c.strokeStyle = "rgba(255,246,222,.22)"; c.lineWidth = 1.6;
  for(i = 0; i < 90; i++){
    var rx = PLAGE_X0 - 3 + al() * 12, ry0 = al() * GH;
    var q1 = iso(rx, ry0), q2 = iso(rx + 0.2 + al() * 0.5, ry0 + 3 + al() * 5);
    c.beginPath();
    c.moveTo(q1.x, q1.y);
    c.quadraticCurveTo((q1.x + q2.x) / 2 + 8, (q1.y + q2.y) / 2, q2.x, q2.y);
    c.stroke();
  }
  /* grains, galets, algues */
  for(i = 0; i < 900; i++){
    var gx2 = PLAGE_X0 - 6 + al() * 14, gy2 = al() * GH;
    var pg = iso(gx2, gy2);
    var t2 = al();
    if(t2 < 0.62){
      c.fillStyle = "rgba(140,110,70,.30)";
      c.fillRect(pg.x, pg.y, 1.6, 1.2);
    }else if(t2 < 0.9){
      c.fillStyle = "rgba(255,250,236,.45)";
      c.beginPath(); c.ellipse(pg.x, pg.y, 1.8 + al() * 1.6, 1 + al(), al() * 3, 0, 6.2832); c.fill();
    }else{
      c.fillStyle = "rgba(70,100,60,.35)";
      c.beginPath(); c.ellipse(pg.x, pg.y, 5 + al() * 7, 2 + al() * 2, al() * 3, 0, 6.2832); c.fill();
    }
  }
  c.restore();

  /* --- lisière ombrée le long du rivage --- */
  c.save();
  traceIle(c, 3, 0, 0); c.clip();
  c.globalAlpha = 0.24;
  c.strokeStyle = "#6b5030"; c.lineWidth = 22;
  traceIle(c, 0, 0, 0); c.stroke();
  c.restore();

  /* --- décors, rochers et falaises, triés en profondeur --- */
  var objets = [];
  carteC.decors.forEach(function(d){ objets.push({ p:d.gx + d.gy, k:0, o:d }); });
  carteC.rochers.forEach(function(r){ objets.push({ p:r.gx + r.gy, k:1, o:r }); });
  (carteC.falaises || []).forEach(function(f){ objets.push({ p:f.gx + f.gy - f.h * 0.002, k:2, o:f }); });
  objets.sort(function(x, y){ return x.p - y.p; });
  for(var k = 0; k < objets.length; k++){
    var o = objets[k];
    if(o.k === 0) dessineDecor(c, carteC.biome, o.o);
    else if(o.k === 1) dessineRocher(c, o.o.gx, o.o.gy, o.o.r, o.o.s, o.o.v);
    else dessineFalaise(c, o.o);
  }

  /* --- marquage de la zone de débarquement --- */
  c.save();
  c.globalAlpha = 0.16; c.fillStyle = "#ffffff";
  for(j = 6; j < GH - 6; j += 3){
    var z1 = iso(PLAGE_X0 + 1.2, j), z2 = iso(PLAGE_X0 + 1.2, j + 1.6);
    var z3 = iso(GW - 0.4, j + 1.6), z4 = iso(GW - 0.4, j);
    c.beginPath(); c.moveTo(z1.x, z1.y); c.lineTo(z2.x, z2.y); c.lineTo(z3.x, z3.y); c.lineTo(z4.x, z4.y);
    c.closePath(); c.fill();
  }
  c.restore();

  c.setTransform(1, 0, 0, 1, 0, 0);
  construitMotifEau(b);
  construitFaune(carteC.graine);
}

/* ================================================================
   LA FAUNE MARINE — requins, baleines, bancs de poissons, mouettes
   ================================================================ */
var faune = [];
function construitFaune(graine){
  var al = prng(graine ^ 0x7f3a);
  faune = [];
  var rayonX = (GW + GH) * TW / 4, rayonY = (GW + GH) * TH / 4;
  function ajoute(t, kr, v, ech){
    faune.push({
      t:t, a:al() * 6.2832, rx:rayonX * kr, ry:rayonY * kr,
      v:v * (0.8 + al() * 0.5) * (al() < 0.5 ? 1 : -1),
      ech:ech * (0.85 + al() * 0.35),
      ph:al() * 6.2832, souffle:al() * 14
    });
  }
  for(var i = 0; i < 5; i++) ajoute("requin", 1.06 + al() * 0.16, 0.055, 1);
  for(var j = 0; j < 3; j++) ajoute("baleine", 1.34 + al() * 0.30, 0.020, 1);
  for(var k = 0; k < 6; k++) ajoute("banc", 1.04 + al() * 0.22, 0.075, 1);
  for(var m = 0; m < 7; m++) ajoute("mouette", 0.86 + al() * 0.5, 0.10, 1);
}
function majFaune(dt){
  for(var i = 0; i < faune.length; i++){
    var f = faune[i];
    f.a += f.v * dt * 0.12;
    if(f.t === "baleine"){
      f.souffle -= dt;
      if(f.souffle < -2.2) f.souffle = 12 + Math.random() * 16;
    }
  }
}
function posFaune(f, tps){
  var ond = Math.sin(tps * 0.5 + f.ph) * 0.045;
  var x = CENTRE_X + Math.cos(f.a) * f.rx * (1 + ond);
  var y = CENTRE_Y + Math.sin(f.a) * f.ry * (1 + ond);
  return { x:x, y:y };
}
function dessineFaune(c, tps, vue){
  for(var i = 0; i < faune.length; i++){
    var f = faune[i];
    var p = posFaune(f, tps);
    if(p.x < vue.x0 - 200 || p.x > vue.x1 + 200 || p.y < vue.y0 - 200 || p.y > vue.y1 + 200) continue;
    var p2 = posFaune({ a:f.a + 0.02 * Math.sign(f.v || 1), rx:f.rx, ry:f.ry, ph:f.ph }, tps);
    var ang = Math.atan2(p2.y - p.y, p2.x - p.x);
    c.save();
    c.translate(p.x, p.y);
    c.rotate(ang);
    if(f.t === "requin") dessineRequin(c, f, tps);
    else if(f.t === "baleine") dessineBaleine(c, f, tps);
    else if(f.t === "banc") dessineBanc(c, f, tps);
    else dessineMouette(c, f, tps);
    c.restore();
  }
}
function dessineRequin(c, f, tps){
  var s = 1.5 * f.ech;
  var q = Math.sin(tps * 3 + f.ph) * 0.22;
  c.save();
  c.scale(s, s * 0.55);
  /* remous */
  c.fillStyle = "rgba(255,255,255,.18)";
  c.beginPath(); c.ellipse(-6, 0, 26, 9, 0, 0, 6.2832); c.fill();
  /* ombre dans l'eau */
  c.fillStyle = "rgba(4,20,34,.34)";
  c.beginPath(); c.ellipse(2, 4, 20, 7, 0, 0, 6.2832); c.fill();
  /* corps */
  var g = c.createLinearGradient(0, -8, 0, 8);
  g.addColorStop(0, "#7d93a4"); g.addColorStop(0.45, "#4a6274"); g.addColorStop(1, "#2b3d4c");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(20, 0);
  c.quadraticCurveTo(6, -7.5, -12, -4);
  c.quadraticCurveTo(-18, -2, -22, -8 + q * 12);
  c.lineTo(-19, 0);
  c.lineTo(-22, 8 + q * 12);
  c.quadraticCurveTo(-18, 2, -12, 4);
  c.quadraticCurveTo(6, 7.5, 20, 0);
  c.closePath(); c.fill();
  /* nageoires latérales */
  c.fillStyle = "#3d5364";
  c.beginPath(); c.moveTo(2, 3); c.lineTo(-4, 13); c.lineTo(0, 4); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(2, -3); c.lineTo(-4, -13); c.lineTo(0, -4); c.closePath(); c.fill();
  /* ventre clair */
  c.fillStyle = "rgba(226,232,236,.5)";
  c.beginPath(); c.ellipse(4, 2.4, 12, 2.4, 0, 0, 6.2832); c.fill();
  c.restore();
  /* aileron dorsal qui perce la surface */
  c.save();
  c.scale(s, s * 0.55);
  c.fillStyle = "#37485a";
  c.beginPath();
  c.moveTo(0, 0); c.lineTo(-7, -1); c.lineTo(-2, -13);
  c.closePath(); c.fill();
  c.fillStyle = "rgba(255,255,255,.5)";
  c.beginPath(); c.ellipse(-3, 1, 8, 2.4, 0, 0, 6.2832); c.fill();
  c.restore();
}
function dessineBaleine(c, f, tps){
  var s = 3.4 * f.ech;
  var q = Math.sin(tps * 1.1 + f.ph) * 0.2;
  var plonge = 0.5 + 0.5 * Math.sin(tps * 0.28 + f.ph);
  c.save();
  c.globalAlpha = 0.55 + plonge * 0.45;
  c.scale(s, s * 0.55);
  /* remous */
  c.fillStyle = "rgba(255,255,255,.16)";
  c.beginPath(); c.ellipse(-4, 0, 30, 12, 0, 0, 6.2832); c.fill();
  var g = c.createLinearGradient(0, -10, 0, 10);
  g.addColorStop(0, "#5a6c86"); g.addColorStop(0.5, "#33455e"); g.addColorStop(1, "#1d2b3e");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(26, 0);
  c.quadraticCurveTo(10, -10, -10, -7);
  c.quadraticCurveTo(-20, -5, -24, -2);
  c.lineTo(-32, -11 + q * 10); c.lineTo(-27, 0); c.lineTo(-32, 11 + q * 10);
  c.lineTo(-24, 2);
  c.quadraticCurveTo(-20, 5, -10, 7);
  c.quadraticCurveTo(10, 10, 26, 0);
  c.closePath(); c.fill();
  /* sillons ventraux */
  c.strokeStyle = "rgba(200,215,230,.28)"; c.lineWidth = 0.8;
  for(var i = 0; i < 5; i++){
    c.beginPath(); c.moveTo(16 - i * 5, 2); c.lineTo(12 - i * 5, 7.5); c.stroke();
  }
  c.fillStyle = "rgba(220,230,240,.32)";
  c.beginPath(); c.ellipse(6, 4, 16, 3.2, 0, 0, 6.2832); c.fill();
  c.restore();
  /* souffle */
  if(f.souffle < 0){
    var t = -f.souffle / 2.2;
    c.save();
    c.globalAlpha = (1 - t) * 0.75;
    for(var k = 0; k < 5; k++){
      bouffee(c, 14 * s * 0.3, -20 * t * s * 0.3 - k * 6 * s * 0.2,
              (3 + t * 9 + k) * s * 0.35, 0.5, "#eef6ff");
    }
    c.restore();
  }
}
function dessineBanc(c, f, tps){
  var s = f.ech;
  c.save();
  c.globalAlpha = 0.42;
  c.scale(s, s * 0.55);
  for(var i = 0; i < 14; i++){
    var a = i * 2.399963;
    var r = 3 + 2.4 * Math.sqrt(i);
    var x = Math.cos(a) * r * 1.5, y = Math.sin(a) * r;
    var w = Math.sin(tps * 6 + i) * 1.2;
    c.fillStyle = i % 3 ? "#1d5a6e" : "#2f8ea4";
    c.beginPath(); c.ellipse(x + w, y, 3.2, 1.3, 0, 0, 6.2832); c.fill();
  }
  c.restore();
}
function dessineMouette(c, f, tps){
  var s = f.ech;
  var bat = Math.sin(tps * 7 + f.ph);
  var haut = -70 * s;
  c.save();
  /* ombre sur l'eau */
  c.globalAlpha = 0.16; c.fillStyle = "#000";
  c.beginPath(); c.ellipse(0, 0, 7 * s, 2.6 * s, 0, 0, 6.2832); c.fill();
  c.restore();
  c.save();
  c.translate(0, haut);
  c.strokeStyle = "#f4f6fa"; c.lineWidth = 2.2 * s; c.lineCap = "round";
  c.beginPath();
  c.moveTo(-9 * s, bat * 4 * s);
  c.quadraticCurveTo(0, -3 * s - bat * 2 * s, 9 * s, bat * 4 * s);
  c.stroke();
  c.fillStyle = "#e8ecf2";
  c.beginPath(); c.ellipse(0, 0, 3.4 * s, 1.8 * s, 0, 0, 6.2832); c.fill();
  c.restore();
}

/* ================================================================
   RENDU DE L'EAU
   ================================================================ */
function dessineEau(c, t, vue){
  var b = BIOMES[carte.biome];
  c.fillStyle = b.eau;
  c.fillRect(vue.x0, vue.y0, vue.x1 - vue.x0, vue.y1 - vue.y0);

  if(eauMotif1){
    /* calque de fond : grande houle, échelle 1 */
    c.save();
    var d1x = (t * 11) % 256, d1y = (t * 5.5) % 256;
    c.translate(d1x, d1y);
    c.fillStyle = eauMotif1;
    c.fillRect(vue.x0 - d1x - 40, vue.y0 - d1y - 40, vue.x1 - vue.x0 + 340, vue.y1 - vue.y0 + 340);
    c.restore();
    /* calque de détail : même tuile, mais réduite et tournée — cela casse
       complètement la régularité du motif, sans coûter une seconde tuile */
    c.save();
    c.globalAlpha = 0.5;
    var e = 0.58;
    var d2x = (-t * 17) % 256, d2y = (t * 9) % 256;
    c.scale(e, e);
    c.translate(d2x, d2y);
    c.fillStyle = eauMotif2;
    c.fillRect((vue.x0 - 400) / e - d2x, (vue.y0 - 400) / e - d2y,
               (vue.x1 - vue.x0 + 800) / e, (vue.y1 - vue.y0 + 800) / e);
    c.restore();
    /* troisième passage très étiré : donne le sens du courant */
    c.save();
    c.globalAlpha = 0.22;
    c.scale(2.3, 0.85);
    var d3x = (t * 6) % 256, d3y = (-t * 3) % 256;
    c.translate(d3x, d3y);
    c.fillStyle = eauMotif1;
    c.fillRect((vue.x0 - 300) / 2.3 - d3x, (vue.y0 - 300) / 0.85 - d3y,
               (vue.x1 - vue.x0 + 600) / 2.3, (vue.y1 - vue.y0 + 600) / 0.85);
    c.restore();
  }

  /* haut-fond : l'eau s'éclaircit en approchant de l'île */
  c.save();
  c.globalAlpha = 0.42;
  traceIle(c, 200, 0, 0); c.fillStyle = b.fond; c.fill();
  c.globalAlpha = 0.46;
  traceIle(c, 96, 0, 0); c.fillStyle = melange(b.fond, b.basFond, 0.5); c.fill();
  c.globalAlpha = 0.52;
  traceIle(c, 34, 0, 0); c.fillStyle = b.basFond; c.fill();
  c.restore();

  /* faune marine */
  dessineFaune(c, t, vue);

  /* reflets scintillants en crête de vague */
  c.save();
  c.globalCompositeOperation = "lighter";
  c.strokeStyle = "rgba(255,255,255,.22)";
  c.lineWidth = 2;
  var larg = vue.x1 - vue.x0, haut = vue.y1 - vue.y0;
  for(var i = 0; i < 40; i++){
    var fx = ((i * 137.5) % 100) / 100, fy = ((i * 71.3) % 100) / 100;
    var x = vue.x0 + fx * larg;
    var y = vue.y0 + fy * haut + Math.sin(t * 1.6 + i * 0.9) * 30;
    var vis = Math.sin(t * 2.4 + x * 0.004 + i);
    if(vis < 0.4) continue;
    c.globalAlpha = (vis - 0.4) / 0.6 * 0.85;
    c.beginPath(); c.moveTo(x - 8, y); c.lineTo(x + 8, y - 2); c.stroke();
  }
  c.restore();
}

/* Écume et lame qui lèche le rivage */
function dessineEcume(c, t){
  c.save();
  c.lineCap = "round";
  for(var k = 0; k < 3; k++){
    c.strokeStyle = "rgba(255,255,255," + (0.34 - k * 0.09) + ")";
    c.lineWidth = 6 - k * 1.4;
    traceIle(c, 5 + k * 8 + Math.sin(t * 1.7 + k) * 3.5, 0, t);
    c.stroke();
  }
  var n = cheminIle.length;
  c.strokeStyle = "rgba(255,255,255,.6)";
  c.lineWidth = 2.6;
  for(var i = 0; i < n; i += 3){
    var ph = Math.sin(t * 1.9 + i * 0.7);
    if(ph < 0.5) continue;
    var p = cheminIle[i];
    var vx = p.x - CENTRE_X, vy = (p.y - CENTRE_Y) * 2, l = Math.hypot(vx, vy) || 1;
    var d = 6 + (ph - 0.5) * 40;
    c.globalAlpha = (1 - (ph - 0.5) / 0.5) * 0.75;
    c.beginPath();
    c.ellipse(p.x + vx / l * d, p.y + vy / l * d * 0.5,
              6 + (ph - 0.5) * 20, 3 + (ph - 0.5) * 9, 0, 0.5, 2.7);
    c.stroke();
  }
  c.restore();
}

/* Lame translucide qui recouvre le bas de la plage — après le sol */
function dessineRessac(c, t){
  var b = BIOMES[carte.biome];
  var respire = Math.sin(t * 0.9) * 6;
  c.save();
  /* nappe d'eau peu profonde qui lèche le sable : anneau entre deux contours */
  c.globalAlpha = 0.40;
  c.fillStyle = b.basFond;
  traceIle(c, 10, 0, 0, false);
  traceIle(c, -13 + respire, 0, 0, true);
  c.fill("evenodd");
  c.globalAlpha = 0.26;
  c.fillStyle = b.eauC;
  traceIle(c, 5, 0, 0, false);
  traceIle(c, -5 + respire, 0, 0, true);
  c.fill("evenodd");
  /* frange d'écume à la limite de la lame */
  c.globalAlpha = 0.8;
  c.strokeStyle = "rgba(255,255,255,.85)";
  c.lineWidth = 3;
  traceIle(c, -11 + respire, 2.4, t);
  c.stroke();
  c.globalAlpha = 0.4;
  c.lineWidth = 7;
  traceIle(c, -7 + respire, 2.4, t + 1.3);
  c.stroke();
  c.restore();
}

/* Recopie du sol pré-calculé, élaguée à la vue */
function dessineSol(c, vue){
  if(!solCv) return;
  var sx = (vue.x0 - solInfo.x0) * SOL_ECH;
  var sy = (vue.y0 - solInfo.y0) * SOL_ECH;
  var sw = (vue.x1 - vue.x0) * SOL_ECH;
  var sh = (vue.y1 - vue.y0) * SOL_ECH;
  var dx = vue.x0, dy = vue.y0, dw = vue.x1 - vue.x0, dh = vue.y1 - vue.y0;
  if(sx < 0){ dx -= sx / SOL_ECH; dw += sx / SOL_ECH; sw += sx; sx = 0; }
  if(sy < 0){ dy -= sy / SOL_ECH; dh += sy / SOL_ECH; sh += sy; sy = 0; }
  if(sx + sw > solCv.width){ var ex = sx + sw - solCv.width; sw -= ex; dw -= ex / SOL_ECH; }
  if(sy + sh > solCv.height){ var ey = sy + sh - solCv.height; sh -= ey; dh -= ey / SOL_ECH; }
  if(sw <= 0 || sh <= 0) return;
  c.drawImage(solCv, sx, sy, sw, sh, dx, dy, dw, dh);
}
