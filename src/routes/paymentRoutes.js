const express = require('express');
const router = express.Router();
const { createPaymentIntent, releaseSeatLocks } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/release-locks', protect, releaseSeatLocks);

module.exports = router;
