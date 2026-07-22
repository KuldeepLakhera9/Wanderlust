const Listing = require("../models/listing");

// Location geocoding helper (coordinates mapping for maps)
const getCoordinatesForLocation = (location = "", country = "") => {
  const loc = (location + " " + country).toLowerCase();
  if (loc.includes("goa")) return [73.8567, 15.2993];
  if (loc.includes("mumbai")) return [72.8777, 19.0760];
  if (loc.includes("delhi")) return [77.2090, 28.6139];
  if (loc.includes("jaipur") || loc.includes("rajisthan") || loc.includes("rajasthan")) return [75.7873, 26.9124];
  if (loc.includes("manali") || loc.includes("mountain")) return [77.1887, 32.2432];
  if (loc.includes("kerala")) return [76.2711, 10.8505];
  if (loc.includes("london") || loc.includes("uk")) return [-0.1276, 51.5074];
  if (loc.includes("paris") || loc.includes("france")) return [2.3522, 48.8566];
  if (loc.includes("york") || loc.includes("usa") || loc.includes("us")) return [-74.0060, 40.7128];
  if (loc.includes("tokyo") || loc.includes("japan")) return [139.6917, 35.6895];
  // Default coordinates (New Delhi)
  return [77.2090, 28.6139];
};

module.exports.index = async (req, res) => {
  const { category, q } = req.query;
  let filter = {};

  if (category) {
    filter.category = category;
  }

  if (q) {
    const searchRegex = new RegExp(q.trim(), "i");
    filter.$or = [
      { title: searchRegex },
      { location: searchRegex },
      { country: searchRegex },
      { description: searchRegex },
      { category: searchRegex },
    ];
  }

  const allListings = await Listing.find(filter);
  res.render("listings/index.ejs", {
    allListings,
    selectedCategory: category || "",
    searchQuery: q || "",
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
  let url = req.file ? req.file.path : "https://images.unsplash.com/photo-1507525428034-b723cf961d3e";
  let filename = req.file ? req.file.filename || req.file.path : "default";
  
  const listingData = req.body.Listing;
  if (!listingData.category) listingData.category = "Trending";
  
  const coordinates = getCoordinatesForLocation(listingData.location, listingData.country);
  listingData.geometry = {
    type: "Point",
    coordinates: coordinates,
  };

  const newListing = new Listing(listingData);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  await newListing.save();
  req.flash("success", "New Listing is created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image ? listing.image.url : "";
  if (originalImageUrl) {
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_300,w_250");
  }
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  const listingData = req.body.Listing;
  
  if (listingData.location || listingData.country) {
    const coordinates = getCoordinatesForLocation(listingData.location, listingData.country);
    listingData.geometry = {
      type: "Point",
      coordinates: coordinates,
    };
  }

  let listing = await Listing.findByIdAndUpdate(id, { ...listingData });

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename || req.file.path;

    listing.image = { url, filename };
    await listing.save();
  }
  req.flash("success", "Listing is Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  const deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing is Deleted!");
  res.redirect("/listings");
};
