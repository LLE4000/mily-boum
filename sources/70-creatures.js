/* ================================================================
   LES CRÉATURES DE L'ÎLE — quatre espèces
   ================================================================ */

/* ---------------- Braisard : félin incandescent ---------------- */
function dessineBraisard(c, k, tps){
  var jaune = k.teinte === 1;
  var corps = jaune ? "#d9a12c" : "#c4402c";
  var corpsO = ecl(corps, 0.66), corpsC = ecl(corps, 1.3);
  var ph = k.phase;
  var pat = Math.sin(ph) * 2.4;

  c.fillStyle = "rgba(0,0,0,.28)";
  c.beginPath(); c.ellipse(0, 0, 10, 4, 0, 0, 6.2832); c.fill();

  /* queue en fouet */
  c.strokeStyle = corpsO; c.lineWidth = 2.2; c.lineCap = "round";
  c.beginPath();
  c.moveTo(-7, -9);
  c.quadraticCurveTo(-15, -13 + Math.sin(tps * 5) * 4, -13, -21 + Math.sin(tps * 5 + 1) * 4);
  c.stroke();
  /* pattes */
  c.strokeStyle = corpsO; c.lineWidth = 2.4;
  [[-4, pat], [4, -pat], [-2, -pat], [6, pat]].forEach(function(j){
    c.beginPath(); c.moveTo(j[0], -8); c.lineTo(j[0] + j[1], -0.8); c.stroke();
  });
  /* corps */
  var g = c.createLinearGradient(0, -16, 0, -4);
  g.addColorStop(0, corpsC); g.addColorStop(1, corpsO);
  c.fillStyle = g;
  c.beginPath(); c.ellipse(0, -9.5, 9, 5.6, -0.1, 0, 6.2832); c.fill();
  /* rayures de braise sur le dos */
  c.save(); c.globalCompositeOperation = "lighter";
  c.strokeStyle = "rgba(255,140,40,.55)"; c.lineWidth = 1.4;
  for(var i = -2; i <= 2; i++){
    c.beginPath();
    c.moveTo(i * 3, -14 + Math.abs(i) * 0.9);
    c.lineTo(i * 3 + 1.5, -11 + Math.abs(i) * 0.7);
    c.stroke();
  }
  c.restore();
  /* tête */
  c.fillStyle = corps;
  c.beginPath(); c.ellipse(8.5, -13, 4.6, 4.2, 0, 0, 6.2832); c.fill();
  /* oreilles pointues */
  c.fillStyle = corpsO;
  c.beginPath(); c.moveTo(6, -16); c.lineTo(6.6, -21); c.lineTo(9.4, -16.6); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(10, -16.4); c.lineTo(12, -20.4); c.lineTo(12.6, -15.4); c.closePath(); c.fill();
  /* yeux */
  c.fillStyle = "#ffe08a";
  c.beginPath(); c.ellipse(9.8, -13.6, 1.5, 1.1, 0, 0, 6.2832); c.fill();
  c.fillStyle = "#2a1408";
  c.fillRect(9.6, -14.4, 0.6, 1.7);
  /* gueule incandescente */
  var pulse = 0.55 + 0.45 * Math.sin(tps * 6 + k.n);
  c.save(); c.globalCompositeOperation = "lighter";
  var gm = c.createRadialGradient(12.4, -11, 0.5, 12.4, -11, 5 + pulse * 3);
  gm.addColorStop(0, "rgba(255,220,140,.95)");
  gm.addColorStop(0.5, "rgba(255,110,25,.6)");
  gm.addColorStop(1, "rgba(255,60,10,0)");
  c.fillStyle = gm;
  c.beginPath(); c.arc(12.4, -11, 5 + pulse * 3, 0, 6.2832); c.fill();
  c.restore();
  /* crocs */
  c.fillStyle = "#f4ecdc";
  c.beginPath(); c.moveTo(11.4, -11.4); c.lineTo(12.2, -9.4); c.lineTo(12.6, -11.6); c.closePath(); c.fill();
}

