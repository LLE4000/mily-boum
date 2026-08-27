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
/* LA RÉSOLUTION ADAPTATIVE. Sur une carte très chargée, le poste de
   dépense d'une tablette n'est pas le JavaScript : c'est le nombre de
   pixels à remplir. Quand les images se mettent à durer, on abaisse
   la définition du canevas d'un quart de cran — un écran deux fois
   moins défini se remplit quatre fois plus vite, et en plein
   mouvement l'œil ne fait pas la différence. Dès que ça respire à
   nouveau, on remonte. L'interface HTML, elle, reste toujours à la
   définition native : seul le champ de bataille s'adapte. */
var dprPlafond = 4;                  // abaissé par le gouverneur de la boucle
function ajuste(){
  dpr = Math.min(2, dprPlafond, window.devicePixelRatio || 1);
  var r = cv.getBoundingClientRect();
  if(r.width > 40 && r.height > 40){ W = Math.round(r.width); H = Math.round(r.height); }
  cv.width = Math.round(W * dpr);
  cv.height = Math.round(H * dpr);
  if(ctx){ ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = true; }
}

/* ---------------------------------------------------------------
   Caméra bornée : la carte reste toujours partiellement visible
   --------------------------------------------------------------- */
/* Le plancher du zoom de CET écran. Il change avec la taille du
   canevas — rotation de tablette, plein écran, barre du navigateur qui
   se replie — donc il se recalcule, il ne se retient pas. */
function zMinEcran(){ return zoomPlancher(W, H); }

function borneCamera(){
  cam.z = borne(cam.z, zMinEcran(), ZMAX);
  var B = boiteMonde();
  var x0 = B.x0, x1 = B.x1, y0 = B.y0, y1 = B.y1;
  var mx = W * 0.42, my = H * 0.42;
  cam.px = borne(cam.px, mx - x1 * cam.z, W - mx - x0 * cam.z);
  cam.py = borne(cam.py, my - y1 * cam.z, H - my - y0 * cam.z);
}
function zoomVers(sx, sy, facteur){
  var av = cam.z;
  cam.z = borne(cam.z * facteur, zMinEcran(), ZMAX);
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
    /* Le plancher a changé en même temps que l'écran : on le rectifie
       AVANT de cadrer, jamais après. */
    cam.z = borne(cam.z, zMinEcran(), ZMAX);
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
      appliquePince(cam, pincee, a.x, a.y, b.x, b.y, zMinEcran(), ZMAX);
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
    /* La navette d'Ogre se repère AVANT d'appuyer : un seul passager,
       mais c'est celui qui vaut les douze autres. */
    var seul = placesNavette(b.type) === 1;
    html += '<div class="bg1' + (i === jeu.bargeSel ? " sel" : "") + (seul ? " ogre" : "")
          + (b.n ? "" : " vide") + '" data-i="' + i + '"'
          + ' title="' + echappe(nommeTroupes(b.type, b.n)) + '">'
          + '<canvas width="92" height="104" id="bgp_' + i + '"></canvas>'
          + '<div class="n">' + b.n + '</div></div>';
  }
  if(!jeu.barges.length) html = '<div class="bg1" style="width:auto;height:auto;padding:6px 10px;line-height:1.2">aucune</div>';
  l.innerHTML = html;
  /* Les portraits sont peints APRÈS l'innerHTML — les canevas n'existent
     pas avant. Ils viennent de dessinePortrait, exactement le même que
     l'accueil, qui résout « portraitXxx » à la demande : une troupe
     ajoutée demain apparaîtra ici sans qu'on touche à cette fonction. */
  for(var q = 0; q < jeu.barges.length; q++){
    var el = $("bgp_" + q);
    if(!el) continue;
    var c = el.getContext("2d");
    var g = c.createLinearGradient(0, 0, 0, 104);
    g.addColorStop(0, "#3a2450"); g.addColorStop(1, "#170e21");
    c.fillStyle = g; c.fillRect(0, 0, 92, 104);
    /* Le portrait est peint PLUS LARGE que la tuile et déborde par les
       côtés : à 46 px de large, un visage cadré au propre devient un
       point. Ce qu'on veut lire ici, c'est le visage, pas le buste. */
    dessinePortrait(c, jeu.barges[q].type, 0, 2, 116);
  }
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
/* ---------------------------------------------------------------
   LE CLASSEMENT DU SALON — une seule source de vérité
   Il se construit PAR PSEUDO à partir de trois sources qui se
   complètent : nos propres dégâts, le registre de ce que CETTE session
   a entendu, et le tableau publié dans l'instantané retenu du salon.
   C'est ce dernier qui fait qu'un joueur parti — ou parti avant même
   qu'on arrive — garde sa place : son score appartient au monde, pas à
   la mémoire de celui qui l'a vu jouer. Il a fallu ça parce qu'un
   joueur à trois millions de dégâts disparaissait du tableau à la
   seconde où il fermait son navigateur.
   Le podium en jeu, le bilan de fin d'île et le sacre du vainqueur
   lisent tous les trois ICI : sinon ils se contrediraient.
   --------------------------------------------------------------- */
