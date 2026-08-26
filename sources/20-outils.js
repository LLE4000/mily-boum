/* ================================================================
   BOÎTE À OUTILS DE DESSIN
   Primitives isométriques et utilitaires de couleur.
   Convention : on dessine dans un repère local où l'origine est au
   sol du bâtiment, une case vaut TW×TH pixels, et l'axe Z monte.
   Lumière fixe en haut à gauche : dessus clair, face gauche à 55 %,
   face droite à 75 %.
   ================================================================ */

var RX = TW * Math.SQRT1_2;          // demi-largeur de l'ellipse d'un cercle de rayon 1
var RY = RX / 2;

function nouveauCanvas(w, h){
  var cv = document.createElement("canvas");
  cv.width = Math.max(1, Math.round(w));
  cv.height = Math.max(1, Math.round(h));
  return cv;
}

/* ---------------- couleurs ---------------- */
function versRgb(h){
  if(h.charAt(0) !== "#") return [128, 128, 128];
  if(h.length === 4) return [parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16), parseInt(h[3] + h[3], 16)];
  return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)];
}
function versHex(r, g, b){
  function d(v){ v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? "0" : "") + v.toString(16); }
  return "#" + d(r) + d(g) + d(b);
}
/* éclaircit (f>1) ou assombrit (f<1) une couleur */
function ecl(h, f){
  var c = versRgb(h);
  return versHex(c[0] * f, c[1] * f, c[2] * f);
}
/* mélange deux couleurs */
function melange(a, b, t){
  var x = versRgb(a), y = versRgb(b);
  return versHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
}
function rgba(h, a){
  var c = versRgb(h);
  return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
}
/* triplet de faces d'un même matériau */
function faces(base){
  return { t:ecl(base, 1.10), g:ecl(base, 0.55), d:ecl(base, 0.75) };
}

/* ---------------- primitives isométriques ---------------- */

/* Losange plein — dalle au sol (ou à hauteur z) */
function plaque(c, gx, gy, w, d, z, coul){
  var a = iso(gx - w / 2, gy - d / 2), b = iso(gx + w / 2, gy - d / 2);
  var e = iso(gx + w / 2, gy + d / 2), f = iso(gx - w / 2, gy + d / 2);
  c.fillStyle = coul;
  c.beginPath();
  c.moveTo(a.x, a.y - z); c.lineTo(b.x, b.y - z); c.lineTo(e.x, e.y - z); c.lineTo(f.x, f.y - z);
  c.closePath(); c.fill();
}

/* Ombre de contact : losange noir légèrement plus grand que l'emprise */
function ombreContact(c, gx, gy, w, d, alpha){
  c.save();
  c.globalAlpha = alpha === undefined ? 0.22 : alpha;
  c.fillStyle = "#000";
  var a = iso(gx - w / 2, gy - d / 2), b = iso(gx + w / 2, gy - d / 2);
  var e = iso(gx + w / 2, gy + d / 2), f = iso(gx - w / 2, gy + d / 2);
  c.beginPath();
  c.moveTo(a.x, a.y + 1); c.lineTo(b.x, b.y + 1); c.lineTo(e.x, e.y + 1); c.lineTo(f.x, f.y + 1);
  c.closePath(); c.fill();
  c.restore();
}
function ombreRonde(c, gx, gy, r, alpha){
  var p = iso(gx, gy);
  c.save();
  c.globalAlpha = alpha === undefined ? 0.24 : alpha;
  c.fillStyle = "#000";
  c.beginPath(); c.ellipse(p.x, p.y, r * RX, r * RY, 0, 0, 6.2832); c.fill();
  c.restore();
}

