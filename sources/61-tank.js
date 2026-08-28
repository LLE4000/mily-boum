/* ================================================================
   LE TX-90 — la troupe lourde

   « Un beau char militaire. Grosses chenilles bien visibles, coque
   blindée solide, tourelle sur le dessus qui tourne indépendamment de
   la base, beau canon principal bien proportionné. Il doit paraître
   lourd et costaud. »

   ────────────────────────────────────────────────────────────────
   POURQUOI CE FICHIER NE RESSEMBLE À AUCUN AUTRE DESSIN DU JEU
   ────────────────────────────────────────────────────────────────

   Toutes les autres troupes sont des SILHOUETTES DE PROFIL. Une Furie
   est dessinée de côté, et quand elle marche vers l'ouest le moteur
   retourne son image d'un c.scale(-1, 1). C'est parfait pour un
   personnage : il n'a que deux profils intéressants et personne ne
   remarque qu'il n'en a pas d'autres.

   Un char, non. Sa tourelle doit pointer LA DÉFENSE QU'IL VISE, sa
   caisse doit suivre LA ROUTE QU'IL PREND, son intercepteur doit se
   tourner vers LA ROQUETTE QUI ARRIVE — trois directions, et aucune
   n'est l'autre. Un profil retourné n'en a que deux.

   Ce fichier construit donc le char EN TROIS DIMENSIONS, dans son
   propre repère — x vers l'avant, y vers sa gauche, z vers le ciel —
   et projette chaque point dans l'isométrie du jeu.

   ────────────────────────────────────────────────────────────────
   LE TRI DE PROFONDEUR, SANS TRIER
   ────────────────────────────────────────────────────────────────

   Un objet à trois dimensions qui tourne doit être peint du fond vers
   l'avant, sinon il se retourne comme un gant. On pourrait trier ses
   faces à chaque image — trente faces par char, quatorze chars à
   l'écran, et une tablette tousse.

   On s'en passe, parce que la question a une réponse EXACTE et
   gratuite. Dans cette isométrie, un point est d'autant plus PRÈS de
   la caméra que (wx + wy) est grand. Une face est donc visible si sa
   normale sortante `n` vérifie nx + ny > 0 — un test, pas un tri. Et
   comme une boîte convexe ne montre jamais que deux de ses quatre
   flancs, ses faces visibles pavent sa silhouette sans se recouvrir :
   leur ordre entre elles n'a aucune importance.

   Il ne reste que trois décisions d'ordre, et elles se prennent au
   signe d'un cosinus :
     — quelle chenille est la plus proche (l'autre passe dessous) ;
     — le canon pointe-t-il vers la caméra ou à l'opposé (auquel cas
       il passe DERRIÈRE la tourelle) ;
     — la coque, toujours entre les deux chenilles.

   ────────────────────────────────────────────────────────────────
   L'IDENTITÉ VISUELLE : KAKI, LONG, ET TEXTURÉ
   ────────────────────────────────────────────────────────────────

   « Plus de texture. En largeur c'est bon, mais long, et un canon
   plus long aussi. Avec camouflage kaki. »

   Le premier TX-90 était un acier bleuté, court et lisse. Il était
   propre — et il était plat. Trois choses l'ont changé :

   LA LONGUEUR. Cinquante-deux pixels de chenille au lieu de trente-
   neuf, un canon de trente-six au lieu de vingt-quatre. Un char court
   ressemble à un jouet ; c'est la LONGUEUR qui fait la masse, jamais
   la largeur, et l'œil le sait sans qu'on le lui dise.

   LE CAMOUFLAGE. Trois kakis — l'olive de base, un vert d'ombre, une
   terre brune — en taches irrégulières. Et le point qui compte : les
   taches sont définies DANS LE REPÈRE DE LA CAISSE, donc elles
   tournent avec le char. C'est de la peinture, pas un calque d'écran.
   Un camouflage qui glisserait sur le blindage pendant qu'il manœuvre
   se verrait immédiatement, sans qu'on sache dire pourquoi.

   LA TEXTURE. Des rivets, des lignes de tôle, de la boue au bas de
   caisse, de la poussière sur les chenilles. Tout est déterministe —
   un tirage à graine fixe, une fois pour toutes — et tout est coupé
   au zoom : à z < 0,5 un rivet fait un tiers de pixel et ne coûte que
   du temps.

   ────────────────────────────────────────────────────────────────
   LES CHENILLES QUI SE DÉROULENT
   ────────────────────────────────────────────────────────────────

   « Quand le char est en mouvement, on doit avoir l'impression que
   les chenilles sortent. »

   C'est la boucle qu'il faut montrer, et une chenille de jeu la rate
   presque toujours parce qu'elle n'anime qu'une hachure sur le flanc.
   Ici, les tuiles défilent sur TROIS surfaces à la fois, et dans les
   BONS SENS :
     — le brin SUPÉRIEUR part vers l'avant ;
     — le brin INFÉRIEUR, celui qui touche le sol, recule par rapport
       à la caisse (c'est lui qui fait avancer le char) ;
     — et aux deux bouts, les tuiles TOURNENT autour du barbotin et
       de la poulie, sur un arc, en passant de l'un à l'autre.
   Ce troisième point est celui qui fait tout : sans l'arc, deux brins
   qui glissent en sens contraires sont deux tapis roulants ; avec
   l'arc, c'est une chaîne fermée qui tourne. Et le dessus de la
   chenille défile aussi, ce qui donne, vu de dessus en isométrie,
   l'impression que la chenille se DÉROULE sous le char.

   ────────────────────────────────────────────────────────────────
   L'INTERCEPTEUR
   ────────────────────────────────────────────────────────────────

   « À l'arrière, un intercepteur qui explose les roquettes des
   Frelons. Ça doit intercepter 50 % des Frelons. »

   Un tourillon à quatre tubes, posé sur le pont arrière, qui tourne
   tout seul en veille et se braque sur la roquette qui arrive. Le
   dessin est ici ; la mécanique — un Frelon sur deux, exactement, pas
   « à peu près » — est dans 80-jeu.js.
   ================================================================ */

/* Le repère du char. x vers l'avant, y vers sa gauche, z vers le ciel,
   et une unité vaut un pixel d'écran à zoom 1.
   La projection est celle du jeu, ramenée à l'unité : dans iso(), une
   case fait 52 de large et 26 de haut, soit exactement deux pour un.
   PROFONDEUR : wx + wy. Plus c'est grand, plus c'est près. */
function ptT(x, y, z, ca, sa){
  var wx = x * ca - y * sa;
  var wy = x * sa + y * ca;
  return { x:wx - wy, y:(wx + wy) * 0.5 - z };
}
/* La même question, réduite à ce qui sert vraiment : cette normale
   regarde-t-elle la caméra ? */
function versNousT(nx, ny){ return nx + ny > 0.0001; }

/* UNE FACE N'EST JAMAIS D'UNE SEULE COULEUR.

   Le premier char était rempli à plat, une teinte par face, et il
   avait l'air d'un pliage de carton : les arêtes se voyaient, les
   volumes non. Ce qui manquait n'était ni un détail ni une pièce,
   c'était le DÉGRADÉ — sur une plaque d'acier, le haut renvoie le
   ciel et le bas renvoie le sol, et l'écart entre les deux est ce qui
   dit qu'il s'agit d'une surface et non d'un aplat. */
/* ═══ LE CACHE DE DÉGRADÉS ═══════════════════════════════════════

   Mesuré, et c'est le poste le plus cher du char de très loin :
   quatorze TX-90 à l'écran passaient de 48 à 101 ms d'image rien que
   pour recréer leurs dégradés. Cinquante-trois millisecondes pour
   fabriquer, à chaque image, des objets identiques à ceux de l'image
   précédente.

   POURQUOI UN CACHE EST POSSIBLE ICI, alors qu'il ne le serait pas
   ailleurs : un dégradé de canevas est interprété dans le REPÈRE
   COURANT au moment du remplissage, pas dans celui de sa création. Or
   chaque char est dessiné dans son propre repère, translaté sur sa
   case et mis à l'échelle du zoom. Deux chars de même cap produisent
   donc, dans LEUR repère, exactement les mêmes bornes verticales —
   et le même dégradé sert aux deux, chacun chez soi.

   La clé est donc (couleur, haut, bas) arrondie au pixel, et le cache
   vit sur le CONTEXTE : un dégradé appartient à son canevas, et le
   char est aussi dessiné sur ceux des vignettes et du briefing.
   ═════════════════════════════════════════════════════════════ */
var TK_CACHE_MAX = 480;
function degradeT(c, fond, y0, y1){
  var m = c.__degT;
  if(!m){ m = c.__degT = {}; c.__degTn = 0; }
  var cle = fond + "|" + (y0 | 0) + "|" + (y1 | 0);
  var g = m[cle];
  if(g) return g;
  /* un garde-fou : une caméra qui tourne sans fin finirait par
     remplir le cache de dégradés qu'on ne reverra jamais */
  if(c.__degTn > TK_CACHE_MAX){ m = c.__degT = {}; c.__degTn = 0; }
  g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, ecl(fond, 1.20));
  g.addColorStop(0.55, fond);
  g.addColorStop(1, ecl(fond, 0.80));
  m[cle] = g; c.__degTn++;
  return g;
}
function faceT(c, pts, ca, sa, fond, bord){
  var i, p, y0 = 1e9, y1 = -1e9;
  c.beginPath();
  for(i = 0; i < pts.length; i++){
    p = ptT(pts[i][0], pts[i][1], pts[i][2], ca, sa);
    if(p.y < y0) y0 = p.y;
    if(p.y > y1) y1 = p.y;
    if(i === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y);
  }
  c.closePath();
  c.fillStyle = (fond.charAt(0) === "#" && y1 - y0 > 1.2)
              ? degradeT(c, fond, y0, y1) : fond;
  c.fill();
  if(bord){ c.strokeStyle = bord; c.lineWidth = 0.7; c.stroke(); }
}
/* Le même chemin, sans le remplir : pour découper (clip) ou souligner. */
function cheminT(c, pts, ca, sa){
  var i, p;
  c.beginPath();
  for(i = 0; i < pts.length; i++){
    p = ptT(pts[i][0], pts[i][1], pts[i][2], ca, sa);
    if(i === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y);
  }
  c.closePath();
}

