/**
 * AURA PERFUMERY - Advanced HyDE (Hypothetical Document Embeddings) & RRF Retriever
 * 
 * Microsoft FDE Concept: Azure AI Search utilizes Hybrid Search (Dense Vectors + Sparse BM25)
 * combined with HyDE (Hypothetical Document Embeddings) to maximize search recall for ambiguous enterprise queries.
 */

const { FRAGRANCE_CATALOG, textToScentVector, cosineSimilarity } = require('./db');

class HyDERetriever {
  /**
   * Step 1: Generate Hypothetical Ideal Document (Simulated LLM HyDE Generation)
   */
  generateHypotheticalDocument(query) {
    const lower = query.toLowerCase();
    let hypotheticalDoc = `A luxury artisanal fragrance crafted for ${query}. `;

    if (lower.includes("fresh") || lower.includes("citrus") || lower.includes("summer")) {
      hypotheticalDoc += "Features sparkling Calabrian bergamot, solar lemon zest, neroli petals, and sea salt driftwood.";
    } else if (lower.includes("wood") || lower.includes("smoky") || lower.includes("winter")) {
      hypotheticalDoc += "Rich smoked cedarwood, smoldering dark oud, dark leather, and resinous golden amber.";
    } else if (lower.includes("vanilla") || lower.includes("gourmand") || lower.includes("sweet")) {
      hypotheticalDoc += "Infused with pure Bourbon vanilla, warm Madagascar cinnamon, tonka bean, and sandalwood.";
    } else if (lower.includes("rose") || lower.includes("floral")) {
      hypotheticalDoc += "Hand-harvested Damask rose absolute, powdery iris, pink peony, and velvety suede.";
    } else {
      hypotheticalDoc += "Balanced accords of bergamot, cedarwood, amber, and white musk.";
    }

    return hypotheticalDoc;
  }

  /**
   * Step 2: HyDE Retrieval with Reciprocal Rank Fusion (RRF)
   */
  retrieveHyDE(query) {
    const hypotheticalText = this.generateHypotheticalDocument(query);
    const hydeVector = textToScentVector(hypotheticalText);
    const directVector = textToScentVector(query);

    const scored = FRAGRANCE_CATALOG.map((product, idx) => {
      // 1. Direct Vector Similarity
      const directScore = cosineSimilarity(directVector, product.scentVector);
      
      // 2. HyDE Vector Similarity (Embedding of the generated hypothetical doc)
      const hydeScore = cosineSimilarity(hydeVector, product.scentVector);

      // 3. Sparse BM25 Keyword Match (Simple term overlap)
      const queryTerms = query.toLowerCase().split(' ');
      const prodText = `${product.name} ${product.family} ${product.description} ${product.topNotes.join(' ')}`.toLowerCase();
      let keywordHits = 0;
      queryTerms.forEach(t => { if (t.length > 2 && prodText.includes(t)) keywordHits++; });
      const sparseScore = Math.min(1.0, keywordHits * 0.3);

      // 4. Reciprocal Rank Fusion (RRF Hybrid Score)
      const rrfScore = Number(((directScore * 0.4) + (hydeScore * 0.4) + (sparseScore * 0.2)).toFixed(3));

      return {
        ...product,
        directScore: Number(directScore.toFixed(3)),
        hydeScore: Number(hydeScore.toFixed(3)),
        sparseScore: Number(sparseScore.toFixed(3)),
        hybridRRFScore: rrfScore
      };
    });

    const sorted = scored.sort((a, b) => b.hybridRRFScore - a.hybridRRFScore);

    return {
      query,
      hypotheticalDocText: hypotheticalText,
      hydeVector,
      topMatches: sorted.slice(0, 3)
    };
  }
}

const hydeRetriever = new HyDERetriever();
module.exports = hydeRetriever;
