/* ================================================================
   L'OGRE — la troupe lourde du joueur
   Trois fois la taille de la Meuf, et surtout : rien à voir avec elle.
   Proportions de brute et non d'humain agrandi — épaules deux fois et
   demie plus larges que la tête, taille serrée, trapèzes qui montent
   plus haut que le crâne, bras longs plantés loin du tronc, tête en
   coin jetée vers l'avant, jambes courtes et arquées.
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
  peau:"#a3846b", peauC:"#c9aa89", peauO:"#6d5545", peauN:"#3f3129",
  tache:"#87694f", veine:"#654c3e",
  cuir:"#4c3626", cuirC:"#6d5039", cuirO:"#241812",
  fourrure:"#2a211a", fourrureC:"#453425", fourrureO:"#120c08",
  fer:"#585d64", ferC:"#939aa4", ferO:"#252a2f", rouille:"#7b4726",
  toile:"#8b7f66", toileO:"#544b3c",
  cape:"#71302b", capeC:"#9b4941", capeO:"#2f1211",
  bois:"#6a4e31", boisC:"#8e6c45", boisO:"#372718",
  sang:"#5b201d", dent:"#e6dbb8", dentO:"#a89570",
  oeil:"#f2d466", oeilMort:"#c8c1b3", pupille:"#141010",
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
    jambeA: s * 13.0, jambeB: -s * 13.0,
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
function tOgre(coul, devant){ return devant ? coul : ecl(coul, 0.74); }

/* Bord poilu : relie une suite de points par des arcs qui bombent
   alternativement, ce qui donne un bord mou et irrégulier. Surtout
   pas de dents de scie — une fourrure taillée en pointes ressemble à
   un col de bouffon, pas à une bête. Les creux et les bosses viennent
   d'une suite figée : le sprite doit être identique à chaque image. */
