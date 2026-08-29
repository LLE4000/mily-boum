/* ================================================================
   LE BALAYAGE DE MILY — l'attaque laser d'Ibiza

   « Pendant la musique, Mily envoie depuis ses yeux deux gros rayons
   qui balayent une partie de la map, laissent une traînée de feu au
   sol, et font très mal. Mais il faut que ce soit RIGOUREUSEMENT le
   même événement pour tous les joueurs. »

   ────────────────────────────────────────────────────────────────
   POURQUOI CE N'EST PAS LA MUSIQUE QUI COMMANDE

   La bande-son est GÉNÉRATIVE et LOCALE : chaque appareil fabrique
   les notes de son côté, et `musique.entre` démarre au discours la
   première fois, à la montée les suivantes. Deux joueurs sur la même
   bataille n'entendent donc PAS le même instant du morceau, et ne
   voient pas le même jeu de lumière. Ça ne se voyait pas tant que la
   lumière n'était qu'un décor ; ça deviendrait un défaut grave le
   jour où quelque chose qui TUE en dépendrait.

   Et il n'y a pas de serveur à qui demander l'heure : le salon est un
   courtier qui retient un message, rien de plus. Personne ne peut
   arbitrer.

   ────────────────────────────────────────────────────────────────
   ALORS ON SÉPARE LES DEUX HORLOGES, PAR RÔLE

     CE QUI DOIT ÊTRE IDENTIQUE — quand le rayon part, où il balaye,
     qui il brûle — ne lit que `Date.now()`. Le numéro du balayage est
     un entier que tout le monde calcule pareil, la trajectoire en
     découle par `prng`, et tout le reste est une fonction pure de
     l'avancement. Aucun état, aucun message, AUCUN CHAMP AJOUTÉ À
     L'INSTANTANÉ : rien à fusionner, donc rien à casser. Celui qui
     rejoint au milieu calcule la même chose que les autres sans avoir
     rien reçu de personne — le cas le plus difficile est gratuit.

     CE QUI PEUT DIVERGER — la couleur, l'éclat, la pulsation — lit
     l'horloge musicale locale. Le rayon est au même endroit au même
     instant pour tous, ET il palpite sur le rythme de chacun. Personne
     ne peut voir la différence.

   ────────────────────────────────────────────────────────────────
   ET LES DÉGÂTS N'ONT BESOIN D'AUCUN ARBITRAGE

   Chaque client ne simule que SES PROPRES troupes ; celles des autres
   ne sont que vingt positions échantillonnées, rafraîchies toutes les
   420 ms, des fantômes décoratifs. Si tout le monde applique LE MÊME
   rayon à ses propres troupes, le résultat est juste pour tous : je
   tue les miennes, tu tues les tiennes, et tu vois mes fantômes
   s'éclaircir parce que j'en publie moins. C'est exactement ainsi que
   tout le combat fonctionne déjà.

   Corollaire qui vaut d'être écrit : ce laser ne touche NI
   l'instantané partagé, NI les scores. Il ne tue que des troupes.

   ────────────────────────────────────────────────────────────────
   TROIS ZONES, PARCE QU'UNE SEULE SERAIT UNE LOTERIE

     LE CŒUR, étroit, tue presque tout ce qu'il effleure.
     LE FEU laissé derrière, plus large, brûle dans la durée : on le
       traverse, ça coûte, on choisit.
     LA CENDRE ne fait plus rien, elle se souvient.

   Avec deux secondes de charge avant que le rayon touche le sol : on
   ne meurt pas de ce qu'on n'a pas pu voir venir. Et jamais sur la
   plage — perdre ses navettes dans la seconde qui suit l'accostage
   n'est pas difficile, c'est décourageant.
   ================================================================ */

/* La période, et c'est LE réglage. Deux minutes : un assaut ordinaire
   en voit un, parfois deux. Elle est volontairement sans rapport avec
   la durée du morceau (environ 4 min 4 s), si bien que le balayage
   dérive à travers la musique et ne retombe jamais au même endroit. */
var LM_PERIODE = 120000;

/* Le déroulé, en millisecondes depuis le début de la période. */
var LM_CHARGE = 2200;    // les yeux s'allument, le fil de visée descend
var LM_BALAI  = 9000;    // le balayage lui-même
var LM_CENDRE = 3400;    // ce qui reste à voir une fois le rayon éteint
var LM_TOTAL  = LM_CHARGE + LM_BALAI + LM_CENDRE;

