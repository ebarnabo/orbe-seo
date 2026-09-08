import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import Infographic from "./Infographic.jsx";
import MotionShow from "./MotionShow.jsx";
import Sky from "./Sky.jsx";

const HIT_LABEL = {
  title: "Titre",
  h1: "H1",
  meta: "Meta",
  url: "URL",
  first: "Intro",
  alts: "Images",
};

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
      setError(err.message || "Reseau indisponible");
    } finally {
      setLoading(false);
    }
  }

  async function raster() {
    if (!cardRef.current) return null;
    return toPng(cardRef.current, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: "#d7ecf3",
    });
  }

  async function copyCard() {
    try {
      const dataUrl = await raster();
      const blob = await (await fetch(dataUrl)).blob();
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopied("Carte copiee");
      } else {
        downloadCard(dataUrl);
      }
    } catch {
      downloadCard(await raster());
    }
  }

  function downloadCard(dataUrl) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `orbe-${data?.host || "audit"}.png`;
    a.click();
    setCopied("PNG enregistre");
  }

  return (
    <div className="app">
      <Sky />
      <div className="wrap">
        <nav className="nav">
          <a className="brand" href="/">
            <div className="mark"><i /></div>
            <div>
              <strong>ORBE</strong>
              <span>le ciel de ta page</span>
            </div>
          </a>
          <div className="pill">Lecture gratuite · 1 URL</div>
        </nav>

        <header className="hero">
          <h1>
            Un matin clair
            <br />
            <em>pour ton SEO.</em>
          </h1>
          <p>
            Colle l'URL. Les mots-cles sont optionnels. Le ciel se dechire, le soleil donne le
            score, les cerfs-volants portent les requetes. Tu peux tout passer.
          </p>
        </header>

        <form className="panel" onSubmit={run}>
          <div className="fields">
            <label>
              <span>URL</span>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://exemple.com/page"
                autoComplete="url"
                required
              />
            </label>
            <label>
              <span>Mots-cles — optionnel</span>
              <textarea
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="un par ligne, ou separes par des virgules"
              />
            </label>
            <div className="row">
              <p className="hint">Sans mots-cles, on les cueille dans le titre et les Hn.</p>
              <button className="go" type="submit" disabled={loading}>
                {loading ? "Les nuages se levent…" : "Lire la page"}
              </button>
            </div>
          </div>
          {error ? <div className="err">{error}</div> : null}
        </form>

        {data && (
          <section className="stage">
            {story ? (
              <MotionShow data={data} onSkip={() => setStory(false)} />
            ) : (
              <>
                <div className="toolbar">
                  <button className="solid" type="button" onClick={copyCard}>
                    {copied || "Copier la carte"}
                  </button>
                  <button className="ghost" type="button" onClick={async () => downloadCard(await raster())}>
                    Telecharger PNG
                  </button>
                  <button className="ghost" type="button" onClick={() => setStory(true)}>
                    Rejouer le ciel
                  </button>
                </div>

                <div className="board">
                  <div className="card-shell">
                    <Infographic ref={cardRef} data={data} />
                  </div>
                  <div className="detail">
                    <h3>Ce que le ciel raconte</h3>
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
                  <h3>{data.source === "user" ? "Tes mots-cles" : "Mots cueillis"}</h3>
                  <div className="kw-list">
                    {data.keywords.map((k) => (
                      <div className="kw-card" key={k.keyword}>
                        <header className="row">
                          <h4>{k.keyword}</h4>
                          <b style={{ fontFamily: "Shippori Mincho, serif" }}>{k.score}</b>
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
                              ? "Un moteur trouve la page pour cette requete ciblee."
                              : k.visibility.status === "absent"
                              ? "Pas de trace evidente pour mot-cle + site."
                              : "Ciel voile : visibilite non confirmee."}
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
