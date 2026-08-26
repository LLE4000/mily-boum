/* ================================================================
   L'ÉDITEUR DE DÉFENSES — la carte vue de haut, peinte au doigt.

   Le joueur peint des zones ; chaque zone porte un type de défense et
   une densité. Ce n'est pas un calque figé : c'est une recette que le
   générateur réalise, avec un tirage neuf à chaque remise à zéro. Deux
   parties partageront donc l'esprit du plan sans jamais rejouer la
   même carte.

   Validation réservée : le même mot de passe que la remise à zéro du
   salon. Le plan part ensuite dans l'instantané retenu, donc tous les
   joueurs — y compris ceux qui arriveront plus tard — jouent la carte
   dessinée ici.
   ================================================================ */

/* Une teinte par type. Elles doivent se distinguer entre elles ET sur
   l'herbe : l'olive du Pilon, essayée d'abord, se noyait dans le vert. */
var COUL_PLAN = {
  crible   : "#9fb4cd",
  chalumeau: "#ff7a2e",
  frelon   : "#f05ab0",
  pilon    : "#c9d24a",
  bobine   : "#4fd2f0",
  cuve     : "#c0563c",
  silo     : "#c8ae74",
  cellule  : "#ffd84a"
};

var planZones = null;        // le brouillon en cours d'édition
var planPile = [];           // historique, pour « Annuler »
var planOutil = 1;           // indice dans TYPES_PLAN (0 = pinceau neutre)
var planDensite = 2;         // indice dans DENSITES
/* Le pinceau à cellules n'est PAS un type : il pose sa couche par
   -dessus les défenses. C'est un interrupteur à part, et quand il est
   allumé le doigt ne peint plus que ça. */
var planCellules = 0;

/* ---------------------------------------------------------------
   LE PLAN PAR DÉFAUT
   Le plan du salon appartient à tout le monde et coûte un mot de
   passe. Celui-ci n'appartient qu'à cet appareil : il ne part nulle
   part, il attend simplement dans le navigateur et se retrouve au
   prochain ouvrePlan(). C'est le brouillon qu'on reprend, pas la
   carte qu'on impose.
   --------------------------------------------------------------- */
var CLE_PLAN_DEFAUT = "milyboum.plan";
function planDefaut(){
  try{ return localStorage.getItem(CLE_PLAN_DEFAUT) || ""; }catch(e){ return ""; }
}
function gardePlanDefaut(s){
  try{
    if(s) localStorage.setItem(CLE_PLAN_DEFAUT, s);
    else localStorage.removeItem(CLE_PLAN_DEFAUT);
    return true;
  }catch(e){ return false; }
}
var planCv = null, planCtx = null;
var planEch = 1, planOx = 0, planOy = 0;   // carte → pixels du canevas
var planApercu = null;       // carte générée pour l'aperçu
var planApercuSale = true;
var planDoigt = null;        // identifiant du doigt qui peint

/* ---------------------------------------------------------------
   Ouverture / fermeture
   --------------------------------------------------------------- */
function ouvrePlan(){
  /* Le plan du salon fait foi ; à défaut, le brouillon gardé sur cet
     appareil ; à défaut, une carte vierge. */
  var dep = planSalon || planDefaut();
  planZones = dep ? decodePlan(dep) : planVide();
  planPile = [];
  planApercuSale = true;
  $("plan").classList.add("on");
  construitPalettePlan();
  ajustePlanCv();
  majPanneauPlan();
  dessinePlan();
}
function fermePlan(){
  $("plan").classList.remove("on");
  planApercu = null;
}

/* ---------------------------------------------------------------
   Palette
   --------------------------------------------------------------- */
/* Le nom d'un pinceau. Les deux extrêmes ne sont pas des défenses et
   n'ont pas de fiche dans DEF : ils se nomment ici. */
function nomOutilPlan(i){
  var t = TYPES_PLAN[i];
  if(i === 0) return "Neutre";
  if(t === "vide") return "Gomme forte";
  return DEF[t].nom;
}
function coulOutilPlan(i){
  var t = TYPES_PLAN[i];
  if(i === 0) return "#6c6478";
  if(t === "vide") return "#e8465a";
  return COUL_PLAN[t];
}