/* La géométrie, en cases. Le rayon décrit un arc CENTRÉ SUR LE QG :
   c'est le mouvement naturel de quelque chose qui sort des yeux, et
   c'est aussi ce qui garantit qu'on ne balaye jamais la plage — le
   rayon le plus long culmine à x = 9 + 104 = 113, très loin des 140
   du sable. */
var LM_R_MIN = 44, LM_R_MAX = 104;
var LM_ARC = 1.05;       // l'amplitude du balayage, en radians (60°)
var LM_ECART_0 = 0.09;   // demi-écartement des deux rayons au départ
var LM_ECART_1 = 0.30;   // … et à l'arrivée : ils s'ouvrent en ciseaux

/* Les trois zones, et ce qu'elles coûtent. Exprimé en dégâts PAR
   SECONDE : le cœur balaye une unité en une demi-seconde environ, ce
   qui fait 1100 points — la Furie, l'Ogre et le Doc n'y survivent
   pas, le Commando non plus, et le TX-90 en sort à un sixième de sa
   vie s'il ne s'attarde pas. C'est la lecture qu'on veut : le blindé
   encaisse un effleurement, personne n'encaisse un arrêt. */
var LM_R_COEUR = 3.2, LM_DEG_COEUR = 2200;
var LM_R_FEU = 5.5,   LM_DEG_FEU = 90;
var LM_FEU_VIE = 3.2;    // secondes de feu au sol derrière le rayon

/* Le test de dégâts tourne à 10 Hz et non à chaque image : le cœur
   avance d'à peine une case et demie entre deux passages, très en
   dessous de son rayon, donc rien ne peut le traverser sans être vu. */
var LM_PAS = 0.1;
var lmHorloge = 0;

/* ────────────────────────────────────────────────────────────────
   LE GRAIN DU BALAYAGE N° n

   Tout ce qui distingue un balayage du suivant tient ici, et tout
   sort de `prng(n)` : le même entier chez tout le monde, donc la même
   trajectoire chez tout le monde, sans un octet échangé.
   ──────────────────────────────────────────────────────────────── */
function grainLaser(n){
  /* Le mélange avant prng : deux balayages consécutifs ne doivent pas
     se ressembler, or n ne bouge que d'une unité. Le nombre d'or sur
     trente-deux bits éparpille, et « >>> 0 » garde un entier non signé
     — prng part d'un décalage de bits, un négatif y ferait n'importe
     quoi. */
  var r = prng(((n * 2654435761) ^ 0x1ace7) >>> 0);
  var a0 = -0.85 + r() * 0.90;          // d'où part le balayage
  var sens = r() < 0.5 ? -1 : 1;        // et dans quel sens il va
  var rd0 = LM_R_MIN + r() * 18;
  var rd1 = LM_R_MAX - r() * 26;
  if(r() < 0.42){ var t = rd0; rd0 = rd1; rd1 = t; }   // spirale rentrante
  return { n:n, a0:sens > 0 ? a0 : a0 + LM_ARC, sens:sens, r0:rd0, r1:rd1 };
}

/* ────────────────────────────────────────────────────────────────
   L'ÉTAT COURANT, OU RIEN

   Une fonction pure de `Date.now()`. Elle ne garde rien, ne publie
   rien, et deux appareils l'appellent avec le même résultat.

   Attention à une chose et une seule : jamais de « | 0 » sur une date
   epoch. 1,77 × 10¹² tronqué sur trente-deux bits donne un nombre
   sans rapport — le piège que msMonde documente déjà dans le noyau.
   ──────────────────────────────────────────────────────────────── */
function laserMily(){
  if(typeof jeu === "undefined" || !jeu || jeu.fin) return null;
  if(!carteScene(jeu.index)) return null;
  /* LA VENGEANCE PASSE DEVANT. Les deux sortent des mêmes yeux : les
     superposer serait illisible, et doublement punitif. Le show cède
     la place, c'est la colère qui compte. */
  if(jeu.vengeance) return null;

  var t = Date.now();
  var n = Math.floor(t / LM_PERIODE);
  var ms = t - n * LM_PERIODE;
  if(ms >= LM_TOTAL) return null;

  var G = grainLaser(n);
  var phase = ms < LM_CHARGE ? "charge"
            : ms < LM_CHARGE + LM_BALAI ? "balai" : "cendre";
  /* `s` est l'avancement du balayage : 0 avant qu'il commence, 1 une
     fois fini. Tout le reste s'exprime avec lui. */
  var s = ms <= LM_CHARGE ? 0
        : Math.min(1, (ms - LM_CHARGE) / LM_BALAI);
  return { g:G, ms:ms, phase:phase, s:s,
           charge:Math.min(1, ms / LM_CHARGE),
           /* de combien de secondes de balayage on dispose derrière
              soi : sert à dater le feu au sol */
           duree:LM_BALAI / 1000 };
}

