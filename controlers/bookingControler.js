const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Tour = require('./../models/tourModel');

exports.getCheckoutSection = catchAsync(async (req, res, next) => {
  // 1)Get the current Tour
  const { tourID } = req.params;

  const tour = await Tour.findById(tourID);
  if (!tour) {
    return next(new AppError('', 400));
  }
  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: req.user.email,
    client_reference_id: tourID,
    line_items: [
      {
        price_data: {
          currency: 'inr',
          product_data: {
            name: `${tour.name} Tour`
          },
          unit_amount: tour.price * 100
        },
        quantity: 1
      }
    ],
    mode: 'payment',
    // {{URL}}api/v1/tours
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session
  });
});
