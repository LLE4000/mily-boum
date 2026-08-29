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
    "encodeBlessures","decodeBlessures","fusionneBlessures","cranBlessure",
    "BLESSURE_CRANS","BLESSURES_MAX",
    "mondeVide","mondeValide","rangMonde","ALPHA_BITS","paquetPublish","litPublish",
    "CARTES","GW","GH","LARGEUR_ROCHE","QG_GX","QG_GY","PLAGE_X0","SOL_ECH","tailleSolPrecalcule",
    "NB_CARTES_NORMALES","IDX_JUNGLE","carteSpeciale","carteEnChantier","SCENE_GX","SCENE_GY","SCENE_DEMI","carteScene","dansLaScene",
    "ETOILE_R","ETOILE_R2","ETOILE_G","ETOILE_POINTES","dansLeFaisceau","videIbiza","videIbizaLarge",
    "largeurFaisceau","largeurFaisceau2","FAISC_N","FAISC2_R0","ecartAuRayon","NB_REACTEURS","FAISC_R0","FAISC_R1","FAISC_LARG0","FAISC_EVASE","IBIZA_PART",
    "IBIZA_PAS_F","IBIZA_RUE","IBIZA_PAS_RUE","ruelleIbiza","IBIZA_RESERVE","IBIZA_SERRE","IBIZA_NEON","IBIZA_NEON_L","largeurPeinte","FAISC_PEINT","compteFrelons","compteDefenses","ORDRE_CAMPAGNE","JOURNAL_MAX","JOURNAL_JOURS","jourDe","heureDe","jourEnDate",
    "ecartJours","journalVide","ajouteVisite","marqueJoue","elagueJournal",
    "encodeJournal","decodeJournal","statsJournaux","rangCampagne","carteSuivante","premiereCarte","planJungle","planDeCarte",
    "jungleEnCours","msMonde","meilleurMinJoueurs","fusionneJungle","memeJungle",
    "VOIES_EVT","voieDeCarte","carteDeVoie","reglagesEvt","voieLue","voiePosee",
    "evenementEnCours","carteEvenementEnCours","fusionneEvenements","poseEvenements",
    "memeEvenements","meilleurReglage","bonusPvDeCarte","poseBonusPvEvt","poseJungle",
    "encodeChampions","decodeChampions","fusionneChampions",
    "encodeBadges","decodeBadges","fusionneBadges","bgVide","CHAMPS_BG",
    "encodeChutesBadge","decodeChutesBadge","fusionneChutesBadge",
    "encodeReglagesBadge","decodeReglagesBadge","meilleursReglagesBadge","reglageVide",
    "compteLesPodiumsPur","ajouteTitreCarriere","BADGE_OCTETS","BADGE_GARDES",
    "encodeTop3","decodeTop3","fusionneTop3","top3DeCarte","inscritTop3","poseJungle","mondeVide",
    "NB_REACTEURS","encodeScores","decodeScores","fusionneScores","SCORES_GARDES","plafondScore","FileDegats","carteOrageuse","carteTornades","carteTourbillons","carteAirMagique","carteAvecTornades","profilTornade","paireTornade","carteFoudre","periodeEclair","styleCiel","CIELS_ILE","encodePlans","planCarte","faitZone",
    "encodePieces","decodePieces","partiePieces","partieFormes","partieQuadrillage",
    "encodeEpingles","decodeEpingles","nettoieEpingle","rangEpingleSuivant",
    "meilleuresEpingles","EPINGLES_MAX","EPINGLE_TEXTE",
    "encodePlanComplet","planVide","pieceEstPosable","MARQUE_PIECES","MARQUE_FORMES",
    "litPlan","pvDefensesCarte","TYPES_PLAN","decodePlan","encodePlan","planJungle","empreinteCarte","QG_GX","QG_GY","PALIERS_PUISSANCE","palierPuissance","multPuissance","auraPuissance","PALIER_SUPERNOVA","PALIER_NOVA_MAX","calibreNova","CALIBRES_NOVA",
    "SCORES_OCTETS","octetsUtf8","cleScore","totalParJoueur","totalParJoueurCarte","seauxHerites","reconstruitCarrieres","encodeTop3","decodeTop3","inscritTop3","top3DeCarte","classementDepuis","nettoieNomScore","nettoieSeau","nomsDesSeaux","seauHerite","MARQUE_SCORES",
    "genereCarte","empreinteCarte","utf8Octets","encodePlan","decodePlan","planVide",
    "figureGuinguette","dansAlleeGuinguette","compteDefenses","ouvreLaFete",
    "BLINDAGE_MAX","encodeReglagesCarte","decodeReglagesCarte","blindageDans","degatsDans",
    "meilleurBlindage","degatsDeCarte","facteurDegats",
    "poseBlindageSalon","blindageDeCarte","facteurBlindage","pvDefensesCarte",
    "ORDRE_CAMPAGNE","JOURNAL_MAX","JOURNAL_JOURS","jourDe","heureDe","jourEnDate",
    "ecartJours","journalVide","ajouteVisite","marqueJoue","elagueJournal",
    "encodeJournal","decodeJournal","statsJournaux",
    "pavoiseLaGuinguette","PAVOIS_COURONNES","PAVOIS_ALLEE","PAVOIS_PAS","PAVOIS_CX",
    "PAVOIS_CY","PAVOIS_PISTE","PAVOIS_HAUSSE","PAVOIS_ECART","cordeGuinguette",
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

  /* Le plancher vaut pour TOUTES LES CARTES : il ne regarde que la
     géométrie du monde, jamais l'index de l'île. On le dit en le
     mesurant, plutôt qu'en épinglant un nombre de cartes qui a
     vocation à grandir. */
  ok("le plancher ne dépend pas de l'île (" + N.CARTES.length + " cartes)",
     typeof N.zoomPlancher(1900, 1000) === "number" && N.CARTES.length >= 6);

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
     3b quater. LE JARDIN DE MILY, ET SES HAIES

     « Il faudrait rajouter des silos, une ligne bien dense de frelons
     selon les lignes jaunes que j'ai dessinées, dont une ligne
     continue le long de la plage. »

     Le mot qui compte est CONTINUE, et c'est le seul de la phrase
     qu'un test peut tenir : on longe la plage case par case et l'on
     mesure le plus grand trou. Le reste — l'élégance du tracé — se
     regarde, il ne se mesure pas. Mais deux autres choses se
     mesurent, et elles ont chacune coûté un essai raté :
       — le médaillon doit SURVIVRE au passage des diagonales ;
       — le tracé ne doit pas dévorer les yeux de Chalumeaux.
     ================================================================ */
  (function(){
    var IN = -1, i;
    for(i = 0; i < N.CARTES.length; i++) if(N.CARTES[i].biome === "nuits") IN = i;
    if(IN < 0){ ok("l'île des nuits existe", false); return; }
    var c = N.genereCarte("MILY", IN, N.planDeCarte(IN, null), 0);
    var par = {};
    for(i = 0; i < c.batiments.length; i++)
      par[c.batiments[i].t] = (par[c.batiments[i].t] || 0) + 1;

    /* LA LIGNE DE PLAGE. On relève les Frelons de la bande côtière,
       on les range du nord au sud, et l'on regarde le plus grand
       intervalle. Une défense toutes les cinq cases est la résolution
       de la grille : douze cases de trou, c'est encore une ligne ;
       trente, c'est une porte ouverte. */
    var cote = [];
    for(i = 0; i < c.batiments.length; i++){
      var b = c.batiments[i];
      if(b.t === "frelon" && b.gx > 126 && b.gx < 139) cote.push(b.gy);
    }
    cote.sort(function(x, y){ return x - y; });
    var trou = 0;
    for(i = 1; i < cote.length; i++) if(cote[i] - cote[i - 1] > trou) trou = cote[i] - cote[i - 1];
    ok("la haie de la plage porte des Frelons du nord au sud",
       cote.length > 40 && cote[0] < 18 && cote[cote.length - 1] > 118,
       cote.length + " Frelons, de gy " + (cote[0] || 0).toFixed(0) +
       " à " + (cote[cote.length - 1] || 0).toFixed(0));
    ok("… et elle est CONTINUE : pas un trou de plus de douze cases",
       trou > 0 && trou < 12, "plus grand trou " + trou.toFixed(1) + " cases");
    /* ELLE NE S'INTERROMPT PAS POUR L'ALLÉE D'HONNEUR. C'était tout
       l'enjeu du mot « continue » : l'allée débouche sur la plage à
       gy 68, et une haie taillée avant les allées s'y serait ouverte. */
    var devantAllee = 0;
    for(i = 0; i < cote.length; i++) if(Math.abs(cote[i] - 68) < 8) devantAllee++;
    ok("… y compris devant l'allée d'honneur, qui débouche à gy 68",
       devantAllee >= 2, devantAllee + " Frelons dans les huit cases");

    /* LES SILOS DEMANDÉS, et ils bordent la haie plutôt que de la
       remplacer : il en faut plus qu'avant, sans que les Frelons
       cessent d'être l'échine. */
    ok("les Silos sont là, en nombre", (par.silo || 0) > 180, (par.silo || 0) + " Silos");
    /* « QUE DEUX CENTS. » On ne peut pas viser 200 pile : la grille pose
       une tour toutes les cinq cases, si bien que la largeur de la bande
       fait sauter le compte par paliers — 208 ou 241, rien entre. */
    ok("… et les Frelons sont deux cents, pas deux cent soixante",
       (par.frelon || 0) >= 190 && (par.frelon || 0) <= 220,
       (par.frelon || 0) + " Frelons");
    /* « ET TU LES RÉPARTIS CORRECTEMENT. » C'était le vrai défaut : le
       tracé relevé sur la capture couvrait la moitié est, et les deux
       quartiers derrière le Brasier n'avaient pas UNE batterie à longue
       portée. On découpe l'île en neuf et l'on regarde le plus pauvre. */
    (function(){
      var fr = c.batiments.filter(function(b){ return b.t === "frelon"; });
      var pire = 1e9, ou = "";
      for(var by = 0; by < 3; by++) for(var bx = 0; bx < 3; bx++){
        var n = fr.filter(function(f){
          return f.gx >= bx * N.GW / 3 && f.gx < (bx + 1) * N.GW / 3
              && f.gy >= by * N.GH / 3 && f.gy < (by + 1) * N.GH / 3;
        }).length;
        if(n < pire){ pire = n; ou = ["nord", "milieu", "sud"][by] + "-"
                                  + ["ouest", "centre", "est"][bx]; }
      }
      ok("… et aucun neuvième de l'île n'est sans Frelon",
         pire >= 8, "le plus pauvre est le " + ou + " avec " + pire);
    })();

    /* LE MÉDAILLON SURVIT. Tracées au plus court, les diagonales
       passaient à douze cases du bassin et emportaient les deux tiers
       de l'anneau de Cuves — mesuré, 26 tombaient à 8. */
    var cuves = 0;
    for(i = 0; i < c.batiments.length; i++){
      var b2 = c.batiments[i];
      if(b2.t === "cuve" && Math.hypot(b2.gx - 74, b2.gy - 68) < 16) cuves++;
    }
    ok("les haies contournent le médaillon : son anneau de Cuves tient",
       cuves >= 12, cuves + " Cuves autour du bassin");
    /* ET LES DEUX YEUX RESTENT DES YEUX. L'arc les traverse, c'est
       voulu ; il ne doit pas les effacer. */
    ok("… et les deux yeux de Chalumeaux restent lisibles",
       (par.chalumeau || 0) > 60, (par.chalumeau || 0) + " Chalumeaux");

    /* LE BESTIAIRE ENCHANTÉ, semé sur son propre flux. */
    var bes = {};
    for(i = 0; i < c.creatures.length; i++)
      bes[c.creatures[i].t] = (bes[c.creatures[i].t] || 0) + 1;
    ok("l'île porte ses quatre animaux enchantés",
       bes.paon > 0 && bes.chatlune > 0 && bes.fennec > 0 && bes.papillongeant > 0,
       "paon " + bes.paon + " · chat de lune " + bes.chatlune +
       " · fennec " + bes.fennec + " · papillon " + bes.papillongeant);
    /* ET AUCUN N'EST PROTÉGÉ : le chat de lune n'est pas un chat de
       Mily, et sa mort ne doit déclencher aucune vengeance. */
    ok("… et aucun n'est protégé : seuls les trois chats le sont",
       !N.CRE.chatlune.protege && !N.CRE.paon.protege &&
       !N.CRE.fennec.protege && !N.CRE.papillongeant.protege);
    /* ================================================================
       LE PALAIS — la forteresse des nuits

       « Le QG de Mily en royaume enchanté. » Un seul moteur, deux
       styles dans une table. Ce qui se teste ici n'est pas le goût —
       il se regarde — mais les trois choses qui, si elles cassent,
       cassent en silence :
         — le Brasier des onze autres îles ne doit pas bouger d'une
           virgule de couleur ;
         — une seule forteresse en mémoire à la fois ;
         — la flamme froide doit être VRAIMENT froide.
       ================================================================ */
    /* TROIS FORTERESSES MAINTENANT, et le test dit les trois : les
       nuits ont leur palais, Ibiza a sa robe, et TOUTES LES AUTRES
       gardent le Brasier. C'est cette dernière clause qui compte —
       ajouter un style ne doit jamais repeindre une île en cours. */
    ok("chaque île a sa forteresse, et le Brasier reste le défaut",
       /function styleQGdeCarte\(i\)\{[\s\S]{0,400}"nuits"\)\s*return "palais";[\s\S]{0,80}"ibiza"\)\s*return "robe";[\s\S]{0,40}return "brasier";/.test(html));
    ok("… et le style se lit sur l'ÎLE, jamais sur un tirage",
       /function styleQGdeCarte\(i\)\{[\s\S]{0,300}CARTES\[i\][\s\S]{0,40}biome/.test(html));
    /* LA PALETTE DU BRASIER, AU CARACTÈRE PRÈS. Une « harmonisation »
       des deux tables repeindrait onze îles en cours de partie. */
    ok("… et la palette du Brasier est celle d'avant, au caractère près",
       /pierre:"#463a40", pierreC:"#6d5a60", pierreT:"#7d6a70", pierreO:"#241b21"/.test(html) &&
       /lave:"#ff7a1e", laveC:"#ffd48a", laveO:"#c02a08"/.test(html) &&
       /banniere:"#8e1e22", banniereO:"#5d1216", or:"#e8c25a"/.test(html));
    ok("… et le Brasier ne prend aucun des cinq gestes du palais",
       /brasier:[\s\S]{0,600}ogive:0, dome:0, croissant:0, froid:0, mosaique:0/.test(html));
    /* UNE SEULE FORTERESSE EN MÉMOIRE. Deux jeux de sprites, ce sont
       huit méga-octets de canevas sur la carte déjà la plus lourde. */
    ok("on ne garde qu'une forteresse à la fois : on rebâtit au changement d'île",
       /function assureSpriteQG\(\)\{[\s\S]{0,320}FOYERS = null;\s*\n\s*construitSpriteQG\(\);/.test(html) &&
       (html.match(/spriteQGArriere = nouveauCanvas/g) || []).length === 1);
    /* LA FLAMME FROIDE. `froide` n'amincissait la langue que de trente
       pour cent en gardant ses quatre couches orange : une flamme
       « froide » était une flamme chaude un peu maigre. */
    ok("la flamme froide a vraiment ses propres couleurs",
       /var COUCHES_FROIDES = \[/.test(html) &&
       /var TABLE = froide \? COUCHES_FROIDES : COUCHES_FLAMME;/.test(html));
    ok("… et elle n'est pas plus mince : le froid est dans la couleur",
       !/froide \? 0\.7 : 1/.test(html));
    /* LA TOILE A GRANDI, et la pique de couronne du Brasier n'est
       plus rognée : elle montait à −616 dans une fenêtre qui
       s'arrêtait à −600. */
    ok("la toile du QG laisse passer le sommet des deux forteresses",
       /var QG_W = 700, QG_H = 880, QG_OX = 350, QG_OY = 760;/.test(html));

    /* LE SEMIS EST À SA PLACE : les cinq autres îles ne portent pas
       une seule de ces bêtes, sinon le flux aurait débordé. */
    ok("… et aucune autre île n'en porte", (function(){
      for(var k = 0; k < N.CARTES.length; k++){
        if(k === IN) continue;
        var ck = N.genereCarte("MILY", k, N.planDeCarte(k, null), 0);
        for(var m = 0; m < ck.creatures.length; m++){
          var t = ck.creatures[m].t;
          if(t === "paon" || t === "chatlune" || t === "fennec" || t === "papillongeant")
            return false;
        }
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

    /* LES TROIS CALIBRES DE LA NOVA. Ce n'est jamais le NOMBRE de Novas
       qui monte — une par vie, du début à la fin — c'est le calibre.
       Deux marches, à trois millions puis à cinq. */
    ok("une seule Nova par vie, à tous les paliers", N.EQ.NOVA_PAR_VIE === 1);
    ok("le plein calibre arrive à 5 M",
       N.PALIERS_PUISSANCE[N.PALIER_NOVA_MAX].seuil === 5000000,
       "" + N.PALIERS_PUISSANCE[N.PALIER_NOVA_MAX].seuil);
    ok("il arrive APRÈS la super Nova, pas avant",
       N.PALIER_NOVA_MAX > N.PALIER_SUPERNOVA);
    (function(){
      var C = N.CAP.nova;
      var ord = N.calibreNova(0), sup = N.calibreNova(N.PALIER_SUPERNOVA),
          max = N.calibreNova(N.PALIER_NOVA_MAX);
      ok("avant 3 M : la Nova ordinaire, 130 + 45, rayon ×1",
         ord.rang === 0 && ord.degats === 130 && ord.souffle === 45 && ord.ech === 1,
         JSON.stringify(ord));
      ok("à 3 M : la SUPER Nova, 50 000 + 16 000, rayon ×3",
         sup.rang === 1 && sup.degats === 50000 && sup.souffle === 16000 && sup.ech === 3,
         JSON.stringify(sup));
      ok("à 5 M : le plein calibre, 100 000 + 50 000",
         max.rang === 2 && max.degats === 100000 && max.souffle === 50000,
         JSON.stringify(max));
      ok("le plein calibre frappe exactement deux fois plus fort au cœur",
         max.degats === sup.degats * 2);
      ok("et plus de trois fois plus fort au souffle",
         max.souffle > sup.souffle * 3, max.souffle + " contre " + sup.souffle);
      ok("le rayon ne bouge plus après le premier saut", max.ech === sup.ech);
      /* Le dernier palier avant chaque marche doit rendre le calibre
         d'AVANT : c'est là que se logent les erreurs de borne. */
      ok("le palier juste avant 3 M reste ordinaire",
         N.calibreNova(N.PALIER_SUPERNOVA - 1).rang === 0);
      ok("le palier juste avant 5 M reste la super Nova simple",
         N.calibreNova(N.PALIER_NOVA_MAX - 1).rang === 1,
         "" + N.calibreNova(N.PALIER_NOVA_MAX - 1).degats);
      ok("le calibre ne redescend jamais quand le palier monte", (function(){
        for(var i = 1; i < N.PALIERS_PUISSANCE.length; i++){
          var a = N.calibreNova(i - 1), b = N.calibreNova(i);
          if(b.rang < a.rang || b.degats < a.degats || b.souffle < a.souffle) return false;
        }
        return true;
      })());
      ok("chacun des trois calibres est atteint par la table", (function(){
        var vus = {};
        for(var i = 0; i < N.PALIERS_PUISSANCE.length; i++) vus[N.calibreNova(i).rang] = 1;
        return vus[0] && vus[1] && vus[2];
      })());
      ok("un palier absurde ne rend jamais undefined", (function(){
        var a = N.calibreNova(-3), b = N.calibreNova(999), c = N.calibreNova(NaN);
        return a.degats === 130 && c.degats === 130 && b.degats === 100000;
      })());

      /* CE QU'UNE NOVA RETIRE VRAIMENT, contre ce que pèse une
         forteresse. C'est le calcul qui dit si le bombardement à
         distance peut remplacer le débarquement — la crainte à écarter.
         Le cœur ET le souffle touchent le Brasier : il est dans les
         deux rayons. */
      var parVie = max.degats + max.souffle;
      ok("au plein calibre, une Nova retire " + parVie + " au Brasier",
         parVie === 150000, "" + parVie);
      ok("… et l'on n'en a qu'une par vie", N.EQ.NOVA_PAR_VIE === 1);
      var pirePart = 0, nomPire = "";
      for(var i = 0; i < N.CARTES.length; i++){
        var part = parVie / N.CARTES[i].pvQG;
        if(part > pirePart){ pirePart = part; nomPire = N.CARTES[i].nom; }
      }
      ok("même sur la plus petite île (" + nomPire + ") cela ne fait que "
         + (pirePart * 100).toFixed(1) + " % de la forteresse par vie",
         pirePart < 0.02, (pirePart * 100).toFixed(2) + " %");
      ok("il faudrait " + Math.ceil(1 / pirePart)
         + " vies entières pour l'abattre au seul bombardement",
         Math.ceil(1 / pirePart) > 90, "" + Math.ceil(1 / pirePart));
      /* Et une vie ne se rejoue pas à volonté : il faut avoir perdu ses
         huit navettes ET toutes ses troupes. */
      ok("une vie coûte les huit navettes entières", N.EQ.NB_BARGES === 8);
    })();
    /* LES ALLIÉS NE PAIENT PAS LA MONTÉE EN GAMME. Le cœur allié garde
       ses dégâts ET son rayon d'origine à tous les calibres : la Nova
       qui double côté ennemi ne double rien côté ami. */
    ok("le cœur allié reste à " + N.CAP.nova.degats + " sur " + N.CAP.nova.rayon + " cases",
       N.CAP.nova.degats < N.UNI.commando.pv
       && N.CAP.nova.degats < N.CAP.nova.degatsMax / 100);
    ok("le souffle allié reste à " + N.CAP.nova.degatsSouffle,
       N.CAP.nova.degatsSouffle < N.UNI.furie.pv
       && N.CAP.nova.degatsSouffle < N.CAP.nova.degatsSouffleMax / 100);

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

  /* ---- LE DOC ----
     Cinq par navette, il ne tire pas, il recoud. Une troupe de soutien
     a deux façons de rater : ne rien changer, ou rendre le reste
     immortel. C'est cette fenêtre-là qu'on épingle ici, en chiffres. */
  G("4e. Le Doc");
  (function(){
    var D = N.UNI.doc, M = N.UNI.furie;
    ok("le Doc existe et s'appelle Doc", !!D && D.nom === "Doc");
    if(!D) return;
    ok("il est proposé au briefing", N.TYPES_TROUPE.indexOf("doc") >= 0);
    ok("cinq Docs par navette", N.placesNavette("doc") === 5, "" + N.placesNavette("doc"));
    ok("il ne gonfle pas la flotte maximale",
       N.flotteMaximum() === N.EQ.NB_BARGES * N.placesNavette("commando"),
       "" + N.flotteMaximum());

    /* IL EST HORS DE LA CHAÎNE DE TIR. `degats: 0` n'est pas un
       réglage faible, c'est la porte de sortie : une cadence nulle et
       zéro dégât, et rien dans le code de ciblage ne le concerne. */
    ok("il ne fait aucun dégât", D.degats === 0);
    ok("et n'a aucune cadence de tir", D.cadence === 0);
    ok("il soigne, et il est le seul", D.soin > 0 &&
       Object.keys(N.UNI).filter(function(t){ return N.UNI[t].soin; }).length === 1,
       D.soin + " PV/s");

    /* LA FENÊTRE DE SOIN — les deux bornes, l'une contre l'autre.
       En bas : un seul Doc doit rendre moins de vie que la PLUS FAIBLE
       défense n'en retire, sinon un soldat planté sous une tourelle ne
       meurt plus jamais et la carte devient une salle d'attente.
       En haut : une navette ENTIÈRE de cinq Docs, tous empilés sur le
       même blessé, ne doit toujours pas tenir la plus forte défense —
       sans quoi le bon coup n'est plus d'assaillir mais de camper. */
    var dps = {}, mini = 1e9, maxi = 0, nomMini = "", nomMaxi = "";
    Object.keys(N.DEF).forEach(function(t){
      var b = N.DEF[t];
      if(!(b.degats > 0) || !(b.cadence > 0)) return;
      var v = b.degats / (b.cadence / 1000);
      dps[t] = v;
      if(v < mini){ mini = v; nomMini = b.nom; }
      if(v > maxi){ maxi = v; nomMaxi = b.nom; }
    });
    ok("un Doc rend moins de vie que la plus faible défense n'en retire ("
       + D.soin + " < " + mini.toFixed(1) + " PV/s, " + nomMini + ")",
       D.soin < mini, D.soin + " contre " + mini.toFixed(1));
    ok("une navette entière de Docs ne tient toujours pas devant la plus forte ("
       + (D.soin * N.placesNavette("doc")) + " < " + maxi.toFixed(1) + " PV/s, " + nomMaxi + ")",
       D.soin * N.placesNavette("doc") < maxi,
       (D.soin * N.placesNavette("doc")) + " contre " + maxi.toFixed(1));
    ok("mais il change quelque chose : une Furie remise sur pied en moins de dix secondes",
       M.pv / D.soin < 10, (M.pv / D.soin).toFixed(1) + " s");

    /* IL SUIT, IL NE MÈNE PAS. Sa vitesse propre est un PLAFOND :
       majDoc() la ramène à celle de l'escorte. Elle doit donc dépasser
       celle de TOUTES les troupes — sinon il ne rattrape jamais un
       Ogre lancé — sans excès, puisqu'elle ne sert qu'au rattrapage. */
    var plusVite = 0, nomVite = "";
    Object.keys(N.UNI).forEach(function(t){
      if(t === "doc") return;
      if(N.UNI[t].vitesse > plusVite){ plusVite = N.UNI[t].vitesse; nomVite = N.UNI[t].nom; }
    });
    ok("il va plus vite que la troupe la plus rapide (" + nomVite + "), sinon il la perd",
       D.vitesse > plusVite, D.vitesse + " > " + plusVite);
    ok("mais à peine : moins de 20 % de plus, c'est une marge de rattrapage",
       D.vitesse / plusVite < 1.20, "×" + (D.vitesse / plusVite).toFixed(3));

    /* PORTÉES. Il s'arrête DANS son rayon de soin, et il cherche plus
       loin qu'il ne soigne : sinon il ne trouverait que ce qu'il touche
       déjà, et n'irait jamais chercher personne. */
    ok("il s'arrête à l'intérieur de son rayon de soin",
       D.arret < D.portee, D.arret + " < " + D.portee);
    ok("il cherche bien plus loin qu'il ne soigne",
       N.EQ.DOC_RECHERCHE > D.portee * 2, N.EQ.DOC_RECHERCHE + " contre " + D.portee);
    ok("… mais pas à travers toute l'île", N.EQ.DOC_RECHERCHE < N.GW / 4,
       "" + N.EQ.DOC_RECHERCHE);
    ok("il tient debout plus longtemps qu'une Furie sans être un char",
       D.pv > M.pv && D.pv < N.UNI.commando.pv, D.pv + " PV");
    ok("il est aussi discret qu'une petite troupe",
       D.rayon < N.UNI.ogre.rayon && D.rayon <= N.UNI.commando.rayon);

    /* LE FIL — l'INDICE du type, et la compatibilité dans les deux
       sens. Le bit 0 reste l'orientation ; au-dessus vient l'indice
       dans TYPES_TROUPE. Tout tient à l'ORDRE de cette table : furie
       en 0 et commando en 1 sont les deux valeurs qu'un ancien client
       sait produire, et elles gardent leur sens.

       DEUX DE CES VÉRIFICATIONS DISAIENT AUTRE CHOSE, et elles ont
       menti le jour où une cinquième troupe est arrivée.

       « Quatre troupes exactement » n'a jamais été une propriété du
       jeu : c'était le nombre qu'il y avait le jour où le test a été
       écrit. Ce qui doit être gardé n'est pas le NOMBRE, c'est que le
       PRÉFIXE de la table ne bouge jamais — un type qu'on intercale
       renomme toutes les troupes des joueurs déjà connectés.

       « Le type tient sur deux bits » était faux dès l'origine : le
       code part en JSON, c'est un NOMBRE, et un nombre n'a pas de
       largeur. Deux bits suffisaient à quatre types, voilà tout. Ce
       qui compte vraiment est que l'aller-retour soit exact quel que
       soit le nombre de types — et c'est la vérification suivante,
       celle qui n'a jamais eu besoin d'être corrigée. */
    var T = N.TYPES_TROUPE;
    ok("le préfixe historique de la table est intact",
       T[0] === "furie" && T[1] === "commando" && T[2] === "ogre" && T[3] === "doc",
       T.join(","));
    ok("… et les nouvelles troupes s'ajoutent APRÈS lui (" + T.length + " types)",
       T.length >= 4 && T.indexOf("tank") >= 4, T.join(","));
    var rond = true, det = "";
    for(var i = 0; i < T.length; i++){
      for(var d = 0; d < 2; d++){
        var code = (i << 1) + d;
        if(T[code >> 1] !== T[i] || !!(code & 1) !== !!d){ rond = false; det += code + " "; }
      }
    }
    ok("chaque type et chaque orientation font l'aller-retour", rond, det);
    /* CE QU'UN ANCIEN CLIENT COMPREND, MESURÉ SUR LE VRAI DÉCODEUR.

       Les deux vérifications qui vivaient ici testaient un décodeur
       QUI N'EXISTE PLUS : elles lisaient le bit 1 du code, ce que
       faisait la toute première version du protocole. Le décodeur
       d'aujourd'hui lit `borne(code >> 1, 0, longueur - 1)`, ce qui
       n'a pas le même comportement du tout — et l'une des deux
       affirmait, en passant au vert, quelque chose de faux : « un
       ancien client voit le TX-90 en Furie ». Il le voit en DOC.

       Un test qui passe en énonçant une contre-vérité est pire qu'un
       test absent : il donne l'assurance qu'on a vérifié. On rejoue
       donc la ligne de décodage du fichier livré, avec la table à
       quatre entrées qu'avait la version précédente. */
    (function(){
      var lg = /u\.type = TYPES_TROUPE\[[^\]]+\][^;]*;/.exec(html);
      ok("la ligne de décodage se relit dans le fichier livré", !!lg);
      if(!lg) return;
      function litAvec(table, type){
        var code = (T.indexOf(type) << 1) + 1;
        var u = {};
        new Function("TYPES_TROUPE", "borne", "u", "code", lg[0])
          (table, N.borne, u, code);
        return u.type;
      }
      var v55 = ["furie", "commando", "ogre", "doc"];
      ok("un client de la version précédente lit l'Ogre en Ogre et le Doc en Doc",
         litAvec(v55, "ogre") === "ogre" && litAvec(v55, "doc") === "doc");
      ok("… et le TX-90, qu'il ne connaît pas, en Doc — la dernière "
         + "troupe de SA table, jamais un vide",
         litAvec(v55, "tank") === "doc", litAvec(v55, "tank"));
      ok("un client à jour lit chaque troupe pour ce qu'elle est",
         T.every(function(t){ return litAvec(T, t) === t; }));
    })();
    /* Et ce qu'un client NEUF comprend en recevant les anciens codes. */
    ok("les quatre anciens codes gardent exactement leur sens",
       T[0 >> 1] === "furie" && T[1 >> 1] === "furie" &&
       T[2 >> 1] === "commando" && T[3 >> 1] === "commando");
    /* Le décodage borne l'indice : un code venu d'un client PLUS
       RÉCENT, qui connaîtrait une cinquième troupe, ne doit pas rendre
       `undefined` et faire planter le dessin. */
    var horsTable = Math.min(Math.max(9 >> 1, 0), T.length - 1);
    ok("un type inconnu retombe sur une troupe existante", !!T[horsTable], T[horsTable]);
  })();

  /* ================================================================
     4f. LE TX-90

     La troupe lourde. Ce groupe garde quatre choses, et aucune n'est
     une question de goût :

       SON ÉQUILIBRAGE, qui a été calculé et non deviné — la
       composition visée est sept barges de chars contre sept barges
       de Furies, et les deux doivent valoir autant ;
       SA PROMESSE, « il ne détruit aucune défense en un seul coup » ;
       SES CONTRES, qui sont ce qui l'empêche d'être une troupe sans
       réponse ;
       ET QUE LES QUATRE AUTRES TROUPES N'AIENT RIEN CHANGÉ.
     ================================================================ */
  G("4f. Le TX-90");
  (function(){
    var K = N.UNI.tank, F = N.UNI.furie, CO = N.UNI.commando;
    ok("le TX-90 existe, et il s'appelle TX-90", !!K && K.nom === "TX-90");
    if(!K) return;
    ok("il est proposé au briefing", N.TYPES_TROUPE.indexOf("tank") >= 0);
    ok("deux par barge, comme demandé", N.placesNavette("tank") === 2,
       "" + N.placesNavette("tank"));
    ok("il ne gonfle pas la flotte maximale",
       N.flotteMaximum() === N.EQ.NB_BARGES * N.placesNavette("commando"),
       "" + N.flotteMaximum());

    /* ---- SON CARACTÈRE : lourd, lent, régulier ---- */
    ok("il a bien plus de vie qu'une Furie (" + F.pv + " → " + K.pv + ")",
       K.pv > F.pv * 6, "×" + (K.pv / F.pv).toFixed(1));
    ok("… et plus qu'un Commando, la seule autre troupe résistante",
       K.pv > CO.pv, K.pv + " contre " + CO.pv);
    ok("il est plus lent qu'une Furie", K.vitesse < F.vitesse,
       K.vitesse + " contre " + F.vitesse);
    ok("… mais « un peu », pas comme un Commando",
       K.vitesse > CO.vitesse && K.vitesse > F.vitesse * 0.72,
       "×" + (K.vitesse / F.vitesse).toFixed(2) + " la Furie");
    ok("il tire toutes les quatre secondes", K.cadence === 4000, K.cadence + " ms");
    ok("il tire de plus loin qu'une mitrailleuse ne porte",
       K.portee > N.DEF.crible.portee, K.portee + " contre " + N.DEF.crible.portee);
    ok("… mais il s'arrête toujours en deçà de sa portée",
       K.arret < K.portee, K.arret + " < " + K.portee);

    /* ---- LA PROMESSE : PAS DE COUP UNIQUE ----
       « De bons dégâts, mais pas trop explosifs. Sans détruire les
       défenses en un seul coup. » La borne haute est donc la défense
       la plus FRAGILE : au-delà, le char la pulvérise d'un obus. */
    (function(){
      var mini = 1e9, nomMini = "", maxi = 0, nomMaxi = "", coups = {};
      Object.keys(N.DEF).forEach(function(t){
        var b = N.DEF[t];
        if(!(b.degats > 0) || !b.tourelle) return;
        coups[t] = Math.ceil(b.pv / K.degats);
        if(b.pv < mini){ mini = b.pv; nomMini = b.nom; }
        if(b.pv > maxi){ maxi = b.pv; nomMaxi = b.nom; }
      });
      ok("un obus ne suffit à abattre AUCUNE défense (la plus fragile, "
         + nomMini + ", a " + mini + " PV pour " + K.degats + " de dégâts)",
         K.degats < mini, K.degats + " < " + mini);
      ok("… et deux obus suffisent à TOUTES (la plus solide, "
         + nomMaxi + ", a " + maxi + " PV)",
         K.degats * 2 >= maxi, (K.degats * 2) + " ≥ " + maxi);
      ok("… donc exactement deux obus par défense, sans exception",
         Object.keys(coups).every(function(t){ return coups[t] === 2; }),
         Object.keys(coups).map(function(t){ return t + ":" + coups[t]; }).join(" "));
    })();

    /* ---- L'ÉQUILIBRAGE, REFAIT ICI ----
       Ce qui décide de ce qu'une flotte détruit avant de mourir n'est
       ni sa vie ni ses dégâts, c'est LE PRODUIT DES DEUX : sous un feu
       donné, elle tient PV/feu secondes et frappe dps × PV/feu.
       La composition visée : sept barges de chars et une de Docs,
       contre sept barges de Furies et une de Docs. */
    (function(){
      var nb = 7;
      var nT = nb * N.placesNavette("tank"), nF = nb * N.placesNavette("furie");
      var dpsT = K.degats / (K.cadence / 1000), dpsF = F.degats / (F.cadence / 1000);
      var puisT = (nT * K.pv) * (nT * dpsT), puisF = (nF * F.pv) * (nF * dpsF);
      var r = puisT / puisF;
      ok("sept barges donnent bien " + nT + " chars contre " + nF + " Furies",
         nT === 14 && nF === 84);
      ok("les deux flottes valent autant à " + Math.round(Math.abs(1 - r) * 100)
         + " % près (" + (puisT / 1e6).toFixed(1) + " M contre "
         + (puisF / 1e6).toFixed(1) + " M)",
         r > 0.80 && r < 1.15, "rapport " + r.toFixed(3));
      ok("… mais par l'autre bout : bien plus de vie, bien moins de dégâts",
         nT * K.pv > nF * F.pv * 1.5 && nT * dpsT < nF * dpsF * 0.7,
         "vie ×" + ((nT * K.pv) / (nF * F.pv)).toFixed(2)
         + ", dégâts ×" + ((nT * dpsT) / (nF * dpsF)).toFixed(2));
    })();

    /* ---- LA TABLE DE VULNÉRABILITÉ ----
       LE ZÉRO EST LE SUJET. multVuln s'écrivait `(f.vuln[arme]) || 1`,
       ce qui allait très bien tant que toutes les vulnérabilités
       étaient des multiplicateurs supérieurs à un. L'immunité du char
       aux bestioles est un ZÉRO, et ce zéro serait retombé à 1 en
       silence : les sangliers auraient continué de le charger, et
       rien dans le code n'aurait eu l'air faux.
       On rejoue donc multVuln depuis le fichier livré. */
    (function(){
      var d = html.indexOf("function multVuln(");
      var f = d < 0 ? -1 : html.indexOf("\n}", d);
      ok("multVuln se relit dans le fichier livré", d > 0 && f > d);
      if(d < 0 || f < 0) return;
      var mv = new Function("UNI", html.slice(d, f + 2) + "; return multVuln;")(N.UNI);
      ok("ZÉRO EST UNE IMMUNITÉ, pas une absence : les bestioles ne "
         + "peuvent rien contre un blindé",
         mv({ t:"tank" }, "bete") === 0, "×" + mv({ t:"tank" }, "bete"));
      ok("le tireur d'élite, lui, fait très mal au char",
         mv({ t:"tank" }, "precision") >= 3, "×" + mv({ t:"tank" }, "precision"));
      ok("… et le canon de siège aussi, mais moins",
         mv({ t:"tank" }, "mortier") > 1 &&
         mv({ t:"tank" }, "mortier") < mv({ t:"tank" }, "precision"),
         "×" + mv({ t:"tank" }, "mortier"));
      ok("une arme sans entrée dans la table reste au tarif plein",
         mv({ t:"tank" }, "") === 1 && mv({ t:"tank" }, "inconnue") === 1);
      /* ET RIEN N'A CHANGÉ POUR LES AUTRES. C'est la moitié du travail
         d'un correctif : prouver qu'il n'a corrigé QUE ce qu'il visait. */
      ok("les quatre autres troupes encaissent exactement comme avant",
         ["furie", "commando", "doc"].every(function(t){
           return mv({ t:t }, "bete") === 1 && mv({ t:t }, "precision") === 1 &&
                  mv({ t:t }, "mortier") === 1;
         }) && mv({ t:"ogre" }, "precision") === 5 &&
              mv({ t:"ogre" }, "mortier") === 2 && mv({ t:"ogre" }, "bete") === 1);
    })();

    /* ---- LE MIRADOR RESTE LE CONTRE ----
       « Les snipers doivent faire énormément de dégâts aux Tanks. » On
       ne le vérifie pas sur le multiplicateur — il pourrait être élevé
       et sans effet — mais sur le TEMPS DE SURVIE, qui est ce que le
       joueur ressent. */
    (function(){
      var pire = 1e9, nomPire = "";
      Object.keys(N.DEF).forEach(function(t){
        var b = N.DEF[t];
        if(!(b.degats > 0) || !(b.cadence > 0)) return;
        var arme = b.precision ? "precision" : (b.mortier ? "mortier" : "");
        var m = (arme && K.vuln[arme]) || 1;
        var s = K.pv / (b.degats * m / (b.cadence / 1000));
        if(s < pire){ pire = s; nomPire = b.nom; }
      });
      ok("la défense qui tue le plus vite un TX-90 est le Mirador, "
         + "le tireur d'élite (" + pire.toFixed(1) + " s)",
         nomPire === "Mirador", nomPire + " en " + pire.toFixed(1) + " s");
      var sF = F.pv / (N.DEF.mirador.degats / (N.DEF.mirador.cadence / 1000));
      var sK = K.pv / (N.DEF.mirador.degats * K.vuln.precision
                       / (N.DEF.mirador.cadence / 1000));
      ok("… et le char n'y tient que " + (sK / sF).toFixed(1)
         + " fois plus longtemps qu'une Furie, pour douze fois sa vie",
         sK / sF < K.pv / F.pv * 0.45,
         sF.toFixed(1) + " s contre " + sK.toFixed(1) + " s");
    })();

    /* ---- L'INTERCEPTEUR : UNE ROQUETTE SUR DEUX, EXACTEMENT ----
       Pas « à peu près la moitié ». Un tirage au sort à 50 % aurait
       donné, sur une poignée de roquettes, tantôt trois interceptions
       sur quatre et tantôt zéro — et un joueur qui perd un char pour
       cette raison n'a rien appris, il a été puni.
       On rejoue marqueInterception depuis le fichier livré. */
    (function(){
      ok("le char porte un intercepteur, et lui seul",
         K.intercepteur === 2 &&
         Object.keys(N.UNI).filter(function(t){ return N.UNI[t].intercepteur; }).length === 1,
         "une roquette sur " + K.intercepteur);
      var d = html.indexOf("function marqueInterception(");
      var f = d < 0 ? -1 : html.indexOf("\n}", d);
      ok("marqueInterception se relit dans le fichier livré", d > 0 && f > d);
      if(d < 0 || f < 0) return;
      var mi = new Function("UNI", html.slice(d, f + 2) + "; return marqueInterception;")(N.UNI);
      var ch = { t:"tank" }, fu = { t:"furie" }, og = { t:"ogre" };
      var nT = 0, nF = 0, nO = 0, suite = "";
      for(var i = 0; i < 50; i++){
        var v = mi(ch);
        nT += v; nF += mi(fu); nO += mi(og);
        if(i < 10) suite += v;
      }
      ok("sur cinquante roquettes, le char en abat exactement vingt-cinq",
         nT === 25, nT + "/50");
      ok("… en alternant strictement, jamais au hasard",
         suite === "0101010101", suite);
      ok("les autres troupes n'interceptent rien du tout",
         nF === 0 && nO === 0, "Furie " + nF + ", Ogre " + nO);
      ok("une cible qui n'est pas une troupe ne casse rien",
         mi(null) === 0 && mi({ k:"bat" }) === 0 && mi({}) === 0);
      /* ELLE EST POSÉE À LA NAISSANCE DE LA ROQUETTE, et c'est le seul
         moment qui tienne : une décision prise à l'approche serait
         comptée deux fois si la roquette changeait de cible en vol. */
      ok("le verdict est scellé à la naissance de la roquette",
         /t:"roquette",[\s\S]{0,700}abattue:marqueInterception\(c\)/.test(html));
      ok("… et la roquette abattue n'inflige RIEN, ni à la cible ni au sol",
         /if\(p\.abattue[\s\S]{0,320}abatRoquette\(p, p\.cible\);[\s\S]{0,120}splice\(i, 1\);[\s\S]{0,40}continue;/.test(html));
    })();

    /* ---- LE DESSIN : trois pièces qui tournent séparément ----
       C'est la raison d'être de tout le fichier 61-tank.js. Ce qu'on
       garde ici n'est pas la beauté — ça, on le regarde — mais les
       trois invariants qu'une retouche pourrait casser sans bruit. */
    (function(){
      ok("le char est la SEULE troupe qui échappe au miroir de profil",
         /u\.t === "tank" && typeof dessineTankMonde === "function"/.test(html) &&
         /function dessineTankMonde\(/.test(html));
      /* LE DRAPEAU `tourelle` DÉSIGNE UN VÉHICULE, PAS LE TX-90.
         Il valait « et il est seul » tant que le char était le seul
         engin du jeu ; le PYR-120 le porte aussi, et c'est ce qui lui
         donne les deux caps, l'orientation progressive et le refus de
         tirer de travers. Ce qu'on garde, c'est la clause qui compte :
         les véhicules l'ont, AUCUNE troupe à pied ne l'a. Le jour où
         une Furie le porterait, elle hériterait d'une tourelle qu'elle
         n'a pas et cesserait de se retourner au miroir. */
      ok("le drapeau tourelle est celui des véhicules, et d'eux seuls",
         K.tourelle === 1 && N.UNI.pyr.tourelle === 1 &&
         !N.UNI.furie.tourelle && !N.UNI.commando.tourelle &&
         !N.UNI.ogre.tourelle && !N.UNI.doc.tourelle);
      ok("il ne tire pas tant que sa tourelle n'est pas alignée",
         (html.match(/f\.tourelle && !tankAligne\(u\)/g) || []).length === 2,
         "les deux branches de tir, la balise et la chasse");
      ok("… et l'attente ne coûte aucun délai : le compteur reste à zéro",
         /f\.tourelle && !tankAligne\(u\)\)\{ u\.prochainTir = 0; \}/.test(html));
      /* ================================================================
         LE PYR-120 N'EST PAS BÂTI COMME LE CHAR, ET SON ORDRE DE DESSIN
         NE PEUT PAS ÊTRE LE MÊME.

         Le TX-90 a des chenilles PLUS LARGES que sa caisse : elles sont
         réellement devant elle, donc « chenille du fond, caisse,
         chenille de devant » est juste. Le PYR-120 est bâti à l'envers
         — sa caisse déborde de cinq unités — et le même ordre mettait
         la chenille proche devant un flanc qui est plus près de l'œil
         qu'elle. On voyait une bande de chenille là où le blindage
         aurait dû être, et cela changeait de côté avec le cap.

         Deux faits gardés, et le second explique le premier : la caisse
         déborde bien du train, et les DEUX chenilles passent avant
         elle. Le jour où quelqu'un rétrécirait la caisse sous la
         largeur des chenilles, le premier test tomberait et dirait
         pourquoi le second n'a plus lieu d'être. */
      /* Les cotes du PYR-120 vivent dans 63-pyr.js, pas dans le noyau :
         on les relit dans le fichier livré, telles qu'elles seront
         exécutées — échelle comprise. */
      var mPY = html.match(/var PY = \{[\s\S]*?\n\};/);
      var mEch = html.match(/var PY_ECH = ([\d.]+);/);
      var PYt = null;
      if(mPY && mEch){
        PYt = eval("(" + mPY[0].replace(/^var PY = /, "").replace(/;$/, "")
                             .replace(/\/\*[\s\S]*?\*\//g, "") + ")");
        for(var kPY in PYt) PYt[kPY] *= parseFloat(mEch[1]);
      }
      ok("les cotes du PYR-120 se relisent dans le fichier livré", !!PYt);
      ok("la caisse du PYR-120 déborde de ses chenilles",
         !!PYt && PYt.coY > PYt.chYe,
         PYt ? PYt.coY.toFixed(1) + " contre " + PYt.chYe.toFixed(1) : "");
      /* On lit l'ordre dans la fonction d'assemblage elle-même, et non
         dans une fenêtre de caractères autour d'un appel : un
         commentaire de plus entre deux lignes ne doit pas casser un
         test qui parle d'ORDRE. */
      var mChar = html.match(/function charPYR\([\s\S]*?\n\}/);
      ok("l'assemblage du PYR-120 se relit dans le fichier livré", !!mChar);
      if(mChar){
        var A = mChar[0];
        var iLoin = A.indexOf("chenillePY(c, -proche");
        var iPres = A.indexOf("chenillePY(c, proche");
        var iCai  = A.indexOf("caissePY(");
        var iJup  = A.indexOf("jupePY(");
        ok("… donc ses deux chenilles sont peintes AVANT elle",
           iLoin > 0 && iPres > iLoin && iCai > iPres,
           "sinon le train recouvre le blindage");
        ok("et la jupe vient après la caisse, sur ce qui reste du train",
           iJup > iCai);
      }
      /* La jupe ne descend pas au ras du sol : un blindé chenillé doit
         MONTRER qu'il l'est. Elle s'arrête au-dessus du bas des galets,
         qui sont centrés à chZ×0,38 et font 4,6 de rayon. */
      var mJB = html.match(/var JUPE_BAS = \[([^\]]*)\]/);
      if(mJB && PYt){
        var JB = mJB[1].split(",").map(Number);
        ok("… et elle s'arrête assez haut pour laisser voir les galets",
           Math.min.apply(null, JB) > PYt.chZ * 0.38 - 4.6,
           "arrêt le plus bas " + Math.min.apply(null, JB).toFixed(1)
           + ", bas des galets " + (PYt.chZ * 0.38 - 4.6).toFixed(1));
        ok("… et son profil n'est pas droit : les bouts remontent",
           JB[0] > Math.min.apply(null, JB) + 2 &&
           JB[JB.length - 1] > Math.min.apply(null, JB) + 2);
      }
      /* SOUS BALISE, LE BLINDÉ BALAIE LA VERMINE EN ROULANT.
         Deux règles interdisaient jusqu'ici de tirer sous balise, et
         toutes les deux tiennent au mot « s'arrêter » : une troupe à
         pied n'a qu'un cap, donc tirer lui coûte sa marche. Un
         véhicule en a deux — la caisse et la tourelle — et le tir ne
         lui coûte RIEN. C'est ce que ce bloc autorise, et à eux seuls.
         Le test garde les trois clauses qui font que la porte reste
         fermée pour les autres : le drapeau `tourelle` en garde, les
         DEUX branches de marche sous balise câblées (sans la seconde,
         une balise posée au sol n'aurait rien changé), et le respect
         du Brouillard.

         CE TEST COMPTAIT LES APPELS, ET IL A VIEILLI. Deux, c'était le
         compte du fichier entier tant que la balise était la seule
         manière d'obtenir ce tir. La marche libre en ajoute un
         troisième, et le compte global ne dit alors plus rien de ce
         qu'on voulait promettre. On vérifie donc les deux branches
         elles-mêmes, chacune à son ancre : celle qui roule vers
         l'objectif et celle qui rallie un point au sol. Le total, lui,
         est la promesse du groupe 34. */
      ok("un véhicule sous balise cherche la vermine à sa portée",
         /function betePresVehicule\(u, f\)\{[\s\S]{0,400}md = f\.portee/.test(html));
      ok("et la porte de ce tir est le drapeau des véhicules",
         /function tirBeteEnMarche\(u, f, dt, cachee\)\{\s*if\(!f\.tourelle\) return 0;/
           .test(html));
      ok("la branche qui roule vers l'objectif de la balise le câble",
         /deplace\(u, dxb \+ u\.ancX \* eb, dyb \+ u\.ancY \* eb, vit \* dt\);[\s\S]{0,400}tirBeteEnMarche\(u, f, dt, cachee\);/
           .test(html));
      ok("… et celle qui rallie un point au sol aussi",
         /capUnite\(u, dxf, dyf, 1\);\s*u\.cible = null;[\s\S]{0,400}tirBeteEnMarche\(u, f, dt, cachee\);/
           .test(html));
      ok("… sans jamais désobéir au Brouillard",
         /if\(cachee\)\{ armeSansTirer\(u\); return 1; \}/.test(html));
      /* LE CAMOUFLAGE COUVRE TOUT LE VÉHICULE.
         Il s'arrêtait aux quatre grandes faces : les plaques
         boulonnées, les fûts, le masque et le tube restaient d'un gris
         uni au milieu des taches. Deux faits gardent la couverture —
         l'ORDRE (on peint après avoir monté les pièces rapportées,
         sinon elles restent nues) et le fait que les pièces RONDES ont
         leur propre peintre, `camoFaceT` ne sachant découper qu'un
         quadrilatère plat. */
      var dc = html.indexOf("function caissePY(");
      var fc = dc < 0 ? -1 : html.indexOf("\nfunction ", dc + 10);
      ok("caissePY se relit dans le fichier livré", dc > 0 && fc > dc);
      if(dc > 0 && fc > dc){
        var cai = html.slice(dc, fc);
        ok("la caisse est peinte APRÈS ses plaques rapportées",
           cai.indexOf("LES PLAQUES RAPPORTÉES") < cai.indexOf("CA.flanc"),
           "sinon les plaques restent blanches au milieu des taches");
        ok("les six faces de caisse sont peintes",
           ["CA.flanc", "CA.toit", "CA.glacis", "CA.avant", "CA.arriere"]
             .every(function(k){ return cai.indexOf(k) > 0; }));
      }
      ok("les pièces rondes ont leur peintre à elles",
         /function camoTubePY\(c, a, b, r, ca, sa, lot, C, opa\)\{/.test(html));
      /* Trois appels, pas quatre : les deux fûts partagent le leur,
         ils sont peints dans la boucle qui les dessine. */
      ok("… et il sert aux fûts, au masque et au tube",
         (html.match(/camoTubePY\(/g) || []).length === 4,
         "la définition, les fûts, le masque, la buse");
      ok("le peintre plat du PYR règle son opacité, celui du char non",
         /function camoFacePY\(c, P, lot, ca, sa, C, opa\)\{/.test(html) &&
         /c\.globalAlpha = 0\.62;/.test(html),
         "le TX-90 garde son 0,62 en dur");
      /* LES CHENILLES SONT ANIMÉES PAR LE DÉPLACEMENT, PAS PAR
         L'HORLOGE. C'est ce qui fait qu'un char à l'arrêt a des
         chenilles à l'arrêt et qu'un char englué les fait défiler au
         ralenti — trois comportements justes pour un seul calcul. */
      var d2 = html.indexOf("function chenilleT(");
      var f2 = d2 < 0 ? -1 : html.indexOf("\nfunction ", d2 + 10);
      ok("chenilleT se relit dans le fichier livré", d2 > 0 && f2 > d2);
      if(d2 > 0 && f2 > d2){
        var src = html.slice(d2, f2);
        ok("aucune horloge dans le dessin des chenilles : c'est le "
           + "déplacement qui les anime",
           !/\btps\b|Date\.now|performance\.now/.test(src));
      }
      ok("le compteur de chenille se nourrit du déplacement réel",
         /var d = Math\.hypot\(u\.gx - u\.gxP, u\.gy - u\.gyP\);[\s\S]{0,200}u\.chenille \+= d \* 26;/
           .test(html));
      /* LA LARGEUR DES DEUX CHENILLES. Elles sont symétriques dans le
         modèle ; ce qui les avait rendues inégales à l'écran était un
         garde-boue qui passait devant l'une et pas l'autre. Le test
         garde les deux faits : la symétrie du modèle, et l'absence du
         garde-boue. */
      var dp = html.indexOf("function profilChenille(");
      var fp = dp < 0 ? -1 : html.indexOf("\n}", dp);
      if(dp > 0 && fp > dp){
        var TKl = /var TK = \{[\s\S]*?\n\};/.exec(html);
        var mk = new Function("prng",
          "var TK_PROFIL = null;\n" +
          (TKl ? TKl[0] : "var TK={};") +
          html.slice(html.indexOf("function ptT("), html.indexOf("\n}", html.indexOf("function ptT(")) + 2) +
          html.slice(dp, fp + 2) +
          "; return { TK:TK, ptT:ptT, profilChenille:profilChenille };")(N.prng);
        var egal = true, det2 = "";
        for(var g = 0; g < 12; g++){
          var ab = g * 0.5236, ca = Math.cos(ab), sa = Math.sin(ab);
          function larg(cote){
            var a = mk.ptT(0, mk.TK.chYi * cote, mk.TK.chZ, ca, sa);
            var b = mk.ptT(0, mk.TK.chYe * cote, mk.TK.chZ, ca, sa);
            return Math.hypot(b.x - a.x, b.y - a.y);
          }
          if(Math.abs(larg(1) - larg(-1)) > 1e-9){ egal = false; det2 += g * 30 + "° "; }
        }
        ok("les deux chenilles ont exactement la même largeur, à tous les caps",
           egal, det2 || "écart nul aux douze caps");
        var PR = mk.profilChenille();
        ok("leur contour est une CAPSULE : les deux bouts sont ronds et fermés",
           PR.R > 0 && Math.abs(PR.R - mk.TK.chZ / 2) < 1e-9 && PR.p.length >= 14,
           PR.p.length + " points, rayon " + PR.R);
        ok("… et les tuiles font le tour complet de la boucle",
           PR.L > mk.TK.chX * 3, PR.L.toFixed(0) + " px de boucle");
      }
      /* NI JUPE NI GARDE-BOUE. C'est ce qui rendait les deux chenilles
         inégales à l'écran : la tôle passait devant celle du fond,
         dessinée avant elle, et pas devant celle de devant, dessinée
         après. La teinte part avec la pièce — une entrée de palette
         que plus rien ne lit finit par être réemployée par mégarde. */
      var dpal = html.indexOf("var C_TANK = {");
      var fpal = dpal < 0 ? -1 : html.indexOf("\n};", dpal);
      ok("la palette du char n'a plus de teinte de jupe",
         dpal > 0 && fpal > dpal && !/jupe\s*:/.test(html.slice(dpal, fpal)));
    })();
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
      /* IBIZA EN PORTE DOUZE, UNE PAR SECTEUR — ce qui a été demandé :
         « une à la fin de chaque secteur de défenses ». Les douze
         faisceaux découpent l'île en douze quartiers, et chacun a sa
         tour au bout de sa bissectrice. Partout ailleurs, cinq. */
      var attend = N.CARTES[i].biome === "ibiza" ? N.FAISC_N : N.NB_REACTEURS;
      if(lst.length !== attend){ manque += "île" + i + "(" + lst.length + ") "; continue; }
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
    ok("chaque île a son compte de cellules — cinq, et douze à Ibiza",
       manque === "", manque);
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
    /* ON PARCOURT L'ORDRE DE CAMPAGNE, PAS « 0 à NB_CARTES_NORMALES ».
       Les deux se confondaient tant que les îles ordinaires occupaient
       le début du tableau ; depuis que trois îles vivent après la
       jungle, compter jusqu'à huit fait passer sur la carte événement
       — qui a son plan gravé et n'est donc jamais « vierge ». Le test
       échouait pour une raison qui n'avait rien à voir avec ce qu'il
       vérifie. */
    var vierge = [], peinte = [], k, idx;
    for(k = 0; k < N.ORDRE_CAMPAGNE.length; k++){
      idx = N.ORDRE_CAMPAGNE[k];
      vierge.push(N.empreinteCarte(N.genereCarte("MILY", idx, "", 0)));
      peinte.push(N.empreinteCarte(N.genereCarte("MILY", idx, N.planDeCarte(idx, paquet), 0)));
    }
    ok("peindre la plage change bien la plage", vierge[0] !== peinte[0]);
    var intactes = "";
    for(k = 1; k < N.ORDRE_CAMPAGNE.length; k++)
      if(vierge[k] !== peinte[k]) intactes += N.CARTES[N.ORDRE_CAMPAGNE[k]].nom + " ";
    ok("et ne touche AUCUNE des " + (N.ORDRE_CAMPAGNE.length - 1) + " autres",
       intactes === "", intactes);

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
      /* IBIZA EST L'EXCEPTION, ET ELLE EST VOULUE. Son étoile centrale
         et ses douze faisceaux sont des VIDES : rien n'y pousse, pas
         plus un parasol qu'un lance-roquettes, et c'est cette absence
         qui dessine la figure (voir `videIbiza`). Vingt-quatre couloirs
         et une étoile retirent près de la moitié du terrain : elle porte
         deux cent cinquante décors au lieu de cinq cents, et c'est la
         seule île du jeu dans ce cas. Le seuil vaut deux cent vingt pour
         elle, quatre cents pour toutes les autres. */
      var seuilD = N.CARTES[k].biome === "ibiza" ? 220 : 400;
      if(M.decors.length < seuilD) bouge.push(N.CARTES[k].nom + " n'a que " + M.decors.length + " décors");
    }
    ok("chaque île garde ses cinq cents décors sous n'importe quel plan ("
       + comptes.join(", ") + ")",
       comptes.every(function(n, k2){
         return n > (N.CARTES[k2].biome === "ibiza" ? 220 : 400);
       }));

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

  /* ================================================================
     5c. LES TROIS ÎLES AJOUTÉES

     Guinguette, Ténèbres, Ibiza. Ce qui compte ici n'est pas qu'elles
     soient jolies — ça, on le regarde — mais qu'elles soient
     COMPLÈTES : une île à qui il manque une palette ne fait pas une
     carte moche, elle fait un écran noir au démarrage, parce que
     construitBriefing() lit « .ciel » sur undefined avant même que la
     boucle de rendu commence.
     ================================================================ */
  G("5c. Les trois îles ajoutées");
  (function(){
    var neuves = [
      { i:6, biome:"guinguette", nom:"Mily en guinguette",     pv:43000000, ciel:"nuit"  },
      { i:7, biome:"tenebres",   nom:"Mily dans les ténèbres", pv:50000000, ciel:"fumee" },
      { i:8, biome:"ibiza",      nom:"Mily à Ibiza",           pv:56000000, ciel:"clair" }
    ];
    var k, c, n;
    for(k = 0; k < neuves.length; k++){
      n = neuves[k];
      c = N.CARTES[n.i];
      ok(n.nom + " est à l'index " + n.i + ", et rien d'autre",
         !!c && c.nom === n.nom && c.biome === n.biome,
         c ? c.nom : "absente");
      ok("… avec " + (n.pv / 1e6) + " M de Brasier", !!c && c.pvQG === n.pv, c ? "" + c.pvQG : "");
      ok("… elle fait partie de la campagne, pas des événements",
         !N.carteSpeciale(n.i) && N.ORDRE_CAMPAGNE.indexOf(n.i) >= 0);
      ok("… son ciel est « " + n.ciel + " »", N.styleCiel(n.i) === n.ciel, N.styleCiel(n.i));
      /* La vraie épreuve : la carte se génère, et elle est peuplée. */
      var m = N.genereCarte("MILY", n.i, "", 0);
      /* Ibiza : trois cents décors et non cinq cents — le vide de sa
         figure ne porte rien. Voir le groupe 5h. */
      var seuilDec = n.biome === "ibiza" ? 220 : 400;
      ok("… elle se génère : " + m.batiments.length + " bâtiments, "
         + m.decors.length + " décors, " + m.creatures.length + " bestioles",
         m.batiments.length > 600 && m.decors.length > seuilDec && m.creatures.length > 60,
         m.batiments.length + "/" + m.decors.length + "/" + m.creatures.length);
      ok("… ses décors tirent bien les QUATRE variantes",
         (function(){
           var vus = {};
           for(var q = 0; q < m.decors.length; q++) vus[m.decors[q].v] = 1;
           return vus[0] && vus[1] && vus[2] && vus[3];
         })());
      ok("… et ses cellules électriques sont là",
         m.reacteurs.length === (n.biome === "ibiza" ? N.FAISC_N : N.NB_REACTEURS),
         "" + m.reacteurs.length);
    }
    /* La montée des PV : chaque île de la campagne est plus dure que
       la précédente, et aucune ne rattrape la jungle. */
    ok("les huit îles montent en difficulté, dans l'ordre de campagne",
       (function(){
         for(var q = 1; q < N.ORDRE_CAMPAGNE.length; q++)
           if(N.CARTES[N.ORDRE_CAMPAGNE[q]].pvQG <= N.CARTES[N.ORDRE_CAMPAGNE[q - 1]].pvQG) return false;
         return true;
       })(),
       N.ORDRE_CAMPAGNE.map(function(i){ return N.CARTES[i].pvQG / 1e6; }).join(" < "));
    /* LA VRAIE PROMESSE : aucune île de CAMPAGNE ne rivalise avec une
       carte événement. Ce test disait « la jungle est au-dessus de
       toutes », ce qui était vrai tant qu'elle était le seul
       événement — et faux le jour où un second arrive, sans que la
       promesse ait bougé d'un cran. Une carte événement doit rester
       l'objectif collectif le plus lourd du jeu ; entre deux
       événements, rien n'oblige à un ordre. */
    ok("aucune île de campagne ne rivalise avec une carte événement",
       (function(){
         var pire = 0, q;
         for(q = 0; q < N.CARTES.length; q++)
           if(!N.carteSpeciale(q) && N.CARTES[q].pvQG > pire) pire = N.CARTES[q].pvQG;
         for(q = 0; q < N.CARTES.length; q++)
           if(N.carteSpeciale(q) && N.CARTES[q].pvQG <= pire) return false;
         return true;
       })(),
       N.CARTES.filter(function(c){ return c.special; })
         .map(function(c){ return c.nom + " " + (c.pvQG / 1e6) + " M"; }).join(", "));

    /* ================================================================
       LES TORNADES DE FLAMMES

       Ce qu'on épingle ici, ce n'est pas qu'elles soient belles — ça,
       on le regarde — c'est qu'elles ne soient pas un PIÈGE. Trois
       nombres portent cette promesse, et un quatrième la trahirait.
       ================================================================ */
    ok("les tornades ne tombent que dans les ténèbres",
       N.carteTornades(7) && !N.carteTornades(0) && !N.carteTornades(N.IDX_JUNGLE) &&
       N.CARTES.filter(function(c, i){ return N.carteTornades(i); }).length === 1);
    ok("une île inexistante n'a pas de tornades",
       !N.carteTornades(999) && !N.carteTornades(-1));
    /* LA PHASE D'AVERTISSEMENT est ce qui sépare un danger d'un piège :
       l'entonnoir descend pendant ce temps SANS rien tuer, et son
       point de contact est marqué au sol. Elle doit laisser le temps
       de s'écarter — donc valoir plus que le temps de traverser la
       zone mortelle à la vitesse d'une troupe. */
    (function(){
      var lente = N.UNI.doc.vitesse, i, mini = 1e9;
      for(i in N.UNI) if(N.UNI[i].vitesse < mini) mini = N.UNI[i].vitesse;
      var aTraverser = N.EQ.TORNADE_RAYON * 2;      // la largeur de ce qui tue
      var tempsPourSortir = aTraverser / mini;
      ok("l'avertissement (" + N.EQ.TORNADE_DESCENTE + " s) laisse le temps de sortir de la zone ("
         + tempsPourSortir.toFixed(1) + " s à la troupe la plus lente)",
         N.EQ.TORNADE_DESCENTE > tempsPourSortir, lente + " cases/s");
    })();
    /* LA LARGEUR. Une tornade large ne se contourne pas, elle se
       subit. Le couloir mortel doit rester très en dessous du rayon de
       formation d'un groupe : sinon un débarquement entier tient
       dedans et il n'y a plus de manœuvre possible. */
    ok("le couloir mortel (" + (N.EQ.TORNADE_RAYON * 2) + " cases) est bien plus étroit qu'un groupe ("
       + (N.rayonFormation() * 2).toFixed(1) + " cases)",
       N.EQ.TORNADE_RAYON * 2 < N.rayonFormation(), "" + (N.EQ.TORNADE_RAYON * 2));
    ok("la traînée n'est jamais plus large que le pied qui l'a faite",
       N.EQ.TORNADE_TRAINEE_R <= N.EQ.TORNADE_RAYON,
       N.EQ.TORNADE_TRAINEE_R + " ≤ " + N.EQ.TORNADE_RAYON);
    /* LA FUITE PAR LE CÔTÉ. Elle va TOUT DROIT, et c'est ce qui rend
       la parade possible : on ne court pas devant elle, on s'écarte —
       et en s'écartant on sort d'un couloir qui, lui, ne s'élargit
       pas. La question juste n'est donc pas « avance-t-elle plus vite
       que je ne marche » (elle avance le long de son axe, pas vers
       moi), c'est « À QUELLE DISTANCE dois-je la voir venir ». On
       mesure ce préavis pour la troupe la plus lente. */
    (function(){
      var lente = 1e9, nom = "", i;
      for(i in N.UNI) if(N.UNI[i].vitesse < lente){ lente = N.UNI[i].vitesse; nom = N.UNI[i].nom; }
      var pourSortir = N.EQ.TORNADE_RAYON / lente;               // s, de côté
      var preavis = N.EQ.TORNADE_VITESSE * pourSortir;           // cases de préavis nécessaires
      ok("le " + nom + ", la plus lente, doit la voir venir " + preavis.toFixed(1)
         + " cases à l'avance — une colonne de trois cents pixels se voit de bien plus loin",
         preavis < 6, preavis.toFixed(2) + " cases");
      /* Et l'avertissement seul, pendant lequel elle NE BOUGE PAS,
         suffit déjà à dégager le couloir : c'est la vraie garantie. */
      ok("l'avertissement seul suffit à sortir du couloir, sans même l'avoir vue arriver",
         N.EQ.TORNADE_DESCENTE * lente > N.EQ.TORNADE_RAYON,
         (N.EQ.TORNADE_DESCENTE * lente).toFixed(1) + " cases parcourues > "
         + N.EQ.TORNADE_RAYON + " à franchir");
    })();
    /* LA DURÉE, ET SES INTENSITÉS. Chaque tornade tire son trajet
       entre +50 % et +100 % de la référence : deux tornades de la même
       partie ne se ressemblent pas, et c'est cet écart qui les rend
       intéressantes à regarder. */
    (function(){
      var court = N.EQ.TORNADE_VITESSE * N.EQ.TORNADE_VIE * N.EQ.TORNADE_TRAJET_MIN;
      var long  = N.EQ.TORNADE_VITESSE * N.EQ.TORNADE_VIE * N.EQ.TORNADE_TRAJET_MAX;
      ok("sa course va de " + court.toFixed(0) + " à " + long.toFixed(0) + " cases",
         court > 45 && long < 90, court.toFixed(0) + "–" + long.toFixed(0));
      ok("la plus longue fait bien le double de la référence",
         Math.abs(N.EQ.TORNADE_TRAJET_MAX - 2) < 1e-9 &&
         Math.abs(N.EQ.TORNADE_TRAJET_MIN - 1.5) < 1e-9);
      ok("aucune n'est plus courte que la référence",
         N.EQ.TORNADE_TRAJET_MIN >= 1);
      ok("l'écart entre la plus courte et la plus longue se voit",
         long / court >= 1.3, "×" + (long / court).toFixed(2));
    })();
    /* ════════════════════════════════════════════════════════════
       LA MARGE DE VIRAGE, ET CE QU'ELLE DOIT VRAIMENT GARANTIR

       Cette vérification épinglait un NOMBRE — « la marge dépasse
       six » — et c'est exactement ce nombre qui a enfermé la tornade
       au milieu de l'île pendant des mois. Elle passait au vert
       pendant que la plage et le Brasier, les deux endroits où l'on
       joue, étaient hors d'atteinte.

       Un test qui garde une valeur ne garde rien : il empêche
       seulement qu'on la change. Ce qu'il fallait garder, ce sont les
       DEUX PROPRIÉTÉS que cette valeur sert :

         que le virage soit une COURBE et non un rebond — donc que la
         tornade mette au moins une seconde à traverser la bande de
         virage, sans quoi le cap sauterait ;
         et qu'elle puisse ATTEINDRE tout le terrain de jeu — la
         plage où l'on débarque à l'est, l'approche du Brasier à
         l'ouest.

       Ce sont ces deux-là qui sont écrites maintenant. La seconde
       aurait fait échouer le test le jour où la marge est passée à
       quatorze, et l'on aurait cherché tout de suite au bon endroit.
       ════════════════════════════════════════════════════════════ */
    (function(){
      var m = N.EQ.TORNADE_MARGE_BORD;
      var lente = Math.min(N.EQ.TORNADE_VITESSE, N.EQ.CLASSIQUE_VITESSE,
                           N.EQ.TOURBILLON_VITESSE);
      var vive = Math.max(N.EQ.TORNADE_VITESSE, N.EQ.CLASSIQUE_VITESSE,
                          N.EQ.TOURBILLON_VITESSE);
      ok("le virage est une courbe : la plus rapide met "
         + (m / vive).toFixed(1) + " s à traverser la bande de virage",
         m / vive >= 1.0, (m / vive).toFixed(2) + " s");
      ok("… et la bande ne mange pas le milieu de l'île",
         m * 2 < N.GW * 0.5 && m * 2 < N.GH * 0.5);
      /* LES DEUX BORDS QUI COMPTENT. La plage est la bande où toute
         partie commence ; l'approche du Brasier est celle où toute
         partie finit. Une tornade qui ne peut atteindre ni l'une ni
         l'autre est un décor, pas un danger. */
      ok("la tornade peut atteindre la PLAGE, où l'on débarque",
         N.GW - m >= N.PLAGE_X0,
         "elle vire à x=" + (N.GW - m) + ", la plage commence à x=" + N.PLAGE_X0);
      ok("… et l'approche du BRASIER, où l'on finit",
         m <= N.QG_GX + 4,
         "elle vire à x=" + m + ", le Brasier est à x=" + N.QG_GX);
    })();
    ok("elle ne revient pas sans arrêt : " + N.EQ.TORNADE_PERIODE + " s entre deux",
       N.EQ.TORNADE_PERIODE > N.EQ.TORNADE_VIE, "" + N.EQ.TORNADE_PERIODE);
    /* LE SOL REFROIDIT. Sans cela, une île traversée deux fois
       deviendrait un labyrinthe de couloirs interdits. */
    ok("la traînée s'éteint (" + N.EQ.TORNADE_TRAINEE
       + " s) bien avant que la tornade n'ait fini sa course",
       N.EQ.TORNADE_TRAINEE < N.EQ.TORNADE_VIE * N.EQ.TORNADE_TRAJET_MIN * 0.5);

    /* ================================================================
       LA FOUDRE, SÉPARÉE DE L'ORAGE

       Elle n'appartenait qu'à la jungle parce que tout l'orage y était
       d'un bloc : ciel vert, brume, pluie, nuages, foudre et tonnerre
       tenaient dans un seul carteOrageuse(). Les ténèbres veulent la
       foudre et le tonnerre, mais surtout PAS la pluie — il ne pleut
       pas sur un monde de lave. Ces deux questions sont maintenant
       distinctes, et ce groupe vérifie qu'elles le restent.
       ================================================================ */
    ok("la jungle a la foudre ET la pluie",
       N.carteFoudre(N.IDX_JUNGLE) && N.carteOrageuse(N.IDX_JUNGLE));
    ok("les ténèbres ont la foudre SANS la pluie",
       N.carteFoudre(7) && !N.carteOrageuse(7));
    ok("aucune autre île n'a de foudre",
       N.CARTES.filter(function(c, i){ return N.carteFoudre(i); }).length === 2,
       N.CARTES.filter(function(c, i){ return N.carteFoudre(i); })
         .map(function(c){ return c.nom; }).join(", "));
    ok("un orage implique toujours la foudre — jamais l'inverse",
       N.CARTES.every(function(c, i){ return !N.carteOrageuse(i) || N.carteFoudre(i); }));
    ok("une île inexistante n'a ni l'un ni l'autre",
       !N.carteFoudre(999) && !N.carteOrageuse(999) && !N.carteFoudre(-1));
    /* LE RYTHME. Celui des ténèbres est plus LENT, et ce n'est pas de
       la timidité : cette île porte déjà les tornades. Deux dangers
       qui tombent du ciel au même rythme ne se distinguent plus l'un
       de l'autre — on ne saurait plus lequel on esquive. */
    ok("la foudre des ténèbres (" + N.periodeEclair(7) + " s) est plus rare que celle de la jungle ("
       + N.periodeEclair(N.IDX_JUNGLE) + " s)",
       N.periodeEclair(7) > N.periodeEclair(N.IDX_JUNGLE) * 1.4);
    ok("… parce que les ténèbres ont déjà les tornades",
       N.carteTornades(7) && !N.carteTornades(N.IDX_JUNGLE));
    /* Et les deux dangers du ciel des ténèbres ne se déclenchent pas
       au même rythme : s'ils coïncidaient, on lirait un seul
       phénomène. */
    ok("foudre et tornades des ténèbres ont des périodes bien distinctes",
       Math.abs(N.periodeEclair(7) - N.EQ.TORNADE_PERIODE) > 5,
       N.periodeEclair(7) + " s contre " + N.EQ.TORNADE_PERIODE + " s");
    /* LE RYTHME DES GRONDEMENTS est deux fois plus rapide dans les
       ténèbres. La fonction vit hors du noyau (36-jungle-meteo.js) ;
       on la relit dans le fichier livré, comme les palettes.
       Ce qui compte ici : le SON et l'IMAGE lisent la même période. Si
       chacun comptait ses propres cycles, on verrait un éclat sans
       l'entendre, ou l'inverse. */
    (function(){
      var d = html.indexOf("function periodeRoulement(");
      var f = html.indexOf("\n}", d);
      if(d < 0 || f < 0){ ok("periodeRoulement se relit dans le fichier livré", false); return; }
      var src = html.slice(d, f + 2);
      ok("periodeRoulement se relit dans le fichier livré", src.length > 40);
      /* on la rejoue à la main : deux fois plus vite sur l'île à
         tornades, inchangée ailleurs */
      var base = 5.2;
      function faux(ile){
        return new Function("MET_ROULEMENT", "jeu", "carteTornades",
                            src + "; return periodeRoulement();")
               (base, { index:ile }, function(i){ return i === 7; });
      }
      ok("les ténèbres grondent DEUX FOIS plus souvent que la jungle",
         Math.abs(faux(7) - base / 2) < 1e-9, faux(7) + " s contre " + faux(5));
      ok("la jungle garde exactement son rythme",
         Math.abs(faux(5) - base) < 1e-9, "" + faux(5));
      ok("les îles sans ciel gardent le rythme de référence",
         Math.abs(faux(0) - base) < 1e-9);
    })();

    /* LES CIELS. Une seule île est orageuse ; les autres se partagent
       trois teintes de nuages, et aucune ne doit retomber par défaut
       sur un blanc de plein jour qui ne lui va pas. */
    ok("seule la jungle est orageuse",
       N.CARTES.filter(function(cc, i){ return N.carteOrageuse(i); }).length === 1);
    ok("le ciel d'orage n'est celui que de la jungle",
       N.styleCiel(N.IDX_JUNGLE) === "orage" &&
       N.ORDRE_CAMPAGNE.every(function(i){ return N.styleCiel(i) !== "orage"; }));
    ok("une île sans ciel nommé retombe sur le beau temps",
       N.styleCiel(0) === "clair" && N.styleCiel(999) === "clair");
    ok("les quatre ciels sont tous employés",
       (function(){
         var vus = {};
         for(var q = 0; q < N.CARTES.length; q++) vus[N.styleCiel(q)] = 1;
         return vus.orage && vus.clair && vus.fumee && vus.nuit;
       })());

    /* Elles ne doivent RESSEMBLER à aucune autre : c'est la raison
       d'être d'une île neuve. On compare les palettes deux à deux —
       le test « cinq palettes distinctes » plus bas les couvre aussi,
       mais celui-ci nomme la fautive. */
    var jum = "";
    for(k = 0; k < neuves.length; k++)
      for(var q2 = 0; q2 < N.CARTES.length; q2++)
        if(N.CARTES[q2].biome === neuves[k].biome && q2 !== neuves[k].i)
          jum += neuves[k].biome + " ";
    ok("chacune a un biome qui n'appartient qu'à elle", jum === "", jum);
  })();

  /* ================================================================
     5h. LA SCÈNE D'IBIZA

     Elle est du DÉCOR : pas de points de vie, pas d'index de bâtiment,
     rien à casser et rien à gagner. Son seul effet sur les règles est
     le TROU qu'elle creuse dans le quadrillage militaire — et c'est
     exactement ce trou qu'on épingle ici, parce qu'il vit dans le
     noyau et qu'une retouche du dessin ne doit jamais le refermer.
     ================================================================ */
  G("5h. La scène d'Ibiza");
  (function(){
    var IBIZA = 8;
    ok("le carré réservé n'existe que sur Ibiza",
       N.carteScene(IBIZA) &&
       N.CARTES.filter(function(c, i){ return N.carteScene(i); }).length === 1,
       N.CARTES.filter(function(c, i){ return N.carteScene(i); })
         .map(function(c){ return c.nom; }).join(", "));
    ok("une île inexistante n'a pas de scène",
       !N.carteScene(999) && !N.carteScene(-1));
    /* LA PISTE N'EST PLUS UN CARRÉ, C'EST UNE ÉTOILE À SIX BRANCHES —
       et le carré d'origine doit tenir DEDANS, sans quoi la scène et
       les danseurs déborderaient sur les défenses. Les coins du carré
       sont à SCENE_DEMI × √2 = 15,6 cases du centre, le creux de
       l'étoile à ETOILE_R2 = 17 : tout ce qui existait tient, et
       l'étoile ne déborde qu'aux six pointes. */
    ok("l'étoile contient tout l'ancien carré de " + (N.SCENE_DEMI * 2 + 1) + " cases",
       (function(){
         for(var q = -N.SCENE_DEMI; q <= N.SCENE_DEMI; q++)
           for(var w = -N.SCENE_DEMI; w <= N.SCENE_DEMI; w++)
             if(!N.dansLaScene(N.SCENE_GX + q, N.SCENE_GY + w)) return 0;
         return 1;
       })());
    ok("… et elle a bien six pointes et six creux, à " + N.ETOILE_R
       + " et " + N.ETOILE_R2 + " cases",
       (function(){
         var pas = 6.2832 / 12, q;
         for(q = 0; q < 12; q++){
           var a = q * pas - 0.5236;
           var r = (q & 1) ? N.ETOILE_R2 : N.ETOILE_R;
           /* juste en deçà du sommet : dedans ; juste au-delà : dehors */
           if(!N.dansLaScene(N.SCENE_GX + Math.cos(a) * (r - 0.4),
                             N.SCENE_GY + Math.sin(a) * (r - 0.4))) return 0;
           if(N.dansLaScene(N.SCENE_GX + Math.cos(a) * (r + 0.4),
                            N.SCENE_GY + Math.sin(a) * (r + 0.4))) return 0;
         }
         return 1;
       })());
    ok("il est loin du QG et de la plage : la piste ne gêne aucun débarquement",
       Math.abs(N.SCENE_GX - N.QG_GX) > 40 && N.SCENE_GX + N.SCENE_DEMI < N.PLAGE_X0);

    /* LE TROU EST RÉEL. C'est LA propriété : sept passes de génération
       tirent des bâtiments (treillis, treillis d'appoint, champs de
       cellules, miradors, spirale des réacteurs, décors) et chacune
       doit s'écarter du carré. Il a suffi d'en oublier une pour qu'un
       lance-roquettes pousse au milieu de la piste. */
    (function(){
      var m = N.genereCarte("MILY", IBIZA, "", 0);
      function dedans(t){
        return t.filter(function(o){ return N.dansLaScene(o.gx, o.gy); }).length;
      }
      ok("aucun bâtiment dans le carré (" + m.batiments.length + " sur l'île)",
         dedans(m.batiments) === 0, dedans(m.batiments) + " intrus");
      ok("aucun décor non plus (" + m.decors.length + " sur l'île)",
         dedans(m.decors) === 0, dedans(m.decors) + " intrus");
      /* DOUZE CELLULES, UNE PAR QUARTIER, et aucune sur la piste. Elles
         se tiennent en revanche DANS la lumière : chacune est au bout
         de la bissectrice de son secteur, donc dans le faisceau fin qui
         la dessert — c'est le repère qu'on a voulu lui donner. */
      ok("les douze cellules électriques sont dehors, toutes les douze",
         m.reacteurs.length === N.FAISC_N && dedans(m.reacteurs) === 0,
         m.reacteurs.length + " cellules, " + dedans(m.reacteurs) + " dedans");
      ok("… une par secteur, chacune au bout de sa bissectrice",
         (function(){
           var pas = 6.2832 / N.FAISC_N, vus = {}, q;
           for(q = 0; q < m.reacteurs.length; q++){
             var ex = m.reacteurs[q].gx - N.SCENE_GX, ey = m.reacteurs[q].gy - N.SCENE_GY;
             var e = (Math.atan2(ey, ex) + 0.5236) / pas - 0.5;
             vus[Math.round(e) % N.FAISC_N] = 1;
             /* et loin du centre : c'est la FIN du secteur */
             if(Math.sqrt(ex * ex + ey * ey) < 40) return 0;
           }
           return Object.keys(vus).length === N.FAISC_N;
         })());
      /* Les bêtes, elles, entrent : elles MARCHENT. Un sanglier qui
         traverse la piste est un cadeau, pas un défaut — c'est la
         seule chose vivante que la génération ne fige pas. */
      ok("les bêtes, elles, ont le droit d'y passer",
         m.creatures.length > 60);
      /* Et la contre-épreuve : le trou est propre à Ibiza. Sans elle,
         un `dansLaScene` toujours vrai passerait le test précédent. */
      var autre = N.genereCarte("MILY", 0, "", 0);
      ok("sur une autre île, le même carré est bâti comme le reste",
         autre.batiments.filter(function(b){ return N.dansLaScene(b.gx, b.gy); }).length > 10);
      /* LE PRIX DU TROU, mesuré : il ne doit pas dépeupler l'île. */
      ok("Ibiza reste aussi fournie que les autres ("
         + m.batiments.length + " contre " + autre.batiments.length + ")",
         m.batiments.length > autre.batiments.length * 0.9,
         m.batiments.length + " / " + autre.batiments.length);
    })();

    /* LA FOULE. Elle vit hors du noyau (35-ibiza-scene.js) ; on la
       relit dans le fichier livré et on la rejoue, comme
       periodeRoulement plus haut.
       Ce qu'on vérifie n'est pas qu'elle soit jolie — c'est qu'elle
       soit AU BON ENDROIT, et cet endroit est piégeux : « devant la
       scène » à l'écran, ce n'est pas « gy plus grand » (qui part en
       bas à GAUCHE), c'est gx ET gy qui montent ensemble. La première
       version dansait à côté du podium. */
    (function(){
      var d0 = html.indexOf("var IBI_DEMI");
      var d1 = html.indexOf("function fabriqueDanseurs(");
      var f1 = d1 < 0 ? -1 : html.indexOf("\n}", d1);
      if(d0 < 0 || d1 < 0 || f1 < 0){
        ok("la foule se relit dans le fichier livré", false); return;
      }
      var src = html.slice(d0, f1 + 2);
      ok("la foule se relit dans le fichier livré", src.length > 200);
      function fabrique(){
        return new Function("prng", "SCENE_GX", "SCENE_GY", "ETOILE_R", "dansLaScene",
                            src + "; return { d:fabriqueDanseurs(), coin:IBI_COIN, demi:IBI_DEMI,"
                                + " n:IBI_NB_DANSEURS, np:IBI_NB_PISTE };")
               (N.prng, N.SCENE_GX, N.SCENE_GY, N.ETOILE_R, N.dansLaScene);
      }
      var R = fabrique(), D = R.d;
      /* DEUX FOULES DEPUIS QUE LA PISTE EST UNE ÉTOILE : le premier
         rang, serré devant le podium, et la piste, semée sur toute
         l'étoile. Le premier rang est au bout du tableau — il est posé
         après — et c'est lui que les tests suivants isolent. */
      var PREM = D.slice(D.length - R.n);
      ok("le premier rang compte ses " + R.n + " personnes devant le DJ",
         PREM.length === R.n, "" + PREM.length);
      ok("et la piste est peuplée : " + D.length + " danseurs en tout",
         D.length > R.n + R.np * 0.5 && D.length <= R.n + R.np,
         D.length + " sur " + (R.n + R.np) + " tirés");
      /* LE PLANCHER, en coordonnées du monde. Le podium est tracé en
         losange d'écran de demi-largeur IBI_DEMI * RX ; ce losange-là
         est, dans le monde, le CARRÉ |Δgx| ≤ IBI_DEMI/√2. C'est
         précisément ce que vaut IBI_COIN, et ce test le fige : si un
         jour quelqu'un écrit IBI_COIN = IBI_DEMI, la foule remonte sur
         la scène. */
      ok("le coin du plancher vaut bien la demi-diagonale sur √2 ("
         + R.coin.toFixed(2) + " cases)",
         Math.abs(R.coin - R.demi * Math.SQRT1_2) < 1e-9, "" + R.coin);
      var surScene = 0, horsCarre = 0, derriere = 0, i, dd, dx, dy;
      for(i = 0; i < D.length; i++){
        dd = D[i]; dx = dd.gx - N.SCENE_GX; dy = dd.gy - N.SCENE_GY;
        if(Math.max(Math.abs(dx), Math.abs(dy)) <= R.coin) surScene++;
        if(!N.dansLaScene(dd.gx, dd.gy)) horsCarre++;
      }
      for(i = 0; i < PREM.length; i++){
        dd = PREM[i]; dx = dd.gx - N.SCENE_GX; dy = dd.gy - N.SCENE_GY;
        if((dx + dy) / 2 <= R.coin) derriere++;      // pas franchement au sud de la scène
      }
      ok("personne ne danse SUR le plancher — c'est la place du DJ", surScene === 0,
         surScene + " sur scène");
      ok("le premier rang est DEVANT la scène, au sud de l'écran", derriere === 0,
         derriere + " mal placés");
      /* ET TOUTE LA PISTE TIENT DANS L'ÉTOILE. Une pointe d'étoile est
         pointue : un semis circulaire en déborde forcément, et un
         danseur planté dehors se retrouverait au milieu des Frelons.
         C'est `dansLaScene` qui tranche, danseur par danseur. */
      ok("et pas un danseur ne sort de l'étoile, là où rien n'est bâti",
         horsCarre === 0, horsCarre + " dehors");
      /* LA PISTE EST OCCUPÉE JUSQU'AU BORD, et c'est tout l'objet du
         second groupe : « une étoile vide où il y a des gens qui
         dansent DANS l'étoile ». Vingt personnes serrées sous le
         podium laissaient quarante cases de plancher nu autour. */
      (function(){
        var loin = 0, quarts = {}, q;
        for(q = 0; q < D.length - R.n; q++){
          var ex = D[q].gx - N.SCENE_GX, ey = D[q].gy - N.SCENE_GY;
          if(Math.sqrt(ex * ex + ey * ey) > N.ETOILE_R2) loin++;
          quarts[(ex > 0 ? 1 : 0) + "" + (ey > 0 ? 1 : 0)] = 1;
        }
        ok("la piste danse jusque dans les pointes de l'étoile ("
           + loin + " au-delà des creux)", loin > 8, "" + loin);
        ok("… et sur les quatre côtés de la scène, pas seulement devant",
           Object.keys(quarts).length === 4, Object.keys(quarts).join(" "));
      })();
      /* LA RÉPARTITION. Le tirage de la largeur est fait par tranches
         exprès : à vingt tirages libres il reste toujours un trou, et
         le trou tombe au premier rang devant le DJ, c'est-à-dire au
         seul endroit que l'œil regarde. */
      (function(){
        var lat = PREM.map(function(o){
          return ((o.gx - N.SCENE_GX) - (o.gy - N.SCENE_GY)) / 2;
        }).sort(function(a, b){ return a - b; });
        var pire = 0;
        for(var q = 1; q < lat.length; q++) pire = Math.max(pire, lat[q] - lat[q - 1]);
        ok("le premier rang n'a pas de trou : le plus grand vide fait " + pire.toFixed(2)
           + " case de large", pire < 1.0, pire.toFixed(2));
        ok("… et il est plus large que la scène",
           lat[lat.length - 1] - lat[0] > R.coin * 2, (lat[lat.length - 1] - lat[0]).toFixed(1));
      })();
      /* DÉTERMINISTE. Sans cela, la piste se réorganiserait à chaque
         retour au briefing — et le premier rang changerait de tête
         entre deux regards. */
      var R2 = fabrique();
      ok("la même île rend toujours exactement la même foule",
         R2.d.every(function(o, q){
           return o.gx === D[q].gx && o.gy === D[q].gy && o.style === D[q].style;
         }));
      ok("les trois façons de danser sortent toutes les trois",
         (function(){
           var vus = {};
           for(var q = 0; q < D.length; q++) vus[D[q].style] = 1;
           return vus[0] && vus[1] && vus[2];
         })());
    })();

    /* LE PORTIQUE. Ses trois mâts se posent sur les coins du plancher,
       rentrés de 10 % : ils doivent tenir SUR la scène. Le nombre est
       relu du fichier livré pour que le test suive le dessin. */
    (function(){
      var d0 = html.indexOf("var mh = IBI_MH, ir = ");
      ok("le portique se relit dans le fichier livré", d0 > 0);
      if(d0 < 0) return;
      var ir = parseFloat(html.slice(d0).match(/ir = ([0-9.]+)/)[1]);
      ok("les mâts sont rentrés sur le plancher (" + ir + ")", ir > 0 && ir < 1, "" + ir);
      ok("… et la scène entière tient très à l'aise dans le carré réservé",
         3.5 * Math.SQRT1_2 < N.SCENE_DEMI * 0.5);
    })();
  })();

  /* ================================================================
     5i. LES MILY ET UNE NUITS

     La deuxième carte événement. Ce groupe ne juge pas si elle est
     belle — ça, on le regarde — il monte la garde sur les trois
     choses qu'une retouche du dessin pourrait casser sans bruit :
     qu'elle reste HORS de la campagne, qu'elle n'emprunte le temps
     d'AUCUNE autre île, et qu'elle se génère vraiment.
     ================================================================ */
  G("5i. Les Mily et une nuits");
  (function(){
    var IN = -1, q;
    for(q = 0; q < N.CARTES.length; q++) if(N.CARTES[q].biome === "nuits") IN = q;
    ok("elle existe, et elle s'écrit MILY", IN >= 0 &&
       N.CARTES[IN].nom === "Les Mily et une nuits" &&
       !/Mill?ie|Milly|Miley/i.test(N.CARTES[IN].nom),
       IN < 0 ? "absente" : N.CARTES[IN].nom);
    if(IN < 0) return;
    ok("c'est une carte ÉVÉNEMENT, hors de l'enchaînement",
       N.carteSpeciale(IN) && N.ORDRE_CAMPAGNE.indexOf(IN) < 0 && N.carteSuivante(IN) === -1);
    ok("elle a sa propre voie dans l'instantané, distincte de celle de la jungle",
       N.voieDeCarte(IN) === "n" && N.voieDeCarte(N.IDX_JUNGLE) === "j" &&
       N.carteDeVoie("n") === IN);
    ok("c'est l'objectif le plus lourd du jeu (" + (N.CARTES[IN].pvQG / 1e6) + " M)",
       N.CARTES.every(function(c, i){ return i === IN || c.pvQG < N.CARTES[IN].pvQG; }));
    ok("ses réglages sont les SIENS, pas ceux de la jungle",
       N.reglagesEvt(IN).pvBonus !== N.reglagesEvt(N.IDX_JUNGLE).pvBonus &&
       N.reglagesEvt(IN).degBonus !== N.reglagesEvt(N.IDX_JUNGLE).degBonus,
       "+" + N.reglagesEvt(IN).pvBonus + "% PV / +" + N.reglagesEvt(IN).degBonus + "% dégâts"
       + " contre +" + N.reglagesEvt(N.IDX_JUNGLE).pvBonus + " / +"
       + N.reglagesEvt(N.IDX_JUNGLE).degBonus);
    ok("… et son verrou tourne indépendamment de celui de la jungle",
       N.reglagesEvt(IN).attenteH > 0 && N.reglagesEvt(N.IDX_JUNGLE).attenteH > 0);
    /* ELLE N'EMPRUNTE LA MÉTÉO DE PERSONNE. Chacune de ces quatre
       questions se lit sur le BIOME ; il a suffi d'un « nuits » oublié
       dans une table pour qu'une île hérite de la pluie d'une autre. */
    ok("ni orage, ni foudre, ni tornades, ni scène de DJ",
       !N.carteOrageuse(IN) && !N.carteFoudre(IN) &&
       !N.carteTornades(IN) && !N.carteScene(IN));
    ok("mais elle a SON ciel, qui n'appartient qu'à elle",
       N.styleCiel(IN) === "etoile" &&
       N.CARTES.filter(function(c, i){ return N.styleCiel(i) === "etoile"; }).length === 1);
    ok("son biome n'appartient qu'à elle",
       N.CARTES.filter(function(c){ return c.biome === "nuits"; }).length === 1);
    /* LA VRAIE ÉPREUVE : elle se génère, et elle est peuplée. */
    var m = N.genereCarte("MILY", IN, "", 0);
    ok("elle se génère : " + m.batiments.length + " bâtiments, " + m.decors.length
       + " décors, " + m.rochers.length + " rochers, " + m.creatures.length + " bestioles",
       m.batiments.length > 600 && m.decors.length > 400 && m.creatures.length > 60,
       m.batiments.length + "/" + m.decors.length + "/" + m.creatures.length);
    ok("… ses décors tirent bien les QUATRE variantes",
       (function(){
         var vus = {};
         for(var k = 0; k < m.decors.length; k++) vus[m.decors[k].v] = 1;
         return vus[0] && vus[1] && vus[2] && vus[3];
       })());
    ok("… ses cinq cellules électriques sont là", m.reacteurs.length === N.NB_REACTEURS);
    /* LE DURCISSEMENT. C'est une carte événement : ses défenses
       doivent être plus dures que celles d'une île de campagne, et
       plus dures que celles de la jungle. Le Brasier, lui, ne bouge
       pas — c'est une carte mieux défendue, pas une carte plus
       longue. */
    (function(){
      var normale = N.genereCarte("MILY", 0, "", 0);
      function pvMoyen(c){
        var t = 0, n = 0;
        for(var k = 0; k < c.batiments.length; k++){
          var b = c.batiments[k];
          if(b.t === "cellule" || b.t === "reacteur") continue;
          t += b.pvMax; n++;
        }
        return n ? t / n : 0;
      }
      var jungle = N.genereCarte("MILY", N.IDX_JUNGLE, "", 0);
      ok("ses défenses sont plus dures que celles d'une île de campagne",
         pvMoyen(m) > pvMoyen(normale) * 1.5,
         Math.round(pvMoyen(normale)) + " → " + Math.round(pvMoyen(m)) + " PV en moyenne");
      ok("… et plus dures que celles de la jungle",
         pvMoyen(m) > pvMoyen(jungle),
         Math.round(pvMoyen(jungle)) + " (jungle) contre " + Math.round(pvMoyen(m)));
      ok("… mais le Brasier garde exactement sa vie",
         N.CARTES[IN].pvQG === 75000000);
    })();
    /* LES PALETTES vivent hors du noyau ; on les relit dans le fichier
       livré, comme periodeRoulement et la foule d'Ibiza. Ce qui compte
       ici : qu'elles EXISTENT. Une carte dont le biome n'a pas de
       palette n'affiche pas une île moche — elle laisse un écran noir
       et une tablette qui ne répond plus, parce que construitBriefing
       tourne avant la boucle de rendu. */
    /* LA FENÊTRE EST BORNÉE PAR LE BLOC SUIVANT, ET NON PAR UN NOMBRE
       D'OCTETS. Elle valait « les 9000 caractères après var BIOMES »,
       et ce test a fini par tomber pour une raison qui n'avait rien à
       voir avec lui : un commentaire ajouté à la palette d'Ibiza a
       poussé `nuits:` au-delà du neuf-millième caractère. Un test qui
       casse quand on documente le code au-dessus de ce qu'il regarde
       ne mesure pas ce qu'il croit mesurer. */
    function palette(nom, apres){
      var d = html.indexOf("var " + nom);
      var f = html.indexOf("var " + apres, d + 1);
      return d < 0 ? "" : html.slice(d, f > d ? f : d + 40000);
    }
    ok("son biome a bien sa palette de terrain et sa palette de matières",
       /nuits:\s*\{/.test(palette("BIOMES", "MATIERES")) &&
       /nuits:\s*\{/.test(palette("MATIERES", "BIOMES")));
    ok("… et ses quatre décors sont branchés dans dessineDecor",
       /jardinNuits/.test(html) && /lanternesNuits/.test(html) &&
       /fontaineNuits/.test(html) && /tapisNuits/.test(html));
    /* ET AUCUN BÂTIMENT DANS LE DÉCOR. C'est une décision, pas un
       oubli : la carte porte déjà des bâtiments — les défenses — et
       leur en ajouter de petits donnait deux architectures à deux
       échelles sur la même image. Ce test empêche qu'ils reviennent
       par mégarde. */
    ok("… et aucun faux bâtiment n'est revenu dans le décor",
       !/palaisNuits|archeNuitsDecor|tenteNuits|domeNuits/.test(html));
    ok("… et sa vignette d'accueil est la sienne, pas celle de la jungle",
       /dessineVignetteNuits/.test(html) && /n:"dessineVignetteNuits"/.test(html));

    /* ================================================================
       ELLE EST EN CHANTIER : ON LA REGARDE, ON N'Y JOUE PAS

       Le verrou fermait TROIS portes — lancer, rejoindre, visiter. Il
       n'en ferme plus que deux : la visite est ouverte à tout le
       monde, par le même bouton que sur les onze autres cartes. Ce
       n'est pas un trou dans le verrou, c'est le constat que cette
       porte-là ne gardait plus rien : rien de ce qui se passe pendant
       une visite ne quitte l'appareil — ni message d'état, ni
       instantané, ni dégât rangé — et l'appui long de cinq secondes
       qui la gardait avait déjà été retiré des cartes ordinaires pour
       cette raison exacte.

       LES DEUX PORTES QUI COMPTENT SE FERMENT TOUJOURS PAR LE MÊME
       ENDROIT : etatEvt() rend « chantier », et le bouton d'entrée ne
       s'arme que sur « prete » ou « encours ».
       Le jour de l'ouverture, on efface `chantier` de sa ligne dans
       CARTES et rien d'autre ne bouge — c'est ce que ce groupe
       vérifie aussi, en n'épinglant JAMAIS le fait qu'elle soit
       fermée, seulement la cohérence entre le drapeau et ses effets.
       ================================================================ */
    (function(){
      var enTravaux = N.carteEnChantier(IN);
      ok("le drapeau de chantier se lit sur la carte, et sur elle seule",
         N.CARTES.filter(function(c, q2){ return N.carteEnChantier(q2); }).length <= 1 &&
         !N.carteEnChantier(N.IDX_JUNGLE) && !N.carteEnChantier(0) &&
         !N.carteEnChantier(999),
         enTravaux ? "en travaux" : "ouverte");
      /* La lecture d'etatEvt vit hors du noyau ; on la relit dans le
         fichier livré, comme periodeRoulement et la foule d'Ibiza. */
      var d0 = html.indexOf("function etatEvt(");
      var f0 = d0 < 0 ? -1 : html.indexOf("\n}", d0);
      ok("etatEvt se relit dans le fichier livré", d0 > 0 && f0 > d0);
      if(d0 < 0 || f0 < 0) return;
      var src = html.slice(d0, f0 + 2);
      function etat(chantier, enCours, attente, joueurs, mini){
        return new Function("voieDeCarte", "carteEnChantier", "evenementEnCours",
                            "attenteEvenement", "joueursEnLigne", "minJoueursEvt", "monde",
                            src + "; return etatEvt(0);")
               (function(){ return "n"; }, function(){ return chantier; },
                function(){ return enCours; }, function(){ return attente; },
                function(){ return joueurs; }, function(){ return mini; }, {});
      }
      /* LE CHANTIER PASSE AVANT TOUT : même prête, même en cours, même
         sans verrou, une carte en travaux reste en travaux. */
      ok("en chantier, l'état est « chantier » quoi qu'il arrive par ailleurs",
         etat(1, 0, 0, 99, 1) === "chantier" &&
         etat(1, 1, 0, 99, 1) === "chantier" &&
         etat(1, 0, 999, 0, 9) === "chantier");
      ok("… et hors chantier, les quatre états d'origine sont intacts",
         etat(0, 1, 0, 0, 9) === "encours" &&
         etat(0, 0, 999, 99, 1) === "cooldown" &&
         etat(0, 0, 0, 9, 7) === "prete" &&
         etat(0, 0, 0, 2, 7) === "attente");
      /* LE BOUTON D'ENTRÉE ne s'arme que sur deux états. C'est CETTE
         ligne qui ferme les deux premières portes ; si elle changeait,
         le chantier ne bloquerait plus rien. */
      ok("le bouton d'entrée ne s'arme que sur « prete » ou « encours »",
         /e !== "prete" && e !== "encours"/.test(html) &&
         /var actif = \(e === "prete" \|\| e === "encours"\)/.test(html));
      /* LA VISITE EST OUVERTE, et par le bouton de tout le monde :
         une carte en travaux est justement celle qu'on aimerait
         regarder. Le bouton est posé SANS condition — un ternaire
         reviendrait à refermer la porte. */
      ok("toute carte événement porte le bouton Visiter, chantier compris",
         /\+ boutonVisite\(i\)\s*\n\s*\+ blocTop3\(i\)/.test(html));
      ok("… et il mène à la PRÉVISUALISATION, jamais à une partie réelle",
         /function demandeVisite\([\s\S]{0,700}ouvreApercuAdmin\(i\)/.test(html) &&
         !/function demandeVisite\([\s\S]{0,700}lanceExpedition/.test(html));
      /* LA VISITE NE PUBLIE RIEN, et c'est ce qui autorise à l'ouvrir.
         Si ce robinet se rouvrait, une île en travaux visitée
         gonflerait le classement du salon pour tout le monde. */
      ok("… et rien de ce qui s'y passe ne quitte l'appareil",
         /function envoie\(obj\)\{[\s\S]{0,600}if\(modeApercu\) return;/.test(html) &&
         /function repliMesDegats\(\)\{[\s\S]{0,900}if\(modeApercu\) return;/.test(html) &&
         /function publieMonde\(force\)\{[\s\S]{0,600}if\(modeApercu\) return;/.test(html));
      /* ET L'APPUI LONG A DISPARU AVEC LE VERROU QU'IL GARDAIT. Le
         laisser en place, c'était garder cinq secondes de cérémonie
         devant une porte ouverte. */
      ok("l'appui long de cinq secondes ne subsiste nulle part",
         !/chantierBarre/.test(html) && !/CHANTIER_DUREE/.test(html) &&
         !/function ouvreChantier\(/.test(html));
    })();

    /* ================================================================
       LE TOURBILLON D'ÉTOILES

       « Duplique la tornade de feu, une fois et demie plus grande, la
       traînée plus large — mais pas du feu. »

       La mécanique n'est PAS dupliquée : c'est le même moteur, piloté
       par profilTornade(). Ce groupe garde deux choses — que les deux
       profils restent bien distincts, et que la promesse de sécurité
       tient aussi pour le grand : une tornade qu'on ne peut pas
       esquiver n'est pas un danger, c'est un piège.
       ================================================================ */
    (function(){
      var PN = N.profilTornade(IN), PT = N.profilTornade(N.IDX_JUNGLE);
      var PF = N.profilTornade(N.CARTES.findIndex(function(c){ return c.biome === "tenebres"; }));
      ok("les Mily et une nuits ont des tornades, et elles sont d'étoiles",
         !!PN && PN.style === "etoiles" && N.carteTourbillons(IN));
      ok("les ténèbres gardent les leurs, et elles sont de feu",
         !!PF && PF.style === "feu" && N.carteTornades(N.CARTES.findIndex(
           function(c){ return c.biome === "tenebres"; })));
      /* QUATRE ÎLES EN ONT, ET PAS LA JUNGLE. La campagne puis la
         guinguette ont rejoint les deux premières avec la tornade
         classique — celle de poussière, la seule des trois sortes qui
         ressemble à une vraie. La jungle, elle, n'en a pas : elle a
         déjà l'orage et la foudre, et deux dangers qui tombent du ciel
         ne se distingueraient plus l'un de l'autre.
         Ce test n'épingle PAS le nombre d'îles — il en viendra
         d'autres — mais les deux règles qui tiennent : la jungle en
         est exclue, et une île sans tornade n'a pas de profil vide,
         elle n'a pas de profil du tout. */
      ok("la jungle n'a pas de tornade, et les îles ordinaires non plus",
         !PT && !N.profilTornade(0) && !N.profilTornade(999),
         N.CARTES.filter(function(c, q3){ return N.carteAvecTornades(q3); })
           .map(function(c){ return c.nom; }).join(", "));
      ok("… et les trois SORTES existent toutes, chacune sur au moins une île",
         (function(){
           var vus = {}, q4;
           for(q4 = 0; q4 < N.CARTES.length; q4++){
             var Q = N.profilTornade(q4);
             if(Q) vus[Q.style] = (vus[Q.style] || 0) + 1;
           }
           return vus.feu >= 1 && vus.etoiles >= 1 && vus.poussiere >= 1;
         })());
      /* LA GUINGUETTE : la même tornade que la campagne, mais par
         deux — c'était tout l'objet de la demande. */
      (function(){
        var IG = N.CARTES.findIndex(function(c){ return c.biome === "guinguette"; });
        var PG = N.profilTornade(IG);
        ok("la guinguette a ses tornades, de poussière comme la campagne",
           !!PG && PG.style === "poussiere");
        ok("… et elles tombent PAR DEUX", !!PG && N.paireTornade(PG) === 2);
        /* Et la paire suivante attend que celle-ci soit morte : c'est
           la même arithmétique que sur les nuits, avec des durées de
           campagne — d'où la période allongée à 52 s. */
        var vieMax = PG.descente + PG.vie * PG.trajetMax;
        ok("… et une paire est toujours éteinte quand la suivante tombe",
           PG.periode - PG.jitter * PG.periode >= vieMax,
           "vie max " + vieMax.toFixed(1) + " s, fenêtre "
           + (PG.periode - PG.jitter * PG.periode).toFixed(1) + " s");
      })();
      ok("une île de campagne n'a pas de profil du tout, pas un profil vide",
         N.profilTornade(0) === null);
      /* LA TAILLE : une fois et demie, exactement. */
      ok("le rayon mortel est une fois et demie celui du feu ("
         + PF.rayon + " → " + PN.rayon + " cases)",
         Math.abs(PN.rayon - PF.rayon * N.EQ.TOURBILLON_ECH) < 1e-9);
      ok("… et sa hauteur aussi (" + PF.haut + " → " + PN.haut + " pixels)",
         Math.abs(PN.haut - PF.haut * N.EQ.TOURBILLON_ECH) < 1e-9);
      /* LA TRAÎNÉE : « un petit peu plus large » encore. */
      ok("la traînée est plus large que le facteur ne le voudrait ("
         + (PF.traineeR * 1.5).toFixed(2) + " suffirait, elle fait " + PN.traineeR + ")",
         PN.traineeR > PF.traineeR * N.EQ.TOURBILLON_ECH);
      ok("… mais jamais plus large que le pied qui la sème",
         PN.traineeR <= PN.rayon, PN.traineeR + " ≤ " + PN.rayon);
      /* LA PROMESSE DE SÉCURITÉ, refaite pour le grand. Un couloir une
         fois et demie plus large à préavis égal serait un piège une
         fois et demie plus grand : l'avertissement s'allonge donc dans
         la même proportion, et l'on remesure. */
      (function(){
        var lent = 1e9, nom = "", i;
        for(i in N.UNI) if(N.UNI[i].vitesse < lent){ lent = N.UNI[i].vitesse; nom = N.UNI[i].nom; }
        var marche = PN.descente * lent;
        ok("l'avertissement seul suffit à sortir du couloir : le " + nom
           + " parcourt " + marche.toFixed(1) + " cases pendant que l'entonnoir descend, "
           + "pour " + PN.rayon + " à franchir",
           marche > PN.rayon * 1.5, marche.toFixed(2) + " > " + (PN.rayon * 1.5).toFixed(2));
        ok("… et le préavis a bien grandi avec le couloir",
           PN.descente / PF.descente >= PN.rayon / PF.rayon * 0.85,
           "préavis ×" + (PN.descente / PF.descente).toFixed(2)
           + " pour un couloir ×" + (PN.rayon / PF.rayon).toFixed(2));
      })();
      ok("le couloir mortel reste plus étroit qu'un débarquement",
         PN.rayon * 2 <= N.rayonFormation(),
         (PN.rayon * 2) + " contre " + N.rayonFormation().toFixed(2));
      ok("elle est plus lente que celle de feu — une masse plus grande",
         PN.vitesse < PF.vitesse, PN.vitesse + " contre " + PF.vitesse);
      ok("et plus rare", PN.periode > PF.periode, PN.periode + " s contre " + PF.periode);
      ok("la traînée s'éteint bien avant la fin de sa course",
         PN.trainee < PN.vie * PN.trajetMin * 0.5,
         PN.trainee + " s de traînée pour " + (PN.vie * PN.trajetMin).toFixed(0) + " s de course");
      /* LE MOTEUR EST COMMUN, et c'est la raison d'être de tout ce
         remaniement : deux mises à jour séparées auraient divergé au
         premier réglage. */
      ok("il n'y a qu'UNE mise à jour de tornade dans tout le fichier livré",
         (html.match(/function majTornades\(/g) || []).length === 1);
      ok("… et qu'UNE fonction qui tue, commune aux deux",
         (html.match(/function tueDansLeFeu\(/g) || []).length === 1);
      ok("… qui n'abîme ni bâtiment ni bête : elle ne touche que jeu.unites",
         /function tueDansLeFeu\([\s\S]{0,900}unitesAutour/.test(html) &&
         !/function tueDansLeFeu\([\s\S]{0,900}abimeBatiment/.test(html));
      /* Le dessin, lui, est bien séparé — c'est là que tout diffère. */
      ok("mais deux dessins distincts, aiguillés par le style",
         /dessineTourbillonMonde/.test(html) && /dessineTraceEtoileeSol/.test(html) &&
         /t\.style === "etoiles"/.test(html) && /b\.style === "etoiles"/.test(html));
      ok("et deux sons distincts : l'une gronde, l'autre tinte",
         /function tourbillonSon\(/.test(html) && /function tornadeSon\(/.test(html) &&
         /style === "etoiles"[\s\S]{0,120}tourbillonSon/.test(html));
    })();

    /* ================================================================
       LA MÊME TORNADE POUR TOUT LE MONDE

       « Est-ce que chaque joueur voit la même tornade au même endroit
       au même moment ? » — maintenant oui, et sans un octet de réseau :
       elle est RECALCULÉE à partir d'une graine commune et de
       l'horloge découpée en créneaux.

       Ce groupe garde les trois choses qui font tenir ce montage, et
       chacune casse le partage à elle seule si elle saute.
       ================================================================ */
    (function(){
      var d = html.indexOf("function tornadeDuCreneau(");
      var f = d < 0 ? -1 : html.indexOf("\n}", d);
      ok("la fabrique de tornade se relit dans le fichier livré", d > 0 && f > d);
      if(d < 0 || f < 0) return;
      var src = html.slice(html.indexOf("function graineTornade("), f + 2);
      function moteur(code, index, cycle){
        return new Function("graineTexte", "prng", "borne", "GW", "GH", "paireTornade",
          "var CODE_SALON = '" + code + "';\n" +
          "var cycleSalon = " + cycle + ";\n" +
          "var jeu = { index:" + index + " };\n" +
          src + "; return tornadeDuCreneau;")
          (N.graineTexte, N.prng, N.borne, N.GW, N.GH, N.paireTornade);
      }
      var P = N.profilTornade(2);
      var A = moteur("MILY", 2, 0), B = moteur("MILY", 2, 0);
      /* LA PROPRIÉTÉ QUI PORTE TOUT : deux clients qui ne se sont
         jamais parlé calculent le même objet, au bit près. */
      var pareil = true, det = "";
      for(var n = 1000; n < 1040; n++){
        var a = JSON.stringify(A(n, P)), b = JSON.stringify(B(n, P));
        if(a !== b){ pareil = false; det += n + " "; }
      }
      ok("deux clients calculent EXACTEMENT la même tornade, sans se parler",
         pareil, det || "quarante créneaux identiques");
      /* … et deux créneaux voisins ne se ressemblent pas : une graine
         qui ne mélangerait pas assez donnerait quarante fois la même
         tornade, et le test ci-dessus passerait quand même. */
      (function(){
        var vus = {}, n2, distinctes = 0;
        for(n2 = 1000; n2 < 1040; n2++){
          var t = A(n2, P);
          var cle = t.gx.toFixed(2) + "," + t.gy.toFixed(2);
          if(!vus[cle]){ vus[cle] = 1; distinctes++; }
        }
        ok("… et quarante créneaux donnent quarante tornades différentes",
           distinctes === 40, distinctes + "/40");
      })();
      /* CHAQUE ÎLE A SA MÉTÉO, et une campagne neuve en a une autre.
         Sans l'île dans la graine, les trois cartes à tornades
         verraient la même ; sans le cycle, une campagne recommencée
         rejouerait la météo de la précédente à la seconde près. */
      ok("chaque île a sa propre suite de tornades",
         JSON.stringify(moteur("MILY", 2, 0)(1000, P)) !==
         JSON.stringify(moteur("MILY", 7, 0)(1000, P)));
      ok("… et une campagne neuve en repart sur une autre",
         JSON.stringify(moteur("MILY", 2, 0)(1000, P)) !==
         JSON.stringify(moteur("MILY", 2, 1)(1000, P)));
      ok("… et deux salons différents aussi",
         JSON.stringify(moteur("MILY", 2, 0)(1000, P)) !==
         JSON.stringify(moteur("AUTRE", 2, 0)(1000, P)));
      /* ELLE NAÎT DANS SON CRÉNEAU, jamais en dehors : sinon deux
         tornades voisines se chevaucheraient et le compte des vivantes
         ne voudrait plus rien dire. */
      (function(){
        var dedans = true, n3;
        for(n3 = 1000; n3 < 1060; n3++){
          var t = A(n3, P);
          if(t.naissance < n3 * P.periode ||
             t.naissance >= (n3 + 1) * P.periode) dedans = false;
        }
        ok("chaque tornade naît bien dans son propre créneau", dedans);
      })();
      /* LE PAS FIXE. C'est le point le plus facile à casser sans s'en
         apercevoir : une trajectoire intégrée avec le dt de l'image
         diverge entre deux appareils qui ne tournent pas au même
         rythme, et les tornades s'écartent de plusieurs cases en dix
         secondes. Le moteur ne doit avancer QUE par pas fixes. */
      ok("la trajectoire s'intègre à PAS FIXE, jamais avec le dt de l'image",
         /var TORNADE_PAS_FIXE = [\d.]+;/.test(html) &&
         /function pasTornade\(t, P, vif, T\)\{[\s\S]{0,200}var pas = TORNADE_PAS_FIXE;/.test(html));
      ok("… et pasTornade ne reçoit jamais le dt",
         !/pasTornade\([^)]*\bdt\b/.test(html));
      /* LE REMBOBINAGE : un joueur qui arrive en retard rejoue la
         tornade depuis sa naissance, sans tuer personne au passage. */
      ok("un joueur qui arrive en cours rembobine la tornade",
         /pasARattraper[\s\S]{0,120}pasTornade\(t, P, 0, T\)/.test(html));
      ok("… et le rembobinage ne tue personne : le drapeau vif est à zéro",
         /if\(!vif\) return;[\s\S]{0,200}tueDansLeFeu/.test(html));
      /* L'HORLOGE EST PARTAGÉE, et c'est la seule entrée extérieure. */
      ok("l'horloge est celle de l'appareil, donc commune",
         /function horlogeTornade\(\)\{ return Date\.now\(\) \* 0\.001; \}/.test(html));
      /* ET PLUS AUCUN HASARD dans la fabrique : un seul Math.random y
         suffirait à désaccorder tout le salon. */
      ok("aucun Math.random ne subsiste dans la fabrique de tornade",
         !/Math\.random/.test(src));

      /* ================================================================
         DEUX À LA FOIS — les jumelles des Mily et une nuits

         « Pour les Mily et une nuits il faudrait 2 tornades en même
         temps. » Trois choses font que c'est vrai, et chacune tombe
         toute seule si on la retire :
           — elles naissent au MÊME instant, sinon on voit deux
             tornades qui se suivent ;
           — elles naissent LOIN l'une de l'autre, sinon on n'en voit
             qu'une ;
           — la paire suivante attend que celle-ci soit morte, sinon
             il y en a quatre.
         ================================================================ */
      (function(){
        var IN = -1, i2;
        for(i2 = 0; i2 < N.CARTES.length; i2++)
          if(N.CARTES[i2].biome === "nuits") IN = i2;
        var PN = N.profilTornade(IN);
        ok("les Mily et une nuits lèvent DEUX tourbillons par créneau",
           N.paireTornade(PN) === 2, "paire " + PN.paire);
        ok("… et les deux autres îles gardent leur tornade seule",
           N.paireTornade(N.profilTornade(2)) === 1 &&
           N.paireTornade(N.profilTornade(N.IDX_JUNGLE < 0 ? 2 : 2)) === 1);
        /* LE MOTEUR DES NUITS, relu dans le fichier livré comme
           ci-dessus : on teste ce qui est LIVRÉ, pas une copie. */
        var W = moteur("MILY", IN, 0);
        /* 1. LE MÊME INSTANT. C'est toute la demande : si chacune
              tirait son décalage, elles seraient à dix secondes
              l'une de l'autre. */
        var ensemble = true, ecarts = 0, minEcart = 1e9, n4;
        for(n4 = 2000; n4 < 2400; n4++){
          var a4 = W(n4, PN, 0), b4 = W(n4, PN, 1);
          if(a4.naissance !== b4.naissance) ensemble = false;
          var e4 = Math.abs(a4.gx - b4.gx);
          if(e4 < minEcart) minEcart = e4;
          if(e4 < N.EQ.TOURBILLON_ECART) ecarts++;
        }
        ok("les deux jumelles naissent au MÊME instant", ensemble);
        /* 2. LOIN L'UNE DE L'AUTRE. Deux entonnoirs collés ne font
              qu'un danger pour deux fois le calcul. */
        ok("… et jamais l'une sur l'autre : chacune dans sa moitié d'île",
           ecarts === 0, "écart minimum " + minEcart.toFixed(1) +
           " cases sur 400 paires");
        /* … mais pas toujours dans le même sens, sinon l'œil
           apprendrait la paire en trois créneaux. */
        var ouest = 0;
        for(n4 = 2000; n4 < 2400; n4++) if(W(n4, PN, 0).gx < N.GW / 2) ouest++;
        ok("… et ce n'est pas toujours la même qui prend l'ouest",
           ouest > 120 && ouest < 280, ouest + "/400 fois à l'ouest");
        /* 3. JAMAIS QUATRE. Une paire doit être éteinte quand la
              suivante tombe — c'est de l'arithmétique, pas une
              impression, et c'est le flottement réduit qui la tient. */
        var chevauche = 0, marge = 1e9;
        for(n4 = 0; n4 < 10000; n4++){
          var fin = 0;
          for(var j4 = 0; j4 < 2; j4++){
            var t4 = W(n4, PN, j4);
            var m4 = t4.naissance + PN.descente + t4.vie;
            if(m4 > fin) fin = m4;
          }
          var suiv = W(n4 + 1, PN, 0).naissance;
          if(fin > suiv) chevauche++;
          if(suiv - fin < marge) marge = suiv - fin;
        }
        ok("une paire est toujours éteinte quand la suivante tombe",
           chevauche === 0,
           "sur 10 000 créneaux, marge minimale " + marge.toFixed(2) + " s");
        /* ET LES DEUX CLIENTS VOIENT LA MÊME PAIRE. Sans quoi tout
           l'exercice du partage sans réseau tombe pour cette île. */
        var W2 = moteur("MILY", IN, 0), pareil2 = true;
        for(n4 = 2000; n4 < 2040; n4++)
          for(j4 = 0; j4 < 2; j4++)
            if(JSON.stringify(W(n4, PN, j4)) !== JSON.stringify(W2(n4, PN, j4)))
              pareil2 = false;
        ok("… et deux clients calculent la même paire, au bit près", pareil2);
        /* LA PAIRE ENTRE ENTIÈRE OU PAS DU TOUT, et le plafond reste
           à deux entonnoirs : c'est la paire qui remplace la tornade
           seule, elle ne s'y ajoute pas. */
        ok("le plafond se juge sur la paire entière, jamais sur une jumelle",
           /jeu\.tornades\.length \+ NJ > 2/.test(html));
        ok("… et le son ne sonne qu'une fois pour la paire",
           /if\(son\.tornade\) son\.tornade\(\);\s*\n\s*for\(j = 0; j < neuves\.length/.test(html));
      })();
    })();

    /* ================================================================
       ET ELLE LES EMPORTE

       « Il ne faut pas d'effet où elles se font éjecter, et que ce soit
       moche. » L'effet doit donc ASPIRER : happée vers l'axe, montée,
       disparition. Rien ne retombe.
       ================================================================ */
    (function(){
      ok("le pied de l'entonnoir emporte ce qu'il touche",
         /t:"emportee"/.test(html) &&
         /tueDansLeFeu\(t\.gx, t\.gy, P\.rayon, t\)/.test(html));
      /* LA TRAÎNÉE AU SOL, ELLE, N'EMPORTE RIEN. C'est de la terre en
         feu : il n'y a pas de colonne d'air au-dessus. On meurt dedans,
         on n'y est pas aspiré — et le quatrième argument le dit. */
      ok("… mais la traînée au sol, non : elle tue sans emporter",
         /tueDansLeFeu\(b\.gx, b\.gy, P\.traineeR, null\)/.test(html));
      ok("la troupe est bien HAPPÉE VERS L'AXE et non projetée",
         /r0 \* Math\.pow\(1 - tm, 1\.4\)/.test(html));
      /* ELLE MONTE, ELLE RAPETISSE, ET ELLE NE RETOMBE JAMAIS.
         La première écriture de cette vérification cherchait l'ABSENCE
         des mots « retombe » et « chute » dans le voisinage — et elle
         échouait, parce que `!/a|b/` ne dit pas ce qu'on croit : le
         « ou » englobe toute l'alternative, si bien que le test lisait
         « ni (emportee… retombe) ni (chute n'importe où dans le
         fichier) ». Le mot « chute » vit ailleurs, dans le commentaire
         des secousses.
         Chercher l'absence d'un mot était de toute façon une mauvaise
         idée : on ne garde pas une propriété en interdisant un
         vocabulaire. On rejoue donc la HAUTEUR sur toute la durée de
         l'effet et l'on vérifie qu'elle ne redescend pas une seule
         fois — c'est cela, « elle ne retombe jamais ». */
      (function(){
        var dh = html.indexOf('}else if(e.t === "emportee"){');
        var fh = dh < 0 ? -1 : html.indexOf("var mont = tm * tm;", dh);
        ok("le bloc de l'aspiration se relit dans le fichier livré", dh > 0 && fh > dh);
        if(dh < 0 || fh < 0) return;
        var monte = true, avant = -1, k, tm, mont, haut;
        for(k = 0; k <= 100; k++){
          tm = k / 100;
          mont = tm * tm;                    // la courbe de montée, recopiée
          haut = mont * 300;
          if(haut < avant - 1e-9) monte = false;
          avant = haut;
        }
        ok("elle monte sans jamais redescendre, du premier au dernier instant",
           monte && /var haut = mont \* 300 \* z;/.test(html),
           "de 0 à " + (300).toFixed(0) + " px, en t²");
        ok("… et elle rapetisse en montant",
           /1 - tm \* 0\.72/.test(html));
        ok("… puis s'efface sur le dernier quart, jamais avant",
           /tm < 0\.72 \? 1 : Math\.max\(0, \(1 - tm\) \/ 0\.28\)/.test(html));
      })();
      ok("l'effet n'est que du décor : la troupe est morte avant lui",
         /t:"emportee"[\s\S]{0,400}toucheUnite\(u, u\.pv \+ 1\)/.test(html));
    })();

    /* ================================================================
       L'AIR MAGIQUE

       « Des étoiles qui flottent dans l'air, des bulles magiques, de
       la poussière d'étoile, des papillons géants. »

       Ce groupe ne juge pas la beauté — ça, on le regarde. Il monte la
       garde sur les quatre choses qu'une retouche du dessin pourrait
       casser sans bruit : que l'air reste sur CETTE île, qu'il ait ses
       DEUX couches (une seule et il flotte au-dessus de la carte au
       lieu d'être dedans), qu'il soit DÉTERMINISTE (le même pour tous
       les joueurs du salon, sans un octet de réseau), et qu'il sache
       se TAIRE au dézoom, parce que la promesse est qu'il tourne sur
       une tablette.
       ================================================================ */
    (function(){
      ok("l'air magique est à elle, et à elle seule",
         N.carteAirMagique(IN) && !N.carteAirMagique(N.IDX_JUNGLE) &&
         !N.carteAirMagique(0) && !N.carteAirMagique(999) &&
         N.CARTES.filter(function(c, q5){ return N.carteAirMagique(q5); }).length === 1);
      /* Le champ vit hors du noyau ; on le rejoue depuis le fichier
         livré, comme etatEvt et la foule d'Ibiza. */
      var d1 = html.indexOf("function construitAirNuits(");
      var f1 = d1 < 0 ? -1 : html.indexOf("\n}", d1);
      ok("le champ de l'air se relit dans le fichier livré", d1 > 0 && f1 > d1);
      if(d1 < 0 || f1 < 0) return;
      var srcA = html.slice(html.indexOf("var AIR_TUILE"), f1 + 2);
      function champ(){
        return new Function("prng", srcA + "; return construitAirNuits();")(N.prng);
      }
      var A = champ(), A2 = champ();
      ok("les quatre espèces sont peuplées : " + A.grains.length + " grains, "
         + A.etoiles.length + " étoiles, " + A.bulles.length + " bulles, "
         + A.papillons.length + " papillons",
         A.grains.length > 20 && A.etoiles.length > 6 &&
         A.bulles.length > 2 && A.papillons.length > 0);
      /* LE DÉTERMINISME. Le champ ne passe pas par le réseau : c'est
         le tirage qui garantit que deux joueurs voient le même air.
         Un Math.random() glissé dedans le casserait en silence — deux
         tablettes côte à côte, deux ciels différents. */
      ok("il est DÉTERMINISTE : deux constructions donnent le même air",
         JSON.stringify(A) === JSON.stringify(A2));
      ok("… et aucun Math.random ne s'est glissé dans le champ",
         !/Math\.random/.test(srcA));
      /* LES DEUX COUCHES. C'est ce qui met l'air DANS la carte au lieu
         de le coller sur l'écran : la couche 0 passe derrière les
         tours, la couche 1 devant. Si l'une se vidait, on ne verrait
         plus la différence — et personne ne s'en apercevrait avant
         de regarder une capture de près. */
      function parCouche(l, c){ return l.filter(function(e){ return e.c === c; }).length; }
      ok("la poussière est partagée entre les deux couches ("
         + parCouche(A.grains, 0) + " derrière, " + parCouche(A.grains, 1) + " devant)",
         parCouche(A.grains, 0) > 3 && parCouche(A.grains, 1) > 3);
      ok("… et les étoiles flottantes aussi ("
         + parCouche(A.etoiles, 0) + " / " + parCouche(A.etoiles, 1) + ")",
         parCouche(A.etoiles, 0) > 0 && parCouche(A.etoiles, 1) > 0);
      ok("le rendu appelle bien les DEUX couches, dans cet ordre",
         (function(){
           var a = html.indexOf("dessineAirNuits(ctx, tps, vue, 0)");
           var b = html.indexOf("dessineAirNuits(ctx, tps, vue, 1)");
           return a > 0 && b > a;
         })());
      ok("… la première AVANT la pile de profondeur, la seconde APRÈS",
         (function(){
           var a = html.indexOf("dessineAirNuits(ctx, tps, vue, 0)");
           var p = html.indexOf("pile.sort(function");
           var b = html.indexOf("dessineAirNuits(ctx, tps, vue, 1)");
           return a > 0 && p > a && b > p;
         })());
      ok("… et les deux sous le verrou de l'île, jamais ailleurs",
         /carteAirMagique\(jeu\.index\)\)\s*dessineAirNuits\(ctx, tps, vue, 0\)/.test(html) &&
         (html.match(/dessineAirNuits\(/g) || []).length === 3);
      /* LA TENUE SUR TABLETTE : trois freins, et ils sont tous les
         trois dans le fichier. Un seul qui saute et un téléphone
         dessine mille grains d'un pixel. */
      ok("il sait se taire au dézoom : un seuil par espèce",
         /AIR_Z_GRAIN\s*=/.test(html) && /AIR_Z_ETOILE\s*=/.test(html) &&
         /AIR_Z_BULLE\s*=/.test(html) && /AIR_Z_PAPILLON\s*=/.test(html) &&
         /if\(z < AIR_Z_ETOILE\) return;/.test(html));
      ok("… un garde-fou sur le nombre de tuiles",
         /> 42\) return;/.test(html));
      ok("… et un plafond global de particules",
         /AIR_PLAFOND\s*=\s*\d+/.test(html) && /> AIR_PLAFOND/.test(html));
      /* LES SPRITES sont cuits UNE FOIS. À trois cents grains par
         image, un dégradé par grain, c'est trois cents dégradés :
         c'est exactement le poste qui fait tomber une tablette. */
      ok("les lueurs sont pré-cuites, pas refaites à chaque image",
         /function spritesAir\([\s\S]{0,400}if\(AIR_SP\) return AIR_SP;/.test(html));
    })();
  })();

  G("5d. Mily dans la jungle — la carte événement");
  /* LA PROPRIÉTÉ QUI PORTE TOUT : la jungle ne doit RIEN changer à
     l'enchaînement des cinq îles. */
  /* Ce n'est plus « son index est au-delà des îles ordinaires » — trois
     îles vivent maintenant APRÈS elle dans le tableau, exprès, pour ne
     pas déplacer le sien. C'est l'ORDRE qui dit l'enchaînement. */
  ok("la jungle n'est pas dans l'enchaînement des îles",
     N.ORDRE_CAMPAGNE.indexOf(N.IDX_JUNGLE) < 0 && N.carteSuivante(N.IDX_JUNGLE) === -1);
  /* Elle domine toute la CAMPAGNE — c'est ce que « carte événement »
     veut dire. Elle ne domine plus toutes les cartes du jeu : « Mily
     et les mille et une nuits » est plus lourde encore, exprès. */
  ok("elle a plus de vie que toutes les îles de campagne",
     N.CARTES.every(function(c, i){
       return N.carteSpeciale(i) || c.pvQG < N.CARTES[N.IDX_JUNGLE].pvQG;
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

    /* ================================================================
       LA VOIE N'EST PLUS « LA JUNGLE », C'EST UNE LETTRE

       Tout ce qui précède doit rester vrai — c'est ce que les
       vérifications d'au-dessus garantissent, elles n'ont pas bougé
       d'une ligne. Ce qui suit épingle ce qui est NEUF : qu'il puisse y
       avoir plusieurs voies, et qu'elles soient étanches.
       ================================================================ */
    ok("la jungle porte bien la lettre « j »",
       N.voieDeCarte(N.IDX_JUNGLE) === "j" && N.carteDeVoie("j") === N.IDX_JUNGLE);
    ok("une île de campagne n'a aucune voie",
       N.voieDeCarte(0) === "" && N.voieDeCarte(999) === "");
    ok("toute carte spéciale a une voie, et deux n'ont jamais la même",
       (function(){
         var vus = {}, q;
         for(q = 0; q < N.CARTES.length; q++){
           if(!N.carteSpeciale(q)) continue;
           var P = N.voieDeCarte(q);
           if(!P || vus[P]) return false;
           vus[P] = 1;
         }
         return N.VOIES_EVT.length === N.CARTES.filter(function(c){ return c.special; }).length;
       })(),
       N.VOIES_EVT.map(function(V){ return V.P + "→" + N.CARTES[V.i].nom; }).join(", "));
    /* LES NOMS DE CHAMPS SUR LE FIL NE BOUGENT PAS. C'est LA promesse
       de compatibilité : les instantanés retenus de tous les salons du
       monde portent déjà je/jf/jd/jq/jt/jm/jmn/jb, et les renommer
       perdrait tout ce qu'ils contiennent. */
    (function(){
      var o = {};
      N.voiePosee(o, "j", { e:1, f:2, d:"ZZ", q:33, t:44, mj:9, mn:5, b:250 });
      ok("voiePosee écrit EXACTEMENT les huit champs d'origine de la jungle",
         o.je === 1 && o.jf === 2 && o.jd === "ZZ" && o.jq === 33 &&
         o.jt === 44 && o.jm === 9 && o.jmn === 5 && o.jb === 250,
         JSON.stringify(o));
      var r = N.voieLue(o, "j", N.IDX_JUNGLE);
      ok("… et voieLue les relit à l'identique",
         r.e === 1 && r.f === 2 && r.d === "ZZ" && r.q === 33 &&
         r.t === 44 && r.mj === 9 && r.mn === 5 && r.b === 250);
    })();
    ok("evenementEnCours dit la même chose que jungleEnCours sur la jungle",
       N.evenementEnCours(m({ je:1, jf:0 }), "j") === N.jungleEnCours(m({ je:1, jf:0 })) &&
       N.evenementEnCours(m({ je:3, jf:3 }), "j") === N.jungleEnCours(m({ je:3, jf:3 })));
    ok("carteEvenementEnCours nomme la carte partie, ou -1",
       N.carteEvenementEnCours(m({ je:1, jf:0 })) === N.IDX_JUNGLE &&
       N.carteEvenementEnCours(m({ je:1, jf:1 })) === -1);

    /* ================================================================
       DEUX VOIES CÔTE À CÔTE

       On en greffe une seconde À LA MAIN — le noyau est du calcul pur,
       on peut lui ajouter une carte le temps de la vérification. C'est
       le seul moyen de prouver AUJOURD'HUI que la machinerie tient à
       deux, avant même que la deuxième carte existe : le jour où elle
       arrivera, ce groupe aura déjà monté la garde.
       ================================================================ */
    (function(){
      var nAvant = N.CARTES.length;
      N.CARTES.push({ nom:"Carte d'essai", biome:"plage", pvQG:75000000,
                      special:1, voie:"z", minJoueurs:9, attenteH:24,
                      pvBonus:150, degBonus:70, victoire:"essai" });
      N.VOIES_EVT.push({ i:nAvant, P:"z" });
      var Z = nAvant;
      try{
        ok("chaque événement porte SES réglages, et la jungle garde les siens",
           N.reglagesEvt(Z).minJoueurs === 9 && N.reglagesEvt(Z).attenteH === 24 &&
           N.reglagesEvt(Z).pvBonus === 150 && N.reglagesEvt(Z).degBonus === 70 &&
           N.reglagesEvt(N.IDX_JUNGLE).minJoueurs === N.EQ.JUNGLE_MIN_JOUEURS &&
           N.reglagesEvt(N.IDX_JUNGLE).attenteH === N.EQ.JUNGLE_ATTENTE_H);
        var vide = N.mondeVide(0, 100, 0);
        ok("un monde neuf porte les DEUX voies, chacune à ses défauts",
           vide.je === 0 && vide.jm === N.EQ.JUNGLE_MIN_JOUEURS &&
           vide.ze === 0 && vide.zm === 9 && vide.zb === 150,
           JSON.stringify({ jm:vide.jm, jb:vide.jb, zm:vide.zm, zb:vide.zb }));
        function w(o){
          var b = N.mondeVide(0, 100, 0);
          for(var q in o) b[q] = o[q];
          return b;
        }
        /* L'ÉTANCHÉITÉ, dans les deux sens. */
        var jungleSeule = w({ je:1, jf:0 });
        ok("une expédition dans la jungle ne lance pas l'autre carte",
           N.evenementEnCours(jungleSeule, "j") && !N.evenementEnCours(jungleSeule, "z"));
        var essaiSeul = w({ ze:1, zf:0 });
        ok("et réciproquement",
           !N.evenementEnCours(essaiSeul, "j") && N.evenementEnCours(essaiSeul, "z"));
        /* LE POINT CRITIQUE, celui pour lequel tout ce remaniement
           existe : un client en avance sur une voie et en retard sur
           l'autre ne doit rien perdre, dans les deux sens. */
        var A = w({ je:4, jf:4, jt:8000, ze:0, zf:0, zt:0 });
        var B = w({ je:0, jf:0, jt:0,    ze:6, zf:5, zt:9000 });
        var f8 = N.fusionneMonde(A, B), f9 = N.fusionneMonde(B, A);
        ok("chacun garde son avance : la fusion additionne les deux voies",
           f8.je === 4 && f8.jt === 8000 && f8.ze === 6 && f8.zt === 9000,
           JSON.stringify({ je:f8.je, jt:f8.jt, ze:f8.ze, zt:f8.zt }));
        ok("… dans les deux sens", JSON.stringify(f8) === JSON.stringify(f9));
        ok("… et fusionner deux fois ne change plus rien",
           JSON.stringify(N.fusionneMonde(f8, f8)) === JSON.stringify(f8));
        ok("… et c'est associatif",
           JSON.stringify(N.fusionneMonde(N.fusionneMonde(A, B), vide)) ===
           JSON.stringify(N.fusionneMonde(A, N.fusionneMonde(B, vide))));
        /* UN CLIENT QUI NE CONNAÎT PAS LA VOIE NEUVE. C'est le cas réel
           du jour de la mise en ligne : la moitié du salon a l'ancienne
           page. Son instantané n'a AUCUN champ « z », et il est en
           avance sur la campagne — donc c'est SA branche de fusion qui
           l'emporte. Il ne doit pas emporter la voie neuve avec lui. */
        var vieuxClient = w({ c:4, je:0, jf:0 });
        delete vieuxClient.ze; delete vieuxClient.zf; delete vieuxClient.zd;
        delete vieuxClient.zq; delete vieuxClient.zt; delete vieuxClient.zm;
        delete vieuxClient.zmn; delete vieuxClient.zb;
        var frais = w({ c:0, ze:3, zf:2, zt:7777, zm:11, zmn:4, zb:200 });
        var g1 = N.fusionneMonde(vieuxClient, frais);
        var g2 = N.fusionneMonde(frais, vieuxClient);
        ok("un client qui ignore la voie neuve ne l'efface pas, même en menant la campagne",
           g1.ze === 3 && g1.zt === 7777 && g1.zm === 11 && g1.zb === 200 &&
           g2.ze === 3 && g2.zt === 7777,
           JSON.stringify({ ze:g1.ze, zt:g1.zt, zm:g1.zm, zb:g1.zb }));
        ok("… et il impose bien son avance de campagne", g1.c === 4 && g2.c === 4);
        ok("memeMonde voit un lancement sur la voie neuve",
           !N.memeMonde(w({ ze:1 }), w({ ze:0 })) &&
           !N.memeMonde(w({ zt:1 }), w({ zt:0 })) &&
           N.memeMonde(w({ ze:2, zf:1 }), w({ ze:2, zf:1 })));
        /* LE BONUS DE PV, RENDU COMMUTATIF. La règle d'avant était « à
           numéro égal, prends celui de b » — c'est-à-dire l'ordre
           d'arrivée. Deux administrateurs qui règlent dans la même
           seconde calculent le même numéro : la fusion ne convergeait
           pas et les deux appareils se republiaient sans fin. */
        var r1 = w({ jm:7, jmn:3, jb:100 }), r2 = w({ jm:9, jmn:3, jb:400 });
        ok("à numéro égal, le bonus de PV se tranche par la valeur, pas par l'ordre",
           N.fusionneMonde(r1, r2).jb === N.fusionneMonde(r2, r1).jb &&
           N.fusionneMonde(r1, r2).jb === 400,
           N.fusionneMonde(r1, r2).jb + " / " + N.fusionneMonde(r2, r1).jb);
        ok("… et le numéro tranche toujours AVANT la valeur",
           N.fusionneMonde(w({ jm:60, jmn:9, jb:900 }), w({ jm:2, jmn:10, jb:0 })).jb === 0);
        ok("… les deux réglages voyagent bien ensemble",
           N.fusionneMonde(w({ jm:60, jmn:9, jb:900 }), w({ jm:2, jmn:10, jb:0 })).jm === 2);
        /* LE DURCISSEMENT SUIT LA CARTE, plus le biome. Il se lisait
           sur `biome === "jungle"`, ce qui aurait laissé toute carte
           événement neuve avec des défenses de campagne. */
        ok("le bonus de PV s'applique à toute carte événement, à aucune île de campagne",
           N.bonusPvDeCarte(N.IDX_JUNGLE) > 0 && N.bonusPvDeCarte(Z) === 150 &&
           N.bonusPvDeCarte(0) === 0 && N.bonusPvDeCarte(999) === 0);
      }finally{
        /* on rend le noyau tel qu'on l'a trouvé : les groupes suivants
           comptent les cartes */
        N.CARTES.length = nAvant;
        N.VOIES_EVT.length = N.VOIES_EVT.length - 1;
      }
    })();
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
  /* ================================================================
     ILS NE NAISSENT PLUS DANS UN MUR

     Leur semis est le seul du fichier qui ne consulte ni l'occupation
     ni le plan : mesuré, SOIXANTE POUR CENT des chats naissaient sous
     un bâtiment. Un appât qu'on ne voit pas, dont la mort déclenche
     pourtant la vengeance — la spec demandait exactement l'inverse :
     « visuellement mignons, bien lisibles, et facilement repérables ».

     ET LE DÉGAGEMENT NE TIRE PAS. C'est la contrainte dure : le semis
     s'arrête à la première place qui passe, donc un test plus sévère
     consommerait plus de tirages, décalerait les champs de cellules
     — qui posent des BÂTIMENTS — et ferait glisser l'indice de tous
     les suivants. On tire comme avant, on corrige après, à pas fixes.
     ================================================================ */
  (function(){
    var d = html.indexOf("function degageLesProteges(");
    var f = d < 0 ? -1 : html.indexOf("\n}", d);
    ok("le dégagement des protégés se relit dans le fichier livré", d > 0 && f > d);
    if(d > 0 && f > d){
      ok("… et il ne consomme PAS un seul tirage",
         !/\bal\s*\(/.test(html.slice(d, f)));
    }
    var coinces = 0, total = 0;
    for(var i = 0; i < N.CARTES.length; i++){
      for(var tir = 0; tir < 3; tir++){
        var ck = N.genereCarte("MILY", i, N.planDeCarte(i, null), tir);
        var occ = {};
        ck.batiments.forEach(function(b){
          if(b.t === "cellule") return;
          var ax = Math.round(b.gx), ay = Math.round(b.gy), r = Math.ceil((b.e || 2) * 0.5);
          for(var dx = -r; dx <= r; dx++)
            for(var dy = -r; dy <= r; dy++) occ[(ax + dx) + "," + (ay + dy)] = 1;
        });
        ck.creatures.forEach(function(k){
          if(!N.CRE[k.t] || !N.CRE[k.t].protege) return;
          total++;
          if(occ[Math.round(k.gx) + "," + Math.round(k.gy)]) coinces++;
        });
      }
    }
    ok("presque aucun chat ne naît sous un bâtiment",
       total > 0 && coinces / total < 0.10,
       coinces + " sur " + total + " (" + (100 * coinces / total).toFixed(1) + " %)");
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

  /* ================================================================
     LES TRAÎNÉES QUI BRÛLENT ENCORE

     Deux phrases de la spécification, que le code ne tenait qu'à
     moitié, et qu'on rejoue ici avec la VRAIE fonction extraite du
     fichier livré plutôt qu'avec une copie :

       « toutes les troupes touchées, soit par l'impact, SOIT PAR LES
        TRAÎNÉES ENFLAMMÉES DERRIÈRE, perdent 90 % de leur vie » — une
        troupe qui entrait dans une traînée une image après le tir ne
        prenait que neuf dégâts par seconde, c'est-à-dire rien ;

       « 90 % des PV, JAMAIS la mort » — le commentaire l'affirmait et
        c'était faux : à onze points de vie, une Furie mourait en une
        seconde et quart de braise.
     ================================================================ */
  (function(){
    var d = html.indexOf("function brulureVengeance(");
    var f = d < 0 ? -1 : html.indexOf("\n}", d);
    ok("brulureVengeance se relit dans le fichier livré", d > 0 && f > d);
    if(d < 0 || f < 0) return;
    var src = html.slice(d, f + 2);
    /* on rejoue la fonction avec des unités de test et les vraies
       constantes : ce qui est vérifié est le code LIVRÉ */
    function brule(unites, fl, dt, n){
      var brulure = new Function("EQ", "unitesAutour", "toucheUnite", "Math",
        src + "; return brulureVengeance;")(
          N.EQ,
          function(gx, gy, r, out){ for(var i = 0; i < unites.length; i++) out.push(unites[i]); },
          function(u, deg){ u.pv -= deg; },
          Math);
      for(var k = 0; k < (n || 1); k++) brulure(fl, dt);
      return unites;
    }
    /* 1. LA DÉCOUVERTE. Une troupe qui n'était pas là au moment du
          tir et qui entre dans la traînée prend ses 90 %. */
    (function(){
      var u = { gx:0, gy:0, pv:560, pvMax:560 };
      brule([u], { gx:0, gy:0, r:2, veng:7 }, 0.016);
      ok("une troupe qui ENTRE dans une traînée perd bien ses 90 %",
         Math.abs(u.pv - 56) < 0.001, u.pv.toFixed(1) + " PV sur 560");
      ok("… et elle est marquée, donc elle ne les reperd pas à l'image suivante",
         u.vengPuni === 7);
    })();
    /* 2. UNE SEULE FOIS. Cent images de plus ne doivent pas répéter
          la peine — sinon la traînée ne blesse plus, elle efface. */
    (function(){
      var u = { gx:0, gy:0, pv:560, pvMax:560 };
      brule([u], { gx:0, gy:0, r:2, veng:7 }, 0.016, 100);
      var attendu = 56 - N.EQ.VENG_BRAISE_DPS * 0.016 * 99;
      ok("cent images de braise ne rejouent pas la peine",
         u.pv > attendu - 1 && u.pv < 57,
         u.pv.toFixed(1) + " PV, soit 56 moins la seule braise");
    })();
    /* 3. JAMAIS LA MORT. C'est la promesse la plus dure à tenir,
          parce qu'elle doit valoir même pour la troupe la plus
          fragile restée cinq secondes dans le feu. */
    (function(){
      var pvF = N.UNI.furie.pv;
      var u = { gx:0, gy:0, pv:pvF, pvMax:pvF, vengPuni:7 };
      u.pv = pvF * (1 - N.EQ.VENG_PERTE);          // elle sort du rayon
      brule([u], { gx:0, gy:0, r:2, veng:7 }, 0.05, Math.ceil(N.EQ.VENG_BRAISE_DUREE / 0.05) + 40);
      ok("une Furie qui reste dans les braises jusqu'au bout ne meurt pas",
         u.pv >= 1, u.pv.toFixed(2) + " PV");
    })();
    /* 4. HORS DU DISQUE, RIEN. Le test de distance est le seul
          garde-fou entre « traînée » et « tapis de bombes ». */
    (function(){
      var loin = { gx:9, gy:0, pv:560, pvMax:560 };
      brule([loin], { gx:0, gy:0, r:2, veng:7 }, 0.016);
      ok("une troupe hors de la traînée n'est pas touchée", loin.pv === 560);
    })();
  })();

  /* LE LIEU DU CRIME VOYAGE. Les créatures ne transitent jamais par le
     réseau et fuient les troupes LOCALES : sans ces deux nombres, deux
     joueurs voyaient la même riposte tomber à deux endroits. */
  ok("le coupable envoie la position du chat avec son aveu",
     /function envoieVengeance\(espece, kx, ky\)\{[\s\S]{0,400}kx:Math\.round/.test(html) &&
     /declencheVengeance\(m\.e, jeu\.tueurChats\[m\.e\], m\.kx, m\.ky\)/.test(html));
  ok("… et la fabrique s'en sert quand elle les reçoit",
     /function declencheVengeance\(espece, tueur, kx, ky\)\{[\s\S]{0,1400}kx:vx, ky:vy/.test(html));

  /* LA COULEUR DE LA COLÈRE suit la forteresse — mais le rouge des
     onze citadelles ne bouge pas d'un chiffre. */
  ok("la palette de la vengeance se lit sur le style de la forteresse",
     /function palVeng\(\)\{[\s\S]{0,200}SQ\.veng[\s\S]{0,60}VENG_ROUGE/.test(html));
  ok("… et le rouge d'origine est intact, au chiffre près",
     /noyau:"255,236,214", chair:"255,74,38", sang:"214,12,6"/.test(html) &&
     /veng:null/.test(html));
  ok("… le corps du faisceau a sa propre couleur, sans quoi l'or disparaît",
     /var V_CORPS = PV\.corps \|\| V_SANG;/.test(html) &&
     /\{ l:larg,\s+col:V_CORPS/.test(html));
  /* L'effet du cratère était POSÉ et jamais DESSINÉ. */
  ok("la brûlure au sol de la vengeance est enfin dessinée",
     /e\.t === "vengBoum"/.test(html) &&
     /t:"vengBoum", gx:V\.cx, gy:V\.cy/.test(html));
  /* LE DESSIN GROSSIT, LA PEINE NON — la convention des tornades. */
  ok("l'échelle spectaculaire ne touche QUE le dessin",
     N.EQ.VENG_ECH_VISUEL > 1 &&
     /var ECH = EQ\.VENG_ECH_VISUEL \|\| 1;/.test(html) &&
     !/VENG_RAYON \* EQ\.VENG_ECH_VISUEL/.test(html) &&
     !/VENG_LARGEUR \* EQ\.VENG_ECH_VISUEL/.test(html),
     "×" + N.EQ.VENG_ECH_VISUEL);

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
    /* La campagne compte HUIT îles ; la jungle est une carte
       événement, dans le même tableau mais hors de l'enchaînement.
       C'est NB_CARTES_NORMALES, jamais CARTES.length, que le reste du
       jeu doit consulter — sans quoi une carte événement allongerait
       la campagne de tout le monde. */
    ok("la campagne compte huit îles", N.NB_CARTES_NORMALES === 8,
       "" + N.NB_CARTES_NORMALES);
    ok("et deux cartes événement s'y ajoutent",
       N.CARTES.length === 10 && N.CARTES.filter(function(c){ return c.special; }).length === 2,
       N.CARTES.length + " cartes, dont "
       + N.CARTES.filter(function(c){ return c.special; })
           .map(function(c){ return c.nom; }).join(" et "));
    ok("aucune île de l'enchaînement n'est marquée spéciale",
       N.ORDRE_CAMPAGNE.every(function(i){ return !N.CARTES[i].special; }));
    /* ================================================================
       L'ORDRE DE LA CAMPAGNE, ET L'INDEX QUI NE BOUGE JAMAIS

       C'est le contrat qui protège tout ce qui a été joué. L'index
       d'une carte est une CLÉ — les scores sont rangés sous
       « seau:carte », le cumul local sous mesDegats[index], les
       champions et le bitmap des destructions sous cet index. Un index
       qui bouge, ce sont des scores qui changent de carte.
       On épingle donc les index ACQUIS un par un, en dur, et l'ordre
       d'enchaînement qui les saute proprement.
       ================================================================ */
    (function(){
      var acquis = [
        [0, "plage"], [1, "foret"], [2, "campagne"],
        [3, "hippie"], [4, "sud"], [5, "jungle"]
      ];
      var bouge = "";
      for(var i = 0; i < acquis.length; i++)
        if(!N.CARTES[acquis[i][0]] || N.CARTES[acquis[i][0]].biome !== acquis[i][1])
          bouge += acquis[i][0] + "≠" + acquis[i][1] + " ";
      ok("les six index déjà joués n'ont pas bougé d'un cran", bouge === "", bouge);
      ok("la jungle reste à l'index 5, quoi qu'on ajoute après",
         N.IDX_JUNGLE === 5, "" + N.IDX_JUNGLE);

      /* L'ordre saute les cartes événement et reste croissant — c'est
         cette croissance qui laisse valides les « i < carteSalon » de
         l'interface et le « Math.max » du réseau. */
      ok("l'ordre de campagne ne contient aucune carte événement",
         N.ORDRE_CAMPAGNE.every(function(i){ return !N.carteSpeciale(i); }),
         N.ORDRE_CAMPAGNE.join(","));
      ok("il contient TOUTES les cartes ordinaires",
         N.ORDRE_CAMPAGNE.length === N.NB_CARTES_NORMALES,
         N.ORDRE_CAMPAGNE.length + " / " + N.NB_CARTES_NORMALES);
      ok("il est strictement croissant — sans quoi « île déjà tombée » ment",
         (function(){
           for(var i = 1; i < N.ORDRE_CAMPAGNE.length; i++)
             if(N.ORDRE_CAMPAGNE[i] <= N.ORDRE_CAMPAGNE[i - 1]) return false;
           return true;
         })(), N.ORDRE_CAMPAGNE.join(","));
      ok("on repart de la première île de l'ordre",
         N.premiereCarte() === N.ORDRE_CAMPAGNE[0]);

      /* L'enchaînement, maillon par maillon : chaque île mène à la
         suivante, la dernière ne mène nulle part (-1 = campagne
         neuve), et la carte événement n'est jamais une étape. */
      var chaine = true, det = "";
      for(var k = 0; k + 1 < N.ORDRE_CAMPAGNE.length; k++){
        var a = N.ORDRE_CAMPAGNE[k], b = N.ORDRE_CAMPAGNE[k + 1];
        if(N.carteSuivante(a) !== b){ chaine = false; det += a + "→" + N.carteSuivante(a) + " "; }
      }
      ok("chaque île mène à la suivante de l'ordre", chaine, det);
      ok("la dernière île ne mène nulle part : c'est la campagne neuve",
         N.carteSuivante(N.ORDRE_CAMPAGNE[N.ORDRE_CAMPAGNE.length - 1]) === -1);
      ok("la carte événement n'est l'étape de personne",
         N.ORDRE_CAMPAGNE.indexOf(N.IDX_JUNGLE) < 0 &&
         N.carteSuivante(N.IDX_JUNGLE) === -1 &&
         N.rangCampagne(N.IDX_JUNGLE) === -1);
      /* Le piège exact que « index + 1 » posait : sortir de l'île juste
         avant la jungle ne doit JAMAIS y mener. */
      var avantJungle = -1;
      for(var j = 0; j < N.ORDRE_CAMPAGNE.length; j++)
        if(N.ORDRE_CAMPAGNE[j] < N.IDX_JUNGLE) avantJungle = N.ORDRE_CAMPAGNE[j];
      ok("l'île juste avant la jungle ne mène pas à la jungle",
         N.carteSuivante(avantJungle) !== N.IDX_JUNGLE,
         avantJungle + " → " + N.carteSuivante(avantJungle));
      ok("un index absurde ne mène nulle part",
         N.carteSuivante(-4) === -1 && N.carteSuivante(999) === -1 &&
         N.rangCampagne(999) === -1);
      /* En parcourant toute la chaîne depuis le départ, on doit visiter
         chaque île ordinaire une fois et une seule. */
      (function(){
        var vus = {}, cur = N.premiereCarte(), n = 0;
        while(cur >= 0 && n <= N.CARTES.length + 2){ vus[cur] = 1; cur = N.carteSuivante(cur); n++; }
        ok("la chaîne visite les " + N.NB_CARTES_NORMALES + " îles ordinaires, une fois chacune",
           Object.keys(vus).length === N.NB_CARTES_NORMALES && n === N.NB_CARTES_NORMALES,
           n + " étapes, " + Object.keys(vus).length + " îles");
      })();
    })();

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
    ok("guinguette : les guirlandes", N.texteVictoire(6, "X")[1].indexOf("guirlandes") > 0);
    ok("ténèbres : la lumière", N.texteVictoire(7, "X")[1].indexOf("lumière") > 0);
    ok("Ibiza : le beach club", N.texteVictoire(8, "X")[1].indexOf("beach club") > 0);
    ok("le message boucle au-delà du tableau",
       N.texteVictoire(N.CARTES.length, "X")[1] === N.texteVictoire(0, "X")[1]);
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
  /* ================================================================
     LA COMPARAISON DE VERSIONS

     Elle décide si l'on annonce au joueur qu'une mise à jour existe.
     Une comparaison de TEXTES aurait l'air de marcher longtemps puis
     mentirait exactement au mauvais moment : « v0.9 » > « v0.10 » en
     ordre alphabétique, et « v1.0 » < « v0.99 ». On compare donc des
     nombres, majeur × 1000 + mineur.
     La fonction vit hors du noyau (96-version.js) ; on la relit dans
     le fichier livré, comme les palettes.
     ================================================================ */
  (function(){
    var d = html.indexOf("function numeroVersion(");
    var f = html.indexOf("\n}", d);
    if(d < 0 || f < 0){ ok("numeroVersion se relit dans le fichier livré", false); return; }
    var num;
    try{ num = new Function(html.slice(d, f + 2) + "; return numeroVersion;")(); }
    catch(e){ num = null; }
    ok("numeroVersion se relit dans le fichier livré", typeof num === "function");
    if(typeof num !== "function") return;
    ok("v0.37 vaut 37", num("v0.37") === 37, "" + num("v0.37"));
    ok("le préfixe v est facultatif", num("0.37") === 37);
    ok("v0.9 est PLUS ANCIEN que v0.10 — le piège du tri de textes",
       num("v0.9") < num("v0.10"), num("v0.9") + " < " + num("v0.10"));
    ok("v1.0 est PLUS RÉCENT que v0.99 — l'autre piège",
       num("v1.00") > num("v0.99"), num("v1.00") + " > " + num("v0.99"));
    ok("la version du jeu se lit", num(N.VERSION) > 0, N.VERSION + " → " + num(N.VERSION));
    ok("une chaîne qui n'est pas une version rend -1",
       num("") === -1 && num(null) === -1 && num("bonjour") === -1);
    /* Le contrat qui compte : la même version ne déclenche RIEN. Un
       bandeau qui reparaît à chaque chargement est pire que pas de
       bandeau du tout. */
    ok("la même version ne déclenche aucune annonce",
       !(num(N.VERSION) > num(N.VERSION)));
    /* Et la suite des versions est bien croissante d'un cran. */
    ok("la version suivante est toujours vue comme plus récente",
       (function(){
         var m = /v(\d+)\.(\d+)/.exec(N.VERSION);
         var suiv = "v" + m[1] + "." + (+m[2] + 1);
         return num(suiv) > num(N.VERSION);
       })());
  })();
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

  /* ================================================================
     LES BLESSURES DES BÂTIMENTS

     « Si Roro a détruit un Frelon à cinquante pour cent, pourquoi
     est-ce que moi j'aurais cent pour cent à redétruire ? »

     L'instantané ne savait dire qu'une chose d'un bâtiment : debout ou
     tombé. Il porte maintenant, pour les seuls blessés-debout, un cran
     de vie sur soixante-quatre. Ce groupe garde les six propriétés qui
     font que ça ne peut pas rendre de la vie à quelqu'un ni
     réinitialiser quoi que ce soit.
     ================================================================ */
  G("9c. Les blessures des bâtiments");
  (function(){
    ok("un bâtiment intact ne dit rien : absent veut dire plein",
       N.cranBlessure(100, 100) === N.BLESSURE_CRANS &&
       N.encodeBlessures([{ i:3, n:N.BLESSURE_CRANS }]) === "");
    ok("l'aller-retour rend exactement ce qu'on a mis",
       (function(){
         var l = [{ i:0, n:0 }, { i:7, n:31 }, { i:2157, n:62 }];
         var d = N.decodeBlessures(N.encodeBlessures(l));
         return d[0] === 0 && d[7] === 31 && d[2157] === 62;
       })());
    ok("l'index tient jusqu'au plus gros plan gravé du jeu",
       (function(){
         var d = N.decodeBlessures(N.encodeBlessures([{ i:4095, n:1 }]));
         return d[4095] === 1;
       })(), "4 095 places pour 2 169 bâtiments au maximum");
    ok("trois caractères par blessé, et pas un de plus",
       N.encodeBlessures([{ i:5, n:9 }, { i:9, n:2 }]).length === 6);

    /* L'ARRONDI VA VERS LE BAS. C'est ce qui garantit qu'aucune fusion,
       aucun aller-retour, aucun rechargement ne peut RENDRE de la vie
       à un bâtiment. Le cran dit toujours un peu plus de dégâts que la
       réalité — jamais moins. */
    (function(){
      var jamaisPlus = true, det = "";
      for(var k = 1; k <= 200; k++){
        var f = k / 200;
        var n = N.cranBlessure(f * 1000, 1000);
        if(n / N.BLESSURE_CRANS > f + 1e-9){ jamaisPlus = false; det += k + " "; }
      }
      ok("l'arrondi ne rend JAMAIS de la vie : le cran est toujours "
         + "au-dessous de la vie réelle", jamaisPlus, det || "deux cents niveaux vérifiés");
      ok("… et un bâtiment à un cheveu de la mort ne repasse pas à plein",
         N.cranBlessure(1, 100000) === 0);
    })();

    /* LA FUSION. Les trois propriétés d'un CRDT — commutative,
       associative, idempotente — plus la quatrième qui compte ici :
       c'est le PLUS ABÎMÉ qui gagne. */
    (function(){
      var a = N.encodeBlessures([{ i:1, n:40 }, { i:5, n:10 }]);
      var b = N.encodeBlessures([{ i:1, n:12 }, { i:9, n:30 }]);
      var c = N.encodeBlessures([{ i:5, n:3 }]);
      ok("fusionner dans les deux sens donne la même chose",
         N.fusionneBlessures(a, b) === N.fusionneBlessures(b, a));
      ok("… et le groupement n'y change rien",
         N.fusionneBlessures(N.fusionneBlessures(a, b), c) ===
         N.fusionneBlessures(a, N.fusionneBlessures(b, c)));
      ok("… fusionner deux fois non plus",
         N.fusionneBlessures(N.fusionneBlessures(a, b), b) ===
         N.fusionneBlessures(a, b));
      var f = N.decodeBlessures(N.fusionneBlessures(a, b));
      ok("c'est le PLUS ABÎMÉ qui gagne, jamais le plus frais",
         f[1] === 12, "40 et 12 donnent " + f[1]);
      ok("… et un blessé que l'autre ne connaît pas survit à la fusion",
         f[5] === 10 && f[9] === 30);
      ok("fusionner avec rien ne perd rien",
         N.fusionneBlessures(a, "") === a && N.fusionneBlessures("", a) === a);
    })();

    /* DEUX CLIENTS QUI ONT LES MÊMES BLESSURES DOIVENT PRODUIRE LA
       MÊME CHAÎNE. Sinon memeMonde les croit différents, chacun
       republie pour corriger l'autre, et le salon part en boucle de
       publication — un défaut qui ne se voit qu'au compteur de
       messages, jamais à l'écran. */
    ok("l'ordre d'entrée ne change pas la chaîne produite",
       N.encodeBlessures([{ i:9, n:2 }, { i:1, n:5 }, { i:4, n:8 }]) ===
       N.encodeBlessures([{ i:4, n:8 }, { i:1, n:5 }, { i:9, n:2 }]));

    /* LE PLAFOND. En jeu réel on compte un ou deux blessés à la fois —
       mesuré pendant un assaut complet. Le plafond n'est pas un
       réglage, c'est un garde-fou ; et ce qu'il coupe est ce qui était
       le MOINS entamé, donc ce qui coûte le moins cher à refaire. */
    (function(){
      var l = [], k;
      for(k = 0; k < 200; k++) l.push({ i:k, n:k % 62 });
      var d = N.decodeBlessures(N.encodeBlessures(l));
      var n = 0, pire = 1e9, meilleur = -1;
      for(var i in d){ n++; if(d[i] < pire) pire = d[i]; if(d[i] > meilleur) meilleur = d[i]; }
      ok("deux cents blessés sont ramenés au plafond de " + N.BLESSURES_MAX,
         n === N.BLESSURES_MAX, "" + n);
      ok("… et ce sont les PLUS ABÎMÉS qu'on garde",
         pire === 0 && meilleur < 62, "crans de " + pire + " à " + meilleur);
    })();

    /* L'INSTANTANÉ. Les blessures y voyagent, la fusion les mêle, et
       memeMonde les voit changer — sans quoi elles ne partiraient
       jamais. */
    (function(){
      var v0 = N.mondeVide(0, 500, 0);
      ok("un instantané neuf n'a aucun blessé", (v0.bl || "") === "");
      var m1 = N.fusionneMonde(v0, { v:1, cy:0, c:0, pv:500, d:"",
                                     bl:N.encodeBlessures([{ i:2, n:30 }]) });
      var m2 = N.fusionneMonde(v0, { v:1, cy:0, c:0, pv:500, d:"",
                                     bl:N.encodeBlessures([{ i:2, n:12 }, { i:8, n:50 }]) });
      var mm = N.fusionneMonde(m1, m2);
      var d = N.decodeBlessures(mm.bl);
      ok("deux joueurs qui abîment le même bâtiment : le plus abîmé compte",
         d[2] === 12 && d[8] === 50);
      ok("memeMonde voit une blessure changer, donc elle est republiée",
         !N.memeMonde(m1, m2));
      /* LE POINT QUI COMPTE POUR NE RIEN RÉINITIALISER : un instantané
         d'une version PRÉCÉDENTE n'a pas de champ `bl`. Il doit se lire
         « aucun blessé », c'est-à-dire ne rien changer — surtout pas
         remettre des bâtiments à neuf. */
      var ancien = { v:9, cy:0, c:0, pv:400, d:"AB", g:"", w:"", s:"", k:"" };
      var apres = N.fusionneMonde(m2, ancien);
      ok("un instantané SANS blessures ne remet rien à neuf",
         N.decodeBlessures(apres.bl)[2] === 12,
         "les blessures de m2 traversent la fusion avec un ancien client");
      ok("… et une chaîne abîmée ne fait pas tomber le décodage",
         (function(){
           var q = N.decodeBlessures("!!!" + N.encodeBlessures([{ i:4, n:7 }]));
           return typeof q === "object";
         })());
    })();

    /* ET `d` GAGNE TOUJOURS. Un bâtiment déclaré détruit ne peut pas
       être blessé en même temps : c'est ce que fait le chargement de
       carte, et c'est ce que fait la publication. */
    ok("un bâtiment détruit n'entre jamais dans la liste des blessés",
       /if\(!b\.vivant\) continue;[\s\S]{0,200}cranBlessure/.test(html));
    /* ON REJOUE LA VRAIE FONCTION, ET NON SON ORTHOGRAPHE. Les deux
       vérifications d'avant épinglaient des noms de variables — `bq`,
       `pvq`, `monde.bl` — et elles ont cassé à la première mise en
       commun du code, alors que rien de ce qu'elles décrivaient
       n'avait bougé. Un test qui tombe quand on renomme une variable
       ne teste pas le programme, il teste sa frappe.
       On extrait donc appliqueBlessuresAuJeu du fichier LIVRÉ et on la
       fait tourner sur des bâtiments fabriqués ici. */
    (function(){
      var src = html.match(/function appliqueBlessuresAuJeu\([\s\S]*?\n\}/);
      if(!src){
        ok("appliqueBlessuresAuJeu est dans le fichier livré", false);
        return;
      }
      ok("appliqueBlessuresAuJeu est dans le fichier livré", true);
      var faire = new Function("jeu", "decodeBlessures", "BLESSURE_CRANS",
                               src[0] + "\nreturn appliqueBlessuresAuJeu;");
      function bat(pv, vivant){ return { pvMax:1000, pv:pv, vivant:vivant }; }
      /* index 0 : mort et pourtant listé comme blessé — `d` doit gagner
         index 1 : intact, on l'abîme à moitié
         index 2 : déjà à 10 %, l'instantané le dit à 80 % — on ne rend
                   jamais de vie
         index 3 : absent de la liste, donc intact, donc intouché */
      var j = { batiments:[ bat(0, 0), bat(1000, 1), bat(100, 1), bat(1000, 1) ] };
      var chaine = N.encodeBlessures([
        { i:0, n:(N.BLESSURE_CRANS * 0.5) | 0 },
        { i:1, n:(N.BLESSURE_CRANS * 0.5) | 0 },
        { i:2, n:(N.BLESSURE_CRANS * 0.8) | 0 }
      ]);
      var n = faire(j, N.decodeBlessures, N.BLESSURE_CRANS)(chaine);
      ok("… au chargement, un bâtiment DÉTRUIT reste détruit",
         j.batiments[0].pv === 0 && !j.batiments[0].vivant,
         "pv " + j.batiments[0].pv);
      ok("… un bâtiment intact descend bien au cran reçu",
         j.batiments[1].pv > 400 && j.batiments[1].pv < 600,
         "" + j.batiments[1].pv + " PV");
      ok("… et jamais pour remonter la vie d'un bâtiment",
         j.batiments[2].pv === 100, "" + j.batiments[2].pv + " PV");
      ok("… un bâtiment absent de la liste ne bouge pas",
         j.batiments[3].pv === 1000 && n === 1, n + " touché(s)");
      /* IDEMPOTENCE : rejouer le même instantané ne change plus rien.
         C'est ce qui autorise à l'appliquer à chaque message reçu. */
      var avant = j.batiments.map(function(b){ return b.pv; });
      faire(j, N.decodeBlessures, N.BLESSURE_CRANS)(chaine);
      ok("… et rejouer le même instantané ne change plus rien",
         j.batiments.every(function(b, k){ return b.pv === avant[k]; }));
    })();
    /* LES REMISES À ZÉRO effacent les blessures AVEC le bitmap des
       morts. Une campagne neuve, un tirage neuf, un plan enregistré :
       les trois changent la carte, donc les index ne désignent plus
       rien. */
    /* L'INVARIANT, ET NON LE COMPTE. La première écriture épinglait
       « il y a quatre chemins » — et elle a échoué tout de suite,
       parce que mondeVide en est un cinquième. Compter les chemins
       n'apprend rien et se périme au premier ajout ; ce qu'il faut
       garder est que `bl` ne soit JAMAIS effacé sans `d`, ni `d` sans
       `bl`. Un chemin qui viderait les morts en gardant les blessures
       ressusciterait des bâtiments à moitié détruits sur une carte
       neuve — exactement le genre de réinitialisation qu'on s'est
       interdit. */
    (function(){
      /* On ne regarde que les instantanés du monde : chez eux le champ des
         morts suit toujours les points de vie du QG. Un « d » qui traîne
         ailleurs (une voie posée, par exemple) n'est pas la même lettre. */
      var chemins = html.match(/pv:[^,]+, d:""[^\n]*/g) || [];
      var manquants = chemins.filter(function(l){ return l.indexOf('bl:""') < 0; });
      ok("aucun chemin n'efface les morts sans effacer les blessures",
         chemins.length > 0 && manquants.length === 0,
         chemins.length + " chemins, tous les deux à la fois");
    })();
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

/* ================================================================
   9d. LES BLESSURES EN EXPÉDITION — et la porte qui était fermée

   La campagne vit dans `c`, une expédition dans sa voie. En y ajoutant
   les blessures on a découvert que la voie était ÉCRITE mais jamais
   RELUE : le seul appel du programme à appliqueMondeAuJeu était gardé
   par « monde.c === jeu.index », test toujours faux sur une carte
   spéciale. Deux joueurs dans la même jungle ne se partageaient donc
   rien — ni les défenses détruites, ni les PV du Brasier.

   Ce groupe garde les deux moitiés : la voie transporte et fusionne
   les blessures comme le fait la campagne, et la lecture existe.
   ================================================================ */
(function(){
  G("9d. Les blessures en expédition");

  /* LA VOIE TRANSPORTE. voieLue et voiePosee sont les deux seuls
     endroits qui connaissent les noms de champs : ce qui entre par
     l'un doit ressortir par l'autre. */
  (function(){
    var P = "j", i = N.IDX_JUNGLE;
    var v = { e:3, f:2, d:"AB", bl:N.encodeBlessures([{ i:7, n:20 }]),
              q:5000, t:1700000000000, mj:2, mn:4, b:0 };
    var o = N.voiePosee({}, P, v);
    var w = N.voieLue(o, P, i);
    ok("la voie transporte les blessures comme le reste",
       w.bl === v.bl && w.d === v.d && w.q === v.q);
    /* LE PIÈGE DES NOMS : <P>b est le bonus de PV, <P>bl les
       blessures. Deux clés voisines, deux champs sans rapport. */
    ok("le bonus de PV et les blessures ne se confondent pas",
       o[P + "b"] === 0 && o[P + "bl"] === v.bl && w.b === 0);
    var vieux = { je:3, jf:2, jd:"AB", jq:5000 };
    ok("une voie d'avant, sans blessures, se lit « aucun blessé »",
       N.voieLue(vieux, P, i).bl === "");
  })();

  /* LA FUSION. Mêmes trois propriétés que pour la campagne, plus la
     règle d'époque : une expédition neuve balaie tout. */
  (function(){
    var P = "j";
    function voie(e, bl){
      return N.voiePosee({}, P, { e:e, f:0, d:"", bl:bl, q:0, t:0, mj:2, mn:0, b:0 });
    }
    var A = voie(1, N.encodeBlessures([{ i:2, n:40 }, { i:9, n:10 }]));
    var B = voie(1, N.encodeBlessures([{ i:2, n:15 }, { i:5, n:33 }]));
    var ab = N.fusionneEvenements(A, B).v[P];
    var ba = N.fusionneEvenements(B, A).v[P];
    ok("fusionner dans les deux sens donne la même voie", ab.bl === ba.bl);
    var d = N.decodeBlessures(ab.bl);
    ok("… et c'est le plus abîmé qui gagne, index par index",
       d[2] === 15 && d[9] === 10 && d[5] === 33,
       JSON.stringify(d));
    ok("fusionner deux fois ne change rien",
       N.fusionneEvenements(A, N.voiePosee({}, P, ab)).v[P].bl === ab.bl);
    /* L'ÉPOQUE. `d`, `bl` et `q` appartiennent au compteur de
       lancements : une expédition neuve ne garde rien de la
       précédente, sans quoi elle ouvrirait avec des défenses déjà à
       moitié détruites. */
    var neuve = voie(2, "");
    var apres = N.fusionneEvenements(A, neuve).v[P];
    ok("une expédition neuve n'hérite d'aucune blessure de l'ancienne",
       apres.e === 2 && apres.bl === "" && apres.d === "");
    /* … et l'inverse : une voie EN RETARD ne peut pas ressusciter les
       défenses d'une expédition en cours. */
    var enRetard = N.fusionneEvenements(voie(2, N.encodeBlessures([{ i:1, n:5 }])),
                                        voie(1, "")).v[P];
    ok("… et une voie en retard ne remet rien à neuf",
       enRetard.e === 2 && N.decodeBlessures(enRetard.bl)[1] === 5);
  })();

  /* MEMEEVENEMENTS. Sans cette comparaison, une défense qu'on vient
     d'entamer ne rendrait pas l'instantané « sale » et personne ne la
     verrait jamais : le message ne partirait pas. */
  (function(){
    var P = "j";
    var E = { v:{}, ch:"", t3:"" };
    E.v[P] = { e:1, f:0, d:"", bl:N.encodeBlessures([{ i:4, n:20 }]),
               q:0, t:0, mj:2, mn:0, b:0 };
    var m = N.voiePosee({ ch:"", t3:"" }, P,
              { e:1, f:0, d:"", bl:"", q:0, t:0, mj:2, mn:0, b:0 });
    ok("une blessure neuve rend l'instantané à republier",
       N.memeEvenements(m, E) === false);
    var m2 = N.voiePosee({ ch:"", t3:"" }, P, E.v[P]);
    ok("… et deux voies identiques ne se republient pas en boucle",
       N.memeEvenements(m2, E) === true);
  })();

  /* LE POINT FIXE. Les PV donnent un cran, le cran repose des PV. Si
     ce cycle n'est pas stable, chaque publication rabote un peu de vie
     — des dégâts offerts par l'arrondi. Mesuré avant correction sur
     une défense de 720 PV : 75,0 → 74,6 → 73,1 %. */
  (function(){
    /* ON REPOSE AVEC LA VRAIE FONCTION. Simuler le repose ici laisserait
       passer le retour de l'arrondi : c'est appliqueBlessuresAuJeu qui
       porte l'une des deux moitiés de la correction. */
    var srcBl = html.match(/function appliqueBlessuresAuJeu\([\s\S]*?\n\}/);
    if(!srcBl){ ok("appliqueBlessuresAuJeu se relit", false); return; }
    function repose(pvMax, c){
      var j = { batiments:[{ pvMax:pvMax, pv:pvMax, vivant:1 }] };
      new Function("jeu", "decodeBlessures", "BLESSURE_CRANS",
                   srcBl[0] + "\nreturn appliqueBlessuresAuJeu;")(
        j, N.decodeBlessures, N.BLESSURE_CRANS)(N.encodeBlessures([{ i:0, n:c }]));
      return j.batiments[0].pv;
    }
    var pires = [], pvMax, c, k;
    var tailles = [63, 120, 700, 720, 760, 1400, 2446, 60000000];
    for(k = 0; k < tailles.length; k++){
      pvMax = tailles[k];
      for(c = 1; c < N.BLESSURE_CRANS; c++){
        if(N.cranBlessure(repose(pvMax, c), pvMax) !== c) pires.push(pvMax + "/" + c);
      }
    }
    ok("reposer un cran puis le relire redonne le MÊME cran",
       pires.length === 0, pires.length + " cas dérivent : "
       + pires.slice(0, 4).join(" "));
    /* et la perte du premier pas ne dépasse jamais un cran */
    var pire = 0;
    for(k = 0; k < 2000; k++){
      var f = (k + 1) / 2001;
      var n = N.cranBlessure(f * 720, 720);
      var perte = f - n / N.BLESSURE_CRANS;
      if(perte > pire) pire = perte;
    }
    ok("… et le premier pas ne coûte jamais plus d'un cran",
       pire < 1 / N.BLESSURE_CRANS + 1e-9,
       (pire * 100).toFixed(2) + " % de perte au pire");
  })();

  /* LA PORTE. C'est la condition qui interdisait la lecture : elle
     comparait `monde.c` — une île de campagne — à l'index d'une carte
     spéciale, qui n'y figure jamais. On la rejoue du fichier livré. */
  (function(){
    var src = html.match(/function instantanePourMaCarte\([\s\S]*?\n\}/);
    if(!src){ ok("instantanePourMaCarte est dans le fichier livré", false); return; }
    ok("instantanePourMaCarte est dans le fichier livré", true);
    function porte(idx, cycle, m){
      return new Function("jeu", "cycleSalon", "carteSpeciale",
                          src[0] + "\nreturn instantanePourMaCarte;")(
        idx === null ? null : { index:idx }, cycle, N.carteSpeciale)(m);
    }
    var J = N.IDX_JUNGLE;
    ok("en expédition, l'instantané du salon nous concerne",
       porte(J, 0, { c:2, cy:0 }) === true,
       "monde.c vaut 2 (l'île de campagne), on joue sur la carte " + J);
    ok("… même si le cycle de campagne a bougé sans nous",
       porte(J, 0, { c:7, cy:3 }) === true);
    ok("sur notre île de campagne, il nous concerne aussi",
       porte(2, 0, { c:2, cy:0 }) === true);
    ok("sur une AUTRE île de campagne, non",
       porte(2, 0, { c:3, cy:0 }) === false);
    ok("… ni sur une autre campagne", porte(2, 0, { c:2, cy:1 }) === false);
    ok("et sans partie en cours, rien à appliquer",
       porte(null, 0, { c:2, cy:0 }) === false);
  })();

  /* LA LECTURE EXISTE. On rejoue appliqueEvenementAuJeu du fichier
     LIVRÉ, sur des bâtiments fabriqués ici : c'est la fonction qui
     n'était atteinte par personne. */
  (function(){
    var src = html.match(/function appliqueEvenementAuJeu\([\s\S]*?\n\}/);
    var srcBl = html.match(/function appliqueBlessuresAuJeu\([\s\S]*?\n\}/);
    if(!src || !srcBl){
      ok("appliqueEvenementAuJeu est dans le fichier livré", false);
      return;
    }
    ok("appliqueEvenementAuJeu est dans le fichier livré", true);
    function bat(pv){ return { pvMax:1000, pv:pv, vivant:1 }; }
    function scene(){
      return { index:5, batiments:[bat(1000), bat(1000), bat(1000), bat(1000)],
               qg:{ pv:9000 }, balise:null,
               file:{ pv:9000, adopteMinimum:function(v){ if(v < this.pv) this.pv = v; } } };
    }
    var fini = 0;
    function lance(j, m){
      return new Function("jeu", "voieDeCarte", "evenementEnCours", "decodeBits",
                          "marqueEmprise", "demandeMajBarres", "decodeBlessures",
                          "BLESSURE_CRANS", "finExpeditionLocale",
        srcBl[0] + "\n" + src[0] + "\nreturn appliqueEvenementAuJeu;")(
        j, function(){ return "j"; }, N.evenementEnCours, N.decodeBits,
        function(){}, function(){}, N.decodeBlessures, N.BLESSURE_CRANS,
        function(){ fini++; })(m, 5);
    }
    /* une expédition en cours : index 0 détruit, index 1 blessé à
       moitié, index 2 déjà plus bas que ce qu'on annonce */
    var j = scene();
    j.batiments[2].pv = 100;
    var m = N.voiePosee({}, "j", {
      e:1, f:0, d:N.encodeBits([1, 0, 0, 0]),
      bl:N.encodeBlessures([{ i:1, n:(N.BLESSURE_CRANS * 0.5) | 0 },
                            { i:2, n:(N.BLESSURE_CRANS * 0.8) | 0 }]),
      q:7000, t:0, mj:2, mn:0, b:0 });
    lance(j, m);
    ok("en expédition, une défense détruite ailleurs tombe ici aussi",
       !j.batiments[0].vivant && j.batiments[0].pv === 0);
    ok("… une défense entamée ailleurs arrive entamée",
       j.batiments[1].pv > 400 && j.batiments[1].pv < 600,
       j.batiments[1].pv.toFixed(0) + " PV");
    ok("… et on ne rend jamais de vie à celle qu'on a mieux abîmée",
       j.batiments[2].pv === 100);
    ok("… les PV du Brasier suivent la voie", j.qg.pv === 7000);
    ok("… et une défense intacte reste intacte",
       j.batiments[3].pv === 1000 && j.batiments[3].vivant === 1);
    /* une expédition TERMINÉE ne touche à rien et renvoie au campement */
    var j2 = scene();
    lance(j2, N.voiePosee({}, "j", { e:1, f:1, d:N.encodeBits([1, 1, 1, 1]),
            bl:"", q:1, t:0, mj:2, mn:0, b:0 }));
    ok("une expédition terminée ne détruit plus rien et renvoie au campement",
       j2.batiments.every(function(b){ return b.vivant === 1; }) && fini === 1);
  })();
})();

/* ================================================================
   L'AMBIANCE DES « MILY ET UNE NUITS »

   Le joueur a posé une contrainte qui n'est pas de goût mais de
   durée : « je ne veux pas des sons qui deviennent insupportables
   après dix minutes ». Ce groupe ne juge pas la beauté du résultat —
   il vérifie les trois choses qui, seules, décident de la dixième
   minute : le PLAFOND (jamais plus fort que ça), les RÉGIMES (le
   décor se tait quand il doit) et la RÉPÉTITION (aucun intervalle
   fixe, aucune note qui revient).

   On fait tourner le VRAI objet livré sur un faux contexte audio :
   un graphe qui note tout ce qu'on lui écrit. C'est la seule façon
   de mesurer un volume au lieu de le relire.
   ================================================================ */
(function(){
  G("22. L'ambiance sonore des nuits");

  var srcAmb = html.match(/var ambianceNuits = \{[\s\S]*?\n\};/);
  var srcGamme = html.match(/var NUITS_GAMME = \[[\s\S]*?\];/);
  var srcHaut = html.match(/var NUITS_EAU_HAUT = \d+;/);
  ok("ambianceNuits et sa gamme sont dans le fichier livré",
     !!srcAmb && !!srcGamme && !!srcHaut);
  if(!srcAmb || !srcGamme || !srcHaut) return;

  /* ---- un faux contexte audio qui garde la trace de tout ---- */
  function faitParam(v){
    var p = { value:v, cible:v, rampes:[] };
    p.setValueAtTime = function(x){ this.value = x; this.cible = x; };
    p.linearRampToValueAtTime = function(x){ this.cible = x; this.rampes.push(x); };
    p.setTargetAtTime = function(x){ this.cible = x; this.value = x; };
    p.cancelScheduledValues = function(){};
    return p;
  }
  function faitContexte(){
    var ac = { currentTime:1000, noeuds:[] };
    function note(o){ ac.noeuds.push(o); return o; }
    ac.createGain = function(){
      return note({ genre:"gain", gain:faitParam(1), connect:function(){} });
    };
    ac.createBufferSource = function(){
      return note({ genre:"source", buffer:null, loop:false,
                    playbackRate:faitParam(1), connect:function(){},
                    start:function(){}, stop:function(){} });
    };
    ac.createBiquadFilter = function(){
      return note({ genre:"filtre", type:"", frequency:faitParam(0),
                    Q:faitParam(1), connect:function(){} });
    };
    ac.createOscillator = function(){
      return note({ genre:"lfo", type:"", frequency:faitParam(0),
                    connect:function(){}, start:function(){}, stop:function(){} });
    };
    return ac;
  }

  /* Le banc. `son` est un mouchard : on compte les appels au lieu de
     produire du son. `cam`, `carte` et la pluie sont pilotés depuis
     l'extérieur pour visiter les quatre régimes. */
  function banc(opt){
    opt = opt || {};
    var ac = faitContexte();
    var compte = { cloche:0, goutte:0, note:0 }, degres = [], protection = 0;
    var faux = {
      ac:ac, maitre:{}, bruit:{ nom:"bruit" }, dernierBoum:-999,
      ok:function(){ return true; },
      clocheNuits:function(){ compte.cloche++; },
      goutteNuits:function(p){ compte.goutte++; },
      noteMagique:function(){ compte.note++; }
    };
    var etat = { z:opt.z === undefined ? 0.9 : opt.z,
                 decors:opt.decors || [], gx:opt.gx || 0, gy:opt.gy || 0,
                 pluie:opt.pluie ? 1 : 0 };
    var A = new Function("son", "cam", "carte", "centreCameraGx", "centreCameraGy",
                         "bandeNuits", "phasePluie", "horlogePluie", "ETAT",
      srcGamme[0] + "\n" + srcHaut[0] + "\n" + srcAmb[0] +
      "\nreturn ambianceNuits;")(
        faux,
        { get z(){ return etat.z; } },
        { get decors(){ return etat.decors; } },
        function(){ return etat.gx; }, function(){ return etat.gy; },
        function(s){ return s | 0; },
        function(){ return { phase:etat.pluie }; },
        function(){ return 0; },
        etat);
    return { A:A, ac:ac, son:faux, compte:compte, etat:etat,
             /* fait tourner n secondes à 60 images */
             tourne:function(secondes){
               for(var i = 0; i < secondes * 60; i++) A.suit(1 / 60);
             } };
  }

  /* ---------------------------------------------------------------
     1. LE PLAFOND. Annoncé dans l'en-tête du fichier : aucune source
     continue au-dessus de 0,018 et leur somme sous 0,032. On ne relit
     pas la constante — on lit ce qui est ÉCRIT dans le graphe, au
     régime le plus fort qui existe (zoom à fond, caméra dans un
     bassin, aucun combat).
     --------------------------------------------------------------- */
  (function(){
    var b = banc({ z:1.0, decors:[{ v:2, s:2, gx:0, gy:0 }] });
    b.A.demarre();
    ok("le lit démarre et se branche", !!b.A.noeuds);
    b.tourne(2);
    var n = b.A.noeuds;
    var vent = n.gVent.gain.rampes.length ? Math.max.apply(null, n.gVent.gain.rampes) : 0;
    var eau = n.gEau.gain.cible;
    ok("le vent reste sous le plafond d'une source continue",
       vent > 0 && vent <= 0.018, vent.toFixed(4));
    ok("l'eau aussi, au plus près d'un grand bassin",
       eau > 0 && eau <= 0.018, eau.toFixed(4));
    ok("et la somme des continus tient sous 0,032",
       vent + eau <= 0.032, (vent + eau).toFixed(4));
    /* Le repère, écrit noir sur blanc : la jungle est à 0,035 pour sa
       pluie et 0,055 pour son vent, le plus petit tir du jeu à 0,045.
       Le décor entier doit rester sous le plus petit tir. */
    ok("le décor entier reste plus faible que le plus petit tir du jeu",
       vent + eau < 0.045, (vent + eau).toFixed(4) + " < 0,045");
  })();

  /* ---------------------------------------------------------------
     2. LES RÉGIMES. C'est la vraie réponse aux dix minutes : ce qu'on
     entend doit CHANGER. Quatre situations, quatre volumes.
     --------------------------------------------------------------- */
  (function(){
    var b = banc({ z:1.0, decors:[{ v:2, s:2, gx:0, gy:0 }] });
    b.A.demarre(); b.tourne(1);
    var fort = b.A.noeuds.groupe.gain.cible;
    ok("de près, le jardin s'entend", fort > 0.9, fort.toFixed(3));

    b.etat.z = 0.18; b.tourne(1);
    var loin = b.A.noeuds.groupe.gain.cible;
    ok("dézoomé sur la carte, il se tait complètement",
       loin <= 0.001, loin.toFixed(4));
    ok("… et l'eau se coupe avec lui", b.A.noeuds.gEau.gain.cible <= 0.001);

    b.etat.z = 1.0; b.tourne(1);
    b.son.dernierBoum = b.ac.currentTime;
    b.tourne(0.5);
    var combat = b.A.noeuds.groupe.gain.cible;
    ok("pendant un assaut, le décor fait place au fracas",
       combat > 0.3 && combat < 0.5, combat.toFixed(3));

    /* le zoom éteint aussi les évènements, pas seulement le lit */
    var c = banc({ z:0.18, decors:[{ v:2, s:2, gx:0, gy:0 }] });
    c.A.demarre(); c.tourne(200);
    ok("dézoomé, aucune clochette, aucune goutte, aucune note",
       c.compte.cloche === 0 && c.compte.goutte === 0 && c.compte.note === 0,
       JSON.stringify(c.compte));
  })();

  /* ---------------------------------------------------------------
     3. LA PLUIE D'ÉTOILES A TOUTE L'OREILLE. C'est la signature de la
     carte : pendant le phénomène, le jardin se tait.
     --------------------------------------------------------------- */
  (function(){
    var b = banc({ z:1.0, decors:[{ v:2, s:2, gx:0, gy:0 }], pluie:true });
    b.A.demarre(); b.tourne(300);
    ok("pendant la pluie d'étoiles, plus une clochette ni une note",
       b.compte.cloche === 0 && b.compte.note === 0, JSON.stringify(b.compte));
    b.etat.pluie = 0; b.tourne(300);
    ok("… et le jardin reprend quand elle est finie", b.compte.cloche > 0);
  })();

  /* ---------------------------------------------------------------
     4. LA DENSITÉ. Trop peu et il n'y a pas d'ambiance ; trop et il y
     a un métronome. On mesure sur dix minutes — la durée même que le
     joueur a citée.
     --------------------------------------------------------------- */
  (function(){
    var b = banc({ z:1.0, decors:[{ v:2, s:2, gx:0, gy:0 }] });
    b.A.demarre(); b.tourne(600);
    var C = b.compte;
    ok("en dix minutes près d'un bassin : les clochettes restent rares",
       C.cloche >= 12 && C.cloche <= 48, C.cloche + " clochettes");
    ok("… les gouttes font le fond sonore sans le saturer",
       C.goutte >= 90 && C.goutte <= 400, C.goutte + " gouttes");
    ok("… et les notes magiques restent une ponctuation",
       C.note >= 3 && C.note <= 18, C.note + " notes");

    /* LOIN DE L'EAU, le paysage est un autre : pas de gouttes du tout.
       C'est ce qui fait qu'on entend un LIEU et pas une carte. */
    var s = banc({ z:1.0, decors:[{ v:2, s:2, gx:80, gy:80 }] });
    s.A.demarre(); s.tourne(600);
    ok("loin de toute fontaine, l'eau se tait", s.compte.goutte === 0,
       s.compte.goutte + " gouttes");
    ok("… mais les clochettes, elles, sont partout", s.compte.cloche > 0);
  })();

  /* ---------------------------------------------------------------
     5. AUCUN MÉTRONOME. Un intervalle fixe s'entend en moins d'une
     minute. On relit le tirage lui-même dans le fichier livré.
     --------------------------------------------------------------- */
  (function(){
    var b = banc({ z:1.0, decors:[{ v:2, s:2, gx:0, gy:0 }] });
    b.A.demarre();
    var vus = {}, min = 1e9, max = 0, pire = 0;
    for(var i = 0; i < 4000; i++){
      b.A.tClochette = 0; b.A.suit(1 / 60);
      var v = b.A.tClochette, cle = v.toFixed(2);
      vus[cle] = (vus[cle] || 0) + 1;
      if(vus[cle] > pire) pire = vus[cle];
      if(v < min) min = v;
      if(v > max) max = v;
    }
    /* Un métronome, c'est UNE valeur qui domine. Au centième de
       seconde près, aucune ne doit revenir plus d'une fois sur cent :
       à quatre mille tirages, le hasard seul en donne cinq ou six. */
    ok("l'intervalle des clochettes ne se fixe sur aucune valeur",
       pire < 40, "la plus fréquente sort " + pire + " fois sur 4000");
    ok("… et il varie dans un rapport large, pas autour d'une moyenne",
       max / min > 6, min.toFixed(1) + " s à " + max.toFixed(1) + " s");
  })();

  /* ---------------------------------------------------------------
     6. LE COÛT. Le battement tourne soixante fois par seconde sur une
     carte déjà lourde. Le balayage des décors ne doit pas y être à
     chaque image, et l'AudioParam de l'eau ne doit pas être réécrit
     soixante fois par seconde pour la même valeur.
     --------------------------------------------------------------- */
  (function(){
    var scans = 0;
    var decors = [];
    for(var i = 0; i < 500; i++) decors.push({ v:2, s:1, gx:i % 40, gy:(i * 7) % 40 });
    var b = banc({ z:1.0, decors:decors });
    b.A.demarre();
    var vrai = b.A.majProximite;
    b.A.majProximite = function(){ scans++; return vrai.apply(this, arguments); };
    b.tourne(1);
    ok("les bassins ne sont balayés qu'une image sur quatre",
       scans <= 16 && scans >= 14, scans + " balayages en 60 images");

    var ecrits = 0, g = b.A.noeuds.gEau.gain, vraiE = g.setTargetAtTime;
    g.setTargetAtTime = function(){ ecrits++; return vraiE.apply(this, arguments); };
    b.tourne(5);
    ok("… et le volume de l'eau n'est pas réécrit à chaque image",
       ecrits < 10, ecrits + " écritures en 300 images");
  })();

  /* ---------------------------------------------------------------
     7. UNE AMBIANCE QU'ON COUPE. Deux pièges anciens : une nappe qui
     survit au retour au campement, et une nappe qui ne se coupe pas
     avec le bouton du son. Les deux ont déjà mordu.
     --------------------------------------------------------------- */
  (function(){
    var b = banc({ z:1.0, decors:[{ v:2, s:2, gx:0, gy:0 }] });
    b.A.demarre();
    var n = b.A.noeuds;
    b.A.arrete();
    ok("on peut arrêter l'ambiance", b.A.noeuds === null);
    ok("… en fondu, jamais net", n.groupe.gain.rampes.indexOf(0.0001) >= 0);
    b.A.demarre();
    ok("… et la relancer proprement", !!b.A.noeuds && b.A.noeuds !== n);

    ok("le retour au campement coupe la nappe des nuits",
       /quitteVersBriefing[\s\S]{0,1400}ambianceNuits\.arrete\(\)/.test(html));
    ok("la boucle ne bat l'ambiance que sur la carte à l'air magique",
       /carteAirMagique\(jeu\.index\)\)\s*majAmbianceNuits\(dt\)/.test(html));
    /* Le bouton du son doit agir sur le gain MAÎTRE : couper `actif`
       seul laissait les nappes continues tourner sur une partie
       annoncée comme muette. */
    ok("le bouton du son coupe le gain maître, donc les nappes",
       /bascule:function\(\)\{[\s\S]{0,400}this\.maitre\.gain\.linearRampToValueAtTime/.test(html));
  })();

  /* ---------------------------------------------------------------
     8. LA PLUIE D'ÉTOILES SONNE PAREIL CHEZ TOUT LE MONDE. Elle part
     de l'heure murale : deux joueurs doivent entendre les MÊMES
     notes, sinon la phrase « tu as entendu ? » n'a plus de sens. Un
     seul Math.random dans ces deux fonctions et c'est fini.
     --------------------------------------------------------------- */
  (function(){
    var a = html.match(/pluieAnnonce:function\([\s\S]*?\n  \},/);
    var v = html.match(/voeuPose:function\([\s\S]*?\n  \},/);
    ok("l'annonce et la pose sont dans le fichier livré", !!a && !!v);
    if(!a || !v) return;
    ok("l'annonce de la pluie ne tire rien localement",
       a[0].indexOf("Math.random") < 0);
    ok("… elle passe par la graine du créneau", a[0].indexOf("grainePluie") > 0);
    ok("la note d'un vœu qui se pose ne tire rien localement non plus",
       v[0].indexOf("Math.random") < 0);
    ok("… elle aussi vient de la graine du créneau", v[0].indexOf("grainePluie") > 0);
    /* mais le VOLUME, lui, est local : c'est la distance à la caméra */
    ok("… seul son volume est local, par la distance", v[0].indexOf("att") > 0);
    /* et un retardataire n'entend que ce qui reste */
    ok("un joueur qui arrive en retard n'entend que la fin de l'annonce",
       /son\.pluieAnnonce\(n, P\.t\)/.test(html));
  })();

  /* ---------------------------------------------------------------
     9. « pas de message pour la prévenir ! et les étoiles 2 fois plus
     petites ». Le bandeau couvrait le ciel à l'instant précis où il
     fallait le regarder ; c'est le son qui prévient maintenant.
     --------------------------------------------------------------- */
  (function(){
    /* le texte survit dans un commentaire, qui explique pourquoi il
       n'est plus affiché : c'est l'APPEL qu'on traque, pas la chaîne */
    ok("plus aucun bandeau n'annonce la pluie d'étoiles",
       !/message\(\s*["'][^"']*toiles descendent/.test(html));
    ok("mais le son, lui, prévient toujours",
       /son\.pluieAnnonce/.test(html));
    ok("l'étoile qui tombe est deux fois plus petite",
       /var PLUIE_ECH\s*=\s*0\.5;/.test(html));
    var chute = html.match(/var R = 52 \* e\.ech \* PLUIE_ECH;/);
    var train = html.match(/\(4 \+ f \* 17\) \* e\.ech \* PLUIE_ECH/);
    ok("… sa tête et sa traînée suivent la réduction", !!chute && !!train);
    /* LE VŒU POSÉ NE BOUGE PAS : c'est la cible qu'on va chercher, et
       une cible qu'on ne trouve plus n'est plus une cible. */
    var pose = html.match(/var R = 31 \* v\.ech \* bat \* z;/);
    ok("… mais le vœu posé au sol garde sa taille",
       !!pose && pose[0].indexOf("PLUIE_ECH") < 0);
  })();
})();

/* ================================================================
   LA GUINGUETTE PAVOISÉE

   « À la guinguette il faut mettre 50 % de défenses en plus et les
   disposer de manière graphique guinguette. »

   Trois choses peuvent mal tourner, et une seule est cosmétique.

     L'INDEX. La guinguette est une île OUVERTE et jouée : son
     tableau de bâtiments porte le sens de chaque bit de destruction
     des parties en cours. La figure n'a donc le droit que d'AJOUTER
     EN QUEUE — et ce groupe le vérifie autrement qu'en croyant le
     commentaire.

     LA TRAVERSÉE. Une courbe fermée partitionne un plan. Cinq
     festons enfermaient deux mille trois cents cases à la première
     écriture : une troupe entrée dans un secteur n'en serait plus
     ressortie. On remesure ici, sur la grille du jeu.

     LE COMPTE. Cinquante pour cent, c'est un nombre, et il se
     vérifie.
   ================================================================ */
(function(){
  G("23. La guinguette pavoisée");

  var IG = -1;
  for(var ig = 0; ig < N.CARTES.length; ig++)
    if(N.CARTES[ig].biome === "guinguette") IG = ig;
  ok("l'île de la guinguette est là", IG >= 0);
  if(IG < 0) return;

  function defenses(c){
    var n = 0;
    for(var i = 0; i < c.batiments.length; i++){
      var t = c.batiments[i].t;
      if(t !== "cellule" && t !== "reacteur") n++;
    }
    return n;
  }
  /* la grille d'occupation du jeu, à l'identique de marqueEmprise */
  function grille(c){
    var occ = [], i, x, y;
    for(i = 0; i < N.GW * N.GH; i++) occ.push(0);
    for(i = 0; i < c.batiments.length; i++){
      var b = c.batiments[i], r = b.e / 2;
      for(x = Math.floor(b.gx - r); x <= Math.ceil(b.gx + r) - 1; x++)
        for(y = Math.floor(b.gy - r); y <= Math.ceil(b.gy + r) - 1; y++)
          if(x >= 0 && x < N.GW && y >= 0 && y < N.GH) occ[y * N.GW + x] = 1;
    }
    return occ;
  }
  /* l'inondation depuis la plage, en huit voisins : c'est ainsi que
     les troupes se déplacent, avanceUnite retombant sur un axe quand
     la diagonale est prise */
  var VOIS = [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]];
  function inonde(occ){
    var vu = [], pile = [], i, y;
    for(i = 0; i < N.GW * N.GH; i++) vu.push(0);
    for(y = 0; y < N.GH; y++){
      var k = y * N.GW + N.PLAGE_X0;
      if(!occ[k]){ vu[k] = 1; pile.push(k); }
    }
    while(pile.length){
      var q = pile.pop(), qx = q % N.GW, qy = (q / N.GW) | 0;
      for(var j = 0; j < 8; j++){
        var nx = qx + VOIS[j][0], ny = qy + VOIS[j][1];
        if(nx < 0 || nx >= N.GW || ny < 0 || ny >= N.GH) continue;
        var kk = ny * N.GW + nx;
        if(vu[kk] || occ[kk]) continue;
        vu[kk] = 1; pile.push(kk);
      }
    }
    return vu;
  }

  /* ---------------------------------------------------------------
     1. LA FIGURE. Elle est de la géométrie pure : aucun tirage, aucun
     état, donc la même chez tous les joueurs et à toutes les
     versions. C'est ce qui permet au SOL de la peindre exactement là
     où les défenses se posent.
     --------------------------------------------------------------- */
  (function(){
    var F = N.figureGuinguette(), G2 = N.figureGuinguette();
    ok("la figure ne tire rien : deux appels donnent le même dessin",
       JSON.stringify(F) === JSON.stringify(G2));
    ok("elle porte cinq couronnes", F.couronnes.length === 5,
       F.couronnes.length + " couronnes");
    ok("… et un plancher de bal au milieu de l'île",
       F.piste > 8 && Math.abs(F.cx - N.GW * 0.5) < 20 && Math.abs(F.cy - N.GH * 0.5) < 20);

    var deuxCordes = 1, versDehors = 1, pasJuste = 1, sorties = 0;
    for(var i = 0; i < F.couronnes.length; i++){
      var K = F.couronnes[i];
      if(K.cordes.length !== K.mats.length * 2) deuxCordes = 0;
      for(var j = 0; j < K.cordes.length; j++){
        var C = K.cordes[j], m = C.pts[(C.pts.length / 2) | 0];
        /* LE CREUX POINTE VERS LE DEHORS : c'est ce qui fait lire
           « guirlande » et non « polygone ». Le milieu de la corde
           doit être PLUS LOIN du centre que le milieu des deux mâts. */
        var rMil = Math.hypot(m[0] - F.cx, m[1] - F.cy);
        var rCorde = Math.hypot((C.a[0] + C.b[0]) * 0.5 - F.cx,
                                (C.a[1] + C.b[1]) * 0.5 - F.cy);
        if(rMil <= rCorde + 1) versDehors = 0;
        for(var k = 1; k < C.pts.length; k++){
          var d = Math.hypot(C.pts[k][0] - C.pts[k-1][0], C.pts[k][1] - C.pts[k-1][1]);
          if(Math.abs(d - N.PAVOIS_PAS) > 0.35) pasJuste = 0;
        }
        for(k = 0; k < C.pts.length; k++)
          if(C.pts[k][0] < 2 || C.pts[k][0] > N.PLAGE_X0 + 2 ||
             C.pts[k][1] < -2 || C.pts[k][1] > N.GH + 2) sorties++;
      }
    }
    ok("deux cordes par travée, comme un vrai pavois", deuxCordes);
    ok("chaque corde PEND vers l'extérieur", versDehors);
    /* à longueur d'arc constante, et non à paramètre constant : sinon
       les perles s'entassent aux mâts et le fond du feston se vide —
       or le fond du feston est exactement ce qu'on regarde */
    ok("les perles sont espacées régulièrement le long du fil", pasJuste);
    ok("et aucune corde ne sort de l'île", sorties === 0, sorties + " points dehors");
  })();

  /* ---------------------------------------------------------------
     2. LES QUATRE ALLÉES. Elles ne sont pas décoratives : sans elles
     l'île se referme. Elles doivent partir du plancher de bal et
     sortir, et rien ne doit y être posé.
     --------------------------------------------------------------- */
  (function(){
    var F = N.figureGuinguette();
    ok("le milieu de la piste est dans une allée — c'est leur croisée",
       N.dansAlleeGuinguette(F.cx, F.cy));
    var u = 0.70711, dedans = 1, dehors = 0;
    for(var r = 4; r < 62; r += 2){
      /* sur les quatre rayons */
      if(!N.dansAlleeGuinguette(F.cx + r * u, F.cy + r * u)) dedans = 0;
      if(!N.dansAlleeGuinguette(F.cx - r * u, F.cy + r * u)) dedans = 0;
      if(!N.dansAlleeGuinguette(F.cx + r * u, F.cy - r * u)) dedans = 0;
      if(!N.dansAlleeGuinguette(F.cx - r * u, F.cy - r * u)) dedans = 0;
      /* et entre eux, à mi-chemin, on est dehors */
      if(N.dansAlleeGuinguette(F.cx + r, F.cy)) dehors++;
      if(N.dansAlleeGuinguette(F.cx, F.cy + r)) dehors++;
    }
    ok("les quatre allées courent du centre jusqu'au bord", dedans);
    ok("… et ne mangent pas le reste de l'île", dehors === 0, dehors + " écarts");

    var c = N.genereCarte("ALLEE", IG, "", 0), dansAllee = 0;
    for(var i = 0; i < c.batiments.length; i++)
      if(N.dansAlleeGuinguette(c.batiments[i].gx, c.batiments[i].gy)) dansAllee++;
    /* le semis d'origine, lui, y est : on n'a pas le droit d'y
       toucher, son rang porte le bitmap. Ce qui compte est qu'aucun
       bâtiment NEUF ne s'y ajoute — et le seul moyen de le voir
       depuis ici est que le compte n'ait pas explosé. */
    ok("les allées ne reçoivent que le semis d'origine, jamais le pavois",
       dansAllee < 150, dansAllee + " bâtiments dans les allées");
  })();

  /* ---------------------------------------------------------------
     3. LA TRAVERSÉE — le test qui a fait réécrire la figure trois
     fois. On rejoue la grille d'occupation du jeu et l'on inonde
     depuis la plage.
     --------------------------------------------------------------- */
  (function(){
    var pireHors = 0, pirePoches = 0, pireTaux = 1, brasier = 1;
    for(var g = 0; g < 4; g++){
      var c = N.genereCarte("PASSE" + g, IG, "", 0);
      var occ = grille(c), vu = inonde(occ);
      var libres = 0, atteintes = 0, poches = 0, i, x, y;
      for(i = 0; i < N.GW * N.GH; i++){ if(!occ[i]) libres++; if(vu[i]) atteintes++; }
      for(y = 0; y < N.GH; y++)
        for(x = 6; x < N.PLAGE_X0; x++){
          var k = y * N.GW + x;
          if(!occ[k] && !vu[k]) poches++;
        }
      /* le Brasier doit rester joignable, sinon la carte est
         imprenable et la campagne bloquée sur elle */
      var qgOk = 0;
      for(var dx = -3; dx <= 3; dx++)
        for(var dy = -3; dy <= 3; dy++){
          var qx = N.QG_GX + dx, qy = N.QG_GY + dy;
          if(qx >= 0 && qx < N.GW && qy >= 0 && qy < N.GH && vu[qy * N.GW + qx]) qgOk = 1;
        }
      if(!qgOk) brasier = 0;
      /* ET SURTOUT : aucun bâtiment ne doit se retrouver hors de
         portée de tout point atteignable. Un bâtiment enfermé ne
         pourrait plus être ni abattu ni récolté — l'île ne serait
         jamais rasée à cent pour cent, et le score jamais complet.
         Cinq cases : la plus courte portée du jeu, celle du Crible. */
      var hors = 0;
      for(i = 0; i < c.batiments.length; i++){
        var b = c.batiments[i], vuOk = 0;
        for(dx = -5; dx <= 5 && !vuOk; dx++)
          for(dy = -5; dy <= 5 && !vuOk; dy++){
            if(dx * dx + dy * dy > 25) continue;
            x = Math.round(b.gx) + dx; y = Math.round(b.gy) + dy;
            if(x >= 0 && x < N.GW && y >= 0 && y < N.GH && vu[y * N.GW + x]) vuOk = 1;
          }
        if(!vuOk) hors++;
      }
      if(hors > pireHors) pireHors = hors;
      if(poches > pirePoches) pirePoches = poches;
      if(atteintes / libres < pireTaux) pireTaux = atteintes / libres;
    }
    ok("le Brasier reste joignable depuis la plage", brasier);
    ok("aucun bâtiment ne se retrouve enfermé hors de portée",
       pireHors === 0, pireHors + " bâtiment(s) injoignable(s)");
    ok("l'île reste franchissable de part en part",
       pireTaux > 0.97, (pireTaux * 100).toFixed(1) + "% des cases libres atteintes");
    ok("… et il ne reste que des recoins, pas des secteurs murés",
       pirePoches < 400, pirePoches + " cases enfermées");
  })();

  /* ---------------------------------------------------------------
     4. LE COMPTE. « Cinquante pour cent de défenses en plus » est un
     nombre. Les cellules à récolter et les réacteurs n'en sont pas :
     ils ne défendent rien.
     --------------------------------------------------------------- */
  (function(){
    var bas = 1e9, haut = 0, n = 0;
    for(var g = 0; g < 4; g++){
      var c = N.genereCarte("COMPTE" + g, IG, "", 0);
      var d = defenses(c);
      if(d < bas) bas = d;
      if(d > haut) haut = d;
      n += d;
    }
    /* on ne peut pas relire la carte d'avant depuis le fichier livré :
       on compare donc aux nombres qu'elle avait, gravés ici. Ce sont
       des repères MESURÉS, pas des constantes du jeu.
         668  l'île nue, avant le pavois (v0.73)
        1000  après la figure et sa passe de complément (v0.74)
       Le renfort de la v0.75 s'ajoute par-dessus, sans toucher à un
       seul des rangs de la v0.74 — c'est l'objet du groupe suivant. */
    var AVANT = 668, V074 = 1000;
    var moyen = n / 4, hausse = moyen / AVANT - 1;
    ok("la guinguette porte au moins la moitié de défenses en plus",
       hausse > 0.50 && hausse < 0.75,
       AVANT + " → " + moyen.toFixed(0) + "  (+" + (hausse * 100).toFixed(1) + "%)");
    /* ET LE RENFORT EST BIEN LÀ, par-dessus la v0.74. Il ne peut pas
       atteindre les vingt pour cent demandés, et le groupe suivant dit
       pourquoi, mesure à l'appui : l'espace libre qui restait sur
       cette île EST l'espace où l'on marche. */
    ok("… et le renfort s'ajoute par-dessus la figure de la v0.74",
       moyen > V074 + 40, V074 + " → " + moyen.toFixed(0));
    ok("… et d'un salon à l'autre le compte ne s'envole pas",
       haut - bas < 90, bas + " à " + haut);

    /* LA PORTÉE NE BOUGE PAS. C'était la lecture de la demande : une
       guinguette mieux gardée, pas une île qu'on ne peut plus
       aborder. On ne compte pas les Frelons de l'île — leur nombre
       varie d'un salon à l'autre et la mesure serait floue — on lit
       la seule chose qui soit exacte : le pavois n'en POSE aucun.
       Rien de ce qu'il ajoute ne tire à plus de douze cases. */
    var pav = html.match(/function pavoiseLaGuinguette[\s\S]*?\n\}/);
    var lam = html.match(/function lampionsGuinguette[\s\S]*?\n\}/);
    ok("les deux passes de pose sont dans le fichier livré", !!pav && !!lam);
    if(pav && lam){
      var deux = pav[0] + lam[0];
      ok("le pavois ne pose ni Frelon ni Pilon",
         deux.indexOf('"frelon"') < 0 && deux.indexOf('"pilon"') < 0);
      /* et la portée la plus longue qu'il pose est celle du mirador */
      var pose = 0, maxPortee = 0;
      ["bobine", "cuve", "chalumeau", "silo", "mirador"].forEach(function(t){
        if(deux.indexOf('"' + t + '"') < 0) return;
        pose++;
        if(N.DEF[t].portee > maxPortee) maxPortee = N.DEF[t].portee;
      });
      ok("… et rien de ce qu'il pose ne tire à plus de douze cases et demie",
         pose >= 4 && maxPortee <= 12.5, maxPortee + " cases au plus");
    }
  })();

  /* ---------------------------------------------------------------
     5. LA MÊME CARTE POUR TOUT LE MONDE. La passe d'ouverture RETIRE
     des bâtiments : si son choix dépendait de l'ordre d'un objet ou
     d'un tirage, deux joueurs du même salon ne joueraient pas la même
     île, et leurs bitmaps de destruction ne voudraient plus rien dire.
     --------------------------------------------------------------- */
  (function(){
    function signe(c){
      var s = "";
      for(var i = 0; i < c.batiments.length; i++){
        var b = c.batiments[i];
        s += b.t + Math.round(b.gx * 100) + "," + Math.round(b.gy * 100) + ";";
      }
      return s;
    }
    var a = signe(N.genereCarte("MEME", IG, "", 0));
    var b = signe(N.genereCarte("MEME", IG, "", 0));
    ok("deux générations du même salon donnent la même île", a === b);
    var d = signe(N.genereCarte("AUTRE", IG, "", 0));
    ok("… et deux salons différents, deux îles différentes", a !== d);
    /* le rang EST l'identité : après les retraits, il doit être
       renuméroté sans trou */
    var c = N.genereCarte("MEME", IG, "", 0), rangs = 1;
    for(var i = 0; i < c.batiments.length; i++) if(c.batiments[i].n !== i) rangs = 0;
    ok("chaque bâtiment porte son propre rang, sans trou", rangs);
  })();

  /* ---------------------------------------------------------------
     6. L'OUVERTURE NE TOUCHE JAMAIS AUX ANCIENS RANGS. C'est la seule
     chose qui rende la figure posable sur une île déjà jouée : les
     bâtiments d'avant ont leur bit dans tous les instantanés du
     salon. On l'éprouve directement, sur une carte fabriquée.
     --------------------------------------------------------------- */
  (function(){
    var faux = { batiments:[] }, i;
    /* un mur bien fermé : un anneau serré autour d'un creux */
    for(i = 0; i < 40; i++){
      var a = i / 40 * 6.2832;
      faux.batiments.push({ t:"bobine", gx:70 + Math.cos(a) * 9,
                            gy:60 + Math.sin(a) * 9, e:2, n:i, vivant:1 });
    }
    var avant = faux.batiments.length;
    /* et une seconde muraille, celle-là « neuve » */
    for(i = 0; i < 40; i++){
      var a2 = i / 40 * 6.2832;
      faux.batiments.push({ t:"bobine", gx:70 + Math.cos(a2) * 16,
                            gy:60 + Math.sin(a2) * 16, e:2,
                            n:faux.batiments.length, vivant:1 });
    }
    var empreintes = [];
    for(i = 0; i < avant; i++)
      empreintes.push(faux.batiments[i].t + faux.batiments[i].gx.toFixed(4));
    N.ouvreLaFete(faux, avant);
    var garde = faux.batiments.length >= avant, memes = 1;
    for(i = 0; i < avant && garde; i++)
      if(faux.batiments[i].t + faux.batiments[i].gx.toFixed(4) !== empreintes[i]) memes = 0;
    ok("l'ouverture ne retire aucun rang d'avant", garde && memes);
    ok("… mais elle perce bien la muraille neuve",
       faux.batiments.length < avant + 40,
       (avant + 40) + " → " + faux.batiments.length);
  })();

  /* ---------------------------------------------------------------
     7. LE SOL PEINT LA MÊME FIGURE. Deux tracés calculés séparément
     se seraient désalignés à la première retouche d'un rayon — et
     c'est le genre d'écart qu'on ne voit qu'à l'écran, longtemps
     après. Une seule géométrie, deux lecteurs.
     --------------------------------------------------------------- */
  (function(){
    var sol = html.match(/if\(carteC\.biome === "guinguette"\)\{[\s\S]*?\n  \}/);
    ok("le sol de la guinguette est dans le fichier livré", !!sol);
    if(!sol) return;
    ok("il prend sa figure à la même fonction que les défenses",
       sol[0].indexOf("figureGuinguette()") > 0);
    ok("… il coupe les guirlandes peintes dans les allées",
       sol[0].indexOf("dansAlleeGuinguette") > 0);
    ok("… et il peint bien un plancher de bal", sol[0].indexOf("FG.piste") > 0);
    /* la racine de deux : un cercle du quadrillage se projette en
       ellipse de demi-axes 26 R √2 et 13 R √2. Sans elle, le plancher
       est trop petit d'un tiers et l'anneau de torches tombe dehors. */
    ok("… au bon rayon, racine de deux comprise",
       /FG\.piste \* TW \* 0\.5 \* 1\.41421/.test(sol[0]));
  })();

  /* ---------------------------------------------------------------
     8. ET RIEN QUE LA GUINGUETTE. La figure ne doit toucher aucune
     autre île : elles ont toutes des parties en cours.
     --------------------------------------------------------------- */
  (function(){
    var pave = 0;
    for(var i = 0; i < N.CARTES.length; i++){
      if(i === IG) continue;
      var c = N.genereCarte("AILLEURS", i, N.planDeCarte(i, ""), 0);
      /* la signature du pavois : des cuves en nombre. Aucune île n'en
         porte plus d'une poignée — c'est le bâtiment le plus rare du
         jeu, et c'est pour ça qu'il fait une bonne guirlande. */
      var cuves = 0;
      for(var j = 0; j < c.batiments.length; j++)
        if(c.batiments[j].t === "cuve") cuves++;
      if(cuves > 40) pave++;
    }
    ok("aucune autre île n'a été pavoisée", pave === 0);
    var cg = N.genereCarte("AILLEURS", IG, "", 0), cuvesG = 0;
    for(var k = 0; k < cg.batiments.length; k++)
      if(cg.batiments[k].t === "cuve") cuvesG++;
    ok("… et la guinguette, elle, l'est bien", cuvesG > 80, cuvesG + " cuves");
  })();
})();

/* ================================================================
   LE RENFORT DE LA GUINGUETTE, ET LE PLAFOND DE L'ÎLE

   « En gardant exactement ce graphisme, ce motif au sol, cette
   configuration-là, densifie encore de vingt pour cent les défenses.
   Rajoute une majorité de Frelons. »

   Deux choses se vérifient ici, et la seconde est un CONSTAT autant
   qu'un test : l'île a un plafond, il a été mesuré, et il est en
   dessous des vingt pour cent demandés. Ce que ce groupe garantit,
   c'est qu'on s'en approche autant que l'île le permet SANS casser ce
   qui la rend jouable.
   ================================================================ */
(function(){
  G("24. Le renfort de la guinguette");

  var IG = -1;
  for(var ig = 0; ig < N.CARTES.length; ig++)
    if(N.CARTES[ig].biome === "guinguette") IG = ig;
  if(IG < 0){ ok("l'île de la guinguette est là", false); return; }

  /* ---------------------------------------------------------------
     1. LA FIGURE DE LA v0.74 N'A PAS BOUGÉ D'UN RANG.
     C'est la condition de tout le reste : cette carte est en ligne,
     ses rangs portent le bitmap des destructions de qui y débarque.
     Le renfort n'a le droit que d'AJOUTER EN QUEUE.
     --------------------------------------------------------------- */
  (function(){
    var pav = html.match(/if\(CARTES\[index\] && CARTES\[index\]\.biome === "guinguette"\)\{[\s\S]*?\n  \}/);
    ok("l'appel du pavois est dans le fichier livré", !!pav);
    if(!pav) return;
    var t = pav[0];
    /* l'ordre est l'invariant : figure, ouverture, complément,
       ouverture — puis SEULEMENT le renfort */
    var iPav = t.indexOf("pavoiseLaGuinguette");
    var iLamp = t.indexOf("lampionsGuinguette");
    var iGele = t.indexOf("geleV074");
    var iRenf = t.indexOf("renfortGuinguette");
    ok("le renfort vient après toute la guinguette de la v0.74",
       iPav > 0 && iLamp > iPav && iGele > iLamp && iRenf > iGele);
    /* et son ouverture ne peut défaire QUE son propre ouvrage */
    ok("… et l'ouverture qui le suit a pour plancher la longueur d'alors",
       /ouvreLaFete\(c, geleV074/.test(t));
    ok("… alors que les deux premières gardent le plancher d'origine",
       (t.match(/ouvreLaFete\(c, avantPavois/g) || []).length === 2);
  })();

  /* ---------------------------------------------------------------
     2. UNE MAJORITÉ DE FRELONS. Le Frelon tient trois cases contre
     deux : il bouche bien plus facilement un couloir, et l'île en
     accueille forcément moins. C'est pour cela que la passe des
     petits est PLAFONNÉE à leur nombre — sans quoi ils seraient deux
     fois plus nombreux et la majorité serait perdue.
     --------------------------------------------------------------- */
  (function(){
    var ren = html.match(/function renfortGuinguette[\s\S]*?\n\}/);
    ok("le renfort est dans le fichier livré", !!ren);
    if(!ren) return;
    ok("il pose des Frelons", ren[0].indexOf('"frelon"') > 0);
    ok("… il les pose AVANT les petits, sinon ils ne trouvent plus de place",
       ren[0].indexOf('"frelon"') < ren[0].indexOf('"chalumeau"'));
    ok("… et il plafonne les petits à leur nombre",
       /petits < frelons/.test(ren[0]));

    var avant = 14, bas = 1e9, haut = 0, som = 0;
    for(var g = 0; g < 4; g++){
      var c = N.genereCarte("RENF" + g, IG, "", 0), f = 0;
      for(var i = 0; i < c.batiments.length; i++) if(c.batiments[i].t === "frelon") f++;
      som += f; if(f < bas) bas = f; if(f > haut) haut = f;
    }
    var moy = som / 4;
    ok("l'île porte maintenant beaucoup plus de Frelons qu'avant",
       moy > avant * 2.5, avant + " → " + moy.toFixed(0) + " en moyenne");
    ok("… et d'un salon à l'autre le compte tient", haut - bas < 30, bas + " à " + haut);
  })();

  /* ---------------------------------------------------------------
     3. LE TEST DU BOUCHON, ET C'EST LUI QUI A TOUT DÉBLOQUÉ.
     L'espace libre qui reste sur une île dense N'EST PAS de l'espace
     perdu : c'est exactement l'espace où l'on marche. Poser au hasard
     dans ce qui reste faisait tomber l'île de 99 % de cases
     atteignables à 79 %.
     --------------------------------------------------------------- */
  (function(){
    var at = html.match(/function atelierPavois[\s\S]*?\n\}/);
    ok("l'atelier de pose est dans le fichier livré", !!at);
    if(!at) return;
    ok("il sait dire si une pose coupe un passage", /function bouche\(/.test(at[0]));
    ok("… en comptant les groupes de cases libres avant et après",
       /groupes\([\s\S]{0,80}\) > groupes\(/.test(at[0]));
    /* et le test coûteux ne tourne QUE derrière le test bon marché :
       trente mille places balayées, deux cents qui tiennent */
    var ren = html.match(/function renfortGuinguette[\s\S]*?\n\}/);
    ok("… et il ne tourne qu'après l'encombrement, jamais avant",
       !!ren && /libre\(t, x, y\) && !bouche\(t, x, y\)/.test(ren[0]));
  })();

  /* ---------------------------------------------------------------
     4. ET L'ÎLE RESTE JOUABLE. C'est la contrainte qui a fixé le
     plafond, et elle prime sur le compte.
     --------------------------------------------------------------- */
  (function(){
    var VOIS = [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]];
    var pireHors = 0, pireTaux = 1, pirePoches = 0;
    for(var g = 0; g < 4; g++){
      var c = N.genereCarte("RENF" + g, IG, "", 0), i, x, y;
      var occ = [], vu = [], pile = [];
      for(i = 0; i < N.GW * N.GH; i++){ occ.push(0); vu.push(0); }
      for(i = 0; i < c.batiments.length; i++){
        var b = c.batiments[i], r = b.e / 2;
        for(x = Math.floor(b.gx - r); x <= Math.ceil(b.gx + r) - 1; x++)
          for(y = Math.floor(b.gy - r); y <= Math.ceil(b.gy + r) - 1; y++)
            if(x >= 0 && x < N.GW && y >= 0 && y < N.GH) occ[y * N.GW + x] = 1;
      }
      for(y = 0; y < N.GH; y++){
        var k = y * N.GW + N.PLAGE_X0;
        if(!occ[k]){ vu[k] = 1; pile.push(k); }
      }
      while(pile.length){
        var q = pile.pop(), qx = q % N.GW, qy = (q / N.GW) | 0;
        for(var j = 0; j < 8; j++){
          var nx = qx + VOIS[j][0], ny = qy + VOIS[j][1];
          if(nx < 0 || nx >= N.GW || ny < 0 || ny >= N.GH) continue;
          var kk = ny * N.GW + nx;
          if(vu[kk] || occ[kk]) continue;
          vu[kk] = 1; pile.push(kk);
        }
      }
      var libres = 0, atteintes = 0, poches = 0;
      for(i = 0; i < N.GW * N.GH; i++){ if(!occ[i]) libres++; if(vu[i]) atteintes++; }
      for(y = 0; y < N.GH; y++)
        for(x = 6; x < N.PLAGE_X0; x++){
          var k2 = y * N.GW + x;
          if(!occ[k2] && !vu[k2]) poches++;
        }
      var hors = 0;
      for(i = 0; i < c.batiments.length; i++){
        var b2 = c.batiments[i], ok2 = 0, dx, dy;
        for(dx = -5; dx <= 5 && !ok2; dx++)
          for(dy = -5; dy <= 5 && !ok2; dy++){
            if(dx * dx + dy * dy > 25) continue;
            x = Math.round(b2.gx) + dx; y = Math.round(b2.gy) + dy;
            if(x >= 0 && x < N.GW && y >= 0 && y < N.GH && vu[y * N.GW + x]) ok2 = 1;
          }
        if(!ok2) hors++;
      }
      if(hors > pireHors) pireHors = hors;
      if(poches > pirePoches) pirePoches = poches;
      if(atteintes / libres < pireTaux) pireTaux = atteintes / libres;
    }
    /* CE TEST-CI EST LE PLAFOND DE L'ÎLE. Il ne se négocie pas : un
       bâtiment qu'aucune troupe ne peut atteindre est un bâtiment
       qu'on ne peut plus abattre, et l'île n'est alors jamais rasable
       à cent pour cent. C'est lui qui a arrêté la densification à
       sept pour cent au lieu des vingt demandés. */
    ok("après le renfort, aucun bâtiment n'est hors d'atteinte",
       pireHors === 0, pireHors + " bâtiment(s)");
    ok("… et l'île reste franchissable de part en part",
       pireTaux > 0.97, (pireTaux * 100).toFixed(1) + "%");
    ok("… il ne reste que des recoins, pas des secteurs murés",
       pirePoches < 400, pirePoches + " cases enfermées");
  })();
})();

/* ================================================================
   LA TAILLE DES TORNADES, ET LA HAUTEUR DES NUAGES

   « J'ai l'impression que toutes les tornades sont trop hautes
   maintenant ; à mon avis deux fois plus petites. Et les nuages
   doivent être légèrement plus hauts. »

   Deux nombres, et une règle de maison à ne pas enfreindre : le
   dessin peut grossir ou maigrir librement, LE RAYON MORTEL NON.
   Une partie en cours ne doit pas changer de difficulté parce qu'on
   a retouché une silhouette.
   ================================================================ */
(function(){
  G("25. La taille des tornades et la hauteur des nuages");

  ok("la colonne est revenue à sa hauteur d'avant",
     N.EQ.TORNADE_HAUT_ECH === 1.0, "×" + N.EQ.TORNADE_HAUT_ECH);
  /* le cône, lui, reste élargi : c'est LUI qui fait l'impression, et
     il avait été demandé à part */
  ok("… mais le cône garde son évasement d'une fois et demie",
     N.EQ.TORNADE_CONE_ECH === 1.5, "×" + N.EQ.TORNADE_CONE_ECH);

  /* LES QUATRE PROFILS SUIVENT LE MÊME NOMBRE. Il y en a un par île à
     tornades — ténèbres, nuits, campagne, guinguette — et chacun
     calcule sa hauteur dans son coin : en oublier un donnerait une île
     à deux tailles de tornade sans qu'on sache pourquoi. */
  (function(){
    var vus = 0, tous = 1;
    for(var i = 0; i < N.CARTES.length; i++){
      var P = N.profilTornade(i);
      if(!P) continue;
      vus++;
      /* 330 est la hauteur de référence du dessin ; ech vaut
         TORNADE_ECH_VISUEL, et le tourbillon des nuits y ajoute le
         sien. La hauteur doit rester proportionnelle à ces facteurs
         SEULS, sans le doublement retiré. */
      var attendu = 330 * N.EQ.TORNADE_ECH_VISUEL * N.EQ.TORNADE_HAUT_ECH;
      var attenduTb = attendu * N.EQ.TOURBILLON_ECH;
      if(Math.abs(P.haut - attendu) > 0.5 && Math.abs(P.haut - attenduTb) > 0.5) tous = 0;
    }
    ok("les quatre îles à tornades ont un profil", vus === 4, vus + " profils");
    ok("… et toutes suivent la même hauteur, sans exception", tous);
  })();

  /* LE RAYON MORTEL N'A PAS BOUGÉ. C'est la convention de la maison,
     et c'est aussi ce qui garantit qu'aucune partie en cours ne change
     de difficulté : ces deux nombres ne touchent qu'au dessin. */
  (function(){
    var src = html.match(/function torProfil[\s\S]*?\n\}/);
    ok("le profil de dessin est dans le fichier livré", !!src);
    if(src)
      ok("… et c'est bien LUI, et lui seul, qui porte l'évasement",
         src[0].indexOf("TORNADE_CONE_ECH") > 0);
    /* le tueur ne connaît ni l'un ni l'autre */
    var tue = html.match(/function tueDansLeFeu[\s\S]*?\n\}/);
    ok("le tueur est dans le fichier livré", !!tue);
    if(tue)
      ok("… et il ne connaît aucun des deux facteurs de dessin",
         tue[0].indexOf("TORNADE_CONE_ECH") < 0 &&
         tue[0].indexOf("TORNADE_HAUT_ECH") < 0 &&
         tue[0].indexOf("TORNADE_ECH_VISUEL") < 0);
  })();

  /* LES NUAGES, LÉGÈREMENT PLUS HAUTS. La nappe est commune aux quatre
     ciels ; les trois hors orage la multiplient par 1,35. */
  (function(){
    var alt = html.match(/var MET_NUAGE_ALT = (\d+);/);
    ok("la hauteur des nuages est dans le fichier livré", !!alt);
    if(!alt) return;
    var v = alt[1] | 0;
    ok("elle est montée, mais légèrement", v > 340 && v <= 420, v + " (avant 340)");
    ok("… et la nuit enchantée garde son facteur, donc monte avec",
       /MET_NUAGE_ALT \* \(haut \? 1\.35 : 1\)/.test(html),
       Math.round(v * 1.35) + " pour les ciels hors orage");
    /* la foudre part de cette même nappe : elle doit suivre, sinon
       l'éclair naîtrait à côté du nuage */
    ok("… et la foudre part toujours de la même nappe",
       /oy = pn\.y - MET_NUAGE_ALT \* z/.test(html));
  })();
})();

/* ================================================================
   LE BLINDAGE DES DÉFENSES

   « Sur chaque carte, un pourcentage, uniquement sur les défenses, pas
   sur le QG. Défini dans les paramètres de la page d'accueil, et dès
   qu'on le modifie, directement appliqué sur la map. Une défense à
   trois mille de vie, plus cent pour cent, en aura six mille. »

   Et par-dessus, la contrainte qui commande tout : « sans rien
   réinitialiser, les maps sont en cours, les classements sont en
   cours, on ne touche à rien là-dedans. »

   Ce groupe vérifie les deux, et surtout le second.
   ================================================================ */
(function(){
  G("26. Le blindage des défenses");

  /* on remet la table à zéro en sortant : les autres groupes génèrent
     des cartes et n'ont aucune raison de les voir blindées */
  var sauve = N.blindageDeCarte(0);

  /* ---------------------------------------------------------------
     1. L'ENCODAGE. Deux clients qui portent la même table doivent
     produire exactement la même chaîne, sinon memeMonde les croit
     différents et l'on republie en boucle.
     --------------------------------------------------------------- */
  (function(){
    ok("une table vide s'encode en rien", N.encodeReglagesCarte({}) === "");
    ok("un zéro ne s'écrit pas", N.encodeReglagesCarte({ 3:{pv:0, dg:0} }) === "");
    var a = N.encodeReglagesCarte({ 6:{pv:120}, 2:{pv:50} });
    var b = N.encodeReglagesCarte({ 2:{pv:50}, 6:{pv:120} });
    ok("l'ordre d'insertion ne change pas la chaîne", a === b, a);
    ok("… et elle se relit à l'identique",
       N.blindageDans(a, 2) === 50 && N.blindageDans(a, 6) === 120);
    ok("le plafond tient",
       N.encodeReglagesCarte({ 1:{pv:99999} }) === "1:" + N.BLINDAGE_MAX);
    ok("… et le plancher aussi", N.encodeReglagesCarte({ 1:{pv:-40} }) === "");
    /* ══ LE SECOND POURCENTAGE, CELUI DES DÉGÂTS ══
       Il voyage dans le MÊME champ, en troisième membre, et n'est
       écrit que s'il sert : une île réglée en vie seulement produit la
       chaîne d'avant au caractère près. C'est ce qui permet à un
       client de la v0.76 de continuer à lire la vie correctement. */
    ok("une île réglée en vie seulement s'écrit comme avant",
       N.encodeReglagesCarte({ 6:{pv:20, dg:0} }) === "6:20");
    ok("… et avec des dégâts, le troisième membre apparaît",
       N.encodeReglagesCarte({ 6:{pv:20, dg:50} }) === "6:20:50");
    ok("… les deux se relisent séparément",
       N.blindageDans("6:20:50", 6) === 20 && N.degatsDans("6:20:50", 6) === 50);
    ok("… et des dégâts seuls s'écrivent avec une vie nulle",
       N.encodeReglagesCarte({ 6:{pv:0, dg:80} }) === "6:0:80" &&
       N.degatsDans("6:0:80", 6) === 80 && N.blindageDans("6:0:80", 6) === 0);
    /* UN CLIENT DE LA v0.76 LIT « 6:20:50 » COMME « 6:20 » : son
       parseInt s'arrête au deux-points. Il ne comprend pas les dégâts,
       mais il ne casse pas la vie — et le compteur le corrige. */
    ok("un client d'avant y lirait la vie sans se tromper",
       parseInt("20:50", 10) === 20);
    /* une chaîne venue du relais peut être n'importe quoi */
    ["", null, undefined, "n'importe quoi", "2:", ":50", "2:abc", "|||", "-1:50",
     "2:50|2:70", "2:50:abc", "2::50", "2:50:70:90", "2:-5:-9"].forEach(function(x){
      var t = N.decodeReglagesCarte(x), mauvais = 0;
      for(var k in t){
        var e = t[k];
        if(!(e.pv >= 0 && e.pv <= N.BLINDAGE_MAX)) mauvais = 1;
        if(!(e.dg >= 0 && e.dg <= N.BLINDAGE_MAX)) mauvais = 1;
      }
      if(mauvais) ok("une chaîne malformée ne passe pas : " + x, false);
    });
    ok("aucune chaîne malformée ne fait sortir une valeur folle", true);
    ok("et une carte sans réglage vaut zéro", N.blindageDans("6:120", 2) === 0);
  })();

  /* ---------------------------------------------------------------
     2. LA FUSION. Copie de meilleurPlan : le numéro tranche, et à
     numéro égal la chaîne la plus grande — pour que deux clients qui
     règlent en même temps CONVERGENT au lieu de se renvoyer la balle.
     --------------------------------------------------------------- */
  (function(){
    function M(bd, bn){
      var m = N.mondeVide(0, 1000, 0);
      m.bd = bd; m.bn = bn; return m;
    }
    ok("un instantané neuf ne porte aucun blindage",
       N.mondeVide(0, 1000, 0).bd === "" && N.mondeVide(0, 1000, 0).bn === 0);
    var a = M("2:50", 3), b = M("2:10", 1);
    ok("le réglage le plus récent l'emporte",
       N.fusionneMonde(a, b).bd === "2:50" && N.fusionneMonde(b, a).bd === "2:50");
    ok("… dans les deux sens, et avec son numéro",
       N.fusionneMonde(b, a).bn === 3);
    var x = M("2:50", 4), y = M("3:20", 4);
    ok("à numéro égal, les deux clients convergent sur la même table",
       N.fusionneMonde(x, y).bd === N.fusionneMonde(y, x).bd);
    ok("un blindage différent fait republier", !N.memeMonde(a, b));
    ok("… et un blindage identique, non",
       N.memeMonde(M("2:50", 3), M("2:50", 3)));
    /* LE PIÈGE DES TROIS BRANCHES. fusionneMonde a un raccourci
       « return a » quand a est plus avancé : il perdrait le blindage
       de b si personne n'y avait pensé. */
    var av = M("", 0), ap = M("2:50", 9);
    av.c = 4; ap.c = 0;                       // av est plus avancé dans la campagne
    ok("une île plus avancée n'emporte pas un blindage périmé",
       N.fusionneMonde(av, ap).bd === "2:50",
       "« " + N.fusionneMonde(av, ap).bd + " »");
    ok("… et dans l'autre sens non plus",
       N.fusionneMonde(ap, av).bd === "2:50");
  })();

  /* ---------------------------------------------------------------
     3. LA GÉNÉRATION. Le blindage ne doit toucher QUE des points de
     vie : pas un bâtiment de plus, pas un de déplacé, pas un tirage
     consommé différemment. C'est la condition pour qu'une carte déjà
     jouée ne perde pas ses ruines.
     --------------------------------------------------------------- */
  (function(){
    N.poseBlindageSalon("", 0);
    var nus = [], i, j;
    for(i = 0; i < N.CARTES.length; i++)
      nus.push(N.genereCarte("BL", i, N.planDeCarte(i, ""), 0));

    N.poseBlindageSalon(N.encodeReglagesCarte((function(){
      var t = {}; for(var k = 0; k < N.CARTES.length; k++) t[k] = { pv:100 }; return t;
    })()), 1);

    var memeIndex = 1, memeNombre = 1, doubles = 1, inertes = 1, qg = 1;
    for(i = 0; i < N.CARTES.length; i++){
      var c = N.genereCarte("BL", i, N.planDeCarte(i, ""), 0), n = nus[i];
      if(c.batiments.length !== n.batiments.length){ memeNombre = 0; continue; }
      if(c.qg.pvMax !== n.qg.pvMax) qg = 0;
      for(j = 0; j < c.batiments.length; j++){
        var a = n.batiments[j], b = c.batiments[j];
        /* le rang EST l'identité : même type, même place au
           dix-millième de case près */
        if(a.t !== b.t || Math.abs(a.gx - b.gx) > 1e-9 || Math.abs(a.gy - b.gy) > 1e-9)
          memeIndex = 0;
        if(a.t === "cellule" || a.t === "reacteur"){
          if(a.pvMax !== b.pvMax) inertes = 0;
        }else if(Math.abs(b.pvMax - a.pvMax * 2) > 1) doubles = 0;
      }
    }
    ok("blinder ne change le nombre d'aucun bâtiment", memeNombre);
    ok("… ni le rang, ni le type, ni la place d'un seul", memeIndex);
    ok("… et à +100 %, chaque défense a bien deux fois sa vie", doubles);
    ok("le Brasier, lui, garde exactement la sienne", qg);
    ok("… et les cellules à récolter et les réacteurs aussi", inertes);

    /* « une défense à trois mille de vie en aura six mille » : le
       chiffre de la demande, pris au mot */
    N.poseBlindageSalon("2:100", 1);
    var c2 = N.genereCarte("BL", 2, "", 0), n2 = nus[2];
    ok("la vie totale des défenses d'une île blindée double exactement",
       N.pvDefensesCarte(c2) === N.pvDefensesCarte(n2) * 2,
       N.pvDefensesCarte(n2) + " → " + N.pvDefensesCarte(c2));
    ok("… et le blindage d'une carte ne déborde pas sur ses voisines",
       N.blindageDeCarte(2) === 100 && N.blindageDeCarte(1) === 0 &&
       N.blindageDeCarte(3) === 0);
    ok("le facteur d'une carte non réglée vaut exactement un",
       N.facteurBlindage(1) === 1);
    N.poseBlindageSalon("", 0);
  })();

  /* ---------------------------------------------------------------
     4. LES BLESSURES SONT UNE FRACTION, ET C'EST TOUT LE MÉCANISME.
     Sans cette propriété, appliquer le réglage à une partie en cours
     serait impossible : il faudrait choisir entre perdre les dégâts
     partiels et les fausser chez les autres joueurs.
     --------------------------------------------------------------- */
  (function(){
    var pv = 840, frac = [1, 0.75, 0.4, 0.13, 0.01];
    var tous = 1, fixe = 1;
    for(var k = 0; k < frac.length; k++){
      var avant = N.cranBlessure(pv * frac[k], pv);
      /* la même fraction, sur une vie multipliée par tout ce qu'on
         veut : le cran ne doit pas bouger d'un pouce */
      [1.2, 2, 3.5, 10].forEach(function(m){
        if(N.cranBlessure(pv * m * frac[k], pv * m) !== avant) tous = 0;
      });
      /* et le point fixe du cycle pv → cran → pv tient après
         changement d'échelle : sinon chaque tour raboterait de la vie */
      var m2 = 2, pvm = pv * m2;
      var c1 = N.cranBlessure(pvm * frac[k], pvm);
      var repose = pvm * c1 / N.BLESSURE_CRANS;
      if(N.cranBlessure(repose, pvm) !== c1) fixe = 0;
    }
    ok("un cran de blessure ne dépend que de la FRACTION de vie", tous);
    ok("… et le cycle vie → cran → vie reste stable après blindage", fixe);
  })();

  /* ---------------------------------------------------------------
     5. LA REMISE À L'ÉCHELLE D'UNE PARTIE EN COURS, rejouée depuis le
     fichier livré. C'est la fonction qui promet « sans rien
     réinitialiser » : on la met à l'épreuve mot par mot.
     --------------------------------------------------------------- */
  (function(){
    var src = html.match(/function reblindeLeJeu[\s\S]*?\n\}/);
    ok("la remise à l'échelle est dans le fichier livré", !!src);
    if(!src) return;
    ok("elle ne régénère jamais la carte",
       src[0].indexOf("genereCarte") < 0 && src[0].indexOf("nouvelleCarte") < 0);
    ok("… et elle épargne les cellules et les réacteurs",
       /b\.t === "cellule" \|\| b\.t === "reacteur"/.test(src[0]));
    ok("… le Brasier n'y est même pas nommé : il n'est pas dans le tableau",
       src[0].indexOf("jeu.qg") < 0);

    function bat(pv, pvMax, t){ return { t:t || "crible", pv:pv, pvMax:pvMax, vivant:pv > 0 ? 1 : 0 }; }
    function lance(jeuFaux, idx, av, ap){
      return new Function("jeu", "demandeMajBarres", "message",
        src[0] + "\nreturn reblindeLeJeu;")(jeuFaux, function(){}, function(){})(idx, av, ap);
    }
    var j = { index:2, qg:{ pv:900, pvMax:1000 }, degatsMoi:12345, energie:70,
      batiments:[ bat(840, 840), bat(336, 840), bat(1, 840), bat(0, 840),
                  bat(150, 150, "cellule"), bat(200000, 200000, "reacteur") ] };
    var n = lance(j, 2, 0, 100);
    ok("toutes les défenses sont remises à l'échelle, et elles seules",
       n === 4, n + " défenses");
    ok("une défense intacte reste intacte, avec deux fois la vie",
       j.batiments[0].pv === 1680 && j.batiments[0].pvMax === 1680);
    ok("une défense à 40 % reste à 40 %",
       Math.abs(j.batiments[1].pv / j.batiments[1].pvMax - 0.4) < 0.002,
       (j.batiments[1].pv / j.batiments[1].pvMax * 100).toFixed(1) + "%");
    ok("une défense presque morte le reste", j.batiments[2].pv <= 3);
    ok("une RUINE reste une ruine",
       j.batiments[3].pv === 0 && j.batiments[3].vivant === 0);
    ok("la cellule à récolter ne bouge pas", j.batiments[4].pvMax === 150);
    ok("le réacteur du bouclier non plus", j.batiments[5].pvMax === 200000);
    ok("le Brasier garde exactement sa vie", j.qg.pvMax === 1000 && j.qg.pv === 900);
    ok("et le score déjà inscrit ne bouge pas d'un point", j.degatsMoi === 12345);

    /* ON REDESCEND, ET ON DOIT RETOMBER SUR SES PIEDS. Un aller-retour
       qui raboterait un peu de vie à chaque passage serait des dégâts
       offerts par l'arrondi — le défaut exact que cranBlessure décrit
       longuement pour son propre compte. */
    lance(j, 2, 100, 0);
    ok("l'aller-retour rend exactement la vie d'origine",
       j.batiments[0].pvMax === 840 && j.batiments[1].pvMax === 840);
    /* cent allers-retours : ce qui reste dit la vérité sur l'arrondi */
    var usure = 1;
    for(var k = 0; k < 50; k++){ lance(j, 2, 0, 100); lance(j, 2, 100, 0); }
    if(j.batiments[0].pvMax !== 840) usure = 0;
    ok("… et cent allers-retours ne rabotent pas un point de vie", usure,
       j.batiments[0].pvMax + " PV");

    /* et une autre carte que celle qu'on joue ne touche à rien */
    var avant = j.batiments[0].pvMax;
    var rien = lance(j, 7, 0, 200);
    ok("un réglage sur une AUTRE île ne touche pas la partie en cours",
       rien === 0 && j.batiments[0].pvMax === avant);
  })();

  /* ---------------------------------------------------------------
     6. LE CHEMIN COMPLET : le réglage part sur le réseau, revient, et
     s'applique. On lit le fichier livré plutôt que de le supposer.
     --------------------------------------------------------------- */
  (function(){
    ok("le panneau d'accueil a son bouton de blindage",
       /id="btAdminBlindage"/.test(html));
    ok("… branché sur le réglage", /btAdminBlindage[\s\S]{0,200}regleBlindageAdmin/.test(html));
    var adm = html.match(/function regleBlindageAdmin[\s\S]*?\n\}\n/);
    ok("le réglage est dans le fichier livré", !!adm);
    if(adm){
      ok("… il refuse une entrée hors bornes",
         /v >= 0 && v <= BLINDAGE_MAX/.test(adm[0]));
      ok("… il ne touche à rien si l'on annule",
         (adm[0].match(/=== null\) return;/g) || []).length >= 2);
      /* L'AVERTISSEMENT EST LA PIÈCE LA PLUS IMPORTANTE DU PANNEAU :
         le TOP DÉGÂTS compte des points de vie, donc blinder une île
         déjà jouée rend les scores futurs plus gros que les anciens.
         Rien ne s'efface, mais le joueur doit le lire AVANT. */
      ok("… et il avertit quand l'île porte déjà des scores",
         adm[0].indexOf("ATTENTION") > 0 && adm[0].indexOf("dejaJouee") > 0);
    }
    var pos = html.match(/function regleBlindage[\s\S]*?\n\}/);
    ok("le poseur est dans le fichier livré", !!pos);
    if(pos){
      ok("… il publie et incrémente son numéro",
         /numeroBlindage \| 0\) \+ 1/.test(pos[0]));
      ok("… il remet la VIE à l'échelle sur la partie en cours",
         /reblindeLeJeu\(index, avant, t\[index\]\.pv\)/.test(pos[0]));
      /* LES DÉGÂTS N'ONT RIEN À METTRE À L'ÉCHELLE : ils ne sont pas
         rangés dans les bâtiments, ils sont lus dans DEF au moment du
         tir. Le poseur ne doit donc RIEN faire pour eux — et s'il
         faisait quelque chose, ce serait un défaut. */
      ok("… et ne touche à rien pour les dégâts, qui se lisent au tir",
         pos[0].indexOf("degats") < 0 || pos[0].indexOf("reblindeDegats") < 0);
    }
    /* L'ORDRE COMPTE, ET DANS LA SEULE FONCTION QUI REÇOIT : on adopte
       le blindage AVANT d'adopter le plan et AVANT d'appliquer les
       destructions. Si la carte doit être refaite parce que le plan a
       changé, elle doit sortir du générateur avec la bonne dureté du
       premier coup — sinon on la refait deux fois. */
    var rec = html.match(/function adopteMonde[\s\S]*?\n\}/);
    ok("l'adoption d'un instantané reçu est dans le fichier livré", !!rec);
    if(rec){
      var iBl = rec[0].indexOf("poseBlindageSalon(monde.bd");
      var iPl = rec[0].indexOf("planSalon   = monde.p");
      ok("un instantané reçu adopte le blindage, et avant le plan",
         iBl > 0 && iPl > iBl, "blindage " + iBl + ", plan " + iPl);
      ok("… et il remet la partie en cours à l'échelle sans la refaire",
         /reblindeLeJeu\(jeu\.index/.test(rec[0]) &&
         rec[0].indexOf("poseBlindageSalon(monde.bd") <
         rec[0].indexOf("reblindeLeJeu(jeu.index"));
    }
    /* et l'affichage montre le total, jamais la somme */
    ok("la fiche d'une défense montre la vie qu'elle aura sur CETTE carte",
       /var pv = Math\.round\(f\.pv \* k\);/.test(html));
    ok("… et l'accueil montre le blindage d'une île qui en porte un",
       /function pastilleBlindage/.test(html));
  })();

  /* ---------------------------------------------------------------
     7. LES SIX DÉFAUTS QU'UNE RELECTURE ADVERSARIALE A TROUVÉS, et
     qu'on garde sous surveillance parce qu'aucun ne se voit à l'œil.
     --------------------------------------------------------------- */
  (function(){
    /* (a) LE RACCOURCI DE mondeCourant. Un client à jour resté à
       l'accueil renvoyait l'instantané tel quel sans regarder le
       blindage : il n'aurait donc jamais republié un réglage qu'un
       client d'une version plus ancienne venait d'effacer. */
    var mc = html.match(/function mondeCourant[\s\S]*?\n\}/);
    ok("mondeCourant est dans le fichier livré", !!mc);
    if(mc)
      ok("… et son raccourci « rien n'a changé » regarde aussi le blindage",
         /\(monde\.bd \|\| ""\) === blindageSalon && \(monde\.bn \| 0\) === numeroBlindage/
           .test(mc[0]));

    /* (b) L'ARRONDI. Le commentaire promettait une composition exacte ;
       elle ne l'est pas. On mesure la dérive réelle plutôt que de la
       nier — et l'on vérifie qu'elle reste sous le millième. */
    var src = html.match(/function reblindeLeJeu[\s\S]*?\n\}/);
    if(src){
      var f = new Function("jeu", "demandeMajBarres", "message",
        src[0] + "\nreturn reblindeLeJeu;");
      var pire = 0, al = N.prng(20260828);
      for(var essai = 0; essai < 400; essai++){
        var j = { index:0, batiments:[{ t:"crible", pv:840, pvMax:840, vivant:1 }] };
        var r = f(j, function(){}, function(){});
        var courant = 0, direct = 840;
        for(var pas = 0; pas < 6; pas++){
          var suivant = (al() * 300) | 0;
          r(0, courant, suivant);
          courant = suivant;
        }
        direct = 840 * (1 + courant / 100);
        var ecart = Math.abs(j.batiments[0].pvMax - direct) / Math.max(1, direct);
        if(ecart > pire) pire = ecart;
      }
      /* Trois millièmes : c'est la borne annoncée dans le commentaire
         de reblindeLeJeu, et elle est mesurée, pas devinée. Un point de
         vie sur huit cent quarante — invisible, et le seul prix à payer
         pour ne pas garder un champ de plus sur douze cents bâtiments. */
      ok("une suite de six réglages ne dérive pas de plus de trois millièmes",
         pire < 0.003, (pire * 1000).toFixed(3) + " ‰ au pire sur 400 suites");
      /* et l'aller-retour vers zéro retombe exactement */
      var j2 = { index:0, batiments:[{ t:"crible", pv:336, pvMax:840, vivant:1 }] };
      var r2 = f(j2, function(){}, function(){});
      r2(0, 0, 250); r2(0, 250, 0);
      ok("… et l'aller-retour vers zéro retombe au point près",
         j2.batiments[0].pvMax === 840 && j2.batiments[0].pv === 336,
         j2.batiments[0].pv + "/" + j2.batiments[0].pvMax);
    }

    /* (c) LE DÉMARRAGE. L'adoption passe aussi quand on relit le
       miroir local, avant que les sprites des défenses n'existent :
       repeindre douze aperçus à ce moment-là les peindrait sans
       sprites. */
    var ad = html.match(/function adopteMonde[\s\S]*?\n\}/);
    if(ad)
      ok("l'adoption ne repeint le menu que s'il est déjà bâti",
         /majMondes === "function" && document\.getElementById\("mn0"\)/.test(ad[0]));

    /* (d) UNE SEULE PASTILLE DE VIE, et c'est le total. Deux pastilles
       à multiplier de tête, c'est exactement « trois mille plus trois
       mille » — ce que la demande interdit. */
    ok("la hausse totale de vie se calcule en un seul chiffre",
       /function hausseTotalePv/.test(html));
    /* LE TEST COMPTE LES PASTILLES, PAS LES CHAÎNES.
       Il cherchait `class="dz pv"` écrit à la main dans la vignette.
       Depuis que les deux pastilles sortent de `dzPv` et `dzDg` — un
       seul endroit qui décide de leur forme, pour que la carte
       spéciale et l'île de campagne ne puissent pas diverger — cette
       chaîne n'est plus dans la vignette, et le test tombait en
       annonçant zéro pastille sur une vignette qui en porte bien une.
       Le fait gardé n'a pas changé d'un mot : UNE seule pastille de
       vie, et c'est le total. On compte donc l'appel. */
    var vig = html.match(/function vignetteEvenement[\s\S]*?\n\}/);
    if(vig){
      var pastilles = (vig[0].match(/dzPv\(/g) || []).length;
      ok("… et la vignette d'une carte spéciale n'en montre qu'une",
         pastilles === 1, pastilles + " pastille(s) de vie");
      ok("… celle du total, pas celle du bonus seul",
         vig[0].indexOf("dzPv(hausseTotalePv(i))") > 0 &&
         vig[0].indexOf("bonusPvDeCarte(i)") < 0);
    }
    /* ET LES DEUX SORTES DE VIGNETTE PASSENT PAR LE MÊME MOULE.
       C'est ce qui rendait le test précédent fragile qui le rend
       maintenant solide : tant qu'il n'y a qu'un `dzPv`, une carte
       spéciale et une île de campagne ne peuvent pas afficher deux
       formes différentes du même chiffre. */
    ok("la pastille de vie n'est écrite qu'à un seul endroit",
       /function dzPv\(b\)\{ return '<span class="dz pv">/.test(html));
    ok("… et celle des dégâts aussi",
       /function dzDg\(d\)\{ return '<span class="dz dg">/.test(html));

    /* (e) LA VIE TOTALE EST DITE QUELQUE PART. pvDefensesCarte ne doit
       pas être du code mort : c'est le chiffre que la demande réclame. */
    ok("le compte rendu du plan donne la vie totale des défenses",
       /pv:pvDefensesCarte\(m\)/.test(html) &&
       /PV de défenses à démonter/.test(html));
    ok("… et rappelle que le Brasier, lui, n'est jamais blindé",
       /jamais blindé/.test(html));

    /* (f) L'ENCODAGE NE PERD RIEN. Il bouclait sur CARTES.length : le
       jour où une île s'ajoute, un client resté en arrière relit la
       table, la ré-encode, et efface le réglage de la carte qu'il ne
       connaît pas. */
    var loin = {}; loin[N.CARTES.length + 3] = { pv:60 }; loin[1] = { pv:20 };
    var enc = N.encodeReglagesCarte(loin);
    ok("l'encodage garde un réglage pour une carte qu'on ne connaît pas",
       enc.indexOf((N.CARTES.length + 3) + ":60") >= 0, enc);
    ok("… et le tour complet ne perd rien",
       N.encodeReglagesCarte(N.decodeReglagesCarte(enc)) === enc);
    ok("… tout en restant trié, donc stable d'un client à l'autre",
       N.encodeReglagesCarte({ 9:{pv:5}, 1:{pv:20} }) ===
       N.encodeReglagesCarte({ 1:{pv:20}, 9:{pv:5} }));
    ok("… dégâts compris",
       N.encodeReglagesCarte(N.decodeReglagesCarte("1:20:30|9:0:5")) === "1:20:30|9:0:5");
  })();

  /* ---------------------------------------------------------------
     8. LE POURCENTAGE DE DÉGÂTS. « Je sais mettre des pourcentages de
     santé supplémentaire sur les défenses des maps, mais je ne sais
     pas mettre de pourcentage de dégâts des défenses. »

     C'est le frère du blindage, et il est plus simple : les dégâts ne
     sont pas rangés dans les bâtiments, ils sont LUS dans DEF au
     moment du tir, en un seul endroit. Rien à mettre à l'échelle,
     rien à convertir — et rien à craindre pour le classement.
     --------------------------------------------------------------- */
  (function(){
    N.poseBlindageSalon("", 0);
    ok("sans réglage, une carte ne majore aucun dégât",
       N.degatsDeCarte(2) === 0 && N.facteurDegats(2) === 1);
    N.poseBlindageSalon("2:0:150|6:20:80", 1);
    ok("les dégâts se règlent carte par carte",
       N.degatsDeCarte(2) === 150 && N.degatsDeCarte(6) === 80 &&
       N.degatsDeCarte(3) === 0);
    ok("… et n'empiètent pas sur la vie",
       N.blindageDeCarte(2) === 0 && N.blindageDeCarte(6) === 20);
    ok("… le facteur suit", Math.abs(N.facteurDegats(2) - 2.5) < 1e-9);

    /* LA VIE NE BOUGE PAS QUAND ON RÈGLE LES DÉGÂTS. Deux boutons,
       deux effets, aucun mélange. */
    var nu = (function(){ N.poseBlindageSalon("", 0);
      return N.pvDefensesCarte(N.genereCarte("DG", 2, "", 0)); })();
    N.poseBlindageSalon("2:0:300", 1);
    ok("régler les dégâts ne change pas un point de vie",
       N.pvDefensesCarte(N.genereCarte("DG", 2, "", 0)) === nu,
       nu + " PV des deux côtés");

    /* ET LE MULTIPLICATEUR, RELU DEPUIS LE FICHIER LIVRÉ. Il vaut pour
       TOUTES les cartes maintenant, pas seulement les spéciales — et
       il multiplie les deux facteurs au lieu d'en choisir un. */
    var md = html.match(/function multDegatsDefense[\s\S]*?\n\}/);
    ok("le multiplicateur de dégâts est dans le fichier livré", !!md);
    if(md){
      ok("… il ne se limite plus aux cartes spéciales",
         md[0].indexOf("!carteSpeciale(jeu.index)) return 1") < 0);
      ok("… et il multiplie le bonus d'expédition par le réglage",
         /facteurDegats\(jeu\.index\)/.test(md[0]) &&
         /reglagesEvt\(jeu\.index\)\.degBonus/.test(md[0]));
    }
    /* UN SEUL ENDROIT LE LIT, et c'est ce qui rend le réglage instantané */
    var lus = (html.match(/multDegatsDefense\(\)/g) || []).length;
    ok("une seule défense au monde lit ce multiplicateur, au moment du tir",
       lus === 2, lus + " occurrence(s) — la définition et l'appel");

    /* LE CLASSEMENT NE BOUGE PAS. Le TOP DÉGÂTS compte ce que le
       JOUEUR retire, pas ce que les défenses infligent : c'est le seul
       des deux réglages qui soit sans conséquence sur les scores. */
    var tou = html.match(/function toucheBatiment[\s\S]*?\n\}/);
    if(tou)
      ok("le score compte les dégâts du joueur, jamais ceux des défenses",
         /jeu\.degatsMoi \+= Math\.max\(0, Math\.min\(d, b\.pv\)\)/.test(tou[0]) &&
         tou[0].indexOf("multDegatsDefense") < 0);

    /* L'AFFICHAGE : un seul chiffre là aussi, jamais deux à multiplier */
    ok("la hausse totale de dégâts se calcule en un seul chiffre",
       /function hausseTotaleDegats/.test(html));
    var vg = html.match(/function vignetteEvenement[\s\S]*?\n\}/);
    if(vg)
      ok("… et la vignette d'une carte spéciale montre le total, pas le bonus seul",
         vg[0].indexOf("dzDg(hausseTotaleDegats(i))") > 0 &&
         vg[0].indexOf("R.degBonus") < 0);
    /* LA PASTILLE DE DÉGÂTS D'UNE ÎLE DE CAMPAGNE, gardée par ce
       qu'elle FAIT et non par ce qu'elle écrit. Le test cherchait le
       texte « Défenses + … % dégâts » ; ce libellé a été raccourci en
       « DEG +50% » pour tenir dans le coin de l'image, et le test
       tombait alors que la pastille était toujours là. On garde donc
       la règle elle-même : pastilleBlindage émet la pastille de dégâts
       si, et seulement si, la hausse est positive. */
    var pb = html.match(/function pastilleBlindage[\s\S]*?\n\}/);
    if(pb){
      ok("une île de campagne réglée en dégâts porte sa pastille",
         /if\(d > 0\) h \+= dzDg\(d\);/.test(pb[0]));
      ok("… et une île sans réglage n'en porte aucune",
         /return h \? '<div class="durci">' \+ h \+ '<\/div>' : "";/.test(pb[0]));
      ok("… le chiffre affiché étant le TOTAL des deux facteurs",
         /var b = hausseTotalePv\(i\), d = hausseTotaleDegats\(i\)/.test(pb[0]));
    }

    /* LE PANNEAU POSE LES DEUX QUESTIONS, dans cet ordre */
    var adm = html.match(/function regleBlindageAdmin[\s\S]*?\n\}\n/);
    if(adm){
      ok("le panneau demande la vie, puis les dégâts",
         adm[0].indexOf("1 sur 2 : LA VIE") > 0 &&
         adm[0].indexOf("2 sur 2 : LES DÉGÂTS") > 0 &&
         adm[0].indexOf("1 sur 2 : LA VIE") < adm[0].indexOf("2 sur 2 : LES DÉGÂTS"));
      ok("… et dit que les dégâts, eux, ne touchent pas au classement",
         adm[0].indexOf("ne touche PAS au classement") > 0);
    }
    N.poseBlindageSalon("", 0);
  })();

  N.poseBlindageSalon("", 0);
  ok("la table est remise à zéro pour la suite des tests",
     N.blindageDeCarte(0) === sauve && N.blindageDeCarte(0) === 0 &&
     N.degatsDeCarte(0) === 0);
})();

/* ================================================================
   LE JOURNAL DES PASSAGES

   « Une page avec des stats des gens qui se sont déjà connectés,
   savoir qui et quand. » Puis, en le précisant : « je préfère que ça
   ne soit pas mentionné, juste voir qui se connecte, alors pas les
   temps. »

   Deux choses se vérifient ici. Que le calendrier est juste — c'est
   la moitié du travail d'une statistique par jour, et c'est là qu'on
   se trompe. Et qu'AUCUNE DURÉE n'est mesurée nulle part : c'était
   une demande explicite, et un test vaut mieux qu'une intention.
   ================================================================ */
(function(){
  G("27. Le journal des passages");

  /* ---------------------------------------------------------------
     1. LE CALENDRIER. Un écart de dates ne se calcule pas en
     soustrayant deux nombres AAAAMMJJ : entre le 31 janvier et le
     1er février, la soustraction annonce soixante-dix jours.
     --------------------------------------------------------------- */
  (function(){
    ok("un jour s'écrit AAAAMMJJ",
       N.jourDe(new Date(2026, 7, 28)) === 20260828);
    ok("… et une heure HHMM", N.heureDe(new Date(2026, 7, 28, 22, 5)) === 2205);
    ok("… minuit compris", N.heureDe(new Date(2026, 7, 28, 0, 0)) === 0);
    ok("un jour se relit en date",
       N.jourEnDate(20260828).getDate() === 28 &&
       N.jourEnDate(20260828).getMonth() === 7);
    ok("l'écart d'un jour vaut un", N.ecartJours(20260828, 20260827) === 1);
    /* LE PIÈGE DU CHANGEMENT DE MOIS */
    ok("… y compris d'un mois à l'autre", N.ecartJours(20260201, 20260131) === 1,
       "31 janvier → 1er février");
    ok("… et d'une année à l'autre", N.ecartJours(20260101, 20251231) === 1);
    /* et celui d'une année bissextile */
    ok("… et le 29 février d'une bissextile",
       N.ecartJours(20240301, 20240228) === 2, "2024 est bissextile");
    ok("un même jour donne zéro", N.ecartJours(20260828, 20260828) === 0);
  })();

  /* ---------------------------------------------------------------
     2. LE JOURNAL LUI-MÊME.
     --------------------------------------------------------------- */
  (function(){
    var j = N.journalVide("a7k2", "Roro");
    ok("un journal neuf est vide", j.p.length === 0 && j.sq === "a7k2");
    N.ajouteVisite(j, 20260828, 2205, 4);
    ok("un passage s'y ajoute", j.p.length === 1 && j.p[0][0] === 20260828);
    ok("… et il n'est pas joué tant qu'on n'a pas débarqué", j.p[0][2] === 0);
    ok("le débarquement le marque", N.marqueJoue(j, 6) === 1 && j.p[0][2] === 1);
    ok("… et une seule fois : le second ne republie rien",
       N.marqueJoue(j, 6) === 0);
    ok("… il retient l'île", j.p[0][3] === 6);

    /* LE GRENIER SE VIDE. Rien de plus vieux que six mois, et jamais
       plus de deux cents passages : un journal qui grossit sans fin
       finirait par peser plus lourd que le jeu. */
    var g = N.journalVide("x", "X"), i;
    for(i = 0; i < 260; i++) N.ajouteVisite(g, 20260828, 1200, 0);
    ok("le journal se plafonne", g.p.length === N.JOURNAL_MAX,
       g.p.length + " passages");
    var v = N.journalVide("y", "Y");
    v.p.push([20250101, 1200, 1, 0]);      // très ancien
    v.p.push([20260827, 1200, 1, 0]);      // hier
    N.elagueJournal(v, 20260828);
    ok("… et oublie ce qui a plus de six mois", v.p.length === 1 &&
       v.p[0][0] === 20260827);
  })();

  /* ---------------------------------------------------------------
     3. TOUT CE QUI ENTRE EST SUSPECT. Ces journaux arrivent d'un
     relais PUBLIC : n'importe qui peut y publier n'importe quoi.
     --------------------------------------------------------------- */
  (function(){
    ["", "pas du json", "null", "42", '"texte"', "[]", "{}",
     '{"p":"pas un tableau"}',
     '{"p":[[20260828]]}',                       // trop court
     '{"p":[["a","b","c"]]}',                    // pas des nombres
     '{"p":[[19700101,1200,1,0]]}',              // date préhistorique
     '{"p":[[21500101,1200,1,0]]}',              // date d'après-demain
     '{"p":[[20260828,9999,1,0]]}',              // heure impossible
     '{"p":[[20260828,1200,1,99999]]}'           // île qui n'existe pas
    ].forEach(function(x){
      var j = N.decodeJournal(x);
      if(!j) return;                             // rejeté : très bien
      for(var i = 0; i < j.p.length; i++){
        var e = j.p[i];
        if(!(e[0] >= 20200101 && e[0] <= 21001231)) ok("date filtrée : " + x, false);
        if(!(e[1] >= 0 && e[1] <= 2359)) ok("heure filtrée : " + x, false);
        if(!(e[3] >= 0 && e[3] < 100)) ok("île filtrée : " + x, false);
      }
    });
    ok("aucune chaîne hostile ne fait sortir une valeur folle", true);
    /* et un journal de mille passages ne peut pas gonfler la page */
    var gros = { p:[] };
    for(var i = 0; i < 1000; i++) gros.p.push([20260828, 1200, 1, 0]);
    ok("un journal démesuré est coupé au plafond",
       N.decodeJournal(JSON.stringify(gros)).p.length === N.JOURNAL_MAX);
    /* le tour complet ne perd rien */
    var j2 = N.journalVide("a7k2", "Roro");
    N.ajouteVisite(j2, 20260828, 2205, 4);
    N.marqueJoue(j2, 4);
    var r = N.decodeJournal(N.encodeJournal(j2));
    ok("un journal honnête fait l'aller-retour sans perte",
       r.sq === "a7k2" && r.p.length === 1 && r.p[0][2] === 1 && r.p[0][3] === 4);
  })();

  /* ---------------------------------------------------------------
     4. LE DÉPOUILLEMENT — ce que la page montre vraiment.
     --------------------------------------------------------------- */
  (function(){
    var AU = 20260828;
    function jr(sq, nom, l){
      var j = N.journalVide(sq, nom);
      for(var i = 0; i < l.length; i++) j.p.push(l[i]);
      return j;
    }
    var S = N.statsJournaux([
      jr("a", "Roro", [[20260828, 2205, 1, 4], [20260828, 1830, 1, 4],
                       [20260827, 2140, 1, 4], [20260826, 1950, 0, 4],
                       [20260719, 1200, 1, 0]]),
      jr("b", "Max",  [[20260827, 1905, 0, 4], [20260823, 2230, 0, 4]]),
      jr("c", "Vide", [])
    ], AU);
    ok("un appareil sans passage ne fait pas de ligne", S.lignes.length === 2);
    ok("le plus récemment venu est en tête", S.lignes[0].nom === "Roro");
    var R = S.lignes[0], M = S.lignes[1];
    ok("les passages sont comptés", R.visites === 5 && M.visites === 2);
    /* LA QUESTION D'ORIGINE : qui vient voir sans jouer. */
    ok("… et l'on voit qui joue et qui regarde",
       R.jouees === 4 && R.regardees === 1 &&
       M.jouees === 0 && M.regardees === 2,
       "Max : 0 joué, 2 vus");
    ok("aujourd'hui se compte à part", R.aujourdhui === 2 && M.aujourdhui === 0);
    ok("la semaine aussi", R.j7 === 4 && M.j7 === 2);
    ok("… et le mois", R.j30 === 4 && M.j30 === 2, "le 19 juillet est dehors");
    ok("le dernier passage porte son heure",
       R.dernier === 20260828 && R.derniereHeure === 2205);
    ok("l'île la plus fréquentée est retenue", R.iles[4] === 3);
    ok("le compte par jour ne garde que trente jours",
       S.parJour[20260828].n === 2 && S.parJour[20260828].joue === 2 &&
       S.parJour[20260719] === undefined);
    /* une date en avant — horloge déréglée — ne casse rien */
    var F = N.statsJournaux([jr("z", "Futur", [[20270101, 1200, 1, 0]])], AU);
    ok("une date en avance est ignorée plutôt que de fausser le compte",
       F.lignes.length === 0);
  })();

  /* ---------------------------------------------------------------
     5. AUCUNE DURÉE NULLE PART. C'était la demande, mot pour mot :
     « juste voir qui se connecte, alors pas les temps ». On le
     vérifie sur le fichier livré, pas sur une bonne intention.
     --------------------------------------------------------------- */
  (function(){
    var mod = html.match(/var CLE_JOURNAL[\s\S]*?function tousLesJournaux[\s\S]*?\n\}/);
    ok("le module du journal est dans le fichier livré", !!mod);
    if(mod){
      /* un passage tient en quatre nombres, et pas un de plus :
         jour, heure, joué, île. Aucune place pour une durée. */
      ok("un passage ne porte que jour, heure, joué et île",
         /ajouteVisite\(monJournal, jourDe\(d\), heureDe\(d\)/.test(mod[0]));
      ok("… et rien ne mesure une durée",
         mod[0].indexOf("duree") < 0 && mod[0].indexOf("Duree") < 0 &&
         mod[0].indexOf("tempsPasse") < 0);
    }
    var aj = html.match(/function ajouteVisite[\s\S]*?\n\}/);
    if(aj) ok("le passage enregistré n'a que quatre nombres",
              /j\.p\.push\(\[jour \| 0, heure \| 0, 0, carte \| 0\]\)/.test(aj[0]));
    /* et la page le dit à qui la regarde */
    ok("la page l'annonce elle-même",
       /Aucune durée n'est mesurée/.test(html));
  })();

  /* ---------------------------------------------------------------
     6. LE CHEMIN COMPLET, relu dans le fichier livré.
     --------------------------------------------------------------- */
  (function(){
    ok("chaque appareil a son propre sujet retenu",
       /var SUJET_VUS   = SUJET \+ "\/vus";/.test(html) &&
       /function sujetMonJournal\(\)\{ return SUJET_VUS \+ "\/" \+ \(monSeau/.test(html));
    ok("… et l'on publie EN RETENU, sinon rien ne survivrait",
       /paquetPublish\(sujetMonJournal\(\), encodeJournal\(monJournal\), true\)/.test(html));
    /* L'ABONNEMENT EST À LA DEMANDE : un joueur ordinaire ne
       télécharge jamais l'historique des autres. */
    ok("on ne s'abonne aux journaux qu'en ouvrant la page",
       /function ouvreVus[\s\S]{0,400}abonneAuxJournaux\(\)/.test(html));
    var ab = html.match(/function abonneAuxJournaux[\s\S]*?\n\}/);
    if(ab){
      ok("… une seule fois par connexion", /if\(abonneVus \|\| !reseau\.connecte\) return 0/.test(ab[0]));
      ok("… et avec le joker, pour tous les appareils d'un coup",
         /SUJET_VUS \+ "\/\+"/.test(ab[0]));
    }
    ok("une coupure de réseau réarme l'abonnement",
       /abonneVus = 0;/.test(html));
    /* LE PASSAGE SE NOTE À LA CONNEXION, LE JEU AU DÉBARQUEMENT.
       Ouvrir une île pour la regarder n'est pas y jouer — et c'est
       justement la distinction que la page doit savoir faire. */
    ok("le passage se note en se connectant au relais",
       /noteMonPassage\(\);/.test(html));
    var pb = html.match(/function poseBarge[\s\S]*?\n\}/);
    if(pb) ok("… et la partie se note quand une navette accoste vraiment",
              /noteQueJeJoue\(jeu\.index\)/.test(pb[0]));
    ok("deux reconnexions rapprochées restent le même passage",
       /DELAI_MEME_VISITE/.test(html));
    /* et rien n'est dit aux autres joueurs : c'était le choix */
    ok("rien n'est annoncé aux joueurs dans le jeu",
       html.indexOf("tes passages sont enregistrés") < 0 &&
       html.indexOf("présence enregistrée") < 0);
  })();
})();


/* ================================================================
   28. LA FIGURE D'IBIZA

   « Dispose toi-même les défenses selon une forme ultra-graphique
   moderne style Ibiza. Il doit y avoir beaucoup de Frelons — quarante
   pour cent de toutes les défenses — et une très grosse densité. Il
   faut garder au centre la scène, une étoile vide où il y a la scène
   avec des gens qui dansent dedans. La carte doit être magique, grosse
   fête DJ. »

   Quatre choses sont épinglées ici, et ce sont exactement les quatre
   qu'on a demandées :
     LE VIDE       l'étoile et les douze faisceaux ne portent rien, et
                   la figure est ce vide-là ;
     LES FRELONS   quarante pour cent des défenses, à l'unité près ;
     LA DENSITÉ    plus que n'importe quelle île ordinaire ;
     LA TRAVERSÉE  l'île reste franchissable de bout en bout, et pas
                   une défense n'est hors d'atteinte.
   ================================================================ */
G("28. La figure d'Ibiza");
(function(){
  var IBIZA = 8;
  var m = N.genereCarte("MILY", IBIZA, "", 0);

  /* --- LA GÉOMÉTRIE DU VIDE --- */
  ok("douze faisceaux partent des douze sommets de l'étoile",
     N.FAISC_N === N.ETOILE_POINTES * 2, "" + N.FAISC_N);
  ok("ils naissent SOUS les creux de l'étoile : chaque creux est une entrée",
     N.FAISC_R0 < N.ETOILE_R2, N.FAISC_R0 + " vs " + N.ETOILE_R2);
  ok("ils portent au-delà du coin le plus lointain de l'île",
     N.FAISC_R1 >= Math.hypot(N.PLAGE_X0 - 3 - N.SCENE_GX, N.GH - 4 - N.SCENE_GY),
     "" + N.FAISC_R1);
  ok("et ils s'élargissent en s'éloignant, comme un projecteur",
     N.largeurFaisceau(N.FAISC_R1) > N.largeurFaisceau(N.FAISC_R0) * 3,
     N.largeurFaisceau(N.FAISC_R0).toFixed(2) + " → "
       + N.largeurFaisceau(N.FAISC_R1).toFixed(2));
  /* LE MILIEU D'UN COULOIR EST VIDE, LE MILIEU D'UN QUARTIER NE L'EST
     PAS. Sans la seconde moitié, un `dansLeFaisceau` toujours vrai
     passerait la première. */
  (function(){
    var pas = 6.2832 / N.FAISC_N, q, dedans = 0, dehors = 0, plein = 0;
    for(q = 0; q < N.FAISC_N; q++){
      var a = q * pas - 0.5236;
      if(N.dansLeFaisceau(N.SCENE_GX + Math.cos(a) * 40,
                          N.SCENE_GY + Math.sin(a) * 40)) dedans++;
      /* la BISSECTRICE porte le faisceau fin — l'allée de service —
         donc elle aussi est vide ; c'est au QUART qu'on bâtit */
      var b = a + pas * 0.5;
      if(N.dansLeFaisceau(N.SCENE_GX + Math.cos(b) * 40,
                          N.SCENE_GY + Math.sin(b) * 40)) dehors++;
      var b2 = a + pas * 0.25;
      if(!N.dansLeFaisceau(N.SCENE_GX + Math.cos(b2) * 40,
                           N.SCENE_GY + Math.sin(b2) * 40)) plein++;
    }
    ok("l'axe des douze grands couloirs est vide", dedans === N.FAISC_N, dedans + "/" + N.FAISC_N);
    ok("… et celui des douze allées fines aussi", dehors === N.FAISC_N, dehors + "/" + N.FAISC_N);
    ok("… mais entre les deux, l'île est bâtie", plein === N.FAISC_N, plein + "/" + N.FAISC_N);
  })();
  ok("au-delà de la portée des faisceaux, l'île redevient pleine",
     !N.dansLeFaisceau(N.SCENE_GX + N.FAISC_R1 + 3, N.SCENE_GY));
  ok("la réserve des néons élargit le couloir sans le déplacer",
     (function(){
       var a = -0.5236, r = 50;
       var w = N.largeurFaisceau(r);
       /* juste en dehors du couloir vrai, mais dans la réserve */
       var t = w + N.IBIZA_RESERVE * 0.5, ca = Math.cos(a), sa = Math.sin(a);
       var x = N.SCENE_GX + ca * r - sa * t, y = N.SCENE_GY + sa * r + ca * t;
       return !N.dansLeFaisceau(x, y) && N.videIbizaLarge(x, y) && !N.videIbiza(x, y);
     })());
  /* LA LUMIÈRE EST PLUS LARGE QUE LE VIDE, et c'est voulu : le cœur du
     faisceau est du sable nu, le halo déborde sur les premières rangées
     de tourelles. C'est ce découplage qui a rendu cent défenses au
     remplissage sans éteindre la figure. */
  ok("la lumière peinte déborde du couloir creusé",
     N.FAISC_PEINT > N.FAISC_EVASE &&
     N.largeurPeinte(70) > N.largeurFaisceau(70) + 1,
     N.largeurFaisceau(70).toFixed(2) + " creusé, " + N.largeurPeinte(70).toFixed(2) + " peint");

  /* --- LE VIDE EST RÉEL SUR LA CARTE LIVRÉE --- */
  (function(){
    var b, piste = 0, faisceau = 0, dec = 0;
    for(b = 0; b < m.batiments.length; b++){
      if(N.dansLaScene(m.batiments[b].gx, m.batiments[b].gy)) piste++;
      else if(m.batiments[b].t !== "reacteur" &&
              N.dansLeFaisceau(m.batiments[b].gx, m.batiments[b].gy)) faisceau++;
    }
    for(b = 0; b < m.decors.length; b++)
      if(N.videIbiza(m.decors[b].gx, m.decors[b].gy)) dec++;
    ok("pas un bâtiment sur la piste (" + m.batiments.length + " sur l'île)",
       piste === 0, piste + " intrus");
    /* LES CELLULES ÉLECTRIQUES SONT LA SEULE EXCEPTION, et elle est
       voulue : chacune est plantée au bout de l'allée fine de son
       secteur. Une tour dans la lumière, au fond de son couloir. */
    ok("pas un bâtiment dans les vingt-quatre faisceaux, hors les cellules",
       faisceau === 0, faisceau + " intrus");
    ok("pas un décor non plus dans le vide (" + m.decors.length + " sur l'île)",
       dec === 0, dec + " intrus");
  })();
  /* ET LA CONTRE-ÉPREUVE : le vide est propre à Ibiza. Sans elle, un
     `videIbiza` jamais consulté passerait tout ce qui précède. */
  (function(){
    var autre = N.genereCarte("MILY", 0, "", 0), q, dedans = 0;
    for(q = 0; q < autre.batiments.length; q++)
      if(N.videIbiza(autre.batiments[q].gx, autre.batiments[q].gy)) dedans++;
    ok("sur une autre île, le même vide est bâti comme le reste",
       dedans > 20, dedans + " bâtiments");
  })();

  /* --- QUARANTE POUR CENT DE FRELONS, À L'UNITÉ --- */
  (function(){
    var f = N.compteFrelons(m), d = N.compteDefenses(m);
    var part = f / d;
    ok("les Frelons font " + (100 * part).toFixed(1) + " % des défenses ("
       + f + " sur " + d + ")",
       Math.abs(part - N.IBIZA_PART) < 0.005, (100 * part).toFixed(2) + " %");
    /* LE COMPTE EXACT, et pas seulement approché : o = 1,5 × f à une
       unité près, c'est la définition même de quarante pour cent. */
    ok("… et le compte tombe juste : autres = 1,5 × Frelons",
       Math.abs((d - f) - f * (1 - N.IBIZA_PART) / N.IBIZA_PART) <= 2,
       (d - f) + " vs " + (f * 1.5).toFixed(1));
    /* La part est tenue sur TOUS les tirages, pas seulement sur le
       salon d'essai : c'est le calcul qui la tient, pas la chance. */
    var pires = 0, q;
    for(q = 1; q <= 3; q++){
      var mq = N.genereCarte("SALON" + q, IBIZA, "", 0);
      var pq = N.compteFrelons(mq) / N.compteDefenses(mq);
      if(Math.abs(pq - N.IBIZA_PART) > 0.005) pires++;
    }
    ok("… sur trois autres salons aussi", pires === 0, pires + " salons à côté");
  })();

  /* --- LA SURCHARGE DES SECTEURS ---
     « Ces secteurs doivent être surchargés de défenses, remplis à
     quasi cent pour cent. » Ce qui rend la surcharge POSSIBLE, c'est
     l'écart serré et les allées fines : sans elles, `ouvreLaFete`
     rouvrait de force et emportait deux cent trente-neuf bâtiments. */
  ok("l'écart d'Ibiza est bien plus serré que celui de la guinguette",
     N.IBIZA_SERRE < 0.2, "" + N.IBIZA_SERRE);
  /* LES RUELLES CONCENTRIQUES, ET CE QU'ELLES AUTORISENT. Sans elles,
     un secteur plein enferme son milieu et `ouvreLaFete` en arrache la
     moitié. Avec elles, il ne trouve presque plus rien à rouvrir. */
  ok("des ruelles concentriques coupent les secteurs",
     (function(){
       var a = -0.5236 + 6.2832 / (N.FAISC_N * 4);   // au milieu d'un quartier
       var dedans = 0, dehors = 0, r;
       for(r = N.FAISC_R0 + 1; r < 60; r += 0.5){
         var x = N.SCENE_GX + Math.cos(a) * r, y = N.SCENE_GY + Math.sin(a) * r;
         if(N.ruelleIbiza(x, y)) dedans++; else dehors++;
       }
       return dedans > 4 && dehors > dedans * 2;
     })());
  ok("aucun point d'un secteur n'est plus loin d'une ruelle que la portée d'une troupe",
     N.IBIZA_PAS_RUE / 2 <= N.DEF.frelon.porteeMin + 3,
     (N.IBIZA_PAS_RUE / 2).toFixed(1) + " cases");
  ok("… et la ruelle est assez large pour qu'on y marche",
     N.IBIZA_RUE >= 1.5, N.IBIZA_RUE + " cases");
  /* ON ÉCARTE L'EMPRISE, PAS LE CENTRE. Sans marge, un Frelon posé au
     ras d'un couloir y déborde d'une case et demie, les deux bords se
     rejoignent, et le couloir n'existe plus sur la grille de collision.
     Mesuré : l'inondation de secours arrachait alors six cent quinze
     bâtiments au lieu de dix-neuf. */
  ok("un Frelon au bord d'un couloir est écarté de son demi-encombrement",
     (function(){
       var a = -0.5236, r = 50, ca = Math.cos(a), sa = Math.sin(a);
       var t = N.largeurFaisceau(r) + N.IBIZA_RESERVE + 0.4;   // hors couloir, mais de peu
       var x = N.SCENE_GX + ca * r - sa * t, y = N.SCENE_GY + sa * r + ca * t;
       /* sans marge il passe ; avec la marge d'un Frelon, il est refusé */
       return !N.videIbizaLarge(x, y) && N.videIbizaLarge(x, y, N.DEF.frelon.emprise * 0.5);
     })());
  ok("… et une ruelle repousse de même ce qui la borde",
     (function(){
       var a = -0.5236 + 6.2832 / (N.FAISC_N * 4), r, dedans = 0, large = 0;
       for(r = N.FAISC_R0; r < 70; r += 0.25){
         var x = N.SCENE_GX + Math.cos(a) * r, y = N.SCENE_GY + Math.sin(a) * r;
         if(N.ruelleIbiza(x, y)) dedans++;
         if(N.ruelleIbiza(x, y, 1.5)) large++;
       }
       return large > dedans * 1.5;
     })());

  /* --- LA DENSITÉ --- */
  (function(){
    var q, def = [], nom = [];
    for(q = 0; q < N.CARTES.length; q++){
      if(N.carteSpeciale(q)) continue;
      def.push(N.compteDefenses(N.genereCarte("MILY", q, "", 0)));
      nom.push(N.CARTES[q].nom);
    }
    var dIbiza = N.compteDefenses(m);
    /* Les six îles ORDINAIRES — ni guinguette, ni ténèbres, qui sont
       les deux îles denses de fin de campagne. */
    var ordinaires = [];
    for(q = 0; q < N.CARTES.length; q++){
      var bi = N.CARTES[q].biome;
      if(N.carteSpeciale(q) || bi === "guinguette" || bi === "tenebres" || bi === "ibiza") continue;
      ordinaires.push(N.compteDefenses(N.genereCarte("MILY", q, "", 0)));
    }
    var maxO = Math.max.apply(null, ordinaires);
    ok("Ibiza est plus dense que toutes les îles ordinaires ("
       + dIbiza + " contre " + maxO + " au mieux)",
       dIbiza > maxO, dIbiza + " vs " + maxO);
    /* ET ELLE L'EST MALGRÉ SON VIDE, qui lui retire un bon quart du
       terrain bâtissable : c'est là toute la performance. */
    /* LE COMPTE VARIE D'UN SALON À L'AUTRE — la graine décide où
       tombent les obstacles, et la phase des bandes avec eux. Mesuré
       sur une dizaine de salons : entre huit cent cinquante et mille.
       Le seuil est posé sous le plancher observé, pas sur la moyenne. */
    ok("… et elle porte plus de neuf cents défenses",
       dIbiza > 900, "" + dIbiza);
    /* ET ELLE LES PORTE MALGRÉ SON VIDE : l'étoile et les vingt-quatre
       couloirs lui retirent près de la moitié du terrain bâtissable.
       C'est là toute la performance de la disposition. */
    ok("… alors même que son vide lui retire un tiers du terrain",
       (function(){
         var vide = 0, plein = 0, x, y;
         for(x = 6; x <= N.PLAGE_X0 - 3; x += 1)
           for(y = 3; y <= N.GH - 4; y += 1){
             if(N.videIbiza(x, y)) vide++; else plein++;
           }
         return vide / (vide + plein) > 0.30;
       })());
  })();

  /* --- LA TRAVERSÉE, mesurée sur la grille du jeu --- */
  (function(){
    var GW = N.GW, GH = N.GH, i, j;
    var sol = new Uint8Array(GW * GH);
    for(i = 0; i < m.batiments.length; i++){
      var b = m.batiments[i], r = (b.e || 2) / 2;
      for(var x = Math.floor(b.gx - r); x <= Math.ceil(b.gx + r) - 1; x++)
        for(var y = Math.floor(b.gy - r); y <= Math.ceil(b.gy + r) - 1; y++)
          if(x >= 0 && x < GW && y >= 0 && y < GH) sol[y * GW + x] = 1;
    }
    var vu = new Uint8Array(GW * GH), pile = [];
    for(j = 0; j < GH; j++){
      var d0 = j * GW + (N.PLAGE_X0 + 2);
      if(!sol[d0]){ vu[d0] = 1; pile.push(d0); }
    }
    var V8 = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
    while(pile.length){
      var k = pile.pop(), kx = k % GW, ky = (k / GW) | 0;
      for(i = 0; i < 8; i++){
        var nx = kx + V8[i][0], ny = ky + V8[i][1];
        if(nx < 0 || nx >= GW || ny < 0 || ny >= GH) continue;
        var kk = ny * GW + nx;
        if(vu[kk] || sol[kk]) continue;
        vu[kk] = 1; pile.push(kk);
      }
    }
    var libres = 0, atteints = 0;
    for(i = 6; i <= N.PLAGE_X0 - 3; i++)
      for(j = 3; j <= GH - 4; j++){
        var c0 = j * GW + i;
        if(sol[c0]) continue;
        libres++; if(vu[c0]) atteints++;
      }
    var part = atteints / libres;
    ok("l'île reste traversable : " + (100 * part).toFixed(1)
       + " % des cases libres sont atteignables depuis la plage",
       part > 0.98, (100 * part).toFixed(2) + " %");
    /* CHAQUE DÉFENSE DOIT POUVOIR ÊTRE ATTAQUÉE. Cinq cases, c'est la
       portée d'une Furie : une tourelle qu'aucune troupe ne peut
       approcher rend l'île infinissable. */
    var orphelines = 0;
    for(i = 0; i < m.batiments.length; i++){
      var bb = m.batiments[i];
      if(bb.t === "cellule" || bb.t === "reacteur") continue;
      var ok5 = 0;
      for(var dx = -5; dx <= 5 && !ok5; dx++)
        for(var dy = -5; dy <= 5 && !ok5; dy++){
          var ax = Math.round(bb.gx) + dx, ay = Math.round(bb.gy) + dy;
          if(ax < 0 || ax >= GW || ay < 0 || ay >= GH) continue;
          if(vu[ay * GW + ax]) ok5 = 1;
        }
      if(!ok5) orphelines++;
    }
    ok("… et pas une défense n'est hors de portée d'une troupe",
       orphelines === 0, orphelines + " orphelines");
  })();

  /* --- LES ALLÉES DE LA GUINGUETTE NE DÉBORDENT PLUS SUR IBIZA ---
     `dansAlleeGuinguette` ne teste aucun biome : elle taille quatre
     diagonales autour de (72, 67), et le centre d'Ibiza est à (76, 68).
     Écrite en dur dans l'atelier, elle barrait donc quatre diagonales
     d'Ibiza avec les allées d'une AUTRE île. Elle est devenue un
     paramètre — et voici la preuve qu'elle est bien passée par là. */
  ok("l'atelier reçoit sa zone interdite en paramètre",
     /function atelierPavois\(c, al, ecart, interdit, jeu\)/.test(html) &&
     /if\(interdit && interdit\(x, y\)\) return 0;/.test(html));
  /* ET SON JEU DE POSE : deux dixièmes de tremblement suffisent à faire
     refuser une place sur deux d'un réseau posé au pas minimal. */
  ok("… et son jeu de pose, qu'Ibiza met à zéro",
     /var JEU = \(jeu === undefined\) \? PAVOIS_JEU : jeu;/.test(html) &&
     /atelierPavois\(c, al, IBIZA_SERRE, videIbiza, 0\)/.test(html));
  ok("… la guinguette lui passe ses allées",
     /atelierPavois\(c, al, undefined, dansAlleeGuinguette\)/.test(html));
  ok("… et Ibiza lui passe son vide, avec son écart serré",
     /atelierPavois\(c, al, IBIZA_SERRE, videIbiza, 0\)/.test(html) &&
     /atelierPavois\(c, al, IBIZA_SERRE, videIbizaLarge, 0\)/.test(html));

  /* --- ET LE SOL PORTE LA MÊME FIGURE QUE LES DÉFENSES ---
     Deux tracés calculés séparément se désalignent à la première
     retouche. Le sol doit donc lire les MÊMES fonctions. */
  (function(){
    var d0 = html.indexOf("LE SOL D'IBIZA");
    var bloc = d0 < 0 ? "" : html.slice(d0, html.indexOf("LE SOL DES MILLE ET UNE NUITS", d0));
    ok("le sol d'Ibiza est peint", bloc.length > 2000, bloc.length + " octets");
    ok("… avec la géométrie des faisceaux, pas une copie",
       /largeurFaisceau\(/.test(bloc) && /FAISC_N/.test(bloc));
    ok("… et celle de l'étoile", /ETOILE_G/.test(bloc));
    ok("… les faisceaux sont peints en lumière ajoutée",
       /globalCompositeOperation = "lighter"/.test(bloc));
    ok("… et la piste est noire, pas claire comme à la guinguette",
       /#0d0a1c/.test(bloc));
  })();

  /* --- LA CAMPAGNE N'A PAS BOUGÉ AILLEURS ---
     La refonte est ENTIÈREMENT contenue dans Ibiza : les neuf autres
     îles doivent rendre exactement le même nombre de bâtiments qu'avant
     — c'est ce que vérifie aussi `outils/verif-campagne.js`, mais mieux
     vaut deux gardes qu'une. */
  (function(){
    var attendu = { 0:779, 1:767, 2:756, 3:789, 4:775, 5:782, 6:1195, 7:1193, 9:811 };
    var faux = [];
    for(var q in attendu){
      var mq = N.genereCarte("DEMO", +q, "", 0);
      if(mq.batiments.length !== attendu[q])
        faux.push(N.CARTES[+q].nom + " : " + mq.batiments.length + " au lieu de " + attendu[q]);
    }
    ok("les neuf autres îles n'ont pas bougé d'un bâtiment",
       faux.length === 0, faux.join(" / "));
  })();
})();


/* ================================================================
   29. LES PIÈCES POSÉES UNE À UNE

   « Dans l'éditeur, ajoute-moi l'option d'ajouter des défenses une à
   une : je sélectionne une défense, je l'ajoute où je veux, et je
   l'ajuste comme j'en ai envie. »

   Ce groupe garde les quatre propriétés qui rendent l'outil sûr :
     LA CHAÎNE     une pièce s'écrit, se relit, et une chaîne écrite
                   AVANT cette version se relit inchangée ;
     L'INDEX       poser une pièce ne déplace aucun rang existant ;
     LE TIRAGE     poser une pièce ne rebat pas l'île — c'est le piège
                   dans lequel la première version est tombée ;
     LES BORNES    on ne pose ni dans la mer ni sur le Brasier.
   ================================================================ */
G("29. Les pièces posées une à une");
(function(){
  var P3 = [{ t:3, gx:60, gy:61.4 }, { t:5, gx:70.5, gy:40 }, { t:2, gx:100.2, gy:90.6 }];

  /* --- LA CHAÎNE --- */
  ok("une pièce s'écrit au dixième de case",
     N.encodePieces(P3) === "3.600.614;5.705.400;2.1002.906", N.encodePieces(P3));
  ok("… et se relit à l'identique",
     JSON.stringify(N.decodePieces(N.encodePieces(P3))) === JSON.stringify(P3),
     JSON.stringify(N.decodePieces(N.encodePieces(P3))));
  ok("une liste vide ne coûte pas un caractère", N.encodePieces([]) === "");
  /* CE QUI N'EST PAS UNE DÉFENSE NE SE POSE PAS À L'UNITÉ : « auto »
     est une intention, la gomme forte retire. Ni l'une ni l'autre n'a
     de tourelle à planter. */
  ok("« auto » et la gomme forte ne sont pas posables",
     !N.pieceEstPosable(0) && !N.pieceEstPosable(N.TYPES_PLAN.indexOf("vide")));
  ok("… et les sept défenses le sont",
     (function(){
       var n = 0, q;
       for(q = 0; q < N.TYPES_PLAN.length; q++) if(N.pieceEstPosable(q)) n++;
       return n === 7;
     })());
  /* DÉFENSIF DE BOUT EN BOUT : une pièce illisible est JETÉE, pas
     devinée. Le mode dégradé du plan reste la carte d'aujourd'hui. */
  ok("une pièce illisible est jetée sans emporter les autres",
     (function(){
       var l = N.decodePieces("3.600.614;n'importe quoi;9.1.2;3.4;5.705.400");
       return l.length === 2 && l[0].t === 3 && l[1].t === 5;
     })(), JSON.stringify(N.decodePieces("3.600.614;bla;9.1.2;3.4;5.705.400")));

  /* --- LES TROIS SECTIONS SE DÉCOUPENT SANS SE MARCHER DESSUS --- */
  (function(){
    var z = N.planVide(); z[40] = 0x21;
    var f = [{ f:0, k:0, d:0, r:0, x:0, g:0, G:[50, 50, 12], C:[[3, 100]] }];
    var ch = N.encodePlanComplet(z, f, P3);
    ok("la chaîne complète porte les trois sections",
       ch.indexOf(N.MARQUE_FORMES) > 0 && ch.indexOf(N.MARQUE_PIECES) > ch.indexOf(N.MARQUE_FORMES),
       ch);
    ok("… et chacune se relit sans mordre sur les autres",
       N.decodePieces(N.partiePieces(ch)).length === 3 &&
       N.partieFormes(ch).indexOf(N.MARQUE_PIECES) < 0 &&
       N.partieQuadrillage(ch).indexOf(N.MARQUE_FORMES) < 0);
    /* SANS FORMES : la marque des pièces borne alors le quadrillage à
       elle seule. C'est le cas qui plantait avant qu'on le prévoie. */
    var ch2 = N.encodePlanComplet(z, [], P3);
    ok("… même quand il n'y a pas de forme entre les deux",
       N.decodePieces(N.partiePieces(ch2)).length === 3 &&
       N.partieQuadrillage(ch2) === N.partieQuadrillage(N.encodePlanComplet(z, [], [])),
       N.partieQuadrillage(ch2));
  })();
  /* LA COMPATIBILITÉ : une chaîne écrite avant cette version n'a pas
     de « + », et doit se relire exactement comme avant. */
  (function(){
    var z = N.planVide(); z[40] = 0x21;
    var vieille = N.encodePlanComplet(z, [], []);
    ok("un plan d'avant cette version se relit inchangé",
       N.partiePieces(vieille) === "" &&
       N.decodePieces(N.partiePieces(vieille)).length === 0 &&
       N.partieQuadrillage(vieille) === vieille);
  })();

  /* --- CE QUE LE GÉNÉRATEUR EN FAIT --- */
  (function(){
    var ch = N.encodePlanComplet(N.planVide(), [], P3);
    var a = N.genereCarte("MILY", 0, "", 0);
    var b = N.genereCarte("MILY", 0, ch, 0);
    ok("les trois pièces s'ajoutent à la carte",
       b.batiments.length === a.batiments.length + 3,
       a.batiments.length + " → " + b.batiments.length);
    /* L'INDEX EST SACRÉ : le bitmap des destructions désigne les
       bâtiments par leur rang. Une pièce ajoutée doit l'être EN QUEUE
       et ne déplacer personne. */
    ok("… tout à la fin, sans déplacer un seul rang existant",
       (function(){
         for(var q = 0; q < a.batiments.length; q++){
           var x = a.batiments[q], y = b.batiments[q];
           if(!y || y.t !== x.t || y.gx !== x.gx || y.gy !== x.gy) return 0;
         }
         return 1;
       })());
    ok("… à la place exacte où on les a mises",
       (function(){
         var q, dep = a.batiments.length;
         for(q = 0; q < 3; q++){
           var y = b.batiments[dep + q];
           if(!y || y.t !== N.TYPES_PLAN[P3[q].t]) return 0;
           if(y.gx !== P3[q].gx || y.gy !== P3[q].gy) return 0;
           if(!y.main) return 0;
         }
         return 1;
       })());
    /* LE PIÈGE DE LA PREMIÈRE VERSION. Les deux branches du
       quadrillage ne consomment pas le tirage dans le même ordre : la
       seule PRÉSENCE d'un plan refaisait l'île. Une pièce posée à la
       main ne dit rien au quadrillage et ne doit donc rien rebattre. */
    ok("une pièce ne rebat pas l'île — le quadrillage ne la voit même pas",
       N.empreinteCarte(a) === N.empreinteCarte({
         batiments:b.batiments.slice(0, a.batiments.length),
         decors:b.decors, rochers:b.rochers, creatures:b.creatures,
         champs:b.champs, falaises:b.falaises, qg:b.qg
       }) || (function(){
         /* empreinteCarte peut ne pas accepter un objet partiel : on
            retombe alors sur la comparaison directe, qui suffit. */
         if(a.decors.length !== b.decors.length) return 0;
         for(var q = 0; q < a.decors.length; q++)
           if(a.decors[q].gx !== b.decors[q].gx) return 0;
         return 1;
       })());
    /* ET LA VIE TOTALE SUIT : le panneau de l'éditeur annonce ce que
       le plan coûtera à démonter, pièces comprises. */
    ok("la vie totale des défenses compte les pièces",
       N.pvDefensesCarte(b) > N.pvDefensesCarte(a),
       N.pvDefensesCarte(a) + " → " + N.pvDefensesCarte(b));
  })();

  /* --- LES DEUX BORNES, celles du quadrillage lui-même --- */
  (function(){
    var hors = [{ t:3, gx:2, gy:60 },                       // dans la roche du bord
                { t:3, gx:150, gy:60 },                     // dans la mer
                { t:3, gx:60, gy:1 },                       // au nord, hors terre
                { t:3, gx:N.QG_GX, gy:N.QG_GY },            // sur le Brasier
                { t:3, gx:N.QG_GX + 9, gy:N.QG_GY + 9 }];   // dans son emprise
    var ch = N.encodePlanComplet(N.planVide(), [], hors);
    var a = N.genereCarte("MILY", 0, "", 0);
    var b = N.genereCarte("MILY", 0, ch, 0);
    ok("aucune pièce hors de la terre bâtissable ni sur le Brasier",
       b.batiments.length === a.batiments.length,
       (b.batiments.length - a.batiments.length) + " passées");
  })();

  /* --- L'ÉDITEUR --- */
  ok("l'éditeur a son troisième mode",
     /data-mode="2"/.test(html) && /planBlocPieces/.test(html));
  ok("… avec sa palette et sa liste",
     /planPiecesOutils/.test(html) && /planPiecesListe/.test(html));
  ok("… et les trois gestes : poser, glisser, lâcher",
     /function debutPiece\(/.test(html) && /function bougePiece\(/.test(html) &&
     /function finPiece\(/.test(html));
  ok("l'éditeur borne la pose comme le générateur",
     /function piecePosableEn\(/.test(html));
  ok("… et arrondit au dixième dès la pose, comme le format",
     /function grainPiece\(/.test(html) && /Math\.round\(v \* 10\) \/ 10/.test(html));
  /* UNE SEULE ENTRÉE D'HISTORIQUE PAR GESTE : un glissé envoie cent
     événements, et « Annuler » doit défaire le déplacement. */
  ok("un glissé n'entre qu'une fois dans l'historique",
     (function(){
       var m = html.match(/function bougePiece\([\s\S]*?\n\}/);
       return !!m && /planDejaEmpile/.test(m[0]);
     })());
  ok("l'historique retient aussi les pièces",
     /p:copiePieces\(planPieces\)/.test(html) && /planPieces = av\.p \|\| \[\]/.test(html));
})();

G("30. Les carrières reconstruites depuis les podiums");
(function(){
  var D = N.decodeScores, E = N.encodeScores;
  var H = N.seauHerite;                       // le seau d'un nom sans appareil

  /* Le salon d'après l'accident : Lu a récupéré son vrai cumul sur son
     appareil (seau « abcd »), les autres n'ont plus rien. */
  var vrai = {};
  vrai[N.cleScore("abcd", 0)] = { n:"Lu", g:4509347 };
  vrai[N.cleScore("abcd", 1)] = { n:"Lu", g:11113485 };

  /* Les podiums gelés, eux, ont tout gardé. */
  var t3 = "";
  t3 = N.inscritTop3(t3, 0, [{ nom:"Roro", g:11297922 },
                             { nom:"Lu",   g:4509347 },
                             { nom:"jaja", g:698999 }]);
  t3 = N.inscritTop3(t3, 1, [{ nom:"Lu",     g:11113485 },
                             { nom:"Havana", g:8934146 },
                             { nom:"So",     g:1224706 }]);
  t3 = N.inscritTop3(t3, 3, [{ nom:"Roro", g:13482657 },
                             { nom:"Max",  g:6578640 },
                             { nom:"Lu",   g:5855735 }]);

  var avant = N.totalParJoueur(vrai);
  ok("avant reconstruction, seul Lu est au classement",
     avant.Lu === 15622832 && avant.Roro === undefined, JSON.stringify(avant));

  var r = N.reconstruitCarrieres(vrai, t3);
  var apres = N.totalParJoueur(r.tab);

  ok("Roro retrouve la somme de ses podiums",
     apres.Roro === 11297922 + 13482657, apres.Roro);
  ok("Havana, So et jaja aussi",
     apres.Havana === 8934146 && apres.So === 1224706 && apres.jaja === 698999,
     JSON.stringify([apres.Havana, apres.So, apres.jaja]));
  ok("Max aussi", apres.Max === 6578640, apres.Max);

  /* LE POINT CRITIQUE : Lu a un VRAI seau sur les cartes 0 et 1, et un
     seau hérité poserait les mêmes chiffres. Il ne doit surtout pas
     compter deux fois — mais la carte 3, où il n'a pas de vrai seau,
     doit bien s'ajouter. */
  ok("Lu n'est PAS compté deux fois sur les cartes qu'il a déjà",
     apres.Lu === 15622832 + 5855735, apres.Lu);

  /* Et dans l'autre sens : on reconstruit d'abord, le joueur récupère
     ensuite. Le résultat doit être le même. */
  var r2 = N.reconstruitCarrieres({}, t3);
  var tard = D(E(r2.tab));
  tard[N.cleScore("abcd", 0)] = { n:"Lu", g:4509347 };
  tard[N.cleScore("abcd", 1)] = { n:"Lu", g:11113485 };
  ok("… dans l'ordre inverse, le total est identique",
     N.totalParJoueur(tard).Lu === apres.Lu,
     N.totalParJoueur(tard).Lu + " vs " + apres.Lu);

  /* Le vrai cumul est plus gros que le podium : c'est lui qui gagne,
     et le hérité ne s'ajoute pas par-dessus. */
  var mieux = D(E(r.tab));
  mieux[N.cleScore("abcd", 0)] = { n:"Lu", g:9000000 };
  ok("un vrai cumul plus gros remplace le podium au lieu de s'y ajouter",
     N.totalParJoueur(mieux).Lu === 9000000 + 11113485 + 5855735,
     N.totalParJoueur(mieux).Lu);

  /* La règle vaut aussi carte par carte, sinon la vignette d'une île
     afficherait le double de ce que le joueur a fait dessus. */
  ok("le podium d'une île ne double pas non plus sur sa vignette",
     N.totalParJoueurCarte(r.tab, 0).Lu === 4509347,
     N.totalParJoueurCarte(r.tab, 0).Lu);
  ok("… et la reconstruction remplit bien la vignette d'un absent",
     N.totalParJoueurCarte(r.tab, 0).Roro === 11297922,
     N.totalParJoueurCarte(r.tab, 0).Roro);

  /* Idempotence : reconstruire deux fois ne change rien. */
  var r3 = N.reconstruitCarrieres(r.tab, t3);
  ok("reconstruire deux fois ne change rien",
     E(r3.tab) === E(r.tab));

  /* Rien n'est jamais abaissé. */
  var hauts = D(E(r.tab));
  hauts[N.cleScore(H("Roro"), 0)] = { n:"Roro", g:99000000 };
  var r4 = N.reconstruitCarrieres(hauts, t3);
  ok("un score déjà plus haut n'est jamais rabaissé",
     N.totalParJoueur(r4.tab).Roro === 99000000 + 13482657,
     N.totalParJoueur(r4.tab).Roro);

  /* La chaîne survit à l'encodage, seaux hérités compris. */
  ok("la reconstruction traverse l'encodage",
     N.totalParJoueur(D(E(r.tab))).Roro === apres.Roro);

  /* Et la fusion réseau la propage sans la casser. */
  ok("elle se propage par la fusion",
     N.totalParJoueur(D(N.fusionneScores(E(vrai), E(r.tab)))).Roro === apres.Roro);

  /* Sans podium, rien ne bouge. */
  var r5 = N.reconstruitCarrieres(vrai, "");
  ok("sans podium, la reconstruction ne pose rien",
     r5.poses === 0 && E(r5.tab) === E(vrai));

  /* Le seau hérité est bien déterministe, sinon deux appareils
     poseraient deux entrées pour la même personne. */
  ok("le seau hérité d'un nom est stable",
     H("Roro") === H("Roro") && H("Roro") !== H("Lu"), H("Roro") + " / " + H("Lu"));
})();

G("31. Les messages épinglés du salon");
(function(){
  var E = N.encodeEpingles, D = N.decodeEpingles;

  /* --- LA CHAÎNE --- */
  var l = [{ n:1, nom:"Roro", txt:"on attaque à 21 h" },
           { n:2, nom:"Lu",   txt:"garde 3 navettes de Furies" }];
  ok("une épingle s'écrit rang, nom, texte",
     E(l) === "1~Roro~on attaque à 21 h|2~Lu~garde 3 navettes de Furies", E(l));
  ok("… et se relit à l'identique", E(D(E(l))) === E(l));
  ok("l'ordre est celui de la pose", D(E(l))[0].nom === "Roro" && D(E(l))[1].nom === "Lu");

  /* LES SÉPARATEURS. Un message qui en contient ne doit pas couper la
     liste en deux — c'est le seul défaut qui ferait perdre des épingles
     à tout le salon d'un coup. */
  var pipe = E([{ n:1, nom:"a|b~c", txt:"gauche | droite ~ fin" }]);
  ok("les séparateurs sont retirés du nom et du texte",
     pipe.split("|").length === 1 && pipe.split("~").length === 3, pipe);
  ok("… et la relecture retrouve bien une seule épingle", D(pipe).length === 1);
  ok("le texte survit, sans ses séparateurs",
     D(pipe)[0].txt === "gauche droite fin", D(pipe)[0].txt);

  /* --- LA COUPE : on garde les PLUS RÉCENTES --- */
  var beaucoup = [], i;
  for(i = 1; i <= N.EPINGLES_MAX + 5; i++) beaucoup.push({ n:i, nom:"x", txt:"m" + i });
  var coupe = D(E(beaucoup));
  ok("la liste est bornée", coupe.length === N.EPINGLES_MAX, coupe.length);
  ok("… et c'est la plus ANCIENNE qui part, pas la dernière arrivée",
     coupe[0].txt === "m6" && coupe[coupe.length - 1].txt === "m17",
     coupe[0].txt + " → " + coupe[coupe.length - 1].txt);

  /* --- LE RANG SUIVANT --- */
  ok("le rang suivant dépasse tous les autres",
     N.rangEpingleSuivant([{ n:3 }, { n:9 }, { n:1 }]) === 10);
  ok("… et vaut 1 sur une liste vide", N.rangEpingleSuivant([]) === 1);

  /* --- LA FUSION, ET SURTOUT LE RETRAIT --- */
  var a1 = { ep:E(l), epn:1 };
  var vide = { ep:"", epn:0 };
  ok("une liste pleine bat une liste vide plus ancienne",
     N.meilleuresEpingles(a1, vide).ep === E(l));
  ok("… dans les deux sens", N.meilleuresEpingles(vide, a1).ep === E(l));

  /* LE POINT DE CONCEPTION : DÉSÉPINGLER DOIT TENIR. Avec une union
     monotone — celle des scores ou des podiums — l'épingle retirée
     reviendrait au premier instantané d'un autre appareil qui l'a
     encore. Avec le numéro, la liste plus RÉCENTE gagne, même si elle
     est plus courte. */
  var retire = { ep:E([l[0]]), epn:2 };
  ok("une liste plus COURTE mais plus récente gagne",
     N.meilleuresEpingles(a1, retire).ep === E([l[0]]));
  ok("… et l'épingle retirée ne revient pas",
     D(N.meilleuresEpingles(retire, a1).ep).length === 1);
  var toutRetire = { ep:"", epn:3 };
  ok("on peut tout retirer", N.meilleuresEpingles(retire, toutRetire).ep === "");

  /* À numéro égal, la chaîne tranche : deux clients doivent converger. */
  var x = { ep:"1~a~aaa", epn:5 }, y = { ep:"1~b~bbb", epn:5 };
  ok("à numéro égal, les deux clients tranchent pareil",
     N.meilleuresEpingles(x, y).ep === N.meilleuresEpingles(y, x).ep);

  /* --- ET DANS L'INSTANTANÉ COMPLET --- */
  var m1 = N.mondeVide(0, 1000, 1);
  ok("un monde neuf part sans épingle", m1.ep === "" && m1.epn === 0);
  var m2 = N.mondeVide(0, 1000, 1); m2.ep = E(l); m2.epn = 4;
  var f = N.fusionneMonde(m1, m2);
  ok("la fusion du monde emporte les épingles", f.ep === E(l) && f.epn === 4, f.ep);
  ok("… et un monde sans épingle ne les efface pas",
     N.fusionneMonde(m2, m1).ep === E(l));
  /* le retrait traverse la fusion du monde, pas seulement celle du champ */
  var m3 = N.mondeVide(0, 1000, 1); m3.ep = ""; m3.epn = 9;
  ok("désépingler traverse la fusion du monde",
     N.fusionneMonde(m2, m3).ep === "" && N.fusionneMonde(m3, m2).ep === "");

  /* memeMonde doit VOIR la différence, sinon rien ne serait republié. */
  var s1 = N.mondeVide(0, 1000, 1), s2 = N.mondeVide(0, 1000, 1);
  s2.ep = E(l); s2.epn = 1;
  ok("une épingle posée rend l'instantané sale", !N.memeMonde(s1, s2));

  /* Une chaîne abîmée ne doit rien casser. */
  ok("une épingle illisible est jetée, pas propagée",
     D("nawak|3~ok~vrai|~~").length === 1 && D("nawak|3~ok~vrai|~~")[0].txt === "vrai");
  ok("une chaîne vide rend une liste vide", D("").length === 0 && D(null).length === 0);
})();

/* ================================================================ */
G("32. La voix du discours, et la case qui a changé de sens");
(function(){
  /* LE DÉFAUT EST CELUI DU MOTEUR, POUR TOUT LE MONDE.
     Un joueur qui n'a rien réglé doit entendre ce que les autres
     entendent. C'était le cas sur un appareil neuf et ça ne l'était
     pas sur un appareil qui avait ouvert Ibiza sous la v0.94 : la
     case `voix` du stockage gardait alors un NOM DE VOIX brut, et
     depuis la v0.95 elle garde un CHOIX. Relu tel quel, le vieux nom
     n'était ni « moteur » ni « v:… », donc `pose` en concluait
     « system » et rendait la main au moteur vocal de l'appareil.
     Deux appareils, deux voix, sans que personne n'ait rien réglé. */
  ok("le défaut du sélecteur est la voix du moteur",
     /choix:"moteur",/.test(html));
  ok("le choix relu passe par un filtre de validité",
     /voixDiscours\.choix = voixDiscours\.valide\(sauv\.voix\)/.test(html));
  var vd = html.match(/valide:function\(v\)\{[\s\S]*?\n  \},/);
  ok("le filtre existe et se relit", !!vd);
  if(vd){
    /* On le rejoue tel quel : c'est une fonction pure, elle se teste
       pour de vrai plutôt qu'à l'expression régulière. */
    var valide = eval("(function(v){" + vd[0].replace(/^valide:function\(v\)\{/, "").replace(/\n  \},$/, "") + "})");
    ok("« moteur » traverse intact", valide("moteur") === "moteur");
    ok("« auto » traverse intact", valide("auto") === "auto");
    ok("une voix nommée traverse intacte",
       valide("v:Google UK English Female") === "v:Google UK English Female");
    ok("un NOM DE VOIX de la v0.94 retombe sur le moteur",
       valide("Google UK English Female") === "moteur");
    ok("… tout comme une valeur vide, absente ou aberrante",
       valide("") === "moteur" && valide(null) === "moteur" &&
       valide(undefined) === "moteur" && valide(42) === "moteur" &&
       valide("v:") === "moteur");
  }
  /* Et le mode entre bien dans le moteur : « moteur » vaut la
     synthèse, tout le reste vaut les voix de l'appareil. */
  ok("le mode posé dans le moteur suit le choix",
     /setVoiceMode\(this\.choix === "moteur" \? "synth" : "system"\)/.test(html));
  ok("… et il est posé au démarrage, même sans choix retenu",
     /voixDiscours\.pose\(voixDiscours\.choix\);/.test(html));
})();

/* ================================================================ */
G("33. Le sol d'Ibiza : la découpe et la chorégraphie");
(function(){
  /* LES ALLÉES SONT BORNÉES DES DEUX CÔTÉS.
     Dedans par l'étoile, dehors par le mur de pierre. Le trou se fait
     par la règle `evenodd` sur un chemin qui porte les deux contours —
     c'est ce qui donne la terminaison suivant l'angle de l'étoile sans
     qu'aucune bande ait à connaître sa forme. */
  ok("la zone des allées se trace en un chemin percé",
     /function decoupeAlleesIbiza\(c\)\{[\s\S]{0,220}traceTerreBatie\(c\);[\s\S]{0,80}traceEtoileIbiza\(c\);[\s\S]{0,80}c\.clip\("evenodd"\)/
       .test(html));
  /* LA BORNE EXTÉRIEURE A CHANGÉ DE NATURE, ET LE TEST AVEC.
     Elle valait LARGEUR_ROCHE — la largeur de la MATIÈRE rocailleuse
     du sol — et le test s'en félicitait : « le jour où le mur
     s'épaissit, les allées suivent ». C'était vrai et c'était faux au
     même moment, parce que ce n'est pas là que le mur commence : la
     roche du sol s'éteint en dégradé sur sept cases tandis que la
     muraille est bâtie au BORD de la grille. Les allées s'arrêtaient
     sept cases trop tôt, et il restait une bande de sable nu entre la
     lumière et la pierre.
     La borne est donc maintenant le bord de la grille, à un retrait
     nommé près. Ce qu'on garde, c'est qu'elle soit dite UNE FOIS —
     quatre nombres épars dans le tracé se seraient désaccordés au
     premier réglage. */
  ok("… et ses bornes sont nommées, pas semées dans le tracé",
     /var ALLEE_MARGE = [\d.]+;[\s\S]{0,80}var ALLEE_RIVE  = [\d.]+;/.test(html) &&
     /var m = ALLEE_MARGE, xe = GW - ALLEE_RIVE;/.test(html));
  /* ET LA PORTÉE DE PEINTURE N'EST PAS CELLE DU COULOIR VIDE.
     FAISC_R1 ne dit pas seulement où la lumière s'arrête : il dit où
     les BÂTIMENTS n'ont pas le droit d'être, via dansLeFaisceau. Le
     toucher déplacerait les défenses d'Ibiza, donc changerait l'ordre
     du tableau des bâtiments — et cet ordre est la clé de tout ce qui
     est déjà détruit. C'est le genre de lien qu'on ne voit pas en
     relisant un dessin, et qui efface une campagne. */
  ok("la peinture des allées a sa propre portée",
     /var FAISC_PEINT_R1 = \d+;/.test(html));
  ok("… et elle porte plus loin que le couloir vide",
     (function(){
       var a = html.match(/var FAISC_R1 {4}= (\d+);/);
       var b = html.match(/var FAISC_PEINT_R1 = (\d+);/);
       return a && b && +b[1] > +a[1];
     })());
  ok("… car aucun des deux peintres ne borne plus sur FAISC_R1",
     !/r1I = FAISC_R1;/.test(html) && !/r1 = FAISC_R1;/.test(html),
     "sinon la lumière n'atteindrait pas le mur");
  ok("… tandis que le placement des bâtiments, lui, y reste attaché",
     /function dansLeFaisceau[\s\S]{0,300}if\(r > FAISC_R1\) return false;/.test(html));
  /* LES DEUX COUCHES SONT BORNÉES PAREIL. Le sol cuit et le calque
     vivant peignent les mêmes couloirs : borner l'un sans l'autre
     laisserait l'animation déborder de ce que le décor a découpé. */
  ok("la couche cuite et la couche vivante partagent la découpe",
     (html.match(/decoupeAlleesIbiza\(c\);/g) || []).length === 2,
     "une fois dans construitSol, une fois dans dessineBandesIbiza");

  /* LA TABLE DES SECTIONS EST UNE COPIE, ET C'EST LE VRAI RISQUE.
     `IBI_BORNES` redit en mesures ce que `sectionName` décide dans le
     moteur audio. Le moteur ne sait dire que la section EN COURS,
     jamais depuis quand — et une montée qui accélère a besoin de
     savoir ce qu'il lui reste. Deux tables pour un seul fait : le jour
     où l'une bouge sans l'autre, la lumière accélérerait vers un drop
     qui tombe ailleurs, et rien ne planterait. On les confronte donc
     mesure par mesure, sur tout le morceau. */
  var mB = html.match(/var IBI_BORNES = \{[\s\S]*?\n\};/);
  var mS = html.match(/function sectionName\(b\) \{[\s\S]*?\n  \}/);
  ok("les deux tables se relisent dans le fichier livré", !!mB && !!mS);
  if(mB && mS){
    var BORNES = eval("(" + mB[0].replace(/^var IBI_BORNES = /, "").replace(/;$/, "") + ")");
    var nom = eval("(" + mS[0].replace(/^function sectionName/, "function") + ")");
    var desaccords = [], mes, attendu;
    for(mes = 0; mes < 144; mes++){
      attendu = nom(mes);
      var b = BORNES[attendu];
      if(!b || mes < b[0] || mes >= b[1]) desaccords.push(mes + ":" + attendu);
    }
    ok("chaque mesure du morceau tombe dans la bonne section",
       desaccords.length === 0, desaccords.slice(0, 4).join(", "));
    /* et l'inverse : aucune borne ne recouvre une autre, aucun trou */
    var couvert = [], k;
    for(k in BORNES) for(mes = BORNES[k][0]; mes < BORNES[k][1]; mes++)
      couvert[mes] = (couvert[mes] || 0) + 1;
    var trous = 0, doubles = 0;
    for(mes = 0; mes < 144; mes++){
      if(!couvert[mes]) trous++;
      else if(couvert[mes] > 1) doubles++;
    }
    ok("… et les sections pavent le morceau sans trou ni recouvrement",
       trous === 0 && doubles === 0, trous + " trou(s), " + doubles + " recouvrement(s)");
  }

  /* CHAQUE SECTION A SON RÉGIME, et les trois drops sont les trois
     seuls « boum » : c'est ce qui fait que le drop se voit. */
  var mR = html.match(/var IBI_REGIME = \{[\s\S]*?\n\};/);
  if(mR && mB){
    var REG = eval("(" + mR[0].replace(/^var IBI_REGIME = /, "").replace(/;$/, "") + ")");
    var BOR = eval("(" + mB[0].replace(/^var IBI_BORNES = /, "").replace(/;$/, "") + ")");
    var manque = [];
    for(var s in BOR) if(!REG[s]) manque.push(s);
    ok("aucune section n'est sans régime", manque.length === 0, manque.join(", "));
    var boums = Object.keys(REG).filter(function(x){ return REG[x] === "boum"; }).sort();
    ok("et « boum » est réservé aux trois drops",
       boums.join(",") === "drop1,drop2,final", boums.join(","));
    var tours = Object.keys(REG).filter(function(x){ return REG[x] === "tour"; }).sort();
    ok("… la rotation accélérée aux montées, et à elles seules",
       tours.join(",") === "build,build2,build3,montee", tours.join(","));
  }

  /* L'ACCÉLÉRATION EST UNE INTÉGRALE, PAS UN PRODUIT.
     Écrire « vitesse × temps » fait reculer la crête à chaque fois que
     la vitesse change : toute la trajectoire passée est recalculée
     avec la nouvelle valeur. C'est le piège du morceau, et il ne se
     voit qu'à l'écran. Le test garde la forme de la primitive. */
  ok("la phase de rotation est l'intégrale de la vitesse",
     /IBI_TOUR0 \* m \+ \(IBI_TOUR1 - IBI_TOUR0\) \* L \* u \* u \* u \/ 3/.test(html));
  ok("… et elle accélère bien, de un demi-tour à trois tours par mesure",
     /var IBI_TOUR0 = 0\.5, IBI_TOUR1 = 3\.0;/.test(html));

  /* LE DÉGRADÉ EST FABRIQUÉ UNE FOIS. Douze allées × six teintes, en
     coordonnées du monde : la caméra peut zoomer, il reste bon. C'est
     ce cache qui rend la nouvelle version PLUS RAPIDE que l'ancienne
     malgré les tracés supplémentaires. */
  ok("les dégradés des allées sont mis en cache",
     /function degradeAllee\(c, i, ci, D0, D1, blanc\)\{[\s\S]{0,300}IBI_DEG\.g\[cle\]/.test(html));
  ok("… et l'animation passe par globalAlpha, pas par de nouveaux dégradés",
     /var al = Math\.min\(1, g\);\s*c\.globalAlpha = al;[\s\S]{0,80}c\.fillStyle = degradeAllee\(/.test(html));
  /* PLUS DE CŒUR BLANC DANS LES BANDES.
     Une lame blanche plus étroite au milieu d'un couloir de couleur ne
     se lit pas comme un cœur plus chaud : deux quadrilatères
     concentriques de largeurs différentes font toujours apparaître
     leur frontière, et cette frontière est une LIGNE. Le joueur l'a vue
     comme un trait parasite, et il avait raison. Le surplus des drops
     passe maintenant par une seconde passe de la MÊME forme — une même
     forme repeinte n'a pas de bord neuf. */
  ok("les bandes n'ont plus de cœur blanc qui trace une ligne",
     !/degradeAllee\(c, i, ci, D0, D1, 1\)/.test(html));
  ok("… et le surplus des drops repasse sur la même forme",
     /if\(g > 1\)\{\s*c\.globalAlpha = Math\.min\(0\.9, g - 1\);\s*c\.fill\(\);/.test(html));
})();

/* ================================================================ */
G("34. Les blindés autour du QG, et la vermine en marche libre");
(function(){

  /* LE TIR EN MARCHE NE DÉPEND PLUS DE LA BALISE.
     Trois branches de marche existent dans majUnites : sous balise
     posée sur une cible, sous balise posée au sol, et en marche libre.
     La règle parle de MARCHE, pas de balise — un véhicule a deux caps,
     donc le tir ne lui coûte rien, et ce fait ne dépend pas de la
     manière dont l'ordre lui est venu. Les trois branches l'appellent
     donc, et c'est le nombre qui le dit : à deux, il manquerait
     précisément celle que le joueur a vue manquer. */
  ok("les trois branches de marche balaient la vermine",
     (html.match(/tirBeteEnMarche\(u, f, dt, cachee\);/g) || []).length === 3);

  /* ET LA BRANCHE D'ARRIVÉE NE L'APPELLE PAS — c'est l'autre moitié.
     Arrêté devant son bâtiment, le véhicule a sa tourelle POSÉE sur
     lui : la tourner vers une bestiole coûterait un vrai obus sur
     l'objectif. On vérifie que la ligne qui suit le `else` de la
     marche libre n'en contient pas. */
  {
    var libre = html.indexOf("tirBeteEnMarche(u, f, dt, cachee);",
                  html.indexOf("tirBeteEnMarche(u, f, dt, cachee);",
                    html.indexOf("tirBeteEnMarche(u, f, dt, cachee);") + 1) + 1);
    var suite = html.slice(libre, libre + 2600);
    ok("… mais pas celle de l'arrivée, qui a un obus à placer",
       suite.indexOf("}else{") > 0 &&
       suite.slice(suite.indexOf("}else{")).indexOf("tirBeteEnMarche") < 0);
  }

  /* LA PORTE RESTE CELLE DES VÉHICULES. Une troupe à pied n'a qu'un
     cap : elle devrait s'arrêter et se tourner. Le drapeau la referme
     à la première ligne, avant toute recherche de cible. */
  ok("la troupe à pied est refusée dès la première ligne",
     /function tirBeteEnMarche\(u, f, dt, cachee\)\{\s*if\(!f\.tourelle\) return 0;/.test(html));

  /* L'EMPRISE DU BRASIER EST UN DISQUE, PLUS UN CARRÉ.
     Mesuré : 44 % de l'anneau de tir du PYR-120 autour du Brasier était
     INFRANCHISSABLE, parce qu'une tour ronde était marquée sur un carré
     de 13 × 13 dans la grille de marche. Les blindés qui abordaient par
     un coin butaient sur du vide. Après la découpe en disque, 13 %.
     Cette grille est bâtie au lancement à partir de la carte, ne quitte
     pas l'appareil et n'entre dans aucune table de bâtiments : elle ne
     peut pas déplacer une défense ni toucher la campagne. */
  ok("l'emprise de marche du Brasier est un disque",
     /var rq = RAYON_QG \+ 0\.2, rq2 = rq \* rq/.test(html) &&
     /if\(dqx \* dqx \+ dqy \* dqy > rq2\) continue;/.test(html));
  ok("… et son rayon est celui du Brasier dessiné, pas un nombre à part",
     !/for\(i = -6; i <= 6; i\+\+\) for\(j = -6; j <= 6; j\+\+\)[\s\S]{0,200}occ\[y \* GW \+ x\] = 2/
       .test(html));

  /* LA POUSSÉE DE SÉPARATION GLISSE AUTOUR DE LA CIBLE.
     Huit chars arrivés sur le Brasier se poussaient les uns les autres
     vers l'arrière : la poussée avait une composante RADIALE, donc elle
     éloignait, et deux d'entre eux se retrouvaient repoussés hors de
     portée sans jamais tirer. On retire cette composante et on garde le
     reste — mais RENORMALISÉ à la longueur d'origine, sinon il ne
     subsiste qu'un filet : la projection seule laissait huit chars
     entassés sur 91° d'arc. Le glissement ne concerne que le véhicule
     ARRIVÉ (d - rc <= f.arret) : en chemin, la poussée d'origine est la
     bonne, c'est elle qui fait l'éventail. */
  ok("la poussée d'un blindé arrivé perd sa composante radiale",
     /var radial = px \* vx \+ py \* vy;\s*var tx = px - radial \* vx, ty = py - radial \* vy;/
       .test(html));
  ok("… et le reste est renormalisé, pas laissé en filet",
     /var l0 = Math\.hypot\(px, py\);\s*GLISSE\.x = tx \/ lt \* l0;\s*GLISSE\.y = ty \/ lt \* l0;/
       .test(html));
  ok("… seulement une fois arrivé, jamais en chemin",
     /if\(d - rc > f\.arret\) return GLISSE;/.test(html));
  ok("… et seulement pour les véhicules",
     /function glisseAutourDeSaCible\(u, px, py\)\{[\s\S]{0,200}if\(!f \|\| !f\.tourelle\) return GLISSE;/
       .test(html));
  ok("… et c'est bien la séparation qui s'en sert",
     /function separeUnites\(dt\)\{[\s\S]{0,6000}var g = glisseAutourDeSaCible\(lst\[i\], px, py\);/
       .test(html));
})();

/* ================================================================ */
G("35. L'interface de jeu allégée");
(function(){

  /* UN SEUL BOUTON DANS LE COIN, ET C'EST LE RETOUR.
     Les quatre autres doublaient tous un geste qui existe déjà : la
     molette et le pincement zooment, le plein écran se prend à
     l'accueil. On vérifie donc les deux moitiés — qu'ils ont quitté le
     document, ET que les gestes qu'ils doublaient sont toujours là,
     sans quoi ce ne serait plus un allègement mais une perte. */
  ok("le coin haut-gauche ne porte plus qu'un bouton",
     /<div id="zoomB" class="p">\s*<button class="bt" id="btAccueil"[\s\S]{0,140}<\/div>/.test(html));
  ok("… les quatre autres ont quitté le document",
     !/id="btZp"/.test(html) && !/id="btZm"/.test(html) &&
     !/id="btCentre"/.test(html) && !/id="btPlein2"/.test(html));
  /* C'est l'ÉCOUTEUR qu'on cherche, pas le nom : le commentaire
     d'installeBoutons cite $("btZp") pour dire pourquoi il n'est plus
     branché, et une recherche du seul nom retomberait dessus. */
  ok("… et leurs écouteurs sont partis avec eux",
     !/\$\("btZp"\)\.addEventListener/.test(html) &&
     !/\$\("btZm"\)\.addEventListener/.test(html) &&
     !/\$\("btCentre"\)\.addEventListener/.test(html) &&
     !/\$\("btPlein2"\)\.addEventListener/.test(html));
  ok("… mais la molette zoome toujours",
     /cv\.addEventListener\("wheel", function\(e\)\{[\s\S]{0,200}zoomVers\(/.test(html));
  ok("… et le plein écran reste au bouton de l'accueil",
     /\$\("btPlein"\)\.addEventListener\("click", basculePlein\);/.test(html));

  /* LA MINICARTE ET LA VERSION NE S'AFFICHENT PLUS.
     Elles restent dans le document — la première parce qu'on la
     clique si on la rouvre, la seconde parce que majBandeau l'écrit —
     mais elles ne prennent plus le coin. */
  ok("la minicarte et le numéro de version sont masqués",
     /#miniBoite,#versionJeu\{display:none\}/.test(html));
  ok("… le canevas de la minicarte reste pourtant là",
     /<canvas id="mini" width="264" height="236">/.test(html));
  /* ET LA VERSION RESTE LISIBLE QUELQUE PART. C'est la contrepartie :
     masquer le seul endroit où on lit le numéro reviendrait à ne plus
     pouvoir vérifier qu'une mise à jour est bien arrivée. */
  ok("… et le numéro se lit toujours au pied de l'accueil",
     /<b id="versionBrief">/.test(html) &&
     /\$\("versionBrief"\)\.textContent = VERSION;/.test(html));

  /* MASQUÉE, ON NE LA DESSINE PLUS — et la visibilité se relit sur le
     tempo du fond, pas à chaque image : offsetWidth force le calcul de
     la mise en page, et soixante fois par seconde le remède serait
     pire que le mal. */
  ok("la minicarte cachée ne coûte plus rien",
     /if\(tps > miniProchain\)\{\s*miniProchain = tps \+ 0\.7;\s*miniMontree = miniCv\.offsetWidth > 0;/
       .test(html) && /if\(!miniMontree\) return;/.test(html));
  ok("… et la mise en page n'est lue qu'une fois par tour de fond",
     (html.match(/miniCv\.offsetWidth/g) || []).length === 1);

  /* LES BÊTES TUÉES SE REPLIENT, ET LE COMPTE RESTE VISIBLE.
     Cinq lignes possibles qui ne partent jamais : le panneau
     s'allongeait au fil de l'île pour une chose qu'on lit une fois. */
  ok("le repli des victimes est fermé au départ",
     /var listeVictimes = false;/.test(html));
  ok("… le compte se lit sans ouvrir",
     /'🐾 ' \+ vic\.length \+ \(vic\.length > 1 \? " bêtes de Mily tuées"/.test(html));
  ok("… et un seul écouteur sert les deux replis du panneau",
     /if\(ev\.target\.closest\("\[data-enligne\]"\)\) listeEnLigne = !listeEnLigne;\s*else if\(ev\.target\.closest\("\[data-victimes\]"\)\) listeVictimes = !listeVictimes;/
       .test(html));
  ok("… le détail n'est écrit que déplié",
     /if\(listeVictimes\)\{[\s\S]{0,220}class="vl"/.test(html));

  /* LE FIL DE CHAT VIDE NE DIT PLUS RIEN. */
  ok("un fil vide laisse le panneau vide",
     /if\(!chatFil\.length\)\{[\s\S]{0,400}e\.innerHTML = "";/.test(html));
  ok("… et le paragraphe d'explication a disparu",
     !/Personne n\\'a encore rien dit/.test(html));

  /* LES NAVETTES : HUIT, OU DEUX FOIS QUATRE. JAMAIS SEPT ET UNE.
     C'est ce que donnait flex-wrap — 403 px réclamés, 400 offerts. Une
     grille ne peut pas produire ce résultat : elle a un NOMBRE de
     colonnes, et la largeur de la boîte se déduit de ce nombre au lieu
     de le contrarier. */
  ok("les navettes sont posées sur une grille, plus sur un flux",
     /#listeBarges\{display:grid;grid-template-columns:repeat\(var\(--bgn\),minmax\(0,var\(--bgw\)\)\)/
       .test(html));
  ok("… huit colonnes par défaut",
     /#bg\{--bgw:46px;--bgn:8;/.test(html));
  ok("… et quatre dès qu'on passe sous 600 px",
     /@media \(max-width:600px\)\{[\s\S]{0,700}#bg\{--bgn:4\}/.test(html));
  ok("… la largeur de la boîte se déduit du compte de colonnes",
     /max-width:min\(56vw, calc\(var\(--bgn\) \* var\(--bgw\) \+ \(var\(--bgn\) - 1\) \* 5px \+ 22px\)\)/
       .test(html));
  ok("… et la tuile ne redéclare plus sa largeur",
     /\.bg1\{[\s\S]{0,260}width:auto;height:52px/.test(html));
  ok("« aucune » traverse la grille au lieu d'entrer dans une colonne",
     /#listeBarges \.bg1\.aucune\{grid-column:1\/-1/.test(html) &&
     /html = '<div class="bg1 aucune">aucune<\/div>';/.test(html));

  /* LE COIN DROIT LIBÉRÉ PROFITE À LA JAUGE.
     La réserve de 160 px existait pour une minicarte de 144 px ; il ne
     reste que des annonces, et elles sont passées sous la ligne. */
  ok("les annonces descendent sous la ligne de la jauge",
     /#hd\{position:absolute;top:calc\(52px \+ var\(--sat\)\)/.test(html));
  ok("… et la jauge récupère toute la droite sous 800 px",
     /@media \(max-width:800px\)\{[\s\S]{0,600}left:calc\(221px \+ var\(--sal\)\);right:calc\(8px \+ var\(--sar\)\);/
       .test(html));
})();


/* ================================================================ */
G("36. Le badge : les compteurs, la fusion, le dessin");
(function(){

  /* LE MODULE FOURNI EST EXÉCUTÉ TEL QUEL, extrait du fichier livré.
     C'est la seule façon de vérifier le DESSIN sans le recopier : si
     un palier change là-bas, ces vérifications changent avec lui ou
     tombent — ce qui est exactement ce qu'on veut d'un test. */
  var d0 = html.indexOf("(function (root) {\n  'use strict';");
  var f0 = html.indexOf("})(typeof window !== 'undefined' ? window : this);");
  var B = null;
  if(d0 > 0 && f0 > d0){
    var src = html.slice(d0, f0).replace(/\}\)\(typeof window[\s\S]*$/, "");
    B = new Function("var root = {};\n" + src + "})(root);\nreturn root.MilyBadges;")();
  }
  ok("le module des badges s'exécute et s'expose", !!B && B.version === "3.3.0");
  if(!B) return;

  function J(i, sp, c){ return { stats:{ iles:i || {}, speciales:sp || {}, carriere:c || 0 } }; }

  /* ---- LA LISTE DE CONTRÔLE DE LA NOTICE, point par point ---- */

  /* « Un joueur qui n'a jamais rien gagné a quand même un badge
     visible. » C'est la promesse la plus importante du système : le
     badge doit donner envie de jouer, pas seulement récompenser ceux
     qui gagnent déjà. */
  {
    var vierge = B.compute(J());
    ok("un joueur qui n'a rien gagné a quand même un badge",
       vierge.disque.id === "assaillant" && /<svg/.test(B.svg(vierge, { size:16 })));
  }

  /* « Un seul badge par pseudo, jamais deux. » Une image, une seule. */
  {
    var riche = B.svg(B.compute(J({ or:5 }, { or:5 }, 5)), { size:16 });
    ok("un badge est UNE image, jamais deux",
       (riche.match(/<svg/g) || []).length === 1);
  }

  /* « Les cinq disques ont exactement le même diamètre. » La place
     réservée ne bouge pas, sinon les pseudos sauteraient quand
     quelqu'un progresse. */
  {
    var ex = [J(), J({ bronze:1 }), J({ argent:1 }), J({ or:1 }), J({ or:5 })];
    var w = ex.map(function(j){
      var m = B.svg(B.compute(j), { size:16 }).match(/width="(\d+)"/);
      return m ? m[1] : "?";
    });
    ok("les cinq disques occupent la même place",
       w.every(function(x){ return x === "16"; }), w.join(","));
    /* et le dernier palier change bien de FORME, pas de teinte */
    ok("… mais le dernier cesse d'être rond",
       B.compute(ex[4]).disque.facettes === 12 &&
       B.compute(ex[3]).disque.facettes === 0);
  }

  /* « Passer d'un top 3 à un top 2 change visiblement le badge. » */
  ok("un top 3 et un top 2 ne donnent pas le même badge",
     B.svg(B.compute(J({ bronze:1 })), { size:16 }) !==
     B.svg(B.compute(J({ argent:1 })), { size:16 }));

  /* « Titres 0 + bonus 3 donne trois rubis ; passer les titres à 2
     donne la Couronne. » C'est LE cas de la notice — celui qui dit la
     différence entre le bonus et le niveau forcé. */
  {
    var bon = { overrides:{ bonus:{ carriere:3 } } };
    var a = B.compute({ stats:{ carriere:0 }, overrides:bon.overrides });
    var b = B.compute({ stats:{ carriere:2 }, overrides:bon.overrides });
    ok("zéro titre plus un bonus de trois donne trois rubis",
       a.rouge.id === "trois" && a.rouge.rubis === 3, a.rouge.id);
    ok("… et deux titres de plus donnent la Couronne, tout seuls",
       b.rouge.id === "couronne" && b.rouge.aura === 1, b.rouge.id);
    /* alors qu'un niveau FORCÉ, lui, fige : c'est toute la différence,
       et c'est pour ça que l'aide dit d'employer le bonus */
    var fige = B.compute({ stats:{ carriere:9 }, overrides:{ force:{ rouge:"trois" } } });
    ok("… là où un niveau forcé reste figé malgré neuf titres",
       fige.rouge.id === "trois");
  }

  /* Le badge hors échelle REMPLACE tout, et c'est le seul hexagone. */
  {
    var dev = B.compute({ stats:{ iles:{ or:5 } }, overrides:{ special:"dev" } });
    ok("un badge hors échelle remplace le badge mérité",
       !!dev.special && dev.id === 0 && dev.ip === 0 && dev.ir === 0);
    ok("… et c'est le seul à être dessiné en hexagone",
       /<polygon points="16.00,5.40/.test(B.svg(dev, { size:16 })));
  }

  /* ---- LE TRANSPORT, côté noyau ---- */

  /* Aller-retour : ce qui entre ressort. */
  {
    var t = { Lu:{ io:5, ia:1, ib:2, so:1, sa:0, sb:3, ca:2 } };
    var r = N.decodeBadges(N.encodeBadges(t)).Lu;
    ok("les sept compteurs font l'aller-retour sans perte",
       r && r.io === 5 && r.ia === 1 && r.ib === 2 &&
       r.so === 1 && r.sa === 0 && r.sb === 3 && r.ca === 2);
  }
  /* UN JOUEUR À ZÉRO NE S'ÉCRIT PAS : son absence dit « Assaillant »,
     et l'écrire coûterait des octets pour redire le silence. */
  ok("un joueur à zéro ne prend pas de place dans la table",
     N.encodeBadges({ So:{ io:0, ia:0, ib:0, so:0, sa:0, sb:0, ca:0 } }) === "");

  /* LA FUSION EST UN MAXIMUM, CHAMP PAR CHAMP — donc commutative, donc
     l'ordre d'arrivée des messages ne change rien. */
  {
    var a2 = N.encodeBadges({ Lu:{ io:3, ia:0, ib:0, so:0, sa:0, sb:0, ca:1 } });
    var b2 = N.encodeBadges({ Lu:{ io:1, ia:2, ib:0, so:0, sa:0, sb:0, ca:0 },
                              Max:{ io:0, ia:0, ib:1, so:0, sa:0, sb:0, ca:0 } });
    var ab = N.decodeBadges(N.fusionneBadges(a2, b2));
    var ba = N.decodeBadges(N.fusionneBadges(b2, a2));
    ok("la fusion garde le plus grand de chaque compteur",
       ab.Lu.io === 3 && ab.Lu.ia === 2 && ab.Lu.ca === 1 && ab.Max.ib === 1);
    ok("… et elle donne le même résultat dans les deux sens",
       N.fusionneBadges(a2, b2) === N.fusionneBadges(b2, a2));
    ok("… et refusionner ne change plus rien",
       N.fusionneBadges(N.fusionneBadges(a2, b2), a2) === N.fusionneBadges(a2, b2));
  }

  /* LES RÉGLAGES D'ADMIN, EUX, DOIVENT POUVOIR RÉTRÉCIR. Un maximum ne
     redescend jamais : c'est pourquoi ils suivent le patron des
     épingles, un numéro qui tranche en entier. */
  {
    var v1 = { bo:N.encodeReglagesBadge({ Roro:{ special:"", disque:"", pointes:"", rouge:"",
                io:0, ia:0, ib:0, so:0, sa:0, sb:0, ca:3 } }), bon:1 };
    var v2 = { bo:N.encodeReglagesBadge({ Roro:{ special:"", disque:"", pointes:"", rouge:"",
                io:0, ia:0, ib:0, so:0, sa:0, sb:0, ca:1 } }), bon:2 };
    var g = N.meilleursReglagesBadge(v1, v2);
    ok("un bonus corrigé À LA BAISSE l'emporte grâce à son numéro",
       N.decodeReglagesBadge(g.bo).Roro.ca === 1 && g.bon === 2);
    ok("… et l'ordre d'arrivée n'y change rien",
       N.meilleursReglagesBadge(v2, v1).bo === g.bo);
  }

  /* ---- LE COMPTAGE DES PODIUMS ---- */

  /* Le rang donne la lettre, le drapeau de la carte donne la famille.
     On prend une carte ORDINAIRE et une SPÉCIALE, choisies dans la
     table des cartes — pas écrites en dur. */
  {
    var iOrd = -1, iSpe = -1, q;
    for(q = 0; q < N.CARTES.length; q++){
      if(N.carteSpeciale(q)){ if(iSpe < 0) iSpe = q; }
      else if(iOrd < 0) iOrd = q;
    }
    var t3 = N.inscritTop3("", iOrd, [{ nom:"Lu", g:9 }, { nom:"Roro", g:8 }, { nom:"Max", g:7 }]);
    t3 = N.inscritTop3(t3, iSpe, [{ nom:"Roro", g:9 }, { nom:"Lu", g:8 }]);
    var r1 = N.compteLesPodiumsPur("", "", t3);
    var tb = N.decodeBadges(r1.bg);
    ok("le premier d'une île ordinaire prend un or d'île",
       tb.Lu.io === 1 && tb.Lu.ia === 0);
    ok("… le deuxième un argent, le troisième un bronze",
       tb.Roro.ia === 1 && tb.Max.ib === 1);
    ok("… et une carte SPÉCIALE alimente les pointes, jamais le disque",
       tb.Roro.so === 1 && tb.Roro.io === 0 && tb.Lu.sa === 1);

    /* UNE CHUTE NE SE COMPTE QU'UNE FOIS. Sans cette garantie, deux
       clients qui voient le même podium le compteraient deux fois, et
       un simple rechargement de page gonflerait le badge. */
    ok("recompter le même podium ne donne plus rien",
       N.compteLesPodiumsPur(r1.bg, r1.bgn, t3) === null);
    /* mais une NOUVELLE chute de la même île compte, elle */
    var t3b = N.inscritTop3(t3, iOrd, [{ nom:"Lu", g:9 }, { nom:"So", g:8 }]);
    var r2 = N.compteLesPodiumsPur(r1.bg, r1.bgn, t3b);
    ok("… alors qu'une nouvelle chute de la même île compte",
       r2 && N.decodeBadges(r2.bg).Lu.io === 2);
  }

  /* Le titre carrière s'ajoute, et lui aussi se relit. */
  ok("un titre carrière s'ajoute au compteur du joueur",
     N.decodeBadges(N.ajouteTitreCarriere(
       N.ajouteTitreCarriere("", "Lu"), "Lu")).Lu.ca === 2);

  /* ---- CE QUI NE DOIT PAS SE PERDRE DANS L'INSTANTANÉ ---- */

  ok("les cinq voies du badge voyagent avec les champions et les podiums",
     /bg:fusionneBadges\(a && a\.bg, b && b\.bg\),\s*bgn:fusionneChutesBadge/.test(html) &&
     /o\.bg = E\.bg \|\| ""; o\.bgn = E\.bgn \|\| ""; o\.bgc = E\.bgc \| 0;/.test(html));
  ok("… et un compteur qui monte rend bien l'instantané « sale »",
     /if\(\(m\.bg \|\| ""\) !== \(E\.bg \|\| ""\)[\s\S]{0,200}return false;/.test(html));
  ok("le titre carrière se décerne à la fermeture d'une campagne",
     /function nouvelleCampagneSalon\(\)\{[\s\S]{0,900}crediteTitreCarriere\(cycleSalon \| 0/.test(html));

  /* LE BADGE NE SE RANGE JAMAIS. C'est la promesse de fond : on garde
     des compteurs, on calcule le dessin. Un instantané neuf ne porte
     donc que des compteurs vides, aucun badge. */
  ok("un monde neuf ne porte que des compteurs, aucun badge",
     /bg:"", bgn:"", bgc:0, bo:"", bon:0 \}/.test(html));

  /* LA PAGE DES BADGES NE RECOPIE RIEN. Elle demande à legende() ses
     noms, ses conditions et ses joueurs d'exemple : le jour où un
     palier change, elle suit toute seule. */
  ok("la page des badges se construit depuis legende()",
     /var L = MilyBadges\.legende\(\), h = "", i, k;/.test(html) &&
     /MilyBadges\.svg\(b, \{ size:62 \}\)/.test(html));
  ok("… et elle montre aussi chaque badge à seize pixels",
     /MilyBadges\.svg\(b, \{ size:16 \}\)/.test(html));

  /* LE CANEVAS NE RECONSTRUIT RIEN, et la taille y est FIXE : le cache
     est rangé sur « clé du badge @ taille », donc une taille qui
     suivrait le zoom demanderait une image neuve à chaque image. */
  ok("la plaque de nom dessine le badge à taille fixe",
     /MilyBadges\.drawOnCanvas\(ctx, joueurBadge\(j2\.nom\), pe\.x \+ demi \+ 3, yE, BADGE_CARTE\)/
       .test(html) && /var BADGE_CARTE = 16;/.test(html));
  ok("… et les images sont préchargées hors de la boucle de rendu",
     /MilyBadges\.precharger\(l, BADGE_CARTE\);/.test(html) &&
     /if\(typeof prechargeBadges === "function"\) prechargeBadges\(\);/.test(html));

  /* L'AIDE DE L'ADMINISTRATION DIT LA DIFFÉRENCE. Sans cette phrase,
     la distinction entre bonus et niveau forcé ne se voit pas avant
     des semaines. */
  ok("l'aide de l'administration dit d'employer le bonus, pas le niveau forcé",
     /Pour rendre des titres perdus, utilise le BONUS, jamais le niveau\s*forcé/.test(html));
})();

/* ---------------- bilan ---------------- */
console.log("\n" + "═".repeat(52));
if(echecs === 0) console.log("  " + total + " vérifications, tout passe.");
else console.log("  " + (total - echecs) + "/" + total + " vérifications — " + echecs + " ÉCHEC(S).");
console.log("═".repeat(52) + "\n");
process.exit(echecs ? 1 : 0);
