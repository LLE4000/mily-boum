/* ================================================================
   TERRAIN : sol pré-calculé, eau vivante, falaises, décors, faune
   ================================================================ */

var BIOMES = {
  plage: {
    sol1:"#e9d7a8", sol2:"#e3cf9c", sable:"#ecdcb2", sableO:"#c9ab74",
    herbe:"#c2c079", allee:"#f3e9cc", roche:"#8a8290",
    eauC:"#63e0dc", eau:"#1fa9b8", eauO:"#0d6b82", ecume:"#eafcff",
    fond:"#57cfcb", basFond:"#a9e8dc", ciel:"#0d3a48"
  },
  foret: {
    sol1:"#5d7c3d", sol2:"#4e6b32", sable:"#d8caa0", sableO:"#a89568",
    herbe:"#3f5a28", allee:"#7d6b43", roche:"#6e6a74",
    eauC:"#7fd0e8", eau:"#2a7fa8", eauO:"#134a68", ecume:"#eaf7ff",
    fond:"#4a9cbe", basFond:"#8fd2df", ciel:"#0b2a3a"
  },
  campagne: {
    sol1:"#bb9e60", sol2:"#aa8d51", sable:"#dcc894", sableO:"#ab8f5c",
    herbe:"#8f9a52", allee:"#dcc890", roche:"#7a7480",
    eauC:"#86c6e8", eau:"#2f76a6", eauO:"#154566", ecume:"#f0f8ff",
    fond:"#4a92bc", basFond:"#96cfe2", ciel:"#0c2836"
  },
  /* Nuit de festival. Le piège serait de tout noircir : c'est la
     lumière qui fait la fête, donc le sol reste juste assombri et
     l'eau garde des reflets chauds — indigo dessous, rose dessus. */
  hippie: {
    sol1:"#3e4433", sol2:"#333a2c", sable:"#8e846c", sableO:"#5c5548",
    herbe:"#3d5636", allee:"#7a6b50", roche:"#443c56",
    eauC:"#c489cc", eau:"#544ab8", eauO:"#332a80", ecume:"#ffe6f6",
    fond:"#6a4fb4", basFond:"#b98ad6", ciel:"#3a1a4c"
  },
  /* Plein midi en Provence. Tout est délavé par la lumière : l'ocre
     tire au blanc, le vert tire au gris, et seule la mer garde une
     couleur franche. C'est l'exact contraire de la soirée hippie. */
  sud: {
    sol1:"#dcc79a", sol2:"#cdb684", sable:"#f0e2c0", sableO:"#c8b088",
    herbe:"#a7b183", allee:"#f2e7cc", roche:"#c6bba4",
    eauC:"#b6f7ec", eau:"#189ad6", eauO:"#0a4e94", ecume:"#f6ffff",
    fond:"#38b6da", basFond:"#93ecdd", ciel:"#a4dcf2"
  },
  /* LA JUNGLE — la carte événement. Orage tropical permanent : le
     ciel est bas et chargé, la lumière passe à travers la canopée et
     se teinte de vert, la terre est noire et gorgée d'eau. Le piège
     serait de tout verdir : c'est le CONTRASTE qui fait la jungle —
     de la terre presque noire sous des feuillages très clairs, et des
     allées de boue luisante qui séparent les massifs. La mer, elle,
     est saumâtre : une eau de mangrove, pas un lagon. */
  jungle: {
    sol1:"#2e4428", sol2:"#25381f", sable:"#6d6444", sableO:"#463f2a",
    herbe:"#3c6b30", allee:"#4a4030", roche:"#4e5450",
    eauC:"#4fbfa0", eau:"#12756e", eauO:"#063f42", ecume:"#d8fff2",
    fond:"#1d7a72", basFond:"#5cb8a4", ciel:"#0a1c18"
  },
  /* LA GUINGUETTE — un soir d'été sous les guirlandes.
     Le ciel est bas et sombre, comme dans la jungle, et c'est
     entièrement le but : une guirlande sur un ciel clair n'éclaire
     rien. Tout le sol est donc tenu dans des bruns tièdes, à peine
     éclairés — le terrain battu d'une piste de danse, le gravier des
     allées, l'herbe foulée du jardin. Aucune lumière n'est peinte
     ici : elles viennent toutes du décor, et elles ne portent que
     parce que le fond leur laisse la place.
     L'eau est un bord de rivière au crépuscule, pas une mer : sombre,
     lisse, et elle rend le rose des lampions. */
  guinguette: {
    sol1:"#4a3a2c", sol2:"#3e3025", sable:"#7d6549", sableO:"#4e3c2b",
    herbe:"#3f4a2e", allee:"#6b543c", roche:"#4a4048",
    eauC:"#c9a06a", eau:"#3c4a66", eauO:"#1c2740", ecume:"#ffe9c4",
    fond:"#33405c", basFond:"#6d7c96", ciel:"#1d1626"
  },
  /* LES TÉNÈBRES — l'île n'est pas dans la mer, elle est dans la lave.
     Trois décisions font toute la carte.
     1. LE SOL EST PRESQUE NOIR. C'est la seule façon de rendre la lave
        aveuglante : une roche grise sous de la lave orange donne une
        carte orange, une roche noire donne un brasier.
     2. LA LAVE EST PEINTE COMME DE L'EAU, aux mêmes trois niveaux —
        creux, moyen, crête. Le moteur des vagues n'a rien à
        apprendre : il interpole entre eauO, eau et eauC, et il suffit
        de lui donner du rouge sombre, de l'orange et du jaune blanc
        pour que la houle devienne une coulée.
     3. LE CIEL EST ROUGE SOMBRE, pas noir : un noir pur aurait aplati
        l'horizon et fait disparaître la ligne de rivage.
     L'« herbe » n'est pas de l'herbe : ce sont les fissures
     incandescentes qui courent dans la roche. */
  tenebres: {
    /* Le sable N'EST PAS du sable : c'est du basalte broyé, presque
       noir. Un rivage doré au bord d'une mer de lave se lisait comme
       une plage tropicale mal éclairée. */
    sol1:"#241d21", sol2:"#1a1519", sable:"#33272a", sableO:"#1d1517",
    /* Et l'« herbe » n'est pas de l'herbe : ce sont les veines
       incandescentes. Elles étaient trop claires — le sol devenait
       orange et l'île perdait ses ténèbres. Rabattues à un rouge
       sombre, elles redeviennent des VEINES dans du noir, ce qui est
       tout l'effet cherché ; l'orange franc, lui, reste réservé au
       décor et à la mer, où il est rare et donc brûlant. */
    herbe:"#4a1a10", allee:"#2e2225", roche:"#2b2429",
    /* LA MER EST NOIRE, ET LE FEU EST SUR LA ROCHE.
       Une mer de lave orange vue de loin donnait un tapis uniforme et
       criard tout autour de l'île : la carte entière prenait la
       couleur de son eau, et la roche du rivage devenait un liseré
       gris perdu au milieu. En rendant l'eau presque noire on lui rend
       son rôle — un vide autour de l'île, pas un décor — et l'on
       reporte TOUTE la chaleur là où elle se voit vraiment : sur les
       falaises et sur les rochers, qui brûlent et coulent.
       Ce n'est pas un noir plat pour autant : les crêtes gardent une
       braise sourde. Un aplat parfaitement noir se lit comme un trou
       dans l'image, pas comme de l'eau. */
    eauC:"#4a1c10", eau:"#150d0f", eauO:"#050304", ecume:"#8a3a18",
    fond:"#100a0c", basFond:"#2a1512", ciel:"#1a0806"
  },
  /* IBIZA — midi qui n'en finit pas, en plus riche que le Sud.
     Le Sud est délavé par la lumière ; Ibiza est SATURÉE. C'est ce qui
     les sépare, et il fallait que ça se voie tout de suite : un sable
     presque blanc, une mer d'un turquoise franc qui vire au bleu
     profond au large, et de la pierre chaulée en guise de roche. Le
     vert n'est pas celui d'une prairie mais celui d'un palmier soigné
     — sombre, verni. */
  ibiza: {
    /* Le sable est CHAUD, pas beige-gris : c'est ce qui sépare un midi
       méditerranéen d'une plage du nord. Et l'« herbe » n'est pas une
       prairie mais une pelouse de club, tondue et un peu grillée —
       verte franche, elle faisait des taches de gazon anglais au bord
       de l'eau et tirait toute la carte vers le terne. */
    sol1:"#f2e0ba", sol2:"#e9d4a4", sable:"#fbf2dc", sableO:"#d6b98c",
    herbe:"#96ac72", allee:"#fffaee", roche:"#e8e2d4",
    eauC:"#8ffff0", eau:"#12b6e0", eauO:"#0a4fa8", ecume:"#ffffff",
    fond:"#25c4dc", basFond:"#8df0ec", ciel:"#7fd8f5"
  },
  /* LES MILLE ET UNE NUITS — une nuit qu'on regarde, pas une nuit où
     l'on ne voit rien. C'est toute la difficulté de cette carte, et
     trois décisions la règlent.

     1. LE SOL N'EST PAS NOIR, IL EST INDIGO. Un sol noir aurait été
        plus « nocturne » et aurait tout ruiné : sous un ciel sombre,
        du noir ne se lit plus comme une matière, seulement comme un
        trou. L'indigo garde une couleur — donc une lumière possible —
        et c'est sur lui que l'or des lanternes et le turquoise des
        bassins vont porter.

     2. LA MER EST DE L'ENCRE, ET ELLE REND LE CIEL. C'est la réponse à
        « je ne veux pas l'eau bleue classique autour de l'île ». Une
        brume tout autour aurait coûté cher pour un résultat flou ;
        un miroir noir où se reflètent les étoiles et la lune ne coûte
        presque rien et donne l'impression que l'île FLOTTE. Les trois
        niveaux de la houle sont donc du noir bleuté, du bleu de nuit
        et un violet de crête — la vague ne se voit qu'au reflet.

     3. LE SABLE RESTE PÂLE. C'est la seule zone claire de l'île, et
        elle est nécessaire : c'est là qu'on débarque, et une plage
        qu'on ne distingue pas de la mer rend la manœuvre illisible.
        Un ivoire lilas, comme du sable sous la lune.

     L'« herbe » n'est pas une prairie : ce sont les jardins d'un
     palais, un vert profond bleuté qui ne s'allume que par taches. */
  nuits: {
    sol1:"#2b2352", sol2:"#231c45", sable:"#8b81bd", sableO:"#544a86",
    herbe:"#2f5f57", allee:"#4b4489", roche:"#3a3369",
    /* la mer d'encre : presque noire au large, un violet de nuit sur
       la crête. C'est l'écume qui porte toute la lumière, et elle est
       lunaire — bleu-blanc, jamais chaude. */
    eauC:"#3a3f8e", eau:"#0a0c22", eauO:"#030413", ecume:"#dbe2ff",
    fond:"#121738", basFond:"#2b3170", ciel:"#0a0920"
  }
};

var solCv = null, solCtx = null, solInfo = null;
var eauMotif1 = null, eauMotif2 = null;
var cheminIle = null;
var CENTRE_X = 0, CENTRE_Y = 0;

/* ================================================================
   FALAISES — les trois bords fermés
   ================================================================ */
/* ================================================================
   LE FEU SUR LA ROCHE — Mily dans les ténèbres

   « Je mettrais l'eau complètement noire, mais je mettrais du feu fort
   sur tous les rochers, à la limite belle flamme et lave qui coule
   des rochers. »

   Un seul dessin, appelé par les falaises comme par les rochers : ce
   sont les mêmes pierres, elles doivent brûler pareil. Il travaille en
   PIXELS D'ÉCRAN autour d'un point donné, et non en cases, parce que
   ses deux appelants ne lui donnent pas la même chose — une falaise
   fait cent pixels de haut, un rocher dix.

   Tout est DÉTERMINISTE, tiré sur la graine de la pierre : ces deux
   dessins sont pré-cuits, l'un dans le canevas de sol, l'autre dans
   une planche de sprites. Un Math.random() ici donnerait des flammes
   différentes à chaque reconstruction — et surtout, la même pierre
   changerait d'aspect en revenant sur la carte.
   ================================================================ */
/* DEUX RÉGLAGES APRÈS COUP, tous deux venus d'une capture regardée.

   L'INTENSITÉ DE MOITIÉ. Le premier jet mettait tant de feu sur chaque
   pierre que le rivage devenait un mur de lumière : on ne voyait plus
   la roche, seulement ce qui brûlait dessus. Une île de ténèbres doit
   rester sombre — c'est le noir qui donne leur valeur aux flammes, et
   des flammes partout ne valent plus rien. Toutes les opacités sont
   donc divisées par deux, et les flammes sont moins nombreuses et
   moins hautes.

   ET PLUS ORANGE, COMME LA LAVE. Le cœur des langues était presque
   blanc (255,238,178) : c'est la couleur d'un feu de bois très chaud,
   pas celle d'une coulée. On le ramène à l'orange des fissures du sol
   et des vasques, si bien que tout ce qui brûle sur cette île — la
   roche, les veines de la terre, les traînées des tornades — parle la
   même langue. Une seule matière, vue à trois échelles. */
/* TROISIÈME RÉGLAGE, ET LE VRAI COUPABLE.
   Le rivage restait BLANC malgré une roche de basalte et un feu divisé
   par deux. Ce n'était ni la roche, ni le liseré, ni les éboulis : ce
   sont LES HALOS. Chaque flamme pose un halo en mode additif ; la
   ceinture compte mille neuf cent vingt-six falaises, chacune avec ses
   flammes, et les halos de toutes s'additionnent sur les voisines. Un
   halo à 0,17 d'opacité est discret ; deux cents superposés font du
   blanc. Mesuré : le pixel le plus clair de la bande valait
   (232, 228, 216) quand la roche est à (78, 66, 76).
   `serre` vaut 1 quand les pierres se touchent — c'est le cas des
   falaises, jamais celui des rochers isolés. On y coupe alors ce qui
   s'additionne : le halo de chaque langue et la flaque du pied. Il
   reste les coulées et les langues elles-mêmes, qui ne débordent pas
   de leur pierre. */
function feuSurRoche(c, x, yBas, h, larg, graine, serre){
  var al = prng((graine >>> 0) ^ 0x7E4B), i;

  /* --- 1. LES COULÉES. Elles partent du haut et descendent en
     zigzag sur la face, en s'élargissant : c'est de la roche fondue
     qui suit la pente, pas un trait peint. Trois couches sur le même
     tracé — la lèvre sombre, la lave, le cœur — comme pour les
     fissures du sol. */
  var nc = 2 + ((al() * 3) | 0);
  for(i = 0; i < nc; i++){
    var x0 = x + (al() - 0.5) * larg * 1.5;
    var pts = [[x0, yBas - h * (0.82 + al() * 0.16)]];
    var seg = 3 + ((al() * 3) | 0), cx = x0, cy = pts[0][1];
    for(var j = 0; j < seg; j++){
      cx += (al() - 0.5) * larg * 0.42;
      cy += (yBas - cy) * (0.34 + al() * 0.4);
      pts.push([cx, cy]);
    }
    var couches = [[3.0, "rgba(16,7,6,.34)"], [1.8, "rgba(178,44,10,.44)"],
                   [0.8, "rgba(240,140,40,.46)"]];
    for(var k = 0; k < couches.length; k++){
      c.strokeStyle = couches[k][1];
      c.lineWidth = couches[k][0];
      c.lineCap = "round"; c.lineJoin = "round";
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      for(var q = 1; q < pts.length; q++) c.lineTo(pts[q][0], pts[q][1]);
      c.stroke();
    }
    /* la goutte au bout, prête à tomber */
    var fin = pts[pts.length - 1];
    c.fillStyle = "rgba(238,146,44,.46)";
    c.beginPath(); c.ellipse(fin[0], fin[1] + 1, 1.3, 1.9, 0, 0, 6.2832); c.fill();
  }

  /* --- 2. LA COURONNE DE FLAMMES, sur l'arête du haut. C'est elle
     qu'on voit de loin, et c'est elle qui fait qu'une île de ténèbres
     est bordée de feu et non de béton. */
  var nf = 2 + ((al() * 2) | 0);
  for(i = 0; i < nf; i++){
    var fx = x + (al() - 0.5) * larg * 1.6;
    var fy = yBas - h;
    var fh = h * (0.18 + al() * 0.24) + 4;
    var fw = 1.8 + al() * 2.2;
    /* le halo, d'abord — sauf entre pierres jointives, où il
       s'additionnerait avec celui de toutes les voisines */
    if(!serre){
      c.save();
      c.globalCompositeOperation = "lighter";
      var gh = c.createRadialGradient(fx, fy - fh * 0.35, 1, fx, fy - fh * 0.35, fh * 1.5);
      gh.addColorStop(0, "rgba(246,132,36,.17)");
      gh.addColorStop(1, "rgba(214,66,14,0)");
      c.fillStyle = gh;
      c.beginPath();
      c.ellipse(fx, fy - fh * 0.35, fh * 1.25, fh * 0.9, 0, 0, 6.2832); c.fill();
      c.restore();
    }
    /* la langue, en trois épaisseurs de plus en plus claires */
    /* le cœur n'est plus blanc mais ORANGE : c'est de la lave qui
       brûle, pas une bûche */
    var teintes = [["rgba(186,44,10,.44)", 1.0], ["rgba(226,96,22,.46)", 0.62],
                   ["rgba(255,168,58,.50)", 0.28]];
    for(var t2 = 0; t2 < teintes.length; t2++){
      var e = teintes[t2][1];
      c.fillStyle = teintes[t2][0];
      c.beginPath();
      c.moveTo(fx - fw * e, fy);
      c.quadraticCurveTo(fx - fw * e * 1.1, fy - fh * e * 0.62,
                         fx + fw * e * 0.28, fy - fh * e);
      c.quadraticCurveTo(fx + fw * e * 0.9, fy - fh * e * 0.55,
                         fx + fw * e, fy);
      c.closePath(); c.fill();
    }
  }

  /* --- 3. LA FLAQUE AU PIED : la lave arrivée en bas. Elle referme
     le dessin — sans elle, les coulées coulent dans le vide. Elle est
     additive comme le halo : on la garde partout, à moins de moitié
     entre pierres jointives. */
  c.save();
  c.globalCompositeOperation = "lighter";
  var gp = c.createRadialGradient(x, yBas, 1, x, yBas, larg * 1.3);
  gp.addColorStop(0, "rgba(246,132,36," + (serre ? 0.09 : 0.22) + ")");
  gp.addColorStop(0.5, "rgba(214,72,18," + (serre ? 0.03 : 0.08) + ")");
  gp.addColorStop(1, "rgba(190,46,10,0)");
  c.fillStyle = gp;
  c.beginPath(); c.ellipse(x, yBas, larg * 1.3, larg * 0.6, 0, 0, 6.2832); c.fill();
  c.restore();
  c.fillStyle = "rgba(210,76,18,.36)";
  c.beginPath(); c.ellipse(x, yBas, larg * 0.5, larg * 0.24, 0, 0, 6.2832); c.fill();
  c.fillStyle = "rgba(246,160,58,.40)";
  c.beginPath(); c.ellipse(x, yBas - 0.5, larg * 0.25, larg * 0.12, 0, 0, 6.2832); c.fill();
}

