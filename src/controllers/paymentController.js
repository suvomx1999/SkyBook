const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const redisClient = require('../config/redis');

const createPaymentIntent = async (req, res) => {
  const { amount, currency = 'inr', flightId, seatNumbers, userId } = req.body;
  console.log('Received payment intent request:', { amount, currency, flightId, seatNumbers });

  try {
    // 1. Check if seats are locked
    if (flightId && seatNumbers && seatNumbers.length > 0) {
      for (const seat of seatNumbers) {
        const lockKey = `lock:${flightId}:${seat}`;
        const lockedBy = await redisClient.get(lockKey);
        
        if (lockedBy && lockedBy !== userId) {
          return res.status(400).json({ 
            message: `Seat ${seat} is currently being booked by another user. Please try again in a few minutes.` 
          });
        }
      }

      // 2. Lock seats for this user (10 minutes TTL)
      for (const seat of seatNumbers) {
        const lockKey = `lock:${flightId}:${seat}`;
        // Set key with 600 seconds (10 mins) expiry
        await redisClient.set(lockKey, userId, {
          EX: 600
        });
      }

      // Emit socket event
      if (req.io) {
        req.io.to(`flight:${flightId}`).emit('seatsLocked', {
          seats: seatNumbers
        });
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents/paisa
      currency,
    });
    console.log('Payment intent created successfully:', paymentIntent.id);

    res.status(200).send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Stripe/Redis error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPaymentIntent,
};
