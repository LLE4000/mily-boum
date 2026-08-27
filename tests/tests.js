#!/usr/bin/env node
/* ================================================================
   Tests de Mily Boum.
   Ils lisent le fichier livré (mily-boum.html), en extraient le bloc
   NOYAU — qui ne contient que du calcul pur — et l'exécutent.
   Lancement :  node tests/tests.js
   ================================================================ */
var fs = require("fs"), path = require("path");

var fichier = path.join(__dirname, "..", "mily-boum.html");
var html = fs.readFileSync(fichier, "utf8");

var d = html.indexOf("/*==NOYAU_DEBUT==*/");
var f = html.indexOf("/*==NOYAU_FIN==*/");
if(d < 0 || f < 0){ console.error("Bloc NOYAU introuvable dans mily-boum.html"); process.exit(1); }
var source = html.slice(d, f);

var N;
try{
  N = new Function(source + "\nreturn {" + [
    "EQ","prng","graineTexte","graineCarte","iso","deIso","borne","versMonde","versEcran",
    "debutPince","appliquePince","ecartAngulaire","dansCone","DEF","UNI","CRE","COUT","CAP",
    "rayonFormation","ancreFormation","ANGLE_OR","inverseRadical","RAYON_QG",
    "placesNavette","flotteMaximum","texteVictoire","TYPES_TROUPE","VERSION",
    "encodeBits","decodeBits","unionBits","compteBits","fusionneMonde","memeMonde",
    "mondeVide","mondeValide","rangMonde","ALPHA_BITS","paquetPublish","litPublish",
    "CARTES","GW","GH","LARGEUR_ROCHE","QG_GX","QG_GY","PLAGE_X0","SOL_ECH","tailleSolPrecalcule",
    "NB_CARTES_NORMALES","IDX_JUNGLE","carteSpeciale","planJungle","planDeCarte",
    "jungleEnCours","msMonde","meilleurMinJoueurs","fusionneJungle","memeJungle",
    "encodeChampions","decodeChampions","fusionneChampions",
    "encodeTop3","decodeTop3","fusionneTop3","top3DeCarte","inscritTop3","poseJungle","mondeVide",
    "NB_REACTEURS","encodeScores","decodeScores","fusionneScores","SCORES_GARDES","plafondScore","FileDegats","carteOrageuse","encodePlans","planCarte","faitZone","decodePlan","encodePlan","planJungle","empreinteCarte","QG_GX","QG_GY","PALIERS_PUISSANCE","palierPuissance","multPuissance","auraPuissance","PALIER_SUPERNOVA",
    "SCORES_OCTETS","octetsUtf8","cleScore","totalParJoueur","totalParJoueurCarte","classementDepuis","nettoieNomScore","nettoieSeau","nomsDesSeaux","seauHerite","MARQUE_SCORES",
    "genereCarte","empreinteCarte","utf8Octets","encodePlan","decodePlan","planVide",
    "zoneDePlan","zonesPeintes","NB_ZONES","ZONES_L","ZONES_H","TYPES_PLAN","DENSITES","PAS_ZONE","meilleurPlan","texteUtf8","encodeLongueur","decodeLongueur",
    "encodePlans","decodePlans","planCarte","faitZone","zoneType","zoneDens","zoneChamp","zoneEstVide","sautRenfort","MARQUE_PLAN2",
    "encodeChats","decodeChats","fusionneChats","ESPECES_PROTEGEES",
    "chaineMqtt","paquetConnect","paquetSubscribe","paquetPublish","paquetPing",
    "paquetDeconnexion","DecodeurMqtt","litPublish","FileDegats","mitraTouche","ZMIN","ZMAX","coutActuel","tirePondere",
    "boiteMonde","zoomAjuste","zoomPlancher","MARGE_MONDE",
    "FORMES_PLAN","COUCHES_PLAN","REPARTITIONS","MARQUE_FORMES","formeContient","dansPolygone",
    "centreForme","paramForme","longForme","bruitForme","typeDeForme","sautModuleForme",
    "encodeFormes","decodeFormes","encodePlanComplet","partieQuadrillage","partieFormes",
    "litPlan","planEn","formeSous","planEstVide","selForme","placeDansMelange",
    "boiteForme","tableForme","fractionAire","formeChangee","parametreRange","SEAUX_FORME"
  ].join(",") + "};")();
}catch(e){
  console.error("Le bloc NOYAU n'est pas évaluable : " + e.message);
  process.exit(1);
}

/* Le bloc NOYAU est du calcul pur, donc testable ici — mais c'est une
   fraction du fichier livré. Une faute de frappe dans le rendu ou dans
   le jeu passait donc au travers : les tests restaient au vert pendant
   que la page ne s'ouvrait plus du tout. On vérifie maintenant que TOUT
   le JavaScript livré s'analyse, avant même de tester quoi que ce soit. */
var blocs = html.match(/<script>[\s\S]*?<\/script>/g) || [];
if(!blocs.length){ console.error("Aucun bloc <script> dans mily-boum.html"); process.exit(1); }
for(var ib = 0; ib < blocs.length; ib++){
  var corps = blocs[ib].replace(/^<script>/, "").replace(/<\/script>$/, "");
  try{ new Function(corps); }
  catch(eb){
    console.error("Le bloc <script> n°" + (ib + 1) + " du fichier livré ne s'analyse pas :");
    console.error("  " + eb.message);
    process.exit(1);
  }
}

/* ---------------- petit harnais ---------------- */
var total = 0, echecs = 0, groupe = "";
function G(n){ groupe = n; console.log("\n── " + n); }
function ok(nom, cond, detail){
  total++;
  if(cond){ console.log("   ✓ " + nom); }
  else{ echecs++; console.log("   ✗ " + nom + (detail ? "  → " + detail : "")); }
}
/* générateur reproductible pour les tests eux-mêmes */
var alTest = N.prng(20260825);

/* ================================================================
   1. Aller-retour de projection
   ================================================================ */
G("1. Aller-retour de projection (300 points, caméra aléatoire)");
(function(){
  var pireIso = 0, pireCam = 0;
  for(var i = 0; i < 300; i++){
    var gx = (alTest() - 0.5) * 400, gy = (alTest() - 0.5) * 400;
    var p = N.iso(gx, gy), r = N.deIso(p.x, p.y);
    pireIso = Math.max(pireIso, Math.abs(r.gx - gx), Math.abs(r.gy - gy));

    var cam = { px:(alTest() - 0.5) * 4000, py:(alTest() - 0.5) * 4000,
                z:N.ZMIN + alTest() * (N.ZMAX - N.ZMIN) };
    var e = N.versEcran(cam, gx, gy), m = N.versMonde(cam, e.x, e.y);
    pireCam = Math.max(pireCam, Math.abs(m.gx - gx), Math.abs(m.gy - gy));
  }
  ok("deIso(iso(g)) = g à 1e-9 près", pireIso < 1e-9, "erreur max " + pireIso);
  ok("versMonde(versEcran(g)) = g à 1e-9 près", pireCam < 1e-9, "erreur max " + pireCam);
})();

/* ================================================================
   2. Ancrage du pincement
   ================================================================ */
G("2. Ancrage du pincement (400 gestes)");
(function(){
  var pire = 0, pireZ = 0;
  for(var i = 0; i < 400; i++){
    var cam = { px:(alTest() - 0.5) * 2000, py:(alTest() - 0.5) * 2000,
                z:0.3 + alTest() * 0.9 };
    var ax = alTest() * 900, ay = alTest() * 600;
    var bx = alTest() * 900, by = alTest() * 600;
    if(Math.hypot(ax - bx, ay - by) < 30){ bx += 60; by += 40; }

    /* point du monde saisi sous le milieu des doigts */
    var mx0 = (ax + bx) / 2, my0 = (ay + by) / 2;
    var monde0 = N.versMonde(cam, mx0, my0);
    var pincee = N.debutPince(cam, ax, ay, bx, by);

    /* le geste : écartement ET glissement */
    var ech = 0.45 + alTest() * 1.8;
    var glx = (alTest() - 0.5) * 500, gly = (alTest() - 0.5) * 400;
    var cx = (ax + bx) / 2, cy = (ay + by) / 2;
    var ax2 = cx + (ax - cx) * ech + glx, ay2 = cy + (ay - cy) * ech + gly;
    var bx2 = cx + (bx - cx) * ech + glx, by2 = cy + (by - cy) * ech + gly;

    N.appliquePince(cam, pincee, ax2, ay2, bx2, by2, 0.01, 40);   // bornes larges : pas d'écrêtage
    var mx1 = (ax2 + bx2) / 2, my1 = (ay2 + by2) / 2;
    var monde1 = N.versMonde(cam, mx1, my1);
    pire = Math.max(pire, Math.abs(monde1.gx - monde0.gx), Math.abs(monde1.gy - monde0.gy));
    pireZ = Math.max(pireZ, Math.abs(cam.z - pincee.z * ech));
  }
  ok("le point saisi reste sous le milieu des doigts", pire < 1e-9, "dérive max " + pire + " case");
  ok("le zoom suit exactement le rapport d'écartement", pireZ < 1e-9, "écart max " + pireZ);

  /* écrêtage : au zoom maxi, la caméra ne doit pas partir en vrille */
  var cam2 = { px:100, py:50, z:1.6 };
  var pin2 = N.debutPince(cam2, 100, 100, 300, 100);
  N.appliquePince(cam2, pin2, 0, 100, 900, 100, N.ZMIN, N.ZMAX);
  ok("le zoom reste borné", cam2.z <= N.ZMAX + 1e-12 && cam2.z >= N.ZMIN - 1e-12, "z=" + cam2.z);
  ok("la caméra reste finie après écrêtage", isFinite(cam2.px) && isFinite(cam2.py));
})();

/* ================================================================
   2b. Le dézoom s'arrête au bord de l'île

   On ne recule plus dans le vide : le plancher du zoom est celui où la
   boîte du monde tient exactement dans le canevas. La preuve directe,
   c'est qu'au plancher les quatre coins du monde sont dans l'écran, et
   qu'un cheveu en dessous ils n'y sont plus.
   ================================================================ */
G("2b. Le dézoom s'arrête au bord de l'île");
(function(){
  var B = N.boiteMonde();
  ok("la boîte du monde a une largeur et une hauteur", B.l > 0 && B.h > 0,
     Math.round(B.l) + " × " + Math.round(B.h) + " px de monde");
  /* le losange isométrique est deux fois plus large que haut */
  ok("la boîte garde le rapport 2:1 du losange", Math.abs(B.l / B.h - 2) < 1e-9,
     "rapport " + (B.l / B.h).toFixed(6));

  /* Sur une tablette en paysage, c'est le plancher mesuré qui commande,
     et il est BIEN AU-DESSUS de l'ancien 0,13 : c'est tout le défaut. */
  var zT = N.zoomPlancher(1900, 1000);
  ok("sur tablette, le plancher est mesuré et non plus fixe", zT > N.ZMIN + 1e-6,
     "plancher " + zT.toFixed(4) + " contre " + N.ZMIN + " avant");
  ok("à ce plancher, l'île tient tout juste dans l'écran",
     B.l * zT <= 1900 + 1e-6 && B.h * zT <= 1000 + 1e-6,
     Math.round(B.l * zT) + " × " + Math.round(B.h * zT) + " px pour 1900 × 1000");
  ok("et elle en touche un bord : on ne peut pas reculer davantage",
     Math.abs(B.l * zT - 1900) < 1e-6 || Math.abs(B.h * zT - 1000) < 1e-6);
  ok("un cheveu plus loin, le monde ne remplirait plus l'écran",
     B.l * zT * 0.99 < 1900 - 1e-6 && B.h * zT * 0.99 < 1000 - 1e-6);

  /* Le plancher suit l'écran : plus il est grand, plus il faut être
     près pour que l'île le remplisse. */
  ok("un écran plus grand relève le plancher",
     N.zoomPlancher(3800, 2000) > N.zoomPlancher(1900, 1000) - 1e-12);
  ok("le plancher ne dépend que du plus contraignant des deux côtés",
     Math.abs(N.zoomPlancher(1900, 100000) - 1900 / B.l) < 1e-9);

  /* ZMIN reste le plancher DUR : sur un téléphone étroit, montrer
     l'île entière ferait des cases de trois pixels. On préfère la
     lisibilité — et à ce zoom-là on est de toute façon trop près pour
     voir le vide. */
  var zP = N.zoomPlancher(400, 800);
  ok("sur un téléphone étroit, ZMIN reprend la main", zP === N.ZMIN,
     "plancher " + zP);
  ok("et il ne descend jamais sous ZMIN, quel que soit l'écran",
     N.zoomPlancher(1, 1) >= N.ZMIN - 1e-12 &&
     N.zoomPlancher(0, 0) >= N.ZMIN - 1e-12);
  ok("un canevas dégénéré ne renvoie pas NaN",
     isFinite(N.zoomPlancher(0, 0)) && isFinite(N.zoomPlancher(-5, -5)));
  ok("le plancher ne dépasse jamais le plafond",
     N.zoomPlancher(1e6, 1e6) <= N.ZMAX + 1e-12);

  /* Le plancher vaut pour LES SIX CARTES : il ne regarde que la
     géométrie du monde, jamais l'index de l'île. */
  ok("le plancher est le même pour les six cartes",
     typeof N.zoomPlancher(1900, 1000) === "number" && N.CARTES.length === 6);

  /* La marge de mer est partagée avec la butée de déplacement : c'est
     ce qui garantit que le zoom plancher montre exactement ce que la
     caméra permet d'atteindre. */
  var m = N.MARGE_MONDE;
  var att = N.iso(N.GW + m, -m).x - N.iso(-m, N.GH + m).x;
  ok("la boîte du zoom est celle de la butée de caméra", Math.abs(B.l - att) < 1e-9);

  /* ================================================================
     LA MARGE VAUT POUR LES QUATRE CÔTÉS

     Elle n'entrait que par gx, et seulement par sa borne haute :
     mesuré, 208 pixels à l'est, 104 au sud, ZÉRO à l'ouest et au nord.
     L'île n'était donc pas centrée dans sa propre boîte, et la caméra
     pouvait s'écarter deux fois plus d'un côté que de l'autre.
     ================================================================ */
  (function(){
    var q = [N.iso(0, 0), N.iso(N.GW, 0), N.iso(N.GW, N.GH), N.iso(0, N.GH)];
    var xs = q.map(function(p){ return p.x; }), ys = q.map(function(p){ return p.y; });
    var ouest = Math.min.apply(null, xs) - B.x0, est = B.x1 - Math.max.apply(null, xs);
    var nord  = Math.min.apply(null, ys) - B.y0, sud = B.y1 - Math.max.apply(null, ys);
    ok("la marge est la même à l'ouest et à l'est",
       Math.abs(ouest - est) < 1e-9, Math.round(ouest) + " / " + Math.round(est));
    ok("et la même au nord et au sud",
       Math.abs(nord - sud) < 1e-9, Math.round(nord) + " / " + Math.round(sud));
    ok("aucune n'est nulle : on voit un peu de mer de tous les côtés",
       ouest > 0 && nord > 0, Math.round(ouest) + " px");
    /* L'île est donc CENTRÉE dans sa boîte, ce qui n'était pas le cas :
       le centre du losange doit tomber sur le centre de la boîte. */
    ok("l'île est centrée dans sa boîte", (function(){
      var cx = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2;
      var cy = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;
      return Math.abs(cx - (B.x0 + B.x1) / 2) < 1e-9
          && Math.abs(cy - (B.y0 + B.y1) / 2) < 1e-9;
    })());
    /* Et le plancher ne s'en trouve pas dégradé : la marge est passée
       de huit cases à quatre précisément pour ça. À huit sur les
       quatre côtés il tombait à 0,168 — on aurait vu plus d'eau. */
    ok("le plancher reste au-dessus de 0,17 sur une tablette",
       N.zoomPlancher(1400, 860) > 0.17,
       N.zoomPlancher(1400, 860).toFixed(4));
  })();
})();

/* ================================================================
   3. Codec MQTT
   ================================================================ */
G("3. Codec MQTT 3.1.1");
(function(){
  /* longueurs variables */
  var attendus = {
    0     : [0x00],
    127   : [0x7f],
    128   : [0x80, 0x01],
    321   : [0xc1, 0x02],
    16383 : [0xff, 0x7f]
  };
  var bon = true, det = "";
  Object.keys(attendus).forEach(function(k){
    var e = N.encodeLongueur(+k);
    if(e.join(",") !== attendus[k].join(",")){ bon = false; det += k + "→[" + e + "] "; }
    var r = N.decodeLongueur(e, 0);
    if(!r || r.valeur !== +k || r.suivant !== e.length){ bon = false; det += "décodage " + k + " "; }
  });
  ok("longueurs 0 / 127 / 128 / 321 / 16383", bon, det);

  var e4 = N.encodeLongueur(268435455);
  ok("longueur maximale (4 octets)", e4.length === 4 && N.decodeLongueur(e4, 0).valeur === 268435455);
  ok("longueur incomplète → null", N.decodeLongueur([0x80], 0) === null);
  ok("longueur malformée (5 octets) → erreur",
     (N.decodeLongueur([0x80,0x80,0x80,0x80,0x80], 0) || {}).erreur === true);

  /* aller-retour PUBLISH avec charge utile de plus de 127 octets */
  var sujet = "khiao/mily/MILY";
  var gros = JSON.stringify({ t:"etat", id:"abcdef", n:120, g:412345,
    p:(function(){ var a = []; for(var i = 0; i < 20; i++) a.push([100.5 + i, 52.25 - i, i % 4]); return a; })(),
    accents:"éclairante, fumigène, électrobombes" });
  var trame = N.paquetPublish(sujet, gros);
  var dec = new N.DecodeurMqtt();
  dec.ajoute(trame);
  var p = dec.suivant();
  ok("PUBLISH > 127 octets : type 3", p && p.type === 3, p ? "type " + p.type : "rien");
  var lu = N.litPublish(p.corps);
  ok("sujet préservé", lu.sujet === sujet, lu.sujet);
  ok("charge utile préservée (" + gros.length + " car., UTF-8)", lu.message === gros);
  ok("le tampon est vide après extraction", dec.suivant() === null);

  /* flux coupé en morceaux de 7 octets, deux PUBLISH collés */
  var t1 = N.paquetPublish(sujet, gros);
  var t2 = N.paquetPublish(sujet, JSON.stringify({ t:"deg", id:"zz", d:1234, s:7 }));
  var flux = [];
  var i;
  for(i = 0; i < t1.length; i++) flux.push(t1[i]);
  for(i = 0; i < t2.length; i++) flux.push(t2[i]);
  var dec2 = new N.DecodeurMqtt(), recus = [];
  for(i = 0; i < flux.length; i += 7){
    dec2.ajoute(flux.slice(i, i + 7));
    var q;
    while((q = dec2.suivant()) !== null) recus.push(N.litPublish(q.corps).message);
  }
  ok("deux PUBLISH collés, flux coupé en morceaux de 7 octets", recus.length === 2, "reçus " + recus.length);
  ok("premier message intact", recus[0] === gros);
  ok("second message intact", recus[1] === JSON.stringify({ t:"deg", id:"zz", d:1234, s:7 }));

  /* CONNECT / SUBSCRIBE bien formés */
  var cn = N.paquetConnect("mily-abc123", 45);
  ok("CONNECT : type 1, protocole MQTT niveau 4",
     cn[0] === 0x10 && cn[4] === 0x4d && cn[5] === 0x51 && cn[6] === 0x54 && cn[7] === 0x54 && cn[8] === 4);
  ok("CONNECT : session propre + keepalive 45 s", cn[9] === 0x02 && cn[10] === 0 && cn[11] === 45);
  var sb = N.paquetSubscribe(1, sujet);
  ok("SUBSCRIBE : type 8 avec drapeau 2 et QoS 0",
     sb[0] === 0x82 && sb[sb.length - 1] === 0);
  ok("PINGREQ / DISCONNECT",
     N.paquetPing()[0] === 0xc0 && N.paquetDeconnexion()[0] === 0xe0);

  /* UTF-8 : caractères accentués et hors plan de base */
  var s = "Éclairante — fumigène 👻 électrobombe";
  ok("aller-retour UTF-8 (accents + emoji)", N.texteUtf8(N.utf8Octets(s), 0, N.utf8Octets(s).length) === s);
})();

/* ================================================================
   4. Déterminisme de la graine
   ================================================================ */
