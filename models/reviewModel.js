const mongoose = require('mongoose');
const Tour = require('./tourModel');
//const uniqueValidator = require('mongoose-unique-validator');
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: [1, 'Review must be above 1'],
      max: [5, 'Review must be below 5'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },

    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Preventing Duplicate Reviews :- user cannot write multiple reviews on a specific tour ONLY one review for every tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); // specifies that the index should enforce uniqueness on the combination of values in the tour and user fields.



reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// this is called a static method
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // in statics method --> this keyword means this Model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }, // selectiong all reviews that match the current tourId
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats); // output :- [{id , nRating , avgRating}]

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    // Default value for non-rating tour(s)
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// post save miidleware , calling it after a new review been created
reviewSchema.post('save', function () {
  // this points to current document
  // this.constructor points to the current Model
  this.constructor.calcAverageRatings(this.tour);
});

/*
==>>if the review is updated or deleted
 1-findByIdAndUpdate
 2-findByIdAndDelete
*/
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // FIRST , Access the current review document before the query is executed
  this.r = await this.findOne(); // Store the current review document in this.r
  // console.log(this.r); // Log the current review document
  next(); // Continue to the next middleware
});

reviewSchema.post(/^findOneAnd/, async function () {
  // Perform an action after the query is executed
  await this.r.constructor.calcAverageRatings(this.r.tour); // Calculate average ratings using the review of the current document
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
