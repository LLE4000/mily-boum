/* ================================================================
   LE BRASIER — la forteresse principale de l'île.
   Elle est bâtie en deux sprites : « arrière » (terrasses, tours,
   couronne) et « avant » (bloc d'entrée, tours de façade). La
   gardienne est dessinée en direct entre les deux : l'architecture
   remonte donc derrière sa tête et repasse devant sa chevelure, au
   lieu d'avoir un visage posé sur un mur.
   ================================================================ */

/* LA TOILE DES DEUX SPRITES.
   Elle faisait 700 × 700 avec l'origine à 600, donc du local −600 au
   local +100 — et la pointe de la pique de couronne du Brasier, à
   −616, était rognée depuis toujours sans que personne le voie. Le
   palais, dont l'accolade monte plus haut encore, l'aurait été
   franchement. On donne donc cent soixante pixels de ciel en plus :
   la citadelle retrouve sa pointe, le palais a de quoi porter son
   croissant ET son halo, et rien d'autre ne bouge — le dessin est en
   coordonnées locales, seule la fenêtre change.
   La marge se vérifie au crayon avant de dessiner : le croissant du
   palais culmine à −709, son halo à −758. À huit cent vingt de haut,
   le halo était rogné net et laissait un bord droit en plein ciel. */
var QG_W = 700, QG_H = 880, QG_OX = 350, QG_OY = 760;
var spriteQGArriere = null, spriteQGAvant = null;
var ECH_GARD = 3.1;              // la gardienne est monumentale
var Y_TETE = -300;               // hauteur du centre du visage, en local

/* ================================================================
   DEUX ROYAUMES, UN SEUL MOTEUR

   « Le QG de Mily en royaume enchanté. »

   La tentation était de dessiner un second QG. On ne l'a pas fait,
   et pour la même raison qui a donné une seule mise à jour de tornade
   pour trois îles : sept cents lignes dupliquées, ce sont deux
   forteresses qui divergent au premier réglage — l'une corrigée,
   l'autre oubliée, et personne pour s'en apercevoir.

   ────────────────────────────────────────────────────────────────
   CE QU'ON NE TOUCHE PAS : LA SILHOUETTE

   Quatre terrasses, dix-huit tours, la niche, l'arc, le portail, la
   gardienne au milieu. C'est la même forteresse, à la même échelle,
   avec les mêmes points de vie et le même télégraphe avant la salve.
   Un joueur qui débarque sur les nuits doit reconnaître le Brasier
   au premier coup d'œil, sinon il ne sait plus ce qu'il attaque.

   ────────────────────────────────────────────────────────────────
   CE QUI CHANGE : LA MATIÈRE ET LE FEU

   Et c'est tout, mais ça suffit — c'est même là que se joue tout
   l'écart entre une citadelle de lave et un palais de conte :

     LA PIERRE devient du marbre. La même pierre passée au bleu
     lavande : `ecl()` la monte au blanc dans la lumière et la
     descend à l'outremer dans l'ombre, exactement comme elle montait
     au gris et descendait au brun.

     LE MÉTAL devient de l'or, la LAVE devient de la lumière
     d'étoile, la bannière rouge devient une soie violette.

     LES ARCS deviennent des ARCS EN ACCOLADE — la courbe qui repart
     en pointe. Un seul trait de plus par fenêtre, et l'architecture
     change de continent.

     LES CRÉNEAUX DES TOURS deviennent des BULBES. C'est le geste le
     plus visible des cinq : dix-huit dômes à l'oignon posés là où il
     y avait dix-huit couronnes de créneaux hérissées de piques.

     LES PIQUES deviennent des FLÈCHES à bulbe et croissant.

     LE FEU DEVIENT FROID. Les foyers ne bougent pas d'un pixel — ce
     sont les mêmes cinquante-cinq — mais ils brûlent bleu, et les
     braises qui en montent scintillent au lieu de refroidir.

   Le style vit dans une table, comme le profil des tornades ; le
   dessin ne fait que la lire.
   ================================================================ */
var STYLES_QG = {
  /* LE BRASIER — la citadelle de lave, inchangée au pixel près. */
  brasier: {
    CQ:{
      pierre:"#463a40", pierreC:"#6d5a60", pierreT:"#7d6a70", pierreO:"#241b21",
      metal:"#4e3a34", metalC:"#8a6a54", metalO:"#241a16",
      lave:"#ff7a1e", laveC:"#ffd48a", laveO:"#c02a08",
      banniere:"#8e1e22", banniereO:"#5d1216", or:"#e8c25a"
    },
    /* les couleurs du verre des fenêtres, du plus chaud au plus sombre */
    vitre:["rgba(255,214,150,.95)", "rgba(255,120,30,.9)", "rgba(150,26,6,.85)"],
    vitreHalo:"rgba(255,140,40,.30)", vitreHalo0:"rgba(255,90,20,0)",
    ogive:0, dome:0, croissant:0, froid:0, mosaique:0,
    halo:["#ff6a14", "#ff3c08"],
    portail:["rgba(255,232,176,.95)", "rgba(255,120,30,.95)", "rgba(120,16,4,.98)"],
    fournaise:["255,225,160", "255,110,25", "255,60,10"],
    fissure:["255,190,70", "255,60,10"],
    voile:["rgba(20,10,24,.34)", "rgba(20,10,24,0)", "rgba(12,6,14,.30)"]
  },
  /* LE PALAIS DES MILY ET UNE NUITS — marbre, or et lumière d'étoile. */
  palais: {
    CQ:{
      pierre:"#8e9ad9", pierreC:"#bcc6f0", pierreT:"#d2d9fa", pierreO:"#20214f",
      metal:"#a8802f", metalC:"#f0dca2", metalO:"#43300e",
      lave:"#63c8ff", laveC:"#e6f7ff", laveO:"#1b4f9c",
      banniere:"#4c2f9e", banniereO:"#271459", or:"#f2d074"
    },
    vitre:["rgba(232,250,255,.95)", "rgba(96,200,255,.9)", "rgba(24,64,150,.85)"],
    vitreHalo:"rgba(110,205,255,.30)", vitreHalo0:"rgba(60,150,255,0)",
    ogive:1, dome:1, croissant:1, froid:1, mosaique:1,
    /* LES COUPOLES SONT D'OR, et non du bleu des murs. C'est ce qui
       rend le palais REPÉRABLE : le Brasier tenait son statut de son
       halo orange, et une forteresse bleue posée sur une île bleue
       n'est plus un point de repère, c'est un quartier. L'or dit
       aussi de quel royaume il s'agit. */
    coupole:"#d8a63a",
    halo:["#4f9fe8", "#7d5ce0"],
    portail:["rgba(238,252,255,.95)", "rgba(110,206,255,.95)", "rgba(22,52,132,.98)"],
    fournaise:["226,246,255", "96,190,255", "40,90,220"],
    fissure:["190,235,255", "80,150,255"],
    voile:["rgba(24,20,58,.22)", "rgba(24,20,58,0)", "rgba(14,12,40,.20)"]
  }
};
/* Le style en vigueur, et sa palette. `CQ` reste le nom que tout le
   fichier lit : on ne change pas six cents références pour un
   aiguillage. */
var SQ = STYLES_QG.brasier;
var CQ = SQ.CQ;
/* Quelle forteresse porte quelle île. Même raisonnement que
   carteOrageuse() : c'est une propriété de l'ÎLE, jamais d'un tirage
   ni d'un tableau qui pourrait revenir vide. */
