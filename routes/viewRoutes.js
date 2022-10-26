const express = require("express");
const router = express.Router();
const authController = require("../controllers/authenticationController");
const viewsController = require("../controllers/viewsController");
const bookingController = require("../controllers/bookingController");
// router.get('/', (req, res) => {
//   // base is same of pug template
//   // tour and user are data we pass as locals to pug template
//   res.status(200).render('base', {
//     tour: 'The FOrest Hiker ',
//     user: 'Samuel',
//   });
// });

// middle ware that runs and add res.locals 
// res.locals is available in out templetes 
router.use(viewsController.alerts)
router.get(
  "/",
  authController.isLoggedIn,
  viewsController.getOverview
);
router.get("/me", authController.protect, viewsController.getAccount);
router.get("/tour", authController.isLoggedIn, viewsController.getTour);
router.get("/tour/:slug", authController.isLoggedIn, viewsController.getTour);
router.get("/login", authController.isLoggedIn, viewsController.getLoginForm);
router.get(
  "/my-tours",
  // bookingController.createBookingCheckout
  authController.protect,
  viewsController.getMyTours
);
router.post(
  "/submit-user-data",
  authController.protect,
  viewsController.updateUserData
);

module.exports = router;
