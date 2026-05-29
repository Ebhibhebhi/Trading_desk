export default function ThresholdConfig({ thresholds, onChange }) {
  function handleChange(key, raw) {
    const val = parseFloat(raw);
    if (isNaN(val)) return;
    const clamped = Math.max(0, Math.min(1, val));
    const next = { ...thresholds, [key]: clamped };
    if (next.watch >= next.buy) return;
    onChange(next);
  }

  return (
    <div className="threshold-config">
      <span className="section-label">Tier Thresholds</span>
      <div className="threshold-row">
        <span className="tier-label buy">BUY ≥</span>
        <input
          type="number"
          min="0" max="1" step="0.05"
          value={thresholds.buy}
          onChange={e => handleChange('buy', e.target.value)}
          className="threshold-input"
        />
      </div>
      <div className="threshold-row">
        <span className="tier-label watch">WATCH ≥</span>
        <input
          type="number"
          min="0" max="1" step="0.05"
          value={thresholds.watch}
          onChange={e => handleChange('watch', e.target.value)}
          className="threshold-input"
        />
      </div>
    </div>
  );
}
