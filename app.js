if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const mongoStoreModule = require("connect-mongo");
const MongoStore = mongoStoreModule.default || mongoStoreModule;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const bookingRouter = require("./routes/booking.js");

const ATLASDB_URL = process.env.ATLASDB_URL;
const LOCAL_URL = "mongodb://127.0.0.1:27017/wanderlust";

async function connectToDatabase() {
  if (ATLASDB_URL) {
    try {
      const conn = await mongoose.connect(ATLASDB_URL, { serverSelectionTimeoutMS: 4000 });
      console.log("Connected to MongoDB Atlas DB");
      return conn.connection.getClient();
    } catch (err) {
      console.log("MongoDB Atlas Connection Failed:", err.message);
      console.log("Falling back to local MongoDB...");
    }
  }

  try {
    const conn = await mongoose.connect(LOCAL_URL, { serverSelectionTimeoutMS: 4000 });
    console.log("Connected to Local MongoDB (mongodb://127.0.0.1:27017/wanderlust)");
    return conn.connection.getClient();
  } catch (err) {
    console.log("Local MongoDB Connection Failed:", err.message);
    throw err;
  }
}

const dbClientPromise = connectToDatabase();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
  clientPromise: dbClientPromise,
  crypto: {
    secret: process.env.SECRET || "wanderlustsecret",
  },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET || "wanderlustsecret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

// app.get("/", (req, res) => {
//   res.send("Working");
// });

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// app.get("/demouser", async (req, res) => {
//   let fakeUser = new User({
//     email: "student@gmail.com",
//     username: "Kuldeep",
//   });
//   let registeredUser = await User.register(fakeUser, "Kuldeep");
//   res.send(registeredUser);
// });

const aiRouter = require("./routes/ai.js");

app.get("/", (req, res) => {
  res.redirect("/listings");
});

app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", bookingRouter);
app.use("/", userRouter);
app.use("/", aiRouter);

app.use((req, res, next) => {
  next(new ExpressError(404, "Page not found"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("error.ejs", { message, err });
});

app.listen(8080, () => {
  console.log("App is listening at port 8080");
});
