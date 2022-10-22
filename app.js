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

// error handler
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");

const limitter = rateLimit({
  max: 100,
  window: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour",
});
///template engine
app.set("view engine", "pug");
// app.set('views', './views'); dont do this
app.set("views", path.join(__dirname, "views")); //do this
// serving static files
app.use(express.static(path.join(__dirname, "public")));
// GLOBAL MIDDLEWARES
// set security http headers
// app.use(helmet());

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: {
      allowOrigins: ["*"],
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["*"],
        scriptSrc: ["'self'"],
        // scriptSrc: ["* data: 'unsafe-eval' 'unsafe-inline' blob:"],
      },
    },
  })
);
// development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
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
