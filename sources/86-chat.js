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

var chatActif   = true;      // le réglage du joueur : chat ou pas de chat
var chatOuvert  = false;
var chatNonLus  = 0;
var chatDernier = 0;         // horodatage du dernier envoi, pour le repos
var chatFil     = [];        // { nom, txt, moi, sys }

/* ---------------------------------------------------------------
   Le réglage, retenu sur cet appareil
   --------------------------------------------------------------- */
function litReglageChat(){
  try{
    var v = localStorage.getItem(CLE_CHAT);
    return v === null ? true : v === "1";
  }catch(e){ return true; }
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
  dessineChat();
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
function ajouteAuChat(nom, txt, moi, sys){
  if(!chatActif) return;
  txt = String(txt == null ? "" : txt).replace(/\s+/g, " ").trim();
  if(!txt) return;
  if(txt.length > CHAT_LONGUEUR) txt = txt.substr(0, CHAT_LONGUEUR);
  chatFil.push({ nom:String(nom || "?").substr(0, 14), txt:txt, moi:!!moi, sys:!!sys });
  if(chatFil.length > CHAT_MAX) chatFil.splice(0, chatFil.length - CHAT_MAX);
  if(chatOuvert) dessineChat();
  else if(!sys){ chatNonLus++; majBoutonChat(); }
}
/* Une ligne du jeu, pas d'un joueur. */
function chatSysteme(txt){ ajouteAuChat("", txt, 0, 1); }

function dessineChat(){
  var e = $("chatL");
  if(!e) return;
  if(!chatFil.length){
    e.innerHTML = '<div class="cv">Personne n\'a encore rien dit. '
      + 'Le fil commence à ton arrivée : ce qui s\'est dit avant n\'est '
      + 'gardé nulle part.</div>';
  }else{
    var h = "", i;
    for(i = 0; i < chatFil.length; i++){
      var m = chatFil[i];
      h += m.sys
         ? '<div class="cs">' + echappe(m.txt) + '</div>'
         : '<div class="cm' + (m.moi ? " moi" : "") + '"><b>'
           + echappe(m.nom) + '</b> ' + echappe(m.txt) + '</div>';
    }
    e.innerHTML = h;
  }
  /* toujours collé au dernier message : un chat qu'il faut faire
     défiler pour lire ce qui vient d'arriver ne sert à rien */
  e.scrollTop = e.scrollHeight;
  majQuiEstLa();
}
/* Qui est en ligne, en tête du panneau. La liste vient de celle que le
   réseau tient déjà pour l'affichage des autres joueurs. */
function majQuiEstLa(){
  var e = $("chatQui");
  if(!e) return;
  var n = 1, k;                              // soi-même compte
  if(typeof autresJoueurs === "object" && autresJoueurs){
    for(k in autresJoueurs) if(autresJoueurs[k]) n++;
  }
  e.textContent = n > 1 ? (n + " joueurs en ligne") : "toi seul pour l'instant";
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
    chatSysteme("Doucement — un message par seconde, pas plus. "
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
  ajouteAuChat(j && j.nom ? j.nom : (m.nom || "?"), m.x, 0, 0);
}

/* ---------------------------------------------------------------
   Câblage
   --------------------------------------------------------------- */
function installeChat(){
  var b = $("chatBt"), f = $("chatFerme"), s = $("chatSaisie"), e = $("chatEnvoi"),
      c = $("chatActif"), p = $("chat");
  if(!b || !p) return;

  chatActif = litReglageChat();
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
  dessineChat();
}