/* Parallélépipède : w×d cases d'emprise, hauteur h pixels au-dessus de z0 */
function boite(c, gx, gy, w, d, z0, h, cTop, cGauche, cDroite, sansLiseré){
  var a = iso(gx - w / 2, gy - d / 2);   // nord (haut)
  var b = iso(gx + w / 2, gy - d / 2);   // est  (droite)
  var e = iso(gx + w / 2, gy + d / 2);   // sud  (bas)
  var f = iso(gx - w / 2, gy + d / 2);   // ouest (gauche)
  var zt = z0 + h;

  /* face droite (gx+) */
  c.fillStyle = cDroite;
  c.beginPath();
  c.moveTo(b.x, b.y - zt); c.lineTo(e.x, e.y - zt); c.lineTo(e.x, e.y - z0); c.lineTo(b.x, b.y - z0);
  c.closePath(); c.fill();

  /* face gauche (gy+) */
  c.fillStyle = cGauche;
  c.beginPath();
  c.moveTo(e.x, e.y - zt); c.lineTo(f.x, f.y - zt); c.lineTo(f.x, f.y - z0); c.lineTo(e.x, e.y - z0);
  c.closePath(); c.fill();

  /* dessus */
  c.fillStyle = cTop;
  c.beginPath();
  c.moveTo(a.x, a.y - zt); c.lineTo(b.x, b.y - zt); c.lineTo(e.x, e.y - zt); c.lineTo(f.x, f.y - zt);
  c.closePath(); c.fill();

  /* arête lumineuse en haut à gauche */
  if(!sansLiseré && h > 2){
    c.strokeStyle = "rgba(255,246,225,.30)"; c.lineWidth = 1;
    c.beginPath();
    c.moveTo(f.x, f.y - zt); c.lineTo(a.x, a.y - zt); c.lineTo(b.x, b.y - zt);
    c.stroke();
  }
}

/* Prisme régulier à n côtés (plateformes octogonales, colonnes…) */
function prisme(c, gx, gy, r, n, rot, z0, h, cTop, cCote){
  var p = iso(gx, gy), pts = [], i;
  for(i = 0; i < n; i++){
    var a = rot + i / n * 6.2832;
    pts.push({ x:p.x + Math.cos(a) * r * RX, y:p.y + Math.sin(a) * r * RY });
  }
  var zt = z0 + h;
  /* côtés visibles : ceux dont l'arête descend vers le bas de l'écran */
  c.fillStyle = cCote;
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y - z0);
  for(i = 1; i < n; i++) c.lineTo(pts[i].x, pts[i].y - z0);
  c.closePath();
  for(i = n - 1; i >= 0; i--) c.lineTo(pts[i].x, pts[i].y - zt);
  c.fill();
  /* dégradé de volume */
  var g = c.createLinearGradient(p.x - r * RX, 0, p.x + r * RX, 0);
  g.addColorStop(0, "rgba(255,255,255,.13)");
  g.addColorStop(0.45, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,.26)");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y - z0);
  for(i = 1; i < n; i++) c.lineTo(pts[i].x, pts[i].y - z0);
  c.closePath();
  for(i = n - 1; i >= 0; i--) c.lineTo(pts[i].x, pts[i].y - zt);
  c.fill();
  /* dessus */
  c.fillStyle = cTop;
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y - zt);
  for(i = 1; i < n; i++) c.lineTo(pts[i].x, pts[i].y - zt);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(255,246,225,.22)"; c.lineWidth = 1;
  c.stroke();
}

/* Bandes d'avertissement jaunes et noires sur une dalle */
function bandesDanger(c, gx, gy, w, d, z, n){
  c.save();
  var a = iso(gx - w / 2, gy - d / 2), b = iso(gx + w / 2, gy - d / 2);
  var e = iso(gx + w / 2, gy + d / 2), f = iso(gx - w / 2, gy + d / 2);
  c.beginPath();
  c.moveTo(a.x, a.y - z); c.lineTo(b.x, b.y - z); c.lineTo(e.x, e.y - z); c.lineTo(f.x, f.y - z);
  c.closePath(); c.clip();
  c.fillStyle = "#e8c437";
  c.fillRect(a.x - 60, a.y - z - 60, 200, 200);
  c.fillStyle = "#1c1a18";
  c.save();
  c.translate(a.x, a.y - z); c.rotate(0.55);
  for(var i = -10; i < 14; i++) c.fillRect(i * 12, -120, 6, 260);
  c.restore();
  c.restore();
}

