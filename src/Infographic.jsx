import { forwardRef } from "react";

const Infographic = forwardRef(function Infographic({ data }, ref) {
  const date = new Date(data.fetchedAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const ok = data.checks.filter((c) => c.ok).length;

  return (
    <article className="card" ref={ref}>
      <div className="poster-sky" />
      <div className="poster-sun" />
      <div className="poster-cloud pc1" />
      <div className="poster-cloud pc2" />
      <div className="poster-cloud pc3" />
      <div className="poster-hill" />
      <div className="poster-hill b" />
      <div className="card-in">
        <div className="card-top">
          <div className="host-block">
            <small>Carte du ciel</small>
            <b>{data.host}</b>
          </div>
          <div className="seal">ORBE</div>
        </div>
        <div className="score-row">
          <div className="ink-orb">{data.overall}</div>
          <div className="chips">
            <div className="chip"><span>Socle</span><b>{data.technical}</b></div>
            <div className="chip"><span>Mots-cles</span><b>{data.keywordScore}</b></div>
            <div className="chip"><span>Checks</span><b>{ok}/{data.checks.length}</b></div>
          </div>
        </div>
        <p className="verdict">{data.verdict.line}</p>
        <div className="kws">
          {data.keywords.slice(0, 4).map((k) => (
            <div className="kw" key={k.keyword}>
              <header>
                <span>{k.keyword}</span>
                <span>{k.score} · {k.label}</span>
              </header>
              <div className="bar"><i style={{ width: `${k.score}%` }} /></div>
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
