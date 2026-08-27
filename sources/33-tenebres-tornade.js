/* ================================================================
   LES TORNADES DE FLAMMES — Mily dans les ténèbres

   « De vraies tornades, mais que de flammes, qui se déplacent sur
   certaines longueurs et font une traînée de flammes au sol. Et
   toutes les troupes dans la traînée meurent. »

   TROIS TEMPS, ET LE PREMIER EST LE PLUS IMPORTANT.

     1. LA DESCENTE (2,6 s). L'entonnoir sort du nuage et cherche le
        sol. RIEN N'EST MORTEL pendant ce temps, et le point où il va
        toucher est marqué par un anneau qui se resserre. C'est ce qui
        sépare un danger d'un piège : on la voit venir, on sait où, et
        l'on a de quoi s'écarter. Sans cette phase, une tornade qui
        apparaît sur un débarquement le tue avant qu'on ait vu quoi
        que ce soit — et le joueur a déjà dit, à propos de la Nova,
        qu'il ne voulait pas de piège contre lui.
     2. LA MARCHE (13 s). Elle avance TOUT DROIT, à 2,9 cases par
        seconde. La ligne droite n'est pas un raccourci de code : une
        trajectoire imprévisible ne se fuit pas, une ligne droite se
        contourne PAR LE CÔTÉ. C'est la seule façon de rendre la
        parade possible sans rendre le danger nul.
     3. LA TRAÎNÉE (5 s par point). Le sol qu'elle a foulé brûle
        encore. C'est là que se joue le vrai coût : on ne perd pas
        seulement les troupes qu'elle touche, on perd le passage.

   CE QU'ELLE NE TOUCHE PAS : LES BÂTIMENTS. Ce n'est pas un oubli.
   abimeBatiment() crédite jeu.degatsMoi, donc le score, donc le palier
   de puissance. Une tornade qui démolit des défenses offrirait des
   points à un joueur qui a posé sa tablette — et sur une carte notée,
   un cadeau automatique n'est pas un effet, c'est une faille. Elle
   tue les troupes et les bêtes, et elle brûle la terre.

   ELLE N'EST PAS PARTAGÉE SUR LE RÉSEAU, exactement comme la foudre
   de la jungle : chaque client tire les siennes. Le protocole n'a rien
   à apprendre, et deux joueurs sur la même île ne voient pas la même
   tornade — ce qui n'a aucune importance, puisqu'elle ne touche que
   les troupes de celui qui la voit.
   ================================================================ */

/* ---------------------------------------------------------------
   LE MODÈLE
   --------------------------------------------------------------- */
/* Une tornade neuve, tirée sous un nuage. On la lance vers l'intérieur
   de l'île : partie vers le bord, elle sortirait de la carte en trois
   secondes et n'aurait servi à rien. */
function creeTornade(){
  var nu = jeu.nuages && jeu.nuages.length
         ? jeu.nuages[(Math.random() * jeu.nuages.length) | 0] : null;
  var gx = nu ? nu.gx : 20 + Math.random() * (PLAGE_X0 - 30);
  var gy = nu ? nu.gy : Math.random() * GH;
  gx = borne(gx, 8, PLAGE_X0 - 8);
  gy = borne(gy, 6, GH - 6);
  /* Le cap : on vise un point de l'île tiré au sort, plutôt qu'un
     angle. Un angle tiré au hasard sort de la carte une fois sur
     deux ; un point visé donne une traversée qui sert. */
  var vx = 10 + Math.random() * (PLAGE_X0 - 20);
  var vy = 4 + Math.random() * (GH - 8);
  var dx = vx - gx, dy = vy - gy, d = Math.hypot(dx, dy) || 1;
  return {
    gx:gx, gy:gy,
    cx:gx, cy:gy,                 // d'où elle est sortie, dans le nuage
    dx:dx / d, dy:dy / d,
    age:0,
    /* la longueur de SA course : « certaines longueurs », pas toutes
       la même — une tornade qui traverse toujours la même distance
       devient un métronome */
    vie:EQ.TORNADE_VIE * (0.7 + Math.random() * 0.6),
    tour:Math.random() * 6.2832,  // sa phase de rotation propre
    posee:0,                      // a-t-elle touché terre ?
    dernier:0                     // distance depuis le dernier point de traînée
  };
}

