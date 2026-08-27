/* ================================================================
   MILY DANS LA JUNGLE — LA FLORE
   ================================================================
   Le piège de la carte jungle, c'est de reprendre l'île telle quelle
   et de repeindre le sol en vert. On obtient alors une plage verte,
   pas une jungle. Ce qui fait la jungle, c'est trois choses, et
   aucune n'est une couleur :

   1. L'ÉCHELLE. Un arbre de jungle ne fait pas la taille d'un sapin
      de la carte forêt (46 unités) : il écrase le Mirador (126,
      mesuré sur son sprite) et monte, selon la variante et la
      taille, de 261 à 372. On lève les yeux, et c'est ça qui dit
      « je ne suis plus au même endroit ». Une seule famille de
      décor change donc radicalement de gabarit, et tout le reste
      s'organise sous elle.
   2. LES ÉTAGES. Une forêt tempérée a deux niveaux : le sol et les
      arbres. Une jungle en a cinq — tapis de petites plantes,
      fougères et hautes herbes, buissons et plantes tropicales,
      sous-bois de lianes et de racines, canopée. C'est
      l'empilement qui donne l'impression d'épaisseur, pas la
      densité d'une seule couche.
   3. LE CONTRASTE. La terre du biome est presque noire (#25381f) ;
      si les feuillages restent dans les mêmes valeurs, tout se
      noie en une bouillie sombre. La rampe de verts va donc de
      #12240f (ombre profonde sous la canopée) à #8fd66b (feuille
      prise par une trouée de lumière), soit un rapport de
      luminance de 1 à 6. Et quelques accents non verts — fleur
      rouge, fruit orange, tige violacée, champignon — parce qu'un
      tableau entièrement vert n'a plus de point d'accroche.

   RÈGLE ABSOLUE DE LISIBILITÉ. La jungle ne cache jamais le jeu.
   Deux verrous, appliqués tous les deux :
     — la couronne des grands arbres est montée sur un calque à part
       puis reposée d'un seul coup à 0,72 d'opacité. Reposée feuille
       par feuille, deux cents feuilles à 0,72 finissent par
       redevenir opaques ; en un seul blit, 0,72 reste 0,72 et on
       devine toujours ce qu'il y a dessous.
     — entre 0 et −40 en local — la bande où vivent les troupes
       (Meuf ≈ 36) et les socles de tourelles (Crible 57) — rien
       d'opaque que le tronc, et le tronc y reste étroit. Les
       contreforts s'évasent, mais ils s'évasent BAS, et les racines
       traçantes rampent sur une ellipse écrasée au lieu de suivre
       l'isométrie franche. Balayage d'alphas sur les douze sprites
       d'arbre, demi-largeur OPAQUE maximale par palier :
         au sol 48, à −6 46, à −12 29, à −18 25, et 26 au plus
         jusqu'à −60.
       Autrement dit : au-dessus des chevilles, le plus gros arbre de
       la carte n'occupe jamais plus de cinquante unités de large,
       soit moins d'une case. Les lianes, elles, s'arrêtent à −70 —
       au-dessus du Crible.

   RENDU. Comme le reste du décor (30-terrain.js), tout est
   PRÉ-RENDU une fois au démarrage : le coût par image est un blit,
   pas un tracé. Ce qui compte donc n'est pas le nombre de courbes
   mais le NOMBRE DE SPRITES. La banque en compte 56 et pèse
   5,5 Mo mesurés ; chaque sprite est détouré à sa boîte d'alphas
   avant d'être gardé — un grand arbre n'occupe que la moitié de son
   cadre, et garder le cadre entier coûterait le double pour du vide.
   Au banc, mille sprites de flore posés à l'écran coûtent une
   milliseconde par image : c'est un blit, pas un dessin.

   Repère local : (0,0) au sol, Y négatifs vers le haut, une unité
   locale ≈ un pixel à zoom 1. Comme pour les SOCLES, iso(gx,gy) est
   utilisable pour tout ce qui se pose à plat sur le sol.
   ================================================================ */

/* ----------------------------------------------------------------
   LA RAMPE DE VERTS
   Sept étapes interpolées en vingt-quatre paliers. Les couleurs sont
   calculées une fois : les feuilles se comptent par milliers au
   moment de la construction des sprites, et melange() reparse de
   l'hexadécimal à chaque appel.
   ---------------------------------------------------------------- */
var VJ = {
  nuit:   "#12240f",       // sous la canopée, là où le jour ne descend pas
  ombre:  "#1a3318",
  fonce:  "#255022",
  moyen:  "#3f7a34",
  clair:  "#5da341",
  vif:    "#74c24d",
  soleil: "#8fd66b",       // feuille dans une trouée
  pousse: "#b9e06a",       // jeune feuille, presque jaune
  ecorceO:"#1e1610",       // bois de bout, le noir de l'écorce
  ecorce: "#463526",
  ecorceC:"#6e5840",
  pale:   "#9a8f76",       // fromager et bois mort : écorce claire
  paleO:  "#6a6152",
  mousse: "#4e7a34",
  mousseC:"#84b551",
  terre:  "#231b11",
  boue:   "#3a2f1e",
  roche:  "#4e5450",
  rocheO: "#2b302e",
  rocheC: "#8c9490",
  fleur:  "#e8443a",       // héliconia, hibiscus
  fleurC: "#ff8a72",
  fruit:  "#f08a1e",       // régime de fruits, champignons
  violet: "#7c4a92",       // tiges et bractées violacées
  eau:    "#2b6a5e"        // flaque, suintement
};
var RAMPE_J = null;
function vertJ(t){
  if(!RAMPE_J){
    var e = [VJ.nuit, VJ.ombre, VJ.fonce, VJ.moyen, VJ.clair, VJ.vif, VJ.soleil];
    RAMPE_J = [];
    for(var i = 0; i < 24; i++){
      var u = i / 23 * (e.length - 1);
      var k = Math.min(e.length - 2, Math.floor(u));
      RAMPE_J.push(melange(e[k], e[k + 1], u - k));
    }
  }
  return RAMPE_J[borne(Math.round(t * 23), 0, 23) | 0];
}

/* ----------------------------------------------------------------
   CADRES DE SPRITE
   Le cadre du décor existant (SD : 128×132, 104 vers le haut) ne
   contient pas un arbre de jungle — d'où un cadre propre, très haut
   et étroit, pour les arbres et les lianes, et un cadre moyen pour
   tout le sous-bois. Les deux sont détourés après coup, donc être
   large ici ne coûte rien d'autre qu'un peu de temps au démarrage.
   ---------------------------------------------------------------- */
var SJ_W = 300, SJ_H = 420, SJ_OX = 150, SJ_OY = 380, SJ_ECH = 1.15;
var SF_W = 220, SF_H = 230, SF_OX = 110, SF_OY = 196, SF_ECH = 1.15;

/* ================================================================
   PRIMITIVES VÉGÉTALES
   ================================================================ */

/* Le calque semi-transparent. Voir l'entête : c'est le premier des
   deux verrous de lisibilité. On recopie la transformation courante
   pour que le dessin déposé tombe exactement au même endroit. */
function jCalque(c, alpha, dessin){
  var cv = nouveauCanvas(c.canvas.width, c.canvas.height);
  var g = cv.getContext("2d");
  var m = c.getTransform();
  g.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
  dessin(g);
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = alpha;
  c.drawImage(cv, 0, 0);
  c.restore();
}

/* Une feuille simple : deux arcs qui se rejoignent en pointe aux
   deux bouts. L'ellipse serait plus rapide à écrire, mais au zoom de
   jeu (z ≈ 0,5 à 0,9) une masse d'ellipses fait une éponge ; ce sont
   les pointes qui donnent au feuillage son grain de végétal. */
function jFeuille(c, x, y, L, W, a, coul){
  var ca = Math.cos(a), sa = Math.sin(a);
  var mx = x + ca * L * 0.42, my = y + sa * L * 0.42;
  var nx = -sa * W, ny = ca * W;
  c.fillStyle = coul;
  c.beginPath();
  c.moveTo(x, y);
  c.quadraticCurveTo(mx + nx, my + ny, x + ca * L, y + sa * L);
  c.quadraticCurveTo(mx - nx, my - ny, x, y);
  c.fill();
}

/* Un brin : lame effilée qui part droite et se couche au bout. Sert
   aux hautes herbes et aux bambous. `pli` est la retombée de la
   pointe — c'est elle qui empêche la touffe de ressembler à un
   hérisson. */
function jBrin(c, x, y, h, dx, ep, coul, pli){
  var tx = x + dx, ty = y - h;
  var cx = x + dx * 0.18, cy = y - h * 0.72;
  c.fillStyle = coul;
  c.beginPath();
  c.moveTo(x - ep, y);
  c.quadraticCurveTo(cx - ep * 0.6, cy, tx + (pli || 0), ty);
  c.quadraticCurveTo(cx + ep * 0.6, cy, x + ep, y);
  c.closePath();
  c.fill();
}

/* Une fronde pennée : rachis courbe, pennes de part et d'autre qui
   raccourcissent aux deux bouts. Sans ce raccourcissement la fronde
   a l'air d'un peigne ; avec, elle a l'air d'une fougère. */
function jFronde(c, x, y, ang, L, larg, n, cSombre, cClair, arc){
  var i, t, u, px, py, nx, ny, lp, ca, sa;
  var ex = x + Math.cos(ang) * L, ey = y + Math.sin(ang) * L;
  var cxq = x + Math.cos(ang) * L * 0.5 - Math.sin(ang) * arc;
  var cyq = y + Math.sin(ang) * L * 0.5 + Math.cos(ang) * arc;
  /* le rachis d'abord : il doit rester visible entre les pennes */
  c.strokeStyle = cSombre; c.lineWidth = Math.max(0.8, L * 0.022); c.lineCap = "round";
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(cxq, cyq, ex, ey); c.stroke();
  for(i = 1; i <= n; i++){
    t = i / (n + 1); u = 1 - t;
    px = u * u * x + 2 * u * t * cxq + t * t * ex;
    py = u * u * y + 2 * u * t * cyq + t * t * ey;
    /* tangente de la quadratique, pour poser les pennes d'équerre */
    nx = 2 * (u * (cxq - x) + t * (ex - cxq));
    ny = 2 * (u * (cyq - y) + t * (ey - cyq));
    var l = Math.hypot(nx, ny) || 1;
    ca = nx / l; sa = ny / l;
    lp = larg * Math.sin(Math.pow(t, 0.62) * 3.1416) * (1 - t * 0.25);
    /* penne du dessus plus claire que penne du dessous : c'est le
       seul modelé possible sur une forme aussi fine */
    jFeuille(c, px, py, lp, lp * 0.30, Math.atan2(sa, ca) - 1.05, cClair);
    jFeuille(c, px, py, lp * 0.94, lp * 0.28, Math.atan2(sa, ca) + 1.05, cSombre);
  }
}

/* Une feuille large « en pagaie » — bananier, philodendron, taro.
   Le contour est échantillonné le long d'une nervure courbe, et à
   chaque « fente » la demi-largeur retombe presque à zéro : c'est
   exactement ce que le vent fait d'un bananier, et c'est aussi ce
   qui empêche la feuille de ressembler à une palette de peintre.
   `trous` perce la feuille (monstera) : les percements sont des
   sous-tracés du MÊME chemin, remplis en pair-impair — un seul
   fill(), aucune composition à effacer. */
