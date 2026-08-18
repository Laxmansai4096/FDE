/**
 * AURA PERFUMERY - FDE Enterprise Application Server (Gateway Load Balancer & Failover Integrated)
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
const ollamaRouter = require('./ollama');
const orderEngine = require('./orders');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 1. Chat & Scent Sommelier Endpoint (Load Balancing + Failover + Guardrails + RAG)
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

  // Customer Support & Inventory Intent Interceptor (Order Tracking, Delivery Date, Inventory Check, Order Cancel, Order Placement)
  const lower = guardrailStatus.sanitizedQuery.toLowerCase();
  const isOrderIntent = lower.includes("ord-") || 
                        lower.includes("track") || 
                        lower.includes("delivery date") || 
                        lower.includes("when will my order") || 
                        lower.includes("shipping status") || 
                        lower.includes("cancel") || 
                        lower.includes("place order") || 
                        lower.includes("place an order") || 
                        lower.includes("want to order") || 
                        lower.includes("order a bottle") || 
                        lower.includes("buy") || 
                        lower.includes("purchase") || 
                        lower.includes("how to order") || 
                        lower.includes("confirm order") || 
                        lower.includes("stock") || 
                        lower.includes("inventory") || 
                        lower.includes("available") || 
                        lower.includes("units") || 
                        lower.includes("how many") || 
                        lower.includes("in stock") ||
                        (agentOrchestrator.pendingDraft !== null && (lower.includes("confirm") || lower.includes("yes") || lower.includes("proceed")));

  if (isOrderIntent) {
    const agentRes = await agentOrchestrator.runAgentLoop(guardrailStatus.sanitizedQuery);
    const latencyMs = Date.now() - startTime;
    
    const trace = telemetry.recordTrace({
      query,
      sanitizedQuery: guardrailStatus.sanitizedQuery,
      provider: "Customer-Support-Order-Engine",
      model: "react-order-agent",
      cacheHit: false,
      latencyMs,
      promptTokens: 120,
      completionTokens: 80,
      retrievedProducts: [],
      guardrailStatus,
      response: agentRes.finalAnswer
    });

    return res.json({
      response: agentRes.finalAnswer,
      retrievedProducts: [],
      cacheHit: false,
      guardrailStatus,
      telemetryTrace: trace
    });
  }

  // Step B: Hybrid RAG Retrieval (Vector + Relational)
  const ragResult = ragEngine.retrieve(guardrailStatus.sanitizedQuery, filters);
  const { queryVector, retrieved } = ragResult;

  // Step C: Dynamic Route & Load Balancer Resolution
  const routeDecision = gateway.resolveDynamicRoute(queryVector, guardrailStatus.flagged, guardrailStatus.sanitizedQuery);

  if (routeDecision.routeType === "CACHE_HIT") {
    const latencyMs = Date.now() - startTime;
    const trace = telemetry.recordTrace({
      query,
      sanitizedQuery: guardrailStatus.sanitizedQuery,
      provider: routeDecision.providerUsed,
      model: routeDecision.modelUsed,
      cacheHit: true,
      latencyMs,
      promptTokens: 0,
      completionTokens: 0,
      retrievedProducts: routeDecision.cacheResult.retrievedProducts,
      guardrailStatus,
      response: routeDecision.cacheResult.response
    });

    return res.json({
      response: routeDecision.cacheResult.response,
      retrievedProducts: routeDecision.cacheResult.retrievedProducts,
      cacheHit: true,
      cacheSimilarity: routeDecision.cacheResult.similarity,
      providerUsed: routeDecision.providerUsed,
      modelUsed: routeDecision.modelUsed,
      routingTrace: routeDecision.routingTrace,
      guardrailStatus,
      telemetryTrace: trace
    });
  }

  // Step D: Hybrid LLM Generation (Local Ollama Router OR Cloud Provider Failover)
  let providerName = routeDecision.providerUsed;
  let modelName = routeDecision.modelUsed;
  let generatedResponse = null;

  // Probe Local Ollama if healthy and circuit breaker is not in simulated failover
  if (!routeDecision.failoverTriggered) {
    const ollamaResult = await ollamaRouter.generateResponse(guardrailStatus.sanitizedQuery, "You are AURA Olfactory Sommelier.");
    if (ollamaResult.usedLocal && ollamaResult.response) {
      generatedResponse = ollamaResult.response;
      providerName = ollamaResult.provider;
      modelName = ollamaResult.model;
    }
  }

  if (!generatedResponse) {
    generatedResponse = gateway.generateDomainResponse(guardrailStatus.sanitizedQuery, retrieved);
    if (routeDecision.failoverTriggered) {
      generatedResponse = `[AUTOMATIC FAILOVER NOTICE: Primary cloud LLM endpoint suffered a simulated outage. Traffic failed over to ${providerName}].\n\n` + generatedResponse;
    }
  }

  const promptTokens = Math.round(guardrailStatus.sanitizedQuery.length / 4) + 120;
  const completionTokens = Math.round(generatedResponse.length / 4);

  gateway.storeInCache(guardrailStatus.sanitizedQuery, queryVector, generatedResponse, retrieved, guardrailStatus.flagged);

  const latencyMs = Date.now() - startTime;
  const trace = telemetry.recordTrace({
    query,
    sanitizedQuery: guardrailStatus.sanitizedQuery,
    provider: providerName,
    model: modelName,
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
    providerUsed: providerName,
    modelUsed: modelName,
    failoverTriggered: routeDecision.failoverTriggered,
    routingTrace: routeDecision.routingTrace,
    guardrailStatus,
    telemetryTrace: trace
  });
});

// Gateway Status & Load Balancer Diagnostic API
app.get('/api/gateway/status', (req, res) => {
  res.json(gateway.getDiagnosticReport());
});

// Gateway Simulate Outage & Circuit Breaker Failover API
app.post('/api/gateway/simulate-failover', (req, res) => {
  const { enable = true } = req.body;
  res.json(gateway.setSimulatedOutage(enable));
});

// Gateway Configuration API (Primary Provider & Active/Disabled Fallback Toggles)
app.post('/api/gateway/configure', (req, res) => {
  const { primaryProviderId, disabledFallbacks = [] } = req.body;
  res.json(gateway.configureGateway({ primaryProviderId, disabledFallbacks }));
});

// Gateway Heavy Traffic Surge Simulator API (Simulates 10 Concurrent Requests across Multi-Region Load Balancers)
app.post('/api/gateway/simulate-surge', (req, res) => {
  const surgeQueries = [
    "Smoky Mysore Sandalwood for winter",
    "Solar Malabar citrus for summer",
    "Imperial Kannauj Rose & Suede",
    "Kashmir Saffron Extrait",
    "Monsoon Vetiver & Cedar",
    "Assam Oud & Bergamot",
    "Kerala Black Cardamom",
    "Birch Tar & Smoked Leather",
    "White Musk & Lychee",
    "Damask Rose & Velvet Suede"
  ];

  surgeQueries.forEach(q => {
    const dummyVector = Array.from({ length: 6 }, () => Math.random());
    gateway.resolveDynamicRoute(dummyVector, false, q);
  });

  res.json(gateway.getDiagnosticReport());
});

// Customer Support REST APIs
app.post('/api/orders/place', (req, res) => {
  const { productId, size, quantity } = req.body;
  res.json(orderEngine.placeOrder(productId, size, quantity));
});

app.post('/api/orders/status', (req, res) => {
  const { orderId } = req.body;
  res.json(orderEngine.checkOrderStatus(orderId));
});

app.post('/api/orders/cancel', (req, res) => {
  const { orderId } = req.body;
  res.json(orderEngine.cancelOrder(orderId));
});

app.get('/api/orders', (req, res) => {
  res.json(orderEngine.getAllOrders());
});

// Ollama Status API
app.get('/api/ollama/status', async (req, res) => {
  res.json(await ollamaRouter.checkHealth());
});

// Autonomous Agentic AI Endpoint
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

// Microsoft AutoGen Multi-Agent Team Endpoint
app.post('/api/autogen', async (req, res) => {
  const { query = "Formulate signature scent for cold evening gala" } = req.body;
  res.json(await autoGenTeam.runTeamCollaboration(query));
});

// HyDE & RRF Endpoint
app.post('/api/hyde', (req, res) => {
  res.json(hydeRetriever.retrieveHyDE(req.body.query || "Fresh solar fragrance"));
});

// Red-Teaming Endpoint
app.post('/api/redteam', (req, res) => {
  res.json(redTeamSuite.runRedTeamAudit());
});

// MCP Endpoint
app.post('/api/mcp', (req, res) => {
  res.json(mcpServer.handleRPC(req.body));
});

// RAG Evals Endpoint
app.post('/api/evals', async (req, res) => {
  res.json(await evaluator.runEvaluationSuite());
});

// ETL Endpoint
app.post('/api/etl/ingest', (req, res) => {
  res.json(etlPipeline.ingestProductCatalog(req.body.rawRecords || FRAGRANCE_CATALOG));
});

// Products API
app.get('/api/products', (req, res) => {
  res.json({ products: FRAGRANCE_CATALOG, knowledgeGraph: KNOWLEDGE_GRAPH });
});

// Telemetry API
app.get('/api/telemetry', (req, res) => {
  res.json(telemetry.getMetrics());
});

// Flush Cache API
app.post('/api/cache/flush', (req, res) => {
  res.json({ message: `Semantic cache flushed successfully. ${gateway.flushCache()} entries cleared.` });
});

// Quiz API
app.post('/api/quiz', (req, res) => {
  const ragResult = ragEngine.retrieve(`Recommend a perfume for ${req.body.mood || 'luxury'} during ${req.body.season || 'any season'} featuring ${req.body.notePreference || 'balanced notes'}`);
  res.json({ recommendations: ragResult.retrieved, queryVector: ragResult.queryVector });
});

// Resume PDF Download Route
app.get('/resume.pdf', (req, res) => {
  res.sendFile(path.join(__dirname, '../resume.pdf'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  AURA PERFUMERY - FDE Enterprise AI Platform Server  `);
    console.log(`  Running on http://localhost:3000`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
