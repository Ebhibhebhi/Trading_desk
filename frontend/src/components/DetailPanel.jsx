import { useEffect, useState } from 'react';
import PriceHistoryChart from './PriceHistoryChart';
import { fetchEventHistory } from '../api';

const SIGNAL_META = {
  artist_heat:     { label: 'Artist Heat',      desc: 'Spotify popularity (percentile)' },
  supply_pressure: { label: 'Supply Pressure',  desc: 'Inverse listing count (percentile)' },
  depletion_rate:  { label: 'Depletion Rate',   desc: 'Listings lost since first snapshot' },
  days_to_event:   { label: 'Timing Score',     desc: 'Trapezoid curve, peaks 14–45 days' },
};

export default function DetailPanel({ event, weights, onClose }) {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    setLoadingHistory(true);
    fetchEventHistory(event.id)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [event.id]);

  const eventDate = new Date(event.event_date);
  const daysOut = Math.max(0, Math.round((eventDate - Date.now()) / 86400000));

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div>
          <h2 className="detail-title">{event.title}</h2>
          <p className="detail-sub">
            {event.venue_name} &middot;{' '}
            {eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' '}· {daysOut}d out
          </p>
          {event.url && (
            <a href={event.url} target="_blank" rel="noreferrer" className="detail-link">
              View on SeatGeek ↗
            </a>
          )}
        </div>
        <button onClick={onClose} className="close-btn" aria-label="Close">✕</button>
      </div>

      <div className="detail-body">
        <section>
          <h3 className="section-label">Signal Breakdown</h3>
          {Object.entries(event.signals).map(([key, value]) => {
            const meta = SIGNAL_META[key];
            const weight = weights[key] ?? 0;
            const contribution = value !== null ? value * weight : null;
            return (
              <div key={key} className="signal-bar-row">
                <div className="signal-bar-label-group">
                  <span className="signal-bar-name">{meta.label}</span>
                  <span className="muted" style={{ fontSize: 10 }}>{meta.desc}</span>
                </div>
                {value !== null ? (
                  <>
                    <div className="signal-bar-track">
                      <div className="signal-bar-fill" style={{ width: `${value * 100}%` }} />
                    </div>
                    <span className="signal-bar-value">{(value * 100).toFixed(0)}</span>
                    <span className="muted signal-contrib">
                      ×{weight.toFixed(2)} = {contribution !== null ? (contribution * 100).toFixed(0) : '—'}
                    </span>
                  </>
                ) : (
                  <span className="muted pending-tag">Pending — need 6+ snapshots</span>
                )}
              </div>
            );
          })}
        </section>

        <div className="detail-stats-grid">
          <section>
            <h3 className="section-label">Market Data</h3>
            <StatRow label="Floor" value={event.price_floor ? `$${Math.round(event.price_floor)}` : '—'} />
            <StatRow label="Median" value={event.price_median ? `$${Math.round(event.price_median)}` : '—'} />
            <StatRow label="Ceiling" value={event.price_ceiling ? `$${Math.round(event.price_ceiling)}` : '—'} />
            <StatRow label="Listings" value={event.listing_count ?? '—'} />
            <StatRow label="Snapshots" value={event.snapshot_count} />
          </section>
          <section>
            <h3 className="section-label">Artist</h3>
            <StatRow label="Popularity" value={event.artist_popularity != null ? `${event.artist_popularity}/100` : '—'} />
            <StatRow label="Followers" value={event.artist_followers ? event.artist_followers.toLocaleString() : '—'} />
            {event.venue_capacity && (
              <StatRow label="Venue Cap." value={event.venue_capacity.toLocaleString()} />
            )}
            {event.artist_genres?.length > 0 && (
              <StatRow label="Genres" value={event.artist_genres.slice(0, 2).join(', ')} />
            )}
          </section>
        </div>

        <section>
          <h3 className="section-label">
            Price History
            {!loadingHistory && history.length > 0 && (
              <span className="muted" style={{ fontWeight: 400, marginLeft: 8 }}>
                ({history.length} snapshots)
              </span>
            )}
          </h3>
          {loadingHistory ? (
            <p className="muted">Loading...</p>
          ) : history.length >= 2 ? (
            <PriceHistoryChart data={history} />
          ) : (
            <p className="muted no-history">
              History builds as hourly polls run — check back after a few hours.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="stat-row">
      <span className="muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}
