const Flight = require('../models/Flight');
const redisClient = require('../config/redis');

// @desc    Get all flights or search flights
// @route   GET /api/flights
// @access  Public
const getFlights = async (req, res) => {
  try {
    const { source, destination, date } = req.query;
    let query = {};

    if (source) {
      query.source = { $regex: source, $options: 'i' };
    }

    if (destination) {
      query.destination = { $regex: destination, $options: 'i' };
    }

    if (date) {
      // Assuming date is in YYYY-MM-DD format
      // Search for flights departing on that date (whole day)
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      query.departureTime = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    const flights = await Flight.find(query);
    res.status(200).json(flights);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get flight by ID
// @route   GET /api/flights/:id
// @access  Public
const getFlightById = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);

    if (flight) {
      res.status(200).json(flight);
    } else {
      res.status(404).json({ message: 'Flight not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get locked seats for a flight
// @route   GET /api/flights/:id/locks
// @access  Public
const getFlightLocks = async (req, res) => {
  try {
    const flightId = req.params.id;
    const keys = await redisClient.keys(`lock:${flightId}:*`);
    
    // Extract seat numbers from keys "lock:flightId:seatNumber"
    const lockedSeats = keys.map(key => key.split(':').pop());
    
    res.status(200).json(lockedSeats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a flight
// @route   POST /api/flights
// @access  Private/Admin
const createFlight = async (req, res) => {
  try {
    const {
      flightNumber,
      airline,
      source,
      destination,
      departureTime,
      arrivalTime,
      price,
      totalSeats,
    } = req.body;

    // Validate required fields
    if (
      !flightNumber ||
      !airline ||
      !source ||
      !destination ||
      !departureTime ||
      !arrivalTime ||
      !price ||
      !totalSeats
    ) {
      res.status(400).json({ message: 'Please add all fields' });
      return;
    }

    // Check if flight number already exists
    const flightExists = await Flight.findOne({ flightNumber });
    if (flightExists) {
      res.status(400).json({ message: 'Flight number already exists' });
      return;
    }

    const flight = await Flight.create({
      flightNumber,
      airline,
      source,
      destination,
      departureTime,
      arrivalTime,
      price,
      totalSeats,
      availableSeats: totalSeats, // Initially all seats are available
    });

    res.status(201).json(flight);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update flight
// @route   PUT /api/flights/:id
// @access  Private/Admin
const updateFlight = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);

    if (!flight) {
      res.status(404).json({ message: 'Flight not found' });
      return;
    }

    const updatedFlight = await Flight.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json(updatedFlight);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete flight
// @route   DELETE /api/flights/:id
// @access  Private/Admin
const deleteFlight = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);

    if (!flight) {
      res.status(404).json({ message: 'Flight not found' });
      return;
    }

    await flight.deleteOne();

    res.status(200).json({ id: req.params.id, message: 'Flight removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getFlights,
  getFlightById,
  createFlight,
  updateFlight,
  deleteFlight,
  getFlightLocks,
};