function classementSalon(){
  /* LA SOURCE DE VÉRITÉ est le tableau partagé, mes propres seaux
     rafraîchis au passage : c'est ce que scoresAJour() fabrique. Le
     total d'un joueur y est la SOMME de ses seaux, plus le maximum
     d'aucun d'eux — c'est toute la correction. */
  var par = totalParJoueur(typeof scoresAJour === "function"
                           ? scoresAJour() : decodeScores(monde && monde.s));
  /* Les messages d'état arrivent quatre fois plus souvent que
     l'instantané : ils servent à ANIMER le classement entre deux
     publications, jamais à le contredire. Leur nombre est un total,
     qui ne fait que monter. */
  var id;
  for(id in scoresSalon){
    var e = scoresSalon[id];
    if(!e.nom || e.nom === "?") continue;
    if(e.g > (par[e.nom] || 0)) par[e.nom] = e.g;
  }
  /* qui est encore là, pour la petite prise ⏻ */
  var present = {};
  if(monNom) present[monNom] = 1;
  for(id in autresJoueurs){
    var j = autresJoueurs[id];
    if(j && j.nom && j.nom !== "?") present[j.nom] = 1;
    if(scoresSalon[id] && scoresSalon[id].nom) present[scoresSalon[id].nom] = 1;
  }
  var l = classementDepuis(par);
  for(var i = 0; i < l.length; i++){
    l[i].moi = (l[i].nom === monNom) ? 1 : 0;
    l[i].absent = present[l[i].nom] ? 0 : 1;
  }
  return l;
}

function majPodium(){
  if(!jeu) return;
  /* Le classement se lit dans le REGISTRE, pas dans la liste des
     joueurs entendus : un joueur qui ferme son navigateur garde sa
     place et son score. On marque seulement qu'il n'est plus là. */
  var l = classementSalon();
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
  /* et les trois chats de Mily, chacun avec son coupable */
  for(var ec = 0; ec < ESPECES_PROTEGEES.length; ec++){
    var esc = ESPECES_PROTEGEES[ec];
    if(!jeu.tueurChats[esc]) continue;
    h += '<div class="gg">🐈 <b>' + echappe(jeu.tueurChats[esc])
       + '</b> a tué ' + CRE[esc].nom + '</div>';
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
  /* Même source que le podium en jeu : un joueur déconnecté garde sa
     place au bilan, avec la marque ⏻ pour dire qu'il n'est plus là. */
  var l = classementSalon();
  var med = ["🥇", "🥈", "🥉"];
  var h = "";
  for(var i = 0; i < l.length; i++){
    h += '<div class="r' + (l[i].moi ? " moi" : "") + (l[i].absent ? " parti" : "") + '">'
       + '<span>' + (med[i] || (i + 1) + ".") + '</span>'
       + '<span class="n">' + echappe(l[i].nom) + (l[i].absent ? " ⏻" : "") + '</span>'
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
    /* LA JUNGLE NE MÈNE À AUCUNE ÎLE SUIVANTE. C'est une expédition :
       elle se termine, le salon la referme pour 48 heures, et tout le
       monde revient au campement. La campagne, elle, n'a pas bougé
       d'un cran pendant ce temps. */
    /* EN PRÉVISUALISATION, la victoire n'est pas une victoire : ni
       champion, ni chrono de 48 h entamé, ni île suivante. On sort du
       test, c'est tout. */
    if(modeApercu){ quitteApercuAdmin(); return; }
    if(jeu.index === IDX_JUNGLE){
      termineExpedition(championDeLaPartie().nom);
      quitteVersBriefing();
      return;
    }
    /* Le champion de l'île qui vient de tomber, gravé dans
       l'instantané partagé : il restera affiché sur sa vignette
       jusqu'à la prochaine fois que cette même île sera détruite. */
    sacreChampion(jeu.index, championDeLaPartie().nom);
    var suiv = Math.max(carteSalon, jeu.index + 1);
    carteSalon = suiv;
    /* NB_CARTES_NORMALES, jamais CARTES.length : la carte événement
       vit dans le même tableau mais hors de l'enchaînement, et la
       campagne doit boucler sur cinq îles comme avant. */
    if(suiv >= NB_CARTES_NORMALES){
      /* toutes les îles sont tombées : nouvelle campagne, monde neuf */
      carteSalon = 0; suiv = 0;
      cycleSalon++;
    }
    nouvelleCarte(suiv);
    construitFondMini();
    majBarres();
    majMondes();
    message("Nouvelle île : " + CARTES[suiv].nom);
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
        /* Les anciennes sauvegardes portaient des effectifs réglés à la
           main : on les remet au complet, la seule valeur qui existe. */
        compoBarges[q].n = placesNavette(compoBarges[q].type);
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
    /* « 12 Meufs », « 15 Mecs », « 1 Ogre » : l'effectif est FIXE, une
       navette part toujours pleine. Plus de « n/max » : il n'y a plus
       de n à régler. */
    h += '<div class="barge"><div class="tt"><span>Navette ' + (i + 1) + '</span>'
       + '<span>' + nommeTroupes(b.type, b.n) + '</span></div>'
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
      /* L'effectif suit le type, TOUJOURS au complet : douze Meufs,
         quinze Mecs, un Ogre. L'ancien « min(max, n) » gardait le 1 de
         l'Ogre quand on revenait aux Meufs — une navette qui partait
         avec une seule passagère. On n'en choisit pas le nombre. */
      compoBarges[i2].n = placesNavette(compoBarges[i2].type);
      majBargesBrief(); sauvegarde();
    });
  }
  /* total */
  var tot = 0, cpt = {};
  compoBarges.forEach(function(bb){ tot += bb.n; cpt[bb.type] = (cpt[bb.type] || 0) + bb.n; });
  var det = TYPES_TROUPE.map(function(t2){ return nommeTroupes(t2, cpt[t2] || 0); }).join(", ");
  $("totalTroupes").innerHTML = "Flotte : <b>" + tot + "</b> unités — " + det;
}
/* Pastille de couleur par type de troupe. */
var PION_TROUPE = { meuf:"f", mec:"m", ogre:"o" };
/* « 1 Ogre », « 12 Meufs » : le pluriel suit l'effectif, pas le type.
   « 1 Ogres » sur la seule navette qui n'en embarque qu'un aurait été
   la plus visible des fautes. */
