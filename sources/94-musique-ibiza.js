/* ================================================================
   LA MUSIQUE D'IBIZA — quand elle part, où elle s'arrête

   « Sur la map Ibiza et uniquement là, dès qu'on entre sur la map la
   musique doit commencer et les gens se mettent à danser. La musique
   tourne en boucle durant toute la map. Si on observe la map et
   qu'elle est verrouillée, on a aussi le DJ qui joue la musique et
   les danseurs qui dansent à fond. »

   CE FICHIER NE FAIT PAS DE MUSIQUE. Le morceau vit dans
   93-musique.js — cent quarante-quatre mesures de French house
   synthétisées en direct, aucun fichier, aucun réseau. Ici on ne fait
   que décider QUAND il joue, et brancher le bouton du son dessus.

   ────────────────────────────────────────────────────────────────
   TROIS PIÈGES, ET ILS SONT TOUS LES TROIS DES PIÈGES DE NAVIGATEUR

   1. LE GESTE. Un son qui ne part pas d'un geste de l'utilisateur est
      bloqué, et il est bloqué EN SILENCE : pas d'erreur, pas de
      message, simplement rien. Ce qui compte n'est pas que play() soit
      appelé dans le gestionnaire du clic — c'est que le contexte audio
      ait été créé ou repris alors que la page avait déjà reçu un
      geste. On le crée donc au tout premier toucher de la page
      (`musique.debloque`, appelé dans demarre()), bien avant qu'on
      songe à jouer. C'est indispensable ici : l'entrée sur une carte
      événement passe par une bannière et deux secondes et demie
      d'attente, et à ce moment-là le clic est loin.

   2. L'ONGLET CACHÉ. Le moteur programme environ cinq cents nœuds
      audio par seconde. Onglet en arrière-plan, il continue — et le
      téléphone chauffe pour une fête que personne ne regarde. On
      suspend l'horloge audio sur `visibilitychange`, et on la reprend
      au retour.

   3. DEUX MOTEURS. « Ne jamais instancier deux fois », dit la notice,
      et c'est vrai : deux contextes audio, c'est deux fois le calcul
      et deux morceaux qui se croisent. Tout passe donc par cet objet,
      et lui seul appelle MilyMusic.
   ────────────────────────────────────────────────────────────────

   OÙ ELLE COMMENCE — LE DISCOURS LA PREMIÈRE FOIS, LA MONTÉE ENSUITE

   « Et oui, il faut le mettre, le discours d'intro ! Ce qui est
   dommage c'est qu'en repérage on ne l'entend pas non plus. »

   Les huit premières mesures sont une rumeur de foule et une voix
   présidentielle : « We all came here for Mily », puis « Where is
   Mily? ». C'est l'ouverture du morceau, et elle mérite d'être
   entendue — y compris quand on ne fait que VISITER l'île, puisque
   visite et partie passent par la même porte.

   MAIS UNE FOIS PAR CHARGEMENT DE PAGE, et pas à chaque entrée. Le
   discours dure une quinzaine de secondes sans le moindre battement.
   L'entendre en arrivant sur l'île est une cérémonie ; le réentendre
   au troisième aller-retour au briefing est une attente. On entre donc
   au discours la première fois, et à `buildup` — mesure 24 — les
   suivantes : quinze secondes de montée, la coupure d'un temps, puis
   LE DROP. Le reste se déroule tout seul et boucle indéfiniment.

   ET LE DISCOURS NE DÉCALE PAS LE JEU DE LUMIÈRE, sur deux points
   qu'il fallait aller vérifier :

     LA PHASE. Tout ce qui bouge lit `MilyMusic.horloge()`, qui remonte
     à la date AUDIO. L'horloge tourne pendant le discours comme
     partout ailleurs — simplement, la section « discours » ne vaut
     presque rien en lumière (voir IBI_FORCE), donc la foule attend en
     se balançant à peine et les lasers restent bas. Quand la grosse
     caisse tombe à la mesure 10, la phase est déjà juste : rien ne
     saute, tout monte d'un coup. C'est exactement ce qu'on veut voir.

     LA VOIX QUI TRAÎNE, et celle-là était un vrai défaut. `stop()` et
     `jumpTo()` appellent tous deux `speechSynthesis.cancel()` ;
     `play()`, NON — vérifié dans le moteur, lignes 757 et 777 contre
     rien. Il suffisait donc de quitter l'île pendant le discours et d'y
     revenir dans la seconde : notre fondu de sortie dure sept dixièmes,
     `entre` annulait l'arrêt, et la voix du passage précédent
     continuait de parler par-dessus le drop du suivant. On coupe donc
     la parole nous-mêmes avant chaque départ. C'est sans danger pour
     le discours qui vient : le moteur ne programme ses phrases qu'au
     moment où il PLANIFIE la mesure, donc rien n'est encore en file
     quand play() démarre.

   ET ELLE NE S'ARRÊTE PAS. Le moteur boucle tout seul de la mesure
   144 à la mesure 17 : quatre minutes par tour, indéfiniment, et le
   discours ne se rejoue jamais. Il n'y a donc rien à faire pour
   « tourner en boucle durant toute la map » — sinon ne pas l'arrêter.
   ================================================================ */

