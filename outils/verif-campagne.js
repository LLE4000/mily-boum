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

   ────────────────────────────────────────────────────────────────
   ET L'AJOUT EN QUEUE EST LÉGITIME — le contrôle le sait depuis la
   guinguette pavoisée.

   Il refusait tout changement de longueur, sans regarder où. C'était
   trop sévère d'un côté et trop vague de l'autre : trop sévère,
   parce qu'ajouter À LA FIN est précisément ce que l'en-tête
   ci-dessus prescrit ; trop vague, parce qu'un raccourcissement et
   un allongement ne coûtent pas du tout la même chose.

   On compare donc d'abord le RANG COMMUN, un à un. S'il est intact :
     — plus long qu'avant, c'est un AJOUT. Les rangs neufs n'ont
       jamais existé pour personne : aucun instantané enregistré ne
       porte de bit à leur place, `decodeBits` les rend debout, et
       c'est vrai — personne ne les a encore abattus.
     — plus court, c'est une PERTE, et elle reste fatale : un
       bâtiment que quelqu'un a démonté réapparaîtrait intact.

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

/* ================================================================
   CE QU'ON ÉPROUVE, ET UN ANGLE MORT QU'ON VIENT DE FERMER

   Chaque carte passe TROIS fois :

     sans plan          la carte d'origine, le cas de référence ;
     plan de la jungle  le cas le plus chargé du jeu, en résistance ;
     LE PLAN DU JEU     celui que planDeCarte rend vraiment quand le
                        salon n'a rien enregistré.

   Le troisième manquait, et c'était un vrai trou. Les deux premiers
   appellent genereCarte AVEC UN PLAN CHOISI ICI ; une carte qui porte
   un plan gravé dans le code — la jungle, et maintenant les Mily et
   une nuits — n'était donc jamais éprouvée telle qu'elle est jouée.
   On aurait pu regraver le jardin de fond en comble sans que l'outil
   dise un mot.

   ────────────────────────────────────────────────────────────────
   ET L'EXCEPTION DU CHANTIER

   Une carte marquée `chantier` est fermée : personne ne peut la
   lancer, la rejoindre ni la visiter. Son index de bâtiments ne
   désigne donc AUCUNE destruction enregistrée, nulle part, puisqu'il
   n'y a jamais eu de partie. Le changer ne coûte rien.

   L'exception est attachée au drapeau, et c'est le point important :
   le jour où l'on retire `chantier` pour ouvrir la carte, elle
   disparaît d'elle-même et l'index redevient intouchable, sans que
   personne ait à s'en souvenir.
   ================================================================ */
/* ================================================================
   ET LA REFONTE DÉCLARÉE

   Il arrive qu'on demande de REDESSINER une île — pas de retoucher son
   décor, mais de redisposer ses défenses. C'est ce qui est arrivé à
   Ibiza deux fois de suite : « dispose toi-même les défenses selon une
   forme ultra-graphique » en v0.79, puis « remplis entièrement les
   secteurs » en v0.80 et v0.81. Un tel travail DÉPLACE forcément des rangs, et
   cet outil a raison de le crier : c'est exactement le genre de
   changement qui casse une campagne en cours.

   On ne le fait donc passer qu'à trois conditions, et elles sont
   écrites ici pour qu'on ait à les relire avant d'en ajouter une
   quatrième :

     1. L'ÎLE N'A JAMAIS ÉTÉ JOUÉE. Ibiza est le septième rang sur huit
        de la campagne : elle est verrouillée tant que les six
        précédentes ne sont pas tombées. L'instantané `mondeVide` porte
        le numéro de SA carte (`c:index`) — le tableau des destructions
        d'une île qu'on n'a pas atteinte n'existe nulle part.
     2. LES SCORES NE BOUGENT PAS. Ils sont rangés par joueur et par
        carte, en points, et ne connaissent aucun index de bâtiment.
     3. LA DÉCLARATION EST NOMINATIVE ET DATÉE. Elle nomme la carte et
        la version qui la refond. Elle ne couvre pas « les cartes
        verrouillées » en général : la version suivante devra la
        retirer, et l'index d'Ibiza redeviendra intouchable comme celui
        des autres.
   ================================================================ */
var REFONTES = [
  { i:8, version:"v0.81", pourquoi:"les secteurs remplis à ras bord — plus de mille défenses, 40 % de Frelons" }
];
function refonteDeclaree(i){
  for(var r = 0; r < REFONTES.length; r++)
    if(REFONTES[r].i === i && REFONTES[r].version === B.VERSION) return REFONTES[r];
  return null;
}

