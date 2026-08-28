/* ================================================================
   LA TORNADE CLASSIQUE — « Mily à la campagne »

   « Il y avait aussi la tornade classique dans Mily à la campagne. Une
   tornade classique dans cette map, qui dure un peu plus longtemps. »

   C'est la troisième, et c'est la SEULE des trois qui ressemble à une
   vraie. Celle des ténèbres est faite de feu, celle des nuits
   d'étoiles ; celle-ci est faite de ce dont une tornade est faite —
   de l'air chargé de terre. Elle n'éclaire rien, elle ne brille pas :
   elle SALIT. Sur une île en plein jour, c'est même la seule façon de
   la voir, puisqu'un effet lumineux y disparaîtrait.

   TROIS CHOSES FONT QU'ON LA CROIT, et aucune n'est une couleur.

   1. LE MUR DE POUSSIÈRE AU PIED. Une vraie tornade ne touche pas le
      sol par une pointe : elle arrive dans un bourrelet de débris
      soulevés, deux fois plus large que l'entonnoir, et c'est ce
      bourrelet qu'on voit en premier de loin. Sans lui, on dessine un
      cône, pas une tornade.

   2. LES DÉBRIS. Des éclats sombres arrachés au sol qui tournent avec
      elle et montent en spirale. Ils sont opaques et petits — c'est
      leur DÉPLACEMENT qui se lit, pas leur forme. Ce sont eux qui
      donnent l'échelle : sans quelque chose de reconnaissable dedans,
      une colonne grise pourrait faire trois mètres comme trois cents.

   3. LA COULEUR DU SOL. La poussière emprunte la teinte de l'île
      qu'elle arrache, elle ne l'apporte pas. Elle est donc tirée de
      MATIERES — de l'ocre à la campagne — et le jour où une autre île
      en voudrait une, elle prendrait la sienne sans qu'on y touche.

   MÊME MOTEUR, MÊME PROMESSE. Naissance, descente, marche, traînée,
   mort : tout cela est le code commun de 33-tenebres-tornade.js,
   piloté par profilTornade(). Et la règle ne bouge pas d'un mot —
   elle ne tue QUE nos troupes. Ni les bâtiments (ils crédi­teraient un
   score à quelqu'un qui a posé sa tablette), ni les bêtes (Gégé et
   Tweety sont uniques et leur tueur est gravé dans l'instantané
   partagé).
   ================================================================ */

/* LA PALETTE, ET LA FAUTE QU'ELLE RÉPARE.
   Le premier jet prenait ses teintes DANS le sol de l'île — sable1,
   tache1, fond2 — en se disant qu'une tornade emprunte la couleur de
   ce qu'elle arrache. C'est vrai, et le résultat était invisible : de
   l'ocre clair peint sur un champ d'ocre clair. Mesuré à la capture :
   on ne voyait qu'un voile pâle, et l'anneau au sol plus que la
   colonne.

   Une vraie tornade est PLUS SOMBRE que le champ qu'elle traverse.
   C'est une masse dense qui bloque la lumière : on la voit en
   silhouette, pas en surbrillance. Le clair est réservé à ce qui vole
   au pied — le mur de poussière soulevée, lui, est bien plus clair que
   le sol.

   Les teintes sont donc fixes et sombres, et seul le VOILE de
   poussière emprunte encore au sol : c'est la seule couche où
   l'emprunt disait quelque chose de vrai. */
function poussiereTeintes(){
  var M = (typeof MATIERES !== "undefined" && carte && MATIERES[carte.biome])
        || { fond1:"#bb9e60", fond2:"#a88b4f", tache1:"#cdb073", sable1:"#e0cb95" };
  return {
    /* le voile de poussière qui vole : celui-là vient bien du sol */
    voile : M.sable1  || "#e0cb95",
    /* la colonne : de la terre en suspension, sombre */
    clair : "#a08a63",
    moyen : "#6b5a3d",
    sombre: "#3e3423",
    debris: "#241c10"
  };
}

/* ---------------------------------------------------------------
   L'ENTONNOIR
   --------------------------------------------------------------- */
