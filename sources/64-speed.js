/* ================================================================
   SPEED — LE HÉROS

   « Ce serait un personnage vraiment très sympa. Un peu doré. Et tu
   fais la tête du héros sur sa barge. »

   CE QU'IL FALLAIT QU'ON VOIE EN UN COUP D'ŒIL, à la taille où il
   paraît — vingt pixels de haut au zoom de jeu :

     ① QU'IL COURT. Aucune autre troupe ne court : la Furie marche, le
       Commando avance, l'Ogre pèse. Speed a la foulée penchée, les
       genoux hauts et les bras pliés d'un sprinteur. C'est sa
       silhouette, et elle se lit avant sa couleur.
     ② QU'IL EST DORÉ. Un seul doré, franc, sur un corps sombre : les
       plastrons, les brassards, les bandes de cheville. L'or est rare
       dans ce jeu — il est réservé aux badges et aux titres —, donc il
       DIT quelque chose ici.
     ③ QU'IL EST SYMPA. Le foulard. Il flotte derrière lui à
       contretemps de la foulée, et c'est lui qui fait le personnage :
       sans le foulard on a un soldat rapide, avec on a quelqu'un.

   IL N'A PAS D'ARME, et c'est volontaire jusque dans le dessin : les
   deux mains sont libres, ouvertes, à hauteur de poitrine. On ne lui
   cherche pas de canon parce qu'il n'y en a pas.
   ================================================================ */
var C_SPEED = {
  or:      "#F0B84E", orC:"#FFDF9E", orO:"#9A6A12",
  combi:   "#2C2333", combiC:"#40354B", combiO:"#1A1420",
  foulard: "#FF9B3D", foulardC:"#FFC37A", foulardO:"#C4631A",
  peau:    "#E8C9A6", peauO:"#BD9A75",
  cheveux: "#2A1E17",
  lunette: "#1A1620", verre:"#8FE8FF", verreC:"#DFFBFF",
  eclair:  "#FFE9A8"
};
var SPEED_ECH = 1.06;              // à peine plus grand qu'une Furie

/* La tête, dessinée à part : elle sert au personnage ET au fronton de
   sa navette, et deux dessins d'un même visage divergeraient. */
