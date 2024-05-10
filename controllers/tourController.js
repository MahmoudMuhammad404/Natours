const multer = require('multer');
const sharp = require('sharp');

const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');

const multerStorage = multer.memoryStorage();

// check that if uploaded file is image or not!
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

// upload.single('image');
// upload.array('images', 5);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);

  if (!req.files.imageCover || !req.files.images) return next();

  // 1) COVER IMAGE
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) IMAGES
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );
  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' }); // the path property is the field that we want to populate

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // _id: '$difficulty',
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 }, // like counter
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 }, // 1 for ascending order
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

// ==>> Aggregation Pipeline ==> Unwinding and Projecting

/*
And what unwind is gonna do is basically deconstruct an array field from the info documents and
then output one document for each element of the array.
*/
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  // get the year
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`), // the first day of the year
          $lte: new Date(`${year}-12-31`), //the last day in the year
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }, // $push :- to create a array and put names in it
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0, // hide the _id
      },
    },
    {
      $sort: { numTourStarts: -1 }, // -1 for descending order
    },
    /*
      {
        $limit : 6  // to only have six output here (only 6 documents)
      }
     */
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

// '/tours-within/:distance/center/:latlng/unit/:unit'
// tours-within/233/center=31.206889, 29.923950/unit/mi
// latitude and longitude
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  /*
   ==>> the radius is basically the distance that we want to have as the radius,but
        converted to a special unit called radians AND in order to get the radians
        we need to divide our distance by the radius of the earth
        (distance of the earth in miles Vs distance of the earth in Km)
        "And radians we get by dividing the distance by the radius of the Earth."
   */
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }
  // console.log(distance, lat, lng, unit);

  /*
  ==> -startLocation feild :- the geospatial point where each tour starts
      and that exactly what we are searching for
      - $geoWithin :- it finds document within a certain geometry,and that
        geometry that we need to define at next step 'centerSphere Operator'
      -the centerSphere operator takes an array of the coords and radius
      -mongoDb expected a radius in a special unit called => radians
    
    -another very important thing is that we actually in order to be able to do just
    basic queries, we need to first attribute an index to the field where the geospatial data
    that we're searching for is stored.So in this case, we need to add an index to start location.
  */
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

//  Geospatial Aggregation to Calculating Distances to all the tours from a certain point
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // 1mile = 1.6093 km    ***  1mile = 1609 meter
  const multiplier = unit === 'mi' ? 0.00062137 : 0.001; // 0.001 to convert it to Km

  if (!lat || !lng) {
    next(
      new AppError(
        'please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }

  /*
  ==>> for geospatial aggregation:-
  there's actually only one single stage,and that's called geoNear, so this one.
  Again, this is the only geospatial aggregation pipeline stage that actually exists.

  Something else that's also very important to note about geoNear is that it requires
  that at least one of our fields contains a geospatial index. , 'startLocation'
  */

  const distances = await Tour.aggregate([
    {
      // geoNear :- Must come be first
      $geoNear: {
        //near is the point from which to calculate the distances.'the first mandatory field'
        // calculation done between near point and all startLocation points
        // near :- is the point that we pass in the function with latlng [lat, lng]
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        //this is the name of the field that will be created and where all the calculated distances will be stored.
        distanceField: 'distance', // the result of distance comes in meter
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        // select only distance and name
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
