/* ================================================================
   INTERFACE — briefing, HUD, saisie tactile, plein écran
   ================================================================ */

var $ = function(id){ return document.getElementById(id); };
var compoBarges = [];
var carteSalon = 0;
var tempsGlobal = 0;
var enJeu = false;

/* ---------------------------------------------------------------
   Dimensionnement du canevas — il mesure sa taille réelle
   --------------------------------------------------------------- */
function ajuste(){
  dpr = Math.min(2, window.devicePixelRatio || 1);
  var r = cv.getBoundingClientRect();
  if(r.width > 40 && r.height > 40){ W = Math.round(r.width); H = Math.round(r.height); }
  cv.width = Math.round(W * dpr);
  cv.height = Math.round(H * dpr);
  if(ctx){ ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = true; }
}

/* ---------------------------------------------------------------
   Caméra bornée : la carte reste toujours partiellement visible
   --------------------------------------------------------------- */
function borneCamera(){
  cam.z = borne(cam.z, ZMIN, ZMAX);
  var a = iso(0, GH), b = iso(GW + 8, 0);            // extrêmes gauche / droite
  var c = iso(0, 0), d = iso(GW + 8, GH);            // extrêmes haut / bas
  var x0 = a.x, x1 = b.x, y0 = c.y, y1 = d.y;
  var mx = W * 0.42, my = H * 0.42;
  cam.px = borne(cam.px, mx - x1 * cam.z, W - mx - x0 * cam.z);
  cam.py = borne(cam.py, my - y1 * cam.z, H - my - y0 * cam.z);
}
function zoomVers(sx, sy, facteur){
  var av = cam.z;
  cam.z = borne(cam.z * facteur, ZMIN, ZMAX);
  cam.px = sx - (sx - cam.px) * (cam.z / av);
  cam.py = sy - (sy - cam.py) * (cam.z / av);
  borneCamera();
}

/* ---------------------------------------------------------------
   Saisie tactile / souris
   --------------------------------------------------------------- */
var pointeurs = {}, ordrePt = [];
var glisse = null, pincee = null;

function posEv(e){
  var r = cv.getBoundingClientRect();
  return { x:e.clientX - r.left, y:e.clientY - r.top };
}
function installeSaisie(){
  cv.addEventListener("pointerdown", function(e){
    if(!enJeu) return;
    cv.setPointerCapture(e.pointerId);
    var p = posEv(e);
    pointeurs[e.pointerId] = { x:p.x, y:p.y, x0:p.x, y0:p.y, bouge:0 };
    ordrePt.push(e.pointerId);
    if(ordrePt.length === 1){
      glisse = { px:cam.px, py:cam.py, x:p.x, y:p.y };
      viseur.actif = !!jeu.capArmee;
      viseur.x = p.x; viseur.y = p.y;
    }else if(ordrePt.length === 2){
      var a = pointeurs[ordrePt[0]], b = pointeurs[ordrePt[1]];
      pincee = debutPince(cam, a.x, a.y, b.x, b.y);
      glisse = null;
      viseur.actif = false;
    }
    e.preventDefault();
  }, { passive:false });

  cv.addEventListener("pointermove", function(e){
    var pt = pointeurs[e.pointerId];
    if(!pt) return;
    var p = posEv(e);
    pt.bouge += Math.hypot(p.x - pt.x, p.y - pt.y);
    pt.x = p.x; pt.y = p.y;
    if(ordrePt.length >= 2 && pincee){
      var a = pointeurs[ordrePt[0]], b = pointeurs[ordrePt[1]];
      appliquePince(cam, pincee, a.x, a.y, b.x, b.y, ZMIN, ZMAX);
      borneCamera();
    }else if(glisse){
      if(jeu.capArmee && viseur.actif){
        viseur.x = p.x; viseur.y = p.y;
      }else{
        cam.px = glisse.px + (p.x - glisse.x);
        cam.py = glisse.py + (p.y - glisse.y);
        borneCamera();
      }
    }
    e.preventDefault();
  }, { passive:false });

  function relache(e){
    var pt = pointeurs[e.pointerId];
    if(!pt) return;
    var etaitSeul = ordrePt.length === 1;
    delete pointeurs[e.pointerId];
    var k = ordrePt.indexOf(e.pointerId);
    if(k >= 0) ordrePt.splice(k, 1);

    if(etaitSeul && pt.bouge < 9){
      appuie(pt.x, pt.y);
    }
    if(ordrePt.length === 1){
      /* on repart de la position du doigt restant : pas de saut */
      var r = pointeurs[ordrePt[0]];
      glisse = { px:cam.px, py:cam.py, x:r.x, y:r.y };
      pincee = null;
    }else if(ordrePt.length === 0){
      glisse = null; pincee = null; viseur.actif = false;
    }
  }
  cv.addEventListener("pointerup", relache);
  cv.addEventListener("pointercancel", relache);

  cv.addEventListener("wheel", function(e){
    if(!enJeu) return;
    var p = posEv(e);
    zoomVers(p.x, p.y, e.deltaY < 0 ? 1.14 : 1 / 1.14);
    e.preventDefault();
  }, { passive:false });

  window.addEventListener("resize", function(){ ajuste(); borneCamera(); });
  window.addEventListener("orientationchange", function(){ setTimeout(function(){ ajuste(); borneCamera(); }, 220); });
  document.addEventListener("fullscreenchange", function(){ setTimeout(function(){ ajuste(); borneCamera(); }, 220); });

  /* minicarte cliquable */
  miniCv.addEventListener("pointerdown", function(e){
    var r = miniCv.getBoundingClientRect();
    var gx = (e.clientX - r.left) / r.width * GW;
    var gy = (e.clientY - r.top) / r.height * GH;
    centreSur(borne(gx, 0, GW), borne(gy, 0, GH));
    borneCamera();
    e.preventDefault();
  });
}

