/* ================================================================
   LE CIEL DES « MILY ET UNE NUITS »
   La lune, les aurores boréales, et les étoiles filantes.

   ────────────────────────────────────────────────────────────────
   LE PROBLÈME, ET IL EST GÉOMÉTRIQUE
   ────────────────────────────────────────────────────────────────

   Cette projection n'a PAS D'HORIZON. La caméra regarde le sol de
   trois quarts, et tout ce qui entre dans le cadre est posé sur le
   plan de l'eau. Il n'y a nulle part où accrocher un ciel : un
   dégradé bleu nuit en haut de l'écran ne serait pas un ciel, ce
   serait un bandeau collé sur l'objectif.

   La carte avait déjà répondu à cette question une première fois,
   pour la mer : « la réponse la moins chère et la plus belle n'est
   pas une brume, c'est un MIROIR » (dessineMerDEncre, 30-terrain.js).
   On continue donc la même phrase. LE CIEL ENTRE PAR L'EAU. La lune
   n'est pas au-dessus de la carte, elle est DEDANS, à l'envers, posée
   sur la mer d'encre avec son chemin de lumière qui court jusqu'au
   rivage.

   ET OÙ EXACTEMENT ? La question n'était pas décorative. La lisière
   de mer ne fait que quatre cases (MARGE_MONDE), ce qui semblait
   interdire tout objet un peu large. Sauf que la caméra n'est pas
   bornée par le LOSANGE de l'île mais par sa BOÎTE — boiteMonde
   renvoie les extrêmes, donc un rectangle. Entre le losange et le
   rectangle, il reste quatre grands triangles de pleine eau, et
   c'est là qu'il y a la place. La lune est posée dans celui du
   nord-est, à soixante pour cent le long du rivage : c'est le côté
   de la plage, celui qu'on regarde à chaque débarquement.

   ────────────────────────────────────────────────────────────────
   TROIS PHÉNOMÈNES, TROIS PROFONDEURS
   ────────────────────────────────────────────────────────────────

   LA LUNE est SOUS l'île. Peinte avec la mer, donc le rivage la
   recouvre : son chemin de lumière s'arrête au sable, exactement
   comme le ferait un vrai. C'est ce qui la met dans l'eau plutôt que
   dessus.

   LES AURORES sont AU-DESSUS DE TOUT, et c'est une leçon que la
   jungle a déjà payée : « ce qui manque n'est pas une ombre au sol,
   c'est la lumière de l'AIR entre la caméra et la carte, et celle-là
   passe forcément par-dessus tout. » Une aurore peinte sous les
   tours serait mangée par la carte dès qu'on s'approche.

   LES ÉTOILES FILANTES sont dans l'eau elles aussi, avec la lune :
   c'est leur reflet qui file, et il file donc sur la mer.

   ────────────────────────────────────────────────────────────────
   CE QUI FAIT QUE C'EST DE L'EAU ET NON UN AUTOCOLLANT
   ────────────────────────────────────────────────────────────────

   Aucun de ces trois objets n'est dessiné comme un objet. La lune
   n'est pas un disque : c'est une PILE DE BARRES horizontales, dont
   la largeur suit le profil du disque et dont chacune bat à son
   propre rythme. C'est la seule chose qui compte. Un disque net posé
   sur la mer se lit comme une pastille ; le même disque brisé en
   quarante lames qui ondulent se lit comme un reflet, immédiatement,
   sans qu'on ait rien à expliquer.

   La même règle vaut pour le chemin de lune et pour les traînées.

   ────────────────────────────────────────────────────────────────
   ET ELLES SONT PARTAGÉES
   ────────────────────────────────────────────────────────────────

   Une étoile filante tirée au hasard chez chacun, c'est un joli
   effet. La même étoile filante chez tout le monde à la même
   seconde, c'est un événement — on peut se le dire. Elles suivent
   donc la mécanique des tornades : des créneaux numérotés, une
   graine par créneau, et aucun octet sur le réseau.
   ================================================================ */

/* ----------------------------------------------------------------
   LA LUNE
   ---------------------------------------------------------------- */
/* Où elle est posée : le long du rivage nord-est, et vers le large.
   Exprimé en fractions du rivage plutôt qu'en coordonnées écrites à
   la main — si l'île changeait de taille, la lune suivrait. */
