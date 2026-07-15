const app = require('./src/app.js');
const connectDB = require('./src/db.js');

const PORT = process.env.PORT || 5000;

// First connect to the database, then start listening for requests
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
  });
});