/* ================================================================
   L'AIR DES « MILY ET UNE NUITS »

   « Des étoiles qui flottent dans l'air, des bulles magiques, de la
   poussière d'étoile, des papillons géants. »

   C'est ce qui manquait le plus à cette carte. Le sol est en
   mosaïques, la mer est d'encre étoilée, les fontaines coulent — et
   entre les deux, entre la terre et le ciel, il n'y avait RIEN. Une
   belle carte de nuit sans rien dans l'air se lit comme une image
   fixe : c'est l'air qui la fait respirer.

   ────────────────────────────────────────────────────────────────
   TROIS DÉCISIONS, ET ELLES TIENNENT TOUT LE FICHIER
   ────────────────────────────────────────────────────────────────

   1. AUCUNE PARTICULE N'EXISTE.

      Il n'y a pas de liste de mille grains qu'on avance de dt à
      chaque image, pas de naissances, pas de morts, pas de mémoire.
      Il y a UN MOTIF — quelques dizaines de grains posés dans un
      carré de 620 unités — que l'écran répète autant de fois qu'il
      en voit, et une fonction du temps qui dit où chacun se trouve à
      l'instant t. Le champ est donc infini, gratuit hors champ, et
      identique pour tous les joueurs du salon sans qu'un seul octet
      passe par le réseau.

      C'est exactement la mécanique de la mer d'encre (dessineMerDEncre,
      30-terrain.js) : elle a fait ses preuves sur la même carte.

   2. DEUX COUCHES, PARCE QU'UNE SEULE FLOTTE.

      Tout dessiner par-dessus la carte donne un calque collé sur
      l'écran — de la poussière sur l'objectif, pas de la poussière
      dans le monde. On coupe donc le champ en deux : la couche LOIN
      passe avant la pile de profondeur, donc DERRIÈRE les tours, les
      troupes et les fontaines, et la couche PRÈS passe après. Un
      grain qui disparaît derrière une tour de guet et un autre qui
      lui passe devant, dans la même image : c'est ça qui met l'air
      DANS la carte.

      Le partage est décidé une fois pour toutes à la fabrication, pas
      à l'image : un grain ne change jamais de couche, sinon il
      clignote.

   3. LE ZOOM DÉCIDE DE CE QUI EST PEINT.

      « Ça doit tourner sur tablette et sur téléphone. » À z = 0,2 un
      grain de poussière fait moins d'un pixel : il coûte son dessin
      entier pour ne rien montrer. Chaque espèce a donc son seuil, et
      un plafond global termine le travail quand la vue est si large
      qu'elle couvre la moitié de l'île.

   ────────────────────────────────────────────────────────────────
   QUATRE ESPÈCES
   ────────────────────────────────────────────────────────────────
     LA POUSSIÈRE  la plus nombreuse, la plus petite. Elle ne monte
                   pas : elle flotte sur place et scintille. C'est le
                   fond de l'air, celui qu'on ne regarde pas.
     LES ÉTOILES   elles montent, lentement, en se balançant, et
                   s'éteignent en haut de leur course. Ce sont elles
                   qu'on voit.
     LES BULLES    elles montent plus vite, plus haut, et ÉCLATENT —
                   un anneau qui s'ouvre et six éclats qui partent.
                   C'est le seul évènement de l'air.
     LES PAPILLONS géants, lumineux, ils tournent autour de leur
                   point et ne quittent jamais la terre ferme.
   ================================================================ */

/* Le pas du motif, en unités monde. Assez large pour qu'on ne lise
   pas la grille, assez court pour qu'une vue de tablette en contienne
   quelques-uns et pas quarante. */
var AIR_TUILE = 620;
var AIR_MONTEE = 172;            // la course d'une étoile flottante
var AIR_BULLE_H = 240;           // celle d'une bulle : elle va plus haut

/* Les cinq teintes de l'air, en « r,v,b ». L'or domine — c'est la
   couleur des lanternes de l'île —, le lilas est la pierre sous la
   lune, le turquoise vient de l'eau des fontaines, et le rose et le
   violet sont rares : deux grains sur quarante. Une poussière
   uniformément dorée serait du sable ; ce sont les rares qui font
   qu'on la lit comme magique. */
