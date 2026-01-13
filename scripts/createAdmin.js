const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/User');
const connectDB = require('../src/config/db');

dotenv.config();
connectDB();

const createAdmin = async () => {
  try {
    // Check if admin exists
    const adminExists = await User.findOne({ email: 'admin@example.com' });

    if (adminExists) {
      console.log('Admin user already exists');
      process.exit();
    }

    const user = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      isAdmin: true,
    });

    console.log('Admin user created');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createAdmin();