function nommeTroupes(type, n){
  return n + " " + UNI[type].nom + (n > 1 ? "s" : "");
}
function rangeeNavette(i, b){
  var maxi = placesNavette(b.type);
  var lab = '<span class="lab"><span class="pion ' + (PION_TROUPE[b.type] || "m")
          + '"></span>' + UNI[b.type].nom + (maxi > 1 ? "s" : "") + '</span>';
  /* Plus de boutons +/− du tout : une navette part TOUJOURS au complet.
     Douze Meufs, quinze Mecs, un Ogre — on choisit le type, jamais le
     nombre. Des boutons qui prétendraient le contraire mentiraient. */
  return '<div class="rangee">' + lab
       + '<span class="unSeul">' + maxi + ' par navette</span></div>';
}

/* ---------------------------------------------------------------
   LE CHAMPION D'UNE CARTE
   « Détruite par Johan. Johan est le champion de cette carte. Mily lui
   offre un verre. » Le nom vient de l'instantané PARTAGÉ, donc il est
   le même pour tout le monde et il survit à toutes les déconnexions.
   --------------------------------------------------------------- */
function blocChampion(i){
  var nom = championDeCarte(i);
  if(!nom) return "";
  var quoi = i === IDX_JUNGLE ? "de la jungle" : "de cette carte";
  return '<div class="champ">Détruite par <b>' + echappe(nom) + '</b>'
       + '<i>' + echappe(nom) + ' est le champion ' + quoi
       + '. Mily lui offre un verre.</i></div>';
}

/* Combien de joueurs le salon entend en ce moment, moi compris. */
function joueursEnLigne(){
  var n = 1, id;
  for(id in autresJoueurs) n++;
  return n;
}

/* Le compte à rebours du verrou, en clair. On descend jusqu'aux
   secondes une fois sous l'heure : au-dessus, personne ne regarde les
   secondes, et les faire défiler donnerait une fausse urgence. */
function texteAttente(ms){
  var s = Math.ceil(ms / 1000);
  var j = (s / 86400) | 0, hh = ((s % 86400) / 3600) | 0;
  var mm = ((s % 3600) / 60) | 0, ss = s % 60;
  if(j > 0) return j + " j " + hh + " h " + mm + " min";
  if(hh > 0) return hh + " h " + mm + " min " + ss + " s";
  if(mm > 0) return mm + " min " + ss + " s";
  return ss + " s";
}

