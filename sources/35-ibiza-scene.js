/* ================================================================
   LA SCÈNE D'IBIZA — le DJ, les lasers, et ceux qui dansent

   « Au centre, un carré réservé et une sorte de scène avec un DJ qui
   met de la musique, des lasers qui pointent vers le ciel et une
   vingtaine de personnes qui dansent devant lui. »

   CE QUE C'EST, ET CE QUE CE N'EST PAS. La scène est du DÉCOR : elle
   n'a pas de points de vie, elle n'entre pas dans le tableau des
   bâtiments, on ne peut pas la détruire et elle ne rapporte rien.
   C'est délibéré — un objet destructible au milieu de la carte
   changerait l'index des bâtiments à chaque retouche du dessin, et
   surtout il donnerait des points pour avoir cassé une platine.
   Le seul effet de la scène sur les règles est le TROU qu'elle creuse
   dans le quadrillage militaire, et celui-là vit dans le noyau
   (SCENE_GX, dansLaScene) parce qu'il change la carte.

   POURQUOI LES DANSEURS SONT VIVANTS ET NON PEINTS. Tout le reste du
   décor de ce jeu est pré-cuit — une seule image, collée mille fois.
   Ceux-ci bougent : ils sautent, se balancent et lèvent les bras,
   chacun à son tempo. Vingt figurines animées coûtent quelques
   dizaines de tracés par image, et c'est le prix à payer : des
   danseurs figés ne dansent pas, ils attendent. C'est très
   exactement la différence entre une fête et un décor de fête.

   TOUT EST CALÉ SUR UN BATTEMENT COMMUN. `battement()` rend la phase
   du morceau, et les lasers, les lumières de la scène et les vingt
   danseurs la lisent tous. Sans elle chacun aurait son rythme et l'on
   verrait vingt personnes danser sur vingt musiques différentes — ce
   qui est exactement l'effet qu'on obtient quand on tire un
   Math.random() par danseur.
   ================================================================ */

/* Le tempo, en battements par minute, et la phase qui en découle.
   128 BPM : c'est le tempo de ce qu'on joue là-bas, et surtout c'est
   assez rapide pour qu'un saut se lise sans être épuisant à l'œil. */
var IBI_BPM = 128;
function battement(tps){ return (tps * IBI_BPM / 60) % 1; }
/* La frappe : 1 sur le temps, retombe vite. C'est elle qui fait
   « pomper » toute la scène. */
function frappe(tps){
  var b = battement(tps);
  return Math.exp(-b * 5.2);
}

/* ---------------------------------------------------------------
   LA GÉOMÉTRIE DE LA SCÈNE, en un seul endroit
   --------------------------------------------------------------- */
/* Le podium, le portique et les lasers doivent se tenir : si chacun
   redéfinit sa hauteur dans son coin, les faisceaux partent d'un
   point du ciel qui n'est pas le haut des mâts. Les trois cotes
   vivent donc ici. Elles sont en CASES pour les longueurs au sol et
   en pixels de scène pour les hauteurs — un pixel de scène étant ce
   que `c.scale(z, z)` rend. */
var IBI_DEMI = 3.5;      // demi-diagonale du plancher, en RAYONS-MONDE (voir plus bas)
var IBI_H    = 26;       // hauteur du praticable
var IBI_MH   = 96;       // hauteur des mâts au-dessus du plancher
/* ATTENTION AUX UNITÉS, elles se ressemblent et ne sont pas les
   mêmes. RX est la demi-largeur à l'écran d'un cercle de rayon UN,
   soit 52/√2 ; un déplacement d'UNE CASE en gx, lui, ne vaut que 26
   en x. Le plancher, tracé à ±IBI_DEMI * RX, mesure donc
   IBI_DEMI/√2 = 2,47 CASES du centre à chacun de ses quatre coins, et
   non 3,5. C'est cette confusion qui avait planté la foule une case
   et demie trop loin, avec un trou de sable entre elle et la scène. */
var IBI_COIN = IBI_DEMI * Math.SQRT1_2;   // 2,47 cases : le coin du plancher

/* ---------------------------------------------------------------
   LES DANSEURS
   --------------------------------------------------------------- */
