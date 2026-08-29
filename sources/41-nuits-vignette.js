/* ================================================================
   LA VIGNETTE DE « MILY ET LES MILLE ET UNE NUITS »

   Sept cent vingt sur trois cents pixels, en haut de l'accueil, à
   côté de celle de la jungle. C'est la première chose qu'on voit de
   cette carte — souvent la seule, pendant les heures où elle est
   verrouillée — et elle doit dire en une seconde : nuit, palais,
   étoiles, violet, doré, magie.

   POURQUOI ELLE N'EST PAS UN APERÇU DE LA CARTE. La vignette
   ordinaire des huit îles peint une petite île vue de trois quarts,
   avec sa palette et ses silhouettes de décor. À 720×300 sur une
   carte dont tout le propos est la LUMIÈRE, ça ne donnerait qu'une
   tache indigo. On peint donc une SCÈNE : un horizon de coupoles
   devant une grande lune, une eau qui les rend, et des lanternes.
   C'est un tableau, pas une carte.

   LE FOND EST PRÉ-CUIT, exactement comme celui de la jungle : la
   silhouette, la lune et le reflet ne bougent jamais, et les
   redessiner soixante fois par seconde pour rien serait absurde. Seuls
   les scintillements, les lanternes qui respirent et l'étoile filante
   sont calculés à l'image.

   L'ÉTAT DE LA CARTE CHANGE L'HEURE QU'IL EST. Verrouillée, la scène
   est froide et la lune basse ; prête, tout s'allume et une étoile
   filante traverse. C'est le même procédé que pour la jungle, dont
   l'orage force selon l'état.
   ================================================================ */
var VN_ETATS = {
  cooldown:{ lum:0.42, lanterne:0.35, etoiles:0.55, filante:0,    pouls:0,   halo:0.30 },
  attente :{ lum:0.82, lanterne:0.80, etoiles:0.95, filante:14.0, pouls:0,   halo:0.62 },
  prete   :{ lum:1.10, lanterne:1.15, etoiles:1.15, filante:5.0,  pouls:1,   halo:1.00 },
  encours :{ lum:1.00, lanterne:1.00, etoiles:1.05, filante:8.0,  pouls:0.2, halo:0.82 },
  /* EN CHANTIER : la ville dort. Peu de lanternes, pas d'étoile
     filante, pas de halo d'appel — mais les étoiles brillent quand
     même, parce qu'une vignette éteinte ne donne envie à personne et
     que c'est justement son travail. */
  chantier:{ lum:0.58, lanterne:0.30, etoiles:0.85, filante:0, pouls:0, halo:0.22 }
};

var vnFondCv = null, vnFondCle = "";

