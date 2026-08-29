/* ================================================================
   LE BADGE DE MILY BOUM

   Ce fichier tient en deux moitiés, et la frontière compte.

   EN HAUT, mily-badges.js COLLÉ TEL QUEL. C'est un module fourni, sans
   dépendance, qui sait tout du badge : les paliers, les matières, le
   dessin, la légende. On n'y touche pas — pas une couleur, pas un
   seuil. Le jour où un palier change, il change LÀ, et tout le reste
   du jeu suit sans rien apprendre. C'est la raison d'être de
   MilyBadges.legende() : la page « Les badges » ne recopie aucun nom
   et aucun seuil, elle les demande.

   EN BAS, ce que Mily Boum ajoute : d'où viennent les compteurs, comment
   ils voyagent d'un joueur à l'autre, et comment un pseudo devient le
   petit objet que le module attend. Rien de plus.
   ================================================================ */

/*
 * mily-badges.js — le badge de Mily Boum
 *
 * UN SEUL badge par joueur. Il suit le pseudo partout : classements, salon,
 * plaque de nom sur la carte attaquée.
 *
 * Trois zones, trois questions :
 *
 *   LE DISQUE   au centre   → « où en es-tu sur les huit îles ? »
 *   LES POINTES autour      → « et sur les deux cartes spéciales ? »
 *   LE ROUGE    la bordure  → « as-tu été top carrière ? »
 *
 * Chaque zone a sa propre couleur, chacune se lit d'un coup d'œil à 16 pixels.
 * Le diamètre extérieur ne change jamais : le badge du meilleur joueur occupe
 * la place de celui d'une recrue.
 *
 * Tout le monde en a un dès la première attaque.
 *
 * Aucune dépendance. Se colle tel quel dans le fichier unique du jeu.
 */
