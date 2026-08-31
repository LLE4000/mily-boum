/* ================================================================
   LES RELIQUES — CE QU'ON EN VOIT

   Le calcul est dans le noyau, et il n'a besoin de personne. Ce
   fichier ne fait que trois choses, et elles sont toutes visuelles :

     ① L'EMBLÈME. Un dessin, rendu en SVG comme les badges, décliné en
       deux familles et cinq paliers. Il paraît partout où une relique
       est nommée : sur la roue, sur le bandeau des navettes, sur la
       page qui l'explique.
     ② LA ROUE. « Une sorte de fenêtre en haut à droite, un peu comme
       casino, une roue qui tourne, qui tourne, puis après ils voient
       un truc avec défense plus dix pour cent. »
     ③ LE BANDEAU DES NAVETTES. « Que la personne, à côté des troupes,
       ait le petit logo plus dix pour cent, plus vingt-cinq pour cent
       — comme ça elle est consciente qu'elle a toujours ça. » Et le
       palier de carte à côté, « comme ça c'est très clair
       visuellement, les dégâts qu'une personne a ».

   RIEN ICI NE DÉCIDE DE QUOI QUE CE SOIT. La roue ne tire pas : elle
   reçoit la relique déjà calculée et va se poser dessus. Rater
   l'animation — recharger la page, fermer l'onglet — ne fait perdre
   aucune relique. C'est la règle qui rend tout le reste possible.
   ================================================================ */

/* ────────────────────────────────────────────────────────────────
   ① L'EMBLÈME

   POURQUOI UNE GEMME, ET PAS UN DISQUE. Le badge est un disque, le
   badge d'honneur est le seul hexagone du jeu, les médailles sont des
   ronds. Une relique devait se distinguer d'un coup d'œil à seize
   pixels, sans lire : un LOSANGE FACETTÉ ne ressemble à rien d'autre
   ici, et sa silhouette tient jusqu'à la taille d'une icône.

   LA FAMILLE EST UNE TEMPÉRATURE, LE PALIER UNE SILHOUETTE. Deux
   codes séparés, parce qu'ils répondent à deux questions différentes
   — « pour frapper ou pour encaisser ? » et « fort comment ? » — et
   qu'un seul code pour deux questions se lit toujours de travers.
   La chaleur d'abord : l'assaut est une braise, la garde est un
   givre. Puis la silhouette monte par ajouts francs, jamais par
   nuances : une facette, puis un anneau, puis des rais, puis une
   couronne de lumière. À seize pixels on ne distingue pas deux ors ;
   on distingue une chose qui a des rais d'une chose qui n'en a pas.
   ──────────────────────────────────────────────────────────────── */
