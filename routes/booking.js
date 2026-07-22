const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/booking.js");

router.get("/", isLoggedIn, wrapAsync(bookingController.index));
router.post("/listings/:id/book", isLoggedIn, wrapAsync(bookingController.createBooking));
router.delete("/bookings/:id", isLoggedIn, wrapAsync(bookingController.cancelBooking));

module.exports = router;