/* Le volume de la musique. Le même que celui du reste du jeu : la
   bande-son est un DÉCOR, elle ne doit pas couvrir les explosions. */
var MUS_VOL = 0.60;

var musique = {

  /* Le minuteur de l'arrêt en fondu. Il est à nous, et c'est tout
     l'objet du commentaire de `sort` plus bas. */
  minuteur:0,

  /* Le discours a-t-il déjà été entendu depuis le chargement de la
     page ? Une cérémonie ne se répète pas. */
  introJouee:0,

  /* Le moteur, s'il est là. Un test à chaque appel plutôt qu'une
     référence gardée : si 93-musique.js venait à manquer, le jeu doit
     continuer sans musique, pas s'arrêter. */
  moteur:function(){
    return (typeof MilyMusic !== "undefined" && MilyMusic) ? MilyMusic : null;
  },

  /* Le contexte audio est créé au premier geste sur la page, et rien
     n'est joué : voir le piège n° 1 en tête de fichier. */
  debloque:function(){
    var M = this.moteur();
    if(M && M.debloque) M.debloque();
  },

  /* ENTRER SUR UNE CARTE. Appelée pour toutes les cartes, elle ne
     fait quelque chose que sur celle qui a une scène — c'est
     `carteScene` qui décide, et elle seule, exactement comme pour les
     danseurs et pour les lasers. */
  entre:function(index){
    var M = this.moteur();
    if(!M) return;
    if(!carteScene(index)){ this.sort(); return; }
    /* On annule d'abord l'arrêt en cours, s'il y en a un. Voir `sort`. */
    if(this.minuteur){ clearTimeout(this.minuteur); this.minuteur = 0; }
    /* PUIS ON COUPE LA PAROLE. Une voix du passage précédent peut
       encore être en train de parler : play() ne l'arrête pas, seuls
       stop() et jumpTo() le font. Voir l'en-tête du fichier. */
    this.tais();
    M.setVolume(son.actif ? MUS_VOL : 0);
    /* le discours la première fois, la montée ensuite */
    M.play(this.introJouee ? "buildup" : "intro");
    this.introJouee = 1;
  },

  /* Faire taire le moteur vocal de l'appareil, sans rien casser s'il
     n'y en a pas — certains navigateurs n'en ont aucun. */
  tais:function(){
    if(typeof speechSynthesis === "undefined") return;
    try{ speechSynthesis.cancel(); }catch(e){}
  },

  /* ================================================================
     SORTIR — et le fondu est LE NÔTRE, pas celui du moteur

     Un fondu, parce que coupé net un morceau s'entend comme une
     panne. Mais pas `MilyMusic.fadeOut()`, et c'est un vrai piège :
     ce fondu-là programme un `stop()` une seconde et demie plus tard
     et ne rend AUCUN moyen de l'annuler. Or on ressort d'Ibiza et l'on
     y rentre en un clic — un aller-retour au briefing, une visite
     qu'on relance, un double appui sur la vignette. Dans cette
     seconde et demie, la musique repartait pour de bon… puis le
     `stop()` de la sortie précédente tombait dessus et la coupait.
     Une carte muette, sans erreur, sans rien dans la console : le
     genre de défaut qu'on met une heure à trouver et trois lignes à
     éviter.

     Le fondu est donc à nous : `setVolume(0)` — le moteur y met sa
     propre rampe douce — puis un `stop()` sur un minuteur que l'on
     GARDE, et que l'entrée suivante annule.
     ================================================================ */
  sort:function(){
    var M = this.moteur();
    if(!M) return;
    if(this.minuteur){ clearTimeout(this.minuteur); this.minuteur = 0; }
    if(!M.isPlaying()) return;
    /* La voix se tait TOUT DE SUITE, elle, et n'attend pas le fondu :
       une musique qui s'éloigne est un départ, une voix désincarnée
       qui continue de parler par-dessus le briefing est une panne. */
    this.tais();
    M.setVolume(0);
    var self = this;
    this.minuteur = setTimeout(function(){
      self.minuteur = 0;
      if(M.isPlaying()) M.stop();
    }, 700);
  },

  /* LE BOUTON DU SON COUPE AUSSI LA MUSIQUE. C'est la seule chose que
     la notice réclame explicitement, et elle a raison : sur téléphone,
     une bande-son qu'on ne peut pas couper est une bande-son qu'on
     fuit. On baisse le volume au lieu d'arrêter — la musique continue
     sa route, et la rallumer la reprend là où elle en est plutôt que
     de la redémarrer au milieu du morceau. */
  suitLeSon:function(){
    var M = this.moteur();
    if(M) M.setVolume(son.actif ? MUS_VOL : 0);
  },

  /* La phase musicale, pour la scène. Rend null si rien ne joue : la
     scène revient alors à son propre métronome. */
  horloge:function(){
    var M = this.moteur();
    return (M && M.horloge) ? M.horloge() : null;
  },

  /* Le discours d'introduction, pour qui voudra l'entendre un jour :
     « We all came here for Mily », puis la montée et le premier drop.
     Rien ne l'appelle pour l'instant — c'est une porte, pas un
     réglage. */
  discours:function(){
    var M = this.moteur();
    if(M) M.play("intro");
  }
};