(function (root) {
  'use strict';

  /* ================================================================
     LE DISQUE — les huit îles
     ================================================================ */
  var DISQUE = [
    { id:'assaillant', nom:'Assaillant', cond:'a attaqué', mat:'pierre', facettes:0 },
    { id:'bronze',     nom:'Bronze',     cond:'un top 3',  mat:'bronze', facettes:0 },
    { id:'argent',     nom:'Argent',     cond:'un top 2',  mat:'argent', facettes:0 },
    { id:'or',         nom:'Or',         cond:'un top 1',  mat:'or',     facettes:0 },
    /* À cinq victoires le disque cesse d'être rond : bord à douze facettes,
       cœur nettement plus large. La forme change, pas la teinte — une nuance
       d'or supplémentaire ne se verrait pas à 16 px. */
    { id:'orroyal',    nom:'Or royal',   cond:'5 victoires', mat:'orroyal', facettes:12, riche:1 }
  ];

  /* ================================================================
     LES POINTES — les deux cartes spéciales
     Même échelle que le disque. Les trois premiers paliers portent
     huit pointes courtes, serrées contre le disque : seule la matière
     change. Le Soleil, lui, double le nombre de pointes ET les envoie
     jusqu'au bord : c'est un changement de silhouette, visible de loin.
     ================================================================ */
  var POINTES = [
    { id:'aucune', nom:'—',              cond:'—',           mat:null,      n:0,  r1:0,    alt:0, anneau:0 },
    { id:'bronze', nom:'Pointes bronze', cond:'un top 3',    mat:'bronze',  n:8,  r1:13.0, alt:0, anneau:0 },
    { id:'argent', nom:'Pointes argent', cond:'un top 2',    mat:'argent',  n:8,  r1:13.0, alt:0, anneau:0 },
    { id:'or',     nom:'Pointes or',     cond:'un top 1',    mat:'or',      n:8,  r1:13.0, alt:0, anneau:0 },
    { id:'soleil', nom:'Soleil',         cond:'5 victoires', mat:'orroyal', n:16, r1:15.4, alt:1, anneau:1 }
  ];

  /* ================================================================
     LE ROUGE — le top carrière
     La bordure du disque passe au rouge dès le premier titre : le badge
     « devient rouge » d'un coup d'œil, et la matière du centre reste
     lisible dedans. Ensuite on compte en rubis, un par titre — c'est ce
     qui se lit le plus vite, on n'a même pas besoin de savoir lire.
     Au cinquième, les rubis s'effacent au profit de l'auréole et de la
     couronne posée dans le cœur : le badge change de nature.
     ================================================================ */
  var ROUGE = [
    { id:'aucun',    nom:'—',             min:0, rubis:0, aura:0, couronne:0 },
    { id:'un',       nom:'Un rubis',      min:1, rubis:1, aura:0, couronne:0 },
    { id:'deux',     nom:'Deux rubis',    min:2, rubis:2, aura:0, couronne:0 },
    { id:'trois',    nom:'Trois rubis',   min:3, rubis:3, aura:0, couronne:0 },
    { id:'quatre',   nom:'Quatre rubis',  min:4, rubis:4, aura:0, couronne:0 },
    { id:'couronne', nom:'Couronne',      min:5, rubis:0, aura:1, couronne:1 }
  ];

  /* Position des rubis, en degrés : 90 = bas, 0 = droite, 180 = gauche.
     Trois rubis forment un triangle équilatéral, pointe en bas. */
  var ANGLES = { 1:[90], 2:[0,180], 3:[90,210,330], 4:[0,90,180,270] };

  var MATIERES = {
    pierre:  { corps:'#7C8598', bord:'#454D5D', coeur:'#B4BDCB', eclat:'#DCE2EC' },
    bronze:  { corps:'#C67B3C', bord:'#7E4417', coeur:'#F0B478', eclat:'#FFD8B0' },
    argent:  { corps:'#C9D1DD', bord:'#727C92', coeur:'#FFFFFF', eclat:'#FFFFFF' },
    or:      { corps:'#F0BC4E', bord:'#9A6E12', coeur:'#FFE9B0', eclat:'#FFF6DC' },
    orroyal: { corps:'#FFD46B', bord:'#B08214', coeur:'#FFFFFF', eclat:'#FFFFFF' }
  };

  var ROUGE_VIF = '#E4344C';
  var ROUGE_FONCE = '#7E1123';
  var HALO = 'rgba(8,10,18,.92)';   // contour sombre : tenir sur le sable comme sur l'eau

  /* Badges hors échelle, attribués à la main depuis l'administration.
     Ils remplacent complètement le badge calculé. */
  var SPECIAUX = {
    dev: { id:'dev', nom:'Développeur', corps:'#2E2438', bord:'#F5A623', coeur:'#FFD9A0' }
  };

  /* ================================================================
     CALCUL
     ================================================================ */

  /* Accepte soit { or, argent, bronze }, soit un objet par carte
     { jungle:{...}, nuits:{...} } — les deux cartes sont alors additionnées. */
  function totaux(p) {
    var t = { or:0, argent:0, bronze:0 };
    if (!p) return t;
    if (typeof p.or === 'number' || typeof p.argent === 'number' || typeof p.bronze === 'number') {
      t.or = p.or || 0; t.argent = p.argent || 0; t.bronze = p.bronze || 0;
      return t;
    }
    Object.keys(p).forEach(function (k) {
      var m = p[k] || {};
      t.or += m.or || 0; t.argent += m.argent || 0; t.bronze += m.bronze || 0;
    });
    return t;
  }
  function niveauPodium(t) {
    if ((t.or || 0) >= 5) return 4;
    if ((t.or || 0) >= 1) return 3;
    if ((t.argent || 0) >= 1) return 2;
    if ((t.bronze || 0) >= 1) return 1;
    return 0;
  }
  function niveauRouge(n) {
    if (n >= 5) return 5;
    if (n >= 4) return 4;
    if (n >= 3) return 3;
    if (n >= 2) return 2;
    if (n >= 1) return 1;
    return 0;
  }
  function idx(tab, id) {
    for (var i = 0; i < tab.length; i++) if (tab[i].id === id) return i;
    return 0;
  }

  /* joueur = {
       nom: 'Roro',
       stats: {                                  // écrit par le jeu
         iles:      { or:2, argent:1, bronze:3 },
         speciales: { or:1, argent:0, bronze:2 },
         carriere:  1
       },
       overrides: {                              // écrit par l'admin
         bonus: { ilesOr:0, ilesArgent:0, ilesBronze:0,
                  specOr:0, specArgent:0, specBronze:0, carriere:0 },
         force: { disque:null, pointes:null, rouge:null }
       }
     }
     Le badge n'est jamais stocké : seulement ces compteurs. Changer un seuil
     demain ne demande aucune migration. */
  function compute(joueur) {
    var j = joueur || {}, s = j.stats || {}, o = j.overrides || {};
    var b = o.bonus || {}, f = o.force || {};

    /* Un badge spécial remplace tout le reste. */
    if (o.special && SPECIAUX[o.special]) {
      var sp2 = SPECIAUX[o.special];
      return {
        special: sp2, disque: DISQUE[0], pointes: POINTES[0], rouge: ROUGE[0],
        id: 0, ip: 0, ir: 0,
        compte: { iles:{or:0,argent:0,bronze:0}, speciales:{or:0,argent:0,bronze:0}, carriere:0 },
        titre: sp2.nom, cle: 'sp-' + sp2.id
      };
    }

    var ti = totaux(s.iles), ts = totaux(s.speciales);
    var iles = {
      or:     Math.max(0, ti.or     + (b.ilesOr     || 0)),
      argent: Math.max(0, ti.argent + (b.ilesArgent || 0)),
      bronze: Math.max(0, ti.bronze + (b.ilesBronze || 0))
    };
    var spec = {
      or:     Math.max(0, ts.or     + (b.specOr     || 0)),
      argent: Math.max(0, ts.argent + (b.specArgent || 0)),
      bronze: Math.max(0, ts.bronze + (b.specBronze || 0))
    };
    var car = Math.max(0, (s.carriere || 0) + (b.carriere || 0));

    var id = f.disque  ? idx(DISQUE, f.disque)   : niveauPodium(iles);
    var ip = f.pointes ? idx(POINTES, f.pointes) : niveauPodium(spec);
    var ir = f.rouge   ? idx(ROUGE, f.rouge)     : niveauRouge(car);

    var D = DISQUE[id], P = POINTES[ip], R = ROUGE[ir];
    return {
      disque: D, pointes: P, rouge: R,
      id: id, ip: ip, ir: ir,
      compte: { iles: iles, speciales: spec, carriere: car },
      titre: titre(D, P, R, iles, spec, car),
      cle: id + '-' + ip + '-' + ir
    };
  }
  function titre(D, P, R, iles, spec, car) {
    var t = D.nom;
    if (P.mat) t += ' · ' + P.nom;
    if (R.min) t += ' · ' + R.nom;
    var d = [];
    if (iles.or) d.push(iles.or + (iles.or > 1 ? ' victoires' : ' victoire'));
    if (iles.argent) d.push(iles.argent + '× 2e');
    if (iles.bronze) d.push(iles.bronze + '× 3e');
    if (spec.or || spec.argent || spec.bronze) {
      d.push('spéciales : ' + spec.or + '/' + spec.argent + '/' + spec.bronze);
    }
    if (car) d.push(car + (car > 1 ? ' titres carrière' : ' titre carrière'));
    return d.length ? t + ' — ' + d.join(', ') : t;
  }

  /* ================================================================
     DESSIN — repère 32×32, diamètre extérieur constant
     ================================================================ */

  var CX = 16, CY = 16;
  var R_BORD = 10.6;      // bord extérieur du disque
  var R_CHAMP = 8.2;      // champ intérieur

  function pol(n, r, rot) {
    var p = [];
    for (var i = 0; i < n; i++) {
      var a = rot + i * 2 * Math.PI / n;
      p.push((CX + r * Math.cos(a)).toFixed(2) + ',' + (CY + r * Math.sin(a)).toFixed(2));
    }
    return p.join(' ');
  }

  function svg(b, opts) {
    opts = opts || {};
    var taille = opts.size || 16;
    var grand = taille >= 28;
    var m = MATIERES[b.disque.mat] || MATIERES.pierre;
    var mp = b.pointes.mat ? MATIERES[b.pointes.mat] : null;
    var g = [];

    g.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="' + taille +
           '" height="' + taille + '" role="img" aria-label="' + esc(b.titre) + '">');
    g.push('<title>' + esc(b.titre) + '</title>');

    /* Badge spécial : hexagone graphite cerclé d'orange, hors de toute échelle.
       Impossible de le confondre avec un badge mérité. */
    if (b.special) {
      var hex = pol(6, R_BORD, -Math.PI / 2), hexi = pol(6, R_CHAMP, -Math.PI / 2);
      g.push('<polygon points="' + hex + '" fill="none" stroke="' + HALO + '" stroke-width="3" stroke-linejoin="round"/>');
      g.push('<polygon points="' + hex + '" fill="' + b.special.bord + '" stroke-linejoin="round"/>');
      g.push('<polygon points="' + hexi + '" fill="' + b.special.corps + '" stroke-linejoin="round"/>');
      g.push('<circle cx="16" cy="16" r="3.4" fill="' + b.special.coeur + '"/>');
      g.push('<path d="M23.4 6.2 L24.6 9.2 L27.6 10.4 L24.6 11.6 L23.4 14.6 L22.2 11.6 L19.2 10.4 L22.2 9.2 Z" fill="' +
             b.special.bord + '" stroke="' + HALO + '" stroke-width="1" stroke-linejoin="round"/>');
      g.push('</svg>');
      return g.join('');
    }

    /* auréole rouge — dernier palier */
    if (b.rouge.aura) {
      g.push('<circle cx="16" cy="16" r="14.2" fill="none" stroke="' + ROUGE_VIF +
             '" stroke-width="2.4" opacity=".42"/>');
    }

    /* pointes : triangles, contour sombre puis matière */
    if (mp) {
      var n = b.pointes.n, alt = b.pointes.alt, rMax = b.pointes.r1;
      var tri = [], i, a, rr, demi = (n > 8 ? 0.10 : 0.16);
      for (i = 0; i < n; i++) {
        a = -Math.PI / 2 + i * 2 * Math.PI / n;
        rr = (alt && i % 2) ? rMax * 0.74 : rMax;
        tri.push([
          (CX + Math.cos(a) * rr).toFixed(2) + ',' + (CY + Math.sin(a) * rr).toFixed(2),
          (CX + Math.cos(a - demi) * (R_BORD - 0.6)).toFixed(2) + ',' + (CY + Math.sin(a - demi) * (R_BORD - 0.6)).toFixed(2),
          (CX + Math.cos(a + demi) * (R_BORD - 0.6)).toFixed(2) + ',' + (CY + Math.sin(a + demi) * (R_BORD - 0.6)).toFixed(2)
        ].join(' '));
      }
      tri.forEach(function (p) {
        g.push('<polygon points="' + p + '" fill="none" stroke="' + HALO +
               '" stroke-width="2.4" stroke-linejoin="round"/>');
      });
      tri.forEach(function (p) {
        g.push('<polygon points="' + p + '" fill="' + mp.corps + '" stroke="' + mp.bord +
               '" stroke-width="0.7" stroke-linejoin="round"/>');
      });
      /* Le Soleil relie ses pointes par un anneau : il se lit comme un astre
         plein, plus comme une couronne de piquants. */
      if (b.pointes.anneau) {
        g.push('<circle cx="16" cy="16" r="11.6" fill="none" stroke="' + HALO + '" stroke-width="2.4"/>');
        g.push('<circle cx="16" cy="16" r="11.6" fill="none" stroke="' + mp.corps + '" stroke-width="1.2"/>');
      }
    }

    /* disque : contour sombre, bordure, champ, cœur.
       Au dernier palier le disque devient un polygone à douze facettes : c'est
       le seul changement de forme du centre, et il se voit immédiatement. */
    var f = b.disque.facettes;
    var bordF = f ? '<polygon points="' + pol(f, R_BORD, -Math.PI / 2) + '"'
                  : '<circle cx="16" cy="16" r="' + R_BORD + '"';
    var champF = f ? '<polygon points="' + pol(f, R_CHAMP, -Math.PI / 2) + '"'
                   : '<circle cx="16" cy="16" r="' + R_CHAMP + '"';

    g.push(bordF + ' fill="none" stroke="' + HALO + '" stroke-width="3" stroke-linejoin="round"/>');
    g.push(bordF + ' fill="' + (b.ir >= 1 ? ROUGE_VIF : m.bord) + '" stroke-linejoin="round"/>');
    if (b.ir >= 1) {
      g.push('<circle cx="16" cy="16" r="' + (R_BORD - 0.9) + '" fill="none" stroke="' +
             ROUGE_FONCE + '" stroke-width="0.8" opacity=".7"/>');
    }
    g.push(champF + ' fill="' + m.corps + '" stroke="' + m.bord +
           '" stroke-width="0.8" stroke-linejoin="round"/>');

    /* reflet en haut du champ : ce qui donne l'aspect métal poli */
    g.push('<path d="M 9.4 13.6 A 8.2 8.2 0 0 1 22.6 13.6 A 8.2 8.2 0 0 0 9.4 13.6 Z" fill="' +
           m.eclat + '" opacity=".38"/>');

    if (b.disque.riche) {   // 5 victoires : un second anneau fin
      g.push('<circle cx="16" cy="16" r="6.2" fill="none" stroke="' + m.bord +
             '" stroke-width="0.8" opacity=".55"/>');
    }
    var rCoeur = b.rouge.couronne ? 5.3 : (b.disque.riche ? 4.2 : 3.4);
    g.push('<circle cx="16" cy="16" r="' + rCoeur + '" fill="' + m.coeur + '"/>');
    if (grand && !b.rouge.couronne) {
      g.push('<circle cx="14.6" cy="14.6" r="1.1" fill="#FFFFFF" opacity=".75"/>');
    }

    /* la couronne se pose dans le cœur clair, elle ne déborde pas */
    if (b.rouge.couronne) {
      var dc = 'M12.9 18.4 L12.4 13.4 L14.5 15.3 L16 12.8 L17.5 15.3 L19.6 13.4 L19.1 18.4 Z';
      g.push('<path d="' + dc + '" fill="' + ROUGE_VIF + '" stroke="' + ROUGE_FONCE +
             '" stroke-width="0.6" stroke-linejoin="round"/>');
    }

    /* un rubis par titre, jusqu'à quatre — on les compte d'un regard */
    if (b.rouge.rubis) {
      (ANGLES[b.rouge.rubis] || []).forEach(function (deg) {
        var a = deg * Math.PI / 180;
        var x = (CX + Math.cos(a) * R_BORD).toFixed(2);
        var y = (CY + Math.sin(a) * R_BORD).toFixed(2);
        g.push('<circle cx="' + x + '" cy="' + y + '" r="3.4" fill="' + HALO + '"/>');
        g.push('<circle cx="' + x + '" cy="' + y + '" r="2.5" fill="' + ROUGE_VIF +
               '" stroke="' + ROUGE_FONCE + '" stroke-width="0.6"/>');
        if (grand) {
          g.push('<circle cx="' + (+x - 0.8).toFixed(2) + '" cy="' + (+y - 0.8).toFixed(2) +
                 '" r="0.8" fill="#FFD5DC" opacity=".9"/>');
        }
      });
    }

    g.push('</svg>');
    return g.join('');
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ================================================================
     AFFICHAGE
     ================================================================ */

  function render(el, joueur, opts) {
    if (!el) return null;
    opts = opts || {};
    var b = compute(joueur);
    el.innerHTML = '';
    var sp = document.createElement('span');
    sp.className = 'mily-badge';
    sp.title = b.titre;
    sp.style.display = 'inline-flex';
    sp.style.verticalAlign = 'middle';
    sp.style.marginLeft = '4px';
    sp.innerHTML = svg(b, { size: opts.size || 16 });
    el.appendChild(sp);
    return b;
  }

  /* Canvas : le SVG devient une image une seule fois, en cache sur la clé du
     badge. Ne jamais reconstruire l'image dans la boucle de rendu. */
  var cache = {};
  function toImage(b, taille) {
    var k = b.cle + '@' + taille;
    if (cache[k]) return cache[k];
    var img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg(b, { size: taille }));
    cache[k] = img;
    return img;
  }
  function drawOnCanvas(ctx2d, joueur, x, y, taille) {
    var b = compute(joueur);
    var img = toImage(b, taille * 2);          // ×2 : net sur écran haute densité
    if (img.complete) ctx2d.drawImage(img, x, y - taille / 2, taille, taille);
    return taille;
  }
  function precharger(joueurs, taille) {
    (joueurs || []).forEach(function (j) { toImage(compute(j), (taille || 16) * 2); });
  }

  /* Tout ce qu'il faut pour construire la page « Les badges » sans rien
     recopier à la main : chaque entrée porte son nom, sa condition, et un
     joueur d'exemple prêt à passer à svg(). Si un palier change demain, la
     page suit toute seule. */
  function legende() {
    var exD = [{}, { bronze:1 }, { argent:1 }, { or:1 }, { or:5 }];
    var exP = [{}, { bronze:1 }, { argent:1 }, { or:1 }, { or:5 }];
    return {
      disque: DISQUE.map(function (d, i) {
        return { nom:d.nom, cond:d.cond, joueur:{ stats:{ iles:exD[i] } } };
      }),
      pointes: POINTES.map(function (p, i) {
        return { nom:(p.mat ? p.nom : 'Aucune pointe'), cond:p.cond,
                 joueur:{ stats:{ iles:{ or:1 }, speciales:exP[i] } } };
      }),
      rouge: ROUGE.map(function (r) {
        return { nom:(r.min ? r.nom : 'Aucun rubis'),
                 cond:(r.min ? r.min + (r.min > 1 ? ' titres carrière' : ' titre carrière') : '—'),
                 joueur:{ stats:{ iles:{ or:5 }, speciales:{ or:1 }, carriere:r.min } } };
      }),
      speciaux: Object.keys(SPECIAUX).map(function (k) {
        return { nom:SPECIAUX[k].nom, cond:'attribué à la main',
                 joueur:{ overrides:{ special:k } } };
      })
    };
  }

  var API = {
    DISQUE: DISQUE, POINTES: POINTES, ROUGE: ROUGE, ANGLES: ANGLES,
    MATIERES: MATIERES, SPECIAUX: SPECIAUX,
    compute: compute,
    legende: legende,
    svg: svg,
    render: render,
    toImage: toImage,
    drawOnCanvas: drawOnCanvas,
    precharger: precharger,
    version: '3.3.0'
  };

  root.MilyBadges = API;
  if (typeof module === 'object' && module.exports) module.exports = API;

})(typeof window !== 'undefined' ? window : this);

