import { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import Infographic from "./Infographic.jsx";

const HIT_LABEL = {
  title: "Titre",
  h1: "H1",
  meta: "Meta",
  url: "URL",
  first: "Intro",
  alts: "Images",
};

function Story({ data, onSkip }) {
  const [i, setI] = useState(0);
  const slides = useMemo(() => {
    const top = data.keywords[0];
    return [
      {
        k: "Lecture",
        t: data.host,
        p: data.title || "Page analysée. Voici ce que Google voit vraiment.",
      },
      {
        k: "Score",
        t: `${data.overall} / 100`,
        p: data.verdict.line,
      },
      top
        ? {
            k: "Mot-clé",
            t: top.keyword,
            p: `Fit on-page ${top.score}/100 · ${top.label}. ${top.tip}`,
          }
        : {
            k: "Mots-clés",
            t: "Aucun mot-clé ciblé",
            p: "Ajoute 2 ou 3 intentions de recherche pour mesurer le fit.",
          },
      {
        k: "À faire",
        t: data.recos[0]?.priority || "Suite",
        p: data.recos[0]?.text || "Rien de bloquant détecté.",
      },
    ];
  }, [data]);

  const last = i >= slides.length - 1;
  const s = slides[Math.min(i, slides.length - 1)];

  return (
    <div className="story">
      <button className="ghost skip" type="button" onClick={onSkip}>
        Passer
      </button>
      <div className="slide" key={s.t}>
        <div className="kicker">{s.k}</div>
        <h2>{s.t}</h2>
        <p>{s.p}</p>
        <div className="toolbar" style={{ marginTop: 8 }}>
          {last ? (
            <button className="solid" type="button" onClick={onSkip}>
              Voir l’infographie
            </button>
          ) : (
            <button className="solid" type="button" onClick={() => setI((n) => n + 1)}>
              Continuer
            </button>
          )}
        </div>
      </div>
      <div className="dots">
        {slides.map((_, n) => (
          <b key={n} className={n === i ? "on" : ""} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [url, setUrl] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [story, setStory] = useState(true);
  const [copied, setCopied] = useState("");
  const cardRef = useRef(null);

  async function run(e) {
    e.preventDefault();
    setError("");
    setData(null);
    setCopied("");
    setStory(true);
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, keywords }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Analyse impossible");
      setData(json);
    } catch (err) {
      setError(err.message || "Réseau indisponible");
    } finally {
      setLoading(false);
    }
  }

  async function raster() {
    if (!cardRef.current) return null;
    return toPng(cardRef.current, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: "#0f1117",
    });
  }

  async function copyCard() {
    try {
      const dataUrl = await raster();
      const blob = await (await fetch(dataUrl)).blob();
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopied("Infographie copiée");
      } else {
        downloadCard(dataUrl);
      }
    } catch {
      const dataUrl = await raster();
      downloadCard(dataUrl);
    }
  }

  function downloadCard(dataUrl) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `orbe-${data?.host || "audit"}.png`;
    a.click();
    setCopied("PNG téléchargé");
  }

  async function saveCard() {
    const dataUrl = await raster();
    downloadCard(dataUrl);
  }

  return (
    <div className="app">
      <div className="wrap">
        <nav className="nav">
          <a className="brand" href="/">
            <div className="mark">
              <i />
            </div>
            <div>
              <strong>Orbe</strong>
              <span>SEO lisible</span>
            </div>
          </a>
          <div className="pill">Gratuit · 1 URL</div>
        </nav>

        <header className="hero">
          <h1>
            La perf SEO,
            <br />
            <em>en une carte.</em>
          </h1>
          <p>
            Colle l’URL. Ajoute des mots-clés — ou laisse vide, on les déduit. Résultat : une
            infographie animée, skippable, copiable.
          </p>
        </header>

        <form className="panel" onSubmit={run}>
          <div className="fields">
            <label>
              <span>URL du site ou de la page</span>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://exemple.com/page"
                autoComplete="url"
                required
              />
            </label>
            <label>
              <span>Mots-clés (optionnel)</span>
              <textarea
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="un par ligne, ou séparés par des virgules — ex. audit seo, core web vitals"
              />
            </label>
            <div className="row">
              <p className="hint">Sans mots-clés : extraction depuis titre, H1 et sous-titres.</p>
              <button className="go" type="submit" disabled={loading}>
                {loading ? "Lecture de la page…" : "Analyser"}
              </button>
            </div>
          </div>
          {error ? <div className="err">{error}</div> : null}
        </form>

        {data && (
          <section className="stage">
            {story ? (
              <Story data={data} onSkip={() => setStory(false)} />
            ) : (
              <>
                <div className="toolbar">
                  <button className="solid" type="button" onClick={copyCard}>
                    {copied || "Copier l’infographie"}
                  </button>
                  <button className="ghost" type="button" onClick={saveCard}>
                    Télécharger PNG
                  </button>
                  <button className="ghost" type="button" onClick={() => setStory(true)}>
                    Rejouer
                  </button>
                </div>

                <div className="board">
                  <div className="card-shell">
                    <Infographic ref={cardRef} data={data} />
                  </div>

                  <div className="detail">
                    <h3>Ce que ça veut dire</h3>
                    <div>
                      {data.checks.map((c) => (
                        <div className="check" key={c.id}>
                          <span className={`dot ${c.ok ? "ok" : "no"}`} />
                          <p>
                            {c.label}
                            <small>{c.detail}</small>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="detail">
                  <h3>
                    {data.source === "user" ? "Tes mots-clés" : "Mots-clés détectés"}
                  </h3>
                  <div className="kw-list">
                    {data.keywords.map((k) => (
                      <div className="kw-card" key={k.keyword}>
                        <header className="row">
                          <h4>{k.keyword}</h4>
                          <b style={{ fontFamily: "Syne, sans-serif" }}>{k.score}</b>
                        </header>
                        <div className="tags">
                          {Object.entries(k.hits).map(([key, on]) => (
                            <span className={`tag ${on ? "on" : ""}`} key={key}>
                              {HIT_LABEL[key]}
                            </span>
                          ))}
                        </div>
                        <p className="hint">{k.tip}</p>
                        {k.visibility && (
                          <p
                            className={`vis ${
                              k.visibility.status === "visible"
                                ? "good"
                                : k.visibility.status === "absent"
                                ? "bad"
                                : ""
                            }`}
                          >
                            {k.visibility.status === "visible"
                              ? "Signal de visibilité : la page apparaît dans un moteur pour cette requête ciblée."
                              : k.visibility.status === "absent"
                              ? "Pas de résultat évident pour « mot-clé + site ». Page trop neuve, noindex, ou hors intention."
                              : "Visibilité web non confirmée (moteur saturé)."}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
