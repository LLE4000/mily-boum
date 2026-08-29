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

/* L'onglet passe à l'arrière-plan : on suspend l'horloge audio. Voir
   le piège n° 2. L'écouteur est posé une fois pour toutes, au
   chargement — il ne dépend d'aucun élément du DOM. */
document.addEventListener("visibilitychange", function(){
  var M = musique.moteur();
  if(!M || !M.isPlaying()) return;
  if(document.hidden) M.pause(); else M.resume();
});
