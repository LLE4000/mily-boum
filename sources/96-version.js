/* ================================================================
   « JE NE VOIS PAS LA MISE À JOUR »

   Le problème, posé deux fois par le joueur et diagnostiqué deux fois
   trop tard : la tablette affichait une version périmée du jeu — une
   jungle ensoleillée en v0.25, les cartes dans le désordre en v0.35 —
   et le code livré, lui, était juste. Ce n'était pas un bug de jeu,
   c'était le CACHE DU NAVIGATEUR.

   POURQUOI LES PARADES EN PLACE NE SUFFISENT PAS.
   Le jeu est UN fichier de 1,6 Mo. Le navigateur le garde, et il a
   raison de le garder. Deux garde-fous existaient :
     — `<meta http-equiv="Cache-Control">` dans les deux pages. Il ne
       sert à rien : ce n'est pas un vrai en-tête HTTP, et pour le
       document qui le porte les navigateurs l'ignorent. L'hébergeur
       envoie ses propres en-têtes, et c'est lui qui décide.
     — l'adresse `mily-boum.html?v=0.37`, écrite par l'assembleur dans
       index.html à chaque version. Celle-là marche — mais SEULEMENT si
       l'on entre par index.html. Un onglet restauré, un raccourci sur
       l'écran d'accueil, un favori posé sur `mily-boum.html` tout
       court : la requête n'a plus de `?v=`, et le navigateur ressert
       sa copie sans même demander.

   CE QU'ON FAIT ICI. Le jeu va lire lui-même le numéro qu'annonce
   index.html, avec une requête que le cache ne peut pas servir (une
   estampille unique dans l'adresse). S'il découvre plus récent que
   lui, il le dit — un bandeau discret, un bouton, et le rechargement
   se fait sur la bonne adresse.

   TROIS PRÉCAUTIONS.
     1. Hors ligne, en local (file://), derrière un pare-feu : la
        requête échoue et l'on se tait. Jamais de message d'erreur
        pour une vérification que personne n'a demandée.
     2. On ne recharge JAMAIS tout seul. Le joueur peut être en pleine
        bataille ; c'est lui qui décide du moment.
     3. La comparaison est numérique et non textuelle : « v0.9 » et
        « v0.10 » se comparent mal en tant que chaînes, et le jour où
        l'on passera à v1.0 la comparaison de textes dirait le
        contraire de la vérité.
   ================================================================ */

/* « v0.37 » → 37. « v1.4 » → 1040. Le format est vX.YY, où YY monte
   d'un à chaque mise en ligne : on donne mille points au majeur, ce
   qui laisse la place à mille versions mineures. */
function numeroVersion(t){
  var m = /v?(\d+)\.(\d+)/.exec(String(t || ""));
  if(!m) return -1;
  return (+m[1]) * 1000 + (+m[2]);
}

var versionEnLigne = "";
/* Le bandeau. Il ne se pose qu'une fois, et seulement s'il y a
   vraiment quelque chose de plus récent à aller chercher. */
function montreBandeauVersion(neuve){
  if(document.getElementById("bandeauMaj")) return;
  var d = document.createElement("div");
  d.id = "bandeauMaj";
  d.innerHTML = '<span class="bmT">Une nouvelle version est en ligne : <b>'
              + neuve.replace(/[^v0-9.]/g, "") + '</b></span>'
              + '<button class="bt ptt" id="btMaj">↻ Recharger</button>'
              + '<button class="bt ptt" id="btMajPlusTard">Plus tard</button>';
  document.body.appendChild(d);
  document.getElementById("btMaj").addEventListener("click", function(){
    /* On recharge SUR L'ADRESSE NEUVE : recharger l'adresse courante
       resservirait exactement la même copie. L'estampille garantit que
       la requête n'a jamais été faite. */
    var base = location.href.split("?")[0].split("#")[0];
    location.replace(base + "?v=" + encodeURIComponent(neuve.replace(/[^0-9.]/g, ""))
                          + "&r=" + Date.now());
  });
  document.getElementById("btMajPlusTard").addEventListener("click", function(){
    d.remove();
  });
}

/* La vérification elle-même. Elle lit index.html — le seul fichier que
   l'assembleur réécrit à chaque version — et y cherche l'adresse qu'il
   annonce. */
function verifieVersion(){
  if(location.protocol === "file:") return;          // ouvert depuis le disque
  if(typeof fetch !== "function") return;
  var url = "index.html?maj=" + Date.now();
  fetch(url, { cache:"no-store" }).then(function(r){
    if(!r.ok) throw 0;
    return r.text();
  }).then(function(t){
    var m = /mily-boum\.html\?v=([0-9.]+)/.exec(t);
    if(!m) return;
    versionEnLigne = "v" + m[1];
    var ici = numeroVersion(VERSION), la = numeroVersion(versionEnLigne);
    if(la > ici && ici >= 0) montreBandeauVersion(versionEnLigne);
  }).catch(function(){ /* hors ligne : on se tait */ });
}