var LUNE_LONG  = 0.60;     // 60 % le long du rivage, côté plage
var LUNE_LARGE = 700;      // et 700 unités au large
var LUNE_R     = 176;      // son rayon, avant l'aplatissement iso
var LUNE_LAMES = 76;       // en combien de lames l'eau la brise
/* Le chemin de lune : il court de la lune vers le cœur de l'île et
   s'arrête au sable, puisque l'île est peinte par-dessus. */
var LUNE_CHEMIN   = 2200;  // sa longueur, largement de quoi toucher terre
var LUNE_CH_LAMES = 58;

/* ================================================================
   LES ÉCLATS DU CHEMIN DE LUNE

   Le premier chemin était fait de barres larges empilées le long
   d'une ligne. Capturé, ça donnait une masse grise sans forme posée
   sur la mer — ni un chemin, ni de la lumière, une tache.

   L'erreur était de le penser comme une NAPPE. Un chemin de lune n'en
   est pas une : c'est une foule de petites rides qui, chacune,
   attrapent la lune une seconde et la perdent. Ce qu'on voit de loin
   n'est pas une surface éclairée, c'est la DENSITÉ de ces éclats —
   forte près de nous où le couloir s'ouvre, faible près de la lune où
   il se resserre.

   On sème donc une fois pour toutes deux cents éclats dans le
   couloir, chacun avec sa place, sa taille et ses deux périodes de
   clignotement, et l'on ne fait plus que les allumer. Rien n'est tiré
   à l'image ; le semis est le même pour tout le monde.
   ================================================================ */
var CHEMIN_ECLATS = null;
function eclatsChemin(){
  if(CHEMIN_ECLATS) return CHEMIN_ECLATS;
  var al = prng(0x10E1), o = [], i;
  for(i = 0; i < 150; i++){
    /* f² plutôt que f : les éclats se serrent près de la lune, ce qui
       donne au chemin sa racine lumineuse au lieu d'un couloir de
       densité égale */
    var f = Math.sqrt(al());
    o.push({
      f : f,
      /* la position en travers, tirée vers le centre : le bord du
         couloir doit s'effilocher, pas s'arrêter net */
      lat: (al() * 2 - 1) * (al() * 0.6 + 0.4),
      r : (6 + al() * 21) * (0.6 + f * 0.9),
      ep: 2.0 + al() * 3.4,
      v1: 0.7 + al() * 1.5,
      v2: 0.23 + al() * 0.5,
      ph: al() * 6.2832
    });
  }
  CHEMIN_ECLATS = o;
  return o;
}

function positionLune(){
  var a = iso(0, 0), b = iso(GW, 0);
  var dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
  return { x:a.x + dx * LUNE_LONG + (dy / l) * LUNE_LARGE,
           y:a.y + dy * LUNE_LONG - (dx / l) * LUNE_LARGE };
}

/* Une lame de reflet : une ellipse très plate, dont la demi-largeur
   est donnée par l'appelant et dont le battement est déjà appliqué.
   Tout passe par ici — la lune, son chemin et les traînées — pour que
   les trois aient exactement la même matière. */
function lameEau(c, x, y, demi, ep, teinte, a){
  if(demi < 0.6 || a < 0.004) return;
  c.fillStyle = "rgba(" + teinte + "," + a + ")";
  c.beginPath();
  c.ellipse(x, y, demi, ep, 0, 0, 6.2832);
  c.fill();
}