function styleQGdeCarte(i){
  return (CARTES[i] && CARTES[i].biome === "nuits") ? "palais" : "brasier";
}
/* On ne garde EN MÉMOIRE QU'UNE forteresse à la fois. Deux jeux de
   sprites feraient huit méga-octets de canevas pour un objet qu'on ne
   voit jamais qu'un à la fois, et cette carte est déjà la plus lourde
   du jeu. Rebâtir coûte quelques dizaines de millisecondes, une seule
   fois par changement d'île. */
var styleQGBati = null;
function assureSpriteQG(){
  var s = styleQGdeCarte(typeof jeu !== "undefined" && jeu ? jeu.index : -1);
  if(s === styleQGBati) return;
  SQ = STYLES_QG[s] || STYLES_QG.brasier;
  CQ = SQ.CQ;
  FOYERS = null;
  construitSpriteQG();
  styleQGBati = s;
}

/* ---------------------------------------------------------------
   Briques de construction
   --------------------------------------------------------------- */
/* LE CROISSANT, l'emblème du palais. Un disque moins un disque
   décalé — le même procédé que la lune du ciel des nuits, et pour la
   même raison : dessiner un croissant « à la main » avec deux arcs
   donne toujours des cornes molles, une soustraction donne le
   tranchant. */
function croissantOr(c, x, y, r, coul){
  c.save();
  c.beginPath();
  c.arc(x, y, r, 0, 6.2832);
  c.arc(x + r * 0.42, y - r * 0.10, r * 0.82, 0, 6.2832, true);
  c.fillStyle = coul || CQ.metalC;
  c.fill("evenodd");
  c.restore();
}
/* L'ÉTOILE À HUIT BRANCHES, le khatim des mosaïques : deux carrés
   superposés à quarante-cinq degrés. */
function etoileOr(c, x, y, r, coul){
  c.save();
  c.translate(x, y);
  c.fillStyle = coul || CQ.metalC;
  for(var q = 0; q < 2; q++){
    c.save(); c.rotate(q * 0.7854);
    c.fillRect(-r * 0.62, -r * 0.62, r * 1.24, r * 1.24);
    c.restore();
  }
  c.restore();
}
function fenetreArc(c, x, y, w, h){
  var V = SQ.vitre;
  var g = c.createLinearGradient(x, y - h, x, y);
  g.addColorStop(0, V[0]);
  g.addColorStop(0.55, V[1]);
  g.addColorStop(1, V[2]);
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x - w, y);
  if(SQ.ogive){
    /* L'ARC EN ACCOLADE. Les flancs s'évasent puis se retournent
       vers une pointe : c'est cette INFLEXION, et elle seule, qui
       sépare une fenêtre de palais d'une fenêtre de donjon. Un arc
       simplement brisé ne suffit pas — il fait gothique. */
    c.lineTo(x - w, y - h * 0.50);
    c.bezierCurveTo(x - w, y - h * 0.98, x - w * 0.34, y - h * 0.98, x, y - h * 1.42);
    c.bezierCurveTo(x + w * 0.34, y - h * 0.98, x + w, y - h * 0.98, x + w, y - h * 0.50);
  }else{
    c.lineTo(x - w, y - h * 0.55);
    c.quadraticCurveTo(x, y - h * 1.25, x + w, y - h * 0.55);
  }
  c.lineTo(x + w, y);
  c.closePath(); c.fill();
  c.strokeStyle = CQ.pierreO; c.lineWidth = 1.6; c.stroke();
  c.save();
  c.globalCompositeOperation = "lighter";
  var gh = c.createRadialGradient(x, y - h * 0.5, 1, x, y - h * 0.5, h * 2.4);
  gh.addColorStop(0, SQ.vitreHalo);
  gh.addColorStop(1, SQ.vitreHalo0);
  c.fillStyle = gh;
  c.beginPath(); c.arc(x, y - h * 0.5, h * 2.4, 0, 6.2832); c.fill();
  c.restore();
}
/* LE BULBE — le dôme à l'oignon, en vue de face.

   Il est dessiné à l'écran et non en isométrie, et c'est voulu : un
   dôme vu d'en haut n'est qu'une ellipse, et l'on perdrait justement
   ce qui le fait reconnaître, le renflement puis le col. Comme toutes
   les tours du jeu, il triche sur la perspective pour rester lisible.
   `r` est le demi-diamètre à la base, `h` la hauteur totale. */
/* LE PROFIL, EN TROIS TEMPS, ET C'EST TOUT LE SUJET.

   Premier essai : une seule courbe de la base à la pointe. Résultat —
   dix-huit GOUTTES D'EAU accrochées aux tours. La faute n'était pas
   la couleur, c'était la continuité : une ogive qui se referme d'un
   trait n'est pas un oignon, c'est une larme.

   Un vrai bulbe a une INFLEXION. Il s'évase au-dessus de sa base
   (l'épaule), se resserre franchement (le col), et ne repart en
   pointe qu'après. C'est ce moment où le profil rentre qui fait
   reconnaître la coupole, et il faut donc trois arcs et non un. */
