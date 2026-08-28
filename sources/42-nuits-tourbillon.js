/* ================================================================
   LE TOURBILLON D'ÉTOILES — « Les Mily et une nuits »

   « Duplique la tornade de feu des ténèbres, une fois et demie plus
   grande, la traînée plus large — mais ce ne serait pas une traînée de
   feu. »

   CE QUI EST DUPLIQUÉ, ET CE QUI NE L'EST PAS. La MÉCANIQUE n'est pas
   dupliquée du tout : naissance sous un nuage, descente pendant
   laquelle rien ne tue, marche en ligne droite qui vire aux bords,
   traînée semée derrière, mort au bout de la course — tout cela est le
   même code, dans 33-tenebres-tornade.js, piloté par profilTornade().
   Dupliquer quatre cents lignes de mise à jour aurait donné deux
   mécaniques qui divergent au premier réglage : l'une corrigée,
   l'autre oubliée.

   Ce fichier ne contient donc QUE le dessin — l'entonnoir et sa
   traînée — parce que là, tout diffère.

   CE QU'ON CHERCHE À DESSINER. Pas une tornade colorée en bleu : ça,
   c'est une tornade de feu avec une autre palette, et ça se voit. Un
   tourbillon d'étoiles ne brûle pas, il ENTRAÎNE. Il est donc fait de
   choses qui tournent et qu'on peut suivre du regard — des rubans de
   lumière enroulés autour d'une colonne presque transparente, et des
   étoiles qui montent en spirale à l'intérieur. La colonne elle-même
   est à peine visible : ce sont les objets pris dedans qui la
   dessinent. C'est l'exact contraire du feu, qui est une masse pleine.

   LA PROMESSE RESTE LA MÊME, et elle est essentielle : ce qui passe
   sous le pied MEURT, mais seulement NOS TROUPES. Ni les bâtiments —
   ils crédite raient un score à un joueur qui a posé sa tablette — ni
   les bêtes, dont certaines sont uniques et gravées dans l'instantané
   partagé. Cette règle vit dans tueDansLeFeu(), commune aux deux.
   ================================================================ */

/* La palette. Trois familles, et elles ne se mélangent pas :
   le RUBAN est violet, l'ÉTOILE est blanche, la POUSSIÈRE est dorée.
   Un tourbillon où tout serait de la même couleur redeviendrait une
   masse — et c'est précisément ce qu'on ne veut pas. */
var TBL = {
  ruban :["168,120,255", "120,170,255", "220,180,255"],
  etoile:"250,252,255",
  or    :"245,214,140",
  froid :"120,190,255"
};

/* Une position sur la spirale, à la hauteur u. Une seule fonction :
   les rubans, les étoiles et la poussière doivent tourner ENSEMBLE,
   sinon on voit trois effets superposés au lieu d'un tourbillon.
   `torProfil` est celle de la tornade de feu — c'est la même forme
   d'entonnoir, et c'est voulu : ce qui change est ce qu'on met
   dedans. */
function tblPoint(t, p, z, H, u, tour, ecart, tps){
  var pr = torProfil(u, tps, t.tour) * ecart;
  var a = tour + u * 3.4;
  return {
    x: p.x + Math.sin(t.tour + u * 3.4) * pr * 0.30 * RX * z
          + Math.cos(a) * pr * RX * z * 0.5,
    y: p.y - u * H + Math.sin(a) * pr * RY * z * 0.5,
    /* la profondeur apparente : devant (1) ou derrière (0) la colonne.
       C'est elle qui fait qu'un ruban PASSE DERRIÈRE l'entonnoir au
       lieu de glisser dessus — sans quoi la spirale est un dessin
       plat sur un cylindre. */
    d: (Math.sin(a) + 1) * 0.5,
    pr: pr
  };
}

/* ================================================================
   LE FONDU DU SOMMET

   Même défaut, même remède que sur la tornade de poussière : la
   silhouette s'arrête net à u = 1, là où elle est la plus large, et
   la coupe donnait un trait horizontal en travers du ciel. Toutes les
   couches qui montent jusqu'en haut passent donc par un dégradé qui
   vaut zéro tout en haut et sa valeur pleine douze pour cent plus bas.

   Ici les couleurs sont des triplets « r,v,b » et non des « #rrggbb » :
   c'est la seule raison pour laquelle cette fonction ne peut pas être
   celle de l'autre fichier. */
