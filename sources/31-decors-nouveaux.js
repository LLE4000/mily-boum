/* ================================================================
   LES DÉCORS DES TROIS NOUVELLES ÎLES

   Guinguette, Ténèbres, Ibiza. Quatre objets chacune — c'est ce que
   genereCarte tire (`v` vaut 0 à 3), et c'est aussi ce qu'il faut pour
   qu'une île ait une identité sans se répéter.

   TROIS CONTRAINTES QUI VIENNENT DU MOTEUR, et qui expliquent la
   forme de ces fonctions :

   1. ELLES SONT PRÉ-RENDUES. construitSpritesDecor() les dessine une
      fois chacune dans un petit canevas, puis le sol n'est plus qu'un
      collage de ces images. Rien de ce qu'on écrit ici ne peut donc
      dépendre du temps : une flamme, une lampe, un reflet sont figés à
      une heure choisie. Un Math.random() ici donnerait un décor
      différent à chaque reconstruction du sol.

   2. ELLES REÇOIVENT gx, gy EN CASES, et passent par iso() pour
      trouver leur point à l'écran. Tout le reste se mesure en pixels
      multipliés par `s`, l'échelle de l'exemplaire.

   3. LEUR ORDRE DANS dessineDecor() EST LEUR IDENTITÉ. Le tirage rend
      un numéro de 0 à 3 ; échanger deux objets change l'aspect de
      toutes les cartes déjà générées. On ajoute à la fin, on
      n'intercale pas — même discipline que pour les bâtiments, à ceci
      près que les décors ne sont indexés par personne et qu'on peut
      donc, eux, les redessiner autant qu'on veut.
   ================================================================ */

/* ----------------------------------------------------------------
   Deux aides communes aux trois îles.
   ---------------------------------------------------------------- */
/* Un piquet planté, avec son ombre au sol. Sert aux guirlandes, aux
   parasols et aux torches : partout où quelque chose tient debout. */
function pieuDecor(c, x, y, haut, ep, clair, sombre){
  c.fillStyle = "rgba(0,0,0,.22)";
  c.beginPath(); c.ellipse(x, y, ep * 1.9, ep * 0.9, 0, 0, 6.2832); c.fill();
  c.fillStyle = sombre;
  c.fillRect(x - ep, y - haut, ep * 2, haut);
  c.fillStyle = clair;
  c.fillRect(x - ep, y - haut, ep * 0.8, haut);
}
/* Une petite lampe allumée : le halo, le globe, le point chaud.
   `lueurRapide` fait le halo sans save/restore — c'est ce qui rend
   acceptable d'en poser des centaines sur une carte. */
function lampionDecor(c, x, y, r, couleur, force){
  lueurRapide(c, x, y, r * 5.4, couleur, force === undefined ? 0.62 : force);
  c.fillStyle = couleur;
  c.beginPath(); c.ellipse(x, y, r, r * 1.22, 0, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,255,255,.82)";
  c.beginPath(); c.ellipse(x - r * 0.3, y - r * 0.36, r * 0.38, r * 0.46, 0, 0, 6.2832); c.fill();
}

/* ================================================================
   MILY EN GUINGUETTE
   Une fête de jardin au bord de l'eau, la nuit tombée. Le ciel du
   biome est presque noir : tout ce qu'on dessine ici doit donc porter
   sa propre lumière, sinon l'île reste un terrain vague.
   ================================================================ */

/* 0 — LA GUIRLANDE SUR SES DEUX MÂTS.
   C'est l'objet qui signe l'île. Elle est plus haute et plus longue
   que celle de la soirée hippie, et ses ampoules sont d'un blanc
   chaud unique au lieu des six couleurs de la fête : une guinguette
   n'est pas une rave, c'est une terrasse. */
function guirlandeGuinguette(c, gx, gy, s){
  var p = iso(gx, gy);
  var demi = 30 * s, haut = 36 * s;
  pieuDecor(c, p.x - demi, p.y + 2 * s, haut, 1.6 * s, "#7a6144", "#4a3826");
  pieuDecor(c, p.x + demi, p.y + 2 * s, haut, 1.6 * s, "#7a6144", "#4a3826");
  var ax = p.x - demi, ay = p.y + 2 * s - haut;
  var bx = p.x + demi, by = ay;
  var cx = p.x,        cy = ay + 30 * s;          // le ventre du câble
  c.strokeStyle = "rgba(22,16,26,.72)"; c.lineWidth = 1.2 * s; c.lineCap = "round";
  c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(cx, cy, bx, by); c.stroke();
  /* onze ampoules, alternées grosses et petites : un espacement
     régulier de billes identiques donne un collier, pas une
     guirlande */
  for(var i = 1; i < 12; i++){
    var t = i / 12, u = 1 - t;
    var x = u * u * ax + 2 * u * t * cx + t * t * bx;
    var y = u * u * ay + 2 * u * t * cy + t * t * by;
    var gros = (i % 2 === 1);
    c.strokeStyle = "rgba(22,16,26,.6)"; c.lineWidth = 0.8 * s;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 2.4 * s); c.stroke();
    lampionDecor(c, x, y + 4.2 * s, (gros ? 2.5 : 1.9) * s,
                 gros ? "#ffd68a" : "#ffb96a", gros ? 0.66 : 0.5);
  }
}

