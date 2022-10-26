const Tour = require("../models/tourModel");
const Booking = require("../models/bookingsModel");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("../controllers/handlerFactory");
const AppError = require("../utils/appError");
// require stripe and pass in secret key
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1. get currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  // install stripe to create
  // creating checkout session
  // 2. create chekout session

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    // THIS SUCCESS URL STYLE IS NOT SECURED CZ ANY USER CAN VISIT IT AND MAKE PAYMENTS
    //redirect home url on sucess this mettod has a bug
    // success_url: `${req.protocol}://${req.get('host')}?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get("host")}/my-tours`,
    cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`, //go back to current tour on cancel
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    mode: "payment",

    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: tour.price * 100,

          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            // images here must be hosted but it works on the server as it is locally thats why we can do tour.imageCOver
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
  });
  // 3. send session as response
  // for testing you can use postman but dont allow it eventually
  res.status(200).json({
    status: "success",
    session,
  });
});
// // creates booking on successful payment commented out cz its a test
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // thhis is only temporary because it is unsecure anyone can make bookings without paying
//   const { tour, user, price } = req.query;
//   if (!tour || !user || !price) return next();
//   await Booking.create({ tour, user, price });
//   res.redirect(req.originalUrl.split('?')[0]);
// });

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

const createBookingCheckout = async (sessionData) => {
  const tour = sessionData.client_reference_id;
  const user = (
    await User.findOne({
      email: sessionData.customer_email,
    })
  ).id;
  // find and convert price to usd from cent
  const price = sessionData.line_items[0].price_data.unit_amount / 100;
  await Booking.create({
    tour,
    user,
    price,
  });
};

// after success booking this enpoint gets hit by stripe
exports.webhookCheckout = (req, res, next) => {
  //reads stripe signature
  const signature = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.construct(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  // testing if event type matches that on our dashboard
  if (event.type === "checkout.session.complete") {
    // event.data.object is same as session created earlier
    createBookingCheckout(event.data.object);
    res.status(200).json({
      received: true,
    });
  }
};
