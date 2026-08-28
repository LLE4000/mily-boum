/* ================================================================
   MULTIJOUEUR — MQTT 3.1.1 écrit à la main sur WebSocket
   Un seul salon, gravé dans le fichier : MILY.
   ================================================================ */

var CODE_SALON = "MILY";
var SUJET = "khiao/mily/" + CODE_SALON;
/* Sujet séparé pour l'instantané du monde. Il est publié RETENU : le
   courtier en garde le dernier exemplaire et le sert d'office à tout
   nouvel abonné — c'est ce qui fait qu'on reprend le monde là où il en
   était, même après que tout le monde a fermé son navigateur. */
var SUJET_MONDE = SUJET + "/monde";
var CLE_MONDE = "milyboum:monde:" + CODE_SALON;

var monde = null;            // dernier instantané connu
var mondeSale = false;       // on a du nouveau à publier
var mondeT = 0;              // étranglement des republications

/* LE PLAN DE DÉFENSE DU SALON.
   planSalon  : la recette, encodée (voir encodePlan dans le noyau)
   numeroPlan : compteur monotone, il tranche deux plans concurrents
   tirageSalon: quelle réalisation de la recette on joue en ce moment.
   Ces trois-là voyagent dans l'instantané retenu, donc un joueur qui
   arrive trois heures plus tard reçoit la même carte que les autres. */
var planSalon = "", numeroPlan = 0, tirageSalon = 0;

/* LE TABLEAU DES SCORES DU SALON.
   `autresJoueurs` ne retient QUE les joueurs actuellement entendus : il
   est purgé dès qu'un appareil se tait, et le classement perdait alors
   le nom en même temps que la présence. Or des dégâts infligés restent
   infligés. Ce registre-ci garde donc nom et score de chacun pour la
   durée de la partie, qu'il soit encore branché ou non ; seule une
   remise à zéro du salon l'efface. */
var scoresSalon = {};
function noteScore(id, nom, degats, seau){
  var e = scoresSalon[id];
  if(!e) e = scoresSalon[id] = { nom:"?", g:0, seau:"" };
  if(nom) e.nom = nom;
  if(seau) e.seau = seau;
  /* Ce registre-ci ne sert qu'à ANIMER le classement entre deux
     instantanés : les messages d'état arrivent toutes les 420 ms, le
     monde partagé toutes les deux secondes. Le nombre reçu est
     désormais le TOTAL de l'expéditeur, qui ne fait que monter — le
     maximum y est donc juste. La vérité, elle, est dans monde.s. */
  if(typeof degats === "number" && degats > e.g) e.g = degats;
}

/* ================================================================
   MES DÉGÂTS À MOI — le seau de cet appareil

   LE DÉFAUT QUE CECI CORRIGE. Ce qui partait sur le réseau était
   `jeu.degatsMoi`, remis à zéro à chaque île et à chaque rechargement
   de page, et toute la chaîne en prenait le MAXIMUM. Un joueur à
   302 475 restait donc figé à 302 475 : sur l'île suivante il
   repartait de zéro et il lui aurait fallu refaire 302 475 en une
   seule partie pour gagner un point. Plus il jouait, plus son propre
   record devenait un mur.

   CE QU'ON GARDE MAINTENANT. Un cumul par carte, pour CE pseudo sur
   CET appareil, qui ne redescend jamais et survit à la fermeture de
   la page. C'est le « seau » du compteur réparti : on n'écrit que le
   sien, on ne touche jamais à celui d'un autre, et le total d'un
   joueur est la somme de ses seaux.

   La clé de rangement porte le salon, le numéro de campagne et le
   pseudo. Le numéro de campagne compte : une remise à zéro du salon
   efface la guerre, donc les scores avec — et un joueur qui revient
   après ne doit pas réinjecter un vieux total dans une campagne
   neuve.
   ================================================================ */
var monSeau = "";
var mesDegats = {};            // { index de carte -> dégâts cumulés }
var degatsReplies = 0;         // ce de jeu.degatsMoi qu'on a déjà rangé
var cleDegatsChargee = "";

function faitMonSeau(){
  /* Quatre caractères tirés de l'identifiant stable de l'appareil.
     Deux appareils différents ne doivent pas partager de seau, sinon
     leurs contributions s'écraseraient au lieu de s'additionner. */
  var h = graineTexte(monId || "?") >>> 0;
  var alpha = "abcdefghijklmnopqrstuvwxyz0123456789", s = "";
  for(var i = 0; i < 4; i++){ s += alpha.charAt(h % 36); h = (h / 36) | 0; }
  return s;
}
/* LA CLÉ DU CUMUL LOCAL NE PORTE PLUS LE PSEUDO. Elle le portait, et
   c'était le même défaut que dans l'instantané : taper son nom
   autrement repartait de zéro. Le cumul appartient à l'APPAREIL et à
   la campagne — le pseudo n'est qu'une étiquette.

   ELLE NE PORTE PLUS LA CAMPAGNE NON PLUS, et c'est une correction.
   La campagne était DANS LA CLÉ, or au démarrage on ne la connaît pas
   encore : cycleSalon vaut 0 tant que l'instantané retenu n'est pas
   arrivé. Qui ouvrait le jeu relais coupé, jouait, et infligeait
   640 000 dégâts, les rangeait sous « …:0 » ; l'instantané arrivait
   ensuite avec cy = 7, la clé changeait, et chargeMesDegats vidait
   tout sans jamais relire l'ancienne. Les 640 000 restaient sur le
   disque, dans une clé que plus aucun code n'ouvrait — et le
   compteur du joueur retombait à zéro.

   UNE SEULE CLÉ, donc, et la campagne dans la VALEUR : { cy, d, p }.
   Le drapeau `p` dit « provisoire » : ce cumul a été accumulé avant
   qu'on sache dans quelle campagne on jouait. Un cumul provisoire est
   ADOPTÉ par la campagne réelle dès qu'on l'apprend — les dégâts ont
   bien été infligés, ils comptent. Un cumul non provisoire d'une
   AUTRE campagne, lui, est bien jeté : c'est ce que veut une remise à
   zéro.

   Au passage, ça referme une petite fuite : l'ancienne forme laissait
   une clé morte de plus dans le stockage à chaque remise à zéro,
   chaque nouveau tirage et chaque enregistrement de plan, sans borne.
   On les balaie une fois, au premier chargement. */
var CLE_DEGATS = "milyboum:deg:" + CODE_SALON;
var mesDegatsCycle = -1;       // la campagne du cumul actuellement en mémoire
var mondeRecu = false;         // un instantané, local ou du relais, est arrivé

/* Les clés de l'ancienne forme « …:<cycle> », lues une fois pour ne
   rien perdre, puis effacées. */
function migreVieuxDegats(){
  var repris = null, i, k, cy;
  try{
    for(i = localStorage.length - 1; i >= 0; i--){
      k = localStorage.key(i);
      if(!k || k.indexOf(CLE_DEGATS + ":") !== 0) continue;
      cy = parseInt(k.substr(CLE_DEGATS.length + 1), 10) | 0;
      if(cy === (cycleSalon | 0) && !repris){
        try{ repris = JSON.parse(localStorage.getItem(k) || "null"); }catch(e){}
      }
      localStorage.removeItem(k);
    }
  }catch(e){}
  return repris;
}
/* Relit le stockage sans condition. chargeMesDegats se contente de
   son cache tant que la campagne n'a pas bougé — c'est ce qu'on veut
   soixante fois par seconde —, mais avant d'AJOUTER quelque chose il
   faut avoir sous les yeux ce qu'un autre onglet a pu écrire entre
   deux. Notre mémoire et le disque sont identiques hors du delta
   qu'on s'apprête à poser : relire ne perd donc rien. */
function relitMesDegats(){
  mesDegatsCycle = -1;
  chargeMesDegats();
}
function chargeMesDegats(){
  if(mesDegatsCycle === (cycleSalon | 0) && cleDegatsChargee) return;
  cleDegatsChargee = CLE_DEGATS;
  var o = null;
  try{ o = JSON.parse(localStorage.getItem(CLE_DEGATS) || "null"); }catch(e){}
  var vientDeMigrer = 0;
  if(!o){
    /* UN SEUL appel : le balayage efface au passage, un second ne
       trouverait plus rien. */
    var vieux = migreVieuxDegats();
    if(vieux){ o = { cy:cycleSalon | 0, d:vieux, p:0 }; vientDeMigrer = 1; }
  }
  var garde = null;
  if(o && typeof o === "object" && o.d && typeof o.d === "object"){
    /* provisoire : on l'adopte, quelle que soit la campagne qu'il
       portait — ces dégâts-là ont bien été infligés */
    if(o.p) garde = o.d;
    else if((o.cy | 0) === (cycleSalon | 0)) garde = o.d;
  }
  mesDegats = {};
  if(garde) for(var k in garde) if(garde[k] > 0) mesDegats[k | 0] = Math.round(garde[k]);
  mesDegatsCycle = cycleSalon | 0;
  /* ON RÉÉCRIT TOUT DE SUITE dans deux cas, et pour la même raison :
     ce qu'on vient de récupérer n'existe plus que dans cette mémoire,
     et l'onglet peut se fermer avant le prochain coup de hache.
       — un cumul provisoire adopté par sa vraie campagne (sans quoi il
         se ferait adopter une seconde fois plus tard) ;
       — un cumul migré depuis l'ancienne forme de clé, dont le
         balayage vient d'effacer l'original. */
  if(garde && ((o && o.p && mondeRecu) || vientDeMigrer)) gardeMesDegats();
}
function gardeMesDegats(){
  try{
    localStorage.setItem(CLE_DEGATS, JSON.stringify({
      cy:cycleSalon | 0, d:mesDegats, p:mondeRecu ? 0 : 1
    }));
  }catch(e){}
}
/* ON RANGE LE DELTA, JAMAIS LE TOTAL.

   Le premier jet écrivait « ce que portait la carte au départ, plus
   jeu.degatsMoi ». Ça marche tant que le pseudo ne bouge pas — mais
   changer de pseudo en cours de partie recréditait au NOUVEAU pseudo
   des dégâts déjà rangés sous l'ancien, et les mêmes coups comptaient
   deux fois. Ranger l'ACCROISSEMENT depuis le dernier rangement
   supprime la question : un changement de pseudo, de carte ou de
   campagne ne peut plus faire remonter du passé.

   Appelée avant chaque publication et à chaque changement de carte :
   entre deux appels, jeu.degatsMoi continue de monter tout seul. */
