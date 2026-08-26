/* ================================================================
   LE JEU — état, simulation, combat, capacités
   ================================================================ */

var cam = { px:0, py:0, z:0.5 };
var carte = null;
var jeu = null;
var W = 960, H = 600, dpr = 1;

/* ---------------------------------------------------------------
   Création d'une carte
   --------------------------------------------------------------- */
function nouvelleCarte(index, pvConnu){
  /* les panneaux de commande, effacés pendant la séquence finale de
     l'île précédente, reviennent avec la nouvelle */
  var hud = document.getElementById("hud");
  if(hud) hud.classList.remove("fin");
  /* La carte suit le plan du salon et son tirage courant : c'est ce
     couple, diffusé dans l'instantané retenu, qui garantit que tout le
     monde voit exactement les mêmes défenses. */
  carte = genereCarte(CODE_SALON, index, planSalon, tirageSalon);
  jeu = {
    index:index,
    tps:0,
    qg:{ gx:carte.qg.gx, gy:carte.qg.gy, pv:carte.qg.pvMax, pvMax:carte.qg.pvMax },
    file:new FileDegats(carte.qg.pvMax),
    serieDeg:0,
    batiments:carte.batiments.map(function(b){
      return { t:b.t, gx:b.gx, gy:b.gy, pv:b.pv, pvMax:b.pvMax, e:b.e, n:b.n,
               vivant:1, angle:b.ang, cible:null, prochainTir:0, prochainCiblage:0,
               flash:0, recul:0, chargement:0 };
    }),
    creatures:carte.creatures.map(function(k, i){
      var f = CRE[k.t];
      return { t:k.t, gx:k.gx, gy:k.gy, ox:k.gx, oy:k.gy, pv:f.pv, n:i, teinte:k.teinte,
               phase:i * 0.7, ph:i * 1.31, droite:true, etat:"repos", cible:null,
               prochainTir:0, but:null, minuteur:0, gonfle:0, ang:0 };
    }),
    unites:[], projectiles:[], effets:[], crateres:[], flaques:[], glu:[],
    brouillards:[], soin:[], balise:null, poulets:[], cryos:[],
    /* Le bouclier du Brasier : les cinq cellules, leurs câbles, et le
       compte de celles qui tiennent encore. */
    reacteurs:[], cables:[], bouclier:0, boucliercoups:0, boucliertouche:0, coupure:0,
    navettes:[],
    energie:EQ.ENERGIE_DEPART, novaDispo:EQ.NOVA_PAR_VIE,
    tueurGege:"", tueurTweety:"",   // les responsables, une fois pour toutes
    messageTweety:0,
    usages:{ nova:0, poulets:0, brouillard:0, salve:0, cryo:0, soin:0, balise:0, viper:0 },
    barges:[],
    bargeSel:0,
    capArmee:null,
    degatsMoi:0,
    detruitsMoi:0,
    mort:false, tempsRenfort:0, fantome:null, messageGege:0,
    qgProchaine:6, qgTelegraphe:0, qgForme:0, qgPointsPluie:null,
    vague:null,
    secousse:0,
    fin:null,
    nSuiv:0
  };
  /* composition des barges depuis le briefing */
  for(var i = 0; i < EQ.NB_BARGES; i++){
    jeu.barges.push({ type:compoBarges[i].type, n:compoBarges[i].n, num:i + 1 });
  }
  /* Le monde n'est pas neuf : on éteint d'abord les bâtiments que
     l'instantané du salon déclare détruits, et on abaisse les PV du
     Brasier — AVANT construitGrilles(), qui fige les emprises. */
  if(typeof monde !== "undefined" && monde && monde.c === index &&
     (monde.cy | 0) === (typeof cycleSalon === "number" ? cycleSalon : 0)){
    var bitsM = decodeBits(monde.d, jeu.batiments.length);
    for(var q = 0; q < jeu.batiments.length; q++){
      if(bitsM[q]){ jeu.batiments[q].vivant = 0; jeu.batiments[q].pv = 0; }
    }
    jeu.file.adopteMinimum(monde.pv);
    jeu.qg.pv = jeu.file.pv;
    if(monde.g){
      /* quelqu'un l'a déjà tuée dans ce salon : elle reste morte */
      jeu.tueurGege = String(monde.g).substr(0, 14);
      for(var w = 0; w < jeu.creatures.length; w++)
        if(jeu.creatures[w].t === "belette") jeu.creatures[w].pv = 0;
    }
    if(monde.w){
      jeu.tueurTweety = String(monde.w).substr(0, 14);
      for(var w2 = 0; w2 < jeu.creatures.length; w2++)
        if(jeu.creatures[w2].t === "tweety") jeu.creatures[w2].pv = 0;
    }
  }
  if(typeof pvConnu === "number" && pvConnu >= 0 && pvConnu < jeu.qg.pvMax){
    jeu.file.adopteMinimum(pvConnu);
    jeu.qg.pv = jeu.file.pv;
  }
  /* les compteurs réseau appartiennent à la carte, pas à la session :
     des dégâts restés en attente à la chute d'une île étaient recrachés
     dans le premier message de la suivante */
  degatsEnAttente = 0;
  serieReseau = 0;
  construitGrilles();
  construitCables();
  construitContourIle();
  construitSol(carte);
  centreSurPlage();
}

/* ---------------------------------------------------------------
   LES CÂBLES DU BOUCLIER
   Chaque cellule électrique est reliée au Brasier par un câble posé
   au sol. On le trace APRÈS construitGrilles() : c'est la carte
   d'occupation qui dit où sont les bâtiments, et le câble doit les
   contourner au lieu de leur passer au travers.
   Le tracé est quasi rectiligne : on avance vers le Brasier, et
   lorsqu'un pas tombe sur un obstacle on cherche le décalage LATÉRAL
   le plus faible qui dégage — d'abord un demi-pas, puis un pas entier,
   jusqu'à trois. Le câble épouse donc le bâtiment et reprend aussitôt
   sa ligne, sans jamais partir en zigzag.
   --------------------------------------------------------------- */
/* Un segment de câble est-il posable ? On échantillonne finement : un
   simple test d'arrivée laisserait le câble traverser un bâtiment de
   part en part pour atterrir libre de l'autre côté. */
var cableDepart = null;          // la cellule d'où part le tracé en cours
function cableLibre(x0, y0, x1, y1){
  var n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.35));
  for(var i = 0; i <= n; i++){
    var f = i / n;
    var x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * f;
    /* le pied du Brasier est forcément « bloqué » : c'est justement là
       qu'on veut arriver. Idem pour l'emprise de la cellule elle-même,
       d'où le câble sort. */
    if(Math.hypot(x - jeu.qg.gx, y - jeu.qg.gy) < RAYON_QG + 2) continue;
    if(cableDepart && Math.hypot(x - cableDepart.gx, y - cableDepart.gy) < 3) continue;
    if(bloque(x, y)) return 0;
  }
  return 1;
}

function construitCables(){
  jeu.reacteurs = [];
  jeu.cables = [];
  var lst = carte.reacteurs || [];
  for(var i = 0; i < lst.length; i++){
    var bat = jeu.batiments[lst[i].n];
    if(!bat || bat.t !== "reacteur") continue;
    jeu.reacteurs.push({ bat:bat, gx:bat.gx, gy:bat.gy, n:i });

    cableDepart = bat;
    var pts = [{ gx:bat.gx, gy:bat.gy }];
    var cx = bat.gx, cy = bat.gy;
    var garde = 0;
    while(Math.hypot(cx - jeu.qg.gx, cy - jeu.qg.gy) > RAYON_QG + 1.2 && garde++ < 700){
      var dx = jeu.qg.gx - cx, dy = jeu.qg.gy - cy;
      var l = Math.hypot(dx, dy) || 1;
      dx /= l; dy /= l;
      var pas = 1.4;
      var nx = cx + dx * pas, ny = cy + dy * pas;
      if(!cableLibre(cx, cy, nx, ny)){
        /* obstacle : on longe. Décalages latéraux croissants, des deux
           côtés, on garde le premier qui dégage — et c'est bien tout le
           SEGMENT qu'on teste, pas seulement son arrivée : sinon le
           câble atterrit à côté du bâtiment en lui passant au travers. */
        var tx = -dy, ty = dx, ok = 0;
        for(var e = 1; e <= 11 && !ok; e++){
          for(var sg = 1; sg >= -1 && !ok; sg -= 2){
            var ex = cx + dx * pas * 0.45 + tx * sg * e * 0.62;
            var ey = cy + dy * pas * 0.45 + ty * sg * e * 0.62;
            if(cableLibre(cx, cy, ex, ey)){ nx = ex; ny = ey; ok = 1; }
          }
        }
        /* dernier recours : reculer perpendiculairement pour se dégager
           d'un cul-de-sac, sinon on passe outre plutôt que boucler */
        if(!ok){
          for(var e2 = 1; e2 <= 8 && !ok; e2++){
            for(var sg2 = 1; sg2 >= -1 && !ok; sg2 -= 2){
              var fx = cx + tx * sg2 * e2 * 0.7 - dx * 0.5;
              var fy = cy + ty * sg2 * e2 * 0.7 - dy * 0.5;
              if(cableLibre(cx, cy, fx, fy)){ nx = fx; ny = fy; ok = 1; }
            }
          }
        }
        if(!ok){ nx = cx + dx * pas; ny = cy + dy * pas; }
      }
      cx = nx; cy = ny;
      pts.push({ gx:cx, gy:cy });
    }
    pts.push({ gx:jeu.qg.gx, gy:jeu.qg.gy });
    /* longueur cumulée : elle sert au rendu pour faire courir
       l'impulsion lumineuse à vitesse constante */
    var lg = 0;
    for(var k = 1; k < pts.length; k++){
      lg += Math.hypot(pts[k].gx - pts[k - 1].gx, pts[k].gy - pts[k - 1].gy);
      pts[k].d = lg;
    }
    pts[0].d = 0;
    jeu.cables.push({ pts:pts, lg:lg, bat:bat, n:i });
  }
  jeu.bouclier = reacteursVivants();
}

/* ---------------------------------------------------------------
   Grilles d'accélération
   --------------------------------------------------------------- */
var occ = null;                 // occupation (bâtiments + bords)
var grilleBat = null;           // index spatial des bâtiments
var GB = 8;                     // taille d'une case d'index
var GBW = 0, GBH = 0;

function construitGrilles(){
  occ = new Uint8Array(GW * GH);
  var i, j, k;
  /* bords infranchissables */
  for(i = 0; i < GW; i++){
    for(j = 0; j < 2; j++){ occ[j * GW + i] = 1; occ[(GH - 1 - j) * GW + i] = 1; }
  }
  for(j = 0; j < GH; j++){ occ[j * GW] = 1; occ[j * GW + 1] = 1; }
  /* emprises des bâtiments */
  /* un bâtiment déjà tombé (instantané du salon adopté avant la
     construction de la grille) ne doit pas continuer à barrer
     le passage */
  jeu.batiments.forEach(function(b){ if(b.vivant) marqueEmprise(b, 1); });
  /* emprise du Brasier */
  for(i = -6; i <= 6; i++) for(j = -6; j <= 6; j++){
    var x = (jeu.qg.gx + i) | 0, y = (jeu.qg.gy + j) | 0;
    if(x >= 0 && x < GW && y >= 0 && y < GH) occ[y * GW + x] = 2;
  }
  /* index spatial */
  GBW = Math.ceil(GW / GB); GBH = Math.ceil(GH / GB);
  grilleBat = [];
  for(k = 0; k < GBW * GBH; k++) grilleBat.push([]);
  jeu.batiments.forEach(function(b){
    var cx = Math.min(GBW - 1, Math.max(0, (b.gx / GB) | 0));
    var cy = Math.min(GBH - 1, Math.max(0, (b.gy / GB) | 0));
    grilleBat[cy * GBW + cx].push(b);
  });
}
function marqueEmprise(b, v){
  var r = b.e / 2;
  for(var i = Math.floor(b.gx - r); i <= Math.ceil(b.gx + r) - 1; i++){
    for(var j = Math.floor(b.gy - r); j <= Math.ceil(b.gy + r) - 1; j++){
      if(i >= 0 && i < GW && j >= 0 && j < GH) occ[j * GW + i] = v;
    }
  }
}
function bloque(gx, gy){
  var i = gx | 0, j = gy | 0;
  if(i < 0 || i >= GW || j < 0 || j >= GH) return gx < 0 || gy < 0 || gy >= GH;
  return occ[j * GW + i] !== 0;
}

/* Index spatial des unités, reconstruit à chaque image */
var grilleUni = null, GU = 4, GUW = 0, GUH = 0;
function construitGrilleUnites(){
  GUW = Math.ceil((GW + 12) / GU); GUH = Math.ceil(GH / GU);
  if(!grilleUni || grilleUni.length !== GUW * GUH){
    grilleUni = [];
    for(var k = 0; k < GUW * GUH; k++) grilleUni.push([]);
  }else{
    for(var m = 0; m < grilleUni.length; m++) grilleUni[m].length = 0;
  }
  function range(u){
    var cx = Math.min(GUW - 1, Math.max(0, (u.gx / GU) | 0));
    var cy = Math.min(GUH - 1, Math.max(0, (u.gy / GU) | 0));
    grilleUni[cy * GUW + cx].push(u);
  }
  for(var i = 0; i < jeu.unites.length; i++) range(jeu.unites[i]);
  /* les poulets entrent dans la grille : les défenses les prennent
     pour des troupes et gaspillent leurs munitions dessus */
  for(var k2 = 0; k2 < jeu.poulets.length; k2++) range(jeu.poulets[k2]);
}
/* ---------------------------------------------------------------
   SÉPARATION LOCALE
   L'ancre de formation étale le groupe à l'approche ; la séparation
   l'empêche de s'empiler une fois arrivé — à l'arrêt, en train de
   tirer, ou tassé contre un mur.

   Grille dédiée, de maille égale au diamètre de confort : une unité
   n'a donc que ses huit cases voisines à consulter. Tri par comptage
   dans des tableaux typés réutilisés d'une image à l'autre — aucune
   allocation par image, et le coût suit le nombre de voisines réelles,
   pas l'effectif total.
   --------------------------------------------------------------- */
var sepDebut = null, sepTete = null, sepOrdre = null, sepW = 0, sepH = 0;
var sepX = null, sepY = null, sepR = null, sepPx = null, sepPy = null;

function reserveSeparation(n){
  if(sepX && sepX.length >= n) return;
  var cap = Math.max(256, n * 2);
  sepX = new Float32Array(cap); sepY = new Float32Array(cap);
  sepR = new Float32Array(cap);
  sepPx = new Float32Array(cap); sepPy = new Float32Array(cap);
  sepOrdre = new Int32Array(cap);
}