function bulbe(c, x, ySol, r, h, base){
  var rE = r * 1.22, yE = ySol - h * 0.26;   // l'épaule, la plus large
  var rC = r * 0.42, yC = ySol - h * 0.70;   // le col, le plus étroit
  var g = c.createLinearGradient(x - r * 1.2, 0, x + r * 1.2, 0);
  g.addColorStop(0.00, ecl(base, 1.42));
  g.addColorStop(0.36, ecl(base, 1.12));
  g.addColorStop(1.00, ecl(base, 0.54));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x - r, ySol);
  c.quadraticCurveTo(x - rE * 1.06, ySol - h * 0.06, x - rE, yE);
  c.quadraticCurveTo(x - rE * 0.80, yC + h * 0.12, x - rC, yC);
  c.quadraticCurveTo(x - rC * 0.70, ySol - h * 0.90, x, ySol - h);
  c.quadraticCurveTo(x + rC * 0.70, ySol - h * 0.90, x + rC, yC);
  c.quadraticCurveTo(x + rE * 0.80, yC + h * 0.12, x + rE, yE);
  c.quadraticCurveTo(x + rE * 1.06, ySol - h * 0.06, x + r, ySol);
  c.closePath(); c.fill();
  /* les côtes : deux méridiens, et le dôme cesse d'être une tache */
  if(r >= 5){
    c.strokeStyle = "rgba(255,248,214,.22)";
    c.lineWidth = Math.max(0.6, r * 0.06);
    for(var i = -1; i <= 1; i += 2){
      c.beginPath();
      c.moveTo(x + r * i * 0.58, ySol);
      c.quadraticCurveTo(x + rE * i * 0.72, yE, x + rC * i * 0.55, yC);
      c.quadraticCurveTo(x + rC * i * 0.30, ySol - h * 0.90, x, ySol - h);
      c.stroke();
    }
  }
  /* le liseré du col : c'est lui qui pose la pointe sur le bulbe au
     lieu de la laisser en sortir */
  c.fillStyle = ecl(base, 1.30);
  c.beginPath();
  c.ellipse(x, yC, rC * 1.35, Math.max(0.9, h * 0.026), 0, 0, 6.2832);
  c.fill();
  /* et un reflet SOBRE sur l'épaule gauche : plus fort, il vitrifiait
     la coupole et l'on retombait sur la goutte d'eau */
  c.save();
  c.globalCompositeOperation = "lighter";
  c.fillStyle = "rgba(255,246,220,.10)";
  c.beginPath();
  c.ellipse(x - r * 0.46, yE - h * 0.10, r * 0.26, h * 0.17, -0.3, 0, 6.2832);
  c.fill();
  c.restore();
}
function pique(c, x, y, h, larg, sansCroissant){
  if(SQ.dome){
    /* LA FLÈCHE DU PALAIS : un petit bulbe, un fût, une boule — et un
       croissant quand la flèche est assez grande pour qu'il se voie.
       En dessous de vingt-quatre pixels il ferait une bavure, et une
       bavure dorée reste une bavure. */
    var go = c.createLinearGradient(x - larg, y, x + larg, y);
    go.addColorStop(0, ecl(CQ.metalC, 1.10));
    go.addColorStop(0.42, CQ.metal);
    go.addColorStop(1, ecl(CQ.metal, 0.50));
    c.fillStyle = go;
    c.beginPath();
    c.moveTo(x - larg, y);
    c.bezierCurveTo(x - larg * 2.0, y - h * 0.14, x - larg * 1.5, y - h * 0.40, x, y - h * 0.50);
    c.bezierCurveTo(x + larg * 1.5, y - h * 0.40, x + larg * 2.0, y - h * 0.14, x + larg, y);
    c.closePath(); c.fill();
    c.fillRect(x - larg * 0.26, y - h * 0.92, larg * 0.52, h * 0.44);
    c.beginPath(); c.arc(x, y - h * 0.93, larg * 0.52, 0, 6.2832); c.fill();
    if(SQ.croissant && h > 24 && !sansCroissant)
      croissantOr(c, x, y - h * 1.10, larg * 0.86);
    return;
  }
  var g = c.createLinearGradient(x - larg, y, x + larg, y);
  g.addColorStop(0, ecl(CQ.metal, 1.55));
  g.addColorStop(0.45, CQ.metal);
  g.addColorStop(1, ecl(CQ.metal, 0.55));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x - larg, y); c.lineTo(x, y - h); c.lineTo(x + larg, y);
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(255,190,120,.28)"; c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(x - larg * 0.5, y - h * 0.4); c.lineTo(x, y - h); c.stroke();
}
function appareillage(c, x0, x1, y, n, ec){
  c.save();
  c.strokeStyle = "rgba(16,10,14,.34)"; c.lineWidth = 1.2;
  for(var i = 0; i < n; i++){
    var yy = y - i * ec;
    c.beginPath(); c.moveTo(x0, yy); c.lineTo(x1, yy + (x1 - x0) * 0.02); c.stroke();
    for(var k = 0; k < 7; k++){
      var xx = x0 + (x1 - x0) * ((k + (i % 2) * 0.5) / 7);
      c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx, yy - ec); c.stroke();
    }
  }
  c.restore();
}
function tourBrasier(c, gx, gy, r, h, avecPique){
  var p = iso(gx, gy);
  cylindre(c, gx, gy, r, 0, h, ecl(CQ.pierre, 1.30), ecl(CQ.pierre, 0.62));
  c.save();
  c.beginPath(); c.rect(p.x - r * RX, p.y - h, r * RX * 2, h); c.clip();
  appareillage(c, p.x - r * RX, p.x + r * RX, p.y - 6, Math.floor(h / 9), 9);
  c.restore();
  fenetreArc(c, p.x, p.y - h * 0.40, r * RX * 0.28, h * 0.19);
  if(h > 90) fenetreArc(c, p.x, p.y - h * 0.70, r * RX * 0.24, h * 0.15);
  cylindre(c, gx, gy, r * 1.13, h - 16, 7, ecl(CQ.metal, 1.35), ecl(CQ.metal, 0.7));
  if(SQ.dome){
    /* LE BULBE remplace la couronne de créneaux et ses quatre piques.
       C'est le geste le plus visible du palais : dix-huit tours
       hérissées deviennent dix-huit dômes à l'oignon, et la
       forteresse change de conte sans changer de silhouette. */
    var rb = r * RX * 1.16, yb = p.y - h - 4;
    cylindre(c, gx, gy, r * 1.06, h - 5, 9, ecl(CQ.metalC, 1.05), ecl(CQ.metal, 0.78));
    bulbe(c, p.x, yb, rb, rb * 1.78, SQ.coupole || CQ.pierre);
    pique(c, p.x, yb - rb * 1.78, 20, 2.8);
    return;
  }
  creneaux(c, gx, gy, r * 1.04, h - 6, 8, ecl(CQ.pierre, 1.42), ecl(CQ.pierre, 0.66), 0.17);
  if(avecPique){
    for(var i = 0; i < 4; i++){
      var a = i / 4 * 6.2832 + 0.78;
      var q = iso(gx + Math.cos(a) * r * 1.02, gy + Math.sin(a) * r * 1.02);
      pique(c, q.x, q.y - h - 2, 22, 3.4);
    }
  }
  cylindre(c, gx, gy, r * 0.6, h + 2, 6, "#1d1520", ecl(CQ.metal, 0.9));
  c.fillStyle = "#150e18";
  c.beginPath(); c.ellipse(p.x, p.y - h - 8, r * 0.6 * RX, r * 0.6 * RY, 0, 0, 6.2832); c.fill();
}
function banniereBrasier(c, x, y, w, h){
  var g = c.createLinearGradient(x - w, 0, x + w, 0);
  g.addColorStop(0, CQ.banniereO);
  g.addColorStop(0.35, CQ.banniere);
  g.addColorStop(1, CQ.banniereO);
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x - w, y); c.lineTo(x + w, y); c.lineTo(x + w, y + h);
  c.lineTo(x, y + h - w * 0.7); c.lineTo(x - w, y + h);
  c.closePath(); c.fill();
  c.fillStyle = ecl(CQ.metal, 1.2);
  c.fillRect(x - w * 1.25, y - 3, w * 2.5, 4);
  c.save();
  c.translate(x, y + h * 0.42);
  if(SQ.croissant){
    /* L'emblème de la soie : le croissant et son étoile. Le mufle
       cornu du Brasier disait « on va vous manger » ; celui-ci dit
       « vous êtes chez quelqu'un », ce qui n'est pas moins
       intimidant. */
    croissantOr(c, -w * 0.10, -w * 0.14, w * 0.44, CQ.metalC);
    etoileOr(c, w * 0.40, -w * 0.30, w * 0.22, CQ.or);
    c.restore();
    return;
  }
  c.fillStyle = "rgba(28,10,10,.85)";
  c.beginPath();
  c.moveTo(-w * 0.5, -w * 0.12);
  c.lineTo(-w * 0.72, -w * 0.6); c.lineTo(-w * 0.2, -w * 0.34);
  c.lineTo(0, -w * 0.5);
  c.lineTo(w * 0.2, -w * 0.34); c.lineTo(w * 0.72, -w * 0.6);
  c.lineTo(w * 0.5, -w * 0.12);
  c.quadraticCurveTo(0, w * 0.55, -w * 0.5, -w * 0.12);
  c.closePath(); c.fill();
  c.fillStyle = "rgba(255,140,40,.9)";
  c.beginPath(); c.ellipse(-w * 0.2, -w * 0.1, w * 0.12, w * 0.07, 0.3, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(w * 0.2, -w * 0.1, w * 0.12, w * 0.07, -0.3, 0, 6.2832); c.fill();
  c.restore();
}
function canonBrasier(c, x, y, sens, ech){
  c.save();
  c.translate(x, y);
  c.scale(sens * ech, ech);
  var f = faces(CQ.metal);
  c.fillStyle = f.g;
  c.beginPath();
  c.moveTo(-14, 0); c.lineTo(14, 0); c.lineTo(10, 12); c.lineTo(-10, 12);
  c.closePath(); c.fill();
  var g = c.createLinearGradient(0, -9, 0, 5);
  g.addColorStop(0, ecl(CQ.metalC, 1.15));
  g.addColorStop(0.45, CQ.metal);
  g.addColorStop(1, ecl(CQ.metal, 0.45));
  c.fillStyle = g;
  c.beginPath();
  if(c.roundRect) c.roundRect(-16, -9, 46, 14, 6); else c.rect(-16, -9, 46, 14);
  c.fill();
  c.fillStyle = ecl(CQ.metal, 0.7);
  c.fillRect(-2, -10, 5, 16);
  c.fillRect(16, -10, 4, 16);
  c.fillStyle = "#140c10";
  c.beginPath(); c.ellipse(30, -2, 4, 7, 0, 0, 6.2832); c.fill();
  c.save();
  c.globalCompositeOperation = "lighter";
  var gm = c.createRadialGradient(30, -2, 0.5, 30, -2, 14);
  gm.addColorStop(0, "rgba(255,180,80,.8)");
  gm.addColorStop(1, "rgba(255,80,20,0)");
  c.fillStyle = gm;
  c.beginPath(); c.arc(30, -2, 14, 0, 6.2832); c.fill();
  c.restore();
  c.restore();
}

