/**
 * AURA PERFUMERY - Model Context Protocol (MCP) Server Module
 * 
 * FDE Concept: Model Context Protocol (MCP) is the enterprise standard open protocol
 * for connecting AI assistants safely to enterprise data sources & tools.
 * An FDE builds MCP endpoints to expose legacy databases (SQL, Vector, ERPs) to AI applications.
 */

const { FRAGRANCE_CATALOG, KNOWLEDGE_GRAPH } = require('./db');
const ragEngine = require('./rag');

class MCPServer {
  constructor() {
    this.serverCapabilities = {
      tools: true,
      resources: true,
      prompts: true
    };
  }

  // Handle JSON-RPC 2.0 MCP Request
  handleRPC(requestPayload) {
    const { jsonrpc = "2.0", id, method, params = {} } = requestPayload;

    switch (method) {
      case "initialize":
        return {
          jsonrpc, id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: this.serverCapabilities,
            serverInfo: { name: "aura-perfumery-mcp-server", version: "1.0.0" }
          }
        };

      case "tools/list":
        return {
          jsonrpc, id,
          result: {
            tools: [
              {
                name: "vector_search",
                description: "Query 6D fragrance vector space using cosine similarity for scent notes & accords.",
                inputSchema: {
                  type: "object",
                  properties: { query: { type: "string", description: "Search query describing scent accords or notes" } },
                  required: ["query"]
                }
              },
              {
                name: "inventory_lookup",
                description: "Lookup real-time warehouse stock, bottle pricing, and availability in relational DB.",
                inputSchema: {
                  type: "object",
                  properties: { productId: { type: "string", description: "Fragrance SKU or name" } },
                  required: ["productId"]
                }
              },
              {
                name: "scent_graph_query",
                description: "Query Scent Knowledge Graph for note harmonies and pairing recommendations.",
                inputSchema: {
                  type: "object",
                  properties: { noteName: { type: "string", description: "Target note (e.g. Bergamot, Cedarwood, Vanilla)" } },
                  required: ["noteName"]
                }
              }
            ]
          }
        };

      case "tools/call":
        const { name, arguments: args } = params;
        if (name === "vector_search") {
          const ragRes = ragEngine.retrieve(args.query || "");
          return {
            jsonrpc, id,
            result: {
              content: [{ type: "text", text: JSON.stringify(ragRes.retrieved) }]
            }
          };
        } else if (name === "inventory_lookup") {
          const prod = FRAGRANCE_CATALOG.find(p => p.id === args.productId || p.name.toLowerCase().includes((args.productId || '').toLowerCase()));
          return {
            jsonrpc, id,
            result: {
              content: [{ type: "text", text: JSON.stringify(prod || { error: "Product not found" }) }]
            }
          };
        } else if (name === "scent_graph_query") {
          const noteKey = Object.keys(KNOWLEDGE_GRAPH).find(k => (args.noteName || '').toLowerCase().includes(k.toLowerCase()));
          const graphData = noteKey ? KNOWLEDGE_GRAPH[noteKey] : null;
          return {
            jsonrpc, id,
            result: {
              content: [{ type: "text", text: JSON.stringify(graphData || { error: "Note not found in graph" }) }]
            }
          };
        }
        return { jsonrpc, id, error: { code: -32601, message: `Tool '${name}' not found` } };

      case "resources/list":
        return {
          jsonrpc, id,
          result: {
            resources: [
              { uri: "aura://catalog/products", name: "Product Catalog Relational DB", mimeType: "application/json" },
              { uri: "aura://knowledge/graph", name: "Scent Harmonization Knowledge Graph", mimeType: "application/json" }
            ]
          }
        };

      default:
        return { jsonrpc, id, error: { code: -32601, message: `Method '${method}' not implemented` } };
    }
  }
}

const mcpServer = new MCPServer();
module.exports = mcpServer;
