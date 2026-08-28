/* ================================================================
   LES DÉCORS DES « MILY ET UNE NUITS »

   PAS DE BÂTIMENTS. C'est la leçon de la première version, et elle
   valait d'être apprise en la voyant : cette carte porte déjà des
   bâtiments — les défenses, les tours de guet, les batteries — et ils
   sont grands, gris et militaires. Y ajouter des petits palais blancs
   donnait deux architectures à deux échelles sur la même image, et
   aucune des deux ne gagnait : les palais passaient pour des jouets
   posés entre les canons.

   Ce fichier ne contient donc plus que de l'ORNEMENT DE SOL — des
   choses basses, qui décorent la terre au lieu de lui disputer le
   ciel :

     v = 0   LE JARDIN      fleurs lumineuses, cyprès de nuit, palmes
     v = 1   LES LANTERNES  bornes, guirlandes, mâts à lanternes
     v = 2   LA FONTAINE    la pièce maîtresse, à trois tailles
     v = 3   LE TAPIS       tapis, coussins, brasero, plateau à thé

   LA FONTAINE EST LE SUJET. « Une vraie belle fontaine avec de l'eau
   magique. » Elle a donc tout ce qu'on peut lui donner : des vasques à
   huit pans bordées de mosaïque, une eau qui s'éclaire d'elle-même,
   des anneaux de rides, des jets en arc, des voiles d'eau qui
   débordent d'un étage à l'autre, de la brume au ras du bassin, des
   nénuphars, des lotus ouverts et des étoiles qui flottent au-dessus.
   C'est le seul objet de l'île qui ait le droit d'être compliqué —
   tout le reste est sobre pour qu'elle puisse ne pas l'être.

   TROIS CONTRAINTES DU MOTEUR, comme pour 31-decors-nouveaux.js :
     1. Tout est PRÉ-RENDU une fois. Aucun Math.random(), aucun temps :
        une lanterne est allumée à une heure choisie, pour toujours, et
        un jet d'eau est figé en plein vol. Ce qu'on cherche n'est donc
        pas le mouvement mais la SILHOUETTE du mouvement.
     2. On reçoit gx, gy EN CASES ; iso() donne le point à l'écran, et
        tout le reste se mesure en pixels multipliés par `s`.
     3. L'ORDRE dans dessineDecor() est l'identité des objets. On
        ajoute à la fin, on n'intercale jamais.

   QUATRE EMPLACEMENTS, DOUZE FORMES. Le moteur ne tire que quatre
   variantes par île et en pré-cuit trois tailles chacune. Chaque
   variante lit donc SA TAILLE et change de forme avec elle : une
   vasque, une fontaine à étages et une grande fontaine ne sont pas le
   même objet agrandi, ce sont trois objets.
   ================================================================ */

/* La bande de taille : 0 petit, 1 moyen, 2 grand. Elle suit
   exactement le découpage de dessineDecorMonde, pour que la
   silhouette pré-cuite soit bien celle qu'on croit. */
function bandeNuits(s){ return s < 1.0 ? 0 : (s < 1.18 ? 1 : 2); }

/* La palette de l'île, en un seul endroit. Le blanc n'est jamais
   blanc : c'est de la pierre sous la lune, donc lilas. */
var NUI = {
  pierre:"#cdc4ee", pierreO:"#8b82bd", pierreN:"#544c86",
  ombre:"rgba(10,8,30,.34)",
  or:"#f2dc9a", orO:"#c39e46", orN:"#8a6c26",
  turq:"#3fd6cc", turqO:"#1b8a92", turqN:"#0f4c58",
  lampe:"255,196,110", lampeF:"255,150,60",
  eau:"120,246,236",
  soie:["#8c2440", "#4a2a80", "#1f4c7a", "#7a2a68"],
  soieO:["#5c1228", "#2e1a56", "#12304e", "#4e1642"],
  feuille:"#2c6a5e", feuilleC:"#3f8f7a",
  fleur:["#8fd8ff", "#c79cff", "#ffd48a", "#ff9ec8"]
};

/* Une ombre portée au sol, commune à tout ce qui pose ici. */
function ombreNuits(c, x, y, rx, ry){
  c.fillStyle = NUI.ombre;
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 6.2832); c.fill();
}

/* lueurRapide veut « r,v,b » et non « #rrggbb ». La conversion vit
   ici plutôt que dans chaque appel. */
function hexRgbNuits(h){
  var n = parseInt(h.slice(1), 16);
  return ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255);
}

/* Un polygone régulier à N pans, écrasé en isométrie. C'est la forme
   de toutes les vasques : une vasque ronde est une vasque de square,
   une vasque à huit pans est une vasque de palais. */
