import { useState, useEffect, useCallback } from 'react';
import WatchlistTable from './components/WatchlistTable';
import SignalSliders from './components/SignalSliders';
import DetailPanel from './components/DetailPanel';
import ThresholdConfig from './components/ThresholdConfig';
import { fetchEvents, fetchConfig, updateConfig, triggerRefresh } from './api';

const DEFAULT_WEIGHTS = {
  price_firmness:  0.30,
  supply_pressure: 0.25,
  depletion_rate:  0.25,
  days_to_event:   0.20,
};

const DEFAULT_THRESHOLDS = { buy: 0.65, watch: 0.40 };

export default function App() {
  const [events, setEvents] = useState([]);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [eventsData, configData] = await Promise.all([fetchEvents(), fetchConfig()]);
      setEvents(eventsData);
      if (configData?.thresholds) setThresholds(configData.thresholds);
      setLastUpdated(new Date());
      setSelectedEvent(null);
    } catch {
      setError('Cannot reach backend. Is it running on port 8000?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000); // auto-refresh every 5 min
    return () => clearInterval(interval);
  }, [loadData]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await triggerRefresh();
      setTimeout(loadData, 4000); // give poll ~4s to finish then reload
    } catch {
      setError('Refresh failed');
    } finally {
      setRefreshing(false);
    }
  }

  async function handleThresholdChange(next) {
    setThresholds(next);
    try { await updateConfig({ thresholds: next }); } catch { /* non-critical */ }
  }

  const buyCount   = events.filter(e => scoreAndTier(e.signals, weights, thresholds) === 'BUY').length;
  const watchCount = events.filter(e => scoreAndTier(e.signals, weights, thresholds) === 'WATCH').length;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="logo">SKY STRIKE</span>
          <span className="header-sub">Concert Ticket Intelligence · LA</span>
        </div>
        <div className="header-center">
          {events.length > 0 && (
            <div className="tier-summary">
              <span className="ts-badge buy">{buyCount} BUY</span>
              <span className="ts-badge watch">{watchCount} WATCH</span>
              <span className="ts-badge avoid">{events.length - buyCount - watchCount} AVOID</span>
            </div>
          )}
        </div>
        <div className="header-right">
          {lastUpdated && (
            <span className="muted" style={{ fontSize: 11 }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          {error && <span className="error-text">{error}</span>}
          <button onClick={handleRefresh} disabled={refreshing} className="btn-refresh">
            {refreshing ? 'Refreshing…' : '⟳ Refresh Data'}
          </button>
        </div>
      </header>

      <div className="controls-bar">
        <SignalSliders weights={weights} onChange={setWeights} />
        <div className="controls-divider" />
        <ThresholdConfig thresholds={thresholds} onChange={handleThresholdChange} />
      </div>

      <main className="main-content">
        {loading ? (
          <div className="empty-state"><p>Loading events…</p></div>
        ) : (
          <WatchlistTable
            events={events}
            weights={weights}
            thresholds={thresholds}
            onSelectEvent={setSelectedEvent}
            selectedEventId={selectedEvent?.id}
          />
        )}
      </main>

      {selectedEvent && (
        <div
          className="detail-overlay"
          onClick={e => { if (e.target === e.currentTarget) setSelectedEvent(null); }}
        >
          <DetailPanel
            event={selectedEvent}
            weights={weights}
            onClose={() => setSelectedEvent(null)}
          />
        </div>
      )}
    </div>
  );
}

function scoreAndTier(signals, weights, thresholds) {
  let total = 0, sum = 0;
  for (const [k, w] of Object.entries(weights)) {
    const v = signals[k] !== null && signals[k] !== undefined ? signals[k] : 0.5;
    total += w; sum += v * w;
  }
  const score = total > 0 ? sum / total : 0;
  if (score >= thresholds.buy) return 'BUY';
  if (score >= thresholds.watch) return 'WATCH';
  return 'AVOID';
}