/* ---------------------------------------------------------------
   Géométrie partagée
   --------------------------------------------------------------- */
var TERRASSES = [
  { r:6.40, h:26, cr:34, ct:0.20 },
  { r:5.10, h:28, cr:28, ct:0.21 },
  { r:3.90, h:30, cr:22, ct:0.22 },
  { r:2.80, h:32, cr:16, ct:0.23 }
];
var Z_TERRASSE = [0, 26, 54, 84, 116];
var TOURS = (function(){
  var t = [], i, a;
  for(i = 0; i < 8; i++){
    a = i / 8 * 6.2832 + 0.3927;
    t.push({ gx:Math.cos(a) * 6.0, gy:Math.sin(a) * 6.0, r:0.62, h:96, z:26, rang:0 });
  }
  for(i = 0; i < 6; i++){
    a = i / 6 * 6.2832 + 0.52;
    t.push({ gx:Math.cos(a) * 4.5, gy:Math.sin(a) * 4.5, r:0.55, h:120, z:54, rang:1 });
  }
  for(i = 0; i < 4; i++){
    a = i / 4 * 6.2832 + 0.79;
    t.push({ gx:Math.cos(a) * 2.9, gy:Math.sin(a) * 2.9, r:0.46, h:138, z:84, rang:2 });
  }
  return t;
})();
function tourDevant(T){ return (T.gx + T.gy) > 0.8; }

/* Tous les foyers de la forteresse : vasques des tours, feux de
   créneaux, ouvertures embrasées, brasiers de l'entrée. Chacun sait
   s'il est devant ou derrière la gardienne. */
var FOYERS = null;
function construitFoyers(){
  FOYERS = [];
  var i, k;
  for(i = 0; i < TOURS.length; i++){
    var T = TOURS[i], p = iso(T.gx, T.gy);
    FOYERS.push({ x:p.x, y:p.y - T.z - T.h - 8, h:26, e:1.1,
                  devant:tourDevant(T), ph:i * 0.83, gros:1 });
  }
  /* feux le long des créneaux */
  for(var ti = 0; ti < TERRASSES.length; ti++){
    var t = TERRASSES[ti], n = 12 - ti * 2;
    for(k = 0; k < n; k++){
      var a = (k + 0.5) / n * 6.2832 + 0.3;
      var cx = Math.cos(a) * t.r * 0.99, cy = Math.sin(a) * t.r * 0.99;
      var q = iso(cx, cy);
      FOYERS.push({ x:q.x, y:q.y - Z_TERRASSE[ti] - t.h - 2, h:13 - ti, e:0.55,
                    devant:(cx + cy) > 0.4, ph:ti * 1.7 + k * 0.61, gros:0 });
    }
  }
  /* ouvertures embrasées des montants de la couronne */
  var zc = Z_TERRASSE[4];
  [-1, 1].forEach(function(sens){
    for(var w = 0; w < 4; w++){
      FOYERS.push({ x:sens * 122 + sens * 4, y:-zc - 62 - w * 74 + 8, h:9, e:0.4,
                    devant:false, ph:w * 1.3 + sens, gros:0 });
    }
  });
  /* gemme de la couronne */
  FOYERS.push({ x:0, y:-zc - 372, h:20, e:0.9, devant:false, ph:2.2, gros:1 });
  /* brasiers de l'entrée */
  var pd = iso(3.2, 3.2), yP = pd.y - 48;
  [[-58, 6], [58, 6], [-40, -30], [40, -30]].forEach(function(o, n2){
    FOYERS.push({ x:pd.x + o[0], y:yP + o[1], h:20, e:0.85,
                  devant:true, ph:n2 * 1.9, gros:1 });
  });
  /* flammes qui lèchent le portail */
  for(k = -2; k <= 2; k++){
    FOYERS.push({ x:pd.x + k * 13, y:yP + 4, h:26 - Math.abs(k) * 5, e:0.7,
                  devant:true, ph:k * 0.9 + 4, gros:0 });
  }

  /* ---- le grand rideau de feu de la couronne ----
     Il comble le vide entre le sommet du crâne et l'arc, et fait
     paraître le visage émergeant du brasier. Ces foyers-là sont
     énormes et respirent lentement (dyn) en plus du vacillement. */
  var NR = 9;
  for(k = 0; k < NR; k++){
    var u = k / (NR - 1) * 2 - 1;             // -1 … +1
    var au = Math.abs(u);
    /* le centre part de derrière le crâne, les bords descendent
       le long des montants */
    FOYERS.push({ x:u * 166,
                  y:-zc - 300 + au * au * 150,
                  h:126 - au * 26 + Math.sin(k * 2.1) * 15,
                  e:2.1 - au * 0.55,
                  devant:false, ph:k * 0.71 + 0.4, gros:2, dyn:1, att:0.46 });
  }
  /* quelques langues très hautes juste derrière le crâne : elles
     débordent de part et d'autre du visage et lèchent l'arc */
  for(k = -2; k <= 2; k++){
    FOYERS.push({ x:k * 46, y:-zc - 268 - Math.abs(k) * 14,
                  h:150 - Math.abs(k) * 16, e:1.5,
                  devant:false, ph:k * 1.27 + 5.3, gros:1, dyn:1, att:0.4 });
  }
  /* couronne de flammes plus fines épousant la silhouette du visage :
     elles remplissent les interstices restants autour des cheveux */
  var NH = 11;
  for(k = 0; k < NH; k++){
    var ah = Math.PI + (k + 0.5) / NH * Math.PI;
    FOYERS.push({ x:Math.cos(ah) * 126,
                  y:Y_TETE + Math.sin(ah) * 150 + 32,
                  h:66 + Math.sin(k * 1.3) * 17,
                  e:1.3,
                  devant:false, ph:k * 0.53 + 2.7, gros:1, dyn:0.8, att:0.55 });
  }
  /* deux torchères géantes de part et d'autre du visage : elles
     cadrent la tête et l'éclairent par le bas */
  [-1, 1].forEach(function(sens){
    FOYERS.push({ x:sens * 152, y:-zc - 40, h:104, e:1.8,
                  devant:false, ph:sens * 2.4 + 1.1, gros:2, dyn:0.9, att:0.55 });
  });

  /* un léger souffle par défaut sur tout le reste : aucun feu du
     Brasier ne doit paraître figé */
  for(i = 0; i < FOYERS.length; i++){
    if(FOYERS[i].dyn === undefined) FOYERS[i].dyn = 0.34;
    if(FOYERS[i].att === undefined) FOYERS[i].att = 1;
  }
}

