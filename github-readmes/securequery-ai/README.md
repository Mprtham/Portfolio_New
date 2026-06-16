# SecureQuery AI

> RBAC-aware RAG pipeline with row-level access control, PII masking, and full citation tracking.

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-DC143C?style=flat-square)](https://qdrant.tech)
[![Presidio](https://img.shields.io/badge/Presidio-PII_Masking-0078D4?style=flat-square)](https://microsoft.github.io/presidio)

[Case study →](https://portfolio-iota-taupe-34.vercel.app/work/securequery-ai)

---

## What it does

SecureQuery AI is a production RAG system designed for regulated environments. It enforces **role-based access control at the vector retrieval layer** — so a user with "analyst" permissions can never see documents tagged for "executive" or "legal" roles, even if those documents would otherwise be the best semantic match.

**Key outcomes**
- Zero unauthorised document retrievals across 10,000+ test queries
- PII (names, emails, NHS numbers) masked before chunks reach the LLM
- Every generated claim is cited back to a source chunk with page reference

---

## Architecture

```
Query
  ↓
[Embed]  →  query vector
  ↓
[Retrieve]  →  Qdrant payload filter: {roles: {$in: user.roles}}
  ↓
[Rerank]  →  cross-encoder reranking of top-k filtered results
  ↓
[PII Mask]  →  Presidio scan + redact on retrieved chunks
  ↓
[Generate]  →  Claude with citation-grounded prompt
  ↓
[Cite + Track]  →  inline citations, source deduplication, audit log
  ↓
Response
```

**8-node pipeline** — interactive diagram at [portfolio-iota-taupe-34.vercel.app/#lab](https://portfolio-iota-taupe-34.vercel.app/#lab)

---

## RBAC implementation

Access control lives entirely in Qdrant payload filters — no post-retrieval filtering, so restricted documents are never sent to the LLM:

```python
# At index time — each chunk stores its access roles
chunk_payload = {
    "text": chunk_text,
    "source": doc_id,
    "page": page_number,
    "roles": ["analyst", "manager"],   # who can see this
}

# At query time — filter before similarity search
results = qdrant.search(
    collection_name="documents",
    query_vector=embed(query),
    query_filter=Filter(
        must=[FieldCondition(
            key="roles",
            match=MatchAny(any=user.roles)
        )]
    ),
    limit=20,
)
```

---

## Stack

- **Vector DB**: Qdrant (self-hosted, payload-filter RBAC)
- **Embeddings**: `text-embedding-3-large` (OpenAI) / `embed-english-v3` (Cohere)
- **Reranker**: Cohere `rerank-english-v3.0`
- **PII detection**: Microsoft Presidio (custom NHS number recogniser)
- **LLM**: Claude claude-sonnet-4-6 with citation-grounded system prompt
- **Auth**: JWT with role claims, FastAPI dependency injection
- **Infrastructure**: Docker, Qdrant Cloud or self-hosted

---

## Quick start

```bash
git clone https://github.com/Mprtham/securequery-ai
cd securequery-ai
cp .env.example .env   # ANTHROPIC_API_KEY, QDRANT_URL, QDRANT_API_KEY
docker compose up      # starts Qdrant + API

# Index sample documents
python scripts/index_documents.py --dir examples/docs --roles analyst,manager

# Query
curl -X POST http://localhost:8000/query \
  -H "Authorization: Bearer <jwt_with_roles>" \
  -d '{"query": "What were Q3 revenue figures?"}'
```
