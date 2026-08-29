/* ================================================================
   LE CHAT DU SALON

   CE QU'IL EST. Un fil de messages entre les joueurs d'un même salon,
   vivant du briefing jusqu'à la fin de la bataille. Il se replie d'un
   doigt, et s'éteint tout à fait pour qui n'en veut pas.

   CE QU'IL N'EST PAS, ET POURQUOI. Il n'a PAS d'historique. Un joueur
   qui arrive voit ce qui se dit à partir de son arrivée, jamais ce qui
   s'est dit avant. Ce n'est pas une paresse, c'est la seule réponse
   honnête à l'architecture : le jeu n'a pas de serveur, seulement un
   courtier public qui retient UN message par sujet. Un historique
   partagé voudrait dire que chaque client republie tout le fil à
   chaque phrase — deux joueurs qui parlent en même temps s'écraseraient
   l'un l'autre, et l'on perdrait des messages sans jamais savoir
   lesquels. Mieux vaut un fil sans mémoire qu'une mémoire qui ment.

   Chacun garde en revanche SON défilement local : tout ce qu'il a reçu
   depuis qu'il est là reste consultable, et se perd en fermant l'onglet.

   CE QUI PASSE SUR LE RÉSEAU. Un message ordinaire de plus sur le sujet
   vivant du salon, { t:"chat", x:"…" }, à côté des « bonjour », des
   « etat » et des destructions. Aucun nouveau sujet, aucune rétention,
   aucun changement au protocole. Il passe par envoie(), donc il hérite
   gratuitement du verrou de la prévisualisation : en mode aperçu, rien
   ne part.
   ================================================================ */

var CHAT_MAX      = 80;      // messages gardés dans le fil local
var CHAT_LONGUEUR = 160;     // caractères par message
var CHAT_REPOS    = 1200;    // ms entre deux envois du même joueur
var CLE_CHAT      = "milyboum.chat";

/* LE REPOS À L'ENTRÉE, et il compte autant que celui à la sortie.
   Notre propre étranglement ne protège que les autres ; rien
   n'empêchait sept joueurs bavards — ou un client modifié — de nous
   inonder. Or chaque message reconstruit le fil, sur le fil principal,
   dans le même budget d'image que le rendu de deux mille bâtiments.
   Un message par joueur et par demi-seconde suffit largement à une
   conversation, et ferme le trou. */
var CHAT_REPOS_ENTREE = 500;
var CLE_CHAT_SOURD    = "milyboum.chat.sourd";

var chatActif   = true;      // le réglage du joueur : chat ou pas de chat
var chatOuvert  = false;
var chatNonLus  = 0;
var chatDernier = 0;         // horodatage du dernier envoi, pour le repos
var chatFil     = [];        // { nom, txt, moi, sys }
var chatEntrees = {};        // dernier message reçu, par identifiant
var chatSourds  = {};        // les joueurs qu'on a choisi de ne plus lire
var chatARedessiner = 0;     // une seule reconstruction par image, au plus

/* ---------------------------------------------------------------
   Le réglage, retenu sur cet appareil
   --------------------------------------------------------------- */
/* LE CHAT EST TOUJOURS LÀ, ET C'EST UN PIÈGE QU'ON DÉSAMORCE.

   L'interrupteur « Afficher le chat du salon » a été retiré de
   l'accueil : le chat a son bouton flottant, il s'ouvre et se ferme,
   l'option ne servait qu'à faire une ligne de plus.

   Mais elle laissait une trace dans le stockage. Un joueur qui l'avait
   décochée gardait un « 0 » chez lui, et sans l'interrupteur pour le
   remettre à « 1 » il se serait retrouvé avec un bouton de chat mort :
   `ouvreChat` sort en tête sur ce drapeau, les messages reçus sont
   jetés à l'arrivée, et RIEN dans l'interface n'aurait pu le rallumer.
   Retirer une case à cocher, ce n'est pas seulement retirer une case —
   c'est retirer le seul moyen d'annuler ce qu'elle a fait.

   On ignore donc ce qui est rangé. La fonction reste, parce que
   `regleChat` écrit toujours et qu'un réglage qu'on n'écrit plus mais
   qu'on relit encore serait pire que les deux. */
function litReglageChat(){
  return true;
}
function gardeReglageChat(on){
  try{ localStorage.setItem(CLE_CHAT, on ? "1" : "0"); }catch(e){}
}

/* ---------------------------------------------------------------
   Ouvrir, fermer, se taire
   --------------------------------------------------------------- */
