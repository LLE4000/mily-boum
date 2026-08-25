/* ================================================================
   LES UNITÉS DU JOUEUR — la Meuf et le Mec
   Dessinées en vecteur, repère local : les pieds sont en (0,0),
   l'unité monte vers les y négatifs. Lumière en haut à gauche.
   ================================================================ */

var C_MEUF = {
  cheveux:"#1e1a24", cheveux2:"#39303f", peau:"#f8d4ae", peauO:"#d9ab84",
  veste:"#2fb9a8", vesteO:"#1d8d80", vesteC:"#54e2ce",
  ceinture:"#ff8a1e", lance1:"#e8672f", lance2:"#f7f1e2", lueur:"#7de6ff",
  botte:"#2a2431", ruban:"#e03a3a", pantalon:"#3a4a56"
};
var C_MEC = {
  peau:"#d9a878", peauO:"#b1815a", debardeur:"#5b6b3a", debardeurO:"#3f4c27",
  plaque:"#8a9a62", plaqueO:"#66753f", gantelet:"#2e2a26", bandana:"#b8433a",
  pantalon:"#4a4436", botte:"#2c2620"
};

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
   LA MEUF — combattante au lance-roquettes
   coiffure : 0 queue haute à ruban, 1 doubles macarons, 2 carré court
   --------------------------------------------------------------- */
