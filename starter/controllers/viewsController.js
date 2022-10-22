const Tour = require('../models/tourModel');
const Booking = require('../models/bookingsModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
// router.get('/', (req, res) => {
//   // base is same of pug template
//   // tour and user are data we pass as locals to pug template
//   res.status(200).render('base', {
//     tour: 'The FOrest Hiker ',
//     user: 'Samuel',
//   });
// });

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) get tour data from collection
  const tours = await Tour.find();
  // 2 build template

  // 3 render template using the tour data from step 1
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

const CSP = 'Content-Security-Policy';
const POLICY =
  "default-src 'self' https://*.mapbox.com ;" +
  "base-uri 'self';block-all-mixed-content;" +
  "font-src 'self' https: data:;" +
  "frame-ancestors 'self';" +
  "img-src http://localhost:8000 'self' blob: data:;" +
  "object-src 'none';" +
  "script-src https: cdn.jsdelivr.net cdnjs.cloudflare.com api.mapbox.com 'self' blob: ;" +
  "script-src-attr 'none';" +
  "style-src 'self' https: 'unsafe-inline';" +
  'upgrade-insecure-requests;';
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({
    slug: req.params.slug,
  }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });
  if (!tour) {
    return next(new AppError('No tour found with that name', 404));
  }

  res
    .status(200)
    .setHeader(CSP, POLICY)
    .render('tour', {
      title: `${tour.name} Tour`,
      tour,
    });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your accont',
  });
};

exports.getAccount = (req, res) => {
  console.log('enter get acount');
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});

// RENDERS THE BOOKINGS PUG
exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1 fidn all bookings for logged in user
  const bookings = await Booking.find({
    user: req.user.id,
  });

  // 2 find tours with the retured ids
  // we could also do a virtual populate on the tours
  const tourIds = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } });
  res.status(200).render('overview', {
    title: 'My tours',
    tours,
  });
});
