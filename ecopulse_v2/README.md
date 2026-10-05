# ÉcoPulse v2 — actualités économiques connectées

ÉcoPulse v2 est un prototype de média économique en React/Vite, avec un serveur Express qui récupère des articles depuis plusieurs flux RSS côté serveur. Le style est volontairement minimaliste et éditorial.

## Fonctionnalités

- Agrégation de flux RSS configurés dans `server.js`.
- Filtrage économique par mots-clés, catégories et recherche.
- Déduplication des articles et tri par date de publication.
- Cache serveur configurable (5 minutes par défaut).
- Rafraîchissement automatique du navigateur toutes les 5 minutes.
- Clés d'API gardées côté serveur via `.env`.
- Mode aperçu avec articles de démonstration si l'API n'est pas lancée.
- Emplacements clairement indiqués pour les données de marché et la newsletter.

## Prérequis

- Node.js 18 ou plus récent.
- Connexion Internet pour les flux RSS.
- Un fournisseur de données financières si vous voulez des cotations boursières en direct.

## Installation locale

```bash
npm install
cp .env.example .env
npm run dev
```

Dans un second terminal :

```bash
npm run start:server
```

Ouvrez l'URL Vite affichée dans le terminal (généralement `http://localhost:5173`).

Le serveur API tourne sur `http://localhost:8787`. Le proxy Vite transmet les appels `/api` au serveur.

## Ajouter une clé NewsAPI (optionnel)

1. Créez une clé auprès d'un fournisseur dont les conditions correspondent à votre usage.
2. Ajoutez `NEWSAPI_KEY=votre_cle` dans `.env`.
3. L'endpoint serveur optionnel est `GET /api/newsapi?q=économie`.

Le frontend par défaut utilise les flux RSS. Pour utiliser NewsAPI, adaptez la fonction `loadNews` dans `src/main.jsx` à `/api/newsapi`. Vérifiez les quotas, la disponibilité des articles, les droits de republication et les conditions d'utilisation avant le lancement public.

## Ajouter ou remplacer des flux RSS

Modifiez la constante `FEEDS` dans `server.js`. Les flux peuvent changer d'adresse, bloquer les requêtes ou ne pas fournir de descriptions/images. Il est normal qu'un flux soit temporairement indisponible.

## Données financières

Les cotations en temps réel ne sont pas incluses dans ce prototype : les places de marché et les fournisseurs ont des règles de licence et des délais différents. Choisissez un fournisseur adapté (par exemple Twelve Data, Finnhub ou un flux agréé par votre courtier), ajoutez la clé dans `.env`, puis créez un endpoint serveur pour normaliser les données. N'exposez jamais de clé privée dans le code client.

## Production

Pour un déploiement public, ajoutez au minimum :
- un domaine HTTPS et une plateforme d'hébergement pour le frontend et le serveur ;
- surveillance des erreurs et de la fraîcheur des flux ;
- politique de confidentialité et conformité RGPD si vous collectez des e-mails ;
- système réel d'inscription à la newsletter (Brevo, Mailchimp ou autre) ;
- contrôle des droits de republication, liens vers les sources, attribution et règles de cache ;
- éventuellement une base de données si vous souhaitez conserver l'historique.

## Important

Les flux RSS sont récupérés automatiquement mais ne garantissent pas une disponibilité 24/7. Les catégories sont estimées à partir de la source configurée et les mots-clés; vérifiez la qualité éditoriale avant publication. La newsletter n'enregistre pas encore les adresses et les indicateurs financiers sont des emplacements de démonstration.
