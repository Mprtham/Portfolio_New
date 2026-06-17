import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'agent';
  content: string;
  steps?: string[];
}

const DEMO_FLOW: Message[] = [
  {
    role: 'user',
    content: 'Analyse this sales dataset and tell me what\'s driving churn.',
  },
  {
    role: 'agent',
    content: 'Running end-to-end analysis. Detecting data types, selecting appropriate tests, executing in sandbox...',
    steps: [
      '→ Loading dataset (12,847 rows × 23 cols)',
      '→ Profiling: 3 numeric, 8 categorical, 2 datetime, 10 boolean',
      '→ Missing values: tenure_months (2.1%), last_login (0.8%)',
      '→ Running: chi-square on categorical vs churn',
      '→ Running: Mann-Whitney U on numeric vs churn',
      '→ Running: Spearman correlation matrix',
      '→ Generating visualisations (4 charts)',
      '→ Synthesising findings...',
    ],
  },
  {
    role: 'agent',
    content: `Analysis complete. Key findings:\n\n**Top churn drivers (by effect size):**\n1. support_tickets_90d — Mann-Whitney U p<0.001, r=0.41 (large). Users with 3+ tickets churn at 67% vs 12% baseline.\n2. plan_type — χ²(3)=184.2, p<0.001, V=0.38. "Starter" plan: 58% churn; "Pro": 8% churn.\n3. days_since_login — r=0.34, p<0.001. Median 14 days for churners vs 2 days for retained.\n\n**Recommendation:** Build an early-warning trigger: support_tickets_90d ≥ 2 AND days_since_login ≥ 7. This catches 71% of churners with 23% false-positive rate. Next step: A/B test proactive outreach at trigger point.`,
  },
  {
    role: 'user',
    content: 'Can you quantify the revenue impact of that intervention?',
  },
  {
    role: 'agent',
    content: '',
    steps: [
      '→ Calculating cohort sizes from trigger criteria',
      '→ Fetching plan_type revenue distribution',
      '→ Estimating intervention conversion rate (conservative: 15%)',
      '→ Computing expected revenue retention...',
    ],
  },
  {
    role: 'agent',
    content: `**Revenue impact model:**\n\nAt-risk cohort matching trigger: ~847 users/month\nAvg MRR per user: £42.30\nProjected churn without intervention: 71% × 847 = 601 users\nMRR at risk: 601 × £42.30 = **£25,422/month**\n\nWith 15% intervention conversion:\nRetained users: ~90\nRecovered MRR: 90 × £42.30 = **£3,807/month**\nAnnualised: **£45,684**\n\nConservative ROI estimate, excludes lifetime value uplift. Recommend escalating to Pro plan upsell during intervention — could 2.4× the recovered value based on plan_type distribution.`,
  },
];

function TypingMessage({ text, onDone }: { text: string; onDone: () => void }) {
  const [displayed, setDisplayed] = useState('');
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let i = 0;
    ref.current = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        if (ref.current) clearInterval(ref.current);
        onDone();
      }
    }, 10);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [text]);

  return <span style={{ whiteSpace: 'pre-wrap' }}>{displayed}<span className="ad-cursor">▋</span></span>;
}

function StepRunner({ steps, onDone }: { steps: string[]; onDone: () => void }) {
  const [visible, setVisible] = useState<string[]>([]);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setVisible(prev => [...prev, steps[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(onDone, 300);
      }
    }, 320);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ad-steps">
      {visible.map((s, i) => (
        <div key={i} className="ad-step mono">{s}</div>
      ))}
    </div>
  );
}