function appuie(sx, sy){
  if(jeu.fin) return;
  var w = versMonde(cam, sx, sy);
  var m = jeu.capArmee;
  if(m && m !== "debarquer"){
    utiliseCapacite(m, w.gx, w.gy);
    return;
  }
  /* débarquement : sur la plage uniquement */
  if(w.gx >= PLAGE_X0 - 1.5 && jeu.barges.length){
    poseBarge(w.gx, w.gy);
    if(jeu.capArmee === "debarquer" && !jeu.barges.length){ jeu.capArmee = null; majMenu(); }
    return;
  }
  if(m === "debarquer") message("Le débarquement se fait sur la plage, à l'est.");
}

/* ---------------------------------------------------------------
   Messages, alertes, bandeaux
   --------------------------------------------------------------- */
var flashT = 0;
function message(s){
  var f = $("flash");
  f.textContent = s;
  f.classList.add("on");
  flashT = 2.2;
}
function majFlash(dt){
  if(flashT > 0){
    flashT -= dt;
    if(flashT <= 0) $("flash").classList.remove("on");
  }
}
function montreAlerte(s){
  var b = $("bandeauAlerte");
  b.textContent = s;
  b.style.display = "block";
}
function cacheAlerte(){ $("bandeauAlerte").style.display = "none"; }
function montreBandeauFantome(on){ $("bc").classList.toggle("on", !!on); }
function majBandeauFantome(t){
  var m = Math.max(0, Math.floor(t / 60)), s = Math.max(0, Math.floor(t % 60));
  $("bcTps").textContent = m + ":" + (s < 10 ? "0" : "") + s;
}

/* ---------------------------------------------------------------
   HUD
   --------------------------------------------------------------- */