/* L'état de la carte événement, tel que le cahier des charges le
   décrit : cooldown / attente / prête / expédition en cours. Un seul
   endroit décide, et l'affichage n'en est que la lecture. */
function etatJungle(){
  if(jungleEnCours(monde)) return "encours";
  var a = attenteJungle();
  if(a > 0) return "cooldown";
  return joueursEnLigne() >= minJoueursJungle() ? "prete" : "attente";
}

function majMondes(){
  var h = "";
  for(var i = 0; i < CARTES.length; i++){
    if(carteSpeciale(i)){ h += vignetteEvenement(i); continue; }
    var etat = i < carteSalon ? "tombée" : (i === carteSalon ? "en cours" : "verrouillée");
    var cl = i < carteSalon ? "faite" : (i === carteSalon ? "actif" : "verrou");
    h += '<div class="monde ' + cl + '" data-carte="' + i + '">'
       + '<canvas width="360" height="148" id="mn' + i + '"></canvas>'
       + '<div class="etat">' + etat + '</div>'
       + '<div class="nom">' + CARTES[i].nom + '<br><span style="font-size:11px;color:#a99cb4">QG '
       + nombre(CARTES[i].pvQG) + ' PV</span></div>'
       + blocChampion(i) + '</div>';
  }
  $("mondes").innerHTML = h;
  for(var k = 0; k < CARTES.length; k++) dessineApercu(k);
  installeBoutonJungle();
  installeAppuisCartes();
}

/* Arme l'appui long du créateur sur toute vignette qui n'est pas
   librement jouable — les îles verrouillées, et la jungle dans
   n'importe lequel de ses états. Une carte ouverte garde son
   comportement d'origine, intact. */
function installeAppuisCartes(){
  var els = $("mondes").querySelectorAll("[data-carte]");
  for(var k = 0; k < els.length; k++){
    var i = +els[k].getAttribute("data-carte");
    if(!carteSpeciale(i) && i <= carteSalon) continue;   // carte ouverte : rien à cacher
    armeAppuiLong(els[k], i);
    if(!carteSpeciale(i)){
      (function(idx){
        els[k].addEventListener("click", function(){ clicCarteVerrouillee(idx); });
      })(i);
    }
  }
  /* La vignette événement porte son propre bouton, donc l'appui long
     s'arme sur son cadre — mais le bouton, lui, ne doit pas déclencher
     l'anneau quand on appuie dessus pour entrer. */
  var evt = $("mondeEvt");
  if(evt) armeAppuiLong(evt, IDX_JUNGLE);
}

/* La vignette de la carte événement. Elle porte quatre informations
   sans devenir un tableau de bord : ce qu'elle est, combien on est,
   ce qui manque, et qui l'a détruite la dernière fois. */
function vignetteEvenement(i){
  var e = etatJungle();
  var n = joueursEnLigne(), mini = minJoueursJungle();
  var msg, etiq;
  if(e === "encours"){
    etiq = "expédition en cours";
    msg = "Une expédition est partie. Rejoins-la !";
  }else if(e === "cooldown"){
    etiq = "verrouillée";
    msg = "Disponible dans <b>" + texteAttente(attenteJungle()) + "</b>";
  }else if(e === "prete"){
    etiq = "prête";
    msg = "<b>LA JUNGLE EST PRÊTE.</b> Il ne manque plus qu'à entrer.";
  }else{
    etiq = "en attente";
    var manque = mini - n;
    msg = "En attente de <b>" + manque + "</b> joueur" + (manque > 1 ? "s" : "") + ".";
  }
  var frac = Math.min(1, n / Math.max(1, mini));
  var bouton = e === "prete" ? "ENTRER DANS LA JUNGLE"
             : e === "encours" ? "REJOINDRE L'EXPÉDITION"
             : e === "cooldown" ? "LA JUNGLE SE REPOSE"
             : "EN ATTENTE DE JOUEURS";
  var actif = (e === "prete" || e === "encours");
  return '<div class="monde evt ' + e + '" id="mondeEvt">'
       + '<canvas width="720" height="300" id="mn' + i + '"></canvas>'
       + '<div class="bandeau">🌿 Carte spéciale</div>'
       + '<div class="etat">' + etiq + '</div>'
       + '<div class="nom">' + CARTES[i].nom
       + '<br><span style="font-size:11px;color:#a99cb4">QG '
       + nombre(CARTES[i].pvQG) + ' PV — événement multijoueur</span></div>'
       /* Le joueur doit savoir CE QUI L'ATTEND avant d'appuyer, et le
          savoir en une seconde. Deux pastilles, deux chiffres, pas une
          phrase : ce sont les seuls réglages qui rendent cette carte
          plus dure que les cinq autres. */
       + '<div class="durci">'
       +   '<span class="dz pv">Défenses +' + bonusPvJungle + '% PV</span>'
       +   '<span class="dz dg">+' + EQ.JUNGLE_DEG_BONUS + '% dégâts</span>'
       +   '<span class="dz or">⛈ Orage &amp; foudre</span>'
       + '</div>'
       + '<div class="jauge">'
       +   '<span class="cpt">' + n + '<small>/' + mini + '</small></span>'
       +   '<span class="msg">' + msg + '</span>'
       +   '<span class="barreJ"><i style="width:' + (frac * 100).toFixed(0) + '%"></i></span>'
       + '</div>'
       + '<button id="btJungle"' + (actif ? "" : " disabled") + '>' + bouton + '</button>'
       + blocChampion(i) + '</div>';
}

