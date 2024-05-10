const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String, // built in validator
      required: [true, 'A Tour must have a name'], // built in validator
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 characters'], // built in validator
      minlength: [10, 'A tour name must have more or equal than 10 characters'], // built in validator
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        // built in validator
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'], // built in validator
      max: [5, 'Rating must be below 5.0'], // built in validator
      set: (val) => Math.round(val * 10) / 10, // 4.66667 => Math.round(4.66667) = 5 and that is false ,then
      // we make  Math.round(val * 10 ) / 10  =>   4.6667 * 10 = 46.67 and round (46.67) = 47 then 47 / 10 = 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    // using custom validator
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only point to current docu on only NEW document creation
          return val < this.price; // return true if value of disc less than price
        },
        message: 'Discount Price ({VALUE}) Should be below regular price ',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // if you want to hide the createdAt
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    // THIS OBJECT HERE IS embedded  NOT A SCHEMA TYPE OPTION 'startLocation'
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number, // the day of the tour  in which people will go to this location.
      },
    ],
    // Referencing 'between user and tour'
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// tourSchema.index({ price: 1 }); // in an ascending Order 'singleIndexes'
tourSchema.index({ price: 1, ratingsAverage: -1 }); // 'compoundIndexes'  -->> if the query contains only one field(price) or these two fields  it's work correctly
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); // the startLocation field should be indexed to a 2dsphere

// virtual('name of virtual property')
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
//---------------------------------------------------------------------

// virtual property
// review is the name of the virtual field
tourSchema.virtual('reviews', {
  ref: 'Review',
  //And now, we actually need to specify the name of the fields in order to connect the two data sets.
  foreignField: 'tour',
  localField: '_id',
});

tourSchema.pre('save', function (next) {
  // console.log(this); // this referes to curruntly process document
  this.slug = slugify(this.name, { lower: true });
  next(); //  to call the next middleware function in a stack
});

/*
tourSchema.pre('save', async function (next) {
  const guidesPromises = this.guides.map(async (id) => await User.findById(id));
  this.guides = await Promise.all(guidesPromises);
  next();
});
*/

tourSchema.pre(/^find/, function (next) {
  // /^find/ means all strings that starts with find (find,findOne,findByIdAndUpdate,...)
  this.find({ secretTour: { $ne: true } }); // this :- here is a query object
  next();
});

/*
query middle ware function
this is the kind of middleware that is going to run each time there is a query.
*/
tourSchema.pre(/^find/, function (next) {
  // this point to the current query
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  // docs :- documents that returns from a query
  next();
});

//------------------------------------------------------------------------------

/*
==>> Aggregation middleware
*/
/*
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
  next();
});
*/

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