var MilyReliques = (function(){
  "use strict";
  var FAM = {
    a: { cle:"a", nom:"Assaut", mot:"de dégâts",  ic:"⚔",
         corps:"#FF8A45", bord:"#6E2409", coeur:"#FFE0B8", vif:"#FFC27A" },
    g: { cle:"g", nom:"Garde",  mot:"de défense", ic:"🛡",
         corps:"#54D6EA", bord:"#0C3D49", coeur:"#E2F9FF", vif:"#A9ECF7" }
  };
  var CX = 16, CY = 16;

  function losange(r, h){
    return (CX) + "," + (CY - h) + " " + (CX + r) + "," + CY + " "
         + (CX) + "," + (CY + h) + " " + (CX - r) + "," + CY;
  }
  /* Le dessin d'une relique, en repère 32×32 — la même boîte que les
     badges, pour que les deux s'alignent quand ils se côtoient. */
  function svg(fam, palier, opt){
    var F = FAM[fam] || FAM.a, p = Math.max(0, Math.min(4, palier | 0));
    var o = opt || {}, t = o.size || 32;
    var id = "rl" + F.cle + p + (o.uid || "");
    var s = '<svg viewBox="0 0 32 32" width="' + t + '" height="' + t
          + '" class="relSvg" aria-hidden="true">';
    s += '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">'
       + '<stop offset="0" stop-color="' + F.vif + '"/>'
       + '<stop offset="1" stop-color="' + F.corps + '"/></linearGradient>'
       + '<radialGradient id="' + id + 'h"><stop offset="0" stop-color="'
       + F.coeur + '" stop-opacity=".95"/><stop offset="1" stop-color="'
       + F.corps + '" stop-opacity="0"/></radialGradient></defs>';
    /* LA COURONNE DU DERNIER PALIER, dessinée SOUS la gemme : un halo
       posé par-dessus l'aurait laiteuse, alors qu'il doit en sortir. */
    if(p >= 4) s += '<circle cx="16" cy="16" r="15" fill="url(#' + id + 'h)"/>';
    /* Les rais, à partir de l'avant-dernier. Quatre, en croix
       oblique : en croix droite ils se seraient confondus avec les
       pointes du losange. */
    if(p >= 3){
      for(var k = 0; k < 4; k++){
        var a = Math.PI / 4 + k * Math.PI / 2;
        s += '<line x1="' + (16 + Math.cos(a) * 8.5).toFixed(1)
           + '" y1="' + (16 + Math.sin(a) * 8.5).toFixed(1)
           + '" x2="' + (16 + Math.cos(a) * 14.2).toFixed(1)
           + '" y2="' + (16 + Math.sin(a) * 14.2).toFixed(1)
           + '" stroke="' + F.vif + '" stroke-width="1.7" stroke-linecap="round"'
           + ' opacity="' + (p >= 4 ? ".95" : ".7") + '"/>';
      }
    }
    /* L'anneau, à partir du troisième. */
    if(p >= 2) s += '<circle cx="16" cy="16" r="12.4" fill="none" stroke="'
                  + F.vif + '" stroke-width="1.5" opacity="' + (p >= 4 ? ".9" : ".62") + '"/>';
    /* LE CORPS : toujours le même, à tous les paliers. C'est lui qui
       fait qu'une Lueur et un Zénith sont visiblement la même chose. */
    s += '<polygon points="' + losange(9.2, 12.6) + '" fill="url(#' + id
       + ')" stroke="' + F.bord + '" stroke-width="1.6" stroke-linejoin="round"/>';
    /* La table, dès le deuxième palier : c'est elle qui donne la
       facette, et elle se voit encore à seize pixels. */
    if(p >= 1) s += '<polygon points="' + losange(4.4, 6.2) + '" fill="' + F.coeur
                  + '" opacity="' + (0.55 + p * 0.1).toFixed(2) + '"/>';
    else       s += '<polygon points="' + losange(3.0, 4.2) + '" fill="' + F.coeur
                  + '" opacity=".38"/>';
    s += "</svg>";
    return s;
  }
  return { FAM:FAM, svg:svg };
})();

/* Le dessin d'une relique telle que le noyau la rend. */
function svgRelique(r, taille, uid){
  if(!r) return "";
  return MilyReliques.svg(r.famille, r.palier, { size:taille || 32, uid:uid || "" });
}
/* Sa phrase, toujours la même partout : la famille, le nom du palier,
   le pourcentage et ce sur quoi il porte. */
function texteRelique(r){
  if(!r) return "";
  var F = MilyReliques.FAM[r.famille];
  return F.nom.toUpperCase() + " · " + r.nom + " — +" + r.pct + " % " + F.mot;
}

/* ────────────────────────────────────────────────────────────────
   ② LA ROUE

   ELLE MONTRE LES VRAIES CHANCES. Chaque secteur occupe l'angle de sa
   probabilité : le Zénith fait cinq degrés et demi, la Lueur en fait
   quatre-vingt-un. C'était le choix à faire — dix parts égales
   auraient été plus jolies et auraient MENTI, et voir l'aiguille
   s'arrêter sur un éclat d'or large comme un cheveu vaut toutes les
   explications qu'on aurait pu écrire à côté.

   L'ORDRE DES SECTEURS EST UNE PERMUTATION FIXE, et non l'ordre du
   barème : à la suite, les deux gros secteurs de Lueur auraient
   occupé un quart de la roue d'un seul tenant, et le reste aurait
   ressemblé à une miette. On les écarte donc régulièrement — le pas
   de sept sur dix parcourt les dix places sans jamais retomber sur la
   même, ce qui est exactement ce qu'on veut d'un mélange qui ne doit
   rien au hasard.

   ELLE NE TIRE RIEN. On lui donne la relique, elle va se poser
   dessus. Le sens de la rotation, le nombre de tours et l'atterrissage
   sont un décor par-dessus une décision déjà prise.
   ──────────────────────────────────────────────────────────────── */