function jPagaie(c, x, y, ang, L, W, arc, fentes, trous, c1, c2, graine){
  var al = prng(graine || 91), i, t, u, px, py, tx2, ty2, l, dw;
  var n = 26;
  var ex = x + Math.cos(ang) * L, ey = y + Math.sin(ang) * L;
  var cxq = x + Math.cos(ang) * L * 0.5 - Math.sin(ang) * arc;
  var cyq = y + Math.sin(ang) * L * 0.5 + Math.cos(ang) * arc;
  var gauche = [], droite = [], axe = [];
  for(i = 0; i <= n; i++){
    t = i / n; u = 1 - t;
    px = u * u * x + 2 * u * t * cxq + t * t * ex;
    py = u * u * y + 2 * u * t * cyq + t * t * ey;
    tx2 = 2 * (u * (cxq - x) + t * (ex - cxq));
    ty2 = 2 * (u * (cyq - y) + t * (ey - cyq));
    l = Math.hypot(tx2, ty2) || 1;
    dw = W * Math.pow(Math.sin(Math.pow(t, 0.78) * 3.1416), 0.72);
    /* les déchirures : une seule échantillon pincé suffit à ouvrir
       un V net, deux de suite feraient une encoche molle */
    if(fentes && i > 3 && i < n - 2 && (i % fentes) === 0) dw *= 0.16;
    axe.push({ x:px, y:py });
    gauche.push({ x:px - ty2 / l * dw, y:py + tx2 / l * dw });
    droite.push({ x:px + ty2 / l * dw, y:py - tx2 / l * dw });
  }
  c.fillStyle = c1;
  c.beginPath();
  c.moveTo(gauche[0].x, gauche[0].y);
  for(i = 1; i <= n; i++) c.lineTo(gauche[i].x, gauche[i].y);
  for(i = n; i >= 0; i--) c.lineTo(droite[i].x, droite[i].y);
  c.closePath();
  if(trous){
    for(i = 0; i < trous; i++){
      var k = 5 + Math.floor(al() * (n - 12));
      var cote = al() < 0.5 ? gauche : droite;
      var hx = axe[k].x + (cote[k].x - axe[k].x) * (0.34 + al() * 0.34);
      var hy = axe[k].y + (cote[k].y - axe[k].y) * (0.34 + al() * 0.34);
      var hr = W * (0.13 + al() * 0.13);
      c.moveTo(hx + hr, hy);
      c.ellipse(hx, hy, hr, hr * 0.52, ang + 1.57, 0, 6.2832);
    }
    c.fill("evenodd");
  }else c.fill();
  /* nervure principale et nervures secondaires : deux traits, et la
     feuille cesse d'être une tache pour devenir une feuille */
  c.strokeStyle = c2; c.lineWidth = Math.max(0.7, L * 0.020); c.lineCap = "round";
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(cxq, cyq, ex, ey); c.stroke();
  c.lineWidth = Math.max(0.5, L * 0.010);
  c.beginPath();
  for(i = 3; i < n - 1; i += 3){
    c.moveTo(axe[i].x, axe[i].y);
    c.lineTo(gauche[i + 1] ? gauche[i + 1].x : gauche[i].x, gauche[i + 1] ? gauche[i + 1].y : gauche[i].y);
    c.moveTo(axe[i].x, axe[i].y);
    c.lineTo(droite[i + 1] ? droite[i + 1].x : droite[i].x, droite[i + 1] ? droite[i + 1].y : droite[i].y);
  }
  c.stroke();
}

/* Épine dorsale d'un tronc. Les points sont gardés parce qu'ils
   servent trois fois — remplissage, ombrage, écorce — et qu'un
   recalcul de plus, c'est un tracé de plus.
   Le profil de largeur en t^0,55 fait perdre au tronc une bonne part
   de son épaisseur dans le premier quart, puis presque plus rien :
   c'est ce qui donne un pied massif, un fût qui reste GROS sur toute
   sa hauteur — le cahier des charges demande de grands troncs — et
   pourtant une demi-largeur qui redescend sous 20 dès −40, dans la
   bande où circulent les troupes. */
function jEpine(x0, y0, cx, cy, x1, y1, w0, w1, n){
  var pts = [], i, t, u;
  for(i = 0; i <= n; i++){
    t = i / n; u = 1 - t;
    pts.push({
      x: u * u * x0 + 2 * u * t * cx + t * t * x1,
      y: u * u * y0 + 2 * u * t * cy + t * t * y1,
      w: w0 + (w1 - w0) * Math.pow(t, 0.55)
    });
  }
  return pts;
}
function jTraceFut(c, pts){
  var i, n = pts.length;
  c.beginPath();
  c.moveTo(pts[0].x - pts[0].w, pts[0].y);
  for(i = 1; i < n; i++) c.lineTo(pts[i].x - pts[i].w, pts[i].y);
  for(i = n - 1; i >= 0; i--) c.lineTo(pts[i].x + pts[i].w, pts[i].y);
  c.closePath();
}

/* L'écorce. Le fût est rempli à plat, puis on découpe dedans :
   un liseré clair sur l'arête gauche (la lumière des volumes ronds
   du jeu vient de la gauche de l'écran, comme dans cylindre() et
   sphere()), une joue sombre à droite, des cannelures verticales,
   et de la mousse en bas — parce qu'en jungle tout ce qui ne bouge
   pas est colonisé dans les six mois.
   `style` : 0 crevassée, 1 lisse et pâle, 2 tressée, 3 morte. */
function jEcorce(c, pts, base, style, graine, mousse){
  var al = prng(graine || 13), i, t, p, k;
  var n = pts.length - 1;
  var haut = pts[0].y - pts[n].y;
  c.save();
  jTraceFut(c, pts);
  c.fillStyle = base;
  c.fill();
  c.clip();
  /* Modelé cylindrique : clair à gauche, sombre à droite, comme
     cylindre() et sphere() dans 20-outils.js.
     Les deux joues sont des POLYGONES qui suivent le fût, et non des
     rectangles empilés. Empilés, leurs bords formaient un escalier —
     le tronc du fromager portait alors, vu de loin, des barreaux
     d'échelle bien réguliers, et il ressemblait à un poteau de
     béton avec ses échelons. Un seul tracé continu, et le galbe
     redevient lisse. */
  function joue(a, b, coul){
    c.fillStyle = coul;
    c.beginPath();
    for(i = 0; i <= n; i++){ p = pts[i]; if(i === 0) c.moveTo(p.x + p.w * a, p.y); else c.lineTo(p.x + p.w * a, p.y); }
    for(i = n; i >= 0; i--){ p = pts[i]; c.lineTo(p.x + p.w * b, p.y); }
    c.closePath(); c.fill();
  }
  joue(0.16, 1.10, rgba(VJ.ecorceO, 0.42));
  joue(0.52, 1.10, rgba(VJ.ecorceO, 0.30));
  joue(-1.10, -0.70, "rgba(255,246,225,.14)");
  /* cannelures : leur nombre suit la largeur, sinon un gros tronc a
     l'air d'un petit tronc agrandi. Elles sont peu nombreuses et
     très discrètes — la première version en traçait deux fois plus
     et deux fois plus contrastées, et les troncs prenaient un air
     de vannerie. */
  if(style !== 1){
    var nc = Math.round(pts[0].w * 0.45) + 2;
    for(k = 0; k < nc; k++){
      var fx = (al() * 2 - 1);
      c.strokeStyle = al() < 0.55 ? rgba(VJ.ecorceO, 0.30) : "rgba(255,240,210,.055)";
      c.lineWidth = 0.7 + al() * (style === 2 ? 2.6 : 1.1);
      c.beginPath();
      for(i = 0; i <= n; i += 2){
        p = pts[i];
        var ox = fx * p.w * 0.86 + Math.sin(i * 0.7 + k) * p.w * 0.12;
        if(i === 0) c.moveTo(p.x + ox, p.y); else c.lineTo(p.x + ox, p.y);
      }
      c.stroke();
    }
  }
  if(style === 1){
    /* Fromager : écorce lisse et pâle, hérissée d'épines coniques.
       Première version : vingt-six épines tirées à ±0,82 de la
       demi-largeur, donc toutes groupées au MILIEU du fût — de loin,
       on voyait une colonne de béton avec des barreaux d'échelle.
       Elles sont maintenant réparties sur toute la largeur, plus
       petites et plus discrètes, et quatre longues nervures
       verticales très douces suffisent à donner le galbe. */
    for(k = 0; k < 34; k++){
      t = al(); p = pts[Math.floor(t * n)];
      var sx = p.x + (al() * 2 - 1) * p.w * 1.02;
      c.fillStyle = rgba(VJ.paleO, 0.32 + al() * 0.3);
      c.beginPath();
      c.moveTo(sx - 1.1, p.y); c.lineTo(sx + (al() - 0.5), p.y - 2.6); c.lineTo(sx + 1.1, p.y);
      c.closePath(); c.fill();
    }
    for(k = 0; k < 4; k++){
      var fx2 = (al() * 2 - 1) * 0.8;
      c.strokeStyle = k % 2 ? "rgba(255,248,228,.07)" : rgba(VJ.paleO, 0.16);
      c.lineWidth = 2 + al() * 4;
      c.beginPath();
      for(i = 0; i <= n; i += 3){
        p = pts[i];
        if(i === 0) c.moveTo(p.x + fx2 * p.w, p.y); else c.lineTo(p.x + fx2 * p.w, p.y);
      }
      c.stroke();
    }
  }
  if(style === 3){
    /* bois mort : le gris se fend, et la fente est noire */
    c.strokeStyle = rgba(VJ.ecorceO, 0.72);
    for(k = 0; k < 7; k++){
      t = al() * 0.8; p = pts[Math.floor(t * n)];
      c.lineWidth = 1 + al() * 1.8;
      c.beginPath();
      c.moveTo(p.x + (al() * 2 - 1) * p.w * 0.7, p.y);
      c.lineTo(p.x + (al() * 2 - 1) * p.w * 0.7, p.y - haut * (0.06 + al() * 0.14));
      c.stroke();
    }
  }
  /* la mousse ne monte que sur le premier tiers, et par plaques
     ÉTROITES et verticales : la première version, en grosses taches
     rondes, transformait le tronc en tenue de camouflage. Une mousse
     de tronc suit les cannelures, elle ne fait pas des pois. */
  if(mousse){
    for(k = 0; k < 24; k++){
      t = Math.pow(al(), 1.8) * 0.5;
      p = pts[Math.floor(t * n)];
      c.fillStyle = rgba(al() < 0.6 ? VJ.fonce : VJ.mousse, 0.22 + al() * 0.24);
      c.beginPath();
      c.ellipse(p.x + (al() * 2 - 1) * p.w * 0.9, p.y, 1.4 + al() * p.w * 0.22,
                2.6 + al() * 6, 0, 0, 6.2832);
      c.fill();
    }
  }
  c.restore();
  /* liseré de lumière hors clip : il doit border le tronc, pas être
     rogné par lui */
  c.strokeStyle = "rgba(214,236,190,.20)"; c.lineWidth = 1.1;
  c.beginPath();
  for(i = 0; i <= n; i++){ p = pts[i]; if(i === 0) c.moveTo(p.x - p.w, p.y); else c.lineTo(p.x - p.w, p.y); }
  c.stroke();
}

/* Un contrefort. C'est la pièce la plus délicate du fichier : elle
   doit dire « ce tronc pèse quarante tonnes » sans encombrer la
   bande des troupes. D'où une arête extérieure très cambrée — point
   de contrôle à 0,24 de la largeur, hauteur plafonnée à 32 — qui
   n'atteint sa largeur maximale qu'à ras de terre, là où elle ne
   cache que des pieds : elle est déjà revenue sous vingt unités
   d'écart à −18, et sous dix à −24.
   `cote` vaut −1 (gauche) ou +1 (droite). */
function jContrefort(c, cote, larg, haut, base, ombre){
  var x = cote * larg;
  c.fillStyle = base;
  c.beginPath();
  c.moveTo(0, -haut);
  c.quadraticCurveTo(x * 0.24, -haut * 0.55, x, 1.5);
  c.lineTo(x * 0.42, 3.2);
  c.quadraticCurveTo(x * 0.08, -haut * 0.42, 0, -haut);
  c.closePath(); c.fill();
  /* la tranche : sans elle l'aileron est une découpe de papier */
  c.fillStyle = ombre;
  c.beginPath();
  c.moveTo(x * 0.42, 3.2);
  c.lineTo(x, 1.5);
  c.lineTo(x * 0.96, 4.4);
  c.lineTo(x * 0.40, 5.6);
  c.closePath(); c.fill();
}

/* Une liane : câble qui pend, avec sa dérive et son enroulement du
   bout. Trois passes — noyau sombre, corps, filet de lumière —
   parce qu'un trait d'une seule couleur reste une ficelle. */
function jCorde(c, x, yHaut, yBas, derive, ep, c1, c2, boucle){
  var cx = x + derive, cy = (yHaut + yBas) * 0.5;
  var bx = x + derive * 0.35;
  c.lineCap = "round"; c.lineJoin = "round";
  c.strokeStyle = c1; c.lineWidth = ep + 1.3;
  c.beginPath(); c.moveTo(x, yHaut); c.quadraticCurveTo(cx, cy, bx, yBas); c.stroke();
  c.strokeStyle = c2; c.lineWidth = ep;
  c.beginPath(); c.moveTo(x, yHaut); c.quadraticCurveTo(cx, cy, bx, yBas); c.stroke();
  c.strokeStyle = "rgba(226,244,200,.16)"; c.lineWidth = Math.max(0.6, ep * 0.34);
  c.beginPath(); c.moveTo(x - ep * 0.3, yHaut); c.quadraticCurveTo(cx - ep * 0.3, cy, bx - ep * 0.3, yBas); c.stroke();
  if(boucle){
    c.strokeStyle = c2; c.lineWidth = ep * 0.85;
    c.beginPath();
    c.ellipse(bx + boucle * 0.5, yBas + boucle * 0.34, boucle, boucle * 0.62, 0.4, 2.2, 5.9);
    c.stroke();
  }
  return { x:bx, y:yBas };
}

/* Rosette d'épiphyte (broméliacée) accrochée à une branche ou à un
   tronc. Minuscule, mais c'est le détail qu'on découvre en zoomant —
   et le cahier des charges demande explicitement qu'il y ait à
   découvrir en zoomant. */
