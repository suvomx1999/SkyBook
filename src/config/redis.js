const redis = require('redis');

const redisUrl = process.env.REDIS_URL;

console.log(`Initializing Redis client... URL provided: ${redisUrl ? 'Yes' : 'No'}`);

const client = redis.createClient({
  url: redisUrl || undefined,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 20) {
        console.error('Too many attempts to reconnect. Redis connection was terminated');
        return new Error('Too many retries.');
      }
      return Math.min(retries * 50, 500);
    }
  }
});

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

client.on('connect', () => {
  console.log('Redis Client Connected Successfully');
});

(async () => {
  try {
    await client.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }
})();

module.exports = client;
