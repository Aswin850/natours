// 2 Route handlers
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { deleteOne, updateOne, getOne, getAll } = require('./handlerFactory');

//Multer-Storage -Here the file gets stored in the destination location
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     // user-UserId-timeStamp-fileextention
//     cb(null, `user-${req.user._id}-${Date.now()}.${ext}`);
//   }
// });
// Here the file gets stored in the memory
const multerStorage = multer.memoryStorage();
// Multer-Filter
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only image.', 400), false);
  }
};
// multer uploade
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

// Image procesing
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});
//
exports.uploadUserPhoto = upload.single('photo');

const filterObj = (object, ...allowedFields) => {
  const newObj = {};
  Object.keys(object).forEach(currentField => {
    if (allowedFields.includes(currentField)) {
      newObj[currentField] = object[currentField];
    }
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) create error if the user try's  update password
  if (req.body.password || req.body.passwordConfim)
    return next(
      new AppError(
        'This route is not for password update pleace use /updateMyPassword',
        400
      )
    );
  // 2) uFiltering unwanted fileds
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }
  // 3) Updating the DB
  const user = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: 'succes',
    data: null
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.getAllUsers = getAll(User);
exports.getUser = getOne(User);
exports.updateUser = updateOne(User);
exports.deleteUser = deleteOne(User);
