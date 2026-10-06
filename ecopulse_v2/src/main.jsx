import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight, ArrowUpRight, Clock3, Search, RefreshCw, TrendingUp,
  Newspaper, Globe2, Building2, Landmark, Menu, X, Wifi
} from "lucide-react";
import "./style.css";

const CATEGORIES = ["Toutes", "France", "Marchés", "Entreprises", "Monde", "Sport"];
const SPORT_FILTERS = ["Tous les sports", "Football", "Tennis", "Rugby", "Basket", "Cyclisme", "Formule 1"];
const fmtDate = value => {
  if (!value) return "Date non précisée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date non précisée";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
};

const fallbackStories = [
  { id: "demo1", title: "L’économie européenne scrute les prochains signaux de croissance", description: "Inflation, consommation et investissement restent au cœur des préoccupations des décideurs et des marchés.", source: "ÉcoPulse — exemple", category: "Europe", publishedAt: new Date().toISOString(), url: "" },
  { id: "demo2", title: "Les entreprises réévaluent leurs priorités d’investissement", description: "Dans un environnement incertain, les dirigeants arbitrent entre innovation, productivité et maîtrise des coûts.", source: "ÉcoPulse — exemple", category: "Entreprises", publishedAt: new Date(Date.now()-3600000).toISOString(), url: "" },
  { id: "demo3", title: "Les marchés attendent de nouveaux indicateurs macroéconomiques", description: "Les prochaines publications économiques pourraient influencer les anticipations de taux et les valorisations.", source: "ÉcoPulse — exemple", category: "Marchés", publishedAt: new Date(Date.now()-7200000).toISOString(), url: "" }
];