/* ================================================================
   LA VOIX DU DISCOURS — POURQUOI ELLE SE CHOISIT ICI, ET PAS EN DUR

   « La voix de l'intro est complètement différente de ce qu'il fallait,
   comment est-ce possible ? »

   Parce qu'elle n'est PAS dans le fichier. Les deux phrases du discours
   sont dites par le moteur vocal de l'APPAREIL — c'est ce qui permet à
   la bande-son de ne peser que trente-cinq kilo-octets et de n'exiger
   aucun réseau. Le jeu demande « dis cette phrase en anglais » ; ce
   qui sort dépend des voix installées, et elles ne sont les mêmes sur
   aucun appareil.

   L'auteur du morceau a corrigé ce qui pouvait l'être sans savoir sur
   quoi le jeu tourne : la hauteur écrasée qui faisait chevroter, et le
   classement qui laissait passer les voix féminines. C'est fait, c'est
   dans 93-musique.js, et ça vaut pour tout le monde.

   MAIS SA DERNIÈRE ÉTAPE NE MARCHE PAS POUR UN JEU À PLUSIEURS. Elle
   demande de parcourir les voix dans un lecteur à part, de lui donner
   le nom retenu, et qu'il l'écrive en dur dans le moteur. Ce nom-là
   n'existerait que sur la tablette où on l'a trouvé : « Microsoft Guy »
   n'est installé sur aucun téléphone Android, et setVoiceName() d'un
   nom absent retombe silencieusement sur le choix automatique. On
   aurait figé un réglage pour un joueur et changé RIEN pour les
   autres.

   Le choix appartient donc à l'appareil, pas au fichier : chacun
   parcourt ses propres voix, écoute, garde celle qu'il veut, et son
   choix est rangé à côté de son pseudo et de ses navettes. Le réglage
   automatique de l'auteur reste la valeur par défaut — c'est lui qui
   sert tant que personne n'a rien choisi.
   ================================================================ */

