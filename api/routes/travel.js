const express = require('express');
const { fetchDuffelOffers, ensureIsoDate } = require('../lib/duffel');
const IATA_MAP = require('../lib/iata');

const router = express.Router();

function extractIata(str) {
  if (!str) return 'SIN';
  const match = String(str).match(/\(([A-Z]{3})\)/i);
  if (match) return match[1].toUpperCase();

  const cleanStr = String(str).trim().toUpperCase();
  if (cleanStr.length === 3 && IATA_MAP[cleanStr]) return cleanStr;

  const lower = String(str).toLowerCase();
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

/**
 * POST /api/travel/search
 *
 * Body:
 *   segments: [{ from, to, departDate, arriveBy? }, ...]   // ordered outbound legs
 *   returnLeg: { from, to, departDate } | null             // optional return leg
 *
 * Behaviour:
 *   For each segment, finds flights departing on departDate and (if arriveBy is given)
 *   filters to those arriving strictly before that timestamp.
 *   If returnLeg is provided, searches that too. If null/missing, the return flight
 *   is omitted from the response.
 */
router.post('/search', async (req, res) => {
  const segmentsInput = Array.isArray(req.body.segments) ? req.body.segments : [];
  const returnLeg = req.body.returnLeg || null;
  const legacyDeparture = req.body.departure;
  const legacyReturnPlace = req.body.returnPlace;
  const legacyDestinations = Array.isArray(req.body.destinations) ? req.body.destinations : [];
  const legacyStartDate = req.body.startDate;
  const legacyEndDate = req.body.endDate;

  let segments = segmentsInput;
  let resolvedReturnLeg = returnLeg;

  // Backward compatibility: build segments + returnLeg from legacy fields
  if (segments.length === 0 && legacyDeparture && legacyDestinations.length > 0) {
    const routeStops = [legacyDeparture, ...legacyDestinations, legacyReturnPlace || legacyDeparture];
    const departDate = legacyStartDate;

    for (let i = 0; i < legacyDestinations.length; i++) {
      const legIndex = i + 1;
      const nextCity = legacyDestinations[i];

      let arriveBy = null;
      if (legIndex === 1 && segmentsInput.length === 0) {
        // For legacy usage we don't know event times; carry them through if provided
        arriveBy = req.body.firstStopArriveBy || null;
      }

      segments.push({
        from: routeStops[i],
        to: nextCity,
        departDate,
        arriveBy,
      });
    }

    if (legacyEndDate && legacyReturnPlace) {
      resolvedReturnLeg = {
        from: legacyDestinations[legacyDestinations.length - 1] || legacyDeparture,
        to: legacyReturnPlace,
        departDate: legacyEndDate,
      };
    } else {
      resolvedReturnLeg = null;
    }
  }

  if (!Array.isArray(segments) || segments.length === 0) {
    return res.status(400).json({
      error: 'segments array is required with from, to and departDate for each leg',
    });
  }

  // Validate every segment
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!seg || !seg.from || !seg.to || !seg.departDate) {
      return res.status(400).json({
        error: `Segment ${i + 1} requires from, to, and departDate`,
      });
    }
  }

  const segmentResults = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const fromIata = extractIata(seg.from);
    const toIata = extractIata(seg.to);

    const offers = await fetchDuffelOffers(fromIata, toIata, seg.departDate, seg.arriveBy || null);

    segmentResults.push({
      segmentIndex: i + 1,
      from: seg.from,
      to: seg.to,
      departDate: ensureIsoDate(seg.departDate),
      arriveBy: seg.arriveBy || null,
      isFlightLeg: true,
      options: offers,
      title: `Segment ${i + 1}: ${seg.from} ➔ ${seg.to}`,
    });
  }

  let returnOptions = [];
  let returnResult = null;

  if (resolvedReturnLeg && resolvedReturnLeg.from && resolvedReturnLeg.to && resolvedReturnLeg.departDate) {
    const fromIata = extractIata(resolvedReturnLeg.from);
    const toIata = extractIata(resolvedReturnLeg.to);
    returnOptions = await fetchDuffelOffers(fromIata, toIata, resolvedReturnLeg.departDate);
    returnResult = {
      from: resolvedReturnLeg.from,
      to: resolvedReturnLeg.to,
      departDate: ensureIsoDate(resolvedReturnLeg.departDate),
      arriveBy: resolvedReturnLeg.arriveBy || null,
      options: returnOptions,
      title: `Return: ${resolvedReturnLeg.from} ➔ ${resolvedReturnLeg.to}`,
    };
  }

  // Legacy-compatibility fields consumed by older frontend
  const dynamicSegments = segmentResults.map((seg) => ({
    segmentIndex: seg.segmentIndex,
    title: seg.title,
    from: seg.from,
    to: seg.to,
    departDate: seg.departDate,
    arriveBy: seg.arriveBy,
    isFlightLeg: true,
    options: seg.options,
  }));

  res.json({
    success: true,
    segments: segmentResults,
    returnLeg: returnResult,
    // Legacy fields
    inboundOptions: segmentResults[0]?.options || [],
    outboundOptions: returnOptions,
    returnFlightIncluded: Boolean(returnResult),
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
