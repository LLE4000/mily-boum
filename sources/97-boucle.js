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
  /* le miroir local du monde est lu AVANT toute connexion : si le
     courtier a purgé son message retenu, c'est lui qui reprend la
     main, et sinon la fusion des deux ne perd rien. */
  chargeMondeLocal();

  construitSpritesDefenses();
  construitSpriteGardienne();
  construitSpriteQG();
  construitVignettesGrises();

  construitBriefing();
  installeSaisie();
  installeBoutons();
  installeRaz();
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

  if(!enJeu) return;
  majFaune(dt);
  majBilan(dt);
  if(!bilanActif || jeu.fin) majJeu(dt);
  rendu(tempsGlobal, dt);
  majBarresLent(dt);
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