function dessineTornadeTerreMonde(c, t, tps){
  var P = profilTornade(jeu.index) || {};
  var T = poussiereTeintes();
  var p = versEcran(cam, t.gx, t.gy);
  var z = cam.z;
  var desc = P.descente || EQ.CLASSIQUE_DESCENTE;
  var descend = t.age < desc;
  var pied = descend ? (1 - t.age / desc) : 0;
  var H = (P.haut || 330) * z;
  var ray = P.rayon || EQ.CLASSIQUE_RAYON;
  var i, u;

  c.save();

  /* --- 1. L'AVERTISSEMENT. Deux anneaux de poussière qui se
     resserrent sur le point de contact, et le sol qui s'assombrit
     dessous : voilà où ça va tomber, et dans combien de temps. Sur une
     île claire, c'est l'OMBRE qui prévient — un anneau lumineux ne se
     verrait pas. */
  if(descend){
    var q = 1 - pied;
    var rA = 5.5 - q * 3.7;
    var go = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, rA * RX * z);
    go.addColorStop(0, "rgba(40,30,16," + (0.30 * q) + ")");
    go.addColorStop(1, "rgba(40,30,16,0)");
    c.fillStyle = go;
    c.beginPath();
    c.ellipse(p.x, p.y, rA * RX * z, rA * RY * z, 0, 0, 6.2832); c.fill();
    c.strokeStyle = "rgba(70,54,30," + (0.30 + q * 0.5) + ")";
    c.lineWidth = (1.2 + q * 2.2) * z;
    c.beginPath();
    c.ellipse(p.x, p.y, rA * RX * z, rA * RY * z, 0, 0, 6.2832); c.stroke();
    /* la poussière qui commence à tourner au sol, avant même que le
       pied arrive : une tornade s'annonce par ce qu'elle soulève */
    for(i = 0; i < 12; i++){
      var ad = i * 0.5236 + t.tour * 1.4;
      var rd = rA * (0.65 + ((i * 3) % 5) / 9);
      c.fillStyle = "rgba(" + hexRgbPous(T.voile) + "," + (0.24 + 0.26 * q) + ")";
      c.beginPath();
      c.ellipse(p.x + Math.cos(ad) * rd * RX * z,
                p.y + Math.sin(ad) * rd * RY * z,
                2.2 * z, 1.2 * z, 0, 0, 6.2832);
      c.fill();
    }
  }

  /* --- 2. LA COLONNE. Trois couches de poussière, de la plus large et
     la plus pâle à la plus étroite et la plus sombre. Contrairement au
     feu, on ne peint PAS en additif : de la terre en suspension cache
     ce qu'il y a derrière, elle ne s'y ajoute pas. C'est la seule
     différence de fond entre ce dessin et celui des flammes, et c'est
     elle qui fait toute la matière. */
  var couches = [
    { k:1.00, col:T.clair,  a:0.52 },
    { k:0.76, col:T.moyen,  a:0.68 },
    { k:0.48, col:T.sombre, a:0.80 }
  ];
  for(i = 0; i < couches.length; i++){
    var gv = c.createLinearGradient(p.x, p.y - H, p.x, p.y);
    gv.addColorStop(0, rgba(couches[i].col, couches[i].a * 0.55));
    gv.addColorStop(0.62, rgba(couches[i].col, couches[i].a));
    gv.addColorStop(1, rgba(couches[i].col, couches[i].a * 1.15));
    c.fillStyle = gv;
    torSilhouette(c, t, p, z, H, pied, couches[i].k, 1, tps);
    c.fill();
  }
  /* les stries de rotation : quatre bandes claires qui montent en
     spirale sur la paroi. Sans elles, la colonne ne tourne pas — elle
     ondule seulement, et l'œil ne s'y trompe pas. */
  c.save();
  torSilhouette(c, t, p, z, H, pied, 1, 1, tps);
  c.clip();
  for(var s = 0; s < 5; s++){
    var dep = t.tour * 1.5 + s * 1.2566;
    c.beginPath();
    for(i = 0; i <= 22; i++){
      u = pied + (1 - pied) * (i / 22);
      var pr = torProfil(u, tps, t.tour);
      var a = dep + u * 8.0;
      var x = p.x + Math.sin(t.tour + u * 3.4) * pr * 0.30 * RX * z
            + Math.cos(a) * pr * RX * z * 0.5;
      var y = p.y - u * H + Math.sin(a) * pr * RY * z * 0.5;
      if(i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.strokeStyle = rgba("#cbb489", 0.26);
    c.lineWidth = 5 * z;
    c.lineCap = "round";
    c.stroke();
  }
  c.restore();

  /* --- 3. LES DÉBRIS. Des éclats arrachés au sol, opaques, qui
     montent en spirale. Ils sont plus gros et plus nombreux en bas —
     c'est là qu'elle arrache — et ils s'éclaircissent en montant, comme
     ce qui se perd dans la poussière. */
  var ND = 34;
  for(i = 0; i < ND; i++){
    var ph = i * 2.399;
    var mu = ((tps * (0.30 + (i % 4) * 0.07) + i / ND) % 1);
    u = pied + (1 - pied) * mu;
    var prd = torProfil(u, tps, t.tour) * 0.94;
    var ang = t.tour * 1.8 + ph + u * 7.5;
    var dx = p.x + Math.sin(t.tour + u * 3.4) * prd * 0.30 * RX * z
           + Math.cos(ang) * prd * RX * z * 0.5;
    var dy = p.y - u * H + Math.sin(ang) * prd * RY * z * 0.5;
    var devant = (Math.sin(ang) + 1) * 0.5;
    var tl = (1.6 - u * 0.9) * z * (0.7 + devant * 0.6);
    if(tl < 0.35) continue;
    c.fillStyle = "rgba(" + hexRgbPous(i % 4 === 0 ? T.sombre : T.debris) + ","
                + ((0.30 + devant * 0.42) * (1 - mu * 0.55)) + ")";
    c.save();
    c.translate(dx, dy);
    c.rotate(ang * 1.7);
    c.fillRect(-tl, -tl * 0.5, tl * 2, tl);
    c.restore();
  }

  /* --- 4. LE MUR DE POUSSIÈRE AU PIED. C'est LA chose qui fait la
     tornade : le bourrelet de débris soulevés, deux fois plus large
     que l'entonnoir, tassé au ras du sol. Il ne tue pas — le rayon
     mortel est celui de l'anneau net qu'on trace dedans — mais c'est
     lui qu'on voit de loin. */
  if(!descend){
    var rp = ray * 2.4;
    var gp = c.createRadialGradient(p.x, p.y, ray * RX * z * 0.4, p.x, p.y, rp * RX * z);
    gp.addColorStop(0, rgba(T.voile, 0.66));
    gp.addColorStop(0.45, rgba(T.voile, 0.40));
    gp.addColorStop(1, rgba(T.voile, 0));
    c.fillStyle = gp;
    c.beginPath();
    c.ellipse(p.x, p.y, rp * RX * z, rp * RY * z, 0, 0, 6.2832); c.fill();
    /* les volutes du bourrelet : six bouffées qui tournent */
    for(i = 0; i < 6; i++){
      var av = t.tour * 1.1 + i * 1.0472;
      var rv = ray * (1.3 + ((i * 5) % 4) / 4);
      c.fillStyle = rgba(T.voile, 0.30 + 0.18 * Math.abs(Math.sin(tps * 2.4 + i)));
      c.beginPath();
      c.ellipse(p.x + Math.cos(av) * rv * RX * z,
                p.y + Math.sin(av) * rv * RY * z,
                ray * RX * z * 0.62, ray * RY * z * 0.62, 0, 0, 6.2832);
      c.fill();
    }
    /* L'ANNEAU NET, SUR LE RAYON EXACT. Le mur de poussière est deux
       fois plus large que ce qui tue : sans ce trait, le joueur
       contournerait de deux fois trop loin — ou pire, croirait être
       dehors en étant dedans. Le dessin doit dire la règle. */
    c.strokeStyle = "rgba(50,38,20,.55)";
    c.lineWidth = 1.6 * z;
    c.beginPath();
    c.ellipse(p.x, p.y, ray * RX * z, ray * RY * z, 0, 0, 6.2832); c.stroke();
  }

  /* --- 5. LE SOMMET, qui se perd dans le nuage. */
  var gs = c.createRadialGradient(p.x, p.y - H, 0, p.x, p.y - H, 8 * RX * z);
  gs.addColorStop(0, rgba(T.moyen, 0.44));
  gs.addColorStop(1, rgba(T.moyen, 0));
  c.fillStyle = gs;
  c.beginPath();
  c.ellipse(p.x, p.y - H, 8 * RX * z, 4 * RY * z, 0, 0, 6.2832); c.fill();

  c.restore();
  c.globalAlpha = 1;
}

/* rgba() du projet veut « #rrggbb » ; certaines lueurs veulent
   « r,v,b ». Conversion locale, comme dans le tourbillon. */
function hexRgbPous(h){
  if(h.charAt(0) !== "#") return h;
  var n = parseInt(h.slice(1), 16);
  return ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255);
}