function construitPalettePlan(){
  var p = $("planPalette"), i, h = "";
  for(i = 0; i < TYPES_PLAN.length; i++){
    h += '<div class="pz' + (i === planOutil && !planCellules ? " on" : "")
       + '" data-outil="' + i + '">'
       + '<i style="background:' + coulOutilPlan(i) + '"></i>' + nomOutilPlan(i) + '</div>';
  }
  /* Le pinceau à cellules, à part : il ne remplace pas un type, il
     ajoute une couche. On le montre donc à côté, pas dans la liste. */
  h += '<div class="pz' + (planCellules ? " on" : "") + '" data-cell="1">'
     + '<i style="background:' + COUL_PLAN.cellule + '"></i>Cellules</div>';
  p.innerHTML = h;

  var d = $("planDensites"), hd = "";
  for(i = 0; i < DENSITES.length; i++){
    hd += '<div class="pz' + (i === planDensite ? " on" : "") + '" data-dens="' + i + '">'
        + DENSITES[i].nom + '</div>';
  }
  d.innerHTML = hd;
}
function choisitOutilPlan(i){
  planOutil = i | 0;
  planCellules = 0;
  construitPalettePlan();
  majPanneauPlan();
}
function basculeCellulesPlan(){
  planCellules = planCellules ? 0 : 1;
  construitPalettePlan();
  majPanneauPlan();
}
function choisitDensitePlan(i){
  planDensite = i | 0;
  planCellules = 0;
  construitPalettePlan();
  majPanneauPlan();
}

/* ---------------------------------------------------------------
   Le canevas : la carte à plat, une couleur par défense
   --------------------------------------------------------------- */
function ajustePlanCv(){
  planCv = $("planCv");
  if(!planCv) return;
  var r = planCv.getBoundingClientRect();
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  planCv.width  = Math.max(2, Math.round(r.width  * dpr));
  planCv.height = Math.max(2, Math.round(r.height * dpr));
  planCtx = planCv.getContext("2d");
  /* la carte entière tient dans le canevas, sans déformation */
  planEch = Math.min(planCv.width / GW, planCv.height / GH);
  planOx = (planCv.width  - GW * planEch) / 2;
  planOy = (planCv.height - GH * planEch) / 2;
}
function planVersCase(sx, sy){
  var r = planCv.getBoundingClientRect();
  var dpr = planCv.width / Math.max(1, r.width);
  var x = (sx - r.left) * dpr, y = (sy - r.top) * dpr;
  return { gx:(x - planOx) / planEch, gy:(y - planOy) / planEch };
}

/* L'aperçu n'est regénéré que lorsque le plan change : générer une
   carte coûte quelques millisecondes, bien trop pour le faire à chaque
   image pendant qu'un doigt glisse. */
function apercuPlan(){
  if(planApercuSale || !planApercu){
    planApercu = genereCarte(CODE_SALON, 0, encodePlan(planZones), tirageSalon);
    planApercuSale = false;
  }
  return planApercu;
}

