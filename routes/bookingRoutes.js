const express = require('express');
const { protect } = require('../controlers/authenticationUser');
const { getCheckoutSection } = require('../controlers/bookingControler');

//
const router = express.Router();

router.get('/checkout-session/:tourID', protect, getCheckoutSection);

//
module.exports = router;
