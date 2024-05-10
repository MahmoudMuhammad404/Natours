const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet'); // helmet is a collection of multiple middleware
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingsRoutes');

const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// (1- GLOBAL middlewares

// Serving static files
//app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// Setting Security HTTP Headers (npm i helmet)  'prefering write here in begining'
app.use(helmet());

// Development logging
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  // (morgan):- to get loogger back (GET /api/v1/tours/ 200 23.994 ms - 8933)
}

// to allow 100 requests from the same ip in 1 hour
const limiter = rateLimit({
  max: 100, // num of request
  windowMs: 60 * 60 * 100, // 1 hour in millisecond
  message: 'Too many requests from this IP, please try again in an hour', // (429) :- Too Many Requests
});
app.use('/api', limiter); //  we basically want to apply this limiter only to a slash API, okay?

// used to parse incoming requests (reading data from body) with JSON payloads It is based on the body-parser library.
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // because remember, the way that the form sends data to the server is actually also called URL encoded
app.use(cookieParser()); // parsing data from cookies

// data sanitization against NOSQL query injection (npm i express-mongo-sanitize)
app.use(mongoSanitize());

// data sanitization against XSS (npm i xss-clean)
app.use(xss()); // This will then clean any user input from malicious HTML code, basically.

// preventing parameter pollution (npm i hpp ) hpp:- http parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// 3- Routes
app.use('/', viewRouter);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// 'Handling unhandled routes'
// all() :- means all http methods (getALL,getone,update,delete)
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handling middleware
app.use(globalErrorHandler);

// 4- start the server
module.exports = app;