function dessinePlan(){
  if(!planCtx) return;
  var c = planCtx, e = planEch, ox = planOx, oy = planOy;
  var m = apercuPlan();

  c.fillStyle = "#0d1a14"; c.fillRect(0, 0, planCv.width, planCv.height);
  /* le sol : terre, puis la plage de débarquement à l'est */
  c.fillStyle = "#5c7a43"; c.fillRect(ox, oy, PLAGE_X0 * e, GH * e);
  c.fillStyle = "#ddc697"; c.fillRect(ox + PLAGE_X0 * e, oy, (GW - PLAGE_X0) * e, GH * e);
  /* la ceinture rocheuse, infranchissable */
  c.fillStyle = "rgba(58,52,68,.5)";
  c.fillRect(ox, oy, LARGEUR_ROCHE * e, GH * e);
  c.fillRect(ox, oy, PLAGE_X0 * e, LARGEUR_ROCHE * e);
  c.fillRect(ox, oy + (GH - LARGEUR_ROCHE) * e, PLAGE_X0 * e, LARGEUR_ROCHE * e);

  /* les zones peintes, SOUS les bâtiments : on doit lire le résultat,
     pas seulement son intention */
  var i, zx, zy, z, t, d;
  /* Une hachure par densité : plus la trame est serrée, plus la zone
     est remplie. C'est le seul repère qui se lise d'un coup d'œil
     quand les six densités se côtoient sur la même carte. */
  var PAS_HACHURE = [0, 0.50, 0, 0.22, 0.15, 0.10];
  for(i = 0; i < NB_ZONES; i++){
    z = planZones[i]; if(!z) continue;
    t = zoneType(z); d = zoneDens(z);
    zx = (i % ZONES_L) * PAS_ZONE, zy = ((i / ZONES_L) | 0) * PAS_ZONE;
    var coul = t ? coulOutilPlan(t) : "#8f86a0";
    c.fillStyle = coul + (TYPES_PLAN[t] === "vide" ? "55" : "33");
    c.fillRect(ox + zx * e, oy + zy * e, PAS_ZONE * e, PAS_ZONE * e);
    c.strokeStyle = coul + "cc";
    c.lineWidth = Math.max(1, e * 0.16);
    c.strokeRect(ox + zx * e + 0.5, oy + zy * e + 0.5, PAS_ZONE * e - 1, PAS_ZONE * e - 1);
    if(PAS_HACHURE[d]){
      c.save();
      c.globalAlpha = 0.5; c.strokeStyle = coul;
      c.lineWidth = Math.max(0.8, e * 0.09);
      var pas = PAS_HACHURE[d] * PAS_ZONE * e;
      for(var k = pas; k < PAS_ZONE * e; k += pas){
        c.beginPath();
        c.moveTo(ox + zx * e + k, oy + zy * e);
        c.lineTo(ox + zx * e, oy + zy * e + k);
        c.stroke();
      }
      c.restore();
    }
    /* la gomme forte se barre d'une croix : elle RETIRE, il ne faut
       pas pouvoir la confondre avec un type de défense */
    if(TYPES_PLAN[t] === "vide"){
      c.save();
      c.strokeStyle = coul; c.lineWidth = Math.max(1, e * 0.14);
      c.beginPath();
      c.moveTo(ox + zx * e + 2, oy + zy * e + 2);
      c.lineTo(ox + (zx + PAS_ZONE) * e - 2, oy + (zy + PAS_ZONE) * e - 2);
      c.moveTo(ox + (zx + PAS_ZONE) * e - 2, oy + zy * e + 2);
      c.lineTo(ox + zx * e + 2, oy + (zy + PAS_ZONE) * e - 2);
      c.stroke();
      c.restore();
    }
    /* et le champ de cellules d'un liseré jaune à l'intérieur */
    if(zoneChamp(z)){
      c.save();
      c.strokeStyle = COUL_PLAN.cellule; c.lineWidth = Math.max(1.2, e * 0.20);
      c.setLineDash([e * 0.9, e * 0.7]);
      c.strokeRect(ox + zx * e + e * 0.6, oy + zy * e + e * 0.6,
                   PAS_ZONE * e - e * 1.2, PAS_ZONE * e - e * 1.2);
      c.restore();
    }
  }

  /* le quadrillage des zones vierges, discret */
  c.strokeStyle = "rgba(255,255,255,.06)";
  c.lineWidth = 1;
  for(i = 0; i <= ZONES_L; i++){
    c.beginPath();
    c.moveTo(ox + i * PAS_ZONE * e, oy);
    c.lineTo(ox + i * PAS_ZONE * e, oy + GH * e);
    c.stroke();
  }
  for(i = 0; i <= ZONES_H; i++){
    c.beginPath();
    c.moveTo(ox, oy + i * PAS_ZONE * e);
    c.lineTo(ox + GW * e, oy + i * PAS_ZONE * e);
    c.stroke();
  }

  /* les défenses telles qu'elles sortiraient du générateur */
  for(i = 0; i < m.batiments.length; i++){
    var b = m.batiments[i];
    var cb = COUL_PLAN[b.t]; if(!cb) continue;
    c.fillStyle = cb;
    c.beginPath();
    c.arc(ox + b.gx * e, oy + b.gy * e, Math.max(1.1, b.e * e * 0.40), 0, 6.2832);
    c.fill();
  }

  /* le Brasier */
  var qx = ox + QG_GX * e, qy = oy + QG_GY * e;
  var g = c.createRadialGradient(qx, qy, 0, qx, qy, 26 * e);
  g.addColorStop(0, "rgba(255,120,30,.40)");
  g.addColorStop(1, "rgba(255,120,30,0)");
  c.fillStyle = g;
  c.beginPath(); c.arc(qx, qy, 26 * e, 0, 6.2832); c.fill();
  c.fillStyle = "#ff8a1e";
  c.beginPath(); c.arc(qx, qy, 4.2 * e, 0, 6.2832); c.fill();
  c.strokeStyle = "#ffe0a0"; c.lineWidth = Math.max(1.4, e * 0.3);
  c.beginPath(); c.arc(qx, qy, 5.6 * e, 0, 6.2832); c.stroke();
}

