const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/db');

// Load env vars
dotenv.config();

const makeUserAdmin = async () => {
  try {
    await connectDB();

    const email = process.argv[2];
    const password = process.argv[3];
    const name = process.argv[4] || 'Admin User';

    if (!email) {
      console.error('Please provide an email address.');
      console.log('Usage: node src/scripts/makeAdmin.js <email> [password] [name]');
      process.exit(1);
    }

    let user = await User.findOne({ email });

    if (user) {
      // User exists - just promote
      user.isAdmin = true;
      if (password) {
          // Optional: Update password if provided
          user.password = password; 
          console.log('Updating password and promoting to Admin...');
      } else {
          console.log('User found. Promoting to Admin...');
      }
      await user.save();
      console.log(`Success! User ${user.name} (${user.email}) is now an Admin.`);
    } else {
      // User doesn't exist - create new
      if (!password) {
        console.error(`User with email ${email} not found.`);
        console.error('To create a new admin user, please provide a password.');
        console.log('Usage: node src/scripts/makeAdmin.js <email> <password> [name]');
        process.exit(1);
      }

      console.log('Creating new Admin user...');
      user = await User.create({
        name,
        email,
        password,
        isAdmin: true
      });
      console.log(`Success! Created new Admin user: ${user.name} (${user.email})`);
    }
    
    process.exit();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

makeUserAdmin();
