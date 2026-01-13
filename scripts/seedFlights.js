const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Flight = require('../src/models/Flight');
const connectDB = require('../src/config/db');

dotenv.config();

const seedFlights = async () => {
  try {
    await connectDB();

    // Clear existing flights (optional, but good for clean slate)
    await Flight.deleteMany({});
    console.log('Cleared existing flights...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const flights = [
      {
        airline: 'SkyBook Air',
        flightNumber: 'SB101',
        source: 'New York',
        destination: 'London',
        departureTime: new Date(tomorrow.setHours(10, 0, 0, 0)),
        arrivalTime: new Date(tomorrow.setHours(22, 0, 0, 0)),
        price: 550,
        totalSeats: 150,
        availableSeats: 150,
      },
      {
        airline: 'Oceanic Airlines',
        flightNumber: 'OA815',
        source: 'Los Angeles',
        destination: 'Tokyo',
        departureTime: new Date(dayAfterTomorrow.setHours(14, 30, 0, 0)),
        arrivalTime: new Date(dayAfterTomorrow.setHours(23, 30, 0, 0)), // +1 day in reality but keep simple
        price: 850,
        totalSeats: 200,
        availableSeats: 200,
      },
      {
        airline: 'Emirates Express',
        flightNumber: 'EE202',
        source: 'Dubai',
        destination: 'Mumbai',
        departureTime: new Date(nextWeek.setHours(9, 0, 0, 0)),
        arrivalTime: new Date(nextWeek.setHours(13, 0, 0, 0)),
        price: 300,
        totalSeats: 180,
        availableSeats: 180,
      },
      {
        airline: 'British Airways',
        flightNumber: 'BA112',
        source: 'London',
        destination: 'New York',
        departureTime: new Date(tomorrow.setHours(16, 0, 0, 0)),
        arrivalTime: new Date(tomorrow.setHours(20, 0, 0, 0)),
        price: 600,
        totalSeats: 160,
        availableSeats: 160,
      },
      {
        airline: 'Singapore Airlines',
        flightNumber: 'SQ25',
        source: 'Singapore',
        destination: 'Sydney',
        departureTime: new Date(dayAfterTomorrow.setHours(23, 0, 0, 0)),
        arrivalTime: new Date(dayAfterTomorrow.setHours(23 + 8, 0, 0, 0)),
        price: 700,
        totalSeats: 220,
        availableSeats: 220,
      },
      {
        airline: 'SkyBook Air',
        flightNumber: 'SB102',
        source: 'New York',
        destination: 'Paris',
        departureTime: new Date(tomorrow.setHours(18, 0, 0, 0)),
        arrivalTime: new Date(tomorrow.setHours(18 + 7, 0, 0, 0)),
        price: 450,
        totalSeats: 140,
        availableSeats: 12, // Low availability demo
      }
    ];

    await Flight.insertMany(flights);
    console.log('✅ Demo flights seeded successfully!');
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding flights:', error);
    process.exit(1);
  }
};

seedFlights();
