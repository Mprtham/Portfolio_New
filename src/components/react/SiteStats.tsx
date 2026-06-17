import { useState, useEffect } from 'react';

interface Stat {
  value: string;
  label: string;
}

export default function SiteStats() {
  const [stats, setStats] = useState<Stat[]>([
    { value: '7', label: 'pages' },
    { value: '5', label: 'case studies' },
    { value: '<1KB', label: 'JS on load' },
  ]);

  useEffect(() => {
    // Read real load time from Performance API
    const tryRead = () => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (nav) {
        const loadEnd = nav.loadEventEnd > 0 ? nav.loadEventEnd : performance.now();
        const lcp = loadEnd - nav.startTime;
        const loadStr = `${(lcp / 1000).toFixed(2)}s`;

        // Estimate transferred JS size
        const jsEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const jsBytes = jsEntries
          .filter(e => e.initiatorType === 'script')
          .reduce((acc, e) => acc + (e.transferSize || 0), 0);
        const jsStr = jsBytes > 0 ? `${Math.round(jsBytes / 1024)}KB` : '<1KB';

        setStats([
          { value: loadStr, label: 'page load' },
          { value: '7', label: 'pages' },
          { value: '5', label: 'case studies' },
          { value: jsStr, label: 'JS transferred' },
        ]);
      }
    };

    if (document.readyState === 'complete') {
      tryRead();
    } else {
      window.addEventListener('load', tryRead, { once: true });
    }
  }, []);

  return (
    <div className="ss-root" aria-label="Site statistics">
      <span className="ss-label mono">this site, by the numbers</span>
      <div className="ss-stats">
        {stats.map((s, i) => (
          <div key={i} className="ss-stat">
            <span className="ss-value mono">{s.value}</span>
            <span className="ss-name">{s.label}</span>
          </div>
        ))}
        <div className="ss-stat">
          <span className="ss-value mono">✓</span>
          <span className="ss-name">GDPR-clean</span>
        </div>
      </div>
      <style>{`
        .ss-root {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .ss-label {
          font-size: 0.65rem;
          color: var(--text-lo);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          white-space: nowrap;
          opacity: 0.7;
        }

        .ss-stats {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .ss-stat {
          display: flex;
          align-items: baseline;
          gap: 5px;
        }

        .ss-value {
          font-size: 0.72rem;
          color: var(--signal);
          font-weight: 500;
        }

        .ss-name {
          font-size: 0.65rem;
          color: var(--text-lo);
        }
      `}</style>
    </div>
  );
}
