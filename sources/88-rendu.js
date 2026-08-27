/* ================================================================
   RENDU — élagage à la vue, tri de profondeur, effets
   ================================================================ */

var cv = null, ctx = null;
var secX = 0, secY = 0;                 // décalage de la secousse d'écran
function repereMonde(c){
  c.setTransform(dpr * cam.z, 0, 0, dpr * cam.z,
                 (secX + cam.px) * dpr, (secY + cam.py) * dpr);
}
function repereEcran(c){ c.setTransform(dpr, 0, 0, dpr, secX * dpr, secY * dpr); }
var miniCv = null, miniCtx = null, miniFond = null, miniProchain = 0;
var pile = [];

function rectVisible(m){
  m = m || 0;
  return {
    x0:(0 - cam.px) / cam.z - m, y0:(0 - cam.py) / cam.z - m,
    x1:(W - cam.px) / cam.z + m, y1:(H - cam.py) / cam.z + m
  };
}
/* Le rectangle visible touche-t-il la côte ? Quand la caméra est bien à
   l'intérieur des terres, l'île couvre tout l'écran : inutile de peindre
   la mer, l'écume et le ressac sous un sol opaque. */
function coteVisible(vue){
  var a = deIso(vue.x0, vue.y0), b = deIso(vue.x1, vue.y0);
  var c = deIso(vue.x1, vue.y1), d = deIso(vue.x0, vue.y1);
  var gx0 = Math.min(a.gx, b.gx, c.gx, d.gx), gx1 = Math.max(a.gx, b.gx, c.gx, d.gx);
  var gy0 = Math.min(a.gy, b.gy, c.gy, d.gy), gy1 = Math.max(a.gy, b.gy, c.gy, d.gy);
  return !(gx0 > 1.5 && gx1 < GW - 1.5 && gy0 > 1.5 && gy1 < GH - 1.5);
}
function visible(vue, gx, gy){
  var p = iso(gx, gy);
  return p.x > vue.x0 - 90 && p.x < vue.x1 + 90 && p.y > vue.y0 - 200 && p.y < vue.y1 + 110;
}

/* ---------------------------------------------------------------
   Effets
   --------------------------------------------------------------- */
