const express = require('express');

const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  aliasToptours,
  getTourStats,
  getMonthlyPlan,
  getTourWithin,
  getDistances,
  uploadTourPhoto,
  resizeTourPhoto
} = require('./../controlers/tourControler');
const { protect, restricTo } = require('../controlers/authenticationUser');
const reviewRouter = require('./../routes/reviewRoutes');

// 3 Router
const router = express.Router();

router.route('/monthly-Plan:year').get(getMonthlyPlan);
router.route('/tour-stats').get(getTourStats);
router
  .route('/top-5-cheap')
  .get(
    protect,
    restricTo('admin', 'lead-guid', 'guide'),
    aliasToptours,
    getAllTours
  );

//127.0.0.1:3000/api/v1/tour/tours-within/35/center/-116.214531,51.417611/unit/km
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getTourWithin);
//127.0.0.1:3000/api/v1/tour/distances/:latlng/unit/:unit
// 127.0.0.1:3000/api/v1/tour/distances/545.1554,41.2545/unit/mi
router.route('/distances/:latlng/unit/:unit').get(getDistances);
router
  .route('/')
  .get(getAllTours)
  .post(protect, restricTo('admin', 'lead-guid'), createTour);

router
  .route('/:id')
  .get(getTour)
  .patch(
    protect,
    restricTo('admin', 'lead-guid'),
    uploadTourPhoto,
    resizeTourPhoto,
    updateTour
  )
  .delete(protect, restricTo('admin', 'lead-guid'), deleteTour);

// When ever we hit /:tourId/reviews url it will get redirected to reviewRouter
router.use('/:tourId/reviews', reviewRouter);

module.exports = router;
