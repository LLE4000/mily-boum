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
    "CARTES","GW","GH","LARGEUR_ROCHE","QG_GX","QG_GY","PLAGE_X0","SOL_ECH","tailleSolPrecalcule",
    "genereCarte","empreinteCarte","utf8Octets","texteUtf8","encodeLongueur","decodeLongueur",
    "chaineMqtt","paquetConnect","paquetSubscribe","paquetPublish","paquetPing",
    "paquetDeconnexion","DecodeurMqtt","litPublish","FileDegats","mitraTouche","ZMIN","ZMAX","coutActuel","tirePondere"
  ].join(",") + "};")();
}catch(e){
  console.error("Le bloc NOYAU n'est pas évaluable : " + e.message);
  process.exit(1);
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

  [a, c, N.genereCarte("MILY", 2)].forEach(function(m, i){
    ok("carte " + (i + 1) + " : " + m.batiments.length + " bâtiments (350-700)",
       m.batiments.length >= 350 && m.batiments.length <= 700, "" + m.batiments.length);
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
  ok("la crible (5,15) dépasse l'arrêt de la Meuf (4,75)",
     N.DEF.crible.portee > N.UNI.meuf.arret);
  ok("… mais de justesse : moins d'une demi-case",
     N.DEF.crible.portee - N.UNI.meuf.arret < 0.5);
  ok("le lance-chalumeau (5,6) dépasse la portée de la Meuf (5,0)",
     N.DEF.chalumeau.portee > N.UNI.meuf.portee);
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
    salve:[10,22,37,67], nova:[14,30,50,90]
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

  /* traversée */
  var cases = (N.GW - 4) - N.QG_GX;
  ok("25 s de Balise couvrent " + (25 * N.UNI.meuf.vitesse).toFixed(0) + " cases (≈ 1/3 du trajet)",
     Math.abs(25 * N.UNI.meuf.vitesse - 33.75) < 0.01);
  ok("il faut " + Math.ceil(cases / (25 * N.UNI.meuf.vitesse)) + " Balises pour traverser " + cases + " cases",
     Math.ceil(cases / (25 * N.UNI.meuf.vitesse)) <= 6);
  ok("une vie = 120 unités", N.EQ.NB_BARGES * N.EQ.PLACES_PAR_BARGE === 120);
  /* le Brasier : objectif collectif */
  var dpsSolo = 100 * (N.UNI.meuf.degats / (N.UNI.meuf.cadence / 1000));
  var soloMin = N.CARTES[0].pvQG / dpsSolo / 60;
  ok("île 1 : " + soloMin.toFixed(0) + " min en solo sans opposition (≈ 60)",
     soloMin >= 45 && soloMin <= 90, soloMin.toFixed(1));
  ok("île 1 : " + (soloMin / 15).toFixed(1) + " min à quinze joueurs (< 6)", soloMin / 15 < 6);
  ok("les défenses restent tendres devant le Brasier",
     N.DEF.frelon.pv * 400 < N.CARTES[0].pvQG / 10);
  ok("une quinzaine de tireuses démonte un Crible en moins de 4 s",
     N.DEF.crible.pv / (8 * N.UNI.meuf.degats / (N.UNI.meuf.cadence / 1000)) < 4);
})();

/* ---------------- bilan ---------------- */
console.log("\n" + "═".repeat(52));
if(echecs === 0) console.log("  " + total + " vérifications, tout passe.");
else console.log("  " + (total - echecs) + "/" + total + " vérifications — " + echecs + " ÉCHEC(S).");
console.log("═".repeat(52) + "\n");
process.exit(echecs ? 1 : 0);