/* Le fond : le ciel, la lune, l'horizon de coupoles, l'eau. */
function vnConstruitFond(w, h){
  vnFondCv = nouveauCanvas(w, h);
  var c = vnFondCv.getContext("2d");
  var al = prng(0x1001A1);
  var i;

  /* --- le ciel, d'un indigo profond en haut vers un violet chaud à
     l'horizon : c'est ce dégradé qui donne l'heure — la fin de la
     nuit, pas minuit. --- */
  var g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#0a0824");
  g.addColorStop(0.42, "#1a1246");
  g.addColorStop(0.72, "#39205e");
  g.addColorStop(1, "#150e30");
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);

  /* --- les étoiles fixes. Trois tailles : la poussière, les
     ordinaires, et une douzaine de brillantes qui portent des
     branches. --- */
  for(i = 0; i < 260; i++){
    var sx = al() * w, sy = al() * h * 0.7;
    var r = 0.4 + al() * 0.9;
    c.fillStyle = "rgba(230,236,255," + (0.2 + al() * 0.5) + ")";
    c.beginPath(); c.arc(sx, sy, r, 0, 6.2832); c.fill();
  }

  /* --- LA LUNE. Grande, haute à gauche, avec son halo et ses mers.
     C'est elle qui éclaire toute la vignette : tout ce qui suit a son
     côté gauche clair. --- */
  var lx = w * 0.235, ly = h * 0.30, lr = h * 0.20;
  var gh = c.createRadialGradient(lx, ly, lr * 0.6, lx, ly, lr * 4.2);
  gh.addColorStop(0, "rgba(206,214,255,.34)");
  gh.addColorStop(0.4, "rgba(150,160,240,.12)");
  gh.addColorStop(1, "rgba(120,130,220,0)");
  c.fillStyle = gh;
  c.beginPath(); c.arc(lx, ly, lr * 4.2, 0, 6.2832); c.fill();
  var gl = c.createRadialGradient(lx - lr * 0.32, ly - lr * 0.34, lr * 0.1, lx, ly, lr);
  gl.addColorStop(0, "#fffdf2");
  gl.addColorStop(0.6, "#ece7ff");
  gl.addColorStop(1, "#b9b2e4");
  c.fillStyle = gl;
  c.beginPath(); c.arc(lx, ly, lr, 0, 6.2832); c.fill();
  /* les mers : quatre taches à peine plus sombres. Sans elles, la
     lune est un disque ; avec elles, c'est la Lune. */
  c.fillStyle = "rgba(150,142,198,.30)";
  for(i = 0; i < 5; i++){
    var mr = lr * (0.12 + al() * 0.2);
    var ma = al() * 6.2832, md = al() * lr * 0.62;
    c.beginPath();
    c.arc(lx + Math.cos(ma) * md, ly + Math.sin(ma) * md, mr, 0, 6.2832);
    c.fill();
  }

  /* --- L'HORIZON DE COUPOLES. Trois plans : le plus lointain est
     presque du ciel, le plus proche est presque noir. C'est cette
     étagement qui donne la profondeur, bien plus que le détail. --- */
  /* LES TROIS PLANS, ET LEURS DEUX RÉGLAGES DÉCISIFS.
     `ech` est l'échelle du plan, et elle était trop timide : à 0,62 /
     0,86 / 1,16 la ville faisait une frise basse au bas de l'image,
     avec des coupoles grosses comme des clous. Une skyline se lit à sa
     SILHOUETTE, et une silhouette a besoin de hauteur. Les trois plans
     montent donc de moitié, et le plus proche mord franchement dans le
     ciel.
     `col` sépare les plans par la VALEUR, pas par la teinte : le plus
     lointain est presque du ciel, le plus proche presque noir. C'est
     cet étagement — et lui seul — qui donne la profondeur. */
  var horizon = h * 0.70;
  var PLANS = [
    { y:horizon - h * 0.05, col:"#312560", ech:0.95, n:15, or:"rgba(210,170,90,.35)" },
    { y:horizon + h * 0.03, col:"#1e1544", ech:1.30, n:11, or:"rgba(235,195,115,.6)" },
    { y:horizon + h * 0.11, col:"#0e0926", ech:1.75, n:7,  or:"rgba(248,220,150,.85)" }
  ];
  for(var pi = 0; pi < PLANS.length; pi++){
    var P = PLANS[pi];
    for(i = 0; i < P.n; i++){
      var bx = (i + 0.5) / P.n * w + (al() - 0.5) * w * 0.09;
      /* DES CORPS TRÈS ÉTROITS, ET C'EST LE CSS QUI LE COMMANDE.
         Le canevas fait 720 × 300 et la vignette l'affiche sur toute
         la largeur en 150 pixels de haut : l'image est donc étirée
         d'environ trois fois en largeur avant d'arriver à l'œil. Une
         tour dessinée carrée ici sort trapue à l'écran, et c'est
         exactement ce qu'on voyait. On dessine donc pour l'étirement,
         pas pour le canevas : étroit et haut ici, juste là-bas. */
      var bw = (5 + al() * 7) * P.ech;
      var bh = (34 + al() * 44) * P.ech;
      c.fillStyle = P.col;
      /* le corps */
      c.fillRect(bx - bw / 2, P.y - bh, bw, bh + h);
      /* le dôme en bulbe */
      /* LE DÔME EST HAUT, PAS LARGE. C'est la hauteur qui fait le
         bulbe oriental — une coupole européenne est large et basse.
         Attention au rayon : les points de contrôle des deux courbes
         sortent à 1,16 fois le rayon, donc le bulbe est en réalité un
         sixième plus large que `dr`. Écrit à 0,66 de la largeur du
         corps, il débordait d'un tiers de chaque côté et le bâtiment
         ressemblait à un champignon. À 0,44, la panse du bulbe affleure
         exactement les murs — et c'est là qu'elle doit être. */
      var dr = bw * 0.44, dh = bw * 1.25;
      c.beginPath();
      c.moveTo(bx - dr, P.y - bh);
      c.bezierCurveTo(bx - dr * 1.16, P.y - bh - dh * 0.52,
                      bx - dr * 0.52, P.y - bh - dh * 0.92, bx, P.y - bh - dh);
      c.bezierCurveTo(bx + dr * 0.52, P.y - bh - dh * 0.92,
                      bx + dr * 1.16, P.y - bh - dh * 0.52, bx + dr, P.y - bh);
      c.closePath(); c.fill();
      /* la flèche */
      c.strokeStyle = P.or; c.lineWidth = 1.2 * P.ech;
      c.beginPath();
      c.moveTo(bx, P.y - bh - dh);
      c.lineTo(bx, P.y - bh - dh - 9 * P.ech);
      c.stroke();
      /* le bord éclairé par la lune, à gauche */
      c.fillStyle = "rgba(190,190,255,.10)";
      c.fillRect(bx - bw / 2, P.y - bh, bw * 0.22, bh + h);
      /* deux ou trois fenêtres allumées, sur le plan le plus proche */
      if(pi === 2){
        c.fillStyle = P.or;
        for(var f = 0; f < 3; f++)
          c.fillRect(bx - bw * 0.28 + f * bw * 0.26, P.y - bh * 0.62, bw * 0.13, bh * 0.2);
      }
      /* un minaret une fois sur trois */
      if(i % 3 === 1){
        var mx2 = bx + bw * (al() < 0.5 ? -0.86 : 0.86);
        var mh2 = bh * 1.7;
        c.fillStyle = P.col;
        c.fillRect(mx2 - 3.2 * P.ech, P.y - mh2, 6.4 * P.ech, mh2 + h);
        c.beginPath();
        c.moveTo(mx2 - 5 * P.ech, P.y - mh2);
        c.lineTo(mx2, P.y - mh2 - 11 * P.ech);
        c.lineTo(mx2 + 5 * P.ech, P.y - mh2);
        c.closePath(); c.fill();
        c.fillStyle = P.or;
        c.fillRect(mx2 - 4 * P.ech, P.y - mh2 + 4 * P.ech, 8 * P.ech, 1.6 * P.ech);
      }
    }
  }

  /* --- L'EAU, en bas, qui rend tout. On recopie la moitié haute de
     la vignette, retournée, écrasée et voilée : c'est le reflet le
     moins cher qui existe, et le seul qui soit juste — un reflet
     peint à la main ne correspond jamais à ce qu'il reflète. --- */
  var eau = h * 0.84;
  c.save();
  c.beginPath(); c.rect(0, eau, w, h - eau); c.clip();
  c.globalAlpha = 0.34;
  c.save();
  c.translate(0, eau * 2);
  c.scale(1, -0.55);
  c.drawImage(vnFondCv, 0, 0);
  c.restore();
  c.globalAlpha = 1;
  /* L'ENCRE PAR-DESSUS, POUR QUE LE REFLET RESTE UN REFLET — mais
     elle ne va plus jusqu'au noir.

     À 0,86 d'encre sur le bord inférieur, l'eau finissait plus sombre
     que le fond de la vignette elle-même. Résultat, vu à l'accueil :
     une bande noire au bas de la carte, et l'image paraissait
     s'arrêter à quatre-vingt-quatre pour cent de sa hauteur alors
     qu'elle allait bien jusqu'en bas. À côté de la jungle, dont l'eau
     reste claire, les deux cartes spéciales n'avaient plus le même
     bord bas — c'est ce décalage qu'on voyait, pas la couleur.
     0,62 garde l'eau lisible comme de l'eau et rend à la vignette son
     bord inférieur. */
  var ge = c.createLinearGradient(0, eau, 0, h);
  ge.addColorStop(0, "rgba(8,6,26,.26)");
  ge.addColorStop(0.72, "rgba(6,4,20,.56)");
  ge.addColorStop(1, "rgba(10,7,30,.62)");
  c.fillStyle = ge;
  c.fillRect(0, eau, w, h - eau);
  /* les rides : trois traits clairs qui cassent le reflet */
  c.strokeStyle = "rgba(190,200,255,.16)";
  c.lineWidth = 1;
  for(i = 0; i < 12; i++){
    var ry = eau + (i / 12) * (h - eau);
    c.beginPath();
    c.moveTo(al() * w * 0.5, ry);
    c.lineTo(al() * w * 0.5 + w * 0.3, ry);
    c.stroke();
  }
  c.restore();
  /* LA LIGNE DE RIVAGE, ET ELLE NE TRAVERSE PLUS TOUT LE CADRE.
     Un trait clair de bord à bord, à quatre-vingt-quatre pour cent de
     la hauteur, se lit comme le BAS DE L'IMAGE et non comme une
     berge : c'est la ligne que le joueur a montrée en disant que
     l'image semblait s'arrêter plus haut que les autres. Un rivage
     s'efface sur les côtés — il s'enfonce dans la brume aux deux
     extrémités — donc on le fait mourir aux deux bords. Il tient
     toujours son rôle au centre, là où il sépare la ville de son
     reflet, et il ne coupe plus la vignette en deux. */
  var gr = c.createLinearGradient(0, 0, w, 0);
  gr.addColorStop(0.00, "rgba(150,140,220,0)");
  gr.addColorStop(0.22, "rgba(150,140,220,.20)");
  gr.addColorStop(0.50, "rgba(166,154,232,.26)");
  gr.addColorStop(0.78, "rgba(150,140,220,.20)");
  gr.addColorStop(1.00, "rgba(150,140,220,0)");
  c.fillStyle = gr;
  c.fillRect(0, eau - 1.5, w, 2.5);

  vnFondCle = w + "x" + h;
}