function dessineLuneNuits(c, t, vue){
  var P = positionLune();
  var ry = LUNE_R * 0.5;                       // l'aplatissement du plan iso
  /* Le culling : la lune et son chemin tiennent dans une boîte qu'on
     teste d'un coup. Hors champ, on ne paie rien. */
  var bx0 = Math.min(P.x - LUNE_R * 3.2, P.x - LUNE_CHEMIN);
  var bx1 = P.x + LUNE_R * 3.2;
  var by0 = P.y - ry * 3.2, by1 = P.y + ry * 3.2 + LUNE_CHEMIN * 0.6;
  if(bx1 < vue.x0 || bx0 > vue.x1 || by1 < vue.y0 || by0 > vue.y1) return;

  c.save();
  c.globalCompositeOperation = "lighter";

  /* LE HALO. Il vient AVANT les lames : c'est lui qui pose la lumière
     dans l'eau autour du reflet, et les lames se détachent dessus.
     Serré, et non étalé : un halo trois fois plus large que la lune
     donnait une grande tache pâle rectangulaire dans laquelle le
     croissant se noyait — on voyait le halo, plus la lune. */
  var g = c.createRadialGradient(P.x, P.y, 0, P.x, P.y, LUNE_R * 1.75);
  g.addColorStop(0,    "rgba(216,230,255,.34)");
  g.addColorStop(0.30, "rgba(182,208,255,.15)");
  g.addColorStop(1,    "rgba(150,186,255,0)");
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(P.x, P.y, LUNE_R * 1.75, ry * 2.1, 0, 0, 6.2832);
  c.fill();

  /* ================================================================
     LE CROISSANT BRISÉ

     DEUX ERREURS CORRIGÉES ICI, ET LA PREMIÈRE EST LA PLUS BÊTE.

     C'était un DISQUE. Sur la carte des Mily et une nuits — celle des
     dômes, des lanternes et des arches — la lune ne peut évidemment
     pas être pleine. Le croissant est l'emblème même de l'endroit, et
     il a en plus l'avantage d'être reconnaissable en une fraction de
     seconde, même haché par l'eau : deux pointes et un ventre, l'œil
     ne peut pas se tromper. Il est obtenu comme un vrai croissant,
     par soustraction — un disque, moins un second disque décalé.

     LA SECONDE : LES LAMES VOISINES BATTAIENT INDÉPENDAMMENT. Chacune
     avait sa phase, donc deux lames collées pouvaient être l'une
     large et l'autre étroite, et le reflet se lisait comme un
     CODE-BARRES. Un reflet dans l'eau ne fait pas ça : une ride est
     large de plusieurs centimètres et couvre donc plusieurs lames à
     la fois. La phase avance maintenant lentement d'une lame à
     l'autre — la ride TRAVERSE le croissant au lieu de le hacher — et
     son amplitude est bien plus faible. C'est le bord qui frissonne,
     pas la forme.
     ================================================================ */
  var Ri = LUNE_R * 0.80, dxi = LUNE_R * 0.40;   // le disque qui creuse
  var k, u, bat, dx, a;
  for(k = 0; k < LUNE_LAMES; k++){
    u = (k + 0.5) / LUNE_LAMES * 2 - 1;               // -1 … +1
    var prof = Math.sqrt(Math.max(0, 1 - u * u));
    if(prof < 0.02) continue;
    var yy = P.y + u * ry;
    /* le bord extérieur du croissant, à cette hauteur */
    var xg = -LUNE_R * prof, xd = LUNE_R * prof;
    /* et ce que le second disque lui mange, s'il l'atteint */
    var uy = u * LUNE_R;
    if(Math.abs(uy) < Ri){
      var wi = Math.sqrt(Ri * Ri - uy * uy);
      xd = Math.min(xd, dxi - wi);                    // il ne reste que le limbe
    }
    if(xd <= xg) continue;                            // ici le croissant est fermé
    /* LA RIDE : une seule onde, lente en k, qui traverse le croissant
       du haut vers le bas. C'est elle qui dit « il y a de l'eau ». */
    bat = 1 + 0.13 * Math.sin(t * 1.5 - k * 0.20)
            + 0.07 * Math.sin(t * 0.62 - k * 0.065);
    dx = Math.sin(t * 0.95 - k * 0.28) * 7;
    /* les pointes sont les plus fines, donc les plus mobiles : on les
       laisse trembler un peu plus que le ventre */
    var mince = 1 - Math.min(1, (xd - xg) / (LUNE_R * 0.55));
    dx += Math.sin(t * 2.3 - k * 0.5) * 4 * mince;
    var mil = (xg + xd) * 0.5 * bat, demi = (xd - xg) * 0.5 * bat;
    a = 0.30 + 0.34 * prof + 0.06 * Math.sin(t * 1.1 - k * 0.3);
    lameEau(c, P.x + mil + dx, yy, demi, ry / LUNE_LAMES * 1.45,
            "232,241,255", a);
  }

  /* ================================================================
     LE CHEMIN DE LUNE

     Il part de la lune et va vers le cœur de l'île. Il ne s'arrête
     nulle part de lui-même : c'est le RIVAGE qui le coupe, puisque
     l'île est peinte après la mer. Un chemin de lune qui s'arrête net
     au sable, c'est précisément ce qu'on voit quand on est sur une
     plage la nuit.

     Il s'ÉLARGIT en s'éloignant de la lune. C'est l'inverse de
     l'intuition — on croit qu'un faisceau s'ouvre depuis sa source —
     mais un chemin de lune est un chemin de reflets : plus l'eau est
     proche de nous, plus les vaguelettes qui renvoient la lune sont
     nombreuses et dispersées. Il s'ouvre donc vers l'observateur.
     ================================================================ */
  var cx = CENTRE_X - P.x, cy = CENTRE_Y - P.y;
  var l = Math.hypot(cx, cy) || 1;
  cx /= l; cy /= l;
  var E = eclatsChemin();
  for(k = 0; k < E.length; k++){
    var e = E[k];
    var d = e.f * LUNE_CHEMIN;
    /* il s'ouvre en s'approchant : la largeur du couloir à cette
       distance, et l'éclat est posé quelque part dedans */
    var demiCouloir = LUNE_R * (0.42 + e.f * 1.25);
    var x = P.x + cx * d + e.lat * demiCouloir;
    var y = P.y + cy * d + e.lat * demiCouloir * 0.18;
    /* CHAQUE ÉCLAT A SA VIE. C'est là que se joue tout l'effet : un
       chemin de lune n'est pas une nappe qui palpite, c'est une foule
       de petites lames qui s'allument et s'éteignent chacune pour
       elle. Le produit de deux sinus de périodes premières entre
       elles passe par zéro : l'éclat DISPARAÎT vraiment, puis
       revient. C'est ce clignotement désordonné qui fait l'eau. */
    var vie = Math.sin(t * e.v1 + e.ph) * Math.sin(t * e.v2 + e.ph * 2.3);
    /* LE SEUIL FAIT LE CHEMIN. À « vie > 0 », la moitié des éclats est
       allumée en permanence et leurs bords se recouvrent : on retrouve
       une nappe grise, c'est-à-dire précisément ce qu'on fuyait. Il
       n'en faut qu'une poignée à la fois — un chemin de lune est fait
       de vide autant que de lumière. */
    if(vie < 0.42) continue;
    vie = (vie - 0.42) / 0.58;
    /* il s'étire quand il brille : une ride qui prend la lumière
       s'allonge, elle ne se contente pas de s'éclaircir */
    demi = e.r * (0.55 + 0.9 * vie);
    a = (0.95 - e.f * 0.45) * vie * (1 - Math.abs(e.lat) * 0.45);
    lameEau(c, x, y, demi, e.ep, "226,238,255", Math.max(0, a));
  }
  c.restore();
}

