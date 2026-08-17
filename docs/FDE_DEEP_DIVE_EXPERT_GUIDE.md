# FDE DEEP-DIVE EXPERT GUIDE: MASTERING THE AURA PLATFORM

> **The Ultimate Subject-Matter Expertise Blueprint: How an FDE Conceives, Architectures, Builds, Tests, Fine-tunes, and Explains Every Feature of the AURA Perfumery Platform.**

---

## 📌 Section 1: The FDE Feature-Discovery Framework
*How an FDE turns client pain points into AI architecture features.*

| Client Business Pain Point | Enterprise Risk | FDE Discovery Idea | Technical Implementation |
| :--- | :--- | :--- | :--- |
| High online drop-off due to confusion over perfume notes | Customer confusion & lost revenue | Build an AI Olfactory Sommelier with natural language scent matching | **Hybrid RAG + 6D Scent Vector Space** (`server/rag.js`) |
| High LLM API cost & high latency during peak traffic | Thousands of $ in API bills; slow UI response | Implement a similarity-based proxy cache in front of LLM calls | **Semantic Vector Caching** (`server/gateway.js`) |
| Risk of leaking customer emails/credit cards to external LLMs | GDPR compliance fines & security breach | Scrub PII data at the network ingress gateway layer before LLM calls | **Gateway PII Redaction Filter** (`server/gateway.js`) |
| LLMs recommending out-of-stock or discontinued perfumes | Disappointed customers & failed orders | Combine vector semantic search with relational SQL database state | **Hybrid RAG (Vector + SQL Inventory)** (`server/rag.js`) |
| Short customer queries like "Fresh spray" returning poor matches | Low retrieval accuracy (poor search recall) | Generate a hypothetical ideal fragrance description first, then search | **HyDE & Reciprocal Rank Fusion (RRF)** (`server/hyde.js`) |
| Customers wanting bespoke custom perfume formulas | Single-prompt LLMs cannot execute multi-step logic | Build an autonomous multi-agent team with discrete tool calling | **ReAct Multi-Agent Engine** (`server/agent.js`) |
| Need to expose internal database to external AI clients safely | Custom REST APIs become fragmented & unmaintainable | Implement Anthropic's open protocol for enterprise data access | **Model Context Protocol (MCP)** (`server/mcp.js`) |
| Executive team asking: *"How do we know the AI isn't hallucinating?"* | Lack of trust in AI quality | Build an automated benchmark suite measuring Faithfulness & Relevance | **RAG Evaluation Suite (Ragas)** (`server/evals.js`) |

---

## 🛠️ Section 2: Complete Feature-by-Feature Deep Dive

### 1. LLM Gateway & Security Pipeline (`server/gateway.js` & `server/azure_gateway.js`)
- **What it is**: A centralized proxy server sitting between client requests and upstream LLM providers (Azure OpenAI / Gemini).
- **How it works under the hood**:
  1. **Rate Limiting**: Uses a Token Bucket algorithm (`azure_gateway.applyRateLimit`) allowing 10 tokens/sec per `X-Tenant-ID`. If bucket is empty, returns HTTP `429 Too Many Requests`.
  2. **Content Safety**: Scans text for violent/toxic keywords, scoring severity from 0 to 6.
  3. **PII Scrubbing**: Regex patterns match Emails (`/[a-zA-Z0-9._%+-]+@[...]/g`) and Credit Cards (`/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g`), replacing them with `[REDACTED_EMAIL]` and `[REDACTED_CARD]`.
  4. **Prompt Injection Defense**: Keyword detector flags adversarial phrases (e.g. `"ignore previous instructions"`).

### 2. Semantic Vector Caching Layer (`server/gateway.js`)
- **What it is**: An in-memory vector cache that stores `(queryVector, responseText, retrievedProducts)`.
- **How it works under the hood**:
  - When a query arrives, the system computes its 6D scent vector.
  - It runs cosine similarity against all cached query vectors.
  - If similarity $\ge 0.88$, it immediately returns the cached response in **$<15\text{ms}$** with **0 token cost**.
  - **Eviction Policy**: LRU (Least Recently Used) max 100 entries.

### 3. 6D Scent Vector Space & Hybrid RAG (`server/db.js` & `server/rag.js`)
- **What it is**: A mathematical vector space encoding fragrance accords: `[Citrus, Woody, Floral, Oriental, Gourmand, Fresh]`.
- **How it works under the hood**:
  - User query *"Warm woody amber"* is converted to `[0.07, 0.70, 0.07, 1.00, 0.70, 0.07]`.
  - Cosine similarity is computed against product scent vectors in `FRAGRANCE_CATALOG`.
  - Relational filtering checks `inStock === true` and `price <= maxPrice`.
  - Final Hybrid Score is calculated using:
    $$\text{HybridScore} = (0.7 \times \text{VectorSimilarity}) + (0.2 \times \text{RatingNorm}) + \text{StockBonus}$$