function pansNuits(c, x, y, rx, ry, n, phase){
  c.beginPath();
  for(var i = 0; i < n; i++){
    var a = phase + i / n * 6.2832;
    var px = x + Math.cos(a) * rx, py = y + Math.sin(a) * ry;
    if(i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.closePath();
}

/* Une lanterne : le fil, le corps à six pans, la flamme. C'est
   l'objet le plus répété de l'île — il est donc écrit pour être bon
   marché, et généreux en lumière : c'est elle qu'on voit de loin,
   avant toute autre chose.
   DEUX HALOS, et c'est ce qui la fait exister : un large et pâle qui
   pose la lumière sur le sol, un serré et vif qui fait le point
   brûlant. Un seul des deux donne soit une tache molle, soit un point
   sec. */
function lanterneNuits(c, x, y, taille, fil, teinte){
  var t = teinte || NUI.lampe;
  if(fil > 0){
    c.strokeStyle = "rgba(190,180,220,.5)";
    c.lineWidth = Math.max(0.5, taille * 0.13);
    c.beginPath(); c.moveTo(x, y - fil); c.lineTo(x, y); c.stroke();
  }
  /* TROIS HALOS, et c'est l'étalonnage de nuit qui l'exige : le
     soft-light passé sur la carte pousse les demi-tons vers le bleu,
     et un halo doré posé à mi-intensité en fait partie. Seul un halo
     très intense reste de l'or. On empile donc du large et pâle vers
     l'étroit et brûlant, jusqu'à saturer le cœur. */
  lueurRapide(c, x, y + taille * 0.7, taille * 10.0, t, 0.34);
  lueurRapide(c, x, y + taille * 0.7, taille * 4.4, t, 0.72);
  lueurRapide(c, x, y + taille * 0.7, taille * 1.9, t, 1.0);
  c.fillStyle = "rgba(" + t + ",.92)";
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + taille * 0.62, y + taille * 0.42);
  c.lineTo(x + taille * 0.5,  y + taille * 1.34);
  c.lineTo(x, y + taille * 1.72);
  c.lineTo(x - taille * 0.5,  y + taille * 1.34);
  c.lineTo(x - taille * 0.62, y + taille * 0.42);
  c.closePath(); c.fill();
  c.fillStyle = NUI.orO;
  c.fillRect(x - taille * 0.24, y - taille * 0.22, taille * 0.48, taille * 0.3);
  c.beginPath();
  c.moveTo(x, y + taille * 1.72);
  c.lineTo(x + taille * 0.18, y + taille * 2.1);
  c.lineTo(x - taille * 0.18, y + taille * 2.1);
  c.closePath(); c.fill();
  c.fillStyle = "rgba(255,248,220,.92)";
  c.beginPath();
  c.ellipse(x, y + taille * 0.86, taille * 0.26, taille * 0.44, 0, 0, 6.2832);
  c.fill();
}

/* Une borne à lanterne : la colonnette torsadée et sa lampe. */
function borneNuits(c, x, y, h, ep, taille, teinte){
  c.fillStyle = NUI.pierreN;
  c.beginPath(); c.ellipse(x, y, ep * 3.0, ep * 1.4, 0, 0, 6.2832); c.fill();
  c.fillStyle = NUI.pierreO;
  c.fillRect(x - ep, y - h, ep * 2, h);
  c.fillStyle = NUI.pierre;
  c.fillRect(x - ep, y - h, ep * 0.72, h);
  c.strokeStyle = "rgba(30,22,62,.35)";
  c.lineWidth = ep * 0.5;
  for(var t = 1; t < 6; t++){
    var yt = y - h * t / 6;
    c.beginPath(); c.moveTo(x - ep, yt); c.lineTo(x + ep, yt - ep); c.stroke();
  }
  c.fillStyle = NUI.orO;
  c.fillRect(x - ep * 1.8, y - h - ep, ep * 3.6, ep * 1.1);
  lanterneNuits(c, x, y - h - ep * 0.7, taille, 0, teinte);
}

/* Un brasero : la vasque sur trois pieds, les braises, la fumée.
   C'est la seule flamme de l'île, et c'est ce qui la réchauffe. */
function braseroNuits(c, x, y, s){
  ombreNuits(c, x, y, 7 * s, 3.2 * s);
  c.strokeStyle = NUI.orN;
  c.lineWidth = 1.1 * s;
  for(var i = -1; i <= 1; i += 1){
    c.beginPath();
    c.moveTo(x + i * 3.4 * s, y);
    c.lineTo(x + i * 1.4 * s, y - 6 * s);
    c.stroke();
  }
  c.fillStyle = NUI.orO;
  c.beginPath(); c.ellipse(x, y - 6.4 * s, 5.4 * s, 2.2 * s, 0, 0, 6.2832); c.fill();
  c.fillStyle = NUI.or;
  c.beginPath(); c.ellipse(x, y - 7.0 * s, 5.4 * s, 2.0 * s, 0, 0, 6.2832); c.fill();
  lueurRapide(c, x, y - 8 * s, 26 * s, NUI.lampeF, 0.62);
  c.fillStyle = "rgba(255,170,70,.95)";
  c.beginPath(); c.ellipse(x, y - 7.6 * s, 3.6 * s, 1.5 * s, 0, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,236,180,.95)";
  c.beginPath(); c.ellipse(x - 0.6 * s, y - 8.4 * s, 1.9 * s, 1.5 * s, 0, 0, 6.2832); c.fill();
  c.strokeStyle = "rgba(210,190,230,.12)";
  c.lineWidth = 1.6 * s;
  c.lineCap = "round";
  for(var k = -1; k <= 1; k += 2){
    c.beginPath();
    c.moveTo(x + k * 1.2 * s, y - 9 * s);
    c.quadraticCurveTo(x + k * 5 * s, y - 15 * s, x + k * 1.6 * s, y - 21 * s);
    c.stroke();
  }
}

/* Une fleur lumineuse : cinq pétales, un cœur clair, un halo. Cinq
   parce qu'à cette taille six font une roue et quatre une croix. */
function fleurNuits(c, x, y, r, coul){
  lueurRapide(c, x, y, r * 6.5, hexRgbNuits(coul), 0.42);
  c.fillStyle = coul;
  for(var i = 0; i < 5; i++){
    var a = i / 5 * 6.2832 - 1.2;
    c.beginPath();
    c.ellipse(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.5,
              r * 0.52, r * 0.34, a, 0, 6.2832);
    c.fill();
  }
  c.fillStyle = "rgba(255,250,225,.9)";
  c.beginPath(); c.ellipse(x, y, r * 0.3, r * 0.24, 0, 0, 6.2832); c.fill();
}

/* ================================================================
   VARIANTE 0 — LE JARDIN
   De la verdure « élégante, pas dense » : rien ne pousse en masse
   ici, tout est planté. Trois massifs selon la taille.
   ================================================================ */
function jardinNuits(c, gx, gy, s){
  var p = iso(gx, gy), x = p.x, y = p.y, b = bandeNuits(s);
  var k = s * (b === 2 ? 1.22 : b === 1 ? 1.36 : 1.55);

  /* Une touffe : des feuilles en éventail depuis un point. */
  function touffe(cx, cy, h, larg, n, coul){
    c.strokeStyle = coul;
    c.lineCap = "round";
    c.lineWidth = 1.5 * k;
    for(var i = 0; i < n; i++){
      var u = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
      c.beginPath();
      c.moveTo(cx, cy);
      c.quadraticCurveTo(cx + u * larg * 0.5, cy - h * 0.75,
                         cx + u * larg, cy - h * (1 - Math.abs(u) * 0.42));
      c.stroke();
    }
  }
  /* La bordure de pierre d'un massif : un ovale de dalles pâles avec
     de la terre sombre dedans. C'est elle qui dit « planté » plutôt
     que « poussé tout seul ». */
  function bordure(cx, cy, rx, ry){
    c.fillStyle = NUI.pierreN;
    c.beginPath(); c.ellipse(cx, cy + 1.2 * k, rx, ry, 0, 0, 6.2832); c.fill();
    c.fillStyle = NUI.pierreO;
    c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, 6.2832); c.fill();
    c.fillStyle = "#241d4a";
    c.beginPath(); c.ellipse(cx, cy, rx * 0.82, ry * 0.78, 0, 0, 6.2832); c.fill();
  }

  if(b === 0){
    /* LE MASSIF FLEURI. Bas, large, très éclairé : c'est lui qui sème
       la couleur au sol entre les défenses. */
    ombreNuits(c, x, y, 13 * k, 6 * k);
    bordure(x, y, 12 * k, 5.6 * k);
    touffe(x, y - 1 * k, 9 * k, 8 * k, 7, NUI.feuille);
    touffe(x - 4 * k, y, 7 * k, 6 * k, 5, NUI.feuilleC);
    fleurNuits(c, x - 5 * k, y - 6 * k, 2.6 * k, NUI.fleur[0]);
    fleurNuits(c, x + 3 * k, y - 8 * k, 2.9 * k, NUI.fleur[1]);
    fleurNuits(c, x + 6 * k, y - 4 * k, 2.3 * k, NUI.fleur[3]);
    fleurNuits(c, x - 1 * k, y - 4 * k, 2.1 * k, NUI.fleur[2]);

  }else if(b === 1){
    /* LE CYPRÈS DE NUIT. Une seule verticale sombre et fine — c'est
       ce qui donne du rythme à une carte entièrement basse. Piqué de
       deux fleurs pour ne pas être un trou noir. */
    ombreNuits(c, x, y, 8 * k, 3.6 * k);
    bordure(x, y, 7.4 * k, 3.4 * k);
    var h1 = 40 * k;
    var g1 = c.createLinearGradient(x - 5 * k, 0, x + 5 * k, 0);
    g1.addColorStop(0, "#3c7e6e");
    g1.addColorStop(0.45, "#1f4c46");
    g1.addColorStop(1, "#132f2e");
    c.fillStyle = g1;
    c.beginPath();
    c.moveTo(x, y - h1);
    c.bezierCurveTo(x + 5.4 * k, y - h1 * 0.55, x + 4.2 * k, y - h1 * 0.12, x + 2.6 * k, y);
    c.lineTo(x - 2.6 * k, y);
    c.bezierCurveTo(x - 4.2 * k, y - h1 * 0.12, x - 5.4 * k, y - h1 * 0.55, x, y - h1);
    c.closePath(); c.fill();
    /* les écailles du feuillage */
    c.strokeStyle = "rgba(150,230,205,.16)";
    c.lineWidth = 0.9 * k;
    for(var j = 1; j < 8; j++){
      var yy = y - h1 * j / 8, ww = 4.6 * k * (1 - Math.abs(j / 8 - 0.35) * 0.7);
      c.beginPath();
      c.moveTo(x - ww, yy + 1.6 * k); c.quadraticCurveTo(x, yy - 1 * k, x + ww, yy + 1.6 * k);
      c.stroke();
    }
    lueurRapide(c, x + 2 * k, y - h1 * 0.7, 12 * k, "150,240,210", 0.3);
    fleurNuits(c, x - 5 * k, y - 3 * k, 2.4 * k, NUI.fleur[1]);
    fleurNuits(c, x + 5 * k, y - 2 * k, 2.1 * k, NUI.fleur[0]);

  }else{
    /* LE PETIT JARDIN. Deux palmes, un massif, quatre fleurs et une
       borne à lanterne : « en zoomant on découvre de véritables
       petites scènes ». En voici une. */
    ombreNuits(c, x, y, 22 * k, 10 * k);
    bordure(x, y, 20 * k, 9 * k);
    for(var q = -1; q <= 1; q += 2){
      var px2 = x + q * 11 * k, hp = 34 * k;
      c.strokeStyle = "#4a4076";
      c.lineWidth = 2.0 * k; c.lineCap = "round";
      c.beginPath();
      c.moveTo(px2, y - 1 * k);
      c.quadraticCurveTo(px2 + q * 3 * k, y - hp * 0.55, px2 + q * 1.4 * k, y - hp);
      c.stroke();
      for(var i2 = 0; i2 < 6; i2++){
        var a2 = -0.35 + i2 * 0.6;
        c.strokeStyle = i2 % 2 ? NUI.feuille : NUI.feuilleC;
        c.lineWidth = 1.8 * k;
        c.beginPath();
        c.moveTo(px2 + q * 1.4 * k, y - hp);
        c.quadraticCurveTo(px2 + q * 1.4 * k + Math.cos(a2) * 7 * k,
                           y - hp - 3.4 * k + Math.sin(a2) * 4 * k,
                           px2 + q * 1.4 * k + Math.cos(a2) * 12 * k,
                           y - hp + 6 * k + Math.sin(a2) * 7 * k);
        c.stroke();
      }
    }
    touffe(x, y - 1 * k, 12 * k, 11 * k, 9, NUI.feuille);
    touffe(x - 5 * k, y, 9 * k, 8 * k, 6, NUI.feuilleC);
    fleurNuits(c, x - 6 * k, y - 8 * k, 3.0 * k, NUI.fleur[0]);
    fleurNuits(c, x + 2 * k, y - 11 * k, 3.2 * k, NUI.fleur[1]);
    fleurNuits(c, x + 7 * k, y - 6 * k, 2.6 * k, NUI.fleur[3]);
    fleurNuits(c, x - 2 * k, y - 5 * k, 2.4 * k, NUI.fleur[2]);
    borneNuits(c, x + 17 * k, y, 15 * k, 1.4 * k, 3.0 * k);
  }
}

