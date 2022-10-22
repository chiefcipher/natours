const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authenticationController');
const router = require('express').Router({
  mergeParams: true,
});

// POST /tour/fbfbffbf/reviews
// GET /tour/fbfbffbf/reviews
// GET /tour/fbfbffbf/reviews/ddjdjd
router.use(authController.protect);
router
  .route('/')
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  )
  .get(reviewController.getAllReviews);
router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