function jEpiphyte(c, x, y, r, graine, fleurie){
  var al = prng(graine || 7), i;
  for(i = 0; i < 9; i++){
    var a = -3.1416 + i / 8 * 3.1416 + (al() - 0.5) * 0.2;
    jFeuille(c, x, y, r * (0.7 + al() * 0.6), r * 0.20, a, vertJ(0.32 + al() * 0.4));
  }
  if(fleurie){
    c.fillStyle = VJ.fleur;
    c.beginPath(); c.ellipse(x, y - r * 0.42, r * 0.24, r * 0.5, 0, 0, 6.2832); c.fill();
  }
}

/* ================================================================
   A1 — LES GRANDS ARBRES
   Six silhouettes franchement séparées : au zoom général la couleur
   ment, c'est la découpe qui identifie l'arbre. Deux géants droits
   qui percent la canopée, un étrangleur trapu, un penché, un
   palmier-couronne, un mort.
   ================================================================ */
var ARBRES_J = [
  /* 0 — LE FROMAGER. Le point haut de la carte. Fût pâle et lisse,
     premières branches très haut, couronne large et posée à plat :
     c'est un arbre qui a dépassé tous les autres et qui s'étale
     au-dessus d'eux. Contreforts énormes. */
  { h:330, wPied:21, wHaut:9.0, pen:-4, arc:5, ec:VJ.pale, style:1,
    tBr:0.70, nBr:6, larg:120, ep:58, cy:-26, nLobes:12, dens:54,
    tv:0.08, contre:5, cLarg:36, cHaut:32, lianes:3, mousse:1, accent:0 },
  /* 1 — LE FIGUIER ÉTRANGLEUR. Trapu, très sombre, tronc tressé de
     racines soudées, couronne dense et ronde qui descend bas, et
     un rideau de racines aériennes. La masse noire de la carte. */
  { h:345, wPied:22, wHaut:12, pen:6, arc:-8, ec:"#3a2c1f", style:2,
    tBr:0.58, nBr:7, larg:118, ep:74, cy:-16, nLobes:14, dens:58,
    tv:-0.10, contre:4, cLarg:33, cHaut:32, lianes:7, mousse:1, accent:0 },
  /* 2 — L'ARBRE PENCHÉ. Il a poussé vers une trouée : le fût part en
     biais et toute la couronne est décentrée. Une seule grosse
     branche basse tendue à l'horizontale, chargée de lianes — c'est
     la silhouette la plus reconnaissable des six. */
  { h:356, wPied:17, wHaut:8.5, pen:26, arc:34, ec:"#4a3a26", style:0,
    tBr:0.60, nBr:5, larg:84, ep:62, cy:-18, nLobes:11, dens:50,
    tv:0.04, contre:3, cLarg:29, cHaut:28, lianes:6, mousse:1, accent:0 },
  /* 3 — LE PALMIER GÉANT. Aucune branche : un fût nu, annelé, et une
     couronne de frondes tout en haut. Traité à part dans le dessin,
     mais il partage la table pour les mesures. */
  { h:238, wPied:12, wHaut:7.0, pen:-14, arc:-12, ec:"#5c4a32", style:0,
    tBr:0.94, nBr:0, larg:78, ep:34, cy:-6, nLobes:0, dens:0,
    tv:0.16, contre:0, cLarg:16, cHaut:14, lianes:2, mousse:0, accent:VJ.fruit },
  /* 4 — L'ARBRE À LARGE COURONNE. Le plus « habité » : moussu de la
     base aux branches, couvert d'épiphytes, fleurs rouges dans le
     feuillage. Le plus large des six. */
  { h:361, wPied:20, wHaut:10.5, pen:-10, arc:12, ec:"#3f3222", style:0,
    tBr:0.58, nBr:8, larg:106, ep:72, cy:-14, nLobes:15, dens:52,
    tv:0.00, contre:4, cLarg:34, cHaut:32, lianes:5, mousse:1, accent:VJ.fleur },
  /* 5 — L'ARBRE MORT ENVAHI. Gris pâle, tête cassée, branches nues,
     entièrement recouvert de lianes et de philodendrons grimpants,
     avec des champignons en console. C'est la valeur claire de la
     carte : sans lui, six arbres verts se confondent. */
  { h:299, wPied:17, wHaut:9.0, pen:12, arc:-14, ec:"#7d766a", style:3,
    tBr:0.40, nBr:6, larg:74, ep:50, cy:-20, nLobes:7, dens:26,
    tv:-0.06, contre:3, cLarg:27, cHaut:30, lianes:9, mousse:1, accent:0 }
];

/* La couronne. Trois décisions, toutes prises après avoir vu la
   première version à l'écran :

   — EN LOBES, pas en masse. Une masse unique donne un brocoli ; des
     lobes séparés par des trouées donnent une canopée, et les
     trouées comptent autant que les feuilles : ce sont elles qui
     laissent passer le ciel et voir le jeu.
   — UNE SEULE LUMIÈRE POUR TOUTE LA COURONNE. Éclairer chaque lobe
     séparément donnait un tapis de pois verts tous à la même
     valeur. La clarté d'une feuille est donc calculée par rapport
     au centre de la COURONNE ENTIÈRE — haut-gauche clair,
     bas-droite presque noir — et le lobe n'ajoute qu'une petite
     variation. C'est ce gradient d'ensemble qui donne le volume.
   — UNE FRANGE SOUS LE BORD BAS. Une ellipse de feuillage a un bord
     net qui trahit la géométrie ; quelques feuilles sombres qui
     pendent sous la ligne du bas cassent ce bord et donnent
     l'épaisseur.
   ---------------------------------------------------------------- */
function jCouronne(c, o){
  var al = prng(o.graine), i, k;
  var lobes = [];
  for(i = 0; i < o.nLobes; i++){
    var a = i / o.nLobes * 6.2832 + al() * 0.8;
    var rr = Math.pow(al(), 0.5);
    lobes.push({
      x: o.cx + Math.cos(a) * o.larg * 0.62 * rr,
      y: o.cy + Math.sin(a) * o.ep * 0.72 * rr,
      r: o.larg * (0.26 + al() * 0.16)
    });
  }
  /* du plus lointain au plus proche : les lobes du bas passent
     DERRIÈRE ceux du haut */
  lobes.sort(function(p, q){ return p.y - q.y; });

  /* clarté d'un point de la couronne : un seul gradient, incliné
     vers le haut-gauche, plus marqué en hauteur qu'en largeur — le
     soleil de midi d'une jungle tombe de très haut */
  function clair(x, y){
    return borne(0.44 + (o.cx - x) / o.larg * 0.40 + (o.cy - y) / o.ep * 0.58, 0, 1);
  }

  /* 1 — la silhouette, presque noire. C'est elle qui porte la
     découpe de l'arbre au zoom général. */
  for(i = 0; i < lobes.length; i++){
    var lo = lobes[i];
    c.fillStyle = vertJ(0.02 + o.tv * 0.3);
    c.beginPath();
    c.ellipse(lo.x, lo.y, lo.r * 1.02, lo.r * 0.74, 0, 0, 6.2832);
    c.fill();
  }
  /* 2 — la frange qui pend sous le bord bas */
  for(k = 0; k < o.nLobes * 3; k++){
    var af = 0.35 + al() * 2.45;                    // moitié basse seulement
    var fxg = o.cx + Math.cos(af) * o.larg * (0.55 + al() * 0.42);
    var fyg = o.cy + Math.sin(af) * o.ep * (0.62 + al() * 0.42);
    var Lg = o.larg * (0.09 + al() * 0.07);
    jFeuille(c, fxg, fyg, Lg, Lg * 0.30, 1.1 + (al() - 0.5) * 1.5, vertJ(0.05 + al() * 0.10));
  }
  /* 3 — le feuillage. Toutes les feuilles sont d'abord calculées,
     puis TRIÉES PAR CLARTÉ avant d'être tracées. Dessinées dans
     l'ordre du tirage, une feuille d'ombre venait aussi souvent
     recouvrir une feuille de lumière que l'inverse, et le gradient
     d'ensemble se moyennait en une nappe uniforme — c'était le
     principal défaut de la première version. Trié, chaque feuille
     claire se pose sur les sombres et le volume revient. */
  var feuilles = [];
  for(i = 0; i < lobes.length; i++){
    var l2 = lobes[i];
    for(k = 0; k < o.dens; k++){
      var an = al() * 6.2832, rd = Math.sqrt(al());
      var fx = l2.x + Math.cos(an) * l2.r * rd;
      var fy = l2.y + Math.sin(an) * l2.r * 0.76 * rd;
      /* le relief propre du lobe, en plus du gradient d'ensemble :
         sans lui les lobes se fondent en une seule nappe */
      var bosse = ((l2.x - fx) / l2.r * 0.12 + (l2.y - fy) / l2.r * 0.26);
      feuilles.push({
        x:fx, y:fy,
        t:clair(fx, fy) + bosse + o.tv + (al() - 0.5) * 0.16,
        L:o.larg * (0.078 + al() * 0.055),
        a:an * 0.3 + (al() - 0.5) * 4
      });
    }
  }
  feuilles.sort(function(p, q){ return p.t - q.t; });
  for(i = 0; i < feuilles.length; i++){
    var fe = feuilles[i];
    jFeuille(c, fe.x, fe.y, fe.L, fe.L * 0.34, fe.a, vertJ(fe.t));
  }
  /* 4 — les feuilles de plein soleil, sur la crête haut-gauche
     seulement. Une poignée suffit : c'est un point d'accroche, pas
     une couche de plus. */
  for(k = 0; k < Math.round(o.dens * 0.7); k++){
    var a3 = 3.5 + al() * 2.2;
    var r3 = 0.34 + al() * 0.56;
    var sx = o.cx + Math.cos(a3) * o.larg * r3;
    var sy = o.cy + Math.sin(a3) * o.ep * r3;
    var L3 = o.larg * (0.055 + al() * 0.045);
    jFeuille(c, sx, sy, L3, L3 * 0.32, al() * 6.2832, vertJ(0.84 + al() * 0.16));
  }
  if(o.accent){
    for(k = 0; k < 11; k++){
      var a4 = al() * 6.2832, r4 = Math.pow(al(), 0.5);
      c.fillStyle = k % 3 === 0 ? ecl(o.accent, 1.3) : o.accent;
      c.beginPath();
      c.ellipse(o.cx + Math.cos(a4) * o.larg * 0.8 * r4,
                o.cy + Math.sin(a4) * o.ep * 0.8 * r4,
                2.8 + al() * 2.2, 1.9 + al() * 1.7, al() * 3, 0, 6.2832);
      c.fill();
    }
  }
}

/* Une charpentière : limbe qui s'effile et fourche. Au trait
   d'épaisseur constante, les branches de la première version
   ressemblaient à des tuyaux plantés dans le tronc ; c'est
   l'effilement et la fourche qui font la branche. */
function jBranche(c, x0, y0, x1, y1, e0, coul, coulC){
  var mx = (x0 + x1) * 0.5, my = Math.min(y0, y1) - Math.abs(x1 - x0) * 0.12;
  /* dix-huit disques et non sept : sur une charpentière de gros
     arbre, e0 dépasse la douzaine d'unités et sept disques donnaient
     une chenille au raccord avec le tronc */
  var n = 18, i, t, u, px, py, py2;
  for(i = 0; i <= n; i++){
    t = i / n; u = 1 - t;
    px = u * u * x0 + 2 * u * t * mx + t * t * x1;
    py = u * u * y0 + 2 * u * t * my + t * t * y1;
    c.fillStyle = coul;
    c.beginPath(); c.arc(px, py, e0 * (1 - t * 0.78), 0, 6.2832); c.fill();
  }
  /* arête éclairée sur le dessus : deux traits, et la branche a un
     dessus et un dessous */
  c.strokeStyle = coulC; c.lineWidth = Math.max(0.7, e0 * 0.35); c.lineCap = "round";
  c.beginPath();
  c.moveTo(x0, y0 - e0 * 0.5);
  c.quadraticCurveTo(mx, my - e0 * 0.35, x1, y1 - e0 * 0.12);
  c.stroke();
  /* la fourche du bout */
  py2 = y1 - Math.abs(x1 - x0) * 0.16;
  c.strokeStyle = coul; c.lineWidth = Math.max(1, e0 * 0.5);
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x1 + (x1 - x0) * 0.16, py2);
  c.moveTo(x1, y1);
  c.lineTo(x1 - (x1 - x0) * 0.08, py2 - e0);
  c.stroke();
}