function dessineEffet(c, e, tps){
  var t = e.age / e.duree;
  var p = versEcran(cam, e.gx, e.gy);
  var z = cam.z;
  if(e.t === "boum"){
    var r = (14 + e.r * 26) * (0.35 + t * 1.3) * z;
    c.save();
    c.globalCompositeOperation = "lighter";
    var g = c.createRadialGradient(p.x, p.y - r * 0.4, r * 0.1, p.x, p.y - r * 0.4, r);
    var a = (1 - t) * (1 - t);
    g.addColorStop(0, "rgba(255,246,214," + (0.95 * a) + ")");
    g.addColorStop(0.35, "rgba(255,160,50," + (0.8 * a) + ")");
    g.addColorStop(0.7, "rgba(220,60,20," + (0.45 * a) + ")");
    g.addColorStop(1, "rgba(120,20,10,0)");
    c.fillStyle = g;
    c.beginPath(); c.arc(p.x, p.y - r * 0.4, r, 0, 6.2832); c.fill();
    c.restore();
    /* éclats */
    var al = prng((e.gx * 977 + e.gy * 31) | 0);
    for(var i = 0; i < 7; i++){
      var ang = al() * 6.2832, dd = t * (24 + al() * 40) * z;
      c.fillStyle = "rgba(255," + (120 + al() * 100 | 0) + ",40," + (1 - t) + ")";
      c.beginPath();
      c.arc(p.x + Math.cos(ang) * dd, p.y - r * 0.35 + Math.sin(ang) * dd * 0.5 - t * 14 * z,
            (2.4 + al() * 2) * z * (1 - t * 0.6), 0, 6.2832);
      c.fill();
    }
    /* fumée qui reste */
    bouffee(c, p.x, p.y - (10 + t * 26) * z, (8 + t * 18) * z, (1 - t) * 0.34, "#3a3238");
  }else if(e.t === "recolte"){
    /* éclat doré qui monte : on vient d'engranger de l'Énergie */
    c.save();
    c.globalCompositeOperation = "lighter";
    var ar = (1 - t) * (1 - t);
    var yr = p.y - 14 * z - t * 30 * z;
    var gr2 = c.createRadialGradient(p.x, yr, 0.5, p.x, yr, 24 * z);
    gr2.addColorStop(0, "rgba(255,232,150," + (0.9 * ar) + ")");
    gr2.addColorStop(0.45, "rgba(255,184,70," + (0.5 * ar) + ")");
    gr2.addColorStop(1, "rgba(255,150,40,0)");
    c.fillStyle = gr2;
    c.beginPath(); c.arc(p.x, yr, 24 * z, 0, 6.2832); c.fill();
    for(var er = 0; er < 6; er++){
      var aer = er * 1.047 + t * 2.2;
      c.fillStyle = "rgba(255," + (210 + er * 6) + ",120," + ar + ")";
      c.beginPath();
      c.arc(p.x + Math.cos(aer) * (6 + t * 20) * z,
            yr + Math.sin(aer) * (3 + t * 9) * z, 2.1 * z * (1 - t * 0.5), 0, 6.2832);
      c.fill();
    }
    c.restore();
  }else if(e.t === "traceur"){
    /* ---- MITRAILLEUSE, la traçante ----
       Un trait court et vif, avec une tête lumineuse qui file le long
       du segment : c'est elle qui donne la vitesse. */
    var q3 = versEcran(cam, e.ex, e.ey);
    var av = Math.min(1, e.age / e.duree);
    c.save();
    c.globalCompositeOperation = "lighter";
    var x1 = p.x, y1 = p.y - 20 * z, x2 = q3.x, y2 = q3.y - 10 * z;
    /* la traçante ne s'affiche que sur la portion déjà parcourue */
    var xa = x1 + (x2 - x1) * Math.max(0, av - 0.45);
    var xb = x1 + (x2 - x1) * av;
    var ya = y1 + (y2 - y1) * Math.max(0, av - 0.45);
    var yb = y1 + (y2 - y1) * av;
    c.strokeStyle = e.perdue ? "rgba(255,214,150,.5)" : "rgba(255,244,206,.92)";
    c.lineWidth = (e.perdue ? 1.2 : 2.0) * Math.max(0.7, z);
    c.lineCap = "round";
    c.beginPath(); c.moveTo(xa, ya); c.lineTo(xb, yb); c.stroke();
    /* tête */
    var gt2 = c.createRadialGradient(xb, yb, 0, xb, yb, 5.5 * z);
    gt2.addColorStop(0, "rgba(255,252,226,.95)");
    gt2.addColorStop(1, "rgba(255,170,50,0)");
    c.fillStyle = gt2;
    c.beginPath(); c.arc(xb, yb, 5.5 * z, 0, 6.2832); c.fill();
    c.restore();
  }else if(e.t === "onde"){
    /* onde de choc au sol : un anneau qui s'élargit et s'efface */
    var ao = (1 - t) * (1 - t);
    c.save();
    c.globalCompositeOperation = "lighter";
    c.strokeStyle = "rgba(255,238,196," + (0.55 * ao) + ")";
    c.lineWidth = Math.max(1.4, 7 * ao * z);
    c.beginPath();
    c.ellipse(p.x, p.y, e.r * 26 * t * z, e.r * 13 * t * z, 0, 0, 6.2832);
    c.stroke();
    c.restore();
    /* poussière soulevée par l'anneau */
    c.save();
    c.globalAlpha = ao * 0.22;
    c.fillStyle = "#d8c9a4";
    for(var no = 0; no < 8; no++){
      var ano = no / 8 * 6.2832;
      c.beginPath();
      c.ellipse(p.x + Math.cos(ano) * e.r * 24 * t * z,
                p.y + Math.sin(ano) * e.r * 12 * t * z - t * 6 * z,
                (3 + t * 9) * z, (1.6 + t * 4) * z, 0, 0, 6.2832);
      c.fill();
    }
    c.restore();
  }else if(e.t === "impact"){
    /* ---- MITRAILLEUSE, l'impact au sol ----
       Ce sont EUX qui font comprendre quelle zone est arrosée. Une
       gerbe de sable, quelques éclats, et un petit cratère clair. */
    var ai = 1 - t;
    c.save();
    /* gerbe */
    c.globalAlpha = ai * 0.5;
    c.fillStyle = "#e2d3ac";
    c.beginPath();
    c.ellipse(p.x, p.y - 3 * z - t * 7 * z, (2.6 + t * 8) * z, (1.4 + t * 4) * z, 0, 0, 6.2832);
    c.fill();
    /* éclats projetés, en étoile stable (graine sur la position) */
    var ali = prng(((e.gx * 733 + e.gy * 191) | 0) || 7);
    c.globalAlpha = ai;
    c.fillStyle = "#c9b78e";
    for(var ei = 0; ei < 5; ei++){
      var aei = ali() * 6.2832, dei = t * (5 + ali() * 11) * z;
      c.beginPath();
      c.arc(p.x + Math.cos(aei) * dei, p.y - 2 * z + Math.sin(aei) * dei * 0.5 - t * 9 * z,
            1.15 * z * (1 - t * 0.6), 0, 6.2832);
      c.fill();
    }
    /* petite marque au sol qui reste un instant */
    c.globalAlpha = ai * 0.28;
    c.fillStyle = "#7a6a4c";
    c.beginPath(); c.ellipse(p.x, p.y, 2.6 * z, 1.3 * z, 0, 0, 6.2832); c.fill();
    c.restore();
  }else if(e.t === "poussiere"){
    c.save();
    c.globalAlpha = (1 - t) * 0.55;
    c.fillStyle = "#d8c9a4";
    c.beginPath(); c.ellipse(p.x, p.y - 3 * z, (4 + t * 9) * z, (2 + t * 4) * z, 0, 0, 6.2832); c.fill();
    c.restore();
  }else if(e.t === "cone"){
    /* ---- LANCE-FLAMMES ----
       Un jet continu, pas une bouffée : trois nappes superposées qui
       ondulent le long de l'axe, du blanc-jaune au cœur jusqu'au rouge
       sombre aux bords, une trace de chaleur au sol, et de la fumée qui
       se détache en bout de course. La turbulence est pilotée par le
       temps global — donc fluide d'une image à l'autre, contrairement
       à un Math.random() qui grésille. */
    var NAPPES = [
      { c1:"#c0210a", c2:"#ff4a0e", l:1.00, w:1.00, a:0.50, v:0.0 },
      { c1:"#ff7a12", c2:"#ffb43a", l:0.86, w:0.66, a:0.62, v:1.7 },
      { c1:"#ffd76a", c2:"#fff6d0", l:0.62, w:0.34, a:0.70, v:3.4 }
    ];
    var puls = 1 - t * 0.25;                       // il retombe en fin de bouffée
    c.save();
    c.globalCompositeOperation = "lighter";
    for(var nn = 0; nn < NAPPES.length; nn++){
      var N = NAPPES[nn];
      var pas = 9;
      c.beginPath();
      /* bord supérieur, puis bord inférieur en sens inverse */
      for(var cote = 0; cote < 2; cote++){
        for(var kk = 0; kk <= pas; kk++){
          var q = cote ? (1 - kk / pas) : (kk / pas);
          var dq = e.portee * N.l * q * puls;
          /* l'axe serpente doucement */
          var lacet = Math.sin(tps * 9 + N.v + q * 5.5) * e.ouv * 0.34 * q;
          var aq = e.ang + lacet;
          /* largeur : pincée à la buse, évasée au bout, qui bat */
          var demi = e.ouv * dq * N.w *
                     (0.34 + q * 0.85) * (0.9 + Math.sin(tps * 13 + q * 7 + N.v) * 0.14);
          var sgn = cote ? -1 : 1;
          var pp2 = versEcran(cam, e.gx + Math.cos(aq) * dq, e.gy + Math.sin(aq) * dq);
          /* on écarte perpendiculairement, à l'écran */
          var per = vecteurEcran(aq + 1.5708);
          var xx2 = pp2.x + per.x * demi * 26 * z * sgn;
          var yy2 = pp2.y + per.y * demi * 26 * z * sgn - (13 + q * 9) * z;
          if(cote === 0 && kk === 0) c.moveTo(xx2, yy2); else c.lineTo(xx2, yy2);
        }
      }
      c.closePath();
      var pf = versEcran(cam, e.gx, e.gy);
      var pl = versEcran(cam, e.gx + Math.cos(e.ang) * e.portee, e.gy + Math.sin(e.ang) * e.portee);
      var gn2 = c.createLinearGradient(pf.x, pf.y, pl.x, pl.y);
      gn2.addColorStop(0, rgba(N.c2, N.a * (1 - t * 0.4)));
      gn2.addColorStop(0.45, rgba(N.c1, N.a * 0.9 * (1 - t * 0.4)));
      gn2.addColorStop(1, rgba(N.c1, 0));
      c.fillStyle = gn2;
      c.fill();
    }
    c.restore();

    /* fumée qui se détache au bout du jet */
    for(var fz = 0; fz < 4; fz++){
      var qf = 0.72 + fz * 0.11;
      var pf2 = versEcran(cam, e.gx + Math.cos(e.ang) * e.portee * qf,
                               e.gy + Math.sin(e.ang) * e.portee * qf);
      bouffee(c, pf2.x + Math.sin(tps * 3 + fz) * 5 * z,
              pf2.y - (24 + fz * 11) * z - t * 22 * z,
              (5 + fz * 4) * z, (1 - t) * 0.17, "#584c50");
    }

    /* braise au sol sous le jet : on voit ce qui brûle */
    for(var gz = 1; gz <= 5; gz++){
      var qg2 = gz / 5;
      var pg2 = versEcran(cam, e.gx + Math.cos(e.ang) * e.portee * qg2,
                               e.gy + Math.sin(e.ang) * e.portee * qg2);
      lueur(c, pg2.x, pg2.y, e.portee * (5 + qg2 * 9) * z, "#ff6a14", 0.10 * (1 - t));
    }

    /* escarbilles emportées par le jet : de petites particules vives
       qui filent dans l'axe, montent, et s'éteignent en bout de course */
    c.save();
    c.globalCompositeOperation = "lighter";
    for(var ez = 0; ez < 7; ez++){
      var qe = ((tps * 1.9 + ez * 0.143) % 1);
      var lacetE = Math.sin(tps * 7 + ez * 2.2) * e.ouv * 0.4 * qe;
      var pe2 = versEcran(cam, e.gx + Math.cos(e.ang + lacetE) * e.portee * qe,
                               e.gy + Math.sin(e.ang + lacetE) * e.portee * qe);
      c.fillStyle = "rgba(255," + (220 - (qe * 140) | 0) + ",90," + ((1 - qe) * 0.85) + ")";
      c.beginPath();
      c.arc(pe2.x, pe2.y - (12 + qe * 26 + Math.sin(ez * 9.1) * 6) * z,
            (1.6 - qe * 0.9) * z, 0, 6.2832);
      c.fill();
    }
    c.restore();
  }else if(e.t === "souffle"){
    /* Souffle de départ d'une roquette : un éclair vers l'ARRIÈRE de la
       rampe (les gaz s'échappent à l'opposé du tir), un panache qui
       s'élève, et de la poussière chassée au sol de part et d'autre. */
    var d = vecteurEcran(e.ang);
    if(t < 0.4){
      c.save();
      c.globalCompositeOperation = "lighter";
      c.fillStyle = "rgba(255,196,110," + ((1 - t / 0.4) * 0.7) + ")";
      c.beginPath();
      c.moveTo(p.x - d.x * 8 * z, p.y - 30 * z - d.y * 8 * z);
      c.lineTo(p.x - d.x * (30 + t * 40) * z - d.y * 9 * z, p.y - 22 * z - d.y * 26 * z + d.x * 9 * z);
      c.lineTo(p.x - d.x * (30 + t * 40) * z + d.y * 9 * z, p.y - 22 * z - d.y * 26 * z - d.x * 9 * z);
      c.closePath(); c.fill();
      c.restore();
    }
    for(var s = 0; s < 5; s++){
      bouffeeFloue(c, p.x - d.x * (8 + s * 10 + t * 34) * z,
                   p.y - (24 + s * 5 + t * 26) * z - d.y * (8 + s * 8) * z,
                   (5 + s * 2.6 + t * 12) * z, (1 - t) * 0.4, "188,182,176", 0.85);
    }
    /* poussière chassée au ras du sol, perpendiculairement à la rampe */
    for(var s2 = -1; s2 <= 1; s2 += 2){
      bouffeeFloue(c, p.x + d.y * s2 * (14 + t * 30) * z, p.y - 4 * z - d.x * s2 * 4 * z,
                   (7 + t * 10) * z, (1 - t) * 0.30, "205,192,168", 0.5);
    }
  }else if(e.t === "eclair"){
    /* ---- ÉLECTROBOMBE, l'impact ----
       Un dôme d'énergie qui se déploie d'un coup et se dissipe, une
       onde au sol, des arcs qui montent du point d'impact, et des
       ramifications qui courent sur le sable. On ne peut pas la
       confondre avec autre chose. */
    var re = e.r * 26 * z;                       // rayon écran de l'effet
    var ouvre = Math.min(1, t / 0.16);           // le dôme jaillit très vite
    var fane = Math.max(0, 1 - Math.max(0, t - 0.16) / 0.84);
    var rd = re * (0.25 + ouvre * 0.9);

    /* flash blanc au tout premier instant */
    if(t < 0.10){
      c.save();
      c.globalCompositeOperation = "lighter";
      var gfl = c.createRadialGradient(p.x, p.y - 14 * z, 0, p.x, p.y - 14 * z, re * 1.5);
      gfl.addColorStop(0, "rgba(244,254,255," + (0.9 * (1 - t / 0.10)) + ")");
      gfl.addColorStop(1, "rgba(140,220,255,0)");
      c.fillStyle = gfl;
      c.beginPath(); c.arc(p.x, p.y - 14 * z, re * 1.5, 0, 6.2832); c.fill();
      c.restore();
    }

    /* onde de choc au sol */
    c.save();
    c.globalCompositeOperation = "lighter";
    c.strokeStyle = "rgba(150,238,255," + (0.65 * fane) + ")";
    c.lineWidth = Math.max(1.4, 5 * fane * z);
    c.beginPath();
    c.ellipse(p.x, p.y, rd * 1.25, rd * 0.62, 0, 0, 6.2832);
    c.stroke();

    /* LE DÔME : deux calottes concentriques, remplies puis cerclées */
    var gd = c.createRadialGradient(p.x, p.y - rd * 0.30, rd * 0.10,
                                    p.x, p.y - rd * 0.30, rd);
    gd.addColorStop(0.00, "rgba(226,252,255," + (0.30 * fane) + ")");
    gd.addColorStop(0.62, "rgba(110,214,255," + (0.20 * fane) + ")");
    gd.addColorStop(0.93, "rgba(90,180,255," + (0.42 * fane) + ")");
    gd.addColorStop(1.00, "rgba(70,150,230,0)");
    c.fillStyle = gd;
    c.beginPath();
    c.ellipse(p.x, p.y, rd, rd * 0.95, 0, Math.PI, 0);
    c.ellipse(p.x, p.y, rd, rd * 0.42, 0, 0, Math.PI);
    c.closePath(); c.fill();
    c.strokeStyle = "rgba(198,248,255," + (0.70 * fane) + ")";
    c.lineWidth = Math.max(1.2, 2.6 * z);
    c.beginPath();
    c.ellipse(p.x, p.y, rd, rd * 0.95, 0, Math.PI, 0);
    c.stroke();
    /* méridiens : ils donnent au dôme son volume */
    for(var md = 0; md < 5; md++){
      var fm = (md / 4) * 2 - 1;
      c.strokeStyle = "rgba(170,240,255," + (0.26 * fane) + ")";
      c.lineWidth = Math.max(0.8, 1.4 * z);
      c.beginPath();
      c.ellipse(p.x, p.y, Math.abs(fm) * rd, rd * 0.95, 0, Math.PI, 0);
      c.stroke();
    }

    /* arcs qui jaillissent du point d'impact vers le haut du dôme */
    var ale = prng(((e.gx * 419 + e.gy * 877) | 0) || 3);
    c.strokeStyle = "rgba(226,252,255," + (0.85 * fane) + ")";
    c.lineWidth = Math.max(1, 2.1 * z);
    c.lineCap = "round";
    for(var na = 0; na < 7; na++){
      var aa2 = ale() * 6.2832;
      c.beginPath();
      c.moveTo(p.x, p.y - 4 * z);
      var xe2 = p.x, ye2 = p.y - 4 * z;
      for(var ke = 1; ke <= 4; ke++){
        var fe2 = ke / 4;
        xe2 = p.x + Math.cos(aa2) * rd * fe2 * (0.85 + ale() * 0.3);
        ye2 = p.y - rd * 0.9 * fe2 * fe2 + Math.sin(aa2) * rd * 0.4 * fe2;
        c.lineTo(xe2, ye2);
      }
      c.stroke();
    }

    /* ramifications au sol : elles courent en rampant */
    c.strokeStyle = "rgba(140,226,255," + (0.55 * fane) + ")";
    c.lineWidth = Math.max(0.9, 1.7 * z);
    for(var nr = 0; nr < 9; nr++){
      var ar2 = (nr / 9) * 6.2832 + ale() * 0.4;
      var xr = p.x, yr = p.y;
      c.beginPath(); c.moveTo(xr, yr);
      for(var kr = 1; kr <= 4; kr++){
        var lr = rd * 1.25 * (kr / 4) * ouvre;
        var jr = (ale() - 0.5) * 0.5;
        xr = p.x + Math.cos(ar2 + jr) * lr;
        yr = p.y + Math.sin(ar2 + jr) * lr * 0.5;
        c.lineTo(xr, yr);
      }
      c.stroke();
    }
    c.restore();
    lueur(c, p.x, p.y - 10 * z, rd * 1.4, "#7de6ff", 0.34 * fane);
  }else if(e.t === "coup"){
    c.save();
    c.globalAlpha = 1 - t;
    c.strokeStyle = "#fff6e0"; c.lineWidth = 2.2 * z;
    for(var g2 = 0; g2 < 3; g2++){
      var ag = g2 * 2.1 + t * 2;
      c.beginPath();
      c.moveTo(p.x + Math.cos(ag) * 5 * z, p.y - 14 * z + Math.sin(ag) * 4 * z);
      c.lineTo(p.x + Math.cos(ag) * (11 + t * 8) * z, p.y - 14 * z + Math.sin(ag) * (8 + t * 5) * z);
      c.stroke();
    }
    c.restore();
  }else if(e.t === "piqure"){
    c.save();
    c.globalAlpha = 1 - t;
    c.fillStyle = "#ffe08a";
    c.beginPath(); c.arc(p.x, p.y - 14 * z, 3 * z, 0, 6.2832); c.fill();
    c.restore();
  }else if(e.t === "crachat"){
    var q2 = versEcran(cam, e.ex, e.ey);
    c.save();
    c.globalAlpha = 1 - t;
    c.strokeStyle = "#8ec63f"; c.lineWidth = 3 * z; c.lineCap = "round";
    c.beginPath();
    c.moveTo(p.x, p.y - 12 * z);
    c.quadraticCurveTo((p.x + q2.x) / 2, Math.min(p.y, q2.y) - 40 * z, q2.x, q2.y);
    c.stroke();
    c.restore();
  }else if(e.t === "drapeau"){
    var h = 26 * z;
    c.strokeStyle = "#e8e0d0"; c.lineWidth = 2 * z;
    c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x, p.y - h); c.stroke();
    c.fillStyle = "#ff8a1e";
    c.beginPath();
    c.moveTo(p.x, p.y - h);
    c.lineTo(p.x + 15 * z + Math.sin(tps * 5) * 2 * z, p.y - h + 5 * z);
    c.lineTo(p.x, p.y - h + 10 * z);
    c.closePath(); c.fill();
    c.save(); c.globalAlpha = 0.3 * (1 - t);
    c.strokeStyle = "#ff8a1e"; c.lineWidth = 2 * z;
    c.beginPath(); c.ellipse(p.x, p.y, (10 + t * 40) * z, (5 + t * 20) * z, 0, 0, 6.2832); c.stroke();
    c.restore();
  }else if(e.t === "mort" || e.t === "mortCre"){
    c.save();
    c.globalAlpha = 1 - t;
    c.fillStyle = e.t === "mort" ? "rgba(220,80,60,.6)" : "rgba(200,120,220,.6)";
    c.beginPath(); c.ellipse(p.x, p.y - 8 * z, (7 + t * 12) * z, (4 + t * 6) * z, 0, 0, 6.2832); c.fill();
    for(var d3 = 0; d3 < 5; d3++){
      var a3 = d3 * 1.4 + 0.4;
      c.beginPath();
      c.arc(p.x + Math.cos(a3) * t * 18 * z, p.y - 12 * z + Math.sin(a3) * t * 10 * z - t * 8 * z,
            2.2 * z * (1 - t), 0, 6.2832);
      c.fill();
    }
    c.restore();
  }else if(e.t === "frappe"){
    c.save();
    c.globalAlpha = 1 - t;
    c.strokeStyle = "#ffd070"; c.lineWidth = 2.4 * z;
    c.beginPath(); c.ellipse(p.x, p.y, (60 - t * 45) * z, (30 - t * 22) * z, 0, 0, 6.2832); c.stroke();
    c.restore();
  }else if(e.t === "cryo"){
    c.save();
    c.globalAlpha = 1 - t;
    c.strokeStyle = "#d8f4ff"; c.lineWidth = 3 * z;
    c.beginPath();
    c.ellipse(p.x, p.y, e.r * RX * z * (0.3 + t * 0.8), e.r * RY * z * (0.3 + t * 0.8), 0, 0, 6.2832);
    c.stroke();
    c.restore();
  }else if(e.t === "caisse"){
    c.save();
    c.globalAlpha = 1 - t;
    c.fillStyle = "#a5854e";
    c.fillRect(p.x - 9 * z, p.y - (10 + t * 20) * z, 18 * z, 12 * z);
    c.fillStyle = "rgba(255,255,255,.3)";
    c.fillRect(p.x - 9 * z, p.y - (10 + t * 20) * z, 18 * z, 3 * z);
    c.restore();
  }else if(e.t === "plumes"){
    c.save();
    c.globalAlpha = 1 - t;
    c.fillStyle = "#fff8ec";
    for(var pl2 = 0; pl2 < 6; pl2++){
      var apl = pl2 * 1.05 + 0.3;
      c.save();
      c.translate(p.x + Math.cos(apl) * t * 22 * z, p.y - 10 * z + Math.sin(apl) * t * 12 * z - t * 6 * z);
      c.rotate(apl + t * 3);
      c.beginPath(); c.ellipse(0, 0, 3.4 * z, 1.4 * z, 0, 0, 6.2832); c.fill();
      c.restore();
    }
    c.restore();
  }else if(e.t === "nova"){
    /* ================================================================
       LA NOVA — LE CHAMPIGNON, ET LES ANNEAUX QUI S'EN DÉGAGENT.

       Le joueur voulait « le champignon, plus de l'anneau autour ». Il
       y en a trois maintenant, et chacun raconte autre chose :

         1. L'ANNEAU DE CONDENSATION, celui qu'on voit sur les vraies
            images d'essais nucléaires. L'onde de choc détend l'air, la
            vapeur d'eau y condense un instant, et il en sort un tore
            blanc qui enfle autour de la boule de feu puis s'évapore.
            C'est LUI la plus belle image d'une explosion, et il ne
            coûte qu'une ellipse.
         2. LES DEUX ANNEAUX DE SOUFFLE AU SOL, échelonnés : le premier
            file, le second le suit de loin, plus large et plus pâle.
            Un seul anneau se lit comme un cercle qu'on dessine ; deux
            décalés se lisent comme une onde qui se propage.
         3. LA COLLERETTE, au pied du chapeau, qui monte AVEC lui. Sur
            un champignon réel c'est la couche d'air humide entraînée
            par la colonne. Sans elle, la tête flotte au-dessus du
            pied ; avec elle, les deux ne font qu'un objet.

       Toute la dépense reste en ellipses et en bouffées pré-existantes :
       une Nova par vie, quatre secondes, quelques dizaines de tracés.
       ================================================================ */
    var a2 = 1 - t;
    var sup = e.sup ? 1 : 0;
    c.save();
    /* flash — plus long et plus large quand c'est une super Nova */
    var dFlash = sup ? 0.24 : 0.16;
    if(t < dFlash){
      c.fillStyle = "rgba(255,255,245," + (1 - t / dFlash) * (sup ? 0.96 : 0.9) + ")";
      c.fillRect(-W, -H, W * 3, H * 3);
    }
    c.globalCompositeOperation = "lighter";
    /* boule de feu */
    var rb = e.r * RX * z * (0.4 + Math.min(1, t * 3) * 1.5);
    var gb2 = c.createRadialGradient(p.x, p.y - rb * 0.45, rb * 0.08, p.x, p.y - rb * 0.45, rb);
    gb2.addColorStop(0, "rgba(255,255,235," + (0.95 * a2) + ")");
    /* la super Nova a un cœur plus BLEU : c'est ce qui dit, sans un
       mot, que ce n'est plus la même arme */
    gb2.addColorStop(0.28, sup ? "rgba(198,226,255," + (0.88 * a2) + ")"
                               : "rgba(255,196,80," + (0.85 * a2) + ")");
    gb2.addColorStop(0.62, "rgba(238,86,24," + (0.5 * a2) + ")");
    gb2.addColorStop(1, "rgba(120,20,8,0)");
    c.fillStyle = gb2;
    c.beginPath(); c.arc(p.x, p.y - rb * 0.45, rb, 0, 6.2832); c.fill();

    /* ---- 1. L'ANNEAU DE CONDENSATION ----
       Il naît à la taille de la boule de feu, la double en une demi-
       seconde et s'efface. Il est peint en ROND et non en ellipse
       écrasée : c'est un objet vertical dans l'air, pas une marque au
       sol — et c'est ce contraste avec les anneaux du sol qui donne du
       volume à l'ensemble. */
    var tw = t / 0.42;
    if(tw < 1){
      var rw = rb * (1.0 + tw * 1.35);
      var aw = (1 - tw) * (1 - tw) * 0.55;
      c.strokeStyle = "rgba(226,240,255," + aw + ")";
      c.lineWidth = Math.max(1.5, rb * 0.16 * (1 - tw * 0.5));
      c.beginPath();
      c.ellipse(p.x, p.y - rb * 0.45, rw, rw * 0.82, 0, 0, 6.2832);
      c.stroke();
      /* un second liseré, plus fin et plus froid, juste derrière */
      c.strokeStyle = "rgba(180,214,255," + (aw * 0.5) + ")";
      c.lineWidth = Math.max(1, rb * 0.06);
      c.beginPath();
      c.ellipse(p.x, p.y - rb * 0.45, rw * 1.14, rw * 0.94, 0, 0, 6.2832);
      c.stroke();
    }

    /* ---- 2. LES DEUX ANNEAUX DE SOUFFLE AU SOL ---- */
    var rr2 = e.r * RX * z * (0.5 + t * 3.2);
    c.strokeStyle = "rgba(255,236,190," + (0.55 * a2) + ")";
    c.lineWidth = (10 - t * 8) * z;
    c.beginPath(); c.ellipse(p.x, p.y, rr2, rr2 / 2, 0, 0, 6.2832); c.stroke();
    /* le second part plus tard, va plus loin, et s'éteint plus vite :
       c'est le décalage entre les deux qui fait la propagation */
    var t2b = t - 0.14;
    if(t2b > 0){
      var rr3 = e.r * RX * z * (0.5 + t2b * 4.4);
      c.strokeStyle = "rgba(255,214,150," + (0.30 * (1 - t2b) * (1 - t2b)) + ")";
      c.lineWidth = Math.max(1, (6 - t2b * 5) * z);
      c.beginPath(); c.ellipse(p.x, p.y, rr3, rr3 / 2, 0, 0, 6.2832); c.stroke();
    }
    c.restore();

    /* ---- 3. LE CHAMPIGNON, ET SA COLLERETTE ---- */
    c.save();
    c.globalAlpha = Math.min(1, a2 * 1.4);
    var mt = Math.min(1, t * 1.5);
    var yc = p.y - (24 + mt * 150) * z;
    for(var s2 = 0; s2 < 7; s2++){
      bouffee(c, p.x + Math.sin(s2 * 1.7 + t * 3) * 8 * z,
              p.y - (14 + s2 * 18 * mt) * z, (9 + s2 * 2) * z * (0.5 + mt), 0.45, "#6a5a52");
    }
    for(var h2 = 0; h2 < 9; h2++){
      var ah = h2 / 9 * 6.2832;
      bouffee(c, p.x + Math.cos(ah) * (14 + mt * 46) * z, yc + Math.sin(ah) * (7 + mt * 16) * z,
              (16 + mt * 20) * z, 0.42, h2 % 2 ? "#7a6258" : "#94786a");
    }
    bouffee(c, p.x, yc - 8 * z, (22 + mt * 34) * z, 0.5, "#8a7264");
    c.restore();
    /* la collerette : un anneau clair au pied du chapeau, qui monte
       avec lui. Additive et discrète — c'est un liant, pas un effet. */
    if(mt > 0.12){
      c.save();
      c.globalCompositeOperation = "lighter";
      var rcol = (30 + mt * 52) * z;
      c.strokeStyle = "rgba(255,232,196," + (0.30 * a2 * mt) + ")";
      c.lineWidth = Math.max(1.2, 5 * z * (1 - mt * 0.4));
      c.beginPath();
      c.ellipse(p.x, yc + 12 * z, rcol, rcol * 0.34, 0, 0, 6.2832);
      c.stroke();
      c.restore();
    }
  }else if(e.t === "baliseLancee"){
    c.save();
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = 1 - t;
    c.fillStyle = "#ffe9a0";
    c.beginPath(); c.arc(p.x, p.y - (10 + (1 - t) * 90) * z, 4 * z, 0, 6.2832); c.fill();
    c.restore();
  }else if(e.t === "abattu"){
    /* ABATTU D'UNE BALLE. Une croix de visée qui se referme sur le
       point d'impact, puis s'efface : le langage du tireur d'élite.
       C'est court et sec — on ne fête pas un tir, on le constate. */
    var ta = t, fa = 1 - ta;
    var ya = p.y - 16 * z;
    c.save();
    c.globalCompositeOperation = "lighter";
    /* l'éclaboussure du coup, très brève */
    if(ta < 0.3){
      var ka = 1 - ta / 0.3;
      lueurRapide(c, p.x, ya, 46 * z, "#ffd9c0", 0.7 * ka);
    }
    /* la croix : quatre branches qui se resserrent */
    var ecart = (34 - ta * 22) * z;
    var lg = 13 * z * (1 - ta * 0.5);
    c.strokeStyle = "rgba(255,236,214," + (0.9 * fa) + ")";
    c.lineWidth = Math.max(1.1, 2.1 * z);
    c.lineCap = "round";
    for(var ia = 0; ia < 4; ia++){
      var aa2 = ia * 1.5708;
      var cx4 = Math.cos(aa2), sy4 = Math.sin(aa2) * 0.55;
      c.beginPath();
      c.moveTo(p.x + cx4 * ecart, ya + sy4 * ecart);
      c.lineTo(p.x + cx4 * (ecart + lg), ya + sy4 * (ecart + lg));
      c.stroke();
    }
    /* l'anneau qui s'ouvre au sol : d'où le coup venait */
    c.strokeStyle = "rgba(255,190,150," + (0.45 * fa * fa) + ")";
    c.lineWidth = Math.max(1, 2.6 * fa * z);
    c.beginPath();
    c.ellipse(p.x, p.y, (10 + ta * 40) * z, (5 + ta * 20) * z, 0, 0, 6.2832);
    c.stroke();
    c.restore();
  }else if(e.t === "hacheBoum"){
    /* ---- IMPACT DE HACHE ----
       Pas une explosion : un COUP. Un éclat blanc très bref, une gerbe
       d'esquilles qui part dans le sens du fer, et de la poussière qui
       retombe. Ce qui doit se lire, c'est la masse. */
    var th = t, fh2 = 1 - th;
    c.save();
    c.globalCompositeOperation = "lighter";
    /* l'éclat du choc, sur les deux premières dixièmes */
    if(th < 0.28){
      var kb = 1 - th / 0.28;
      var rb2 = (10 + kb * 22) * z;
      var gb2 = c.createRadialGradient(p.x, p.y - 6 * z, 1, p.x, p.y - 6 * z, rb2);
      gb2.addColorStop(0, "rgba(255,252,238," + (0.85 * kb) + ")");
      gb2.addColorStop(0.45, "rgba(255,214,150," + (0.42 * kb) + ")");
      gb2.addColorStop(1, "rgba(200,150,90,0)");
      c.fillStyle = gb2;
      c.beginPath(); c.arc(p.x, p.y - 6 * z, rb2, 0, 6.2832); c.fill();
    }
    c.restore();
    /* esquilles : des éclats sombres qui giclent et retombent */
    var alH2 = prng(((e.gx * 733 + e.gy * 197) | 0) + 5);
    c.save();
    for(var ih2 = 0; ih2 < 9; ih2++){
      var aH2 = alH2() * 6.2832;
      var vH2 = 0.5 + alH2() * 0.9;
      var dH2 = th * vH2 * 46 * z;
      var yH2 = p.y - 6 * z - Math.sin(th * Math.PI) * 22 * z * vH2 + th * th * 26 * z;
      c.globalAlpha = fh2 * 0.85;
      c.fillStyle = ih2 % 3 ? "#4a3f36" : "#7a6a58";
      c.save();
      c.translate(p.x + Math.cos(aH2) * dH2, yH2 + Math.sin(aH2) * dH2 * 0.45);
      c.rotate(aH2 + th * 9);
      c.fillRect(-1.6 * z, -0.9 * z, 3.2 * z, 1.8 * z);
      c.restore();
    }
    c.restore();
    /* poussière qui monte puis retombe */
    for(var jh = 0; jh < 3; jh++){
      bouffee(c, p.x + (jh - 1) * 7 * z, p.y - (4 + th * 15) * z,
              (5 + th * 12) * z, fh2 * 0.36, jh % 2 ? "#b9a887" : "#8d7f6a");
    }
  }else if(e.t === "cellHS"){
    /* ---- UNE CELLULE ÉLECTRIQUE LÂCHE ----
       Toute la charge qu'elle retenait part d'un coup et n'est plus
       contenue par rien : les arcs ne tournent plus sagement autour
       des bobines, ils giclent au hasard, de plus en plus faibles,
       puis la lumière s'éteint. */
    var fh = 1 - t;
    /* La cellule est le bâtiment le plus haut de l'île après le Brasier :
       une décharge calée sur la hauteur d'une tourelle ordinaire se
       perdait dans son socle. On la place à mi-mât. */
    var hh = 210 * z;
    var yh = p.y - hh * 0.55;
    c.save();
    c.globalCompositeOperation = "lighter";
    /* la décharge : un flash blanc-bleu très bref */
    if(t < 0.30){
      var kf = 1 - t / 0.30;
      var rf = 300 * z * (0.4 + kf);
      var gf2 = c.createRadialGradient(p.x, yh, 2, p.x, yh, rf);
      gf2.addColorStop(0, "rgba(250,255,255," + (0.95 * kf) + ")");
      gf2.addColorStop(0.30, "rgba(150,225,255," + (0.62 * kf) + ")");
      gf2.addColorStop(1, "rgba(60,140,230,0)");
      c.fillStyle = gf2;
      c.beginPath(); c.arc(p.x, yh, rf, 0, 6.2832); c.fill();
      /* la colonne de courant qui saute du mât : verticale, franche,
         c'est elle qu'on voit d'un bout à l'autre de l'île */
      var gc2 = c.createLinearGradient(p.x, p.y, p.x, p.y - hh * 1.5);
      gc2.addColorStop(0, "rgba(180,238,255," + (0.70 * kf) + ")");
      gc2.addColorStop(0.55, "rgba(230,250,255," + (0.55 * kf) + ")");
      gc2.addColorStop(1, "rgba(150,220,255,0)");
      c.fillStyle = gc2;
      c.fillRect(p.x - 16 * z * (0.4 + kf), p.y - hh * 1.5, 32 * z * (0.4 + kf), hh * 1.5);
      /* l'onde au sol, pour que la chute se voie de loin */
      c.strokeStyle = "rgba(160,230,255," + (0.55 * kf) + ")";
      c.lineWidth = Math.max(1.5, 7 * kf * z);
      c.beginPath();
      c.ellipse(p.x, p.y, (40 + (1 - kf) * 260) * z, (20 + (1 - kf) * 130) * z, 0, 0, 6.2832);
      c.stroke();
    }
    /* arcs incontrôlés : ils partent du fût vers le sol, au hasard,
       et se raréfient à mesure que la charge tombe */
    var alH = prng((e.gx * 613 + e.gy * 71) | 0);
    var nbH = Math.max(0, Math.round(14 * fh));
    c.lineCap = "round";
    for(var ih = 0; ih < nbH; ih++){
      var aH = alH() * 6.2832 + tps * 1.7;
      var lgH = (70 + alH() * 170) * z * (0.4 + fh);
      var x1H = p.x + Math.cos(aH) * lgH;
      var y1H = yh + Math.sin(aH) * lgH * 0.55;
      c.beginPath();
      c.moveTo(p.x, yh);
      var seg = 5;
      for(var sH = 1; sH <= seg; sH++){
        var kH = sH / seg;
        var ecH = (alH() - 0.5) * 44 * z * (1 - Math.abs(kH - 0.5) * 1.2);
        c.lineTo(p.x + (x1H - p.x) * kH - Math.sin(aH) * ecH,
                 yh + (y1H - yh) * kH + Math.cos(aH) * ecH * 0.55);
      }
      var aA = (0.35 + 0.60 * fh) * (0.5 + alH() * 0.5);
      c.strokeStyle = "rgba(60,155,255," + (aA * 0.5) + ")";
      c.lineWidth = Math.max(2, 7 * z); c.stroke();
      c.strokeStyle = "rgba(215,248,255," + aA + ")";
      c.lineWidth = Math.max(0.9, 2.2 * z); c.stroke();
    }
    /* la lumière du cœur qui meurt, en sursautant */
    var vac = fh * fh * (0.55 + 0.45 * Math.sin(tps * 41 + e.gx));
    lueurRapide(c, p.x, yh, 140 * z * (0.3 + fh), "#7fd8ff", 0.60 * vac);
    c.restore();
    /* fumée : elle, elle survit à la lumière */
    if(t > 0.25){
      var mS = (t - 0.25) / 0.75;
      for(var jS = 0; jS < 4; jS++){
        bouffee(c, p.x + Math.sin(tps * 0.8 + jS * 2) * 14 * z,
                yh - mS * 70 * z - jS * 9 * z,
                (10 + mS * 26) * z, (1 - mS) * 0.32, jS % 2 ? "#4a4a56" : "#6a6472");
      }
    }
  }else if(e.t === "coupure"){
    /* ---- LA COUPURE ----
       La dernière cellule est tombée. Tout ce qui restait de courant
       dans les câbles reflue vers le Brasier, claque une dernière fois
       sur sa coque, puis le noir. C'est le signal que la forteresse est
       enfin attaquable : ça doit se voir de partout. */
    var fc = 1 - t;
    var yc2 = p.y - 190 * z;
    c.save();
    c.globalCompositeOperation = "lighter";
    /* l'onde qui court au sol, très large : elle passe sous le joueur
       même s'il est à l'autre bout de l'île */
    var rc2 = 30 + t * 900;
    c.strokeStyle = "rgba(150,230,255," + (0.55 * fc * fc) + ")";
    c.lineWidth = Math.max(1.5, 9 * fc * z);
    c.beginPath();
    c.ellipse(p.x, p.y, rc2 * z, rc2 * 0.5 * z, 0, 0, 6.2832);
    c.stroke();
    /* le dernier crépitement sur la coque, qui s'éteint par à-coups */
    if(t < 0.6){
      var kc = 1 - t / 0.6;
      var alC = prng(9137);
      c.lineCap = "round";
      for(var ic = 0; ic < 14; ic++){
        if(alC() > 0.35 + kc * 0.65) continue;      // ça saute, ça hoquette
        var xC = p.x + (alC() - 0.5) * 420 * z;
        var yC = p.y - alC() * 340 * z;
        c.strokeStyle = "rgba(215,248,255," + (0.75 * kc) + ")";
        c.lineWidth = Math.max(1, 2.4 * z);
        c.beginPath(); c.moveTo(xC, yC);
        for(var sC = 0; sC < 3; sC++)
          c.lineTo(xC + (alC() - 0.5) * 60 * z, yC + (alC() - 0.5) * 60 * z);
        c.stroke();
      }
      lueurRapide(c, p.x, yc2, 380 * z * (0.5 + kc * 0.6), "#8fdcff", 0.34 * kc);
    }
    c.restore();
  }
}