var AIR_TEINTES = ["255,226,150", "226,222,255", "150,246,236",
                   "255,182,226", "186,158,255"];
/* Le tirage des teintes, en seuils cumulés. */
function teinteAir(a){
  return a < 0.50 ? 0 : a < 0.80 ? 1 : a < 0.93 ? 2 : a < 0.975 ? 3 : 4;
}

/* Les effectifs d'une tuile. */
var AIR_N_GRAIN = 30, AIR_N_ETOILE = 11, AIR_N_BULLE = 4, AIR_N_PAPILLON = 2;

/* Les seuils de zoom, par espèce. En dessous, on ne dessine pas. */
var AIR_Z_GRAIN = 0.34, AIR_Z_ETOILE = 0.20, AIR_Z_BULLE = 0.30, AIR_Z_PAPILLON = 0.52;
/* Le plafond global : au-delà, la vue est si large que le champ ne se
   lit plus de toute façon. */
var AIR_PLAFOND = 620;

/* ----------------------------------------------------------------
   LE MOTIF

   Un seul tirage, une seule fois, à graine fixe : le champ est le
   même pour tout le monde et à toutes les parties. On tire un nombre
   FIXE de valeurs par particule, dans le même ordre, avant d'en
   utiliser aucune — la règle de la maison : le test vient après les
   tirages. Un ternaire qui consomme un al() de plus une fois sur deux
   décale toute la suite du motif.
   ---------------------------------------------------------------- */
var AIR_CHAMP = null;
function construitAirNuits(){
  var al = prng(0x51AE7);
  var ch = { grains:[], etoiles:[], bulles:[], papillons:[] };
  var i, a1, a2, a3, a4, a5, a6, a7, a8;

  for(i = 0; i < AIR_N_GRAIN; i++){
    a1 = al(); a2 = al(); a3 = al(); a4 = al();
    a5 = al(); a6 = al(); a7 = al(); a8 = al();
    ch.grains.push({
      x:a1 * AIR_TUILE, y:a2 * AIR_TUILE,
      r:2.4 + a3 * 4.6,              // le rayon de la LUEUR, pas du grain
      hh:14 + a4 * 30,               // à quelle hauteur il flotte au-dessus du sol
      amp:5 + a5 * 14,               // l'amplitude de son flottement
      ph:a6 * 6.2832,
      vit:0.42 + a7 * 0.95,
      t:teinteAir(a8),
      c:a4 < 0.5 ? 0 : 1
    });
  }

  for(i = 0; i < AIR_N_ETOILE; i++){
    a1 = al(); a2 = al(); a3 = al(); a4 = al();
    a5 = al(); a6 = al(); a7 = al(); a8 = al();
    ch.etoiles.push({
      x:a1 * AIR_TUILE, y:a2 * AIR_TUILE,
      r:5.5 + a3 * 7.5,
      ph:a4,                         // la phase de la MONTÉE, dans [0,1[
      mont:0.055 + a5 * 0.075,       // tours de course par seconde
      bal:8 + a6 * 22,               // le balancement latéral
      scin:1.6 + a7 * 2.4,           // la vitesse du scintillement
      t:teinteAir(a8),
      c:a2 < 0.45 ? 0 : 1
    });
  }

  for(i = 0; i < AIR_N_BULLE; i++){
    a1 = al(); a2 = al(); a3 = al(); a4 = al();
    a5 = al(); a6 = al(); a7 = al(); a8 = al();
    ch.bulles.push({
      x:a1 * AIR_TUILE, y:a2 * AIR_TUILE,
      r:7 + a3 * 11,
      ph:a4,
      duree:9 + a5 * 8,              // une vie entière, montée et éclatement
      bal:10 + a6 * 20,
      tour:a7 * 6.2832,              // l'orientation de son reflet
      t:teinteAir(a8 * 0.6 + 0.34)   // les bulles ne sont jamais dorées
    });
  }

  for(i = 0; i < AIR_N_PAPILLON; i++){
    a1 = al(); a2 = al(); a3 = al(); a4 = al();
    a5 = al(); a6 = al(); a7 = al(); a8 = al();
    ch.papillons.push({
      x:a1 * AIR_TUILE, y:a2 * AIR_TUILE,
      ech:0.80 + a3 * 0.55,
      ph:a4 * 6.2832,
      vit:0.20 + a5 * 0.20,          // le tour de sa ronde
      ray:26 + a6 * 46,              // le rayon de la ronde
      hh:30 + a7 * 34,               // sa hauteur de vol
      t:teinteAir(a8 * 0.55 + 0.42)  // ni doré : bleu, rose ou violet
    });
  }
  return ch;
}