/* ================================================================
   LES ÉTOILES FILANTES — partagées, et rares

   Même mécanique que les tornades : le temps est découpé en créneaux
   numérotés, chaque créneau porte une graine tirée du code du salon,
   et tout le monde calcule donc la MÊME étoile au même instant sans
   qu'un octet passe par le réseau. Deux joueurs peuvent se dire « tu
   l'as vue ? », ce qui n'aurait aucun sens avec un tirage local.

   Elles filent sur la MER, avec la lune : ce qu'on voit d'une étoile
   filante dans cette carte, c'est son reflet.
   ================================================================ */
var FILANTE_PERIODE = 39;      // un créneau toutes les 39 s
var FILANTE_VIE     = 1.25;    // et elle dure une seconde et quart
var FILANTE_LAMES   = 26;

function graineFilante(n){
  return graineTexte(CODE_SALON + "|filante|"
                     + ((typeof cycleSalon === "number" ? cycleSalon : 0) | 0)
                     + "|" + n) >>> 0;
}
/* Tout ce qu'il faut savoir d'une étoile filante, tiré de sa graine.
   Aucune mémoire, aucun objet gardé : on la recalcule à chaque image
   à partir de son seul numéro de créneau. */
function filanteDuCreneau(n){
  var al = prng(graineFilante(n));
  var B = boiteMonde();
  /* Elle entre par le haut de la boîte et file en biais. Le sens
     alterne, sinon toutes les étoiles de la nuit vont du même côté. */
  var sens = al() < 0.5 ? 1 : -1;
  var ang = (0.30 + al() * 0.34) * sens;               // presque horizontale
  var long = 1500 + al() * 1700;
  return {
    x0 : B.x0 + al() * (B.x1 - B.x0),
    y0 : B.y0 + al() * (B.y1 - B.y0) * 0.55,
    dx : Math.cos(ang) * (sens > 0 ? 1 : -1),
    dy : Math.sin(Math.abs(ang)) * 0.5,                // aplati comme le plan
    long: long,
    /* le retard dans le créneau : sans lui, toutes les étoiles
       tomberaient pile sur la seconde ronde */
    retard: al() * (FILANTE_PERIODE - FILANTE_VIE - 1),
    teinte: al() < 0.72 ? "226,238,255" : (al() < 0.5 ? "255,232,180" : "186,222,255")
  };
}