function repliMesDegats(){
  if(!monNom) return;
  /* LA PRÉVISUALISATION NE COMPTE PAS. Elle promet « ni dégâts, ni
     champion, ni progression, ni chrono », et elle tenait la promesse
     partout SAUF ici : le cumul local, lui, était rangé comme celui
     d'une vraie partie, puis publié à la seconde suivante. Tester une
     île verrouillée gonflait donc son Top 3 pour tout le salon, et
     durablement, puisque le cumul part dans le stockage du navigateur.
     On sort avant d'écrire quoi que ce soit — ni mémoire, ni disque. */
  if(modeApercu) return;
  chargeMesDegats();
  if(!jeu) return;
  var d = Math.round(jeu.degatsMoi || 0) - degatsReplies;
  if(d > 0){
    /* DEUX ONGLETS DU MÊME NAVIGATEUR SONT LE MÊME APPAREIL : même
       identifiant stable, donc même seau et même clé de rangement.
       Chacun tenait sa propre copie de mesDegats en mémoire et
       l'écrivait en entier : le second effaçait le premier, et un
       onglet sur deux jouait pour rien. On relit donc juste avant
       d'ajouter, et l'on n'ajoute que NOTRE accroissement — la somme
       est alors juste, quel que soit le nombre d'onglets. */
    relitMesDegats();
    mesDegats[jeu.index] = (mesDegats[jeu.index] || 0) + d;
    degatsReplies += d;
    gardeMesDegats();
  }
}
/* Une nouvelle île commence : on range ce qui reste de la précédente,
   puis le compteur de partie repart de zéro — et notre marqueur avec
   lui, sinon le premier coup de la nouvelle île passerait pour un
   retour en arrière. */
function ouvreCarteScore(index){
  repliMesDegats();
  chargeMesDegats();
  degatsReplies = 0;
}
/* Mon total, toutes îles confondues, sur cet appareil. */
function monTotalLocal(){
  repliMesDegats();
  var s = 0, k;
  for(k in mesDegats) s += mesDegats[k];
  return s;
}
/* Ce que j'ai fait sur UNE île. Même compteur, sans la somme : c'est
   lui que le podium en jeu affiche désormais, et c'est exactement le
   nombre que la vignette de cette île montre sur l'accueil. */
function monTotalCarte(carte){
  repliMesDegats();
  return mesDegats[carte | 0] || 0;
}
/* Le tableau partagé, MES seaux remplacés par leur valeur locale —
   plus fraîche que celle qui a été publiée il y a deux secondes. */
function scoresAJour(){
  var t = decodeScores(monde && monde.s), k;
  if(!monNom) return t;
  repliMesDegats();
  for(k in mesDegats){
    var c = cleScore(monSeau, k | 0);
    var av = t[c];
    /* ON N'ÉCRIT QUE NOTRE SEAU, et l'on écrit CE QUE LA FUSION VA
       RETENIR — pas ce qu'on aimerait qu'elle retienne.

       C'est la correction. On posait notre pseudo courant dans tous
       les cas, y compris quand la fusion allait le refuser : elle
       tranche les égalités de dégâts au nom le plus PETIT (voir
       fusionneScores). Bob qui se renommait « Zoe » sans frapper
       publiait donc « Zoe », recevait « Bob » en retour, constatait
       une différence, republiait « Zoe »… toutes les deux secondes,
       indéfiniment, sur le sujet RETENU du salon. Renommé « Ana »,
       en revanche, la boucle se fermait du premier coup — le défaut
       était asymétrique, ce qui le rendait difficile à voir.

       En appliquant ici la règle exacte de la fusion, ce qu'on publie
       est déjà un point fixe : memeMonde dit vrai, et la republication
       s'arrête. Le nouveau pseudo, lui, s'impose au premier coup de
       hache — nos dégâts dépassent alors ceux du tableau, notre
       entrée gagne franchement, et l'étiquette suit. */
    if(!av || mesDegats[k] > av.g)      t[c] = { n:monNom, g:mesDegats[k] };
    else if(mesDegats[k] === av.g)      t[c] = { n:(monNom < av.n ? monNom : av.n), g:av.g };
    else                                t[c] = { n:av.n, g:av.g };
  }
  return t;
}
var PERIODE_MONDE = 2.0;     // s minimum entre deux instantanés

var monId = "";
var monNom = "";
var autresJoueurs = {};
var degatsEnAttente = 0;
var serieReseau = 0;

var reseau = {
  ws:null, dec:null, etat:"vide", url:"", pingT:0, etatT:0,
  connecte:false, idPaquet:1, tentatives:0, rappelT:0
};

/* Identité stable : monId était régénéré à chaque chargement de page,
   ce qui remplissait FileDegats.vus d'identités mortes et empêchait de
   reconnaître un appareil d'une partie à l'autre. */
function idStable(){
  var k = "milyboum:id";
  try{
    var v = localStorage.getItem(k);
    if(v) return v;
    v = idAleatoire(8);
    localStorage.setItem(k, v);
    return v;
  }catch(e){ return idAleatoire(8); }
}

function idAleatoire(n){
  var s = "", a = "abcdefghijklmnopqrstuvwxyz0123456789";
  for(var i = 0; i < n; i++) s += a.charAt((Math.random() * a.length) | 0);
  return s;
}

function connecteRelais(url){
  fermeRelais();
  reseau.url = url;
  reseau.etat = "connexion";
  majEtatReseau();
  var ws;
  try{
    ws = new WebSocket(url, ["mqtt", "mqttv3.1"]);
  }catch(e){
    reseau.etat = "erreur"; majEtatReseau(); planifieReconnexion();
    return;
  }
  ws.binaryType = "arraybuffer";
  reseau.ws = ws;
  reseau.dec = new DecodeurMqtt();

  ws.onopen = function(){
    reseau.etat = "poignee";
    majEtatReseau();
    envoieTrame(paquetConnect("mily-" + monId, 45));
  };
  ws.onmessage = function(ev){
    var oct = new Uint8Array(ev.data);
    reseau.dec.ajoute(oct);
    var p;
    while((p = reseau.dec.suivant()) !== null){
      if(p.type === 2){                                  // CONNACK
        if(p.corps[1] === 0){
          reseau.etat = "abonnement";
          envoieTrame(paquetSubscribe(reseau.idPaquet++, SUJET));
        }else{
          reseau.etat = "refus"; majEtatReseau(); fermeRelais(); planifieReconnexion();
        }
      }else if(p.type === 9){                            // SUBACK
        reseau.etat = "ok";
        reseau.connecte = true;
        reseau.tentatives = 0;
        majEtatReseau();
        /* Un SUBACK par SUBSCRIBE. Cette branche envoyait le SUBSCRIBE
           du sujet monde SANS CONDITION : le SUBACK de ce second
           abonnement rejouait la branche, qui réabonnait, à l'infini —
           « bonjour » réémis et instantané republié à chaque tour, sur
           un courtier public. Le drapeau borne l'abonnement à une fois
           par connexion ; fermeRelais le remet à zéro. */
        if(!reseau.abonneMonde){
          reseau.abonneMonde = true;
          envoieTrame(paquetSubscribe(reseau.idPaquet++, SUJET_MONDE));
          if(monNom) envoie({ t:"bonjour", nom:monNom });
          /* si l'on a du retard à rattraper localement, on le publie :
             notre miroir peut être plus frais que celui du courtier */
          if(monde) mondeSale = true;
        }
      }else if(p.type === 3){                            // PUBLISH
        var m = litPublish(p.corps);
        if(m.sujet === SUJET) recoit(m.message);
        else if(m.sujet === SUJET_MONDE) recoitMonde(m.message);
      }
    }
  };
  ws.onerror = function(){ reseau.etat = "erreur"; majEtatReseau(); };
  ws.onclose = function(){
    reseau.connecte = false;
    if(reseau.etat !== "ferme"){ reseau.etat = "coupe"; majEtatReseau(); planifieReconnexion(); }
  };
}
function planifieReconnexion(){
  reseau.tentatives++;
  reseau.rappelT = Math.min(20, 2 * reseau.tentatives);
}
function fermeRelais(){
  if(reseau.ws){
    try{ if(reseau.ws.readyState === 1) reseau.ws.send(paquetDeconnexion()); }catch(e){}
    try{ reseau.ws.onclose = null; reseau.ws.close(); }catch(e){}
  }
  reseau.ws = null;
  reseau.connecte = false;
  reseau.abonneMonde = false;
}
function envoieTrame(u8){
  if(reseau.ws && reseau.ws.readyState === 1){
    try{ reseau.ws.send(u8); }catch(e){}
  }
}
/* ================================================================
   LE MODE PRÉVISUALISATION

   Une carte ouverte en prévisualisation ne doit RIEN laisser derrière
   elle : ni dégâts publiés, ni champion, ni verrou entamé, ni
   progression avancée. La tentation serait de tout défaire à la
   sortie — restaurer les bâtiments, remonter les PV, effacer les
   scores. Ce serait fragile : il suffirait d'oublier une chose pour
   la voir fuir dans la vraie partie.

   On prend donc l'autre chemin, et c'est le seul qui se démontre :
   ON N'ÉCRIT JAMAIS RIEN. Deux robinets, fermés à la source —
   envoie() et publieMonde() — et plus aucun octet ne sort de cet
   appareil. `monde` n'est pas touché, `jeu` est reconstruit de zéro
   au prochain lancement depuis `carte`. Il n'y a donc rien à
   restaurer : la carte officielle n'a jamais bougé.

   Ce qui reste local et assumé : le classement affiché à l'écran
   pendant le test compte les dégâts du test. Il repart à zéro en
   quittant, et personne d'autre ne l'a jamais vu.
   ================================================================ */
var modeApercu = false;

function envoie(obj){
  obj.id = monId;
  /* PREMIER ROBINET. En prévisualisation, aucun message ne part —
     ni « bonjour », ni dégâts, ni destruction, ni capacité. Les
     autres joueurs ne savent même pas qu'on teste. */
  if(modeApercu) return;
  if(!reseau.connecte) return;
  envoieTrame(paquetPublish(SUJET, JSON.stringify(obj)));
}