/* ---------------------------------------------------------------
   Peinture
   --------------------------------------------------------------- */
function peintZoneEn(sx, sy){
  var g = planVersCase(sx, sy);
  if(g.gx < 0 || g.gy < 0 || g.gx >= GW || g.gy >= GH) return false;
  var i = zoneDePlan(g.gx, g.gy), z = planZones[i], v;
  if(planCellules){
    /* le pinceau à cellules ne touche QUE son bit : les défenses de
       la zone restent ce qu'elles étaient */
    v = faitZone(zoneType(z), zoneDens(z), 1);
  }else if(planOutil){
    v = faitZone(planOutil, planDensite, zoneChamp(z));
  }else{
    v = 0;                                     // le pinceau neutre efface tout
  }
  if(z === v) return false;
  planZones[i] = v;
  planApercuSale = true;
  return true;
}
function installePlan(){
  var cv = $("planCv");
  if(!cv) return;

  function debut(ev){
    if(planDoigt !== null) return;
    var t = ev.changedTouches ? ev.changedTouches[0] : ev;
    planDoigt = ev.changedTouches ? t.identifier : "souris";
    /* une entrée d'historique par TRAIT, pas par zone : « Annuler »
       doit défaire le geste, pas le pixel */
    planPile.push(planZones.slice());
    if(planPile.length > 40) planPile.shift();
    if(peintZoneEn(t.clientX, t.clientY)){ dessinePlan(); majPanneauPlan(); }
    ev.preventDefault();
  }
  function bouge(ev){
    if(planDoigt === null) return;
    var t = ev.changedTouches ? ev.changedTouches[0] : ev;
    if(ev.changedTouches && t.identifier !== planDoigt) return;
    if(peintZoneEn(t.clientX, t.clientY)){ dessinePlan(); majPanneauPlan(); }
    ev.preventDefault();
  }
  function fin(ev){
    if(planDoigt === null) return;
    planDoigt = null;
    ev.preventDefault();
  }
  cv.addEventListener("touchstart", debut, { passive:false });
  cv.addEventListener("touchmove",  bouge, { passive:false });
  cv.addEventListener("touchend",   fin,   { passive:false });
  cv.addEventListener("touchcancel", fin,  { passive:false });
  cv.addEventListener("mousedown", debut);
  window.addEventListener("mousemove", bouge);
  window.addEventListener("mouseup", fin);

  $("planPalette").addEventListener("click", function(ev){
    if(!ev.target.closest) return;
    if(ev.target.closest("[data-cell]")){ basculeCellulesPlan(); return; }
    var e = ev.target.closest("[data-outil]");
    if(e) choisitOutilPlan(+e.getAttribute("data-outil"));
  });
  $("planDensites").addEventListener("click", function(ev){
    var e = ev.target.closest ? ev.target.closest("[data-dens]") : null;
    if(e) choisitDensitePlan(+e.getAttribute("data-dens"));
  });
  $("btPlan").addEventListener("click", ouvrePlan);
  $("btPlanFerme").addEventListener("click", fermePlan);
  $("btPlanAnnule").addEventListener("click", function(){
    if(!planPile.length) return;
    planZones = planPile.pop();
    planApercuSale = true;
    dessinePlan(); majPanneauPlan();
  });
  $("btPlanVide").addEventListener("click", function(){
    planPile.push(planZones.slice());
    planZones = planVide();
    planApercuSale = true;
    dessinePlan(); majPanneauPlan();
  });
  /* Garder par défaut : rien ne part sur le réseau, rien ne change
     pour le salon. Le brouillon attend simplement dans ce navigateur
     et se retrouve à la prochaine ouverture de l'éditeur. */
  $("btPlanDefaut").addEventListener("click", function(){
    var ch = encodePlan(planZones);
    if(!ch){
      alert("Rien à garder : la carte est vierge.\n\n"
          + "Peins au moins une zone, puis réessaie.");
      return;
    }
    if(!gardePlanDefaut(ch)){
      alert("Impossible d'écrire dans ce navigateur (mode privé ?).");
      return;
    }
    alert("Plan gardé comme brouillon par défaut sur cet appareil.\n\n"
        + "Il te sera proposé à chaque ouverture de l'éditeur, tant que le\n"
        + "salon n'a pas son propre plan. Ça ne change RIEN pour les autres\n"
        + "joueurs — pour ça, il faut « Valider pour tout le salon ».");
  });
  $("btPlanOubli").addEventListener("click", function(){
    if(!planDefaut()){ alert("Aucun plan par défaut gardé sur cet appareil."); return; }
    if(!confirm("Oublier le plan par défaut de cet appareil ?")) return;
    gardePlanDefaut("");
    alert("Oublié.");
  });
  $("btPlanValide").addEventListener("click", validePlan);
  window.addEventListener("resize", function(){
    if($("plan").classList.contains("on")){ ajustePlanCv(); dessinePlan(); }
  });
}