function separeUnites(dt){
  var lst = jeu.unites, n = lst.length;
  if(n < 2) return;
  reserveSeparation(n);
  var maille = EQ.SEPARATION_MAILLE;
  var w = Math.ceil(GW / maille) + 1;
  if(sepW !== w){
    sepW = w; sepH = Math.ceil(GH / maille) + 1;
    sepDebut = new Int32Array(sepW * sepH + 1);
    sepTete = new Int32Array(sepW * sepH);
  }
  var nc = sepW * sepH, i, c;
  sepDebut.fill(0); sepTete.fill(0);

  /* copie plate + comptage par case */
  var rayonMax = 0;
  for(i = 0; i < n; i++){
    var u = lst[i];
    sepX[i] = u.gx; sepY[i] = u.gy; sepR[i] = UNI[u.t].rayon;
    if(sepR[i] > rayonMax) rayonMax = sepR[i];
    sepPx[i] = 0; sepPy[i] = 0;
    var cx = (u.gx / maille) | 0, cy = (u.gy / maille) | 0;
    if(cx < 0) cx = 0; else if(cx >= sepW) cx = sepW - 1;
    if(cy < 0) cy = 0; else if(cy >= sepH) cy = sepH - 1;
    u.sepC = cy * sepW + cx;
    sepDebut[u.sepC + 1]++;
  }
  for(c = 0; c < nc; c++) sepDebut[c + 1] += sepDebut[c];
  for(i = 0; i < n; i++){
    c = lst[i].sepC;
    sepOrdre[sepDebut[c] + sepTete[c]] = i;
    sepTete[c]++;
  }

  /* Portée de recherche, en CASES DE GRILLE. Deux unités se repoussent
     jusqu'à sepR[i] + sepR[j] ; il faut donc balayer assez de cases
     pour que la plus grosse paire possible se voie. Une fenêtre 3×3
     fixe suffisait tant que toutes les troupes tenaient dans la maille
     — avec l'Ogre, deux d'entre eux s'ignoraient dès qu'ils n'étaient
     pas dans des cases voisines, et ils se traversaient. La fenêtre ne
     s'élargit QUE si une grosse unité est sur le terrain : sans Ogre,
     rayonMax vaut 0,42 et on retombe exactement sur l'ancien 3×3. */
  var portee = Math.max(1, Math.ceil((rayonMax * 2) / maille));

  /* répulsion : chaque paire traitée une seule fois (j > i) */
  for(i = 0; i < n; i++){
    var cx0 = lst[i].sepC % sepW, cy0 = (lst[i].sepC / sepW) | 0;
    for(var jy = cy0 - portee; jy <= cy0 + portee; jy++){
      if(jy < 0 || jy >= sepH) continue;
      for(var jx = cx0 - portee; jx <= cx0 + portee; jx++){
        if(jx < 0 || jx >= sepW) continue;
        var cc = jy * sepW + jx;
        for(var k = sepDebut[cc]; k < sepDebut[cc + 1]; k++){
          var j = sepOrdre[k];
          if(j <= i) continue;
          var dx = sepX[i] - sepX[j], dy = sepY[i] - sepY[j];
          var conf = sepR[i] + sepR[j];
          var d2 = dx * dx + dy * dy;
          if(d2 >= conf * conf) continue;
          var d = Math.sqrt(d2);
          if(d < 1e-4){
            /* exactement superposées : on les sépare sur un axe stable */
            var a = (i * ANGLE_OR) % 6.2832;
            dx = Math.cos(a); dy = Math.sin(a); d = 1;
          }else{ dx /= d; dy /= d; }
          var chev = (conf - d) * 0.5;
          sepPx[i] += dx * chev; sepPy[i] += dy * chev;
          sepPx[j] -= dx * chev; sepPy[j] -= dy * chev;
        }
      }
    }
  }

  /* application, plafonnée pour rester stable quel que soit dt */
  var vmax = EQ.SEPARATION_VITESSE * dt;
  for(i = 0; i < n; i++){
    var px = sepPx[i], py = sepPy[i];
    var l = Math.hypot(px, py);
    if(l < 1e-5) continue;
    if(l > vmax) l = vmax;
    deplace(lst[i], px, py, l);
  }
}

function unitesAutour(gx, gy, r, sortie){
  sortie.length = 0;
  var x0 = Math.max(0, ((gx - r) / GU) | 0), x1 = Math.min(GUW - 1, ((gx + r) / GU) | 0);
  var y0 = Math.max(0, ((gy - r) / GU) | 0), y1 = Math.min(GUH - 1, ((gy + r) / GU) | 0);
  for(var j = y0; j <= y1; j++){
    for(var i = x0; i <= x1; i++){
      var t = grilleUni[j * GUW + i];
      for(var k = 0; k < t.length; k++) sortie.push(t[k]);
    }
  }
  return sortie;
}
function batimentsAutour(gx, gy, r, sortie){
  sortie.length = 0;
  var x0 = Math.max(0, ((gx - r) / GB) | 0), x1 = Math.min(GBW - 1, ((gx + r) / GB) | 0);
  var y0 = Math.max(0, ((gy - r) / GB) | 0), y1 = Math.min(GBH - 1, ((gy + r) / GB) | 0);
  for(var j = y0; j <= y1; j++){
    for(var i = x0; i <= x1; i++){
      var t = grilleBat[j * GBW + i];
      for(var k = 0; k < t.length; k++) if(t[k].vivant) sortie.push(t[k]);
    }
  }
  return sortie;
}

/* ---------------------------------------------------------------
   Débarquement
   --------------------------------------------------------------- */
function centreSurPlage(){
  var p = iso(PLAGE_X0 + 2, GH / 2);
  cam.z = 0.62;
  cam.px = W / 2 - p.x * cam.z;
  cam.py = H / 2 - p.y * cam.z;
}
function centreSur(gx, gy){
  var p = iso(gx, gy);
  cam.px = W / 2 - p.x * cam.z;
  cam.py = H / 2 - p.y * cam.z;
}

/* ---------------------------------------------------------------
   LE DÉBARQUEMENT
   Les troupes n'apparaissent plus par magie à l'intérieur des terres :
   une navette arrive du large, ralentit, accoste, ouvre sa rampe, et
   les soldats en sortent par petits groupes avant de gagner le sable.

   Trois états : "approche" -> "accostage" -> "retrait". Les unités ne
   sont créées qu'une fois la rampe ouverte, à la sortie de la rampe.
   --------------------------------------------------------------- */
/* Le rivage JOUABLE n'est pas PLAGE_X0 (première colonne de sable, à
   140) mais le bord est de la grille : deplace() borne les unités à
   GW - 0.5, et le sable mouillé de matiereCase() commence vers GW - 6.
   La navette accoste donc là où est vraiment l'eau — c'est ce décalage
   de onze cases qui faisait « apparaître » les troupes en pleine terre. */
/* Le contour visible de l'île s'arrête à GW + 2.2 (traceIle, dilatation
   2.2) : la navette flotte donc juste au-delà du sable, et le pied de
   sa rampe retombe sur la dernière case praticable — deplace() borne
   les unités à GW - 0.5, une troupe créée plus à l'est serait recalée
   d'un coup sec. */
var RIVAGE_GX = GW + 1.6;      // la navette flotte : elle s'arrête DANS l'eau
var RAMPE_GX  = GW - 0.6;      // pied de rampe : dernière case où l'on marche

var NAV = {
  DEPART      : 13.0,   // cases au large : elle arrive franchement du large
  APPROCHE    : 1.0,    // s pour rallier le rivage, quelle que soit la distance
  RAMPE       : 0.40,   // s pour abaisser la rampe
  CADENCE     : 0.075,  // s entre deux soldats qui sortent
  PAUSE       : 0.30,   // s avant de repartir
  RETRAIT     : 2.4     // s de marche arrière avant disparition
};

function poseBarge(gx, gy){
  if(jeu.mort) return message("Ta flotte est perdue, attends le renfort.");
  var b = jeu.barges[jeu.bargeSel];
  if(!b) return message("Plus aucune navette.");
  /* On ne choisit que l'ENDROIT DU RIVAGE où la navette accoste : le
     long de la plage. Elle s'arrête toujours au bord de l'eau, et les
     troupes gagnent le sable à pied. */
  gy = borne(gy, 3, GH - 4);
  var gxA = RIVAGE_GX;
  jeu.navettes.push({
    type:b.type, reste:b.n, sortis:0,
    gx:gxA + NAV.DEPART, gy:gy, gxA:gxA, gx0:gxA + NAV.DEPART,
    etat:"approche", rampe:0, minuteur:0, tangage:Math.random() * 6.2832,
    n:jeu.nSuiv++
  });
  jeu.barges.splice(jeu.bargeSel, 1);
  if(jeu.bargeSel >= jeu.barges.length) jeu.bargeSel = Math.max(0, jeu.barges.length - 1);
  demandeMajBarres();
  son.debarque();
}

function majNavettes(dt){
  for(var i = jeu.navettes.length - 1; i >= 0; i--){
    var v = jeu.navettes[i];
    v.tangage += dt * 2.4;
    if(v.etat === "approche"){
      /* Une seconde du large au rivage, pas une de plus : la course est
         interpolée dans le TEMPS et non à vitesse constante. La courbe
         part vite et se pose en douceur — elle ralentit donc bien en
         approchant du sable, sans jamais allonger l'attente. */
      v.minuteur += dt;
      var t = Math.min(1, v.minuteur / NAV.APPROCHE);
      var e = 1 - (1 - t) * (1 - t) * (1 - t);        // sortie cubique
      v.gx = v.gx0 + (v.gxA - v.gx0) * e;
      if(t >= 1){
        v.gx = v.gxA;
        v.etat = "accostage";
        v.minuteur = 0;
        son.rampe();
      }
      continue;
    }
    if(v.etat === "accostage"){
      v.minuteur += dt;
      v.rampe = Math.min(1, v.minuteur / NAV.RAMPE);
      if(v.rampe < 1) continue;
      /* les soldats sortent en file, pas tous d'un bloc */
      var du = v.minuteur - NAV.RAMPE;
      var voulus = Math.min(v.reste, Math.floor(du / NAV.CADENCE) + 1);
      while(v.sortis < voulus){
        sortDeNavette(v);
        v.sortis++;
      }
      if(v.sortis >= v.reste && du > v.reste * NAV.CADENCE + NAV.PAUSE){
        v.etat = "retrait";
        v.minuteur = 0;
      }
      continue;
    }
    /* retrait : elle repart au large, rampe relevée */
    v.minuteur += dt;
    v.rampe = Math.max(0, 1 - v.minuteur / NAV.RAMPE);
    v.gx += (2.2 + v.minuteur * 4.0) * dt;
    if(v.minuteur > NAV.RETRAIT) jeu.navettes.splice(i, 1);
  }
}

/* Un soldat descend la rampe : il naît au pied de celle-ci, un peu
   devant la coque, avec une petite dispersion latérale. La séparation
   locale et l'ancre de formation font le reste dès la frame suivante. */
function sortDeNavette(v){
  var k = v.sortis;
  var lat = ((k % 5) - 2) * 0.34 + (bruitStable(v.n * 31 + k, 0) - 0.5) * 0.30;
  var av = (k % 3) * 0.30;
  var x = RAMPE_GX - av, y = v.gy + lat;
  /* si le pied de rampe est encombré, on décale le long du rivage */
  for(var essai = 0; essai < 8 && bloque(x, y); essai++){
    y += (essai % 2 ? 1 : -1) * 0.42 * (essai + 1);
    x = RAMPE_GX - av;
  }
  if(bloque(x, y)){ x = RAMPE_GX; y = v.gy; }
  creeUnite(v.type, borne(x, 0.6, GW - 0.6), borne(y, 0.6, GH - 0.6));
}
function creeUnite(type, gx, gy){
  var f = UNI[type];
  var n = jeu.nSuiv++;
  var an = ancreFormation(n);
  jeu.unites.push({
    t:type, gx:gx, gy:gy, pv:f.pv, pvMax:f.pv, n:n,
    /* place stable dans le disque unité : c'est elle qui donne au
       groupe sa surface au lieu d'un empilement sur un point */
    ancX:an.x, ancY:an.y, sepC:0,
    phase:Math.random() * 6.2832, var:(Math.random() * 3) | 0, droite:false,
    cible:null, prochainCiblage:Math.random() * EQ.PERIODE_CIBLAGE,
    prochainTir:0, tir:0, brulure:0, ralenti:0, ralentiType:"", vitMod:1,
    /* Ordre de Balise, STRICTEMENT individuel : il vaut l'identifiant
       de la balise tant que CETTE unité ne l'a pas atteinte, et 0
       ensuite. Une unité qui débarque pendant qu'une balise est active
       reçoit l'ordre elle aussi. */
    baliseOrdre:(jeu && jeu.balise) ? jeu.balise.id : 0,
    baliseMeilleure:1e9, baliseStagne:0, cote:0,
    /* Seuil d'enlisement propre à chaque unité. Deux voisines collées
       au même mur cesseraient de progresser à la même image ; avec un
       seuil identique elles se libéreraient ensemble, ce qui ressemble
       à une libération de groupe.
       Le seuil est LARGE — sept à onze secondes — parce que c'est un
       dernier recours, pas un mode de fonctionnement. À trois secondes
       il se déclenchait dès qu'une troupe longeait un bâtiment, et une
       bonne moitié du groupe abandonnait la Balise en chemin pour
       tirer sur ce qui passait. */
    baliseSeuil:7.0 + Math.random() * 4.0,
    pousse:{ x:0, y:0 }
  });
  return jeu.unites[jeu.unites.length - 1];
}

/* ---------------------------------------------------------------
   Dégâts
   --------------------------------------------------------------- */
/* Combien une troupe encaisse d'une ARME DE PRÉCISION : la roquette
   du Frelon, la balle du tireur d'élite du Mirador. Un pour tout le
   monde, cinq pour l'Ogre — un corps de trois mètres qui avance en
   ligne droite est exactement ce dont rêve un tireur posé.
   Ça ne vaut QUE pour ces deux-là. Ni les mitrailleuses, ni le
   chalumeau, ni la bobine, ni les créatures, ni les éruptions du
   Brasier, ni les capacités — et surtout pas les bâtiments, qui ne
   passent jamais par ici. */
