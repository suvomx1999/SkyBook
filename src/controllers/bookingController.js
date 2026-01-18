const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const User = require('../models/User');
const redisClient = require('../config/redis');
const { sendBookingConfirmation, sendBookingCancellation } = require('../services/emailService');

// @desc    Get occupied seats for a flight
// @route   GET /api/bookings/flight/:flightId/occupied
// @access  Public
const getOccupiedSeats = async (req, res) => {
  try {
    const { flightId } = req.params;
    
    // Find all active bookings for this flight
    const bookings = await Booking.find({ 
      flight: flightId, 
      status: 'booked' 
    }).select('seatNumbers');

    // Flatten array of seat arrays into single array
    const occupiedSeats = bookings.reduce((acc, booking) => {
      return [...acc, ...(booking.seatNumbers || [])];
    }, []);

    res.status(200).json(occupiedSeats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Book a flight
// @route   POST /api/bookings
// @access  Private
const bookFlight = async (req, res) => {
  try {
    const { flightId, seats, passengerName, passengers } = req.body;

    // Validate input
    if (!flightId || !seats) {
      res.status(400).json({ message: 'Please add all fields' });
      return;
    }

    // Determine primary passenger name
    let primaryPassengerName = passengerName;
    if (!primaryPassengerName && passengers && passengers.length > 0) {
      primaryPassengerName = passengers[0].name;
    }

    if (!primaryPassengerName) {
        res.status(400).json({ message: 'Please provide passenger details' });
        return;
    }

    if (seats < 1) {
      res.status(400).json({ message: 'Seats must be at least 1' });
      return;
    }

    // Find flight
    const flight = await Flight.findById(flightId);

    if (!flight) {
      res.status(404).json({ message: 'Flight not found' });
      return;
    }

    // Check availability
    if (flight.availableSeats < seats) {
      res.status(400).json({ message: 'Not enough seats available' });
      return;
    }

    // Calculate total price
    let totalPrice = 0;
    let basePrice = flight.price * seats;
    let seatSelectionFees = 0;
    
    if (req.body.seatNumbers && req.body.seatNumbers.length > 0) {
       // Validate seats
       if (req.body.seatNumbers.length !== seats) {
          res.status(400).json({ message: 'Number of selected seats does not match seat count' });
          return;
       }

       // Check Redis Locks - IMPORTANT
       for (const seat of req.body.seatNumbers) {
          const lockKey = `lock:${flightId}:${seat}`;
          const lockedBy = await redisClient.get(lockKey);

          // If locked by someone else, or not locked at all (expired?)
          // Note: If payment succeeded, we expect the lock to be held by THIS user.
          // If lock expired but seat is still free in DB, it's technically fine, but ideally we want to confirm ownership.
          // For now, if locked by someone else, reject.
          if (lockedBy && lockedBy !== req.user.id) {
             res.status(400).json({ message: `Seat ${seat} is currently locked by another user` });
             return;
          }
       }

       // Calculate price based on seat type
       // Window: Ends with A or F
       // Aisle: Ends with C or D
       // Middle: Ends with B or E
       req.body.seatNumbers.forEach((seat) => {
         const col = seat.slice(-1).toUpperCase();
         if (['A', 'F', 'C', 'D'].includes(col)) {
           seatSelectionFees += 150; // Extra for Window and Aisle
         }
       });
    }

    // Calculate Tax (5% of base price, excluding seat fees)
    const tax = basePrice * 0.05;

    // Final Total
    totalPrice = basePrice + seatSelectionFees + tax;

    // Create booking
    const booking = await Booking.create({
      user: req.user.id,
      flight: flightId,
      passengerName: primaryPassengerName,
      passengers: passengers || [],
      seats,
      totalPrice,
      tax,
      seatNumbers: req.body.seatNumbers || [],
      status: 'booked',
      paymentIntentId: req.body.paymentIntentId,
    });

    // Update flight seats
    flight.availableSeats -= seats;
    await flight.save();

    // Release Redis Locks
    if (req.body.seatNumbers && req.body.seatNumbers.length > 0) {
       for (const seat of req.body.seatNumbers) {
          const lockKey = `lock:${flightId}:${seat}`;
          await redisClient.del(lockKey);
       }

       // Emit socket event for confirmed booking
       if (req.io) {
          req.io.to(`flight:${flightId}`).emit('seatsBooked', {
             seats: req.body.seatNumbers
          });
       }
    }

    // Send Email Confirmation
    // We don't await this because we don't want to block the response
    // if email fails (it's a side effect)
    try {
       sendBookingConfirmation(booking, req.user, flight);
    } catch (emailError) {
       console.error("Failed to initiate email sending:", emailError);
    }

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    if (booking.user.toString() !== req.user.id && !req.user.isAdmin) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    if (booking.status === 'cancelled') {
      res.status(400).json({ message: 'Booking is already cancelled' });
      return;
    }

    booking.status = 'cancelled';
    await booking.save();

    const flight = await Flight.findById(booking.flight);
    if (flight) {
      flight.availableSeats += booking.seats;
      await flight.save();
    }

    try {
      const user = await User.findById(booking.user).select('name email');
      if (user && flight) {
        sendBookingCancellation(booking, user, flight);
      }
    } catch (emailError) {
      console.error('Failed to initiate cancellation email sending:', emailError);
    }

    res.status(200).json({ message: 'Booking cancelled', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings/my
// @access  Private
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).populate('flight');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get bookings for a specific flight
// @route   GET /api/bookings/flight/:flightId
// @access  Private/Admin
const getFlightBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ flight: req.params.flightId }).populate('user', 'name email');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('flight');

    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    // Check ownership or admin
    if (booking.user.toString() !== req.user.id && !req.user.isAdmin) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings/all
// @access  Private/Admin
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('flight', 'flightNumber airline source destination departureTime')
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard stats (Admin)
// @route   GET /api/bookings/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const totalFlights = await Flight.countDocuments();
    const totalUsers = await User.countDocuments();

    const revenueResult = await Booking.aggregate([
      { $match: { status: 'booked' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.status(200).json({
      totalBookings,
      totalFlights,
      totalUsers,
      totalRevenue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  bookFlight,
  cancelBooking,
  getMyBookings,
  getFlightBookings,
  getBookingById,
  getOccupiedSeats,
  getAllBookings,
  getDashboardStats,
};