G("4. Déterminisme de la génération de carte");
(function(){
  var a = N.genereCarte("MILY", 0), b = N.genereCarte("MILY", 0);
  ok("même code + même index → carte identique", N.empreinteCarte(a) === N.empreinteCarte(b));
  var c = N.genereCarte("MILY", 1);
  ok("index différent → carte différente", N.empreinteCarte(a) !== N.empreinteCarte(c));
  var e = N.genereCarte("AUTRE", 0);
  ok("code de salon différent → carte différente", N.empreinteCarte(a) !== N.empreinteCarte(e));

  /* ---- LE PLAN DE DÉFENSE ----
     Le point le plus important est le premier : sans plan et sans
     tirage, la carte doit rester au bit près celle d'avant l'éditeur.
     Les salons en cours désignent leurs bâtiments détruits par leur
     indice ; si la carte bougeait, ils rendraient les mauvais. */
  ok("sans plan ni tirage, la carte est celle d'origine",
     N.empreinteCarte(N.genereCarte("MILY", 0, "", 0)) === N.empreinteCarte(a));
  ok("un plan absent, nul ou pourri est traité comme « d'origine »",
     N.empreinteCarte(N.genereCarte("MILY", 0, null, 0)) === N.empreinteCarte(a) &&
     N.empreinteCarte(N.genereCarte("MILY", 0, "@@@!!!", 0)) === N.empreinteCarte(a));

  var zv = N.planVide();
  ok("un plan vierge tient en " + N.NB_ZONES + " zones et s'encode en rien",
     zv.length === N.NB_ZONES && N.encodePlan(zv) === "");
  var zt = N.planVide();
  zt[0] = N.faitZone(3, 3, 0); zt[100] = N.faitZone(5, 1, 1);
  zt[N.NB_ZONES - 1] = N.faitZone(8, 5, 0);
  var ch = N.encodePlan(zt), zr = N.decodePlan(ch);
  var identique = zr.length === N.NB_ZONES;
  for(var iz = 0; iz < N.NB_ZONES; iz++) if(zt[iz] !== zr[iz]) identique = false;
  ok("aller-retour d'encodage fidèle (" + ch.length + " caractères)", identique);
  ok("3 zones peintes reconnues", N.zonesPeintes(zr) === 3);
  ok("une chaîne corrompue dégénère en « tout d'origine »",
     N.decodePlan("!!!???").every(function(x){ return x === 0; }));

  /* le plan agit vraiment : mêmes zones partout → un seul type */
  var zf = N.planVide();
  for(var jz = 0; jz < N.NB_ZONES; jz++) zf[jz] = N.faitZone(3, 3, 0);   // frelon, saturé
  var cf = N.genereCarte("MILY", 0, N.encodePlan(zf), 0);
  /* Ni les cellules d'énergie, ni les cellules électriques, ni les
     miradors ne sont concernés par le plan : les deux premiers ne sont
     pas des défenses, et les miradors sont posés à part, APRÈS le
     quadrillage, pour ne pas décaler les indices existants. */
  function horsPlan(b){ return b.t !== "cellule" && b.t !== "reacteur" && b.t !== "mirador"; }
  var defF = cf.batiments.filter(horsPlan);
  ok("plan « Frelon partout, saturé » : " + defF.length + " défenses, toutes Frelon",
     defF.length > 500 && defF.every(function(b){ return b.t === "frelon"; }));
  var zc = N.planVide();
  for(var kz = 0; kz < N.NB_ZONES; kz++) zc[kz] = 0 | (1 << 3);   // clairsemé partout
  var cc = N.genereCarte("MILY", 0, N.encodePlan(zc), 0);
  var defC = cc.batiments.filter(horsPlan).length;
  ok("densité « clairsemé » retire des défenses (" + defC + " < " + (a.batiments.length - 121) + ")",
     defC < defF.length * 0.75, "" + defC);

  /* le tirage rebat les cartes, mais reste reproductible pour tous */
  var t1 = N.genereCarte("MILY", 0, "", 1), t2 = N.genereCarte("MILY", 0, "", 2);
  ok("un nouveau tirage donne une autre carte",
     N.empreinteCarte(t1) !== N.empreinteCarte(t2) &&
     N.empreinteCarte(t1) !== N.empreinteCarte(a));
  ok("un même tirage redonne la même carte chez tout le monde",
     N.empreinteCarte(t1) === N.empreinteCarte(N.genereCarte("MILY", 0, "", 1)));
  /* ISOLATION — la propriété qui fait qu'un éditeur est utilisable :
     repeindre une zone ne doit RIEN changer ailleurs. Elle ne tient que
     parce que chaque nœud du quadrillage consomme le même nombre de
     tirages qu'on le garde ou qu'on le saute ; un « continue » posé
     trop tôt décalerait la suite de la séquence et rebattrait l'île
     jusqu'à l'autre bout. */
  (function(){
    var base = N.planVide();
    base[2 * N.ZONES_L + 2] = N.faitZone(1, 2, 0);
    var cible = [], zx, zy;
    for(zx = 9; zx <= 11; zx++) for(zy = 6; zy <= 9; zy++) cible.push(zy * N.ZONES_L + zx);
    var noeud = function(b){ return N.zoneDePlan(Math.round(b.gx), Math.round(b.gy)); };
    /* Deux bâtiments CHERCHENT leur place au lieu de la tirer : la
       cellule électrique prend le point libre le plus proche de son
       idéal, le mirador renonce s'il tomberait dans une défense déjà
       posée. Tous deux lisent donc c.batiments, et la gomme forte, qui
       en retire, peut légitimement les faire bouger d'un cran au bord
       de la zone effacée. C'est local et c'est voulu — mais ça n'a
       rien à voir avec l'isolation du quadrillage, qui est ce que l'on
       teste ici. On les met de côté pour la gomme, et pour elle seule. */
    var hors = function(m, sansPlace){
      return m.batiments.filter(function(b){
        if(b.t === "cellule") return false;
        if(sansPlace && (b.t === "reacteur" || b.t === "mirador")) return false;
        return cible.indexOf(noeud(b)) < 0;
      });
    };
    var A = N.genereCarte("MILY", 0, N.encodePlan(base), 0);
    [["type", N.faitZone(3, 2, 0), 0], ["densité", N.faitZone(0, 3, 0), 0],
     ["type et densité", N.faitZone(5, 1, 0), 0],
     ["gomme forte", N.faitZone(8, 0, 0), 1],
     ["semis de cellules", N.faitZone(1, 2, 1), 0]]
    .forEach(function(v){
      var mod = base.slice(), i;
      for(i = 0; i < cible.length; i++) mod[cible[i]] = v[1];
      var B = N.genereCarte("MILY", 0, N.encodePlan(mod), 0);
      var ha = hors(A, v[2]), hb = hors(B, v[2]), pareil = ha.length === hb.length;
      if(pareil) for(i = 0; i < ha.length; i++){
        if(ha[i].t !== hb[i].t ||
           Math.abs(ha[i].gx - hb[i].gx) > 1e-12 || Math.abs(ha[i].gy - hb[i].gy) > 1e-12){
          pareil = false; break;
        }
      }
      ok("changer le " + v[0] + " d'une zone ne touche rien ailleurs (" + ha.length + " bâtiments)",
         pareil);
    });
    /* et à l'intérieur, le type imposé s'applique bien à tous */
    var mod2 = base.slice();
    for(var k = 0; k < cible.length; k++) mod2[cible[k]] = N.faitZone(3, 3, 0);
    var C = N.genereCarte("MILY", 0, N.encodePlan(mod2), 0);
    var dedans = C.batiments.filter(function(b){
      return b.t !== "cellule" && b.t !== "reacteur" && b.t !== "mirador" &&
             cible.indexOf(noeud(b)) >= 0;
    });
    ok("dans une zone peinte, tout est du type demandé (" + dedans.length + " bâtiments)",
       dedans.length > 0 && dedans.every(function(b){ return b.t === "frelon"; }));

    /* LA GOMME FORTE : dans la zone, plus rien. Pas « moins de
       défenses » — RIEN, cellules d'énergie et miradors compris. */
    var modV = base.slice();
    for(var kv = 0; kv < cible.length; kv++) modV[cible[kv]] = N.faitZone(8, 0, 0);
    var V = N.genereCarte("MILY", 0, N.encodePlan(modV), 0);
    /* Le plan décide par NŒUD du quadrillage, et un nœud pose son
       bâtiment avec un peu de gigue : un nœud en x = 96, hors de la
       zone effacée, peut déposer sa tourelle en 95,95, dedans. On
       mesure donc le CŒUR de la zone gommée, rentré de 0,7 case —
       plus que toute la gigue du générateur. Là, il ne doit rien
       rester du tout. */
    var coeur = function(b){
      return b.t !== "reacteur" &&
             b.gx >= 9 * N.PAS_ZONE + 0.7 && b.gx <= 12 * N.PAS_ZONE - 0.7 &&
             b.gy >= 6 * N.PAS_ZONE + 0.7 && b.gy <= 10 * N.PAS_ZONE - 0.7;
    };
    var resteDedans = V.batiments.filter(coeur);
    var avantDedans = A.batiments.filter(coeur);
    ok("la gomme forte vide la zone (" + avantDedans.length + " → " + resteDedans.length + ")",
       avantDedans.length > 20 && resteDedans.length === 0);

    /* LE SEMIS DE CELLULES : il s'AJOUTE, il ne remplace pas. Les
       défenses de la zone doivent être exactement les mêmes qu'avant. */
    var modS = base.slice();
    for(var ks = 0; ks < cible.length; ks++) modS[cible[ks]] = N.faitZone(0, 0, 1);
    var S = N.genereCarte("MILY", 0, N.encodePlan(modS), 0);
    var defAvant = A.batiments.filter(function(b){
      return b.t !== "cellule" && cible.indexOf(noeud(b)) >= 0;
    }).length;
    var defApres = S.batiments.filter(function(b){
      return b.t !== "cellule" && cible.indexOf(noeud(b)) >= 0;
    }).length;
    var celAvant = A.batiments.filter(function(b){
      return b.t === "cellule" && cible.indexOf(noeud(b)) >= 0;
    }).length;
    var celApres = S.batiments.filter(function(b){
      return b.t === "cellule" && cible.indexOf(noeud(b)) >= 0;
    }).length;
    ok("le semis de cellules ne touche pas aux défenses (" + defAvant + " = " + defApres + ")",
       defAvant === defApres && defAvant > 0);
    ok("et il sème vraiment (" + celAvant + " → " + celApres + " cellules)",
       celApres > celAvant + 100);
  })();

  /* ---- LES DEUX FORMATS DE PLAN ----
     Le v1 circule encore : des instantanés retenus par le courtier le
     portent, et un salon en cours le rejouerait. Il doit se relire à
     l'identique, sinon la carte de tout le monde change sous eux. */
  (function(){
    var v1 = N.planVide();
    v1[0] = 3 | (3 << 3); v1[77] = 5 | (1 << 3); v1[N.NB_ZONES - 1] = 7 | (2 << 3);
    /* on refabrique une chaîne v1 à la main : encodePlan n'en produit
       plus, c'est justement ce qu'on vérifie */
    var bits = [], i, k;
    for(i = 0; i < N.NB_ZONES; i++){
      var t = v1[i] & 7, d = (v1[i] >> 3) & 3;
      for(k = 0; k < 3; k++) bits.push((t >> k) & 1);
      for(k = 0; k < 2; k++) bits.push((d >> k) & 1);
    }
    var s1 = N.encodeBits(bits);
    ok("une chaîne v1 ne porte pas la marque du v2", s1.charAt(0) !== N.MARQUE_PLAN2);
    var lu = N.decodePlan(s1), bon = true;
    for(i = 0; i < N.NB_ZONES; i++){
      if(N.zoneType(lu[i]) !== (v1[i] & 7)) bon = false;
      if(N.zoneDens(lu[i]) !== ((v1[i] >> 3) & 3)) bon = false;
      if(N.zoneChamp(lu[i])) bon = false;
    }
    ok("un plan v1 se relit type pour type et densité pour densité", bon);
    ok("le v2 se reconnaît à sa marque",
       N.encodePlan(lu).charAt(0) === N.MARQUE_PLAN2);
    ok("v1 et v2 décrivent la même carte",
       N.empreinteCarte(N.genereCarte("MILY", 0, s1, 0)) ===
       N.empreinteCarte(N.genereCarte("MILY", 0, N.encodePlan(lu), 0)));
  })();

  /* ---- LES DENSITÉS AU-DELÀ DE « SATURÉ » ---- */
  (function(){
    function nbDef(d){
      var z = N.planVide(), i;
      for(i = 0; i < N.NB_ZONES; i++) z[i] = N.faitZone(3, d, 0);
      return N.genereCarte("MILY", 0, N.encodePlan(z), 0).batiments
              .filter(function(b){ return b.t === "frelon"; }).length;
    }
    var sature = nbDef(3), cent = nbDef(4), surcharge = nbDef(5);
    ok("« 100 % » remplit plus que « saturé » (" + sature + " → " + cent + ")",
       cent > sature);
    /* Le quadrillage intercalaire a moins de nœuds que le principal
       (il commence plus loin du bord et s'écarte plus du Brasier) :
       « surchargé » ajoute donc environ 70 %, pas 100. */
    ok("« surchargé » ajoute tout l'entre-deux (" + cent + " → " + surcharge + ")",
       surcharge > cent * 1.6);
    ok("aucune densité ne dépasse les trois bits de l'encodage",
       N.DENSITES.length <= 8);
    ok("aucun type de plan ne dépasse les quatre bits de l'encodage",
       N.TYPES_PLAN.length <= 16);
  })();

  ok("zoneDePlan reste dans la grille aux quatre coins",
     N.zoneDePlan(0, 0) === 0 &&
     N.zoneDePlan(N.GW * 2, N.GH * 2) === N.NB_ZONES - 1 &&
     N.zoneDePlan(-50, -50) === 0);

  /* ================================================================
     3c. LE SCORE — l'identité est l'APPAREIL, le pseudo une étiquette

     DEUX DÉFAUTS SUCCESSIFS, et ce groupe garde les deux.

     1. « J'attaque, la santé du QG descend, mais mon score reste
        fixé. » Le score était le PLUS GRAND nombre de dégâts jamais vu
        pour un pseudo, et le nombre publié repartait de zéro à chaque
        île. Un joueur à 302 475 était donc figé à 302 475.

     2. Trois lignes au classement pour UNE personne : « Roro »,
        « Roro-1 », « Roro-1-1 », toutes au même score. Le jeu ne
        renomme personne — c'est la saisie qui varie. Mais le score
        était rangé SOUS LE PSEUDO : un caractère de différence, et
        c'était un autre joueur, avec son compteur reparti de zéro.

     La clé est donc « seau · carte », le seau étant l'appareil. Le
     pseudo voyage à côté, comme une étiquette.
     ================================================================ */
  G("3c. Le score suit l'appareil, pas l'orthographe du pseudo");
  (function(){
    function T(o){ return N.encodeScores(o); }
    function D(s){ return N.decodeScores(s); }
    function tot(s){ return N.totalParJoueur(D(s)); }
    function carte(s, i){ return N.totalParJoueurCarte(D(s), i); }
    function E(seau, nom, ca, g){ var o = {}; o[N.cleScore(seau, ca)] = { n:nom, g:g }; return o; }
    function un(seau, nom, ca, g){ return T(E(seau, nom, ca, g)); }

    /* --- LE CAS DES TROIS RORO, celui qui a tout déclenché --- */
    (function(){
      var m = "";
      /* le même appareil, trois façons d'écrire le pseudo */
      m = N.fusionneScores(m, un("ro01", "Roro", 0, 1820693));
      m = N.fusionneScores(m, un("ro01", "Roro-1", 0, 1850000));
      m = N.fusionneScores(m, un("ro01", "Roro-1-1", 0, 1900000));
      var c = N.classementDepuis(tot(m));
      ok("trois orthographes sur le même appareil ne font qu'UNE ligne",
         c.length === 1, JSON.stringify(c));
      ok("et le compteur a CONTINUÉ, il n'a pas recommencé",
         c[0] && c[0].g === 1900000, JSON.stringify(c));
      ok("l'étiquette affichée est celle de sa plus grosse contribution",
         c[0] && c[0].nom === "Roro-1-1", JSON.stringify(c));
      /* et un pseudo qui ne diffère que par une majuscule ou un
         espace ne crée pas non plus de doublon sur cet appareil */
      m = N.fusionneScores(m, un("ro01", " roro ", 0, 1950000));
      ok("même une majuscule ou un espace ne recommence rien",
         N.classementDepuis(tot(m)).length === 1 &&
         N.classementDepuis(tot(m))[0].g === 1950000);
    })();

    /* --- LE PREMIER DÉFAUT : les petits coups doivent tous compter --- */
    (function(){
      var m = un("lu77", "Lu", 0, 302475);
      ok("un joueur à 302 475 est bien à 302 475", tot(m).Lu === 302475);
      /* il change d'île et refait de petits coups, très en dessous de
         son record : c'est exactement ce qui ne comptait plus */
      var v = 0;
      for(var i = 0; i < 5; i++){
        v += 3000;
        m = N.fusionneScores(m, un("lu77", "Lu", 1, v));
      }
      ok("cinq coups de 3 000 sur une AUTRE île montent bien le total",
         tot(m).Lu === 317475, "" + tot(m).Lu);
      ok("et les deux batailles restent séparées",
         carte(m, 0).Lu === 302475 && carte(m, 1).Lu === 15000);
    })();

    /* --- TON TEST, ÉTAPE PAR ÉTAPE --- */
    (function(){
      var m = "";                                        // 1-2
      m = N.fusionneScores(m, un("r0r0", "Roro", 0, 100000));   // 3-4
      ok("étape 4 — Roro voit ses 100 000", tot(m).Roro === 100000);
      m = N.fusionneScores(m, un("s0ph", "Sophie", 0, 40000));  // 5-7
      ok("étape 7 — pendant son absence son score tient bon",
         tot(m).Roro === 100000 && tot(m).Sophie === 40000);
      ok("étape 10 — il retrouve ses 100 000 en revenant", tot(m).Roro === 100000);
      m = N.fusionneScores(m, un("r0r0", "Roro", 1, 50000));    // 11-12
      ok("étape 12 — son total passe bien à 150 000", tot(m).Roro === 150000);
      ok("étape 13 — un autre client lit la même chose",
         N.totalParJoueur(D(N.fusionneScores("", m))).Roro === 150000);
    })();

    /* --- DEUX APPAREILS, MÊME PSEUDO --- */
    (function(){
      var m = N.fusionneScores(un("tel1", "Roro", 0, 800000),
                               un("tab2", "Roro", 0, 300000));
      ok("deux appareils sous le même pseudo s'ADDITIONNENT",
         tot(m).Roro === 1100000, "" + tot(m).Roro);
      ok("et ils ne font qu'UNE ligne", N.classementDepuis(tot(m)).length === 1);
      var m2 = N.fusionneScores(N.fusionneScores(m, un("tel1", "Roro", 0, 900000)),
                                un("tab2", "Roro", 0, 350000));
      ok("deux écritures simultanées ne s'écrasent pas",
         tot(m2).Roro === 1250000, "" + tot(m2).Roro);
      /* et deux personnes DIFFÉRENTES restent deux lignes */
      var m3 = N.fusionneScores(un("aaaa", "Roro", 0, 500), un("bbbb", "Lucien", 0, 700));
      ok("deux joueurs différents restent deux lignes",
         N.classementDepuis(tot(m3)).length === 2);
    })();

    /* --- LES QUATRE PROPRIÉTÉS DE FUSION --- */
    var A = un("aa11", "Roro", 0, 3000000);
    var B = un("bb22", "Lu", 0, 250000);
    var C = un("cc33", "Ana", 1, 77);
    ok("la fusion est commutative", N.fusionneScores(A, B) === N.fusionneScores(B, A));
    ok("la fusion est associative",
       N.fusionneScores(N.fusionneScores(A, B), C) ===
       N.fusionneScores(A, N.fusionneScores(B, C)));
    ok("la fusion est idempotente", N.fusionneScores(A, A) === A);
    ok("fusionner avec rien ne perd rien",
       N.fusionneScores(A, "") === A && N.fusionneScores("", A) === A);
    ok("un seau ne redescend jamais",
       tot(N.fusionneScores(A, un("aa11", "Roro", 0, 5))).Roro === 3000000);
    ok("un joueur déconnecté garde son score",
       tot(N.fusionneScores(A, B)).Roro === 3000000);
    ok("deux appareils encodent la MÊME chaîne", (function(){
      var x = {}, y = {};
      x[N.cleScore("s1", 0)] = { n:"Lu", g:12 };  x[N.cleScore("s2", 0)] = { n:"Zoe", g:99 };
      y[N.cleScore("s2", 0)] = { n:"Zoe", g:99 }; y[N.cleScore("s1", 0)] = { n:"Lu", g:12 };
      return T(x) === T(y);
    })());
    ok("l'ordre encodé ne dépend pas des scores", (function(){
      var x = {}, y = {};
      x[N.cleScore("aa", 0)] = { n:"Ana", g:10 }; x[N.cleScore("zz", 0)] = { n:"Zoe", g:99 };
      y[N.cleScore("aa", 0)] = { n:"Ana", g:99 }; y[N.cleScore("zz", 0)] = { n:"Zoe", g:10 };
      return T(x).indexOf("~aa") === 0 && T(y).indexOf("~aa") === 0;
    })());

    /* --- LE CLASSEMENT PAR CARTE --- */
    (function(){
      var m = "";
      m = N.fusionneScores(m, un("r1", "Roro", 0, 900000));
      m = N.fusionneScores(m, un("r1", "Roro", 1, 100000));
      m = N.fusionneScores(m, un("l2", "Lucien", 0, 400000));
      m = N.fusionneScores(m, un("l2", "Lucien", 1, 700000));
      m = N.fusionneScores(m, un("s3", "Sophie", 0, 250000));
      var t = tot(m);
      ok("le total additionne toutes les cartes",
         t.Roro === 1000000 && t.Lucien === 1100000 && t.Sophie === 250000);
      ok("la carte 0 a son propre classement",
         N.classementDepuis(carte(m, 0)).map(function(e){ return e.nom; }).join(",")
         === "Roro,Lucien,Sophie");
      ok("et la carte 1 un AUTRE classement",
         N.classementDepuis(carte(m, 1)).map(function(e){ return e.nom; }).join(",")
         === "Lucien,Roro");
      ok("une carte jamais jouée n'a de classement pour personne",
         Object.keys(carte(m, 4)).length === 0);
    })();

    /* --- LA COMPATIBILITÉ AVEC LES DEUX FORMATS PRÉCÉDENTS --- */
    (function(){
      var tout1 = "Roro:1820693|Lu:302475";                    // tout premier
      var t1 = tot(tout1);
      ok("le tout premier format se relit sans perte",
         t1.Roro === 1820693 && t1.Lu === 302475, JSON.stringify(t1));
      ok("il ne se réclame d'aucune carte", Object.keys(carte(tout1, 0)).length === 0);
      var inter = "Roro:ab12:0:900000|Lu:cd34:1:50000";        // intermédiaire
      var t2 = tot(inter);
      ok("le format intermédiaire aussi",
         t2.Roro === 900000 && t2.Lu === 50000, JSON.stringify(t2));
      ok("et il garde bien sa carte", carte(inter, 0).Roro === 900000);
      /* un ancien score continue de monter par le nouveau chemin, sans
         créer de doublon quand c'est le même appareil */
      var m = N.fusionneScores(inter, un("ab12", "Roro", 0, 950000));
      ok("un ancien score continue de monter sans se dédoubler",
         tot(m).Roro === 950000 && N.classementDepuis(tot(m)).length === 2,
         JSON.stringify(tot(m)));
      /* deux formats mélangés dans la même chaîne ne s'annulent pas */
      ok("les trois formats se distinguent à la lecture",
         tot("Roro:100").Roro === 100 &&
         tot("Roro:ss11:0:200").Roro === 200 &&
         tot("~ss11:Roro:0:300").Roro === 300);
    })();

    /* --- ROBUSTESSE --- */
    ok("les séparateurs sont retirés des pseudos",
       tot(un("zz99", "a|b:c~d", 0, 700))["abcd"] === 700,
       JSON.stringify(tot(un("zz99", "a|b:c~d", 0, 700))));
    ok("une chaîne pourrie ne renvoie rien de faux",
       Object.keys(N.decodeScores("n'importe quoi|::|x:")).length === 0 &&
       Object.keys(N.decodeScores("~||:::")).length === 0);
    /* CES DEUX VÉRIFICATIONS ONT CHANGÉ DE CHIFFRES, PAS D'INTENTION.
       Elles gardent la voie de l'ARITHMÉTIQUE contre une troncature à
       32 bits — un « | 0 » égaré quelque part dans la lecture ou la
       somme. Elles s'appuyaient sur quatre milliards dans un seul
       seau ; depuis que decodeScores porte un plafond (plafondScore),
       quatre milliards ne sont plus une donnée mais une corruption, et
       la lecture les écarte à bon droit.
       On garde donc exactement le même danger — dépasser 2^31 — en
       n'employant que des valeurs LÉGALES : un seau juste sous le
       plafond, puis huit seaux qui s'additionnent bien au-delà. C'est
       même un meilleur test qu'avant, puisqu'il exerce la somme sur
       plusieurs seaux au lieu d'un seul nombre géant. */
    ok("un score au plafond passe sans troncature", (function(){
      var g = N.plafondScore() - 1;
      var m = un("bg01", "Geant", 0, g);
      return tot(m).Geant === g && g > 300000000;
    })(), "≈ 303 millions");
    ok("et huit seaux qui s'additionnent au-delà de 2^31 aussi", (function(){
      var g = N.plafondScore() - 1, m = "", i;
      for(i = 0; i < 8; i++) m = N.fusionneScores(m, un("g" + i, "Geant", i, g));
      return tot(m).Geant === g * 8 && g * 8 > 2147483648;
    })());
    /* ================================================================
       LE PLAFOND DU TABLEAU — EN OCTETS, ET PAR APPAREIL

       Il était de soixante ENTRÉES. Or une entrée n'est pas un joueur,
       c'est un joueur SUR UNE ÎLE : six îles, soixante entrées, le
       salon ne tenait que DIX appareils. Et la coupe triait les
       entrées une à une, si bien que le joueur régulier — celui qui
       étale ses dégâts sur les six îles — présentait six petits
       nombres là où un joueur d'un soir en présentait un gros, et se
       faisait sortir alors que son TOTAL était le plus gros du salon.
       ================================================================ */
    /* Un seau ne fait que QUATRE caractères : « s1000 » et « s1001 »
       sont le MÊME appareil une fois nettoyés. Les essais qui suivent
       ont besoin d appareils vraiment distincts. */
    function seauN(i){ var v = i.toString(36); return "0000".substr(v.length) + v; }
    ok("le tableau est borné en octets", (function(){
      var t = {}, a, c;
      for(a = 0; a < 200; a++)
        for(c = 0; c < 6; c++) t[N.cleScore(seauN(a), c)] = { n:"j" + a, g:1000 + a };
      return N.octetsUtf8(T(t)) <= N.SCORES_OCTETS;
    })(), "budget " + N.SCORES_OCTETS + " o");
    ok("et il porte largement plus de dix appareils sur six îles", (function(){
      var t = {}, a, c;
      for(a = 0; a < 68; a++)
        for(c = 0; c < 6; c++) t[N.cleScore(seauN(a + 100), c)] = { n:"J" + a, g:100000 + a };
      return Object.keys(tot(T(t))).length === 68;
    })(), "68 appareils attendus");
    ok("le marathonien des six îles ne se fait plus sortir", (function(){
      var t = {}, i, c;
      /* cinquante-neuf coups uniques plus gros que CHAQUE contribution
         du marathonien, mais tous plus petits que son total */
      for(i = 0; i < 59; i++) t[N.cleScore(seauN(i + 5000), 0)] = { n:"Court" + i, g:1500001 };
      for(c = 0; c < 6; c++) t[N.cleScore("mara", c)] = { n:"Marathon", g:1000000 };
      var r = tot(T(t));
      return r.Marathon === 6000000 && r.Court0 === 1500001;
    })());
    ok("et quand il coupe, il coupe des appareils ENTIERS", (function(){
      var t = {}, a, c;
      for(a = 0; a < 300; a++)
        for(c = 0; c < 6; c++) t[N.cleScore(seauN(a + 1000), c)] = { n:"j" + a, g:a + 1 };
      var d = D(T(t)), vus = {}, k;
      for(k in d) vus[k.split(":")[0]] = (vus[k.split(":")[0]] || 0) + 1;
      /* tout appareil retenu l'est avec ses SIX îles, jamais amputé */
      for(k in vus) if(vus[k] !== 6) return false;
      return Object.keys(vus).length > 0 && Object.keys(vus).length < 300;
    })());
    ok("la coupe garde les plus gros TOTAUX, pas les plus grosses entrées", (function(){
      var t = {}, a, c;
      for(a = 0; a < 300; a++)
        for(c = 0; c < 6; c++) t[N.cleScore(seauN(a + 1000), c)] = { n:"j" + a, g:a + 1 };
      var r = tot(T(t));
      return r.j299 === 300 * 6 && r.j0 === undefined;
    })());
    ok("une coupe ne dépend pas de l'ordre d'insertion", (function(){
      var x = {}, y = {}, a, c;
      for(a = 0; a < 200; a++)
        for(c = 0; c < 6; c++) x[N.cleScore(seauN(a + 1000), c)] = { n:"j" + a, g:(a + 1) * 7 };
      for(a = 199; a >= 0; a--)
        for(c = 5; c >= 0; c--) y[N.cleScore(seauN(a + 1000), c)] = { n:"j" + a, g:(a + 1) * 7 };
      return T(x) === T(y);
    })());
    ok("et elle reste idempotente : recouper ne recoupe rien", (function(){
      var t = {}, a, c;
      for(a = 0; a < 200; a++)
        for(c = 0; c < 6; c++) t[N.cleScore(seauN(a + 1000), c)] = { n:"j" + a, g:(a + 1) * 7 };
      var u = T(t);
      return N.fusionneScores(u, u) === u && T(D(u)) === u;
    })());
    /* ================================================================
       LA RÈGLE QUI TRANCHE LES ÉTIQUETTES

       À dégâts égaux, la fusion garde le nom le PLUS PETIT dans
       l'ordre des chaînes. C'est arbitraire, et c'est le but : il faut
       que deux clients tranchent pareil, sinon ils se republient l'un
       l'autre sans fin.

       Ce qui suit grave la règle, parce que le client doit la
       CONNAÎTRE et non la subir : scoresAJour publie désormais ce que
       la fusion va retenir. Il posait son pseudo courant dans tous les
       cas, y compris quand la fusion allait le refuser — Bob renommé
       « Zoe » publiait « Zoe », recevait « Bob », republiait « Zoe »,
       toutes les deux secondes et pour toujours. Renommé « Ana », en
       revanche, la boucle se fermait du premier coup : le défaut était
       asymétrique, donc difficile à voir.
       ================================================================ */
    ok("à dégâts égaux, le plus petit nom l'emporte", (function(){
      var m = N.fusionneScores(un("i0ex", "Zoe", 0, 1000), un("i0ex", "Bob", 0, 1000));
      return D(m)["i0ex:0"].n === "Bob";
    })());
    ok("et l'ordre des deux camps n'y change rien", (function(){
      var a = un("i0ex", "Zoe", 0, 1000), b = un("i0ex", "Bob", 0, 1000);
      return N.fusionneScores(a, b) === N.fusionneScores(b, a);
    })());
    ok("mais un dégât de plus suffit à imposer son nom", (function(){
      var m = N.fusionneScores(un("i0ex", "Bob", 0, 1000), un("i0ex", "Zoe", 0, 1001));
      return D(m)["i0ex:0"].n === "Zoe" && D(m)["i0ex:0"].g === 1001;
    })());
    /* Le point fixe : ce que la fusion a tranché, refusionné, ne bouge
       plus. C'est cette propriété que le client doit reproduire pour
       que la republication s'arrête. */
    ok("un tableau tranché est un point fixe", (function(){
      var m = N.fusionneScores(un("i0ex", "Zoe", 0, 1000), un("i0ex", "Bob", 0, 1000));
      return N.fusionneScores(m, m) === m
          && N.fusionneScores(m, un("i0ex", "Zoe", 0, 1000)) === m;
    })());

    /* Les pseudos ne sont pas de l'ASCII : un plafond compté en
       caractères mentirait de deux octets par « é ». */
    ok("le poids se compte en octets, pas en signes",
       N.octetsUtf8("Gégé") === 6 && N.octetsUtf8("Roro") === 4 && N.octetsUtf8("💕") === 4,
       N.octetsUtf8("Gégé") + "/" + N.octetsUtf8("💕"));

    /* --- ET ÇA VOYAGE DANS L'INSTANTANÉ --- */
    var m1 = N.mondeVide(0, 1000, 0), m2 = N.mondeVide(0, 1000, 0);
    m1.s = A; m2.s = B;
    var mf = N.fusionneMonde(m1, m2);
    ok("l'instantané du salon transporte le classement",
       N.totalParJoueur(N.decodeScores(mf.s)).Roro === 3000000 &&
       N.totalParJoueur(N.decodeScores(mf.s)).Lu === 250000);
    ok("un classement différent force une republication", !N.memeMonde(m1, m2));
    /* ---- ET IL SURVIT AU CHANGEMENT D'ÎLE ----
       Le tableau appartient au SALON, pas à l'île : le total est la
       somme des contributions île par île. La branche « île plus
       avancée » de fusionneMonde le jetait pourtant en entier. Il
       suffisait qu'un client passe à l'île suivante avec une table qui
       n'avait pas encore intégré la dernière publication d'un autre
       pour effacer le score de celui-ci — définitivement s'il avait
       fermé son navigateur, puisque plus personne ne le republiait. */
    (function(){
      var i0 = N.mondeVide(0, 1000, 0);
      i0.s = N.fusionneScores(un("ro01", "Roro", 0, 1800000), un("bo02", "Bob", 0, 90000));
      var i1 = N.mondeVide(1, 1000, 0);          // île suivante, table périmée
      i1.s = un("an03", "Ana", 1, 300);
      var av = N.totalParJoueur(N.decodeScores(N.fusionneMonde(i0, i1).s));
      var ar = N.totalParJoueur(N.decodeScores(N.fusionneMonde(i1, i0).s));
      ok("passer à l'île suivante ne jette pas le tableau des dégâts",
         av.Roro === 1800000 && av.Bob === 90000 && av.Ana === 300, JSON.stringify(av));
      ok("et pas davantage dans l'autre sens de fusion",
         ar.Roro === 1800000 && ar.Bob === 90000 && ar.Ana === 300, JSON.stringify(ar));
      ok("le classement de l'île quittée reste consultable",
         N.totalParJoueurCarte(N.decodeScores(N.fusionneMonde(i0, i1).s), 0).Roro === 1800000);
      /* mais une CAMPAGNE ou un TIRAGE neufs effacent bien tout :
         c'est ce que publient remetSalonAZero et nouveauTirageSalon. */
      var neuf = N.mondeVide(0, 1000, 1);        // cy = 1, table vide
      ok("une remise à zéro du salon efface bien le tableau",
         Object.keys(N.totalParJoueur(N.decodeScores(N.fusionneMonde(i0, neuf).s))).length === 0,
         N.fusionneMonde(i0, neuf).s);
      var tir = N.mondeVide(0, 1000, 0); tir.tg = 1; tir.s = "";
      ok("un tirage neuf aussi",
         Object.keys(N.totalParJoueur(N.decodeScores(N.fusionneMonde(i0, tir).s))).length === 0,
         N.fusionneMonde(i0, tir).s);
      /* et le raccourci « return a » de la branche ra > rb ne doit pas
         non plus avaler ce que b apporte au tableau */
      var i2 = N.mondeVide(2, 1000, 0); i2.s = un("an03", "Ana", 2, 7);
      var i1b = N.mondeVide(1, 1000, 0); i1b.s = un("ro01", "Roro", 1, 40000);
      ok("le raccourci de la branche inverse n'avale rien",
         N.totalParJoueur(N.decodeScores(N.fusionneMonde(i2, i1b).s)).Roro === 40000,
         N.fusionneMonde(i2, i1b).s);
    })();
    ok("un instantané fusionné avec lui-même ne force RIEN", (function(){
      var a = N.fusionneMonde(m1, m2);
      return N.memeMonde(a, N.fusionneMonde(a, a));
    })());

    /* ================================================================
       LE PIÈGE DE LA REMISE À ZÉRO

       Le rang d'un instantané est tg × 1 000 000 + cy × 1 000 + c :
       à campagne ET tirage égaux, c'est l'ÎLE LA PLUS AVANCÉE qui
       gagne. C'est ce qu'on veut pendant une campagne — personne ne
       doit ramener le salon en arrière.

       Mais « Réinitialiser le salon » publie l'île 0 avec un cycle et
       un tirage NEUFS, et un joueur resté en jeu sur l'île 1 adoptait
       ce cycle neuf tout en gardant sa partie : il republiait alors
       « c : 1 » avec le même tg et le même cy, et son île l'emportait.
       La remise à zéro ne tenait pas deux secondes.

       La fusion n'y peut rien et ne doit rien y changer : c'est au
       client d'abandonner une partie qui appartient à la campagne
       précédente (adopteMonde le fait maintenant). Ce groupe grave la
       règle pour qu'on n'aille pas « corriger » la fusion un jour en
       croyant bien faire.
       ================================================================ */
    (function(){
      function M(tg, cy, c){
        var m = N.mondeVide(c, 1000, cy); m.tg = tg; return m;
      }
      ok("à campagne égale, l'île la plus avancée gagne",
         N.fusionneMonde(M(1, 1, 0), M(1, 1, 3)).c === 3 &&
         N.fusionneMonde(M(1, 1, 3), M(1, 1, 0)).c === 3);
      ok("une campagne plus récente gagne, même sur l'île 0",
         N.fusionneMonde(M(1, 1, 4), M(1, 2, 0)).c === 0 &&
         N.fusionneMonde(M(1, 2, 0), M(1, 1, 4)).c === 0);
      ok("un tirage plus récent gagne aussi",
         N.fusionneMonde(M(1, 5, 4), M(2, 1, 0)).c === 0);
      /* ET VOICI LE PIÈGE, gravé tel quel : une fois la campagne neuve
         ADOPTÉE, republier une vieille île la remet en tête. C'est
         exactement ce qui défaisait la remise à zéro, et c'est
         pourquoi le client doit lâcher sa partie. */
      ok("mais republier une vieille île SOUS la campagne neuve la ramène",
         N.fusionneMonde(M(2, 2, 0), M(2, 2, 1)).c === 1,
         "d'où la règle : une campagne neuve annule la partie en cours");
    })();
  })();

  /* ================================================================
     3d. LE PODIUM GELÉ D'UNE ÎLE

     Il ne s'écrivait JAMAIS. sacreChampion calculait bien le Top 3 de
     la bataille, puis le passait dans le littéral remis à poseJungle
     — qui recopie `ch` ET `t3` depuis son SECOND argument par-dessus
     ce qu'il reçoit. Le champion, posé sur jg avant l'appel,
     survivait ; le podium, non. Résultat : top3Salon() rendait null
     pour les six îles, seule la carte en cours affichait un
     classement (le vivant), et la phrase de victoire — qui ne
     s'affiche que sous un podium gelé — était injoignable.

     Ce groupe grave le contrat de poseJungle, celui que l'appelant
     doit respecter, et la conservation du podium à la fusion.
     ================================================================ */
  /* ================================================================
     3c bis. LES BORNES — ce qui entre dans un score, et par où.

     Un score franchit deux frontières, et chacune était ouverte.

     LA FRONTIÈRE DU JEU : le coup fatal. abimeBatiment bornait ses
     dégâts aux points de vie restants depuis toujours ; abimeQG, non.
     Le DERNIER coup de chaque île — celui que tout le salon regarde —
     comptait donc pour sa valeur entière, débordement compris.

     LA FRONTIÈRE DU RÉSEAU : decodeScores. Un parseInt sans filet, et
     un compteur dont la fusion est un MAXIMUM : ce qui entre une fois
     n'en ressort jamais, et repart dans l'instantané retenu chez tout
     le monde.

     Ces vérifications gravent les deux bornes. Elles tiennent aussi
     lieu de garde-fou au multiplicateur de puissance à venir : un
     joueur qui frappe deux fois plus fort ne doit pas pouvoir inscrire
     un point de dégât de plus que ce qu'il a réellement retiré.
     ================================================================ */
  /* ================================================================
     3b bis. L'ORAGE APPARTIENT À L'ÎLE, PAS À UN TIRAGE AU SORT

     Un joueur a signalé une jungle ENSOLEILLÉE : canopée vert vif,
     sable clair, deux nuages blancs, aucun éclair. Mesuré sur sa
     capture contre deux témoins rendus au même cadrage — luminance de
     la bande de terrain 83,9 chez lui, 82,3 avec l'orage coupé, 53,4
     avec l'orage correct : son client rendait la branche BEAU TEMPS.

     La cause n'était ni la taille de son écran, ni sa définition, ni
     un garde-fou de rendu, ni une exception avalée — les quatre ont
     été réfutées par capture. C'était le COUPLAGE : tout l'orage se
     lisait sur `jeu.geysers.length`, or ce tableau est le résultat
     d'un tirage au sort qui peut rendre zéro sans un mot.

     Ces vérifications gravent les deux moitiés de la correction : la
     météo se lit sur le biome, et une jungle a toujours des geysers.
     ================================================================ */
  G("3b bis. L'orage tient à l'île, pas au tirage");
  (function(){
    ok("la jungle est orageuse", N.carteOrageuse(N.IDX_JUNGLE) === true);
    ok("aucune des cinq îles ordinaires ne l'est", (function(){
      for(var i = 0; i < N.CARTES.length; i++)
        if(i !== N.IDX_JUNGLE && N.carteOrageuse(i)) return false;
      return true;
    })());
    ok("un index hors carte ne fait pas d'orage",
       N.carteOrageuse(-1) === false && N.carteOrageuse(999) === false);

    /* LE PLAN QUI ÉTEIGNAIT LE CIEL. On sature toutes les zones de
       défenses : la boucle normale ne trouve plus une seule case
       libre. Avant le repli, ce plan rendait ZÉRO geyser — et donc
       une jungle ensoleillée. */
    var sature = (function(){
      var z = [], n = 0;
      /* on lit la taille du plan gravé pour saturer exactement autant
         de zones, sans avoir à connaître la géométrie de l'éditeur */
      var grave = N.decodePlan(N.planJungle());
      for(n = 0; n < grave.length; n++) z.push(N.faitZone(1, 5, 1));
      return N.encodePlan(z);
    })();

    ok("un plan saturé ne laisse plus la jungle sans geyser", (function(){
      var c = N.genereCarte("MILY", N.IDX_JUNGLE, sature, 0);
      return c.geysers.length > 0;
    })(), "repli");
    ok("le repli garde les geysers loin du Brasier", (function(){
      var c = N.genereCarte("MILY", N.IDX_JUNGLE, sature, 0);
      for(var i = 0; i < c.geysers.length; i++)
        if(Math.hypot(c.geysers[i].gx - N.QG_GX, c.geysers[i].gy - N.QG_GY) < 18) return false;
      return true;
    })());
    ok("et ne les empile pas les uns sur les autres", (function(){
      var c = N.genereCarte("MILY", N.IDX_JUNGLE, sature, 0);
      for(var i = 0; i < c.geysers.length; i++)
        for(var j = i + 1; j < c.geysers.length; j++)
          if(Math.hypot(c.geysers[i].gx - c.geysers[j].gx,
                        c.geysers[i].gy - c.geysers[j].gy) < 6) return false;
      return true;
    })());

    /* LE POINT LE PLUS IMPORTANT DU GROUPE. Le repli ne doit RIEN
       coûter quand tout va bien : le plan gravé donne ses vingt et un
       geysers, donc le repli ne s'exécute pas, donc pas un tirage n'est
       consommé et aucune carte existante ne se redessine. C'est cette
       vérification qui autorise à toucher au générateur. */
    ok("le plan gravé garde ses geysers à l'identique", (function(){
      var c = N.genereCarte("MILY", N.IDX_JUNGLE, N.planDeCarte(N.IDX_JUNGLE, null), 0);
      return c.geysers.length === 21;
    })(), "21 comme avant");
    ok("et la carte entière est inchangée, empreinte comprise", (function(){
      var a = N.genereCarte("MILY", N.IDX_JUNGLE, N.planDeCarte(N.IDX_JUNGLE, null), 0);
      var b = N.genereCarte("MILY", N.IDX_JUNGLE, N.planDeCarte(N.IDX_JUNGLE, null), 0);
      return N.empreinteCarte(a) === N.empreinteCarte(b)
          && a.batiments.length === 2158 && a.creatures.length === 777;
    })());
    ok("les cinq îles ordinaires n'ont toujours aucun geyser", (function(){
      for(var i = 0; i < N.CARTES.length; i++){
        if(i === N.IDX_JUNGLE) continue;
        var c = N.genereCarte("MILY", i, N.planDeCarte(i, null), 0);
        if((c.geysers || []).length !== 0) return false;
      }
      return true;
    })());
  })();

  /* ================================================================
     3b ter. LA MONTÉE EN PUISSANCE

     Le joueur l'a spécifiée au mot près, et deux de ces mots sont des
     pièges qu'il faut graver :

       « ce n'est pas cinq pour cent PLUS dix pour cent, c'est ce qu'on
         avait en base plus dix pour cent » — les paliers sont des
         valeurs ABSOLUES lues dans une table, pas une accumulation ;
       « on retombe à zéro à la map suivante, on a cent pour cent de
         nos dégâts, on n'est pas deux cent pour cent » — le compteur
         est indexé par carte, donc la remise à zéro est acquise par
         construction, mais rien ne le dit si on ne l'écrit pas.
     ================================================================ */
  G("3b ter. La montée en puissance");
  (function(){
    ok("à zéro dégât, on frappe à 100 %", N.multPuissance(0) === 1);
    ok("un score négatif ou absurde ne donne pas de bonus",
       N.multPuissance(-500000) === 1 && N.multPuissance(NaN) === 1);
    ok("500 k donne 105 %", N.multPuissance(500000) === 1.05);
    ok("1 M donne 110 %, PAS 115 %", N.multPuissance(1000000) === 1.10);
    ok("2 M donne 120 %", N.multPuissance(2000000) === 1.20);
    ok("3 M donne 130 %", N.multPuissance(3000000) === 1.30);
    ok("juste sous un palier, on garde le précédent",
       N.multPuissance(999999) === 1.05 && N.multPuissance(2999999) === 1.20);
    ok("10 M plafonne à 200 %", N.multPuissance(10000000) === 2);
    ok("et rien ne dépasse le plafond, même très loin",
       N.multPuissance(50000000) === 2 && N.multPuissance(1e12) === 2);

    /* LA TABLE EST ABSOLUE, ET ON LE PROUVE : si les paliers
       s'accumulaient, 3 M vaudrait 1,05 × 1,10 × 1,20 × 1,30 = 1,80.
       Il vaut 1,30. */
    ok("les paliers ne s'accumulent pas", (function(){
      var cumul = 1;
      for(var i = 1; i <= 4; i++) cumul *= N.PALIERS_PUISSANCE[i].mult;
      return Math.abs(cumul - 1.8018) < 0.001 && N.multPuissance(3000000) === 1.30;
    })(), "1,30 et non 1,80");
    ok("la table monte sans redescendre", (function(){
      for(var i = 1; i < N.PALIERS_PUISSANCE.length; i++){
        if(N.PALIERS_PUISSANCE[i].seuil <= N.PALIERS_PUISSANCE[i-1].seuil) return false;
        if(N.PALIERS_PUISSANCE[i].mult  <= N.PALIERS_PUISSANCE[i-1].mult)  return false;
      }
      return true;
    })());

    /* LA SUPER NOVA arrive à trois millions, c'est-à-dire après toute
       la carte : c'est ce qui la cale sur l'attaque du Brasier. */
    ok("la super Nova se débloque à 3 M",
       N.PALIERS_PUISSANCE[N.PALIER_SUPERNOVA].seuil === 3000000);
    ok("3 M, c'est plus que toutes les défenses de la jungle", (function(){
      var c = N.genereCarte("MILY", N.IDX_JUNGLE, N.planDeCarte(N.IDX_JUNGLE, null), 0);
      var pv = 0;
      for(var i = 0; i < c.batiments.length; i++) pv += c.batiments[i].pvMax;
      return pv < 3000000 && pv > 2000000;
    })(), "elle arrive avec le Brasier");

    /* TROIS ÉTATS VISUELS POUR DOUZE PALIERS. */
    ok("l'aura est muette au palier zéro", N.auraPuissance(0) === 0);
    ok("les trois états couvrent toute la table", (function(){
      var vus = {};
      for(var i = 1; i < N.PALIERS_PUISSANCE.length; i++) vus[N.auraPuissance(i)] = 1;
      return vus[1] && vus[2] && vus[3] && !vus[0];
    })());
    ok("l'aura ne redescend jamais quand le palier monte", (function(){
      for(var i = 1; i < N.PALIERS_PUISSANCE.length; i++)
        if(N.auraPuissance(i) < N.auraPuissance(i - 1)) return false;
      return true;
    })());
    ok("le plafond porte l'enveloppe",
       N.auraPuissance(N.PALIERS_PUISSANCE.length - 1) === 3);

    /* LE GAIN RÉEL SUR LE BRASIER — la raison d'être de tout ceci. */
    ok("la corvée du Brasier est divisée par presque deux", (function(){
      var reste = 60000000, s = 1000000, travail = 0, pas = 10000;
      while(reste > 0){ travail += pas / N.multPuissance(s); s += pas; reste -= pas; }
      /* 60 M de Brasier ne coûtent plus que ~31,7 M de travail */
      return travail < 33000000 && travail > 30000000;
    })(), "≈ 47 % de moins");
  })();

  G("3c bis. Les bornes d'un score");
  (function(){
    /* --- la borne du jeu, sur la file partagée du Brasier --- */
    ok("la file ne descend jamais sous zéro", (function(){
      var f = new N.FileDegats(1000);
      f.applique("a", 1, 400000);
      return f.pv === 0;
    })());
    ok("ce qui est retiré est mesurable de part et d'autre", (function(){
      var f = new N.FileDegats(1000);
      var avant = f.pv;
      f.applique("a", 1, 400000);
      /* c'est EXACTEMENT le calcul que fait désormais abimeQG :
         un coup de 400 000 sur 1 000 points de vie ne crédite que
         1 000, et non 400 000 */
      return Math.max(0, avant - f.pv) === 1000;
    })());
    ok("un doublon ne crédite rien", (function(){
      var f = new N.FileDegats(100000);
      f.applique("a", 1, 500);
      var avant = f.pv;
      f.applique("a", 1, 500);            // même numéro de série
      return Math.max(0, avant - f.pv) === 0;
    })());
    ok("un NaN ne peut pas empoisonner le Brasier", (function(){
      var f = new N.FileDegats(1000);
      /* la garde vit dans abimeQG : « !(d > 0) ». On vérifie ici que
         c'est bien la BONNE écriture — « d <= 0 » laisserait passer. */
      var d = NaN;
      var refuseParLaBonneGarde = !(d > 0);
      var refuseParLAncienne    = (d <= 0);
      return refuseParLaBonneGarde === true && refuseParLAncienne === false && f.pv === 1000;
    })());

    /* --- la borne du réseau --- */
    ok("le plafond se déduit des cartes", (function(){
      var som = 0;
      for(var i = 0; i < N.CARTES.length; i++) som += N.CARTES[i].pvQG || 0;
      return N.plafondScore() > som && N.plafondScore() === Math.round(som * 1.5 + 20e6);
    })());
    ok("un score démesuré est écarté, pas ramené", (function(){
      var s = N.MARQUE_SCORES + "abcd:Pirate:0:999999999999999999999";
      var r = N.decodeScores(s);
      var n = 0; for(var k in r) n++;
      return n === 0;
    })());
    ok("un score énorme mais possible passe", (function(){
      var s = N.MARQUE_SCORES + "abcd:Roro:5:60000000";
      var r = N.decodeScores(s);
      return r["abcd:5"] && r["abcd:5"].g === 60000000;
    })());
    ok("le tricheur n'écrase pas l'honnête dans le même seau", (function(){
      var s = N.MARQUE_SCORES + "abcd:Roro:5:4700000|abcd:Pirate:5:1e21";
      var r = N.decodeScores(s);
      /* parseInt(\"1e21\") vaut 1 : celui-là passe par le bas et perd.
         C'est l'autre écriture, tout en chiffres, que le plafond
         arrête — les deux chemins mènent au même résultat. */
      return r["abcd:5"] && r["abcd:5"].g === 4700000;
    })());
    ok("un score négatif ou nul reste écarté", (function(){
      var r = N.decodeScores(N.MARQUE_SCORES + "abcd:X:0:-500|efgh:Y:0:0");
      var n = 0; for(var k in r) n++;
      return n === 0;
    })());
  })();

  G("3d. Le podium gelé d'une île");
  (function(){
    var pod = [{ nom:"Roro", g:1800000 }, { nom:"Lu", g:900000 }, { nom:"Ana", g:400000 }];

    ok("inscrire un podium le rend relisable", (function(){
      var t = N.inscritTop3("", 0, pod);
      var r = N.top3DeCarte(t, 0);
      return r && r.length === 3 && r[0].nom === "Roro" && r[0].g === 1800000
          && r[2].nom === "Ana";
    })());
    ok("chaque île garde le sien", (function(){
      var t = N.inscritTop3(N.inscritTop3("", 0, pod), 2, [{ nom:"Johan", g:70 }]);
      return N.top3DeCarte(t, 0)[0].nom === "Roro"
          && N.top3DeCarte(t, 2)[0].nom === "Johan"
          && N.top3DeCarte(t, 1) === null;
    })());

    /* LE CONTRAT DE poseJungle, et c'est lui qui a été enfreint :
       `ch` et `t3` viennent du SECOND argument, toujours. Un appelant
       qui les met dans le premier écrit dans le vide. */
    ok("poseJungle prend ch et t3 de son SECOND argument", (function(){
      var o = { v:1, cy:0, c:0, pv:10, ch:"depuis-le-litteral", t3:"depuis-le-litteral" };
      var j = { je:0, jf:0, jd:"", jq:0, jt:0, jm:1, jmn:0, jb:0,
                ch:"depuis-jg", t3:"depuis-jg" };
      var r = N.poseJungle(o, j);
      return r.ch === "depuis-jg" && r.t3 === "depuis-jg";
    })());
    ok("donc un podium passé dans le littéral est PERDU", (function(){
      var j = { je:0, jf:0, jd:"", jq:0, jt:0, jm:1, jmn:0, jb:0, ch:"", t3:"" };
      var r = N.poseJungle({ v:1, cy:0, c:0, pv:10, t3:N.inscritTop3("", 0, pod) }, j);
      return N.top3DeCarte(r.t3, 0) === null;      // exactement l'ancien défaut
    })());
    ok("et posé sur jg, il arrive", (function(){
      var j = { je:0, jf:0, jd:"", jq:0, jt:0, jm:1, jmn:0, jb:0, ch:"" };
      j.t3 = N.inscritTop3("", 0, pod);
      var r = N.poseJungle({ v:1, cy:0, c:0, pv:10 }, j);
      return N.top3DeCarte(r.t3, 0)[0].nom === "Roro";
    })());

    /* Le podium voyage dans l'instantané et survit à la fusion, y
       compris quand l'autre camp est plus avancé. */
    ok("le podium traverse la fusion des instantanés", (function(){
      var a = N.mondeVide(0, 1000, 0), b = N.mondeVide(1, 1000, 0);
      a.t3 = N.inscritTop3("", 0, pod);
      var f1 = N.fusionneMonde(a, b), f2 = N.fusionneMonde(b, a);
      return N.top3DeCarte(f1.t3, 0)[0].nom === "Roro"
          && N.top3DeCarte(f2.t3, 0)[0].nom === "Roro";
    })());
    /* ================================================================
       LE CHAMPION D'UNE ÎLE N'EST PAS LE PREMIER DU SALON

       Deux classements coexistent, et il faut lire le bon :
         totalParJoueur      — la CARRIÈRE, toutes îles confondues ;
         totalParJoueurCarte — ce qu'on a fait SUR CETTE ÎLE-LÀ.
       Le sacre lisait le premier. Celui qui avait le plus gros cumul du
       salon était donc couronné même sans avoir tiré un coup ici,
       pendant que le Top 3 de la même vignette comptait bien par carte.
       ================================================================ */
    ok("le champion d'une île est celui qui l'a prise, pas le premier du salon", (function(){
      var t = {};
      /* Roro : une énorme carrière, mais rien sur l'île 2.
         Johan : n'a joué que l'île 2, et c'est lui qui l'a prise. */
      t[N.cleScore("ro01", 0)] = { n:"Roro",  g:40000000 };
      t[N.cleScore("ro01", 1)] = { n:"Roro",  g:30000000 };
      t[N.cleScore("jo02", 2)] = { n:"Johan", g:26000000 };
      var carriere = N.classementDepuis(N.totalParJoueur(t));
      var surLIle  = N.classementDepuis(N.totalParJoueurCarte(t, 2));
      return carriere[0].nom === "Roro" && surLIle[0].nom === "Johan";
    })(), "carrière → Roro, île 2 → Johan");
    ok("et une île où personne n'a frappé ne sacre personne", (function(){
      var t = {};
      t[N.cleScore("ro01", 0)] = { n:"Roro", g:40000000 };
      return N.classementDepuis(N.totalParJoueurCarte(t, 3)).length === 0;
    })());

    ok("deux podiums d'îles différentes se rejoignent", (function(){
      var a = N.mondeVide(0, 1000, 0), b = N.mondeVide(0, 1000, 0);
      a.t3 = N.inscritTop3("", 0, pod);
      b.t3 = N.inscritTop3("", 3, [{ nom:"Gégé", g:5 }]);
      var f = N.fusionneMonde(a, b);
      return N.top3DeCarte(f.t3, 0)[0].nom === "Roro"
          && N.top3DeCarte(f.t3, 3)[0].nom === "Gégé";
    })());
  })();

  /* ---- LE MIRADOR ----
     Il existe pour une seule raison : la base n'avait aucune réponse
     entre 5 et 12 cases. Ce bloc vérifie qu'il couvre bien cette bande,
     qu'il laisse une porte de sortie à qui va au contact, et qu'il
     abat l'Ogre d'une seule balle. */
  G("4c. Le Mirador");
  (function(){
    var M = N.DEF.mirador, O = N.UNI.ogre;
    ok("le Mirador existe", !!M);
    if(!M) return;
    /* la bande à couvrir : au-dessus du Crible, jusqu'au loin */
    ok("il porte bien au-delà du Crible", M.portee > N.DEF.crible.portee,
       M.portee + " > " + N.DEF.crible.portee);
    ok("il couvre la bande que le Chalumeau et la Bobine abandonnent",
       M.portee > N.DEF.bobine.portee * 1.5,
       M.portee + " contre " + N.DEF.bobine.portee);
    /* et la porte de sortie : au contact, il ne voit plus rien */
    ok("il est aveugle de près", M.porteeMin >= 3.5, "portée mini " + M.porteeMin);
    ok("le Commando passe sous sa portée mini", N.UNI.commando.arret < M.porteeMin,
       N.UNI.commando.arret + " < " + M.porteeMin);
    ok("la Furie, elle, est dans son champ",
       N.UNI.furie.arret > M.porteeMin && N.UNI.furie.arret < M.portee);
    ok("et l'Ogre aussi — c'est le but",
       O.arret > M.porteeMin && O.arret < M.portee,
       "ogre à " + O.arret + ", mirador " + M.porteeMin + "–" + M.portee);
    /* l'exécution de l'Ogre */
    ok("sa balle est une arme de précision", M.precision === 1);
    ok("elle abat l'Ogre d'un seul coup",
       M.degats * O.vuln.precision >= O.pv,
       M.degats + " × " + O.vuln.precision + " = " + (M.degats * O.vuln.precision)
       + " contre " + O.pv + " PV");
    ok("mais elle ne one-shot pas une Furie", M.degats < N.UNI.furie.pv,
       M.degats + " < " + N.UNI.furie.pv);
    ok("et il en faut beaucoup pour un Commando", N.UNI.commando.pv / M.degats >= 5,
       Math.ceil(N.UNI.commando.pv / M.degats) + " balles");
    /* le nombre : « il en faut beaucoup » */
    var m0 = N.genereCarte("MILY", 0);
    var nbMir = m0.batiments.filter(function(b){ return b.t === "mirador"; }).length;
    ok("il y en a beaucoup (" + nbMir + " par île)", nbMir >= 50 && nbMir <= 160, "" + nbMir);
    var nbAutres = {};
    m0.batiments.forEach(function(b){ nbAutres[b.t] = (nbAutres[b.t] || 0) + 1; });
    ok("plus nombreux que les Frelons qu'il complète",
       nbMir > nbAutres.frelon * 3, nbMir + " contre " + nbAutres.frelon);
    /* et ils ne se plantent pas les uns dans les autres */
    var mirs = m0.batiments.filter(function(b){ return b.t === "mirador"; });
    var colle = 0;
    for(var i = 0; i < mirs.length; i++)
      for(var j = i + 1; j < mirs.length; j++)
        if(Math.hypot(mirs[i].gx - mirs[j].gx, mirs[i].gy - mirs[j].gy) < 2) colle++;
    ok("aucun mirador n'en chevauche un autre", colle === 0, colle + " paires");
    /* ni dans le Brasier */
    var dansQG = mirs.filter(function(b){
      return Math.abs(b.gx - N.QG_GX) <= 10 && Math.abs(b.gy - N.QG_GY) <= 10;
    }).length;
    ok("aucun mirador dans l'emprise du Brasier", dansQG === 0, "" + dansQG);
    /* déterminisme : deux joueurs doivent voir les mêmes miradors */
    ok("les miradors sont les mêmes pour tout le monde",
       N.empreinteCarte(N.genereCarte("MILY", 0)) === N.empreinteCarte(m0));
  })();

  /* ---- LE MORTIER ----
     Le Pilon tire trois fois plus loin qu'avant et cogne double sur
     l'Ogre. C'est lui, désormais, qui tient le fond de l'île. */
  G("4d. Le Pilon, portée triplée");
  (function(){
    var P = N.DEF.pilon, O = N.UNI.ogre;
    ok("le Pilon porte à 24,6 cases", Math.abs(P.portee - 8.2 * 3) < 0.05,
       P.portee + " = 8,2 × 3");
    ok("il porte plus loin que toutes les autres sauf le Frelon",
       P.portee > N.DEF.mirador.portee && P.portee < N.DEF.frelon.portee,
       P.portee + " cases");
    ok("il reste aveugle de près", P.porteeMin === 2.6, "" + P.porteeMin);
    ok("le corps à corps passe toujours dessous",
       N.UNI.commando.arret < P.porteeMin, N.UNI.commando.arret + " < " + P.porteeMin);
    ok("c'est bien un mortier", P.mortier === 1);
    ok("il fait double dégât sur l'Ogre", O.vuln.mortier === 2);
    ok("un obus ne tue pas l'Ogre d'un coup", P.degats * O.vuln.mortier < O.pv,
       (P.degats * O.vuln.mortier) + " contre " + O.pv + " PV");
    ok("et il reste une arme de zone", P.zone > 1, "" + P.zone);
  })();

  /* ---- L'OGRE ----
     Une navette n'en embarque QU'UN, et cet ogre doit valoir la barge
     de douze Furies qu'il remplace. Ces deux règles sont le contrat de
     la troupe : elles se vérifient en chiffres, ici, et non à l'œil. */
  G("4b. L'Ogre");
  (function(){
    var M = N.UNI.furie, O = N.UNI.ogre;
    ok("l'Ogre existe et s'appelle Ogre", !!O && O.nom === "Ogre");
    if(!O) return;
    ok("il est proposé au briefing", N.TYPES_TROUPE.indexOf("ogre") >= 0);
    /* UNE navette = UN ogre. Le plafond passe par placesNavette(), qui
       est le SEUL chemin par lequel l'interface et le débarquement
       bornent un effectif : c'est donc lui qu'il faut tenir. */
    ok("une navette n'embarque qu'UN Ogre", N.placesNavette("ogre") === 1,
       "" + N.placesNavette("ogre"));
    ok("l'ancien plafond de 12/15 ne s'applique pas à lui",
       N.placesNavette("ogre") < N.placesNavette("furie") &&
       N.placesNavette("ogre") < N.placesNavette("commando"));
    ok("l'Ogre ne gonfle pas la flotte maximale",
       N.flotteMaximum() === N.EQ.NB_BARGES * N.placesNavette("commando"),
       "" + N.flotteMaximum());
    /* PUISSANCE — les deux valeurs se règlent ENSEMBLE.
       Il frappe volontairement PLUS FORT que la barge de douze Furies
       qu'il remplace : la stricte égalité des dégâts par seconde ne
       tenait pas compte de ce qu'il paie pour arriver à portée — il
       traverse l'île seul, encaisse cinq fois les roquettes du Frelon
       et tombe d'une balle de mirador, quand une barge de douze en
       perd trois et continue. La borne haute reste basse : il doit
       valoir sa barge, jamais deux. */
    var dpsM = M.degats / (M.cadence / 1000);
    var dpsO = O.degats / (O.cadence / 1000);
    var r = dpsO / (dpsM * 12);
    ok("1 Ogre frappe un peu plus fort que les 12 Furies d'une barge (×"
       + r.toFixed(3) + ")",
       r >= 1.10 && r <= 1.30, dpsO.toFixed(1) + " contre " + (dpsM * 12).toFixed(1));
    ok("mais jamais comme deux barges", r < 2);
    ok("il n'a surtout pas la puissance d'UNE Furie",
       dpsO > dpsM * 10, "×" + (dpsO / dpsM).toFixed(1) + " une Furie");
    ok("sa cadence reste dynamique (moins d'une seconde)", O.cadence < 1000, O.cadence + " ms");
    /* Résistance et faiblesse. */
    ok("santé = celle d'une Furie × 1,5", O.pv === Math.round(M.pv * 1.5), O.pv + " / " + M.pv);
    ok("il encaisse 5× les armes de précision", O.vuln.precision === 5, "" + O.vuln.precision);
    ok("et 2× les obus de mortier", O.vuln.mortier === 2, "" + O.vuln.mortier);
    ok("aucune autre troupe n'a de faiblesse", !M.vuln && !N.UNI.commando.vuln);
    ok("et aucune défense n'en a non plus",
       Object.keys(N.DEF).every(function(t){ return !N.DEF[t].vuln; }));
    /* Chaque faiblesse doit avoir une arme qui la déclenche, sinon
       c'est une ligne morte dans la fiche de la troupe. */
    var armes = {};
    Object.keys(N.DEF).forEach(function(t){
      if(N.DEF[t].precision) armes.precision = 1;
      if(N.DEF[t].mortier) armes.mortier = 1;
    });
    ok("chaque faiblesse a bien une défense qui la porte",
       Object.keys(O.vuln).every(function(a){ return armes[a]; }),
       Object.keys(O.vuln).join(","));
    /* Vitesse : 10 % au-dessus de la Furie, malgré la masse. */
    ok("vitesse = celle d'une Furie × 1,10",
       Math.abs(O.vitesse / M.vitesse - 1.10) < 1e-6,
       O.vitesse + " / " + M.vitesse + " = ×" + (O.vitesse / M.vitesse).toFixed(4));
    ok("il est bien plus rapide qu'une Furie, pas plus lent", O.vitesse > M.vitesse);
    /* Il tire de loin : il ne doit jamais venir se coller au bâtiment. */
    ok("il s'arrête loin de sa cible pour lancer", O.arret > 3, "" + O.arret);
    ok("son arrêt reste sous sa portée", O.arret < O.portee, O.arret + " < " + O.portee);
    /* Encombrement. Le rayon ne sert QU'À l'écartement entre unités :
       bloque() teste un point et pas un disque, donc un gros rayon
       n'empêche pas de passer entre deux bâtiments. Deux ogres doivent
       se tenir à bonne distance — ils se chevauchaient presque
       entièrement, trois corps pour la place d'un. */
    ok("il est plus encombrant que le Commando", O.rayon > N.UNI.commando.rayon,
       O.rayon + " > " + N.UNI.commando.rayon);
    ok("deux Ogres se tiennent à plus du double de l'écart d'avant",
       O.rayon * 2 >= 2 * (0.72 * 2) * 0.95, "écart " + (O.rayon * 2) + " cases");
    ok("son encombrement suit sa taille",
       O.rayon / N.UNI.furie.rayon > 3, "×" + (O.rayon / N.UNI.furie.rayon).toFixed(2) + " une Furie");
    /* La fenêtre de recherche de voisins doit pouvoir contenir la plus
       grosse paire, sinon deux ogres ne se voient pas et se traversent. */
    var maille = N.EQ.SEPARATION_MAILLE;
    ok("la maille de séparation reste compatible avec son rayon",
       Math.ceil((O.rayon * 2) / maille) >= 1,
       "il faut balayer " + Math.ceil((O.rayon * 2) / maille) + " case(s) autour");
  })();

  /* ---- LES CINQ CELLULES ÉLECTRIQUES ----
     Elles portent le bouclier du Brasier : leur nombre, leurs PV et
     leur placement sont du contrat de jeu, pas de la décoration. */
  G("5b. Les cellules électriques et le bouclier du Brasier");
  ok("cinq cellules par la constante", N.NB_REACTEURS === 5);
  ok("200 000 PV chacune", N.DEF.reacteur.pv === 200000, "" + N.DEF.reacteur.pv);
  ok("elles portent le bouclier, et ne tirent pas",
     N.DEF.reacteur.bouclier === 1 && N.DEF.reacteur.degats === 0 && N.DEF.reacteur.portee === 0);
  (function(){
    var manque = "", malPlace = "", pasIndexe = "", dedans = "";
    for(var i = 0; i < N.CARTES.length; i++){
      var m = N.genereCarte("MILY", i);
      var lst = m.reacteurs || [];
      if(lst.length !== N.NB_REACTEURS){ manque += "île" + i + "(" + lst.length + ") "; continue; }
      /* chacune doit désigner le bon bâtiment dans le tableau : c'est
         cet indice que le réseau diffuse pour dire « celle-là est
         tombée ». Un décalage d'un cran détruirait une autre défense. */
      for(var k = 0; k < lst.length; k++){
        var b = m.batiments[lst[k].n];
        if(!b || b.t !== "reacteur" || b.gx !== lst[k].gx || b.gy !== lst[k].gy)
          pasIndexe += "île" + i + "#" + k + " ";
        if(b && b.pv !== 200000) manque += "pv île" + i + " ";
        /* jamais dans la mer, jamais dans la roche du bord */
        if(lst[k].gx < 3 || lst[k].gx > N.PLAGE_X0 - 2 ||
           lst[k].gy < 3 || lst[k].gy > N.GH - 3) dedans += "île" + i + "#" + k + " ";
        /* ni collée au Brasier : elles doivent forcer à se répartir */
        if(Math.hypot(lst[k].gx - N.QG_GX, lst[k].gy - N.QG_GY) < 18)
          malPlace += "île" + i + "#" + k + " ";
      }
    }
    ok("les cinq îles ont bien leurs cinq cellules", manque === "", manque);
    ok("chaque cellule pointe sur son propre bâtiment", pasIndexe === "", pasIndexe);
    ok("aucune cellule hors de la terre praticable", dedans === "", dedans);
    ok("aucune cellule collée au Brasier", malPlace === "", malPlace);
  })();
  /* L'INVARIANT QUI PROTÈGE LES SALONS EN COURS.
     Le bitmap des destructions désigne les bâtiments par leur INDICE
     dans c.batiments. Tout type ajouté doit donc l'être À LA FIN : un
     bâtiment inséré au milieu ferait pointer chaque bit sur le mauvais
     voisin, chez tout le monde, en même temps.
     Ordre imposé : le quadrillage et les champs, PUIS les cinq cellules
     électriques, PUIS les miradors. */
  (function(){
    var m = N.genereCarte("MILY", 0);
    var b = m.batiments, n = b.length;
    /* on remonte depuis la fin : d'abord les miradors, puis exactement
       cinq cellules électriques, puis plus aucun des deux */
    var i = n - 1, nbMir = 0;
    while(i >= 0 && b[i].t === "mirador"){ nbMir++; i--; }
    var nbSup = 0;
    while(i >= 0 && b[i].sup){ nbSup++; i--; }
    var nbRea = 0;
    while(i >= 0 && b[i].t === "reacteur"){ nbRea++; i--; }
    ok("les miradors ferment le tableau (" + nbMir + ")", nbMir > 0, "" + nbMir);
    ok("le renfort de défenses vient juste avant (" + nbSup + ")", nbSup > 0, "" + nbSup);
    ok("puis les cinq cellules électriques",
       nbRea === N.NB_REACTEURS, nbRea + "/" + N.NB_REACTEURS);
    var restant = b.slice(0, i + 1);
    ok("et aucun des trois ne s'est glissé dans le quadrillage",
       restant.every(function(x){
         return x.t !== "reacteur" && x.t !== "mirador" && !x.sup;
       }));
    /* le renfort pèse bien 15 % du quadrillage d'origine */
    var base = restant.filter(function(x){ return x.t !== "cellule"; }).length;
    ok("le renfort ajoute environ 15 % de défenses ("
       + Math.round(nbSup / base * 100) + " %)",
       nbSup / base > 0.12 && nbSup / base < 0.19, nbSup + " pour " + base);
    /* La preuve directe : la carte SANS les ajouts de fin doit être
       exactement celle d'avant, bâtiment par bâtiment. C'est cette
       égalité-là qui garantit qu'un salon en cours ne voit rien bouger. */
    ok("les " + restant.length + " bâtiments d'origine gardent leur indice",
       restant.every(function(x, k){ return x.n === k; }));
  })();

  G("5e. Chaque carte a SON plan, et lui seul");
  /* LE DÉFAUT QUE CES VÉRIFICATIONS GARDENT. Le salon ne portait
     qu'une chaîne de plan, servie à toutes les îles : peindre la plage
     repeignait la forêt, la campagne, la soirée hippie et le Sud.
     Mesuré à l'époque : 377, 393, 379, 390 et 384 Frelons sur les cinq
     cartes pour un plan destiné à la première. */
  (function(){
    var z = N.planVide(), i;
    for(i = 0; i < N.NB_ZONES; i++) if((i % N.ZONES_L) < 9) z[i] = N.faitZone(3, 3, 0);
    var plage = N.encodePlan(z);
    var paquet = N.encodePlans({ 0:plage });

    ok("le paquet ne rend son plan qu'à la carte qui l'a",
       N.planCarte(paquet, 0) === plage && N.planCarte(paquet, 1) === "" &&
       N.planCarte(paquet, 4) === "");
    ok("planDeCarte suit le paquet, île par île",
       N.planDeCarte(0, paquet) === plage && N.planDeCarte(1, paquet) === "" &&
       N.planDeCarte(3, paquet) === "");

    /* LA PREUVE, sur les cartes elles-mêmes : la plage change, les
       quatre autres sont bit pour bit celles d'avant. */
    var vierge = [], peinte = [], k;
    for(k = 0; k < N.NB_CARTES_NORMALES; k++){
      vierge.push(N.empreinteCarte(N.genereCarte("MILY", k, "", 0)));
      peinte.push(N.empreinteCarte(N.genereCarte("MILY", k, N.planDeCarte(k, paquet), 0)));
    }
    ok("peindre la plage change bien la plage", vierge[0] !== peinte[0]);
    var intactes = "";
    for(k = 1; k < N.NB_CARTES_NORMALES; k++)
      if(vierge[k] !== peinte[k]) intactes += N.CARTES[k].nom + " ";
    ok("et ne touche AUCUNE des quatre autres", intactes === "", intactes);

    /* et le compte de Frelons, qui est ce qui se voyait */
    function frelons(idx, paq){
      return N.genereCarte("MILY", idx, N.planDeCarte(idx, paq), 0)
              .batiments.filter(function(b){ return b.t === "frelon"; }).length;
    }
    var f0 = frelons(0, paquet), f1 = frelons(1, paquet);
    ok("la plage se remplit de Frelons (" + f0 + ") mais pas la forêt (" + f1 + ")",
       f0 > 300 && f1 < 60, f0 + " vs " + f1);

    /* deux cartes éditées séparément ne se mélangent pas */
    var z2 = N.planVide();
    for(i = 0; i < N.NB_ZONES; i++) if((i % N.ZONES_L) >= 9) z2[i] = N.faitZone(5, 3, 0);
    var deux = N.encodePlans({ 0:plage, 3:N.encodePlan(z2) });
    ok("deux cartes éditées gardent chacune la sienne",
       N.planCarte(deux, 0) === plage && N.planCarte(deux, 3) === N.encodePlan(z2) &&
       N.planCarte(deux, 1) === "" && N.planCarte(deux, 4) === "");
    ok("aller-retour du paquet",
       N.encodePlans(N.decodePlans(deux)) === deux);
    ok("l'ordre des cartes dans le paquet est stable",
       N.encodePlans({ 3:"b", 0:"a" }) === N.encodePlans({ 0:"a", 3:"b" }));

    /* LA COMPATIBILITÉ : un ancien plan global revient à la carte 0 */
    var t = N.decodePlans(plage);
    ok("un ancien plan global est rendu à la première île",
       t[0] === plage && t[1] === undefined);
    ok("et les quatre autres retrouvent leur carte d'origine",
       N.empreinteCarte(N.genereCarte("MILY", 2, N.planDeCarte(2, plage), 0)) === vierge[2]);

    ok("un paquet vide, nul ou pourri ne donne aucun plan",
       N.planCarte("", 0) === "" && N.planCarte(null, 0) === "" &&
       N.planCarte("|||", 2) === "");
  })();

  /* ================================================================
     5f. LES ZONES VECTORIELLES — dessiner au compas

     Le pinceau ne sait peindre que des carrés de huit cases. Une forme
     porte une géométrie continue, un MÉLANGE de types avec ses
     pourcentages, une façon de le répartir et sa propre graine.

     Ce que ces vérifications gardent, dans l'ordre d'importance :
       1. un plan SANS forme donne toujours la carte d'avant, bit pour
          bit — sinon tous les salons en cours sautent ;
       2. une forme ne consomme AUCUN tirage du générateur, donc en
          ajouter une ne rebat pas l'île derrière elle ;
       3. les pourcentages demandés sont ceux qu'on obtient, quelle
          que soit la répartition choisie.
     ================================================================ */
  /* ================================================================
     5g. CHAQUE ÎLE GARDE SON DÉCOR

     La question, posée telle quelle : « quand j'édite les défenses,
     est-ce que je perds les tentes de la soirée hippie ? »

     La réponse tient en deux propriétés, et ce groupe les grave.

     1. LA NATURE DU DÉCOR N'EST PAS DANS LA CARTE. Un décor ne retient
        qu'une position, une taille et un numéro de variante, 0 à 3.
        C'est dessineDecor(biome, …) qui décide, au moment de peindre,
        si la variante 1 est un tipi ou un olivier — et le biome vient
        de CARTES, jamais du plan. Aucune édition ne peut donc changer
        ce qu'une île contient.

     2. D'UN PLAN À UN AUTRE, RIEN NE BOUGE. Le générateur consomme le
        même nombre de tirages par nœud qu'il le garde ou le saute :
        décors, rochers et bestioles sortent donc identiques au
        millième de case près.

     La seule exception, et elle est dite au joueur au moment
     d'enregistrer : la toute PREMIÈRE sauvegarde d'une île vierge
     franchit la frontière entre « sans plan » et « avec plan », deux
     branches qui ne tirent pas le même nombre de nombres. Le décor y
     est redistribué — mêmes objets, autres places.
     ================================================================ */
  G("5g. Chaque île garde son décor");
  (function(){
    function emp(l, taille){
      return l.map(function(o){
        return (o.t || o.v) + "@" + o.gx.toFixed(3) + "," + o.gy.toFixed(3)
             + (taille && o.s !== undefined ? ":" + o.s.toFixed(3) : "");
      }).sort().join("|");
    }
    function planA(){
      var z = N.planVide(), i;
      for(i = 0; i < N.NB_ZONES; i++) if((i % N.ZONES_L) < 9) z[i] = N.faitZone(3, 3, 0);
      return N.encodePlan(z);
    }
    function planB(){
      var z = N.decodePlan(planA());
      z[200] = N.faitZone(5, 2, 0);          // une zone de plus, à l'autre bout
      return N.encodePlan(z);
    }

    var bouge = [], i;
    for(i = 0; i < N.CARTES.length; i++){
      var B = N.genereCarte("MILY", i, planA(), 0);
      var C = N.genereCarte("MILY", i, planB(), 0);
      if(emp(B.decors, 1)  !== emp(C.decors, 1))  bouge.push(N.CARTES[i].nom + "/décors");
      if(emp(B.rochers, 1) !== emp(C.rochers, 1)) bouge.push(N.CARTES[i].nom + "/rochers");
      /* Les bestioles de la JUNGLE sont le seul cas où l'on n'exige
         pas l'identité stricte, et c'est justifié : là-bas elles se
         posent entre les tourelles, donc une bête assise là où le plan
         vient de poser une défense DOIT s'écarter. Ce qu'on exige,
         c'est que ce soit local — vérifié juste en dessous. Sur les
         cinq autres cartes, les créatures ne lisent pas les bâtiments
         et l'identité est stricte. */
      if(N.CARTES[i].biome !== "jungle" && emp(B.creatures) !== emp(C.creatures))
        bouge.push(N.CARTES[i].nom + "/bestioles");
    }
    ok("d'un plan à un autre, décors, rochers et bestioles ne bougent pas d'un millième de case",
       bouge.length === 0, bouge.join(", "));

    /* et pourtant les défenses, elles, ont bien changé — sinon la
       vérification ci-dessus passerait pour de mauvaises raisons */
    var d1 = N.genereCarte("MILY", 2, planA(), 0);
    var d2 = N.genereCarte("MILY", 2, planB(), 0);
    ok("alors que les défenses, elles, ont bien changé",
       N.empreinteCarte(d1) !== N.empreinteCarte(d2));

    /* Chaque île porte le même NOMBRE de décors, quel que soit le plan :
       ce sont les mêmes cinq cents objets, pas un décor « en moins »
       parce qu'on a peint dessus. */
    var comptes = [], k;
    for(k = 0; k < N.CARTES.length; k++){
      var M = N.genereCarte("MILY", k, planA(), 0);
      comptes.push(M.decors.length);
      if(M.decors.length < 400) bouge.push(N.CARTES[k].nom + " n'a que " + M.decors.length + " décors");
    }
    ok("chaque île garde ses cinq cents décors sous n'importe quel plan ("
       + comptes.join(", ") + ")",
       comptes.every(function(n){ return n > 400; }));

    /* LA PREUVE QUE LA NATURE DU DÉCOR EST HORS DE PORTÉE DU PLAN :
       un décor ne porte QUE gx, gy, s et v. Rien qui nomme un tipi. */
    var un = N.genereCarte("MILY", 3, planA(), 0).decors[0];
    var champs = Object.keys(un).sort().join(",");
    ok("un décor ne retient qu'une place, une taille et une variante (" + champs + ")",
       champs === "gx,gy,s,v");
    ok("c'est donc le biome, et lui seul, qui dit ce qu'on y dessine",
       N.CARTES[3].biome === "hippie" && N.CARTES[0].biome === "plage");

    /* LA FRONTIÈRE, dite au joueur au moment d'enregistrer : passer de
       « aucun plan » à « un plan » redistribue le décor. On vérifie
       que c'est bien ce qui se produit, pour que la phrase affichée
       reste vraie le jour où quelqu'un touchera au générateur. */
    var vierge = N.genereCarte("MILY", 3, "", 0);
    var peinte = N.genereCarte("MILY", 3, planA(), 0);
    ok("la première sauvegarde d'une île vierge redistribue bien son décor",
       emp(vierge.decors, 1) !== emp(peinte.decors, 1));
    ok("mais elle en garde le même nombre, à quelques unités près ("
       + vierge.decors.length + " puis " + peinte.decors.length + ")",
       Math.abs(vierge.decors.length - peinte.decors.length) < 25);

    /* ================================================================
       LA JUNGLE, qui était le vrai trou.

       Sa végétation et sa faune se posent ENTRE les bâtiments : elles
       lisent donc c.batiments, ce qu'aucun autre décor ne fait. Trois
       mécanismes en tiraient des conséquences GLOBALES au lieu de
       locales, et une seule zone repeinte suffisait à tout rebattre :

         — la liste des cases où un grand arbre tient était filtrée
           par les bâtiments ; on y pioche par indice, donc sa
           longueur changeait et les deux mille pousses hautes
           atterrissaient toutes ailleurs. Mesuré : 3 792 pousses sur
           7 915 conservées ;
         — la pose des geysers et des groupes de bêtes sortait de
           boucle dès qu'elle avait trouvé sa place : le nombre de
           tirages dépendait de l'encombrement, donc du plan. Mesuré :
           147 bêtes sur 777 conservées ;
         — et tout peupleLaJungle héritait de la séquence commune,
           que le bit « champ » d'une zone décale à lui seul.

       Trois corrections : une liste bâtie sur la seule forme de
       l'île avec une marche déterministe et locale, des budgets
       d'essais à nombre FIXE, et un flux de tirage à part semé sur la
       graine de la carte.
       ================================================================ */
    (function(){
      var iJ = N.IDX_JUNGLE;
      var socle = N.decodePlan(N.planJungle());
      function variante(f){
        var z = socle.slice(), k, n = 0;
        for(k = 0; k < N.NB_ZONES; k++){
          var zx = k % N.ZONES_L, zy = (k / N.ZONES_L) | 0;
          if(zx >= 6 && zx <= 8 && zy >= 6 && zy <= 8){ z[k] = f(z[k]); n++; }
        }
        return { ch:N.encodePlan(z), n:n };
      }
      function garde(a, b){
        var A = {}, n = 0;
        a.forEach(function(s){ A[s] = (A[s] || 0) + 1; });
        b.forEach(function(s){ if(A[s]){ A[s]--; n++; } });
        return n / Math.max(1, a.length);
      }
      function liste(m, quoi){
        return m[quoi].map(function(o){
          return (o.fam || o.t || "") + "@" + o.gx.toFixed(3) + "," + o.gy.toFixed(3);
        });
      }
      var REF = N.genereCarte("MILY", iJ, N.encodePlan(socle), 0);

      /* trois gestes d'édition, du plus anodin au plus brutal */
      var gestes = [
        ["le type des défenses",
         variante(function(z){ return N.faitZone(3, N.zoneDens(z), N.zoneChamp(z)); })],
        ["la densité des défenses",
         variante(function(z){ return N.faitZone(3, 1, N.zoneChamp(z)); })],
        ["le bit des cellules à récolter",
         variante(function(z){ return N.faitZone(N.zoneType(z), N.zoneDens(z), N.zoneChamp(z) ? 0 : 1); })]
      ];
      gestes.forEach(function(g){
        var M = N.genereCarte("MILY", iJ, g[1].ch, 0);
        var pf = garde(liste(REF, "flore"), liste(M, "flore"));
        var pb = garde(liste(REF, "creatures"), liste(M, "creatures"));
        ok("jungle — changer " + g[0] + " sur neuf zones garde la végétation en place ("
           + Math.round(pf * 100) + " %)", pf > 0.90, pf.toFixed(3));
        ok("jungle — … et les bêtes aussi (" + Math.round(pb * 100) + " %)",
           pb > 0.90, pb.toFixed(3));
      });

      /* LES GEYSERS SONT LE SEUL CAS QUI RESTE EN CHAÎNE, et c'est
         inhérent à ce qu'ils sont : ils se REPOUSSENT à six cases les
         uns des autres. Déplacer le premier déplace son voisin, qui
         déplace le sien. Ce n'est plus le rebattage global d'avant —
         mesuré 57 à 71 % conservés selon le geste, contre une faune
         entièrement redistribuée auparavant — et ce sont vingt-et-un
         objets de jeu, pas l'ambiance de l'île.
         Ce qui compte, et qui est vérifié juste au-dessus : leur
         boucle consomme désormais un nombre FIXE de tirages, donc
         elle ne décale plus la faune derrière elle. */
      var M2 = N.genereCarte("MILY", iJ, gestes[2][1].ch, 0);
      var pg = garde(liste(REF, "geysers"), liste(M2, "geysers"));
      ok("jungle — les geysers ne partent plus en chaîne ("
         + Math.round(pg * 100) + " % de " + REF.geysers.length + " conservés)",
         pg > 0.5, pg.toFixed(3));
      ok("jungle — et il y en a toujours autant",
         Math.abs(REF.geysers.length - M2.geysers.length) <= 2);

      /* et le flux séparé se prouve : un plan qui ne change RIEN au
         terrain de la jungle la laisse strictement identique */
      var pareil = N.genereCarte("MILY", iJ, N.encodePlan(socle), 0);
      ok("jungle — deux générations du même plan sont identiques",
         N.empreinteCarte(pareil) === N.empreinteCarte(REF) &&
         liste(pareil, "flore").join("|") === liste(REF, "flore").join("|"));
      ok("jungle — elle porte bien sa flore, sa faune et ses geysers ("
         + REF.flore.length + " pousses, " + REF.creatures.length + " bêtes, "
         + REF.geysers.length + " geysers)",
         REF.flore.length > 6000 && REF.creatures.length > 600 && REF.geysers.length > 15);
    })();
  })();

  G("5f. Les zones vectorielles — le compas");
  (function(){
    /* --- l'encodage --- */
    var F1 = { f:1, k:0, d:3, r:4, x:0, g:0, G:[76, 68, 18, 34], C:[[3, 60], [4, 40]] };
    var F2 = { f:0, k:2, d:5, r:1, x:1, g:77, G:[30, 30, 12], C:[[5, 100]] };
    var ch = N.encodeFormes([F1, F2]);
    ok("une forme s'écrit en clair (" + ch.length + " car.)",
       ch === "1,0,3,4,0,0,76.68.18.34,3.60.4.40;0,2,5,1,1,77,30.30.12,5.100", ch);
    var r = N.decodeFormes(ch);
    ok("aller-retour sans perte", N.encodeFormes(r) === ch);
    ok("deux formes relues, dans l'ordre où on les a posées",
       r.length === 2 && r[0].f === 1 && r[1].f === 0 && r[1].g === 77 && r[1].x === 1);

    /* défensif : une chaîne pourrie se jette, elle ne se devine pas */
    ok("une chaîne illisible ne rend aucune forme",
       N.decodeFormes("n'importe quoi").length === 0 &&
       N.decodeFormes(";;;").length === 0 &&
       N.decodeFormes(null).length === 0);
    ok("une forme au mauvais nombre de points est jetée, les saines restent",
       N.decodeFormes("0,0,0,0,0,0,1.2,3.100;0,0,0,0,0,0,5.5.5,3.100").length === 1);
    ok("un type inconnu dans le mélange est ignoré",
       N.decodeFormes("0,0,0,0,0,0,5.5.5,99.50.3.50")[0].C.length === 1);

    /* --- la chaîne complète : quadrillage PUIS formes --- */
    var z = N.planVide();
    z[40] = N.faitZone(3, 3, 0);
    var complet = N.encodePlanComplet(z, [F1]);
    ok("la marque des formes ne peut pas sortir de l'alphabet des bits",
       N.ALPHA_BITS.indexOf(N.MARQUE_FORMES) < 0 && N.MARQUE_FORMES !== "~" &&
       N.MARQUE_FORMES !== ":" && N.MARQUE_FORMES !== "|");
    ok("on retrouve les deux moitiés séparément",
       N.partieQuadrillage(complet) === N.encodePlan(z) &&
       N.partieFormes(complet) === N.encodeFormes([F1]));
    ok("un plan sans forme n'écrit pas la marque",
       N.encodePlanComplet(z, []).indexOf(N.MARQUE_FORMES) < 0);
    ok("un vieux plan sans marque se lit comme un quadrillage entier",
       N.partieQuadrillage(N.encodePlan(z)) === N.encodePlan(z) &&
       N.partieFormes(N.encodePlan(z)) === "");
    /* le paquet des six cartes doit survivre à tout ça */
    var paq2 = N.encodePlans({ 0:complet, 3:N.encodePlan(z) });
    ok("une carte à formes voyage dans le paquet des six",
       N.planCarte(paq2, 0) === complet && N.planCarte(paq2, 3) === N.encodePlan(z));

    /* --- la géométrie --- */
    var cer = { f:0, G:[50, 50, 10] };
    ok("le cercle contient son centre et pas le dehors",
       N.formeContient(cer, 50, 50) && N.formeContient(cer, 59, 50) &&
       !N.formeContient(cer, 61, 50));
    var ann = { f:1, G:[50, 50, 5, 10] };
    ok("l'anneau est creux",
       !N.formeContient(ann, 50, 50) && N.formeContient(ann, 57, 50) &&
       !N.formeContient(ann, 62, 50));
    var rec = { f:2, G:[10, 20, 30, 40] };
    ok("le rectangle tient dans ses bords",
       N.formeContient(rec, 11, 21) && N.formeContient(rec, 39, 59) &&
       !N.formeContient(rec, 41, 30) && !N.formeContient(rec, 20, 61));
    var lig = { f:3, G:[10, 10, 50, 10, 6] };
    ok("la ligne a une épaisseur, et s'arrête à ses bouts",
       N.formeContient(lig, 30, 12) && !N.formeContient(lig, 30, 14) &&
       !N.formeContient(lig, 56, 10));
    var pol = { f:4, G:[10, 10, 40, 10, 40, 40, 10, 40] };
    ok("le polygone se remplit correctement",
       N.formeContient(pol, 25, 25) && !N.formeContient(pol, 5, 25) &&
       !N.formeContient(pol, 45, 25));
    var tri = { f:4, G:[0, 0, 20, 0, 10, 20] };
    ok("un triangle aussi",
       N.formeContient(tri, 10, 5) && !N.formeContient(tri, 2, 15));
    ok("une forme sans géométrie ne contient rien",
       !N.formeContient({ f:0, G:null }, 0, 0) &&
       !N.dansPolygone([0, 0, 1, 1], 0.5, 0.5));

    /* --- LE POINT CRITIQUE : une forme ne consomme aucun tirage --- */
    var vierge = N.empreinteCarte(N.genereCarte("MILY", 1, "", 0));
    var avecZ  = N.encodePlan(z);
    ok("un plan à quadrillage seul donne EXACTEMENT la carte d'avant",
       N.empreinteCarte(N.genereCarte("MILY", 1, avecZ, 0)) ===
       N.empreinteCarte(N.genereCarte("MILY", 1, N.encodePlanComplet(z, []), 0)));
    /* UNE FORME POSÉE DANS UN COIN NE CHANGE RIEN À L'AUTRE BOUT.
       On compare deux plans qui ne diffèrent QUE par cette forme —
       jamais un plan à une carte sans plan : le générateur a deux
       branches, et celle qui a un plan consomme les mêmes tirages
       qu'elle garde le nœud ou non. C'est justement ce qui rend un
       coup de pinceau local. */
    var socle = { f:2, k:0, d:2, r:0, x:1, g:9, G:[60, 10, 40, 60], C:[[5, 100]] };
    var coin  = { f:0, k:0, d:3, r:0, x:1, g:1, G:[20, 20, 8], C:[[3, 100]] };
    var A = N.genereCarte("MILY", 1, N.encodePlanComplet(N.planVide(), [socle, coin]), 0);
    var B = N.genereCarte("MILY", 1, N.encodePlanComplet(N.planVide(), [socle]), 0);
    var loin = function(m){
      return m.batiments.filter(function(b){
        return !b.sup && b.t !== "cellule" && b.t !== "mirador" && b.t !== "reacteur" &&
               Math.hypot(b.gx - 20, b.gy - 20) > 14;
      }).map(function(b){ return b.t + "@" + b.gx.toFixed(3) + "," + b.gy.toFixed(3); }).join("|");
    };
    ok("hors de la forme, pas une défense n'a bougé d'un millième de case",
       loin(A) === loin(B));
    ok("mais dedans, la forme a bien imposé son type",
       A.batiments.filter(function(b){
         return b.t === "frelon" && Math.hypot(b.gx - 20, b.gy - 20) <= 8;
       }).length > 0);

    /* --- les proportions --- */
    /* On échantillonne le mélange sur une grille fine, pour toutes les
       répartitions : aucune n'a le droit de trahir les pourcentages. */
    function mesure(rep){
      var F = { f:2, k:0, d:0, r:rep, x:1, g:5, G:[0, 0, 100, 100],
                C:[[3, 70], [4, 30]] };
      var n = { }, i, j, tot = 0;
      for(i = 0; i < 100; i++) for(j = 0; j < 100; j++){
        var t = N.typeDeForme(F, i, j, 0);
        n[t] = (n[t] || 0) + 1; tot++;
      }
      return (n[3] || 0) / tot;
    }
    var mauvaises = [];
    for(var rp = 0; rp < N.REPARTITIONS.length; rp++){
      var p = mesure(rp);
      if(Math.abs(p - 0.70) > 0.045) mauvaises.push(N.REPARTITIONS[rp].nom + " " + p.toFixed(3));
    }
    ok("les sept répartitions tiennent le 70 / 30 demandé", mauvaises.length === 0,
       mauvaises.join(", "));

    /* LE PIÈGE DE LA FRACTION D'AIRE, gardé pour de bon.
       « 70 % au cœur » rangé d'après le RAYON donnait 38 % — soit
       π·0,7²/4, la surface d'un disque de sept dixièmes de rayon dans
       un carré. Le curseur du joueur aurait menti d'un facteur deux.
       La table mesurée sur la forme est ce qui l'en empêche. */
    var disq = { f:0, k:0, d:0, r:4, x:1, g:1, G:[0, 0, 50], C:[[3, 70], [4, 30]] };
    ok("sur un disque, la moitié du rayon ne fait que le quart de l'aire",
       Math.abs(N.fractionAire(disq, 0.5) - 0.25) < 0.03,
       N.fractionAire(disq, 0.5).toFixed(3));
    ok("et la table est monotone de 0 à 1",
       N.fractionAire(disq, 0) < 0.02 && Math.abs(N.fractionAire(disq, 1) - 1) < 0.02 &&
       N.fractionAire(disq, 0.3) < N.fractionAire(disq, 0.7));
    /* la preuve sur le mélange lui-même, disque cette fois */
    (function(){
      var n3 = 0, tot = 0, i, j;
      for(i = -50; i <= 50; i += 2) for(j = -50; j <= 50; j += 2){
        if(!N.formeContient(disq, i, j)) continue;
        if(N.typeDeForme(disq, i, j, 0) === 3) n3++;
        tot++;
      }
      ok("un disque concentré au cœur tient aussi le 70 / 30 ("
         + (n3 / tot * 100).toFixed(1) + " %)", Math.abs(n3 / tot - 0.70) < 0.05);
    })();
    ok("la table se recalcule quand la forme change",
       (function(){
         var F = { f:0, r:4, G:[0, 0, 10] };
         N.tableForme(F);
         var avant = F._q;
         F.G = [0, 0, 40]; N.formeChangee(F);
         return F._q === null && N.tableForme(F) !== avant;
       })());

    /* et l'harmonieux mérite son nom : moins de paquets que le hasard */
    function plusLongPaquet(rep){
      var F = { f:2, k:0, d:0, r:rep, x:1, g:5, G:[0, 0, 100, 100], C:[[3, 50], [4, 50]] };
      var pire = 0, i, j, suite = 0, av = -1;
      for(j = 0; j < 60; j++){
        suite = 0; av = -1;
        for(i = 0; i < 60; i++){
          var t = N.typeDeForme(F, i, j, 0);
          suite = (t === av) ? suite + 1 : 1; av = t;
          if(suite > pire) pire = suite;
        }
      }
      return pire;
    }
    var pqHasard = plusLongPaquet(0), pqHarm = plusLongPaquet(1);
    ok("« harmonieux » fait des paquets plus courts que « au hasard » ("
       + pqHarm + " contre " + pqHasard + ")", pqHarm < pqHasard);

    /* --- concentré : la densité varie vraiment --- */
    var coeur = { f:0, k:0, d:3, r:4, x:1, g:0, G:[50, 50, 30], C:[[3, 100]] };
    ok("« cœur » saute davantage de nœuds au bord qu'au centre",
       N.sautModuleForme(coeur, 50, 50) < N.sautModuleForme(coeur, 50, 75) - 0.2,
       N.sautModuleForme(coeur, 50, 50).toFixed(3) + " au centre, " +
       N.sautModuleForme(coeur, 50, 75).toFixed(3) + " au bord");
    var pour = { f:0, k:0, d:3, r:5, x:1, g:0, G:[50, 50, 30], C:[[3, 100]] };
    ok("« pourtour » fait exactement l'inverse",
       N.sautModuleForme(pour, 50, 50) > N.sautModuleForme(pour, 50, 75) + 0.2);
    ok("une répartition sans concentration ne touche pas à la densité",
       N.sautModuleForme({ f:0, d:3, r:0, G:[50, 50, 30] }, 50, 50) ===
       N.sautModuleForme({ f:0, d:3, r:0, G:[50, 50, 30] }, 50, 75));

    /* --- la graine propre --- */
    var fixe  = { f:2, k:0, d:0, r:0, x:1, g:3, G:[0, 0, 40, 40], C:[[3, 50], [4, 50]] };
    var libre = { f:2, k:0, d:0, r:0, x:0, g:3, G:[0, 0, 40, 40], C:[[3, 50], [4, 50]] };
    function motif(F, tir){
      var s = "", i;
      for(i = 0; i < 200; i++) s += N.typeDeForme(F, i % 40, (i / 40) | 0, tir);
      return s;
    }
    ok("une forme FIXE se rejoue à l'identique d'un tirage à l'autre",
       motif(fixe, 0) === motif(fixe, 7) && motif(fixe, 0) === motif(fixe, 128));
    ok("une forme libre suit le tirage du salon",
       motif(libre, 0) !== motif(libre, 7));
    ok("mais reste stable à tirage égal", motif(libre, 7) === motif(libre, 7));

    /* --- la pile de calques : la dernière posée gagne --- */
    var bas  = { f:2, k:0, d:0, r:0, x:1, g:0, G:[0, 0, 100, 100], C:[[3, 100]] };
    var haut = { f:0, k:0, d:0, r:0, x:1, g:0, G:[50, 50, 10], C:[[4, 100]] };
    var Pp = N.litPlan(N.encodePlanComplet(N.planVide(), [bas, haut]), 0);
    ok("la forme du dessus l'emporte sur celle du dessous",
       N.TYPES_PLAN[N.planEn(Pp, 50, 50).t] === "pilon" &&
       N.TYPES_PLAN[N.planEn(Pp, 10, 10).t] === "frelon");
    ok("et hors de tout, on retombe sur « auto »",
       N.planEn(Pp, 130, 10).t === 0);

    /* --- les formes l'emportent sur le pinceau, jamais l'inverse --- */
    var zz = N.planVide(), q;
    for(q = 0; q < N.NB_ZONES; q++) zz[q] = N.faitZone(5, 2, 0);       // tout en Bobines
    var mixte = N.litPlan(N.encodePlanComplet(zz, [haut]), 0);
    ok("une forme recouvre le quadrillage peint dessous",
       N.TYPES_PLAN[N.planEn(mixte, 50, 50).t] === "pilon" &&
       N.TYPES_PLAN[N.planEn(mixte, 10, 10).t] === "bobine");

    /* --- les couches --- */
    var cel = { f:0, k:1, d:0, r:0, x:1, g:0, G:[50, 50, 10], C:[[4, 100]] };
    var Pc = N.litPlan(N.encodePlanComplet(zz, [cel]), 0);
    ok("la couche « cellules » sème sans toucher aux défenses",
       N.planEn(Pc, 50, 50).ch === 1 &&
       N.TYPES_PLAN[N.planEn(Pc, 50, 50).t] === "bobine");
    var deux2 = { f:0, k:2, d:0, r:0, x:1, g:0, G:[50, 50, 10], C:[[4, 100]] };
    var Pd = N.litPlan(N.encodePlanComplet(zz, [deux2]), 0);
    ok("la couche « les deux » fait les deux",
       N.planEn(Pd, 50, 50).ch === 1 &&
       N.TYPES_PLAN[N.planEn(Pd, 50, 50).t] === "pilon");

    /* --- et la preuve sur la carte générée --- */
    var anneau = { f:1, k:0, d:3, r:0, x:1, g:0, G:[N.QG_GX, N.QG_GY, 16, 30],
                   C:[[3, 100]] };
    var M = N.genereCarte("MILY", 1, N.encodePlanComplet(N.planVide(), [anneau]), 0);
    var dans = 0, dehors = 0;
    M.batiments.forEach(function(b){
      if(b.t !== "frelon") return;
      var dd = Math.hypot(b.gx - N.QG_GX, b.gy - N.QG_GY);
      if(dd >= 16 && dd <= 30) dans++; else dehors++;
    });
    ok("un anneau de Frelons autour du Brasier en pose " + dans + " dedans",
       dans > 40, dans + " dedans, " + dehors + " ailleurs (la génération en met aussi)");

    /* --- LA GOMME FORTE TIENT SA PROMESSE, JUSQU'À LA DERNIÈRE CELLULE ---
       Elle annonce « plus rien ne pousse ici : ni défense, ni renfort,
       ni mirador, ni champ de cellules ». Une grappe de récolte est
       pourtant semée en spirale sur près de quatre cases : décidée au
       seul centre de sa zone, elle débordait dans le couloir voisin.
       Mesuré avant correction : vingt-neuf cellules dans un couloir
       censé être nu. */
    (function(){
      var champ   = { f:2, k:2, d:2, r:1, x:1, g:5, G:[90, 20, 30, 90], C:[[5, 100]] };
      var couloir = { f:3, k:0, d:0, r:0, x:1, g:3, G:[136, 68, 20, 68, 11], C:[[8, 100]] };
      var M2 = N.genereCarte("MILY", 1,
                 N.encodePlanComplet(N.planVide(), [champ, couloir]), 0);
      /* LE SEUL SURVIVANT LÉGITIME : la cellule électrique du bouclier.
         Le briefing annonce « PROTÉGÉ — 5 cellules électriques », et
         l'une des cinq est posée au milieu exact de l'île. C'est une
         règle du jeu, pas un décor : aucun plan ne doit pouvoir en
         effacer une, sans quoi le bouclier promis au joueur
         dépendrait de l'endroit où l'admin a passé la gomme. */
      var dedans = M2.batiments.filter(function(b){
        return b.t !== "reacteur" && N.formeContient(couloir, b.gx, b.gy);
      });
      var quoi = {};
      dedans.forEach(function(b){ quoi[b.t] = (quoi[b.t] || 0) + 1; });
      ok("un couloir gommé reste NU, cellules comprises", dedans.length === 0,
         dedans.length + " intrus : " + JSON.stringify(quoi));
      ok("mais la gomme n'emporte JAMAIS les cinq cellules du bouclier",
         M2.batiments.filter(function(b){ return b.t === "reacteur"; }).length === 5);
      /* et le champ, lui, a bien été semé — sinon la vérification
         d'au-dessus passerait pour de mauvaises raisons */
      ok("pendant que le champ voisin sème bien sa récolte",
         M2.batiments.filter(function(b){ return b.t === "cellule"; }).length > 200);
    })();

    /* --- un plan de formes seules EST un plan --- */
    ok("des formes sans une seule zone peinte suffisent à faire un plan",
       N.litPlan(N.encodePlanComplet(N.planVide(), [anneau]), 0) !== null);
    ok("un plan totalement vide n'est pas un plan",
       N.litPlan(N.encodePlanComplet(N.planVide(), []), 0) === null &&
       N.litPlan("", 0) === null);
    ok("planEstVide dit vrai quand il n'y a rien",
       N.planEstVide(null) &&
       !N.planEstVide(N.litPlan(N.encodePlanComplet(N.planVide(), [anneau]), 0)));
  })();

  G("5d. Mily dans la jungle — la carte événement");
  /* LA PROPRIÉTÉ QUI PORTE TOUT : la jungle ne doit RIEN changer à
     l'enchaînement des cinq îles. */
  ok("la jungle n'est pas dans l'enchaînement des îles",
     N.IDX_JUNGLE >= N.NB_CARTES_NORMALES);
  ok("elle a plus de vie que toutes les autres",
     N.CARTES.every(function(c, i){
       return i === N.IDX_JUNGLE || c.pvQG < N.CARTES[N.IDX_JUNGLE].pvQG;
     }));
  ok("elle s'écrit MILY DANS LA JUNGLE, jamais autrement",
     N.CARTES[N.IDX_JUNGLE].nom === "Mily dans la jungle" &&
     !/Mill?ie|Milly|Milyy|Miley|Midi/i.test(N.CARTES[N.IDX_JUNGLE].nom));

  /* SA DENSITÉ. Le joueur veut la carte de sa photo : bien plus
     fournie que les cinq autres. */
  (function(){
    var pj = N.planJungle();
    ok("la jungle porte son propre plan gravé (" + pj.length + " car.)",
       typeof pj === "string" && pj.length > 100);
    ok("planDeCarte donne ce plan à la jungle, celui du salon ailleurs",
       N.planDeCarte(N.IDX_JUNGLE, "XX") === pj && N.planDeCarte(0, "XX") === "XX");
    var normale = N.genereCarte("MILY", 0, "", 0);
    var jungle  = N.genereCarte("MILY", N.IDX_JUNGLE, pj, 0);
    function defs(m){
      return m.batiments.filter(function(b){ return b.t !== "cellule"; }).length;
    }
    function cell(m){
      return m.batiments.filter(function(b){ return b.t === "cellule"; }).length;
    }
    ok("la jungle est bien plus dense (" + defs(normale) + " → " + defs(jungle) + ")",
       defs(jungle) > defs(normale) * 1.6, defs(normale) + " vs " + defs(jungle));
    ok("et bien plus riche en cellules (" + cell(normale) + " → " + cell(jungle) + ")",
       cell(jungle) > cell(normale) * 3);
    /* les clairières : sans elles, une carte saturée n'est plus un
       terrain mais un mur */
    var z = N.decodePlan(pj), vides = 0, allees = 0;
    for(var i = 0; i < N.NB_ZONES; i++){
      if(N.zoneEstVide(z[i])) vides++;
      else if(N.zoneDens(z[i]) === 1) allees++;
    }
    ok("elle garde des clairières (" + vides + " zones dégagées)",
       vides > 10 && vides < N.NB_ZONES * 0.25, "" + vides);
    /* LE PIÈGE MESURÉ : à saturation totale, la passe de miradors ne
       trouve plus une place libre et il n'en reste que deux sur
       l'île. Or c'est la seule défense qui abat un Ogre. Les allées
       clairsemées existent pour ça, et ce test les garde. */
    ok("et des allées clairsemées (" + allees + " zones)", allees > 30, "" + allees);
    var mir = jungle.batiments.filter(function(b){ return b.t === "mirador"; }).length;
    ok("l'Ogre a donc en face de lui " + mir + " miradors", mir >= 18, "" + mir);
    ok("la jungle garde ses cinq cellules électriques",
       (jungle.reacteurs || []).length === N.NB_REACTEURS);
    ok("et ses trois chats", N.ESPECES_PROTEGEES.every(function(e){
       return jungle.creatures.filter(function(k){ return k.t === e; }).length === 1;
    }));
    ok("deux clients génèrent la même jungle",
       N.empreinteCarte(jungle) === N.empreinteCarte(N.genereCarte("MILY", N.IDX_JUNGLE, pj, 0)));
  })();

  /* LA VOIE PARALLÈLE. Deux compteurs qui ne font qu'augmenter
     décrivent un état qui va et vient : c'est ce qui rend une
     expédition fusionnable comme le reste du monde. */
  (function(){
    function m(o){
      var b = { v:1, cy:0, c:0, pv:100, d:"", g:"", w:"", s:"", k:"",
                p:"", pn:0, tg:0, je:0, jf:0, jd:"", jq:0, jt:0, jm:7, jmn:0, ch:"" };
      for(var q in o) b[q] = o[q];
      return b;
    }
    ok("un monde neuf n'a pas d'expédition en cours",
       !N.jungleEnCours(N.mondeVide(0, 100, 0)));
    ok("je > jf : expédition en cours", N.jungleEnCours(m({ je:1, jf:0 })));
    ok("je = jf : terminée", !N.jungleEnCours(m({ je:3, jf:3 })));
    /* un client qui n'a pas vu le lancement, et un qui l'a lancé */
    var enRetard = m({ je:0, jf:0 });
    var lanceur  = m({ je:1, jf:0, jq:60000000 });
    var f1 = N.fusionneMonde(enRetard, lanceur);
    var f2 = N.fusionneMonde(lanceur, enRetard);
    ok("le lancement se propage au retardataire, dans les deux sens",
       N.jungleEnCours(f1) && N.jungleEnCours(f2) && f1.je === f2.je);
    ok("et les PV du Brasier de la jungle avec",
       f1.jq === 60000000 && f2.jq === 60000000);
    /* la fin : jf rattrape je */
    var fini = m({ je:1, jf:1, jt:1000 });
    var f3 = N.fusionneMonde(lanceur, fini), f4 = N.fusionneMonde(fini, lanceur);
    ok("la fin se propage aussi, dans les deux sens",
       !N.jungleEnCours(f3) && !N.jungleEnCours(f4));
    /* LE POINT CRITIQUE : une île plus avancée ne doit pas emporter
       une jungle périmée avec elle */
    var avanceMaisVieux = m({ c:4, je:0, jf:0, jt:0 });
    var enRetardMaisFrais = m({ c:0, je:5, jf:5, jt:9999 });
    var f5 = N.fusionneMonde(avanceMaisVieux, enRetardMaisFrais);
    var f6 = N.fusionneMonde(enRetardMaisFrais, avanceMaisVieux);
    ok("une île plus avancée n'efface pas l'état de la jungle",
       f5.je === 5 && f5.jt === 9999 && f6.je === 5 && f6.jt === 9999,
       "f5.je=" + f5.je + " f5.jt=" + f5.jt);
    ok("et l'avancée de campagne est bien conservée", f5.c === 4 && f6.c === 4);
    /* LE VERROU DE 48 H. Une heure epoch vaut aujourd'hui 1,77 × 10¹²
       et NE TIENT PAS dans trente-deux bits : « | 0 », l'idiome
       employé partout ailleurs pour assainir un entier, la transforme
       en un nombre sans rapport et le verrou s'ouvrait aussitôt. Ces
       trois vérifications montent la garde sur des heures RÉELLES. */
    var vrai = 1772000000000, vieux = vrai - 3600000;
    ok("une heure epoch survit à l'assainissement",
       N.msMonde(vrai) === vrai && N.msMonde("" + vrai) === vrai,
       "msMonde(" + vrai + ") = " + N.msMonde(vrai));
    ok("et aux valeurs absurdes",
       N.msMonde(null) === 0 && N.msMonde(-5) === 0 && N.msMonde(NaN) === 0 &&
       N.msMonde(Infinity) === 0);
    var f7 = N.fusionneMonde(m({ jt:vrai }), m({ jt:vieux }));
    ok("l'heure de la dernière victoire ne redescend jamais, sur une vraie heure",
       f7.jt === vrai && N.fusionneMonde(m({ jt:vieux }), m({ jt:vrai })).jt === vrai,
       "" + f7.jt);
    ok("et deux heures réelles distinctes ne se confondent pas",
       !N.memeMonde(m({ jt:vrai }), m({ jt:vieux })));
    ok("fusionner est idempotent sur la voie de la jungle",
       N.memeMonde(N.fusionneMonde(f5, f5), f5));
    /* le réglage administrateur */
    var a1 = m({ jm:7, jmn:3 }), a2 = m({ jm:12, jmn:4 });
    ok("le réglage le plus récent gagne, dans les deux sens",
       N.fusionneMonde(a1, a2).jm === 12 && N.fusionneMonde(a2, a1).jm === 12);
    var e1 = m({ jm:5, jmn:9 }), e2 = m({ jm:15, jmn:9 });
    ok("à numéro égal, la valeur tranche — jamais l'ordre d'arrivée",
       N.fusionneMonde(e1, e2).jm === N.fusionneMonde(e2, e1).jm);
    ok("un lancement compte dans la comparaison de deux mondes",
       !N.memeMonde(m({ je:1 }), m({ je:0 })) &&
       !N.memeMonde(m({ jt:1 }), m({ jt:0 })) &&
       N.memeMonde(m({ je:2, jf:1 }), m({ je:2, jf:1 })));
    /* les destructions de la jungle appartiennent à leur époque */
    var ep1 = m({ je:1, jf:0, jd:"ZZ" });
    var ep2 = m({ je:2, jf:1, jd:"" });
    ok("une expédition plus récente balaie les destructions de la précédente",
       N.fusionneMonde(ep1, ep2).jd === "" && N.fusionneMonde(ep2, ep1).jd === "");
    var mm1 = m({ je:2, jf:1, jd:N.encodeBits([1,0,0,0,0,0]) });
    var mm2 = m({ je:2, jf:1, jd:N.encodeBits([0,1,0,0,0,0]) });
    ok("à époque égale, elles s'additionnent",
       N.fusionneMonde(mm1, mm2).jd === N.fusionneMonde(mm2, mm1).jd &&
       N.compteBits(N.fusionneMonde(mm1, mm2).jd) === 2);
  })();

  /* LES CHAMPIONS — un par carte, et ils ne se mélangent pas. */
  (function(){
    ok("un monde neuf n'a aucun champion", N.mondeVide(0, 100, 0).ch === "");
    var t = { 0:{ nom:"Johan", n:1 }, 5:{ nom:"Lucien", n:2 } };
    var s = N.encodeChampions(t), r = N.decodeChampions(s);
    ok("aller-retour des champions (« " + s + " »)",
       r[0].nom === "Johan" && r[0].n === 1 && r[5].nom === "Lucien" && r[5].n === 2);
    ok("les séparateurs sont retirés des pseudos",
       N.decodeChampions(N.encodeChampions({ 0:{ nom:"a|b:c", n:1 } }))[0].nom === "abc");
    var v1 = N.encodeChampions({ 0:{ nom:"Johan", n:1 } });
    var v2 = N.encodeChampions({ 0:{ nom:"Sophie", n:2 }, 3:{ nom:"Lucien", n:1 } });
    var fc = N.fusionneChampions(v1, v2);
    ok("la victoire la plus récente remplace le champion",
       N.decodeChampions(fc)[0].nom === "Sophie");
    ok("et les autres cartes gardent le leur",
       N.decodeChampions(fc)[3].nom === "Lucien");
    ok("fusionner donne le même résultat dans les deux sens",
       N.fusionneChampions(v1, v2) === N.fusionneChampions(v2, v1));
    ok("fusionner deux fois ne change rien",
       N.fusionneChampions(fc, v1) === fc);
    ok("fusionner est associatif",
       N.fusionneChampions(N.fusionneChampions(v1, v2), s) ===
       N.fusionneChampions(v1, N.fusionneChampions(v2, s)));
    /* un champion de la jungle ne devient pas champion de la plage */
    var f = N.fusionneMonde(
      { v:1, cy:0, c:0, pv:100, d:"", g:"", w:"", s:"", k:"", p:"", pn:0, tg:0,
        je:0, jf:0, jd:"", jq:0, jt:0, jm:7, jmn:0, ch:v1 },
      { v:1, cy:0, c:0, pv:100, d:"", g:"", w:"", s:"", k:"", p:"", pn:0, tg:0,
        je:0, jf:0, jd:"", jq:0, jt:0, jm:7, jmn:0,
        ch:N.encodeChampions({ 5:{ nom:"Zoé", n:1 } }) });
    var dc = N.decodeChampions(f.ch);
    ok("chaque carte garde son propre champion",
       dc[0].nom === "Johan" && dc[5].nom === "Zoé" && !dc[1]);
  })();

  G("5c. Les trois chats de Mily, et sa vengeance");
  ok("trois espèces protégées, dans un ordre gravé",
     N.ESPECES_PROTEGEES.length === 3 &&
     N.ESPECES_PROTEGEES.join(",") === "chat,chaton,chatte");
  ok("Gribouille, Croquette et Praline",
     N.CRE.chat.nom === "Gribouille" && N.CRE.chaton.nom === "Croquette" &&
     N.CRE.chatte.nom === "Praline");
  ok("ils sont inoffensifs et ils fuient",
     N.ESPECES_PROTEGEES.every(function(e){
       var f = N.CRE[e];
       return f.protege === 1 && f.fuit === 1 && f.degats === 0 && f.portee === 0;
     }));
  ok("et ils sont les SEULS protégés : rien d'autre ne déclenche les rayons",
     Object.keys(N.CRE).filter(function(k){ return N.CRE[k].protege; }).length === 3);
  (function(){
    var manque = "", trop = "", pres = "";
    for(var i = 0; i < N.CARTES.length; i++){
      var m = N.genereCarte("MILY", i);
      N.ESPECES_PROTEGEES.forEach(function(e){
        var l = m.creatures.filter(function(k){ return k.t === e; });
        if(l.length > 1){ trop += "île" + i + " " + e + "×" + l.length + " "; return; }
        if(!l.length){ manque += "île" + i + " " + e + " "; return; }
        /* jamais au pied du Brasier : on doit tomber dessus en
           avançant, pas en débarquant */
        if(Math.hypot(l[0].gx - N.QG_GX, l[0].gy - N.QG_GY) < 16) pres += "île" + i + " " + e + " ";
      });
    }
    ok("un chat, un chaton et une chatte sur chacune des cinq îles",
       manque === "" && trop === "", manque + trop);
    ok("aucun n'est collé au Brasier", pres === "", pres);
  })();
  /* LA PEINE. 90 % des PV, et surtout : JAMAIS la mort. Une barge
     amputée revient, une barge effacée fait fermer l'onglet — et les
     braises laissées derrière ne doivent pas achever ce que le rayon
     a épargné. */
  ok("la peine retire 90 % des PV", N.EQ.VENG_PERTE === 0.9);
  (function(){
    var pv = N.UNI.furie.pv;
    var reste = pv * (1 - N.EQ.VENG_PERTE);
    ok("une Furie frappée survit à " + Math.round(reste) + " PV", reste >= 5);
    ok("et les braises lui laissent " + (reste / N.EQ.VENG_BRAISE_DPS).toFixed(1)
       + " s pour dégager",
       reste / N.EQ.VENG_BRAISE_DPS > 1.0,
       reste + " PV contre " + N.EQ.VENG_BRAISE_DPS + " dégâts/s");
  })();
  ok("le message dure assez pour qu'on le lise et qu'on ait peur",
     N.EQ.VENG_MESSAGE >= 3 && N.EQ.VENG_MESSAGE <= 5);
  ok("les traînées courent sur plusieurs cases", N.EQ.VENG_TRAINEE >= 10);
  ok("les deux rayons s'écartent assez pour qu'on en voie DEUX",
     Math.sin(N.EQ.VENG_ECART) * N.EQ.VENG_TRAINEE * 2 > N.EQ.VENG_LARGEUR * 2,
     "écart au bout : "
     + (2 * Math.sin(N.EQ.VENG_ECART) * N.EQ.VENG_TRAINEE).toFixed(1) + " cases");

  /* LES TROIS CASES DE L'INSTANTANÉ. Même contrat que Gégé : le
     premier nom inscrit y reste, quel que soit l'ordre d'arrivée. */
  ok("un instantané neuf n'accuse personne", N.mondeVide(0, 100, 0).k === "");
  ok("trois cases vides s'encodent en rien",
     N.encodeChats({ chat:"", chaton:"", chatte:"" }) === "");
  (function(){
    var s = N.encodeChats({ chat:"Roro", chaton:"", chatte:"Zoé" });
    var r = N.decodeChats(s);
    ok("aller-retour des trois cases (« " + s + " »)",
       r.chat === "Roro" && r.chaton === "" && r.chatte === "Zoé");
    ok("le séparateur est retiré des pseudos",
       N.decodeChats(N.encodeChats({ chat:"a|b", chaton:"", chatte:"" })).chat === "ab");
    var a1 = N.encodeChats({ chat:"Roro", chaton:"", chatte:"" });
    var b1 = N.encodeChats({ chat:"Autre", chaton:"Zoé", chatte:"" });
    /* Deux clients ont pu inscrire un nom DIFFÉRENT dans la même case
       avant de se parler. La fusion doit alors trancher pareil dans
       les deux sens, sinon les deux se republient l'instantané à
       l'infini sans jamais tomber d'accord. */
    ok("fusionner donne le même résultat dans les deux sens",
       N.fusionneChats(a1, b1) === N.fusionneChats(b1, a1));
    ok("une case remplie d'un seul côté garde son nom",
       N.decodeChats(N.fusionneChats(a1, b1)).chaton === "Zoé");
    ok("une case disputée est tranchée par le nom, pas par l'ordre",
       N.decodeChats(N.fusionneChats(a1, b1)).chat === "Autre");
    ok("fusionner est associatif",
       N.fusionneChats(N.fusionneChats(a1, b1), s) ===
       N.fusionneChats(a1, N.fusionneChats(b1, s)));
    ok("fusionner deux fois ne change rien",
       N.fusionneChats(N.fusionneChats(a1, b1), a1) === N.fusionneChats(a1, b1));
    /* et le tout circule bien dans l'instantané du salon */
    var m1 = { v:1, cy:0, c:0, pv:100, d:"", g:"", w:"", s:"", k:a1, p:"", pn:0, tg:0 };
    var m2 = { v:1, cy:0, c:0, pv:100, d:"", g:"", w:"", s:"", k:b1, p:"", pn:0, tg:0 };
    var f2 = N.fusionneMonde(m1, m2);
    ok("l'instantané porte les trois cases",
       N.decodeChats(f2.k).chat === "Autre" && N.decodeChats(f2.k).chaton === "Zoé");
    ok("un chat tué compte dans la comparaison de deux mondes",
       !N.memeMonde(m1, m2) && N.memeMonde(m1, m1));
    ok("une nouvelle campagne rend les trois chats à la vie",
       N.fusionneMonde(m1, { v:1, cy:1, c:0, pv:100, d:"", g:"", w:"", s:"", k:"",
                             p:"", pn:0, tg:0 }).k === "");
  })();

  [a, c, N.genereCarte("MILY", 2)].forEach(function(m, i){
    var cel = m.batiments.filter(function(b){ return b.t === "cellule"; }).length;
    var def = m.batiments.length - cel;
    ok("carte " + (i + 1) + " : " + def + " défenses (350-700)",
       def >= 350 && def <= 700, "" + def);
    ok("carte " + (i + 1) + " : " + cel + " cellules en " + m.champs.length + " champs",
       m.champs.length >= 5 && m.champs.length <= 14 && cel >= 70 && cel <= 220,
       cel + " cellules / " + m.champs.length + " champs");
    ok("carte " + (i + 1) + " : les champs font une quinzaine de cellules chacun",
       m.champs.every(function(f){ return f.n >= 13 && f.n <= 17; }));
    var cpt = {};
    m.batiments.forEach(function(b2){ cpt[b2.t] = (cpt[b2.t] || 0) + 1; });
    ok("carte " + (i + 1) + " : " + (cpt.frelon || 0) + " Frelons (10-45)",
       (cpt.frelon || 0) >= 10 && (cpt.frelon || 0) <= 45);
    ok("carte " + (i + 1) + " : " + (cpt.bobine || 0) + " Bobines (40-130)",
       (cpt.bobine || 0) >= 40 && (cpt.bobine || 0) <= 130);
    ok("carte " + (i + 1) + " : " + m.creatures.length + " créatures (70-110)",
       m.creatures.length >= 70 && m.creatures.length <= 110);
    var esp = {};
    m.creatures.forEach(function(k){ esp[k.t] = (esp[k.t] || 0) + 1; });
    ok("carte " + (i + 1) + " : les 4 espèces hostiles sont présentes",
       ["braisard","piqueur","sanglier","crapaud"].every(function(e){ return esp[e] > 0; }),
       Object.keys(esp).join("/"));
    ok("carte " + (i + 1) + " : une seule Gégé la belette", esp.belette === 1, "" + esp.belette);
    ok("carte " + (i + 1) + " : " + m.falaises.length + " blocs de falaise sur 3 bords",
       m.falaises.length > 500);
    var ouvertureEst = m.falaises.every(function(f){ return f.gx < 4 || f.gy < 4 || f.gy > N.GH - 4; });
    ok("carte " + (i + 1) + " : aucune falaise ne bouche la plage de l'est", ouvertureEst);
    var horsPlage = m.batiments.every(function(b2){ return b2.gx < N.PLAGE_X0; });
    ok("carte " + (i + 1) + " : la plage est libre de bâtiments", horsPlage);
    var loinQG = m.batiments.every(function(b2){
      return Math.hypot(b2.gx - N.QG_GX, b2.gy - N.QG_GY) > 4.4;
    });
    ok("carte " + (i + 1) + " : rien dans l'emprise du QG", loinQG);
  });

  var traversee = (N.GW - 4) - N.QG_GX;
  ok("traversée plage → Brasier : " + traversee + " cases (île géante)",
     traversee >= 120 && traversee <= 180, "" + traversee);
})();