function dessineFilantes(c, t, vue){
  var T = Date.now() * 0.001;
  var n = Math.floor(T / FILANTE_PERIODE);
  var k, i;
  c.save();
  c.globalCompositeOperation = "lighter";
  /* Deux créneaux suffisent : celui en cours et le précédent, au cas
     où une étoile née en fin de créneau déborde. */
  for(i = n - 1; i <= n; i++){
    var f = filanteDuCreneau(i);
    var age = T - (i * FILANTE_PERIODE + f.retard);
    if(age < 0 || age > FILANTE_VIE) continue;
    var av = age / FILANTE_VIE;
    /* Elle apparaît vite et s'éteint lentement : c'est ce qui donne
       l'impression qu'elle s'est consumée plutôt qu'éteinte. */
    var vif = av < 0.12 ? av / 0.12 : Math.pow(1 - (av - 0.12) / 0.88, 1.6);
    var tete = av * f.long * 1.6;
    for(k = 0; k < FILANTE_LAMES; k++){
      var u = k / (FILANTE_LAMES - 1);
      var d = tete - u * f.long;                       // la queue traîne derrière
      if(d < 0) continue;
      var x = f.x0 + f.dx * d, y = f.y0 + f.dy * d;
      if(x < vue.x0 - 200 || x > vue.x1 + 200 ||
         y < vue.y0 - 120 || y > vue.y1 + 120) continue;
      /* la queue s'amincit et pâlit, et l'eau la brise comme le reste */
      /* FINE ET VIVE, ET NON LARGE ET PÂLE. Le premier essai donnait
         une bavure grise sous la lune : des lames de trente-quatre
         unités de large à faible opacité, c'est-à-dire exactement une
         traînée de brouillard. Une étoile filante est le contraire —
         c'est un TRAIT, presque un fil, et c'est sa netteté qui la
         fait lire comme une vitesse. */
      var bat = 0.62 + 0.38 * Math.sin(T * 22 + k * 1.3);
      var demi = (17 - u * 13) * (0.7 + 0.3 * bat);
      lameEau(c, x, y, demi, (3.4 - u * 2.5) * 0.5, f.teinte,
              vif * (1 - u * 0.82) * (1 - u * 0.82) * 0.95);
    }
    /* la tête, plus dense, avec son halo */
    var hx = f.x0 + f.dx * tete, hy = f.y0 + f.dy * tete;
    if(hx > vue.x0 - 200 && hx < vue.x1 + 200 &&
       hy > vue.y0 - 120 && hy < vue.y1 + 120){
      var gh = c.createRadialGradient(hx, hy, 0, hx, hy, 78);
      gh.addColorStop(0,    "rgba(255,255,255," + (vif * 0.85) + ")");
      gh.addColorStop(0.18, "rgba(" + f.teinte + "," + (vif * 0.42) + ")");
      gh.addColorStop(1,    "rgba(" + f.teinte + ",0)");
      c.fillStyle = gh;
      c.beginPath(); c.ellipse(hx, hy, 78, 39, 0, 0, 6.2832); c.fill();
      /* le cœur : un point franc, sans quoi la tête n'est qu'un halo */
      lameEau(c, hx, hy, 13, 3.2, "255,255,255", vif * 0.95);
    }
  }
  c.restore();
}