var FONDU_TBL = 0.12;
function degradeSommetTbl(c, p, H, col, aHaut, aMil, aBas){
  var g = c.createLinearGradient(p.x, p.y - H, p.x, p.y);
  g.addColorStop(0, "rgba(" + col + ",0)");
  g.addColorStop(FONDU_TBL, "rgba(" + col + "," + aHaut + ")");
  g.addColorStop(0.55, "rgba(" + col + "," + aMil + ")");
  g.addColorStop(1, "rgba(" + col + "," + aBas + ")");
  return g;
}

/* ---------------------------------------------------------------
   L'ENTONNOIR
   --------------------------------------------------------------- */
function dessineTourbillonMonde(c, t, tps){
  var P = profilTornade(jeu.index) || {};
  var p = versEcran(cam, t.gx, t.gy);
  var z = cam.z;
  var desc = P.descente || EQ.TOURBILLON_DESCENTE;
  var descend = t.age < desc;
  var pied = descend ? (1 - t.age / desc) : 0;
  var H = (P.haut || 330 * EQ.TOURBILLON_ECH) * z;
  /* DEUX RAYONS, ET IL FAUT LES DISTINGUER.
     `rayTue` est le contrat : le cercle exact dans lequel on meurt.
     `ray` est ce qu'on DESSINE, trente pour cent plus large depuis
     que la tornade a grossi. Le bourrelet de débris faisait déjà
     deux fois et demie le rayon mortel sans tuer : la distinction
     existait, elle n'avait simplement pas de nom. Elle en a un. */
  var rayTue = P.rayon || EQ.TOURBILLON_RAYON;
  var ray = rayTue * (P.ech || 1);
  var i, u, q;

  c.save();

  /* --- 1. L'AVERTISSEMENT, pendant la descente.
     Deux anneaux qui se resserrent sur le point de contact : voilà où
     ça va tomber, et voilà dans combien de temps. C'est la promesse
     faite au joueur, et elle est plus longue ici que dans les
     ténèbres — le couloir étant plus large, le préavis l'est aussi. */
  if(descend){
    q = 1 - pied;
    c.globalCompositeOperation = "lighter";
    c.strokeStyle = "rgba(190,160,255," + (0.24 + q * 0.52) + ")";
    c.lineWidth = (1.4 + q * 2.6) * z;
    var rA = 7.5 - q * 5.2;
    c.beginPath();
    c.ellipse(p.x, p.y, rA * RX * z, rA * RY * z, 0, 0, 6.2832);
    c.stroke();
    /* le second anneau, en retard : c'est lui qui donne le rythme du
       compte à rebours */
    c.strokeStyle = "rgba(245,214,140," + (0.14 + q * 0.34) + ")";
    c.lineWidth = 1.2 * z;
    var rB = 7.5 - Math.max(0, q - 0.22) * 5.2;
    c.beginPath();
    c.ellipse(p.x, p.y, rB * RX * z, rB * RY * z, 0, 0, 6.2832);
    c.stroke();
    /* des étoiles qui tombent vers le point d'impact : on VOIT le ciel
       se vider vers un point */
    for(i = 0; i < 14; i++){
      var au = i * 2.399 + tps * 0.6;
      var du = ((i * 7) % 11) / 11;
      var dd = (1 - ((tps * 0.7 + du) % 1)) * 9;
      c.fillStyle = "rgba(" + TBL.etoile + "," + (0.5 * q * (1 - dd / 9)) + ")";
      c.beginPath();
      c.ellipse(p.x + Math.cos(au) * dd * RX * z,
                p.y + Math.sin(au) * dd * RY * z - dd * 6 * z,
                1.5 * z, 1.5 * z, 0, 0, 6.2832);
      c.fill();
    }
  }

  /* --- 2. LA COLONNE, presque transparente.
     Deux voiles seulement, très pâles. Le feu est une masse pleine ;
     celui-ci est un courant d'air qu'on ne voit que par ce qu'il
     emporte. Si la colonne était opaque, les rubans et les étoiles
     qui passent derrière disparaîtraient — et c'est justement leur
     passage derrière qui donne le volume. */
  /* TROIS VOILES, ET PAS DEUX À DIX POUR CENT. Le premier jet en
     mettait deux, à 0,10 et 0,13 d'opacité : sur une carte déjà
     lumineuse, en mode additif, cela ne se voyait pas du tout — la
     colonne disparaissait et il ne restait que les rubans, qui se
     lisaient alors comme un éclair tordu. Un tourbillon d'étoiles est
     translucide, pas invisible : il faut qu'on devine la MASSE derrière
     ce qui tourne. */
  c.globalCompositeOperation = "lighter";
  for(i = 0; i < 3; i++){
    var k = 1 - i * 0.30;
    /* le voile change de TEINTE en montant — lilas en haut, bleu au
       milieu, blanc au pied — et il s'éteint sur les douze derniers
       pour cent. Un seul dégradé porte les deux. */
    var gv = c.createLinearGradient(p.x, p.y - H, p.x, p.y);
    gv.addColorStop(0, "rgba(150,140,255,0)");
    gv.addColorStop(FONDU_TBL, "rgba(150,140,255," + (0.20 - i * 0.05) + ")");
    gv.addColorStop(0.55, "rgba(120,170,255," + (0.26 - i * 0.06) + ")");
    gv.addColorStop(1, "rgba(220,200,255," + (0.36 - i * 0.09) + ")");
    c.fillStyle = gv;
    torSilhouette(c, t, p, z, H, pied, k, 1, tps);
    c.fill();
  }
  /* le bord, qui donne la SILHOUETTE. Sans un contour, une masse
     translucide n'a pas de forme — c'est la leçon qu'avait déjà donnée
     la tornade de feu, et elle vaut deux fois plus ici. */
  c.strokeStyle = degradeSommetTbl(c, p, H, "210,200,255", 0.34, 0.34, 0.34);
  c.lineWidth = 1.6 * z;
  torSilhouette(c, t, p, z, H, pied, 1, 1, tps);
  c.stroke();

  /* --- 3. LES RUBANS. Trois hélices enroulées autour de la colonne,
     chacune tracée en deux morceaux — l'arrière d'abord, l'avant
     ensuite — pour qu'elles passent VRAIMENT derrière l'entonnoir.
     C'est le cœur du dessin : ce sont elles qui font tourner la
     chose. */
  /* QUATRE rubans, et plus épais. À trois et à 1,7 pixel, ils se
     perdaient sur un fond clair. */
  var NR = 4, PAS = 30;
  for(var r = 0; r < NR; r++){
    var dep = t.tour * 1.35 + r * 6.2832 / NR;
    var col = TBL.ruban[r % TBL.ruban.length];
    for(var passe = 0; passe < 2; passe++){
      /* passe 0 : ce qui est derrière (d < 0,5) ; passe 1 : devant.
         Entre les deux on repeint la colonne, très légèrement : c'est
         ce voile qui « avale » la partie arrière. */
      if(passe === 1){
        c.globalCompositeOperation = "lighter";
        c.fillStyle = degradeSommetTbl(c, p, H, "90,90,190", 0.10, 0.10, 0.10);
        torSilhouette(c, t, p, z, H, pied, 1, 1, tps);
        c.fill();
      }
      c.beginPath();
      var ouvert = false;
      for(i = 0; i <= PAS; i++){
        u = pied + (1 - pied) * (i / PAS);
        var pt = tblPoint(t, p, z, H, u, dep + u * 9.0, 1.02, tps);
        var visible = passe === 0 ? (pt.d < 0.5) : (pt.d >= 0.5);
        if(!visible){ ouvert = false; continue; }
        if(!ouvert){ c.moveTo(pt.x, pt.y); ouvert = true; }
        else c.lineTo(pt.x, pt.y);
      }
      /* le ruban s'éteint au sommet comme le voile : un fil encore
         vif au ras de la coupe la redessinerait à lui tout seul */
      var av2 = passe ? 0.78 : 0.30;
      c.strokeStyle = degradeSommetTbl(c, p, H, col, av2, av2, av2);
      c.lineWidth = (passe ? 4.2 : 2.6) * z * (1 - pied * 0.5);
      c.lineCap = "round";
      c.lineJoin = "round";
      c.stroke();
    }
  }

  /* --- 4. LES ÉTOILES EMPORTÉES. Elles montent en spirale, plus vite
     en bas qu'en haut — c'est ce qui dit qu'elles sont ASPIRÉES et
     non peintes sur un cylindre. Leur taille grandit avec la hauteur :
     de la poussière au pied, de vraies étoiles vers le nuage. */
  var NE = 46;
  for(i = 0; i < NE; i++){
    /* chaque étoile a sa propre montée, décalée : elles ne défilent
       pas en rang */
    var ph = i * 2.399;
    var mu = ((tps * (0.22 + (i % 5) * 0.05) + i / NE) % 1);
    u = pied + (1 - pied) * mu;
    var pe = tblPoint(t, p, z, H, u, t.tour * 1.6 + ph + u * 7.0, 0.86, tps);
    var av = pe.d;                                  // devant = plus clair
    var taille = (0.9 + u * 2.4) * z * (0.6 + av * 0.7);
    var fdu2 = mu > (1 - FONDU_TBL) ? (1 - mu) / FONDU_TBL : 1;
    var op = (0.30 + av * 0.55) * (1 - Math.pow(mu, 3) * 0.5) * fdu2;
    var coul = (i % 5 === 0) ? TBL.or : (i % 3 === 0 ? TBL.froid : TBL.etoile);
    /* le halo */
    var ge = c.createRadialGradient(pe.x, pe.y, 0, pe.x, pe.y, taille * 5);
    ge.addColorStop(0, "rgba(" + coul + "," + (op * 0.5) + ")");
    ge.addColorStop(1, "rgba(" + coul + ",0)");
    c.fillStyle = ge;
    c.beginPath(); c.arc(pe.x, pe.y, taille * 5, 0, 6.2832); c.fill();
    /* l'étoile à quatre branches */
    c.fillStyle = "rgba(" + coul + "," + op + ")";
    c.beginPath();
    c.moveTo(pe.x, pe.y - taille * 2.2); c.lineTo(pe.x + taille * 0.5, pe.y);
    c.lineTo(pe.x, pe.y + taille * 2.2); c.lineTo(pe.x - taille * 0.5, pe.y);
    c.closePath(); c.fill();
    c.beginPath();
    c.moveTo(pe.x - taille * 2.6, pe.y); c.lineTo(pe.x, pe.y - taille * 0.42);
    c.lineTo(pe.x + taille * 2.6, pe.y); c.lineTo(pe.x, pe.y + taille * 0.42);
    c.closePath(); c.fill();
  }

  /* --- 5. LE PIED. Il ne touche le sol qu'une fois posé, et c'est ce
     halo qui dit EXACTEMENT ce qui tue. Il est à la mesure du rayon
     mortel, ni plus ni moins : un halo plus large ferait contourner de
     trop loin, un halo plus étroit tuerait des gens qui se croyaient
     dehors. */
  if(!descend){
    var gp = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, ray * RX * z * 1.5);
    gp.addColorStop(0, "rgba(235,225,255,.62)");
    gp.addColorStop(0.5, "rgba(170,150,255,.30)");
    gp.addColorStop(1, "rgba(140,120,255,0)");
    c.fillStyle = gp;
    c.beginPath();
    c.ellipse(p.x, p.y, ray * RX * z * 1.5, ray * RY * z * 1.5, 0, 0, 6.2832);
    c.fill();
    /* L'ANNEAU NET, SUR LE RAYON EXACT — rayTue, pas ray. Le dessin
       a grossi de trente pour cent, le rayon mortel non : c'est cet
       anneau-là qui dit la règle, et il ne doit jamais grossir avec
       le décor qui l'entoure. */
    c.strokeStyle = "rgba(245,240,255,.66)";
    c.lineWidth = 1.8 * z;
    c.beginPath();
    c.ellipse(p.x, p.y, rayTue * RX * z, rayTue * RY * z, 0, 0, 6.2832);
    c.stroke();
    /* et la poussière qui fuse au ras du sol */
    for(i = 0; i < 10; i++){
      var ap = i * 0.6283 + t.tour * 0.9;
      var rp = ray * (0.9 + ((i * 3) % 5) / 9);
      c.fillStyle = "rgba(" + TBL.or + "," + (0.20 + 0.3 * Math.abs(Math.sin(tps * 3 + i))) + ")";
      c.beginPath();
      c.ellipse(p.x + Math.cos(ap) * rp * RX * z,
                p.y + Math.sin(ap) * rp * RY * z,
                1.4 * z, 0.9 * z, 0, 0, 6.2832);
      c.fill();
    }
  }

  /* --- 6. LE SOMMET, qui se perd dans le nuage. Une nappe pâle et
     large : sans elle la colonne s'arrête net et l'on voit qu'elle est
     dessinée. */
  var gs = c.createRadialGradient(p.x, p.y - H, 0, p.x, p.y - H, 9 * RX * z);
  gs.addColorStop(0, "rgba(190,180,255,.26)");
  gs.addColorStop(1, "rgba(150,150,255,0)");
  c.fillStyle = gs;
  c.beginPath();
  c.ellipse(p.x, p.y - H, 9 * RX * z, 4.5 * RY * z, 0, 0, 6.2832);
  c.fill();

  c.restore();
  c.globalCompositeOperation = "source-over";
  c.globalAlpha = 1;
}

