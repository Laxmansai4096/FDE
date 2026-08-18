/**
 * AURA PERFUMERY - Indian Luxury Fragrance Catalog & Knowledge Graph (server/db.js)
 * 
 * Featuring iconic Indian luxury scents:
 * 1. Royal Oud & Mysore Sandalwood (Assam Oud & Mysore Sandalwood)
 * 2. Solar Malabar Citrus & Vetiver (Malabar Lemon & Coastal Vetiver)
 * 3. Royal Kashmir Saffron & Amber (Kashmir Saffron & Madagascar Vanilla)
 * 4. Imperial Kannauj Rose & Suede (Kannauj Damask Rose & Velvety Suede)
 * 5. Monsoon Vetiver & Rain Mint (Earthy Indian Khus Vetiver & Rain Accord)
 * 6. Smoked Cardamom & Incense (Kerala Black Cardamom & Smoked Incense)
 */

// 6D Accord Dimensions: [Citrus, Woody, Floral, Oriental, Gourmand, Fresh]
const FRAGRANCE_CATALOG = [
  {
    id: "perfume_001",
    name: "Royal Oud & Mysore Sandalwood",
    tagline: "Assam Oud & Sacred Mysore Sandalwood",
    family: "Royal Woody Oriental",
    price: 245,
    inRupees: "₹18,500",
    sizes: ["50ml", "100ml"],
    inStock: true,
    stockCount: 41,
    rating: 4.9,
    topNotes: ["Assam Oud", "Kashmir Cardamom", "Smoked Incense"],
    heartNotes: ["Sacred Mysore Sandalwood", "Tuscan Leather", "Cedar"],
    baseNotes: ["Golden Amber", "Birch Tar", "Cashmere Musk"],
    season: ["Autumn", "Winter"],
    occasion: ["Royal Gala", "Evening", "Formal Signature"],
    longevity: "12+ hours (Parfum Concentré)",
    description: "An opulent royal blend of aged Assam oud wood grounded by creamy Mysore sandalwood, smoky leather, and warm golden amber.",
    scentVector: [0.1, 0.95, 0.1, 0.8, 0.2, 0.1]
  },
  {
    id: "perfume_002",
    name: "Solar Malabar Citrus & Vetiver",
    tagline: "Malabar Lemon Zest & Sunlit Ocean Mist",
    family: "Citrus Fresh",
    price: 195,
    inRupees: "₹14,500",
    sizes: ["50ml", "100ml"],
    inStock: true,
    stockCount: 88,
    rating: 4.8,
    topNotes: ["Malabar Lemon Zest", "Calabrian Bergamot", "Pink Pepper"],
    heartNotes: ["Neroli", "Solar Orange Blossom", "Coastal Salt"],
    baseNotes: ["White Musk", "Coastal Vetiver", "Ambroxan"],
    season: ["Spring", "Summer"],
    occasion: ["Daywear", "Casual Luxury", "Vacation"],
    longevity: "6-8 hours (Eau de Parfum)",
    description: "An invigorating splash of Malabar coast lemon and sparkling bergamot dancing on ocean salt spray and white musk.",
    scentVector: [0.95, 0.3, 0.4, 0.1, 0.1, 0.9]
  },
  {
    id: "perfume_003",
    name: "Royal Kashmir Saffron & Amber",
    tagline: "Kashmir Saffron & Warm Bourbon Vanilla",
    family: "Gourmand Oriental",
    price: 280,
    inRupees: "₹21,000",
    sizes: ["100ml"],
    inStock: true,
    stockCount: 16,
    rating: 4.95,
    topNotes: ["Kashmir Saffron", "Kerala Cinnamon", "Blood Orange"],
    heartNotes: ["Bourbon Vanilla", "Orris Butter", "Benzoin"],
    baseNotes: ["Tonka Bean", "Resinous Amber", "Mysore Sandalwood"],
    season: ["Autumn", "Winter"],
    occasion: ["Romantic", "Festive", "Evening"],
    longevity: "12+ hours (Extrait de Parfum)",
    description: "A rich blanket of hand-harvested Kashmir saffron threads infused with bourbon vanilla, warm cinnamon, and amber resin.",
    scentVector: [0.1, 0.4, 0.2, 0.9, 0.95, 0.05]
  },
  {
    id: "perfume_004",
    name: "Imperial Kannauj Rose & Suede",
    tagline: "Kannauj Damask Rose & Velvety Suede",
    family: "Floral Luxury",
    price: 260,
    inRupees: "₹19,500",
    sizes: ["50ml", "100ml"],
    inStock: true,
    stockCount: 30,
    rating: 4.7,
    topNotes: ["Kannauj Rose", "Lychee", "Mandarin"],
    heartNotes: ["Damask Rose Absolute", "Peony", "Iris"],
    baseNotes: ["White Suede", "Patchouli Leaf", "Vanilla Musk"],
    season: ["Spring", "Autumn"],
    occasion: ["Formal", "Bridal", "Signature Daywear"],
    longevity: "8-10 hours (Eau de Parfum)",
    description: "The crown jewel of Indian floral perfumery. Pure Kannauj Damask rose petals grounded by velvety suede and iris.",
    scentVector: [0.3, 0.2, 0.98, 0.4, 0.25, 0.3]
  },
  {
    id: "perfume_005",
    name: "Monsoon Vetiver & Rain Mint",
    tagline: "Earthy Indian Khus Vetiver & Petrichor Rain",
    family: "Fresh Earthy",
    price: 210,
    inRupees: "₹16,000",
    sizes: ["50ml", "100ml"],
    inStock: true,
    stockCount: 52,
    rating: 4.85,
    topNotes: ["Earthy Khus Vetiver", "Wild Mint", "Green Cardamom"],
    heartNotes: ["Petrichor Rain Accord", "Geranium", "Cedarwood"],
    baseNotes: ["Haitian Vetiver", "Oakmoss", "Clear Amber"],
    season: ["Monsoon", "Summer"],
    occasion: ["Daily Wear", "Outdoor", "Wellness"],
    longevity: "8-10 hours (Eau de Parfum)",
    description: "Captures the intoxicating aroma of first rain falling on parched earth (Petrichor), layered with earthy Khus vetiver and crisp mint.",
    scentVector: [0.4, 0.8, 0.2, 0.3, 0.1, 0.95]
  },
  {
    id: "perfume_006",
    name: "Smoked Cardamom & Incense",
    tagline: "Kerala Black Cardamom & Temple Incense",
    family: "Spicy Amber",
    price: 295,
    inRupees: "₹22,500",
    sizes: ["50ml", "100ml"],
    inStock: true,
    stockCount: 22,
    rating: 4.9,
    topNotes: ["Kerala Black Cardamom", "Smoked Incense", "Nutmeg"],
    heartNotes: ["Smoky Birch Tar", "Guaiacwood", "Nag Champa Accord"],
    baseNotes: ["Dark Amber", "Labdanum", "Sandalwood"],
    season: ["Winter", "Autumn"],
    occasion: ["Meditation", "Evening", "Niche Luxury"],
    longevity: "10-12 hours (Parfum)",
    description: "A mysterious blend of crushed Kerala black cardamom pods, sacred temple incense, and smoky birch tar.",
    scentVector: [0.05, 0.7, 0.1, 0.9, 0.3, 0.2]
  }
];

