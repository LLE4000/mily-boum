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

/* ---------------------------------------------------------------
   CE QUE CHAQUE ÎLE A DE PROPRE, ET QUE LE PLAN NE TOUCHE JAMAIS

   Le décor n'est pas rangé dans la carte : la carte ne retient qu'une
   position, une taille et un numéro de variante, de 0 à 3. C'est le
   BIOME qui décide, au moment de dessiner, si la variante 1 est un
   tipi ou un olivier — et le biome est écrit dans CARTES, pas dans le
   plan. Aucune édition ne peut donc changer la NATURE du décor d'une
   île : la soirée hippie aura ses combis et ses guirlandes quoi qu'on
   peigne dessus.

   Cette table ne sert qu'à le DIRE au joueur, en toutes lettres, dans
   le panneau de l'éditeur. Elle est le miroir de dessineDecor() ; si
   l'un change, l'autre doit suivre.
   --------------------------------------------------------------- */
var FAMILLES_DECOR = {
  plage   : ["palmiers", "buissons", "touffes sèches", "coquillages"],
  foret   : ["sapins", "buissons", "souches"],
  campagne: ["meules de foin", "buissons", "bouts de clôture", "sillons"],
  hippie  : ["combis", "tipis", "guirlandes", "feux de camp"],
  sud     : ["cyprès", "oliviers", "lavandes", "murets de pierre sèche"],
  jungle  : ["arbres géants", "lianes", "fougères", "hautes herbes", "tapis de sol"],
  guinguette:["guirlandes", "tables de fête", "lampadaires", "tonneaux"],
  tenebres: ["fissures de lave", "aiguilles de basalte", "vasques", "arbres calcinés"],
  ibiza   : ["parasols", "transats", "palmiers", "carrés lounge"]
};
function decorDeLIle(i){
  var b = CARTES[i] ? CARTES[i].biome : "plage";
  return FAMILLES_DECOR[b] || [];
}

/* LA CARTE EN COURS D'ÉDITION. C'est la variable qui manquait : sans
   elle, l'éditeur ne savait pas sur quelle île il travaillait, et le
   plan qu'il produisait était servi aux cinq. */
var planCarteIdx = 0;
var planZones = null;        // le brouillon en cours d'édition
var planPile = [];           // historique, pour « Annuler »
var planOutil = 1;           // indice dans TYPES_PLAN (0 = pinceau neutre)
var planDensite = 2;         // indice dans DENSITES

/* ---------------------------------------------------------------
   LE COMPAS

   Le pinceau ne sait peindre que des carrés de huit cases : on ne
   trace pas un anneau avec, ni une ligne en travers de l'île, ni un
   massif qui se vide vers ses bords. Les formes vivent à côté de lui,
   dans la même carte et dans la même chaîne enregistrée, et passent
   PAR-DESSUS lui — la dernière posée l'emporte, comme une pile de
   calques.
   --------------------------------------------------------------- */
var planMode = 0;            // 0 = pinceau, 1 = formes
var planFormes = [];         // les formes de la carte en cours d'édition
var planOutilForme = -1;     // -1 = sélectionner, 0..4 = la forme à tracer
var planSel = -1;            // la forme sélectionnée, -1 si aucune
var planTrace = null;        // { f, x0, y0 } pendant qu'on tire une forme
var planPoly = null;         // les sommets d'un polygone en cours de pose
var planPoignee = -1;        // la poignée qu'on est en train de tirer
/* Un geste n'entre qu'une fois dans l'historique, même s'il envoie
   cent événements de glissé. */
var planDejaEmpile = 0;
/* LE DÉCALAGE DE PRISE. On attrape rarement une poignée en plein
   centre, et jamais une grande forme en son milieu : sans ce
   décalage, saisir un cercle près de son bord le TÉLÉPORTE, son
   centre venant se coller sous le doigt. On retient donc l'écart au
   moment de la prise et on le rejoue à chaque glissé — la forme suit
   le doigt au lieu de sauter dedans. */
var planPriseDx = 0, planPriseDy = 0;
/* Sous le doigt, une poignée doit être ATTRAPABLE. Ces deux nombres
   sont en pixels CSS — ceux du doigt — et non en pixels du canevas :
   sur une tablette à deux pixels par point, les compter dans le
   canevas les aurait rendus deux fois plus petits que prévu, soit
   cinq points de rayon. C'est la différence entre un outil qu'on
   utilise et un outil qu'on subit. */
var R_POIGNEE_CSS = 13, PRISE_POIGNEE_CSS = 24;
var planDpr = 1;
function rPoignee(){ return R_POIGNEE_CSS * planDpr; }
function prisePoignee(){ return PRISE_POIGNEE_CSS * planDpr; }
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
function planDefaut(i){
  try{ return localStorage.getItem(CLE_PLAN_DEFAUT + "." + (i | 0)) || ""; }catch(e){ return ""; }
}
function gardePlanDefaut(s, i){
  try{
    var c = CLE_PLAN_DEFAUT + "." + (i | 0);
    if(s) localStorage.setItem(c, s);
    else localStorage.removeItem(c);
    return true;
  }catch(e){ return false; }
}

/* ---------------------------------------------------------------
   L'HISTORIQUE LÉGER — trois versions par carte

   Pas un système de versions : trois photos, la dernière enregistrée
   en tête. C'est ce qu'il faut pour rattraper une mauvaise
   modification, et rien de plus. Local à cet appareil, comme le
   brouillon : c'est le carnet de bord du créateur, pas l'état du
   salon.
   --------------------------------------------------------------- */
var VERSIONS_GARDEES = 3;
function historiquePlan(i){
  try{
    var t = JSON.parse(localStorage.getItem(CLE_PLAN_DEFAUT + ".h." + (i | 0)) || "[]");
    return (t instanceof Array) ? t : [];
  }catch(e){ return []; }
}
function pousseHistoriquePlan(i, chaine){
  var h = historiquePlan(i);
  /* Enregistrer deux fois la même chose ne doit pas consommer une
     place de l'historique : on n'y garderait plus rien d'utile. */
  if(h.length && h[0] === chaine) return h;
  h.unshift(chaine);
  h = h.slice(0, VERSIONS_GARDEES);
  try{ localStorage.setItem(CLE_PLAN_DEFAUT + ".h." + (i | 0), JSON.stringify(h)); }catch(e){}
  return h;
}
var planCv = null, planCtx = null;
var planEch = 1, planOx = 0, planOy = 0;   // carte → pixels du canevas
var planApercu = null;       // carte générée pour l'aperçu
/* LA GRAINE DE L'APERÇU. Le bouton « Régénérer » ne change QUE ce
   nombre : les zones, les densités et les proportions restent les
   mêmes, seule la réalisation change. C'est exactement la distinction
   entre le modèle enregistré et la partie qu'on en tire. */
/* LE TIRAGE DE L'APERÇU. Il vaut par défaut CELUI DU SALON, et c'est
   un correctif : il valait 0, alors que la partie joue `tirageSalon`.
   Même plan, même intention, mais deux réalisations sans rapport —
   mesuré : sur 629 défenses, UNE SEULE tombait au même endroit dans
   l'aperçu et dans la partie. On dessinait donc une carte et on en
   jouait une autre, ce qui se voyait surtout là où l'on avait pris
   soin de masser ses défenses.
   « Régénérer » explore toujours d'autres variantes, mais le panneau
   dit désormais laquelle est jouée pour de vrai. */
var planGraine = 0;
var planApercuSale = true;
var planDoigt = null;        // identifiant du doigt qui peint

/* ---------------------------------------------------------------
   Ouverture / fermeture
   --------------------------------------------------------------- */
/* `ou` : l'index de la carte à éditer. Par défaut, celle que le salon
   joue en ce moment — c'est celle qu'on vient de regarder. */
function ouvrePlan(ou){
  planCarteIdx = (typeof ou === "number") ? ou : carteSalon;
  /* on ouvre TOUJOURS sur le tirage que le salon joue : c'est la carte
     que les joueurs ont sous les yeux */
  planGraine = tirageSalon | 0;
  chargeCarteDansEditeur();
  $("plan").classList.add("on");
  construitPalettePlan();
  construitOngletsCartes();
  /* On rouvre TOUJOURS sur l'île entière. Garder le cadrage d'une
     session précédente déposerait le créateur au fond d'un coin sans
     lui dire où il est ; le zoom, lui, est à un appui. */
  planVueLibre = false;
  ajustePlanCv();
  basculeModePlan(planMode);      // reconstruit les deux outillages et redessine
}
/* Charge dans l'éditeur le plan de la carte courante. Le plan du salon
   fait foi ; à défaut le brouillon gardé sur cet appareil POUR CETTE
   CARTE ; à défaut, pour la jungle, son plan gravé ; à défaut, une
   carte vierge. */
function chargeCarteDansEditeur(){
  var dep = planCarte(planSalon, planCarteIdx) || planDefaut(planCarteIdx);
  if(!dep && carteSpeciale(planCarteIdx)) dep = planJungle();
  chargeChaineDansEditeur(dep);
  planPile = [];
}
/* Une chaîne de plan → l'éditeur. Un seul endroit sait la couper en
   deux : le quadrillage d'un côté, les formes de l'autre. Tout ce qui
   charge un plan — le salon, le brouillon, l'historique, la copie
   d'une autre carte — passe par ici, faute de quoi il en manquerait
   toujours une moitié quelque part. */
function chargeChaineDansEditeur(s){
  planZones = partieQuadrillage(s) ? decodePlan(partieQuadrillage(s)) : planVide();
  planFormes = decodeFormes(partieFormes(s));
  planSel = planFormes.length ? 0 : -1;
  planTrace = null; planPoly = null; planPoignee = -1;
  planApercuSale = true;
}
/* Et la chaîne que l'éditeur produit. Symétrique de la précédente,
   et pour la même raison. */
function chainePlanCourante(){
  return encodePlanComplet(planZones, planFormes);
}
/* Passer d'une carte à l'autre sans quitter l'éditeur. C'est ce qui
   permet de les COMPARER, et donc de vérifier qu'elles ont bien des
   identités différentes. */
