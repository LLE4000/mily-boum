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

/* CE QUE LA CARTE GARDE À L'ÉCRAN, au minimum. C'était 0,42 : on
   pouvait pousser l'île jusqu'à ce qu'il n'en reste que 42 % de la
   largeur, et comme elle est en losange, le compte réel tombait à
   HUIT POUR CENT de l'écran — mesuré. Quatre-vingt-douze pour cent
   d'eau, l'île coincée dans un coin. C'est ce qu'on voyait quand on
   trouvait « le dézoom fort » : ce n'était pas le zoom, c'était le
   déplacement.
   À 0,80, il reste au plus un cinquième d'écran vide de chaque côté.
   Le `Math.min` avec la taille réelle de la boîte est indispensable :
   quand elle est PLUS PETITE que cette fraction — grand écran, zoom au
   plancher —, exiger 80 % d'une chose qui n'en fait pas tant
   croiserait les deux bornes. On se rabat alors sur « la boîte entière
   tient dans l'écran », qui est la bonne réponse à ce moment-là. */
var TENUE_ECRAN = 0.80;
function borneCamera(){
  cam.z = borne(cam.z, zMinEcran(), ZMAX);
  var B = boiteMonde();
  var mx = Math.min(W * TENUE_ECRAN, B.l * cam.z);
  var my = Math.min(H * TENUE_ECRAN, B.h * cam.z);
  cam.px = borne(cam.px, mx - B.x1 * cam.z, W - mx - B.x0 * cam.z);
  cam.py = borne(cam.py, my - B.y1 * cam.z, H - my - B.y0 * cam.z);
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
  /* Le compte d'unités s'écrit sur la ligne des NAVETTES, donc il
     porte son propre séparateur et son propre mot : posé nu, il aurait
     donné « Navettes44 ». */
  var nu = jeu.unites.length;
  $("unitesV").textContent = " · " + nu + " unité" + (nu > 1 ? "s" : "");
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
  /* « aucune » n'est pas une tuile : elle ne rentre pas dans une
     colonne de 46 px. Elle prend donc toute la ligne — la grille lui
     donne cette permission par la classe, plus par un style écrit à
     la main qui ne connaissait pas la grille. */
  if(!jeu.barges.length) html = '<div class="bg1 aucune">aucune</div>';
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
  /* la Nova est la seule tuile qui change d'aspect en cours de partie :
     on force son redessin au prochain rafraîchissement */
  novaRangTuile = -1;
  majTuileNova();
}

/* ================================================================
   LA TUILE DE LA NOVA CHANGE DE VISAGE À TROIS MILLIONS

   C'est la seule capacité dont le CALIBRE monte pendant la partie, et
   jusqu'ici rien ne le disait : la même petite ogive grise du début à
   la fin, alors que les dégâts passent de 130 à 50 000. On tirait une
   arme quatre cents fois plus forte sans que la tuile bronche.

   Le redessin ne se fait QUE lorsque le rang change. Une icône est un
   canevas de 76 × 76 repeint à la main ; le refaire à chaque
   rafraîchissement du menu, soixante fois par seconde, coûterait plus
   cher que tout le reste du HUD réuni pour une image identique.
   ================================================================ */