/* Projectiles */
/* ---------------------------------------------------------------
   LA HACHE DE L'OGRE
   Une hache de guerre, pas une hachette : elle est lancée par un bras
   trois fois plus gros que celui d'une Furie et elle doit peser en
   conséquence à l'écran. Le tracé est sorti dans sa propre fonction
   parce qu'il sert deux fois — le fer lui-même, et les fantômes de la
   traînée.
   --------------------------------------------------------------- */
var HACHE_ECH = 2.72;   // 3,4 ramené à 80 % : elle mangeait l'ogre
function formeHache(c, fantome){
  /* manche : bois sombre, gros talon contrepoids */
  c.lineCap = "round";
  c.strokeStyle = "#4a3320"; c.lineWidth = 4.2;
  c.beginPath(); c.moveTo(-8, 6.2); c.lineTo(6.5, -5); c.stroke();
  c.strokeStyle = "#2b1d10"; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(-8, 6.2); c.lineTo(6.5, -5); c.stroke();
  c.fillStyle = "#3a2a18";
  c.beginPath(); c.arc(-8.6, 6.8, 2.6, 0, 6.2832); c.fill();
  /* deux viroles de fer qui tiennent le fer sur le manche */
  c.strokeStyle = "#8b8f96"; c.lineWidth = 1.1;
  c.beginPath(); c.moveTo(2.6, -1.4); c.lineTo(4.6, -2.9); c.stroke();
  c.beginPath(); c.moveTo(0.6, 0.2); c.lineTo(2.6, -1.3); c.stroke();
  /* le fer : une lame large à double biseau */
  if(fantome){
    c.fillStyle = "#c4ccd6";
  }else{
    c.fillStyle = degCache(c, "hacheFer", function(){
      var g = c.createLinearGradient(2, -14, 15, 3);
      g.addColorStop(0, "#f6f9fc");
      g.addColorStop(0.38, "#c2ccd8");
      g.addColorStop(0.74, "#8a95a2");
      g.addColorStop(1, "#4e5966");
      return g;
    });
  }
  c.beginPath();
  c.moveTo(3.4, -4.6);
  c.quadraticCurveTo(9.5, -14.5, 17.5, -5.2);   // dos de la lame
  c.quadraticCurveTo(18.4, -1.2, 16.4, 2.4);    // pointe basse
  c.quadraticCurveTo(9.2, 5.2, 2.4, 2.2);       // gorge
  c.closePath(); c.fill();
  if(fantome) return;
  c.strokeStyle = "rgba(26,34,44,.8)"; c.lineWidth = 1.1; c.stroke();
  /* tranchant : c'est ce liseré qui accroche la lumière en tournant et
     qui fait lire la rotation d'un coup d'œil */
  c.strokeStyle = "rgba(255,255,255,.92)"; c.lineWidth = 1.9;
  c.beginPath();
  c.moveTo(10.6, -12.6);
  c.quadraticCurveTo(18.4, -5.4, 15.6, 2.9);
  c.stroke();
  /* ébréchures : elle revient de la guerre, elle aussi */
  c.strokeStyle = "rgba(60,70,82,.55)"; c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(13.2, -8.4); c.lineTo(10.4, -6.2); c.stroke();
  c.beginPath(); c.moveTo(14.6, -1.2); c.lineTo(11.4, -0.4); c.stroke();
}

function dessineProjectile(c, p, tps){
  var e = versEcran(cam, p.gx, p.gy);
  var z = cam.z;
  var zz = (p.z || 0) * z;
  if(p.t === "balle"){
    /* La balle du Mirador : un trait tendu, blanc-chaud, qui file plus
       vite que l'œil. On ne dessine pas un projectile mais sa TRACE —
       à vingt-six cases par seconde, une bille serait invisible entre
       deux images. Le trait relie la position d'il y a un vingtième de
       seconde à la position courante. */
    var kb2 = Math.max(0, (p.age - 0.045) / p.duree);
    var qx2 = p.x0 + (p.but.gx - p.x0) * kb2, qy2 = p.y0 + (p.but.gy - p.y0) * kb2;
    var qz2 = p.z0 * (1 - kb2);
    var a2 = versEcran(cam, qx2, qy2);
    c.save();
    c.globalCompositeOperation = "lighter";
    c.lineCap = "round";
    c.strokeStyle = "rgba(120,180,255,.30)";
    c.lineWidth = Math.max(1.2, 3.4 * z);
    c.beginPath();
    c.moveTo(a2.x, a2.y - qz2 * z);
    c.lineTo(e.x, e.y - zz);
    c.stroke();
    c.strokeStyle = "rgba(255,250,232,.95)";
    c.lineWidth = Math.max(0.8, 1.3 * z);
    c.stroke();
    lueurRapide(c, e.x, e.y - zz, 9 * z, "#cfe4ff", 0.55);
    c.restore();
    return;
  }
  if(p.t === "hache"){
    /* ---- LA HACHE DE L'OGRE ----
       Elle tourne VRAIMENT : la rotation vient de la simulation
       (p.rot), pas d'une animation décorative, et elle est calée sur la
       durée du vol. On dessine l'ombre au sol pour que la cloche se
       lise, la traînée pour donner la vitesse, puis le fer. */
    var hx = e.x, hy = e.y - 8 * z - zz;
    /* ombre : elle se resserre quand la hache monte */
    var fo = Math.max(0.12, 1 - (p.z || 0) / 120);
    c.save();
    c.globalAlpha = 0.26 * fo;
    c.fillStyle = "#000";
    c.beginPath(); c.ellipse(e.x, e.y, 6 * fo * z, 3 * fo * z, 0, 0, 6.2832); c.fill();
    c.restore();

    /* Traînée : trois positions passées le long de la cloche, redessinées
       comme des haches fantômes et non comme des billes — trois taches
       rondes derrière une hache ressemblaient à des bulles de savon. Les
       positions sont recalculées, pas mémorisées : trois interpolations
       coûtent moins qu'un tableau d'historique par projectile. */
    c.save();
    for(var st = 3; st >= 1; st--){
      var kt = (p.age - st * 0.030) / p.duree;
      if(kt <= 0) continue;
      var qx = p.x0 + (p.but.gx - p.x0) * kt, qy = p.y0 + (p.but.gy - p.y0) * kt;
      var qz = p.z0 * (1 - kt) + p.haut * 4 * kt * (1 - kt);
      var qe = versEcran(cam, qx, qy);
      c.globalAlpha = 0.26 - st * 0.06;
      c.save();
      c.translate(qe.x, qe.y - 8 * z - qz * z);
      c.scale(z * HACHE_ECH, z * HACHE_ECH);
      c.rotate(p.rot - st * p.spin * 0.030);
      formeHache(c, 1);
      c.restore();
    }
    c.restore();

    c.save();
    c.translate(hx, hy);
    c.scale(z * HACHE_ECH, z * HACHE_ECH);
    c.rotate(p.rot);
    formeHache(c, 0);
    c.restore();
    return;
  }
  if(p.t === "roquetteJ" || p.t === "roquette"){
    var hx = e.x, hy = e.y - 18 * z - zz;

    /* --- roquette de Frelon : traînée de fumée + panache moteur --- */
    if(p.t === "roquette" && p.tr && p.tr.length >= 6){
      /* ombre au sol : elle rétrécit avec l'altitude et rend la
         trajectoire lisible même quand la roquette est haut */
      var fo = Math.max(0.10, 1 - (p.z || 0) / 130);
      c.save(); c.globalAlpha = 0.22 * fo; c.fillStyle = "#000";
      c.beginPath(); c.ellipse(e.x, e.y, 4.5 * fo * z, 2.2 * fo * z, 0, 0, 6.2832); c.fill();
      c.restore();
      /* la fumée : une bouffée sur deux points d'historique, qui
         gonfle et pâlit en vieillissant */
      var nT = p.tr.length / 3;
      for(var s5 = 0; s5 < nT - 1; s5 += 2){
        var q5 = versEcran(cam, p.tr[s5 * 3], p.tr[s5 * 3 + 1]);
        var a5 = s5 / nT;                          // 0 = le plus vieux
        bouffeeFloue(c, q5.x, q5.y - 18 * z - p.tr[s5 * 3 + 2] * z,
                     (7.5 - a5 * 4.5) * z, 0.30 * a5 + 0.10, "202,196,206", 0.9);
      }
      /* orientation VRAIE : du dernier point d'historique vers la tête,
         verticale comprise — la roquette pique du nez en descente */
      var d6 = p.tr.length - 6;
      var q6 = versEcran(cam, p.tr[d6], p.tr[d6 + 1]);
      var vx6 = hx - q6.x, vy6 = hy - (q6.y - 18 * z - p.tr[d6 + 2] * z);
      var angV = Math.atan2(vy6, vx6 || 0.001);
      c.save();
      c.translate(hx, hy);
      c.rotate(angV);
      c.scale(z, z);
      /* corps : ogive rouge, fuselage clair, ailettes */
      c.fillStyle = "#d8d4c8";
      c.beginPath();
      c.moveTo(4.5, -1.8); c.lineTo(-5.5, -1.8); c.lineTo(-5.5, 1.8); c.lineTo(4.5, 1.8);
      c.closePath(); c.fill();
      c.fillStyle = "#c0392b";
      c.beginPath(); c.moveTo(8.5, 0); c.lineTo(4.5, -1.9); c.lineTo(4.5, 1.9); c.closePath(); c.fill();
      c.fillStyle = "#8e8b83";
      c.beginPath(); c.moveTo(-5.5, -1.8); c.lineTo(-8.5, -3.4); c.lineTo(-5.5, -0.4); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(-5.5, 1.8); c.lineTo(-8.5, 3.4); c.lineTo(-5.5, 0.4); c.closePath(); c.fill();
      c.fillStyle = "rgba(255,255,255,.4)";
      c.fillRect(-5.5, -1.6, 10, 1.1);
      /* panache moteur : flamme effilée + cœur blanc */
      c.globalCompositeOperation = "lighter";
      var lf = 9 + Math.sin(tps * 40 + p.age * 60) * 2.5;
      c.fillStyle = "rgba(255,150,40,.85)";
      c.beginPath();
      c.moveTo(-5.5, -1.5); c.lineTo(-5.5 - lf, 0); c.lineTo(-5.5, 1.5);
      c.closePath(); c.fill();
      c.fillStyle = "rgba(255,240,190,.9)";
      c.beginPath();
      c.moveTo(-5.5, -0.7); c.lineTo(-5.5 - lf * 0.55, 0); c.lineTo(-5.5, 0.7);
      c.closePath(); c.fill();
      c.restore();
      /* lueur du moteur, projetée derrière la roquette */
      lueurRapide(c, hx - Math.cos(angV) * 7 * z, hy - Math.sin(angV) * 7 * z,
                  11 * z, "#ffb24a", 0.5);
      return;
    }

    /* --- roquette de Furie (roquetteJ) : rendu court et vif --- */
    var d = vecteurEcran(p.ang || 0);
    c.save();
    c.translate(hx, hy);
    c.rotate(Math.atan2(d.y, d.x));
    c.scale(z, z);
    /* la roquette du Frelon est jaune comme lui */
    c.fillStyle = p.t === "roquetteJ" ? "#e8672f" : "#c2992f";
    c.beginPath();
    c.moveTo(6, 0); c.lineTo(-4, -2.2); c.lineTo(-4, 2.2);
    c.closePath(); c.fill();
    c.fillStyle = "#f7f1e2";
    c.fillRect(-4, -1.6, 2, 3.2);
    c.restore();
    /* traînée */
    c.save();
    c.globalCompositeOperation = "lighter";
    var g = c.createRadialGradient(hx, hy, 0, hx, hy, 9 * z);
    g.addColorStop(0, "rgba(255,200,120,.7)"); g.addColorStop(1, "rgba(255,120,30,0)");
    c.fillStyle = g;
    c.beginPath(); c.arc(hx - (d ? d.x * 6 * z : 0), hy - (d ? d.y * 6 * z : 0), 9 * z, 0, 6.2832); c.fill();
    c.restore();
  }else if(p.t === "viper"){
    c.save();
    c.fillStyle = p.braise ? "#ff8a1e" : (p.allie ? "#ffd070" : "#d8b52e");
    c.beginPath(); c.ellipse(e.x, e.y - zz - 6 * z, 3 * z, 4.6 * z, 0, 0, 6.2832); c.fill();
    if(p.braise){
      c.globalCompositeOperation = "lighter";
      var g2 = c.createRadialGradient(e.x, e.y - zz - 6 * z, 0, e.x, e.y - zz - 6 * z, 14 * z);
      g2.addColorStop(0, "rgba(255,190,90,.8)"); g2.addColorStop(1, "rgba(255,80,20,0)");
      c.fillStyle = g2;
      c.beginPath(); c.arc(e.x, e.y - zz - 6 * z, 14 * z, 0, 6.2832); c.fill();
    }
    c.restore();
    /* ombre au sol */
    c.save(); c.globalAlpha = 0.22; c.fillStyle = "#000";
    c.beginPath(); c.ellipse(e.x, e.y, 4 * z, 2 * z, 0, 0, 6.2832); c.fill();
    c.restore();
  }else if(p.t === "viper" || p.t === "nova"){
    var nova = p.t === "nova";
    var hy = e.y - zz;
    /* traînée de fumée */
    c.save();
    c.globalAlpha = 0.5;
    for(var s3 = 1; s3 <= 9; s3++){
      var t3 = s3 / 9;
      var px3 = e.x + (versEcran(cam, p.x0, p.y0).x - e.x) * t3;
      var pz3 = p.z * (1 - (p.age / p.duree)) * 0;
      var py3 = hy + ((versEcran(cam, p.x0, p.y0).y - p.haut * cam.z) - hy) * t3;
      bouffee(c, px3, py3, (3 + t3 * (nova ? 13 : 8)) * cam.z, (1 - t3) * 0.5, "#b4aca8");
    }
    c.restore();
    c.save();
    c.translate(e.x, hy);
    c.rotate(Math.atan2(p.cy - p.y0 + 0.001, p.cx - p.x0) * 0 + 0.9);
    c.scale(cam.z, cam.z);
    if(nova){
      /* ogive trapue à ailerons, bandes de danger */
      c.fillStyle = "#d8d2c4";
      c.beginPath();
      c.moveTo(0, -16); c.quadraticCurveTo(9, -6, 8, 12);
      c.lineTo(-8, 12); c.quadraticCurveTo(-9, -6, 0, -16);
      c.closePath(); c.fill();
      c.fillStyle = "#e8c437";
      c.fillRect(-8, -2, 16, 5);
      c.fillStyle = "#1c1a18";
      for(var b3 = -1; b3 <= 1; b3++) c.fillRect(b3 * 5 - 1.4, -2, 2.8, 5);
      c.fillStyle = "#b8433a";
      c.beginPath(); c.moveTo(-8, 12); c.lineTo(-13, 19); c.lineTo(-4, 15); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(8, 12); c.lineTo(13, 19); c.lineTo(4, 15); c.closePath(); c.fill();
    }else{
      /* Viper : long, fin, ailerons nets */
      c.fillStyle = "#cfd6dc";
      c.beginPath();
      c.moveTo(0, -18); c.quadraticCurveTo(4.5, -6, 4, 12);
      c.lineTo(-4, 12); c.quadraticCurveTo(-4.5, -6, 0, -18);
      c.closePath(); c.fill();
      c.fillStyle = "#2f8ea4";
      c.fillRect(-4, -4, 8, 3.4);
      c.fillStyle = "#8a949c";
      c.beginPath(); c.moveTo(-4, 10); c.lineTo(-9, 17); c.lineTo(-2, 14); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(4, 10); c.lineTo(9, 17); c.lineTo(2, 14); c.closePath(); c.fill();
    }
    /* jet du propulseur */
    c.globalCompositeOperation = "lighter";
    var gj2 = c.createRadialGradient(0, 16, 0, 0, 16, nova ? 16 : 12);
    gj2.addColorStop(0, "rgba(255,240,190,.9)");
    gj2.addColorStop(0.45, "rgba(255,150,40,.6)");
    gj2.addColorStop(1, "rgba(255,80,20,0)");
    c.fillStyle = gj2;
    c.beginPath(); c.ellipse(0, 16, nova ? 9 : 6, nova ? 16 : 12, 0, 0, 6.2832); c.fill();
    c.restore();
    c.save(); c.globalAlpha = 0.2; c.fillStyle = "#000";
    c.beginPath(); c.ellipse(e.x, e.y, 6 * cam.z, 3 * cam.z, 0, 0, 6.2832); c.fill();
    c.restore();
  }else if(p.t === "bombe"){
    /* ---- MORTIER et missiles de SALVE ----
       L'obus n'était tout simplement pas dessiné : l'explosion
       apparaissait au sol sans que rien ne tombe. Il a désormais une
       ombre au sol qui trahit sa hauteur, une traînée, et — pour un
       missile de Salve — une tête enflammée qu'on suit dans sa chute. */
    var salve = !!p.salve;
    var hy2 = e.y - zz - 10 * z;
    var tp = Math.min(1, p.age / p.duree);
    var monte = tp < 0.5;

    /* ombre au sol : elle rétrécit quand l'obus monte. C'est elle qui
       rend la trajectoire lisible en isométrie. */
    var fo2 = Math.max(0.12, 1 - (p.z || 0) / 90);
    c.save();
    c.globalAlpha = 0.24 * fo2;
    c.fillStyle = "#000";
    c.beginPath(); c.ellipse(e.x, e.y, 5.5 * fo2 * z, 2.7 * fo2 * z, 0, 0, 6.2832); c.fill();
    c.restore();

    /* traînée : fumée sur la montée, feu sur la descente */
    var dep = versEcran(cam, p.x0, p.y0);
    var nT = salve ? 12 : 7;
    for(var s4 = 1; s4 <= nT; s4++){
      var t4 = s4 / nT;
      var ta = Math.max(0, tp - t4 * (salve ? 0.30 : 0.20));
      var xa2 = p.x0 + (p.cx - p.x0) * ta, ya2 = p.y0 + (p.cy - p.y0) * ta;
      var za2 = (p.haut || 30) * 4 * ta * (1 - ta);
      var pt4 = versEcran(cam, xa2, ya2);
      var yy4 = pt4.y - za2 * z - 10 * z;
      if(salve && !monte){
        /* la traînée s'embrase à la descente : on suit le missile */
        c.save();
        c.globalCompositeOperation = "lighter";
        var gs4 = c.createRadialGradient(pt4.x, yy4, 0, pt4.x, yy4, (4 + t4 * 13) * z);
        gs4.addColorStop(0, "rgba(255,222,150," + ((1 - t4) * 0.55) + ")");
        gs4.addColorStop(0.5, "rgba(255,130,34," + ((1 - t4) * 0.30) + ")");
        gs4.addColorStop(1, "rgba(200,50,10,0)");
        c.fillStyle = gs4;
        c.beginPath(); c.arc(pt4.x, yy4, (4 + t4 * 13) * z, 0, 6.2832); c.fill();
        c.restore();
      }
      bouffee(c, pt4.x, yy4, (2.2 + t4 * (salve ? 9 : 5.5)) * z,
              (1 - t4) * (salve ? 0.34 : 0.24), salve ? "#a89c98" : "#8e8682");
    }

    /* le corps : ogive orientée dans le sens du vol */
    var dxv = (p.cx - p.x0), dyv = (p.cy - p.y0);
    var pv2 = versEcran(cam, p.x0 + dxv * Math.min(1, tp + 0.05),
                             p.y0 + dyv * Math.min(1, tp + 0.05));
    var zv = (p.haut || 30) * 4 * Math.min(1, tp + 0.05) * (1 - Math.min(1, tp + 0.05));
    var angV = Math.atan2((pv2.y - zv * z) - hy2, pv2.x - e.x);
    c.save();
    c.translate(e.x, hy2);
    c.rotate(angV);
    c.scale(z, z);
    if(salve){
      c.fillStyle = "#cfd3d8";
      c.beginPath();
      c.moveTo(9, 0); c.lineTo(-6, -3.1); c.lineTo(-6, 3.1);
      c.closePath(); c.fill();
      c.fillStyle = "#b03828";
      c.fillRect(-2, -3.1, 3, 6.2);
      c.fillStyle = "#7d848c";
      c.beginPath();
      c.moveTo(-6, -3.1); c.lineTo(-10, -5.4); c.lineTo(-6, -1.2); c.closePath(); c.fill();
      c.beginPath();
      c.moveTo(-6, 3.1); c.lineTo(-10, 5.4); c.lineTo(-6, 1.2); c.closePath(); c.fill();
    }else{
      c.fillStyle = "#3e4a3a";
      c.beginPath();
      c.moveTo(6.5, 0); c.lineTo(-4.5, -2.7); c.lineTo(-4.5, 2.7);
      c.closePath(); c.fill();
      c.fillStyle = "#8e9a72";
      c.fillRect(-4.5, -2.7, 2, 5.4);
    }
    c.restore();

    /* tête enflammée : elle rend le missile repérable de loin */
    c.save();
    c.globalCompositeOperation = "lighter";
    var rTete = (salve ? (monte ? 12 : 20) : 8) * z;
    var gte = c.createRadialGradient(e.x, hy2, 0, e.x, hy2, rTete);
    gte.addColorStop(0, "rgba(255,250,224,.95)");
    gte.addColorStop(0.35, "rgba(255,186,72,.65)");
    gte.addColorStop(1, "rgba(255,90,20,0)");
    c.fillStyle = gte;
    c.beginPath(); c.arc(e.x, hy2, rTete, 0, 6.2832); c.fill();
    c.restore();

  }else if(p.t === "bobine"){
    /* ---- ÉLECTROBOMBE, le projectile ----
       Une bille d'énergie qui grésille, avec des arcs qui lui tournent
       autour et une ombre au sol pour la trajectoire. */
    var hb = e.y - zz - 10 * z;
    c.save();
    c.globalAlpha = 0.2;
    c.fillStyle = "#000";
    c.beginPath(); c.ellipse(e.x, e.y, 5 * z, 2.5 * z, 0, 0, 6.2832); c.fill();
    c.restore();

    c.save();
    c.globalCompositeOperation = "lighter";
    var g3 = c.createRadialGradient(e.x, hb, 0, e.x, hb, 15 * z);
    g3.addColorStop(0, "rgba(232,252,255,.98)");
    g3.addColorStop(0.32, "rgba(125,230,255,.72)");
    g3.addColorStop(1, "rgba(60,160,220,0)");
    c.fillStyle = g3;
    c.beginPath(); c.arc(e.x, hb, 15 * z, 0, 6.2832); c.fill();
    /* arcs en orbite */
    c.strokeStyle = "rgba(190,246,255,.8)";
    c.lineWidth = Math.max(0.8, 1.4 * z);
    for(var ab = 0; ab < 3; ab++){
      var a0b = tps * 11 + ab * 2.09;
      c.beginPath();
      var xb2 = e.x + Math.cos(a0b) * 5 * z, yb2 = hb + Math.sin(a0b) * 3 * z;
      c.moveTo(xb2, yb2);
      for(var kb = 1; kb <= 3; kb++){
        var ak = a0b + kb * 0.8;
        c.lineTo(e.x + Math.cos(ak) * (6 + kb * 2.4) * z,
                 hb + Math.sin(ak) * (3.5 + kb * 1.6) * z);
      }
      c.stroke();
    }
    /* traînée de scintilles */
    var depb = versEcran(cam, p.x0, p.y0);
    var tb2 = Math.min(1, p.age / p.duree);
    for(var sb = 1; sb <= 6; sb++){
      var tt5 = sb / 6;
      var ta5 = Math.max(0, tb2 - tt5 * 0.18);
      var pb5 = versEcran(cam, p.x0 + (p.cx - p.x0) * ta5, p.y0 + (p.cy - p.y0) * ta5);
      var zb5 = (p.haut || 30) * 4 * ta5 * (1 - ta5);
      c.fillStyle = "rgba(150,236,255," + ((1 - tt5) * 0.42) + ")";
      c.beginPath();
      c.arc(pb5.x, pb5.y - zb5 * z - 10 * z, (3.4 - tt5 * 2.4) * z, 0, 6.2832);
      c.fill();
    }
    c.restore();
  }
}