/* 1 — LA TABLE RONDE ET SES DEUX CHAISES.
   Nappe à carreaux, une bougie au centre. C'est le meuble qui dit
   « on mange dehors » ; posé partout sur la carte, il fait la
   terrasse. */
function tableGuinguette(c, gx, gy, s){
  var p = iso(gx, gy);
  var i, a;
  /* les deux chaises, derrière la table pour ne pas la masquer */
  for(i = 0; i < 2; i++){
    a = i ? 0.9 : 2.3;
    var chx = p.x + Math.cos(a) * 13 * s, chy = p.y + Math.sin(a) * 6.4 * s;
    c.fillStyle = "rgba(0,0,0,.24)";
    c.beginPath(); c.ellipse(chx, chy, 4.4 * s, 2.1 * s, 0, 0, 6.2832); c.fill();
    c.fillStyle = "#5c452e";
    c.fillRect(chx - 3.4 * s, chy - 7.4 * s, 6.8 * s, 1.9 * s);
    c.fillStyle = "#43321f";
    c.fillRect(chx - 3.0 * s, chy - 6.0 * s, 1.1 * s, 6.0 * s);
    c.fillRect(chx + 1.9 * s, chy - 6.0 * s, 1.1 * s, 6.0 * s);
    c.fillStyle = "#6b5238";
    c.fillRect(chx - 3.4 * s, chy - 13.4 * s, 6.8 * s, 6.2 * s);
    c.fillStyle = "#4a3624";
    c.fillRect(chx - 3.4 * s, chy - 11.2 * s, 6.8 * s, 0.9 * s);
  }
  /* le pied */
  c.fillStyle = "rgba(0,0,0,.28)";
  c.beginPath(); c.ellipse(p.x, p.y, 9 * s, 4.2 * s, 0, 0, 6.2832); c.fill();
  c.fillStyle = "#3f3020";
  c.fillRect(p.x - 1.5 * s, p.y - 9 * s, 3 * s, 9 * s);
  /* le plateau et la nappe qui retombe */
  c.fillStyle = "#e8dcc6";
  c.beginPath(); c.ellipse(p.x, p.y - 9.4 * s, 11 * s, 5.4 * s, 0, 0, 6.2832); c.fill();
  c.fillStyle = "#d6c7ab";
  c.beginPath();
  c.ellipse(p.x, p.y - 8.2 * s, 11 * s, 5.4 * s, 0, 0, 3.1416); c.fill();
  /* les carreaux rouges : deux bandes croisées suffisent à la
     lecture, un vrai damier serait illisible à cette taille */
  c.fillStyle = "rgba(184,58,48,.55)";
  c.save();
  c.beginPath(); c.ellipse(p.x, p.y - 9.4 * s, 11 * s, 5.4 * s, 0, 0, 6.2832); c.clip();
  for(i = -2; i <= 2; i++){
    c.fillRect(p.x + i * 5.2 * s - 0.9 * s, p.y - 16 * s, 1.8 * s, 14 * s);
    c.fillRect(p.x - 12 * s, p.y - 9.4 * s + i * 2.6 * s - 0.5 * s, 24 * s, 1.0 * s);
  }
  c.restore();
  /* la bougie dans son verre — la petite lumière de la table */
  c.fillStyle = "rgba(255,236,196,.30)";
  c.beginPath(); c.ellipse(p.x, p.y - 10.6 * s, 3.4 * s, 1.8 * s, 0, 0, 6.2832); c.fill();
  c.fillStyle = "#cfd8de";
  c.fillRect(p.x - 1.5 * s, p.y - 14.4 * s, 3 * s, 4.2 * s);
  lampionDecor(c, p.x, p.y - 14.6 * s, 1.5 * s, "#ffd07a", 0.72);
}

/* 2 — LE LAMPADAIRE DE JARDIN.
   Un mât de bois courbe et son abat-jour émaillé. Il éclaire un rond
   de sol : c'est lui qui donne les flaques de lumière entre les
   tables, et qui empêche la carte de devenir une nappe noire. */