var novaRangTuile = -1;
function majTuileNova(){
  if(!jeu || typeof calibreNova !== "function") return;
  var r = calibreNova(jeu.palier).rang | 0;
  if(r === novaRangTuile) return;
  novaRangTuile = r;
  var cv = $("ic_nova");
  if(cv) dessineIcone("nova", cv.getContext("2d"), r);
  var el = $("caps") && $("caps").querySelector('.cap[data-m="nova"]');
  if(!el) return;
  el.classList.toggle("super", r > 0);
  var nm = el.querySelector(".nm");
  if(nm) nm.textContent = r > 0 ? "SUPER NOVA" : "Nova";
  el.title = r > 1 ? "Super Nova, plein calibre" : (r > 0 ? "Super Nova" : "Nova");
}
function majMenu(){
  if(!jeu) return;
  majTuileNova();
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
function dessineIcone(m, c, rang){
  rang = rang | 0;
  c.clearRect(0, 0, 76, 76);
  c.save();
  c.translate(38, 38);
  c.lineJoin = "round";

  if(m === "nova" && rang > 0){
    /* ================================================================
       LA SUPER NOVA — une autre SILHOUETTE, pas un missile recoloré

       La tuile fait trente pixels de côté à l'écran. À cette taille on
       ne lit ni une bande de danger, ni un trèfle, ni un aileron : on
       lit une FORME et une COULEUR, et rien d'autre. Repeindre le
       missile en doré n'aurait donc rien distingué du tout — de loin,
       deux petits objets sombres identiques.

       L'icône ordinaire est un objet compact et sombre au centre d'une
       tuile vide. Celle-ci est son contraire exact : un éclat qui
       REMPLIT la tuile, blanc au cœur et or aux pointes, avec son onde
       de choc. Les deux ne peuvent pas se confondre, même du coin de
       l'œil, même sur un téléphone.

       Le missile reste, minuscule et noir, au centre de l'éclat : la
       case reste la même arme, elle a seulement changé d'échelle. Et
       le second anneau, au plein calibre de cinq millions, dit la
       troisième marche sans ajouter un mot.
       ================================================================ */
    var plein = rang > 1;
    /* le halo, qui donne à la tuile son fond chaud */
    var gh = c.createRadialGradient(0, 0, 0, 0, 0, 34);
    gh.addColorStop(0,    "rgba(255,252,238,.95)");
    gh.addColorStop(0.16, "rgba(255,226,140,.72)");
    gh.addColorStop(0.52, "rgba(255,150,40,.30)");
    gh.addColorStop(1,    "rgba(255,110,20,0)");
    c.fillStyle = gh;
    c.beginPath(); c.arc(0, 0, 34, 0, 6.2832); c.fill();
    /* LES POINTES : quatre longues et quatre courtes, la même étoile à
       huit branches que partout ailleurs dans le jeu. */
    c.fillStyle = "#fff6d8";
    c.beginPath();
    for(var s = 0; s < 16; s++){
      var a = s * Math.PI / 8 - Math.PI / 2;
      var r = (s & 1) ? 9 : ((s & 2) ? 22 : 35);
      var px = Math.cos(a) * r, py = Math.sin(a) * r;
      if(s === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath(); c.fill();
    /* L'ONDE DE CHOC — un anneau, deux au plein calibre */
    c.strokeStyle = "rgba(255,214,110,.85)"; c.lineWidth = 2.4;
    c.beginPath(); c.ellipse(0, 4, 30, 13, 0, 0, 6.2832); c.stroke();
    if(plein){
      c.strokeStyle = "rgba(255,246,214,.55)"; c.lineWidth = 1.8;
      c.beginPath(); c.ellipse(0, 6, 36, 17, 0, 0, 6.2832); c.stroke();
    }
    /* le cœur blanc */
    c.fillStyle = "#ffffff";
    c.beginPath(); c.arc(0, 0, plein ? 9.5 : 8, 0, 6.2832); c.fill();
    /* et l'ogive, noire, au milieu du feu */
    c.fillStyle = "#231c18";
    c.beginPath();
    c.moveTo(0, -7); c.quadraticCurveTo(3.6, -2, 3.2, 5);
    c.lineTo(-3.2, 5); c.quadraticCurveTo(-3.6, -2, 0, -7);
    c.closePath(); c.fill();
    c.restore();
    return;

  }else if(m === "nova"){
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
/* ================================================================
   DEUX CLASSEMENTS, ET CHACUN SA PLACE.

   Il n'y en avait qu'un, et il était faux là où on le regardait le
   plus. Le panneau TOP DÉGÂTS en jeu affichait le cumul de TOUTES les
   îles, alors que la vignette de la même île, sur l'accueil, affichait
   les dégâts de CETTE île. Le joueur voyait 11 388 261 en jeu et
   90 339 sur l'accueil, pour la même carte, à la même seconde.

   Le partage est maintenant celui-ci, et il tient en une phrase :
     — DANS UNE ÎLE, on voit l'île. Le podium en jeu et le bilan de fin
       lisent classementCarte(index). C'est le même nombre que la
       vignette de l'accueil, à la virgule près, parce que c'est la
       même fonction du noyau qui le calcule ;
     — SUR L'ACCUEIL, on voit la carrière. classementSalon() garde son
       cumul de toutes les îles, et il a désormais son bloc à lui.

   Rien n'a changé dans le STOCKAGE : les scores étaient déjà rangés
   par île — la clé d'un seau est « appareil:carte ». Seule la
   projection affichée change.
   ================================================================ */

/* Le classement d'UNE île. Même ossature que classementSalon, mais le
   total vient de totalParJoueurCarte, et le rafraîchissement entre deux
   instantanés n'accepte que les joueurs qui sont sur CETTE île — voir
   le champ `gc` du message d'état. */
function classementCarte(carte){
  var maj = (typeof scoresAJour === "function") ? scoresAJour() : decodeScores(monde && monde.s);
  var par = totalParJoueurCarte(maj, carte | 0);
  var noms = (typeof nomsDesSeaux === "function") ? nomsDesSeaux(maj) : {};
  var id;
  for(id in scoresSalon){
    var e = scoresSalon[id];
    if(!e.nom || e.nom === "?") continue;
    /* LE SCORE VIVANT DOIT PARLER DE LA MÊME ÎLE. Un joueur peut très
       bien être sur l'île 3 pendant que je suis sur l'île 1 : son
       total vivant ne doit alors entrer dans aucun de mes calculs.
       D'où `gcC`, l'île à laquelle `gc` se rapporte. Un client d'une
       version précédente n'envoie ni l'un ni l'autre : il n'apparaît
       que par l'instantané retenu, qui est déjà rangé par île. */
    if(e.gc === undefined || (e.gcC | 0) !== (carte | 0)) continue;
    var cible = (e.seau && noms[e.seau]) ? noms[e.seau] : e.nom;
    if(e.gc > (par[cible] || 0)) par[cible] = e.gc;
  }
  return decoreClassement(classementDepuis(par));
}

/* Qui est encore là, et qui suis-je : commun aux deux classements. */
function decoreClassement(l){
  var present = {}, id;
  if(monNom) present[monNom] = 1;
  for(id in autresJoueurs){
    var j = autresJoueurs[id];
    if(j && j.nom && j.nom !== "?") present[j.nom] = 1;
    if(scoresSalon[id] && scoresSalon[id].nom) present[scoresSalon[id].nom] = 1;
  }
  for(var i = 0; i < l.length; i++){
    l[i].moi = (l[i].nom === monNom) ? 1 : 0;
    l[i].absent = present[l[i].nom] ? 0 : 1;
  }
  return l;
}

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
  /* LE SEAU RATTACHE LE TOTAL VIVANT À LA BONNE LIGNE.
     On classait ce total sous le PSEUDO de l'expéditeur. Un joueur qui
     se renommait apparaissait alors deux fois : son ancien nom, encore
     porté par le tableau partagé, et le nouveau, apporté par son
     message d'état — deux lignes, deux fois le même score. Le seau,
     lui, ne bouge pas quand on change de pseudo : on s'en sert pour
     retrouver sous quelle étiquette le tableau connaît ce joueur, et
     l'on met à jour CETTE ligne-là. */
  var noms = (typeof nomsDesSeaux === "function")
             ? nomsDesSeaux(typeof scoresAJour === "function" ? scoresAJour() : {}) : {};
  var id;
  for(id in scoresSalon){
    var e = scoresSalon[id];
    if(!e.nom || e.nom === "?") continue;
    /* le nom sous lequel le tableau partagé connaît ce seau ; à
       défaut de seau (version précédente, ou pas encore reçu), on
       retombe sur le pseudo, comme avant */
    var cible = (e.seau && noms[e.seau]) ? noms[e.seau] : e.nom;
    if(e.g > (par[cible] || 0)) par[cible] = e.g;
  }
  /* qui est encore là : la prise ⏻ ne se dessine plus, mais la
     classe `parti` éteint toujours la ligne — c'est elle qui porte
     l'information désormais */
  return decoreClassement(classementDepuis(par));
}

/* Déplié ou non : le joueur décide, et son choix tient jusqu'à ce
   qu'il en décide autrement. */
var listeEnLigne = false;
/* Idem pour les bêtes tuées : fermé au départ, et ouvert tant que le
   joueur n'a pas décidé de le refermer. */
var listeVictimes = false;
function majPodium(){
  if(!jeu) return;
  /* Le classement se lit dans le REGISTRE, pas dans la liste des
     joueurs entendus : un joueur qui ferme son navigateur garde sa
     place et son score. On marque seulement qu'il n'est plus là. */
  /* L'ÎLE, PAS LA CARRIÈRE : c'est le même nombre que la vignette de
     cette île sur l'accueil. Voir classementCarte. */
  var l = classementCarte(jeu.index);
  var h = "";
  for(var i = 0; i < Math.min(3, l.length); i++){
    /* même ordre que partout ailleurs : le rang, le badge, le nom */
    h += '<div class="r' + (l[i].moi ? " moi" : "") + (l[i].absent ? " parti" : "")
       + '"><span>' + (i + 1) + '</span>'
       + '<span class="n">' + balliseBadge(l[i].nom) + nomOrne(l[i].nom) + '</span>'
       + '<span class="v">' + nombre(l[i].g) + '</span></div>';
  }
  /* ================================================================
     LES VICTIMES SE REPLIENT.

     Gégé, Tweety et les trois chats : cinq lignes possibles, et elles
     ne partent jamais — une bête tuée le reste jusqu'à la fin de la
     partie. Le panneau du coin s'allongeait donc au fil de l'île
     jusqu'à mordre sur le jeu, pour une information qu'on lit UNE
     fois : on apprend que Praline y est passée, et ensuite on le sait.

     Elles gardent donc leur ligne — le compte reste sous les yeux,
     c'est ce qui donne envie d'ouvrir — mais le détail attend qu'on
     le demande. Même geste que « qui est en ligne » juste dessous :
     la ligne se touche, le chevron dit dans quel sens.
     ================================================================ */
  var vic = [];
  if(jeu.tueurGege){
    vic.push('🦡 <b>' + echappe(jeu.tueurGege) + '</b> a tué Gégé la belette');
  }
  if(jeu.tueurTweety){
    vic.push('🐤 <b>' + echappe(jeu.tueurTweety) + '</b> a tué Tweety');
  }
  /* et les trois chats de Mily, chacun avec son coupable */
  for(var ec = 0; ec < ESPECES_PROTEGEES.length; ec++){
    var esc = ESPECES_PROTEGEES[ec];
    if(!jeu.tueurChats[esc]) continue;
    vic.push('🐈 <b>' + echappe(jeu.tueurChats[esc]) + '</b> a tué ' + CRE[esc].nom);
  }
  if(vic.length){
    h += '<div class="gg victimes' + (listeVictimes ? " ouverte" : "") + '" data-victimes="1">'
       /* COURT, PARCE QUE LE PANNEAU EST ÉTROIT. « y sont passées »
          tenait sur une tablette et repassait à la ligne sur un
          téléphone, où le bloc ne fait plus que 118 px. */
       + '🐾 ' + vic.length + (vic.length > 1 ? " bêtes de Mily tuées"
                                             : " bête de Mily tuée")
       + '<i>' + (listeVictimes ? "▾" : "▸") + '</i></div>';
    if(listeVictimes){
      h += '<div class="quiLa">';
      for(var iv = 0; iv < vic.length; iv++) h += '<div class="vl">' + vic[iv] + '</div>';
      h += '</div>';
    }
  }
  /* Qui est réellement entendu, là, maintenant. C'est la réponse à
     « pourquoi je ne vois que mon nom ? » : si le relais est tombé ou
     que l'autre appareil est sur un autre relais, ça se LIT ici au
     lieu de se deviner. */
  if(!reseau.connecte){
    h += '<div class="gg">🔌 hors ligne — relais injoignable</div>';
  }else{
    /* LE COMPTE D'ABORD, LES NOMS SI ON LES DEMANDE.
       À dix joueurs, une liste ouverte en permanence mangerait le coin
       de l'écran ; mais « deux joueurs en ligne » sans savoir QUI est
       une demi-réponse. On garde donc le compte, et un toucher
       déplie la liste — avec le nombre d'unités de chacun, qui dit
       d'un coup d'œil qui est réellement en train de se battre et qui
       regarde le menu. */
    var nAutres = 0, idj;
    for(idj in autresJoueurs) nAutres++;
    h += '<div class="gg enligne' + (listeEnLigne ? " ouverte" : "") + '" data-enligne="1">'
       + '🌐 ' + (nAutres ? (nAutres + 1) + " joueurs en ligne"
                          : "seul dans le salon pour l'instant")
       + (nAutres ? '<i>' + (listeEnLigne ? "▾" : "▸") + '</i>' : "")
       + '</div>';
    if(listeEnLigne && nAutres){
      h += '<div class="quiLa">' + ligneEnLigne(monNom, jeu ? jeu.unites.length : 0, 1);
      var q = nomsEnLigne();
      for(var iq = 0; iq < q.montres.length; iq++)
        h += ligneEnLigne(q.montres[iq].nom, q.montres[iq].n, 0);
      if(q.reste) h += '<div class="ql autres"><span class="p"></span><span class="n">et '
                     + q.reste + " autre" + (q.reste > 1 ? "s" : "") + "…</span></div>";
      h += '</div>';
    }
  }
  /* On compare la CHAÎNE bâtie, pas ce qu'il y a dans la page : les
     badges y sont posés après coup, donc la page ne ressemble plus au
     texte qui l'a produite. C'est la chaîne qui dit si quelque chose a
     changé. */
  if(h !== podiumHtml){ podiumHtml = h; $("podiumL").innerHTML = h; poseBadges($("podiumL")); }
}
/* Une ligne de la liste des présents. Le nombre d'unités dit qui se
   bat vraiment : zéro, c'est quelqu'un qui regarde le menu ou qui vient
   de perdre sa vague. */
/* ================================================================
   QUI EST EN LIGNE — ON EN MONTRE HUIT, ET ON DIT LE RESTE

   Les deux listes — celle du chat et celle de l'accueil — bâtissaient
   une ligne par joueur, toutes. À cinquante, ça fait cinquante lignes
   de HTML reconstruites À CHAQUE message reçu pour le chat, dans le
   même budget d'image que le champ de bataille ; et un ascenseur de
   cinq lignes sur cinquante ne dit à personne combien il y en a.

   On en montre huit, on annonce le reste en toutes lettres, et ça
   défile quand même. Huit, parce que c'est ce qu'on lit d'un coup
   d'œil sans faire défiler : au-delà, on ne cherche plus un nom, on
   consulte un annuaire.
   ================================================================ */
var NOMS_EN_LIGNE_MAX = 8;
function nomsEnLigne(max){
  var l = [], k;
  if(typeof autresJoueurs === "object" && autresJoueurs){
    for(k in autresJoueurs){
      var j = autresJoueurs[k];
      if(j && j.nom && j.nom !== "?") l.push({ nom:j.nom, n:j.n | 0 });
    }
  }
  /* rangés par NOM et non par ordre d'arrivée : une liste qui saute
     d'une seconde à l'autre au gré des messages reçus est illisible */
  l.sort(function(a, b){ return a.nom < b.nom ? -1 : a.nom > b.nom ? 1 : 0; });
  var m = max || NOMS_EN_LIGNE_MAX;
  return { montres:l.slice(0, m), reste:Math.max(0, l.length - m), total:l.length };
}
function ligneEnLigne(nom, n, moi){
  return '<div class="ql' + (moi ? " moi" : "") + '">'
       + '<span class="p">' + (moi ? "🔸" : "🔹") + '</span>'
       + '<span class="n">' + balliseBadge(nom) + nomOrne(nom || "?")
       + (moi ? " (toi)" : "") + '</span>'
       + '<span class="u">' + (n > 0 ? n + " unité" + (n > 1 ? "s" : "") : "au menu") + '</span>'
       + '</div>';
}
/* Le panneau du haut-gauche est réécrit en entier dès qu'il change :
   l'écouteur est donc posé sur le CONTENEUR, une fois pour toutes, et
   non sur la ligne — qui, elle, disparaît à chaque rafraîchissement. */
function installeListeEnLigne(){
  var e = $("podium");
  if(!e) return;
  e.addEventListener("click", function(ev){
    if(!ev.target.closest) return;
    /* Deux replis dans le même panneau, un seul écouteur : c'est la
       balise touchée qui dit lequel bascule. */
    if(ev.target.closest("[data-enligne]")) listeEnLigne = !listeEnLigne;
    else if(ev.target.closest("[data-victimes]")) listeVictimes = !listeVictimes;
    else return;
    podiumHtml = "";                 // on force la réécriture
    majPodium();
  });
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
  /* Même source que le podium en jeu — et comme lui, le bilan d'une
     île parle de CETTE île : on vient d'y passer une heure, ce qu'on
     veut lire c'est ce qu'on y a fait. */
  var l = classementCarte(jeu.index);
  var h = "";
  for(var i = 0; i < l.length; i++){
    /* LE BILAN EST UN CLASSEMENT LUI AUSSI, et il suit donc la même
       règle que les autres : un chiffre, le badge, le pseudo. Le
       laisser seul avec ses coupes et sa prise ⏻ aurait fait de
       l'écran de fin d'île le seul endroit du jeu où l'on compte
       autrement. */
    h += '<div class="r' + (l[i].moi ? " moi" : "") + (l[i].absent ? " parti" : "") + '">'
       + '<span>' + (i + 1) + '</span>'
       + '<span class="n">' + balliseBadge(l[i].nom) + nomOrne(l[i].nom) + '</span>'
       + '<span class="v">' + nombre(l[i].g) + ' dégâts</span></div>';
  }
  $("bilanLi").innerHTML = h;
  poseBadges($("bilanLi"));
  $("bilan").classList.add("on");
}
function majBilan(dt){
  if(!bilanActif) return;
  bilanT -= dt;
  $("bilanC").textContent = Math.max(0, Math.ceil(bilanT));
  if(bilanT <= 0){
    bilanActif = false;
    $("bilan").classList.remove("on");
    /* UNE CARTE ÉVÉNEMENT NE MÈNE À AUCUNE ÎLE SUIVANTE. C'est une
       expédition : elle se termine, le salon la referme pour la durée
       de SON verrou, et tout le monde revient au campement. La
       campagne, elle, n'a pas bougé d'un cran pendant ce temps. */
    /* EN PRÉVISUALISATION, la victoire n'est pas une victoire : ni
       champion, ni chrono de 48 h entamé, ni île suivante. On sort du
       test, c'est tout. */
    if(modeApercu){ quitteApercuAdmin(); return; }
    if(carteSpeciale(jeu.index)){
      termineExpedition(jeu.index, championDeLaPartie().nom);
      quitteVersBriefing();
      return;
    }
    /* Le champion de l'île qui vient de tomber, gravé dans
       l'instantané partagé : il restera affiché sur sa vignette
       jusqu'à la prochaine fois que cette même île sera détruite. */
    sacreChampion(jeu.index, championDeLaPartie().nom);
    /* L'ÎLE D'APRÈS SE DEMANDE, ELLE NE SE CALCULE PLUS.
       « jeu.index + 1 » tombait sur la jungle en sortant de la
       cinquième île, depuis que trois nouvelles îles vivent après elle
       dans le tableau. carteSuivante() lit l'ordre de campagne, qui
       saute les cartes événement.
       Le salon peut déjà être plus loin que nous — quelqu'un d'autre a
       fait tomber une île pendant qu'on jouait celle-ci : on garde le
       plus avancé des deux, comparé AU RANG et non à l'index. */
    var apres = carteSuivante(jeu.index);
    var suiv = (apres < 0) ? -1
             : (rangCampagne(carteSalon) > rangCampagne(apres)) ? carteSalon : apres;
    /* Plus d'île après celle-ci : la campagne est bouclée. */
    if(suiv < 0){
      /* Toutes les îles sont tombées : nouvelle campagne, monde neuf.
         « cycleSalon++ » tout seul ne suffisait pas — il changeait de
         campagne sans publier le monde neuf, si bien que le tableau
         des dégâts de la campagne écoulée restait dans l'instantané
         pendant que le cumul local repartait de zéro. Le joueur
         repassait alors contre son propre mur. nouvelleCampagneSalon
         fait les deux, et grave les podiums au passage. */
      suiv = premiereCarte();
      nouvelleCampagneSalon();
    }
    carteSalon = suiv;
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
/* ================================================================
   LE TITRE — CE QUI LE RENDAIT ENFANTIN, ET CE QUI LE CORRIGE

   L'ancien avait un contour noir de vingt-six pixels autour d'un
   dégradé orange, avec un reflet blanc sur la moitié haute et
   vingt-six étincelles jetées au hasard. C'est le vocabulaire exact du
   logo de jeu pour enfants, et il tenait à quatre choses précises :

     1. LE CONTOUR ÉPAIS. Un cerne aussi large que le fût des lettres
        les transforme en autocollant. Il tombe à quatre pixels, en
        deux passes — une sombre large, une chaude serrée — ce qui
        donne un BORD, pas un cerne.
     2. LE REFLET COUPÉ NET au milieu de la hauteur. Cette barre
        horizontale est la signature du plastique brillant. Elle est
        remplacée par un biseau : une seule ligne claire posée sur
        l'arête supérieure des lettres, décalée d'un pixel et demi.
        C'est ainsi que la lumière tombe sur du métal.
     3. LES ÉTINCELLES AU HASARD PARTOUT. Elles disaient « magie ».
        Ce qui reste est une CENDRE, rare, confinée à la bande basse,
        décroissante — la retombée d'une explosion, pas des paillettes.
     4. LE MOT TASSÉ. Un espacement légèrement négatif et un « Boum »
        plus lourd que « Mily » donnent une marque plutôt qu'un mot :
        c'est le seul endroit où l'on peut dire quelque chose du jeu
        avec la seule forme des lettres.

   On garde exactement ce qui faisait sa force : la braise, l'or, la
   chaleur. C'est le TRAITEMENT qui change, pas la palette.
   ================================================================ */
function dessineLogo(){
  var cv = $("logoCv");
  var c = cv.getContext("2d");
  var w = cv.width, h = cv.height;
  var cx = w / 2, cy = h * 0.54;
  var i;
  c.clearRect(0, 0, w, h);

  /* ---- LE FOYER. Deux halos et non un : l'orange serré fait la
     source, le mauve large la rattache à la page. Un seul halo orange
     posait le mot sur une tache ronde. ---- */
  var g1 = c.createRadialGradient(cx, cy, 10, cx, cy, w * 0.42);
  g1.addColorStop(0, "rgba(255,150,52,.34)");
  g1.addColorStop(0.45, "rgba(226,96,26,.14)");
  g1.addColorStop(1, "rgba(255,80,20,0)");
  c.fillStyle = g1; c.fillRect(0, 0, w, h);
  var g2 = c.createRadialGradient(cx, cy * 1.18, 20, cx, cy * 1.18, w * 0.5);
  g2.addColorStop(0, "rgba(150,74,232,.16)");
  g2.addColorStop(1, "rgba(120,50,210,0)");
  c.fillStyle = g2; c.fillRect(0, 0, w, h);

  /* ---- LE MOT. « Mily » et « Boum » sont posés séparément : ils
     n'ont ni la même graisse ni le même serrage, et c'est ce
     déséquilibre qui fait la marque. On mesure d'abord pour centrer
     l'ensemble — jamais deux `textAlign:center` côte à côte, qui
     centreraient chaque moitié pour elle-même. ---- */
  var POL = "'Trebuchet MS','Segoe UI',sans-serif";
  var fMily = "700 108px " + POL;
  var fBoum = "900 116px " + POL;
  var ECART = 20;                       // le blanc entre les deux mots
  c.textAlign = "left"; c.textBaseline = "alphabetic";
  c.font = fMily; var wMily = c.measureText("Mily").width;
  c.font = fBoum; var wBoum = c.measureText("Boum").width;
  var x0 = cx - (wMily + ECART + wBoum) / 2;
  var xB = x0 + wMily + ECART;
  var yb = cy + 38;                     // la ligne de pied

  /* Poser les deux mots dans le contexte courant, quel que soit le
     style de remplissage en cours. Tout ce qui suit s'en sert : les
     bords, le corps, le biseau, la coupe des braises. */
  function traceMot(dx, dy){
    c.font = fMily; c.fillText("Mily", x0 + dx, yb + dy);
    c.font = fBoum; c.fillText("Boum", xB + dx, yb + dy);
  }
  function contourMot(lw, teinte, dx, dy){
    c.lineJoin = "round"; c.lineWidth = lw; c.strokeStyle = teinte;
    c.font = fMily; c.strokeText("Mily", x0 + dx, yb + dy);
    c.font = fBoum; c.strokeText("Boum", xB + dx, yb + dy);
  }

  /* ---- L'OMBRE PORTÉE, sous le mot et décalée vers le bas. Elle le
     décolle du fond ; sans elle, le bord fin ne suffit plus. ---- */
  c.save();
  c.fillStyle = "rgba(24,8,2,.55)";
  c.filter = "blur(7px)";
  traceMot(0, 9);
  c.restore();

  /* ---- LE BORD, en deux passes serrées. Large et sombre d'abord,
     étroit et chaud ensuite : c'est l'écart entre les deux qui se lit
     comme une épaisseur de métal, là où un seul trait noir large se
     lisait comme un autocollant. ---- */
  contourMot(7.5, "rgba(28,9,2,.92)", 0, 0);
  contourMot(3.0, "#7a2c0a", 0, 0);

  /* ---- LE CORPS. Cinq arrêts, dont deux très rapprochés au tiers
     haut : c'est cette cassure nette qui donne le tranchant du métal
     poli, qu'un dégradé régulier ne donne jamais. ---- */
  /* Les bornes suivent la HAUTEUR DE CAPITALE, pas une marge ronde :
     à yb−96 les douze premiers pixels du dégradé tombaient au-dessus
     des lettres, et toute la partie crème se retrouvait poussée dans
     le mot — un titre pâle du haut jusqu'au tiers. */
  var gt = c.createLinearGradient(0, yb - 84, 0, yb + 10);
  gt.addColorStop(0.00, "#ffeec6");
  gt.addColorStop(0.20, "#ffcb78");
  gt.addColorStop(0.26, "#ffa023");
  gt.addColorStop(0.68, "#ee5a13");
  gt.addColorStop(1.00, "#9e2108");
  c.fillStyle = gt;
  traceMot(0, 0);

  /* ================================================================
     LE BISEAU — et pourquoi il ne peut PAS se faire en une passe.

     Premier essai : une copie claire du mot, remontée de deux pixels,
     posée en `source-atop`. Le résultat était un titre BEIGE. C'est
     que `source-atop` peint partout où il y a déjà quelque chose, et
     une lettre décalée de deux pixels recouvre sa jumelle à quatre-
     vingt-dix-huit pour cent : on ne repeignait pas une arête, on
     repeignait la lettre, et tout le dégradé de braise disparaissait
     sous une couche crème.

     Ce qu'on veut est une DIFFÉRENCE de deux formes : « la lettre,
     moins la même lettre décalée vers le bas » — il n'en reste que le
     filet du haut. Aucun mode de composition ne fait cette soustraction
     par-dessus un dessin existant ; il faut la faire à part, sur un
     canevas vide, puis reporter le filet obtenu.

     Deux filets, donc, et le même procédé pour les deux :
       le clair en haut  = mot ∖ (mot décalé vers le bas)
       le sombre en bas  = mot ∖ (mot décalé vers le haut)
     C'est exactement ainsi qu'une arête de métal prend la lumière, et
     c'est ce qui sépare ce titre d'un autocollant.
     ================================================================ */
  function filetMot(dy, teinte, flou){
    var t = nouveauCanvas(w, h);
    var q = t.getContext("2d");
    q.textAlign = "left"; q.textBaseline = "alphabetic";
    q.fillStyle = teinte;
    q.font = fMily; q.fillText("Mily", x0, yb);
    q.font = fBoum; q.fillText("Boum", xB, yb);
    /* on retire la même forme décalée : il ne reste que la tranche */
    q.globalCompositeOperation = "destination-out";
    q.font = fMily; q.fillText("Mily", x0, yb + dy);
    q.font = fBoum; q.fillText("Boum", xB, yb + dy);
    q.globalCompositeOperation = "source-over";
    if(flou) c.filter = "blur(" + flou + "px)";
    c.drawImage(t, 0, 0);
    c.filter = "none";
  }
  filetMot(1.9, "rgba(255,248,230,.78)", 0.45);  // la lumière, sur l'arête haute
  filetMot(-3.2, "rgba(88,16,3,.52)", 0.7);      // l'ombre, au pied des lettres

  /* ---- LES BRAISES. Elles montent, elles s'éteignent, et elles ne
     dépassent pas la bande du mot : une cendre qui traverse tout le
     cadre redevient une paillette. Le tirage est fixe — le logo est
     peint une fois, il doit être le même à chaque ouverture. ---- */
  var al = prng(0x10607);
  c.save();
  c.globalCompositeOperation = "lighter";
  for(i = 0; i < 34; i++){
    var u = al();
    var bx = x0 - 30 + u * (wMily + ECART + wBoum + 60);
    var mont = al();                    // 0 au ras du mot, 1 tout en haut
    var by = yb + 6 - mont * 104;
    var r = (0.6 + al() * 1.7) * (1 - mont * 0.45);
    var a = (0.10 + al() * 0.34) * (1 - mont * 0.72);
    c.fillStyle = "rgba(255," + (156 + (al() * 84 | 0)) + ",72," + a.toFixed(3) + ")";
    c.beginPath(); c.arc(bx, by, r, 0, 6.2832); c.fill();
  }
  c.restore();
}

function construitBriefing(){
  /* barges par défaut : que des Furies */
  compoBarges = [];
  for(var i = 0; i < EQ.NB_BARGES; i++)
    compoBarges.push({ type:"furie", n:placesNavette("furie") });
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
    /* Relu à travers `valide` : la même clé gardait un nom de voix
       avant la v0.95 et garde un choix depuis. Voir 94-musique-ibiza. */
    voixDiscours.choix = voixDiscours.valide(sauv.voix);
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
    /* son.bascule() et non « son.actif = !son.actif » : la bascule
       descend aussi le nœud maître, seule façon d'éteindre une nappe
       déjà en train de jouer. Appelée SUR `son`, jamais détachée. */
    this.textContent = son.bascule() ? "🔊 Son activé" : "🔇 Son coupé";
    /* La bande-son d'Ibiza a son propre contexte audio : le nœud
       maître des bruitages ne la touche pas. Un bouton « son coupé »
       qui laisse une musique jouer, c'est un bouton cassé. */
    musique.suitLeSon();
  });
  $("btPlein").addEventListener("click", basculePlein);
}
/* Le pseudo, une seule définition pour tout le fichier : nettoyé
   EXACTEMENT comme le fera le tableau des scores, borné à quatorze
   caractères, et vide s'il ne reste rien.

   Pourquoi le même nettoyage ici : « : », « | » et « ~ » séparent les
   champs de l'instantané partagé, donc nettoieNomScore les retire.
   Un pseudo qui n'était fait que de ceux-là — « :::: » — passait ce
   contrôle (non vide après trim) mais partait sur le réseau SANS nom :
   son auteur voyait ses 1 800 000, personne d'autre ne les voyait
   jamais, et l'entrée mangeait quand même une des SCORES_GARDES
   places. Le même nettoyage des deux côtés supprime l'écart : le
   bouton reste grisé et l'avertissement dit pourquoi. */
function pseudoSaisi(){
  return nettoieNomScore($("pseudo").value);
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
      nom:pseudoSaisi(), compo:compoBarges, relais:$("relais").value,
      /* La voix du discours est un réglage d'APPAREIL — elle n'a de
         sens que là où elle est installée, donc elle vit ici et ne
         part jamais dans l'instantané partagé. */
      voix:voixDiscours.choix || "moteur"
    }));
  }catch(e){}
}
/* LA RANGÉE DES HUIT NAVETTES.
   Trois vignettes-portraits par navette, c'était vingt-quatre
   portraits de quatre-vingt-quatre pixels et deux rangées pleines :
   DÉBARQUER partait sous l'horizon. On ne montre plus que le type
   CHOISI, et le choix se fait dans un menu déroulant.
   Rien ne change sous le capot : c'est toujours compoBarges[i].type
   qu'on écrit, toujours placesNavette() qui fixe l'effectif, et
   toujours sauvegarde() qui range le tout. */
