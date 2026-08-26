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
    "NB_REACTEURS",
    "genereCarte","empreinteCarte","utf8Octets","encodePlan","decodePlan","planVide",
    "zoneDePlan","zonesPeintes","NB_ZONES","ZONES_L","ZONES_H","TYPES_PLAN","DENSITES","PAS_ZONE","meilleurPlan","texteUtf8","encodeLongueur","decodeLongueur",
    "chaineMqtt","paquetConnect","paquetSubscribe","paquetPublish","paquetPing",
    "paquetDeconnexion","DecodeurMqtt","litPublish","FileDegats","mitraTouche","ZMIN","ZMAX","coutActuel","tirePondere"
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
  zt[0] = 3 | (3 << 3); zt[100] = 5 | (1 << 3); zt[N.NB_ZONES - 1] = 7 | (2 << 3);
  var ch = N.encodePlan(zt), zr = N.decodePlan(ch);
  var identique = zr.length === N.NB_ZONES;
  for(var iz = 0; iz < N.NB_ZONES; iz++) if(zt[iz] !== zr[iz]) identique = false;
  ok("aller-retour d'encodage fidèle (" + ch.length + " caractères)", identique);
  ok("3 zones peintes reconnues", N.zonesPeintes(zr) === 3);
  ok("une chaîne corrompue dégénère en « tout d'origine »",
     N.decodePlan("!!!???").every(function(x){ return x === 0; }));

  /* le plan agit vraiment : mêmes zones partout → un seul type */
  var zf = N.planVide();
  for(var jz = 0; jz < N.NB_ZONES; jz++) zf[jz] = 3 | (3 << 3);   // frelon, saturé
  var cf = N.genereCarte("MILY", 0, N.encodePlan(zf), 0);
  /* les cellules d'énergie et les cellules électriques ne sont pas des
     défenses : le plan ne les concerne pas. */
  var defF = cf.batiments.filter(function(b){ return b.t !== "cellule" && b.t !== "reacteur"; });
  ok("plan « Frelon partout, saturé » : " + defF.length + " défenses, toutes Frelon",
     defF.length > 500 && defF.every(function(b){ return b.t === "frelon"; }));
  var zc = N.planVide();
  for(var kz = 0; kz < N.NB_ZONES; kz++) zc[kz] = 0 | (1 << 3);   // clairsemé partout
  var cc = N.genereCarte("MILY", 0, N.encodePlan(zc), 0);
  var defC = cc.batiments.filter(function(b){ return b.t !== "cellule" && b.t !== "reacteur"; }).length;
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
    base[2 * N.ZONES_L + 2] = 1 | (2 << 3);
    var cible = [], zx, zy;
    for(zx = 9; zx <= 11; zx++) for(zy = 6; zy <= 9; zy++) cible.push(zy * N.ZONES_L + zx);
    var noeud = function(b){ return N.zoneDePlan(Math.round(b.gx), Math.round(b.gy)); };
    var hors = function(m){
      return m.batiments.filter(function(b){
        return b.t !== "cellule" && cible.indexOf(noeud(b)) < 0;
      });
    };
    var A = N.genereCarte("MILY", 0, N.encodePlan(base), 0);
    [["type", 3 | (2 << 3)], ["densité", 0 | (3 << 3)], ["type et densité", 5 | (1 << 3)]]
    .forEach(function(v){
      var mod = base.slice(), i;
      for(i = 0; i < cible.length; i++) mod[cible[i]] = v[1];
      var B = N.genereCarte("MILY", 0, N.encodePlan(mod), 0);
      var ha = hors(A), hb = hors(B), pareil = ha.length === hb.length;
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
    for(var k = 0; k < cible.length; k++) mod2[cible[k]] = 3 | (3 << 3);
    var C = N.genereCarte("MILY", 0, N.encodePlan(mod2), 0);
    var dedans = C.batiments.filter(function(b){
      return b.t !== "cellule" && cible.indexOf(noeud(b)) >= 0;
    });
    ok("dans une zone peinte, tout est du type demandé (" + dedans.length + " bâtiments)",
       dedans.length > 0 && dedans.every(function(b){ return b.t === "frelon"; }));
  })();

  ok("zoneDePlan reste dans la grille aux quatre coins",
     N.zoneDePlan(0, 0) === 0 &&
     N.zoneDePlan(N.GW * 2, N.GH * 2) === N.NB_ZONES - 1 &&
     N.zoneDePlan(-50, -50) === 0);

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
  /* Les salons déjà en cours désignent les bâtiments détruits par leur
     INDICE : si les cellules n'étaient pas ajoutées en dernier, chaque
     bit pointerait sur le mauvais bâtiment chez tout le monde. */
  (function(){
    var m = N.genereCarte("MILY", 0);
    var apres = 0, n = m.batiments.length;
    for(var i = n - N.NB_REACTEURS; i < n; i++)
      if(m.batiments[i].t === "reacteur") apres++;
    ok("les cellules occupent les cinq DERNIERS indices du tableau",
       apres === N.NB_REACTEURS, apres + "/" + N.NB_REACTEURS);
    var avant = m.batiments.slice(0, n - N.NB_REACTEURS)
                 .filter(function(b){ return b.t === "reacteur"; }).length;
    ok("et aucune ne s'est glissée avant", avant === 0, "" + avant);
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
       Math.min(N.rayonFormation() * 0.55, (N.UNI.mec.arret + 0.3) * 0.7) < N.UNI.mec.arret + 0.3);
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
    ok("il y a bien cinq îles", N.CARTES.length === 5, "" + N.CARTES.length);
    var vus = {}, tousDifferents = true;
    for(var iv = 0; iv < N.CARTES.length; iv++){
      var m = N.texteVictoire(iv, "X")[1];
      if(vus[m]) tousDifferents = false;
      vus[m] = 1;
    }
    ok("les cinq messages sont différents", tousDifferents);
    ok("plage : le verre", N.texteVictoire(0, "X")[1].indexOf("boire un verre") > 0);
    ok("forêt : la cabane", N.texteVictoire(1, "X")[1].indexOf("cabane") > 0);
    ok("campagne : la paille", N.texteVictoire(2, "X")[1].indexOf("paille") > 0);
    ok("soirée hippie : chez elle", N.texteVictoire(3, "X")[1].indexOf("chez elle") > 0);
    ok("le Sud : elle l'aime", N.texteVictoire(4, "X")[1].indexOf("aime") > 0);
    ok("le message boucle avec les îles", N.texteVictoire(5, "X")[1] === N.texteVictoire(0, "X")[1]);
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
       N.CRE.tweety.vitesse > N.UNI.meuf.vitesse && N.CRE.tweety.vitesse > N.UNI.mec.vitesse);
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
  var couv = N.CAP.balise.duree * N.UNI.meuf.vitesse;
  /* 30 s × 1,62 case/s. La valeur est épinglée exprès : elle dit ce
     qu'une Balise achète réellement, et elle doit bouger sciemment. */
  ok(N.CAP.balise.duree + " s de Balise couvrent " + couv.toFixed(0) + " cases",
     Math.abs(couv - 48.6) < 0.01, couv.toFixed(2));
  ok("il faut " + Math.ceil(cases / couv) + " Balises pour traverser " + cases + " cases",
     Math.ceil(cases / couv) <= 6);
  ok("la version est au format vX.YY", /^v\d+\.\d{2}$/.test(N.VERSION), N.VERSION);
  ok("huit navettes par vie", N.EQ.NB_BARGES === 8);
  ok("douze Meufs par navette au maximum", N.placesNavette("meuf") === 12);
  ok("quinze Mecs par navette au maximum", N.placesNavette("mec") === 15);
  ok("une vie plafonne à " + N.flotteMaximum() + " unités (8 × 15 Mecs)",
     N.flotteMaximum() === 120);
  ok("une flotte entière de Meufs fait 96 unités",
     N.EQ.NB_BARGES * N.placesNavette("meuf") === 96);
  ok("aucun type ne dépasse le plafond absolu d'une navette",
     Object.keys(N.UNI).every(function(t){
       return N.placesNavette(t) <= N.EQ.PLACES_PAR_BARGE;
     }));
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
