/* ================================================================
   GEYSERS DE FEU — l'exclusivité de « Mily dans la jungle »
   ----------------------------------------------------------------
   Ce ne sont pas des volcans : ce sont de petites bouches dans la
   terre noire, qui dorment presque tout le temps et qui, de loin en
   loin, crachent une colonne de feu de trois mètres.

   Deux choses comptent plus que tout le reste dans ce fichier :

   1. LA BOUCHE ENDORMIE DOIT SE VOIR. Un geyser qui ne se signale
      pas est un piège déloyal : le joueur y plante ses troupes et se
      fait punir sans avoir rien pu lire. La lèvre de roche brûlée,
      les fêlures qui rayonnent et la braise qui respire au fond sont
      là pour ça — reconnaissables au premier coup d'œil, discrètes
      au point de ne pas voler la vedette au reste de la carte.

   2. LA COLONNE DOIT ÊTRE CHASSÉE, PAS ALLUMÉE. Une colonne qui
      grandit, c'est une bougie qu'on monte ; une colonne dont le
      front part à pleine vitesse, plafonne en deux dixièmes de
      seconde et laisse filer au-dessus de lui une masse de gaz qui
      retombe, c'est un geyser. Toute la courbe de geyFront() /
      geySlug() ne sert qu'à ça.

   Ce fichier contient aussi la VIGNETTE ANIMÉE de la carte pour le
   menu principal (dessineVignetteJungle) : elle réutilise la même
   colonne de feu, pour que l'affiche promette exactement ce que la
   carte tient.

   Points d'entrée fournis en plus du contrat (voir le rapport) :
     GEY_DUREE, nouveauGeyser(), majGeyser(), geyCycle(),
     semeGeysers(), dessineVignetteJungle().
   ================================================================ */

/* ----------------------------------------------------------------
   Cotes et minutages
   ---------------------------------------------------------------- */

/* Durées de référence des phases, en secondes. Le minutage appartient
   au jeu, mais le DESSIN doit savoir où il en est dans sa phase :
   sans durée connue, impossible de faire retomber un front
   d'éruption au bon moment. Le jeu peut les modifier ici, tout
   suivra. */
var GEY_DUREE = { monte:0.80, feu:1.75, fume:2.20 };

var GEY_H    = 120;   // hauteur de régime de la colonne : 3 cases = 3 m
var GEY_SLUG = 142;   // le bouchon de gaz dépasse la colonne — le coup de bélier
var GEY_TSLUG = 0.22; // instant (en part de la phase « feu ») du sommet du bouchon
var GEY_LARG = 18;    // demi-largeur de la colonne au ras du sol
var GEY_G    = 560;   // pesanteur des braises, en unités locales par seconde²

/* ----------------------------------------------------------------
   Machine à phases — le jeu peut s'en servir ou faire la sienne
   ---------------------------------------------------------------- */

/* Repos minimal entre deux éruptions. C'est le garde-fou du « pas un
   terrain entièrement rempli de flammes » : le cycle actif dure 4,75 s,
   donc à vingt-deux bouches et vingt-deux secondes de repos minimum,
   trois crachent en moyenne au même instant — spectaculaire, jamais
   un mur de feu. Un repos de sept secondes en aurait allumé neuf. */
var GEY_REPOS_MIN = 22;

/* Un geyser neuf. `sommeil` est l'ÉCART ajouté au repos minimal, en
   secondes : c'est lui qui règle la dispersion des horloges. Deux
   bouches voisines ne doivent jamais souffler ensemble, sans quoi la
   carte battrait comme un métronome ; l'instant de départ est donc
   tiré au hasard dans le cycle, à partir de la position, et jamais
   remis à zéro. */
function nouveauGeyser(gx, gy, sommeil){
  var al = prng(geyGraine({ gx:gx, gy:gy }));
  var s = GEY_REPOS_MIN + (sommeil > 0 ? sommeil : al() * 26);
  return { gx:gx, gy:gy, phase:"dort", t:al() * s, sommeil:s };
}

/* Avance un geyser d'un pas de temps. Enchaînement fixe :
   dort → monte → feu → fume → dort. */
function majGeyser(g, dt){
  g.t += dt;
  var d = (g.phase === "dort") ? (g.sommeil || 12) : GEY_DUREE[g.phase];
  if(g.t < d) return;
  g.t -= d;
  g.phase = g.phase === "dort" ? "monte"
          : g.phase === "monte" ? "feu"
          : g.phase === "feu" ? "fume" : "dort";
}

/* La même chose sans état : à quel moment du cycle est-on à l'instant
   `temps` ? Sert à la vignette du menu, qui n'a pas de simulation, et
   à tout banc d'essai qui veut balayer le cycle entier. */
function geyCycle(temps, periode, decalage){
  var actif = GEY_DUREE.monte + GEY_DUREE.feu + GEY_DUREE.fume;
  var per = Math.max(periode || 12, actif + 0.5);
  var p = ((temps + (decalage || 0)) % per + per) % per;
  var dort = per - actif;
  if(p < dort) return { phase:"dort", t:p };
  p -= dort;
  if(p < GEY_DUREE.monte) return { phase:"monte", t:p };
  p -= GEY_DUREE.monte;
  if(p < GEY_DUREE.feu) return { phase:"feu", t:p };
  return { phase:"fume", t:p - GEY_DUREE.feu };
}

/* Répartition. Le cahier des charges demande « intelligemment dans
   certaines zones », pas « uniformément partout » : on tire donc
   quelques FOYERS (des zones), et on groupe les bouches autour d'eux.
   Le résultat se lit comme une géologie — des champs de fumerolles —
   au lieu d'un semis régulier qui aurait l'air d'un champ de mines.
   `libre(gx,gy)` est fourni par l'appelant : lui seul sait ce qu'il y
   a sur la case. */
function semeGeysers(n, graine, libre, bornes){
  var al = prng(graine >>> 0 || 0x6ea5);
  var b = bornes || { x0:8, y0:8, x1:120, y1:120 };
  var nf = Math.max(2, Math.round(n / 4));   // ~4 bouches par champ
  var foyers = [], i, k;
  for(i = 0; i < nf; i++){
    foyers.push({ x:b.x0 + al() * (b.x1 - b.x0), y:b.y0 + al() * (b.y1 - b.y0),
                  r:5 + al() * 7 });
  }
  var liste = [];
  var essais = n * 40;
  while(liste.length < n && essais-- > 0){
    var f = foyers[(al() * nf) | 0];
    var a = al() * 6.2832, rr = Math.sqrt(al()) * f.r;
    var gx = Math.round(f.x + Math.cos(a) * rr);
    var gy = Math.round(f.y + Math.sin(a) * rr);
    if(gx < b.x0 || gy < b.y0 || gx > b.x1 || gy > b.y1) continue;
    if(libre && !libre(gx, gy)) continue;
    /* deux bouches collées se lisent comme une seule grosse : on les
       espace d'au moins deux cases */
    var trop = 0;
    for(k = 0; k < liste.length; k++){
      if(Math.abs(liste[k].gx - gx) < 2 && Math.abs(liste[k].gy - gy) < 2){ trop = 1; break; }
    }
    if(trop) continue;
    liste.push(nouveauGeyser(gx, gy));
  }
  return liste;
}

/* ----------------------------------------------------------------
   Graines et tables — tout ce qui doit être stable d'une image à
   l'autre est tiré ici UNE fois, jamais par Math.random().
   ---------------------------------------------------------------- */

function geyGraine(g){
  /* Graine tirée de la position : deux bouches voisines n'ont ni la
     même lèvre ni le même souffle, mais la même bouche garde les
     siens d'une image à l'autre. */
  return ((((g.gx * 733.1 + g.gy * 419.7) | 0) ^ 0x6e59) >>> 0) || 1;
}

/* Braises éjectées. Chacune a son instant de départ, sa vitesse et sa
   dérive : la table est tirée une fois pour toutes, et l'éruption ne
   coûte plus qu'une parabole par braise. `te` est biaisé vers le
   début (al au carré) parce qu'un geyser crache surtout au coup de
   bélier, puis se calme. Les vitesses sont calées pour que la braise
   la plus rapide culmine SOUS le sommet de la colonne : des braises
   qui montent plus haut que le feu, ce ne sont plus des braises, ce
   sont des lucioles. */
var GEY_BRAISES = (function(){
  var al = prng(0xb1a5e), t = [], i, u;
  for(i = 0; i < 26; i++){
    u = al();
    t.push({ te:u * u * 0.95,
             vx:(al() - 0.5) * 130,
             vy:130 + al() * 200,          // culmine entre 15 et 96 unités
             s:0.7 + al() * 1.6,
             d:al() });
  }
  return t;
})();

/* Bouffées de fumée : position d'émission, dérive, vitesse, taille. */
var GEY_FUMEES = (function(){
  var al = prng(0xf00e3), t = [], i;
  for(i = 0; i < 12; i++){
    t.push({ ph:al(), dx:(al() - 0.5) * 30, v:24 + al() * 34,
             r:8 + al() * 14, ton:al(), tour:(al() - 0.5) * 1.4 });
  }
  return t;
})();

/* ----------------------------------------------------------------
   La bouche — sprite pré-rendu
   Elle ne bouge JAMAIS : la graver une fois et la poser d'un
   drawImage rend la phase « dort » quasi gratuite, ce qui compte
   quand vingt bouches dorment en même temps à l'écran.
   Trois variantes suffisent à casser la répétition ; le sprite est
   gravé au double de la taille pour rester net au zoom maximal.
   ---------------------------------------------------------------- */
var GEY_SP_E = 2;                                   // finesse de gravure
var GEY_SP_W = 132, GEY_SP_H = 92;                  // en pixels de sprite
var GEY_SP_OX = 66, GEY_SP_OY = 54;
var geySpBouche = null;    // la bouche entière
var geySpLevre = null;     // la seule lèvre AVANT, repassée par-dessus la flamme
/* fenêtre utile du sprite de lèvre, en pixels de sprite */
var GEY_LV_SX = 14, GEY_LV_SY = 34, GEY_LV_SW = 104, GEY_LV_SH = 40;
var geyFelures = null;     // géométrie des fêlures, réutilisée pour le trait chaud

/* La bouche n'est pas un cratère rond : c'est une FENTE. Un anneau de
   cailloux se lit comme un feu de camp ou, pire, comme une araignée
   quand des fêlures en rayonnent — les deux ont été essayés et les
   deux ratent. Une lentille pointue aux deux bouts, elle, se lit comme
   une fissure du premier coup d'œil et tient dans une case. */
var GEY_MW = 15.5, GEY_MH = 5.0;      // demi-largeur / demi-hauteur de la fente

