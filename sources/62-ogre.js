/* ================================================================
   L'OGRE — la troupe lourde du joueur
   Trois fois la taille de la Meuf, et surtout : rien à voir avec elle.
   Proportions de brute et non d'humain agrandi — tronc court et
   massif, trapèzes qui avalent le cou, bras qui descendent aux
   genoux, tête basse coincée entre les épaules, jambes arquées.
   Peau grise et burinée, cicatrices, mante de fourrure noire,
   morceaux d'armure ramassés sur les champs de bataille, cape en
   lambeaux, haches accrochées partout.
   Repère local identique aux autres unités : pieds en (0,0), le corps
   monte vers les y négatifs, lumière en haut à gauche. Il regarde
   TOUJOURS vers la droite — c'est l'appelant qui retourne le repère.
   ================================================================ */

var C_OGRE = {
  /* Peau de brute : gris terreux, cuit et sale. Un ogre vert de conte
     jurerait avec le reste du jeu. */
  peau:"#a3846b", peauC:"#c8a988", peauO:"#6f5747", peauN:"#42332b",
  tache:"#87694f", veine:"#654c3e",
  cuir:"#4c3626", cuirC:"#6d5039", cuirO:"#241812",
  fourrure:"#33281f", fourrureC:"#5c4835", fourrureO:"#170f0b",
  fer:"#585d64", ferC:"#939aa4", ferO:"#252a2f", rouille:"#7b4726",
  toile:"#8b7f66", toileO:"#544b3c",
  cape:"#71302b", capeC:"#9b4941", capeO:"#2f1211",
  bois:"#6a4e31", boisC:"#8e6c45", boisO:"#372718",
  sang:"#5b201d", dent:"#e6dbb8", dentO:"#a89570",
  oeil:"#f0d271", oeilMort:"#c8c1b3", pupille:"#141010",
  laiton:"#b98b3c", poussiere:"#a5947e"
};

/* ---------------------------------------------------------------
   La démarche.
   Il avance 10 % plus vite qu'une Meuf : hors de question qu'il ait
   l'air de traîner. Le poids ne vient donc pas de la lenteur mais de
   l'amplitude — d'immenses enjambées — et de la sécheresse du poser :
   le corps monte doucement quand les jambes se croisent, puis TOMBE
   d'un coup quand le pied touche. D'où le choc élevé au carré.
   --------------------------------------------------------------- */
function poseOgre(phase){
  var s = Math.sin(phase), co = Math.cos(phase);
  /* Le pied avant se pose quand |sin| vaut 1, deux fois par cycle. */
  var tp = ((((phase - 1.5708) % 3.14159) + 3.14159) % 3.14159) / 3.14159;
  var ch = 1 - tp / 0.30;
  if(ch < 0) ch = 0;
  ch = ch * ch;
  return {
    jambeA: s * 12.5, jambeB: -s * 12.5,
    brasA: -s * 9.6,  brasB: s * 9.6,
    haut: Math.abs(co) * 2.2 - ch * 2.8,
    epaules: Math.sin(phase - 0.42) * 0.06,   /* le buste retarde sur le bassin */
    choc: ch,
    tp: tp,
    /* Traîne : la cape, le pagne et les haches suivent avec du retard. */
    tra: Math.sin(phase - 1.05)
  };
}

/* Assombrit ce qui est en arrière-plan ou du côté opposé à la lumière. */
function tOgre(coul, devant){ return devant ? coul : ecl(coul, 0.62); }

/* ---------------------------------------------------------------
   UNE HACHE.
   Repère : la prise est en (0,0), le manche monte vers -y, le fer
   coiffe le haut et le tranchant regarde vers +x. Hache barbue : le
   tranchant descend bien plus bas que l'œil du fer et laisse un
   crochet sous le manche. C'est ce crochet qui la rend lisible d'un
   coup d'œil, même réduite à quelques pixels.
   --------------------------------------------------------------- */
