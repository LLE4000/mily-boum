/*==NOYAU_DEBUT==*/
/* ================================================================
   MILY BOUM — NOYAU
   Tout ce qui est ici est du calcul pur : aucune référence au DOM,
   au canevas ni à Math.random. C'est ce bloc que les tests Node
   extraient du fichier et exécutent tel quel.
   ================================================================ */

/* ----------------------------------------------------------------
   ÉQUILIBRAGE — toutes les constantes réglables sont ici.
   ---------------------------------------------------------------- */
var EQ = {
  /* Économie */
  POUDRE_DEPART        : 150,   // poudre au début de chaque carte
  POUDRE_PAR_BATIMENT  : 3,     // gain par bâtiment détruit
  POUDRE_BONUS_RENFORT : 40,    // bonus quand la flotte revient après la mort

  /* Débarquement */
  NB_BARGES            : 8,
  PLACES_PAR_BARGE     : 15,

  /* Mort / renaissance */
  ATTENTE_RENFORT      : 300,   // secondes (5 minutes)

  /* QG */
  QG_ERUPTION_MIN      : 7.0,   // secondes entre deux éruptions
  QG_ERUPTION_MAX      : 11.0,
  QG_TELEGRAPHE        : 1.4,   // préavis en secondes
  QG_SEUIL_FRENESIE    : 0.30,  // sous 30 % de vie
  QG_GAIN_FRENESIE     : 0.60,  // +60 % de cadence
  QG_PLUIE_MIN         : 22,    // boules de feu
  QG_PLUIE_MAX         : 32,
  QG_PLUIE_RAYON       : 21,    // cases
  QG_FLAQUE_DUREE      : 5.0,
  QG_FLAQUE_DPS        : 26,
  QG_VAGUE_PORTEE      : 24,    // cases
  QG_VAGUE_VITESSE     : 8.5,   // cases/s
  QG_VAGUE_DEGATS      : 62,

  /* Réglages fins demandés */
  MITRA_SEUIL_PRECISION: 4.2,   // au-delà, la mitrailleuse rate
  MITRA_CHANCE_LOIN    : 1 / 3, // une balle sur trois touche
  BRULURE_DPS          : 14,
  BRULURE_DUREE        : 3.0,

  /* Réseau */
  PERIODE_ETAT         : 420,   // ms entre deux messages d'état
  UNITES_DIFFUSEES     : 20,    // unités échantillonnées par joueur
  PERIODE_PING         : 20000, // ms

  /* Éclairante */
  FUSEE_RAYON          : 1.1,   // distance à laquelle une troupe est libérée de la fusée

  /* Divers */
  PERIODE_CIBLAGE      : 400,   // ms entre deux recherches de cible
  BILAN_SECONDES       : 8
};

/* ----------------------------------------------------------------
   Générateur pseudo-aléatoire déterministe (xorshift 32 bits)
   ---------------------------------------------------------------- */