/* Le pas de la traînée, en cases. Assez serré pour que la bande soit
   continue, assez large pour ne pas fabriquer trois cents points. */
var TORNADE_PAS = 0.55;

/* ---------------------------------------------------------------
   LA MISE À JOUR — appelée depuis majJeu, seulement dans les ténèbres
   --------------------------------------------------------------- */
var tornadeAutour = [];
function majTornades(dt){
  var i, k;

  /* --- l'apparition --- */
  jeu.prochaineTornade -= dt;
  if(jeu.prochaineTornade <= 0){
    jeu.prochaineTornade = EQ.TORNADE_PERIODE * (0.72 + Math.random() * 0.56);
    /* Jamais plus de deux à la fois. Trois entonnoirs sur l'écran,
       ce n'est plus une menace, c'est une météo dont on ne peut rien
       faire. */
    if(jeu.tornades.length < 2){
      jeu.tornades.push(creeTornade());
      if(son.tornade) son.tornade();
      if(typeof effraieFaune === "function")
        effraieFaune(jeu.tornades[jeu.tornades.length - 1].gx,
                     jeu.tornades[jeu.tornades.length - 1].gy, 30, jeu.tps);
    }
  }

  /* --- les tornades vivantes --- */
  for(i = jeu.tornades.length - 1; i >= 0; i--){
    var t = jeu.tornades[i];
    t.age += dt;
    t.tour += dt * 5.6;

    if(t.age < EQ.TORNADE_DESCENTE){
      /* elle descend encore : elle ne bouge pas et ne tue rien */
      continue;
    }
    if(!t.posee){
      t.posee = 1;
      jeu.secousse = Math.min(8, jeu.secousse + 3.0);
    }

    /* elle avance, tout droit */
    var av = EQ.TORNADE_VITESSE * dt;
    t.gx += t.dx * av;
    t.gy += t.dy * av;

    /* elle sème sa traînée */
    t.dernier += av;
    while(t.dernier >= TORNADE_PAS){
      t.dernier -= TORNADE_PAS;
      jeu.brulures.push({ gx:t.gx, gy:t.gy, age:0,
                          ph:Math.random() * 6.2832 });
    }

    /* CE QUE SON PIED TOUCHE MEURT. Comme la foudre : on ne blesse
       pas, on tue. Une tornade de feu qui laisserait des survivants
       à demi cuits ne se lirait pas. */
    tueDansLeFeu(t.gx, t.gy, EQ.TORNADE_RAYON);

    /* elle s'éteint : par le temps, ou en sortant de l'île */
    if(t.age > EQ.TORNADE_DESCENTE + t.vie ||
       t.gx < 2 || t.gx > PLAGE_X0 + 2 || t.gy < 1 || t.gy > GH - 1){
      jeu.tornades.splice(i, 1);
    }
  }

  /* --- la terre qui brûle derrière --- */
  for(k = jeu.brulures.length - 1; k >= 0; k--){
    var b = jeu.brulures[k];
    b.age += dt;
    if(b.age > EQ.TORNADE_TRAINEE){ jeu.brulures.splice(k, 1); continue; }
    /* La traînée ne tue plus dans son dernier tiers : elle refroidit,
       et l'on doit pouvoir repasser derrière une tornade sans y
       laisser sa flotte. Sans cela, une île traversée deux fois
       devenait un labyrinthe de couloirs interdits. */
    if(b.age < EQ.TORNADE_TRAINEE * 0.66)
      tueDansLeFeu(b.gx, b.gy, EQ.TORNADE_TRAINEE_R);
  }
}

