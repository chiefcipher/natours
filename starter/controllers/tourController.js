const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory');
const AppError = require('../utils/appError');
const multer = require('multer');
const sharp = require('sharp');
// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(404).json({
//       status: 'failed',
//       data: {
//         message: 'invalid parameters',
//       },
//     });
//   }
//   next();
// };

const multerStorage = multer.memoryStorage();
// multer filter  for img file
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! please upload only image', 400), false);
  }
};
//multer configure
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// we have upload.single('FIELDNAME')
// we have upload.array('FIELDNAME', MAX COUNT)
// we have upload.fields([{name : 'FIELDNAME', maxCount : MAX OCCURRENCE}], MAX COUNT)
// .array and .fileds are on req.files in next middleware
// .single is on req.file in the nedxt middleware
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  {
    name: 'images',
    maxCount: 3,
  },
]);

//middle ware to process images
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();
  // 1. cover image

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2. other images in a loop
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename); //store file name to body
    })
  );
  next();
});
exports.aliasTopTours = (req, res, next) => {
  (req.query.limit = '5'),
    (req.query.sort = '-ratingAverage,price'),
    (req.query.fields = 'name, price , summary , difficulty , ratingAverage');
  next();
};

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, {
  path: 'reviews',
});

exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        // _id: '$ratingAverage',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
    {
      $match: {
        _id: { $ne: 'EASY' },
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; //2022
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: {
          $month: '$startDates',
        },
        // numRatings: { $sum: '$ratingsQuantity' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: plan.length,
    data: {
      plan,
    },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  // below is the route from tourRoutes
  // .route('/tours-within/:distance/center/:latlng/unit/:unit')
  // tours-within/233/center/23,44/unit/mi
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format, lat,lng',
        400
      )
    );
  }
  // radian is radius of earth (miles = 3963.2) (km = 6378.1)
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  // startLocation is on tourModel, ensure your index the startLocation field
  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius],
      },
    },
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

//router.route("/distances/:latlng/unit/:unit").get( tourController.getDistances )
///
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format, lat,lng',
        400
      )
    );
  }

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  /* 
    geoNear is the only geospacial aggreegation pipeloine that exists 
    it also needs to be in the first stage 
    at least one of the fields must contain a geopacial index 
    eg startLocation

  */
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1], // times one to convert to number
        },
        distanceField: 'distance', //add a fields called distance with value in meters
        distanceMultiplier: multiplier, //convert meter to km
      },
    },
    {
      $project: {
        //use $project to select field you want to keep
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: distances.length,
    data: {
      data: distances,
    },
  });
});