function lampadaireGuinguette(c, gx, gy, s){
  var p = iso(gx, gy);
  var h = 40 * s;
  /* le rond de lumière au sol, posé en premier : tout le reste se
     dessine dedans */
  c.save();
  c.globalCompositeOperation = "lighter";
  var g = c.createRadialGradient(p.x, p.y - 2 * s, 2, p.x, p.y - 2 * s, 30 * s);
  g.addColorStop(0, "rgba(255,196,110,.34)");
  g.addColorStop(0.5, "rgba(255,168,86,.13)");
  g.addColorStop(1, "rgba(255,150,70,0)");
  c.fillStyle = g;
  c.beginPath(); c.ellipse(p.x, p.y - 2 * s, 30 * s, 14 * s, 0, 0, 6.2832); c.fill();
  c.restore();
  pieuDecor(c, p.x, p.y, h * 0.82, 1.7 * s, "#7d6446", "#4b3826");
  /* la courbe du haut */
  c.strokeStyle = "#5b4630"; c.lineWidth = 3.0 * s; c.lineCap = "round";
  c.beginPath();
  c.moveTo(p.x, p.y - h * 0.82);
  c.quadraticCurveTo(p.x + 1 * s, p.y - h - 3 * s, p.x + 8 * s, p.y - h - 1 * s);
  c.stroke();
  /* l'abat-jour, cône émaillé vert bouteille */
  c.fillStyle = "#2f4a3a";
  c.beginPath();
  c.moveTo(p.x + 8 * s, p.y - h - 2 * s);
  c.lineTo(p.x + 14.4 * s, p.y - h + 4.6 * s);
  c.lineTo(p.x + 1.6 * s, p.y - h + 4.6 * s);
  c.closePath(); c.fill();
  c.fillStyle = "#456b52";
  c.beginPath();
  c.moveTo(p.x + 8 * s, p.y - h - 2 * s);
  c.lineTo(p.x + 4.4 * s, p.y - h + 4.6 * s);
  c.lineTo(p.x + 1.6 * s, p.y - h + 4.6 * s);
  c.closePath(); c.fill();
  c.fillStyle = "rgba(255,214,140,.34)";
  c.beginPath(); c.ellipse(p.x + 8 * s, p.y - h + 4.6 * s, 6.4 * s, 1.8 * s, 0, 0, 6.2832); c.fill();
  lampionDecor(c, p.x + 8 * s, p.y - h + 5.4 * s, 2.4 * s, "#ffd68a", 0.7);
}

/* 3 — LE TONNEAU-MANGE-DEBOUT ET SES BOUTEILLES.
   Le coin où l'on se tient, verre à la main. Du bois cerclé de fer,
   deux bouteilles et un verre : c'est le détail qui fait qu'on croit
   à la fête plutôt qu'à un décor de fête. */
function tonneauGuinguette(c, gx, gy, s){
  var p = iso(gx, gy);
  c.fillStyle = "rgba(0,0,0,.26)";
  c.beginPath(); c.ellipse(p.x, p.y, 7.4 * s, 3.4 * s, 0, 0, 6.2832); c.fill();
  /* le fût, bombé au milieu */
  var g = c.createLinearGradient(p.x - 7 * s, 0, p.x + 7 * s, 0);
  g.addColorStop(0, "#5a4029"); g.addColorStop(0.38, "#8a6640");
  g.addColorStop(1, "#43301e");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(p.x - 5.4 * s, p.y);
  c.quadraticCurveTo(p.x - 7.6 * s, p.y - 9 * s, p.x - 5.4 * s, p.y - 18 * s);
  c.lineTo(p.x + 5.4 * s, p.y - 18 * s);
  c.quadraticCurveTo(p.x + 7.6 * s, p.y - 9 * s, p.x + 5.4 * s, p.y);
  c.closePath(); c.fill();
  /* les cercles de fer */
  c.strokeStyle = "#8f8a80"; c.lineWidth = 1.3 * s;
  c.beginPath(); c.moveTo(p.x - 7.2 * s, p.y - 6 * s); c.lineTo(p.x + 7.2 * s, p.y - 6 * s); c.stroke();
  c.beginPath(); c.moveTo(p.x - 7.2 * s, p.y - 12 * s); c.lineTo(p.x + 7.2 * s, p.y - 12 * s); c.stroke();
  /* le dessus */
  c.fillStyle = "#9a7448";
  c.beginPath(); c.ellipse(p.x, p.y - 18 * s, 5.4 * s, 2.6 * s, 0, 0, 6.2832); c.fill();
  c.strokeStyle = "#6b4e2e"; c.lineWidth = 0.8 * s;
  c.beginPath(); c.ellipse(p.x, p.y - 18 * s, 5.4 * s, 2.6 * s, 0, 0, 6.2832); c.stroke();
  /* deux bouteilles et un verre */
  c.fillStyle = "#2c4a30";
  c.fillRect(p.x - 3.4 * s, p.y - 27 * s, 1.9 * s, 9 * s);
  c.fillRect(p.x - 3.0 * s, p.y - 29.4 * s, 1.1 * s, 3 * s);
  c.fillStyle = "#4a2d20";
  c.fillRect(p.x - 0.9 * s, p.y - 25.6 * s, 1.9 * s, 7.6 * s);
  c.fillRect(p.x - 0.5 * s, p.y - 27.8 * s, 1.1 * s, 2.6 * s);
  c.fillStyle = "rgba(228,236,240,.72)";
  c.beginPath();
  c.moveTo(p.x + 2.2 * s, p.y - 23.4 * s);
  c.lineTo(p.x + 4.6 * s, p.y - 23.4 * s);
  c.lineTo(p.x + 4.0 * s, p.y - 18.4 * s);
  c.lineTo(p.x + 2.8 * s, p.y - 18.4 * s);
  c.closePath(); c.fill();
  c.fillStyle = "rgba(240,180,90,.75)";
  c.fillRect(p.x + 2.5 * s, p.y - 21 * s, 1.8 * s, 2.5 * s);
}