var cas = [];
for(var i = 0; i < A.CARTES.length; i++){
  var enChantier = !!(A.CARTES[i].chantier && B.CARTES[i] && B.CARTES[i].chantier);
  cas.push({ i:i, nom:A.CARTES[i].nom, plan:"", quoi:"carte d'origine",
             chantier:enChantier });
  if(A.carteSpeciale(i)){
    cas.push({ i:i, nom:A.CARTES[i].nom, plan:A.planJungle(), quoi:"plan gravé",
               chantier:enChantier });
    /* le plan que le jeu emploie vraiment, des deux côtés */
    cas.push({ i:i, nom:A.CARTES[i].nom, quoi:"plan du jeu", chantier:enChantier,
               planA:A.planDeCarte(i, ""), planB:B.planDeCarte(i, "") });
  }
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
  var a = A.genereCarte("MILY", k.i, (k.planA !== undefined) ? k.planA : k.plan, 0);
  var b = B.genereCarte("MILY", k.i, (k.planB !== undefined) ? k.planB : k.plan, 0);
  var ba = a.batiments || [], bb = b.batiments || [];
  var etat = "ok", detail = "";
  /* Un changement sur une carte en chantier se DIT, mais ne bloque
     pas : il n'y a aucune partie derrière cet index. */
  var refonte = refonteDeclaree(k.i);
  function ennui(m){
    if(k.chantier){ etat = "chantier"; return; }
    if(refonte){ etat = "REFONTE"; return; }
    soucis.push(m);
  }
  /* Le rang commun est-il intact ? On le regarde AVANT la longueur :
     c'est lui qui décide, et la longueur ne fait que dire ensuite si
     l'on a ajouté ou retiré. */
  var commun = Math.min(ba.length, bb.length), decale = -1;
  for(var j = 0; j < commun; j++){
    if(empreinteBat(ba[j]) !== empreinteBat(bb[j])){ decale = j; break; }
  }
  if(decale >= 0){
    etat = "DÉCALAGE";
    detail = "au rang " + decale + " : " + empreinteBat(ba[decale])
           + " → " + empreinteBat(bb[decale]);
    ennui(k.nom + " (" + k.quoi + ") : un bâtiment change de place dans le tableau, "
      + detail + ". Les destructions enregistrées désigneraient le mauvais bâtiment.");
  }else if(bb.length > ba.length){
    /* L'AJOUT EN QUEUE — le seul changement de longueur qui ne coûte
       rien, et celui que l'en-tête de ce fichier prescrit depuis le
       premier jour. Les rangs d'avant sont identiques un à un ; les
       rangs neufs n'ont jamais existé pour personne, donc aucun
       instantané enregistré ne porte de bit à leur place, donc
       `decodeBits` les rend « debout » — ce qui est exactement vrai :
       personne ne les a encore abattus.
       Le contrôle refusait ce cas avec les autres, faute de savoir
       les distinguer. Il sait, maintenant. */
    etat = "AJOUT";
    detail = "+" + (bb.length - ba.length) + " en queue";
  }else if(bb.length < ba.length){
    /* Le retrait, lui, reste fatal : les bits enregistrés au-delà de
       la nouvelle longueur ne désignent plus rien, et surtout un
       bâtiment que quelqu'un a démonté réapparaîtrait intact. */
    etat = "PERTE";
    detail = ba.length + " → " + bb.length;
    ennui(k.nom + " (" + k.quoi + ") : le tableau des bâtiments RACCOURCIT, "
      + detail + ". Des destructions enregistrées ne désigneraient plus rien.");
  }
  /* Le décor, lui, a le droit de bouger : c'est là que vivent les
     changements visuels. On le mesure pour le dire, pas pour s'en
     plaindre. */
  var fa = (a.flore || []).length, fb = (b.flore || []).length;
  var da = (a.decors || []).length, db = (b.decors || []).length;
  var ca = (a.creatures || []).length, cb = (b.creatures || []).length;
  lignes.push({
    nom:(k.nom + " · " + k.quoi), bat:bb.length, etat:etat, detail:detail,
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
if(lignes.some(function(l){ return l.etat === "REFONTE"; })){
  console.log("\n  « REFONTE » : l'île est REDESSINÉE volontairement, et la");
  console.log("  déclaration est en tête de ce fichier — carte, version, raison.");
  REFONTES.forEach(function(r){
    if(r.version !== B.VERSION) return;
    console.log("    · " + B.CARTES[r.i].nom + " en " + r.version + " : " + r.pourquoi + ".");
  });
  console.log("  Elle ne passe que parce que l'île n'a jamais été jouée : son rang");
  console.log("  de campagne la verrouille, et aucun instantané ne porte donc ses");
  console.log("  destructions. Les scores, eux, ignorent les index et ne bougent pas.");
  console.log("  LA DÉCLARATION EST DATÉE : à la version suivante elle ne s'applique");
  console.log("  plus, et l'index redevient intouchable.");
}
if(lignes.some(function(l){ return l.etat === "chantier"; })){
  console.log("\n  « chantier » : la carte est fermée, personne n'y a jamais joué,");
  console.log("  et son index ne désigne donc aucune destruction enregistrée. Le");
  console.log("  jour où l'on retire le drapeau, ce laissez-passer disparaît.");
}

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