/* ---------------------------------------------------------------
   L'INSTANTANÉ DU MONDE
   --------------------------------------------------------------- */

/* Ce que la partie en cours sait du monde, sous forme d'instantané. */
/* ----------------------------------------------------------------
   L'ÉTAT DE TOUTES LES VOIES D'ÉVÉNEMENT, tel que CE client le
   connaît. Il vient toujours de l'instantané reçu — jamais d'un calcul
   local — sauf les deux choses que ce client est seul à savoir : les
   destructions et les PV du Brasier, quand c'est LUI qui est en
   expédition sur cette carte-là.

   IL FAUT LES LIRE TOUTES, à chaque publication, même celles auxquelles
   on ne touche pas. Une publication ne met pas à jour l'instantané,
   elle le REMPLACE : le message est RETENU, et le courtier ne garde que
   le dernier. Un client qui republierait en n'écrivant que la voie qui
   l'intéresse effacerait l'autre pour tout le salon — le verrou de
   48 h de l'autre carte sauterait, ses réglages reviendraient à
   l'usine, et son expédition en cours disparaîtrait.
   ---------------------------------------------------------------- */
function etatEvenements(){
  var m = monde || {}, E = { v:{}, ch:m.ch || "", t3:m.t3 || "" };
  for(var k = 0; k < VOIES_EVT.length; k++){
    var V = VOIES_EVT[k];
    /* Le bonus du SALON fait foi : genereCarte le lit au moment de
       bâtir la carte, et deux joueurs qui n'auraient pas le même
       verraient deux cartes différentes. On le repose à chaque
       lecture de l'instantané. */
    poseBonusPvEvt(V.P, (m[V.P + "b"] !== undefined) ? (m[V.P + "b"] | 0) : undefined);
    var o = voieLue(m, V.P, V.i);
    if(jeu && jeu.index === V.i && evenementEnCours(m, V.P)){
      var bits = [], bl = [], i;
      for(i = 0; i < jeu.batiments.length; i++){
        var b = jeu.batiments[i];
        bits.push(b.vivant ? 0 : 1);
        /* LES BLESSÉS de l'expédition : entamés mais debout. Mêmes
           règles que pour la campagne — un bâtiment tombé est déjà dit
           par d, un bâtiment intact est dit par son absence. */
        if(!b.vivant) continue;
        var n = cranBlessure(b.pv, b.pvMax);
        if(n < BLESSURE_CRANS) bl.push({ i:i, n:n });
      }
      o.d = encodeBits(bits);
      o.bl = encodeBlessures(bl);
      o.q = Math.max(0, Math.round(jeu.qg.pv));
    }
    E.v[V.P] = o;
  }
  return E;
}
/* L'état des événements avec toutes les EXPÉDITIONS remises à zéro,
   mais les RÉGLAGES et les VERROUS intacts. C'est ce que demandent un
   tirage neuf et un plan enregistré : la carte change, donc les
   destructions ne désignent plus rien — mais le verrou de 48 h et le
   minimum de joueurs ne sont pas de la guerre, ce sont des réglages du
   salon, et rien ne justifie de les rendre à l'usine. */
function voiesRemisesAZero(){
  var E = etatEvenements(), k;
  for(k = 0; k < VOIES_EVT.length; k++){
    var u = E.v[VOIES_EVT[k].P];
    u.e = 0; u.f = 0; u.d = ""; u.bl = ""; u.q = 0;
  }
  E.ch = (monde && monde.ch) || "";
  E.t3 = (monde && monde.t3) || "";
  return E;
}
/* Gardée sous son nom, dans les champs de la jungle : c'est la forme
   que les tests et l'ancien code connaissent. */
function jungleCourante(){
  var E = etatEvenements(), j = E.v.j;
  return { je:j.e, jf:j.f, jd:j.d, jbl:j.bl, jq:j.q, jt:j.t,
           jm:j.mj, jmn:j.mn, jb:j.b, ch:E.ch, t3:E.t3 };
}

function mondeCourant(){
  var jg = etatEvenements();
  /* Sans partie en cours, il faut quand même savoir estampiller le
     plan : on peint depuis le briefing, où `jeu` est nul, et sans ça
     un plan tout juste validé ne serait jamais publié. */
  if(!jeu){
    if(!monde) return null;
    /* LE BLINDAGE COMPTE ICI AUSSI, et l'oublier avait un coût précis :
       un client à jour resté à l'accueil aurait renvoyé l'instantané
       tel quel, donc n'aurait JAMAIS republié un blindage qu'un client
       d'une version plus ancienne venait d'effacer en ne le connaissant
       pas. Le réglage se serait perdu pour tout le salon tant que
       personne n'aurait débarqué. */
    if((monde.p || "") === planSalon && (monde.pn | 0) === numeroPlan &&
       (monde.bd || "") === blindageSalon && (monde.bn | 0) === numeroBlindage &&
       (monde.tg | 0) === tirageSalon && memeEvenements(monde, jg)) return monde;
    return poseEvenements({ v:monde.v, cy:monde.cy | 0, c:monde.c, pv:monde.pv, d:monde.d || "",
             bl:monde.bl || "",
             g:monde.g || "", w:monde.w || "", s:monde.s || "", k:monde.k || "",
             p:planSalon, pn:numeroPlan | 0, tg:tirageSalon | 0,
             bd:blindageSalon, bn:numeroBlindage | 0 }, jg);
  }
  /* En expédition, la campagne ne bouge PAS : on republie l'île
     normale telle que l'instantané la connaît, et c'est la voie de la
     jungle qui porte les dégâts. Sans ça, une expédition écraserait
     l'avancée de la campagne avec les PV du Brasier de la jungle. */
  if(carteSpeciale(jeu.index)){
    var mm = monde || mondeVide(0, CARTES[0].pvQG, cycleSalon);
    return poseEvenements({ v:mm.v, cy:mm.cy | 0, c:mm.c, pv:mm.pv, d:mm.d || "",
             bl:mm.bl || "",
             g:mm.g || "", w:mm.w || "", s:tableauScores(), k:mm.k || "",
             p:planSalon, pn:numeroPlan | 0, tg:tirageSalon | 0,
             bd:blindageSalon, bn:numeroBlindage | 0 }, jg);
  }
  var bits = [], bl = [], i;
  for(i = 0; i < jeu.batiments.length; i++){
    var b = jeu.batiments[i];
    bits.push(b.vivant ? 0 : 1);
    /* LES BLESSÉS : entamés MAIS DEBOUT. Un bâtiment tombé est déjà
       dit par `d` et n'a rien à faire ici — c'est `d` qui gagne. Un
       bâtiment intact non plus : absent veut dire intact. */
    if(!b.vivant) continue;
    var n = cranBlessure(b.pv, b.pvMax);
    if(n < BLESSURE_CRANS) bl.push({ i:i, n:n });
  }
  return poseEvenements({ v:(monde ? monde.v : 0), cy:cycleSalon, c:jeu.index,
           pv:Math.max(0, Math.round(jeu.qg.pv)), d:encodeBits(bits),
           bl:encodeBlessures(bl),
           g:jeu.tueurGege || "", w:jeu.tueurTweety || "",
           k:encodeChats(jeu.tueurChats),
           /* Le tableau des dégâts part dans l'instantané RETENU : c'est
              ce qui le fait survivre à la déconnexion de celui qui les a
              faits, et même à la déconnexion de tout le monde. */
           s:tableauScores(),
           p:planSalon, pn:numeroPlan | 0, tg:tirageSalon | 0,
             bd:blindageSalon, bn:numeroBlindage | 0 }, jg);
}

/* Le classement tel qu'on le connaît, prêt à être publié : nos propres
   dégâts, plus tout ce que le registre a retenu des autres. */
/* CE QU'ON PUBLIE : le tableau du salon tel qu'on le connaît, nos
   propres seaux rafraîchis. On ne touche JAMAIS au seau d'un autre —
   c'est ce qui rend deux publications simultanées inoffensives. */
function tableauScores(){
  return encodeScores(scoresAJour());
}

/* ================================================================
   CET INSTANTANÉ PARLE-T-IL DE LA CARTE OÙ L'ON JOUE ?

   LA PORTE ÉTAIT FERMÉE POUR LES EXPÉDITIONS, et c'est ici qu'elle
   l'était. Le test tenait en une ligne — « monde.c === jeu.index » —
   et il était juste tant qu'il n'y avait que la campagne.

   Mais `c` désigne une ÎLE DE CAMPAGNE, et une carte spéciale n'y
   figure jamais : elle vit dans sa voie. La ligne était donc FAUSSE
   pendant toute une expédition, et comme c'est le seul appel à
   appliqueMondeAuJeu du programme, sa branche « carte spéciale » —
   écrite, juste, testée de l'œil — n'a jamais été atteinte une seule
   fois.

   Conséquence mesurée avant correction : deux joueurs dans la même
   jungle ne se partageaient RIEN. Ni les défenses détruites, ni les PV
   du Brasier. Chacun menait son expédition en privé pendant que
   l'instantané, lui, portait fidèlement les dégâts de tout le monde.
   L'écriture était bonne depuis toujours ; personne ne lisait.

   La condition porte maintenant un nom, et c'est le vrai sujet de la
   correction : on peut la rejouer dans les tests, donc on ne peut plus
   refermer la porte sans que quelque chose crie.

   Une carte spéciale n'a pas à se comparer au cycle de campagne : son
   époque à elle est le compteur de lancements de sa voie, et c'est
   fusionneVoie qui la tranche.
   ================================================================ */
function instantanePourMaCarte(m){
  if(!jeu || !m) return false;
  if(carteSpeciale(jeu.index)) return true;
  return m.c === jeu.index && (m.cy | 0) === cycleSalon;
}

/* Adopte un instantané venu d'ailleurs : on le FUSIONNE, jamais on ne
   le recopie. La fusion étant monotone, l'ordre d'arrivée n'a aucune
   importance et deux clients qui publient en même temps convergent. */
