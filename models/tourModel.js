const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      index: true,
      unique: true,
      trim: true,
      required: [true, 'A tour must have a name'],
      maxLength: [40, 'A tour name must have less or equal to 40 characters '],
      minLength: [10, 'A tour name must have 10 or more characters'],
      // validate :[ validator.isAlpha , 'Tour name must only contain characters']
    },
    duration: {
      type: Number,
      required: [true, 'A message must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be easy, medium or difficult',
      },
      required: [true, 'A tour must have a difficulty level'],
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be greater than 1.0'],
      max: [5, 'Rating must be less than 5.0'],

      //set is a funtion that runs anytime the value changes for rating average
      set: (value) => Math.round(value * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // THIS ONLY PPOINTS TO CURRENT DOC ON NEW DOCUMENT CREATION
          //WE CAN USE NPM LIBRARY
          return val < this.price;
        },
        message: 'discount price ({VALUE}) should be below the regular price',
      },
    },

    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary '],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: {
      type: [String],
    },
    createdAt: {
      type: Date,
      select: false,
      default: Date.now(),
    },
    startDates: [Date],
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GEO JSON
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
        day: Number,
      },
    ],
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
// simple index
// tourSchema.index({
//   price : 1 //1 is ascending order -1 is descending
// })

// compound index
tourSchema.index({
  price: 1,
  ratingsAverage: -1,
});

// for geospacial data, the index needs to be a 2d sphere index
tourSchema.index({
  startLocation: '2dsphere',
});
//set index for slug
tourSchema.index({
  slug: 1,
});
tourSchema.virtual('durationWeekes').get(function () {
  return this.duration / 7;
});

// virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});
//DOCUMENT MIDDLE WARE RUNS BEFORE THE SAVE AND CREATE COMMANDS .save() .create() ;
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

tourSchema.pre('save', function (next) {
  // console.log('WILL SAVE DOCUMENT....');
  next();
});

//DOCUMENT MIDDLEWARE (POST)
tourSchema.post('save', function (doc, next) {
  next();
});

//QUERY MIDDLEWARE (PRE)
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  // console.log('query middleware find', next);
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});
//QUERY MIDDLEWARE (POST)
tourSchema.post(/^find/, function (docs, next) {
  // console.log(`Query took ${Date.now() - this.start}ms`);
  next();
});

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
