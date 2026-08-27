/* ================================================================
   DÉMARRAGE ET BOUCLE PRINCIPALE
   ================================================================ */
var derniereImage = 0, fps = 60, lissageFps = 60;

function demarre(){
  cv = $("cv");
  ctx = cv.getContext("2d", { alpha:false });
  miniCv = $("mini");
  miniCtx = miniCv.getContext("2d");
  monId = idStable();
  ajuste();
  /* Le doigt et la rotation d'abord, le décor ensuite : ces écouteurs
     tenaient derrière construitBriefing(), si bien qu'une vignette d'île
     qui trébuchait emportait avec elle le redimensionnement du canevas.
     Tourner la tablette ne dépend d'aucun sprite. */
  installeSaisie();
  /* le miroir local du monde est lu AVANT toute connexion : si le
     courtier a purgé son message retenu, c'est lui qui reprend la
     main, et sinon la fusion des deux ne perd rien. */
  chargeMondeLocal();

  construitSpritesDefenses();
  construitSpriteGardienne();
  construitSpriteQG();
  construitVignettesGrises();

  construitBriefing();
  installeBoutons();
  installeRaz();
  installeAdmin();
  installePlan();
  rafraichitPlan();

  monNom = pseudoSaisi();
  connecteRelais($("relais").value);
  majEtatReseau();

  /* le contexte audio ne peut démarrer qu'après un geste */
  ["pointerdown", "keydown"].forEach(function(ev){
    window.addEventListener(ev, function(){ son.reveille(); }, { once:true });
  });

  derniereImage = performance.now();
  requestAnimationFrame(boucle);
}

function boucle(maintenant){
  requestAnimationFrame(boucle);
  var dt = (maintenant - derniereImage) / 1000;
  derniereImage = maintenant;
  if(dt > 0.1) dt = 0.1;                    // on ne rattrape pas les longues pauses
  if(dt <= 0) return;
  tempsGlobal += dt;
  lissageFps += ((1 / dt) - lissageFps) * 0.05;

  majReseau(dt);
  majMonde(dt);
  interpoleDistants(dt);
  majFlash(dt);
  majEtatReseauLent(dt);
  /* Le compte à rebours de la jungle et le nombre de joueurs vivent
     dans le BRIEFING, donc avant le « if(!enJeu) return » : c'est là,
     menu ouvert, qu'on les regarde. */
  majJungleLent(dt);

  if(!enJeu) return;
  /* Le gouverneur passe AVANT le rendu, jamais après : son ajuste()
     redimensionne le canevas, ce qui l'efface en noir — appelé après,
     il détruisait l'image tout juste peinte et chaque cran de
     définition se payait d'un éclair noir plein écran, précisément
     sur l'appareil qui ramait déjà. Appelé avant, le canevas effacé
     est repeint dans la même image : le changement est invisible. */
  gouverneResolution(dt);
  majFaune(dt);
  majBilan(dt);
  if(!bilanActif || jeu.fin) majJeu(dt);
  rendu(tempsGlobal, dt);
  majBarresLent(dt);
}

/* ---------------------------------------------------------------
   LE GOUVERNEUR DE RÉSOLUTION
   Il regarde une seule chose : la durée réelle des images, lissée.
   Au-delà de 34 ms tenues une seconde — deux rafraîchissements
   manqués sur trois — il abaisse le plafond de définition d'un quart
   et repart. En dessous de 17 ms tenues six secondes, il remonte d'un
   cran, jamais plus haut que l'écran. La montée est six fois plus
   lente que la descente, exprès : mieux vaut rester un peu flou que
   pomper entre net et flou à chaque virage de caméra.
   --------------------------------------------------------------- */
var lissageImg = 16, gouvLent = 0, gouvVite = 0;
function gouverneResolution(dt){
  lissageImg += (dt * 1000 - lissageImg) * 0.08;
  if(lissageImg > 34){
    gouvVite = 0;
    gouvLent += dt;
    if(gouvLent > 1.0 && dpr > 1.0){
      dprPlafond = Math.max(1.0, dpr - 0.25);
      ajuste();
      gouvLent = 0;
      lissageImg = 20;              // on laisse la mesure repartir de neuf
    }
  }else if(lissageImg < 17){
    gouvLent = 0;
    if(dprPlafond < Math.min(2, window.devicePixelRatio || 1)){
      gouvVite += dt;
      if(gouvVite > 6.0){
        dprPlafond += 0.25;
        ajuste();
        gouvVite = 0;
        lissageImg = 20;
      }
    }
  }else{ gouvLent = 0; gouvVite = 0; }
}

/* rafraîchissements peu fréquents : on évite de toucher le DOM à 60 Hz */
var lentT = 0, lentT2 = 0;
function majBarresLent(dt){
  lentT -= dt;
  if(lentT <= 0 || barresSales){ lentT = 0.2; majBarres(); }
}
function majEtatReseauLent(dt){
  lentT2 -= dt;
  if(lentT2 <= 0){ lentT2 = 1.0; majEtatReseau(); }
}

if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", demarre);
else demarre();
