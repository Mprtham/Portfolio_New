# Phase 4 — GitHub Visibility Setup

All README content is in the subfolders here. Below are the exact steps to push everything live.

---

## 1. GitHub Profile README

The profile README lives in a special repo named `Mprtham/Mprtham`.

**Steps:**
1. Go to https://github.com/new
2. Repository name: `Mprtham` (exactly, matches your username)
3. Check **Public** + **Add a README file**
4. Create repository
5. Replace the README content with the file at `github-readmes/profile/README.md`

Or via terminal (if you clone it first):
```bash
git clone https://github.com/Mprtham/Mprtham
cp github-readmes/profile/README.md Mprtham/README.md
cd Mprtham && git add README.md && git commit -m "Add profile README" && git push
```

---

## 2. Flagship Repo READMEs

Push each README to its corresponding repo. The repo names in the READMEs use these slugs — adjust if your actual repo names differ:

| Folder | Target repo | Push command |
|---|---|---|
| `sentinel/` | `Mprtham/sentinel` | see below |
| `agentic-data-analyst/` | `Mprtham/agentic-data-analyst` | see below |
| `securequery-ai/` | `Mprtham/securequery-ai` | see below |
| `peopleops-attrition/` | `Mprtham/peopleops-attrition` | see below |
| `rag-observatory/` | `Mprtham/rag-observatory` | see below |
| `sql-forge/` | `Mprtham/sql-forge` | see below |

For each repo, copy the README to the repo root and push:
```bash
# Example for Sentinel:
cp github-readmes/sentinel/README.md path/to/sentinel/README.md
cd path/to/sentinel
git add README.md && git commit -m "Update README" && git push
```

If the repos don't exist yet, create them on GitHub first (can be empty), then push.

---

## 3. Pin 6 Repos on GitHub Profile

GitHub only allows pinning via the web UI:

1. Go to https://github.com/Mprtham
2. Click **Customize your pins**
3. Select these 6 repos:
   - `sentinel`
   - `agentic-data-analyst`
   - `securequery-ai`
   - `peopleops-attrition`
   - `rag-observatory`
   - `sql-forge`
4. Save

---

## 4. Add Topics/Tags to Each Repo

In each repo → **Settings** (gear icon on repo page) → **Topics**:

| Repo | Topics to add |
|---|---|
| sentinel | `langgraph` `anomaly-detection` `kafka` `python` `ai` `llm` |
| agentic-data-analyst | `react-agent` `langchain` `data-analysis` `python` `llm` `docker` |
| securequery-ai | `rag` `qdrant` `presidio` `rbac` `python` `llm` `security` |
| peopleops-attrition | `xgboost` `shap` `dbt` `bigquery` `hr-analytics` `python` |
| rag-observatory | `rag` `qdrant` `react` `python` `langchain` `visualization` |
| sql-forge | `text-to-sql` `natural-language` `sqlglot` `python` `llm` |

---

## 5. Archive Tutorial Repos

In each tutorial repo → **Settings** → scroll to **Danger Zone** → **Archive this repository**.

Repos to archive (adjust based on your actual repo list):
- `task-1`, `task-2`, `task-3` (any numbered tutorial repos)
- `LGM-*` repos (LGM fellowship tutorial repos)

---

## 6. Set GitHub Website Field

On your GitHub profile page:
1. Click **Edit profile**
2. Set **Website** to: `https://portfolio-iota-taupe-34.vercel.app`
3. Save

---

## 7. LinkedIn Canonical URL

**Pick one URL and stick with it.** Looking at your two options:
- `/in/prathameshmishra07` — cleaner, more memorable
- `/in/prathamesh-mishra-9a8b36212` — auto-generated, less professional

**Recommended**: Keep `/in/prathameshmishra07`

To confirm/set it:
1. Go to LinkedIn → **Me** → **View Profile**
2. Click **Edit public profile & URL** (top right)
3. Under **Edit your custom URL**, set it to `prathameshmishra07`
4. Update the `sameAs` URL in your portfolio's `Layout.astro:52` if needed

---

## 8. Optional: 3 Medium Write-ups

Draft outlines for cross-linking with your case studies:

**Article 1: "How I built an anomaly detection system that generates its own root-cause reports"**
- Hook: most alerting systems tell you something is wrong, not why
- Architecture walkthrough (the 4-node LangGraph graph)
- Code snippet: the ReAct root-cause loop
- Link to: `/work/sentinel` + GitHub repo

**Article 2: "RBAC at the vector layer: why post-retrieval filtering is too late"**
- Hook: the naive approach (filter after retrieval) sends restricted docs to the LLM
- How Qdrant payload filters work
- Code snippet: the filter at query time
- Link to: `/work/securequery-ai` + GitHub repo

**Article 3: "Building an agent that does data analysis end-to-end"**
- Hook: most "AI analyst" demos are fake — here's what a real one looks like
- The tool registry design
- Safe code execution via Docker sandbox
- Link to: `/work/agentic-data-analyst` + GitHub repo