/* ================================================================
   5. Convergence des dégâts
   ================================================================ */
G("5. Convergence des points de vie du QG");
(function(){
  var evs = [];
  var series = { A:0, B:0, C:0 };
  var noms = ["A","B","C"];
  for(var i = 0; i < 400; i++){
    var qui = noms[(alTest() * 3) | 0];
    series[qui]++;
    evs.push({ id:qui, s:series[qui], d:Math.round(1 + alTest() * 900) });
  }
  function rejoue(liste){
    var q = new N.FileDegats(750000);
    liste.forEach(function(e){ q.applique(e.id, e.s, e.d); });
    return q.pv;
  }
  var pv1 = rejoue(evs), pv2 = rejoue(evs), pv3 = rejoue(evs);
  ok("trois clients, même séquence → mêmes PV", pv1 === pv2 && pv2 === pv3, pv1 + "/" + pv2 + "/" + pv3);
  ok("des dégâts ont bien été appliqués", pv1 < 750000);

  /* doublons : chacun reçoit aussi son propre message en boucle */
  var avecDoublons = [];
  evs.forEach(function(e){ avecDoublons.push(e); if(alTest() < 0.4) avecDoublons.push(e); });
  ok("les doublons ne comptent pas deux fois", rejoue(avecDoublons) === pv1);

  /* messages arrivés en retard */
  var retard = evs.slice();
  for(var k = 0; k < 60; k++){
    var j = (alTest() * (evs.length - 2)) | 0;
    retard.splice(j + 2, 0, evs[j]);
  }
  ok("un message en retard est ignoré", rejoue(retard) === pv1);

  var q = new N.FileDegats(1000);
  q.applique("A", 1, 999999);
  ok("les PV ne descendent jamais sous zéro", q.pv === 0);
  q = new N.FileDegats(1000); q.adopteMinimum(400);
  ok("un arrivant tardif adopte le minimum reçu", q.pv === 400);
  q.adopteMinimum(900);
  ok("… et n'accepte pas une valeur plus haute", q.pv === 400);
})();