function dessineHacheOgre(c, L, e, v, devant){
  var C = C_OGRE;
  var y0 = -L;

  /* --- manche de bois, veiné --- */
  c.strokeStyle = tOgre(C.bois, devant);
  c.lineWidth = 2.2 * e;
  c.lineCap = "round";
  c.beginPath(); c.moveTo(0.4 * e, 4.4 * e); c.lineTo(-0.2 * e, y0 + 2 * e); c.stroke();
  c.strokeStyle = tOgre(C.boisO, devant);
  c.lineWidth = 0.6 * e;
  c.beginPath(); c.moveTo(0.9 * e, 3.2 * e); c.lineTo(0.3 * e, y0 + 3 * e); c.stroke();
  c.strokeStyle = tOgre(C.boisC, devant);
  c.lineWidth = 0.5 * e;
  c.beginPath(); c.moveTo(-0.6 * e, 2.6 * e); c.lineTo(-1.0 * e, y0 + 4 * e); c.stroke();
  /* pommeau ferré + lanière de cuir qui pend */
  c.fillStyle = tOgre(C.ferO, devant);
  c.beginPath(); c.ellipse(0.4 * e, 4.6 * e, 1.8 * e, 1.3 * e, 0, 0, 6.2832); c.fill();
  c.strokeStyle = tOgre(C.cuir, devant);
  c.lineWidth = 0.8 * e;
  c.beginPath();
  c.moveTo(0.4 * e, 5.2 * e);
  c.quadraticCurveTo(2.4 * e, 6.8 * e, 1.3 * e, 9.0 * e);
  c.stroke();
  /* garnissage de cuir sur la prise */
  c.strokeStyle = tOgre(C.cuirO, devant);
  c.lineWidth = 1.0 * e;
  for(var g = 0; g < 4; g++){
    c.beginPath();
    c.moveTo(-1.5 * e, (2.6 - g * 1.7) * e);
    c.lineTo(1.5 * e, (1.6 - g * 1.7) * e);
    c.stroke();
  }

  /* --- le fer --- */
  c.save();
  c.translate(0, y0);
  c.scale(e, e);
  c.fillStyle = degCache(c, "ogreFer" + (devant ? 1 : 0), function(){
    var g2 = c.createLinearGradient(-3, -7, 11, 11);
    g2.addColorStop(0, tOgre(ecl(C.ferC, 1.06), devant));
    g2.addColorStop(0.40, tOgre(C.fer, devant));
    g2.addColorStop(1, tOgre(C.ferO, devant));
    return g2;
  });
  c.beginPath();
  c.moveTo(-3.4, -3.0);                              /* talon, derrière le manche */
  c.lineTo(-3.6, 3.0);
  c.lineTo(0.6, 3.4);
  c.quadraticCurveTo(1.4, 8.2, 5.2, 12.2);           /* la barbe, crochue */
  c.quadraticCurveTo(13.6, 4.6, 11.6, -5.6);         /* long tranchant bombé */
  c.quadraticCurveTo(5.6, -6.8, 0.5, -3.4);          /* dos du fer */
  c.closePath();
  c.fill();
  /* biseau clair : c'est lui qui fait « tranchant » */
  c.strokeStyle = "rgba(232,238,246,.6)";
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(5.6, 10.4);
  c.quadraticCurveTo(11.6, 4.2, 10.0, -4.2);
  c.stroke();
  /* brèches : trois entailles dans le tranchant, décalées par variante */
  c.fillStyle = tOgre(C.ferO, devant);
  var br = [[10.2, 7.4], [12.2, 1.6], [11.0, -3.4]];
  for(var b = 0; b < 3; b++){
    if((v + b) % 3 === 0) continue;                  /* jamais les mêmes */
    c.beginPath();
    c.moveTo(br[b][0] + 1.6, br[b][1] - 1.1);
    c.lineTo(br[b][0] - 1.8, br[b][1] + 0.2);
    c.lineTo(br[b][0] + 1.3, br[b][1] + 1.3);
    c.closePath(); c.fill();
  }
  /* œil du fer + rivets */
  c.fillStyle = tOgre(C.ferO, devant);
  c.beginPath(); c.ellipse(-0.9, 0.2, 2.5, 3.3, 0, 0, 6.2832); c.fill();
  c.fillStyle = tOgre(C.ferC, devant);
  c.beginPath(); c.arc(-2.0, -1.5, 0.6, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(-2.0, 1.9, 0.6, 0, 6.2832); c.fill();
  /* rouille et sang séché : la hache a beaucoup servi */
  c.fillStyle = rgba(C.rouille, 0.30);
  c.beginPath();
  c.moveTo(2.2, 4.6); c.quadraticCurveTo(4.4, 7.6, 4.8, 10.8);
  c.quadraticCurveTo(2.6, 8.4, 1.4, 5.4);
  c.closePath(); c.fill();
  c.fillStyle = rgba(C.sang, 0.28 + (v === 1 ? 0.16 : 0));
  c.beginPath(); c.ellipse(7.6, 3.4, 2.4, 3.6, 0.6, 0, 6.2832); c.fill();
  c.restore();

  /* langues de fer qui bloquent le fer sur le manche */
  c.strokeStyle = tOgre(C.ferO, devant);
  c.lineWidth = 1.0 * e;
  c.beginPath();
  c.moveTo(-1.4 * e, y0 + 3.2 * e); c.lineTo(-1.0 * e, y0 + 9.0 * e);
  c.moveTo(1.3 * e, y0 + 3.6 * e); c.lineTo(1.1 * e, y0 + 8.4 * e);
  c.stroke();
}

/* ---------------------------------------------------------------
   L'OGRE
   phase : cycle de marche (rad) — variante : 0/1/2 — tir : armement
   --------------------------------------------------------------- */
function dessineOgre(c, phase, variante, tir){
  var C = C_OGRE;
  var v = (variante | 0) % 3; if(v < 0) v = -v;
  var p = poseOgre(phase);
  /* Pendant l'armement la phase n'avance presque plus : on s'en sert
     pour faire trembler le bras chargé, sinon la pose est figée. */
  var trem = tir ? Math.sin(phase * 5.2) * 0.55 : 0;

  var jA, jB, yb, incl, hx, hy, tra;
  if(tir){
    jA = 17; jB = -18;                     /* appui écarté, genoux pliés */
    yb = 3.4;                              /* il s'écrase pour lancer */
    incl = -0.15;                          /* le buste part en arrière */
    hx = 8; hy = -94;
    tra = 1.15;                            /* cape et pagne emportés */
  }else{
    jA = p.jambeA; jB = p.jambeB;
    yb = -p.haut;
    incl = p.epaules;
    hx = 4 + p.tra * 0.5;
    hy = -98 + p.choc * 1.4;
    tra = p.tra;
  }

  /* ================= LE SOL =================
     Deux ombres : une large et molle pour la masse, une dure et
     serrée sous chaque pied. C'est ce noyau qui l'ancre au terrain. */
  c.save();
  c.scale(1, 0.34);
  c.fillStyle = degCache(c, "ogreOmbre", function(){
    var g = c.createRadialGradient(2, 0, 6, 2, 0, 38);
    g.addColorStop(0, "rgba(0,0,0,.40)");
    g.addColorStop(0.55, "rgba(0,0,0,.24)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    return g;
  });
  c.beginPath(); c.arc(2, 0, 38, 0, 6.2832); c.fill();
  c.restore();
  c.fillStyle = "rgba(0,0,0,.36)";
  c.beginPath(); c.ellipse(jA * 0.8 + 2, -0.6, 13, 4.2, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(jB * 0.8 + 2, -0.6, 11, 3.6, 0, 0, 6.2832); c.fill();

  /* Réaction du sol : à chaque poser, une galette de poussière part du
     pied avant, s'étale et s'efface. Brève — la marche reste vive. */
  if(!tir && p.tp < 0.62){
    var d = p.tp / 0.62;
    var af = (1 - d) * (1 - d) * 0.46;
    var xp = 13 - d * 18;
    c.fillStyle = rgba(C.poussiere, af);
    c.beginPath(); c.ellipse(xp, -2.2 - d * 2.0, 7 + d * 15, 2.4 + d * 4.0, 0, 0, 6.2832); c.fill();
    c.fillStyle = rgba(C.poussiere, af * 0.7);
    c.beginPath(); c.ellipse(xp - 6 - d * 5, -4.0 - d * 4.0, 4 + d * 8, 2.0 + d * 3.2, 0, 0, 6.2832); c.fill();
    c.fillStyle = rgba(C.poussiere, af * 0.55);
    c.beginPath(); c.ellipse(xp + 8 + d * 6, -3.0 - d * 3.0, 3.4 + d * 7, 1.8 + d * 2.8, 0, 0, 6.2832); c.fill();
    /* mottes de terre projetées */
    c.fillStyle = rgba(C.poussiere, af * 1.3);
    for(var e2 = 0; e2 < 3; e2++){
      var ke = 1 + e2 * 0.7;
      c.beginPath();
      c.arc(xp + (e2 - 1) * 9 - d * 6 * ke, -3 - d * 11 * ke, 1.3, 0, 6.2832);
      c.fill();
    }
  }

  c.save();
  c.translate(0, yb);
  c.lineCap = "round";
  c.lineJoin = "round";

  /* ================= DERRIÈRE LE CORPS =================
     Cape, hache de dos et bras arrière pendent des épaules : ils
     partagent donc la rotation du buste. */
  c.save();
  c.translate(0, -50); c.rotate(incl); c.translate(0, 50);

  /* --- la cape, un drapeau de guerre en lambeaux --- */
  var sw = tra * 3.6;
  c.fillStyle = degCache(c, "ogreCape", function(){
    var g = c.createLinearGradient(-22, -86, -6, -24);
    g.addColorStop(0, C.capeC); g.addColorStop(0.45, C.cape); g.addColorStop(1, C.capeO);
    return g;
  });
  c.beginPath();
  c.moveTo(-26, -88);
  c.quadraticCurveTo(-42 - sw, -70, -40 - sw * 1.6, -46);
  c.lineTo(-36 - sw * 1.7, -26);
  c.lineTo(-32 - sw * 1.4, -38);
  c.lineTo(-27 - sw * 1.2, -18);
  c.lineTo(-22 - sw, -33);
  c.lineTo(-16 - sw * 0.8, -23);
  c.lineTo(-12 - sw * 0.6, -35);
  c.lineTo(-6 - sw * 0.4, -28);
  c.quadraticCurveTo(-2, -56, 2, -86);
  c.closePath(); c.fill();
  c.strokeStyle = rgba(C.capeO, 0.6); c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(-22, -82); c.quadraticCurveTo(-27 - sw, -58, -24 - sw * 1.3, -34);
  c.moveTo(-13, -83); c.quadraticCurveTo(-15 - sw * 0.7, -58, -13 - sw, -31);
  c.stroke();

  /* --- la grande hache sanglée dans le dos --- */
  c.save();
  c.translate(-19, -58);
  c.rotate(-0.62 + tra * 0.015);
  dessineHacheOgre(c, 40, 1.55, (v + 1) % 3, false);
  c.restore();
  /* barda du soldat qui rentre : rouleau de couchage ficelé */
  c.save();
  c.translate(-24, -70); c.rotate(-0.5);
  c.fillStyle = ecl(C.toile, 0.55);
  c.beginPath();
  if(c.roundRect) c.roundRect(-6, -13, 12, 26, 6); else c.rect(-6, -13, 12, 26);
  c.fill();
  c.strokeStyle = ecl(C.cuirO, 0.9); c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(-6.5, -6); c.lineTo(6.5, -6);
  c.moveTo(-6.5, 6); c.lineTo(6.5, 6);
  c.stroke();
  c.restore();
  /* sangle en travers du dos */
  c.strokeStyle = ecl(C.cuirO, 1.0); c.lineWidth = 4.4;
  c.beginPath();
  c.moveTo(-28, -86); c.quadraticCurveTo(-12, -70, 0, -52);
  c.stroke();

  /* --- bras arrière (gauche) --- */
  var eBx = -26, eBy = -78;
  var cBx, cBy, mBx, mBy;
  if(tir){
    /* Le bras libre part loin devant : il vise, et il équilibre. */
    cBx = 8; cBy = -80; mBx = 43; mBy = -78;
  }else{
    cBx = -34 + p.brasB * 0.35; cBy = -58;
    mBx = -31 + p.brasB; mBy = -38 - Math.abs(p.brasB) * 0.30;
  }
  brasOgre(c, eBx, eBy, cBx, cBy, mBx, mBy, false, v);
  c.restore();

  /* ================= LES JAMBES =================
     Longues d'à peine la moitié du corps, épaisses et arquées.
     C'est la moitié du caractère « brute » de la silhouette. */
  jambeOgre(c, jB, false, v, tir);
  jambeOgre(c, jA, true, v, tir);

  /* ================= LE BUSTE ET L'AVANT ================= */
  c.save();
  c.translate(0, -50); c.rotate(incl); c.translate(0, 50);

  /* --- tronc : poitrine énorme, taille serrée, trapèzes très hauts --- */
  c.fillStyle = degCache(c, "ogrePeau", function(){
    var g = c.createLinearGradient(-26, -94, 20, -44);
    g.addColorStop(0, ecl(C.peauC, 1.04)); g.addColorStop(0.38, C.peau); g.addColorStop(1, C.peauO);
    return g;
  });
  c.beginPath();
  c.moveTo(-33, -82);
  c.quadraticCurveTo(-31, -92, -13, -94);     /* trapèze gauche */
  c.quadraticCurveTo(0, -96, 13, -94);
  c.quadraticCurveTo(31, -92, 34, -82);       /* trapèze droit */
  c.quadraticCurveTo(31, -74, 26, -66);       /* grand pectoral */
  c.quadraticCurveTo(21, -58, 22, -49);       /* taille puis hanche */
  c.quadraticCurveTo(0, -45, -22, -49);
  c.quadraticCurveTo(-21, -58, -25, -66);
  c.quadraticCurveTo(-30, -74, -33, -82);
  c.closePath(); c.fill();

  /* ombre au bas du tronc : sans elle il n'a aucun volume */
  c.fillStyle = degCache(c, "ogreVentre", function(){
    var g = c.createLinearGradient(0, -70, 0, -46);
    g.addColorStop(0, "rgba(48,36,28,0)"); g.addColorStop(1, "rgba(48,36,28,.42)");
    return g;
  });
  c.beginPath();
  c.moveTo(-26, -70); c.quadraticCurveTo(0, -64, 27, -70);
  c.quadraticCurveTo(21, -58, 22, -49);
  c.quadraticCurveTo(0, -45, -22, -49);
  c.quadraticCurveTo(-21, -58, -26, -70);
  c.closePath(); c.fill();

  /* pectoraux lourds + creux sternal */
  c.strokeStyle = rgba(C.peauN, 0.36); c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(-24, -78); c.quadraticCurveTo(-14, -66, -2, -69);
  c.moveTo(25, -78); c.quadraticCurveTo(15, -66, 3, -69);
  c.stroke();
  c.fillStyle = rgba(C.peauN, 0.26);
  c.beginPath();
  c.moveTo(0.5, -84); c.quadraticCurveTo(2.0, -76, 0.5, -69); c.lineTo(-1.5, -69);
  c.quadraticCurveTo(-1.0, -76, -1.5, -84);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(255,255,255,.20)"; c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(-25, -84); c.quadraticCurveTo(-15, -87, -5, -83);
  c.stroke();
  /* ventre : deux plis, pas des tablettes de gymnase */
  c.strokeStyle = rgba(C.peauN, 0.24); c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(-14, -62); c.quadraticCurveTo(0, -59, 14, -62);
  c.moveTo(-12, -55); c.quadraticCurveTo(0, -52, 12, -55);
  c.stroke();

  /* --- la peau : taches, crasse, poils --- */
  c.fillStyle = rgba(C.tache, 0.32);
  var tac = [[-21, -86, 5, 3], [17, -88, 4, 2.4], [-9, -58, 6, 3.2],
             [22, -70, 4.2, 5], [-27, -70, 3.4, 4.4], [10, -85, 3, 2]];
  for(var i = 0; i < tac.length; i++){
    if((i + v) % 4 === 0) continue;
    c.beginPath();
    c.ellipse(tac[i][0], tac[i][1], tac[i][2], tac[i][3], i * 0.7, 0, 6.2832);
    c.fill();
  }
  c.strokeStyle = rgba(C.peauN, 0.36); c.lineWidth = 0.7;
  for(var h2 = 0; h2 < 7; h2++){
    var hx2 = -9 + h2 * 3.0, hy2 = -74 + (h2 % 2) * 2.4;
    c.beginPath();
    c.moveTo(hx2, hy2); c.lineTo(hx2 + 0.9, hy2 + 2.6);
    c.stroke();
  }

  /* --- cicatrices : il revient de loin --- */
  if(v !== 1){
    /* trois griffures parallèles sur les côtes */
    c.strokeStyle = "rgba(206,158,136,.72)"; c.lineWidth = 1.3;
    for(var k = 0; k < 3; k++){
      c.beginPath();
      c.moveTo(11 + k * 4.6, -76);
      c.quadraticCurveTo(15 + k * 4.6, -68, 12 + k * 4.6, -60);
      c.stroke();
    }
  }
  if(v !== 0){
    /* balafre recousue en travers du ventre : gros points de suture */
    c.strokeStyle = "rgba(208,164,142,.85)"; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(-16, -66); c.quadraticCurveTo(-4, -61, 8, -64); c.stroke();
    c.lineWidth = 1.0;
    for(var s2 = 0; s2 < 6; s2++){
      var xs = -15 + s2 * 4.5, ys = -65.2 + Math.abs(s2 - 2.5) * 0.5;
      c.beginPath(); c.moveTo(xs - 1.7, ys - 2.1); c.lineTo(xs + 1.7, ys + 2.1); c.stroke();
    }
  }
  if(v !== 2){
    c.strokeStyle = "rgba(206,158,136,.7)"; c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-20, -76); c.quadraticCurveTo(-14, -70, -18, -62); c.stroke();
  }

  /* --- plastron ramassé sur un mort, tenu par des cordes --- */
  c.fillStyle = degCache(c, "ogrePlastron", function(){
    var g = c.createLinearGradient(-30, -84, -8, -58);
    g.addColorStop(0, C.ferC); g.addColorStop(0.4, C.fer); g.addColorStop(1, C.ferO);
    return g;
  });
  c.beginPath();
  c.moveTo(-30, -84);
  c.quadraticCurveTo(-14, -87, -5, -78);
  c.lineTo(-7, -70);                       /* bord arraché, en dents de scie */
  c.lineTo(-12, -73);
  c.lineTo(-15, -65);
  c.lineTo(-21, -70);
  c.lineTo(-24, -62);
  c.lineTo(-29, -69);
  c.closePath(); c.fill();
  c.fillStyle = rgba(C.ferO, 0.5);
  c.beginPath(); c.ellipse(-20, -78, 4.4, 3.0, 0.4, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(-11, -75, 2.6, 2.0, -0.3, 0, 6.2832); c.fill();
  c.fillStyle = rgba(C.rouille, 0.34);
  c.beginPath();
  c.moveTo(-27, -80); c.lineTo(-24, -80); c.lineTo(-22, -64); c.lineTo(-25, -65);
  c.closePath(); c.fill();
  c.fillStyle = C.ferC;
  var riv = [[-27, -81], [-19, -84], [-11, -80], [-27, -72]];
  for(var r2 = 0; r2 < riv.length; r2++){
    c.beginPath(); c.arc(riv[r2][0], riv[r2][1], 1.2, 0, 6.2832); c.fill();
  }
  c.strokeStyle = "rgba(255,255,255,.26)"; c.lineWidth = 1.1;
  c.beginPath(); c.moveTo(-28, -82); c.quadraticCurveTo(-18, -85, -8, -79); c.stroke();
  /* cordes qui le sanglent sur l'épaule opposée */
  c.strokeStyle = C.toileO; c.lineWidth = 2.2;
  c.beginPath();
  c.moveTo(-29, -85); c.quadraticCurveTo(-6, -91, 15, -88);
  c.moveTo(-7, -76); c.quadraticCurveTo(6, -80, 19, -82);
  c.stroke();

  /* --- baudrier de cuir en travers du torse --- */
  c.fillStyle = degCache(c, "ogreBaudrier", function(){
    var g = c.createLinearGradient(22, -86, -12, -48);
    g.addColorStop(0, C.cuirC); g.addColorStop(0.5, C.cuir); g.addColorStop(1, C.cuirO);
    return g;
  });
  c.beginPath();
  c.moveTo(27, -85); c.lineTo(33, -80);
  c.quadraticCurveTo(6, -62, -12, -48);
  c.lineTo(-19, -52);
  c.quadraticCurveTo(2, -66, 27, -85);
  c.closePath(); c.fill();
  c.fillStyle = C.laiton;
  c.beginPath(); c.arc(19, -76, 1.7, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(5, -66, 1.7, 0, 6.2832); c.fill();
  /* sacoche pendue au baudrier */
  c.fillStyle = C.cuirO;
  c.beginPath();
  if(c.roundRect) c.roundRect(9, -66, 11, 9, 2); else c.rect(9, -66, 11, 9);
  c.fill();
  c.strokeStyle = C.cuirC; c.lineWidth = 1.0;
  c.beginPath(); c.moveTo(9.5, -62.5); c.lineTo(19.5, -62.5); c.stroke();

  /* ================= CEINTURE, PAGNE, HACHES ================= */
  var bal = tra * 0.055;

  /* pans de cuir courts : ils ne doivent pas manger les cuisses,
     sinon les jambes disparaissent et il a l'air trapu */
  var pan = [[-19, 13, 5.2], [-10, 17, 5.6], [-1, 14, 5.4], [8, 18, 5.6], [17, 13, 5.0]];
  for(var q = 0; q < pan.length; q++){
    var px = pan[q][0], pl = pan[q][1], pw = pan[q][2];
    var dec = tra * (2.2 + q * 0.3);
    c.fillStyle = q % 2 ? C.cuir : ecl(C.cuir, 0.78);
    c.beginPath();
    c.moveTo(px - pw, -50);
    c.lineTo(px + pw, -50);
    c.lineTo(px + pw * 0.8 + dec, -50 + pl);
    c.lineTo(px + dec * 1.1, -50 + pl + 2.5);       /* pointe déchirée */
    c.lineTo(px - pw * 0.8 + dec, -50 + pl - 1.5);
    c.closePath(); c.fill();
  }

  /* la ceinture : énorme, c'est la pièce maîtresse de sa tenue */
  c.fillStyle = degCache(c, "ogreCeinture", function(){
    var g = c.createLinearGradient(0, -61, 0, -47);
    g.addColorStop(0, C.cuirC); g.addColorStop(0.45, C.cuir); g.addColorStop(1, C.cuirO);
    return g;
  });
  c.beginPath();
  c.moveTo(-24, -60);
  c.quadraticCurveTo(0, -63, 24, -60);
  c.quadraticCurveTo(25, -54, 24, -48);
  c.quadraticCurveTo(0, -44, -24, -48);
  c.quadraticCurveTo(-25, -54, -24, -60);
  c.closePath(); c.fill();
  c.fillStyle = C.ferC;
  for(var n = 0; n < 8; n++){
    var nx = -20 + n * 5.7;
    c.beginPath(); c.arc(nx, -58.4 + Math.abs(nx) * 0.04, 1.1, 0, 6.2832); c.fill();
  }
  /* boucle de fer brut, décentrée : rien n'est neuf chez lui */
  c.fillStyle = degCache(c, "ogreBoucle", function(){
    var g = c.createLinearGradient(-4, -61, 10, -48);
    g.addColorStop(0, C.ferC); g.addColorStop(0.5, C.fer); g.addColorStop(1, C.ferO);
    return g;
  });
  c.beginPath();
  if(c.roundRect) c.roundRect(-4, -60.5, 14, 13, 2.5); else c.rect(-4, -60.5, 14, 13);
  c.fill();
  c.fillStyle = C.cuirO;
  c.beginPath();
  if(c.roundRect) c.roundRect(-1.4, -57.8, 8.8, 7.6, 1.5); else c.rect(-1.4, -57.8, 8.8, 7.6);
  c.fill();
  c.fillStyle = C.ferC;
  c.fillRect(1.6, -60.5, 2.4, 13);
  c.fillStyle = rgba(C.rouille, 0.35);
  c.fillRect(6.5, -59, 3.0, 11);

  /* deux hachettes pendues à la ceinture */
  c.save();
  c.translate(-20, -52); c.rotate(2.62 + bal);
  dessineHacheOgre(c, 17, 0.80, v, false);
  c.restore();
  c.save();
  c.translate(19, -51); c.rotate(-2.70 - bal);
  dessineHacheOgre(c, 16, 0.74, (v + 2) % 3, true);
  c.restore();
  c.strokeStyle = C.ferO; c.lineWidth = 1.5;
  c.beginPath(); c.arc(-20, -52, 2.5, 0, 6.2832); c.stroke();
  c.beginPath(); c.arc(19, -51, 2.3, 0, 6.2832); c.stroke();

  /* ================= LA MANTE DE FOURRURE =================
     Un pelage noir jeté sur les épaules. C'est elle qui découpe la
     tête du torse : sans ce contraste, tout le haut du corps se
     confond en une seule masse beige. */
  manteOgre(c, incl);

  /* ================= LA TÊTE ================= */
  teteOgre(c, hx, hy, v, tir, phase);

  /* ================= ÉPAULIÈRE AVANT =================
     Trois lames superposées, cabossées, une pointe arrachée : c'est
     elle qui donne ce profil d'épaule impossible à confondre. */
  c.save();
  c.translate(31, -80);
  c.rotate(tir ? -0.32 : 0.04 + p.epaules);
  c.fillStyle = degCache(c, "ogreEpauliere", function(){
    var g = c.createLinearGradient(-12, -16, 14, 12);
    g.addColorStop(0, ecl(C.ferC, 1.06)); g.addColorStop(0.45, C.fer); g.addColorStop(1, C.ferO);
    return g;
  });
  var pl = [[-14, 11.5, 4], [-12, 14.5, -1], [-9, 16, -9]];
  for(var a2 = 0; a2 < 3; a2++){
    c.beginPath();
    c.moveTo(pl[a2][0], pl[a2][2]);
    c.quadraticCurveTo(0, pl[a2][2] - 9.5, pl[a2][1], pl[a2][2] - 1);
    c.quadraticCurveTo(pl[a2][1] + 1.5, pl[a2][2] + 4.5, pl[a2][1] - 3, pl[a2][2] + 5.5);
    c.quadraticCurveTo(-4, pl[a2][2] + 7.5, pl[a2][0], pl[a2][2] + 4);
    c.closePath(); c.fill();
    c.strokeStyle = rgba(C.ferO, 0.9); c.lineWidth = 1.1;
    c.stroke();
  }
  /* éclat arraché sur la lame du bas */
  c.fillStyle = C.ferO;
  c.beginPath();
  c.moveTo(8, 4); c.lineTo(14, 5); c.lineTo(10, 10); c.closePath(); c.fill();
  c.fillStyle = C.ferC;
  c.beginPath(); c.arc(-9, -6, 1.4, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(-8, 0, 1.4, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(-6, 7, 1.4, 0, 6.2832); c.fill();
  c.fillStyle = rgba(C.rouille, 0.36);
  c.beginPath();
  c.moveTo(1, -9); c.lineTo(4, -9); c.lineTo(3, 10); c.lineTo(0, 10); c.closePath(); c.fill();
  c.strokeStyle = "rgba(255,255,255,.34)"; c.lineWidth = 1.3;
  c.beginPath(); c.moveTo(-10, -9); c.quadraticCurveTo(-1, -16, 8, -10); c.stroke();
  /* pointe de fer tordue sur le dessus */
  c.fillStyle = C.fer;
  c.beginPath();
  c.moveTo(-4, -12); c.lineTo(1, -21); c.lineTo(4, -11); c.closePath(); c.fill();
  c.strokeStyle = C.ferO; c.lineWidth = 0.8; c.stroke();
  c.restore();

  /* ================= BRAS AVANT + HACHE EN MAIN ================= */
  var eAx = 28, eAy = -77;
  var cAx, cAy, mAx, mAy, rotH;
  if(tir){
    /* Armé : le poing part derrière la tête, la hache pointe en arrière.
       Toute la lecture de la pose tient dans ce coude très haut. */
    cAx = 3 + trem * 0.8; cAy = -104;
    mAx = -23 + trem; mAy = -95 + trem * 0.6;
    rotH = -2.34 + trem * 0.03;
  }else{
    cAx = 35 + p.brasA * 0.35; cAy = -57;
    mAx = 32 + p.brasA; mAy = -37 - Math.abs(p.brasA) * 0.30;
    rotH = 2.88 + p.brasA * 0.016;
  }

  /* la hache tenue passe derrière le poing */
  c.save();
  c.translate(mAx, mAy); c.rotate(rotH);
  dessineHacheOgre(c, 27, 1.15, v, true);
  c.restore();

  brasOgre(c, eAx, eAy, cAx, cAy, mAx, mAy, true, v);

  /* Traînée d'armement : l'air que le fer a déjà brassé. */
  if(tir){
    c.strokeStyle = "rgba(255,255,255,.16)";
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(-40, -76);
    c.quadraticCurveTo(-50, -98, -32, -116);
    c.stroke();
    c.strokeStyle = "rgba(255,255,255,.10)";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(-31, -71);
    c.quadraticCurveTo(-43, -95, -25, -113);
    c.stroke();
  }

  c.restore();
  c.restore();
}

/* ---------------------------------------------------------------
   La mante de fourrure sur les épaules. Bord en touffes irrégulières
   calculées, jamais tirées au sort : le sprite doit être identique
   d'une image à l'autre.
   --------------------------------------------------------------- */
function manteOgre(c, incl){
  var C = C_OGRE;
  c.fillStyle = degCache(c, "ogreMante", function(){
    var g = c.createLinearGradient(-30, -96, 24, -66);
    g.addColorStop(0, C.fourrureC); g.addColorStop(0.42, C.fourrure); g.addColorStop(1, C.fourrureO);
    return g;
  });
  c.beginPath();
  c.moveTo(-36, -80);
  c.quadraticCurveTo(-34, -93, -14, -96);
  c.quadraticCurveTo(0, -98, 14, -96);
  c.quadraticCurveTo(34, -93, 37, -80);
  /* bord bas en touffes : neuf pointes de longueurs inégales */
  var xs = [30, 24, 18, 11, 4, -3, -10, -17, -24, -30];
  for(var i = 0; i < xs.length; i++){
    var pr = 1 + ((i * 7) % 5);                     /* longueur pseudo-variée */
    c.lineTo(xs[i] + 2.5, -74 + pr * 1.6);
    c.lineTo(xs[i] - 1.5, -78 - (i % 3));
  }
  c.closePath(); c.fill();
  /* mèches : quelques traits clairs qui donnent le poil */
  c.strokeStyle = rgba(C.fourrureC, 0.5); c.lineWidth = 1.1;
  for(var k = 0; k < 11; k++){
    var mx = -32 + k * 6.2;
    c.beginPath();
    c.moveTo(mx, -92 + Math.abs(mx) * 0.14);
    c.lineTo(mx + 1.6, -80 + (k % 3) * 1.6);
    c.stroke();
  }
  /* ombre portée de la mante sur la poitrine */
  c.fillStyle = "rgba(20,14,10,.30)";
  c.beginPath();
  c.moveTo(-30, -78); c.quadraticCurveTo(0, -70, 31, -78);
  c.quadraticCurveTo(0, -75, -30, -78);
  c.closePath(); c.fill();
  /* fibule : deux crocs de fer qui la ferment sur la poitrine */
  c.fillStyle = C.ferC;
  c.beginPath(); c.arc(-3, -84, 2.4, 0, 6.2832); c.fill();
  c.fillStyle = C.ferO;
  c.beginPath(); c.arc(-3, -84, 1.1, 0, 6.2832); c.fill();
}

/* ---------------------------------------------------------------
   Une jambe. Arquée, épaisse, enveloppée de bandes et de ferraille.
   dx : décalage horizontal du pied — devant : jambe la plus proche.
   --------------------------------------------------------------- */
function jambeOgre(c, dx, devant, v, tir){
  var C = C_OGRE;
  var hanche = dx * 0.16, genou = dx * 0.60, chev = dx;
  var yg = tir ? -28 : -30;
  var sg = dx > 0 ? 1 : -1;

  /* cuisse : très épaisse, bombée vers l'extérieur */
  c.strokeStyle = tOgre(C.peau, devant);
  c.lineWidth = 19;
  c.beginPath();
  c.moveTo(hanche, -50);
  c.quadraticCurveTo(genou + sg * 4.0, -40, genou, yg);
  c.stroke();
  /* mollet */
  c.lineWidth = 14.5;
  c.beginPath();
  c.moveTo(genou, yg);
  c.quadraticCurveTo(chev - sg * 3.0, -18, chev, -8);
  c.stroke();
  /* relief du mollet du côté éclairé */
  c.strokeStyle = rgba(C.peauN, 0.22); c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(genou + sg * 5, yg - 2);
  c.quadraticCurveTo(chev + sg * 6.5, -20, chev + sg * 4, -12);
  c.stroke();
  c.strokeStyle = rgba(C.peauC, devant ? 0.35 : 0.12); c.lineWidth = 2.2;
  c.beginPath();
  c.moveTo(hanche - 7, -47); c.quadraticCurveTo(genou - 6, -40, genou - 4, yg + 3);
  c.stroke();

  /* bandes de toile sale sur le tibia — jamais arrondies aux bouts,
     sinon elles font des bourrelets qui débordent de la jambe */
  c.save();
  c.lineCap = "butt";
  c.strokeStyle = tOgre(C.toile, devant);
  c.lineWidth = 3.0;
  for(var b = 0; b < 4; b++){
    var t = b / 3.2;
    var bx = genou + (chev - genou) * t, by = yg + (-10 - yg) * t;
    c.beginPath();
    c.moveTo(bx - 6.6, by + 1.4); c.lineTo(bx + 6.6, by - 1.4);
    c.stroke();
  }
  c.strokeStyle = rgba(C.toileO, 0.8); c.lineWidth = 1.0;
  c.beginPath();
  c.moveTo(genou - 5, yg + 4); c.lineTo(chev + 5, -14);
  c.stroke();
  c.restore();

  if(devant){
    /* genouillère de fer, cabossée */
    c.save();
    c.translate(genou, yg);
    c.fillStyle = degCache(c, "ogreGenou", function(){
      var g = c.createLinearGradient(-8, -9, 8, 7);
      g.addColorStop(0, C.ferC); g.addColorStop(0.5, C.fer); g.addColorStop(1, C.ferO);
      return g;
    });
    c.beginPath(); c.ellipse(0, 0, 8.4, 7.2, 0, 0, 6.2832); c.fill();
    c.fillStyle = rgba(C.ferO, 0.55);
    c.beginPath(); c.ellipse(2.4, 1.8, 3.4, 2.6, 0.4, 0, 6.2832); c.fill();
    c.fillStyle = C.ferC;
    c.beginPath(); c.arc(-4.4, -3.4, 1.2, 0, 6.2832); c.fill();
    c.beginPath(); c.arc(4.6, -2.8, 1.2, 0, 6.2832); c.fill();
    c.strokeStyle = "rgba(255,255,255,.32)"; c.lineWidth = 1.3;
    c.beginPath(); c.arc(0, 0, 5.4, 3.5, 5.1); c.stroke();
    c.fillStyle = C.fer;
    c.beginPath();
    c.moveTo(6.4, -2.4); c.lineTo(12.5, 0.6); c.lineTo(6.4, 3.4); c.closePath(); c.fill();
    c.restore();
  }else{
    /* jambe arrière : une simple corde nouée au genou */
    c.strokeStyle = tOgre(C.toileO, devant); c.lineWidth = 2.4;
    c.beginPath(); c.arc(genou, yg, 7.2, -0.6, 3.4); c.stroke();
  }

  /* pied : plus une masse emmaillotée qu'une botte */
  c.fillStyle = tOgre(C.cuir, devant);
  c.beginPath();
  c.moveTo(chev - 9, -10);
  c.quadraticCurveTo(chev - 11.5, -1.5, chev - 6, -0.5);
  c.lineTo(chev + 13, -0.5);
  c.quadraticCurveTo(chev + 16.5, -3, chev + 11, -7);
  c.quadraticCurveTo(chev + 4, -11, chev - 9, -10);
  c.closePath(); c.fill();
  c.strokeStyle = tOgre(C.cuirO, devant); c.lineWidth = 1.7;
  c.beginPath();
  c.moveTo(chev - 7, -8); c.lineTo(chev + 5, -2.0);
  c.moveTo(chev - 6, -2.0); c.lineTo(chev + 6, -7.4);
  c.stroke();
  /* bout ferré */
  c.fillStyle = tOgre(C.fer, devant);
  c.beginPath();
  c.moveTo(chev + 6, -7.4);
  c.quadraticCurveTo(chev + 16.5, -4, chev + 13, -0.5);
  c.lineTo(chev + 6, -0.5);
  c.closePath(); c.fill();
  c.fillStyle = tOgre(C.ferC, devant);
  c.fillRect(chev + 7.6, -6.2, 1.5, 1.5);
  /* crasse du bas */
  c.fillStyle = "rgba(50,40,32,.38)";
  c.beginPath(); c.ellipse(chev + 2, -1.2, 11, 2.2, 0, 0, 6.2832); c.fill();
}

/* ---------------------------------------------------------------
   Un bras : épaule → coude → poing, les trois points donnés, ce qui
   permet de servir aussi bien la marche que l'armement de la hache.
   --------------------------------------------------------------- */
function brasOgre(c, ex, ey, cx, cy, mx, my, devant, v){
  var C = C_OGRE;
  var ang = Math.atan2(my - cy, mx - cx);
  var na = Math.cos(ang), sa = Math.sin(ang);

  /* bras et avant-bras */
  c.strokeStyle = tOgre(C.peau, devant);
  c.lineWidth = 15.5;
  c.beginPath(); c.moveTo(ex, ey); c.lineTo(cx, cy); c.stroke();
  c.lineWidth = 12.5;
  c.beginPath(); c.moveTo(cx, cy); c.lineTo(mx, my); c.stroke();
  /* deltoïde : une boule de muscle, plus haute que large */
  c.fillStyle = tOgre(C.peau, devant);
  c.beginPath();
  c.ellipse(ex, ey, 10.5, 12.0, devant ? 0.22 : -0.22, 0, 6.2832);
  c.fill();
  /* creux de l'aisselle : sans lui le bras se noie dans le torse */
  c.fillStyle = devant ? "rgba(48,36,28,.42)" : "rgba(30,22,18,.55)";
  c.beginPath();
  c.ellipse(ex - (devant ? 8.5 : -8.5), ey + 4, 4.0, 9.0, devant ? 0.25 : -0.25, 0, 6.2832);
  c.fill();
  /* biceps gonflé, ombre au pli du coude */
  c.fillStyle = rgba(C.peauC, devant ? 0.42 : 0.14);
  c.beginPath();
  c.ellipse((ex + cx) / 2 - 1.5, (ey + cy) / 2, 6.2, 4.4, Math.atan2(cy - ey, cx - ex), 0, 6.2832);
  c.fill();
  c.fillStyle = rgba(C.peauN, 0.22);
  c.beginPath(); c.ellipse(cx, cy, 6.6, 5.4, 0, 0, 6.2832); c.fill();

  /* brassard de fer au-dessus du coude */
  c.save();
  c.translate((ex + cx) / 2 + (cx - ex) * 0.20, (ey + cy) / 2 + (cy - ey) * 0.20);
  c.rotate(Math.atan2(cy - ey, cx - ex));
  c.fillStyle = tOgre(C.fer, devant);
  c.beginPath();
  if(c.roundRect) c.roundRect(-3.4, -8.6, 6.8, 17.2, 2); else c.rect(-3.4, -8.6, 6.8, 17.2);
  c.fill();
  c.fillStyle = tOgre(C.ferC, devant);
  c.fillRect(-3.2, -7.8, 6.4, 1.4);
  c.fillStyle = rgba(C.rouille, 0.32);
  c.fillRect(-1.0, -8.2, 2.0, 16.4);
  c.restore();

  /* bandages sales sur l'avant-bras */
  c.save();
  c.lineCap = "butt";
  c.strokeStyle = tOgre(C.toile, devant);
  c.lineWidth = 3.2;
  for(var b = 0; b < 4; b++){
    var t = 0.26 + b * 0.18;
    var bx = cx + (mx - cx) * t, by = cy + (my - cy) * t;
    c.beginPath();
    c.moveTo(bx + sa * 6.0 - na * 1.2, by - na * 6.0 - sa * 1.2);
    c.lineTo(bx - sa * 6.0 + na * 1.2, by + na * 6.0 + sa * 1.2);
    c.stroke();
  }
  c.strokeStyle = rgba(C.toileO, 0.8); c.lineWidth = 1.0;
  c.beginPath();
  c.moveTo(cx + sa * 4.6, cy - na * 4.6);
  c.lineTo(mx - sa * 4.6, my + na * 4.6);
  c.stroke();
  c.restore();
  /* veine saillante sur l'avant-bras */
  c.strokeStyle = rgba(C.veine, devant ? 0.34 : 0.14); c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(cx + (mx - cx) * 0.30 - sa * 3, cy + (my - cy) * 0.30 + na * 3);
  c.quadraticCurveTo(cx + (mx - cx) * 0.6, cy + (my - cy) * 0.6,
                     cx + (mx - cx) * 0.85 - sa * 2, cy + (my - cy) * 0.85 + na * 2);
  c.stroke();

  /* le poing : une masse, phalanges marquées */
  c.fillStyle = tOgre(ecl(C.peauC, 0.96), devant);
  c.beginPath();
  c.ellipse(mx, my, 7.8, 7.0, ang, 0, 6.2832);
  c.fill();
  c.fillStyle = rgba(C.peauN, devant ? 0.30 : 0.18);
  for(var k = 0; k < 3; k++){
    var kx = mx + na * (2.4 + k * 0.2) + sa * (4.2 - k * 4.2);
    var ky = my + sa * (2.4 + k * 0.2) - na * (4.2 - k * 4.2);
    c.beginPath(); c.arc(kx, ky, 1.6, 0, 6.2832); c.fill();
  }
  c.fillStyle = rgba(C.peauN, devant ? 0.24 : 0.14);
  c.beginPath(); c.ellipse(mx - na * 4.2, my - sa * 4.2, 3.0, 4.6, ang, 0, 6.2832); c.fill();
}

/* ---------------------------------------------------------------
   LA TÊTE.
   Petite pour ce corps mais massive en soi : arcade sourcilière en
   surplomb, yeux minuscules et jaunes enfoncés dessous, nez écrasé,
   mâchoire en avant, deux défenses qui remontent de la lèvre du bas.
   La SILHOUETTE ne change jamais d'une variante à l'autre — seules
   les cicatrices, la peinture et la ferraille changent.
   --------------------------------------------------------------- */
function teteOgre(c, hx, hy, v, tir, phase){
  var C = C_OGRE;
  c.save();
  c.translate(hx, hy);

  /* --- oreilles, en arrière du crâne --- */
  c.fillStyle = ecl(C.peauO, 0.86);
  c.beginPath();
  c.moveTo(-9, -2); c.quadraticCurveTo(-16, -5.5, -15, 1.5);
  c.quadraticCurveTo(-14, 6.5, -8, 5); c.closePath(); c.fill();
  c.fillStyle = C.peau;
  c.beginPath();
  c.moveTo(9.5, -2); c.quadraticCurveTo(16.5, -5.5, 15.4, 1.5);
  if(v === 1){ c.lineTo(12.6, 0.4); c.lineTo(14.2, 3.4); }   /* oreille entaillée */
  c.quadraticCurveTo(14, 6.5, 8.5, 5); c.closePath(); c.fill();
  c.strokeStyle = rgba(C.peauN, 0.45); c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(12.6, -1.4); c.quadraticCurveTo(13.0, 2, 10.6, 3.8); c.stroke();

  /* --- masse du crâne et de la mâchoire --- */
  c.fillStyle = degCache(c, "ogreTete", function(){
    var g = c.createRadialGradient(-3.5, -5, 1.5, 0, 0, 16);
    g.addColorStop(0, ecl(C.peauC, 1.06)); g.addColorStop(0.55, C.peau); g.addColorStop(1, C.peauO);
    return g;
  });
  c.beginPath();
  c.moveTo(-10.4, -1.5);
  c.quadraticCurveTo(-11.0, -10.8, 0, -11.2);      /* calotte basse et large */
  c.quadraticCurveTo(10.8, -11.2, 11.2, -1.5);
  c.quadraticCurveTo(12.0, 5.2, 8.8, 9.2);         /* mâchoire droite, portée en avant */
  c.quadraticCurveTo(4.4, 12.8, -1.0, 12.0);       /* menton lourd */
  c.quadraticCurveTo(-7.8, 10.8, -9.8, 5.0);
  c.closePath(); c.fill();

  /* bas de mâchoire dans l'ombre + barbe de trois jours */
  c.fillStyle = rgba(C.peauN, 0.26);
  c.beginPath();
  c.moveTo(-9.6, 5.0);
  c.quadraticCurveTo(-1, 9.6, 9.6, 6.0);
  c.quadraticCurveTo(8.2, 10.2, -1.0, 12.0);
  c.quadraticCurveTo(-7.8, 10.8, -9.6, 5.0);
  c.closePath(); c.fill();
  c.fillStyle = rgba(C.peauN, 0.22);
  c.beginPath();
  c.moveTo(-9.2, 3.4); c.quadraticCurveTo(0, 8.2, 10.4, 3.0);
  c.quadraticCurveTo(9.2, 11.2, -1.0, 12.1);
  c.quadraticCurveTo(-7.6, 11.0, -9.2, 3.4);
  c.closePath(); c.fill();

  /* --- ARCADE : le trait de caractère du visage --- */
  c.fillStyle = ecl(C.peauC, 1.02);
  c.beginPath();
  c.moveTo(-10.6, -2.2);
  c.quadraticCurveTo(0, -7.6, 11.4, -2.6);
  c.quadraticCurveTo(11.2, -0.5, 10.4, 0.4);
  c.quadraticCurveTo(0, -4.8, -10.0, -0.2);
  c.closePath(); c.fill();
  /* l'ombre qu'elle jette : c'est elle qui fait le regard */
  c.fillStyle = rgba(C.peauN, 0.58);
  c.beginPath();
  c.moveTo(-10.2, -0.6);
  c.quadraticCurveTo(0, -4.8, 10.8, -0.8);
  c.quadraticCurveTo(9.8, 3.6, 4.4, 3.4);
  c.quadraticCurveTo(0, 1.6, -4.6, 3.2);
  c.quadraticCurveTo(-9.4, 3.4, -10.2, -0.6);
  c.closePath(); c.fill();

  /* --- yeux : petits, jaunes, méchants. Ils doivent accrocher même
     quand l'unité ne fait que trois centimètres à l'écran. --- */
  var yy = 0.7;
  var mort = (v === 1);
  c.fillStyle = C.oeil;
  c.beginPath(); c.ellipse(-4.6, yy, 2.7, 1.7, 0.10, 0, 6.2832); c.fill();
  c.fillStyle = mort ? C.oeilMort : C.oeil;
  c.beginPath(); c.ellipse(5.1, yy, 2.9, 1.8, -0.10, 0, 6.2832); c.fill();
  c.fillStyle = C.pupille;
  c.beginPath(); c.ellipse(-3.9, yy + 0.1, 1.15, 1.35, 0, 0, 6.2832); c.fill();
  if(!mort){
    c.beginPath(); c.ellipse(5.9, yy + 0.1, 1.2, 1.4, 0, 0, 6.2832); c.fill();
  }else{
    c.fillStyle = "rgba(152,148,138,.9)";
    c.beginPath(); c.ellipse(5.9, yy + 0.1, 1.2, 1.4, 0, 0, 6.2832); c.fill();
  }
  c.fillStyle = "rgba(255,255,255,.75)";
  c.beginPath(); c.arc(-4.4, yy - 0.6, 0.45, 0, 6.2832); c.fill();
  if(!mort){ c.beginPath(); c.arc(5.4, yy - 0.6, 0.48, 0, 6.2832); c.fill(); }
  /* paupières lourdes tombant de l'arcade */
  c.strokeStyle = rgba(C.peauN, 0.65); c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(-7.4, -0.9); c.quadraticCurveTo(-4.4, -1.7, -1.9, -0.4);
  c.moveTo(8.2, -1.1); c.quadraticCurveTo(5.0, -2.0, 2.3, -0.6);
  c.stroke();
  /* sourcils broussailleux cassés vers le nez : toute la colère est là */
  c.strokeStyle = "rgba(46,34,26,.9)"; c.lineWidth = 2.1;
  c.beginPath();
  c.moveTo(-8.8, -2.8); c.quadraticCurveTo(-5.0, -3.6, -1.5, -1.4);
  c.moveTo(9.8, -3.2); c.quadraticCurveTo(6.0, -4.0, 2.2, -1.6);
  c.stroke();

  /* --- nez épaté, cassé --- */
  c.fillStyle = rgba(C.peauN, 0.28);
  c.beginPath();
  c.moveTo(0.4, 0.6);
  c.quadraticCurveTo(-1.6, 4.2, 0.4, 5.6);
  c.quadraticCurveTo(3.4, 6.8, 5.8, 5.0);
  c.quadraticCurveTo(6.6, 2.6, 4.0, 0.6);
  c.closePath(); c.fill();
  c.strokeStyle = rgba(ecl(C.peauC, 1.06), 0.7); c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(1.4, 0.8); c.quadraticCurveTo(3.6, 2.2, 3.2, 4.2); c.stroke();
  c.fillStyle = rgba(C.peauN, 0.8);
  c.beginPath(); c.ellipse(0.9, 5.1, 1.1, 0.75, -0.25, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(4.8, 5.3, 1.1, 0.75, 0.25, 0, 6.2832); c.fill();
  if(v === 2){
    c.strokeStyle = C.laiton; c.lineWidth = 1.0;
    c.beginPath(); c.arc(2.9, 6.7, 2.1, 0.2, 3.2); c.stroke();
  }

  /* --- bouche : prognathe, deux défenses qui remontent --- */
  if(tir){
    c.fillStyle = "#2a1512";
    c.beginPath();
    c.moveTo(-6.8, 6.6);
    c.quadraticCurveTo(1.0, 5.6, 9.2, 6.8);
    c.quadraticCurveTo(8.2, 12.6, 1.0, 12.4);
    c.quadraticCurveTo(-5.6, 11.8, -6.8, 6.6);
    c.closePath(); c.fill();
    c.fillStyle = C.dent;
    for(var d = 0; d < 5; d++){
      c.beginPath();
      c.moveTo(-5.6 + d * 3.1, 6.6);
      c.lineTo(-3.8 + d * 3.1, 6.7);
      c.lineTo(-4.7 + d * 3.1, 9.1);
      c.closePath(); c.fill();
    }
    c.fillStyle = "rgba(142,60,54,.9)";
    c.beginPath(); c.ellipse(1.6, 11.4, 3.6, 1.6, 0, 0, 6.2832); c.fill();
  }else{
    c.strokeStyle = rgba(C.peauN, 0.85); c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(-6.2, 7.0);
    c.quadraticCurveTo(1.0, 9.4, 8.8, 6.8);
    c.stroke();
    c.strokeStyle = rgba(ecl(C.peauC, 1.04), 0.5); c.lineWidth = 1.0;
    c.beginPath();
    c.moveTo(-5.6, 8.5); c.quadraticCurveTo(1.0, 10.6, 8.2, 8.2);
    c.stroke();
  }
  /* les défenses — toujours là, gueule ouverte ou fermée */
  c.fillStyle = C.dent;
  c.beginPath();
  c.moveTo(-5.8, 8.4); c.quadraticCurveTo(-6.8, 4.4, -4.0, 2.0);
  c.quadraticCurveTo(-3.0, 5.6, -3.2, 8.6);
  c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(8.6, 8.2); c.quadraticCurveTo(9.9, 3.8, 7.3, 1.2);
  c.quadraticCurveTo(6.2, 5.0, 6.2, 8.4);
  c.closePath(); c.fill();
  c.fillStyle = rgba(C.dentO, 0.7);
  c.beginPath();
  c.moveTo(-4.1, 2.2); c.lineTo(-3.4, 4.2); c.lineTo(-4.8, 4.0); c.closePath(); c.fill();
  if(v === 2){
    c.fillStyle = C.laiton;
    c.beginPath();
    c.moveTo(-4.4, 2.6); c.lineTo(-3.7, 2.1); c.lineTo(-3.1, 4.2); c.lineTo(-4.6, 4.4);
    c.closePath(); c.fill();
    c.beginPath();
    c.moveTo(7.7, 1.8); c.lineTo(8.5, 2.4); c.lineTo(7.7, 4.2); c.lineTo(6.7, 3.6);
    c.closePath(); c.fill();
  }

  /* --- cicatrices du visage --- */
  if(v === 1){
    /* la balafre qui lui a coûté l'œil */
    c.strokeStyle = "rgba(214,172,152,.9)"; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(9.8, -5.6); c.lineTo(2.2, 8.2); c.stroke();
    c.lineWidth = 0.85;
    for(var s = 0; s < 4; s++){
      var ts = 0.15 + s * 0.24;
      var sx = 9.8 + (2.2 - 9.8) * ts, sy = -5.6 + (8.2 + 5.6) * ts;
      c.beginPath(); c.moveTo(sx - 1.8, sy - 0.9); c.lineTo(sx + 1.8, sy + 0.9); c.stroke();
    }
  }else if(v === 0){
    c.strokeStyle = "rgba(208,164,142,.8)"; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(-8.8, -4.4); c.quadraticCurveTo(-6.0, 0.5, -7.6, 5.2); c.stroke();
    /* peinture de guerre : une bande noire en travers des yeux */
    c.fillStyle = "rgba(22,16,18,.55)";
    c.beginPath();
    c.moveTo(-10.2, -1.4); c.quadraticCurveTo(0, -5.2, 11.0, -1.6);
    c.quadraticCurveTo(10.2, 2.8, 9.2, 3.4);
    c.quadraticCurveTo(0, -0.6, -9.6, 2.6);
    c.closePath(); c.fill();
  }else{
    c.strokeStyle = "rgba(208,164,142,.75)"; c.lineWidth = 1.2;
    for(var g2 = 0; g2 < 3; g2++){
      c.beginPath();
      c.moveTo(6.0 + g2 * 1.9, 1.0 + g2 * 0.4);
      c.quadraticCurveTo(8.6 + g2 * 1.6, 5.2, 6.4 + g2 * 1.4, 8.8);
      c.stroke();
    }
  }

  /* --- crâne rasé, coutures, bandeau de fer --- */
  c.fillStyle = rgba(C.peauN, 0.18);
  c.beginPath(); c.ellipse(-1.0, -7.6, 8.2, 3.4, 0.06, 0, 6.2832); c.fill();
  c.strokeStyle = rgba(C.peauN, 0.4); c.lineWidth = 1.0;
  c.beginPath(); c.moveTo(-5.8, -9.6); c.quadraticCurveTo(-2.6, -7.4, -4.6, -5.0); c.stroke();
  c.fillStyle = degCache(c, "ogreBandeau", function(){
    var g = c.createLinearGradient(-11, -9, 11, -2);
    g.addColorStop(0, C.ferC); g.addColorStop(0.5, C.fer); g.addColorStop(1, C.ferO);
    return g;
  });
  c.beginPath();
  c.moveTo(-10.8, -2.6);
  c.quadraticCurveTo(0, -8.6, 11.4, -3.0);
  c.lineTo(11.2, -5.8);
  c.quadraticCurveTo(0, -11.2, -10.6, -5.4);
  c.closePath(); c.fill();
  c.fillStyle = C.ferC;
  c.beginPath(); c.arc(-7.8, -5.2, 0.9, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(0.4, -7.5, 0.9, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(8.6, -5.2, 0.9, 0, 6.2832); c.fill();
  c.fillStyle = rgba(C.rouille, 0.35);
  c.fillRect(3.0, -7.2, 1.8, 4.2);
  c.strokeStyle = "rgba(255,255,255,.30)"; c.lineWidth = 1.0;
  c.beginPath(); c.moveTo(-8.6, -6.2); c.quadraticCurveTo(-2.0, -9.4, 4.0, -7.8); c.stroke();
  /* jugulaire de cuir */
  c.strokeStyle = C.cuirO; c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(-9.8, -3.0); c.quadraticCurveTo(-9.2, 6.2, -2.0, 10.6);
  c.moveTo(10.8, -3.4); c.quadraticCurveTo(10.6, 6.2, 3.0, 11.4);
  c.stroke();
  if(v === 0){
    /* nasal tordu qui pend du bandeau */
    c.fillStyle = C.fer;
    c.beginPath();
    c.moveTo(1.6, -4.2); c.lineTo(4.2, -4.4); c.lineTo(4.8, 1.4); c.lineTo(2.4, 1.2);
    c.closePath(); c.fill();
  }
  if(v === 1){
    /* chiffon noué sur le bandeau, il flotte un peu */
    c.fillStyle = C.cape;
    c.beginPath();
    c.moveTo(-10.0, -4.8);
    c.quadraticCurveTo(-16.0, -3.2, -19.2, 1.6);
    c.quadraticCurveTo(-14.2, 0.4, -12.8, 2.8);
    c.quadraticCurveTo(-11.8, -1.4, -9.0, -2.0);
    c.closePath(); c.fill();
  }

  /* petite natte dans la nuque : présente sur toutes les variantes,
     la silhouette de la tête doit rester identique partout */
  c.strokeStyle = "rgba(44,32,24,.92)"; c.lineWidth = 2.6;
  c.beginPath();
  c.moveTo(-9.6, -3.6);
  c.quadraticCurveTo(-14.0, 1.0 + Math.sin(phase) * 0.5, -12.8, 6.6);
  c.stroke();
  c.strokeStyle = C.cuirO; c.lineWidth = 1.0;
  c.beginPath(); c.moveTo(-13.8, 2.4); c.lineTo(-11.6, 3.0); c.stroke();

  c.restore();
}

/* ================================================================
   PORTRAIT — le buste pour la tuile de briefing.
   Cadre commun aux autres portraits : 100 de large, 84 de haut.
   Lui déborde volontairement — les trapèzes sortent des deux côtés,
   le crâne touche le haut. On doit voir tout de suite que c'est la
   grosse unité.
   ================================================================ */
function portraitOgre(c){
  var C = C_OGRE, H = 84;
  fondPortrait(c, H);
  c.save();
  c.lineJoin = "round";
  c.translate(50, 0);

  /* --- la grande hache dressée derrière l'épaule --- */
  c.save();
  c.translate(-38, 80); c.rotate(0.30);
  dessineHacheOgre(c, 62, 2.6, 0, false);
  c.restore();

  /* --- épaules et trapèzes : ils sortent du cadre --- */
  var gp = c.createLinearGradient(-38, 30, 32, 84);
  gp.addColorStop(0, ecl(C.peauC, 1.04)); gp.addColorStop(0.42, C.peau); gp.addColorStop(1, C.peauO);
  c.fillStyle = gp;
  c.beginPath();
  c.moveTo(-74, 90);
  c.bezierCurveTo(-72, 58, -50, 38, -24, 31);   /* trapèze gauche */
  c.bezierCurveTo(-12, 28, 12, 28, 24, 31);
  c.bezierCurveTo(50, 38, 72, 58, 74, 90);
  c.closePath(); c.fill();
  /* creux du cou */
  c.fillStyle = rgba(C.peauN, 0.30);
  c.beginPath();
  c.moveTo(-22, 33); c.bezierCurveTo(-10, 44, 10, 44, 22, 33);
  c.bezierCurveTo(10, 52, -10, 52, -22, 33);
  c.closePath(); c.fill();
  c.fillStyle = rgba(C.tache, 0.28);
  c.beginPath(); c.ellipse(44, 64, 8, 11, 0, 0, 6.2832); c.fill();
  /* griffures sur l'épaule droite */
  c.strokeStyle = "rgba(206,158,136,.7)"; c.lineWidth = 2.0;
  for(var k = 0; k < 3; k++){
    c.beginPath();
    c.moveTo(31 + k * 8, 44 + k * 2);
    c.quadraticCurveTo(41 + k * 8, 58, 34 + k * 7, 76);
    c.stroke();
  }

  /* --- mante de fourrure : elle détache la tête du fond --- */
  var gf = c.createLinearGradient(-40, 40, 30, 84);
  gf.addColorStop(0, C.fourrureC); gf.addColorStop(0.4, C.fourrure); gf.addColorStop(1, C.fourrureO);
  c.fillStyle = gf;
  c.beginPath();
  c.moveTo(-78, 92);
  c.bezierCurveTo(-74, 56, -50, 40, -26, 34);
  c.bezierCurveTo(-12, 31, 12, 31, 26, 34);
  c.bezierCurveTo(50, 40, 74, 56, 78, 92);
  c.lineTo(58, 92);
  /* le bord intérieur, en touffes */
  var xs = [46, 36, 27, 18, 10, 2, -8, -18, -28, -38, -48, -58];
  for(var i = 0; i < xs.length; i++){
    var pr = 1 + ((i * 7) % 5);
    c.lineTo(xs[i] + 5, 92 - 26 + pr * 2.6);
    c.lineTo(xs[i] - 3, 92 - 20 - (i % 3) * 3);
  }
  c.lineTo(-58, 92);
  c.closePath(); c.fill();
  c.strokeStyle = rgba(C.fourrureC, 0.45); c.lineWidth = 1.6;
  for(var m = 0; m < 13; m++){
    var mx = -66 + m * 11;
    c.beginPath();
    c.moveTo(mx, 46 + Math.abs(mx) * 0.32);
    c.lineTo(mx + 3, 70 + (m % 3) * 4);
    c.stroke();
  }

  /* --- épaulière de fer, à gauche du cadre --- */
  var ge = c.createLinearGradient(-66, 32, -22, 76);
  ge.addColorStop(0, ecl(C.ferC, 1.06)); ge.addColorStop(0.45, C.fer); ge.addColorStop(1, C.ferO);
  c.fillStyle = ge;
  var lam = [[44, 54], [56, 68], [68, 84]];
  for(var a = 0; a < 3; a++){
    c.beginPath();
    c.moveTo(-76, lam[a][0]);
    c.bezierCurveTo(-58, lam[a][0] - 16, -34, lam[a][0] - 9, -25, lam[a][0] + 4);
    c.lineTo(-29, lam[a][1]);
    c.bezierCurveTo(-44, lam[a][1] - 4, -62, lam[a][1] + 2, -76, lam[a][1]);
    c.closePath(); c.fill();
    c.strokeStyle = rgba(C.ferO, 0.85); c.lineWidth = 1.7; c.stroke();
  }
  c.fillStyle = C.ferC;
  c.beginPath(); c.arc(-58, 47, 2.6, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(-41, 50, 2.6, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(-56, 62, 2.6, 0, 6.2832); c.fill();
  c.fillStyle = rgba(C.rouille, 0.35);
  c.beginPath();
  c.moveTo(-48, 36); c.lineTo(-42, 36); c.lineTo(-44, 80); c.lineTo(-50, 80);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(255,255,255,.30)"; c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(-66, 42); c.quadraticCurveTo(-46, 30, -31, 42); c.stroke();
  /* pointe tordue */
  c.fillStyle = C.fer;
  c.beginPath();
  c.moveTo(-56, 40); c.lineTo(-50, 20); c.lineTo(-44, 40); c.closePath(); c.fill();

  /* --- LA TÊTE, très grande dans le cadre --- */
  c.save();
  c.translate(2, 30);
  c.scale(2.34, 2.34);

  /* oreilles */
  c.fillStyle = ecl(C.peauO, 0.86);
  c.beginPath();
  c.moveTo(-9, -2); c.quadraticCurveTo(-16, -5.5, -15, 1.5);
  c.quadraticCurveTo(-14, 6.5, -8, 5); c.closePath(); c.fill();
  c.fillStyle = C.peau;
  c.beginPath();
  c.moveTo(9.5, -2); c.quadraticCurveTo(16.5, -5.5, 15.4, 1.5);
  c.quadraticCurveTo(14, 6.5, 8.5, 5); c.closePath(); c.fill();

  /* crâne + mâchoire */
  var gv = c.createLinearGradient(-11, -12, 9, 12);
  gv.addColorStop(0, ecl(C.peauC, 1.07)); gv.addColorStop(0.5, C.peau); gv.addColorStop(1, C.peauO);
  c.fillStyle = gv;
  c.beginPath();
  c.moveTo(-10.4, -1.5);
  c.quadraticCurveTo(-11.0, -11.6, 0, -12.0);
  c.quadraticCurveTo(10.8, -12.0, 11.2, -1.5);
  c.quadraticCurveTo(12.0, 5.2, 8.8, 9.2);
  c.quadraticCurveTo(4.4, 12.8, -1.0, 12.0);
  c.quadraticCurveTo(-7.8, 10.8, -9.8, 5.0);
  c.closePath(); c.fill();
  c.fillStyle = rgba(C.peauN, 0.24);
  c.beginPath();
  c.moveTo(-9.2, 3.4); c.quadraticCurveTo(0, 8.2, 10.4, 3.0);
  c.quadraticCurveTo(9.2, 11.2, -1.0, 12.1);
  c.quadraticCurveTo(-7.6, 11.0, -9.2, 3.4);
  c.closePath(); c.fill();

  /* arcade et son ombre */
  c.fillStyle = ecl(C.peauC, 1.02);
  c.beginPath();
  c.moveTo(-10.6, -2.2);
  c.quadraticCurveTo(0, -7.8, 11.4, -2.6);
  c.quadraticCurveTo(11.2, -0.5, 10.4, 0.4);
  c.quadraticCurveTo(0, -5.0, -10.0, -0.2);
  c.closePath(); c.fill();
  c.fillStyle = rgba(C.peauN, 0.56);
  c.beginPath();
  c.moveTo(-10.2, -0.6);
  c.quadraticCurveTo(0, -5.0, 10.8, -0.8);
  c.quadraticCurveTo(9.8, 3.6, 4.4, 3.4);
  c.quadraticCurveTo(0, 1.6, -4.6, 3.2);
  c.quadraticCurveTo(-9.4, 3.4, -10.2, -0.6);
  c.closePath(); c.fill();

  /* yeux */
  c.fillStyle = C.oeil;
  c.beginPath(); c.ellipse(-4.6, 0.7, 2.8, 1.8, 0.1, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(5.1, 0.7, 3.0, 1.9, -0.1, 0, 6.2832); c.fill();
  c.fillStyle = C.pupille;
  c.beginPath(); c.ellipse(-3.9, 0.8, 1.2, 1.4, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(5.9, 0.8, 1.25, 1.45, 0, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,255,255,.8)";
  c.beginPath(); c.arc(-4.4, 0.0, 0.5, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(5.4, 0.0, 0.52, 0, 6.2832); c.fill();
  c.strokeStyle = "rgba(46,34,26,.92)"; c.lineWidth = 2.2;
  c.beginPath();
  c.moveTo(-8.8, -2.9); c.quadraticCurveTo(-5.0, -3.7, -1.5, -1.4);
  c.moveTo(9.8, -3.3); c.quadraticCurveTo(6.0, -4.1, 2.2, -1.6);
  c.stroke();

  /* nez */
  c.fillStyle = rgba(C.peauN, 0.28);
  c.beginPath();
  c.moveTo(0.4, 0.6);
  c.quadraticCurveTo(-1.6, 4.2, 0.4, 5.6);
  c.quadraticCurveTo(3.4, 6.8, 5.8, 5.0);
  c.quadraticCurveTo(6.6, 2.6, 4.0, 0.6);
  c.closePath(); c.fill();
  c.fillStyle = rgba(C.peauN, 0.82);
  c.beginPath(); c.ellipse(0.9, 5.1, 1.15, 0.8, -0.25, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(4.8, 5.3, 1.15, 0.8, 0.25, 0, 6.2832); c.fill();

  /* gueule entrouverte : il gronde */
  c.fillStyle = "#2a1512";
  c.beginPath();
  c.moveTo(-6.6, 7.0);
  c.quadraticCurveTo(1.0, 6.2, 9.0, 7.2);
  c.quadraticCurveTo(8.0, 11.6, 1.0, 11.4);
  c.quadraticCurveTo(-5.4, 10.8, -6.6, 7.0);
  c.closePath(); c.fill();
  c.fillStyle = C.dent;
  for(var d = 0; d < 5; d++){
    c.beginPath();
    c.moveTo(-5.4 + d * 3.0, 7.0);
    c.lineTo(-3.6 + d * 3.0, 7.1);
    c.lineTo(-4.5 + d * 3.0, 9.2);
    c.closePath(); c.fill();
  }
  c.fillStyle = C.dent;
  c.beginPath();
  c.moveTo(-5.8, 8.8); c.quadraticCurveTo(-7.0, 4.2, -4.0, 1.6);
  c.quadraticCurveTo(-3.0, 5.4, -3.2, 9.0);
  c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(8.8, 8.6); c.quadraticCurveTo(10.2, 3.6, 7.3, 0.8);
  c.quadraticCurveTo(6.2, 4.8, 6.2, 8.8);
  c.closePath(); c.fill();

  /* balafres */
  c.strokeStyle = "rgba(214,172,152,.9)"; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(9.9, -6.2); c.lineTo(2.0, 8.6); c.stroke();
  c.lineWidth = 0.75;
  for(var s = 0; s < 4; s++){
    var ts = 0.15 + s * 0.24;
    var sx = 9.9 + (2.0 - 9.9) * ts, sy = -6.2 + (8.6 + 6.2) * ts;
    c.beginPath(); c.moveTo(sx - 1.8, sy - 0.9); c.lineTo(sx + 1.8, sy + 0.9); c.stroke();
  }
  c.strokeStyle = "rgba(208,164,142,.72)"; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(-8.8, -4.8); c.quadraticCurveTo(-6.0, 0.5, -7.6, 5.2); c.stroke();

  /* bandeau de fer */
  var gb = c.createLinearGradient(-11, -10, 11, -2);
  gb.addColorStop(0, C.ferC); gb.addColorStop(0.5, C.fer); gb.addColorStop(1, C.ferO);
  c.fillStyle = gb;
  c.beginPath();
  c.moveTo(-10.8, -2.6);
  c.quadraticCurveTo(0, -9.0, 11.4, -3.0);
  c.lineTo(11.2, -6.4);
  c.quadraticCurveTo(0, -12.2, -10.6, -6.0);
  c.closePath(); c.fill();
  c.fillStyle = C.ferC;
  c.beginPath(); c.arc(-7.8, -5.6, 0.95, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(0.4, -8.1, 0.95, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(8.6, -5.6, 0.95, 0, 6.2832); c.fill();
  c.fillStyle = rgba(C.rouille, 0.35);
  c.fillRect(3.0, -7.8, 1.8, 4.6);
  c.strokeStyle = "rgba(255,255,255,.32)"; c.lineWidth = 1.0;
  c.beginPath(); c.moveTo(-8.6, -6.8); c.quadraticCurveTo(-2.0, -10.2, 4.0, -8.4); c.stroke();
  c.fillStyle = C.fer;
  c.beginPath();
  c.moveTo(1.6, -4.4); c.lineTo(4.2, -4.6); c.lineTo(4.8, 1.4); c.lineTo(2.4, 1.2);
  c.closePath(); c.fill();
  c.strokeStyle = C.cuirO; c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(-9.8, -3.0); c.quadraticCurveTo(-9.2, 6.2, -2.0, 10.6);
  c.moveTo(10.8, -3.4); c.quadraticCurveTo(10.6, 6.2, 3.0, 11.4);
  c.stroke();
  c.restore();

  c.restore();
  vignettePortrait(c, H);
}