function adopteMonde(m, source){
  if(!mondeValide(m)) return;
  var avant = monde;
  monde = fusionneMonde(monde, m);
  if(!memeMonde(avant, monde)) sauveMondeLocal();

  /* Le plan ou le tirage ont changé ailleurs : notre carte n'est plus
     la bonne. On l'adopte AVANT d'appliquer les destructions, sinon on
     éteindrait des bâtiments d'après les indices de l'ancienne carte. */
  /* ══ LE BLINDAGE REÇU S'APPLIQUE SUR-LE-CHAMP ══
     « Dès qu'on modifie un paramètre, ça doit directement être
     appliqué sur la map. » On l'adopte AVANT le plan et avant les
     destructions : la carte qu'on va peut-être refaire doit sortir du
     générateur avec la bonne dureté du premier coup. Et si l'on est
     déjà en jeu sur la carte concernée, on ne la refait pas — on
     REMET SES BÂTIMENTS À L'ÉCHELLE, ce qui garde les ruines, les
     blessures et le score. */
  if((monde.bd || "") !== blindageSalon || (monde.bn | 0) !== numeroBlindage){
    var blAvant = jeu ? blindageDeCarte(jeu.index) : 0;
    poseBlindageSalon(monde.bd || "", monde.bn | 0);
    if(jeu && typeof reblindeLeJeu === "function")
      reblindeLeJeu(jeu.index, blAvant, blindageDeCarte(jeu.index));
    /* ON NE REPEINT LE MENU QUE S'IL EXISTE DÉJÀ. Ce chemin passe aussi
       au démarrage, quand on relit le miroir local : à cet instant les
       sprites des défenses et le briefing ne sont pas encore bâtis, et
       majMondes voudrait peindre douze aperçus avec des sprites qui
       n'existent pas. La branche d'à côté, celle du plan, ne repeint
       pas non plus pour la même raison — elle se contente de
       rafraichitPlan. */
    if(typeof majMondes === "function" && document.getElementById("mn0"))
      majMondes();
    if(typeof rafraichitPlan === "function") rafraichitPlan();
  }

  if((monde.p || "") !== planSalon || (monde.pn | 0) !== numeroPlan ||
     (monde.tg | 0) !== tirageSalon){
    var tiragePrecedent = tirageSalon;
    planSalon   = monde.p || "";
    numeroPlan  = monde.pn | 0;
    tirageSalon = monde.tg | 0;
    if(typeof rafraichitPlan === "function") rafraichitPlan();
    if(jeu && tiragePrecedent !== tirageSalon){
      /* la carte est rebattue : on la refait, il n'y a rien à sauver
         des destructions précédentes, elles ne désignent plus rien */
      nouvelleCarte(jeu.index);
      if(typeof construitFondMini === "function") construitFondMini();
      if(typeof majBarres === "function") majBarres();
      if(typeof message === "function") message("Le plan de défense a changé : nouvelle carte.");
    }
  }
  /* si notre partie en cours ignore des destructions annoncées, on les
     applique tout de suite ; si c'est nous qui en savons plus, on le
     fera savoir à la prochaine publication */
  if(instantanePourMaCarte(monde)){
    appliqueMondeAuJeu(monde);
    if(!memeMonde(monde, mondeCourant())) mondeSale = true;
  }
  /* ================================================================
     UNE CAMPAGNE NEUVE ANNULE LA PARTIE EN COURS

     Sans ça, « Réinitialiser le salon » ne tenait pas deux secondes.
     Le joueur qui appuie remet bien tout à zéro chez lui — île 0,
     Brasier plein, dégâts effacés — mais UN AUTRE JOUEUR resté en
     jeu sur l'île 1 adoptait la campagne neuve tout en gardant sa
     partie, puis republiait « c : 1 » avec le nouveau cycle. Or le
     rang d'un instantané est tg × 1 000 000 + cy × 1 000 + c : à
     campagne et tirage égaux, l'île la plus avancée gagne. Sa partie
     d'avant écrasait donc la remise à zéro, et le salon revenait à
     l'île 1 comme si rien ne s'était passé. Mesuré : remise à zéro
     publiée à c 0, republication à c 1, fusion → c 1.

     Une campagne neuve rend la partie en cours caduque : elle
     appartient à la précédente. On rebâtit donc sur l'île où le salon
     recommence — même geste que pour un plan de défense qui change,
     juste au-dessus.
     ================================================================ */
  var campagneNeuve = (monde.cy | 0) > (cycleSalon | 0);
  if(campagneNeuve){ cycleSalon = monde.cy | 0; carteSalon = monde.c | 0; }
  else if(monde.cy === cycleSalon) carteSalon = Math.max(carteSalon, monde.c | 0);
  if(campagneNeuve && jeu && jeu.index !== carteSalon && !carteSpeciale(jeu.index)){
    nouvelleCarte(carteSalon);
    if(typeof construitFondMini === "function") construitFondMini();
    if(typeof majBarres === "function") majBarres();
    if(typeof majBoutonReprendre === "function") majBoutonReprendre();
    if(typeof message === "function")
      message("Le salon a été réinitialisé : la campagne repart de « "
              + CARTES[carteSalon].nom + " ».");
  }
  /* ON SAIT MAINTENANT DANS QUELLE CAMPAGNE ON JOUE. Tant que ce
     drapeau est bas, tout cumul rangé l'est « à titre provisoire » :
     c'est ce qui permet de l'adopter plutôt que de le jeter quand la
     vraie campagne se révèle. Le miroir local compte autant que le
     relais — il porte le même cy. */
  mondeRecu = true;
  chargeMesDegats();
  if(source === "relais" && avant && !memeMonde(avant, monde)) majMondes();
}

function recoitMonde(txt){
  var m = null;
  try{ m = JSON.parse(txt); }catch(e){ return; }
  adopteMonde(m, "relais");
}

/* Éteint les bâtiments que l'instantané déclare détruits, et abaisse
   les PV du Brasier. Monotone : on ne relève jamais rien. */
function appliqueMondeAuJeu(m){
  if(!jeu || !mondeValide(m)) return;
  /* En prévisualisation, on ne LIT pas non plus : la carte doit être
     montrée intacte, telle qu'elle sortira du générateur, et non
     amputée des défenses que le salon a déjà détruites ailleurs. */
  if(modeApercu) return;
  /* EN EXPÉDITION, c'est la voie de la jungle qui commande, pas la
     campagne : les destructions viennent de jd et les PV de jq. Le
     reste de l'instantané décrit une île à laquelle on ne touche pas
     tant qu'on est dans la jungle. */
  if(carteSpeciale(jeu.index)) return appliqueEvenementAuJeu(m, jeu.index);
  if(m.c !== jeu.index || (m.cy | 0) !== cycleSalon) return;
  var bits = decodeBits(m.d, jeu.batiments.length), i, b, change = 0;
  for(i = 0; i < jeu.batiments.length; i++){
    b = jeu.batiments[i];
    if(bits[i] && b.vivant){
      b.vivant = 0; b.pv = 0;
      marqueEmprise(b, 0);
      change++;
    }
  }
  /* LES BLESSURES arrivent en cours de partie comme les morts : si
     quelqu'un entame un Frelon pendant qu'on joue, on le voit baisser
     tout de suite au lieu d'attendre le prochain chargement. */
  change += appliqueBlessuresAuJeu(m.bl);
  /* le bonus de PV du salon, pour CHAQUE événement : genereCarte le
     lira au moment de bâtir la carte */
  for(var kb = 0; kb < VOIES_EVT.length; kb++){
    var Pb = VOIES_EVT[kb].P;
    if(m[Pb + "b"] !== undefined) poseBonusPvEvt(Pb, m[Pb + "b"] | 0);
  }
  if(m.g && !jeu.tueurGege){
    jeu.tueurGege = String(m.g).substr(0, 14);
    tueGegeLocale();
    change++;
  }
  if(m.w && !jeu.tueurTweety){
    jeu.tueurTweety = String(m.w).substr(0, 14);
    tueCreatureLocale("tweety");
    change++;
  }
  /* Les chats déclarés morts par l'instantané le restent, sans riposte :
     l'instantané dit l'état du monde, pas l'instant du crime — rejouer
     les rayons ici les rejouerait à chaque reconnexion. */
  if(m.k){
    var chm = decodeChats(m.k);
    for(var ec = 0; ec < ESPECES_PROTEGEES.length; ec++){
      var esc = ESPECES_PROTEGEES[ec];
      if(chm[esc] && !jeu.tueurChats[esc]){
        jeu.tueurChats[esc] = chm[esc];
        tueCreatureLocale(esc);
        change++;
      }
    }
  }
  jeu.file.adopteMinimum(m.pv);
  jeu.qg.pv = jeu.file.pv;
  if(change){
    if(jeu.balise && jeu.balise.cible && !jeu.balise.cible.vivant) jeu.balise = null;
    demandeMajBarres();
  }
  return change;
}

/* Le pendant de appliqueMondeAuJeu pour l'expédition : les mêmes
   règles monotones, mais sur la voie de la jungle. Une expédition qui
   s'est terminée ailleurs pendant qu'on jouait renvoie au briefing —
   on ne peut pas rester seul dans une jungle que le salon a fermée. */
function appliqueEvenementAuJeu(m, idx){
  var P = voieDeCarte(idx);
  if(!jeu || !P || jeu.index !== idx) return 0;
  if(!evenementEnCours(m, P)){ if(typeof finExpeditionLocale === "function") finExpeditionLocale(); return 0; }
  var bits = decodeBits(m[P + "d"], jeu.batiments.length), i, b, change = 0;
  for(i = 0; i < jeu.batiments.length; i++){
    b = jeu.batiments[i];
    if(bits[i] && b.vivant){
      b.vivant = 0; b.pv = 0;
      marqueEmprise(b, 0);
      change++;
    }
  }
  /* et les blessures de l'expédition, sur les survivants */
  change += appliqueBlessuresAuJeu(m[P + "bl"] || "");
  var q = m[P + "q"] | 0;
  if(q){ jeu.file.adopteMinimum(q); jeu.qg.pv = jeu.file.pv; }
  if(change){
    if(jeu.balise && jeu.balise.cible && !jeu.balise.cible.vivant) jeu.balise = null;
    demandeMajBarres();
  }
  return change;
}
function appliqueJungleAuJeu(m){ return appliqueEvenementAuJeu(m, IDX_JUNGLE); }