/* ----------------------------------------------------------------
   LA PALETTE — TROIS KAKIS ET RIEN D'AUTRE

   Le camouflage militaire ne mélange pas des couleurs, il mélange des
   VALEURS d'une même famille. Trois kakis, donc : l'olive de la
   peinture d'usine, un vert d'ombre plus froid et plus sombre, une
   terre brune plus chaude et plus claire. Deux d'entre eux suffisent
   à faire un camouflage ; le troisième le rend crédible.

   Le seul accent est le rouge de l'insigne, et il tient sur deux
   pixels. Un char kaki avec une bande de couleur ne serait plus un
   char, ce serait une décoration.
   ---------------------------------------------------------------- */
var C_TANK = {
  /* la peinture d'usine */
  coque:"#6e6c47", coqueO:"#4f4d31", coqueN:"#34331f",
  toit:"#87855c", liseré:"#1d1c11", jupe:"#4a4930",
  /* la tourelle est d'un demi-ton plus claire : elle est plus haut,
     elle prend plus de ciel */
  tourelle:"#787650", tourelleT:"#96946a",
  /* LES DEUX TEINTES DU CAMOUFLAGE */
  camoV:"#4b5732", camoB:"#7d6640",
  /* l'acier nu : le tube, les tôles usées */
  canon:"#5e5c40", canonC:"#8f8d66", canonO:"#3a3925",
  /* les chenilles, presque noires : c'est de l'acier qui frotte la
     terre, il ne reste jamais de peinture dessus */
  chenille:"#2b2922", chenilleC:"#443f33", maillon:"#17150f",
  roue:"#42402e", roueC:"#6d6a4f", moyeu:"#9c9a7e",
  /* la boue et la poussière : la même sur les deux, à deux hauteurs */
  boue:"#6a5c3c", poussiere:"#a3956f",
  laiton:"#c8a44e", laitonC:"#f0d48c",
  rouge:"#ad3f2c",
  phare:"#ffeeb4",
  /* l'intercepteur : de l'acier plus froid que la coque, exprès. Il
     n'est pas de la même génération que le char, et ça se voit. */
  inter:"#5a5f52", interC:"#7e8474", interO:"#383c32",
  interFeu:"255,214,120"
};

/* ----------------------------------------------------------------
   LES COTES

   « En largeur c'est bon, mais long. » Toutes les dimensions du char
   tiennent ici : il se redimensionne en touchant ces vingt nombres.

   Le premier jet faisait 39 de chenille et 24 de canon, et il était
   trapu. Ce qui donne la masse à un blindé n'est pas sa largeur mais
   son RAPPORT longueur sur largeur : à 52 sur 31, le TX-90 est enfin
   un char et non une caisse.
   ---------------------------------------------------------------- */
var TK = {
  /* LES CHENILLES. Longues — 52 —, et LARGES : 8,5 d'emprise au sol
     contre 5,9 auparavant. Une chenille étroite est une roue ; c'est
     sa largeur qui dit qu'elle répartit quarante tonnes sur du sable. */
  chX:26, chYe:15.5, chYi:7.0, chZ:11.5,
  /* la coque : posée DESSUS, jamais dedans, et plus étroite qu'elles */
  coX0:-23, coX1:22, coY:9.5, coZ0:11.5, coZ1:20.5,
  /* le glacis avant, incliné : c'est lui qui donne au char son air
     de blindé moderne plutôt que de caisse à savon */
  /* LE GLACIS s'arrête AU NEZ DES CHENILLES, pas au-delà. À vingt-neuf
     il débordait de trois pixels par-dessus la chenille du fond, et
     comme il est la pièce la plus CLAIRE du char, ce débord se lisait
     comme une étagère pâle posée sur une chenille noire. Une pente
     avant qui dépasse les chenilles n'existe sur aucun blindé : elle
     s'y casserait au premier fossé. */
  glX:26, glZ:13.5,
  /* la tourelle : un prisme à huit pans, légèrement pyramidal */
  toX:-3, toR:10.6, toRh:8.8, toZ0:20.5, toZ1:29.2,
  /* LE CANON. Trente-six : une fois et demie le premier jet. Il
     dépasse largement le nez du char, comme il doit. */
  caL:36, caR:2.5, caZ:24.5,
  /* la coupole du chef de char, et l'antenne — courte : longue, elle
     se lisait comme un trait perdu au-dessus du char */
  cuX:-7, cuY:4.8, cuR:3.2, cuZ:32, antZ:9,
  /* L'INTERCEPTEUR, sur le pont arrière. TRAPU, et c'est la
     correction du premier jet : des tubes de cinq pixels écartés de
     cinquante degrés faisaient un balai de paille planté sur le char.
     Ce qu'on veut est un BLOC — un tourillon bas, quatre tubes courts
     et serrés — qui se lise comme une pièce d'équipement et non comme
     un accident. */
  inX:-15, inZ0:20.5, inZ1:23.2, inR:4.2, inTete:3.0, inTube:3.2,
  /* la grille du moteur, tout à l'arrière */
  grX0:-22.5, grX1:-17.5, grY:8.5
};

/* ----------------------------------------------------------------
   LE CAMOUFLAGE

   Des taches irrégulières, tirées UNE FOIS à graine fixe — le même
   char pour tous les joueurs, sans qu'un octet passe par le réseau —
   et exprimées en coordonnées (u, v) DANS LE PLAN DE LA FACE, entre
   0 et 1. Au dessin, on les remappe bilinéairement sur les quatre
   coins de la face, puis on projette : la tache est donc peinte SUR
   le blindage et tourne avec lui.

   Elles débordent volontiers de [0, 1] : le découpage à la face s'en
   charge, et c'est ce débordement qui fait qu'une tache court d'une
   plaque à l'autre au lieu de s'arrêter pile au bord.
   ---------------------------------------------------------------- */
var CAMO_TANK = null;
function camoTank(){
  if(CAMO_TANK) return CAMO_TANK;
  var al = prng(0x7A9C3);
  function taches(n, rmin, rmax){
    var out = [], i, k;
    for(i = 0; i < n; i++){
      var cu = -0.15 + al() * 1.3, cv = -0.2 + al() * 1.4;
      var r = rmin + al() * (rmax - rmin);
      var teinte = al();
      var m = 6 + ((al() * 4) | 0);
      var pts = [];
      for(k = 0; k < m; k++){
        var a = k / m * 6.2832;
        var rr = r * (0.55 + al() * 0.75);
        pts.push([cu + Math.cos(a) * rr, cv + Math.sin(a) * rr * 0.75]);
      }
      out.push({ pts:pts, t:teinte < 0.56 ? 0 : 1 });
    }
    return out;
  }
  CAMO_TANK = {
    toit:taches(9, 0.09, 0.20),
    flanc:taches(7, 0.11, 0.24),
    glacis:taches(5, 0.13, 0.28),
    tourelle:taches(6, 0.12, 0.26),
    facette:taches(10, 0.22, 0.48),
    arriere:taches(4, 0.14, 0.30)
  };
  return CAMO_TANK;
}
/* Le remappage bilinéaire : (u, v) dans [0,1]² vers un point du
   repère caisse, à partir des quatre coins de la face donnés dans
   l'ordre (0,0) (1,0) (1,1) (0,1). */
function bilinT(P, u, v){
  var iu = 1 - u, iv = 1 - v, k;
  var o = [0, 0, 0];
  for(k = 0; k < 3; k++)
    o[k] = iu * iv * P[0][k] + u * iv * P[1][k] + u * v * P[2][k] + iu * v * P[3][k];
  return o;
}
/* Peindre le camouflage d'une face, découpé à ses bords. */
/* DEUX REMPLISSAGES, PAS UN PAR TACHE. Les taches n'ont que deux
   teintes ; on les accumule donc par teinte dans un seul chemin. Sept
   remplissages deviennent deux, et le camouflage passe de seize
   millisecondes par image à cinq pour quatorze chars. */
function camoFaceT(c, P, lot, ca, sa, C){
  if(!lot || !lot.length) return;
  var i, k, t, b, p, teinte;
  c.save();
  cheminT(c, P, ca, sa);
  c.clip();
  c.globalAlpha = 0.62;
  for(teinte = 0; teinte < 2; teinte++){
    c.beginPath();
    var rien = true;
    for(i = 0; i < lot.length; i++){
      t = lot[i];
      if((t.t ? 1 : 0) !== teinte) continue;
      rien = false;
      for(k = 0; k < t.pts.length; k++){
        b = bilinT(P, t.pts[k][0], t.pts[k][1]);
        p = ptT(b[0], b[1], b[2], ca, sa);
        if(k === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y);
      }
      c.closePath();
    }
    if(rien) continue;
    c.fillStyle = teinte ? C.camoV : C.camoB;
    c.fill();
  }
  c.restore();
}
/* Une rangée de rivets le long d'une arête du repère caisse. Deux
   pixels chacun, et ils font toute la différence entre une tôle et
   un aplat — c'est le détail le moins cher du fichier. */
/* DEUX CHEMINS, PAS DEUX PAR RIVET. Le premier jet ouvrait un chemin
   et remplissait pour chacun des deux disques de chacun des douze
   rivets : vingt-quatre remplissages là où deux suffisent. Mesuré à
   onze millisecondes par image pour quatorze chars — pour des points
   d'un pixel. On accumule donc tous les creux dans un chemin, toutes
   les têtes dans un autre, et l'on remplit deux fois. */