function dessineArbreJungle(c, v, s){
  var A = ARBRES_J[v % ARBRES_J.length];
  s = s || 1;
  var gr = 1471 + v * 977;
  var al = prng(gr);
  var h = A.h * s;
  var i, k, p, a;

  /* --- l'ombre portée. Large et molle : sous une canopée il n'y a
     pas d'ombre nette, il y a une zone où il fait plus sombre. --- */
  c.save();
  c.globalAlpha = 0.30; c.fillStyle = "#000";
  c.beginPath(); c.ellipse(0, 0, A.cLarg * s * 1.5, A.cLarg * s * 0.62, 0, 0, 6.2832); c.fill();
  c.globalAlpha = 0.16;
  c.beginPath(); c.ellipse(-6 * s, 1, A.larg * s * 0.5, A.larg * s * 0.21, 0, 0, 6.2832); c.fill();
  c.restore();

  /* --- les racines traçantes, à plat sur le sol. Elles ne montent
     pas : leur seul rôle est d'ancrer l'arbre dans le terrain pour
     qu'il n'ait pas l'air posé dessus.
     Elles sont posées sur une ellipse ÉCRASÉE à 0,26 et non sur
     l'ellipse isométrique franche (0,5) : mesuré au banc, la version
     isométrique faisait remonter les racines arrière jusqu'à −30,
     en plein dans la bande réservée aux troupes. À 0,26 elles ne
     dépassent plus −12, c'est-à-dire la hauteur d'une botte. --- */
  for(i = 0; i < 8; i++){
    a = i / 8 * 6.2832 + al() * 0.5;
    var lr = Math.min(46, A.cLarg * s * (1.0 + al() * 0.9));
    var ex1 = Math.cos(a) * lr, ey1 = Math.sin(a) * lr * 0.26;
    c.strokeStyle = rgba(VJ.ecorce, 0.9); c.lineWidth = 4.2 * s * (0.6 + al() * 0.7);
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(0, -2 * s);
    c.quadraticCurveTo(ex1 * 0.5, ey1 * 0.5 - 2 * s, ex1, ey1);
    c.stroke();
    c.strokeStyle = "rgba(232,222,190,.10)"; c.lineWidth = 1.3 * s;
    c.beginPath();
    c.moveTo(0, -3 * s);
    c.quadraticCurveTo(ex1 * 0.5, ey1 * 0.5 - 3.4 * s, ex1 * 0.95, ey1 - 1);
    c.stroke();
  }

  /* --- les contreforts, du plus lointain au plus proche. La hauteur
     est plafonnée à 32 : c'est ce plafond, mesuré au banc, qui tient
     la promesse de lisibilité de la bande basse. --- */
  var nc = A.contre;
  for(i = 0; i < nc; i++){
    var cote = (i % 2) ? 1 : -1;
    var lc = A.cLarg * s * (0.62 + (i / nc) * 0.5) * (0.85 + al() * 0.3);
    var hc = Math.min(32, A.cHaut * s * (0.72 + al() * 0.4));
    jContrefort(c, cote, lc, hc, ecl(A.ec, 0.80), ecl(A.ec, 0.48));
  }

  /* --- le fût --- */
  var yTop = -h * (A.style === 3 ? 0.72 : A.tBr);
  var pts = jEpine(0, 2 * s, A.arc * s, -h * 0.45, A.pen * s, yTop,
                   A.wPied * s, A.wHaut * s, 22);
  jEcorce(c, pts, A.ec, A.style, gr, A.mousse);

  var sommet = pts[pts.length - 1];

  /* --- la charpente. Les branches MONTENT vers la couronne au lieu
     de partir à l'horizontale : à l'horizontale, la première version
     donnait des tuyaux plantés dans le fût qui dépassaient du
     feuillage comme des antennes. Elles partent toutes au-dessus de
     −110 — la bande basse doit rester dégagée, c'est la règle. --- */
  var branches = [];
  if(A.nBr > 0){
    for(i = 0; i < A.nBr; i++){
      var t = i / Math.max(1, A.nBr - 1);
      var pb = pts[Math.round((0.58 + t * 0.42) * (pts.length - 1))];
      var dir = (i % 2) ? 1 : -1;
      var lb = A.larg * s * (0.30 + al() * 0.36);
      var bx = pb.x + dir * lb;
      var by = pb.y - lb * (0.42 + al() * 0.42);        // ça monte
      /* v2 : une branche maîtresse basse, presque horizontale, qui
         signe la silhouette de l'arbre penché */
      if(v === 2 && i === 0){ bx = pb.x - A.larg * s * 1.05; by = pb.y - 8 * s; }
      jBranche(c, pb.x, pb.y, bx, by, Math.max(1.8, pb.w * 0.72),
               ecl(A.ec, 0.58), ecl(A.ec, 1.12));
      branches.push({ x:bx, y:by });
      if(A.mousse && al() < 0.6) jEpiphyte(c, pb.x + dir * lb * 0.4, pb.y - 3, 7 * s, gr + i * 31, al() < 0.4);
      /* la branche maîtresse de l'arbre penché : nue, c'était un
         manche à balai qui sortait du feuillage. Un jardin suspendu
         dessus — mousses, broméliacées, feuilles — et elle devient
         la signature de l'arbre. */
      if(v === 2 && i === 0){
        for(k = 0; k < 9; k++){
          var tj = 0.18 + k * 0.09;
          var jx = pb.x + (bx - pb.x) * tj;
          var jy = pb.y + (by - pb.y) * tj + 2 * s;
          jFeuille(c, jx, jy, (13 + al() * 10) * s, 5 * s, 1.0 + (al() - 0.5) * 2, vertJ(0.16 + al() * 0.6));
          if(k % 3 === 1) jEpiphyte(c, jx, jy - 2 * s, 9 * s, gr + k * 17, k === 4);
        }
      }
    }
  }

  /* --- le palmier géant : couronne de frondes, sans branches --- */
  if(v === 3){
    /* anneaux de cicatrices foliaires : c'est ce qui fait un stipe
       et non un poteau */
    c.save();
    jTraceFut(c, pts); c.clip();
    for(i = 0; i < 26; i++){
      p = pts[Math.round((i / 26) * (pts.length - 1))];
      c.strokeStyle = rgba(VJ.ecorceO, 0.26); c.lineWidth = 1.2 * s;
      c.beginPath(); c.moveTo(p.x - p.w, p.y + 1); c.lineTo(p.x + p.w, p.y - 1.4 * s); c.stroke();
    }
    c.restore();
    /* régime de fruits sous la couronne : la seule tache orange à
       trente mètres de haut, elle vaut cher */
    for(i = 0; i < 16; i++){
      c.fillStyle = i % 3 ? VJ.fruit : ecl(VJ.fruit, 0.72);
      c.beginPath();
      c.ellipse(sommet.x + 8 * s + (al() - 0.5) * 13 * s, sommet.y + 8 * s + al() * 15 * s,
                2.6 * s, 3.4 * s, 0, 0, 6.2832);
      c.fill();
    }
  }

  /* --- les lianes qui pendent des branches. Fines, et elles
     s'arrêtent à −70 : plus bas, elles passeraient devant les
     tourelles, et un Crible culmine à 57. --- */
  var yStop = -70;
  for(i = 0; i < A.lianes; i++){
    var src = branches.length ? branches[i % branches.length] : sommet;
    var lx = src.x + (al() - 0.5) * 26 * s;
    var lyb = Math.min(yStop, src.y + (60 + al() * 150) * s);
    jCorde(c, lx, src.y + 2, lyb, (al() - 0.5) * 20 * s, 1.4 + al() * 1.6,
           rgba(VJ.ecorceO, 0.85), vertJ(0.18 + al() * 0.14),
           al() < 0.4 ? 4 + al() * 4 : 0);
    /* feuilles réparties le long de la liane : sans elles, ce sont
       des câbles électriques */
    for(k = 0; k < 5; k++){
      var tt = 0.25 + k * 0.16;
      var fy = src.y + (lyb - src.y) * tt;
      var fx2 = lx + (al() - 0.5) * 16 * s * tt;
      jFeuille(c, fx2, fy, 7 * s, 2.6 * s, 0.3 + al() * 2.4, vertJ(0.28 + al() * 0.3));
    }
  }

  /* --- v5 : le mort. Champignons en console et philodendron
     grimpant, tout ce qui pousse SUR un arbre qui ne pousse plus. --- */
  if(v === 5){
    for(i = 0; i < 11; i++){
      p = pts[Math.round((0.10 + al() * 0.60) * (pts.length - 1))];
      /* Une console de polypore, vue de trois quarts : un demi-disque
         posé à plat, sa tranche sombre dessous et un liseré clair sur
         l'arête. Inclinées, les premières versions faisaient des
         balafres orange sur le tronc ; posées bien à l'horizontale,
         elles se lisent tout de suite comme des champignons. */
      var cote = al() < 0.5 ? -1 : 1;
      var mx = p.x + cote * p.w * 0.75;
      var mr = (5.5 + al() * 3.5) * s;
      c.fillStyle = rgba("#1a1008", 0.55);
      c.beginPath();
      c.ellipse(mx + cote * mr * 0.35, p.y + 1.2 * s, mr, 1.7 * s, 0, 0, 3.1416); c.fill();
      c.fillStyle = i % 2 ? VJ.fruit : ecl(VJ.fruit, 0.74);
      c.beginPath();
      c.ellipse(mx + cote * mr * 0.35, p.y, mr, 2.4 * s, 0, 3.1416, 6.2832); c.fill();
      c.fillStyle = "rgba(255,226,160,.45)";
      c.beginPath();
      c.ellipse(mx + cote * mr * 0.35, p.y - 0.5 * s, mr * 0.72, 1.2 * s, 0, 3.1416, 6.2832); c.fill();
    }
    /* le grimpant colle au tronc : il ne déborde jamais de ±14 */
    for(i = 0; i < 26; i++){
      p = pts[Math.round(Math.pow(al(), 0.8) * (pts.length - 1))];
      if(p.y > -46) continue;                      // rien dans la bande basse
      jFeuille(c, p.x + (al() * 2 - 1) * p.w * 1.1, p.y,
               9 * s + al() * 6 * s, 4 * s, al() * 6.2832, vertJ(0.22 + al() * 0.4));
    }
  }

  /* --- LA COURONNE, sur son calque, reposée à 0,72.
     Premier verrou de lisibilité : on doit deviner les troupes et
     les tourelles au travers. --- */
  if(A.nLobes > 0){
    jCalque(c, 0.72, function(g){
      jCouronne(g, {
        cx: sommet.x + A.pen * s * 0.4,
        cy: sommet.y + A.cy * s,
        larg: A.larg * s, ep: A.ep * s,
        nLobes: A.nLobes, dens: A.dens, tv: A.tv,
        accent: A.accent, graine: gr + 5
      });
    });
  }
  if(v === 3){
    jCalque(c, 0.78, function(g){
      /* onze frondes en couronne, la plus longue vers le bas-avant.
         Les palmes du fond sont plus sombres : sans cet écart la
         couronne s'aplatit en étoile de papier. */
      var a2 = prng(gr + 9), n = 11;
      for(var q = 0; q < n; q++){
        var ang = -3.1416 + q / (n - 1) * 3.1416 + (a2() - 0.5) * 0.16;
        var arr = Math.sin(q / (n - 1) * 3.1416);
        var L = A.larg * s * (0.62 + arr * 0.5);
        var fond = q > 2 && q < n - 3;
        jFronde(g, sommet.x, sommet.y - 3 * s, ang, L, L * 0.19, 15,
                vertJ(fond ? 0.10 : 0.20), vertJ(fond ? 0.30 : 0.50 + a2() * 0.24),
                L * 0.30);
      }
      /* le cœur, plus clair : le point où l'œil se pose */
      for(var q2 = 0; q2 < 5; q2++){
        jFronde(g, sommet.x, sommet.y - 5 * s, -1.9 + q2 * 0.42, A.larg * s * 0.42,
                A.larg * s * 0.075, 9, vertJ(0.34), vertJ(0.74), 6 * s);
      }
    });
  }
}

/* ================================================================
   A2 — LES LIANES ISOLÉES
   Elles pendent d'en haut, hors cadre : c'est ce qui donne
   l'impression qu'il y a une canopée même là où aucun arbre n'est
   dessiné. Elles s'arrêtent toutes bien au-dessus de la bande des
   troupes.
   ================================================================ */
