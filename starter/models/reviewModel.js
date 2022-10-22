// review rating , createdAt , ref to tour , ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    // virtuals properties not in schema but will be in respoonse
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);
// query middleware pre anything that starts with find, findOne, findand update etc
reviewSchema.pre(/^find/, function (next) {
  // use populate to get fields that we reference with ref:'Tour' and type : mongoose.Schema.ObjectId
  // this.populate({
  //   path: 'tour',
  //   select: 'name' ,
  // });
  // use populate to get fields that we reference with ref:'Tour' and type : mongoose.Schema.ObjectId
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});


//create index to prevent duplicate reviews this is a compound index
reviewSchema.index(
  {
    tour: 1,
    user: 1,
  },
  { unique: true }
);

// statics method
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //into agrregate pipeline we pass in an array of all the stages
  //this points to the model (in a statics method) so we can call aggregate on it  called directly on the model eg Review.calcAverageRatings
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};
// post middle ware does not have access to next
reviewSchema.post('save', function () {
  //this points to the current review being saved
  this.constructor.calcAverageRatings(this.tour);
});

/// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.clone().findOne();
  // console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
