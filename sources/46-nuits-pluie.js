/* ================================================================
   LES NUAGES ENCHANTÉS ET LA PLUIE D'ÉTOILES
   Le phénomène signature des « Mily et une nuits ».

   ────────────────────────────────────────────────────────────────
   POURQUOI C'EST UN DON, ET NON UN DANGER
   ────────────────────────────────────────────────────────────────

   Chaque carte a son phénomène, et les trois premiers punissent : la
   foudre de la jungle, les tornades de flammes des ténèbres, le
   tourbillon d'étoiles d'ici — qui tue déjà tout ce qui passe sous
   son pied. Cette île a donc son danger. Lui en ajouter un second
   n'aurait rien apporté qu'une seconde façon de mourir.

   La pluie d'étoiles fait l'inverse, et c'est le seul verbe que le
   jeu n'a pas encore : au lieu de FUIR, on COURT VERS. Une étoile qui
   tombe se pose et devient un VŒU. La première troupe qui le touche
   le prend — et il la rend entière.

   C'est aussi ce qui va avec l'endroit. Sur une île de dômes, de
   lanternes et de fontaines, une pluie d'étoiles n'est pas une
   catastrophe naturelle : c'est un conte.

   ────────────────────────────────────────────────────────────────
   TROIS TEMPS, ET LE PREMIER EST LE PLUS IMPORTANT
   ────────────────────────────────────────────────────────────────

     1. L'ANNONCE (7 s). Les nuages s'allument de l'intérieur et
        descendent. Rien ne tombe encore. C'est la même règle que
        pour la tornade, prise à l'envers : on la voyait venir pour
        avoir le temps de s'écarter, on voit celle-ci venir pour
        avoir le temps de se placer. Un cadeau qu'on n'a pas vu
        arriver n'est pas un cadeau, c'est un hasard.

     2. LA PLUIE (17 s). Vingt-six étoiles tombent, chacune à son
        instant, chacune sur son point. Elles ne tombent pas droit :
        elles descendent en balançant, comme une feuille, et leur
        traînée reste un moment dans l'air.

     3. LES VŒUX (13 s chacun). Ce qui s'est posé attend. Un vœu
        tourne lentement au sol, sa colonne de lumière monte assez
        haut pour se voir derrière une tour, et il s'éteint si
        personne ne vient. C'est là qu'est la décision : rompre
        l'assaut pour aller en chercher trois, ou continuer.

   ────────────────────────────────────────────────────────────────
   CE QU'UN VŒU DONNE, ET POURQUOI PAS AUTRE CHOSE
   ────────────────────────────────────────────────────────────────

   Il rend à la troupe TOUTE sa vie. À une troupe déjà entière, il
   donne de l'énergie — celle des capacités, Nova, Soin, Cryo. Un vœu
   n'est donc jamais perdu, et c'est la seule règle : il donne ce qui
   manque.

   IL NE TOUCHE PAS AUX BÂTIMENTS, et c'est la même raison que pour
   les tornades — abimeBatiment crédite jeu.degatsMoi, donc le score.
   Un phénomène automatique qui démolit des défenses offrirait des
   points à un joueur qui a posé sa tablette. Ici le risque serait
   même pire : une pluie qui répare les défenses punirait l'assaut
   sans que personne l'ait décidé.

   ────────────────────────────────────────────────────────────────
   LA MÊME PLUIE POUR TOUT LE MONDE, SANS UN OCTET DE RÉSEAU
   ────────────────────────────────────────────────────────────────

   Exactement la mécanique des tornades partagées, et pour la même
   raison : sur une expédition collective, « il en tombe une près du
   Brasier ! » ne veut rien dire si chacun voit sa propre pluie.

   Le temps est découpé en créneaux. La pluie du créneau n, et chacune
   de ses vingt-six étoiles, sont entièrement déterminées par la
   graine (code du salon, île, campagne, n, k) : l'instant de départ,
   le point de chute, le balancement, la teinte. Deux clients qui
   calculent le créneau 1 337 obtiennent les mêmes étoiles, au bit
   près, sans s'être parlé.

   ET LE RAMASSAGE EST LOCAL, comme les morts de la tornade : le vœu
   tombe pour tout le monde, mais c'est TA troupe qui le prend et TON
   énergie qui monte. Rien à fusionner, rien à publier.

   ────────────────────────────────────────────────────────────────
   L'ÉTAT TENU, ET IL EST MINCE
   ────────────────────────────────────────────────────────────────

   Les étoiles QUI TOMBENT n'ont aucun état : leur position est une
   fonction du temps, recalculée à chaque image, comme les reflets de
   la mer d'encre. Seuls les VŒUX en ont un — pris ou pas pris — et
   c'est pour ça qu'eux seuls existent en mémoire.
   ================================================================ */