function dessineFalaise(c, f){
  var b = BIOMES[carte.biome];
  var p = iso(f.gx, f.gy);
  var n = 6, pts = [], i;
  for(i = 0; i < n; i++){
    var a = f.s + i / n * 6.2832;
    var rr = f.r * (0.78 + ((Math.sin(a * 2.7 + f.s * 3) + 1) / 2) * 0.44);
    pts.push({ x:p.x + Math.cos(a) * rr * RX, y:p.y + Math.sin(a) * rr * RY });
  }
  var h = f.h;
  /* LA ROCHE DES TÉNÈBRES EST DU BASALTE, pas le granit gris des
     autres îles. Ce gris clair écrit en dur valait pour toutes les
     cartes tant qu'elles se ressemblaient ; au bord d'une mer noire,
     sous des flammes, il faisait une ceinture blanche autour de l'île
     — la falaise éclatait plus fort que le feu posé dessus. Les trois
     teintes descendent donc à du basalte pour cette île, et le feu
     redevient ce qu'il y a de plus clair à l'écran. */
  /* Et la roche des mille et une nuits est de la pierre bleue sous la
     lune : le granit gris des autres îles y faisait une ceinture
     laiteuse tout autour d'une mer d'encre — la falaise éclatait plus
     fort que les lanternes. */
  var base = (carte.biome === "tenebres")
           ? ["#3a3138", "#443a42", "#2e272d"][f.v % 3]
           : (carte.biome === "nuits")
           ? ["#3b3570", "#463f7e", "#2e2a5c"][f.v % 3]
           : ["#6f6878", "#7c7484", "#615a6c"][f.v % 3];
  /* corps de la falaise, en dégradé du bas sombre vers le haut clair */
  var g = c.createLinearGradient(0, p.y - h, 0, p.y + 6);
  g.addColorStop(0, ecl(base, 0.92));
  g.addColorStop(0.45, ecl(base, 0.60));
  g.addColorStop(1, ecl(base, 0.32));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y);
  for(i = 1; i < n; i++) c.lineTo(pts[i].x, pts[i].y);
  for(i = n - 1; i >= 0; i--) c.lineTo(pts[i].x, pts[i].y - h);
  c.closePath(); c.fill();
  /* strates */
  c.save();
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y);
  for(i = 1; i < n; i++) c.lineTo(pts[i].x, pts[i].y);
  for(i = n - 1; i >= 0; i--) c.lineTo(pts[i].x, pts[i].y - h);
  c.closePath(); c.clip();
  c.strokeStyle = "rgba(20,14,26,.22)"; c.lineWidth = 1.4;
  for(var s = 1; s < 7; s++){
    var yy = p.y - h * s / 7 + Math.sin(f.s + s) * 3;
    c.beginPath();
    c.moveTo(p.x - f.r * RX * 1.2, yy);
    c.lineTo(p.x + f.r * RX * 1.2, yy + 3);
    c.stroke();
  }
  /* fissures */
  c.strokeStyle = "rgba(14,10,18,.30)"; c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(p.x - f.r * 6, p.y - h * 0.85);
  c.lineTo(p.x - f.r * 2, p.y - h * 0.5);
  c.lineTo(p.x - f.r * 7, p.y - h * 0.12);
  c.stroke();
  c.restore();
  /* dessus facetté */
  c.fillStyle = ecl(base, 1.06);
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y - h);
  for(i = 1; i < n; i++) c.lineTo(pts[i].x, pts[i].y - h);
  c.closePath(); c.fill();
  /* pointe éclairée */
  c.fillStyle = ecl(base, 1.35);
  c.beginPath();
  c.moveTo(p.x - f.r * 3, p.y - h - f.r * 7);
  c.lineTo(pts[n - 1].x, pts[n - 1].y - h);
  c.lineTo(pts[0].x, pts[0].y - h);
  c.lineTo(pts[1].x, pts[1].y - h);
  c.closePath(); c.fill();
  /* LE LISERÉ DE L'ARÊTE, ET LA MASSE BLANCHE QU'IL FABRIQUAIT.
     Un trait presque blanc à 0,26 d'opacité sur le haut de chaque
     falaise : discret sur une île qui en compte quelques dizaines
     dans le champ, mais la ceinture de roche en aligne MILLE NEUF
     CENT VINGT-SIX. Les traits se recouvrent, s'additionnent, et le
     rivage des ténèbres devenait une barrière blanche — plus claire
     que les flammes posées dessus, ce qui est exactement l'inverse de
     ce qu'on veut. Mesuré : le pixel le plus clair de la bande valait
     (232, 228, 216), quand la roche était à (78, 66, 76).
     Sur cette île le liseré devient donc une BRAISE : chaud, et trois
     fois plus discret. Ailleurs, rien ne change — c'est un clair de
     lune sur de la pierre, et il est à sa place. */
  c.strokeStyle = (carte.biome === "tenebres")
                ? "rgba(255,146,58,.09)" : "rgba(255,250,240,.26)";
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(pts[n - 1].x, pts[n - 1].y - h);
  c.lineTo(pts[0].x, pts[0].y - h);
  c.lineTo(pts[1].x, pts[1].y - h);
  c.stroke();
  /* végétation ou mousse au pied — sauf dans les ténèbres, où rien ne
     pousse : c'est du feu qui coule à la place. */
  if(carte.biome === "tenebres"){
    /* UNE FALAISE SUR DEUX SEULEMENT. Les falaises se touchent — elles
       forment une ceinture continue autour de l'île — si bien que
       leurs flammes s'additionnent en un rideau orange sans
       interruption : de loin c'est superbe, de près c'est un mur de
       lumière et l'on ne voit plus la roche.
       En n'en allumant qu'une sur deux, le feu redevient des FOYERS —
       des groupes qui brûlent, des pans qui restent noirs — et c'est
       le contraste entre les deux qui fait le rivage. Le choix est
       tiré sur la position, donc stable : la même falaise brûle ou ne
       brûle pas, toujours. */
    if(((f.gx * 7 + f.gy * 13) | 0) % 2 === 0)
      feuSurRoche(c, p.x, p.y, h, f.r * RX * 0.9,
                  (f.gx * 733 + f.gy * 97 + f.v) | 0, 1);   // 1 : pierres jointives
  }else if(f.v % 3 === 0){
    c.fillStyle = carte.biome === "plage" ? "rgba(90,140,70,.45)" : "rgba(60,100,50,.5)";
    c.beginPath();
    c.ellipse(p.x - f.r * 5, p.y - h * 0.05, f.r * 9, f.r * 4, 0, 0, 6.2832);
    c.fill();
  }
}

/* ---------------- Rochers isolés ---------------- */
/* LE BIOME SE PASSE EN ARGUMENT, IL NE SE DEVINE PAS.
   dessineRocher lisait la variable globale `carte` pour savoir si elle
   dessinait une pierre des ténèbres. Or ses sprites sont pré-cuits par
   construitSpritesDecor(biome), qui reçoit le biome en argument
   justement parce que `carte` n'est pas encore la bonne à ce
   moment-là : les vingt-quatre rochers sortaient donc en granit gris
   clair sur une île de basalte, et faisaient une ceinture blanche
   autour du rivage — plus claire que les flammes posées dessus.
   dessineDecor reçoit son biome depuis toujours ; celle-ci ne l'avait
   pas, et c'est tout l'écart. Le repli sur `carte` reste pour les
   quelques appels qui n'ont pas de biome sous la main. */
function dessineRocher(c, gx, gy, r, s, v, biome){
  if(!biome && typeof carte !== "undefined" && carte) biome = carte.biome;
  var gris = (biome === "tenebres")
           ? ["#2f2830", "#39313a", "#241f26"][v % 3]
           : ["#6d6a75", "#7a7480", "#5f5c68"][v % 3];
  var p = iso(gx, gy);
  ombreRonde(c, gx, gy, r * 1.15, 0.26);
  var n = 5, pts = [], i;
  for(i = 0; i < n; i++){
    var a = s + i / n * 6.2832;
    var rr = r * (0.72 + ((Math.sin(a * 3.1 + s * 5) + 1) / 2) * 0.5);
    pts.push({ x:p.x + Math.cos(a) * rr * RX, y:p.y + Math.sin(a) * rr * RY });
  }
  var h = r * 26;
  c.fillStyle = ecl(gris, 0.62);
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y);
  for(i = 1; i < n; i++) c.lineTo(pts[i].x, pts[i].y);
  for(i = n - 1; i >= 0; i--) c.lineTo(pts[i].x, pts[i].y - h);
  c.closePath(); c.fill();
  c.fillStyle = gris;
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y - h);
  for(i = 1; i < n; i++) c.lineTo(pts[i].x, pts[i].y - h);
  c.closePath(); c.fill();
  c.fillStyle = ecl(gris, 1.22);
  c.beginPath();
  c.moveTo(p.x, p.y - h - r * 5);
  c.lineTo(pts[0].x, pts[0].y - h);
  c.lineTo(pts[1].x, pts[1].y - h);
  c.closePath(); c.fill();
  /* même raison que sur les falaises : sur l'île de basalte, l'arête
     prend la braise et non le clair de lune */
  c.strokeStyle = (biome === "tenebres")
                ? "rgba(255,146,58,.12)" : "rgba(255,250,240,.22)";
  c.lineWidth = 1;
  c.beginPath(); c.moveTo(pts[n - 1].x, pts[n - 1].y - h); c.lineTo(pts[0].x, pts[0].y - h); c.stroke();
  /* DANS LES TÉNÈBRES, CHAQUE ROCHER BRÛLE. Le même dessin que sur
     les falaises, à l'échelle du caillou : c'est ce qui met le feu
     partout sur l'île, maintenant que la mer est noire.
     `carte` est global comme dans dessineFalaise ; la graine vient de
     la forme et de la teinte, si bien que les vingt-quatre sprites
     pré-cuits brûlent chacun à sa façon et ne se répètent pas. */
  if(biome === "tenebres"){
    feuSurRoche(c, p.x, p.y, h, r * RX * 0.62,
                ((v * 977) + Math.round(s * 1000)) | 0);
  }
}

/* ================================================================
   DÉCORS
   ================================================================ */
function palmier(c, gx, gy, s){
  var p = iso(gx, gy);
  ombreRonde(c, gx, gy, 0.5 * s, 0.2);
  var h = 46 * s;
  c.strokeStyle = "#7a5c3a"; c.lineWidth = 4.6 * s; c.lineCap = "round";
  c.beginPath(); c.moveTo(p.x, p.y); c.quadraticCurveTo(p.x - 5 * s, p.y - h * 0.6, p.x - 9 * s, p.y - h); c.stroke();
  c.strokeStyle = "#a5825a"; c.lineWidth = 2.4 * s;
  c.beginPath(); c.moveTo(p.x - 1 * s, p.y - 2); c.quadraticCurveTo(p.x - 6 * s, p.y - h * 0.6, p.x - 9.8 * s, p.y - h); c.stroke();
  /* anneaux du tronc */
  c.strokeStyle = "rgba(60,40,20,.35)"; c.lineWidth = 1 * s;
  for(var k = 1; k < 6; k++){
    var t = k / 6;
    var tx = p.x - 9 * s * t * t, ty = p.y - h * t;
    c.beginPath(); c.moveTo(tx - 2.4 * s, ty); c.lineTo(tx + 2.4 * s, ty + 0.6 * s); c.stroke();
  }
  var tx2 = p.x - 9 * s, ty2 = p.y - h;
  for(var i = 0; i < 7; i++){
    var a = -Math.PI - 0.2 + i / 6 * (Math.PI + 0.4);
    var ex = tx2 + Math.cos(a) * 22 * s, ey = ty2 + Math.sin(a) * 10 * s + 6 * s;
    var gg = c.createLinearGradient(tx2, ty2, ex, ey);
    gg.addColorStop(0, "#3f9a58"); gg.addColorStop(1, i % 2 ? "#25603a" : "#317a48");
    c.strokeStyle = gg;
    c.lineWidth = 4.2 * s;
    c.beginPath(); c.moveTo(tx2, ty2);
    c.quadraticCurveTo((tx2 + ex) / 2, ty2 - 13 * s, ex, ey); c.stroke();
    c.strokeStyle = "rgba(180,240,180,.25)"; c.lineWidth = 1.2 * s;
    c.beginPath(); c.moveTo(tx2, ty2);
    c.quadraticCurveTo((tx2 + ex) / 2, ty2 - 14 * s, ex, ey); c.stroke();
  }
  c.fillStyle = "#c8892f";
  c.beginPath(); c.arc(tx2 + 1 * s, ty2 + 3 * s, 2.6 * s, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(tx2 + 4 * s, ty2 + 4.5 * s, 2.2 * s, 0, 6.2832); c.fill();
}
function sapin(c, gx, gy, s){
  var p = iso(gx, gy);
  ombreRonde(c, gx, gy, 0.55 * s, 0.24);
  c.fillStyle = "#5a4126";
  c.fillRect(p.x - 2 * s, p.y - 10 * s, 4 * s, 10 * s);
  for(var i = 0; i < 4; i++){
    var y = p.y - 6 * s - i * 12 * s;
    var w = (20 - i * 3.6) * s;
    var g = c.createLinearGradient(p.x - w, 0, p.x + w, 0);
    g.addColorStop(0, ["#3a6a3a", "#427a42", "#4a8a46", "#549a4e"][i]);
    g.addColorStop(0.5, ["#274d28", "#2e5c2e", "#356a34", "#3d7a3a"][i]);
    g.addColorStop(1, ["#1c3a1e", "#234522", "#285028", "#2f5c2c"][i]);
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(p.x, y - 20 * s); c.lineTo(p.x + w, y); c.lineTo(p.x - w, y);
    c.closePath(); c.fill();
  }
}
function meule(c, gx, gy, s){
  var p = iso(gx, gy);
  ombreRonde(c, gx, gy, 0.62 * s, 0.24);
  cylindre(c, gx, gy, 0.5 * s, 0, 16 * s, "#d8b45e", "#b3903f");
  c.strokeStyle = "rgba(120,88,30,.5)"; c.lineWidth = 1;
  for(var i = 0; i < 5; i++){
    var y = p.y - 3 - i * 3.2 * s;
    c.beginPath(); c.ellipse(p.x, y, 0.5 * s * RX * 0.96, 0.5 * s * RY * 0.96, 0, 0.2, Math.PI - 0.2); c.stroke();
  }
  cone3d(c, gx, gy, 0.52 * s, 16 * s, 12 * s, "#e6c674", "#c19a45");
}
function buisson(c, gx, gy, s, coul){
  var p = iso(gx, gy);
  ombreRonde(c, gx, gy, 0.38 * s, 0.2);
  for(var i = 0; i < 4; i++){
    var a = i / 4 * 6.2832 + s;
    c.fillStyle = i === 0 ? ecl(coul, 1.25) : ecl(coul, 1 - i * 0.08);
    c.beginPath();
    c.ellipse(p.x + Math.cos(a) * 5 * s, p.y - 4 * s + Math.sin(a) * 2.5 * s, 6.5 * s, 5 * s, 0, 0, 6.2832);
    c.fill();
  }
}
function clotureBout(c, gx, gy, s){
  var p = iso(gx, gy);
  c.strokeStyle = "#7a5c38"; c.lineWidth = 2.4 * s; c.lineCap = "round";
  c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x, p.y - 13 * s); c.stroke();
  c.beginPath(); c.moveTo(p.x - 10 * s, p.y - 9 * s); c.lineTo(p.x + 10 * s, p.y - 11 * s); c.stroke();
}

/* ================================================================
   DÉCORS DE LA SOIRÉE HIPPIE
   Tout est cuit dans un sprite : aucune horloge, aucun tirage au sort
   ici. Les feux et les ampoules sont donc figés — mais leur halo
   suffit à faire vivre la prairie de nuit.
   ================================================================ */

/* Un point du long flanc d'une caisse, repéré par sa position t le long
   de l'axe gy et sa hauteur hh. boite() ne sait peindre ses faces que
   d'un seul aplat : pour y poser une peinture, il faut viser soi-même. */
function pointFlanc(gx, gy, w, d, z0, t, hh){
  var q = iso(gx + w / 2, gy - d / 2 + d * t);
  return { x:q.x, y:q.y - z0 - hh };
}
function traceFlanc(c, gx, gy, w, d, z0, h0, h1){
  var a = pointFlanc(gx, gy, w, d, z0, 0, h1), b = pointFlanc(gx, gy, w, d, z0, 1, h1);
  var e = pointFlanc(gx, gy, w, d, z0, 1, h0), f = pointFlanc(gx, gy, w, d, z0, 0, h0);
  c.beginPath();
  c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(e.x, e.y); c.lineTo(f.x, f.y);
  c.closePath();
}
/* Le combi peint. Il est couché le long de gy pour que son grand flanc
   tombe sur la face éclairée à 75 % : c'est là que va la peinture. */