/* ---------------------------------------------------------------
   LE LANCEMENT COLLECTIF

   Le cahier des charges est clair : « Ne lance surtout pas plusieurs
   instances involontairement parce que plusieurs personnes ont appuyé
   presque simultanément. » C'est exactement ce que garantit le couple
   je/jf : lancer, c'est porter je à max(je,jf)+1. Deux joueurs qui
   appuient dans la même seconde calculent tous les deux LE MÊME
   nombre — leurs deux instantanés sont donc identiques, la fusion les
   confond, et il n'y a qu'une expédition. Un troisième qui arrive en
   retard voit je > jf et rejoint au lieu de relancer.
   --------------------------------------------------------------- */
/* Le squelette commun aux quatre écritures d'événement : on repart de
   l'instantané courant, on ne change QUE ce qu'on vient changer, et
   toutes les voies repartent avec. */
function publieEtat(m, jg){
  /* `bl` voyage avec `d`, TOUJOURS. On repart de l'instantané courant
     pour ne changer que la voie, et oublier les blessures ici les
     effacerait de la campagne à chaque lancement d'expédition — une
     défense laissée à moitié faite se retrouverait intacte parce que
     quelqu'un est parti dans la jungle. */
  monde = poseEvenements({ v:(m.v | 0) + 1, cy:m.cy | 0, c:m.c | 0, pv:m.pv,
                       d:m.d || "", bl:m.bl || "",
                       g:m.g || "", w:m.w || "", s:m.s || "",
                       k:m.k || "", p:planSalon, pn:numeroPlan | 0,
                       tg:tirageSalon | 0,
                       bd:blindageSalon, bn:numeroBlindage | 0 }, jg);
  sauveMondeLocal();
  publieMonde(true);
}

function lanceExpedition(idx){
  if(idx === undefined) idx = IDX_JUNGLE;
  var P = voieDeCarte(idx);
  if(!P) return false;
  var m = monde || mondeVide(0, CARTES[0].pvQG, cycleSalon);
  if(evenementEnCours(m, P)) return false;         // déjà en cours : on rejoint
  var jg = etatEvenements(), u = jg.v[P];
  u.e = Math.max(u.e, u.f) + 1;
  u.d = ""; u.q = CARTES[idx].pvQG;                // une expédition neuve
  publieEtat(m, jg);
  return true;
}

/* La fin de l'expédition : f rattrape e, l'heure est estampillée pour
   le verrou, et le champion de la carte est inscrit. */
function termineExpedition(idx, champion){
  /* L'ancienne signature était termineExpedition(champion) : un seul
     argument, la jungle sous-entendue. On l'accepte encore, sinon un
     appel oublié quelque part sacrerait « [object Object] ». */
  if(typeof idx === "string" || idx === undefined){ champion = idx; idx = IDX_JUNGLE; }
  var P = voieDeCarte(idx);
  if(!P) return false;
  var m = monde || mondeVide(0, CARTES[0].pvQG, cycleSalon);
  var jg = etatEvenements(), u = jg.v[P];
  if(u.e <= u.f) return false;                     // déjà terminée ailleurs
  u.f = u.e;
  u.t = Date.now();
  u.d = ""; u.q = 0;
  jg.ch = inscritChampion(jg.ch, idx, champion);
  /* Une carte événement grave son podium comme les autres îles : c'est
     la même promesse, et elle n'avait tout simplement pas été tenue
     ici. */
  jg.t3 = inscritTop3((jg.t3 || m.t3 || ""), idx,
                      classementDepuis(totalParJoueurCarte(scoresAJour(), idx)).slice(0, 3));
  publieEtat(m, jg);
  return true;
}

/* Inscrit le champion d'une carte, en incrémentant son numéro de
   victoire — c'est ce numéro qui rend la fusion monotone. */
function inscritChampion(ch, index, nom){
  var t = decodeChampions(ch);
  var n = (t[index] ? t[index].n : 0) + 1;
  t[index] = { nom:String(nom || "?").substr(0, 14), n:n };
  return encodeChampions(t);
}
/* Sacre le champion d'une carte ORDINAIRE et le publie. La jungle a
   son propre chemin (termineExpedition), qui inscrit le champion en
   même temps qu'il referme l'expédition. */
/* LE SACRE : le champion ET le podium, gelés ensemble.
   Les deux décrivent la même victoire, ils montent donc du même cran
   et par le même chemin — sans quoi une carte pourrait afficher un
   champion d'une bataille et un podium d'une autre. */
function sacreChampion(index, nom){
  var m = monde || mondeVide(0, CARTES[0].pvQG, cycleSalon);
  var jg = etatEvenements();
  jg.ch = inscritChampion(jg.ch, index, nom);
  /* Le podium de CETTE bataille : les dégâts infligés sur CETTE île,
     pas le total des joueurs. Ce sont deux classements différents, et
     c'est celui de la bataille qu'on grave. */
  var podium = classementDepuis(totalParJoueurCarte(scoresAJour(), index));
  /* LE PODIUM SE POSE SUR jg, EXACTEMENT COMME LE CHAMPION DEUX LIGNES
     PLUS HAUT — et jamais dans le littéral. poseJungle recopie `ch` ET
     `t3` depuis son second argument par-dessus ce qu'il reçoit : passer
     le podium dans l'objet revenait à l'écrire pour se le faire effacer
     dans la foulée. Le champion, lui, survivait ; le podium, non. Rien
     n'a donc jamais été gravé dans t3, et top3Salon() rendait null pour
     les six îles : seule la carte en cours montrait un classement, le
     vivant, et la phrase de victoire — qui ne s'affiche que sur un
     podium gelé — était injoignable. */
  jg.t3 = inscritTop3((jg.t3 || m.t3 || ""), index, podium.slice(0, 3));
  publieEtat(m, jg);
}
/* Le podium d'une carte, tel que le salon le connaît. */
function top3Salon(index){ return top3DeCarte(monde && monde.t3, index); }

/* Le champion d'une carte, tel que le salon le connaît. */
function championDeCarte(index){
  var t = decodeChampions(monde ? monde.ch : "");
  return t[index] ? t[index].nom : "";
}
/* Le minimum de joueurs en vigueur dans ce salon, POUR CETTE CARTE.
   Chaque événement a le sien : ils n'ont aucune raison de demander le
   même monde. */
function minJoueursEvt(idx){
  var P = voieDeCarte(idx);
  if(!P) return 0;
  return (monde && (monde[P + "m"] | 0)) || reglagesEvt(idx).minJoueurs;
}
function minJoueursJungle(){ return minJoueursEvt(IDX_JUNGLE); }
/* Le réglage administrateur : on incrémente son numéro pour que la
   fusion sache lequel est le plus récent. */
function regleReglagesEvt(idx, n, pv){
  var P = voieDeCarte(idx);
  if(!P) return 0;
  var m = monde || mondeVide(0, CARTES[0].pvQG, cycleSalon);
  var jg = etatEvenements(), u = jg.v[P];
  u.mj = borne(n | 0, 1, 60);
  if(typeof pv === "number" && isFinite(pv)) u.b = borne(Math.round(pv), 0, 900);
  u.mn = (u.mn | 0) + 1;
  publieEtat(m, jg);
  return u.mj;
}
function regleMinJoueurs(n, pv){ return regleReglagesEvt(IDX_JUNGLE, n, pv); }

/* ================================================================
   LE BLINDAGE, RÉGLÉ DEPUIS L'ACCUEIL

   Même discipline que le plan : on modifie la table, on incrémente
   SON numéro, on republie. Le numéro est ce qui fait qu'une édition
   récente l'emporte sur une table plus ancienne reçue en retard —
   sans lui, deux clients se renverraient éternellement leurs versions.

   Et l'on applique CHEZ SOI dans la foulée, sans attendre le retour
   du relais : le joueur qui vient de régler doit voir sa carte
   changer tout de suite. Les autres l'auront à l'instantané suivant,
   par le chemin d'à côté (voir l'adoption dans recoitMonde).
   ================================================================ */
function regleBlindage(index, pourcent){
  if(!(index >= 0) || index >= CARTES.length) return 0;
  var t = decodeBlindages(blindageSalon);
  var avant = t[index] | 0;
  t[index] = borne(Math.round(pourcent), 0, BLINDAGE_MAX);
  var chaine = encodeBlindages(t);
  if(chaine === blindageSalon && (t[index] | 0) === avant) return avant;
  poseBlindageSalon(chaine, (numeroBlindage | 0) + 1);
  if(jeu) reblindeLeJeu(index, avant, t[index] | 0);
  var m = monde || mondeVide(0, CARTES[0].pvQG, cycleSalon);
  publieEtat(m, etatEvenements());
  return t[index] | 0;
}
/* Combien de millisecondes avant que cette carte rouvre. 0 = ouverte.
   L'heure de référence vient de l'instantané PARTAGÉ : un client dont
   l'horloge retarde ne peut pas ouvrir la carte plus tôt pour les
   autres, puisque c'est <P>t qui fait foi et qu'il ne redescend pas.
   Chaque événement a SON verrou, et ils ne se parlent pas : une
   expédition dans la jungle n'a jamais fermé une autre carte. */
function attenteEvenement(idx){
  var P = voieDeCarte(idx);
  if(!P) return 0;
  var t = monde ? msMonde(monde[P + "t"]) : 0;
  if(!t) return 0;
  var reste = t + reglagesEvt(idx).attenteH * 3600000 - Date.now();
  return reste > 0 ? reste : 0;
}
function attenteJungle(){ return attenteEvenement(IDX_JUNGLE); }

/* Gégé est morte ailleurs : elle l'est aussi ici, sans rejouer le
   deuil ni recréditer d'Énergie. */
function tueCreatureLocale(espece){
  if(!jeu) return;
  for(var i = 0; i < jeu.creatures.length; i++){
    var k = jeu.creatures[i];
    if(k.t === espece && k.pv > 0) k.pv = 0;
  }
}
function tueGegeLocale(){ tueCreatureLocale("belette"); }

