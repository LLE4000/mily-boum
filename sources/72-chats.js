/* ================================================================
   LES TROIS CHATS DE MILY — Gribouille, Croquette, Praline
   ================================================================
   Trois bêtes protégées, et trois seulement. Elles ne frappent pas,
   elles ne se défendent pas : elles servent d'appât. Si une troupe en
   abat une, Mily le voit depuis le QG et répond au laser. Tout le
   dessin découle de là. Il faut que le joueur les REMARQUE avant de
   tirer, qu'il les reconnaisse au premier coup d'œil comme « ça, on
   n'y touche pas », et qu'il s'en veuille après coup.

   D'où quatre partis pris, tous dictés par le zoom de jeu (z ≈ 0,5 à
   0,9 : un chat de 24 px de haut n'en fait plus que 13 à l'écran).

   1. TROIS VALEURS FRANCHEMENT SÉPARÉES, pas trois nuances de roux.
      Gribouille est sombre — gris ardoise — mais taché de blanc pur ;
      Croquette est saturé — roux vif ; Praline est très claire —
      crème rosé aux extrémités chocolat. Quand il ne reste plus que
      treize pixels, la valeur est la seule chose qui survit.
   2. TROIS SILHOUETTES SÉPARÉES AUSSI, parce que sur l'herbe sombre
      la couleur ment. C'est la queue qui porte l'essentiel : épaisse
      et dressée en crosse chez Gribouille, plantée à la verticale
      comme une antenne chez Croquette, enroulée en point
      d'interrogation par-dessus le dos chez Praline. Même en ombre
      chinoise on sait qui est qui.
   3. UNE TÊTE DE TROIS QUARTS, donc DEUX yeux, là où la belette et
      Tweety sont de profil strict. Deux points sombres sur une face
      claire, c'est ce que l'œil humain accroche le plus vite — et
      c'est aussi ce qui fait la différence entre un chat mignon et un
      chat seulement joli.
   4. AUCUN DÉTAIL QUI NE SURVIVE PAS À LA RÉDUCTION. Pas de rayures
      fines : quatre bandes épaisses. Pas de pupille ciselée : un
      cerne sombre qui fait de l'œil une tache franche.

   Repère local, comme pour les autres créatures : les pattes en (0,0),
   les y négatifs vers le haut, et la bête regarde à DROITE — c'est
   l'appelant qui applique scale(-1,1) pour l'autre sens, donc jamais
   de miroir en dur ici.

   Aucun Math.random : toute la variation sort de tps, k.ph et k.n.
   ================================================================ */

/* ---------------------------------------------------------------
   Palettes. Sorties des fonctions de dessin pour qu'on puisse
   comparer les trois d'un coup d'œil : c'est le seul endroit où l'on
   vérifie que les trois chats ne se ressemblent pas.
   --------------------------------------------------------------- */
var PAL_CHAT = {
  /* Gribouille : tigré gris ardoise, blanc de chaussettes et de
     plastron. Ni l'herbe ni le sable ne sont gris — il se détache. */
  dos:"#949aab", flanc:"#727889", ventreO:"#565c6e", raie:"#2f3346",
  blanc:"#f6f4f0", blancO:"#d2d0cd",
  iris:"#c9dd5e", irisO:"#7fa02c",
  nez:"#e3948f", rose:"#cf8b88"
};
var PAL_CHATON = {
  /* Croquette : roux franc, le seul orange saturé de la carte. Sur
     l'herbe comme sur le sable, on ne peut pas le rater. */
  dos:"#ffa03a", flanc:"#ee7413", ventreO:"#c2560c", raie:"#8f3a05",
  blanc:"#fff2da", blancO:"#e8cfa8",
  iris:"#ffd062", irisO:"#dd8410",
  nez:"#f2a09b", rose:"#e6968d"
};
var PAL_CHATTE = {
  /* Praline : crème rosé et extrémités chocolat.
     Vérifié à la loupe sur le vrai décor : le crème seul se noie
     purement et simplement dans le sable clair de la plage, qui monte
     jusqu'à #f0e2c0. Ce sont les pointes qui la sauvent — alors elles
     sont presque noires, et elles couvrent les oreilles, le masque,
     les quatre bas de pattes et les deux tiers de la queue. Un corps
     clair enfermé dans des extrémités sombres, ça tient sur n'importe
     quel fond. Le crème est tiré vers le rose pour ne pas partager la
     teinte du sable. */
  dos:"#fae0d1", flanc:"#ddb8a3", ventreO:"#bb9078", raie:"#4e3227",
  patte:"#c39a83", botte:"#5c3b2d", blanc:"#fffbf6", blancO:"#e7d9cb",
  /* La queue vire du crème au chocolat sur toute sa longueur. Un
     simple bout sombre greffé sur une queue claire donnait, au zoom de
     jeu, une tache brune détachée qui flottait derrière la bête —
     on croyait à deux animaux. Le fondu garde la queue d'un seul
     tenant tout en gardant la pointe lisible. */
  queue:["#d8b09b", "#c39982", "#a87d67", "#8a6150", "#623d2e", "#4e3227"],
  iris:"#93d6f2", irisO:"#2f7ba8",
  nez:"#e79fa2", rose:"#c98a86"
};

/* ---------------------------------------------------------------
   Clignement. Rare et bref : les yeux restent grands ouverts 95 % du
   temps, sinon la bête a l'air endormie au lieu d'avoir l'air vivante.
   Renvoie l'ouverture, de 0 (fermé) à 1. Le décalage par la phase
   propre évite que les trois chats clignent en chœur.
   --------------------------------------------------------------- */
function chatClin(tps, ph){
  var p = (tps * 0.26 + ph * 0.19) % 1;
  if(p > 0.055) return 1;
  return Math.abs(Math.cos(p / 0.055 * 3.1416));
}

