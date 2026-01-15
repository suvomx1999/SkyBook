const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

const getAllowedOrigins = () => {
  const defaultOrigins = ["http://localhost:5173", "http://localhost:3000", "https://sky-book-eta.vercel.app"];
  if (process.env.CLIENT_URL) {
    // Split by comma in case multiple origins are provided
    const envOrigins = process.env.CLIENT_URL.split(',').map(url => url.trim().replace(/\/$/, ""));
    return [...envOrigins, ...defaultOrigins];
  }
  return defaultOrigins;
};

const io = new Server(server, {
  cors: {
    origin: [
      ...getAllowedOrigins(),
      /\.vercel\.app$/, // Allow all Vercel deployments
      /\.onrender\.com$/ // Allow Render frontends if any
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: (origin, callback) => {
    const allowed = getAllowedOrigins();
    if (!origin || allowed.includes(origin) || /\.vercel\.app$/.test(origin) || /\.onrender\.com$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Make io accessible to our router
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join_flight', (flightId) => {
    socket.join(`flight:${flightId}`);
    console.log(`Socket ${socket.id} joined flight:${flightId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use('/api/users', require('./routes/authRoutes'));
app.use('/api/flights', require('./routes/flightRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.get('/api/health/redis', async (req, res) => {
  const redisClient = require('./config/redis');
  try {
    if (redisClient.isOpen) {
      await redisClient.set('health_check', 'ok', { EX: 5 });
      const value = await redisClient.get('health_check');
      res.status(200).json({ status: 'Connected', test_value: value });
    } else {
      res.status(503).json({ status: 'Disconnected', message: 'Redis client is not open' });
    }
  } catch (error) {
    res.status(500).json({ status: 'Error', message: error.message });
  }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