function rivetsT(c, a, b, n, ca, sa, C){
  var i, f, p;
  c.fillStyle = "rgba(24,22,14,.55)";
  c.beginPath();
  for(i = 0; i <= n; i++){
    f = i / n;
    p = ptT(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f,
            a[2] + (b[2] - a[2]) * f, ca, sa);
    c.moveTo(p.x + 0.72, p.y + 0.35);
    c.arc(p.x, p.y + 0.35, 0.72, 0, 6.2832);
  }
  c.fill();
  c.fillStyle = "rgba(210,206,178,.42)";
  c.beginPath();
  for(i = 0; i <= n; i++){
    f = i / n;
    p = ptT(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f,
            a[2] + (b[2] - a[2]) * f, ca, sa);
    c.moveTo(p.x + 0.62, p.y - 0.25);
    c.arc(p.x, p.y - 0.25, 0.62, 0, 6.2832);
  }
  c.fill();
}
/* Un trait de tôle : la ligne creuse entre deux plaques de blindage. */
function toleT(c, a, b, ca, sa){
  var pa = ptT(a[0], a[1], a[2], ca, sa), pb = ptT(b[0], b[1], b[2], ca, sa);
  c.strokeStyle = "rgba(22,20,12,.42)"; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(pa.x, pa.y); c.lineTo(pb.x, pb.y); c.stroke();
  c.strokeStyle = "rgba(216,212,182,.22)"; c.lineWidth = 0.6;
  c.beginPath(); c.moveTo(pa.x, pa.y - 0.7); c.lineTo(pb.x, pb.y - 0.7); c.stroke();
}

/* ----------------------------------------------------------------
   UNE BOÎTE

   Quatre flancs, un toit. Deux flancs seulement sont visibles à la
   fois, et lesquels se lit au signe de deux sommes. Le toit l'est
   toujours : la caméra est au-dessus.
   ---------------------------------------------------------------- */
function boiteT(c, x0, x1, y0, y1, z0, z1, ca, sa, C){
  var L = C.liseré;
  /* l'avant (normale +x) ou l'arrière (normale -x) */
  if(versNousT(ca, sa))
    faceT(c, [[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]], ca, sa, C.avant, L);
  else
    faceT(c, [[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]], ca, sa, C.arriere, L);
  /* la gauche (normale +y) ou la droite (normale -y) */
  if(versNousT(-sa, ca))
    faceT(c, [[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]], ca, sa, C.flanc, L);
  else
    faceT(c, [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]], ca, sa, C.flanc, L);
  /* le toit */
  faceT(c, [[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]], ca, sa, C.toit, L);
  /* L'ARÊTE DE LUMIÈRE. Un filet clair sur les deux bords du toit qui
     regardent le ciel — c'est-à-dire les deux qui montent vers le haut
     de l'écran. Une seule ligne de plus, et la plaque cesse d'être un
     aplat pour devenir une tôle. */
  areteT(c, [x0,y0,z1], [x1,y0,z1], ca, sa);
  areteT(c, [x0,y0,z1], [x0,y1,z1], ca, sa);
}
/* Une arête n'est éclairée que si elle est du côté qui monte : on
   regarde son milieu, et on ne trace que s'il est du côté éloigné. */
function areteT(c, a, b, ca, sa){
  var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  var wx = mx * ca - my * sa, wy = mx * sa + my * ca;
  if(wx + wy > 0) return;
  var pa = ptT(a[0], a[1], a[2], ca, sa), pb = ptT(b[0], b[1], b[2], ca, sa);
  c.strokeStyle = "rgba(230,236,206,.34)";
  c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(pa.x, pa.y); c.lineTo(pb.x, pb.y); c.stroke();
}

/* ================================================================
   UNE CHENILLE

   Elle porte à elle seule la moitié de ce qui fait « lourd », et
   c'est la pièce qui a demandé le plus de travail. Elle a été refaite
   trois fois ; voici ce que chaque version a appris.

   ────────────────────────────────────────────────────────────────
   PREMIÈRE VERSION : UNE BOÎTE. Un rectangle sombre sous la coque,
   avec des hachures. Trop basse, à demi cachée par une jupe latérale,
   elle se lisait comme un liseré et pas comme une chenille.

   DEUXIÈME VERSION : UNE BOÎTE CHANFREINÉE. Plus haute, plus large,
   avec de gros galets et des tuiles qui défilaient sur trois
   surfaces. Elle avait trois défauts, tous relevés à l'image :

     — LES DEUX CHENILLES N'AVAIENT PAS LA MÊME LARGEUR. Non pas dans
       le modèle — elles y sont rigoureusement symétriques — mais À
       L'ÉCRAN : un garde-boue passait par-dessus le dessus de la
       chenille du FOND, dessinée avant lui, et pas par-dessus celle
       de DEVANT, dessinée après. Trois pixels d'un côté, huit et demi
       de l'autre. Le garde-boue a disparu.

     — LA CHENILLE DU FOND N'AVAIT PAS DE FLANC. Le code sortait dès
       qu'il voyait qu'elle nous tournait le dos, en oubliant que sa
       face INTÉRIEURE, elle, nous regarde — et qu'elle est bien
       visible sous la coque, qui commence plus haut. On voyait donc
       un ruban à plat d'un côté et une chenille complète de l'autre.

     — LES BOUTS N'ÉTAIENT PAS FERMÉS, et ils n'étaient pas ronds. Un
       chanfrein droit à chaque extrémité, et rien pour capoter la
       tranche : la chenille finissait en biseau, comme une planche.

   ────────────────────────────────────────────────────────────────
   TROISIÈME VERSION : UNE CAPSULE EXTRUDÉE, ET UNE SEULE BOUCLE

   Le contour de flanc est une CAPSULE — deux demi-cercles reliés par
   deux droites. C'est la silhouette exacte d'une chenille, et les
   deux bouts sont ronds par construction au lieu d'être chanfreinés.

   Ce contour est ensuite EXTRUDÉ de la face intérieure à la face
   extérieure. La surface latérale du solide obtenu est une suite de
   bandes, une par segment du contour — et cette suite contient TOUT :
   le dessous (jamais visible), les deux arrondis d'extrémité (les
   « faces frontales » qui manquaient), et le dessus plat. Une seule
   boucle les dessine toutes, et chacune n'apparaît que si sa normale
   regarde la caméra. Comme le solide est convexe, ses faces visibles
   pavent sa silhouette sans se recouvrir : aucun tri n'est nécessaire.

   ET SURTOUT : UNE SEULE ABSCISSE CURVILIGNE. Les tuiles ne sont plus
   posées « sur le brin du haut », « sur le brin du bas » et « sur
   l'arc » par trois codes différents qu'il fallait accorder ; elles
   sont posées à intervalles réguliers LE LONG DE LA BOUCLE, dont on
   connaît la longueur. Elles montent donc sur l'avant, passent sur le
   dessus, redescendent à l'arrière et repartent sous le char sans
   jamais s'accumuler ni s'écarter dans les virages — parce que le pas
   est une longueur, et qu'une longueur ne change pas en tournant.

   C'est ce qui donne l'impression demandée : la chenille se DÉROULE.

   `cote` vaut +1 ou -1 : la chenille gauche ou la droite. `defil` est
   la distance parcourue, en pixels — les tuiles s'y accrochent, si
   bien qu'un char à l'arrêt a des chenilles à l'arrêt, et qu'un char
   ralenti par la glu les fait défiler lentement. Aucune horloge
   n'intervient : c'est le DÉPLACEMENT qui anime.
   ================================================================ */
var TK_PAS = 4.4;              // le pas d'une tuile, en pixels

/* Est-ce que cette normale — À TROIS DIMENSIONS, cette fois — regarde
   la caméra ? La direction de vue de cette isométrie est (1, 1, 1) :
   c'est le vecteur que la projection annule (sx = wx − wy s'annule
   quand wx = wy, et sy = (wx + wy)/2 − z s'annule quand z = wx). Une
   face est donc visible si sa normale a un produit scalaire positif
   avec (1, 1, 1). versNousT en est le cas particulier nz = 0. */
function versNous3T(nx, ny, nz, ca, sa){
  return (nx * ca - ny * sa) + (nx * sa + ny * ca) + nz > 0.0001;
}

/* LE CONTOUR DE FLANC, calculé une fois. Deux demi-cercles et deux
   droites, plus la longueur cumulée le long de la boucle : c'est elle
   qui fait courir les tuiles tout autour sans qu'elles s'accumulent
   dans les virages. */
var TK_PROFIL = null;
function profilChenille(){
  if(TK_PROFIL) return TK_PROFIL;
  var Z = TK.chZ, R = Z / 2, X = TK.chX;
  var xa = X - R, xb = -X + R;         // les centres des deux arcs
  var p = [], k, a, N = 7;
  /* l'arc AVANT, du bas vers le haut */
  for(k = 0; k <= N; k++){
    a = -1.5708 + k * (3.1416 / N);
    p.push([xa + Math.cos(a) * R, R + Math.sin(a) * R]);
  }
  /* puis l'arc ARRIÈRE, du haut vers le bas. Les deux segments
     droits — le dessus et le dessous — se ferment tout seuls entre la
     fin d'un arc et le début de l'autre. */
  for(k = 0; k <= N; k++){
    a = 1.5708 + k * (3.1416 / N);
    p.push([xb + Math.cos(a) * R, R + Math.sin(a) * R]);
  }
  var s = [0], L = 0;
  for(k = 1; k <= p.length; k++){
    var q = p[k % p.length], r = p[k - 1];
    L += Math.hypot(q[0] - r[0], q[1] - r[1]);
    s.push(L);
  }
  TK_PROFIL = { p:p, s:s, L:L, R:R, xa:xa, xb:xb };
  return TK_PROFIL;
}

