/**
 * AURA PERFUMERY - Autonomous ReAct Multi-Agent Tool Calling Engine (server/agent.js)
 */

const { FRAGRANCE_CATALOG, KNOWLEDGE_GRAPH } = require('./db');
const orderEngine = require('./orders');

class AgentOrchestrator {
  constructor() {
    this.tools = [
      { name: "tool_create_bespoke_formula", description: "Formulates a custom haute perfume oil blend based on user note preferences." },
      { name: "tool_check_inventory", description: "Queries atelier warehouse stock for specific fragrance products." },
      { name: "tool_graph_harmonize", description: "Queries scent knowledge graph for note pairings and accords." },
      { name: "tool_place_order", description: "Places a new e-commerce order for a perfume product." },
      { name: "tool_check_order_status", description: "Tracks shipping and delivery status of an existing order ID." },
      { name: "tool_cancel_order", description: "Cancels an active processing order and issues refund." }
    ];
  }

  runDomainBoundaryCheck(query) {
    const lower = query.toLowerCase();

    const outOfDomainKeywords = [
      "tell me a story", "write a poem", "who is the president", "2+2=",
      "calculate sqrt", "python code for", "what is the capital of"
    ];

    for (const kw of outOfDomainKeywords) {
      if (lower.includes(kw)) {
        return {
          isOutOfDomain: true,
          response: "I am AURA's Olfactory Sommelier & Customer Support Assistant. I am specialized strictly in Indian luxury fragrance discovery, note harmonization, and order management (ORD-8821 tracking, placement, cancellations). How may I assist you with your perfume journey today?"
        };
      }
    }
    return { isOutOfDomain: false };
  }

  async runAgentLoop(userQuery) {
    const boundaryCheck = this.runDomainBoundaryCheck(userQuery);
    if (boundaryCheck.isOutOfDomain) {
      return {
        finalAnswer: boundaryCheck.response,
        traceSteps: [{ type: "THOUGHT", content: "Query is out of olfactory/support domain. Enforcing domain boundary." }]
      };
    }

    const traceSteps = [];
    const lower = userQuery.toLowerCase();

    // ReAct Loop Step 1: Intention Recognition
    traceSteps.push({
      type: "THOUGHT",
      content: `Evaluating user query: "${userQuery}". Analyzing intent across Bespoke Blends, Inventory Check, Note Pairing, Order OMS.`
    });

    // Intent 1: Check Order Status
    if (lower.includes("ord-") && (lower.includes("track") || lower.includes("status") || lower.includes("check") || lower.includes("where"))) {
      const match = userQuery.match(/ORD-\d{4}/i);
      const orderId = match ? match[0].toUpperCase() : "ORD-8821";

      traceSteps.push({
        type: "ACTION",
        tool: "tool_check_order_status",
        input: { orderId }
      });

      const res = orderEngine.checkOrderStatus(orderId);
      traceSteps.push({
        type: "OBSERVATION",
        output: res
      });

      return {
        finalAnswer: res.message,
        traceSteps
      };
    }

    // Intent 2: Cancel Order
    if (lower.includes("cancel") && (lower.includes("order") || lower.includes("ord-"))) {
      const match = userQuery.match(/ORD-\d{4}/i);
      const orderId = match ? match[0].toUpperCase() : "ORD-9430";

      traceSteps.push({
        type: "ACTION",
        tool: "tool_cancel_order",
        input: { orderId }
      });

      const res = orderEngine.cancelOrder(orderId);
      traceSteps.push({
        type: "OBSERVATION",
        output: res
      });

      return {
        finalAnswer: res.message,
        traceSteps
      };
    }

    // Intent 3: Place Order
    if (lower.includes("place order") || lower.includes("buy") || lower.includes("purchase")) {
      traceSteps.push({
        type: "ACTION",
        tool: "tool_place_order",
        input: { productQuery: userQuery }
      });

      const res = orderEngine.placeOrder(userQuery);
      traceSteps.push({
        type: "OBSERVATION",
        output: res
      });

      return {
        finalAnswer: res.message,
        traceSteps
      };
    }

    // Intent 4: Bespoke Formula Creation
    if (lower.includes("bespoke") || lower.includes("custom blend") || lower.includes("formulate") || lower.includes("create blend")) {
      traceSteps.push({
        type: "ACTION",
        tool: "tool_create_bespoke_formula",
        input: { notesRequested: ["Assam Oud", "Mysore Sandalwood", "Kashmir Saffron"] }
      });

      const bespokeResult = {
        formulaName: "Haute Royal Blend No. 711",
        topRatio: "30% Assam Oud & Bergamot",
        heartRatio: "45% Sacred Mysore Sandalwood",
        baseRatio: "25% Golden Amber & Saffron",
        concentration: "30% Extrait de Parfum",
        bottlePrice: "$340 (₹28,000)"
      };

      traceSteps.push({
        type: "OBSERVATION",
        output: bespokeResult
      });

      const finalAnswer = `Our Atelier Agent has formulated a custom bespoke creation for you: **${bespokeResult.formulaName}** ($340 / ₹28,000). Ratios: ${bespokeResult.topRatio}, ${bespokeResult.heartRatio}, and ${bespokeResult.baseRatio}. Concentration: ${bespokeResult.concentration}.`;
      return { finalAnswer, traceSteps };
    }

    // Intent 5: Note Harmonization
    if (lower.includes("pair") || lower.includes("harmonize") || lower.includes("notes")) {
      traceSteps.push({
        type: "ACTION",
        tool: "tool_graph_harmonize",
        input: { note: "Bergamot" }
      });

      const res = KNOWLEDGE_GRAPH["Lemon"] || KNOWLEDGE_GRAPH["Oud"];
      traceSteps.push({
        type: "OBSERVATION",
        output: res
      });

      const finalAnswer = `According to our Scent Knowledge Graph, top citrus notes pair harmoniously with **${res.pairsWith.join(', ')}**, creating a ${res.mood.toLowerCase()} olfactory impression.`;
      return { finalAnswer, traceSteps };
    }

    // Default Fallback: Inventory Check & Recommendation
    traceSteps.push({
      type: "ACTION",
      tool: "tool_check_inventory",
      input: { catalogQuery: userQuery }
    });

    const topProduct = FRAGRANCE_CATALOG[0];
    traceSteps.push({
      type: "OBSERVATION",
      output: { name: topProduct.name, inStock: topProduct.inStock, count: topProduct.stockCount }
    });

    const finalAnswer = `I recommend **${topProduct.name}** (${topProduct.inRupees} / $${topProduct.price}). Featuring ${topProduct.topNotes.join(', ')} over a core of ${topProduct.heartNotes.join(', ')}. Inventory status: ${topProduct.inStock ? `${topProduct.stockCount} bottles available` : 'Low stock'}.`;
    return { finalAnswer, traceSteps };
  }
}

const agentOrchestrator = new AgentOrchestrator();
module.exports = agentOrchestrator;
