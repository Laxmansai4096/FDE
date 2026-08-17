/**
 * AURA PERFUMERY - Indian Luxury Fragrance Catalog & Knowledge Graph (server/db.js)
 * 
 * Featuring iconic Indian luxury scents:
 * 1. Royal Oud & Mysore Sandalwood (Assam Oud & Mysore Sandalwood)
 * 2. Solar Malabar Citrus & Vetiver (Malabar Lemon & Coastal Vetiver)
 * 3. Royal Kashmir Saffron & Amber (Kashmir Saffron & Madagascar Vanilla)
 * 4. Imperial Kannauj Rose & Suede (Kannauj Damask Rose & Velvety Suede)
 * 5. Monsoon Vetiver & Mint (Earthy Indian Khus Vetiver & Rain Accord)
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
    inStock: false,
    stockCount: 0,
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
    sizes: ["100ml"],
    inStock: true,
    stockCount: 22,
    rating: 4.92,
    topNotes: ["Kerala Black Cardamom", "Black Pepper", "Kashmir Saffron"],
    heartNotes: ["Temple Incense", "Clove", "Plum Bark"],
    baseNotes: ["Birch Tar", "Labdanum", "Tobacco Leaf"],
    season: ["Winter"],
    occasion: ["Formal Gala", "Intimate Evening"],
    longevity: "12+ hours (Extrait de Parfum)",
    description: "A mysterious journey through dark cardamom spice, smoldering temple incense, rich leather, and dark tobacco leaf.",
    scentVector: [0.15, 0.85, 0.1, 0.95, 0.4, 0.1]
  }
];

// Knowledge Graph: Scent Pairings & Harmonies
const KNOWLEDGE_GRAPH = {
  "Oud": { family: "Woody", pairsWith: ["Sandalwood", "Rose", "Amber", "Cardamom"], mood: "Regal, Grounding" },
  "Sandalwood": { family: "Woody", pairsWith: ["Oud", "Vanilla", "Vetiver", "Rose"], mood: "Calming, Sacred" },
  "Saffron": { family: "Oriental", pairsWith: ["Vanilla", "Amber", "Oud", "Rose"], mood: "Opulent, Warm" },
  "Rose": { family: "Floral", pairsWith: ["Sandalwood", "Suede", "Patchouli", "Musk"], mood: "Romantic, Regulating" },
  "Lemon": { family: "Citrus", pairsWith: ["Vetiver", "Bergamot", "Neroli", "Amber"], mood: "Uplifting, Bright" },
  "Vetiver": { family: "Earthy", pairsWith: ["Mint", "Lemon", "Cedarwood", "Cardamom"], mood: "Grounding, Fresh" }
};

// Convert natural text to 6D Accord Vector
function textToScentVector(text) {
  const lower = text.toLowerCase();
  const vec = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1];

  if (lower.includes("citrus") || lower.includes("lemon") || lower.includes("bergamot") || lower.includes("orange")) vec[0] += 0.7;
  if (lower.includes("woody") || lower.includes("wood") || lower.includes("cedar") || lower.includes("oud") || lower.includes("sandalwood")) vec[1] += 0.7;
  if (lower.includes("floral") || lower.includes("rose") || lower.includes("jasmine") || lower.includes("violet") || lower.includes("peony")) vec[2] += 0.7;
  if (lower.includes("oriental") || lower.includes("amber") || lower.includes("spicy") || lower.includes("incense") || lower.includes("saffron") || lower.includes("cardamom")) vec[3] += 0.7;
  if (lower.includes("gourmand") || lower.includes("sweet") || lower.includes("vanilla") || lower.includes("tonka") || lower.includes("cinnamon")) vec[4] += 0.7;
  if (lower.includes("fresh") || lower.includes("aquatic") || lower.includes("ocean") || lower.includes("clean") || lower.includes("mint") || lower.includes("rain") || lower.includes("khus")) vec[5] += 0.7;

  const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return vec.map(v => Number((v / mag).toFixed(3)));
}

// Cosine Similarity between two 6D Vectors
function cosineSimilarity(vecA, vecB) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

module.exports = {
  FRAGRANCE_CATALOG,
  KNOWLEDGE_GRAPH,
  textToScentVector,
  cosineSimilarity
};