/* ----------------------------------------------------------------
   LES SPRITES

   Une lueur radiale coûte un dégradé par appel ; à trois cents grains
   par image, c'est trois cents dégradés. On les cuit une fois, cinq
   teintes chacun, et le champ entier devient une suite de drawImage
   sous un seul save() — le chemin rapide, et c'est celui qui décide
   si la carte tient sur un téléphone.
   ---------------------------------------------------------------- */
var AIR_SP = null;
function spritesAir(){
  if(AIR_SP) return AIR_SP;
  AIR_SP = { grain:[], etoile:[], bulle:spBulleAir() };
  for(var t = 0; t < AIR_TEINTES.length; t++){
    AIR_SP.grain.push(spGrainAir(AIR_TEINTES[t]));
    AIR_SP.etoile.push(spEtoileAir(AIR_TEINTES[t]));
  }
  return AIR_SP;
}

/* Un grain : un cœur presque blanc dans un halo de sa teinte. Le cœur
   compte plus qu'on ne croit — sans lui, un grain n'est qu'une tache
   floue ; avec lui, c'est un point de lumière. */
function spGrainAir(coul){
  var s = nouveauCanvas(64, 64), g = s.getContext("2d");
  var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, rgba(coul, 0.95));
  gr.addColorStop(0.20, rgba(coul, 0.52));
  gr.addColorStop(0.48, rgba(coul, 0.15));
  gr.addColorStop(1, rgba(coul, 0));
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  g.globalCompositeOperation = "lighter";
  g.fillStyle = "rgba(255,255,255,.75)";
  g.beginPath(); g.arc(32, 32, 3.2, 0, 6.2832); g.fill();
  return s;
}

/* Une étoile flottante : huit branches, quatre longues et quatre
   courtes en diagonale. C'est la forme des étoiles gravées dans le sol
   de l'île et de celles des lanternes — la même étoile partout, c'est
   ce qui donne à une carte son unité. */
function spEtoileAir(coul){
  var s = nouveauCanvas(128, 128), g = s.getContext("2d");
  var C = 64;
  var gr = g.createRadialGradient(C, C, 0, C, C, C);
  gr.addColorStop(0, rgba(coul, 0.42));
  gr.addColorStop(0.26, rgba(coul, 0.16));
  gr.addColorStop(1, rgba(coul, 0));
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);

  g.globalCompositeOperation = "lighter";
  /* les quatre branches courtes, en diagonale, dessous */
  brancheAir(g, C, 30, 7, Math.PI / 4, rgba(coul, 0.55));
  /* les quatre longues, droites, dessus */
  brancheAir(g, C, 58, 9, 0, rgba(coul, 0.92));
  /* le cœur */
  var gc = g.createRadialGradient(C, C, 0, C, C, 11);
  gc.addColorStop(0, "rgba(255,255,255,.95)");
  gc.addColorStop(0.5, rgba(coul, 0.55));
  gc.addColorStop(1, rgba(coul, 0));
  g.fillStyle = gc;
  g.beginPath(); g.arc(C, C, 11, 0, 6.2832); g.fill();
  return s;
}
/* Quatre branches effilées à partir du centre : deux traits par
   branche, du bout pointu vers la base large. */
function brancheAir(g, C, lon, larg, tour, style){
  g.fillStyle = style;
  g.beginPath();
  for(var k = 0; k < 4; k++){
    var a = tour + k * Math.PI / 2;
    var cx = Math.cos(a), cy = Math.sin(a);
    var px = -cy, py = cx;                     // la perpendiculaire
    g.moveTo(C + cx * lon, C + cy * lon);
    g.lineTo(C + px * larg, C + py * larg);
    g.lineTo(C - px * larg, C - py * larg);
    g.closePath();
  }
  g.fill();
}