/* L'angle du rayon k à l'avancement s, et le rayon de l'arc. Les deux
   rayons s'écartent en ciseaux à mesure qu'ils balayent. */
function angleLaser(L, k, s){
  var G = L.g;
  var ecart = LM_ECART_0 + (LM_ECART_1 - LM_ECART_0) * s;
  return G.a0 + G.sens * LM_ARC * s + (k ? ecart : -ecart);
}
function rayonLaser(L, s){ return L.g.r0 + (L.g.r1 - L.g.r0) * s; }

/* Le point au sol, en cases. Borné à l'île, et TENU LOIN DU SABLE. */
function pointLaser(L, k, s){
  var a = angleLaser(L, k, s), r = rayonLaser(L, s);
  var gx = QG_GX + Math.cos(a) * r;
  var gy = QG_GY + Math.sin(a) * r;
  return { gx:borne(gx, 2, PLAGE_X0 - 16), gy:borne(gy, 2, GH - 3) };
}

/* ────────────────────────────────────────────────────────────────
   DEPUIS COMBIEN DE TEMPS LE SOL BRÛLE-T-IL ICI ?

   Sans liste de flammes, sans particules, sans rien qui s'accumule :
   on INVERSE la trajectoire. L'angle d'un point donné dit à quel
   avancement le rayon est passé par là ; l'avancement dit quand ;
   quand dit s'il brûle encore. Une poignée d'opérations par unité,
   et deux appareils trouvent la même réponse parce qu'ils partent du
   même arc.

   Rend l'âge du feu en secondes, ou −1 si le rayon n'est jamais passé
   là. C'est la même fonction qui sert aux dégâts et au dessin.
   ──────────────────────────────────────────────────────────────── */
function ageFeuLaser(L, k, gx, gy){
  var dx = gx - QG_GX, dy = gy - QG_GY;
  var r = Math.sqrt(dx * dx + dy * dy);
  if(r < 6) return -1;                   // au pied de la forteresse, jamais
  var a = Math.atan2(dy, dx);
  var G = L.g;
  /* on résout angleLaser(L,k,s) = a. L'écartement dépend lui aussi de
     s ; il varie peu, on le prend au milieu du balayage — l'erreur
     reste sous le dixième de case, très en dessous des rayons d'effet. */
  var ecart = (LM_ECART_0 + LM_ECART_1) * 0.5 * (k ? 1 : -1);
  var s = (a - G.a0 - ecart) / (G.sens * LM_ARC);
  if(s < 0 || s > L.s) return -1;        // pas encore passé par là
  /* le rayon y était-il à cette distance-là ? */
  if(Math.abs(r - rayonLaser(L, s)) > LM_R_FEU) return -1;
  return (L.s - s) * L.duree;
}

/* ────────────────────────────────────────────────────────────────
   CE QUE ÇA COÛTE — appliqué à NOS troupes, et à elles seules
   ──────────────────────────────────────────────────────────────── */
