const express = require('express');
const { protect, restricTo } = require('../controlers/authenticationUser');
const {
  getAllReviews,
  createReviews,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview
} = require('../controlers/reviewControler');

// by default the parameter of a paticular url will be available only to that route ie it can not acess the parameter of other router by using mergeParams:true its can be acessed
const router = express.Router({ mergeParams: true });

router.use(protect);
router
  .route('/')
  .get(getAllReviews)
  .post(restricTo('user'), setTourUserIds, createReviews);

router
  .route('/:id')
  .get(getReview)
  .delete(restricTo('user', 'admin'), deleteReview)
  .patch(restricTo('user', 'admin'), updateReview);

module.exports = router;
