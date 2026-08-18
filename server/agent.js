/**
 * AURA PERFUMERY - Autonomous ReAct Multi-Agent & Customer Support Order Agent (server/agent.js)
 */

const { FRAGRANCE_CATALOG, KNOWLEDGE_GRAPH, findMatchingProduct } = require('./db');
const orderEngine = require('./orders');

class AgentOrchestrator {
  constructor() {
    this.tools = [
      { name: "tool_create_bespoke_formula", description: "Formulates a custom haute perfume oil blend based on user note preferences." },
      { name: "tool_check_inventory", description: "Queries atelier warehouse stock for specific fragrance products." },
      { name: "tool_graph_harmonize", description: "Queries scent knowledge graph for note pairings and accords." },
      { name: "tool_place_order", description: "Places a new e-commerce order for a perfume product with size & quantity." },
      { name: "tool_check_order_status", description: "Tracks shipping and delivery status of an existing order ID." },
      { name: "tool_cancel_order", description: "Cancels an active processing order and issues refund." }
    ];

    // Stateful Order Draft for Interactive Multi-Turn Order Placement
    this.pendingDraft = null;
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

  findCatalogProduct(query) {
    return findMatchingProduct(query);
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

    traceSteps.push({
      type: "THOUGHT",
      content: `Evaluating user prompt: "${userQuery}". Intention analysis: Delivery Tracking, Order Placement, Order Cancellation, Bespoke Blend.`
    });

    // -------------------------------------------------------------------------
    // INTENT 1: ORDER TRACKING & ESTIMATED DELIVERY DATE
    // -------------------------------------------------------------------------
    const isDeliveryQuery = lower.includes("delivery date") || lower.includes("when will my order") ||
                            lower.includes("track") || lower.includes("shipping status") ||
                            lower.includes("where is my order") || lower.includes("ord-") || lower.includes("carrier for");

    if (isDeliveryQuery && !lower.includes("cancel") && !lower.includes("place") && !lower.includes("buy")) {
      const match = userQuery.match(/ORD-[A-Z0-9]+/i);

      if (match) {
        const orderId = match[0].toUpperCase();
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
      } else {
        traceSteps.push({
          type: "THOUGHT",
          content: "User inquired about order delivery date/tracking, but did not provide a valid Order ID. Requesting Order ID from user."
        });

        const answer = `📦 **AURA Order Tracking & Delivery Assistant**\n\n` +
                       `I'd be delighted to check your estimated delivery date and shipping status!\n\n` +
                       `Please provide your **Order ID** (for example: **ORD-8821** or **ORD-9430**) so I can pull up your exact carrier tracking, item details, and estimated delivery date.\n\n` +
                       `*Tip: You can reply with "Track order ORD-8821"*`;
        return { finalAnswer: answer, traceSteps };
      }
    }

    // -------------------------------------------------------------------------
    // INTENT 2: CANCEL ORDER
    // -------------------------------------------------------------------------
    if (lower.includes("cancel")) {
      const match = userQuery.match(/ORD-[A-Z0-9]+/i);

      if (match) {
        const orderId = match[0].toUpperCase();
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

        return { finalAnswer: res.message, traceSteps };
      } else {
        traceSteps.push({
          type: "THOUGHT",
          content: "User requested order cancellation but did not provide Order ID."
        });

        const answer = `❌ **AURA Order Cancellation Assistant**\n\n` +
                       `Please specify the **Order ID** you wish to cancel (for example: *"Cancel order ORD-9430"*).\n\n` +
                       `*Note: Only orders in **PROCESSING** status can be cancelled. Shipped orders (like ORD-8821) cannot be cancelled.*`;
        return { finalAnswer: answer, traceSteps };
      }
    }

    // -------------------------------------------------------------------------
    // INTENT 3: INVENTORY & STOCK CHECK
    // -------------------------------------------------------------------------
    const isInventoryQuery = lower.includes("stock") || lower.includes("inventory") || 
                             lower.includes("available") || lower.includes("units") || 
                             lower.includes("how many") || lower.includes("in stock");

    if (isInventoryQuery && !lower.includes("place") && !lower.includes("buy") && !lower.includes("cancel") && !isDeliveryQuery) {
      const matchedProduct = this.findCatalogProduct(userQuery) || FRAGRANCE_CATALOG[0];

      traceSteps.push({
        type: "ACTION",
        tool: "tool_check_inventory",
        input: { product: matchedProduct.name }
      });

      traceSteps.push({
        type: "OBSERVATION",
        output: { name: matchedProduct.name, inStock: matchedProduct.inStock, count: matchedProduct.stockCount }
      });

      const stockMsg = `📦 **Atelier Inventory & Stock Report**\n\n` +
                       `• **Product**: **${matchedProduct.name}**\n` +
                       `• **Current Stock**: **${matchedProduct.stockCount} units available** in atelier warehouse\n` +
                       `• **Availability Status**: **${matchedProduct.inStock ? 'IN STOCK (Ready for immediate dispatch)' : 'OUT OF STOCK'}**\n` +
                       `• **Price**: ${matchedProduct.inRupees || '₹18,500'} ($${matchedProduct.price} USD)\n\n` +
                       `👉 To place an order, ask *"Place an order for ${matchedProduct.name}"*.`;

      return { finalAnswer: stockMsg, traceSteps };
    }

    // -------------------------------------------------------------------------
    // INTENT 4: USER-FRIENDLY & GUIDED ORDER PLACEMENT
    // -------------------------------------------------------------------------
    const isOrderPlacement = lower.includes("place order") || lower.includes("place an order") ||
                             lower.includes("want to order") || lower.includes("order a bottle") ||
                             lower.includes("buy") || lower.includes("purchase") ||
                             lower.includes("how to order") || lower.includes("confirm order") ||
                             (this.pendingDraft !== null && (lower.includes("yes") || lower.includes("proceed")));

    if (isOrderPlacement) {
      // Try parsing product, quantity, size from query
      const matchedProduct = this.findCatalogProduct(userQuery);

      // Filter out 50ml / 100ml text before parsing quantity
      const cleanedForQty = userQuery.replace(/\b(50|100)\s*ml\b/gi, '');
      const qtyMatch = cleanedForQty.match(/(\d+)\s*(bottle|unit|piece|item|qty|quantity)?/i);
      const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;

      // Parse Size
      const size = lower.includes("50ml") ? "50ml" : "100ml";

      const estDeliveryObj = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const formattedDelivery = estDeliveryObj.toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });

      // CASE A: Vague instruction like "place an order" (No specific product recognized)
      if (!matchedProduct) {
        traceSteps.push({
          type: "THOUGHT",
          content: "User initiated order placement without specifying a product. Providing guided 1-click selection menu."
        });

        const menuAnswer = `🛍️ **AURA Interactive Order Placement Assistant**\n\n` +
                           `I'll be happy to help you place an order! Choose your desired fragrance below to place your order with **1-click**:\n\n` +
                           `• **Royal Oud & Mysore Sandalwood** — ₹18,500 ($245)\n` +
                           `• **Imperial Kannauj Rose & Suede** — ₹19,500 ($260)\n` +
                           `• **Royal Kashmir Saffron & Amber** — ₹21,000 ($280)\n` +
                           `• **Solar Malabar Citrus & Vetiver** — ₹14,500 ($195)\n` +
                           `• **Monsoon Vetiver & Rain Mint** — ₹16,000 ($210)\n` +
                           `• **Smoked Cardamom & Incense** — ₹22,500 ($295)\n\n` +
                           `📦 **Order Specs**: 100ml Extrait de Parfum • 3-Day Express Shipping (Delivers by **${formattedDelivery}** via DHL Express India).\n\n` +
                           `👉 Click one of the quick order buttons below or type *"Place order for [Perfume Name]"*:`;
        return { finalAnswer: menuAnswer, traceSteps };
      }

      // CASE B: Product recognized -> Instantly place order & issue official receipt
      traceSteps.push({
        type: "ACTION",
        tool: "tool_place_order",
        input: { productQuery: matchedProduct.name, size, quantity }
      });

      const res = orderEngine.placeOrder(matchedProduct.name, size, quantity);
      this.pendingDraft = null;

      traceSteps.push({
        type: "OBSERVATION",
        output: res
      });

      return { finalAnswer: res.message, traceSteps };
    }

