/**
 * AURA PERFUMERY - Hybrid RAG (Retrieval-Augmented Generation) Engine
 * 
 * FDE Concept: Pure vector search often yields topically similar results that fail enterprise rules
 * (e.g., recommending out-of-stock items or exceeding price limits).
 * Hybrid RAG combines:
 * 1. Vector Search: Scent vector space similarity matching.
 * 2. Relational Filtering: Price range, season, occasion, in-stock availability.
 * 3. Metadata Reranking: Rating weight + stock availability bonus.
 */

const { FRAGRANCE_CATALOG, KNOWLEDGE_GRAPH, textToScentVector, cosineSimilarity } = require('./db');

class HybridRAGEngine {
  /**
   * Execute Hybrid Retrieval
   * @param {string} query - User query
   * @param {Object} filters - Optional relational filters { maxPrice, season, mustBeInStock, family }
   */
  retrieve(query, filters = {}) {
    const queryVector = textToScentVector(query);

    const scoredProducts = FRAGRANCE_CATALOG.map(product => {
      // 1. Vector Similarity
      const vectorScore = cosineSimilarity(queryVector, product.scentVector);

      // 2. Relational Metadata Filtering
      let passesFilters = true;
      if (filters.maxPrice && product.price > filters.maxPrice) passesFilters = false;
      if (filters.mustBeInStock && !product.inStock) passesFilters = false;
      if (filters.family && product.family.toLowerCase() !== filters.family.toLowerCase()) passesFilters = false;
      if (filters.season && !product.season.includes(filters.season)) passesFilters = false;

      // 3. Hybrid Reranking Formula
      const ratingNorm = product.rating / 5.0;
      const stockBonus = product.inStock ? 0.1 : 0.0;
      const hybridScore = passesFilters ? (vectorScore * 0.7) + (ratingNorm * 0.2) + stockBonus : 0;

      // 4. Enrich product with Knowledge Graph pairings for top notes
      const topNoteHarmonies = {};
      product.topNotes.forEach(note => {
        const cleanKey = Object.keys(KNOWLEDGE_GRAPH).find(k => note.includes(k));
        if (cleanKey && KNOWLEDGE_GRAPH[cleanKey]) {
          topNoteHarmonies[cleanKey] = KNOWLEDGE_GRAPH[cleanKey];
        }
      });

      return {
        ...product,
        vectorScore: Number(vectorScore.toFixed(3)),
        hybridScore: Number(hybridScore.toFixed(3)),
        passesFilters,
        topNoteHarmonies
      };
    });

    // Filter out items that failed hard criteria, then sort by hybrid score descending
    const filtered = scoredProducts
      .filter(p => p.passesFilters && p.hybridScore > 0.2)
      .sort((a, b) => b.hybridScore - a.hybridScore);

    return {
      queryVector,
      retrieved: filtered.slice(0, 3), // Top 3 recommendations
      allMatches: scoredProducts
    };
  }
}

const ragEngine = new HybridRAGEngine();
module.exports = ragEngine;