function dessineLianeJungle(c, v, s){
  s = s || 1;
  var gr = 3301 + v * 641;
  var al = prng(gr), i, k;
  /* Le point d'accroche n'est PAS le même pour tous les brins : au
     ras du cadre pour tous, les quatre variantes alignaient leurs
     départs sur une même ligne horizontale parfaitement droite, et
     un semis de lianes dessinait une frise. */
  var haut = -SJ_OY + 6 + v * 9;

  if(v === 0){
    /* rideau : cinq brins parallèles, longueurs très inégales.
       Égales, elles feraient un peigne. */
    for(i = 0; i < 5; i++){
      var x = (i - 2) * 13 * s + (al() - 0.5) * 8 * s;
      var h0 = haut + al() * 46 * s;
      var bas = -70 * s - al() * 130 * s;
      /* un moignon de branche au départ : sans lui la liane pend
         du vide, et un semis de lianes ressemble à des fils
         électriques tombés du ciel */
      c.strokeStyle = rgba(VJ.ecorceO, 0.9); c.lineWidth = 3.4 * s; c.lineCap = "round";
      c.beginPath(); c.moveTo(x - 9 * s, h0 - 2 * s); c.lineTo(x + 9 * s, h0); c.stroke();
      jCorde(c, x, h0, bas, (al() - 0.5) * 22 * s, 1.6 + al() * 1.4,
             rgba(VJ.ecorceO, 0.85), vertJ(0.16 + al() * 0.12), al() < 0.5 ? 5 : 0);
      for(k = 0; k < 7; k++){
        var t = 0.15 + k * 0.12;
        jFeuille(c, x + (al() - 0.5) * 18 * s, h0 + (bas - h0) * t,
                 8 * s, 3 * s, 0.2 + al() * 2.6, vertJ(0.26 + al() * 0.34));
      }
    }
  }else if(v === 1){
    /* liane ligneuse : un câble épais qui s'enroule sur lui-même,
       avec des feuilles cordiformes. C'est la plus « solide » —
       celle à laquelle on croirait pouvoir se pendre. */
    var bas1 = -62 * s;
    c.strokeStyle = rgba(VJ.ecorceO, 0.9); c.lineWidth = 5 * s; c.lineCap = "round";
    c.beginPath(); c.moveTo(-10 * s, haut - 3 * s); c.lineTo(16 * s, haut + 1 * s); c.stroke();
    var p = jCorde(c, 6 * s, haut, bas1, -34 * s, 4.2 * s,
                   rgba(VJ.ecorceO, 0.9), "#5a4630", 9 * s);
    for(i = 0; i < 12; i++){
      var tt = 0.12 + i * 0.075;
      var yy = haut + (bas1 - haut) * tt;
      var xx = 6 * s + (-34 * s) * (tt * (1 - tt) * 2) + (al() - 0.5) * 6 * s;
      jPagaie(c, xx, yy, (al() < 0.5 ? 0.5 : 2.6) + al() * 0.6,
              15 * s, 6 * s, 4 * s, 0, 0,
              vertJ(0.3 + al() * 0.3), vertJ(0.12), gr + i);
    }
    /* vrilles : deux spires suffisent à dire « ça s'accroche » */
    c.strokeStyle = vertJ(0.42); c.lineWidth = 1.1 * s;
    for(i = 0; i < 4; i++){
      var vy = haut + (bas1 - haut) * (0.3 + i * 0.18);
      c.beginPath();
      c.ellipse(p.x + (al() - 0.5) * 20 * s, vy, 5 * s, 2.4 * s, al(), 0, 5.4);
      c.stroke();
    }
  }else if(v === 2){
    /* racines aériennes de figuier : très fines, très nombreuses,
       parfaitement verticales. Le contraire du rideau feuillu — un
       hachurage, presque une texture. */
    for(i = 0; i < 16; i++){
      var rx = (al() - 0.5) * 66 * s;
      var rh = haut + al() * 60 * s;
      var rb = -78 * s - al() * 150 * s;
      c.strokeStyle = rgba(VJ.ecorceO, 0.55 + al() * 0.4);
      c.lineWidth = 0.8 + al() * 1.5 * s;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(rx, rh);
      c.quadraticCurveTo(rx + (al() - 0.5) * 10 * s, (rh + rb) * 0.5, rx + (al() - 0.5) * 14 * s, rb);
      c.stroke();
    }
    for(i = 0; i < 5; i++){
      c.strokeStyle = "rgba(226,244,200,.13)"; c.lineWidth = 0.8 * s;
      var qx = (al() - 0.5) * 60 * s;
      c.beginPath(); c.moveTo(qx, haut); c.lineTo(qx + (al() - 0.5) * 12 * s, -90 * s - al() * 120 * s); c.stroke();
    }
  }else{
    /* liane fleurie : la seule tache rouge qui tombe du ciel. Sur
       une carte entièrement verte, c'est un repère. */
    var bas3 = -66 * s;
    c.strokeStyle = rgba(VJ.ecorceO, 0.9); c.lineWidth = 3.6 * s; c.lineCap = "round";
    c.beginPath(); c.moveTo(-14 * s, haut - 2 * s); c.lineTo(8 * s, haut + 1 * s); c.stroke();
    jCorde(c, -4 * s, haut, bas3, 26 * s, 2.4 * s, rgba(VJ.ecorceO, 0.85), vertJ(0.2), 6 * s);
    for(i = 0; i < 15; i++){
      var t3 = 0.1 + i * 0.06;
      var y3 = haut + (bas3 - haut) * t3;
      var x3 = -4 * s + 26 * s * (t3 * (1 - t3) * 2) + (al() - 0.5) * 10 * s;
      jFeuille(c, x3, y3, 10 * s, 3.6 * s, 0.4 + al() * 2.2, vertJ(0.24 + al() * 0.36));
      if(i % 3 === 1){
        /* la fleur : cinq pétales et un cœur clair, minuscule mais
           saturé — c'est la saturation qui porte, pas la taille */
        for(k = 0; k < 5; k++){
          c.fillStyle = k % 2 ? VJ.fleur : VJ.fleurC;
          c.beginPath();
          c.ellipse(x3 + Math.cos(k * 1.257) * 2.6 * s, y3 + 4 * s + Math.sin(k * 1.257) * 2.2 * s,
                    2.4 * s, 1.8 * s, k * 1.257, 0, 6.2832);
          c.fill();
        }
        c.fillStyle = VJ.pousse;
        c.beginPath(); c.arc(x3, y3 + 4 * s, 1.2 * s, 0, 6.2832); c.fill();
      }
    }
  }
}

/* ================================================================
   A3 — LES FOUGÈRES  (30 à 60)
   L'étage qui remplit le vide entre le sol et les buissons. Quatre
   ports différents : arquée, arborescente, en nid, rampante.
   ================================================================ */
function dessineFougere(c, v, s){
  s = s || 1;
  var gr = 5501 + v * 313;
  var al = prng(gr), i;

  c.save(); c.globalAlpha = 0.26; c.fillStyle = "#000";
  c.beginPath(); c.ellipse(0, 0, 15 * s, 5.5 * s, 0, 0, 6.2832); c.fill();
  c.restore();

  if(v === 0){
    /* fougère commune : un éventail SYMÉTRIQUE de onze frondes. La
       première version en comptait sept sur un secteur décentré :
       elle penchait à droite comme un balai posé contre un mur. Les
       frondes du fond partent d'abord et restent sombres. */
    for(i = 0; i < 11; i++){
      var a = -3.05 + i / 10 * 2.3 + (al() - 0.5) * 0.16;
      var L = (36 + al() * 18) * s;
      var fond = i > 2 && i < 8;
      jFronde(c, (al() - 0.5) * 5 * s, -2 * s, a, L, L * 0.26, 12,
              vertJ(fond ? 0.08 : 0.16), vertJ(fond ? 0.30 : 0.54 + al() * 0.24), L * 0.34);
    }
    /* crosses non déroulées : le détail qu'on ne voit qu'en zoomant,
       et qui dit « fougère » mieux que toutes les pennes */
    for(i = 0; i < 2; i++){
      var cx = (i ? 6 : -7) * s, cy = -18 * s - al() * 8 * s;
      c.strokeStyle = vertJ(0.62); c.lineWidth = 1.8 * s; c.lineCap = "round";
      c.beginPath(); c.moveTo(cx, -2 * s); c.quadraticCurveTo(cx, cy + 6 * s, cx + 2 * s, cy); c.stroke();
      c.beginPath(); c.arc(cx + 3.4 * s, cy, 2.6 * s, 2.2, 5.6); c.stroke();
    }
  }else if(v === 1){
    /* fougère arborescente naine : un petit stipe fibreux et une
       couronne. Une fougère qui a un tronc, c'est immédiatement
       exotique. */
    var hs = 26 * s;
    var pts = jEpine(0, 1 * s, 1 * s, -hs * 0.5, -2 * s, -hs, 4.4 * s, 3.2 * s, 8);
    jEcorce(c, pts, "#4a3a28", 2, gr, 1);
    for(i = 0; i < 8; i++){
      var a2 = -3.05 + i / 7 * 2.1 + (al() - 0.5) * 0.2;
      var L2 = (24 + al() * 12) * s;
      jFronde(c, -2 * s, -hs, a2, L2, L2 * 0.24, 10,
              vertJ(0.12), vertJ(0.44 + al() * 0.28), L2 * 0.3);
    }
  }else if(v === 2){
    /* fougère nid d'oiseau : feuilles ENTIÈRES en rosette, ondulées.
       C'est la seule qui n'a pas de pennes — elle casse la
       répétition du motif « peigne » sur toute la carte. */
    for(i = 0; i < 11; i++){
      var a3 = -3.15 + i / 10 * 2.3 + (al() - 0.5) * 0.14;
      var L3 = (26 + al() * 20) * s;
      var fond3 = i > 2 && i < 8;
      jPagaie(c, 0, -1 * s, a3, L3, L3 * 0.16, L3 * 0.16 * (al() - 0.5),
              0, 0, vertJ(fond3 ? 0.26 : 0.48 + al() * 0.24), vertJ(0.12), gr + i);
    }
    c.fillStyle = rgba(VJ.ecorceO, 0.5);
    c.beginPath(); c.ellipse(0, -2 * s, 4 * s, 2.4 * s, 0, 0, 6.2832); c.fill();
  }else{
    /* fougère rampante : basse et étalée, elle habille les pieds de
       tout le reste. La plus utile en nombre, la moins voyante —
       donc la plus dense, sinon elle disparaît. */
    for(i = 0; i < 15; i++){
      var a4 = -3.45 + i / 14 * 2.9;
      var L4 = (22 + al() * 14) * s;
      var fond4 = i > 3 && i < 11;
      jFronde(c, (al() - 0.5) * 10 * s, -1 * s, a4, L4, L4 * 0.30, 9,
              vertJ(0.08), vertJ(fond4 ? 0.28 : 0.44 + al() * 0.3), L4 * 0.42);
    }
  }
}

/* ================================================================
   A4 — LES BUISSONS  (40 à 80)
   ================================================================ */
function dessineBuissonJungle(c, v, s){
  s = s || 1;
  var gr = 7717 + v * 419;
  var al = prng(gr), i, k;
  var HB = [58, 52, 44, 62][v] * s;
  var LB = [30, 34, 40, 28][v] * s;

  c.save(); c.globalAlpha = 0.28; c.fillStyle = "#000";
  c.beginPath(); c.ellipse(0, 0, LB * 0.9, LB * 0.32, 0, 0, 6.2832); c.fill();
  c.restore();

  /* branchages visibles à la base : un buisson qui sort du sol sans
     tige a l'air d'une boule posée là */
  for(i = 0; i < 5; i++){
    var a = -2.6 + i / 4 * 1.6;
    c.strokeStyle = "#3a2c1e"; c.lineWidth = 1.8 * s; c.lineCap = "round";
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(Math.cos(a) * LB * 0.2, -HB * 0.3, Math.cos(a) * LB * 0.5, -HB * 0.55);
    c.stroke();
  }

  /* masse sombre en trois lobes, puis les feuilles par-dessus */
  var lobes = [];
  var nl = [4, 5, 6, 5][v];
  for(i = 0; i < nl; i++){
    var an = -3.1416 + i / (nl - 1) * 3.1416;
    lobes.push({
      x: Math.cos(an) * LB * 0.52 * (0.6 + al() * 0.6),
      y: -HB * (0.44 + al() * 0.42) + Math.sin(an) * HB * 0.12,
      r: LB * (0.36 + al() * 0.2)
    });
  }
  for(i = 0; i < nl; i++){
    c.fillStyle = vertJ(0.03);
    c.beginPath(); c.ellipse(lobes[i].x, lobes[i].y, lobes[i].r, lobes[i].r * 0.80, 0, 0, 6.2832); c.fill();
  }
  /* même principe que la canopée : une seule lumière pour tout le
     buisson, sinon chaque lobe se ré-éclaire et la masse s'aplatit */
  for(i = 0; i < nl; i++){
    var lo = lobes[i];
    for(k = 0; k < 40; k++){
      var ang = al() * 6.2832, rd = Math.sqrt(al());
      var fx = lo.x + Math.cos(ang) * lo.r * rd;
      var fy = lo.y + Math.sin(ang) * lo.r * 0.8 * rd;
      var t = borne(0.46 - fx / (LB * 2.6) - (fy + HB * 0.55) / (HB * 1.5)
                    + (lo.y - fy) / (lo.r * 6) + (al() - 0.5) * 0.14, 0, 1);
      var L = LB * (0.20 + al() * 0.14);
      if(v === 3){
        /* v3 : arbuste à feuilles panachées, nervure violacée. La
           seule note froide du sous-bois. */
        jFeuille(c, fx, fy, L, L * 0.32, ang * 0.4 + (al() - 0.5) * 3, vertJ(t * 0.9));
        if(k % 5 === 0){
          c.strokeStyle = rgba(VJ.violet, 0.55); c.lineWidth = 0.9 * s;
          c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + Math.cos(ang) * L, fy + Math.sin(ang) * L); c.stroke();
        }
      }else{
        jFeuille(c, fx, fy, L, L * 0.36, ang * 0.4 + (al() - 0.5) * 3, vertJ(t));
      }
    }
  }
  if(v === 1){
    /* buisson à fleurs : douze taches rouges groupées en trois
       bouquets. Éparpillées, elles feraient du bruit ; groupées,
       elles font des fleurs. */
    for(i = 0; i < 3; i++){
      var bx = (i - 1) * LB * 0.44 + (al() - 0.5) * 6 * s;
      var by = -HB * (0.55 + al() * 0.3);
      for(k = 0; k < 5; k++){
        c.fillStyle = k % 2 ? VJ.fleur : VJ.fleurC;
        c.beginPath();
        c.ellipse(bx + Math.cos(k * 1.257) * 3 * s, by + Math.sin(k * 1.257) * 2.6 * s,
                  2.6 * s, 2 * s, k * 1.257, 0, 6.2832);
        c.fill();
      }
      c.fillStyle = "#ffe08a";
      c.beginPath(); c.arc(bx, by, 1.3 * s, 0, 6.2832); c.fill();
    }
  }
  if(v === 2){
    /* baies sombres et luisantes sur le buisson bas */
    for(i = 0; i < 16; i++){
      var px = (al() - 0.5) * LB * 1.5, py = -HB * (0.3 + al() * 0.55);
      c.fillStyle = "#2b1a3e";
      c.beginPath(); c.arc(px, py, 2 * s, 0, 6.2832); c.fill();
      c.fillStyle = "rgba(220,210,255,.5)";
      c.beginPath(); c.arc(px - 0.7 * s, py - 0.7 * s, 0.7 * s, 0, 6.2832); c.fill();
    }
  }
}