var ROUE_TOURS = 4;             // tours pleins avant le freinage
var ROUE_LANCE = 3.1;           // secondes de rotation
var ROUE_POSE  = 0.9;           // le temps que le secteur gagnant palpite
var ROUE_LIT   = 4.4;           // puis on lit la phrase, sans être pressé
var ROUE_SORT  = 0.7;           // et elle s'efface
var roueRel = null;

/* Les dix secteurs, une fois pour toutes : famille, palier, part. */
function secteursRoue(){
  var brut = [], i;
  for(i = 0; i < RELIQUES.length; i++){
    brut.push({ f:"a", p:i, part:RELIQUES[i].chance / 200 });
    brut.push({ f:"g", p:i, part:RELIQUES[i].chance / 200 });
  }
  /* la permutation : un pas de sept sur dix places */
  var n = brut.length, out = new Array(n);
  for(i = 0; i < n; i++) out[(i * 7) % n] = brut[i];
  /* puis on pose les bornes angulaires, dans l'ordre du cercle */
  var a = -Math.PI / 2;                       // on part en haut, sous l'aiguille
  for(i = 0; i < n; i++){
    out[i].a0 = a; a += out[i].part * 6.283185307; out[i].a1 = a;
  }
  return out;
}
var ROUE_SECTEURS = null;

function ouvreRoueRelique(r, rang){
  if(!r) return;
  var boite = $("roueRel");
  if(!boite) return;
  if(!ROUE_SECTEURS) ROUE_SECTEURS = secteursRoue();
  /* LE SECTEUR VISÉ : celui de la relique gagnée. On s'arrête en son
     MILIEU, jamais sur son bord — un arrêt à un dixième de degré de la
     frontière ferait douter de ce qu'on vient de gagner. */
  var s = null, i;
  for(i = 0; i < ROUE_SECTEURS.length; i++){
    var e = ROUE_SECTEURS[i];
    if(e.f === r.famille && e.p === r.palier){ s = e; break; }
  }
  if(!s) return;
  var mid = (s.a0 + s.a1) / 2;
  roueRel = {
    r:r, rang:rang | 0, age:0,
    /* l'aiguille est en haut : il faut amener `mid` sous elle */
    fin:ROUE_TOURS * 6.283185307 - (mid + Math.PI / 2),
    ang:0, phase:"tourne"
  };
  boite.classList.add("on");
  boite.classList.toggle("zen", r.palier >= RELIQUES.length - 1);
  var t = $("roueRelTx");
  if(t) t.innerHTML = "";
  if(son && son.reliqueRoue) son.reliqueRoue();
}

function majRoueRelique(dt){
  if(!roueRel) return;
  var R = roueRel, boite = $("roueRel");
  if(!boite){ roueRel = null; return; }
  R.age += dt;
  if(R.phase === "tourne"){
    /* LE FREINAGE EST UNE PUISSANCE CINQUIÈME. Une décélération
       linéaire s'arrête net et donne l'impression d'un bug ; en
       cinquième, la roue passe les trois derniers secteurs au ralenti,
       et c'est là que se joue toute la tension. */
    var u = Math.min(1, R.age / ROUE_LANCE);
    var e = 1 - Math.pow(1 - u, 5);
    R.ang = R.fin * e;
    if(u >= 1){
      R.phase = "pose"; R.age = 0;
      var t = $("roueRelTx");
      /* TROIS LIGNES, ET LA PLUS GROSSE EST LE POURCENTAGE : c'est le
         seul chiffre qu'on retiendra. La phrase d'un seul tenant
         cassait en plein milieu de « de défense », ce qui se lisait
         comme une coupure de mot. */
      var Fw = MilyReliques.FAM[R.r.famille];
      if(t) t.innerHTML =
        '<span class="rlE">' + svgRelique(R.r, 32, "w") + "</span>"
      + '<span class="rlP ' + (R.r.famille === "a" ? "as" : "ga") + '">'
      + Fw.nom.toUpperCase() + " · " + echappe(R.r.nom) + "</span>"
      + '<span class="rlG ' + (R.r.famille === "a" ? "as" : "ga") + '">+'
      + R.r.pct + " %</span>"
      + '<span class="rlN">' + Fw.mot + " · " + R.rang + "<sup>e</sup> relique</span>";
      if(typeof majBandeauReliques === "function") majBandeauReliques();
      if(son && son.reliqueGagnee) son.reliqueGagnee(R.r.palier);
      if(typeof message === "function")
        message("Relique gagnée — " + texteRelique(R.r) + ".");
    }
  }else if(R.phase === "pose" && R.age > ROUE_POSE){
    R.phase = "lit"; R.age = 0;
  }else if(R.phase === "lit" && R.age > ROUE_LIT){
    R.phase = "sort"; R.age = 0; boite.classList.remove("on");
  }else if(R.phase === "sort" && R.age > ROUE_SORT){
    roueRel = null; boite.classList.remove("zen"); return;
  }
  dessineRoueRelique();
}

