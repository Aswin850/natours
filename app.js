const path = require('path');
const express = require('express');
const morgon = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controlers/errorControler');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

// Starting express app
const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
// 1) Global Middleware
// serving static file
app.use(express.static(path.join(__dirname, 'public')));

// set Security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgon('dev'));
}

// Limiting the request from an IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'To many request from this IP, Place try again in an hour'
});

app.use('/api', limiter);

// Body parser, reading data from request body
app.use(express.json({ limit: '10kb' }));
//To prase the data coming from URL(form submition)
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// cookie parser
app.use(cookieParser());

// Data sanitization aginst NoSQL query injecton
app.use(mongoSanitize());

// Data sanitization aginst xss
app.use(xss());

// prevents parameter pollition
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// Middleware(our-own)
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies.jwt);
  next();
});

// 3 Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  const err = new AppError(
    `Can't find ${req.originalUrl} on this server!`,
    404
  );
  next(err);
});

app.use(globalErrorHandler);

module.exports = app;
