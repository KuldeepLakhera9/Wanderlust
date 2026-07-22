const Listing = require("../models/listing");

module.exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const queryLower = message.toLowerCase();

    // 1. Extract potential price limits from message (e.g. "under 5000" or "below 3000")
    let maxPrice = null;
    const priceMatch = queryLower.match(/(?:under|below|less than|budget of)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
    if (priceMatch && priceMatch[1]) {
      maxPrice = parseInt(priceMatch[1]);
    }

    // 2. Extract category matches
    const categories = ["Trending", "Rooms", "Iconic Cities", "Mountains", "Castles", "Camping", "Farms", "Arctic", "Domes", "Boats", "Pools"];
    let matchedCategory = null;
    for (let cat of categories) {
      if (queryLower.includes(cat.toLowerCase()) || (cat === "Pools" && queryLower.includes("pool"))) {
        matchedCategory = cat;
        break;
      }
    }

    // 3. Build MongoDB search filter
    let filter = {};

    if (matchedCategory) {
      filter.category = matchedCategory;
    }

    if (maxPrice) {
      filter.price = { $lte: maxPrice };
    }

    // Keyword search across location, country, title, description
    const keywords = ["goa", "mumbai", "delhi", "manali", "tuscany", "aspen", "london", "paris", "beach", "mountain", "villa", "cottage", "cabin", "loft"];
    let matchedKeyword = null;
    for (let kw of keywords) {
      if (queryLower.includes(kw)) {
        matchedKeyword = kw;
        break;
      }
    }

    if (matchedKeyword) {
      const searchRegex = new RegExp(matchedKeyword, "i");
      filter.$or = [
        { title: searchRegex },
        { location: searchRegex },
        { country: searchRegex },
        { description: searchRegex },
      ];
    }

    // Query listings from database
    let recommendedListings = await Listing.find(filter).limit(4);

    // Fallback: If strict filter returns no listings, fetch top trending listings
    if (recommendedListings.length === 0) {
      recommendedListings = await Listing.find({}).limit(3);
    }

    // Format AI response
    let responseText = "";
    if (queryLower.includes("itinerary") || queryLower.includes("plan")) {
      responseText = `Here is a custom 3-Day Travel Itinerary for your trip:\n\n` +
        `**Day 1: Arrival & Local Exploration**\nCheck into your stay, enjoy local street food, and relax with sunset views.\n\n` +
        `**Day 2: Adventure & Sightseeing**\nVisit famous landmarks, try local water sports or mountain hikes, and dine at top-rated restaurants.\n\n` +
        `**Day 3: Souvenirs & Departure**\nExplore local artisan markets, grab souvenirs, and check out comfortably.\n\n` +
        `Here are top recommended stays for your trip:`;
    } else {
      responseText = `I found **${recommendedListings.length} wonderful stay${recommendedListings.length > 1 ? 's' : ''}** matching your preferences! Here are my top recommendations:`;
    }

    return res.json({
      reply: responseText,
      listings: recommendedListings.map(l => ({
        id: l._id,
        title: l.title,
        location: l.location,
        country: l.country,
        price: l.price,
        image: l.image ? l.image.url : "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        category: l.category || "Trending",
      })),
    });
  } catch (err) {
    console.error("AI Chat Controller Error:", err);
    return res.status(500).json({ error: "Something went wrong in AI assistant." });
  }
};