/* ---------------------------------------------------------------
   LE BOUCLIER DU BRASIER
   Tant qu'une cellule électrique tient, la forteresse est intouchable.
   Il faut que ça se VOIE, sans jamais masquer le Brasier : le joueur
   doit pouvoir lire, d'un coup d'œil et sans compter, combien il en
   reste. On ne peint donc pas une bulle opaque mais une cage d'arcs
   qui court sur la silhouette — dense et régulière à cinq cellules,
   clairsemée et vacillante à une seule.
   Le dessin ne touche à rien de la forteresse : il vient PAR-DESSUS,
   après dessineQG(), et n'entre jamais dans son sprite.
   --------------------------------------------------------------- */
/* Le visage du Brasier occupe toute la colonne centrale. On n'y touche
   pas : les arcs restent SUR LES FLANCS de la maçonnerie, entre ces
   deux abscisses locales, et n'entrent jamais dans la bande centrale. */
var BQ_FLANC0 = 118, BQ_FLANC1 = 236;   // demi-largeurs de la zone d'arcs
var BQ_HAUT = -330, BQ_BAS = 26;        // du pied de la coque à son sommet

/* Le geyser dans le repère du monde : même contrat que les défenses,
   on translate à sa case et on met à l'échelle du zoom, puis le
   dessin travaille en unités locales avec les Y négatifs vers le haut. */
function dessineGeyserMonde(c, g, tps){
  var p = versEcran(cam, g.gx, g.gy);
  c.save();
  c.translate(p.x, p.y);
  c.scale(cam.z, cam.z);
  dessineGeyser(c, g, tps);
  c.restore();
}

