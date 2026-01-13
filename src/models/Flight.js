const mongoose = require('mongoose');

const flightSchema = mongoose.Schema(
  {
    flightNumber: {
      type: String,
      required: [true, 'Please add a flight number'],
      unique: true,
    },
    airline: {
      type: String,
      required: [true, 'Please add an airline'],
    },
    source: {
      type: String,
      required: [true, 'Please add a source'],
    },
    destination: {
      type: String,
      required: [true, 'Please add a destination'],
    },
    departureTime: {
      type: Date,
      required: [true, 'Please add a departure time'],
    },
    arrivalTime: {
      type: Date,
      required: [true, 'Please add an arrival time'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
    },
    totalSeats: {
      type: Number,
      required: [true, 'Please add total seats'],
    },
    availableSeats: {
      type: Number,
      required: [true, 'Please add available seats'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Flight', flightSchema);