function nombre(n){
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
function majBarres(){
  if(!jeu) return;
  $("poudreV").textContent = Math.floor(jeu.poudre);
  $("unitesV").textContent = jeu.unites.length;
  var fr = Math.max(0, jeu.qg.pv / jeu.qg.pvMax);
  $("jaugeQGin").style.width = (fr * 100).toFixed(2) + "%";
  $("jaugeQGtx").textContent = nombre(Math.max(0, jeu.qg.pv)) + " / " + nombre(jeu.qg.pvMax);
  $("nomCarte").textContent = CARTES[jeu.index % CARTES.length].nom;
  majListeBarges();
  majMenu();
}
function majListeBarges(){
  var l = $("listeBarges");
  var html = "";
  for(var i = 0; i < jeu.barges.length; i++){
    var b = jeu.barges[i];
    html += '<div class="bg1' + (i === jeu.bargeSel ? " sel" : "") + '" data-i="' + i + '">'
          + '<div class="n">' + (b.meuf + b.mec) + '</div>'
          + '<div class="d">' + b.meuf + "F " + b.mec + "H</div></div>";
  }
  if(!jeu.barges.length) html = '<div class="bg1" style="width:auto;padding:6px 10px">aucune</div>';
  l.innerHTML = html;
  var els = l.querySelectorAll(".bg1[data-i]");
  for(var k = 0; k < els.length; k++){
    els[k].addEventListener("pointerdown", function(e){
      jeu.bargeSel = +this.getAttribute("data-i");
      majListeBarges();
      e.preventDefault();
    });
  }
}

/* --- menu des capacités --- */
var TUILES = [
  { m:"obus",      nom:"Obus" },
  { m:"barrage",   nom:"Barrage" },
  { m:"fumee",     nom:"Fumigène" },
  { m:"fusee",     nom:"Éclairante" },
  { m:"soins",     nom:"Soins" },
  { m:"debarquer", nom:"Débarquer" }
];
function construitMenu(){
  var h = "";
  for(var i = 0; i < TUILES.length; i++){
    var t = TUILES[i];
    h += '<div class="cap" data-m="' + t.m + '">'
       + '<canvas width="60" height="60" id="ic_' + t.m + '"></canvas>'
       + '<div class="nm">' + t.nom + '</div>'
       + (t.m === "debarquer" ? '' : '<div class="cx" id="cx_' + t.m + '">0</div>')
       + '</div>';
  }
  $("caps").innerHTML = h;
  var els = $("caps").querySelectorAll(".cap");
  for(var k = 0; k < els.length; k++){
    els[k].addEventListener("pointerdown", function(e){
      armeCapacite(this.getAttribute("data-m"));
      e.preventDefault();
    });
  }
  TUILES.forEach(function(t){ dessineIcone(t.m, $("ic_" + t.m).getContext("2d")); });
}
function majMenu(){
  if(!jeu) return;
  var els = $("caps").querySelectorAll(".cap");
  for(var k = 0; k < els.length; k++){
    var m = els[k].getAttribute("data-m");
    els[k].classList.toggle("arme", jeu.capArmee === m);
    if(m !== "debarquer"){
      var c = coutActuel(m, jeu.usages);
      $("cx_" + m).textContent = c;
      els[k].classList.toggle("pauvre", jeu.poudre < c);
    }else{
      els[k].classList.toggle("pauvre", jeu.barges.length === 0);
    }
  }
}
function dessineIcone(m, c){
  c.clearRect(0, 0, 60, 60);
  c.save();
  c.translate(30, 30);
  if(m === "obus"){
    c.fillStyle = "#ffd070";
    c.beginPath(); c.moveTo(0, -18); c.lineTo(8, -4); c.lineTo(8, 12); c.lineTo(-8, 12); c.lineTo(-8, -4);
    c.closePath(); c.fill();
    c.fillStyle = "#e8672f"; c.fillRect(-8, 2, 16, 5);
    c.fillStyle = "rgba(255,255,255,.35)"; c.fillRect(-6, -10, 4, 18);
  }else if(m === "barrage"){
    for(var i = -1; i <= 1; i++){
      c.save(); c.translate(i * 12, i === 0 ? -4 : 3); c.rotate(i * 0.3);
      c.fillStyle = "#8a9a62";
      c.beginPath(); c.moveTo(0, -13); c.lineTo(5, -2); c.lineTo(5, 11); c.lineTo(-5, 11); c.lineTo(-5, -2);
      c.closePath(); c.fill();
      c.fillStyle = "#e8672f"; c.fillRect(-5, 3, 10, 4);
      c.restore();
    }
  }else if(m === "fumee"){
    c.fillStyle = "#c9c4d2";
    [[0, -2, 13], [-11, 5, 9], [11, 5, 9], [0, 10, 8]].forEach(function(o){
      c.beginPath(); c.arc(o[0], o[1], o[2], 0, 6.2832); c.fill();
    });
    c.fillStyle = "#8e8894";
    c.beginPath(); c.arc(-5, 2, 7, 0, 6.2832); c.fill();
  }else if(m === "fusee"){
    var g = c.createRadialGradient(0, -4, 1, 0, -4, 18);
    g.addColorStop(0, "#fff8d8"); g.addColorStop(0.4, "#ffd070"); g.addColorStop(1, "rgba(255,138,30,0)");
    c.fillStyle = g;
    c.beginPath(); c.arc(0, -4, 18, 0, 6.2832); c.fill();
    c.strokeStyle = "#f0e6d2"; c.lineWidth = 2;
    c.beginPath(); c.arc(0, -12, 9, Math.PI, 0); c.stroke();
    c.beginPath(); c.moveTo(-9, -12); c.lineTo(0, -2); c.lineTo(9, -12); c.stroke();
    c.fillStyle = "#ff8a1e";
    c.beginPath(); c.arc(0, 0, 3.4, 0, 6.2832); c.fill();
  }else if(m === "soins"){
    c.fillStyle = "#6ee08a";
    c.fillRect(-5, -16, 10, 32);
    c.fillRect(-16, -5, 32, 10);
    c.fillStyle = "rgba(255,255,255,.3)";
    c.fillRect(-5, -16, 4, 32);
  }else if(m === "debarquer"){
    c.fillStyle = "#8a9a62";
    c.beginPath(); c.moveTo(-18, 2); c.lineTo(18, 2); c.lineTo(13, 14); c.lineTo(-13, 14);
    c.closePath(); c.fill();
    c.fillStyle = "#54e2ce";
    c.beginPath(); c.arc(-6, -4, 4.5, 0, 6.2832); c.fill();
    c.beginPath(); c.arc(6, -4, 4.5, 0, 6.2832); c.fill();
    c.fillStyle = "#2fb9a8";
    c.fillRect(-9, -2, 6, 6); c.fillRect(3, -2, 6, 6);
    c.strokeStyle = "rgba(255,255,255,.4)"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-18, 4); c.lineTo(18, 4); c.stroke();
  }
  c.restore();
}

