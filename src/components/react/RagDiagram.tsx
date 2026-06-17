import { useState } from 'react';

interface Node {
  id: string;
  label: string;
  sublabel: string;
  detail: string;
  color: string;
  x: number;
  y: number;
}

const NODES: Node[] = [
  {
    id: 'query',
    label: 'Query',
    sublabel: 'User input',
    detail: 'Natural language question arrives. Input guardrails scan for prompt injection, off-topic requests, and policy violations before processing continues.',
    color: '#38BDF8',
    x: 40, y: 50,
  },
  {
    id: 'embed',
    label: 'Embed',
    sublabel: 'text-embedding-3-small',
    detail: 'Query is converted to a dense vector (1536-dim). Same model used at ingestion time — critical for retrieval quality. Embedding is cached for identical queries.',
    color: '#A78BFA',
    x: 220, y: 50,
  },
  {
    id: 'retrieve',
    label: 'Retrieve',
    sublabel: 'Qdrant ANN search',
    detail: 'Approximate nearest-neighbour search against the vector store. Returns top-k=20 candidates. Payload filter enforces RBAC — Finance role cannot retrieve HR or Executive documents.',
    color: '#FBBF24',
    x: 400, y: 50,
  },
  {
    id: 'rerank',
    label: 'Rerank',
    sublabel: 'Cross-encoder',
    detail: 'Cross-encoder (ms-marco-MiniLM) re-scores all 20 candidates with full query+document attention. Top-4 pass through. Dramatically improves precision vs. bi-encoder retrieval alone.',
    color: '#FB7185',
    x: 580, y: 50,
  },
  {
    id: 'pii',
    label: 'PII Mask',
    sublabel: 'Presidio',
    detail: 'Microsoft Presidio scans retrieved chunks for PII entities (PERSON, EMAIL, PHONE, NI number, bank account). Matched spans are replaced with typed placeholders before the LLM sees them.',
    color: '#FB7185',
    x: 580, y: 200,
  },
  {
    id: 'generate',
    label: 'Generate',
    sublabel: 'Azure OpenAI GPT-4o',
    detail: 'LLM receives [system prompt + reranked chunks + masked content + query]. Instructed to answer only from provided context and cite sources. Output guardrails check for hallucination signals.',
    color: '#E8A44A',
    x: 400, y: 200,
  },
  {
    id: 'cite',
    label: 'Cite + Track',
    sublabel: 'Langfuse + SQLite',
    detail: 'Every response includes citation markers. Langfuse traces the full pipeline: latency per step, token counts, cost per query. SQLite logs cost by role and query type for the admin dashboard.',
    color: '#E8A44A',
    x: 220, y: 200,
  },
  {
    id: 'response',
    label: 'Response',
    sublabel: 'Cited answer',
    detail: 'Final answer delivered to user with inline citations, confidence signal, and cost metadata. Only information from authorised, retrieved documents appears in the response.',
    color: '#38BDF8',
    x: 40, y: 200,
  },
];

// Edges: [from, to]
const EDGES: [string, string][] = [
  ['query', 'embed'],
  ['embed', 'retrieve'],
  ['retrieve', 'rerank'],
  ['rerank', 'pii'],
  ['pii', 'generate'],
  ['generate', 'cite'],
  ['cite', 'response'],
];

const W = 700;
const H = 300;
const NW = 120;
const NH = 52;

function cx(n: Node) { return n.x + NW / 2; }
function cy(n: Node) { return n.y + NH / 2; }

export default function RagDiagram() {
  const [active, setActive] = useState<string | null>(null);
  const activeNode = NODES.find(n => n.id === active) ?? null;

  return (
    <div className="rd-root">
      <div className="rd-diagram-wrap">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="rd-svg"
          aria-label="RAG pipeline architecture diagram"
          role="img"
        >
          {/* Edges */}
          {EDGES.map(([from, to]) => {
            const a = NODES.find(n => n.id === from)!;
            const b = NODES.find(n => n.id === to)!;
            const x1 = cx(a), y1 = cy(a), x2 = cx(b), y2 = cy(b);
            const isActive = active === from || active === to;
            return (
              <line
                key={`${from}-${to}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isActive ? '#E8A44A' : '#2A2018'}
                strokeWidth={isActive ? 1.5 : 1}
                markerEnd="url(#arrow)"
                style={{ transition: 'stroke 200ms, stroke-width 200ms' }}
              />
            );
          })}

          {/* Arrow marker */}
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#2A2018" />
            </marker>
          </defs>

          {/* Nodes */}
          {NODES.map(node => {
            const isActive = active === node.id;
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => setActive(active === node.id ? null : node.id)}
                role="button"
                tabIndex={0}
                aria-label={node.label}
                onKeyDown={e => e.key === 'Enter' && setActive(active === node.id ? null : node.id)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  width={NW}
                  height={NH}
                  rx="2"
                  fill={isActive ? 'rgba(92,242,192,0.08)' : '#0F1318'}
                  stroke={isActive ? node.color : '#2A2018'}
                  strokeWidth={isActive ? 1.5 : 1}
                  style={{ transition: 'all 200ms' }}
                />
                <text
                  x={NW / 2} y={20}
                  textAnchor="middle"
                  fill={isActive ? node.color : '#F4F6F8'}
                  fontSize="12"
                  fontFamily="Space Grotesk, sans-serif"
                  fontWeight="600"
                  style={{ transition: 'fill 200ms' }}
                >
                  {node.label}
                </text>
                <text
                  x={NW / 2} y={36}
                  textAnchor="middle"
                  fill="#7C8794"
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {node.sublabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detail panel */}
      <div className={`rd-detail ${activeNode ? 'rd-detail-active' : ''}`}>
        {activeNode ? (
          <>
            <div className="rd-detail-header">
              <span className="rd-detail-tag mono" style={{ color: activeNode.color }}>
                {activeNode.label}
              </span>
              <span className="rd-detail-sub mono">{activeNode.sublabel}</span>
            </div>
            <p className="rd-detail-body">{activeNode.detail}</p>
          </>
        ) : (
          <p className="rd-detail-hint mono">← Click any node to explore the pipeline</p>
        )}
      </div>

      <style>{`
        .rd-root {
          background: var(--ink-900);
          border: 1px solid var(--line);
          border-radius: 2px;
          overflow: hidden;
        }

        .rd-diagram-wrap {
          padding: 24px 16px 16px;
          border-bottom: 1px solid var(--line);
          overflow-x: auto;
        }

        .rd-svg {
          width: 100%;
          max-width: ${W}px;
          height: auto;
          display: block;
          margin: 0 auto;
        }

        .rd-detail {
          padding: 16px 20px;
          min-height: 72px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: background 200ms;
        }

        .rd-detail-active {
          background: var(--ink-800);
        }

        .rd-detail-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .rd-detail-tag {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .rd-detail-sub {
          font-size: 0.68rem;
          color: var(--text-lo);
        }

        .rd-detail-body {
          font-size: 0.82rem;
          color: var(--text-mid);
          line-height: 1.65;
          margin: 0;
        }

        .rd-detail-hint {
          font-size: 0.75rem;
          color: var(--text-lo);
          margin: auto 0;
        }
      `}</style>
    </div>
  );
}