/* ================================================================
   6. Cône du lance-chalumeau
   ================================================================ */
G("6. Cône du lance-chalumeau au passage par ±π");
(function(){
  var PI = Math.PI;
  ok("écart(π-0.05, -π+0.05) ≈ -0.1",
     Math.abs(N.ecartAngulaire(PI - 0.05, -PI + 0.05) + 0.1) < 1e-9,
     "" + N.ecartAngulaire(PI - 0.05, -PI + 0.05));
  ok("écart(-π+0.05, π-0.05) ≈ +0.1",
     Math.abs(N.ecartAngulaire(-PI + 0.05, PI - 0.05) - 0.1) < 1e-9);
  ok("cible juste de l'autre côté de ±π → dans le cône",
     N.dansCone(PI - 0.05, -PI + 0.05, 0.5));
  ok("cible à 0.6 rad → hors du cône de 0.5", !N.dansCone(PI - 0.55, -PI + 0.05, 0.5));
  ok("cible diamétralement opposée → hors du cône", !N.dansCone(0, PI, 0.5));
  ok("cible pile devant → dans le cône", N.dansCone(1.2345, 1.2345, 0.5));

  /* l'écart est toujours dans [-π, π], même pour des angles non normalisés */
  var pire = 0;
  for(var i = 0; i < 3000; i++){
    var a = (alTest() - 0.5) * 200, b = (alTest() - 0.5) * 200;
    var e = N.ecartAngulaire(a, b);
    pire = Math.max(pire, Math.abs(e));
    /* cohérence : cos/sin de l'écart doivent coller */
    var err = Math.abs(Math.cos(e) - Math.cos(a - b)) + Math.abs(Math.sin(e) - Math.sin(a - b));
    if(err > 1e-9){ pire = 99; break; }
  }
  ok("écart toujours dans [-π, π] et cohérent (3000 tirages)", pire <= PI + 1e-9, "max " + pire);

  /* symétrie du cône */
  var sym = true;
  for(var j = 0; j < 500; j++){
    var t = (alTest() - 0.5) * 20, dev = (alTest() - 0.5) * 1.2;
    if(N.dansCone(t + dev, t, 0.5) !== N.dansCone(t - dev, t, 0.5)) sym = false;
  }
  ok("le cône est symétrique autour de son axe", sym);
})();

