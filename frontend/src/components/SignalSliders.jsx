const SIGNALS = [
  { key: 'artist_heat',  label: 'Artist Heat',  desc: 'SeatGeek performer popularity (percentile)' },
  { key: 'event_buzz',   label: 'Event Buzz',   desc: 'SeatGeek event demand score (percentile)' },
  { key: 'timing_score', label: 'Timing Score', desc: 'Peaks at 14–45 days out' },
];

export default function SignalSliders({ weights, onChange }) {
  const total = Object.values(weights).reduce((s, v) => s + v, 0);
  const isValid = Math.abs(total - 1.0) < 0.011;

  function handleChange(key, value) {
    onChange({ ...weights, [key]: parseFloat(value) });
  }

  function normalize() {
    const sum = Object.values(weights).reduce((s, v) => s + v, 0);
    if (sum === 0) return;
    const normalized = Object.fromEntries(
      Object.entries(weights).map(([k, v]) => [k, Math.round((v / sum) * 100) / 100])
    );
    onChange(normalized);
  }

  return (
    <div className="signal-sliders">
      <div className="sliders-header">
        <span className="section-label">Signal Weights</span>
        <span className={`weight-sum ${isValid ? 'valid' : 'invalid'}`}>
          Sum: {total.toFixed(2)}
        </span>
        <button onClick={normalize} className="btn-ghost">Normalize</button>
      </div>
      {SIGNALS.map(({ key, label, desc }) => (
        <div key={key} className="slider-row">
          <div className="slider-label">
            <span>{label}</span>
            <span className="muted">{desc}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={weights[key]}
            onChange={e => handleChange(key, e.target.value)}
            className="slider"
          />
          <span className="slider-value">{weights[key].toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