function majLaserMily(dt){
  var L = laserMily();
  if(!L || L.phase !== "balai"){ lmHorloge = 0; return; }
  lmHorloge += dt;
  if(lmHorloge < LM_PAS) return;
  var pas = lmHorloge;
  lmHorloge = 0;

  var p0 = pointLaser(L, 0, L.s), p1 = pointLaser(L, 1, L.s);
  var i, u, k, d, dx, dy;
  for(i = 0; i < jeu.unites.length; i++){
    u = jeu.unites[i];
    if(u.pv <= 0 || u.leurre) continue;

    /* LE CŒUR d'abord : le gros d'abord, le petit ensuite. */
    var coeur = 0;
    for(k = 0; k < 2; k++){
      var p = k ? p1 : p0;
      dx = u.gx - p.gx; dy = u.gy - p.gy;
      if(dx * dx + dy * dy <= LM_R_COEUR * LM_R_COEUR){ coeur = 1; break; }
    }
    if(coeur){
      toucheUnite(u, LM_DEG_COEUR * pas, { brulure:1 });
      continue;                          // inutile de le brûler en plus
    }

    /* LE FEU laissé derrière, des deux rayons. */
    for(k = 0; k < 2; k++){
      var age = ageFeuLaser(L, k, u.gx, u.gy);
      if(age >= 0 && age <= LM_FEU_VIE){
        /* il s'éteint doucement : le feu frais mord, la braise pique */
        var f = 1 - age / LM_FEU_VIE;
        toucheUnite(u, LM_DEG_FEU * (0.35 + 0.65 * f) * pas, { brulure:1 });
        break;
      }
    }
  }
}

/* ────────────────────────────────────────────────────────────────
   LE FEU AU SOL

   Dessiné AVANT les unités, avec le décor : c'est une brûlure sur le
   sable, pas un voile par-dessus les troupes.

   Et lui non plus n'accumule rien. On échantillonne l'arc déjà
   parcouru en segments, on garde ceux qui brûlent encore, et on les
   trace. Le nombre de segments est BORNÉ par la durée du feu — une
   vingtaine, quelle que soit la longueur du balayage — donc le coût
   ne monte pas avec le temps.

   ET ELLE PASSE AU-DESSUS DES BÂTIMENTS, pas dessous. C'était le
   contraire au premier essai — une brûlure sur le sable, ce qui est
   juste physiquement et INVISIBLE en pratique : le sol d'Ibiza est
   couvert de défenses au point qu'on n'en voit presque rien. Une
   traînée peinte dessous ne se voyait nulle part. Ce sont des flammes,
   elles ont le droit de monter plus haut qu'une tourelle.

   Elle est donc dans le repère ÉCRAN, avec les rayons, et se dessine
   avec `versEcran` — les largeurs sont alors en pixels d'écran, donc
   multipliées par le zoom à la main.
   ──────────────────────────────────────────────────────────────── */
var LM_SEG = 40;

/* ────────────────────────────────────────────────────────────────
   LA COULEUR D'UNE BRÛLURE QUI REFROIDIT

   Au premier essai la traînée portait la teinte du laser, et elle se
   lisait comme un voile de lumière de plus sur une carte qui en est
   déjà pleine — pas comme du feu. Du feu, ça refroidit : blanc, puis
   orange, puis rouge sombre. Et ce dégradé-là a un second mérite, il
   TRANCHE sur les cyans et les roses de la piste, donc on le voit.

   `f` va de 1 (le rayon vient de passer) à 0 (éteint).
   ──────────────────────────────────────────────────────────────── */
function brulureLaser(f){
  if(f <= 0) return "120,26,12";
  var a, b, u;
  if(f > 0.5){ a = [255,120,40]; b = [255,246,214]; u = (f - 0.5) * 2; }
  else       { a = [150,32,14];  b = [255,120,40];  u = f * 2; }
  return Math.round(a[0] + (b[0] - a[0]) * u) + "," +
         Math.round(a[1] + (b[1] - a[1]) * u) + "," +
         Math.round(a[2] + (b[2] - a[2]) * u);
}