/* Tic d'oreille : immobile, puis une secousse sèche de trois dixièmes.
   C'est ce petit mouvement isolé, sur une bête par ailleurs posée, qui
   fait croire qu'elle est vivante. */
function chatTic(tps, ph, periode){
  var p = (tps + ph * 1.7) % periode;
  if(p > 0.38) return 0;
  return Math.sin(p / 0.38 * 9.4248) * (1 - p / 0.38);
}

/* Point et tangente d'une quadratique. */
function chatSurCourbe(x0, y0, cx, cy, x1, y1, t){
  var u = 1 - t;
  return { x: u * u * x0 + 2 * u * t * cx + t * t * x1,
           y: u * u * y0 + 2 * u * t * cy + t * t * y1 };
}
/* Idem sur une suite de quadratiques mises bout à bout. */
function chatSurTrace(trace, t){
  var n = trace.length;
  var i = Math.floor(t * n); if(i > n - 1) i = n - 1;
  var s = trace[i];
  return chatSurCourbe(s[0], s[1], s[2], s[3], s[4], s[5], t * n - i);
}

/* ---------------------------------------------------------------
   LE BOUDIN EFFILÉ — une file de disques dont le rayon décroît le
   long d'une courbe. Sert aux queues comme aux pattes.
   Première version faite au trait d'épaisseur constante : ça donnait
   des gourdins et des pilotis. C'est l'effilement qui fait le chat,
   et sur une queue c'est même toute la lisibilité de la silhouette.
   « echelle » fait virer la couleur le long du boudin — c'est la queue
   de Praline, claire à la racine et presque noire au bout. Une teinte
   pré-calculée par palier plutôt qu'un melange() par disque : les
   couleurs ne changent jamais, il n'y a aucune raison de reparser de
   l'hexadécimal soixante-dix fois par image.
   o : { n, e0, e1, coul, echelle, anneaux, raie, bout, tBout }
   --------------------------------------------------------------- */
function chatBoudin(c, trace, o){
  var n = o.n || 20, i, t, p, e, u, m;
  for(i = 0; i <= n; i++){
    t = i / n;
    p = chatSurTrace(trace, t);
    e = o.e0 + (o.e1 - o.e0) * t;
    if(o.echelle){
      m = Math.floor(t * o.echelle.length);
      if(m > o.echelle.length - 1) m = o.echelle.length - 1;
      c.fillStyle = o.echelle[m];
    }else c.fillStyle = o.coul;
    if(o.anneaux){
      u = t * (o.anneaux * 2 + 1.3);
      if((Math.floor(u) % 2) === 1) c.fillStyle = o.raie;
    }
    if(o.bout && t > (o.tBout || 0.85)) c.fillStyle = o.bout;
    c.beginPath(); c.arc(p.x, p.y, e, 0, 6.2832); c.fill();
  }
}

/* Une patte : boudin court, légèrement plié, et un coussinet au bout.
   « bas » est la fraction de la patte à partir de laquelle on passe à la
   couleur de la chaussette — c'est ce qui fait les bas blancs de
   Gribouille et les bas chocolat de Praline. Un simple coussinet ne
   suffisait pas : à z = 0,5 il ne reste qu'un pixel, alors qu'un bas
   entier reste une tache. */
function chatPatte(c, x, yh, yb, dec, e0, e1, coul, chaussette, ep, bas){
  var mx = x + dec * 0.45, my = (yh + yb) * 0.5;
  chatBoudin(c, [[x, yh, mx, my, x + dec, yb]],
             { n:7, e0:e0, e1:e1, coul:coul, bout:bas ? chaussette : 0, tBout:bas });
  c.fillStyle = chaussette;
  c.beginPath(); c.ellipse(x + dec, yb + 0.1, ep, ep * 0.72, 0, 0, 6.2832); c.fill();
}

/* ---------------------------------------------------------------
   L'ŒIL. La pièce maîtresse : c'est lui qui fait la mignonnerie et
   c'est lui qui doit survivre à la réduction. D'où le cerne sombre
   plus large que l'iris — à z = 0,5 l'œil entier devient un point
   noir franc sur la face claire, et deux points noirs, c'est un
   visage.
   ouv : ouverture 0..1 (clignement). reg : décalage du regard.
   --------------------------------------------------------------- */
function chatOeil(c, x, y, r, iris, irisO, ouv, reg){
  /* Le clin bascule tôt sur l'arc fermé. En laissant l'ouverture
     descendre jusqu'à zéro, l'œil s'écrasait en lentille couchée et le
     chat avait l'air de loucher, pas de cligner : un clin dure trois
     images, il vaut mieux qu'il claque. */
  if(ouv < 0.5){
    /* fermé : l'arc vers le bas, celui du chat content */
    c.strokeStyle = "rgba(30,22,20,.82)";
    c.lineWidth = Math.max(0.5, r * 0.3); c.lineCap = "round";
    c.beginPath();
    c.moveTo(x - r * 0.95, y - r * 0.2);
    c.quadraticCurveTo(x, y + r * 0.6, x + r * 0.95, y - r * 0.2);
    c.stroke();
    return;
  }
  c.save();
  c.translate(x, y);
  c.scale(1, 0.62 + 0.76 * (ouv - 0.5));
  c.fillStyle = "rgba(28,21,22,.92)";
  c.beginPath(); c.ellipse(0, 0, r * 1.18, r * 1.18, 0, 0, 6.2832); c.fill();
  /* iris : deux tons plats. Un dégradé serait illisible à cette taille
     et coûterait un CanvasGradient par œil et par image. */
  c.fillStyle = irisO;
  c.beginPath(); c.arc(0, 0, r, 0, 6.2832); c.fill();
  c.fillStyle = iris;
  c.beginPath(); c.arc(0, -r * 0.18, r * 0.82, 0, 6.2832); c.fill();
  /* Pupille dilatée : un chat curieux, pas un chat qui chasse. Elle
     était plus haute et plus fine, et l'iris ne se voyait plus qu'en
     deux croissants de part et d'autre : l'œil entier prenait l'air
     d'une lentille couchée. Il lui faut un anneau de couleur tout
     autour, sinon on perd et la couleur et la rondeur. */
  c.fillStyle = "#171119";
  c.beginPath(); c.ellipse(reg * r * 0.26, 0, r * 0.46, r * 0.72, 0, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,255,255,.95)";
  c.beginPath(); c.arc(-r * 0.36, -r * 0.42, r * 0.31, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,255,255,.5)";
  c.beginPath(); c.arc(r * 0.42, r * 0.4, r * 0.15, 0, 6.2832); c.fill();
  c.restore();
}