/* ================================================================
   LES AURORES BORÉALES

   Trois rideaux, et ils sont AU-DESSUS DE TOUT — voir l'en-tête du
   fichier : ce qui se lit d'une aurore n'est pas une tache au sol,
   c'est la lumière de l'air entre la caméra et la carte.

   CE QUI FAIT UNE AURORE, ET CE N'EST PAS LA COULEUR. Une bande verte
   qui ondule reste une bande verte. Ce qui la transforme en rideau,
   ce sont les RAIES VERTICALES : une aurore est faite de fibres
   parallèles, alignées sur le champ magnétique, et c'est leur
   scintillement décalé de l'une à l'autre qui fait le mouvement
   caractéristique — celui qui donne l'impression que le rideau
   ondule alors que rien ne se déplace vraiment.

   ELLES SONT PLUS LENTES QUE LE SOL. Ancrées au monde à quatre-vingt-
   dix pour cent seulement : ce léger retard suffit à les envoyer
   loin derrière, comme les nuages de la jungle le font à 85 %.
   ================================================================ */
var AURORES = [
  /* haut : la hauteur moyenne du rideau, en unités de monde
     pos  : où il traverse la boîte du monde, en fraction de sa hauteur
     amp / periode : l'ondulation de son BORD BAS
     env1 / env2 : les deux longueurs d'onde de son enveloppe — c'est
                   elle qui décide où le rideau existe et où il n'y a
                   rien, donc c'est elle qui en fait un ruban          */
  /* LES TROIS SE RELAIENT SUR TOUTE LA HAUTEUR DU MONDE, et ce n'est
     pas un choix esthétique. Une fibre monte toujours vers le HAUT de
     l'écran : un rideau posé au nord ne sort donc que dans la mer du
     nord, et les trois autres bords d'eau — dont celui de la plage,
     le plus regardé de tous — n'en voyaient jamais rien. Mesuré :
     depuis la plage, aucune aurore à l'écran. Leurs pieds sont donc
     étagés de façon que l'union de leurs hauteurs couvre la boîte du
     monde d'un bout à l'autre. Ce qu'ils peignent au-dessus de l'île
     est de toute façon recouvert par elle. */
  { teinte:"120,255,170", haut:1900, pos:0.34, amp:420, periode:2300,
    env1:2900, env2:1150, vit:0.055, opa:1.00, raies:0.90, ph:0 },
  { teinte:"120,208,255", haut:2200, pos:0.72, amp:560, periode:3400,
    env1:4100, env2:1650, vit:0.037, opa:0.92, raies:0.66, ph:2.1 },
  { teinte:"198,140,255", haut:1800, pos:1.06, amp:330, periode:1900,
    env1:2200, env2:900,  vit:0.081, opa:0.78, raies:1.20, ph:4.3 }
];
var AUR_PARALLAXE = 0.10;   // ce qu'elles gardent quand le sol défile
var AUR_PAS_RAIE  = 30;     // l'écart entre deux fibres, en unités de monde
var AUR_RAIES_MAX = 170;    // et le plafond, pour le dézoom

/* Le bord BAS du rideau à l'abscisse x : trois ondes de périodes sans
   rapport, pour qu'aucune répétition ne se lise. */
function bordAurore(A, x, t){
  return A.amp * (Math.sin(x / A.periode + t * A.vit * 6)
                  + 0.52 * Math.sin(x / (A.periode * 0.41) - t * A.vit * 9.5)
                  + 0.27 * Math.sin(x / (A.periode * 0.17) + t * A.vit * 4));
}

/* ================================================================
   L'ENVELOPPE — ce qui fait la différence entre un ruban et un store

   Le premier essai peignait le rideau comme un CORPS : un ruban plein
   avec un bord haut et un bord bas, rempli d'un dégradé, plus des
   raies par-dessus. Capturé, ça donnait exactement deux choses qu'on
   ne voulait pas — de loin, trois vitres dépolies posées à plat sur
   l'île ; de près, un store vénitien.

   Les deux défauts avaient la même cause. Un rideau plein a un bord
   HAUT, et un bord haut est une ligne : rien dans le ciel n'a de
   ligne. Une aurore n'a pas de silhouette, elle a une DENSITÉ — des
   fibres qui montent du même bord bas, chacune jusqu'à sa propre
   hauteur, et dont la superposition fait la matière. Il n'y a donc
   plus de corps du tout : le rideau EST ses fibres, et son contour
   supérieur est le hasard de leurs longueurs.

   L'enveloppe fait le reste. Sans elle, les fibres couvrent toute la
   largeur de l'écran d'un bout à l'autre et l'on retrouve un bandeau.
   Deux ondes lentes, un seuil, et le rideau s'allume par endroits et
   s'éteint ailleurs : il redevient un objet qui traverse le ciel au
   lieu d'un filtre posé sur l'objectif.
   ================================================================ */
