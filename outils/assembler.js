#!/usr/bin/env node
/* Assemble les morceaux de sources/ en un unique mily-boum.html.
   Les fichiers sont concaténés dans l'ordre alphabétique de leur nom. */
var fs = require("fs"), path = require("path");

var racine  = path.join(__dirname, "..");
var dossier = path.join(racine, "sources");
var sortie  = path.join(racine, "mily-boum.html");

var morceaux = fs.readdirSync(dossier).filter(function(f){
  return /\.(html|js|css)$/.test(f);
}).sort();

var out = [];
morceaux.forEach(function(f){
  var s = fs.readFileSync(path.join(dossier, f), "utf8");
  if(/\.js$/.test(f)) out.push("\n/* ===== " + f + " ===== */\n");
  out.push(s);
});

var texte = out.join("");

/* Garde-fous : un seul fichier, aucune dépendance externe. */
var soucis = [];
if(/<\/script>/.test(texte.replace(/<\/script>\s*<\/body>/, ""))){
  var n = (texte.match(/<\/script>/g) || []).length;
  if(n !== 1) soucis.push("il y a " + n + " balises </script> (il en faut exactement 1)");
}
if(/https?:\/\/(?!broker\.|www\.w3\.org)/.test(texte.replace(/^.*Généré.*$/gm, ""))){
  var m = texte.match(/https?:\/\/(?!broker\.|www\.w3\.org)[^\s"'<>)]+/g) || [];
  soucis.push("URL externe détectée : " + m.slice(0, 4).join(", "));
}
if(/<(script|link|img)[^>]+(src|href)\s*=\s*["']https?:/i.test(texte)) soucis.push("ressource externe chargée");

fs.writeFileSync(sortie, texte);

/* ================================================================
   LE NUMÉRO DE VERSION SERT AUSSI DE CLÉ DE CACHE

   Le jeu est UN fichier de 1,5 Mo. Le navigateur le garde — et sur
   tablette il le garde longtemps : le pied de page annonçait encore
   v0.15 alors que v0.16 était publié depuis un moment. Le push
   n'était pas en cause, le cache l'était.

   index.html, lui, ne pèse que 826 octets. On y grave l'adresse
   « mily-boum.html?v=<version> » à l'assemblage : une version neuve
   est une adresse neuve, donc un téléchargement neuf, garanti. Une
   version inchangée garde son cache et ne coûte rien.

   D'où une règle simple, et c'est celle qu'on suit déjà : un push,
   un numéro de version. Oublier de le changer, c'est publier du code
   que personne ne verra.

   Le repère est JEU_URL. Il est remplacé PARTOUT où il apparaît — et
   nulle part ailleurs : un remplacement en aveugle sur « mily-boum.html »
   mordait sur le texte du commentaire et sur le lien canonique, qui
   doit rester l'adresse propre. Une fois gravé, l'index publié porte
   l'adresse complète, et c'est bien celle-là qu'on livre.
   ================================================================ */
var noyau = fs.readFileSync(path.join(dossier, "10-noyau.js"), "utf8");
var mv = noyau.match(/var\s+VERSION\s*=\s*"([^"]+)"/);
var version = mv ? mv[1] : "";
var fIndex = path.join(racine, "index.html");
if(version && fs.existsSync(fIndex)){
  var idx = fs.readFileSync(fIndex, "utf8");
  var court = version.replace(/^v/, "");
  var neuf = idx
    .split("JEU_URL").join("mily-boum.html?v=" + court)
    /* et si l'index porte déjà une version, on la remet à jour */
    .replace(/mily-boum\.html\?v=[0-9][^"'\s>]*/g, "mily-boum.html?v=" + court);
  if(neuf !== idx) fs.writeFileSync(fIndex, neuf);
}

var ko = (Buffer.byteLength(texte) / 1024).toFixed(0);
console.log("mily-boum.html assemblé — " + morceaux.length + " morceaux, " + ko + " Ko, "
  + texte.split("\n").length + " lignes");
if(soucis.length){ console.error("ATTENTION : " + soucis.join(" | ")); process.exit(1); }
