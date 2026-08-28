/* ================================================================
   LE BESTIAIRE ENCHANTÉ — « Les Mily et une nuits »

   « Des paons, des chats blancs, des renards lumineux, des papillons
   géants. »

   ────────────────────────────────────────────────────────────────
   CE QUI LES SÉPARE DE LA FAUNE DE LA JUNGLE
   ────────────────────────────────────────────────────────────────

   La jungle est habitée par des bêtes qui VIVENT là : un singe mange,
   un panda s'assoit, un cochon d'Inde détale. Elles sont crédibles, et
   c'est tout ce qu'on leur demandait.

   Ici on ne cherche pas la crédibilité, on cherche l'APPARITION. Ces
   quatre-là ne sont pas des animaux qui habitent l'île, ce sont des
   animaux qu'on CROISE — et la différence tient en trois règles qui
   valent pour les quatre :

     ILS ÉMETTENT DE LA LUMIÈRE. Pas un reflet, pas un éclairage : une
     lueur qui leur appartient et qui se pose sur le sol autour d'eux.
     C'est ce qui les range du côté des lanternes et des fontaines
     plutôt que du côté des sangliers.

     ILS LAISSENT UNE TRACE. Un sillage de poussière d'étoile derrière
     eux, qui s'éteint en deux secondes. Un animal ordinaire passe ; un
     animal enchanté laisse quelque chose.

     ILS NE SONT JAMAIS TOUT À FAIT OPAQUES. Le chat de lune est le
     plus transparent des quatre, le paon le moins — mais aucun n'est
     peint à plein. On doit pouvoir douter de les avoir vus.

   ────────────────────────────────────────────────────────────────
   ET ILS SONT PAISIBLES
   ────────────────────────────────────────────────────────────────

   `fuit:1`, comme la faune de la jungle : ils s'écartent, ils
   n'attaquent pas. Une île déjà défendue par huit cent quarante
   tourelles n'a pas besoin d'un paon agressif.
   ================================================================ */

/* Le sillage, commun aux quatre. Il ne mémorise rien : la position
   passée d'une bête se recalcule à partir de son propre mouvement,
   qui est une fonction du temps. Le même principe que la traînée des
   étoiles filantes — gratuit, et jamais désynchronisé. */
function sillageEnchante(c, x, y, ph, n, tps, teinte, larg){
  c.save();
  c.globalCompositeOperation = "lighter";
  for(var i = 1; i <= 5; i++){
    var f = 1 - i / 6;
    var dx = -Math.sin(tps * 0.9 + ph) * i * 2.2 - i * 1.4;
    var dy = Math.sin(tps * 1.7 + ph + i * 0.6) * 1.2;
    c.globalAlpha = f * f * 0.42;
    c.fillStyle = "rgba(" + teinte + ",1)";
    c.beginPath();
    c.arc(x + dx, y + dy, larg * f * 0.7, 0, 6.2832);
    c.fill();
  }
  c.restore();
}

/* La flaque de lumière au sol. Elle est TRÈS plate — c'est ce qui la
   pose sur la terre au lieu de la faire flotter autour de la bête. */
function lueurAuSol(c, x, y, r, teinte, a){
  var g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, "rgba(" + teinte + "," + a + ")");
  g.addColorStop(1, "rgba(" + teinte + ",0)");
  c.save();
  c.globalCompositeOperation = "lighter";
  c.fillStyle = g;
  c.beginPath(); c.ellipse(x, y, r, r * 0.38, 0, 0, 6.2832); c.fill();
  c.restore();
}

/* ================================================================
   LE PAON

   C'est la pièce du bestiaire, et sa roue est tout le sujet. Elle ne
   s'ouvre pas en permanence : un paon qui fait la roue sans arrêt est
   un motif de papier peint. Elle s'ouvre par CYCLES longs — une fois
   toutes les vingt secondes environ, chaque oiseau à son heure — et
   c'est ce qui en fait un événement qu'on a de la chance de voir.

   L'OCELLE FAIT L'OISEAU. Une roue de plumes vertes sans ses yeux
   bleus n'est pas une roue de paon, c'est un éventail. Chaque plume
   porte donc le sien : un disque bleu nuit, un anneau turquoise, un
   cœur violet. Trois cercles, et l'œil reconnaît l'animal avant
   d'avoir vu le corps.
   ================================================================ */