/* ================================================================
   CE QUE MILY BOUM AJOUTE — D'OÙ VIENNENT LES COMPTEURS

   Le module ne sait rien du jeu : on lui tend sept nombres, il rend un
   badge. Reste à dire d'où viennent ces sept nombres, et c'est ici.

   ILS VOYAGENT DANS L'INSTANTANÉ PARTAGÉ, à côté des champions et des
   podiums gelés. C'est leur place, et pour les trois mêmes raisons :
   comme eux ils décrivent ce que quelqu'un a FAIT, comme eux ils
   traversent une remise à zéro du salon, et comme eux aucun client
   n'a autorité sur les autres pour les écrire.

   QUATRE VOIES, et la quatrième ne se fusionne pas comme les trois
   premières :

     bg   les compteurs — sept nombres par pseudo
     bgn  la chute DÉJÀ COMPTÉE, carte par carte
     bgc  la dernière campagne déjà créditée en titre carrière
     bo   les réglages d'administration, et bon pour numéro

   Les trois premières fusionnent par MAXIMUM : monotone, commutatif,
   associatif, idempotent, exactement comme le reste de ce fichier.
   La quatrième ne le peut pas — un bonus doit pouvoir DESCENDRE quand
   on le corrige, et un maximum ne redescend jamais. Elle suit donc le
   patron des épingles : un numéro tranche, et le plus haut l'emporte
   en entier.

   LE BADGE N'EST JAMAIS RANGÉ, seulement ces compteurs. Le jour où un
   palier bouge dans le tableau du haut, il n'y a rien à migrer.
   ================================================================ */