/* Contour de la fente : une ellipse dont les extrémités sont étirées
   en pointe (l'exposant sur |sin|), plus un peu d'irrégularité. */
function geyContourFente(al, ex, ey, bruit){
  var pts = [], i, a, s, r;
  for(i = 0; i < 18; i++){
    a = i / 18 * 6.2832;
    s = Math.sin(a);
    r = 1 + (al() - 0.5) * bruit;
    pts.push([Math.cos(a) * ex * r,
              (s < 0 ? -1 : 1) * Math.pow(Math.abs(s), 0.55) * ey * r]);
  }
  return pts;
}
function geyTrace(c, pts){
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for(var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.closePath();
}

function geyConstruitBouches(){
  geySpBouche = []; geySpLevre = []; geyFelures = [];
  for(var v = 0; v < 3; v++){
    var al = prng(0x9e17 + v * 7919);
    var cvA = nouveauCanvas(GEY_SP_W, GEY_SP_H);
    var cvB = nouveauCanvas(GEY_SP_W, GEY_SP_H);
    var A = cvA.getContext("2d"), B = cvB.getContext("2d");
    A.setTransform(GEY_SP_E, 0, 0, GEY_SP_E, GEY_SP_OX, GEY_SP_OY);
    B.setTransform(GEY_SP_E, 0, 0, GEY_SP_E, GEY_SP_OX, GEY_SP_OY);

    var i, k, a, r, pts;
    var mw = GEY_MW * (0.9 + al() * 0.25), mh = GEY_MH * (0.85 + al() * 0.3);

    /* 1. la terre brûlée autour. La jungle est presque noire : sans
       cette tache plus chaude, la fente disparaît dans le sol. Elle
       est volontairement étirée dans le même sens que la fente. */
    A.fillStyle = "rgba(26,15,8,.50)";
    geyTrace(A, geyContourFente(al, mw * 2.3, mh * 3.0, 0.34)); A.fill();
    A.fillStyle = "#2a1c0d";
    geyTrace(A, geyContourFente(al, mw * 1.55, mh * 2.0, 0.28)); A.fill();
    /* cendres claires : une bordure ténue qui détache la tache du sol */
    A.strokeStyle = "rgba(146,128,96,.22)"; A.lineWidth = 1.2;
    geyTrace(A, geyContourFente(al, mw * 1.62, mh * 2.1, 0.30)); A.stroke();

    /* 2. les fêlures. COURTES et fines : trois griffures qui prolongent
       les pointes de la fente. Longues, elles faisaient des pattes
       d'araignée et la bouche cessait d'être une bouche. */
    var fel = [];
    for(i = 0; i < 3; i++){
      var sens = i === 1 ? -1 : 1;
      var dep = [sens * mw * 0.92, (al() - 0.5) * mh * 0.8];
      var dir = sens * (0.55 + al() * 0.6);
      var pp = [dep];
      var lx = dep[0], ly = dep[1];
      for(k = 0; k < 2; k++){
        lx += sens * (5 + al() * 6);
        ly += (al() - 0.5) * 5 + (i === 2 ? 3 : -1);
        pp.push([lx, ly]);
      }
      fel.push(pp);
    }
    geyFelures.push(fel);
    A.strokeStyle = "#0c0705"; A.lineCap = "round"; A.lineJoin = "round";
    A.lineWidth = 1.5;
    A.beginPath();
    for(i = 0; i < fel.length; i++){
      A.moveTo(fel[i][0][0], fel[i][0][1]);
      for(k = 1; k < fel[i].length; k++) A.lineTo(fel[i][k][0], fel[i][k][1]);
    }
    A.stroke();

    /* 3. la fente elle-même. Presque noire : c'est le contraste avec
       la croûte claire qui creuse, pas un dégradé. */
    pts = geyContourFente(al, mw, mh, 0.20);
    A.fillStyle = "#0a0605";
    geyTrace(A, pts); A.fill();

    /* 4. la croûte. Le bord LOIN reçoit la lumière (haut-gauche) : un
       liseré clair. Le bord PRÈS est soulevé en écailles de roche
       vitrifiée — c'est ce relief-là qui dit « ça s'est ouvert »
       plutôt que « c'est peint sur le sol ». Les écailles proches sont
       recopiées dans le sprite de lèvre : repassées APRÈS la flamme,
       elles la font sortir du trou. */
    A.strokeStyle = "rgba(178,158,128,.34)"; A.lineWidth = 1.3;
    A.beginPath();
    A.moveTo(pts[9][0], pts[9][1]);
    for(i = 10; i < 18; i++) A.lineTo(pts[i][0], pts[i][1]);
    A.stroke();
    var ne = 5;
    for(i = 0; i < ne; i++){
      a = 0.30 + (i + 0.5) / ne * 2.54;                 // seulement l'arc proche
      var ex = Math.cos(a) * mw * 1.06;
      var ey = Math.pow(Math.abs(Math.sin(a)), 0.55) * mh * 1.06;
      var l = 2.6 + al() * 2.6, hh = 2.2 + al() * 3.0;
      var base = al() > 0.5 ? "#463c33" : "#332a24";
      geyEcaille(A, ex, ey, l, hh, base);
      geyEcaille(B, ex, ey, l, hh, base);
    }
    geySpBouche.push(cvA);
    geySpLevre.push(cvB);
  }
}

/* Une écaille de roche vitrifiée, soulevée par la pression : un éclat
   penché, dessus éclairé et flanc dans l'ombre — lumière en haut à
   gauche, comme partout ailleurs dans le jeu. */
function geyEcaille(c, x, y, l, h, base){
  c.fillStyle = ecl(base, 0.40);
  c.beginPath();
  c.moveTo(x - l, y);
  c.lineTo(x + l, y);
  c.lineTo(x + l * 0.35, y - h);
  c.lineTo(x - l * 0.72, y - h * 0.72);
  c.closePath(); c.fill();
  c.fillStyle = ecl(base, 1.22);
  c.beginPath();
  c.moveTo(x - l * 0.72, y - h * 0.72);
  c.lineTo(x + l * 0.35, y - h);
  c.lineTo(x + l * 0.10, y - h * 1.12);
  c.lineTo(x - l * 0.86, y - h * 0.86);
  c.closePath(); c.fill();
}

/* ================================================================
   RÈGLE D'ÉTAT DU CONTEXTE, valable pour tout ce qui suit
   ----------------------------------------------------------------
   dessineGeyser() tient UN SEUL save/restore pour tout le geyser, et
   les fonctions ci-dessous écrivent librement dans globalAlpha,
   globalCompositeOperation, fillStyle et strokeStyle sans jamais
   empiler leur propre save/restore.

   Ce n'est pas de la coquetterie : le profileur a montré qu'à cette
   taille de dessin, le coût est dans le NOMBRE d'appels canvas, pas
   dans les pixels. La lueur du sol couvre six mille pixels et coûtait
   autant que la colonne entière, parce qu'elle valait un save, un
   changement de mode, un drawImage et un restore. Huit paires de
   save/restore imbriquées valaient à elles seules un cinquième du
   budget de l'éruption. Elles ont disparu.
   ================================================================ */

/* Fumée — disque fondu pré-rendu par teinte.
   bouffee() empile trois disques pleins (bords durs) et bouffeeFloue()
   fabrique trois dégradés PAR APPEL : à vingt geysers et six bouffées
   chacun, ce serait trois cent soixante dégradés par image. On grave
   donc un disque fondu une seule fois par teinte et on le pose.
   Le contexte doit être en "source-over" à l'appel. */
var geySpFumee = {};
function geyBouffee(c, x, y, r, a, coul, ecrase){
  if(!(a > 0.006) || r <= 0.5) return;
  var s = geySpFumee[coul];
  if(!s){
    s = nouveauCanvas(64, 64);
    var q = s.getContext("2d");
    var gr = q.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, rgba(coul, 0.92));
    gr.addColorStop(0.42, rgba(coul, 0.46));
    gr.addColorStop(1, rgba(coul, 0));
    q.fillStyle = gr; q.fillRect(0, 0, 64, 64);
    geySpFumee[coul] = s;
  }
  var e = ecrase === undefined ? 1 : ecrase;
  c.globalAlpha = a > 1 ? 1 : a;
  c.drawImage(s, x - r, y - r * e, r * 2, r * 2 * e);
}

/* Lueur additive ELLIPTIQUE, posée sans save/restore.
   spLueur est le cache partagé de 20-outils.js : on ne fabrique aucun
   dégradé, on réutilise exactement le même sprite que lueurRapide().
   L'intérêt d'avoir rx et ry séparés est double — la lumière au sol
   d'un geyser est un ovale isométrique, et le halo de la colonne est
   deux fois plus haut que large. Un disque de même hauteur
   mélangerait deux fois et demie plus de pixels pour un résultat
   moins juste. Le contexte doit être en "lighter" à l'appel. */
function geyLueur(c, x, y, rx, ry, coul, a){
  if(!(a > 0.004) || !(rx > 0) || !(ry > 0)) return;
  var s = spLueur[coul];
  /* première utilisation de cette teinte : lueurRapide grave le sprite
     dans le cache commun (et dessine, à peu près juste, pour cette
     image-là seulement) */
  if(!s){ lueurRapide(c, x, y, (rx + ry) / 2, coul, a); return; }
  c.globalAlpha = a > 1 ? 1 : a;
  c.drawImage(s, x - rx, y - ry, rx * 2, ry * 2);
}

/* ----------------------------------------------------------------
   LA COLONNE
   ---------------------------------------------------------------- */

/* Quatre langues emboîtées, mêmes teintes que flamme() dans
   20-outils.js : le geyser doit être un COUSIN du feu du Brasier, pas
   une autre famille de feu. La plus rouge est la plus haute et la
   plus large, la blanche ne tient que le bas — c'est ainsi qu'un feu
   refroidit en montant. */
var GEY_COUCHES = [
  { c:"#ff3208", a:0.44, s:1.00, w:1.00 },
  { c:"#ff8a1e", a:0.52, s:0.79, w:0.70 },
  { c:"#ffd464", a:0.58, s:0.51, w:0.44 },
  { c:"#fff8dc", a:0.56, s:0.27, w:0.25 }
];

/* UNE COLONNE, PAS UNE BOUGIE. Le premier essai s'effilait en pointe
   dès la mi-hauteur : à trois mètres de haut, ça donnait une flamme de
   briquet géante. Ici la largeur tient jusqu'aux deux tiers — c'est ce
   qui fait la colonne — et ne se déchire qu'en haut, là où le jet
   perd sa cohésion. */