function majBoutonChat(){
  var b = $("chatBt");
  if(!b) return;
  b.classList.toggle("on", chatActif && !chatOuvert);
  var g = $("chatBadge");
  if(g){
    g.classList.toggle("on", chatNonLus > 0);
    g.textContent = chatNonLus > 9 ? "9+" : String(chatNonLus);
  }
}
function ouvreChat(){
  if(!chatActif) return;
  chatOuvert = true;
  chatNonLus = 0;
  $("chat").classList.add("on");
  majBoutonChat();
  dessineFilChat();
  /* On ne prend PAS le clavier de force : sur tablette, ouvrir le chat
     pour lire ne doit pas faire monter un clavier qui mange la moitié
     de l'écran. C'est le joueur qui touche le champ quand il veut
     écrire. */
}
function fermeChat(){
  chatOuvert = false;
  $("chat").classList.remove("on");
  var s = $("chatSaisie");
  if(s) s.blur();
  majBoutonChat();
}
function basculeChat(){ chatOuvert ? fermeChat() : ouvreChat(); }
/* L'interrupteur du briefing. Éteint, il ne replie pas le chat : il le
   retire. Plus de bouton, plus de fil, et les messages reçus sont
   jetés à l'arrivée. */
function regleChat(on){
  chatActif = !!on;
  gardeReglageChat(chatActif);
  if(!chatActif){
    fermeChat();
    chatFil = [];
    chatNonLus = 0;
  }
  majBoutonChat();
  var c = $("chatActif");
  if(c) c.checked = chatActif;
}

/* ---------------------------------------------------------------
   Le fil
   --------------------------------------------------------------- */
/* `sys` marque les lignes que le jeu écrit lui-même — les arrivées, les
   départs, les avertissements. Elles ne portent pas de pseudo et se
   lisent en gris : on ne doit jamais pouvoir les confondre avec la
   parole d'un joueur, sans quoi n'importe qui pourrait se faire passer
   pour le jeu en choisissant son pseudo. */
function ajouteAuChat(nom, txt, moi, sys, id){
  if(!chatActif) return;
  txt = String(txt == null ? "" : txt).replace(/\s+/g, " ").trim();
  if(!txt) return;
  if(txt.length > CHAT_LONGUEUR) txt = txt.substr(0, CHAT_LONGUEUR);
  chatFil.push({ nom:String(nom || "?").substr(0, 14), txt:txt,
                 moi:!!moi, sys:!!sys, id:id || "" });
  if(chatFil.length > CHAT_MAX) chatFil.splice(0, chatFil.length - CHAT_MAX);
  if(chatOuvert) demandeDessinChat();
  else if(!sys){ chatNonLus++; majBoutonChat(); }
}
/* UNE SEULE RECONSTRUCTION PAR IMAGE, AU PLUS. Reconstruire le fil
   coûte quatre-vingts lignes de HTML ; le faire une fois par message
   reçu, sur le fil principal, c'était offrir à sept bavards le budget
   d'image du champ de bataille. */
function demandeDessinChat(){
  if(chatARedessiner) return;
  chatARedessiner = 1;
  var quand = window.requestAnimationFrame || function(f){ return setTimeout(f, 16); };
  quand(function(){ chatARedessiner = 0; dessineFilChat(); });
}
/* Une ligne du jeu, pas d'un joueur. */
function chatSysteme(txt){ ajouteAuChat("", txt, 0, 1); }

/* LE FIL, ET SURTOUT PAS « dessineChat ».

   Ce nom-là appartient déjà au CHAT DE MILY — Gribouille — sculpté
   dans 72-chats.js. Or l'assembleur concatène les vingt-sept morceaux
   dans UN SEUL <script>, par ordre alphabétique : « 86 » vient après
   « 72 », la seconde déclaration écrasait donc la première pour tout
   le fichier.

   Les dégâts étaient doubles, et invisibles à la lecture de l'un ou
   l'autre fichier pris seul :

     — GRIBOUILLE N'ÉTAIT PLUS JAMAIS DESSINÉ. Les créatures sont
       résolues par convention de nom (dessinDeCreature, 70-creatures.js :
       « dessine » + le type), donc window.dessineChat — c'est-à-dire
       ce panneau — était appelé à sa place, avec trois arguments qu'il
       ignorait. Croquette et Praline, eux, allaient bien : leurs
       fonctions s'appellent dessineChaton et dessineChatte.

     — ET LE FIL DE DISCUSSION ÉTAIT RECONSTRUIT À CHAQUE IMAGE, tout
       le innerHTML, tant qu'un Gribouille était à l'écran. Mesuré :
       118 reconstructions en 118 images, exactement une par image —
       alors que tout ce fichier est bâti autour de la promesse
       inverse (chatARedessiner, plus haut : « une seule
       reconstruction par image, AU PLUS »).

   Le chat de Mily ne peut pas céder son nom, c'est lui que la
   convention va chercher. C'est donc le fil qui change. */