/* Le menu ne se reconstruit pas à chaque image — mais le compte à
   rebours doit vraiment descendre, et le nombre de joueurs vraiment
   suivre les arrivées. On rafraîchit donc la seule vignette
   événement, une fois par seconde, tant que le briefing est ouvert. */
var evtT = 0, evtEtat = "";
function majJungleLent(dt){
  if(enJeu || !$("mondeEvt")) return;
  evtT -= dt;
  if(evtT > 0) return;
  evtT = 1.0;
  var e = etatJungle();
  /* Un changement d'état retouche les classes et le bouton : on
     reconstruit alors la vignette. Sinon on ne réécrit que les deux
     nombres qui bougent, pour ne pas casser une animation en cours. */
  if(e !== evtEtat){ evtEtat = e; majMondes(); return; }
  var el = $("mondeEvt");
  var cpt = el.querySelector(".cpt"), msg = el.querySelector(".msg");
  var n = joueursEnLigne(), mini = minJoueursJungle();
  if(cpt) cpt.innerHTML = n + '<small>/' + mini + '</small>';
  if(msg && e === "cooldown") msg.innerHTML = "Disponible dans <b>" + texteAttente(attenteJungle()) + "</b>";
  if(msg && e === "attente"){
    var manque = mini - n;
    msg.innerHTML = "En attente de <b>" + manque + "</b> joueur" + (manque > 1 ? "s" : "") + ".";
  }
  var barre = el.querySelector(".barreJ i");
  if(barre) barre.style.width = (Math.min(1, n / Math.max(1, mini)) * 100).toFixed(0) + "%";
}