/* ---------------------------------------------------------------
   REMISE À ZÉRO DU SALON
   Le monde étant partagé et retenu par le courtier, une remise à zéro
   purement locale serait écrasée dans la seconde par l'instantané du
   relais. Il faut donc publier un monde neuf — et le faire GAGNER, ce
   qu'assure le numéro de campagne : la fusion étant monotone, un cycle
   supérieur écrase tout, chez tout le monde, y compris chez ceux qui se
   connecteront demain.

   Le mot de passe n'est pas une sécurité — le jeu est un fichier que
   n'importe qui peut lire. C'est un cran d'arrêt : il empêche une
   fausse manœuvre et un joueur de passage d'effacer la partie de tous.
   --------------------------------------------------------------- */
/* Mot de passe des deux actions réservées : remettre le salon à zéro et
   changer le plan de défense. Un seul endroit à modifier. */
/* ----------------------------------------------------------------
   LE MOT DE PASSE — ce qu'il protège, et ce qu'il ne protège pas

   Soyons francs : le jeu est UN FICHIER HTML que n'importe qui peut
   ouvrir dans un éditeur de texte. Il n'y a pas de serveur, donc il
   n'y a rien à faire vérifier par un serveur. Un mot de passe écrit
   ici, en clair ou non, ne peut pas être un secret.

   Ce qu'on gagne à le hacher : il ne se lit plus en parcourant le
   fichier, et il ne s'échappe pas d'une capture d'écran du code. Ce
   qu'on ne gagne pas : quelqu'un qui ouvre la console du navigateur
   appelle directement remetSalonAZero() ou ouvreApercuAdmin() sans
   jamais voir la fenêtre. C'est donc une PROTECTION D'INTERFACE — un
   cran d'arrêt contre la fausse manœuvre et le joueur de passage —
   et jamais une sécurité.

   Le jour où le jeu aura un serveur, c'est lui qui devra refuser une
   remise à zéro non autorisée, et cette fonction ne servira plus qu'à
   éviter d'afficher un bouton pour rien.
   ---------------------------------------------------------------- */
/* FNV-1a 32 bits : trois lignes, pas de dépendance, et le mot ne se
   lit plus dans le fichier. */