function chenilleT(c, cote, ca, sa, defil, C, detail){
  var PR = profilChenille();
  var Ye = TK.chYe * cote, Yi = TK.chYi * cote;
  var L = C.liseré, k, i;
  /* QUELLE FACE DE FLANC NOUS REGARDE. L'une des deux, toujours : la
     face extérieure de la chenille proche, la face INTÉRIEURE de
     celle du fond. C'est l'oubli de ce second cas qui donnait deux
     chenilles de largeurs différentes. */
  var dehors = versNousT(-sa * cote, ca * cote);
  var yF = dehors ? Ye : Yi;

  /* ---- LA SURFACE DE ROULEMENT, en bandes le long du contour ----
     Dessous, arrondis d'extrémité et dessus : tout y passe, et chaque
     bande n'apparaît que si elle nous regarde. */
  var n = PR.p.length;
  for(i = 0; i < n; i++){
    var a = PR.p[i], b = PR.p[(i + 1) % n];
    var dx = b[0] - a[0], dz = b[1] - a[1];
    var lg = Math.hypot(dx, dz) || 1;
    var nx = dz / lg, nz = -dx / lg;          // la normale sortante
    if(!versNous3T(nx, 0, nz, ca, sa)) continue;
    /* l'éclairement : la lumière vient du haut de l'écran, donc de
       (−1, −1, 2). Une bande qui regarde le ciel est claire, une
       bande qui regarde le sol est presque noire. */
    var wx = nx * ca, wy = nx * sa;
    var lum = 0.42 + 0.58 * Math.max(0, (-(wx + wy) * 0.42 + nz * 0.92));
    /* PAS DE LISERÉ SUR CES BANDES-LÀ. Elles sont jointives et leurs
       teintes se suivent : le contour ne sépare rien qui ait besoin de
       l'être, et il doublait le nombre d'appels de dessin de la pièce
       la plus découpée du char. */
    faceT(c, [[a[0], Yi, a[1]], [b[0], Yi, b[1]], [b[0], Ye, b[1]], [a[0], Ye, a[1]]],
          ca, sa, ecl(C.chenille, 0.72 + lum * 0.86), null);
  }

  /* ---- LES TUILES, tout autour de la boucle ----
     Une par pas de TK_PAS, à l'abscisse curviligne près. Le signe est
     celui qui fait partir le brin SUPÉRIEUR vers l'avant : le contour
     est parcouru de l'avant vers l'arrière sur le dessus, donc les
     tuiles doivent remonter la boucle. */
  if(detail){
    c.save();
    c.strokeStyle = C.maillon;
    c.lineWidth = 1.4;
    c.beginPath();
    var dec = ((-defil % TK_PAS) + TK_PAS) % TK_PAS;
    for(i = 0; i < n; i++){
      var a2 = PR.p[i], b2 = PR.p[(i + 1) % n];
      var dx2 = b2[0] - a2[0], dz2 = b2[1] - a2[1];
      var lg2 = Math.hypot(dx2, dz2) || 1;
      var nx2 = dz2 / lg2, nz2 = -dx2 / lg2;
      if(!versNous3T(nx2, 0, nz2, ca, sa)) continue;
      /* les tuiles qui tombent dans CE segment */
      var s0 = PR.s[i], s1 = PR.s[i + 1];
      var t0 = Math.ceil((s0 - dec) / TK_PAS) * TK_PAS + dec;
      for(var t = t0; t < s1; t += TK_PAS){
        var f = (t - s0) / (s1 - s0);
        var tx = a2[0] + dx2 * f, tz = a2[1] + dz2 * f;
        var q1 = ptT(tx, Yi, tz, ca, sa), q2 = ptT(tx, Ye, tz, ca, sa);
        c.moveTo(q1.x, q1.y); c.lineTo(q2.x, q2.y);
      }
    }
    c.stroke();
    c.restore();
  }

  /* ---- LE FLANC : le contour plein, et ce qu'il porte ---- */
  var flanc = [];
  for(i = 0; i < n; i++) flanc.push([PR.p[i][0], yF, PR.p[i][1]]);
  faceT(c, flanc, ca, sa, dehors ? C.chenilleC : ecl(C.chenilleC, 0.78), L);

  if(!detail) return;

  c.save();
  cheminT(c, flanc, ca, sa);
  c.clip();

  /* LA BANDE DE ROULEMENT vue de flanc : un anneau épais qui suit le
     contour, plus sombre que l'intérieur. C'est lui qui sépare la
     chenille des galets qu'elle enveloppe. */
  c.strokeStyle = C.chenille;
  c.lineWidth = 3.4;
  cheminT(c, flanc, ca, sa);
  c.stroke();
  /* et les tuiles vues de flanc, sur ce même anneau, à la même
     abscisse que celles du dessus : les deux ne peuvent pas se
     désaccorder, elles lisent le même nombre */
  c.strokeStyle = C.maillon;
  c.lineWidth = 1.1;
  c.beginPath();
  var dec2 = ((-defil % TK_PAS) + TK_PAS) % TK_PAS;
  for(i = 0; i < n; i++){
    var a3 = PR.p[i], b3 = PR.p[(i + 1) % n];
    var dx3 = b3[0] - a3[0], dz3 = b3[1] - a3[1];
    var lg3 = Math.hypot(dx3, dz3) || 1;
    var s2 = PR.s[i], s3 = PR.s[i + 1];
    var u0 = Math.ceil((s2 - dec2) / TK_PAS) * TK_PAS + dec2;
    for(var u = u0; u < s3; u += TK_PAS){
      var g = (u - s2) / (s3 - s2);
      var ux = a3[0] + dx3 * g, uz = a3[1] + dz3 * g;
      /* un petit trait vers l'intérieur de la capsule */
      var vx = -dz3 / lg3, vz = dx3 / lg3;         // la normale rentrante
      var w1 = ptT(ux, yF, uz, ca, sa);
      var w2 = ptT(ux + vx * 3.2, yF, uz + vz * 3.2, ca, sa);
      c.moveTo(w1.x, w1.y); c.lineTo(w2.x, w2.y);
    }
  }
  c.stroke();

  /* --- LES GALETS. Sept porteurs, et deux roues d'extrémité plus
     grosses : le barbotin devant, la poulie derrière. Ils sont GROS et
     ils se chevauchent légèrement, comme sur un vrai char. Une rangée
     de petits disques bien espacés se lit comme des rivets. */
  /* NEUF GALETS, QUATRE CHEMINS.

     Le premier jet en ouvrait QUATRE PAR GALET — la jante, le cercle
     clair, le moyeu, les rayons —, soit trente-six chemins pour un
     seul côté d'un seul char, et cinq cents par image pour une
     colonne de quatorze. Mesuré : le poste le plus cher du fichier
     après les dégradés.

     Ils partagent tous les mêmes couleurs : on accumule donc les neuf
     jantes dans un chemin, les neuf cercles dans un autre, les neuf
     moyeux dans un troisième et les vingt-sept rayons dans un
     quatrième. Quatre appels au lieu de trente-six, et l'image est
     rigoureusement la même.

     ET SEULEMENT SUR LE FLANC EXTÉRIEUR : sur la chenille du fond,
     c'est la face intérieure qui nous regarde, et la coque en couvre
     la plus grande partie. */
  if(dehors){
    var yR = yF + cote * 1.0;
    var GAL = [[PR.xb, 4.2, 1]];
    for(i = 0; i < 7; i++) GAL.push([-15 + i * 5.0, 3.4, 0]);
    GAL.push([PR.xa, 4.2, 1]);
    var g2, pg, rg, k2, a4;
    /* les jantes */
    c.beginPath();
    for(g2 = 0; g2 < GAL.length; g2++){
      pg = ptT(GAL[g2][0], yR, PR.R, ca, sa); rg = GAL[g2][1];
      c.moveTo(pg.x + rg, pg.y); c.arc(pg.x, pg.y, rg, 0, 6.2832);
    }
    c.fillStyle = C.roue; c.fill();
    c.strokeStyle = C.maillon; c.lineWidth = 1.0; c.stroke();
    /* le cercle clair qui les détache du flanc */
    c.beginPath();
    for(g2 = 0; g2 < GAL.length; g2++){
      pg = ptT(GAL[g2][0], yR, PR.R, ca, sa); rg = GAL[g2][1] * 0.72;
      c.moveTo(pg.x + rg, pg.y); c.arc(pg.x, pg.y, rg, 0, 6.2832);
    }
    c.strokeStyle = C.roueC; c.lineWidth = 0.9; c.stroke();
    /* les moyeux, et les rayons qui TOURNENT avec le défilement :
       c'est le seul endroit du char où l'on voie quelque chose
       tourner sur lui-même */
    c.beginPath();
    for(g2 = 0; g2 < GAL.length; g2++){
      pg = ptT(GAL[g2][0], yR, PR.R, ca, sa); rg = GAL[g2][1] * 0.30;
      c.moveTo(pg.x + rg, pg.y); c.arc(pg.x, pg.y, rg, 0, 6.2832);
    }
    c.fillStyle = C.moyeu; c.fill();
    c.beginPath();
    for(g2 = 0; g2 < GAL.length; g2++){
      pg = ptT(GAL[g2][0], yR, PR.R, ca, sa); rg = GAL[g2][1];
      var ang = -defil / rg * (GAL[g2][2] ? 1 : 1.28);
      for(k2 = 0; k2 < 3; k2++){
        a4 = ang + k2 * 2.0944;
        c.moveTo(pg.x + Math.cos(a4) * rg * 0.34, pg.y + Math.sin(a4) * rg * 0.34);
        c.lineTo(pg.x + Math.cos(a4) * rg * 0.66, pg.y + Math.sin(a4) * rg * 0.66);
      }
    }
    c.strokeStyle = C.moyeu; c.lineWidth = 0.85; c.stroke();
  }

  /* LA BOUE, au ras du sol. Une chenille propre est une chenille qui
     n'a jamais roulé ; celle-ci traverse une île. Un simple dégradé
     au bas du flanc, et l'acier cesse d'être neuf. */
  var bl = ptT(0, yF, 0, ca, sa), bh = ptT(0, yF, TK.chZ * 0.55, ca, sa);
  var gb = c.createLinearGradient(0, bh.y, 0, bl.y + 2);
  gb.addColorStop(0, "rgba(106,92,60,0)");
  gb.addColorStop(1, "rgba(106,92,60,.44)");
  c.fillStyle = gb;
  cheminT(c, flanc, ca, sa); c.fill();
  c.restore();
}

