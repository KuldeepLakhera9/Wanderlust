const Booking = require("../models/booking");
const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
  const userBookings = await Booking.find({ user: req.user._id })
    .populate({
      path: "listing",
      populate: { path: "owner" },
    })
    .sort({ createdAt: -1 });

  res.render("users/bookings.ejs", { userBookings });
};

module.exports.createBooking = async (req, res) => {
  const { id } = req.params;
  const { checkIn, checkOut, guests } = req.body.booking || {};

  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
    req.flash("error", "Invalid check-in or checkout dates selected.");
    return res.redirect(`/listings/${id}`);
  }

  // Check for date overlap conflicts with existing active bookings
  const overlappingBooking = await Booking.findOne({
    listing: id,
    status: "Confirmed",
    $or: [
      { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }
    ]
  });

  if (overlappingBooking) {
    req.flash("error", "Sorry, this property is already booked for the selected dates!");
    return res.redirect(`/listings/${id}`);
  }

  // Calculate pricing breakdown
  const diffTime = Math.abs(checkOutDate - checkInDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  const baseTotal = listing.price * diffDays;
  const gstTax = Math.round(baseTotal * 0.18);
  const cleaningFee = Math.round(listing.price * 0.1);
  const grandTotal = baseTotal + gstTax + cleaningFee;

  const newBooking = new Booking({
    listing: id,
    user: req.user._id,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests: parseInt(guests) || 1,
    totalPrice: grandTotal,
    status: "Confirmed",
  });

  await newBooking.save();
  req.flash("success", "Reservation confirmed! Your stay has been booked.");
  res.redirect("/bookings");
};

module.exports.cancelBooking = async (req, res) => {
  const { id } = req.params;
  const booking = await Booking.findById(id);

  if (!booking) {
    req.flash("error", "Booking not found!");
    return res.redirect("/bookings");
  }

  if (!booking.user.equals(req.user._id)) {
    req.flash("error", "You do not have permission to cancel this booking.");
    return res.redirect("/bookings");
  }

  booking.status = "Cancelled";
  await booking.save();

  req.flash("success", "Booking reservation cancelled.");
  res.redirect("/bookings");
};