/* Une bulle : presque rien au centre, un liseré vif au bord, deux
   reflets. Tout le dessin d'une bulle est dans son BORD — c'est là
   que la lumière rase la paroi — et dans le point blanc décentré qui
   dit d'où vient la lune. */
function spBulleAir(){
  var s = nouveauCanvas(128, 128), g = s.getContext("2d");
  var C = 64;
  var gr = g.createRadialGradient(C, C, 0, C, C, 62);
  gr.addColorStop(0,    "rgba(150,220,255,0)");
  gr.addColorStop(0.62, "rgba(150,220,255,.05)");
  gr.addColorStop(0.86, "rgba(196,238,255,.22)");
  gr.addColorStop(0.965, "rgba(240,252,255,.62)");
  gr.addColorStop(1,    "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.beginPath(); g.arc(C, C, 62, 0, 6.2832); g.fill();

  g.globalCompositeOperation = "lighter";
  /* l'irisation : deux arcs de savon, opposés et de teintes opposées */
  g.lineWidth = 4.2; g.lineCap = "round";
  g.strokeStyle = "rgba(120,255,236,.34)";
  g.beginPath(); g.arc(C, C, 57, 0.55, 1.85); g.stroke();
  g.strokeStyle = "rgba(255,170,226,.30)";
  g.beginPath(); g.arc(C, C, 57, 3.75, 4.95); g.stroke();
  /* les deux reflets : le grand en haut à gauche, le petit en face */
  g.fillStyle = "rgba(255,255,255,.78)";
  g.beginPath(); g.ellipse(C - 26, C - 28, 11, 7.5, -0.7, 0, 6.2832); g.fill();
  g.fillStyle = "rgba(255,255,255,.34)";
  g.beginPath(); g.ellipse(C + 27, C + 26, 6, 4, -0.7, 0, 6.2832); g.fill();
  return s;
}

/* ----------------------------------------------------------------
   LE CHAMP, À L'ÉCRAN

   Appelé DEUX FOIS par image, une par couche. Il travaille dans le
   repère du MONDE : `vue` y est déjà, et un grain garde donc sa place
   sur l'île quand la caméra bouge, au lieu de coller à l'écran.
   ---------------------------------------------------------------- */
function dessineAirNuits(c, tps, vue, couche){
  var z = cam.z;
  if(z < AIR_Z_ETOILE) return;
  if(!AIR_CHAMP) AIR_CHAMP = construitAirNuits();
  var SP = spritesAir();

  var i0 = Math.floor(vue.x0 / AIR_TUILE), i1 = Math.ceil(vue.x1 / AIR_TUILE);
  var j0 = Math.floor(vue.y0 / AIR_TUILE), j1 = Math.ceil(vue.y1 / AIR_TUILE);
  /* LE GARDE-FOU DU DÉZOOM. Une vue très large couvre des dizaines de
     tuiles ; à ce niveau l'air ne se lit plus, il ne fait que coûter. */
  if((i1 - i0 + 1) * (j1 - j0 + 1) > 42) return;

  /* Les marges de culling : une bulle en fin de course est 240 unités
     PLUS HAUT que son ancre, donc encore à l'écran alors que son point
     d'attache n'y est plus. Une marge trop courte les fait clignoter
     au bord de l'écran. */
  var mx = 90, mhaut = AIR_BULLE_H + 120, mbas = 60;
  var n = 0, k, e, x, y, u, a;

  c.save();
  c.globalCompositeOperation = "lighter";

  for(var ti = i0; ti <= i1; ti++){
    for(var tj = j0; tj <= j1; tj++){
      var ox = ti * AIR_TUILE, oy = tj * AIR_TUILE;
      /* DÉCORRÉLER LES TUILES. Répéter le même motif tel quel se voit
         tout de suite : l'œil trouve la grille en une seconde. On
         décale donc le contenu de chaque tuile d'un quart de pas, EN
         REBOUCLANT dans la tuile — un décalage sans rebouclage
         laisserait une bande de plan vide à chaque couture. Seize
         arrangements suffisent : au-delà, on décale des grains dont
         personne ne cherche plus la grille. */
      var dx = (((ti * 3 + tj * 5) % 4) + 4) % 4 * (AIR_TUILE / 4);
      var dy = (((ti * 5 + tj * 2) % 4) + 4) % 4 * (AIR_TUILE / 4);
      /* et un décalage de PHASE, sinon toutes les tuiles scintillent
         et montent ensemble : le champ battrait la mesure. */
      var dph = ((((ti * 13 + tj * 7) % 16) + 16) % 16) * 0.3927;

      /* ---- la poussière d'étoile ---- */
      if(z >= AIR_Z_GRAIN){
        for(k = 0; k < AIR_N_GRAIN; k++){
          e = AIR_CHAMP.grains[k];
          if(e.c !== couche) continue;
          x = ox + (e.x + dx) % AIR_TUILE;
          y = oy + (e.y + dy) % AIR_TUILE;
          if(x < vue.x0 - mx || x > vue.x1 + mx ||
             y < vue.y0 - mhaut || y > vue.y1 + mbas) continue;
          a = tps * e.vit + e.ph + dph;
          var gy2 = y - e.hh + Math.sin(a) * e.amp;
          var gx2 = x + Math.cos(a * 0.63) * e.amp * 0.8;
          /* le scintillement ne descend jamais à zéro : un grain qui
             s'éteint tout à fait clignote, il ne respire pas */
          var sc = 0.34 + 0.66 * (0.5 + 0.5 * Math.sin(a * 2.1 + e.ph));
          c.globalAlpha = sc * 0.62;
          c.drawImage(SP.grain[e.t], gx2 - e.r, gy2 - e.r, e.r * 2, e.r * 2);
          if(++n > AIR_PLAFOND){ c.restore(); return; }
        }
      }

      /* ---- les étoiles flottantes ---- */
      for(k = 0; k < AIR_N_ETOILE; k++){
        e = AIR_CHAMP.etoiles[k];
        if(e.c !== couche) continue;
        x = ox + (e.x + dx) % AIR_TUILE;
        y = oy + (e.y + dy) % AIR_TUILE;
        if(x < vue.x0 - mx || x > vue.x1 + mx ||
           y < vue.y0 - mhaut || y > vue.y1 + mbas) continue;
        /* la course : u va de 0 à 1 et reboucle. La montée est LENTE —
           une étoile met une quinzaine de secondes à faire son
           chemin —, c'est ce qui la sépare d'une étincelle. */
        u = (tps * e.mont + e.ph + dph * 0.16) % 1;
        var ey = y - 12 - u * AIR_MONTEE;
        var ex = x + Math.sin(u * 9.4 + e.ph * 6.2832) * e.bal;
        /* elle s'allume en partant et s'éteint en haut : sans ça, une
           étoile réapparaît d'un coup en bas de sa course */
        var fdu = Math.sin(u * 3.1416);
        var sci = 0.55 + 0.45 * Math.sin(tps * e.scin + e.ph * 6.2832);
        var r2 = e.r * (0.72 + 0.28 * sci);
        c.globalAlpha = fdu * fdu * (0.42 + 0.42 * sci);
        c.save();
        c.translate(ex, ey);
        c.rotate(e.ph * 6.2832 + u * 1.9);
        c.drawImage(SP.etoile[e.t], -r2 * 2.2, -r2 * 2.2, r2 * 4.4, r2 * 4.4);
        c.restore();
        if(++n > AIR_PLAFOND){ c.restore(); return; }
      }

      /* ---- les bulles magiques ---- */
      if(couche === 1 && z >= AIR_Z_BULLE){
        for(k = 0; k < AIR_N_BULLE; k++){
          e = AIR_CHAMP.bulles[k];
          x = ox + (e.x + dx) % AIR_TUILE;
          y = oy + (e.y + dy) % AIR_TUILE;
          if(x < vue.x0 - mx || x > vue.x1 + mx ||
             y < vue.y0 - mhaut || y > vue.y1 + mbas) continue;
          u = ((tps / e.duree) + e.ph + dph * 0.1) % 1;
          bulleAir(c, SP, e, x, y, u, tps);
          if(++n > AIR_PLAFOND){ c.restore(); return; }
        }
      }

      /* ---- les papillons géants ---- */
      if(couche === 1 && z >= AIR_Z_PAPILLON){
        for(k = 0; k < AIR_N_PAPILLON; k++){
          e = AIR_CHAMP.papillons[k];
          x = ox + (e.x + dx) % AIR_TUILE;
          y = oy + (e.y + dy) % AIR_TUILE;
          if(x < vue.x0 - mx || x > vue.x1 + mx ||
             y < vue.y0 - mhaut || y > vue.y1 + mbas) continue;
          /* ILS NE VOLENT PAS AU-DESSUS DE LA MER. Un papillon posé
             au milieu de l'eau ne se lit pas comme un animal, il se
             lit comme un bug. La ronde fait au plus 72 unités de
             rayon : tester l'ancre suffit largement. */
          var gp = deIso(x, y);
          if(gp.gx < 2 || gp.gx > GW - 2 || gp.gy < 2 || gp.gy > GH - 2) continue;
          papillonAir(c, SP, e, x, y, tps + dph);
          if(++n > AIR_PLAFOND){ c.restore(); return; }
        }
      }
    }
  }
  c.restore();
}

/* ----------------------------------------------------------------
   UNE BULLE, DE SA NAISSANCE À SON ÉCLATEMENT

   Quatre-vingt-huit pour cent de sa vie à monter, puis l'éclat. Ce
   ratio est le sujet : une bulle qui passe un cinquième de son temps
   à éclater n'est plus une bulle qui monte, c'est un feu d'artifice.
   ---------------------------------------------------------------- */
var AIR_ECLAT = 0.88;
function bulleAir(c, SP, e, x, y, u, tps){
  var bx = x + Math.sin(u * 7.6 + e.tour) * e.bal;
  var by = y - 10 - u * AIR_BULLE_H;
  if(u < AIR_ECLAT){
    var m = u / AIR_ECLAT;
    /* elle grossit un peu en montant — la pression tombe */
    var r = e.r * (0.82 + m * 0.30);
    /* entrée franche, sortie nulle : elle ne s'efface pas, elle éclate */
    var a = Math.min(1, m * 9) * (0.52 + 0.30 * Math.sin(tps * 1.7 + e.tour));
    c.globalAlpha = Math.max(0, a);
    c.save();
    c.translate(bx, by);
    /* l'écrasement isométrique, très léger : une bulle reste ronde,
       mais elle n'est pas tout à fait de face */
    c.scale(1, 0.94);
    c.rotate(e.tour + Math.sin(tps * 0.5 + e.tour) * 0.35);
    c.drawImage(SP.bulle, -r, -r, r * 2, r * 2);
    c.restore();
  }else{
    /* L'ÉCLAT : l'anneau s'ouvre en un dixième de seconde de vie et
       six éclats partent en étoile. Rien de plus — une bulle qui
       éclate en trente morceaux fait une explosion. */
    var p = (u - AIR_ECLAT) / (1 - AIR_ECLAT);
    var ra = e.r * (1.05 + p * 1.7);
    var ae = (1 - p) * (1 - p);
    c.globalAlpha = ae * 0.62;
    c.save();
    c.translate(bx, by); c.scale(1, 0.94);
    c.drawImage(SP.bulle, -ra, -ra, ra * 2, ra * 2);
    c.restore();
    var re = e.r * (0.9 + p * 2.6), rg = e.r * 0.26 * (1 - p * 0.5);
    c.globalAlpha = ae * 0.8;
    for(var q = 0; q < 6; q++){
      var an = e.tour + q * 1.0472;
      var ex = bx + Math.cos(an) * re, ey = by + Math.sin(an) * re * 0.9;
      c.drawImage(SP.grain[e.t], ex - rg * 2, ey - rg * 2, rg * 4, rg * 4);
    }
  }
}

/* ----------------------------------------------------------------
   UN PAPILLON GÉANT

   Il tourne autour de son point d'attache, monte et descend, et bat
   des ailes. Le battement est un ÉCRASEMENT HORIZONTAL, pas une
   rotation : une aile vue de trois quarts se referme vers son corps,
   elle ne pivote pas dans le plan de l'écran. Le corps ne bat pas, ce
   qui suffit à faire lire les ailes comme des ailes.

   Deux paires : les postérieures d'abord, plus sombres et décalées
   vers le bas, les antérieures par-dessus. Une seule paire donne un
   nœud papillon.
   ---------------------------------------------------------------- */
function papillonAir(c, SP, e, x, y, tps){
  var a = tps * e.vit * 6.2832 + e.ph;
  var px = x + Math.cos(a) * e.ray;
  var py = y - e.hh + Math.sin(a * 0.83 + e.ph) * e.ray * 0.30
             + Math.sin(a * 2.3) * 5;
  /* le battement : rapide, et jamais tout à fait fermé */
  var bat = 0.28 + 0.72 * (0.5 + 0.5 * Math.sin(tps * 7.4 + e.ph));
  /* il s'incline dans le sens de sa course */
  var inc = -Math.sin(a) * 0.34;
  var s = e.ech * 1.6;
  var col = AIR_TEINTES[e.t];

  /* sa lueur, sous lui : un papillon lumineux qui n'éclaire rien
     autour de lui n'est pas lumineux, il est colorié */
  c.globalAlpha = 0.30;
  var rl = 26 * s;
  c.drawImage(SP.grain[e.t], px - rl, py - rl, rl * 2, rl * 2);

  c.save();
  c.translate(px, py);
  c.rotate(inc);
  c.scale(s, s);
  c.globalAlpha = 0.9;

  /* les postérieures */
  aileAir(c, -1, bat, 8.5, 11, 3.5, 7.5, col, 0.34);
  aileAir(c,  1, bat, 8.5, 11, 3.5, 7.5, col, 0.34);
  /* les antérieures */
  aileAir(c, -1, bat, 13.5, 8.5, -1, -3.5, col, 0.62);
  aileAir(c,  1, bat, 13.5, 8.5, -1, -3.5, col, 0.62);

  /* le corps, et les deux antennes qui finissent en perle */
  c.globalAlpha = 0.85;
  c.fillStyle = "rgba(255,244,214,.85)";
  c.beginPath(); c.ellipse(0, 1, 1.5, 6.5, 0, 0, 6.2832); c.fill();
  c.strokeStyle = "rgba(255,236,190,.55)"; c.lineWidth = 0.6;
  c.beginPath();
  c.moveTo(-0.6, -5); c.quadraticCurveTo(-3.5, -9.5, -5.2, -11.5);
  c.moveTo(0.6, -5);  c.quadraticCurveTo(3.5, -9.5, 5.2, -11.5);
  c.stroke();
  c.fillStyle = "rgba(255,255,235,.8)";
  c.beginPath(); c.arc(-5.2, -11.5, 0.9, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(5.2, -11.5, 0.9, 0, 6.2832); c.fill();
  c.restore();
}
/* Une aile : une ellipse écrasée par le battement, un liseré, et deux
   ocelles — les taches rondes qui font qu'on lit un papillon et non
   un pétale. */
function aileAir(c, cote, bat, rx, ry, dx, dy, col, force){
  c.save();
  c.translate(cote * 1.2, dy);
  c.scale(cote * bat, 1);
  c.globalAlpha = force;
  var g = c.createLinearGradient(0, -ry, rx * 1.1, ry);
  g.addColorStop(0, rgba(col, 0.95));
  g.addColorStop(0.55, rgba(col, 0.5));
  g.addColorStop(1, rgba("255,255,255", 0.30));
  c.fillStyle = g;
  c.beginPath(); c.ellipse(rx * 0.62 + dx * 0.3, 0, rx, ry, -0.22, 0, 6.2832); c.fill();
  c.strokeStyle = "rgba(255,232,178,.55)"; c.lineWidth = 0.55;
  c.stroke();
  c.globalAlpha = force * 0.9;
  c.fillStyle = "rgba(255,246,214,.7)";
  c.beginPath(); c.arc(rx * 0.95, -ry * 0.18, ry * 0.19, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(255,255,255,.45)";
  c.beginPath(); c.arc(rx * 0.55, ry * 0.34, ry * 0.12, 0, 6.2832); c.fill();
  c.restore();
}