/* ---------------- Piqueur : grosse guêpe ---------------- */
function dessinePiqueur(c, k, tps){
  var vol = Math.sin(tps * 3 + k.ph) * 3;
  c.save();
  c.globalAlpha = 0.22; c.fillStyle = "#000";
  c.beginPath(); c.ellipse(0, 0, 5, 2.2, 0, 0, 6.2832); c.fill();
  c.restore();
  c.translate(0, -14 + vol);
  /* ailes floues */
  c.save();
  c.globalAlpha = 0.34; c.fillStyle = "#dfe8f2";
  var bat = Math.sin(tps * 40 + k.ph) * 0.5;
  c.beginPath(); c.ellipse(-1, -4, 7, 2.6, -0.5 + bat, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(2, -4.4, 6, 2.3, 0.4 - bat, 0, 6.2832); c.fill();
  c.restore();
  /* abdomen rayé */
  c.fillStyle = "#20191c";
  c.beginPath(); c.ellipse(-3.6, 0.4, 5.2, 3.2, -0.25, 0, 6.2832); c.fill();
  c.fillStyle = "#e0a52c";
  for(var i = 0; i < 3; i++){
    c.save();
    c.translate(-5.4 + i * 2.0, 0.9 - i * 0.4); c.rotate(-0.25);
    c.fillRect(-0.7, -2.5, 1.4, 5);
    c.restore();
  }
  /* dard */
  c.strokeStyle = "#3a2c1c"; c.lineWidth = 1.2; c.lineCap = "round";
  c.beginPath(); c.moveTo(-8.4, 1.6); c.lineTo(-11.4, 3); c.stroke();
  /* thorax + tête */
  c.fillStyle = "#2c2427";
  c.beginPath(); c.ellipse(1.6, -0.8, 3.2, 2.8, 0, 0, 6.2832); c.fill();
  c.fillStyle = "#171317";
  c.beginPath(); c.ellipse(5.4, -1.4, 2.4, 2.2, 0, 0, 6.2832); c.fill();
  c.fillStyle = "#c8402c";
  c.beginPath(); c.ellipse(6.4, -1.8, 1.0, 1.2, 0, 0, 6.2832); c.fill();
  /* pattes */
  c.strokeStyle = "#1a1417"; c.lineWidth = 0.9;
  for(var j = 0; j < 3; j++){
    c.beginPath();
    c.moveTo(1 + j * 1.4, 1.4);
    c.lineTo(0.4 + j * 1.6, 4.4 + Math.sin(tps * 8 + j) * 0.6);
    c.stroke();
  }
}

/* ---------------- Sanglier de cendre ---------------- */
function dessineSanglier(c, k, tps){
  var ph = k.phase;
  var pat = Math.sin(ph) * 3;
  var charge = k.etat === "charge";

  c.fillStyle = "rgba(0,0,0,.32)";
  c.beginPath(); c.ellipse(0, 0, 14, 5.4, 0, 0, 6.2832); c.fill();

  /* pattes */
  c.strokeStyle = "#3d3a38"; c.lineWidth = 3.4; c.lineCap = "round";
  [[-7, pat], [6, -pat], [-4, -pat], [9, pat]].forEach(function(j){
    c.beginPath(); c.moveTo(j[0], -11); c.lineTo(j[0] + j[1], -1); c.stroke();
  });
  /* corps massif */
  var g = c.createLinearGradient(0, -24, 0, -6);
  g.addColorStop(0, "#8b8781"); g.addColorStop(0.5, "#6a6660"); g.addColorStop(1, "#454240");
  c.fillStyle = g;
  c.beginPath(); c.ellipse(0, -14, 13.5, 8.5, -0.06, 0, 6.2832); c.fill();
  /* poils hérissés + braises qui tombent du dos */
  c.strokeStyle = "#2f2c2a"; c.lineWidth = 1.2;
  for(var i = -4; i <= 3; i++){
    c.beginPath();
    c.moveTo(i * 3, -21 + Math.abs(i) * 0.6);
    c.lineTo(i * 3 - 1, -26 + Math.abs(i) * 0.9);
    c.stroke();
  }
  c.save(); c.globalCompositeOperation = "lighter";
  for(var b = 0; b < 4; b++){
    var t2 = ((tps * 0.9 + b * 0.27 + k.n * 0.11) % 1);
    var bx = -8 + b * 5, by = -22 + t2 * 20;
    c.fillStyle = "rgba(255,140,40," + (1 - t2) * 0.7 + ")";
    c.beginPath(); c.arc(bx + Math.sin(t2 * 6) * 1.5, by, 1.3 * (1 - t2 * 0.5), 0, 6.2832); c.fill();
  }
  c.restore();
  /* tête */
  c.fillStyle = "#5c5853";
  c.beginPath(); c.ellipse(13, -12, 7.5, 6, 0.14, 0, 6.2832); c.fill();
  /* groin */
  c.fillStyle = "#7d5f56";
  c.beginPath(); c.ellipse(19.5, -9.6, 3.2, 2.6, 0.2, 0, 6.2832); c.fill();
  c.fillStyle = "#4a3630";
  c.beginPath(); c.arc(19, -10, 0.7, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(20.6, -9.2, 0.7, 0, 6.2832); c.fill();
  /* défenses ivoire */
  c.fillStyle = "#f0e6cc";
  c.beginPath(); c.moveTo(17.5, -8.4); c.quadraticCurveTo(21, -8.6, 20.4, -13.4);
  c.quadraticCurveTo(19.4, -9.6, 17.4, -9.4); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(15.5, -7.6); c.quadraticCurveTo(18.4, -7.4, 17.6, -11.4);
  c.quadraticCurveTo(17, -8.4, 15.4, -8.6); c.closePath(); c.fill();
  /* œil */
  c.fillStyle = charge ? "#ff7a2a" : "#e8c060";
  c.beginPath(); c.ellipse(12.4, -14.6, 1.5, 1.2, 0, 0, 6.2832); c.fill();
  c.fillStyle = "#1a1210";
  c.beginPath(); c.arc(12.6, -14.6, 0.6, 0, 6.2832); c.fill();
  /* oreille */
  c.fillStyle = "#494541";
  c.beginPath(); c.moveTo(9, -18); c.lineTo(11, -23); c.lineTo(13, -17.6); c.closePath(); c.fill();
  if(charge){
    c.save(); c.globalCompositeOperation = "lighter";
    c.fillStyle = "rgba(255,110,30,.30)";
    c.beginPath(); c.ellipse(0, -14, 18, 11, 0, 0, 6.2832); c.fill();
    c.restore();
  }
}

/* ---------------- Crapaud gluant ---------------- */
function dessineCrapaud(c, k, tps){
  var gonfle = k.gonfle || 0;
  var resp = 1 + Math.sin(tps * 2.2 + k.ph) * 0.04 + gonfle * 0.28;

  c.fillStyle = "rgba(0,0,0,.28)";
  c.beginPath(); c.ellipse(0, 0, 10, 4, 0, 0, 6.2832); c.fill();

  c.save();
  c.scale(resp, 1 / Math.sqrt(resp));
  /* pattes arrière */
  c.fillStyle = "#4a6b32";
  c.beginPath(); c.ellipse(-7, -3.4, 4.4, 3.0, -0.35, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(7, -3.4, 4.4, 3.0, 0.35, 0, 6.2832); c.fill();
  /* corps luisant */
  var g = c.createRadialGradient(-3, -11, 1, 0, -7, 12);
  g.addColorStop(0, "#8fbc52"); g.addColorStop(0.55, "#5f8a36"); g.addColorStop(1, "#3a5622");
  c.fillStyle = g;
  c.beginPath(); c.ellipse(0, -7, 10, 7.2, 0, 0, 6.2832); c.fill();
  /* verrues */
  c.fillStyle = "rgba(30,50,18,.5)";
  for(var i = 0; i < 7; i++){
    var a = i * 1.9, r = 3 + (i % 3) * 2.2;
    c.beginPath(); c.ellipse(Math.cos(a) * r, -7 + Math.sin(a) * r * 0.6, 1.2, 0.9, 0, 0, 6.2832); c.fill();
  }
  /* gorge qui se gonfle */
  c.fillStyle = melange("#a7c95e", "#e8e05a", gonfle);
  c.beginPath(); c.ellipse(0, -3.4, 6 + gonfle * 3, 3.4 + gonfle * 3, 0, 0, 6.2832); c.fill();
  /* yeux globuleux */
  [-5.2, 5.2].forEach(function(dx){
    c.fillStyle = "#6f9a3e";
    c.beginPath(); c.arc(dx, -13.4, 3.0, 0, 6.2832); c.fill();
    c.fillStyle = "#e8d84a";
    c.beginPath(); c.arc(dx, -13.8, 2.1, 0, 6.2832); c.fill();
    c.fillStyle = "#161410";
    c.beginPath(); c.ellipse(dx, -13.8, 0.8, 1.6, 0, 0, 6.2832); c.fill();
    c.fillStyle = "rgba(255,255,255,.7)";
    c.beginPath(); c.arc(dx - 0.9, -14.6, 0.7, 0, 6.2832); c.fill();
  });
  /* bouche */
  c.strokeStyle = "#2f4a1c"; c.lineWidth = 1.1;
  c.beginPath(); c.moveTo(-5.5, -6.4); c.quadraticCurveTo(0, -4.2, 5.5, -6.4); c.stroke();
  /* reflet luisant */
  c.fillStyle = "rgba(255,255,255,.20)";
  c.beginPath(); c.ellipse(-3.4, -11.4, 3.2, 1.6, -0.4, 0, 6.2832); c.fill();
  c.restore();
}

/* ---------------- Gégé la belette ---------------- */
function dessineBelette(c, k, tps){
  var ph = k.phase;
  var bond = Math.abs(Math.sin(ph)) ;
  var dos  = Math.sin(ph) * 2.6;              // le dos qui s'arque au galop
  var saut = k.etat === "fuite" ? bond * 4.2 : bond * 1.4;

  c.fillStyle = "rgba(0,0,0,.24)";
  c.beginPath(); c.ellipse(0, 0, 8 - bond * 2, 3 - bond * 0.8, 0, 0, 6.2832); c.fill();

  c.save();
  c.translate(0, -saut);
  /* pattes */
  c.strokeStyle = "#6a4a2c"; c.lineWidth = 1.7; c.lineCap = "round";
  var ec = Math.sin(ph) * 3.4;
  c.beginPath(); c.moveTo(-5, -6); c.lineTo(-5 - ec, -0.5); c.stroke();
  c.beginPath(); c.moveTo(5, -6);  c.lineTo(5 + ec, -0.5);  c.stroke();
  c.beginPath(); c.moveTo(-3, -6); c.lineTo(-3 + ec, -0.5); c.stroke();
  c.beginPath(); c.moveTo(7, -6);  c.lineTo(7 - ec, -0.5);  c.stroke();

  /* queue longue et touffue */
  c.strokeStyle = "#8a5c30"; c.lineWidth = 3.4;
  c.beginPath();
  c.moveTo(-7, -8);
  c.quadraticCurveTo(-14, -9 - dos, -17, -15 + Math.sin(tps * 6) * 3);
  c.stroke();
  c.fillStyle = "#3a2416";
  c.beginPath(); c.ellipse(-17.5, -15.5, 2.4, 1.8, -0.5, 0, 6.2832); c.fill();

  /* corps allongé, dos arqué */
  var g = c.createLinearGradient(0, -14, 0, -4);
  g.addColorStop(0, "#c08a4e"); g.addColorStop(0.55, "#9a6a38"); g.addColorStop(1, "#6f4a26");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(-8, -8);
  c.quadraticCurveTo(-2, -12 - dos, 4, -10.5);
  c.quadraticCurveTo(9, -9.5, 10, -8);
  c.quadraticCurveTo(6, -4.6, -1, -5);
  c.quadraticCurveTo(-6, -5.2, -8, -8);
  c.closePath(); c.fill();
  /* ventre crème */
  c.fillStyle = "#efdfbe";
  c.beginPath(); c.ellipse(1, -6.2, 6, 1.7, -0.05, 0, 6.2832); c.fill();

  /* tête */
  c.fillStyle = "#a9743d";
  c.beginPath(); c.ellipse(11.5, -10.4, 4.2, 3.3, 0.18, 0, 6.2832); c.fill();
  /* museau */
  c.fillStyle = "#efdfbe";
  c.beginPath(); c.ellipse(14.6, -9.2, 2.4, 1.7, 0.2, 0, 6.2832); c.fill();
  c.fillStyle = "#3a2018";
  c.beginPath(); c.arc(16.4, -8.8, 0.85, 0, 6.2832); c.fill();
  /* oreilles rondes */
  c.fillStyle = "#8a5c30";
  c.beginPath(); c.ellipse(9.4, -13.4, 2.1, 2.0, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(12.6, -13.6, 1.8, 1.8, 0, 0, 6.2832); c.fill();
  c.fillStyle = "#d9a882";
  c.beginPath(); c.ellipse(9.4, -13.2, 1.1, 1.0, 0, 0, 6.2832); c.fill();
  /* œil vif */
  c.fillStyle = "#1a1008";
  c.beginPath(); c.ellipse(12.4, -10.8, 1.15, 1.25, 0, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,255,255,.85)";
  c.beginPath(); c.arc(12.0, -11.2, 0.42, 0, 6.2832); c.fill();
  /* moustaches */
  c.strokeStyle = "rgba(255,250,235,.55)"; c.lineWidth = 0.5;
  for(var w = -1; w <= 1; w++){
    c.beginPath(); c.moveTo(15, -9.4); c.lineTo(19.5, -10.6 + w * 1.5); c.stroke();
  }
  /* liseré de lumière */
  c.strokeStyle = "rgba(255,240,210,.35)"; c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-7, -8.4); c.quadraticCurveTo(-1.5, -12.4 - dos, 4.5, -11);
  c.stroke();
  c.restore();
}

var DESSIN_CRE = {
  belette:dessineBelette,
  braisard:dessineBraisard, piqueur:dessinePiqueur,
  sanglier:dessineSanglier, crapaud:dessineCrapaud
};

function dessineCreature(c, k, tps){
  var p = versEcran(cam, k.gx, k.gy);
  var z = cam.z;
  c.save();
  c.translate(p.x, p.y);
  c.scale(z, z);
  if(!k.droite) c.scale(-1, 1);
  DESSIN_CRE[k.t](c, k, tps);
  c.restore();
  var f = CRE[k.t];
  var fr = k.pv / f.pv;
  if(fr < 0.999 && z > 0.2) barreVie(c, p.x, p.y - 34 * z, 20 * z, fr, "#c98adf");
}
