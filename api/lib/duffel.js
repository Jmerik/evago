const axios = require('axios');

const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY;

const duffelApi = axios.create({
  baseURL: 'https://api.duffel.com/air',
  timeout: 15000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Duffel-Version': 'v2',
  },
});

function parseISOToMinutes(isoDuration) {
  if (!isoDuration) return 9999;
  const hoursMatch = isoDuration.match(/(\d+)H/i);
  const minsMatch = isoDuration.match(/(\d+)M/i);
  const h = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const m = minsMatch ? parseInt(minsMatch[1], 10) : 0;
  return h * 60 + m;
}

function parseDuffelDuration(isoDuration) {
  if (!isoDuration) return 'Direct';
  const hoursMatch = isoDuration.match(/(\d+)H/i);
  const minsMatch = isoDuration.match(/(\d+)M/i);
  const hours = hoursMatch ? hoursMatch[1] : '0';
  const mins = minsMatch ? minsMatch[1] : '0';
  return `${hours}h ${mins}m`;
}

function formatFlightTime(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return (isoString.split('T')[1] || '').substring(0, 5);
  }
}

function formatFlightDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return isoString.split('T')[0];
  }
}

function ensureIsoDate(dateStr) {
  if (!dateStr) {
    return new Date(Date.now() + 86400000 * 21).toISOString().split('T')[0];
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  } catch {}
  return new Date(Date.now() + 86400000 * 21).toISOString().split('T')[0];
}

async function fetchDuffelOffers(origin, destination, depDate) {
  if (!DUFFEL_API_KEY) {
    console.warn('DUFFEL_API_KEY not configured; returning empty flight offers.');
    return [];
  }

  const targetDate = ensureIsoDate(depDate);

  try {
    const duffelRes = await duffelApi.post('/offer_requests', {
      data: {
        slices: [{ origin, destination, departure_date: targetDate }],
        passengers: [{ type: 'adult' }],
        cabin_class: 'economy',
      },
    }, {
      headers: { 'Authorization': `Bearer ${DUFFEL_API_KEY}` },
    });

    const rawOffers = (duffelRes.data?.data?.offers || []).slice(0, 5);
    return rawOffers.map((offer, idx) => {
      const slice = offer.slices?.[0] || {};
      const segments = slice.segments || [];
      const firstSeg = segments[0] || {};
      const lastSeg = segments[segments.length - 1] || firstSeg;
      const carrier = offer.owner || {};
      const priceVal = Math.round(parseFloat(offer.total_amount) || 0);
      const durationMins = parseISOToMinutes(slice.duration);
      const stopCount = segments.length > 1 ? segments.length - 1 : 0;

      const carrierCode = carrier.iata_code || firstSeg.operating_carrier?.iata_code || 'FL';
      const flNumOnly = firstSeg.operating_carrier_flight_number || firstSeg.marketing_carrier_flight_number || (100 + idx * 35);
      const flightNum = `${carrierCode} ${flNumOnly}`;

      return {
        id: idx,
        provider: carrier.name || 'Duffel Carrier',
        logoUrl: carrier.logo_symbol_url || carrier.logo_lockup_url || '',
        time: parseDuffelDuration(slice.duration),
        durationMins,
        departureTime: formatFlightTime(firstSeg.departing_at),
        arrivalTime: formatFlightTime(lastSeg.arriving_at),
        departureDate: formatFlightDate(firstSeg.departing_at || targetDate),
        arrivalDate: formatFlightDate(lastSeg.arriving_at || targetDate),
        rawDepartureDate: firstSeg.departing_at || targetDate,
        rawArrivalDate: lastSeg.arriving_at || targetDate,
        originIata: firstSeg.origin?.iata_code || origin,
        originName: firstSeg.origin?.name || origin,
        destIata: lastSeg.destination?.iata_code || destination,
        destName: lastSeg.destination?.name || destination,
        stops: stopCount,
        price: priceVal,
        currency: offer.total_currency || 'USD',
        type: stopCount > 0 ? `${stopCount} Stop (${segments[0]?.operating_carrier?.name || 'Connect'})` : 'Direct (Non-stop)',
        tag: stopCount === 0 ? 'comfort' : (idx === 0 ? 'time' : 'price'),
        offerId: offer.id,
        pipe: 'Duffel Live API',
        flightNumber: flightNum,
        bookingUrl: 'https://duffel.com/',
      };
    });
  } catch (err) {
    console.warn(`Duffel API error (${origin}->${destination}):`, err.response?.data || err.message);
    return [];
  }
}

module.exports = {
  fetchDuffelOffers,
  ensureIsoDate,
};
