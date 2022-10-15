const mangoose = require('mongoose');
const slugify = require('slugify');

// Creating schema and Model
// Schema
const tourSchema = new mangoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tour mush have a name'],
      unique: true,
      trim: true,
      maxlength: [
        40,
        'A tour name mush have less than or equal to 40 characters '
      ],
      minlength: [
        4,
        'A tour name mush have greater than or equal to 4 characters '
      ]
      // validate: [validator.isAlpha, 'name must only contain alphabets']
    },
    slug: {
      type: String
    },
    duration: {
      type: Number,
      required: [true, 'Tour mush have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Tour mush have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'Tour mush have a group size'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy,medium,difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be greater than or equal to 1.0'],
      max: [5, 'Rating must be less than or equal to 5.0'],
      set: val => +val.toFixed(2)
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'Tour mush have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(priceDiscountVal) {
          // This points to the current doc it will not work for update
          return priceDiscountVal < this.price;
        },
        message: 'Discount price({VALUE}) should be below regular price'
      }
    },
    summary: {
      type: String,
      required: [true, 'Tour mush have a summary'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'Tour mush have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [{ type: mangoose.Schema.ObjectId, ref: 'User' }]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Creating single Index
// tourSchema.index({ price: 1 });
// Creating Compound Index
tourSchema.index({ startLocation: '2dsphere' });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

// Creating a virtual property
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});
// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

// Middleware
// 1A) Document Middleware: pre-runs before .save() an .create()
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// // 1B)post
// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

// 2)Query middleware
// 2A)Pre
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});
tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});

// 2B)Post
tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} millisecound `);
  next();
});

// 3)Aggregation middleware
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });
// Creating model
const Tour = mangoose.model('Tour', tourSchema);

module.exports = Tour;