/* ----------------------------------------------------------------
   LE RYTHME
   ---------------------------------------------------------------- */
var PLUIE_PERIODE = 186;    // s entre deux pluies — un peu plus de trois minutes
var PLUIE_ANNONCE = 7;      // s : les nuages s'allument
var PLUIE_DUREE   = 17;     // s : la chute, du premier au dernier départ
var PLUIE_N       = 26;     // étoiles par pluie
var PLUIE_CHUTE   = 2.6;    // s de descente pour une étoile
var PLUIE_HAUT    = 660;    // sa hauteur de départ, en unités du monde

var VOEU_VIE      = 13;     // s au sol avant de s'éteindre
var VOEU_RAYON    = 1.7;    // cases : la portée du ramassage
var VOEU_ENERGIE  = 12;     // ce qu'il donne à une troupe déjà entière
var VOEU_HAUT     = 88;     // la hauteur où flotte l'étoile posée
var VOEU_COLONNE  = 430;    // et celle de sa colonne de lumière

/* ================================================================
   LA COULEUR D'UN VŒU EST DE L'OR, ET C'EST UNE CORRECTION

   Les trois teintes étaient d'abord un or, un bleu et un violet — de
   quoi varier. Capturé sur la carte, le résultat était illisible :
   cette île est déjà couverte de petites lueurs blanches et cyan, les
   fontaines, les cellules, les lanternes. Seize vœux posés au sol s'y
   perdaient complètement, et il fallait les compter dans la console
   pour savoir qu'ils étaient là.

   Le levier n'est pas la taille ni l'intensité, c'est la TEINTE. Sur
   un fond bleu-violet, l'or est la seule couleur que rien d'autre
   n'occupe. Les trois teintes sont donc trois ors, et la variation
   se joue entre le miel et le blanc chaud — assez pour que la pluie
   ne soit pas monochrome, jamais assez pour qu'un vœu se confonde
   avec une fontaine.
   ================================================================ */
var PLUIE_TEINTES = ["255,222,142", "255,204,112", "255,240,190"];

function horlogePluie(){ return Date.now() * 0.001; }
function grainePluie(n, k){
  return graineTexte(CODE_SALON + "|pluie|" + ((jeu && jeu.index) | 0) + "|"
                     + ((typeof cycleSalon === "number" ? cycleSalon : 0) | 0)
                     + "|" + n + "|" + k) >>> 0;
}

/* ================================================================
   UNE ÉTOILE DE LA PLUIE, TIRÉE DE SA SEULE GRAINE

   Aucune mémoire : on la recalcule à partir de son numéro de créneau
   et de son rang. C'est ce qui la rend identique chez tout le monde.

   ELLE NE TOMBE PAS DROIT. Une étoile qui descend à la verticale est
   une goutte de pluie ; ce qu'on veut est une chose qui DESCEND EN SE
   BALANÇANT, comme une plume ou une feuille morte. Le balancement est
   une sinusoïde en travers de la chute, dont l'amplitude s'éteint en
   approchant du sol — elle se pose, elle ne s'écrase pas.
   ================================================================ */
function etoilePluie(n, k){
  var al = prng(grainePluie(n, k));
  /* Le point de chute : sur la terre, en évitant le tour de piste des
     rochers. On ne cherche pas la précision — une étoile posée sur le
     sable est aussi bonne qu'une autre. */
  var gx = 10 + al() * (PLAGE_X0 - 16);
  var gy = 6 + al() * (GH - 12);
  return {
    gx : gx, gy : gy,
    /* son instant de départ dans la fenêtre de chute */
    depart : PLUIE_ANNONCE + al() * PLUIE_DUREE,
    /* d'où elle vient : un décalage en travers, pour qu'elles ne
       descendent pas toutes du même point du ciel */
    dx : (al() * 2 - 1) * 22, dy : (al() * 2 - 1) * 22,
    balance : 26 + al() * 40,          // l'amplitude du balancement
    vit : 1.6 + al() * 1.9,            // et sa vitesse
    ph : al() * 6.2832,
    ech : 0.78 + al() * 0.5,
    teinte : PLUIE_TEINTES[(al() * PLUIE_TEINTES.length) | 0]
  };
}