/* ================================================================
   COMPTER LES PODIUMS — UNE FOIS, ET UNE SEULE

   Aucun compteur n'est incrémenté « à la fin de la partie » par le
   client qui gagne : il ne serait pas là si son navigateur avait
   fermé, et deux clients qui comptent le même podium compteraient
   deux fois. Ce sont les PODIUMS GELÉS qui font foi — ils sont déjà
   dans l'instantané, déjà signés, déjà d'accord entre tous.

   Chaque podium porte son NUMÉRO de chute. On garde le dernier numéro
   compté par carte : tant qu'il n'a pas bougé, il n'y a rien à faire ;
   dès qu'il monte, on compte ce podium-là et on note le numéro. Deux
   clients qui comptent la même chute partent du même compteur et
   arrivent au même nombre — le maximum de la fusion les met d'accord
   sans qu'ils aient à se parler.

   ET C'EST CE QUI REND L'HISTOIRE VISIBLE DÈS LE PREMIER CHARGEMENT.
   Au tout premier passage, aucune chute n'est comptée et toutes les
   îles déjà tombées en ont une : chacun retrouve donc d'un coup les
   podiums qu'il a vraiment gagnés. Rien n'est remis à zéro, rien n'est
   inventé — on lit ce qui était déjà écrit.

   CE QUE ÇA NE SAIT PAS FAIRE, et il faut le dire : t3 ne garde que le
   DERNIER podium de chaque carte. Une île tombée trois fois pendant
   qu'on avait le jeu fermé ne compte qu'une fois — celle qu'on peut
   voir. On ne compte que ce qu'on peut lire.
   ================================================================ */
