/* ================================================================
   LES UNITÉS DU JOUEUR — la Furie et le Commando
   Dessinées en vecteur, repère local : les pieds sont en (0,0),
   l'unité monte vers les y négatifs. Lumière en haut à gauche.
   ================================================================ */

/* Palettes relevées sur les références :
   la Furie porte un ensemble blanc et noir sous un plastron sombre,
   le Commando un gilet tactique olive sur un tee-shirt sombre. */
var C_FURIE = {
  cheveux:"#151119", cheveux2:"#3a3147", reflet:"#6a5a86",
  peau:"#f4e0ca", peauO:"#d6b493",
  tenue:"#f2ede4", tenueO:"#c9c1b4",
  plastron:"#2c2c33", plastronC:"#4d4d58", plastronO:"#16161b",
  sangle:"#1b1b20", boucle:"#9a9aa4",
  arme:"#34353c", armeC:"#60626c", armeO:"#17181c", lueur:"#7de6ff",
  botte:"#1d1d24", pantalon:"#27272e", accent:"#c8a24a"
};
var C_COMMANDO = {
  peau:"#dfb083", peauO:"#b7845a", ombreM:"#96683f",
  barbe:"#6d4f2e", cheveux:"#a8834c",
  tee:"#2c2c30", teeO:"#191a1c",
  gilet:"#6b6244", giletC:"#8f8562", giletO:"#403b28",
  casque:"#7a7154", casqueC:"#9e9472", casqueO:"#48432e",
  gantelet:"#26261f", arme:"#3d3d36", armeC:"#6e6e63", armeO:"#191914",
  pantalon:"#3a3a32", botte:"#22221f", laiton:"#d3a94e"
};

/* LE DOC. Le vêtement, c'est LA BLOUSE BLANCHE — pas un manteau
   sombre avec un peu de blanc dessous. C'est elle qu'on doit voir de
   loin, et c'est elle qui dit le métier en un dixième de seconde au
   milieu de cent vingt soldats.
   Tout le sombre du personnage est reporté sur ce qui ENTOURE la
   blouse : le chapeau, les verres, le pantalon, les chaussures, la
   mallette. Le louche ne tient pas à la couleur du costume, il tient
   à la posture et au regard — et ceux-là n'ont pas bougé. */
