export default function Sky() {
  return (
    <div className="sky" aria-hidden="true">
      <div className="sky-wash" />
      <div className="sun-disc" />
      <div className="haze" />
      <svg className="cloud-layer c1" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice">
        <ellipse cx="180" cy="160" rx="140" ry="48" fill="#fffaf0" opacity=".92" />
        <ellipse cx="280" cy="148" rx="110" ry="58" fill="#fff7ea" opacity=".9" />
        <ellipse cx="90" cy="168" rx="80" ry="36" fill="#f3e7d4" opacity=".75" />
      </svg>
      <svg className="cloud-layer c2" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice">
        <ellipse cx="860" cy="90" rx="170" ry="52" fill="#fffdf8" opacity=".88" />
        <ellipse cx="980" cy="78" rx="120" ry="60" fill="#f7edd8" opacity=".8" />
        <ellipse cx="740" cy="98" rx="90" ry="40" fill="#ffe9c8" opacity=".55" />
      </svg>
      <svg className="cloud-layer c3" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice">
        <ellipse cx="520" cy="210" rx="200" ry="46" fill="#fff8ec" opacity=".7" />
        <ellipse cx="640" cy="200" rx="130" ry="54" fill="#efe0c8" opacity=".55" />
      </svg>
      <svg className="birds" viewBox="0 0 200 80">
        <path d="M20 40 q12 -10 24 0" />
        <path d="M44 28 q8 -8 16 0" />
        <path d="M70 36 q10 -9 20 0" />
      </svg>
      <div className="hills">
        <i className="h far" />
        <i className="h mid" />
        <i className="h near" />
      </div>
      <div className="grain" />
    </div>
  );
}