function multVuln(u, arme){
  var f = UNI[u.t];
  return (f && f.vuln && f.vuln[arme]) || 1;
}
function toucheUnite(u, degats, opt){
  if(u.pv <= 0) return;
  if(opt && opt.arme) degats *= multVuln(u, opt.arme);
  u.pv -= degats;
  if(opt){
    if(opt.brulure) u.brulure = Math.max(u.brulure, EQ.BRULURE_DUREE);
    if(opt.ralenti){ u.ralenti = Math.max(u.ralenti, opt.ralenti); u.ralentiType = opt.type || "elec"; }
    if(opt.pousse){ u.pousse.x += opt.pousse.x; u.pousse.y += opt.pousse.y; }
  }
  if(u.pv <= 0 && !u.leurre){
    jeu.effets.push({ t:"mort", gx:u.gx, gy:u.gy, age:0, duree:0.55, typ:u.t });
    /* Un Ogre abattu d'une seule balle, ça doit se VOIR : sans marque
       propre, le joueur voit sa plus grosse unité disparaître d'une
       image à l'autre sans comprendre ce qui l'a touchée. */
    if(opt && opt.arme && multVuln(u, opt.arme) > 1){
      jeu.effets.push({ t:"abattu", gx:u.gx, gy:u.gy, age:0, duree:0.9 });
      jeu.secousse = Math.min(7, jeu.secousse + 2.2);
    }
    if(jeu.fantome === null) jeu.dernierePerte = { gx:u.gx, gy:u.gy };
  }
}
function degatsZone(gx, gy, rayon, degats, opt){
  var tmp = [];
  unitesAutour(gx, gy, rayon + 1, tmp);
  for(var i = 0; i < tmp.length; i++){
    var u = tmp[i];
    if(Math.hypot(u.gx - gx, u.gy - gy) > rayon) continue;
    /* Souffle d'une arme de DÉFENSE : il épargne ce que le Brouillard
       cache. Sans cela, une roquette qui perdait le contact retombait
       en aveugle sur la dernière position connue — c'est-à-dire pile
       sur la troupe cachée — et le souffle la blessait quand même. La
       fumée promet l'invisibilité : elle doit aussi tenir cette
       promesse contre les coups déjà partis. Le QG, la Salve du joueur
       et la Nova ne posent pas ce drapeau : leurs bombardements de
       zone restent aveugles et indiscriminés. */
    if(opt && opt.epargneCachees && masquee(u)) continue;
    toucheUnite(u, degats, opt);
  }
}
function degatsZoneEnnemis(gx, gy, rayon, degats){
  var bs = [];
  batimentsAutour(gx, gy, rayon + 3, bs);
  for(var i = 0; i < bs.length; i++){
    var b = bs[i];
    if(Math.hypot(b.gx - gx, b.gy - gy) <= rayon + b.e * 0.4) abimeBatiment(b, degats);
  }
  for(var k = 0; k < jeu.creatures.length; k++){
    var c = jeu.creatures[k];
    if(c.pv > 0 && Math.hypot(c.gx - gx, c.gy - gy) <= rayon) abimeCreature(c, degats);
  }
  if(Math.hypot(jeu.qg.gx - gx, jeu.qg.gy - gy) <= rayon + RAYON_QG) abimeQG(degats);
}
function abimeBatiment(b, d){
  if(!b.vivant) return;
  /* Le classement s'appelle TOP DÉGÂTS : il doit compter TOUS les
     dégâts, pas seulement ceux portés au Brasier. Un joueur qui démonte
     des centaines de défenses sans jamais atteindre la forteresse
     restait affiché à zéro. On ne compte que ce qui est réellement
     retiré, pour qu'un coup fatal surdimensionné ne gonfle pas le score. */
  jeu.degatsMoi += Math.max(0, Math.min(d, b.pv));
  b.pv -= d;
  if(b.pv <= 0){
    b.vivant = 0;
    marqueEmprise(b, 0);
    /* une fusée posée sur ce bâtiment cesse d'agir dès qu'il tombe */
    if(jeu.balise && jeu.balise.cible === b){
      jeu.balise = null;
      libereBalise();
    }
    jeu.energie += DEF[b.t].recolte ? EQ.ENERGIE_PAR_CELLULE : EQ.ENERGIE_PAR_BATIMENT;
    jeu.detruitsMoi++;
    if(DEF[b.t].recolte){
      /* une cellule se vide, elle n'explose pas : pas de cratère, pas
         de secousse, juste un éclat et le tintement de la récolte */
      jeu.effets.push({ t:"recolte", gx:b.gx, gy:b.gy, age:0, duree:0.6 });
      son.recolte();
    }else{
      jeu.effets.push({ t:"boum", gx:b.gx, gy:b.gy, age:0, duree:0.75, r:b.e * 0.7, force:1 });
      jeu.crateres.push({ gx:b.gx, gy:b.gy, r:b.e * 0.45 });
      if(jeu.crateres.length > 160) jeu.crateres.shift();
      jeu.secousse = Math.min(9, jeu.secousse + 3);
      son.boum(0.42);
    }
    son.energie();
    envoieDestruction(b.n);
    demandeMajBarres();
  }
}
/* Une balise qui s'éteint ne laisse personne sous ses ordres : sans
   ça, le drapeau resterait posé sur des unités jusqu'à leur mort. */
function libereBalise(){
  for(var i = 0; i < jeu.unites.length; i++){
    jeu.unites[i].baliseOrdre = 0;
    jeu.unites[i].cible = null;
    jeu.unites[i].prochainCiblage = 0;
  }
}

function abimeCreature(c, d){
  if(c.pv <= 0) return;
  c.pv -= d;
  if(c.pv <= 0){
    jeu.effets.push({ t:"mortCre", gx:c.gx, gy:c.gy, age:0, duree:0.7, typ:c.t });
    jeu.energie += EQ.ENERGIE_PAR_CREATURE;
    if(c.t === "belette"){
      jeu.messageGege = 3.0;                       // trois secondes de deuil
      jeu.tueurGege = monNom;
      son.gege();
      envoieGege();                                // que tout le salon le sache
      signaleMonde();
    }
    if(c.t === "tweety"){
      jeu.messageTweety = 3.0;
      jeu.tueurTweety = monNom;
      son.tweety();
      envoieTweety();
      signaleMonde();
    }
    demandeMajBarres();
  }
}
/* Combien de cellules électriques alimentent encore le bouclier. */
function reacteursVivants(){
  var n = 0;
  for(var i = 0; i < jeu.reacteurs.length; i++) if(jeu.reacteurs[i].bat.vivant) n++;
  return n;
}

/* ---------------------------------------------------------------
   LE BOUCLIER, IMAGE PAR IMAGE
   Une cellule peut tomber par trois chemins très différents : sous nos
   propres tirs, par le message « det » d'un autre joueur, ou d'un coup
   à la lecture d'un instantané de salon. Plutôt que de greffer le même
   traitement à trois endroits — et d'en oublier un quatrième demain —
   on regarde simplement, à chaque image, quelles cellules viennent de
   s'éteindre. La mise en scène part de là, quelle qu'en soit la cause.
   --------------------------------------------------------------- */
function majBouclier(dt){
  if(jeu.coupure > 0) jeu.coupure = Math.max(0, jeu.coupure - dt);
  if(jeu.boucliertouche > 0) jeu.boucliertouche = Math.max(0, jeu.boucliertouche - dt);
  for(var ic = 0; ic < jeu.cables.length; ic++){
    var cc = jeu.cables[ic];
    if(cc.morte && cc.fondu > 0) cc.fondu = Math.max(0, cc.fondu - dt);
  }
  var n = 0, i, r;
  for(i = 0; i < jeu.reacteurs.length; i++){
    r = jeu.reacteurs[i];
    var vif = !!r.bat.vivant;
    if(vif) n++;
    if(r.etaitVive === undefined){ r.etaitVive = vif; continue; }
    if(r.etaitVive && !vif){
      r.etaitVive = false;
      r.eteinte = jeu.tps;                 // l'heure exacte de sa mort
      tombeReacteur(r);
    }
  }
  var avant = jeu.bouclier;
  jeu.bouclier = n;
  if(avant > 0 && n === 0 && !jeu.fin) coupeLeCourant();
}

/* Une cellule s'effondre : décharge incontrôlée, arcs qui partent dans
   tous les sens, petite explosion, et la lumière qui s'éteint. Son
   câble cesse de battre mais reste posé au sol. */
function tombeReacteur(r){
  var b = r.bat;
  jeu.effets.push({ t:"cellHS", gx:b.gx, gy:b.gy, age:0, duree:1.8 });
  jeu.effets.push({ t:"boum", gx:b.gx, gy:b.gy, age:0, duree:0.9, r:2.6, force:1.3 });
  jeu.secousse = Math.min(11, jeu.secousse + 5);
  for(var i = 0; i < jeu.cables.length; i++){
    if(jeu.cables[i].bat === b){ jeu.cables[i].morte = 1; jeu.cables[i].fondu = 1.4; }
  }
  if(son && son.boum) son.boum(0.55);
}

/* La dernière cellule vient de tomber. Le courant lâche d'un coup :
   toute l'énergie encore prise dans les câbles reflue vers le Brasier
   et claque, puis plus rien. Le Brasier devient enfin attaquable. */
function coupeLeCourant(){
  jeu.coupure = 2.6;
  jeu.effets.push({ t:"coupure", gx:jeu.qg.gx, gy:jeu.qg.gy, age:0, duree:2.6 });
  jeu.secousse = Math.min(14, jeu.secousse + 9);
  if(son && son.boum) son.boum(0.85);
  /* la bannière est peinte sur le canevas par dessineCoupure() : elle
     tient les 2,6 s de la coupure, bien plus visible que le bandeau
     ordinaire, et elle crépite. */
}
function abimeQG(d){
  if(jeu.qg.pv <= 0) return;
  /* LE BOUCLIER. Tant qu'une seule cellule électrique tient debout, le
     Brasier ne perd pas un point de vie. Les troupes peuvent tirer —
     c'est même voulu, les impacts crépitent sur le champ — mais rien
     n'entame la coque. Le joueur doit d'abord faire tomber les cinq
     cellules, ce qui l'oblige à se répartir sur toute l'île. */
  if(jeu.bouclier > 0){
    jeu.boucliercoups = (jeu.boucliercoups || 0) + 1;
    jeu.boucliertouche = 0.22;        // le champ encaisse : ça doit se voir
    if(jeu.boucliercoups % 40 === 1 && !jeu.fin){
      message("Le Brasier est protégé : détruis les " + jeu.bouclier
            + " cellule" + (jeu.bouclier > 1 ? "s" : "") + " électrique"
            + (jeu.bouclier > 1 ? "s" : "") + " qui l'alimentent.");
    }
    return;
  }
  d = Math.round(d);
  if(d <= 0) return;
  jeu.serieDeg++;
  jeu.file.applique(monId, jeu.serieDeg, d);
  jeu.qg.pv = jeu.file.pv;
  jeu.degatsMoi += d;
  degatsEnAttente += d;
  if(jeu.qg.pv <= 0 && !jeu.fin) declencheFin();
}

/* ---------------------------------------------------------------
   Déplacement avec évitement simple
   --------------------------------------------------------------- */
/* Caps de contournement, de plus en plus écartés du cap voulu : un
   frôlement, un évitement franc, la parallèle au mur, puis des caps de
   dégagement vers l'arrière pour sortir d'un cul-de-sac. */
var CAPS_EVITEMENT = [0.55, 1.05, 1.57, 2.10, 2.60];

function deplace(u, dx, dy, pas){
  var l = Math.hypot(dx, dy);
  if(l < 1e-6) return;
  dx /= l; dy /= l;
  var nx = u.gx + dx * pas, ny = u.gy + dy * pas;
  if(!bloque(nx, ny) && !bloque(nx, u.gy) && !bloque(u.gx, ny)){
    /* Le bornage vaut AUSSI ici : bloque() considère tout gx >= GW comme
       libre, et la séparation locale est le premier code à pousser une
       unité vers l'est. Sans ces deux bornes, les troupes serrées au
       pied de la rampe finissaient debout sur la mer. */
    u.gx = borne(nx, 0.4, GW - 0.5);
    u.gy = borne(ny, 0.4, GH - 0.5);
    u.cote = 0;                       // route libre : plus de contournement
    return;
  }

  /* CONTOURNEMENT À PLEINE VITESSE.
     L'ancien code glissait sur un seul axe (vitesse amputée de la
     composante perdue) ou tentait deux tangentes fixes : contre un
     angle de bâtiment, la troupe zigzaguait sur place, et dans une
     poche entre plusieurs bâtiments elle s'arrêtait net. Ici on balaie
     des caps de plus en plus écartés du cap voulu — côté mémorisé
     d'abord, l'autre ensuite — et on prend le PREMIER cap libre, au
     pas entier. Une troupe n'est donc jamais ralentie tant qu'il
     existe une direction praticable : elle épouse le mur, contourne
     l'angle, ressort de la poche, et reprend sa route. Le côté
     mémorisé (u.cote) l'empêche d'hésiter entre gauche et droite ;
     elle n'en change que si son côté est réellement muré. */
  if(!u.cote) u.cote = (bruitStable(u.n, 0) < 0.5) ? 1 : -1;
  for(var cote = 0; cote < 2; cote++){
    var s = cote ? -u.cote : u.cote;
    for(var k = 0; k < CAPS_EVITEMENT.length; k++){
      var a = CAPS_EVITEMENT[k] * s;
      var ca = Math.cos(a), sa = Math.sin(a);
      var vx = dx * ca - dy * sa, vy = dx * sa + dy * ca;
      var tx = u.gx + vx * pas, ty = u.gy + vy * pas;
      if(!bloque(tx, ty)){
        if(cote) u.cote = -u.cote;    // le côté préféré était muré : on en change
        u.gx = borne(tx, 0.4, GW - 0.5);
        u.gy = borne(ty, 0.4, GH - 0.5);
        return;
      }
    }
  }
  /* murée de partout : elle ne bouge pas cette image-ci */
}

/* ---------------------------------------------------------------
   Mise à jour des unités
   --------------------------------------------------------------- */
