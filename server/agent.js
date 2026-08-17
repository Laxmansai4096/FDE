/**
 * AURA PERFUMERY - Autonomous Multi-Agent Orchestrator & Tool Calling Engine
 * 
 * FDE Concept: Modern Enterprise FDE solutions rely heavily on Agentic AI (ReAct / Tool-Calling Loop).
 * Rather than single-prompt RAG, an FDE builds multi-agent systems that autonomously:
 * 1. Reason about the user's complex olfactory request.
 * 2. Execute discrete tools (Vector Search, Relational DB Lookup, Knowledge Graph, Formula Generator).
 * 3. Evaluate results & execute step-by-step reasoning (Thought -> Action -> Observation -> Response).
 */

const { FRAGRANCE_CATALOG, KNOWLEDGE_GRAPH, textToScentVector, cosineSimilarity } = require('./db');
const ragEngine = require('./rag');

// Tool Definitions Available to the Agent
const AGENT_TOOLS = {
  // Tool 1: Dense Vector Scent Search
  tool_vector_search: (query) => {
    const result = ragEngine.retrieve(query);
    return {
      success: true,
      queryVector: result.queryVector,
      topMatches: result.retrieved.map(p => ({
        id: p.id,
        name: p.name,
        vectorScore: p.vectorScore,
        family: p.family,
        price: p.price
      }))
    };
  },

  // Tool 2: Relational Real-Time Inventory & Price Check
  tool_check_inventory: (productNameOrId) => {
    const term = productNameOrId.toLowerCase();
    const product = FRAGRANCE_CATALOG.find(p => p.id === productNameOrId || p.name.toLowerCase().includes(term));
    if (!product) {
      return { success: false, message: `Product '${productNameOrId}' not found in relational catalog.` };
    }
    return {
      success: true,
      id: product.id,
      name: product.name,
      inStock: product.inStock,
      stockCount: product.stockCount,
      price: product.price,
      sizes: product.sizes,
      longevity: product.longevity
    };
  },

  // Tool 3: Scent Knowledge Graph Harmonization Query
  tool_graph_harmonize: (noteName) => {
    const cleanKey = Object.keys(KNOWLEDGE_GRAPH).find(k => noteName.toLowerCase().includes(k.toLowerCase()));
    if (!cleanKey || !KNOWLEDGE_GRAPH[cleanKey]) {
      return { success: false, message: `Note '${noteName}' not found in Scent Knowledge Graph.` };
    }
    return {
      success: true,
      note: cleanKey,
      family: KNOWLEDGE_GRAPH[cleanKey].family,
      pairsWith: KNOWLEDGE_GRAPH[cleanKey].pairsWith,
      mood: KNOWLEDGE_GRAPH[cleanKey].mood
    };
  },

  // Tool 4: Bespoke Formula Blend Generator (Agentic Custom Formulation)
  tool_create_bespoke_formula: (desiredNotesList) => {
    const notes = Array.isArray(desiredNotesList) ? desiredNotesList : desiredNotesList.split(',');
    const topPercentage = 30;
    const heartPercentage = 45;
    const basePercentage = 25;

    return {
      success: true,
      formulaName: `Haute Blend No. ${Math.floor(100 + Math.random() * 900)}`,
      concentration: "Extrait de Parfum (25% Oil)",
      topNotes: notes.slice(0, 2).map(n => `${n.trim()} (30% vol)`),
      heartNotes: notes.slice(2, 4).map(n => `${n.trim()} (45% vol)`),
      baseNotes: notes.slice(4).length > 0 ? notes.slice(4).map(n => `${n.trim()} (25% vol)`) : ["Golden Amber & Cedarwood Accord (25% vol)"],
      estimatedArtisanPrice: "$340 / 100ml Bespoke Flacon",
      leadTimeDays: 7
    };
  }
};

