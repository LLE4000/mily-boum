#!/usr/bin/env node
/* ================================================================
   LA CAMPAGNE NE SE REMET JAMAIS À ZÉRO

   Règle du projet : une mise à jour peut changer ce qu'on VOIT, jamais
   ce qui est ACQUIS. Les scores, les champions, les podiums, l'île en
   cours et le numéro de campagne traversent toutes les versions.

   Ce contrôle vérifie la seule chose qu'un changement de code peut
   casser sans qu'on s'en aperçoive : LA STRUCTURE DES CARTES.

   Pourquoi c'est ça et pas autre chose. L'instantané partagé note les
   bâtiments détruits par un champ de BITS, un bit par bâtiment, dans
   l'ordre du tableau c.batiments. Ce tableau est donc un index :
     — s'il change de longueur, les destructions enregistrées ne
       désignent plus rien ;
     — si un bâtiment change de place DANS le tableau, elles désignent
       le mauvais ;
     — et dans les deux cas, la seule issue propre serait de repartir
       d'une campagne neuve — exactement ce qu'on s'interdit.

   D'où la discipline, déjà écrite dans le noyau et vérifiée ici :
   tout bâtiment nouveau s'ajoute À LA FIN du tableau, et rien ne se
   glisse au milieu. Les décors, la flore et la faune, eux, ne sont
   indexés par personne : on peut en ajouter, en retirer, les
   redimensionner. C'est là que vivent les changements visuels.

   Usage :  node outils/verif-campagne.js [référence]
   La référence est un commit git, HEAD par défaut. On compare la
   version de travail à celle-là, carte par carte, plan du salon
   compris.
   ================================================================ */
var fs = require("fs"), path = require("path"), vm = require("vm");
var cp = require("child_process");

var racine = path.join(__dirname, "..");
var ref = process.argv[2] || "HEAD";

function noyauDepuisTexte(t){
  var a = t.indexOf("/*==NOYAU_DEBUT==*/"), b = t.indexOf("/*==NOYAU_FIN==*/");
  if(a < 0 || b < 0) throw new Error("bornes du noyau introuvables");
  var N = {};
  vm.createContext(N);
  ["console", "Math", "JSON", "String", "Number", "Array", "Object",
   "isNaN", "parseInt", "parseFloat"].forEach(function(k){ N[k] = global[k]; });
  vm.runInContext(t.slice(a, b), N);
  return N;
}
function noyauDeLaReference(){
  var t = cp.execSync("git show " + ref + ":sources/10-noyau.js",
                      { cwd:racine, maxBuffer:64 * 1024 * 1024 }).toString();
  return noyauDepuisTexte(t);
}
function noyauDuTravail(){
  return noyauDepuisTexte(fs.readFileSync(path.join(racine, "sources/10-noyau.js"), "utf8"));
}

/* L'empreinte d'un bâtiment : ce que l'index doit retrouver à
   l'identique. Sa place dans le tableau EST son identité. */
function empreinteBat(b){
  return b.t + "@" + Math.round(b.gx * 1000) + "," + Math.round(b.gy * 1000);
}

var A, B;
try{ A = noyauDeLaReference(); B = noyauDuTravail(); }
catch(e){
  console.error("Impossible de charger les deux versions : " + e.message);
  process.exit(2);
}

/* On éprouve les six cartes, et chacune DEUX FOIS : sans plan — la
   carte d'origine — et avec le plan gravé de la jungle, qui est le
   cas le plus chargé du jeu. */
var cas = [];
for(var i = 0; i < A.CARTES.length; i++){
  cas.push({ i:i, nom:A.CARTES[i].nom, plan:"", quoi:"carte d'origine" });
  if(A.carteSpeciale(i)) cas.push({ i:i, nom:A.CARTES[i].nom, plan:A.planJungle(), quoi:"plan gravé" });
}

var soucis = [], lignes = [];

/* LE NUMÉRO DE VERSION DOIT AVOIR CHANGÉ. Il n'est pas décoratif : il
   est la clé de cache de index.html. Le publier inchangé, c'est
   publier du code que personne ne téléchargera — le pied de page a
   annoncé v0.15 pendant que v0.16 était en ligne, et c'est comme ça
   qu'on s'en est aperçu. */