/* ---------------------------------------------------------------
   Le compte rendu, et la validation
   --------------------------------------------------------------- */
function comptePlan(){
  var m = apercuPlan(), par = {}, i, n = 0, cel = 0;
  for(i = 0; i < m.batiments.length; i++){
    var t = m.batiments[i].t;
    if(t === "cellule"){ cel++; continue; }
    par[t] = (par[t] || 0) + 1; n++;
  }
  return { par:par, total:n, cellules:cel, peintes:zonesPeintes(planZones) };
}
/* La fiche d'une défense, telle qu'on la lit avant de la poser :
   ce qu'elle est, puis les seuls chiffres qui changent une décision —
   ce qu'elle encaisse, jusqu'où elle tire, ce qu'elle fait mal, et à
   quel rythme. Les bâtiments inertes n'ont ni portée ni cadence : on
   dit alors franchement qu'ils ne se défendent pas. */
function ficheDefense(t){
  var f = DEF[t], s = f.desc + ".<br>" + f.pv + " PV";
  if(!f.portee){
    return s + " — ne tire pas, il n'est là que pour être détruit.";
  }
  s += " · portée " + f.portee.toFixed(1).replace(".", ",");
  if(f.porteeMin){
    s += " (aveugle sous " + f.porteeMin.toFixed(1).replace(".", ",") + ")";
  }
  s += "<br>" + f.degats + " dégâts toutes les "
     + (f.cadence / 1000).toFixed(2).replace(".", ",") + " s";
  var t2 = [];
  if(f.zone)    t2.push("dégâts de zone");
  if(f.cone)    t2.push("en cône");
  if(f.ralenti) t2.push("ralentit");
  if(f.verrou)  t2.push("verrouille sa cible");
  if(t2.length) s += "<br><i>" + t2.join(", ") + "</i>";
  return s;
}