/* ----------------------------------------------------------------
   LA TOURELLE ET SON CANON

   Elle a son PROPRE angle, et c'est tout l'intérêt. `at` est son cap
   absolu ; celui de la caisse ne sert plus ici.

   Le canon passe DERRIÈRE la tourelle quand il pointe à l'opposé de
   la caméra. Sans ce test, un char qui vise vers le fond posait son
   canon par-dessus sa propre tourelle — un tuyau collé sur un dôme,
   et le volume s'effondrait.
   ---------------------------------------------------------------- */
function tourelleT(c, at, recul, C, insigne, detail){
  var cat = Math.cos(at), sat = Math.sin(at);
  var R = TK.toR, Rh = TK.toRh, Z0 = TK.toZ0, Z1 = TK.toZ1;
  var L = C.liseré;
  var k, CA = camoTank();

  /* le canon, s'il pointe vers le fond : d'abord, donc dessous */
  var enAvant = versNousT(cat, sat);
  if(!enAvant) canonT(c, cat, sat, recul, C);

  /* LES HUIT PANS. Une face du prisme est visible si sa normale
     regarde la caméra ; le sommet, lui, l'est toujours. */
  for(k = 0; k < 8; k++){
    var a0 = at + k * 0.7854, a1 = at + (k + 1) * 0.7854;
    var an = at + (k + 0.5) * 0.7854;
    if(!versNousT(Math.cos(an), Math.sin(an))) continue;
    /* le pan est légèrement fuyant : le haut est plus étroit que le
       bas, ce qui fait une tourelle et non un tuyau */
    var P = [[TK.toX + Math.cos(a0) * R,  Math.sin(a0) * R,  Z0],
             [TK.toX + Math.cos(a1) * R,  Math.sin(a1) * R,  Z0],
             [TK.toX + Math.cos(a1) * Rh, Math.sin(a1) * Rh, Z1],
             [TK.toX + Math.cos(a0) * Rh, Math.sin(a0) * Rh, Z1]];
    /* les pans qui regardent le ciel prennent la lumière : celui dont
       la normale pointe vers le haut de l'écran est le plus clair */
    var lum = 0.5 + 0.5 * (-(Math.cos(an) + Math.sin(an)) / 1.4142);
    faceT(c, P, 1, 0, ecl(C.tourelle, 0.80 + lum * 0.42), L);
  }
  /* le toit de la tourelle */
  var toit = [];
  for(k = 0; k < 8; k++){
    var a = at + k * 0.7854;
    toit.push([TK.toX + Math.cos(a) * Rh, Math.sin(a) * Rh, Z1]);
  }
  faceT(c, toit, 1, 0, C.tourelleT, L);
  if(detail){
    camoFaceT(c, [toit[7], toit[1], toit[3], toit[5]], CA.tourelle, 1, 0, C);
    /* les rivets du tour de tourelle : une couronne de points sur le
       bord du toit, qui tourne avec elle */
    for(k = 0; k < 16; k++){
      var ar = at + k * 0.3927;
      var pr2 = ptT(TK.toX + Math.cos(ar) * (Rh - 1.1), Math.sin(ar) * (Rh - 1.1), Z1, 1, 0);
      c.fillStyle = "rgba(24,22,14,.45)";
      c.beginPath(); c.arc(pr2.x, pr2.y + 0.3, 0.65, 0, 6.2832); c.fill();
      c.fillStyle = "rgba(216,212,178,.34)";
      c.beginPath(); c.arc(pr2.x, pr2.y - 0.2, 0.55, 0, 6.2832); c.fill();
    }
  }

  /* LE MASQUE DE CANON — la pièce épaisse à l'avant de la tourelle,
     dans laquelle le tube coulisse. C'est elle qui rend le canon
     crédible : un tube qui sort d'un dôme lisse a l'air planté. */
  var mx = TK.toX + cat * (R - 0.5), my = sat * (R - 0.5);
  var pm = ptT(mx, my, TK.caZ, cat, sat);
  c.save();
  c.translate(pm.x, pm.y);
  c.fillStyle = ecl(C.tourelle, 1.12);
  c.strokeStyle = L; c.lineWidth = 0.7;
  c.beginPath(); c.ellipse(0, 0, 5.0, 4.4, 0, 0, 6.2832); c.fill(); c.stroke();
  c.restore();

  /* le canon, s'il pointe vers nous : par-dessus */
  if(enAvant) canonT(c, cat, sat, recul, C);

  /* LA COUPOLE DU CHEF DE CHAR, décalée à gauche derrière — et
     l'antenne, un trait de rien du tout qui ajoute quinze pixels de
     silhouette et beaucoup de crédibilité. */
  var cx = TK.toX + Math.cos(at) * TK.cuX - Math.sin(at) * TK.cuY;
  var cy = Math.sin(at) * TK.cuX + Math.cos(at) * TK.cuY;
  var pc0 = ptT(cx, cy, Z1, 1, 0), pc1 = ptT(cx, cy, TK.cuZ, 1, 0);
  c.fillStyle = ecl(C.tourelle, 0.88);
  c.strokeStyle = L; c.lineWidth = 0.7;
  c.beginPath();
  c.moveTo(pc0.x - TK.cuR, pc0.y);
  c.lineTo(pc0.x - TK.cuR, pc1.y);
  c.lineTo(pc0.x + TK.cuR, pc1.y);
  c.lineTo(pc0.x + TK.cuR, pc0.y);
  c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(pc1.x, pc1.y, TK.cuR, TK.cuR * 0.52, 0, 0, 6.2832);
  c.fillStyle = C.tourelleT; c.fill(); c.stroke();

  /* l'antenne : elle plie, elle ne monte pas droit */
  var ax = TK.toX + Math.cos(at) * (-R + 1.5) - Math.sin(at) * (-R + 3);
  var ay = Math.sin(at) * (-R + 1.5) + Math.cos(at) * (-R + 3);
  var pa = ptT(ax, ay, Z1, 1, 0);
  c.strokeStyle = "rgba(28,26,16,.9)"; c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(pa.x, pa.y);
  c.quadraticCurveTo(pa.x + 1.5, pa.y - TK.antZ * 0.6, pa.x + 4.2, pa.y - TK.antZ);
  c.stroke();

  /* L'INSIGNE, sur la joue de tourelle qui nous fait face : le seul
     rouge du char. Il ne se voit que de trois quarts, comme un vrai. */
  if(insigne){
    var ai = at + 1.9635;                 // 112,5° : le pan avant-gauche
    if(!versNousT(Math.cos(ai), Math.sin(ai))) ai = at - 1.9635;
    if(versNousT(Math.cos(ai), Math.sin(ai))){
      var ix = TK.toX + Math.cos(ai) * (R - 0.6), iy = Math.sin(ai) * (R - 0.6);
      var pi = ptT(ix, iy, (Z0 + Z1) / 2, 1, 0);
      c.fillStyle = C.rouge;
      c.beginPath(); c.arc(pi.x, pi.y, 2.2, 0, 6.2832); c.fill();
      c.fillStyle = C.laitonC;
      c.beginPath(); c.arc(pi.x, pi.y, 1.0, 0, 6.2832); c.fill();
    }
  }
}

/* Le tube. Un cylindre vu de biais ne change presque pas d'épaisseur
   quand il tourne — mais il RACCOURCIT, et jusqu'à disparaître quand
   il pointe la caméra. La projection s'en charge toute seule ; le bout
   arrondi fait le reste, et le canon devient un disque au lieu d'un
   trait tordu. */
