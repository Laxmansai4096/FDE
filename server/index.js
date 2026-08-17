/**
 * AURA PERFUMERY - FDE Enterprise Application Server (Microsoft Azure AI Stack Alignment)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const { FRAGRANCE_CATALOG, KNOWLEDGE_GRAPH } = require('./db');
const gateway = require('./gateway');
const azureGateway = require('./azure_gateway');
const ragEngine = require('./rag');
const hydeRetriever = require('./hyde');
const autoGenTeam = require('./autogen_team');
const redTeamSuite = require('./redteam');
const telemetry = require('./telemetry');
const agentOrchestrator = require('./agent');
const mcpServer = require('./mcp');
const etlPipeline = require('./etl');
const evaluator = require('./evals');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 1. Chat & Scent Sommelier Endpoint (Azure APIM Gateway + Guardrails + Hybrid RAG)
app.post('/api/chat', async (req, res) => {
  const startTime = Date.now();
  const { query, filters = {} } = req.body;
  const tenantId = req.headers['x-tenant-id'] || 'aura-eu-paris';

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: "Invalid prompt query." });
  }

  // Step A1: Azure APIM Multi-Tenant Rate Limiting Check
  const rateLimitCheck = azureGateway.applyRateLimit(tenantId);
  if (!rateLimitCheck.allowed) {
    return res.status(429).json({ error: rateLimitCheck.message });
  }

  // Step A2: Azure AI Content Safety Moderation Check
  const safetyCheck = azureGateway.runContentSafetyModeration(query);
  if (!safetyCheck.passed) {
    return res.status(400).json({ error: `Azure AI Content Safety Flagged Query: Category '${safetyCheck.category}'` });
  }

  // Step A3: LLM Gateway Guardrails Check (PII & Injection)
  const guardrailStatus = gateway.runGuardrails(query);
  if (!guardrailStatus.passed) {
    const latencyMs = Date.now() - startTime;
    const blockedResponse = `I apologize, but your request triggered security or safety policy checks: ${guardrailStatus.reasons.join(', ')}. Please rephrase your query.`;
    
    const trace = telemetry.recordTrace({
      query,
      sanitizedQuery: guardrailStatus.sanitizedQuery,
      provider: "LLM-Gateway-Guardrails",
      model: "security-filter-v1",
      cacheHit: false,
      latencyMs,
      promptTokens: 12,
      completionTokens: 30,
      retrievedProducts: [],
      guardrailStatus,
      response: blockedResponse
    });

    return res.json({
      response: blockedResponse,
      retrievedProducts: [],
      cacheHit: false,
      guardrailStatus,
      telemetryTrace: trace
    });
  }

  // Step B: Hybrid RAG Retrieval (Vector + Relational)
  const ragResult = ragEngine.retrieve(guardrailStatus.sanitizedQuery, filters);
  const { queryVector, retrieved } = ragResult;

  // Step C: LLM Gateway Semantic Cache Check
  const cacheResult = gateway.checkCache(queryVector);
  if (cacheResult.hit) {
    const latencyMs = Date.now() - startTime;
    const trace = telemetry.recordTrace({
      query,
      sanitizedQuery: guardrailStatus.sanitizedQuery,
      provider: "Gateway-Semantic-Cache",
      model: "vector-similarity-cache",
      cacheHit: true,
      latencyMs,
      promptTokens: 0,
      completionTokens: 0,
      retrievedProducts: cacheResult.retrievedProducts,
      guardrailStatus,
      response: cacheResult.response
    });

    return res.json({
      response: cacheResult.response,
      retrievedProducts: cacheResult.retrievedProducts,
      cacheHit: true,
      cacheSimilarity: cacheResult.similarity,
      guardrailStatus,
      telemetryTrace: trace
    });
  }

  // Step D: LLM Generation (Model Inference / Resilient Fallback)
  const generatedResponse = gateway.generateDomainResponse(guardrailStatus.sanitizedQuery, retrieved);
  const promptTokens = Math.round(guardrailStatus.sanitizedQuery.length / 4) + 120;
  const completionTokens = Math.round(generatedResponse.length / 4);

  // Step E: Store response in Gateway Semantic Cache
  gateway.storeInCache(guardrailStatus.sanitizedQuery, queryVector, generatedResponse, retrieved);

  // Step F: Record Telemetry
  const latencyMs = Date.now() - startTime;
  const trace = telemetry.recordTrace({
    query,
    sanitizedQuery: guardrailStatus.sanitizedQuery,
    provider: "Azure-OpenAI-Gemini-Bridge",
    model: "gpt-4o-mini-aura",
    cacheHit: false,
    latencyMs,
    promptTokens,
    completionTokens,
    retrievedProducts: retrieved,
    guardrailStatus,
    response: generatedResponse
  });

  return res.json({
    response: generatedResponse,
    retrievedProducts: retrieved,
    queryVector,
    cacheHit: false,
    guardrailStatus,
    telemetryTrace: trace
  });
});

// 2. Autonomous Agentic AI Endpoint (ReAct Loop + Tool Calling)
app.post('/api/agent', async (req, res) => {
  const startTime = Date.now();
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Missing query for agent." });
  }

  const agentResult = await agentOrchestrator.runAgentLoop(query);
  const latencyMs = Date.now() - startTime;

  const trace = telemetry.recordTrace({
    query,
    sanitizedQuery: query,
    provider: "Agentic-Multi-Tool-Orchestrator",
    model: "gemini-1.5-pro-agent",
    cacheHit: false,
    latencyMs,
    promptTokens: 350,
    completionTokens: 220,
    retrievedProducts: [],
    guardrailStatus: { flagged: false, reasons: [] },
    response: agentResult.finalAnswer
  });

  return res.json({
    agentResult,
    telemetryTrace: trace
  });
});

// 3. Microsoft AutoGen Multi-Agent Team Endpoint
app.post('/api/autogen', async (req, res) => {
  const { query = "Formulate signature scent for cold evening gala" } = req.body;
  const teamResult = await autoGenTeam.runTeamCollaboration(query);
  res.json(teamResult);
});

// 4. HyDE & Reciprocal Rank Fusion (RRF) Retriever Endpoint
app.post('/api/hyde', (req, res) => {
  const { query = "Fresh solar fragrance" } = req.body;
  const hydeResult = hydeRetriever.retrieveHyDE(query);
  res.json(hydeResult);
});

// 5. Red-Teaming Security Audit Endpoint
app.post('/api/redteam', (req, res) => {
  const auditReport = redTeamSuite.runRedTeamAudit();
  res.json(auditReport);
});

// 6. Model Context Protocol (MCP) JSON-RPC 2.0 Endpoint
app.post('/api/mcp', (req, res) => {
  const responsePayload = mcpServer.handleRPC(req.body);
  res.json(responsePayload);
});

// 7. LLM Evaluation & RAG Quality Benchmark Endpoint
app.post('/api/evals', async (req, res) => {
  const evalReport = await evaluator.runEvaluationSuite();
  res.json(evalReport);
});

// 8. Enterprise ETL Pipeline Ingestion Endpoint
app.post('/api/etl/ingest', (req, res) => {
  const rawData = req.body.rawRecords || FRAGRANCE_CATALOG;
  const etlResult = etlPipeline.ingestProductCatalog(rawData);
  res.json(etlResult);
});

// 9. Products Catalog API
app.get('/api/products', (req, res) => {
  res.json({
    products: FRAGRANCE_CATALOG,
    knowledgeGraph: KNOWLEDGE_GRAPH
  });
});

// 10. FDE Telemetry & Operational Metrics API
app.get('/api/telemetry', (req, res) => {
  res.json(telemetry.getMetrics());
});

// 11. Flush Semantic Cache Endpoint
app.post('/api/cache/flush', (req, res) => {
  const clearedCount = gateway.flushCache();
  res.json({ message: `Semantic cache flushed successfully. ${clearedCount} entries cleared.` });
});

// 12. Interactive Scent Builder Quiz Endpoint
app.post('/api/quiz', (req, res) => {
  const { mood, season, notePreference } = req.body;
  const quizQuery = `Recommend a perfume for ${mood || 'luxury'} during ${season || 'any season'} featuring ${notePreference || 'balanced notes'}`;
  
  const ragResult = ragEngine.retrieve(quizQuery);
  res.json({
    recommendations: ragResult.retrieved,
    queryVector: ragResult.queryVector
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  AURA PERFUMERY - FDE Enterprise AI Platform Server  `);
  console.log(`  Running on http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
