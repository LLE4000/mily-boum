#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Décalque une photo de visage en aplats vectoriels.

Le principe : on postérise la photo en N couleurs, on extrait le contour
exact de chaque tache, on le simplifie, puis on écrit le tout dans un
fichier JS que le jeu redessine au trait. Aucune image n'est embarquée :
il n'en sort que des polygones et une palette.

Usage :
  python3 outils/tracer-visage.py photo.jpg sources/51-visage-trace.js
"""
import sys, math
from collections import deque
from PIL import Image, ImageFilter
import numpy as np

# ---- réglages du décalque ----
LARGEUR_TRAVAIL = 260     # résolution de travail
NB_COULEURS     = 30      # aplats
AIRE_MINI       = 22      # taches plus petites : ignorées
EPS_RDP         = 0.82    # simplification des contours

ALPHABET = ("!#$%&()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            "[]^_`abcdefghijklmnopqrstuvwxyz{|}~")
BASE = len(ALPHABET)      # 90


# ================================================================
# Repérage du visage
# ================================================================
def repere_visage(im):
    """Boîte du visage, menton et iris rouges, repérés sur une version
    réduite de la photo pour rester rapide."""
    ech = 700.0 / im.width
    pet = im.resize((700, int(im.height * ech)), Image.LANCZOS)
    a = np.asarray(pet).astype(np.int16)
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    h, w = R.shape

    # peau : proche du teint relevé sur la photo (≈ 220,145,100)
    peau = (R > 150) & (R - G > 38) & (R - G < 130) & (G - B > 8) & (R - B > 55) & (G > 78)
    peau = ferme(peau, 3)
    # on ne garde que la plus grosse composante du centre de l'image
    lab, tailles = composantes(peau)
    meilleur, best = -1, 0
    for k, n in tailles.items():
        ys, xs = np.nonzero(lab == k)
        cx, cy = xs.mean(), ys.mean()
        if not (0.30 * w < cx < 0.70 * w and 0.10 * h < cy < 0.80 * h):
            continue
        if n > best:
            best, meilleur = n, k
    if meilleur < 0:
        raise SystemExit("visage introuvable")
    visage = (lab == meilleur)
    ys, xs = np.nonzero(visage)
    bx0, bx1, by0, by1 = xs.min(), xs.max(), ys.min(), ys.max()

    # iris : rouges saturés, dans le tiers supérieur de la boîte du visage
    boite = np.zeros_like(visage)
    hb = by1 - by0
    boite[by0 + int(hb * 0.10):by0 + int(hb * 0.55),
          bx0 + int((bx1 - bx0) * 0.08):bx1 - int((bx1 - bx0) * 0.08)] = True
    rouge = boite & (R > 158) & (G < 66) & (B < 66) & (R - G > 90) & (R - B > 90)
    ys2, xs2 = np.nonzero(rouge)
    if len(xs2) < 12:
        raise SystemExit("iris rouges introuvables")
    mx = np.median(xs2)
    g = xs2 < mx
    oeilG = (xs2[g].mean(), ys2[g].mean())
    oeilD = (xs2[~g].mean(), ys2[~g].mean())
    if oeilG[0] > oeilD[0]:
        oeilG, oeilD = oeilD, oeilG

    r = 1.0 / ech
    return {
        "oeilG": (oeilG[0] * r, oeilG[1] * r),
        "oeilD": (oeilD[0] * r, oeilD[1] * r),
        "ecart": (oeilD[0] - oeilG[0]) * r,
        "cx": (oeilG[0] + oeilD[0]) / 2 * r,
        "cy": (oeilG[1] + oeilD[1]) / 2 * r,
        "menton": by1 * r,
        "gauche": bx0 * r, "droite": bx1 * r, "haut": by0 * r
    }


def ferme(m, r):
    """Fermeture morphologique : dilatation puis érosion, pour recoller
    un visage coupé par les lèvres ou les sourcils."""
    def dil(x):
        y = x.copy()
        for d in range(1, r + 1):
            y[d:, :] |= x[:-d, :]; y[:-d, :] |= x[d:, :]
            y[:, d:] |= x[:, :-d]; y[:, :-d] |= x[:, d:]
        return y
    def ero(x):
        y = x.copy()
        for d in range(1, r + 1):
            y[d:, :] &= x[:-d, :]; y[:-d, :] &= x[d:, :]
            y[:, d:] &= x[:, :-d]; y[:, :-d] &= x[:, d:]
        return y
    return ero(dil(m))


def composantes(masque):
    """Étiquetage 4-connexe, en balayage de lignes."""
    h, w = masque.shape
    lab = np.zeros((h, w), dtype=np.int32)
    n = 0
    tailles = {}
    for y in range(h):
        for x in range(w):
            if not masque[y, x] or lab[y, x]:
                continue
            n += 1
            f = deque([(x, y)])
            lab[y, x] = n
            cpt = 0
            while f:
                px, py = f.popleft()
                cpt += 1
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = px + dx, py + dy
                    if 0 <= nx < w and 0 <= ny < h and masque[ny, nx] and not lab[ny, nx]:
                        lab[ny, nx] = n
                        f.append((nx, ny))
            tailles[n] = cpt
    return lab, tailles


# ================================================================
# Contours exacts d'un masque binaire
# ================================================================
def contours(masque):
    """Renvoie les boucles fermées du bord du masque (coordonnées de coin)."""
    h, w = masque.shape
    aretes = {}
    for y in range(h):
        ligne = masque[y]
        for x in range(w):
            if not ligne[x]:
                continue
            # arête orientée : l'intérieur est à gauche du sens de parcours
            if y == 0 or not masque[y - 1, x]:
                aretes.setdefault((x, y), []).append((x + 1, y))
            if x == w - 1 or not masque[y, x + 1]:
                aretes.setdefault((x + 1, y), []).append((x + 1, y + 1))
            if y == h - 1 or not masque[y + 1, x]:
                aretes.setdefault((x + 1, y + 1), []).append((x, y + 1))
            if x == 0 or not masque[y, x - 1]:
                aretes.setdefault((x, y + 1), []).append((x, y))
    boucles = []
    while aretes:
        depart = next(iter(aretes))
        boucle = [depart]
        p = depart
        while True:
            suivants = aretes.get(p)
            if not suivants:
                break
            q = suivants.pop()
            if not suivants:
                del aretes[p]
            boucle.append(q)
            p = q
            if p == depart:
                break
        if len(boucle) > 4:
            boucles.append(boucle)
    return boucles


def aire(poly):
    s = 0.0
    for i in range(len(poly)):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % len(poly)]
        s += x1 * y2 - x2 * y1
    return abs(s) / 2


def rdp(points, eps):
    """Simplification de Douglas–Peucker sur une ligne ouverte."""
    if len(points) < 3:
        return points
    dmax, idx = 0.0, 0
    x1, y1 = points[0]
    x2, y2 = points[-1]
    dx, dy = x2 - x1, y2 - y1
    n = math.hypot(dx, dy)
    for i in range(1, len(points) - 1):
        px, py = points[i]
        d = abs(dy * px - dx * py + x2 * y1 - y2 * x1) / n if n > 1e-9 \
            else math.hypot(px - x1, py - y1)
        if d > dmax:
            dmax, idx = d, i
    if dmax > eps:
        return rdp(points[:idx + 1], eps)[:-1] + rdp(points[idx:], eps)
    return [points[0], points[-1]]


def simplifie_boucle(boucle, eps):
    p = boucle[:-1] if boucle[0] == boucle[-1] else boucle[:]
    if len(p) < 4:
        return p
    # on coupe en deux pour ne pas figer les extrémités
    m = len(p) // 2
    a = rdp(p[:m + 1], eps)
    b = rdp(p[m:] + [p[0]], eps)
    return a[:-1] + b[:-1]


# ================================================================
# Encodage compact
# ================================================================
def encode(v):
    v = int(round(v))
    v = max(0, min(BASE * BASE - 1, v))
    return ALPHABET[v // BASE] + ALPHABET[v % BASE]


# ================================================================
# Programme
# ================================================================
def main():
    src = sys.argv[1]
    dst = sys.argv[2]
    im = Image.open(src).convert("RGB")
    rep = repere_visage(im)
    ecart = rep["ecart"]

    # cadrage : le visage plus l'encadrement de cheveux, corners compris
    lv = rep["droite"] - rep["gauche"]                 # largeur du visage
    mx = (rep["gauche"] + rep["droite"]) / 2
    cy = rep["cy"]
    x0 = int(max(0, mx - lv * 0.95))
    x1 = int(min(im.width, mx + lv * 0.95))
    y0 = int(max(0, cy - ecart * 1.75))
    y1 = int(min(im.height, rep["menton"] + lv * 0.42))
    crop = im.crop((x0, y0, x1, y1))

    # résolution de travail + lissage pour supprimer le grain
    ech = LARGEUR_TRAVAIL / crop.width
    tw, th = LARGEUR_TRAVAIL, int(round(crop.height * ech))
    petit = crop.resize((tw, th), Image.LANCZOS).filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.GaussianBlur(0.8))
    # on relève un peu les tons moyens et la saturation : la photo est
    # très sombre, et les iris rouges doivent survivre à la postérisation
    pa = np.asarray(petit).astype(np.float32) / 255.0
    pa = np.power(pa, 0.82)
    moy = pa.mean(axis=2, keepdims=True)
    pa = np.clip(moy + (pa - moy) * 1.28, 0, 1)
    petit = Image.fromarray((pa * 255).astype(np.uint8))

    # postérisation
    quant = petit.quantize(colors=NB_COULEURS, method=Image.MAXCOVERAGE, dither=Image.Dither.NONE)
    pal = quant.getpalette()[:NB_COULEURS * 3]
    idx = np.asarray(quant)

    polys = []
    for k in range(NB_COULEURS):
        masque = (idx == k)
        if not masque.any():
            continue
        # composantes connexes
        vu = np.zeros_like(masque, dtype=bool)
        ys, xs = np.nonzero(masque)
        for sy, sx in zip(ys, xs):
            if vu[sy, sx]:
                continue
            f = deque([(sx, sy)])
            vu[sy, sx] = True
            cellules = []
            while f:
                px, py = f.popleft()
                cellules.append((px, py))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = px + dx, py + dy
                    if 0 <= nx < tw and 0 <= ny < th and masque[ny, nx] and not vu[ny, nx]:
                        vu[ny, nx] = True
                        f.append((nx, ny))
            if len(cellules) < AIRE_MINI:
                continue
            comp = np.zeros_like(masque, dtype=bool)
            for px, py in cellules:
                comp[py, px] = True
            for b in contours(comp):
                p = simplifie_boucle(b, EPS_RDP)
                if len(p) < 3:
                    continue
                ar = aire(p)
                if ar < AIRE_MINI:
                    continue
                polys.append((ar, k, p))

    # du plus grand au plus petit : les détails se posent sur les aplats
    polys.sort(key=lambda t: -t[0])

    # repères du visage dans le repère de travail
    def versTravail(px, py):
        return ((px - x0) * ech, (py - y0) * ech)
    oG = versTravail(*rep["oeilG"])
    oD = versTravail(*rep["oeilD"])
    mentonY = (rep["menton"] - y0) * ech
    ecartT = oD[0] - oG[0]

    # passage au repère local du jeu : on cale sur la LARGEUR du visage
    # (38 unités), et la ligne des yeux sur y = −17,5
    lvT = (rep["droite"] - rep["gauche"]) * ech
    k = 38.0 / lvT
    ox = ((rep["gauche"] + rep["droite"]) / 2 - x0) * ech
    oy = (oG[1] + oD[1]) / 2
    def versLocal(x, y):
        return ((x - ox) * k, (y - oy) * k - 17.5)

    # tout est décalé pour tenir dans un entier positif
    DEC = 60.0
    ECH_INT = 20.0     # 1/20 d'unité locale de précision

    lignes = []
    couleurs = []
    for ar, ki, p in polys:
        r, g, b = pal[ki * 3], pal[ki * 3 + 1], pal[ki * 3 + 2]
        couleurs.append("#%02x%02x%02x" % (r, g, b))
        s = []
        for (px, py) in p:
            lx, ly = versLocal(px, py)
            s.append(encode((lx + DEC) * ECH_INT))
            s.append(encode((ly + DEC * 1.6) * ECH_INT))
        lignes.append("".join(s))

    mxl, myl = versLocal(0, 0)
    Mxl, Myl = versLocal(tw, th)
    mentonLocal = versLocal(ox, mentonY)[1]

    out = []
    out.append("/* ================================================================")
    out.append("   VISAGE DÉCALQUÉ")
    out.append("   Généré par outils/tracer-visage.py à partir de la photo de")
    out.append("   référence : postérisation en %d aplats, contours extraits puis" % NB_COULEURS)
    out.append("   simplifiés, exprimés dans le repère local de la gardienne")
    out.append("   (yeux à ±8,4 sur y = −17,5). Aucune image n'est embarquée.")
    out.append("   ================================================================ */")
    out.append('var VT_ALPHABET = %s;' % js_str(ALPHABET))
    out.append("var VT_BASE = %d, VT_DEC = %g, VT_DECY = %g, VT_ECH = %g;" % (BASE, DEC, DEC * 1.6, ECH_INT))
    out.append("var VT_BOITE = { x0:%.2f, y0:%.2f, x1:%.2f, y1:%.2f, menton:%.2f, larg:38 };"
               % (mxl, myl, Mxl, Myl, mentonLocal))
    out.append("var VT_YEUX = { g:[%.2f,%.2f], d:[%.2f,%.2f] };"
               % (versLocal(*oG)[0], versLocal(*oG)[1], versLocal(*oD)[0], versLocal(*oD)[1]))
    out.append("var VT_COULEURS = [" + ",".join(js_str(c) for c in couleurs) + "];")
    out.append("var VT_POLY = [")
    for i, s in enumerate(lignes):
        out.append("  " + js_str(s) + ("," if i < len(lignes) - 1 else ""))
    out.append("];")
    out.append("")
    out.append(CORPS_JS)
    open(dst, "w", encoding="utf8").write("\n".join(out) + "\n")

    npts = sum(len(s) // 4 for s in lignes)
    print("%d polygones, %d points, %.1f Ko" %
          (len(lignes), npts, len("\n".join(out)) / 1024))
    print("boîte locale x[%.1f %.1f] y[%.1f %.1f] menton %.1f" % (mxl, Mxl, myl, Myl, mentonLocal))


def js_str(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


CORPS_JS = r'''
/* Décodage : deux caractères par coordonnée. */
var VT_CHEMINS = null;
function vtPrepare(){
  if(VT_CHEMINS) return;
  var t = {}, i;
  for(i = 0; i < VT_ALPHABET.length; i++) t[VT_ALPHABET.charAt(i)] = i;
  VT_CHEMINS = [];
  for(i = 0; i < VT_POLY.length; i++){
    var s = VT_POLY[i], p = [];
    for(var k = 0; k < s.length; k += 4){
      var x = (t[s.charAt(k)] * VT_BASE + t[s.charAt(k + 1)]) / VT_ECH - VT_DEC;
      var y = (t[s.charAt(k + 2)] * VT_BASE + t[s.charAt(k + 3)]) / VT_ECH - VT_DECY;
      p.push(x, y);
    }
    VT_CHEMINS.push(p);
  }
}
/* Contour lissé : on passe par les milieux, les marches d'escalier
   du décalque deviennent des courbes. */
function vtTrace(c, p){
  var n = p.length / 2;
  if(n < 3) return;
  /* on passe par les milieux : les marches d'escalier du décalque
     deviennent des courbes, sans coûter un seul point de plus */
  c.beginPath();
  c.moveTo((p[0] + p[(n - 1) * 2]) / 2, (p[1] + p[(n - 1) * 2 + 1]) / 2);
  for(var i = 0; i < n; i++){
    var j = (i + 1) % n;
    c.quadraticCurveTo(p[i * 2], p[i * 2 + 1],
                       (p[i * 2] + p[j * 2]) / 2, (p[i * 2 + 1] + p[j * 2 + 1]) / 2);
  }
  c.closePath();
}
/* Dessine le visage décalqué dans le repère local de la gardienne. */
function dessineVisageTrace(c){
  vtPrepare();
  for(var i = 0; i < VT_CHEMINS.length; i++){
    c.fillStyle = VT_COULEURS[i];
    vtTrace(c, VT_CHEMINS[i]);
    c.fill();
    /* un liseré de la même couleur soude les aplats entre eux et
       supprime les fils clairs de l'anticrénelage */
    c.strokeStyle = VT_COULEURS[i];
    c.lineWidth = 0.16; c.lineJoin = "round";
    c.stroke();
  }
}
'''

if __name__ == "__main__":
    main()
