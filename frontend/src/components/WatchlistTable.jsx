import { useState, useMemo } from 'react';

const SIGNAL_LABELS = {
  artist_heat:     'Artist Heat',
  supply_pressure: 'Supply Pressure',
  depletion_rate:  'Depletion Rate',
  days_to_event:   'Timing Score',
};

export default function WatchlistTable({ events, weights, thresholds, onSelectEvent, selectedEventId }) {
  const [sortField, setSortField] = useState('score');
  const [sortDir, setSortDir] = useState('desc');

  const scored = useMemo(() => {
    return events
      .map(ev => {
        const score = computeScore(ev.signals, weights);
        const tier = getTier(score, thresholds);
        const topDrivers = getTopDrivers(ev.signals, weights);
        return { ...ev, score, tier, topDrivers };
      })
      .sort((a, b) => {
        const dir = sortDir === 'desc' ? -1 : 1;
        if (sortField === 'score') return dir * (a.score - b.score);
        if (sortField === 'event_date') return dir * (new Date(a.event_date) - new Date(b.event_date));
        if (sortField === 'price_floor') return dir * ((a.price_floor ?? 0) - (b.price_floor ?? 0));
        if (sortField === 'listing_count') return dir * ((a.listing_count ?? 0) - (b.listing_count ?? 0));
        return 0;
      });
  }, [events, weights, thresholds, sortField, sortDir]);

  function handleSort(field) {
    if (sortField === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  function sortIcon(field) {
    if (sortField !== field) return <span className="sort-icon">⇅</span>;
    return <span className="sort-icon active">{sortDir === 'desc' ? '↓' : '↑'}</span>;
  }

  if (scored.length === 0) {
    return (
      <div className="empty-state">
        <p>No upcoming events in the database.</p>
        <p className="muted">Click <strong>Refresh Data</strong> to pull from SeatGeek.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="watchlist-table">
        <thead>
          <tr>
            <th>Tier</th>
            <th>Event</th>
            <th>Venue</th>
            <th className="sortable" onClick={() => handleSort('event_date')}>Date {sortIcon('event_date')}</th>
            <th>Days</th>
            <th className="sortable" onClick={() => handleSort('price_floor')}>Floor {sortIcon('price_floor')}</th>
            <th>Median</th>
            <th className="sortable" onClick={() => handleSort('listing_count')}>Listings {sortIcon('listing_count')}</th>
            <th className="sortable" onClick={() => handleSort('score')}>Score {sortIcon('score')}</th>
            <th>Top Signals</th>
          </tr>
        </thead>
        <tbody>
          {scored.map(ev => {
            const daysOut = Math.max(0, Math.round((new Date(ev.event_date) - Date.now()) / 86400000));
            const isSelected = ev.id === selectedEventId;
            return (
              <tr
                key={ev.id}
                className={`event-row ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectEvent(isSelected ? null : ev)}
              >
                <td>
                  <span className={`tier-badge ${ev.tier.toLowerCase()}`}>{ev.tier}</span>
                </td>
                <td className="cell-event">
                  <div className="event-title">{ev.title}</div>
                  {ev.artist_name && <div className="artist-name">{ev.artist_name}</div>}
                </td>
                <td className="muted">{ev.venue_name}</td>
                <td className="tabnum">{new Date(ev.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</td>
                <td className="tabnum">{daysOut}d</td>
                <td className="tabnum">{ev.price_floor ? `$${Math.round(ev.price_floor)}` : '—'}</td>
                <td className="tabnum muted">{ev.price_median ? `$${Math.round(ev.price_median)}` : '—'}</td>
                <td className="tabnum">{ev.listing_count ?? '—'}</td>
                <td>
                  <span className={`score ${ev.tier.toLowerCase()}`}>
                    {(ev.score * 100).toFixed(0)}
                  </span>
                </td>
                <td>
                  <div className="driver-chips">
                    {ev.topDrivers.map(d => (
                      <span key={d.key} className="driver-chip">{SIGNAL_LABELS[d.key]}</span>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function computeScore(signals, weights) {
  let totalWeight = 0;
  let weightedSum = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const value = signals[key] !== null && signals[key] !== undefined ? signals[key] : 0.5;
    totalWeight += weight;
    weightedSum += value * weight;
  }
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

function getTier(score, thresholds) {
  if (score >= thresholds.buy) return 'BUY';
  if (score >= thresholds.watch) return 'WATCH';
  return 'AVOID';
}

function getTopDrivers(signals, weights) {
  return Object.entries(signals)
    .map(([key, value]) => ({
      key,
      contribution: (value !== null && value !== undefined ? value : 0.5) * (weights[key] || 0),
    }))
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 2);
}