/* ================================================================
   A5 — LES PLANTES TROPICALES  (60 à 130)
   La famille qui « fait » la jungle à elle seule : ce sont les
   grandes feuilles entières, pas les petites feuilles, qui disent
   les tropiques. Elles sont hautes, mais toujours étroites au pied.
   ================================================================ */
function dessinePlanteTropicale(c, v, s){
  s = s || 1;
  var gr = 9931 + v * 547;
  var al = prng(gr), i, k;

  c.save(); c.globalAlpha = 0.28; c.fillStyle = "#000";
  c.beginPath(); c.ellipse(0, 0, 20 * s, 7 * s, 0, 0, 6.2832); c.fill();
  c.restore();

  if(v === 0){
    /* LE BANANIER. Sept feuilles en pagaie déchirées par le vent,
       sur un faux-tronc de gaines emboîtées. La plante la plus
       reconnaissable de la carte. */
    var H = 42 * s;
    c.fillStyle = vertJ(0.24);
    c.beginPath();
    c.moveTo(-6 * s, 0); c.quadraticCurveTo(-5 * s, -H * 0.6, -3.4 * s, -H);
    c.lineTo(3.4 * s, -H); c.quadraticCurveTo(5 * s, -H * 0.6, 6 * s, 0);
    c.closePath(); c.fill();
    c.strokeStyle = rgba(VJ.ecorceO, 0.4); c.lineWidth = 1 * s;
    for(i = 1; i < 4; i++){
      c.beginPath();
      c.moveTo(-6 * s + i * 3 * s, -2 * s);
      c.lineTo(-3.4 * s + i * 1.7 * s, -H);
      c.stroke();
    }
    c.fillStyle = "rgba(232,244,200,.13)";
    c.fillRect(-5.4 * s, -H, 2 * s, H);
    for(i = 0; i < 7; i++){
      var a = -2.85 + i / 6 * 1.9 + (al() - 0.5) * 0.12;
      var L = (52 + al() * 22) * s;
      var fond = i > 1 && i < 5;
      jPagaie(c, 0, -H + 2 * s, a, L, L * 0.23, L * 0.20 * (a < -1.57 ? -1 : 1),
              3, 0, vertJ(fond ? 0.22 : 0.54 + al() * 0.34), vertJ(0.10), gr + i);
    }
    /* le régime et sa bractée violette : l'accent non vert */
    c.strokeStyle = vertJ(0.2); c.lineWidth = 2.6 * s;
    c.beginPath(); c.moveTo(1 * s, -H); c.quadraticCurveTo(12 * s, -H + 6 * s, 15 * s, -H + 20 * s); c.stroke();
    for(i = 0; i < 3; i++){
      c.fillStyle = i % 2 ? VJ.pousse : vertJ(0.72);
      for(k = 0; k < 4; k++){
        c.beginPath();
        c.ellipse(11 * s + k * 1.6 * s, -H + 8 * s + i * 4 * s, 2.6 * s, 1.3 * s, 0.3, 0, 6.2832);
        c.fill();
      }
    }
    c.fillStyle = VJ.violet;
    c.beginPath();
    c.ellipse(15 * s, -H + 24 * s, 4.4 * s, 7 * s, 0.35, 0, 6.2832); c.fill();
    c.fillStyle = ecl(VJ.violet, 1.5);
    c.beginPath(); c.ellipse(13.6 * s, -H + 22 * s, 1.6 * s, 3.4 * s, 0.35, 0, 6.2832); c.fill();

  }else if(v === 1){
    /* LE PHILODENDRON PERCÉ. Feuilles trouées, portées par de longs
       pétioles. Les trous sont de vrais trous (pair-impair) : au
       zoom de jeu on voit le sol au travers, et c'est ce qui les
       distingue d'un simple motif. */
    for(i = 0; i < 9; i++){
      var a2 = -2.95 + i / 8 * 2.1 + (al() - 0.5) * 0.2;
      var Lp = (34 + al() * 24) * s;
      var px = Math.cos(a2) * Lp, py = Math.sin(a2) * Lp * 0.9;
      /* le pétiole est TRACÉ EN CLAIR sur le fond sombre : à la
         première version il était de la même valeur que la feuille
         et la plante n'avait plus l'air portée par rien */
      c.strokeStyle = vertJ(0.06); c.lineWidth = 3.6 * s; c.lineCap = "round";
      c.beginPath(); c.moveTo(0, -1 * s); c.quadraticCurveTo(px * 0.4, py * 0.8 - 6 * s, px, py); c.stroke();
      c.strokeStyle = vertJ(0.46 + al() * 0.14); c.lineWidth = 1.8 * s;
      c.beginPath(); c.moveTo(0, -1 * s); c.quadraticCurveTo(px * 0.4, py * 0.8 - 6.8 * s, px, py); c.stroke();
      var Lf = (32 + al() * 20) * s;
      var fond2 = i > 2 && i < 7;
      /* aucune fente, quatre trous : avec des fentes tous les
         quatre échantillons la feuille redevenait un peigne, et un
         philodendron ressemblait à une fougère. Ce qui le
         caractérise, c'est une feuille PLEINE et percée. */
      jPagaie(c, px, py, a2 * 0.55 - 1.05, Lf, Lf * 0.54, Lf * 0.16,
              0, 4, vertJ(fond2 ? 0.30 : 0.64 + al() * 0.30), vertJ(0.08), gr + i * 7);
    }

  }else if(v === 2){
    /* L'HÉLICONIA (bec de perroquet). Feuilles dressées serrées et
       une inflorescence rouge et jaune en zigzag. C'est la fleur
       qui compte : elle vaut vingt feuilles pour l'œil. */
    for(i = 0; i < 6; i++){
      var a3 = -2.5 + i / 5 * 1.1 + (al() - 0.5) * 0.2;
      var L3 = (52 + al() * 30) * s;
      jPagaie(c, (al() - 0.5) * 6 * s, -1 * s, a3, L3, L3 * 0.15, L3 * 0.16 * (i % 2 ? 1 : -1),
              0, 0, vertJ(0.26 + al() * 0.44), vertJ(0.08), gr + i);
    }
    var hx = 4 * s, hy = -52 * s;
    c.strokeStyle = vertJ(0.3); c.lineWidth = 2 * s;
    c.beginPath(); c.moveTo(2 * s, -6 * s); c.lineTo(hx, hy); c.stroke();
    for(i = 0; i < 6; i++){
      var cote = i % 2 ? 1 : -1;
      var by2 = hy + i * 6.5 * s;
      c.fillStyle = i % 2 ? VJ.fleur : ecl(VJ.fleur, 0.86);
      c.beginPath();
      c.moveTo(hx, by2);
      c.quadraticCurveTo(hx + cote * 11 * s, by2 - 4 * s, hx + cote * 15 * s, by2 + 1 * s);
      c.quadraticCurveTo(hx + cote * 9 * s, by2 + 4 * s, hx, by2 + 3.4 * s);
      c.closePath(); c.fill();
      c.fillStyle = "#ffd257";
      c.beginPath();
      c.ellipse(hx + cote * 9 * s, by2 + 1.4 * s, 3.4 * s, 1.1 * s, cote * 0.2, 0, 6.2832);
      c.fill();
    }

  }else if(v === 3){
    /* L'OREILLE D'ÉLÉPHANT (taro). Trois ou quatre feuilles énormes,
       en cœur, tenues très haut sur des pétioles nus. Le contraste
       entre la finesse des tiges et la masse des feuilles est tout
       l'effet. */
    for(i = 0; i < 4; i++){
      var a4 = -2.62 + i / 3 * 1.9;
      var hh = (50 + al() * 32) * s;
      var tx = Math.cos(a4) * hh * 0.58, ty = -hh;
      /* pétiole en deux passes, sombre puis clair : au trait unique
         il se confondait avec le feuillage et les quatre feuilles
         avaient l'air de flotter en l'air */
      c.strokeStyle = vertJ(0.04); c.lineWidth = 4.4 * s; c.lineCap = "round";
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(tx * 0.3, ty * 0.6, tx, ty); c.stroke();
      c.strokeStyle = vertJ(0.50); c.lineWidth = 2.2 * s;
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(tx * 0.3, ty * 0.6, tx, ty); c.stroke();
      var Lc = (30 + al() * 12) * s;
      /* pointe vers le BAS : c'est ainsi qu'une oreille d'éléphant
         pend, et ça la distingue de tout le reste de la carte.
         Les deux feuilles du fond sont franchement plus sombres —
         quatre feuilles de la même valeur formaient une seule tache
         découpée en trèfle. */
      jPagaie(c, tx, ty, 1.25 + Math.cos(a4) * 0.45, Lc, Lc * 0.58, Lc * 0.12,
              0, 0, vertJ(i < 2 ? 0.26 : 0.62 + al() * 0.26), vertJ(0.10), gr + i * 3);
    }

  }else{
    /* LA BROMÉLIACÉE GÉANTE. Rosette basse et large, feuilles
       rigides bordées de rouge, et un épi orange au centre. Elle
       est la seule à être plus large que haute : elle sert à
       meubler les creux entre deux buissons. */
    for(i = 0; i < 18; i++){
      var a5 = -3.1416 + i / 17 * 3.1416 + (al() - 0.5) * 0.16;
      var L5 = (38 + al() * 28) * s;
      var bord = al() < 0.35;
      var fond5 = i > 3 && i < 13;
      /* feuilles ÉPAISSES (0,22 et non 0,13) : à treize centièmes
         c'étaient des fils de fer, et la rosette ne faisait pas
         masse */
      jFeuille(c, 0, -3 * s, L5, L5 * 0.26, a5, vertJ(fond5 ? 0.10 : 0.40 + al() * 0.44));
      if(bord){
        c.strokeStyle = rgba(VJ.fleur, 0.55); c.lineWidth = 1.1 * s;
        c.beginPath(); c.moveTo(0, -3 * s);
        c.lineTo(Math.cos(a5) * L5, -3 * s + Math.sin(a5) * L5); c.stroke();
      }
    }
    /* l'épi : c'est lui qui donne à la broméliacée sa hauteur, la
       rosette seule tombait sous le minimum de la famille */
    c.strokeStyle = vertJ(0.24); c.lineWidth = 3 * s;
    c.beginPath(); c.moveTo(0, -6 * s); c.lineTo(0, -46 * s); c.stroke();
    for(i = 0; i < 7; i++){
      c.fillStyle = i % 2 ? VJ.fruit : ecl(VJ.fruit, 1.25);
      c.beginPath();
      c.ellipse((al() - 0.5) * 5 * s, -22 * s - i * 5.2 * s, 4.8 * s - i * 0.35 * s, 3.2 * s, 0, 0, 6.2832);
      c.fill();
    }
    c.fillStyle = VJ.violet;
    c.beginPath(); c.ellipse(0, -68 * s, 3 * s, 5 * s, 0, 0, 6.2832); c.fill();
    c.fillStyle = ecl(VJ.violet, 1.5);
    c.beginPath(); c.ellipse(-1 * s, -70 * s, 1.2 * s, 2.4 * s, 0, 0, 6.2832); c.fill();
  }
}

/* ================================================================
   A6 — LES HAUTES HERBES  (40 à 70)
   Semées par plaques, ce sont elles qui font les « zones de hautes
   herbes » du cahier des charges. Cinq touffes différentes, parce
   qu'une seule répétée mille fois se voit immédiatement.
   ================================================================ */
