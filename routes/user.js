const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/user.js");

router
  .route("/signup")
  .get(userController.renderSignupForm)
  .post(wrapAsync(userController.signup));

router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    userController.login
  );

const { isLoggedIn } = require("../middleware.js");

router.get("/logout", userController.logout);

router.get("/wishlist", isLoggedIn, wrapAsync(userController.renderWishlist));
router.post("/wishlist/toggle", isLoggedIn, wrapAsync(userController.toggleWishlist));

module.exports = router;