function installeBoutonJungle(){
  var b = $("btJungle");
  if(!b) return;
  b.addEventListener("click", function(){
    if(!pseudoSaisi()) return signalePseudoManquant();
    var e = etatJungle();
    if(e !== "prete" && e !== "encours") return;
    monNom = pseudoSaisi();
    if(e === "prete") lanceExpedition();
    entreDansLaJungle();
  });
}
function dessineApercu(i){
  var el = $("mn" + i);
  if(!el) return;
  var c = el.getContext("2d");
  /* LA CARTE ÉVÉNEMENT A SON PROPRE TABLEAU. Il est peint en direct,
     à chaque rafraîchissement du menu, et son ambiance suit l'état
     de l'expédition — c'est la première chose que le joueur voit de
     la jungle. Tant que le sculpteur n'a pas livré, on retombe sur
     l'aperçu ordinaire plutôt que sur un carré vide. */
  if(carteSpeciale(i) && typeof dessineVignetteJungle === "function"){
    dessineVignetteJungle(c, el.width, el.height, tempsGlobal, etatJungle());
    return;
  }
  /* Une île dont le biome n'a pas sa palette ne doit PAS emporter tout le
     démarrage : construitBriefing() se lance avant la boucle de rendu, si
     bien qu'un BIOMES[...] indéfini laissait un écran noir et une tablette
     qui ne répondait plus à la rotation. La vignette se rabat sur la
     plage, le jeu vit. */
  var b = BIOMES[CARTES[i].biome] || BIOMES.plage;
  /* La taille vient du CANEVAS, pas d'une constante : la vignette
     événement est deux fois plus grande que les cinq autres, et un
     360×148 écrit en dur ne peignait qu'un quart de sa surface. */
  var w = el.width, h = el.height;
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
/* `ou` est l'index de carte à jouer : la campagne du salon par défaut,
   la jungle quand on entre en expédition. */
function lancePartie(ou){
  if(!pseudoSaisi()) return signalePseudoManquant();
  monNom = pseudoSaisi();
  $("pseudo").value = monNom;          // le champ montre ce qui sera diffusé
  sauvegarde();
  son.reveille();
  $("brief").style.display = "none";
  $("hud").classList.add("on");
  enJeu = true;
  /* Chaque partie repart à la définition native : le plafond abaissé
     par une partie qui ramait ne doit pas condamner la suivante —
     autre carte, autre poids. Si celle-ci rame aussi, le gouverneur
     redescendra tout seul en quelques secondes. */
  dprPlafond = 4;
  lissageImg = 16; gouvLent = 0; gouvVite = 0;
  ajuste();
  var idx = (typeof ou === "number") ? ou : carteSalon;
  nouvelleCarte(idx);
  construitFondMini();
  construitMenu();
  majBarres();
  majPodium();
  message(idx === IDX_JUNGLE
    ? "L'orage gronde. Choisis une navette et débarque."
    : "Choisis une barge en bas à gauche, puis appuie sur la plage.");
  if(reseau.connecte) envoie({ t:"bonjour", nom:monNom });
}

/* Boutons du HUD */
/* Le bouton n'existe que dans le briefing : impossible de l'effleurer
   en pleine partie. Double garde-fou — un mot de passe, puis une
   confirmation qui annonce ce que ça détruit. */
/* ================================================================
   L'APPUI LONG DU CRÉATEUR

   Cinq secondes de doigt posé sur une vignette verrouillée, puis le
   mot de passe, et la carte s'ouvre en prévisualisation. Aucun bouton
   n'est ajouté à l'écran : un joueur ordinaire ne peut pas tomber
   dessus par hasard, et un appui long involontaire dure rarement cinq
   secondes.

   Le geste marche au doigt comme à la souris parce qu'il passe par
   les événements POINTEUR, qui unifient les deux. Trois précautions
   pour la tablette :
     — touch-action:none sur la vignette, sinon le navigateur prend le
       doigt pour un défilement et annule le pointeur au bout de
       quelques pixels ;
     — contextmenu annulé, sinon Android ouvre son menu « copier » au
       bout d'une demi-seconde et vole le geste ;
     — pointercancel traité comme un relâchement, pour que l'anneau ne
       reste pas figé si le système reprend la main.
   ================================================================ */
var APPUI_ADMIN = 5.0;                 // secondes de doigt posé
var appuiAdmin = null;                 // { el, i, t0, minuteur }

function armeAppuiLong(el, i){
  /* touch-action en JS et non en CSS : la vignette débloquée doit
     rester défilante, seule la verrouillée capture le doigt. */
  el.style.touchAction = "none";
  var anneau = document.createElement("div");
  anneau.className = "anneauAdmin";
  el.appendChild(anneau);

  function debut(ev){
    if(appuiAdmin) return;
    appuiAdmin = { el:el, i:i, t0:Date.now(), anneau:anneau, deplace:false,
                   x:ev.clientX, y:ev.clientY };
    el.classList.add("presse");
    el.setPointerCapture && el.setPointerCapture(ev.pointerId);
    appuiAdmin.minuteur = setInterval(tic, 60);
    ev.preventDefault();
  }
  function tic(){
    if(!appuiAdmin) return;
    var av = (Date.now() - appuiAdmin.t0) / 1000 / APPUI_ADMIN;
    appuiAdmin.anneau.style.setProperty("--av", Math.min(1, av));
    if(av >= 1){
      var idx = appuiAdmin.i;
      finAppui();
      demandeApercuAdmin(idx);
    }
  }
  function bouge(ev){
    if(!appuiAdmin) return;
    /* Le doigt qui glisse veut faire défiler la page, pas ouvrir un
       panneau caché. Douze pixels de tolérance : moins, et le moindre
       tremblement annulerait le geste sur une tablette tenue à bout
       de bras. */
    if(Math.hypot(ev.clientX - appuiAdmin.x, ev.clientY - appuiAdmin.y) > 12) finAppui();
  }
  function finAppui(){
    if(!appuiAdmin) return;
    clearInterval(appuiAdmin.minuteur);
    appuiAdmin.el.classList.remove("presse");
    appuiAdmin.anneau.style.setProperty("--av", 0);
    appuiAdmin = null;
  }
  el.addEventListener("pointerdown", debut);
  el.addEventListener("pointermove", bouge);
  el.addEventListener("pointerup", finAppui);
  el.addEventListener("pointercancel", finAppui);
  el.addEventListener("pointerleave", finAppui);
  el.addEventListener("contextmenu", function(ev){ ev.preventDefault(); });
}

/* Le clic court sur une carte verrouillée : on dit pourquoi elle
   l'est, sans jamais laisser deviner qu'un appui long existe. */
function clicCarteVerrouillee(i){
  if(appuiAdmin) return;
  message(carteSpeciale(i)
    ? "« Mily dans la jungle » est un événement : il faut assez de joueurs connectés."
    : "Termine la carte précédente pour débloquer celle-ci.");
}

function demandeApercuAdmin(i){
  var mot = prompt(
    "ACCÈS ADMINISTRATEUR\n\n"
    + "Prévisualiser « " + CARTES[i].nom + " » sans la déverrouiller ?\n\n"
    + "Rien de ce qui se passera pendant ce test ne sera enregistré :\n"
    + "ni dégâts, ni champion, ni progression, ni chrono.\n\n"
    + "Mot de passe :");
  if(mot === null) return;
  if(!motAdminValide(mot)) return;      // mot faux : rien ne se passe, comme demandé
  ouvreApercuAdmin(i);
}

/* ---------------------------------------------------------------
   ENTRER ET SORTIR DE LA PRÉVISUALISATION
   --------------------------------------------------------------- */
function ouvreApercuAdmin(i){
  if(!pseudoSaisi()) $("pseudo").value = "Créateur";
  monNom = pseudoSaisi();
  /* Le drapeau est levé AVANT lancePartie : nouvelleCarte publie et
     salue le salon en passant, et il ne faut pas qu'un seul de ces
     messages sorte. */
  modeApercu = true;
  lancePartie(i);
  $("hud").classList.add("apercu");
  message("Prévisualisation de « " + CARTES[i].nom + " ». Rien ne sera enregistré.");
}
function quitteApercuAdmin(){
  modeApercu = false;
  $("hud").classList.remove("apercu");
  /* Les dégâts du test ne doivent pas hanter le classement local :
     on efface la mémoire de la partie d'essai. */
  scoresSalon = {};
  jeu = null;
  signatureBarges = null;
  quitteVersBriefing();
  message("");
}

/* ---------------------------------------------------------------
   RETOUR À L'ACCUEIL, ET REPRISE

   Quitter la bataille ne la détruit pas : `jeu` reste en mémoire, la
   boucle cesse simplement de l'animer. Et de toute façon l'essentiel
   — défenses détruites, PV du Brasier — vit dans l'instantané partagé
   et sera réappliqué au retour. On peut donc revenir au menu, changer
   la composition de ses navettes, regarder les cartes, puis reprendre
   là où l'on était.

   Une réserve, et elle est réelle : les troupes déjà débarquées ne
   sont pas simulées pendant qu'on est au menu. Elles attendent,
   figées, plutôt que de mourir sans témoin — c'est le comportement le
   moins surprenant des deux.
   --------------------------------------------------------------- */
function retourAccueil(){
  if(modeApercu) return quitteApercuAdmin();
  quitteVersBriefing();
  majBoutonReprendre();
}
/* Peut-on encore reprendre la partie laissée en plan ? Seulement si
   le salon n'est pas passé à autre chose entre-temps. */
function reprisePossible(){
  if(!jeu || jeu.fin) return false;
  if(jeu.index === IDX_JUNGLE) return jungleEnCours(monde);
  return jeu.index === carteSalon;
}
function majBoutonReprendre(){
  var b = $("btReprendre");
  if(!b) return;
  var ok = reprisePossible();
  b.style.display = ok ? "" : "none";
  if(ok) b.textContent = "↩ REPRENDRE — " + CARTES[jeu.index].nom;
  /* Un seul bouton principal à la fois : « DÉBARQUER » recommence la
     carte à zéro, et proposer les deux au même endroit sans les
     distinguer ferait perdre sa partie à quelqu'un. */
  var l = $("lancer");
  if(l) l.textContent = ok ? "RECOMMENCER" : "DÉBARQUER";
}
function reprendCombat(){
  if(!reprisePossible()) return;
  $("brief").style.display = "none";
  $("hud").classList.add("on");
  enJeu = true;
  dprPlafond = 4; lissageImg = 16; gouvLent = 0; gouvVite = 0;
  ajuste();
  signatureBarges = null;
  majBarres();
  majPodium();
  message("De retour au combat.");
}

/* ---------------------------------------------------------------
   ENTRER DANS LA JUNGLE
   Assombrissement, coup de tonnerre, éclair, le titre — puis la carte.
   La séquence est courte : trois secondes, c'est une porte qu'on
   franchit, pas un générique.
   --------------------------------------------------------------- */
function entreDansLaJungle(){
  var v = $("voletJungle");
  if(!v){
    v = document.createElement("div");
    v.id = "voletJungle";
    v.innerHTML = '<div class="ecl"></div><div class="ttr">MILY<br><b>DANS LA JUNGLE</b></div>';
    document.body.appendChild(v);
  }
  v.classList.remove("on"); void v.offsetWidth;      // on relance l'animation
  v.classList.add("on");
  son.reveille();
  if(son.tonnerre) son.tonnerre();
  setTimeout(function(){ if(son.tonnerre) son.tonnerre(); }, 1400);
  setTimeout(function(){
    lancePartie(IDX_JUNGLE);
    v.classList.remove("on");
  }, 2600);
}

/* Le salon a fermé l'expédition pendant qu'on y était : on ne peut pas
   rester seul dans une jungle qui n'existe plus pour les autres. */
function finExpeditionLocale(){
  if(!enJeu || !jeu || jeu.index !== IDX_JUNGLE) return;
  message("L'expédition est terminée. Retour au campement.");
  quitteVersBriefing();
}
/* Retour au menu, proprement : la partie s'arrête, le briefing revient
   avec ses vignettes à jour. */
function quitteVersBriefing(){
  enJeu = false;
  bilanActif = false;
  $("bilan").classList.remove("on");
  $("hud").classList.remove("on");
  $("hud").classList.remove("fin");
  $("brief").style.display = "";
  evtEtat = "";
  majMondes();
  rafraichitPlan();
  majBoutonReprendre();
}

/* ---------------------------------------------------------------
   LE PANNEAU D'ADMINISTRATION
   Protégé par le même mot de passe que la remise à zéro et le plan de
   défense. Il ne contient pour l'instant qu'un réglage, mais il est
   fait pour en accueillir d'autres : chaque réglage part dans
   l'instantané partagé, donc il vaut pour tout le salon.
   --------------------------------------------------------------- */
function installeAdmin(){
  var b = $("btAdmin");
  if(!b) return;
  b.addEventListener("click", function(){
    var mot = prompt("Mot de passe administrateur :");
    if(mot === null) return;
    if(!motAdminValide(mot)){
      alert("Mot de passe incorrect. Rien n'a été touché.");
      return;
    }
    var actuel = minJoueursJungle();
    var rep = prompt(
      "RÉGLAGES DU SALON — 1 sur 2\n\n"
      + "Nombre minimum de joueurs connectés pour lancer\n"
      + "« Mily dans la jungle ».\n\n"
      + "Valeur actuelle : " + actuel + " joueurs.\n"
      + "Par défaut : " + EQ.JUNGLE_MIN_JOUEURS + " joueurs.\n\n"
      + "Entre un nombre entre 1 et 60 :", "" + actuel);
    if(rep === null) return;
    var n = parseInt(rep, 10);
    if(!(n >= 1 && n <= 60)){
      alert("Il faut un nombre entre 1 et 60. Rien n'a été changé.");
      return;
    }
    /* Le second réglage : la dureté des défenses de la jungle. Il vit
       dans le même panneau et voyage avec le même numéro, parce qu'on
       les règle ensemble — l'un dit qui peut entrer, l'autre ce qu'on
       y trouve. */
    var repPv = prompt(
      "RÉGLAGES DU SALON — 2 sur 2\n\n"
      + "Bonus de PV des défenses sur « Mily dans la jungle ».\n"
      + "Le Brasier, lui, garde exactement sa vie.\n\n"
      + "Valeur actuelle : +" + bonusPvJungle + " %.\n"
      + "Par défaut : +" + EQ.JUNGLE_PV_BONUS + " % (leur vie est doublée).\n\n"
      + "Entre un pourcentage entre 0 et 900 :", "" + bonusPvJungle);
    if(repPv === null) return;
    var pv = parseInt(repPv, 10);
    if(!(pv >= 0 && pv <= 900)){
      alert("Il faut un pourcentage entre 0 et 900. Rien n'a été changé.");
      return;
    }
    var pose = regleMinJoueurs(n, pv);
    evtEtat = "";
    majMondes();
    alert("Réglages enregistrés.\n\n"
        + "• " + pose + " joueur" + (pose > 1 ? "s" : "") + " connecté"
        + (pose > 1 ? "s" : "") + " pour lancer la jungle\n"
        + "• défenses à +" + bonusPvJungle + " % de PV\n\n"
        + "Ils valent pour TOUT LE SALON et survivent à la fermeture du\n"
        + "navigateur : ils voyagent dans l'instantané partagé.\n\n"
        + "Le changement de PV prend effet à la prochaine expédition —\n"
        + "une jungle en cours garde la dureté avec laquelle elle a été\n"
        + "bâtie.");
  });
}

function installeRaz(){
  var b = $("btRaz");
  if(!b) return;
  b.addEventListener("click", function(){
    var mot = prompt("Mot de passe pour réinitialiser le salon :");
    if(mot === null) return;
    if(!motAdminValide(mot)){
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
  $("btAccueil").addEventListener("click", retourAccueil);
  $("btReprendre").addEventListener("click", reprendCombat);
}
