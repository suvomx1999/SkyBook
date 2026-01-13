const express = require('express');
const router = express.Router();
const {
  getFlights,
  getFlightById,
  createFlight,
  updateFlight,
  deleteFlight,
  getFlightLocks,
} = require('../controllers/flightController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getFlights);
router.get('/:id/locks', getFlightLocks);
router.get('/:id', getFlightById);

// Admin routes
router.post('/', protect, admin, createFlight);
router.put('/:id', protect, admin, updateFlight);
router.delete('/:id', protect, admin, deleteFlight);

module.exports = router;
