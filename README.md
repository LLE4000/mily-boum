# Mily Boum

**Forteresse de braise · assaut multijoueur**

Jeu de stratégie d'assaut isométrique, jouable à plusieurs, tenant dans **un seul
fichier HTML sans aucune dépendance**. On débarque sur la plage d'une île, on
démonte les défenses, et on s'attaque au *Brasier* — la forteresse-visage qui
domine la carte et qui ne tombera jamais sous les coups d'un seul joueur.

Ouvrir [`mily-boum.html`](mily-boum.html) suffit : aucun serveur, aucun build,
aucun paquet à installer.

---

## Jouer

| | |
|---|---|
| **Déplacer la vue** | glisser au doigt / à la souris |
| **Zoomer** | pincer à deux doigts, molette, ou les boutons `+` / `−` |
| **Recentrer** | bouton ◎ (revient sur la zone de débarquement) |
| **Débarquer une navette** | toucher la plage à l'est de l'île |
| **Lancer une capacité** | choisir la tuile dans le menu tactique, puis toucher la carte |

L'accès à l'île se fait **uniquement par la plage est**. Les deux flancs et le
fond de la carte sont fermés par des falaises infranchissables.

### Les huit capacités

Le menu tactique en bas à droite tient sur deux rangées de quatre. Chaque emploi
renchérit le suivant (`coût = base + pas × usages`), la poudre se gagne en
détruisant des bâtiments.

| | Rangée du haut | | Rangée du bas | |
|---|---|---|---|---|
| | **Nova** — déflagration, 130 dégâts au cœur + 45 de souffle | 14 (+4) | **Cryo** — gèle une zone 12 s | 8 (+3) |
| | **Poulets ×10** — dix leurres qui aspirent le tir des défenses | 4 (+2) | **Soin** — 30 PV/s pendant 6 s | 5 (+2) |
| | **Brouillard** — masque les troupes 10 s | 3 (+1) | **Balise** — rallie les troupes vers un point | 1 (+1) |
| | **Salve** — 16 obus sur une zone | 10 (+3) | **Viper** — frappe unique de 220 dégâts | 6 (+2) |

**Règle de la Balise.** Posée au sol, elle guide les troupes vers elle ; dès
qu'une troupe **a atteint ou traversé** la zone, la balise cesse
individuellement de l'influencer — elle reprend son comportement normal, chaque
troupe se libérant pour son propre compte. Posée sur un bâtiment, celui-ci
devient la cible prioritaire, et l'effet prend fin **à la destruction de la
cible**.

### Les navettes

Huit navettes, quinze places chacune. **Une navette n'embarque qu'un seul type de
troupe** : on choisit son portrait dans l'écran de briefing, puis son effectif.
La liste des types est ouverte — en ajouter un ne demande qu'une entrée dans
`UNI` et un portrait.

| Troupe | Rôle | PV | Portée | Dégâts | Cadence | Vitesse |
|---|---|---|---|---|---|---|
| **Meuf** | tireuse à distance | 110 | 5,0 | 54 | 1,3 s | 1,35 case/s |
| **Mec** | cogneur au contact | 560 | 1,9 | 100 | 1,6 s | 0,84 case/s |

Quand la flotte est perdue, le renfort arrive au bout de **5 minutes**, avec
40 de poudre en dédommagement.

---

## Le Brasier

La forteresse principale n'est pas un bâtiment comme les autres : c'est
**l'objectif collectif** de la carte.

| Île | PV du Brasier |
|---|---|
| Mily à la plage | 15 000 000 |
| Mily en forêt | 20 000 000 |
| Mily à la campagne | 26 000 000 |

Cent tireuses au contact font environ **4 100 dégâts/s**. Seul et sans opposition,
il faut donc **près d'une heure** pour abattre la première île ; à quinze
joueurs, **quatre minutes**. Le Brasier riposte : éruptions périodiques (préavis
de 1,4 s), pluie de feu sur 21 cases, flaques brûlantes, onde de choc — et sous
30 % de vie il entre en frénésie (+60 % de cadence).

Les défenses ordinaires, elles, restent **volontairement tendres** (420 à
840 PV) : le combat doit rester mobile, la difficulté vient du nombre et de la
riposte du Brasier, pas de murs increvables.

| Défense | Rôle | PV | Portée | Dégâts |
|---|---|---|---|---|
| **Crible** | tourelle automatique jumelée | 720 | 5,15 | 5 / 0,11 s |
| **Chalumeau** | projeteur incendiaire (cône) | 780 | 5,6 | 10 / 0,15 s |
| **Frelon** | batterie de missiles | 840 | 9,0 | 80 |
| **Pilon** | obusier de siège (angle mort à 2,6) | 760 | 8,2 | 64 en zone |
| **Bobine** | pylône à arc, ralentit | 700 | 6,2 | 42 en zone |
| **Cuve** | citerne de naphte (explose) | 420 | — | — |
| **Silo** | réserve de matériel | 500 | — | — |

---

## La carte

152 × 136 cases, soit **20 672 cases** — environ 490 bâtiments et 95 créatures
par île. Le sol est cohérent avec le relief : **sable** sur la plage, **herbe**
en prairie, **roche** au pied des falaises, avec des transitions bruitées plutôt
que des frontières nettes. L'eau est animée (ressac, écume, reflets), et la mer
est habitée : requins, baleines, bancs de poissons, mouettes.