function enveloppeAurore(A, x, t){
  var e1 = Math.sin(x / A.env1 + t * A.vit * 2.6 + A.ph);
  var e2 = Math.sin(x / A.env2 - t * A.vit * 1.5 + A.ph * 1.7);
  var brut = Math.max(0, (0.5 + 0.5 * e1) * 0.74 + (0.5 + 0.5 * e2) * 0.46 - 0.18) / 1.02;
  /* UN PLANCHER, ET NON UN INTERRUPTEUR. Sans lui, l'enveloppe tombait
     à zéro sur de longues portions et il n'y avait rien du tout dans
     la mer de la plage — mesuré : 86 fibres bien dessinées, mais à une
     enveloppe de 0,43, et l'étalonnage de lune qui passe ensuite en
     mangeait le reste. Le rideau existe donc partout, faiblement, et
     l'enveloppe ne fait plus que le renforcer par endroits. */
  return 0.34 + 0.66 * brut;
}

/* ================================================================
   LA FIBRE EST UNE IMAGE, ET NON DEUX RECTANGLES

   Premier essai : deux fillRect par fibre, un large et pâle pour la
   brume, un étroit et vif pour la fibre elle-même, avec un dégradé
   vertical. Ça marchait tant que les fibres se recouvraient — et ça
   se voyait tout de suite dès qu'une fibre restait SEULE. Un
   rectangle a des bords francs à gauche et à droite ; une fibre
   isolée par l'enveloppe devenait donc un rectangle pâle bien net
   posé sur la mer, à côté de la lune, où l'on cherchait longtemps
   d'où venait cette vitre.

   Un dégradé ne règle que la verticale. Ce qu'il fallait, c'est un
   fondu dans les DEUX sens, et cela ne se fait pas avec un
   remplissage : cela se fait avec une image. On en cuit une par
   rideau — profil horizontal doux, profil vertical en flamme — et
   chaque fibre n'est plus qu'un drawImage étiré. C'est à la fois plus
   beau et moins cher que les deux rectangles.

   LE PIED EST NET, LA POINTE SE DISSOUT, et ce n'est pas symétrique :
   la lumière d'une aurore naît en bas, là où l'air est dense, et se
   perd en montant. Un profil symétrique donnait une écharpe ;
   celui-ci donne une flamme.
   ================================================================ */
var AUR_SP_L = 96, AUR_SP_H = 256;
function spriteFibre(A){
  if(A.__sp) return A.__sp;
  var s = nouveauCanvas(AUR_SP_L, AUR_SP_H), g = s.getContext("2d");
  /* la verticale : la flamme */
  var gv = g.createLinearGradient(0, 0, 0, AUR_SP_H);
  gv.addColorStop(0,    "rgba(" + A.teinte + ",0)");
  gv.addColorStop(0.30, "rgba(" + A.teinte + ",.10)");
  gv.addColorStop(0.72, "rgba(" + A.teinte + ",.48)");
  gv.addColorStop(0.96, "rgba(" + A.teinte + ",1)");
  gv.addColorStop(1,    "rgba(" + A.teinte + ",.55)");
  g.fillStyle = gv;
  g.fillRect(0, 0, AUR_SP_L, AUR_SP_H);
  /* l'horizontale : un cœur vif dans un voile large. On la pose en
     destination-in, donc elle MULTIPLIE l'alpha déjà en place au lieu
     d'ajouter de la couleur — les deux profils se composent. */
  var gh = g.createLinearGradient(0, 0, AUR_SP_L, 0);
  gh.addColorStop(0,    "rgba(0,0,0,0)");
  gh.addColorStop(0.30, "rgba(0,0,0,.22)");
  gh.addColorStop(0.44, "rgba(0,0,0,.72)");
  gh.addColorStop(0.50, "rgba(0,0,0,1)");
  gh.addColorStop(0.56, "rgba(0,0,0,.72)");
  gh.addColorStop(0.70, "rgba(0,0,0,.22)");
  gh.addColorStop(1,    "rgba(0,0,0,0)");
  g.globalCompositeOperation = "destination-in";
  g.fillStyle = gh;
  g.fillRect(0, 0, AUR_SP_L, AUR_SP_H);
  A.__sp = s;
  return s;
}