function combi(c, gx, gy, s){
  var w = 0.86 * s, d = 1.6 * s, z0 = 6 * s, h = 14 * s;
  ombreRonde(c, gx, gy, 0.95 * s, 0.22);
  /* les roues d'abord : la caisse leur mange le haut, elles ont l'air
     posées. La caisse est montée haut exprès, sinon le combi rase le
     sol et n'a plus l'air d'un véhicule. */
  var ra = iso(gx + 0.40 * s, gy - 0.50 * s), rb = iso(gx + 0.40 * s, gy + 0.50 * s);
  c.fillStyle = "#332b3e";
  c.beginPath(); c.ellipse(ra.x, ra.y - 3.4 * s, 4.8 * s, 3.8 * s, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(rb.x, rb.y - 3.4 * s, 4.8 * s, 3.8 * s, 0, 0, 6.2832); c.fill();
  c.fillStyle = "#9a90a6";
  c.beginPath(); c.ellipse(ra.x, ra.y - 3.6 * s, 2 * s, 1.6 * s, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(rb.x, rb.y - 3.6 * s, 2 * s, 1.6 * s, 0, 0, 6.2832); c.fill();
  /* la caisse crème, puis le toit relevé en toile orange */
  var cr = faces("#f0e4cc");
  boite(c, gx, gy, w, d, z0, h, cr.t, cr.g, cr.d);
  var to = faces("#e8813a");
  boite(c, gx - 0.04 * s, gy, w * 0.72, d * 0.68, z0 + h, 4.4 * s, to.t, to.g, to.d);
  /* la peinture du flanc */
  c.save();
  traceFlanc(c, gx, gy, w, d, z0, 0, h); c.clip();
  /* bande turquoise en bas, séparée par un liseré magenta */
  c.fillStyle = "#2fb2bd";
  traceFlanc(c, gx, gy, w, d, z0, 0, h * 0.44); c.fill();
  c.fillStyle = "#e0559f";
  traceFlanc(c, gx, gy, w, d, z0, h * 0.44, h * 0.52); c.fill();
  /* le soleil levant, motif obligé du combi */
  var so = pointFlanc(gx, gy, w, d, z0, 0.26, h * 0.62);
  c.fillStyle = "#ffd85a";
  c.beginPath(); c.arc(so.x, so.y, 4.2 * s, 0, 6.2832); c.fill();
  c.strokeStyle = "#ffd85a"; c.lineWidth = 1.2 * s;
  for(var k = 0; k < 7; k++){
    var a2 = k / 7 * 6.2832;
    c.beginPath();
    c.moveTo(so.x + Math.cos(a2) * 5.4 * s, so.y + Math.sin(a2) * 5.4 * s);
    c.lineTo(so.x + Math.cos(a2) * 7.6 * s, so.y + Math.sin(a2) * 7.6 * s);
    c.stroke();
  }
  /* une spirale à l'autre bout */
  var sp = pointFlanc(gx, gy, w, d, z0, 0.76, h * 0.66);
  c.strokeStyle = "#7fd94f"; c.lineWidth = 1.4 * s;
  c.beginPath();
  for(var m = 0; m < 22; m++){
    var an = m * 0.55, rr = 0.42 * s * m * 0.7;
    var xx = sp.x + Math.cos(an) * rr, yy = sp.y + Math.sin(an) * rr;
    if(m === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy);
  }
  c.stroke();
  /* les hublots, allumés */
  c.fillStyle = "#ffd489";
  for(var n = 0; n < 2; n++){
    var t0 = 0.44 + n * 0.20;
    var h1 = pointFlanc(gx, gy, w, d, z0, t0, h * 0.94);
    var h2 = pointFlanc(gx, gy, w, d, z0, t0 + 0.14, h * 0.94);
    var h3 = pointFlanc(gx, gy, w, d, z0, t0 + 0.14, h * 0.58);
    var h4 = pointFlanc(gx, gy, w, d, z0, t0, h * 0.58);
    c.beginPath();
    c.moveTo(h1.x, h1.y); c.lineTo(h2.x, h2.y); c.lineTo(h3.x, h3.y); c.lineTo(h4.x, h4.y);
    c.closePath(); c.fill();
  }
  c.restore();
  /* le pare-brise : c'est lui qui donne l'air habité */
  var g1 = iso(gx + w / 2, gy + d / 2), g2 = iso(gx - w / 2, gy + d / 2);
  c.fillStyle = "#ffc978";
  c.beginPath();
  c.moveTo(g1.x - 1.5 * s, g1.y - z0 - h * 0.94); c.lineTo(g2.x + 1.5 * s, g2.y - z0 - h * 0.94);
  c.lineTo(g2.x + 1.5 * s, g2.y - z0 - h * 0.50); c.lineTo(g1.x - 1.5 * s, g1.y - z0 - h * 0.50);
  c.closePath(); c.fill();
  var pv = iso(gx, gy + d / 2);
  lueurRapide(c, pv.x, pv.y - z0 - h * 0.7, 22 * s, "#ffb44a", 0.42);
}
/* Le tipi. La toile est éclairée de l'intérieur : le dégradé va du
   gris lunaire en haut à l'orange du foyer en bas. */
function tipi(c, gx, gy, s){
  var p = iso(gx, gy);
  ombreRonde(c, gx, gy, 0.6 * s, 0.28);
  var rx = 19 * s, h = 31 * s;
  c.save();
  c.beginPath();
  c.moveTo(p.x - rx, p.y);
  c.lineTo(p.x - rx * 0.15, p.y - h);
  c.lineTo(p.x + rx * 0.15, p.y - h);
  c.lineTo(p.x + rx, p.y);
  c.ellipse(p.x, p.y, rx, rx * 0.42, 0, 0, Math.PI);
  c.closePath();
  c.clip();
  var g = c.createLinearGradient(0, p.y - h, 0, p.y + rx * 0.4);
  g.addColorStop(0, "#a89cb4");
  g.addColorStop(0.5, "#ddcdb2");
  g.addColorStop(1, "#ffc47c");
  c.fillStyle = g;
  c.fillRect(p.x - rx - 2, p.y - h - 2, rx * 2 + 4, h + rx + 4);
  /* coutures verticales, puis deux chevrons peints */
  c.strokeStyle = "rgba(120,96,74,.28)"; c.lineWidth = 1 * s;
  for(var i = -2; i <= 2; i++){
    c.beginPath();
    c.moveTo(p.x + i * 3 * s, p.y - h); c.lineTo(p.x + i * rx * 0.42, p.y + rx * 0.4);
    c.stroke();
  }
  var teintes = ["#d8478f", "#3fc9c0"];
  for(var b = 0; b < 2; b++){
    var yb = p.y - h * (0.30 + b * 0.26);
    c.strokeStyle = teintes[b]; c.lineWidth = 2.2 * s; c.lineJoin = "round";
    c.beginPath();
    for(var k = 0; k <= 8; k++){
      var xx = p.x - rx + k * rx / 4;
      var yy = yb + (k % 2 ? 2.4 * s : -2.4 * s);
      if(k === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy);
    }
    c.stroke();
  }
  c.restore();
  /* les perches qui se croisent au sommet */
  c.strokeStyle = "#8a6f4e"; c.lineWidth = 1.5 * s; c.lineCap = "round";
  for(var q = 0; q < 4; q++){
    c.beginPath();
    c.moveTo(p.x + (q - 1.5) * 1.6 * s, p.y - h + 3 * s);
    c.lineTo(p.x + (q - 1.5) * 4.4 * s, p.y - h - 9 * s);
    c.stroke();
  }
  /* un fanion en haut d'une perche */
  c.fillStyle = "#ffb43c";
  c.beginPath();
  c.moveTo(p.x + 6.6 * s, p.y - h - 9 * s);
  c.lineTo(p.x + 13 * s, p.y - h - 6.5 * s);
  c.lineTo(p.x + 6.6 * s, p.y - h - 4 * s);
  c.closePath(); c.fill();
  /* l'ouverture et la lumière qui en sort */
  lueurRapide(c, p.x, p.y - 6 * s, 26 * s, "#ff9a3c", 0.5);
  var go = c.createLinearGradient(0, p.y - 15 * s, 0, p.y);
  go.addColorStop(0, "#3b2a34"); go.addColorStop(1, "#ffcf7e");
  c.fillStyle = go;
  c.beginPath();
  c.moveTo(p.x - 4.4 * s, p.y + 1 * s);
  c.lineTo(p.x, p.y - 15 * s);
  c.lineTo(p.x + 4.4 * s, p.y + 1 * s);
  c.closePath(); c.fill();
}
/* La guirlande d'ampoules. Elle est tracée à plat dans l'écran : ce
   n'est pas un volume, c'est une ligne de lumière tendue en travers. */
function guirlande(c, gx, gy, s){
  var p = iso(gx, gy);
  var demi = 27 * s, haut = 31 * s;
  c.strokeStyle = "#6b5a48"; c.lineWidth = 2.2 * s; c.lineCap = "round";
  c.beginPath(); c.moveTo(p.x - demi, p.y + 2 * s); c.lineTo(p.x - demi + 2 * s, p.y - haut); c.stroke();
  c.beginPath(); c.moveTo(p.x + demi, p.y + 2 * s); c.lineTo(p.x + demi - 2 * s, p.y - haut); c.stroke();
  var ax = p.x - demi + 2 * s, ay = p.y - haut;
  var bx = p.x + demi - 2 * s, by = p.y - haut;
  var cx = p.x, cy = p.y - haut + 26 * s;
  c.strokeStyle = "rgba(28,20,32,.6)"; c.lineWidth = 1.1 * s;
  c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(cx, cy, bx, by); c.stroke();
  var teintes = ["#ff5aa8", "#ffc23c", "#4fe3d8", "#a06bff", "#8ce04a", "#ff7a3c"];
  for(var i = 1; i < 10; i++){
    var t = i / 10, u = 1 - t;
    var x = u * u * ax + 2 * u * t * cx + t * t * bx;
    var y = u * u * ay + 2 * u * t * cy + t * t * by;
    var col = teintes[i % 6];
    c.strokeStyle = "rgba(28,20,32,.55)"; c.lineWidth = 0.9 * s;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 2.6 * s); c.stroke();
    lueurRapide(c, x, y + 4.4 * s, 12 * s, col, 0.6);
    c.fillStyle = col;
    c.beginPath(); c.ellipse(x, y + 4.6 * s, 2.3 * s, 2.9 * s, 0, 0, 6.2832); c.fill();
    c.fillStyle = "rgba(255,255,255,.8)";
    c.beginPath(); c.ellipse(x - 0.7 * s, y + 3.8 * s, 0.9 * s, 1.1 * s, 0, 0, 6.2832); c.fill();
  }
}
/* Le foyer. La flamme est figée à une heure choisie, sinon chaque
   reconstruction du sprite donnerait un feu différent. */
function feuDeCamp(c, gx, gy, s){
  var p = iso(gx, gy);
  c.save();
  c.globalCompositeOperation = "lighter";
  var g = c.createRadialGradient(p.x, p.y, 2, p.x, p.y, 40 * s);
  g.addColorStop(0, "rgba(255,158,66,.62)");
  g.addColorStop(0.45, "rgba(255,132,44,.22)");
  g.addColorStop(1, "rgba(255,120,40,0)");
  c.fillStyle = g;
  c.beginPath(); c.ellipse(p.x, p.y, 40 * s, 20 * s, 0, 0, 6.2832); c.fill();
  c.restore();
  /* la couronne de pierres. Elles restent rondes et sans rotation :
     inclinées, elles dessinaient une marguerite autour du foyer. */
  for(var i = 0; i < 9; i++){
    var a = i / 9 * 6.2832 + 0.4;
    var rc = (0.86 + alea2d(i, 7, 3) * 0.28);
    var sx = p.x + Math.cos(a) * 11 * s * rc, sy = p.y + Math.sin(a) * 5.4 * s * rc;
    c.fillStyle = "#3f3a46";
    c.beginPath(); c.ellipse(sx, sy, 3 * s * rc, 2.3 * s * rc, 0, 0, 6.2832); c.fill();
    c.fillStyle = "#565062";
    c.beginPath(); c.ellipse(sx, sy - 0.7 * s, 2.6 * s * rc, 1.8 * s * rc, 0, 0, 6.2832); c.fill();
    c.fillStyle = "rgba(255,166,86,.42)";
    c.beginPath(); c.ellipse(sx - Math.cos(a) * 1.1 * s, sy - Math.sin(a) * 0.8 * s - 0.5 * s,
                             1.7 * s * rc, 1.1 * s * rc, 0, 0, 6.2832); c.fill();
  }
  c.strokeStyle = "#4a3524"; c.lineWidth = 3.2 * s; c.lineCap = "round";
  c.beginPath(); c.moveTo(p.x - 7 * s, p.y + 2 * s); c.lineTo(p.x + 6 * s, p.y - 3 * s); c.stroke();
  c.beginPath(); c.moveTo(p.x - 6 * s, p.y - 3 * s); c.lineTo(p.x + 7 * s, p.y + 2 * s); c.stroke();
  flamme(c, p.x, p.y - 2 * s, 21 * s, 0.62, s * 0.95);
  braises(c, p.x, p.y - 7 * s, 0.62, 9, s * 0.9, 26);
}

/* ================================================================
   DÉCORS DU SUD — tout est lavé par le soleil de midi
   ================================================================ */
function cypres(c, gx, gy, s){
  var p = iso(gx, gy);
  ombreRonde(c, gx, gy, 0.36 * s, 0.26);
  var h = 52 * s, w = 7.6 * s;
  function silhouette(){
    c.beginPath();
    c.moveTo(p.x, p.y - h);
    c.bezierCurveTo(p.x + w, p.y - h * 0.62, p.x + w * 0.94, p.y - h * 0.16, p.x + w * 0.40, p.y);
    c.lineTo(p.x - w * 0.40, p.y);
    c.bezierCurveTo(p.x - w * 0.94, p.y - h * 0.16, p.x - w, p.y - h * 0.62, p.x, p.y - h);
    c.closePath();
  }
  var g = c.createLinearGradient(p.x - w, 0, p.x + w, 0);
  g.addColorStop(0, "#5c7d52"); g.addColorStop(0.42, "#33513a"); g.addColorStop(1, "#1e3324");
  c.fillStyle = g;
  silhouette(); c.fill();
  /* le feuillage en écailles. Des virgules posées à intervalle
     régulier tricotaient une chaussette : leurs places sortent donc du
     hachage déterministe, irrégulier mais identique à chaque partie. */
  c.save();
  silhouette(); c.clip();
  c.lineCap = "round";
  for(var i = 0; i < 46; i++){
    var t = (i + alea2d(i, 3, 11) * 0.9) / 46;
    var yy = p.y - h * (0.02 + t * 0.96);
    var lg = w * (0.95 - t * 0.42);
    var xx = p.x + (alea2d(i, 1, 7) - 0.5) * 2 * lg * 0.8;
    var lo = (0.7 + alea2d(i, 2, 5) * 0.8) * s;
    var clair = alea2d(i, 4, 3) > 0.62;
    c.strokeStyle = clair ? "rgba(150,186,128,.34)" : "rgba(18,36,22,.24)";
    c.lineWidth = 1.7 * s;
    c.beginPath();
    c.moveTo(xx - 2 * lo, yy + 1.4 * lo);
    c.quadraticCurveTo(xx, yy - 0.3 * lo, xx + 2 * lo, yy - 1.6 * lo);
    c.stroke();
  }
  c.restore();
  /* le soleil frappe le flanc gauche */
  c.strokeStyle = "rgba(206,226,166,.4)"; c.lineWidth = 1.5 * s;
  c.beginPath();
  c.moveTo(p.x, p.y - h);
  c.bezierCurveTo(p.x - w * 0.94, p.y - h * 0.62, p.x - w * 0.9, p.y - h * 0.2, p.x - w * 0.42, p.y - h * 0.04);
  c.stroke();
  c.strokeStyle = "#6b5a44"; c.lineWidth = 2 * s;
  c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x, p.y - 4 * s); c.stroke();
}
function olivier(c, gx, gy, s){
  var p = iso(gx, gy);
  ombreRonde(c, gx, gy, 0.52 * s, 0.24);
  /* deux troncs noueux qui partent en sens contraire : c'est ce
     déséquilibre qui fait l'olivier, pas le feuillage */
  c.lineCap = "round";
  c.strokeStyle = "#7a6c59"; c.lineWidth = 5.6 * s;
  c.beginPath(); c.moveTo(p.x - 1.5 * s, p.y);
  c.quadraticCurveTo(p.x - 6 * s, p.y - 7 * s, p.x - 7 * s, p.y - 14 * s); c.stroke();
  c.beginPath(); c.moveTo(p.x + 2 * s, p.y);
  c.quadraticCurveTo(p.x + 5.5 * s, p.y - 6 * s, p.x + 6 * s, p.y - 13 * s); c.stroke();
  c.strokeStyle = "#9d8f79"; c.lineWidth = 1.8 * s;
  c.beginPath(); c.moveTo(p.x - 3 * s, p.y - 1 * s);
  c.quadraticCurveTo(p.x - 7 * s, p.y - 7 * s, p.x - 7.8 * s, p.y - 13 * s); c.stroke();
  /* Le feuillage est UNE masse dentelée, pas une grappe de boules :
     un olivier se lit comme un nuage gris-vert posé sur son tronc.
     Trois passes : masse sombre, corps, puis l'argenture du dessous
     des feuilles côté soleil — c'est elle qui le fait reconnaître. */
  var cxo = p.x, cyo = p.y - 20 * s;
  function masse(k, dilat){
    c.beginPath();
    for(var i = 0; i <= 26; i++){
      var a = i / 26 * 6.2832;
      var rr = (1 + 0.20 * Math.sin(a * 3 + k) + 0.12 * Math.sin(a * 5 - k * 2)) * dilat;
      var xx = cxo + Math.cos(a) * rr * 1.32, yy = cyo + Math.sin(a) * rr * 0.86;
      if(i === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy);
    }
    c.closePath();
  }
  c.fillStyle = "#556848"; masse(0.7, 12.5 * s); c.fill();
  c.fillStyle = "#778c60"; masse(2.4, 11.2 * s); c.fill();
  c.save();
  masse(0.7, 12.5 * s); c.clip();
  c.fillStyle = "rgba(190,208,162,.5)";
  c.beginPath(); c.ellipse(cxo - 5 * s, cyo - 4.4 * s, 9 * s, 5.6 * s, -0.28, 0, 6.2832); c.fill();
  /* quelques creux d'ombre : sans eux la masse redevient un ballon */
  c.fillStyle = "rgba(48,60,40,.22)";
  for(var i2 = 0; i2 < 5; i2++){
    c.beginPath();
    c.ellipse(cxo + (alea2d(i2, 5, 13) - 0.5) * 26 * s, cyo + (alea2d(i2, 6, 13) - 0.2) * 12 * s,
              3.4 * s, 2 * s, 0.4, 0, 6.2832);
    c.fill();
  }
  c.restore();
  c.fillStyle = "rgba(228,238,208,.3)";
  for(var k = 0; k < 20; k++){
    var a2 = k * 2.399963 + alea2d(k, 8, 17);
    var r = 2 + 2.7 * Math.sqrt(k);
    c.beginPath();
    c.ellipse(cxo + Math.cos(a2) * r * 1.4 * s, cyo + Math.sin(a2) * r * 0.9 * s,
              1.2 * s, 0.7 * s, a2, 0, 6.2832);
    c.fill();
  }
}
function lavande(c, gx, gy, s){
  var p = iso(gx, gy);
  ombreRonde(c, gx, gy, 0.45 * s, 0.2);
  /* le violet ne tient que si le feuillage reste argenté : on pose
     d'abord la touffe grise, les épis viennent après */
  for(var i = 0; i < 3; i++){
    c.fillStyle = ["#93a37d", "#849371", "#a4b28c"][i];
    c.beginPath();
    c.ellipse(p.x + (i - 1) * 4.6 * s, p.y - 2 * s, 6.6 * s, 3.6 * s, 0, 0, 6.2832);
    c.fill();
  }
  c.lineCap = "round";
  for(var k = 0; k < 11; k++){
    var bx = p.x + (k - 5) * 2.2 * s, by = p.y - 3 * s;
    var ex = bx + (k - 5) * 0.5 * s, ey = by - 9 * s - (k % 3) * 2.4 * s;
    c.strokeStyle = "#6f8a5e"; c.lineWidth = 1.1 * s;
    c.beginPath(); c.moveTo(bx, by); c.lineTo(ex, ey); c.stroke();
    var g = c.createLinearGradient(ex, ey - 1 * s, ex, ey + 5 * s);
    g.addColorStop(0, "#d0aef6"); g.addColorStop(1, "#6b47a8");
    c.strokeStyle = g; c.lineWidth = 2.5 * s;
    c.beginPath(); c.moveTo(ex, ey + 4.5 * s); c.lineTo(ex, ey); c.stroke();
  }
}
function muretSec(c, gx, gy, s){
  /* muret de pierres sèches : deux rangs décalés de calcaire pâle,
     et le pot de terre cuite qui donne la seule note chaude */
  var pierres = ["#efe8d6", "#c9bda3", "#ded5c0", "#b6ab90"];
  ombreContact(c, gx, gy, 0.6 * s, 1.7 * s, 0.2);
  for(var i = 0; i < 3; i++){
    var f = faces(pierres[i]);
    boite(c, gx, gy - 0.52 * s + i * 0.52 * s, 0.46 * s, 0.48 * s, 0, 7 * s, f.t, f.g, f.d);
    /* le joint creux entre deux pierres : sans lui, le muret n'est
       qu'un bloc de sucre */
    var jt = iso(gx + 0.23 * s, gy - 0.28 * s + i * 0.52 * s);
    c.strokeStyle = "rgba(96,86,66,.45)"; c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(jt.x, jt.y - 7 * s); c.lineTo(jt.x - 0.46 * s * TW / 2, jt.y - 7 * s + 0.46 * s * TH / 2);
    c.stroke();
  }
  for(var k = 0; k < 2; k++){
    var f2 = faces(pierres[k + 2]);
    boite(c, gx, gy - 0.26 * s + k * 0.52 * s, 0.42 * s, 0.44 * s, 7 * s, 5.4 * s, f2.t, f2.g, f2.d);
  }
  cylindre(c, gx + 0.45 * s, gy + 0.55 * s, 0.17 * s, 0, 6.4 * s, "#a85c38", "#8d4b2c");
  cylindre(c, gx + 0.45 * s, gy + 0.55 * s, 0.20 * s, 6.4 * s, 1.6 * s, "#c96f45", "#a85c38");
  var pp = iso(gx + 0.45 * s, gy + 0.55 * s);
  for(var m = 0; m < 5; m++){
    var a = m / 5 * 6.2832 + 0.6;
    c.fillStyle = m % 2 ? "#5e7a4c" : "#6f8c58";
    c.beginPath();
    c.ellipse(pp.x + Math.cos(a) * 3 * s, pp.y - 10 * s + Math.sin(a) * 2 * s, 3.2 * s, 2.4 * s, 0, 0, 6.2832);
    c.fill();
  }
  c.fillStyle = "#d8434a";
  c.beginPath(); c.arc(pp.x + 1.5 * s, pp.y - 12.5 * s, 2 * s, 0, 6.2832); c.fill();
  c.beginPath(); c.arc(pp.x - 2.5 * s, pp.y - 11 * s, 1.6 * s, 0, 6.2832); c.fill();
}

