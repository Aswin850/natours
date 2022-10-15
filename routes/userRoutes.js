const express = require('express');

const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto
} = require('./../controlers/userControler');

const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restricTo,
  logout
} = require('./../controlers/authenticationUser');

// 3 Router
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);
// router.route('/signup').post(signup);
router.get('/me', protect, getMe, getUser);

// since execution of middle takes synchronously from top to bottom we can add a middle to protect all the middleware after this
router.use(protect);
router.get('/logout', logout);
router.patch('/updateMyPassword', updatePassword);
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);
router.delete('/deleteMe', deleteMe);

router.use(restricTo('admin'));
router.route('/').get(getAllUsers);
router
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);
// protect, restricTo('admin'),

//
module.exports = router;
