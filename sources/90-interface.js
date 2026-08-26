/* ================================================================
   INTERFACE — briefing, HUD, saisie tactile, plein écran
   ================================================================ */

var $ = function(id){ return document.getElementById(id); };
var compoBarges = [];
var carteSalon = 0;
var cycleSalon = 0;      // numéro de campagne : +1 à chaque tour complet des îles
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
var SEUIL_TAP = 9;          // px : au-delà, c'est un glissé, pas un tap

var rectCv = null;
function invalideRect(){ rectCv = null; }

/* ---------------------------------------------------------------
   ROTATION DE LA TABLETTE
   Le canevas change de forme ; le joueur, lui, doit continuer à
   regarder EXACTEMENT le même endroit de l'île. cam.px/py sont des
   décalages en pixels d'écran mesurés depuis le coin haut-gauche : les
   laisser tels quels ancre la carte sur ce coin, et le point visé
   partait de dix-sept cases d'un bout à l'autre d'un quart de tour.
   On retient donc le point du monde sous le centre de l'écran, on
   redimensionne, puis on recadre dessus.
   L'ORDRE COMPTE : on borne le zoom AVANT centreSur(), jamais après —
   centreSur() cadre pour le zoom courant, et un zoom rectifié ensuite
   décalerait le cadrage qu'on vient de poser.
   --------------------------------------------------------------- */
function ajusteEtRecadre(){
  var avantW = W, avantH = H;
  /* Hors partie (briefing, éditeur), la caméra ne montre rien : on se
     contente de redimensionner. */
  var vise = (jeu && avantW > 40 && avantH > 40) ? versMonde(cam, avantW / 2, avantH / 2) : null;
  invalideRect();
  ajuste();
  if(W === avantW && H === avantH) return;   // rien n'a bougé : on ne touche à rien
  /* Un geste en cours parle en pixels de l'ANCIEN écran : on le jette
     plutôt que de le laisser téléporter la caméra au doigt suivant. */
  pointeurs = {}; ordrePt = []; glisse = null; pincee = null;
  viseur.actif = false;
  if(vise){
    cam.z = borne(cam.z, ZMIN, ZMAX);
    centreSur(vise.gx, vise.gy);
  }
  borneCamera();
}

/* Toutes les façons dont l'écran peut changer de forme aboutissent ici.
   Sur tablette, aucune n'est fiable seule : « resize » arrive parfois
   avant que la page ait pris sa nouvelle taille, « orientationchange »
   arrive AVANT la mise en page, et la fenêtre visuelle (barres du
   navigateur, clavier) bouge sans prévenir ni l'un ni l'autre. On les
   écoute donc toutes, plus le canevas lui-même, et ajusteEtRecadre()
   ne fait rien quand rien n'a bougé : les doublons ne coûtent rien. */