function dessineBouclierQG(c, tps){
  if(!jeu.bouclier || jeu.fin) return;
  var q = jeu.qg;
  var p = versEcran(cam, q.gx, q.gy);
  var z = cam.z;
  if(z < 0.09) return;                          // de très loin, le halo suffit
  var nb = typeof NB_REACTEURS === "number" ? NB_REACTEURS : 5;
  var f = jeu.bouclier / nb;                    // 1 = intact, 0.2 = dernière

  /* L'INSTABILITÉ. À cinq cellules le courant est parfaitement lisse ;
     à une seule il hoquette et manque de lâcher. Deux sinus déphasés
     suffisent à donner une alimentation qui faiblit — et surtout ils
     sont déterministes : un vrai aléatoire scintillerait différemment
     à chaque image et donnerait mal aux yeux. */
  var instab = 1 - f;
  var bat = 1
          - instab * 0.62 * Math.max(0, Math.sin(tps * 11.3))
          - instab * 0.34 * Math.max(0, Math.sin(tps * 27.1 + 1.7));
  bat = Math.max(0.10, bat);

  c.save();
  c.translate(p.x, p.y);
  c.scale(z, z);
  c.globalCompositeOperation = "lighter";
  c.lineCap = "round";
  c.lineJoin = "round";

  /* ---- 1. L'ANNEAU AU PIED : c'est là que les cinq câbles arrivent.
     Il pulse au rythme des impulsions, et son intensité dit à elle
     seule combien de cellules alimentent encore. ---- */
  var rx0 = 232, ry0 = 116;
  var pouls = 0.5 + 0.5 * Math.sin(tps * 3.4);
  var gr = c.createRadialGradient(0, 0, rx0 * 0.55, 0, 0, rx0 * 1.16);
  gr.addColorStop(0, "rgba(70,170,255,0)");
  gr.addColorStop(0.80, "rgba(90,195,255," + (0.24 * f * bat) + ")");
  gr.addColorStop(0.97, "rgba(170,232,255," + (0.46 * f * bat * (0.6 + pouls * 0.4)) + ")");
  gr.addColorStop(1, "rgba(140,215,255,0)");
  c.fillStyle = gr;
  c.beginPath(); c.ellipse(0, 0, rx0 * 1.16, ry0 * 1.16, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(0, 0, rx0, ry0, 0, 0, 6.2832);
  c.strokeStyle = "rgba(70,175,255," + (0.30 * f * bat) + ")";
  c.lineWidth = 11; c.stroke();
  c.strokeStyle = "rgba(210,246,255," + (0.55 * f * bat) + ")";
  c.lineWidth = 2.6; c.stroke();

  /* ---- 2. LES MONTANTS : une colonne d'énergie par cellule encore
     debout. Elles grimpent le long des flancs, et le joueur peut les
     COMPTER — c'est la lecture la plus directe de ce qui lui reste à
     détruire. ---- */
  var i, s;
  for(i = 0; i < jeu.bouclier; i++){
    /* réparties de part et d'autre, jamais au milieu */
    var cote = (i % 2) ? 1 : -1;
    var rang = Math.floor(i / 2);
    var xb = cote * (BQ_FLANC0 + rang * (BQ_FLANC1 - BQ_FLANC0) / 2.2);
    /* la décharge monte, puis recommence : le sens est toujours
       du sol vers le sommet, comme dans les câbles */
    var mont = ((tps * 0.62 + i * 0.37) % 1);
    var hautArc = BQ_BAS + (BQ_HAUT - BQ_BAS) * (0.35 + f * 0.65);
    var alpha = (0.52 + 0.30 * Math.sin(tps * 2.7 + i * 1.3)) * bat;

    /* Le tracé est monté une fois puis peint trois fois : une nappe
       large et bleue qui pose la lumière sur la pierre, un trait franc,
       puis un cœur blanc très fin. Sans ces trois passes l'arc se perd
       sur une forteresse déjà lumineuse. */
    c.beginPath();
    for(s = 0; s <= 14; s++){
      var k = s / 14;
      var yy = BQ_BAS + (hautArc - BQ_BAS) * k;
      /* le zigzag, resserré près du sol et près du sommet */
      var amp = 15 * Math.sin(k * Math.PI);
      var xx = xb + Math.sin(k * 17.3 + tps * 4.1 + i * 2.2) * amp
                  + Math.sin(k * 6.1 - tps * 2.3) * amp * 0.5;
      /* le flanc se resserre en montant : la coque est pyramidale */
      xx *= 1 - k * 0.34;
      if(s === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy);
    }
    c.strokeStyle = "rgba(58,150,255," + (alpha * 0.55) + ")";
    c.lineWidth = 13; c.stroke();
    c.strokeStyle = "rgba(150,224,255," + alpha + ")";
    c.lineWidth = 4.6; c.stroke();
    c.strokeStyle = "rgba(240,253,255," + (alpha * 0.9) + ")";
    c.lineWidth = 1.7; c.stroke();

    /* la charge qui remonte le long du montant */
    var yc3 = BQ_BAS + (hautArc - BQ_BAS) * mont;
    var xc3 = xb * (1 - mont * 0.34);
    lueurRapide(c, xc3, yc3, 46, "#a9e8ff", 0.46 * bat);

    /* le pied, ancré dans l'anneau */
    lueurRapide(c, xb, BQ_BAS, 34, "#8fdcff", 0.34 * bat);
  }

  /* ---- 3. LE GRÉSILLEMENT sur la maçonnerie : la texture du champ.
     Toujours sur les flancs, jamais dans la bande du visage. ---- */
  var alB = prng(7717);
  var petits = Math.round(3 + f * 8);
  for(i = 0; i < petits; i++){
    var pha = (tps * 0.9 + i * 0.61) % 1;
    var av = Math.sin(pha * Math.PI) * bat * 0.55;
    var bx = (alB() < 0.5 ? -1 : 1) * (BQ_FLANC0 + alB() * (BQ_FLANC1 - BQ_FLANC0));
    var by = BQ_BAS + (BQ_HAUT - BQ_BAS) * alB() * (0.3 + f * 0.7);
    if(av <= 0.02) continue;
    c.strokeStyle = "rgba(214,250,255," + av + ")";
    c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(bx, by);
    for(s = 0; s < 3; s++)
      c.lineTo(bx + (alB() - 0.5) * 54, by + (alB() - 0.5) * 54);
    c.stroke();
  }

  /* ---- 4. UN COUP ENCAISSÉ. Sans ça, le joueur croit que ses tirs ne
     portent pas du tout : le champ doit visiblement les renvoyer. ---- */
  if(jeu.boucliertouche > 0){
    var kt = Math.min(1, jeu.boucliertouche / 0.22);
    var gt = c.createRadialGradient(0, -140, 60, 0, -140, 340);
    gt.addColorStop(0, "rgba(120,205,255,0)");
    gt.addColorStop(0.72, "rgba(150,222,255," + (0.14 * kt) + ")");
    gt.addColorStop(0.94, "rgba(200,242,255," + (0.34 * kt) + ")");
    gt.addColorStop(1, "rgba(210,246,255,0)");
    c.fillStyle = gt;
    c.beginPath(); c.ellipse(0, -140, 340, 300, 0, 0, 6.2832); c.fill();
  }
  c.restore();
}

/* ---------------------------------------------------------------
   LES CÂBLES DU BOUCLIER
   Cinq câbles noirs posés au sol, un par cellule électrique, qui
   rejoignent le Brasier presque en ligne droite en contournant les
   bâtiments. Ce ne sont pas des décorations : ils DISENT au joueur
   d'où vient l'invulnérabilité de la forteresse. Il faut donc que
   l'énergie s'y voie circuler, et que le sens de circulation soit
   sans ambiguïté — de la cellule vers le Brasier.
   Le tracé lui-même est calculé une fois par carte (construitCables),
   ici on ne fait que le peindre.
   --------------------------------------------------------------- */
var IMPULSIONS = 3;          // impulsions simultanées par câble
var VIT_IMPULSION = 13;      // cases par seconde

function dessineCables(c, tps){
  if(!jeu.cables || !jeu.cables.length) return;
  var vue = rectVisible(0);
  c.save();
  c.lineCap = "round";
  c.lineJoin = "round";
  for(var i = 0; i < jeu.cables.length; i++){
    var cb = jeu.cables[i], pts = cb.pts;
    if(pts.length < 2) continue;
    /* un câble mort perd sa lumière en 1,4 s mais reste posé au sol :
       le joueur doit continuer à voir par où passait le courant.
       Le fondu est décompté par majBouclier() — le rendu ne décide de
       rien, il ne fait que lire. */
    var vif = cb.morte ? (cb.fondu || 0) / 1.4 : 1;

    /* La gaine, puis le câble par-dessus. Le chemin n'est monté qu'une
       fois et repeint quatre fois — mais surtout on n'y met QUE les
       segments à l'écran : un câble traverse l'île entière, et stroker
       ses cent points quand on en voit dix coûtait plus cher que tous
       les cratères réunis. */
    c.beginPath();
    var ouvert = 0, vus = 0;
    for(var k = 0; k < pts.length; k++){
      var pk = iso(pts[k].gx, pts[k].gy);
      var dans = pk.x > vue.x0 - 200 && pk.x < vue.x1 + 200 &&
                 pk.y > vue.y0 - 200 && pk.y < vue.y1 + 200;
      /* on garde le point précédent et le suivant d'un segment visible,
         sinon le câble serait coupé net au bord de l'écran */
      if(!dans && !ouvert) continue;
      if(!ouvert){ c.moveTo(pk.x, pk.y); ouvert = 1; continue; }
      c.lineTo(pk.x, pk.y);
      vus++;
      if(!dans) ouvert = 0;
    }
    if(!vus) continue;                 // câble entièrement hors champ
    c.strokeStyle = "rgba(18,16,22,.55)";
    c.lineWidth = 9;
    c.stroke();
    c.strokeStyle = cb.morte ? "#2b2830" : "#1e2b34";
    c.lineWidth = 5;
    c.stroke();
    /* liseré supérieur : sans lui le câble s'aplatit sur le sol */
    c.strokeStyle = cb.morte ? "rgba(96,92,104,.45)" : "rgba(96,132,152,.55)";
    c.lineWidth = 1.6;
    c.stroke();

    if(vif <= 0.01) continue;

    /* le halo continu du conducteur : faible, mais il donne au câble
       sa couleur électrique même entre deux impulsions */
    c.save();
    c.globalCompositeOperation = "lighter";
    c.strokeStyle = "rgba(70,190,255," + (0.30 * vif) + ")";
    c.lineWidth = 2.2;
    c.stroke();

    /* LES IMPULSIONS. Elles courent à vitesse constante le long de la
       longueur cumulée, donc sans ralentir dans les virages, et
       toujours vers le Brasier. */
    for(var q = 0; q < IMPULSIONS; q++){
      var d = ((tps * VIT_IMPULSION + i * 5.7 + q * cb.lg / IMPULSIONS) % cb.lg);
      var seg = segmentCable(cb, d);
      if(!seg) continue;
      var ps = iso(seg.gx, seg.gy);
      if(ps.x < vue.x0 - 80 || ps.x > vue.x1 + 80 ||
         ps.y < vue.y0 - 80 || ps.y > vue.y1 + 80) continue;
      /* la traîne : quelques points derrière la tête, de plus en plus
         faibles — c'est elle qui donne le SENS de circulation */
      for(var tr = 4; tr >= 0; tr--){
        var st = segmentCable(cb, d - tr * 0.85);
        if(!st) continue;
        var pt2 = iso(st.gx, st.gy);
        var af = (1 - tr / 5) * vif;
        c.fillStyle = "rgba(180,238,255," + (0.75 * af * af) + ")";
        c.beginPath();
        c.ellipse(pt2.x, pt2.y, 3.6 * af + 1.2, 2.0 * af + 0.8, 0, 0, 6.2832);
        c.fill();
      }
      lueurRapide(c, ps.x, ps.y, 26, "#8fe4ff", 0.5 * vif);
    }
    c.restore();
  }
  c.restore();
}

/* Où se trouve, en coordonnées monde, le point situé à la distance d
   du départ du câble. Recherche linéaire : quelques dizaines de points
   par câble, cinq câbles — c'est gratuit devant le reste de l'image. */
function segmentCable(cb, d){
  var pts = cb.pts;
  if(d < 0) d += cb.lg;
  if(d < 0 || d > cb.lg) return null;
  /* Dichotomie, pas balayage : les distances cumulées sont croissantes,
     et un balayage linéaire coûtait cent tours de boucle par point
     d'impulsion — six points par impulsion, quinze impulsions, soit
     neuf mille tours par image pour dessiner quinze taches. */
  var lo = 1, hi = pts.length - 1;
  while(lo < hi){
    var mi = (lo + hi) >> 1;
    if(pts[mi].d >= d) hi = mi; else lo = mi + 1;
  }
  var d0 = pts[lo - 1].d, dl = pts[lo].d - d0;
  var f = dl > 0.0001 ? (d - d0) / dl : 0;
  return { gx:pts[lo - 1].gx + (pts[lo].gx - pts[lo - 1].gx) * f,
           gy:pts[lo - 1].gy + (pts[lo].gy - pts[lo - 1].gy) * f };
}

/* ---------------------------------------------------------------
   Zones au sol (dessinées en repère monde)
   --------------------------------------------------------------- */
function dessineZonesSol(c, tps){
  var i;
  /* les câbles du bouclier passent SOUS tout le reste : ce sont eux
     qui sont posés au sol, les cratères et les flaques leur passent
     dessus comme au terrain */
  dessineCables(c, tps);
  /* cratères */
  c.save();
  c.globalAlpha = 0.34;
  for(i = 0; i < jeu.crateres.length; i++){
    var k = jeu.crateres[i], p = iso(k.gx, k.gy);
    c.fillStyle = "#2a2018";
    c.beginPath(); c.ellipse(p.x, p.y, k.r * RX, k.r * RY, 0, 0, 6.2832); c.fill();
    c.fillStyle = "rgba(80,60,40,.5)";
    c.beginPath(); c.ellipse(p.x, p.y - 1, k.r * RX * 0.7, k.r * RY * 0.7, 0, 0, 6.2832); c.fill();
  }
  c.restore();
  /* flaques enflammées */
  for(i = 0; i < jeu.flaques.length; i++){
    var f = jeu.flaques[i], q = iso(f.gx, f.gy);
    var a = Math.min(1, (f.duree - f.age) / 1.2);
    c.save();
    c.globalCompositeOperation = "lighter";
    var g = c.createRadialGradient(q.x, q.y, 2, q.x, q.y, f.r * RX);
    /* Les traînées de Mily brûlent d'un feu qui n'est pas celui du
       Brasier : plus blanc au cœur, franchement rouge au bord. On les
       reconnaît d'un coup d'œil parmi les flaques ordinaires. */
    if(f.veng){
      g.addColorStop(0, "rgba(255,244,222," + (0.78 * a) + ")");
      g.addColorStop(0.45, "rgba(255,74,38," + (0.52 * a) + ")");
      g.addColorStop(1, "rgba(214,12,6,0)");
    }else{
      g.addColorStop(0, "rgba(255,200,90," + (0.55 * a) + ")");
      g.addColorStop(0.6, "rgba(255,90,20," + (0.35 * a) + ")");
      g.addColorStop(1, "rgba(200,30,10,0)");
    }
    c.fillStyle = g;
    c.beginPath(); c.ellipse(q.x, q.y, f.r * RX, f.r * RY, 0, 0, 6.2832); c.fill();
    for(var n = 0; n < 5; n++){
      var an = n / 5 * 6.2832 + tps;
      flamme(c, q.x + Math.cos(an) * f.r * RX * 0.55, q.y + Math.sin(an) * f.r * RY * 0.55,
             10 * a, tps + n, 0.5);
    }
    c.restore();
  }
  /* glu */
  for(i = 0; i < jeu.glu.length; i++){
    var g2 = jeu.glu[i], r2 = iso(g2.gx, g2.gy);
    var a2 = Math.min(1, (g2.duree - g2.age) / 1.5) * 0.55;
    c.save();
    c.globalAlpha = a2;
    c.fillStyle = "#7db83a";
    c.beginPath(); c.ellipse(r2.x, r2.y, g2.r * RX, g2.r * RY, 0, 0, 6.2832); c.fill();
    c.fillStyle = "rgba(220,255,160,.5)";
    c.beginPath(); c.ellipse(r2.x - 6, r2.y - 3, g2.r * RX * 0.35, g2.r * RY * 0.35, 0, 0, 6.2832); c.fill();
    c.restore();
  }
  /* zones de soin */
  for(i = 0; i < jeu.soin.length; i++){
    var s = jeu.soin[i], t = iso(s.gx, s.gy);
    var a3 = Math.min(1, (s.duree - s.age) / 1.0);
    c.save();
    c.globalCompositeOperation = "lighter";
    var g3 = c.createRadialGradient(t.x, t.y, 2, t.x, t.y, s.r * RX);
    g3.addColorStop(0, "rgba(110,224,138," + (0.3 * a3) + ")");
    g3.addColorStop(1, "rgba(110,224,138,0)");
    c.fillStyle = g3;
    c.beginPath(); c.ellipse(t.x, t.y, s.r * RX, s.r * RY, 0, 0, 6.2832); c.fill();
    c.strokeStyle = "rgba(150,255,180," + (0.5 * a3) + ")"; c.lineWidth = 2;
    c.beginPath();
    c.ellipse(t.x, t.y, s.r * RX * (0.75 + 0.25 * Math.sin(tps * 3)),
              s.r * RY * (0.75 + 0.25 * Math.sin(tps * 3)), 0, 0, 6.2832);
    c.stroke();
    c.restore();
  }
  /* Emprise au sol du Brouillard. Elle dit une chose et une seule :
     « tout ce qui est dans ce cercle est masqué ». Elle est donc plus
     franche que le nuage — liseré plein, liseré animé, et des
     épaisseurs plafonnées en pixels écran pour rester lisible au
     dézoom, là où la fumée seule devenait invisible.
     Repère MONDE : ce bloc est peint entre repereMonde et repereEcran,
     les longueurs sont en unités monde et les traits divisés par cam.z. */
  for(i = 0; i < jeu.brouillards.length; i++){
    var zb = jeu.brouillards[i], pb = iso(zb.gx, zb.gy);
    var ab = Math.min(1, zb.age * 3) * Math.min(1, (zb.duree - zb.age) / 1.5);
    var bx = zb.r * RX, by = zb.r * RY;
    c.save();
    var gb = c.createRadialGradient(pb.x, pb.y, bx * 0.14, pb.x, pb.y, bx);
    gb.addColorStop(0.00, "rgba(214,210,224," + (0.30 * ab) + ")");
    gb.addColorStop(0.62, "rgba(178,172,190," + (0.24 * ab) + ")");
    gb.addColorStop(0.93, "rgba(152,146,164," + (0.15 * ab) + ")");
    gb.addColorStop(1.00, "rgba(142,136,154,0)");
    c.fillStyle = gb;
    c.beginPath(); c.ellipse(pb.x, pb.y, bx, by, 0, 0, 6.2832); c.fill();
    c.strokeStyle = "rgba(228,224,238," + (0.66 * ab) + ")";
    c.lineWidth = Math.max(1.6 / cam.z, 2.6);
    c.beginPath(); c.ellipse(pb.x, pb.y, bx, by, 0, 0, 6.2832); c.stroke();
    if(c.setLineDash){
      var pas = Math.max(7 / cam.z, 12);
      c.setLineDash([pas, pas * 0.8]);
      c.lineDashOffset = -tps * pas * 0.9;
      c.strokeStyle = "rgba(255,255,255," + (0.36 * ab) + ")";
      c.lineWidth = Math.max(1 / cam.z, 1.6);
      c.beginPath(); c.ellipse(pb.x, pb.y, bx * 0.93, by * 0.93, 0, 0, 6.2832); c.stroke();
      c.setLineDash([]);
    }
    c.restore();
  }
  /* zones cryogéniques : les tourelles prises dedans sont muettes */
  for(i = 0; i < jeu.cryos.length; i++){
    var zc = jeu.cryos[i], pz = iso(zc.gx, zc.gy);
    var az = Math.min(1, zc.age * 3) * Math.min(1, (zc.duree - zc.age) / 1.5);
    c.save();
    var gz = c.createRadialGradient(pz.x, pz.y, 4, pz.x, pz.y, zc.r * RX);
    gz.addColorStop(0, "rgba(190,240,255," + (0.42 * az) + ")");
    gz.addColorStop(0.7, "rgba(120,200,255," + (0.26 * az) + ")");
    gz.addColorStop(1, "rgba(90,170,255,0)");
    c.fillStyle = gz;
    c.beginPath(); c.ellipse(pz.x, pz.y, zc.r * RX, zc.r * RY, 0, 0, 6.2832); c.fill();
    c.strokeStyle = "rgba(220,250,255," + (0.6 * az) + ")"; c.lineWidth = 2.4;
    c.beginPath(); c.ellipse(pz.x, pz.y, zc.r * RX, zc.r * RY, 0, 0, 6.2832); c.stroke();
    /* cristaux de givre */
    var alz = prng((zc.gx * 313 + zc.gy * 977) | 0);
    c.fillStyle = "rgba(230,250,255," + (0.5 * az) + ")";
    for(var q = 0; q < 18; q++){
      var aq = alz() * 6.2832, rq = Math.sqrt(alz()) * zc.r;
      var px2 = pz.x + Math.cos(aq) * rq * RX, py2 = pz.y + Math.sin(aq) * rq * RY;
      c.beginPath();
      c.moveTo(px2, py2 - 6); c.lineTo(px2 + 3, py2); c.lineTo(px2, py2 + 6); c.lineTo(px2 - 3, py2);
      c.closePath(); c.fill();
    }
    c.restore();
  }
  /* vague de feu */
  if(jeu.vague){
    var q2 = iso(jeu.qg.gx, jeu.qg.gy);
    var rv = jeu.vague.r;
    c.save();
    c.globalCompositeOperation = "lighter";
    c.strokeStyle = "rgba(255,150,40,.85)";
    c.lineWidth = 16;
    c.beginPath(); c.ellipse(q2.x, q2.y, rv * RX, rv * RY, 0, 0, 6.2832); c.stroke();
    c.strokeStyle = "rgba(255,240,190,.9)"; c.lineWidth = 5;
    c.beginPath(); c.ellipse(q2.x, q2.y, rv * RX, rv * RY, 0, 0, 6.2832); c.stroke();
    c.restore();
  }
  /* anneau de télégraphe */
  if(jeu.qgTelegraphe > 0){
    var q3 = iso(jeu.qg.gx, jeu.qg.gy);
    var tt = 1 - jeu.qgTelegraphe / EQ.QG_TELEGRAPHE;
    var rr = 3 + tt * (jeu.qgForme === 0 ? EQ.QG_PLUIE_RAYON : EQ.QG_VAGUE_PORTEE);
    c.save();
    c.strokeStyle = "rgba(255,70,30," + (0.35 + 0.45 * Math.sin(tt * 22)) + ")";
    c.lineWidth = 6;
    c.beginPath(); c.ellipse(q3.x, q3.y, rr * RX, rr * RY, 0, 0, 6.2832); c.stroke();
    c.restore();
  }
  /* point de ralliement */
  if(jeu.balise){
    var pf = iso(jeu.balise.gx, jeu.balise.gy);
    c.save();
    c.globalCompositeOperation = "lighter";
    var gf = c.createRadialGradient(pf.x, pf.y, 2, pf.x, pf.y, 90);
    gf.addColorStop(0, "rgba(255,230,140,.5)");
    gf.addColorStop(1, "rgba(255,180,60,0)");
    c.fillStyle = gf;
    c.beginPath(); c.ellipse(pf.x, pf.y, 90, 45, 0, 0, 6.2832); c.fill();
    c.restore();
    c.strokeStyle = "rgba(255,210,110,.75)"; c.lineWidth = 2.4;
    var rp = 26 + Math.sin(tps * 3) * 6;
    c.beginPath(); c.ellipse(pf.x, pf.y, rp, rp / 2, 0, 0, 6.2832); c.stroke();
  }
}

/* Nuage de fumigène — volumétrique, dans le tri de profondeur */
/* Le volume de fumée du Brouillard. L'emprise au sol, elle, est
   peinte avec le Cryo dans dessineZonesSol : un disque posé au sol n'a
   rien à faire dans la pile de profondeur, il repasserait par-dessus
   les unités situées devant lui.
   Attention : bouffee() REMPLACE globalAlpha au lieu de le multiplier.
   Le fondu doit donc passer par l'argument, pas par un globalAlpha
   parent — c'est ce qui rendait l'ancien fondu inopérant. */
/* Les trois épaisseurs du nuage, de la nappe au sol aux volutes qui
   s'effilochent en l'air. Chacune a sa densité, sa hauteur, sa vitesse
   de rotation et sa teinte : c'est leur superposition, et le fait
   qu'elles ne tournent pas à la même vitesse, qui donne un volume qui
   remue au lieu d'une galette qui glisse.
   n      : nombre de bouffées
   rayon  : position dans le disque, en part du rayon de la zone
   haut   : élévation à l'écran, en pixels à zoom 1
   taille : rayon de la bouffée, EN PART DU RAYON DE LA ZONE — surtout
            pas en pixels : la zone fait quatre cases de rayon, donc
            environ cent cinquante pixels de large, et des bouffées
            calibrées en pixels absolus s'y perdaient comme des
            grains de poussière au lieu de la remplir
   opa    : opacité de base
   tour   : vitesse de rotation (signe = sens)
   rgb    : teinte, en triplet nu pour bouffeeFloue */
var NAPPES_BROUILLARD = [
  { n:22, rayon:[0.56, 0.99], haut:[1, 12],  taille:[0.22, 0.34], opa:0.36, tour:-0.21, ecrase:0.56 },
  { n:19, rayon:[0.10, 0.80], haut:[12, 30], taille:[0.24, 0.38], opa:0.34, tour:0.33,  ecrase:0.72 },
  { n:13, rayon:[0.00, 0.54], haut:[28, 56], taille:[0.20, 0.33], opa:0.28, tour:-0.48, ecrase:0.90 }
];
/* Teinte d'une bouffée. Une fumée d'un gris uniforme reste plate quelle
   que soit son opacité : ce qui donne le volume, c'est l'écart de
   VALEUR entre deux volutes voisines. Les hautes prennent la lumière,
   les basses restent dans l'ombre du nuage, et un peu de bruit évite
   que la transition ne soit un dégradé trop propre. */
function tonBrouillard(hauteur, bruit){
  var lum = 0.72 + 0.30 * Math.min(1, hauteur / 52) + (bruit - 0.5) * 0.30;
  var r = Math.min(255, (176 * lum) | 0);
  var v = Math.min(255, (170 * lum) | 0);
  var b = Math.min(255, (190 * lum) | 0);
  return r + "," + v + "," + b;
}

function dessineBrouillard(c, f, tps){
  var p = versEcran(cam, f.gx, f.gy);
  var z = cam.z;
  var a = Math.min(1, f.age * 3) * Math.min(1, (f.duree - f.age) / 1.5);
  if(a <= 0.01) return;

  /* Graine stable tirée de la position : deux Brouillards posés à des
     endroits différents ne se ressemblent pas, mais le même nuage garde
     sa forme d'une image à l'autre au lieu de grésiller. */
  var gr = ((f.gx * 733.1 + f.gy * 419.7) | 0);
  /* rayon de la zone en pixels d'écran : c'est l'unité dans laquelle
     les bouffées sont dimensionnées */
  var RZ = f.r * RX;

  for(var l = 0; l < NAPPES_BROUILLARD.length; l++){
    var q = NAPPES_BROUILLARD[l];
    for(var i = 0; i < q.n; i++){
      /* trois bruits stables par bouffée : sa place, sa taille, son
         souffle. Le tour de disque est réparti régulièrement puis
         perturbé, pour ne pas retomber sur une couronne trop nette. */
      var b0 = bruitStable(gr + l * 97 + i, 0);
      var b1 = bruitStable(gr + l * 97 + i, 1);
      var b2 = bruitStable(gr * 3 + l * 31 + i, 0);

      var ang = (i / q.n) * 6.2832 + (b0 - 0.5) * 0.85 + tps * q.tour;
      /* respiration : le nuage se gonfle et se rétracte doucement,
         chaque bouffée sur son propre rythme */
      var souffle = 1 + Math.sin(tps * (0.7 + b1 * 0.7) + b2 * 6.2832) * 0.13;
      var rr = f.r * (q.rayon[0] + (q.rayon[1] - q.rayon[0]) * b1) * souffle;
      var pp = versEcran(cam, f.gx + Math.cos(ang) * rr, f.gy + Math.sin(ang) * rr);

      /* hauteur : une part fixe propre à la bouffée, une part qui
         ondule — c'est ce balancement vertical qui empêche la nappe
         de paraître plate */
      var h = q.haut[0] + (q.haut[1] - q.haut[0]) * b2
            + Math.sin(tps * (1.0 + b0 * 0.9) + i * 1.7) * 4.6;
      var taille = (q.taille[0] + (q.taille[1] - q.taille[0]) * b0) * RZ * souffle;
      /* opacité : elle varie d'une bouffée à l'autre et respire, et
         elle s'éteint sur le pourtour pour que le nuage n'ait pas de
         bord franc */
      /* Fort écart d'une bouffée à l'autre : c'est ce contraste qui
         donne du grain au nuage. Une opacité uniforme, même élevée,
         ne produit qu'une flaque de lait bien plate. */
      var opa = q.opa * (0.42 + b1 * 0.92)
              * (1 + Math.sin(tps * 0.9 + b0 * 6.2832) * 0.22) * a;

      bouffeeFloue(c, pp.x, pp.y - h * z, taille * z, opa,
                   tonBrouillard(h, b2), q.ecrase);
    }
  }

  /* Cœur dense : c'est lui qui rend la cachette crédible. Les nappes
     seules laissaient voir au travers ; celui-ci bouche le milieu.
     Il respire lui aussi, pour ne pas figer le centre du nuage.
     Le « * z » n'est pas décoratif : RZ est une longueur MONDE, il
     faut la ramener à l'écran, sans quoi le cœur enflerait au dézoom
     jusqu'à couvrir la moitié de la carte. */
  var resp = 1 + Math.sin(tps * 0.6 + gr) * 0.06;
  bouffeeFloue(c, p.x, p.y - 15 * z, RZ * 0.62 * resp * z, 0.24 * a, "190,184,200", 0.60);

  /* LE CERCLE AU SOL, REPEINT PAR-DESSUS LA FUMÉE.
     Il est déjà tracé plus tôt, avec le décor, pour teinter l'herbe —
     mais le nuage se dessine après et l'enterrait. Or c'est lui, et lui
     seul, qui dit exactement où s'arrête la protection : il doit rester
     lisible quoi qu'il arrive. On le repasse donc ici, en dernier.
     Épaisseurs plafonnées en pixels écran pour tenir au dézoom. */
  var ex = f.r * RX * z, ey = f.r * RY * z;
  c.save();
  c.strokeStyle = "rgba(236,232,246," + (0.72 * a) + ")";
  c.lineWidth = Math.max(1.7, 2.4 * z);
  c.beginPath(); c.ellipse(p.x, p.y, ex, ey, 0, 0, 6.2832); c.stroke();
  if(c.setLineDash){
    var pasR = Math.max(9, 13 * z);
    c.setLineDash([pasR, pasR * 0.8]);
    c.lineDashOffset = -tps * pasR * 0.9;
    c.strokeStyle = "rgba(255,255,255," + (0.5 * a) + ")";
    c.lineWidth = Math.max(1.1, 1.6 * z);
    c.beginPath(); c.ellipse(p.x, p.y, ex * 0.93, ey * 0.93, 0, 0, 6.2832); c.stroke();
    c.setLineDash([]);
  }
  c.restore();

  /* décompte : combien de temps la zone tient encore */
  if(z > 0.30){
    texteCerne(c, Math.ceil(f.duree - f.age) + " s", p.x, p.y - Math.max(30, 52 * z),
               Math.max(10, 13 * z), "#e6e2f0");
  }
}

/* ---------------------------------------------------------------
   LA NAVETTE DE DÉBARQUEMENT
   Coque à fond plat, timonerie arrière, rampe d'étrave qui s'abaisse.
   Elle tangue tant qu'elle flotte et se cale une fois échouée.
   --------------------------------------------------------------- */
var NAV_ECH = 1.75;            // une navette porte quinze soldats : elle est grosse
function dessineNavette(c, v, tps){
  var p = versEcran(cam, v.gx, v.gy);
  var z = cam.z * NAV_ECH;
  var flotte = v.etat !== "accostage" || v.rampe < 1;
  var tang = flotte ? Math.sin(v.tangage) * 1.6 * z : Math.sin(tps * 1.6 + v.n) * 0.5 * z;
  var y = p.y + tang;

  /* sillage et écume d'étrave */
  c.save();
  c.globalAlpha = 0.30;
  c.fillStyle = "#eaf7f6";
  for(var w = 0; w < 4; w++){
    var dw = (18 + w * 15) * z;
    c.beginPath();
    c.ellipse(p.x + dw * 0.9, y + dw * 0.42, (13 - w * 2) * z, (6 - w) * z, 0, 0, 6.2832);
    c.fill();
  }
  c.restore();

  /* ombre portée sur l'eau */
  c.save();
  c.globalAlpha = 0.22; c.fillStyle = "#0b2b34";
  c.beginPath(); c.ellipse(p.x, p.y + 5 * z, 30 * z, 12 * z, 0, 0, 6.2832); c.fill();
  c.restore();

  /* coque : un trapèze isométrique, étrave vers l'ouest (gx décroissant) */
  var A = { x:p.x - 30 * z, y:y - 2 * z };     // étrave
  var B = { x:p.x + 26 * z, y:y - 12 * z };    // arrière bâbord
  var D = { x:p.x + 26 * z, y:y + 10 * z };    // arrière tribord
  var E = { x:p.x - 26 * z, y:y + 8 * z };
  c.fillStyle = "#4c5a52";
  c.beginPath();
  c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.lineTo(D.x, D.y); c.lineTo(E.x, E.y);
  c.closePath(); c.fill();
  /* pont */
  c.fillStyle = "#6c7a6e";
  c.beginPath();
  c.moveTo(A.x, A.y - 7 * z); c.lineTo(B.x, B.y - 7 * z);
  c.lineTo(D.x, D.y - 7 * z); c.lineTo(E.x, E.y - 7 * z);
  c.closePath(); c.fill();
  /* bordé, côté éclairé */
  c.fillStyle = "#8a9a86";
  c.beginPath();
  c.moveTo(A.x, A.y - 7 * z); c.lineTo(B.x, B.y - 7 * z);
  c.lineTo(B.x, B.y); c.lineTo(A.x, A.y);
  c.closePath(); c.fill();

  /* timonerie à l'arrière */
  c.fillStyle = "#586652";
  c.fillRect(p.x + 10 * z, y - 24 * z, 15 * z, 14 * z);
  c.fillStyle = "#39443a";
  c.fillRect(p.x + 12 * z, y - 21 * z, 11 * z, 5 * z);
  c.fillStyle = "#9fb09a";
  c.fillRect(p.x + 10 * z, y - 25 * z, 15 * z, 2 * z);
  /* mât et fanion */
  c.strokeStyle = "#39443a"; c.lineWidth = Math.max(1, 1.6 * z);
  c.beginPath(); c.moveTo(p.x + 17 * z, y - 25 * z); c.lineTo(p.x + 17 * z, y - 38 * z); c.stroke();
  c.fillStyle = "#ff8a1e";
  c.beginPath();
  c.moveTo(p.x + 17 * z, y - 38 * z);
  c.lineTo(p.x + 28 * z + Math.sin(tps * 5 + v.n) * 2 * z, y - 35 * z);
  c.lineTo(p.x + 17 * z, y - 32 * z);
  c.closePath(); c.fill();

  /* rampe d'étrave : verticale fermée, rabattue sur le sable ouverte */
  var ang = v.rampe * 1.35;
  c.save();
  c.translate(A.x, A.y - 7 * z);
  c.fillStyle = "#7d8c78";
  var lg = 34 * z;      // assez longue pour retomber sur le sable
  var dx = -Math.cos(ang) * 0, dy = 0;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(-lg * Math.sin(ang) - 2 * z, -lg * Math.cos(ang) + lg * Math.sin(ang) * 0.42);
  c.lineTo(-lg * Math.sin(ang) - 2 * z + 16 * z, -lg * Math.cos(ang) + lg * Math.sin(ang) * 0.42 + 7 * z);
  c.lineTo(16 * z, 7 * z);
  c.closePath(); c.fill();
  c.strokeStyle = "#4c5a52"; c.lineWidth = Math.max(1, 1.2 * z);
  c.stroke();
  c.restore();

  /* bandes d'avertissement sur le pont */
  c.save();
  c.globalAlpha = 0.55;
  c.fillStyle = "#e8c437";
  for(var q = 0; q < 3; q++)
    c.fillRect(p.x - 12 * z + q * 9 * z, y - 12 * z, 4 * z, 3 * z);
  c.restore();
}

/* La fusée éclairante elle-même, avec son décompte */
function dessineFusee(c, tps){
  var f = jeu.balise;
  var p = versEcran(cam, f.gx, f.gy);
  var z = cam.z;
  c.save();
  c.globalCompositeOperation = "lighter";
  var osc = Math.sin(tps * 4) * 3;
  var y = p.y - 46 * z + osc * z;
  var g = c.createRadialGradient(p.x, y, 0, p.x, y, 26 * z);
  g.addColorStop(0, "rgba(255,255,230,.95)");
  g.addColorStop(0.35, "rgba(255,200,90,.7)");
  g.addColorStop(1, "rgba(255,140,30,0)");
  c.fillStyle = g;
  c.beginPath(); c.arc(p.x, y, 26 * z, 0, 6.2832); c.fill();
  c.restore();
  /* petit parachute */
  c.strokeStyle = "rgba(240,230,210,.8)"; c.lineWidth = 1.2 * z;
  c.beginPath(); c.arc(p.x, p.y - 60 * z, 9 * z, Math.PI, 0); c.stroke();
  c.beginPath(); c.moveTo(p.x - 9 * z, p.y - 60 * z); c.lineTo(p.x, p.y - 48 * z);
  c.lineTo(p.x + 9 * z, p.y - 60 * z); c.stroke();
  texteCerne(c, Math.ceil(f.reste) + " s", p.x, p.y - 76 * z, Math.max(10, 13 * z), "#ffe9a0");
}

/* ---------------------------------------------------------------
   Visée d'une capacité
   --------------------------------------------------------------- */
var viseur = { actif:false, x:0, y:0 };
/* Aperçu de placement : une table, pas une chaîne de ternaires — la
   prochaine capacité ajoutée ne pourra plus être oubliée en silence.
   Ce qui n'est pas listé prend CAP[m].rayon, ce qui couvre nova, cryo,
   brouillard, soin, salve et viper sans rien écrire de plus. */
var VISEE_RAYON = { poulets:0 };              // 0 = rempli au premier appel
var VISEE_COUL = {
  soin:"#6ee08a", brouillard:"#c9c4d2", balise:"#ffd070",
  cryo:"#9ad8ff", poulets:"#f4e2a8", nova:"#ff6a2a",
  salve:"#ffb14a", viper:"#ff8a1e"
};
function dessineVisee(c, tps){
  var m = jeu.capArmee;
  if(!m) return;
  if(!VISEE_RAYON.poulets) VISEE_RAYON.poulets = CAP.poulets.rayon;
  /* la Balise rassemble sur tout le disque de formation, pas sur le
     point cliqué : l'aperçu doit montrer ce disque */
  VISEE_RAYON.balise = rayonFormation();
  var vue = rectVisible(60);
  /* cercles de portée de toutes les défenses */
  c.save();
  repereMonde(c);
  /* Trait plein, un seul beginPath pour toutes les défenses, et rien
     du tout au-delà d'un certain dézoom : en pointillés et une ellipse
     par bâtiment, ce bloc coûtait à lui seul le geste de placement. */
  if(cam.z > 0.22){
    c.strokeStyle = "rgba(255,90,60,.26)";
    c.lineWidth = Math.max(1.2 / cam.z, 1.1);
    c.beginPath();
    var traces = 0;
    for(var i = 0; i < jeu.batiments.length && traces < 90; i++){
      var b = jeu.batiments[i];
      if(!b.vivant || !DEF[b.t].portee) continue;
      if(!visible(vue, b.gx, b.gy)) continue;
      var p = iso(b.gx, b.gy);
      c.moveTo(p.x + DEF[b.t].portee * RX, p.y);
      c.ellipse(p.x, p.y, DEF[b.t].portee * RX, DEF[b.t].portee * RY, 0, 0, 6.2832);
      traces++;
    }
    c.stroke();

    /* L'ANGLE MORT. Le Frelon et le Pilon ne peuvent pas tirer sous une
       certaine distance : sans ce second cercle, le joueur n'a aucun
       moyen de savoir où se mettre à l'abri, alors que c'est justement
       la façon de les neutraliser.
       Cyan et en pointillés, pas vert : sur l'herbe, un trait vert est
       invisible — mesuré, il ne se détachait pas du sol. Le cyan tient
       sur l'herbe comme sur le sable, et les pointillés le distinguent
       au premier coup d'œil du trait plein de la portée. */
    c.strokeStyle = "rgba(125,230,255,.75)";
    c.lineWidth = Math.max(1.6 / cam.z, 1.4);
    if(c.setLineDash) c.setLineDash([Math.max(6 / cam.z, 7), Math.max(5 / cam.z, 6)]);
    c.beginPath();
    var mortes = 0;
    for(var im = 0; im < jeu.batiments.length && mortes < 90; im++){
      var bm = jeu.batiments[im];
      var fm = DEF[bm.t];
      if(!bm.vivant || !fm.porteeMin) continue;
      if(!visible(vue, bm.gx, bm.gy)) continue;
      var pm = iso(bm.gx, bm.gy);
      c.moveTo(pm.x + fm.porteeMin * RX, pm.y);
      c.ellipse(pm.x, pm.y, fm.porteeMin * RX, fm.porteeMin * RY, 0, 0, 6.2832);
      mortes++;
    }
    c.stroke();
    if(c.setLineDash) c.setLineDash([]);
  }
  c.restore();
  repereEcran(c);

  if(!viseur.actif) return;
  var w = versMonde(cam, viseur.x, viseur.y);
  /* Le rayon d'aperçu se LIT dans CAP : la chaîne de ternaires qui
     traînait ici oubliait cryo, nova et poulets, et leur affichait un
     cercle de 1,2 case pour une zone qui en couvre 4. */
  var r = VISEE_RAYON[m] !== undefined ? VISEE_RAYON[m] : (CAP[m] && CAP[m].rayon) || 1.2;
  var pe = versEcran(cam, w.gx, w.gy);
  var coul = VISEE_COUL[m] || "#ff8a1e";
  c.save();
  c.globalAlpha = 0.85;
  c.strokeStyle = coul; c.lineWidth = 2.2;
  c.beginPath(); c.ellipse(pe.x, pe.y, r * RX * cam.z, r * RY * cam.z, 0, 0, 6.2832); c.stroke();
  c.globalAlpha = 0.18;
  c.fillStyle = coul;
  c.beginPath(); c.ellipse(pe.x, pe.y, r * RX * cam.z, r * RY * cam.z, 0, 0, 6.2832); c.fill();
  c.globalAlpha = 0.9;
  c.strokeStyle = coul; c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(pe.x - 14, pe.y); c.lineTo(pe.x + 14, pe.y);
  c.moveTo(pe.x, pe.y - 8); c.lineTo(pe.x, pe.y + 8);
  c.stroke();
  c.restore();

}

/* ---------------------------------------------------------------
   Boucle de rendu
   --------------------------------------------------------------- */
/* LA FORCE DES SECOUSSES, À UN SEUL ENDROIT.

   Une dizaine de coups en ajoutent — obus, effondrement d'une tour,
   Nova, geyser, chute du Brasier — chacun avec son propre plafond, de
   6 à 30. Régler ça en touchant les dix sites reviendrait à refaire
   l'équilibre entre eux ; ce qu'on veut n'est pas de changer QUI
   secoue le plus, c'est de baisser le tout d'un même geste. Le seul
   endroit où la valeur devient des pixels est ici : un facteur y
   suffit, et l'équilibre entre les sources reste intact.

   À moitié, parce qu'un salon plein secoue sans arrêt : chaque joueur
   ajoute ses propres impacts au même écran, et ce qui est juste à un
   joueur devient un tremblement continu à huit. Le geste garde tout
   son punch — il est simplement deux fois moins ample. */
var FORCE_SECOUSSE = 0.5;
function rendu(tps, dt){
  secX = 0; secY = 0;
  if(jeu.secousse > 0){
    secX = (Math.random() - 0.5) * jeu.secousse * FORCE_SECOUSSE;
    secY = (Math.random() - 0.5) * jeu.secousse * FORCE_SECOUSSE;
  }
  repereEcran(ctx);
  ctx.clearRect(-40, -40, W + 80, H + 80);

  var vue = rectVisible(0);

  /* ---- mer et terrain, dans le repère du monde ---- */
  repereMonde(ctx);
  var mer = coteVisible(vue);
  if(mer) dessineEau(ctx, tps, vue);
  dessineSol(ctx, vue);
  if(mer){ dessineEcume(ctx, tps); dessineRessac(ctx, tps); }
  dessineZonesSol(ctx, tps);
  /* La brume rampe AU SOL, donc sous les objets ; le ciel d'orage
     assombrit le terrain avant qu'on y pose quoi que ce soit. */
  if(carteOrageuse(jeu.index)){
    repereEcran(ctx);
    dessineCielOrage(ctx, tps);
    dessineBrumeSol(ctx, tps);
    repereMonde(ctx);
  }else{
    /* LE CIEL DES CINQ AUTRES ÎLES. Pas de nappe d ombres ni de brume
       — il fait beau —, mais les ombres portées des nuages, oui : ce
       sont elles qui rattachent une masse du ciel au sol qu elle
       survole. Sans elles, un nuage flotte comme un autocollant.
       Un tiers de l opacité de l orage : elle ne prévient de rien
       ici, elle donne du relief. */
    repereEcran(ctx);
    dessineOmbresNuages(ctx, tps, 0.18);
    repereMonde(ctx);
  }
  repereEcran(ctx);

  /* ---- entités triées en profondeur ---- */
  pile.length = 0;
  var i;
  var vueL = rectVisible(0);
  /* décor : rochers, falaises et végétation, dans le tri de profondeur */
  decorVisible(vueL, pile);
  /* On compte au passage les tourelles visibles : c'est ce compte qui
     décide si les tourelles au repos passent en sprite gelé. Compter
     ici, AVANT de dessiner, garantit que toute l'image est cohérente. */
  var nbTour = 0;
  for(i = 0; i < jeu.batiments.length; i++){
    var b = jeu.batiments[i];
    if(!b.vivant) continue;
    if(!visible(vueL, b.gx, b.gy)) continue;
    if(DEF[b.t].tourelle && !SANS_GEL[b.t]) nbTour++;
    pile.push({ d:b.gx + b.gy, k:0, o:b });
  }
  majBudgetTourelles(nbTour);
  /* Les geysers entrent dans le TRI DE PROFONDEUR comme tout ce qui
     est posé au sol : une colonne de feu doit passer devant ce qui est
     au nord d'elle et derrière ce qui est au sud, sinon elle flotte. */
  for(i = 0; i < jeu.geysers.length; i++){
    var gy2 = jeu.geysers[i];
    if(!visible(vueL, gy2.gx, gy2.gy)) continue;
    pile.push({ d:gy2.gx + gy2.gy, k:12, o:gy2 });
  }
  for(i = 0; i < jeu.unites.length; i++){
    var u = jeu.unites[i];
    if(!visible(vueL, u.gx, u.gy)) continue;
    pile.push({ d:u.gx + u.gy, k:1, o:u });
  }
  for(i = 0; i < jeu.poulets.length; i++){
    var pl = jeu.poulets[i];
    if(!visible(vueL, pl.gx, pl.gy)) continue;
    pile.push({ d:pl.gx + pl.gy, k:10, o:pl });
  }
  /* LE SEUIL DES BESTIOLES. La jungle en porte près de huit cents, et
     à z 0,16 une luciole de quatre unités locales fait moins d'un
     pixel : elle coûte son dessin complet pour ne rien montrer.
     Mesuré : 85 ms d'image rien que pour elles à cette distance, le
     poste le plus cher devant les défenses.
     Les insectes tombent les premiers — ils sont les plus petits et
     les plus nombreux —, les mammifères tiennent plus longtemps, et
     les créatures hostiles ne tombent JAMAIS : un sanglier qui charge
     doit se voir, quel que soit le zoom. */
  var zc = cam.z;
  for(i = 0; i < jeu.creatures.length; i++){
    var k2 = jeu.creatures[i];
    if(k2.pv <= 0) continue;
    if(!visible(vueL, k2.gx, k2.gy)) continue;
    if(zc < 0.34 && CRE[k2.t].vole && CRE[k2.t].fuit) continue;
    if(zc < 0.22 && CRE[k2.t].fuit && !CRE[k2.t].protege) continue;
    pile.push({ d:k2.gx + k2.gy, k:2, o:k2 });
  }
  /* unités grises des autres joueurs */
  for(var idj in autresJoueurs){
    var j = autresJoueurs[idj];
    for(var q = 0; q < j.unites.length; q++){
      var g = j.unites[q];
      if(!visible(vueL, g.gx, g.gy)) continue;
      pile.push({ d:g.gx + g.gy, k:3, o:g });
    }
    if(j.fantome && visible(vueL, j.fantome.gx, j.fantome.gy))
      pile.push({ d:j.fantome.gx + j.fantome.gy, k:4, o:j.fantome });
  }
  if(jeu.fantome) pile.push({ d:jeu.fantome.gx + jeu.fantome.gy, k:4, o:jeu.fantome });
  for(i = 0; i < jeu.projectiles.length; i++){
    var pr = jeu.projectiles[i];
    if(!visible(vueL, pr.gx, pr.gy)) continue;
    pile.push({ d:pr.gx + pr.gy + 0.3, k:5, o:pr });
  }
  for(i = 0; i < jeu.effets.length; i++){
    var ef = jeu.effets[i];
    if(!visible(vueL, ef.gx, ef.gy)) continue;
    pile.push({ d:ef.gx + ef.gy + 0.2, k:6, o:ef });
  }
  for(i = 0; i < jeu.brouillards.length; i++){
    pile.push({ d:jeu.brouillards[i].gx + jeu.brouillards[i].gy + 0.4, k:7, o:jeu.brouillards[i] });
  }
  /* navettes de débarquement : elles sont à cheval sur l'eau et le sable */
  for(i = 0; i < jeu.navettes.length; i++){
    var nv = jeu.navettes[i];
    if(!visible(vueL, nv.gx, nv.gy)) continue;
    pile.push({ d:nv.gx + nv.gy - 0.2, k:11, o:nv });
  }
  /* Le Brasier coûte deux sprites 700×700 et une soixantaine de foyers :
     il n'a rien à faire dans la pile quand il est hors champ. Sa marge
     est large — la forteresse dépasse très haut au-dessus de sa case. */
  {
    var pq = iso(jeu.qg.gx, jeu.qg.gy);
    /* La forteresse monte de ~600 unités monde AU-DESSUS de sa case et
       n'en descend que d'une centaine : les marges verticales doivent
       donc être dissymétriques dans CE sens-là. Inversées, elles
       escamotaient le Brasier alors qu'il était encore à l'écran. */
    if(pq.x > vueL.x0 - 480 && pq.x < vueL.x1 + 480 &&
       pq.y > vueL.y0 - 120 && pq.y < vueL.y1 + 700)
      pile.push({ d:jeu.qg.gx + jeu.qg.gy, k:8, o:jeu.qg });
  }

  /* L'AURA DE PUISSANCE, AVANT LA PILE — donc au SOL, sous tout le
     monde, comme une ombre. Voir dessineAuras. */
  dessineAuras(ctx, tps);

  pile.sort(function(a, b2){ return a.d - b2.d; });
  for(i = 0; i < pile.length; i++){
    var it = pile[i];
    switch(it.k){
      case 0: dessineBatiment(ctx, it.o, tps, cam.z); break;
      case 1: dessineUniteMonde(ctx, it.o, tps); break;
      case 2: dessineCreature(ctx, it.o, tps); break;
      case 3: dessineUniteGrise(ctx, it.o); break;
      case 4: dessineFantome(ctx, it.o, tps); break;
      case 5: dessineProjectile(ctx, it.o, tps); break;
      case 6: dessineEffet(ctx, it.o, tps); break;
      case 7: dessineBrouillard(ctx, it.o, tps); break;
      case 8: dessineQG(ctx, tps); dessineBouclierQG(ctx, tps);
              dessineYeuxVengeance(ctx, tps); break;
      case 9: dessineDecorMonde(ctx, it); break;
      case 10: dessinePouletMonde(ctx, it.o, tps); break;
      case 11: dessineNavette(ctx, it.o, tps); break;
      case 12: dessineGeyserMonde(ctx, it.o, tps); break;
    }
  }
  if(jeu.balise) dessineFusee(ctx, tps);

  /* étiquettes des autres joueurs */
  for(var idj2 in autresJoueurs){
    var j2 = autresJoueurs[idj2];
    if(!j2.unites.length) continue;
    var mx = 0, my = 0;
    for(var m = 0; m < j2.unites.length; m++){ mx += j2.unites[m].gx; my += j2.unites[m].gy; }
    mx /= j2.unites.length; my /= j2.unites.length;
    if(!visible(vueL, mx, my)) continue;
    var pe = versEcran(cam, mx, my);
    texteCerne(ctx, j2.nom + " · " + j2.n, pe.x, pe.y - 62 * cam.z,
               Math.max(10, 12 * cam.z), "#c9c2ce");
  }

  /* L'ORAGE, par-dessus la carte : la pluie et les éclairs sont dans
     l'air, rien au sol ne peut les masquer.

     L'ORDRE EST CELUI DU CIEL, du plus loin au plus près :
       le voile d'air, qui teinte tout ce qu'il y a derrière ;
       les trois nuages, qui flottent dedans ;
       les lueurs de la végétation — des lumières posées dans les
         feuillages, donc sous la pluie et non dedans ;
       les éclairs ;
       la pluie enfin, qui tombe devant tout le reste.
     Ces cinq appels étaient jusqu'ici enchaînés en cascade les uns
     depuis les autres, par filet de sécurité. Les appeler ici les
     remet dans le bon ordre ; les filets se désarment d'eux-mêmes,
     chacun refusant de repeindre deux fois le même instant. */
  if(carteOrageuse(jeu.index)){
    repereEcran(ctx);
    dessineVoileOrage(ctx, tps);
    dessineNuagesJungle(ctx, tps);
    dessineLueursVegetation(ctx, tps);
    for(var ie = 0; ie < jeu.eclairs.length; ie++) dessineEclairJungle(ctx, jeu.eclairs[ie], tps);
    dessinePluieJungle(ctx, tps);
  }else{
    /* La masse, en l air, au-dessus de tout le reste du décor. */
    repereEcran(ctx);
    dessineNuagesJungle(ctx, tps, 1);
  }

  /* Les rayons de Mily passent AU-DESSUS de toute la carte : c'est de
     la lumière dans l'air, rien ne peut la masquer. */
  if(jeu.vengeance) dessineRayonsVengeance(ctx, tps);

  /* visée */
  repereEcran(ctx);
  dessineVisee(ctx, tps);

  /* la coupure de courant : elle passe devant tout le reste */
  if(jeu.coupure > 0) dessineCoupure(ctx, tps);

  /* Gégé la belette, puis Tweety le canari */
  if(jeu.messageGege > 0) dessineGege(ctx, tps);
  if(jeu.messageTweety > 0) dessineTweetyDeuil(ctx, tps);

  /* la vengeance de Mily : le message, puis la vignette rouge */
  if(jeu.vengeance) dessineMessageVengeance(ctx, tps);

  /* séquence finale */
  if(jeu.fin) dessineFin(ctx, tps);

  /* minicarte */
  majMinicarte(tps);
}

/* ---------------------------------------------------------------
   « Elle est où Tweety ? Elle nous manque à tous. »
   Aucune accusation, aucun « vous avez tué » : le deuil est collectif
   et l'absurde vient de là.
   --------------------------------------------------------------- */
function dessineTweetyDeuil(c, tps){
  var t = 1 - jeu.messageTweety / 3;
  repereEcran(c);
  c.fillStyle = "rgba(6,8,16," + (0.50 * Math.min(1, (1 - t) * 2.2)) + ")";
  c.fillRect(0, 0, W, H);

  var ent = Math.min(1, t / 0.24);
  var mont = 1 - Math.exp(-ent * 5);            // le texte monte et se pose
  var sortie = t > 0.86 ? (t - 0.86) / 0.14 : 0;
  var alpha = 1 - sortie;

  c.save();
  c.globalAlpha = alpha;
  c.translate(W / 2, H * 0.44 + (1 - mont) * 70 + sortie * 30);
  var taille = Math.min(W * 0.072, H * 0.108);
  c.font = "900 " + taille + "px 'Trebuchet MS', 'Segoe UI', sans-serif";
  c.textAlign = "center"; c.textBaseline = "middle";
  c.lineJoin = "round";

  /* halo froid : ce n'est pas une explosion, c'est un chagrin */
  c.save();
  c.globalCompositeOperation = "lighter";
  var gh = c.createRadialGradient(0, 0, taille * 0.2, 0, 0, taille * 5.5);
  gh.addColorStop(0, "rgba(255,225,120,.26)");
  gh.addColorStop(1, "rgba(255,200,60,0)");
  c.fillStyle = gh;
  c.beginPath(); c.arc(0, 0, taille * 5.5, 0, 6.2832); c.fill();
  c.restore();

  var lignes = ["Elle est où Tweety ?", "Elle nous manque à tous."];
  for(var i = 0; i < 2; i++){
    var y = (i - 0.5) * taille * 1.2;
    c.lineWidth = taille * 0.22; c.strokeStyle = "#120e04";
    c.strokeText(lignes[i], 0, y);
    var g = c.createLinearGradient(0, y - taille * 0.55, 0, y + taille * 0.55);
    g.addColorStop(0, "#fff6c8");
    g.addColorStop(0.5, "#ffd21e");
    g.addColorStop(1, "#d99a10");
    c.fillStyle = g;
    c.fillText(lignes[i], 0, y);
  }

  /* une plume jaune qui descend en tournoyant */
  c.save();
  c.translate(Math.sin(tps * 1.3) * taille * 1.6, -taille * 2.0 + t * taille * 4.4);
  c.rotate(Math.sin(tps * 2.1) * 0.7);
  c.globalAlpha = alpha * 0.95;
  c.fillStyle = "#ffd21e";
  c.beginPath();
  c.ellipse(0, 0, taille * 0.09, taille * 0.28, 0, 0, 6.2832);
  c.fill();
  c.strokeStyle = "rgba(160,110,10,.6)"; c.lineWidth = Math.max(1, taille * 0.014);
  c.beginPath(); c.moveTo(0, -taille * 0.26); c.lineTo(0, taille * 0.26); c.stroke();
  c.restore();
  c.restore();
}

/* ---------------------------------------------------------------
   « PROTECTION DU QG DÉSACTIVÉE »
   Le moment le plus important de la partie : le Brasier vient de
   devenir attaquable. Ça ne peut pas passer dans le petit bandeau
   ordinaire — il faut que le joueur lève la tête. Deux secondes et
   demie, en travers de l'écran, avec le grésillement d'un néon qui
   claque et qui meurt.
   --------------------------------------------------------------- */
function dessineCoupure(c, tps){
  var t = 1 - jeu.coupure / 2.6;                   // 0 → 1
  repereEcran(c);
  var ent = Math.min(1, t / 0.12);                 // arrivée quasi instantanée
  var sortie = t > 0.80 ? (t - 0.80) / 0.20 : 0;
  var vis = ent * (1 - sortie);
  if(vis <= 0.01) return;

  /* le noir qui tombe : l'île perd son courant, l'écran s'assombrit
     brièvement puis se rallume */
  c.fillStyle = "rgba(2,6,14," + (0.42 * Math.sin(Math.min(1, t / 0.5) * Math.PI)) + ")";
  c.fillRect(0, 0, W, H);

  /* le néon : il claque deux fois avant de tenir, comme un disjoncteur */
  var claque = t < 0.30 ? (Math.sin(t * 78) > -0.25 ? 1 : 0.18) : 1;
  var y = H * 0.21;                                // haut : le Brasier reste visible
  var s = "PROTECTION DU QG DÉSACTIVÉE";
  var taille = Math.min(W * 0.062, H * 0.088);

  c.save();
  c.globalAlpha = vis * claque;
  c.textAlign = "center"; c.textBaseline = "middle";
  c.lineJoin = "round";
  /* La phrase est longue : sur un écran étroit — une tablette en
     portrait — elle déborderait des deux côtés. On la mesure et on
     rétrécit jusqu'à ce qu'elle tienne, plutôt que de la couper. */
  c.font = "900 " + taille + "px 'Trebuchet MS', 'Segoe UI', sans-serif";
  var lgT = c.measureText(s).width;
  if(lgT > W * 0.88){
    taille *= W * 0.88 / lgT;
    c.font = "900 " + taille + "px 'Trebuchet MS', 'Segoe UI', sans-serif";
  }

  /* barre électrique derrière le texte */
  c.save();
  c.globalCompositeOperation = "lighter";
  var gbar = c.createLinearGradient(0, y, W, y);
  gbar.addColorStop(0.00, "rgba(60,150,255,0)");
  gbar.addColorStop(0.50, "rgba(150,225,255,.30)");
  gbar.addColorStop(1.00, "rgba(60,150,255,0)");
  c.fillStyle = gbar;
  c.fillRect(0, y - taille * 0.86, W, taille * 1.72);
  c.restore();

  c.lineWidth = Math.max(4, taille * 0.20);
  c.strokeStyle = "#04121f";
  c.strokeText(s, W / 2, y);
  var gt = c.createLinearGradient(0, y - taille * 0.6, 0, y + taille * 0.6);
  gt.addColorStop(0, "#ffffff");
  gt.addColorStop(0.5, "#c9f2ff");
  gt.addColorStop(1, "#6cc2ff");
  c.fillStyle = gt;
  c.fillText(s, W / 2, y);

  /* les arcs qui courent le long du texte pendant qu'il claque */
  c.save();
  c.globalCompositeOperation = "lighter";
  var lg = c.measureText(s).width;
  var alC = prng(4051);
  c.strokeStyle = "rgba(200,246,255,.85)";
  c.lineWidth = Math.max(1, taille * 0.045);
  c.lineCap = "round";
  for(var i = 0; i < 11; i++){
    /* de courtes étincelles qui filent le long du mot, pas des gribouillis :
       de longs zigzags lisaient comme des débris posés sur le texte */
    var x0 = W / 2 - lg / 2 + ((alC() + tps * 0.55) % 1) * lg;
    var y0 = y + (alC() - 0.5) * taille * 1.25;
    var dir = alC() < 0.5 ? -1 : 1;
    c.beginPath(); c.moveTo(x0, y0);
    for(var k = 1; k <= 3; k++)
      c.lineTo(x0 + dir * k * taille * 0.11,
               y0 + (k % 2 ? 1 : -1) * taille * 0.075);
    c.stroke();
  }
  c.restore();

  /* la ligne qui dit quoi faire, une fois le titre posé */
  if(t > 0.22){
    c.globalAlpha = vis * Math.min(1, (t - 0.22) / 0.18);
    texteCerne(c, "Le Brasier est vulnérable — à l'assaut !",
               W / 2, y + taille * 1.15, taille * 0.40, "#ffd98a", "center");
  }
  c.restore();
}

/* ---------------------------------------------------------------
   « Oh non, vous avez tué Gégé la belette ! »
   --------------------------------------------------------------- */
function dessineGege(c, tps){
  var t = 1 - jeu.messageGege / 3;                 // 0 → 1 sur les trois secondes
  repereEcran(c);
  /* voile sombre qui s'estompe */
  c.fillStyle = "rgba(10,4,14," + (0.45 * Math.min(1, (1 - t) * 2.2)) + ")";
  c.fillRect(0, 0, W, H);
  /* rebond élastique à l'entrée, fuite vers le haut à la sortie */
  var ent = Math.min(1, t / 0.22);
  var ela = 1 + Math.sin(ent * 9) * Math.exp(-ent * 4) * 0.6;
  var sortie = t > 0.86 ? (t - 0.86) / 0.14 : 0;
  var alpha = 1 - sortie;
  c.save();
  c.globalAlpha = alpha;
  c.translate(W / 2, H * 0.44 - sortie * 60);
  c.scale(ela, ela);
  c.rotate(Math.sin(tps * 7) * 0.022);
  var taille = Math.min(W * 0.088, H * 0.13);
  c.font = "900 " + taille + "px 'Trebuchet MS', 'Segoe UI', sans-serif";
  c.textAlign = "center"; c.textBaseline = "middle";
  c.lineJoin = "round";
  /* halo */
  c.save();
  c.globalCompositeOperation = "lighter";
  var g0 = c.createRadialGradient(0, 0, 10, 0, 0, taille * 6);
  g0.addColorStop(0, "rgba(255,140,60,.35)");
  g0.addColorStop(1, "rgba(255,90,20,0)");
  c.fillStyle = g0;
  c.beginPath(); c.arc(0, 0, taille * 6, 0, 6.2832); c.fill();
  c.restore();
  /* le coupable est nommé : « vous » si c'est vous, son pseudo sinon */
  var lignes = (jeu.tueurGege && jeu.tueurGege !== monNom)
    ? [jeu.tueurGege + " a tué", "Gégé la belette !"]
    : ["Oh non, vous avez tué", "Gégé la belette !"];
  for(var i = 0; i < 2; i++){
    var y = (i - 0.5) * taille * 1.15;
    c.lineWidth = taille * 0.24; c.strokeStyle = "#160702";
    c.strokeText(lignes[i], 0, y);
    var g = c.createLinearGradient(0, y - taille * 0.55, 0, y + taille * 0.55);
    g.addColorStop(0, "#fff0c8"); g.addColorStop(0.5, "#ffb03a"); g.addColorStop(1, "#d8401a");
    c.fillStyle = g;
    c.fillText(lignes[i], 0, y);
  }
  /* petite belette fantôme qui monte au ciel */
  c.save();
  c.translate(0, taille * 1.5 - t * taille * 1.6);
  c.globalAlpha = alpha * 0.9;
  c.scale(1.5, 1.5);
  dessineBelette(c, { phase:tps * 8, etat:"fuite" }, tps);
  c.restore();
  c.restore();
}

/* ---------------------------------------------------------------
   La séquence finale
   --------------------------------------------------------------- */
var COULEURS_CONFETTIS = ["#ff5a4a", "#ffd070", "#6ee08a", "#7de6ff", "#c98adf", "#ff8a1e"];
var TEINTES_DEBRIS = ["#6d5a60", "#463a40", "#3a2f34"];

function dessineFin(c, tps){
  var F = jeu.fin;
  repereEcran(c);
  var pq = versEcran(cam, jeu.qg.gx, jeu.qg.gy);
  var z = cam.z;

  /* ---- ondes de choc : trois anneaux qui balaient l'écran ---- */
  for(var w = 0; w < F.ondes.length; w++){
    var on = F.ondes[w];
    if(on.age <= 0) continue;
    var av = Math.max(0, 1 - on.age / 1.5);
    c.save();
    c.globalCompositeOperation = "lighter";
    c.strokeStyle = "rgba(255,226,170," + (0.55 * av * av) + ")";
    c.lineWidth = Math.max(1.5, 26 * av * z);
    c.beginPath();
    c.ellipse(pq.x, pq.y - 60 * z, on.r * z, on.r * z * 0.5, 0, 0, 6.2832);
    c.stroke();
    c.restore();
  }

  /* ---- colonne de fumée : elle s'élève et s'épaissit ---- */
  for(var f2 = 0; f2 < F.colonne.length; f2++){
    var fu = F.colonne[f2];
    var tf = fu.age / fu.duree;
    var af = Math.min(1, fu.age * 3) * (1 - tf) * 0.55;
    var teinte = tf < 0.35 ? "#4a3a3a" : "#6a6068";
    bouffee(c, pq.x + fu.x * z + Math.sin(fu.age * 1.1 + f2) * 14 * z,
            pq.y + (fu.y - 30) * z,
            (fu.r + tf * 26) * z, af, teinte);
  }

  /* flash blanc */
  if(F.flash > 0){
    c.fillStyle = "rgba(255,255,255," + Math.min(1, F.flash) + ")";
    c.fillRect(0, 0, W, H);
  }

  /* ---- boule de feu, juste après la déflagration ---- */
  if(F.tete && F.tete.age < 2.4){
    var tb = F.tete.age / 2.4;
    /* la boule monte à 900 unités monde : à la distance de jeu elle
       remplit l'écran, ce qui est bien le but d'une déflagration */
    var rb = (110 + Math.sqrt(tb) * 900) * z;
    c.save();
    c.globalCompositeOperation = "lighter";
    var ab = (1 - tb) * (1 - tb) * (1 - tb * 0.35);
    var gb = c.createRadialGradient(pq.x, pq.y - 130 * z, rb * 0.08,
                                    pq.x, pq.y - 130 * z, rb);
    gb.addColorStop(0.00, "rgba(255,252,232," + (0.95 * ab) + ")");
    gb.addColorStop(0.22, "rgba(255,206,110," + (0.85 * ab) + ")");
    gb.addColorStop(0.52, "rgba(255,118,28," + (0.60 * ab) + ")");
    gb.addColorStop(0.80, "rgba(190,44,12," + (0.30 * ab) + ")");
    gb.addColorStop(1.00, "rgba(90,16,6,0)");
    c.fillStyle = gb;
    c.beginPath(); c.arc(pq.x, pq.y - 130 * z, rb, 0, 6.2832); c.fill();
    c.restore();
  }

  /* ---- débris : blocs de maçonnerie, certains encore en feu ---- */
  for(var d2 = 0; d2 < F.debris.length; d2++){
    var d = F.debris[d2];
    var ad = Math.min(1, (d.duree - d.age) / 0.8);
    c.save();
    c.globalAlpha = ad;
    c.translate(pq.x + d.x * z, pq.y + d.y * z);
    c.rotate(d.rot);
    var lw = d.w * 1.7 * z;
    c.fillStyle = TEINTES_DEBRIS[d.teinte];
    c.fillRect(-lw / 2, -lw / 3, lw, lw * 0.66);
    c.fillStyle = "rgba(255,255,255,.12)";
    c.fillRect(-lw / 2, -lw / 3, lw, lw * 0.2);
    c.restore();
    if(d.feu && d.age < 2.2){
      c.save();
      c.globalCompositeOperation = "lighter";
      var gf2 = c.createRadialGradient(pq.x + d.x * z, pq.y + d.y * z, 0.5,
                                       pq.x + d.x * z, pq.y + d.y * z, lw * 2.4);
      gf2.addColorStop(0, "rgba(255,190,90," + (0.55 * ad) + ")");
      gf2.addColorStop(1, "rgba(255,110,20,0)");
      c.fillStyle = gf2;
      c.beginPath(); c.arc(pq.x + d.x * z, pq.y + d.y * z, lw * 2.4, 0, 6.2832); c.fill();
      c.restore();
    }
  }
  /* la tête qui décolle */
  if(F.tete && F.tete.age < 3){
    var p = versEcran(cam, jeu.qg.gx, jeu.qg.gy);
    var x = p.x, y = p.y + Y_TETE * cam.z + F.tete.y * cam.z;
    /* traînée de fumée en boules */
    for(var i = 0; i < 14; i++){
      var t = i / 14;
      bouffee(c, x + Math.sin(t * 9 + F.tete.age * 4) * 12 * t,
              y + t * 190 * cam.z, (5 + t * 22) * cam.z, (1 - t) * 0.4, "#6a6068");
    }
    c.save();
    c.translate(x, y);
    c.rotate(F.tete.rot);
    var eg = ECH_GARD * 0.55 * cam.z;
    c.scale(eg, eg);
    /* la gardienne, en version qui louche */
    gardienne3D(c, 0, 0, 1, 1, tps);
    /* yeux barrés d'une croix + bouche de travers */
    c.save();
    c.strokeStyle = "#150f18"; c.lineWidth = 2.2; c.lineCap = "round";
    [VT_YEUX.g, VT_YEUX.d].forEach(function(o){
      c.beginPath(); c.moveTo(o[0] - 4, o[1] - 4); c.lineTo(o[0] + 4, o[1] + 4); c.stroke();
      c.beginPath(); c.moveTo(o[0] + 4, o[1] - 4); c.lineTo(o[0] - 4, o[1] + 4); c.stroke();
    });
    c.strokeStyle = "#8a3a34"; c.lineWidth = 2.6;
    c.beginPath(); c.moveTo(-7, 8); c.quadraticCurveTo(0, 14, 7, 5); c.stroke();
    c.restore();
    c.restore();
  }
  /* confettis */
  if(F.confettis){
    for(var k = 0; k < F.confettis.length; k++){
      var cf = F.confettis[k];
      c.save();
      c.translate(cf.x * W, cf.y * H);
      c.rotate(cf.rot);
      c.fillStyle = COULEURS_CONFETTIS[cf.c];
      c.fillRect(-cf.w / 2, -cf.w / 4, cf.w, cf.w / 2);
      c.restore();
    }
  }
  /* ---- MILY BOUM ! puis le sacre du meilleur contributeur ---- */
  if(F.age >= FIN_SOUFFLE + 1.3){
    var tt = Math.min(1, (F.age - FIN_SOUFFLE - 1.3) / 0.75);
    var ela = 1 + Math.sin(tt * 9) * Math.exp(-tt * 4) * 0.55;
    var osc = Math.sin(F.age * 3) * 0.035;
    /* le titre remonte pour laisser la place au message de victoire, puis
       une seconde fois quand le classement s'installe en bas : les trois
       — explosion, sacre, classement — doivent tenir à l'écran ensemble */
    var monte = Math.min(1, Math.max(0, (F.age - FIN_SOUFFLE - 2.6) / 0.6));
    var monte2 = Math.min(1, Math.max(0, (F.age - 10.5) / 0.8));
    c.save();
    c.translate(W / 2, H * (0.42 - monte * 0.14 - monte2 * 0.12));
    c.scale(ela * (1 - monte * 0.24), ela * (1 - monte * 0.24));
    c.rotate(osc);
    var taille = Math.min(W, H) * 0.155;
    c.font = "900 " + taille + "px 'Trebuchet MS', 'Segoe UI', sans-serif";
    c.textAlign = "center"; c.textBaseline = "middle";
    c.lineJoin = "round"; c.lineWidth = taille * 0.22;
    c.strokeStyle = "#180a04";
    c.strokeText("MILY BOUM !", 0, 0);
    var g = c.createLinearGradient(0, -taille * 0.6, 0, taille * 0.6);
    g.addColorStop(0, "#ffe6a8"); g.addColorStop(0.5, "#ff8a1e"); g.addColorStop(1, "#e0431a");
    c.fillStyle = g;
    c.fillText("MILY BOUM !", 0, 0);
    if(monte < 0.5){
      c.globalAlpha = 1 - monte * 2;
      c.font = "700 " + (taille * 0.26) + "px 'Trebuchet MS', sans-serif";
      c.lineWidth = taille * 0.07;
      c.strokeText("la gardienne a décollé", 0, taille * 0.68);
      c.fillStyle = "#ffd9a8";
      c.fillText("la gardienne a décollé", 0, taille * 0.68);
    }
    c.restore();
  }

  /* ---- le sacre : qui a le plus contribué, et ce que Mily lui offre ---- */
  if(F.age >= FIN_SOUFFLE + 2.8 && F.champion){
    var tv = Math.min(1, (F.age - FIN_SOUFFLE - 2.8) / 0.7);
    var elv = 1 + Math.sin(tv * 8.5) * Math.exp(-tv * 4.2) * 0.5;
    var lignes = texteVictoire(jeu.index, F.champion.nom);
    var mv = Math.min(1, Math.max(0, (F.age - 10.5) / 0.8));
    c.save();
    c.translate(W / 2, H * (0.56 - mv * 0.14));
    c.scale(elv * (1 - mv * 0.12), elv * (1 - mv * 0.12));
    c.rotate(Math.sin(F.age * 2.2) * 0.018);
    var tv2 = Math.min(W * 0.052, H * 0.078);
    c.textAlign = "center"; c.textBaseline = "middle";
    c.lineJoin = "round";

    /* écusson doré derrière le texte */
    c.save();
    c.globalCompositeOperation = "lighter";
    var gs = c.createRadialGradient(0, 0, tv2 * 0.4, 0, 0, tv2 * 7);
    gs.addColorStop(0, "rgba(255,214,120,.30)");
    gs.addColorStop(1, "rgba(255,150,40,0)");
    c.fillStyle = gs;
    c.beginPath(); c.arc(0, 0, tv2 * 7, 0, 6.2832); c.fill();
    c.restore();

    /* couronne de laurier, deux arcs de feuilles */
    c.strokeStyle = "rgba(255,206,110,.85)";
    c.lineWidth = Math.max(2, tv2 * 0.09);
    [-1, 1].forEach(function(sn){
      c.beginPath();
      c.arc(0, tv2 * 0.1, tv2 * 4.6, sn > 0 ? -0.9 : Math.PI + 0.9,
            sn > 0 ? 0.9 : Math.PI - 0.9, sn < 0);
      c.stroke();
      for(var lf = 0; lf < 7; lf++){
        var al2 = (-0.8 + lf * 0.266) * sn + (sn < 0 ? Math.PI : 0);
        var lx = Math.cos(al2) * tv2 * 4.6, ly = tv2 * 0.1 + Math.sin(al2) * tv2 * 4.6;
        c.save();
        c.translate(lx, ly); c.rotate(al2 + 1.57);
        c.fillStyle = "rgba(255,196,84,.8)";
        c.beginPath(); c.ellipse(0, 0, tv2 * 0.34, tv2 * 0.13, 0, 0, 6.2832); c.fill();
        c.restore();
      }
    });

    /* première ligne : le pseudo, en grand */
    c.font = "900 " + (tv2 * 1.18) + "px 'Trebuchet MS', 'Segoe UI', sans-serif";
    c.lineWidth = tv2 * 0.26; c.strokeStyle = "#1a0e02";
    c.strokeText(lignes[0], 0, -tv2 * 0.62);
    var g2 = c.createLinearGradient(0, -tv2 * 1.2, 0, tv2 * 0.1);
    g2.addColorStop(0, "#fff6d4"); g2.addColorStop(0.5, "#ffcf4e"); g2.addColorStop(1, "#e08a12");
    c.fillStyle = g2;
    c.fillText(lignes[0], 0, -tv2 * 0.62);

    /* seconde ligne : la récompense, propre à l'île */
    c.font = "800 " + (tv2 * 0.74) + "px 'Trebuchet MS', 'Segoe UI', sans-serif";
    c.lineWidth = tv2 * 0.20;
    c.strokeText(lignes[1], 0, tv2 * 0.72);
    c.fillStyle = "#ffe9b8";
    c.fillText(lignes[1], 0, tv2 * 0.72);
    c.restore();
  }
}

/* ---------------------------------------------------------------
   Minicarte
   --------------------------------------------------------------- */
function construitFondMini(){
  var w = 264, h = 236;
  miniFond = nouveauCanvas(w, h);
  var c = miniFond.getContext("2d");
  var b = BIOMES[carte.biome];
  c.fillStyle = "#0d2634"; c.fillRect(0, 0, w, h);
  c.fillStyle = b.sol2; c.fillRect(2, 2, w - 4, h - 4);
  c.fillStyle = "#e3cd9c";
  c.fillRect(2 + (PLAGE_X0 / GW) * (w - 4), 2, (1 - PLAGE_X0 / GW) * (w - 4), h - 4);
  redessineFondMini();
}
function redessineFondMini(){
  if(!miniFond) return;
  var c = miniFond.getContext("2d");
  var w = miniFond.width, h = miniFond.height;
  var b = BIOMES[carte.biome];
  c.fillStyle = "#0d2634"; c.fillRect(0, 0, w, h);
  c.fillStyle = b.sol2; c.fillRect(2, 2, w - 4, h - 4);
  c.fillStyle = "#e3cd9c";
  c.fillRect(2 + (PLAGE_X0 / GW) * (w - 4), 2, (1 - PLAGE_X0 / GW) * (w - 4), h - 4);
  for(var i = 0; i < jeu.batiments.length; i++){
    var bt = jeu.batiments[i];
    if(!bt.vivant) continue;
    c.fillStyle = DEF[bt.t].portee ? "#c0453a" : "#7a6a52";
    c.fillRect(2 + bt.gx / GW * (w - 4) - 1.5, 2 + bt.gy / GH * (h - 4) - 1.5, 3, 3);
  }
}
function majMinicarte(tps){
  if(!miniCtx || !miniFond) return;
  if(tps > miniProchain){ miniProchain = tps + 0.7; redessineFondMini(); }
  var w = miniCv.width, h = miniCv.height;
  miniCtx.clearRect(0, 0, w, h);
  miniCtx.drawImage(miniFond, 0, 0, w, h);
  function px(gx, gy){ return { x:2 + gx / GW * (w - 4), y:2 + gy / GH * (h - 4) }; }
  /* QG */
  var q = px(jeu.qg.gx, jeu.qg.gy);
  miniCtx.fillStyle = "#ff8a1e";
  miniCtx.beginPath(); miniCtx.arc(q.x, q.y, 6, 0, 6.2832); miniCtx.fill();
  miniCtx.strokeStyle = "#ffe0a0"; miniCtx.lineWidth = 1.6;
  miniCtx.beginPath(); miniCtx.arc(q.x, q.y, 8 + Math.sin(tps * 3) * 1.6, 0, 6.2832); miniCtx.stroke();
  /* LES CINQ CELLULES ÉLECTRIQUES.
     Elles sont aux quatre extrémités et au centre d'une île de 152×136
     cases : sans repère, le joueur passe la partie à les chercher au
     lieu de les attaquer. On trace donc leur câble jusqu'au Brasier et
     on marque chaque cellule — vive, elle bat en bleu électrique ;
     détruite, il ne reste qu'une croix éteinte, pour qu'on sache d'un
     coup d'œil combien il en reste et de quel côté. */
  if(jeu.cables && jeu.cables.length){
    miniCtx.save();
    miniCtx.lineWidth = 1;
    for(var ic = 0; ic < jeu.cables.length; ic++){
      var cb = jeu.cables[ic];
      miniCtx.strokeStyle = cb.morte ? "rgba(120,116,130,.35)" : "rgba(110,200,255,.45)";
      miniCtx.beginPath();
      for(var kc = 0; kc < cb.pts.length; kc += 3){
        var pc = px(cb.pts[kc].gx, cb.pts[kc].gy);
        if(kc === 0) miniCtx.moveTo(pc.x, pc.y); else miniCtx.lineTo(pc.x, pc.y);
      }
      miniCtx.stroke();
    }
    for(var ir = 0; ir < jeu.reacteurs.length; ir++){
      var rr = jeu.reacteurs[ir], pr = px(rr.gx, rr.gy);
      if(rr.bat.vivant){
        var bp = 0.5 + 0.5 * Math.sin(tps * 4 + ir);
        miniCtx.fillStyle = "rgba(140,225,255," + (0.55 + bp * 0.45) + ")";
        miniCtx.beginPath(); miniCtx.arc(pr.x, pr.y, 4, 0, 6.2832); miniCtx.fill();
        miniCtx.strokeStyle = "rgba(230,250,255,.9)"; miniCtx.lineWidth = 1.3;
        miniCtx.beginPath(); miniCtx.arc(pr.x, pr.y, 5.5 + bp * 2, 0, 6.2832); miniCtx.stroke();
      }else{
        miniCtx.strokeStyle = "rgba(150,146,158,.75)"; miniCtx.lineWidth = 1.4;
        miniCtx.beginPath();
        miniCtx.moveTo(pr.x - 3, pr.y - 3); miniCtx.lineTo(pr.x + 3, pr.y + 3);
        miniCtx.moveTo(pr.x + 3, pr.y - 3); miniCtx.lineTo(pr.x - 3, pr.y + 3);
        miniCtx.stroke();
      }
    }
    miniCtx.restore();
  }
  /* unités */
  miniCtx.fillStyle = "#7de6ff";
  for(var i = 0; i < jeu.unites.length; i++){
    var p = px(jeu.unites[i].gx, jeu.unites[i].gy);
    miniCtx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
  }
  miniCtx.fillStyle = "#b9b2c0";
  for(var id in autresJoueurs){
    var j = autresJoueurs[id];
    for(var k = 0; k < j.unites.length; k++){
      var p2 = px(j.unites[k].gx, j.unites[k].gy);
      miniCtx.fillRect(p2.x - 1.5, p2.y - 1.5, 3, 3);
    }
  }
  /* rectangle de vue */
  var v = rectVisible(0);
  var a = deIso(v.x0, v.y0), b2 = deIso(v.x1, v.y0), c2 = deIso(v.x1, v.y1), d2 = deIso(v.x0, v.y1);
  miniCtx.strokeStyle = "rgba(255,255,255,.7)"; miniCtx.lineWidth = 1.4;
  miniCtx.beginPath();
  [a, b2, c2, d2].forEach(function(pt, n){
    var e = px(borne(pt.gx, 0, GW), borne(pt.gy, 0, GH));
    if(n === 0) miniCtx.moveTo(e.x, e.y); else miniCtx.lineTo(e.x, e.y);
  });
  miniCtx.closePath(); miniCtx.stroke();
}

/* ================================================================
   L'AURA DE PUISSANCE

   Ce qu'elle doit dire : ce combattant-là frappe plus fort que les
   autres, et de plus en plus fort. Ce qu'elle ne doit surtout pas
   faire : coûter une image par seconde à une tablette qui en rend
   déjà treize.

   TROIS ÉTATS, PAS DOUZE. auraPuissance() ramène les douze paliers à
   trois marches, parce qu'au zoom de jeu personne ne distingue ×1,40
   de ×1,50 :
     1  un anneau d'énergie posé au sol, discret ;
     2  l'anneau se resserre et se double d'une braise ;
     3  l'enveloppe — la braise monte autour de la troupe et un second
        anneau tourne.

   ELLE EST DIMENSIONNÉE SUR LA TROUPE, jamais sur une constante.
   L'Ogre a un rayon de 1,6 et une échelle de 3, la Furie un rayon de
   0,34 : à taille fixe, l'un porterait un bracelet et l'autre
   disparaîtrait dans un soleil. Le rayon de l'anneau est donc
   « rayon × 2,2 + 0,35 », ce qui donne 1,1 case pour une Furie, 1,3
   pour un Commando et 3,9 pour un Ogre — le rapport de leurs tailles,
   et pas davantage.

   LE PRIX, ET LA SEULE FAÇON DE LE TENIR. Ce fichier a déjà payé la
   leçon deux fois : lueurRapide, avec son save + composite + restore
   à CHAQUE appel, coûtait 2,4 ms par image pour une vingtaine de
   points, et douze sprites doux passent de 0,99 ms à 5,16 ms si le
   lissage reste actif. Ce ne sont pas les pixels qui coûtent, ce sont
   les changements d'état.
   D'où la forme de cette fonction : UN save, UN passage en additif, et
   ensuite tout est GROUPÉ PAR ÉTAT — un seul beginPath/stroke pour
   tous les anneaux d'un même état, un seul globalAlpha pour toutes les
   braises. Cent vingt troupes coûtent alors trois tracés, pas trois
   cents.

   Elle est peinte AVANT la pile triée, donc au sol et sous tout le
   monde : c'est une marque sur la terre, comme une ombre, pas un halo
   collé devant les sprites.
   ================================================================ */
/* ================================================================
   TROIS SPRITES, ET UN SEUL BLIT PAR TROUPE.

   La première écriture peignait tout en direct : une ellipse tracée
   par troupe pour l'anneau, un disque additif pour la braise, trois
   arcs pour l'anneau tournant du plafond. C'était juste, c'était joli,
   et c'était INJOUABLE — mesuré au banc, cent vingt troupes :

       aucun palier   0,01 ms
       état 1         8,92 ms
       état 2        17,40 ms
       état 3        33,31 ms

   Trente-trois millisecondes sur un budget d'image qui en fait
   soixante : l'aura à elle seule coupait le jeu en deux. La cause
   n'est pas le nombre de troupes, c'est la SURFACE : un anneau tracé
   se paie au pixel de contour, et cent vingt anneaux de soixante
   pixels de rayon sur deux d'épaisseur, cela fait cent mille pixels
   fondus par image, à comparer aux sept mille de toute la pluie.

   La réponse est celle que ce fichier applique partout ailleurs : on
   PRÉ-REND. Trois sprites, un par état, dessinés une fois pour toutes
   à la construction, puis blittés à l'échelle voulue — lissage coupé,
   destination arrondie. Le fichier météo a la mesure : douze sprites
   doux coûtent 0,99 ms lissage coupé contre 5,16 ms lissage actif.
   Cent vingt petits blits tiennent largement sous la milliseconde.

   Ce qu'on perd : l'anneau du plafond ne tourne plus. Ce qu'on garde :
   la respiration, qui passe par globalAlpha — UNE affectation pour
   les cent vingt troupes d'un même état, pas une par troupe.
   ================================================================ */
var auraSprites = null;
function spritesAura(){
  if(auraSprites) return auraSprites;
  auraSprites = [null];
  /* La tuile est au rapport 2:1 de la projection : l'anneau y est
     déjà couché, on n'a donc rien à écraser au moment de peindre. */
  var T = 128, Hh = 64;
  for(var e = 1; e <= 3; e++){
    var cv = nouveauCanvas(T, Hh);
    var g = cv.getContext("2d");
    var teinte = AURA_TEINTE[e];
    var cx = T / 2, cy = Hh / 2;
    /* le rayon utile est laissé un peu en dedans du bord : un dégradé
       qui touche le bord de sa tuile fait une couture visible quand on
       l'agrandit */
    var R = T * 0.42, Rv = Hh * 0.42;

    /* LA BRAISE, d'abord et dessous : un dégradé radial écrasé. Elle
       n'existe qu'à partir de l'état 2 — au premier palier on veut une
       marque au sol discrète, pas une lueur. */
    if(e >= 2){
      g.save();
      g.translate(cx, cy);
      g.scale(1, Hh / T);
      var gr = g.createRadialGradient(0, 0, 1, 0, 0, R * (e === 3 ? 1.18 : 0.98));
      gr.addColorStop(0, "rgba(" + teinte + "," + (e === 3 ? 0.62 : 0.42) + ")");
      gr.addColorStop(0.55, "rgba(" + teinte + "," + (e === 3 ? 0.30 : 0.18) + ")");
      gr.addColorStop(1, "rgba(" + teinte + ",0)");
      g.fillStyle = gr;
      g.beginPath(); g.arc(0, 0, R * 1.2, 0, 6.2832); g.fill();
      g.restore();
    }

    /* L'ANNEAU. C'est lui la marque : un trait net, posé au sol. */
    /* L'ANNEAU EST PEINT DEUX FOIS : un halo large et sourd, puis un
       trait net par-dessus. C'est ce qui le fait tenir sous le voile
       d'orage de la jungle, qui passe APRÈS lui et le rabotait de
       moitié — un simple trait s'y noyait. */
    g.strokeStyle = "rgba(" + teinte + ",0.22)";
    g.lineWidth = e === 1 ? 8 : 12;
    g.beginPath(); g.ellipse(cx, cy, R, Rv, 0, 0, 6.2832); g.stroke();
    g.strokeStyle = "rgba(" + teinte + "," + (e === 1 ? 0.85 : 1) + ")";
    g.lineWidth = e === 1 ? 3.0 : 4.4;
    g.beginPath(); g.ellipse(cx, cy, R, Rv, 0, 0, 6.2832); g.stroke();

    /* AU PLAFOND, un second anneau au-dehors, en pointillé : c'est ce
       qui distingue « très fort » de « fort » d'un coup d'œil, et il
       ne coûte rien puisqu'il est peint une seule fois. */
    if(e === 3){
      /* DOUZE ÉCLATS COURTS au lieu de six longs : à six, l'anneau
         extérieur se lisait comme six morceaux cassés ; à douze il se
         lit comme une couronne. */
      g.strokeStyle = "rgba(" + teinte + ",0.55)";
      g.lineWidth = 2.4;
      for(var k = 0; k < 12; k++){
        var a0 = k * 0.5236 + 0.12;
        g.beginPath();
        g.ellipse(cx, cy, R * 1.30, Rv * 1.30, 0, a0, a0 + 0.30);
        g.stroke();
      }
      /* L'ENVELOPPE. Trois bâtons verticaux avaient été essayés ici :
         à l'image ce sont des TRAITS, et le joueur a déjà dit ce qu'il
         pensait des traits verticaux sur cette carte. On les remplace
         par une remontée FONDUE — un dégradé qui s'élève de l'anneau
         et s'éteint, sans un seul bord. C'est la seule chose de
         l'aura qui sorte du plan du sol, et donc la seule qui dise
         « ça l'enveloppe » plutôt que « c'est posé dessous ». */
      var gm = g.createLinearGradient(0, cy + Rv * 0.2, 0, cy - Rv * 1.5);
      gm.addColorStop(0, "rgba(" + teinte + ",0.34)");
      gm.addColorStop(0.45, "rgba(" + teinte + ",0.13)");
      gm.addColorStop(1, "rgba(" + teinte + ",0)");
      g.save();
      g.beginPath();
      g.ellipse(cx, cy - Rv * 0.45, R * 0.72, Rv * 1.5, 0, 0, 6.2832);
      g.clip();
      g.fillStyle = gm;
      g.fillRect(0, 0, T, Hh);
      g.restore();
    }
    auraSprites.push(cv);
  }
  return auraSprites;
}

/* Le rayon au sol d'une troupe, en cases. */
/* LE RAYON AU SOL D'UNE TROUPE, en cases — et il est SERRÉ.
   Le premier réglage, « rayon × 2,2 + 0,35 », donnait 3,9 cases pour
   un Ogre, soit cent pixels au zoom de jeu : c'est de là que venait
   l'essentiel du prix, et à l'image l'Ogre traînait une soucoupe.
   « 0,55 + rayon × 0,9 » donne 0,86 case pour une Furie, 0,93 pour un
   Commando et 1,99 pour un Ogre : le rapport de leurs tailles est
   respecté — l'Ogre reste deux fois plus large — pour un quart de la
   surface. */
function rayonAura(type){
  var u = UNI[type] || UNI.commando;
  return 0.55 + u.rayon * 0.9;
}

/* Tableaux de MODULE : cette fonction tourne soixante fois par
   seconde, elle n'a pas le droit d'allouer. Trois listes, une par
   état, chacune en x/y/rayon à plat. */
var auraX = [[], [], [], []], auraY = [[], [], [], []], auraR = [[], [], [], []];
var AURA_TEINTE = ["", "255,168,64", "255,124,40", "168,214,255"];

function dessineAuras(c, tps){
  var e, k, n, i;
  for(e = 1; e <= 3; e++){ auraX[e].length = 0; auraY[e].length = 0; auraR[e].length = 0; }
  var z = cam.z;
  /* en dessous de ce zoom l'anneau d'une Furie fait deux pixels : on
     ne peint plus que le plafond, qui a de gros anneaux */
  var seuil = z < 0.3 ? 3 : 1;

  /* MES troupes */
  var mien = auraPuissance(jeu.palier | 0);
  if(mien >= seuil && jeu.unites){
    for(i = 0; i < jeu.unites.length; i++){
      var u = jeu.unites[i];
      var p = versEcran(cam, u.gx, u.gy);
      if(p.x < -60 || p.x > W + 60 || p.y < -60 || p.y > H + 60) continue;
      auraX[mien].push(p.x); auraY[mien].push(p.y);
      auraR[mien].push(rayonAura(u.type || u.t) * RX * z);
    }
  }
  /* CELLES DES AUTRES, chacune à SON palier : le bonus est individuel,
     et cela doit se voir. Un client d'une version précédente n'envoie
     pas le champ, son palier vaut zéro, et ses troupes restent nues —
     exactement l'état d'avant. */
  for(var idj in autresJoueurs){
    var j = autresJoueurs[idj];
    var ea = auraPuissance(j.palier | 0);
    if(ea < seuil) continue;
    for(k = 0; k < j.unites.length; k++){
      var g2 = j.unites[k];
      var p2 = versEcran(cam, g2.gx, g2.gy);
      if(p2.x < -60 || p2.x > W + 60 || p2.y < -60 || p2.y > H + 60) continue;
      auraX[ea].push(p2.x); auraY[ea].push(p2.y);
      auraR[ea].push(rayonAura(g2.type) * RX * z);
    }
  }
  if(!auraX[1].length && !auraX[2].length && !auraX[3].length) return;

  var sp = spritesAura();
  c.save();
  c.globalCompositeOperation = "lighter";
  /* LISSAGE COUPÉ : le sprite est agrandi, et un agrandissement filtré
     coûte cinq fois le prix. Sur un dégradé aussi doux, l'escalier ne
     se voit pas. */
  c.imageSmoothingEnabled = false;
  /* LA RESPIRATION, commune à tous : une aura d'intensité fixe passe
     pour un décalque, une aura qui bat passe pour de l'énergie. Elle
     est portée par globalAlpha, donc UNE affectation par état et non
     une par troupe — c'est toute la différence entre une milliseconde
     et trente. */
  var bat = 0.78 + 0.22 * Math.sin(tps * 3.4);

  for(e = 1; e <= 3; e++){
    n = auraX[e].length;
    if(!n) continue;
    /* Montée franche : le voile d'orage de la jungle passe APRÈS
       l'aura et lui reprend un tiers de sa force. Ce qu'il reprend,
       on le rend ici. */
    c.globalAlpha = (e === 1 ? 0.80 : e === 2 ? 0.92 : 1) * bat;
    var img = sp[e];
    for(i = 0; i < n; i++){
      /* destination ARRONDIE : sans cela, un sprite agrandi non filtré
         grouille quand la troupe se déplace d'une fraction de pixel */
      var w2 = Math.round(auraR[e][i] * 2.38);
      if(w2 < 6) continue;
      var h2 = Math.round(w2 * 0.5);
      c.drawImage(img, Math.round(auraX[e][i] - w2 / 2),
                       Math.round(auraY[e][i] - h2 / 2), w2, h2);
    }
  }
  c.restore();
}