function choisitCartePlan(i){
  if(i === planCarteIdx) return;
  var enCours = chainePlanCourante();
  var gardee = planCarte(planSalon, planCarteIdx) || planDefaut(planCarteIdx);
  if(enCours !== gardee && (zonesPeintes(planZones) || planFormes.length) &&
     !confirm("La carte « " + CARTES[planCarteIdx].nom + " » a des modifications\n"
            + "qui ne sont pas enregistrées. Les abandonner ?")) return;
  planCarteIdx = i | 0;
  chargeCarteDansEditeur();
  construitOngletsCartes();
  ajustePlanCv();
  construitListeFormes(); construitFicheForme();
  majPanneauPlan();
  dessinePlan();
}
/* Les onglets des six cartes, en tête de l'éditeur. */
function construitOngletsCartes(){
  var e = $("planCartes");
  if(!e) return;
  var h = "";
  for(var i = 0; i < CARTES.length; i++){
    var edite = !!planCarte(planSalon, i);
    h += '<div class="poc' + (i === planCarteIdx ? " on" : "")
       + (carteSpeciale(i) ? " evt" : "") + '" data-carte="' + i + '">'
       + echappe(CARTES[i].nom.replace(/^Mily /, ""))
       + (edite ? '<i title="cette carte a son propre plan enregistré">●</i>' : "")
       + '</div>';
  }
  e.innerHTML = h;
  var els = e.querySelectorAll("[data-carte]");
  for(var k = 0; k < els.length; k++){
    els[k].addEventListener("click", function(){
      choisitCartePlan(+this.getAttribute("data-carte"));
    });
  }
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

/* =================================================================
   LES PANNEAUX DU COMPAS
   ================================================================= */
var ICONE_FORME = ["◯", "◎", "▭", "╱", "⬠"];

function basculeModePlan(m){
  planMode = m | 0;
  planTrace = null; planPoly = null; planPoignee = -1;
  $("planBlocPinceau").style.display = planMode ? "none" : "";
  $("planBlocFormes").style.display  = planMode ? "" : "none";
  var e = $("planModes").querySelectorAll("[data-mode]"), i;
  for(i = 0; i < e.length; i++) e[i].classList.toggle("on", (+e[i].getAttribute("data-mode")) === planMode);
  construitOutilsFormes();
  construitListeFormes();
  construitFicheForme();
  majPanneauPlan();
  dessinePlan();
}
function construitOutilsFormes(){
  var e = $("planFormesOutils");
  if(!e) return;
  var h = '<div class="pz' + (planOutilForme < 0 ? " on" : "") + '" data-forme="-1">'
        + '<i style="background:#5adc8c"></i>Sélectionner</div>', i;
  for(i = 0; i < FORMES_PLAN.length; i++){
    h += '<div class="pz' + (i === planOutilForme ? " on" : "") + '" data-forme="' + i + '" '
       + 'title="' + FORMES_PLAN[i].desc + '">' + ICONE_FORME[i] + " "
       + FORMES_PLAN[i].nom + '</div>';
  }
  h += '<div class="pz" data-suggere="1"><i style="background:#ffd84a"></i>Suggestions</div>';
  e.innerHTML = h;
}
/* Un résumé lisible d'une forme : ce qu'elle est, où elle est, et de
   quoi elle est faite. Il tient sur une ligne parce que la liste doit
   rester survolable d'un coup d'œil. */
function resumeForme(F){
  var G = F.G, g;
  switch(F.f){
    case 0: g = "r " + Math.round(G[2]) + " en " + Math.round(G[0]) + "," + Math.round(G[1]); break;
    case 1: g = Math.round(Math.min(G[2], G[3])) + "→" + Math.round(Math.max(G[2], G[3])); break;
    case 2: g = Math.round(G[2]) + "×" + Math.round(G[3]); break;
    case 3: g = "long " + Math.round(Math.hypot(G[2] - G[0], G[3] - G[1]))
              + ", ép. " + Math.round(G[4]); break;
    default: g = (G.length >> 1) + " sommets";
  }
  return g;
}
function construitListeFormes(){
  var e = $("planListe");
  if(!e) return;
  if(!planFormes.length){
    e.innerHTML = '<div class="planAide">Aucune forme. Choisis un outil ci-dessus '
      + 'et <b>tire sur la carte</b>. Les formes passent par-dessus le pinceau : '
      + 'la dernière posée est celle qu\'on voit.</div>';
    return;
  }
  var h = "", i, j;
  /* la dernière posée en tête : c'est elle qui recouvre les autres */
  for(i = planFormes.length - 1; i >= 0; i--){
    var F = planFormes[i], pastilles = "";
    for(j = 0; j < F.C.length; j++){
      pastilles += '<s style="background:' + coulOutilPlan(F.C[j][0]) + '"></s>';
    }
    if(!F.C.length && F.k === 1) pastilles = '<s style="background:' + COUL_PLAN.cellule + '"></s>';
    h += '<div class="pfo' + (i === planSel ? " on" : "") + '" data-forme-i="' + i + '">'
       + '<span class="g">' + ICONE_FORME[F.f] + '</span>'
       + '<span class="n"><b>' + FORMES_PLAN[F.f].nom + '</b> '
       + '<span class="g">' + resumeForme(F) + '</span></span>'
       + '<em>' + pastilles + '</em>'
       + '<button class="pfa" data-monte="' + i + '" title="Passer devant">▲</button>'
       + '<button class="pfa" data-dup="' + i + '" title="Dupliquer">⧉</button>'
       + '<button class="pfa danger" data-sup="' + i + '" title="Supprimer">✕</button>'
       + '</div>';
  }
  e.innerHTML = h;
}
/* La fiche de la forme sélectionnée : sa composition, sa densité, sa
   répartition, sa couche, et sa graine. Tout ce qu'une zone du
   quadrillage ne pouvait pas porter. */
function construitFicheForme(){
  var e = $("planFiche");
  if(!e) return;
  var F = planFormes[planSel];
  if(!F){
    e.innerHTML = '<div class="planAide">Touche une forme sur la carte ou dans la '
      + 'liste pour la régler.</div>';
    return;
  }
  var h = '<div class="tt">Composition</div>', i;
  if(!F.C.length){
    h += '<div class="planAide">Aucun type imposé : la génération décide, '
       + 'et la forme ne règle que la densité'
       + (F.k ? ' et la récolte' : '') + '.</div>';
  }
  for(i = 0; i < F.C.length; i++){
    h += '<div class="pcp"><i style="background:' + coulOutilPlan(F.C[i][0]) + '"></i>'
       + '<span class="nm">' + echappe(nomOutilPlan(F.C[i][0])) + '</span>'
       + '<button class="pfa" data-melmoins="' + i + '">−</button>'
       + '<span class="pc">' + Math.round(partDuMelange(F, i) * 100) + ' %</span>'
       + '<button class="pfa" data-melplus="' + i + '">+</button>'
       + '<button class="pfa danger" data-melsup="' + i + '">✕</button></div>';
  }
  /* LA PALETTE DES TYPES, ICI ET PAS AILLEURS.
     Elle vivait dans le bloc du pinceau — lequel est CACHÉ dès qu'on
     passe au compas. On ne pouvait donc rien mettre d'autre dans une
     forme que le type sélectionné avant de changer de mode, et le
     bouton répétait « + Ajouter Crible » sans qu'on puisse en sortir.
     Toucher un type l'ajoute au mélange ; le retoucher l'enlève. */
  h += '<div class="planAide">Touche un type pour l\'ajouter au mélange '
     + '(ou le retirer) :</div><div class="pzs" id="planTypes">';
  for(i = 0; i < TYPES_PLAN.length; i++){
    var dedans = -1, j;
    for(j = 0; j < F.C.length; j++) if(F.C[j][0] === i) dedans = j;
    h += '<div class="pz' + (dedans >= 0 ? " on" : "") + '" data-ajtype="' + i + '">'
       + '<i style="background:' + coulOutilPlan(i) + '"></i>'
       + echappe(nomOutilPlan(i)) + '</div>';
  }
  h += '</div>';

  h += '<div class="tt">Répartition</div><select id="selRep">';
  for(i = 0; i < REPARTITIONS.length; i++)
    h += '<option value="' + i + '"' + (i === F.r ? " selected" : "") + '>'
       + REPARTITIONS[i].nom + '</option>';
  h += '</select><div class="planAide">' + REPARTITIONS[F.r].desc + '</div>';

  h += '<div class="tt">Densité</div><select id="selDens">';
  for(i = 0; i < DENSITES.length; i++)
    h += '<option value="' + i + '"' + (i === F.d ? " selected" : "") + '>'
       + DENSITES[i].nom + '</option>';
  h += '</select>';

  h += '<div class="tt">Couche</div><select id="selCouche">';
  for(i = 0; i < COUCHES_PLAN.length; i++)
    h += '<option value="' + i + '"' + (i === F.k ? " selected" : "") + '>'
       + COUCHES_PLAN[i] + '</option>';
  h += '</select>';
  if(F.k){
    h += '<div class="planAide">La récolte se sème par zones de ' + PAS_ZONE
       + ' cases : une forme plus petite que ça n\'en portera pas.</div>';
  }

  h += '<div class="tt">Tirage</div><div class="rg">'
     + '<button class="pfa" id="btFixe">' + (F.x ? "🔒" : "🎲") + '</button>'
     + '<span class="planAide" style="flex:1">'
     + (F.x ? "Figée : cette forme se rejoue à l'identique à chaque partie (graine n°"
              + F.g + ")."
            : "Libre : elle se retire au sort à chaque remise à zéro, comme le reste "
              + "de la carte.")
     + '</span>'
     + '<button class="pfa" id="btGraine" title="Une autre variante de cette forme">🎲+</button>'
     + '</div>';
  e.innerHTML = h;
}
/* Toute modification d'une forme passe par ici : l'aperçu se salit, la
   table de fraction d'aire s'oublie, les panneaux se refont. */
function formeModifiee(){
  formeChangee(planFormes[planSel]);
  planApercuSale = true;
  construitListeFormes(); construitFicheForme();
  dessinePlan(); majPanneauPlan();
}
function poussePile(){
  planPile.push({ z:planZones.slice(), f:copieFormes(planFormes) });
  if(planPile.length > 40) planPile.shift();
}
function copieFormes(l){
  var o = [], i;
  for(i = 0; i < l.length; i++){
    var F = l[i];
    o.push({ f:F.f, k:F.k, d:F.d, r:F.r, x:F.x, g:F.g,
             G:F.G.slice(), C:F.C.map(function(p){ return [p[0], p[1]]; }) });
  }
  return o;
}
function choisitForme(i){
  planSel = (i === planSel) ? planSel : i;
  construitListeFormes(); construitFicheForme(); dessinePlan();
}

/* ---------------------------------------------------------------
   Le canevas : la carte à plat, une couleur par défense
   --------------------------------------------------------------- */
/* ================================================================
   LA VUE DE L'ÉDITEUR — cadrage, zoom et déplacement

   Il n'y en avait pas : planEch/planOx/planOy étaient posés une fois
   par ajustePlanCv pour faire tenir l'île entière, et rien ne pouvait
   plus les changer. Sur une île de 152 × 136 cases ramenée à la
   largeur d'un panneau, une case fait deux ou trois pixels : poser
   une forme au doigt à cette échelle, c'est viser à l'aveugle. Le
   multi-touch était même refusé par construction — « if(planDoigt
   !== null) return » écartait le second doigt —, donc une pincée
   était impossible.

   Trois nombres suffisent, et ils restent LES MÊMES que le dessin et
   planVersCase lisent déjà : on ne change pas le contrat, on rend
   simplement ces nombres réglables.
   ================================================================ */
var planFit = { e:1, ox:0, oy:0 };     // le cadrage « tout tient »
var planVueLibre = false;              // le joueur a-t-il zoomé lui-même ?
var PLAN_ZOOM_MAX = 6;

function poseCadragePlan(){
  planFit.e  = Math.min(planCv.width / GW, planCv.height / GH);
  planFit.ox = (planCv.width  - GW * planFit.e) / 2;
  planFit.oy = (planCv.height - GH * planFit.e) / 2;
}
/* La carte ne quitte jamais le canevas : elle le couvre tant qu'elle
   est plus grande que lui, et se recentre dès qu'elle est plus
   petite. Pas de marge, pas de vide sur les bords — on édite, on ne
   contemple pas. */
function bornePlanVue(){
  planEch = Math.max(planFit.e, Math.min(planFit.e * PLAN_ZOOM_MAX, planEch));
  var w = GW * planEch, h = GH * planEch;
  planOx = (w <= planCv.width)  ? (planCv.width  - w) / 2
                                : Math.max(planCv.width  - w, Math.min(0, planOx));
  planOy = (h <= planCv.height) ? (planCv.height - h) / 2
                                : Math.max(planCv.height - h, Math.min(0, planOy));
}
/* Zoome autour d'un point du CANEVAS : ce point ne bouge pas d'un
   pixel, c'est ce qui fait qu'on zoome « là où on regarde ». */
function zoomPlanVers(cx, cy, k){
  var av = planEch;
  planEch = Math.max(planFit.e, Math.min(planFit.e * PLAN_ZOOM_MAX, planEch * k));
  if(planEch === av) return false;
  planOx = cx - (cx - planOx) * (planEch / av);
  planOy = cy - (cy - planOy) * (planEch / av);
  planVueLibre = planEch > planFit.e * 1.001;
  bornePlanVue();
  return true;
}
function recadrePlan(){
  planEch = planFit.e; planOx = planFit.ox; planOy = planFit.oy;
  planVueLibre = false;
}
/* Un point d'écran en pixels de canevas — c'est l'unité de la vue. */
function planPixels(sx, sy){
  var r = planCv.getBoundingClientRect();
  var dpr = planCv.width / Math.max(1, r.width);
  return { x:(sx - r.left) * dpr, y:(sy - r.top) * dpr };
}

function ajustePlanCv(){
  planCv = $("planCv");
  if(!planCv) return;
  var r = planCv.getBoundingClientRect();
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  planDpr = dpr;
  planCv.width  = Math.max(2, Math.round(r.width  * dpr));
  planCv.height = Math.max(2, Math.round(r.height * dpr));
  planCtx = planCv.getContext("2d");
  /* On retient le point de carte visé par le CENTRE du canevas avant
     de changer sa taille, et on le remet dessous après : tourner la
     tablette ne doit pas déplacer ce qu'on est en train d'éditer. */
  var vise = planVueLibre && planEch > 0
             ? { gx:(planCv.width / 2 - planOx) / planEch,
                 gy:(planCv.height / 2 - planOy) / planEch } : null;
  var facteur = planVueLibre && planFit.e > 0 ? planEch / planFit.e : 1;
  poseCadragePlan();
  if(!vise){ recadrePlan(); return; }
  planEch = planFit.e * facteur;
  planOx = planCv.width / 2 - vise.gx * planEch;
  planOy = planCv.height / 2 - vise.gy * planEch;
  bornePlanVue();
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
    /* La carte ÉDITÉE, et pas la première : sans cet index, l'aperçu
       montrait toujours la plage quelle que soit l'île choisie, et
       comparer deux cartes devenait impossible. */
    planApercu = genereCarte(CODE_SALON, planCarteIdx, chainePlanCourante(), planGraine);
    planApercuSale = false;
  }
  return planApercu;
}