var C_DOC = {
  /* la blouse longue, ouverte : la grande tache claire */
  manteau:"#e9e3d2", manteauC:"#fbf7ec", manteauO:"#b0a993",
  /* ce qu'il porte dessous, sombre, visible dans l'ouverture */
  blouse:"#2b2732", blouseO:"#1b1822",
  chapeau:"#241f19", chapeauC:"#3b332a", ruban:"#15120e",
  peau:"#e8c9a6", peauO:"#bd9a75",
  cheveux:"#241c16",
  lunettes:"#111013", verre:"#191920", refletV:"#8fb8c8",
  mallette:"#5e4029", malletteC:"#7d5c3a", malletteO:"#361f11",
  croix:"#c23a30", croixC:"#e86152",
  laiton:"#c09a52", pantalon:"#232028", botte:"#171418",
  fiole:"#8ce6a8"
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
   LA FURIE — silhouette fine, longue chevelure noire, gros fusil
   coiffure : 0 longue lâchée, 1 queue haute, 2 chignon
   --------------------------------------------------------------- */
function dessineFurie(c, phase, coiffure, tir){
  var C = C_FURIE;
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
  c.fillStyle = degCache(c, "v2FurieTop", function(){
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
  c.fillStyle = degCache(c, "v2FuriePlastron", function(){
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
  c.fillStyle = degCache(c, "v2FurieFusil", function(){
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
  c.fillStyle = degCache(c, "v2FurieLueur" + (tir ? 1 : 0), function(){
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
  c.fillStyle = degCache(c, "v2FurieVisage", function(){
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
   LE COMMANDO — grand, épais, casqué, gilet tactique et fusil
   --------------------------------------------------------------- */
function dessineCommando(c, phase, variante, tir){
  var C = C_COMMANDO;
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
  c.fillStyle = degCache(c, "v2CommandoTee", function(){
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
  c.fillStyle = degCache(c, "v2CommandoGilet", function(){
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
  c.fillStyle = degCache(c, "v2CommandoArme", function(){
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
    c.fillStyle = degCache(c, "v2CommandoBouche", function(){
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
  c.fillStyle = degCache(c, "v2CommandoVisage", function(){
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
  c.fillStyle = degCache(c, "v2CommandoCasque", function(){
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

/* ================================================================
   LE DOC — « il doit avoir un air louche », et c'est tout le cahier
   des charges du dessin.

   Ce qui fait le louche, et rien d'autre : la POSTURE et le REGARD.
   Un personnage bien planté sur ses deux jambes, la tête droite, aura
   l'air honnête quel que soit son costume. Celui-ci est voûté, la tête
   rentrée dans les épaules, une main enfouie dans la poche du manteau,
   et surtout il ne regarde jamais devant lui : ses lunettes noires
   sont tournées de trois quarts, comme s'il surveillait qui arrive
   derrière. Le manteau long par-dessus la blouse fait le reste — on ne
   sait pas ce qu'il y a dessous, et c'est le but.

   La croix rouge sur la mallette est le seul accent franc du
   personnage : c'est ce qui le rend lisible en une fraction de seconde
   au milieu de cent vingt soldats, et c'est aussi la seule chose qui
   prétende encore au métier.

   `tir` vaut 1 quand il soigne : la mallette s'ouvre alors et la fiole
   s'allume. C'est le même drapeau que pour les autres, réemployé —
   un Doc ne tire jamais.
   ================================================================ */
/* IL EST PLUS PETIT QUE LES COMBATTANTS, et c'est une information de
   jeu autant qu'un choix de dessin : au milieu d'un débarquement, la
   taille dit tout de suite qui se bat et qui suit. À hauteur égale, le
   Doc se lisait comme un soldat de plus en blouse. */
var DOC_ECH = 0.80;
function dessineDoc(c, phase, variante, tir){
  var C = C_DOC;
  var p = pose(phase, 3.4);
  var yb = -p.rebond;
  /* la blouse bat derrière lui, décalée d'un quart de cycle */
  var pan = Math.sin(phase + 0.9) * 1.5;

  /* L'ombre suit la taille, mais PAS entièrement : elle reste un peu
     plus large que le corps, sinon un personnage plus petit paraît
     aussi flotter au-dessus du sol. */
  c.fillStyle = "rgba(0,0,0,.26)";
  c.beginPath(); c.ellipse(0, 0, 7.2 * 0.88, 3.1 * 0.88, 0, 0, 6.2832); c.fill();

  c.save();
  /* la réduction s'applique AU CORPS SEUL, après l'ombre : elle est
     posée avant la translation du rebond pour que le rebond lui-même
     se réduise dans la même proportion */
  c.scale(DOC_ECH, DOC_ECH);
  c.translate(0, yb);
  c.lineCap = "round";

  /* --- jambes : pantalon sombre, chaussures de ville fatiguées --- */
  function jambe(dx, devant){
    var kx = dx * 0.55, ky = -7.0;
    c.strokeStyle = devant ? C.pantalon : ecl(C.pantalon, 0.74);
    c.lineWidth = 3.7;
    c.beginPath();
    c.moveTo(dx * 0.10, -12.6);
    c.quadraticCurveTo(dx * 0.32, -9.8, kx, ky);
    c.stroke();
    c.strokeStyle = devant ? C.botte : ecl(C.botte, 0.8);
    c.lineWidth = 3.0;
    c.beginPath();
    c.moveTo(kx, ky);
    c.quadraticCurveTo(dx * 0.84, -4.4, dx, -1.8);
    c.stroke();
    c.fillStyle = devant ? C.botte : ecl(C.botte, 0.8);
    c.beginPath(); c.ellipse(dx + (dx > 0 ? 1.0 : -1.0), -1.1, 2.9, 1.6, 0, 0, 6.2832); c.fill();
  }
  jambe(p.jambeB * 0.85, false);
  jambe(p.jambeA * 0.85, true);

  c.save();
  /* LA VOÛTE. Une inclinaison constante vers l'avant, en plus du
     balancement : c'est elle qui donne l'échine basse. */
  c.rotate(p.incl + 0.075);

  /* --- le pan arrière du manteau, qui bat --- */
  c.fillStyle = C.manteauO;
  c.beginPath();
  c.moveTo(-3.4, -19.0);
  c.quadraticCurveTo(-6.2 + pan * 0.5, -13.0, -5.0 + pan, -7.2);
  c.lineTo(-1.4, -8.6);
  c.lineTo(-1.8, -18.4);
  c.closePath(); c.fill();

  /* --- CE QU'IL PORTE SOUS LA BLOUSE : un col sombre, et rien d'autre.
     Une bande étroite au milieu du buste, qui sert de contraste au
     blanc. Elle est posée AVANT la blouse et la blouse la recouvre
     presque entièrement — il n'en reste que le V du col. --- */
  c.fillStyle = C.blouse;
  c.beginPath();
  c.moveTo(-2.4, -23.6); c.lineTo(2.4, -23.6);
  c.lineTo(2.0, -8.2); c.lineTo(-2.0, -8.2);
  c.closePath(); c.fill();

  /* --- LA BLOUSE BLANCHE. C'est LE vêtement : elle couvre tout le
     buste, des épaules au bas de la silhouette, et c'est la plus
     grande surface claire du personnage. Le premier jet en faisait une
     mince bande sous un manteau sombre, et le Doc restait une ombre de
     plus dans le débarquement — on ne voyait pas le soignant, on
     voyait un civil en noir. --- */
  c.fillStyle = degCache(c, "docBlouse", function(){
    var g = c.createLinearGradient(-4.8, -24, 4.8, -9);
    g.addColorStop(0, C.manteauC); g.addColorStop(0.45, C.manteau);
    g.addColorStop(1, C.manteauO);
    return g;
  });
  c.beginPath();
  c.moveTo(-4.8, -23.6);
  c.quadraticCurveTo(-5.9, -16.0, -5.1, -8.4);
  c.lineTo(5.1, -8.4);
  c.quadraticCurveTo(5.9, -16.0, 4.8, -23.6);
  c.closePath(); c.fill();
  /* LE V DU COL, découpé dans la blouse : c'est lui qui laisse voir le
     sombre du dessous et qui empêche la blouse de devenir un bloc. */
  c.fillStyle = C.blouse;
  c.beginPath();
  c.moveTo(-2.3, -23.8); c.lineTo(0, -18.6); c.lineTo(2.3, -23.8);
  c.closePath(); c.fill();
  /* les deux revers, par-dessus */
  c.fillStyle = C.manteauC;
  c.beginPath();
  c.moveTo(-2.6, -23.8); c.lineTo(-0.3, -18.4); c.lineTo(-4.0, -22.2);
  c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(2.6, -23.8); c.lineTo(0.3, -18.4); c.lineTo(4.0, -22.2);
  c.closePath(); c.fill();
  /* l'ourlet du bas, et le rang de boutons */
  c.fillStyle = C.manteauO;
  c.fillRect(-5.0, -9.2, 10.0, 0.9);
  c.fillRect(-0.35, -17.4, 0.7, 0.7);
  c.fillRect(-0.35, -14.4, 0.7, 0.7);
  c.fillRect(-0.35, -11.4, 0.7, 0.7);
  /* la croix rouge sur la poitrine, à gauche. Posée sur du blanc, elle
     se voit ; sur le vêtement sombre d'avant, elle disparaissait. */
  c.fillStyle = C.croix;
  c.fillRect(-3.6, -20.4, 0.7, 2.1);
  c.fillRect(-4.3, -19.7, 2.1, 0.7);
  /* liseré de lumière sur l'épaule */
  c.strokeStyle = "rgba(255,255,255,.42)"; c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(-4.5, -22.8); c.quadraticCurveTo(-2.8, -24.8, -0.2, -24.4);
  c.stroke();

  /* --- LA MAIN DANS LA POCHE, bras arrière. Le geste du personnage. --- */
  c.strokeStyle = C.manteauO; c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(-4.0, -21.6);
  c.quadraticCurveTo(-5.8, -17.4, -3.6, -14.2);
  c.stroke();
  /* la main, elle, est de chair : une manche blanche qui se termine en
     blanc n'a plus de main du tout */
  c.fillStyle = C.peauO;
  c.beginPath(); c.ellipse(-3.6, -13.8, 1.4, 1.1, 0, 0, 6.2832); c.fill();

  /* --- LA MALLETTE, bras avant. Ouverte quand il travaille. --- */
  var mx = tir ? 5.4 : 4.4, my = tir ? -15.4 : -11.6;
  c.strokeStyle = C.manteau; c.lineWidth = 2.4;
  c.beginPath();
  c.moveTo(4.0, -21.4);
  c.quadraticCurveTo(5.4, -18.4, mx, my + 1.2);
  c.stroke();
  c.save();
  c.translate(mx, my);
  c.rotate(tir ? -0.34 : 0.06);
  /* le couvercle, relevé quand la mallette est ouverte */
  if(tir){
    c.fillStyle = C.malletteO;
    c.save(); c.translate(-2.6, -1.5); c.rotate(-0.85);
    c.fillRect(0, -3.6, 5.4, 3.6);
    c.restore();
    /* la fiole qui luit dedans */
    c.fillStyle = C.fiole;
    c.beginPath(); c.ellipse(0.6, -2.4, 1.5, 1.9, 0, 0, 6.2832); c.fill();
    c.fillStyle = "rgba(255,255,255,.55)";
    c.beginPath(); c.ellipse(0.1, -3.0, 0.5, 0.8, 0, 0, 6.2832); c.fill();
  }
  c.fillStyle = degCache(c, "docMallette", function(){
    var g = c.createLinearGradient(0, -2.0, 0, 2.4);
    g.addColorStop(0, C.malletteC); g.addColorStop(0.5, C.mallette);
    g.addColorStop(1, C.malletteO);
    return g;
  });
  c.beginPath();
  if(c.roundRect) c.roundRect(-2.8, -2.0, 5.6, 4.4, 0.8); else c.rect(-2.8, -2.0, 5.6, 4.4);
  c.fill();
  /* la croix rouge — le seul accent franc du personnage */
  c.fillStyle = C.croix;
  c.fillRect(-0.5, -1.2, 1.0, 2.8);
  c.fillRect(-1.4, -0.3, 2.8, 1.0);
  c.fillStyle = C.croixC;
  c.fillRect(-0.5, -1.2, 1.0, 0.7);
  /* poignée + fermoirs de laiton */
  c.strokeStyle = C.laiton; c.lineWidth = 0.7;
  c.beginPath(); c.moveTo(-1.5, -2.0); c.quadraticCurveTo(0, -3.5, 1.5, -2.0); c.stroke();
  c.fillStyle = C.laiton;
  c.fillRect(-2.2, -0.4, 0.7, 0.7);
  c.fillRect(1.5, -0.4, 0.7, 0.7);
  c.restore();

  /* --- LA TÊTE, rentrée dans les épaules et tournée de trois quarts ---
     C'est le regard de côté qui fait tout : il ne regarde pas où il
     va, il regarde qui vient. */
  var tx = 0.9;                       /* décalage : la tête n'est pas dans l'axe */
  c.fillStyle = C.peauO;
  c.beginPath(); c.ellipse(tx, -26.4, 3.5, 3.9, 0.06, 0, 6.2832); c.fill();
  c.fillStyle = C.peau;
  c.beginPath(); c.ellipse(tx - 0.35, -26.7, 3.1, 3.6, 0.06, 0, 6.2832); c.fill();
  /* la mâchoire mal rasée */
  c.fillStyle = "rgba(36,28,22,.30)";
  c.beginPath(); c.ellipse(tx + 0.1, -24.4, 2.5, 1.5, 0, 0, 6.2832); c.fill();

  /* cheveux plaqués en arrière, un peu gras */
  c.fillStyle = C.cheveux;
  c.beginPath();
  c.moveTo(tx - 3.4, -27.6);
  c.quadraticCurveTo(tx - 1.0, -31.0, tx + 3.2, -28.8);
  c.quadraticCurveTo(tx + 1.4, -29.4, tx - 0.6, -29.0);
  c.quadraticCurveTo(tx - 2.4, -28.6, tx - 3.4, -27.6);
  c.closePath(); c.fill();

  /* LE CHAPEAU, RABATTU SUR LES YEUX.
     C'est lui qui fait le personnage, et c'est aussi lui qui le rend
     reconnaissable de loin : la Furie a une chevelure, le Commando un
     casque, l'Ogre sa masse — il manquait au Doc une silhouette à lui.
     Le bord est plus large devant que derrière, et il descend jusqu'à
     la ligne des lunettes : on ne voit de son visage que la mâchoire
     et deux verres noirs. */
  c.fillStyle = C.chapeau;
  c.beginPath();
  c.ellipse(tx - 0.2, -28.8, 5.0, 1.35, -0.05, 0, 6.2832);
  c.fill();
  c.fillStyle = C.chapeauC;
  c.beginPath();
  c.moveTo(tx - 3.0, -29.2);
  c.quadraticCurveTo(tx - 2.7, -32.6, tx + 0.2, -32.7);
  c.quadraticCurveTo(tx + 3.0, -32.5, tx + 3.1, -29.2);
  c.closePath(); c.fill();
  /* le pli du sommet, et le ruban */
  c.strokeStyle = C.chapeau; c.lineWidth = 0.7;
  c.beginPath(); c.moveTo(tx - 0.6, -32.6); c.lineTo(tx + 0.1, -30.6); c.stroke();
  c.fillStyle = C.ruban;
  c.beginPath();
  c.moveTo(tx - 3.0, -29.4); c.lineTo(tx + 3.1, -29.4);
  c.lineTo(tx + 3.05, -30.5); c.lineTo(tx - 2.92, -30.5);
  c.closePath(); c.fill();
  /* la variante : chapeau incliné, ou une mèche qui dépasse */
  if(variante !== 1){
    c.strokeStyle = C.cheveux; c.lineWidth = 1.0;
    c.beginPath();
    c.moveTo(tx - 3.0, -28.4);
    c.quadraticCurveTo(tx - 3.9, -26.6, tx - 3.1, -25.2);
    c.stroke();
  }

  /* LES LUNETTES NOIRES. Rondes, petites, posées bas sur le nez : on
     voit qu'il y a des yeux derrière et qu'ils ne regardent pas là où
     ils devraient. */
  c.strokeStyle = C.lunettes; c.lineWidth = 0.7;
  c.fillStyle = C.verre;
  c.beginPath(); c.ellipse(tx - 1.5, -26.9, 1.35, 1.25, 0, 0, 6.2832); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(tx + 1.6, -27.0, 1.35, 1.25, 0, 0, 6.2832); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(tx - 0.2, -27.0); c.lineTo(tx + 0.3, -27.0); c.stroke();
  /* le reflet, décalé du même côté sur les deux verres : c'est ce qui
     dit qu'il regarde AILLEURS */
  c.fillStyle = rgba(C.refletV, 0.7);
  c.fillRect(tx - 2.0, -27.5, 0.7, 0.6);
  c.fillRect(tx + 1.1, -27.6, 0.7, 0.6);

  /* le cure-dent au coin de la bouche, variante */
  if(variante === 2){
    c.strokeStyle = "#d8cba8"; c.lineWidth = 0.55;
    c.beginPath(); c.moveTo(tx + 2.0, -24.9); c.lineTo(tx + 4.2, -25.4); c.stroke();
  }

  c.restore();
  c.restore();
}

/* Aiguillage */
function dessineUnite(c, type, phase, variante, tir){
  /* L'Ogre vit dans son propre fichier (62-ogre.js) : il est trois fois
     plus grand que les deux autres et n'a rien en commun avec eux. Le
     garde-fou typeof le rend optionnel — si un jour on retire le
     fichier, le jeu tombe sur la Furie au lieu de planter. */
  if(type === "ogre" && typeof dessineOgre === "function"){ dessineOgre(c, phase, variante, tir); return; }
  if(type === "doc" && typeof dessineDoc === "function"){ dessineDoc(c, phase, variante, tir); return; }
  /* Speed vit dans son propre fichier, comme l'Ogre et le Doc : il ne
     partage aucune ligne avec les autres — il court, eux marchent. */
  if(type === "speed" && typeof dessineSpeed === "function"){ dessineSpeed(c, phase, variante, tir); return; }
  /* Le Tank : une POSE FIXE, de trois quarts. Ce chemin-ci ne sert
     qu'aux dessins figés — les silhouettes grises des autres joueurs
     et le portrait du briefing. Le char vivant, lui, ne passe jamais
     par ici : il a besoin de ses deux angles, et dessineUniteMonde le
     confie directement à dessineTankMonde. */
  if(type === "tank" && typeof dessineTank === "function"){ dessineTank(c, phase, variante, tir); return; }
  /* Le PYR-120 suit exactement le même chemin que le char, et pour la
     même raison : pose fixe pour les dessins figés, sortie propre pour
     le véhicule vivant qui a besoin de ses deux caps. */
  if(type === "pyr" && typeof dessinePyr === "function"){ dessinePyr(c, phase, variante, tir); return; }
  if(type === "commando") dessineCommando(c, phase, variante, tir);
  else dessineFurie(c, phase, variante, tir);
}

/* ---------------------------------------------------------------
   VIGNETTES GRISES DES AUTRES JOUEURS
   24 pré-rendus : 6 poses × 2 orientations × 2 types, désaturés une
   seule fois au niveau des pixels. Pas de ctx.filter : trop lent.
   --------------------------------------------------------------- */
/* La planche doit contenir l'OGRE, qui monte trois fois plus haut
   qu'une Furie : dimensionnée sur les petits, elle lui coupait la tête
   et les épaules. L'origine descend d'autant. */
/* La planche doit aussi contenir le TX-90, qui descend plus bas que
   tout le monde : un fantassin s'arrête à ses pieds, un char pose une
   ombre et deux chenilles qui débordent de vingt unités sous son
   ancre. Seule la HAUTEUR change — l'origine reste où elle est, sinon
   toutes les troupes grises des autres joueurs remonteraient d'un cran
   sur la carte. */
var VIG_W = 150, VIG_H = 186, VIG_OX = 75, VIG_OY = 152, VIG_ECH = 1.6;
var vignettes = null;
/* L'ordre fait foi : vignette() calcule son indice dessus. */
/* Speed en fait partie : les héros des AUTRES joueurs se dessinent en
   silhouette grise comme le reste de leur troupe, et un type absent de
   cette table n'aurait pas d'indice de vignette. */
var VIG_TYPES = ["furie", "commando", "ogre", "doc", "tank", "speed"];

function construitVignettesGrises(){
  vignettes = [];
  var types = VIG_TYPES;
  for(var ti = 0; ti < types.length; ti++){
    for(var dr = 0; dr < 2; dr++){
      for(var ph = 0; ph < 6; ph++){
        var cv = nouveauCanvas(VIG_W * VIG_ECH, VIG_H * VIG_ECH);
        var c = cv.getContext("2d");
        c.setTransform(VIG_ECH, 0, 0, VIG_ECH, VIG_OX * VIG_ECH, VIG_OY * VIG_ECH);
        /* UN CHAR NE SE RETOURNE PAS AU MIROIR — pas même en gris.
           Cette planche renvoyait les deux orientations d'un simple
           c.scale(-1, 1), ce qui est exactement ce que 61-tank.js
           interdit : un char miroité a ses chenilles inversées, son
           insigne à l'envers et son échappement du mauvais côté.
           Comme il se dessine à un CAP quelconque, il suffit de lui
           en donner deux : il n'a jamais besoin de miroir. */
        if(types[ti] === "tank" && typeof charTank === "function"){
          charTank(c, dr ? 0.62 : 0.62 + 3.1416, dr ? 0.28 : 0.28 + 3.1416,
                   ph * 5, 0, 0, 0, 0, 1, dr ? 2.6 : 2.6 + 3.1416, 0);
        }else{
          if(dr === 0){ c.scale(-1, 1); }
          dessineUnite(c, types[ti], ph / 6 * 6.2832, ph % 3, false);
        }
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
  /* ════════════════════════════════════════════════════════════
     LE HÉROS : SON HALO SOUS LUI, SES TRAITS DERRIÈRE

     Le halo est peint AVANT le personnage — posé par-dessus, il le
     rendrait laiteux alors qu'il doit en sortir. Les traits de
     vitesse, eux, viennent après toute la pile : ce sont eux qui
     passent devant les troupes qu'il double.
     ════════════════════════════════════════════════════════════ */
  if(UNI[u.t] && UNI[u.t].heros && typeof auraSpeed === "function")
    auraSpeed(c, p.x, p.y, z, tps, u.n);
  /* LE TANK NE SE RETOURNE PAS. Toutes les autres troupes sont des
     silhouettes de profil que le c.scale(-1, 1) ci-dessous renvoie
     vers la gauche ; un char, lui, a une caisse et une tourelle qui
     pointent chacune dans une direction quelconque. Il prend donc sa
     propre sortie, avant le miroir — et récupère au retour les
     décorations communes (brûlure, ralenti, barre de vie). */
  if(u.t === "tank" && typeof dessineTankMonde === "function"){
    dessineTankMonde(c, u, tps);
  }else if(u.t === "pyr" && typeof dessinePyrMonde === "function"){
    /* Même raison que le char : une caisse et une arme qui pointent
       chacune où elles veulent ne se retournent pas au miroir. Le JET,
       lui, n'est pas dessiné ici — il passe après toute la pile, pour
       lécher le bâtiment par-devant. Voir dessineFlammesPYR. */
    dessinePyrMonde(c, u, tps);
  }else{
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
  }

  /* ════════════════════════════════════════════════════════════
     SOUS L'AILE DU HÉROS — L'ÉNERGIE SE VOIT

     « Qu'on voie qu'il y a une énergie qui les accélère de fois deux.
     Un peu jaune, peut-être pas jaune fluo. »

     DEUX MARQUES, ET AUCUNE NE TOUCHE AU PERSONNAGE LUI-MÊME : un
     anneau d'or au sol, et deux étincelles qui montent. Repeindre la
     troupe en jaune aurait effacé ce qui la distingue — sa tenue, son
     arme, sa coiffure —, et cent Furies dorées n'auraient plus été
     cent Furies. L'énergie est AUTOUR d'elles, pas SUR elles.
     L'anneau bat, parce qu'une accélération n'est pas un état posé.
     ════════════════════════════════════════════════════════════ */
  if(u.dope && z > 0.18){
    var bat = 0.55 + 0.45 * Math.sin(tps * 6.2 + u.n * 0.7);
    c.save();
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = 0.30 + 0.22 * bat;
    c.strokeStyle = "#FFD27A";
    c.lineWidth = 1.5 * z;
    c.beginPath();
    c.ellipse(p.x, p.y, (7.5 + bat * 1.6) * z, (3.6 + bat * 0.8) * z, 0, 0, 6.2832);
    c.stroke();
    /* deux étincelles qui montent le long du corps */
    for(var se = 0; se < 2; se++){
      var ph = ((tps * 1.5 + se * 0.5 + u.n * 0.13) % 1);
      c.globalAlpha = 0.5 * (1 - ph);
      c.fillStyle = "#FFE9B0";
      c.beginPath();
      c.arc(p.x + Math.sin(tps * 4 + se * 2.1 + u.n) * 4 * z,
            p.y - (4 + ph * 22) * z, 1.1 * z, 0, 6.2832);
      c.fill();
    }
    c.restore();
  }
  if(UNI[u.t] && UNI[u.t].heros && typeof traitsSpeed === "function")
    traitsSpeed(c, u, p.x, p.y, z, tps);

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
  /* LA BARRE PASSE AU-DESSUS DE L'UNITÉ, et « au-dessus » a été
     mesuré deux fois. Le char a grandi entre-temps : sa tourelle monte
     à 29, sa coupole à 32, son antenne à 41 — et son canon, quand il
     vise vers le fond, passe encore par-dessus. À quarante-huit la
     barre lui traversait le tube et l'antenne. Elle est maintenant
     au-dessus de tout ce qu'il peut lever. */
  if(fr < 0.999 && z > 0.2)
    barreVie(c, p.x, p.y - (u.t === "tank" ? 60 : 36) * z, (u.t === "tank" ? 28 : 20) * z, fr);
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
