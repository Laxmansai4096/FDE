/**
 * AURA PERFUMERY - Hybrid Database Engine (Vector DB + Relational Catalog + Scent Knowledge Graph)
 * 
 * FDE Concept: In enterprise AI projects, domain data rarely lives in a single database.
 * FDEs must integrate:
 * 1. Vector Database: Semantic search over scent profiles and olfactory accords.
 * 2. Relational Database: Hard data like stock levels, pricing, bottle SKUs, orders.
 * 3. Knowledge Graph: Scent harmonization matrix (Note -> Pairs With -> Scent Family).
 */

// 6-Dimensional Scent Vector Accord Schema: [Citrus, Woody, Floral, Oriental/Amber, Gourmand, Fresh/Aquatic]

const FRAGRANCE_CATALOG = [
  {
    id: "perfume_001",
    name: "L'Ombre du Bois",
    tagline: "Mysterious Smoked Cedarwood & Golden Amber",
    family: "Woody Oriental",
    price: 245,
    sizes: ["50ml", "100ml"],
    inStock: true,
    stockCount: 42,
    rating: 4.9,
    topNotes: ["Italian Bergamot", "Cardamom"],
    heartNotes: ["Smoked Cedarwood", "Vetiver"],
    baseNotes: ["Golden Amber", "Dark Oud", "Cashmere Wood"],
    season: ["Autumn", "Winter"],
    occasion: ["Evening", "Black Tie", "Special Occasions"],
    longevity: "10-12 hours (Extrait de Parfum)",
    description: "Deep, mysterious woodcraft wrapped in smoldering resinous amber. Designed for commanding presence in cool evening climates.",
    // Vector Representation: [Citrus, Woody, Floral, Oriental, Gourmand, Fresh]
    scentVector: [0.2, 0.95, 0.1, 0.85, 0.3, 0.1]
  },
  {
    id: "perfume_002",
    name: "Citron Céleste",
    tagline: "Solar Calabrian Bergamot & Sunlit Sea Mist",
    family: "Citrus Fresh",
    price: 195,
    sizes: ["50ml", "100ml"],
    inStock: true,
    stockCount: 88,
    rating: 4.8,
    topNotes: ["Calabrian Bergamot", "Sparkling Lemon Zest", "Pink Pepper"],
    heartNotes: ["Neroli", "Solar Orange Blossom", "Sea Salt"],
    baseNotes: ["White Musk", "Driftwood", "Ambroxan"],
    season: ["Spring", "Summer"],
    occasion: ["Daywear", "Casual Luxury", "Vacation"],
    longevity: "6-8 hours (Eau de Parfum)",
    description: "An invigorating splash of Mediterranean citrus dancing on crisp sea spray and warm white amber driftwoods.",
    scentVector: [0.95, 0.3, 0.4, 0.1, 0.1, 0.9]
  },
  {
    id: "perfume_003",
    name: "Velours d'Ambre",
    tagline: "Sensual Bourbon Vanilla & Warm Tonka Accord",
    family: "Gourmand Oriental",
    price: 280,
    sizes: ["100ml"],
    inStock: true,
    stockCount: 15,
    rating: 4.95,
    topNotes: ["Madagascar Cinnamon", "Blood Orange"],
    heartNotes: ["Bourbon Vanilla", "Orris Butter", "Benzoin"],
    baseNotes: ["Tonka Bean", "Resinous Amber", "Sandalwood"],
    season: ["Autumn", "Winter"],
    occasion: ["Romantic", "Evening", "Intimate"],
    longevity: "12+ hours (Parfum Concentré)",
    description: "A velvety blanket of pure Madagascar vanilla infusion kissed by warm cinnamon bark and glowing amber resins.",
    scentVector: [0.1, 0.4, 0.2, 0.9, 0.95, 0.05]
  },
  {
    id: "perfume_004",
    name: "Rose Impériale",
    tagline: "Damask Rose Absolute & Powdery Violet Petals",
    family: "Floral Luxury",
    price: 260,
    sizes: ["50ml", "100ml"],
    inStock: true,
    stockCount: 30,
    rating: 4.7,
    topNotes: ["May Rose", "Lychee", "Mandarin"],
    heartNotes: ["Damask Rose Absolute", "Peony", "Iris"],
    baseNotes: ["White Suede", "Patchouli Leaf", "Vanilla Musk"],
    season: ["Spring", "Autumn"],
    occasion: ["Formal", "Bridal", "Signature Daywear"],
    longevity: "8-10 hours (Eau de Parfum)",
    description: "The crown jewel of floral perfumery. Hand-harvested Damask rose petals grounded by velvety suede and iris.",
    scentVector: [0.3, 0.2, 0.98, 0.4, 0.25, 0.3]
  },
  {
    id: "perfume_005",
    name: "Vétiver Solaire",
    tagline: "Earthy Haitian Vetiver & Fresh Crisp Mint",
    family: "Woody Fresh",
    price: 210,
    sizes: ["50ml", "100ml"],
    inStock: false, // Low stock / out of stock example for inventory logic test
    stockCount: 0,
    rating: 4.65,
    topNotes: ["Spearmint", "Grapefruit", "Basil"],
    heartNotes: ["Haitian Vetiver", "Geranium", "Nutmeg"],
    baseNotes: ["Cedarwood", "Oakmoss", "Clean Musk"],
    season: ["Spring", "Summer", "Autumn"],
    occasion: ["Business", "Office", "Daywear"],
    longevity: "8 hours (Eau de Parfum)",
    description: "Crisp, refined green vetiver balancing zesty mint with grounded cedarwood. Perfectly tailored for professional elegance.",
    scentVector: [0.6, 0.85, 0.2, 0.1, 0.05, 0.75]
  },
  {
    id: "perfume_006",
    name: "Nuit d'Épices",
    tagline: "Smoky Black Pepper & Dark Leather Accord",
    family: "Spicy Amber",
    price: 295,
    sizes: ["100ml"],
    inStock: true,
    stockCount: 19,
    rating: 4.9,
    topNotes: ["Black Pepper", "Saffron", "Incense"],
    heartNotes: ["Tuscan Leather", "Clove", "Plum"],
    baseNotes: ["Birch Tar", "Labdanum", "Tobacco Leaf"],
    season: ["Winter"],
    occasion: ["Night Out", "Statement Scent"],
    longevity: "12+ hours (Extrait de Parfum)",
    description: "An opulent, mysterious journey through dark saffron nights, rich Tuscan leather, and smoldering birch incense.",
    scentVector: [0.1, 0.7, 0.1, 0.95, 0.4, 0.0]
  }
];

