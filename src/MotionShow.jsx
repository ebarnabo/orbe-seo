import { useEffect, useState } from "react";

const DURATION = 3400;

export default function MotionShow({ data, onSkip }) {
  const [i, setI] = useState(0);
  const top = data.keywords.slice(0, 3);

  const scenes = [
    {
      id: "open",
      kicker: "Le ciel s'ouvre",
      title: data.host,
      body: data.title || "La page est lue. Le vent apporte ce que les moteurs voient.",
    },
    {
      id: "sun",
      kicker: "Soleil du matin",
      title: null,
      body: data.verdict.line,
    },
    {
      id: "kites",
      kicker: "Cerfs-volants",
      title: top.length ? "Les mots prennent l'air" : "Pas de mot-cle cible",
      body: top.length ? "Chaque cerf-volant = un mot-cle et sa prise sur la page." : "Ajoute 2 ou 3 intentions pour mesurer le fit.",
    },
    {
      id: "path",
      kicker: "Le sentier",
      title: data.recos[0]?.priority || "Suite",
      body: data.recos[0]?.text || "Rien de bloquant. Le ciel est deja clair.",
    },
  ];

  useEffect(() => {
    const t = setTimeout(() => {
      if (i >= scenes.length - 1) onSkip();
      else setI((n) => n + 1);
    }, DURATION);
    return () => clearTimeout(t);
  }, [i]);

  return (
    <div className="film">
      <button className="ghost film-skip" type="button" onClick={onSkip}>
        Passer
      </button>
      {scenes.map((sc, n) => (
        <div className={`scene ${n === i ? "on" : ""}`} key={sc.id}>
          <div>
            <div className="scene-kicker">{sc.kicker}</div>
            {sc.id === "sun" ? (
              <div style={{ display: "grid", justifyItems: "center", gap: 16 }}>
                <div className="sun-score">{data.overall}</div>
                <p>{sc.body}</p>
              </div>
            ) : sc.id === "kites" ? (
              <div>
                <h2>{sc.title}</h2>
                <div className="kite-row" style={{ marginTop: 24 }}>
                  {top.map((k) => (
                    <div className="kite" key={k.keyword}>
                      <b>{k.score}</b>
                      <span>{k.keyword}</span>
                    </div>
                  ))}
                </div>
                <p>{sc.body}</p>
              </div>
            ) : (
              <>
                <h2>{sc.title}</h2>
                <p>{sc.body}</p>
              </>
            )}
          </div>
        </div>
      ))}
      <div className="progress">
        <i className="run" key={i} />
      </div>
    </div>
  );
}