function App() {
  const [articles, setArticles] = useState([]);
  const [category, setCategory] = useState(() => window.location.hash === "#sport" ? "Sport" : "Toutes");
  const [query, setQuery] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [sources, setSources] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isSport = category === "Sport";

  async function loadNews({ quiet = false } = {}) {
    if (!quiet) setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "60" });
      if (category !== "Toutes") params.set("category", category);
      if (query.trim()) params.set("q", query.trim());
      const response = await fetch(`/api/news?${params}`);
      if (!response.ok) throw new Error("API indisponible");
      const data = await response.json();
      setArticles(data.articles || []);
      setUpdatedAt(data.updatedAt || new Date().toISOString());
      setSources(data.sources || []);
      setErrors(data.errors || []);
      setIsDemo(false);
    } catch {
      setArticles(fallbackStories);
      setUpdatedAt(new Date().toISOString());
      setSources([]);
      setErrors(["L'API locale n'est pas connectée. Les articles affichés sont des exemples."]);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = isSport ? "ÉcoPulse Sport — Actualité sportive" : "ÉcoPulse — Actualité économique";
    if (isSport && window.location.hash !== "#sport") window.history.replaceState({}, "", "#sport");
    if (!isSport && window.location.hash === "#sport") window.history.replaceState({}, "", "#");
    loadNews();
  }, [category]);
  useEffect(() => {
    const id = setTimeout(() => loadNews({ quiet: true }), 350);
    return () => clearTimeout(id);
  }, [query]);
  useEffect(() => {
    const id = setInterval(() => loadNews({ quiet: true }), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [category, query]);

  const filtered = useMemo(() => articles, [articles]);
  const lead = filtered[0];
  const side = filtered.slice(1, 4);
  const more = filtered.slice(4);

  const categoryIcon = name => {
    if (name === "Marchés") return <TrendingUp size={15}/>;
    if (name === "Entreprises") return <Building2 size={15}/>;
    if (name === "Monde") return <Globe2 size={15}/>;
    return <Newspaper size={15}/>;
  };

  return <div className="app-shell">
    <div className="topline"><div className="wrap top-line-inner">
      <span>{isSport ? "LE BRIEF SPORTIF" : "LE BRIEF ÉCONOMIQUE"}</span><span className="top-date">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "full" }).format(new Date())}</span>
      <span className="live-status"><i/> {isDemo ? "Mode aperçu" : "Flux connectés"}</span>
    </div></div>
    <header className="site-header"><div className="wrap nav">
      <a className="brand" href="#"><span className="brand-mark">é.</span><span>ÉcoPulse</span></a>
      <nav className={mobileOpen ? "nav-links open" : "nav-links"}>
        {CATEGORIES.map(c => <button key={c} className={category === c ? "nav-link active" : "nav-link"} onClick={() => {setCategory(c);setMobileOpen(false)}}>{c === "Toutes" ? "À la une" : c}</button>)}
        <a className="nav-link market-nav-link market-nav-cta" href="/market" onClick={()=>setMobileOpen(false)}><span className="market-menu-dot"/> MARKET AI <span className="market-menu-arrow">↗</span></a><a className="nav-link nav-agency-link" href="/agence" onClick={()=>setMobileOpen(false)}>NOA STUDIO</a>
      </nav>
      <div className="nav-actions">
        <button className="icon-btn search-toggle" aria-label="Rechercher" onClick={()=>setSearchOpen(v=>!v)}><Search size={17}/></button>
        <label className={searchOpen || query ? "searchbox searchbox-open" : "searchbox"}><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={isSport ? "Chercher un sport…" : "Rechercher…"}/></label>
        <button className="icon-btn mobile-menu" aria-label="Menu" onClick={()=>setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={19}/> : <Menu size={19}/>}</button>
      </div>
    </div></header>

    <main className="wrap">
      <section className="intro">
        <p className="eyebrow">{isSport ? "L’ESSENTIEL DU SPORT, SANS LE BRUIT" : "L’ESSENTIEL, SANS LE BRUIT"}</p>
        <h1>{isSport ? <>Le sport,<br/><span>en mouvement.</span></> : <>L’économie,<br/><span>en perspective.</span></>}</h1>
        <p className="intro-sub">{isSport ? "Football, tennis, rugby, basket, cyclisme et les grands rendez-vous. L’actualité sportive, sélectionnée et contextualisée." : "Les actualités et les signaux qui comptent. Sélectionnés, contextualisés, expliqués."}</p>
        <button className="hero-cta" onClick={()=>document.getElementById("fil")?.scrollIntoView({behavior:"smooth"})}>Voir les dernières actualités <ArrowRight size={15}/></button>
      </section>

      {isDemo && <div className="notice"><Wifi size={16}/><span><strong>Mode aperçu.</strong> Lance le serveur API pour charger les flux RSS réels. Les articles ci-dessous sont des exemples.</span></div>}
      {isSport && !isDemo && <div className="sport-banner"><span>SPORT EN CONTINU</span><strong>Football · Tennis · Rugby · Basket · Cyclisme · F1</strong><small>Flux d’actualité mis à jour automatiquement.</small></div>}
      {!isDemo && errors.length > 0 && <div className="notice"><Wifi size={16}/><span>Certains flux ne répondent pas. Les articles disponibles restent consultables.</span></div>}

      <section className="lead-grid">
        <div className="lead-column">
          <div className="section-kicker"><span>À LA UNE</span><span className="rule"/></div>
          {loading && !lead ? <div className="skeleton lead-skeleton"/> : lead ? <article className="lead-story">
            <div className="lead-image"><div className="orb orb-one"/><div className="orb orb-two"/><span className="image-label">{isSport ? "SPORT / ACTUALITÉS" : "ÉCONOMIE / ANALYSE"}</span></div>
            <div className="lead-copy">
              <div className="meta">{lead.category || "Économie"} <span>·</span> {fmtDate(lead.publishedAt)}</div>
              <h2>{lead.title}</h2>
              <p>{lead.description || "Les dernières informations économiques et leurs implications."}</p>
              <div className="story-footer"><span className="source-name">{lead.source}</span>{lead.url ? <a className="read-link" href={lead.url} target="_blank" rel="noreferrer">Lire l’article <ArrowUpRight size={15}/></a> : <span className="sample-label">Exemple éditorial</span>}</div>
            </div>
          </article> : <div className="empty">Aucun article ne correspond à cette recherche.</div>}
        </div>
        <aside className="latest-column">
          <div className="section-kicker"><span>DERNIÈRES NOUVELLES</span><span className="rule"/></div>
          {side.length ? side.map((story,i)=><article className="compact-story" key={story.id}>
            <div className="compact-index">0{i+1}</div>
            <div><div className="meta">{story.category || "Économie"} <span>·</span> {fmtDate(story.publishedAt)}</div>
              <h3>{story.title}</h3><p>{story.description}</p>
              {story.url && <a className="read-link" href={story.url} target="_blank" rel="noreferrer">Lire la source <ArrowRight size={13}/></a>}
            </div>
          </article>) : <p className="muted">Les nouvelles apparaîtront ici dès que les flux seront disponibles.</p>}
        </aside>
      </section>

      <section className="feed-section" id="fil">
        <div className="section-title-row"><div><p className="eyebrow">RESTER INFORMÉ</p><h2>{isSport ? "Le fil du sport" : "Le fil de l’économie"}</h2></div>
          <button className="refresh-btn" onClick={()=>loadNews()} disabled={loading}><RefreshCw size={15} className={loading ? "spin" : ""}/> Actualiser</button>
        </div>
        <div className="filter-row">{(isSport ? SPORT_FILTERS : CATEGORIES).map(c => {
          const active = isSport ? (c === "Tous les sports" ? !query : query.toLocaleLowerCase("fr") === c.toLocaleLowerCase("fr")) : category === c;
          return <button key={c} className={active ? "filter active" : "filter"} onClick={() => {
            if (isSport) setQuery(c === "Tous les sports" ? "" : c);
            else setCategory(c);
          }}>{c}</button>;
        })}</div>
        {more.length ? <div className="story-list">{more.map(story=><article className="list-story" key={story.id} onClick={() => story.url && window.open(story.url, "_blank", "noopener,noreferrer")}>
          <div className="list-category">{categoryIcon(story.category)}<span>{story.category || "Économie"}</span></div>
          <div className="list-main"><h3>{story.title}</h3><p>{story.description}</p><div className="list-meta">{story.source} <span>·</span> <Clock3 size={12}/> {fmtDate(story.publishedAt)}</div></div>
          {story.url && <a className="round-arrow" href={story.url} target="_blank" rel="noreferrer" aria-label="Lire l'article"><ArrowUpRight size={18}/></a>}
        </article>)}</div> : <div className="empty">{loading ? "Chargement des actualités…" : "Pas d’autres articles pour le moment. Essayez une autre catégorie ou recherche."}</div>}
      </section>

      {!isSport && <section className="market-strip">
        <div className="market-intro"><p className="eyebrow">LES REPÈRES</p><h2>Les marchés,<br/>en un regard.</h2><p>Connectez un fournisseur de données financières pour afficher les cotations en direct.</p></div>
        <div className="market-placeholder"><div className="market-symbol"><Landmark size={20}/></div><span className="market-title">Indicateurs de marché</span><strong>À connecter</strong><span className="market-foot">API financière requise pour les cours temps réel</span></div>
        <div className="market-placeholder"><div className="market-symbol"><TrendingUp size={20}/></div><span className="market-title">Devises & matières premières</span><strong>À connecter</strong><span className="market-foot">Les cours peuvent être différés selon le fournisseur</span></div>
      </section>}

      <section className="newsletter">
        <div><p className="eyebrow">LE BRIEF, DANS VOTRE BOÎTE MAIL</p><h2>Comprendre plus.<br/>Défiler moins.</h2><p>Une sélection claire des actualités qui comptent.</p></div>
        <form onSubmit={e=>{e.preventDefault();alert("La newsletter sera activée après connexion à un service d’envoi.");}}><input type="email" placeholder="Adresse e-mail" required/><button type="submit">Être informé <ArrowRight size={15}/></button></form>
      </section>

      <section className="source-status">
        <div><span className="status-dot"/><div><strong>Sources d’actualité</strong><p>{sources.length ? `${sources.filter(s=>s.status==="ok").length} flux disponibles` : "En attente de connexion à l’API"}</p></div></div>
        <div className="updated">Dernière vérification : {updatedAt ? fmtDate(updatedAt) : "—"} <span>· Actualisation automatique toutes les 5 min</span></div>
      </section>
    </main>
    <footer><div className="wrap footer-inner"><a className="brand" href="/"><span className="brand-mark">é.</span><span>ÉcoPulse</span></a><span>{isSport ? "Le sport, expliqué simplement." : "L’économie, expliquée simplement."}</span><div className="footer-links"><a href="/agence">NOA STUDIO</a><a href="/agence/chat">Projet / Chat</a><span>© {new Date().getFullYear()} ÉcoPulse</span></div></div><div className="wrap footer-note">Les contenus sont fournis par des sources tierces. Vérifiez les informations auprès de l’éditeur original. Les données de marché nécessitent une source financière distincte.</div></footer>
  </div>;
}


