const path = require("path");
const express = require("express");
const morgan = require("morgan");
const app = express();
//compresses our api text(json included) responses
const compression = require("compression");
// sub aps
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const viewRouter = require("./routes/viewRoutes");
const bookingRouter = require("./routes/bookingRoutes");
// controllers
const bookingController = require("./controllers/bookingController");

// error handler
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const limitter = rateLimit({
  max: 100,
  window: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour",
});

// THIS ALLOWS req.sequre and x forwarded proto headers work for heroku check
app.enable("trust proxy");

// this a..use() works for a only simple requests(get & post i.e requets without preflight phase)
// allows for cross origin resource sharing from diff port/subdomain/host
app.use(cors());
// app.options listens to options preflight requests for complex requests (eg delete put patch)
app.options("*", cors());
// app.use('/api/v1/tours', cors()) you can also do this
// api.natours.com and natours.com(frontend)
// we can use the below to allow only the frontend part to make cors
// app.use(cors({
//   origin : 'https://www.natours.com'
// }))
///template engine
app.set("view engine", "pug");
// app.set('views', './views'); dont do this
app.set("views", path.join(__dirname, "views")); //do this
// serving static files
app.use(express.static(path.join(__dirname, "public")));
// GLOBAL MIDDLEWARES
// set security http headers
// app.use(helmet());
app.use(helmet());

// development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
// call this route before calling body parser
// cz body parser changes the body to json which we dont want
app.post(
  "/webhook",
  express.raw({
    type: "application/json",
  }),
  bookingController.webhookCheckout
);

// body parser, reading data from the body into req.body
app.use(
  express.json({
    limit: "10kb",
  })
);
// cookie parser
app.use(cookieParser());
// url form parser
app.use(
  express.urlencoded({
    extended: true,
    limit: "10kb",
  })
);

// test by going to https://www.giftofspeed.com/gzip-test/
//compresses our api text(json included) responses
app.use(compression());
app.set("views", path.join(__dirname, "views")); //do this

// clean data (sanitization) against nosql query injection
app.use(mongoSanitize());
// data sanitization against xss
app.use(xss());

// limit request from same api
app.use("/api", limitter);
// test middle ware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers)
  next();
});
app.use(
  hpp({
    whiteList: [
      "duration",
      "ratingsQuantity",
      "ratingAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

// ROUTES (SUB APPS)
app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

app.all("*", (req, res, next) => {
  // FIRST
  // res.status(404).json({
  //   status: 'failed',
  //   message: `cant find ${req.originalUrl}`,
  // });
  // SECOND
  // next();
  // const err = new Error(`cant find ${req.originalUrl}`) ;
  // err.status = 'fail' ;
  // err.statusCode = 404 ;
  // next(err) ;
  next(new AppError(`cant find ${req.originalUrl}`, 404));
  next(new AppError(`cant find ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