/* Cylindre vertical */
function cylindre(c, gx, gy, r, z0, h, cTop, cCote){
  var p = iso(gx, gy);
  var rx = r * RX, ry = r * RY;
  var zt = z0 + h;
  c.fillStyle = cCote;
  c.beginPath();
  c.moveTo(p.x - rx, p.y - zt);
  c.lineTo(p.x - rx, p.y - z0);
  c.ellipse(p.x, p.y - z0, rx, ry, 0, Math.PI, 0, true);
  c.lineTo(p.x + rx, p.y - zt);
  c.ellipse(p.x, p.y - zt, rx, ry, 0, 0, Math.PI, false);
  c.closePath(); c.fill();
  /* dégradé latéral pour le volume */
  var g = c.createLinearGradient(p.x - rx, 0, p.x + rx, 0);
  g.addColorStop(0, "rgba(255,255,255,.16)");
  g.addColorStop(0.38, "rgba(255,255,255,0)");
  g.addColorStop(1, "rgba(0,0,0,.28)");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(p.x - rx, p.y - zt);
  c.lineTo(p.x - rx, p.y - z0);
  c.ellipse(p.x, p.y - z0, rx, ry, 0, Math.PI, 0, true);
  c.lineTo(p.x + rx, p.y - zt);
  c.ellipse(p.x, p.y - zt, rx, ry, 0, 0, Math.PI, false);
  c.closePath(); c.fill();
  if(h > 0){
    c.fillStyle = cTop;
    c.beginPath(); c.ellipse(p.x, p.y - zt, rx, ry, 0, 0, 6.2832); c.fill();
  }
}

/* Cône (toit, tas, ogive) */
function cone3d(c, gx, gy, r, z0, h, cTop, cCote){
  var p = iso(gx, gy), rx = r * RX, ry = r * RY;
  c.fillStyle = cCote;
  c.beginPath();
  c.moveTo(p.x - rx, p.y - z0);
  c.lineTo(p.x, p.y - z0 - h);
  c.lineTo(p.x + rx, p.y - z0);
  c.ellipse(p.x, p.y - z0, rx, ry, 0, 0, Math.PI, false);
  c.closePath(); c.fill();
  c.fillStyle = cTop;
  c.beginPath();
  c.moveTo(p.x - rx, p.y - z0);
  c.lineTo(p.x, p.y - z0 - h);
  c.lineTo(p.x - rx * 0.15, p.y - z0 + ry * 0.55);
  c.closePath(); c.fill();
}

/* Sphère (avec modelé) */
function sphere(c, gx, gy, r, z, coul, lueur){
  var p = iso(gx, gy), rr = r * RX;
  var g = c.createRadialGradient(p.x - rr * 0.35, p.y - z - rr * 0.4, rr * 0.1, p.x, p.y - z, rr);
  g.addColorStop(0, ecl(coul, 1.7));
  g.addColorStop(0.55, coul);
  g.addColorStop(1, ecl(coul, 0.45));
  c.fillStyle = g;
  c.beginPath(); c.arc(p.x, p.y - z, rr, 0, 6.2832); c.fill();
  if(lueur){
    c.save(); c.globalCompositeOperation = "lighter";
    var g2 = c.createRadialGradient(p.x, p.y - z, rr * 0.3, p.x, p.y - z, rr * 2.4);
    g2.addColorStop(0, rgba(lueur, 0.5)); g2.addColorStop(1, rgba(lueur, 0));
    c.fillStyle = g2;
    c.beginPath(); c.arc(p.x, p.y - z, rr * 2.4, 0, 6.2832); c.fill();
    c.restore();
  }
}

/* Couronne de sacs de sable, légèrement irrégulière */
function sacs(c, gx, gy, r, z, n, c1, c2, graine){
  var al = prng(graine || 1234);
  var liste = [];
  for(var i = 0; i < n; i++){
    var a = i / n * 6.2832 + 0.2;
    var rr = r * (0.94 + al() * 0.14);
    liste.push({ x:gx + Math.cos(a) * rr, y:gy + Math.sin(a) * rr, s:0.82 + al() * 0.34, t:al() });
  }
  liste.sort(function(p, q){ return (p.x + p.y) - (q.x + q.y); });
  for(var k = 0; k < liste.length; k++){
    var s = liste[k], col = s.t > 0.5 ? c1 : c2;
    var f = faces(col);
    boite(c, s.x, s.y, 0.42 * s.s, 0.30 * s.s, z, 7 * s.s, f.t, f.g, f.d, true);
    /* couture */
    var p = iso(s.x, s.y);
    c.strokeStyle = "rgba(0,0,0,.18)"; c.lineWidth = 1;
    c.beginPath(); c.moveTo(p.x - 5 * s.s, p.y - z - 7 * s.s); c.lineTo(p.x + 5 * s.s, p.y - z - 7 * s.s); c.stroke();
  }
}

