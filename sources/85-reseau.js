/* ================================================================
   MULTIJOUEUR — MQTT 3.1.1 écrit à la main sur WebSocket
   Un seul salon, gravé dans le fichier : MILY.
   ================================================================ */

var CODE_SALON = "MILY";
var SUJET = "khiao/mily/" + CODE_SALON;
var monId = "";
var monNom = "Recrue";
var autresJoueurs = {};
var degatsEnAttente = 0;
var serieReseau = 0;

var reseau = {
  ws:null, dec:null, etat:"vide", url:"", pingT:0, etatT:0,
  connecte:false, idPaquet:1, tentatives:0, rappelT:0
};

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
        envoie({ t:"bonjour", nom:monNom });
      }else if(p.type === 3){                            // PUBLISH
        var m = litPublish(p.corps);
        if(m.sujet === SUJET) recoit(m.message);
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
    if(typeof m.c === "number") carteSalon = Math.max(carteSalon, m.c);
    if(jeu && typeof m.c === "number" && m.c === jeu.index && typeof m.pv === "number"){
      jeu.file.adopteMinimum(m.pv);
      jeu.qg.pv = jeu.file.pv;
      majBarres();
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
    if(jeu && typeof m.d === "number" && typeof m.s === "number"){
      jeu.file.applique(m.id, m.s, m.d);
      jeu.qg.pv = jeu.file.pv;
      if(jeu.qg.pv <= 0 && !jeu.fin) declencheFin();
      majBarres();
    }
  }else if(m.t === "det"){
    if(jeu && typeof m.n === "number"){
      var b = jeu.batiments[m.n];
      if(b && b.vivant && b.n === m.n){
        b.vivant = 0; b.pv = 0;
        marqueEmprise(b, 0);
        jeu.effets.push({ t:"boum", gx:b.gx, gy:b.gy, age:0, duree:0.6, r:b.e * 0.6, force:0.8 });
        if(jeu.fusee && jeu.fusee.cible === b) jeu.fusee = null;
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
        envoie({ t:"deg", d:degatsEnAttente, s:serieReseau });
        degatsEnAttente = 0;
      }
    }
  }
}
function envoieDestruction(n){ envoie({ t:"det", n:n }); }
function envoieCarte(c){ envoie({ t:"carte", c:c }); }

window.addEventListener("beforeunload", function(){
  if(reseau.connecte) envoie({ t:"adieu" });
  fermeRelais();
});