var PAON_ROUE = 21;                 // la période, en secondes
function paonOuverture(k, tps){
  var t = ((tps * 0.5 + (k.ph || 0) * 3.1) % (PAON_ROUE * 0.5)) / (PAON_ROUE * 0.5);
  /* ouvre en 12 %, tient 30 %, referme en 18 %, dort le reste */
  if(t < 0.12) return t / 0.12;
  if(t < 0.42) return 1;
  if(t < 0.60) return 1 - (t - 0.42) / 0.18;
  return 0;
}
function dessinePaon(c, k, tps){
  var ph = k.ph || 0, n = k.n || 0;
  var sur = fauneSursaut(k, tps);
  var ouv = paonOuverture(k, tps);
  /* effrayé, il referme d'un coup : c'est la réaction juste, et elle
     donne au joueur un retour sur son propre passage */
  ouv *= (1 - sur);
  var pas = Math.sin(tps * 2.1 + ph) * 0.6;
  var y0 = -sur * 3;

  lueurAuSol(c, 0, 0, 22 + ouv * 16, "120,220,200", 0.20 + ouv * 0.14);
  c.fillStyle = "rgba(0,0,0,.22)";
  c.beginPath(); c.ellipse(0, 0, 6.5, 2.4, 0, 0, 6.2832); c.fill();

  c.save();
  c.translate(0, y0);

  /* ---- LA ROUE, derrière tout le reste ---- */
  if(ouv > 0.02){
    c.save();
    c.translate(-2, -13);
    var NP = 17, R = (11 + ouv * 25);
    for(var i = 0; i < NP; i++){
      var u = i / (NP - 1);                       // 0 → 1 de gauche à droite
      var a = (-1 + u * 2) * (0.30 + ouv * 1.30);  // l'éventail s'écarte
      var lg = R * (0.72 + 0.28 * Math.sin(u * 3.1416));
      var ex = Math.sin(a) * lg, ey = -Math.cos(a) * lg * 0.86;
      /* la tige */
      c.strokeStyle = "rgba(64,132,110," + (0.55 * ouv) + ")";
      c.lineWidth = 1.1;
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(ex * 0.5, ey * 0.42, ex, ey); c.stroke();
      /* la barbe de la plume */
      c.fillStyle = "rgba(46,150,128," + (0.34 * ouv) + ")";
      c.beginPath();
      c.ellipse(ex * 0.84, ey * 0.84, 3.4 * ouv, 6.2 * ouv, a, 0, 6.2832);
      c.fill();
      /* L'OCELLE : trois cercles, et l'oiseau est reconnu. */
      var oa = 0.9 * ouv;
      c.fillStyle = "rgba(28,52,96," + oa + ")";
      c.beginPath(); c.arc(ex, ey, 3.1 * ouv, 0, 6.2832); c.fill();
      c.fillStyle = "rgba(78,214,196," + oa + ")";
      c.beginPath(); c.arc(ex, ey, 2.1 * ouv, 0, 6.2832); c.fill();
      c.fillStyle = "rgba(126,72,190," + oa + ")";
      c.beginPath(); c.arc(ex, ey, 1.1 * ouv, 0, 6.2832); c.fill();
    }
    c.restore();
  }

  /* ---- LE CORPS ---- */
  /* pattes */
  c.strokeStyle = "#8a6a3e"; c.lineWidth = 1.2; c.lineCap = "round";
  c.beginPath(); c.moveTo(-1.4, -6); c.lineTo(-1.4 - pas, -0.4); c.stroke();
  c.beginPath(); c.moveTo(1.4, -6); c.lineTo(1.4 + pas, -0.4); c.stroke();
  /* le corps, bleu profond */
  var g = c.createRadialGradient(-1, -12, 1, 0, -9, 8);
  g.addColorStop(0, "#2f7fb4"); g.addColorStop(0.55, "#1d4f86"); g.addColorStop(1, "#122f5e");
  c.fillStyle = g;
  c.beginPath(); c.ellipse(0, -9, 6.2, 5.0, -0.12, 0, 6.2832); c.fill();
  /* le cou, long et courbé — c'est lui qui dit « paon » quand la roue
     est fermée */
  c.strokeStyle = "#1c62a8"; c.lineWidth = 3.4; c.lineCap = "round";
  c.beginPath();
  c.moveTo(2.6, -12); c.quadraticCurveTo(7.4, -18, 6.2, -24);
  c.stroke();
  /* la tête */
  c.fillStyle = "#2478c0";
  c.beginPath(); c.ellipse(6.4, -25.6, 2.6, 2.3, 0, 0, 6.2832); c.fill();
  /* l'aigrette : trois brins à pompon, l'attribut le plus reconnaissable */
  c.strokeStyle = "rgba(120,224,206,.9)"; c.lineWidth = 0.7;
  for(var b = -1; b <= 1; b++){
    var bx = 6.4 + b * 1.5, by = -27.6;
    c.beginPath(); c.moveTo(6.4, -27.4); c.lineTo(bx + b * 0.8, by - 3.4); c.stroke();
    c.fillStyle = "rgba(140,236,216,.95)";
    c.beginPath(); c.arc(bx + b * 0.8, by - 3.8, 0.85, 0, 6.2832); c.fill();
  }
  /* bec et œil */
  c.fillStyle = "#e8d0a0";
  c.beginPath(); c.moveTo(8.6, -25.9); c.lineTo(11.4, -25.2); c.lineTo(8.6, -24.6); c.closePath(); c.fill();
  c.fillStyle = "#0d1a2c";
  c.beginPath(); c.arc(7.4, -26.2, 0.75, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,255,255,.85)";
  c.beginPath(); c.arc(7.2, -26.4, 0.3, 0, 6.2832); c.fill();
  c.restore();
  sillageEnchante(c, -6, -10 + y0, ph, n, tps, "90,220,200", 2.6);
}