/* La gemme, dessinée au canevas plutôt qu'en SVG : c'est le même
   losange que l'emblème, et le moyeu de la roue est le seul endroit du
   jeu où il faut le peindre au pinceau. Deux dessins d'une même forme
   sont un risque de divergence, donc celui-ci se tient au strict
   minimum — le corps et la table, pas les rais. */
function gemmeRoue(c, x, y, r, fam, palier){
  var F = MilyReliques.FAM[fam] || MilyReliques.FAM.a;
  var h = r * 1.36;
  function trace(rr, hh){
    c.beginPath();
    c.moveTo(x, y - hh); c.lineTo(x + rr, y); c.lineTo(x, y + hh); c.lineTo(x - rr, y);
    c.closePath();
  }
  var g = c.createLinearGradient(x, y - h, x, y + h);
  g.addColorStop(0, F.vif); g.addColorStop(1, F.corps);
  trace(r, h);
  c.fillStyle = g; c.fill();
  c.strokeStyle = F.bord; c.lineWidth = Math.max(1, r * 0.18); c.lineJoin = "round"; c.stroke();
  trace(r * 0.48, h * 0.48);
  c.fillStyle = F.coeur; c.globalAlpha = 0.55 + palier * 0.1; c.fill(); c.globalAlpha = 1;
}