/* --- podium --- */
function majPodium(){
  if(!jeu) return;
  var l = [{ nom:monNom, g:jeu.degatsMoi, moi:1 }];
  for(var id in autresJoueurs){
    var j = autresJoueurs[id];
    l.push({ nom:j.nom, g:j.g, moi:0 });
  }
  l.sort(function(a, b){ return b.g - a.g; });
  var med = ["🥇", "🥈", "🥉"];
  var h = "";
  for(var i = 0; i < Math.min(3, l.length); i++){
    h += '<div class="r' + (l[i].moi ? " moi" : "") + '"><span>' + med[i] + '</span>'
       + '<span class="n">' + echappe(l[i].nom) + '</span>'
       + '<span class="v">' + nombre(l[i].g) + '</span></div>';
  }
  $("podiumL").innerHTML = h;
  $("podium").style.display = l.length > 1 ? "block" : "none";
}
function echappe(s){
  return String(s).replace(/[&<>"]/g, function(c){
    return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c];
  });
}

/* ---------------------------------------------------------------
   Écran de bilan
   --------------------------------------------------------------- */
var bilanT = 0, bilanActif = false;
function montreBilan(){
  if(bilanActif) return;
  bilanActif = true;
  bilanT = EQ.BILAN_SECONDES;
  var l = [{ nom:monNom, g:jeu.degatsMoi, moi:1 }];
  for(var id in autresJoueurs) l.push({ nom:autresJoueurs[id].nom, g:autresJoueurs[id].g, moi:0 });
  l.sort(function(a, b){ return b.g - a.g; });
  var med = ["🥇", "🥈", "🥉"];
  var h = "";
  for(var i = 0; i < l.length; i++){
    h += '<div class="r' + (l[i].moi ? " moi" : "") + '">'
       + '<span>' + (med[i] || (i + 1) + ".") + '</span>'
       + '<span class="n">' + echappe(l[i].nom) + '</span>'
       + '<span class="v">' + nombre(l[i].g) + ' dégâts</span></div>';
  }
  $("bilanLi").innerHTML = h;
  $("bilan").classList.add("on");
}
function majBilan(dt){
  if(!bilanActif) return;
  bilanT -= dt;
  $("bilanC").textContent = Math.max(0, Math.ceil(bilanT));
  if(bilanT <= 0){
    bilanActif = false;
    $("bilan").classList.remove("on");
    var suiv = Math.max(carteSalon, jeu.index + 1);
    carteSalon = suiv;
    if(suiv >= CARTES.length){
      /* toutes les îles sont tombées : on recommence à la première */
      carteSalon = 0; suiv = 0;
    }
    nouvelleCarte(suiv);
    construitFondMini();
    majBarres();
    majMondes();
    message("Nouvelle île : " + CARTES[suiv % CARTES.length].nom);
  }
}

