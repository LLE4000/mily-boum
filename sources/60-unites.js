/* ================================================================
   LES UNITÉS DU JOUEUR — la Meuf et le Mec
   Dessinées en vecteur, repère local : les pieds sont en (0,0),
   l'unité monte vers les y négatifs. Lumière en haut à gauche.
   ================================================================ */

/* Palettes relevées sur les références :
   la Meuf porte un ensemble blanc et noir sous un plastron sombre,
   le Mec un gilet tactique olive sur un tee-shirt sombre. */
var C_MEUF = {
  cheveux:"#151119", cheveux2:"#3a3147", reflet:"#6a5a86",
  peau:"#f4e0ca", peauO:"#d6b493",
  tenue:"#f2ede4", tenueO:"#c9c1b4",
  plastron:"#2c2c33", plastronC:"#4d4d58", plastronO:"#16161b",
  sangle:"#1b1b20", boucle:"#9a9aa4",
  arme:"#34353c", armeC:"#60626c", armeO:"#17181c", lueur:"#7de6ff",
  botte:"#1d1d24", pantalon:"#27272e", accent:"#c8a24a"
};
var C_MEC = {
  peau:"#dfb083", peauO:"#b7845a", ombreM:"#96683f",
  barbe:"#6d4f2e", cheveux:"#a8834c",
  tee:"#2c2c30", teeO:"#191a1c",
  gilet:"#6b6244", giletC:"#8f8562", giletO:"#403b28",
  casque:"#7a7154", casqueC:"#9e9472", casqueO:"#48432e",
  gantelet:"#26261f", arme:"#3d3d36", armeC:"#6e6e63", armeO:"#191914",
  pantalon:"#3a3a32", botte:"#22221f", laiton:"#d3a94e"
};

/* ---------------------------------------------------------------
   Cache de dégradés.
   Les couleurs et les coordonnées locales d'un soldat ne changent
   jamais : à 120 unités, en recréer une demi-douzaine par unité et par
   image faisait ~600 CanvasGradient et autant de parsages de chaînes
   hexadécimales à chaque frame. Un CanvasGradient est résolu dans le
   repère courant AU MOMENT du remplissage : on peut donc le construire
   une fois en coordonnées locales et le réutiliser partout.
   --------------------------------------------------------------- */
var cacheDeg = {};
function degCache(c, cle, fabrique){
  var g = cacheDeg[cle];
  if(!g){ g = fabrique(); cacheDeg[cle] = g; }
  return g;
}
function videCacheDegrades(){ cacheDeg = {}; }

/* Cycle de marche : renvoie les décalages des membres */
function pose(phase, ampleur){
  var s = Math.sin(phase), c2 = Math.cos(phase);
  return {
    jambeA: s * ampleur, jambeB: -s * ampleur,
    brasA: -s * ampleur * 0.7, brasB: s * ampleur * 0.7,
    rebond: Math.abs(c2) * (ampleur * 0.16), incl: s * 0.03
  };
}

/* ---------------------------------------------------------------
   LA MEUF — silhouette fine, longue chevelure noire, gros fusil
   coiffure : 0 longue lâchée, 1 queue haute, 2 chignon
   --------------------------------------------------------------- */
