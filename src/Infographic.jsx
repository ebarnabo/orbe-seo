import { forwardRef } from "react";

function color(score) {
  if (score >= 75) return "#7ee0a3";
  if (score >= 50) return "#ffd166";
  return "#ff6b4a";
}

const Infographic = forwardRef(function Infographic({ data }, ref) {
  const r = 58;
  const c = 2 * Math.PI * r;
  const off = c - (data.overall / 100) * c;
  const date = new Date(data.fetchedAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <article className="card" ref={ref}>
      <div className="card-bg" />
      <div className="card-in">
        <div className="card-top">
          <div className="logo-mini">
            <i />
            ORBE
          </div>
          <div className="host">{data.host}</div>
        </div>

        <div className="orb-row">
          <div className="orb">
            <svg viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={r} fill="none" stroke="#222633" strokeWidth="12" />
              <circle
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke="url(#g)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={off}
              />
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ff6b4a" />
                  <stop offset="100%" stopColor="#c8f54a" />
                </linearGradient>
              </defs>
            </svg>
            <div className="score">{data.overall}</div>
          </div>
          <div className="meta-col">
            <div className="chip">
              <span>Socle technique</span>
              <b style={{ color: color(data.technical) }}>{data.technical}</b>
            </div>
            <div className="chip">
              <span>Mots-clés</span>
              <b style={{ color: color(data.keywordScore) }}>{data.keywordScore}</b>
            </div>
            <p className="verdict">{data.verdict.line}</p>
          </div>
        </div>

        <div className="kws">
          {data.keywords.slice(0, 4).map((k) => (
            <div className="kw" key={k.keyword}>
              <header>
                <span>{k.keyword}</span>
                <span>{k.score}</span>
              </header>
              <div className="bar">
                <i style={{ width: `${k.score}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="recos">
          {data.recos.slice(0, 2).map((r) => (
            <div className="reco" key={r.text}>
              <strong>{r.priority}</strong>
              {r.text}
            </div>
          ))}
        </div>

        <div className="foot">
          <span>orbe-seo.netlify.app</span>
          <span>{date}</span>
        </div>
      </div>
    </article>
  );
});

export default Infographic;