function findMatchingProduct(query) {
  if (!query) return null;
  const lower = String(query).toLowerCase().trim();

  // 1. Check exact ID match or full product name match
  for (const p of FRAGRANCE_CATALOG) {
    const pName = p.name.toLowerCase();
    if (p.id === query || lower === pName || lower.includes(pName)) {
      return p;
    }
  }

  // 2. Token overlap scoring to find highest matching catalog item
  const queryTokens = lower.split(/[^a-z0-9]+/);
  let bestMatch = null;
  let highestScore = 0;

  for (const p of FRAGRANCE_CATALOG) {
    const pName = p.name.toLowerCase();
    const pTokens = pName.split(/[^a-z0-9]+/);
    let score = 0;

    for (const t of queryTokens) {
      if (t.length < 3) continue;
      if (pName.includes(t)) {
        score += 5;
        if (pTokens.includes(t)) score += 5;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = p;
    }
  }

  return highestScore > 0 ? bestMatch : null;
}

function textToScentVector(text) {
  const lower = String(text).toLowerCase();
  let citrus = 0.1, woody = 0.1, floral = 0.1, oriental = 0.1, gourmand = 0.1, fresh = 0.1;

  if (lower.includes("lemon") || lower.includes("citrus") || lower.includes("bergamot") || lower.includes("orange")) citrus += 0.8;
  if (lower.includes("sandalwood") || lower.includes("oud") || lower.includes("cedar") || lower.includes("woody")) woody += 0.8;
  if (lower.includes("rose") || lower.includes("jasmine") || lower.includes("floral") || lower.includes("peony")) floral += 0.8;
  if (lower.includes("amber") || lower.includes("incense") || lower.includes("spicy") || lower.includes("cardamom")) oriental += 0.8;
  if (lower.includes("vanilla") || lower.includes("saffron") || lower.includes("sweet") || lower.includes("gourmand")) gourmand += 0.8;
  if (lower.includes("mint") || lower.includes("rain") || lower.includes("vetiver") || lower.includes("fresh") || lower.includes("khus")) fresh += 0.8;

  const vec = [citrus, woody, floral, oriental, gourmand, fresh];
  const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return vec.map(v => Number((v / mag).toFixed(3)));
}

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return Number((dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))).toFixed(4));
}

const KNOWLEDGE_GRAPH = {
  accords: {
    "Sandalwood": { pairsWith: ["Oud", "Cardamom", "Amber", "Rose"], family: "Woody" },
    "Oud": { pairsWith: ["Sandalwood", "Amber", "Rose", "Saffron"], family: "Oriental" },
    "Rose": { pairsWith: ["Saffron", "Suede", "Sandalwood", "Patchouli"], family: "Floral" },
    "Vetiver": { pairsWith: ["Lemon", "Bergamot", "Mint", "Cedar"], family: "Fresh" },
    "Saffron": { pairsWith: ["Amber", "Vanilla", "Rose", "Oud"], family: "Spicy" }
  }
};

module.exports = {
  FRAGRANCE_CATALOG,
  KNOWLEDGE_GRAPH,
  findMatchingProduct,
  textToScentVector,
  cosineSimilarity
};