function dessineHauteHerbe(c, v, s){
  s = s || 1;
  var gr = 12119 + v * 233;
  var al = prng(gr), i;

  c.save(); c.globalAlpha = 0.24; c.fillStyle = "#000";
  c.beginPath(); c.ellipse(0, 0, 13 * s, 4.4 * s, 0, 0, 6.2832); c.fill();
  c.restore();
  /* le cœur de la touffe : une masse basse et sombre. Sans elle, une
     touffe n'est qu'un éventail de traits qui semblent plantés dans
     le vide, et à trente touffes par écran ça se voit. */
  for(i = 0; i < 7; i++){
    c.fillStyle = vertJ(0.08 + i * 0.02);
    c.beginPath();
    c.ellipse((i - 3) * 3.4 * s, -2 * s - i % 3 * 2 * s, 5 * s, 4 * s, 0, 0, 6.2832);
    c.fill();
  }

  if(v === 0 || v === 1){
    /* touffes classiques : v0 serrée et dressée, v1 large et
       retombante. Deux rangs — le rang arrière plus sombre et plus
       court, tracé d'abord. Une touffe d'un seul rang est un
       éventail plat, et il en faut BEAUCOUP de brins : à vingt, on
       voit vingt brins ; à quarante, on voit de l'herbe. */
    var n = v ? 46 : 38;
    var etal = v ? 22 : 15;
    for(i = 0; i < n; i++){
      var t = i / (n - 1);
      var arriere = (i % 5) < 2;
      var dx = (t - 0.5) * 2 * etal * s * (0.6 + al() * 0.8);
      var h = ((v ? 40 : 44) + al() * (v ? 18 : 16)) * s * (arriere ? 0.76 : 1);
      jBrin(c, (al() - 0.5) * 5 * s, 0, h, dx, 1.5 * s + al() * 1.1 * s,
            vertJ(arriere ? 0.16 + al() * 0.14 : 0.34 + al() * 0.46),
            dx * (v ? 0.6 : 0.25));
    }
  }else if(v === 2){
    /* roseau à plumeau : quelques cannes hautes, chacune coiffée
       d'une aigrette claire. C'est l'aigrette qui accroche la
       lumière au ras du sol. */
    for(i = 0; i < 7; i++){
      var hx = (i - 3) * 5 * s + (al() - 0.5) * 4 * s;
      var hh = (42 + al() * 18) * s;
      c.strokeStyle = vertJ(0.22 + al() * 0.24); c.lineWidth = 1.6 * s; c.lineCap = "round";
      c.beginPath(); c.moveTo(hx, 0); c.quadraticCurveTo(hx, -hh * 0.6, hx + (al() - 0.5) * 12 * s, -hh); c.stroke();
      var px = hx + (al() - 0.5) * 12 * s;
      c.fillStyle = i % 2 ? "#d9d0a4" : "#bdb488";
      for(var k = 0; k < 8; k++){
        c.beginPath();
        c.ellipse(px + (al() - 0.5) * 5 * s, -hh - 2 * s + k * 1.4 * s,
                  3.4 * s * (1 - k * 0.08), 1.2 * s, (al() - 0.5) * 0.8, 0, 6.2832);
        c.fill();
      }
    }
    for(i = 0; i < 18; i++)
      jBrin(c, (al() - 0.5) * 14 * s, 0, (18 + al() * 14) * s, (al() - 0.5) * 16 * s,
            1.4 * s, vertJ(0.18 + al() * 0.40), 0);

  }else if(v === 3){
    /* bambou nain : chaumes segmentés, feuilles par bouquets aux
       nœuds. Le seul vert-jaune de la famille — il éclaircit les
       plaques d'herbe. */
    for(i = 0; i < 6; i++){
      var bx = (i - 2.5) * 7 * s + (al() - 0.5) * 3 * s;
      var bh = (42 + al() * 15) * s;
      var pen = (al() - 0.5) * 14 * s;
      c.strokeStyle = "#7d9c3e"; c.lineWidth = 2.6 * s; c.lineCap = "round";
      c.beginPath(); c.moveTo(bx, 0); c.quadraticCurveTo(bx + pen * 0.3, -bh * 0.6, bx + pen, -bh); c.stroke();
      c.strokeStyle = "rgba(226,244,160,.30)"; c.lineWidth = 0.9 * s;
      c.beginPath(); c.moveTo(bx - 0.8 * s, 0); c.quadraticCurveTo(bx + pen * 0.3 - 0.8 * s, -bh * 0.6, bx + pen - 0.8 * s, -bh); c.stroke();
      for(var m = 1; m <= 4; m++){
        var ty2 = m / 5;
        var nx = bx + pen * ty2 * ty2, ny = -bh * ty2;
        c.strokeStyle = rgba("#4a5c22", 0.8); c.lineWidth = 2.8 * s;
        c.beginPath(); c.moveTo(nx - 1.6 * s, ny); c.lineTo(nx + 1.6 * s, ny); c.stroke();
        for(var f = 0; f < 3; f++)
          jFeuille(c, nx, ny, (11 + al() * 7) * s, 2 * s,
                   -0.6 - f * 0.7 + (al() - 0.5) * 0.5, vertJ(0.5 + al() * 0.35));
      }
    }
  }else{
    /* herbe à épis : basse, dense, avec des épis fins qui dépassent.
       Celle qu'on sème par centaines entre les défenses. */
    for(i = 0; i < 40; i++){
      var dx2 = (al() - 0.5) * 30 * s;
      jBrin(c, dx2 * 0.3, 0, (26 + al() * 18) * s, dx2, 1.3 * s + al() * 0.9 * s,
            vertJ((i % 4 < 2 ? 0.15 : 0.34) + al() * 0.40), dx2 * 0.4);
    }
    for(i = 0; i < 9; i++){
      var ex = (al() - 0.5) * 22 * s;
      var eh = (40 + al() * 16) * s;
      c.strokeStyle = vertJ(0.3); c.lineWidth = 1 * s;
      c.beginPath(); c.moveTo(ex * 0.3, 0); c.quadraticCurveTo(ex * 0.6, -eh * 0.6, ex, -eh); c.stroke();
      c.fillStyle = "#c7c07e";
      c.beginPath(); c.ellipse(ex, -eh - 2 * s, 1.4 * s, 5 * s, (al() - 0.5) * 0.6, 0, 6.2832); c.fill();
    }
  }
}

/* ================================================================
   A7 — LES RACINES AU SOL
   Presque plates : elles n'ont pas le droit de gêner, leur travail
   est de casser la régularité du sol et de faire croire qu'un
   grand arbre pousse hors champ.
   ================================================================ */
function dessineRacineJungle(c, v, s){
  s = s || 1;
  var gr = 15013 + v * 179;
  var al = prng(gr), i;

  /* le sol remué autour : une racine qui affleure a soulevé la
     terre, sinon elle a l'air d'un tuyau posé */
  c.save(); c.globalAlpha = 0.42; c.fillStyle = VJ.terre;
  c.beginPath(); c.ellipse(0, 0, 30 * s, 11 * s, 0, 0, 6.2832); c.fill();
  c.restore();

  function serpent(x0, x1, cy, ep, coul){
    var p0 = iso(x0 / 34, 0), p1 = iso(x1 / 34, 0);
    c.lineCap = "round";
    c.strokeStyle = ecl(coul, 0.5); c.lineWidth = ep + 2.2 * s;
    c.beginPath(); c.moveTo(p0.x, p0.y + 1); c.quadraticCurveTo((p0.x + p1.x) / 2, cy + 1, p1.x, p1.y + 1); c.stroke();
    c.strokeStyle = coul; c.lineWidth = ep;
    c.beginPath(); c.moveTo(p0.x, p0.y); c.quadraticCurveTo((p0.x + p1.x) / 2, cy, p1.x, p1.y); c.stroke();
    c.strokeStyle = "rgba(236,226,196,.16)"; c.lineWidth = Math.max(0.7, ep * 0.3);
    c.beginPath();
    c.moveTo(p0.x, p0.y - ep * 0.28);
    c.quadraticCurveTo((p0.x + p1.x) / 2, cy - ep * 0.34, p1.x, p1.y - ep * 0.28);
    c.stroke();
  }

  if(v === 0){
    serpent(-40, 40, -11 * s, 10 * s, VJ.ecorce);
    serpent(-24, 34, 8 * s, 7 * s, ecl(VJ.ecorce, 0.8));
  }else if(v === 1){
    /* entrelacs : deux racines qui se croisent, celle du dessus
       ombrant celle du dessous — c'est cette ombre qui donne le
       relief sur un objet presque plat */
    serpent(-42, 30, 9 * s, 8 * s, ecl(VJ.ecorce, 0.72));
    c.save(); c.globalAlpha = 0.4; c.fillStyle = "#000";
    c.beginPath(); c.ellipse(0, 2 * s, 15 * s, 5.5 * s, 0, 0, 6.2832); c.fill();
    c.restore();
    serpent(-30, 44, -12 * s, 10.5 * s, VJ.ecorce);
  }else if(v === 2){
    /* racine arquée : elle sort de terre et y replonge, avec du vide
       dessous. Le petit noir sous l'arche est ce qui vend le
       volume. */
    var g0 = iso(-34 / 34, 0), g1 = iso(34 / 34, 0);
    c.fillStyle = "rgba(0,0,0,.55)";
    c.beginPath();
    c.moveTo(g0.x + 6 * s, g0.y); c.quadraticCurveTo(0, -13 * s, g1.x - 6 * s, g1.y);
    c.quadraticCurveTo(0, -3 * s, g0.x + 6 * s, g0.y);
    c.closePath(); c.fill();
    serpent(-38, 38, -24 * s, 10 * s, VJ.ecorce);
    for(i = 0; i < 4; i++)
      jFeuille(c, (al() - 0.5) * 40 * s, -1 * s, 9 * s, 3 * s, -1.9 + (al() - 0.5) * 1.2, vertJ(0.3 + al() * 0.3));
  }else{
    /* racine et sa flaque : dans une jungle l'eau stagne partout, et
       une flaque claire au ras du sol est le seul reflet de la
       carte */
    serpent(-38, 20, -7 * s, 5 * s, ecl(VJ.ecorce, 0.85));
    c.fillStyle = rgba(VJ.eau, 0.75);
    c.beginPath(); c.ellipse(14 * s, 4 * s, 17 * s, 6.4 * s, 0.12, 0, 6.2832); c.fill();
    c.fillStyle = "rgba(180,240,224,.28)";
    c.beginPath(); c.ellipse(10 * s, 2.4 * s, 7 * s, 1.8 * s, 0.12, 0, 6.2832); c.fill();
    c.strokeStyle = rgba(VJ.rocheC, 0.22); c.lineWidth = 1 * s;
    c.beginPath(); c.ellipse(14 * s, 4 * s, 17 * s, 6.4 * s, 0.12, 0, 6.2832); c.stroke();
  }

  /* mousse et petites pousses : c'est la couche « on découvre en
     zoomant » — invisible au zoom général, indispensable de près */
  for(i = 0; i < 14; i++){
    c.fillStyle = rgba(al() < 0.5 ? VJ.mousse : VJ.fonce, 0.4 + al() * 0.4);
    c.beginPath();
    c.ellipse((al() - 0.5) * 66 * s, (al() - 0.5) * 16 * s, 2 + al() * 4 * s, 1.2 + al() * 2 * s,
              al() * 3, 0, 6.2832);
    c.fill();
  }
  for(i = 0; i < 7; i++){
    var sx = (al() - 0.5) * 56 * s;
    jFeuille(c, sx, 0, (6 + al() * 6) * s, 2 * s, -1.57 + (al() - 0.5) * 1.6, vertJ(0.4 + al() * 0.4));
  }
}

/* ================================================================
   A8 — LES ROCHERS MOUSSUS
   Le rocher du jeu (dessineRocher) est un bloc gris à facettes
   nettes : posé dans la jungle il a l'air d'être tombé d'une autre
   carte. Ici la pierre est mouillée — donc sombre, avec un seul
   éclat vif au sommet — et couverte de mousse du côté de l'ombre.
   ================================================================ */