/* ================================================================
   VARIANTE 1 — LES LANTERNES
   « Les lanternes doivent jouer un rôle majeur dans la décoration :
   au sol, suspendues, en guirlandes, le long des chemins. » C'est
   leur variante entière, et c'est elle qui allume l'île.
   ================================================================ */
var NUI_TEINTES = ["255,196,110", "255,150,90", "150,220,255", "210,150,255"];
function lanternesNuits(c, gx, gy, s){
  var p = iso(gx, gy), x = p.x, y = p.y, b = bandeNuits(s);
  var k = s * (b === 2 ? 1.15 : b === 1 ? 1.35 : 1.55);

  if(b === 0){
    /* LA BORNE. La plus fréquente des trois — c'est elle qui borde
       les chemins et qui, répétée cent fois, fait la constellation
       qu'on voit quand on regarde l'île entière. */
    ombreNuits(c, x, y, 6 * k, 2.8 * k);
    borneNuits(c, x, y, 20 * k, 1.5 * k, 3.4 * k);

  }else if(b === 1){
    /* LA GUIRLANDE entre deux mâts. La corde pend en parabole et les
       lanternes suivent sa courbe : c'est ce détail-là qui fait qu'on
       y croit — une guirlande dont les lampes sont alignées est une
       rampe d'éclairage. */
    ombreNuits(c, x, y, 20 * k, 7 * k);
    pieuDecor(c, x - 18 * k, y, 30 * k, 1.5 * k, NUI.pierre, NUI.pierreN);
    pieuDecor(c, x + 18 * k, y, 30 * k, 1.5 * k, NUI.pierre, NUI.pierreN);
    c.strokeStyle = "rgba(180,170,220,.55)";
    c.lineWidth = 0.9 * k;
    c.beginPath();
    c.moveTo(x - 18 * k, y - 30 * k);
    c.quadraticCurveTo(x, y - 18 * k, x + 18 * k, y - 30 * k);
    c.stroke();
    for(var i = 0; i < 5; i++){
      var u = (i + 0.5) / 5;
      var lx = x - 18 * k + u * 36 * k;
      var ly = y - 30 * k + (1 - (2 * u - 1) * (2 * u - 1)) * 12 * k;
      lanterneNuits(c, lx, ly, 2.8 * k, 0, NUI_TEINTES[i % 4]);
    }
    /* deux fanions de soie entre les lanternes */
    for(var f = 0; f < 2; f++){
      var uf = (f + 1) / 3;
      var fx = x - 18 * k + uf * 36 * k;
      var fy = y - 30 * k + (1 - (2 * uf - 1) * (2 * uf - 1)) * 12 * k;
      c.globalAlpha = 0.7;
      c.fillStyle = NUI.soie[(f + 1) % 4];
      c.beginPath();
      c.moveTo(fx - 2.4 * k, fy); c.lineTo(fx + 2.4 * k, fy);
      c.lineTo(fx, fy + 5 * k);
      c.closePath(); c.fill();
      c.globalAlpha = 1;
    }

  }else{
    /* LE MÂT À LANTERNES. Un poteau, un croissant d'or à la pointe,
       trois cordes qui descendent en étoile, neuf lampes. C'est le
       repère lumineux de l'île — ce qu'on vise quand on cherche où
       aller. */
    ombreNuits(c, x, y, 24 * k, 10 * k);
    var hm = 46 * k;
    c.fillStyle = NUI.pierreN;
    c.beginPath(); c.ellipse(x, y, 7 * k, 3.2 * k, 0, 0, 6.2832); c.fill();
    c.fillStyle = NUI.pierreO;
    c.fillRect(x - 2.2 * k, y - hm, 4.4 * k, hm);
    c.fillStyle = NUI.pierre;
    c.fillRect(x - 2.2 * k, y - hm, 1.5 * k, hm);
    c.fillStyle = NUI.orO;
    c.fillRect(x - 3.6 * k, y - hm - 2 * k, 7.2 * k, 2.2 * k);
    c.fillStyle = NUI.or;
    c.beginPath();
    c.arc(x, y - hm - 6 * k, 3.4 * k, 0, 6.2832);
    c.arc(x + 1.6 * k, y - hm - 6.8 * k, 3.0 * k, 0, 6.2832, true);
    c.fill();
    lueurRapide(c, x, y - hm - 6 * k, 22 * k, NUI.lampe, 0.4);
    /* les trois cordes et leurs lanternes. Le point courant d'une
       corde est calculé sur la MÊME courbe de Bézier que celle qu'on
       trace — sinon les lampes flottent à côté du fil. */
    var ancres = [[-22, -8], [0, -26], [22, -8]];
    for(var q2 = 0; q2 < 3; q2++){
      var ax = x + ancres[q2][0] * k, ay = y + ancres[q2][1] * k;
      var mx = (x + ax) / 2, my = y - hm * 0.42;
      c.strokeStyle = "rgba(180,170,220,.45)";
      c.lineWidth = 0.8 * k;
      c.beginPath();
      c.moveTo(x, y - hm + 1 * k);
      c.quadraticCurveTo(mx, my, ax, ay);
      c.stroke();
      for(var j2 = 1; j2 <= 3; j2++){
        var u2 = j2 / 4, v2 = 1 - u2;
        var bx2 = v2 * v2 * x + 2 * v2 * u2 * mx + u2 * u2 * ax;
        var by2 = v2 * v2 * (y - hm + 1 * k) + 2 * v2 * u2 * my + u2 * u2 * ay;
        lanterneNuits(c, bx2, by2, 2.6 * k, 0, NUI_TEINTES[(q2 + j2) & 3]);
      }
    }
  }
}