    // -------------------------------------------------------------------------
    // INTENT 5: BESPOKE FORMULA CREATION
    // -------------------------------------------------------------------------
    if (lower.includes("bespoke") || lower.includes("custom blend") || lower.includes("formulate") || lower.includes("create blend") || lower.includes("blend")) {
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

      const answer = `Our Atelier Agent has formulated a custom bespoke creation for you: **${bespokeResult.formulaName}** (${bespokeResult.bottlePrice}). Ratios: ${bespokeResult.topRatio}, ${bespokeResult.heartRatio}, and ${bespokeResult.baseRatio}. Concentration: ${bespokeResult.concentration}.`;
      return { finalAnswer: answer, traceSteps };
    }

    // -------------------------------------------------------------------------
    // FALLBACK
    // -------------------------------------------------------------------------
    const matched = this.findCatalogProduct(userQuery) || FRAGRANCE_CATALOG[0];
    const fallbackAnswer = `Based on your request, I highly recommend **${matched.name}** (${matched.inRupees || '$' + matched.price}). It features prominent notes of ${matched.topNotes ? matched.topNotes.join(', ') : ''} over a core of ${matched.heartNotes ? matched.heartNotes.join(', ') : ''} and ${matched.baseNotes ? matched.baseNotes.join(', ') : ''}. ${matched.description} (Longevity: ${matched.longevity}).`;
    return { finalAnswer: fallbackAnswer, traceSteps };
  }
}

const agentOrchestrator = new AgentOrchestrator();
module.exports = agentOrchestrator;