function dessineFilChat(){
  var e = $("chatL");
  if(!e) return;
  if(!chatFil.length){
    /* FIL VIDE, PANNEAU VIDE. Il y avait ici un paragraphe qui
       expliquait que rien n'était gardé. Il disait vrai, mais il le
       disait à chaque ouverture, en haut du panneau, à la place des
       messages — et un fil vide se lit tout seul. La place vaut mieux
       que l'explication. */
    e.innerHTML = "";
  }else{
    var h = "", i;
    for(i = 0; i < chatFil.length; i++){
      var m = chatFil[i];
      /* Le pseudo porte l'identifiant : c'est par lui qu'on choisit de
         ne plus lire quelqu'un. Le sien propre n'est pas cliquable. */
      /* L'ÉPINGLE EST SUR LE MESSAGE, pas dans un menu. Un geste qui
         demande d'ouvrir quelque chose avant de servir ne sert jamais.
         Elle ne s'offre pas sur les lignes du jeu : on épingle ce que
         quelqu'un a dit, pas un message d'état. */
      h += m.sys
         ? '<div class="cs">' + echappe(m.txt) + '</div>'
         : '<div class="cm' + (m.moi ? " moi" : "") + '"><b'
           + ((!m.moi && m.id) ? ' data-sourd="' + echappe(m.id) + '"' : "")
           + '>' + echappe(m.nom) + '</b> ' + echappe(m.txt)
           + '<i class="cep" data-ep="' + i + '" title="Épingler ce message">📌</i></div>';
    }
    e.innerHTML = h;
  }
  majEpingles();
  /* toujours collé au dernier message : un chat qu'il faut faire
     défiler pour lire ce qui vient d'arriver ne sert à rien */
  e.scrollTop = e.scrollHeight;
  majQuiEstLa();
}
/* ================================================================
   LES MESSAGES ÉPINGLÉS, EN TÊTE DU FIL

   Le fil, lui, n'a pas d'historique et n'en aura pas : voir l'en-tête
   de ce fichier. Les épingles sont la réponse à l'autre moitié de la
   question — non pas « garder ce qui s'est dit », mais « retrouver ce
   qui compte ». Une poignée de phrases, portées par l'instantané
   retenu du salon, donc vues de tous et survivant aux déconnexions.

   ELLES SONT AU-DESSUS DU FIL, ET REPLIABLES. Au-dessus, parce qu'un
   pense-bête sous la conversation descend avec elle et disparaît.
   Repliables, parce que douze messages mangeraient le fil sur un
   téléphone : fermé, il ne reste que le compte, et l'on déplie quand
   on cherche.
   ================================================================ */
var epinglesOuvertes = false;

function majEpingles(){
  var e = $("chatEp");
  if(!e) return;
  var l = (typeof decodeEpingles === "function")
          ? decodeEpingles(typeof epinglesSalon === "string" ? epinglesSalon : "") : [];
  if(!l.length){ e.innerHTML = ""; e.style.display = "none"; return; }
  e.style.display = "";
  var h = '<div class="epT" data-eptitre="1">📌 ' + l.length + " épinglé"
        + (l.length > 1 ? "s" : "")
        + '<span class="epC">' + (epinglesOuvertes ? "▾" : "▸") + "</span></div>";
  if(epinglesOuvertes){
    for(var i = 0; i < l.length; i++){
      h += '<div class="epL"><b>' + echappe(l[i].nom) + "</b> "
         + echappe(l[i].txt)
         + '<i class="epX" data-epx="' + l[i].n + '" title="Retirer l\'épingle">✕</i></div>';
    }
  }
  e.innerHTML = h;
}

/* Épingler le message de rang `i` du fil local. */
function epingleDuFil(i){
  var m = chatFil[i | 0];
  if(!m || m.sys) return;
  if(typeof epingleMessage !== "function") return;
  if(epingleMessage(m.nom, m.txt)){
    epinglesOuvertes = true;
    majEpingles();
  }else{
    chatSysteme("Ce message est déjà épinglé.");
  }
}