function dessineRoueRelique(){
  var cv2 = $("roueRelCv");
  if(!cv2 || !roueRel) return;
  var c = cv2.getContext("2d"), R = roueRel;
  var W = cv2.width, H = cv2.height, cx = W / 2, cy = H / 2;
  var ray = Math.min(cx, cy) - 10, moy = ray * 0.33;
  c.clearRect(0, 0, W, H);
  if(!ROUE_SECTEURS) ROUE_SECTEURS = secteursRoue();
  var gagne = (R.phase !== "tourne");

  c.beginPath(); c.arc(cx, cy, ray + 5, 0, 6.2832);
  c.fillStyle = "#0d0714"; c.fill();

  var i, e, F;
  for(i = 0; i < ROUE_SECTEURS.length; i++){
    e = ROUE_SECTEURS[i];
    F = MilyReliques.FAM[e.f];
    var a0 = e.a0 + R.ang, a1 = e.a1 + R.ang, larg = e.a1 - e.a0;
    var est = gagne && e.f === R.r.famille && e.p === R.r.palier;
    c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, ray, a0, a1); c.closePath();
    /* LE PALIER SE LIT DANS LA LUMIÈRE, PAS DANS LA TEINTE. Un secteur
       commun est sourd, un secteur rare est franc : la roue dit donc
       où sont les bonnes cases AVANT de tourner, et la teinte reste
       libre de ne dire qu'une chose — assaut ou garde.
       Le dégradé va du centre vers le bord, comme la lumière d'un
       cadran : sans lui les dix parts font un aplat de papier. */
    var g2 = c.createRadialGradient(cx, cy, moy * 0.8, cx, cy, ray);
    var k = 0.34 + e.p * 0.165;                     // 0,34 → 1,00
    g2.addColorStop(0, melangeSombre(F.bord, F.corps, k * 0.55));
    g2.addColorStop(1, melangeSombre(F.bord, F.vif,  k));
    c.fillStyle = g2; c.fill();
    if(est){
      /* Le battement reste SOUS le blanc : à pleine intensité le
         secteur gagnant se délavait, et le chiffre qu'il porte —
         celui qu'on vient de gagner — devenait le moins lisible de la
         roue. Un tiers d'éclat suffit à le désigner. */
      var bat = 0.5 + 0.5 * Math.sin(R.age * 9);
      c.save(); c.globalCompositeOperation = "lighter";
      c.globalAlpha = 0.10 + 0.22 * bat; c.fillStyle = F.vif; c.fill(); c.restore();
    }
    c.strokeStyle = est ? F.coeur : "rgba(6,3,10,.85)";
    c.lineWidth = est ? 2.2 : 1.1;
    c.stroke();
    /* LE CHIFFRE, MAIS SEULEMENT LÀ OÙ IL TIENT. Sous quinze degrés il
       se chevaucherait avec ses voisins ; les secteurs rares n'en ont
       de toute façon pas besoin — c'est la légende sous la roue qui
       les nomme, et leur finesse est déjà tout leur message. */
    if(larg > 0.26){
      var am = (a0 + a1) / 2;
      c.save();
      c.translate(cx + Math.cos(am) * ray * 0.70, cy + Math.sin(am) * ray * 0.70);
      c.rotate(am + Math.PI / 2);
      c.fillStyle = "rgba(255,255,255,.92)";
      c.font = "700 " + (e.p >= 2 ? 12 : 11) + "px system-ui, sans-serif";
      c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("+" + (e.f === "a" ? RELIQUES[e.p].assaut : RELIQUES[e.p].garde), 0, 0);
      c.restore();
    }
  }
  /* LE MOYEU. Il porte un point d'interrogation tant que ça tourne, et
     la gemme gagnée dès que c'est posé : c'est là que l'œil est, et
     c'est donc là que la réponse doit apparaître. */
  c.beginPath(); c.arc(cx, cy, moy, 0, 6.2832);
  c.fillStyle = "#130c1d"; c.fill();
  c.strokeStyle = "rgba(255,210,122,.5)"; c.lineWidth = 1.6; c.stroke();
  if(gagne){
    gemmeRoue(c, cx, cy, moy * 0.52, R.r.famille, R.r.palier);
  }else{
    c.fillStyle = "rgba(255,210,122,.62)";
    c.font = "800 " + (moy * 1.05).toFixed(0) + "px system-ui, sans-serif";
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("?", cx, cy + 1);
  }
  /* la jante, puis l'aiguille — l'aiguille EN DERNIER, elle passe
     par-dessus tout ce qui tourne */
  c.beginPath(); c.arc(cx, cy, ray + 5, 0, 6.2832);
  c.strokeStyle = "rgba(255,210,122,.45)"; c.lineWidth = 2.4; c.stroke();

  c.beginPath();
  c.moveTo(cx, cy - ray + 9); c.lineTo(cx - 8, cy - ray - 8); c.lineTo(cx + 8, cy - ray - 8);
  c.closePath();
  c.fillStyle = "#ffd27a"; c.fill();
  c.strokeStyle = "#2c1a05"; c.lineWidth = 1.4; c.stroke();
}
/* Un mélange linéaire entre deux couleurs « #rrggbb ». `k` vaut zéro
   pour la première, un pour la seconde. Cinquante appels par image sur
   deux constantes : on retient les résultats, sinon on rejouerait
   soixante fois par seconde le même découpage de chaîne. */
var MEL_LU = {};
function melangeSombre(a, b, k){
  var cle = a + b + k.toFixed(3);
  if(MEL_LU[cle]) return MEL_LU[cle];
  function lit(s){
    return [parseInt(s.substr(1, 2), 16), parseInt(s.substr(3, 2), 16),
            parseInt(s.substr(5, 2), 16)];
  }
  var x = lit(a), y = lit(b), o = "rgb(";
  for(var i = 0; i < 3; i++)
    o += Math.round(x[i] + (y[i] - x[i]) * k) + (i < 2 ? "," : ")");
  MEL_LU[cle] = o;
  return o;
}

/* ────────────────────────────────────────────────────────────────
   ③ LE BANDEAU DES NAVETTES

   Trois pastilles au plus, sur la ligne des navettes — donc À CÔTÉ
   DES TROUPES, ce qui était la demande, et non dans un coin qu'on ne
   regarde pas.

   ON N'AFFICHE QUE CE QU'ON A. Une pastille grise « pas encore de
   relique de garde » serait un reproche permanent affiché sous les
   yeux du joueur ; une pastille absente est simplement une pastille
   qui apparaîtra. Le palier de carte, lui, ne se montre qu'à partir du
   premier : « ×1,0 » n'est pas une information.
   ──────────────────────────────────────────────────────────────── */
