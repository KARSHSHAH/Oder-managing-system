const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/undergarments_oms';
  
  const maskedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  console.log(`[MongoDB] Attempting to connect to ${maskedUri}...`);

  mongoose.connection.on('connected', () => {
    console.log('[MongoDB] Mongoose connection established.');
  });
  
  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Mongoose connection error:', err);
  });

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error] ${error.message}`);
    console.warn(`[MongoDB Warning] Please ensure MongoDB is running locally or specify a valid MONGO_URI in backend/.env (e.g. MongoDB Atlas cluster).`);
    process.exit(1);
  }
};

module.exports = connectDB;