/* ---------------------------------------------------------------
   BRIEFING
   --------------------------------------------------------------- */
function dessineLogo(){
  var c = $("logoCv").getContext("2d");
  var w = 840, h = 230;
  c.clearRect(0, 0, w, h);
  /* halo */
  var g = c.createRadialGradient(w / 2, h * 0.55, 20, w / 2, h * 0.55, 380);
  g.addColorStop(0, "rgba(255,140,40,.35)");
  g.addColorStop(1, "rgba(255,80,20,0)");
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  /* texte */
  c.textAlign = "center"; c.textBaseline = "middle";
  c.font = "900 118px 'Trebuchet MS', 'Segoe UI', sans-serif";
  c.lineJoin = "round";
  c.lineWidth = 26; c.strokeStyle = "#180a04";
  c.strokeText("Mily Boum", w / 2, h * 0.52);
  c.lineWidth = 12; c.strokeStyle = "#3a1408";
  c.strokeText("Mily Boum", w / 2, h * 0.52);
  var gt = c.createLinearGradient(0, h * 0.2, 0, h * 0.85);
  gt.addColorStop(0, "#ffeec0"); gt.addColorStop(0.45, "#ffb03a");
  gt.addColorStop(0.75, "#f0621c"); gt.addColorStop(1, "#c8300e");
  c.fillStyle = gt;
  c.fillText("Mily Boum", w / 2, h * 0.52);
  /* reflet */
  c.save();
  c.beginPath(); c.rect(0, 0, w, h * 0.48); c.clip();
  c.fillStyle = "rgba(255,255,255,.28)";
  c.fillText("Mily Boum", w / 2, h * 0.52);
  c.restore();
  /* étincelles */
  var al = prng(2024);
  c.save(); c.globalCompositeOperation = "lighter";
  for(var i = 0; i < 26; i++){
    var x = al() * w, y = h * 0.28 + al() * h * 0.5;
    c.fillStyle = "rgba(255," + (150 + al() * 90 | 0) + ",60," + (0.2 + al() * 0.5) + ")";
    c.beginPath(); c.arc(x, y, 1 + al() * 2.6, 0, 6.2832); c.fill();
  }
  c.restore();
}