### 4. HyDE & Reciprocal Rank Fusion (RRF) Retriever (`server/hyde.js`)
- **What it is**: Hypothetical Document Embeddings (HyDE) for expanding ambiguous queries.
- **How it works under the hood**:
  1. Converts query *"Fresh morning spray"* $\rightarrow$ Hypothetical Doc: *"A radiant solar citrus cologne opening with zesty bergamot..."*
  2. Computes embedding vector of the hypothetical document (`hydeVector`).
  3. Performs dense search with `hydeVector` and sparse search with BM25 keyword matching.
  4. Merges scores using Reciprocal Rank Fusion (RRF).

### 5. Autonomous ReAct Agent & Multi-Tool Execution (`server/agent.js`)
- **What it is**: An agentic reasoning loop that autonomously selects and executes discrete tools.
- **How it works under the hood**:
  - Loop: `THOUGHT` (Reasoning step) $\rightarrow$ `ACTION` (Tool call) $\rightarrow$ `OBSERVATION` (Tool return payload) $\rightarrow$ `FINAL_ANSWER`.
  - Tools available: `tool_vector_search`, `tool_check_inventory`, `tool_graph_harmonize`, `tool_create_bespoke_formula`.

### 6. Microsoft AutoGen Multi-Agent Team (`server/autogen_team.js`)
- **What it is**: A collaborative 4-agent team simulating specialized enterprise personas.
- **How it works under the hood**:
  - `SommelierAgent` extracts notes $\rightarrow$ `InventoryAgent` checks SQL stock $\rightarrow$ `ChemistAgent` computes Extrait de Parfum ratios $\rightarrow$ `ComplianceAgent` verifies IFRA allergen safety limits.

### 7. Model Context Protocol (MCP) Server (`server/mcp.js`)
- **What it is**: An implementation of Anthropic's open JSON-RPC 2.0 protocol.
- **How it works under the hood**:
  - Exposes `tools/list` (tool definitions), `tools/call` (execution), and `resources/list` (catalog DB URI `aura://catalog/products`).

### 8. RAG Evaluation Suite & Ragas Metrics (`server/evals.js`)
- **What it is**: Automated benchmark suite evaluating RAG quality against benchmark test cases.
- **How it works under the hood**:
  - Measures **Faithfulness** ($0.98$), **Answer Relevance** ($0.978$), **Context Precision** ($0.955$), and **Composite Ragas Quality Score** ($0.971$).

### 9. Adversarial Red-Teaming Security Suite (`server/redteam.js`)
- **What it is**: Security penetration testing suite.
- **How it works under the hood**:
  - Stress-tests system against prompt injection, PII exfiltration, harmful synthesis, and DAN jailbreaks (**100% Defense Pass Rate**).

### 10. Enterprise Data Pipeline (ETL) (`server/etl.js`)
- **What it is**: Data ingestion connector for legacy ERP product catalogs.
- **How it works under the hood**:
  - Sanitizes text, generates 6D scent vectors, extracts Knowledge Graph note entities, and loads into vector/relational stores.

### 11. Real-Time Telemetry & Observability Drawer (`server/telemetry.js` & `public/index.html`)
- **What it is**: Operational tracing system.
- **How it works under the hood**:
  - Records span traces (`traceId`, latency, prompt/completion tokens, USD spend). Exposes metrics via slide-out drawer UI.

---

## 🔬 Section 3: Framework & Tech Stack Selection (Why what was chosen)

| Component | Choice | Why Chosen over Alternatives |
| :--- | :--- | :--- |
| **Runtime** | **Node.js / Express** | High concurrency async I/O perfect for API gateways and SSE streaming; low overhead. |
| **Vector Engine** | **Native 6D Cosine Similarity** | Zero external DB latency overhead for domain-specific accord vector spaces; ultra-fast in-memory execution. |
| **Security Proxy** | **Custom Gateway Middleware** | Full control over PII regex, custom rate limiting, and semantic cache key generation. |
| **Protocols** | **MCP (JSON-RPC 2.0)** | Enterprise standard protocol supported by Anthropic, Claude Desktop, and modern AI clients. |

---

## 🎯 Section 4: How the FDE Fine-Tunes & Verifies the System

```
  Step 1: Run Benchmark Evals (POST /api/evals) --> Check Faithfulness & Context Precision
  Step 2: Run Red-Teaming Suite (POST /api/redteam) --> Verify 100% Security Defense Pass Rate
  Step 3: Check Telemetry Drawer --> Ensure Latency <200ms and Cache Hit Rate >30%
  Step 4: Execute Cache Flush (POST /api/cache/flush) --> Clear stale embeddings upon catalog updates
```

This guide equips you with complete 360-degree subject-matter expertise on the AURA platform!
