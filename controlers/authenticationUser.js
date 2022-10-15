const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const Email = require('./../utils/email');

const signToken = function(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};
const cookieOption = {
  expires: new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
  ),
  httpOnly: true
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  if (process.env.NODE_ENV === 'production') {
    cookieOption.secure = true;
  }
  res.cookie('jwt', token, cookieOption);
  // to remove password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async function(req, res, next) {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfim: req.body.passwordConfim,
    passwordChangedAt: req.body.passwordChangedAt || undefined
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();
  createAndSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1)check If email and password is provided in request
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2)check If user exists and password pasword is correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) if everything is ok send token to client
  createAndSendToken(user, 200, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  res.cookie('jwt', 'logedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({
    status: 'success'
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) check the existence of the token in request
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token)
    return next(
      new AppError('You have not logged in! please log in to get access', 401)
    );
  // 2)  validate the token using jwt.verifying
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) check the user existence
  const { id: userId, iat: issuedAt } = decoded;
  const currentUser = await User.findById(userId);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }
  // 4) Check if the user have changed the password after the token was issued
  if (currentUser.changedPasswordAfter(issuedAt)) {
    return next(
      new AppError('User recently changed passwor! Please log in again.', 401)
    );
  }

  // Grand access to protected data
  req.user = currentUser;
  res.locals.user = currentUser;
  // The user details will be added to the request and send to the next middeleware
  next();
});

exports.restricTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1)Get user by email
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }
  // 2) generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) send the reset token to users mail
  try {
    const resetURL = `http://127.0.0.1:3000/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordResetEmail();

    res.status(200).json({
      status: 'success',
      message: 'Token send to email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending email. Try agin later!', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  // 2) If token has not expired and there is user set the new password
  if (!user) {
    return next(new AppError('Token is invalid or expired!', 400));
  }
  user.password = req.body.password;
  user.passwordConfim = req.body.passwordConfim;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3) update changedPasswordAt property for the user
  // // *****Will happen in user model***
  //  4) Log the user in, send JWt
  createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get the user
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return next(new AppError('The user does not exist!', 400));
  }
  // 2) check if the posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Incorrect password!', 400));
  }
  // 3) if so update the password
  user.password = req.body.password;
  user.passwordConfim = req.body.passwordConfim;
  await user.save();
  // 4) log user in, send JWT
  createAndSendToken(user, 200, res);
});

// Only for rendred pages
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};