var tmpBat = [], tmpUni = [];
function majUnites(dt){
  var i, u;
  var balise = jeu.balise;
  for(i = jeu.unites.length - 1; i >= 0; i--){
    u = jeu.unites[i];
    if(u.pv <= 0){ jeu.unites.splice(i, 1); continue; }

    /* états */
    if(u.brulure > 0){
      u.brulure -= dt;
      u.pv -= EQ.BRULURE_DPS * dt;
      if(u.pv <= 0){ toucheUnite(u, 0); jeu.unites.splice(i, 1); continue; }
    }
    var vit = UNI[u.t].vitesse;
    if(u.ralenti > 0){
      u.ralenti -= dt;
      vit *= (u.ralentiType === "glu") ? 0.4 : 0.45;
    }
    if(u.tir > 0) u.tir -= dt * 3;

    /* poussée (sanglier) */
    if(u.pousse.x || u.pousse.y){
      deplace(u, u.pousse.x, u.pousse.y, Math.min(1, Math.hypot(u.pousse.x, u.pousse.y)) * dt * 9);
      u.pousse.x *= Math.max(0, 1 - dt * 6);
      u.pousse.y *= Math.max(0, 1 - dt * 6);
      if(Math.abs(u.pousse.x) < 0.01) u.pousse.x = 0;
      if(Math.abs(u.pousse.y) < 0.01) u.pousse.y = 0;
    }

    var f = UNI[u.t];

    /* --- SOUS BROUILLARD : postée, muette ---------------------------
       Tant que l'unité est dans la fumée, elle est cachée. Elle
       continue d'avancer et de se placer normalement — jusqu'à SA
       propre portée, celle de son type : 4,75 case pour une Meuf,
       1,70 pour un Mec, jamais une distance générique — puis elle
       s'arrête et se tait. Elle ne tire pas, elle n'engage pas, et
       les défenses ne la voient pas (cf. masquee(), côté défense et
       côté créature). C'est tout l'intérêt de la fumée : venir se
       poster au contact sans déclencher le combat.
       u.cachee sert aussi au rendu, qui estompe la troupe. */
    var cachee = masquee(u);
    u.cachee = cachee;

    /* --- BALISE : un ordre individuel, prioritaire sur tout ------------
       Tant que u.baliseOrdre vaut l'identifiant de la balise en cours,
       cette unité — et elle seule — est sous les ordres. Rien ne l'en
       libère : ni une défense à portée, ni le Brouillard, ni un
       changement de zone. Seul le fait QU'ELLE ait atteint ou franchi
       la zone remet son drapeau à zéro, sans toucher à ses voisines. */
    if(balise && u.baliseOrdre === balise.id){
      var bc = balise.cible;
      var qgVise = !!balise.surQG;
      /* Debout ? Un bâtiment a un drapeau `vivant`, le Brasier a des
         points de vie : la question ne se pose pas de la même façon. */
      var cibleDebout = bc && (qgVise ? bc.pv > 0 : bc.vivant);
      if(cibleDebout){
        /* Balise posée sur une cible : elle devient prioritaire, et
           l'ordre tient tant qu'elle est debout. Les troupes s'arrêtent
           à LEUR portée du bord de l'objectif et TIRENT dessus — elles
           n'essaient jamais d'entrer dedans. Le rayon du Brasier
           (5,6 cases) est bien plus large que celui d'une défense :
           sans ce calcul, elles fonçaient dans ses murs. */
        var rc = qgVise ? RAYON_QG : bc.e * 0.42;
        var dxb = bc.gx - u.gx, dyb = bc.gy - u.gy;
        var db = Math.hypot(dxb, dyb) - rc;
        u.droite = (dxb - dyb) > 0;
        u.cible = qgVise ? { k:"qg", o:bc } : { k:"bat", o:bc };
        if(db > f.arret){
          var eb = Math.min(rayonFormation() * 0.55, (f.arret + rc) * 0.7);
          deplace(u, dxb + u.ancX * eb, dyb + u.ancY * eb, vit * dt);
          u.phase += dt * (u.t === "mec" ? 6.2 : 8.6);
        }else{
          u.phase += dt * 1.5;
          u.prochainTir -= dt * 1000;
          if(cachee){
            armeSansTirer(u);
          }else if(u.prochainTir <= 0){
            u.prochainTir = f.cadence;
            u.tir = 1;
            tireUnite(u, { gx:bc.gx, gy:bc.gy }, u.cible);
          }
        }
        continue;
      }
      if(!bc){
        /* balise au sol : chacune marche vers SA place, sans tirer */
        var rf = rayonFormation();
        var pvx = balise.gx + u.ancX * rf, pvy = balise.gy + u.ancY * rf;
        var dxf = pvx - u.gx, dyf = pvy - u.gy;
        var df = Math.hypot(dxf, dyf);
        var dCentre = Math.hypot(balise.gx - u.gx, balise.gy - u.gy);
        /* Atteinte de la zone : soit elle est sur sa place, soit elle a
           franchi le cercle — c'est le « atteint OU dépassé » demandé.
           Le repli sur le cercle sert aussi de filet quand la place
           assignée tombe dans l'eau ou dans un mur. */
        var arrivee = (df <= EQ.BALISE_RAYON) ||
                      (dCentre <= rf && (dCentre <= EQ.BALISE_RAYON || bloque(pvx, pvy)));
        /* Garde-fou contre l'enlisement. deplace() ne sait que longer un
           obstacle, pas le contourner : une troupe lancée à travers un
           champ de défenses peut se coller à un mur et ne plus avancer
           d'un pouce. Sans ce garde-fou elle resterait plantée là les
           trente secondes de la balise, ce qui est PIRE que le défaut
           d'origine. On mesure donc son meilleur rapprochement : si elle
           ne gagne plus rien pendant trois secondes, on considère
           qu'elle a fait ce qu'elle pouvait et on la libère — elle
           seule. */
        if(dCentre < u.baliseMeilleure - 0.05){
          u.baliseMeilleure = dCentre;
          u.baliseStagne = 0;
        }else{
          u.baliseStagne += dt;
          if(u.baliseStagne > (u.baliseSeuil || 3.0)) arrivee = true;
        }
        if(!arrivee){
          deplace(u, dxf, dyf, vit * dt);
          u.phase += dt * 9;
          u.droite = (dxf - dyf) > 0;
          u.cible = null;
          continue;                       // rien d'autre ne la concerne
        }
      }
      /* CETTE unité est arrivée — ou sa cible désignée est tombée.
         Elle seule est libérée, et elle repart aussitôt en chasse. */
      u.baliseOrdre = 0;
      u.cible = null;
      u.prochainCiblage = 0;
    }

    /* --- recherche de cible, espacée --- */
    u.prochainCiblage -= dt * 1000;
    if(u.prochainCiblage <= 0){
      u.prochainCiblage = EQ.PERIODE_CIBLAGE + Math.random() * 260;
      u.cible = chercheCibleUnite(u);
    }
    var c = u.cible;
    if(c && ((c.k === "bat" && !c.o.vivant) || (c.k === "cre" && c.o.pv <= 0))) { c = u.cible = null; }

    var but = null, portee = f.arret, rayonCible = 0;
    if(c){
      but = { gx:c.o.gx, gy:c.o.gy };
      rayonCible = c.k === "bat" ? c.o.e * 0.42 : (c.k === "qg" ? RAYON_QG : 0.3);
    }else{
      but = { gx:jeu.qg.gx, gy:jeu.qg.gy };
      rayonCible = RAYON_QG;
    }
    var dx = but.gx - u.gx, dy = but.gy - u.gy;
    var d = Math.hypot(dx, dy) - rayonCible;
    u.droite = (dx - dy) > 0;

    if(d > portee){
      /* on marche vers SA place autour de la cible, pas vers le centre :
         la troupe aborde l'objectif en éventail au lieu de s'entasser
         sur l'arc le plus proche. La portée, elle, reste mesurée au
         centre — le décalage n'avantage ni ne pénalise personne. */
      var etal = Math.min(rayonFormation() * 0.55, (portee + rayonCible) * 0.7);
      deplace(u, dx + u.ancX * etal, dy + u.ancY * etal, vit * dt);
      /* Cadence du cycle de marche, en radians par seconde. Elle dit le
         NOMBRE de pas, pas la vitesse : l'Ogre avance plus vite qu'une
         Meuf (1,782 contre 1,62) tout en faisant deux fois moins de pas
         pour la même distance. C'est exactement ça, une enjambée — et
         c'est pour ça qu'il ne faut surtout pas ralentir son cycle en
         croyant ralentir le personnage. */
      u.phase += dt * (u.t === "ogre" ? 4.1 : (u.t === "mec" ? 6.2 : 8.6));
    }else{
      /* Arrivée à SA portée (f.arret, propre au type). Elle tire —
         sauf si la fumée la couvre, auquel cas elle se tient prête
         et ne bouge plus. */
      u.phase += dt * 1.5;
      u.prochainTir -= dt * 1000;
      if(cachee){
        armeSansTirer(u);
      }else if(f.armement && u.prochainTir > 0 && u.prochainTir <= f.armement * 1000){
        /* ARMEMENT. L'Ogre attrape une hache et ramène le bras en
           arrière AVANT de lancer : sans ce temps-là, la hache
           jaillirait d'un bras au repos. La fenêtre s'ouvre un peu
           avant l'échéance ; le lancer part quand elle expire.
           u.tir est REMIS À UN à chaque image de l'armement, sinon il
           se dégraderait pendant la montée du bras et la pose
           s'affaisserait juste avant le lancer. */
        u.arme = 1;
        u.tir = 1;
      }else if(u.prochainTir <= 0){
        u.prochainTir = f.cadence;
        u.arme = 0;
        u.tir = 1;
        tireUnite(u, but, c);
      }
    }
  }
}

/* Sous Brouillard, l'unité retient son tir mais garde le doigt sur la
   détente : le compte à rebours est ramené à zéro au lieu d'être
   rechargé. À l'image même où la fumée se dissipe, u.prochainTir
   repasse sous zéro et la salve part — aucun délai artificiel, comme
   demandé. Sans ce plafonnement le compteur plongerait dans les
   négatifs pendant vingt secondes, ce qui reviendrait au même, mais
   avec un nombre qui dérive sans raison. */
function armeSansTirer(u){
  if(u.prochainTir < 0) u.prochainTir = 0;
  u.tir = 0;
  u.arme = 0;
}
function chercheCibleUnite(u){
  var meilleur = null, md = 1e9;
  /* créatures proches d'abord (elles nous agressent) */
  for(var k = 0; k < jeu.creatures.length; k++){
    var cr = jeu.creatures[k];
    if(cr.pv <= 0) continue;
    var dc = Math.hypot(cr.gx - u.gx, cr.gy - u.gy);
    if(dc < 6 && dc < md){ md = dc; meilleur = { k:"cre", o:cr }; }
  }
  if(meilleur) return meilleur;
  batimentsAutour(u.gx, u.gy, 11, tmpBat);
  for(var i = 0; i < tmpBat.length; i++){
    var b = tmpBat[i];
    var db = Math.hypot(b.gx - u.gx, b.gy - u.gy) - b.e * 0.42;
    if(db < md){ md = db; meilleur = { k:"bat", o:b }; }
  }
  var dq = Math.hypot(jeu.qg.gx - u.gx, jeu.qg.gy - u.gy) - RAYON_QG;
  if(dq < md && dq < 12) meilleur = { k:"qg", o:jeu.qg };
  return meilleur;
}
function tireUnite(u, but, c){
  var f = UNI[u.t];
  if(u.t === "ogre"){
    /* LA HACHE. Elle part de la hauteur d'épaule d'un ogre — soit très
       au-dessus de tout le reste — décrit une cloche et tourne sur
       elle-même pendant tout le vol. Sa vitesse angulaire est calée sur
       la durée du trajet, calculée ICI une fois pour toutes : réglée
       en dur, une hache lancée à bout portant tournait comme une
       toupie et une hache lancée au loin semblait planer. */
    var dh = Math.hypot(but.gx - u.gx, but.gy - u.gy) || 1;
    var duree = Math.max(0.18, dh / f.vitesseHache);
    /* La hache part de l'ÉPAULE, pas du nombril, et déjà un peu devant
       lui : lâchée au centre de l'unité, elle traversait visiblement
       son propre torse à l'image du lancer. La hauteur suit l'échelle
       du personnage — trente unités conviennent à une Meuf, pas à un
       ogre qui en fait trois fois plus. */
    var ech = f.ech || 1;
    var ax = u.gx + (but.gx - u.gx) / dh * 0.55 * ech;
    var ay = u.gy + (but.gy - u.gy) / dh * 0.55 * ech;
    jeu.projectiles.push({
      t:"hache", gx:ax, gy:ay, x0:ax, y0:ay,
      cible:c, but:{ gx:but.gx, gy:but.gy },
      degats:f.degats, vit:f.vitesseHache, age:0, duree:duree,
      /* deux tours et demi à trois tours et demi de vol, selon la
         distance : c'est ce qui donne le poids */
      spin:(6.2832 * (2.5 + Math.min(1, dh / 6))) / duree,
      /* départ à hauteur d'épaule, arrivée au sol : la cloche est
         d'autant plus haute que le jet est long */
      haut:(20 + Math.min(26, dh * 3.6)) * ech,
      z0:30 * ech, ang:Math.atan2(but.gy - u.gy, but.gx - u.gx), n:jeu.nSuiv++
    });
    if(son.hache) son.hache();
    return;
  }
  if(u.t === "meuf"){
    jeu.projectiles.push({
      t:"roquetteJ", gx:u.gx, gy:u.gy - 0.2, vx:0, vy:0, cible:c, but:but,
      degats:f.degats, vit:11, age:0
    });
    son.tirMeuf();
  }else{
    /* corps à corps : impact immédiat */
    appliqueDegatsCible(c, f.degats, but);
    jeu.effets.push({ t:"coup", gx:but.gx, gy:but.gy, age:0, duree:0.22 });
    son.coupMec();
  }
}
/* L'IMPACT D'UNE HACHE. Quatre cents kilos d'acier lancés par un ogre :
   ça doit s'entendre et ça doit secouer. Un choc franc, un anneau de
   poussière, quelques éclats, et une secousse de caméra courte — assez
   pour qu'on la sente, pas assez pour gêner la visée. */
function impactHache(gx, gy){
  jeu.effets.push({ t:"hacheBoum", gx:gx, gy:gy, age:0, duree:0.42 });
  jeu.effets.push({ t:"onde", gx:gx, gy:gy, age:0, duree:0.34, r:1.1 });
  jeu.effets.push({ t:"poussiere", gx:gx, gy:gy, age:0, duree:0.55 });
  jeu.secousse = Math.min(6, jeu.secousse + 1.5);
  if(son.impactHache) son.impactHache();
}
function appliqueDegatsCible(c, d, but){
  if(!c){ if(but && Math.hypot(but.gx - jeu.qg.gx, but.gy - jeu.qg.gy) < RAYON_QG + 1) abimeQG(d); return; }
  if(c.k === "bat") abimeBatiment(c.o, d);
  else if(c.k === "cre") abimeCreature(c.o, d);
  else abimeQG(d);
}

/* ---------------------------------------------------------------
   Mise à jour des défenses
   --------------------------------------------------------------- */
function majDefenses(dt, tps){
  /* Boîte englobante de tout ce qui peut être PRIS pour une troupe :
     les unités ET les poulets leurres. L'ancien code s'endormait dès
     que jeu.unites était vide et sa boîte ignorait les poulets — des
     leurres largués seuls, flotte morte ou occupée ailleurs, ne
     réveillaient donc jamais une seule tourelle. C'est pourtant tout
     leur intérêt, et depuis que les capacités des autres joueurs
     agissent chez nous, leurs poulets aussi doivent détourner nos
     défenses simulées. */
  if(!jeu.unites.length && !jeu.poulets.length){
    for(var q = 0; q < jeu.batiments.length; q++){
      var bq = jeu.batiments[q];
      if(bq.flash > 0) bq.flash -= dt * 6;
      if(bq.recul > 0) bq.recul -= dt * 6;
    }
    return;
  }
  var bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
  for(var i = 0; i < jeu.unites.length; i++){
    var u = jeu.unites[i];
    if(u.gx < bx0) bx0 = u.gx; if(u.gx > bx1) bx1 = u.gx;
    if(u.gy < by0) by0 = u.gy; if(u.gy > by1) by1 = u.gy;
  }
  for(var i2 = 0; i2 < jeu.poulets.length; i2++){
    var u2 = jeu.poulets[i2];
    if(u2.gx < bx0) bx0 = u2.gx; if(u2.gx > bx1) bx1 = u2.gx;
    if(u2.gy < by0) by0 = u2.gy; if(u2.gy > by1) by1 = u2.gy;
  }

  for(var k = 0; k < jeu.batiments.length; k++){
    var b = jeu.batiments[k];
    if(b.flash > 0) b.flash -= dt * 6;
    if(b.recul > 0) b.recul -= dt * 6;
    if(b.chargement > 0) b.chargement -= dt * 3;
    if(!b.vivant) continue;
    var f = DEF[b.t];
    if(!f.portee) continue;
    if(geleeParCryo(b)){ b.cible = null; continue; }
    /* élagage par boîte englobante */
    var ddx = Math.max(bx0 - b.gx, 0, b.gx - bx1);
    var ddy = Math.max(by0 - b.gy, 0, b.gy - by1);
    if(Math.hypot(ddx, ddy) > f.portee + 1) continue;

    /* VERROU. Une batterie à verrou n'abandonne pas la cible qu'elle a
       accrochée pour la remplacer par une voisine plus proche à chaque
       balayage : elle la suit tant qu'elle vit, reste visible et reste
       dans sa fourchette de tir. Sans ce garde-fou, une troupe qui
       passe à portée volerait la cible d'un missile déjà en route. */
    var garde = false;
    if(f.verrou && b.cible && b.cible.pv > 0 && !masquee(b.cible)){
      var dv = Math.hypot(b.cible.gx - b.gx, b.cible.gy - b.gy);
      garde = dv <= f.portee && !(f.porteeMin && dv < f.porteeMin);
    }

    b.prochainCiblage -= dt * 1000;
    if(!garde && b.prochainCiblage <= 0){
      b.prochainCiblage = EQ.PERIODE_CIBLAGE + Math.random() * 220;
      b.cible = chercheCibleDefense(b, f);
    }
    var c = b.cible;
    if(c && (c.pv <= 0 || masquee(c))) c = b.cible = null;
    if(!c) continue;
    var dx = c.gx - b.gx, dy = c.gy - b.gy;
    var d = Math.hypot(dx, dy);
    /* Trop loin, ou trop près : on lâche la cible pour pouvoir en
       chercher une qu'on peut réellement atteindre. Rester verrouillé
       sur quelqu'un qu'on ne peut pas toucher ne servirait à rien. */
    if(d > f.portee + 0.4 || (f.porteeMin && d < f.porteeMin)){
      b.cible = null;
      b.prochainCiblage = 0;
      continue;
    }

    /* la tourelle vise */
    var vise = Math.atan2(dy, dx);
    var ec = ecartAngulaire(vise, b.angle);
    b.angle += ec * Math.min(1, dt * 7);

    b.prochainTir -= dt * 1000;
    if(b.prochainTir <= 0 && Math.abs(ec) < 0.5){
      b.prochainTir = f.cadence;
      tireDefense(b, f, c, d, tps);
    }
  }
}
/* La fumée vient de se dissiper : tout ce qui pouvait tirer sur la zone
   reprend ses droits À L'INSTANT MÊME. Sans ça, défenses et créatures
   auraient attendu leur prochain balayage de détection — jusqu'à six
   dixièmes de seconde de sursis offert aux troupes, exactement le délai
   artificiel qu'on ne veut pas. On remet donc leur minuterie de ciblage
   à zéro : à l'image suivante, elles rouvrent les yeux.
   Portée du réveil : le rayon de la zone plus la plus longue portée du
   jeu, pour n'oublier aucune tourelle capable d'atteindre la zone. */