function dessineAurores(c, t, vue){
  var B = boiteMonde();
  /* Le décalage de parallaxe : les rideaux gardent un dixième de leur
     place quand le sol défile, donc ils dérivent en sens inverse et
     paraissent très loin. */
  var dec = ((vue.x0 + vue.x1) * 0.5) * AUR_PARALLAXE;
  var x0 = vue.x0 - 120, x1 = vue.x1 + 120;
  var pas = AUR_PAS_RAIE;
  /* GARDE-FOU DU DÉZOOM. Très large, l'écart entre deux fibres tombe
     sous le pixel : on écarte les raies au lieu d'en peindre trois
     cents qui se recouvrent. */
  if((x1 - x0) / pas > AUR_RAIES_MAX) pas = (x1 - x0) / AUR_RAIES_MAX;

  c.save();
  c.globalCompositeOperation = "lighter";
  for(var a = 0; a < AURORES.length; a++){
    var A = AURORES[a];
    var base = B.y0 + (B.y1 - B.y0) * A.pos;
    var sp = spriteFibre(A);
    for(var x = x0; x <= x1; x += pas){
      /* LE DÉCALAGE DE CHAQUE FIBRE. Sans lui, elles sont à intervalle
         rigoureusement égal et le rideau se lit comme un peigne. Un
         décalage tiré de l'abscisse elle-même — donc stable, pas
         tremblotant — suffit à casser la régularité. */
      var xj = x + Math.sin(x * 0.0131 + a * 3.7) * pas * 0.42
                 + Math.sin(x * 0.0067 - a * 1.9) * pas * 0.30;
      var xd = xj + dec;
      var env = enveloppeAurore(A, xd, t);
      if(env < 0.05) continue;
      var ph = xd * 0.0041 + a * 2.1;
      /* Le scintillement propre à la fibre. Deux périodes multipliées
         plutôt qu'additionnées : le produit passe par zéro, donc la
         fibre s'éteint VRAIMENT de temps en temps au lieu de battre
         autour d'une moyenne. C'est ce clignotement inégal d'une fibre
         à l'autre qui fait courir le rideau. */
      var vif = 0.42 + 0.58 * Math.sin(t * A.raies * 2.4 + ph * 6.1)
                            * Math.sin(t * A.raies * 0.8 + ph * 1.9);
      if(vif < 0.05) continue;
      var yb = base + bordAurore(A, xd, t);
      /* Chaque fibre a SA hauteur : c'est ce qui donne au rideau son
         bord supérieur déchiqueté, celui qu'aucun tracé ne saurait
         dessiner. */
      var h = A.haut * (0.34 + 0.66 * (0.5 + 0.5 * Math.sin(ph * 2.7 + 0.6))
                              * (0.5 + 0.5 * Math.sin(ph * 0.9 + t * 0.11)));
      if(h < 30) continue;
      /* La fibre : une seule image, étirée à sa hauteur et à sa
         largeur. Deux fois l'écart entre deux fibres, pour qu'elles se
         recouvrent — c'est le recouvrement qui fait la matière du
         rideau, pas les fibres prises une à une.
         TROIS FOIS ÉTAIT PLUS BEAU ET TROP CHER. Mesuré en débranchant
         le ciel : 1,5 ms au zoom de jeu, mais 13 ms à l'île entière,
         parce que la surface repeinte ne dépend PAS du nombre de
         fibres — elle vaut le recouvrement multiplié par la largeur de
         la vue, quel que soit le pas. Le seul levier est donc ce
         facteur-là, et il vaut trois millisecondes par unité. */
      var larg = pas * 2.1;
      c.globalAlpha = Math.min(1, A.opa * env * vif);
      c.drawImage(sp, xj - larg * 0.5, yb - h, larg, h);
    }
  }
  c.restore();
}