function canonT(c, cat, sat, recul, C){
  var d0 = TK.toR - 1.5 - recul * 5.5;       // le recul fait rentrer le tube
  var d1 = d0 + TK.caL;
  var b = ptT(TK.toX + cat * d0, sat * d0, TK.caZ, 1, 0);
  var t = ptT(TK.toX + cat * d1, sat * d1, TK.caZ, 1, 0);
  c.lineCap = "round";
  /* l'ombre du tube, puis le tube, puis le filet de lumière dessus :
     trois traits de largeurs décroissantes, et le cylindre est là */
  c.strokeStyle = C.canonO; c.lineWidth = TK.caR * 2 + 1.4;
  c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(t.x, t.y); c.stroke();
  c.strokeStyle = C.canon;  c.lineWidth = TK.caR * 2;
  c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(t.x, t.y); c.stroke();
  c.strokeStyle = C.canonC; c.lineWidth = TK.caR * 0.62;
  c.beginPath();
  c.moveTo(b.x, b.y - TK.caR * 0.5); c.lineTo(t.x, t.y - TK.caR * 0.5);
  c.stroke();
  /* LE MANCHON D'ÉVACUATION, au tiers du tube : le renflement qui dit
     qu'on regarde un canon de char moderne et non un tuyau. */
  var m0 = ptT(TK.toX + cat * (d0 + TK.caL * 0.34), sat * (d0 + TK.caL * 0.34), TK.caZ, 1, 0);
  var m1 = ptT(TK.toX + cat * (d0 + TK.caL * 0.52), sat * (d0 + TK.caL * 0.52), TK.caZ, 1, 0);
  c.strokeStyle = C.canonO; c.lineWidth = TK.caR * 3.0;
  c.beginPath(); c.moveTo(m0.x, m0.y); c.lineTo(m1.x, m1.y); c.stroke();
  c.strokeStyle = ecl(C.canon, 1.10); c.lineWidth = TK.caR * 2.5;
  c.beginPath(); c.moveTo(m0.x, m0.y); c.lineTo(m1.x, m1.y); c.stroke();
  /* LE FREIN DE BOUCHE : un manchon plus large au bout. C'est le
     détail qui fait qu'on lit « canon de char » et non « tuyau ». */
  var f0 = ptT(TK.toX + cat * (d1 - 4.4), sat * (d1 - 4.4), TK.caZ, 1, 0);
  c.strokeStyle = C.canonO; c.lineWidth = TK.caR * 3.0;
  c.beginPath(); c.moveTo(f0.x, f0.y); c.lineTo(t.x, t.y); c.stroke();
  c.strokeStyle = ecl(C.canon, 1.18); c.lineWidth = TK.caR * 2.4;
  c.beginPath(); c.moveTo(f0.x, f0.y); c.lineTo(t.x, t.y); c.stroke();
  /* la bouche, noire */
  c.fillStyle = "#0c0f08";
  c.beginPath(); c.arc(t.x, t.y, TK.caR * 0.85, 0, 6.2832); c.fill();
}

/* ================================================================
   L'INTERCEPTEUR

   « À l'arrière, un intercepteur qui explose les roquettes des
   Frelons. »

   Un tourillon à quatre tubes sur le pont arrière. Il a SON angle,
   distinct des deux autres : en veille il balaye lentement, et
   lorsqu'une roquette arrive il se braque dessus. Trois pièces qui
   tournent chacune de son côté sur le même véhicule, c'est ce qui
   fait qu'un char a l'air d'un engin et non d'une figurine.

   Il est volontairement d'un GRIS plus froid que le kaki de la
   coque : ce n'est pas la même génération de matériel, il a été
   ajouté après, et ça doit se voir.
   ================================================================ */
function intercepteurT(c, ai, feu, C){
  var L = C.liseré;
  var cai = Math.cos(ai), sai = Math.sin(ai), k;
  var X = TK.inX, Z0 = TK.inZ0, Z1 = TK.inZ1, R = TK.inR;

  /* le socle : un tambour à huit pans, fixe */
  for(k = 0; k < 8; k++){
    var a0 = k * 0.7854, a1 = (k + 1) * 0.7854, an = (k + 0.5) * 0.7854;
    if(!versNousT(Math.cos(an), Math.sin(an))) continue;
    faceT(c, [[X + Math.cos(a0) * R, Math.sin(a0) * R, Z0],
              [X + Math.cos(a1) * R, Math.sin(a1) * R, Z0],
              [X + Math.cos(a1) * R, Math.sin(a1) * R, Z1],
              [X + Math.cos(a0) * R, Math.sin(a0) * R, Z1]],
          1, 0, C.interO, L);
  }
  var socle = [];
  for(k = 0; k < 8; k++)
    socle.push([X + Math.cos(k * 0.7854) * R, Math.sin(k * 0.7854) * R, Z1]);
  faceT(c, socle, 1, 0, C.inter, L);

  /* LA TÊTE, qui tourne. Un bloc bas, quatre tubes vers l'avant, et
     une plaque de veille — le petit radar — sur le côté. */
  var T = TK.inTete, Zt = Z1 + 3.2;
  for(k = 0; k < 6; k++){
    var b0 = ai + k * 1.0472, b1 = ai + (k + 1) * 1.0472, bn = ai + (k + 0.5) * 1.0472;
    if(!versNousT(Math.cos(bn), Math.sin(bn))) continue;
    faceT(c, [[X + Math.cos(b0) * T, Math.sin(b0) * T, Z1],
              [X + Math.cos(b1) * T, Math.sin(b1) * T, Z1],
              [X + Math.cos(b1) * T, Math.sin(b1) * T, Zt],
              [X + Math.cos(b0) * T, Math.sin(b0) * T, Zt]],
          1, 0, C.inter, L);
  }
  var tete = [];
  for(k = 0; k < 6; k++)
    tete.push([X + Math.cos(ai + k * 1.0472) * T, Math.sin(ai + k * 1.0472) * T, Zt]);
  faceT(c, tete, 1, 0, C.interC, L);

  /* LES QUATRE TUBES, en éventail serré vers l'avant de la tête. Ils
     sont courts et gros : ce ne sont pas des missiles, ce sont des
     charges qui font éclater une roquette à trois mètres. */
  c.lineCap = "butt";
  for(k = 0; k < 4; k++){
    var e = (k - 1.5) * 0.155;
    var ax = X + Math.cos(ai + e) * (T - 1.4), ay = Math.sin(ai + e) * (T - 1.4);
    var bx = X + Math.cos(ai + e) * (T + TK.inTube), by = Math.sin(ai + e) * (T + TK.inTube);
    var pa = ptT(ax, ay, Zt - 1.6, 1, 0), pb = ptT(bx, by, Zt - 1.0, 1, 0);
    c.strokeStyle = C.interO; c.lineWidth = 2.0;
    c.beginPath(); c.moveTo(pa.x, pa.y); c.lineTo(pb.x, pb.y); c.stroke();
    c.strokeStyle = C.interC; c.lineWidth = 0.9;
    c.beginPath(); c.moveTo(pa.x, pa.y - 0.45); c.lineTo(pb.x, pb.y - 0.45); c.stroke();
    /* la bouche du tube, noire : quatre points sombres alignés, et on
       lit « lanceur » au lieu de « tiges » */
    c.fillStyle = "#0e100c";
    c.beginPath(); c.arc(pb.x, pb.y, 0.75, 0, 6.2832); c.fill();
  }
  c.lineCap = "round";
  /* la petite plaque de veille, à l'arrière de la tête : elle tourne
     avec elle et donne à la pièce un avant et un arrière */
  var rx = X + Math.cos(ai + 3.1416) * (T - 0.6), ry = Math.sin(ai + 3.1416) * (T - 0.6);
  var pr = ptT(rx, ry, Zt + 1.3, 1, 0);
  c.fillStyle = C.interC; c.strokeStyle = L; c.lineWidth = 0.6;
  c.beginPath(); c.ellipse(pr.x, pr.y, 1.9, 2.5, 0.35, 0, 6.2832); c.fill(); c.stroke();

  /* LE DÉPART D'UNE CHARGE : une lueur courte au bout des tubes. */
  if(feu > 0){
    var fx = X + Math.cos(ai) * (T + TK.inTube + 1.5), fy = Math.sin(ai) * (T + TK.inTube + 1.5);
    var pf = ptT(fx, fy, Zt - 0.4, 1, 0);
    c.save();
    c.globalCompositeOperation = "lighter";
    var r2 = 3 + (1 - feu) * 6;
    var g = c.createRadialGradient(pf.x, pf.y, 0, pf.x, pf.y, r2);
    g.addColorStop(0, "rgba(" + C.interFeu + "," + (0.9 * feu) + ")");
    g.addColorStop(1, "rgba(255,150,40,0)");
    c.fillStyle = g;
    c.beginPath(); c.arc(pf.x, pf.y, r2, 0, 6.2832); c.fill();
    c.restore();
  }
}

/* ----------------------------------------------------------------
   LA PALETTE BRÛLÉE, celle de l'épave. Toutes les teintes du char
   passées au noir de fumée, une fois pour toutes : c'est le même
   dessin qui sert, dans une autre couleur. Refaire un dessin d'épave
   à part aurait donné, tôt ou tard, deux chars qui ne se ressemblent
   plus.
   ---------------------------------------------------------------- */
var C_TANK_BRULE = null;
function paletteBruleeTank(){
  if(C_TANK_BRULE) return C_TANK_BRULE;
  C_TANK_BRULE = {};
  for(var k in C_TANK){
    var v = C_TANK[k];
    C_TANK_BRULE[k] = (typeof v === "string" && v.charAt(0) === "#") ? ecl(v, 0.32) : v;
  }
  /* la suie du moteur, plus noire que le reste, et plus d'insigne :
     il a brûlé avec la peinture */
  C_TANK_BRULE.chenille = "#16150f";
  C_TANK_BRULE.maillon = "#0c0b07";
  C_TANK_BRULE.phare = "#3a352c";
  C_TANK_BRULE.laiton = "#5c4d28";
  C_TANK_BRULE.camoV = "#22261a";
  C_TANK_BRULE.camoB = "#2c261a";
  return C_TANK_BRULE;
}

/* ================================================================
   LE CHAR ENTIER

   `ab`    cap de la caisse
   `at`    cap de la tourelle
   `ai`    cap de l'intercepteur
   `defil` distance parcourue, qui anime les chenilles
   `recul` la sortie du coup (1 → 0)
   `flash` la lueur de bouche (1 → 0)
   `abime` de 0 à 1 : les traces de coups
   `brule` l'épave
   `detail` 0 au loin : camouflage, rivets et boue sont coupés — à
           z < 0,5 un rivet fait un tiers de pixel et ne coûte que du
           temps de tablette
   `feuI`  le départ d'une charge d'interception (1 → 0)
   ================================================================ */
