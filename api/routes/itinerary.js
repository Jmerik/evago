const express = require('express');
const store = require('../lib/store');

const router = express.Router();

router.post('/pass', (req, res) => {
  const { itinerary, booking, userId = 'default-user' } = req.body;

  if (!itinerary || !Array.isArray(itinerary)) {
    return res.status(400).json({ error: 'Valid itinerary array is required' });
  }

  const passRecord = {
    id: `pass-${Date.now()}`,
    userId,
    itinerary,
    booking: booking || null,
    createdAt: new Date().toISOString(),
  };

  store.savePass(passRecord);
  res.json({ success: true, pass: passRecord });
});

router.get('/pass', (req, res) => {
  const userId = req.query.userId || 'default-user';
  const pass = store.getLatestPass(userId);
  res.json({ success: true, pass });
});

module.exports = router;
