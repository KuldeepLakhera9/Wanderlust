const User = require("../models/user");

module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.signup = async (req, res) => {
  try {
    let { username, email, password } = req.body;
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome to Wanderlust!");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
  req.flash("success", "Welcome back to Wanderlust!");
  let redirectUrl = res.locals.redirectUrl || "/listings";
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "You are Logged Out!");
    res.redirect("/listings");
  });
};

module.exports.renderWishlist = async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist");
  res.render("users/wishlist.ejs", { wishlist: user.wishlist || [] });
};

module.exports.renderDashboard = async (req, res) => {
  const Booking = require("../models/booking");
  const Listing = require("../models/listing");

  const myListings = await Listing.find({ owner: req.user._id });
  const listingIds = myListings.map((l) => l._id);

  const hostBookings = await Booking.find({ listing: { $in: listingIds } })
    .populate("listing")
    .populate("user")
    .sort({ createdAt: -1 });

  const totalRevenue = hostBookings
    .filter((b) => b.status === "Confirmed")
    .reduce((acc, b) => acc + (b.totalPrice || 0), 0);

  res.render("users/dashboard.ejs", {
    myListings,
    hostBookings,
    totalRevenue,
    totalStays: myListings.length,
    totalBookings: hostBookings.length,
  });
};

module.exports.toggleWishlist = async (req, res) => {
  const { listingId } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(401).json({ error: "Please log in to save stays" });
  }

  const index = user.wishlist.indexOf(listingId);
  let saved = false;

  if (index > -1) {
    user.wishlist.splice(index, 1);
    saved = false;
  } else {
    user.wishlist.push(listingId);
    saved = true;
  }

  await user.save();
  res.json({ saved, message: saved ? "Added to Wishlist" : "Removed from Wishlist" });
};