Une **belette** vit sur chaque carte. Elle ne fait que détaler. Ne la tuez pas.

---

## Multijoueur

Le multijoueur repose sur un **client MQTT écrit à la main**, directement sur
WebSocket — pas de bibliothèque. Le codec MQTT 3.1.1 (encodage varint de la
longueur restante, décodeur tamponné) tient dans `10-noyau.js` et est couvert par
les tests.

- Les joueurs d'un même salon partagent la carte : elle est **générée de façon
  déterministe** à partir d'une graine (`graineCarte(code, index)` + xorshift),
  donc identique chez tout le monde sans rien transmettre.
- Les dégâts au Brasier convergent grâce à une **fenêtre glissante de
  déduplication** (`FileDegats`) : un message en retard n'est ni compté deux
  fois, ni perdu.
- Le relais par défaut est un courtier public ; on peut en choisir un autre dans
  l'écran de briefing.

Sans réseau, le jeu se lance normalement en solo.

---

## Déployer sur GitHub Pages

`mily-boum.html` est autonome : ni script externe, ni feuille de style, ni image
distante. Le déploiement se résume à publier le dépôt.

1. **Settings → Pages → Build and deployment → Source : Deploy from a branch**
2. Choisir la branche et le dossier `/ (root)`, puis **Save**
3. Le jeu est servi sur `https://<compte>.github.io/<dépôt>/mily-boum.html`

Pour qu'il soit servi à la racine, il suffit de copier le fichier en
`index.html`.

---

## Construire

Le fichier livré est **assemblé**, pas écrit à la main : les sources vivent dans
`sources/`, découpées par responsabilité, et sont concaténées dans l'ordre
alphabétique.

```sh
node outils/assembler.js     # sources/*  ->  mily-boum.html
node tests/tests.js          # 92 vérifications sur le noyau
```

L'assembleur refuse de produire un fichier qui chargerait une ressource externe
(script, feuille de style, image) ou qui contiendrait une URL autre que celle
d'un relais MQTT : la propriété « aucune dépendance » est revérifiée à chaque
construction.

| Fichier | Contenu |
|---|---|
| `10-noyau.js` | constantes, équilibrage, génération de carte, codec MQTT, file de dégâts |
| `20-outils.js` | primitives de dessin isométriques, flammes, braises, lueurs |
| `30-terrain.js` | sol zonal, bruit fractal, falaises, décor, eau, faune marine |
| `40-defenses.js` | socles des sept défenses + tourelles animées |
| `50-qg.js` | le Brasier : terrasses, tours, couronne, abside, foyers |
| `51-visage-trace.js` | le visage de la gardienne, en polygones vectoriels |
| `52-gardienne.js` | chevelure, gorgerin, yeux vivants, reflets de feu |
| `53-portraits.js` | portraits illustrés des types de troupe |
| `60-unites.js` … `95-son.js` | unités, créatures, jeu, interface, réseau, son |

### Tests

`tests/tests.js` extrait le noyau du HTML construit (`/*==NOYAU_DEBUT==*/ …
/*==NOYAU_FIN==*/`), l'évalue et couvre huit familles :

1. aller-retour de la projection isométrique
2. ancrage du zoom au pincement
3. codec MQTT (encodage, décodage, trames fragmentées)
4. déterminisme de la génération de carte
5. convergence des dégâts entre clients
6. cône de tir du Chalumeau à ±π
7. budget mémoire du canevas de sol (≤ 7 Mpx)
8. cohérence des règles (barème des capacités, durées, temps d'abattage)

```
92 vérifications, tout passe.
```

### Captures

`outils/capture.js` (Playwright + Chromium) ouvre le jeu dans un vrai navigateur,
compose neuf scènes, mesure les images/seconde de chacune et **remonte toute
erreur de page** : c'est autant un test de fumée qu'un outil de capture.

```sh
node outils/capture.js <dossier-de-sortie>
```

---

## Rendu

Tout est dessiné en **Canvas 2D**, sans WebGL et sans image externe. Ce qui tient
le rendu à l'échelle d'une carte de 20 672 cases :

- le sol est **pré-calculé une fois** dans un canevas hors écran, à une échelle
  adaptative bornée à 7 Mpx (falaises comprises) ;
- les bâtiments, rochers et éléments de décor sont **pré-rendus en sprites**, et
  ne gardent en direct que ce qui bouge (tourelles, flammes, yeux) ;
- la pile de rendu est **triée en profondeur** (`gx+gy`) et **cullée** à la vue,
  avec des grilles spatiales pour les bâtiments, les unités et le décor ;
- au-delà d'un certain dézoom, les bâtiments passent en **niveau de détail
  réduit** et la mer n'est plus dessinée quand la côte est hors champ.

Le visage de la gardienne n'est pas une image : c'est un **décalque vectoriel**
(386 polygones, encodés en base 90) découpé au contour du crâne, serti dans une
abside de pierre, avec chevelure, gorgerin, yeux rallumés en direct et reflets de
feu. Le grand rideau de flammes qui monte derrière elle respire sur deux échelles
de temps — vacillement rapide et souffle lent — pour qu'aucun foyer ne paraisse
figé.

---

## Identité

Le vocabulaire, les noms d'unités, de défenses et de capacités, les descriptions
et le code sont **propres au projet**. Rien ici ne reprend la terminologie d'un
autre jeu existant.
