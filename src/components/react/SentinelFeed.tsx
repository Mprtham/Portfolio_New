import { useState, useEffect, useRef } from 'react';

interface Event {
  id: number;
  ts: string;
  metric: string;
  value: string;
  source: string;
  anomaly: boolean;
  zscore?: number;
  report?: string;
}

const METRICS = [
  { name: 'api.latency_p99', unit: 'ms', base: 142, noise: 18, source: 'gateway-eu-1' },
  { name: 'orders.throughput', unit: '/s', base: 847, noise: 62, source: 'checkout-svc' },
  { name: 'db.query_time', unit: 'ms', base: 23, noise: 5, source: 'postgres-primary' },
  { name: 'cache.hit_rate', unit: '%', base: 94.2, noise: 1.8, source: 'redis-cluster' },
  { name: 'error.rate', unit: '%', base: 0.18, noise: 0.06, source: 'edge-worker' },
  { name: 'memory.usage', unit: 'MB', base: 512, noise: 44, source: 'analytics-svc' },
  { name: 'queue.depth', unit: 'msgs', base: 12, noise: 4, source: 'kafka-consumer' },
];

const ANOMALY_REPORTS = [
  (metric: string, val: string, z: number) =>
    `Root cause: ${metric} exceeded ${z.toFixed(1)}σ threshold. Correlated with cache.hit_rate drop observed 90s prior. Probable cause: Redis eviction under memory pressure. Recommend: increase maxmemory-policy or scale Redis cluster.`,
  (metric: string, val: string, z: number) =>
    `Root cause: Spike to ${val} is ${z.toFixed(1)}σ above rolling 5-min baseline. No correlated errors in upstream services. Pattern matches known traffic burst from EU peak hours (09:00 BST). Likely benign — monitor for sustained elevation > 3 min.`,
  (metric: string, val: string, z: number) =>
    `Root cause: ${metric} anomaly (${z.toFixed(1)}σ). Cross-referencing error.rate: no elevation. Checking downstream: db.query_time elevated +34% in same window. Probable cause: slow query executing on postgres-primary. Recommend: run EXPLAIN ANALYZE on recent long-running queries.`,
];

function pad(n: number) { return String(n).padStart(2, '0'); }
function now() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function rnd(base: number, noise: number) {
  return +(base + (Math.random() - 0.5) * 2 * noise).toFixed(2);
}