// Scent Note Harmonization Knowledge Graph
const KNOWLEDGE_GRAPH = {
  "Bergamot": { family: "Citrus", pairsWith: ["Vetiver", "Cedarwood", "Neroli", "Amber"], mood: "Uplifting, Bright" },
  "Cedarwood": { family: "Woody", pairsWith: ["Bergamot", "Cardamom", "Oud", "Vanilla"], mood: "Grounding, Elegant" },
  "Vanilla": { family: "Gourmand", pairsWith: ["Tonka Bean", "Cinnamon", "Amber", "Sandalwood"], mood: "Comforting, Sensual" },
  "Rose": { family: "Floral", pairsWith: ["Oud", "Patchouli", "Peony", "White Musk"], mood: "Romantic, Regulating" },
  "Vetiver": { family: "Woody Fresh", pairsWith: ["Grapefruit", "Mint", "Cedarwood", "Pepper"], mood: "Sophisticated, Clean" },
  "Amber": { family: "Oriental", pairsWith: ["Vanilla", "Labdanum", "Incense", "Oud"], mood: "Warm, Enveloping" }
};

// Helper: Cosine Similarity calculation for 6D vector space
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Convert user text prompt into estimated Scent Vector [Citrus, Woody, Floral, Oriental, Gourmand, Fresh]
function textToScentVector(text) {
  const query = text.toLowerCase();
  let vec = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1]; // Base baseline

  if (query.includes("citrus") || query.includes("lemon") || query.includes("bergamot") || query.includes("orange") || query.includes("summer") || query.includes("sunny")) {
    vec[0] += 0.8; vec[5] += 0.5;
  }
  if (query.includes("wood") || query.includes("woody") || query.includes("cedar") || query.includes("oud") || query.includes("vetiver") || query.includes("earthy")) {
    vec[1] += 0.85;
  }
  if (query.includes("floral") || query.includes("rose") || query.includes("jasmine") || query.includes("flower") || query.includes("violet") || query.includes("romantic")) {
    vec[2] += 0.85;
  }
  if (query.includes("oriental") || query.includes("amber") || query.includes("spicy") || query.includes("leather") || query.includes("smoky") || query.includes("evening") || query.includes("night")) {
    vec[3] += 0.85;
  }
  if (query.includes("gourmand") || query.includes("vanilla") || query.includes("sweet") || query.includes("tonka") || query.includes("chocolate") || query.includes("cozy") || query.includes("warm")) {
    vec[4] += 0.85; vec[3] += 0.4;
  }
  if (query.includes("fresh") || query.includes("mint") || query.includes("sea") || query.includes("clean") || query.includes("aquatic") || query.includes("daywear")) {
    vec[5] += 0.85; vec[0] += 0.3;
  }

  // Normalize vector values to max 1.0
  const maxVal = Math.max(...vec);
  return vec.map(v => Number((v / maxVal).toFixed(2)));
}

module.exports = {
  FRAGRANCE_CATALOG,
  KNOWLEDGE_GRAPH,
  cosineSimilarity,
  textToScentVector
};