function construitBriefing(){
  /* barges par défaut : que des Meufs */
  compoBarges = [];
  for(var i = 0; i < EQ.NB_BARGES; i++) compoBarges.push({ meuf:EQ.PLACES_PAR_BARGE, mec:0 });
  var sauv = null;
  try{ sauv = JSON.parse(localStorage.getItem("milyboum") || "null"); }catch(e){}
  if(sauv){
    if(sauv.nom) $("pseudo").value = sauv.nom;
    if(sauv.compo && sauv.compo.length === EQ.NB_BARGES) compoBarges = sauv.compo;
    if(sauv.relais) $("relais").value = sauv.relais;
  }
  if(!$("pseudo").value) $("pseudo").value = "Recrue" + ((Math.random() * 900 + 100) | 0);

  dessineLogo();
  majBargesBrief();
  majMondes();

  $("lancer").addEventListener("click", lancePartie);
  $("btReco").addEventListener("click", function(){
    monNom = ($("pseudo").value || "Recrue").substr(0, 14);
    connecteRelais($("relais").value);
  });
  $("relais").addEventListener("change", function(){
    sauvegarde();
    connecteRelais($("relais").value);
  });
  $("pseudo").addEventListener("change", function(){
    monNom = ($("pseudo").value || "Recrue").substr(0, 14);
    sauvegarde();
  });
  $("btSon").addEventListener("click", function(){
    son.actif = !son.actif;
    this.textContent = son.actif ? "🔊 Son activé" : "🔇 Son coupé";
  });
  $("btPlein").addEventListener("click", basculePlein);
}
function sauvegarde(){
  try{
    localStorage.setItem("milyboum", JSON.stringify({
      nom:$("pseudo").value, compo:compoBarges, relais:$("relais").value
    }));
  }catch(e){}
}
function majBargesBrief(){
  var h = "";
  for(var i = 0; i < EQ.NB_BARGES; i++){
    var b = compoBarges[i];
    h += '<div class="barge"><div class="tt"><span>Barge ' + (i + 1) + '</span>'
       + '<span>' + (b.meuf + b.mec) + '/' + EQ.PLACES_PAR_BARGE + '</span></div>'
       + rangee(i, "meuf", b.meuf) + rangee(i, "mec", b.mec) + '</div>';
  }
  $("barges").innerHTML = h;
  var els = $("barges").querySelectorAll(".mini");
  for(var k = 0; k < els.length; k++){
    els[k].addEventListener("click", function(){
      var i = +this.getAttribute("data-i"), t = this.getAttribute("data-t"), d = +this.getAttribute("data-d");
      var b = compoBarges[i];
      var tot = b.meuf + b.mec;
      if(d > 0 && tot >= EQ.PLACES_PAR_BARGE) return;
      b[t] = Math.max(0, b[t] + d);
      majBargesBrief();
      sauvegarde();
    });
  }
  var tot = 0, tm = 0, th = 0;
  compoBarges.forEach(function(b){ tot += b.meuf + b.mec; tm += b.meuf; th += b.mec; });
  $("totalTroupes").innerHTML = "Flotte : <b>" + tot + "</b> unités — " + tm + " Meufs, " + th + " Mecs";
}
function rangee(i, t, v){
  return '<div class="rangee"><span class="lab"><span class="pion ' + (t === "meuf" ? "f" : "m") + '"></span>'
       + (t === "meuf" ? "Meufs" : "Mecs") + '</span>'
       + '<button class="mini" data-i="' + i + '" data-t="' + t + '" data-d="-1">−</button>'
       + '<span class="compt">' + v + '</span>'
       + '<button class="mini" data-i="' + i + '" data-t="' + t + '" data-d="1">+</button></div>';
}
function majMondes(){
  var h = "";
  for(var i = 0; i < CARTES.length; i++){
    var etat = i < carteSalon ? "tombée" : (i === carteSalon ? "en cours" : "verrouillée");
    var cl = i < carteSalon ? "faite" : (i === carteSalon ? "actif" : "verrou");
    h += '<div class="monde ' + cl + '"><canvas width="360" height="148" id="mn' + i + '"></canvas>'
       + '<div class="etat">' + etat + '</div>'
       + '<div class="nom">' + CARTES[i].nom + '<br><span style="font-size:11px;color:#a99cb4">QG '
       + nombre(CARTES[i].pvQG) + ' PV</span></div></div>';
  }
  $("mondes").innerHTML = h;
  for(var k = 0; k < CARTES.length; k++) dessineApercu(k);
}
function dessineApercu(i){
  var el = $("mn" + i);
  if(!el) return;
  var c = el.getContext("2d");
  var b = BIOMES[CARTES[i].biome];
  var w = 360, h = 148;
  var g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, b.ciel); g.addColorStop(0.42, b.eau); g.addColorStop(1, b.eauO);
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  /* île */
  c.fillStyle = b.fond;
  c.beginPath(); c.ellipse(w / 2, h * 0.78, w * 0.46, h * 0.34, 0, 0, 6.2832); c.fill();
  c.fillStyle = b.sol1;
  c.beginPath(); c.ellipse(w / 2, h * 0.78, w * 0.40, h * 0.28, 0, 0, 6.2832); c.fill();
  c.fillStyle = "#e6d3a4";
  c.beginPath(); c.ellipse(w * 0.78, h * 0.80, w * 0.14, h * 0.20, 0, 0, 6.2832); c.fill();
  /* décor */
  var al = prng(graineCarte(CODE_SALON, i));
  for(var k = 0; k < 22; k++){
    var x = w * 0.16 + al() * w * 0.62, y = h * 0.60 + al() * h * 0.30;
    c.save(); c.translate(x, y); c.scale(0.42, 0.42);
    if(CARTES[i].biome === "plage") palmier(c, 0, 0, 1);
    else if(CARTES[i].biome === "foret") sapin(c, 0, 0, 1);
    else meule(c, 0, 0, 1);
    c.restore();
  }
  /* QG stylisé */
  c.save(); c.translate(w * 0.22, h * 0.74); c.scale(0.30, 0.30);
  if(spriteQG) c.drawImage(spriteQG, -QG_OX, -QG_OY, QG_W, QG_H);
  c.restore();
  /* voile */
  var v = c.createLinearGradient(0, 0, 0, h);
  v.addColorStop(0, "rgba(20,10,28,.35)"); v.addColorStop(1, "rgba(20,10,28,0)");
  c.fillStyle = v; c.fillRect(0, 0, w, h);
}
function majEtatReseau(){
  var p = $("pRes"), t = $("txRes");
  if(!p) return;
  p.className = "pastille";
  var n = 0;
  for(var k in autresJoueurs) n++;
  if(reseau.etat === "ok"){
    p.classList.add("ok");
    t.textContent = "Salon MILY — connecté" + (n ? " · " + n + " autre" + (n > 1 ? "s" : "") + " joueur" + (n > 1 ? "s" : "") : " · seul pour l'instant");
  }else if(reseau.etat === "coupe" || reseau.etat === "erreur" || reseau.etat === "refus"){
    p.classList.add("ko");
    t.textContent = "Relais injoignable — le jeu marche quand même en solo. Essaie l'autre relais.";
  }else{
    p.classList.add("att");
    t.textContent = "Connexion au salon MILY…";
  }
}