/* L'enveloppe : elle prend les trois chaînes dans l'instantané, appelle
   le calcul pur du noyau, et repose le résultat. Rien de plus — c'est
   la seule ligne de ce fichier qui connaisse `monde`. */
function compteLesPodiums(){
  if(!monde) return false;
  var r = compteLesPodiumsPur(monde.bg, monde.bgn, monde.t3);
  if(!r) return false;
  monde.bg = r.bg; monde.bgn = r.bgn;
  return true;
}

/* LE TITRE CARRIÈRE SE GAGNE À LA FIN D'UNE CAMPAGNE.

   C'est le seul moment du jeu où « top carrière » est un ÉVÉNEMENT et
   non un état : les huit îles sont tombées, le classement des dégâts
   se fige, et son premier a gagné cette campagne-là. Le reste du
   temps, être en tête du Top carrière est une situation — qui peut
   changer demain —, et on ne décerne pas un titre pour une situation.

   Le numéro de CAMPAGNE sert de clé, exactement comme le numéro de
   chute sert de clé aux podiums : on ne crédite jamais deux fois le
   même tour du monde, quel que soit le nombre de clients qui le
   voient se refermer. */
function crediteTitreCarriere(cycle, nom){
  if(!monde) return false;
  var c = cycle | 0;
  if(!(c > (monde.bgc | 0))) return false;
  monde.bgc = c;
  /* Une campagne sans vainqueur lisible est quand même créditée : sans
     ça, on la recompterait indéfiniment à chaque publication. */
  if(nettoieNomScore(nom)) monde.bg = ajouteTitreCarriere(monde.bg, nom);
  return true;
}

/* ================================================================
   LE JOUEUR TEL QUE LE MODULE L'ATTEND

   Fabriqué à la demande depuis l'instantané, jamais rangé. Les deux
   tables sont décodées une fois par version de chaîne : un classement
   de vingt lignes redécoderait sinon vingt fois la même chose.
   ================================================================ */
var BADGE_LU = { bg:null, bo:null, t:{}, r:{} };
function tablesBadge(){
  var bg = (monde && monde.bg) || "", bo = (monde && monde.bo) || "";
  if(BADGE_LU.bg !== bg || BADGE_LU.bo !== bo){
    BADGE_LU.bg = bg; BADGE_LU.bo = bo;
    BADGE_LU.t = decodeBadges(bg);
    BADGE_LU.r = decodeReglagesBadge(bo);
  }
  return BADGE_LU;
}
function joueurBadge(nom){
  var n = nettoieNomScore(nom), T = tablesBadge();
  var s = T.t[n] || bgVide(), r = T.r[n];
  var j = {
    nom:n,
    stats:{
      iles:      { or:s.io, argent:s.ia, bronze:s.ib },
      speciales: { or:s.so, argent:s.sa, bronze:s.sb },
      carriere:  s.ca
    }
  };
  if(r){
    j.overrides = {
      special: r.special || null,
      bonus:{ ilesOr:r.io, ilesArgent:r.ia, ilesBronze:r.ib,
              specOr:r.so, specArgent:r.sa, specBronze:r.sb, carriere:r.ca },
      force:{ disque:r.disque || null, pointes:r.pointes || null, rouge:r.rouge || null }
    };
  }
  return j;
}

/* ================================================================
   POSER LES BADGES DANS UN MORCEAU DE PAGE

   Le jeu bâtit ses classements en CHAÎNES, pas en éléments : on y
   sème donc une balise vide portant le pseudo, et on la remplit après
   coup avec MilyBadges.render(). Deux avantages, et le second est le
   vrai : la chaîne bâtie reste comparable à elle-même — c'est elle
   qu'on garde en mémoire pour ne réécrire que ce qui change —, et le
   module reste le seul à savoir dessiner un badge.
   ================================================================ */
function balliseBadge(nom){
  return '<span class="bdg" data-bdg="' + echappe(nettoieNomScore(nom)) + '"></span>';
}
function poseBadges(racine, taille){
  if(!racine || typeof MilyBadges === "undefined") return;
  var l = racine.querySelectorAll("[data-bdg]");
  for(var i = 0; i < l.length; i++){
    if(l[i].firstChild) continue;                 // déjà posé
    MilyBadges.render(l[i], joueurBadge(l[i].getAttribute("data-bdg")), { size:taille || 16 });
  }
}

/* ================================================================
   LE PRÉCHARGEMENT

   Un badge dessiné sur le canevas est une IMAGE, et une image mise en
   cache ne s'affiche qu'une fois chargée. Sans ce passage, le badge
   d'un joueur manquerait les premières images de sa plaque de nom —
   assez peu pour qu'on ne sache pas dire pourquoi, assez pour que ça
   scintille.

   LA TAILLE EST CELLE DU DESSIN, doublée par le module pour les écrans
   denses. Précharger à une autre taille ne servirait à rien : le cache
   est rangé sur « clé du badge @ taille ».
   ================================================================ */
var BADGE_CARTE = 16;          // la plaque de nom, et rien d'autre
function prechargeBadges(){
  if(typeof MilyBadges === "undefined") return;
  var l = [], id, vus = {};
  function pousse(n){
    var c = nettoieNomScore(n);
    if(!c || vus[c]) return;
    vus[c] = 1; l.push(joueurBadge(c));
  }
  pousse(typeof monNom === "string" ? monNom : "");
  if(typeof autresJoueurs === "object") for(id in autresJoueurs) pousse(autresJoueurs[id].nom);
  /* et tous ceux que la table connaît : celui qui débarque en cours de
     partie a déjà son image quand sa plaque apparaît */
  var T = tablesBadge(), k;
  for(k in T.t) pousse(k);
  MilyBadges.precharger(l, BADGE_CARTE);
}