function geyProfil(v){
  return (0.86 + 0.36 * Math.sin(v * 2.3)) * (1 - v * v * v * 0.90);
}

/* Le signe MOINS devant v est tout le secret de l'effet : la crête de
   l'ondulation remonte le long de la colonne au fil du temps, et l'œil
   lit de la matière qui MONTE au lieu d'un drapeau qui claque.
   L'amplitude est nulle à la bouche — le jet y est tenu par la roche —
   et s'emballe au sommet, où il fouette. */
function geyOnde(v, t, i){
  var amp = 1.0 + 12.0 * v * v;
  return amp * (Math.sin(t * 8.2 - v * 5.4 + i * 1.7)
              + 0.5 * Math.sin(t * 13.7 - v * 9.3 + i * 2.9));
}

/* Le contexte doit être en "lighter" et globalAlpha à 1 à l'appel. */
function geyColonne(c, h, t, ech, att){
  if(h <= 2) return;
  var K = 8, i, k, v, y, dx, dw, L, hi;
  for(i = 0; i < 4; i++){
    L = GEY_COUCHES[i];
    hi = h * L.s * (0.93 + 0.07 * Math.sin(t * 15 + i * 2.1));
    c.fillStyle = rgba(L.c, L.a * att);
    c.beginPath();
    for(k = 0; k <= K; k++){                       // bord gauche, en montant
      v = k / K; y = -hi * v;
      dx = geyOnde(v, t, i) * ech;
      dw = GEY_LARG * L.w * geyProfil(v) * ech;
      if(k === 0) c.moveTo(dx - dw, y); else c.lineTo(dx - dw, y);
    }
    for(k = K; k >= 0; k--){                       // bord droit, en redescendant
      v = k / K; y = -hi * v;
      dx = geyOnde(v, t, i) * ech;
      dw = GEY_LARG * L.w * geyProfil(v) * ech;
      c.lineTo(dx + dw, y);
    }
    c.closePath(); c.fill();
  }
}

/* Les langues qui débordent de la colonne. Une colonne qui se termine
   en pointe unique a l'air d'un pinceau ; un vrai jet se déchire.

   Deux langues, DEUX COUCHES chacune — et c'est la deuxième couche qui
   compte. En mode « lighter » sur un fond sombre, un aplat orange à
   demi-opacité ne donne pas du feu pâle, il donne du KAKI : les langues
   du premier essai ressemblaient à des pétales d'artichaut posés à côté
   de la flamme. Empilées comme le sont les quatre couches de la
   colonne, elles retrouvent un cœur clair sur un bord rouge, c'est-à-
   dire du feu. Leur pied est en outre PLAQUÉ sur l'ondulation de la
   colonne à la même hauteur : elles en sortent au lieu de flotter à
   côté. */
function geyLangues(c, h, t, ech, att){
  if(h <= 30) return;
  var i, k, lx, ly, lh, lw, dev, e;
  for(i = 0; i < 2; i++){
    dev = Math.sin(t * (4.3 + i * 1.7) + i * 2.1);
    /* les deux langues partent de hauteurs franchement différentes :
       à la même, elles finissaient régulièrement par se répondre en
       symétrie et faire deux oreilles */
    lx = (geyOnde(0.50 + i * 0.20, t, i) + dev * 3.4 + (i ? 4 : -4)) * ech;
    ly = -h * (0.50 + 0.20 * i);
    lh = h * (0.34 + 0.15 * (0.5 + 0.5 * Math.sin(t * (6.1 + i * 2.3) + i)));
    lw = (6.4 - i * 1.3) * ech;
    for(k = 0; k < 2; k++){
      e = k ? 0.52 : 1;                       // la couche chaude est plus fine
      c.fillStyle = rgba(k ? "#ffc14e" : "#ff3208", (k ? 0.56 : 0.64) * att);
      c.beginPath();
      c.moveTo(lx - lw * e, ly);
      c.quadraticCurveTo(lx - lw * 1.4 * e + dev * 3 * ech, ly - lh * e * 0.55,
                         lx + dev * 6 * ech * e, ly - lh * e);
      c.quadraticCurveTo(lx + lw * 1.4 * e + dev * 3 * ech, ly - lh * e * 0.55,
                         lx + lw * e, ly);
      c.closePath(); c.fill();
    }
  }
}

/* LA TÊTE DU JET : une calotte cabossée prolongée vers le bas par une
   traîne qui redescend jusqu'au sommet de la colonne.

   Deux formes ont été essayées avant celle-ci et toutes deux ratent
   pour la même raison. Trois ellipses concentriques donnent un œuf au
   plat. Un polygone fermé, même irrégulier, donne un ballon qui flotte
   à côté du feu — l'œil ne voit plus de la matière EXPULSÉE, il voit
   un objet posé en l'air. Ce qui manquait n'était ni la couleur ni
   l'irrégularité : c'était le LIEN. Ici la tête et la colonne ne font
   qu'une seule silhouette, et l'étranglement s'étire tout seul à
   mesure que la tête prend de l'avance. */
function geyTeteJet(c, x, yt, ybas, r, t, coul, a, dep){
  var i, ang, rr, N = 11;
  c.fillStyle = rgba(coul, a);
  c.beginPath();
  c.moveTo(x - r * 0.46, ybas);                       // pied gauche, dans la colonne
  c.quadraticCurveTo(x - r * 0.84, (yt + ybas) / 2, x - r, yt + r * 0.20);
  for(i = 0; i <= N; i++){                            // la calotte, cabossée
    ang = Math.PI + i / N * Math.PI;
    /* deux fréquences : une seule donnait des dents régulières, donc
       une couronne, donc un objet — pas du feu */
    rr = r * (0.93 + 0.09 * Math.sin(i * 2.7 + t * 3.1 + dep)
                   + 0.07 * Math.sin(i * 1.1 + t * 1.7 + dep * 2));
    c.lineTo(x + Math.cos(ang) * rr, yt + Math.sin(ang) * rr * 1.32 + r * 0.22);
  }
  c.quadraticCurveTo(x + r * 0.84, (yt + ybas) / 2, x + r * 0.46, ybas);
  c.closePath(); c.fill();
}

/* Deux filaments clairs qui remontent DANS la colonne. Ils ne coûtent
   qu'un seul chemin et c'est pourtant eux qui donnent la vitesse :
   sans eux, la colonne ondule sans avoir l'air de couler. */