/* ---------------------------------------------------------------
   L'OREILLE. Triangle à pointe arrondie, intérieur rose. « cran »
   entaille le bord pour l'oreille déchirée de Gribouille — mais
   l'entaille seule ne survit pas au dézoom, alors on double le signal
   en la posant à un angle différent de sa jumelle. Une oreille de
   travers, ça se lit à n'importe quelle taille.
   --------------------------------------------------------------- */
function chatOreille(c, x, y, l, larg, ang, ext, intr, cran){
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  c.fillStyle = ext;
  c.beginPath();
  c.moveTo(-larg * 0.5, 1.0);
  if(cran){
    /* La pointe reste : c'est le BORD qui est entamé. Une oreille dont
       on avait mangé le sommet ne se lisait plus comme une oreille,
       juste comme un éclat cassé. Une encoche en V sur le bord
       extérieur, en revanche, se lit tout de suite comme une cicatrice
       de bagarre — et l'oreille reste une oreille. */
    c.quadraticCurveTo(-larg * 0.42, -l * 0.74, -larg * 0.06, -l);
    c.lineTo(larg * 0.13, -l * 0.60);           /* la morsure */
    c.lineTo(larg * 0.31, -l * 0.76);
    c.quadraticCurveTo(larg * 0.50, -l * 0.46, larg * 0.5, 1.0);
  }else{
    c.quadraticCurveTo(-larg * 0.42, -l * 0.74, 0, -l);
    c.quadraticCurveTo(larg * 0.46, -l * 0.68, larg * 0.5, 1.0);
  }
  c.closePath();
  c.fill();
  /* L'intérieur est écrêté par l'oreille elle-même : sur l'oreille
     fendue de Gribouille, le rose dépassait par la morsure et lui
     plantait un éclat rose au-dessus du crâne. */
  c.save();
  c.clip();
  c.fillStyle = intr;
  c.beginPath();
  c.moveTo(-larg * 0.25, 0.2);
  c.quadraticCurveTo(-larg * 0.20, -l * 0.50, -larg * (cran ? 0.05 : 0), -l * 0.62);
  c.quadraticCurveTo(larg * 0.21, -l * 0.44, larg * 0.24, 0.2);
  c.closePath(); c.fill();
  c.restore();
  c.restore();
}

/* Moustaches : trois brins par côté, très pâles. Elles ne survivent pas
   au dézoom, et c'est très bien — elles sont là pour le moment où le
   joueur s'approche, juste avant de décider de ne pas tirer. */
function chatMoustaches(c, x, y, lon, ouvert, sens, alpha){
  c.strokeStyle = "rgba(255,252,246," + alpha + ")";
  c.lineWidth = 0.42; c.lineCap = "round";
  for(var w = -1; w <= 1; w++){
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + lon * 0.55 * sens, y + w * ouvert * 0.45 - 0.4,
                       x + lon * sens, y + w * ouvert);
    c.stroke();
  }
}

/* Le museau, commun aux trois : deux coussinets, le nez en cœur, la
   bouche en oméga. C'est la partie la plus « chat » du dessin. */