/* Ce qui est dedans meurt. Les troupes ET les bêtes — mais aucun
   bâtiment : voir l'en-tête du fichier. */
function tueDansLeFeu(gx, gy, r){
  unitesAutour(gx, gy, r, tornadeAutour);
  for(var i = 0; i < tornadeAutour.length; i++){
    var u = tornadeAutour[i];
    if(u.pv <= 0) continue;
    if(Math.hypot(u.gx - gx, u.gy - gy) > r) continue;
    toucheUnite(u, u.pv + 1);
  }
  for(var k = 0; k < jeu.creatures.length; k++){
    var c = jeu.creatures[k];
    if(c.pv <= 0) continue;
    if(Math.hypot(c.gx - gx, c.gy - gy) > r) continue;
    abimeCreature(c, c.pv + 1);
  }
}

/* ---------------------------------------------------------------
   LE DESSIN
   --------------------------------------------------------------- */
/* LA TRAÎNÉE AU SOL. Elle est peinte avec les autres décalques du
   terrain, sous les troupes : c'est de la terre en feu, pas un effet
   posé par-dessus la scène. Trois disques concentriques en « lighter »,
   du rouge sombre au jaune blanc, plus une cendre noire qui reste
   quand le feu retombe. */
function dessineBrulureSol(c, b, tps){
  var p = iso(b.gx, b.gy);
  var v = b.age / EQ.TORNADE_TRAINEE;          // 0 neuf → 1 éteint
  /* LE FEU TIENT, LA CENDRE ATTEND. Le premier jet éteignait la
     flamme en « 1 - v² » : la traînée virait à la trace de boue en
     une seconde, et l'on ne voyait plus qu'un trait brun derrière la
     tornade. Elle brûle franchement les deux premiers tiers — très
     exactement le temps pendant lequel elle TUE — puis retombe vite.
     Ce que l'œil voit et ce qui tue disent enfin la même chose. */
  var vif = v < 0.66 ? (1 - v * 0.35) : Math.max(0, (1 - v) / 0.34) * 0.78;
  /* la cendre, d'abord, sous le feu */
  c.globalCompositeOperation = "source-over";
  /* LA CENDRE NE DOIT PAS MENTIR SUR LA LARGEUR. Elle était peinte
     sur 1,5 case quand la traînée n'en tue que 1,1 : le joueur voyait
     un couloir plus large que le danger, et contournait de trop loin.
     Elle est maintenant à la mesure exacte de ce qui brûle, et bien
     plus discrète — c'est le FEU qu'on doit voir, la cendre n'est que
     ce qu'il laisse. */
  c.globalAlpha = 0.10 + v * 0.26;
  c.fillStyle = "#140d0e";
  c.beginPath();
  c.ellipse(p.x, p.y, EQ.TORNADE_TRAINEE_R * RX * 1.06,
                      EQ.TORNADE_TRAINEE_R * RY * 1.06, 0, 0, 6.2832); c.fill();
  if(vif <= 0.02){ c.globalAlpha = 1; return; }
  /* LE FEU. `globalAlpha` REVIENT À 1 : il portait encore l'opacité de
     la cendre, qui se multipliait avec celle des dégradés — la flamme
     sortait à un dixième de ce qu'elle devait être, et la traînée se
     lisait comme un sillon de boue derrière la tornade au lieu d'un
     couloir en feu. Une ligne, et tout l'effet change. */
  c.globalAlpha = 1;
  c.globalCompositeOperation = "lighter";
  var souffle = 0.86 + Math.sin(tps * 7 + b.ph) * 0.14;
  var couches = [
    [1.55, "255,64,14", 0.34],
    [1.00, "255,140,36", 0.40],
    [0.52, "255,232,164", 0.38]
  ];
  for(var i = 0; i < couches.length; i++){
    var rr = couches[i][0] * souffle;
    var g = c.createRadialGradient(p.x, p.y, 1, p.x, p.y, rr * RX);
    g.addColorStop(0, "rgba(" + couches[i][1] + "," + (couches[i][2] * vif) + ")");
    g.addColorStop(1, "rgba(" + couches[i][1] + ",0)");
    c.fillStyle = g;
    c.beginPath(); c.ellipse(p.x, p.y, rr * RX, rr * RY, 0, 0, 6.2832); c.fill();
  }
  c.globalCompositeOperation = "source-over";
  c.globalAlpha = 1;
}

