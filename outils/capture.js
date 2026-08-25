#!/usr/bin/env node
/* Capture d'écran du jeu réellement rendu dans Chromium.
   Usage : NODE_PATH=/opt/node22/lib/node_modules node outils/capture.js [dossier]
   Sert aussi de test de fumée : toute erreur JS de la page est rapportée. */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const racine = path.join(__dirname, "..");
const sortie = process.argv[2] || path.join(racine, "captures");
const url = "file://" + path.join(racine, "mily-boum.html");
fs.mkdirSync(sortie, { recursive: true });

/* Actions scriptées dans la page, exécutées entre deux captures. */
const scenes = [
  { nom: "1-briefing", vue: { width: 1280, height: 880 }, action: null, attente: 900 },
  { nom: "2-plage",    vue: { width: 1280, height: 720 }, attente: 1800, action: `
      lancePartie();
      cam.z = 0.62; centreSur(PLAGE_X0 - 4, GH/2); borneCamera();
      poseBarge(GW - 4, GH/2);
      poseBarge(GW - 4, GH/2 - 6);
  ` },
  { nom: "3-combat",   vue: { width: 1280, height: 720 }, attente: 5200, action: `
      cam.z = 1.0; centreSur(PLAGE_X0 - 10, GH/2); borneCamera();
  ` },
  { nom: "4-defenses", vue: { width: 1280, height: 720 }, attente: 1200, action: `
      cam.z = 1.55; centreSur(46, GH/2 - 2); borneCamera();
      /* on plante une défense de chaque type bien en vue */
      var types = ["mitrailleuse","flammes","roquettes","mortier","electro","reservoir","entrepot"];
      jeu.batiments.forEach(function(b){ if(Math.abs(b.gx-46)<9 && Math.abs(b.gy-(GH/2-2))<9) b.vivant = 0; });
      types.forEach(function(t,i){
        jeu.batiments.push({ t:t, gx:42 + (i%4)*3.2, gy:GH/2 - 4 + Math.floor(i/4)*3.4,
          pv:DEF[t].pv, pvMax:DEF[t].pv, e:DEF[t].emprise, n:9000+i, vivant:1,
          angle:0.6, cible:null, prochainTir:0, prochainCiblage:0, flash:0.7, recul:0.6, chargement:0.5 });
      });
  ` },
  { nom: "5-qg",       vue: { width: 1280, height: 720 }, attente: 1400, action: `
      cam.z = 1.35; centreSur(QG_GX + 4, QG_GY); borneCamera();
      jeu.qg.pv = jeu.qg.pvMax * 0.5;
      jeu.qgTelegraphe = 1.0;
  ` },
  { nom: "6-gardienne", vue: { width: 900, height: 900 }, attente: 700, action: `
      cam.z = 1.7; centreSur(QG_GX + 2.6, QG_GY - 0.4); cam.py += 150;
  ` },
  { nom: "7-portrait", vue: { width: 430, height: 860 }, attente: 900, action: `
      ajuste(); cam.z = 0.7; centreSur(PLAGE_X0 - 6, GH/2); borneCamera();
  ` },
  { nom: "8-final",    vue: { width: 1280, height: 720 }, attente: 3400, action: `
      ajuste(); cam.z = 0.9; centreSur(QG_GX + 3, QG_GY); borneCamera();
      jeu.qg.pv = 0; if(!jeu.fin) declencheFin();
  ` }
];

(async () => {
  const navigateur = await chromium.launch({ args: ["--no-sandbox", "--use-gl=swiftshader"] });
  const page = await navigateur.newPage({ viewport: scenes[0].vue, deviceScaleFactor: 1 });
  const erreurs = [];
  page.on("pageerror", e => erreurs.push("pageerror: " + e.message));
  page.on("console", m => { if(m.type() === "error") erreurs.push("console: " + m.text()); });

  await page.goto(url);
  await page.waitForTimeout(1200);

  for(const s of scenes){
    if(s.vue) await page.setViewportSize(s.vue);
    if(s.action){
      try{ await page.evaluate(s.action); }
      catch(e){ erreurs.push("action " + s.nom + " : " + e.message); }
    }
    await page.waitForTimeout(s.attente || 600);
    await page.screenshot({ path: path.join(sortie, s.nom + ".png") });
    console.log("→ " + s.nom + ".png");
  }

  const fps = await page.evaluate("typeof lissageFps !== 'undefined' ? Math.round(lissageFps) : -1");
  const infos = await page.evaluate(`(function(){
    if(typeof jeu === "undefined" || !jeu) return {};
    return { batiments: jeu.batiments.length, creatures: jeu.creatures.length,
             unites: jeu.unites.length, sol: solCv ? (solCv.width*solCv.height/1e6).toFixed(2)+" Mpx" : "?" };
  })()`);
  console.log("images/s ≈ " + fps + " — " + JSON.stringify(infos));

  await navigateur.close();
  if(erreurs.length){
    console.error("\nERREURS DE PAGE :");
    [...new Set(erreurs)].forEach(e => console.error("  " + e));
    process.exit(1);
  }
  console.log("aucune erreur de page.");
})();