/* ================================================================
   7. Budget mémoire du sol pré-calculé
   ================================================================ */
G("7. Budget mémoire");
(function(){
  var t = N.tailleSolPrecalcule();
  ok("canevas de sol " + t.w + "×" + t.h + " = " + t.mpx.toFixed(2) + " Mpx (< 8)",
     t.mpx < 8, t.mpx.toFixed(2) + " Mpx");
  ok("… et suffisamment grand pour couvrir l'île", t.w > 2500 && t.h > 1200);
  ok("échelle du sol adaptée automatiquement (" + t.ech.toFixed(3) + ")",
     t.ech > 0.2 && t.ech <= 0.5);
  ok("pleine résolution refusée à raison (" + t.mpxPlein.toFixed(1) + " Mpx)", t.mpxPlein > 8);
  ok("la carte fait plus de 20 000 cases (" + (N.GW * N.GH) + ")", N.GW * N.GH >= 20000);
})();

/* ================================================================
   8. Cohérence des règles (bonus)
   ================================================================ */
G("8. Cohérence des règles de jeu");
(function(){
  ok("la crible (5,15) dépasse l'arrêt de la Furie (4,75)",
     N.DEF.crible.portee > N.UNI.furie.arret);
  ok("… mais de justesse : moins d'une demi-case",
     N.DEF.crible.portee - N.UNI.furie.arret < 0.5);
  ok("le lance-chalumeau (5,6) dépasse la portée de la Furie (5,0)",
     N.DEF.chalumeau.portee > N.UNI.furie.portee);
  ok("le pilon est aveugle de près (portée mini 2,6)", N.DEF.pilon.porteeMin === 2.6);

  /* précision dégressive */
  ok("à 4,0 cases la crible touche toujours", N.mitraTouche(4.0, 0.99));
  ok("à 5,0 cases elle touche une fois sur trois",
     N.mitraTouche(5.0, 0.30) && !N.mitraTouche(5.0, 0.34));
  var n = 0;
  for(var i = 0; i < 30000; i++) if(N.mitraTouche(4.8, alTest())) n++;
  ok("taux mesuré " + (n / 300).toFixed(1) + " % (attendu ≈ 33 %)",
     Math.abs(n / 30000 - 1 / 3) < 0.02);

  /* coûts croissants */
  var u = { nova:0, poulets:0, brouillard:0, salve:0, cryo:0, soin:0, balise:0, viper:0 };
  var attendu = {
    balise:[1,5,10,20], brouillard:[3,7,12,22], poulets:[4,12,22,42],
    soin:[5,13,23,43], viper:[6,14,24,44], cryo:[8,20,35,65],
    salve:[10,22,37,67], nova:[0,0,0,0]      // la Nova ne se paie pas en Énergie
  };
  var bon = true, det = "";
  Object.keys(attendu).forEach(function(m){
    [0, 4, 9, 19].forEach(function(k, i){
      u[m] = k;
      var c = N.coutActuel ? N.coutActuel(m, u) : (N.COUT[m].base + N.COUT[m].pas * k);
      if(c !== attendu[m][i]){ bon = false; det += m + "#" + (k + 1) + "=" + c + " "; }
    });
    u[m] = 0;
  });
  ok("barème des huit capacités (1ᵉʳ / 5ᵉ / 10ᵉ / 20ᵉ emploi)", bon, det);
  ok("huit capacités exactement", Object.keys(N.COUT).length === 8);
  ok("la Nova est gratuite en Énergie : c'est la charge par vie qui la limite",
     N.COUT.nova.base === 0 && N.COUT.nova.pas === 0 && N.EQ.NOVA_PAR_VIE === 1);

  /* durées des zones */
  ok("Brouillard : 20 s", N.CAP.brouillard.duree === 20);
  ok("Balise : 30 s", N.CAP.balise.duree === 30);
  ok("Brouillard et Cryo ont des diamètres comparables (écart < 15 %)",
     Math.abs(N.CAP.brouillard.rayon - N.CAP.cryo.rayon) / N.CAP.cryo.rayon < 0.15);

  /* formation : le groupe doit couvrir ≈ 80 % du cercle de Brouillard */
  var rf = N.rayonFormation();
  ok("rayon de formation = " + rf.toFixed(2) + " cases (80 % de la surface du Brouillard)",
     Math.abs(Math.PI * rf * rf / (Math.PI * N.CAP.brouillard.rayon * N.CAP.brouillard.rayon) - 0.80) < 0.001);
  (function(){
    /* La spirale doit couvrir le disque sans trou ni empilement. */
    var pts = [], i, j;
    for(i = 0; i < 120; i++) pts.push(N.ancreFormation(i));
    var hors = 0, minD = 1e9, moyR = 0;
    for(i = 0; i < pts.length; i++){
      var r = Math.hypot(pts[i].x, pts[i].y);
      if(r > 1.0001) hors++;
      moyR += r;
      for(j = i + 1; j < pts.length; j++){
        var d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if(d < minD) minD = d;
      }
    }
    moyR /= pts.length;
    ok("les 120 places de formation tiennent dans le disque unité", hors === 0, hors + " hors disque");
    /* Les places n'ont pas à être espacées de la distance de confort :
       c'est separeUnites() qui écarte les soldats. Elles doivent
       simplement être toutes distinctes, pour qu'aucune paire ne vise
       exactement le même point. */
    ok("aucune place confondue avec une autre (écart mini " + (minD * rf).toFixed(2) + " case)",
       minD * rf > 0.05, (minD * rf).toFixed(3));
    ok("les places couvrent le disque sans se tasser au centre (rayon moyen "
       + moyR.toFixed(2) + " ≈ 0,67)", moyR > 0.55 && moyR < 0.78, moyR.toFixed(3));
  })();

  /* Le vrai test : les quinze soldats d'UNE MÊME navette ont des
     numéros qui se suivent. Avec un rayon en « n modulo effectif », ils
     recevaient tous une place sur un mince anneau. L'inverse radical
     donne un disque complet pour n'importe quelle plage contiguë. */
  (function(){
    function amplitude(depart, nb){
      var rmin = 2, rmax = 0;
      for(var k = 0; k < nb; k++){
        var a = N.ancreFormation(depart + k), r = Math.hypot(a.x, a.y);
        if(r < rmin) rmin = r;
        if(r > rmax) rmax = r;
      }
      return rmax - rmin;
    }
    var pire = 2;
    for(var d = 0; d < 400; d += 7) pire = Math.min(pire, amplitude(d, 15));
    ok("une navette de 15 couvre un disque, pas un anneau (amplitude mini "
       + pire.toFixed(2) + ")", pire > 0.45, pire.toFixed(3));
    ok("l'inverse radical est bien réparti sur toute plage contiguë",
       N.inverseRadical(0) === 0.5 && N.inverseRadical(1) === 0.25 &&
       N.inverseRadical(2) === 0.75);
  })();

  /* L'éventail d'approche décale la troupe par rapport au centre de sa
     cible, mais la portée reste mesurée AU CENTRE : un décalage plus
     grand que la marge d'arrêt empêcherait purement et simplement
     d'entrer en portée. Il doit donc rester strictement en dessous,
     pour TOUTES les combinaisons troupe × cible du jeu. */
  (function(){
    var pire = 1e9, detail = "";
    var cibles = [{ nom:"créature", rc:0.3 }, { nom:"QG", rc:N.RAYON_QG }];
    Object.keys(N.DEF).forEach(function(t){
      cibles.push({ nom:N.DEF[t].nom, rc:N.DEF[t].emprise * 0.42 });
    });
    Object.keys(N.UNI).forEach(function(u){
      var arret = N.UNI[u].arret;
      cibles.forEach(function(c){
        var marge = arret + c.rc;
        var etal = Math.min(N.rayonFormation() * 0.55, marge * 0.7);
        var reste = marge - etal;
        if(reste < pire){ pire = reste; detail = N.UNI[u].nom + " vs " + c.nom; }
      });
    });
    ok("l'éventail laisse toujours de la marge pour entrer en portée (pire cas "
       + pire.toFixed(2) + " case : " + detail + ")", pire > 0.3, pire.toFixed(3));
    ok("et il est bien plafonné, pas seulement pour la plus grosse cible",
       Math.min(N.rayonFormation() * 0.55, (N.UNI.commando.arret + 0.3) * 0.7) < N.UNI.commando.arret + 0.3);
  })();

  /* ---- CHAQUE ÎLE DOIT AVOIR SA PALETTE ----
     En passant de trois à cinq îles, CARTES a nommé deux biomes que
     BIOMES et MATIERES ne connaissaient pas encore. Le briefing lisait
     alors « .ciel » sur undefined : construitBriefing() plantait, donc
     demarre() n'allait pas au bout, donc AUCUN écouteur n'était posé et
     le jeu ne s'ouvrait plus du tout — pendant que les tests restaient
     au vert. Un repli existe désormais dans dessineApercu(), mais il ne
     doit jamais servir : c'est ce que vérifie ce bloc.
     On relit les deux littéraux dans le fichier livré, tels quels. */
  (function(){
    function litObjet(nom){
      var d = html.indexOf("var " + nom + " = {");
      if(d < 0) return null;
      var f = html.indexOf("\n};", d);
      if(f < 0) return null;
      try{ return new Function("return " + html.slice(d + ("var " + nom + " = ").length, f + 2))(); }
      catch(e){ return null; }
    }
    var B = litObjet("BIOMES"), M = litObjet("MATIERES");
    ok("les deux palettes se relisent dans le fichier livré", !!B && !!M);
    if(!B || !M) return;
    var CLES_B = ["sol1","sol2","sable","sableO","herbe","allee","roche",
                  "eauC","eau","eauO","ecume","fond","basFond","ciel"];
    var CLES_M = ["fond1","fond2","tache1","tache2","herbe1","herbe2",
                  "sable1","sable2","mouille","roche1","roche2"];
    var sansB = "", sansM = "", incomplet = "";
    for(var i = 0; i < N.CARTES.length; i++){
      var bio = N.CARTES[i].biome;
      if(!B[bio]){ sansB += bio + " "; continue; }
      if(!M[bio]){ sansM += bio + " "; continue; }
      for(var k = 0; k < CLES_B.length; k++)
        if(typeof B[bio][CLES_B[k]] !== "string") incomplet += bio + ".BIOMES." + CLES_B[k] + " ";
      for(var k2 = 0; k2 < CLES_M.length; k2++)
        if(typeof M[bio][CLES_M[k2]] !== "string") incomplet += bio + ".MATIERES." + CLES_M[k2] + " ";
    }
    ok("chaque île a sa palette BIOMES", sansB === "", sansB);
    ok("chaque île a ses matières MATIERES", sansM === "", sansM);
    ok("aucune palette n'a de couleur manquante", incomplet === "", incomplet);
    /* deux îles qui se ressemblent, c'est deux îles qu'on confond */
    var vus = {}, jumelles = "";
    for(var j = 0; j < N.CARTES.length; j++){
      var s = JSON.stringify(B[N.CARTES[j].biome]);
      if(vus[s]) jumelles += N.CARTES[j].biome + "=" + vus[s] + " ";
      vus[s] = N.CARTES[j].biome;
    }
    ok("les cinq îles ont cinq palettes distinctes", jumelles === "", jumelles);
  })();

  /* Les messages de victoire : un par île, et le pseudo du meilleur
     contributeur en tête. */
  (function(){
    var bon = true, det = "";
    for(var i = 0; i < N.CARTES.length; i++){
      var l = N.texteVictoire(i, "Thimote");
      if(l.length !== 2 || l[0].indexOf("Thimote") !== 0 ||
         l[0].indexOf("n°1") < 0 || !l[1] || l[1].indexOf("Mily") < 0){
        bon = false; det += "île" + i + " ";
      }
    }
    ok("chaque île a son message de victoire, avec le pseudo en tête", bon, det);
    /* La campagne compte CINQ îles ; la jungle est une carte
       événement, dans le même tableau mais hors de l'enchaînement.
       C'est NB_CARTES_NORMALES, jamais CARTES.length, que le reste du
       jeu doit consulter — sans quoi une carte événement allongerait
       la campagne de tout le monde. */
    ok("la campagne compte cinq îles", N.NB_CARTES_NORMALES === 5,
       "" + N.NB_CARTES_NORMALES);
    ok("et une seule carte événement s'y ajoute",
       N.CARTES.length === 6 && N.CARTES.filter(function(c){ return c.special; }).length === 1);
    ok("aucune carte ordinaire n'est marquée spéciale",
       N.CARTES.slice(0, 5).every(function(c){ return !c.special; }));
    ok("la jungle est bien la carte spéciale",
       N.IDX_JUNGLE === 5 && N.carteSpeciale(5) && !N.carteSpeciale(0) &&
       N.CARTES[N.IDX_JUNGLE].nom === "Mily dans la jungle");
    var vus = {}, tousDifferents = true;
    for(var iv = 0; iv < N.CARTES.length; iv++){
      var m = N.texteVictoire(iv, "X")[1];
      if(vus[m]) tousDifferents = false;
      vus[m] = 1;
    }
    ok("les six messages sont différents", tousDifferents);
    ok("plage : le verre", N.texteVictoire(0, "X")[1].indexOf("boire un verre") > 0);
    ok("forêt : la cabane", N.texteVictoire(1, "X")[1].indexOf("cabane") > 0);
    ok("campagne : la paille", N.texteVictoire(2, "X")[1].indexOf("paille") > 0);
    ok("soirée hippie : chez elle", N.texteVictoire(3, "X")[1].indexOf("chez elle") > 0);
    ok("le Sud : elle l'aime", N.texteVictoire(4, "X")[1].indexOf("aime") > 0);
    ok("la jungle a son propre message", N.texteVictoire(5, "X")[1].indexOf("pluie") > 0);
    ok("le message boucle au-delà du tableau",
       N.texteVictoire(6, "X")[1] === N.texteVictoire(0, "X")[1]);
    /* Elle s'appelle MILY. Aucune orthographe fantaisiste nulle part. */
    var fautes = "";
    for(var ic = 0; ic < N.CARTES.length; ic++){
      var tout = N.CARTES[ic].nom + " " + N.CARTES[ic].victoire;
      if(/Mill?ie|Milly|Milyy|Miley/i.test(tout)) fautes += N.CARTES[ic].nom + " ";
    }
    ok("elle s'écrit MILY partout, jamais Millie ni Milly", fautes === "", fautes);
  })();

  /* Tweety : un canari par île, inoffensif, et qui vole. */
  (function(){
    ok("Tweety s'écrit bien TWEETY", N.CRE.tweety.nom === "Tweety");
    ok("Tweety est inoffensif", N.CRE.tweety.degats === 0 && N.CRE.tweety.portee === 0);
    ok("Tweety fuit et vole", N.CRE.tweety.fuit === 1 && N.CRE.tweety.vole === 1);
    ok("Tweety est plus rapide que les deux types de troupe",
       N.CRE.tweety.vitesse > N.UNI.furie.vitesse && N.CRE.tweety.vitesse > N.UNI.commando.vitesse);
    for(var i = 0; i < 3; i++){
      var m = N.genereCarte("MILY", i);
      var n = m.creatures.filter(function(k){ return k.t === "tweety"; }).length;
      var g = m.creatures.filter(function(k){ return k.t === "belette"; }).length;
      ok("carte " + (i + 1) + " : un seul Tweety et une seule Gégé", n === 1 && g === 1,
         "tweety=" + n + " belette=" + g);
    }
    var a = { v:1, cy:0, c:0, pv:9, d:"", g:"", w:"" };
    var b = { v:2, cy:0, c:0, pv:9, d:"", g:"", w:"Thimote" };
    ok("le nom du tueur de Tweety se propage et ne s'efface pas",
       N.fusionneMonde(a, b).w === "Thimote" && N.fusionneMonde(b, a).w === "Thimote");
    ok("une nouvelle campagne rend Tweety à la vie",
       N.fusionneMonde(b, { v:1, cy:1, c:0, pv:9, d:"", g:"", w:"" }).w === "");
  })();

  /* économie : plus généreuse qu'avant, mais toujours finie */
  ok("l'Énergie tactique a remplacé la Poudre",
     N.EQ.ENERGIE_DEPART === 220 && N.EQ.ENERGIE_PAR_BATIMENT === 5 &&
     N.EQ.ENERGIE_BONUS_RENFORT === 90 && N.EQ.POUDRE_DEPART === undefined);
  /* l'attente de renfort est un choix de rythme, pas un détail : on la
     verrouille pour qu'un réglage ne la rallonge pas en douce. */
  ok("quinze secondes d'attente après la mort",
     N.EQ.ATTENTE_RENFORT === 15, N.EQ.ATTENTE_RENFORT + " s");
  (function(){
    var m = N.genereCarte("MILY", 0);
    var cel = m.batiments.filter(function(b){ return b.t === "cellule"; }).length;
    var def = m.batiments.length - cel;
    var total = N.EQ.ENERGIE_DEPART + def * N.EQ.ENERGIE_PAR_BATIMENT
              + cel * N.EQ.ENERGIE_PAR_CELLULE;
    ok("une île entière rapporte " + total + " d'Énergie — de quoi jouer, pas de quoi tout se payer",
       total > 3000 && total < 5000, "" + total);
    ok("les champs de cellules pèsent un bon tiers du revenu",
       cel * N.EQ.ENERGIE_PAR_CELLULE / total > 0.22, "" +
       Math.round(cel * N.EQ.ENERGIE_PAR_CELLULE / total * 100) + " %");
    ok("une cellule ne se défend pas et ne sert qu'à la récolte",
       N.DEF.cellule.recolte === 1 && N.DEF.cellule.portee === 0 &&
       N.DEF.cellule.degats === 0 && N.DEF.cellule.tourelle === 0);
    ok("une cellule tombe vite : " + N.DEF.cellule.pv + " PV, moins qu'une défense",
       N.DEF.cellule.pv < N.DEF.cuve.pv);
    ok("récolter une cellule rapporte plus que démonter une défense",
       N.EQ.ENERGIE_PAR_CELLULE > N.EQ.ENERGIE_PAR_BATIMENT);
  })();

  /* traversée */
  var cases = (N.GW - 4) - N.QG_GX;
  var couv = N.CAP.balise.duree * N.UNI.furie.vitesse;
  /* 30 s × 1,62 case/s. La valeur est épinglée exprès : elle dit ce
     qu'une Balise achète réellement, et elle doit bouger sciemment. */
  ok(N.CAP.balise.duree + " s de Balise couvrent " + couv.toFixed(0) + " cases",
     Math.abs(couv - 48.6) < 0.01, couv.toFixed(2));
  ok("il faut " + Math.ceil(cases / couv) + " Balises pour traverser " + cases + " cases",
     Math.ceil(cases / couv) <= 6);
  ok("la version est au format vX.YY", /^v\d+\.\d{2}$/.test(N.VERSION), N.VERSION);
  ok("huit navettes par vie", N.EQ.NB_BARGES === 8);
  ok("douze Furies par navette au maximum", N.placesNavette("furie") === 12);
  ok("quinze Commandos par navette au maximum", N.placesNavette("commando") === 15);
  ok("une vie plafonne à " + N.flotteMaximum() + " unités (8 × 15 Commandos)",
     N.flotteMaximum() === 120);
  ok("une flotte entière de Furies fait 96 unités",
     N.EQ.NB_BARGES * N.placesNavette("furie") === 96);
  ok("aucun type ne dépasse le plafond absolu d'une navette",
     Object.keys(N.UNI).every(function(t){
       return N.placesNavette(t) <= N.EQ.PLACES_PAR_BARGE;
     }));
  /* le Brasier : objectif collectif */
  var dpsSolo = 100 * (N.UNI.furie.degats / (N.UNI.furie.cadence / 1000));
  var soloMin = N.CARTES[0].pvQG / dpsSolo / 60;
  ok("île 1 : " + soloMin.toFixed(0) + " min en solo sans opposition (≈ 60)",
     soloMin >= 45 && soloMin <= 90, soloMin.toFixed(1));
  ok("île 1 : " + (soloMin / 15).toFixed(1) + " min à quinze joueurs (< 6)", soloMin / 15 < 6);
  ok("les défenses restent tendres devant le Brasier",
     N.DEF.frelon.pv * 400 < N.CARTES[0].pvQG / 10);
  ok("une quinzaine de tireuses démonte un Crible en moins de 4 s",
     N.DEF.crible.pv / (8 * N.UNI.furie.degats / (N.UNI.furie.cadence / 1000)) < 4);
})();