function charTank(c, ab, at, defil, recul, flash, abime, brule, detail, ai, feuI){
  var C = brule ? paletteBruleeTank() : C_TANK;
  var ca = Math.cos(ab), sa = Math.sin(ab);
  var L = C.liseré, q;
  var CA = camoTank();
  if(detail === undefined) detail = 1;
  if(ai === undefined) ai = ab + 2.4;

  /* L'OMBRE PORTÉE, et c'est l'empreinte des chenilles, pas une
     ellipse : un char est rectangulaire, son ombre aussi, et elle
     tourne avec lui. */
  c.fillStyle = "rgba(0,0,0,.22)";
  c.beginPath();
  var emp = [[-TK.chX, -TK.chYe], [TK.chX, -TK.chYe],
             [TK.chX, TK.chYe], [-TK.chX, TK.chYe]];
  for(q = 0; q < 4; q++){
    var pe = ptT(emp[q][0], emp[q][1], 0, ca, sa);
    if(q === 0) c.moveTo(pe.x + 2.0, pe.y + 1.2); else c.lineTo(pe.x + 2.0, pe.y + 1.2);
  }
  c.closePath(); c.fill();

  /* LE RECUL DU CHAR ENTIER. Le canon rentre dans son masque, et la
     masse recule d'un cheveu sur ses suspensions — deux pixels.
     Sans ce mouvement-là, un canon de char tire comme une carabine. */
  c.save();
  var pr = ptT(-recul * 2.0, 0, 0, Math.cos(at), Math.sin(at));
  c.translate(pr.x, pr.y);

  /* la chenille du fond, la coque, puis celle de devant : le seul
     ordre qui compte, et il se lit au signe de (ca - sa). */
  var gaucheDevant = versNousT(-sa, ca);
  chenilleT(c, gaucheDevant ? -1 : 1, ca, sa, defil, C, detail);

  /* --- LA COQUE ------------------------------------------------- */
  var teintes = {
    avant:ecl(C.coque, 1.14), arriere:C.coqueO,
    flanc:gaucheDevant ? ecl(C.coque, 1.02) : ecl(C.coque, 0.88),
    toit:C.toit, liseré:L
  };
  boiteT(c, TK.coX0, TK.coX1, -TK.coY, TK.coY, TK.coZ0, TK.coZ1, ca, sa, teintes);

  /* LE CAMOUFLAGE DE LA COQUE : le toit et le flanc visible. Il est
     posé APRÈS la boîte et AVANT le glacis, donc il ne déborde ni sur
     les chenilles ni sur la pente avant, qui ont les leurs. */
  var cj = gaucheDevant ? 1 : -1;
  if(detail){
    camoFaceT(c, [[TK.coX0, -TK.coY, TK.coZ1], [TK.coX1, -TK.coY, TK.coZ1],
                  [TK.coX1, TK.coY, TK.coZ1], [TK.coX0, TK.coY, TK.coZ1]],
              CA.toit, ca, sa, C);
    camoFaceT(c, [[TK.coX0, cj * TK.coY, TK.coZ0], [TK.coX1, cj * TK.coY, TK.coZ0],
                  [TK.coX1, cj * TK.coY, TK.coZ1], [TK.coX0, cj * TK.coY, TK.coZ1]],
              CA.flanc, ca, sa, C);
    /* LA BOUE AU BAS DE CAISSE. Un char qui traverse une île en
       ramasse ; sans elle, le blindage a l'air sorti d'usine. */
    c.save();
    cheminT(c, [[TK.coX0, cj * TK.coY, TK.coZ0], [TK.coX1, cj * TK.coY, TK.coZ0],
                [TK.coX1, cj * TK.coY, TK.coZ1], [TK.coX0, cj * TK.coY, TK.coZ1]], ca, sa);
    c.clip();
    var bz0 = ptT(0, cj * TK.coY, TK.coZ0, ca, sa);
    var bz1 = ptT(0, cj * TK.coY, TK.coZ0 + 5, ca, sa);
    var gb2 = c.createLinearGradient(0, bz1.y, 0, bz0.y);
    gb2.addColorStop(0, "rgba(106,92,60,0)");
    gb2.addColorStop(1, "rgba(106,92,60,.40)");
    c.fillStyle = gb2;
    cheminT(c, [[TK.coX0, cj * TK.coY, TK.coZ0], [TK.coX1, cj * TK.coY, TK.coZ0],
                [TK.coX1, cj * TK.coY, TK.coZ1], [TK.coX0, cj * TK.coY, TK.coZ1]], ca, sa);
    c.fill();
    c.restore();
    /* les rivets du flanc, en deux rangées, et la ligne de tôle */
    rivetsT(c, [TK.coX0 + 2, cj * TK.coY, TK.coZ0 + 1.4],
               [TK.coX1 - 2, cj * TK.coY, TK.coZ0 + 1.4], 11, ca, sa, C);
    toleT(c, [TK.coX0 + 1, cj * TK.coY, TK.coZ1 - 3.0],
             [TK.coX1 - 1, cj * TK.coY, TK.coZ1 - 3.0], ca, sa);
    /* deux lignes de tôle sur le toit, en travers : elles disent la
       largeur du char, ce que rien d'autre ne fait */
    toleT(c, [-6, -TK.coY, TK.coZ1], [-6, TK.coY, TK.coZ1], ca, sa);
    toleT(c, [12, -TK.coY, TK.coZ1], [12, TK.coY, TK.coZ1], ca, sa);
  }

  /* LE GLACIS : la plaque avant inclinée. Deux quadrilatères — la
     pente elle-même et le nez qui la termine. C'est la pièce qui fait
     passer le char de « caisse à savon » à « blindé ». */
  var G = [[TK.coX1, -TK.coY, TK.coZ1], [TK.glX, -TK.coY, TK.glZ],
           [TK.glX, TK.coY, TK.glZ], [TK.coX1, TK.coY, TK.coZ1]];
  faceT(c, G, ca, sa, ecl(C.coque, 1.12), L);
  if(detail) camoFaceT(c, G, CA.glacis, ca, sa, C);
  if(versNousT(ca, sa))
    faceT(c, [[TK.glX, -TK.coY, TK.glZ], [TK.glX, TK.coY, TK.glZ],
              [TK.glX, TK.coY, TK.coZ0], [TK.glX, -TK.coY, TK.coZ0]],
          ca, sa, ecl(C.coque, 0.94), L);
  /* la plaque arrière, en pente douce */
  var AR = [[TK.coX0, -TK.coY, TK.coZ1], [TK.coX0 - 4, -TK.coY, TK.glZ + 1],
            [TK.coX0 - 4, TK.coY, TK.glZ + 1], [TK.coX0, TK.coY, TK.coZ1]];
  faceT(c, AR, ca, sa, C.coqueN, L);
  if(detail) camoFaceT(c, AR, CA.arriere, ca, sa, C);

  /* PAS DE GARDE-BOUE, ET PAS DE JUPES LATÉRALES.

     Les deux ont été essayés, et les deux ont été retirés pour la
     même raison : ils mangent la chenille.

     Les JUPES, d'abord — de belles plaques qui pendaient au-dessus
     des chenilles. Elles les cachaient entièrement.

     Puis les GARDE-BOUE, de simples tôles horizontales. Plus subtils,
     et bien pires, parce que leur défaut ne se voyait pas là où on le
     cherchait : ils passaient par-dessus le dessus de la chenille du
     FOND, dessinée avant eux, mais pas par-dessus celle de DEVANT,
     dessinée après. Résultat à l'écran : une grosse chenille d'un
     côté, une petite de l'autre, alors que le modèle était
     parfaitement symétrique. Le défaut n'était pas dans la chenille,
     il était dans l'ORDRE DE DESSIN — et c'est le genre de faute
     qu'on ne trouve qu'en regardant l'image.

     La coque pose donc directement sur les chenilles, et les deux se
     voient entières. */

  /* --- LE TOIT, HABILLÉ. Un toit nu se lit comme un couvercle : il
     lui faut sa grille de moteur, ses prises de laiton, et surtout LA
     COURONNE — le cercle sur lequel la tourelle pivote. C'est elle,
     la couronne, qui rend la rotation LISIBLE : sans un repère fixe
     dessous, une tourelle qui tourne ne tourne par rapport à rien. */
  var pcou = ptT(TK.toX, 0, TK.coZ1, ca, sa);
  c.save();
  c.translate(pcou.x, pcou.y);
  c.strokeStyle = C.coqueN; c.lineWidth = 1.3;
  c.beginPath(); c.ellipse(0, 0, TK.toR + 1.2, (TK.toR + 1.2) * 0.5, 0, 0, 6.2832); c.stroke();
  c.strokeStyle = ecl(C.toit, 1.2); c.lineWidth = 0.6;
  c.beginPath(); c.ellipse(0, -0.5, TK.toR + 1.2, (TK.toR + 1.2) * 0.5, 0, 0, 6.2832); c.stroke();
  c.restore();
  /* la grille du moteur, à l'arrière du toit */
  c.save();
  var GR = [[TK.grX0, -TK.grY, TK.coZ1], [TK.grX1, -TK.grY, TK.coZ1],
            [TK.grX1, TK.grY, TK.coZ1], [TK.grX0, TK.grY, TK.coZ1]];
  cheminT(c, GR, ca, sa);
  c.fillStyle = C.coqueO; c.fill();
  c.clip();
  c.strokeStyle = C.coqueN; c.lineWidth = 0.8;
  c.beginPath();
  for(var b2 = -TK.grY; b2 <= TK.grY; b2 += 1.9){
    var s1 = ptT(TK.grX0, b2, TK.coZ1, ca, sa);
    var s2 = ptT(TK.grX1, b2, TK.coZ1, ca, sa);
    c.moveTo(s1.x, s1.y); c.lineTo(s2.x, s2.y);
  }
  c.stroke();
  c.restore();
  cheminT(c, GR, ca, sa);
  c.strokeStyle = L; c.lineWidth = 0.7; c.stroke();

  /* deux prises de laiton sur le glacis, et les phares */
  c.fillStyle = C.laiton;
  var ph1 = ptT(TK.glX - 3.0, -TK.coY + 2.6, TK.glZ + 2.6, ca, sa);
  var ph2 = ptT(TK.glX - 3.0, TK.coY - 2.6, TK.glZ + 2.6, ca, sa);
  c.beginPath(); c.arc(ph1.x, ph1.y, 1.7, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(ph2.x, ph2.y, 1.7, 0, 6.2832); c.fill();
  if(versNousT(ca, sa)){
    c.fillStyle = C.phare;
    c.beginPath(); c.arc(ph1.x, ph1.y, 0.95, 0, 6.2832); c.fill();
    c.beginPath(); c.arc(ph2.x, ph2.y, 0.95, 0, 6.2832); c.fill();
  }
  /* les poignées de laiton du toit : deux U qui accrochent la lumière */
  if(detail){
    c.strokeStyle = C.laiton; c.lineWidth = 1.0;
    for(q = 0; q < 2; q++){
      var hx = 4 + q * 8, hy = (q ? 1 : -1) * 6.5;
      var h1 = ptT(hx - 2, hy, TK.coZ1, ca, sa), h2 = ptT(hx + 2, hy, TK.coZ1, ca, sa);
      c.beginPath();
      c.moveTo(h1.x, h1.y); c.quadraticCurveTo((h1.x + h2.x) / 2, h1.y - 2.4, h2.x, h2.y);
      c.stroke();
    }
  }

  /* L'INTERCEPTEUR, sur le pont arrière — avant la chenille proche,
     donc elle peut lui passer devant si elle est plus au sud. */
  intercepteurT(c, ai, feuI || 0, C);

  chenilleT(c, gaucheDevant ? 1 : -1, ca, sa, defil, C, detail);

  /* --- LA TOURELLE, avec son propre cap ------------------------- */
  tourelleT(c, at, recul, C, !brule, detail);

  /* LE DÉPART DU COUP. Une étoile de bouche, une onde de gaz, et
     trois éclats — le tout ancré à la BOUCHE DU TUBE, donc il tourne
     avec la tourelle et recule avec le canon. */
  if(flash > 0){
    var cat = Math.cos(at), sat = Math.sin(at);
    var dbouche = TK.toR - 1.5 - recul * 5.5 + TK.caL;
    var pb = ptT(TK.toX + cat * dbouche, sat * dbouche, TK.caZ, 1, 0);
    c.save();
    c.globalCompositeOperation = "lighter";
    var r = 6 + (1 - flash) * 10;
    var g = c.createRadialGradient(pb.x, pb.y, 0, pb.x, pb.y, r * 2.2);
    g.addColorStop(0, "rgba(255,248,214," + (0.95 * flash) + ")");
    g.addColorStop(0.32, "rgba(255,190,90," + (0.62 * flash) + ")");
    g.addColorStop(1, "rgba(255,120,30,0)");
    c.fillStyle = g;
    c.beginPath(); c.arc(pb.x, pb.y, r * 2.2, 0, 6.2832); c.fill();
    /* L'ÉTOILE, discrète. Le premier réglage la faisait deux fois
       plus longue et deux fois plus opaque : on ne voyait plus un
       départ de coup mais un cône de papier blanc collé au canon.
       Ce qui fait une bouche à feu est la LUEUR qui l'entoure ; le
       cœur ne doit qu'en marquer le centre. */
    c.fillStyle = "rgba(255,244,206," + (0.62 * flash) + ")";
    c.beginPath();
    var ax2 = ptT(cat, sat, 0, 1, 0);            // l'axe du tube, à l'écran
    var na = Math.hypot(ax2.x, ax2.y) || 1;
    var ux = ax2.x / na, uy = ax2.y / na, vx = -uy, vy = ux;
    var lo = r * 1.15, la = r * 0.40;
    c.moveTo(pb.x + ux * lo, pb.y + uy * lo);
    c.lineTo(pb.x + vx * la, pb.y + vy * la);
    c.lineTo(pb.x - ux * lo * 0.42, pb.y - uy * lo * 0.42);
    c.lineTo(pb.x - vx * la, pb.y - vy * la);
    c.closePath(); c.fill();
    c.restore();
  }

  /* LES BLESSURES. Un char à moitié détruit ne doit pas être un char
     neuf avec une barre de vie plus courte : sa peinture est
     arrachée. Deux traits, et l'information passe. */
  if(abime > 0){
    c.save();
    c.globalAlpha = Math.min(0.8, abime);
    c.strokeStyle = "#191308"; c.lineWidth = 1.6; c.lineCap = "round";
    var e1 = ptT(4, cj * TK.coY, TK.coZ1 - 1, ca, sa);
    var e2 = ptT(-8, cj * TK.coY, TK.coZ0 + 2, ca, sa);
    c.beginPath(); c.moveTo(e1.x, e1.y);
    c.quadraticCurveTo(e1.x - 3, e1.y + 3, e2.x, e2.y); c.stroke();
    var e3 = ptT(TK.glX - 6, cj * (TK.coY - 3), TK.glZ + 3, ca, sa);
    c.beginPath(); c.arc(e3.x, e3.y, 2.0, 0, 6.2832);
    c.fillStyle = "rgba(25,19,8,.7)"; c.fill();
    c.restore();
  }
  c.restore();
}

/* ----------------------------------------------------------------
   LE CHAR DANS LE MONDE

   Appelé par dessineUniteMonde, qui lui laisse la main entière : le
   TX-90 est la seule troupe qui ne soit PAS retournée par un
   c.scale(-1, 1). Un char n'a pas deux profils, il en a une infinité.
   ---------------------------------------------------------------- */
function dessineTankMonde(c, u, tps){
  var p = versEcran(cam, u.gx, u.gy);
  var z = cam.z;
  c.save();
  if(u.cachee) c.globalAlpha = 0.42;
  c.translate(p.x, p.y);
  c.scale(z, z);
  /* LE SEUIL DE DÉTAIL. À z < 0,5 un rivet fait un tiers de pixel et
     une tache de camouflage deux : ils ne coûtent que du temps de
     tablette. C'est la seule concession de ce fichier à la
     performance, et elle est invisible. */
  charTank(c, u.angBase || 0, u.angTour || 0, u.chenille || 0,
           Math.max(0, u.recul || 0), Math.max(0, u.flash || 0),
           1 - (u.pv / u.pvMax), 0, z >= 0.5 ? 1 : 0,
           u.angInter || 0, Math.max(0, u.interFlash || 0));
  c.restore();

  /* LA POUSSIÈRE DES CHENILLES. Elle ne se lève que si le char ROULE,
     et elle sort de l'arrière des deux chenilles — c'est le dernier
     indice qui manquait pour qu'un char lourd ait l'air lourd. */
  if(u.roule > 0.15 && z > 0.4){
    var ca2 = Math.cos(u.angBase || 0), sa2 = Math.sin(u.angBase || 0);
    for(var k = 0; k < 2; k++){
      var ph = ((tps * 1.9 + u.n * 0.41 + k * 0.5) % 1);
      var pd = ptT(-TK.chX - ph * 5, (k ? 1 : -1) * TK.chYe * 0.8, 1.5, ca2, sa2);
      bouffee(c, p.x + pd.x * z, p.y + (pd.y - ph * 9) * z,
              (2.0 + ph * 5.5) * z, (1 - ph) * 0.26 * Math.min(1, u.roule), "#a3956f");
    }
  }
  /* la fumée d'un char blessé : elle sort de la grille moteur, à
     l'arrière — pas du milieu du toit */
  if(u.pv < u.pvMax * 0.5){
    var ph2 = (tps * 0.7 + u.n * 0.37) % 1;
    var fum = ptT((TK.grX0 + TK.grX1) / 2, 0, TK.coZ1,
                  Math.cos(u.angBase || 0), Math.sin(u.angBase || 0));
    bouffee(c, p.x + fum.x * z, p.y + (fum.y - ph2 * 22) * z,
            (2.4 + ph2 * 6) * z, (1 - ph2) * 0.30 * (1 - u.pv / u.pvMax), "#3a3a30");
  }
}

/* ----------------------------------------------------------------
   LE CHAR EN VIGNETTE

   Trois appelants, tous statiques : les silhouettes grises des autres
   joueurs, le portrait du briefing, et tout code qui demanderait un
   TX-90 sans en avoir un sous la main. On le pose de trois quarts,
   canon légèrement tourné : la pose qui montre le mieux à la fois les
   chenilles, le glacis et le tube.
   ---------------------------------------------------------------- */
function dessineTank(c, phase, variante, tir){
  charTank(c, 0.62, 0.28, (phase || 0) * 5, 0, tir ? 0.7 : 0, 0, 0, 1, 2.6, 0);
}

/* LE PORTRAIT DU BRIEFING.

   Le cadre fait 150 × 104, et dessinePortrait y arrive déjà décalé de
   (0, −14) et grossi d'une fois et demie : la translation ci-dessous
   est donc exprimée AVANT cette mise à l'échelle. Le centre du char
   tombe au milieu du cadre.

   Le premier réglage le posait trop bas et il sortait par le bas — la
   seule façon de s'en apercevoir était de regarder la rangée des
   navettes, ce qui est exactement pour ça qu'on la regarde.

   La pose : caisse de trois quarts, canon légèrement tourné vers
   l'autre côté. C'est celle qui montre à la fois les chenilles, le
   glacis et toute la longueur du tube — un char de face ne montre ni
   ses chenilles ni son canon. Le char est plus long qu'avant :
   l'échelle descend en conséquence, sinon il déborde du cadre. */
function portraitTank(c){
  c.save();
  c.translate(50, 53.3);
  c.scale(1.02, 1.02);
  charTank(c, 0.55, -0.16, 0, 0, 0, 0, 0, 1, 2.7, 0);
  c.restore();
}
