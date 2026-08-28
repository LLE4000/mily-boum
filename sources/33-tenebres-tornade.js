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
  var P = profilTornade(jeu.index);
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
    /* LA LONGUEUR DE SA COURSE. Chacune tire la sienne entre +50 % et
       +100 % du trajet de référence : une tornade qui traverse
       toujours la même distance devient un métronome, et c'est
       justement l'écart entre une petite et une grosse qui fait qu'on
       les regarde. */
    vie:P.vie * (P.trajetMin + Math.random() * (P.trajetMax - P.trajetMin)),
    /* SA SORTE, PORTÉE PAR L'OBJET LUI-MÊME et non relue sur l'île à
       chaque image. Le dessin passe par le tri de profondeur, où l'on
       n'a plus que la tornade en main ; et si un jour deux sortes
       devaient cohabiter, rien n'aurait à changer. */
    style:P.style,
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
  /* LE PROFIL DE CETTE ÎLE, lu une fois par image. Tout ce qui suit
     était écrit en EQ.TORNADE_* — c'est-à-dire en dur pour les
     ténèbres. Le moteur ne connaît plus la sorte : il applique des
     nombres, et c'est le noyau qui dit lesquels. */
  var P = profilTornade(jeu.index);
  if(!P) return;

  /* --- l'apparition --- */
  jeu.prochaineTornade -= dt;
  if(jeu.prochaineTornade <= 0){
    jeu.prochaineTornade = P.periode * (0.72 + Math.random() * 0.56);
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

    if(t.age < P.descente){
      /* elle descend encore : elle ne bouge pas et ne tue rien */
      continue;
    }
    if(!t.posee){
      t.posee = 1;
      jeu.secousse = Math.min(8, jeu.secousse + 3.0);
    }

    /* ELLE RESTE DANS LA ZONE DE JEU.
       Avant, elle sortait de l'île et disparaissait : la moitié des
       tornades mouraient hors du terrain sans avoir servi à rien, et
       plus on rallongeait leur course, plus elles s'échappaient tôt.
       Elle VIRE maintenant quand elle approche d'un bord — pas un
       rebond, une courbe : on infléchit peu à peu son cap vers
       l'intérieur, d'autant plus fort qu'elle est près du bord. Une
       tornade qui rebondit à angle droit se lirait comme une bille ;
       celle-ci décrit de grandes boucles molles, ce qui est
       exactement ce que fait une vraie. */
    var m = P.marge;
    var rx = 0, ry = 0;
    if(t.gx < LARGEUR_ROCHE + m)  rx =  (LARGEUR_ROCHE + m - t.gx) / m;
    if(t.gx > PLAGE_X0 - m)       rx = -(t.gx - (PLAGE_X0 - m)) / m;
    if(t.gy < m)                  ry =  (m - t.gy) / m;
    if(t.gy > GH - m)             ry = -(t.gy - (GH - m)) / m;
    if(rx || ry){
      /* on ajoute la poussée vers l'intérieur au cap, puis on
         renormalise : la vitesse ne change pas, seule la direction */
      var vir = 2.6 * dt;
      t.dx += rx * vir; t.dy += ry * vir;
      var n = Math.hypot(t.dx, t.dy) || 1;
      t.dx /= n; t.dy /= n;
    }

    /* elle avance */
    var av = P.vitesse * dt;
    t.gx += t.dx * av;
    t.gy += t.dy * av;
    /* et par sécurité, elle ne franchit jamais la bordure : un cap
       tiré exactement le long d'un bord pourrait glisser dehors sans
       que le virage ait prise dessus */
    t.gx = borne(t.gx, LARGEUR_ROCHE + 2, PLAGE_X0 - 2);
    t.gy = borne(t.gy, 2, GH - 2);

    /* elle sème sa traînée */
    t.dernier += av;
    while(t.dernier >= TORNADE_PAS){
      t.dernier -= TORNADE_PAS;
      jeu.brulures.push({ gx:t.gx, gy:t.gy, age:0, style:P.style,
                          ph:Math.random() * 6.2832 });
    }

    /* CE QUE SON PIED TOUCHE MEURT. Comme la foudre : on ne blesse
       pas, on tue. Une tornade de feu qui laisserait des survivants
       à demi cuits ne se lirait pas. */
    tueDansLeFeu(t.gx, t.gy, P.rayon);
    /* les bêtes ne meurent pas dedans, mais elles la fuient : sans
       cela, un sanglier resterait planté au milieu des flammes */
    t.effroi = (t.effroi || 0) - dt;
    if(t.effroi <= 0){
      t.effroi = 0.5;
      if(typeof effraieFaune === "function") effraieFaune(t.gx, t.gy, 12, jeu.tps);
    }

    /* elle ne s'éteint plus QUE par le temps : elle ne peut plus
       sortir de l'île, elle y tourne jusqu'au bout de sa course */
    if(t.age > P.descente + t.vie) jeu.tornades.splice(i, 1);
  }

  /* --- la terre qui brûle derrière --- */
  for(k = jeu.brulures.length - 1; k >= 0; k--){
    var b = jeu.brulures[k];
    b.age += dt;
    if(b.age > P.trainee){ jeu.brulures.splice(k, 1); continue; }
    /* La traînée ne tue plus dans son dernier tiers : elle refroidit,
       et l'on doit pouvoir repasser derrière une tornade sans y
       laisser sa flotte. Sans cela, une île traversée deux fois
       devenait un labyrinthe de couloirs interdits. */
    if(b.age < P.trainee * 0.66)
      tueDansLeFeu(b.gx, b.gy, P.traineeR);
  }
}

