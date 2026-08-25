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
  carte = genereCarte(CODE_SALON, index);
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
    fumees:[], soins:[], fusee:null,
    poudre:EQ.POUDRE_DEPART,
    usages:{ fusee:0, fumee:0, soins:0, obus:0, barrage:0 },
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
    jeu.barges.push({ meuf:compoBarges[i].meuf, mec:compoBarges[i].mec, n:i + 1 });
  }
  if(typeof pvConnu === "number" && pvConnu >= 0 && pvConnu < jeu.qg.pvMax){
    jeu.file.adopteMinimum(pvConnu);
    jeu.qg.pv = jeu.file.pv;
  }
  construitGrilles();
  construitContourIle();
  construitSol(carte);
  centreSurPlage();
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
  jeu.batiments.forEach(function(b){ marqueEmprise(b, 1); });
  /* emprise du QG */
  for(i = -3; i <= 3; i++) for(j = -3; j <= 3; j++){
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
  for(var i = 0; i < jeu.unites.length; i++){
    var u = jeu.unites[i];
    var cx = Math.min(GUW - 1, Math.max(0, (u.gx / GU) | 0));
    var cy = Math.min(GUH - 1, Math.max(0, (u.gy / GU) | 0));
    grilleUni[cy * GUW + cx].push(u);
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

function poseBarge(gx, gy){
  if(jeu.mort) return message("Ta flotte est perdue, attends le renfort.");
  var b = jeu.barges[jeu.bargeSel];
  if(!b) return message("Plus aucune barge.");
  gx = borne(gx, PLAGE_X0, GW - 1.2);
  gy = borne(gy, 3, GH - 4);
  var n = b.meuf + b.mec, pose = 0, k = 0;
  var liste = [];
  for(var i = 0; i < b.meuf; i++) liste.push("meuf");
  for(var j = 0; j < b.mec; j++) liste.push("mec");
  /* déploiement en spirale autour du drapeau */
  while(pose < liste.length && k < 400){
    var a = k * 2.399963, r = 0.42 * Math.sqrt(k);
    var x = gx + Math.cos(a) * r, y = gy + Math.sin(a) * r;
    k++;
    if(bloque(x, y)) continue;
    creeUnite(liste[pose], x, y);
    pose++;
  }
  jeu.effets.push({ t:"drapeau", gx:gx, gy:gy, age:0, duree:6 });
  jeu.barges.splice(jeu.bargeSel, 1);
  if(jeu.bargeSel >= jeu.barges.length) jeu.bargeSel = Math.max(0, jeu.barges.length - 1);
  majBarres();
  son.debarque();
}
function creeUnite(type, gx, gy){
  var f = UNI[type];
  jeu.unites.push({
    t:type, gx:gx, gy:gy, pv:f.pv, pvMax:f.pv, n:jeu.nSuiv++,
    phase:Math.random() * 6.2832, var:(Math.random() * 3) | 0, droite:false,
    cible:null, prochainCiblage:Math.random() * EQ.PERIODE_CIBLAGE,
    prochainTir:0, tir:0, brulure:0, ralenti:0, ralentiType:"", vitMod:1, fuseeVue:-1,
    pousse:{ x:0, y:0 }
  });
}

/* ---------------------------------------------------------------
   Dégâts
   --------------------------------------------------------------- */
function toucheUnite(u, degats, opt){
  if(u.pv <= 0) return;
  u.pv -= degats;
  if(opt){
    if(opt.brulure) u.brulure = Math.max(u.brulure, EQ.BRULURE_DUREE);
    if(opt.ralenti){ u.ralenti = Math.max(u.ralenti, opt.ralenti); u.ralentiType = opt.type || "elec"; }
    if(opt.pousse){ u.pousse.x += opt.pousse.x; u.pousse.y += opt.pousse.y; }
  }
  if(u.pv <= 0){
    jeu.effets.push({ t:"mort", gx:u.gx, gy:u.gy, age:0, duree:0.55, typ:u.t });
    if(jeu.fantome === null) jeu.dernierePerte = { gx:u.gx, gy:u.gy };
  }
}
function degatsZone(gx, gy, rayon, degats, opt){
  var tmp = [];
  unitesAutour(gx, gy, rayon + 1, tmp);
  for(var i = 0; i < tmp.length; i++){
    var u = tmp[i];
    if(Math.hypot(u.gx - gx, u.gy - gy) <= rayon) toucheUnite(u, degats, opt);
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
  if(Math.hypot(jeu.qg.gx - gx, jeu.qg.gy - gy) <= rayon + 3.4) abimeQG(degats);
}
function abimeBatiment(b, d){
  if(!b.vivant) return;
  b.pv -= d;
  if(b.pv <= 0){
    b.vivant = 0;
    marqueEmprise(b, 0);
    /* une fusée posée sur ce bâtiment cesse d'agir dès qu'il tombe */
    if(jeu.fusee && jeu.fusee.cible === b){
      jeu.fusee = null;
      for(var z = 0; z < jeu.unites.length; z++){ jeu.unites[z].cible = null; jeu.unites[z].prochainCiblage = 0; }
    }
    jeu.poudre += EQ.POUDRE_PAR_BATIMENT;
    jeu.detruitsMoi++;
    jeu.effets.push({ t:"boum", gx:b.gx, gy:b.gy, age:0, duree:0.75, r:b.e * 0.7, force:1 });
    jeu.crateres.push({ gx:b.gx, gy:b.gy, r:b.e * 0.45 });
    if(jeu.crateres.length > 160) jeu.crateres.shift();
    jeu.secousse = Math.min(9, jeu.secousse + 3);
    son.boum(0.42);
    son.poudre();
    envoieDestruction(b.n);
    majBarres();
  }
}
function abimeCreature(c, d){
  if(c.pv <= 0) return;
  c.pv -= d;
  if(c.pv <= 0){
    jeu.effets.push({ t:"mortCre", gx:c.gx, gy:c.gy, age:0, duree:0.7, typ:c.t });
    jeu.poudre += 1;
    if(c.t === "belette"){
      jeu.messageGege = 3.0;                       // trois secondes de deuil
      son.gege();
    }
    majBarres();
  }
}
function abimeQG(d){
  if(jeu.qg.pv <= 0) return;
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
function deplace(u, dx, dy, pas){
  var l = Math.hypot(dx, dy);
  if(l < 1e-6) return;
  dx /= l; dy /= l;
  var nx = u.gx + dx * pas, ny = u.gy + dy * pas;
  var okX = !bloque(nx, u.gy), okY = !bloque(u.gx, ny);
  if(okX && okY && !bloque(nx, ny)){ u.gx = nx; u.gy = ny; return; }
  if(okX) u.gx = nx;
  if(okY) u.gy = ny;
  if(!okX && !okY){
    /* contournement : on tente les deux tangentes */
    var t1x = -dy, t1y = dx;
    if(!bloque(u.gx + t1x * pas, u.gy + t1y * pas)){ u.gx += t1x * pas; u.gy += t1y * pas; }
    else if(!bloque(u.gx - t1x * pas, u.gy - t1y * pas)){ u.gx -= t1x * pas; u.gy -= t1y * pas; }
  }
  u.gx = borne(u.gx, 0.4, GW - 0.5);
  u.gy = borne(u.gy, 0.4, GH - 0.5);
}

/* ---------------------------------------------------------------
   Mise à jour des unités
   --------------------------------------------------------------- */
var tmpBat = [], tmpUni = [];
function majUnites(dt){
  var i, u;
  var fusee = jeu.fusee;
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

    /* --- Éclairante ------------------------------------------------
       Deux comportements, selon l'endroit où la fusée est tombée.
       L'effet est SUIVI TROUPE PAR TROUPE : chacune se libère pour son
       propre compte, les autres continuent de converger.               */
    if(fusee && u.fuseeVue !== fusee.id){
      var bc = fusee.cible;
      if(bc && bc.vivant){
        /* 2) fusée posée sur une défense ou un bâtiment :
              on y va et on le démonte en priorité */
        var dxb = bc.gx - u.gx, dyb = bc.gy - u.gy;
        var db = Math.hypot(dxb, dyb) - bc.e * 0.42;
        u.droite = (dxb - dyb) > 0;
        u.cible = { k:"bat", o:bc };
        if(db > f.arret){
          deplace(u, dxb, dyb, vit * dt);
          u.phase += dt * (u.t === "mec" ? 6.2 : 8.6);
        }else{
          u.phase += dt * 1.5;
          u.prochainTir -= dt * 1000;
          if(u.prochainTir <= 0){
            u.prochainTir = f.cadence;
            u.tir = 1;
            tireUnite(u, { gx:bc.gx, gy:bc.gy }, u.cible);
          }
        }
        continue;
      }
      if(!bc){
        /* 1) fusée au sol : ralliement sans tirer, jusqu'à ce que la
              troupe ait atteint (ou traversé) la zone de la fusée */
        var dxf = fusee.gx - u.gx, dyf = fusee.gy - u.gy;
        var df = Math.hypot(dxf, dyf);
        if(df > EQ.FUSEE_RAYON){
          deplace(u, dxf, dyf, vit * dt);
          u.phase += dt * 9;
          u.droite = (dxf - dyf) > 0;
          u.cible = null;
          continue;
        }
        /* zone atteinte : cette fusée ne l'influence plus, jamais */
        u.fuseeVue = fusee.id;
        u.cible = null;
        u.prochainCiblage = 0;
      }else{
        /* la cible de la fusée est tombée : libération immédiate */
        u.fuseeVue = fusee.id;
        u.cible = null;
        u.prochainCiblage = 0;
      }
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
      rayonCible = c.k === "bat" ? c.o.e * 0.42 : (c.k === "qg" ? 3.3 : 0.3);
    }else{
      but = { gx:jeu.qg.gx, gy:jeu.qg.gy };
      rayonCible = 3.3;
    }
    var dx = but.gx - u.gx, dy = but.gy - u.gy;
    var d = Math.hypot(dx, dy) - rayonCible;
    u.droite = (dx - dy) > 0;

    if(d > portee){
      deplace(u, dx, dy, vit * dt);
      u.phase += dt * (u.t === "mec" ? 6.2 : 8.6);
    }else{
      /* à portée : on tire */
      u.phase += dt * 1.5;
      u.prochainTir -= dt * 1000;
      if(u.prochainTir <= 0){
        u.prochainTir = f.cadence;
        u.tir = 1;
        tireUnite(u, but, c);
      }
    }
  }
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
  var dq = Math.hypot(jeu.qg.gx - u.gx, jeu.qg.gy - u.gy) - 3.3;
  if(dq < md && dq < 12) meilleur = { k:"qg", o:jeu.qg };
  return meilleur;
}
function tireUnite(u, but, c){
  var f = UNI[u.t];
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
function appliqueDegatsCible(c, d, but){
  if(!c){ if(but && Math.hypot(but.gx - jeu.qg.gx, but.gy - jeu.qg.gy) < 4) abimeQG(d); return; }
  if(c.k === "bat") abimeBatiment(c.o, d);
  else if(c.k === "cre") abimeCreature(c.o, d);
  else abimeQG(d);
}

/* ---------------------------------------------------------------
   Mise à jour des défenses
   --------------------------------------------------------------- */
function majDefenses(dt, tps){
  /* boîte englobante de toutes les troupes */
  if(!jeu.unites.length){
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

  for(var k = 0; k < jeu.batiments.length; k++){
    var b = jeu.batiments[k];
    if(b.flash > 0) b.flash -= dt * 6;
    if(b.recul > 0) b.recul -= dt * 6;
    if(b.chargement > 0) b.chargement -= dt * 3;
    if(!b.vivant) continue;
    var f = DEF[b.t];
    if(!f.portee) continue;
    /* élagage par boîte englobante */
    var ddx = Math.max(bx0 - b.gx, 0, b.gx - bx1);
    var ddy = Math.max(by0 - b.gy, 0, b.gy - by1);
    if(Math.hypot(ddx, ddy) > f.portee + 1) continue;

    b.prochainCiblage -= dt * 1000;
    if(b.prochainCiblage <= 0){
      b.prochainCiblage = EQ.PERIODE_CIBLAGE + Math.random() * 220;
      b.cible = chercheCibleDefense(b, f);
    }
    var c = b.cible;
    if(c && (c.pv <= 0 || masquee(c))) c = b.cible = null;
    if(!c) continue;
    var dx = c.gx - b.gx, dy = c.gy - b.gy;
    var d = Math.hypot(dx, dy);
    if(d > f.portee + 0.4 || (f.porteeMin && d < f.porteeMin)){ b.cible = null; continue; }

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
function masquee(u){
  for(var i = 0; i < jeu.fumees.length; i++){
    var f = jeu.fumees[i];
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
  if(b.t === "mitrailleuse"){
    b.recul = 1;
    var touche = mitraTouche(d, Math.random());
    if(touche){
      toucheUnite(c, f.degats);
      jeu.effets.push({ t:"traceur", gx:b.gx, gy:b.gy, ex:c.gx, ey:c.gy, age:0, duree:0.09 });
    }else{
      /* balle perdue : elle passe à côté et meurt dans le sable */
      var a = Math.atan2(c.gy - b.gy, c.gx - b.gx) + (Math.random() - 0.5) * 0.34;
      var dd = d * (1.15 + Math.random() * 0.5);
      var ex = b.gx + Math.cos(a) * dd, ey = b.gy + Math.sin(a) * dd;
      jeu.effets.push({ t:"traceur", gx:b.gx, gy:b.gy, ex:ex, ey:ey, age:0, duree:0.11, perdue:1 });
      jeu.effets.push({ t:"poussiere", gx:ex, gy:ey, age:0, duree:0.42 });
    }
  }else if(b.t === "flammes"){
    /* cône de flammes : tout ce qui est dans le cône prend et brûle */
    var ang = b.angle;
    unitesAutour(b.gx, b.gy, f.portee, tmpUni);
    for(var i = 0; i < tmpUni.length; i++){
      var u = tmpUni[i];
      var du = Math.hypot(u.gx - b.gx, u.gy - b.gy);
      if(du > f.portee) continue;
      if(!dansCone(Math.atan2(u.gy - b.gy, u.gx - b.gx), ang, f.cone)) continue;
      toucheUnite(u, f.degats, { brulure:1 });
    }
    jeu.effets.push({ t:"cone", gx:b.gx, gy:b.gy, ang:ang, portee:f.portee,
                      ouv:f.cone, age:0, duree:0.22 });
  }else if(b.t === "roquettes"){
    b.recul = 1;
    jeu.projectiles.push({ t:"roquette", gx:b.gx, gy:b.gy, z:26, cible:c,
      but:{ gx:c.gx, gy:c.gy }, degats:f.degats, vit:f.vitesseProj, age:0, fumee:0 });
    jeu.effets.push({ t:"souffle", gx:b.gx, gy:b.gy, ang:b.angle, age:0, duree:0.5 });
    son.tirRoquette();
  }else if(b.t === "mortier"){
    b.recul = 1; b.chargement = 1;
    var vol = d / f.vitesseProj;
    jeu.projectiles.push({ t:"obus", gx:b.gx, gy:b.gy, x0:b.gx, y0:b.gy,
      cx:c.gx, cy:c.gy, duree:vol, age:0, degats:f.degats, zone:f.zone, haut:38 + d * 3.2 });
    son.tirMortier();
  }else if(b.t === "electro"){
    var vol2 = d / f.vitesseProj;
    jeu.projectiles.push({ t:"electro", gx:b.gx, gy:b.gy, x0:b.gx, y0:b.gy,
      cx:c.gx, cy:c.gy, duree:vol2, age:0, degats:f.degats, zone:f.zone, ralenti:f.ralenti });
    son.tirElectro();
  }
}

/* ---------------------------------------------------------------
   Projectiles
   --------------------------------------------------------------- */
function majProjectiles(dt){
  for(var i = jeu.projectiles.length - 1; i >= 0; i--){
    var p = jeu.projectiles[i];
    p.age += dt;
    if(p.t === "roquetteJ" || p.t === "roquette"){
      var bx = p.but.gx, by = p.but.gy;
      if(p.cible){
        if(p.cible.k){ if(p.cible.o && (p.cible.o.vivant !== 0)){ bx = p.cible.o.gx; by = p.cible.o.gy; } }
        else if(p.cible.pv > 0){ bx = p.cible.gx; by = p.cible.gy; }
      }
      var dx = bx - p.gx, dy = by - p.gy, d = Math.hypot(dx, dy);
      var pas = p.vit * dt;
      p.ang = Math.atan2(dy, dx);
      if(d <= pas || p.age > 5){
        if(p.t === "roquetteJ") appliqueDegatsCible(p.cible, p.degats, p.but);
        else{
          if(p.cible && p.cible.pv > 0) toucheUnite(p.cible, p.degats);
          else degatsZone(bx, by, 0.8, p.degats);
        }
        jeu.effets.push({ t:"boum", gx:bx, gy:by, age:0, duree:0.5, r:0.9, force:0.6 });
        son.boum(0.3);
        jeu.projectiles.splice(i, 1);
        continue;
      }
      p.gx += dx / d * pas; p.gy += dy / d * pas;
    }else if(p.t === "obus" || p.t === "electro"){
      var t = p.age / p.duree;
      if(t >= 1){
        if(p.t === "obus"){
          if(p.allie) degatsZoneEnnemis(p.cx, p.cy, p.zone, p.degats);
          else degatsZone(p.cx, p.cy, p.zone, p.degats);
          if(p.braise) jeu.flaques.push({ gx:p.cx, gy:p.cy, r:1.5, age:0, duree:EQ.QG_FLAQUE_DUREE });
          jeu.effets.push({ t:"boum", gx:p.cx, gy:p.cy, age:0, duree:0.62, r:p.zone, force:1 });
          jeu.crateres.push({ gx:p.cx, gy:p.cy, r:p.zone * 0.55 });
          if(jeu.crateres.length > 160) jeu.crateres.shift();
          son.boum(0.42);
        }else{
          degatsZone(p.cx, p.cy, p.zone, p.degats, { ralenti:p.ralenti, type:"elec" });
          jeu.effets.push({ t:"eclair", gx:p.cx, gy:p.cy, age:0, duree:0.42, r:p.zone });
          son.electro();
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
        var d2 = Math.hypot(tmpUni[j].gx - k.gx, tmpUni[j].gy - k.gy);
        if(d2 < md){ md = d2; best = tmpUni[j]; }
      }
      k.cible = (best && md <= f.detection) ? best : null;
    }
    var c = k.cible;
    if(c && c.pv <= 0) c = k.cible = null;

    if(k.t === "belette"){ majBelette(k, f, c, dt); continue; }
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
   Zones persistantes : glu, flaques enflammées, fumigènes, soins
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
  for(i = jeu.fumees.length - 1; i >= 0; i--){
    jeu.fumees[i].age += dt;
    if(jeu.fumees[i].age > jeu.fumees[i].duree) jeu.fumees.splice(i, 1);
  }
  for(i = jeu.soins.length - 1; i >= 0; i--){
    var s = jeu.soins[i]; s.age += dt;
    if(s.age > s.duree){ jeu.soins.splice(i, 1); continue; }
    var t2 = [];
    unitesAutour(s.gx, s.gy, s.r, t2);
    for(var m = 0; m < t2.length; m++){
      var u = t2[m];
      if(Math.hypot(u.gx - s.gx, u.gy - s.gy) <= s.r){
        u.pv = Math.min(u.pvMax, u.pv + CAP.soins.pvParSeconde * dt);
        if(u.brulure > 0) u.brulure = Math.max(0, u.brulure - dt * 2);
      }
    }
  }
  if(jeu.fusee){
    jeu.fusee.reste -= dt;
    if(jeu.fusee.reste <= 0) jeu.fusee = null;
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
      jeu.projectiles.push({ t:"obus", gx:jeu.qg.gx, gy:jeu.qg.gy, x0:jeu.qg.gx, y0:jeu.qg.gy,
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
function armeCapacite(m){
  if(m === "debarquer"){ jeu.capArmee = "debarquer"; majMenu(); son.gong(); return; }
  if(jeu.poudre < coutActuel(m, jeu.usages)){
    message("Pas assez de Poudre pour " + COUT[m].nom + ".");
    return;
  }
  jeu.capArmee = (jeu.capArmee === m) ? null : m;
  majMenu();
  if(jeu.capArmee) son.gong();
}
function utiliseCapacite(m, gx, gy){
  var c = coutActuel(m, jeu.usages);
  if(jeu.poudre < c){
    jeu.capArmee = null;
    majMenu();
    message("Plus assez de Poudre : " + COUT[m].nom + " désarmée.");
    return;
  }
  jeu.poudre -= c;
  jeu.usages[m]++;
  if(m === "fusee"){
    /* si la fusée tombe sur un bâtiment, il devient la cible prioritaire */
    var vise = null, mdv = 1e9;
    batimentsAutour(gx, gy, 3, tmpBat);
    for(var v = 0; v < tmpBat.length; v++){
      var bv = tmpBat[v];
      var dv = Math.hypot(bv.gx - gx, bv.gy - gy);
      if(dv <= bv.e * 0.62 + 0.5 && dv < mdv){ mdv = dv; vise = bv; }
    }
    jeu.idFusee = (jeu.idFusee || 0) + 1;
    jeu.fusee = { gx:gx, gy:gy, reste:CAP.fusee.duree, duree:CAP.fusee.duree,
                  id:jeu.idFusee, cible:vise };
    jeu.effets.push({ t:"fuseeLancee", gx:gx, gy:gy, age:0, duree:0.6 });
    son.fusee();
  }else if(m === "fumee"){
    jeu.fumees.push({ gx:gx, gy:gy, r:CAP.fumee.rayon, age:0, duree:CAP.fumee.duree });
    son.fumigene();
  }else if(m === "soins"){
    jeu.soins.push({ gx:gx, gy:gy, r:CAP.soins.rayon, age:0, duree:CAP.soins.duree });
    son.soins();
  }else if(m === "obus"){
    jeu.effets.push({ t:"frappe", gx:gx, gy:gy, age:0, duree:0.45 });
    degatsZoneEnnemis(gx, gy, CAP.obus.rayon, CAP.obus.degats);
    jeu.effets.push({ t:"boum", gx:gx, gy:gy, age:0, duree:0.7, r:CAP.obus.rayon, force:1.2 });
    jeu.crateres.push({ gx:gx, gy:gy, r:CAP.obus.rayon * 0.6 });
    jeu.secousse = Math.min(12, jeu.secousse + 5);
    son.boum(0.7);
  }else if(m === "barrage"){
    for(var i = 0; i < CAP.barrage.nb; i++){
      var a = Math.random() * 6.2832, r = Math.random() * CAP.barrage.rayon;
      jeu.projectiles.push({ t:"obus", gx:gx + Math.cos(a) * 14, gy:gy - 14,
        x0:gx + Math.cos(a) * 8, y0:gy - 10,
        cx:gx + Math.cos(a) * r, cy:gy + Math.sin(a) * r,
        duree:0.5 + i / CAP.barrage.nb * CAP.barrage.duree, age:0,
        degats:CAP.barrage.degats, zone:1.1, haut:60, allie:1 });
    }
    son.barrage();
  }
  majBarres();
  majMenu();
  /* la capacité reste armée si la poudre suffit encore */
  if(jeu.poudre < coutActuel(m, jeu.usages)){
    jeu.capArmee = null;
    majMenu();
    message(COUT[m].nom + " désarmée : Poudre insuffisante.");
  }
}

/* ---------------------------------------------------------------
   Mort, fantôme, renaissance
   --------------------------------------------------------------- */
function majMort(dt){
  if(!jeu.mort){
    if(jeu.unites.length === 0 && jeu.barges.length === 0 && jeu.tps > 3){
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
    for(var i = 0; i < EQ.NB_BARGES; i++) jeu.barges.push({ meuf:compoBarges[i].meuf, mec:compoBarges[i].mec, n:i + 1 });
    jeu.bargeSel = 0;
    jeu.poudre += EQ.POUDRE_BONUS_RENFORT;
    montreBandeauFantome(false);
    majBarres();
    message("Flotte neuve ! +" + EQ.POUDRE_BONUS_RENFORT + " Poudre.");
    son.renfort();
  }
}

/* ---------------------------------------------------------------
   Chute du QG : la séquence finale
   --------------------------------------------------------------- */
function declencheFin(){
  jeu.fin = { age:0, tete:null, confettis:null, texte:0 };
  envoieCarte(jeu.index + 1);
  son.boum(1.9);
}
function majFin(dt){
  var F = jeu.fin;
  F.age += dt;
  var p = jeu.qg;
  if(F.age < 2.1){
    /* pétarade */
    F.prochain = (F.prochain || 0) - dt;
    if(F.prochain <= 0){
      F.prochain = 0.055 + Math.random() * 0.07;
      var a = Math.random() * 6.2832, r = Math.random() * 3.4;
      jeu.effets.push({ t:"boum", gx:p.gx + Math.cos(a) * r, gy:p.gy + Math.sin(a) * r,
                        age:0, duree:0.5, r:0.8 + Math.random(), force:1 });
      jeu.secousse = Math.min(20, jeu.secousse + 1.2 + F.age);
      son.boum(0.35 + Math.random() * 0.3);
    }
  }
  if(F.age >= 2.1 && !F.tete){
    F.flash = 1;
    F.tete = { x:0, y:0, vy:-320, rot:0, age:0 };
    jeu.secousse = 24;
    son.boum(1.9);
    son.sifflet();
  }
  if(F.tete){
    F.tete.age += dt;
    F.tete.y += F.tete.vy * dt;
    F.tete.vy += 60 * dt;
    F.tete.rot += dt * 7;
  }
  if(F.age >= 2.4 && !F.confettis){
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
  if(F.age >= 4.2 && !F.bilanMontre){
    F.bilanMontre = 1;
    montreBilan();
  }
}

/* ---------------------------------------------------------------
   Boucle de simulation
   --------------------------------------------------------------- */
function majJeu(dt){
  jeu.tps += dt;
  if(jeu.messageGege > 0) jeu.messageGege = Math.max(0, jeu.messageGege - dt);
  if(jeu.secousse > 0) jeu.secousse = Math.max(0, jeu.secousse - dt * 22);
  construitGrilleUnites();
  if(jeu.fin){ majFin(dt); majEffets(dt); return; }
  majUnites(dt);
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