/* Hauteur et débit du discours. Les valeurs retenues par l'auteur
   après écoute : « la solennité vient du débit lent et des pauses, pas
   d'un grave forcé ». Elles vivent ICI et sont poussées dans le
   moteur, pour que l'extrait qu'on écoute dans le sélecteur et le
   discours qu'on entend sur l'île soient les deux mêmes nombres — un
   sélecteur qui ne fait pas entendre ce qu'on aura est pire que pas de
   sélecteur du tout. */
var VOIX_HAUTEUR = 0.85, VOIX_DEBIT = 0.72;

/* La phrase d'essai est la VRAIE première phrase du discours, « Mily »
   écrit « Milly » comme le moteur l'envoie — sinon les moteurs anglais
   disent « Maïli ». */
var VOIX_ESSAI = "We all came here for Milly.";

/* ================================================================
   TROIS CHOIX, PAS DEUX — ET LE DÉFAUT EST CELUI DU MOTEUR

   L'auteur conseille `setVoiceMode('synth')` : sa voix synthétisée,
   fabriquée par le code, donc rigoureusement la même partout. Il a
   raison, et c'est le défaut ici. Ce qu'il ne pouvait pas savoir,
   c'est que le jeu a un sélecteur : le conseil n'a donc pas à être un
   choix entre deux maux.

     « moteur »  la voix synthétisée du morceau. Identique sur tous les
                 appareils, zéro octet, robotique par construction —
                 c'est un vocodeur à formants, pas une voix. LE DÉFAUT :
                 un joueur qui n'a rien réglé entend ce que les autres
                 entendent, au lieu de la loterie d'avant (une vieille
                 dame chez l'un, rien du tout chez l'autre).
     « auto »    le classement de l'auteur sur les voix de l'appareil.
     « v:NOM »   une voix précise, choisie à l'oreille.

   Le préfixe « v: » n'est pas une coquetterie : sans lui, une voix qui
   s'appellerait « auto » serait indiscernable du mode automatique.
   ================================================================ */