/* ================================================================
   LA PAGE « LES BADGES »

   ELLE NE RECOPIE RIEN. Pas un nom de palier, pas un seuil, pas une
   couleur : tout sort de MilyBadges.legende(), qui rend pour chaque
   entrée son nom, sa condition, et un JOUEUR D'EXEMPLE. Le badge
   affiché est donc celui que le module produirait pour un vrai joueur
   dans cet état — pas une illustration qu'il faudrait penser à
   remettre à jour.

   C'est la seule façon d'écrire cette page qui ne mente pas le jour
   où un palier bouge. Une table recopiée à la main aurait été juste
   une fois, le jour où on l'a écrite.
   ================================================================ */
var BADGES_SECTIONS = [
  { cle:"disque",  titre:"Le disque — les huit îles",
    note:"Le centre du badge. Il dit ce que tu as fait sur les îles ordinaires. "
       + "Au dernier palier il cesse d'être rond : douze facettes et un cœur "
       + "élargi, parce qu'une nuance d'or de plus ne se verrait pas à seize pixels." },
  { cle:"pointes", titre:"Les pointes — les deux cartes spéciales",
    note:"Autour du disque, sur la même échelle. Les podiums de « Mily dans la "
       + "jungle » et des « Mily et une nuits » s'additionnent. Le Soleil double "
       + "le nombre de pointes et les envoie jusqu'au bord : ça change la "
       + "silhouette, pas la teinte." },
  { cle:"rouge",   titre:"Le rouge — les campagnes gagnées",
    note:"La bordure passe au rouge dès le premier titre, puis on compte en "
       + "rubis — un par campagne remportée. Au cinquième, les rubis s'effacent "
       + "au profit de l'auréole et de la couronne posée dans le cœur." },
  { cle:"speciaux", titre:"Hors échelle",
    note:"Attribué à la main depuis l'administration, il remplace le badge "
       + "calculé. C'est le seul hexagone du jeu : impossible de le confondre "
       + "avec un badge mérité." }
];
function construitPageBadges(){
  var e = $("badgesCorps");
  if(!e || typeof MilyBadges === "undefined") return;
  var L = MilyBadges.legende(), h = "", i, k;
  for(i = 0; i < BADGES_SECTIONS.length; i++){
    var S = BADGES_SECTIONS[i], l = L[S.cle] || [];
    if(!l.length) continue;
    h += "<h4>" + echappe(S.titre) + "</h4>"
       + '<div class="bgN">' + echappe(S.note) + "</div>"
       + '<div class="bgGrille">';
    for(k = 0; k < l.length; k++){
      var b = MilyBadges.compute(l[k].joueur);
      h += '<div class="bgCase">'
         + '<div class="gr">' + MilyBadges.svg(b, { size:62 }) + "</div>"
         + '<div class="nm">' + echappe(l[k].nom) + "</div>"
         + '<div class="cd">' + echappe(l[k].cond) + "</div>"
         + '<div class="p16">' + MilyBadges.svg(b, { size:16 }) + "</div>"
         + "</div>";
    }
    h += "</div>";
  }
  e.innerHTML = h;
}
function ouvrePageBadges(){ construitPageBadges(); $("badgesP").classList.add("on"); }
function fermePageBadges(){ $("badgesP").classList.remove("on"); }
function installePageBadges(){
  var b = $("btBadges"), f = $("btBadgesFerme"), p = $("badgesP");
  if(b) b.addEventListener("click", ouvrePageBadges);
  if(f) f.addEventListener("click", fermePageBadges);
  /* le fond se touche pour fermer, comme les autres pages du jeu */
  if(p) p.addEventListener("click", function(ev){ if(ev.target === p) fermePageBadges(); });
}

/* ================================================================
   L'ÉDITEUR DE BADGE — CÔTÉ ADMINISTRATION

   DEUX OUTILS, ET LEUR DIFFÉRENCE EST TOUT LE SUJET.

   LE BONUS s'ajoute à ce que le jeu a compté. Un joueur à qui l'on
   rend trois titres carrière retrouve ses trois rubis ET CONTINUE DE
   PROGRESSER : deux campagnes de plus et il décroche la Couronne tout
   seul, sans que personne ait à y toucher.

   LE NIVEAU FORCÉ, lui, remplace le compte et le FIGE. Un joueur à qui
   l'on impose « trois rubis » y restera pour toujours, quoi qu'il
   gagne ensuite — et il faudra le corriger à la main à chaque palier.

   C'est pour ça que rendre des titres perdus se fait au bonus, jamais
   au niveau forcé. C'est écrit dans l'aide de cet écran, parce que le
   jour où on l'oubliera, la différence ne se verra pas avant des
   semaines.

   `stats` reste écrit par le JEU, `bo` par l'ADMIN : l'un n'écrase
   jamais l'autre, ce sont deux voies séparées de l'instantané.
   ================================================================ */
var EDB_CHAMPS = { io:"edBio", ia:"edBia", ib:"edBib",
                   so:"edBso", sa:"edBsa", sb:"edBsb", ca:"edBca" };

/* Les listes se remplissent depuis les TABLEAUX du module, jamais à la
   main : un palier ajouté demain apparaîtra ici sans qu'on y pense. */