if(A.VERSION === B.VERSION){
  soucis.push("le numéro de version n'a pas changé (" + B.VERSION
    + ") : index.html garderait la même adresse, et personne ne "
    + "recevrait cette mise à jour.");
}
cas.forEach(function(k){
  var a = A.genereCarte("MILY", k.i, k.plan, 0);
  var b = B.genereCarte("MILY", k.i, k.plan, 0);
  var ba = a.batiments || [], bb = b.batiments || [];
  var etat = "ok", detail = "";
  if(ba.length !== bb.length){
    etat = "LONGUEUR";
    detail = ba.length + " → " + bb.length;
    soucis.push(k.nom + " (" + k.quoi + ") : le tableau des bâtiments change de longueur, "
      + detail + ". Les destructions enregistrées ne désignent plus les mêmes bâtiments.");
  }else{
    var decale = -1;
    for(var j = 0; j < ba.length; j++){
      if(empreinteBat(ba[j]) !== empreinteBat(bb[j])){ decale = j; break; }
    }
    if(decale >= 0){
      etat = "DÉCALAGE";
      detail = "au rang " + decale + " : " + empreinteBat(ba[decale])
             + " → " + empreinteBat(bb[decale]);
      soucis.push(k.nom + " (" + k.quoi + ") : un bâtiment change de place dans le tableau, "
        + detail + ". Les destructions enregistrées désigneraient le mauvais bâtiment.");
    }
  }
  /* Le décor, lui, a le droit de bouger : c'est là que vivent les
     changements visuels. On le mesure pour le dire, pas pour s'en
     plaindre. */
  var fa = (a.flore || []).length, fb = (b.flore || []).length;
  var da = (a.decors || []).length, db = (b.decors || []).length;
  var ca = (a.creatures || []).length, cb = (b.creatures || []).length;
  lignes.push({
    nom:(k.nom + " · " + k.quoi), bat:ba.length, etat:etat, detail:detail,
    visuel:(fa !== fb || da !== db || ca !== cb)
      ? ("flore " + fa + "→" + fb + ", décor " + da + "→" + db + ", bêtes " + ca + "→" + cb)
      : "inchangé"
  });
});

var large = 0;
lignes.forEach(function(l){ if(l.nom.length > large) large = l.nom.length; });
console.log("\nLA CAMPAGNE SURVIT-ELLE À CETTE VERSION ? — référence : " + ref);
console.log("version : " + A.VERSION + " → " + B.VERSION
  + (A.VERSION === B.VERSION ? "   ← INCHANGÉE" : "") + "\n");
console.log("  " + "carte".padEnd(large) + "  bâtiments  index         visuel");
lignes.forEach(function(l){
  console.log("  " + l.nom.padEnd(large)
    + "  " + String(l.bat).padStart(9)
    + "  " + (l.etat === "ok" ? "intact  " : l.etat.padEnd(8))
    + "      " + l.visuel + (l.detail ? "  — " + l.detail : ""));
});

if(soucis.length){
  console.error("\n╔═══════════════════════════════════════════════════════════════");
  console.error("║ LA CAMPAGNE SERAIT PERDUE");
  soucis.forEach(function(s){ console.error("║   • " + s); });
  if(lignes.some(function(l){ return l.etat !== "ok"; })){
    console.error("║");
    console.error("║ Un bâtiment nouveau s'ajoute À LA FIN du tableau, jamais au");
    console.error("║ milieu. Un tirage aléatoire ajouté avant les bâtiments les");
    console.error("║ décale tous : posez-le après.");
  }
  if(A.VERSION === B.VERSION){
    console.error("║");
    console.error("║ Changez VERSION dans sources/10-noyau.js, puis réassemblez :");
    console.error("║ l'assembleur grave le numéro dans l'adresse de index.html.");
  }
  console.error("╚═══════════════════════════════════════════════════════════════\n");
  process.exit(1);
}
console.log("\n  Les six cartes gardent leur index de bâtiments intact.");
console.log("  Scores, champions, podiums et progression traversent cette version.\n");
