const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // This connects to the URI you pasted in your .env file
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1); // Stop the server if the database fails to connect
  }
};

module.exports = connectDB;