import express from "express";
import cors from "cors";
import Parser from "rss-parser";
import dotenv from "dotenv";
import path from "path";\nimport crypto from "crypto";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const parser = new Parser({
  timeout: 12000,
  headers: { "User-Agent": "EcoPulse/2.0 news reader" }
});
const PORT = Number(process.env.PORT || 8787);
const TTL = Math.max(60, Number(process.env.CACHE_TTL_SECONDS || 300)) * 1000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST = path.join(__dirname, "dist");

app.use(cors());
app.use(express.json());

const FEEDS = [
  { name: "Franceinfo Économie", url: "https://www.francetvinfo.fr/economie.rss", category: "France" },
  { name: "Les Échos", url: "https://www.lesechos.fr/rss/rss_une.xml", category: "Entreprises" },
  { name: "Boursorama", url: "https://www.boursorama.com/rss/actualites/", category: "Marchés" },
  { name: "Euronews Économie", url: "https://fr.euronews.com/rss?level=theme&name=business", category: "Monde" },
  { name: "Le Monde Sport", url: "https://www.lemonde.fr/sport/rss_full.xml", category: "Sport" },
  { name: "Le Monde Football", url: "https://www.lemonde.fr/football/rss_full.xml", category: "Sport" },
  { name: "Le Monde Rugby", url: "https://www.lemonde.fr/rugby/rss_full.xml", category: "Sport" },
  { name: "Le Monde Tennis", url: "https://www.lemonde.fr/tennis/rss_full.xml", category: "Sport" },
  { name: "Le Monde Cyclisme", url: "https://www.lemonde.fr/cyclisme/rss_full.xml", category: "Sport" },
  { name: "Le Monde Basket", url: "https://www.lemonde.fr/basket/rss_full.xml", category: "Sport" }
];

const TERMS = [
  "économ", "finance", "marché", "bourse", "entreprise", "inflation", "banque",
  "croissance", "emploi", "chômage", "pib", "taux", "investissement", "industrie",
  "budget", "euro", "dollar", "cac 40", "nasdaq", "pétrole", "énergie", "commerce",
  "export", "import", "consommation", "dette", "déficit", "actions", "obligation",
  "monétaire", "fiscal", "fiscalité", "salaire", "prix", "pouvoir d'achat"
];

let cache = { at: 0, articles: [], sources: [], errors: [] };

function cleanText(value = "") {
  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function toArticle(item, feed) {
  const title = cleanText(item.title || "");
  const description = cleanText(item.contentSnippet || item.summary || item.content || "");
  const haystack = `${title} ${description}`.toLocaleLowerCase("fr");
  if (!title || (feed.category !== "Sport" && !TERMS.some(term => haystack.includes(term)))) return null;

  const rawDate = item.isoDate || item.pubDate || null;
  const publishedAt = rawDate && !Number.isNaN(Date.parse(rawDate))
    ? new Date(rawDate).toISOString()
    : null;

  return {
    id: item.guid || item.link || `${feed.name}-${title}`,
    title,
    description: description.slice(0, 380),
    url: item.link || "",
    source: feed.name,
    category: feed.category,
    publishedAt,
    image: item.enclosure?.url || item["media:content"]?.url || null
  };
}

async function fetchFeed(feed) {
  const parsed = await parser.parseURL(feed.url);
  return (parsed.items || []).map(item => toArticle(item, feed)).filter(Boolean);
}

async function refreshFeeds() {
  const results = await Promise.allSettled(FEEDS.map(async feed => ({
    name: feed.name,
    articles: await fetchFeed(feed)
  })));

  const articles = [];
  const sources = [];
  const errors = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      sources.push({ name: result.value.name, status: "ok", count: result.value.articles.length });
      articles.push(...result.value.articles);
    } else {
      errors.push(String(result.reason?.message || "Flux indisponible"));
    }
  }

  const unique = new Map();
  for (const item of articles) {
    const key = item.url || item.title.toLowerCase();
    if (!unique.has(key)) unique.set(key, item);
  }

  cache = {
    at: Date.now(),
    articles: [...unique.values()].sort((a, b) =>
      (Date.parse(b.publishedAt || 0) || 0) - (Date.parse(a.publishedAt || 0) || 0)
    ),
    sources,
    errors
  };

  return cache;
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "ÉcoPulse API",
    version: "2.0.1",
    time: new Date().toISOString()
  });
});

