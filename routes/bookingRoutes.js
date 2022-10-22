const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authenticationController');
const router = require('express').Router();

// this endpoints creates a checkout session

router.use(authController.protect);
router
  .route('/checkout-session/:tourId')
  .get(bookingController.getCheckoutSession);

// restricts to admina and lead guide for the folloing route handles
router.use(authController.restrictTo('admin', 'lead-guide'));
router
  .route('/')
  .get(bookingController.getAllBooking)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