export default function SentinelFeed() {
  const [events, setEvents] = useState<Event[]>([]);
  const [typedReport, setTypedReport] = useState('');
  const [activeAnomaly, setActiveAnomaly] = useState<Event | null>(null);
  const [running, setRunning] = useState(true);
  const counterRef = useRef(0);
  const anomalyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  function spawnAnomaly(metricDef: typeof METRICS[0]): Event {
    const zscore = +(3.2 + Math.random() * 1.8).toFixed(1);
    const val = `${rnd(metricDef.base * 1.6, metricDef.noise)}${metricDef.unit}`;
    const template = ANOMALY_REPORTS[Math.floor(Math.random() * ANOMALY_REPORTS.length)];
    return {
      id: counterRef.current++,
      ts: now(),
      metric: metricDef.name,
      value: val,
      source: metricDef.source,
      anomaly: true,
      zscore,
      report: template(metricDef.name, val, zscore),
    };
  }

  function spawnNormal(): Event {
    const m = METRICS[Math.floor(Math.random() * METRICS.length)];
    return {
      id: counterRef.current++,
      ts: now(),
      metric: m.name,
      value: `${rnd(m.base, m.noise)}${m.unit}`,
      source: m.source,
      anomaly: false,
    };
  }

  function typeReport(text: string) {
    if (typeRef.current) clearInterval(typeRef.current);
    setTypedReport('');
    let i = 0;
    typeRef.current = setInterval(() => {
      i++;
      setTypedReport(text.slice(0, i));
      if (i >= text.length && typeRef.current) clearInterval(typeRef.current);
    }, 14);
  }

  useEffect(() => {
    if (!running) return;
    let tickCount = 0;
    const interval = setInterval(() => {
      tickCount++;
      const isAnomaly = tickCount % 11 === 0;
      const metricDef = METRICS[Math.floor(Math.random() * METRICS.length)];
      const evt = isAnomaly ? spawnAnomaly(metricDef) : spawnNormal();

      setEvents(prev => [evt, ...prev].slice(0, 40));

      if (isAnomaly && evt.report) {
        if (anomalyTimerRef.current) clearTimeout(anomalyTimerRef.current);
        anomalyTimerRef.current = setTimeout(() => {
          setActiveAnomaly(evt);
          typeReport(evt.report!);
        }, 600);
      }
    }, 480);

    return () => clearInterval(interval);
  }, [running]);

  return (
    <div className="sf-root">
      <div className="sf-header">
        <div className="sf-live">
          <span className="sf-dot" />
          <span className="sf-live-label mono">SIM · replayed event stream</span>
        </div>
        <span className="sf-title mono">sentinel · anomaly detection feed</span>
        <button
          className="sf-toggle mono"
          onClick={() => setRunning(r => !r)}
          aria-label={running ? 'Pause feed' : 'Resume feed'}
        >
          {running ? '⏸ pause' : '▶ resume'}
        </button>
      </div>

      <div className="sf-body">
        {/* Event stream */}
        <div className="sf-stream" ref={feedRef} aria-live="polite" aria-label="Event stream">
          {events.length === 0 && (
            <div className="sf-empty mono">Initialising stream...</div>
          )}
          {events.map(e => (
            <div key={e.id} className={`sf-event ${e.anomaly ? 'sf-event-anomaly' : ''}`}>
              <span className="sf-ts mono">{e.ts}</span>
              <span className={`sf-badge mono ${e.anomaly ? 'sf-badge-alert' : 'sf-badge-ok'}`}>
                {e.anomaly ? '⚠ ANOMALY' : '✓ OK'}
              </span>
              <span className="sf-metric mono">{e.metric}</span>
              <span className={`sf-value mono ${e.anomaly ? 'sf-value-alert' : ''}`}>{e.value}</span>
              {e.zscore && <span className="sf-zscore mono">{e.zscore}σ</span>}
              <span className="sf-source mono">{e.source}</span>
            </div>
          ))}
        </div>

        {/* Report panel */}
        <div className="sf-report-panel">
          <div className="sf-report-header mono">
            {activeAnomaly
              ? `▶ root cause · ${activeAnomaly.metric}`
              : '▶ root cause report'}
          </div>
          <div className="sf-report-body mono">
            {activeAnomaly
              ? <>{typedReport}<span className="sf-cursor">▋</span></>
              : <span className="sf-waiting">Waiting for anomaly detection...</span>
            }
          </div>
          {activeAnomaly && (
            <div className="sf-report-meta mono">
              <span>z-score: {activeAnomaly.zscore}σ</span>
              <span>latency: {Math.floor(55 + Math.random() * 30)}s</span>
              <span>confidence: HIGH</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .sf-root {
          background: var(--ink-900);
          border: 1px solid var(--line);
          border-radius: 2px;
          overflow: hidden;
        }

        .sf-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          background: var(--ink-800);
          border-bottom: 1px solid var(--line);
        }

        .sf-live {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sf-dot {
          width: 7px;
          height: 7px;
          background: #E8A44A;
          border-radius: 50%;
          box-shadow: 0 0 6px #E8A44A;
          animation: blink 1.4s ease-in-out infinite;
          flex-shrink: 0;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }

        .sf-live-label {
          font-size: 0.68rem;
          color: #E8A44A;
          letter-spacing: 0.12em;
        }

        .sf-title {
          font-size: 0.72rem;
          color: var(--text-lo);
          flex: 1;
        }

        .sf-toggle {
          font-size: 0.68rem;
          color: var(--text-lo);
          background: none;
          border: 1px solid var(--line);
          border-radius: 2px;
          padding: 3px 8px;
          cursor: pointer;
          transition: color 200ms, border-color 200ms;
        }
        .sf-toggle:hover { color: var(--text-hi); border-color: var(--text-lo); }

        .sf-body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          height: 320px;
        }

        .sf-stream {
          overflow-y: auto;
          border-right: 1px solid var(--line);
          padding: 8px 0;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .sf-stream::-webkit-scrollbar { width: 3px; }
        .sf-stream::-webkit-scrollbar-track { background: transparent; }
        .sf-stream::-webkit-scrollbar-thumb { background: var(--line); }

        .sf-empty {
          font-size: 0.72rem;
          color: var(--text-lo);
          padding: 16px;
        }

        .sf-event {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 12px;
          border-bottom: 1px solid rgba(35, 42, 51, 0.5);
          font-size: 0.68rem;
          animation: slideIn 200ms ease-out;
          transition: background 200ms;
          flex-wrap: nowrap;
          overflow: hidden;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .sf-event-anomaly {
          background: rgba(251, 113, 133, 0.05);
          border-left: 2px solid #FB7185;
        }

        .sf-ts { color: var(--text-lo); flex-shrink: 0; width: 52px; }

        .sf-badge {
          flex-shrink: 0;
          padding: 1px 5px;
          border-radius: 1px;
          font-size: 0.6rem;
          letter-spacing: 0.04em;
        }
        .sf-badge-ok { background: rgba(232, 164, 74, 0.08); color: #E8A44A; }
        .sf-badge-alert { background: rgba(251, 113, 133, 0.15); color: #FB7185; }

        .sf-metric { color: var(--text-mid); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sf-value { color: var(--text-lo); flex-shrink: 0; }
        .sf-value-alert { color: #FB7185; }
        .sf-zscore { color: #FB7185; flex-shrink: 0; }
        .sf-source { color: var(--text-lo); opacity: 0.6; flex-shrink: 0; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        /* Report panel */
        .sf-report-panel {
          display: flex;
          flex-direction: column;
          padding: 16px;
          gap: 12px;
          overflow: hidden;
        }

        .sf-report-header {
          font-size: 0.68rem;
          color: var(--signal);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--line);
          flex-shrink: 0;
        }

        .sf-report-body {
          font-size: 0.75rem;
          color: var(--text-mid);
          line-height: 1.7;
          flex: 1;
          overflow-y: auto;
        }

        .sf-waiting { color: var(--text-lo); font-style: italic; }

        .sf-cursor {
          animation: blink 0.9s step-end infinite;
          color: var(--signal);
          margin-left: 1px;
        }

        .sf-report-meta {
          display: flex;
          gap: 16px;
          padding-top: 8px;
          border-top: 1px solid var(--line);
          flex-shrink: 0;
        }

        .sf-report-meta span {
          font-size: 0.65rem;
          color: var(--text-lo);
        }

        @media (max-width: 700px) {
          .sf-body { grid-template-columns: 1fr; height: auto; }
          .sf-stream { height: 200px; border-right: none; border-bottom: 1px solid var(--line); }
          .sf-report-panel { height: 200px; }
        }
      `}</style>
    </div>
  );
}