function majPanneauPlan(){
  var c = comptePlan(), s = [], t;
  for(t in c.par) s.push(c.par[t] + " " + DEF[t].nom.toLowerCase());
  s.sort(function(a, b){ return parseInt(b, 10) - parseInt(a, 10); });
  $("planCompte").innerHTML =
    "<b>" + c.peintes + "</b> zone" + (c.peintes > 1 ? "s" : "") + " peinte"
    + (c.peintes > 1 ? "s" : "") + " sur " + NB_ZONES + "<br>"
    + "<b>" + c.total + "</b> défenses : " + s.slice(0, 5).join(", ") + "<br>"
    + "<b>" + c.cellules + "</b> cellules à récolter";

  var outil = TYPES_PLAN[planOutil];
  $("planInfo").innerHTML = planCellules
    ? "<b>Cellules</b><br>Sème un champ de cellules énergétiques PAR-DESSUS "
      + "ce que la zone contient déjà. Les défenses restent en place : "
      + "c'est de la récolte sous le feu."
    : outil === "vide"
      ? "<b>Gomme forte</b><br>Plus rien ne pousse ici : ni défense, "
        + "ni renfort, ni mirador, ni champ de cellules. Terrain nu."
    : planOutil
      ? "<b>" + DEF[outil].nom + "</b> — " + DENSITES[planDensite].nom
        + "<br>" + ficheDefense(outil)
      : "<b>Pinceau neutre</b><br>La zone repasse en défenses d'origine, "
        + "celles que la génération aurait posées toute seule.";

  /* Un avertissement, jamais un blocage : c'est sa carte, il a le droit
     de la rendre infernale. On lui dit seulement ce qu'il fait. */
  var a = "";
  if(c.total + c.cellules > 2200) a = "Carte énorme : ça ramera sur téléphone.";
  else if(c.total > 900) a = "Carte très chargée : ça va ramer sur téléphone.";
  else if(c.total < 120) a = "Très peu de défenses : la partie sera courte.";
  $("planAvert").textContent = a;
}

function validePlan(){
  var chaine = encodePlan(planZones);
  if(chaine === planSalon){
    alert("Ce plan est déjà celui du salon. Rien n'a changé.");
    return;
  }
  var mot = prompt("Mot de passe pour changer le plan du salon :");
  if(mot === null) return;
  if(mot.trim().toLowerCase() !== MOT_RAZ){
    alert("Mot de passe incorrect. Le plan n'a pas été touché.");
    return;
  }
  if(!confirm("Appliquer ce plan À TOUT LE SALON ?\n\n"
            + "• les défenses sont retirées au sort selon tes zones\n"
            + "• l'île repart intacte, pour tout le monde\n"
            + "• les dégâts déjà infligés sont perdus\n\n"
            + "C'est inévitable : les bâtiments ne sont plus les mêmes.")) return;

  enregistrePlan(chaine);
  if(enJeu){
    nouvelleCarte(carteSalon);
    if(typeof construitFondMini === "function") construitFondMini();
    if(typeof majBarres === "function") majBarres();
  }
  majMondes();
  rafraichitPlan();
  fermePlan();
  alert("Plan appliqué. Tout le salon joue désormais cette carte.");
}

/* Le résumé du briefing, rafraîchi quand le plan change — ici ou
   ailleurs, puisqu'un autre appareil peut l'avoir changé. */
function rafraichitPlan(){
  var e = $("planResume");
  if(!e) return;
  if(!planSalon){
    e.textContent = "Défenses d'origine — la carte que tout le monde connaît.";
    return;
  }
  var z = decodePlan(planSalon), n = zonesPeintes(z), par = {}, i;
  for(i = 0; i < NB_ZONES; i++){
    var t = zoneType(z[i]);
    if(t) par[TYPES_PLAN[t]] = (par[TYPES_PLAN[t]] || 0) + 1;
    if(zoneChamp(z[i])) par.cellule = (par.cellule || 0) + 1;
  }
  var s = [];
  for(var k in par) s.push(k === "vide" ? "gommées à fond" : DEF[k].nom);
  e.textContent = n + " zone" + (n > 1 ? "s" : "") + " peinte" + (n > 1 ? "s" : "")
    + " sur " + NB_ZONES + " — " + (s.length ? s.join(", ") : "gommées")
    + ". Tirage n°" + tirageSalon + ".";
}
