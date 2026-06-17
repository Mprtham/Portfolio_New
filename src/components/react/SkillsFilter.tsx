import { useState, useEffect, useRef } from 'react';

interface Skill {
  name: string;
  level: number;
  label: string;
  projects: string[];
}

interface Cluster {
  name: string;
  skills: Skill[];
}

const clusters: Cluster[] = [
  {
    name: 'BI & Visualisation',
    skills: [
      { name: 'Power BI (DAX, Copilot)', level: 95, label: 'Expert', projects: ['charac', 'peopleops'] },
      { name: 'Tableau', level: 72, label: 'Proficient', projects: [] },
      { name: 'Looker Studio', level: 70, label: 'Proficient', projects: [] },
      { name: 'Plotly / Recharts', level: 80, label: 'Advanced', projects: ['agentic-analyst'] },
      { name: 'Excel (Power Query)', level: 85, label: 'Advanced', projects: [] },
    ],
  },
  {
    name: 'Data & SQL',
    skills: [
      { name: 'BigQuery', level: 95, label: 'Expert', projects: ['charac', 'peopleops', 'sql-forge'] },
      { name: 'PostgreSQL', level: 90, label: 'Expert', projects: [] },
      { name: 'dbt', level: 82, label: 'Advanced', projects: ['peopleops', 'sql-forge'] },
      { name: 'ETL / ELT pipelines', level: 80, label: 'Advanced', projects: ['charac', 'peopleops'] },
      { name: 'Airflow', level: 65, label: 'Proficient', projects: [] },
    ],
  },
  {
    name: 'Analytics & Experimentation',
    skills: [
      { name: 'GA4 / Google Analytics', level: 88, label: 'Advanced', projects: ['charac'] },
      { name: 'A/B Testing (end-to-end)', level: 90, label: 'Expert', projects: [] },
      { name: 'Cohort & RFM analysis', level: 88, label: 'Advanced', projects: [] },
      { name: 'Forecasting models', level: 82, label: 'Advanced', projects: [] },
      { name: 'Statistical testing', level: 80, label: 'Advanced', projects: ['agentic-analyst'] },
    ],
  },
  {
    name: 'Python & ML',
    skills: [
      { name: 'pandas / NumPy', level: 88, label: 'Advanced', projects: ['agentic-analyst', 'stock'] },
      { name: 'scikit-learn', level: 82, label: 'Advanced', projects: ['peopleops'] },
      { name: 'Polars', level: 75, label: 'Proficient', projects: ['agentic-analyst'] },
      { name: 'LSTM / Prophet', level: 72, label: 'Proficient', projects: ['stock'] },
      { name: 'SHAP', level: 75, label: 'Proficient', projects: ['peopleops'] },
    ],
  },
  {
    name: 'AI Systems',
    skills: [
      { name: 'LangGraph / ReAct agents', level: 85, label: 'Advanced', projects: ['sentinel', 'coder-buddy'] },
      { name: 'RAG pipelines', level: 82, label: 'Advanced', projects: ['rag-observatory', 'securequery'] },
      { name: 'Qdrant / ChromaDB', level: 78, label: 'Proficient', projects: ['securequery', 'agentic-analyst', 'rag-observatory'] },
      { name: 'Fine-tuning (LoRA / DPO)', level: 72, label: 'Proficient', projects: ['sql-forge'] },
      { name: 'FastAPI / Docker', level: 82, label: 'Advanced', projects: ['sentinel', 'rag-observatory', 'securequery', 'agentic-analyst'] },
    ],
  },
];

const projectLabels: Record<string, string> = {
  'charac': 'Charac',
  'peopleops': 'PeopleOps',
  'sentinel': 'Sentinel',
  'agentic-analyst': 'Agentic Analyst',
  'sql-forge': 'SQL Forge',
  'rag-observatory': 'RAG Observatory',
  'securequery': 'SecureQuery AI',
  'coder-buddy': 'Coder Buddy',
  'stock': 'Stock Prediction',
};

const allProjects = Object.keys(projectLabels);

export default function SkillsFilter() {
  const [active, setActive] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) { setVisible(true); return; }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const isHighlighted = (skill: Skill) => {
    if (!active) return true;
    return skill.projects.includes(active);
  };

  return (
    <div className="sf-root" ref={rootRef}>
      {/* Filter chips */}
      <div className="sf-filters" role="group" aria-label="Filter skills by project">
        <button
          className={`sf-chip ${active === null ? 'sf-chip-active' : ''}`}
          onClick={() => setActive(null)}
        >
          All skills
        </button>
        {allProjects.map(p => (
          <button
            key={p}
            className={`sf-chip ${active === p ? 'sf-chip-active' : ''}`}
            onClick={() => setActive(active === p ? null : p)}
          >
            {projectLabels[p]}
          </button>
        ))}
      </div>

      {/* Skill clusters */}
      <div className="sf-grid">
        {clusters.map(cluster => {
          const hasActive = !active || cluster.skills.some(s => s.projects.includes(active));
          return (
            <div
              key={cluster.name}
              className={`sf-cluster ${!hasActive ? 'sf-cluster-dim' : ''}`}
            >
              <h3 className="sf-cluster-name">{cluster.name}</h3>
              <div className="sf-skill-list">
                {cluster.skills.map(skill => {
                  const highlighted = isHighlighted(skill);
                  return (
                    <div
                      key={skill.name}
                      className={`sf-skill-row ${!highlighted ? 'sf-skill-dim' : ''}`}
                    >
                      <div className="sf-skill-meta">
                        <span className="sf-skill-name">{skill.name}</span>
                        <span className="sf-skill-label">{skill.label}</span>
                      </div>
                      <div className="sf-bar-track" role="progressbar" aria-valuenow={skill.level} aria-valuemin={0} aria-valuemax={100} aria-label={`${skill.name}: ${skill.label}`}>
                        <div
                          className="sf-bar-fill"
                          style={{ width: (highlighted && visible) ? `${skill.level}%` : '0%' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .sf-root { width: 100%; }

        .sf-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 28px;
        }

        .sf-chip {
          padding: 5px 12px;
          background: transparent;
          border: 1px solid var(--line);
          border-radius: 2px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.72rem;
          color: var(--text-lo);
          cursor: pointer;
          transition: all 200ms;
          white-space: nowrap;
        }

        .sf-chip:hover {
          border-color: var(--text-lo);
          color: var(--text-mid);
        }

        .sf-chip-active {
          background: rgba(232, 164, 74, 0.1);
          border-color: var(--signal);
          color: var(--signal);
        }

        .sf-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .sf-cluster {
          background: var(--ink-800);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 28px;
          transition: opacity 300ms;
        }

        .sf-cluster-dim {
          opacity: 0.3;
        }

        .sf-cluster-name {
          font-size: 1rem;
          color: var(--signal);
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--line);
        }

        .sf-skill-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .sf-skill-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: opacity 300ms;
        }

        .sf-skill-dim {
          opacity: 0.2;
        }

        .sf-skill-meta {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .sf-skill-name {
          font-size: 0.83rem;
          color: var(--text-mid);
          font-family: 'Inter', sans-serif;
        }

        .sf-skill-label {
          font-size: 0.68rem;
          color: var(--text-lo);
          font-family: 'JetBrains Mono', monospace;
        }

        .sf-bar-track {
          height: 2px;
          background: var(--line);
          border-radius: 1px;
          overflow: hidden;
        }

        .sf-bar-fill {
          height: 100%;
          background: var(--signal);
          border-radius: 1px;
          transition: width 600ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        @media (max-width: 900px) {
          .sf-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 600px) {
          .sf-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
