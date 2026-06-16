# RAG Observatory

> Interactive visualisation and diagnostic tooling for production RAG pipelines.

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-Interactive_UI-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-DC143C?style=flat-square)](https://qdrant.tech)

[Live demo →](https://portfolio-iota-taupe-34.vercel.app/#lab)

---

## What it does

RAG Observatory gives you an interactive view of every stage in a production RAG pipeline — from raw query to cited response. Click any node in the architecture diagram to inspect what that stage does, what goes in, what comes out, and what can go wrong.

Designed for two audiences:
- **Engineers** building or debugging RAG systems
- **Stakeholders** who need to understand why the system answered the way it did

---

## Pipeline stages

```
Query → Embed → Retrieve → Rerank → PII Mask → Generate → Cite+Track → Response
```

| Stage | What it does | Key decisions |
|---|---|---|
| **Embed** | Convert query to vector | Model choice, normalisation |
| **Retrieve** | ANN search in Qdrant | k, ef_search, payload filters |
| **Rerank** | Cross-encoder re-score top-k | Reranker model, cutoff threshold |
| **PII Mask** | Presidio scan + redact | Entity types, custom recognisers |
| **Generate** | Claude with grounded prompt | Temperature, system prompt, context window |
| **Cite+Track** | Inline citations, audit log | Citation format, source dedup |

---

## Observatory features

- **Node inspector**: Click any pipeline stage to see live config, last-run latency, and example I/O
- **Trace viewer**: Full request trace from query to response with per-stage timing
- **Embedding explorer**: 2D UMAP projection of your document chunks
- **Retrieval debugger**: See exactly which chunks were retrieved and why they scored as they did
- **PII audit log**: What was masked, by which recogniser, in which chunk

---

## Stack

- **Backend**: FastAPI, LangChain, Qdrant
- **Embeddings**: configurable (OpenAI / Cohere / local via SentenceTransformers)
- **Reranker**: Cohere `rerank-english-v3.0`
- **PII**: Microsoft Presidio
- **LLM**: Claude (via Anthropic API)
- **Frontend**: React + SVG pipeline diagram (the interactive demo on the portfolio)
- **Tracing**: LangSmith or self-hosted Jaeger

---

## Quick start

```bash
git clone https://github.com/Mprtham/rag-observatory
cd rag-observatory
cp .env.example .env   # ANTHROPIC_API_KEY, QDRANT_URL, COHERE_API_KEY
docker compose up      # Qdrant + API + React frontend

# Index your documents
python scripts/ingest.py --dir ./docs --collection my_knowledge_base

# Open observatory
open http://localhost:3000
```
