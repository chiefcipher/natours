const mongoose = require('mongoose');
const bookingSchema = new mongoose.Schema({
  tour: {
    // parent refrencing
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to a tour!'],
  },
  user: {
    // parent refrencing
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a user!'],
  },
  price: {
    type: Number,
    required: [true, 'Booking must have a price.'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    // this is for manual payment
    type: Boolean,
    default: true,
  },
 });

// populating tour and user fields
bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({
    path: 'tour',
    select: 'name',
  });
  next();
});



const Booking = new mongoose.model('Booking', bookingSchema);
module.exports = Booking;
