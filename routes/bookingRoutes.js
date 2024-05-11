const express = require('express');
const authController = require('../controllers/authController');
const bookingController = require('./../controllers/bookingController');

const router = express.Router();

// this route is only for client to getCheckOutSession
// client send the ID of the tour that is currently being booked
router.get(
  '/checkout-session/:tourId',
  authController.protect,
  bookingController.getCheckoutSession
);

module.exports = router;