function remplitListeBadge(id, tab, vide){
  var e = $(id);
  if(!e || typeof MilyBadges === "undefined") return;
  var h = '<option value="">' + vide + "</option>", i;
  for(i = 0; i < tab.length; i++){
    var n = tab[i].nom;
    /* le palier zéro s'appelle « — » dans deux des trois tableaux :
       dans une liste déroulante ce n'est pas un nom, c'est un trou */
    if(n === "—") n = "niveau 0 (aucun)";
    h += '<option value="' + echappe(tab[i].id) + '">' + echappe(n) + "</option>";
  }
  e.innerHTML = h;
}
function lisEditeurBadge(){
  var r = reglageVide(), k;
  for(k in EDB_CHAMPS){
    var e = $(EDB_CHAMPS[k]);
    r[k] = e ? (parseInt(e.value, 10) || 0) : 0;
  }
  r.disque  = $("edFdisque")  ? $("edFdisque").value  : "";
  r.pointes = $("edFpointes") ? $("edFpointes").value : "";
  r.rouge   = $("edFrouge")   ? $("edFrouge").value   : "";
  r.special = $("edSpecial")  ? $("edSpecial").value  : "";
  r.eclat   = ($("edEclat")  && $("edEclat").value  === "1") ? 1 : 0;
  r.masque  = ($("edMasque") && $("edMasque").value === "1") ? 1 : 0;
  return r;
}
function ecrisEditeurBadge(r){
  var k;
  for(k in EDB_CHAMPS){ var e = $(EDB_CHAMPS[k]); if(e) e.value = r[k] | 0; }
  if($("edFdisque"))  $("edFdisque").value  = r.disque  || "";
  if($("edFpointes")) $("edFpointes").value = r.pointes || "";
  if($("edFrouge"))   $("edFrouge").value   = r.rouge   || "";
  if($("edSpecial"))  $("edSpecial").value  = r.special || "";
  if($("edEclat"))    $("edEclat").value    = r.eclat  ? "1" : "0";
  if($("edMasque"))   $("edMasque").value   = r.masque ? "1" : "0";
}
/* L'APERÇU MONTRE LE BADGE QU'ON OBTIENDRA, pas celui qui est rangé :
   les compteurs du jeu pour ce pseudo, PLUS les réglages en cours de
   saisie. C'est la seule façon de régler sans appliquer pour voir. */
function majApercuBadge(){
  if(typeof MilyBadges === "undefined") return;
  var nom = $("edBadgeQui") ? $("edBadgeQui").value : "";
  var T = tablesBadge(), s = T.t[nettoieNomScore(nom)] || bgVide();
  var r = lisEditeurBadge();
  var j = {
    nom:nom,
    stats:{ iles:{ or:s.io, argent:s.ia, bronze:s.ib },
            speciales:{ or:s.so, argent:s.sa, bronze:s.sb },
            carriere:s.ca },
    overrides:{
      special:r.special || null,
      bonus:{ ilesOr:r.io, ilesArgent:r.ia, ilesBronze:r.ib,
              specOr:r.so, specArgent:r.sa, specBronze:r.sb, carriere:r.ca },
      force:{ disque:r.disque || null, pointes:r.pointes || null, rouge:r.rouge || null }
    }
  };
  var b = MilyBadges.compute(j);
  /* L'APERÇU MONTRE AUSSI LE NOM quand il est en rose : le badge seul
     ne dirait rien de ce que le rose donne, et c'est pourtant lui
     qu'on règle ici. */
  var eo = $("edBadgeNomOr");
  if(eo) eo.innerHTML = r.eclat
    ? '<span class="nomRose">' + echappe(nom || "Havana") + "</span>"
    : '<span style="opacity:.5">' + echappe(nom || "—") + "</span>";
  if($("edBadgeGros")) $("edBadgeGros").innerHTML = MilyBadges.svg(b, { size:104 });
  if($("edBadge16"))   $("edBadge16").innerHTML   = MilyBadges.svg(b, { size:16 });
  if($("edBadgeTitre")) $("edBadgeTitre").textContent =
    b.disque.nom + (b.pointes.mat ? " · " + b.pointes.nom : "")
                 + (b.rouge.min ? " · " + b.rouge.nom : "");
  if($("edBadgeDetail")) $("edBadgeDetail").textContent =
    "Compté par le jeu : " + s.io + "/" + s.ia + "/" + s.ib + " sur les îles, "
    + s.so + "/" + s.sa + "/" + s.sb + " sur les spéciales, "
    + s.ca + (s.ca > 1 ? " titres" : " titre") + " carrière."
    + "  →  après réglage : " + b.compte.iles.or + " victoire"
    + (b.compte.iles.or > 1 ? "s" : "") + ", " + b.compte.carriere
    + (b.compte.carriere > 1 ? " titres" : " titre") + ".";
}
/* Charge ce qui est DÉJÀ rangé pour ce pseudo — sans quoi on écraserait
   sans le savoir un réglage posé la semaine dernière. */
function chargeEditeurBadge(){
  var nom = $("edBadgeQui") ? $("edBadgeQui").value : "";
  var T = tablesBadge();
  ecrisEditeurBadge(T.r[nettoieNomScore(nom)] || reglageVide());
  majApercuBadge();
}
function appliqueEditeurBadge(razr){
  var champ = $("edBadgeQui"), nom = nettoieNomScore(champ ? champ.value : "");
  var etat = $("edBadgeEtat");
  if(!nom){ if(etat) etat.textContent = "Indique d'abord un pseudo."; return; }
  if(!monde){ if(etat) etat.textContent = "Le salon n'est pas encore chargé."; return; }
  var tab = decodeReglagesBadge(monde.bo || "");
  if(razr){ delete tab[nom]; ecrisEditeurBadge(reglageVide()); }
  else tab[nom] = lisEditeurBadge();
  publieReglagesBadge(tab);
  majApercuBadge();
  if(etat) etat.textContent = razr
    ? ("Réglages effacés pour « " + nom + " ». Son badge repart de ce que le jeu a compté.")
    : ("Réglages appliqués à « " + nom + " » et publiés dans le salon.");
}

/* ================================================================
   ÉCRIRE LA TABLE DES RÉGLAGES, ET LA PUBLIER

   Deux portes mènent ici — l'éditeur de badge, et le bouton de retrait
   posé sur la page des passages —, et il ne doit y avoir qu'un seul
   chemin d'écriture. Deux copies de ces quinze lignes, c'est la
   garantie qu'un jour l'une des deux oubliera de monter le numéro.
   ================================================================ */