/* Vingt personnes DEVANT la scène. « Devant », à l'écran, ce n'est
   pas « gy plus grand » : avancer d'une case en gy déplace vers le
   BAS-GAUCHE. Le sud de l'écran, celui où la foule doit être pour
   qu'on la voie entre le bord de l'image et le podium, c'est gx ET gy
   qui montent ensemble. La foule est donc semée dans un repère à
   deux axes d'écran : `t` la largeur (gx - gy, purement horizontal)
   et `s` la profondeur (gx + gy, purement vertical).
   Le tirage est DÉTERMINISTE : la même île rend toujours la même
   foule, sinon la piste se réorganiserait à chaque retour au
   briefing. */
var IBI_NB_DANSEURS = 20;
function fabriqueDanseurs(){
  var out = [], al = prng(0x1B12A), i;
  for(i = 0; i < IBI_NB_DANSEURS; i++){
    /* La largeur, TIRÉE PAR TRANCHES : chaque danseur a sa bande, et
       tire sa place DEDANS. Un tirage libre sur vingt laisse toujours
       un trou quelque part et un tas ailleurs — et un trou au milieu
       du premier rang, devant le DJ, c'est le seul endroit où l'œil
       va. La profondeur, elle, reste libre : c'est elle qui casse
       l'alignement que les tranches créeraient. */
    var t = ((i + al()) / IBI_NB_DANSEURS * 2 - 1) * 3.4;
    /* la profondeur : le coin sud du plancher est à IBI_COIN, on se
       range juste derrière. Les bords reculent (|t| * 0.28) : une
       foule devant une scène fait un arc, pas une barre. */
    var s = IBI_COIN + 0.35 + al() * 3.2 + Math.abs(t) * 0.28;
    out.push({
      gx:SCENE_GX + t + s,
      gy:SCENE_GY - t + s,
      /* le décalage sur le battement : personne ne saute exactement
         en même temps que son voisin, et c'est ce petit désordre qui
         fait une foule plutôt qu'une chorégraphie */
      dec:al() * 0.34,
      /* trois façons de danser : sauter, se balancer, lever les bras */
      style:(al() * 3) | 0,
      /* la moitié saute un temps sur deux : à vingt qui sautent
         ensemble, la piste ressemble à un ressort */
      demi:al() < 0.5 ? 1 : 0,
      teinte:(al() * 6) | 0,
      taille:1.5 + al() * 0.6,
      droite:al() < 0.5 ? 1 : -1
    });
  }
  return out;
}

/* Six tenues, franches : à cette taille, c'est la couleur qui
   distingue une personne d'une autre, pas son visage. */
var IBI_TENUES = [
  { haut:"#ff4d8d", bas:"#2a2740" }, { haut:"#3ee0d0", bas:"#243040" },
  { haut:"#ffd24a", bas:"#3a2c22" }, { haut:"#a97bff", bas:"#262038" },
  { haut:"#ffffff", bas:"#1f2a38" }, { haut:"#ff8a3c", bas:"#2e2436" }
];
var IBI_PEAUX = ["#f0d0ae", "#d8a878", "#a87448", "#7a5232"];

/* Un danseur, dans le repère du monde. Il tient en une vingtaine de
   tracés : à l'écran il fait vingt pixels de haut, et le détail qu'on
   y mettrait ne se verrait pas — ce qui se voit, c'est le MOUVEMENT. */
