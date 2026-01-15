const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const redisClient = require('../config/redis');

const createPaymentIntent = async (req, res) => {
  const { amount, currency = 'inr', flightId, seatNumbers, userId } = req.body;
  console.log('Received payment intent request:', { amount, currency, flightId, seatNumbers });

  try {
    // 1. Check if seats are locked and lock them atomically
    if (flightId && seatNumbers && seatNumbers.length > 0) {
      const lockKeys = seatNumbers.map(seat => `lock:${flightId}:${seat}`);
      const ttl = 600; // 10 minutes

      // Lua script to atomically check and lock
      // Returns {1} on success, {0, failedKey} on failure
      const script = `
        local userId = ARGV[1]
        local ttl = ARGV[2]
        
        -- Check phase
        for i, key in ipairs(KEYS) do
            local owner = redis.call("GET", key)
            if owner and owner ~= userId then
                return {0, key}
            end
        end

        -- Lock phase
        for i, key in ipairs(KEYS) do
            redis.call("SET", key, userId, "EX", ttl)
        end
        return {1}
      `;

      try {
        const result = await redisClient.eval(script, {
          keys: lockKeys,
          arguments: [userId || 'anonymous', String(ttl)]
        });

        if (result[0] === 0) {
          const failedKey = result[1];
          const seatPart = failedKey.split(':').pop();
          return res.status(400).json({ 
            message: `Seat ${seatPart} is currently being booked by another user. Please try again in a few minutes.` 
          });
        }
      } catch (err) {
        console.error('Redis atomic lock error:', err);
        return res.status(500).json({ message: 'Failed to secure seats. Please try again.' });
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