function majBargesBrief(){
  var h = "", i, t;
  for(i = 0; i < EQ.NB_BARGES; i++){
    var b = compoBarges[i];
    h += '<div class="nv"><div class="nvt"><span>N' + (i + 1) + '</span>'
       + '<b>' + b.n + '</b></div>'
       + '<canvas width="150" height="104" id="pt_' + i + '"></canvas>'
       + '<select class="nvs" data-i="' + i + '" aria-label="Troupe de la navette ' + (i + 1) + '">';
    for(t = 0; t < TYPES_TROUPE.length; t++){
      var cle = TYPES_TROUPE[t];
      h += '<option value="' + cle + '"' + (b.type === cle ? " selected" : "") + '>'
         + UNI[cle].nom + '</option>';
    }
    h += '</select></div>';
  }
  $("barges").innerHTML = h;

  /* portraits décalqués : un seul par navette désormais, celui du
     type embarqué */
  for(i = 0; i < EQ.NB_BARGES; i++){
    var el = $("pt_" + i);
    if(!el) continue;
    var c = el.getContext("2d");
    var g = c.createLinearGradient(0, 0, 0, 104);
    g.addColorStop(0, "#3a2450"); g.addColorStop(1, "#170e21");
    c.fillStyle = g; c.fillRect(0, 0, 150, 104);
    dessinePortrait(c, compoBarges[i].type, 0, -14, 150);
  }
  /* choix du type : une navette n'embarque qu'un seul type de troupe */
  var sels = $("barges").querySelectorAll(".nvs");
  for(i = 0; i < sels.length; i++){
    sels[i].addEventListener("change", function(){
      var i2 = +this.getAttribute("data-i");
      if(!UNI[this.value]) return;
      compoBarges[i2].type = this.value;
      /* L'effectif suit le type, TOUJOURS au complet : douze Furies,
         quinze Commandos, un Ogre. L'ancien « min(max, n) » gardait le 1 de
         l'Ogre quand on revenait aux Furies — une navette qui partait
         avec une seule passagère. On n'en choisit pas le nombre. */
      compoBarges[i2].n = placesNavette(compoBarges[i2].type);
      majBargesBrief(); sauvegarde();
    });
  }
  /* LE RÉSUMÉ NE COMPTE PLUS LES ABSENTS.
     Il énumérait les six types quoi qu'il arrive : « 96 Furies,
     0 Commando, 0 Ogre, 0 Doc, 0 TX-90, 0 PYR-120 ». Cinq zéros pour
     un chiffre utile — supportable en bas d'un bloc, illisible depuis
     que la ligne est montée dans le titre, où elle doit tenir à côté
     de « COMPOSITION DES HUIT NAVETTES ».
     Une troupe qu'on n'emmène pas n'a rien à dire : on ne garde que
     ce qui embarque. Et si rien n'embarque — huit navettes vides, ce
     qui ne devrait pas arriver — on l'écrit plutôt que de laisser un
     tiret seul après le total. */
  var tot = 0, cpt = {};
  compoBarges.forEach(function(bb){ tot += bb.n; cpt[bb.type] = (cpt[bb.type] || 0) + bb.n; });
  var det = TYPES_TROUPE.filter(function(t2){ return cpt[t2] > 0; })
                        .map(function(t2){ return nommeTroupes(t2, cpt[t2]); }).join(", ");
  $("totalTroupes").innerHTML = "Flotte&nbsp;: <b>" + tot + "</b>&nbsp;unités"
                              + (det ? " — " + det : "");
}
/* « 1 Ogre », « 12 Furies » : le pluriel suit l'effectif, pas le type.
   « 1 Ogres » sur la seule navette qui n'en embarque qu'un aurait été
   la plus visible des fautes. */
function nommeTroupes(type, n){
  return n + " " + UNI[type].nom + (n > 1 ? "s" : "");
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
  var quoi = carteSpeciale(i) ? "de « " + CARTES[i].nom + " »" : "de cette carte";
  return '<div class="champ">Détruite par <b>' + echappe(nom) + '</b>'
       + '<i>' + echappe(nom) + ' est le champion ' + quoi
       + '. Mily lui offre un verre.</i></div>';
}

/* ---------------------------------------------------------------
   LE TOP 3 D'UNE CARTE

   Chaque île a SON podium : les dégâts infligés sur elle, pas le total
   des joueurs. Ce sont deux classements différents et il ne faut pas
   les confondre — celui qui a le plus gros total du salon n'est pas
   forcément celui qui a pris cette île-là.

   Trois états, et le titre le dit :
     — l'île est en cours : « Top actuel », il bouge encore ;
     — l'île vient de tomber, ou est tombée dans cette campagne :
       « Top 3 final », figé au moment de la chute ;
     — l'île est verrouillée mais a déjà été prise lors d'un cycle
       précédent : « Derniers champions », son podium gelé survit au
       verrouillage.

   La phrase sous le podium est celle de la carte, reprise telle
   quelle : chaque île garde la sienne.
   --------------------------------------------------------------- */
/* LE RANG EN CHIFFRES, ET PLUS EN COUPES.
   Une coupe, deux médailles et un badge sur trois lignes de onze
   pixels : ça faisait deux insignes par ligne pour une seule
   information, et c'est le badge — celui qui dit quelque chose — qui
   y perdait. Un chiffre numérote sans rien prétendre. */
var MEDAILLES = ["1", "2", "3"];
/* LA PHRASE DE FÉLICITATIONS A ÉTÉ RETIRÉE de sous les podiums.
   Elle disait « Félicitations au Top 3 ! Mily vous offre d'aller boire
   un verre » sous chacune des huit vignettes — deux lignes de plus par
   carte, pour un texte qu'on lit une fois et qui ne change jamais. Les
   vignettes y gagnent leur compacité, et la phrase de victoire de
   chaque île continue de vivre là où elle a du poids : à la chute du
   Brasier, une fois, en grand.
   Le champ `victoire` des cartes n'est donc PAS mort — c'est la
   fonction qui le remettait en petit sous un tableau qui l'était. */
function blocTop3(i){
  var fige = (typeof top3Salon === "function") ? top3Salon(i) : null;
  /* La jungle est « en cours » elle aussi, mais elle ne passe jamais
     par carteSalon : c'est un événement, pas une étape de la campagne.
     Sans ce second cas, l'expédition en cours n'avait pas de podium
     vivant alors que c'est exactement le moment où on le regarde. */
  var enCours = (i === carteSalon && !carteSpeciale(i))
             || (carteSpeciale(i) && typeof evenementEnCours === "function"
                 && evenementEnCours(monde, voieDeCarte(i)));
  var liste = fige, titre;
  /* Tant que l'île est en cours, on montre le classement VIVANT de
     cette bataille — il bouge, et c'est ce qu'on vient regarder. */
  if(enCours && typeof scoresAJour === "function"){
    var vif = classementDepuis(totalParJoueurCarte(scoresAJour(), i)).slice(0, 3);
    if(vif.length) liste = vif;
  }
  if(!liste || !liste.length) return blocChampion(i);
  titre = enCours ? "Top actuel"
        : (i < carteSalon || carteSpeciale(i)) ? "Top 3 final"
        : "Derniers champions";
  var h = '<div class="top3" data-t3="' + i + '"><div class="t3t">' + titre + '</div>';
  for(var k = 0; k < liste.length && k < 3; k++){
    h += '<div class="t3l r' + k + '"><span class="m">' + MEDAILLES[k] + '</span>'
       + '<span class="n">' + balliseBadge(liste[k].nom) + nomOrne(liste[k].nom) + '</span>'
       + '<span class="g">' + nombre(liste[k].g) + '</span></div>';
  }
  return h + '</div>';
}
/* Le podium de l'île EN COURS bouge sans arrêt. On le réécrit en place
   plutôt que de reconstruire tout le menu, qui relancerait toutes les
   animations à chaque seconde. */
