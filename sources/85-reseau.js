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
var PERIODE_MONDE = 2.0;     // s minimum entre deux instantanés

var monId = "";
var monNom = "Recrue";
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
        envoieTrame(paquetSubscribe(reseau.idPaquet++, SUJET_MONDE));
        envoie({ t:"bonjour", nom:monNom });
        /* si l'on a du retard à rattraper localement, on le publie :
           notre miroir peut être plus frais que celui du courtier */
        if(monde) mondeSale = true;
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
}
function envoieTrame(u8){
  if(reseau.ws && reseau.ws.readyState === 1){
    try{ reseau.ws.send(u8); }catch(e){}
  }
}
function envoie(obj){
  obj.id = monId;
  if(!reseau.connecte) return;
  envoieTrame(paquetPublish(SUJET, JSON.stringify(obj)));
}

/* ---------------------------------------------------------------
   L'INSTANTANÉ DU MONDE
   --------------------------------------------------------------- */

/* Ce que la partie en cours sait du monde, sous forme d'instantané. */
function mondeCourant(){
  if(!jeu) return monde;
  var bits = [], i;
  for(i = 0; i < jeu.batiments.length; i++) bits.push(jeu.batiments[i].vivant ? 0 : 1);
  return { v:(monde ? monde.v : 0), cy:cycleSalon, c:jeu.index,
           pv:Math.max(0, Math.round(jeu.qg.pv)), d:encodeBits(bits) };
}

/* Adopte un instantané venu d'ailleurs : on le FUSIONNE, jamais on ne
   le recopie. La fusion étant monotone, l'ordre d'arrivée n'a aucune
   importance et deux clients qui publient en même temps convergent. */
function adopteMonde(m, source){
  if(!mondeValide(m)) return;
  var avant = monde;
  monde = fusionneMonde(monde, m);
  if(!memeMonde(avant, monde)) sauveMondeLocal();
  /* si notre partie en cours ignore des destructions annoncées, on les
     applique tout de suite ; si c'est nous qui en savons plus, on le
     fera savoir à la prochaine publication */
  if(jeu && monde.c === jeu.index && (monde.cy | 0) === cycleSalon){
    appliqueMondeAuJeu(monde);
    if(!memeMonde(monde, mondeCourant())) mondeSale = true;
  }
  if(monde.cy > cycleSalon){ cycleSalon = monde.cy | 0; carteSalon = monde.c | 0; }
  else if(monde.cy === cycleSalon) carteSalon = Math.max(carteSalon, monde.c | 0);
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
  if(!jeu || !mondeValide(m) || m.c !== jeu.index || (m.cy | 0) !== cycleSalon) return;
  var bits = decodeBits(m.d, jeu.batiments.length), i, b, change = 0;
  for(i = 0; i < jeu.batiments.length; i++){
    b = jeu.batiments[i];
    if(bits[i] && b.vivant){
      b.vivant = 0; b.pv = 0;
      marqueEmprise(b, 0);
      change++;
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
    if(jeu) envoie({ t:"sync", nom:monNom, c:jeu.index, pv:jeu.qg.pv });
    message(j.nom + " a rejoint le salon.");
  }else if(m.t === "sync"){
    j.nom = (m.nom || "?").substr(0, 14);
    if(monde.cy > cycleSalon){ cycleSalon = monde.cy | 0; carteSalon = monde.c | 0; }
  else if(monde.cy === cycleSalon) carteSalon = Math.max(carteSalon, monde.c | 0);
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
  }else if(m.t === "carte"){
    if(typeof m.c === "number" && m.c > carteSalon){
      carteSalon = m.c;
      if(jeu && !jeu.fin && jeu.index < m.c) montreBilan();
    }
  }else if(m.t === "adieu"){
    delete autresJoueurs[m.id];
    majPodium();
  }
}
function majUnitesDistantes(j, p){
  var i;
  for(i = 0; i < p.length; i++){
    var e = p[i];
    if(!j.unites[i]){
      j.unites[i] = { gx:e[0], gy:e[1], cx:e[0], cy:e[1], type:"meuf", droite:true, phase:Math.random() * 6 };
    }
    var u = j.unites[i];
    u.cx = e[0]; u.cy = e[1];
    var code = e[2] | 0;
    u.type = (code & 2) ? "mec" : "meuf";
    u.droite = !!(code & 1);
  }
  j.unites.length = p.length;
}
function interpoleDistants(dt){
  for(var id in autresJoueurs){
    var j = autresJoueurs[id];
    if(tempsGlobal - j.vu > 8){ delete autresJoueurs[id]; majPodium(); continue; }
    for(var i = 0; i < j.unites.length; i++){
      var u = j.unites[i];
      var dx = u.cx - u.gx, dy = u.cy - u.gy;
      var d = Math.hypot(dx, dy);
      if(d > 12){ u.gx = u.cx; u.gy = u.cy; continue; }
      var k = Math.min(1, dt * 5);
      u.gx += dx * k; u.gy += dy * k;
      if(d > 0.02) u.phase += dt * (u.type === "mec" ? 6.2 : 8.6);
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

  reseau.etatT -= dt * 1000;
  if(reseau.etatT <= 0){
    reseau.etatT = EQ.PERIODE_ETAT;
    if(jeu){
      /* 20 unités échantillonnées */
      var p = [], n = jeu.unites.length;
      var pas = Math.max(1, Math.ceil(n / EQ.UNITES_DIFFUSEES));
      for(var i = 0; i < n && p.length < EQ.UNITES_DIFFUSEES; i += pas){
        var u = jeu.unites[i];
        p.push([Math.round(u.gx * 10) / 10, Math.round(u.gy * 10) / 10,
                (u.t === "mec" ? 2 : 0) + (u.droite ? 1 : 0)]);
      }
      var msg = { t:"etat", nom:monNom, n:n, g:jeu.degatsMoi, p:p };
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
function envoieDestruction(n){ envoie({ t:"det", n:n, c:jeu ? jeu.index : 0 }); signaleMonde(); }
function envoieCarte(c){ envoie({ t:"carte", c:c }); }

window.addEventListener("beforeunload", function(){
  /* dernier instantané avant de partir : sans lui, jusqu'à deux
     secondes de jeu se perdaient à la fermeture de l'onglet */
  if(jeu) publieMonde(true);
  if(reseau.connecte) envoie({ t:"adieu" });
  fermeRelais();
});
