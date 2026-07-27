const express = require('express');
const { fetchDuffelOffers } = require('../lib/duffel');
const IATA_MAP = require('../lib/iata');

const router = express.Router();

function extractIata(str) {
  if (!str) return 'SIN';
  const match = str.match(/\(([A-Z]{3})\)/i);
  if (match) return match[1].toUpperCase();

  const cleanStr = str.trim().toUpperCase();
  if (cleanStr.length === 3 && IATA_MAP[cleanStr]) return cleanStr;

  const lower = str.toLowerCase();
  for (const [code, item] of Object.entries(IATA_MAP)) {
    if (
      item.city.toLowerCase() === lower ||
      lower.includes(item.city.toLowerCase()) ||
      item.country.toLowerCase() === lower
    ) {
      return code;
    }
  }

  return cleanStr.slice(0, 3);
}

router.post('/search', async (req, res) => {
  const {
    departure = 'London (LHR)',
    returnPlace = 'London (LHR)',
    destinations = ['Singapore'],
    startDate,
    endDate,
  } = req.body;

  const firstDest = destinations[0] || 'Singapore';
  const lastDest = destinations[destinations.length - 1] || firstDest;

  const originIata = extractIata(departure);
  const destIata = extractIata(firstDest);
  const lastIata = extractIata(lastDest);
  const returnIata = extractIata(returnPlace);

  // Fetch live flight options from Duffel
  const inboundOptions = await fetchDuffelOffers(originIata, destIata, startDate);
  const outboundOptions = endDate ? await fetchDuffelOffers(lastIata, returnIata, endDate) : [];

  const interCityOptions = [];
  const transferOptions = [];

  // Build multi-segment breakdown if multi-stop itinerary
  const routeStops = [departure, ...destinations, returnPlace];
  const dynamicSegments = [];

  if (destinations.length > 1) {
    for (let i = 0; i < routeStops.length - 1; i++) {
      const fromLoc = routeStops[i];
      const toLoc = routeStops[i + 1];
      const fromCode = extractIata(fromLoc);
      const toCode = extractIata(toLoc);
      const legOffers = await fetchDuffelOffers(fromCode, toCode, startDate);
      dynamicSegments.push({
        segmentIndex: i + 1,
        title: `Segment ${i + 1}: ${fromLoc} ➔ ${toLoc}`,
        from: fromLoc,
        to: toLoc,
        isFlightLeg: true,
        options: legOffers,
      });
    }
  }

  res.json({
    success: true,
    origin: departure,
    returnPlace,
    destinations,
    startDate,
    endDate,
    inboundOptions,
    interCityOptions,
    outboundOptions,
    transferOptions,
    dynamicSegments,
    apiPipesUsed: [
      { name: 'Duffel API', status: process.env.DUFFEL_API_KEY ? 'Live API Active' : 'Inactive', category: 'Live Flight Fares' },
      { name: 'Photon / OpenStreetMap API', status: 'Live Active', category: 'City & Location Autocomplete' },
      { name: 'Luma Public API', status: 'Live Active', category: 'Event Discovery' },
      { name: 'Apple PassKit & Google Wallet API', status: 'Live Active', category: 'Digital Pass Generation' },
    ],
  });
});

module.exports = router;