/* ================================================================
   VARIANTE 2 — LA FONTAINE
   ================================================================ */
function fontaineNuits(c, gx, gy, s){
  var p = iso(gx, gy), x = p.x, y = p.y, b = bandeNuits(s);
  var k = s * (b === 2 ? 1.10 : b === 1 ? 1.32 : 1.55);

  /* ---- L'EAU MAGIQUE. Cinq couches, et l'ordre compte : chacune
     corrige ce que la précédente ne peut pas faire.
       1. le halo, SOUS la nappe : c'est ce qui éclaire la pierre
          autour et fait que l'eau ÉCLAIRE au lieu d'être éclairée.
          C'est toute la différence entre « magique » et « bleue » ;
       2. la nappe, en dégradé du centre clair vers le bord sombre —
          l'inverse d'un reflet, parce que la lumière vient de
          l'intérieur ;
       3. les anneaux de rides, concentriques et décalés vers le bas ;
       4. le croissant de reflet, décentré : sans lui la nappe est un
          disque peint, avec lui c'est une surface ;
       5. les étincelles, quelques points blancs sur la ride. ---- */
  function nappe(cx, cy, rx, ry, force){
    lueurRapide(c, cx, cy, rx * 4.2, NUI.eau, force === undefined ? 0.55 : force);
    var g = c.createRadialGradient(cx, cy - ry * 0.5, rx * 0.06, cx, cy, rx);
    g.addColorStop(0, "#ddfffb");
    g.addColorStop(0.28, "#7ff0e6");
    g.addColorStop(0.68, NUI.turq);
    g.addColorStop(1, NUI.turqN);
    c.fillStyle = g;
    c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, 6.2832); c.fill();
    c.strokeStyle = "rgba(230,255,252,.28)";
    for(var i = 1; i <= 4; i++){
      var u = i / 5;
      c.lineWidth = Math.max(0.5, rx * 0.028 * (1 - u * 0.5));
      c.beginPath();
      c.ellipse(cx, cy + ry * 0.06 * i, rx * u, ry * u, 0, 0, 6.2832);
      c.stroke();
    }
    c.fillStyle = "rgba(245,255,255,.5)";
    c.beginPath();
    c.ellipse(cx - rx * 0.26, cy - ry * 0.36, rx * 0.38, ry * 0.22, -0.35, 0, 6.2832);
    c.fill();
    c.fillStyle = "rgba(255,255,255,.85)";
    for(var e = 0; e < 5; e++){
      var ae = 0.6 + e * 1.15;
      c.beginPath();
      c.ellipse(cx + Math.cos(ae) * rx * 0.55, cy + Math.sin(ae) * ry * 0.55,
                rx * 0.035, ry * 0.05, 0, 0, 6.2832);
      c.fill();
    }
  }
  /* ---- LE JET. Un filet central, quatre arcs qui retombent, des
     gouttes en suspension. Il est FIGÉ, donc ce qu'on cherche n'est
     pas le mouvement mais la SILHOUETTE d'un jet : montée fine,
     sommet arrondi, retombée qui s'écarte. ---- */
  function jet(cx, cy, h){
    c.lineCap = "round";
    c.strokeStyle = "rgba(226,255,252,.72)";
    c.lineWidth = 1.5 * k;
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, cy - h); c.stroke();
    c.strokeStyle = "rgba(190,250,244,.5)";
    c.lineWidth = 1.0 * k;
    for(var i = -1; i <= 1; i += 2){
      c.beginPath();
      c.moveTo(cx, cy - h * 0.14);
      c.quadraticCurveTo(cx + i * h * 0.46, cy - h * 1.18, cx + i * h * 0.82, cy + h * 0.06);
      c.stroke();
      c.beginPath();
      c.moveTo(cx, cy - h * 0.2);
      c.quadraticCurveTo(cx + i * h * 0.26, cy - h * 0.96, cx + i * h * 0.46, cy + h * 0.04);
      c.stroke();
    }
    c.fillStyle = "rgba(230,255,252,.7)";
    for(var d = 0; d < 7; d++){
      var ad = 0.35 + d * 0.85, rd = h * (0.34 + (d % 3) * 0.22);
      c.beginPath();
      c.ellipse(cx + Math.cos(ad) * rd, cy - h * 0.72 + Math.sin(ad) * rd * 0.4,
                0.7 * k, 1.0 * k, 0, 0, 6.2832);
      c.fill();
    }
    lueurRapide(c, cx, cy - h * 0.72, h * 2.4, NUI.eau, 0.5);
  }
  /* ---- LA MARGELLE À HUIT PANS, et sa frise de mosaïque : une
     pastille d'or et de turquoise en alternance sur le bord. C'est
     elle qui dit « palais » et non « bassin ». ---- */
  function margelle(cx, cy, rx, ry, ep){
    c.fillStyle = NUI.pierreN;
    pansNuits(c, cx, cy + ep, rx, ry, 8, 0.3927); c.fill();
    c.fillStyle = NUI.pierreO;
    pansNuits(c, cx, cy, rx, ry, 8, 0.3927); c.fill();
    c.fillStyle = NUI.pierre;
    pansNuits(c, cx, cy - ep * 0.34, rx * 0.99, ry * 0.99, 8, 0.3927); c.fill();
    for(var i = 0; i < 24; i++){
      var a = i / 24 * 6.2832;
      c.fillStyle = (i & 1) ? NUI.orO : NUI.turqO;
      c.beginPath();
      c.ellipse(cx + Math.cos(a) * rx * 0.9, cy - ep * 0.34 + Math.sin(a) * ry * 0.9,
                Math.max(0.5, rx * 0.05), Math.max(0.4, ry * 0.07), 0, 0, 6.2832);
      c.fill();
    }
  }
  /* ---- LES NÉNUPHARS ET LES LOTUS, posés sur l'eau. ---- */
  function lotus(cx, cy, r, ouvert){
    c.fillStyle = "rgba(22,74,68,.72)";
    c.beginPath(); c.ellipse(cx, cy, r * 1.5, r * 0.72, 0, 0, 6.2832); c.fill();
    c.fillStyle = "rgba(60,140,124,.5)";
    c.beginPath(); c.ellipse(cx - r * 0.3, cy - r * 0.14, r * 0.8, r * 0.36, 0, 0, 6.2832); c.fill();
    if(!ouvert) return;
    for(var i = 0; i < 6; i++){
      var a = i / 6 * 6.2832;
      c.fillStyle = i % 2 ? "#ffd0e8" : "#f2b8dc";
      c.beginPath();
      c.ellipse(cx + Math.cos(a) * r * 0.5, cy - r * 0.3 + Math.sin(a) * r * 0.24,
                r * 0.42, r * 0.26, a, 0, 6.2832);
      c.fill();
    }
    c.fillStyle = "#fff2c8";
    c.beginPath(); c.ellipse(cx, cy - r * 0.34, r * 0.2, r * 0.14, 0, 0, 6.2832); c.fill();
    lueurRapide(c, cx, cy - r * 0.34, r * 4, "255,190,225", 0.36);
  }
  /* ---- LES ÉTOILES QUI FLOTTENT au-dessus de l'eau. C'est le mot
     « magique » du cahier des charges, et c'est ce qui sépare cette
     fontaine d'une fontaine de square. Leurs places viennent d'une
     spirale d'or (l'angle 2,399 rad) : réparties sans jamais
     s'aligner, et sans un seul tirage. ---- */
  function etoilesAuDessus(cx, cy, rx, h, n){
    for(var i = 0; i < n; i++){
      var a = i * 2.399, d = (0.25 + ((i * 7) % 10) / 13) * rx;
      var ex = cx + Math.cos(a) * d;
      var ey = cy - h * (0.25 + ((i * 5) % 9) / 12);
      var r = k * (0.6 + ((i * 3) % 5) * 0.24);
      lueurRapide(c, ex, ey, r * 9, "220,240,255", 0.5);
      c.fillStyle = "rgba(250,252,255,.95)";
      c.beginPath();
      c.moveTo(ex, ey - r * 2.2); c.lineTo(ex + r * 0.5, ey);
      c.lineTo(ex, ey + r * 2.2); c.lineTo(ex - r * 0.5, ey);
      c.closePath(); c.fill();
      c.beginPath();
      c.moveTo(ex - r * 2.6, ey); c.lineTo(ex, ey - r * 0.42);
      c.lineTo(ex + r * 2.6, ey); c.lineTo(ex, ey + r * 0.42);
      c.closePath(); c.fill();
    }
  }
  /* ---- LE VOILE D'EAU qui déborde d'un étage sur l'autre. C'est ce
     détail qui RELIE les vasques : sans lui, ce sont deux fontaines
     empilées. ---- */
  function voile(cx, y0, y1, l0, l1){
    c.fillStyle = "rgba(190,250,244,.32)";
    for(var v = -1; v <= 1; v += 2){
      c.beginPath();
      c.moveTo(cx + v * l0, y0);
      c.quadraticCurveTo(cx + v * l1 * 1.1, (y0 + y1) / 2, cx + v * l1, y1);
      c.lineTo(cx + v * l1 * 0.62, y1);
      c.quadraticCurveTo(cx + v * l1 * 0.72, (y0 + y1) / 2, cx + v * l0 * 0.66, y0);
      c.closePath(); c.fill();
    }
  }

  if(b === 0){
    /* LA VASQUE SUR PIED. La plus petite, et la plus fréquente. */
    ombreNuits(c, x, y, 11 * k, 5 * k);
    c.fillStyle = NUI.pierreN;
    c.beginPath(); c.ellipse(x, y, 6 * k, 2.8 * k, 0, 0, 6.2832); c.fill();
    c.fillStyle = NUI.pierreO;
    c.fillRect(x - 2.4 * k, y - 10 * k, 4.8 * k, 10 * k);
    c.fillStyle = NUI.pierre;
    c.fillRect(x - 2.4 * k, y - 10 * k, 1.6 * k, 10 * k);
    margelle(x, y - 10 * k, 10 * k, 4.6 * k, 1.8 * k);
    nappe(x, y - 11.2 * k, 8.2 * k, 3.6 * k, 0.5);
    jet(x, y - 11.6 * k, 12 * k);
    etoilesAuDessus(x, y - 12 * k, 9 * k, 16 * k, 3);

  }else if(b === 1){
    /* LA FONTAINE À DEUX ÉTAGES. */
    ombreNuits(c, x, y, 19 * k, 9 * k);
    margelle(x, y, 18 * k, 8.4 * k, 3 * k);
    nappe(x, y - 1.4 * k, 15 * k, 6.8 * k, 0.62);
    lotus(x - 8 * k, y + 1 * k, 2.4 * k, 0);
    lotus(x + 7 * k, y - 3 * k, 2.2 * k, 1);
    c.fillStyle = NUI.pierreO;
    c.fillRect(x - 2.8 * k, y - 22 * k, 5.6 * k, 21 * k);
    c.fillStyle = NUI.pierre;
    c.fillRect(x - 2.8 * k, y - 22 * k, 1.9 * k, 21 * k);
    margelle(x, y - 22 * k, 9 * k, 4 * k, 1.6 * k);
    nappe(x, y - 23 * k, 7.2 * k, 3.0 * k, 0.42);
    voile(x, y - 22.6 * k, y - 3 * k, 6 * k, 9 * k);
    jet(x, y - 23.4 * k, 15 * k);
    etoilesAuDessus(x, y - 24 * k, 13 * k, 22 * k, 5);
    for(var q3 = -1; q3 <= 1; q3 += 2)
      lanterneNuits(c, x + q3 * 16 * k, y - 6 * k, 2.6 * k, 0);

  }else{
    /* LA GRANDE FONTAINE. Trois vasques, sept jets, deux voiles
       d'eau, de la brume au ras du bassin, quatre lotus, neuf étoiles
       et quatre bornes à lanterne autour du parvis. C'est le seul
       objet de l'île qui ait le droit d'être compliqué, et il l'est. */
    ombreNuits(c, x, y, 34 * k, 15 * k);
    /* le parvis : une dalle à huit pans qui POSE la fontaine. Sans
       elle, la vasque a l'air d'avoir été déposée sur l'herbe. */
    c.fillStyle = "rgba(120,110,190,.22)";
    pansNuits(c, x, y + 1 * k, 33 * k, 15 * k, 8, 0.3927); c.fill();
    c.strokeStyle = "rgba(210,190,255,.24)";
    c.lineWidth = 1.4 * k;
    pansNuits(c, x, y + 1 * k, 33 * k, 15 * k, 8, 0.3927); c.stroke();

    margelle(x, y, 27 * k, 12.4 * k, 3.6 * k);
    nappe(x, y - 1.8 * k, 23 * k, 10.4 * k, 0.78);
    lotus(x - 13 * k, y + 2 * k, 3.0 * k, 1);
    lotus(x + 12 * k, y - 5 * k, 2.6 * k, 0);
    lotus(x - 4 * k, y + 4 * k, 2.4 * k, 1);
    lotus(x + 6 * k, y + 2.6 * k, 2.2 * k, 0);

    c.fillStyle = NUI.pierreO;
    c.fillRect(x - 3.6 * k, y - 20 * k, 7.2 * k, 19 * k);
    c.fillStyle = NUI.pierre;
    c.fillRect(x - 3.6 * k, y - 20 * k, 2.4 * k, 19 * k);
    margelle(x, y - 20 * k, 14 * k, 6.4 * k, 2.2 * k);
    nappe(x, y - 21.4 * k, 11.4 * k, 4.8 * k, 0.55);

    c.fillStyle = NUI.pierreO;
    c.fillRect(x - 2.4 * k, y - 34 * k, 4.8 * k, 13 * k);
    c.fillStyle = NUI.pierre;
    c.fillRect(x - 2.4 * k, y - 34 * k, 1.6 * k, 13 * k);
    margelle(x, y - 34 * k, 7.4 * k, 3.4 * k, 1.4 * k);
    nappe(x, y - 35 * k, 5.6 * k, 2.4 * k, 0.4);

    voile(x, y - 35 * k, y - 21 * k, 4.4 * k, 8 * k);
    voile(x, y - 20.6 * k, y - 3.5 * k, 9 * k, 14 * k);

    jet(x, y - 35.6 * k, 22 * k);
    for(var j3 = 0; j3 < 6; j3++){
      var aj = j3 / 6 * 6.2832 + 0.5;
      jet(x + Math.cos(aj) * 18 * k, y - 2.4 * k + Math.sin(aj) * 8 * k, 9 * k);
    }
    /* LA BRUME au ras de l'eau. Une fontaine sans brume est une
       fontaine ; avec, c'est une fontaine enchantée. */
    c.save();
    c.globalCompositeOperation = "lighter";
    for(var m = 0; m < 3; m++){
      var ym = y - (3 + m * 3) * k, rm = (26 - m * 5) * k;
      var gm = c.createRadialGradient(x, ym, 2 * k, x, ym, rm);
      gm.addColorStop(0, "rgba(180,240,255,.14)");
      gm.addColorStop(1, "rgba(150,220,255,0)");
      c.fillStyle = gm;
      c.beginPath(); c.ellipse(x, ym, rm, (9 - m * 2) * k, 0, 0, 6.2832); c.fill();
    }
    c.restore();
    etoilesAuDessus(x, y - 36 * k, 22 * k, 34 * k, 9);
    for(var q4 = 0; q4 < 4; q4++){
      var a4 = 0.7854 + q4 * 1.5708;
      borneNuits(c, x + Math.cos(a4) * 29 * k, y + 1 * k + Math.sin(a4) * 13 * k,
                 13 * k, 1.4 * k, 2.8 * k);
    }
  }
}