/* ---------------------------------------------------------------
   Plein écran
   --------------------------------------------------------------- */
function basculePlein(){
  var d = document;
  if(!d.fullscreenElement){
    var e = d.documentElement;
    var f = e.requestFullscreen || e.webkitRequestFullscreen;
    if(f) f.call(e).then(function(){
      if(screen.orientation && screen.orientation.lock){
        screen.orientation.lock("landscape").catch(function(){});
      }
    }).catch(function(){});
  }else{
    (d.exitFullscreen || d.webkitExitFullscreen || function(){}).call(d);
  }
}

/* ---------------------------------------------------------------
   Lancement de la partie
   --------------------------------------------------------------- */
function lancePartie(){
  monNom = ($("pseudo").value || "Recrue").substr(0, 14);
  sauvegarde();
  son.reveille();
  $("brief").style.display = "none";
  $("hud").classList.add("on");
  enJeu = true;
  ajuste();
  nouvelleCarte(carteSalon);
  construitFondMini();
  construitMenu();
  majBarres();
  majPodium();
  message("Choisis une barge en bas à gauche, puis appuie sur la plage.");
  if(reseau.connecte) envoie({ t:"bonjour", nom:monNom });
}

/* Boutons du HUD */
function installeBoutons(){
  $("btZp").addEventListener("click", function(){ zoomVers(W / 2, H / 2, 1.25); });
  $("btZm").addEventListener("click", function(){ zoomVers(W / 2, H / 2, 1 / 1.25); });
  $("btCentre").addEventListener("click", function(){ centreSur(jeu.qg.gx, jeu.qg.gy); borneCamera(); });
  $("btPlein2").addEventListener("click", basculePlein);
}