/* Où en est la pluie du créneau courant : 0 rien, 1 l'annonce,
   2 la chute. Sert au ciel, au son et au message. */
function phasePluie(T){
  var n = Math.floor(T / PLUIE_PERIODE);
  var t = T - n * PLUIE_PERIODE;
  if(t < PLUIE_ANNONCE) return { n:n, t:t, phase:1, monte:t / PLUIE_ANNONCE };
  if(t < PLUIE_ANNONCE + PLUIE_DUREE + PLUIE_CHUTE)
    return { n:n, t:t, phase:2,
             monte:1 - Math.max(0, (t - PLUIE_ANNONCE - PLUIE_DUREE) / PLUIE_CHUTE) };
  return { n:n, t:t, phase:0, monte:0 };
}

/* La position d'une étoile en chute, à l'avancement u ∈ [0,1].
   Rend aussi sa hauteur, parce que le dessin en a besoin séparément :
   l'ombre reste au sol pendant que l'étoile est encore en l'air. */
function posChute(e, u){
  /* La descente s'accélère à peine — une étoile n'est pas une pierre.
     u^1.35 donne une chute qui traîne en haut et se pose en douceur. */
  var v = Math.pow(u, 1.35);
  var bal = Math.sin(u * e.vit * 6.2832 + e.ph) * e.balance * (1 - u) * (1 - u);
  return {
    gx : e.gx + e.dx * (1 - v),
    gy : e.gy + e.dy * (1 - v),
    haut : PLUIE_HAUT * (1 - v),
    bal : bal
  };
}

/* ================================================================
   LA MISE À JOUR
   ================================================================ */
function majPluieEtoiles(dt){
  if(!jeu || !carteAirMagique(jeu.index)) return;
  if(!jeu.voeux){ jeu.voeux = []; jeu.voeuxVus = {}; jeu.pluieCreneau = -1; }
  var T = horlogePluie(), P = phasePluie(T), n = P.n, s, k, i;

  /* Le message d'annonce, une seule fois par pluie. */
  if(P.phase === 1 && jeu.pluieCreneau !== n){
    jeu.pluieCreneau = n;
    /* on oublie les vœux des pluies passées : la table n'a pas à
       grandir pendant toute une expédition */
    jeu.voeuxVus = {};
    if(typeof message === "function") message("Les étoiles descendent. Va cueillir un vœu.");
    if(typeof son !== "undefined" && son.pluieAnnonce) son.pluieAnnonce();
  }

  /* LA NAISSANCE DES VŒUX. On regarde les deux derniers créneaux :
     une étoile partie en fin de pluie se pose après, et son vœu vit
     encore treize secondes. */
  for(s = n - 1; s <= n; s++){
    if(s < 0) continue;
    for(k = 0; k < PLUIE_N; k++){
      var e = etoilePluie(s, k);
      var tPose = s * PLUIE_PERIODE + e.depart + PLUIE_CHUTE;
      if(T < tPose || T > tPose + VOEU_VIE) continue;
      var cle = s + "." + k;
      if(jeu.voeuxVus[cle]) continue;
      jeu.voeuxVus[cle] = 1;
      jeu.voeux.push({ gx:e.gx, gy:e.gy, age:T - tPose, ph:e.ph,
                       ech:e.ech, teinte:e.teinte });
      poseEffet(e.gx, e.gy, "etoilePosee", 0.9, { teinte:e.teinte });
      if(typeof son !== "undefined" && son.voeuPose) son.voeuPose();
    }
  }

  /* VIEILLISSEMENT ET RAMASSAGE */
  for(i = jeu.voeux.length - 1; i >= 0; i--){
    var v = jeu.voeux[i];
    v.age += dt;
    if(v.age > VOEU_VIE){ jeu.voeux.splice(i, 1); continue; }
    /* La première troupe qui le touche le prend. On ne cherche pas la
       plus proche : un vœu se cueille, il ne s'attribue pas. */
    for(var u = 0; u < jeu.unites.length; u++){
      var un = jeu.unites[u];
      if(!un || un.pv <= 0) continue;
      if(Math.hypot(un.gx - v.gx, un.gy - v.gy) > VOEU_RAYON) continue;
      prendVoeu(v, un);
      jeu.voeux.splice(i, 1);
      break;
    }
  }
}