function dessineFeuLaser(c, tps){
  var L = laserMily();
  if(!L || L.s <= 0) return;
  if(cam.z < 0.07) return;
  var z = cam.z;

  var H = horlogeIbiza(tps), mes = mesureIbiza(tps);
  var vif = 0.75 + 0.25 * frappe(tps) * (H.mus ? 1 : 0.4);
  /* combien d'avancement représente la durée de vie du feu */
  var fenetre = LM_FEU_VIE / L.duree;
  var k, i, passe;

  c.save();
  c.globalCompositeOperation = "lighter";
  c.lineCap = "round"; c.lineJoin = "round";
  for(k = 0; k < 2; k++){
    /* deux passes : la nappe large et sourde, puis le cœur clair */
    for(passe = 0; passe < 2; passe++){
      for(i = 0; i < LM_SEG; i++){
        var sa = L.s - fenetre * (1 - i / LM_SEG);
        var sb = L.s - fenetre * (1 - (i + 1) / LM_SEG);
        if(sb <= 0) continue;
        if(sa < 0) sa = 0;
        if(sb > L.s) sb = L.s;
        var age = (L.s - sb) * L.duree;
        if(age > LM_FEU_VIE) continue;
        var f = 1 - age / LM_FEU_VIE;         // 1 tout frais, 0 éteint
        var pa = pointLaser(L, k, sa), pb = pointLaser(L, k, sb);
        var A = versEcran(cam, pa.gx, pa.gy), B = versEcran(cam, pb.gx, pb.gy);
        /* la braise ondule : sans ça la traînée est un tuyau */
        var ond = 1 + 0.16 * Math.sin(tps * 7 + i * 1.7 + k * 2.1);
        if(passe === 0){
          /* la nappe qui rougeoit en refroidissant */
          c.strokeStyle = "rgba(" + brulureLaser(f * 0.55) + "," + (0.26 * f * f * vif) + ")";
          c.lineWidth = LM_R_FEU * 2 * 26 * z * ond;
        }else{
          /* et le sillon, encore blanc juste derrière le rayon */
          c.strokeStyle = "rgba(" + brulureLaser(f) + "," + (0.46 * f * f * vif) + ")";
          c.lineWidth = LM_R_COEUR * 26 * z * 0.85 * ond;
        }
        c.beginPath();
        c.moveTo(A.x, A.y); c.lineTo(B.x, B.y);
        c.stroke();
      }
    }
  }
  c.restore();
}

/* ────────────────────────────────────────────────────────────────
   LES DEUX RAYONS

   Dessinés APRÈS tout le reste : un rayon de cette taille passe
   devant les troupes, pas derrière. Le faisceau est un triangle en
   dégradé de l'œil vers le sol, plus un cœur clair, plus une fleur
   d'impact — et le tout en « lighter », comme les lasers du DJ.
   ──────────────────────────────────────────────────────────────── */