function dessineMeuf(c, phase, coiffure, tir){
  var C = C_MEUF;
  var p = pose(phase, 4.2);
  var yb = -p.rebond;

  /* ombre de contact */
  c.fillStyle = "rgba(0,0,0,.26)";
  c.beginPath(); c.ellipse(0, 0, 7.5, 3.2, 0, 0, 6.2832); c.fill();

  c.save();
  c.translate(0, yb);
  c.lineCap = "round";

  /* --- jambes --- */
  function jambe(dx, coul, coulB){
    c.strokeStyle = coul; c.lineWidth = 3.4;
    c.beginPath();
    c.moveTo(0, -13);
    c.quadraticCurveTo(dx * 0.5, -7.5, dx, -2.5);
    c.stroke();
    c.fillStyle = coulB;
    c.beginPath(); c.ellipse(dx + (dx > 0 ? 0.8 : -0.8), -1.4, 3.1, 1.9, 0, 0, 6.2832); c.fill();
  }
  jambe(p.jambeB * 0.9, ecl(C.pantalon, 0.8), ecl(C.botte, 0.85));
  jambe(p.jambeA * 0.9, C.pantalon, C.botte);

  /* --- torse : veste turquoise --- */
  c.save();
  c.rotate(p.incl);
  var gV = c.createLinearGradient(-6, -24, 6, -14);
  gV.addColorStop(0, C.vesteC); gV.addColorStop(0.45, C.veste); gV.addColorStop(1, C.vesteO);
  c.fillStyle = gV;
  c.beginPath();
  c.moveTo(-5.4, -13.5);
  c.lineTo(-6.2, -22.5);
  c.quadraticCurveTo(0, -25.6, 6.2, -22.5);
  c.lineTo(5.4, -13.5);
  c.quadraticCurveTo(0, -12.2, -5.4, -13.5);
  c.closePath(); c.fill();
  /* col */
  c.fillStyle = ecl(C.veste, 1.25);
  c.beginPath();
  c.moveTo(-3, -22.6); c.lineTo(0, -19.4); c.lineTo(3, -22.6);
  c.closePath(); c.fill();
  /* ceinture orange */
  c.fillStyle = C.ceinture;
  c.fillRect(-5.6, -15.4, 11.2, 2.4);
  c.fillStyle = ecl(C.ceinture, 1.35);
  c.fillRect(-5.6, -15.4, 11.2, 0.9);
  c.fillStyle = "#f7f1e2";
  c.fillRect(-1.2, -15.6, 2.4, 2.8);
  /* liseré de lumière en haut à gauche */
  c.strokeStyle = "rgba(255,255,255,.42)"; c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-5.9, -20.5); c.quadraticCurveTo(-4.4, -24.4, 0, -25.2);
  c.stroke();

  /* --- bras --- */
  c.strokeStyle = C.peauO; c.lineWidth = 2.6;
  c.beginPath();
  c.moveTo(-5, -21.5);
  c.quadraticCurveTo(-7.5 + p.brasB, -17, -6.5 + p.brasB * 1.4, -13);
  c.stroke();
  c.strokeStyle = C.peau; c.lineWidth = 2.6;
  c.beginPath();
  c.moveTo(5, -21.5);
  c.quadraticCurveTo(7.5 + p.brasA, -17.5, 5.6 + p.brasA * 1.2, -14);
  c.stroke();

  /* --- lance-roquettes sur l'épaule --- */
  c.save();
  c.translate(1.5, -23.5); c.rotate(-0.28);
  /* tube */
  var gT = c.createLinearGradient(0, -2.6, 0, 2.6);
  gT.addColorStop(0, ecl(C.lance1, 1.35)); gT.addColorStop(0.5, C.lance1); gT.addColorStop(1, ecl(C.lance1, 0.65));
  c.fillStyle = gT;
  c.beginPath();
  if(c.roundRect) c.roundRect(-10, -2.6, 20, 5.2, 2.4); else c.rect(-10, -2.6, 20, 5.2);
  c.fill();
  /* bandes crème */
  c.fillStyle = C.lance2;
  c.fillRect(-2.4, -2.6, 2.2, 5.2);
  c.fillRect(4.4, -2.6, 1.4, 5.2);
  /* bouche noire + lueur cyan */
  c.fillStyle = "#141118";
  c.beginPath(); c.ellipse(10, 0, 1.7, 2.7, 0, 0, 6.2832); c.fill();
  c.save();
  c.globalCompositeOperation = "lighter";
  var gl = c.createRadialGradient(10, 0, 0.4, 10, 0, tir ? 9 : 4.5);
  gl.addColorStop(0, rgba(C.lueur, tir ? 0.95 : 0.6));
  gl.addColorStop(1, rgba(C.lueur, 0));
  c.fillStyle = gl;
  c.beginPath(); c.arc(10, 0, tir ? 9 : 4.5, 0, 6.2832); c.fill();
  c.restore();
  /* viseur */
  c.strokeStyle = "#3a3440"; c.lineWidth = 1;
  c.beginPath(); c.moveTo(1, -2.8); c.lineTo(1, -4.6); c.lineTo(3.4, -4.6); c.stroke();
  c.restore();

  /* --- tête --- */
  c.save();
  c.translate(0, -27.4);
  /* nuque / cheveux arrière */
  c.fillStyle = C.cheveux;
  c.beginPath(); c.ellipse(-0.4, 0.4, 5.1, 5.4, 0, 0, 6.2832); c.fill();
  /* visage */
  var gP = c.createRadialGradient(-1.6, -1.8, 0.5, 0, 0, 5);
  gP.addColorStop(0, ecl(C.peau, 1.08)); gP.addColorStop(1, C.peauO);
  c.fillStyle = gP;
  c.beginPath(); c.ellipse(0.3, 0.5, 4.2, 4.6, 0, 0, 6.2832); c.fill();
  /* yeux */
  c.fillStyle = "#241d2c";
  c.beginPath(); c.ellipse(-1.1, 0.2, 0.75, 0.95, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(1.9, 0.2, 0.75, 0.95, 0, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,255,255,.75)";
  c.beginPath(); c.arc(-1.35, -0.1, 0.28, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(1.65, -0.1, 0.28, 0, 6.2832); c.fill();
  /* bouche */
  c.strokeStyle = "rgba(150,70,60,.7)"; c.lineWidth = 0.7;
  c.beginPath(); c.moveTo(-0.2, 2.4); c.quadraticCurveTo(0.6, 3.0, 1.5, 2.4); c.stroke();
  /* frange */
  c.fillStyle = C.cheveux;
  c.beginPath();
  c.moveTo(-4.6, -1.4);
  c.quadraticCurveTo(-4.0, -6.2, 0.4, -5.6);
  c.quadraticCurveTo(4.8, -5.2, 4.6, -0.8);
  c.quadraticCurveTo(3.0, -3.4, 0.2, -3.0);
  c.quadraticCurveTo(-2.4, -3.2, -4.6, -1.4);
  c.closePath(); c.fill();
  /* coiffures */
  if(coiffure === 0){
    /* queue haute avec ruban rouge */
    c.fillStyle = C.cheveux;
    c.beginPath();
    c.moveTo(-3.6, -3.8);
    c.quadraticCurveTo(-9.5, -2.5, -8.2, 5.5);
    c.quadraticCurveTo(-6.0, 1.4, -3.0, -1.6);
    c.closePath(); c.fill();
    c.fillStyle = C.ruban;
    c.beginPath(); c.ellipse(-4.2, -3.4, 1.5, 1.1, -0.5, 0, 6.2832); c.fill();
    c.fillStyle = ecl(C.ruban, 1.3);
    c.beginPath(); c.ellipse(-5.2, -4.2, 0.9, 0.7, -0.5, 0, 6.2832); c.fill();
  }else if(coiffure === 1){
    /* doubles macarons */
    c.fillStyle = C.cheveux;
    c.beginPath(); c.arc(-4.8, -3.4, 2.5, 0, 6.2832); c.fill();
    c.beginPath(); c.arc(5.2, -3.4, 2.5, 0, 6.2832); c.fill();
    c.fillStyle = C.cheveux2;
    c.beginPath(); c.arc(-5.4, -4.0, 1.1, 0, 6.2832); c.fill();
    c.beginPath(); c.arc(4.6, -4.0, 1.1, 0, 6.2832); c.fill();
  }else{
    /* carré court */
    c.fillStyle = C.cheveux;
    c.beginPath();
    c.moveTo(-5.0, -2.0);
    c.quadraticCurveTo(-6.2, 3.4, -4.2, 4.6);
    c.lineTo(-3.2, 1.0);
    c.closePath(); c.fill();
    c.beginPath();
    c.moveTo(5.0, -2.0);
    c.quadraticCurveTo(6.2, 3.4, 4.2, 4.6);
    c.lineTo(3.2, 1.0);
    c.closePath(); c.fill();
  }
  /* reflet sur les cheveux */
  c.fillStyle = "rgba(255,255,255,.16)";
  c.beginPath(); c.ellipse(-1.8, -3.6, 2.4, 1.1, -0.4, 0, 6.2832); c.fill();
  c.restore();

  c.restore();  // inclinaison
  c.restore();  // rebond
}

/* ---------------------------------------------------------------
   LE MEC — masse musclée
   --------------------------------------------------------------- */
function dessineMec(c, phase, variante, tir){
  var C = C_MEC;
  var p = pose(phase, 5.6);
  var yb = -p.rebond * 0.7;

  c.fillStyle = "rgba(0,0,0,.30)";
  c.beginPath(); c.ellipse(0, 0, 9.5, 4.0, 0, 0, 6.2832); c.fill();

  c.save();
  c.translate(0, yb);
  c.lineCap = "round";

  /* --- jambes lourdes --- */
  function jambe(dx, coul, coulB){
    c.strokeStyle = coul; c.lineWidth = 5.2;
    c.beginPath();
    c.moveTo(dx * 0.2, -15);
    c.quadraticCurveTo(dx * 0.6, -8.5, dx, -3);
    c.stroke();
    c.fillStyle = coulB;
    c.beginPath(); c.ellipse(dx + (dx > 0 ? 1 : -1), -1.6, 4.0, 2.3, 0, 0, 6.2832); c.fill();
  }
  jambe(p.jambeB * 0.8, ecl(C.pantalon, 0.78), ecl(C.botte, 0.85));
  jambe(p.jambeA * 0.8, C.pantalon, C.botte);

  c.save();
  c.rotate(p.incl * 0.6);

  /* --- torse en trapèze --- */
  var gD = c.createLinearGradient(-9, -28, 9, -16);
  gD.addColorStop(0, ecl(C.debardeur, 1.35)); gD.addColorStop(0.5, C.debardeur); gD.addColorStop(1, C.debardeurO);
  c.fillStyle = gD;
  c.beginPath();
  c.moveTo(-6.4, -15.5);
  c.lineTo(-9.6, -25.5);
  c.quadraticCurveTo(0, -29.5, 9.6, -25.5);
  c.lineTo(6.4, -15.5);
  c.quadraticCurveTo(0, -14, -6.4, -15.5);
  c.closePath(); c.fill();
  /* pectoraux */
  c.fillStyle = "rgba(0,0,0,.16)";
  c.beginPath(); c.moveTo(0, -25); c.lineTo(0, -18); c.stroke();
  c.strokeStyle = "rgba(0,0,0,.20)"; c.lineWidth = 1;
  c.beginPath(); c.moveTo(0, -25.5); c.lineTo(0, -17.5); c.stroke();
  /* peau du cou/épaules sous le débardeur */
  c.fillStyle = C.peau;
  c.beginPath(); c.ellipse(0, -26.5, 3.4, 2.2, 0, 0, 6.2832); c.fill();

  /* --- bras énormes --- */
  function bras(dx, dec, coul, devant){
    c.strokeStyle = coul; c.lineWidth = 4.6;
    c.beginPath();
    c.moveTo(dx * 0.9, -25);
    c.quadraticCurveTo(dx * 1.35 + dec * 0.6, -21, dx * 1.15 + dec, -16.5);
    c.stroke();
    /* biceps */
    c.fillStyle = coul;
    c.beginPath(); c.ellipse(dx * 1.15, -22.5, 3.0, 3.8, dx > 0 ? 0.25 : -0.25, 0, 6.2832); c.fill();
    if(devant){
      c.fillStyle = C_MEC.gantelet;
      c.beginPath(); c.ellipse(dx * 1.15 + dec, -15.6, 2.5, 2.2, 0, 0, 6.2832); c.fill();
      c.fillStyle = "rgba(255,255,255,.18)";
      c.beginPath(); c.ellipse(dx * 1.15 + dec - 0.6, -16.4, 1.2, 0.8, 0, 0, 6.2832); c.fill();
    }else{
      c.fillStyle = C_MEC.peauO;
      c.beginPath(); c.ellipse(dx * 1.15 + dec, -15.6, 2.2, 2.0, 0, 0, 6.2832); c.fill();
    }
  }
  bras(-7, p.brasB, C.peauO, false);

  /* --- plaque d'épaule blindée (côté droit, vers la lumière) --- */
  c.save();
  var gPl = c.createLinearGradient(4, -30, 12, -22);
  gPl.addColorStop(0, ecl(C.plaque, 1.4)); gPl.addColorStop(1, C.plaqueO);
  c.fillStyle = gPl;
  c.beginPath();
  c.moveTo(5.5, -27.5);
  c.quadraticCurveTo(12.5, -28.5, 12.2, -22.5);
  c.quadraticCurveTo(9, -20.5, 5.5, -22);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(255,255,255,.32)"; c.lineWidth = 1;
  c.beginPath(); c.moveTo(5.8, -26.8); c.quadraticCurveTo(11.6, -27.8, 11.9, -23.4); c.stroke();
  /* rivets */
  c.fillStyle = "rgba(0,0,0,.35)";
  for(var i = 0; i < 3; i++){
    c.beginPath(); c.arc(7 + i * 2.1, -25.6 + i * 0.5, 0.6, 0, 6.2832); c.fill();
  }
  c.restore();
  bras(7, p.brasA, C.peau, true);

  /* --- tête + bandana --- */
  c.save();
  c.translate(0.4, -31.5);
  var gP2 = c.createRadialGradient(-1.6, -1.6, 0.5, 0, 0, 5.4);
  gP2.addColorStop(0, ecl(C.peau, 1.1)); gP2.addColorStop(1, C.peauO);
  c.fillStyle = gP2;
  c.beginPath(); c.ellipse(0, 0, 4.6, 4.8, 0, 0, 6.2832); c.fill();
  /* mâchoire carrée */
  c.fillStyle = C.peauO;
  c.beginPath(); c.ellipse(0, 2.6, 3.6, 2.4, 0, 0, 6.2832); c.fill();
  /* yeux durs */
  c.fillStyle = "#2a221c";
  c.fillRect(-2.6, -0.4, 1.6, 1.0);
  c.fillRect(1.1, -0.4, 1.6, 1.0);
  /* sourcils */
  c.strokeStyle = "#3a2c20"; c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(-3.0, -1.6); c.lineTo(-0.9, -1.1); c.stroke();
  c.beginPath(); c.moveTo(3.0, -1.6); c.lineTo(0.9, -1.1); c.stroke();
  /* bouche */
  c.strokeStyle = "rgba(90,50,36,.8)"; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(-1.4, 2.6); c.lineTo(1.4, 2.6); c.stroke();
  /* bandana */
  c.fillStyle = C.bandana;
  c.beginPath();
  c.moveTo(-4.7, -1.9);
  c.quadraticCurveTo(0, -6.6, 4.7, -1.9);
  c.quadraticCurveTo(0, -3.9, -4.7, -1.9);
  c.closePath(); c.fill();
  c.fillStyle = ecl(C.bandana, 1.3);
  c.beginPath();
  c.moveTo(-4.7, -2.1); c.quadraticCurveTo(-1.5, -5.6, 1.2, -5.0);
  c.quadraticCurveTo(-1.6, -3.6, -4.4, -2.4);
  c.closePath(); c.fill();
  /* pans du bandana */
  c.fillStyle = C.bandana;
  c.beginPath();
  c.moveTo(-4.4, -2.2);
  c.quadraticCurveTo(-8.4, -0.4, -7.4, 3.4);
  c.quadraticCurveTo(-5.6, 0.4, -3.6, -0.8);
  c.closePath(); c.fill();
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
