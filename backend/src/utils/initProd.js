const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const RetailParty = require('../models/RetailParty');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

dotenv.config({ path: require('path').join(__dirname, '../../.env') });

const clearDatabase = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/undergarments_oms';
    console.log(`Connecting to ${uri}...`);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB. Removing all testing data...');

    await Promise.all([
      User.deleteMany({}),
      RetailParty.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      Payment.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('Testing data cleared. Creating initial Admin user for production access...');

    await User.create({
      name: 'Admin',
      email: 'admin@wholesale.com',
      phone: '9876543210',
      password: 'admin123',
      role: 'admin',
      status: 'active',
    });

    console.log('Admin user created successfully.');
    console.log('Database is now clean and production ready!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error.message);
    process.exit(1);
  }
};

clearDatabase();