var voixDiscours = {

  /* « moteur », « auto », ou « v:NOM ». C'est la seule chose qu'on
     retient, et elle tient en une chaîne — donc dans le stockage local
     à côté du pseudo. */
  choix:"moteur",

  /* Le nom de la voix retenue, ou null si le choix n'en désigne
     aucune. Les autres fichiers lisent ceci, pas `choix`. */
  nom:function(){
    return this.choix.indexOf("v:") === 0 ? this.choix.slice(2) : null;
  },

  /* Les voix anglaises de l'appareil, les mieux classées en tête.
     Rend un tableau vide si le moteur manque ou si l'appareil n'a
     aucune voix — les deux arrivent, et ni l'un ni l'autre n'est une
     erreur. */
  liste:function(){
    var M = musique.moteur();
    if(!M || !M.listVoices) return [];
    try{ return M.listVoices() || []; }catch(e){ return []; }
  },

  /* Retenir un choix et l'appliquer. Passe aussi la hauteur et le
     débit : c'est le seul endroit qui les écrit, donc le seul à
     pouvoir garantir qu'ils valent partout la même chose. */
  pose:function(choix){
    this.choix = choix || "moteur";
    var M = musique.moteur();
    if(!M) return;
    if(M.setVoicePitch) M.setVoicePitch(VOIX_HAUTEUR);
    if(M.setVoiceRate) M.setVoiceRate(VOIX_DEBIT);
    if(M.setVoiceName) M.setVoiceName(this.nom());
    /* Le mode en dernier : c'est lui qui décide si l'appareil parle du
       tout, et les deux réglages au-dessus ne coûtent rien s'il ne
       parle pas. */
    if(M.setVoiceMode) M.setVoiceMode(this.choix === "moteur" ? "synth" : "system");
  },

  /* ── ESSAYER, PARCE QU'ON NE CHOISIT PAS UNE VOIX SUR SON NOM ──
     Deux chemins, parce qu'il y a deux natures de voix.

     Une voix de l'APPAREIL se fait dire une phrase, tout de suite : on
     ne peut pas se servir du discours du morceau, qui est programmé
     sur l'horloge audio et n'arrive qu'aux huit premières mesures.

     La voix du MOTEUR, elle, n'existe qu'à l'intérieur du morceau —
     c'est de la synthèse par formants, pas un moteur vocal qu'on
     appelle. On joue donc le vrai début du morceau et on l'arrête au
     bout de quelques secondes. Sans danger : le sélecteur ne s'ouvre
     que depuis l'accueil, où rien ne joue. */
  essai:0,

  essaie:function(choix){
    this.taisEssai();
    if(choix === "moteur") return this.essaieMoteur();
    return this.essaieAppareil(this.choix.indexOf("v:") === 0 ? this.choix.slice(2) : null);
  },

  essaieAppareil:function(nom){
    if(typeof speechSynthesis === "undefined") return false;
    try{
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(VOIX_ESSAI);
      var v = this.voixNommee(nom);
      if(v){ u.voice = v; u.lang = v.lang; } else { u.lang = "en-US"; }
      u.pitch = VOIX_HAUTEUR; u.rate = VOIX_DEBIT; u.volume = 1;
      speechSynthesis.speak(u);
      return true;
    }catch(e){ return false; }
  },

  essaieMoteur:function(){
    var M = musique.moteur();
    if(!M) return false;
    /* Si une musique tourne déjà, on ne la piétine pas : on a changé
       le mode, ça suffit. Le cas ne se présente pas depuis l'accueil,
       mais un sélecteur qui coupe la musique serait une panne. */
    if(M.isPlaying()) return false;
    musique.debloque();
    M.setVolume(son.actif ? MUS_VOL : 0);
    M.play("intro");
    var self = this;
    this.essai = setTimeout(function(){ self.taisEssai(); }, 9000);
    return true;
  },

  /* Couper l'essai en cours, quel qu'il soit. Appelée avant chaque
     nouvel essai et à la fermeture du panneau : un extrait qui
     continue de jouer derrière un panneau fermé est une panne. */
  taisEssai:function(){
    if(this.essai){ clearTimeout(this.essai); this.essai = 0; }
    musique.tais();
    var M = musique.moteur();
    if(M && M.isPlaying()) M.stop();
  },

  /* L'objet SpeechSynthesisVoice qui porte ce nom. On redemande la
     liste à l'appareil plutôt que de garder une référence : les voix
     arrivent en différé au premier chargement, et une liste gardée
     trop tôt est vide pour toujours. */
  voixNommee:function(nom){
    if(!nom || typeof speechSynthesis === "undefined") return null;
    var t = [];
    try{ t = speechSynthesis.getVoices() || []; }catch(e){ return null; }
    for(var i = 0; i < t.length; i++) if(t[i].name === nom) return t[i];
    return null;
  }
};

/* ================================================================
   LE SÉLECTEUR DE VOIX

   Une liste de boutons plutôt qu'un menu déroulant : on ne choisit pas
   une voix sur son nom, on la choisit en l'ENTENDANT. Chaque ligne
   parle quand on la touche et devient le choix courant du même geste —
   deux touchers pour comparer deux voix, et on repart quand ça sonne
   bien. Les deux premières lignes ne sont pas des voix de l'appareil :
   celle du moteur, qui est le défaut, et le choix automatique.
   ================================================================ */