function dessineMeuf(c, phase, coiffure, tir){
  var C = C_MEUF;
  var p = pose(phase, 4.0);
  var yb = -p.rebond;
  var sw = Math.sin(phase + 1.9) * 1.2;      /* balancement des cheveux */

  c.fillStyle = "rgba(0,0,0,.26)";
  c.beginPath(); c.ellipse(0, 0, 7.0, 3.0, 0, 0, 6.2832); c.fill();

  c.save();
  c.translate(0, yb);
  c.lineCap = "round";

  /* --- jambes : legging + botte haute, cuisse galbée --- */
  function jambe(dx, devant){
    var kx = dx * 0.55, ky = -7.4;
    c.strokeStyle = devant ? C.pantalon : ecl(C.pantalon, 0.72);
    c.lineWidth = 3.5;
    c.beginPath();
    c.moveTo(dx * 0.10, -13.0);
    c.quadraticCurveTo(dx * 0.32, -10.2, kx, ky);
    c.stroke();
    c.strokeStyle = devant ? C.botte : ecl(C.botte, 0.8);
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(kx, ky);
    c.quadraticCurveTo(dx * 0.82, -4.8, dx, -2.0);
    c.stroke();
    c.fillStyle = devant ? C.botte : ecl(C.botte, 0.8);
    c.beginPath(); c.ellipse(dx + (dx > 0 ? 0.9 : -0.9), -1.2, 2.7, 1.6, 0, 0, 6.2832); c.fill();
  }
  jambe(p.jambeB * 0.9, false);
  jambe(p.jambeA * 0.9, true);

  c.save();
  c.rotate(p.incl);

  /* --- chevelure arrière, longue, avec mouvement et reflet --- */
  if(coiffure === 0){
    c.fillStyle = C.cheveux;
    c.beginPath();
    c.moveTo(-3.2, -29.5);
    c.quadraticCurveTo(-7.4, -25, -6.8 + sw * 0.4, -22);
    c.quadraticCurveTo(-7.8 + sw, -16, -5.6 + sw, -12.2);
    c.lineTo(-3.6 + sw * 0.6, -13.4);
    c.lineTo(-3.9, -22);
    c.moveTo(3.2, -29.5);
    c.quadraticCurveTo(7.2, -25, 6.6 + sw * 0.4, -22);
    c.quadraticCurveTo(7.4 + sw, -16.5, 5.2 + sw, -12.8);
    c.lineTo(3.4 + sw * 0.6, -13.8);
    c.lineTo(3.9, -22);
    c.fill();
    /* reflet dans la masse */
    c.strokeStyle = rgba(C.reflet, 0.5); c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(-5.4, -24.5);
    c.quadraticCurveTo(-6.6 + sw * 0.7, -18, -4.9 + sw, -13.6);
    c.stroke();
  }else if(coiffure === 1){
    /* queue haute : longue mèche qui fouette dans le dos */
    c.fillStyle = C.cheveux;
    c.beginPath();
    c.moveTo(-0.8, -32.2);
    c.quadraticCurveTo(-6.6 + sw, -30.5, -7.8 + sw * 1.5, -24);
    c.quadraticCurveTo(-8.6 + sw * 2.2, -17.5, -6.0 + sw * 2.6, -13.6);
    c.quadraticCurveTo(-5.6 + sw * 1.6, -18.5, -4.6 + sw, -23);
    c.quadraticCurveTo(-3.2, -28.5, -0.8, -30.4);
    c.closePath(); c.fill();
    c.strokeStyle = rgba(C.reflet, 0.5); c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-5.6 + sw * 0.6, -28);
    c.quadraticCurveTo(-7.0 + sw * 1.6, -22, -5.9 + sw * 2.2, -15.6);
    c.stroke();
  }

  /* --- hanches --- */
  c.fillStyle = C.pantalon;
  c.beginPath(); c.ellipse(0, -13.4, 4.3, 2.5, 0, 0, 6.2832); c.fill();

  /* --- buste en sablier : haut clair, taille marquée --- */
  c.fillStyle = degCache(c, "v2MeufTop", function(){
    var g = c.createLinearGradient(-6, -25, 6, -14);
    g.addColorStop(0, "#ffffff"); g.addColorStop(0.5, C.tenue); g.addColorStop(1, C.tenueO);
    return g;
  });
  c.beginPath();
  c.moveTo(-5.3, -22.4);
  c.quadraticCurveTo(0, -25.2, 5.3, -22.4);
  c.quadraticCurveTo(4.6, -19.4, 2.9, -17.2);   /* taille droite */
  c.quadraticCurveTo(4.8, -15.4, 4.4, -13.6);   /* hanche droite */
  c.quadraticCurveTo(0, -12.6, -4.4, -13.6);
  c.quadraticCurveTo(-4.8, -15.4, -2.9, -17.2); /* taille gauche */
  c.quadraticCurveTo(-4.6, -19.4, -5.3, -22.4);
  c.closePath(); c.fill();

  /* --- plastron sombre, cintré --- */
  c.fillStyle = degCache(c, "v2MeufPlastron", function(){
    var g = c.createLinearGradient(-5, -23, 5, -15);
    g.addColorStop(0, C.plastronC); g.addColorStop(0.45, C.plastron); g.addColorStop(1, C.plastronO);
    return g;
  });
  c.beginPath();
  c.moveTo(-4.3, -21.8);
  c.quadraticCurveTo(0, -23.6, 4.3, -21.8);
  c.quadraticCurveTo(3.9, -19.0, 2.5, -17.0);
  c.quadraticCurveTo(0, -16.1, -2.5, -17.0);
  c.quadraticCurveTo(-3.9, -19.0, -4.3, -21.8);
  c.closePath(); c.fill();
  /* galbe de poitrine, discret */
  c.strokeStyle = "rgba(255,255,255,.20)"; c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(-3.4, -20.9); c.quadraticCurveTo(-1.9, -19.4, -0.5, -20.6);
  c.stroke();
  /* sangles + boucles lisibles */
  c.strokeStyle = C.sangle; c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(-4.0, -21.8); c.lineTo(2.4, -16.8);
  c.moveTo(4.0, -21.8); c.lineTo(-2.4, -16.8);
  c.stroke();
  c.fillStyle = C.boucle;
  c.fillRect(-1.1, -19.9, 2.2, 1.7);
  c.fillRect(-4.6, -21.7, 1.3, 1.3);
  c.fillRect(3.3, -21.7, 1.3, 1.3);
  /* ceinture sur la taille + boucle dorée */
  c.fillStyle = C.sangle;
  c.fillRect(-3.1, -17.2, 6.2, 1.6);
  c.fillStyle = C.accent;
  c.fillRect(-0.9, -17.3, 1.8, 1.8);
  /* liseré de lumière côté éclairé */
  c.strokeStyle = "rgba(255,255,255,.45)"; c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(-5.5, -21.2); c.quadraticCurveTo(-3.8, -24.2, 0.2, -24.8);
  c.stroke();

  /* --- le GROS fusil à lunette, en travers du corps --- */
  var ax, ay, aa;
  if(tir){ ax = 2.6; ay = -20.2; aa = -0.10; }
  else   { ax = 0.6; ay = -17.0; aa = -0.42; }
  var cs = Math.cos(aa), sn = Math.sin(aa);
  function enMonde(u, v){ return { x: ax + u * cs - v * sn, y: ay + u * sn + v * cs }; }
  var mainAvant = enMonde(6.8, 1.9);    /* main de soutien, sous le garde-main */
  var mainCrosse = enMonde(-3.6, 2.7);  /* main sur la poignée */

  /* bras arrière (gauche) vers la poignée */
  c.strokeStyle = C.tenueO; c.lineWidth = 2.3;
  c.beginPath();
  c.moveTo(-4.4, -21.2);
  c.quadraticCurveTo(-5.6, -17.6, mainCrosse.x, mainCrosse.y);
  c.stroke();

  c.save();
  c.translate(ax, ay); c.rotate(aa);
  /* crosse */
  c.fillStyle = C.armeO;
  c.beginPath();
  c.moveTo(-8.0, -1.9); c.lineTo(-12.6, -2.7); c.lineTo(-12.8, 2.9); c.lineTo(-8.0, 2.1);
  c.closePath(); c.fill();
  /* carcasse */
  c.fillStyle = degCache(c, "v2MeufFusil", function(){
    var g = c.createLinearGradient(0, -2.4, 0, 2.6);
    g.addColorStop(0, C.armeC); g.addColorStop(0.45, C.arme); g.addColorStop(1, C.armeO);
    return g;
  });
  c.beginPath();
  if(c.roundRect) c.roundRect(-8.4, -2.3, 17.6, 4.6, 1.3); else c.rect(-8.4, -2.3, 17.6, 4.6);
  c.fill();
  /* canon épais + frein de bouche */
  c.fillStyle = C.arme;
  c.fillRect(9.0, -1.5, 7.0, 3.0);
  c.fillStyle = C.armeO;
  c.fillRect(15.4, -2.0, 2.0, 4.0);
  /* lunette + pieds de montage + lentille */
  c.fillStyle = C.armeO;
  c.fillRect(-1.6, -3.2, 1.2, 1.2);
  c.fillRect(2.6, -3.2, 1.2, 1.2);
  c.fillStyle = C.arme;
  c.beginPath();
  if(c.roundRect) c.roundRect(-3.2, -5.4, 8.2, 2.5, 1.1); else c.rect(-3.2, -5.4, 8.2, 2.5);
  c.fill();
  c.strokeStyle = C.armeC; c.lineWidth = 0.6;
  c.beginPath(); c.moveTo(-2.8, -4.9); c.lineTo(4.2, -4.9); c.stroke();
  c.fillStyle = "rgba(125,230,255,.75)";
  c.fillRect(4.1, -4.9, 0.8, 1.6);
  /* chargeur incliné */
  c.fillStyle = C.armeO;
  c.beginPath();
  c.moveTo(0.6, 2.2); c.lineTo(3.4, 2.2); c.lineTo(3.0, 6.6); c.lineTo(-0.2, 6.4);
  c.closePath(); c.fill();
  c.fillStyle = C.armeC;
  c.fillRect(0.4, 2.2, 2.9, 0.7);
  /* poignée */
  c.fillStyle = C.armeO;
  c.beginPath();
  c.moveTo(-4.4, 2.0); c.lineTo(-2.4, 2.0); c.lineTo(-2.0, 5.0); c.lineTo(-4.0, 5.2);
  c.closePath(); c.fill();
  /* liseré d'accent cyan le long de la carcasse */
  c.fillStyle = rgba(C.lueur, 0.55);
  c.fillRect(-6.8, 0.1, 14.6, 0.6);
  /* bouche + lueur cyan */
  c.fillStyle = "#0f1014";
  c.beginPath(); c.ellipse(17.3, 0, 1.0, 1.9, 0, 0, 6.2832); c.fill();
  c.save();
  c.globalCompositeOperation = "lighter";
  c.fillStyle = degCache(c, "v2MeufLueur" + (tir ? 1 : 0), function(){
    var g = c.createRadialGradient(17.3, 0, 0.4, 17.3, 0, tir ? 10 : 3.6);
    g.addColorStop(0, rgba(C.lueur, tir ? 0.95 : 0.5));
    g.addColorStop(1, rgba(C.lueur, 0));
    return g;
  });
  c.beginPath(); c.arc(17.3, 0, tir ? 10 : 3.6, 0, 6.2832); c.fill();
  c.restore();
  c.restore();

  /* bras avant (droit) vers le garde-main, puis les deux mains */
  c.strokeStyle = C.tenue; c.lineWidth = 2.3;
  c.beginPath();
  c.moveTo(4.5, -21.2);
  c.quadraticCurveTo(6.6, -20.8, mainAvant.x, mainAvant.y);
  c.stroke();
  c.fillStyle = C.peau;
  c.beginPath(); c.arc(mainAvant.x, mainAvant.y, 1.4, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(mainCrosse.x, mainCrosse.y, 1.3, 0, 6.2832); c.fill();

  /* --- tête --- */
  c.save();
  c.translate(0, -27.6);
  /* calotte arrière */
  c.fillStyle = C.cheveux;
  c.beginPath(); c.ellipse(-0.1, -0.3, 4.5, 4.7, 0, 0, 6.2832); c.fill();
  /* visage fin */
  c.fillStyle = degCache(c, "v2MeufVisage", function(){
    var g = c.createRadialGradient(-1.2, -1.4, 0.5, 0, 0, 4.4);
    g.addColorStop(0, ecl(C.peau, 1.05)); g.addColorStop(1, C.peauO);
    return g;
  });
  c.beginPath();
  c.moveTo(-3.5, -1.6);
  c.quadraticCurveTo(-3.6, 2.2, 0.2, 4.0);   /* menton fin */
  c.quadraticCurveTo(3.8, 2.2, 3.7, -1.6);
  c.quadraticCurveTo(3.4, -4.4, 0.1, -4.5);
  c.quadraticCurveTo(-3.2, -4.4, -3.5, -1.6);
  c.closePath(); c.fill();
  /* yeux en amande + éclat */
  c.fillStyle = "#1e1822";
  c.beginPath(); c.ellipse(-1.5, 0.3, 0.95, 0.6, 0.10, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(1.8, 0.3, 0.95, 0.6, -0.10, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,255,255,.75)";
  c.beginPath(); c.arc(-1.7, 0.1, 0.26, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(1.6, 0.1, 0.26, 0, 6.2832); c.fill();
  /* sourcils fins */
  c.strokeStyle = "rgba(30,24,34,.7)"; c.lineWidth = 0.5;
  c.beginPath();
  c.moveTo(-2.4, -0.9); c.quadraticCurveTo(-1.5, -1.3, -0.6, -1.0);
  c.moveTo(2.7, -0.9); c.quadraticCurveTo(1.8, -1.3, 0.9, -1.0);
  c.stroke();
  /* bouche */
  c.strokeStyle = "rgba(178,84,84,.85)"; c.lineWidth = 0.65;
  c.beginPath(); c.moveTo(-0.3, 2.3); c.quadraticCurveTo(0.3, 2.8, 1.0, 2.3); c.stroke();
  /* frange, raie de côté, mèches encadrant le visage */
  c.fillStyle = C.cheveux;
  c.beginPath();
  c.moveTo(-4.4, 0.6);
  c.quadraticCurveTo(-4.9, -4.6, -0.6, -5.2);
  c.quadraticCurveTo(4.6, -5.4, 4.5, 0.2);
  c.quadraticCurveTo(4.0, -2.6, 2.6, -3.1);   /* mèche droite courte */
  c.quadraticCurveTo(1.4, -2.0, -0.8, -3.3);  /* frange balayée */
  c.quadraticCurveTo(-2.8, -3.5, -3.3, -0.8);
  c.quadraticCurveTo(-3.6, 0.6, -4.4, 0.6);
  c.closePath(); c.fill();
  /* mèche qui tombe devant l'épaule */
  c.beginPath();
  c.moveTo(4.4, -0.4);
  c.quadraticCurveTo(4.9, 3.0, 3.7, 5.6);
  c.quadraticCurveTo(3.2, 3.0, 3.4, 0.4);
  c.closePath(); c.fill();
  /* coiffures */
  if(coiffure === 1){
    /* attache de la queue haute */
    c.beginPath(); c.ellipse(-0.9, -4.6, 1.7, 1.3, -0.4, 0, 6.2832); c.fill();
    c.fillStyle = C.accent;
    c.fillRect(-1.8, -5.1, 1.4, 1.0);
  }else if(coiffure === 2){
    c.beginPath(); c.arc(-0.3, -5.5, 2.4, 0, 6.2832); c.fill();
    c.fillStyle = C.cheveux2;
    c.beginPath(); c.arc(-1.0, -6.1, 1.0, 0, 6.2832); c.fill();
    c.fillStyle = C.accent;
    c.fillRect(-1.1, -3.9, 1.7, 0.8);
  }
  /* reflet anime sur le dessus */
  c.strokeStyle = "rgba(190,175,220,.4)"; c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(-3.2, -3.2); c.quadraticCurveTo(-1.4, -4.6, 1.2, -4.4);
  c.stroke();
  c.restore();

  c.restore();
  c.restore();
}

/* ---------------------------------------------------------------
   LE MEC — grand, épais, casqué, gilet tactique et fusil
   --------------------------------------------------------------- */
function dessineMec(c, phase, variante, tir){
  var C = C_MEC;
  var p = pose(phase, 5.4);
  var yb = -p.rebond * 0.7;

  c.fillStyle = "rgba(0,0,0,.30)";
  c.beginPath(); c.ellipse(0, 0, 10.2, 4.2, 0, 0, 6.2832); c.fill();

  c.save();
  c.translate(0, yb);
  c.lineCap = "round";

  /* --- jambes épaisses, genouillères --- */
  function jambe(dx, devant){
    c.strokeStyle = devant ? C.pantalon : ecl(C.pantalon, 0.74);
    c.lineWidth = 5.6;
    c.beginPath();
    c.moveTo(dx * 0.2, -16);
    c.quadraticCurveTo(dx * 0.6, -9, dx, -3);
    c.stroke();
    c.fillStyle = devant ? C.botte : ecl(C.botte, 0.82);
    c.beginPath(); c.ellipse(dx + (dx > 0 ? 1 : -1), -1.6, 4.1, 2.4, 0, 0, 6.2832); c.fill();
    c.fillStyle = devant ? C.casqueO : ecl(C.casqueO, 0.8);
    c.beginPath(); c.ellipse(dx * 0.62, -8.8, 2.0, 1.7, 0, 0, 6.2832); c.fill();
  }
  jambe(p.jambeB * 0.8, false);
  jambe(p.jambeA * 0.8, true);

  c.save();
  c.rotate(p.incl * 0.6);

  /* --- torse en V : épaules très larges, tee moulant --- */
  c.fillStyle = degCache(c, "v2MecTee", function(){
    var g = c.createLinearGradient(-10, -29, 10, -16);
    g.addColorStop(0, ecl(C.tee, 1.35)); g.addColorStop(0.5, C.tee); g.addColorStop(1, C.teeO);
    return g;
  });
  c.beginPath();
  c.moveTo(-11.0, -26.2);
  c.quadraticCurveTo(0, -30.6, 11.0, -26.2);   /* ligne d'épaules */
  c.quadraticCurveTo(9.4, -20.6, 6.6, -16.4);  /* flanc droit en V */
  c.quadraticCurveTo(0, -14.8, -6.6, -16.4);
  c.quadraticCurveTo(-9.4, -20.6, -11.0, -26.2);
  c.closePath(); c.fill();
  /* trapèzes marqués sous la nuque */
  c.strokeStyle = "rgba(0,0,0,.28)"; c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(-8.2, -26.6); c.quadraticCurveTo(-4.6, -28.6, -2.6, -27.8);
  c.moveTo(8.2, -26.6); c.quadraticCurveTo(4.6, -28.6, 2.6, -27.8);
  c.stroke();

  /* --- gilet pare-balles à CHARGEURS --- */
  c.fillStyle = degCache(c, "v2MecGilet", function(){
    var g = c.createLinearGradient(-8, -27, 8, -16);
    g.addColorStop(0, C.giletC); g.addColorStop(0.5, C.gilet); g.addColorStop(1, C.giletO);
    return g;
  });
  c.beginPath();
  c.moveTo(-7.6, -26.4);
  c.quadraticCurveTo(0, -28.8, 7.6, -26.4);
  c.quadraticCurveTo(7.2, -20.4, 5.6, -16.2);
  c.quadraticCurveTo(0, -14.9, -5.6, -16.2);
  c.quadraticCurveTo(-7.2, -20.4, -7.6, -26.4);
  c.closePath(); c.fill();
  /* épaulières du gilet */
  c.fillStyle = C.giletO;
  c.fillRect(-7.4, -27.4, 3.4, 2.2);
  c.fillRect(4.0, -27.4, 3.4, 2.2);
  /* trois chargeurs sur le torse, laiton visible */
  c.fillStyle = C.armeO;
  c.fillRect(-5.3, -24.8, 3.0, 4.6);
  c.fillRect(-1.5, -24.8, 3.0, 4.6);
  c.fillRect(2.3, -24.8, 3.0, 4.6);
  c.fillStyle = C.laiton;
  c.fillRect(-4.9, -24.5, 2.2, 1.0);
  c.fillRect(-1.1, -24.5, 2.2, 1.0);
  c.fillRect(2.7, -24.5, 2.2, 1.0);
  /* élastiques des chargeurs */
  c.strokeStyle = "rgba(24,22,14,.75)"; c.lineWidth = 0.7;
  c.beginPath();
  c.moveTo(-5.3, -22.4); c.lineTo(-2.3, -22.4);
  c.moveTo(-1.5, -22.4); c.lineTo(1.5, -22.4);
  c.moveTo(2.3, -22.4); c.lineTo(5.3, -22.4);
  c.stroke();
  /* poche basse + sangle de taille */
  c.fillStyle = C.giletO;
  c.fillRect(-3.2, -18.0, 6.4, 2.4);
  c.strokeStyle = "rgba(24,22,14,.6)"; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(-6.4, -18.9); c.lineTo(6.4, -18.9); c.stroke();
  /* radio d'épaule + antenne */
  c.fillStyle = C.gantelet;
  c.fillRect(-7.2, -26.6, 2.0, 2.8);
  c.strokeStyle = C.gantelet; c.lineWidth = 0.7;
  c.beginPath(); c.moveTo(-6.8, -26.6); c.lineTo(-7.6, -30.2); c.stroke();
  /* cou */
  c.fillStyle = C.peauO;
  c.beginPath(); c.ellipse(0.2, -28.0, 3.0, 2.0, 0, 0, 6.2832); c.fill();

  /* --- l'arme : grosse, courte, canon épais --- */
  var ax, ay, aa;
  if(tir){ ax = 1.8; ay = -20.4; aa = 0.03; }
  else   { ax = 1.2; ay = -19.2; aa = 0.27; }
  var cs = Math.cos(aa), sn = Math.sin(aa);
  function enMonde(u, v){ return { x: ax + u * cs - v * sn, y: ay + u * sn + v * cs }; }
  var mainAvant = enMonde(5.4, 1.6);
  var mainCrosse = enMonde(-3.0, 2.4);

  /* bras arrière (gauche) : deltoïde nu et musclé, avant-bras vers l'arme */
  c.strokeStyle = C.peauO; c.lineWidth = 4.0;
  c.beginPath();
  c.moveTo(-9.0, -24.6);
  c.quadraticCurveTo(-10.0 + p.brasB * 0.4, -20.0, mainCrosse.x, mainCrosse.y);
  c.stroke();
  c.fillStyle = C.peauO;
  c.beginPath(); c.ellipse(-9.3, -24.6, 2.4, 2.9, -0.30, 0, 6.2832); c.fill();
  c.fillStyle = C.teeO;
  c.beginPath(); c.ellipse(-8.2, -26.3, 2.0, 1.3, -0.42, 0, 6.2832); c.fill();

  c.save();
  c.translate(ax, ay); c.rotate(aa);
  /* crosse repliée / plaque d'épaule */
  c.fillStyle = C.armeO;
  c.fillRect(-9.8, -1.6, 3.0, 4.2);
  /* carcasse trapue */
  c.fillStyle = degCache(c, "v2MecArme", function(){
    var g = c.createLinearGradient(0, -2.4, 0, 2.6);
    g.addColorStop(0, ecl(C.armeC, 1.15)); g.addColorStop(0.4, C.arme); g.addColorStop(1, C.armeO);
    return g;
  });
  c.beginPath();
  if(c.roundRect) c.roundRect(-7.4, -2.4, 14.2, 4.8, 1.3); else c.rect(-7.4, -2.4, 14.2, 4.8);
  c.fill();
  /* canon TRÈS épais + bouche large */
  c.fillStyle = ecl(C.arme, 1.3);
  c.fillRect(6.2, -1.8, 4.8, 3.6);
  c.fillStyle = C.armeO;
  c.fillRect(10.4, -2.2, 1.8, 4.4);
  /* rail + viseur */
  c.fillStyle = C.armeO;
  c.fillRect(-4.8, -3.3, 8.0, 1.1);
  c.fillStyle = ecl(C.armeC, 1.2);
  c.fillRect(1.6, -4.3, 1.6, 1.2);
  /* arête de lumière le long de la carcasse */
  c.fillStyle = "rgba(255,255,255,.18)";
  c.fillRect(-6.6, -2.0, 12.6, 0.7);
  /* gros chargeur tambour */
  c.fillStyle = C.armeO;
  c.beginPath(); c.arc(0.6, 3.2, 2.6, 0, 6.2832); c.fill();
  c.fillStyle = C.armeC;
  c.beginPath(); c.arc(0.6, 3.2, 1.1, 0, 6.2832); c.fill();
  /* poignée avant */
  c.fillStyle = C.gantelet;
  c.fillRect(4.6, 2.2, 1.6, 2.6);
  c.fillStyle = "#0f1010";
  c.beginPath(); c.ellipse(11.4, 0, 1.0, 1.8, 0, 0, 6.2832); c.fill();
  if(tir){
    c.save();
    c.globalCompositeOperation = "lighter";
    c.fillStyle = degCache(c, "v2MecBouche", function(){
      var g = c.createRadialGradient(12.0, 0, 0.4, 12.0, 0, 9);
      g.addColorStop(0, "rgba(255,232,170,.95)");
      g.addColorStop(1, "rgba(255,120,30,0)");
      return g;
    });
    c.beginPath(); c.arc(12.0, 0, 9, 0, 6.2832); c.fill();
    c.restore();
  }
  c.restore();

  /* bras avant (droit) : deltoïde nu et musclé */
  c.strokeStyle = C.peau; c.lineWidth = 4.0;
  c.beginPath();
  c.moveTo(9.0, -24.6);
  c.quadraticCurveTo(9.8 + p.brasA * 0.4, -20.4, mainAvant.x, mainAvant.y);
  c.stroke();
  c.fillStyle = C.peau;
  c.beginPath(); c.ellipse(9.3, -24.6, 2.4, 2.9, 0.30, 0, 6.2832); c.fill();
  /* relief du deltoïde / biceps */
  c.strokeStyle = "rgba(120,70,40,.4)"; c.lineWidth = 0.7;
  c.beginPath(); c.moveTo(10.2, -23.2); c.quadraticCurveTo(10.8, -21.4, 9.4, -19.6); c.stroke();
  /* liseré de manche moulante sur l'épaule */
  c.fillStyle = C.tee;
  c.beginPath(); c.ellipse(8.2, -26.3, 2.0, 1.3, 0.42, 0, 6.2832); c.fill();
  /* gants */
  c.fillStyle = C.gantelet;
  c.beginPath(); c.arc(mainAvant.x, mainAvant.y, 1.8, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(mainCrosse.x, mainCrosse.y, 1.7, 0, 6.2832); c.fill();

  /* --- tête : mâchoire carrée, barbe, casque à jugulaire --- */
  c.save();
  c.translate(0.4, -32.6);
  c.fillStyle = degCache(c, "v2MecVisage", function(){
    var g = c.createRadialGradient(-1.6, -1.6, 0.5, 0, 0, 5.2);
    g.addColorStop(0, ecl(C.peau, 1.07)); g.addColorStop(1, C.peauO);
    return g;
  });
  c.beginPath();
  c.moveTo(-4.4, -2.0);
  c.lineTo(-4.2, 2.2);
  c.quadraticCurveTo(-2.6, 4.8, 0, 4.9);   /* mâchoire carrée */
  c.quadraticCurveTo(2.6, 4.8, 4.2, 2.2);
  c.lineTo(4.4, -2.0);
  c.quadraticCurveTo(3.6, -4.8, 0, -4.9);
  c.quadraticCurveTo(-3.6, -4.8, -4.4, -2.0);
  c.closePath(); c.fill();
  /* barbe selon variante */
  if(variante !== 1){
    c.fillStyle = variante === 2 ? ecl(C.barbe, 0.62) : C.barbe;
    c.beginPath();
    c.moveTo(-4.2, 0.6);
    c.quadraticCurveTo(-3.4, 4.6, 0, 4.9);
    c.quadraticCurveTo(3.4, 4.6, 4.2, 0.6);
    c.quadraticCurveTo(2.2, 2.4, 0, 2.4);
    c.quadraticCurveTo(-2.2, 2.4, -4.2, 0.6);
    c.closePath(); c.fill();
  }else{
    /* rasé : ombre de barbe naissante */
    c.fillStyle = "rgba(90,64,40,.28)";
    c.beginPath();
    c.moveTo(-4.0, 1.2);
    c.quadraticCurveTo(-2.8, 4.4, 0, 4.6);
    c.quadraticCurveTo(2.8, 4.4, 4.0, 1.2);
    c.quadraticCurveTo(0, 3.4, -4.0, 1.2);
    c.closePath(); c.fill();
  }
  if(variante === 2){
    c.fillStyle = "rgba(40,58,42,.6)";
    c.fillRect(-3.6, 0.9, 1.9, 0.8);
    c.fillRect(1.7, 0.9, 1.9, 0.8);
  }
  /* regard déterminé : sourcils lourds, yeux clairs */
  c.fillStyle = "#26313b";
  c.fillRect(-2.8, -0.9, 1.7, 1.1);
  c.fillRect(1.1, -0.9, 1.7, 1.1);
  c.fillStyle = "rgba(190,220,240,.85)";
  c.fillRect(-2.6, -0.8, 0.7, 0.8);
  c.fillRect(1.3, -0.8, 0.7, 0.8);
  c.strokeStyle = "#3c2f1e"; c.lineWidth = 1.0;
  c.beginPath();
  c.moveTo(-3.2, -2.1); c.lineTo(-0.9, -1.5);
  c.moveTo(3.2, -2.1); c.lineTo(0.9, -1.5);
  c.stroke();
  /* nez */
  c.strokeStyle = rgba(C.ombreM, 0.6); c.lineWidth = 0.6;
  c.beginPath(); c.moveTo(0.1, -0.4); c.lineTo(0.3, 1.2); c.stroke();
  /* casque solide, bord net */
  c.fillStyle = degCache(c, "v2MecCasque", function(){
    var g = c.createLinearGradient(-5, -8, 5, -2);
    g.addColorStop(0, C.casqueC); g.addColorStop(0.55, C.casque); g.addColorStop(1, C.casqueO);
    return g;
  });
  c.beginPath();
  c.moveTo(-5.6, -1.4);
  c.quadraticCurveTo(-6.2, -8.2, 0, -8.4);
  c.quadraticCurveTo(6.2, -8.2, 5.6, -1.4);
  c.lineTo(4.6, -2.6);
  c.quadraticCurveTo(0, -3.8, -4.6, -2.6);
  c.closePath(); c.fill();
  /* bord du casque en ombre */
  c.strokeStyle = C.casqueO; c.lineWidth = 1.0;
  c.beginPath(); c.moveTo(-5.2, -2.0); c.quadraticCurveTo(0, -3.4, 5.2, -2.0); c.stroke();
  /* cache-oreilles */
  c.fillStyle = C.casqueO;
  c.fillRect(-5.8, -3.0, 2.1, 2.8);
  c.fillRect(3.7, -3.0, 2.1, 2.8);
  /* variante 1 : lunettes remontées sur le casque */
  if(variante === 1){
    c.fillStyle = "rgba(24,22,14,.9)";
    c.fillRect(-4.6, -6.2, 9.2, 1.1);
    c.fillStyle = "#87b3c9";
    c.fillRect(-2.6, -6.6, 2.2, 1.7);
    c.fillRect(0.6, -6.6, 2.2, 1.7);
  }
  /* reflet du casque */
  c.strokeStyle = "rgba(255,255,255,.32)"; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(-4.6, -4.8); c.quadraticCurveTo(-2.4, -7.4, 0.8, -7.6); c.stroke();
  /* JUGULAIRE bien lisible, bouclée sous le menton */
  c.strokeStyle = "#2c2a1e"; c.lineWidth = 1.0;
  c.beginPath();
  c.moveTo(-4.9, -1.6); c.quadraticCurveTo(-4.2, 2.0, -1.4, 3.4);
  c.moveTo(4.9, -1.6); c.quadraticCurveTo(4.2, 2.0, 1.4, 3.4);
  c.stroke();
  c.fillStyle = "#8d8d80";
  c.fillRect(-0.9, 3.0, 1.6, 1.0);
  c.restore();

  c.restore();
  c.restore();
}

/* Aiguillage */
function dessineUnite(c, type, phase, variante, tir){
  /* L'Ogre vit dans son propre fichier (62-ogre.js) : il est trois fois
     plus grand que les deux autres et n'a rien en commun avec eux. Le
     garde-fou typeof le rend optionnel — si un jour on retire le
     fichier, le jeu tombe sur la Meuf au lieu de planter. */
  if(type === "ogre" && typeof dessineOgre === "function"){ dessineOgre(c, phase, variante, tir); return; }
  if(type === "mec") dessineMec(c, phase, variante, tir);
  else dessineMeuf(c, phase, variante, tir);
}

/* ---------------------------------------------------------------
   VIGNETTES GRISES DES AUTRES JOUEURS
   24 pré-rendus : 6 poses × 2 orientations × 2 types, désaturés une
   seule fois au niveau des pixels. Pas de ctx.filter : trop lent.
   --------------------------------------------------------------- */
/* La planche doit contenir l'OGRE, qui monte trois fois plus haut
   qu'une Meuf : dimensionnée sur les petits, elle lui coupait la tête
   et les épaules. L'origine descend d'autant. */
var VIG_W = 150, VIG_H = 168, VIG_OX = 75, VIG_OY = 152, VIG_ECH = 1.6;
var vignettes = null;
/* L'ordre fait foi : vignette() calcule son indice dessus. */
var VIG_TYPES = ["meuf", "mec", "ogre"];

function construitVignettesGrises(){
  vignettes = [];
  var types = VIG_TYPES;
  for(var ti = 0; ti < types.length; ti++){
    for(var dr = 0; dr < 2; dr++){
      for(var ph = 0; ph < 6; ph++){
        var cv = nouveauCanvas(VIG_W * VIG_ECH, VIG_H * VIG_ECH);
        var c = cv.getContext("2d");
        c.setTransform(VIG_ECH, 0, 0, VIG_ECH, VIG_OX * VIG_ECH, VIG_OY * VIG_ECH);
        if(dr === 0){ c.scale(-1, 1); }
        dessineUnite(c, types[ti], ph / 6 * 6.2832, ph % 3, false);
        /* désaturation au niveau des pixels */
        c.setTransform(1, 0, 0, 1, 0, 0);
        var img = c.getImageData(0, 0, cv.width, cv.height);
        var d = img.data;
        for(var i = 0; i < d.length; i += 4){
          if(d[i + 3] === 0) continue;
          var v = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
          v = v * 0.62 + 58;
          d[i] = d[i + 1] = d[i + 2] = v;
        }
        c.putImageData(img, 0, 0);
        vignettes.push(cv);
      }
    }
  }
}
function vignette(type, droite, phase){
  var ti = VIG_TYPES.indexOf(type);
  if(ti < 0) ti = 0;
  var dr = droite ? 1 : 0;
  var ph = Math.floor(((phase % 6.2832) + 6.2832) % 6.2832 / 6.2832 * 6) % 6;
  return vignettes[ti * 12 + dr * 6 + ph];
}

/* ---------------------------------------------------------------
   Dessin d'une unité du joueur, avec ses états
   --------------------------------------------------------------- */
function dessineUniteMonde(c, u, tps){
  var p = versEcran(cam, u.gx, u.gy);
  var z = cam.z;
  c.save();
  /* Postée sous Brouillard : on l'estompe. Le joueur doit deviner où
     sont ses troupes sans les voir nettement — c'est le pendant visuel
     du fait que les défenses, elles, ne les voient pas du tout. */
  if(u.cachee) c.globalAlpha = 0.42;
  c.translate(p.x, p.y);
  c.scale(z, z);
  if(!u.droite) c.scale(-1, 1);
  dessineUnite(c, u.t, u.phase, u.var, u.tir > 0);
  c.restore();

  /* brûlure : halo orange + fumée */
  if(u.brulure > 0){
    lueur(c, p.x, p.y - 14 * z, 15 * z, "#ff7a1e", 0.34);
    var ph = (tps * 1.3 + u.n * 0.31) % 1;
    bouffee(c, p.x + Math.sin(tps * 3 + u.n) * 3 * z, p.y - (18 + ph * 24) * z,
            (2.6 + ph * 5) * z, (1 - ph) * 0.28, "#4a4046");
  }
  /* ralentissement : flaque de glu ou anneau électrique */
  if(u.ralenti > 0){
    c.save();
    c.globalAlpha = 0.5;
    c.strokeStyle = u.ralentiType === "glu" ? "#8ec63f" : "#7de6ff";
    c.lineWidth = 1.6 * z;
    c.beginPath();
    c.ellipse(p.x, p.y, 9 * z, 4.5 * z, 0, 0, 6.2832);
    c.stroke();
    c.restore();
  }
  /* barre de vie si blessée */
  var fr = u.pv / u.pvMax;
  if(fr < 0.999 && z > 0.2) barreVie(c, p.x, p.y - 36 * z, 20 * z, fr);
}

/* Unité d'un autre joueur : vignette grise, même tri de profondeur */
function dessineUniteGrise(c, o){
  var p = versEcran(cam, o.gx, o.gy);
  var z = cam.z;
  var v = vignette(o.type, o.droite, o.phase);
  if(!v) return;
  c.drawImage(v, p.x - VIG_OX * z, p.y - VIG_OY * z, VIG_W * z, VIG_H * z);
}

/* ---------------------------------------------------------------
   LE FANTÔME
   --------------------------------------------------------------- */
function dessineFantome(c, f, tps){
  var p = versEcran(cam, f.gx, f.gy);
  var z = cam.z;
  var flot = Math.sin(tps * 1.8 + f.ph) * 4;
  c.save();
  c.translate(p.x, p.y - 26 * z + flot * z);
  c.scale(z, z);
  c.globalAlpha = 0.62;
  /* corps */
  var g = c.createLinearGradient(0, -20, 0, 14);
  g.addColorStop(0, "rgba(255,255,255,.92)");
  g.addColorStop(1, "rgba(190,210,255,.45)");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(-9, 6);
  c.quadraticCurveTo(-11, -18, 0, -19);
  c.quadraticCurveTo(11, -18, 9, 6);
  /* bas ondulé */
  for(var i = 0; i < 4; i++){
    var x0 = 9 - i * 4.5, x1 = 9 - (i + 1) * 4.5;
    var mid = (x0 + x1) / 2;
    c.quadraticCurveTo(mid, 6 + (i % 2 ? -4.5 : 4.5) + Math.sin(tps * 4 + i) * 1.4, x1, 6);
  }
  c.closePath(); c.fill();
  /* yeux et bouche */
  c.fillStyle = "#2a2434";
  c.beginPath(); c.ellipse(-3.4, -9, 1.6, 2.2, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(3.4, -9, 1.6, 2.2, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(0, -3.4, 2.0, 2.4, 0, 0, 6.2832); c.fill();
  c.restore();

  /* pseudo flottant */
  if(z > 0.18) texteCerne(c, f.nom, p.x, p.y - 56 * z + flot * z, Math.max(9, 11 * z), "#dfe8ff");
}