/* ================================================================
   VARIANTE 3 — LE TAPIS
   Ce qui rend l'île HABITÉE. Rien ne se dresse : un tapis, des
   coussins, un brasero, un plateau à thé. On s'assoit ici.
   ================================================================ */
function tapisNuits(c, gx, gy, s){
  var p = iso(gx, gy), x = p.x, y = p.y, b = bandeNuits(s);
  var k = s * (b === 2 ? 1.20 : b === 1 ? 1.40 : 1.60);
  var ic = b % NUI.soie.length;

  /* Un tapis posé à plat : le losange isométrique, sa bordure d'or,
     son médaillon, et les franges au bout. */
  function tapis(cx, cy, w, h, i0){
    c.fillStyle = NUI.soieO[i0 % 4];
    c.beginPath();
    c.moveTo(cx - w, cy); c.lineTo(cx, cy - h);
    c.lineTo(cx + w, cy); c.lineTo(cx, cy + h);
    c.closePath(); c.fill();
    c.fillStyle = NUI.soie[i0 % 4];
    c.beginPath();
    c.moveTo(cx - w * 0.9, cy); c.lineTo(cx, cy - h * 0.9);
    c.lineTo(cx + w * 0.9, cy); c.lineTo(cx, cy + h * 0.9);
    c.closePath(); c.fill();
    c.strokeStyle = "rgba(240,214,140,.6)";
    c.lineWidth = 1.2 * k;
    c.beginPath();
    c.moveTo(cx - w * 0.74, cy); c.lineTo(cx, cy - h * 0.74);
    c.lineTo(cx + w * 0.74, cy); c.lineTo(cx, cy + h * 0.74);
    c.closePath(); c.stroke();
    c.fillStyle = "rgba(240,214,140,.34)";
    c.beginPath(); c.ellipse(cx, cy, w * 0.4, h * 0.4, 0, 0, 6.2832); c.fill();
    c.fillStyle = "rgba(255,238,190,.55)";
    c.beginPath();
    c.moveTo(cx, cy - h * 0.3); c.lineTo(cx + w * 0.22, cy);
    c.lineTo(cx, cy + h * 0.3); c.lineTo(cx - w * 0.22, cy);
    c.closePath(); c.fill();
    c.strokeStyle = "rgba(240,222,170,.45)";
    c.lineWidth = 0.7 * k;
    for(var f = -3; f <= 3; f++){
      c.beginPath();
      c.moveTo(cx + f * w * 0.2, cy + h * (0.9 - Math.abs(f) * 0.12));
      c.lineTo(cx + f * w * 0.22, cy + h * (1.06 - Math.abs(f) * 0.12));
      c.stroke();
    }
  }
  /* Un coussin : un ovale bombé avec un bouton d'or au centre. */
  function coussin(cx, cy, r, i0){
    c.fillStyle = NUI.soieO[i0 % 4];
    c.beginPath(); c.ellipse(cx, cy + r * 0.16, r * 1.25, r * 0.66, 0, 0, 6.2832); c.fill();
    c.fillStyle = NUI.soie[i0 % 4];
    c.beginPath(); c.ellipse(cx, cy, r * 1.2, r * 0.62, 0, 0, 6.2832); c.fill();
    c.fillStyle = "rgba(255,240,200,.30)";
    c.beginPath(); c.ellipse(cx - r * 0.3, cy - r * 0.2, r * 0.5, r * 0.24, 0, 0, 6.2832); c.fill();
    c.fillStyle = NUI.orO;
    c.beginPath(); c.ellipse(cx, cy, r * 0.16, r * 0.12, 0, 0, 6.2832); c.fill();
  }

  if(b === 0){
    /* LE TAPIS SEUL, avec deux coussins. */
    ombreNuits(c, x, y, 14 * k, 6.4 * k);
    tapis(x, y, 14 * k, 7 * k, ic);
    coussin(x - 5 * k, y - 1 * k, 2.6 * k, ic + 1);
    coussin(x + 4 * k, y + 1 * k, 2.4 * k, ic + 2);

  }else if(b === 1){
    /* LE TAPIS ET LE BRASERO. */
    ombreNuits(c, x, y, 19 * k, 8.6 * k);
    tapis(x, y, 19 * k, 9.4 * k, ic);
    coussin(x - 8 * k, y - 1 * k, 3.0 * k, ic + 1);
    coussin(x - 3 * k, y + 2.4 * k, 2.8 * k, ic + 2);
    coussin(x + 6 * k, y - 2 * k, 2.6 * k, ic + 3);
    braseroNuits(c, x + 9 * k, y + 2 * k, 0.95 * k);
    lanterneNuits(c, x - 12 * k, y - 4 * k, 2.4 * k, 0);

  }else{
    /* LE GRAND CAMPEMENT. Un tapis large, un second en biais dessus,
       six coussins, un plateau à thé sur une table basse, deux
       braseros et deux lanternes posées. C'est la scène qu'on
       découvre en zoomant. */
    ombreNuits(c, x, y, 28 * k, 12.6 * k);
    tapis(x, y, 27 * k, 13.4 * k, ic);
    tapis(x + 6 * k, y + 3 * k, 11 * k, 5.4 * k, ic + 2);
    /* la table basse et son plateau */
    var tx = x - 2 * k, ty = y - 1 * k;
    c.fillStyle = "#3a2a52";
    c.beginPath(); c.ellipse(tx, ty + 2.2 * k, 6.4 * k, 3.0 * k, 0, 0, 6.2832); c.fill();
    c.fillStyle = NUI.orO;
    c.beginPath(); c.ellipse(tx, ty, 6.4 * k, 3.0 * k, 0, 0, 6.2832); c.fill();
    c.fillStyle = NUI.or;
    c.beginPath(); c.ellipse(tx, ty - 0.7 * k, 6.0 * k, 2.7 * k, 0, 0, 6.2832); c.fill();
    /* la théière, son bec, son couvercle, et deux verres */
    c.fillStyle = "#d8c07a";
    c.beginPath(); c.ellipse(tx - 1 * k, ty - 3.2 * k, 2.2 * k, 2.0 * k, 0, 0, 6.2832); c.fill();
    c.strokeStyle = "#d8c07a"; c.lineWidth = 0.8 * k;
    c.beginPath();
    c.moveTo(tx + 0.9 * k, ty - 3.6 * k);
    c.quadraticCurveTo(tx + 3.4 * k, ty - 4.6 * k, tx + 3.0 * k, ty - 6.2 * k);
    c.stroke();
    c.fillStyle = "#f2dc9a";
    c.beginPath();
    c.moveTo(tx - 1.4 * k, ty - 5.2 * k); c.lineTo(tx - 0.6 * k, ty - 5.2 * k);
    c.lineTo(tx - 1.0 * k, ty - 6.6 * k);
    c.closePath(); c.fill();
    for(var g = -1; g <= 1; g += 2){
      c.fillStyle = "rgba(255,236,190,.85)";
      c.beginPath();
      c.ellipse(tx + g * 3.6 * k, ty - 1.4 * k, 0.9 * k, 1.2 * k, 0, 0, 6.2832);
      c.fill();
    }
    lueurRapide(c, tx, ty - 3 * k, 16 * k, NUI.lampe, 0.24);
    coussin(x - 13 * k, y - 2 * k, 3.4 * k, ic + 1);
    coussin(x - 8 * k, y + 3.4 * k, 3.0 * k, ic + 2);
    coussin(x - 1 * k, y + 5.4 * k, 2.8 * k, ic + 3);
    coussin(x + 8 * k, y - 3.4 * k, 3.0 * k, ic);
    coussin(x + 13 * k, y + 1 * k, 3.2 * k, ic + 1);
    coussin(x + 3 * k, y - 5 * k, 2.6 * k, ic + 2);
    braseroNuits(c, x - 20 * k, y + 2 * k, 1.0 * k);
    braseroNuits(c, x + 19 * k, y - 3 * k, 0.9 * k);
    lanterneNuits(c, x - 16 * k, y - 6 * k, 3.0 * k, 0);
    lanterneNuits(c, x + 14 * k, y + 5 * k, 2.8 * k, 0, "150,220,255");
  }
}