/* ================================================================
   PRENDRE UN VŒU

   IL DONNE CE QUI MANQUE. À une troupe blessée, toute sa vie ; à une
   troupe entière, de l'énergie. Un vœu n'est donc jamais perdu, et
   la règle tient en une phrase — ce qui compte, parce qu'un joueur
   qui court après une étoile n'a pas le temps de lire un tableau.
   ================================================================ */
function prendVoeu(v, u){
  var soigne = u.pv < u.pvMax - 0.5;
  if(soigne){
    poseEffet(u.gx, u.gy, "voeuPris", 1.1,
              { teinte:v.teinte, gain:Math.round(u.pvMax - u.pv) });
    u.pv = u.pvMax;
  }else{
    jeu.energie += VOEU_ENERGIE;
    poseEffet(u.gx, u.gy, "voeuPris", 1.1,
              { teinte:v.teinte, energie:VOEU_ENERGIE });
  }
  if(typeof demandeMajBarres === "function") demandeMajBarres();
  if(typeof son !== "undefined" && son.voeuPris) son.voeuPris(soigne);
}

/* Un petit service : poser un effet sans connaître la forme exacte du
   tableau. Tout ce fichier passe par ici. */
function poseEffet(gx, gy, t, duree, o){
  if(!jeu || !jeu.effets) return;
  var e = { gx:gx, gy:gy, t:t, age:0, duree:duree };
  if(o) for(var k in o) e[k] = o[k];
  jeu.effets.push(e);
}

/* ================================================================
   LE DESSIN — 1. LES NUAGES ENCHANTÉS

   Les nuages de `jeu.nuages` existaient déjà sur cette carte et
   n'étaient dessinés nulle part : seule la jungle les peignait. Ils
   dérivaient donc en silence depuis toujours.

   CE QU'ILS NE SONT PAS : des nuages d'orage éclaircis. Un nuage
   d'orage se lit par son OMBRE — c'est une masse qui prend la
   lumière. Un nuage enchanté fait le contraire : il en DONNE. Il n'a
   donc pas d'ombre portée mais une nappe claire sous lui, et sa
   matière est faite de couches concentriques qui respirent au lieu
   d'une silhouette découpée.

   ILS DESCENDENT PENDANT L'ANNONCE. C'est ce qui rend le phénomène
   lisible sans un mot : le ciel s'approche, donc quelque chose va
   tomber.
   ================================================================ */