/* Tous les points de traînée, en une passe. Appelée par
   dessineZonesSol : c'est un décalque de terrain. */
function dessineBrulures(c, tps){
  if(!jeu.brulures || !jeu.brulures.length) return;
  c.save();
  for(var i = 0; i < jeu.brulures.length; i++) dessineBrulureSol(c, jeu.brulures[i], tps);
  c.restore();
}

/* L'ENTONNOIR.

   PREMIER JET RATÉ, ET CE QU'IL A APPRIS. Il était fait de vingt-six
   lamelles horizontales en dégradé, empilées en « lighter ». À
   l'écran : une grosse lueur ovale. Aucune rotation, aucun bord,
   aucune taille — un halo, pas un objet.

   CE QUI FAIT QU'UNE COLONNE SE LIT COMME UNE TORNADE, ce sont deux
   choses que les dégradés empilés ne peuvent pas donner :
     1. UNE SILHOUETTE NETTE. Un profil tracé d'un seul trait — évasé
        au pied, PINCÉ au tiers, largement ouvert vers le nuage — et
        rempli. Le pincement est le dessin entier : sans lui c'est un
        cône, et un cône n'a jamais tourné.
     2. DES BANDES QUI MONTENT EN TOURNANT. Des arcs qui traversent la
        silhouette en biais, décalés en phase avec la hauteur. C'est
        d'elles que vient la rotation ; l'œil suit la spirale et
        comprend que ça visse.
   Le reste — le halo au pied, le cœur blanc, les braises arrachées —
   ne fait que poser l'objet dans la scène.

   Elle est dans le TRI DE PROFONDEUR, comme les geysers : une colonne
   de feu doit passer devant ce qui est au nord d'elle et derrière ce
   qui est au sud, sinon elle flotte. */
var TOR_HAUT = 320;              // hauteur de l'entonnoir, en pixels du monde

/* Le demi-profil, en cases, à la hauteur u (0 = le pied, 1 = le
   nuage). Une seule fonction, appelée par le remplissage comme par
   les bandes : les deux doivent parler de la même forme. */
function torProfil(u){
  return 0.42 + Math.pow(u, 2.1) * 4.6 + Math.exp(-u * 11) * 1.25;
}