function TradingViewChart({symbol="OANDA:XAUUSD", interval="15"}) {
  const container = useRef(null);
  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true, symbol, interval, timezone: "Europe/Paris", theme: "light",
      style: "1", locale: "fr", allow_symbol_change: true, hide_side_toolbar: false,
      withdateranges: true, save_image: false, calendar: false,
      studies: ["RSI@tv-basicstudies", "MASimple@tv-basicstudies"],
      support_host: "https://www.tradingview.com"
    });
    container.current.appendChild(script);
    return () => { if (container.current) container.current.innerHTML = ""; };
  }, [symbol, interval]);
  return <div className="tv-chart-wrap" ref={container}><div className="tv-loading">Chargement du graphique XAUUSD…</div></div>;
}

function TradingViewCalendar() {
  const container = useRef(null);
  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "light", isTransparent: true, locale: "fr",
      countryFilter: "us,eu,gb,fr,de,cn,jp", importanceFilter: "-1,0,1",
      width: "100%", height: "100%"
    });
    container.current.appendChild(script);
    return () => { if (container.current) container.current.innerHTML = ""; };
  }, []);
  return <div className="tv-calendar-wrap" ref={container}><div className="tv-loading">Chargement du calendrier…</div></div>;
}

function MarketAIPage() {
  const [news, setNews] = useState([]);
  const [updated, setUpdated] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [marketData, setMarketData] = useState(null);
  const [marketError, setMarketError] = useState("");

  async function loadMarketData() {
    try {
      const r = await fetch("/api/market/xauusd");
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.error || "Flux marché indisponible");
      setMarketData(data);
      setMarketError("");
    } catch (error) {
      setMarketError(error.message || "Flux marché indisponible");
    }
  }

  async function loadMarketNews() {
    setRefreshing(true);
    try {
      const r = await fetch("/api/news?category=Marchés&limit=16");
      const data = await r.json();
      setNews(data.articles || []);
      setUpdated(data.updatedAt || new Date().toISOString());
    } catch {
      setNews([]);
      setUpdated(new Date().toISOString());
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    document.title = "Market AI — XAUUSD & marchés";
    loadMarketNews();
    loadMarketData();
    const newsId = setInterval(loadMarketNews, 5 * 60 * 1000);
    const marketId = setInterval(loadMarketData, 15 * 1000);
    return () => { clearInterval(newsId); clearInterval(marketId); };
  }, []);

  const signal = useMemo(() => {
    const text = news.map(n => (n.title || "") + " " + (n.description || "")).join(" ").toLowerCase();
    const bullish = ["gold", "or", "fed", "rate cut", "taux", "safe haven", "geopolit"].filter(k => text.includes(k)).length;
    const bearish = ["strong dollar", "higher yields", "hausse des rendements", "rate hike", "taux élevé"].filter(k => text.includes(k)).length;
    const macro = 62 + bullish * 3 - bearish * 4;
    const technical = marketData?.technical?.bias === "HAUSSIER" ? 8 : marketData?.technical?.bias === "BAISSIER" ? -8 : 0;
    const rsiAdjust = marketData?.technical?.rsi14 > 70 ? -5 : marketData?.technical?.rsi14 < 30 ? 5 : 0;
    const score = Math.max(35, Math.min(85, macro + technical + rsiAdjust));
    const bias = marketData?.technical?.bias || (score >= 65 ? "HAUSSIER" : score <= 55 ? "BAISSIER" : "NEUTRE");
    return {score, bias};
  }, [news, marketData]);

  function askCoach(e) {
    e.preventDefault();
    const q = question.trim().toLowerCase();
    if (!q) return;
    if (q.includes("acheter") || q.includes("vendre") || q.includes("entrer")) {
      setAnswer("Coach : ne prends pas une décision uniquement à partir d’un signal. Vérifie d’abord la tendance, la structure, la volatilité et le calendrier économique. Attends une confirmation sur ton unité de temps.");
    } else if (q.includes("or") || q.includes("xau")) {
      setAnswer(`Coach : XAU/USD est à ${marketData?.price ? marketData.price.toFixed(2) : "—"} USD. Biais technique ${marketData?.technical?.bias?.toLowerCase() || "indisponible"}, RSI ${marketData?.technical?.rsi14 ? marketData.technical.rsi14.toFixed(1) : "—"}, score contextuel ${signal.score}/100. C’est un contexte pédagogique, pas une recommandation d’achat ou de vente.`);
    } else {
      setAnswer("Coach : commence par regarder XAUUSD en M15 puis H1. Identifie la tendance, les derniers sommets/creux et les événements économiques à venir avant de chercher une entrée.");
    }
  }

  return <div className="market-page">
    <header className="market-header"><div className="market-wrap market-nav">
      <a className="market-brand" href="/">ÉcoPulse <span>/ MARKET AI</span></a>
      <div className="market-nav-actions"><a href="/">Actualités</a><a className="active" href="/market">Marchés</a><a href="/#sport">Sport</a><button onClick={loadMarketNews} disabled={refreshing}>{refreshing ? "Actualisation…" : "↻ Actualiser"}</button></div>
    </div></header>
    <main className="market-wrap">
      <section className="market-hero"><div>
        <p className="market-eyebrow">TERMINAL MARCHÉ · TEMPS RÉEL</p>
        <h1>Comprendre le marché<br/><em>avant d’agir.</em></h1>
        <p>Graphique XAUUSD, actualités économiques, calendrier et coaching dans un seul espace.</p>
      </div><div className="market-live-pill"><i/> {marketData ? "API CONNECTÉE · XAU/USD" : "CONNEXION API EN COURS"}</div></section>

      <section className="market-grid-top">
        <div className="market-chart-card">
          <div className="market-card-head"><div><span>XAUUSD</span><strong>OR / DOLLAR</strong></div><div className="market-price-box"><strong>{marketData?.price ? marketData.price.toFixed(2) : "—"} $</strong><span className={marketData?.percentChange >= 0 ? "positive" : "negative"}>{marketData?.percentChange != null ? \`\${marketData.percentChange >= 0 ? "+" : ""}\${marketData.percentChange.toFixed(2)}%\` : "—"}</span><small>{marketData ? "LIVE API" : "OFFLINE"}</small></div><div className={\`market-bias \${signal.bias === "HAUSSIER" ? "up" : signal.bias === "BAISSIER" ? "down" : "flat"}\`}>{signal.bias}</div></div>
          <TradingViewChart />
        </div>
        <aside className="market-coach-card">
          <div className="coach-top"><span>🤖 COACH MARKET AI</span><b>V1</b></div>
          <div className="coach-score"><strong>{signal.score}</strong><span>/ 100</span></div>
          <p className="coach-bias">Biais contextuel : <b>{signal.bias}</b></p>
          <div className="coach-bars"><div><span>Contexte macro</span><i><b style={{width: signal.score + "%"}}/></i></div><div><span>Risque événementiel</span><i><b style={{width: Math.max(25, 100 - signal.score / 2) + "%"}}/></i></div></div>
          <div className="coach-context"><span>TECHNIQUE</span><b>{marketData?.technical?.bias || "—"} · RSI {marketData?.technical?.rsi14 ? marketData.technical.rsi14.toFixed(1) : "—"}</b><span>PRIX XAU/USD</span><b>{marketData?.price ? marketData.price.toFixed(2) + " $" : "—"}</b><span>MACRO</span><b>NEWS + CALENDRIER</b><span>DONNÉES</span><b>{marketData ? "API CONNECTÉE" : "EN ATTENTE"}</b></div><p className="coach-note">Le coach croise le contexte des news et du calendrier avec les éléments techniques affichés sur le graphique. Il sert à t’entraîner et ne constitue pas un signal garanti.</p>
          <form className="coach-form" onSubmit={askCoach}><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Pose une question au coach…"/><button>→</button></form>
          {answer && <div className="coach-answer">{answer}</div>}
        </aside>
      </section>

      <section className="market-panels">
        <div className="market-news-panel">
          <div className="market-panel-head"><div><span>ACTUALITÉS QUI COMPTENT</span><h2>Le marché maintenant</h2></div><small>{updated ? "Mis à jour à " + new Intl.DateTimeFormat("fr-FR",{hour:"2-digit",minute:"2-digit"}).format(new Date(updated)) : "—"}</small></div>
          <div className="market-news-list">{news.length ? news.slice(0,8).map((n,i)=><article key={n.id || i}><div className="market-news-index">0{i+1}</div><div><b>{n.title}</b><p>{n.description || "Voir la source pour le contexte complet."}</p><small>{n.source || "Source"} · {n.publishedAt ? fmtDate(n.publishedAt) : "—"}</small></div>{n.url && <a href={n.url} target="_blank" rel="noreferrer">↗</a>}</article>) : <div className="market-empty">Les actualités apparaîtront ici lorsque le flux économique sera disponible.</div>}</div>
        </div>
        <aside className="market-calendar-panel"><div className="market-panel-head"><div><span>MACRO</span><h2>Calendrier économique</h2></div></div><TradingViewCalendar /></aside>
      </section>

      <section className="market-watch"><div><span>WATCHLIST</span><h2>Les repères à surveiller</h2></div><div className="watch-items">
        <div><b>XAUUSD</b><span>Or</span><strong>Graphique</strong></div><div><b>DXY</b><span>Dollar</span><strong>Contexte</strong></div><div><b>US10Y</b><span>Rendement US</span><strong>Contexte</strong></div><div><b>NAS100</b><span>Technologie US</span><strong>Risque</strong></div><div><b>WTI</b><span>Pétrole</span><strong>Inflation</strong></div>
      </div></section>
      <section className="market-disclaimer"><strong>Important</strong><span>Market AI est un outil d’information et d’entraînement. Il ne fournit pas de conseil financier personnalisé et ne garantit aucun résultat. Les données de marché peuvent dépendre des conditions et du fournisseur.</span></section>
    </main>
  </div>;
}

function AgencyPage() {
  const offers = [
    {name:"STARTER", price:"499 €", text:"Un site propre, rapide et professionnel pour être crédible en ligne.", items:["Jusqu’à 5 pages","Design responsive","Formulaire de contact","SEO local de base","Mise en ligne"]},
    {name:"PRO", price:"799 €", text:"Le pack recommandé pour transformer les visiteurs en clients.", items:["Tout le Starter","Prise de rendez-vous","Avis clients","Google Maps & réseaux","SEO local renforcé"]},
    {name:"PREMIUM", price:"999 €", text:"Une présence complète avec une expérience plus travaillée.", items:["Tout le Pro","Animations premium","Pages sur mesure","Suivi analytics","Optimisations mensuelles"]},
  ];
  return <div className="agency-page">
    <div className="agency-nav"><div className="agency-wrap"><a className="agency-logo" href="/agence"><span>n.</span> NOA STUDIO</a><a className="agency-ecopulse-back" href="/">← ÉcoPulse</a><div className="agency-nav-links"><a href="/">ÉcoPulse</a><a href="/#sport">Sport</a><a href="#services">Services</a><a href="#portfolio">Portfolio</a><a href="#tarifs">Tarifs</a><a className="agency-admin-link" href="/agence/messages">Messages</a><a className="agency-nav-cta" href="/agence/chat">Parler du projet <ArrowRight size={14}/></a></div></div></div>
    <main>
      <section className="agency-hero"><div className="agency-wrap agency-hero-grid"><div><p className="agency-eyebrow">STUDIO WEB · FRANCE</p><h1>Des sites qui donnent<br/><em>envie de vous choisir.</em></h1><p className="agency-lead">Je crée des sites modernes, rapides et pensés pour transformer une présence en ligne en vrais contacts clients.</p><div className="agency-actions"><a className="agency-primary" href="#contact">Créer mon site <ArrowRight size={15}/></a><a className="agency-secondary" href="#portfolio">Voir les réalisations</a></div><div className="agency-proof"><span>✓ Design sur mesure</span><span>✓ Mobile-first</span><span>✓ Mise en ligne incluse</span></div></div><div className="agency-visual"><div className="browser-card"><div className="browser-top"><i/><i/><i/><span>votre-entreprise.fr</span></div><div className="browser-content"><small>VOTRE MARQUE</small><strong>Une présence qui<br/>fait la différence.</strong><div className="browser-line"/><div className="browser-pill">Prendre rendez-vous →</div></div></div></div></div></section>
      <section className="agency-section" id="services"><div className="agency-wrap"><p className="agency-eyebrow">CE QUE JE FAIS</p><h2>Simple pour vous.<br/>Puissant pour vos clients.</h2><div className="agency-services"><article><b>01</b><h3>Création</h3><p>Un site pensé autour de votre activité, de vos clients et de votre image.</p></article><article><b>02</b><h3>Conversion</h3><p>Des appels à l’action clairs, des formulaires et des parcours qui donnent envie de passer à l’action.</p></article><article><b>03</b><h3>Visibilité</h3><p>Structure SEO locale, performance mobile et fondations techniques propres.</p></article></div></div></section>
      <section className="agency-section agency-dark" id="portfolio"><div className="agency-wrap"><p className="agency-eyebrow">PORTFOLIO</p><h2>Des démos prêtes à<br/>devenir vos prochains projets.</h2><div className="agency-projects"><a href="/" className="agency-project"><span>01 · MÉDIA</span><strong>ÉcoPulse</strong><small>Actualité économique & sportive</small><ArrowUpRight size={18}/></a><div className="agency-project"><span>02 · FITNESS</span><strong>Iron House</strong><small>Concept de site pour salle de sport</small><ArrowUpRight size={18}/></div><div className="agency-project"><span>03 · BEAUTÉ</span><strong>Studio 13</strong><small>Concept de site pour professionnel local</small><ArrowUpRight size={18}/></div></div></div></section>
      <section className="agency-section" id="tarifs"><div className="agency-wrap"><p className="agency-eyebrow">OFFRES</p><h2>Un prix clair.<br/>Pas de mauvaise surprise.</h2><div className="agency-pricing">{offers.map((o,i)=><article className={i===1?"agency-price featured":"agency-price"} key={o.name}>{i===1&&<span className="agency-badge">LE PLUS CHOISI</span>}<p>{o.name}</p><strong>{o.price}</strong><span>à partir de</span><h3>{o.text}</h3><ul>{o.items.map(x=><li key={x}>✓ {x}</li>)}</ul><a href="#contact">Choisir cette offre <ArrowRight size={14}/></a></article>)}</div><div className="agency-retainer"><div><p>MAINTENANCE</p><strong>49 €/mois</strong></div><span>Modifications, surveillance, petites améliorations et suivi du site.</span></div></div></section>
      <section className="agency-section agency-contact" id="contact"><div className="agency-wrap agency-contact-box"><div><p className="agency-eyebrow">VOTRE PROJET</p><h2>On transforme votre idée<br/>en site cette semaine.</h2><p>Expliquez simplement votre activité. La première discussion sert à définir le besoin et le bon format.</p></div><div className="agency-contact-card"><strong>Prêt à commencer ?</strong><p>Remplacez ce bouton par votre e-mail, WhatsApp ou Calendly avant de prospecter.</p><a href="/agence/chat">Discuter de mon projet <ArrowRight size={15}/></a></div></div></section>
    </main>
    <footer className="agency-footer"><div className="agency-wrap"><strong>n. NOA STUDIO</strong><span>Sites web modernes pour entreprises ambitieuses.</span><div><a href="/">ÉcoPulse</a><span> · </span><a href="/#sport">Sport</a><span> · </span><a href="/agence/chat">Chat projet</a><span> · </span><a href="/agence/messages">Espace admin</a></div></div></footer>
  </div>;
}


function ChatPage() {
  const [conversation, setConversation] = useState(null);
  const [form, setForm] = useState({name:"", email:""});
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startChat(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/chat/start", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form)});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de démarrer la discussion.");
      localStorage.setItem("noaChatId", data.id);
      setConversation(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function loadConversation(id) {
    const response = await fetch("/api/chat/" + id);
    if (!response.ok) { localStorage.removeItem("noaChatId"); return; }
    setConversation(await response.json());
  }

  useEffect(() => {
    const id = localStorage.getItem("noaChatId");
    if (id) loadConversation(id);
  }, []);

  useEffect(() => {
    if (!conversation?.id) return;
    const timer = setInterval(() => loadConversation(conversation.id), 2500);
    return () => clearInterval(timer);
  }, [conversation?.id]);

  async function sendMessage(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value || !conversation) return;
    setText("");
    const response = await fetch("/api/chat/" + conversation.id + "/messages", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({sender:"client", text:value})
    });
    if (response.ok) loadConversation(conversation.id);
  }

  if (!conversation) return <div className="chat-page"><div className="chat-card chat-start-card">
    <a className="chat-back" href="/">← ÉcoPulse · NOA STUDIO</a>
    <div className="chat-brand">n.</div>
    <p className="agency-eyebrow">DISCUSSION PROJET</p>
    <h1>Parlons de<br/><em>votre projet.</em></h1>
    <p className="chat-intro">Laissez vos coordonnées et ouvrez directement une conversation avec NOA STUDIO.</p>
    <form onSubmit={startChat} className="chat-form">
      <label>Votre nom<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ex. Thomas Martin" required/></label>
      <label>Votre e-mail<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="vous@email.com" required/></label>
      <button disabled={loading}>{loading ? "Ouverture…" : "Démarrer la discussion"} <ArrowRight size={15}/></button>
    </form>
    {error && <p className="chat-error">{error}</p>}
  </div></div>;

  return <div className="chat-page"><div className="chat-shell">
    <header className="chat-header"><a href="/" className="chat-brand-mini"><span>n.</span> NOA STUDIO · ÉcoPulse</a><div><strong>{conversation.name}</strong><small>{conversation.email}</small></div><a href="/" className="chat-close">×</a></header>
    <div className="chat-status"><span/> Conversation privée · Réponse de Noa</div>
    <div className="chat-messages">{conversation.messages.length ? conversation.messages.map(message =>
      <div key={message.id} className={"chat-message " + (message.sender === "client" ? "client" : "owner")}><div>{message.text}</div><small>{new Intl.DateTimeFormat("fr-FR",{hour:"2-digit",minute:"2-digit"}).format(new Date(message.createdAt))}</small></div>
    ) : <div className="chat-empty">Écris ton premier message pour présenter ton projet.</div>}</div>
    <form className="chat-composer" onSubmit={sendMessage}><input value={text} onChange={e=>setText(e.target.value)} placeholder="Écris ton message…" autoComplete="off"/><button disabled={!text.trim()} aria-label="Envoyer"><ArrowRight size={18}/></button></form>
  </div></div>;
}

function ChatAdminPage() {
  const [key, setKey] = useState(() => sessionStorage.getItem("noaAdminKey") || "");
  const [authorized, setAuthorized] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    const response = await fetch("/api/chat-admin/conversations", {headers:{"x-admin-key":key}});
    if (!response.ok) { setAuthorized(false); setError("Clé administrateur incorrecte."); return; }
    const data = await response.json();
    setAuthorized(true); setError(""); setConversations(data);
    if (selected) {
      const current = data.find(x=>x.id===selected.id);
      if (current) setSelected(current);
    } else if (data[0]) setSelected(data[0]);
  }

  useEffect(() => { if (key) refresh(); }, []);

  useEffect(() => {
    if (!authorized) return;
    const timer = setInterval(refresh, 2500);
    return () => clearInterval(timer);
  }, [authorized, key, selected?.id]);

  async function login(e) {
    e.preventDefault();
    sessionStorage.setItem("noaAdminKey", key);
    await refresh();
  }

  async function reply(e) {
    e.preventDefault();
    if (!selected || !text.trim()) return;
    const value = text.trim(); setText("");
    await fetch("/api/chat/" + selected.id + "/messages", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sender:"owner",text:value})});
    await refresh();
  }

  if (!authorized) return <div className="chat-page"><div className="chat-card chat-start-card">
    <a className="chat-back" href="/">← ÉcoPulse · NOA STUDIO</a><div className="chat-brand">n.</div>
    <p className="agency-eyebrow">ESPACE NOA STUDIO</p><h1>Messages<br/><em>clients.</em></h1>
    <form onSubmit={login} className="chat-form"><label>Clé administrateur<input type="password" value={key} onChange={e=>setKey(e.target.value)} placeholder="Votre clé" required/></label><button>Ouvrir les conversations <ArrowRight size={15}/></button></form>
    {error && <p className="chat-error">{error}</p>}
  </div></div>;

  return <div className="chat-admin"><header><a href="/" className="chat-brand-mini"><span>n.</span> NOA STUDIO · ÉcoPulse</a><strong>Conversations clients</strong><a href="/" className="chat-close">×</a></header>
    <div className="chat-admin-grid"><aside className="chat-list">{conversations.length ? conversations.map(c=><button key={c.id} className={selected?.id===c.id?"selected":""} onClick={()=>setSelected(c)}><strong>{c.name}</strong><span>{c.email}</span><small>{c.messages.at(-1)?.text || "Nouvelle conversation"}</small></button>) : <p>Aucune conversation pour le moment.</p>}</aside>
      <section className="chat-admin-window">{selected ? <><div className="chat-admin-title"><strong>{selected.name}</strong><span>{selected.email}</span></div><div className="chat-messages">{selected.messages.map(message=><div key={message.id} className={"chat-message " + (message.sender === "owner" ? "owner" : "client")}><div>{message.text}</div><small>{new Intl.DateTimeFormat("fr-FR",{hour:"2-digit",minute:"2-digit"}).format(new Date(message.createdAt))}</small></div>)}</div><form className="chat-composer" onSubmit={reply}><input value={text} onChange={e=>setText(e.target.value)} placeholder="Répondre au client…"/><button disabled={!text.trim()}><ArrowRight size={18}/></button></form></> : <div className="chat-empty">Sélectionne une conversation.</div>}</section>
    </div>
  </div>;
}

const root = createRoot(document.getElementById("root"));
root.render(window.location.pathname === "/market" ? <MarketAIPage /> : window.location.pathname === "/agence" ? <AgencyPage /> : window.location.pathname === "/agence/chat" ? <ChatPage /> : window.location.pathname === "/agence/messages" ? <ChatAdminPage /> : <App />);