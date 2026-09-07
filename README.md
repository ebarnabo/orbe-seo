# Orbe

Audit SEO d’une URL, mots-clés optionnels, infographie animée copiable.

## Stack
- Vite + React
- Fonction Netlify `analyze` : fetch HTML, scoring on-page, signal de visibilité

## Local
```bash
npm install
npm run dev
```

La fonction `/api/analyze` tourne seulement via `netlify dev` ou en prod Netlify.

```bash
npx netlify dev
```

## Limites
- Fit on-page + socle technique, pas un index backlinks Ahrefs
- Position Google exacte non garantie (pas d’API SERP payante)
- Pages JS-only : HTML brut, sans rendu headless