var top3Bati = {};
function majTop3Vivant(){
  if(enJeu) return;
  var e = document.querySelector('.top3[data-t3="' + carteSalon + '"]');
  if(!e || carteSpeciale(carteSalon)) return;
  var neuf = blocTop3(carteSalon);
  /* ON COMPARE À CE QU'ON A BÂTI, PLUS À CE QUI EST DANS LA PAGE.
     Les badges sont posés APRÈS coup dans les balises vides : le
     outerHTML de la page ne ressemble donc plus jamais à la chaîne qui
     l'a produite, et la comparaison d'origine aurait trouvé une
     différence à chaque seconde — donc réécrit le bloc à chaque
     seconde, et redessiné trois badges pour rien. */
  if(neuf && top3Bati[carteSalon] !== neuf){
    top3Bati[carteSalon] = neuf;
    e.outerHTML = neuf;
    var e2 = document.querySelector('.top3[data-t3="' + carteSalon + '"]');
    poseBadges(e2);
  }
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

/* L'état d'une carte événement, tel que le cahier des charges le
   décrit : cooldown / attente / prête / expédition en cours. Un seul
   endroit décide, et l'affichage n'en est que la lecture.
   Chaque événement a le sien : son verrou, son minimum de joueurs, sa
   expédition. Ils ne se ferment pas l'un l'autre. */
function etatEvt(i){
  var P = voieDeCarte(i);
  if(!P) return "attente";
  /* LE CHANTIER PASSE AVANT TOUT LE RESTE. C'est ce qui ferme les
     trois portes d'un coup : le bouton d'entrée ne s'active que sur
     « prete » ou « encours », donc un état qui n'est ni l'un ni
     l'autre suffit à interdire le lancement ET la reprise, sans qu'on
     ait à l'écrire trois fois. */
  if(carteEnChantier(i)) return "chantier";
  if(evenementEnCours(monde, P)) return "encours";
  if(attenteEvenement(i) > 0) return "cooldown";
  return joueursEnLigne() >= minJoueursEvt(i) ? "prete" : "attente";
}
function etatJungle(){ return etatEvt(IDX_JUNGLE); }

/* LE MENU SE RECONSTRUIT TOUT LE TEMPS, ET C'EST ASSUMÉ.
   majMondes est appelée à chaque instantané reçu qui diffère du
   précédent, et depuis que le score s'additionne il diffère toutes les
   deux secondes dès que quelqu'un joue. Elle réécrit tout le
   innerHTML, donc elle DÉTRUIT les vignettes et ce qui pend dessus.
   C'est ce qui tuait l'appui long de cinq secondes du créateur :
   « le chargement s'arrête avant ». Il fallait alors différer la
   reconstruction le temps du geste.
   Plus besoin : la visite se déclenche au clic, instantané, et son
   écouteur est posé UNE FOIS sur le conteneur — que les vignettes
   soient remplacées ne le concerne pas. */
/* LA GRILLE DES ÎLES, PUIS LES ÉVÉNEMENTS — dans cet ordre, jamais
   mélangés. On parcourait le tableau CARTES de bout en bout ; la
   jungle, qui y porte l'index 5, se plantait donc AU MILIEU de la
   grille, entre la cinquième île et la sixième, et sa vignette pleine
   largeur coupait les huit cartes en deux paquets de quatre et
   quatre… séparés par un bloc vert. Deux passes règlent la question :
   l'ordre de campagne d'abord, ce qui donne deux rangées de quatre
   propres, les cartes événement ensuite, en bas, où elles se
   détachent. */
/* La pastille de blindage d'une île de campagne. Elle emprunte le
   style des deux pastilles des cartes spéciales — même classe, même
   place — parce que c'est le même genre d'information : ce qui rend
   cette île plus dure que ce que le joueur croit savoir. */
/* LA HAUSSE TOTALE DE VIE D'UNE CARTE, en pour cent, les deux facteurs
   multipliés : le bonus d'expédition d'une carte spéciale et le
   blindage réglé à l'accueil. Un seul chiffre, celui qui est vrai —
   jamais deux qu'il faudrait multiplier de tête. */
function hausseTotalePv(i){
  var k = (1 + bonusPvDeCarte(i) / 100) * facteurBlindage(i);
  return Math.round((k - 1) * 100);
}

/* Et la hausse totale de DÉGÂTS, les deux facteurs multipliés eux
   aussi : le bonus gravé d'une carte spéciale et le pourcentage réglé
   à l'accueil. Un seul chiffre, comme pour la vie. */
function hausseTotaleDegats(i){
  var ke = carteSpeciale(i) ? (1 + reglagesEvt(i).degBonus / 100) : 1;
  return Math.round((ke * facteurDegats(i) - 1) * 100);
}

/* ================================================================
   LES PASTILLES DE DURCISSEMENT — COURTES, ET DANS L'IMAGE

   Elles disaient « Défenses +80 % PV » et « +50 % dégâts », en toutes
   lettres, sur une ligne à elles sous la vignette. Deux défauts, et le
   second est le vrai : c'était long, et surtout c'était PLACÉ AILLEURS
   que ce dont ça parle. Une carte plus dure, ça se sait en regardant
   la carte, pas en lisant sous elle.

   « DEF » et « DEG » se reconnaissent à la forme, sans lecture. Le
   préfixe est gardé, en gris et en petit, parce que sans lui « +80 %
   PV » posé sur une île laisserait croire à un bonus POUR le joueur —
   c'est exactement le contraire.

   PAS D'ÉMOJI, ici comme avant : le bouclier ne fait pas partie des
   polices de tous les appareils, et un carré vide à la place ferait
   douter du chiffre qui suit.
   ================================================================ */
function dzPv(b){ return '<span class="dz pv"><em>DEF</em>+' + b + '% PV</span>'; }
function dzDg(d){ return '<span class="dz dg"><em>DEG</em>+' + d + '%</span>'; }

function pastilleBlindage(i){
  var b = hausseTotalePv(i), d = hausseTotaleDegats(i), h = "";
  if(b > 0) h += dzPv(b);
  if(d > 0) h += dzDg(d);
  return h ? '<div class="durci">' + h + '</div>' : "";
}

/* ================================================================
   LA BANDE DU BAS DE L'IMAGE — UNE SEULE RANGÉE POUR LES DEUX

   Les dangers à gauche et les chiffres à droite ont d'abord été deux
   bandes superposées, chacune bornée à trente-huit pour cent de la
   largeur. Ça marchait sur toutes les vignettes qu'on avait sous les
   yeux, et c'est précisément ce qui rendait la chose fausse : le
   partage tenait à un nombre choisi parce qu'il allait ce jour-là. Une
   île qui porterait DEUX dangers ET deux pastilles — les ténèbres, dès
   qu'on les blinde — les aurait vus se chevaucher, et sur la colonne
   étroite d'un téléphone bien avant.

   Une seule rangée, `space-between`, et le partage se fait tout seul :
   chacun prend ce qu'il lui faut, personne n'empiète, et il n'y a plus
   de nombre à surveiller.
   ================================================================ */
function bandeauVignette(i){
  var g = iconesDangers(i), d = pastilleBlindage(i);
  if(!g && !d) return "";
  /* Le vide à gauche est POSÉ, il n'est pas absent : sans lui,
     `space-between` collerait les pastilles au bord gauche quand
     l'île n'a aucun danger. */
  return '<div class="surImage">' + (g || '<i></i>') + d + '</div>';
}

/* ================================================================
   LES DANGERS D'UNE ÎLE, EN ICÔNES, DANS LE COIN DE SON IMAGE

   Le joueur doit savoir ce qui l'attend AVANT d'appuyer. Il le savait
   déjà pour les deux cartes spéciales — une pastille bleue disait
   « ⛈ Orage & foudre » — mais pas pour les huit autres, alors que la
   campagne jette des tornades sur trois d'entre elles et que Mily
   balaie Ibiza au laser.

   TROIS TRACÉS, PAS TROIS ÉMOJIS, et c'est la même raison qu'au-dessus
   poussée un cran plus loin : un émoji d'orage est plat sur un
   appareil, en couleurs sur le suivant et absent sur le troisième. Ces
   trois-là ont la même échelle, la même épaisseur de trait et prennent
   la couleur qu'on leur donne — donc ils forment une FAMILLE, ce que
   trois émojis venus de trois polices ne font jamais.

   CHAQUE DANGER LIT SON PROPRE PRÉDICAT, celui-là même dont le jeu se
   sert pour décider s'il le fait tomber. Aucune liste de biomes n'est
   recopiée ici : le jour où une île gagne des tornades, son icône
   apparaît sans qu'on ait à y penser, et le jour où elle en perd,
   l'icône s'en va toute seule. Une vignette qui annonce un orage qui
   ne tombe plus serait pire que pas d'icône du tout.
   ================================================================ */
/* ── DES ÉMOJIS, ET NON PLUS DES TRACÉS ─────────────────────────────
   Ils ont d'abord été dessinés, pour une raison qui vaut toujours :
   un émoji n'a pas la même tête d'un appareil à l'autre, et ce fichier
   avait déjà tranché ainsi pour la pastille du bouclier. Le joueur a
   tranché dans l'autre sens, et il a un argument que le dessin n'a
   pas : un éclair et une tornade sont des images que TOUT LE MONDE
   connaît déjà, alors qu'un tracé, si juste soit-il, demande une
   seconde de déchiffrage. Sur une vignette qu'on balaie du regard,
   cette seconde compte plus que l'uniformité.

   LE LASER N'A PAS D'ÉMOJI, et c'est le seul des trois où le choix se
   discute : Unicode a l'éclair, la tornade, la pluie, le volcan — pas
   le rayon. Dix candidats ont été rendus À VINGT-CINQ PIXELS, la seule
   taille qui compte, et la plupart meurent là : la boule à facettes et
   le feu d'artifice deviennent des taches bleues, la lampe torche une
   tache turquoise hors palette, l'arc-en-ciel et la flamme disent
   autre chose.
   🎇 tient pour trois raisons : c'est un RAYONNEMENT ISSU D'UN POINT,
   ce qui est la forme même d'une source laser ; il reste lisible à
   vingt-cinq pixels ; et il est orange, donc dans la palette du jeu
   plutôt qu'à côté.

   Le sélecteur de variante ️ (U+FE0F) sur la tornade n'est pas
   décoratif : sans lui, certains navigateurs rendent U+1F32A en
   noir et blanc, comme un caractère de texte. */
var EMOJI_DANGER = {
  orage:"⚡",
  tornade:"🌪️",
  laser:"🎇"
};
/* L'ordre est celui de la liste : il est le même sur toutes les
   vignettes, donc l'œil retrouve la même icône à la même place. */
var DANGERS_CARTE = [
  { cle:"orage",   titre:"Orage et foudre", test:function(i){ return carteFoudre(i); } },
  { cle:"tornade", titre:"Tornades",        test:function(i){ return carteAvecTornades(i); } },
  { cle:"laser",   titre:"Le balayage laser de Mily", test:function(i){ return carteScene(i); } }
];
function iconesDangers(i){
  var h = "", k, D;
  for(k = 0; k < DANGERS_CARTE.length; k++){
    D = DANGERS_CARTE[k];
    if(!D.test(i)) continue;
    h += '<span class="dg1 ' + D.cle + '" title="' + D.titre + '">'
       + EMOJI_DANGER[D.cle] + '</span>';
  }
  return h ? '<div class="dangers">' + h + '</div>' : "";
}

function majMondes(){
  var h = "", rang, i;
  for(rang = 0; rang < ORDRE_CAMPAGNE.length; rang++){
    i = ORDRE_CAMPAGNE[rang];
    var etat = i < carteSalon ? "tombée" : (i === carteSalon ? "en cours" : "verrouillée");
    var cl = i < carteSalon ? "faite" : (i === carteSalon ? "actif" : "verrou");
    h += '<div class="monde ' + cl + '" data-carte="' + i + '">'
       + '<canvas width="360" height="148" id="mn' + i + '"></canvas>'
       + '<div class="etat">' + etat + '</div>'
       + '<div class="nom">' + CARTES[i].nom + '<br><span style="font-size:11px;color:#a99cb4">QG '
       + nombre(pvQGDeCarte(i)) + ' PV</span></div>'
       /* LE BLINDAGE SE VOIT, ET SEULEMENT S'IL EXISTE. Une pastille
          de plus sur les huit vignettes quand il vaut zéro partout
          serait du bruit ; quand il ne vaut pas zéro, c'est la seule
          chose qui distingue cette île de celle qu'on connaissait. */
       /* Ce qui rend cette île plus dure, et ce qui lui tombe du ciel
          — dans les deux coins du bas de son image. Les huit cartes de
          campagne ne disaient rien de leurs dangers jusqu'ici, alors
          que trois d'entre elles portent des tornades : on partait
          dessus sans le savoir. */
       + bandeauVignette(i)
       + blocTop3(i)
       /* L'ŒIL SUR LES ÎLES TOMBÉES AUSSI, ET PLUS SEULEMENT SUR CELLES
          QU'ON N'A PAS ENCORE ATTEINTES.

          C'était `i > carteSalon` : on pouvait regarder devant, jamais
          derrière. Or une île tombée est justement celle que les
          nouveaux venus n'ont jamais vue — la guinguette et ses
          festons, les tornades des ténèbres, la pluie d'étoiles des
          nuits. Elles étaient devenues invisibles à ceux qui arrivent,
          et le seront de plus en plus à mesure que la campagne avance.

          Rien à protéger de ce côté-là : la visite est déjà scellée.
          `modeApercu` est levé AVANT lancePartie, donc rien ne sort —
          ni message d'état, ni instantané, ni dégât rangé — et
          appliqueMondeAuJeu sort en tête sur ce drapeau, donc rien
          n'est LU non plus : l'île se montre intacte, telle que le
          générateur la fait, et non amputée des défenses déjà
          détruites. C'est exactement ce qu'on veut voir d'une carte
          finie : à quoi elle ressemblait, pas ce qu'il en reste.

          Seule la carte EN COURS n'a pas d'œil, et pour une raison qui
          n'a pas changé : on y débarque, c'est mieux qu'une visite. */
       + (i !== carteSalon ? boutonVisite(i) : "") + '</div>';
  }
  /* les cartes événement, après la grille et non dedans */
  for(i = 0; i < CARTES.length; i++)
    if(carteSpeciale(i)) h += vignetteEvenement(i);
  $("mondes").innerHTML = h;
  /* Les vignettes viennent d'être refaites : les badges de leurs
     podiums avec, et la mémoire du podium vivant repart à vide —
     sinon majTop3Vivant croirait n'avoir rien à réécrire dans un bloc
     qui, lui, a été remplacé. */
  top3Bati = {};
  poseBadges($("mondes"));
  /* LA FORTERESSE DES VIGNETTES EST CELLE DU BRASIER, TOUJOURS.
     dessineApercu peint la silhouette du QG dans chaque vignette
     d'île, et il peint le sprite QUI SE TROUVE EN MÉMOIRE. Depuis
     qu'il y en a deux, ce détail est devenu un défaut : on visite les
     Mily et une nuits, le palais est bâti, on revient à l'accueil —
     et les huit îles ordinaires s'affichent avec un palais bleu et or
     à la place de leur citadelle. Mesuré à l'écran, les huit d'un
     coup.
     On redemande donc la bonne forteresse avant de peindre. Hors
     partie, `jeu` est nul et styleQGdeCarte rend « brasier » : la
     reconstruction n'a lieu qu'au retour des nuits, et elle ne coûte
     rien les autres fois — une comparaison de chaînes. */
  if(typeof assureSpriteQG === "function") assureSpriteQG();
  for(var k = 0; k < CARTES.length; k++) dessineApercu(k);
  installeBoutonJungle();
  installeAppuisCartes();
}

/* ================================================================
   LA VISITE — TOUT LE MONDE PEUT VOIR TOUTES LES ÎLES

   Elle était réservée : cinq secondes de doigt posé sur la vignette,
   puis un mot de passe. C'était le bon réglage tant que la visite
   POLLUAIT — les dégâts d'essai partaient dans le cumul local, puis
   dans le classement public, et une île verrouillée visitée gonflait
   son Top 3 pour tout le salon. Ce robinet-là est fermé depuis
   (repliMesDegats sort si modeApercu), et rien de ce qui se passe
   pendant une visite ne quitte l'appareil : ni message d'état, ni
   instantané, ni dégât rangé.

   Elle peut donc s'ouvrir, et elle s'ouvre avec un BOUTON. Un appui
   long de cinq secondes est un geste qu'on ne trouve pas ; ce qui est
   permis à tout le monde doit se voir. Le mot de passe disparaît avec
   lui : il ne gardait plus rien.
   ================================================================ */
function boutonVisite(i){
  return '<button class="visite" data-visite="' + i + '">👁 Visiter</button>';
}
/* Une visite REMPLACE la partie en mémoire : lancePartie rebâtit la
   carte, et la bataille en cours ne survit pas. Tant qu'elle n'a rien
   coûté — pas une troupe débarquée, pas un dégât — on n'embête
   personne ; dès qu'elle a commencé, on demande. */
function visitePerdraitLaPartie(){
  if(!jeu || jeu.fin) return false;
  return (jeu.unites && jeu.unites.length > 0) || (jeu.degatsMoi | 0) > 0;
}
function demandeVisite(i){
  if(visitePerdraitLaPartie()
     && !confirm("Visiter « " + CARTES[i].nom + " » ?\n\n"
               + "Ta bataille en cours sur « " + CARTES[jeu.index].nom + " » sera\n"
               + "abandonnée : les troupes déjà débarquées seront perdues.\n\n"
               + "Les dégâts que tu as déjà infligés, eux, sont gardés.")) return;
  ouvreApercuAdmin(i);
}

/* Un seul écouteur sur le conteneur, jamais un par vignette : le menu
   se reconstruit toutes les deux secondes dès que quelqu'un joue, et
   des écouteurs posés sur les vignettes partiraient avec elles. */
function installeAppuisCartes(){
  var m = $("mondes");
  if(!m || m._visiteArmee) return;
  m._visiteArmee = 1;
  m.addEventListener("click", function(ev){
    var b = ev.target.closest ? ev.target.closest("[data-visite]") : null;
    if(!b) return;
    ev.preventDefault();
    ev.stopPropagation();
    demandeVisite(+b.getAttribute("data-visite"));
  });
}

/* L'APPUI LONG DES CARTES EN CHANTIER a été retiré avec le verrou
   qu'il gardait : cinq secondes de doigt posé, une bande de
   progression, un mot de passe, et tout cela pour ouvrir une visite
   que n'importe qui peut désormais ouvrir d'un bouton. Un geste
   qu'on ne trouve pas, devant une porte qui n'est plus fermée, ce
   n'est pas de la sécurité — c'est du décor. Voir vignetteEvenement.
   ---------------------------------------------------------------- */

/* La vignette de la carte événement. Elle porte quatre informations
   sans devenir un tableau de bord : ce qu'elle est, combien on est,
   ce qui manque, et qui l'a détruite la dernière fois. */
/* CE QUE CHAQUE ÉVÉNEMENT DIT DE LUI-MÊME. La vignette parlait de « LA
   JUNGLE » en toutes lettres, dans son bandeau, dans ses phrases et
   sur son bouton. Chaque carte porte donc maintenant ses mots — c'est
   la seule façon d'en avoir deux sans que la seconde parle de la
   première. */
/* Plus d'entrée `ambiance` : elle portait « ⛈ Orage & foudre » et
   « ✨ Nuit enchantée », que l'icône de danger dessine désormais dans
   le coin de l'image. Une donnée qu'on garde « au cas où » est une
   donnée que personne ne met plus à jour. */
var MOTS_EVT = {
  j:{ ecusson:"🌿", prete:"LA JUNGLE EST PRÊTE.", entrer:"ENTRER DANS LA JUNGLE",
      repos:"LA JUNGLE SE REPOSE" },
  n:{ ecusson:"🌙", prete:"LA NUIT EST OUVERTE.", entrer:"ENTRER DANS LA NUIT",
      repos:"LA NUIT SE REFERME" }
};
/* Le peintre de la grande vignette, par voie. */
var PEINTRES_EVT = { j:"dessineVignetteJungle", n:"dessineVignetteNuits" };
function motsEvt(i){
  var m = MOTS_EVT[voieDeCarte(i)] || {};
  var nom = (CARTES[i] && CARTES[i].nom) || "";
  return {
    ecusson : m.ecusson || "✦",
    prete   : m.prete   || (nom.toUpperCase() + " EST PRÊTE."),
    entrer  : m.entrer  || ("ENTRER — " + nom.toUpperCase()),
    repos   : m.repos   || "LA CARTE SE REPOSE"
  };
}
function vignetteEvenement(i){
  var e = etatEvt(i), M = motsEvt(i), R = reglagesEvt(i);
  var n = joueursEnLigne(), mini = minJoueursEvt(i);
  var msg, etiq;
  if(e === "chantier"){
    etiq = "bientôt disponible";
    msg = "Cette carte est <b>en travaux</b>. Elle ouvrira bientôt.";
  }else if(e === "encours"){
    etiq = "expédition en cours";
    msg = "Une expédition est partie. Rejoins-la !";
  }else if(e === "cooldown"){
    etiq = "verrouillée";
    msg = "Disponible dans <b>" + texteAttente(attenteEvenement(i)) + "</b>";
  }else if(e === "prete"){
    etiq = "prête";
    msg = "<b>" + M.prete + "</b> Il ne manque plus qu'à entrer.";
  }else{
    etiq = "en attente";
    var manque = mini - n;
    msg = "En attente de <b>" + manque + "</b> joueur" + (manque > 1 ? "s" : "") + ".";
  }
  var chantier = (e === "chantier");
  var frac = chantier ? 0 : Math.min(1, n / Math.max(1, mini));
  var bouton = e === "prete" ? M.entrer
             : e === "encours" ? "REJOINDRE L'EXPÉDITION"
             : e === "cooldown" ? M.repos
             : chantier ? "BIENTÔT DISPONIBLE"
             : "EN ATTENTE DE JOUEURS";
  var actif = (e === "prete" || e === "encours");
  return '<div class="monde evt ev' + voieDeCarte(i) + ' ' + e + '" id="mondeEvt' + i + '" data-evt="' + i + '">'
       + '<canvas width="720" height="300" id="mn' + i + '"></canvas>'
       + '<div class="bandeau">' + M.ecusson + ' Carte spéciale</div>'
       + '<div class="etat">' + etiq + '</div>'
       + '<div class="nom">' + CARTES[i].nom
       + '<br><span style="font-size:11px;color:#a99cb4">QG '
       + nombre(pvQGDeCarte(i)) + ' PV — événement multijoueur</span></div>'
       /* Le joueur doit savoir CE QUI L'ATTEND avant d'appuyer, et le
          savoir en une seconde. Deux pastilles, deux chiffres, pas une
          phrase : ce sont les seuls réglages qui rendent cette carte
          plus dure que celles de la campagne.
          UNE SEULE PASTILLE DE VIE, ET C'EST LE TOTAL. Il y en avait
          deux — le bonus d'expédition et le blindage réglé à l'accueil
          — et c'était exactement ce que la demande interdit : « on ne
          voit pas trois mille plus trois mille, on verra six mille ».
          On multiplie les deux facteurs et l'on affiche le résultat.
          LA TROISIÈME PASTILLE A DISPARU : elle écrivait « ⛈ Orage &
          foudre », c'est-à-dire exactement ce que l'icône de danger
          dessine maintenant dans l'autre coin de la même image. Deux
          fois la même chose sur une vignette, c'est une de trop. */
       + '<div class="surImage">' + iconesDangers(i)
       +   '<div class="durci">' + dzPv(hausseTotalePv(i)) + dzDg(hausseTotaleDegats(i)) + '</div>'
       + '</div>'
       + '<div class="jauge">'
       +   '<span class="cpt">' + n + '<small>/' + mini + '</small></span>'
       +   '<span class="msg">' + msg + '</span>'
       +   '<span class="barreJ"><i style="width:' + (frac * 100).toFixed(0) + '%"></i></span>'
       + '</div>'
       + '<button class="btEvt" data-entrer="' + i + '"' + (actif ? "" : " disabled") + '>'
       + bouton + '</button>'
       /* Une carte événement se visite comme les autres, et surtout
          QUAND ELLE EST FERMÉE : c'est justement le moment où l'on
          aimerait voir à quoi elle ressemble. Le bouton d'entrée, lui,
          reste conditionné au nombre de joueurs — visiter n'est pas
          jouer.
          Y COMPRIS EN CHANTIER, et c'est le seul changement.
          La carte en travaux avait, à la place du bouton, une bande
          d'appui long de cinq secondes suivie du mot de passe du
          salon. Ce verrou-là gardait quelque chose tant que la visite
          POLLUAIT ; elle ne pollue plus rien depuis longtemps — rien
          de ce qui se passe pendant une visite ne quitte l'appareil,
          ni message d'état, ni instantané, ni dégât rangé. Il ne
          gardait donc plus qu'une porte ouverte de l'autre côté, et
          c'est exactement le raisonnement qui avait déjà fait tomber
          l'appui long des cartes ordinaires (voir boutonVisite).
          LES DEUX AUTRES PORTES NE BOUGENT PAS. Le bouton d'entrée
          reste désarmé — `actif` ne s'arme que sur « prete » ou
          « encours » — donc on ne lance ni ne rejoint rien sur une
          carte en travaux. On la REGARDE, c'est tout. */
       + boutonVisite(i)
       + blocTop3(i) + '</div>';
}

/* Le menu ne se reconstruit pas à chaque image — mais le compte à
   rebours doit vraiment descendre, et le nombre de joueurs vraiment
   suivre les arrivées. On rafraîchit donc la seule vignette
   événement, une fois par seconde, tant que le briefing est ouvert. */
var evtT = 0, evtEtat = "";
function majJungleLent(dt){
  if(enJeu) return;
  evtT -= dt;
  if(evtT > 0) return;
  evtT = 1.0;
  /* L'ÉTAT DE TOUTES LES CARTES ÉVÉNEMENT EN UNE CHAÎNE. Il n'y en
     avait qu'une, donc une chaîne suffisait ; il en faut une par carte,
     et les comparer une à une reconstruirait le menu deux fois. On les
     concatène : n'importe quel changement, sur n'importe quelle carte,
     donne une chaîne différente et déclenche UNE reconstruction. */
  var etats = [], k, V, el;
  for(k = 0; k < VOIES_EVT.length; k++) etats.push(etatEvt(VOIES_EVT[k].i));
  var sig = etats.join("|");
  if(sig !== evtEtat){ evtEtat = sig; if($("mondes")) majMondes(); return; }
  /* Sinon on ne réécrit que les nombres qui bougent, pour ne pas
     casser une animation en cours. */
  for(k = 0; k < VOIES_EVT.length; k++){
    V = VOIES_EVT[k];
    el = $("mondeEvt" + V.i);
    if(!el) continue;
    var e = etats[k];
    var cpt = el.querySelector(".cpt"), msg = el.querySelector(".msg");
    var n = joueursEnLigne(), mini = minJoueursEvt(V.i);
    if(cpt) cpt.innerHTML = n + '<small>/' + mini + '</small>';
    if(msg && e === "cooldown")
      msg.innerHTML = "Disponible dans <b>" + texteAttente(attenteEvenement(V.i)) + "</b>";
    if(msg && e === "attente"){
      var manque = mini - n;
      msg.innerHTML = "En attente de <b>" + manque + "</b> joueur" + (manque > 1 ? "s" : "") + ".";
    }
    /* LA JAUGE RESTE VIDE EN CHANTIER, comme à la construction de la
       vignette. Ce rafraîchissement-là l'ignorait : une seconde après
       l'ouverture du menu, la carte en travaux affichait « 1 joueur
       sur 7 » sous un compteur masqué et un bouton désarmé. Trois
       signaux, dont un qui disait le contraire des deux autres. */
    var barre = el.querySelector(".barreJ i");
    if(barre) barre.style.width =
      (e === "chantier" ? 0 : Math.min(1, n / Math.max(1, mini)) * 100).toFixed(0) + "%";
  }
}

/* Le podium de l'île en cours, une fois par seconde. Même raison que
   le compte à rebours de la jungle : ça bouge, et reconstruire tout le
   menu pour ça relancerait toutes les animations. */
var t3T = 0;
function majTop3Lent(dt){
  if(enJeu) return;
  t3T -= dt;
  if(t3T > 0) return;
  t3T = 1.0;
  majTop3Vivant();
}

/* UN SEUL ÉCOUTEUR, POSÉ SUR LE CONTENEUR. Il y en avait un par
   vignette, reposé à chaque reconstruction du menu — c'est-à-dire
   toutes les deux secondes dès que quelqu'un joue. Avec deux cartes
   événement, cela ferait deux écouteurs à replacer au bon moment, et
   la moindre reconstruction manquée laisserait un bouton mort. La
   délégation règle la question une fois pour toutes : le conteneur, lui,
   ne bouge jamais. */
function installeBoutonJungle(){
  var m = $("mondes");
  if(!m || m._evtArme) return;
  m._evtArme = 1;
  m.addEventListener("click", function(ev){
    var b = ev.target.closest ? ev.target.closest("[data-entrer]") : null;
    if(!b || b.disabled) return;
    ev.preventDefault();
    ev.stopPropagation();
    var i = +b.getAttribute("data-entrer");
    if(!pseudoSaisi()) return signalePseudoManquant();
    var e = etatEvt(i);
    if(e !== "prete" && e !== "encours") return;
    monNom = pseudoSaisi();
    if(e === "prete") lanceExpedition(i);
    entreDansEvenement(i);
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
  /* CHAQUE CARTE ÉVÉNEMENT A SON TABLEAU. Il y avait un seul peintre,
     celui de la jungle, appelé pour toute carte spéciale : la seconde
     aurait affiché un orage tropical pour annoncer une nuit
     orientale. Le peintre se choisit donc sur la VOIE, et une carte
     sans peintre retombe sur l'aperçu ordinaire plutôt que sur un
     carré vide. */
  if(carteSpeciale(i)){
    var peintre = PEINTRES_EVT[voieDeCarte(i)];
    if(peintre && typeof window[peintre] === "function"){
      window[peintre](c, el.width, el.height, tempsGlobal, etatEvt(i));
      return;
    }
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
  /* la langue de sable. Elle vient de la palette de l'île et non d'un
     beige écrit en dur : sur les ténèbres, une plage dorée au bord
     d'une mer de lave n'avait aucun sens. */
  c.fillStyle = b.sable;
  c.beginPath(); c.ellipse(w * 0.78, h * 0.80, w * 0.14, h * 0.20, 0, 0, 6.2832); c.fill();
  /* décor */
  var al = prng(graineCarte(CODE_SALON, i));
  for(var k = 0; k < 22; k++){
    var x = w * 0.16 + al() * w * 0.62, y = h * 0.60 + al() * h * 0.30;
    c.save(); c.translate(x, y); c.scale(0.42, 0.42);
    /* La vignette doit se reconnaître à la silhouette autant qu'à la
       palette : en 360×148, c'est la forme du décor qui dit l'île. */
    var bio = CARTES[i].biome;
    if(bio === "plage") palmier(c, 0, 0, 1);
    else if(bio === "foret") sapin(c, 0, 0, 1);
    else if(bio === "hippie") (k % 3 === 0 ? guirlande : tipi)(c, 0, 0, 1);
    else if(bio === "sud") (k % 3 === 0 ? olivier : cypres)(c, 0, 0, 1);
    else if(bio === "guinguette")
      (k % 3 === 0 ? guirlandeGuinguette : k % 3 === 1 ? lampadaireGuinguette
                                                      : tableGuinguette)(c, 0, 0, 1);
    else if(bio === "tenebres")
      (k % 3 === 0 ? vasqueTenebres : k % 3 === 1 ? aiguilleTenebres
                                                  : arbreCalcineTenebres)(c, 0, 0, 1);
    else if(bio === "ibiza")
      (k % 3 === 0 ? parasolIbiza : k % 3 === 1 ? palmierIbiza
                                                : transatIbiza)(c, 0, 0, 1);
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
/* Déplié ou non, sur la carte du Salon. Le choix tient jusqu'à ce que
   le joueur en décide autrement. */
var quiSalonDeplie = false;
function majQuiSalon(){
  var e = $("quiSalon");
  if(!e) return;
  var q = nomsEnLigne();
  if(reseau.etat !== "ok" || !q.total){ e.innerHTML = ""; return; }
  var h = '<button class="quiBt" data-quisalon>'
        + (quiSalonDeplie ? "▾" : "▸") + " qui est là ?</button>";
  if(quiSalonDeplie){
    h += '<div class="quiLa">' + ligneEnLigne(monNom || "toi", 0, 1);
    for(var i = 0; i < q.montres.length; i++)
      h += ligneEnLigne(q.montres[i].nom, q.montres[i].n, 0);
    if(q.reste) h += '<div class="ql autres"><span class="p"></span><span class="n">et '
                   + q.reste + " autre" + (q.reste > 1 ? "s" : "") + "…</span></div>";
    h += "</div>";
  }
  e.innerHTML = h;
}
/* ================================================================
   LE TOP CARRIÈRE, ET SA PAGE

   Cinq lignes sur l'accueil, tout le reste derrière un bouton. Le
   partage n'est pas décoratif : à vingt joueurs, une liste qui
   s'allonge sous l'accueil pousserait le bouton DÉBARQUER sous
   l'horizon, et c'est lui qu'on vient chercher. Cinq suffisent à
   savoir où l'on en est ; « Voir tout » est pour la curiosité, et la
   curiosité peut bien changer de page.

   Les deux listes sont peintes par la MÊME fonction : elles doivent
   se ressembler, sans quoi on croirait lire deux classements.
   ================================================================ */
var CARRIERE_APERCU = 5;
/* UNE LIGNE DE CLASSEMENT : le rang, le badge, le pseudo, le score.

   TROIS CHOSES ONT DISPARU D'ICI, ET C'EST LE MÊME MOTIF.
   Les COUPES d'abord : trois emojis de médaille alignés au-dessus
   d'un badge, ça faisait deux insignes par ligne pour une seule
   information, et le badge — celui qui dit vraiment quelque chose —
   se retrouvait noyé. Un chiffre ne prétend à rien, il numérote.
   La PRISE ⏻ ensuite : elle marquait le joueur déconnecté, entre le
   pseudo et le badge, à l'endroit exact où l'œil cherche l'insigne.
   L'information n'est pas perdue pour autant — la classe `parti`
   éteint la ligne, et c'est bien assez pour un fait dont on ne fait
   rien.
   ET LE BADGE PASSE À GAUCHE, avant le pseudo : à droite d'un nom de
   longueur variable, il flottait à une place différente à chaque
   ligne ; contre la marge, tous s'alignent. */
function ligneClassement(o, rang){
  return '<div class="clR' + (o.moi ? " moi" : "") + (o.absent ? " parti" : "")
       + (rang < 3 ? " pod" : "") + '">'
       + '<span class="rg">' + (rang + 1) + '</span>'
       + '<span class="nm">' + balliseBadge(o.nom) + nomOrne(o.nom) + '</span>'
       + '<span class="vl">' + nombre(o.g) + '</span></div>';
}
function majCarriere(){
  var e = $("carriereListe");
  if(!e) return;
  var l = classementSalon();
  var h = "", i;
  for(i = 0; i < Math.min(CARRIERE_APERCU, l.length); i++) h += ligneClassement(l[i], i);
  e.innerHTML = h;
  poseBadges(e);
  var c = $("carriereCompte");
  if(c) c.textContent = l.length
      ? (l.length + " joueur" + (l.length > 1 ? "s" : "") + " au classement")
      : "";
  var b = $("btCarriere");
  /* le bouton ne sert à rien tant que tout tient dans l'aperçu */
  if(b) b.style.display = l.length > CARRIERE_APERCU ? "" : "none";
  majPalmares();
}

/* ================================================================
   LE PALMARÈS DES CAMPAGNES

   « À la fin de la campagne, est-ce qu'il y a un tableau récapitulatif
   du top trois ? On pourrait mettre campagne 1, puis les trois
   premiers, pour avoir un historique. »

   LE PLUS RÉCENT EN HAUT, et sans bouton « voir tout » : le palmarès
   n'est pas un classement qu'on consulte, c'est une frise qu'on
   parcourt. Quatre campagnes tiennent dans la colonne ; au-delà on la
   fait défiler comme le reste de la page, ce qui est le geste juste
   pour une histoire.

   LA CAMPAGNE EST NUMÉROTÉE À PARTIR DE UN à l'écran, alors qu'elle
   part de zéro dans l'instantané. Ce n'est pas une coquetterie :
   personne n'appelle son premier tour du monde « la campagne zéro », et
   le numéro interne n'a aucune raison de sortir du code.
   ================================================================ */
var PALMARES_APERCU = 6;
function majPalmares(){
  var boite = $("palmaresBoite"), liste = $("palmaresListe");
  if(!boite || !liste) return;
  var l = (monde && typeof palmaresListe === "function")
          ? palmaresListe(monde.hc) : [];
  /* PAS DE CADRE VIDE : une première campagne n'a pas de passé, et un
     bloc qui attend est une promesse qu'on ne tient pas encore. */
  if(!l.length){ boite.style.display = "none"; liste.innerHTML = ""; return; }
  boite.style.display = "";
  var RANGS = ["or", "ar", "br"], MED = ["🥇", "🥈", "🥉"];
  var h = "", i, k;
  for(i = 0; i < l.length && i < PALMARES_APERCU; i++){
    var e = l[i];
    h += '<div class="palC"><div class="palT">Campagne ' + (e.cy + 1) + '</div>';
    if(!e.l.length){
      /* Une campagne bouclée sans classement lisible est quand même
         inscrite — elle a eu lieu. On le dit plutôt que de la cacher. */
      h += '<div class="palL"><span class="r">·</span>'
         + '<span class="n" style="color:#8f86a0">personne au classement</span>'
         + '<span class="v"></span></div>';
    }
    for(k = 0; k < e.l.length; k++){
      h += '<div class="palL ' + RANGS[k] + '">'
         + '<span class="r">' + MED[k] + '</span>'
         + '<span class="n">' + nomOrne(e.l[k].nom) + '</span>'
         + '<span class="v">' + nombre(e.l[k].g) + '</span></div>';
    }
    h += '</div>';
  }
  liste.innerHTML = h;
}
/* ================================================================
   LA PAGE DES PASSAGES — QUI EST VENU, ET QUAND

   Elle ne mesure AUCUNE durée, et c'était le choix : un passage se
   note en une ligne au moment où il arrive, là où mesurer un temps
   demanderait de surveiller quelqu'un en continu. Ce qu'elle sait
   dire — et qui répond à la vraie question — c'est si le passage a
   donné lieu à une bataille ou seulement à un coup d'œil.

   UNE LIGNE PAR APPAREIL, pas par pseudo. C'est l'appareil qui tient
   le journal ; deux personnes qui se renomment ne doivent pas se
   confondre, et une même personne sur deux appareils reste deux
   lignes — ce qui est la vérité de ce qu'on peut savoir.

   L'ABONNEMENT SE FAIT ICI, À L'OUVERTURE. Les journaux des autres
   appareils n'arrivent qu'à ce moment-là : un joueur ordinaire ne
   télécharge jamais rien de tout ça.
   ================================================================ */
var pageVusOuverte = 0;

/* « il y a deux jours », « hier », « aujourd'hui à 22 h 05 ». Une date
   brute demande un calcul de tête ; on veut lire, pas calculer. */
function ditQuand(jour, heure, aujourdhui){
  var d = ecartJours(aujourdhui, jour);
  var hh = Math.floor(heure / 100), mm = heure % 100;
  var h = hh + " h " + (mm < 10 ? "0" : "") + mm;
  if(d <= 0) return "aujourd'hui à " + h;
  if(d === 1) return "hier à " + h;
  if(d < 7) return "il y a " + d + " jours, à " + h;
  var D = jourEnDate(jour);
  var MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
              "août", "septembre", "octobre", "novembre", "décembre"];
  return "le " + D.getDate() + " " + MOIS[D.getMonth()]
       + (ecartJours(aujourdhui, jour) > 300 ? " " + D.getFullYear() : "")
       + " à " + h;
}

/* Les trente derniers jours en trente barres. La part claire compte
   les parties jouées, la part sombre les simples coups d'œil. */
function barresDesJours(parJour, aujourdhui){
  var h = "", i, max = 1, jours = [], d;
  for(i = 29; i >= 0; i--){
    d = new Date(jourEnDate(aujourdhui).getTime() - i * 86400000);
    var k = jourDe(d), c = parJour[k] || { n:0, joue:0 };
    jours.push({ k:k, n:c.n, joue:c.joue, d:d });
    if(c.n > max) max = c.n;
  }
  for(i = 0; i < jours.length; i++){
    var J = jours[i];
    var hj = Math.round(J.joue / max * 100);
    var hv = Math.round((J.n - J.joue) / max * 100);
    h += '<span class="vj' + (J.n ? "" : " vide") + '" title="'
       + J.d.getDate() + "/" + (J.d.getMonth() + 1) + " — " + J.n + " passage"
       + (J.n > 1 ? "s" : "") + ", " + J.joue + ' joué' + (J.joue > 1 ? "s" : "") + '">'
       + '<i style="height:' + Math.max(J.n && !J.joue ? 3 : 0, hv) + '%"></i>'
       + '<b style="height:' + Math.max(J.joue ? 3 : 0, hj) + '%"></b>'
       + '</span>';
  }
  return h;
}

function majPageVus(){
  if(!pageVusOuverte) return;
  var aujourdhui = jourDe(new Date());
  /* LES COMPTES RETIRÉS SORTENT AVANT LE COMPTAGE. « J'ai mon compte
     et mon développeur qui visitent beaucoup, ça fausse toutes les
     statistiques » : les écarter à l'affichage seulement aurait laissé
     leurs passages dans les barres et dans les totaux, c'est-à-dire
     dans tout ce qui fausse. */
  var exclus = (typeof nomsMasques === "function") ? nomsMasques() : null;
  var S = statsJournaux(tousLesJournaux(), aujourdhui, exclus);
  var e = $("vusListe"), b = $("vusJours"), sous = $("vusSous");
  if(!e) return;
  b.innerHTML = barresDesJours(S.parJour, aujourdhui);

  var h = "", i, totV = 0, totJ = 0;
  for(i = 0; i < S.lignes.length; i++){
    var L = S.lignes[i];
    totV += L.visites; totJ += L.jouees;
    /* l'île la plus fréquentée par cet appareil, s'il en a une */
    var meilleure = -1, mieux = 0, k;
    for(k in L.iles) if(L.iles[k] > mieux){ mieux = L.iles[k]; meilleure = k | 0; }
    h += '<div class="vusL">'
       + '<div class="vn">' + nomOrne(L.nom)
       /* LE RETRAIT SE FAIT D'ICI, sur la ligne du fautif : c'est là
          qu'on le voit fausser la page, et un aller-retour par
          l'éditeur de badge pour taper un nom qu'on a sous les yeux
          serait une corvée. Le réglage, lui, est le MÊME que celui de
          l'éditeur — une seule vérité, deux portes. */
       + ' <button class="vx" data-masque="' + echappe(L.nom)
       + '" title="Retirer ce compte des statistiques">✕</button></div>'
       + '<div class="vq">' + L.visites + " passage" + (L.visites > 1 ? "s" : "")
       +   '</div>'
       + '<div class="vd">' + ditQuand(L.dernier, L.derniereHeure, aujourdhui)
       +   ' · <b class="vp">' + L.jouees + '</b> joué' + (L.jouees > 1 ? "s" : "")
       +   ' · <b class="vr">' + L.regardees + '</b> vu' + (L.regardees > 1 ? "s" : "")
       +   " sans jouer"
       +   (L.j7 ? " · <b>" + L.j7 + "</b> cette semaine" : "")
       +   (meilleure >= 0 && CARTES[meilleure]
             ? " · surtout " + echappe(CARTES[meilleure].nom) : "")
       +   '</div>'
       + '</div>';
  }
  /* et de quoi les faire revenir : un retrait qu'on ne peut pas
     annuler n'est pas un réglage, c'est un piège */
  if(S.ecartes) h += '<div class="vusEcartes">' + S.ecartes + " compte"
    + (S.ecartes > 1 ? "s retirés" : " retiré") + " des statistiques."
    + ' <button class="vx" id="vusRendre">Tout remettre</button></div>';
  e.innerHTML = h || '<div id="vusVide">Aucun journal reçu pour l\'instant.<br><br>'
    + "Chaque appareil publie le sien quand il se connecte au relais. "
    + "Les passages commencent à être notés à partir de cette version — "
    + "rien ne peut être reconstitué d'avant. Reviens quand quelqu'un "
    + "aura ouvert le jeu.</div>";
  if(sous)
    sous.innerHTML = S.lignes.length
      ? ("<b>" + S.lignes.length + "</b> appareil" + (S.lignes.length > 1 ? "s" : "")
         + " · <b>" + totV + "</b> passage" + (totV > 1 ? "s" : "")
         + ", dont <b>" + totJ + "</b> avec une bataille. "
         + "Aucune durée n'est mesurée.")
      : "Chargement des journaux…";
}

function ouvreVus(){
  var p = $("vusP");
  if(!p) return;
  pageVusOuverte = 1;
  /* c'est ici, et seulement ici, qu'on demande les journaux des autres
     appareils : le courtier sert alors tous ses messages retenus */
  if(typeof abonneAuxJournaux === "function") abonneAuxJournaux();
  majPageVus();
  p.classList.add("on");
}
function fermeVus(){
  pageVusOuverte = 0;
  var p = $("vusP");
  if(p) p.classList.remove("on");
}
function installeVus(){
  var b = $("btAdminVus"), f = $("btVusFerme"), p = $("vusP");
  if(b) b.addEventListener("click", function(){ fermeAdminP(); ouvreVus(); });
  if(f) f.addEventListener("click", fermeVus);
  /* La liste est réécrite en entier à chaque rafraîchissement :
     l'écouteur va sur le CONTENEUR, une fois pour toutes, comme pour
     les deux replis du panneau du haut-gauche. */
  var l = $("vusListe");
  if(l) l.addEventListener("click", function(ev){
    if(!ev.target.closest) return;
    var x = ev.target.closest("[data-masque]");
    if(x){
      var n = x.getAttribute("data-masque");
      if(confirm("Retirer « " + n + " » des statistiques de passage ?\n\n"
               + "Ses passages ne compteront plus, ni dans la liste, ni dans\n"
               + "les barres, ni dans les totaux. Son journal n'est pas effacé,\n"
               + "et le retrait s'annule d'un bouton."))
        if(poseDrapeauBadge(n, "masque", 1)) majPageVus();
      return;
    }
    if(ev.target.closest("#vusRendre")){ if(rendLesMasques()) majPageVus(); }
  });
  /* le fond ferme aussi, comme partout ailleurs dans ce jeu */
  if(p) p.addEventListener("click", function(ev){ if(ev.target === p) fermeVus(); });
}

function ouvreClassement(){
  var e = $("classListe");
  if(!e) return;
  var l = classementSalon(), h = "", i;
  for(i = 0; i < l.length; i++) h += ligneClassement(l[i], i);
  e.innerHTML = h || '<div class="clSous" style="padding:0">'
                   + "Personne n'a encore marqué le moindre dégât.</div>";
  poseBadges(e);
  $("classP").classList.add("on");
}
function fermeClassement(){ $("classP").classList.remove("on"); }
function installeClassement(){
  var b = $("btCarriere"), f = $("btClassFerme"), p = $("classP");
  if(b) b.addEventListener("click", ouvreClassement);
  if(f) f.addEventListener("click", fermeClassement);
  /* le fond ferme aussi, comme partout ailleurs dans ce jeu */
  if(p) p.addEventListener("click", function(ev){ if(ev.target === p) fermeClassement(); });
}

function installeQuiSalon(){
  var e = $("quiSalon");
  if(!e) return;
  /* l'écouteur va sur le conteneur : le bouton est réécrit à chaque
     rafraîchissement de l'état du réseau */
  e.addEventListener("click", function(ev){
    if(!ev.target.closest || !ev.target.closest("[data-quisalon]")) return;
    quiSalonDeplie = !quiSalonDeplie;
    majQuiSalon();
    majCarriere();
  });
}
function majEtatReseau(){
  var p = $("pRes"), t = $("txRes"), e = $("etatRes");
  if(!p) return;
  p.className = "pastille";
  var n = 0;
  for(var k in autresJoueurs) n++;
  /* L'ÉTAT SE PORTE AUSSI SUR LE CONTENEUR, et pas seulement sur la
     pastille. Depuis que la ligne est montée dans le titre du bloc, un
     point de neuf pixels est trop peu pour dire à lui seul qu'on est
     branché ou coupé : c'est le TEXTE qui doit le dire, donc il lui
     faut la classe. On la pose à côté de chaque `classList.add` de la
     pastille, jamais depuis `reseau.etat` — les états du réseau sont
     quatre et les couleurs trois, et une correspondance devinée aurait
     laissé « refus » sans couleur du jour où on l'aurait ajouté. */
  if(reseau.etat === "ok"){
    p.classList.add("ok");
    if(e) e.className = "h2info ok";
    t.textContent = "Salon MILY — connecté" + (n ? " · " + n + " autre" + (n > 1 ? "s" : "") + " joueur" + (n > 1 ? "s" : "") : " · seul pour l'instant");
    majQuiSalon();
    majCarriere();
  }else if(reseau.etat === "coupe" || reseau.etat === "erreur" || reseau.etat === "refus"){
    p.classList.add("ko");
    if(e) e.className = "h2info ko";
    t.textContent = "Relais injoignable — le jeu marche quand même en solo. Essaie l'autre relais.";
    majQuiSalon();
    majCarriere();
  }else{
    p.classList.add("att");
    if(e) e.className = "h2info att";
    t.textContent = "Connexion au salon MILY…";
    majQuiSalon();
    majCarriere();
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
/* Le premier mot d'une carte événement : ce qu'elle dit quand on y
   arrive. */
var MSG_ENTREE = {
  j:"L'orage gronde. Choisis une navette et débarque.",
  n:"Les étoiles sont basses. Choisis une navette et débarque."
};
function lancePartie(ou){
  if(!pseudoSaisi()) return signalePseudoManquant();
  monNom = pseudoSaisi();
  $("pseudo").value = monNom;          // le champ montre ce qui sera diffusé
  sauvegarde();
  /* le journal des passages porte le DERNIER pseudo connu : c'est
     celui sous lequel on reconnaîtra la personne */
  if(typeof renommeMonJournal === "function") renommeMonJournal();
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
  /* LA MUSIQUE, ET UNE SEULE PORTE POUR ELLE. Tout le monde passe par
     ici : la campagne, les cartes événement, et la VISITE — qui
     appelle lancePartie comme les autres avant de ranger les boutons.
     C'est ce qui fait qu'on entend la fête même sur une île
     verrouillée qu'on ne fait que regarder, ce qui a été demandé.
     `musique.entre` ne fait quelque chose que sur la carte à scène ;
     partout ailleurs elle coupe ce qui traînerait. */
  musique.entre(idx);
  construitFondMini();
  construitMenu();
  majBarres();
  majPodium();
  message(carteSpeciale(idx)
    ? (MSG_ENTREE[voieDeCarte(idx)] || "Choisis une navette et débarque.")
    : "Choisis une barge en bas à gauche, puis appuie sur la plage.");
  if(reseau.connecte) envoie({ t:"bonjour", nom:monNom });
}

/* Boutons du HUD */
/* Le bouton n'existe que dans le briefing : impossible de l'effleurer
   en pleine partie. Double garde-fou — un mot de passe, puis une
   confirmation qui annonce ce que ça détruit. */
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
  /* LA VISITE MONTRE L'ÎLE, ELLE NE LA FAIT PAS JOUER. On range donc
     tout ce qui sert à combattre — les navettes, l'énergie, les
     capacités : ces boutons ne mèneraient à rien, puisque l'île n'est
     pas ouverte et que rien de ce qu'on y ferait ne serait retenu. Ce
     qui reste est ce pour quoi on est venu : la carte, la caméra, et
     de quoi ressortir. */
  $("hud").classList.add("apercu", "visite");
  message("Visite de « " + CARTES[i].nom + " » — regarde l'île, "
        + "déplace la caméra. Rien n'est enregistré, et on n'y débarque pas.");
}
function quitteApercuAdmin(){
  modeApercu = false;
  $("hud").classList.remove("apercu");
  $("hud").classList.remove("visite");
  /* Les dégâts du test ne doivent pas hanter le classement local :
     on efface la mémoire de la partie d'essai. Le marqueur du cumul
     part avec elle — la prochaine vraie partie repart d'un compteur
     propre, sinon son premier coup passerait pour un retour en
     arrière et ne serait jamais rangé. */
  scoresSalon = {};
  degatsReplies = 0;
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
  if(carteSpeciale(jeu.index)) return evenementEnCours(monde, voieDeCarte(jeu.index));
  return jeu.index === carteSalon;
}
function majBoutonReprendre(){
  var b = $("btReprendre");
  if(!b) return;
  var ok = reprisePossible();
  b.style.display = ok ? "" : "none";
  /* LE NOM DE L'ÎLE PASSE DANS L'INFOBULLE, PAS DANS LE BOUTON.
     Le libellé était « ↩ REPRENDRE — Mily en soirée hippie » : il
     tenait quand le bouton faisait toute la largeur, il ne tient plus
     depuis qu'il en partage la moitié avec DÉBARQUER. Coupé par des
     points de suspension, il aurait annoncé « REPRENDRE — Mily en… »,
     c'est-à-dire moins qu'un libellé fixe et lisible.
     L'île reste connue : elle est dans l'infobulle, et surtout elle
     est la seule qu'on puisse reprendre — le bouton n'apparaît que si
     une partie est en cours, et il n'y en a jamais deux. */
  if(ok){
    b.textContent = "↩ REPRENDRE SUR L'ÎLE";
    b.title = "Reprendre la bataille en cours — " + CARTES[jeu.index].nom;
  }
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
/* Le volet d'entrée, par carte : son titre, sa classe de style et le
   son qui l'annonce. La jungle garde le tonnerre ; ce qu'une autre
   carte joue est à elle. */
var VOLETS_EVT = {
  j:{ titre:"MILY<br><b>DANS LA JUNGLE</b>", son:"tonnerre", relance:1400 },
  n:{ titre:"LES<br><b>MILY ET UNE NUITS</b>", son:"", relance:0 }
};
function entreDansEvenement(i){
  var P = voieDeCarte(i);
  var D = VOLETS_EVT[P] || {};
  var v = $("voletJungle");
  if(!v){
    v = document.createElement("div");
    v.id = "voletJungle";
    document.body.appendChild(v);
  }
  /* Le titre change d'une carte à l'autre : il se réécrit à chaque
     entrée plutôt qu'une seule fois à la création, sinon la seconde
     carte annoncerait la première. */
  v.className = "vol" + P;
  v.innerHTML = '<div class="ecl"></div><div class="ttr">'
              + (D.titre || ((CARTES[i].nom || "").toUpperCase())) + '</div>';
  void v.offsetWidth;                                // on relance l'animation
  v.classList.add("on");
  son.reveille();
  /* APPELÉ SUR `son`, ET JAMAIS DÉTACHÉ. Écrire `var jouer = son[D.son];
     jouer()` paraît équivalent et ne l'est pas : les méthodes de `son`
     font toutes `this.ok()`, et une méthode appelée sans son objet
     n'a plus de `this`. L'exception remontait jusqu'au clic et
     avortait l'entrée — on entendait le tonnerre, et la partie ne se
     lançait pas. */
  var nomSon = D.son && typeof son[D.son] === "function" ? D.son : "";
  if(nomSon) son[nomSon]();
  if(nomSon && D.relance) setTimeout(function(){ son[nomSon](); }, D.relance);
  setTimeout(function(){
    lancePartie(i);
    v.classList.remove("on");
  }, 2600);
}
function entreDansLaJungle(){ return entreDansEvenement(IDX_JUNGLE); }

/* Le salon a fermé l'expédition pendant qu'on y était : on ne peut pas
   rester seul sur une carte qui n'existe plus pour les autres. */
function finExpeditionLocale(){
  if(!enJeu || !jeu || !carteSpeciale(jeu.index)) return;
  message("L'expédition est terminée. Retour au campement.");
  quitteVersBriefing();
}
/* Retour au menu, proprement : la partie s'arrête, le briefing revient
   avec ses vignettes à jour. */
function quitteVersBriefing(){
  enJeu = false;
  bilanActif = false;
  /* La pluie et le vent de la jungle ne suivent pas jusqu'au menu.
     La boucle cesse de battre l'ambiance dès qu'on n'est plus en jeu,
     mais les oscillateurs, eux, continueraient tout seuls : c'est un
     son qui se coupe, pas un son qui s'oublie. */
  if(typeof ambianceJungle !== "undefined") ambianceJungle.arrete();
  /* Sans elle, le vent et l'eau du jardin suivent le joueur au menu,
     puis par-dessus la jungle — qui monte alors sa propre nappe. Deux
     ambiances empilées. */
  if(typeof ambianceNuits !== "undefined") ambianceNuits.arrete();
  /* Et la fête d'Ibiza ne suit pas non plus jusqu'au menu : elle a son
     propre contexte audio, donc personne d'autre ne l'arrêtera. */
  if(typeof musique !== "undefined") musique.sort();
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
/* ---------------------------------------------------------------
   LE PANNEAU D'ADMINISTRATION

   Le bouton ne déroule plus une file d'invites : il ouvre une porte,
   et c'est derrière elle que vivent maintenant les deux choses
   réservées — le plan de défense des six cartes, qui occupait un bloc
   entier de l'accueil pour ne parler qu'à une personne, et les
   réglages de la jungle.
   Le mot de passe reste demandé à l'entrée, une seule fois : ce qui
   est derrière ne se redemande pas à chaque geste, sauf la porte des
   maps qui garde le sien — elle mène à des changements que tout le
   salon subit.
   --------------------------------------------------------------- */
function ouvreAdminP(){
  var e = $("adminP");
  if(!e) return;
  rafraichitPlan();                 // le résumé peut avoir changé ailleurs
  e.classList.add("on");
}
function fermeAdminP(){
  var e = $("adminP");
  if(e) e.classList.remove("on");
}
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
    ouvreAdminP();
  });
  var f = $("btAdminFerme");
  if(f) f.addEventListener("click", fermeAdminP);
  /* Un doigt sur le voile ferme aussi : c'est le geste attendu sur
     tablette, et il ne touche à rien. */
  var p = $("adminP");
  if(p) p.addEventListener("click", function(ev){ if(ev.target === p) fermeAdminP(); });
  var r = $("btAdminReglages");
  if(r) r.addEventListener("click", regleJungleAdmin);
  var bl = $("btAdminBlindage");
  if(bl) bl.addEventListener("click", regleBlindageAdmin);
  var sq = $("btAdminSanteQG");
  if(sq) sq.addEventListener("click", regleSanteQGAdmin);
  var rc = $("btAdminReprise");
  if(rc) rc.addEventListener("click", reprendCampagneAdmin);
  var cu = $("btAdminCumul");
  if(cu) cu.addEventListener("click", recupereCumulAdmin);
  var rk = $("btAdminCarrieres");
  if(rk) rk.addEventListener("click", reconstruitCarrieresAdmin);
}

/* ================================================================
   RECONSTRUIRE LES CARRIÈRES DES AUTRES

   « J'ai repris mon cumul mais pas celui des autres. »

   On ne PEUT pas reprendre celui des autres : il vit dans leur
   navigateur. Ce qu'on peut faire, c'est relire les podiums gelés —
   qui sont, eux, dans l'instantané partagé — et en refaire un total
   par joueur. Voir reconstruitCarrieres : ce sont de vrais chiffres,
   pris à la chute de chaque île.

   L'AVERTISSEMENT DIT LA VÉRITÉ, y compris la partie qui fâche : seuls
   les joueurs entrés dans un top 3 y sont, et un quatrième d'île n'a
   rien laissé. On annonce ce qu'on va poser AVANT de le poser, joueur
   par joueur, pour qu'on puisse dire non.

   ET ÇA NE DOUBLE JAMAIS. Le seau hérité est un repli : dès qu'un
   joueur récupère son vrai cumul sur son appareil, seauxHerites le
   chasse île par île. On peut donc reconstruire d'abord et récupérer
   ensuite, dans n'importe quel ordre.
   ================================================================ */
function reconstruitCarrieresAdmin(){
  if(!monde || !monde.t3){
    alert("Aucun podium enregistré : il n'y a rien à reconstruire.");
    return;
  }
  var av = totalParJoueur(decodeScores(monde.s));
  var r = reconstruitCarrieres(decodeScores(monde.s), monde.t3);
  var ap = totalParJoueur(r.tab);
  var l = classementDepuis(ap), i, gagne = 0, txt = "";
  for(i = 0; i < l.length; i++){
    var d = l[i].g - (av[l[i].nom] || 0);
    if(d <= 0) continue;
    gagne++;
    txt += "  • " + l[i].nom + " : "
         + ((av[l[i].nom] || 0) ? nombre(av[l[i].nom]) + " → " : "")
         + nombre(l[i].g) + "\n";
  }
  if(!gagne){
    alert("Les podiums n'apportent rien de plus que ce qui est déjà\n"
        + "au classement. Rien n'a été touché.");
    return;
  }
  if(!confirm("RECONSTRUIRE LES CARRIÈRES\n\n"
            + "À partir des podiums gelés de chaque île — de vrais\n"
            + "chiffres, pris au moment où l'île est tombée.\n\n"
            + "CE QUI CHANGE :\n" + txt + "\n"
            + "CE QUE ÇA NE RATTRAPE PAS : seuls les joueurs entrés\n"
            + "dans un top 3 y figurent. Le quatrième d'une île n'a\n"
            + "rien laissé dans les podiums.\n\n"
            + "Un joueur qui récupère ensuite son vrai cumul sur son\n"
            + "appareil remplace sa reconstruction — jamais de double\n"
            + "compte, et dans n'importe quel ordre.\n\n"
            + "Aucun score existant n'est abaissé.")) return;
  monde.s = encodeScores(r.tab);
  republieMesScores(1);            // en force : voir son commentaire
  majMondes();
  if(typeof majCarriere === "function") majCarriere();
  fermeAdminP();
  alert(gagne + " carrière" + (gagne > 1 ? "s" : "") + " reconstruite"
      + (gagne > 1 ? "s" : "") + " depuis les podiums.");
}

/* ================================================================
   REPRENDRE LA CAMPAGNE À UNE ÎLE

   « On était à la guinguette ! Sans tout casser, peut-on revenir à la
   guinguette comme map en cours, sans perdre les scores par map ? »

   Oui, et c'est ce bouton. Il fait exactement ce que le jeu fait tout
   seul quand une île tombe : il publie l'île suivante avec ses
   défenses intactes. Les dégâts déjà inscrits ne bougent pas — voir
   reprendCampagneA, qui republie le tableau tel quel.

   L'AVERTISSEMENT N'EST PAS DÉCORATIF, et il dit deux choses
   différentes selon le sens :
     — AVANCER (le cas d'une réparation) ne coûte que la bataille en
       cours sur l'île qu'on quitte. Les dégâts déjà faits restent au
       tableau, ce sont les défenses tombées qui reviennent.
     — RECULER oblige à changer de numéro de campagne pour que les
       autres appareils acceptent le changement, et le cumul LOCAL des
       autres joueurs ne suit pas cette montée : leurs prochains dégâts
       repartiront sous leur propre record. On le dit avant, pas après.
   ================================================================ */
function reprendCampagneAdmin(){
  var ordre = [], i;
  for(i = 0; i < ORDRE_CAMPAGNE.length; i++){
    if(!carteSpeciale(ORDRE_CAMPAGNE[i])) ordre.push(ORDRE_CAMPAGNE[i]);
  }
  var l = "REPRENDRE LA CAMPAGNE À UNE ÎLE\n\n"
        + "Île en cours : " + CARTES[carteSalon].nom + "\n\n"
        + "Les dégâts déjà inscrits sur chaque île NE SONT PAS touchés,\n"
        + "les champions et les podiums non plus.\n\n"
        + "Où veux-tu reprendre ?\n\n";
  for(i = 0; i < ordre.length; i++){
    l += "  " + (i + 1) + " — " + CARTES[ordre[i]].nom
       + (ordre[i] === carteSalon ? "   ← en cours" : "") + "\n";
  }
  var rep = prompt(l + "\nNuméro (rien pour annuler) :");
  if(rep === null) return;
  var n = parseInt(rep, 10);
  if(!(n >= 1 && n <= ordre.length)){
    if(rep.trim() !== "") alert("Numéro inconnu. Rien n'a été touché.");
    return;
  }
  var cible = ordre[n - 1];
  if(cible === carteSalon){ alert("C'est déjà l'île en cours. Rien n'a été touché."); return; }
  var recule = rangCampagne(cible) <= rangCampagne(carteSalon);
  var av = "Reprendre la campagne à « " + CARTES[cible].nom + " » ?\n\n"
         + "CE QUI EST GARDÉ :\n"
         + "• tous les dégâts déjà inscrits, île par île\n"
         + "• le Top carrière\n"
         + "• les champions et les podiums de chaque île\n"
         + "• les plans de défense et les blindages\n\n"
         + "CE QUI EST PERDU :\n"
         + "• la bataille en cours sur « " + CARTES[carteSalon].nom + " » —\n"
         + "  ses défenses détruites reviennent, le Brasier retrouve sa vie\n";
  if(recule){
    av += "\nATTENTION — tu RECULES dans la campagne. Il faut alors changer\n"
        + "de numéro de campagne, et le cumul local des AUTRES joueurs ne\n"
        + "suit pas : leurs prochains dégâts repartiront sous leur record.\n"
        + "Chacun peut le récupérer avec « Récupérer mon cumul ».\n";
  }
  av += "\nLes autres joueurs verront le changement immédiatement.";
  if(!confirm(av)) return;
  if(!reprendCampagneA(cible)){ alert("Impossible de reprendre à cette île."); return; }
  if(enJeu){ nouvelleCarte(cible); construitFondMini(); majBarres(); }
  majMondes();
  fermeAdminP();
  alert("La campagne reprend à « " + CARTES[cible].nom + " ».\n"
      + "Les scores par île n'ont pas bougé.");
}

/* ================================================================
   RÉCUPÉRER SON CUMUL DE CARRIÈRE

   À quoi ça sert. Le cumul de dégâts d'un appareil est rangé sous la
   campagne où il a été fait. Quand le numéro de campagne monte sans
   qu'une vraie campagne neuve ait commencé — c'est ce que faisait
   l'enregistrement d'un plan avant qu'on le corrige —, ce cumul cesse
   d'être lu. Il n'est PAS effacé : il dort dans le navigateur avec
   l'ancien numéro.

   Ce bouton lui recolle le numéro courant. Le Top carrière se
   reconstruit alors tout seul, à partir de vrais chiffres — on ne
   réinvente rien, on relit ce qui était déjà là.

   IL EST À FAIRE SUR CHAQUE APPAREIL. Chacun ne tient que SON propre
   cumul : c'est le principe du seau, et c'est aussi ce qui fait qu'on
   ne peut pas récupérer le total de quelqu'un d'autre à sa place.
   ================================================================ */
function recupereCumulAdmin(){
  if(!pseudoSaisi()){
    alert("Écris d'abord ton pseudo : c'est sous lui que le cumul sera republié.");
    return;
  }
  monNom = pseudoSaisi();
  var n = (typeof porteMesDegats === "function") ? porteMesDegats() : 0;
  if(!n){
    alert("Aucun cumul en sommeil sur cet appareil.\n\n"
        + "Soit il a déjà été récupéré, soit les dégâts ont été faits\n"
        + "sur un autre appareil ou dans un autre navigateur — c'est là\n"
        + "qu'il faut appuyer sur ce bouton.");
    return;
  }
  var t = 0, k;
  for(k in mesDegats) t += mesDegats[k];
  if(typeof republieMesScores === "function") republieMesScores();
  majMondes();
  if(typeof majCarriere === "function") majCarriere();
  alert("Cumul récupéré : " + nombre(t) + " points de dégâts sur "
      + n + " île" + (n > 1 ? "s" : "") + ".\n\n"
      + "Il repart dans le tableau du salon. Les autres joueurs doivent\n"
      + "faire le même geste sur LEUR appareil pour retrouver le leur.");
}

/* ================================================================
   BLINDER UNE ÎLE, DEPUIS L'ACCUEIL

   Deux questions, et un avertissement au milieu qu'il ne faut pas
   supprimer : LE SCORE SE COMPTE EN POINTS DE VIE RETIRÉS. Blinder
   une île à +100 %, c'est rendre les prochains scores deux fois plus
   gros que ceux déjà inscrits dessus. Sur une île qu'on n'a pas
   encore jouée, cela n'a aucune conséquence ; sur une île où le
   classement est en cours, cela en a une, et le joueur doit la lire
   avant de valider, pas après.

   La liste montre l'état de chacune : son rang de campagne, si elle
   est déjà tombée, et le blindage qu'elle porte. Elle tient dans une
   invite de texte parce que tout le panneau d'administration tient
   dans des invites de texte — ce n'est pas l'endroit où l'on soigne
   la mise en page, c'est l'endroit où l'on ne se trompe pas.
   ================================================================ */
function regleBlindageAdmin(){
  var l = "BLINDAGE DES DÉFENSES\n\n"
        + "Quelle île veux-tu blinder ?\n\n";
  var ordre = [], i;
  for(i = 0; i < ORDRE_CAMPAGNE.length; i++) ordre.push(ORDRE_CAMPAGNE[i]);
  for(i = 0; i < CARTES.length; i++) if(ordre.indexOf(i) < 0) ordre.push(i);
  for(i = 0; i < ordre.length; i++){
    var k = ordre[i], bl = blindageDeCarte(k), dg = degatsDeCarte(k);
    l += "  " + (i + 1) + " — " + CARTES[k].nom
       + (bl > 0 || dg > 0
            ? "   [vie +" + bl + " % · dégâts +" + dg + " %]" : "")
       + (carteSpeciale(k) ? "   (carte spéciale)" : "")
       + "\n";
  }
  var rep = prompt(l + "\nEntre un numéro :", "1");
  if(rep === null) return;
  var q = parseInt(rep, 10);
  if(!(q >= 1 && q <= ordre.length)){
    alert("Il faut un numéro entre 1 et " + ordre.length + ". Rien n'a été changé.");
    return;
  }
  var idx = ordre[q - 1], nom = "« " + CARTES[idx].nom + " »";
  var actuel = blindageDeCarte(idx);
  /* L'ÎLE A-T-ELLE DÉJÀ ÉTÉ JOUÉE ? C'est ce qui décide si l'on
     avertit ou non, et c'est la seule chose qui compte ici. */
  var jouee = dejaJouee(idx);
  var av = jouee
    ? "\n⚠ ATTENTION : des scores existent déjà sur cette île.\n"
      + "Le TOP DÉGÂTS compte les points de vie retirés : en la\n"
      + "blindant, les prochains scores y vaudront plus que ceux\n"
      + "déjà inscrits. Rien ne sera effacé, mais les anciens et les\n"
      + "nouveaux ne se compareront plus tout à fait.\n"
    : "\nCette île n'a pas encore été jouée : rien à comparer,\n"
      + "le blindage y est sans conséquence pour le classement.\n";
  var actuelDg = degatsDeCarte(idx);
  var rp = prompt(
    "BLINDER " + nom.toUpperCase() + " — 1 sur 2 : LA VIE\n\n"
    + "Pourcentage de vie EN PLUS sur ses défenses.\n"
    + "Le Brasier garde exactement la sienne, ainsi que les cellules\n"
    + "à récolter et les réacteurs du bouclier.\n\n"
    + "Valeur actuelle : +" + actuel + " %.\n"
    + av
    + "\nEntre un pourcentage entre 0 et " + BLINDAGE_MAX + " :", "" + actuel);
  if(rp === null) return;
  var v = parseInt(rp, 10);
  if(!(v >= 0 && v <= BLINDAGE_MAX)){
    alert("Il faut un pourcentage entre 0 et " + BLINDAGE_MAX
        + ". Rien n'a été changé.");
    return;
  }
  /* ET LE SECOND POURCENTAGE, celui de la PUISSANCE DE FEU. Les deux
     ne durcissent pas du tout de la même façon, et le panneau doit le
     dire : monter la vie allonge la bataille, monter les dégâts la
     rend mortelle. On les règle ensemble parce qu'on les pense
     ensemble. */
  var rd = prompt(
    "BLINDER " + nom.toUpperCase() + " — 2 sur 2 : LES DÉGÂTS\n\n"
    + "Pourcentage de dégâts EN PLUS pour ses défenses.\n"
    + "Toutes tirent plus fort : Crible, Chalumeau, Frelon, Pilon,\n"
    + "Bobine, Mirador. Leur portée et leur cadence ne changent pas.\n\n"
    + "Valeur actuelle : +" + actuelDg + " %.\n\n"
    + "⚠ Ce réglage-ci ne touche PAS au classement : le TOP DÉGÂTS\n"
    + "compte ce que TU retires, pas ce que les défenses infligent.\n"
    + "Il est sans conséquence sur les scores, passés ou futurs.\n\n"
    + "Il s'applique au coup suivant, même en pleine bataille.\n\n"
    + "Entre un pourcentage entre 0 et " + BLINDAGE_MAX + " :", "" + actuelDg);
  if(rd === null) return;
  var w = parseInt(rd, 10);
  if(!(w >= 0 && w <= BLINDAGE_MAX)){
    alert("Il faut un pourcentage entre 0 et " + BLINDAGE_MAX
        + ". Rien n'a été changé.");
    return;
  }
  var pose = regleBlindage(idx, v, w);
  evtEtat = "";
  majMondes();
  if(typeof rafraichitPlan === "function") rafraichitPlan();
  alert("Réglages enregistrés pour " + nom + " :\n\n"
      + "  • défenses à +" + pose.pv + " % de vie\n"
      + "  • défenses à +" + pose.dg + " % de dégâts\n\n"
      + "Ils valent pour TOUT LE SALON, voyagent dans l'instantané\n"
      + "partagé et survivent à la fermeture du navigateur.\n\n"
      + "Ils s'appliquent IMMÉDIATEMENT, y compris à une partie en\n"
      + "cours : la vie est remise à l'échelle sans que rien ne soit\n"
      + "réinitialisé — les ruines restent des ruines, un bâtiment à\n"
      + "moitié abattu reste à moitié abattu — et les dégâts prennent\n"
      + "effet au coup suivant.");
}

/* ================================================================
   RÉGLER LA SANTÉ D'UN BRASIER

   « Pour l'instant les QG sont beaucoup trop énormes. »

   Deux questions, et un avertissement au milieu — le même que celui du
   blindage, et pour la même raison : LE SCORE SE COMPTE EN POINTS DE
   VIE RETIRÉS. Diviser un Brasier par dix, c'est rendre les prochains
   scores dix fois plus petits que ceux déjà inscrits sur cette île. Le
   joueur doit le lire avant de valider, pas après.

   ON SAISIT EN MILLIONS, et ce n'est pas un détail d'ergonomie. Les
   Brasiers valent entre quinze et soixante-quinze millions : demander
   « 5 » plutôt que « 5000000 » retire six occasions de se tromper
   d'un zéro sur une valeur qui part aussitôt chez tout le monde. La
   virgule est acceptée, et la valeur est bornée à la saisie.

   ET LA LISTE MONTRE LES DEUX CHIFFRES quand ils diffèrent — celui de
   la fiche et celui qui est réglé : sans quoi on ne peut pas savoir
   d'où l'on part, ni ce qu'on rendrait en remettant zéro.
   ================================================================ */
function regleSanteQGAdmin(){
  var l = "SANTÉ DU BRASIER\n\nQuel Brasier veux-tu régler ?\n\n";
  var ordre = [], i;
  for(i = 0; i < ORDRE_CAMPAGNE.length; i++) ordre.push(ORDRE_CAMPAGNE[i]);
  for(i = 0; i < CARTES.length; i++) if(ordre.indexOf(i) < 0) ordre.push(i);
  for(i = 0; i < ordre.length; i++){
    var k = ordre[i], fiche = CARTES[k].pvQG || 0, vaut = pvQGDeCarte(k);
    l += "  " + (i + 1) + " — " + CARTES[k].nom
       + "   " + nombre(vaut) + " PV"
       + (santeQGReglee(k) ? "   [réglé, fiche : " + nombre(fiche) + "]" : "")
       + (carteSpeciale(k) ? "   (carte spéciale)" : "")
       + "\n";
  }
  var rep = prompt(l + "\nEntre un numéro :", "1");
  if(rep === null) return;
  var q = parseInt(rep, 10);
  if(!(q >= 1 && q <= ordre.length)){
    alert("Il faut un numéro entre 1 et " + ordre.length + ". Rien n'a été changé.");
    return;
  }
  var idx = ordre[q - 1], nom = "« " + CARTES[idx].nom + " »";
  var avant = pvQGDeCarte(idx), fiche = CARTES[idx].pvQG || 0;
  var jouee = dejaJouee(idx);
  var av = jouee
    ? "\n⚠ ATTENTION : des scores existent déjà sur cette île.\n"
      + "Le TOP DÉGÂTS compte les points de vie retirés. En divisant\n"
      + "ce Brasier par dix, les prochains scores y vaudront dix fois\n"
      + "moins que ceux déjà inscrits. Rien ne sera effacé, mais les\n"
      + "anciens et les nouveaux ne se compareront plus tout à fait.\n"
    : "\nCette île n'a pas encore été jouée : rien à comparer,\n"
      + "le réglage y est sans conséquence pour le classement.\n";
  /* ET L'ÉTAT DE LA BATAILLE EN COURS, s'il y en a une sur cette île :
     c'est la phrase qu'il a demandée, et il doit la voir AVANT de
     valider, avec le chiffre qu'elle donnera. */
  var enCours = "";
  if(jeu && jeu.index === idx && jeu.qg.pvMax > 0){
    var part = Math.max(0, Math.min(1, jeu.qg.pv / jeu.qg.pvMax));
    enCours = "\nUne bataille est EN COURS sur cette île : il reste\n"
            + Math.round(part * 100) + " % du Brasier. Ce pourcentage sera "
            + "conservé\ntel quel — seule la taille change.\n";
  }
  var defaut = Math.round(avant / 1e5) / 10;
  var rp = prompt(
    "SANTÉ DU BRASIER DE " + nom.toUpperCase() + "\n\n"
    + "Sa vie, EN MILLIONS de points.\n"
    + "Valeur actuelle : " + (Math.round(avant / 1e5) / 10) + " M"
    + (santeQGReglee(idx) ? "   (fiche : " + (Math.round(fiche / 1e5) / 10) + " M)" : "")
    + ".\n"
    + "Entre 0 pour lui rendre celle de sa fiche.\n"
    + av + enCours
    + "\nLes défenses ne changent pas, et les armes non plus : un\n"
    + "Brasier deux fois plus petit tombe deux fois plus vite.\n\n"
    + "Entre un nombre entre " + (QG_PV_MIN / 1e6) + " et "
    + (QG_PV_MAX / 1e6) + " (ou 0) :", "" + defaut);
  if(rp === null) return;
  var m = parseFloat(String(rp).replace(",", "."));
  if(!isFinite(m) || m < 0){
    alert("Il faut un nombre. Rien n'a été changé.");
    return;
  }
  var points = Math.round(m * 1e6);
  if(points > 0 && (points < QG_PV_MIN || points > QG_PV_MAX)){
    alert("Il faut un nombre entre " + (QG_PV_MIN / 1e6) + " et "
        + (QG_PV_MAX / 1e6) + " millions, ou 0 pour revenir à la fiche.\n"
        + "Rien n'a été changé.");
    return;
  }
  var pose = regleSanteQG(idx, points);
  if(!pose){ alert("Carte inconnue. Rien n'a été changé."); return; }
  evtEtat = "";
  majMondes();
  if(typeof rafraichitPlan === "function") rafraichitPlan();
  alert("Brasier de " + nom + " : " + nombre(pose.pv) + " PV"
      + (pose.regle ? "" : "   (valeur de sa fiche)") + ".\n\n"
      + "Le réglage vaut pour TOUT LE SALON, voyage dans l'instantané\n"
      + "partagé et survit à la fermeture du navigateur.\n\n"
      + "Il s'applique IMMÉDIATEMENT, y compris à une partie en cours :\n"
      + "le pourcentage déjà détruit est conservé, et rien d'autre n'a\n"
      + "bougé — ni les ruines, ni les blessures, ni les scores, ni la\n"
      + "campagne.");
}

/* Cette île a-t-elle déjà été jouée dans ce salon ? On le lit sur
   l'avancée de la campagne, qui est la seule chose que l'instantané
   sache dire à ce sujet. */
function dejaJouee(i){
  if(!monde) return false;
  if(carteSpeciale(i)) return !!(monde[voieDeCarte(i) + "f"] | 0);
  return rangCampagne(i) <= rangCampagne(monde.c | 0);
}

/* LES RÉGLAGES DU SALON, CARTE PAR CARTE. Ils ne concernaient que la
   jungle, et l'appelaient par son nom dans chacune de leurs six
   phrases. Chaque carte événement a maintenant les siens, sur sa
   propre voie : on demande donc d'abord LAQUELLE, et l'on ne pose la
   question que s'il y en a plus d'une — pour une seule carte, un
   choix à une entrée est une porte qu'on ouvre pour rien. */
function choisitEvenementAdmin(){
  if(VOIES_EVT.length <= 1) return VOIES_EVT.length ? VOIES_EVT[0].i : -1;
  var l = "RÉGLAGES DU SALON\n\nQuelle carte spéciale veux-tu régler ?\n\n";
  for(var k = 0; k < VOIES_EVT.length; k++)
    l += "  " + (k + 1) + " — " + CARTES[VOIES_EVT[k].i].nom + "\n";
  var rep = prompt(l + "\nEntre un numéro :", "1");
  if(rep === null) return -1;
  var q = parseInt(rep, 10);
  if(!(q >= 1 && q <= VOIES_EVT.length)){
    alert("Il faut un numéro entre 1 et " + VOIES_EVT.length + ". Rien n'a été changé.");
    return -1;
  }
  return VOIES_EVT[q - 1].i;
}
function regleJungleAdmin(){
  var idx = choisitEvenementAdmin();
  if(idx < 0) return;
  var nom = "« " + CARTES[idx].nom + " »", R = reglagesEvt(idx);
  var actuel = minJoueursEvt(idx), pvActuel = bonusPvDeCarte(idx);
  var rep = prompt(
    "RÉGLAGES DE " + nom.toUpperCase() + " — 1 sur 2\n\n"
    + "Nombre minimum de joueurs connectés pour la lancer.\n\n"
    + "Valeur actuelle : " + actuel + " joueurs.\n"
    + "Par défaut : " + R.minJoueurs + " joueurs.\n\n"
    + "Entre un nombre entre 1 et 60 :", "" + actuel);
  if(rep === null) return;
  var n = parseInt(rep, 10);
  if(!(n >= 1 && n <= 60)){
    alert("Il faut un nombre entre 1 et 60. Rien n'a été changé.");
    return;
  }
  /* Le second réglage : la dureté des défenses. Il vit dans le même
     panneau et voyage avec le même numéro, parce qu'on les règle
     ensemble — l'un dit qui peut entrer, l'autre ce qu'on y trouve. */
  var repPv = prompt(
    "RÉGLAGES DE " + nom.toUpperCase() + " — 2 sur 2\n\n"
    + "Bonus de PV des défenses sur cette carte.\n"
    + "Le Brasier, lui, garde exactement sa vie.\n\n"
    + "Valeur actuelle : +" + pvActuel + " %.\n"
    + "Par défaut : +" + R.pvBonus + " %.\n\n"
    + "Entre un pourcentage entre 0 et 900 :", "" + pvActuel);
  if(repPv === null) return;
  var pv = parseInt(repPv, 10);
  if(!(pv >= 0 && pv <= 900)){
    alert("Il faut un pourcentage entre 0 et 900. Rien n'a été changé.");
    return;
  }
  var pose = regleReglagesEvt(idx, n, pv);
  evtEtat = "";
  majMondes();
  alert("Réglages enregistrés pour " + nom + ".\n\n"
      + "• " + pose + " joueur" + (pose > 1 ? "s" : "") + " connecté"
      + (pose > 1 ? "s" : "") + " pour la lancer\n"
      + "• défenses à +" + bonusPvDeCarte(idx) + " % de PV\n\n"
      + "Ils valent pour TOUT LE SALON et survivent à la fermeture du\n"
      + "navigateur : ils voyagent dans l'instantané partagé.\n\n"
      + "Ils ne touchent QUE cette carte : chaque événement a les siens.\n\n"
      + "Le changement de PV prend effet à la prochaine expédition —\n"
      + "une carte en cours garde la dureté avec laquelle elle a été\n"
      + "bâtie.");
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

/* Les quatre boutons de zoom, de recentrage et de plein écran ont
   quitté le coin haut-gauche : leurs écouteurs partent avec eux, sinon
   $("btZp") rendrait null et la ligne suivante ne serait jamais posée.
   Les fonctions, elles, restent — zoomVers sert à la molette et au
   pincement, basculePlein au bouton de l'accueil. */
function installeBoutons(){
  $("btAccueil").addEventListener("click", retourAccueil);
  $("btReprendre").addEventListener("click", reprendCombat);
  var ab = $("btAbandon");
  if(ab) ab.addEventListener("click", abandonneLaVague);
}

/* ================================================================
   ABANDONNER LA VAGUE

   CE QUE ÇA FAIT, ET SURTOUT CE QUE ÇA NE FAIT PAS.

   Ça sacrifie ce qu'il reste de MES troupes : les unités au sol, les
   barges non débarquées, les navettes en vol. Rien d'autre. La carte,
   les défenses déjà tombées, les dégâts déjà inscrits, les podiums, le
   Top carrière et l'instantané partagé ne bougent pas d'un octet —
   c'est exactement l'état où l'on se retrouve quand la dernière Furie
   meurt, à ceci près qu'on l'a demandé.

   ET ON NE RECOPIE PAS LA MACHINE À ÉTATS. majMort surveille déjà la
   condition « plus une unité, plus une barge, plus une navette » : elle
   lève alors le fantôme, lance le compte à rebours du renfort, et rend
   une flotte neuve avec sa Nova et ses tarifs remis à zéro. On se
   contente donc de CRÉER cette condition, et le reste se déroule tout
   seul, par le chemin déjà éprouvé. Écrire ici un second compte à
   rebours aurait été un second endroit à corriger le jour où celui-là
   change.

   Le fantôme se pose là où étaient les troupes plutôt qu'à leur point
   de départ : c'est le même geste que `dernierePerte` fait pour une
   mort ordinaire, et il coûte trois lignes.
   ================================================================ */
function abandonneLaVague(){
  if(!jeu || jeu.fin) return;
  if(jeu.mort) return message("Ta flotte est déjà perdue, le renfort arrive.");
  var n = jeu.unites.length + jeu.barges.length + jeu.navettes.length;
  if(!n) return message("Tu n'as rien à abandonner.");
  if(!confirm("Abandonner cette vague ?\n\n"
            + "Tes " + jeu.unites.length + " unité"
            + (jeu.unites.length > 1 ? "s" : "") + " encore au sol "
            + (jeu.unites.length > 1 ? "sont perdues" : "est perdue") + ", ainsi que "
            + "tes navettes non débarquées.\n"
            + "Le renfort arrive ensuite, comme après une flotte perdue.\n\n"
            + "L'île, les défenses détruites et tes dégâts déjà comptés\n"
            + "ne sont PAS touchés.")) return;
  /* le fantôme naîtra là où la troupe était, pas sur la plage */
  if(jeu.unites.length){
    var mx = 0, my = 0, i;
    for(i = 0; i < jeu.unites.length; i++){ mx += jeu.unites[i].gx; my += jeu.unites[i].gy; }
    jeu.dernierePerte = { gx:mx / jeu.unites.length, gy:my / jeu.unites.length };
  }
  jeu.unites.length = 0;
  jeu.barges.length = 0;
  jeu.navettes.length = 0;
  jeu.bargeSel = 0;
  /* la capacité armée n'a plus personne à servir */
  jeu.capArmee = null;
  viseur.actif = false;
  majListeBarges();
  majMenu();
  majBarres();
  message("Vague abandonnée. Le renfort se prépare.");
}
