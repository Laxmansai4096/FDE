/**
 * AURA PERFUMERY - Ollama Local LLM & Hybrid Cloud/On-Prem Router
 * 
 * FDE Concept: In enterprise & defense client deployments (e.g. Palantir, Microsoft On-Prem, Government Cloud),
 * FDEs build Hybrid LLM Routing logic:
 * 1. Primary Local Route: Local Ollama server (Llama 3, Mistral, Gemma, Phi-3, Qwen) for 100% air-gapped data privacy.
 * 2. Cloud Fallback Route: Gemini 1.5 Flash / Azure OpenAI for high-speed cloud inference when local server is offline.
 * 3. Zero-Cost Local Inference: Zero API token spend for local model execution.
 */

class OllamaHybridRouter {
  constructor() {
    this.ollamaBaseUrl = process.env.OLLAMA_HOST || "http://localhost:11434";
    this.defaultModel = process.env.OLLAMA_MODEL || "llama3";
    this.isAvailable = false;
    this.availableModels = [];
  }

  // 1. Probe Ollama Local Server Status & List Installed Models
  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const res = await fetch(`${this.ollamaBaseUrl}/api/tags`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        this.availableModels = data.models ? data.models.map(m => m.name) : [];
        this.isAvailable = true;
        if (this.availableModels.length > 0) {
          this.defaultModel = this.availableModels[0];
        }
        return {
          available: true,
          models: this.availableModels,
          selectedModel: this.defaultModel,
          baseUrl: this.ollamaBaseUrl
        };
      }
    } catch (err) {
      this.isAvailable = false;
    }

    return {
      available: false,
      models: [],
      selectedModel: "gemini-1.5-flash (Cloud Fallback)",
      baseUrl: this.ollamaBaseUrl
    };
  }

  // 2. Generate Local Response via Ollama API
  async generateResponse(prompt, systemContext = "") {
    const health = await this.checkHealth();

    if (!health.available) {
      return {
        usedLocal: false,
        model: "gemini-1.5-flash (Cloud Fallback)",
        provider: "Gemini-Cloud-Fallback",
        response: null, // Signals caller to use cloud fallback generator
        error: "Ollama server offline or unreachable on http://localhost:11434"
      };
    }

    try {
      const res = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: health.selectedModel,
          prompt: `${systemContext}\n\nUser Prompt: ${prompt}`,
          stream: false
        })
      });

      if (res.ok) {
        const data = await res.json();
        return {
          usedLocal: true,
          model: health.selectedModel,
          provider: `Ollama-Local (${health.selectedModel})`,
          response: data.response,
          promptTokens: data.prompt_eval_count || 50,
          completionTokens: data.eval_count || 100,
          latencyMs: Math.round((data.total_duration || 0) / 1e6)
        };
      }
    } catch (err) {
      console.warn("Ollama generation error, falling back to cloud:", err.message);
    }

    return {
      usedLocal: false,
      model: "gemini-1.5-flash",
      provider: "Gemini-Cloud-Fallback",
      response: null
    };
  }
}

const ollamaRouter = new OllamaHybridRouter();
module.exports = ollamaRouter;