function dessineDecor(c, biome, d){
  if(biome === "plage"){
    if(d.v === 0) palmier(c, d.gx, d.gy, d.s);
    else if(d.v === 1) buisson(c, d.gx, d.gy, d.s, "#3d9152");
    else if(d.v === 2) buisson(c, d.gx, d.gy, d.s * 0.7, "#c9b579");
    else {
      var p = iso(d.gx, d.gy);
      c.fillStyle = "#f6efe2";
      c.beginPath(); c.ellipse(p.x, p.y - 1, 4.5 * d.s, 2.6 * d.s, 0.4, 0, 6.2832); c.fill();
      c.strokeStyle = "rgba(190,160,130,.7)"; c.lineWidth = 0.7;
      for(var k = -2; k <= 2; k++){
        c.beginPath(); c.moveTo(p.x, p.y - 1); c.lineTo(p.x + k * 1.6, p.y + 1.4); c.stroke();
      }
    }
  }else if(biome === "foret"){
    if(d.v <= 1) sapin(c, d.gx, d.gy, d.s);
    else if(d.v === 2) buisson(c, d.gx, d.gy, d.s, "#2f6b34");
    else cylindre(c, d.gx, d.gy, 0.24 * d.s, 0, 6 * d.s, "#8a6a44", "#5a4126");
  }else if(biome === "campagne"){
    if(d.v === 0) meule(c, d.gx, d.gy, d.s);
    else if(d.v === 1) buisson(c, d.gx, d.gy, d.s * 0.8, "#7d8a46");
    else if(d.v === 2) clotureBout(c, d.gx, d.gy, d.s);
    else {
      var q = iso(d.gx, d.gy);
      c.fillStyle = "rgba(90,70,40,.35)";
      c.beginPath(); c.ellipse(q.x, q.y, 9 * d.s, 4 * d.s, 0, 0, 6.2832); c.fill();
    }
  }else if(biome === "hippie"){
    if(d.v === 0) combi(c, d.gx, d.gy, d.s);
    else if(d.v === 1) tipi(c, d.gx, d.gy, d.s);
    else if(d.v === 2) guirlande(c, d.gx, d.gy, d.s);
    else feuDeCamp(c, d.gx, d.gy, d.s);
  }else if(biome === "sud"){
    if(d.v === 0) cypres(c, d.gx, d.gy, d.s);
    else if(d.v === 1) olivier(c, d.gx, d.gy, d.s);
    else if(d.v === 2) lavande(c, d.gx, d.gy, d.s);
    else muretSec(c, d.gx, d.gy, d.s);
  /* LES TROIS ÎLES AJOUTÉES. Leurs objets vivent dans
     31-decors-nouveaux.js — l'ORDRE de ces quatre lignes est leur
     identité : `v` est tiré une fois pour toutes à la génération de la
     carte, et échanger deux objets rhabillerait toutes les parties en
     cours. On ajoute à la fin, on n'intercale pas. */
  }else if(biome === "guinguette"){
    if(d.v === 0) guirlandeGuinguette(c, d.gx, d.gy, d.s);
    else if(d.v === 1) tableGuinguette(c, d.gx, d.gy, d.s);
    else if(d.v === 2) lampadaireGuinguette(c, d.gx, d.gy, d.s);
    else tonneauGuinguette(c, d.gx, d.gy, d.s);
  }else if(biome === "tenebres"){
    if(d.v === 0) fissureTenebres(c, d.gx, d.gy, d.s);
    else if(d.v === 1) aiguilleTenebres(c, d.gx, d.gy, d.s);
    else if(d.v === 2) vasqueTenebres(c, d.gx, d.gy, d.s);
    else arbreCalcineTenebres(c, d.gx, d.gy, d.s);
  }else if(biome === "ibiza"){
    if(d.v === 0) parasolIbiza(c, d.gx, d.gy, d.s);
    else if(d.v === 1) transatIbiza(c, d.gx, d.gy, d.s);
    else if(d.v === 2) palmierIbiza(c, d.gx, d.gy, d.s);
    else loungeIbiza(c, d.gx, d.gy, d.s);
  /* LES MILLE ET UNE NUITS. Quatre variantes comme partout, mais
     chacune change de SILHOUETTE avec sa taille : douze bâtiments
     différents au lieu de quatre. Le détail vit dans
     39-nuits-decors.js. */
  }else if(biome === "nuits"){
    if(d.v === 0) jardinNuits(c, d.gx, d.gy, d.s);
    else if(d.v === 1) lanternesNuits(c, d.gx, d.gy, d.s);
    else if(d.v === 2) fontaineNuits(c, d.gx, d.gy, d.s);
    else tapisNuits(c, d.gx, d.gy, d.s);
  }
}

/* ================================================================
   L'EAU — motif raccordable, vagues fines et continues
   ================================================================ */
function construitMotifEau(b){
  function tuile(freq, angle, alpha, contraste){
    var N = 256;
    var cv = nouveauCanvas(N, N), c = cv.getContext("2d");
    var img = c.createImageData(N, N), d = img.data;
    var ca = Math.cos(angle), sa = Math.sin(angle);
    var cb = Math.cos(angle + 1.31), sb = Math.sin(angle + 1.31);
    var cc = Math.cos(angle - 0.72), sc = Math.sin(angle - 0.72);
    var creux = versRgb(b.eauO), moy = versRgb(b.eau), crete = versRgb(b.eauC);
    for(var y = 0; y < N; y++){
      for(var x = 0; x < N; x++){
        /* fréquences entières : la tuile se raccorde parfaitement */
        var u = (x * ca + y * sa) / N * 6.2832 * freq;
        var v = (x * cb + y * sb) / N * 6.2832 * (freq + 3);
        var w = (x * cc + y * sc) / N * 6.2832 * (freq + 7);
        var w2 = (x * sa - y * ca) / N * 6.2832 * (freq + 11);
        /* les crêtes se déforment les unes les autres : plus de réseau régulier */
        var hh = Math.sin(u + Math.sin(v) * 0.7) * 0.46
               + Math.sin(v + Math.sin(w) * 0.5) * 0.26
               + Math.sin(w) * 0.16 + Math.sin(w2) * 0.12;
        hh *= contraste;
        var t = (hh + 1) / 2;                       // 0 creux → 1 crête
        var r2, g2, b2;
        if(t < 0.5){
          var k = t * 2;
          r2 = creux[0] + (moy[0] - creux[0]) * k;
          g2 = creux[1] + (moy[1] - creux[1]) * k;
          b2 = creux[2] + (moy[2] - creux[2]) * k;
        }else{
          var k2 = (t - 0.5) * 2;
          k2 = k2 * k2;                             // les crêtes restent fines
          r2 = moy[0] + (crete[0] - moy[0]) * k2;
          g2 = moy[1] + (crete[1] - moy[1]) * k2;
          b2 = moy[2] + (crete[2] - moy[2]) * k2;
        }
        var o = (y * N + x) * 4;
        d[o] = r2; d[o + 1] = g2; d[o + 2] = b2;
        d[o + 3] = Math.round(alpha * 255);
      }
    }
    c.putImageData(img, 0, 0);
    return c.createPattern(cv, "repeat");
  }
  eauMotif1 = tuile(4, 0.37, 1, 1.0);
  eauMotif2 = tuile(7, 2.11, 0.42, 0.8);
}

/* ================================================================
   Contour de l'île
   ================================================================ */
function construitContourIle(){
  var m = 2.2;
  var pts = [], n = 46, i;
  function bord(gx, gy){ pts.push(iso(gx, gy)); }
  for(i = 0; i <= n; i++) bord(-m + (GW + 2 * m) * i / n, -m);
  for(i = 1; i <= n; i++) bord(GW + m, -m + (GH + 2 * m) * i / n);
  for(i = n - 1; i >= 0; i--) bord(-m + (GW + 2 * m) * i / n, GH + m);
  for(i = n - 1; i >= 1; i--) bord(-m, -m + (GH + 2 * m) * i / n);
  cheminIle = pts;
  CENTRE_X = (GW - GH) * TW / 4;
  CENTRE_Y = (GW + GH) * TH / 4;
}
function traceIle(c, dilat, ond, t, suite){
  if(!suite) c.beginPath();
  for(var i = 0; i < cheminIle.length; i++){
    var p = cheminIle[i];
    var d = dilat + (ond ? Math.sin(t * 2.1 + i * 0.35) * ond : 0);
    var vx = p.x - CENTRE_X, vy = (p.y - CENTRE_Y) * 2;
    var l = Math.hypot(vx, vy) || 1;
    var cx = p.x + vx / l * d, cy = p.y + vy / l * d * 0.5;
    if(i === 0) c.moveTo(cx, cy); else c.lineTo(cx, cy);
  }
  c.closePath();
}

/* ================================================================
   SOL PRÉ-CALCULÉ — uniquement le terrain plat.
   Rochers, falaises et décors sont dessinés en direct, dans le tri de
   profondeur : ils restent nets et les troupes passent devant/derrière.
   ================================================================ */