function geyFilaments(c, h, t, ech, att){
  if(h <= 20) return;
  var s, k, v, x, y;
  c.lineCap = "round";
  c.strokeStyle = rgba("#ffeec0", 0.26 * att);
  c.lineWidth = 1.8 * ech;
  c.beginPath();
  for(s = 0; s < 2; s++){
    for(k = 0; k <= 6; k++){
      v = 0.06 + k / 6 * 0.62;
      x = geyOnde(v, t, s * 3) * ech * 0.75 + (s ? 4 : -4) * ech;
      y = -h * v;
      if(k === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
  }
  c.stroke();
}

/* Le bouchon de gaz. Il part avec le front, monte plus haut que la
   colonne ne pourra jamais tenir, ralentit et retombe dedans. C'est
   lui qui fait dire « ça a été CHASSÉ du sol ». Parabole pure : il
   redescend de lui-même passé son sommet. */
function geySlug(u){
  var a = u / GEY_TSLUG;
  return GEY_SLUG * (2 * a - a * a);
}
/* Effondrement final : le geyser se vide. */
function geyFin(u){
  return u < 0.62 ? 1 : Math.max(0, 1 - Math.pow((u - 0.62) / 0.38, 1.5));
}
/* Le front visible de la colonne.
   Pendant la sortie, il est PLAQUÉ sur le bouchon : la montée est donc
   balistique — vitesse maximale au ras du trou, nulle au sommet. Une
   rampe linéaire ou un ease-in donneraient une colonne qui pousse ;
   celle-ci est expulsée, et le plafond est atteint en moins de deux
   dixièmes de seconde.
   Passé le sommet du bouchon, le front reste au plafond : sans ce
   « return plaf », la parabole redescendante du bouchon éteignait la
   colonne à mi-phase — le bogue de la première version. */
function geyFront(u){
  var plaf = GEY_H * (1 + 0.055 * Math.sin(u * 34)) * geyFin(u);
  if(u < GEY_TSLUG) return Math.max(0, Math.min(geySlug(u), plaf));
  return Math.max(0, plaf);
}

/* ----------------------------------------------------------------
   LE DESSIN
   Le contexte arrive déjà translaté sur versEcran(cam,g.gx,g.gy) et
   mis à l'échelle cam.z : on dessine à l'origine, Y négatif vers le
   haut, exactement comme une défense.

   UN SEUL save/restore pour tout le geyser (voir la règle d'état plus
   haut). En contrepartie, le mode de composition et l'opacité sont
   remis à la main à chaque changement de couche : c'est explicite,
   c'est un peu bavard, et c'est ce qui a fait passer l'éruption sous
   son budget.

   L'opacité d'entrée est respectée : la vignette du menu appelle
   dessineGeyser avec un globalAlpha, et le geyser doit s'y plier.
   ---------------------------------------------------------------- */
function dessineGeyser(c, g, tps){
  if(!geySpBouche) geyConstruitBouches();
  var gr = geyGraine(g);
  var v = gr % 3;
  var ph = (gr % 1000) * 0.0063;              // déphasage propre à la bouche
  var t = g.t || 0;
  var phase = g.phase || "dort";
  /* Niveau de détail : au dézoom de carte, un geyser ne doit plus
     coûter que sa bouche et sa lueur. Rien ne s'y voit à cette taille
     et il peut y en avoir vingt. */
  var z = (typeof cam !== "undefined" && cam && cam.z) ? cam.z : 1;
  var det = z > 0.30, fin = z > 0.55;

  var mw = GEY_MW, mh = GEY_MH;              // demi-cotes de la fente
  var u = 0, i, e, x, y, a, r;

  /* ---- intensité générale de la bouche, par phase ---- */
  var chaud = 0;          // 0..1, la braise au fond de la fente
  var haut = 0;           // hauteur du front, en unités locales
  if(phase === "monte"){
    u = Math.min(1, t / GEY_DUREE.monte);
    chaud = u * u;                                  // la lumière « bout » sur la fin
  }else if(phase === "feu"){
    u = Math.min(1, t / GEY_DUREE.feu);
    haut = geyFront(u);
    chaud = 1;
  }else if(phase === "fume"){
    u = Math.min(1, t / GEY_DUREE.fume);
    chaud = Math.max(0, 1 - u * 1.7);               // la roche refroidit
  }else{
    /* Au repos la braise respire lentement. Elle ne s'éteint jamais
       tout à fait : c'est ce point orange qui prévient le joueur
       qu'une bouche dort là. */
    chaud = 0.13 + 0.07 * Math.sin(tps * 1.35 + ph * 6.28);
  }

  c.save();
  var a0 = c.globalAlpha;                    // opacité voulue par l'appelant

  /* ================= 1. la lumière au sol =================
     Posée AVANT la bouche : elle teinte la terre autour, elle ne bave
     pas sur la roche. Ovale isométrique — deux fois plus large que
     haute, comme toute chose posée à plat dans ce jeu. */
  if(chaud > 0.02){
    c.globalCompositeOperation = "lighter";
    r = 18 + chaud * 38;
    geyLueur(c, 0, -2, r, r * 0.5, "#ff6a14", (0.20 + chaud * 0.54) * a0);
    if(chaud > 0.4){
      r = 11 + chaud * 17;
      geyLueur(c, 0, -2, r, r * 0.5, "#ffd070", chaud * 0.44 * a0);
    }
    c.globalCompositeOperation = "source-over";
  }

  /* ================= 2. la bouche ================= */
  c.globalAlpha = a0;
  c.drawImage(geySpBouche[v], -GEY_SP_OX / GEY_SP_E, -GEY_SP_OY / GEY_SP_E,
              GEY_SP_W / GEY_SP_E, GEY_SP_H / GEY_SP_E);

  /* les fêlures s'allument. Un seul chemin pour toutes les trois. */
  if(fin && chaud > 0.05){
    var fel = geyFelures[v];
    c.lineCap = "round"; c.lineJoin = "round";
    c.strokeStyle = rgba("#ff8420", Math.min(0.85, 0.16 + chaud * 0.7) * a0);
    c.lineWidth = 0.9 + chaud * 1.5;
    c.beginPath();
    for(i = 0; i < fel.length; i++){
      /* elle ne s'allume que sur sa moitié proche de la fente : une
         fêlure éclairée jusqu'au bout ferait un soleil, pas une
         fissure */
      c.moveTo(fel[i][0][0], fel[i][0][1]);
      c.lineTo(fel[i][1][0], fel[i][1][1]);
      if(chaud > 0.5) c.lineTo(fel[i][2][0], fel[i][2][1]);
    }
    c.stroke();
  }

  /* ================= 3. phase MONTE ================= */
  if(phase === "monte"){
    /* la roche de la fente chauffe : on repasse son ovale en
       incandescent, de plus en plus épais */
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = a0;
    c.strokeStyle = rgba("#ff9a2a", 0.25 + u * 0.55);
    c.lineWidth = 1 + u * 3.4;
    c.beginPath(); c.ellipse(0, 0, mw * 0.92, mh * 0.92, 0, 0, 6.2832); c.stroke();

    /* étincelles qui montent en tourbillonnant de la fente, toutes
       dans le même chemin */
    if(det){
      c.fillStyle = "rgba(255,168,70," + (0.55 * a0).toFixed(3) + ")";
      c.beginPath();
      for(i = 0; i < 6; i++){
        var pe = ((tps * 0.85 + i * 0.31 + ph) % 1);
        a = (1 - pe) * u;
        if(a < 0.06) continue;
        x = Math.sin(pe * 7 + i * 2.1) * (3 + pe * 9);
        y = -pe * (14 + u * 22);
        r = (0.8 + (i % 3) * 0.5) * a;
        c.moveTo(x + r, y);
        c.arc(x, y, r, 0, 6.2832);
      }
      c.fill();
    }

    /* des langues courtes commencent à lécher hors de la fente, puis
       s'allongent. Elles restent basses : le jaillissement doit
       surprendre, pas être annoncé par une demi-colonne. */
    if(det && u > 0.35){
      var lu = (u - 0.35) / 0.65;
      c.globalAlpha = 1;
      geyColonne(c, 6 + lu * lu * 20, tps + ph, 0.55 + lu * 0.2,
                 (0.55 + lu * 0.35) * a0);
    }
    /* le cœur de la fente blanchit juste avant la sortie */
    if(u > 0.7){
      var bl = (u - 0.7) / 0.3;
      r = 10 + bl * 26;
      geyLueur(c, 0, -4, r, r * 0.5, "#fff2c8", (0.3 + bl * 0.6) * a0);
    }
    c.globalCompositeOperation = "source-over";

    /* le sol tremble : quelques gravillons sautent sur place. C'est un
       détail minuscule, mais c'est LUI qui annonce que ça va partir —
       une lumière seule ne prévient pas, elle décore. */
    if(fin){
      var saut = Math.abs(Math.sin(tps * 21 + ph));
      c.globalAlpha = a0;
      c.fillStyle = "#3a3028";
      c.beginPath();
      for(i = 0; i < 5; i++){
        a = i * 1.9 + ph;
        x = Math.cos(a) * mw * 1.35;
        y = Math.sin(a) * mh * 1.9 - saut * (1.5 + i % 3) * (0.4 + u);
        c.moveTo(x + 1.6, y);
        c.arc(x, y, 1.5, 0, 6.2832);
      }
      c.fill();
    }
  }

  /* ================= 4. phase FEU ================= */
  if(phase === "feu"){
    var tt = tps + ph;

    /* --- l'anneau de poussière chassé au sol par le coup de bélier ---
       Il ne dure que le temps de la sortie, mais sans lui la colonne a
       l'air posée sur le sol au lieu d'en être sortie. */
    if(u < 0.30){
      var uo = u / 0.30;
      c.globalAlpha = a0;
      c.strokeStyle = "rgba(126,108,88," + ((1 - uo) * 0.42).toFixed(3) + ")";
      c.lineWidth = 1 + (1 - uo) * 3;
      c.beginPath();
      c.ellipse(0, -1, mw * (1 + uo * 2.6), mh * (1.4 + uo * 3.6), 0, 0, 6.2832);
      c.stroke();
      if(det){
        for(i = 0; i < 4; i++){
          a = i * 1.571 + ph;
          r = mw * (0.9 + uo * 2.0);
          geyBouffee(c, Math.cos(a) * r, Math.sin(a) * r * 0.34 - 2 - uo * 5,
                     5 + uo * 12, (1 - uo) * 0.28 * a0, "#6b5a48", 0.55);
        }
      }
    }

    /* --- fumée, DERRIÈRE la colonne --- */
    if(det){
      for(i = 0; i < 3; i++){
        e = GEY_FUMEES[i];
        var pf = ((u * 1.25 + e.ph) % 1);
        /* discrète : pendant l'éruption la fumée n'est qu'un voile
           au-dessus de la flamme. Trop dense, elle salissait le feu et
           lui donnait une couleur de boue. */
        a = (1 - pf) * pf * 3.0 * 0.20 * Math.min(1, u * 4) * a0;
        if(a < 0.012) continue;
        geyBouffee(c, e.dx * (0.3 + pf) + Math.sin(tt * 0.8 + e.ph * 6) * 5 * pf,
                   -haut * (0.86 + e.ph * 0.2) - pf * e.v,
                   Math.min(26, e.r * (0.6 + pf * 1.5)), a,
                   e.ton > 0.6 ? "#4e3f33" : "#332a22", 0.9);
      }
    }

    c.globalCompositeOperation = "lighter";

    /* --- le halo de chaleur : UN seul, et ÉTIRÉ ---
       Un halo par langue de flamme, comme le ferait un empilement de
       flamme(), coûterait cinq grands drawImage additifs — de loin le
       poste le plus cher du dessin. Un seul donc, deux fois plus haut
       que large : la chaleur d'une colonne monte le long de la
       colonne, elle ne fait pas un soleil. */
    geyLueur(c, 0, -haut * 0.45, Math.min(haut * 0.38, 50),
             Math.min(haut * 0.72, 96), "#ff7a18",
             (0.30 + 0.07 * Math.sin(tt * 6)) * a0);

    /* --- la colonne --- */
    c.globalAlpha = 1;
    geyColonne(c, haut, tt, 1, a0);
    if(fin) geyFilaments(c, haut, tt, 1, a0);
    if(det) geyLangues(c, haut, tt, 1, a0);

    /* --- le bouchon de gaz qui file au-dessus ---
       Il n'existe que tant qu'il dépasse le front. Le premier essai en
       faisait trois ellipses concentriques : ça donnait une lune, pas
       du feu. Ici c'est une masse DÉCHIRÉE, reliée à la colonne par un
       col qui s'étire — on voit la matière se séparer. */
    var hs = geySlug(u);
    if(hs > haut + 3 && u < 0.48){
      var av = Math.min(1, (hs - haut) / 24);            // dégagement du front
      var vieil = Math.max(0, 1 - Math.max(0, u - 0.20) / 0.26);
      var ab = av * vieil * a0;
      var rb = 11 + u * 30;
      /* La fumée du bouchon passe D'ABORD : posée après, elle
         recouvrait la masse de feu d'un disque gris et transformait
         la boule incandescente en pompon marron. */
      if(det && vieil < 0.55){
        c.globalCompositeOperation = "source-over";
        geyBouffee(c, Math.sin(tt) * 4, -hs - rb * 0.75,
                   rb * (0.7 + u * 1.1), 0.30 * (0.55 - vieil) * 1.8 * a0,
                   "#443830", 0.92);
        c.globalCompositeOperation = "lighter";
      }
      /* Trois épaisseurs emboîtées, toutes rattachées au sommet de la
         colonne : le rouge dehors, l'orange dedans, le blanc au cœur —
         et le cœur remonte moins haut que l'enveloppe, parce que dans
         un ballon de gaz qui monte le neuf arrive par le dessous et le
         dessus a déjà commencé à refroidir. */
      var ycol = -haut + 6;
      geyTeteJet(c, 0, -hs, ycol, rb, tt, "#ff3808", 0.60 * ab, 0);
      geyTeteJet(c, 1, -hs + rb * 0.20, ycol, rb * 0.68, tt, "#ff9418", 0.58 * ab, 1.7);
      geyTeteJet(c, 0, -hs + rb * 0.42, ycol, rb * 0.34, tt, "#fff0c0", 0.50 * ab, 3.4);
      r = Math.min(rb * 1.7, 44);
      geyLueur(c, 0, -hs, r, r, "#ff9024", 0.30 * ab);
    }
    c.globalCompositeOperation = "source-over";

    /* --- la lèvre repasse devant : la flamme SORT de la fente ---
       Rognée à la boîte des écailles : blitter les 132×92 du sprite
       complet pour recouvrir une bande de vingt pixels de haut, c'est
       cinq fois trop de pixels pour rien. */
    c.globalAlpha = a0;
    c.drawImage(geySpLevre[v], GEY_LV_SX, GEY_LV_SY, GEY_LV_SW, GEY_LV_SH,
                -26, -10, 52, 20);

    /* --- les braises, en dernier et devant tout --- */
    if(det) geyBraises(c, t, 0, z, a0);
  }

  /* ================= 5. phase FUME ================= */
  if(phase === "fume"){
    /* les braises encore en l'air continuent leur parabole : leur âge
       est compté depuis leur éjection dans la phase précédente, sinon
       elles disparaîtraient net au changement de phase */
    if(det) geyBraises(c, GEY_DUREE.feu + t, 1, z, a0);

    /* la colonne finit de s'éteindre en deux ou trois hoquets */
    if(u < 0.22){
      var hu = (1 - u / 0.22);
      c.globalCompositeOperation = "lighter";
      c.globalAlpha = 1;
      geyColonne(c, 30 * hu * hu * (0.7 + 0.3 * Math.sin(tps * 19 + ph)),
                 tps + ph, 0.8, 0.7 * hu * a0);
    }
    /* la roche garde sa couleur de forge un instant */
    if(u < 0.5){
      c.globalCompositeOperation = "lighter";
      c.globalAlpha = a0;
      c.strokeStyle = rgba("#ff7018", (1 - u * 2) * 0.5);
      c.lineWidth = 1.6;
      c.beginPath(); c.ellipse(0, 0, mw * 0.92, mh * 0.92, 0, 0, 6.2832); c.stroke();
    }
    c.globalCompositeOperation = "source-over";

    /* la fumée est le vrai sujet de cette phase : c'est elle qui dit
       que quelque chose vient de se passer ici */
    if(det){
      for(i = 0; i < 7; i++){
        e = GEY_FUMEES[i];
        var pu = u * (0.55 + e.ph * 0.5) + e.ph * 0.35;
        if(pu > 1) continue;
        a = Math.min(1, pu * 5) * (1 - pu) * (1 - pu) * 0.90 * a0;
        geyBouffee(c, e.dx * pu * 1.7 + Math.sin(tps * 0.5 + e.ph * 6.28) * 11 * pu,
                   -8 - pu * (34 + e.v * 1.9),
                   e.r * (0.55 + pu * 2.3), a,
                   e.ton > 0.5 ? "#5c5147" : "#3a322c", 0.95);
      }
    }
  }

  /* ================= 6. au repos ================= */
  if(phase === "dort" && det){
    /* deux braises paresseuses sortent de la fente et meurent
       aussitôt. Un chemin par image : c'est le prix du signal « cette
       fente est vivante ». */
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = a0;
    c.fillStyle = "rgba(255,150,60,.5)";
    c.beginPath();
    for(i = 0; i < 2; i++){
      var pd = ((tps * 0.22 + i * 0.5 + ph) % 1);
      a = (1 - pd) * pd * 3.2;
      if(a < 0.05) continue;
      x = Math.sin(pd * 5 + i * 3) * 5;
      y = -2 - pd * 20;
      c.moveTo(x + a, y);
      c.arc(x, y, a, 0, 6.2832);
    }
    c.fill();
  }

  c.restore();
}

/* Les braises éjectées. Paraboles pures, une table de vitesses tirée
   une fois : aucun état à conserver entre deux images.
   `suite` vaut 1 quand on redessine, pendant la retombée, les braises
   parties pendant l'éruption.

   Les vingt-six braises sont regroupées en QUATRE chemins, par tranche
   de luminosité. Un beginPath/arc/fill par braise coûtait 2,4 µs
   pièce, soit à lui seul un cinquième du budget de l'éruption — pour
   des points de deux pixels. L'œil ne voit pas la différence entre
   vingt-six teintes et quatre ; le profileur, lui, la voit. */
var GEY_TONS = ["rgba(255,116,34,", "rgba(255,142,46,",
                "rgba(255,174,64,", "rgba(255,216,136,"];
function geyBraises(c, age, suite, z, a0){
  var n = z > 0.7 ? GEY_BRAISES.length : (z > 0.45 ? 14 : 7);
  var i, b, e, ag, x, y, a, r;
  var lots = [null, null, null, null];
  for(i = 0; i < n; i++){
    e = GEY_BRAISES[i];
    ag = age - e.te;
    if(ag <= 0) continue;
    y = e.vy * ag - 0.5 * GEY_G * ag * ag;
    if(y <= 0) continue;                       // retombée dans le trou : éteinte
    if(suite && ag < GEY_DUREE.feu - e.te) continue;   // déjà dessinée par la phase feu
    x = e.vx * ag * (1 - ag * 0.25);           // l'air freine la dérive
    a = Math.min(1, y / 30) * Math.max(0, 1 - ag / (2 * e.vy / GEY_G)) * 0.9;
    if(a < 0.05) continue;
    r = e.s * (0.55 + a * 0.7);
    b = a > 0.68 ? 3 : (a > 0.45 ? 2 : (a > 0.24 ? 1 : 0));
    if(!lots[b]) lots[b] = [];
    lots[b].push(x, -y, r);
  }
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = 1;
  for(b = 0; b < 4; b++){
    if(!lots[b]) continue;
    c.fillStyle = GEY_TONS[b] + ((0.18 + b * 0.26) * a0).toFixed(3) + ")";
    c.beginPath();
    for(i = 0; i < lots[b].length; i += 3){
      c.moveTo(lots[b][i] + lots[b][i + 2], lots[b][i + 1]);
      c.arc(lots[b][i], lots[b][i + 1], lots[b][i + 2], 0, 6.2832);
    }
    c.fill();
  }
  c.globalCompositeOperation = "source-over";
}


/* ================================================================
   LA VIGNETTE DU MENU — « Mily dans la jungle »
   ----------------------------------------------------------------
   Les cinq îles ordinaires ont une vignette qui dit « voilà l'île ».
   Celle-ci doit dire « voilà un ORAGE, et il y a du feu dedans ».
   D'où trois partis pris :

   — Une AFFICHE, pas une maquette : cadrage frontal, silhouettes en
     contre-jour, plans qui s'éclaircissent avec la distance. Les
     autres vignettes sont vues de trois quarts en isométrie ; celle-ci
     tranche par sa construction avant même de trancher par sa couleur.
   — La moitié du dessin est un décor FIXE, gravé une fois dans un
     sprite. Ce qui bouge — pluie, éclairs, feu, brume, lucioles — est
     recalculé, le reste est posé d'un drawImage. Le menu peut ainsi
     tourner à soixante images par seconde sans y penser.
   — Le feu de la vignette est le VRAI geyser de la carte, la même
     fonction : l'affiche ne promet rien qu'elle ne tienne.
   ================================================================ */

/* Ce que l'état change. `lum` éclaire ou éteint tout le tableau,
   `eclair` est la période entre deux coups de foudre (0 = aucun). */
var VJ_ETATS = {
  cooldown: { lum:0.34, pluie:0.50, eclair:0,    feu:0.09, brume:0.50, cadre:0,    pouls:0,    luciole:2, froid:0.80 },
  attente : { lum:0.80, pluie:0.95, eclair:12.0, feu:0.60, brume:1.00, cadre:0.25, pouls:0,    luciole:5, froid:0.12 },
  prete   : { lum:1.08, pluie:1.30, eclair:4.0,  feu:1.05, brume:1.10, cadre:1,    pouls:1,    luciole:8, froid:0 },
  encours : { lum:1.00, pluie:1.20, eclair:6.0,  feu:1.00, brume:1.00, cadre:0.55, pouls:0.20, luciole:6, froid:0 }
};

var vjFondCv = null, vjFondCle = "";

function dessineVignetteJungle(c, w, h, tps, etat){
  var E = VJ_ETATS[etat] || VJ_ETATS.attente;
  var i, k, a, x, y, b0, b1;

  if(!vjFondCv || vjFondCle !== w + "x" + h) vjConstruitFond(w, h);

  c.save();
  c.beginPath(); c.rect(0, 0, w, h); c.clip();

  /* ---- le décor fixe ---- */
  c.drawImage(vjFondCv, 0, 0, w, h);

  /* ---- l'éclair : calculé d'abord, il éclaire tout le reste ----
     Deux flashs rapprochés, comme un vrai coup de foudre. Le premier
     est bref et blanc, le second plus mou. Le tout retombe en moins
     de 400 ms : une vignette de menu qui reste éclairée fatigue. */
  var flash = 0, boulon = -1, tf = 0;
  if(E.eclair > 0){
    boulon = Math.floor(tps / E.eclair);
    tf = tps - boulon * E.eclair;
    flash = vjEnveloppe(tf, 0.045, 0.13) + 0.62 * vjEnveloppe(tf - 0.15, 0.03, 0.16);
    flash = Math.min(1, flash);
  }

  /* ---- la pluie ----
     Un seul chemin pour toutes les gouttes : c'est un rideau, pas des
     objets. La dérive est constante — un orage tropical tombe de
     travers. */
  /* densité calée sur l'AIRE : c'est le nombre de segments qui coûte,
     pas leur longueur, et à 620×288 on passait de trois cent soixante
     traits à deux cents sans que l'œil y voie la moindre différence */
  var np = Math.round(w * h / 760 * E.pluie);
  c.save();
  c.lineCap = "butt";
  /* Deux passes : un rideau fin et discret, puis une poignée de
     gouttes proches, plus longues et plus claires. Une pluie d'une
     seule épaisseur n'a pas de profondeur — elle raye l'image. */
  for(k = 0; k < 2; k++){
    c.strokeStyle = "rgba(198,236,228," +
      ((k ? 0.30 : 0.13) + flash * 0.26) * E.lum + ")";
    c.lineWidth = Math.max(0.6, w / (k ? 420 : 900));
    c.beginPath();
    for(i = k; i < np; i += (k ? 5 : 1)){
      b0 = bruitStable(i, 0); b1 = bruitStable(i, 1);
      var vit = (0.9 + b1 * 0.9) * h * (k ? 2.6 : 1.9);
      y = ((b0 * h * 2 + tps * vit) % (h + 44)) - 22;
      x = ((b1 * (w + 90) - y * 0.34 - tps * vit * 0.30) % (w + 90) + w + 90) % (w + 90) - 45;
      var lg = h * (k ? 0.10 + b1 * 0.10 : 0.045 + b1 * 0.06);
      c.moveTo(x, y); c.lineTo(x - lg * 0.30, y + lg);
    }
    c.stroke();
  }
  c.restore();

  /* ---- brume qui dérive au ras du sol ----
     Deux nappes lentes, en sens contraires : c'est le décalage entre
     les deux qui fait respirer l'image. */
  c.save();
  for(i = 0; i < 4; i++){
    b0 = bruitStable(i + 40, 0); b1 = bruitStable(i + 40, 1);
    var sens = i % 2 ? 1 : -1;
    x = ((b0 * (w + 200) + tps * (5 + b1 * 8) * sens) % (w + 200) + w + 200) % (w + 200) - 100;
    geyBouffee(c, x, h * (0.68 + b1 * 0.24), w * (0.085 + b0 * 0.055),
               0.13 * E.brume * E.lum, "#9fc4b4", 0.34);
  }
  c.restore();

  /* ---- LE FEU : deux geysers, sur des cycles différents ----
     C'est l'élément exclusif de la carte : il doit être dans
     l'affiche, et il doit être le même code que dans le jeu. */
  /* Plus gros que dans le jeu : sur une affiche de 288 pixels de haut,
     une colonne à l'échelle 1 ferait un trait. Elle occupe ici près de
     la moitié de la hauteur, et c'est elle le sujet. */
  var ech = h / 148 * 0.58;
  /* cam.z sert de niveau de détail à dessineGeyser : on le force à 1
     le temps de l'affiche, sinon un menu ouvert pendant que la caméra
     du jeu est dézoomée montrerait des geysers dégradés. */
  var camSauve = (typeof cam !== "undefined" && cam) ? cam.z : null;
  if(camSauve !== null) cam.z = 1;
  /* Sur la CARTE, les bouches dorment vingt-deux secondes sur vingt-sept
     — c'est la règle qui empêche le terrain d'être un mur de flammes.
     Sur l'AFFICHE, c'est exactement l'inverse qu'il faut : une vignette
     qui ne montre que des cicatrices éteintes ne donne envie de rien.
     Les cycles sont donc courts et décalés d'un tiers de période, si
     bien qu'il y a toujours au moins une colonne debout. */
  /* CINQ bouches, toutes sur la MÊME période de sept secondes et
     décalées d'exactement un cinquième : la fenêtre « feu » dure 1,75 s
     et le décalage 1,40 s, donc les fenêtres se recouvrent et pavent la
     période entière. Traduction : il y a TOUJOURS au moins une colonne
     debout sur l'affiche. Avec trois bouches sur des périodes
     quelconques, une vignette sur trois ne montrait que des cicatrices
     éteintes — ce qui est honnête pour la carte, désastreux pour une
     affiche. */
  var VENTS = [ [0.235, 0.930, 0.0, 1.00],
                [0.715, 0.880, 1.4, 0.84],
                [0.505, 0.822, 2.8, 0.60],
                [0.865, 0.965, 4.2, 1.05],
                [0.385, 0.985, 5.6, 0.92] ];
  var perV = etat === "cooldown" ? 22 : 7;
  for(i = 0; i < VENTS.length; i++){
    var V = VENTS[i];
    var et = geyCycle(tps, perV, V[2] * (perV / 7));
    c.save();
    c.translate(w * V[0], h * V[1]);
    c.scale(ech * V[3], ech * V[3]);
    c.globalAlpha = E.feu;
    dessineGeyser(c, { gx:i * 17 + 3, gy:i * 11 + 5, phase:et.phase, t:et.t }, tps);
    c.restore();
  }
  if(camSauve !== null) cam.z = camSauve;

  /* Lueur chaude montant du sol : elle unifie les trois foyers en un
     seul incendie et réchauffe le bas de l'affiche. C'est AUSSI la
     pulsation de l'état « prete » — un second grand aplat pour
     respirer aurait doublé le poste le plus cher de la vignette pour
     rien : une seule nappe, dont la force respire. */
  var puls = 0.5 + 0.5 * Math.sin(tps * 2.1);
  c.save();
  c.globalCompositeOperation = "lighter";
  geyLueur(c, w * 0.44, h * 0.99, w * 0.40, h * 0.26, "#ff6a14",
           0.28 * E.feu + (0.07 + puls * 0.18) * E.pouls);
  c.restore();

  /* ---- les lucioles : le petit mystère ---- */
  c.save();
  for(i = 0; i < E.luciole; i++){
    b0 = bruitStable(i + 90, 0); b1 = bruitStable(i + 90, 1);
    x = w * (0.06 + b0 * 0.88) + Math.sin(tps * (0.35 + b1 * 0.4) + b0 * 6.28) * w * 0.05;
    y = h * (0.34 + b1 * 0.52) + Math.cos(tps * (0.3 + b0 * 0.5) + b1 * 6.28) * h * 0.07;
    a = (0.35 + 0.65 * Math.max(0, Math.sin(tps * (1.1 + b0 * 1.5) + b1 * 6.28)));
    lueurRapide(c, x, y, w * 0.016, "#c8ff8a", a * 0.62 * E.lum);
  }
  c.restore();

  /* ---- l'éclair, deuxième temps : le trait ----
     Il n'apparaît QUE pendant le flash. Sa géométrie est tirée de
     l'index du coup de foudre : identique d'une image à l'autre
     pendant les 300 ms où il vit, différente au coup suivant. */
  if(flash > 0.02){
    /* le ciel entier s'éclaire, mais jamais au point d'écraser le
       tableau : un menu ne doit pas clignoter en blanc */
    c.save();
    c.globalCompositeOperation = "lighter";
    c.fillStyle = "rgba(150,196,214," + (flash * 0.30).toFixed(3) + ")";
    c.fillRect(0, 0, w, h);
    c.restore();
    if(tf < 0.30) vjEclair(c, w, h, boulon, Math.max(0, 1 - tf / 0.30));
  }

  /* ---- voile de profondeur et coins sombres ----
     Gravés dans le fond pour l'essentiel ; ici on ne pose que la part
     qui dépend de l'état. */
  if(E.froid > 0){
    /* En attente, la carte est ÉTEINTE : on désature et on refroidit.
       Le mode « saturation » fait le travail d'un coup ; s'il n'est
       pas reconnu, le voile bleu suffit à faire passer le message. */
    c.save();
    c.globalCompositeOperation = "saturation";
    c.globalAlpha = E.froid * 0.85;
    c.fillStyle = "#808080";
    c.fillRect(0, 0, w, h);
    c.restore();
    c.fillStyle = "rgba(10,20,26," + (E.froid * 0.42).toFixed(3) + ")";
    c.fillRect(0, 0, w, h);
  }

  /* ---- le cadre ----
     Un liseré qui court le long du bord. Avec la respiration chaude
     du sol, c'est le seul moment où la vignette DEMANDE le clic ;
     partout ailleurs elle se contente d'exister. */
  if(E.cadre > 0){
    var m = Math.max(1.5, w * 0.0045);
    c.save();
    c.lineJoin = "miter";
    /* trait de fond, discret : il donne un bord à la vignette même
       quand rien ne court dessus */
    c.strokeStyle = "rgba(255,132,44," + (0.30 * E.cadre).toFixed(3) + ")";
    c.lineWidth = m;
    c.strokeRect(m * 0.5, m * 0.5, w - m, h - m);
    if(E.cadre > 0.6 && c.setLineDash){
      /* le liseré qui COURT. Un cadre fixe dit « voici une image » ;
         un cadre qui tourne dit « appuie ». */
      var pas = w * 0.22;
      c.setLineDash([pas * 0.30, pas * 0.70]);
      c.lineDashOffset = -tps * pas * 0.9;
      c.strokeStyle = "rgba(255,158,48," + (0.62 + 0.32 * Math.sin(tps * 3.1)).toFixed(3) + ")";
      c.lineWidth = m * 1.15;
      c.strokeRect(m * 0.75, m * 0.75, w - m * 1.5, h - m * 1.5);
      c.setLineDash([]);
    }
    c.restore();
  }

  c.restore();
}

/* Attaque brève puis extinction : sert aux flashs. */
function vjEnveloppe(t, mont, desc){
  if(t < 0) return 0;
  if(t < mont) return t / mont;
  if(t < mont + desc) return 1 - (t - mont) / desc;
  return 0;
}

/* Le trait de foudre. Deux passes : un halo large et mou, puis le
   filament net par-dessus — c'est ce qui donne l'impression d'une
   lumière violente et pas d'un trait de crayon. */
function vjEclair(c, w, h, n, a){
  var al = prng(0x3c0 + n * 9176);
  var x = w * (0.14 + al() * 0.72), y = -h * 0.05;
  /* il plonge DANS la canopée, jamais en l'air : un éclair qui
     s'arrête à mi-ciel n'a frappé nulle part */
  var bas = h * (0.62 + al() * 0.14);
  var pts = [[x, y]], k;
  while(y < bas){
    y += h * (0.06 + al() * 0.09);
    x += (al() - 0.5) * w * 0.10;
    pts.push([x, y]);
  }
  c.save();
  c.globalCompositeOperation = "lighter";
  c.lineCap = "round"; c.lineJoin = "round";
  for(var passe = 0; passe < 2; passe++){
    c.strokeStyle = passe ? "rgba(255,255,255," + (a * 0.95).toFixed(3) + ")"
                          : "rgba(150,205,255," + (a * 0.34).toFixed(3) + ")";
    c.lineWidth = passe ? Math.max(1, w * 0.004) : w * 0.016;
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for(k = 1; k < pts.length; k++) c.lineTo(pts[k][0], pts[k][1]);
    /* une fourche : un éclair droit n'existe pas */
    var f = 1 + ((al() * (pts.length - 2)) | 0);
    c.moveTo(pts[f][0], pts[f][1]);
    c.lineTo(pts[f][0] + w * 0.06, pts[f][1] + h * 0.12);
    c.lineTo(pts[f][0] + w * 0.03, pts[f][1] + h * 0.24);
    c.stroke();
  }
  c.restore();
  /* la lueur d'impact, au point de contact : elle rattache le trait à
     la forêt au lieu de le laisser flotter */
  lueurRapide(c, pts[pts.length - 1][0], pts[pts.length - 1][1], w * 0.12,
              "#a8d4ff", a * 0.50);
  lueurRapide(c, pts[pts.length - 1][0], pts[pts.length - 1][1] + h * 0.06,
              w * 0.09, "#cfe8ff", a * 0.30);
}

/* ----------------------------------------------------------------
   Le décor fixe de la vignette, gravé une fois par taille.
   Budget de dessin illimité : il ne se repeint qu'au changement de
   dimension.
   ---------------------------------------------------------------- */
function vjConstruitFond(w, h){
  vjFondCv = nouveauCanvas(w, h);
  vjFondCle = w + "x" + h;
  var c = vjFondCv.getContext("2d");
  var i, k, x, y, g;
  var al = prng(0x11e5);

  /* ---- le ciel d'orage. Il descend du noir-vert au vert d'eau
     malade : c'est la couleur d'un ciel tropical avant la pluie, et
     elle n'existe nulle part ailleurs dans le jeu. ---- */
  g = c.createLinearGradient(0, 0, 0, h * 0.76);
  g.addColorStop(0, "#04100c");
  g.addColorStop(0.42, "#092019");
  g.addColorStop(0.78, "#153a28");
  g.addColorStop(1, "#2a5232");
  c.fillStyle = g; c.fillRect(0, 0, w, h);

  /* nuages bas : des masses écrasées, plus claires vers l'horizon */
  for(i = 0; i < 18; i++){
    x = al() * w; y = h * (0.03 + al() * 0.36);
    var lum = 0.35 + (y / h) * 1.3;
    c.fillStyle = "rgba(" + ((22 * lum) | 0) + "," + ((48 * lum) | 0) + "," + ((42 * lum) | 0) + ",.72)";
    c.beginPath();
    c.ellipse(x, y, w * (0.11 + al() * 0.17), h * (0.028 + al() * 0.05), 0, 0, 6.2832);
    c.fill();
  }

  /* ---- trouée de lumière derrière le temple : c'est elle qui détache
     toutes les silhouettes. Sans contre-jour, une jungle noire sur un
     ciel noir n'est qu'une tache. ---- */
  var sv = c.createRadialGradient(w * 0.5, h * 0.66, w * 0.02, w * 0.5, h * 0.66, w * 0.44);
  sv.addColorStop(0, "rgba(140,214,146,.46)");
  sv.addColorStop(0.45, "rgba(60,132,92,.22)");
  sv.addColorStop(1, "rgba(20,50,40,0)");
  c.fillStyle = sv; c.fillRect(0, 0, w, h);

  /* ---- montagnes très lointaines, à peine plus sombres que le ciel ---- */
  c.fillStyle = "rgba(10,32,26,.66)";
  c.beginPath();
  c.moveTo(-10, h * 0.72);
  for(i = 0; i <= 9; i++){
    c.lineTo(w * i / 9, h * (0.60 - 0.09 * Math.abs(Math.sin(i * 1.9 + 0.4))));
  }
  c.lineTo(w + 10, h * 0.72); c.closePath(); c.fill();

  /* ---- LE TEMPLE, planté au milieu ---- */
  vjTemple(c, w, h);

  /* ---- canopée LOINTAINE, devant le temple : elle lui donne son
     assise et empêche qu'il ait l'air posé sur le vide ---- */
  vjCanopee(c, w, h, h * 0.755, h * 0.115, "#0d2418", 1, 15, al);

  /* ---- le sol : terre noire détrempée. La jungle du jeu a une terre
     presque noire ; la vignette doit la promettre. ---- */
  g = c.createLinearGradient(0, h * 0.76, 0, h);
  g.addColorStop(0, "#14240e");
  g.addColorStop(1, "#060c05");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(0, h * 0.84);
  for(i = 0; i <= 10; i++){
    c.lineTo(w * i / 10, h * (0.805 + 0.045 * Math.sin(i * 1.7 + 0.6)));
  }
  c.lineTo(w, h); c.lineTo(0, h); c.closePath(); c.fill();
  /* flaques : elles renvoient le vert du ciel, c'est ce qui dit
     « détrempé » sans qu'on ait à dessiner une goutte */
  for(i = 0; i < 11; i++){
    x = al() * w; y = h * (0.83 + al() * 0.15);
    c.fillStyle = "rgba(104,166,142,.15)";
    c.beginPath();
    c.ellipse(x, y, w * (0.035 + al() * 0.075), h * (0.007 + al() * 0.014), 0, 0, 6.2832);
    c.fill();
    c.fillStyle = "rgba(150,210,182,.10)";
    c.beginPath();
    c.ellipse(x - w * 0.01, y - h * 0.003, w * (0.016 + al() * 0.03), h * 0.004, 0, 0, 6.2832);
    c.fill();
  }

  /* ---- pierres ruinées et racines au sol : le mystère tient à ce
     qu'on devine une civilisation avalée par la forêt ---- */
  var RUINES = [[0.20, 0.855, 0.052], [0.735, 0.885, 0.062], [0.435, 0.925, 0.044],
                [0.885, 0.845, 0.040]];
  for(i = 0; i < RUINES.length; i++){
    x = w * RUINES[i][0]; y = h * RUINES[i][1];
    var lp = w * RUINES[i][2], hp = lp * 0.52;
    c.fillStyle = "#141e16";
    c.beginPath();
    c.moveTo(x - lp, y); c.lineTo(x + lp, y);
    c.lineTo(x + lp * 0.86, y - hp); c.lineTo(x - lp * 0.92, y - hp * 0.86);
    c.closePath(); c.fill();
    c.fillStyle = "#25352450".slice(0, 7);
    c.fillStyle = "rgba(56,84,54,.55)";        // mousse sur le dessus
    c.beginPath();
    c.ellipse(x - lp * 0.05, y - hp * 0.9, lp * 0.88, hp * 0.20, 0, 0, 6.2832);
    c.fill();
  }

  /* ---- troncs : trois grands fûts qui traversent toute la hauteur.
     Ils donnent l'échelle et cadrent le temple. ---- */
  vjTronc(c, w, h, 0.075, 0.031, al);
  vjTronc(c, w, h, 0.915, 0.027, al);
  vjTronc(c, w, h, 0.375, 0.016, al);

  /* ---- lianes ---- */
  c.strokeStyle = "rgba(6,18,12,.92)";
  c.lineCap = "round";
  for(i = 0; i < 9; i++){
    x = w * (0.05 + al() * 0.9);
    var lo = h * (0.20 + al() * 0.46);
    c.lineWidth = Math.max(1, w * (0.0018 + al() * 0.0038));
    c.beginPath();
    c.moveTo(x, 0);
    c.quadraticCurveTo(x + (al() - 0.5) * w * 0.07, lo * 0.6, x + (al() - 0.5) * w * 0.05, lo);
    c.stroke();
    /* quelques feuilles accrochées : une liane nue n'est qu'un fil */
    for(k = 0; k < 3; k++){
      var yy = lo * (0.45 + k * 0.2);
      vjFeuilleDecoupee(c, x + (al() - 0.5) * w * 0.03, yy, w * (0.018 + al() * 0.016),
                        1.3 + al() * 1.4, "#0a1a11", al);
    }
  }

  /* ---- BUISSONS DE MI-PLAN : la densité, c'est eux. Une jungle qui
     laisse voir le sol sur toute sa largeur n'est pas dense. ---- */
  var BUIS = [[0.02, 0.90, 0.13], [0.155, 0.955, 0.10], [0.30, 0.88, 0.085],
              [0.60, 0.905, 0.095], [0.79, 0.955, 0.125], [0.965, 0.89, 0.115],
              [0.47, 0.985, 0.09]];
  for(i = 0; i < BUIS.length; i++){
    vjMassif(c, w * BUIS[i][0], h * BUIS[i][1], w * BUIS[i][2], "#0a1a10", al);
  }

  /* ---- PREMIER PLAN : les grandes feuilles, presque noires.
     C'est le cadre végétal — les quatre coins mangés par des feuilles —
     qui dit « jungle dense » en un dixième de seconde. ---- */
  vjFeuilleDecoupee(c, w * 0.015, -h * 0.02, w * 0.34, -0.32, "#04100a", al);
  vjFeuilleDecoupee(c, w * 0.185, -h * 0.10, w * 0.28, 0.42, "#061309", al);
  vjFeuilleDecoupee(c, w * 0.99, h * 0.02, w * 0.34, 3.52, "#04100a", al);
  vjFeuilleDecoupee(c, w * 0.815, -h * 0.09, w * 0.26, 2.62, "#061309", al);
  vjFougere(c, -w * 0.01, h * 1.04, w * 0.36, -0.62, "#030b06", al);
  vjFougere(c, w * 1.01, h * 1.05, w * 0.34, 3.78, "#030b06", al);
  vjFeuilleDecoupee(c, w * 0.635, h * 1.10, w * 0.30, 2.15, "#04100a", al);
  vjFeuilleDecoupee(c, w * 0.355, h * 1.12, w * 0.26, 1.05, "#04100a", al);

  /* ---- une touche de couleur : quelques fleurs rouges. Sans elles,
     tout se noie dans le vert. Cinq suffisent, et elles ne servent
     qu'à ça — donner à l'œil un point où se poser. ---- */
  var FL = [[0.115, 0.885], [0.865, 0.925], [0.305, 0.965], [0.665, 0.855], [0.505, 0.995]];
  for(i = 0; i < FL.length; i++){
    x = w * FL[i][0]; y = h * FL[i][1];
    for(k = 0; k < 5; k++){
      var af = k / 5 * 6.2832 + 0.4;
      c.fillStyle = k % 2 ? "#a81c16" : "#d8442a";
      c.beginPath();
      c.ellipse(x + Math.cos(af) * w * 0.0075, y + Math.sin(af) * w * 0.0075,
                w * 0.0085, w * 0.0055, af, 0, 6.2832);
      c.fill();
    }
    c.fillStyle = "#f0c040";
    c.beginPath(); c.arc(x, y, w * 0.0035, 0, 6.2832); c.fill();
  }

  /* ---- coins sombres ---- */
  var vg = c.createRadialGradient(w * 0.5, h * 0.52, h * 0.20, w * 0.5, h * 0.52, w * 0.70);
  vg.addColorStop(0, "rgba(3,9,9,0)");
  vg.addColorStop(1, "rgba(1,5,6,.80)");
  c.fillStyle = vg; c.fillRect(0, 0, w, h);
}

/* Un massif de feuillage : des feuilles empilées en éventail autour
   d'un point. Un buisson dessiné comme une bosse ne trompe personne ;
   ce sont les BORDS dentelés qui font la végétation. */
function vjMassif(c, x, y, r, coul, al){
  var i, n = 9 + ((al() * 5) | 0);
  for(i = 0; i < n; i++){
    var a = -Math.PI + (i + 0.5) / n * Math.PI + (al() - 0.5) * 0.25;
    var lr = r * (0.55 + al() * 0.60);
    vjFeuilleDecoupee(c, x + Math.cos(a) * r * 0.28, y + Math.sin(a) * r * 0.12,
                      lr, a * 0.85, coul, al);
  }
}

/* Une ligne de crête de canopée : des touffes de feuilles collées les
   unes aux autres. Le relief vient des grappes plus claires posées
   dessus, pas d'un dégradé. */
function vjCanopee(c, w, h, base, amp, coul, opa, n, al){
  var i, x, y;
  c.save();
  c.globalAlpha = opa;
  /* la masse pleine, pour boucher le fond */
  c.fillStyle = coul;
  c.beginPath();
  c.moveTo(-w * 0.05, h + 2);
  for(i = 0; i <= n; i++){
    x = -w * 0.05 + (w * 1.1) * i / n;
    y = base - amp * (0.35 + 0.65 * Math.abs(Math.sin(i * 1.31 + 0.7)));
    c.lineTo(x, y);
    c.lineTo(x + w * 1.1 / n * 0.5, y + amp * 0.42 * (0.4 + al() * 0.6));
  }
  c.lineTo(w * 1.05, h + 2);
  c.closePath(); c.fill();
  /* et par-dessus, des touffes qui dentellent la crête */
  for(i = 0; i <= n; i++){
    x = -w * 0.05 + (w * 1.1) * i / n;
    y = base - amp * (0.35 + 0.65 * Math.abs(Math.sin(i * 1.31 + 0.7)));
    vjMassif(c, x, y + amp * 0.30, w * (0.035 + al() * 0.028), coul, al);
  }
  /* grappes claires sur la crête : elles attrapent la trouée du fond */
  c.fillStyle = ecl(coul, 2.0);
  c.globalAlpha = opa * 0.42;
  for(i = 0; i < n; i++){
    x = -w * 0.05 + (w * 1.1) * (i + 0.5) / n;
    y = base - amp * (0.35 + 0.65 * Math.abs(Math.sin(i * 1.31 + 0.7)));
    c.beginPath();
    c.ellipse(x, y + amp * 0.10, w * 0.019, amp * 0.14, al() * 3, 0, 6.2832);
    c.fill();
  }
  c.restore();
}

/* LE TEMPLE DU BRASIER, en silhouette et de face.
   Le premier essai n'était qu'un trapèze à deux ailerons percé de deux
   yeux : ça ne lisait pas « forteresse », ça lisait « masque ». Il
   fallait de l'ARCHITECTURE — des gradins qui se réduisent, un
   escalier axial, un portail à hauteur d'homme — pour que les deux
   fentes incandescentes redeviennent des fenêtres et que l'échelle
   soit lisible. Le Brasier reste un visage, mais un visage bâti. */
function vjTemple(c, w, h){
  var cx = w * 0.50, bas = h * 0.79;
  var lg = w * 0.185, ht = h * 0.42;
  var N = 5, i, u0, u1, l0, l1, y0, y1;

  /* les gradins */
  for(i = 0; i < N; i++){
    u0 = i / N; u1 = (i + 1) / N;
    l0 = lg * (1 - u0 * 0.66); l1 = lg * (1 - u1 * 0.66);
    y0 = bas - ht * u0; y1 = bas - ht * u1;
    c.fillStyle = "#071410";
    c.beginPath();
    c.moveTo(cx - l0, y0); c.lineTo(cx + l0, y0);
    c.lineTo(cx + l1, y1); c.lineTo(cx - l1, y1);
    c.closePath(); c.fill();
    /* la marge du gradin prend la lumière du fond : sans elle, la
       masse est un aplat et les étages disparaissent */
    c.fillStyle = "rgba(58,96,72,.34)";
    c.fillRect(cx - l1 * 1.06, y1, l1 * 2.12, Math.max(1, ht * 0.016));
  }
  /* les deux tours d'angle */
  for(i = -1; i <= 1; i += 2){
    c.fillStyle = "#050f0c";
    c.beginPath();
    c.moveTo(cx + i * lg * 0.94, bas);
    c.lineTo(cx + i * lg * 1.16, bas);
    c.lineTo(cx + i * lg * 1.06, bas - ht * 0.62);
    c.lineTo(cx + i * lg * 0.86, bas - ht * 0.62);
    c.closePath(); c.fill();
    /* la flèche */
    c.beginPath();
    c.moveTo(cx + i * lg * 0.86, bas - ht * 0.62);
    c.lineTo(cx + i * lg * 0.96, bas - ht * 0.84);
    c.lineTo(cx + i * lg * 1.06, bas - ht * 0.62);
    c.closePath(); c.fill();
  }
  /* l'escalier axial : des marches à peine plus claires */
  c.fillStyle = "rgba(46,78,58,.30)";
  for(i = 0; i < 9; i++){
    var ue = i / 9;
    var le = lg * 0.20 * (1 - ue * 0.5);
    c.fillRect(cx - le, bas - ht * 0.60 * ue, le * 2, Math.max(1, ht * 0.014));
  }
  /* le portail : la seule vraie source de lumière du fond */
  var g = c.createRadialGradient(cx, bas - ht * 0.06, 1, cx, bas - ht * 0.06, lg * 0.62);
  g.addColorStop(0, "rgba(255,196,96,.80)");
  g.addColorStop(0.38, "rgba(255,104,26,.40)");
  g.addColorStop(1, "rgba(200,40,8,0)");
  c.fillStyle = g;
  c.beginPath(); c.arc(cx, bas - ht * 0.06, lg * 0.62, 0, 6.2832); c.fill();
  c.fillStyle = "#ffb64a";
  c.beginPath();
  c.moveTo(cx - lg * 0.115, bas);
  c.lineTo(cx - lg * 0.115, bas - ht * 0.10);
  c.quadraticCurveTo(cx, bas - ht * 0.20, cx + lg * 0.115, bas - ht * 0.10);
  c.lineTo(cx + lg * 0.115, bas);
  c.closePath(); c.fill();
  /* les deux fenêtres hautes : deux fentes verticales, pas deux yeux
     ronds — c'est la forme qui décide si l'œil lit un bâtiment ou une
     bête */
  for(i = -1; i <= 1; i += 2){
    var ex = cx + i * lg * 0.20, ey = bas - ht * 0.74;
    var ge = c.createRadialGradient(ex, ey, 0.5, ex, ey, lg * 0.26);
    ge.addColorStop(0, "rgba(255,170,62,.85)");
    ge.addColorStop(1, "rgba(255,80,10,0)");
    c.fillStyle = ge;
    c.beginPath(); c.arc(ex, ey, lg * 0.26, 0, 6.2832); c.fill();
    c.fillStyle = "#ffd27a";
    c.beginPath();
    c.moveTo(ex - lg * 0.028, ey + ht * 0.045);
    c.lineTo(ex - lg * 0.028, ey - ht * 0.02);
    c.quadraticCurveTo(ex, ey - ht * 0.055, ex + lg * 0.028, ey - ht * 0.02);
    c.lineTo(ex + lg * 0.028, ey + ht * 0.045);
    c.closePath(); c.fill();
  }
  /* la vasque du sommet, allumée */
  c.fillStyle = "#050f0c";
  c.fillRect(cx - lg * 0.20, bas - ht * 1.06, lg * 0.40, ht * 0.07);
  var gs = c.createRadialGradient(cx, bas - ht * 1.10, 1, cx, bas - ht * 1.10, lg * 0.40);
  gs.addColorStop(0, "rgba(255,214,130,.80)");
  gs.addColorStop(0.4, "rgba(255,120,30,.34)");
  gs.addColorStop(1, "rgba(220,60,10,0)");
  c.fillStyle = gs;
  c.beginPath(); c.arc(cx, bas - ht * 1.10, lg * 0.40, 0, 6.2832); c.fill();
}

/* Un tronc de grand arbre, du haut du cadre jusqu'au sol. */
function vjTronc(c, w, h, px, lg, al){
  var x = w * px, l = w * lg;
  c.fillStyle = "#060f0a";
  c.beginPath();
  c.moveTo(x - l, 0);
  c.lineTo(x + l, 0);
  c.lineTo(x + l * 1.25, h * 0.86);
  /* contreforts : un arbre de jungle s'évase en pattes à sa base */
  c.lineTo(x + l * 3.2, h);
  c.lineTo(x - l * 3.4, h);
  c.lineTo(x - l * 1.3, h * 0.86);
  c.closePath(); c.fill();
  /* liseré humide côté lumière */
  c.strokeStyle = "rgba(120,178,150,.20)";
  c.lineWidth = Math.max(1, l * 0.28);
  c.beginPath();
  c.moveTo(x - l * 0.86, h * 0.05);
  c.lineTo(x - l * 1.05, h * 0.84);
  c.stroke();
  /* mousses */
  c.fillStyle = "rgba(60,110,72,.30)";
  for(var i = 0; i < 6; i++){
    c.beginPath();
    c.ellipse(x + (al() - 0.5) * l * 1.8, h * al(), l * 0.6, l * 0.25, 0, 0, 6.2832);
    c.fill();
  }
}

/* Une feuille de philodendron, avec ses découpes : c'est la découpe,
   et elle seule, qui fait lire « plante tropicale » plutôt que
   « buisson ». */
function vjFeuilleDecoupee(c, x, y, r, ang, coul, al){
  var i, n = 9;
  c.save();
  c.translate(x, y); c.rotate(ang);
  c.fillStyle = coul;
  c.beginPath();
  c.moveTo(0, 0);
  for(i = 0; i <= n; i++){
    var u = i / n, a = -0.95 + u * 1.9;
    var rr = r * (0.55 + 0.45 * Math.sin(u * Math.PI)) * (0.88 + (i % 2) * 0.24);
    c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    if(i < n) c.lineTo(Math.cos(a + 0.095) * rr * 0.42, Math.sin(a + 0.095) * rr * 0.42);
  }
  c.closePath(); c.fill();
  /* nervure centrale, à peine plus claire */
  c.strokeStyle = ecl(coul, 2.1);
  c.lineWidth = Math.max(1, r * 0.018);
  c.beginPath(); c.moveTo(0, 0); c.lineTo(r * 0.86, 0); c.stroke();
  c.restore();
}

/* Une fronde de fougère : une tige et ses folioles. */
function vjFougere(c, x, y, r, ang, coul, al){
  var i, n = 11;
  c.save();
  c.translate(x, y); c.rotate(ang);
  c.strokeStyle = coul;
  c.lineWidth = Math.max(1, r * 0.03);
  c.beginPath(); c.moveTo(0, 0);
  c.quadraticCurveTo(r * 0.5, -r * 0.24, r, -r * 0.30);
  c.stroke();
  c.fillStyle = coul;
  for(i = 1; i <= n; i++){
    var u = i / n;
    var bx = r * u, by = -r * 0.30 * u * u - r * 0.06 * u;
    var lg = r * 0.26 * (1 - u * 0.72);
    for(var s = -1; s <= 1; s += 2){
      c.save();
      c.translate(bx, by); c.rotate(s * (0.85 + u * 0.4));
      c.beginPath();
      c.ellipse(lg * 0.5, 0, lg, lg * 0.24, 0, 0, 6.2832);
      c.fill();
      c.restore();
    }
  }
  c.restore();
}