var PORTEE_MAX_DEF = 0;
function porteeMaxDefense(){
  if(!PORTEE_MAX_DEF) for(var t in DEF) PORTEE_MAX_DEF = Math.max(PORTEE_MAX_DEF, DEF[t].portee || 0);
  return PORTEE_MAX_DEF;
}
function reveleZone(f){
  var p = f.r + porteeMaxDefense();
  batimentsAutour(f.gx, f.gy, p, tmpBat);
  for(var i = 0; i < tmpBat.length; i++) tmpBat[i].prochainCiblage = 0;
  for(var k = 0; k < jeu.creatures.length; k++){
    var cr = jeu.creatures[k];
    if(cr.pv > 0 && Math.hypot(cr.gx - f.gx, cr.gy - f.gy) <= p) cr.minuteur = 0;
  }
}

function masquee(u){
  for(var i = 0; i < jeu.brouillards.length; i++){
    var f = jeu.brouillards[i];
    if(Math.hypot(u.gx - f.gx, u.gy - f.gy) <= f.r) return true;
  }
  return false;
}
function chercheCibleDefense(b, f){
  unitesAutour(b.gx, b.gy, f.portee, tmpUni);
  var meilleur = null, md = 1e9;
  for(var i = 0; i < tmpUni.length; i++){
    var u = tmpUni[i];
    if(u.pv <= 0) continue;
    var d = Math.hypot(u.gx - b.gx, u.gy - b.gy);
    if(d > f.portee) continue;
    if(f.porteeMin && d < f.porteeMin) continue;
    if(masquee(u)) continue;
    if(d < md){ md = d; meilleur = u; }
  }
  return meilleur;
}
function tireDefense(b, f, c, d, tps){
  b.flash = 1;
  if(b.t === "crible"){
    b.recul = 1;
    var touche = mitraTouche(d, Math.random());
    /* Chaque balle finit quelque part : une gerbe de sable marque le
       point de chute. C'est cette grêle d'impacts qui fait comprendre,
       même en dézoomant, quelle zone la mitrailleuse est en train
       d'arroser — les traçantes seules sont trop fugaces. */
    var disp = touche ? 0.42 : 0.95;              // dispersion, en cases
    var ai = Math.random() * 6.2832, ri = Math.sqrt(Math.random()) * disp;
    var ex = c.gx + Math.cos(ai) * ri, ey = c.gy + Math.sin(ai) * ri;
    if(!touche){
      /* balle franchement perdue : elle part plus loin, au-delà */
      var a = Math.atan2(c.gy - b.gy, c.gx - b.gx) + (Math.random() - 0.5) * 0.30;
      var dd = d * (1.05 + Math.random() * 0.35);
      ex = b.gx + Math.cos(a) * dd; ey = b.gy + Math.sin(a) * dd;
    }else{
      toucheUnite(c, f.degats);
    }
    jeu.effets.push({ t:"traceur", gx:b.gx, gy:b.gy, ex:ex, ey:ey,
                      age:0, duree:0.10, perdue:touche ? 0 : 1 });
    jeu.effets.push({ t:"impact", gx:ex, gy:ey, age:0, duree:0.34 });
    son.tirCrible();
  }else if(b.t === "chalumeau"){
    /* cône de chalumeau : tout ce qui est dans le cône prend et brûle */
    var ang = b.angle;
    unitesAutour(b.gx, b.gy, f.portee, tmpUni);
    for(var i = 0; i < tmpUni.length; i++){
      var u = tmpUni[i];
      var du = Math.hypot(u.gx - b.gx, u.gy - b.gy);
      if(du > f.portee) continue;
      if(!dansCone(Math.atan2(u.gy - b.gy, u.gx - b.gx), ang, f.cone)) continue;
      if(masquee(u)) continue;              // la fumée coupe aussi le cône
      toucheUnite(u, f.degats, { brulure:1 });
    }
    jeu.effets.push({ t:"cone", gx:b.gx, gy:b.gy, ang:ang, portee:f.portee,
                      ouv:f.cone, age:0, duree:0.22 });
    son.jetFlamme();
  }else if(b.t === "frelon"){
    b.recul = 1;
    /* Les six tubes partent à tour de rôle : chaque départ sort d'une
       bouche différente, légèrement décalée, et chaque roquette reçoit
       SON profil de vol — apogée et dérive propres — pour que deux
       tirs ne dessinent jamais la même courbe dans le ciel. */
    b.tube = ((b.tube | 0) + 1) % 6;
    var ecT = (b.tube % 2 ? 1 : -1) * (0.22 + (b.tube % 3) * 0.14);
    var vol0 = Math.max(0.7, d / f.vitesseProj);
    jeu.projectiles.push({ t:"roquette",
      gx:b.gx - Math.sin(b.angle) * ecT, gy:b.gy + Math.cos(b.angle) * ecT,
      z:34, cible:c, but:{ gx:c.gx, gy:c.gy },
      degats:f.degats, vit:f.vitesseProj, age:0, brouillard:0,
      vol:vol0, apogee:26 + Math.min(110, d * 4.5) + (b.tube % 3) * 12,
      tr:[] });
    jeu.effets.push({ t:"souffle", gx:b.gx, gy:b.gy, ang:b.angle, age:0, duree:0.5 });
    son.tirFrelon();
  }else if(b.t === "pilon"){
    b.recul = 1; b.chargement = 1;
    /* Une cloche haute et lente : c'est la lisibilité de la trajectoire
       qui dit d'où vient le coup. Trop tendue, on ne voit rien partir. */
    var vol = Math.max(0.85, d / f.vitesseProj);
    jeu.projectiles.push({ t:"bombe", gx:b.gx, gy:b.gy, x0:b.gx, y0:b.gy,
      cx:c.gx, cy:c.gy, duree:vol, age:0, degats:f.degats, zone:f.zone,
      mortier:f.mortier || 0, haut:34 + d * 4.6 });
    jeu.effets.push({ t:"souffle", gx:b.gx, gy:b.gy, ang:b.angle, age:0, duree:0.45 });
    son.tirPilon();
  }else if(b.t === "mirador"){
    /* LE TIREUR D'ÉLITE. Une balle, une cible, très loin, très vite —
       pas de zone, pas de gerbe, pas de rattrapage. Elle part avec le
       drapeau `precision`, celui qui déclenche le ×5 de l'Ogre : un
       corps de trois mètres qui avance en ligne droite est exactement
       ce dont rêve un homme posé dans une tour.
       Le projectile file à 26 cases/s — trois fois une roquette : à
       douze cases on doit voir le trait partir, pas le voir voyager. */
    b.recul = 1;
    var volM = Math.max(0.12, d / f.vitesseProj);
    jeu.projectiles.push({ t:"balle", gx:b.gx, gy:b.gy, x0:b.gx, y0:b.gy,
      cible:c, but:{ gx:c.gx, gy:c.gy }, duree:volM, age:0,
      degats:f.degats, z0:44 });
    jeu.effets.push({ t:"souffle", gx:b.gx, gy:b.gy, ang:b.angle, age:0, duree:0.28 });
    if(son.tirMirador) son.tirMirador();
  }else if(b.t === "bobine"){
    var vol2 = Math.max(0.7, d / f.vitesseProj);
    jeu.projectiles.push({ t:"bobine", gx:b.gx, gy:b.gy, x0:b.gx, y0:b.gy,
      cx:c.gx, cy:c.gy, duree:vol2, age:0, degats:f.degats, zone:f.zone,
      ralenti:f.ralenti, haut:30 + d * 2.6 });
    son.tirBobine();
  }
}

/* ---------------------------------------------------------------
   Projectiles
   --------------------------------------------------------------- */
function majProjectiles(dt){
  for(var i = jeu.projectiles.length - 1; i >= 0; i--){
    var p = jeu.projectiles[i];
    p.age += dt;
    if(p.t === "hache"){
      /* La hache suit une cloche entre le point de lancer et le point
         visé. On interpole dans le TEMPS, pas à vitesse constante :
         c'est la seule façon d'avoir une cloche propre, et ça garantit
         qu'elle arrive exactement au bout de sa durée quelle que soit
         la distance. Elle ne poursuit PAS sa cible : une hache lancée
         est lancée, elle tombe où elle a été jetée. */
      var kh = Math.min(1, p.age / p.duree);
      p.gx = p.x0 + (p.but.gx - p.x0) * kh;
      p.gy = p.y0 + (p.but.gy - p.y0) * kh;
      p.z = p.z0 * (1 - kh) + p.haut * 4 * kh * (1 - kh);
      p.rot = p.age * p.spin;
      if(kh >= 1){
        appliqueDegatsCible(p.cible, p.degats, p.but);
        impactHache(p.but.gx, p.but.gy);
        jeu.projectiles.splice(i, 1);
      }
      continue;
    }
    if(p.t === "balle"){
      /* La balle du Mirador ne poursuit pas : elle est tirée là où la
         cible SE TROUVAIT. Une troupe qui bouge s'en sort, une troupe
         postée la prend en pleine tête — et c'est très bien ainsi,
         puisque c'est précisément la troupe postée qu'elle est là pour
         punir. Elle épargne ce que le Brouillard cache : un tireur ne
         vise pas ce qu'il ne voit pas. */
      var kb = Math.min(1, p.age / p.duree);
      p.gx = p.x0 + (p.but.gx - p.x0) * kb;
      p.gy = p.y0 + (p.but.gy - p.y0) * kb;
      p.z = p.z0 * (1 - kb);
      if(kb >= 1){
        if(p.cible && p.cible.pv > 0 && !masquee(p.cible) &&
           Math.hypot(p.cible.gx - p.but.gx, p.cible.gy - p.but.gy) < 0.9){
          toucheUnite(p.cible, p.degats, { arme:"precision" });
        }else{
          degatsZone(p.but.gx, p.but.gy, 0.45, p.degats, { epargneCachees:1, arme:"precision" });
        }
        jeu.effets.push({ t:"impact", gx:p.but.gx, gy:p.but.gy, age:0, duree:0.30 });
        jeu.projectiles.splice(i, 1);
      }
      continue;
    }
    if(p.t === "roquetteJ" || p.t === "roquette"){
      var bx = p.but.gx, by = p.but.gy;
      if(p.cible){
        if(p.cible.k){ if(p.cible.o && (p.cible.o.vivant !== 0)){ bx = p.cible.o.gx; by = p.cible.o.gy; } }
        else if(p.cible.pv > 0){
          /* la cible s'est glissée dans un Brouillard : la roquette
             perd le contact et tombe là où elle croyait la trouver */
          if(p.t === "roquette" && masquee(p.cible)){
            /* contact perdu : elle tombe là où elle croyait la trouver,
               et non au point de tir initial */
            p.but = { gx:p.cible.gx, gy:p.cible.gy };
            bx = p.but.gx; by = p.but.gy;
            p.cible = null;
          }else{ bx = p.cible.gx; by = p.cible.gy; }
        }
      }
      var dx = bx - p.gx, dy = by - p.gy, d = Math.hypot(dx, dy);
      var pas = p.vit * dt;
      p.ang = Math.atan2(dy, dx);
      if(d <= pas || p.age > 6){
        if(p.t === "roquetteJ") appliqueDegatsCible(p.cible, p.degats, p.but);
        else{
          /* ceinture et bretelles : la cible est déjà lâchée dès
             qu'elle entre dans la fumée, mais si elle s'y glisse à
             l'image même de l'impact, la roquette ne la touche pas */
          /* precision:1 — c'est ce drapeau, et lui seul, qui déclenche
             la vulnérabilité de l'Ogre. Il est posé sur le coup au but
             ET sur le souffle : une roquette qui éclate à côté de lui
             doit faire mal elle aussi. */
          if(p.cible && p.cible.pv > 0 && !masquee(p.cible)) toucheUnite(p.cible, p.degats, { arme:"precision" });
          else degatsZone(bx, by, 0.8, p.degats, { epargneCachees:1, arme:"precision" });
        }
        if(p.t === "roquette"){
          /* une roquette qui pique du ciel doit marquer le sol : boule
             de feu plus franche, anneau de souffle, gerbe de sable */
          jeu.effets.push({ t:"boum", gx:bx, gy:by, age:0, duree:0.6, r:1.15, force:0.9 });
          jeu.effets.push({ t:"onde", gx:bx, gy:by, age:0, duree:0.4, r:1.7 });
          jeu.effets.push({ t:"impact", gx:bx + (Math.random() - 0.5) * 0.9,
                            gy:by + (Math.random() - 0.5) * 0.9, age:0, duree:0.35 });
        }else{
          jeu.effets.push({ t:"boum", gx:bx, gy:by, age:0, duree:0.5, r:0.9, force:0.6 });
        }
        son.boum(0.3);
        jeu.projectiles.splice(i, 1);
        continue;
      }
      p.gx += dx / d * pas; p.gy += dy / d * pas;
      /* Vol en cloche de la roquette de Frelon : elle part de la rampe
         (34 px), grimpe jusqu'à SON apogée puis pique sur la cible. Le
         guidage reste au sol — seule la hauteur dessinée suit la
         cloche, l'équilibrage n'y voit que du feu. Si la cible fuit et
         rallonge le vol, la roquette reste en descente rasante. */
      if(p.t === "roquette" && p.vol){
        var tz = Math.min(1, p.age / p.vol);
        p.z = (1 - tz) * 34 + Math.sin(tz * Math.PI) * p.apogee;
        p.tr.push(p.gx, p.gy, p.z);
        /* une demi-seconde de fumée derrière chaque roquette : c'est la
           traînée qui rend la trajectoire lisible dans le ciel */
        if(p.tr.length > 96) p.tr.splice(0, 3);
      }
    }else if(p.t === "viper"){
      var tv = p.age / p.duree;
      if(tv >= 1){
        degatsZoneEnnemis(p.cx, p.cy, p.zone, p.degats);
        degatsZone(p.cx, p.cy, p.zone, p.degats * 0.5);
        jeu.effets.push({ t:"boum", gx:p.cx, gy:p.cy, age:0, duree:0.8, r:p.zone * 1.6, force:1.4 });
        jeu.crateres.push({ gx:p.cx, gy:p.cy, r:p.zone * 0.7 });
        jeu.secousse = Math.min(14, jeu.secousse + 7);
        son.boum(0.95);
        jeu.projectiles.splice(i, 1);
        continue;
      }
      p.gx = p.x0 + (p.cx - p.x0) * tv;
      p.gy = p.y0 + (p.cy - p.y0) * tv;
      p.z = p.haut * (1 - tv) * (1 - tv);
    }else if(p.t === "nova"){
      var tn = p.age / p.duree;
      if(tn >= 1){
        explosionNova(p.cx, p.cy, p.distante);
        jeu.projectiles.splice(i, 1);
        continue;
      }
      p.gx = p.x0 + (p.cx - p.x0) * tn;
      p.gy = p.y0 + (p.cy - p.y0) * tn;
      p.z = p.haut * (1 - tn) * (1 - tn);
    }else if(p.t === "bombe" || p.t === "bobine"){
      var t = p.age / p.duree;
      if(t >= 1){
        if(p.t === "bombe"){
          if(p.allie) degatsZoneEnnemis(p.cx, p.cy, p.zone, p.degats);
          if(!p.allie || p.tousCamps)
            degatsZone(p.cx, p.cy, p.zone, p.degats,
                       (p.allie || p.braise) ? undefined
                         : { epargneCachees:1, arme:p.mortier ? "mortier" : "" });
          if(p.braise) jeu.flaques.push({ gx:p.cx, gy:p.cy, r:1.5, age:0, duree:EQ.QG_FLAQUE_DUREE });
          jeu.effets.push({ t:"boum", gx:p.cx, gy:p.cy, age:0,
                            duree:p.salve ? 0.85 : 0.62,
                            r:p.zone * (p.salve ? 1.5 : 1), force:p.salve ? 1.4 : 1 });
          jeu.crateres.push({ gx:p.cx, gy:p.cy, r:p.zone * 0.55 });
          if(jeu.crateres.length > 160) jeu.crateres.shift();
          /* Anneau de souffle au sol : c'est lui qui dit « obus » plutôt
             que « boule de feu ». Il reste discret pour un tir de Pilon
             et s'élargit franchement pour une Salve. */
          jeu.effets.push({ t:"onde", gx:p.cx, gy:p.cy, age:0,
                            duree:p.salve ? 0.55 : 0.42,
                            r:p.zone * (p.salve ? 2.2 : 1.5) });
          if(p.salve){
            /* onde au sol + gerbe de sable : quelque chose de lourd
               vient de tomber du ciel */
            for(var ge = 0; ge < 7; ge++){
              var age2 = Math.random() * 6.2832, rge = Math.random() * p.zone * 0.9;
              jeu.effets.push({ t:"impact",
                gx:p.cx + Math.cos(age2) * rge, gy:p.cy + Math.sin(age2) * rge,
                age:0, duree:0.4 });
            }
            jeu.secousse = Math.min(12, jeu.secousse + 3);
          }
          son.boum(p.salve ? 0.7 : 0.42);
        }else{
          degatsZone(p.cx, p.cy, p.zone, p.degats,
                     { ralenti:p.ralenti, type:"elec", epargneCachees:1 });
          jeu.effets.push({ t:"eclair", gx:p.cx, gy:p.cy, age:0, duree:0.42, r:p.zone });
          son.bobine();
        }
        jeu.projectiles.splice(i, 1);
        continue;
      }
      p.gx = p.x0 + (p.cx - p.x0) * t;
      p.gy = p.y0 + (p.cy - p.y0) * t;
      p.z = (p.haut || 30) * 4 * t * (1 - t);
    }
  }
}