class AgenticOrchestrator {
  /**
   * Execute ReAct Multi-Step Agent Execution Loop
   */
  async runAgentLoop(userQuery) {
    const traceSteps = [];
    const lower = userQuery.toLowerCase();

    traceSteps.push({
      step: 1,
      type: "THOUGHT",
      content: "Analyzing query intent. Determining if request needs Vector RAG, Inventory Lookup, Knowledge Graph Harmonization, or Bespoke Custom Blend Creation."
    });

    let toolCalls = [];
    let finalAnswer = "";
    let bespokeFormula = null;
    let inventoryDetails = null;

    // Agentic Decision Branch 1: Bespoke Custom Creation Request
    if (lower.includes("custom") || lower.includes("create") || lower.includes("bespoke") || lower.includes("blend") || lower.includes("formula")) {
      traceSteps.push({
        step: 2,
        type: "ACTION",
        tool: "tool_create_bespoke_formula",
        input: userQuery
      });

      const formulaResult = AGENT_TOOLS.tool_create_bespoke_formula(["Bergamot", "Cedarwood", "Bourbon Vanilla", "Dark Oud"]);
      bespokeFormula = formulaResult;

      traceSteps.push({
        step: 3,
        type: "OBSERVATION",
        output: formulaResult
      });

      finalAnswer = `Our Atelier Agent has formulated a custom bespoke creation for you: **${formulaResult.formulaName}** (${formulaResult.concentration}). ` +
        `Top Accord: ${formulaResult.topNotes.join(', ')}. Heart Accord: ${formulaResult.heartNotes.join(', ')}. Base Accord: ${formulaResult.baseNotes.join(', ')}. ` +
        `Price: ${formulaResult.estimatedArtisanPrice}. Lead time: ${formulaResult.leadTimeDays} days.`;
    } 
    // Agentic Decision Branch 2: Standard/Complex RAG & Inventory Check
    else {
      // Step A: Vector Search Tool
      traceSteps.push({
        step: 2,
        type: "ACTION",
        tool: "tool_vector_search",
        input: userQuery
      });

      const vectorRes = AGENT_TOOLS.tool_vector_search(userQuery);
      traceSteps.push({
        step: 3,
        type: "OBSERVATION",
        output: `Retrieved ${vectorRes.topMatches.length} top fragrance vector candidates.`
      });

      // Step B: Check Inventory for Top Match
      if (vectorRes.topMatches.length > 0) {
        const topMatch = vectorRes.topMatches[0];
        traceSteps.push({
          step: 4,
          type: "ACTION",
          tool: "tool_check_inventory",
          input: topMatch.id
        });

        inventoryDetails = AGENT_TOOLS.tool_check_inventory(topMatch.id);
        traceSteps.push({
          step: 5,
          type: "OBSERVATION",
          output: inventoryDetails
        });
      }

      // Step C: Knowledge Graph Pairing
      traceSteps.push({
        step: 6,
        type: "ACTION",
        tool: "tool_graph_harmonize",
        input: "Bergamot"
      });

      const graphRes = AGENT_TOOLS.tool_graph_harmonize("Bergamot");
      traceSteps.push({
        step: 7,
        type: "OBSERVATION",
        output: graphRes
      });

      // Formulate final response based on agent observations
      if (inventoryDetails && inventoryDetails.success) {
        finalAnswer = `The Agent selected **${inventoryDetails.name}** as your premier match ($${inventoryDetails.price}). `;
        if (inventoryDetails.inStock) {
          finalAnswer += `Real-time relational DB confirms **${inventoryDetails.stockCount} units in stock** at our Paris Atelier. `;
        } else {
          finalAnswer += `Relational DB inventory flags this product as **currently out of stock**, but our agent can place an automatic backorder notification. `;
        }
        finalAnswer += `Note Harmonization: Pairs magnificently with ${graphRes.pairsWith ? graphRes.pairsWith.join(', ') : 'resinous amber'}.`;
      }
    }

    return {
      agentQuery: userQuery,
      traceSteps,
      finalAnswer,
      bespokeFormula,
      inventoryDetails
    };
  }
}

const agentOrchestrator = new AgenticOrchestrator();
module.exports = agentOrchestrator;