function majListeVoix(){
  var l = $("voixListe");
  if(!l) return;
  var t = voixDiscours.liste(), h = "", i;
  var c = voixDiscours.choix;

  h += '<button class="voxL' + (c === "moteur" ? " vsel" : "") + '" data-voix="moteur">'
     + '<span class="voxN">🤖 Voix du moteur</span>'
     + '<span class="voxL2">Identique sur tous les appareils — un peu robotique</span>'
     + '</button>';

  h += '<button class="voxL' + (c === "auto" ? " vsel" : "") + '" data-voix="auto">'
     + '<span class="voxN">✨ Choix automatique</span>'
     + '<span class="voxL2">La meilleure voix que trouve cet appareil-ci</span>'
     + '</button>';

  for(i = 0; i < t.length; i++){
    h += '<button class="voxL' + (c === "v:" + t[i].name ? " vsel" : "") + '" data-voix="'
       + echappe("v:" + t[i].name) + '">'
       + '<span class="voxN">' + echappe(t[i].name) + '</span>'
       + '<span class="voxL2">' + echappe(t[i].lang) + '</span>'
       + '</button>';
  }

  /* Aucune voix de l'appareil : ce n'est ni une panne ni quelque chose
     qu'on peut réparer d'ici, et le défaut couvre déjà le cas. */
  if(!t.length){
    h += '<div class="voxVide">Cet appareil n\'annonce aucune voix anglaise.'
       + ' Le discours sera dit par la voix du moteur, la même pour tout'
       + ' le monde.</div>';
  }
  l.innerHTML = h;
}

function ouvreVoixP(){
  var e = $("voixP");
  if(!e) return;
  /* Les voix arrivent en différé : on redemande à chaque ouverture
     plutôt que de se fier à ce qu'on avait au chargement. */
  majListeVoix();
  e.classList.add("on");
}
function fermeVoixP(){
  var e = $("voixP");
  if(e) e.classList.remove("on");
  /* Un extrait qui continue de jouer derrière un panneau fermé est une
     panne, et l'extrait du moteur dure neuf secondes. */
  voixDiscours.taisEssai();
}

function installeVoixP(){
  /* Le choix relu du stockage n'est encore qu'une chaîne : c'est ici
     qu'il entre dans le moteur, avec la hauteur, le débit et le mode.
     Appelé même sans choix retenu — c'est ce qui pose le défaut. */
  voixDiscours.pose(voixDiscours.choix);

  var b = $("btVoix"), f = $("btVoixFerme"), l = $("voixListe");
  if(b) b.addEventListener("click", ouvreVoixP);
  if(f) f.addEventListener("click", fermeVoixP);
  if(l) l.addEventListener("click", function(ev){
    var n = ev.target;
    while(n && n !== l && !n.hasAttribute("data-voix")) n = n.parentNode;
    if(!n || n === l) return;
    var choix = n.getAttribute("data-voix") || "moteur";
    voixDiscours.pose(choix);
    sauvegarde();
    majListeVoix();
    voixDiscours.essaie(choix);
  });
  /* Le moteur vocal publie ses voix après coup, souvent une seconde
     après le chargement. Si le panneau est ouvert à ce moment-là, il
     doit se remplir tout seul. */
  if(typeof speechSynthesis !== "undefined"){
    try{
      speechSynthesis.addEventListener("voiceschanged", function(){
        var e = $("voixP");
        if(e && e.classList.contains("on")) majListeVoix();
      });
    }catch(e){}
  }
}

/* L'onglet passe à l'arrière-plan : on suspend l'horloge audio. Voir
   le piège n° 2. L'écouteur est posé une fois pour toutes, au
   chargement — il ne dépend d'aucun élément du DOM. */
document.addEventListener("visibilitychange", function(){
  var M = musique.moteur();
  if(!M || !M.isPlaying()) return;
  if(document.hidden) M.pause(); else M.resume();
});
