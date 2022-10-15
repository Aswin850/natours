const express = require('express');
const { isLoggedIn, protect } = require('../controlers/authenticationUser');
const {
  getOverview,
  getTour,
  getLoginForm,
  getMe
} = require('../controlers/viewsControler');

const router = express.Router();

//
router.use(isLoggedIn);
router.get('/', getOverview);
router.get('/tour/:slug', protect, getTour);
router.use('/login', getLoginForm);
router.use('/me', protect, getMe);

//
module.exports = router;