function pastilleRelique(fam, palier, pct){
  if(palier < 0) return "";
  var F = MilyReliques.FAM[fam];
  return '<span class="relT ' + (fam === "a" ? "as" : "ga") + '" title="'
       + F.nom + " · " + RELIQUES[palier].nom + " — +" + pct + " % " + F.mot
       + ' (relique, acquise pour toujours)">'
       + MilyReliques.svg(fam, palier, { size:15, uid:"b" + fam })
       + '<b>+' + pct + ' %</b></span>';
}
function majBandeauReliques(){
  var e = $("relTuiles");
  if(!e) return;
  if(!jeu || !enJeu){ e.innerHTML = ""; return; }
  var b = (typeof bonusReliques === "function")
          ? bonusReliques(monde && monde.rq, scoresDesReliques(), monNom)
          : { pa:-1, pg:-1, assaut:0, garde:0 };
  var h = pastilleRelique("a", b.pa, b.assaut) + pastilleRelique("g", b.pg, b.garde);
  /* LE PALIER DE CARTE, DANS LA MÊME LIGNE ET AVEC UN AUTRE VISAGE.
     « Rajouter le plus dix, plus vingt, plus trente, plus cent pour
     cent des paliers qu'on a dans les maps, comme ça c'est très clair
     visuellement. » Il est vert et carré là où les reliques sont
     chaudes ou froides et facettées : c'est un bonus de la partie en
     cours, pas un acquis, et les deux ne doivent jamais se confondre. */
  var p = jeu.palier | 0;
  if(p > 0){
    var pc = Math.round((PALIERS_PUISSANCE[p].mult - 1) * 100);
    h += '<span class="relT pal" title="Palier de puissance ' + p
       + " — il vaut pour CETTE île, et il monte avec tes dégâts dessus"
       + '"><i>▲</i><b>+' + pc + ' %</b></span>';
  }
  e.innerHTML = h;
}

/* ────────────────────────────────────────────────────────────────
   L'INSTALLATION, ET LE RAFRAÎCHISSEMENT LENT

   Le bandeau ne bouge presque jamais : une relique par million, un
   palier toutes les cent mille. Le relire quatre fois par seconde
   suffit largement, et lui épargne un décodage du tableau des dégâts
   soixante fois par image.
   ──────────────────────────────────────────────────────────────── */
var relLent = 0, relSignature = "";
function majReliquesLent(dt){
  if(!enJeu || !jeu) return;
  relLent += dt;
  if(relLent < 0.25) return;
  relLent = 0;
  /* On ne repeint que si quelque chose a changé : innerHTML sur une
     ligne du HUD quatre fois par seconde pour rien, c'est du travail
     que le navigateur refait à chaque fois. */
  var sig = (jeu.multAssaut + "/" + jeu.multGarde + "/" + (jeu.palier | 0));
  if(sig === relSignature) return;
  relSignature = sig;
  majBandeauReliques();
}
function installeReliques(){
  var b = $("btReliques"), f = $("btReliquesFerme"), p = $("reliquesP");
  if(b) b.addEventListener("click", ouvrePageReliques);
  if(f) f.addEventListener("click", fermePageReliques);
  if(p) p.addEventListener("click", function(ev){ if(ev.target === p) fermePageReliques(); });
}

/* ────────────────────────────────────────────────────────────────
   LA PAGE QUI L'EXPLIQUE

   Elle ne recopie AUCUN chiffre : les cinq paliers, leurs deux
   pourcentages et leurs chances sortent de la table du noyau. Une
   table recopiée à la main aurait été juste une fois, le jour où on
   l'a écrite — c'est la même règle que pour la page des badges.
   ──────────────────────────────────────────────────────────────── */