function dessineRocherMousse(c, v, s){
  s = s || 1;
  var gr = 17389 + v * 271;
  var al = prng(gr), i, k;

  /* Un bloc. Première version : la mousse recouvrait tout et on
     obtenait un chou vert. Or c'est la PIERRE qu'on doit lire — le
     joueur doit sentir qu'il y a du dur là-dedans — et la mousse ne
     fait que la teinter. Elle ne couvre donc plus que le dessus et
     le quart bas, elle est nettement plus sombre que le feuillage
     alentour (elle vit à l'ombre), et la face verticale reste de la
     roche nue et mouillée. */
  function bloc(cx, cy, rx, h, gr2){
    var a2 = prng(gr2), n = 7, pts = [], i2;
    for(i2 = 0; i2 < n; i2++){
      var a3 = i2 / n * 6.2832;
      var rr = rx * (0.74 + a2() * 0.44);
      pts.push({ x:cx + Math.cos(a3) * rr, y:cy + Math.sin(a3) * rr * 0.42 });
    }
    /* le corps, puis le dessus : deux valeurs franches valent mieux
       qu'un dégradé, elles survivent à la réduction */
    c.fillStyle = "#252c2a";
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);
    for(i2 = 1; i2 < n; i2++) c.lineTo(pts[i2].x, pts[i2].y);
    for(i2 = n - 1; i2 >= 0; i2--) c.lineTo(pts[i2].x, pts[i2].y - h);
    c.closePath(); c.fill();
    /* la face de gauche prend la lumière comme sur tous les volumes
       ronds du jeu — sans cet écart le bloc est une découpe */
    c.save();
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);
    for(i2 = 1; i2 < n; i2++) c.lineTo(pts[i2].x, pts[i2].y);
    for(i2 = n - 1; i2 >= 0; i2--) c.lineTo(pts[i2].x, pts[i2].y - h);
    c.closePath(); c.clip();
    c.fillStyle = "rgba(160,180,176,.16)";
    c.fillRect(cx - rx * 1.5, cy - h - rx, rx * 0.85, h + rx * 2);
    c.restore();
    c.fillStyle = VJ.roche;
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y - h);
    for(i2 = 1; i2 < n; i2++) c.lineTo(pts[i2].x, pts[i2].y - h);
    c.closePath(); c.fill();
    /* l'éclat mouillé : une seule tache très claire, décalée en haut
       à gauche. C'est elle qui dit « il vient de pleuvoir ». */
    c.fillStyle = rgba(VJ.rocheC, 0.55);
    c.beginPath();
    c.ellipse(cx - rx * 0.32, cy - h - rx * 0.05, rx * 0.36, rx * 0.14, -0.2, 0, 6.2832);
    c.fill();
    c.strokeStyle = "rgba(230,244,240,.30)"; c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(pts[4].x, pts[4].y - h); c.lineTo(pts[5].x, pts[5].y - h); c.lineTo(pts[6].x, pts[6].y - h);
    c.stroke();
    /* fissures */
    c.strokeStyle = "rgba(14,20,18,.85)"; c.lineWidth = 1.2 * s;
    for(i2 = 0; i2 < 4; i2++){
      c.beginPath();
      c.moveTo(cx + (a2() - 0.5) * rx * 1.3, cy - h * (0.4 + a2() * 0.6));
      c.lineTo(cx + (a2() - 0.5) * rx * 1.3, cy - h * a2() * 0.4);
      c.stroke();
    }
    /* la mousse : sur le plateau, et une frange qui déborde de
       l'arête. Sombre — une mousse de sous-bois est plus foncée que
       les feuilles qui la surplombent, l'inverse fait plastique. */
    for(i2 = 0; i2 < 22; i2++){
      var t2 = a2() * 6.2832;
      var mr = rx * (0.15 + a2() * 0.72);
      var mx = cx + Math.cos(t2) * mr;
      var my = cy + Math.sin(t2) * mr * 0.42 - h - (a2() < 0.7 ? 0 : -a2() * h * 0.3);
      c.fillStyle = rgba(a2() < 0.75 ? "#2c4a1e" : VJ.mousse, 0.4 + a2() * 0.4);
      c.beginPath();
      c.ellipse(mx, my, 2 + a2() * rx * 0.30, 1.2 + a2() * rx * 0.12, a2() * 3, 0, 6.2832);
      c.fill();
    }
    /* quelques brins clairs sur la crête : le seul vert vif du
       rocher, et il ne tient qu'à trois taches */
    for(i2 = 0; i2 < 7; i2++)
      jFeuille(c, cx + (a2() - 0.5) * rx * 1.5, cy - h - rx * 0.1,
               3 + a2() * 5, 1.4, -1.57 + (a2() - 0.5) * 1.4, vertJ(0.42 + a2() * 0.3));
  }

  c.save(); c.globalAlpha = 0.32; c.fillStyle = "#000";
  c.beginPath(); c.ellipse(0, 1, 26 * s, 9 * s, 0, 0, 6.2832); c.fill();
  c.restore();

  if(v === 0){
    bloc(0, 0, 22 * s, 26 * s, gr);
  }else if(v === 1){
    /* rocher fendu : une fougère a pris racine dans la fissure.
       C'est l'image même de la jungle qui reprend le terrain. */
    bloc(-4 * s, 0, 20 * s, 30 * s, gr);
    c.fillStyle = "rgba(0,0,0,.62)";
    c.beginPath();
    c.moveTo(-2 * s, -30 * s); c.lineTo(3 * s, -12 * s); c.lineTo(6 * s, -13 * s); c.lineTo(2 * s, -30 * s);
    c.closePath(); c.fill();
    for(i = 0; i < 7; i++){
      var a = -3.0 + i / 6 * 2.2;
      jFronde(c, 2 * s, -29 * s, a, 24 * s, 6.4 * s, 9, vertJ(0.12), vertJ(0.46 + al() * 0.3), 7 * s);
    }
  }else if(v === 2){
    /* galet bas et large, poli, noyé dans la mousse — mais la mousse
       reste sombre : c'est un tapis d'ombre, pas une pelouse */
    bloc(0, 0, 26 * s, 12 * s, gr);
    for(i = 0; i < 16; i++){
      c.fillStyle = rgba(i % 4 ? "#2c4a1e" : VJ.mousse, 0.36 + al() * 0.36);
      c.beginPath();
      c.ellipse((al() - 0.5) * 46 * s, -12 * s + (al() - 0.5) * 8 * s,
                2.4 + al() * 5 * s, 1.3 + al() * 2.2 * s, al() * 3, 0, 6.2832);
      c.fill();
    }
  }else{
    /* amas : un gros bloc, un petit devant. Le petit devant donne la
       profondeur pour trois traits de plus. */
    bloc(6 * s, -3 * s, 19 * s, 30 * s, gr);
    bloc(-13 * s, 3 * s, 12 * s, 14 * s, gr + 99);
  }

  /* suintement au pied : une jungle est mouillée, et c'est ce reflet
     sombre qui distingue ces rochers de ceux des autres cartes */
  c.fillStyle = rgba(VJ.eau, 0.34);
  c.beginPath(); c.ellipse(2 * s, 5 * s, 24 * s, 6 * s, 0, 0, 6.2832); c.fill();
  for(k = 0; k < 5; k++)
    jFeuille(c, (al() - 0.5) * 44 * s, 2 * s, (8 + al() * 7) * s, 2.6 * s,
             -1.57 + (al() - 0.5) * 1.8, vertJ(0.3 + al() * 0.4));
}

/* ================================================================
   LA BANQUE DE SPRITES
   ================================================================
   Point d'entrée que le contrat ne prévoyait pas et que j'ajoute
   ici : les arbres ne tiennent pas dans le cadre SD du décor
   existant, ils ont donc leur propre cadre, leur propre banque et
   leur propre blit. L'appelant n'a besoin que de trois choses :
     construitSpritesFlore()          — une fois, au chargement carte
     choisitFlore(famille, al)        — un index de sprite au hasard
     dessineFloreMonde(c, o)          — o = { gx, gy, sp }
   Chaque sprite est DÉTOURÉ à sa boîte d'alphas : un grand arbre
   n'occupe qu'une fraction de son cadre de 300×420, et garder le
   cadre entier reviendrait à payer le vide au prix de l'image.
   ================================================================ */
var spFlore = [];
var FLORE_FAM = {};             // famille -> tableau d'index dans spFlore

function nouveauSpriteFlore(dessin, W, H, OX, OY, ECH){
  var cv = nouveauCanvas(W * ECH, H * ECH);
  var c = cv.getContext("2d");
  c.setTransform(ECH, 0, 0, ECH, OX * ECH, OY * ECH);
  dessin(c);
  /* Détourage : on ne garde que ce qui a de l'alpha.
     On cherche les QUATRE BORDS SÉPARÉMENT, en s'arrêtant à la
     première trace rencontrée sur chaque ligne ou chaque colonne, au
     lieu de balayer les cinquante-six cadres entiers. La version
     exhaustive lisait cinq millions et demi de pixels et pesait plus
     lourd que tous les tracés réunis ; celle-ci n'en lit qu'une
     frange. La banque n'est construite qu'une fois, mais elle l'est
     pendant le chargement de la carte, à côté d'un construitSol qui
     coûte déjà quatre dixièmes de seconde : c'est exactement le
     moment où un dixième de plus se voit. */
  var w = cv.width, h = cv.height;
  var d = c.getImageData(0, 0, w, h).data;
  var x0 = -1, y0 = -1, x1 = -1, y1 = -1, x, y, o, vu;
  for(y = 0; y < h && y0 < 0; y++){
    for(x = 0, o = y * w * 4 + 3; x < w; x++, o += 4) if(d[o] > 3){ y0 = y; break; }
  }
  if(y0 < 0){                                   // sprite vide : cadre minimal
    x0 = 0; y0 = 0; x1 = 1; y1 = 1;
  }else{
    for(y = h - 1; y >= y0; y--){
      vu = 0;
      for(x = 0, o = y * w * 4 + 3; x < w; x++, o += 4) if(d[o] > 3){ vu = 1; break; }
      if(vu){ y1 = y; break; }
    }
    for(x = 0; x < w && x0 < 0; x++){
      for(y = y0, o = (y0 * w + x) * 4 + 3; y <= y1; y++, o += w * 4) if(d[o] > 3){ x0 = x; break; }
    }
    for(x = w - 1; x >= x0; x--){
      vu = 0;
      for(y = y0, o = (y0 * w + x) * 4 + 3; y <= y1; y++, o += w * 4) if(d[o] > 3){ vu = 1; break; }
      if(vu){ x1 = x; break; }
    }
  }
  var cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  var cv2 = nouveauCanvas(cw, ch);
  cv2.getContext("2d").drawImage(cv, x0, y0, cw, ch, 0, 0, cw, ch);
  /* les décalages sont convertis en unités locales : le blit n'a
     alors plus qu'à multiplier par cam.z */
  return {
    cv:cv2,
    ex:(OX * ECH - x0) / ECH, ey:(OY * ECH - y0) / ECH,
    w:cw / ECH, h:ch / ECH
  };
}

function construitSpritesFlore(){
  if(spFlore.length) return;
  var v, t;
  function fam(nom, dessin, nv, tailles, W, H, OX, OY, ECH){
    var liste = [];
    for(v = 0; v < nv; v++){
      for(t = 0; t < tailles.length; t++){
        (function(v2, s2){
          liste.push(spFlore.length);
          spFlore.push(nouveauSpriteFlore(function(c){ dessin(c, v2, s2); }, W, H, OX, OY, ECH));
        })(v, tailles[t]);
      }
    }
    FLORE_FAM[nom] = liste;
  }
  /* 56 sprites en tout. Deux tailles là où l'objet se répète
     beaucoup (arbres, buissons, herbes, plantes), une seule là où la
     forme est déjà très marquée (lianes, fougères, racines,
     rochers) — une variante de plus y sert davantage qu'un
     changement d'échelle. */
  fam("arbre",   dessineArbreJungle,     6, [0.92, 1.18], SJ_W, SJ_H, SJ_OX, SJ_OY, SJ_ECH);
  fam("liane",   dessineLianeJungle,     4, [1.00],       SJ_W, SJ_H, SJ_OX, SJ_OY, SJ_ECH);
  fam("plante",  dessinePlanteTropicale, 5, [0.85, 1.15], SF_W, SF_H, SF_OX, SF_OY, SF_ECH);
  fam("buisson", dessineBuissonJungle,   4, [0.85, 1.20], SF_W, SF_H, SF_OX, SF_OY, SF_ECH);
  fam("herbe",   dessineHauteHerbe,      5, [0.86, 1.10], SF_W, SF_H, SF_OX, SF_OY, SF_ECH);
  fam("fougere", dessineFougere,         4, [1.05],       SF_W, SF_H, SF_OX, SF_OY, SF_ECH);
  fam("racine",  dessineRacineJungle,    4, [1.00],       SF_W, SF_H, SF_OX, SF_OY, SF_ECH);
  fam("rocher",  dessineRocherMousse,    4, [1.00],       SF_W, SF_H, SF_OX, SF_OY, SF_ECH);
}

/* Renvoie un index de sprite de la famille demandée. `al` est un
   tirage 0..1 — passer le prng de la carte garde le semis
   reproductible d'une partie à l'autre. */
function choisitFlore(famille, al){
  var l = FLORE_FAM[famille];
  if(!l || !l.length) return -1;
  return l[Math.min(l.length - 1, Math.floor(al * l.length))];
}

/* Le blit. Même contrat que dessineDecorMonde : l'objet porte sa
   case et son index de sprite, et rien n'est calculé par image que
   la position écran. */
function dessineFloreMonde(c, o){
  var sp = spFlore[o.sp];
  if(!sp) return;
  var p = versEcran(cam, o.gx, o.gy);
  var z = cam.z;
  c.drawImage(sp.cv, p.x - sp.ex * z, p.y - sp.ey * z, sp.w * z, sp.h * z);
}

/* Poids mémoire de la banque, en octets — pour pouvoir le vérifier
   au banc plutôt que de l'estimer. */
function poidsFlore(){
  var n = 0;
  for(var i = 0; i < spFlore.length; i++) n += spFlore[i].cv.width * spFlore[i].cv.height * 4;
  return n;
}
