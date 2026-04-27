# Duomenys

**SVARBU:** dabartiniai įrašai `people.json` yra **pavyzdiniai** (perkelti iš HTML prototipo). Visi `bio` laukai pažymėti `PAVYZDINIS ASMUO`.

Kai bus tikri duomenys — pakeisti šiuos failus.

## Struktūra

### `people.json`
Žmonių žodynas (id → asmuo). Laukai:
- `id` — unikalus, naudojamas URL'ui (`/asmuo/<id>`). Tik mažosios raidės be diakritikos
- `firstName`, `lastName` — privalomi
- `maidenName` — moterims, jei pavardė pakito
- `gender` — `"m"` arba `"f"`
- `birth`, `death` — metai kaip eilutė; `death` praleisti, jei gyvas
- `birthPlace` — laisva forma
- `bio` — biografija (sakinys ar pastraipa)
- `links` — `[{ label, url }]` išorinės nuorodos
- `docs` — `[{ name, type }]` dokumentai
- `gallery` — `["/media/foto.jpg", ...]`
- `photo` — `"/media/portretas.jpg"`
- `x`, `y` — pozicija pilno medžio režime (kai nėra fokuso)

### `couples.json`
Šeimų sąrašas:
```json
{ "spouses": ["id_a", "id_b"], "children": ["vaikas1", "vaikas2"] }
```

### `generations.json`
Kartų etiketės kairėje pilno medžio režime.

## Nuotraukų vieta

Nuotraukas dėti į `/public/media/`. Astro automatiškai serveruos jas iš šaknies (`/media/foto.jpg`).