function construitPageReliques(){
  var e = $("reliquesCorps");
  if(!e) return;
  var b = bonusReliques(monde && monde.rq, scoresDesReliques(), monNom);
  var h = "";

  /* CE QUE JE PORTE, EN TÊTE. C'est la question qu'on vient poser. */
  h += '<div class="rlMien">';
  if(b.pa < 0 && b.pg < 0){
    h += '<div class="rlRien">Tu n\'as pas encore de relique. Elles se gagnent '
       + 'sur les <b>deux cartes bonus</b>, un tirage par million de dégâts.</div>';
  }else{
    h += '<div class="rlDeux">'
       + (b.pa >= 0 ? blocRelique("a", b.pa, b.assaut) : blocViderelique("a"))
       + (b.pg >= 0 ? blocRelique("g", b.pg, b.garde)  : blocViderelique("g"))
       + '</div>';
  }
  var n = b.n | 0;
  h += '<div class="rlCpt">' + (n ? n + " tirage" + (n > 1 ? "s" : "") + " à ce jour"
                                  : "Aucun tirage pour l'instant") + "</div></div>";

  /* LE BARÈME, LU DANS LA TABLE. */
  h += "<h4>Les cinq paliers</h4>"
     + '<div class="rlN2">Un tirage par million de dégâts, sur les deux cartes '
     + 'bonus uniquement. On garde <b>la meilleure</b> de chaque famille — '
     + 'elle ne redescend jamais, et elle suit le pseudo.</div>'
     + '<table class="rlTab"><tr><th></th><th>Palier</th><th>Assaut</th>'
     + "<th>Garde</th><th>Chance</th></tr>";
  for(var i = RELIQUES.length - 1; i >= 0; i--){
    var R = RELIQUES[i];
    h += "<tr" + (i === RELIQUES.length - 1 ? ' class="rlMax"' : "") + ">"
       + '<td class="rlIc">' + MilyReliques.svg("a", i, { size:22, uid:"ta" + i })
       + MilyReliques.svg("g", i, { size:22, uid:"tg" + i }) + "</td>"
       + "<td><b>" + echappe(R.nom) + "</b></td>"
       + '<td class="rlAs">+' + R.assaut + " %</td>"
       + '<td class="rlGa">+' + R.garde + " %</td>"
       + "<td>" + R.chance + " %</td></tr>";
  }
  h += "</table>";
  h += '<div class="rlN2">Plus tu as frappé sur une carte, plus la roue tire de '
     + "fois et garde le meilleur résultat : au premier million elle tire une fois, "
     + "à partir du treizième elle en tire " + RELIQUE_TIRAGES_MAX + ". "
     + "Le palier max passe alors de " + RELIQUES[RELIQUES.length - 1].chance
     + " % à environ 14 %.</div>";

  /* LE DÉTAIL, s'il y a quelque chose à détailler. */
  var l = listeReliques(monde && monde.rq, scoresDesReliques(), monNom);
  if(l.length){
    h += "<h4>Tes derniers tirages</h4><div class=\"rlListe\">";
    for(var k = 0; k < l.length; k++){
      var r = l[k];
      h += '<div class="rlL"><span class="e">' + svgRelique(r, 20, "d" + k) + "</span>"
         + '<span class="n">' + echappe(texteRelique(r)) + "</span>"
         + '<span class="c">' + echappe(CARTES[r.carte] ? CARTES[r.carte].nom : "")
         + " · n<sup>o</sup>" + r.n + "</span></div>";
    }
    h += "</div>";
  }
  e.innerHTML = h;
}
function blocRelique(fam, palier, pct){
  var F = MilyReliques.FAM[fam];
  return '<div class="rlB ' + (fam === "a" ? "as" : "ga") + '">'
       + '<div class="g">' + MilyReliques.svg(fam, palier, { size:76, uid:"m" + fam }) + "</div>"
       + '<div class="p">+' + pct + " %</div>"
       + '<div class="t">' + echappe(RELIQUES[palier].nom) + " — "
       + (fam === "a" ? "dégâts des troupes" : "résistance des troupes") + "</div></div>";
}
function blocViderelique(fam){
  var F = MilyReliques.FAM[fam];
  return '<div class="rlB vide"><div class="g">' + F.ic + "</div>"
       + '<div class="p">—</div><div class="t">pas encore de relique '
       + F.nom.toLowerCase() + "</div></div>";
}
function ouvrePageReliques(){ construitPageReliques(); $("reliquesP").classList.add("on"); }
function fermePageReliques(){ $("reliquesP").classList.remove("on"); }