/* ================================================================
   MILY DANS LES TÉNÈBRES
   Rien ne pousse. Tout ce qui dépasse du sol est de la roche, du
   feu, ou de l'os. La lumière vient d'en bas — c'est ce qui rend
   cette île étrangère à toutes les autres.
   ================================================================ */

/* 0 — LA FISSURE INCANDESCENTE.
   Une déchirure dans la croûte, la lave en dessous. Posée à plat,
   elle ne masque rien du terrain de jeu et donne pourtant toute la
   chaleur de la carte : c'est le décor le plus fréquent des quatre,
   et c'est voulu. */
function fissureTenebres(c, gx, gy, s){
  var p = iso(gx, gy);
  var lg = 17 * s, i;
  /* la chaleur qui monte, d'abord */
  c.save();
  c.globalCompositeOperation = "lighter";
  var g = c.createRadialGradient(p.x, p.y, 1, p.x, p.y, lg * 1.5);
  g.addColorStop(0, "rgba(255,140,40,.40)");
  g.addColorStop(0.45, "rgba(226,80,20,.16)");
  g.addColorStop(1, "rgba(200,50,10,0)");
  c.fillStyle = g;
  c.beginPath(); c.ellipse(p.x, p.y, lg * 1.5, lg * 0.72, 0, 0, 6.2832); c.fill();
  c.restore();
  /* la lèvre sombre de la roche, puis la lave dedans, en trois
     couches de plus en plus claires et de plus en plus étroites */
  var couches = [
    { e:4.6, col:"#1a1216" },
    { e:3.0, col:"#8a1a06" },
    { e:1.9, col:"#e2551a" },
    { e:0.9, col:"#ffd66a" }
  ];
  for(i = 0; i < couches.length; i++){
    c.strokeStyle = couches[i].col;
    c.lineWidth = couches[i].e * s;
    c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath();
    c.moveTo(p.x - lg, p.y + 1.6 * s);
    c.lineTo(p.x - lg * 0.42, p.y - 1.4 * s);
    c.lineTo(p.x + lg * 0.14, p.y + 1.2 * s);
    c.lineTo(p.x + lg * 0.62, p.y - 1.0 * s);
    c.lineTo(p.x + lg, p.y + 1.4 * s);
    c.stroke();
  }
  /* deux braises échappées, pour casser la ligne */
  c.fillStyle = "rgba(255,170,70,.75)";
  c.beginPath(); c.ellipse(p.x - lg * 0.66, p.y - 4.4 * s, 0.9 * s, 0.9 * s, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(p.x + lg * 0.38, p.y - 6.2 * s, 0.6 * s, 0.6 * s, 0, 0, 6.2832); c.fill();
}

/* 1 — L'AIGUILLE DE BASALTE.
   Une colonne noire, fendue, qui rougeoie par ses fêlures. C'est la
   silhouette verticale de l'île — celle qui remplace l'arbre. */
function aiguilleTenebres(c, gx, gy, s){
  var p = iso(gx, gy);
  var h = 30 * s;
  c.fillStyle = "rgba(0,0,0,.34)";
  c.beginPath(); c.ellipse(p.x, p.y, 8 * s, 3.6 * s, 0, 0, 6.2832); c.fill();
  /* le fût, deux faces pour le volume */
  c.fillStyle = "#221c20";
  c.beginPath();
  c.moveTo(p.x - 6.2 * s, p.y);
  c.lineTo(p.x - 2.6 * s, p.y - h);
  c.lineTo(p.x + 1.4 * s, p.y - h * 0.94);
  c.lineTo(p.x + 1.0 * s, p.y + 1 * s);
  c.closePath(); c.fill();
  c.fillStyle = "#33292f";
  c.beginPath();
  c.moveTo(p.x + 1.0 * s, p.y + 1 * s);
  c.lineTo(p.x + 1.4 * s, p.y - h * 0.94);
  c.lineTo(p.x + 5.4 * s, p.y - h * 0.72);
  c.lineTo(p.x + 6.0 * s, p.y);
  c.closePath(); c.fill();
  /* les fêlures qui rougeoient */
  c.strokeStyle = "#c8410f"; c.lineWidth = 1.1 * s; c.lineCap = "round";
  c.beginPath();
  c.moveTo(p.x - 3.4 * s, p.y - 2 * s);
  c.lineTo(p.x - 2.2 * s, p.y - h * 0.42);
  c.lineTo(p.x - 3.0 * s, p.y - h * 0.66);
  c.stroke();
  c.strokeStyle = "#ff9a3c"; c.lineWidth = 0.5 * s;
  c.beginPath();
  c.moveTo(p.x - 3.2 * s, p.y - 3 * s);
  c.lineTo(p.x - 2.2 * s, p.y - h * 0.40);
  c.stroke();
  c.strokeStyle = "#a02c0a"; c.lineWidth = 0.8 * s;
  c.beginPath();
  c.moveTo(p.x + 3.0 * s, p.y - 3 * s);
  c.lineTo(p.x + 2.4 * s, p.y - h * 0.5);
  c.stroke();
  /* la pointe, chauffée */
  c.fillStyle = "rgba(255,120,40,.34)";
  c.beginPath(); c.ellipse(p.x - 0.6 * s, p.y - h * 0.97, 2.4 * s, 1.4 * s, 0, 0, 6.2832); c.fill();
}

/* 2 — LA VASQUE DE LAVE.
   Un bassin de roche débordant, avec sa flamme figée. C'est la source
   de lumière franche de l'île : une par-ci par-là suffit à guider
   l'œil dans le noir. */
function vasqueTenebres(c, gx, gy, s){
  var p = iso(gx, gy);
  var i;
  c.save();
  c.globalCompositeOperation = "lighter";
  var g = c.createRadialGradient(p.x, p.y - 6 * s, 2, p.x, p.y - 6 * s, 34 * s);
  g.addColorStop(0, "rgba(255,180,80,.52)");
  g.addColorStop(0.4, "rgba(255,110,30,.20)");
  g.addColorStop(1, "rgba(220,60,10,0)");
  c.fillStyle = g;
  c.beginPath(); c.ellipse(p.x, p.y - 6 * s, 34 * s, 17 * s, 0, 0, 6.2832); c.fill();
  c.restore();
  /* le socle, taillé en biseau */
  c.fillStyle = "#1d171b";
  c.beginPath();
  c.moveTo(p.x - 8.4 * s, p.y);
  c.lineTo(p.x - 6.0 * s, p.y - 9 * s);
  c.lineTo(p.x + 6.0 * s, p.y - 9 * s);
  c.lineTo(p.x + 8.4 * s, p.y);
  c.closePath(); c.fill();
  c.fillStyle = "#2e262c";
  c.beginPath();
  c.moveTo(p.x - 6.0 * s, p.y - 9 * s);
  c.lineTo(p.x + 6.0 * s, p.y - 9 * s);
  c.lineTo(p.x + 4.2 * s, p.y - 4.4 * s);
  c.lineTo(p.x - 4.2 * s, p.y - 4.4 * s);
  c.closePath(); c.fill();
  /* la cuvette et la lave dedans */
  c.fillStyle = "#3a3036";
  c.beginPath(); c.ellipse(p.x, p.y - 9.6 * s, 8.6 * s, 4.0 * s, 0, 0, 6.2832); c.fill();
  c.fillStyle = "#e2551a";
  c.beginPath(); c.ellipse(p.x, p.y - 10.0 * s, 6.6 * s, 2.9 * s, 0, 0, 6.2832); c.fill();
  c.fillStyle = "#ffce62";
  c.beginPath(); c.ellipse(p.x - 0.6 * s, p.y - 10.4 * s, 3.8 * s, 1.5 * s, 0, 0, 6.2832); c.fill();
  /* la flamme, figée : trois langues décalées */
  var langues = [[0, 15, 3.6], [-2.6, 10.5, 2.4], [2.9, 11.5, 2.2]];
  for(i = 0; i < langues.length; i++){
    var lx = p.x + langues[i][0] * s, lh = langues[i][1] * s, lr = langues[i][2] * s;
    c.fillStyle = i === 0 ? "rgba(255,142,44,.80)" : "rgba(255,110,30,.62)";
    c.beginPath();
    c.moveTo(lx - lr, p.y - 10.4 * s);
    c.quadraticCurveTo(lx - lr * 0.7, p.y - 10.4 * s - lh * 0.7, lx, p.y - 10.4 * s - lh);
    c.quadraticCurveTo(lx + lr * 0.7, p.y - 10.4 * s - lh * 0.7, lx + lr, p.y - 10.4 * s);
    c.closePath(); c.fill();
  }
  c.fillStyle = "rgba(255,226,150,.86)";
  c.beginPath();
  c.moveTo(p.x - 1.5 * s, p.y - 10.4 * s);
  c.quadraticCurveTo(p.x - 1.0 * s, p.y - 17 * s, p.x, p.y - 19.6 * s);
  c.quadraticCurveTo(p.x + 1.0 * s, p.y - 17 * s, p.x + 1.5 * s, p.y - 10.4 * s);
  c.closePath(); c.fill();
  /* étincelles qui montent */
  c.fillStyle = "rgba(255,190,110,.7)";
  c.beginPath(); c.ellipse(p.x - 2.4 * s, p.y - 23 * s, 0.7 * s, 0.7 * s, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(p.x + 1.9 * s, p.y - 27 * s, 0.5 * s, 0.5 * s, 0, 0, 6.2832); c.fill();
}

/* 3 — L'ARBRE CALCINÉ.
   Ce qui reste d'une forêt. Aucune feuille, des branches tordues, et
   un tronc dont le pied rougeoie encore. Il donne à l'île son passé :
   quelque chose a brûlé ici, ce n'est pas un décor né noir. */
function arbreCalcineTenebres(c, gx, gy, s){
  var p = iso(gx, gy);
  var h = 26 * s, i;
  c.fillStyle = "rgba(0,0,0,.32)";
  c.beginPath(); c.ellipse(p.x, p.y, 7 * s, 3.2 * s, 0, 0, 6.2832); c.fill();
  /* le tronc, légèrement penché */
  c.strokeStyle = "#161114"; c.lineWidth = 3.4 * s; c.lineCap = "round";
  c.beginPath();
  c.moveTo(p.x, p.y);
  c.quadraticCurveTo(p.x - 1.6 * s, p.y - h * 0.55, p.x + 1.2 * s, p.y - h);
  c.stroke();
  /* quatre branches nues, de plus en plus courtes vers le haut */
  var br = [[-1.0, 0.58, -10.5, -7.0], [1.4, 0.68, 9.0, -6.0],
            [0.4, 0.82, -7.5, -5.0], [1.0, 0.93, 6.0, -3.6]];
  c.lineWidth = 1.5 * s;
  for(i = 0; i < br.length; i++){
    var bx = p.x + br[i][0] * s, by = p.y - h * br[i][1];
    c.beginPath();
    c.moveTo(bx, by);
    c.quadraticCurveTo(bx + br[i][2] * 0.6 * s, by + br[i][3] * 0.2 * s,
                       bx + br[i][2] * s, by + br[i][3] * s);
    c.stroke();
    /* une brindille au bout */
    c.lineWidth = 0.9 * s;
    c.beginPath();
    c.moveTo(bx + br[i][2] * s, by + br[i][3] * s);
    c.lineTo(bx + br[i][2] * 1.28 * s, by + br[i][3] * 1.5 * s);
    c.stroke();
    c.lineWidth = 1.5 * s;
  }
  /* le pied qui couve encore */
  c.save();
  c.globalCompositeOperation = "lighter";
  var g = c.createRadialGradient(p.x, p.y - 1 * s, 1, p.x, p.y - 1 * s, 11 * s);
  g.addColorStop(0, "rgba(255,110,30,.34)");
  g.addColorStop(1, "rgba(220,60,10,0)");
  c.fillStyle = g;
  c.beginPath(); c.ellipse(p.x, p.y - 1 * s, 11 * s, 5 * s, 0, 0, 6.2832); c.fill();
  c.restore();
  c.fillStyle = "#c8410f";
  c.beginPath(); c.ellipse(p.x - 0.4 * s, p.y - 1.4 * s, 2.6 * s, 1.2 * s, 0, 0, 6.2832); c.fill();
  c.fillStyle = "#ff9a3c";
  c.beginPath(); c.ellipse(p.x - 0.4 * s, p.y - 1.6 * s, 1.3 * s, 0.6 * s, 0, 0, 6.2832); c.fill();
}

/* ================================================================
   MILY À IBIZA
   Le contraire exact des ténèbres : plein soleil, blanc, turquoise,
   et du mobilier qu'on ne trouve que là où les gens sont en vacances.
   Le piège serait de faire une seconde plage — c'est le MOBILIER qui
   sépare les deux, pas la palette.
   ================================================================ */

/* 0 — LE PARASOL DE PAILLE.
   Grand, rond, avec sa frange. C'est la silhouette qu'on reconnaît de
   loin, et l'ombre bleutée qu'il pose au sol vaut autant que lui. */
function parasolIbiza(c, gx, gy, s){
  var p = iso(gx, gy);
  var h = 34 * s, i;
  /* l'ombre portée, décalée : c'est elle qui donne midi */
  c.fillStyle = "rgba(40,70,110,.22)";
  c.beginPath(); c.ellipse(p.x + 7 * s, p.y + 2 * s, 15 * s, 6.4 * s, 0, 0, 6.2832); c.fill();
  pieuDecor(c, p.x, p.y, h, 1.5 * s, "#e8d6ae", "#b39a6e");
  /* la coupole de paille, en douze lattes */
  var gp = c.createLinearGradient(p.x - 16 * s, p.y - h, p.x + 16 * s, p.y - h + 8 * s);
  gp.addColorStop(0, "#f0dcae"); gp.addColorStop(0.5, "#dcc188"); gp.addColorStop(1, "#b99a63");
  c.fillStyle = gp;
  c.beginPath();
  c.moveTo(p.x - 16 * s, p.y - h + 3.4 * s);
  c.quadraticCurveTo(p.x, p.y - h - 9 * s, p.x + 16 * s, p.y - h + 3.4 * s);
  c.quadraticCurveTo(p.x, p.y - h + 7.4 * s, p.x - 16 * s, p.y - h + 3.4 * s);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(150,118,70,.45)"; c.lineWidth = 0.7 * s;
  for(i = -3; i <= 3; i++){
    c.beginPath();
    c.moveTo(p.x, p.y - h - 6 * s);
    c.quadraticCurveTo(p.x + i * 3 * s, p.y - h - 1 * s, p.x + i * 5.2 * s, p.y - h + 4.4 * s);
    c.stroke();
  }
  /* la frange */
  c.strokeStyle = "#c9a97a"; c.lineWidth = 0.8 * s; c.lineCap = "round";
  for(i = -5; i <= 5; i++){
    var fx = p.x + i * 3.0 * s;
    var fy = p.y - h + 4.6 * s + Math.abs(i) * 0.34 * s;
    c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + 0.5 * s, fy + 3.2 * s); c.stroke();
  }
  /* la pointe */
  c.fillStyle = "#8a6b3e";
  c.beginPath(); c.ellipse(p.x, p.y - h - 7.4 * s, 1.2 * s, 2.0 * s, 0, 0, 6.2832); c.fill();
}

/* 1 — LE TRANSAT ET SA SERVIETTE.
   Bois blanc, toile turquoise, une serviette jetée dessus. Toujours
   couché : c'est la seule pièce de mobilier horizontale de toutes les
   îles, et c'est ce qui la rend lisible d'un coup d'œil. */
function transatIbiza(c, gx, gy, s){
  var p = iso(gx, gy);
  c.fillStyle = "rgba(40,70,110,.18)";
  c.beginPath(); c.ellipse(p.x + 2 * s, p.y + 1 * s, 11 * s, 4.4 * s, 0, 0, 6.2832); c.fill();
  /* le piètement */
  c.strokeStyle = "#f4ecdb"; c.lineWidth = 1.6 * s; c.lineCap = "round";
  c.beginPath(); c.moveTo(p.x - 8 * s, p.y); c.lineTo(p.x - 4.4 * s, p.y - 6.4 * s); c.stroke();
  c.beginPath(); c.moveTo(p.x + 8 * s, p.y); c.lineTo(p.x + 4.4 * s, p.y - 6.4 * s); c.stroke();
  /* l'assise, puis le dossier relevé */
  c.fillStyle = "#1fb9c9";
  c.beginPath();
  c.moveTo(p.x - 9.4 * s, p.y - 5.4 * s);
  c.lineTo(p.x + 7.4 * s, p.y - 7.2 * s);
  c.lineTo(p.x + 7.4 * s, p.y - 9.4 * s);
  c.lineTo(p.x - 9.4 * s, p.y - 7.6 * s);
  c.closePath(); c.fill();
  c.fillStyle = "#17a0b4";
  c.beginPath();
  c.moveTo(p.x - 9.4 * s, p.y - 7.6 * s);
  c.lineTo(p.x - 14.4 * s, p.y - 16.4 * s);
  c.lineTo(p.x - 12.6 * s, p.y - 17.4 * s);
  c.lineTo(p.x - 7.6 * s, p.y - 8.6 * s);
  c.closePath(); c.fill();
  c.strokeStyle = "#f4ecdb"; c.lineWidth = 1.3 * s;
  c.beginPath(); c.moveTo(p.x - 14.8 * s, p.y - 16.0 * s); c.lineTo(p.x - 9.8 * s, p.y - 7.2 * s); c.stroke();
  /* la serviette blanche, jetée en travers */
  c.fillStyle = "#fdfaf2";
  c.beginPath();
  c.moveTo(p.x - 2.4 * s, p.y - 8.6 * s);
  c.lineTo(p.x + 4.6 * s, p.y - 9.4 * s);
  c.lineTo(p.x + 5.4 * s, p.y - 4.2 * s);
  c.lineTo(p.x - 1.6 * s, p.y - 3.4 * s);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(30,150,175,.5)"; c.lineWidth = 0.8 * s;
  c.beginPath(); c.moveTo(p.x - 2.0 * s, p.y - 6.6 * s); c.lineTo(p.x + 5.0 * s, p.y - 7.4 * s); c.stroke();
  /* le petit verre posé à côté */
  c.fillStyle = "rgba(255,255,255,.66)";
  c.fillRect(p.x + 9.6 * s, p.y - 5.6 * s, 2.4 * s, 4.4 * s);
  c.fillStyle = "#ffb03c";
  c.fillRect(p.x + 9.6 * s, p.y - 3.8 * s, 2.4 * s, 2.6 * s);
  c.strokeStyle = "#3ac86a"; c.lineWidth = 0.7 * s;
  c.beginPath(); c.moveTo(p.x + 10.2 * s, p.y - 5.8 * s); c.lineTo(p.x + 11.8 * s, p.y - 8.4 * s); c.stroke();
}

/* 2 — LE PALMIER DU CLUB.
   Plus haut et plus soigné que celui de la plage, avec un anneau de
   petites lampes autour du tronc : à Ibiza, même les arbres sont
   éclairés. C'est ce détail qui empêche l'île de n'être qu'une plage
   plus claire. */
function palmierIbiza(c, gx, gy, s){
  var p = iso(gx, gy);
  var h = 44 * s, i;
  c.fillStyle = "rgba(40,70,110,.20)";
  c.beginPath(); c.ellipse(p.x + 5 * s, p.y + 1 * s, 11 * s, 4.4 * s, 0, 0, 6.2832); c.fill();
  /* le tronc, courbe et annelé */
  c.strokeStyle = "#b99a6e"; c.lineWidth = 3.6 * s; c.lineCap = "round";
  c.beginPath();
  c.moveTo(p.x, p.y);
  c.quadraticCurveTo(p.x - 4 * s, p.y - h * 0.55, p.x + 2.6 * s, p.y - h);
  c.stroke();
  c.strokeStyle = "rgba(120,96,62,.55)"; c.lineWidth = 0.8 * s;
  for(i = 1; i < 7; i++){
    var t = i / 7, u = 1 - t;
    var tx = u * u * p.x + 2 * u * t * (p.x - 4 * s) + t * t * (p.x + 2.6 * s);
    var ty = u * u * p.y + 2 * u * t * (p.y - h * 0.55) + t * t * (p.y - h);
    c.beginPath(); c.moveTo(tx - 2.0 * s, ty); c.lineTo(tx + 2.0 * s, ty - 0.6 * s); c.stroke();
  }
  /* sept palmes, en éventail */
  var pal = [[-1.15, 19], [-0.72, 21], [-0.24, 20], [0.24, 21], [0.72, 20], [1.15, 18], [0, 15]];
  for(i = 0; i < pal.length; i++){
    var a = pal[i][0], lg = pal[i][1] * s;
    var ex = p.x + 2.6 * s + Math.sin(a) * lg;
    var ey = p.y - h - Math.cos(a) * lg * 0.52 + 4 * s;
    c.fillStyle = i % 2 ? "#2f6b45" : "#3c8a55";
    c.beginPath();
    c.moveTo(p.x + 2.6 * s, p.y - h);
    c.quadraticCurveTo((p.x + 2.6 * s + ex) / 2 + Math.sin(a) * 2 * s,
                       (p.y - h + ey) / 2 - 5 * s, ex, ey);
    c.quadraticCurveTo((p.x + 2.6 * s + ex) / 2 + Math.sin(a) * 2 * s,
                       (p.y - h + ey) / 2 - 1 * s, p.x + 2.6 * s, p.y - h + 1.4 * s);
    c.closePath(); c.fill();
  }
  /* les noix de coco */
  c.fillStyle = "#7d5a33";
  c.beginPath(); c.ellipse(p.x + 1.0 * s, p.y - h + 2.6 * s, 1.7 * s, 1.5 * s, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(p.x + 4.4 * s, p.y - h + 3.4 * s, 1.5 * s, 1.3 * s, 0, 0, 6.2832); c.fill();
  /* l'anneau de lampes autour du tronc */
  for(i = 0; i < 5; i++){
    var b = i / 5 * 6.2832 + 0.3;
    lampionDecor(c, p.x + Math.cos(b) * 5.4 * s - 0.6 * s,
                    p.y - h * 0.30 + Math.sin(b) * 2.6 * s,
                    1.1 * s, "#ffe0a0", 0.34);
  }
}

/* 3 — LE CARRÉ LOUNGE.
   Un tapis, deux poufs blancs, une table basse et sa lanterne. C'est
   le « coin » que réclame un beach club : on doit sentir qu'on
   pourrait s'y asseoir. */
function loungeIbiza(c, gx, gy, s){
  var p = iso(gx, gy);
  var i;
  /* le tapis, losange iso */
  c.fillStyle = "#e7dcc6";
  c.beginPath();
  c.moveTo(p.x, p.y - 8 * s);
  c.lineTo(p.x + 17 * s, p.y);
  c.lineTo(p.x, p.y + 8 * s);
  c.lineTo(p.x - 17 * s, p.y);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(30,150,175,.42)"; c.lineWidth = 1.0 * s;
  c.beginPath();
  c.moveTo(p.x, p.y - 5.4 * s);
  c.lineTo(p.x + 11.6 * s, p.y);
  c.lineTo(p.x, p.y + 5.4 * s);
  c.lineTo(p.x - 11.6 * s, p.y);
  c.closePath(); c.stroke();
  /* deux poufs */
  var poufs = [[-8.4, -1.4], [8.4, 1.4]];
  for(i = 0; i < poufs.length; i++){
    var px = p.x + poufs[i][0] * s, py = p.y + poufs[i][1] * s;
    c.fillStyle = "rgba(40,70,110,.18)";
    c.beginPath(); c.ellipse(px + 1.4 * s, py + 0.8 * s, 5.4 * s, 2.4 * s, 0, 0, 6.2832); c.fill();
    c.fillStyle = "#fdfaf2";
    c.beginPath();
    if(c.roundRect) c.roundRect(px - 4.6 * s, py - 7.4 * s, 9.2 * s, 7.4 * s, 2.2 * s);
    else c.rect(px - 4.6 * s, py - 7.4 * s, 9.2 * s, 7.4 * s);
    c.fill();
    c.fillStyle = "#e2d8c4";
    c.beginPath(); c.ellipse(px, py - 7.2 * s, 4.6 * s, 2.0 * s, 0, 0, 6.2832); c.fill();
    c.fillStyle = "#1fb9c9";
    c.fillRect(px - 4.6 * s, py - 3.0 * s, 9.2 * s, 1.1 * s);
  }
  /* la table basse et sa lanterne */
  c.fillStyle = "#8a6b45";
  c.fillRect(p.x - 0.9 * s, p.y - 5.4 * s, 1.8 * s, 5.4 * s);
  c.fillStyle = "#c9a97a";
  c.beginPath(); c.ellipse(p.x, p.y - 5.8 * s, 5.4 * s, 2.5 * s, 0, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,255,255,.30)";
  c.fillRect(p.x - 2.0 * s, p.y - 12.4 * s, 4.0 * s, 6.6 * s);
  c.strokeStyle = "#b0a68f"; c.lineWidth = 0.7 * s;
  c.strokeRect(p.x - 2.0 * s, p.y - 12.4 * s, 4.0 * s, 6.6 * s);
  lampionDecor(c, p.x, p.y - 9.0 * s, 1.5 * s, "#ffd88c", 0.5);
}