/* ---------------------------------------------------------------
   LA TRAÎNÉE — de la poussière d'étoile, pas de la cendre
   --------------------------------------------------------------- */
/* Elle est peinte avec les décalques du terrain, sous les troupes :
   c'est de la poudre déposée au sol, pas un effet posé sur la scène.

   TROIS COUCHES, ET LA PREMIÈRE EST LA PLUS IMPORTANTE. Le feu des
   ténèbres pose une CENDRE sombre sous sa flamme, et c'est elle qui
   dit au joueur « on est passé par là » quand la flamme est retombée.
   Ici la trace ne noircit pas, elle BLEUIT : un voile indigo qui reste
   quand les étincelles se sont éteintes. Sans lui, la traînée
   disparaîtrait d'un coup et l'on ne saurait plus où elle a mordu. */
function dessineTraceEtoileeSol(c, b, tps){
  var P = profilTornade(jeu.index) || {};
  var duree = P.trainee || EQ.TOURBILLON_TRAINEE;
  var larg = P.traineeR || EQ.TOURBILLON_TRAINEE_R;
  var p = iso(b.gx, b.gy);
  var v = b.age / duree;                       // 0 neuve → 1 éteinte
  /* Elle brille franchement les deux premiers tiers — très exactement
     le temps pendant lequel elle TUE — puis retombe vite. Ce que l'œil
     voit et ce qui tue disent la même chose, comme pour le feu. */
  var vif = v < 0.66 ? (1 - v * 0.30) : Math.max(0, (1 - v) / 0.34) * 0.72;

  /* 1. le voile indigo, à la mesure EXACTE de ce qui tue */
  c.globalCompositeOperation = "source-over";
  c.globalAlpha = 0.12 + v * 0.20;
  c.fillStyle = "#1b1650";
  c.beginPath();
  c.ellipse(p.x, p.y, larg * RX * 1.04, larg * RY * 1.04, 0, 0, 6.2832);
  c.fill();
  if(vif <= 0.02){ c.globalAlpha = 1; return; }

  /* 2. la poussière d'étoile. `globalAlpha` REVIENT À 1 : il portait
     encore l'opacité du voile, qui se serait multipliée avec celle des
     dégradés — c'est exactement le défaut qui avait rendu la traînée
     de feu terne, et il ne coûte rien de ne pas le refaire. */
  c.globalAlpha = 1;
  c.globalCompositeOperation = "lighter";
  var souffle = 0.88 + Math.sin(tps * 4.2 + b.ph) * 0.12;
  var couches = [
    [1.90, "110,90,240",  0.30],
    [1.25, "150,170,255", 0.34],
    [0.66, "235,240,255", 0.36]
  ];
  for(var i = 0; i < couches.length; i++){
    var rr = couches[i][0] * souffle;
    var g = c.createRadialGradient(p.x, p.y, 1, p.x, p.y, rr * RX);
    g.addColorStop(0, "rgba(" + couches[i][1] + "," + (couches[i][2] * vif) + ")");
    g.addColorStop(1, "rgba(" + couches[i][1] + ",0)");
    c.fillStyle = g;
    c.beginPath(); c.ellipse(p.x, p.y, rr * RX, rr * RY, 0, 0, 6.2832); c.fill();
  }
  /* 3. les paillettes : quatre points d'or qui scintillent sur la
     trace. C'est le seul détail qui la fait lire comme de la POUSSIÈRE
     plutôt que comme une flaque de lumière. */
  for(var k = 0; k < 4; k++){
    var a = b.ph + k * 1.5708 + tps * 0.8;
    var d = larg * (0.3 + ((k * 3) % 4) / 6);
    var sc = 0.5 + 0.5 * Math.sin(tps * 6 + b.ph + k * 2.1);
    c.fillStyle = "rgba(245,214,140," + (0.55 * vif * sc) + ")";
    c.beginPath();
    c.ellipse(p.x + Math.cos(a) * d * RX, p.y + Math.sin(a) * d * RY,
              1.1, 0.8, 0, 0, 6.2832);
    c.fill();
  }
  c.globalCompositeOperation = "source-over";
  c.globalAlpha = 1;
}