function installeViewport(){
  window.addEventListener("resize", ajusteEtRecadre);
  window.addEventListener("scroll", invalideRect, true);
  window.addEventListener("orientationchange", function(){
    invalideRect();
    ajusteEtRecadre();
    setTimeout(ajusteEtRecadre, 120);
    setTimeout(ajusteEtRecadre, 320);
  });
  document.addEventListener("fullscreenchange", function(){
    invalideRect();
    ajusteEtRecadre();
    setTimeout(ajusteEtRecadre, 220);
  });
  if(window.visualViewport){
    window.visualViewport.addEventListener("resize", ajusteEtRecadre);
    window.visualViewport.addEventListener("scroll", invalideRect);
  }
  /* Le dernier filet, et le seul qui parle APRÈS la mise en page : le
     canevas signale lui-même que sa boîte a changé. */
  if(window.ResizeObserver){
    var obs = new ResizeObserver(ajusteEtRecadre);
    obs.observe(cv);
  }
}
function posEv(e){
  if(!rectCv) rectCv = cv.getBoundingClientRect();
  return { x:e.clientX - rectCv.left, y:e.clientY - rectCv.top };
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
      /* Le viseur suit le doigt, MAIS la caméra suit aussi : armer une
         capacité ne doit jamais confisquer le pan. Tant que le doigt
         n'a pas franchi le seuil de tap, on ne fait que viser ; au-delà,
         c'est un glissé de caméra et la visée s'efface. */
      if(jeu.capArmee && viseur.actif && pt.bouge < SEUIL_TAP){
        viseur.x = p.x; viseur.y = p.y;
      }else{
        if(viseur.actif) viseur.actif = false;
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

    if(etaitSeul && pt.bouge < SEUIL_TAP){
      appuie(pt.x, pt.y);
    }
    if(ordrePt.length === 1){
      /* on repart de la position du doigt restant : pas de saut */
      var r = pointeurs[ordrePt[0]];
      /* On ré-ancre le PAN sur le doigt restant pour éviter un saut de
         caméra — mais on NE remet PAS son compteur de mouvement à zéro :
         il servirait alors de tap au moment où le joueur relève ce
         doigt, et partirait une Nova (une par vie) ou une navette. */
      glisse = { px:cam.px, py:cam.py, x:r.x, y:r.y };
      pincee = null;
      viseur.actif = false;
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

  installeViewport();

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
/* Annonce discrète en haut à droite, sous la minicarte : arrivées et
   départs du salon. Trois au plus à l'écran, la plus vieille cède sa
   place ; chacune s'efface d'elle-même (animation anVie). */
function annonce(html){
  var z = $("annonces");
  if(!z) return;
  while(z.children.length >= 3) z.removeChild(z.firstChild);
  var d = document.createElement("div");
  d.className = "an";
  d.innerHTML = html;
  z.appendChild(d);
  setTimeout(function(){ if(d.parentNode) d.parentNode.removeChild(d); }, 5200);
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
/* Le HUD ne se reconstruit JAMAIS depuis la simulation : abimeBatiment
   appelait majBarres() une fois par bâtiment détruit, donc une Nova qui
   en démonte dix refaisait dix fois l'innerHTML de la liste des navettes
   dans la même image. On lève un drapeau, la boucle le consomme. */
var barresSales = false;
function demandeMajBarres(){ barresSales = true; }

function majBarres(){
  if(!jeu) return;
  barresSales = false;
  $("energieV").textContent = Math.floor(jeu.energie);
  $("unitesV").textContent = jeu.unites.length;
  var fr = Math.max(0, jeu.qg.pv / jeu.qg.pvMax);
  $("jaugeQGin").style.width = (fr * 100).toFixed(2) + "%";
  /* Tant que le bouclier tient, la jauge de PV est un mensonge : elle
     ne bougera pas d'un pixel quoi qu'on tire. On dit donc à sa place
     ce qu'il faut faire, et combien il reste à faire. */
  var jg = $("jaugeQG");
  if(jeu.bouclier > 0){
    jg.classList.add("protege");
    $("jaugeQGtx").textContent = "PROTÉGÉ — " + jeu.bouclier + " cellule"
      + (jeu.bouclier > 1 ? "s" : "") + " électrique" + (jeu.bouclier > 1 ? "s" : "");
  }else{
    jg.classList.remove("protege");
    $("jaugeQGtx").textContent = nombre(Math.max(0, jeu.qg.pv)) + " / " + nombre(jeu.qg.pvMax);
  }
  $("nomCarte").textContent = CARTES[jeu.index % CARTES.length].nom;
  majListeBarges();
  majMenu();
  majPodium();
}
var signatureBarges = null;
function majListeBarges(){
  var l = $("listeBarges");
  /* signature : reconstruire l'innerHTML et rebrancher les écouteurs
     coûte cher, et rien ne change entre deux débarquements */
  var sig = jeu.bargeSel + "|" + jeu.barges.map(function(b){ return b.type + b.n; }).join(",");
  if(sig === signatureBarges) return;
  signatureBarges = sig;
  var html = "";
  for(var i = 0; i < jeu.barges.length; i++){
    var b = jeu.barges[i];
    html += '<div class="bg1' + (i === jeu.bargeSel ? " sel" : "") + '" data-i="' + i + '">'
          + '<div class="n">' + b.n + '</div>'
          + '<div class="d">' + UNI[b.type].nom + '</div></div>';
  }
  if(!jeu.barges.length) html = '<div class="bg1" style="width:auto;padding:6px 10px">aucune</div>';
  l.innerHTML = html;
  var els = l.querySelectorAll(".bg1[data-i]");
  for(var k = 0; k < els.length; k++){
    els[k].addEventListener("pointerdown", function(e){
      jeu.bargeSel = +this.getAttribute("data-i");
      /* Choisir une navette DÉSARME la capacité en cours. Sans cela les
         deux restaient allumées en même temps, et comme appuie() sert
         d'abord la capacité, le joueur qui voulait débarquer envoyait un
         Cryo sur sa plage. On ne peut vouloir les deux à la fois. */
      if(jeu.capArmee){
        jeu.capArmee = null;
        viseur.actif = false;
        majMenu();
      }
      majListeBarges();
      e.preventDefault();
    });
  }
}

/* --- menu des capacités --- */
var TUILES = [
  { m:"nova",       nom:"Nova" },
  { m:"poulets",    nom:"Poulets ×10" },
  { m:"brouillard", nom:"Brouillard" },
  { m:"salve",      nom:"Salve" },
  { m:"cryo",       nom:"Cryo" },
  { m:"soin",       nom:"Soin" },
  { m:"balise",     nom:"Balise" },
  { m:"viper",      nom:"Viper" }
];
function construitMenu(){
  var h = "";
  for(var i = 0; i < TUILES.length; i++){
    var t = TUILES[i];
    h += '<div class="cap" data-m="' + t.m + '">'
       + '<canvas width="76" height="76" id="ic_' + t.m + '"></canvas>'
       + '<div class="nm">' + t.nom + '</div>'
       + '<div class="cx" id="cx_' + t.m + '">0</div>'
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
    /* la Nova n'a pas de prix : sa pastille compte les charges restantes */
    $("cx_" + m).textContent = (m === "nova") ? jeu.novaDispo : coutActuel(m, jeu.usages);
    els[k].classList.toggle("pauvre", !capaciteDisponible(m));
  }
}

/* ----------------------------------------------------------------
   Icônes du menu — dessinées en volume, jamais un caractère émoji.
   Repère : 76×76, origine au centre.
   ---------------------------------------------------------------- */
function dessineIcone(m, c){
  c.clearRect(0, 0, 76, 76);
  c.save();
  c.translate(38, 38);
  c.lineJoin = "round";

  if(m === "nova"){
    /* mini missile nucléaire : ogive trapue, bandes de danger, trèfle */
    c.save(); c.rotate(-0.32);
    var g = c.createLinearGradient(-11, 0, 11, 0);
    g.addColorStop(0, "#8d8a82"); g.addColorStop(0.4, "#eae4d6"); g.addColorStop(1, "#7d7a72");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(0, -25); c.quadraticCurveTo(12, -9, 11, 14);
    c.lineTo(-11, 14); c.quadraticCurveTo(-12, -9, 0, -25);
    c.closePath(); c.fill();
    c.fillStyle = "#e8c437"; c.fillRect(-11, -6, 22, 8);
    c.fillStyle = "#1c1a18";
    for(var i = -2; i <= 2; i++) c.fillRect(i * 6 - 1.7, -6, 3.4, 8);
    /* trèfle radioactif */
    c.fillStyle = "#1c1a18";
    c.beginPath(); c.arc(0, 6, 2.2, 0, 6.2832); c.fill();
    for(var k = 0; k < 3; k++){
      c.save(); c.rotate(k * 2.0944);
      c.beginPath(); c.moveTo(-3.4, 2.6); c.arc(0, 6, 7, -2.36, -0.78); c.closePath(); c.fill();
      c.restore();
    }
    /* ailerons */
    c.fillStyle = "#c8452f";
    c.beginPath(); c.moveTo(-11, 14); c.lineTo(-18, 24); c.lineTo(-5, 18); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(11, 14); c.lineTo(18, 24); c.lineTo(5, 18); c.closePath(); c.fill();
    c.restore();
    /* petit champignon derrière */
    c.save(); c.globalAlpha = 0.5; c.fillStyle = "#ff8a1e";
    c.beginPath(); c.ellipse(16, -18, 11, 6, 0, 0, 6.2832); c.fill();
    c.fillRect(13, -18, 6, 12);
    c.restore();

  }else if(m === "poulets"){
    /* trois poulets, celui de devant bien lisible */
    function poulet(x, y, e, a){
      c.save(); c.translate(x, y); c.scale(e, e); c.globalAlpha = a;
      c.fillStyle = "#f4eee2";
      c.beginPath(); c.ellipse(0, 0, 11, 9, -0.1, 0, 6.2832); c.fill();
      c.beginPath(); c.ellipse(9, -9, 6, 6, 0, 0, 6.2832); c.fill();
      c.fillStyle = "#e0d6c4";
      c.beginPath(); c.ellipse(-1, 0, 7, 4.5, 0, 0, 6.2832); c.fill();
      c.fillStyle = "#d8352c";
      c.beginPath();
      c.moveTo(6, -14); c.quadraticCurveTo(8, -19, 10, -14.4);
      c.quadraticCurveTo(12, -18.6, 13.6, -13.6);
      c.closePath(); c.fill();
      c.beginPath(); c.ellipse(10, -4.6, 2, 3, 0, 0, 6.2832); c.fill();
      c.fillStyle = "#e8a72c";
      c.beginPath(); c.moveTo(14.4, -9.6); c.lineTo(20, -8); c.lineTo(14.4, -6.4); c.closePath(); c.fill();
      c.fillStyle = "#241c18";
      c.beginPath(); c.arc(11.4, -10.4, 1.5, 0, 6.2832); c.fill();
      c.fillStyle = "#f4eee2";
      c.beginPath();
      c.moveTo(-8, -2); c.quadraticCurveTo(-19, -10, -15, 0);
      c.quadraticCurveTo(-13, -1, -8, 1); c.closePath(); c.fill();
      c.strokeStyle = "#e0a02c"; c.lineWidth = 2; c.lineCap = "round";
      c.beginPath(); c.moveTo(-2, 8); c.lineTo(-4, 15); c.stroke();
      c.beginPath(); c.moveTo(3, 8); c.lineTo(5, 15); c.stroke();
      c.restore();
    }
    poulet(-13, -8, 0.52, 0.6);
    poulet(13, -10, 0.46, 0.5);
    poulet(-2, 8, 0.95, 1);
    c.fillStyle = "#ffd070";
    c.font = "900 15px 'Trebuchet MS', sans-serif";
    c.textAlign = "right"; c.textBaseline = "bottom";
    c.strokeStyle = "rgba(10,6,14,.9)"; c.lineWidth = 4;
    c.strokeText("×10", 34, 34); c.fillText("×10", 34, 34);

  }else if(m === "brouillard"){
    var gb = c.createLinearGradient(0, -22, 0, 20);
    gb.addColorStop(0, "#e6e2ee"); gb.addColorStop(1, "#8e8894");
    c.fillStyle = gb;
    [[0, -6, 17], [-15, 3, 12], [15, 3, 12], [-7, 11, 10], [8, 11, 10]].forEach(function(o){
      c.beginPath(); c.arc(o[0], o[1], o[2], 0, 6.2832); c.fill();
    });
    c.fillStyle = "rgba(120,112,128,.55)";
    c.beginPath(); c.arc(-6, 2, 9, 0, 6.2832); c.fill();
    /* une silhouette qui disparaît dedans */
    c.fillStyle = "rgba(40,32,48,.45)";
    c.beginPath(); c.ellipse(4, 2, 4, 8, 0, 0, 6.2832); c.fill();
    c.beginPath(); c.arc(4, -8, 3.4, 0, 6.2832); c.fill();

  }else if(m === "salve"){
    /* quatre missiles en éventail */
    for(var s = -1.5; s <= 1.5; s++){
      c.save();
      c.translate(s * 11, Math.abs(s) * 5 - 3);
      c.rotate(s * 0.3 - 0.1);
      var gs = c.createLinearGradient(-4, 0, 4, 0);
      gs.addColorStop(0, "#6e7a84"); gs.addColorStop(0.4, "#cfd6dc"); gs.addColorStop(1, "#68727c");
      c.fillStyle = gs;
      c.beginPath();
      c.moveTo(0, -17); c.quadraticCurveTo(4.4, -6, 4, 9);
      c.lineTo(-4, 9); c.quadraticCurveTo(-4.4, -6, 0, -17);
      c.closePath(); c.fill();
      c.fillStyle = "#e8672f"; c.fillRect(-4, -3, 8, 3.4);
      c.fillStyle = "#8a949c";
      c.beginPath(); c.moveTo(-4, 8); c.lineTo(-8, 14); c.lineTo(-1.6, 11); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(4, 8); c.lineTo(8, 14); c.lineTo(1.6, 11); c.closePath(); c.fill();
      c.save();
      c.globalCompositeOperation = "lighter";
      var gj = c.createRadialGradient(0, 14, 0, 0, 14, 9);
      gj.addColorStop(0, "rgba(255,230,160,.9)"); gj.addColorStop(1, "rgba(255,90,20,0)");
      c.fillStyle = gj;
      c.beginPath(); c.ellipse(0, 14, 4.4, 9, 0, 0, 6.2832); c.fill();
      c.restore();
      c.restore();
    }

  }else if(m === "cryo"){
    /* flocon massif + tourelle prise dans la glace */
    c.save();
    c.strokeStyle = "#bfe9ff"; c.lineWidth = 4.4; c.lineCap = "round";
    for(var f2 = 0; f2 < 3; f2++){
      c.save(); c.rotate(f2 * 1.0472);
      c.beginPath(); c.moveTo(0, -22); c.lineTo(0, 22); c.stroke();
      c.beginPath(); c.moveTo(0, -14); c.lineTo(-6, -20); c.stroke();
      c.beginPath(); c.moveTo(0, -14); c.lineTo(6, -20); c.stroke();
      c.beginPath(); c.moveTo(0, 14); c.lineTo(-6, 20); c.stroke();
      c.beginPath(); c.moveTo(0, 14); c.lineTo(6, 20); c.stroke();
      c.restore();
    }
    c.strokeStyle = "#ffffff"; c.lineWidth = 1.8;
    for(var f3 = 0; f3 < 3; f3++){
      c.save(); c.rotate(f3 * 1.0472);
      c.beginPath(); c.moveTo(0, -20); c.lineTo(0, 20); c.stroke();
      c.restore();
    }
    c.restore();
    c.fillStyle = "rgba(150,220,255,.45)";
    c.beginPath(); c.arc(0, 0, 15, 0, 6.2832); c.fill();

  }else if(m === "soin"){
    var gh = c.createLinearGradient(0, -22, 0, 22);
    gh.addColorStop(0, "#9df5b4"); gh.addColorStop(0.5, "#57d97c"); gh.addColorStop(1, "#2f9b52");
    c.fillStyle = gh;
    c.beginPath();
    if(c.roundRect){
      c.roundRect(-7, -22, 14, 44, 4); c.roundRect(-22, -7, 44, 14, 4);
    }else{ c.rect(-7, -22, 14, 44); c.rect(-22, -7, 44, 14); }
    c.fill();
    c.fillStyle = "rgba(255,255,255,.35)";
    c.fillRect(-6, -21, 4.5, 42);
    c.strokeStyle = "rgba(20,60,32,.35)"; c.lineWidth = 2;
    c.beginPath();
    if(c.roundRect){ c.roundRect(-7, -22, 14, 44, 4); c.roundRect(-22, -7, 44, 14, 4); }
    c.stroke();

  }else if(m === "balise"){
    /* fusée éclairante sous son parachute */
    c.save();
    c.globalCompositeOperation = "lighter";
    var gl = c.createRadialGradient(0, 4, 1, 0, 4, 26);
    gl.addColorStop(0, "#fff8d8"); gl.addColorStop(0.4, "#ffca5e"); gl.addColorStop(1, "rgba(255,138,30,0)");
    c.fillStyle = gl;
    c.beginPath(); c.arc(0, 4, 26, 0, 6.2832); c.fill();
    c.restore();
    var gp = c.createLinearGradient(-14, -20, 14, -8);
    gp.addColorStop(0, "#f6efe0"); gp.addColorStop(1, "#c8bda6");
    c.fillStyle = gp;
    c.beginPath(); c.arc(0, -10, 14, Math.PI, 0); c.closePath(); c.fill();
    c.strokeStyle = "#8d8474"; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(-14, -10); c.lineTo(0, 2); c.lineTo(14, -10); c.stroke();
    c.fillStyle = "#ff8a1e";
    c.beginPath(); c.arc(0, 6, 5.4, 0, 6.2832); c.fill();
    c.fillStyle = "#fff3c4";
    c.beginPath(); c.arc(-1.4, 4.6, 2.2, 0, 6.2832); c.fill();

  }else if(m === "viper"){
    /* un seul missile, en piqué, avec sa croix de visée */
    c.save();
    c.strokeStyle = "rgba(255,138,30,.75)"; c.lineWidth = 2;
    c.beginPath(); c.arc(4, 14, 13, 0, 6.2832); c.stroke();
    c.beginPath(); c.moveTo(-13, 14); c.lineTo(-6, 14); c.stroke();
    c.beginPath(); c.moveTo(21, 14); c.lineTo(14, 14); c.stroke();
    c.beginPath(); c.moveTo(4, -3); c.lineTo(4, 4); c.stroke();
    c.restore();
    c.save();
    c.translate(-4, -6); c.rotate(0.72);
    var gv = c.createLinearGradient(-5, 0, 5, 0);
    gv.addColorStop(0, "#68727c"); gv.addColorStop(0.4, "#e2e8ee"); gv.addColorStop(1, "#68727c");
    c.fillStyle = gv;
    c.beginPath();
    c.moveTo(0, -24); c.quadraticCurveTo(5.6, -8, 5, 12);
    c.lineTo(-5, 12); c.quadraticCurveTo(-5.6, -8, 0, -24);
    c.closePath(); c.fill();
    c.fillStyle = "#2f8ea4"; c.fillRect(-5, -6, 10, 4.4);
    c.fillStyle = "#c8452f"; c.fillRect(-5, 2, 10, 3);
    c.fillStyle = "#8a949c";
    c.beginPath(); c.moveTo(-5, 11); c.lineTo(-11, 19); c.lineTo(-2, 15); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(5, 11); c.lineTo(11, 19); c.lineTo(2, 15); c.closePath(); c.fill();
    c.save();
    c.globalCompositeOperation = "lighter";
    var gj3 = c.createRadialGradient(0, 18, 0, 0, 18, 12);
    gj3.addColorStop(0, "rgba(255,240,190,.95)"); gj3.addColorStop(1, "rgba(255,90,20,0)");
    c.fillStyle = gj3;
    c.beginPath(); c.ellipse(0, 18, 6, 12, 0, 0, 6.2832); c.fill();
    c.restore();
    c.restore();
  }
  c.restore();
}

/* --- podium : le classement des dégâts, en haut à gauche ---
   Toujours affiché, même seul : c'est le tableau de bord de la
   partie, pas une décoration qui apparaît quand un ami arrive. */
var podiumHtml = null;
function majPodium(){
  if(!jeu) return;
  /* Le classement se lit dans le REGISTRE, pas dans la liste des
     joueurs entendus : un joueur qui ferme son navigateur garde sa
     place et son score. On marque seulement qu'il n'est plus là. */
  var l = [{ nom:monNom, g:jeu.degatsMoi, moi:1, absent:0 }];
  for(var id in scoresSalon){
    var e = scoresSalon[id];
    if(e.nom === "?" && !e.g) continue;          // jamais rien dit, jamais rien fait
    l.push({ nom:e.nom, g:e.g, moi:0, absent:autresJoueurs[id] ? 0 : 1 });
  }
  l.sort(function(a, b){ return b.g - a.g; });
  var med = ["🥇", "🥈", "🥉"];
  var h = "";
  for(var i = 0; i < Math.min(3, l.length); i++){
    h += '<div class="r' + (l[i].moi ? " moi" : "") + (l[i].absent ? " parti" : "")
       + '"><span>' + med[i] + '</span>'
       + '<span class="n">' + echappe(l[i].nom) + (l[i].absent ? " ⏻" : "") + '</span>'
       + '<span class="v">' + nombre(l[i].g) + '</span></div>';
  }
  /* le sort de Gégé s'affiche sous le classement, tant qu'on est sur
     l'île où le drame a eu lieu */
  if(jeu.tueurGege){
    h += '<div class="gg">🦡 <b>' + echappe(jeu.tueurGege)
       + '</b> a tué Gégé la belette</div>';
  }
  if(jeu.tueurTweety){
    h += '<div class="gg">🐤 <b>' + echappe(jeu.tueurTweety)
       + '</b> a tué Tweety</div>';
  }
  /* Qui est réellement entendu, là, maintenant. C'est la réponse à
     « pourquoi je ne vois que mon nom ? » : si le relais est tombé ou
     que l'autre appareil est sur un autre relais, ça se LIT ici au
     lieu de se deviner. */
  if(!reseau.connecte){
    h += '<div class="gg">🔌 hors ligne — relais injoignable</div>';
  }else{
    /* le COMPTE, pas les noms : à dix joueurs la liste mangerait
       l'écran, et les noms sont déjà au classement */
    var nAutres = 0, idj;
    for(idj in autresJoueurs) nAutres++;
    h += '<div class="gg">🌐 ' + (nAutres
       ? (nAutres + 1) + " joueurs en ligne"
       : "seul dans le salon pour l'instant") + '</div>';
  }
  if(h !== podiumHtml){ podiumHtml = h; $("podiumL").innerHTML = h; }
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
      /* toutes les îles sont tombées : nouvelle campagne, monde neuf */
      carteSalon = 0; suiv = 0;
      cycleSalon++;
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
  for(var i = 0; i < EQ.NB_BARGES; i++)
    compoBarges.push({ type:"meuf", n:placesNavette("meuf") });
  var sauv = null;
  try{ sauv = JSON.parse(localStorage.getItem("milyboum") || "null"); }catch(e){}
  if(sauv){
    if(sauv.nom) $("pseudo").value = sauv.nom;
    if(sauv.compo && sauv.compo.length === EQ.NB_BARGES && sauv.compo[0] && sauv.compo[0].type){
      compoBarges = sauv.compo;
      /* une composition d'avant le plafond par type peut dépasser */
      for(var q = 0; q < compoBarges.length; q++){
        if(!UNI[compoBarges[q].type]) compoBarges[q].type = TYPES_TROUPE[0];
        compoBarges[q].n = Math.max(0, Math.min(placesNavette(compoBarges[q].type),
                                                compoBarges[q].n | 0));
      }
    }
    if(sauv.relais) $("relais").value = sauv.relais;
  }
  /* Aucun pseudo inventé : le champ reste vide avec son intitulé, et
     rien ne part tant que le joueur ne s'est pas nommé. Un « Recrue267 »
     posé d'office donnait un salon peuplé d'inconnus interchangeables. */
  /* une seule source de vérité pour la version : la constante du noyau */
  $("versionJeu").textContent = VERSION;
  $("versionBrief").textContent = VERSION;

  dessineLogo();
  majBargesBrief();
  majMondes();

  $("lancer").addEventListener("click", lancePartie);
  $("pseudo").addEventListener("input", majEtatPseudo);
  majEtatPseudo();
  $("btReco").addEventListener("click", function(){
    if(!pseudoSaisi()) return signalePseudoManquant();
    monNom = pseudoSaisi();
    connecteRelais($("relais").value);
  });
  $("relais").addEventListener("change", function(){
    sauvegarde();
    connecteRelais($("relais").value);
  });
  $("pseudo").addEventListener("change", function(){
    if(pseudoSaisi()){
      monNom = pseudoSaisi();
      this.value = monNom;
      sauvegarde();
    }
  });
  $("btSon").addEventListener("click", function(){
    son.actif = !son.actif;
    this.textContent = son.actif ? "🔊 Son activé" : "🔇 Son coupé";
  });
  $("btPlein").addEventListener("click", basculePlein);
}
/* Le pseudo, une seule définition pour tout le fichier : trimé, borné
   à quatorze caractères, et vide s'il ne reste rien. */
function pseudoSaisi(){
  var v = ($("pseudo").value || "").trim().substr(0, 14);
  return v;
}
function majEtatPseudo(){
  var ok = !!pseudoSaisi();
  $("lancer").disabled = !ok;
  $("pseudo").classList.toggle("manque", !ok);
  /* Un bouton grisé sans explication est une impasse : le message dit
     pourquoi, tant que le champ est vide. */
  $("avertPseudo").classList.toggle("on", !ok);
}
function signalePseudoManquant(){
  $("avertPseudo").classList.add("on");
  $("pseudo").classList.add("manque");
  $("pseudo").focus();
}

function sauvegarde(){
  try{
    localStorage.setItem("milyboum", JSON.stringify({
      nom:pseudoSaisi(), compo:compoBarges, relais:$("relais").value
    }));
  }catch(e){}
}
function majBargesBrief(){
  var h = "";
  for(var i = 0; i < EQ.NB_BARGES; i++){
    var b = compoBarges[i];
    h += '<div class="barge"><div class="tt"><span>Navette ' + (i + 1) + '</span>'
       + '<span>' + b.n + '/' + placesNavette(b.type) + '</span></div>'
       + '<div class="choixT">';
    for(var t = 0; t < TYPES_TROUPE.length; t++){
      var cle = TYPES_TROUPE[t];
      h += '<div class="pt' + (b.type === cle ? " on" : "") + '" data-i="' + i + '" data-t="' + cle + '">'
         + '<canvas width="150" height="126" id="pt_' + i + '_' + cle + '"></canvas>'
         + '<div class="nm">' + UNI[cle].nom + '<span class="role">' + UNI[cle].role + '</span></div>'
         + '</div>';
    }
    h += '</div>' + rangeeNavette(i, b) + '</div>';
  }
  $("barges").innerHTML = h;

  /* portraits décalqués */
  for(var k = 0; k < EQ.NB_BARGES; k++){
    for(var q = 0; q < TYPES_TROUPE.length; q++){
      var el = $("pt_" + k + "_" + TYPES_TROUPE[q]);
      if(!el) continue;
      var c = el.getContext("2d");
      var g = c.createLinearGradient(0, 0, 0, 126);
      g.addColorStop(0, "#3a2450"); g.addColorStop(1, "#170e21");
      c.fillStyle = g; c.fillRect(0, 0, 150, 126);
      dessinePortrait(c, TYPES_TROUPE[q], 0, -6, 150);
    }
  }
  /* choix du type : une navette n'embarque qu'un seul type de troupe */
  var pts = $("barges").querySelectorAll(".pt");
  for(var m = 0; m < pts.length; m++){
    pts[m].addEventListener("click", function(){
      var i2 = +this.getAttribute("data-i");
      compoBarges[i2].type = this.getAttribute("data-t");
      /* changer de type reborne l'effectif : douze Meufs, quinze Mecs */
      var maxi = placesNavette(compoBarges[i2].type);
      compoBarges[i2].n = compoBarges[i2].n === 0 ? maxi : Math.min(maxi, compoBarges[i2].n);
      majBargesBrief(); sauvegarde();
    });
  }
  var minis = $("barges").querySelectorAll(".mini");
  for(var n = 0; n < minis.length; n++){
    minis[n].addEventListener("click", function(){
      var i3 = +this.getAttribute("data-i"), d = +this.getAttribute("data-d");
      var bb = compoBarges[i3];
      bb.n = Math.max(0, Math.min(placesNavette(bb.type), bb.n + d));
      majBargesBrief(); sauvegarde();
    });
  }
  /* total */
  var tot = 0, cpt = {};
  compoBarges.forEach(function(bb){ tot += bb.n; cpt[bb.type] = (cpt[bb.type] || 0) + bb.n; });
  var det = TYPES_TROUPE.map(function(t2){ return (cpt[t2] || 0) + " " + UNI[t2].nom + "s"; }).join(", ");
  $("totalTroupes").innerHTML = "Flotte : <b>" + tot + "</b> unités — " + det;
}
function rangeeNavette(i, b){
  return '<div class="rangee"><span class="lab">'
       + '<span class="pion ' + (b.type === "meuf" ? "f" : "m") + '"></span>'
       + UNI[b.type].nom + 's</span>'
       + '<button class="mini" data-i="' + i + '" data-d="-1">−</button>'
       + '<span class="compt">' + b.n + '</span>'
       + '<button class="mini" data-i="' + i + '" data-d="1">+</button></div>';
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
  /* Une île dont le biome n'a pas sa palette ne doit PAS emporter tout le
     démarrage : construitBriefing() se lance avant la boucle de rendu, si
     bien qu'un BIOMES[...] indéfini laissait un écran noir et une tablette
     qui ne répondait plus à la rotation. La vignette se rabat sur la
     plage, le jeu vit. */
  var b = BIOMES[CARTES[i].biome] || BIOMES.plage;
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
    /* La vignette doit se reconnaître à la silhouette autant qu'à la
       palette : en 360×148, c'est la forme du décor qui dit l'île. */
    if(CARTES[i].biome === "plage") palmier(c, 0, 0, 1);
    else if(CARTES[i].biome === "foret") sapin(c, 0, 0, 1);
    else if(CARTES[i].biome === "hippie") (k % 3 === 0 ? guirlande : tipi)(c, 0, 0, 1);
    else if(CARTES[i].biome === "sud") (k % 3 === 0 ? olivier : cypres)(c, 0, 0, 1);
    else meule(c, 0, 0, 1);
    c.restore();
  }
  /* le Brasier, en silhouette */
  c.save(); c.translate(w * 0.24, h * 0.80); c.scale(0.19, 0.19);
  if(spriteQGArriere) c.drawImage(spriteQGArriere, -QG_OX, -QG_OY, QG_W, QG_H);
  if(spriteQGAvant)   c.drawImage(spriteQGAvant,   -QG_OX, -QG_OY, QG_W, QG_H);
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
  if(!pseudoSaisi()) return signalePseudoManquant();
  monNom = pseudoSaisi();
  $("pseudo").value = monNom;          // le champ montre ce qui sera diffusé
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
/* Le bouton n'existe que dans le briefing : impossible de l'effleurer
   en pleine partie. Double garde-fou — un mot de passe, puis une
   confirmation qui annonce ce que ça détruit. */
function installeRaz(){
  var b = $("btRaz");
  if(!b) return;
  b.addEventListener("click", function(){
    var mot = prompt("Mot de passe pour réinitialiser le salon :");
    if(mot === null) return;
    if(mot.trim().toLowerCase() !== MOT_RAZ){
      alert("Mot de passe incorrect. Rien n'a été touché.");
      return;
    }
    if(!confirm("Remettre l'île à neuf POUR TOUT LE SALON ?\n\n"
              + "• toutes les défenses détruites reviennent\n"
              + "• le Brasier retrouve toute sa vie\n"
              + "• Gégé la belette est de nouveau vivante\n\n"
              + "Les autres joueurs verront le changement immédiatement.")) return;
    remetSalonAZero();
    if(enJeu){ nouvelleCarte(0); construitFondMini(); majBarres(); }
    majMondes();
    alert("Salon réinitialisé. L'île est repartie à neuf.");
  });
}

function installeBoutons(){
  $("btZp").addEventListener("click", function(){ zoomVers(W / 2, H / 2, 1.25); });
  $("btZm").addEventListener("click", function(){ zoomVers(W / 2, H / 2, 1 / 1.25); });
  $("btCentre").addEventListener("click", function(){ centreSur(jeu.qg.gx, jeu.qg.gy); borneCamera(); });
  $("btPlein2").addEventListener("click", basculePlein);
}
