const Review = require('../models/reviewModel');
// const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// THIS IS MIDDLE WARE THAT RUNS BEFORE CREATREVIEWS
exports.setTourUserIds = (req, res, next) => {
  // Allow Nested Routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Review);

// Building Handler factory functions GET one review
exports.getReview = factory.getOne(Review);

// Building Handler factory functions CREATE
exports.createReviews = factory.createOne(Review);

// Building Handler factory functions UPDATE
exports.updateReview = factory.updateOne(Review);

// Building Handler factory functions DELETE
exports.deleteReview = factory.deleteOne(Review);