/* ---------------------------------------------------------------
   Créatures
   --------------------------------------------------------------- */
function majCreatures(dt, tps){
  for(var i = 0; i < jeu.creatures.length; i++){
    var k = jeu.creatures[i];
    if(k.pv <= 0) continue;
    var f = CRE[k.t];
    /* cible : l'unité la plus proche dans le rayon de détection */
    k.minuteur -= dt;
    if(k.minuteur <= 0){
      k.minuteur = 0.35 + Math.random() * 0.3;
      unitesAutour(k.gx, k.gy, f.detection, tmpUni);
      var md = 1e9, best = null;
      for(var j = 0; j < tmpUni.length; j++){
        /* Cachée veut dire cachée de TOUT : les créatures ne voient pas
           plus dans la fumée que les tourelles. Sans ça un Braisard
           serait venu cogner une troupe qui, elle, a ordre de ne pas
           riposter — la fumée l'aurait condamnée au lieu de la
           protéger. Gégé et Tweety cessent aussi de fuir : elles ne
           repèrent plus personne. */
        if(masquee(tmpUni[j])) continue;
        var d2 = Math.hypot(tmpUni[j].gx - k.gx, tmpUni[j].gy - k.gy);
        if(d2 < md){ md = d2; best = tmpUni[j]; }
      }
      k.cible = (best && md <= f.detection) ? best : null;
    }
    var c = k.cible;
    /* la proie qui vient d'entrer dans la fumée est perdue de vue tout
       de suite, sans attendre le prochain balayage de détection */
    if(c && (c.pv <= 0 || masquee(c))) c = k.cible = null;

    if(k.t === "belette"){ majBelette(k, f, c, dt); continue; }
    if(k.t === "tweety"){ majTweety(k, f, c, dt); continue; }
    if(k.t === "sanglier"){ majSanglier(k, f, c, dt); continue; }
    if(k.t === "crapaud"){ majCrapaud(k, f, c, dt, tps); continue; }

    if(c){
      var dx = c.gx - k.gx, dy = c.gy - k.gy, d = Math.hypot(dx, dy);
      k.droite = (dx - dy) > 0;
      if(d > f.portee){
        deplaceCreature(k, dx, dy, f.vitesse * dt);
        k.phase += dt * (k.t === "piqueur" ? 14 : 9);
      }else{
        k.prochainTir -= dt * 1000;
        if(k.prochainTir <= 0){
          k.prochainTir = f.cadence;
          toucheUnite(c, f.degats, k.t === "braisard" ? { brulure:0 } : null);
          if(k.t === "braisard"){
            jeu.effets.push({ t:"cone", gx:k.gx, gy:k.gy, ang:Math.atan2(dy, dx),
                              portee:f.portee, ouv:0.4, age:0, duree:0.18 });
          }else{
            jeu.effets.push({ t:"piqure", gx:c.gx, gy:c.gy, age:0, duree:0.2 });
          }
        }
      }
    }else{
      /* patrouille : retour au poste */
      var rx = k.ox - k.gx, ry = k.oy - k.gy, rd = Math.hypot(rx, ry);
      if(rd > 1.2){
        deplaceCreature(k, rx, ry, f.vitesse * 0.6 * dt);
        k.phase += dt * 5;
        k.droite = (rx - ry) > 0;
      }else{
        k.phase += dt * 1.4;
      }
    }
  }
}
function deplaceCreature(k, dx, dy, pas){
  var l = Math.hypot(dx, dy); if(l < 1e-6) return;
  var nx = k.gx + dx / l * pas, ny = k.gy + dy / l * pas;
  if(!bloque(nx, k.gy)) k.gx = nx;
  if(!bloque(k.gx, ny)) k.gy = ny;
}
/* Tweety : il alterne les postures. Posé, il sautille et picore ; on
   approche, il décolle en flèche ; puis il plane et redescend se poser
   un peu plus loin. L'altitude (k.z) est ce qui le distingue de tout le
   reste du bestiaire — elle sert au dessin et à son ombre. */
function majTweety(k, f, c, dt){
  k.z = k.z || 0;
  k.butT = (k.butT || 0) - dt;

  if(c){
    /* effarouché : décollage immédiat, à l'opposé et bien haut */
    var dx = k.gx - c.gx, dy = k.gy - c.gy;
    var d = Math.hypot(dx, dy) || 1;
    k.etat = "envol";
    k.z = Math.min(34, k.z + 58 * dt);
    var a = Math.atan2(dy, dx) + Math.sin(jeu.tps * 1.7 + k.n) * 0.45;
    deplaceCreature(k, Math.cos(a), Math.sin(a), f.vitesse * dt);
    k.phase += dt * 26;                       // battement d'ailes rapide
    k.droite = (Math.cos(a) - Math.sin(a)) > 0;
    k.butT = 1.6;
    return;
  }

  if(k.butT <= 0 || !k.but){
    /* il choisit un nouveau perchoir, ou décide de picorer sur place */
    if(k.etat === "vol" || Math.random() < 0.55){
      k.etat = "pose";
      k.butT = 2.4 + Math.random() * 4.5;
      k.but = null;
    }else{
      k.etat = "vol";
      k.butT = 1.8 + Math.random() * 2.6;
      k.but = { gx:borne(k.ox + (Math.random() - 0.5) * 22, 4, PLAGE_X0 - 3),
                gy:borne(k.oy + (Math.random() - 0.5) * 22, 4, GH - 5) };
    }
  }

  if(k.etat === "vol" && k.but){
    var vx = k.but.gx - k.gx, vy = k.but.gy - k.gy;
    var dv = Math.hypot(vx, vy);
    k.z = Math.min(26, k.z + 42 * dt);
    if(dv > 0.4){
      deplaceCreature(k, vx, vy, f.vitesse * 0.62 * dt);
      k.droite = (vx - vy) > 0;
    }else{ k.but = null; k.butT = 0; }
    k.phase += dt * 20;
    return;
  }

  /* posé : il redescend, puis sautille et picore */
  k.z = Math.max(0, k.z - 46 * dt);
  k.phase += dt * (k.z > 0.5 ? 20 : 5.5);
}

/* Gégé : elle vaque à ses affaires et détale dès qu'on approche. */
function majBelette(k, f, c, dt){
  if(c){
    var dx = k.gx - c.gx, dy = k.gy - c.gy;
    var d = Math.hypot(dx, dy) || 1;
    k.etat = "fuite";
    /* elle fuit en s'écartant un peu, pas en ligne droite */
    var a = Math.atan2(dy, dx) + Math.sin(jeu.tps * 2.2 + k.n) * 0.5;
    deplaceCreature(k, Math.cos(a), Math.sin(a), f.vitesse * dt);
    k.phase += dt * 17;
    k.droite = (Math.cos(a) - Math.sin(a)) > 0;
    k.minuteur2 = 2.2;
    return;
  }
  k.etat = (k.minuteur2 > 0) ? "trot" : "flane";
  if(k.minuteur2 > 0) k.minuteur2 -= dt;
  /* flânerie : elle se choisit un but toutes les quelques secondes */
  k.butT = (k.butT || 0) - dt;
  if(k.butT <= 0 || !k.but){
    k.butT = 2.5 + Math.random() * 4;
    k.but = { gx:borne(k.ox + (Math.random() - 0.5) * 14, 3, PLAGE_X0 - 2),
              gy:borne(k.oy + (Math.random() - 0.5) * 14, 3, GH - 3) };
    if(Math.random() < 0.3) k.but = null;          // parfois elle s'arrête et renifle
  }
  if(k.but){
    var bx = k.but.gx - k.gx, by = k.but.gy - k.gy;
    var bd = Math.hypot(bx, by);
    if(bd > 0.5){
      deplaceCreature(k, bx, by, f.vitesse * (k.etat === "trot" ? 0.55 : 0.32) * dt);
      k.phase += dt * (k.etat === "trot" ? 11 : 7);
      k.droite = (bx - by) > 0;
    }else k.but = null;
  }else{
    k.phase += dt * 1.6;
  }
}
function majSanglier(k, f, c, dt){
  if(k.etat === "charge"){
    k.chargeT -= dt;
    deplaceCreature(k, Math.cos(k.ang), Math.sin(k.ang), f.vitesseCharge * dt);
    k.phase += dt * 16;
    unitesAutour(k.gx, k.gy, 1.2, tmpUni);
    for(var i = 0; i < tmpUni.length; i++){
      var u = tmpUni[i];
      if(u.touchePar === k.n) continue;
      if(Math.hypot(u.gx - k.gx, u.gy - k.gy) < 1.1){
        u.touchePar = k.n;
        toucheUnite(u, f.degats, { pousse:{ x:Math.cos(k.ang) * 2.4, y:Math.sin(k.ang) * 2.4 } });
      }
    }
    if(k.chargeT <= 0){ k.etat = "retourne"; k.minuteur2 = 1.6; }
  }else if(k.etat === "retourne"){
    k.minuteur2 -= dt;
    k.phase += dt * 2;
    if(k.minuteur2 <= 0) k.etat = "repos";
  }else{
    if(c){
      var d = Math.hypot(c.gx - k.gx, c.gy - k.gy);
      k.ang = Math.atan2(c.gy - k.gy, c.gx - k.gx);
      k.droite = (Math.cos(k.ang) - Math.sin(k.ang)) > 0;
      if(d < f.detection){
        k.etat = "charge";
        k.chargeT = f.charge / f.vitesseCharge;
        for(var m = 0; m < jeu.unites.length; m++) jeu.unites[m].touchePar = -1;
        son.grogne();
      }
    }else{
      var rx = k.ox - k.gx, ry = k.oy - k.gy;
      if(Math.hypot(rx, ry) > 1.4){ deplaceCreature(k, rx, ry, f.vitesse * dt); k.phase += dt * 3; }
      else k.phase += dt * 1.2;
    }
  }
}
function majCrapaud(k, f, c, dt, tps){
  if(c){
    var d = Math.hypot(c.gx - k.gx, c.gy - k.gy);
    k.droite = (c.gx - k.gx - (c.gy - k.gy)) > 0;
    if(d <= f.portee){
      k.prochainTir -= dt * 1000;
      k.gonfle = Math.min(1, k.gonfle + dt * 1.4);
      if(k.prochainTir <= 0){
        k.prochainTir = f.cadence;
        k.gonfle = 0;
        jeu.glu.push({ gx:c.gx, gy:c.gy, r:1.6, age:0, duree:f.dureeRalenti + 2 });
        jeu.effets.push({ t:"crachat", gx:k.gx, gy:k.gy, ex:c.gx, ey:c.gy, age:0, duree:0.35 });
      }
    }else k.gonfle = Math.max(0, k.gonfle - dt);
  }else k.gonfle = Math.max(0, k.gonfle - dt);
}