/* ---------------------------------------------------------------
   LE SON — cristallin, pas un rugissement
   --------------------------------------------------------------- */
/* La tornade de feu gronde ; celle-ci TINTE. Trois notes qui montent,
   très douces, et un souffle d'air derrière. C'est assez pour qu'on
   tourne la tête sans que ce soit une alarme — et le cahier des
   charges de cette carte est clair : « je ne veux pas des sons qui
   deviennent insupportables après dix minutes ». */
function tourbillonSon(){
  if(typeof son === "undefined" || !son.ok()) return;
  var ac = son.ac, t = ac.currentTime;
  /* les trois notes, arpégées : do, mi, sol. Une seule note serait une
     alerte ; trois qui montent sont une annonce, et c'est ce qu'on
     veut — la carte prévient, elle ne sonne pas l'alarme. */
  var notes = [523.25, 659.25, 783.99], i;
  for(i = 0; i < notes.length; i++){
    var t0 = t + i * 0.16;
    var o = ac.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(notes[i], t0);
    var g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.085, t0 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);
    o.connect(g); g.connect(son.maitre);
    o.start(t0); o.stop(t0 + 1.7);
    /* la quinte au-dessus, très faible : c'est elle qui donne le
       timbre de clochette plutôt que de sinus nu */
    var o2 = ac.createOscillator();
    o2.type = "sine";
    o2.frequency.setValueAtTime(notes[i] * 3, t0);
    var g2 = ac.createGain();
    g2.gain.setValueAtTime(0.0001, t0);
    g2.gain.linearRampToValueAtTime(0.022, t0 + 0.03);
    g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
    o2.connect(g2); g2.connect(son.maitre);
    o2.start(t0); o2.stop(t0 + 1.0);
  }
  /* le souffle : du bruit en bande étroite qui monte — l'air aspiré.
     Bien plus discret que le grondement des ténèbres : ce tourbillon
     ne gronde pas, il chuinte. */
  var s2 = ac.createBufferSource();
  s2.buffer = son.bruit; s2.loop = true;
  s2.playbackRate.value = 1.1;
  var f = ac.createBiquadFilter();
  f.type = "bandpass"; f.Q.value = 5;
  f.frequency.setValueAtTime(500, t);
  f.frequency.exponentialRampToValueAtTime(2200, t + 1.3);
  f.frequency.exponentialRampToValueAtTime(700, t + 3.0);
  var gs2 = ac.createGain();
  gs2.gain.setValueAtTime(0.0001, t);
  gs2.gain.linearRampToValueAtTime(0.055, t + 0.7);
  gs2.gain.exponentialRampToValueAtTime(0.0001, t + 3.0);
  s2.connect(f); f.connect(gs2); gs2.connect(son.maitre);
  s2.start(t); s2.stop(t + 3.1);
}