function dessineVignetteNuits(c, w, h, tps, etat){
  var E = VN_ETATS[etat] || VN_ETATS.attente;
  var i;
  if(!vnFondCv || vnFondCle !== w + "x" + h) vnConstruitFond(w, h);

  c.save();
  c.beginPath(); c.rect(0, 0, w, h); c.clip();
  c.drawImage(vnFondCv, 0, 0, w, h);

  /* --- les étoiles qui scintillent, par-dessus les fixes. Elles sont
     déterministes elles aussi — c'est leur ÉCLAT qui bouge, pas leur
     place, sinon on verrait de la neige. --- */
  c.save();
  c.globalCompositeOperation = "lighter";
  for(i = 0; i < 46; i++){
    var sx = ((i * 137.5) % 100) / 100 * w;
    var sy = ((i * 71.3) % 100) / 100 * h * 0.66;
    var b = 0.5 + 0.5 * Math.sin(tps * (0.7 + (i % 5) * 0.3) + i * 1.7);
    var r = (0.8 + (i % 3) * 0.7) * (0.6 + b * 0.8);
    c.fillStyle = "rgba(226,232,255," + (0.18 + b * 0.55) * E.etoiles + ")";
    c.beginPath(); c.arc(sx, sy, r, 0, 6.2832); c.fill();
    /* les branches, sur une sur six : c'est ce qui les fait lire
       comme des ÉTOILES et non comme des points */
    if(i % 6 === 0 && b > 0.5){
      c.strokeStyle = "rgba(226,232,255," + ((b - 0.5) * 0.7 * E.etoiles) + ")";
      c.lineWidth = 0.8;
      var br = r * 4.4;
      c.beginPath();
      c.moveTo(sx - br, sy); c.lineTo(sx + br, sy);
      c.moveTo(sx, sy - br); c.lineTo(sx, sy + br);
      c.stroke();
    }
  }
  c.restore();

  /* --- L'ÉTOILE FILANTE. Rare, exprès : « pas toutes les cinq
     secondes, cela doit rester assez rare pour être joli lorsqu'on la
     remarque ». Elle traverse en six dixièmes de seconde et laisse une
     traînée qui s'efface. --- */
  if(E.filante > 0){
    var cyc = tps % E.filante;
    if(cyc < 0.75){
      var u = cyc / 0.75;
      var num = Math.floor(tps / E.filante);
      /* elle part d'un point différent à chaque passage, sans tirage :
         le numéro du cycle suffit à la déplacer */
      var fx0 = w * (0.15 + ((num * 0.37) % 1) * 0.6);
      var fy0 = h * (0.04 + ((num * 0.61) % 1) * 0.22);
      var lg = w * 0.26;
      var fx = fx0 + u * lg, fy = fy0 + u * lg * 0.34;
      c.save();
      c.globalCompositeOperation = "lighter";
      var op = Math.sin(u * 3.1416);
      var gf = c.createLinearGradient(fx - lg * 0.22, fy - lg * 0.075, fx, fy);
      gf.addColorStop(0, "rgba(190,210,255,0)");
      gf.addColorStop(1, "rgba(255,252,235," + (0.85 * op) + ")");
      c.strokeStyle = gf;
      c.lineWidth = 1.8;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(fx - lg * 0.22, fy - lg * 0.075);
      c.lineTo(fx, fy);
      c.stroke();
      c.fillStyle = "rgba(255,255,245," + (0.9 * op) + ")";
      c.beginPath(); c.arc(fx, fy, 1.7, 0, 6.2832); c.fill();
      c.restore();
    }
  }

  /* --- LES LANTERNES DE LA RIVE. Six points chauds alignés sur
     l'horizon, qui respirent chacun à son rythme. Ce sont eux qui
     réchauffent une image entièrement bleue — sans eux la vignette est
     belle et froide. --- */
  var horizon = h * 0.70;
  c.save();
  c.globalCompositeOperation = "lighter";
  for(i = 0; i < 7; i++){
    var lx2 = (i + 0.5) / 7 * w + (i % 3 - 1) * 14;
    var ly2 = horizon + h * (0.055 + (i % 3) * 0.02);
    var r2 = 0.72 + 0.28 * Math.sin(tps * (1.1 + i * 0.27) + i);
    var f2 = E.lanterne * r2;
    var gg = c.createRadialGradient(lx2, ly2, 0, lx2, ly2, 26 * f2);
    gg.addColorStop(0, "rgba(255,206,132," + (0.5 * f2) + ")");
    gg.addColorStop(0.4, "rgba(255,170,90," + (0.16 * f2) + ")");
    gg.addColorStop(1, "rgba(255,150,70,0)");
    c.fillStyle = gg;
    c.beginPath(); c.arc(lx2, ly2, 26 * f2, 0, 6.2832); c.fill();
    c.fillStyle = "rgba(255,238,196," + (0.85 * f2) + ")";
    c.beginPath(); c.arc(lx2, ly2, 1.7, 0, 6.2832); c.fill();
    /* le reflet dans l'eau, juste dessous : une traînée verticale,
       c'est ainsi qu'une lumière se reflète sur une eau ridée */
    var ge2 = c.createLinearGradient(lx2, h * 0.84, lx2, h);
    ge2.addColorStop(0, "rgba(255,190,110," + (0.30 * f2) + ")");
    ge2.addColorStop(1, "rgba(255,170,90,0)");
    c.fillStyle = ge2;
    c.fillRect(lx2 - 2.2, h * 0.84, 4.4, h * 0.16);
  }
  c.restore();

  /* --- LA POUSSIÈRE MAGIQUE : quelques paillettes qui montent
     lentement devant toute la scène. Elles ne coûtent rien et elles
     font toute la différence entre une belle image fixe et un endroit
     où il se passe quelque chose. --- */
  c.save();
  c.globalCompositeOperation = "lighter";
  for(i = 0; i < 26; i++){
    var px = ((i * 97.3) % 100) / 100 * w;
    var vy = 8 + (i % 5) * 5;
    var py = h - ((tps * vy + i * 137) % (h * 1.1));
    var d = 0.5 + 0.5 * Math.sin(tps * 1.6 + i);
    c.fillStyle = "rgba(255,232,180," + (0.14 + d * 0.34) * E.lum + ")";
    c.beginPath();
    c.arc(px + Math.sin(tps * 0.6 + i) * 9, py, 0.8 + d * 0.9, 0, 6.2832);
    c.fill();
  }
  c.restore();

  /* --- LE HALO DE LA CARTE PRÊTE. Un liseré chaud sur tout le bord :
     la même grammaire que la vignette de la jungle, pour qu'on
     comprenne sans lire que c'est le moment d'entrer. --- */
  if(E.halo > 0){
    var puls = E.pouls ? (0.72 + 0.28 * Math.sin(tps * 2.2)) : 1;
    var gb = c.createLinearGradient(0, 0, 0, h);
    gb.addColorStop(0, "rgba(190,150,255," + (0.16 * E.halo * puls) + ")");
    gb.addColorStop(0.5, "rgba(190,150,255,0)");
    gb.addColorStop(1, "rgba(255,196,120," + (0.14 * E.halo * puls) + ")");
    c.fillStyle = gb;
    c.fillRect(0, 0, w, h);
  }
  c.restore();
}