/* ELLE NE TUE QUE NOS TROUPES. Rien d'autre — ni les bâtiments, ni
   les bêtes. Le joueur l'a tranché en un mot : « c'est uniquement
   notre troupe à nous que les tornades peuvent détruire ».

   Les deux exclusions n'ont pas la même raison, et les deux comptent.
   LES BÂTIMENTS : abimeBatiment() crédite jeu.degatsMoi, donc le
   score, donc le palier de puissance — une tornade qui démolit des
   défenses offrirait des points à un joueur qui a posé sa tablette.
   LES BÊTES : elles ne rapportent presque rien, mais Gégé la belette
   et Tweety le canari sont UNIQUES par île, leur tueur est gravé dans
   l'instantané partagé et s'affiche à tout le salon. Un phénomène
   automatique ne doit pas pouvoir écrire un nom là-dedans, ni faire
   disparaître un animal que quelqu'un cherchait.
   Elles fuient quand même — effraieFaune() les disperse à
   l'apparition : elles ont peur du feu sans mourir dedans. */
function tueDansLeFeu(gx, gy, r){
  unitesAutour(gx, gy, r, tornadeAutour);
  for(var i = 0; i < tornadeAutour.length; i++){
    var u = tornadeAutour[i];
    if(u.pv <= 0 || u.leurre) continue;
    if(Math.hypot(u.gx - gx, u.gy - gy) > r) continue;
    toucheUnite(u, u.pv + 1);
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
  /* Aiguillage de sorte, comme pour l'entonnoir : la traînée du
     tourbillon d'étoiles n'est pas du feu et se peint ailleurs. */
  if(b.style === "etoiles" && typeof dessineTraceEtoileeSol === "function")
    return dessineTraceEtoileeSol(c, b, tps);
  var PB = profilTornade(jeu.index) || {};
  var duree = PB.trainee || EQ.TORNADE_TRAINEE;
  var largeur = PB.traineeR || EQ.TORNADE_TRAINEE_R;
  var p = iso(b.gx, b.gy);
  var v = b.age / duree;                       // 0 neuf → 1 éteint
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
  c.ellipse(p.x, p.y, largeur * RX * 1.06,
                      largeur * RY * 1.06, 0, 0, 6.2832); c.fill();
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

   TROISIÈME ÉCRITURE, ET LES DEUX PREMIÈRES DISENT POURQUOI.

   Le premier jet empilait vingt-six lamelles en dégradé : à l'écran,
   une grosse lueur ovale — aucune rotation, aucun bord, aucune taille.
   Le deuxième a donné la forme (un profil pincé, des anneaux qui
   vissent), et c'était le bon squelette : on lisait enfin une
   tornade. Mais on lisait une tornade DE TERRE. Un cône brun,
   parfaitement opaque, aux bords lisses comme un objet tourné, avec
   des rayures crème peintes dessus. Tout, sauf du feu.

   CE QUI SÉPARE UNE COLONNE DE FEU D'UN CÔNE PEINT — et aucun de ces
   quatre points n'est décoratif :

     1. LE FEU EST FAIT DE COUCHES, PAS D'UNE SURFACE. Un vrai feu se
        regarde à travers : sombre et large au bord, orange au milieu,
        blanc et étroit au cœur. On empile donc QUATRE silhouettes de
        largeur décroissante et de clarté croissante. Une seule
        silhouette remplie, même bien colorée, restera toujours un
        solide.
     2. SES BORDS BOUGENT. Un profil lisse est un objet tourné au
        tour ; une flamme ondule. Le profil reçoit une somme de deux
        sinus qui dépendent de la hauteur ET du temps — c'est peu de
        chose au calcul, et c'est ce qui fait la différence entre
        « ça brûle » et « c'est posé là ».
     3. LA LUMIÈRE VIENT DU CŒUR. En « lighter », un rouge sombre
        n'ajoute presque rien et se lit comme du brun. Les couches
        montent donc franchement en température vers l'intérieur, et
        le cœur est presque blanc.
     4. LE HAUT NE S'ARRÊTE PAS, IL SE DISSOUT. Une colonne qui finit
        net a une extrémité, donc une taille finie, donc elle ne vient
        de nulle part. La dernière couche se délave et de la fumée
        monte au-dessus : elle se perd dans le ciel, et c'est de là
        qu'on la croit tombée.

   Elle est dans le TRI DE PROFONDEUR, comme les geysers : une colonne
   de feu doit passer devant ce qui est au nord d'elle et derrière ce
   qui est au sud, sinon elle flotte. */
var TOR_HAUT = 330;              // hauteur de l'entonnoir, en pixels du monde

/* Le demi-profil, en cases, à la hauteur u (0 = le pied, 1 = le
   nuage). `tps` et `ph` font onduler les bords : sans eux la colonne
   est un solide de révolution. Une seule fonction, appelée par toutes
   les couches et par les anneaux — elles doivent parler de la même
   forme, ondulation comprise. */
function torProfil(u, tps, ph){
  /* Le sommet est plus ouvert qu'au deuxième jet (4,6 → 6,4) : une
     tornade s'évase vers le nuage, et c'est cette ouverture qui la
     raccroche au ciel. Le pied, lui, reste serré — c'est le PINCEMENT
     entre les deux qui fait tout le dessin. */
  var base = 0.40 + Math.pow(u, 2.0) * 6.4 + Math.exp(-u * 12) * 1.15;
  var houle = Math.sin(u * 9.5 - tps * 3.1 + ph) * 0.085
            + Math.sin(u * 21 - tps * 5.3 + ph * 1.7) * 0.045;
  return base * (1 + houle);
}

/* Une silhouette de l'entonnoir, à une largeur donnée. On monte par le
   bord gauche et l'on redescend par le bord droit ; `haut` coupe la
   colonne avant le sommet pour les couches internes, qui ne montent
   pas aussi loin que l'enveloppe. */
/* LA POINTE PENDANT LA DESCENTE. Couper la silhouette à une hauteur
   donne un bord PLAT : l'entonnoir pendait du ciel comme un tube
   scié. Une tornade qui descend s'effile — c'est même à cela qu'on
   voit qu'elle cherche encore le sol. On resserre donc la largeur sur
   la dernière demi-case avant la coupe, jusqu'à zéro. */
function torEffile(u, pied){
  if(pied <= 0) return 1;
  var d = (u - pied) / 0.16;
  return d >= 1 ? 1 : Math.sqrt(Math.max(0, d));
}
function torSilhouette(c, t, p, z, H, pied, k, haut, tps){
  var N = 34, i, u, w, pr;
  c.beginPath();
  for(i = 0; i <= N; i++){
    u = pied + (haut - pied) * (i / N);
    pr = torProfil(u, tps, t.tour);
    w = pr * RX * z * 0.5 * k * torEffile(u, pied);
    var x = p.x + Math.sin(t.tour + u * 3.4) * pr * 0.30 * RX * z - w;
    if(i === 0) c.moveTo(x, p.y - u * H); else c.lineTo(x, p.y - u * H);
  }
  for(i = N; i >= 0; i--){
    u = pied + (haut - pied) * (i / N);
    pr = torProfil(u, tps, t.tour);
    w = pr * RX * z * 0.5 * k * torEffile(u, pied);
    c.lineTo(p.x + Math.sin(t.tour + u * 3.4) * pr * 0.30 * RX * z + w, p.y - u * H);
  }
  c.closePath();
}

function dessineTornadeMonde(c, t, tps){
  /* L'AIGUILLAGE DE SORTE. Le tri de profondeur ne connaît qu'un
     numéro de couche ; c'est ici que les deux tornades se séparent, et
     nulle part ailleurs. Tout ce qui précède — naissance, marche,
     traînée, mort — leur est commun. */
  if(t.style === "etoiles" && typeof dessineTourbillonMonde === "function")
    return dessineTourbillonMonde(c, t, tps);
  var P = profilTornade(jeu.index) || {};
  var p = versEcran(cam, t.gx, t.gy);
  var z = cam.z;
  var desc = P.descente || EQ.TORNADE_DESCENTE;
  var descend = t.age < desc;
  /* pendant la descente le pied n'est pas encore arrivé : la colonne
     est coupée par le bas, et elle descend */
  var pied = descend ? (1 - t.age / desc) : 0;
  var H = (P.haut || TOR_HAUT) * z;
  var k;

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
    /* et un second anneau, fixe : la zone qui va tuer, à la case près */
    c.strokeStyle = "rgba(255,90,30,.30)";
    c.lineWidth = 1.1 * z;
    c.beginPath();
    c.ellipse(p.x, p.y, (P.rayon || EQ.TORNADE_RAYON) * RX * z,
                        (P.rayon || EQ.TORNADE_RAYON) * RY * z, 0, 0, 6.2832);
    c.stroke();
  }

  /* --- 2. LE HALO AU PIED : la lumière qu'elle jette sur la terre. */
  if(!descend){
    c.globalCompositeOperation = "lighter";
    var gh = c.createRadialGradient(p.x, p.y, 2, p.x, p.y, 6.2 * RX * z);
    gh.addColorStop(0, "rgba(255,180,80,.34)");
    gh.addColorStop(0.45, "rgba(255,104,24,.16)");
    gh.addColorStop(1, "rgba(220,60,10,0)");
    c.fillStyle = gh;
    c.beginPath(); c.ellipse(p.x, p.y, 6.2 * RX * z, 6.2 * RY * z, 0, 0, 6.2832); c.fill();
  }

  /* --- 3. LA FUMÉE, AU-DESSUS. Peinte AVANT le feu, pour qu'elle
     passe derrière : c'est ce qui reste quand la flamme s'est
     éteinte, et c'est elle qui raccroche la colonne au ciel. */
  c.globalCompositeOperation = "source-over";
  for(k = 0; k < 7; k++){
    var uf = 0.82 + k * 0.055;
    var yf = p.y - uf * H - k * 5 * z;
    var rf = (3.2 + k * 1.5) * RX * z * 0.5;
    var af = 0.10 * (1 - k / 7) * (descend ? 0.5 : 1);
    var gs = c.createRadialGradient(p.x + Math.sin(t.tour * 0.4 + k) * rf * 0.35, yf, 1,
                                    p.x, yf, rf);
    gs.addColorStop(0, "rgba(58,38,34," + af + ")");
    gs.addColorStop(1, "rgba(40,26,24,0)");
    c.fillStyle = gs;
    c.beginPath(); c.ellipse(p.x, yf, rf, rf * 0.5, 0, 0, 6.2832); c.fill();
  }

  /* --- 4. LE CORPS, EN QUATRE COUCHES DE FEU.
     De l'extérieur vers le cœur : large et sombre, puis orange, puis
     vif, puis presque blanc. Les couches internes montent moins haut
     — un feu est plus chaud en bas, et sa partie blanche s'arrête
     bien avant le sommet. */
  c.globalCompositeOperation = "lighter";
  var couches = [
    /* largeur, hauteur atteinte, couleur au pied,     couleur au sommet,   alpha */
    [1.00, 1.00, "214,52,14",  "104,20,10", 0.34],
    [0.78, 0.94, "255,104,24", "150,34,12", 0.40],
    [0.50, 0.80, "255,168,52", "214,70,20", 0.42],
    [0.26, 0.58, "255,238,186", "255,150,60", 0.46]
  ];
  for(k = 0; k < couches.length; k++){
    var L = couches[k];
    var haut = pied + (L[1] - pied) * (L[1] > pied ? 1 : 0);
    if(L[1] <= pied) continue;
    torSilhouette(c, t, p, z, H, pied, L[0], L[1], tps);
    var g = c.createLinearGradient(0, p.y - pied * H, 0, p.y - L[1] * H);
    g.addColorStop(0,    "rgba(" + L[2] + "," + L[4] + ")");
    g.addColorStop(0.55, "rgba(" + L[2] + "," + (L[4] * 0.82) + ")");
    g.addColorStop(1,    "rgba(" + L[3] + ",0)");
    c.fillStyle = g;
    c.globalAlpha = descend ? 0.74 : 1;
    c.fill();
  }
  c.globalAlpha = 1;

  /* --- 5. LES ANNEAUX QUI VISSENT.
     Ils ceinturent la colonne et se décalent avec la hauteur : l'œil
     suit la spirale et comprend que ça tourne. Ils sont maintenant de
     la couleur du feu et non crème — des rayures pâles sur un cône
     se lisaient comme de la peinture. */
  c.save();
  torSilhouette(c, t, p, z, H, pied, 1.0, 1.0, tps);
  c.clip();
  var NB = 17;
  for(k = 0; k < NB; k++){
    var ub = ((k / NB) + (tps * 0.34) % 1) % 1;
    if(ub < pied || ub > 0.97) continue;
    var wb = torProfil(ub, tps, t.tour) * RX * z * 0.5;
    var xb = p.x + Math.sin(t.tour + ub * 3.4) * torProfil(ub, tps, t.tour) * 0.30 * RX * z;
    var chaud = Math.max(0, 1 - ub * 1.25);
    c.globalAlpha = (0.10 + chaud * 0.30) * (descend ? 0.7 : 1);
    c.strokeStyle = "rgba(255," + Math.round(150 + chaud * 100) + ","
                  + Math.round(46 + chaud * 150) + ",1)";
    c.lineWidth = (1.8 + chaud * 3.6) * z;
    c.beginPath();
    c.ellipse(xb, p.y - ub * H, wb * 1.02, Math.max(1.4, wb * 0.24), 0.20, 0.35, 2.85);
    c.stroke();
  }
  c.restore();
  c.globalAlpha = 1;

  /* --- 6. LE PIED QUI ARRACHE.
     Il était deux fois plus large et deux fois plus blanc : une boule
     de lumière au sol qui AVALAIT LE PINCEMENT — c'est-à-dire le seul
     trait qui distingue une tornade d'une flamme. On le rabaisse au
     ras de la terre et on le tient étroit : il doit dire le point de
     morsure, pas éclairer la scène. C'est le halo, en dessous, qui
     porte la lumière. */
  if(!descend){
    var gp = c.createRadialGradient(p.x, p.y - 1 * z, 1, p.x, p.y - 1 * z, 1.5 * RX * z);
    gp.addColorStop(0, "rgba(255,250,232,.50)");
    gp.addColorStop(0.4, "rgba(255,198,104,.24)");
    gp.addColorStop(1, "rgba(255,120,30,0)");
    c.fillStyle = gp;
    c.beginPath();
    c.ellipse(p.x, p.y - 1 * z, 1.5 * RX * z, 1.1 * RY * z, 0, 0, 6.2832); c.fill();
  }

  /* --- 7. LES BRAISES ARRACHÉES, en spirale. Elles donnent l'échelle :
     sans un objet NET qui tourne, une colonne de dégradés n'a pas de
     taille. Certaines sortent du corps — ce sont celles-là qu'on
     suit. */
  for(k = 0; k < 26; k++){
    var ue = ((tps * 0.46 + k * 0.0385 + t.tour * 0.04) % 1);
    if(ue < pied) continue;
    var ae = t.tour * 1.7 + k * 2.1 + ue * 8.5;
    var re = torProfil(ue, tps, t.tour) * (0.62 + (k % 5) * 0.14);
    var ex = p.x + Math.sin(t.tour + ue * 3.4) * torProfil(ue, tps, t.tour) * 0.30 * RX * z
           + Math.cos(ae) * re * RX * z * 0.5;
    var ey = p.y - ue * H + Math.sin(ae) * re * RY * z * 0.45;
    var te = 1 - ue;
    c.fillStyle = "rgba(255," + Math.round(170 + te * 70) + ","
                + Math.round(80 + te * 120) + "," + (0.30 + te * 0.55) + ")";
    c.beginPath();
    c.arc(ex, ey, (0.5 + te * 1.7) * z, 0, 6.2832);
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
function greffeSonTornade(){
  if(typeof son === "undefined") return;
  /* LA GREFFE SUIT L'ÎLE, elle n'est plus posée une fois pour toutes.
     Les deux tornades n'ont pas du tout le même son — l'une gronde,
     l'autre tinte — et le drapeau « déjà greffé » d'origine aurait
     laissé la première entendue imposer son bruit à l'autre pour tout
     le reste de la session. */
  var voulu = (profilTornade(jeu ? jeu.index : -1) || {}).style === "etoiles"
              && typeof tourbillonSon === "function"
            ? tourbillonSon : tornadeSon;
  if(son.tornade !== voulu) son.tornade = voulu;
}
