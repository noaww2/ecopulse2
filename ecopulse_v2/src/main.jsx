import React, { useEffect, useMemo, useState } from "react";
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
    <footer><div className="wrap footer-inner"><a className="brand" href="#"><span className="brand-mark">é.</span><span>ÉcoPulse</span></a><span>{isSport ? "Le sport, expliqué simplement." : "L’économie, expliquée simplement."}</span><span>© {new Date().getFullYear()} ÉcoPulse</span></div><div className="wrap footer-note">Les contenus sont fournis par des sources tierces. Vérifiez les informations auprès de l’éditeur original. Les données de marché nécessitent une source financière distincte.</div></footer>
  </div>;
}

function AgencyPage() {
  const offers = [
    {name:"STARTER", price:"499 €", text:"Un site propre, rapide et professionnel pour être crédible en ligne.", items:["Jusqu’à 5 pages","Design responsive","Formulaire de contact","SEO local de base","Mise en ligne"]},
    {name:"PRO", price:"799 €", text:"Le pack recommandé pour transformer les visiteurs en clients.", items:["Tout le Starter","Prise de rendez-vous","Avis clients","Google Maps & réseaux","SEO local renforcé"]},
    {name:"PREMIUM", price:"999 €", text:"Une présence complète avec une expérience plus travaillée.", items:["Tout le Pro","Animations premium","Pages sur mesure","Suivi analytics","Optimisations mensuelles"]},
  ];
  return <div className="agency-page">
    <div className="agency-nav"><div className="agency-wrap"><a className="agency-logo" href="/agence"><span>n.</span> NOA STUDIO</a><div className="agency-nav-links"><a href="#services">Services</a><a href="#portfolio">Portfolio</a><a href="#tarifs">Tarifs</a><a className="agency-nav-cta" href="#contact">Parler du projet <ArrowRight size={14}/></a></div></div></div>
    <main>
      <section className="agency-hero"><div className="agency-wrap agency-hero-grid"><div><p className="agency-eyebrow">STUDIO WEB · FRANCE</p><h1>Des sites qui donnent<br/><em>envie de vous choisir.</em></h1><p className="agency-lead">Je crée des sites modernes, rapides et pensés pour transformer une présence en ligne en vrais contacts clients.</p><div className="agency-actions"><a className="agency-primary" href="#contact">Créer mon site <ArrowRight size={15}/></a><a className="agency-secondary" href="#portfolio">Voir les réalisations</a></div><div className="agency-proof"><span>✓ Design sur mesure</span><span>✓ Mobile-first</span><span>✓ Mise en ligne incluse</span></div></div><div className="agency-visual"><div className="browser-card"><div className="browser-top"><i/><i/><i/><span>votre-entreprise.fr</span></div><div className="browser-content"><small>VOTRE MARQUE</small><strong>Une présence qui<br/>fait la différence.</strong><div className="browser-line"/><div className="browser-pill">Prendre rendez-vous →</div></div></div></div></div></section>
      <section className="agency-section" id="services"><div className="agency-wrap"><p className="agency-eyebrow">CE QUE JE FAIS</p><h2>Simple pour vous.<br/>Puissant pour vos clients.</h2><div className="agency-services"><article><b>01</b><h3>Création</h3><p>Un site pensé autour de votre activité, de vos clients et de votre image.</p></article><article><b>02</b><h3>Conversion</h3><p>Des appels à l’action clairs, des formulaires et des parcours qui donnent envie de passer à l’action.</p></article><article><b>03</b><h3>Visibilité</h3><p>Structure SEO locale, performance mobile et fondations techniques propres.</p></article></div></div></section>
      <section className="agency-section agency-dark" id="portfolio"><div className="agency-wrap"><p className="agency-eyebrow">PORTFOLIO</p><h2>Des démos prêtes à<br/>devenir vos prochains projets.</h2><div className="agency-projects"><a href="/" className="agency-project"><span>01 · MÉDIA</span><strong>ÉcoPulse</strong><small>Actualité économique & sportive</small><ArrowUpRight size={18}/></a><div className="agency-project"><span>02 · FITNESS</span><strong>Iron House</strong><small>Concept de site pour salle de sport</small><ArrowUpRight size={18}/></div><div className="agency-project"><span>03 · BEAUTÉ</span><strong>Studio 13</strong><small>Concept de site pour professionnel local</small><ArrowUpRight size={18}/></div></div></div></section>
      <section className="agency-section" id="tarifs"><div className="agency-wrap"><p className="agency-eyebrow">OFFRES</p><h2>Un prix clair.<br/>Pas de mauvaise surprise.</h2><div className="agency-pricing">{offers.map((o,i)=><article className={i===1?"agency-price featured":"agency-price"} key={o.name}>{i===1&&<span className="agency-badge">LE PLUS CHOISI</span>}<p>{o.name}</p><strong>{o.price}</strong><span>à partir de</span><h3>{o.text}</h3><ul>{o.items.map(x=><li key={x}>✓ {x}</li>)}</ul><a href="#contact">Choisir cette offre <ArrowRight size={14}/></a></article>)}</div><div className="agency-retainer"><div><p>MAINTENANCE</p><strong>49 €/mois</strong></div><span>Modifications, surveillance, petites améliorations et suivi du site.</span></div></div></section>
      <section className="agency-section agency-contact" id="contact"><div className="agency-wrap agency-contact-box"><div><p className="agency-eyebrow">VOTRE PROJET</p><h2>On transforme votre idée<br/>en site cette semaine.</h2><p>Expliquez simplement votre activité. La première discussion sert à définir le besoin et le bon format.</p></div><div className="agency-contact-card"><strong>Prêt à commencer ?</strong><p>Remplacez ce bouton par votre e-mail, WhatsApp ou Calendly avant de prospecter.</p><a href="mailto:noagilmora@icloud.com?subject=Projet%20site%20web%20-%20NOA%20STUDIO">Demander une proposition <ArrowRight size={15}/></a></div></div></section>
    </main>
    <footer className="agency-footer"><div className="agency-wrap"><strong>n. NOA STUDIO</strong><span>Sites web modernes pour entreprises ambitieuses.</span><a href="/">Voir EcoPulse</a></div></footer>
  </div>;
}

const root = createRoot(document.getElementById("root"));
root.render(window.location.pathname === "/agence" ? <AgencyPage /> : <App />);