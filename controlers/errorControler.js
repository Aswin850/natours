/* eslint-disable no-unused-vars */
const AppError = require('../utils/appError');

const handleCastErrorDB = function(err) {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = function(err) {
  const message = `Duplicate field value: ${err.keyValue.name}. Plaase use another value`;
  return new AppError(message, 404);
};
const handleValadationError = function(err) {
  const errors = Object.values(err.errors).map(cur => cur.message.trim());
  const message = `Invalid input data, ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = function() {
  return new AppError('Ivalid token. Please log in again!', 401);
};

const handleJWTExpiredError = function() {
  return new AppError('Sorry your token have expired Please log in!', 401);
};

const sendErrorDev = (req, err, res) => {
  // API here we send an Json responce
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Rendred message here we render the responce
    res.status(err.statusCode).render('error', {
      title: 'Something wend wrong!',
      msg: err.message
    });
  }
};
const sendErrorProd = (req, err, res) => {
  // API here we send an Json responce
  if (req.originalUrl.startsWith('/api')) {
    // Operational Error
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // Programing Error
    else {
      // 1) log error
      // eslint-disable-next-line no-console
      console.error('Error 💥', err);
      // 2) Send generic message to clint
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong'
      });
    }
  }
  // Rendred message here we render the responce
  if (err.isOperational) {
    console.log(err);
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error('ERROR 💥', err);
  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.'
  });
};

// global Error handler
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(req, err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    if (err.name === 'CastError') {
      error = handleCastErrorDB(error);
    } else if (err.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    } else if (err.name === 'ValidationError') {
      error = handleValadationError(error);
    } else if (err.name === 'JsonWebTokenError') {
      error = handleJWTError();
    } else if (err.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }
    // sendErrorDev(err, res);
    sendErrorProd(req, error, res);
  }
};