function bordPoiluOgre(c, pts, bosse){
  for(var i = 1; i < pts.length; i++){
    var a = pts[i - 1], b = pts[i];
    var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    var k = (i % 3 === 0) ? bosse * 1.5 : (i % 2 ? bosse : -bosse * 0.45);
    c.quadraticCurveTo(mx, my + k, b[0], b[1]);
  }
}

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

  /* --- le fer : long tranchant peu bombé, barbe crochue --- */
  c.save();
  c.translate(0, y0);
  c.scale(e, e);
  c.fillStyle = degCache(c, "ogreFer" + (devant ? 1 : 0), function(){
    var g2 = c.createLinearGradient(-3, -8, 10, 11);
    g2.addColorStop(0, tOgre(ecl(C.ferC, 1.06), devant));
    g2.addColorStop(0.40, tOgre(C.fer, devant));
    g2.addColorStop(1, tOgre(C.ferO, devant));
    return g2;
  });
  c.beginPath();
  c.moveTo(-3.4, -3.2);                              /* talon, derrière le manche */
  c.lineTo(-3.6, 2.8);
  c.lineTo(0.6, 3.2);
  c.quadraticCurveTo(1.6, 7.6, 4.6, 11.4);           /* la barbe, crochue */
  c.quadraticCurveTo(10.4, 3.8, 9.4, -6.4);          /* tranchant, à peine bombé */
  c.quadraticCurveTo(5.0, -6.6, 0.5, -3.6);          /* dos du fer */
  c.closePath();
  c.fill();
  /* biseau clair : c'est lui qui fait « tranchant » */
  c.strokeStyle = "rgba(232,238,246,.62)";
  c.lineWidth = 0.85;
  c.beginPath();
  c.moveTo(4.9, 9.6);
  c.quadraticCurveTo(9.0, 3.4, 8.1, -5.0);
  c.stroke();
  /* brèches : trois entailles dans le tranchant, décalées par variante */
  c.fillStyle = tOgre(C.ferO, devant);
  var br = [[8.4, 6.0], [9.8, 0.6], [9.2, -4.2]];
  for(var b = 0; b < 3; b++){
    if((v + b) % 3 === 0) continue;                  /* jamais les mêmes */
    c.beginPath();
    c.moveTo(br[b][0] + 1.5, br[b][1] - 1.0);
    c.lineTo(br[b][0] - 1.7, br[b][1] + 0.2);
    c.lineTo(br[b][0] + 1.2, br[b][1] + 1.3);
    c.closePath(); c.fill();
  }
  /* œil du fer + rivets */
  c.fillStyle = tOgre(C.ferO, devant);
  c.beginPath(); c.ellipse(-0.9, 0.0, 2.4, 3.2, 0, 0, 6.2832); c.fill();
  c.fillStyle = tOgre(C.ferC, devant);
  c.beginPath(); c.arc(-2.0, -1.6, 0.6, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(-2.0, 1.7, 0.6, 0, 6.2832); c.fill();
  /* rouille et sang séché : la hache a beaucoup servi */
  c.fillStyle = rgba(C.rouille, 0.30);
  c.beginPath();
  c.moveTo(2.0, 4.2); c.quadraticCurveTo(3.8, 7.2, 4.2, 10.2);
  c.quadraticCurveTo(2.4, 8.0, 1.2, 5.0);
  c.closePath(); c.fill();
  c.fillStyle = rgba(C.sang, 0.26 + (v === 1 ? 0.16 : 0));
  c.beginPath(); c.ellipse(6.0, 2.4, 2.1, 3.4, 0.5, 0, 6.2832); c.fill();
  c.restore();

  /* langues de fer qui bloquent le fer sur le manche */
  c.strokeStyle = tOgre(C.ferO, devant);
  c.lineWidth = 1.0 * e;
  c.beginPath();
  c.moveTo(-1.4 * e, y0 + 3.0 * e); c.lineTo(-1.0 * e, y0 + 8.6 * e);
  c.moveTo(1.3 * e, y0 + 3.4 * e); c.lineTo(1.1 * e, y0 + 8.0 * e);
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
    jA = 18; jB = -19;                     /* appui écarté, genoux pliés */
    yb = 3.6;                              /* il s'écrase pour lancer */
    incl = -0.16;                          /* le buste part en arrière */
    hx = 9; hy = -92;
    tra = 1.15;                            /* cape et pagne emportés */
  }else{
    jA = p.jambeA; jB = p.jambeB;
    yb = -p.haut;
    /* Léger voûtement permanent : il porte la tête en avant, comme
       une bête qui charge. Un ogre bien droit a l'air d'un culturiste. */
    incl = p.epaules + 0.055;
    hx = 5 + p.tra * 0.5;
    hy = -96 + p.choc * 1.4;
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
  c.beginPath(); c.ellipse(jA * 0.8 + 2, -0.6, 12, 4.0, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(jB * 0.8 + 2, -0.6, 10, 3.4, 0, 0, 6.2832); c.fill();

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
    var g = c.createLinearGradient(-22, -88, -6, -24);
    g.addColorStop(0, C.capeC); g.addColorStop(0.45, C.cape); g.addColorStop(1, C.capeO);
    return g;
  });
  c.beginPath();
  c.moveTo(-27, -90);
  c.quadraticCurveTo(-44 - sw, -70, -42 - sw * 1.6, -44);
  c.lineTo(-38 - sw * 1.7, -24);
  c.lineTo(-34 - sw * 1.4, -36);
  c.lineTo(-29 - sw * 1.2, -16);
  c.lineTo(-24 - sw, -31);
  c.lineTo(-18 - sw * 0.8, -21);
  c.lineTo(-14 - sw * 0.6, -33);
  c.lineTo(-8 - sw * 0.4, -26);
  c.quadraticCurveTo(-3, -56, 1, -88);
  c.closePath(); c.fill();
  c.strokeStyle = rgba(C.capeO, 0.6); c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(-23, -84); c.quadraticCurveTo(-29 - sw, -58, -26 - sw * 1.3, -32);
  c.moveTo(-14, -85); c.quadraticCurveTo(-17 - sw * 0.7, -58, -15 - sw, -29);
  c.stroke();

  /* --- la grande hache sanglée dans le dos --- */
  c.save();
  c.translate(-21, -58);
  c.rotate(-0.68 + tra * 0.015);
  dessineHacheOgre(c, 42, 1.65, (v + 1) % 3, false);
  c.restore();
  /* barda du soldat qui rentre : rouleau de couchage ficelé */
  c.save();
  c.translate(-26, -72); c.rotate(-0.5);
  c.fillStyle = ecl(C.toile, 0.5);
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
  c.moveTo(-29, -86); c.quadraticCurveTo(-13, -70, 0, -52);
  c.stroke();

  /* --- bras arrière (gauche) --- */
  var eBx = -25, eBy = -72;
  var cBx, cBy, mBx, mBy;
  if(tir){
    /* Le bras libre part loin devant : il vise, et il équilibre. */
    cBx = 8; cBy = -78; mBx = 44; mBy = -76;
  }else{
    cBx = -37 + p.brasB * 0.35; cBy = -55;
    mBx = -34 + p.brasB; mBy = -35 - Math.abs(p.brasB) * 0.30;
  }
  brasOgre(c, eBx, eBy, cBx, cBy, mBx, mBy, false, v);
  c.restore();

  /* ================= LES JAMBES ================= */
  jambeOgre(c, jB, false, v, tir);
  jambeOgre(c, jA, true, v, tir);

  /* ================= LE BUSTE ET L'AVANT ================= */
  c.save();
  c.translate(0, -50); c.rotate(incl); c.translate(0, 50);

  /* --- tronc : poitrine énorme, taille très serrée. C'est ce
     rétrécissement qui empêche la silhouette de faire un bloc. --- */
  c.fillStyle = degCache(c, "ogrePeau", function(){
    var g = c.createLinearGradient(-24, -94, 18, -46);
    g.addColorStop(0, ecl(C.peauC, 1.05)); g.addColorStop(0.36, C.peau); g.addColorStop(1, C.peauO);
    return g;
  });
  c.beginPath();
  c.moveTo(-34, -77);
  c.quadraticCurveTo(-29, -90, -14, -95);     /* trapèze gauche, montée droite */
  c.quadraticCurveTo(0, -97, 14, -95);
  c.quadraticCurveTo(29, -90, 34, -77);       /* trapèze droit */
  c.quadraticCurveTo(31, -70, 25, -63);       /* grand pectoral */
  c.quadraticCurveTo(18, -57, 17, -52);       /* taille serrée */
  c.quadraticCurveTo(19, -48, 21, -45);       /* hanche */
  c.quadraticCurveTo(0, -42, -21, -45);
  c.quadraticCurveTo(-19, -48, -17, -52);
  c.quadraticCurveTo(-18, -57, -25, -63);
  c.quadraticCurveTo(-31, -70, -34, -77);
  c.closePath(); c.fill();

  /* ombre au bas du tronc : sans elle il n'a aucun volume */
  c.fillStyle = degCache(c, "ogreVentre", function(){
    var g = c.createLinearGradient(0, -68, 0, -44);
    g.addColorStop(0, "rgba(44,34,26,0)"); g.addColorStop(1, "rgba(44,34,26,.44)");
    return g;
  });
  c.beginPath();
  c.moveTo(-26, -68); c.quadraticCurveTo(0, -62, 26, -68);
  c.quadraticCurveTo(18, -57, 17, -52);
  c.quadraticCurveTo(19, -48, 21, -45);
  c.quadraticCurveTo(0, -42, -21, -45);
  c.quadraticCurveTo(-19, -48, -17, -52);
  c.quadraticCurveTo(-18, -57, -26, -68);
  c.closePath(); c.fill();

  /* pectoraux lourds + creux sternal */
  c.strokeStyle = rgba(C.peauN, 0.40); c.lineWidth = 2.0;
  c.beginPath();
  c.moveTo(-25, -76); c.quadraticCurveTo(-14, -64, -2, -67);
  c.moveTo(26, -76); c.quadraticCurveTo(15, -64, 3, -67);
  c.stroke();
  c.fillStyle = rgba(C.peauN, 0.28);
  c.beginPath();
  c.moveTo(0.5, -84); c.quadraticCurveTo(2.0, -75, 0.5, -67); c.lineTo(-1.5, -67);
  c.quadraticCurveTo(-1.0, -75, -1.5, -84);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(255,255,255,.22)"; c.lineWidth = 1.7;
  c.beginPath();
  c.moveTo(-26, -80); c.quadraticCurveTo(-16, -84, -6, -80);
  c.stroke();
  /* ventre : deux plis, pas des tablettes de gymnase */
  c.strokeStyle = rgba(C.peauN, 0.26); c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(-12, -60); c.quadraticCurveTo(0, -57, 12, -60);
  c.moveTo(-10, -54); c.quadraticCurveTo(0, -51, 10, -54);
  c.stroke();

  /* --- la peau : taches, crasse, poils --- */
  c.fillStyle = rgba(C.tache, 0.32);
  var tac = [[-22, -84, 4.4, 2.8], [18, -86, 3.6, 2.2], [-8, -57, 5.4, 2.8],
             [22, -70, 3.6, 4.6], [-24, -70, 3.0, 4.0], [10, -83, 2.8, 1.8]];
  for(var i = 0; i < tac.length; i++){
    if((i + v) % 4 === 0) continue;
    c.beginPath();
    c.ellipse(tac[i][0], tac[i][1], tac[i][2], tac[i][3], i * 0.7, 0, 6.2832);
    c.fill();
  }
  c.strokeStyle = rgba(C.peauN, 0.26); c.lineWidth = 0.6;
  for(var h2 = 0; h2 < 7; h2++){
    var hx2 = -8 + h2 * 2.8, hy2 = -72 + (h2 % 2) * 2.4;
    c.beginPath();
    c.moveTo(hx2, hy2); c.lineTo(hx2 + 0.9, hy2 + 2.6);
    c.stroke();
  }

  /* --- cicatrices : il revient de loin --- */
  if(v !== 1){
    /* trois griffures parallèles sur les côtes */
    c.strokeStyle = "rgba(188,146,124,.55)"; c.lineWidth = 1.1;
    for(var k = 0; k < 3; k++){
      c.beginPath();
      c.moveTo(11 + k * 4.4, -74);
      c.quadraticCurveTo(15 + k * 4.4, -66, 11 + k * 4.4, -58);
      c.stroke();
    }
  }
  if(v !== 0){
    /* balafre recousue en travers du ventre : gros points de suture */
    c.strokeStyle = "rgba(190,148,126,.66)"; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(-14, -64); c.quadraticCurveTo(-3, -59, 8, -62); c.stroke();
    c.lineWidth = 0.9;
    for(var s2 = 0; s2 < 5; s2++){
      var xs = -12 + s2 * 4.6, ys = -63.2 + Math.abs(s2 - 2) * 0.6;
      c.beginPath(); c.moveTo(xs - 1.7, ys - 2.1); c.lineTo(xs + 1.7, ys + 2.1); c.stroke();
    }
  }
  if(v !== 2){
    c.strokeStyle = "rgba(188,146,124,.5)"; c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(-19, -73); c.quadraticCurveTo(-13, -68, -17, -60); c.stroke();
  }

  /* --- plastron ramassé sur un mort, tenu par des cordes.
     Il tient sur le pectoral gauche seulement : rien chez lui n'est
     une armure complète. --- */
  c.fillStyle = degCache(c, "ogrePlastron", function(){
    var g = c.createLinearGradient(-28, -80, -6, -56);
    g.addColorStop(0, C.ferC); g.addColorStop(0.4, C.fer); g.addColorStop(1, C.ferO);
    return g;
  });
  c.beginPath();
  c.moveTo(-28, -80);
  c.quadraticCurveTo(-14, -83, -5, -75);
  c.lineTo(-7, -68);                       /* bord arraché, en dents de scie */
  c.lineTo(-12, -71);
  c.lineTo(-14, -63);
  c.lineTo(-19, -68);
  c.lineTo(-22, -61);
  c.lineTo(-27, -67);
  c.closePath(); c.fill();
  c.fillStyle = rgba(C.ferO, 0.5);
  c.beginPath(); c.ellipse(-19, -75, 4.0, 2.8, 0.4, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(-11, -72, 2.4, 1.8, -0.3, 0, 6.2832); c.fill();
  c.fillStyle = rgba(C.rouille, 0.34);
  c.beginPath();
  c.moveTo(-25, -78); c.lineTo(-22, -78); c.lineTo(-20, -63); c.lineTo(-23, -64);
  c.closePath(); c.fill();
  c.fillStyle = C.ferC;
  var riv = [[-25, -77], [-17, -79], [-10, -75], [-25, -70]];
  for(var r2 = 0; r2 < riv.length; r2++){
    c.beginPath(); c.arc(riv[r2][0], riv[r2][1], 1.15, 0, 6.2832); c.fill();
  }
  c.strokeStyle = "rgba(255,255,255,.26)"; c.lineWidth = 1.1;
  c.beginPath(); c.moveTo(-26, -78); c.quadraticCurveTo(-17, -81, -8, -76); c.stroke();
  /* cordes qui le sanglent sur l'épaule opposée */
  c.strokeStyle = C.toileO; c.lineWidth = 2.0;
  c.beginPath();
  c.moveTo(-27, -81); c.quadraticCurveTo(-6, -86, 14, -84);
  c.moveTo(-7, -73); c.quadraticCurveTo(6, -77, 18, -79);
  c.stroke();

  /* --- baudrier de cuir en travers du torse --- */
  c.fillStyle = degCache(c, "ogreBaudrier", function(){
    var g = c.createLinearGradient(22, -84, -10, -46);
    g.addColorStop(0, C.cuirC); g.addColorStop(0.5, C.cuir); g.addColorStop(1, C.cuirO);
    return g;
  });
  c.beginPath();
  c.moveTo(26, -82); c.lineTo(32, -77);
  c.quadraticCurveTo(6, -60, -10, -46);
  c.lineTo(-16, -50);
  c.quadraticCurveTo(2, -64, 26, -82);
  c.closePath(); c.fill();
  c.fillStyle = C.laiton;
  c.beginPath(); c.arc(18, -73, 1.7, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(4, -63, 1.7, 0, 6.2832); c.fill();
  /* sacoche pendue au baudrier */
  c.fillStyle = C.cuirO;
  c.beginPath();
  if(c.roundRect) c.roundRect(8, -64, 10, 8, 2); else c.rect(8, -64, 10, 8);
  c.fill();
  c.strokeStyle = C.cuirC; c.lineWidth = 1.0;
  c.beginPath(); c.moveTo(8.5, -61); c.lineTo(17.5, -61); c.stroke();

  /* ================= CEINTURE, PAGNE, HACHES ================= */
  var bal = tra * 0.05;

  /* pans de cuir courts : ils ne doivent pas manger les cuisses,
     sinon les jambes disparaissent et il a l'air trapu */
  var pan = [[-16, 8, 4.6], [-8, 11, 4.8], [0, 8.5, 4.6], [8, 11, 4.8], [16, 8, 4.4]];
  for(var q = 0; q < pan.length; q++){
    var px = pan[q][0], pl = pan[q][1], pw = pan[q][2];
    var dec = tra * (2.0 + q * 0.3);
    c.fillStyle = q % 2 ? C.cuir : ecl(C.cuir, 0.78);
    c.beginPath();
    c.moveTo(px - pw, -48);
    c.lineTo(px + pw, -48);
    c.lineTo(px + pw * 0.8 + dec, -48 + pl);
    c.lineTo(px + dec * 1.1, -48 + pl + 2.4);       /* pointe déchirée */
    c.lineTo(px - pw * 0.8 + dec, -48 + pl - 1.4);
    c.closePath(); c.fill();
  }

  /* deux hachettes passées DANS la ceinture, fer en haut : sous la
     ceinture elles pendraient sur les cuisses et couperaient les
     jambes en deux. */
  c.save();
  c.translate(-19, -46); c.rotate(-0.30 + bal);
  dessineHacheOgre(c, 16, 0.78, v, true);
  c.restore();

  /* la ceinture : énorme, c'est la pièce maîtresse de sa tenue */
  c.fillStyle = degCache(c, "ogreCeinture", function(){
    var g = c.createLinearGradient(0, -57, 0, -46);
    g.addColorStop(0, ecl(C.cuir, 1.25)); g.addColorStop(0.45, ecl(C.cuir, 0.86)); g.addColorStop(1, C.cuirO);
    return g;
  });
  c.beginPath();
  c.moveTo(-22, -56);
  c.quadraticCurveTo(0, -59, 22, -56);
  c.quadraticCurveTo(23, -51, 22, -46);
  c.quadraticCurveTo(0, -42, -22, -46);
  c.quadraticCurveTo(-23, -51, -22, -56);
  c.closePath(); c.fill();
  c.fillStyle = C.ferC;
  for(var n = 0; n < 5; n++){
    var nx = -18 + n * 7.6;
    c.beginPath(); c.arc(nx, -54.4 + Math.abs(nx) * 0.05, 1.0, 0, 6.2832); c.fill();
  }
  /* boucle de fer brut, décentrée : rien n'est neuf chez lui */
  c.fillStyle = degCache(c, "ogreBoucle", function(){
    var g = c.createLinearGradient(-4, -58, 9, -46);
    g.addColorStop(0, ecl(C.ferC, 0.82)); g.addColorStop(0.5, ecl(C.fer, 0.86)); g.addColorStop(1, C.ferO);
    return g;
  });
  c.beginPath();
  if(c.roundRect) c.roundRect(-4, -56.6, 11, 10.4, 2.2); else c.rect(-4, -56.6, 11, 10.4);
  c.fill();
  c.fillStyle = C.cuirO;
  c.beginPath();
  if(c.roundRect) c.roundRect(-1.8, -54.6, 6.8, 6.0, 1.4); else c.rect(-1.8, -54.6, 6.8, 6.0);
  c.fill();
  c.fillStyle = C.ferC;
  c.fillRect(0.8, -56.6, 2.0, 10.4);
  c.fillStyle = rgba(C.rouille, 0.35);
  c.fillRect(4.6, -55, 2.4, 8.4);

  /* ================= LA MANTE DE FOURRURE =================
     Un pelage noir jeté sur les épaules seulement : c'est elle qui
     découpe la tête du torse. Si elle descend sur la poitrine, tout
     le haut du corps redevient une seule masse beige. */
  manteOgre(c);

  /* ================= LA TÊTE ================= */
  teteOgre(c, hx, hy, v, tir, phase);

  /* ================= ÉPAULIÈRE AVANT ================= */
  c.save();
  c.translate(31, -77);
  c.rotate(tir ? -0.34 : 0.04 + p.epaules);
  c.fillStyle = degCache(c, "ogreEpauliere", function(){
    var g = c.createLinearGradient(-12, -16, 13, 11);
    g.addColorStop(0, ecl(C.ferC, 1.06)); g.addColorStop(0.45, C.fer); g.addColorStop(1, C.ferO);
    return g;
  });
  var pl = [[-13, 11, 2], [-11, 13.5, -3.5], [-8, 15, -10]];
  for(var a2 = 0; a2 < 3; a2++){
    c.beginPath();
    c.moveTo(pl[a2][0], pl[a2][2]);
    c.quadraticCurveTo(0, pl[a2][2] - 9, pl[a2][1], pl[a2][2] - 1);
    c.quadraticCurveTo(pl[a2][1] + 1.5, pl[a2][2] + 4, pl[a2][1] - 3, pl[a2][2] + 5);
    c.quadraticCurveTo(-4, pl[a2][2] + 7, pl[a2][0], pl[a2][2] + 3.5);
    c.closePath(); c.fill();
    c.strokeStyle = rgba(C.ferO, 0.9); c.lineWidth = 1.1;
    c.stroke();
  }
  /* éclat arraché sur la lame du bas */
  c.fillStyle = C.ferO;
  c.beginPath();
  c.moveTo(7, 2); c.lineTo(13, 3); c.lineTo(9, 8); c.closePath(); c.fill();
  c.fillStyle = C.ferC;
  c.beginPath(); c.arc(-9, -8, 1.3, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(-8, -2.5, 1.3, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(-6, 5, 1.3, 0, 6.2832); c.fill();
  c.fillStyle = rgba(C.rouille, 0.36);
  c.beginPath();
  c.moveTo(1, -11); c.lineTo(4, -11); c.lineTo(3, 8); c.lineTo(0, 8); c.closePath(); c.fill();
  c.strokeStyle = "rgba(255,255,255,.34)"; c.lineWidth = 1.3;
  c.beginPath(); c.moveTo(-10, -11); c.quadraticCurveTo(-1, -18, 8, -12); c.stroke();
  /* pointe de fer tordue sur le dessus */
  c.fillStyle = C.fer;
  c.beginPath();
  c.moveTo(-4, -14); c.lineTo(1, -23); c.lineTo(4, -13); c.closePath(); c.fill();
  c.strokeStyle = C.ferO; c.lineWidth = 0.8; c.stroke();
  c.restore();

  /* ================= BRAS AVANT + HACHE EN MAIN ================= */
  var eAx = 26, eAy = -72;
  var cAx, cAy, mAx, mAy, rotH;
  if(tir){
    /* Armé : le poing part derrière la tête, la hache pointe en arrière.
       Toute la lecture de la pose tient dans ce coude très haut. */
    cAx = 4 + trem * 0.8; cAy = -102;
    mAx = -22 + trem; mAy = -93 + trem * 0.6;
    rotH = -2.36 + trem * 0.03;
  }else{
    cAx = 37 + p.brasA * 0.30; cAy = -55;
    mAx = 34 + p.brasA * 0.9; mAy = -35 - Math.abs(p.brasA) * 0.30;
    rotH = 2.95 + p.brasA * 0.014;
  }

  /* la hache tenue passe derrière le poing */
  c.save();
  c.translate(mAx, mAy); c.rotate(rotH);
  dessineHacheOgre(c, 26, 1.2, v, true);
  c.restore();

  brasOgre(c, eAx, eAy, cAx, cAy, mAx, mAy, true, v);

  /* Traînée d'armement : l'air que le fer a déjà brassé. */
  if(tir){
    c.strokeStyle = "rgba(255,255,255,.16)";
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(-40, -74);
    c.quadraticCurveTo(-50, -96, -32, -114);
    c.stroke();
    c.strokeStyle = "rgba(255,255,255,.10)";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(-31, -69);
    c.quadraticCurveTo(-43, -93, -25, -111);
    c.stroke();
  }

  c.restore();
  c.restore();
}

/* ---------------------------------------------------------------
   LA FOURRURE.
   Une crinière derrière la nuque et une dépouille jetée sur la SEULE
   épaule gauche — la droite est prise par l'épaulière de fer. C'est
   cette asymétrie qui empêche la silhouette de ressembler à un
   culturiste, et c'est le noir de la fourrure qui détache la tête du
   torse. Le bord est fait de mèches individuelles : une masse au bord
   lisse ressemble à une brioche, et un bord en dents de scie à un col
   de bouffon.
   --------------------------------------------------------------- */
function mecheOgre(c, x, y, a, l, w){
  c.save();
  c.translate(x, y); c.rotate(a);
  c.beginPath();
  c.moveTo(-w, -1);
  c.quadraticCurveTo(-w * 0.7, l * 0.72, 0, l);
  c.quadraticCurveTo(w * 0.85, l * 0.60, w, -1);
  c.closePath(); c.fill();
  c.restore();
}

/* Les mèches du bord bas de la dépouille : position, angle, longueur,
   largeur. Liste figée — le sprite doit être identique à chaque image. */
var MECHES_OGRE = [
  [-36.0, -74.0, -2.85, 9.0, 3.4], [-32.5, -76.5, -2.70, 6.5, 3.0],
  [-29.0, -77.5, -2.55, 10.0, 3.6], [-25.5, -78.5, -2.40, 7.0, 3.2],
  [-22.0, -79.5, -2.25, 9.5, 3.4], [-18.5, -80.5, -2.10, 6.5, 3.0],
  [-15.0, -82.0, -1.95, 9.0, 3.4], [-11.5, -84.0, -1.80, 6.0, 3.0],
  [-8.0, -86.0, -1.60, 8.5, 3.2], [-5.0, -88.5, -1.35, 6.0, 2.8],
  [-2.5, -91.0, -1.05, 7.0, 2.8]
];

function manteOgre(c){
  var C = C_OGRE;
  var deg = degCache(c, "ogreMante", function(){
    var g = c.createLinearGradient(-30, -98, -8, -70);
    g.addColorStop(0, C.fourrureC); g.addColorStop(0.35, C.fourrure); g.addColorStop(1, C.fourrureO);
    return g;
  });
  var i;

  /* --- crinière derrière la nuque : elle dépasse de part et d'autre
     du crâne et pose la tête sur du sombre --- */
  c.fillStyle = deg;
  c.beginPath();
  c.moveTo(-23, -82);
  c.quadraticCurveTo(-21, -99, 0, -101);
  c.quadraticCurveTo(21, -99, 23, -82);
  c.quadraticCurveTo(0, -88, -23, -82);
  c.closePath(); c.fill();
  var cri = [[-22, -84, 3.0, 7, 3.2], [-17, -87, 3.2, 5, 3.0], [-11, -89, 3.5, 6.5, 3.0],
             [11, -89, 2.9, 6.5, 3.0], [17, -87, 3.05, 5, 3.0], [22, -84, 3.25, 7, 3.2]];
  c.fillStyle = C.fourrure;
  for(i = 0; i < cri.length; i++) mecheOgre(c, cri[i][0], cri[i][1], cri[i][2], cri[i][3], cri[i][4]);

  /* --- la dépouille sur l'épaule gauche --- */
  c.fillStyle = deg;
  c.beginPath();
  c.moveTo(-38, -73);
  c.quadraticCurveTo(-39, -87, -27, -94);      /* le dessus, sur l'épaule */
  c.quadraticCurveTo(-14, -100, -1, -95);
  c.quadraticCurveTo(-3, -88, -9, -82);        /* le bord qui redescend */
  c.quadraticCurveTo(-20, -76, -30, -73);
  c.closePath(); c.fill();
  /* les mèches, deux passes : la masse puis les pointes plus claires */
  c.fillStyle = C.fourrure;
  for(i = 0; i < MECHES_OGRE.length; i++){
    mecheOgre(c, MECHES_OGRE[i][0], MECHES_OGRE[i][1], MECHES_OGRE[i][2],
              MECHES_OGRE[i][3], MECHES_OGRE[i][4]);
  }
  c.fillStyle = ecl(C.fourrureC, 1.12);
  for(i = 0; i < MECHES_OGRE.length; i += 2){
    mecheOgre(c, MECHES_OGRE[i][0], MECHES_OGRE[i][1], MECHES_OGRE[i][2] + 0.12,
              MECHES_OGRE[i][3] * 0.55, MECHES_OGRE[i][4] * 0.5);
  }
  /* quelques touffes qui rebiquent sur le dessus de l'épaule */
  c.fillStyle = C.fourrureO;
  var haut = [[-36, -85, -0.5, 6, 3.0], [-30, -91, -0.25, 6, 3.0],
              [-22, -96, 0.0, 5.5, 3.0], [-13, -99, 0.3, 5, 2.8], [-5, -97, 0.6, 5, 2.8]];
  for(i = 0; i < haut.length; i++) mecheOgre(c, haut[i][0], haut[i][1], haut[i][2] + 3.1416, haut[i][3], haut[i][4]);
  /* poil : traits courts, jamais de longues courbes lisses */
  c.strokeStyle = rgba(ecl(C.fourrureC, 1.2), 0.45); c.lineWidth = 1.0;
  var po = [[-33, -88, -31, -80], [-29, -92, -27, -84], [-24, -93, -22, -85],
            [-19, -94, -18, -86], [-14, -96, -13, -88], [-9, -95, -8, -88],
            [-34, -80, -33, -75], [-25, -84, -24, -79], [-16, -89, -15, -84],
            [-6, -92, -5, -87], [12, -93, 13, -88], [-15, -98, -14, -93]];
  for(i = 0; i < po.length; i++){
    c.beginPath();
    c.moveTo(po[i][0], po[i][1]);
    c.quadraticCurveTo(po[i][0] + 1.6, (po[i][1] + po[i][3]) / 2, po[i][2], po[i][3]);
    c.stroke();
  }
  /* ombre portée de la dépouille sur la poitrine */
  c.fillStyle = "rgba(16,11,8,.34)";
  c.beginPath();
  c.moveTo(-32, -72); c.quadraticCurveTo(-16, -78, -1, -94);
  c.quadraticCurveTo(-12, -73, -32, -68);
  c.closePath(); c.fill();
  /* la patte de la bête, nouée sur la poitrine */
  c.fillStyle = C.fourrureO;
  c.beginPath();
  c.moveTo(-2, -95); c.quadraticCurveTo(5, -92, 4, -85);
  c.quadraticCurveTo(1, -82, -2, -87);
  c.closePath(); c.fill();
  c.fillStyle = C.ferC;
  c.beginPath(); c.arc(0.5, -91, 2.2, 0, 6.2832); c.fill();
  c.fillStyle = C.ferO;
  c.beginPath(); c.arc(0.5, -91, 1.0, 0, 6.2832); c.fill();
}

/* ---------------------------------------------------------------
   Une jambe. Arquée, épaisse, enveloppée de bandes et de ferraille.
   dx : décalage horizontal du pied — devant : jambe la plus proche.
   --------------------------------------------------------------- */
function jambeOgre(c, dx, devant, v, tir){
  var C = C_OGRE;
  var sg = dx > 0 ? 1 : -1;
  var hanche = dx * 0.16 + sg * 2, genou = dx * 0.60, chev = dx;
  var yg = tir ? -28 : -30;

  /* cuisse : épaisse, bombée vers l'extérieur */
  c.strokeStyle = tOgre(C.peau, devant);
  c.lineWidth = 15.5;
  c.beginPath();
  c.moveTo(hanche, -49);
  c.quadraticCurveTo(genou + sg * 4.5, -40, genou, yg);
  c.stroke();
  /* mollet */
  c.lineWidth = 12;
  c.beginPath();
  c.moveTo(genou, yg);
  c.quadraticCurveTo(chev - sg * 3.0, -18, chev, -8);
  c.stroke();
  /* relief du mollet du côté éclairé */
  c.strokeStyle = rgba(C.peauN, 0.24); c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(genou + sg * 4.5, yg - 2);
  c.quadraticCurveTo(chev + sg * 6.0, -20, chev + sg * 3.5, -12);
  c.stroke();
  c.strokeStyle = rgba(C.peauC, devant ? 0.32 : 0.10); c.lineWidth = 2.2;
  c.beginPath();
  c.moveTo(hanche - 6, -46); c.quadraticCurveTo(genou - 6, -40, genou - 3.5, yg + 3);
  c.stroke();

  /* bandes de toile sale sur le bas du tibia seulement — plus haut,
     elles avalent le genou et la jambe paraît courte */
  c.save();
  c.lineCap = "butt";
  c.strokeStyle = tOgre(C.toile, devant);
  c.lineWidth = 2.8;
  for(var b = 0; b < 3; b++){
    var t = 0.42 + b * 0.24;
    var bx = genou + (chev - genou) * t, by = yg + (-10 - yg) * t;
    c.beginPath();
    c.moveTo(bx - 5.9, by + 1.3); c.lineTo(bx + 5.9, by - 1.3);
    c.stroke();
  }
  c.strokeStyle = rgba(C.toileO, 0.8); c.lineWidth = 1.0;
  c.beginPath();
  c.moveTo(genou + (chev - genou) * 0.35 - 4, yg * 0.5 - 6);
  c.lineTo(chev + 5, -13);
  c.stroke();
  c.restore();

  if(devant){
    /* genouillère de fer, cabossée */
    c.save();
    c.translate(genou, yg);
    c.fillStyle = degCache(c, "ogreGenou", function(){
      var g = c.createLinearGradient(-7, -8, 7, 6);
      g.addColorStop(0, C.ferC); g.addColorStop(0.5, C.fer); g.addColorStop(1, C.ferO);
      return g;
    });
    c.beginPath(); c.ellipse(0, 0, 7.6, 6.6, 0, 0, 6.2832); c.fill();
    c.fillStyle = rgba(C.ferO, 0.55);
    c.beginPath(); c.ellipse(2.2, 1.6, 3.0, 2.4, 0.4, 0, 6.2832); c.fill();
    c.fillStyle = C.ferC;
    c.beginPath(); c.arc(-4.0, -3.0, 1.1, 0, 6.2832); c.fill();
    c.beginPath(); c.arc(4.2, -2.6, 1.1, 0, 6.2832); c.fill();
    c.strokeStyle = "rgba(255,255,255,.32)"; c.lineWidth = 1.2;
    c.beginPath(); c.arc(0, 0, 4.9, 3.5, 5.1); c.stroke();
    c.fillStyle = C.fer;
    c.beginPath();
    c.moveTo(5.8, -2.2); c.lineTo(11.5, 0.6); c.lineTo(5.8, 3.2); c.closePath(); c.fill();
    c.restore();
  }else{
    /* jambe arrière : une simple corde nouée au genou */
    c.strokeStyle = tOgre(C.toileO, devant); c.lineWidth = 2.2;
    c.beginPath(); c.arc(genou, yg, 6.4, -0.6, 3.4); c.stroke();
  }

  /* pied : plus une masse emmaillotée qu'une botte */
  c.fillStyle = tOgre(C.cuir, devant);
  c.beginPath();
  c.moveTo(chev - 8, -10);
  c.quadraticCurveTo(chev - 10.5, -1.5, chev - 5, -0.5);
  c.lineTo(chev + 12, -0.5);
  c.quadraticCurveTo(chev + 15.5, -3, chev + 10, -7);
  c.quadraticCurveTo(chev + 3, -11, chev - 8, -10);
  c.closePath(); c.fill();
  c.strokeStyle = tOgre(C.cuirO, devant); c.lineWidth = 1.7;
  c.beginPath();
  c.moveTo(chev - 6, -8); c.lineTo(chev + 5, -2.0);
  c.moveTo(chev - 5, -2.0); c.lineTo(chev + 6, -7.4);
  c.stroke();
  /* bout ferré */
  c.fillStyle = tOgre(C.fer, devant);
  c.beginPath();
  c.moveTo(chev + 6, -7.4);
  c.quadraticCurveTo(chev + 15.5, -4, chev + 12, -0.5);
  c.lineTo(chev + 6, -0.5);
  c.closePath(); c.fill();
  c.fillStyle = tOgre(C.ferC, devant);
  c.fillRect(chev + 7.4, -6.0, 1.4, 1.4);
  /* crasse du bas */
  c.fillStyle = "rgba(50,40,32,.38)";
  c.beginPath(); c.ellipse(chev + 2, -1.2, 10, 2.0, 0, 0, 6.2832); c.fill();
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
  c.lineWidth = 12.5;
  c.beginPath(); c.moveTo(ex, ey); c.lineTo(cx, cy); c.stroke();
  c.lineWidth = 10.4;
  c.beginPath(); c.moveTo(cx, cy); c.lineTo(mx, my); c.stroke();
  /* deltoïde : une boule de muscle, mais plus petite que la tête */
  c.fillStyle = tOgre(C.peau, devant);
  c.beginPath();
  c.ellipse(ex, ey, 8.0, 9.4, devant ? 0.22 : -0.22, 0, 6.2832);
  c.fill();
  /* creux de l'aisselle : sans lui le bras se noie dans le torse */
  c.fillStyle = devant ? "rgba(44,34,26,.45)" : "rgba(26,20,16,.6)";
  c.beginPath();
  c.ellipse(ex - (devant ? 7.6 : -7.6), ey + 4, 3.4, 8.0, devant ? 0.25 : -0.25, 0, 6.2832);
  c.fill();
  /* biceps gonflé, ombre au pli du coude */
  c.fillStyle = rgba(C.peauC, devant ? 0.42 : 0.12);
  c.beginPath();
  c.ellipse((ex + cx) / 2 - 1.5, (ey + cy) / 2, 5.4, 3.8, Math.atan2(cy - ey, cx - ex), 0, 6.2832);
  c.fill();
  c.fillStyle = rgba(C.peauN, 0.22);
  c.beginPath(); c.ellipse(cx, cy, 5.8, 4.8, 0, 0, 6.2832); c.fill();

  /* brassard de fer au-dessus du coude */
  c.save();
  c.translate((ex + cx) / 2 + (cx - ex) * 0.22, (ey + cy) / 2 + (cy - ey) * 0.22);
  c.rotate(Math.atan2(cy - ey, cx - ex));
  c.fillStyle = tOgre(C.fer, devant);
  c.beginPath();
  if(c.roundRect) c.roundRect(-3.0, -7.6, 6.0, 15.2, 2); else c.rect(-3.0, -7.6, 6.0, 15.2);
  c.fill();
  c.fillStyle = tOgre(C.ferC, devant);
  c.fillRect(-2.8, -6.9, 5.6, 1.3);
  c.fillStyle = rgba(C.rouille, 0.32);
  c.fillRect(-0.9, -7.2, 1.8, 14.4);
  c.restore();

  /* bandages sales sur l'avant-bras */
  c.save();
  c.lineCap = "butt";
  c.strokeStyle = tOgre(C.toile, devant);
  c.lineWidth = 2.9;
  for(var b = 0; b < 4; b++){
    var t = 0.26 + b * 0.18;
    var bx = cx + (mx - cx) * t, by = cy + (my - cy) * t;
    c.beginPath();
    c.moveTo(bx + sa * 5.3 - na * 1.1, by - na * 5.3 - sa * 1.1);
    c.lineTo(bx - sa * 5.3 + na * 1.1, by + na * 5.3 + sa * 1.1);
    c.stroke();
  }
  c.strokeStyle = rgba(C.toileO, 0.8); c.lineWidth = 1.0;
  c.beginPath();
  c.moveTo(cx + sa * 4.0, cy - na * 4.0);
  c.lineTo(mx - sa * 4.0, my + na * 4.0);
  c.stroke();
  c.restore();
  /* veine saillante sur l'avant-bras */
  c.strokeStyle = rgba(C.veine, devant ? 0.34 : 0.12); c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(cx + (mx - cx) * 0.30 - sa * 2.6, cy + (my - cy) * 0.30 + na * 2.6);
  c.quadraticCurveTo(cx + (mx - cx) * 0.6, cy + (my - cy) * 0.6,
                     cx + (mx - cx) * 0.85 - sa * 1.8, cy + (my - cy) * 0.85 + na * 1.8);
  c.stroke();

  /* le poing : une masse fermée, phalanges marquées, pouce par-dessus */
  c.fillStyle = devant ? C.peau : ecl(C.peau, 0.66);
  c.beginPath();
  c.ellipse(mx, my, 6.8, 6.0, ang, 0, 6.2832);
  c.fill();
  c.fillStyle = rgba(C.peauN, devant ? 0.34 : 0.20);
  for(var k = 0; k < 3; k++){
    var kx = mx + na * (2.2 + k * 0.2) + sa * (3.6 - k * 3.6);
    var ky = my + sa * (2.2 + k * 0.2) - na * (3.6 - k * 3.6);
    c.beginPath(); c.arc(kx, ky, 1.4, 0, 6.2832); c.fill();
  }
  c.fillStyle = devant ? ecl(C.peauC, 0.98) : ecl(C.peauC, 0.66);
  c.beginPath();
  c.ellipse(mx - sa * 3.4 + na * 1.0, my + na * 3.4 + sa * 1.0, 3.6, 2.1, ang, 0, 6.2832);
  c.fill();
  c.fillStyle = rgba(C.peauN, devant ? 0.26 : 0.14);
  c.beginPath(); c.ellipse(mx - na * 3.8, my - sa * 3.8, 2.6, 4.0, ang, 0, 6.2832); c.fill();
}

/* ---------------------------------------------------------------
   LE VISAGE.
   Un coin jeté vers l'avant : front fuyant, arcade en surplomb, yeux
   minuscules et jaunes enfoncés dessous, nez écrasé, mâchoire portée
   loin devant, deux défenses courtes aux coins de la bouche.
   Dessiné dans un repère centré sur la tête, ce qui permet de le
   réutiliser tel quel dans le portrait : le visage du briefing et
   celui du terrain sont alors le MÊME dessin.
   La SILHOUETTE ne change jamais d'une variante à l'autre — seules
   les cicatrices, la peinture et la ferraille changent.
   --------------------------------------------------------------- */
function visageOgre(c, v, ouverte, phase){
  var C = C_OGRE;

  /* --- oreilles, petites et rejetées en arrière --- */
  c.fillStyle = ecl(C.peauO, 0.82);
  c.beginPath();
  c.moveTo(-10.0, -3.0); c.quadraticCurveTo(-14.8, -6.4, -13.4, -1.6);
  c.quadraticCurveTo(-12.6, 1.8, -9.2, 2.2); c.closePath(); c.fill();
  c.fillStyle = C.peau;
  c.beginPath();
  c.moveTo(10.8, -4.2); c.quadraticCurveTo(15.8, -8.2, 14.6, -3.0);
  if(v === 1){ c.lineTo(12.6, -3.4); c.lineTo(13.6, -0.6); }   /* oreille entaillée */
  c.quadraticCurveTo(13.4, 0.6, 10.2, 1.4); c.closePath(); c.fill();
  c.strokeStyle = rgba(C.peauN, 0.45); c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(13.0, -4.4); c.quadraticCurveTo(13.2, -2.0, 11.2, -0.6); c.stroke();

  /* --- masse du crâne et de la mâchoire, en coin vers l'avant --- */
  c.fillStyle = degCache(c, "ogreTete", function(){
    var g = c.createRadialGradient(-3, -6, 1.5, 1, 0, 17);
    g.addColorStop(0, ecl(C.peauC, 1.07)); g.addColorStop(0.55, C.peau); g.addColorStop(1, C.peauO);
    return g;
  });
  c.beginPath();
  c.moveTo(-11.4, 0.5);
  c.quadraticCurveTo(-12.2, -9.0, -3.5, -12.0);    /* arrière et sommet */
  c.quadraticCurveTo(5.5, -14.0, 11.0, -7.0);      /* front fuyant */
  c.quadraticCurveTo(13.2, -2.6, 12.4, 2.0);       /* arcade portée en avant */
  c.quadraticCurveTo(13.6, 7.6, 9.0, 11.4);        /* mâchoire */
  c.quadraticCurveTo(3.0, 14.4, -2.4, 12.8);       /* menton lourd */
  c.quadraticCurveTo(-9.2, 11.0, -11.0, 5.0);
  c.closePath(); c.fill();

  /* pommettes saillantes, prises dans la lumière */
  c.fillStyle = rgba(ecl(C.peauC, 1.06), 0.45);
  c.beginPath(); c.ellipse(-7.4, 3.6, 3.2, 2.2, -0.35, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(10.0, 2.6, 2.8, 2.6, 0.35, 0, 6.2832); c.fill();
  /* dessous de mâchoire dans l'ombre + barbe de trois jours */
  c.fillStyle = rgba(C.peauN, 0.26);
  c.beginPath();
  c.moveTo(-10.6, 6.2);
  c.quadraticCurveTo(-1, 10.4, 10.4, 6.6);
  c.quadraticCurveTo(8.4, 11.2, -2.4, 12.8);
  c.quadraticCurveTo(-9.2, 11.0, -10.6, 6.2);
  c.closePath(); c.fill();
  c.fillStyle = rgba(C.peauN, 0.16);
  c.beginPath();
  c.moveTo(-10.2, 4.0); c.quadraticCurveTo(0, 9.0, 11.4, 3.8);
  c.quadraticCurveTo(9.4, 12.0, -2.4, 12.9);
  c.quadraticCurveTo(-9.0, 11.2, -10.2, 4.0);
  c.closePath(); c.fill();

  /* --- ARCADE : le trait de caractère du visage. La saillie prend la
     lumière, et l'ombre qu'elle jette AVALE les yeux. --- */
  c.fillStyle = ecl(C.peauC, 1.04);
  c.beginPath();
  c.moveTo(-11.2, -2.4);
  c.quadraticCurveTo(0, -8.4, 12.6, -2.0);
  c.quadraticCurveTo(12.4, 0.4, 11.4, 1.4);
  c.quadraticCurveTo(0, -5.4, -10.6, -0.4);
  c.closePath(); c.fill();
  c.fillStyle = rgba(C.peauN, 0.46);
  c.beginPath();
  c.moveTo(-10.2, -0.6);
  c.quadraticCurveTo(0, -5.2, 11.6, -0.9);
  c.quadraticCurveTo(10.6, 2.8, 5.6, 2.6);
  c.quadraticCurveTo(0, 0.9, -4.8, 2.6);
  c.quadraticCurveTo(-9.4, 2.6, -10.2, -0.6);
  c.closePath(); c.fill();
  /* les deux rides de la colère, entre les sourcils */
  c.strokeStyle = rgba(C.peauN, 0.55); c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(1.2, -3.6); c.lineTo(1.8, -1.2);
  c.moveTo(3.8, -3.8); c.lineTo(4.0, -1.4);
  c.stroke();

  /* --- yeux : petits, jaunes, méchants. Ils doivent accrocher même
     quand l'unité ne fait que trois centimètres à l'écran. --- */
  var yy = 0.5;
  var mort = (v === 1);
  c.fillStyle = rgba(C.peauN, 0.42);
  c.beginPath(); c.ellipse(-4.6, 0.7, 4.0, 2.6, 0.10, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(5.8, 0.5, 4.2, 2.7, -0.10, 0, 6.2832); c.fill();
  c.fillStyle = C.oeil;
  c.beginPath(); c.ellipse(-4.6, yy, 2.7, 1.6, 0.10, 0, 6.2832); c.fill();
  c.fillStyle = mort ? C.oeilMort : C.oeil;
  c.beginPath(); c.ellipse(5.8, yy - 0.2, 2.9, 1.7, -0.10, 0, 6.2832); c.fill();
  c.fillStyle = C.pupille;
  c.beginPath(); c.ellipse(-3.8, yy + 0.1, 1.15, 1.35, 0, 0, 6.2832); c.fill();
  if(!mort){
    c.beginPath(); c.ellipse(6.7, yy - 0.1, 1.2, 1.4, 0, 0, 6.2832); c.fill();
  }else{
    c.fillStyle = "rgba(152,148,138,.9)";
    c.beginPath(); c.ellipse(6.7, yy - 0.1, 1.2, 1.4, 0, 0, 6.2832); c.fill();
  }
  c.fillStyle = "rgba(255,255,255,.78)";
  c.beginPath(); c.arc(-4.3, yy - 0.7, 0.46, 0, 6.2832); c.fill();
  if(!mort){ c.beginPath(); c.arc(6.2, yy - 0.9, 0.48, 0, 6.2832); c.fill(); }
  /* paupières lourdes tombant de l'arcade */
  c.strokeStyle = rgba(C.peauN, 0.7); c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(-7.2, -0.9); c.quadraticCurveTo(-4.4, -1.8, -1.9, -0.5);
  c.moveTo(8.8, -1.3); c.quadraticCurveTo(5.8, -2.2, 2.9, -0.8);
  c.stroke();
  /* sourcils broussailleux, cassés vers le nez : toute la colère est là */
  c.strokeStyle = "rgba(44,32,24,.92)"; c.lineWidth = 2.1;
  c.beginPath();
  c.moveTo(-9.0, -3.2); c.quadraticCurveTo(-5.0, -4.2, -1.4, -1.6);
  c.moveTo(10.6, -3.8); c.quadraticCurveTo(6.6, -4.6, 2.6, -1.8);
  c.stroke();

  /* --- nez épaté et cassé : l'arête prend la lumière, sinon il fait
     une tache sombre au milieu du visage et on croit voir un groin. */
  c.fillStyle = rgba(C.peauN, 0.20);
  c.beginPath(); c.ellipse(1.0, 2.6, 1.6, 2.6, -0.12, 0, 6.2832); c.fill();
  c.fillStyle = ecl(C.peauC, 0.99);
  c.beginPath();
  c.moveTo(2.2, -0.4);
  c.quadraticCurveTo(1.4, 2.6, 2.4, 4.4);
  c.quadraticCurveTo(4.2, 5.4, 6.0, 4.2);
  c.quadraticCurveTo(6.4, 2.0, 4.8, -0.4);
  c.closePath(); c.fill();
  c.strokeStyle = rgba(ecl(C.peauC, 1.10), 0.8); c.lineWidth = 1.1;
  c.beginPath(); c.moveTo(3.2, 0.4); c.quadraticCurveTo(4.4, 1.8, 4.2, 3.4); c.stroke();
  c.fillStyle = rgba(C.peauN, 0.28);
  c.beginPath(); c.ellipse(4.0, 5.1, 3.0, 0.9, 0.05, 0, 6.2832); c.fill();
  c.fillStyle = rgba(C.peauN, 0.82);
  c.beginPath(); c.ellipse(2.6, 4.4, 0.85, 0.55, -0.3, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(5.5, 4.5, 0.85, 0.55, 0.3, 0, 6.2832); c.fill();
  if(v === 2){
    c.strokeStyle = C.laiton; c.lineWidth = 0.95;
    c.beginPath(); c.arc(4.0, 5.6, 1.7, 0.25, 3.1); c.stroke();
  }

  /* --- bouche : large, tombante aux commissures --- */
  if(ouverte){
    /* il rugit */
    c.fillStyle = "#2a1512";
    c.beginPath();
    c.moveTo(-6.6, 7.0);
    c.quadraticCurveTo(1.4, 5.8, 9.8, 6.8);
    c.quadraticCurveTo(8.8, 12.6, 1.2, 12.4);
    c.quadraticCurveTo(-5.4, 11.8, -6.6, 7.0);
    c.closePath(); c.fill();
    c.fillStyle = C.dent;
    for(var d = 0; d < 5; d++){
      c.beginPath();
      c.moveTo(-5.4 + d * 3.2, 7.0);
      c.lineTo(-3.6 + d * 3.2, 7.1);
      c.lineTo(-4.5 + d * 3.2, 9.2);
      c.closePath(); c.fill();
    }
    c.fillStyle = "rgba(142,60,54,.9)";
    c.beginPath(); c.ellipse(1.8, 11.4, 3.6, 1.6, 0, 0, 6.2832); c.fill();
  }else{
    /* fermée : commissures plus BASSES que le milieu, sinon il sourit */
    c.strokeStyle = rgba(C.peauN, 0.88); c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(-6.2, 9.0);
    c.quadraticCurveTo(1.6, 6.4, 9.6, 7.8);
    c.stroke();
    c.fillStyle = rgba(ecl(C.peauC, 1.02), 0.4);
    c.beginPath();
    c.moveTo(-5.4, 9.4); c.quadraticCurveTo(1.6, 7.4, 9.0, 8.4);
    c.quadraticCurveTo(2.0, 10.6, -5.4, 9.4);
    c.closePath(); c.fill();
    /* deux dents du bas qui dépassent de la lèvre */
    c.fillStyle = rgba(C.dent, 0.85);
    c.beginPath();
    c.moveTo(-1.4, 9.6); c.lineTo(0.4, 9.5); c.lineTo(-0.4, 7.8); c.closePath(); c.fill();
    c.beginPath();
    c.moveTo(2.2, 9.2); c.lineTo(4.0, 9.1); c.lineTo(3.2, 7.5); c.closePath(); c.fill();
  }
  /* les défenses — courtes, plantées aux commissures, jamais des
     lames blanches qui barrent les joues */
  c.fillStyle = C.dent;
  c.beginPath();
  c.moveTo(-6.6, 11.2); c.quadraticCurveTo(-7.0, 8.0, -5.6, 6.0);
  c.quadraticCurveTo(-4.6, 8.2, -4.4, 11.0);
  c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(9.9, 10.2); c.quadraticCurveTo(10.4, 6.8, 9.0, 5.0);
  c.quadraticCurveTo(7.9, 7.2, 7.9, 10.0);
  c.closePath(); c.fill();
  /* ombre à la racine : la défense sort de la gencive, elle n'est pas collée */
  c.fillStyle = rgba(C.peauN, 0.4);
  c.beginPath(); c.ellipse(-5.5, 11.0, 1.5, 0.8, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(8.9, 10.0, 1.4, 0.8, 0, 0, 6.2832); c.fill();
  c.fillStyle = rgba(C.dentO, 0.5);
  c.beginPath();
  c.moveTo(-5.7, 6.6); c.lineTo(-4.8, 8.6); c.lineTo(-6.4, 8.6); c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(8.9, 5.6); c.lineTo(9.8, 7.6); c.lineTo(8.2, 7.6); c.closePath(); c.fill();
  if(v === 2){
    /* défenses coiffées de laiton */
    c.fillStyle = C.laiton;
    c.beginPath();
    c.moveTo(-6.0, 6.4); c.lineTo(-5.2, 6.0); c.lineTo(-4.6, 7.6); c.lineTo(-6.2, 7.9);
    c.closePath(); c.fill();
    c.beginPath();
    c.moveTo(9.4, 5.4); c.lineTo(10.2, 5.9); c.lineTo(9.5, 7.5); c.lineTo(8.5, 7.0);
    c.closePath(); c.fill();
  }

  /* --- cicatrices du visage --- */
  if(v === 1){
    /* la balafre qui lui a coûté l'œil */
    c.strokeStyle = "rgba(214,172,152,.9)"; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(10.6, -6.0); c.lineTo(3.0, 8.4); c.stroke();
    c.lineWidth = 0.85;
    for(var s = 0; s < 4; s++){
      var ts = 0.15 + s * 0.24;
      var sx = 10.6 + (3.0 - 10.6) * ts, sy = -6.0 + (8.4 + 6.0) * ts;
      c.beginPath(); c.moveTo(sx - 1.8, sy - 0.85); c.lineTo(sx + 1.8, sy + 0.85); c.stroke();
    }
  }else if(v === 0){
    c.strokeStyle = "rgba(208,164,142,.8)"; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(-9.2, -4.6); c.quadraticCurveTo(-6.4, 0.5, -8.0, 5.4); c.stroke();
    /* peinture de guerre : deux bandes noires sur les joues */
    c.fillStyle = "rgba(22,16,18,.55)";
    c.beginPath();
    c.moveTo(-9.4, 2.0); c.lineTo(-6.2, 1.4); c.lineTo(-7.4, 8.4); c.lineTo(-10.2, 7.0);
    c.closePath(); c.fill();
    c.beginPath();
    c.moveTo(11.6, 1.2); c.lineTo(8.6, 0.8); c.lineTo(9.6, 7.2); c.lineTo(12.2, 5.6);
    c.closePath(); c.fill();
  }else{
    c.strokeStyle = "rgba(208,164,142,.75)"; c.lineWidth = 1.2;
    for(var g2 = 0; g2 < 3; g2++){
      c.beginPath();
      c.moveTo(7.4 + g2 * 1.7, 0.6 + g2 * 0.4);
      c.quadraticCurveTo(10.0 + g2 * 1.4, 4.6, 7.8 + g2 * 1.2, 8.4);
      c.stroke();
    }
  }

  /* --- crâne rasé, coutures, bandeau de fer --- */
  c.fillStyle = rgba(C.peauN, 0.16);
  c.beginPath(); c.ellipse(-1.4, -8.6, 8.0, 3.2, -0.14, 0, 6.2832); c.fill();
  c.strokeStyle = rgba(C.peauN, 0.4); c.lineWidth = 1.0;
  c.beginPath(); c.moveTo(-6.4, -10.4); c.quadraticCurveTo(-3.0, -8.2, -5.0, -5.8); c.stroke();
  c.fillStyle = degCache(c, "ogreBandeau", function(){
    var g = c.createLinearGradient(-11, -10, 12, -2);
    g.addColorStop(0, C.ferC); g.addColorStop(0.5, C.fer); g.addColorStop(1, C.ferO);
    return g;
  });
  c.beginPath();
  c.moveTo(-11.2, -2.8);
  c.quadraticCurveTo(0, -9.4, 12.5, -2.6);
  c.lineTo(12.1, -5.4);
  c.quadraticCurveTo(0, -12.0, -11.0, -5.8);
  c.closePath(); c.fill();
  c.fillStyle = C.ferC;
  c.beginPath(); c.arc(-8.0, -5.6, 0.9, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(0.2, -8.3, 0.9, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(9.2, -5.1, 0.9, 0, 6.2832); c.fill();
  c.fillStyle = rgba(C.rouille, 0.35);
  c.fillRect(3.2, -7.9, 1.8, 4.4);
  c.strokeStyle = "rgba(255,255,255,.30)"; c.lineWidth = 1.0;
  c.beginPath(); c.moveTo(-8.8, -6.5); c.quadraticCurveTo(-2.0, -10.3, 4.4, -8.5); c.stroke();
  /* une seule jugulaire, plaquée sur l'arrière : deux courroies
     encadraient le visage et lui donnaient une tête de singe */
  c.strokeStyle = rgba(C.cuirO, 0.75); c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(-10.6, -3.4); c.quadraticCurveTo(-11.0, 5.0, -6.0, 10.4);
  c.stroke();
  if(v === 0){
    /* nasal tordu qui pend du bandeau */
    c.fillStyle = C.fer;
    c.beginPath();
    c.moveTo(2.2, -4.6); c.lineTo(4.8, -4.8); c.lineTo(5.4, 0.4); c.lineTo(3.0, 0.2);
    c.closePath(); c.fill();
  }
  if(v === 1){
    /* chiffon noué sur le bandeau, il flotte un peu */
    c.fillStyle = C.cape;
    c.beginPath();
    c.moveTo(-10.4, -5.2);
    c.quadraticCurveTo(-16.4, -3.6, -19.6, 1.2);
    c.quadraticCurveTo(-14.6, 0.0, -13.2, 2.4);
    c.quadraticCurveTo(-12.2, -1.8, -9.4, -2.4);
    c.closePath(); c.fill();
  }

  /* petite natte dans la nuque : présente sur toutes les variantes,
     la silhouette de la tête doit rester identique partout */
  c.strokeStyle = "rgba(40,30,22,.92)"; c.lineWidth = 2.6;
  c.beginPath();
  c.moveTo(-10.4, -3.8);
  c.quadraticCurveTo(-14.8, 1.0 + Math.sin(phase) * 0.5, -13.4, 6.6);
  c.stroke();
  c.strokeStyle = C.cuirO; c.lineWidth = 1.0;
  c.beginPath(); c.moveTo(-14.4, 2.4); c.lineTo(-12.2, 3.0); c.stroke();
}

/* La tête posée sur le corps. */
function teteOgre(c, hx, hy, v, tir, phase){
  c.save();
  c.translate(hx, hy);
  visageOgre(c, v, tir, phase);
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
  c.translate(-40, 82); c.rotate(0.28);
  dessineHacheOgre(c, 64, 2.9, 0, false);
  c.restore();

  /* --- épaules et trapèzes : ils sortent du cadre --- */
  var gp = c.createLinearGradient(-36, 30, 30, 84);
  gp.addColorStop(0, ecl(C.peauC, 1.05)); gp.addColorStop(0.42, C.peau); gp.addColorStop(1, C.peauO);
  c.fillStyle = gp;
  c.beginPath();
  c.moveTo(-74, 90);
  c.bezierCurveTo(-72, 58, -50, 38, -24, 31);   /* trapèze gauche */
  c.bezierCurveTo(-12, 28, 12, 28, 24, 31);
  c.bezierCurveTo(50, 38, 72, 58, 74, 90);
  c.closePath(); c.fill();
  c.fillStyle = rgba(C.peauN, 0.30);
  c.beginPath();
  c.moveTo(-22, 33); c.bezierCurveTo(-10, 44, 10, 44, 22, 33);
  c.bezierCurveTo(10, 52, -10, 52, -22, 33);
  c.closePath(); c.fill();
  c.fillStyle = rgba(C.tache, 0.28);
  c.beginPath(); c.ellipse(46, 64, 8, 11, 0, 0, 6.2832); c.fill();
  /* griffures sur l'épaule droite */
  c.strokeStyle = "rgba(206,158,136,.72)"; c.lineWidth = 2.0;
  for(var k = 0; k < 3; k++){
    c.beginPath();
    c.moveTo(33 + k * 8, 46 + k * 2);
    c.quadraticCurveTo(43 + k * 8, 60, 36 + k * 7, 78);
    c.stroke();
  }

  /* --- fourrure : crinière derrière la nuque et dépouille sur la
     seule épaule gauche, comme sur le terrain --- */
  var gf = c.createLinearGradient(-50, 34, 10, 86);
  gf.addColorStop(0, C.fourrureC); gf.addColorStop(0.4, C.fourrure); gf.addColorStop(1, C.fourrureO);
  c.fillStyle = gf;
  c.beginPath();
  c.moveTo(-40, 28);
  c.bezierCurveTo(-24, 16, 24, 16, 40, 28);
  bordPoiluOgre(c, [[40, 28], [28, 20], [12, 15], [-4, 14], [-22, 18], [-40, 28]], 5.0);
  c.closePath(); c.fill();
  c.fillStyle = gf;
  c.beginPath();
  c.moveTo(-82, 96);
  c.bezierCurveTo(-78, 56, -54, 34, -26, 27);
  c.bezierCurveTo(-16, 25, -6, 26, 0, 30);
  bordPoiluOgre(c, [[0, 30], [-8, 44], [-20, 56], [-34, 68], [-46, 80], [-56, 96]], 7.0);
  c.closePath(); c.fill();
  c.strokeStyle = rgba(C.fourrureC, 0.5); c.lineWidth = 2.0;
  var me = [[-66, 60, -62, 92], [-58, 48, -52, 82], [-48, 38, -42, 72],
            [-38, 32, -32, 62], [-28, 28, -22, 52], [-18, 26, -14, 44],
            [-8, 26, -6, 38], [10, 20, 12, 30], [24, 22, 26, 32], [-2, 18, 0, 28]];
  for(var m = 0; m < me.length; m++){
    c.beginPath();
    c.moveTo(me[m][0], me[m][1]);
    c.quadraticCurveTo(me[m][0] + 4, (me[m][1] + me[m][3]) / 2, me[m][2], me[m][3]);
    c.stroke();
  }

  /* --- épaulière de fer, à gauche du cadre --- */
  var ge = c.createLinearGradient(-66, 32, -22, 76);
  ge.addColorStop(0, ecl(C.ferC, 1.06)); ge.addColorStop(0.45, C.fer); ge.addColorStop(1, C.ferO);
  c.fillStyle = ge;
  var lam = [[46, 56], [58, 70], [70, 86]];
  for(var a = 0; a < 3; a++){
    c.beginPath();
    c.moveTo(-78, lam[a][0]);
    c.bezierCurveTo(-60, lam[a][0] - 16, -36, lam[a][0] - 9, -27, lam[a][0] + 4);
    c.lineTo(-31, lam[a][1]);
    c.bezierCurveTo(-46, lam[a][1] - 4, -64, lam[a][1] + 2, -78, lam[a][1]);
    c.closePath(); c.fill();
    c.strokeStyle = rgba(C.ferO, 0.85); c.lineWidth = 1.7; c.stroke();
  }
  c.fillStyle = C.ferC;
  c.beginPath(); c.arc(-60, 49, 2.6, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(-43, 52, 2.6, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(-58, 64, 2.6, 0, 6.2832); c.fill();
  c.fillStyle = rgba(C.rouille, 0.35);
  c.beginPath();
  c.moveTo(-50, 38); c.lineTo(-44, 38); c.lineTo(-46, 82); c.lineTo(-52, 82);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(255,255,255,.30)"; c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(-68, 44); c.quadraticCurveTo(-48, 32, -33, 44); c.stroke();
  c.fillStyle = C.fer;
  c.beginPath();
  c.moveTo(-58, 42); c.lineTo(-52, 22); c.lineTo(-46, 42); c.closePath(); c.fill();
  c.strokeStyle = C.ferO; c.lineWidth = 1.2; c.stroke();

  /* --- LA TÊTE, très grande dans le cadre : c'est EXACTEMENT le
     visage du terrain, seulement grossi. Une tuile de briefing qui
     ne ressemble pas à l'unité qu'on envoie est un mensonge. --- */
  c.save();
  c.translate(0, 30);
  c.scale(2.28, 2.28);
  visageOgre(c, 2, true, 0);
  c.restore();

  c.restore();
  vignettePortrait(c, H);
}