/* --- bruit lisse déterministe, pour des taches organiques --- */
function alea2d(a, b, graine){
  var n = Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(graine, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function bruitLisse(x, y, graine){
  var xi = Math.floor(x), yi = Math.floor(y);
  var xf = x - xi, yf = y - yi;
  var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return alea2d(xi, yi, graine) * (1 - u) * (1 - v)
       + alea2d(xi + 1, yi, graine) * u * (1 - v)
       + alea2d(xi, yi + 1, graine) * (1 - u) * v
       + alea2d(xi + 1, yi + 1, graine) * u * v;
}
function bruitFractal(x, y, graine){
  return bruitLisse(x, y, graine) * 0.55
       + bruitLisse(x * 2.13, y * 2.13, graine + 7) * 0.28
       + bruitLisse(x * 4.37, y * 4.37, graine + 19) * 0.17;
}
function adouci(t){ t = borne(t, 0, 1); return t * t * (3 - 2 * t); }

/* --- palettes de matière, par biome --- */
var MATIERES = {
  plage: {
    fond1:"#e6d1a0", fond2:"#dcc590",                     // dune sèche
    tache1:"#f2e2ba", tache2:"#cbb078",
    herbe1:"#9aa85e", herbe2:"#7d8c48",                   // touffes d'oyat
    sable1:"#f0dfb4", sable2:"#e6d0a0",
    mouille:"#b99a68", roche1:"#8d8794", roche2:"#6f6a78"
  },
  foret: {
    fond1:"#5d7c3d", fond2:"#4c6a30",
    tache1:"#6e8f47", tache2:"#3d5726",
    herbe1:"#77a04c", herbe2:"#4e7030",
    sable1:"#ddcda2", sable2:"#c9b483",
    mouille:"#a08e63", roche1:"#7a7484", roche2:"#5d5868"
  },
  campagne: {
    fond1:"#bb9e60", fond2:"#a88b4f",
    tache1:"#cdb073", tache2:"#8f7640",
    herbe1:"#9aa851", herbe2:"#7c8a44",
    sable1:"#e0cb95", sable2:"#cdb47c",
    mouille:"#9c8154", roche1:"#7f7986", roche2:"#635e6c"
  },
  hippie: {
    fond1:"#454a39", fond2:"#383e31",                     // prairie piétinée, à la nuit tombée
    tache1:"#565b42", tache2:"#282d24",
    herbe1:"#4c6743", herbe2:"#33442b",
    sable1:"#9c917a", sable2:"#847a66",
    mouille:"#585448", roche1:"#4b4260", roche2:"#352f45"
  },
  sud: {
    fond1:"#ddc99d", fond2:"#cdb682",                     // garrigue sèche, brûlée de soleil
    tache1:"#efdfb8", tache2:"#b49b68",
    herbe1:"#aab586", herbe2:"#8b9765",
    sable1:"#f2e5c6", sable2:"#e2d0a8",
    mouille:"#b6a179", roche1:"#d0c5ad", roche2:"#a89b83"
  },
  /* La jungle sous l'orage. Ici la terre n'est pas un fond : c'est de
     l'humus noir, gorgé d'eau, et c'est PARCE QU'IL EST SOMBRE que les
     feuillages au-dessus paraîtront lumineux. Le sable de la plage
     tire au gris-vert — du limon, pas du sable sec — et la « roche »
     des bords est une pierre mouillée, presque bleue. L'écart entre
     herbe1 et herbe2 est le plus large de toutes les cartes : c'est
     lui qui donne les taches de lumière sous la canopée. */
  jungle: {
    fond1:"#2c4126", fond2:"#22331d",
    tache1:"#3b5730", tache2:"#182614",
    herbe1:"#5c9440", herbe2:"#2a4522",
    sable1:"#7b7150", sable2:"#5f5740",
    mouille:"#33402e", roche1:"#525a58", roche2:"#3a4241"
  },
  /* La guinguette : de la terre battue, tassée par les pas. Les taches
     sont plus claires que le fond, pas plus sombres — ce sont les
     places usées où l'on danse, pas des flaques. L'« herbe » est celle
     d'un jardin de bord de rivière, foulée et un peu grise. */
  guinguette: {
    fond1:"#4a3a2c", fond2:"#3c2f24",
    tache1:"#5c4835", tache2:"#31261d",
    herbe1:"#4e5c36", herbe2:"#33402a",
    sable1:"#8a7053", sable2:"#6b5540",
    mouille:"#3a2f26", roche1:"#4e4450", roche2:"#372f3a"
  },
  /* Les ténèbres : de la roche refroidie, craquelée. Les deux taches
     encadrent le fond — l'une est de la cendre plus claire, l'autre du
     basalte presque noir — et l'« herbe » est la fissure
     incandescente : c'est la seule couleur vive du sol, et elle doit
     rester rare pour ne pas devenir un tapis. */
  tenebres: {
    fond1:"#241d21", fond2:"#181316",
    tache1:"#31282e", tache2:"#0f0c0e",
    herbe1:"#7a2410", herbe2:"#3d1408",
    sable1:"#372a2d", sable2:"#241b1e",
    mouille:"#1e181b", roche1:"#332b31", roche2:"#1f1a1e"
  },
  /* Ibiza : du sable clair et sec, du calcaire blanchi. Presque aucun
     contraste au sol — c'est voulu. Tout le contraste de cette carte
     est dans la mer et dans le décor ; un sol bavard écraserait les
     parasols. */
  ibiza: {
    fond1:"#f1debb", fond2:"#e6d0a2",
    tache1:"#fdf4de", tache2:"#d2b789",
    herbe1:"#a8bd82", herbe2:"#7f9660",
    sable1:"#fdf5e2", sable2:"#eddcb8",
    mouille:"#cbae7e", roche1:"#ebe5d6", roche2:"#c8c0ad"
  },
  /* Les mille et une nuits : de la pierre bleue de palais, veinée de
     violet. Les deux taches encadrent le fond d'un cran seulement —
     un sol trop bavard mangerait les mosaïques et les tapis qu'on va
     poser dessus, et c'est EUX qui font cette carte. L'« herbe » est
     celle d'un jardin clos, un vert profond qui tire au bleu : de la
     verdure de nuit, jamais de la prairie. */
  nuits: {
    fond1:"#2b2352", fond2:"#221b44",
    tache1:"#372e64", tache2:"#191333",
    herbe1:"#38705f", herbe2:"#204a44",
    sable1:"#9186c4", sable2:"#7368a6",
    mouille:"#453c78", roche1:"#3e3775", roche2:"#2a2352"
  }
};

/* Proportions de matière d'une case : sable / roche / herbe / humidité */
function matiereCase(i, j, graine){
  /* roche : le long des trois bords fermés */
  var dRoche = Math.min(j, GH - 1 - j, i);
  var fRoche = adouci(1 - dRoche / LARGEUR_ROCHE);
  /* sable : toute la plage à l'est, avec une transition douce */
  var fSable = i >= PLAGE_X0 ? 1 : adouci(1 - (PLAGE_X0 - i) / 12);
  /* humidité : les dernières cases avant l'eau */
  var fMouille = adouci((i - (GW - 6)) / 6);
  /* herbe : par taches, et seulement là où il n'y a ni roche ni sable sec */
  var n = bruitFractal(i * 0.055, j * 0.055, graine);
  var fHerbe = adouci((n - 0.46) * 3.2) * (1 - fSable * 0.9) * (1 - fRoche * 0.8);
  return { roche:fRoche, sable:fSable, mouille:fMouille, herbe:fHerbe, n:n };
}

function couleurCase(i, j, M, graine){
  var m = matiereCase(i, j, graine);
  var micro = bruitFractal(i * 0.42, j * 0.42, graine + 101);
  var damier = ((i + j) & 1) ? 0.011 : -0.011;
  /* fond du biome, avec ses taches */
  var base = melange(M.fond1, M.fond2, adouci(bruitFractal(i * 0.13, j * 0.13, graine + 3)));
  base = melange(base, M.tache1, adouci((m.n - 0.58) * 3) * 0.6);
  base = melange(base, M.tache2, adouci((0.42 - m.n) * 3) * 0.5);
  /* herbe par-dessus */
  if(m.herbe > 0.02){
    var h = melange(M.herbe1, M.herbe2, micro);
    base = melange(base, h, m.herbe * 0.85);
  }
  /* puis le sable de la plage */
  if(m.sable > 0.01){
    var sa = melange(M.sable1, M.sable2, micro);
    base = melange(base, sa, m.sable);
  }
  /* puis la roche des falaises */
  if(m.roche > 0.01){
    var ro = melange(M.roche1, M.roche2, micro);
    base = melange(base, ro, m.roche * 0.92);
  }
  /* enfin le sable mouillé du bord de mer */
  if(m.mouille > 0.01) base = melange(base, M.mouille, m.mouille * 0.75);
  return ecl(base, 1 + (micro - 0.5) * 0.09 + damier);
}

function construitSol(carteC){
  var b = BIOMES[carteC.biome];
  var M = MATIERES[carteC.biome];
  solInfo = tailleSolPrecalcule();
  if(!solCv || solCv.width !== solInfo.w || solCv.height !== solInfo.h){
    solCv = nouveauCanvas(solInfo.w, solInfo.h);
    solCtx = solCv.getContext("2d");
  }
  var c = solCtx;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, solCv.width, solCv.height);
  c.setTransform(SOL_ECH, 0, 0, SOL_ECH, -solInfo.x0 * SOL_ECH, -solInfo.y0 * SOL_ECH);

  var al = prng(carteC.graine ^ 0x5bd1);
  var gr = carteC.graine >>> 0;
  var i, j;

  /* --- masse de l'île --- */
  traceIle(c, 6, 0, 0);
  c.fillStyle = M.sable1;
  c.fill();

  /* --- le terrain, case par case --- */
  for(j = 0; j < GH; j++){
    for(i = 0; i < GW; i++){
      c.fillStyle = couleurCase(i, j, M, gr);
      var a = iso(i, j), e = iso(i + 1, j), f = iso(i + 1, j + 1), g = iso(i, j + 1);
      c.beginPath();
      c.moveTo(a.x, a.y); c.lineTo(e.x, e.y); c.lineTo(f.x, f.y); c.lineTo(g.x, g.y);
      c.closePath(); c.fill();
    }
  }

  /* --- grands reliefs doux : dunes, creux, ombres portées du terrain --- */
  c.save();
  traceIle(c, 0, 0, 0); c.clip();
  for(i = 0; i < 130; i++){
    var dx = al() * GW, dy = al() * GH;
    var p = iso(dx, dy);
    var rr = 130 + al() * 420;
    var clair = al() < 0.5;
    var gd = c.createRadialGradient(p.x, p.y, 4, p.x, p.y, rr);
    gd.addColorStop(0, clair ? "rgba(255,248,224,.13)" : "rgba(70,50,26,.12)");
    gd.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = gd;
    c.beginPath(); c.ellipse(p.x, p.y, rr, rr / 2, 0, 0, 6.2832); c.fill();
  }
  c.restore();

  /* --- allées du quadrillage militaire --- */
  c.save();
  c.globalAlpha = 0.18;
  c.fillStyle = M.tache1;
  for(i = 3; i < PLAGE_X0; i += 5){
    var a1 = iso(i + 1.6, 0), a2 = iso(i + 2.4, 0), a3 = iso(i + 2.4, GH), a4 = iso(i + 1.6, GH);
    c.beginPath(); c.moveTo(a1.x, a1.y); c.lineTo(a2.x, a2.y); c.lineTo(a3.x, a3.y); c.lineTo(a4.x, a4.y);
    c.closePath(); c.fill();
  }
  for(j = 0; j < GH; j += 5){
    var b1 = iso(0, j + 1.6), b2 = iso(0, j + 2.4), b3 = iso(PLAGE_X0, j + 2.4), b4 = iso(PLAGE_X0, j + 1.6);
    c.beginPath(); c.moveTo(b1.x, b1.y); c.lineTo(b2.x, b2.y); c.lineTo(b3.x, b3.y); c.lineTo(b4.x, b4.y);
    c.closePath(); c.fill();
  }
  c.restore();

  /* --- textures propres au biome --- */
  c.save();
  traceIle(c, 0, 0, 0); c.clip();
  if(carteC.biome === "campagne"){
    c.globalAlpha = 0.14; c.strokeStyle = "#6d5527"; c.lineWidth = 2;
    for(j = 3; j < GH - 3; j += 0.9){
      if(matiereCase(GW * 0.4 | 0, j | 0, gr).sable > 0.5) continue;
      var s1 = iso(LARGEUR_ROCHE + 1, j), s2 = iso(PLAGE_X0 - 6, j);
      c.beginPath(); c.moveTo(s1.x, s1.y); c.lineTo(s2.x, s2.y); c.stroke();
    }
  }
  if(carteC.biome === "foret"){
    c.globalAlpha = 0.16;
    for(i = 0; i < 1500; i++){
      var mx = al() * PLAGE_X0, my = al() * GH;
      var pp = iso(mx, my);
      c.fillStyle = al() < 0.5 ? "#39562a" : "#6f9046";
      c.beginPath(); c.ellipse(pp.x, pp.y, 14 + al() * 28, 7 + al() * 13, 0, 0, 6.2832); c.fill();
    }
  }
  if(carteC.biome === "hippie"){
    /* La prairie de nuit, éclairée par la fête. On peint la lumière
       AVANT tout le reste, en mode additif : une nuit d'où l'on
       n'aurait retiré que de la couleur serait sinistre. */
    var TEINTES = ["#ff4f9e", "#ffb43c", "#3fe0d8", "#9d6bff", "#8ee04a"];
    /* le voile de nuit : il refroidit TOUT le sol d'un coup, sable
       compris. Sans lui, la plage restait en plein jour au milieu
       d'une prairie de nuit. */
    c.save();
    c.globalAlpha = 0.40;
    c.fillStyle = "#1b1440";
    traceIle(c, 6, 0, 0); c.fill();
    c.restore();
    c.save();
    c.globalCompositeOperation = "lighter";
    /* les grandes nappes de scène, puis les petites flaques serrées :
       deux échelles, sinon la lumière fait une purée uniforme */
    for(i = 0; i < 26; i++){
      var ax2 = 4 + al() * (PLAGE_X0 - 6), ay2 = al() * GH;
      var pa = iso(ax2, ay2);
      var ra = 200 + al() * 190;
      var ta = TEINTES[(al() * 5) | 0];
      var ga = c.createRadialGradient(pa.x, pa.y, 4, pa.x, pa.y, ra);
      ga.addColorStop(0, rgba(ta, 0.20));
      ga.addColorStop(0.5, rgba(ta, 0.07));
      ga.addColorStop(1, rgba(ta, 0));
      c.fillStyle = ga;
      c.beginPath(); c.ellipse(pa.x, pa.y, ra, ra / 2, 0, 0, 6.2832); c.fill();
    }
    for(i = 0; i < 320; i++){
      var lx = 2 + al() * (PLAGE_X0 - 3), ly = al() * GH;
      var pl = iso(lx, ly);
      var rl = 26 + al() * 110;
      var tl = TEINTES[(al() * 5) | 0];
      var gl = c.createRadialGradient(pl.x, pl.y, 2, pl.x, pl.y, rl);
      gl.addColorStop(0, rgba(tl, 0.40));
      gl.addColorStop(0.42, rgba(tl, 0.13));
      gl.addColorStop(1, rgba(tl, 0));
      c.fillStyle = gl;
      c.beginPath(); c.ellipse(pl.x, pl.y, rl, rl / 2, 0, 0, 6.2832); c.fill();
    }
    c.restore();
    /* pistes de danse : l'herbe y est tassée, pâlie, et cerclée */
    c.save();
    for(i = 0; i < 34; i++){
      var dx2 = 6 + al() * (PLAGE_X0 - 10), dy2 = 3 + al() * (GH - 6);
      var pd = iso(dx2, dy2);
      var rd = 34 + al() * 54;
      c.globalAlpha = 0.16 + al() * 0.12;
      c.fillStyle = "#a89d78";
      c.beginPath(); c.ellipse(pd.x, pd.y, rd, rd / 2, 0, 0, 6.2832); c.fill();
      c.globalAlpha = 0.22;
      c.strokeStyle = "#c9bd93"; c.lineWidth = 2;
      c.beginPath(); c.ellipse(pd.x, pd.y, rd * 0.72, rd * 0.36, 0, 0, 6.2832); c.stroke();
    }
    c.restore();
    /* spirales peintes à même l'herbe, à la bombe */
    c.save();
    c.globalAlpha = 0.3; c.lineWidth = 2.6; c.lineCap = "round";
    for(i = 0; i < 130; i++){
      var sx2 = 4 + al() * (PLAGE_X0 - 8), sy2 = 2 + al() * (GH - 4);
      var ps = iso(sx2, sy2);
      var sens = al() < 0.5 ? 1 : -1;
      c.strokeStyle = TEINTES[(al() * 5) | 0];
      c.beginPath();
      for(var ks = 0; ks < 26; ks++){
        var an2 = ks * 0.52 * sens, rr3 = ks * 1.15;
        var xs = ps.x + Math.cos(an2) * rr3 * 2, ys = ps.y + Math.sin(an2) * rr3;
        if(ks === 0) c.moveTo(xs, ys); else c.lineTo(xs, ys);
      }
      c.stroke();
    }
    /* confettis */
    for(i = 0; i < 1800; i++){
      var cx3 = al() * PLAGE_X0, cy3 = al() * GH;
      var pc = iso(cx3, cy3);
      c.globalAlpha = 0.4 + al() * 0.4;
      c.fillStyle = TEINTES[(al() * 5) | 0];
      c.fillRect(pc.x, pc.y, 1.8 + al() * 1.6, 1.4);
    }
    c.restore();
  }
  /* ================================================================
     LES TROIS SOLS AJOUTÉS

     Chaque île du jeu a sa passe de texture : les sillons de la
     campagne, la mousse de la forêt, les parcelles de lavande du Sud.
     Sans elle, une carte n'est qu'une palette — le terrain est juste,
     mais il ne raconte rien. Ces trois-là sont peintes ici, dans le
     canevas de sol PRÉ-CALCULÉ : elles ne coûtent qu'une fois, au
     chargement de l'île, et rien du tout à l'image.
     ================================================================ */
  if(carteC.biome === "guinguette"){
    /* 1. LES FLAQUES DE LUMIÈRE. Le ciel est presque noir et le sol
       tenu dans des bruns sourds : sans ces ronds tièdes, la carte
       serait un terrain vague à guirlandes. Ce sont eux qui font
       croire que quelqu'un a allumé quelque chose. Elles sont
       DISPERSÉES et non régulières — une fête s'organise autour de ce
       qu'on éclaire, pas en quadrillage. */
    c.save();
    traceIle(c, 0, 0, 0); c.clip();
    for(i = 0; i < 62; i++){
      var gx1 = LARGEUR_ROCHE + al() * (PLAGE_X0 - LARGEUR_ROCHE), gy1 = al() * GH;
      var pg1 = iso(gx1, gy1);
      var rg1 = 90 + al() * 230;
      var chaud = al() < 0.62;
      var gg1 = c.createRadialGradient(pg1.x, pg1.y, 5, pg1.x, pg1.y, rg1);
      gg1.addColorStop(0, chaud ? "rgba(255,196,110,.15)" : "rgba(255,150,90,.10)");
      gg1.addColorStop(0.55, chaud ? "rgba(255,170,90,.05)" : "rgba(240,130,80,.035)");
      gg1.addColorStop(1, "rgba(255,150,70,0)");
      c.fillStyle = gg1;
      c.beginPath(); c.ellipse(pg1.x, pg1.y, rg1, rg1 / 2, 0, 0, 6.2832); c.fill();
    }
    /* 2. LES PLANCHERS DE BAL. Quelques carrés de bois clair posés à
       même la terre : c'est là qu'on danse, et c'est ce qui distingue
       un jardin d'une guinguette. Ils suivent le losange de la
       projection, comme tout le reste. */
    for(i = 0; i < 14; i++){
      var bx1 = LARGEUR_ROCHE + 3 + al() * (PLAGE_X0 - LARGEUR_ROCHE - 12);
      var by1 = 4 + al() * (GH - 12);
      var cw1 = 5 + al() * 4, ch1 = 4 + al() * 3;
      var q1 = iso(bx1, by1), q2 = iso(bx1 + cw1, by1);
      var q3 = iso(bx1 + cw1, by1 + ch1), q4 = iso(bx1, by1 + ch1);
      c.globalAlpha = 0.22;
      c.fillStyle = "#8a6a45";
      c.beginPath();
      c.moveTo(q1.x, q1.y); c.lineTo(q2.x, q2.y); c.lineTo(q3.x, q3.y); c.lineTo(q4.x, q4.y);
      c.closePath(); c.fill();
      /* les lames du plancher, dans le sens de la longueur */
      c.globalAlpha = 0.14;
      c.strokeStyle = "#4a3624"; c.lineWidth = 1.2;
      for(j = 0.5; j < ch1; j += 0.8){
        var l1 = iso(bx1, by1 + j), l2 = iso(bx1 + cw1, by1 + j);
        c.beginPath(); c.moveTo(l1.x, l1.y); c.lineTo(l2.x, l2.y); c.stroke();
      }
    }
    c.globalAlpha = 1;

    /* ================================================================
       3. LE PAVOIS — LES GUIRLANDES, PEINTES

       Les défenses ajoutées à cette île dessinent quatre festons
       autour d'une piste de bal. À l'écran, elles ne le disaient pas :
       mille tourelles serrées font un tapis, et l'œil ne distingue une
       ligne dense d'un semis régulier qu'en s'approchant beaucoup.

       On peint donc la figure elle-même. C'est du SOL, donc du décor :
       aucun index, aucun bit de destruction, rien qui coûte à l'image
       — le canevas est calculé une fois au débarquement. Et c'est la
       MÊME géométrie que les défenses, prise à la même fonction :
       deux tracés calculés séparément se seraient désalignés à la
       première retouche d'un rayon, et c'est le genre d'écart qu'on ne
       voit qu'à l'écran, longtemps après.

       Résultat : la fête se lit de haut — quatre guirlandes qui
       pendent entre leurs mâts, un plancher de bal au milieu — et
       chaque tourelle qu'on rencontre est visiblement accrochée à
       quelque chose. C'est la différence entre « il y a plus de
       défenses » et « il y a une fête ». */
    var FG = figureGuinguette();
    var pP = iso(FG.cx, FG.cy);
    /* LE RAYON À L'ÉCRAN, ET LA RACINE DE DEUX QU'ON OUBLIE. Un cercle
       du quadrillage se projette en ellipse DROITE — la rotation de
       quarante-cinq degrés de la projection l'y ramène — mais ses
       demi-axes valent 26 R √2 et 13 R √2, pas 26 R et 13 R. Sans le
       facteur, le plancher est trop petit d'un tiers et l'anneau de
       torches tombe nettement en dehors. */
    var rP = FG.piste * TW * 0.5 * 1.41421;

    /* LE PLANCHER DE BAL. Un vrai disque de bois clair, ses lames
       dans le sens de la projection, et un liseré chaud au bord :
       c'est le seul endroit de l'île qui soit VIDE de guirlande, donc
       le seul qui se lise comme un lieu et non comme une allée. */
    /* une nappe de lumière sous le plancher : l'île est sombre, et
       c'est la LUEUR qui porte de loin, jamais le bois */
    var gP = c.createRadialGradient(pP.x, pP.y, rP * 0.2, pP.x, pP.y, rP * 1.35);
    gP.addColorStop(0, "rgba(255,206,140,.30)");
    gP.addColorStop(0.62, "rgba(255,176,104,.13)");
    gP.addColorStop(1, "rgba(255,160,90,0)");
    c.fillStyle = gP;
    c.beginPath(); c.ellipse(pP.x, pP.y, rP * 1.35, rP * 0.68, 0, 0, 6.2832); c.fill();

    c.save();
    c.globalAlpha = 0.62;
    c.fillStyle = "#c8a068";
    c.beginPath(); c.ellipse(pP.x, pP.y, rP, rP * 0.5, 0, 0, 6.2832); c.fill();
    c.clip();
    /* les lames, dans les DEUX sens de la projection : un plancher de
       bal se pose en damier, et le damier est ce qui le distingue
       d'une simple flaque de lumière de plus */
    c.globalAlpha = 0.20;
    c.strokeStyle = "#4a3624"; c.lineWidth = 1.6;
    for(j = -FG.piste; j <= FG.piste; j += 1.05){
      var w1 = iso(FG.cx - FG.piste, FG.cy + j), w2 = iso(FG.cx + FG.piste, FG.cy + j);
      c.beginPath(); c.moveTo(w1.x, w1.y); c.lineTo(w2.x, w2.y); c.stroke();
    }
    c.globalAlpha = 0.10;
    for(j = -FG.piste; j <= FG.piste; j += 2.1){
      var w3 = iso(FG.cx + j, FG.cy - FG.piste), w4 = iso(FG.cx + j, FG.cy + FG.piste);
      c.beginPath(); c.moveTo(w3.x, w3.y); c.lineTo(w4.x, w4.y); c.stroke();
    }
    c.restore();
    c.globalAlpha = 0.85;
    c.strokeStyle = "#ffd79a"; c.lineWidth = 3.6;
    c.beginPath(); c.ellipse(pP.x, pP.y, rP, rP * 0.5, 0, 0, 6.2832); c.stroke();

    /* LES QUATRE GUIRLANDES. Trois passes sur le même tracé : un halo
       large et tiède qui pose la lumière au sol, le fil lui-même, et
       les lampions. Sans le halo, un trait de deux pixels sur de la
       terre battue disparaît dès qu'on dézoome — c'est la lueur, et
       non le fil, qui porte la figure de loin. */
    for(var ig = 0; ig < FG.couronnes.length; ig++){
      var KG = FG.couronnes[ig];
      for(var jg = 0; jg < KG.cordes.length; jg++){
        var CG = KG.cordes[jg];
        /* On retrace la parabole finement — les perles sont espacées
           de trois cases, ce qui ferait une ligne brisée — ET L'ON
           COUPE LE FIL DANS LES ALLÉES. C'est le même test que pour
           les défenses : si la guirlande peinte traversait l'entrée
           que les tourelles laissent libre, l'allée se lirait comme
           un défaut de la figure au lieu d'une porte. */
        var brins = [], brin = null;
        for(var ug = 0; ug <= 30; ug++){
          var Pg = CG.fil(ug / 30);
          if(dansAlleeGuinguette(Pg[0], Pg[1])){ brin = null; continue; }
          if(!brin){ brin = []; brins.push(brin); }
          brin.push(iso(Pg[0], Pg[1]));
        }
        for(var bg = 0; bg < brins.length; bg++){
          if(brins[bg].length < 2) continue;
          c.beginPath();
          for(var vg = 0; vg < brins[bg].length; vg++){
            var qg = brins[bg][vg];
            if(vg) c.lineTo(qg.x, qg.y); else c.moveTo(qg.x, qg.y);
          }
          c.globalAlpha = 0.30; c.strokeStyle = "#ffb45a"; c.lineWidth = 22;
          c.lineCap = "round"; c.stroke();
          c.globalAlpha = 0.88; c.strokeStyle = "#ffe2b4"; c.lineWidth = 3.4;
          c.stroke();
        }
        /* les lampions, aux mêmes points que les perles de défense :
           chaque tourelle du feston est ainsi posée SUR une lumière.
           Trois couleurs pour trois types, dans le même ordre que
           `bille()` — la lumière, le lampion rouge, le brasero. */
        for(var kg = 0; kg < CG.pts.length; kg++){
          if(dansAlleeGuinguette(CG.pts[kg][0], CG.pts[kg][1])) continue;
          var lg = iso(CG.pts[kg][0], CG.pts[kg][1]);
          c.globalAlpha = 0.80;
          c.fillStyle = ["#cfe8ff", "#ff7a48", "#ffd07a"][kg % 3];
          c.beginPath(); c.arc(lg.x, lg.y, 6.2, 0, 6.2832); c.fill();
        }
      }
      /* les mâts : un pied de lumière au sol */
      for(var mg = 0; mg < KG.mats.length; mg++){
        if(dansAlleeGuinguette(KG.mats[mg][0], KG.mats[mg][1])) continue;
        var ng = iso(KG.mats[mg][0], KG.mats[mg][1]);
        var gg2 = c.createRadialGradient(ng.x, ng.y, 2, ng.x, ng.y, 34);
        gg2.addColorStop(0, "rgba(255,214,140,.50)");
        gg2.addColorStop(1, "rgba(255,190,110,0)");
        c.globalAlpha = 1; c.fillStyle = gg2;
        c.beginPath(); c.ellipse(ng.x, ng.y, 34, 17, 0, 0, 6.2832); c.fill();
      }
    }
    c.globalAlpha = 1;
    c.lineCap = "butt";
    c.restore();
  }

  if(carteC.biome === "tenebres"){
    /* LE RÉSEAU DE FISSURES. C'est LA texture de cette île, et elle
       doit courir sur toute sa surface : des veines isolées se
       liraient comme des accidents, un réseau se lit comme une croûte
       posée sur quelque chose de vivant.
       Chaque veine part d'un point et marche en zigzag, en se divisant
       une fois sur trois. Trois passes de plus en plus fines et de
       plus en plus claires : la lèvre sombre, la lave, le cœur. Le
       tracé est le MÊME pour les trois — on le retient dans un tableau
       de points au lieu de le retirer trois fois, sinon les trois
       couches ne se superposeraient pas. */
    c.save();
    traceIle(c, 0, 0, 0); c.clip();
    var veines = [];
    for(i = 0; i < 46; i++){
      var vx = LARGEUR_ROCHE + al() * (PLAGE_X0 - LARGEUR_ROCHE);
      var vy = al() * GH;
      var ang = al() * 6.2832;
      var pts = [[vx, vy]];
      var pas = 6 + ((al() * 10) | 0);
      for(j = 0; j < pas; j++){
        ang += (al() - 0.5) * 1.5;
        vx += Math.cos(ang) * (1.6 + al() * 2.6);
        vy += Math.sin(ang) * (1.6 + al() * 2.6);
        if(vx < 1 || vx > PLAGE_X0 || vy < 1 || vy > GH - 1) break;
        pts.push([vx, vy]);
      }
      if(pts.length > 2) veines.push(pts);
    }
    var couches = [
      { e:7.0, col:"rgba(10,6,8,.62)",    lum:0 },
      { e:3.4, col:"rgba(150,34,10,.60)", lum:1 },
      { e:1.5, col:"rgba(240,110,36,.62)",lum:1 },
      { e:0.6, col:"rgba(255,214,120,.5)",lum:1 }
    ];
    for(var kc = 0; kc < couches.length; kc++){
      c.save();
      if(couches[kc].lum) c.globalCompositeOperation = "lighter";
      c.strokeStyle = couches[kc].col;
      c.lineWidth = couches[kc].e;
      c.lineCap = "round"; c.lineJoin = "round";
      for(i = 0; i < veines.length; i++){
        var vv = veines[i];
        c.beginPath();
        var d0 = iso(vv[0][0], vv[0][1]);
        c.moveTo(d0.x, d0.y);
        for(j = 1; j < vv.length; j++){
          var dd = iso(vv[j][0], vv[j][1]);
          c.lineTo(dd.x, dd.y);
        }
        c.stroke();
      }
      c.restore();
    }
    /* les plaques de cendre froide, par-dessus : elles cassent le
       réseau et empêchent la carte de devenir un filet régulier */
    for(i = 0; i < 46; i++){
      var cx1 = al() * PLAGE_X0, cy1 = al() * GH;
      var pc1 = iso(cx1, cy1);
      var rc1 = 100 + al() * 300;
      var gc1 = c.createRadialGradient(pc1.x, pc1.y, 6, pc1.x, pc1.y, rc1);
      gc1.addColorStop(0, "rgba(12,9,11,.30)");
      gc1.addColorStop(1, "rgba(12,9,11,0)");
      c.fillStyle = gc1;
      c.beginPath(); c.ellipse(pc1.x, pc1.y, rc1, rc1 / 2, 0, 0, 6.2832); c.fill();
    }
    c.restore();
  }

  if(carteC.biome === "ibiza"){
    /* 1. LES RIDES DU SABLE. De longues courbes parallèles au rivage,
       très pâles : c'est ce qui fait qu'un sable est du sable et non
       un aplat beige. Elles s'estompent en s'éloignant de l'eau. */
    c.save();
    traceIle(c, 0, 0, 0); c.clip();
    c.lineCap = "round";
    for(i = 0; i < 210; i++){
      var rx1 = PLAGE_X0 - al() * al() * (PLAGE_X0 - LARGEUR_ROCHE);
      var ry1 = al() * GH;
      var lgr = 6 + al() * 16;
      var creux = al() < 0.5;
      c.strokeStyle = creux ? "rgba(168,146,110,.16)" : "rgba(255,250,232,.20)";
      c.lineWidth = 1.4 + al() * 1.8;
      c.beginPath();
      var w0 = iso(rx1, ry1);
      c.moveTo(w0.x, w0.y);
      for(j = 1; j <= 5; j++){
        var wj = iso(rx1 + Math.sin(j * 0.9 + ry1) * 1.4, ry1 + lgr * j / 5);
        c.lineTo(wj.x, wj.y);
      }
      c.stroke();
    }
    /* 2. LES TERRASSES DU CLUB. De grandes dalles claires, bordées de
       turquoise : c'est le mobilier du sol, et c'est ce qui empêche
       Ibiza d'être une seconde plage. */
    for(i = 0; i < 16; i++){
      var tx1 = LARGEUR_ROCHE + 4 + al() * (PLAGE_X0 - LARGEUR_ROCHE - 16);
      var ty1 = 4 + al() * (GH - 14);
      var tw1 = 7 + al() * 7, th1 = 5 + al() * 5;
      var u1 = iso(tx1, ty1), u2 = iso(tx1 + tw1, ty1);
      var u3 = iso(tx1 + tw1, ty1 + th1), u4 = iso(tx1, ty1 + th1);
      c.globalAlpha = 0.30;
      c.fillStyle = "#fdf8ec";
      c.beginPath();
      c.moveTo(u1.x, u1.y); c.lineTo(u2.x, u2.y); c.lineTo(u3.x, u3.y); c.lineTo(u4.x, u4.y);
      c.closePath(); c.fill();
      c.globalAlpha = 0.34;
      c.strokeStyle = "#1fb9c9"; c.lineWidth = 1.8;
      c.stroke();
      c.globalAlpha = 1;
    }
    c.restore();
  }

  /* ================================================================
     LE SOL DES MILLE ET UNE NUITS

     C'est la passe la plus longue du fichier, et c'est assumé : le
     cahier des charges dit « il faut que même lorsqu'il n'y a pas de
     défense, le terrain reste intéressant ». Tout ce qui suit est
     PRÉ-CUIT — peint une fois au chargement de l'île, rien à l'image.
     C'est ce qui permet d'en mettre autant.

     Six couches, du plus large au plus fin :
       1. le clair de lune, qui donne le relief ;
       2. les cours pavées, en mosaïque géométrique ;
       3. les tapis, posés sur les cours et à côté ;
       4. les chemins de pierre qui relient tout ça ;
       5. les bassins, seule eau douce de l'île ;
       6. les étoiles et les croissants gravés, l'or de la carte.
     ================================================================ */
  if(carteC.biome === "nuits"){
    c.save();
    traceIle(c, 0, 0, 0); c.clip();

    /* --- 1. LE CLAIR DE LUNE. Sans lui le sol est un aplat indigo et
       l'île n'a pas de volume. Des nappes froides, larges, et quelques
       creux plus sombres pour que ce ne soit pas une lueur uniforme. */
    c.save();
    c.globalCompositeOperation = "lighter";
    for(i = 0; i < 54; i++){
      var lx3 = al() * GW, ly3 = al() * GH;
      var pl3 = iso(lx3, ly3);
      var rl3 = 150 + al() * 330;
      var gl3 = c.createRadialGradient(pl3.x, pl3.y, 6, pl3.x, pl3.y, rl3);
      gl3.addColorStop(0, "rgba(150,160,255,.085)");
      gl3.addColorStop(0.5, "rgba(120,132,230,.030)");
      gl3.addColorStop(1, "rgba(110,120,220,0)");
      c.fillStyle = gl3;
      c.beginPath(); c.ellipse(pl3.x, pl3.y, rl3, rl3 / 2, 0, 0, 6.2832); c.fill();
    }
    c.restore();
    for(i = 0; i < 30; i++){
      var ox3 = al() * GW, oy3 = al() * GH;
      var po3 = iso(ox3, oy3);
      var ro3 = 120 + al() * 260;
      var go3 = c.createRadialGradient(po3.x, po3.y, 6, po3.x, po3.y, ro3);
      go3.addColorStop(0, "rgba(8,6,24,.26)");
      go3.addColorStop(1, "rgba(8,6,24,0)");
      c.fillStyle = go3;
      c.beginPath(); c.ellipse(po3.x, po3.y, ro3, ro3 / 2, 0, 0, 6.2832); c.fill();
    }

    /* --- 2. LES COURS EN MOSAÏQUE. Le motif est celui des carrelages
       orientaux : une trame de losanges où une case sur deux est
       claire, semée d'étoiles à huit branches. Il est tracé DANS le
       repère isométrique, case par case — une mosaïque dessinée à
       l'écran puis posée à plat aurait glissé sur la perspective et
       se serait vue immédiatement.
       On les pose D'ABORD, parce que tout le reste va dessus. */
    var MOS = [
      { a:"#3b4f9e", b:"#22306e", or:"#d8b45c" },   // bleu de Perse
      { a:"#2f7a72", b:"#1c4c4c", or:"#e0c070" },   // turquoise
      { a:"#5a3a86", b:"#38235a", or:"#d0a8e8" }    // violet
    ];
    for(i = 0; i < 22; i++){
      var mx3 = LARGEUR_ROCHE + 2 + al() * (PLAGE_X0 - LARGEUR_ROCHE - 16);
      var my3 = 3 + al() * (GH - 16);
      var mw3 = 6 + ((al() * 7) | 0), mh3 = 5 + ((al() * 6) | 0);
      var P3 = MOS[(al() * MOS.length) | 0];
      var ang3 = al() < 0.5;
      c.save();
      c.globalAlpha = 0.62;
      for(var jj = 0; jj < mh3; jj++){
        for(var ii = 0; ii < mw3; ii++){
          var pair = ((ii + jj) & 1) === (ang3 ? 0 : 1);
          c.fillStyle = pair ? P3.a : P3.b;
          var k1 = iso(mx3 + ii, my3 + jj), k2 = iso(mx3 + ii + 1, my3 + jj);
          var k3 = iso(mx3 + ii + 1, my3 + jj + 1), k4 = iso(mx3 + ii, my3 + jj + 1);
          c.beginPath();
          c.moveTo(k1.x, k1.y); c.lineTo(k2.x, k2.y);
          c.lineTo(k3.x, k3.y); c.lineTo(k4.x, k4.y);
          c.closePath(); c.fill();
          /* l'étoile à huit branches, au centre d'une case claire sur
             deux : c'est ELLE qui dit « oriental » plutôt que
             « damier ». Un simple losange doré à cette taille — quatre
             pixels — se lit comme une étoile ; y mettre huit branches
             réelles ne se verrait pas et coûterait huit fois plus. */
          if(pair && ((ii * 3 + jj * 5) % 3 === 0)){
            var kc3 = iso(mx3 + ii + 0.5, my3 + jj + 0.5);
            c.fillStyle = P3.or;
            c.globalAlpha = 0.55;
            c.beginPath();
            c.moveTo(kc3.x, kc3.y - 3.4); c.lineTo(kc3.x + 5.2, kc3.y);
            c.lineTo(kc3.x, kc3.y + 3.4); c.lineTo(kc3.x - 5.2, kc3.y);
            c.closePath(); c.fill();
            c.globalAlpha = 0.62;
          }
        }
      }
      /* la bordure de la cour, en or */
      c.globalAlpha = 0.42;
      c.strokeStyle = P3.or; c.lineWidth = 2.2;
      var v1 = iso(mx3, my3), v2 = iso(mx3 + mw3, my3);
      var v3 = iso(mx3 + mw3, my3 + mh3), v4 = iso(mx3, my3 + mh3);
      c.beginPath();
      c.moveTo(v1.x, v1.y); c.lineTo(v2.x, v2.y);
      c.lineTo(v3.x, v3.y); c.lineTo(v4.x, v4.y);
      c.closePath(); c.stroke();
      c.restore();
    }

    /* --- 3. LES TAPIS. Rouge profond, bordure claire, médaillon au
       centre. Ils sont plus petits que les cours et posés n'importe
       où : c'est ce qui donne l'impression que quelqu'un vit là. */
    var TAPIS = [
      { f:"#7a1f38", b:"#e0b060", m:"#c8843c" },
      { f:"#25406e", b:"#c8b06a", m:"#6a94c8" },
      { f:"#5c2a6a", b:"#d8b8e8", m:"#a86ac0" },
      { f:"#1f5a52", b:"#dcc078", m:"#4c9c8a" }
    ];
    for(i = 0; i < 30; i++){
      var tx3 = LARGEUR_ROCHE + 2 + al() * (PLAGE_X0 - LARGEUR_ROCHE - 8);
      var ty3 = 2 + al() * (GH - 8);
      var tw3 = 2.4 + al() * 2.6, th3 = 1.8 + al() * 2.0;
      var T3 = TAPIS[(al() * TAPIS.length) | 0];
      function quad(x0, y0, w0, h0){
        var q1 = iso(x0, y0), q2 = iso(x0 + w0, y0);
        var q3 = iso(x0 + w0, y0 + h0), q4 = iso(x0, y0 + h0);
        c.beginPath();
        c.moveTo(q1.x, q1.y); c.lineTo(q2.x, q2.y);
        c.lineTo(q3.x, q3.y); c.lineTo(q4.x, q4.y);
        c.closePath();
      }
      c.globalAlpha = 0.68;
      c.fillStyle = T3.f; quad(tx3, ty3, tw3, th3); c.fill();
      c.globalAlpha = 0.5;
      c.strokeStyle = T3.b; c.lineWidth = 2.0;
      quad(tx3 + 0.22, ty3 + 0.18, tw3 - 0.44, th3 - 0.36); c.stroke();
      c.globalAlpha = 0.42;
      c.fillStyle = T3.m;
      var mc3 = iso(tx3 + tw3 / 2, ty3 + th3 / 2);
      c.beginPath();
      c.ellipse(mc3.x, mc3.y, tw3 * 7, th3 * 3.6, 0, 0, 6.2832);
      c.fill();
      c.globalAlpha = 1;
    }

    /* --- 4. LES CHEMINS DE PIERRE. Ils errent d'un bord à l'autre en
       pas de deux cases, en dalles claires. Un chemin droit aurait
       fait une route ; celui-ci serpente comme une allée de jardin. */
    c.save();
    c.globalAlpha = 0.30;
    c.strokeStyle = "#8e86c8";
    c.lineCap = "round"; c.lineJoin = "round";
    for(i = 0; i < 16; i++){
      var cx4 = LARGEUR_ROCHE + al() * (PLAGE_X0 - LARGEUR_ROCHE);
      var cy4 = al() * GH;
      var an4 = al() * 6.2832;
      c.lineWidth = 5 + al() * 5;
      c.beginPath();
      var d4 = iso(cx4, cy4); c.moveTo(d4.x, d4.y);
      for(j = 0; j < 26; j++){
        an4 += (al() - 0.5) * 0.9;
        cx4 += Math.cos(an4) * 2.4; cy4 += Math.sin(an4) * 2.4;
        if(cx4 < 1 || cx4 > PLAGE_X0 + 4 || cy4 < 0 || cy4 > GH) break;
        var e4 = iso(cx4, cy4); c.lineTo(e4.x, e4.y);
      }
      c.stroke();
    }
    c.restore();

    /* --- 5. LES BASSINS. La seule eau douce de l'île, et la seule
       chose vraiment claire au sol : un turquoise qui brille dans
       l'indigo. Une margelle de pierre pâle, l'eau dedans, un reflet
       de lune dessus. */
    for(i = 0; i < 26; i++){
      var bx4 = LARGEUR_ROCHE + 3 + al() * (PLAGE_X0 - LARGEUR_ROCHE - 8);
      var by4 = 3 + al() * (GH - 8);
      var rb4 = 1.1 + al() * 1.5;
      var pb4 = iso(bx4, by4);
      c.globalAlpha = 0.5;
      c.fillStyle = "#6a63a8";
      c.beginPath(); c.ellipse(pb4.x, pb4.y, rb4 * RX * 1.16, rb4 * RY * 1.16, 0, 0, 6.2832); c.fill();
      c.globalAlpha = 0.72;
      var gb4 = c.createRadialGradient(pb4.x, pb4.y - rb4 * 4, 2, pb4.x, pb4.y, rb4 * RX);
      gb4.addColorStop(0, "#6ff0e0");
      gb4.addColorStop(0.6, "#1f9aa8");
      gb4.addColorStop(1, "#155a78");
      c.fillStyle = gb4;
      c.beginPath(); c.ellipse(pb4.x, pb4.y, rb4 * RX, rb4 * RY, 0, 0, 6.2832); c.fill();
      c.globalAlpha = 0.4;
      c.fillStyle = "#e8fbff";
      c.beginPath();
      c.ellipse(pb4.x - rb4 * 6, pb4.y - rb4 * 3, rb4 * 7, rb4 * 2.2, -0.3, 0, 6.2832);
      c.fill();
      c.globalAlpha = 1;
    }

    /* --- 6. L'OR GRAVÉ. Des étoiles et des croissants tracés à même
       la pierre, très fins, très dispersés. C'est ce qu'on découvre en
       zoomant, et c'est pour ça qu'il y en a beaucoup et qu'ils sont
       petits : de loin ils ne font qu'un chatoiement. */
    c.save();
    c.globalCompositeOperation = "lighter";
    for(i = 0; i < 340; i++){
      var sx4 = LARGEUR_ROCHE + al() * (PLAGE_X0 - LARGEUR_ROCHE + 6);
      var sy4 = al() * GH;
      var ps4 = iso(sx4, sy4);
      var tl4 = 3 + al() * 5;
      c.globalAlpha = 0.18 + al() * 0.3;
      if(al() < 0.34){
        /* le croissant : deux arcs, l'un mordant l'autre */
        c.strokeStyle = "rgba(226,196,120,.9)";
        c.lineWidth = 1.3;
        c.beginPath();
        c.arc(ps4.x, ps4.y, tl4, 0.7, 5.0);
        c.stroke();
      }else{
        /* l'étoile à quatre branches, en losange étiré : c'est la
           forme la moins chère qui se lise comme une étoile */
        c.fillStyle = "rgba(240,222,160,.9)";
        c.beginPath();
        c.moveTo(ps4.x, ps4.y - tl4);
        c.lineTo(ps4.x + tl4 * 0.34, ps4.y);
        c.lineTo(ps4.x, ps4.y + tl4);
        c.lineTo(ps4.x - tl4 * 0.34, ps4.y);
        c.closePath(); c.fill();
        c.beginPath();
        c.moveTo(ps4.x - tl4 * 1.5, ps4.y);
        c.lineTo(ps4.x, ps4.y - tl4 * 0.28);
        c.lineTo(ps4.x + tl4 * 1.5, ps4.y);
        c.lineTo(ps4.x, ps4.y + tl4 * 0.28);
        c.closePath(); c.fill();
      }
    }
    c.restore();
    c.globalAlpha = 1;
    c.restore();
  }

  if(carteC.biome === "sud"){
    /* De larges plaques de paille et d'ocre rouge, posées les
       premières : l'île entière au même beige donnait un désert, pas
       un été provençal. */
    c.save();
    for(i = 0; i < 70; i++){
      var tx2 = al() * PLAGE_X0, ty2 = al() * GH;
      var pt2 = iso(tx2, ty2);
      var rt = 150 + al() * 300;
      var gt = c.createRadialGradient(pt2.x, pt2.y, 6, pt2.x, pt2.y, rt);
      var ct = al() < 0.5 ? "#e8cf86" : "#c9a071";
      gt.addColorStop(0, rgba(ct, 0.26));
      gt.addColorStop(1, rgba(ct, 0));
      c.fillStyle = gt;
      c.beginPath(); c.ellipse(pt2.x, pt2.y, rt, rt / 2, 0, 0, 6.2832); c.fill();
    }
    c.restore();
    /* Les rangs de lavande, par parcelles : un champ qui couvrirait
       toute l'île se lirait comme une trame, pas comme un paysage.
       Le damier vaut mieux qu'un tirage libre : deux champs tirés au
       hasard finissaient par se chevaucher, et deux trames croisées
       font un tissu écossais, pas de la Provence. */
    var CX0 = LARGEUR_ROCHE + 2, CY0 = 2, CW = 25, CH = 21;
    var NCX = Math.floor((PLAGE_X0 - 5 - CX0) / CW), NCY = Math.floor((GH - 3 - CY0) / CH);
    c.save();
    c.lineCap = "butt";
    for(var cy2 = 0; cy2 < NCY; cy2++){
      for(var cx2 = 0; cx2 < NCX; cx2++){
        if(al() > 0.62) continue;                       // une parcelle sur trois reste en friche
        var qx = CX0 + cx2 * CW + 1.5, qy = CY0 + cy2 * CH + 1.5;
        var ql = CW - 3 - al() * 4, qh = CH - 3 - al() * 4;
        /* une parcelle sur deux est plantée dans l'autre sens : sans
           ça, toute l'île se lit comme un papier peint rayé */
        var travers = ((cx2 + cy2) % 2) === 1;
        var nr = travers ? ql : qh;
        for(var jr = 0.6; jr < nr; jr += 1.15){
          var r1, r2;
          if(travers){ r1 = iso(qx + jr, qy); r2 = iso(qx + jr, qy + qh); }
          else { r1 = iso(qx, qy + jr); r2 = iso(qx + ql, qy + jr); }
          /* la terre nue entre deux rangs : c'est ce blanc qui fait
             lire les rangs. Et le pointillé donne des touffes plutôt
             qu'un trait peint : un rang de lavande, ça se compte. */
          c.setLineDash([]);
          c.globalAlpha = 0.26;
          c.strokeStyle = "#f0e0b8"; c.lineWidth = 4.4;
          c.beginPath(); c.moveTo(r1.x, r1.y + 4); c.lineTo(r2.x, r2.y + 4); c.stroke();
          c.setLineDash([12, 5]);
          c.lineDashOffset = (jr * 37) % 17;
          c.globalAlpha = 0.55;
          c.strokeStyle = "#664496"; c.lineWidth = 5;
          c.beginPath(); c.moveTo(r1.x, r1.y); c.lineTo(r2.x, r2.y); c.stroke();
          c.globalAlpha = 0.34;
          c.strokeStyle = "#bb9ee8"; c.lineWidth = 1.7;
          c.beginPath(); c.moveTo(r1.x, r1.y - 2); c.lineTo(r2.x, r2.y - 2); c.stroke();
        }
        /* le chemin de terre qui borde la parcelle */
        c.setLineDash([]);
        c.globalAlpha = 0.28;
        c.strokeStyle = "#f4e8c8"; c.lineWidth = 7;
        var b1 = iso(qx - 0.9, qy - 0.9), b2 = iso(qx + ql + 0.9, qy - 0.9);
        var b3 = iso(qx + ql + 0.9, qy + qh + 0.9), b4 = iso(qx - 0.9, qy + qh + 0.9);
        c.beginPath();
        c.moveTo(b1.x, b1.y); c.lineTo(b2.x, b2.y); c.lineTo(b3.x, b3.y); c.lineTo(b4.x, b4.y);
        c.closePath(); c.stroke();
      }
    }
    c.setLineDash([]);
    c.restore();
    /* affleurements de calcaire : les dalles blanches qui percent la
       garrigue, et qui cassent l'ocre uniforme */
    c.save();
    for(i = 0; i < 420; i++){
      var kx = al() * PLAGE_X0, ky = al() * GH;
      var pk = iso(kx, ky);
      c.globalAlpha = 0.18 + al() * 0.16;
      c.fillStyle = al() < 0.5 ? "#f4eddc" : "#e2d8c2";
      c.beginPath(); c.ellipse(pk.x, pk.y, 8 + al() * 22, 4 + al() * 10, al() * 3, 0, 6.2832); c.fill();
      c.globalAlpha = 0.12;
      c.fillStyle = "#9a8a6c";
      c.beginPath(); c.ellipse(pk.x + 2, pk.y + 3, 7 + al() * 16, 3 + al() * 7, 0, 0, 6.2832); c.fill();
    }
    c.restore();
    /* terre craquelée entre les parcelles */
    c.save();
    c.globalAlpha = 0.2; c.strokeStyle = "#a2895c"; c.lineWidth = 1.2;
    for(i = 0; i < 900; i++){
      var fx2 = al() * PLAGE_X0, fy2 = al() * GH;
      if(matiereCase(fx2 | 0, fy2 | 0, gr).herbe > 0.4) continue;
      var pf = iso(fx2, fy2);
      c.beginPath();
      c.moveTo(pf.x, pf.y);
      for(var kf = 0; kf < 3; kf++){
        c.lineTo(pf.x + (al() - 0.5) * 26, pf.y + (al() - 0.5) * 13);
      }
      c.stroke();
    }
    c.restore();
    /* touffes de garrigue : petits coussins argentés, très éparpillés */
    c.save();
    c.globalAlpha = 0.26;
    for(i = 0; i < 2000; i++){
      var bx2 = al() * PLAGE_X0, by2 = al() * GH;
      var pb = iso(bx2, by2);
      c.fillStyle = al() < 0.5 ? "#9fae7e" : "#c3cba6";
      c.beginPath(); c.ellipse(pb.x, pb.y, 5 + al() * 9, 2.4 + al() * 4, 0, 0, 6.2832); c.fill();
    }
    c.restore();
  }
  /* touffes d'herbe éparses, partout où l'herbe domine */
  c.globalAlpha = 0.4;
  for(i = 0; i < 2600; i++){
    var hx = al() * GW, hy = al() * GH;
    var mm = matiereCase(hx | 0, hy | 0, gr);
    if(mm.herbe < 0.35) continue;
    var ph = iso(hx, hy);
    c.strokeStyle = al() < 0.5 ? M.herbe1 : M.herbe2;
    c.lineWidth = 1.2;
    for(var t = 0; t < 3; t++){
      c.beginPath();
      c.moveTo(ph.x + t * 1.6 - 1.6, ph.y);
      c.lineTo(ph.x + t * 2.2 - 2.6 + al() * 2, ph.y - 4 - al() * 4);
      c.stroke();
    }
  }
  c.restore();

  /* --- le bord de mer : rides, galets, coquillages, algues --- */
  c.save();
  traceIle(c, 3, 0, 0); c.clip();
  /* rides de vent parallèles au rivage */
  c.strokeStyle = "rgba(255,248,226,.24)"; c.lineWidth = 1.7;
  for(i = 0; i < 220; i++){
    var rx = PLAGE_X0 - 4 + al() * 17, ry0 = al() * GH;
    var q1 = iso(rx, ry0), q2 = iso(rx + 0.15 + al() * 0.5, ry0 + 3 + al() * 6);
    c.beginPath();
    c.moveTo(q1.x, q1.y);
    c.quadraticCurveTo((q1.x + q2.x) / 2 + 9, (q1.y + q2.y) / 2, q2.x, q2.y);
    c.stroke();
  }
  /* laisse de mer : ligne d'algues et de débris */
  c.strokeStyle = "rgba(96,110,64,.34)"; c.lineWidth = 3.4;
  for(i = 0; i < 150; i++){
    var ly = al() * GH;
    var lx = GW - 4.4 + al() * 1.6;
    var l1 = iso(lx, ly), l2 = iso(lx + 0.1, ly + 1.4 + al() * 2);
    c.beginPath(); c.moveTo(l1.x, l1.y); c.lineTo(l2.x, l2.y); c.stroke();
  }
  /* grains, galets, coquillages */
  for(i = 0; i < 2200; i++){
    var gx2 = PLAGE_X0 - 8 + al() * 20, gy2 = al() * GH;
    var pg = iso(gx2, gy2);
    var t2 = al();
    if(t2 < 0.6){
      c.fillStyle = "rgba(146,116,72,.28)";
      c.fillRect(pg.x, pg.y, 1.7, 1.2);
    }else if(t2 < 0.88){
      c.fillStyle = "rgba(255,252,240,.5)";
      c.beginPath(); c.ellipse(pg.x, pg.y, 1.8 + al() * 1.8, 1 + al(), al() * 3, 0, 6.2832); c.fill();
    }else{
      c.fillStyle = "rgba(120,110,96,.4)";
      c.beginPath(); c.ellipse(pg.x, pg.y, 2.4 + al() * 3, 1.4 + al() * 1.6, al() * 3, 0, 6.2832); c.fill();
      c.fillStyle = "rgba(255,255,255,.18)";
      c.beginPath(); c.ellipse(pg.x - 1, pg.y - 0.8, 1.2, 0.7, 0, 0, 6.2832); c.fill();
    }
  }
  c.restore();

  /* --- éboulis au pied des falaises --- */
  c.save();
  traceIle(c, 0, 0, 0); c.clip();
  for(i = 0; i < 1400; i++){
    var ex = al() * GW, ey = al() * GH;
    if(matiereCase(ex | 0, ey | 0, gr).roche < 0.25) continue;
    var pe = iso(ex, ey);
    var tt = al();
    /* l'éboulis clair vire au basalte sur l'île de feu : mille quatre
       cents cailloux gris pâle au pied des falaises éclaircissaient
       tout le pourtour */
    c.fillStyle = (carteC.biome === "tenebres")
                ? (tt < 0.5 ? "rgba(28,22,26,.40)" : "rgba(74,62,66,.26)")
                : (tt < 0.5 ? "rgba(60,54,70,.34)" : "rgba(180,176,192,.26)");
    c.beginPath();
    c.ellipse(pe.x, pe.y, 2 + al() * 5, 1.2 + al() * 2.4, al() * 3, 0, 6.2832);
    c.fill();
  }
  c.restore();

  /* --- les falaises : elles ferment le nord, le sud et l'ouest.
         Elles sont cuites dans le sol : elles ne bougent jamais et
         aucune troupe ne peut passer devant. --- */
  var murs = (carteC.falaises || []).slice().sort(function(x, y){
    return (x.gx + x.gy) - (y.gx + y.gy);
  });
  for(i = 0; i < murs.length; i++) dessineFalaise(c, murs[i]);

  /* --- lisière ombrée le long du rivage --- */
  c.save();
  traceIle(c, 4, 0, 0); c.clip();
  c.globalAlpha = 0.22;
  c.strokeStyle = "#6b5030"; c.lineWidth = 20;
  traceIle(c, 0, 0, 0); c.stroke();
  c.restore();

  /* --- marquage de la zone de débarquement --- */
  c.save();
  c.globalAlpha = 0.14; c.fillStyle = "#ffffff";
  for(j = 8; j < GH - 8; j += 3){
    var z1 = iso(PLAGE_X0 + 1.5, j), z2 = iso(PLAGE_X0 + 1.5, j + 1.6);
    var z3 = iso(GW - 0.6, j + 1.6), z4 = iso(GW - 0.6, j);
    c.beginPath(); c.moveTo(z1.x, z1.y); c.lineTo(z2.x, z2.y); c.lineTo(z3.x, z3.y); c.lineTo(z4.x, z4.y);
    c.closePath(); c.fill();
  }
  c.restore();

  c.setTransform(1, 0, 0, 1, 0, 0);
  construitMotifEau(b);
  construitFaune(carteC.graine);
  construitIndexDecor(carteC);
}

/* ================================================================
   INDEX SPATIAL DU DÉCOR — pour n'envoyer au rendu que le visible
   ================================================================ */
var indexDecor = null, ID_PAS = 8, ID_W = 0, ID_H = 0, ID_X0 = -8, ID_Y0 = -8;
function construitIndexDecor(carteC){
  /* LES BORNES DE L'INDEX SUIVENT CE QU'IL CONTIENT.
     Elles étaient figées à huit cases autour de la grille jouable, ce
     qui suffisait tant que rien ne poussait au-delà. La forêt du
     pourtour de la jungle s'étend, elle, jusqu'à cinquante cases
     dehors : avec des bornes figées, `range` aurait entassé ses sept
     mille arbres dans la seule rangée de cases du bord — et
     `decorVisible` les aurait TOUS empilés dès que la caméra regarde
     ce bord. Exactement le contraire de ce que fait un index.
     On mesure donc l'étendue réelle avant de le construire. */
  var marge = 8;
  if(carteC.flore){
    for(var kf = 0; kf < carteC.flore.length; kf++){
      var f0 = carteC.flore[kf];
      var dx0 = Math.max(-f0.gx, f0.gx - GW, -f0.gy, f0.gy - GH);
      if(dx0 + 4 > marge) marge = Math.ceil(dx0) + 4;
    }
  }
  ID_X0 = -marge; ID_Y0 = -marge;
  ID_W = Math.ceil((GW + 2 * marge) / ID_PAS);
  ID_H = Math.ceil((GH + 2 * marge) / ID_PAS);
  indexDecor = [];
  for(var k = 0; k < ID_W * ID_H; k++) indexDecor.push([]);
  function range(gx, gy, obj){
    var cx = borne(Math.floor((gx - ID_X0) / ID_PAS), 0, ID_W - 1);
    var cy = borne(Math.floor((gy - ID_Y0) / ID_PAS), 0, ID_H - 1);
    indexDecor[cy * ID_W + cx].push(obj);
  }
  /* k vaut toujours 9 dans la pile de rendu ; tk dit de quoi il s'agit */
  carteC.decors.forEach(function(d){ range(d.gx, d.gy, { k:9, tk:0, o:d, d:d.gx + d.gy }); });
  carteC.rochers.forEach(function(r){ range(r.gx, r.gy, { k:9, tk:1, o:r, d:r.gx + r.gy }); });
  /* LA FLORE DE LA JUNGLE entre dans le MÊME index spatial que le
     décor ordinaire, et dans la même pile de profondeur. C'est ce qui
     la rend abordable : dix mille plantes ne coûtent pas plus cher que
     les cinq cents décors d'une île normale, puisque seules celles qui
     tombent dans les cases visibles sont empilées. tk vaut 2 pour
     qu'elles passent par dessineFloreMonde et non par les sprites de
     décor ordinaires. */
  if(carteC.flore) carteC.flore.forEach(function(f, i){
    /* LE NIVEAU DE DÉTAIL, décidé UNE FOIS ici et jamais recalculé.
       Deux nombres par pousse :
         `haute` — un arbre ou une liane se voit de partout, une
           fougère de trente unités ne fait plus huit pixels à l'écran
           quand on regarde l'île entière ;
         `q` — un quart tiré de son rang, 0 à 3. Il sert à ÉCLAIRCIR
           progressivement le tapis au lieu de le supprimer d'un coup :
           à mi-zoom on n'en garde qu'une sur deux, plus loin une sur
           quatre. L'œil ne voit pas la différence sur un tapis, mais
           la machine dessine deux fois moins.
       Mesuré : 12 124 objets par image à z 0,16, soit 106 ms. C'est le
       poste le plus cher de toute la carte, loin devant les défenses. */
    var haute = (f.fam === "arbre" || f.fam === "liane") ? 1 : 0;
    range(f.gx, f.gy, { k:9, tk:2, o:f, d:f.gx + f.gy, haute:haute, q:i & 3 });
  });
  construitSpritesDecor(carteC.biome);
  if(carteC.flore && carteC.flore.length && typeof construitSpritesFlore === "function")
    construitSpritesFlore();
}
/* Ajoute à la pile de rendu tout le décor visible */
function decorVisible(vue, sortie){
  if(!indexDecor) return;
  /* boîte englobante du rectangle visible, en cases */
  var c1 = deIso(vue.x0, vue.y0), c2 = deIso(vue.x1, vue.y0);
  var c3 = deIso(vue.x1, vue.y1), c4 = deIso(vue.x0, vue.y1);
  var gx0 = Math.min(c1.gx, c2.gx, c3.gx, c4.gx) - 3;
  var gx1 = Math.max(c1.gx, c2.gx, c3.gx, c4.gx) + 3;
  var gy0 = Math.min(c1.gy, c2.gy, c3.gy, c4.gy) - 3;
  var gy1 = Math.max(c1.gy, c2.gy, c3.gy, c4.gy) + 6;
  var x0 = borne(Math.floor((gx0 - ID_X0) / ID_PAS), 0, ID_W - 1);
  var x1 = borne(Math.floor((gx1 - ID_X0) / ID_PAS), 0, ID_W - 1);
  var y0 = borne(Math.floor((gy0 - ID_Y0) / ID_PAS), 0, ID_H - 1);
  var y1 = borne(Math.floor((gy1 - ID_Y0) / ID_PAS), 0, ID_H - 1);
  /* LE SEUIL DU TAPIS. Une pousse de sous-bois fait une cinquantaine
     d'unités locales : à z 0,16 elle mesure huit pixels à l'écran et
     ne raconte plus rien, mais elle coûte son blit comme les autres.
     On garde donc tout au-dessus de 0,55 — la distance à laquelle on
     joue —, la moitié entre 0,30 et 0,55, le quart entre 0,18 et 0,30,
     et plus rien en dessous, où seuls les grands arbres portent
     encore l'image. Le tirage se fait sur le quart figé à la
     construction, jamais au hasard : une pousse qui apparaîtrait et
     disparaîtrait au fil du zoom se verrait immédiatement. */
  var z = cam.z, seuil;
  if(z >= 0.55) seuil = 4;                 // tout
  else if(z >= 0.30) seuil = 2;            // une sur deux
  else if(z >= 0.18) seuil = 1;            // une sur quatre
  else seuil = 0;                          // que les arbres
  for(var j = y0; j <= y1; j++){
    for(var i = x0; i <= x1; i++){
      var t = indexDecor[j * ID_W + i];
      for(var k = 0; k < t.length; k++){
        var it = t[k];
        if(it.tk === 2 && !it.haute && it.q >= seuil) continue;
        sortie.push(it);
      }
    }
  }
}
/* ---- sprites de décor : un blit par objet, et ça reste net au zoom ---- */
var SD_ECH = 1.3, SD_W = 128, SD_H = 132, SD_OX = 64, SD_OY = 104;
var spDecor = [], spRocher = [];
function nouveauSpriteDecor(dessin){
  var cv = nouveauCanvas(SD_W * SD_ECH, SD_H * SD_ECH);
  var c = cv.getContext("2d");
  c.setTransform(SD_ECH, 0, 0, SD_ECH, SD_OX * SD_ECH, SD_OY * SD_ECH);
  dessin(c);
  return cv;
}
function construitSpritesDecor(biome){
  spDecor = []; spRocher = [];
  /* 4 formes × 3 tailles pour la végétation */
  for(var v = 0; v < 4; v++){
    for(var t = 0; t < 3; t++){
      (function(v2, t2){
        spDecor.push(nouveauSpriteDecor(function(c){
          dessineDecor(c, biome, { gx:0, gy:0, v:v2, s:0.85 + t2 * 0.22 });
        }));
      })(v, t);
    }
  }
  /* 3 teintes × 4 formes × 2 tailles pour les rochers */
  for(var w = 0; w < 3; w++){
    for(var f = 0; f < 4; f++){
      for(var g = 0; g < 2; g++){
        (function(w2, f2, g2){
          spRocher.push(nouveauSpriteDecor(function(c){
            dessineRocher(c, 0, 0, 0.36 + g2 * 0.28, f2 * 1.57 + 0.4, w2, biome);
          }));
        })(w, f, g);
      }
    }
  }
}
function dessineDecorMonde(c, it){
  /* La flore de la jungle porte son propre blit : elle a des cadres
     bien plus hauts que les 128×132 du décor ordinaire.
     Son index de sprite est résolu À LA DEMANDE, comme celui du décor
     ordinaire juste en dessous : le générateur ne connaît que la
     famille et deux tirages, parce qu'il tourne AVANT que les sprites
     existent — et qu'il doit rester du calcul pur, testable hors
     navigateur. */
  if(it.tk === 2){
    if(it.o.sp === undefined) it.o.sp = choisitFlore(it.o.fam, it.o.v);
    return dessineFloreMonde(c, it.o);
  }
  var p = versEcran(cam, it.o.gx, it.o.gy);
  var z = cam.z, cv2;
  if(it.tk === 0){
    if(it.o.sp === undefined){
      var t = it.o.s < 1.0 ? 0 : (it.o.s < 1.18 ? 1 : 2);
      it.o.sp = (it.o.v % 4) * 3 + t;
    }
    cv2 = spDecor[it.o.sp];
  }else{
    if(it.o.sp === undefined){
      var f = (Math.abs(Math.round(it.o.s * 100)) % 4);
      it.o.sp = (it.o.v % 3) * 8 + f * 2 + (it.o.r < 0.5 ? 0 : 1);
    }
    cv2 = spRocher[it.o.sp];
  }
  if(!cv2) return;
  c.drawImage(cv2, p.x - SD_OX * z, p.y - SD_OY * z, SD_W * z, SD_H * z);
}

/* ================================================================
   LA FAUNE MARINE — requins, baleines, bancs de poissons, mouettes
   ================================================================ */
var faune = [];
function construitFaune(graine){
  var al = prng(graine ^ 0x7f3a);
  faune = [];
  var rayonX = (GW + GH) * TW / 4, rayonY = (GW + GH) * TH / 4;
  function ajoute(t, kr, v, ech){
    faune.push({
      t:t, a:al() * 6.2832, rx:rayonX * kr, ry:rayonY * kr,
      v:v * (0.8 + al() * 0.5) * (al() < 0.5 ? 1 : -1),
      ech:ech * (0.85 + al() * 0.35),
      ph:al() * 6.2832, souffle:al() * 14
    });
  }
  for(var i = 0; i < 5; i++) ajoute("requin", 1.06 + al() * 0.16, 0.055, 1);
  for(var j = 0; j < 3; j++) ajoute("baleine", 1.34 + al() * 0.30, 0.020, 1);
  for(var k = 0; k < 6; k++) ajoute("banc", 1.04 + al() * 0.22, 0.075, 1);
  for(var m = 0; m < 7; m++) ajoute("mouette", 0.86 + al() * 0.5, 0.10, 1);
}
function majFaune(dt){
  for(var i = 0; i < faune.length; i++){
    var f = faune[i];
    f.a += f.v * dt * 0.12;
    if(f.t === "baleine"){
      f.souffle -= dt;
      if(f.souffle < -2.2) f.souffle = 12 + Math.random() * 16;
    }
  }
}
function posFaune(f, tps){
  var ond = Math.sin(tps * 0.5 + f.ph) * 0.045;
  var x = CENTRE_X + Math.cos(f.a) * f.rx * (1 + ond);
  var y = CENTRE_Y + Math.sin(f.a) * f.ry * (1 + ond);
  return { x:x, y:y };
}
function dessineFaune(c, tps, vue){
  for(var i = 0; i < faune.length; i++){
    var f = faune[i];
    var p = posFaune(f, tps);
    if(p.x < vue.x0 - 200 || p.x > vue.x1 + 200 || p.y < vue.y0 - 200 || p.y > vue.y1 + 200) continue;
    var p2 = posFaune({ a:f.a + 0.02 * Math.sign(f.v || 1), rx:f.rx, ry:f.ry, ph:f.ph }, tps);
    var ang = Math.atan2(p2.y - p.y, p2.x - p.x);
    c.save();
    c.translate(p.x, p.y);
    c.rotate(ang);
    if(f.t === "requin") dessineRequin(c, f, tps);
    else if(f.t === "baleine") dessineBaleine(c, f, tps);
    else if(f.t === "banc") dessineBanc(c, f, tps);
    else dessineMouette(c, f, tps);
    c.restore();
  }
}
function dessineRequin(c, f, tps){
  var s = 1.5 * f.ech;
  var q = Math.sin(tps * 3 + f.ph) * 0.22;
  c.save();
  c.scale(s, s * 0.55);
  /* remous */
  c.fillStyle = "rgba(255,255,255,.18)";
  c.beginPath(); c.ellipse(-6, 0, 26, 9, 0, 0, 6.2832); c.fill();
  /* ombre dans l'eau */
  c.fillStyle = "rgba(4,20,34,.34)";
  c.beginPath(); c.ellipse(2, 4, 20, 7, 0, 0, 6.2832); c.fill();
  /* corps */
  var g = c.createLinearGradient(0, -8, 0, 8);
  g.addColorStop(0, "#7d93a4"); g.addColorStop(0.45, "#4a6274"); g.addColorStop(1, "#2b3d4c");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(20, 0);
  c.quadraticCurveTo(6, -7.5, -12, -4);
  c.quadraticCurveTo(-18, -2, -22, -8 + q * 12);
  c.lineTo(-19, 0);
  c.lineTo(-22, 8 + q * 12);
  c.quadraticCurveTo(-18, 2, -12, 4);
  c.quadraticCurveTo(6, 7.5, 20, 0);
  c.closePath(); c.fill();
  /* nageoires latérales */
  c.fillStyle = "#3d5364";
  c.beginPath(); c.moveTo(2, 3); c.lineTo(-4, 13); c.lineTo(0, 4); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(2, -3); c.lineTo(-4, -13); c.lineTo(0, -4); c.closePath(); c.fill();
  /* ventre clair */
  c.fillStyle = "rgba(226,232,236,.5)";
  c.beginPath(); c.ellipse(4, 2.4, 12, 2.4, 0, 0, 6.2832); c.fill();
  c.restore();
  /* aileron dorsal qui perce la surface */
  c.save();
  c.scale(s, s * 0.55);
  c.fillStyle = "#37485a";
  c.beginPath();
  c.moveTo(0, 0); c.lineTo(-7, -1); c.lineTo(-2, -13);
  c.closePath(); c.fill();
  c.fillStyle = "rgba(255,255,255,.5)";
  c.beginPath(); c.ellipse(-3, 1, 8, 2.4, 0, 0, 6.2832); c.fill();
  c.restore();
}
function dessineBaleine(c, f, tps){
  var s = 3.4 * f.ech;
  var q = Math.sin(tps * 1.1 + f.ph) * 0.2;
  var plonge = 0.5 + 0.5 * Math.sin(tps * 0.28 + f.ph);
  c.save();
  c.globalAlpha = 0.55 + plonge * 0.45;
  c.scale(s, s * 0.55);
  /* remous */
  c.fillStyle = "rgba(255,255,255,.16)";
  c.beginPath(); c.ellipse(-4, 0, 30, 12, 0, 0, 6.2832); c.fill();
  var g = c.createLinearGradient(0, -10, 0, 10);
  g.addColorStop(0, "#5a6c86"); g.addColorStop(0.5, "#33455e"); g.addColorStop(1, "#1d2b3e");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(26, 0);
  c.quadraticCurveTo(10, -10, -10, -7);
  c.quadraticCurveTo(-20, -5, -24, -2);
  c.lineTo(-32, -11 + q * 10); c.lineTo(-27, 0); c.lineTo(-32, 11 + q * 10);
  c.lineTo(-24, 2);
  c.quadraticCurveTo(-20, 5, -10, 7);
  c.quadraticCurveTo(10, 10, 26, 0);
  c.closePath(); c.fill();
  /* sillons ventraux */
  c.strokeStyle = "rgba(200,215,230,.28)"; c.lineWidth = 0.8;
  for(var i = 0; i < 5; i++){
    c.beginPath(); c.moveTo(16 - i * 5, 2); c.lineTo(12 - i * 5, 7.5); c.stroke();
  }
  c.fillStyle = "rgba(220,230,240,.32)";
  c.beginPath(); c.ellipse(6, 4, 16, 3.2, 0, 0, 6.2832); c.fill();
  c.restore();
  /* souffle */
  if(f.souffle < 0){
    var t = -f.souffle / 2.2;
    c.save();
    c.globalAlpha = (1 - t) * 0.75;
    for(var k = 0; k < 5; k++){
      bouffee(c, 14 * s * 0.3, -20 * t * s * 0.3 - k * 6 * s * 0.2,
              (3 + t * 9 + k) * s * 0.35, 0.5, "#eef6ff");
    }
    c.restore();
  }
}
function dessineBanc(c, f, tps){
  var s = f.ech;
  c.save();
  c.globalAlpha = 0.42;
  c.scale(s, s * 0.55);
  for(var i = 0; i < 14; i++){
    var a = i * 2.399963;
    var r = 3 + 2.4 * Math.sqrt(i);
    var x = Math.cos(a) * r * 1.5, y = Math.sin(a) * r;
    var w = Math.sin(tps * 6 + i) * 1.2;
    c.fillStyle = i % 3 ? "#1d5a6e" : "#2f8ea4";
    c.beginPath(); c.ellipse(x + w, y, 3.2, 1.3, 0, 0, 6.2832); c.fill();
  }
  c.restore();
}
function dessineMouette(c, f, tps){
  var s = f.ech;
  var bat = Math.sin(tps * 7 + f.ph);
  var haut = -70 * s;
  c.save();
  /* ombre sur l'eau */
  c.globalAlpha = 0.16; c.fillStyle = "#000";
  c.beginPath(); c.ellipse(0, 0, 7 * s, 2.6 * s, 0, 0, 6.2832); c.fill();
  c.restore();
  c.save();
  c.translate(0, haut);
  c.strokeStyle = "#f4f6fa"; c.lineWidth = 2.2 * s; c.lineCap = "round";
  c.beginPath();
  c.moveTo(-9 * s, bat * 4 * s);
  c.quadraticCurveTo(0, -3 * s - bat * 2 * s, 9 * s, bat * 4 * s);
  c.stroke();
  c.fillStyle = "#e8ecf2";
  c.beginPath(); c.ellipse(0, 0, 3.4 * s, 1.8 * s, 0, 0, 6.2832); c.fill();
  c.restore();
}

/* ================================================================
   RENDU DE L'EAU
   ================================================================ */
function dessineEau(c, t, vue){
  var b = BIOMES[carte.biome];
  c.fillStyle = b.eau;
  c.fillRect(vue.x0, vue.y0, vue.x1 - vue.x0, vue.y1 - vue.y0);

  if(eauMotif1){
    /* calque de fond : grande houle, échelle 1 */
    c.save();
    var d1x = (t * 11) % 256, d1y = (t * 5.5) % 256;
    c.translate(d1x, d1y);
    c.fillStyle = eauMotif1;
    c.fillRect(vue.x0 - d1x - 40, vue.y0 - d1y - 40, vue.x1 - vue.x0 + 340, vue.y1 - vue.y0 + 340);
    c.restore();
    /* calque de détail : même tuile, mais réduite et tournée — cela casse
       complètement la régularité du motif, sans coûter une seconde tuile */
    c.save();
    c.globalAlpha = 0.5;
    var e = 0.58;
    var d2x = (-t * 17) % 256, d2y = (t * 9) % 256;
    c.scale(e, e);
    c.translate(d2x, d2y);
    c.fillStyle = eauMotif2;
    c.fillRect((vue.x0 - 400) / e - d2x, (vue.y0 - 400) / e - d2y,
               (vue.x1 - vue.x0 + 800) / e, (vue.y1 - vue.y0 + 800) / e);
    c.restore();
  }

  /* haut-fond : l'eau s'éclaircit en approchant de l'île */
  c.save();
  c.globalAlpha = 0.44;
  traceIle(c, 170, 0, 0); c.fillStyle = b.fond; c.fill();
  c.globalAlpha = 0.5;
  traceIle(c, 52, 0, 0); c.fillStyle = b.basFond; c.fill();
  c.restore();

  /* faune marine */
  dessineFaune(c, t, vue);

  /* reflets scintillants en crête de vague */
  c.save();
  c.globalCompositeOperation = "lighter";
  c.strokeStyle = "rgba(255,255,255,.22)";
  c.lineWidth = 2;
  var larg = vue.x1 - vue.x0, haut = vue.y1 - vue.y0;
  for(var i = 0; i < 40; i++){
    var fx = ((i * 137.5) % 100) / 100, fy = ((i * 71.3) % 100) / 100;
    var x = vue.x0 + fx * larg;
    var y = vue.y0 + fy * haut + Math.sin(t * 1.6 + i * 0.9) * 30;
    var vis = Math.sin(t * 2.4 + x * 0.004 + i);
    if(vis < 0.4) continue;
    c.globalAlpha = (vis - 0.4) / 0.6 * 0.85;
    c.beginPath(); c.moveTo(x - 8, y); c.lineTo(x + 8, y - 2); c.stroke();
  }
  c.restore();

  if(carte.biome === "nuits"){
    dessineMerDEncre(c, t, vue);
    /* LA LUNE ET LES FILANTES SONT DANS L'EAU, donc ici, avec la mer
       et AVANT l'île : c'est le rivage qui coupe le chemin de lune,
       exactement comme il le ferait sur une vraie plage. Les peindre
       plus tard les poserait PAR-DESSUS le sable. Voir 45-nuits-ciel.js. */
    dessineAurores(c, t, vue);
    dessineLuneNuits(c, t, vue);
    dessineFilantes(c, t, vue);
  }
}

/* ================================================================
   LA MER D'ENCRE — le ciel étoilé, vu d'en bas

   « Je ne veux pas forcément retrouver l'eau bleue classique autour de
   l'île. » La réponse la moins chère et la plus belle n'est pas une
   brume : c'est un MIROIR. La mer des mille et une nuits est presque
   noire, et ce qu'on y voit ce sont les étoiles et la lune —
   c'est-à-dire le ciel, retourné. L'île donne alors l'impression de
   flotter dans la nuit plutôt que d'être posée dans de l'eau.

   TROIS RÈGLES QUI FONT QUE ÇA MARCHE.

   1. LES ÉTOILES SONT À DEMEURE, PAS TIRÉES À CHAQUE IMAGE. Leurs
      places viennent d'une suite déterministe : un tirage par image
      ferait une neige qui grésille, jamais un reflet.
   2. ELLES SONT DANS LE REPÈRE DU MONDE, donc elles défilent quand on
      déplace la caméra — un reflet collé à l'écran serait un voile,
      pas une surface.
   3. ELLES ONDULENT. Un reflet sur de l'eau n'est pas un point : il
      s'étire et se brise. Chacune est donc une petite barre
      horizontale dont la longueur bat, et dont la hauteur oscille
      légèrement — c'est ce tremblement qui dit « c'est de l'eau ».
   ================================================================ */
var MER_ETOILES = null;
function construitEtoilesMer(){
  /* Un pavé de reflets que l'on répète : la mer est immense et l'on
     n'en voit qu'un morceau, donc on sème dans une tuile de monde et
     l'on ne dessine que les tuiles visibles. Quatre-vingts reflets par
     tuile suffisent — au-delà, la mer scintille comme un écran
     défectueux. */
  var al = prng(0x51DE), o = [];
  for(var i = 0; i < 80; i++){
    o.push({
      x:al() * MER_TUILE, y:al() * MER_TUILE,
      /* les grosses sont rares : c'est ce qui donne une profondeur de
         champ au ciel reflété */
      r:(al() < 0.12 ? 2.1 + al() * 1.5 : 0.7 + al() * 0.9),
      ph:al() * 6.2832,
      vit:0.5 + al() * 1.5,
      /* trois teintes : blanc lunaire, or, et un bleu très pâle */
      t:al() < 0.62 ? "220,228,255" : (al() < 0.6 ? "244,214,140" : "168,214,255")
    });
  }
  return o;
}
var MER_TUILE = 900;
function dessineMerDEncre(c, t, vue){
  if(!MER_ETOILES) MER_ETOILES = construitEtoilesMer();
  var i0 = Math.floor(vue.x0 / MER_TUILE), i1 = Math.ceil(vue.x1 / MER_TUILE);
  var j0 = Math.floor(vue.y0 / MER_TUILE), j1 = Math.ceil(vue.y1 / MER_TUILE);
  /* GARDE-FOU. Très dézoomée, la vue peut couvrir des dizaines de
     tuiles ; à ce niveau les reflets font moins d'un pixel et ne se
     voient plus de toute façon. On coupe donc, au lieu de payer. */
  if((i1 - i0) * (j1 - j0) > 60) return;
  c.save();
  c.globalCompositeOperation = "lighter";
  for(var ti = i0; ti <= i1; ti++){
    for(var tj = j0; tj <= j1; tj++){
      var ox = ti * MER_TUILE, oy = tj * MER_TUILE;
      /* chaque tuile est décalée d'un demi-pas une fois sur deux :
         sinon on lit la grille */
      var dec = ((ti + tj) & 1) ? MER_TUILE * 0.37 : 0;
      for(var k = 0; k < MER_ETOILES.length; k++){
        var e = MER_ETOILES[k];
        var x = ox + e.x + dec, y = oy + e.y;
        if(x < vue.x0 - 20 || x > vue.x1 + 20 || y < vue.y0 - 20 || y > vue.y1 + 20) continue;
        /* le scintillement, et l'ondulation du reflet */
        var s = 0.55 + 0.45 * Math.sin(t * e.vit + e.ph);
        var etire = 1 + 1.8 * (0.5 + 0.5 * Math.sin(t * e.vit * 0.7 + e.ph * 1.7));
        var yy = y + Math.sin(t * 0.9 + e.ph) * 1.6;
        c.fillStyle = "rgba(" + e.t + "," + (0.18 + s * 0.5) + ")";
        c.beginPath();
        c.ellipse(x, yy, e.r * etire * 1.7, e.r * 0.55, 0, 0, 6.2832);
        c.fill();
        /* les grosses ont un halo : c'est lui qui les fait lire comme
           une lumière et non comme un grain */
        if(e.r > 2){
          var g = c.createRadialGradient(x, yy, 0, x, yy, e.r * 7);
          g.addColorStop(0, "rgba(" + e.t + "," + (0.16 * s) + ")");
          g.addColorStop(1, "rgba(" + e.t + ",0)");
          c.fillStyle = g;
          c.beginPath(); c.ellipse(x, yy, e.r * 7, e.r * 3, 0, 0, 6.2832); c.fill();
        }
      }
    }
  }
  c.restore();
}

/* Écume et lame qui lèche le rivage */
function dessineEcume(c, t){
  c.save();
  c.lineCap = "round";
  for(var k = 0; k < 3; k++){
    c.strokeStyle = "rgba(255,255,255," + (0.34 - k * 0.09) + ")";
    c.lineWidth = 6 - k * 1.4;
    traceIle(c, 5 + k * 8 + Math.sin(t * 1.7 + k) * 3.5, 0, t);
    c.stroke();
  }
  var n = cheminIle.length;
  c.strokeStyle = "rgba(255,255,255,.6)";
  c.lineWidth = 2.6;
  for(var i = 0; i < n; i += 3){
    var ph = Math.sin(t * 1.9 + i * 0.7);
    if(ph < 0.5) continue;
    var p = cheminIle[i];
    var vx = p.x - CENTRE_X, vy = (p.y - CENTRE_Y) * 2, l = Math.hypot(vx, vy) || 1;
    var d = 6 + (ph - 0.5) * 40;
    c.globalAlpha = (1 - (ph - 0.5) / 0.5) * 0.75;
    c.beginPath();
    c.ellipse(p.x + vx / l * d, p.y + vy / l * d * 0.5,
              6 + (ph - 0.5) * 20, 3 + (ph - 0.5) * 9, 0, 0.5, 2.7);
    c.stroke();
  }
  c.restore();
}

/* Lame translucide qui recouvre le bas de la plage — après le sol */
function dessineRessac(c, t){
  var b = BIOMES[carte.biome];
  var respire = Math.sin(t * 0.9) * 6;
  c.save();
  /* nappe d'eau peu profonde qui lèche le sable : anneau entre deux contours */
  c.globalAlpha = 0.40;
  c.fillStyle = b.basFond;
  traceIle(c, 10, 0, 0, false);
  traceIle(c, -13 + respire, 0, 0, true);
  c.fill("evenodd");
  c.globalAlpha = 0.26;
  c.fillStyle = b.eauC;
  traceIle(c, 5, 0, 0, false);
  traceIle(c, -5 + respire, 0, 0, true);
  c.fill("evenodd");
  /* frange d'écume à la limite de la lame */
  c.globalAlpha = 0.8;
  c.strokeStyle = "rgba(255,255,255,.85)";
  c.lineWidth = 3;
  traceIle(c, -11 + respire, 2.4, t);
  c.stroke();
  c.globalAlpha = 0.4;
  c.lineWidth = 7;
  traceIle(c, -7 + respire, 2.4, t + 1.3);
  c.stroke();
  c.restore();
}

/* Recopie du sol pré-calculé, élaguée à la vue */
function dessineSol(c, vue){
  if(!solCv) return;
  var sx = (vue.x0 - solInfo.x0) * SOL_ECH;
  var sy = (vue.y0 - solInfo.y0) * SOL_ECH;
  var sw = (vue.x1 - vue.x0) * SOL_ECH;
  var sh = (vue.y1 - vue.y0) * SOL_ECH;
  var dx = vue.x0, dy = vue.y0, dw = vue.x1 - vue.x0, dh = vue.y1 - vue.y0;
  if(sx < 0){ dx -= sx / SOL_ECH; dw += sx / SOL_ECH; sw += sx; sx = 0; }
  if(sy < 0){ dy -= sy / SOL_ECH; dh += sy / SOL_ECH; sh += sy; sy = 0; }
  if(sx + sw > solCv.width){ var ex = sx + sw - solCv.width; sw -= ex; dw -= ex / SOL_ECH; }
  if(sy + sh > solCv.height){ var ey = sy + sh - solCv.height; sh -= ey; dh -= ey / SOL_ECH; }
  if(sw <= 0 || sh <= 0) return;
  c.drawImage(solCv, sx, sy, sw, sh, dx, dy, dw, dh);
}