/* ================================================================
   LE CHAT DE LUNE

   Le plus transparent des quatre, et c'est voulu : il doit se voir
   comme on voit un chat blanc dans une cour la nuit — d'abord un
   mouvement, ensuite une forme.

   IL NE MARCHE PAS TOUT À FAIT AU SOL. Deux unités au-dessus, et son
   ombre est plus petite que lui. Rien dans le jeu ne fait ça, et c'est
   ce détail-là, plus que sa couleur, qui dit qu'il n'est pas
   ordinaire.
   ================================================================ */
function dessineChatlune(c, k, tps){
  var ph = k.ph || 0, n = k.n || 0;
  var sur = fauneSursaut(k, tps);
  var flot = Math.sin(tps * 1.3 + ph) * 1.6;
  var y0 = -3 - flot - sur * 6;
  var bat = Math.sin(tps * 2.4 + ph);

  lueurAuSol(c, 0, 0, 20, "210,232,255", 0.26);
  c.fillStyle = "rgba(0,0,0,.12)";
  c.beginPath(); c.ellipse(0, 0, 4.2, 1.5, 0, 0, 6.2832); c.fill();

  c.save();
  c.translate(0, y0);
  c.globalAlpha = 0.80;
  /* la queue, haute et ondulante — la signature du chat */
  c.strokeStyle = "rgba(238,246,255,.85)"; c.lineWidth = 2.2; c.lineCap = "round";
  c.beginPath();
  c.moveTo(-5, -7);
  c.quadraticCurveTo(-11 - bat * 1.6, -11, -9 + bat * 2.2, -18);
  c.stroke();
  /* le corps */
  var g = c.createRadialGradient(-1, -10, 1, 0, -8, 9);
  g.addColorStop(0, "rgba(255,255,255,.95)");
  g.addColorStop(0.6, "rgba(228,240,255,.78)");
  g.addColorStop(1, "rgba(186,212,246,.45)");
  c.fillStyle = g;
  c.beginPath(); c.ellipse(0, -8, 6.4, 3.9, -0.08, 0, 6.2832); c.fill();
  /* les pattes, à peine esquissées : un chat de lune n'a pas de pieds
     nets, sinon il se pose et cesse d'être une apparition */
  c.strokeStyle = "rgba(226,238,255,.5)"; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(-2.6, -5); c.lineTo(-2.6 + bat, -1.6); c.stroke();
  c.beginPath(); c.moveTo(2.8, -5); c.lineTo(2.8 - bat, -1.6); c.stroke();
  /* la tête */
  c.fillStyle = "rgba(250,253,255,.92)";
  c.beginPath(); c.ellipse(5.6, -12.4, 3.4, 3.0, 0, 0, 6.2832); c.fill();
  /* les oreilles */
  c.beginPath();
  c.moveTo(3.4, -14.6); c.lineTo(3.9, -18.4); c.lineTo(6.0, -15.2); c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(6.6, -15.2); c.lineTo(8.4, -18.0); c.lineTo(8.4, -14.4); c.closePath(); c.fill();
  /* LES YEUX : deux fentes d'or, la seule couleur chaude du dessin,
     et c'est par elles qu'on le repère dans le noir.
     IL LEUR FAUT UN CREUX SOMBRE DESSOUS. Peintes en additif à même
     la fourrure blanche, elles ressortaient BLANCHES — l'additif
     ajoute à ce qu'il trouve, et il ne trouvait que du blanc. On
     creuse donc l'orbite d'abord ; l'or a alors de quoi briller. */
  c.fillStyle = "rgba(24,34,58,.72)";
  c.beginPath(); c.ellipse(4.8, -12.9, 1.5, 2.0, 0.2, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(7.4, -12.9, 1.5, 2.0, -0.2, 0, 6.2832); c.fill();
  c.save();
  c.globalCompositeOperation = "lighter";
  c.fillStyle = "rgba(255,196,72,.95)";
  c.beginPath(); c.ellipse(4.8, -12.9, 0.85, 1.7, 0.2, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(7.4, -12.9, 0.85, 1.7, -0.2, 0, 6.2832); c.fill();
  /* la pupille, une fente verticale : c'est elle qui fait un chat */
  c.globalCompositeOperation = "source-over";
  c.fillStyle = "rgba(20,16,30,.85)";
  c.beginPath(); c.ellipse(4.8, -12.9, 0.26, 1.35, 0.2, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(7.4, -12.9, 0.26, 1.35, -0.2, 0, 6.2832); c.fill();
  c.restore();
  c.restore();
  sillageEnchante(c, -5, -8 + y0, ph, n, tps, "214,234,255", 2.4);
}

/* ================================================================
   LE FENNEC LUMINEUX

   Un renard du désert : de très grandes oreilles, un museau fin, une
   queue à bout clair. Le choix du fennec plutôt que du renard roux
   n'est pas cosmétique — c'est le renard de CETTE géographie-là, celle
   des dunes et des palais, et ses oreilles énormes le rendent
   reconnaissable à huit pixels de haut, ce qu'un renard ordinaire
   n'est pas.

   Sa lumière est AMBRÉE, seule chaleur d'un bestiaire par ailleurs
   bleu et vert : sur une île qui tire au froid, c'est ce qui le fait
   trouver du coin de l'œil.
   ================================================================ */
function dessineFennec(c, k, tps){
  var ph = k.ph || 0, n = k.n || 0;
  var sur = fauneSursaut(k, tps);
  var trot = Math.sin(tps * 3.4 + ph);
  var y0 = -sur * 4;

  lueurAuSol(c, 0, 0, 19, "255,196,110", 0.30);
  c.fillStyle = "rgba(0,0,0,.20)";
  c.beginPath(); c.ellipse(0, 0, 5.2, 1.9, 0, 0, 6.2832); c.fill();

  c.save();
  c.translate(0, y0);
  /* la queue, épaisse, à bout blanc */
  c.strokeStyle = "#e8b978"; c.lineWidth = 3.4; c.lineCap = "round";
  c.beginPath();
  c.moveTo(-4.4, -6.5);
  c.quadraticCurveTo(-10 - trot, -8.5, -12.4, -13 + trot * 1.4);
  c.stroke();
  c.strokeStyle = "rgba(255,246,226,.95)"; c.lineWidth = 3.0;
  c.beginPath();
  c.moveTo(-11.4, -11.6 + trot); c.lineTo(-12.6, -13.6 + trot * 1.4);
  c.stroke();
  /* pattes */
  c.strokeStyle = "#d9a460"; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(-2.2, -4.4); c.lineTo(-2.2 - trot * 1.5, -0.4); c.stroke();
  c.beginPath(); c.moveTo(2.6, -4.4); c.lineTo(2.6 + trot * 1.5, -0.4); c.stroke();
  /* le corps */
  var g = c.createLinearGradient(0, -12, 0, -2);
  g.addColorStop(0, "#ffd9a0"); g.addColorStop(0.6, "#eab476"); g.addColorStop(1, "#c98d4e");
  c.fillStyle = g;
  c.beginPath(); c.ellipse(0, -7, 5.8, 3.6, -0.06, 0, 6.2832); c.fill();
  /* le poitrail clair */
  c.fillStyle = "rgba(255,248,232,.8)";
  c.beginPath(); c.ellipse(1.6, -5.4, 3.0, 1.7, 0, 0, 6.2832); c.fill();
  /* la tête, museau fin */
  c.fillStyle = "#f2c184";
  c.beginPath(); c.ellipse(5.4, -10.4, 3.2, 2.7, 0, 0, 6.2832); c.fill();
  c.beginPath();
  c.moveTo(7.6, -10.2); c.lineTo(11.2, -9.0); c.lineTo(7.6, -8.2); c.closePath(); c.fill();
  /* LES OREILLES — la moitié de l'animal. Grandes, dressées, avec
     l'intérieur rose pâle qui capte la lumière. */
  for(var o = 0; o < 2; o++){
    var ox = 4.0 + o * 3.0, oi = o ? 1 : -1;
    c.fillStyle = "#eab476";
    c.beginPath();
    c.moveTo(ox - 1.6, -12.2);
    c.quadraticCurveTo(ox + oi * 1.0, -21.5, ox + 2.2, -12.0);
    c.closePath(); c.fill();
    c.fillStyle = "rgba(255,220,214,.85)";
    c.beginPath();
    c.moveTo(ox - 0.7, -12.6);
    c.quadraticCurveTo(ox + oi * 0.7, -19.2, ox + 1.3, -12.5);
    c.closePath(); c.fill();
  }
  /* l'œil, et le museau noir */
  c.fillStyle = "#2a1c12";
  c.beginPath(); c.arc(6.2, -11.0, 0.85, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(11.0, -9.0, 0.7, 0, 6.2832); c.fill();
  c.save();
  c.globalCompositeOperation = "lighter";
  c.fillStyle = "rgba(255,232,180,.9)";
  c.beginPath(); c.arc(5.9, -11.3, 0.34, 0, 6.2832); c.fill();
  c.restore();
  c.restore();
  sillageEnchante(c, -8, -8 + y0, ph, n, tps, "255,196,110", 2.8);
}

/* ================================================================
   LE PAPILLON GÉANT

   Trois fois le papillon de la jungle, et pas seulement en taille :
   celui-ci a des ailes TRANSLUCIDES nervurées, comme un vitrail, et
   il bat LENTEMENT. Un grand papillon qui bat vite est un papillon de
   nuit ordinaire agrandi ; c'est la lenteur qui donne l'envergure.

   Il vole plus haut que celui de la jungle et son ombre est loin
   au-dessous : c'est cet écart entre la bête et son ombre qui donne
   la hauteur, bien plus que sa position à l'écran.
   ================================================================ */
var PAPG_TEINTES = [
  ["168,120,255", "226,196,255"],
  ["96,196,255",  "196,236,255"],
  ["255,160,214", "255,220,238"]
];
function dessinePapillongeant(c, k, tps){
  var ph = k.ph || 0, n = k.n || 0;
  var sur = fauneSursaut(k, tps);
  /* la couleur vient de `teinte`, tirée à la génération : c'est le
     champ prévu pour ça, et il est le même chez tous les joueurs */
  var T = PAPG_TEINTES[(k.teinte | 0) % PAPG_TEINTES.length];
  /* le vol : deux sinus incommensurables, et une montée en escalier —
     il gagne de l'altitude en battant, il en perd en planant */
  var t = tps * 0.34 + ph;
  var x = Math.sin(t * 1.7) * 14 + Math.sin(t * 0.61 + n) * 9;
  var bat = Math.sin(tps * 1.9 + ph);           // LENT : c'est le sujet
  var y = -46 - Math.sin(t * 1.1 + n * 0.7) * 11 - bat * 3 - sur * 14;
  var incl = Math.cos(t * 1.7) * 0.26;

  /* l'ombre, très loin en dessous et très pâle */
  var f = Math.max(0.10, 1 + y / 78);
  c.fillStyle = "rgba(0,0,0," + (0.13 * f) + ")";
  c.beginPath(); c.ellipse(x * 0.6, 0, 5.4 * f + 0.8, 2.0 * f + 0.3, 0, 0, 6.2832); c.fill();
  lueurAuSol(c, x * 0.6, 0, 16 * f, T[0], 0.18 * f);

  c.save();
  c.translate(x, y);
  c.rotate(incl);
  /* L'AILE : une paire arrière large, une paire avant en pointe, et
     l'ouverture qui suit le battement. On la peint deux fois — la
     paire du fond plus sombre — sinon l'insecte est plat. */
  var ouv = 0.34 + 0.66 * (0.5 + 0.5 * bat);
  for(var cote = -1; cote <= 1; cote += 2){
    for(var pa = 0; pa < 2; pa++){                 // 0 : fond, 1 : devant
      var e = pa ? 1 : 0.86;
      var al = pa ? 0.62 : 0.36;
      c.save();
      c.scale(cote, 1);
      c.translate(pa ? 0 : -1.4, pa ? 0 : 1.6);
      /* aile arrière */
      var g1 = c.createLinearGradient(0, 0, 15 * e, 10 * e);
      g1.addColorStop(0, "rgba(" + T[1] + "," + al + ")");
      g1.addColorStop(1, "rgba(" + T[0] + "," + (al * 0.72) + ")");
      c.fillStyle = g1;
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(13 * e * ouv, 3 * e, 12 * e * ouv, 13 * e);
      c.quadraticCurveTo(6 * e * ouv, 12 * e, 0, 4 * e);
      c.closePath(); c.fill();
      /* aile avant, en pointe */
      var g2 = c.createLinearGradient(0, -2, 20 * e, -12 * e);
      g2.addColorStop(0, "rgba(" + T[1] + "," + (al * 1.15) + ")");
      g2.addColorStop(1, "rgba(" + T[0] + "," + (al * 0.6) + ")");
      c.fillStyle = g2;
      c.beginPath();
      c.moveTo(0, -1);
      c.quadraticCurveTo(15 * e * ouv, -6 * e, 19 * e * ouv, -13 * e);
      c.quadraticCurveTo(8 * e * ouv, -9 * e, 0, -3 * e);
      c.closePath(); c.fill();
      /* les nervures : trois traits, et l'aile devient un vitrail */
      if(pa){
        c.strokeStyle = "rgba(" + T[1] + ",.55)"; c.lineWidth = 0.6;
        for(var v = 0; v < 3; v++){
          c.beginPath();
          c.moveTo(0.5, -1 + v * 1.6);
          c.lineTo((10 + v * 3) * ouv, (-10 + v * 8));
          c.stroke();
        }
        /* l'ocelle de l'aile, celui qui imite un œil */
        c.save();
        c.globalCompositeOperation = "lighter";
        c.fillStyle = "rgba(" + T[1] + ",.8)";
        c.beginPath(); c.arc(11 * ouv, -7, 2.2, 0, 6.2832); c.fill();
        c.fillStyle = "rgba(255,255,255,.75)";
        c.beginPath(); c.arc(11 * ouv, -7, 0.9, 0, 6.2832); c.fill();
        c.restore();
      }
      c.restore();
    }
  }
  /* le corps et les antennes */
  c.fillStyle = "rgba(40,30,56,.85)";
  c.beginPath(); c.ellipse(0, 1, 1.7, 6.2, 0, 0, 6.2832); c.fill();
  c.strokeStyle = "rgba(60,44,80,.8)"; c.lineWidth = 0.55; c.lineCap = "round";
  for(var s = -1; s <= 1; s += 2){
    c.beginPath();
    c.moveTo(s * 0.6, -5);
    c.quadraticCurveTo(s * 4, -10, s * 6.4, -8.6);
    c.stroke();
  }
  c.restore();
  /* la poussière qu'il sème */
  c.save();
  c.globalCompositeOperation = "lighter";
  for(var d = 0; d < 4; d++){
    var fd = 1 - d / 4;
    c.globalAlpha = fd * fd * 0.5;
    c.fillStyle = "rgba(" + T[1] + ",1)";
    c.beginPath();
    c.arc(x - d * 5 - 4, y + 6 + Math.sin(tps * 2 + d + ph) * 3, 1.5 * fd + 0.4, 0, 6.2832);
    c.fill();
  }
  c.restore();
}