/* Qui est en ligne, en tête du panneau — LE COMPTE, PAS LES NOMS.

   Il a porté la liste dépliable un moment, et c'était un doublon : en
   jeu, le panneau du haut-gauche la donne déjà, avec le nombre
   d'unités de chacun en plus. Restait le cas du MENU, où ce panneau
   n'existe pas — le HUD y est caché. C'est la carte du Salon qui s'en
   charge désormais, à côté de l'état de la connexion : un endroit par
   contexte, jamais deux.

   Le compte reste ici, et il a sa raison d'être propre : avant
   d'écrire, on veut savoir à combien de personnes on parle. */
function majQuiEstLa(){
  var e = $("chatQui");
  if(!e) return;
  var n = nomsEnLigne().total + 1;           // soi-même compte
  var s = nbSourds();
  e.innerHTML = (n > 1 ? n + " joueurs en ligne" : "toi seul pour l'instant")
    + (s ? ' <b id="chatSourds" title="Réafficher tout le monde">🔇 ' + s + "</b>" : "");
}

/* ---------------------------------------------------------------
   Envoyer
   --------------------------------------------------------------- */
function envoieChat(){
  var s = $("chatSaisie");
  if(!s || !chatActif) return;
  var txt = s.value.replace(/\s+/g, " ").trim();
  if(!txt) return;
  if(txt.length > CHAT_LONGUEUR) txt = txt.substr(0, CHAT_LONGUEUR);

  /* LE REPOS ENTRE DEUX MESSAGES. Le courtier est public et partagé :
     un client qui publie en rafale se fait couper, et il emporte avec
     lui l'instantané du monde et les positions des troupes. Le chat ne
     doit jamais pouvoir faire tomber la partie. */
  var t = Date.now();
  if(t - chatDernier < CHAT_REPOS){
    /* La cadence annoncée est celle du code, pas une approximation :
       le message disait « une par seconde » alors que CHAT_REPOS en
       vaut 1,2 — qui comptait jusqu'à un et réessayait se faisait
       refuser une seconde fois sans comprendre. */
    chatSysteme("Doucement — un message toutes les "
              + (CHAT_REPOS / 1000).toFixed(1).replace(".", ",") + " s, pas plus. "
              + "Le relais du salon est partagé avec la partie.");
    return;
  }
  if(typeof modeApercu !== "undefined" && modeApercu){
    chatSysteme("Prévisualisation : rien de ce que tu écris ne part. "
              + "Les autres joueurs ne savent même pas que tu es là.");
    s.value = "";
    return;
  }
  if(!reseau.connecte){
    chatSysteme("Pas de relais : le message n'est parti nulle part.");
    return;
  }
  chatDernier = t;
  s.value = "";
  envoie({ t:"chat", nom:monNom, x:txt });
  ajouteAuChat(monNom, txt, 1, 0);
}
/* Ce qui arrive des autres. Le pseudo affiché est celui que le réseau
   connaît pour cet identifiant, jamais celui que le message prétend :
   sinon n'importe qui pourrait signer du nom d'un autre. */
function recoitChat(j, m){
  if(!chatActif) return;
  var id = m.id || "?";
  if(chatSourds[id]) return;                        // on a choisi de ne plus le lire
  var t = Date.now();
  /* le repos à l'entrée, joueur par joueur : celui qui déborde est
     seul étranglé, les autres continuent d'être lus */
  if(chatEntrees[id] && t - chatEntrees[id] < CHAT_REPOS_ENTREE) return;
  chatEntrees[id] = t;
  ajouteAuChat(j && j.nom ? j.nom : (m.nom || "?"), m.x, 0, 0, id);
}

/* ---------------------------------------------------------------
   NE PLUS LIRE QUELQU'UN
   Le salon est unique et public : tout le monde y est. Il n'y a ni
   modérateur ni salon privé — la seule chose honnête à offrir, c'est
   de pouvoir se boucher les oreilles, joueur par joueur, sur cet
   appareil et pour soi seul.
   --------------------------------------------------------------- */