function publieReglagesBadge(tab){
  if(!monde) return false;
  monde.bo = encodeReglagesBadge(tab);
  /* LE NUMÉRO MONTE À CHAQUE ÉCRITURE, et c'est lui qui autorise un
     réglage à RÉTRÉCIR : sans numéro, la fusion prendrait le maximum
     et un bonus corrigé à la baisse remonterait tout seul chez les
     autres joueurs. */
  monde.bon = (monde.bon | 0) + 1;
  monde.v   = (monde.v | 0) + 1;
  BADGE_LU.bg = null;                       // la table relue a changé
  if(typeof sauveMondeLocal === "function") sauveMondeLocal();
  if(typeof publieMonde === "function") publieMonde();
  else if(typeof reseau === "object" && reseau.connecte && typeof envoieTrame === "function")
    envoieTrame(paquetPublish(SUJET_MONDE, JSON.stringify(monde), true));
  prechargeBadges();
  if(typeof majCarriere === "function") majCarriere();
  if(typeof majMondes === "function" && !enJeu) majMondes();
  return true;
}
/* Un seul drapeau, pour un seul pseudo. Sert au retrait depuis la page
   des passages ; l'éditeur, lui, écrit la ligne entière. */
function poseDrapeauBadge(nom, champ, valeur){
  var n = nettoieNomScore(nom);
  if(!n || !monde) return false;
  var tab = decodeReglagesBadge(monde.bo || "");
  if(!tab[n]) tab[n] = reglageVide();
  tab[n][champ] = valeur ? 1 : 0;
  return publieReglagesBadge(tab);
}
/* Et le retour en arrière : on rend tous les comptes retirés d'un
   coup. Un retrait sans marche arrière ne serait pas un réglage. */
function rendLesMasques(){
  if(!monde) return false;
  var tab = decodeReglagesBadge(monde.bo || ""), k, n = 0;
  for(k in tab) if(tab[k].masque){ tab[k].masque = 0; n++; }
  if(!n) return false;
  return publieReglagesBadge(tab);
}

function ouvreEditeurBadges(){
  if(typeof MilyBadges === "undefined") return;
  remplitListeBadge("edFdisque",  MilyBadges.DISQUE,  "— aucun (le jeu compte)");
  remplitListeBadge("edFpointes", MilyBadges.POINTES, "— aucun (le jeu compte)");
  remplitListeBadge("edFrouge",   MilyBadges.ROUGE,   "— aucun (le jeu compte)");
  var sp = $("edSpecial");
  if(sp){
    var h = '<option value="">aucun</option>', k;
    for(k in MilyBadges.SPECIAUX)
      h += '<option value="' + echappe(k) + '">' + echappe(MilyBadges.SPECIAUX[k].nom) + "</option>";
    sp.innerHTML = h;
  }
  /* la liste des pseudos connus, pour ne pas avoir à les retaper */
  var dl = $("edBadgeNoms");
  if(dl){
    var vus = {}, h2 = "", i, l = (typeof classementSalon === "function") ? classementSalon() : [];
    for(i = 0; i < l.length; i++) vus[l[i].nom] = 1;
    var T = tablesBadge(), n;
    for(n in T.t) vus[n] = 1;
    for(n in T.r) vus[n] = 1;
    for(n in vus) h2 += '<option value="' + echappe(n) + '">';
    dl.innerHTML = h2;
  }
  var q = $("edBadgeQui");
  if(q && !q.value && typeof monNom === "string") q.value = monNom;
  chargeEditeurBadge();
  $("edBadgeP").classList.add("on");
}
function fermeEditeurBadges(){ $("edBadgeP").classList.remove("on"); }
function installeEditeurBadges(){
  var b = $("btAdminBadges"), f = $("btEdBadgeFerme"), p = $("edBadgeP");
  if(b) b.addEventListener("click", function(){
    if(typeof fermeAdminP === "function") fermeAdminP();
    ouvreEditeurBadges();
  });
  if(f) f.addEventListener("click", fermeEditeurBadges);
  if(p) p.addEventListener("click", function(ev){ if(ev.target === p) fermeEditeurBadges(); });
  var q = $("edBadgeQui");
  if(q){ q.addEventListener("input", chargeEditeurBadge);
         q.addEventListener("change", chargeEditeurBadge); }
  var k, ids = ["edFdisque", "edFpointes", "edFrouge", "edSpecial",
                "edEclat", "edMasque"];
  for(k in EDB_CHAMPS) ids.push(EDB_CHAMPS[k]);
  for(k = 0; k < ids.length; k++){
    var e = $(ids[k]);
    if(e) e.addEventListener("input", majApercuBadge);
  }
  var ap = $("btEdBadgeAppl"), rz = $("btEdBadgeRaz");
  if(ap) ap.addEventListener("click", function(){ appliqueEditeurBadge(0); });
  if(rz) rz.addEventListener("click", function(){
    var n = $("edBadgeQui") ? $("edBadgeQui").value : "";
    if(confirm("Effacer TOUS les réglages de badge de « " + n + " » ?\n\n"
             + "Son badge repartira de ce que le jeu a compté.\n"
             + "Les compteurs du jeu, eux, ne sont pas touchés.")) appliqueEditeurBadge(1);
  });
}

/* ================================================================
   LE NOM EN ROSE

   Un pseudo, désigné depuis l'administration, s'écrit en rose
   scintillant partout où il paraît : classements, salon, fil, et plaque de nom sur
   la carte. C'est un ORNEMENT, pas un badge — il ne dit rien de ce que
   le joueur a gagné, et il n'a donc rien à faire sur la page qui
   explique les badges. Il ne s'explique nulle part : on le voit, c'est
   tout.

   IL SUIT LE PSEUDO, ET C'EST VOULU. Le compte peut changer de nom ;
   il suffit alors de désigner le nouveau. Un marquage attaché à
   l'appareil aurait suivi le téléphone plutôt que la personne.
   ================================================================ */
function estScintillant(nom){
  var r = tablesBadge().r[nettoieNomScore(nom)];
  return !!(r && r.eclat);
}
/* Le nom prêt à poser dans une chaîne de page. Il ÉCHAPPE toujours —
   c'est le même contrat que echappe(), pour qu'on puisse le substituer
   partout sans avoir à se demander lequel des deux on tenait. */
function nomOrne(nom){
  var t = echappe(nom == null ? "" : nom);
  return estScintillant(nom) ? '<span class="nomRose">' + t + "</span>" : t;
}

/* Les pseudos retirés de la page des passages, en minuscules — la
   forme que statsJournaux attend. */
function nomsMasques(){
  var T = tablesBadge(), out = {}, k, n = 0;
  for(k in T.r) if(T.r[k].masque){ out[String(k).trim().toLowerCase()] = 1; n++; }
  out.__n = n;
  return out;
}