/* Dessine un foyer : au vacillement rapide de flamme() s'ajoutent une
   respiration lente de la hauteur et une dérive latérale, pour que les
   grands feux vivent à l'échelle de la seconde et non de l'image. */
function dessineFoyer(c, F, tps){
  var t = tps + F.ph;
  var souffle = 1 + F.dyn * (0.32 * Math.sin(t * 0.9 + F.ph)
                           + 0.17 * Math.sin(t * 2.3 + F.ph * 1.7));
  var dx = F.dyn * (Math.sin(t * 0.7 + F.ph * 2.3) * 5
                  + Math.sin(t * 1.9 + F.ph) * 2.4);
  var hh = F.h * souffle;
  flamme(c, F.x + dx, F.y, hh, t, F.e, SQ.froid, F.att);
  if(F.gros) braises(c, F.x + dx, F.y - hh * 0.6, t, F.gros * 5, F.e, 60 + hh, SQ.froid);
}

/* ---------------------------------------------------------------
   Construction des deux sprites
   --------------------------------------------------------------- */
function construitSpriteQG(){
  spriteQGArriere = nouveauCanvas(QG_W, QG_H);
  spriteQGAvant   = nouveauCanvas(QG_W, QG_H);
  var A = spriteQGArriere.getContext("2d");
  var B = spriteQGAvant.getContext("2d");
  A.setTransform(1, 0, 0, 1, QG_OX, QG_OY);
  B.setTransform(1, 0, 0, 1, QG_OX, QG_OY);
  var i, k;

  /* ============================ ARRIÈRE ============================ */
  ombreContact(A, 0, 0, 15.5, 15.5, 0.34);

  /* AU PIED : des éboulis, ou un parvis.
     La citadelle est bâtie sur ce qu'elle a écrasé — d'où les
     éboulis. Le palais, lui, est posé sur une MOSAÏQUE : les mêmes
     cent dix taches, à la même place, mais rangées en anneaux et
     peintes en lapis, turquoise et or. Une seule boucle pour les
     deux, parce que c'est le même geste : semer du petit au pied du
     grand pour qu'il ait l'air posé sur quelque chose. */
  var al = prng(0x51a7);
  for(i = 0; i < 110; i++){
    var a0 = al() * 6.2832, r0 = 6.4 + al() * 1.8;
    var pr = iso(Math.cos(a0) * r0, Math.sin(a0) * r0);
    var t0 = al(), t1 = al(), t2 = al();
    if(SQ.mosaique){
      /* des tesselles, donc des losanges nets et non des galets */
      A.fillStyle = t0 < 0.38 ? "#2f3d8e" : (t0 < 0.74 ? "#1f7ca6" : CQ.or);
      A.globalAlpha = 0.55 + t1 * 0.35;
      var d0 = 3.2 + t2 * 3.4;
      A.beginPath();
      A.moveTo(pr.x, pr.y - d0 * 0.5); A.lineTo(pr.x + d0, pr.y);
      A.lineTo(pr.x, pr.y + d0 * 0.5); A.lineTo(pr.x - d0, pr.y);
      A.closePath(); A.fill();
      A.globalAlpha = 1;
    }else{
      A.fillStyle = t0 < 0.5 ? "#332a30" : "#514348";
      A.beginPath();
      A.ellipse(pr.x, pr.y, 4 + t1 * 9, 2 + t2 * 4, al() * 3, 0, 6.2832);
      A.fill();
    }
  }

  /* les quatre terrasses */
  for(i = 0; i < TERRASSES.length; i++){
    var t = TERRASSES[i], z = Z_TERRASSE[i];
    prisme(A, 0, 0, t.r, 12, 0.26, z, t.h,
           ecl(CQ.pierre, 1.24 - i * 0.03), ecl(CQ.pierre, 0.54 + i * 0.03));
    A.save();
    A.beginPath();
    A.rect(-t.r * RX, iso(0, 0).y - z - t.h, t.r * RX * 2, t.h + 44);
    A.clip();
    appareillage(A, -t.r * RX, t.r * RX, iso(0, t.r).y - z - 4, Math.floor(t.h / 9) + 2, 9);
    A.restore();
    var nf = 11 - i;
    for(k = 0; k < nf; k++){
      var af = (k + 0.5) / nf * Math.PI;
      var pf = iso(Math.cos(af) * t.r * 0.99, Math.sin(af) * t.r * 0.99);
      fenetreArc(A, pf.x, pf.y - z - t.h * 0.26, 4.4 - i * 0.3, 13 - i);
    }
    creneaux(A, 0, 0, t.r * 0.99, z + t.h, t.cr,
             ecl(CQ.pierre, 1.38), ecl(CQ.pierre, 0.58), t.ct);
    for(k = 0; k < 12; k++){
      var ap = k / 12 * 6.2832 + 0.2;
      var pp = iso(Math.cos(ap) * t.r * 0.99, Math.sin(ap) * t.r * 0.99);
      pique(A, pp.x, pp.y - z - t.h - 6, 16 - i * 2, 2.6);
    }
    prisme(A, 0, 0, t.r * 1.02, 12, 0.26, z + t.h - 9, 5,
           ecl(CQ.metal, 1.3), ecl(CQ.metal, 0.66));
  }

  /* bannières */
  [[-4.6, 1.4, 0], [1.4, -4.6, 0], [-3.4, 1.0, 1], [1.0, -3.4, 1]].forEach(function(b){
    var pb = iso(b[0], b[1]);
    banniereBrasier(A, pb.x, pb.y - Z_TERRASSE[b[2]] - TERRASSES[b[2]].h + 8, 15, 46);
  });

  /* canons intégrés aux flancs */
  var pc1 = iso(-4.6, 4.6), pc2 = iso(4.6, -4.6);
  canonBrasier(A, pc1.x - 24, pc1.y - 28, -1, 1.2);
  canonBrasier(A, pc2.x + 24, pc2.y - 28, 1, 1.2);

  /* les tours du fond */
  var arriere = TOURS.filter(function(T){ return !tourDevant(T); })
                     .sort(function(x, y){ return (x.gx + x.gy) - (y.gx + y.gy); });
  for(i = 0; i < arriere.length; i++){
    var T = arriere[i];
    A.save(); A.translate(0, -T.z);
    tourBrasier(A, T.gx, T.gy, T.r, T.h, 1);
    A.restore();
  }

  /* chaînes entre les tours du deuxième rang */
  A.strokeStyle = "rgba(24,16,22,.9)"; A.lineWidth = 3;
  var hautes = TOURS.filter(function(T){ return T.rang === 1; })
                    .sort(function(x, y){ return Math.atan2(x.gy, x.gx) - Math.atan2(y.gy, y.gx); });
  for(i = 0; i < hautes.length; i++){
    var Aa = hautes[i], Bb = hautes[(i + 1) % hautes.length];
    var pa = iso(Aa.gx, Aa.gy), pb = iso(Bb.gx, Bb.gy);
    var ya = pa.y - Aa.z - Aa.h + 8, yb = pb.y - Bb.z - Bb.h + 8;
    A.beginPath();
    A.moveTo(pa.x, ya);
    A.quadraticCurveTo((pa.x + pb.x) / 2, (ya + yb) / 2 + 40, pb.x, yb);
    A.stroke();
    A.fillStyle = "rgba(70,54,64,.95)";
    for(var s = 0.12; s < 0.92; s += 0.1){
      var xx = (1 - s) * (1 - s) * pa.x + 2 * (1 - s) * s * (pa.x + pb.x) / 2 + s * s * pb.x;
      var yy = (1 - s) * (1 - s) * ya + 2 * (1 - s) * s * ((ya + yb) / 2 + 40) + s * s * yb;
      A.beginPath(); A.arc(xx, yy, 2.1, 0, 6.2832); A.fill();
    }
  }

  /* ---- la couronne : la maçonnerie remonte autour du visage ---- */
  var zc = Z_TERRASSE[4];

  /* L'abside : un fond de niche plein derrière la tête. Sans lui on
     voyait la mer par les interstices entre la chevelure et les
     montants — et le visage semblait collé devant le décor au lieu
     d'être serti dans la pierre. */
  function contourAbside(cx){
    cx.beginPath();
    cx.moveTo(-136, -zc + 74);
    cx.lineTo(-136, -zc - 296);
    cx.bezierCurveTo(-136, -zc - 456, 136, -zc - 456, 136, -zc - 296);
    cx.lineTo(136, -zc + 74);
    cx.closePath();
  }
  var gab = A.createLinearGradient(0, -zc - 456, 0, -zc + 74);
  gab.addColorStop(0.00, ecl(CQ.pierre, 0.22));
  gab.addColorStop(0.52, ecl(CQ.pierre, 0.40));
  gab.addColorStop(1.00, ecl(CQ.pierre, 0.26));
  A.fillStyle = gab;
  contourAbside(A); A.fill();
  A.save();
  contourAbside(A); A.clip();
  appareillage(A, -142, 142, -zc + 70, 40, 14);
  /* LA VOÛTE ÉTOILÉE. Le fond de niche du Brasier est un mur ; celui
     du palais est un CIEL. Quatre-vingts petites étoiles d'or semées
     sur l'appareillage, plus denses vers le haut — c'est le geste qui
     transforme une abside en firmament, et il coûte quatre-vingts
     points. Elles sont tirées sur une graine fixe : un fond de niche
     qui changerait d'une partie à l'autre serait un fond de niche
     qu'on ne reconnaîtrait pas. */
  if(SQ.mosaique){
    var gVo = A.createLinearGradient(0, -zc - 460, 0, -zc + 74);
    gVo.addColorStop(0, "rgba(14,16,52,.72)");
    gVo.addColorStop(1, "rgba(14,16,52,.10)");
    A.fillStyle = gVo;
    A.fillRect(-142, -zc - 470, 284, 560);
    var ae = prng(0x2A11);
    for(var se = 0; se < 80; se++){
      var ex = (ae() - 0.5) * 280;
      var ey = -zc + 60 - Math.pow(ae(), 0.55) * 500;
      var er = 0.7 + ae() * 1.5, ea = 0.35 + ae() * 0.55;
      A.fillStyle = (se % 5) ? "rgba(255,240,200," + ea + ")"
                             : "rgba(180,226,255," + ea + ")";
      A.beginPath(); A.arc(ex, ey, er, 0, 6.2832); A.fill();
      /* une sur six porte quatre rayons : c'est ce qui les fait lire
         comme des étoiles et non comme de la poussière */
      if(se % 6 === 0){
        A.strokeStyle = "rgba(255,240,200," + (ea * 0.7) + ")";
        A.lineWidth = 0.6;
        A.beginPath();
        A.moveTo(ex - er * 3, ey); A.lineTo(ex + er * 3, ey);
        A.moveTo(ex, ey - er * 3); A.lineTo(ex, ey + er * 3);
        A.stroke();
      }
    }
  }
  /* les bords de la niche se creusent d'ombre */
  var gab2 = A.createRadialGradient(0, -zc - 190, 30, 0, -zc - 190, 250);
  gab2.addColorStop(0, "rgba(0,0,0,0)");
  gab2.addColorStop(0.62, "rgba(6,3,8,.30)");
  gab2.addColorStop(1, "rgba(6,3,8,.72)");
  A.fillStyle = gab2;
  A.fillRect(-140, -zc - 460, 280, 540);
  /* nervures verticales : la niche a été taillée dans la masse */
  A.strokeStyle = "rgba(0,0,0,.34)"; A.lineWidth = 2.4;
  for(i = -3; i <= 3; i++){
    if(!i) continue;
    A.beginPath();
    A.moveTo(i * 34, -zc + 70);
    A.lineTo(i * 30, -zc - 330);
    A.stroke();
  }
  A.restore();

  [-1, 1].forEach(function(sens){
    var x = sens * 122;
    function contour(cx){
      cx.beginPath();
      cx.moveTo(x - 48, -zc - 10);
      cx.quadraticCurveTo(x - 54, -zc - 210, x - 26, -zc - 344);
      cx.lineTo(x + 28, -zc - 348);
      cx.quadraticCurveTo(x + 52, -zc - 200, x + 46, -zc - 10);
      cx.closePath();
    }
    var g = A.createLinearGradient(x - 48, 0, x + 48, 0);
    g.addColorStop(0, ecl(CQ.pierre, 0.60));
    g.addColorStop(0.38, ecl(CQ.pierre, 1.20));
    g.addColorStop(1, ecl(CQ.pierre, 0.48));
    A.fillStyle = g;
    contour(A); A.fill();
    A.save(); contour(A); A.clip();
    appareillage(A, x - 58, x + 58, -zc - 14, 24, 15);
    A.restore();
    for(var w = 0; w < 4; w++) fenetreArc(A, x + sens * 4, -zc - 62 - w * 74, 8, 22);
    for(var q = -1; q <= 1; q++) pique(A, x + q * 22, -zc - 340 + Math.abs(q) * 10, 32, 4.6);
  });
  /* ---- l'arc de couronne au-dessus de la tête ----
     LE BRASIER le fait en plein cintre : une voûte lourde, qui pèse
     sur le visage. LE PALAIS le fait EN ACCOLADE, et il monte donc
     cent trente pixels plus haut pour finir en pointe — c'est la
     ligne qu'on reconnaît de loin sur un iwan, et elle change tout ce
     que la niche raconte : le visage n'est plus enfermé sous une
     voûte, il est présenté sous une arche. */
  var gcou = A.createLinearGradient(0, -zc - (SQ.ogive ? 510 : 470), 0, -zc - 330);
  gcou.addColorStop(0, ecl(CQ.pierre, 1.32));
  gcou.addColorStop(1, ecl(CQ.pierre, 0.60));
  A.fillStyle = gcou;
  A.beginPath();
  if(SQ.ogive){
    A.moveTo(-150, -zc - 330);
    A.bezierCurveTo(-160, -zc - 456, -64, -zc - 430, 0, -zc - 500);
    A.bezierCurveTo(64, -zc - 430, 160, -zc - 456, 150, -zc - 330);
    A.lineTo(114, -zc - 330);
    A.bezierCurveTo(116, -zc - 430, 44, -zc - 402, 0, -zc - 452);
    A.bezierCurveTo(-44, -zc - 402, -116, -zc - 430, -114, -zc - 330);
  }else{
    A.moveTo(-150, -zc - 330);
    A.bezierCurveTo(-154, -zc - 458, 154, -zc - 458, 150, -zc - 330);
    A.lineTo(114, -zc - 330);
    A.bezierCurveTo(114, -zc - 428, -114, -zc - 428, -114, -zc - 330);
  }
  A.closePath(); A.fill();
  A.strokeStyle = ecl(CQ.metal, 1.2); A.lineWidth = 3; A.stroke();
  for(i = 0; i <= 12; i++){
    var ac = Math.PI + i / 12 * Math.PI;
    var cx2 = Math.cos(ac) * 132, cy2 = -zc - 396 + Math.sin(ac) * 64;
    if(SQ.dome){
      /* Douze petites coupoles le long de l'arc — pas treize : la
         place du milieu revient au croissant de faîte, et deux
         emblèmes au même endroit n'en font aucun. */
      if(i === 6) continue;
      var mo = 1 - Math.abs(i - 6) / 6;
      var yb2 = cy2 - 4 - mo * mo * 26;
      A.fillStyle = ecl(CQ.metalC, 0.92);
      A.fillRect(cx2 - 6, yb2 - 4, 12, 12);
      bulbe(A, cx2, yb2 - 3, 7.5 + mo * 2.5, 17 + mo * 8, SQ.coupole || CQ.pierre);
    }else{
      A.fillStyle = ecl(CQ.pierre, 1.12);
      A.fillRect(cx2 - 9, cy2 - 10, 18, 22);
      pique(A, cx2, cy2 - 8, 26 - Math.abs(i - 6) * 1.6, 3.6);
    }
  }
  if(SQ.ogive){
    fenetreArc(A, 0, -zc - 396, 14, 42);
    /* LE CROISSANT DE FAÎTE, l'aboutissement de tout l'axe, et le
       point le plus haut du palais. Le fût le porte sans en tirer un
       petit de son côté : deux croissants l'un sous l'autre feraient
       une girouette. */
    pique(A, 0, -zc - 496, 50, 7.2, 1);
    lueurRapide(A, 0, -zc - 566, 76, CQ.or, 0.32);
    croissantOr(A, 0, -zc - 566, 27, ecl(CQ.metalC, 1.10));
    etoileOr(A, 37, -zc - 588, 10, ecl(CQ.or, 1.15));
  }else{
    fenetreArc(A, 0, -zc - 392, 13, 42);
    pique(A, 0, -zc - 452, 48, 6.8);
  }

  /* voile d'ambiance : « source-atop » ne peint que sur la maçonnerie
     déjà dessinée, et laisse le reste du sprite transparent. */
  A.save();
  A.globalCompositeOperation = "source-atop";
  var gv = A.createLinearGradient(0, -zc - 460, 0, 20);
  gv.addColorStop(0, SQ.voile[0]);
  gv.addColorStop(0.45, SQ.voile[1]);
  gv.addColorStop(1, SQ.voile[2]);
  A.fillStyle = gv;
  A.fillRect(-QG_OX, -QG_OY, QG_W, QG_H);
  A.restore();

  /* ============================ AVANT ============================ */
  var fe = faces(CQ.pierre);
  boite(B, 3.2, 3.2, 5.0, 5.0, 0, 44, fe.t, fe.g, fe.d);
  var pe = iso(3.2, 3.2);
  B.save();
  B.beginPath(); B.rect(pe.x - 96, pe.y - 48, 192, 54); B.clip();
  appareillage(B, pe.x - 96, pe.x + 96, pe.y - 4, 6, 9);
  B.restore();

  /* escalier */
  for(i = 0; i < 7; i++){
    boite(B, 5.6 - i * 0.44, 5.6 - i * 0.44, 1.6, 1.6, i * 5.8, 6,
          ecl(CQ.pierre, 1.26), ecl(CQ.pierre, 0.52), ecl(CQ.pierre, 0.72), true);
  }
  /* rampes à chaînes */
  [[-1, 1], [1, -1]].forEach(function(r){
    for(i = 0; i < 4; i++){
      var px = iso(5.4 - i * 0.95 + r[0] * 1.1, 5.4 - i * 0.95 + r[1] * 1.1);
      var yy = px.y - 6 - i * 5.6;
      B.fillStyle = ecl(CQ.metal, 1.05);
      B.fillRect(px.x - 2.4, yy - 24, 4.8, 24);
      pique(B, px.x, yy - 24, 13, 2.6);
      if(i){
        B.strokeStyle = "rgba(30,20,26,.9)"; B.lineWidth = 2;
        B.beginPath();
        B.moveTo(px.x, yy - 20);
        B.quadraticCurveTo(px.x + 16, yy - 8, px.x + 30, yy - 18);
        B.stroke();
      }
    }
  });

  /* le portail */
  var pd = iso(3.2, 3.2);
  var yPorte = pd.y - 48;
  B.fillStyle = ecl(CQ.pierre, 1.16);
  B.beginPath();
  B.moveTo(pd.x - 48, yPorte + 8);
  B.lineTo(pd.x - 48, yPorte - 54);
  B.quadraticCurveTo(pd.x, yPorte - 122, pd.x + 48, yPorte - 54);
  B.lineTo(pd.x + 48, yPorte + 8);
  B.closePath(); B.fill();
  B.strokeStyle = ecl(CQ.metal, 1.15); B.lineWidth = 4; B.stroke();
  var gp = B.createLinearGradient(pd.x, yPorte - 106, pd.x, yPorte + 6);
  gp.addColorStop(0, SQ.portail[0]);
  gp.addColorStop(0.5, SQ.portail[1]);
  gp.addColorStop(1, SQ.portail[2]);
  B.fillStyle = gp;
  B.beginPath();
  B.moveTo(pd.x - 34, yPorte + 6);
  B.lineTo(pd.x - 34, yPorte - 50);
  B.quadraticCurveTo(pd.x, yPorte - 108, pd.x + 34, yPorte - 50);
  B.lineTo(pd.x + 34, yPorte + 6);
  B.closePath(); B.fill();
  B.strokeStyle = "rgba(40,26,32,.8)"; B.lineWidth = 3;
  for(i = -3; i <= 3; i++){
    B.beginPath();
    B.moveTo(pd.x + i * 10, yPorte + 4);
    B.lineTo(pd.x + i * 10, yPorte - 54 - (3 - Math.abs(i)) * 9);
    B.stroke();
  }
  /* AU-DESSUS DU PORTAIL : un mufle cornu, ou un croissant.
     C'est la pièce qui dit au joueur ce qu'il franchit. Le Brasier y
     met une gueule ; le palais y met le croissant, son étoile, et
     deux paons affrontés — les mêmes qui se promènent dans le jardin,
     ce qui fait de l'emblème une promesse tenue. */
  B.save();
  B.translate(pd.x, yPorte - 128);
  if(SQ.croissant){
    var gm2 = B.createLinearGradient(0, -34, 0, 18);
    gm2.addColorStop(0, ecl(CQ.metalC, 1.08));
    gm2.addColorStop(1, ecl(CQ.metal, 0.78));
    B.fillStyle = gm2;
    /* le cartouche : un losange à pointes, taillé comme une tesselle */
    B.beginPath();
    B.moveTo(0, -40); B.lineTo(52, 0); B.lineTo(0, 32); B.lineTo(-52, 0);
    B.closePath(); B.fill();
    B.strokeStyle = ecl(CQ.metalC, 1.2); B.lineWidth = 2; B.stroke();
    B.fillStyle = "rgba(18,22,64,.72)";
    B.beginPath();
    B.moveTo(0, -30); B.lineTo(39, 0); B.lineTo(0, 23); B.lineTo(-39, 0);
    B.closePath(); B.fill();
    croissantOr(B, -3, -3, 15, ecl(CQ.metalC, 1.05));
    etoileOr(B, 17, -9, 7, CQ.or);
    B.save();
    B.globalCompositeOperation = "lighter";
    var ge2 = B.createRadialGradient(0, -4, 1, 0, -4, 46);
    ge2.addColorStop(0, "rgba(150,222,255,.55)");
    ge2.addColorStop(1, "rgba(60,150,255,0)");
    B.fillStyle = ge2;
    B.beginPath(); B.arc(0, -4, 46, 0, 6.2832); B.fill();
    B.restore();
    B.restore();
  }else{
  B.fillStyle = ecl(CQ.metal, 0.85);
  B.beginPath();
  B.moveTo(-32, 4);
  B.lineTo(-46, -32); B.lineTo(-17, -15);
  B.lineTo(0, -28);
  B.lineTo(17, -15); B.lineTo(46, -32); B.lineTo(32, 4);
  B.quadraticCurveTo(0, 36, -32, 4);
  B.closePath(); B.fill();
  B.strokeStyle = ecl(CQ.metal, 1.35); B.lineWidth = 2; B.stroke();
  B.save();
  B.globalCompositeOperation = "lighter";
  [-13, 13].forEach(function(x){
    var ge = B.createRadialGradient(x, -5, 0.5, x, -5, 15);
    ge.addColorStop(0, "rgba(255,220,140,.95)");
    ge.addColorStop(0.4, "rgba(255,90,20,.7)");
    ge.addColorStop(1, "rgba(255,60,10,0)");
    B.fillStyle = ge;
    B.beginPath(); B.ellipse(x, -5, 15, 9, 0, 0, 6.2832); B.fill();
  });
  B.restore();
  B.restore();
  }

  /* tours de façade */
  var devant = TOURS.filter(tourDevant)
                    .sort(function(x, y){ return (x.gx + x.gy) - (y.gx + y.gy); });
  for(i = 0; i < devant.length; i++){
    var T2 = devant[i];
    B.save(); B.translate(0, -T2.z);
    tourBrasier(B, T2.gx, T2.gy, T2.r, T2.h, 1);
    B.restore();
  }
  var pb1 = iso(5.2, 1.0), pb2 = iso(1.0, 5.2);
  banniereBrasier(B, pb1.x, pb1.y - 82, 16, 52);
  banniereBrasier(B, pb2.x, pb2.y - 82, 16, 52);

  B.save();
  B.globalCompositeOperation = "source-atop";
  var gv2 = B.createLinearGradient(0, -300, 0, 40);
  gv2.addColorStop(0, SQ.voile[0]);
  gv2.addColorStop(1, SQ.voile[2]);
  B.fillStyle = gv2;
  B.fillRect(-QG_OX, -QG_OY, QG_W, QG_H);
  B.restore();
}

