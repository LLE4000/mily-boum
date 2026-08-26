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
  },
  /* Nuit de festival. Le piège serait de tout noircir : c'est la
     lumière qui fait la fête, donc le sol reste juste assombri et
     l'eau garde des reflets chauds — indigo dessous, rose dessus. */
  hippie: {
    sol1:"#3e4433", sol2:"#333a2c", sable:"#8e846c", sableO:"#5c5548",
    herbe:"#3d5636", allee:"#7a6b50", roche:"#443c56",
    eauC:"#c489cc", eau:"#544ab8", eauO:"#332a80", ecume:"#ffe6f6",
    fond:"#6a4fb4", basFond:"#b98ad6", ciel:"#3a1a4c"
  },
  /* Plein midi en Provence. Tout est délavé par la lumière : l'ocre
     tire au blanc, le vert tire au gris, et seule la mer garde une
     couleur franche. C'est l'exact contraire de la soirée hippie. */
  sud: {
    sol1:"#dcc79a", sol2:"#cdb684", sable:"#f0e2c0", sableO:"#c8b088",
    herbe:"#a7b183", allee:"#f2e7cc", roche:"#c6bba4",
    eauC:"#b6f7ec", eau:"#189ad6", eauO:"#0a4e94", ecume:"#f6ffff",
    fond:"#38b6da", basFond:"#93ecdd", ciel:"#a4dcf2"
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

/* ================================================================
   DÉCORS DE LA SOIRÉE HIPPIE
   Tout est cuit dans un sprite : aucune horloge, aucun tirage au sort
   ici. Les feux et les ampoules sont donc figés — mais leur halo
   suffit à faire vivre la prairie de nuit.
   ================================================================ */

/* Un point du long flanc d'une caisse, repéré par sa position t le long
   de l'axe gy et sa hauteur hh. boite() ne sait peindre ses faces que
   d'un seul aplat : pour y poser une peinture, il faut viser soi-même. */
function pointFlanc(gx, gy, w, d, z0, t, hh){
  var q = iso(gx + w / 2, gy - d / 2 + d * t);
  return { x:q.x, y:q.y - z0 - hh };
}
function traceFlanc(c, gx, gy, w, d, z0, h0, h1){
  var a = pointFlanc(gx, gy, w, d, z0, 0, h1), b = pointFlanc(gx, gy, w, d, z0, 1, h1);
  var e = pointFlanc(gx, gy, w, d, z0, 1, h0), f = pointFlanc(gx, gy, w, d, z0, 0, h0);
  c.beginPath();
  c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(e.x, e.y); c.lineTo(f.x, f.y);
  c.closePath();
}
/* Le combi peint. Il est couché le long de gy pour que son grand flanc
   tombe sur la face éclairée à 75 % : c'est là que va la peinture. */
function combi(c, gx, gy, s){
  var w = 0.86 * s, d = 1.55 * s, z0 = 4.2 * s, h = 13 * s;
  ombreRonde(c, gx, gy, 0.95 * s, 0.3);
  /* les roues d'abord : la caisse leur mange le haut, elles ont l'air posées */
  var ra = iso(gx + 0.42 * s, gy - 0.52 * s), rb = iso(gx + 0.42 * s, gy + 0.52 * s);
  c.fillStyle = "#231c2b";
  c.beginPath(); c.ellipse(ra.x, ra.y - 2.6 * s, 4 * s, 3 * s, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(rb.x, rb.y - 2.6 * s, 4 * s, 3 * s, 0, 0, 6.2832); c.fill();
  /* la caisse crème, puis le toit relevé en toile orange */
  var cr = faces("#f0e4cc");
  boite(c, gx, gy, w, d, z0, h, cr.t, cr.g, cr.d);
  var to = faces("#e8813a");
  boite(c, gx - 0.05 * s, gy, w * 0.80, d * 0.80, z0 + h, 5.4 * s, to.t, to.g, to.d);
  /* la peinture du flanc */
  c.save();
  traceFlanc(c, gx, gy, w, d, z0, 0, h); c.clip();
  /* bande turquoise en bas, séparée par un liseré magenta */
  c.fillStyle = "#2fb2bd";
  traceFlanc(c, gx, gy, w, d, z0, 0, h * 0.44); c.fill();
  c.fillStyle = "#e0559f";
  traceFlanc(c, gx, gy, w, d, z0, h * 0.44, h * 0.52); c.fill();
  /* le soleil levant, motif obligé du combi */
  var so = pointFlanc(gx, gy, w, d, z0, 0.26, h * 0.62);
  c.fillStyle = "#ffd85a";
  c.beginPath(); c.arc(so.x, so.y, 4.2 * s, 0, 6.2832); c.fill();
  c.strokeStyle = "#ffd85a"; c.lineWidth = 1.2 * s;
  for(var k = 0; k < 7; k++){
    var a2 = k / 7 * 6.2832;
    c.beginPath();
    c.moveTo(so.x + Math.cos(a2) * 5.4 * s, so.y + Math.sin(a2) * 5.4 * s);
    c.lineTo(so.x + Math.cos(a2) * 7.6 * s, so.y + Math.sin(a2) * 7.6 * s);
    c.stroke();
  }
  /* une spirale à l'autre bout */
  var sp = pointFlanc(gx, gy, w, d, z0, 0.76, h * 0.66);
  c.strokeStyle = "#7fd94f"; c.lineWidth = 1.4 * s;
  c.beginPath();
  for(var m = 0; m < 22; m++){
    var an = m * 0.55, rr = 0.42 * s * m * 0.7;
    var xx = sp.x + Math.cos(an) * rr, yy = sp.y + Math.sin(an) * rr;
    if(m === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy);
  }
  c.stroke();
  /* les hublots, allumés */
  c.fillStyle = "#ffd489";
  for(var n = 0; n < 2; n++){
    var t0 = 0.44 + n * 0.20;
    var h1 = pointFlanc(gx, gy, w, d, z0, t0, h * 0.94);
    var h2 = pointFlanc(gx, gy, w, d, z0, t0 + 0.14, h * 0.94);
    var h3 = pointFlanc(gx, gy, w, d, z0, t0 + 0.14, h * 0.58);
    var h4 = pointFlanc(gx, gy, w, d, z0, t0, h * 0.58);
    c.beginPath();
    c.moveTo(h1.x, h1.y); c.lineTo(h2.x, h2.y); c.lineTo(h3.x, h3.y); c.lineTo(h4.x, h4.y);
    c.closePath(); c.fill();
  }
  c.restore();
  /* le pare-brise : c'est lui qui donne l'air habité */
  var g1 = iso(gx + w / 2, gy + d / 2), g2 = iso(gx - w / 2, gy + d / 2);
  c.fillStyle = "#ffc978";
  c.beginPath();
  c.moveTo(g1.x - 1.5 * s, g1.y - z0 - h * 0.94); c.lineTo(g2.x + 1.5 * s, g2.y - z0 - h * 0.94);
  c.lineTo(g2.x + 1.5 * s, g2.y - z0 - h * 0.50); c.lineTo(g1.x - 1.5 * s, g1.y - z0 - h * 0.50);
  c.closePath(); c.fill();
  var pv = iso(gx, gy + d / 2);
  lueurRapide(c, pv.x, pv.y - z0 - h * 0.7, 22 * s, "#ffb44a", 0.42);
}
/* Le tipi. La toile est éclairée de l'intérieur : le dégradé va du
   gris lunaire en haut à l'orange du foyer en bas. */
function tipi(c, gx, gy, s){
  var p = iso(gx, gy);
  ombreRonde(c, gx, gy, 0.6 * s, 0.28);
  var rx = 19 * s, h = 31 * s;
  c.save();
  c.beginPath();
  c.moveTo(p.x - rx, p.y);
  c.lineTo(p.x - rx * 0.15, p.y - h);
  c.lineTo(p.x + rx * 0.15, p.y - h);
  c.lineTo(p.x + rx, p.y);
  c.ellipse(p.x, p.y, rx, rx * 0.42, 0, 0, Math.PI);
  c.closePath();
  c.clip();
  var g = c.createLinearGradient(0, p.y - h, 0, p.y + rx * 0.4);
  g.addColorStop(0, "#a89cb4");
  g.addColorStop(0.5, "#ddcdb2");
  g.addColorStop(1, "#ffc47c");
  c.fillStyle = g;
  c.fillRect(p.x - rx - 2, p.y - h - 2, rx * 2 + 4, h + rx + 4);
  /* coutures verticales, puis deux chevrons peints */
  c.strokeStyle = "rgba(120,96,74,.28)"; c.lineWidth = 1 * s;
  for(var i = -2; i <= 2; i++){
    c.beginPath();
    c.moveTo(p.x + i * 3 * s, p.y - h); c.lineTo(p.x + i * rx * 0.42, p.y + rx * 0.4);
    c.stroke();
  }
  var teintes = ["#d8478f", "#3fc9c0"];
  for(var b = 0; b < 2; b++){
    var yb = p.y - h * (0.30 + b * 0.26);
    c.strokeStyle = teintes[b]; c.lineWidth = 2.2 * s; c.lineJoin = "round";
    c.beginPath();
    for(var k = 0; k <= 8; k++){
      var xx = p.x - rx + k * rx / 4;
      var yy = yb + (k % 2 ? 2.4 * s : -2.4 * s);
      if(k === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy);
    }
    c.stroke();
  }
  c.restore();
  /* les perches qui se croisent au sommet */
  c.strokeStyle = "#8a6f4e"; c.lineWidth = 1.5 * s; c.lineCap = "round";
  for(var q = 0; q < 4; q++){
    c.beginPath();
    c.moveTo(p.x + (q - 1.5) * 1.6 * s, p.y - h + 3 * s);
    c.lineTo(p.x + (q - 1.5) * 4.4 * s, p.y - h - 9 * s);
    c.stroke();
  }
  /* un fanion en haut d'une perche */
  c.fillStyle = "#ffb43c";
  c.beginPath();
  c.moveTo(p.x + 6.6 * s, p.y - h - 9 * s);
  c.lineTo(p.x + 13 * s, p.y - h - 6.5 * s);
  c.lineTo(p.x + 6.6 * s, p.y - h - 4 * s);
  c.closePath(); c.fill();
  /* l'ouverture et la lumière qui en sort */
  lueurRapide(c, p.x, p.y - 6 * s, 26 * s, "#ff9a3c", 0.5);
  var go = c.createLinearGradient(0, p.y - 15 * s, 0, p.y);
  go.addColorStop(0, "#3b2a34"); go.addColorStop(1, "#ffcf7e");
  c.fillStyle = go;
  c.beginPath();
  c.moveTo(p.x - 4.4 * s, p.y + 1 * s);
  c.lineTo(p.x, p.y - 15 * s);
  c.lineTo(p.x + 4.4 * s, p.y + 1 * s);
  c.closePath(); c.fill();
}
/* La guirlande d'ampoules. Elle est tracée à plat dans l'écran : ce
   n'est pas un volume, c'est une ligne de lumière tendue en travers. */
function guirlande(c, gx, gy, s){
  var p = iso(gx, gy);
  var demi = 27 * s, haut = 31 * s;
  c.strokeStyle = "#6b5a48"; c.lineWidth = 2.2 * s; c.lineCap = "round";
  c.beginPath(); c.moveTo(p.x - demi, p.y + 2 * s); c.lineTo(p.x - demi + 2 * s, p.y - haut); c.stroke();
  c.beginPath(); c.moveTo(p.x + demi, p.y + 2 * s); c.lineTo(p.x + demi - 2 * s, p.y - haut); c.stroke();
  var ax = p.x - demi + 2 * s, ay = p.y - haut;
  var bx = p.x + demi - 2 * s, by = p.y - haut;
  var cx = p.x, cy = p.y - haut + 26 * s;
  c.strokeStyle = "rgba(28,20,32,.6)"; c.lineWidth = 1.1 * s;
  c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(cx, cy, bx, by); c.stroke();
  var teintes = ["#ff5aa8", "#ffc23c", "#4fe3d8", "#a06bff", "#8ce04a", "#ff7a3c"];
  for(var i = 1; i < 10; i++){
    var t = i / 10, u = 1 - t;
    var x = u * u * ax + 2 * u * t * cx + t * t * bx;
    var y = u * u * ay + 2 * u * t * cy + t * t * by;
    var col = teintes[i % 6];
    c.strokeStyle = "rgba(28,20,32,.55)"; c.lineWidth = 0.9 * s;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 2.6 * s); c.stroke();
    lueurRapide(c, x, y + 4.4 * s, 12 * s, col, 0.6);
    c.fillStyle = col;
    c.beginPath(); c.ellipse(x, y + 4.6 * s, 2.3 * s, 2.9 * s, 0, 0, 6.2832); c.fill();
    c.fillStyle = "rgba(255,255,255,.8)";
    c.beginPath(); c.ellipse(x - 0.7 * s, y + 3.8 * s, 0.9 * s, 1.1 * s, 0, 0, 6.2832); c.fill();
  }
}
/* Le foyer. La flamme est figée à une heure choisie, sinon chaque
   reconstruction du sprite donnerait un feu différent. */
function feuDeCamp(c, gx, gy, s){
  var p = iso(gx, gy);
  c.save();
  c.globalCompositeOperation = "lighter";
  var g = c.createRadialGradient(p.x, p.y, 2, p.x, p.y, 40 * s);
  g.addColorStop(0, "rgba(255,158,66,.62)");
  g.addColorStop(0.45, "rgba(255,132,44,.22)");
  g.addColorStop(1, "rgba(255,120,40,0)");
  c.fillStyle = g;
  c.beginPath(); c.ellipse(p.x, p.y, 40 * s, 20 * s, 0, 0, 6.2832); c.fill();
  c.restore();
  for(var i = 0; i < 8; i++){
    var a = i / 8 * 6.2832 + 0.4;
    var sx = p.x + Math.cos(a) * 12 * s, sy = p.y + Math.sin(a) * 6 * s;
    c.fillStyle = "#514a5c";
    c.beginPath(); c.ellipse(sx, sy, 3.4 * s, 2.3 * s, a, 0, 6.2832); c.fill();
    c.fillStyle = "rgba(255,166,86,.5)";
    c.beginPath(); c.ellipse(sx - Math.cos(a) * 1.2 * s, sy - Math.sin(a) * 0.8 * s, 2.1 * s, 1.3 * s, a, 0, 6.2832); c.fill();
  }
  c.strokeStyle = "#4a3524"; c.lineWidth = 3.2 * s; c.lineCap = "round";
  c.beginPath(); c.moveTo(p.x - 7 * s, p.y + 2 * s); c.lineTo(p.x + 6 * s, p.y - 3 * s); c.stroke();
  c.beginPath(); c.moveTo(p.x - 6 * s, p.y - 3 * s); c.lineTo(p.x + 7 * s, p.y + 2 * s); c.stroke();
  flamme(c, p.x, p.y - 2 * s, 21 * s, 0.62, s * 0.95);
  braises(c, p.x, p.y - 7 * s, 0.62, 9, s * 0.9, 26);
}

/* ================================================================
   DÉCORS DU SUD — tout est lavé par le soleil de midi
   ================================================================ */
function cypres(c, gx, gy, s){
  var p = iso(gx, gy);
  ombreRonde(c, gx, gy, 0.36 * s, 0.26);
  var h = 52 * s, w = 7.6 * s;
  function silhouette(){
    c.beginPath();
    c.moveTo(p.x, p.y - h);
    c.bezierCurveTo(p.x + w, p.y - h * 0.62, p.x + w * 0.94, p.y - h * 0.16, p.x + w * 0.40, p.y);
    c.lineTo(p.x - w * 0.40, p.y);
    c.bezierCurveTo(p.x - w * 0.94, p.y - h * 0.16, p.x - w, p.y - h * 0.62, p.x, p.y - h);
    c.closePath();
  }
  var g = c.createLinearGradient(p.x - w, 0, p.x + w, 0);
  g.addColorStop(0, "#5c7d52"); g.addColorStop(0.42, "#33513a"); g.addColorStop(1, "#1e3324");
  c.fillStyle = g;
  silhouette(); c.fill();
  /* le feuillage en écailles. Des virgules posées à intervalle
     régulier tricotaient une chaussette : leurs places sortent donc du
     hachage déterministe, irrégulier mais identique à chaque partie. */
  c.save();
  silhouette(); c.clip();
  c.lineCap = "round";
  for(var i = 0; i < 46; i++){
    var t = (i + alea2d(i, 3, 11) * 0.9) / 46;
    var yy = p.y - h * (0.02 + t * 0.96);
    var lg = w * (0.95 - t * 0.42);
    var xx = p.x + (alea2d(i, 1, 7) - 0.5) * 2 * lg * 0.8;
    var lo = (0.7 + alea2d(i, 2, 5) * 0.8) * s;
    var clair = alea2d(i, 4, 3) > 0.62;
    c.strokeStyle = clair ? "rgba(150,186,128,.34)" : "rgba(18,36,22,.24)";
    c.lineWidth = 1.7 * s;
    c.beginPath();
    c.moveTo(xx - 2 * lo, yy + 1.4 * lo);
    c.quadraticCurveTo(xx, yy - 0.3 * lo, xx + 2 * lo, yy - 1.6 * lo);
    c.stroke();
  }
  c.restore();
  /* le soleil frappe le flanc gauche */
  c.strokeStyle = "rgba(206,226,166,.4)"; c.lineWidth = 1.5 * s;
  c.beginPath();
  c.moveTo(p.x, p.y - h);
  c.bezierCurveTo(p.x - w * 0.94, p.y - h * 0.62, p.x - w * 0.9, p.y - h * 0.2, p.x - w * 0.42, p.y - h * 0.04);
  c.stroke();
  c.strokeStyle = "#6b5a44"; c.lineWidth = 2 * s;
  c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x, p.y - 4 * s); c.stroke();
}
function olivier(c, gx, gy, s){
  var p = iso(gx, gy);
  ombreRonde(c, gx, gy, 0.52 * s, 0.24);
  /* deux troncs noueux qui partent en sens contraire : c'est ce
     déséquilibre qui fait l'olivier, pas le feuillage */
  c.lineCap = "round";
  c.strokeStyle = "#8b7c68"; c.lineWidth = 6 * s;
  c.beginPath(); c.moveTo(p.x - 1.5 * s, p.y);
  c.quadraticCurveTo(p.x - 7 * s, p.y - 8 * s, p.x - 7.5 * s, p.y - 16 * s); c.stroke();
  c.beginPath(); c.moveTo(p.x + 2 * s, p.y);
  c.quadraticCurveTo(p.x + 6 * s, p.y - 7 * s, p.x + 6.5 * s, p.y - 15 * s); c.stroke();
  c.strokeStyle = "#c8b99f"; c.lineWidth = 2 * s;
  c.beginPath(); c.moveTo(p.x - 3 * s, p.y - 1 * s);
  c.quadraticCurveTo(p.x - 8 * s, p.y - 8 * s, p.x - 8.4 * s, p.y - 15 * s); c.stroke();
  /* le feuillage se monte en trois couches : masse sombre, corps
     gris-vert, puis l'argenture du dessous des feuilles côté soleil.
     C'est ce dernier étage qui fait reconnaître un olivier. */
  var lobes = [[-8, -20, 10, 7.4], [7, -19, 9, 6.8], [0, -25, 10.5, 7.8],
               [-2, -16, 8.6, 6], [10.5, -24, 6.4, 5.2], [-11.5, -25, 7, 5.4],
               [3, -29, 7, 5]];
  for(var i = 0; i < lobes.length; i++){
    c.fillStyle = "#5c7049";
    c.beginPath();
    c.ellipse(p.x + lobes[i][0] * s, p.y + (lobes[i][1] + 1.6) * s,
              lobes[i][2] * s, lobes[i][3] * s, 0, 0, 6.2832);
    c.fill();
  }
  for(i = 0; i < lobes.length; i++){
    c.fillStyle = i % 2 ? "#7f9366" : "#8fa576";
    c.beginPath();
    c.ellipse(p.x + lobes[i][0] * s, p.y + lobes[i][1] * s,
              lobes[i][2] * 0.92 * s, lobes[i][3] * 0.92 * s, 0, 0, 6.2832);
    c.fill();
  }
  for(i = 0; i < lobes.length; i++){
    c.fillStyle = "rgba(186,204,158,.42)";
    c.beginPath();
    c.ellipse(p.x + (lobes[i][0] - 2.4) * s, p.y + (lobes[i][1] - 2) * s,
              lobes[i][2] * 0.5 * s, lobes[i][3] * 0.46 * s, 0, 0, 6.2832);
    c.fill();
  }
  c.fillStyle = "rgba(226,236,206,.42)";
  for(var k = 0; k < 18; k++){
    var a = k * 2.399963;
    var r = 2 + 2.8 * Math.sqrt(k);
    c.beginPath();
    c.ellipse(p.x + Math.cos(a) * r * 1.5 * s, p.y - 22 * s + Math.sin(a) * r * s,
              1.4 * s, 0.8 * s, a, 0, 6.2832);
    c.fill();
  }
}
function lavande(c, gx, gy, s){
  var p = iso(gx, gy);
  ombreRonde(c, gx, gy, 0.45 * s, 0.2);
  /* le violet ne tient que si le feuillage reste argenté : on pose
     d'abord la touffe grise, les épis viennent après */
  for(var i = 0; i < 3; i++){
    c.fillStyle = ["#93a37d", "#849371", "#a4b28c"][i];
    c.beginPath();
    c.ellipse(p.x + (i - 1) * 4.6 * s, p.y - 2 * s, 6.6 * s, 3.6 * s, 0, 0, 6.2832);
    c.fill();
  }
  c.lineCap = "round";
  for(var k = 0; k < 11; k++){
    var bx = p.x + (k - 5) * 2.2 * s, by = p.y - 3 * s;
    var ex = bx + (k - 5) * 0.5 * s, ey = by - 9 * s - (k % 3) * 2.4 * s;
    c.strokeStyle = "#6f8a5e"; c.lineWidth = 1.1 * s;
    c.beginPath(); c.moveTo(bx, by); c.lineTo(ex, ey); c.stroke();
    var g = c.createLinearGradient(ex, ey - 1 * s, ex, ey + 5 * s);
    g.addColorStop(0, "#d0aef6"); g.addColorStop(1, "#6b47a8");
    c.strokeStyle = g; c.lineWidth = 2.5 * s;
    c.beginPath(); c.moveTo(ex, ey + 4.5 * s); c.lineTo(ex, ey); c.stroke();
  }
}
function muretSec(c, gx, gy, s){
  /* muret de pierres sèches : deux rangs décalés de calcaire pâle,
     et le pot de terre cuite qui donne la seule note chaude */
  var pierres = ["#efe8d6", "#c9bda3", "#ded5c0", "#b6ab90"];
  ombreContact(c, gx, gy, 0.6 * s, 1.7 * s, 0.2);
  for(var i = 0; i < 3; i++){
    var f = faces(pierres[i]);
    boite(c, gx, gy - 0.52 * s + i * 0.52 * s, 0.46 * s, 0.48 * s, 0, 7 * s, f.t, f.g, f.d);
    /* le joint creux entre deux pierres : sans lui, le muret n'est
       qu'un bloc de sucre */
    var jt = iso(gx + 0.23 * s, gy - 0.28 * s + i * 0.52 * s);
    c.strokeStyle = "rgba(96,86,66,.45)"; c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(jt.x, jt.y - 7 * s); c.lineTo(jt.x - 0.46 * s * TW / 2, jt.y - 7 * s + 0.46 * s * TH / 2);
    c.stroke();
  }
  for(var k = 0; k < 2; k++){
    var f2 = faces(pierres[k + 2]);
    boite(c, gx, gy - 0.26 * s + k * 0.52 * s, 0.42 * s, 0.44 * s, 7 * s, 5.4 * s, f2.t, f2.g, f2.d);
  }
  cylindre(c, gx + 0.45 * s, gy + 0.55 * s, 0.17 * s, 0, 6.4 * s, "#a85c38", "#8d4b2c");
  cylindre(c, gx + 0.45 * s, gy + 0.55 * s, 0.20 * s, 6.4 * s, 1.6 * s, "#c96f45", "#a85c38");
  var pp = iso(gx + 0.45 * s, gy + 0.55 * s);
  for(var m = 0; m < 5; m++){
    var a = m / 5 * 6.2832 + 0.6;
    c.fillStyle = m % 2 ? "#5e7a4c" : "#6f8c58";
    c.beginPath();
    c.ellipse(pp.x + Math.cos(a) * 3 * s, pp.y - 10 * s + Math.sin(a) * 2 * s, 3.2 * s, 2.4 * s, 0, 0, 6.2832);
    c.fill();
  }
  c.fillStyle = "#d8434a";
  c.beginPath(); c.arc(pp.x + 1.5 * s, pp.y - 12.5 * s, 2 * s, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(pp.x - 2.5 * s, pp.y - 11 * s, 1.6 * s, 0, 6.2832); c.fill();
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
  }else if(biome === "campagne"){
    if(d.v === 0) meule(c, d.gx, d.gy, d.s);
    else if(d.v === 1) buisson(c, d.gx, d.gy, d.s * 0.8, "#7d8a46");
    else if(d.v === 2) clotureBout(c, d.gx, d.gy, d.s);
    else {
      var q = iso(d.gx, d.gy);
      c.fillStyle = "rgba(90,70,40,.35)";
      c.beginPath(); c.ellipse(q.x, q.y, 9 * d.s, 4 * d.s, 0, 0, 6.2832); c.fill();
    }
  }else if(biome === "hippie"){
    if(d.v === 0) combi(c, d.gx, d.gy, d.s);
    else if(d.v === 1) tipi(c, d.gx, d.gy, d.s);
    else if(d.v === 2) guirlande(c, d.gx, d.gy, d.s);
    else feuDeCamp(c, d.gx, d.gy, d.s);
  }else if(biome === "sud"){
    if(d.v === 0) cypres(c, d.gx, d.gy, d.s);
    else if(d.v === 1) olivier(c, d.gx, d.gy, d.s);
    else if(d.v === 2) lavande(c, d.gx, d.gy, d.s);
    else muretSec(c, d.gx, d.gy, d.s);
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
   SOL PRÉ-CALCULÉ — uniquement le terrain plat.
   Rochers, falaises et décors sont dessinés en direct, dans le tri de
   profondeur : ils restent nets et les troupes passent devant/derrière.
   ================================================================ */

/* --- bruit lisse déterministe, pour des taches organiques --- */
function alea2d(a, b, graine){
  var n = Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(graine, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function bruitLisse(x, y, graine){
  var xi = Math.floor(x), yi = Math.floor(y);
  var xf = x - xi, yf = y - yi;
  var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return alea2d(xi, yi, graine) * (1 - u) * (1 - v)
       + alea2d(xi + 1, yi, graine) * u * (1 - v)
       + alea2d(xi, yi + 1, graine) * (1 - u) * v
       + alea2d(xi + 1, yi + 1, graine) * u * v;
}
function bruitFractal(x, y, graine){
  return bruitLisse(x, y, graine) * 0.55
       + bruitLisse(x * 2.13, y * 2.13, graine + 7) * 0.28
       + bruitLisse(x * 4.37, y * 4.37, graine + 19) * 0.17;
}
function adouci(t){ t = borne(t, 0, 1); return t * t * (3 - 2 * t); }

/* --- palettes de matière, par biome --- */
var MATIERES = {
  plage: {
    fond1:"#e6d1a0", fond2:"#dcc590",                     // dune sèche
    tache1:"#f2e2ba", tache2:"#cbb078",
    herbe1:"#9aa85e", herbe2:"#7d8c48",                   // touffes d'oyat
    sable1:"#f0dfb4", sable2:"#e6d0a0",
    mouille:"#b99a68", roche1:"#8d8794", roche2:"#6f6a78"
  },
  foret: {
    fond1:"#5d7c3d", fond2:"#4c6a30",
    tache1:"#6e8f47", tache2:"#3d5726",
    herbe1:"#77a04c", herbe2:"#4e7030",
    sable1:"#ddcda2", sable2:"#c9b483",
    mouille:"#a08e63", roche1:"#7a7484", roche2:"#5d5868"
  },
  campagne: {
    fond1:"#bb9e60", fond2:"#a88b4f",
    tache1:"#cdb073", tache2:"#8f7640",
    herbe1:"#9aa851", herbe2:"#7c8a44",
    sable1:"#e0cb95", sable2:"#cdb47c",
    mouille:"#9c8154", roche1:"#7f7986", roche2:"#635e6c"
  },
  hippie: {
    fond1:"#454a39", fond2:"#383e31",                     // prairie piétinée, à la nuit tombée
    tache1:"#565b42", tache2:"#282d24",
    herbe1:"#4c6743", herbe2:"#33442b",
    sable1:"#9c917a", sable2:"#847a66",
    mouille:"#585448", roche1:"#4b4260", roche2:"#352f45"
  },
  sud: {
    fond1:"#ddc99d", fond2:"#cdb682",                     // garrigue sèche, brûlée de soleil
    tache1:"#efdfb8", tache2:"#b49b68",
    herbe1:"#aab586", herbe2:"#8b9765",
    sable1:"#f2e5c6", sable2:"#e2d0a8",
    mouille:"#b6a179", roche1:"#d0c5ad", roche2:"#a89b83"
  }
};

/* Proportions de matière d'une case : sable / roche / herbe / humidité */
function matiereCase(i, j, graine){
  /* roche : le long des trois bords fermés */
  var dRoche = Math.min(j, GH - 1 - j, i);
  var fRoche = adouci(1 - dRoche / LARGEUR_ROCHE);
  /* sable : toute la plage à l'est, avec une transition douce */
  var fSable = i >= PLAGE_X0 ? 1 : adouci(1 - (PLAGE_X0 - i) / 12);
  /* humidité : les dernières cases avant l'eau */
  var fMouille = adouci((i - (GW - 6)) / 6);
  /* herbe : par taches, et seulement là où il n'y a ni roche ni sable sec */
  var n = bruitFractal(i * 0.055, j * 0.055, graine);
  var fHerbe = adouci((n - 0.46) * 3.2) * (1 - fSable * 0.9) * (1 - fRoche * 0.8);
  return { roche:fRoche, sable:fSable, mouille:fMouille, herbe:fHerbe, n:n };
}

function couleurCase(i, j, M, graine){
  var m = matiereCase(i, j, graine);
  var micro = bruitFractal(i * 0.42, j * 0.42, graine + 101);
  var damier = ((i + j) & 1) ? 0.011 : -0.011;
  /* fond du biome, avec ses taches */
  var base = melange(M.fond1, M.fond2, adouci(bruitFractal(i * 0.13, j * 0.13, graine + 3)));
  base = melange(base, M.tache1, adouci((m.n - 0.58) * 3) * 0.6);
  base = melange(base, M.tache2, adouci((0.42 - m.n) * 3) * 0.5);
  /* herbe par-dessus */
  if(m.herbe > 0.02){
    var h = melange(M.herbe1, M.herbe2, micro);
    base = melange(base, h, m.herbe * 0.85);
  }
  /* puis le sable de la plage */
  if(m.sable > 0.01){
    var sa = melange(M.sable1, M.sable2, micro);
    base = melange(base, sa, m.sable);
  }
  /* puis la roche des falaises */
  if(m.roche > 0.01){
    var ro = melange(M.roche1, M.roche2, micro);
    base = melange(base, ro, m.roche * 0.92);
  }
  /* enfin le sable mouillé du bord de mer */
  if(m.mouille > 0.01) base = melange(base, M.mouille, m.mouille * 0.75);
  return ecl(base, 1 + (micro - 0.5) * 0.09 + damier);
}

function construitSol(carteC){
  var b = BIOMES[carteC.biome];
  var M = MATIERES[carteC.biome];
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
  var gr = carteC.graine >>> 0;
  var i, j;

  /* --- masse de l'île --- */
  traceIle(c, 6, 0, 0);
  c.fillStyle = M.sable1;
  c.fill();

  /* --- le terrain, case par case --- */
  for(j = 0; j < GH; j++){
    for(i = 0; i < GW; i++){
      c.fillStyle = couleurCase(i, j, M, gr);
      var a = iso(i, j), e = iso(i + 1, j), f = iso(i + 1, j + 1), g = iso(i, j + 1);
      c.beginPath();
      c.moveTo(a.x, a.y); c.lineTo(e.x, e.y); c.lineTo(f.x, f.y); c.lineTo(g.x, g.y);
      c.closePath(); c.fill();
    }
  }

  /* --- grands reliefs doux : dunes, creux, ombres portées du terrain --- */
  c.save();
  traceIle(c, 0, 0, 0); c.clip();
  for(i = 0; i < 130; i++){
    var dx = al() * GW, dy = al() * GH;
    var p = iso(dx, dy);
    var rr = 130 + al() * 420;
    var clair = al() < 0.5;
    var gd = c.createRadialGradient(p.x, p.y, 4, p.x, p.y, rr);
    gd.addColorStop(0, clair ? "rgba(255,248,224,.13)" : "rgba(70,50,26,.12)");
    gd.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = gd;
    c.beginPath(); c.ellipse(p.x, p.y, rr, rr / 2, 0, 0, 6.2832); c.fill();
  }
  c.restore();

  /* --- allées du quadrillage militaire --- */
  c.save();
  c.globalAlpha = 0.18;
  c.fillStyle = M.tache1;
  for(i = 3; i < PLAGE_X0; i += 5){
    var a1 = iso(i + 1.6, 0), a2 = iso(i + 2.4, 0), a3 = iso(i + 2.4, GH), a4 = iso(i + 1.6, GH);
    c.beginPath(); c.moveTo(a1.x, a1.y); c.lineTo(a2.x, a2.y); c.lineTo(a3.x, a3.y); c.lineTo(a4.x, a4.y);
    c.closePath(); c.fill();
  }
  for(j = 0; j < GH; j += 5){
    var b1 = iso(0, j + 1.6), b2 = iso(0, j + 2.4), b3 = iso(PLAGE_X0, j + 2.4), b4 = iso(PLAGE_X0, j + 1.6);
    c.beginPath(); c.moveTo(b1.x, b1.y); c.lineTo(b2.x, b2.y); c.lineTo(b3.x, b3.y); c.lineTo(b4.x, b4.y);
    c.closePath(); c.fill();
  }
  c.restore();

  /* --- textures propres au biome --- */
  c.save();
  traceIle(c, 0, 0, 0); c.clip();
  if(carteC.biome === "campagne"){
    c.globalAlpha = 0.14; c.strokeStyle = "#6d5527"; c.lineWidth = 2;
    for(j = 3; j < GH - 3; j += 0.9){
      if(matiereCase(GW * 0.4 | 0, j | 0, gr).sable > 0.5) continue;
      var s1 = iso(LARGEUR_ROCHE + 1, j), s2 = iso(PLAGE_X0 - 6, j);
      c.beginPath(); c.moveTo(s1.x, s1.y); c.lineTo(s2.x, s2.y); c.stroke();
    }
  }
  if(carteC.biome === "foret"){
    c.globalAlpha = 0.16;
    for(i = 0; i < 1500; i++){
      var mx = al() * PLAGE_X0, my = al() * GH;
      var pp = iso(mx, my);
      c.fillStyle = al() < 0.5 ? "#39562a" : "#6f9046";
      c.beginPath(); c.ellipse(pp.x, pp.y, 14 + al() * 28, 7 + al() * 13, 0, 0, 6.2832); c.fill();
    }
  }
  if(carteC.biome === "hippie"){
    /* La prairie de nuit, éclairée par la fête. On peint la lumière
       AVANT tout le reste, en mode additif : une nuit d'où l'on
       n'aurait retiré que de la couleur serait sinistre. */
    var TEINTES = ["#ff4f9e", "#ffb43c", "#3fe0d8", "#9d6bff", "#8ee04a"];
    /* le voile de nuit : il refroidit TOUT le sol d'un coup, sable
       compris. Sans lui, la plage restait en plein jour au milieu
       d'une prairie de nuit. */
    c.save();
    c.globalAlpha = 0.40;
    c.fillStyle = "#1b1440";
    traceIle(c, 6, 0, 0); c.fill();
    c.restore();
    c.save();
    c.globalCompositeOperation = "lighter";
    /* les grandes nappes de scène, puis les petites flaques serrées :
       deux échelles, sinon la lumière fait une purée uniforme */
    for(i = 0; i < 26; i++){
      var ax2 = 4 + al() * (PLAGE_X0 - 6), ay2 = al() * GH;
      var pa = iso(ax2, ay2);
      var ra = 200 + al() * 190;
      var ta = TEINTES[(al() * 5) | 0];
      var ga = c.createRadialGradient(pa.x, pa.y, 4, pa.x, pa.y, ra);
      ga.addColorStop(0, rgba(ta, 0.20));
      ga.addColorStop(0.5, rgba(ta, 0.07));
      ga.addColorStop(1, rgba(ta, 0));
      c.fillStyle = ga;
      c.beginPath(); c.ellipse(pa.x, pa.y, ra, ra / 2, 0, 0, 6.2832); c.fill();
    }
    for(i = 0; i < 320; i++){
      var lx = 2 + al() * (PLAGE_X0 - 3), ly = al() * GH;
      var pl = iso(lx, ly);
      var rl = 26 + al() * 110;
      var tl = TEINTES[(al() * 5) | 0];
      var gl = c.createRadialGradient(pl.x, pl.y, 2, pl.x, pl.y, rl);
      gl.addColorStop(0, rgba(tl, 0.40));
      gl.addColorStop(0.42, rgba(tl, 0.13));
      gl.addColorStop(1, rgba(tl, 0));
      c.fillStyle = gl;
      c.beginPath(); c.ellipse(pl.x, pl.y, rl, rl / 2, 0, 0, 6.2832); c.fill();
    }
    c.restore();
    /* pistes de danse : l'herbe y est tassée, pâlie, et cerclée */
    c.save();
    for(i = 0; i < 34; i++){
      var dx2 = 6 + al() * (PLAGE_X0 - 10), dy2 = 3 + al() * (GH - 6);
      var pd = iso(dx2, dy2);
      var rd = 34 + al() * 54;
      c.globalAlpha = 0.16 + al() * 0.12;
      c.fillStyle = "#a89d78";
      c.beginPath(); c.ellipse(pd.x, pd.y, rd, rd / 2, 0, 0, 6.2832); c.fill();
      c.globalAlpha = 0.22;
      c.strokeStyle = "#c9bd93"; c.lineWidth = 2;
      c.beginPath(); c.ellipse(pd.x, pd.y, rd * 0.72, rd * 0.36, 0, 0, 6.2832); c.stroke();
    }
    c.restore();
    /* spirales peintes à même l'herbe, à la bombe */
    c.save();
    c.globalAlpha = 0.3; c.lineWidth = 2.6; c.lineCap = "round";
    for(i = 0; i < 130; i++){
      var sx2 = 4 + al() * (PLAGE_X0 - 8), sy2 = 2 + al() * (GH - 4);
      var ps = iso(sx2, sy2);
      var sens = al() < 0.5 ? 1 : -1;
      c.strokeStyle = TEINTES[(al() * 5) | 0];
      c.beginPath();
      for(var ks = 0; ks < 26; ks++){
        var an2 = ks * 0.52 * sens, rr3 = ks * 1.15;
        var xs = ps.x + Math.cos(an2) * rr3 * 2, ys = ps.y + Math.sin(an2) * rr3;
        if(ks === 0) c.moveTo(xs, ys); else c.lineTo(xs, ys);
      }
      c.stroke();
    }
    /* confettis */
    for(i = 0; i < 1800; i++){
      var cx3 = al() * PLAGE_X0, cy3 = al() * GH;
      var pc = iso(cx3, cy3);
      c.globalAlpha = 0.4 + al() * 0.4;
      c.fillStyle = TEINTES[(al() * 5) | 0];
      c.fillRect(pc.x, pc.y, 1.8 + al() * 1.6, 1.4);
    }
    c.restore();
  }
  if(carteC.biome === "sud"){
    /* De larges plaques de paille et d'ocre rouge, posées les
       premières : l'île entière au même beige donnait un désert, pas
       un été provençal. */
    c.save();
    for(i = 0; i < 70; i++){
      var tx2 = al() * PLAGE_X0, ty2 = al() * GH;
      var pt2 = iso(tx2, ty2);
      var rt = 150 + al() * 300;
      var gt = c.createRadialGradient(pt2.x, pt2.y, 6, pt2.x, pt2.y, rt);
      var ct = al() < 0.5 ? "#e8cf86" : "#c9a071";
      gt.addColorStop(0, rgba(ct, 0.26));
      gt.addColorStop(1, rgba(ct, 0));
      c.fillStyle = gt;
      c.beginPath(); c.ellipse(pt2.x, pt2.y, rt, rt / 2, 0, 0, 6.2832); c.fill();
    }
    c.restore();
    /* Les rangs de lavande, par parcelles : un champ qui couvrirait
       toute l'île se lirait comme une trame, pas comme un paysage.
       Le damier vaut mieux qu'un tirage libre : deux champs tirés au
       hasard finissaient par se chevaucher, et deux trames croisées
       font un tissu écossais, pas de la Provence. */
    var CX0 = LARGEUR_ROCHE + 2, CY0 = 2, CW = 25, CH = 21;
    var NCX = Math.floor((PLAGE_X0 - 5 - CX0) / CW), NCY = Math.floor((GH - 3 - CY0) / CH);
    c.save();
    c.lineCap = "butt";
    for(var cy2 = 0; cy2 < NCY; cy2++){
      for(var cx2 = 0; cx2 < NCX; cx2++){
        if(al() > 0.62) continue;                       // une parcelle sur trois reste en friche
        var qx = CX0 + cx2 * CW + 1.5, qy = CY0 + cy2 * CH + 1.5;
        var ql = CW - 3 - al() * 4, qh = CH - 3 - al() * 4;
        /* une parcelle sur deux est plantée dans l'autre sens : sans
           ça, toute l'île se lit comme un papier peint rayé */
        var travers = ((cx2 + cy2) % 2) === 1;
        var nr = travers ? ql : qh;
        for(var jr = 0.6; jr < nr; jr += 1.15){
          var r1, r2;
          if(travers){ r1 = iso(qx + jr, qy); r2 = iso(qx + jr, qy + qh); }
          else { r1 = iso(qx, qy + jr); r2 = iso(qx + ql, qy + jr); }
          /* la terre nue entre deux rangs : c'est ce blanc qui fait
             lire les rangs. Et le pointillé donne des touffes plutôt
             qu'un trait peint : un rang de lavande, ça se compte. */
          c.setLineDash([]);
          c.globalAlpha = 0.26;
          c.strokeStyle = "#f0e0b8"; c.lineWidth = 4.4;
          c.beginPath(); c.moveTo(r1.x, r1.y + 4); c.lineTo(r2.x, r2.y + 4); c.stroke();
          c.setLineDash([12, 5]);
          c.lineDashOffset = (jr * 37) % 17;
          c.globalAlpha = 0.55;
          c.strokeStyle = "#664496"; c.lineWidth = 5;
          c.beginPath(); c.moveTo(r1.x, r1.y); c.lineTo(r2.x, r2.y); c.stroke();
          c.globalAlpha = 0.34;
          c.strokeStyle = "#bb9ee8"; c.lineWidth = 1.7;
          c.beginPath(); c.moveTo(r1.x, r1.y - 2); c.lineTo(r2.x, r2.y - 2); c.stroke();
        }
        /* le chemin de terre qui borde la parcelle */
        c.setLineDash([]);
        c.globalAlpha = 0.28;
        c.strokeStyle = "#f4e8c8"; c.lineWidth = 7;
        var b1 = iso(qx - 0.9, qy - 0.9), b2 = iso(qx + ql + 0.9, qy - 0.9);
        var b3 = iso(qx + ql + 0.9, qy + qh + 0.9), b4 = iso(qx - 0.9, qy + qh + 0.9);
        c.beginPath();
        c.moveTo(b1.x, b1.y); c.lineTo(b2.x, b2.y); c.lineTo(b3.x, b3.y); c.lineTo(b4.x, b4.y);
        c.closePath(); c.stroke();
      }
    }
    c.setLineDash([]);
    c.restore();
    /* affleurements de calcaire : les dalles blanches qui percent la
       garrigue, et qui cassent l'ocre uniforme */
    c.save();
    for(i = 0; i < 420; i++){
      var kx = al() * PLAGE_X0, ky = al() * GH;
      var pk = iso(kx, ky);
      c.globalAlpha = 0.18 + al() * 0.16;
      c.fillStyle = al() < 0.5 ? "#f4eddc" : "#e2d8c2";
      c.beginPath(); c.ellipse(pk.x, pk.y, 8 + al() * 22, 4 + al() * 10, al() * 3, 0, 6.2832); c.fill();
      c.globalAlpha = 0.12;
      c.fillStyle = "#9a8a6c";
      c.beginPath(); c.ellipse(pk.x + 2, pk.y + 3, 7 + al() * 16, 3 + al() * 7, 0, 0, 6.2832); c.fill();
    }
    c.restore();
    /* terre craquelée entre les parcelles */
    c.save();
    c.globalAlpha = 0.2; c.strokeStyle = "#a2895c"; c.lineWidth = 1.2;
    for(i = 0; i < 900; i++){
      var fx2 = al() * PLAGE_X0, fy2 = al() * GH;
      if(matiereCase(fx2 | 0, fy2 | 0, gr).herbe > 0.4) continue;
      var pf = iso(fx2, fy2);
      c.beginPath();
      c.moveTo(pf.x, pf.y);
      for(var kf = 0; kf < 3; kf++){
        c.lineTo(pf.x + (al() - 0.5) * 26, pf.y + (al() - 0.5) * 13);
      }
      c.stroke();
    }
    c.restore();
    /* touffes de garrigue : petits coussins argentés, très éparpillés */
    c.save();
    c.globalAlpha = 0.26;
    for(i = 0; i < 2000; i++){
      var bx2 = al() * PLAGE_X0, by2 = al() * GH;
      var pb = iso(bx2, by2);
      c.fillStyle = al() < 0.5 ? "#9fae7e" : "#c3cba6";
      c.beginPath(); c.ellipse(pb.x, pb.y, 5 + al() * 9, 2.4 + al() * 4, 0, 0, 6.2832); c.fill();
    }
    c.restore();
  }
  /* touffes d'herbe éparses, partout où l'herbe domine */
  c.globalAlpha = 0.4;
  for(i = 0; i < 2600; i++){
    var hx = al() * GW, hy = al() * GH;
    var mm = matiereCase(hx | 0, hy | 0, gr);
    if(mm.herbe < 0.35) continue;
    var ph = iso(hx, hy);
    c.strokeStyle = al() < 0.5 ? M.herbe1 : M.herbe2;
    c.lineWidth = 1.2;
    for(var t = 0; t < 3; t++){
      c.beginPath();
      c.moveTo(ph.x + t * 1.6 - 1.6, ph.y);
      c.lineTo(ph.x + t * 2.2 - 2.6 + al() * 2, ph.y - 4 - al() * 4);
      c.stroke();
    }
  }
  c.restore();

  /* --- le bord de mer : rides, galets, coquillages, algues --- */
  c.save();
  traceIle(c, 3, 0, 0); c.clip();
  /* rides de vent parallèles au rivage */
  c.strokeStyle = "rgba(255,248,226,.24)"; c.lineWidth = 1.7;
  for(i = 0; i < 220; i++){
    var rx = PLAGE_X0 - 4 + al() * 17, ry0 = al() * GH;
    var q1 = iso(rx, ry0), q2 = iso(rx + 0.15 + al() * 0.5, ry0 + 3 + al() * 6);
    c.beginPath();
    c.moveTo(q1.x, q1.y);
    c.quadraticCurveTo((q1.x + q2.x) / 2 + 9, (q1.y + q2.y) / 2, q2.x, q2.y);
    c.stroke();
  }
  /* laisse de mer : ligne d'algues et de débris */
  c.strokeStyle = "rgba(96,110,64,.34)"; c.lineWidth = 3.4;
  for(i = 0; i < 150; i++){
    var ly = al() * GH;
    var lx = GW - 4.4 + al() * 1.6;
    var l1 = iso(lx, ly), l2 = iso(lx + 0.1, ly + 1.4 + al() * 2);
    c.beginPath(); c.moveTo(l1.x, l1.y); c.lineTo(l2.x, l2.y); c.stroke();
  }
  /* grains, galets, coquillages */
  for(i = 0; i < 2200; i++){
    var gx2 = PLAGE_X0 - 8 + al() * 20, gy2 = al() * GH;
    var pg = iso(gx2, gy2);
    var t2 = al();
    if(t2 < 0.6){
      c.fillStyle = "rgba(146,116,72,.28)";
      c.fillRect(pg.x, pg.y, 1.7, 1.2);
    }else if(t2 < 0.88){
      c.fillStyle = "rgba(255,252,240,.5)";
      c.beginPath(); c.ellipse(pg.x, pg.y, 1.8 + al() * 1.8, 1 + al(), al() * 3, 0, 6.2832); c.fill();
    }else{
      c.fillStyle = "rgba(120,110,96,.4)";
      c.beginPath(); c.ellipse(pg.x, pg.y, 2.4 + al() * 3, 1.4 + al() * 1.6, al() * 3, 0, 6.2832); c.fill();
      c.fillStyle = "rgba(255,255,255,.18)";
      c.beginPath(); c.ellipse(pg.x - 1, pg.y - 0.8, 1.2, 0.7, 0, 0, 6.2832); c.fill();
    }
  }
  c.restore();

  /* --- éboulis au pied des falaises --- */
  c.save();
  traceIle(c, 0, 0, 0); c.clip();
  for(i = 0; i < 1400; i++){
    var ex = al() * GW, ey = al() * GH;
    if(matiereCase(ex | 0, ey | 0, gr).roche < 0.25) continue;
    var pe = iso(ex, ey);
    var tt = al();
    c.fillStyle = tt < 0.5 ? "rgba(60,54,70,.34)" : "rgba(180,176,192,.26)";
    c.beginPath();
    c.ellipse(pe.x, pe.y, 2 + al() * 5, 1.2 + al() * 2.4, al() * 3, 0, 6.2832);
    c.fill();
  }
  c.restore();

  /* --- les falaises : elles ferment le nord, le sud et l'ouest.
         Elles sont cuites dans le sol : elles ne bougent jamais et
         aucune troupe ne peut passer devant. --- */
  var murs = (carteC.falaises || []).slice().sort(function(x, y){
    return (x.gx + x.gy) - (y.gx + y.gy);
  });
  for(i = 0; i < murs.length; i++) dessineFalaise(c, murs[i]);

  /* --- lisière ombrée le long du rivage --- */
  c.save();
  traceIle(c, 4, 0, 0); c.clip();
  c.globalAlpha = 0.22;
  c.strokeStyle = "#6b5030"; c.lineWidth = 20;
  traceIle(c, 0, 0, 0); c.stroke();
  c.restore();

  /* --- marquage de la zone de débarquement --- */
  c.save();
  c.globalAlpha = 0.14; c.fillStyle = "#ffffff";
  for(j = 8; j < GH - 8; j += 3){
    var z1 = iso(PLAGE_X0 + 1.5, j), z2 = iso(PLAGE_X0 + 1.5, j + 1.6);
    var z3 = iso(GW - 0.6, j + 1.6), z4 = iso(GW - 0.6, j);
    c.beginPath(); c.moveTo(z1.x, z1.y); c.lineTo(z2.x, z2.y); c.lineTo(z3.x, z3.y); c.lineTo(z4.x, z4.y);
    c.closePath(); c.fill();
  }
  c.restore();

  c.setTransform(1, 0, 0, 1, 0, 0);
  construitMotifEau(b);
  construitFaune(carteC.graine);
  construitIndexDecor(carteC);
}

/* ================================================================
   INDEX SPATIAL DU DÉCOR — pour n'envoyer au rendu que le visible
   ================================================================ */
var indexDecor = null, ID_PAS = 8, ID_W = 0, ID_H = 0, ID_X0 = -8, ID_Y0 = -8;
function construitIndexDecor(carteC){
  ID_X0 = -8; ID_Y0 = -8;
  ID_W = Math.ceil((GW + 16) / ID_PAS);
  ID_H = Math.ceil((GH + 16) / ID_PAS);
  indexDecor = [];
  for(var k = 0; k < ID_W * ID_H; k++) indexDecor.push([]);
  function range(gx, gy, obj){
    var cx = borne(Math.floor((gx - ID_X0) / ID_PAS), 0, ID_W - 1);
    var cy = borne(Math.floor((gy - ID_Y0) / ID_PAS), 0, ID_H - 1);
    indexDecor[cy * ID_W + cx].push(obj);
  }
  /* k vaut toujours 9 dans la pile de rendu ; tk dit de quoi il s'agit */
  carteC.decors.forEach(function(d){ range(d.gx, d.gy, { k:9, tk:0, o:d, d:d.gx + d.gy }); });
  carteC.rochers.forEach(function(r){ range(r.gx, r.gy, { k:9, tk:1, o:r, d:r.gx + r.gy }); });
  construitSpritesDecor(carteC.biome);
}
/* Ajoute à la pile de rendu tout le décor visible */
function decorVisible(vue, sortie){
  if(!indexDecor) return;
  /* boîte englobante du rectangle visible, en cases */
  var c1 = deIso(vue.x0, vue.y0), c2 = deIso(vue.x1, vue.y0);
  var c3 = deIso(vue.x1, vue.y1), c4 = deIso(vue.x0, vue.y1);
  var gx0 = Math.min(c1.gx, c2.gx, c3.gx, c4.gx) - 3;
  var gx1 = Math.max(c1.gx, c2.gx, c3.gx, c4.gx) + 3;
  var gy0 = Math.min(c1.gy, c2.gy, c3.gy, c4.gy) - 3;
  var gy1 = Math.max(c1.gy, c2.gy, c3.gy, c4.gy) + 6;
  var x0 = borne(Math.floor((gx0 - ID_X0) / ID_PAS), 0, ID_W - 1);
  var x1 = borne(Math.floor((gx1 - ID_X0) / ID_PAS), 0, ID_W - 1);
  var y0 = borne(Math.floor((gy0 - ID_Y0) / ID_PAS), 0, ID_H - 1);
  var y1 = borne(Math.floor((gy1 - ID_Y0) / ID_PAS), 0, ID_H - 1);
  for(var j = y0; j <= y1; j++){
    for(var i = x0; i <= x1; i++){
      var t = indexDecor[j * ID_W + i];
      for(var k = 0; k < t.length; k++) sortie.push(t[k]);
    }
  }
}
/* ---- sprites de décor : un blit par objet, et ça reste net au zoom ---- */
var SD_ECH = 1.3, SD_W = 128, SD_H = 132, SD_OX = 64, SD_OY = 104;
var spDecor = [], spRocher = [];
function nouveauSpriteDecor(dessin){
  var cv = nouveauCanvas(SD_W * SD_ECH, SD_H * SD_ECH);
  var c = cv.getContext("2d");
  c.setTransform(SD_ECH, 0, 0, SD_ECH, SD_OX * SD_ECH, SD_OY * SD_ECH);
  dessin(c);
  return cv;
}
function construitSpritesDecor(biome){
  spDecor = []; spRocher = [];
  /* 4 formes × 3 tailles pour la végétation */
  for(var v = 0; v < 4; v++){
    for(var t = 0; t < 3; t++){
      (function(v2, t2){
        spDecor.push(nouveauSpriteDecor(function(c){
          dessineDecor(c, biome, { gx:0, gy:0, v:v2, s:0.85 + t2 * 0.22 });
        }));
      })(v, t);
    }
  }
  /* 3 teintes × 4 formes × 2 tailles pour les rochers */
  for(var w = 0; w < 3; w++){
    for(var f = 0; f < 4; f++){
      for(var g = 0; g < 2; g++){
        (function(w2, f2, g2){
          spRocher.push(nouveauSpriteDecor(function(c){
            dessineRocher(c, 0, 0, 0.36 + g2 * 0.28, f2 * 1.57 + 0.4, w2);
          }));
        })(w, f, g);
      }
    }
  }
}
function dessineDecorMonde(c, it){
  var p = versEcran(cam, it.o.gx, it.o.gy);
  var z = cam.z, cv2;
  if(it.tk === 0){
    if(it.o.sp === undefined){
      var t = it.o.s < 1.0 ? 0 : (it.o.s < 1.18 ? 1 : 2);
      it.o.sp = (it.o.v % 4) * 3 + t;
    }
    cv2 = spDecor[it.o.sp];
  }else{
    if(it.o.sp === undefined){
      var f = (Math.abs(Math.round(it.o.s * 100)) % 4);
      it.o.sp = (it.o.v % 3) * 8 + f * 2 + (it.o.r < 0.5 ? 0 : 1);
    }
    cv2 = spRocher[it.o.sp];
  }
  if(!cv2) return;
  c.drawImage(cv2, p.x - SD_OX * z, p.y - SD_OY * z, SD_W * z, SD_H * z);
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
  }

  /* haut-fond : l'eau s'éclaircit en approchant de l'île */
  c.save();
  c.globalAlpha = 0.44;
  traceIle(c, 170, 0, 0); c.fillStyle = b.fond; c.fill();
  c.globalAlpha = 0.5;
  traceIle(c, 52, 0, 0); c.fillStyle = b.basFond; c.fill();
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