/* Créneaux sur une couronne */
function creneaux(c, gx, gy, r, z, n, cTop, cCote, taille){
  var liste = [];
  for(var i = 0; i < n; i++){
    var a = i / n * 6.2832;
    liste.push({ x:gx + Math.cos(a) * r, y:gy + Math.sin(a) * r });
  }
  liste.sort(function(p, q){ return (p.x + p.y) - (q.x + q.y); });
  for(var k = 0; k < liste.length; k++){
    boite(c, liste[k].x, liste[k].y, taille, taille, z, taille * 34, cTop, cCote, ecl(cCote, 1.25), true);
  }
}

/* Salissures : coulures verticales sombres sur une face métallique */
function salissures(c, x0, y0, larg, haut, n, graine){
  var al = prng(graine || 77);
  c.save(); c.globalAlpha = 0.08; c.fillStyle = "#000";
  for(var i = 0; i < n; i++){
    var x = x0 + al() * larg;
    var h = haut * (0.35 + al() * 0.6);
    c.fillRect(x, y0, 1 + al() * 1.6, h);
  }
  c.restore();
}

/* Lueur radiale additive.
   Le dégradé est pré-rendu une fois par teinte : à cinquante flammes
   par image, créer autant de dégradés coûterait bien plus cher. */
var spLueur = {};
function lueurRapide(c, x, y, r, coul, force){
  if(!(r > 0) || !(force > 0)) return;
  var s = spLueur[coul];
  if(!s){
    s = nouveauCanvas(128, 128);
    var g2 = s.getContext("2d");
    var gr = g2.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, rgba(coul, 1));
    gr.addColorStop(0.42, rgba(coul, 0.38));
    gr.addColorStop(1, rgba(coul, 0));
    g2.fillStyle = gr;
    g2.fillRect(0, 0, 128, 128);
    spLueur[coul] = s;
  }
  c.save();
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = Math.min(1, force);
  c.drawImage(s, x - r, y - r, r * 2, r * 2);
  c.restore();
}
function lueur(c, x, y, r, coul, force){
  lueurRapide(c, x, y, r, coul, force === undefined ? 0.55 : force);
}

/* ---------------------------------------------------------------
   FLAMME — quatre langues superposées, hauteur, dérive et scintillement
   pilotés par plusieurs sinusoïdes de fréquences premières entre elles :
   le mouvement ne se répète jamais à l'œil.
   --------------------------------------------------------------- */
var COUCHES_FLAMME = [
  { c:"#ff3208", a:0.62, s:1.00, d:0.0, w:5.4 },
  { c:"#ff8a1e", a:0.72, s:0.76, d:1.6, w:4.2 },
  { c:"#ffd464", a:0.80, s:0.50, d:3.0, w:2.8 },
  { c:"#fff8dc", a:0.72, s:0.27, d:4.4, w:1.6 }
];
/* att : atténuation d'opacité. Les très grands foyers se recouvrent ;
   sans elle, l'addition des couches sature le rendu en blanc. */