/* ---------------------------------------------------------------
   Dessin en direct
   --------------------------------------------------------------- */
function dessineQG(c, tps){
  /* Pendant la séquence finale, la forteresse s'enfonce, penche et
     s'assombrit. Tout le dessin qui suit passe par cette transformation,
     sprites et flammes comprises. */
  var eff = (jeu.fin && jeu.fin.effondrement) || 0;
  if(eff > 0){
    c.save();
    c.translate(Math.sin(tps * 23) * eff * 7, eff * 132);
    c.rotate(Math.sin(tps * 1.6) * eff * 0.055);
    c.scale(1 + eff * 0.05, 1 - eff * 0.20);
    dessineQGcorps(c, tps, eff);
    c.restore();
    return;
  }
  dessineQGcorps(c, tps, 0);
}
function dessineQGcorps(c, tps, eff){
  /* La bonne forteresse pour cette île. Une comparaison de chaînes
     par image, et la reconstruction n'a lieu qu'au changement d'île. */
  assureSpriteQG();
  var q = jeu.qg;
  var p = versEcran(cam, q.gx, q.gy);
  var z = cam.z;
  var fr = Math.max(0, q.pv / q.pvMax);
  var pouls = 0.5 + 0.5 * Math.sin(tps * 2.4);
  var detail = z > 0.26;

  c.save();
  c.translate(p.x, p.y);
  c.scale(z, z);

  if(!FOYERS) construitFoyers();

  /* LE HALO derrière toute la forteresse. Chaleur au Brasier, clair
     de lune au palais : c'est lui qui donne sa couleur à tout ce qui
     entoure le QG, bien avant qu'on distingue une pierre. */
  var respire = 0.82 + 0.18 * Math.sin(tps * 1.3) + 0.08 * Math.sin(tps * 3.7);
  lueurRapide(c, 0, -170, 430 * respire, SQ.halo[0], 0.20 + 0.06 * respire);
  lueurRapide(c, 0, -60, 300 * respire, SQ.halo[1], 0.14);

  if(spriteQGArriere) c.drawImage(spriteQGArriere, -QG_OX, -QG_OY, QG_W, QG_H);

  /* tous les foyers du fond */
  if(detail){
    for(var i = 0; i < FOYERS.length; i++){
      var F = FOYERS[i];
      if(F.devant) continue;
      dessineFoyer(c, F, tps);
    }
  }

  /* la gardienne, fondue dans la maçonnerie */
  var inten = Math.min(1, 0.3 + pouls * 0.3 + (jeu.qgTelegraphe > 0 ? 0.4 : 0) + (1 - fr) * 0.4);
  gardienne3D(c, 0, Y_TETE, ECH_GARD, inten, tps);

  /* la façade repasse devant la chevelure */
  if(spriteQGAvant) c.drawImage(spriteQGAvant, -QG_OX, -QG_OY, QG_W, QG_H);

  if(detail){
    for(var k = 0; k < FOYERS.length; k++){
      var F2 = FOYERS[k];
      if(!F2.devant) continue;
      dessineFoyer(c, F2, tps);
    }
    /* braises qui montent de toute la masse */
    braises(c, 0, -120, tps * 0.7, 26, 1.5, 320, SQ.froid);
  }

  /* la fournaise du portail */
  var pd = iso(3.2, 3.2);
  var yPorte = pd.y - 48;
  var intense = jeu.qgTelegraphe > 0 ? 1 : pouls;
  c.save();
  c.globalCompositeOperation = "lighter";
  var gf = c.createRadialGradient(pd.x, yPorte - 48, 4, pd.x, yPorte - 48, 100 + intense * 32);
  gf.addColorStop(0, "rgba(" + SQ.fournaise[0] + "," + (0.42 + intense * 0.34) + ")");
  gf.addColorStop(0.4, "rgba(" + SQ.fournaise[1] + "," + (0.26 + intense * 0.22) + ")");
  gf.addColorStop(1, "rgba(" + SQ.fournaise[2] + ",0)");
  c.fillStyle = gf;
  c.beginPath(); c.arc(pd.x, yPorte - 48, 100 + intense * 32, 0, 6.2832); c.fill();
  c.restore();
  if(detail){
    c.save();
    c.globalAlpha = 0.09;
    for(var b = 0; b < 5; b++){
      var ph = (tps * 0.5 + b * 0.2) % 1;
      c.fillStyle = SQ.froid ? "#cfeaff" : "#ffcf9a";
      c.beginPath();
      c.ellipse(pd.x + Math.sin(tps * 2 + b * 2) * 10, yPorte - 126 - ph * 70,
                18 + ph * 24, 7 + ph * 9, 0, 0, 6.2832);
      c.fill();
    }
    c.restore();
  }

  /* fissures incandescentes sous 66 % de vie */
  if(fr < 0.66){
    var ouv = (0.66 - fr) / 0.66;
    var al = prng(4242);
    c.save();
    c.lineCap = "round";
    for(var f2 = 0; f2 < 26; f2++){
      var x0 = (al() - 0.5) * 440, y0 = -al() * 270;
      var gd = c.createLinearGradient(x0, y0, x0 + 30, y0 + 46);
      gd.addColorStop(0, "rgba(" + SQ.fissure[0] + "," + (0.35 + ouv * 0.55) + ")");
      gd.addColorStop(1, "rgba(" + SQ.fissure[1] + ",.12)");
      c.strokeStyle = gd;
      c.lineWidth = 1 + ouv * 4.4;
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x0 + (al() - 0.5) * 38, y0 + 22);
      c.lineTo(x0 + (al() - 0.5) * 50, y0 + 46);
      c.stroke();
    }
    c.restore();
  }

  c.restore();
}