/* ---------------------------------------------------------------
   Zones persistantes : glu, flaques enflammées, fumigènes, soin
   --------------------------------------------------------------- */
function majZones(dt){
  var i;
  for(i = jeu.glu.length - 1; i >= 0; i--){
    var g = jeu.glu[i]; g.age += dt;
    if(g.age > g.duree){ jeu.glu.splice(i, 1); continue; }
    var t = [];
    unitesAutour(g.gx, g.gy, g.r, t);
    for(var k = 0; k < t.length; k++){
      if(Math.hypot(t[k].gx - g.gx, t[k].gy - g.gy) <= g.r){
        t[k].ralenti = Math.max(t[k].ralenti, 0.4); t[k].ralentiType = "glu";
      }
    }
  }
  for(i = jeu.flaques.length - 1; i >= 0; i--){
    var fl = jeu.flaques[i]; fl.age += dt;
    if(fl.age > fl.duree){ jeu.flaques.splice(i, 1); continue; }
    degatsZone(fl.gx, fl.gy, fl.r, EQ.QG_FLAQUE_DPS * dt);
  }
  for(i = jeu.brouillards.length - 1; i >= 0; i--){
    jeu.brouillards[i].age += dt;
    if(jeu.brouillards[i].age > jeu.brouillards[i].duree){
      reveleZone(jeu.brouillards[i]);
      jeu.brouillards.splice(i, 1);
    }
  }
  for(i = jeu.soin.length - 1; i >= 0; i--){
    var s = jeu.soin[i]; s.age += dt;
    if(s.age > s.duree){ jeu.soin.splice(i, 1); continue; }
    var t2 = [];
    unitesAutour(s.gx, s.gy, s.r, t2);
    for(var m = 0; m < t2.length; m++){
      var u = t2[m];
      if(u.leurre) continue;
      if(Math.hypot(u.gx - s.gx, u.gy - s.gy) <= s.r){
        u.pv = Math.min(u.pvMax, u.pv + CAP.soin.pvParSeconde * dt);
        if(u.brulure > 0) u.brulure = Math.max(0, u.brulure - dt * 2);
      }
    }
  }
  for(i = jeu.cryos.length - 1; i >= 0; i--){
    jeu.cryos[i].age += dt;
    if(jeu.cryos[i].age > jeu.cryos[i].duree) jeu.cryos.splice(i, 1);
  }
  if(jeu.balise){
    jeu.balise.reste -= dt;
    if(jeu.balise.reste <= 0){ jeu.balise = null; libereBalise(); }
  }
}

/* ---------------------------------------------------------------
   Le QG : éruptions
   --------------------------------------------------------------- */
function majQG(dt, tps){
  if(jeu.qg.pv <= 0) return;
  var fr = jeu.qg.pv / jeu.qg.pvMax;
  var accel = fr < EQ.QG_SEUIL_FRENESIE ? (1 + EQ.QG_GAIN_FRENESIE) : 1;

  if(jeu.qgTelegraphe > 0){
    jeu.qgTelegraphe -= dt;
    if(jeu.qgTelegraphe <= 0) lanceEruption();
  }else{
    jeu.qgProchaine -= dt * accel;
    if(jeu.qgProchaine <= 0 && jeu.unites.length > 0){
      jeu.qgTelegraphe = EQ.QG_TELEGRAPHE;
      jeu.qgForme = Math.random() < 0.5 ? 0 : 1;
      jeu.qgProchaine = EQ.QG_ERUPTION_MIN + Math.random() * (EQ.QG_ERUPTION_MAX - EQ.QG_ERUPTION_MIN);
      montreAlerte(jeu.qgForme === 0 ? "⚠ PLUIE DE BRAISE ⚠" : "⚠ VAGUE DE FEU ⚠");
      son.telegraphe();
    }else if(jeu.qgProchaine <= 0){
      jeu.qgProchaine = 3;
    }
  }

  /* vague de feu en cours */
  if(jeu.vague){
    var v = jeu.vague;
    var r0 = v.r;
    v.r += EQ.QG_VAGUE_VITESSE * dt;
    for(var i = 0; i < jeu.unites.length; i++){
      var u = jeu.unites[i];
      if(u.vagueVue === v.id) continue;
      var d = Math.hypot(u.gx - jeu.qg.gx, u.gy - jeu.qg.gy);
      if(d >= r0 && d < v.r){
        u.vagueVue = v.id;
        toucheUnite(u, EQ.QG_VAGUE_DEGATS);
      }
    }
    if(v.r > EQ.QG_VAGUE_PORTEE) jeu.vague = null;
  }
}
function lanceEruption(){
  cacheAlerte();
  if(jeu.qgForme === 0){
    var n = EQ.QG_PLUIE_MIN + ((Math.random() * (EQ.QG_PLUIE_MAX - EQ.QG_PLUIE_MIN + 1)) | 0);
    for(var i = 0; i < n; i++){
      var a = Math.random() * 6.2832;
      var r = 3 + Math.random() * EQ.QG_PLUIE_RAYON;
      var cx = jeu.qg.gx + Math.cos(a) * r, cy = jeu.qg.gy + Math.sin(a) * r;
      jeu.projectiles.push({ t:"bombe", gx:jeu.qg.gx, gy:jeu.qg.gy, x0:jeu.qg.gx, y0:jeu.qg.gy,
        cx:cx, cy:cy, duree:0.9 + Math.random() * 0.9 + i * 0.035, age:0,
        degats:46, zone:1.4, haut:70, braise:1 });
    }
    son.boum(1.0);
  }else{
    jeu.vague = { r:2, id:Math.random() };
    son.boum(1.35);
  }
  jeu.secousse = Math.min(14, jeu.secousse + 7);
}

/* ---------------------------------------------------------------
   Capacités
   --------------------------------------------------------------- */
/* La Nova ne se paie pas en Énergie : on en a UNE par vie, point.
   C'est ce qui la garde rare, et ce qui rend son emploi mémorable. */
function capaciteDisponible(m){
  if(m === "nova") return jeu.novaDispo > 0;
  return jeu.energie >= coutActuel(m, jeu.usages);
}
function armeCapacite(m){
  if(!capaciteDisponible(m)){
    message(m === "nova" ? "Nova déjà employée : il faut une nouvelle vie."
                         : "Pas assez d'Énergie pour " + COUT[m].nom + ".");
    return;
  }
  jeu.capArmee = (jeu.capArmee === m) ? null : m;
  majMenu();
  if(jeu.capArmee) son.gong();
}
function utiliseCapacite(m, gx, gy){
  if(!capaciteDisponible(m)){
    jeu.capArmee = null;
    majMenu();
    message(m === "nova" ? "Nova déjà employée pendant cette vie."
                         : "Plus assez d'Énergie : " + COUT[m].nom + " désarmée.");
    return;
  }
  if(m === "nova") jeu.novaDispo--;
  else jeu.energie -= coutActuel(m, jeu.usages);
  jeu.usages[m]++;

  if(m === "balise"){
    /* Sur quoi la fusée est-elle tombée ? Le BRASIER d'abord — il est
       énorme et prioritaire : posée dessus, la Balise doit lancer
       l'assaut du QG, pas envoyer les troupes s'entasser contre ses
       murs en essayant d'entrer. Un bâtiment ensuite. Sinon, c'est un
       simple point de ralliement au sol. */
    var vise = null, surQG = 0, mdv = 1e9;
    if(Math.hypot(gx - jeu.qg.gx, gy - jeu.qg.gy) <= RAYON_QG + 2.5 && jeu.qg.pv > 0){
      vise = jeu.qg; surQG = 1;
    }else{
      batimentsAutour(gx, gy, 3, tmpBat);
      for(var v = 0; v < tmpBat.length; v++){
        var bv = tmpBat[v];
        var dv = Math.hypot(bv.gx - gx, bv.gy - gy);
        if(dv <= bv.e * 0.62 + 0.5 && dv < mdv){ mdv = dv; vise = bv; }
      }
    }
    jeu.idBalise = (jeu.idBalise || 0) + 1;
    jeu.balise = { gx:gx, gy:gy, reste:CAP.balise.duree, duree:CAP.balise.duree,
                   id:jeu.idBalise, cible:vise, surQG:surQG };
    /* L'ordre est donné à CHAQUE unité vivante, une par une. Il écrase
       le ciblage en cours : aucune ne doit continuer à taper une
       défense proche tant qu'elle n'a pas rejoint la balise. */
    for(var z2 = 0; z2 < jeu.unites.length; z2++){
      jeu.unites[z2].baliseOrdre = jeu.balise.id;
      jeu.unites[z2].baliseMeilleure = 1e9;
      jeu.unites[z2].baliseStagne = 0;
      jeu.unites[z2].baliseSeuil = 7.0 + Math.random() * 4.0;
      jeu.unites[z2].cible = null;
    }
    jeu.effets.push({ t:"baliseLancee", gx:gx, gy:gy, age:0, duree:0.6 });
    son.balise();

  }else{
    lanceCapacite(m, gx, gy, false);
  }

  /* Les autres joueurs de l'île doivent VOIR cette capacité — et ses
     zones doivent agir chez eux aussi. La Balise, elle, n'ordonne
     qu'à nos propres troupes : rien à montrer. */
  if(m !== "balise") envoie({ t:"cap", m:m, x:gx, y:gy, c:jeu.index });

  demandeMajBarres();
  majMenu();
  if(!capaciteDisponible(m)){
    jeu.capArmee = null;
    majMenu();
    if(m !== "nova") message(COUT[m].nom + " désarmée : Énergie insuffisante.");
  }
}

/* Fait exister une capacité sur le terrain. `distante` distingue la
   nôtre de celle d'un AUTRE joueur du salon : la sienne est montrée à
   l'identique et ses ZONES agissent pour de vrai — son Cryo gèle nos
   défenses simulées, son Brouillard cache nos troupes, son Soin les
   répare, ses Poulets détournent les tourelles — mais elle n'inflige
   AUCUN dégât local. Ses dégâts à lui voyagent déjà par « deg » et
   « det » : les rejouer ici les compterait deux fois. */
function lanceCapacite(m, gx, gy, distante){
  if(m === "brouillard"){
    jeu.brouillards.push({ gx:gx, gy:gy, r:CAP.brouillard.rayon, age:0, duree:CAP.brouillard.duree });
    son.brouillard();

  }else if(m === "soin"){
    jeu.soin.push({ gx:gx, gy:gy, r:CAP.soin.rayon, age:0, duree:CAP.soin.duree });
    son.soin();

  }else if(m === "cryo"){
    jeu.cryos.push({ gx:gx, gy:gy, r:CAP.cryo.rayon, age:0, duree:CAP.cryo.duree });
    /* les tourelles prises dans la glace lâchent leur cible sur-le-champ */
    var bs = [];
    batimentsAutour(gx, gy, CAP.cryo.rayon + 2, bs);
    for(var k = 0; k < bs.length; k++){
      if(Math.hypot(bs[k].gx - gx, bs[k].gy - gy) <= CAP.cryo.rayon){
        bs[k].cible = null;
        bs[k].prochainTir = Math.max(bs[k].prochainTir, 200);
      }
    }
    jeu.effets.push({ t:"cryo", gx:gx, gy:gy, age:0, duree:0.8, r:CAP.cryo.rayon });
    son.cryo();

  }else if(m === "poulets"){
    /* dix leurres : les défenses les prennent pour des troupes */
    for(var q = 0; q < CAP.poulets.nb; q++){
      var ap = q / CAP.poulets.nb * 6.2832 + Math.random();
      var rp = Math.random() * CAP.poulets.rayon;
      creePoulet(gx + Math.cos(ap) * rp, gy + Math.sin(ap) * rp);
    }
    jeu.effets.push({ t:"caisse", gx:gx, gy:gy, age:0, duree:0.7 });
    son.poulets();

  }else if(m === "viper"){
    /* un seul missile, très rapide, arrivée quasi verticale */
    jeu.projectiles.push({
      t:"viper", gx:gx - 5.5, gy:gy - 5.5, x0:gx - 5.5, y0:gy - 5.5,
      cx:gx, cy:gy, age:0, duree:Math.max(0.45, 9 / CAP.viper.vitesse),
      degats:distante ? 0 : CAP.viper.degats, zone:CAP.viper.rayon, haut:230, fumee:[]
    });
    jeu.effets.push({ t:"frappe", gx:gx, gy:gy, age:0, duree:0.5 });
    son.viper();

  }else if(m === "salve"){
    /* plusieurs missiles presque simultanés, impacts dispersés :
       ils touchent bâtiments, créatures ET troupes, alliées comprises */
    for(var i = 0; i < CAP.salve.nb; i++){
      var a = Math.random() * 6.2832, r = Math.sqrt(Math.random()) * CAP.salve.rayon;
      /* Ils partent de haut et de loin, et retombent en piqué : on doit
         VOIR quelque chose tomber du ciel, pas une explosion qui naît
         au sol. La hauteur de cloche est franche, et les départs sont
         échelonnés pour que la salve dure. */
      var ad = Math.random() * 6.2832;
      jeu.projectiles.push({
        t:"bombe", salve:1,
        gx:gx + Math.cos(ad) * 26, gy:gy + Math.sin(ad) * 26 - 22,
        x0:gx + Math.cos(ad) * 26, y0:gy + Math.sin(ad) * 26 - 22,
        cx:gx + Math.cos(a) * r, cy:gy + Math.sin(a) * r,
        duree:0.75 + i / CAP.salve.nb * CAP.salve.duree, age:0,
        degats:distante ? 0 : CAP.salve.degats, zone:CAP.salve.zone, haut:150,
        allie:1, tousCamps:1
      });
    }
    son.salve();

  }else if(m === "nova"){
    /* gros spectacle, dégâts mesurés */
    jeu.projectiles.push({
      t:"nova", gx:gx - 3, gy:gy - 9, x0:gx - 3, y0:gy - 9,
      cx:gx, cy:gy, age:0, duree:1.15, haut:300, distante:distante ? 1 : 0
    });
    son.nova();
  }
}

/* --------------- Nova : le champignon --------------- */
function explosionNova(gx, gy, distante){
  var C = CAP.nova;
  if(!distante){
    /* cœur : tout ce qui traîne dedans prend cher, alliés compris */
    degatsZoneEnnemis(gx, gy, C.rayon, C.degats);
    degatsZone(gx, gy, C.rayon, C.degats);
    /* souffle : plus large, beaucoup plus doux */
    degatsZoneEnnemis(gx, gy, C.rayonSouffle, C.degatsSouffle);
    degatsZone(gx, gy, C.rayonSouffle, C.degatsSouffle);
  }
  jeu.effets.push({ t:"nova", gx:gx, gy:gy, age:0, duree:3.2, r:C.rayon });
  jeu.crateres.push({ gx:gx, gy:gy, r:C.rayon * 0.75 });
  if(jeu.crateres.length > 160) jeu.crateres.shift();
  jeu.secousse = 22;
  son.boum(1.9);
}