app.get("/api/news", async (req, res) => {
  try {
    if (!cache.at || Date.now() - cache.at > TTL) await refreshFeeds();

    const q = String(req.query.q || "").toLocaleLowerCase("fr").trim();
    const category = String(req.query.category || "Toutes");
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));

    const filtered = cache.articles.filter(article => {
      const matchesQ = !q ||
        `${article.title} ${article.description} ${article.source}`
          .toLocaleLowerCase("fr")
          .includes(q);
      const matchesCategory = category === "Toutes" || article.category === category;
      return matchesQ && matchesCategory;
    });

    res.json({
      articles: filtered.slice(0, limit),
      updatedAt: new Date(cache.at).toISOString(),
      nextRefreshSeconds: Math.max(0, Math.ceil((TTL - (Date.now() - cache.at)) / 1000)),
      sources: cache.sources,
      errors: cache.errors,
      mode: "rss"
    });
  } catch (error) {
    res.status(502).json({
      articles: [],
      error: "Impossible de récupérer les flux d'actualité pour le moment.",
      details: process.env.NODE_ENV === "development" ? String(error.message) : undefined
    });
  }
});

app.get("/api/newsapi", async (req, res) => {
  if (!process.env.NEWSAPI_KEY) {
    return res.status(503).json({
      error: "NEWSAPI_KEY n'est pas configurée. Utilisez les flux RSS ou ajoutez une clé dans .env."
    });
  }

  try {
    const q = encodeURIComponent(String(req.query.q || "économie OR finance OR entreprise"));
    const url = `https://newsapi.org/v2/everything?q=${q}&language=fr&sortBy=publishedAt&pageSize=50&apiKey=${process.env.NEWSAPI_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || "Erreur du fournisseur d'actualités."
      });
    }

    res.json({
      articles: (data.articles || []).map((item, index) => ({
        id: item.url || `${item.title}-${index}`,
        title: cleanText(item.title || ""),
        description: cleanText(item.description || ""),
        url: item.url || "",
        source: item.source?.name || "Source externe",
        category: "Actualité",
        publishedAt: item.publishedAt || null,
        image: item.urlToImage || null
      })),
      updatedAt: new Date().toISOString(),
      mode: "newsapi"
    });
  } catch {
    res.status(502).json({
      error: "Le fournisseur d'actualités est momentanément indisponible."
    });
  }
});


// Simple NOA STUDIO project chat. Conversations live in memory for the current service instance.
const chatConversations = new Map();
const chatAdminKey = process.env.NOA_CHAT_ADMIN_KEY || "NOA-CHAT-ADMIN-2026";

function chatText(value, max = 2000) {
  return String(value || "").replace(/[<>]/g, "").trim().slice(0, max);
}

app.post("/api/chat/start", (req, res) => {
  const name = chatText(req.body?.name, 80);
  const email = chatText(req.body?.email, 160).toLowerCase();
  if (!name || !email || !email.includes("@")) return res.status(400).json({ error: "Nom et e-mail requis." });
  const id = crypto.randomUUID();
  const conversation = {
    id,
    name,
    email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: []
  };
  chatConversations.set(id, conversation);
  res.status(201).json(conversation);
});

app.get("/api/chat/:id", (req, res) => {
  const conversation = chatConversations.get(req.params.id);
  if (!conversation) return res.status(404).json({ error: "Conversation introuvable." });
  res.json(conversation);
});

app.post("/api/chat/:id/messages", (req, res) => {
  const conversation = chatConversations.get(req.params.id);
  if (!conversation) return res.status(404).json({ error: "Conversation introuvable." });
  const sender = req.body?.sender === "owner" ? "owner" : "client";
  const text = chatText(req.body?.text);
  if (!text) return res.status(400).json({ error: "Message vide." });
  const message = { id: crypto.randomUUID(), sender, text, createdAt: new Date().toISOString() };
  conversation.messages.push(message);
  conversation.updatedAt = message.createdAt;
  res.status(201).json(message);
});

app.get("/api/chat-admin/conversations", (req, res) => {
  if (req.headers["x-admin-key"] !== chatAdminKey) return res.status(401).json({ error: "Accès refusé." });
  const conversations = [...chatConversations.values()]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(conversations);
});

// Serve the production Vite build.
app.use(express.static(DIST));

// SPA fallback: every non-API route returns the Vite index.html.
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not found" });
  }
  res.sendFile(path.join(DIST, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ÉcoPulse disponible sur le port ${PORT}`);
});