function dessineLaserMily(c, tps){
  var L = laserMily();
  if(!L || L.phase === "cendre") return;
  var z = cam.z;
  if(z < 0.05) return;

  var q = versEcran(cam, jeu.qg.gx, jeu.qg.gy);
  var yx = yeuxDuBrasier();
  var H = horlogeIbiza(tps), mes = mesureIbiza(tps);
  /* la pulsation musicale, purement décorative : elle a le droit de
     différer d'un joueur à l'autre, personne ne peut le voir */
  var puls = 0.80 + 0.20 * frappe(tps) * (H.mus ? 1 : 0.35);
  var ouvre = L.phase === "charge" ? L.charge * L.charge : 1;
  /* le rayon s'éteint sur la dernière demi-seconde du balayage */
  var fin = L.phase === "balai" ? Math.min(1, (1 - L.s) * 14) : 1;
  var vie = ouvre * fin * puls;

  c.save();
  c.globalCompositeOperation = "lighter";

  for(var k = 0; k < 2; k++){
    var teinte = teinteIbiza(IBI_LASER_T, mes + k * 3);
    var oeil = { x:q.x + yx[k].x * z, y:q.y + yx[k].y * z };
    var sol = pointLaser(L, k, L.s);
    var P = versEcran(cam, sol.gx, sol.gy);

    /* LA LARGEUR EST CELLE DU CŒUR QUI TUE, et ce n'est pas une
       coquetterie : un rayon qui a l'air d'un fil et qui tue sur trois
       cases de large est un mensonge, et le joueur le paie. On part
       donc du rayon létal en CASES et on le convertit — une case vaut
       26 pixels de monde en largeur, que le zoom réduit ensuite.
       Écrire « 20 * z » comme je l'avais fait d'abord donnait sept
       pixels au sol : joli fil, fausse promesse. */
    var demi = LM_R_COEUR * 26 * z * puls;
    /* pendant la charge le faisceau n'est encore qu'un fil de visée :
       il s'ouvre à mesure que les yeux montent en puissance */
    var large = L.phase === "charge" ? demi * (0.06 + 0.94 * L.charge * L.charge) : demi;

    var dx = P.x - oeil.x, dy = P.y - oeil.y;
    var lg = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = -dy / lg, ny = dx / lg;      // la normale, pour épaissir

    /* TROIS COUCHES, du plus large au plus clair. Une seule donnerait
       un triangle plat ; c'est l'empilement qui fait la lumière. */
    /* LA COULEUR AVANT LE BLANC. Au premier essai, trois couches
       discrètes sous deux traits blancs donnaient un rayon blanc : la
       teinte du DJ ne se voyait plus du tout. Les couches portent
       maintenant la couleur, et le blanc se réduit au filament. */
    var couches = [[2.60, 0.13], [1.30, 0.30], [0.62, 0.52], [0.30, 0.60]];
    /* `cq` et non `q` : `q` porte déjà la position écran du QG, dix
       lignes plus haut. Écraser une variable dont on se sert encore ne
       casse rien tout de suite — au premier rayon tout allait bien —
       et donne « oeil.x = undefined » au second. Un dégradé par image
       refusé, silencieusement, une image sur deux. */
    for(var cq = 0; cq < couches.length; cq++){
      var w = large * couches[cq][0], op = couches[cq][1] * vie;
      var g = c.createLinearGradient(oeil.x, oeil.y, P.x, P.y);
      g.addColorStop(0, "rgba(" + teinte + "," + (op * 1.25) + ")");
      g.addColorStop(0.45, "rgba(" + teinte + "," + (op * 0.85) + ")");
      g.addColorStop(1, "rgba(" + teinte + "," + (op * 0.55) + ")");
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(oeil.x + nx * 3.0 * z, oeil.y + ny * 3.0 * z);
      c.lineTo(P.x + nx * w, P.y + ny * w);
      c.lineTo(P.x - nx * w, P.y - ny * w);
      c.lineTo(oeil.x - nx * 3.0 * z, oeil.y - ny * 3.0 * z);
      c.closePath();
      c.fill();
    }

    /* le filament blanc, mince, celui qu'on suit des yeux */
    c.strokeStyle = "rgba(255,252,246," + (0.70 * vie) + ")";
    c.lineWidth = Math.max(1, large * 0.13);
    c.beginPath(); c.moveTo(oeil.x, oeil.y); c.lineTo(P.x, P.y); c.stroke();

    /* la fleur d'impact au sol : à la mesure de la zone qui brûle */
    if(L.phase === "balai"){
      var ray = LM_R_FEU * 26 * z * puls;
      var gi = c.createRadialGradient(P.x, P.y, 0, P.x, P.y, ray);
      gi.addColorStop(0, "rgba(255,255,250," + (0.85 * fin) + ")");
      gi.addColorStop(0.28, "rgba(" + teinte + "," + (0.52 * fin) + ")");
      gi.addColorStop(1, "rgba(" + teinte + ",0)");
      c.fillStyle = gi;
      c.beginPath(); c.arc(P.x, P.y, ray, 0, 6.2832); c.fill();

      /* l'anneau au sol : c'est lui qui dit « la brûlure fait CETTE
         taille-là », et il se lit même quand le halo se noie dans les
         lumières de la piste */
      c.strokeStyle = "rgba(255,240,205," + (0.34 * fin) + ")";
      c.lineWidth = Math.max(1, 2.4 * z);
      c.beginPath();
      c.ellipse(P.x, P.y, ray * 0.62, ray * 0.34, 0, 0, 6.2832);
      c.stroke();

      /* quelques éclats, fonction du temps et de rien d'autre */
      c.fillStyle = "rgba(255,244,214," + (0.60 * fin) + ")";
      for(var e = 0; e < 9; e++){
        var ae = tps * (3.1 + e * 0.7) + e * 1.9 + k * 2.4;
        var de = (14 + (e % 4) * 16) * z * (0.6 + 0.4 * Math.sin(ae * 2));
        c.beginPath();
        c.arc(P.x + Math.cos(ae) * de, P.y + Math.sin(ae) * de * 0.55,
              Math.max(0.8, 3.0 * z), 0, 6.2832);
        c.fill();
      }
    }

    /* l'œil lui-même, braise vive d'où tout part */
    var go = c.createRadialGradient(oeil.x, oeil.y, 0, oeil.x, oeil.y, 46 * z);
    go.addColorStop(0, "rgba(255,255,255," + (0.80 * vie) + ")");
    go.addColorStop(0.35, "rgba(" + teinte + "," + (0.55 * vie) + ")");
    go.addColorStop(1, "rgba(" + teinte + ",0)");
    c.fillStyle = go;
    c.beginPath(); c.arc(oeil.x, oeil.y, 46 * z, 0, 6.2832); c.fill();
  }
  c.restore();
}
