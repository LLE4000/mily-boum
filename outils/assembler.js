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
var ko = (Buffer.byteLength(texte) / 1024).toFixed(0);
console.log("mily-boum.html assemblé — " + morceaux.length + " morceaux, " + ko + " Ko, "
  + texte.split("\n").length + " lignes");
if(soucis.length){ console.error("ATTENTION : " + soucis.join(" | ")); process.exit(1); }