function flamme(c, x, y, h, t, ech, froide, att){
  ech = ech || 1;
  att = (att === undefined) ? 1 : att;
  /* battement : trois fréquences + une lente respiration */
  var vac = 0.80 + 0.16 * Math.sin(t * 7.3 + x * 0.05)
                 + 0.10 * Math.sin(t * 13.7 + 1.7)
                 + 0.06 * Math.sin(t * 23.1 + x * 0.11);
  var hh = h * vac;
  var derive = Math.sin(t * 5.1 + x * 0.03) * 1.8 * ech
             + Math.sin(t * 9.7 + 2.1) * 0.9 * ech;
  c.save();
  c.globalCompositeOperation = "lighter";
  for(var i = 0; i < 4; i++){
    var k = COUCHES_FLAMME[i];
    var ond = derive + Math.sin(t * 11 + k.d * 2.3) * 1.5 * ech;
    var hi = hh * k.s * (0.88 + Math.sin(t * 17 + k.d * 3.1) * 0.12);
    var w = k.w * ech * (froide ? 0.7 : 1);
    c.fillStyle = rgba(k.c, k.a * att);
    c.beginPath();
    c.moveTo(x - w, y);
    c.quadraticCurveTo(x - w * 1.25 + ond * 0.5, y - hi * 0.5, x + ond, y - hi);
    c.quadraticCurveTo(x + w * 1.25 + ond * 0.5, y - hi * 0.5, x + w, y);
    c.closePath(); c.fill();
  }
  /* une langue se détache et monte */
  var ph = (t * 1.9 + x * 0.017) % 1;
  c.fillStyle = "rgba(255,168,54," + ((1 - ph) * 0.42 * att) + ")";
  c.beginPath();
  c.ellipse(x + derive * 1.5, y - hh * (0.95 + ph * 0.75),
            2.6 * ech * (1 - ph * 0.5), 4.4 * ech * (1 - ph * 0.4), 0, 0, 6.2832);
  c.fill();
  c.restore();
  /* le halo est plafonné : sur les très grands foyers il coûtait un
     drawImage de plusieurs centaines de pixels de côté par flamme */
  lueurRapide(c, x, y - hh * 0.35, Math.min(hh * 1.9, 170), "#ff8a1e",
              (0.14 + vac * 0.10) * att);
}

/* Braises qui montent au-dessus d'un foyer */
function braises(c, x, y, t, n, ech, etendue){
  ech = ech || 1;
  etendue = etendue || 30;
  c.save();
  c.globalCompositeOperation = "lighter";
  for(var i = 0; i < n; i++){
    var ph = ((t * (0.30 + (i % 5) * 0.07) + i * 0.37) % 1);
    var dx = Math.sin(t * 1.7 + i * 2.3) * (6 + i % 7) * ech;
    var a = (1 - ph) * (1 - ph) * 0.85;
    var r = (0.7 + (i % 3) * 0.5) * ech * (1 - ph * 0.4);
    c.fillStyle = "rgba(255," + (140 + (i % 4) * 28) + ",50," + a + ")";
    c.beginPath();
    c.arc(x + dx, y - ph * etendue * ech, r, 0, 6.2832);
    c.fill();
  }
  c.restore();
}

/* Petite fumée qui monte */
function bouffee(c, x, y, r, a, coul){
  c.save();
  c.globalAlpha = a;
  c.fillStyle = coul || "#6a6068";
  c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(x - r * 0.55, y + r * 0.25, r * 0.65, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(x + r * 0.5, y + r * 0.2, r * 0.6, 0, 6.2832); c.fill();
  c.restore();
}

/* Texte à liseré, lisible sur n'importe quel fond */
function texteCerne(c, s, x, y, taille, coul, alignement, epais){
  c.save();
  c.font = "700 " + taille + "px 'Trebuchet MS', 'Segoe UI', Roboto, sans-serif";
  c.textAlign = alignement || "center";
  c.textBaseline = "middle";
  c.lineJoin = "round";
  c.lineWidth = epais || Math.max(2, taille * 0.28);
  c.strokeStyle = "rgba(8,4,12,.85)";
  c.strokeText(s, x, y);
  c.fillStyle = coul;
  c.fillText(s, x, y);
  c.restore();
}

/* Barre de vie flottante */
function barreVie(c, x, y, larg, frac, coul){
  var h = 3.6;
  c.fillStyle = "rgba(10,6,14,.72)";
  c.fillRect(x - larg / 2 - 1, y - 1, larg + 2, h + 2);
  c.fillStyle = coul || (frac > 0.5 ? "#6ee08a" : frac > 0.22 ? "#ffd070" : "#ff5a4a");
  c.fillRect(x - larg / 2, y, larg * Math.max(0, frac), h);
}
