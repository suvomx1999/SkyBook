const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    flight: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flight',
      required: true,
    },
    passengerName: {
      type: String,
      required: [true, 'Please add a passenger name'],
    },
    passengers: [{
      name: { type: String, required: true },
      age: { type: Number },
      gender: { type: String },
      seat: { type: String, required: true }
    }],
    seats: {
      type: Number,
      required: [true, 'Please add number of seats'],
      min: 1,
    },
    status: {
      type: String,
      enum: ['booked', 'cancelled'],
      default: 'booked',
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    seatNumbers: {
      type: [String],
      default: [],
    },
    paymentIntentId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
