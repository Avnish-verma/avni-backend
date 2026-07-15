require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth.routes');
const topicsRoutes = require('./routes/topics.routes');
const statsRoutes = require('./routes/stats.routes'); // <-- NEW

const app = express();

app.use(express.json());

const allowedOrigins = process.env.CORS_ORIGIN.split(',').map(s => s.trim());
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Public Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api', topicsRoutes);
app.use('/api', statsRoutes); // <-- NEW

module.exports = app;