function teteSpeed(c, r, deProfil){
  var C = C_SPEED;
  /* la nuque, qui dépasse à peine derrière les joues */
  c.fillStyle = C.cheveux;
  c.beginPath(); c.ellipse(0, 0, r * 1.06, r * 1.02, 0, 0, 6.2832); c.fill();
  /* le visage */
  c.fillStyle = C.peau;
  c.beginPath();
  c.ellipse(deProfil ? r * 0.16 : 0, r * 0.08, r * 0.88, r * 0.92, 0, 0, 6.2832);
  c.fill();
  /* ── LA COIFFURE, EN CALOTTE PAR-DESSUS LE FRONT ────────────────
     Le simple disque sombre derrière le visage ne débordait que d'un
     dixième de rayon : à côté de la chevelure de la Furie, du casque
     du Commando et du chapeau du Doc, le héros paraissait chauve —
     six frontons côte à côte, et lui seul sans rien sur la tête. La
     calotte est donc dessinée DEVANT le visage, et elle porte la
     mèche dorée qui file vers l'arrière. */
  c.fillStyle = C.cheveux;
  c.beginPath();
  c.moveTo(-r * 0.99, -r * 0.30);
  c.bezierCurveTo(-r * 1.02, -r * 1.02, r * 0.34, -r * 1.28, r * 0.96, -r * 0.52);
  c.bezierCurveTo(r * 0.62, -r * 0.68, -r * 0.44, -r * 0.74, -r * 0.99, -r * 0.30);
  c.closePath(); c.fill();
  /* LES LUNETTES RELEVÉES SUR LE FRONT, pas sur les yeux : on doit
     voir son regard. Ce sont elles qui disent « coureur » sans qu'on
     ait à le lire. */
  c.strokeStyle = C.lunette; c.lineWidth = r * 0.30; c.lineCap = "round";
  c.beginPath();
  c.moveTo(-r * 0.96, -r * 0.46); c.quadraticCurveTo(0, -r * 0.86, r * 0.96, -r * 0.46);
  c.stroke();
  c.fillStyle = C.verre;
  c.beginPath();
  c.ellipse(-r * 0.38, -r * 0.56, r * 0.30, r * 0.20, -0.22, 0, 6.2832); c.fill();
  c.beginPath();
  c.ellipse(r * 0.38, -r * 0.56, r * 0.30, r * 0.20, 0.22, 0, 6.2832); c.fill();
  c.fillStyle = C.verreC;
  c.beginPath(); c.ellipse(-r * 0.44, -r * 0.60, r * 0.10, r * 0.07, -0.22, 0, 6.2832); c.fill();
  /* les yeux, et le sourire — c'est là qu'il devient sympa */
  c.fillStyle = "#1B1520";
  c.beginPath(); c.ellipse(-r * 0.30, r * 0.06, r * 0.13, r * 0.17, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(r * 0.34, r * 0.06, r * 0.13, r * 0.17, 0, 0, 6.2832); c.fill();
  c.fillStyle = "#FFFFFF";
  c.beginPath(); c.ellipse(-r * 0.26, r * 0.01, r * 0.05, r * 0.06, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(r * 0.38, r * 0.01, r * 0.05, r * 0.06, 0, 0, 6.2832); c.fill();
  c.strokeStyle = "#8A5A3A"; c.lineWidth = r * 0.12;
  c.beginPath();
  c.moveTo(-r * 0.26, r * 0.46); c.quadraticCurveTo(r * 0.06, r * 0.66, r * 0.34, r * 0.42);
  c.stroke();
  /* LA MÈCHE DORÉE, COUCHÉE VERS L'ARRIÈRE par la course : c'est la
     seule chose qui le rattache visuellement à son plastron et à ses
     brassards, et sans elle l'or ne monte jamais jusqu'au visage. */
  c.fillStyle = C.or;
  c.beginPath();
  c.moveTo(r * 0.92, -r * 0.56);
  c.bezierCurveTo(r * 0.52, -r * 1.18, -r * 0.18, -r * 1.16, -r * 0.46, -r * 0.86);
  c.bezierCurveTo(-r * 0.16, -r * 0.94, r * 0.34, -r * 0.86, r * 0.92, -r * 0.56);
  c.closePath(); c.fill();
  c.fillStyle = C.orC;
  c.beginPath();
  c.moveTo(r * 0.74, -r * 0.62);
  c.bezierCurveTo(r * 0.42, -r * 1.04, -r * 0.06, -r * 1.02, -r * 0.30, -r * 0.86);
  c.bezierCurveTo(-r * 0.04, -r * 0.88, r * 0.32, -r * 0.80, r * 0.74, -r * 0.62);
  c.closePath(); c.fill();
}

/* Le héros en pied, dans le repère des troupes : origine aux pieds,
   la tête vers les y négatifs. */
function dessineSpeed(c, phase, variante, tir){
  var C = C_SPEED;
  /* UNE FOULÉE PLUS AMPLE QUE TOUTES LES AUTRES. La Furie marche à
     4,0 d'amplitude, l'Ogre à 5,5 ; lui court à 6,2, et son cycle
     tourne plus vite (voir la cadence de phase dans majUnites). */
  var p = pose(phase, 6.2);
  var yb = -p.rebond;
  /* le foulard bat à contretemps — un tiers de cycle de retard */
  var fl = Math.sin(phase - 2.1);

  c.fillStyle = "rgba(0,0,0,.26)";
  c.beginPath(); c.ellipse(0, 0, 7.4, 3.1, 0, 0, 6.2832); c.fill();

  c.save();
  c.scale(SPEED_ECH, SPEED_ECH);
  c.translate(0, yb);
  c.lineCap = "round"; c.lineJoin = "round";

  /* ── LE FOULARD, DERRIÈRE TOUT LE RESTE ────────────────────────
     Il part de la nuque et file vers l'arrière — c'est-à-dire vers
     les x négatifs, puisque le personnage regarde à droite et que le
     miroir de dessineUniteMonde s'occupe de l'autre sens. */
  (function(){
    var y0 = -21.5;
    for(var k = 0; k < 2; k++){
      var d = k * 0.9, a = k ? 0.62 : 1;
      c.strokeStyle = k ? C.foulardO : C.foulard;
      c.lineWidth = k ? 1.9 : 2.6;
      c.globalAlpha = a;
      c.beginPath();
      c.moveTo(-1.2, y0 + d);
      c.quadraticCurveTo(-6.5 - d, y0 + fl * 2.2 - 1.4,
                         -12.4 - d * 1.6, y0 + fl * 4.4 + 1.2);
      c.stroke();
    }
    c.globalAlpha = 1;
  })();

  /* ── JAMBES : genoux hauts, appui franc ────────────────────── */
  function jambe(dx, devant){
    var col = devant ? C.combi : C.combiO;
    var orC = devant ? C.or : C.orO;
    /* la cuisse monte haut quand elle part en avant */
    var haut = dx > 0 ? 1 : 0.55;
    c.strokeStyle = col; c.lineWidth = 4.0;
    c.beginPath();
    c.moveTo(dx * 0.08, -13.2);
    c.quadraticCurveTo(dx * 0.42, -9.6 - haut * 1.6, dx * 0.72, -7.2 - haut * 2.2);
    c.stroke();
    c.lineWidth = 3.3;
    c.beginPath();
    c.moveTo(dx * 0.72, -7.2 - haut * 2.2);
    c.quadraticCurveTo(dx * 0.95, -4.2, dx, -1.6 + haut * 1.4);
    c.stroke();
    /* LA BANDE DE CHEVILLE DORÉE, avec sa petite aile. C'est le seul
       ornement qu'on distingue encore à la taille du jeu, et il dit à
       lui seul de quoi ce personnage est capable. */
    c.strokeStyle = orC; c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(dx * 0.92, -3.6 + haut * 1.1); c.lineTo(dx * 1.02, -2.8 + haut * 1.2);
    c.stroke();
    c.fillStyle = orC;
    c.beginPath();
    c.moveTo(dx * 0.86, -3.4 + haut * 1.1);
    c.lineTo(dx * 0.86 - 3.0, -2.2 + haut * 1.1);
    c.lineTo(dx * 0.86 - 0.6, -1.9 + haut * 1.1);
    c.closePath(); c.fill();
    /* la chaussure */
    c.fillStyle = devant ? "#1E1826" : "#15111C";
    c.beginPath();
    c.ellipse(dx + (dx > 0 ? 1.1 : -1.1), -1.0 + haut * 1.4, 3.0, 1.5, 0, 0, 6.2832);
    c.fill();
  }
  jambe(p.jambeB, false);
  jambe(p.jambeA, true);

  c.save();
  /* LA PENCHE. Un coureur est incliné vers l'avant en permanence —
     c'est ce qui distingue une course d'une marche rapide. */
  c.rotate(p.incl - 0.14);

  /* ── BRAS ARRIÈRE ─────────────────────────────────────────── */
  (function(){
    var a = p.brasB;
    c.strokeStyle = C.combiO; c.lineWidth = 3.0;
    c.beginPath();
    c.moveTo(-0.6, -20.0);
    c.quadraticCurveTo(-3.4 + a * 0.6, -17.2, -5.2 + a * 1.5, -14.4);
    c.stroke();
    c.fillStyle = C.peauO;
    c.beginPath(); c.ellipse(-5.4 + a * 1.6, -13.8, 1.5, 1.5, 0, 0, 6.2832); c.fill();
  })();

  /* ── TORSE : combinaison sombre, plastron doré ────────────── */
  c.fillStyle = C.combi;
  c.beginPath();
  c.moveTo(-3.5, -13.0);
  c.quadraticCurveTo(-4.4, -19.0, -2.8, -21.4);
  c.lineTo(2.9, -21.4);
  c.quadraticCurveTo(4.5, -18.6, 3.6, -13.0);
  c.closePath(); c.fill();
  /* le plastron : deux plaques et l'éclair entre les deux */
  c.fillStyle = C.or;
  c.beginPath();
  c.moveTo(-3.0, -20.4); c.lineTo(3.1, -20.4);
  c.quadraticCurveTo(3.6, -17.6, 2.6, -16.2);
  c.lineTo(-2.2, -16.2);
  c.quadraticCurveTo(-3.4, -17.8, -3.0, -20.4);
  c.closePath(); c.fill();
  c.fillStyle = C.orC;
  c.fillRect(-2.7, -20.2, 5.5, 0.7);
  /* L'ÉCLAIR. Deux triangles, six pixels de haut : c'est tout ce qui
     tient à cette taille, et c'est suffisant — la forme est connue. */
  c.fillStyle = C.combiO;
  c.beginPath();
  c.moveTo(0.9, -20.0); c.lineTo(-1.3, -18.1); c.lineTo(0.1, -18.0);
  c.lineTo(-0.8, -16.4); c.lineTo(1.5, -18.5); c.lineTo(0.1, -18.6);
  c.closePath(); c.fill();
  /* la ceinture */
  c.fillStyle = C.orO;
  c.fillRect(-3.4, -13.9, 7.0, 1.2);
  c.fillStyle = C.orC;
  c.fillRect(-0.8, -13.9, 1.6, 1.2);

  /* ── BRAS AVANT, PLIÉ, MAIN OUVERTE ───────────────────────── */
  (function(){
    var a = p.brasA;
    c.strokeStyle = C.combiC; c.lineWidth = 3.1;
    c.beginPath();
    c.moveTo(1.2, -20.0);
    c.quadraticCurveTo(4.2 + a * 0.5, -18.4, 5.4 + a * 1.2, -15.8);
    c.stroke();
    /* le brassard */
    c.strokeStyle = C.or; c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(3.4 + a * 0.3, -19.2); c.lineTo(4.2 + a * 0.4, -18.4);
    c.stroke();
    c.fillStyle = C.peau;
    c.beginPath(); c.ellipse(5.6 + a * 1.3, -15.2, 1.7, 1.6, 0, 0, 6.2832); c.fill();
  })();

  /* ── TÊTE ─────────────────────────────────────────────────── */
  c.save();
  c.translate(0.7, -24.6);
  c.rotate(0.08);
  teteSpeed(c, 3.3, true);
  c.restore();

  c.restore();                        // la penche
  c.restore();                        // l'échelle
}

/* ================================================================
   LE HÉROS SUR LA CARTE — son halo et ses traits de vitesse

   Dessiné AVANT le personnage, donc sous lui : un halo posé par-dessus
   l'aurait laiteux alors qu'il doit en sortir. Voir dessineUniteMonde.
   ================================================================ */
function auraSpeed(c, x, y, z, tps, n){
  /* LE DISQUE AU SOL, à peine marqué. Il ne dessine PAS la zone
     d'attraction — onze cases feraient une flaque immense qui
     mangerait la carte. Il dit seulement « c'est lui ». */
  c.save();
  c.globalCompositeOperation = "lighter";
  var bat = 0.62 + 0.38 * Math.sin(tps * 3.4 + n);
  var g = c.createRadialGradient(x, y - 2 * z, 1, x, y - 2 * z, 15 * z);
  g.addColorStop(0, "rgba(255,214,120," + (0.30 * bat).toFixed(3) + ")");
  g.addColorStop(1, "rgba(255,190,70,0)");
  c.fillStyle = g;
  c.beginPath(); c.ellipse(x, y - 2 * z, 15 * z, 8 * z, 0, 0, 6.2832); c.fill();
  c.restore();
}
/* Les traits de vitesse : trois filets derrière lui, décalés, qui se
   raccourcissent. Ils ne sortent QUE lorsqu'il avance vraiment — un
   héros à l'arrêt qui laisse des traînées ferait décor. */
function traitsSpeed(c, u, x, y, z, tps){
  if(!(u.vitVue > 0.4)) return;
  var s = u.droite ? 1 : -1;
  c.save();
  c.globalCompositeOperation = "lighter";
  c.strokeStyle = "#FFD27A"; c.lineCap = "round";
  for(var k = 0; k < 3; k++){
    var ph = (tps * 2.6 + k * 0.37 + u.n * 0.11) % 1;
    var lg = (7 + k * 3) * (1 - ph * 0.55);
    var yy = y - (7 + k * 6) * z;
    c.globalAlpha = 0.42 * (1 - ph);
    c.lineWidth = (1.5 - k * 0.28) * z;
    c.beginPath();
    c.moveTo(x - s * (5 + ph * 9) * z, yy);
    c.lineTo(x - s * (5 + ph * 9 + lg) * z, yy);
    c.stroke();
  }
  c.restore();
}

/* ================================================================
   LE FRONTON DE SA NAVETTE

   « Tu fais dans le jeu le fronton qui est un peu doré, et tu fais la
   tête du héros. »

   Le portrait est résolu à la demande par dessinePortrait, qui cherche
   « portrait » + le nom du type : il suffit donc que la fonction
   existe, et elle peut vivre ici plutôt que dans la planche commune.
   C'est le chemin qu'a déjà pris l'Ogre.

   LE FOND EST DORÉ, ET C'EST LE SEUL DU JEU. Les huit autres tuiles
   sont violettes ; celle-ci ne peut pas être confondue, même du coin
   de l'œil, même sur une tablette tenue à bout de bras.

   IL LUI FAUT UN BUSTE, comme aux cinq autres. Une tête seule au
   milieu d'un carré doré paraît deux fois plus petite qu'elle n'est :
   la rangée met les six frontons côte à côte, et ce qui manquait
   n'était pas de la taille, c'étaient les épaules sous le menton. Le
   visage monte donc dans le haut du cadre et le buste ferme le bas,
   au même endroit que chez la Furie et le Commando.
   ================================================================ */
function portraitSpeed(c){
  var C = C_SPEED, H = 84;
  /* le fond : un dégradé d'ambre, et des traits de vitesse */
  var g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#6A4A12"); g.addColorStop(0.55, "#3E2A0C"); g.addColorStop(1, "#241706");
  c.fillStyle = g; c.fillRect(0, 0, 100, H);
  c.save();
  c.globalCompositeOperation = "lighter";
  c.strokeStyle = C.or; c.lineCap = "round";
  for(var k = 0; k < 4; k++){
    c.globalAlpha = 0.17 - k * 0.035;
    c.lineWidth = 3.2 - k * 0.7;
    c.beginPath();
    c.moveTo(2, 10 + k * 17); c.lineTo(34 + k * 15, 10 + k * 17);
    c.stroke();
  }
  c.restore();

  c.save();
  c.translate(50, 4);
  c.lineJoin = "round"; c.lineCap = "round";

  /* ── LE FOULARD, DERRIÈRE LES ÉPAULES ─────────────────────────
     Deux pans étroits qui sortent du cadre, pas une cape : une masse
     pleine posée sur l'épaule se lisait comme une épaulette, et ce
     qu'on veut voir ici c'est du tissu emporté par la course. */
  (function(){
    var pan = [ { y:41, l:1.00, e:5.4, t:C.foulard },
                { y:47, l:0.78, e:3.6, t:C.foulardO } ];
    for(var i = 0; i < pan.length; i++){
      var p = pan[i];
      c.strokeStyle = p.t; c.lineWidth = p.e;
      c.beginPath();
      c.moveTo(-10, p.y);
      c.bezierCurveTo(-28 * p.l, p.y + 2, -42 * p.l, p.y + 14, -56 * p.l, p.y + 9);
      c.stroke();
    }
  })();

  /* ── ÉPAULES ET BUSTE, jusqu'au bas du cadre ─────────────────── */
  var gt = c.createLinearGradient(-26, 46, 26, 80);
  gt.addColorStop(0, C.combiC); gt.addColorStop(0.55, C.combi); gt.addColorStop(1, C.combiO);
  c.fillStyle = gt;
  c.beginPath();
  c.moveTo(-30, 80);
  c.bezierCurveTo(-29, 57, -16, 47, 0, 46);
  c.bezierCurveTo(16, 47, 29, 57, 30, 80);
  c.closePath(); c.fill();

  /* le plastron doré, et l'éclair qu'il porte : les deux marques du
     personnage, reprises telles quelles de son dessin en pied */
  var gp = c.createLinearGradient(-14, 52, 14, 80);
  gp.addColorStop(0, C.orC); gp.addColorStop(0.5, C.or); gp.addColorStop(1, C.orO);
  c.fillStyle = gp;
  c.beginPath();
  c.moveTo(-15, 80);
  c.bezierCurveTo(-14, 62, -8, 54, 0, 53);
  c.bezierCurveTo(8, 54, 14, 62, 15, 80);
  c.closePath(); c.fill();
  c.fillStyle = "#3A2606";
  c.beginPath();
  c.moveTo(2.6, 59); c.lineTo(-4.4, 69); c.lineTo(0.2, 69);
  c.lineTo(-2.4, 78); c.lineTo(5.2, 66.6); c.lineTo(0.4, 66.6);
  c.closePath(); c.fill();

  /* le col du foulard, par-dessus les épaules */
  c.strokeStyle = C.foulard; c.lineWidth = 5.4;
  c.beginPath();
  c.moveTo(-13, 48.5); c.quadraticCurveTo(0, 55, 13, 48.5);
  c.stroke();
  c.strokeStyle = C.foulardC; c.lineWidth = 1.7;
  c.beginPath();
  c.moveTo(-11, 47.4); c.quadraticCurveTo(0, 53, 11, 47.4);
  c.stroke();

  /* ── LE VISAGE, cadré comme celui des autres ─────────────────── */
  c.translate(0, 26);
  teteSpeed(c, 25.5, false);
  c.restore();

  /* le liseré doré du fronton */
  c.strokeStyle = "rgba(255,214,120,.55)"; c.lineWidth = 2;
  c.strokeRect(1, 1, 98, H - 2);
}