function litSourds(){
  try{
    var o = JSON.parse(localStorage.getItem(CLE_CHAT_SOURD) || "{}");
    return (o && typeof o === "object") ? o : {};
  }catch(e){ return {}; }
}
function gardeSourds(){
  try{ localStorage.setItem(CLE_CHAT_SOURD, JSON.stringify(chatSourds)); }catch(e){}
}
function ignoreAuChat(id, nom){
  if(!id || id === "?") return;
  if(!confirm("Ne plus lire « " + nom + " » ?\n\n"
            + "Ses messages ne s'afficheront plus sur CET appareil.\n"
            + "Tu peux revenir dessus avec le 🔇 en haut du chat.")) return;
  chatSourds[id] = nom;
  gardeSourds();
  chatSysteme(nom + " ne sera plus affiché.");
  dessineFilChat();
}
function nbSourds(){
  var n = 0, k;
  for(k in chatSourds) if(chatSourds[k]) n++;
  return n;
}
function rendLOreille(){
  var l = [], k;
  for(k in chatSourds) if(chatSourds[k]) l.push(chatSourds[k]);
  if(!l.length) return;
  if(!confirm("Réafficher " + l.join(", ") + " ?")) return;
  chatSourds = {};
  gardeSourds();
  chatSysteme("Tout le monde est réaffiché.");
  dessineFilChat();
}

/* ---------------------------------------------------------------
   Câblage
   --------------------------------------------------------------- */
function installeChat(){
  var b = $("chatBt"), f = $("chatFerme"), s = $("chatSaisie"), e = $("chatEnvoi"),
      c = $("chatActif"), p = $("chat");
  if(!b || !p) return;

  chatActif = litReglageChat();
  chatSourds = litSourds();
  /* Toucher un pseudo, c'est demander à ne plus le lire. Toucher le
     🔇 du bandeau, c'est revenir dessus. */
  var l = $("chatL");
  if(l) l.addEventListener("click", function(ev){
    /* L'ÉPINGLE D'ABORD : elle est DANS la ligne, et le pseudo aussi.
       Sans ce retour, toucher l'épingle d'un message aurait aussi pu
       remonter jusqu'au pseudo et rendre son auteur sourd. */
    var ep = ev.target.closest ? ev.target.closest("[data-ep]") : null;
    if(ep){ epingleDuFil(+ep.getAttribute("data-ep")); return; }
    var b = ev.target.closest ? ev.target.closest("[data-sourd]") : null;
    if(b) ignoreAuChat(b.getAttribute("data-sourd"), b.textContent);
  });
  /* Le bandeau des épinglés est réécrit en entier à chaque changement :
     l'écouteur vit sur le CONTENEUR, jamais sur les lignes. */
  var ep = $("chatEp");
  if(ep) ep.addEventListener("click", function(ev){
    var x = ev.target.closest ? ev.target.closest("[data-epx]") : null;
    if(x){
      if(typeof desepingleMessage === "function")
        desepingleMessage(+x.getAttribute("data-epx"));
      majEpingles();
      return;
    }
    if(ev.target.closest && ev.target.closest("[data-eptitre]")){
      epinglesOuvertes = !epinglesOuvertes;
      majEpingles();
    }
  });
  /* Le bandeau est réécrit en entier à chaque message : l'écouteur est
     posé sur le CONTENEUR une fois pour toutes, jamais sur le bouton
     — qui, lui, disparaît à chaque rafraîchissement. */
  var q = $("chatQui");
  if(q) q.addEventListener("click", function(ev){
    if(ev.target && ev.target.id === "chatSourds"){ rendLOreille(); return; }
    /* l attribut est en minuscules : le navigateur les abaisse */
  });
  if(c){
    c.checked = chatActif;
    c.addEventListener("change", function(){ regleChat(c.checked); });
  }
  b.addEventListener("click", basculeChat);
  if(f) f.addEventListener("click", fermeChat);
  if(e) e.addEventListener("click", envoieChat);
  if(s){
    s.addEventListener("keydown", function(ev){
      if(ev.key === "Enter"){ ev.preventDefault(); envoieChat(); }
      if(ev.key === "Escape"){ ev.preventDefault(); fermeChat(); }
      /* Le champ de saisie doit garder ses touches : sans ça, écrire
         « + » ou « - » zoomait la carte derrière. */
      ev.stopPropagation();
    });
    s.addEventListener("keyup", function(ev){ ev.stopPropagation(); });
  }
  /* Le panneau est posé PAR-DESSUS le canevas, qui écoute tous les
     gestes de la fenêtre pour déplacer la caméra. Sans ces barrages,
     défiler le fil du chat faisait glisser l'île dessous. */
  ["touchstart", "touchmove", "touchend", "mousedown", "mousemove", "wheel"]
    .forEach(function(nom){
      p.addEventListener(nom, function(ev){ ev.stopPropagation(); },
                         { passive:nom === "touchmove" || nom === "wheel" });
    });
  majBoutonChat();
  dessineFilChat();
}