function empreinteMot(s){
  var h = 0x811c9dc5;
  s = String(s).trim().toLowerCase();
  for(var i = 0; i < s.length; i++){
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}
var EMPREINTE_RAZ = 3344921544;
function motAdminValide(mot){
  return mot !== null && empreinteMot(mot) === EMPREINTE_RAZ;
}
/* Conservé pour les messages qui le citent ; plus aucun test ne
   compare directement à lui. */
var MOT_RAZ = null;

function remetSalonAZero(){
  scoresSalon = {};            // l'île repart à neuf, le tableau aussi
  cycleSalon = (cycleSalon | 0) + 1;
  carteSalon = 0;
  /* Nouveau tirage : les défenses sont rebattues selon le plan en
     vigueur. Même recette, autre carte — c'est ce qui fait qu'on ne
     rejoue jamais deux fois la même île. Le PLAN, lui, survit : la
     remise à zéro efface la guerre, pas le dessin. */
  tirageSalon = (tirageSalon | 0) + 1;
  /* LES CHAMPIONS ET LES PODIUMS TRAVERSENT LA REMISE À ZÉRO.
     Elle efface la GUERRE — les destructions, la vie du Brasier, le
     tableau des dégâts —, pas la mémoire de qui a pris quoi. C'est
     même précisément ce que « Derniers champions » veut dire sur une
     vignette verrouillée : une île prise lors d'un cycle précédent.
     Les reconstruire sans `ch` ni `t3` effaçait cet historique à
     chaque remise à zéro, localement d'abord, puis chez tout le monde
     à la première publication.

     ET IL FAUT REPOSER TOUTE LA JUNGLE AVEC.
     Le littéral ne portait AUCUN de ses champs — ni je/jf/jd/jq (l'état
     de l'expédition), ni jt (le verrou de 48 h que lit jungleEnCours),
     ni jm/jb (le minimum de joueurs et le bonus de PV, deux réglages
     d'administrateur). Ils partaient tous à la première publication,
     en message RETENU : une remise à zéro rouvrait la jungle et
     rendait au salon les réglages d'usine, sans que personne l'ait
     demandé. poseJungle les recopie depuis jungleCourante(), qui les
     lit sur l'instantané d'avant — c'est exactement à ça qu'il sert. */
  var av = monde || {};
  var jg = etatEvenements();
  jg.ch = av.ch || "";
  jg.t3 = av.t3 || "";
  monde = poseEvenements({ v:(av.v | 0) + 1, cy:cycleSalon, c:0,
            pv:CARTES[0].pvQG, d:"", bl:"", g:"", w:"", s:"", k:"",
            p:planSalon, pn:numeroPlan | 0, tg:tirageSalon,
            bd:blindageSalon, bn:numeroBlindage | 0 }, jg);
  sauveMondeLocal();
  if(reseau.connecte) envoieTrame(paquetPublish(SUJET_MONDE, JSON.stringify(monde), true));
  return monde;
}

/* Le joueur vient de valider un nouveau plan. C'est un changement de
   carte : on repart sur un tirage neuf, donc sur une île intacte —
   les bâtiments détruits de l'ancienne carte ne désignent plus rien. */
/* Enregistre le plan d'UNE carte dans le paquet du salon. Les autres
   cartes gardent le leur : c'est tout l'objet de la refonte. */
/* Le tirage neuf, demandé exprès. Les recettes ne bougent pas d'une
   virgule — les six plans sont republiés tels quels — mais chaque île
   est réalisée autrement : d'autres positions, d'autres décors,
   d'autres bestioles. C'est le pendant du bouton « Régénérer » de
   l'éditeur, qui ne changeait jusqu'ici que l'aperçu. */
/* ----------------------------------------------------------------
   LA CAMPAGNE BOUCLE — et le tableau des dégâts repart avec elle.

   Les cinq îles sont tombées, on recommence. L'interface faisait
   simplement « cycleSalon++ » puis nouvelleCarte(0), sans rien
   publier : le tableau des dégâts de la campagne écoulée restait donc
   dans l'instantané, alors que le cumul LOCAL, lui, repartait de zéro.
   Or scoresAJour garde le MAXIMUM par clé, et la clé ne porte pas la
   campagne. Le joueur reprenait l'île 4, détruisait tout ce qu'il
   pouvait, et son podium restait figé sur les 38 000 000 de la
   campagne précédente : il lui aurait fallu refaire 38 000 000 sur
   cette seule île pour gagner UN point. Son propre score devenait le
   mur qu'il avait déjà à franchir avant qu'on répare le compteur.

   On publie donc s:"" exactement comme le font remetSalonAZero et
   nouveauTirageSalon, et pour la même raison — « une campagne neuve
   efface la guerre ». Les champions et les podiums, eux, traversent :
   c'est précisément là que « Derniers champions » prend son sens.
   ---------------------------------------------------------------- */
function nouvelleCampagneSalon(){
  cycleSalon = (cycleSalon | 0) + 1;
  /* premiereCarte(), et non « 0 » écrit en dur : c'est l'ordre de
     campagne qui dit où l'on repart. Aujourd'hui les deux valent la
     même chose ; le jour où l'île d'ouverture change, ce code n'aura
     rien à apprendre. */
  var depart = premiereCarte();
  carteSalon = depart;
  scoresSalon = {};
  var av = monde || {};
  var jg = etatEvenements();
  jg.ch = av.ch || "";
  jg.t3 = av.t3 || "";
  monde = poseEvenements({ v:(av.v | 0) + 1, cy:cycleSalon, c:depart,
            pv:CARTES[depart].pvQG, d:"", bl:"", g:"", w:"", s:"", k:"",
            p:planSalon, pn:numeroPlan | 0, tg:tirageSalon | 0,
             bd:blindageSalon, bn:numeroBlindage | 0 }, jg);
  chargeMesDegats();          // le cumul local suit la campagne
  degatsReplies = 0;
  sauveMondeLocal();
  if(reseau.connecte) envoieTrame(paquetPublish(SUJET_MONDE, JSON.stringify(monde), true));
  return cycleSalon;
}

function nouveauTirageSalon(){
  numeroPlan  = (numeroPlan | 0) + 1;
  tirageSalon = (tirageSalon | 0) + 1;
  cycleSalon  = (cycleSalon | 0) + 1;
  carteSalon  = 0;
  /* LES VOIES D'ÉVÉNEMENT SE REMETTENT À ZÉRO, MAIS PAS LEURS
     RÉGLAGES. Ces champs étaient écrits à la main, dans les noms de la
     jungle : une carte événement ajoutée après coup se serait fait
     effacer son verrou et ses réglages à chaque tirage neuf, sans que
     personne le voie. voiesRemisesAZero() le fait pour toutes. */
  monde = poseEvenements({ v:(monde ? monde.v : 0) + 1, cy:cycleSalon, c:0,
            pv:CARTES[0].pvQG, d:"", bl:"", g:"", w:"",
            p:planSalon, pn:numeroPlan, tg:tirageSalon, s:"", k:"",
            bd:blindageSalon, bn:numeroBlindage | 0 },
            voiesRemisesAZero());
  sauveMondeLocal();
  if(reseau.connecte) envoieTrame(paquetPublish(SUJET_MONDE, JSON.stringify(monde), true));
  return tirageSalon;
}

function enregistrePlanCarte(index, chaine){
  var t = decodePlans(planSalon);
  if(chaine) t[index] = chaine; else delete t[index];
  var r = enregistrePlan(encodePlans(t));
  /* Les onglets portent la pastille « déjà enregistrée » : ils doivent
     la voir apparaître au moment où elle devient vraie. */
  if(typeof construitOngletsCartes === "function") construitOngletsCartes();
  return r;
}
/* ----------------------------------------------------------------
   ENREGISTRER UN PLAN NE RETIRE PLUS TOUTE LA CAMPAGNE AU SORT

   LE DÉFAUT. Cette fonction incrémentait `tirageSalon`, et
   genereCarte() en tire la graine de CHAQUE île :
     gr = tirage ? graineTexte(salon + "#" + index + "@" + tirage) : …
   Autrement dit, enregistrer le plan de la soirée hippie redessinait
   aussi la plage, la forêt, la campagne, le Sud et la jungle — leurs
   décors, leurs rochers, leurs bestioles, tout. Les cinq autres
   gardaient bien leur PLAN, mais plus leur RÉALISATION. C'était le
   dernier endroit où éditer une carte en touchait six, et il ne se
   voyait pas : le plan, lui, était bien resté isolé.

   CE QU'ON GARDE. Le numéro de campagne monte toujours, et la carte
   repart de la première île : les bâtiments ont changé, le tableau des
   destructions ne veut plus rien dire, il faut repartir. Mais le
   TIRAGE, lui, ne bouge plus tout seul.

   POUR REJOUER LA MÊME RECETTE AUTREMENT, il y a un bouton, et il le
   dit : « Nouveau tirage ». Un geste explicite plutôt qu'un effet de
   bord.
   ---------------------------------------------------------------- */
function enregistrePlan(chaine){
  if(chaine === planSalon) return false;
  planSalon   = chaine;
  numeroPlan  = (numeroPlan | 0) + 1;
  cycleSalon  = (cycleSalon | 0) + 1;
  carteSalon  = 0;
  /* LES VOIES D'ÉVÉNEMENT SE REMETTENT À ZÉRO, MAIS PAS LEURS
     RÉGLAGES. Ces champs étaient écrits à la main, dans les noms de la
     jungle : une carte événement ajoutée après coup se serait fait
     effacer son verrou et ses réglages à chaque tirage neuf, sans que
     personne le voie. voiesRemisesAZero() le fait pour toutes. */
  monde = poseEvenements({ v:(monde ? monde.v : 0) + 1, cy:cycleSalon, c:0,
            pv:CARTES[0].pvQG, d:"", bl:"", g:"", w:"",
            p:planSalon, pn:numeroPlan, tg:tirageSalon, s:"", k:"",
            bd:blindageSalon, bn:numeroBlindage | 0 },
            voiesRemisesAZero());
  sauveMondeLocal();
  if(reseau.connecte) envoieTrame(paquetPublish(SUJET_MONDE, JSON.stringify(monde), true));
  return true;
}

/* Miroir local : le courtier public ne garantit pas de conserver ses
   messages retenus éternellement. On garde donc le même instantané
   dans le navigateur, et on adopte le plus complet des deux. */
function sauveMondeLocal(){
  if(!monde) return;
  try{ localStorage.setItem(CLE_MONDE, JSON.stringify(monde)); }catch(e){}
}
function chargeMondeLocal(){
  try{
    var t = localStorage.getItem(CLE_MONDE);
    if(t) adopteMonde(JSON.parse(t), "local");
  }catch(e){}
}

/* Publication étranglée. Le drapeau n'est levé que lorsqu'on apporte
   réellement du nouveau : sans cela, deux clients se renverraient
   l'instantané en boucle. */
function signaleMonde(){ mondeSale = true; }

/* Enregistre l'état courant, et le publie si le relais répond. Le
   miroir local ne dépend PAS du réseau : en solo, ou pendant une
   coupure, c'est lui seul qui garde le monde. */
function publieMonde(force){
  /* SECOND ROBINET. L'instantané retenu est le seul état durable du
     salon : ne pas l'écrire, c'est garantir qu'une prévisualisation
     ne laisse aucune trace, où que ce soit. */
  if(modeApercu) return;
  var m = mondeCourant();
  if(!mondeValide(m)) return;
  if(!force && memeMonde(monde, m) && !mondeSale) return;
  monde = fusionneMonde(monde, m);
  monde.v = (monde.v || 0) + 1;
  mondeSale = false;
  mondeT = 0;
  sauveMondeLocal();
  if(reseau.connecte) envoieTrame(paquetPublish(SUJET_MONDE, JSON.stringify(monde), true));
}

/* Appelée par la boucle principale, connecté ou non. */
function majMonde(dt){
  if(!jeu) return;
  mondeT += dt;
  if(mondeT < PERIODE_MONDE) return;
  if(mondeSale || !memeMonde(monde, mondeCourant())) publieMonde(false);
  else mondeT = 0;
}

/* ---------------------------------------------------------------
   Réception
   --------------------------------------------------------------- */
function recoit(txt){
  var m;
  try{ m = JSON.parse(txt); }catch(e){ return; }
  if(!m || !m.id) return;
  if(m.id === monId){
    /* notre propre message revient en boucle : les numéros de série
       font que rien n'est appliqué deux fois. */
    return;
  }
  var j = autresJoueurs[m.id];
  if(!j){
    j = autresJoueurs[m.id] = { nom:"?", n:0, g:0, unites:[], fantome:null, vu:0 };
  }
  j.vu = tempsGlobal;

  if(m.t === "bonjour"){
    j.nom = (m.nom || "?").substr(0, 14);
    noteScore(m.id, j.nom, 0);
    if(jeu) envoie({ t:"sync", nom:monNom, c:jeu.index, pv:jeu.qg.pv });
    annonce("<b>" + echappe(j.nom) + "</b> a rejoint le salon");
    if(typeof chatSysteme === "function") chatSysteme(j.nom + " a rejoint le salon.");
  }else if(m.t === "chat"){
    /* Le chat est un message ordinaire de plus sur le sujet vivant :
       aucun sujet supplémentaire, aucune rétention, rien de changé au
       protocole. Le pseudo affiché est celui que NOUS connaissons pour
       cet identifiant, pas celui que le message annonce. */
    j.nom = (m.nom || j.nom || "?").substr(0, 14);
    if(typeof recoitChat === "function") recoitChat(j, m);
  }else if(m.t === "sync"){
    j.nom = (m.nom || "?").substr(0, 14);
    /* `monde` peut encore être nul : le sujet des joueurs est souscrit
       AVANT celui du monde, donc un « sync » arrive parfois avant le
       moindre instantané. Sans cette garde, l'exception remontait dans
       ws.onmessage et interrompait la boucle de décodage — les paquets
       restants du tampon étaient perdus avec elle. */
    if(monde){
      if(monde.cy > cycleSalon){ cycleSalon = monde.cy | 0; carteSalon = monde.c | 0; }
      else if(monde.cy === cycleSalon) carteSalon = Math.max(carteSalon, monde.c | 0);
    }
    if(jeu && typeof m.c === "number" && m.c === jeu.index && typeof m.pv === "number"){
      jeu.file.adopteMinimum(m.pv);
      jeu.qg.pv = jeu.file.pv;
      demandeMajBarres();
    }
    majMondes();
  }else if(m.t === "etat"){
    j.n = m.n | 0;
    j.g = m.g | 0;
    j.nom = m.nom ? m.nom.substr(0, 14) : j.nom;
    j.seau = m.sq ? nettoieSeau(m.sq) : (j.seau || "");
    /* borné à la table : un palier reçu hors de ses clous ne doit pas
       aller chercher une ligne qui n'existe pas */
    j.palier = borne(m.pu | 0, 0, PALIERS_PUISSANCE.length - 1);
    noteScore(m.id, j.nom, j.g, j.seau);
    /* APRÈS noteScore, jamais avant : c'est lui qui crée la ligne de
       ce joueur dans le registre. Posé au-dessus, le tout premier
       message d'un joueur perdait son score d'île. */
    if(typeof m.gc === "number" && m.gc >= 0 && m.gc <= plafondScore()){
      var ent = scoresSalon[m.id];
      if(ent){ ent.gc = m.gc; ent.gcC = m.gcC | 0; }
    }
    majUnitesDistantes(j, m.p || []);
    if(m.m && m.f){
      if(!j.fantome) j.fantome = { gx:m.f[0], gy:m.f[1], ph:Math.random() * 6, nom:j.nom };
      j.fantome.gx = m.f[0]; j.fantome.gy = m.f[1]; j.fantome.nom = j.nom;
    }else j.fantome = null;
    majPodium();
  }else if(m.t === "deg"){
    if(jeu && typeof m.d === "number" && typeof m.s === "number" &&
       (typeof m.c !== "number" || m.c === jeu.index)){
      jeu.file.applique(m.id, m.s, m.d);
      jeu.qg.pv = jeu.file.pv;
      if(jeu.qg.pv <= 0 && !jeu.fin) declencheFin();
      demandeMajBarres();
    }
  }else if(m.t === "det"){
    if(jeu && typeof m.n === "number" && (typeof m.c !== "number" || m.c === jeu.index)){
      var b = jeu.batiments[m.n];
      if(b && b.vivant && b.n === m.n){
        b.vivant = 0; b.pv = 0;
        marqueEmprise(b, 0);
        jeu.effets.push({ t:"boum", gx:b.gx, gy:b.gy, age:0, duree:0.6, r:b.e * 0.6, force:0.8 });
        if(jeu.balise && jeu.balise.cible === b) jeu.balise = null;
        signaleMonde();
      }
    }
  }else if(m.t === "ici"){
    /* signe de vie d'un joueur encore au briefing : rien à faire de
       plus, j.vu vient d'être rafraîchi et son nom est à jour */
    if(m.nom) j.nom = String(m.nom).substr(0, 14);
    noteScore(m.id, j.nom, 0);
  }else if(m.t === "cap"){
    /* Capacité d'un autre joueur, sur NOTRE île : on la voit, et ses
       zones agissent — son Cryo gèle nos défenses, son Brouillard
       cache nos troupes, son Soin les répare, ses Poulets détournent
       les tourelles. lanceCapacite(distante=vrai) n'inflige aucun
       dégât local : les siens arrivent par « deg »/« det ». */
    if(jeu && !jeu.fin && m.c === jeu.index &&
       typeof m.x === "number" && typeof m.y === "number" &&
       isFinite(m.x) && isFinite(m.y) &&
       Object.prototype.hasOwnProperty.call(CAP, m.m) && m.m !== "balise"){
      lanceCapacite(m.m, borne(m.x, 0, GW), borne(m.y, 0, GH), true);
    }
  }else if(m.t === "gege"){
    if(jeu && (typeof m.c !== "number" || m.c === jeu.index) && !jeu.tueurGege){
      jeu.tueurGege = (m.nom || "?").substr(0, 14);
      jeu.messageGege = 3.0;
      tueGegeLocale();
      son.gege();
      signaleMonde();
      demandeMajBarres();
    }
  }else if(m.t === "tweety"){
    if(jeu && (typeof m.c !== "number" || m.c === jeu.index) && !jeu.tueurTweety){
      jeu.tueurTweety = (m.nom || "?").substr(0, 14);
      jeu.messageTweety = 3.0;
      tueCreatureLocale("tweety");
      son.tweety();
      signaleMonde();
      demandeMajBarres();
    }
  }else if(m.t === "veng"){
    /* Un chat de Mily est tombé chez quelqu'un d'autre : tout le salon
       assiste à la riposte, et chaque client décide seul du sort de SES
       troupes — les traînées ne s'arrêtent pas au coupable. */
    if(jeu && !jeu.fin && (typeof m.c !== "number" || m.c === jeu.index) &&
       ESPECES_PROTEGEES.indexOf(m.e) >= 0 && !jeu.tueurChats[m.e]){
      jeu.tueurChats[m.e] = (m.nom || "?").substr(0, 14);
      declencheVengeance(m.e, jeu.tueurChats[m.e], m.kx, m.ky);
      tueCreatureLocale(m.e);
      signaleMonde();
      demandeMajBarres();
    }
  }else if(m.t === "carte"){
    if(typeof m.c === "number" && m.c > carteSalon){
      carteSalon = m.c;
      if(jeu && !jeu.fin && jeu.index < m.c) montreBilan();
    }
  }else if(m.t === "adieu"){
    if(autresJoueurs[m.id] && autresJoueurs[m.id].nom !== "?"){
      annonce("<b>" + echappe(autresJoueurs[m.id].nom) + "</b> a quitté le salon");
      if(typeof chatSysteme === "function")
        chatSysteme(autresJoueurs[m.id].nom + " a quitté le salon.");
    }
    delete autresJoueurs[m.id];
    majPodium();
  }
}
function majUnitesDistantes(j, p){
  var i;
  for(i = 0; i < p.length; i++){
    var e = p[i];
    if(!j.unites[i]){
      j.unites[i] = { gx:e[0], gy:e[1], cx:e[0], cy:e[1], type:"furie", droite:true, phase:Math.random() * 6 };
    }
    var u = j.unites[i];
    u.cx = e[0]; u.cy = e[1];
    var code = e[2] | 0;
    u.type = TYPES_TROUPE[borne(code >> 1, 0, TYPES_TROUPE.length - 1)] || "furie";
    u.droite = !!(code & 1);
  }
  j.unites.length = p.length;
}
function interpoleDistants(dt){
  for(var id in autresJoueurs){
    var j = autresJoueurs[id];
    if(tempsGlobal - j.vu > 15){ delete autresJoueurs[id]; majPodium(); continue; }
    for(var i = 0; i < j.unites.length; i++){
      var u = j.unites[i];
      var dx = u.cx - u.gx, dy = u.cy - u.gy;
      var d = Math.hypot(dx, dy);
      if(d > 12){ u.gx = u.cx; u.gy = u.cy; continue; }
      var k = Math.min(1, dt * 5);
      u.gx += dx * k; u.gy += dy * k;
      /* même cadence de pas que chez soi, sinon les troupes des autres
         marchent au ralenti ou trottinent */
      if(d > 0.02) u.phase += dt * (u.type === "ogre" ? 4.1
                                  : u.type === "commando" ? 6.2
                                  : u.type === "doc" ? 7.4 : 8.6);
    }
  }
}

/* ---------------------------------------------------------------
   Émission périodique
   --------------------------------------------------------------- */
function majReseau(dt){
  if(reseau.rappelT > 0){
    reseau.rappelT -= dt;
    if(reseau.rappelT <= 0 && !reseau.connecte) connecteRelais(reseau.url);
  }
  if(!reseau.connecte) return;
  reseau.pingT -= dt * 1000;
  if(reseau.pingT <= 0){ reseau.pingT = EQ.PERIODE_PING; envoieTrame(paquetPing()); }

  /* Présence depuis le BRIEFING : sans partie lancée on n'émet aucun
     « etat », donc l'autre joueur disparaissait du salon au bout de la
     purge alors qu'il était bel et bien là, en train de composer sa
     flotte. Un petit signe de vie suffit. */
  if(!jeu){
    reseau.iciT = (reseau.iciT || 0) - dt * 1000;
    if(reseau.iciT <= 0 && monNom){
      reseau.iciT = 4000;
      envoie({ t:"ici", nom:monNom });
    }
  }

  reseau.etatT -= dt * 1000;
  if(reseau.etatT <= 0){
    reseau.etatT = EQ.PERIODE_ETAT;
    if(jeu){
      /* 20 unités échantillonnées */
      var p = [], n = jeu.unites.length;
      var pas = Math.max(1, Math.ceil(n / EQ.UNITES_DIFFUSEES));
      for(var i = 0; i < n && p.length < EQ.UNITES_DIFFUSEES; i += pas){
        var u = jeu.unites[i];
        /* LE TYPE TIENT MAINTENANT SUR DEUX BITS, ET LE CHANGEMENT EST
           COMPATIBLE DANS LES DEUX SENS. Le bit 0 reste l'orientation ;
           au-dessus, on écrit l'INDICE dans TYPES_TROUPE au lieu d'un
           unique drapeau « commando ». Comme furie vaut 0 et commando 1,
           les deux valeurs qu'un ancien client sait produire (0 et 2)
           gardent exactement le sens qu'elles avaient. Un ancien client
           qui reçoit un Ogre ou un Doc lit son bit 1 et affiche une
           Furie ou un Commando : une silhouette approximative, jamais
           une erreur. Et l'Ogre, qui n'était pas transmis du tout, l'est
           enfin. */
        var it = TYPES_TROUPE.indexOf(u.t);
        if(it < 0) it = 0;
        p.push([Math.round(u.gx * 10) / 10, Math.round(u.gy * 10) / 10,
                (it << 1) + (u.droite ? 1 : 0)]);
      }
      /* `g` est le TOTAL de l'expéditeur, pas ses dégâts de la partie
         en cours : c'est un total qui ne fait que monter, donc le
         maximum qu'en prend le destinataire est juste. Envoyer les
         dégâts de partie, c'était envoyer un nombre qui repart à zéro
         à chaque île — et c'est ce qui figeait les scores. */
      /* `sq` : NOTRE SEAU. Il tient en quatre caractères et il vaut
         cher — c'est lui qui permet au destinataire de rattacher ce
         total vivant à la bonne ligne du tableau partagé, au lieu de
         le classer sous un pseudo. Sans lui, un joueur qui se
         renommait apparaissait DEUX FOIS au classement : son ancien
         nom, encore dans le tableau, et le nouveau, apporté par ce
         message-ci. Un champ inconnu est ignoré par les versions
         précédentes, donc l'ajout ne casse rien. */
      /* `pu` : le palier de puissance, pour que les autres voient
         l'aura autour de mes troupes et non des unités nues. Un entier
         de plus, ajouté à la FIN comme `sq` avant lui : les versions
         précédentes ignorent un champ inconnu, donc un salon mixte ne
         casse pas — elles dessineront simplement des troupes sans
         aura, ce qui était l'état d'avant. */
      /* DEUX SCORES, ET C'EST VOULU. `g` est le cumul de CARRIÈRE, qui
         nourrit le classement de l'accueil ; `gc` est ce que j'ai fait
         sur l'ÎLE OÙ JE SUIS, qui nourrit le podium en jeu, et `gcC`
         dit de quelle île il s'agit — un joueur peut être sur l'île 3
         pendant que je suis sur l'île 1, et son score ne doit alors
         entrer dans aucun de mes calculs.
         Les trois champs sont ajoutés à la FIN, comme `sq` et `pu`
         avant eux : une version précédente les ignore et n'apparaît
         que par l'instantané retenu, qui est déjà rangé par île. */
      var msg = { t:"etat", nom:monNom, sq:monSeau, n:n,
                  g:Math.round(monTotalLocal()), p:p, pu:jeu.palier | 0,
                  gc:Math.round(monTotalCarte(jeu.index)), gcC:jeu.index | 0 };
      if(jeu.mort && jeu.fantome){
        msg.m = 1;
        msg.f = [Math.round(jeu.fantome.gx * 10) / 10, Math.round(jeu.fantome.gy * 10) / 10];
      }
      envoie(msg);
      if(degatsEnAttente > 0){
        serieReseau++;
        envoie({ t:"deg", d:degatsEnAttente, s:serieReseau, c:jeu.index });
        degatsEnAttente = 0;
      }
    }
  }
}
/* L'index d'île accompagne l'événement : sans lui, un joueur passé
   à l'île suivante détruisait le bâtiment de même rang chez ceux
   restés sur la précédente. */
/* Le sort de Gégé fait partie du monde : il se diffuse tout de suite,
   et il est aussi porté par l'instantané pour ceux qui arriveront après. */
function envoieGege(){ envoie({ t:"gege", nom:monNom, c:jeu ? jeu.index : 0 }); }
function envoieTweety(){ envoie({ t:"tweety", nom:monNom, c:jeu ? jeu.index : 0 }); }
/* La vengeance ne transporte AUCUNE coordonnée : chaque client vise
   lui-même, au moment du tir, la troupe du coupable la plus proche du
   chat. Le message dit qui, et quel chat — le reste se déduit. */
/* On envoie le LIEU DU CRIME avec le nom du coupable : les créatures
   ne transitent jamais par le réseau, donc sans ces deux nombres
   chaque client viserait son propre chat, à sa propre place. */
function envoieVengeance(espece, kx, ky){
  envoie({ t:"veng", nom:monNom, e:espece, c:jeu ? jeu.index : 0,
           kx:Math.round((kx || 0) * 10) / 10, ky:Math.round((ky || 0) * 10) / 10 });
}
function envoieDestruction(n){ envoie({ t:"det", n:n, c:jeu ? jeu.index : 0 }); signaleMonde(); }
function envoieCarte(c){ envoie({ t:"carte", c:c }); }

window.addEventListener("beforeunload", function(){
  /* dernier instantané avant de partir : sans lui, jusqu'à deux
     secondes de jeu se perdaient à la fermeture de l'onglet */
  if(jeu) publieMonde(true);
  if(reseau.connecte) envoie({ t:"adieu" });
  fermeRelais();
});