function prng(s){
  var x = s >>> 0 || 1;
  return function(){
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5;  x >>>= 0;
    return x / 4294967296;
  };
}
function graineTexte(s){
  var h = 2166136261;
  for(var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return h >>> 0;
}
function graineCarte(code, index){ return graineTexte(code + "#" + index) >>> 0; }

/* ----------------------------------------------------------------
   Projection isométrique — losange 2:1
   ---------------------------------------------------------------- */
var TW = 52, TH = 26;
function iso(gx, gy){ return { x:(gx - gy) * TW / 2, y:(gx + gy) * TH / 2 }; }
function deIso(x, y){
  var dx = x / (TW / 2), dy = y / (TH / 2);
  return { gx:(dy + dx) / 2, gy:(dy - dx) / 2 };
}
function borne(v, a, b){ return v < a ? a : (v > b ? b : v); }

/* Caméra : écran = monde × z + p */
var ZMIN = 0.13, ZMAX = 1.7;
function versMonde(cam, sx, sy){ return deIso((sx - cam.px) / cam.z, (sy - cam.py) / cam.z); }
function versEcran(cam, gx, gy){
  var p = iso(gx, gy);
  return { x:p.x * cam.z + cam.px, y:p.y * cam.z + cam.py };
}

/* ----------------------------------------------------------------
   Pincement : zoom ET déplacement dans le même geste.
   On mémorise le point du monde sous le milieu des doigts, puis on
   repositionne la caméra pour qu'il y reste collé.
   ---------------------------------------------------------------- */
function debutPince(cam, ax, ay, bx, by){
  var mx = (ax + bx) / 2, my = (ay + by) / 2;
  return {
    d : Math.hypot(ax - bx, ay - by),
    z : cam.z,
    wx: (mx - cam.px) / cam.z,
    wy: (my - cam.py) / cam.z
  };
}
function appliquePince(cam, pincee, ax, ay, bx, by, zmin, zmax){
  if(zmin === undefined) zmin = ZMIN;
  if(zmax === undefined) zmax = ZMAX;
  var mx = (ax + bx) / 2, my = (ay + by) / 2;
  var d  = Math.hypot(ax - bx, ay - by);
  if(pincee.d < 1e-6) return cam;
  cam.z  = borne(pincee.z * (d / pincee.d), zmin, zmax);
  cam.px = mx - pincee.wx * cam.z;
  cam.py = my - pincee.wy * cam.z;
  return cam;
}

/* ----------------------------------------------------------------
   Angles — écart signé le plus court, correct au passage par ±π
   ---------------------------------------------------------------- */
function ecartAngulaire(a, b){
  var d = (a - b) % (Math.PI * 2);
  if(d >  Math.PI) d -= Math.PI * 2;
  if(d < -Math.PI) d += Math.PI * 2;
  return d;
}
function dansCone(angleCible, angleTourelle, demiAngle){
  return Math.abs(ecartAngulaire(angleCible, angleTourelle)) <= demiAngle;
}

/* ----------------------------------------------------------------
   Fiches techniques
   ---------------------------------------------------------------- */
var DEF = {
  mitrailleuse:{ nom:"Mitrailleuse",         pv:940,  portee:5.15, degats:5,  cadence:110,  emprise:2, tourelle:1 },
  flammes:     { nom:"Lance-flammes",        pv:1080, portee:5.6,  degats:10, cadence:150,  emprise:2, tourelle:1, cone:0.5 },
  roquettes:   { nom:"Lance-roquettes",      pv:1120, portee:9.0,  degats:80, cadence:2700, emprise:3, tourelle:1, vitesseProj:8.5 },
  mortier:     { nom:"Mortier",              pv:1040, portee:8.2,  degats:64, cadence:3200, emprise:3, tourelle:1, porteeMin:2.6, zone:1.5, vitesseProj:6.5 },
  electro:     { nom:"Lance-électrobombes",  pv:1000, portee:6.2,  degats:42, cadence:3400, emprise:2, tourelle:1, zone:1.9, ralenti:1.9, vitesseProj:9 },
  reservoir:   { nom:"Réservoir",            pv:700,  portee:0,    degats:0,  cadence:0,    emprise:2, tourelle:0 },
  entrepot:    { nom:"Entrepôt",             pv:820,  portee:0,    degats:0,  cadence:0,    emprise:3, tourelle:0 }
};

var UNI = {
  meuf:{ nom:"Meuf", pv:110, portee:5.0, arret:4.75, degats:54,  cadence:1300, vitesse:1.35, rayon:0.34 },
  mec :{ nom:"Mec",  pv:560, portee:1.9, arret:1.70, degats:100, cadence:1600, vitesse:0.84, rayon:0.42 }
};

var CRE = {
  braisard:{ nom:"Braisard",           pv:210, detection:8.5, portee:2.5, degats:13, cadence:230,  vitesse:1.15, rayon:0.40 },
  piqueur :{ nom:"Piqueur",            pv:60,  detection:7.0, portee:0.9, degats:6,  cadence:400,  vitesse:2.60, rayon:0.26 },
  sanglier:{ nom:"Sanglier de cendre", pv:420, detection:7.5, portee:1.1, degats:70, cadence:1800, vitesse:0.55, rayon:0.55, charge:10, vitesseCharge:4.2 },
  crapaud :{ nom:"Crapaud gluant",     pv:180, detection:5.0, portee:5.0, degats:0,  cadence:2600, vitesse:0.0,  rayon:0.38, ralenti:0.6, dureeRalenti:4 },
  /* Gégé : inoffensive, elle ne fait que détaler. Ne la tuez pas. */
  belette :{ nom:"Gégé la belette",    pv:90,  detection:7.5, portee:0,   degats:0,  cadence:0,    vitesse:2.10, rayon:0.28, fuit:1 }
};

/* Coûts croissants — chaque emploi renchérit le suivant */
var COUT = {
  fusee  :{ base:1,  pas:1, nom:"Éclairante" },
  fumee  :{ base:3,  pas:1, nom:"Fumigène"   },
  soins  :{ base:5,  pas:2, nom:"Soins"      },
  obus   :{ base:6,  pas:2, nom:"Obus"       },
  barrage:{ base:10, pas:3, nom:"Barrage"    }
};
function coutActuel(m, usages){ return COUT[m].base + COUT[m].pas * (usages[m] || 0); }

/* Capacités — effets */
var CAP = {
  fusee  :{ duree:25.0, rayon:0.0 },
  fumee  :{ duree:8.5,  rayon:2.7 },
  soins  :{ duree:5.0,  rayon:2.6, pvParSeconde:28 },
  obus   :{ degats:170, rayon:1.3 },
  barrage:{ nb:14, rayon:3.6, duree:2.2, degats:54 }
};

/* Les trois îles, jouées dans l'ordre */
var CARTES = [
  { nom:"Mily à la plage",    biome:"plage",    pvQG:750000  },
  { nom:"Mily en forêt",      biome:"foret",    pvQG:950000  },
  { nom:"Mily à la campagne",  biome:"campagne", pvQG:1200000 }
];

/* ----------------------------------------------------------------
   Dimensions du monde
   ---------------------------------------------------------------- */
var GW = 116, GH = 104;          // 12 064 cases
var QG_GX = 9, QG_GY = 52;       // fond ouest
var QG_EMPRISE = 7;
var PLAGE_X0 = GW - 9;           // première colonne de sable praticable (107)
var MARGE_SOL = 8;               // marge de tuiles autour de la grille
var SOL_ECH = 0.5;               // sol pré-calculé en demi-résolution

/* Taille du canevas de sol pré-calculé — vérifiée par les tests */
function tailleSolPrecalcule(){
  var m = MARGE_SOL;
  var xs = [], ys = [];
  var coins = [[-m,-m],[GW+m,-m],[-m,GH+m],[GW+m,GH+m]];
  for(var i = 0; i < 4; i++){
    var p = iso(coins[i][0], coins[i][1]);
    xs.push(p.x); ys.push(p.y);
  }
  var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
  var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
  var w = Math.ceil((x1 - x0) * SOL_ECH), h = Math.ceil((y1 - y0) * SOL_ECH);
  return { x0:x0, y0:y0, w:w, h:h, mpx:(w * h) / 1e6 };
}

/* ----------------------------------------------------------------
   Génération de carte — strictement déterministe
   ---------------------------------------------------------------- */
function tirePondere(al, table){
  var t = 0, i;
  for(i = 0; i < table.length; i++) t += table[i][1];
  var r = al() * t;
  for(i = 0; i < table.length; i++){ r -= table[i][1]; if(r <= 0) return table[i][0]; }
  return table[table.length - 1][0];
}

function genereCarte(codeSalon, index){
  var gr  = graineCarte(codeSalon, index);
  var al  = prng(gr);
  var fic = CARTES[index % CARTES.length];
  var c = {
    index:index, graine:gr, nom:fic.nom, biome:fic.biome,
    batiments:[], rochers:[], decors:[], creatures:[],
    qg:{ gx:QG_GX, gy:QG_GY, pvMax:fic.pvQG, pv:fic.pvQG }
  };

  /* --- Bâtiments : lattice militaire tous les 5 carreaux, 30 % sautés --- */
  var bandeProche = [["roquettes",0.30],["electro",0.40],["mortier",0.20],["reservoir",0.10]];
  var bandeMoy    = [["mortier",0.26],["electro",0.45],["mitrailleuse",0.19],["entrepot",0.10]];
  var bandeLoin   = [["mitrailleuse",0.42],["flammes",0.20],["mortier",0.22],["entrepot",0.16]];

  for(var lx = 6; lx <= PLAGE_X0 - 3; lx += 5){
    for(var ly = 3; ly <= GH - 4; ly += 5){
      if(al() < 0.28) continue;                                   // allées
      var dx = lx - QG_GX, dy = ly - QG_GY;
      if(Math.abs(dx) <= 5 && Math.abs(dy) <= 5) continue;        // emprise du QG
      var d = Math.hypot(dx, dy);
      var t = d < 24 ? tirePondere(al, bandeProche)
            : d < 44 ? tirePondere(al, bandeMoy)
                     : tirePondere(al, bandeLoin);
      var gx = lx + (al() - 0.5) * 0.7;
      var gy = ly + (al() - 0.5) * 0.7;
      var f = DEF[t];
      c.batiments.push({
        t:t, gx:gx, gy:gy, pv:f.pv, pvMax:f.pv, e:f.emprise,
        ang:(al() * 6.2832), vivant:1, n:c.batiments.length
      });
    }
  }

  /* --- Falaises : murailles rocheuses infranchissables au nord, au sud
         et à l'ouest. Seule la plage de l'est est praticable. --- */
  c.falaises = [];
  function falaise(gx, gy, rang){
    c.falaises.push({
      gx:gx, gy:gy,
      r:0.72 + al() * 0.62,
      h:(rang === 0 ? 62 : rang === 1 ? 84 : 104) + al() * 26,
      s:al() * 6.2832, v:(al() * 3) | 0
    });
  }
  for(var x = -4.5; x < GW + 3; x += 0.72){
    falaise(x + al() * 0.35, -0.35 + al() * 0.4, 0);
    falaise(x + al() * 0.35, -1.65 + al() * 0.4, 1);
    falaise(x + al() * 0.35, -3.1 + al() * 0.5, 2);
    falaise(x + al() * 0.35, GH - 0.65 + al() * 0.4, 0);
    falaise(x + al() * 0.35, GH + 0.7 + al() * 0.4, 1);
    falaise(x + al() * 0.35, GH + 2.1 + al() * 0.5, 2);
  }
  for(var y = -3.5; y < GH + 3; y += 0.72){
    falaise(-0.35 + al() * 0.4, y + al() * 0.35, 0);
    falaise(-1.65 + al() * 0.4, y + al() * 0.35, 1);
    falaise(-3.1 + al() * 0.5, y + al() * 0.35, 2);
  }
  /* quelques rochers isolés dans les champs */
  for(var i = 0; i < 90; i++){
    var rx = 4 + al() * (PLAGE_X0 - 6), ry = 3 + al() * (GH - 6);
    if(Math.hypot(rx - QG_GX, ry - QG_GY) < 12) continue;
    c.rochers.push({ gx:rx, gy:ry, r:0.32 + al() * 0.4, s:al() * 6.2832, v:(al() * 3) | 0 });
  }

  /* --- Décors du biome --- */
  var nbDec = 260;
  for(var j = 0; j < nbDec; j++){
    var px = 1 + al() * (GW + 2), py = 1 + al() * (GH - 2);
    if(Math.hypot(px - QG_GX, py - QG_GY) < 9) continue;
    c.decors.push({ gx:px, gy:py, s:0.8 + al() * 0.5, v:(al() * 4) | 0 });
  }

  /* --- Créatures : 4 espèces, 40 à 60 par carte --- */
  var especes = ["braisard","piqueur","sanglier","crapaud"];
  var nbCre = 40 + ((al() * 21) | 0);
  var k = 0, poses = 0;
  while(c.creatures.length < nbCre && k < 4000){
    k++;
    var cx = 8 + al() * (PLAGE_X0 - 12), cy = 4 + al() * (GH - 8);
    if(Math.hypot(cx - QG_GX, cy - QG_GY) < 11) continue;
    /* les quatre premières espèces sont garanties, le reste est tiré au sort */
    var esp = (poses < 4) ? especes[poses] : especes[(al() * 4) | 0];
    poses++;
    if(esp === "piqueur"){                                        // essaim de 4 à 6
      var n = 4 + ((al() * 3) | 0);
      for(var q = 0; q < n && c.creatures.length < nbCre + 5; q++){
        c.creatures.push({ t:"piqueur", gx:cx + (al() - 0.5) * 2.4, gy:cy + (al() - 0.5) * 2.4, teinte:0 });
      }
    }else{
      c.creatures.push({ t:esp, gx:cx, gy:cy, teinte:(al() * 2) | 0 });
    }
  }
  /* Gégé la belette : une seule par île, quelque part à mi-chemin */
  for(var g = 0; g < 500; g++){
    var bx = 20 + al() * (PLAGE_X0 - 26), by = 6 + al() * (GH - 12);
    if(Math.hypot(bx - QG_GX, by - QG_GY) < 14) continue;
    c.creatures.push({ t:"belette", gx:bx, gy:by, teinte:0 });
    break;
  }
  return c;
}

/* Empreinte d'une carte — sert aux tests de déterminisme */
function empreinteCarte(c){
  var h = 2166136261;
  function m(v){ h ^= (v | 0); h = (h * 16777619) >>> 0; }
  m(c.graine); m(c.batiments.length); m(c.rochers.length); m(c.creatures.length);
  for(var i = 0; i < c.batiments.length; i++){
    var b = c.batiments[i];
    m(graineTexte(b.t)); m(Math.round(b.gx * 1000)); m(Math.round(b.gy * 1000)); m(b.pvMax);
  }
  for(var j = 0; j < c.creatures.length; j++){
    var k = c.creatures[j];
    m(graineTexte(k.t)); m(Math.round(k.gx * 1000)); m(Math.round(k.gy * 1000));
  }
  return h >>> 0;
}

/* ----------------------------------------------------------------
   MQTT 3.1.1 écrit à la main, directement sur WebSocket.
   ---------------------------------------------------------------- */
function utf8Octets(s){
  var o = [], i, c;
  for(i = 0; i < s.length; i++){
    c = s.charCodeAt(i);
    if(c < 0x80) o.push(c);
    else if(c < 0x800){ o.push(0xc0 | (c >> 6), 0x80 | (c & 63)); }
    else if(c >= 0xd800 && c <= 0xdbff && i + 1 < s.length){
      var c2 = s.charCodeAt(i + 1);
      var cp = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00); i++;
      o.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
    }else{ o.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63)); }
  }
  return o;
}
function texteUtf8(oct, deb, fin){
  var s = "", i = deb;
  while(i < fin){
    var b = oct[i++];
    if(b < 0x80) s += String.fromCharCode(b);
    else if(b < 0xe0) s += String.fromCharCode(((b & 31) << 6) | (oct[i++] & 63));
    else if(b < 0xf0) s += String.fromCharCode(((b & 15) << 12) | ((oct[i++] & 63) << 6) | (oct[i++] & 63));
    else{
      var cp = ((b & 7) << 18) | ((oct[i++] & 63) << 12) | ((oct[i++] & 63) << 6) | (oct[i++] & 63);
      cp -= 0x10000;
      s += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 1023));
    }
  }
  return s;
}
/* Longueur restante : varint sur 1 à 4 octets */
function encodeLongueur(n){
  var o = [];
  do{
    var b = n % 128;
    n = Math.floor(n / 128);
    if(n > 0) b |= 128;
    o.push(b);
  }while(n > 0);
  return o;
}
function decodeLongueur(oct, i){
  var mult = 1, val = 0, cpt = 0, b;
  do{
    if(i >= oct.length) return null;                 // paquet incomplet
    b = oct[i++];
    val += (b & 127) * mult;
    mult *= 128;
    if(++cpt > 4) return { erreur:true };
  }while(b & 128);
  return { valeur:val, suivant:i };
}
function chaineMqtt(s){
  var o = utf8Octets(s);
  return [ (o.length >> 8) & 255, o.length & 255 ].concat(o);
}
function trame(entete, corps){
  return new Uint8Array([entete].concat(encodeLongueur(corps.length), corps));
}
function paquetConnect(idClient, keepaliveSec){
  var corps = chaineMqtt("MQTT").concat([4, 0x02, (keepaliveSec >> 8) & 255, keepaliveSec & 255], chaineMqtt(idClient));
  return trame(0x10, corps);
}
function paquetSubscribe(idPaquet, sujet){
  var corps = [(idPaquet >> 8) & 255, idPaquet & 255].concat(chaineMqtt(sujet), [0]);
  return trame(0x82, corps);
}
function paquetPublish(sujet, message){
  var corps = chaineMqtt(sujet).concat(utf8Octets(message));
  return trame(0x30, corps);
}
function paquetPing(){ return new Uint8Array([0xc0, 0x00]); }
function paquetDeconnexion(){ return new Uint8Array([0xe0, 0x00]); }

