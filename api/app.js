const express = require('express');
const cors = require('cors');
require('dotenv').config();

const discoveryRouter = require('./routes/discovery');
const lumaRouter = require('./routes/luma');
const itineraryRouter = require('./routes/itinerary');
const autocompleteRouter = require('./routes/autocomplete');
const travelRouter = require('./routes/travel');

const app = express();

const corsOptions = {
  origin: process.env.VERCEL ? ['https://evago-liard.vercel.app', 'https://evago.vercel.app'] : '*',
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Route modules
app.use('/api/discovery', discoveryRouter);
app.use('/api/luma', lumaRouter);
app.use('/api/itinerary', itineraryRouter);
app.use('/api/autocomplete', autocompleteRouter);
app.use('/api/travel', travelRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
