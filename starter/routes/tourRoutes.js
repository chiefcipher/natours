const tourController = require('./../controllers/tourController');
const authController = require('../controllers/authenticationController');
const express = require('express');
// const reviewController = require('../controllers/reviewController');
const reviewRouter = require('../routes/reviewRoutes');
const router = express.Router();

//PARAM MIDLEWARE
// router.param('id', tourController.checkID);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );
// restrictTo returns a callback function (req,res,next)

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

// geospacial routes
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

/* 
    you can also do the above with query string 
    like router.route('/tours-within?distacne=22929&center=777&...)
  */

// calculating distances
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

// nested route for reviews
// POST /tour/fbfbffbf/reviews
// GET /tour/fbfbffbf/reviews
// GET /tour/fbfbffbf/reviews/ddjdjd

// router.route(
//   '/:tourId/reviews').post(
//   authController.protect,
//   authController.restrictTo('user'),
//   reviewController.createReview
// );

router.use('/:tourId/reviews', reviewRouter);

module.exports = router;
