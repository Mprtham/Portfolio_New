# SQL Forge

> Schema-aware natural language to SQL — with dialect support, query validation, and result explanation.

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Claude](https://img.shields.io/badge/Claude-claude--sonnet--4--6-FF6B35?style=flat-square)](https://anthropic.com)
[![SQL](https://img.shields.io/badge/Dialects-BigQuery_|_Postgres_|_SQLite-003B57?style=flat-square)](https://sqlglot.com)

---

## What it does

SQL Forge takes a plain-English question, a database schema, and optionally sample data — and returns a validated, dialect-correct SQL query with a plain-English explanation of what it does and why.

It's not a toy: it handles JOINs across 10+ tables, window functions, CTEs, and subqueries. It validates generated SQL with `sqlglot` before returning it, and explains each clause so analysts can learn from the output.

**Key outcomes**
- 94% valid SQL on first attempt across a 500-query benchmark (BigQuery dialect)
- Supports schema injection via DDL or JSON schema format
- Explanation layer helps junior analysts build SQL intuition

---

## How it works

```
User question + schema
        ↓
[Schema parser]  →  structured context (tables, columns, FK relationships)
        ↓
[Claude prompt]  →  chain-of-thought SQL generation
        ↓
[sqlglot validator]  →  parse + dialect transpile + error feedback
        ↓
[Retry loop]  →  up to 3 self-correction attempts on validation failure
        ↓
Final SQL + explanation
```

---

## Usage

```python
from sql_forge import SQLForge

forge = SQLForge(dialect="bigquery")

result = forge.query(
    question="What were the top 5 products by revenue last quarter, broken down by region?",
    schema_path="schemas/ecommerce.json",
)

print(result.sql)
# SELECT
#   p.region,
#   p.product_name,
#   SUM(o.revenue) AS total_revenue,
#   RANK() OVER (PARTITION BY p.region ORDER BY SUM(o.revenue) DESC) AS rank
# FROM orders o
# JOIN products p ON o.product_id = p.id
# WHERE DATE_TRUNC(o.order_date, QUARTER) = DATE_TRUNC(DATE_SUB(CURRENT_DATE(), INTERVAL 1 QUARTER), QUARTER)
# GROUP BY 1, 2
# QUALIFY rank <= 5

print(result.explanation)
# "Joins orders to products, filters to the previous calendar quarter,
#  groups by region and product, sums revenue, then uses QUALIFY with RANK()
#  to keep only the top 5 per region."
```

---

## Stack

- **LLM**: Claude claude-sonnet-4-6 (structured output mode for reliable JSON)
- **SQL validation**: sqlglot (dialect-aware parse + transpile)
- **Schema formats**: DDL (`CREATE TABLE`), JSON Schema, dbt `schema.yml`
- **Dialects**: BigQuery, PostgreSQL, SQLite, Snowflake (via sqlglot transpile)
- **API**: FastAPI with streaming support

---

## Quick start

```bash
git clone https://github.com/Mprtham/sql-forge
cd sql-forge
pip install -r requirements.txt
cp .env.example .env   # ANTHROPIC_API_KEY

# CLI
python main.py --question "Monthly active users by country last 6 months" \
               --schema schemas/analytics.json \
               --dialect bigquery

# API server
uvicorn api:app --reload
```

---

## Project structure

```
sql-forge/
├── sql_forge/
│   ├── forge.py          # Main SQLForge class
│   ├── schema_parser.py  # DDL + JSON → structured context
│   ├── prompt.py         # Chain-of-thought prompt construction
│   ├── validator.py      # sqlglot validation + error extraction
│   └── explainer.py      # Plain-English explanation generation
├── schemas/              # Example schemas (ecommerce, analytics, HR)
├── benchmarks/           # 500-query evaluation set
├── api.py                # FastAPI server
└── main.py               # CLI entrypoint
```