export default function AgentDemo() {
  const [shownMessages, setShownMessages] = useState<Message[]>([]);
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [flowIdx, setFlowIdx] = useState(0);
  const [renderKey, setRenderKey] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  function scrollDown() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function advance() {
    setFlowIdx(prev => {
      const next = prev + 1;
      if (next < DEMO_FLOW.length) {
        const msg = DEMO_FLOW[next];
        setShownMessages(m => [...m, msg]);
        scrollDown();
      }
      return next;
    });
  }

  function start() {
    setShownMessages([DEMO_FLOW[0]]);
    setFlowIdx(0);
    setPhase('running');
    setRenderKey(k => k + 1);
    setTimeout(() => {
      setShownMessages([DEMO_FLOW[0], DEMO_FLOW[1]]);
      scrollDown();
    }, 600);
  }

  function reset() {
    setShownMessages([]);
    setFlowIdx(0);
    setPhase('idle');
    setRenderKey(k => k + 1);
  }

  return (
    <div className="ad-root">
      <div className="ad-header">
        <div className="ad-badge mono">
          <span className="ad-badge-dot" />
          agentic data analyst · scripted demo
        </div>
        {phase !== 'idle' && (
          <button className="ad-reset mono" onClick={reset}>↺ reset</button>
        )}
      </div>

      <div className="ad-messages" key={renderKey}>
        {phase === 'idle' && (
          <div className="ad-start">
            <p className="ad-start-text">Watch the agent run end-to-end analysis: data profiling, statistical tests, sandboxed execution, and revenue modelling.</p>
            <button className="ad-start-btn" onClick={start}>▶ Run demo analysis</button>
          </div>
        )}

        {shownMessages.map((msg, i) => {
          const isLast = i === shownMessages.length - 1;
          return (
            <div key={`${renderKey}-${i}`} className={`ad-msg ad-msg-${msg.role}`}>
              <div className="ad-msg-label mono">{msg.role === 'user' ? 'you' : 'agent'}</div>
              <div className="ad-msg-body">
                {msg.steps && isLast ? (
                  <StepRunner steps={msg.steps} onDone={() => {
                    if (msg.content) {
                      // replace with content message
                      setShownMessages(prev => {
                        const updated = [...prev];
                        updated[i] = { ...msg, steps: undefined };
                        return updated;
                      });
                    } else {
                      advance();
                    }
                  }} />
                ) : msg.steps ? (
                  <div className="ad-steps">
                    {msg.steps.map((s, si) => <div key={si} className="ad-step mono">{s}</div>)}
                  </div>
                ) : isLast && msg.role === 'agent' && msg.content ? (
                  <TypingMessage text={msg.content} onDone={() => {
                    if (i + 1 < DEMO_FLOW.length) {
                      setTimeout(() => {
                        advance();
                        scrollDown();
                      }, 800);
                    } else {
                      setPhase('done');
                    }
                  }} />
                ) : (
                  <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <style>{`
        .ad-root {
          background: var(--ink-900);
          border: 1px solid var(--line);
          border-radius: 2px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .ad-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: var(--ink-800);
          border-bottom: 1px solid var(--line);
        }

        .ad-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.68rem;
          color: var(--text-lo);
          letter-spacing: 0.06em;
        }

        .ad-badge-dot {
          width: 6px; height: 6px;
          background: #A78BFA;
          border-radius: 50%;
          box-shadow: 0 0 5px #A78BFA;
        }

        .ad-reset {
          font-size: 0.68rem;
          color: var(--text-lo);
          background: none;
          border: 1px solid var(--line);
          border-radius: 2px;
          padding: 3px 8px;
          cursor: pointer;
          transition: color 200ms;
        }
        .ad-reset:hover { color: var(--text-hi); }

        .ad-messages {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 280px;
          max-height: 400px;
          overflow-y: auto;
        }

        .ad-messages::-webkit-scrollbar { width: 3px; }
        .ad-messages::-webkit-scrollbar-thumb { background: var(--line); }

        .ad-start {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          flex: 1;
          padding: 32px;
          text-align: center;
        }

        .ad-start-text {
          font-size: 0.85rem;
          color: var(--text-lo);
          max-width: 400px;
          line-height: 1.6;
          margin: 0;
        }

        .ad-start-btn {
          padding: 10px 24px;
          background: var(--signal);
          color: var(--signal-ink);
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 0.88rem;
          border: none;
          border-radius: 2px;
          cursor: pointer;
          transition: opacity 200ms;
        }
        .ad-start-btn:hover { opacity: 0.85; }

        .ad-msg {
          display: flex;
          flex-direction: column;
          gap: 6px;
          animation: msgIn 250ms ease-out;
        }

        @keyframes msgIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ad-msg-user { align-items: flex-end; }
        .ad-msg-agent { align-items: flex-start; }

        .ad-msg-label {
          font-size: 0.62rem;
          color: var(--text-lo);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .ad-msg-body {
          max-width: 90%;
          padding: 10px 14px;
          border-radius: 2px;
          font-size: 0.82rem;
          line-height: 1.65;
        }

        .ad-msg-user .ad-msg-body {
          background: rgba(232, 164, 74, 0.08);
          border: 1px solid rgba(232, 164, 74, 0.2);
          color: var(--text-hi);
          border-radius: 12px 12px 2px 12px;
        }

        .ad-msg-agent .ad-msg-body {
          background: var(--ink-800);
          border: 1px solid var(--line);
          color: var(--text-mid);
          white-space: pre-wrap;
          border-radius: 2px 12px 12px 12px;
        }

        .ad-steps {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .ad-step {
          font-size: 0.72rem;
          color: var(--signal);
          animation: stepIn 200ms ease-out;
        }

        @keyframes stepIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .ad-cursor {
          animation: blink 0.9s step-end infinite;
          color: var(--signal);
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
