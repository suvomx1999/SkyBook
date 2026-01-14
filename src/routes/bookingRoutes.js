const express = require('express');
const router = express.Router();
const {
  bookFlight,
  cancelBooking,
  getMyBookings,
  getFlightBookings,
  getBookingById,
  getOccupiedSeats,
  getAllBookings,
  getDashboardStats,
} = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/stats', protect, admin, getDashboardStats);
router.get('/all', protect, admin, getAllBookings);
router.post('/', protect, bookFlight);
router.put('/:id/cancel', protect, cancelBooking);
router.get('/my', protect, getMyBookings);
router.get('/flight/:flightId/occupied', getOccupiedSeats);
router.get('/flight/:flightId', protect, admin, getFlightBookings);
router.get('/:id', protect, getBookingById);

module.exports = router;