/* Décodeur à tampon : les trames WebSocket sont coupées ou collées */
function DecodeurMqtt(){ this.tampon = []; }
DecodeurMqtt.prototype.ajoute = function(octets){
  for(var i = 0; i < octets.length; i++) this.tampon.push(octets[i]);
};
DecodeurMqtt.prototype.suivant = function(){
  if(this.tampon.length < 2) return null;
  var r = decodeLongueur(this.tampon, 1);
  if(r === null) return null;
  if(r.erreur){ this.tampon.length = 0; return null; }
  var total = r.suivant + r.valeur;
  if(this.tampon.length < total) return null;
  var p = {
    type      : (this.tampon[0] >> 4) & 15,
    drapeaux  : this.tampon[0] & 15,
    corps     : this.tampon.slice(r.suivant, total)
  };
  this.tampon = this.tampon.slice(total);
  return p;
};
/* Lecture d'un PUBLISH QoS 0 */
function litPublish(corps){
  var lg = (corps[0] << 8) | corps[1];
  return { sujet:texteUtf8(corps, 2, 2 + lg), message:texteUtf8(corps, 2 + lg, corps.length) };
}

/* ----------------------------------------------------------------
   Convergence des points de vie du QG.
   Le relais ordonne les messages ; chaque client applique la même
   séquence. Les numéros de série évitent qu'un doublon compte deux fois.
   ---------------------------------------------------------------- */
