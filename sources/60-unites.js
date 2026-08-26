/* ================================================================
   LES UNITÉS DU JOUEUR — la Meuf et le Mec
   Dessinées en vecteur, repère local : les pieds sont en (0,0),
   l'unité monte vers les y négatifs. Lumière en haut à gauche.
   ================================================================ */

/* Palettes relevées sur les références :
   la Meuf porte un ensemble blanc et noir sous un plastron sombre,
   le Mec un gilet tactique olive sur un tee-shirt sombre. */
var C_MEUF = {
  cheveux:"#17131c", cheveux2:"#2e2636", peau:"#f2ddc6", peauO:"#d5b492",
  tenue:"#efeae2", tenueO:"#c6bfb4",          // manches claires
  plastron:"#2b2b30", plastronC:"#4a4a52", plastronO:"#17171b",
  sangle:"#1c1c20", boucle:"#8d8d96",
  arme:"#33343a", armeC:"#5c5e66", armeO:"#191a1e", lueur:"#7de6ff",
  botte:"#1e1e24", pantalon:"#26262c", accent:"#c8a24a"
};
var C_MEC = {
  peau:"#dfb083", peauO:"#b7845a", barbe:"#7a5a34", cheveux:"#a8834c",
  tee:"#2a2a2c", teeO:"#18181a",
  gilet:"#6b6244", giletC:"#8d8360", giletO:"#443f2c",
  casque:"#7a7154", casqueC:"#9c9270", casqueO:"#4a452f",
  gantelet:"#2b2b2b", arme:"#35352f", armeC:"#5a5a52",
  pantalon:"#3a3a32", botte:"#232320", laiton:"#c9a24a"
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

  c.fillStyle = "rgba(0,0,0,.26)";
  c.beginPath(); c.ellipse(0, 0, 7.2, 3.1, 0, 0, 6.2832); c.fill();

  c.save();
  c.translate(0, yb);
  c.lineCap = "round";

  /* --- jambes --- */
  function jambe(dx, coul, coulB){
    c.strokeStyle = coul; c.lineWidth = 3.2;
    c.beginPath();
    c.moveTo(0, -13);
    c.quadraticCurveTo(dx * 0.5, -7.5, dx, -2.6);
    c.stroke();
    c.fillStyle = coulB;
    c.beginPath(); c.ellipse(dx + (dx > 0 ? 0.8 : -0.8), -1.4, 3.0, 1.9, 0, 0, 6.2832); c.fill();
  }
  jambe(p.jambeB * 0.9, ecl(C.pantalon, 0.78), ecl(C.botte, 0.85));
  jambe(p.jambeA * 0.9, C.pantalon, C.botte);

  c.save();
  c.rotate(p.incl);

  /* --- chevelure arrière, longue --- */
  c.fillStyle = C.cheveux;
  c.beginPath();
  c.moveTo(-4.4, -26);
  c.quadraticCurveTo(-8.2, -20, -7.6, -11);
  c.lineTo(-4.6, -12.6);
  c.lineTo(-3.4, -24);
  c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(4.4, -26);
  c.quadraticCurveTo(8.0, -20, 7.2, -12);
  c.lineTo(4.4, -13.4);
  c.lineTo(3.4, -24);
  c.closePath(); c.fill();

  /* --- buste : manches claires puis plastron sombre --- */
  c.fillStyle = degCache(c, "meufManches", function(){
    var g = c.createLinearGradient(-6, -24, 6, -14);
    g.addColorStop(0, "#ffffff"); g.addColorStop(0.5, C.tenue); g.addColorStop(1, C.tenueO);
    return g;
  });
  c.beginPath();
  c.moveTo(-5.2, -13.6);
  c.lineTo(-6.0, -22.6);
  c.quadraticCurveTo(0, -25.4, 6.0, -22.6);
  c.lineTo(5.2, -13.6);
  c.quadraticCurveTo(0, -12.4, -5.2, -13.6);
  c.closePath(); c.fill();
  /* plastron */
  c.fillStyle = degCache(c, "meufPlastron", function(){
    var g = c.createLinearGradient(-5, -22, 5, -15);
    g.addColorStop(0, C.plastronC); g.addColorStop(0.45, C.plastron); g.addColorStop(1, C.plastronO);
    return g;
  });
  c.beginPath();
  c.moveTo(-4.2, -14.4);
  c.lineTo(-4.6, -21.4);
  c.quadraticCurveTo(0, -23.4, 4.6, -21.4);
  c.lineTo(4.2, -14.4);
  c.quadraticCurveTo(0, -13.4, -4.2, -14.4);
  c.closePath(); c.fill();
  /* sangles croisées + boucle */
  c.strokeStyle = C.sangle; c.lineWidth = 1.3;
  c.beginPath(); c.moveTo(-4.4, -21.6); c.lineTo(3.4, -15.2); c.stroke();
  c.beginPath(); c.moveTo(4.4, -21.6); c.lineTo(-3.4, -15.2); c.stroke();
  c.fillStyle = C.boucle;
  c.fillRect(-1.2, -18.8, 2.4, 2.0);
  /* ceinture */
  c.fillStyle = C.sangle;
  c.fillRect(-5.4, -14.6, 10.8, 2.0);
  c.fillStyle = C.accent;
  c.fillRect(-1.1, -14.7, 2.2, 2.2);
  /* liseré de lumière */
  c.strokeStyle = "rgba(255,255,255,.45)"; c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(-5.7, -20.4); c.quadraticCurveTo(-4.2, -24.2, 0, -25.0);
  c.stroke();

  /* --- bras --- */
  c.strokeStyle = C.tenueO; c.lineWidth = 2.4;
  c.beginPath();
  c.moveTo(-4.8, -21.4);
  c.quadraticCurveTo(-7.2 + p.brasB, -17, -6.2 + p.brasB * 1.4, -13.2);
  c.stroke();
  c.strokeStyle = C.tenue; c.lineWidth = 2.4;
  c.beginPath();
  c.moveTo(4.8, -21.4);
  c.quadraticCurveTo(7.2 + p.brasA, -17.4, 5.4 + p.brasA * 1.2, -14);
  c.stroke();
  c.fillStyle = C.gantelet || "#2b2b2b";
  c.beginPath(); c.arc(5.4 + p.brasA * 1.2, -13.6, 1.5, 0, 6.2832); c.fill();

  /* --- le gros fusil, porté sur l'épaule --- */
  c.save();
  c.translate(1.2, -23.8); c.rotate(-0.30);
  c.fillStyle = degCache(c, "meufFusil", function(){
    var g = c.createLinearGradient(0, -3.4, 0, 3.4);
    g.addColorStop(0, C.armeC); g.addColorStop(0.45, C.arme); g.addColorStop(1, C.armeO);
    return g;
  });
  c.beginPath();
  if(c.roundRect) c.roundRect(-11, -3.2, 23, 6.4, 1.6); else c.rect(-11, -3.2, 23, 6.4);
  c.fill();
  /* carcasse haute + rail */
  c.fillStyle = C.armeO;
  c.fillRect(-6, -4.6, 11, 1.6);
  c.fillStyle = C.armeC;
  for(var rr = 0; rr < 5; rr++) c.fillRect(-5.4 + rr * 2.1, -4.5, 0.9, 1.3);
  /* chargeur */
  c.fillStyle = C.arme;
  c.beginPath();
  c.moveTo(-3.4, 3.0); c.lineTo(-1.0, 3.0); c.lineTo(-1.6, 8.4); c.lineTo(-4.2, 8.4);
  c.closePath(); c.fill();
  /* poignée */
  c.fillStyle = C.armeO;
  c.beginPath();
  c.moveTo(1.6, 3.0); c.lineTo(3.6, 3.0); c.lineTo(4.4, 7.0); c.lineTo(2.4, 7.0);
  c.closePath(); c.fill();
  /* crosse */
  c.fillStyle = C.arme;
  c.fillRect(-14.4, -2.4, 3.6, 4.6);
  /* bouche + lueur */
  c.fillStyle = "#0f1014";
  c.beginPath(); c.ellipse(12.4, -0.2, 1.5, 2.4, 0, 0, 6.2832); c.fill();
  c.save();
  c.globalCompositeOperation = "lighter";
  c.fillStyle = degCache(c, "meufBouche" + (tir ? 1 : 0), function(){
    var g = c.createRadialGradient(12.4, -0.2, 0.4, 12.4, -0.2, tir ? 10 : 4);
    g.addColorStop(0, rgba(C.lueur, tir ? 0.95 : 0.45));
    g.addColorStop(1, rgba(C.lueur, 0));
    return g;
  });
  c.beginPath(); c.arc(12.4, -0.2, tir ? 10 : 4, 0, 6.2832); c.fill();
  c.restore();
  /* lunette */
  c.fillStyle = C.armeO;
  c.fillRect(-1.4, -6.4, 6.4, 2.0);
  c.fillStyle = "rgba(125,230,255,.5)";
  c.fillRect(4.2, -6.2, 0.8, 1.6);
  c.restore();

  /* --- tête --- */
  c.save();
  c.translate(0, -27.2);
  c.fillStyle = C.cheveux;
  c.beginPath(); c.ellipse(-0.2, 0.2, 5.0, 5.2, 0, 0, 6.2832); c.fill();
  c.fillStyle = degCache(c, "meufVisage", function(){
    var g = c.createRadialGradient(-1.4, -1.6, 0.5, 0, 0, 4.8);
    g.addColorStop(0, ecl(C.peau, 1.06)); g.addColorStop(1, C.peauO);
    return g;
  });
  c.beginPath(); c.ellipse(0.3, 0.6, 4.0, 4.4, 0, 0, 6.2832); c.fill();
  /* yeux en amande */
  c.fillStyle = "#1e1822";
  c.beginPath(); c.ellipse(-1.2, 0.2, 0.9, 0.65, 0.08, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(1.9, 0.2, 0.9, 0.65, -0.08, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,255,255,.7)";
  c.beginPath(); c.arc(-1.45, 0.0, 0.26, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(1.65, 0.0, 0.26, 0, 6.2832); c.fill();
  c.strokeStyle = "rgba(160,80,70,.75)"; c.lineWidth = 0.65;
  c.beginPath(); c.moveTo(-0.2, 2.5); c.quadraticCurveTo(0.6, 3.0, 1.5, 2.5); c.stroke();
  /* raie au milieu + bandeaux */
  c.fillStyle = C.cheveux;
  c.beginPath();
  c.moveTo(-4.7, -1.0);
  c.quadraticCurveTo(-4.4, -6.0, 0.4, -5.7);
  c.quadraticCurveTo(5.0, -5.4, 4.7, -0.6);
  c.quadraticCurveTo(3.4, -3.6, 0.3, -3.3);
  c.quadraticCurveTo(-2.6, -3.4, -4.7, -1.0);
  c.closePath(); c.fill();
  if(coiffure === 1){
    c.fillStyle = C.cheveux;
    c.beginPath();
    c.moveTo(-3.4, -3.6);
    c.quadraticCurveTo(-9.6, -3.0, -8.4, 5.0);
    c.quadraticCurveTo(-6.0, 1.0, -3.0, -1.6);
    c.closePath(); c.fill();
  }else if(coiffure === 2){
    c.fillStyle = C.cheveux;
    c.beginPath(); c.arc(-0.2, -5.6, 2.7, 0, 6.2832); c.fill();
    c.fillStyle = C.cheveux2;
    c.beginPath(); c.arc(-1.0, -6.2, 1.1, 0, 6.2832); c.fill();
  }
  c.fillStyle = "rgba(255,255,255,.14)";
  c.beginPath(); c.ellipse(-1.6, -3.4, 2.3, 1.0, -0.4, 0, 6.2832); c.fill();
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
  c.beginPath(); c.ellipse(0, 0, 9.8, 4.1, 0, 0, 6.2832); c.fill();

  c.save();
  c.translate(0, yb);
  c.lineCap = "round";

  function jambe(dx, coul, coulB){
    c.strokeStyle = coul; c.lineWidth = 5.4;
    c.beginPath();
    c.moveTo(dx * 0.2, -16);
    c.quadraticCurveTo(dx * 0.6, -9, dx, -3);
    c.stroke();
    c.fillStyle = coulB;
    c.beginPath(); c.ellipse(dx + (dx > 0 ? 1 : -1), -1.6, 4.1, 2.4, 0, 0, 6.2832); c.fill();
  }
  jambe(p.jambeB * 0.8, ecl(C.pantalon, 0.76), ecl(C.botte, 0.85));
  jambe(p.jambeA * 0.8, C.pantalon, C.botte);

  c.save();
  c.rotate(p.incl * 0.6);

  /* --- torse : tee sombre puis gilet tactique --- */
  c.fillStyle = C.tee;
  c.beginPath();
  c.moveTo(-6.8, -16.2);
  c.lineTo(-10.4, -27.0);
  c.quadraticCurveTo(0, -31.0, 10.4, -27.0);
  c.lineTo(6.8, -16.2);
  c.quadraticCurveTo(0, -14.6, -6.8, -16.2);
  c.closePath(); c.fill();
  c.fillStyle = degCache(c, "mecGilet", function(){
    var g = c.createLinearGradient(-9, -28, 9, -17);
    g.addColorStop(0, C.giletC); g.addColorStop(0.5, C.gilet); g.addColorStop(1, C.giletO);
    return g;
  });
  c.beginPath();
  c.moveTo(-6.0, -16.6);
  c.lineTo(-8.2, -26.2);
  c.quadraticCurveTo(0, -29.2, 8.2, -26.2);
  c.lineTo(6.0, -16.6);
  c.quadraticCurveTo(0, -15.2, -6.0, -16.6);
  c.closePath(); c.fill();
  /* poches et sangles du gilet */
  c.fillStyle = C.giletO;
  c.fillRect(-5.4, -22.4, 4.2, 3.4);
  c.fillRect(1.2, -22.4, 4.2, 3.4);
  c.fillRect(-3.0, -18.2, 6.0, 2.6);
  c.strokeStyle = "rgba(30,28,18,.6)"; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(-7.4, -24.6); c.lineTo(7.4, -24.6); c.stroke();
  /* bande de cartouches */
  c.fillStyle = C.laiton;
  for(var b2 = 0; b2 < 5; b2++) c.fillRect(-6.4 + b2 * 2.8, -25.6, 1.5, 2.4);
  /* col et peau du cou */
  c.fillStyle = C.peauO;
  c.beginPath(); c.ellipse(0, -27.6, 3.2, 2.2, 0, 0, 6.2832); c.fill();

  /* --- bras énormes --- */
  function bras(dx, dec, coul, devant){
    c.strokeStyle = coul; c.lineWidth = 4.8;
    c.beginPath();
    c.moveTo(dx * 0.9, -26);
    c.quadraticCurveTo(dx * 1.35 + dec * 0.6, -21.5, dx * 1.15 + dec, -17);
    c.stroke();
    c.fillStyle = coul;
    c.beginPath(); c.ellipse(dx * 1.15, -23.2, 3.2, 4.0, dx > 0 ? 0.25 : -0.25, 0, 6.2832); c.fill();
    /* veine / relief */
    c.strokeStyle = "rgba(120,70,40,.28)"; c.lineWidth = 0.6;
    c.beginPath(); c.moveTo(dx * 1.05, -25); c.lineTo(dx * 1.2, -20.6); c.stroke();
    c.fillStyle = C.gantelet;
    c.beginPath(); c.ellipse(dx * 1.15 + dec, -16.2, 2.5, 2.2, 0, 0, 6.2832); c.fill();
    if(devant){
      c.fillStyle = "rgba(255,255,255,.16)";
      c.beginPath(); c.ellipse(dx * 1.15 + dec - 0.6, -17.0, 1.2, 0.8, 0, 0, 6.2832); c.fill();
    }
  }
  bras(-7.4, p.brasB, C.peauO, false);

  /* --- le fusil en travers --- */
  c.save();
  c.translate(1.0, -19.6); c.rotate(0.34);
  c.fillStyle = C.arme;
  c.beginPath();
  if(c.roundRect) c.roundRect(-10, -1.9, 21, 3.8, 1.2); else c.rect(-10, -1.9, 21, 3.8);
  c.fill();
  c.fillStyle = C.armeC;
  c.fillRect(-4.6, -3.0, 8.4, 1.2);
  c.fillStyle = C.arme;
  c.beginPath();
  c.moveTo(-2.6, 1.7); c.lineTo(-0.4, 1.7); c.lineTo(-0.9, 6.2); c.lineTo(-3.1, 6.2);
  c.closePath(); c.fill();
  c.fillStyle = "#0f1010";
  c.beginPath(); c.ellipse(11.2, 0, 1.1, 1.6, 0, 0, 6.2832); c.fill();
  if(tir){
    c.save();
    c.globalCompositeOperation = "lighter";
    c.fillStyle = degCache(c, "mecBouche", function(){
      var g = c.createRadialGradient(11.6, 0, 0.4, 11.6, 0, 9);
      g.addColorStop(0, "rgba(255,232,170,.95)");
      g.addColorStop(1, "rgba(255,120,30,0)");
      return g;
    });
    c.beginPath(); c.arc(11.6, 0, 9, 0, 6.2832); c.fill();
    c.restore();
  }
  c.restore();

  bras(7.4, p.brasA, C.peau, true);

  /* --- tête, barbe et casque --- */
  c.save();
  c.translate(0.4, -32.2);
  c.fillStyle = degCache(c, "mecVisage", function(){
    var g = c.createRadialGradient(-1.6, -1.6, 0.5, 0, 0, 5.4);
    g.addColorStop(0, ecl(C.peau, 1.08)); g.addColorStop(1, C.peauO);
    return g;
  });
  c.beginPath(); c.ellipse(0, 0, 4.6, 4.8, 0, 0, 6.2832); c.fill();
  /* barbe courte */
  c.fillStyle = C.barbe;
  c.beginPath();
  c.moveTo(-4.2, 0.4);
  c.quadraticCurveTo(-3.6, 4.6, 0, 5.0);
  c.quadraticCurveTo(3.6, 4.6, 4.2, 0.4);
  c.quadraticCurveTo(2.2, 2.2, 0, 2.2);
  c.quadraticCurveTo(-2.2, 2.2, -4.2, 0.4);
  c.closePath(); c.fill();
  /* yeux clairs */
  c.fillStyle = "#2a3540";
  c.fillRect(-2.7, -0.6, 1.7, 1.1);
  c.fillRect(1.1, -0.6, 1.7, 1.1);
  c.fillStyle = "rgba(190,220,240,.8)";
  c.fillRect(-2.5, -0.5, 0.7, 0.8);
  c.fillRect(1.3, -0.5, 0.7, 0.8);
  c.strokeStyle = "#4a3a26"; c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(-3.1, -1.8); c.lineTo(-0.9, -1.3); c.stroke();
  c.beginPath(); c.moveTo(3.1, -1.8); c.lineTo(0.9, -1.3); c.stroke();
  /* mèches qui dépassent */
  c.fillStyle = C.cheveux;
  c.beginPath();
  c.moveTo(-4.6, -1.6); c.quadraticCurveTo(-5.6, -3.4, -3.6, -4.0);
  c.quadraticCurveTo(-4.0, -2.6, -3.0, -2.0);
  c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(4.6, -1.6); c.quadraticCurveTo(5.6, -3.4, 3.6, -4.0);
  c.quadraticCurveTo(4.0, -2.6, 3.0, -2.0);
  c.closePath(); c.fill();
  /* casque */
  c.fillStyle = degCache(c, "mecCasque", function(){
    var g = c.createLinearGradient(-5, -7, 5, -2);
    g.addColorStop(0, C.casqueC); g.addColorStop(0.55, C.casque); g.addColorStop(1, C.casqueO);
    return g;
  });
  c.beginPath();
  c.moveTo(-5.2, -1.6);
  c.quadraticCurveTo(-5.6, -7.6, 0, -7.8);
  c.quadraticCurveTo(5.6, -7.6, 5.2, -1.6);
  c.quadraticCurveTo(2.6, -3.0, 0, -3.0);
  c.quadraticCurveTo(-2.6, -3.0, -5.2, -1.6);
  c.closePath(); c.fill();
  /* rails et cache-oreilles */
  c.fillStyle = C.casqueO;
  c.fillRect(-5.4, -3.2, 2.0, 2.6);
  c.fillRect(3.4, -3.2, 2.0, 2.6);
  c.fillStyle = C.casqueC;
  c.fillRect(-1.6, -8.2, 3.2, 1.2);
  c.strokeStyle = "rgba(255,255,255,.30)"; c.lineWidth = 0.7;
  c.beginPath(); c.moveTo(-4.4, -4.4); c.quadraticCurveTo(-2.4, -7.0, 0.6, -7.2); c.stroke();
  /* jugulaire */
  c.strokeStyle = "rgba(40,38,28,.8)"; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(-4.6, -1.2); c.lineTo(-3.0, 2.6); c.stroke();
  c.beginPath(); c.moveTo(4.6, -1.2); c.lineTo(3.0, 2.6); c.stroke();
  c.restore();

  c.restore();
  c.restore();
}

/* Aiguillage */
function dessineUnite(c, type, phase, variante, tir){
  if(type === "mec") dessineMec(c, phase, variante, tir);
  else dessineMeuf(c, phase, variante, tir);
}

/* ---------------------------------------------------------------
   VIGNETTES GRISES DES AUTRES JOUEURS
   24 pré-rendus : 6 poses × 2 orientations × 2 types, désaturés une
   seule fois au niveau des pixels. Pas de ctx.filter : trop lent.
   --------------------------------------------------------------- */
var VIG_W = 84, VIG_H = 88, VIG_OX = 42, VIG_OY = 74, VIG_ECH = 1.6;
var vignettes = null;

function construitVignettesGrises(){
  vignettes = [];
  var types = ["meuf", "mec"];
  for(var ti = 0; ti < 2; ti++){
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
  var ti = (type === "mec") ? 1 : 0;
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