/* ---------------------------------------------------------------
   LA TRAÎNÉE — de la terre retournée, pas du feu
   --------------------------------------------------------------- */
/* Elle est peinte avec les décalques du terrain, sous les troupes.
   Deux couches seulement, et la première est celle qui compte : une
   BANDE SOMBRE de terre nue, à la mesure exacte de ce qui tue. C'est
   le sillon. Par-dessus, la poussière qui n'est pas encore retombée —
   elle, elle s'efface. */
function dessineTraceTerreSol(c, b, tps){
  var P = profilTornade(jeu.index) || {};
  var T = poussiereTeintes();
  var duree = P.trainee || EQ.CLASSIQUE_TRAINEE;
  var larg = P.traineeR || EQ.CLASSIQUE_TRAINEE_R;
  var p = iso(b.gx, b.gy);
  var v = b.age / duree;
  var vif = v < 0.66 ? (1 - v * 0.30) : Math.max(0, (1 - v) / 0.34) * 0.7;

  /* 1. LE SILLON. Il reste tant que la traînée existe, et il ne
     s'éclaircit qu'à la fin : c'est lui qui dit « on est passé par
     là », et il est à la mesure EXACTE du couloir qui tue. */
  c.globalCompositeOperation = "source-over";
  c.globalAlpha = 0.42 - v * 0.20;
  c.fillStyle = "#4c3c22";
  c.beginPath();
  c.ellipse(p.x, p.y, larg * RX * 1.02, larg * RY * 1.02, 0, 0, 6.2832); c.fill();
  /* le bourrelet de terre poussée sur les côtés */
  c.globalAlpha = 0.20 - v * 0.10;
  c.fillStyle = T.sombre;
  c.beginPath();
  c.ellipse(p.x, p.y - larg * RY * 0.5, larg * RX * 0.9, larg * RY * 0.42, 0, 0, 6.2832);
  c.fill();
  if(vif <= 0.02){ c.globalAlpha = 1; return; }

  /* 2. LA POUSSIÈRE EN SUSPENSION. `globalAlpha` revient à 1 : il
     portait encore l'opacité du sillon, qui se serait multipliée avec
     celle des dégradés. C'est exactement le défaut qui avait rendu la
     traînée de feu terne, et il ne coûte rien de ne pas le refaire. */
  c.globalAlpha = 1;
  var souffle = 0.9 + Math.sin(tps * 3.4 + b.ph) * 0.1;
  for(var i = 0; i < 2; i++){
    var rr = (1.55 - i * 0.55) * souffle;
    var g = c.createRadialGradient(p.x, p.y, 1, p.x, p.y, rr * RX);
    g.addColorStop(0, rgba(i ? T.voile : T.moyen, (0.34 - i * 0.04) * vif));
    g.addColorStop(1, rgba(i ? T.voile : T.moyen, 0));
    c.fillStyle = g;
    c.beginPath(); c.ellipse(p.x, p.y, rr * RX, rr * RY, 0, 0, 6.2832); c.fill();
  }
  /* trois éclats de terre projetés, qui retombent avec la poussière */
  for(var k = 0; k < 3; k++){
    var a = b.ph + k * 2.094;
    var d = larg * (0.5 + ((k * 3) % 4) / 5);
    c.globalAlpha = 0.42 * vif;
    c.fillStyle = T.debris;
    c.fillRect(p.x + Math.cos(a) * d * RX - 1.2, p.y + Math.sin(a) * d * RY - 0.8, 2.4, 1.6);
  }
  c.globalAlpha = 1;
}