function dessinePlan(){
  if(!planCtx) return;
  var c = planCtx, e = planEch, ox = planOx, oy = planOy;
  var m = apercuPlan();

  /* Le fond prend les couleurs du BIOME de la carte éditée : c'est ce
     qui permet de reconnaître d'un coup d'œil sur laquelle on
     travaille, et de comparer deux identités sans se tromper. */
  var bio = BIOMES[CARTES[planCarteIdx].biome] || BIOMES.plage;
  c.fillStyle = bio.ciel; c.fillRect(0, 0, planCv.width, planCv.height);
  c.fillStyle = bio.sol1; c.fillRect(ox, oy, PLAGE_X0 * e, GH * e);
  c.fillStyle = bio.sable; c.fillRect(ox + PLAGE_X0 * e, oy, (GW - PLAGE_X0) * e, GH * e);
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

  /* LE DÉCOR ET LES BÊTES, sous les défenses.
     Ils ne sont pas là pour décorer l'éditeur : ils sont la PREUVE, à
     l'écran, que peindre des défenses ne les efface pas. On les
     dessine donc à chaque aperçu, discrètement, dans le vert de la
     végétation et l'ambre des bestioles. */
  var decVerts = { plage:"#4fae62", foret:"#3f8a45", campagne:"#8a9a52",
                   hippie:"#c86ad0", sud:"#7fa06a", jungle:"#3fa05c",
                   guinguette:"#e8a94a", tenebres:"#e2551a", ibiza:"#1fb9c9" };
  c.fillStyle = decVerts[CARTES[planCarteIdx].biome] || "#4fae62";
  c.globalAlpha = 0.55;
  for(i = 0; i < m.decors.length; i++){
    var dd = m.decors[i];
    c.fillRect(ox + dd.gx * e - e * 0.35, oy + dd.gy * e - e * 0.35, e * 0.7, e * 0.7);
  }
  c.globalAlpha = 0.42;
  c.fillStyle = "#6b6478";
  for(i = 0; i < m.rochers.length; i++){
    var rr = m.rochers[i];
    c.fillRect(ox + rr.gx * e - e * 0.3, oy + rr.gy * e - e * 0.3, e * 0.6, e * 0.6);
  }
  c.globalAlpha = 0.9;
  for(i = 0; i < m.creatures.length; i++){
    var kk = m.creatures[i];
    c.fillStyle = (ESPECES_PROTEGEES.indexOf(kk.t) >= 0) ? "#ff9ecb" : "#e0a24a";
    c.beginPath();
    c.arc(ox + kk.gx * e, oy + kk.gy * e, Math.max(0.9, e * 0.34), 0, 6.2832);
    c.fill();
  }
  c.globalAlpha = 1;

  /* les défenses telles qu'elles sortiraient du générateur */
  for(i = 0; i < m.batiments.length; i++){
    var b = m.batiments[i];
    var cb = COUL_PLAN[b.t]; if(!cb) continue;
    c.fillStyle = cb;
    c.beginPath();
    c.arc(ox + b.gx * e, oy + b.gy * e, Math.max(1.1, b.e * e * 0.40), 0, 6.2832);
    c.fill();
  }

  /* les formes, PAR-DESSUS les défenses : c'est l'ordre dans lequel
     elles agissent, l'éditeur doit le montrer tel quel */
  dessineFormes(c, e, ox, oy);

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
   LES FORMES, DESSINÉES
   Le contour dit la géométrie, le remplissage dit la composition —
   des bandes obliques aux couleurs du mélange, dans les proportions
   demandées. On lit donc « 70 % de Frelons » sans avoir à ouvrir la
   fiche, et sans avoir à compter les points de l'aperçu.
   --------------------------------------------------------------- */
function cheminForme(c, F, e, ox, oy){
  var G = F.G, i, n;
  c.beginPath();
  switch(F.f){
    case 0: c.arc(ox + G[0] * e, oy + G[1] * e, Math.max(1, G[2] * e), 0, 6.2832); break;
    case 1:
      c.arc(ox + G[0] * e, oy + G[1] * e, Math.max(1, Math.max(G[2], G[3]) * e), 0, 6.2832);
      /* le trou, en sens inverse : la règle du pair-impair le creuse */
      c.moveTo(ox + (G[0] + Math.min(G[2], G[3])) * e, oy + G[1] * e);
      c.arc(ox + G[0] * e, oy + G[1] * e, Math.max(0.5, Math.min(G[2], G[3]) * e),
            0, 6.2832, true);
      break;
    case 2: c.rect(ox + G[0] * e, oy + G[1] * e, G[2] * e, G[3] * e); break;
    case 3:
      var dx = G[2] - G[0], dy = G[3] - G[1], ln = Math.hypot(dx, dy) || 1;
      var nx = -dy / ln * G[4] * 0.5, ny = dx / ln * G[4] * 0.5;
      c.moveTo(ox + (G[0] + nx) * e, oy + (G[1] + ny) * e);
      c.lineTo(ox + (G[2] + nx) * e, oy + (G[3] + ny) * e);
      c.lineTo(ox + (G[2] - nx) * e, oy + (G[3] - ny) * e);
      c.lineTo(ox + (G[0] - nx) * e, oy + (G[1] - ny) * e);
      c.closePath();
      break;
    case 4:
      n = G.length >> 1;
      for(i = 0; i < n; i++){
        var px = ox + G[i * 2] * e, py = oy + G[i * 2 + 1] * e;
        if(i) c.lineTo(px, py); else c.moveTo(px, py);
      }
      c.closePath();
      break;
  }
}
function dessineFormes(c, e, ox, oy){
  if(!planFormes.length && !planPoly) return;
  var i, j;
  /* Bornées à l'île. Le Brasier est à neuf cases du bord ouest : un
     anneau autour de lui déborde forcément, et sans ce cadrage il
     peignait le fond noir hors carte — on lisait une intention là où
     le générateur ne pose rien. */
  c.save();
  c.beginPath();
  c.rect(ox, oy, GW * e, GH * e);
  c.clip();
  for(i = 0; i < planFormes.length; i++){
    var F = planFormes[i], choisie = (i === planSel && planMode === 1);
    c.save();
    cheminForme(c, F, e, ox, oy);
    c.clip("evenodd");
    /* le mélange, en bandes obliques proportionnelles */
    var B = boiteForme(F);
    var x0 = ox + B.x0 * e, y0 = oy + B.y0 * e;
    var lg = (B.x1 - B.x0) * e, ht = (B.y1 - B.y0) * e;
    /* Un voile sombre d'abord : les six biomes n'ont pas le même sol,
       et un mélange de Pilons olive sur le sable de la plage ne se
       voyait tout simplement pas. Le voile donne à toutes les formes
       le même fond, donc la même lisibilité partout. */
    c.globalAlpha = 0.22; c.fillStyle = "#0b0713";
    c.fillRect(x0, y0, lg, ht);
    var som = sommeMelange(F);
    if(som > 0){
      var pas = Math.max(7, Math.min(22, (lg + ht) / 14)), t = 0;
      for(j = 0; j < F.C.length; j++){
        var part = F.C[j][1] / som;
        c.fillStyle = coulOutilPlan(F.C[j][0]);
        c.globalAlpha = TYPES_PLAN[F.C[j][0]] === "vide" ? 0.34 : 0.26;
        /* une bande par type, répétée le long de la diagonale */
        for(var d0 = -ht; d0 < lg + ht; d0 += pas){
          c.beginPath();
          c.moveTo(x0 + d0 + pas * t, y0);
          c.lineTo(x0 + d0 + pas * (t + part), y0);
          c.lineTo(x0 + d0 + pas * (t + part) - ht, y0 + ht);
          c.lineTo(x0 + d0 + pas * t - ht, y0 + ht);
          c.closePath(); c.fill();
        }
        t += part;
      }
    }else{
      c.globalAlpha = 0.16;
      c.fillStyle = F.k ? COUL_PLAN.cellule : "#8f86a0";
      c.fillRect(x0, y0, lg, ht);
    }
    c.restore();

    /* le contour */
    c.save();
    cheminForme(c, F, e, ox, oy);
    c.strokeStyle = choisie ? "#8ff0b4" : "rgba(160,235,190,.55)";
    c.lineWidth = choisie ? Math.max(2, e * 0.30) : Math.max(1.2, e * 0.18);
    if(!choisie) c.setLineDash([e * 1.4, e * 1.0]);
    c.stroke();
    c.restore();

    /* la couche « cellules » se signale par un liseré jaune */
    if(F.k){
      c.save();
      cheminForme(c, F, e, ox, oy);
      c.strokeStyle = COUL_PLAN.cellule;
      c.globalAlpha = 0.75;
      c.lineWidth = Math.max(1, e * 0.12);
      c.setLineDash([e * 0.7, e * 1.3]);
      c.stroke();
      c.restore();
    }

    /* les poignées, seulement sur la forme choisie : sinon la carte
       disparaît sous les pastilles */
    if(choisie){
      var P = poigneesForme(F);
      for(j = 0; j < P.length; j++){
        var hx = ox + P[j].x * e, hy = oy + P[j].y * e;
        c.beginPath(); c.arc(hx, hy, rPoignee(), 0, 6.2832);
        c.fillStyle = P[j].id === "c" ? "#ffd84a" : "#8ff0b4";
        c.globalAlpha = 0.92; c.fill(); c.globalAlpha = 1;
        c.strokeStyle = "#0d1a14"; c.lineWidth = 2.2; c.stroke();
      }
    }
  }
  /* le polygone en cours de pose : ses sommets et le fil qui les joint */
  if(planPoly && planPoly.length >= 2){
    c.save();
    c.strokeStyle = "#ffd84a"; c.lineWidth = 2.4; c.setLineDash([6, 5]);
    c.beginPath();
    for(i = 0; i * 2 + 1 < planPoly.length; i++){
      var qx2 = ox + planPoly[i * 2] * e, qy2 = oy + planPoly[i * 2 + 1] * e;
      if(i) c.lineTo(qx2, qy2); else c.moveTo(qx2, qy2);
    }
    c.stroke();
    c.setLineDash([]);
    for(i = 0; i * 2 + 1 < planPoly.length; i++){
      c.beginPath();
      c.arc(ox + planPoly[i * 2] * e, oy + planPoly[i * 2 + 1] * e, rPoignee() * 0.8, 0, 6.2832);
      c.fillStyle = "#ffd84a"; c.fill();
      c.strokeStyle = "#0d1a14"; c.lineWidth = 2; c.stroke();
    }
    c.restore();
  }
  c.restore();
}

/* =================================================================
   LE COMPAS — tracer, attraper, régler

   Trois gestes et pas un de plus, parce qu'on dessine au doigt :
     — un outil choisi, on TIRE sur la carte : la forme naît ;
     — sans outil, on TOUCHE une forme : elle se sélectionne ;
     — sélectionnée, elle montre ses poignées : on les TIRE.
   Le polygone est le seul à sortir de là — il se pose sommet par
   sommet, et se ferme quand on le dit.
   ================================================================= */

/* Les poignées d'une forme, en coordonnées de carte. L'identifiant
   dit ce que la poignée commande ; bougePoignee est le seul endroit
   qui sache le traduire. « c » déplace la forme entière. */
function poigneesForme(F){
  var G = F.G, l = [], i, n, C;
  switch(F.f){
    case 0:
      l.push({ id:"c", x:G[0], y:G[1] });
      l.push({ id:"r", x:G[0] + G[2], y:G[1] });
      break;
    case 1:
      l.push({ id:"c", x:G[0], y:G[1] });
      l.push({ id:"r0", x:G[0] + Math.min(G[2], G[3]), y:G[1] });
      l.push({ id:"r1", x:G[0] + Math.max(G[2], G[3]), y:G[1] });
      break;
    case 2:
      l.push({ id:"c", x:G[0] + G[2] / 2, y:G[1] + G[3] / 2 });
      l.push({ id:"a", x:G[0], y:G[1] });
      l.push({ id:"b", x:G[0] + G[2], y:G[1] + G[3] });
      break;
    case 3:
      l.push({ id:"c", x:(G[0] + G[2]) / 2, y:(G[1] + G[3]) / 2 });
      l.push({ id:"a", x:G[0], y:G[1] });
      l.push({ id:"b", x:G[2], y:G[3] });
      /* la poignée d'épaisseur se place perpendiculairement au milieu :
         c'est là qu'on va la chercher instinctivement */
      var dx = G[2] - G[0], dy = G[3] - G[1], ln = Math.hypot(dx, dy) || 1;
      l.push({ id:"e", x:(G[0] + G[2]) / 2 - dy / ln * G[4] * 0.5,
                       y:(G[1] + G[3]) / 2 + dx / ln * G[4] * 0.5 });
      break;
    case 4:
      C = centreForme(F);
      l.push({ id:"c", x:C.x, y:C.y });
      n = G.length >> 1;
      for(i = 0; i < n; i++) l.push({ id:"p" + i, x:G[i * 2], y:G[i * 2 + 1] });
      break;
  }
  return l;
}
function bougePoignee(F, id, gx, gy){
  var G = F.G, i, n, C, dx, dy;
  if(id === "c"){
    C = centreForme(F);
    dx = gx - C.x; dy = gy - C.y;
    if(F.f === 0 || F.f === 1){ G[0] += dx; G[1] += dy; }
    else if(F.f === 2){ G[0] += dx; G[1] += dy; }
    else if(F.f === 3){ G[0] += dx; G[1] += dy; G[2] += dx; G[3] += dy; }
    else { n = G.length >> 1;
           for(i = 0; i < n; i++){ G[i * 2] += dx; G[i * 2 + 1] += dy; } }
    formeChangee(F);
    return;
  }
  switch(F.f){
    case 0: G[2] = Math.max(1.5, Math.hypot(gx - G[0], gy - G[1])); break;
    case 1:
      var d = Math.max(0.5, Math.hypot(gx - G[0], gy - G[1]));
      if(id === "r0") G[2] = Math.min(d, G[3] - 1);
      else            G[3] = Math.max(d, G[2] + 1);
      break;
    case 2:
      if(id === "a"){ G[2] += G[0] - gx; G[3] += G[1] - gy; G[0] = gx; G[1] = gy; }
      else          { G[2] = gx - G[0];  G[3] = gy - G[1]; }
      if(G[2] < 2){ G[2] = 2; } if(G[3] < 2){ G[3] = 2; }
      break;
    case 3:
      if(id === "a"){ G[0] = gx; G[1] = gy; }
      else if(id === "b"){ G[2] = gx; G[3] = gy; }
      else {
        var mx = (G[0] + G[2]) / 2, my = (G[1] + G[3]) / 2;
        G[4] = Math.max(1.5, Math.hypot(gx - mx, gy - my) * 2);
      }
      break;
    case 4:
      i = parseInt(id.substr(1), 10);
      if(i >= 0 && i * 2 + 1 < G.length){ G[i * 2] = gx; G[i * 2 + 1] = gy; }
      break;
  }
  formeChangee(F);
}
/* La poignée sous le doigt, en pixels : c'est la tolérance à l'écran
   qui compte, pas la distance en cases — au dézoom, deux sommets
   voisins tombent sur le même pixel. */
function poigneeAuPoint(F, gx, gy){
  if(!F) return -1;
  var l = poigneesForme(F), i, meilleure = -1, pire = prisePoignee();
  for(i = 0; i < l.length; i++){
    var d = Math.hypot((l[i].x - gx) * planEch, (l[i].y - gy) * planEch);
    if(d < pire){ pire = d; meilleure = i; }
  }
  return meilleure;
}
/* La forme sous le doigt : la dernière posée d'abord, comme à la
   génération. Toucher une pile rend donc celle qu'on voit. */
function formeAuPoint(gx, gy){
  for(var i = planFormes.length - 1; i >= 0; i--)
    if(formeContient(planFormes[i], gx, gy)) return i;
  return -1;
}

/* Une forme neuve prend l'outil et la densité courants : on vient de
   les choisir, ce serait absurde de les redemander. */
function formeNeuve(f, gx, gy){
  var C = planOutil ? [[planOutil, 100]] : [];
  return { f:f, k:0, d:planDensite, r:0, x:0, g:(planFormes.length * 37) % 997,
           G:geoDepart(f, gx, gy), C:C };
}
function geoDepart(f, gx, gy){
  switch(f){
    case 0: return [gx, gy, 2];
    case 1: return [gx, gy, 1, 2];
    case 2: return [gx, gy, 2, 2];
    case 3: return [gx, gy, gx + 2, gy, 6];
    case 4: return [gx, gy, gx + 2, gy, gx + 2, gy + 2];
  }
  return [gx, gy, 2];
}
/* Ce que le glissé fabrique pendant qu'on tire. Le rayon intérieur de
   l'anneau suit l'extérieur à 55 % : une couronne, pas un disque
   presque plein. */
function tireForme(F, x0, y0, gx, gy){
  var G = F.G, d = Math.hypot(gx - x0, gy - y0);
  switch(F.f){
    case 0: G[0] = x0; G[1] = y0; G[2] = Math.max(1.5, d); break;
    case 1: G[0] = x0; G[1] = y0; G[3] = Math.max(2.5, d); G[2] = G[3] * 0.55; break;
    case 2: G[0] = Math.min(x0, gx); G[1] = Math.min(y0, gy);
            G[2] = Math.max(2, Math.abs(gx - x0)); G[3] = Math.max(2, Math.abs(gy - y0));
            break;
    case 3: G[0] = x0; G[1] = y0; G[2] = gx; G[3] = gy; break;
  }
  formeChangee(F);
}

/* --- LE MÉLANGE ---
   Les parts sont gardées en interne, les pourcentages en sont déduits.
   Régler l'un rééchelonne les autres : le total fait toujours cent, et
   le joueur n'a jamais à faire l'arithmétique. */
function sommeMelange(F){
  var s = 0, i;
  for(i = 0; i < F.C.length; i++) s += F.C[i][1];
  return s;
}
function partDuMelange(F, i){
  var s = sommeMelange(F);
  return s > 0 ? F.C[i][1] / s : 0;
}
function ajouteAuMelange(F, t){
  var i;
  for(i = 0; i < F.C.length; i++) if(F.C[i][0] === t) return;
  if(F.C.length >= 6) return;                    // au-delà, plus personne ne lit
  F.C.push([t, sommeMelange(F) ? sommeMelange(F) / Math.max(1, F.C.length) : 100]);
  normaliseMelange(F);
}
function retireDuMelange(F, i){ F.C.splice(i, 1); normaliseMelange(F); }
/* LES POIDS SONT RAMENÉS À UNE SOMME FIXE APRÈS CHAQUE RÉGLAGE.

   Sans cela, ils grimpaient sans borne : pousser une entrée à 95 %
   multiplie son poids par dix-neuf, et l'appui suivant repart de là.
   Or encodeFormes fait passer chaque poids par entierPlan, qui BORNE
   à 9999 — au-delà, la proportion enregistrée n'est plus celle qu'on
   voit. Mesuré : après sept réglages sur une forme à six types, le
   poids atteignait 19 344, la fiche annonçait 80 % et la carte
   relue en appliquait 67. Le panneau mentait, sans rien dire.

   On normalise donc à 1000, assez fin pour qu'un dixième de pour cent
   reste distinct, assez loin de 9999 pour que la borne ne serve
   jamais. Ce que la fiche affiche est alors exactement ce qui part
   dans le plan. */
var SOMME_MELANGE = 1000;
function normaliseMelange(F){
  var s = sommeMelange(F), i;
  if(!(s > 0)) return;
  for(i = 0; i < F.C.length; i++)
    F.C[i][1] = Math.max(1, Math.round(F.C[i][1] * SOMME_MELANGE / s));
}
/* Décale la PART AFFICHÉE de cette entrée de « pas », en laissant aux
   autres leur proportion relative. La formule vient de p = w/(w+r). */
function regleMelange(F, i, pas){
  var s = sommeMelange(F);
  if(s <= 0 || F.C.length < 2){ F.C[i][1] = 100; return; }
  var p = F.C[i][1] / s, reste = s - F.C[i][1];
  var but = Math.min(0.95, Math.max(0.05, Math.round((p + pas) * 20) / 20));
  F.C[i][1] = reste * but / (1 - but);
  normaliseMelange(F);
}

function decaleForme(F, dx, dy){
  var G = F.G, i, n;
  switch(F.f){
    case 0: case 1: case 2: G[0] += dx; G[1] += dy; break;
    case 3: G[0] += dx; G[1] += dy; G[2] += dx; G[3] += dy; break;
    case 4: n = G.length >> 1;
            for(i = 0; i < n; i++){ G[i * 2] += dx; G[i * 2 + 1] += dy; }
            break;
  }
  formeChangee(F);
}

/* --- LES FORMES SUGGÉRÉES ---
   Un point de départ par carte, pas un décor imposé : on les pose, on
   les tire, on les jette. C'est ce qui manque le plus quand on ouvre
   un outil de dessin devant une île vide. */
function formesSuggerees(i){
  var qx = QG_GX, qy = QG_GY, mil = PLAGE_X0 / 2;
  var l = [
    { nom:"Anneau de Frelons autour du Brasier",
      F:{ f:1, k:0, d:3, r:0, x:0, g:11, G:[qx, qy, 14, 30], C:[[3, 70], [4, 30]] } },
    { nom:"Bastion au cœur de l'île",
      F:{ f:0, k:0, d:4, r:4, x:0, g:23, G:[mil, GH / 2, 26],
          C:[[5, 45], [3, 30], [2, 25]] } },
    { nom:"Mur de Pilons devant la plage",
      F:{ f:2, k:0, d:3, r:1, x:0, g:31, G:[PLAGE_X0 - 26, 8, 20, GH - 16],
          C:[[4, 60], [1, 40]] } },
    { nom:"Couloir dégagé jusqu'au Brasier",
      F:{ f:3, k:0, d:0, r:0, x:0, g:43, G:[PLAGE_X0 - 4, GH / 2, qx + 12, qy, 12],
          C:[[8, 100]] } },
    { nom:"Champ de récolte au sud",
      F:{ f:0, k:1, d:0, r:0, x:0, g:53, G:[mil, GH - 26, 22], C:[] } },
    { nom:"Couronne de récolte sous le feu",
      F:{ f:1, k:2, d:3, r:0, x:0, g:61, G:[qx, qy, 34, 48], C:[[3, 50], [5, 50]] } }
  ];
  return l;
}
function proposeFormes(){
  var l = formesSuggerees(planCarteIdx), i, txt = [];
  for(i = 0; i < l.length; i++) txt.push((i + 1) + " = " + l[i].nom);
  var rep = prompt("FORMES SUGGÉRÉES pour « " + CARTES[planCarteIdx].nom + " »\n\n"
    + txt.join("\n") + "\n\n"
    + "Elle s'ajoute par-dessus ce qui existe, et reste modifiable :\n"
    + "tu peux la tirer, la régler, ou la supprimer.\n\n"
    + "Numéro de la forme à poser :");
  if(rep === null) return;
  var k = parseInt(rep, 10) - 1;
  if(!(k >= 0) || k >= l.length){ message2("Numéro inconnu — rien n'a été posé."); return; }
  poussePile();
  planFormes.push(copieFormes([l[k].F])[0]);
  planSel = planFormes.length - 1;
  planOutilForme = -1;
  planApercuSale = true;
  construitOutilsFormes(); construitListeFormes(); construitFicheForme();
  dessinePlan(); majPanneauPlan();
  message2("« " + l[k].nom + " » posée. Tire ses poignées pour l'ajuster.");
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
/* ---------------------------------------------------------------
   LES TROIS GESTES DU COMPAS
   Un seul point d'entrée par phase du geste — début, glissé, fin —
   et c'est l'état courant qui décide de ce qu'il veut dire. Le
   polygone est le seul cas où le début suffit : il pose un sommet et
   attend le suivant.
   --------------------------------------------------------------- */
function debutForme(sx, sy){
  var g = planVersCase(sx, sy);
  if(g.gx < 0 || g.gy < 0 || g.gx >= GW || g.gy >= GH) return;

  /* 1. une poignée de la forme choisie a la priorité sur tout le
        reste : on vient de la voir, on la vise */
  if(planSel >= 0 && planOutilForme < 0){
    var ph = poigneeAuPoint(planFormes[planSel], g.gx, g.gy);
    if(ph >= 0){
      poussePile(); planDejaEmpile = 1; planPoignee = ph;
      var PP = poigneesForme(planFormes[planSel])[ph];
      planPriseDx = PP.x - g.gx; planPriseDy = PP.y - g.gy;
      return;
    }
  }
  /* 2. le polygone se pose sommet par sommet */
  if(planOutilForme === 4){
    if(!planPoly){ poussePile(); planPoly = []; }
    planPoly.push(g.gx, g.gy);
    /* revenir sur le premier sommet ferme le contour — le geste que
       tout le monde essaie en premier */
    if(planPoly.length >= 8 &&
       Math.hypot((g.gx - planPoly[0]) * planEch, (g.gy - planPoly[1]) * planEch) < prisePoignee()){
      planPoly.length -= 2;
      fermePolygone();
      return;
    }
    dessinePlan(); majPanneauPlan();
    return;
  }
  /* 3. un outil de forme : on tire une forme neuve */
  if(planOutilForme >= 0){
    poussePile();
    var F = formeNeuve(planOutilForme, g.gx, g.gy);
    planFormes.push(F);
    planSel = planFormes.length - 1;
    planTrace = { x0:g.gx, y0:g.gy };
    planApercuSale = true;
    construitListeFormes(); construitFicheForme();
    dessinePlan();
    return;
  }
  /* 4. sinon, on sélectionne ce qu'on touche. Sélectionner ne modifie
        rien : pas d'entrée d'historique — sauf si le doigt glisse
        ensuite, et c'est bougeForme qui l'empile alors. */
  var i = formeAuPoint(g.gx, g.gy);
  planSel = i;
  planPoignee = -1; planDejaEmpile = 0; planPriseDx = 0; planPriseDy = 0;
  if(i >= 0){
    /* le centre : toucher-glisser déplace la forme, sans la faire
       sauter sous le doigt */
    planPoignee = 0;
    var C0 = poigneesForme(planFormes[i])[0];
    planPriseDx = C0.x - g.gx; planPriseDy = C0.y - g.gy;
  }
  construitListeFormes(); construitFicheForme(); dessinePlan(); majPanneauPlan();
}
function bougeForme(sx, sy){
  var g = planVersCase(sx, sy);
  if(planTrace && planOutilForme >= 0 && planOutilForme !== 4){
    tireForme(planFormes[planSel], planTrace.x0, planTrace.y0, g.gx, g.gy);
    planApercuSale = true;
    dessinePlan();
    return;
  }
  if(planPoignee >= 0 && planSel >= 0){
    /* Le glissé qui suit une simple sélection : c'est LUI qui modifie,
       donc c'est lui qui empile, et une seule fois pour tout le
       geste. */
    if(!planDejaEmpile){ poussePile(); planDejaEmpile = 1; }
    var F = planFormes[planSel];
    var P = poigneesForme(F);
    if(P[planPoignee])
      bougePoignee(F, P[planPoignee].id, g.gx + planPriseDx, g.gy + planPriseDy);
    planApercuSale = true;
    dessinePlan();
  }
}
function finForme(){
  /* Une forme qu'on a seulement effleurée n'en est pas une : elle
     serait invisible et impossible à rattraper. On la retire plutôt
     que de laisser un point mort dans la liste. */
  if(planTrace && planSel >= 0){
    var F = planFormes[planSel], B = boiteForme(F);
    if((B.x1 - B.x0) < 2 && (B.y1 - B.y0) < 2){
      planFormes.splice(planSel, 1);
      planSel = -1;
      message2("Forme trop petite — tire un peu plus loin pour la tracer.");
    }
  }
  /* L'OUTIL SE DÉSARME DÈS QUE LA FORME EST TRACÉE.
     Il restait armé : le toucher suivant retraçait une forme par-dessus
     au lieu d'attraper une poignée, et l'on ne pouvait plus ajuster ce
     qu'on venait de dessiner sans aller décocher l'outil soi-même.
     Personne ne devine ça. On repasse donc en « Sélectionner », la
     forme neuve est choisie, ses poignées sont sous le doigt. */
  var venaitDeTracer = !!planTrace;
  planTrace = null; planPoignee = -1; planDejaEmpile = 0;
  planPriseDx = 0; planPriseDy = 0;
  var desarme = 0;
  if(venaitDeTracer && planSel >= 0 && planOutilForme >= 0){
    planOutilForme = -1;
    construitOutilsFormes();
    desarme = 1;
  }
  planApercuSale = true;
  construitListeFormes(); construitFicheForme();
  dessinePlan(); majPanneauPlan();
  /* APRÈS majPanneauPlan, jamais avant : c'est elle qui réécrit le
     bandeau, et un conseil posé plus tôt disparaissait aussitôt. */
  if(desarme) message2("Forme posée. Tire la poignée JAUNE pour la déplacer, "
                     + "les VERTES pour la redimensionner.");
}
function fermePolygone(){
  if(!planPoly || planPoly.length < 6){
    planPoly = null;
    message2("Un polygone demande au moins trois sommets.");
    dessinePlan();
    return;
  }
  var F = formeNeuve(4, 0, 0);
  F.G = planPoly.slice();
  planFormes.push(F);
  planSel = planFormes.length - 1;
  planPoly = null;
  planOutilForme = -1;
  planApercuSale = true;
  construitOutilsFormes(); construitListeFormes(); construitFicheForme();
  dessinePlan(); majPanneauPlan();
}

function installePlan(){
  var cv = $("planCv");
  if(!cv) return;

  /* ---- LA PINCÉE À DEUX DOIGTS ----
     Deux doigts ne dessinent pas : ils cadrent. Dès que le second se
     pose, le trait en cours est ABANDONNÉ — c'est le geste attendu, et
     laisser courir un trait pendant qu'on zoome poserait des formes au
     hasard. Un doigt reste l'outil, deux doigts sont la vue : aucune
     modalité à apprendre. */
  var pince = null;
  function deuxDoigts(ev){
    if(!ev.touches || ev.touches.length < 2) return null;
    var a = ev.touches[0], b = ev.touches[1];
    var pa = planPixels(a.clientX, a.clientY), pb = planPixels(b.clientX, b.clientY);
    return { d:Math.hypot(pb.x - pa.x, pb.y - pa.y),
             cx:(pa.x + pb.x) / 2, cy:(pa.y + pb.y) / 2 };
  }
  function debutPince(ev){
    var p = deuxDoigts(ev);
    if(!p) return false;
    /* on lâche le trait en cours, proprement */
    if(planDoigt !== null){ if(planMode) finForme(); planDoigt = null; }
    pince = p;
    return true;
  }
  function bougePince(ev){
    var p = deuxDoigts(ev);
    if(!pince || !p) return false;
    if(pince.d > 4 && p.d > 4) zoomPlanVers(p.cx, p.cy, p.d / pince.d);
    /* le glissé des deux doigts déplace la carte du même mouvement */
    planOx += p.cx - pince.cx;
    planOy += p.cy - pince.cy;
    if(planEch > planFit.e * 1.001) planVueLibre = true;
    bornePlanVue();
    pince = p;
    dessinePlan();
    return true;
  }

  function debut(ev){
    if(ev.touches && ev.touches.length >= 2){ debutPince(ev); ev.preventDefault(); return; }
    if(planDoigt !== null) return;
    var t = ev.changedTouches ? ev.changedTouches[0] : ev;
    planDoigt = ev.changedTouches ? t.identifier : "souris";
    /* Une entrée d'historique par TRAIT, pas par zone : « Annuler »
       doit défaire le geste, pas le pixel. Au compas c'est debutForme
       qui empile, et seulement quand le geste modifie vraiment quelque
       chose : sans ça, chaque simple sélection consommerait une place
       et « Annuler » ne remonterait plus nulle part. */
    if(planMode) debutForme(t.clientX, t.clientY);
    else{
      poussePile();
      if(peintZoneEn(t.clientX, t.clientY)){ dessinePlan(); majPanneauPlan(); }
    }
    ev.preventDefault();
  }
  function bouge(ev){
    if(pince && ev.touches && ev.touches.length >= 2){ bougePince(ev); ev.preventDefault(); return; }
    if(planDoigt === null) return;
    var t = ev.changedTouches ? ev.changedTouches[0] : ev;
    if(ev.changedTouches && t.identifier !== planDoigt) return;
    if(planMode) bougeForme(t.clientX, t.clientY);
    else if(peintZoneEn(t.clientX, t.clientY)){ dessinePlan(); majPanneauPlan(); }
    ev.preventDefault();
  }
  function fin(ev){
    /* Tant qu'il reste deux doigts, on cadre encore. En dessous, la
       pincée s'achève — et le doigt restant ne se met PAS à dessiner :
       il faudrait le relever et le reposer, sinon lâcher un doigt en
       fin de zoom laisserait une trace en travers de la carte. */
    if(pince){
      if(ev.touches && ev.touches.length >= 2){ ev.preventDefault(); return; }
      pince = null;
      planDoigt = null;
      majPanneauPlan();
      ev.preventDefault();
      return;
    }
    if(planDoigt === null) return;
    planDoigt = null;
    if(planMode) finForme();
    ev.preventDefault();
  }
  /* La molette, pour qui édite à la souris. Le zoom se fait sous le
     pointeur, comme partout ailleurs dans le jeu. */
  function molette(ev){
    var p = planPixels(ev.clientX, ev.clientY);
    if(zoomPlanVers(p.x, p.y, ev.deltaY < 0 ? 1.18 : 1 / 1.18)){
      dessinePlan(); majPanneauPlan();
    }
    ev.preventDefault();
  }
  cv.addEventListener("wheel", molette, { passive:false });

  function boutonVue(id, f){
    var b = $(id);
    if(b) b.addEventListener("click", function(){ f(); dessinePlan(); majPanneauPlan(); });
  }
  boutonVue("btPlanZp",  function(){ zoomPlanVers(planCv.width / 2, planCv.height / 2, 1.35); });
  boutonVue("btPlanZm",  function(){ zoomPlanVers(planCv.width / 2, planCv.height / 2, 1 / 1.35); });
  boutonVue("btPlanFit", recadrePlan);
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

  /* --- LE COMPAS : ses panneaux --- */
  $("planModes").addEventListener("click", function(ev){
    var e = ev.target.closest ? ev.target.closest("[data-mode]") : null;
    if(e) basculeModePlan(+e.getAttribute("data-mode"));
  });
  $("planFormesOutils").addEventListener("click", function(ev){
    if(!ev.target.closest) return;
    if(ev.target.closest("[data-suggere]")){ proposeFormes(); return; }
    var e = ev.target.closest("[data-forme]");
    if(!e) return;
    /* changer d'outil abandonne un polygone commencé : le laisser en
       suspens serait un piège, on ne le verrait plus */
    if(planPoly && +e.getAttribute("data-forme") !== 4) planPoly = null;
    planOutilForme = +e.getAttribute("data-forme");
    construitOutilsFormes();
    majPanneauPlan();
    dessinePlan();
  });
  $("planListe").addEventListener("click", function(ev){
    if(!ev.target.closest) return;
    var b;
    if((b = ev.target.closest("[data-sup]"))){
      poussePile();
      var i = +b.getAttribute("data-sup");
      planFormes.splice(i, 1);
      if(planSel >= planFormes.length) planSel = planFormes.length - 1;
      planApercuSale = true;
      construitListeFormes(); construitFicheForme(); dessinePlan(); majPanneauPlan();
      return;
    }
    if((b = ev.target.closest("[data-dup]"))){
      poussePile();
      var j = +b.getAttribute("data-dup");
      var co = copieFormes([planFormes[j]])[0];
      /* décalée de quelques cases : deux formes superposées à
         l'identique sont indiscernables et impossibles à attraper */
      decaleForme(co, 6, 6);
      co.g = (co.g + 101) % 997;
      planFormes.push(co);
      planSel = planFormes.length - 1;
      planApercuSale = true;
      construitListeFormes(); construitFicheForme(); dessinePlan(); majPanneauPlan();
      return;
    }
    if((b = ev.target.closest("[data-monte]"))){
      poussePile();
      var k = +b.getAttribute("data-monte");
      if(k < planFormes.length - 1){
        var t = planFormes[k]; planFormes[k] = planFormes[k + 1]; planFormes[k + 1] = t;
        planSel = k + 1;
      }
      planApercuSale = true;
      construitListeFormes(); construitFicheForme(); dessinePlan(); majPanneauPlan();
      return;
    }
    if((b = ev.target.closest("[data-forme-i]"))) choisitForme(+b.getAttribute("data-forme-i"));
  });
  $("planFiche").addEventListener("click", function(ev){
    var F = planFormes[planSel];
    if(!F || !ev.target.closest) return;
    var b;
    if((b = ev.target.closest("[data-melmoins]"))){
      poussePile(); regleMelange(F, +b.getAttribute("data-melmoins"), -0.05); formeModifiee(); return;
    }
    if((b = ev.target.closest("[data-melplus]"))){
      poussePile(); regleMelange(F, +b.getAttribute("data-melplus"), 0.05); formeModifiee(); return;
    }
    if((b = ev.target.closest("[data-melsup]"))){
      poussePile(); retireDuMelange(F, +b.getAttribute("data-melsup")); formeModifiee(); return;
    }
    var a = ev.target.closest("[data-ajtype]");
    if(a){
      var t = +a.getAttribute("data-ajtype"), k, dans = -1;
      for(k = 0; k < F.C.length; k++) if(F.C[k][0] === t) dans = k;
      poussePile();
      if(dans >= 0){
        /* on ne vide jamais complètement le mélange par un simple
           toucher : une forme sans type est un cas valable, mais il
           doit se demander, pas se produire par accident */
        if(F.C.length > 1) retireDuMelange(F, dans);
        else message2("Dernier type du mélange — ajoute-en un autre avant de l'enlever.");
      }else{
        ajouteAuMelange(F, t);
        planOutil = t;                       // le pinceau suit, c'est ce qu'on attend
        construitPalettePlan();
      }
      formeModifiee();
      return;
    }
    if(ev.target.closest("#btFixe")){
      poussePile(); F.x = F.x ? 0 : 1; formeModifiee(); return;
    }
    if(ev.target.closest("#btGraine")){
      poussePile(); F.g = (F.g + 17) % 997; F.x = 1; formeModifiee(); return;
    }
  });
  $("planFiche").addEventListener("change", function(ev){
    var F = planFormes[planSel];
    if(!F || !ev.target.id) return;
    poussePile();
    if(ev.target.id === "selRep")    F.r = +ev.target.value;
    if(ev.target.id === "selDens")   F.d = +ev.target.value;
    if(ev.target.id === "selCouche") F.k = +ev.target.value;
    formeModifiee();
  });
  /* L'ENTRÉE DE L'ADMINISTRATION. Elle est protégée : l'éditeur écrit
     désormais le plan de six cartes, et une fausse manœuvre d'un
     joueur de passage y coûterait beaucoup plus cher qu'avant. La
     porte demande donc le mot de passe, et non plus seulement la
     validation. */
  $("btPlan").addEventListener("click", function(){
    var mot = prompt("ADMINISTRATION DES MAPS\n\n"
      + "Six cartes, chacune avec son plan indépendant.\n"
      + "Tu peux les parcourir, les prévisualiser, les éditer.\n\n"
      + "Mot de passe administrateur :");
    if(mot === null) return;
    if(!motAdminValide(mot)){
      alert("Mot de passe incorrect.");
      return;
    }
    ouvrePlan(carteSalon);
  });
  $("btPlanFerme").addEventListener("click", fermePlan);
  $("btPlanAnnule").addEventListener("click", function(){
    if(!planPile.length) return;
    var av = planPile.pop();
    planZones = av.z; planFormes = av.f;
    if(planSel >= planFormes.length) planSel = planFormes.length - 1;
    planApercuSale = true;
    dessinePlan(); majPanneauPlan();
  });
  $("btPlanVide").addEventListener("click", function(){
    poussePile();
    planZones = planVide(); planFormes = []; planSel = -1;
    planApercuSale = true;
    dessinePlan(); majPanneauPlan();
  });
  /* Garder par défaut : rien ne part sur le réseau, rien ne change
     pour le salon. Le brouillon attend simplement dans ce navigateur
     et se retrouve à la prochaine ouverture de l'éditeur. */
  $("btPlanDefaut").addEventListener("click", function(){
    var ch = chainePlanCourante();
    if(!ch){
      alert("Rien à garder : la carte est vierge.\n\n"
          + "Peins au moins une zone, puis réessaie.");
      return;
    }
    if(!gardePlanDefaut(ch, planCarteIdx)){
      alert("Impossible d'écrire dans ce navigateur (mode privé ?).");
      return;
    }
    alert("Brouillon de « " + CARTES[planCarteIdx].nom + " » gardé sur cet appareil.\n\n"
        + "Il te sera reproposé à l'ouverture de l'éditeur tant que le salon\n"
        + "n'a pas son propre plan pour CETTE carte. Ça ne change RIEN pour\n"
        + "les autres cartes, ni pour les autres\n"
        + "joueurs — pour ça, il faut « Enregistrer cette carte ».");
  });
  $("btPlanRegen").addEventListener("click", function(){
    /* Une AUTRE réalisation du même plan. Les zones, les densités et
       les proportions ne bougent pas — seule la graine change. C'est
       exactement la distinction entre le modèle qu'on enregistre et la
       partie qu'on en tire. */
    planGraine = (planGraine + 1) % 1000;
    planApercuSale = true;
    dessinePlan(); majPanneauPlan();
    message2(planGraine === (tirageSalon | 0)
      ? "Te revoilà sur le tirage du salon — c'est la carte réellement jouée."
      : "Variante n°" + planGraine + " — ce n'est PAS la carte jouée. "
        + "Le salon joue le tirage n°" + (tirageSalon | 0) + ".");
  });
  /* LE TIRAGE NEUF, DEMANDÉ EXPRÈS. Il ne l'était pas : enregistrer
     n'importe quel plan le faisait tout seul, et refaisait au passage
     le terrain des six îles. On l'a séparé, et le voici en clair. */
  $("btPlanTirage").addEventListener("click", function(){
    if(!confirm("NOUVEAU TIRAGE pour les six îles ?\n\n"
              + "Les six plans sont gardés au mot près : ce sont les mêmes\n"
              + "recettes. Mais chaque île est réalisée autrement —\n"
              + "autres positions, autres décors, autres bestioles.\n\n"
              + "La campagne repart de la première île, pour tout le salon,\n"
              + "et les dégâts déjà infligés sont perdus.")) return;
    var mot = prompt("Mot de passe pour un nouveau tirage du salon :");
    if(mot === null) return;
    if(!motAdminValide(mot)){ alert("Mot de passe incorrect. Rien n'a bougé."); return; }
    var n = nouveauTirageSalon();
    planGraine = n | 0;            // l'aperçu suit le tirage qu'on vient de poser
    planApercuSale = true;
    if(enJeu){
      nouvelleCarte(carteSalon);
      if(typeof construitFondMini === "function") construitFondMini();
      if(typeof majBarres === "function") majBarres();
    }
    majMondes(); rafraichitPlan();
    dessinePlan(); majPanneauPlan();
    alert("Tirage n°" + n + ". Les six îles sont rejouées,\n"
        + "avec exactement les mêmes plans qu'avant.");
  });
  $("btPlanRestaure").addEventListener("click", restaurePlanCarte);
  $("btPlanRecule").addEventListener("click", reculePlanCarte);
  $("btPlanDup").addEventListener("click", dupliquePlanCarte);
  $("btPlanRaz").addEventListener("click", reinitialisePlanCarte);
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
  return { par:par, total:n, cellules:cel, peintes:zonesPeintes(planZones),
           formes:planFormes.length,
           decors:m.decors.length, rochers:m.rochers.length,
           bestioles:m.creatures.length };
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
  $("planTitre").textContent = "Plan — " + CARTES[planCarteIdx].nom;
  $("planCompte").innerHTML =
    "<b>" + c.peintes + "</b> zone" + (c.peintes > 1 ? "s" : "") + " peinte"
    + (c.peintes > 1 ? "s" : "") + " sur " + NB_ZONES
    + (c.formes ? " · <b>" + c.formes + "</b> forme" + (c.formes > 1 ? "s" : "") : "")
    + "<br>"
    + "<b>" + c.total + "</b> défenses : " + s.slice(0, 5).join(", ") + "<br>"
    + "<b>" + c.cellules + "</b> cellules à récolter<br>"
    /* CE QUE LE PLAN NE REMPLACE JAMAIS. La première question qu'on se
       pose en peignant une carte est « est-ce que je détruis son
       ambiance ». La réponse doit être lisible sans avoir à essayer —
       et elle doit être EXACTE : le plan ne change jamais la NATURE du
       décor (le biome seul en décide), il peut seulement, à la toute
       première sauvegarde d'une île vierge, le redistribuer ailleurs.
       C'est ce que dit la confirmation d'enregistrement. */
    + '<span style="color:#8f86a0">' + c.decors + " "
    + echappe(decorDeLIle(planCarteIdx).slice(0, 3).join(", "))
    + " · " + c.bestioles + " bestioles · " + c.rochers + " rochers<br>"
    + "l'ambiance de l'île — le plan ne la remplace jamais<br>"
    /* CE QU'ON REGARDE : la carte jouée, ou une variante ? Sans ça on
       dessine sur une réalisation et on en joue une autre. */
    + (planGraine === (tirageSalon | 0)
        ? "tirage n°" + (tirageSalon | 0) + " — <b style=\"color:#8ff0b4\">la carte réellement jouée</b>"
        : "variante n°" + planGraine + " — <b style=\"color:#ffd070\">le salon joue le n°"
          + (tirageSalon | 0) + "</b>")
    + "</span>";

  /* En mode compas, l'aide parle de ce qu'on est en train de faire :
     l'outil choisi, ou la forme qu'on règle. */
  if(planMode){
    majInfoForme();
    majAvertPlan(c);
    return;
  }

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

  majAvertPlan(c);
}
/* Un avertissement, jamais un blocage : c'est sa carte, il a le droit
   de la rendre infernale. On lui dit seulement ce qu'il fait.
   Depuis les tourelles gelées et la résolution adaptative, une carte
   saturée reste jouable : le jeu gèle les tourelles au repos et baisse
   la définition au besoin. On prévient encore — un petit téléphone
   n'est pas une tablette — mais on ne condamne plus. */
function majAvertPlan(c){
  var a = "";
  if(c.total + c.cellules > 4500) a = "Carte gigantesque : les petits téléphones baisseront la définition.";
  else if(c.total > 1600) a = "Carte très chargée : la partie sera longue.";
  else if(c.total < 120) a = "Très peu de défenses : la partie sera courte.";
  $("planAvert").textContent = a;
}
/* L'aide du compas. Elle dit d'abord ce que le geste en cours va
   faire — c'est ce qu'on cherche quand on hésite le doigt en l'air —
   puis, une forme sélectionnée, ce qu'elle est. */
function majInfoForme(){
  var e = $("planInfo"), F = planFormes[planSel];
  if(planPoly){
    e.innerHTML = "<b>Polygone</b><br>Touche la carte pour poser un sommet. "
      + ((planPoly.length >> 1) < 3
          ? "Il en faut au moins trois."
          : "Reviens sur le premier sommet pour fermer le contour.")
      + " <i>" + (planPoly.length >> 1) + " posé"
      + ((planPoly.length >> 1) > 1 ? "s" : "") + ".</i>";
    return;
  }
  if(planOutilForme >= 0){
    e.innerHTML = "<b>" + FORMES_PLAN[planOutilForme].nom + "</b><br>"
      + (planOutilForme === 4
          ? "Touche la carte sommet par sommet."
          : "Tire sur la carte pour la tracer — " + FORMES_PLAN[planOutilForme].desc + ".")
      + "<br>Elle naîtra en <i>" + echappe(nomOutilPlan(planOutil)) + "</i>, "
      + "densité <i>" + DENSITES[planDensite].nom + "</i>.";
    return;
  }
  if(!F){
    e.innerHTML = "<b>Sélectionner</b><br>Touche une forme pour la régler, "
      + "puis tire ses poignées : la <i>jaune</i> la déplace, les "
      + "<i>vertes</i> la redimensionnent.";
    return;
  }
  var m = [], i;
  for(i = 0; i < F.C.length; i++)
    m.push(Math.round(partDuMelange(F, i) * 100) + " % " + nomOutilPlan(F.C[i][0]).toLowerCase());
  e.innerHTML = "<b>" + FORMES_PLAN[F.f].nom + "</b> — " + resumeForme(F)
    + "<br>" + (m.length ? m.join(", ") : "défenses d'origine")
    + "<br><i>" + REPARTITIONS[F.r].nom + ", " + DENSITES[F.d].nom
    + (F.k ? ", " + COUCHES_PLAN[F.k].toLowerCase() : "") + "</i>";
}

function validePlan(){
  var chaine = chainePlanCourante();
  var nom = CARTES[planCarteIdx].nom;
  if(chaine === planCarte(planSalon, planCarteIdx)){
    alert("« " + nom + " » a déjà exactement ce plan. Rien n'a changé.");
    return;
  }
  var mot = prompt("Mot de passe pour enregistrer le plan de\n« " + nom + " » :");
  if(mot === null) return;
  if(!motAdminValide(mot)){
    alert("Mot de passe incorrect. Le plan n'a pas été touché.");
    return;
  }
  /* LA PREMIÈRE SAUVEGARDE D'UNE ÎLE VIERGE EST UN CAS À PART, et il
     faut le dire. Le générateur ne tire pas le même nombre de nombres
     selon qu'il suit un plan ou non : franchir cette frontière décale
     la suite du tirage, donc redistribue les décors, les rochers et
     les bestioles de CETTE île. Mesuré sur la soirée hippie : 505
     décors avant, 509 après — les mêmes combis et les mêmes tipis,
     ailleurs. Passer d'un plan à un autre, ensuite, ne les bouge plus
     JAMAIS d'un millième de case. */
  var premiere = !planCarte(planSalon, planCarteIdx);
  var dec = decorDeLIle(planCarteIdx);
  if(!confirm("Enregistrer ce plan pour « " + nom + " » ?\n\n"
            + "• cette carte seule est concernée — les cinq autres ne\n"
            + "  bougent pas d'un pouce, ni leur plan ni leur terrain\n"
            + "• les défenses y sont retirées au sort selon tes zones\n"
            + "• son ambiance reste la sienne : " + dec.slice(0, 3).join(", ")
            + (premiere
                ? "\n  (première sauvegarde de cette île : ils seront\n"
                  + "   redistribués ailleurs — mêmes objets, autres places)"
                : carteSpeciale(planCarteIdx)
                  ? "\n  ils restent en place, sauf ce qui poussait très\n"
                    + "  exactement là où tu poses une défense"
                  : "\n  ils ne bougeront pas d'un pouce")
            + "\n• la campagne repart de la première île, pour tout le salon\n"
            + "• les dégâts déjà infligés sont perdus\n\n"
            + "C'est inévitable : les bâtiments ne sont plus les mêmes.")) return;

  pousseHistoriquePlan(planCarteIdx, chaine);
  enregistrePlanCarte(planCarteIdx, chaine);
  if(enJeu){
    nouvelleCarte(carteSalon);
    if(typeof construitFondMini === "function") construitFondMini();
    if(typeof majBarres === "function") majBarres();
  }
  majMondes();
  rafraichitPlan();
  construitOngletsCartes();
  majPanneauPlan();
  alert("Plan de « " + nom + " » enregistré pour tout le salon.\n\n"
      + "Les autres cartes n'ont pas bougé.");
}

/* --- LES BOUTONS DE SÉCURITÉ --- */
/* Revenir à la dernière version enregistrée pour CETTE carte. */
function restaurePlanCarte(){
  var g = planCarte(planSalon, planCarteIdx);
  var h = historiquePlan(planCarteIdx);
  var src = g || (h.length ? h[0] : "");
  if(!src){
    alert("« " + CARTES[planCarteIdx].nom + " » n'a aucune version enregistrée.");
    return;
  }
  poussePile();
  chargeChaineDansEditeur(src);
  planApercuSale = true;
  dessinePlan(); majPanneauPlan();
}
/* Reculer d'un cran dans les trois versions gardées. */
function reculePlanCarte(){
  var h = historiquePlan(planCarteIdx);
  if(h.length < 2){
    alert("Pas de version antérieure gardée pour cette carte.\n\n"
        + "L'historique retient les " + VERSIONS_GARDEES + " derniers enregistrements,\n"
        + "et il n'y en a " + (h.length ? "qu'un" : "aucun") + " pour l'instant.");
    return;
  }
  var i = h.indexOf(chainePlanCourante());
  var suiv = (i >= 0 && i + 1 < h.length) ? i + 1 : 1;
  poussePile();
  chargeChaineDansEditeur(h[suiv]);
  planApercuSale = true;
  dessinePlan(); majPanneauPlan();
  message2("Version " + (suiv + 1) + " sur " + h.length + " — la plus ancienne gardée est la n°" + h.length);
}
/* Rendre CETTE carte à sa génération d'origine. */
function reinitialisePlanCarte(){
  var nom = CARTES[planCarteIdx].nom;
  if(!confirm("RÉINITIALISER « " + nom + " » ?\n\n"
            + "Son plan est effacé et elle retrouve sa carte d'origine.\n"
            + "Les cinq autres ne sont pas touchées.\n\n"
            + "Cette action est définitive pour le salon.")) return;
  var mot = prompt("Mot de passe pour réinitialiser « " + nom + " » :");
  if(mot === null) return;
  if(!motAdminValide(mot)){ alert("Mot de passe incorrect. Rien n'a été touché."); return; }
  enregistrePlanCarte(planCarteIdx, "");
  chargeChaineDansEditeur(carteSpeciale(planCarteIdx) ? planJungle() : "");
  planPile = [];
  planApercuSale = true;
  majMondes(); rafraichitPlan(); construitOngletsCartes();
  dessinePlan(); majPanneauPlan();
  alert("« " + nom + " » est revenue à sa carte d'origine.");
}
/* Copier le plan d'une autre carte sur celle-ci. */
function dupliquePlanCarte(){
  var l = [], i;
  for(i = 0; i < CARTES.length; i++){
    if(i === planCarteIdx) continue;
    if(!planCarte(planSalon, i)) continue;
    l.push(i + " = " + CARTES[i].nom);
  }
  if(!l.length){
    alert("Aucune autre carte n'a de plan enregistré à copier.");
    return;
  }
  var rep = prompt("Copier le plan d'une autre carte SUR « "
    + CARTES[planCarteIdx].nom + " » ?\n\n" + l.join("\n")
    + "\n\nEntre le numéro de la carte à copier :");
  if(rep === null) return;
  var src = parseInt(rep, 10);
  var ch = planCarte(planSalon, src);
  if(!ch){ alert("Cette carte n'a pas de plan enregistré."); return; }
  poussePile();
  chargeChaineDansEditeur(ch);
  planApercuSale = true;
  dessinePlan(); majPanneauPlan();
  message2("Plan de « " + CARTES[src].nom + " » copié. Il reste à l'enregistrer.");
}
/* Un mot dans le bandeau d'avertissement de l'éditeur : plus discret
   qu'une fenêtre, et il disparaît au prochain rafraîchissement. */
function message2(s){
  var e = $("planAvert");
  if(e) e.textContent = s;
}

/* Le résumé du briefing, rafraîchi quand le plan change — ici ou
   ailleurs, puisqu'un autre appareil peut l'avoir changé. */
function rafraichitPlan(){
  var e = $("planResume");
  if(!e) return;
  var t = decodePlans(planSalon), l = [], i, k;
  for(i = 0; i < CARTES.length; i++){
    if(!t[i]) continue;
    var q = partieQuadrillage(t[i]);
    var z = q ? decodePlan(q) : planVide();
    var n = zonesPeintes(z), par = {}, j;
    for(j = 0; j < NB_ZONES; j++){
      var ty = zoneType(z[j]);
      if(ty) par[TYPES_PLAN[ty]] = (par[TYPES_PLAN[ty]] || 0) + 1;
      if(zoneChamp(z[j])) par.cellule = (par.cellule || 0) + 1;
    }
    /* les formes comptent aussi, et leurs mélanges avec elles */
    var fs = decodeFormes(partieFormes(t[i])), jf, jc;
    for(jf = 0; jf < fs.length; jf++){
      for(jc = 0; jc < fs[jf].C.length; jc++){
        var tf = TYPES_PLAN[fs[jf].C[jc][0]];
        if(tf && tf !== "auto") par[tf] = (par[tf] || 0) + 1;
      }
      if(fs[jf].k) par.cellule = (par.cellule || 0) + 1;
    }
    var noms = [];
    for(k in par) noms.push(k === "vide" ? "gommées à fond" : DEF[k].nom);
    var quoi = [];
    if(n)         quoi.push(n + " zone" + (n > 1 ? "s" : ""));
    if(fs.length) quoi.push(fs.length + " forme" + (fs.length > 1 ? "s" : ""));
    l.push("<b>" + echappe(CARTES[i].nom) + "</b> — "
         + (quoi.length ? quoi.join(", ") : "vierge") + " : "
         + (noms.length ? noms.join(", ") : "gommées"));
  }
  if(!l.length){
    e.textContent = "Chaque carte a ses défenses d'origine. Aucune n'a encore été dessinée.";
    return;
  }
  /* On liste CARTE PAR CARTE. Un résumé global ne dirait plus rien
     depuis que chacune a son plan — et c'est précisément l'ancienne
     confusion qu'on vient de corriger. */
  e.innerHTML = l.join("<br>") + "<br><span style=\"color:#8f86a0\">Les "
    + (CARTES.length - l.length) + " autres gardent leur carte d'origine. Tirage n°"
    + tirageSalon + ".</span>";
}