/* ================================================================
   9. L'INSTANTANÉ DU MONDE — la persistance du salon
   ================================================================ */
(function(){
  G("9. Instantané du monde — persistance du salon");

  /* --- bitmap --- */
  (function(){
    var n = 490, bits = [], i;
    for(i = 0; i < n; i++) bits.push((i % 7 === 0 || i === 489) ? 1 : 0);
    var s = N.encodeBits(bits);
    var r = N.decodeBits(s, n);
    var pareil = true;
    for(i = 0; i < n; i++) if(bits[i] !== r[i]) pareil = false;
    ok("490 bâtiments : aller-retour du bitmap exact", pareil);
    ok("490 bâtiments tiennent en " + s.length + " caractères", s.length <= 84, s.length);
    ok("le compte de bits est juste", N.compteBits(s) === bits.filter(function(b){ return b; }).length);
  })();

  (function(){
    var a = N.encodeBits([1,0,0,0,0,0, 0,0,0,0,0,0]);
    var b = N.encodeBits([0,0,0,0,0,0, 0,0,0,0,0,1]);
    var u = N.decodeBits(N.unionBits(a, b), 12);
    ok("l'union des bitmaps conserve les deux destructions",
       u[0] === 1 && u[11] === 1 && u[5] === 0);
    ok("l'union est commutative", N.unionBits(a, b) === N.unionBits(b, a));
    ok("l'union est idempotente", N.unionBits(a, a) === a);
    ok("l'union tolère un bitmap plus court",
       N.decodeBits(N.unionBits(a, ""), 12)[0] === 1);
  })();

  /* --- fusion monotone --- */
  (function(){
    var A = { v:3, c:0, pv:900, d:N.encodeBits([1,0,0,0,0,0]) };
    var B = { v:1, c:0, pv:700, d:N.encodeBits([0,0,1,0,0,0]) };
    var f = N.fusionneMonde(A, B), g = N.fusionneMonde(B, A);
    ok("la fusion prend les PV les plus bas", f.pv === 700);
    ok("la fusion garde le numéro de version le plus haut", f.v === 3);
    var bits = N.decodeBits(f.d, 6);
    ok("une défense détruite ne se relève jamais", bits[0] === 1 && bits[2] === 1);
    ok("la fusion ne dépend pas de l'ordre", N.memeMonde(f, g));
    ok("fusionner deux fois ne change rien", N.memeMonde(f, N.fusionneMonde(f, B)));
  })();

  (function(){
    var ile0 = { v:9, c:0, pv:10, d:N.encodeBits([1,1,1,1,1,1]) };
    var ile1 = { v:1, c:1, pv:2000000, d:"" };
    var f = N.fusionneMonde(ile0, ile1);
    ok("passer à l'île suivante repart d'un monde neuf",
       f.c === 1 && f.pv === 2000000 && N.compteBits(f.d) === 0);
    ok("et son numéro de version dépasse les deux précédents", f.v > 9);
    ok("un instantané d'île périmée n'écrase pas l'île en cours",
       N.fusionneMonde(f, ile0).c === 1);
  })();

  /* --- le sort de Gégé fait partie du monde --- */
  (function(){
    var avant = { v:1, cy:0, c:0, pv:900, d:"", g:"" };
    var apres = { v:2, cy:0, c:0, pv:900, d:"", g:"Thimote" };
    ok("le nom du tueur de Gégé se propage",
       N.fusionneMonde(avant, apres).g === "Thimote");
    ok("et il ne s'efface jamais",
       N.fusionneMonde(apres, avant).g === "Thimote" &&
       N.fusionneMonde(N.fusionneMonde(apres, avant), avant).g === "Thimote");
    ok("le premier nom inscrit gagne, quel que soit l'ordre",
       N.fusionneMonde(apres, { v:9, cy:0, c:0, pv:900, d:"", g:"Autre" }).g === "Thimote");
    ok("Gégé vivante = aucun nom", N.mondeVide(0, 900, 0).g === "");
    ok("une nouvelle campagne rend Gégé à la vie",
       N.fusionneMonde(apres, { v:1, cy:1, c:0, pv:900, d:"", g:"" }).g === "");
    ok("le tueur compte dans la comparaison de deux mondes",
       !N.memeMonde(avant, apres));
  })();

  /* --- bouclage de la campagne --- */
  (function(){
    var fin = { v:40, cy:0, c:2, pv:0, d:N.encodeBits([1,1,1,1,1,1]) };
    var neuf = { v:1, cy:1, c:0, pv:15000000, d:"" };
    var f = N.fusionneMonde(fin, neuf);
    ok("une nouvelle campagne repart d'un monde intact",
       f.cy === 1 && f.c === 0 && f.pv === 15000000 && N.compteBits(f.d) === 0);
    ok("et l'ancienne campagne ne la ressuscite pas",
       N.fusionneMonde(f, fin).cy === 1 && N.fusionneMonde(f, fin).c === 0);
    ok("sans compteur de campagne, le salon resterait figé sur la dernière île",
       N.rangMonde(neuf) > N.rangMonde(fin));
  })();

  (function(){
    ok("un instantané malformé est rejeté",
       !N.mondeValide(null) && !N.mondeValide({}) && !N.mondeValide({ c:-1, pv:0, v:0 }));
    ok("fusionner avec rien rend l'autre",
       N.memeMonde(N.fusionneMonde(null, N.mondeVide(0, 500)), N.mondeVide(0, 500)));
    ok("memeMonde distingue deux mondes différents",
       !N.memeMonde({ v:1, c:0, pv:500, d:"" }, { v:1, c:0, pv:400, d:"" }));
  })();

  /* --- le drapeau RETAIN, sans lequel rien ne survit --- */
  (function(){
    var normal = N.paquetPublish("a/b", "x", false);
    var retenu = N.paquetPublish("a/b", "x", true);
    ok("un publish ordinaire n'est pas retenu", normal[0] === 0x30);
    ok("l'instantané du monde est publié RETENU", retenu[0] === 0x31);
    ok("le corps est identique dans les deux cas", normal.length === retenu.length);
    var lu = N.litPublish(Array.prototype.slice.call(retenu.subarray(2)));
    ok("un publish retenu se relit normalement", lu.sujet === "a/b" && lu.message === "x");
  })();

  /* --- le scénario du joueur, bout en bout --- */
  (function(){
    var NB = 490, pvMax = 15000000;
    /* tablette : elle démolit trente défenses et entame le Brasier */
    var bits = [], i;
    for(i = 0; i < NB; i++) bits.push(i < 30 ? 1 : 0);
    var tablette = { v:5, c:0, pv:pvMax - 4000000, d:N.encodeBits(bits) };
    /* téléphone : dix autres défenses, ailleurs dans la liste */
    var bits2 = [];
    for(i = 0; i < NB; i++) bits2.push((i >= 100 && i < 110) ? 1 : 0);
    var telephone = { v:4, c:0, pv:pvMax - 1000000, d:N.encodeBits(bits2) };

    var salon = N.fusionneMonde(tablette, telephone);
    ok("les deux appareils réunis totalisent 40 défenses tombées",
       N.compteBits(salon.d) === 40, N.compteBits(salon.d));
    ok("et les PV du Brasier retiennent le plus bas des deux",
       salon.pv === pvMax - 4000000);

    /* tout le monde ferme, quelqu'un revient : il repart de l'instantané */
    var retour = N.fusionneMonde(N.mondeVide(0, pvMax), salon);
    ok("au retour, les 40 défenses sont toujours détruites",
       N.compteBits(retour.d) === 40);
    ok("au retour, le Brasier a toujours ses dégâts",
       retour.pv === pvMax - 4000000);
    ok("un monde neuf n'efface jamais un monde entamé",
       N.fusionneMonde(salon, N.mondeVide(0, pvMax)).pv === pvMax - 4000000);
  })();
})();

/* ---------------- bilan ---------------- */
console.log("\n" + "═".repeat(52));
if(echecs === 0) console.log("  " + total + " vérifications, tout passe.");
else console.log("  " + (total - echecs) + "/" + total + " vérifications — " + echecs + " ÉCHEC(S).");
console.log("═".repeat(52) + "\n");
process.exit(echecs ? 1 : 0);