function chatMuseau(c, x, y, e, clair, nez){
  c.fillStyle = clair;
  c.beginPath(); c.ellipse(x - e * 0.6, y + e * 0.16, e * 0.9, e * 0.7, -0.16, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(x + e * 0.6, y + e * 0.16, e * 0.9, e * 0.7, 0.16, 0, 6.2832); c.fill();
  c.fillStyle = nez;
  c.beginPath();
  c.moveTo(x - e * 0.44, y - e * 0.5);
  c.quadraticCurveTo(x, y - e * 0.76, x + e * 0.44, y - e * 0.5);
  c.quadraticCurveTo(x + e * 0.2, y + e * 0.22, x, y + e * 0.3);
  c.quadraticCurveTo(x - e * 0.2, y + e * 0.22, x - e * 0.44, y - e * 0.5);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(72,50,46,.5)"; c.lineWidth = e * 0.15; c.lineCap = "round";
  c.beginPath();
  c.moveTo(x, y + e * 0.3);
  c.quadraticCurveTo(x - e * 0.3, y + e * 0.84, x - e * 0.74, y + e * 0.4);
  c.stroke();
  c.beginPath();
  c.moveTo(x, y + e * 0.3);
  c.quadraticCurveTo(x + e * 0.3, y + e * 0.84, x + e * 0.74, y + e * 0.4);
  c.stroke();
}

/* ---------------------------------------------------------------
   Le liseré de lumière. Première version : un trait clair posé
   PAR-DESSUS le corps — il flottait comme une limace pâle à côté de
   la bête. La bonne façon, c'est d'écrêter par le corps lui-même et
   de repasser son propre contour : le trait tombe alors exactement à
   l'intérieur de la silhouette et lui donne du volume.
   « corps » et « dos » sont deux fonctions qui tracent, sans remplir.
   --------------------------------------------------------------- */
function chatVolume(c, corps, dos, ventre, clair, sombre){
  c.save();
  corps(c); c.clip();
  c.strokeStyle = clair; c.lineWidth = 2.6; c.lineCap = "round";
  dos(c); c.stroke();
  c.strokeStyle = sombre; c.lineWidth = 3.4;
  ventre(c); c.stroke();
  c.restore();
}

/* ================================================================
   GRIBOUILLE, LE CHAT
   Matou adulte, tigré gris, un peu cabossé : l'oreille droite fendue
   et de travers, la tête portée bas, le poitrail en avant. Il ne
   marche pas, il traverse — c'est chez lui.
   Silhouette : la plus large et la plus basse des trois, queue épaisse
   dressée en crosse.
   ================================================================ */
function chatCorpsG(c, d){
  c.beginPath();
  c.moveTo(-8.6, -11.8);                                  /* croupe */
  c.quadraticCurveTo(-9.8, -15.9 - d, -3.8, -16.3 - d);   /* dos */
  c.quadraticCurveTo(2.2, -16.7 - d, 6.6, -15.2);         /* garrot */
  c.quadraticCurveTo(10.4, -14.0, 10.2, -10.6);           /* poitrail */
  c.quadraticCurveTo(10.0, -7.6, 7.0, -7.2);              /* coude */
  c.quadraticCurveTo(1.6, -6.4, -2.4, -7.8);              /* ventre */
  c.quadraticCurveTo(-6.8, -9.2, -8.6, -11.8);            /* cuisse */
  c.closePath();
}
function chatDosG(c, d){
  c.beginPath();
  c.moveTo(-8.8, -11.6);
  c.quadraticCurveTo(-9.8, -15.9 - d, -3.8, -16.3 - d);
  c.quadraticCurveTo(2.2, -16.7 - d, 6.6, -15.2);
  c.quadraticCurveTo(9.6, -14.2, 10.2, -11.8);
}
function chatVentreG(c){
  c.beginPath();
  c.moveTo(9.2, -7.4);
  c.quadraticCurveTo(1.6, -6.0, -2.4, -7.4);
  c.quadraticCurveTo(-6.2, -8.6, -8.4, -11.2);
}
function dessineChat(c, k, tps){
  var P = PAL_CHAT;
  var ph = k.ph || 0;
  var fuit = k.etat === "fuite";
  var bond = Math.abs(Math.sin(k.phase));
  var saut = fuit ? bond * 3.0 : bond * 0.7;
  var d = fuit ? -1.4 : Math.sin(k.phase) * 0.45;          /* le dos qui travaille */
  /* le roulis d'épaules : c'est lui, la démarche de patron */
  var roule = fuit ? 0.05 : Math.sin(tps * 1.05 + ph) * 0.024;
  var ouv = fuit ? 1 : chatClin(tps, ph);
  var tic = chatTic(tps, ph, 3.9);
  /* la tête pivote lentement : le joueur croit qu'il le regarde */
  var lacet = fuit ? -0.24 : Math.sin(tps * 0.58 + ph * 2.1) * 0.30;
  var ec = Math.sin(k.phase) * (fuit ? 4.4 : 3.0);

  c.fillStyle = "rgba(0,0,0,.26)";
  c.beginPath(); c.ellipse(0.6, 0, 9.4 - bond * 1.6, 3.3 - bond * 0.7, 0, 0, 6.2832); c.fill();

  c.save();
  c.translate(0, -saut);
  c.rotate(roule);

  /* ---- la queue, derrière tout le reste. Elle part de l'intérieur du
     corps : sinon elle a l'air posée à côté de la bête. ---- */
  /* La queue balaie franchement. Première version à ±2,4 : au banc
     d'animation les six images étaient indiscernables, et une queue de
     chat qui ne bouge pas, c'est un chat empaillé. */
  var onde = fuit ? 0 : Math.sin(tps * 1.5 + ph) * 3.4;
  var lev = fuit ? 0 : Math.sin(tps * 1.5 + ph + 0.9) * 1.6;
  var q = fuit
    ? [[-5.6, -10.4, -12.5, -10.8, -16.6, -8.8],
       [-16.6, -8.8, -20.0, -7.0, -21.2, -4.4]]
    : [[-5.6, -10.8, -11.8 + onde * 0.3, -12.6, -12.8 + onde * 0.5, -17.2 - lev * 0.4],
       [-12.8 + onde * 0.5, -17.2 - lev * 0.4, -13.6 + onde * 0.9, -21.6 - lev,
        -9.4 + onde * 1.15, -23.0 - lev * 1.3]];
  chatBoudin(c, q, { n:20, e0:2.4, e1:1.3, coul:P.flanc,
                     anneaux:3, raie:P.raie, bout:P.blanc, tBout:0.88 });

  /* ---- pattes du fond : plus sombres, elles reculent ---- */
  chatPatte(c, -5.8, -9.2, -1.2, -ec, 1.5, 1.05, P.ventreO, P.blancO, 1.9, 0.62);
  chatPatte(c,  6.2, -9.8, -1.2,  ec, 1.5, 1.05, P.ventreO, P.blancO, 1.9, 0.62);

  /* ---- le corps ---- */
  c.fillStyle = degCache(c, "chatCorps", function(){
    var g = c.createLinearGradient(0, -18, 0, -5);
    g.addColorStop(0, PAL_CHAT.dos);
    g.addColorStop(0.5, PAL_CHAT.flanc);
    g.addColorStop(1, PAL_CHAT.ventreO);
    return g;
  });
  chatCorpsG(c, d); c.fill();

  /* rayures maquereau : quatre, épaisses. Quatre fines auraient fondu
     en un gris uniforme dès le premier cran de dézoom. */
  c.save();
  chatCorpsG(c, d); c.clip();
  c.strokeStyle = "rgba(40,44,64,.5)"; c.lineWidth = 2.2; c.lineCap = "round";
  for(var i = 0; i < 4; i++){
    var rx = -5.8 + i * 3.7;
    c.beginPath();
    c.moveTo(rx, -17.4 - d);
    c.quadraticCurveTo(rx + 1.4, -12.4, rx + 0.4, -7.6);
    c.stroke();
  }
  c.strokeStyle = "rgba(40,44,64,.34)"; c.lineWidth = 1.9;
  c.beginPath();
  c.moveTo(-8.4, -13.8);
  c.quadraticCurveTo(-0.6, -17.3 - d, 9.0, -14.0);
  c.stroke();
  c.restore();

  chatVolume(c, function(cc){ chatCorpsG(cc, d); },
                function(cc){ chatDosG(cc, d); },
                chatVentreG,
                "rgba(255,252,244,.30)", "rgba(38,40,56,.30)");

  /* ---- plastron blanc : la tache franche qui accroche l'œil de loin.
     Il descend du menton au coude, en biais, pour ne pas fusionner
     avec la chaussette blanche de l'antérieure. ---- */
  c.fillStyle = P.blanc;
  c.beginPath();
  c.moveTo(10.3, -13.6);
  c.quadraticCurveTo(11.0, -9.8, 8.4, -7.4);
  c.quadraticCurveTo(6.0, -7.0, 5.8, -9.0);
  c.quadraticCurveTo(7.2, -11.2, 7.8, -13.8);
  c.closePath(); c.fill();

  /* ---- pattes de devant, par-dessus le corps ---- */
  chatPatte(c, -3.4, -9.6, -1.3,  ec, 1.55, 1.05, P.flanc, P.blanc, 1.85, 0.6);
  chatPatte(c,  8.4, -10.0, -1.3, -ec, 1.55, 1.05, P.flanc, P.blanc, 1.85, 0.6);

  /* ---- la tête, portée bas et en avant. Grosse : sur un matou de
     bagarre c'est la seule chose qui le garde mignon. ---- */
  c.save();
  c.translate(12.0, -17.4);
  c.rotate(fuit ? 0.12 : Math.sin(tps * 0.58 + ph * 2.1) * 0.06);

  var recul = fuit ? 0.8 : 0;
  /* l'oreille du fond, entière */
  chatOreille(c, -3.2, -3.6, 4.7, 4.5, -0.44 - recul + tic * 0.34, P.flanc, P.rose, false);
  /* et la droite, fendue ET plantée de travers : sa signature. Le cran
     seul disparaît au dézoom, l'angle non. */
  chatOreille(c,  3.4, -3.4, 4.9, 4.6,  0.50 + recul * 0.8 - tic * 0.42, P.dos, P.rose, true);

  /* crâne large et joufflu : c'est un mâle, mais un mâle tout rond */
  c.fillStyle = P.dos;
  c.beginPath();
  c.moveTo(-5.9, -1.2);
  c.quadraticCurveTo(-6.1, 2.4, -2.6, 4.0);
  c.quadraticCurveTo(0, 5.0, 2.8, 4.0);
  c.quadraticCurveTo(6.3, 2.4, 6.1, -1.2);
  c.quadraticCurveTo(5.7, -5.4, 0, -5.4);
  c.quadraticCurveTo(-5.5, -5.4, -5.9, -1.2);
  c.closePath(); c.fill();
  /* bajoues : deux bosses de fourrure arrondies. La version en pointes
     donnait des éclats de verre au lieu de poils. */
  c.fillStyle = P.flanc;
  c.beginPath(); c.ellipse(-5.2, 1.4, 2.1, 2.4, -0.3, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(5.4, 1.4, 2.1, 2.4, 0.3, 0, 6.2832); c.fill();
  /* le M du tigré sur le front : deux chevrons FINS, tout en haut.
     Épais et centrés, ils faisaient un sourcil de super-héros. */
  c.strokeStyle = "rgba(40,44,64,.34)"; c.lineWidth = 0.55; c.lineCap = "round";
  c.beginPath();
  c.moveTo(-2.0, -3.3); c.lineTo(-1.2, -4.6); c.lineTo(-0.3, -3.5);
  c.lineTo(0.6, -4.6); c.lineTo(1.4, -3.4);
  c.stroke();

  /* museau et menton blancs, resserrés : la grosse tache blanche
     mangeait le bas du visage et écrasait les yeux. */
  c.fillStyle = P.blanc;
  c.beginPath(); c.ellipse(lacet * 1.5, 2.5, 2.7, 2.1, 0, 0, 6.2832); c.fill();

  /* les yeux, gros et bien écartés. Le lointain est plus petit : c'est
     ce qui fait tourner la tête sans avoir à la redessiner. */
  var lo = 0.82 + lacet * 0.36;
  chatOeil(c, -2.9 + lacet * 2.3, -0.9, 2.1 * lo, P.iris, P.irisO, ouv, lacet);
  chatOeil(c,  3.0 + lacet * 1.9, -0.9, 2.3, P.iris, P.irisO, ouv, lacet);

  chatMuseau(c, lacet * 1.5, 2.6, 1.35, P.blanc, P.nez);
  chatMoustaches(c, lacet * 1.5 - 1.4, 2.8, 7.0, 2.1, -1, 0.5);
  chatMoustaches(c, lacet * 1.5 + 1.4, 2.8, 7.4, 2.2, 1, 0.55);
  c.restore();
  c.restore();
}

/* ================================================================
   CROQUETTE, LE CHATON
   Tout petit : la tête fait les trois quarts de la longueur du corps,
   les yeux le tiers de la tête, les pattes sont trop courtes et la
   queue est plantée droite comme une antenne. Il titube — à cet âge on
   ne marche pas, on se rattrape.
   ================================================================ */
function chatCorpsK(c, d){
  c.beginPath();
  c.moveTo(-4.6, -5.4);
  c.quadraticCurveTo(-5.6, -8.8 - d, -1.6, -9.4 - d);
  c.quadraticCurveTo(2.6, -9.9, 4.8, -8.2);
  c.quadraticCurveTo(6.6, -6.6, 5.6, -4.6);
  c.quadraticCurveTo(2.6, -3.4, -1.4, -3.7);
  c.quadraticCurveTo(-4.0, -4.0, -4.6, -5.4);
  c.closePath();
}
function chatDosK(c, d){
  c.beginPath();
  c.moveTo(-4.8, -5.2);
  c.quadraticCurveTo(-5.6, -8.8 - d, -1.6, -9.4 - d);
  c.quadraticCurveTo(2.6, -9.9, 4.8, -8.2);
  c.quadraticCurveTo(5.9, -7.2, 5.7, -5.6);
}
function chatVentreK(c){
  c.beginPath();
  c.moveTo(5.2, -4.6);
  c.quadraticCurveTo(2.4, -3.1, -1.4, -3.4);
  c.quadraticCurveTo(-3.6, -3.6, -4.4, -5.0);
}
function dessineChaton(c, k, tps){
  var P = PAL_CHATON;
  var ph = k.ph || 0;
  var fuit = k.etat === "fuite";
  var bond = Math.abs(Math.sin(k.phase));
  var saut = fuit ? bond * 2.2 : bond * 0.9;
  var d = fuit ? -0.8 : Math.sin(k.phase) * 0.3;
  /* le dandinement : un chaton n'a pas encore l'équilibre, et c'est
     précisément ce déséquilibre qui le rend attendrissant */
  var titube = fuit ? Math.sin(tps * 9) * 0.028 : Math.sin(tps * 1.85 + ph) * 0.072;
  var ouv = fuit ? 1 : chatClin(tps, ph + 2.4);
  var tic = chatTic(tps, ph + 1.1, 3.2);
  var lacet = fuit ? -0.16 : Math.sin(tps * 0.86 + ph) * 0.34;
  var ec = Math.sin(k.phase) * (fuit ? 2.6 : 1.9);

  c.fillStyle = "rgba(0,0,0,.24)";
  c.beginPath(); c.ellipse(0.6, 0, 6.0 - bond * 1.1, 2.3 - bond * 0.5, 0, 0, 6.2832); c.fill();

  c.save();
  c.translate(0, -saut);
  c.rotate(titube);

  /* ---- la queue en antenne : la ligne la plus haute de la bête et
     son meilleur signal sur la carte. Un chaton content la porte à la
     verticale, et elle frissonne toute seule. ---- */
  var fris = Math.sin(tps * 3.4 + ph) * 1.5;
  var q = fuit
    ? [[-3.2, -5.0, -7.8, -6.2, -10.8, -4.8],
       [-10.8, -4.8, -12.8, -4.0, -13.6, -2.2]]
    : [[-3.2, -5.4, -4.6, -9.4, -4.2 + fris * 0.4, -13.2],
       [-4.2 + fris * 0.4, -13.2, -3.9 + fris * 0.8, -16.4, -1.6 + fris * 1.2, -16.9]];
  chatBoudin(c, q, { n:17, e0:1.45, e1:0.8, coul:P.flanc,
                     anneaux:2, raie:P.raie, bout:P.blanc, tBout:0.86 });

  /* ---- pattes du fond ---- */
  chatPatte(c, -3.0, -4.8, -1.0, -ec, 1.15, 0.85, P.ventreO, P.blancO, 1.4, 0.6);
  chatPatte(c,  3.6, -5.4, -1.0,  ec, 1.15, 0.85, P.ventreO, P.blancO, 1.4, 0.6);

  /* ---- le corps : une petite boule ---- */
  c.fillStyle = degCache(c, "chatonCorps", function(){
    var g = c.createLinearGradient(0, -10.5, 0, -3.2);
    g.addColorStop(0, PAL_CHATON.dos);
    g.addColorStop(0.52, PAL_CHATON.flanc);
    g.addColorStop(1, PAL_CHATON.ventreO);
    return g;
  });
  chatCorpsK(c, d); c.fill();
  /* trois rayures seulement : à sa taille, quatre feraient une bouillie */
  c.save();
  chatCorpsK(c, d); c.clip();
  c.strokeStyle = "rgba(150,66,14,.48)"; c.lineWidth = 1.6; c.lineCap = "round";
  for(var i = 0; i < 3; i++){
    var rx = -2.6 + i * 2.9;
    c.beginPath(); c.moveTo(rx, -10.4 - d); c.quadraticCurveTo(rx + 1.0, -7.0, rx + 0.3, -3.8); c.stroke();
  }
  c.restore();
  chatVolume(c, function(cc){ chatCorpsK(cc, d); },
                function(cc){ chatDosK(cc, d); },
                chatVentreK,
                "rgba(255,246,224,.34)", "rgba(120,54,10,.26)");

  /* bavoir crème */
  c.fillStyle = P.blanc;
  c.beginPath();
  c.moveTo(5.8, -8.0);
  c.quadraticCurveTo(6.8, -6.0, 5.4, -4.4);
  c.quadraticCurveTo(3.4, -3.8, 3.0, -5.2);
  c.quadraticCurveTo(4.2, -6.6, 4.6, -8.2);
  c.closePath(); c.fill();

  /* ---- pattes de devant ---- */
  chatPatte(c, -1.4, -5.0, -1.1,  ec, 1.2, 0.9, P.flanc, P.blanc, 1.5, 0.58);
  chatPatte(c,  4.6, -5.6, -1.1, -ec, 1.2, 0.9, P.flanc, P.blanc, 1.5, 0.58);

  /* ---- LA TÊTE. Énorme, et c'est tout le sujet : la mignonnerie d'un
     bébé, c'est un rapport tête/corps qui ne tient pas debout. ---- */
  c.save();
  c.translate(5.0, -11.2);
  /* elle dodeline, elle est trop lourde pour ce cou-là */
  c.rotate((fuit ? 0.12 : Math.sin(tps * 1.85 + ph) * 0.10) + titube * 0.6);

  var recul = fuit ? 0.72 : 0;
  chatOreille(c, -2.3, -2.3, 3.3, 3.7, -0.62 - recul + tic * 0.34, P.flanc, P.rose, false);
  chatOreille(c,  2.5, -2.2, 3.4, 3.9,  0.56 + recul * 0.9 - tic * 0.4, P.dos, P.rose, false);

  /* crâne parfaitement rond : le contraire du crâne carré du matou */
  c.fillStyle = P.dos;
  c.beginPath(); c.ellipse(0, 0, 4.3, 4.1, 0, 0, 6.2832); c.fill();
  c.fillStyle = P.flanc;
  c.beginPath(); c.ellipse(-3.1, 1.5, 1.7, 1.8, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(3.2, 1.5, 1.7, 1.8, 0, 0, 6.2832); c.fill();
  c.fillStyle = P.blanc;
  c.beginPath(); c.ellipse(lacet * 1.2, 2.0, 2.6, 2.0, 0, 0, 6.2832); c.fill();

  /* les yeux : démesurés, presque la moitié de la largeur du crâne */
  var lo = 0.82 + lacet * 0.35;
  chatOeil(c, -1.9 + lacet * 1.9, -0.5, 1.8 * lo, P.iris, P.irisO, ouv, lacet);
  chatOeil(c,  2.1 + lacet * 1.6, -0.5, 1.95, P.iris, P.irisO, ouv, lacet);

  chatMuseau(c, lacet * 1.2, 2.1, 1.1, P.blanc, P.nez);
  chatMoustaches(c, lacet * 1.2 - 1.0, 2.3, 5.0, 1.7, -1, 0.5);
  chatMoustaches(c, lacet * 1.2 + 1.0, 2.3, 5.2, 1.8, 1, 0.55);
  c.restore();
  c.restore();
}

/* ================================================================
   PRALINE, LA CHATTE
   Adulte élégante : longue, haute sur pattes, le ventre remonté, la
   tête petite et triangulaire portée haut sur un cou fin. Crème rosé,
   extrémités chocolat — sans ces pointes sombres elle disparaîtrait
   dans le sable clair.
   Signature : la queue enroulée en point d'interrogation par-dessus le
   dos, et une antérieure levée quand elle s'arrête.
   ================================================================ */
function chatCorpsF(c, d, s){
  c.beginPath();
  c.moveTo(-8.2, -12.0);
  c.quadraticCurveTo(-9.4, -15.8 - d, -3.2, -16.2 - d - s);
  c.quadraticCurveTo(2.4, -16.5 - d - s, 6.6, -15.0);
  c.quadraticCurveTo(10.2, -13.8, 10.0, -11.0);
  c.quadraticCurveTo(9.8, -8.6, 7.0, -8.5);
  c.quadraticCurveTo(1.4, -8.2 + s, -2.2, -9.4);           /* ventre remonté */
  c.quadraticCurveTo(-6.2, -10.3, -8.2, -12.0);
  c.closePath();
}
function chatDosF(c, d, s){
  c.beginPath();
  c.moveTo(-8.4, -11.8);
  c.quadraticCurveTo(-9.4, -15.8 - d, -3.2, -16.2 - d - s);
  c.quadraticCurveTo(2.4, -16.5 - d - s, 6.6, -15.0);
  c.quadraticCurveTo(9.4, -14.0, 10.0, -12.0);
}
function chatVentreF(c, s){
  c.beginPath();
  c.moveTo(9.2, -8.7);
  c.quadraticCurveTo(1.4, -7.8 + s, -2.2, -9.0);
  c.quadraticCurveTo(-5.6, -9.8, -7.8, -11.4);
}
function dessineChatte(c, k, tps){
  var P = PAL_CHATTE;
  var ph = k.ph || 0;
  var fuit = k.etat === "fuite";
  var bond = Math.abs(Math.sin(k.phase));
  var saut = fuit ? bond * 3.2 : bond * 0.5;
  var d = fuit ? -1.2 : Math.sin(k.phase) * 0.35;
  /* respiration : le flanc se soulève. Rien ne dit « vivant » comme ça. */
  var s = fuit ? 0 : Math.sin(tps * 1.2 + ph) * 0.3;
  var ouv = fuit ? 1 : chatClin(tps, ph + 4.9);
  var tic = chatTic(tps, ph + 2.6, 4.6);
  var lacet = fuit ? -0.2 : Math.sin(tps * 0.48 + ph * 1.6) * 0.32;
  var ec = Math.sin(k.phase) * (fuit ? 4.2 : 2.6);

  c.fillStyle = "rgba(0,0,0,.24)";
  c.beginPath(); c.ellipse(0.4, 0, 8.6 - bond * 1.3, 3.0 - bond * 0.6, 0, 0, 6.2832); c.fill();

  c.save();
  c.translate(0, -saut);

  /* ---- la queue en point d'interrogation : elle monte, elle passe
     par-dessus le dos, et la pointe revient vers l'avant. C'est le
     contour le plus reconnaissable des trois et il tient même en ombre
     chinoise — à condition de rester COLLÉ au dos. Première version
     enroulée très haut : au zoom de jeu la boucle sombre se lisait
     comme une bestiole séparée posée derrière elle. ---- */
  var onde = fuit ? 0 : Math.sin(tps * 1.15 + ph) * 2.6;
  var q = fuit
    ? [[-5.6, -11.0, -12.0, -11.4, -15.8, -9.4],
       [-15.8, -9.4, -19.0, -7.6, -20.2, -5.0]]
    : [[-5.6, -11.4, -11.2 + onde * 0.2, -12.4, -12.0 + onde * 0.4, -16.4],
       [-12.0 + onde * 0.4, -16.4, -12.8 + onde * 0.7, -20.2, -7.8 + onde * 1.1, -20.6],
       [-7.8 + onde * 1.1, -20.6, -4.4 + onde * 1.4, -20.9, -5.2 + onde * 1.6, -18.2]];
  chatBoudin(c, q, { n:22, e0:1.85, e1:1.15, echelle:P.queue });

  /* ---- pattes du fond : fines, hautes, chaussées de chocolat ---- */
  chatPatte(c, -5.2, -10.6, -1.2, -ec, 1.3, 1.0, P.patte, P.botte, 1.4, 0.68);
  chatPatte(c,  5.8, -11.2, -1.2,  ec, 1.3, 1.0, P.patte, P.botte, 1.4, 0.68);

  /* ---- le corps ---- */
  c.fillStyle = degCache(c, "chatteCorps", function(){
    var g = c.createLinearGradient(0, -18, 0, -7);
    g.addColorStop(0, PAL_CHATTE.dos);
    g.addColorStop(0.55, PAL_CHATTE.flanc);
    g.addColorStop(1, PAL_CHATTE.ventreO);
    return g;
  });
  chatCorpsF(c, d, s); c.fill();
  /* un voile chocolat sur la croupe : la marque des chats à pointes.
     Elle n'est pas tigrée — ce serait la confondre avec Gribouille. */
  c.save();
  chatCorpsF(c, d, s); c.clip();
  /* La croupe et l'épaule s'assombrissent, le flanc reste clair : sans
     ces deux voiles, le corps n'était qu'une chaussette beige lisse. */
  c.fillStyle = "rgba(109,71,54,.28)";
  c.beginPath(); c.ellipse(-8.6, -11.6, 5.0, 4.6, 0, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(109,71,54,.14)";
  c.beginPath(); c.ellipse(9.6, -12.4, 3.4, 4.0, 0, 0, 6.2832); c.fill();
  /* et le pli de la cuisse, qui détache la patte arrière du flanc */
  c.strokeStyle = "rgba(140,100,80,.30)"; c.lineWidth = 1.2; c.lineCap = "round";
  c.beginPath();
  c.moveTo(-4.6, -15.6); c.quadraticCurveTo(-3.0, -12.4, -4.4, -9.4);
  c.stroke();
  c.restore();
  chatVolume(c, function(cc){ chatCorpsF(cc, d, s); },
                function(cc){ chatDosF(cc, d, s); },
                function(cc){ chatVentreF(cc, s); },
                "rgba(255,252,246,.5)", "rgba(146,106,84,.34)");

  /* ---- pattes de devant, dont une levée quand elle s'arrête : on ne
     la lève jamais en marchant, ça boiterait. ---- */
  var leve = fuit ? 0 : Math.max(0, Math.sin(tps * 0.5 + ph * 1.3) - 0.4) * 3.4;
  chatPatte(c, -2.8, -10.8, -1.3,  ec, 1.35, 1.05, P.flanc, P.botte, 1.45, 0.66);
  chatPatte(c,  7.6, -11.4, -1.3 + leve, -ec * (1 - leve * 0.2), 1.35, 1.05, P.flanc, P.botte, 1.45, 0.66);

  /* ---- le cou, long : la moitié de son élégance ---- */
  chatBoudin(c, [[7.4, -14.4, 9.2, -15.8, 10.4, -17.2]], { n:6, e0:2.3, e1:1.95, coul:P.dos });

  /* ---- la tête : un triangle inversé, menton fin ---- */
  c.save();
  c.translate(11.2, -18.2);
  c.rotate(fuit ? 0.14 : Math.sin(tps * 0.48 + ph * 1.6) * 0.055);

  var recul = fuit ? 0.72 : 0;
  /* oreilles chocolat. Elles étaient plus longues et plus écartées :
     ça lui faisait une tête de chauve-souris au lieu d'une tête de
     chatte. Raccourcies, elles laissent le crâne dominer. */
  chatOreille(c, -2.3, -2.9, 3.7, 3.7, -0.5 - recul + tic * 0.26, P.raie, P.rose, false);
  chatOreille(c,  2.6, -2.8, 3.8, 3.8,  0.44 + recul * 0.9 - tic * 0.32, P.raie, P.rose, false);

  c.fillStyle = P.dos;
  c.beginPath();
  c.moveTo(-4.6, -1.6);
  c.quadraticCurveTo(-4.3, 1.8, -1.7, 3.6);
  c.quadraticCurveTo(0, 4.4, 1.7, 3.6);
  c.quadraticCurveTo(4.3, 1.8, 4.6, -1.6);
  c.quadraticCurveTo(3.2, -4.7, 0, -4.7);
  c.quadraticCurveTo(-3.2, -4.7, -4.6, -1.6);
  c.closePath(); c.fill();
  /* le masque : un voile chocolat sur le museau, marque des chats à
     pointes. Sans lui, elle disparaît sur le sable clair. */
  c.fillStyle = "rgba(109,71,54,.3)";
  c.beginPath(); c.ellipse(lacet * 1.3, 1.8, 2.9, 2.3, 0, 0, 6.2832); c.fill();
  c.fillStyle = P.blanc;
  c.beginPath(); c.ellipse(lacet * 1.3, 2.2, 2.2, 1.7, 0, 0, 6.2832); c.fill();

  /* yeux bleus, un peu plus étirés que ceux des deux autres : c'est ce
     qui la rend posée là où Croquette est ahuri */
  var lo = 0.8 + lacet * 0.38;
  chatOeil(c, -2.1 + lacet * 2.0, -0.9, 1.75 * lo, P.iris, P.irisO, ouv * 0.93, lacet);
  chatOeil(c,  2.3 + lacet * 1.7, -0.9, 1.9, P.iris, P.irisO, ouv * 0.93, lacet);

  chatMuseau(c, lacet * 1.3, 2.2, 1.15, P.blanc, P.nez);
  chatMoustaches(c, lacet * 1.3 - 1.1, 2.4, 7.4, 2.1, -1, 0.55);
  chatMoustaches(c, lacet * 1.3 + 1.1, 2.4, 7.8, 2.2, 1, 0.6);
  c.restore();
  c.restore();
}