var NUAGE_SP = null;
function spriteNuageEnchante(){
  if(NUAGE_SP) return NUAGE_SP;
  var R = 128, s = nouveauCanvas(R * 2, R * 2), g = s.getContext("2d");
  var gr = g.createRadialGradient(R, R, 0, R, R, R);
  gr.addColorStop(0,    "rgba(226,236,255,.55)");
  gr.addColorStop(0.32, "rgba(190,206,255,.26)");
  gr.addColorStop(0.62, "rgba(150,168,240,.10)");
  gr.addColorStop(1,    "rgba(120,140,220,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, R * 2, R * 2);
  NUAGE_SP = s;
  return s;
}

/* REPÈRE : cette fonction est appelée depuis la couche du ciel, donc
   en coordonnées de MONDE — celles que rend iso(). Les hauteurs y sont
   en unités de monde, sans multiplication par le zoom. Le vœu posé, à
   l'inverse, est peint depuis la pile de profondeur, donc en
   coordonnées d'ÉCRAN. Les deux repères cohabitent dans ce fichier et
   il ne faut pas les mêler. */
function dessineNuagesEnchantes(c, tps, vue){
  if(!jeu || !jeu.nuages || !jeu.nuages.length) return;
  var P = phasePluie(horlogePluie());
  /* Pendant l'annonce ils s'allument et descendent ; pendant la
     chute ils restent bas, puis remontent avec la dernière étoile. */
  var vif = 0.10 + 0.30 * (P.phase ? P.monte : 0);
  var bas = 170 * (P.phase ? P.monte : 0);
  var sp = spriteNuageEnchante();
  c.save();
  c.globalCompositeOperation = "lighter";
  for(var i = 0; i < jeu.nuages.length; i++){
    var nu = jeu.nuages[i];
    var p = iso(nu.gx, nu.gy);
    var R = (nu.r || 9) * 46;
    if(p.x + R * 2 < vue.x0 || p.x - R * 2 > vue.x1 ||
       p.y + R < vue.y0 - 400 || p.y - R - 460 > vue.y1) continue;
    /* TROIS COUCHES PENDANT LE PHÉNOMÈNE, DEUX LE RESTE DU TEMPS.
       Décalées, jamais en phase : c'est ce qui donne une masse qui
       respire au lieu d'une tache qui pulse.
       La troisième est un vrai coût — mesuré, les nuages pèsent 6,7 ms
       par image alors que la pluie elle-même, étoiles et vœux compris,
       n'en coûte aucune : elle est une fonction du temps, pas une
       liste d'objets. Hors phénomène, la troisième couche ajoute une
       teinte à 4 % d'opacité que personne ne voit ; elle ne se paie
       donc que quand le ciel s'allume, ce qui lui donne au passage sa
       prise de matière au bon moment. */
    var nc = P.phase ? 3 : 2;
    for(var k = 0; k < nc; k++){
      var b = 1 + 0.12 * Math.sin(tps * (0.31 + k * 0.17) + i * 2.1 + k);
      var rr = R * (1 - k * 0.22) * b;
      var hy = 360 - bas + Math.sin(tps * 0.23 + i) * 16 - k * 18;
      c.globalAlpha = vif * (0.40 - k * 0.09);
      c.drawImage(sp, p.x - rr, p.y - hy - rr * 0.5, rr * 2, rr * 1.1);
    }
  }
  c.restore();
}

/* ================================================================
   LE DESSIN — 2. LES ÉTOILES QUI TOMBENT

   Aucune n'existe en mémoire : on parcourt le calendrier du créneau
   courant et l'on peint celles qui sont en l'air à cet instant.
   ================================================================ */
/* REPÈRE DE MONDE, comme les nuages. */
function dessineChutesEtoiles(c, tps, vue){
  if(!jeu || !carteAirMagique(jeu.index)) return;
  var T = horlogePluie(), P = phasePluie(T);
  if(P.phase !== 2) return;
  var n = P.n, k, i;
  c.save();
  c.globalCompositeOperation = "lighter";
  for(k = 0; k < PLUIE_N; k++){
    var e = etoilePluie(n, k);
    var tDep = n * PLUIE_PERIODE + e.depart;
    var u = (T - tDep) / PLUIE_CHUTE;
    if(u < 0 || u > 1) continue;
    var q = posChute(e, u);
    var p = iso(q.gx, q.gy);
    var x = p.x + q.bal, y = p.y - q.haut;
    var ps = iso(e.gx, e.gy);
    /* Le culling regarde la CHUTE ENTIÈRE : l'étoile est haut dans le
       ciel alors que son point de chute est déjà à l'écran, et si l'on
       ne testait qu'elle, elle apparaîtrait d'un coup à mi-course. */
    if(Math.max(x, ps.x) < vue.x0 - 220 || Math.min(x, ps.x) > vue.x1 + 220 ||
       ps.y < vue.y0 - 200 || y > vue.y1 + 220) continue;

    /* LA TRAÎNÉE. On rejoue les positions précédentes de l'étoile —
       c'est gratuit, puisque sa trajectoire est une fonction du temps.
       Une traînée mémorisée aurait demandé un tableau par étoile ;
       celle-ci ne coûte rien et ne peut pas se désynchroniser. */
    var N = 15;
    for(i = N; i >= 1; i--){
      var uu = u - i * 0.026;
      if(uu < 0) continue;
      var qq = posChute(e, uu), pp = iso(qq.gx, qq.gy);
      var f = 1 - i / N;
      c.globalAlpha = f * f * 0.6;
      c.fillStyle = "rgba(" + e.teinte + ",1)";
      c.beginPath();
      c.arc(pp.x + qq.bal, pp.y - qq.haut, (4 + f * 17) * e.ech, 0, 6.2832);
      c.fill();
    }
    /* LA TÊTE : un halo, un cœur blanc, et huit branches. C'est la même
       étoile que celle du sol et des lanternes — une carte tient à ce
       que sa forme soit la même partout. */
    c.globalAlpha = 1;
    var R = 52 * e.ech;
    var g = c.createRadialGradient(x, y, 0, x, y, R * 3.6);
    g.addColorStop(0,    "rgba(255,255,255,.95)");
    g.addColorStop(0.16, "rgba(" + e.teinte + ",.72)");
    g.addColorStop(1,    "rgba(" + e.teinte + ",0)");
    c.fillStyle = g;
    c.beginPath(); c.arc(x, y, R * 3.6, 0, 6.2832); c.fill();
    dessineEtoileRayons(c, x, y, R, tps * 2.2 + e.ph, e.teinte, 1);

    /* LA MARQUE AU SOL reste sous le point de chute, et elle se
       resserre. C'est elle qui dit OÙ l'étoile va tomber — la même
       promesse que l'anneau de la tornade, prise à l'envers : on veut
       pouvoir s'y rendre. */
    var rs = 108 * (1 - u * 0.66);
    c.globalAlpha = 0.12 + 0.42 * u;
    var gs = c.createRadialGradient(ps.x, ps.y, 0, ps.x, ps.y, rs);
    gs.addColorStop(0, "rgba(" + e.teinte + ",.9)");
    gs.addColorStop(1, "rgba(" + e.teinte + ",0)");
    c.fillStyle = gs;
    c.beginPath(); c.ellipse(ps.x, ps.y, rs, rs * 0.5, 0, 0, 6.2832); c.fill();
    c.globalAlpha = 1;
  }
  c.restore();
}

/* L'étoile à quatre longues branches et quatre courtes — celle qui est
   gravée dans le sol de l'île et sur les lanternes. */
function dessineEtoileRayons(c, x, y, R, ang, teinte, a){
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  c.fillStyle = "rgba(255,255,255," + (0.9 * a) + ")";
  c.beginPath();
  for(var i = 0; i < 8; i++){
    var t = i * Math.PI / 4, r = (i & 1) ? R * 0.30 : R;
    var px = Math.cos(t) * r, py = Math.sin(t) * r * 0.62;
    if(i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.closePath();
  c.fill();
  c.restore();
}

/* ================================================================
   LE DESSIN — 3. LE VŒU POSÉ

   Il entre dans la pile de profondeur, donc une tour peut le cacher —
   c'est ce qui le met DANS la carte et non dessus. Sa colonne de
   lumière est là pour ça : elle monte plus haut que les bâtiments, si
   bien qu'on repère le vœu de loin sans qu'il flotte au-dessus du
   décor.
   ================================================================ */
function dessineVoeuMonde(c, v, tps){
  /* REPÈRE D'ÉCRAN : la pile de profondeur peint en pixels. Toutes les
     dimensions passent donc par le zoom, comme pour le tourbillon. */
  var p = versEcran(cam, v.gx, v.gy), z = cam.z;
  var x = p.x, y = p.y;
  /* naissance et extinction : il grandit vite et s'efface doucement */
  var u = v.age / VOEU_VIE;
  var vif = u < 0.06 ? u / 0.06 : (u > 0.78 ? (1 - u) / 0.22 : 1);
  if(vif <= 0) return;
  var bat = 0.86 + 0.14 * Math.sin(tps * 2.3 + v.ph);
  var R = 31 * v.ech * bat * z;
  c.save();
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = vif;

  /* LA FLAQUE AU SOL — c'est elle qui pose le vœu sur la terre. Sans
     elle, l'étoile flotte sans qu'on sache au-dessus de quoi. */
  var gs = c.createRadialGradient(x, y, 0, x, y, R * 3.6);
  gs.addColorStop(0,    "rgba(" + v.teinte + ",.62)");
  gs.addColorStop(0.42, "rgba(" + v.teinte + ",.20)");
  gs.addColorStop(1,    "rgba(" + v.teinte + ",0)");
  c.fillStyle = gs;
  c.beginPath(); c.ellipse(x, y, R * 3.6, R * 1.8, 0, 0, 6.2832); c.fill();

  /* LA COLONNE : elle s'évase en montant et se dissout. Son dégradé
     est bâti dans un repère unitaire et étiré — le même tour que pour
     les fibres d'aurore, pour n'en construire qu'un. */
  c.save();
  c.translate(x, y);
  c.scale(1, VOEU_COLONNE * z);
  var gc = c.createLinearGradient(0, -1, 0, 0);
  gc.addColorStop(0,    "rgba(" + v.teinte + ",0)");
  gc.addColorStop(0.42, "rgba(" + v.teinte + ",.13)");
  gc.addColorStop(0.82, "rgba(" + v.teinte + ",.34)");
  gc.addColorStop(1,    "rgba(" + v.teinte + ",.62)");
  c.fillStyle = gc;
  c.globalAlpha = vif * 0.85;
  c.beginPath();
  /* Elle est ÉTROITE EN BAS et s'ouvre en montant. L'inverse — une
     base large — noyait l'étoile qui flotte dedans : on voyait une
     colonne, plus le vœu. */
  c.moveTo(-R * 0.16, 0); c.lineTo(-R * 0.80, -1);
  c.lineTo(R * 0.80, -1);  c.lineTo(R * 0.16, 0);
  c.closePath(); c.fill();
  c.restore();

  /* L'ANNEAU QUI RESPIRE, et l'étoile qui tourne au-dessus */
  c.globalAlpha = vif * 0.5;
  c.strokeStyle = "rgba(" + v.teinte + ",.8)";
  c.lineWidth = 1.6 * z;
  var res = 1 + 0.10 * Math.sin(tps * 1.7 + v.ph);
  c.beginPath();
  c.ellipse(x, y, R * 2.1 * res, R * 1.05 * res, 0, 0, 6.2832);
  c.stroke();

  /* ================================================================
     LES BRINS QUI MONTENT — ce qui dit « viens me chercher »

     Tout ce qui brille sur cette île PULSE SUR PLACE : les fontaines,
     les cellules, les lanternes. Un vœu de plus qui pulse sur place
     n'est qu'une lueur parmi cinquante. Ce qui le distingue n'est donc
     ni sa taille ni son éclat, c'est d'avoir un MOUVEMENT QUE RIEN
     D'AUTRE N'A : six brins qui montent le long de la colonne, en
     boucle, chacun à son rythme. L'œil attrape un mouvement vertical
     continu avant d'attraper une intensité.
     ================================================================ */
  for(var bk = 0; bk < 6; bk++){
    var ub = ((tps * (0.34 + bk * 0.055) + bk * 0.166 + v.ph * 0.16) % 1);
    var yb = y - ub * VOEU_COLONNE * 0.86 * z;
    var xb = x + Math.sin(ub * 7 + bk * 2.1 + v.ph) * R * 0.85;
    c.globalAlpha = vif * (1 - ub) * (1 - ub) * 0.9;
    c.fillStyle = "rgba(" + v.teinte + ",1)";
    c.beginPath();
    c.arc(xb, yb, (2.6 - ub * 1.6) * z * v.ech, 0, 6.2832);
    c.fill();
  }
  c.globalAlpha = vif;

  var hy = y - (VOEU_HAUT + Math.sin(tps * 1.4 + v.ph) * 5) * z;
  c.globalAlpha = vif;
  var gh = c.createRadialGradient(x, hy, 0, x, hy, R * 3);
  gh.addColorStop(0,    "rgba(255,255,255,.9)");
  gh.addColorStop(0.18, "rgba(" + v.teinte + ",.6)");
  gh.addColorStop(1,    "rgba(" + v.teinte + ",0)");
  c.fillStyle = gh;
  c.beginPath(); c.arc(x, hy, R * 3, 0, 6.2832); c.fill();
  dessineEtoileRayons(c, x, hy, R, tps * 0.8 + v.ph, v.teinte, vif);
  c.restore();
}

/* Tous les vœux, appelés depuis la pile de profondeur. */
function dessineVoeux(c, tps){
  if(!jeu || !jeu.voeux) return;
  for(var i = 0; i < jeu.voeux.length; i++) dessineVoeuMonde(c, jeu.voeux[i], tps);
}