function dessineDanseur(c, d, tps){
  var p = versEcran(cam, d.gx, d.gy);
  var z = cam.z * d.taille;
  if(z < 0.06) return;
  var T = IBI_TENUES[d.teinte];
  var b = (battement(tps) + d.dec) % 1;
  /* un temps sur deux pour ceux qui lèvent le pied : le compte des
     battements écoulés dit lequel */
  var mesure = Math.floor(tps * IBI_BPM / 60 + d.dec);
  var actif = d.demi ? (mesure % 2 === 0) : 1;
  var f = Math.exp(-b * 5.2) * (actif ? 1 : 0.35);

  var saut = 0, pencheX = 0, bras = 0;
  if(d.style === 0){ saut = f * 4.6; bras = 0.5 + f * 0.5; }          // il saute
  else if(d.style === 1){ pencheX = Math.sin(b * 6.2832) * 2.2 * d.droite; bras = 0.35; }
  else { bras = 0.2 + f * 1.0; saut = f * 1.4; }                       // bras en l'air

  c.save();
  c.translate(p.x + pencheX * z, p.y - saut * z);
  c.scale(z, z);

  /* l'ombre reste au sol : elle ne saute pas avec lui */
  c.fillStyle = "rgba(30,40,70,.26)";
  c.beginPath();
  c.ellipse(-pencheX, saut, 3.4, 1.5, 0, 0, 6.2832); c.fill();

  /* jambes */
  c.strokeStyle = T.bas; c.lineWidth = 1.7; c.lineCap = "round";
  c.beginPath(); c.moveTo(-0.9, -4.4); c.lineTo(-1.5 - pencheX * 0.2, 0); c.stroke();
  c.beginPath(); c.moveTo(0.9, -4.4); c.lineTo(1.5 - pencheX * 0.2, 0); c.stroke();
  /* buste */
  c.fillStyle = T.haut;
  c.beginPath();
  if(c.roundRect) c.roundRect(-2.1, -10.4, 4.2, 6.4, 1.2);
  else c.rect(-2.1, -10.4, 4.2, 6.4);
  c.fill();
  /* bras : c'est eux qui portent la danse */
  c.strokeStyle = IBI_PEAUX[d.teinte % 4]; c.lineWidth = 1.3;
  var ay = -10.0, lev = bras * 4.2;
  c.beginPath();
  c.moveTo(-1.9, ay);
  c.quadraticCurveTo(-4.4, ay - lev * 0.5, -4.0 - bras, ay - lev);
  c.stroke();
  c.beginPath();
  c.moveTo(1.9, ay);
  c.quadraticCurveTo(4.4, ay - lev * 0.5, 4.0 + bras, ay - lev);
  c.stroke();
  /* tête */
  c.fillStyle = IBI_PEAUX[d.teinte % 4];
  c.beginPath(); c.arc(0, -12.4, 2.0, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(20,14,26,.75)";
  c.beginPath(); c.arc(0, -13.2, 2.0, 3.34, 6.08); c.fill();
  c.restore();
}

/* ---------------------------------------------------------------
   LA SCÈNE
   --------------------------------------------------------------- */
/* Elle est dans le TRI DE PROFONDEUR, comme un bâtiment : les troupes
   qui passent au sud doivent lui passer devant, et celles du nord
   derrière. Sans quoi une scène de trois mètres flotte au-dessus de
   tout le monde. */
var IBI_SC = {
  pont:"#333c4c", pontO:"#242c39", pontC:"#454f61",
  jupe:"#1e2836", metal:"#4a535f", metalC:"#79838f",
  enceinte:"#22262e", enceinteC:"#3a404a", membrane:"#12151a"
};
/* Les quatre teintes des projecteurs, changées à chaque temps. */
var IBI_TEINTES = ["255,77,141", "62,224,208", "255,210,74", "169,123,255"];

function dessineSceneIbiza(c, tps){
  var p = versEcran(cam, SCENE_GX, SCENE_GY);
  var z = cam.z;
  var f = frappe(tps);
  var i;
  c.save();
  c.translate(p.x, p.y);
  c.scale(z, z);

  /* --- 1. LE PODIUM, un losange iso en volume --- */
  /* L'ÉCHELLE, REFAITE UNE FOIS. Le podium mesurait 9,5 CASES de
     demi-largeur — dix-neuf cases de côté, la moitié du carré réservé —
     pendant que le mobilier était dessiné en unités de l'ordre du
     pixel : une estrade de terrain de football avec une platine de
     maison de poupée dessus. Tout est maintenant dans le même repère :
     le podium fait trois cases et demie de demi-diagonale, et le
     mobilier est à sa taille. Le carré réservé, lui, reste large —
     c'est la PISTE, et elle doit tenir la foule. */
  var LX = IBI_DEMI * RX, LY = IBI_DEMI * RY, H = IBI_H;
  function dessus(dy){
    c.beginPath();
    c.moveTo(0, -LY + dy); c.lineTo(LX, dy); c.lineTo(0, LY + dy); c.lineTo(-LX, dy);
    c.closePath();
  }
  /* l'ombre portée */
  c.fillStyle = "rgba(30,45,80,.22)";
  dessus(2); c.fill();
  /* les deux faces visibles */
  c.fillStyle = IBI_SC.jupe;
  c.beginPath();
  c.moveTo(-LX, 0); c.lineTo(0, LY); c.lineTo(0, LY - H); c.lineTo(-LX, -H);
  c.closePath(); c.fill();
  c.fillStyle = "#161d28";
  c.beginPath();
  c.moveTo(LX, 0); c.lineTo(0, LY); c.lineTo(0, LY - H); c.lineTo(LX, -H);
  c.closePath(); c.fill();
  /* LE PLANCHER, SOMBRE. Il était couleur bois clair — c'est-à-dire
     très exactement la couleur du sable d'Ibiste autour : de loin le
     podium ne se lisait pas comme une scène mais comme un plateau de
     terrain surélevé. Un plancher de scène est NOIR, et ce qu'on y
     voit, ce sont les flaques de lumière des projecteurs. */
  var gp = c.createLinearGradient(-LX, -H, LX, -H);
  gp.addColorStop(0, IBI_SC.pontC); gp.addColorStop(0.5, IBI_SC.pont);
  gp.addColorStop(1, IBI_SC.pontO);
  c.fillStyle = gp;
  dessus(-H); c.fill();
  /* les lames du plancher */
  c.strokeStyle = "rgba(255,255,255,.07)";
  c.lineWidth = 0.9;
  for(i = -4; i <= 4; i++){
    c.beginPath();
    c.moveTo(i * LX / 5, -LY * (1 - Math.abs(i) / 5) - H);
    c.lineTo(i * LX / 5,  LY * (1 - Math.abs(i) / 5) - H);
    c.stroke();
  }
  /* LES FLAQUES DE COULEUR. Elles sont posées AVANT le mobilier, et
     découpées au losange : sans le `clip`, la lumière de la scène
     baverait sur le sable et le podium perdrait son arête. */
  var mes = Math.floor(tps * IBI_BPM / 60);
  c.save();
  dessus(-H); c.clip();
  c.globalCompositeOperation = "lighter";
  for(i = 0; i < 5; i++){
    var fx0 = (i - 2) * LX * 0.36;
    var fy0 = -H + LY * 0.30 - Math.abs(i - 2) * LY * 0.10;
    var gf = c.createRadialGradient(fx0, fy0, 0, fx0, fy0, LX * 0.40);
    var cf = IBI_TEINTES[(mes + i) % 4];
    gf.addColorStop(0, "rgba(" + cf + "," + (0.20 + f * 0.26) + ")");
    gf.addColorStop(1, "rgba(" + cf + ",0)");
    c.fillStyle = gf;
    c.save();
    c.translate(fx0, fy0); c.scale(1, 0.5); c.translate(-fx0, -fy0);
    c.beginPath(); c.arc(fx0, fy0, LX * 0.40, 0, 6.2832); c.fill();
    c.restore();
  }
  c.restore();
  /* le liseré lumineux du bord, qui pompe sur le battement */
  c.strokeStyle = "rgba(60,230,220," + (0.34 + f * 0.55) + ")";
  c.lineWidth = 2.4;
  dessus(-H); c.stroke();

  /* --- 2. LES DEUX ENCEINTES, de part et d'autre --- */
  for(i = 0; i < 2; i++){
    var ex = (i ? 1 : -1) * LX * 0.72, ey = -H - 2;
    c.save();
    c.translate(ex, ey);
    var eh = 46 + f * 1.8;              // elle tressaute sur la frappe
    c.fillStyle = IBI_SC.enceinte;
    c.fillRect(-10, -eh, 20, eh);
    c.fillStyle = IBI_SC.enceinteC;
    c.fillRect(-10, -eh, 5, eh);
    /* les deux haut-parleurs */
    c.fillStyle = IBI_SC.membrane;
    c.beginPath(); c.ellipse(0, -eh * 0.72, 7, 7, 0, 0, 6.2832); c.fill();
    c.beginPath(); c.ellipse(0, -eh * 0.28, 4.4, 4.4, 0, 0, 6.2832); c.fill();
    c.fillStyle = "rgba(255,255,255,.10)";
    c.beginPath(); c.ellipse(-1.6, -eh * 0.74, 2.8, 2.8, 0, 0, 6.2832); c.fill();
    /* le souffle : un anneau qui part de la membrane à chaque frappe */
    if(f > 0.12){
      c.strokeStyle = "rgba(160,240,255," + (f * 0.30) + ")";
      c.lineWidth = 2.2;
      c.beginPath();
      c.ellipse(0, -eh * 0.72, 7 + (1 - f) * 22, 7 + (1 - f) * 22, 0, 0, 6.2832);
      c.stroke();
    }
    c.restore();
  }

  /* --- 3. LA TABLE DU DJ, et le DJ derrière --- */
  /* Reculée d'un tiers vers le nord : le DJ joue au fond de la scène
     et laisse le devant du plancher vide, comme il se doit. */
  var tbase = -H - LY * 0.34;
  var ty = tbase - 17;
  c.fillStyle = "#2b3240";
  c.fillRect(-20, ty, 40, 17);
  c.fillStyle = "#3d4657";
  c.fillRect(-20, ty, 40, 3.4);
  /* deux platines et le mélangeur, vus de dessus en raccourci */
  for(i = 0; i < 2; i++){
    var px2 = (i ? 11.6 : -11.6);
    c.fillStyle = "#161a22";
    c.beginPath(); c.ellipse(px2, ty + 1.0, 6.8, 2.9, 0, 0, 6.2832); c.fill();
    c.fillStyle = "#8f98a8";
    c.beginPath(); c.ellipse(px2, ty + 0.6, 4.2, 1.8, 0, 0, 6.2832); c.fill();
    /* le point rouge du disque, qui tourne */
    var a2 = tps * (i ? 3.4 : -2.8);
    c.fillStyle = "#e8523c";
    c.beginPath();
    c.ellipse(px2 + Math.cos(a2) * 2.9, ty + 0.6 + Math.sin(a2) * 1.2, 1.0, 0.6, 0, 0, 6.2832);
    c.fill();
  }
  /* les faders du mélangeur, qui bougent sur la musique */
  for(i = 0; i < 5; i++){
    var fx = -4.8 + i * 2.4;
    c.fillStyle = "#11141a";
    c.fillRect(fx - 0.5, ty - 0.3, 1.0, 4.8);
    c.fillStyle = i === 2 ? "#3ee0d0" : "#c8d0dc";
    c.fillRect(fx - 1.0, ty + 0.6 + Math.sin(tps * 2.4 + i * 1.7) * 1.5, 2.0, 1.0);
  }

  /* LE DJ. Casque sur les oreilles, une main en l'air sur le temps —
     c'est ce bras qui dit qu'il joue et qu'il ne surveille pas un
     tableau de bord. */
  c.save();
  c.translate(2, ty + 1);
  var lev2 = f * 11;
  c.fillStyle = "#20242e";                              // buste
  c.beginPath();
  if(c.roundRect) c.roundRect(-7.6, -24, 15.2, 23, 4);
  else c.rect(-7.6, -24, 15.2, 23);
  c.fill();
  c.strokeStyle = "#e2c39e"; c.lineWidth = 4.4; c.lineCap = "round";
  c.beginPath(); c.moveTo(-7, -22); c.lineTo(-11.4, -14.6); c.stroke();   // main sur la platine
  c.beginPath();
  c.moveTo(7, -22);
  c.quadraticCurveTo(14.6, -26.6 - lev2 * 0.5, 13.4, -30.4 - lev2);       // l'autre en l'air
  c.stroke();
  c.fillStyle = "#e8caa6";                              // tête
  c.beginPath(); c.arc(0, -30.4, 7, 0, 6.2832); c.fill();
  c.fillStyle = "#1b1520";
  c.beginPath(); c.arc(0, -32.9, 7, 3.3, 6.12); c.fill();
  /* le casque */
  c.strokeStyle = "#12161d"; c.lineWidth = 2.7;
  c.beginPath(); c.arc(0, -31, 9.2, 3.34, 6.08); c.stroke();
  c.fillStyle = "#12161d";
  c.beginPath(); c.ellipse(-8.9, -30.4, 2.9, 4.1, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(8.9, -30.4, 2.9, 4.1, 0, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(62,224,208,.8)";
  c.beginPath(); c.ellipse(8.9, -30.4, 1.1, 1.9, 0, 0, 6.2832); c.fill();
  c.restore();

  /* --- 4. LE PORTIQUE, derrière : trois mâts et deux poutres --- */
  /* LE PORTIQUE ÉTAIT PLAT. Il était fait de deux mâts verticaux aux
     deux extrémités de l'écran et d'une poutre HORIZONTALE entre eux :
     un rectangle dessiné dans le repère de l'écran, posé sur une image
     isométrique. Rien ne trahit plus vite un décor collé qu'une ligne
     horizontale au milieu d'un monde où AUCUNE arête ne l'est.
     Il suit maintenant les deux arêtes ARRIÈRE du plancher — ouest
     vers nord, nord vers est — donc trois mâts et deux poutres qui
     descendent chacune dans son axe iso. C'est le même objet, mais il
     est enfin DANS la scène au lieu d'être devant. */
  var mh = IBI_MH, ir = 0.90;                    // les pieds, rentrés sur le plancher
  var pieds = [
    { x:-LX * ir, y:-H },                        // coin ouest
    { x:0,        y:-H - LY * ir },              // coin nord
    { x: LX * ir, y:-H }                         // coin est
  ];
  /* Une poutre en treillis : deux membrures parallèles et un zigzag
     entre elles. À cette taille, c'est le zigzag qui dit « structure
     de scène » plutôt que « barre ». */
  function poutre(a, b, ep){
    var dx = b.x - a.x, dy = b.y - a.y;
    var n = Math.max(3, Math.round(Math.sqrt(dx * dx + dy * dy) / 13));
    c.strokeStyle = IBI_SC.metal; c.lineWidth = 2.6;
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    c.beginPath(); c.moveTo(a.x, a.y + ep); c.lineTo(b.x, b.y + ep); c.stroke();
    c.strokeStyle = "rgba(121,131,143,.72)"; c.lineWidth = 1.5;
    c.beginPath();
    for(var q = 0; q <= n; q++){
      var qx = a.x + dx * q / n, qy = a.y + dy * q / n + (q % 2 ? ep : 0);
      if(q === 0) c.moveTo(qx, qy); else c.lineTo(qx, qy);
    }
    c.stroke();
  }
  /* les trois mâts */
  for(i = 0; i < 3; i++){
    var mx2 = pieds[i].x, my2 = pieds[i].y;
    c.strokeStyle = IBI_SC.metal; c.lineWidth = 4.4;
    c.beginPath(); c.moveTo(mx2, my2); c.lineTo(mx2, my2 - mh); c.stroke();
    c.strokeStyle = "rgba(121,131,143,.6)"; c.lineWidth = 1.6;
    for(var k = 1; k < 9; k++){
      var yk = my2 - mh * k / 9;
      c.beginPath(); c.moveTo(mx2 - 4.2, yk); c.lineTo(mx2 + 4.2, yk - 3); c.stroke();
    }
    /* le socle */
    c.fillStyle = "#1c222c";
    c.beginPath(); c.ellipse(mx2, my2, 7, 3.2, 0, 0, 6.2832); c.fill();
  }
  /* les deux poutres, à la cote des sommets */
  var hauts = [
    { x:pieds[0].x, y:pieds[0].y - mh },
    { x:pieds[1].x, y:pieds[1].y - mh },
    { x:pieds[2].x, y:pieds[2].y - mh }
  ];
  poutre(hauts[0], hauts[1], 7);
  poutre(hauts[1], hauts[2], 7);

  /* LES PROJECTEURS pendus aux poutres : ils changent de couleur au
     battement, tous ensemble — c'est ce qui fait qu'on voit la
     musique. Quatre par poutre, le mât du nord en portant un seul :
     sept en tout, comme avant, mais chacun à sa place sur son axe. */
  for(i = 0; i < 7; i++){
    var seg = i < 4 ? 0 : 1;                     // sur quelle poutre
    var u = seg ? (i - 3) / 3 : i / 3;           // où, le long de la poutre
    var A = hauts[seg], B = hauts[seg + 1];
    var lx2 = A.x + (B.x - A.x) * u;
    var ly2 = A.y + (B.y - A.y) * u + 7;
    var col = IBI_TEINTES[(mes + i) % 4];
    c.fillStyle = "#1a1e26";
    c.fillRect(lx2 - 2.8, ly2, 5.6, 7);
    c.fillStyle = "rgba(" + col + "," + (0.40 + f * 0.6) + ")";
    c.beginPath(); c.ellipse(lx2, ly2 + 7.6, 3.2, 2.2, 0, 0, 6.2832); c.fill();
    /* le cône de lumière : il descend vers l'AVANT du plancher, pas
       droit sous la lampe — un projecteur de scène éclaire la scène,
       pas ses propres pieds */
    var cx2 = lx2 * 0.55, cy2 = -H + LY * 0.22;
    var gc = c.createLinearGradient(lx2, ly2 + 6, cx2, cy2);
    gc.addColorStop(0, "rgba(" + col + "," + (0.15 + f * 0.20) + ")");
    gc.addColorStop(1, "rgba(" + col + ",0)");
    c.fillStyle = gc;
    c.beginPath();
    c.moveTo(lx2 - 2.4, ly2 + 7.6);
    c.lineTo(lx2 + 2.4, ly2 + 7.6);
    c.lineTo(cx2 + 15, cy2);
    c.lineTo(cx2 - 15, cy2);
    c.closePath(); c.fill();
  }

  c.restore();
}

/* ---------------------------------------------------------------
   LES LASERS
   --------------------------------------------------------------- */
/* Ils pointent VERS LE CIEL, donc ils passent au-dessus de tout —
   comme les rayons de Mily. Ce sont des faisceaux dans l'air : rien
   ne peut les masquer, et ils ne sont donc PAS dans le tri de
   profondeur.
   Ils balaient lentement et changent d'écartement au battement. Six
   suffisent : à douze on ne voit plus qu'un éventail, et un éventail
   ne balaie pas. */
function dessineLasersIbiza(c, tps){
  var p = versEcran(cam, SCENE_GX, SCENE_GY);
  var z = cam.z;
  if(z < 0.10) return;
  var f = frappe(tps);
  /* L'ORIGINE EST CELLE DU PORTIQUE, pas une hauteur devinée. Elle
     était écrite « p.y - 47 * z » quand les mâts en faisaient 122 :
     les faisceaux naissaient à mi-hauteur, dans le vide au-dessus de
     la tête du DJ. Ils partent maintenant des deux poutres, chacun de
     son point, et le portique les tient vraiment. */
  var LX = IBI_DEMI * RX, LY = IBI_DEMI * RY, ir = 0.90;
  var teintes =["255,60,120", "62,224,208", "255,200,70", "150,110,255",
                 "80,255,160", "255,120,60"];
  c.save();
  c.globalCompositeOperation = "lighter";
  for(var i = 0; i < 6; i++){
    /* réparti sur les deux poutres : ouest → nord, puis nord → est */
    var u = i / 5 * 2;                           // 0..2, la poutre est la partie entière
    var ax, ay, bx, by;
    if(u <= 1){ ax = -LX * ir; ay = -IBI_H;             bx = 0;        by = -IBI_H - LY * ir; }
    else      { ax = 0;        ay = -IBI_H - LY * ir;   bx = LX * ir;  by = -IBI_H;           u -= 1; }
    var ox = ax + (bx - ax) * u;
    var oy = ay + (by - ay) * u - IBI_MH;
    var x0 = p.x + ox * z, base = p.y + oy * z;
    /* le balayage : chaque faisceau a sa vitesse, mais ils repassent
       par le même point de temps en temps — c'est ce croisement qu'on
       attend en regardant des lasers */
    var a = Math.sin(tps * (0.34 + i * 0.055) + i * 1.9) * (0.52 + f * 0.22);
    var lg = (300 + f * 90) * z;
    var x1 = x0 + Math.sin(a) * lg;
    var y1 = base - Math.cos(a) * lg;
    var g = c.createLinearGradient(x0, base, x1, y1);
    var op = 0.16 + f * 0.24;
    g.addColorStop(0, "rgba(" + teintes[i] + "," + op + ")");
    g.addColorStop(0.5, "rgba(" + teintes[i] + "," + (op * 0.55) + ")");
    g.addColorStop(1, "rgba(" + teintes[i] + ",0)");
    c.strokeStyle = g;
    c.lineWidth = (1.1 + f * 1.3) * z;
    c.lineCap = "round";
    c.beginPath(); c.moveTo(x0, base); c.lineTo(x1, y1); c.stroke();
    /* le point d'origine, très net : c'est lui qui ancre le faisceau
       sur le portique au lieu de le laisser flotter */
    c.fillStyle = "rgba(" + teintes[i] + "," + (0.5 + f * 0.4) + ")";
    c.beginPath(); c.arc(x0, base, (0.9 + f * 0.7) * z, 0, 6.2832); c.fill();
  }
  c.restore();
}

/* Tout ce qui danse, dans le tri de profondeur. */
function danseursVisibles(vue, sortie){
  if(!jeu.danseurs) return;
  for(var i = 0; i < jeu.danseurs.length; i++){
    var d = jeu.danseurs[i];
    if(!visible(vue, d.gx, d.gy)) continue;
    sortie.push({ d:d.gx + d.gy, k:14, o:d });
  }
}