/* --------------- Les poulets leurres --------------- */
function creePoulet(gx, gy){
  jeu.poulets.push({
    t:"poulet", leurre:1, gx:borne(gx, 1, GW - 1), gy:borne(gy, 1, GH - 1),
    pv:CAP.poulets.pv, pvMax:CAP.poulets.pv, reste:CAP.poulets.duree,
    phase:Math.random() * 6.2832, droite:Math.random() < 0.5,
    but:null, butT:0, n:jeu.nSuiv++, brulure:0, ralenti:0, ralentiType:"",
    pousse:{ x:0, y:0 }
  });
}
function majPoulets(dt){
  for(var i = jeu.poulets.length - 1; i >= 0; i--){
    var p = jeu.poulets[i];
    p.reste -= dt;
    if(p.brulure > 0){ p.brulure -= dt; p.pv -= EQ.BRULURE_DPS * dt; }
    if(p.ralenti > 0) p.ralenti -= dt;
    if(p.pv <= 0 || p.reste <= 0){
      jeu.effets.push({ t:"plumes", gx:p.gx, gy:p.gy, age:0, duree:0.8 });
      if(p.pv <= 0) son.poulet();
      jeu.poulets.splice(i, 1);
      continue;
    }
    /* ils détalent au hasard : c'est tout l'intérêt du leurre */
    p.butT -= dt;
    if(p.butT <= 0 || !p.but){
      p.butT = 0.5 + Math.random() * 1.1;
      var a = Math.random() * 6.2832, r = 1.5 + Math.random() * 3;
      p.but = { gx:p.gx + Math.cos(a) * r, gy:p.gy + Math.sin(a) * r };
    }
    var dx = p.but.gx - p.gx, dy = p.but.gy - p.gy;
    var d = Math.hypot(dx, dy);
    if(d > 0.25){
      deplaceCreature(p, dx, dy, 2.3 * (p.ralenti > 0 ? 0.45 : 1) * dt);
      p.phase += dt * 16;
      p.droite = (dx - dy) > 0;
    }else p.but = null;
  }
}

/* Une défense prise dans le Cryo ne tire plus du tout */
function geleeParCryo(b){
  for(var i = 0; i < jeu.cryos.length; i++){
    var z = jeu.cryos[i];
    if(Math.hypot(b.gx - z.gx, b.gy - z.gy) <= z.r) return true;
  }
  return false;
}

/* ---------------------------------------------------------------
   Mort, fantôme, renaissance
   --------------------------------------------------------------- */
function majMort(dt){
  if(!jeu.mort){
    if(jeu.unites.length === 0 && jeu.barges.length === 0 &&
       jeu.navettes.length === 0 && jeu.tps > 3){
      jeu.mort = true;
      jeu.tempsRenfort = EQ.ATTENTE_RENFORT;
      var p = jeu.dernierePerte || { gx:PLAGE_X0 + 2, gy:GH / 2 };
      jeu.fantome = { gx:p.gx, gy:p.gy, bx:p.gx, by:p.gy, ph:Math.random() * 6, prochain:0, nom:monNom };
      montreBandeauFantome(true);
    }
    return;
  }
  jeu.tempsRenfort -= dt;
  var f = jeu.fantome;
  f.prochain -= dt;
  if(f.prochain <= 0){
    f.prochain = 8 + Math.random() * 7;
    f.bx = borne(f.gx + (Math.random() - 0.5) * 26, 4, GW + 4);
    f.by = borne(f.gy + (Math.random() - 0.5) * 26, 4, GH - 4);
  }
  var dx = f.bx - f.gx, dy = f.by - f.gy, d = Math.hypot(dx, dy);
  if(d > 0.2){ f.gx += dx / d * 0.95 * dt; f.gy += dy / d * 0.95 * dt; }
  majBandeauFantome(jeu.tempsRenfort);
  if(jeu.tempsRenfort <= 0){
    jeu.mort = false;
    jeu.fantome = null;
    jeu.barges = [];
    for(var i = 0; i < EQ.NB_BARGES; i++)
      jeu.barges.push({ type:compoBarges[i].type, n:compoBarges[i].n, num:i + 1 });
    jeu.bargeSel = 0;
    jeu.energie += EQ.ENERGIE_BONUS_RENFORT;
    jeu.novaDispo = EQ.NOVA_PAR_VIE;   // une vie neuve, une Nova neuve
    /* Une vie neuve, des tarifs neufs. Chaque emploi d'une capacité en
       renchérit le suivant ; après trois ou quatre morts, la note était
       telle qu'on ne pouvait plus rien lancer du tout. Le compteur
       d'usages repart donc à zéro avec la flotte. */
    for(var cu in jeu.usages) jeu.usages[cu] = 0;
    montreBandeauFantome(false);
    majBarres();
    message("Flotte neuve ! +" + EQ.ENERGIE_BONUS_RENFORT + " d'Énergie, Nova rechargée.");
    son.renfort();
  }
}

/* ---------------------------------------------------------------
   Chute du QG : la séquence finale
   --------------------------------------------------------------- */
/* Qui a le plus contribué ? Le classement local vaut ce que valent les
   messages reçus, mais c'est la même information que le TOP DÉGÂTS que
   tout le monde a sous les yeux depuis le début de la partie. */
function championDeLaPartie(){
  /* Le sacre lit le MÊME classement que le podium et le bilan. Il lisait
     autrefois autresJoueurs, où un joueur déconnecté n'existe plus :
     celui qui avait fait le gros du travail pouvait donc se voir voler
     la première place en partant deux minutes avant la fin. */
  var l = (typeof classementSalon === "function") ? classementSalon() : null;
  if(l && l.length) return { nom:l[0].nom, g:l[0].g, moi:l[0].moi };
  return { nom:monNom || "Anonyme", g:jeu.degatsMoi, moi:1 };
}

function declencheFin(){
  jeu.fin = {
    age:0, tete:null, confettis:null, texte:0,
    champion:championDeLaPartie(),
    effondrement:0,          // 0 → 1 : la forteresse s'enfonce et penche
    debris:[], ondes:[], colonne:[],
    prochaineFumee:0
  };
  envoieCarte(jeu.index + 1);
  /* les panneaux de commande s'effacent : plus rien à commander, et
     ils masqueraient la chute de la forteresse */
  var h = document.getElementById("hud");
  if(h) h.classList.add("fin");
  son.grondement();
}
var FIN_EFFONDREMENT = 3.2;      // s : la forteresse s'écroule d'abord
var FIN_SOUFFLE = 3.2;           // s : instant de la déflagration

function majFin(dt){
  var F = jeu.fin;
  F.age += dt;
  var p = jeu.qg;

  /* ---- 0. LA CAMÉRA REVIENT SUR LE BRASIER ----
     C'est le seul moment de la partie qui mérite d'être regardé, et le
     joueur est presque toujours ailleurs quand il tombe — au fond de la
     plage, ou sur la cellule qu'il achevait. On le ramène en douceur,
     sans coupure, et on recule un peu : la déflagration monte très
     haut. Ensuite plus personne ne touche à la caméra. */
  cadreLaFin(dt);

  /* ---- 1. l'effondrement : elle s'enfonce, penche, et se déchire ---- */
  if(F.age < FIN_EFFONDREMENT){
    var t = F.age / FIN_EFFONDREMENT;
    /* courbe accélérée : imperceptible d'abord, brutale à la fin */
    F.effondrement = t * t * t;
    F.prochain = (F.prochain || 0) - dt;
    if(F.prochain <= 0){
      /* les explosions remontent les terrasses au fur et à mesure */
      F.prochain = 0.10 - t * 0.062;
      var a = Math.random() * 6.2832, r = (0.6 + Math.random() * 3.2) * (1 - t * 0.4);
      jeu.effets.push({ t:"boum", gx:p.gx + Math.cos(a) * r, gy:p.gy + Math.sin(a) * r,
                        age:0, duree:0.5 + Math.random() * 0.3,
                        r:0.7 + Math.random() * (0.8 + t * 1.6), force:1 });
      jeu.secousse = Math.min(18, jeu.secousse + 1.0 + t * 4);
      son.boum(0.28 + Math.random() * 0.28 + t * 0.3);
      /* des débris partent déjà, arrachés à la maçonnerie */
      if(Math.random() < 0.5 + t) ajouteDebris(F, 1 + (t * 3 | 0), 0.6 + t);
    }
    /* colonne de fumée qui grossit tout au long de la chute */
    F.prochaineFumee -= dt;
    if(F.prochaineFumee <= 0){
      F.prochaineFumee = 0.12;
      F.colonne.push({ x:(Math.random() - 0.5) * 60, y:0, vy:-38 - Math.random() * 40,
                       r:14 + Math.random() * 22, age:0, duree:3.2 + Math.random() * 2 });
    }
  }

  /* ---- 2. la déflagration ---- */
  if(F.age >= FIN_SOUFFLE && !F.tete){
    F.flash = 1.9;
    F.effondrement = 1;
    F.tete = { x:0, y:0, vy:-340, rot:0, age:0 };
    jeu.secousse = 30;
    son.boum(2.2);
    son.sifflet();
    /* trois ondes de choc concentriques */
    for(var o = 0; o < 3; o++) F.ondes.push({ age:-o * 0.16, r:0 });
    /* et une pluie de débris, dans toutes les directions */
    ajouteDebris(F, 90, 2.6);
    /* le champignon de fumée */
    for(var m = 0; m < 26; m++){
      F.colonne.push({ x:(Math.random() - 0.5) * 130, y:-Math.random() * 90,
                       vy:-52 - Math.random() * 70, r:22 + Math.random() * 36,
                       age:0, duree:4.5 + Math.random() * 3 });
    }
  }

  /* ---- 3. la vie des morceaux ---- */
  for(var i = F.debris.length - 1; i >= 0; i--){
    var d = F.debris[i];
    d.age += dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.vy += 340 * dt;                     // gravité
    d.rot += d.vr * dt;
    if(d.y > d.sol){                      // rebond amorti, puis il s'immobilise
      d.y = d.sol;
      d.vy = -d.vy * 0.34;
      d.vx *= 0.6; d.vr *= 0.5;
      if(Math.abs(d.vy) < 24){ d.vy = 0; d.vx = 0; d.vr = 0; }
    }
    if(d.age > d.duree) F.debris.splice(i, 1);
  }
  for(var q = F.ondes.length - 1; q >= 0; q--){
    F.ondes[q].age += dt;
    F.ondes[q].r = Math.max(0, F.ondes[q].age) * 900;
    if(F.ondes[q].age > 1.5) F.ondes.splice(q, 1);
  }
  for(var f2 = F.colonne.length - 1; f2 >= 0; f2--){
    var fu = F.colonne[f2];
    fu.age += dt;
    fu.y += fu.vy * dt;
    fu.vy *= (1 - dt * 0.5);              // elle ralentit en montant
    fu.r += dt * 22;
    if(fu.age > fu.duree) F.colonne.splice(f2, 1);
  }
  if(F.tete){
    F.tete.age += dt;
    F.tete.y += F.tete.vy * dt;
    F.tete.vy += 60 * dt;
    F.tete.rot += dt * 7;
  }
  if(F.age >= FIN_SOUFFLE + 1.8 && !F.confettis){
    F.confettis = [];
    for(var i = 0; i < 160; i++){
      F.confettis.push({
        x:Math.random(), y:-Math.random() * 0.6, vy:0.18 + Math.random() * 0.35,
        vx:(Math.random() - 0.5) * 0.1, rot:Math.random() * 6.2832,
        vr:(Math.random() - 0.5) * 9, c:(Math.random() * 6) | 0, w:5 + Math.random() * 7
      });
    }
    son.confettis();
  }
  if(F.confettis){
    for(var k = 0; k < F.confettis.length; k++){
      var c = F.confettis[k];
      c.y += c.vy * dt; c.x += c.vx * dt; c.rot += c.vr * dt;
      if(c.y > 1.2){ c.y = -0.1; c.x = Math.random(); }
    }
  }
  if(F.flash > 0) F.flash -= dt * 2.2;
  /* le sacre doit avoir le temps d'être lu avant que le tableau
     de bilan ne recouvre l'écran */
  if(F.age >= 10.5 && !F.bilanMontre){
    F.bilanMontre = 1;
    montreBilan();
  }
}

/* Le cadrage de la séquence finale. On vise un zoom qui laisse tenir la
   forteresse ET sa colonne de fumée dans la hauteur disponible : sur une
   tablette en portrait, la hauteur est le facteur limitant, en paysage
   c'est la largeur. Le point visé est légèrement AU-DESSUS du pied de la
   forteresse, sinon l'explosion sort par le haut de l'écran. */
function cadreLaFin(dt){
  var zBut = borne(Math.min(W / 1000, H / 900), ZMIN, 0.7);
  var pBut = iso(jeu.qg.gx, jeu.qg.gy);
  /* approche exponentielle : rapide au début, elle se pose sans à-coup */
  var k = 1 - Math.exp(-dt * 2.6);
  cam.z += (zBut - cam.z) * k;
  cam.px += (W / 2 - pBut.x * cam.z - cam.px) * k;
  cam.py += (H * 0.60 - pBut.y * cam.z - cam.py) * k;
}

/* Éclats de maçonnerie projetés. Ils vivent en coordonnées ÉCRAN
   relatives au pied du Brasier : le tri de profondeur n'a rien à leur
   apprendre, ils volent au-dessus de tout. */
function ajouteDebris(F, n, force){
  for(var i = 0; i < n; i++){
    var a = Math.random() * 6.2832;
    var v = (90 + Math.random() * 320) * force;
    F.debris.push({
      x:(Math.random() - 0.5) * 40, y:-40 - Math.random() * 220,
      vx:Math.cos(a) * v, vy:-Math.abs(Math.sin(a)) * v - 120 * force,
      rot:Math.random() * 6.2832, vr:(Math.random() - 0.5) * 15,
      w:4 + Math.random() * 13, sol:20 + Math.random() * 90,
      teinte:(Math.random() * 3) | 0, feu:Math.random() < 0.34,
      age:0, duree:3.4 + Math.random() * 2.6
    });
  }
}

/* ---------------------------------------------------------------
   Boucle de simulation
   --------------------------------------------------------------- */
function majJeu(dt){
  jeu.tps += dt;
  if(jeu.messageGege > 0) jeu.messageGege = Math.max(0, jeu.messageGege - dt);
  if(jeu.messageTweety > 0) jeu.messageTweety = Math.max(0, jeu.messageTweety - dt);
  if(jeu.secousse > 0) jeu.secousse = Math.max(0, jeu.secousse - dt * 22);
  majBouclier(dt);
  construitGrilleUnites();
  if(jeu.fin){ majFin(dt); majEffets(dt); return; }
  majNavettes(dt);
  majUnites(dt);
  separeUnites(dt);
  majPoulets(dt);
  majDefenses(dt, jeu.tps);
  majCreatures(dt, jeu.tps);
  majProjectiles(dt);
  majZones(dt);
  majQG(dt, jeu.tps);
  majEffets(dt);
  majMort(dt);
}
function majEffets(dt){
  for(var i = jeu.effets.length - 1; i >= 0; i--){
    var e = jeu.effets[i];
    e.age += dt;
    if(e.age > e.duree) jeu.effets.splice(i, 1);
  }
}
