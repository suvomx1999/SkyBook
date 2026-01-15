const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const redisClient = require('../config/redis');

const createPaymentIntent = async (req, res) => {
  const { amount, currency = 'inr', flightId, seatNumbers, userId } = req.body;
  console.log('Received payment intent request:', { amount, currency, flightId, seatNumbers });

  try {
    if (flightId && seatNumbers && seatNumbers.length > 0) {
      const lockKeys = seatNumbers.map(seat => `lock:${flightId}:${seat}`);
      const ttl = 600;

      const script = `
        local userId = ARGV[1]
        local ttl = ARGV[2]
        
        for i, key in ipairs(KEYS) do
            local owner = redis.call("GET", key)
            if owner and owner ~= userId then
                return {0, key}
            end
        end

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

        if (Array.isArray(result) && result[0] === 0) {
          const failedKey = result[1];
          const seatPart = typeof failedKey === 'string' ? failedKey.split(':').pop() : '?';
          return res.status(400).json({ 
            message: `Seat ${seatPart} is currently being booked by another user. Please try again in a few minutes.` 
          });
        }
      } catch (err) {
        console.error('Redis atomic lock error:', err);
        return res.status(500).json({ message: 'Failed to secure seats. Please try again.' });
      }

      if (req.io) {
        req.io.to(`flight:${flightId}`).emit('seatsLocked', {
          seats: seatNumbers
        });
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
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

const releaseSeatLocks = async (req, res) => {
  try {
    const { flightId, seatNumbers } = req.body;
    const userId = req.user.id;

    if (!flightId || !seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({ message: 'Invalid lock release payload' });
    }

    for (const seat of seatNumbers) {
      const lockKey = `lock:${flightId}:${seat}`;
      const owner = await redisClient.get(lockKey);
      if (owner && owner === userId) {
        await redisClient.del(lockKey);
      }
    }

    if (req.io) {
      req.io.to(`flight:${flightId}`).emit('seatsLocked', {
        seats: [],
      });
    }

    res.status(200).json({ message: 'Locks released' });
  } catch (error) {
    console.error('Release seat locks error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPaymentIntent,
  releaseSeatLocks,
};