function dessineTornadeMonde(c, t, tps){
  var p = versEcran(cam, t.gx, t.gy);
  var z = cam.z;
  var descend = t.age < EQ.TORNADE_DESCENTE;
  /* pendant la descente le pied n'est pas encore arrivé : la colonne
     est coupée par le bas, et elle descend */
  var pied = descend ? (1 - t.age / EQ.TORNADE_DESCENTE) : 0;
  var H = TOR_HAUT * z;
  var i, k;
  /* le point de l'axe à la hauteur u : c'est le VRILLAGE, un décalage
     latéral qui tourne avec la hauteur et avec le temps */
  function axeX(u){ return p.x + Math.sin(t.tour + u * 3.4) * torProfil(u) * 0.30 * RX * z; }

  c.save();

  /* --- 1. L'ANNEAU D'AVERTISSEMENT, pendant la descente.
     Il se resserre sur le point de contact : voilà où ça va tomber, et
     voilà dans combien de temps. C'est la promesse faite au joueur. */
  if(descend){
    var q = 1 - pied;
    c.globalCompositeOperation = "lighter";
    c.strokeStyle = "rgba(255,150,50," + (0.28 + q * 0.55) + ")";
    c.lineWidth = (1.2 + q * 2.4) * z;
    var rA = 5.5 - q * 3.7;
    c.beginPath();
    c.ellipse(p.x, p.y, rA * RX * z, rA * RY * z, 0, 0, 6.2832);
    c.stroke();
    /* et un second anneau, fixe, qui dit la zone mortelle à venir */
    c.strokeStyle = "rgba(255,90,30,.28)";
    c.lineWidth = 1.1 * z;
    c.beginPath();
    c.ellipse(p.x, p.y, EQ.TORNADE_RAYON * RX * z, EQ.TORNADE_RAYON * RY * z, 0, 0, 6.2832);
    c.stroke();
  }

  /* --- 2. LE HALO AU PIED : la lumière qu'elle jette sur la terre. */
  if(!descend){
    c.globalCompositeOperation = "lighter";
    var gh = c.createRadialGradient(p.x, p.y, 2, p.x, p.y, 5.6 * RX * z);
    gh.addColorStop(0, "rgba(255,186,80,.52)");
    gh.addColorStop(0.5, "rgba(255,112,26,.19)");
    gh.addColorStop(1, "rgba(220,60,10,0)");
    c.fillStyle = gh;
    c.beginPath(); c.ellipse(p.x, p.y, 5.6 * RX * z, 5.6 * RY * z, 0, 0, 6.2832); c.fill();
  }

  /* --- 3. LA SILHOUETTE, d'un seul trait.
     On monte par le bord gauche, on redescend par le bord droit. */
  var N = 30;
  c.globalCompositeOperation = "lighter";
  c.beginPath();
  for(i = 0; i <= N; i++){
    var u = pied + (1 - pied) * (i / N);
    var w = torProfil(u) * RX * z * 0.5;
    var x = axeX(u) - w, y = p.y - u * H;
    if(i === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  for(i = N; i >= 0; i--){
    var u2 = pied + (1 - pied) * (i / N);
    var w2 = torProfil(u2) * RX * z * 0.5;
    c.lineTo(axeX(u2) + w2, p.y - u2 * H);
  }
  c.closePath();
  /* le remplissage : blanc chaud au pied, rouge sombre vers le nuage.
     L'opacité NE tombe pas avec la hauteur — un entonnoir transparent
     en haut n'a plus d'origine. */
  var gf = c.createLinearGradient(0, p.y, 0, p.y - H);
  gf.addColorStop(0,    "rgba(255,236,190,.52)");
  gf.addColorStop(0.12, "rgba(255,168,60,.44)");
  gf.addColorStop(0.45, "rgba(236,96,26,.34)");
  gf.addColorStop(1,    "rgba(150,34,12,.30)");
  c.globalAlpha = descend ? 0.72 : 1;
  c.fillStyle = gf;
  c.fill();

  /* --- 4. LES BANDES QUI VISSENT.
     Chacune traverse la silhouette en biais ; leur phase se décale
     avec la hauteur, si bien que l'œil suit une spirale qui monte.
     C'est CE détail qui fait la rotation, et rien d'autre. */
  c.save();
  c.clip();                                    // rien ne sort de la silhouette
  var NB = 15;
  for(k = 0; k < NB; k++){
    /* la bande monte avec le temps et repart en bas : c'est
       l'aspiration */
    var ub = ((k / NB) + (tps * 0.30) % 1) % 1;
    if(ub < pied) continue;
    var yb = p.y - ub * H;
    var wb = torProfil(ub) * RX * z * 0.5;
    var xb = axeX(ub);
    var chaud = 1 - ub;
    c.globalAlpha = (0.16 + chaud * 0.24) * (descend ? 0.7 : 1);
    c.strokeStyle = "rgba(255," + Math.round(180 + chaud * 60) + ","
                  + Math.round(90 + chaud * 120) + ",1)";
    c.lineWidth = (2.2 + chaud * 3.4) * z;
    c.beginPath();
    /* une ellipse très aplatie, inclinée : vue de trois quarts, un
       anneau qui ceinture la colonne est exactement cela */
    c.ellipse(xb, yb, wb * 1.05, Math.max(1.5, wb * 0.26), 0.22, 0.15, 3.0);
    c.stroke();
  }
  c.restore();
  c.globalAlpha = 1;

  /* --- 5. LE CŒUR BLANC au pied : sans lui la colonne est un nuage
     orange ; avec lui, c'est un feu. */
  if(!descend){
    var gc = c.createLinearGradient(0, p.y, 0, p.y - H * 0.36);
    gc.addColorStop(0, "rgba(255,250,230,.62)");
    gc.addColorStop(0.35, "rgba(255,196,96,.30)");
    gc.addColorStop(1, "rgba(255,120,30,0)");
    c.fillStyle = gc;
    c.beginPath();
    c.ellipse(p.x, p.y - H * 0.13, 1.15 * RX * z, H * 0.19, 0, 0, 6.2832);
    c.fill();
  }

  /* --- 6. LES BRAISES ARRACHÉES, en spirale.
     Elles donnent l'échelle : sans un objet NET qui tourne, une
     colonne de dégradés n'a pas de taille. */
  for(k = 0; k < 22; k++){
    var ue = ((tps * 0.46 + k * 0.0454 + t.tour * 0.04) % 1);
    if(ue < pied) continue;
    var ae = t.tour * 1.7 + k * 2.1 + ue * 8.5;
    var re = torProfil(ue) * 0.66;
    var ex = axeX(ue) + Math.cos(ae) * re * RX * z * 0.5;
    var ey = p.y - ue * H + Math.sin(ae) * re * RY * z * 0.45;
    var te = 1 - ue;
    c.fillStyle = "rgba(255," + Math.round(160 + te * 80) + ","
                + Math.round(70 + te * 120) + "," + (0.34 + te * 0.5) + ")";
    c.beginPath();
    c.arc(ex, ey, (0.55 + te * 1.6) * z, 0, 6.2832);
    c.fill();
  }

  c.globalCompositeOperation = "source-over";
  c.restore();
}

/* ---------------------------------------------------------------
   LE SON — un grondement bas et long, qui dit qu'elle est là avant
   qu'on la voie. Greffé sur `son` au premier emploi, comme le
   tonnerre de la jungle, pour ne pas avoir à toucher 95-son.js.
   --------------------------------------------------------------- */
function tornadeSon(){
  if(typeof son === "undefined" || !son.ok()) return;
  var ac = son.ac, t = ac.currentTime;
  var duree = 4.2;
  /* le souffle : du bruit passe-bas qui monte puis retombe */
  var s = ac.createBufferSource();
  s.buffer = son.bruit; s.loop = true;
  s.playbackRate.value = 0.42;
  var f = ac.createBiquadFilter();
  f.type = "lowpass"; f.Q.value = 4.5;
  f.frequency.setValueAtTime(140, t);
  f.frequency.exponentialRampToValueAtTime(620, t + 1.4);
  f.frequency.exponentialRampToValueAtTime(110, t + duree);
  var g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.16, t + 0.9);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  s.connect(f); f.connect(g); g.connect(son.maitre);
  s.start(t); s.stop(t + duree + 0.1);
  /* le sub, qui donne la masse */
  var o = ac.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(38, t);
  o.frequency.exponentialRampToValueAtTime(22, t + duree);
  var go = ac.createGain();
  go.gain.setValueAtTime(0.0001, t);
  go.gain.linearRampToValueAtTime(0.13, t + 0.5);
  go.gain.exponentialRampToValueAtTime(0.0001, t + duree * 0.9);
  o.connect(go); go.connect(son.maitre);
  o.start(t); o.stop(t + duree);
}
var tornadeSonGreffe = false;
function greffeSonTornade(){
  if(tornadeSonGreffe || typeof son === "undefined") return;
  tornadeSonGreffe = true;
  son.tornade = tornadeSon;
}