function FileDegats(pvMax){ this.pv = pvMax; this.pvMax = pvMax; this.vus = {}; }
FileDegats.prototype.applique = function(idEmetteur, serie, degats){
  var e = this.vus[idEmetteur];
  if(!e) e = this.vus[idEmetteur] = { max:0, hors:{} };
  /* Fenêtre glissante : « max » est le plus grand numéro contigu déjà vu,
     « hors » retient les numéros arrivés dans le désordre. Un doublon est
     donc rejeté, et un message en retard n'est jamais perdu. */
  if(serie <= e.max || e.hors[serie]) return false;
  var d = Math.round(degats);
  if(d > 0) this.pv = Math.max(0, this.pv - d);
  e.hors[serie] = 1;
  while(e.hors[e.max + 1]){ delete e.hors[e.max + 1]; e.max++; }
  return true;
};
FileDegats.prototype.adopteMinimum = function(pv){
  if(typeof pv === "number" && pv >= 0 && pv < this.pv) this.pv = pv;
};

/* Précision dégressive de la mitrailleuse (réglage fin §5.3) */
function mitraTouche(distance, tirage){
  if(distance <= EQ.MITRA_SEUIL_PRECISION) return true;
  return tirage < EQ.MITRA_CHANCE_LOIN;
}
/*==NOYAU_FIN==*/
