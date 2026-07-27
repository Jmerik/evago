const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// ─── DATA STORE ───────────────────────────────────────────────
const SEED_CALENDARS = [
  { id: '1', name: 'TOKEN2049 Official', lumaApiKey: 'demo-key-token2049', region: 'singapore', city: 'Singapore', country: 'Singapore', isActive: true },
  { id: '2', name: 'Singapore Blockchain Week', lumaApiKey: 'demo-key-sbw', region: 'singapore', city: 'Singapore', country: 'Singapore', isActive: true },
  { id: '3', name: 'Web3 Summit APAC', lumaApiKey: 'demo-key-web3summit', region: 'bangkok', city: 'Bangkok', country: 'Thailand', isActive: true },
  { id: '4', name: 'Thailand Crypto Expo', lumaApiKey: 'demo-key-tce', region: 'bangkok', city: 'Bangkok', country: 'Thailand', isActive: true },
  { id: '5', name: 'Dubai Blockchain Summit', lumaApiKey: 'demo-key-dbs', region: 'dubai', city: 'Dubai', country: 'UAE', isActive: true },
];

const DATA_FILE = process.env.VERCEL
  ? '/tmp/evago-store.json'
  : path.resolve(__dirname, '../data/store.json');

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readStore() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    const initial = { organizerCalendars: SEED_CALENDARS, itineraryItems: [], publicCustomEvents: [], savedPasses: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  if (!raw.organizerCalendars || raw.organizerCalendars.length === 0) raw.organizerCalendars = SEED_CALENDARS;
  if (!raw.publicCustomEvents) raw.publicCustomEvents = [];
  if (!raw.savedPasses) raw.savedPasses = [];
  return raw;
}

function writeStore(data) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ─── MOCK EVENT DATA ──────────────────────────────────────────
const mockEventsByKey = {
  'demo-key-token2049': [
    { id: 'evt-token2049-main', name: 'TOKEN2049 Singapore', type: 'main_conference', startAt: '2026-09-18T09:00:00+08:00', endAt: '2026-09-19T18:00:00+08:00', venue: { address: '10 Bayfront Ave', city: 'Singapore', fullAddress: 'Marina Bay Sands, 10 Bayfront Ave, Singapore 018956' } },
    { id: 'evt-token2049-vc-breakfast', name: 'VC Networking Breakfast', type: 'side_event', startAt: '2026-09-18T08:00:00+08:00', endAt: '2026-09-18T10:00:00+08:00', venue: { address: '1 Fullerton Rd', city: 'Singapore', fullAddress: 'The Fullerton Hotel, 1 Fullerton Rd, Singapore 049213' } },
    { id: 'evt-token2049-founders-dinner', name: 'Founders Dinner', type: 'vip_dinner', startAt: '2026-09-18T19:30:00+08:00', endAt: '2026-09-18T22:30:00+08:00', venue: { address: 'Ce La Vi', city: 'Singapore', fullAddress: 'Ce La Vi, Marina Bay Sands SkyPark, Tower 3' } },
  ],
  'demo-key-sbw': [
    { id: 'evt-sbw-main', name: 'Singapore Blockchain Week', type: 'main_conference', startAt: '2026-09-20T09:00:00+08:00', endAt: '2026-09-22T17:00:00+08:00', venue: { address: 'Suntec City', city: 'Singapore', fullAddress: 'Suntec Singapore Convention Centre, 1 Raffles Blvd' } },
    { id: 'evt-sbw-defi-workshop', name: 'DeFi Builder Workshop', type: 'workshop', startAt: '2026-09-20T14:00:00+08:00', endAt: '2026-09-20T17:00:00+08:00', venue: { address: 'WeWork Suntec', city: 'Singapore', fullAddress: 'WeWork, Suntec Tower 5, Level 12' } },
  ],
  'demo-key-web3summit': [
    { id: 'evt-web3summit-main', name: 'Web3 Summit APAC', type: 'main_conference', startAt: '2026-10-10T09:00:00+07:00', endAt: '2026-10-12T18:00:00+07:00', venue: { address: 'Bitec Bangna', city: 'Bangkok', fullAddress: 'BITEC, 88 Bangna-Trad Rd, Bangkok 10260' } },
    { id: 'evt-web3summit-ai-panel', name: 'AI x Web3 Panel Discussion', type: 'side_event', startAt: '2026-10-11T10:00:00+07:00', endAt: '2026-10-11T12:00:00+07:00', venue: { address: 'Emporium Tower', city: 'Bangkok', fullAddress: 'Emporium Tower, Sukhumvit 24, Bangkok' } },
  ],
  'demo-key-tce': [
    { id: 'evt-tce-main', name: 'Thailand Crypto Expo', type: 'main_conference', startAt: '2026-10-14T09:00:00+07:00', endAt: '2026-10-15T17:00:00+07:00', venue: { address: 'Royal Paragon Hall', city: 'Bangkok', fullAddress: 'Royal Paragon Hall, Siam Paragon, Bangkok' } },
  ],
  'demo-key-dbs': [
    { id: 'evt-dbs-main', name: 'Dubai Blockchain Summit', type: 'main_conference', startAt: '2026-11-05T09:00:00+04:00', endAt: '2026-11-06T17:00:00+04:00', venue: { address: 'DWTC', city: 'Dubai', fullAddress: 'Dubai World Trade Centre, Sheikh Zayed Rd, Dubai' } },
    { id: 'evt-dbs-networking', name: 'MENA Investor Networking Night', type: 'networking', startAt: '2026-11-05T19:00:00+04:00', endAt: '2026-11-05T23:00:00+04:00', venue: { address: 'Atlantis', city: 'Dubai', fullAddress: 'Atlantis The Royal, Palm Jumeirah, Dubai' } },
  ],
};

// ─── DISCOVERY ROUTES ─────────────────────────────────────────
app.get('/api/discovery/regions', (_req, res) => {
  const store = readStore();
  const regionMap = new Map();
  for (const cal of store.organizerCalendars.filter(c => c.isActive)) {
    if (!regionMap.has(cal.region)) {
      regionMap.set(cal.region, { region: cal.region, city: cal.city, country: cal.country });
    }
  }
  res.json({ success: true, regions: Array.from(regionMap.values()) });
});

app.get('/api/discovery/events', async (req, res) => {
  const { region } = req.query;
  if (!region || typeof region !== 'string') {
    return res.status(400).json({ error: 'Region query parameter is required' });
  }

  const store = readStore();
  const calendars = store.organizerCalendars.filter(c => c.isActive && c.region === region.toLowerCase());

  if (calendars.length === 0) {
    return res.json({ success: true, events: [], message: 'No partner calendars for this region yet.' });
  }

  const allEvents = [];

  for (const cal of calendars) {
    if (cal.lumaApiKey.startsWith('demo-key-')) {
      const mockEvents = mockEventsByKey[cal.lumaApiKey] || [];
      allEvents.push(...mockEvents.map(e => ({ ...e, source: 'luma', organizerCalendar: cal.name })));
    } else {
      try {
        const response = await axios.get('https://public-api.luma.com/v1/calendars/events/list', {
          headers: { 'x-luma-api-key': cal.lumaApiKey },
          params: { access: ['manage', 'view'] },
          timeout: 10000,
        });
        const entries = response.data.entries || [];
        for (const entry of entries) {
          const geo = entry.geo_address_json || {};
          allEvents.push({
            id: `luma-${entry.id}`, source: 'luma', sourceId: entry.id, name: entry.name,
            type: entry.access === 'manage' ? 'main_conference' : 'side_event',
            startAt: entry.start_at, endAt: entry.end_at,
            venue: { address: geo.address || 'TBA', city: geo.city || cal.city, fullAddress: geo.full_address || geo.address || 'Address details in pass' },
            organizerCalendar: cal.name,
          });
        }
      } catch (err) {
        console.error(`Failed to fetch from calendar "${cal.name}":`, err.message);
      }
    }
  }

  // Include public custom events for this region
  const publicCustom = (store.publicCustomEvents || []).filter(e => e.region === region.toLowerCase());
  allEvents.push(...publicCustom);

  allEvents.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  res.json({ success: true, events: allEvents });
});

app.post('/api/discovery/custom-event', (req, res) => {
  const { event } = req.body;
  if (!event || !event.region) {
    return res.status(400).json({ error: 'Event object with region is required' });
  }
  const newEvent = { ...event, id: `public-custom-${Date.now()}`, source: 'custom_public', type: 'side_event' };
  const store = readStore();
  store.publicCustomEvents.push(newEvent);
  writeStore(store);
  res.json({ success: true, event: newEvent });
});

// ─── LUMA ROUTES ──────────────────────────────────────────────
app.post('/api/luma/validate', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API key is required' });
  if (apiKey === 'test-key') return res.json({ valid: true, demo: true });
  try {
    await axios.get('https://public-api.luma.com/v1/calendars/events/list', {
      headers: { 'x-luma-api-key': apiKey }, params: { limit: 1 }, timeout: 5000,
    });
    res.json({ valid: true });
  } catch {
    res.status(401).json({ valid: false, error: 'Invalid API key' });
  }
});

app.post('/api/luma/events', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API key is required' });
  if (apiKey === 'test-key') {
    return res.json({
      events: [
        { id: 'demo-main', name: 'TOKEN2049 Singapore', type: 'main_conference', rsvpStatus: 'Going', startAt: '2026-09-18T09:00:00+08:00', endAt: '2026-09-19T18:00:00+08:00', venue: { city: 'Singapore', fullAddress: 'Marina Bay Sands, 10 Bayfront Ave, Singapore' } },
        { id: 'demo-side-1', name: 'VC Networking Breakfast', type: 'side_event', rsvpStatus: 'Going', startAt: '2026-09-18T08:00:00+08:00', endAt: '2026-09-18T10:00:00+08:00', venue: { city: 'Singapore', fullAddress: 'The Fullerton Hotel' } },
      ],
    });
  }
  try {
    const response = await axios.get('https://public-api.luma.com/v1/calendars/events/list', {
      headers: { 'x-luma-api-key': apiKey }, timeout: 10000,
    });
    const entries = response.data.entries || [];
    const events = entries.map(entry => {
      const geo = entry.geo_address_json || {};
      return { id: entry.id, name: entry.name, type: entry.access === 'manage' ? 'main_conference' : 'side_event', rsvpStatus: 'Synced', startAt: entry.start_at, endAt: entry.end_at, venue: { city: geo.city || '', fullAddress: geo.full_address || geo.address || '' } };
    });
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Luma events' });
  }
});

// ─── ITINERARY ROUTES ─────────────────────────────────────────
app.post('/api/itinerary/pass', (req, res) => {
  const { itinerary, booking, userId = 'default-user' } = req.body;
  if (!itinerary || !Array.isArray(itinerary)) {
    return res.status(400).json({ error: 'Valid itinerary array is required' });
  }
  const passRecord = { id: `pass-${Date.now()}`, userId, itinerary, booking: booking || null, createdAt: new Date().toISOString() };
  const store = readStore();
  store.savedPasses.push(passRecord);
  writeStore(store);
  res.json({ success: true, pass: passRecord });
});

app.get('/api/itinerary/pass', (req, res) => {
  const userId = req.query.userId || 'default-user';
  const store = readStore();
  const userPasses = (store.savedPasses || []).filter(p => p.userId === userId);
  const pass = userPasses.length > 0 ? userPasses[userPasses.length - 1] : null;
  res.json({ success: true, pass });
});

// ─── IATA AIRPORT CODE DIRECTORY ──────────────────────────────
const IATA_MAP = {
  FRA: { city: 'Frankfurt', country: 'Germany', name: 'Frankfurt Airport (FRA)' },
  SIN: { city: 'Singapore', country: 'Singapore', name: 'Singapore Changi Airport (SIN)' },
  BKK: { city: 'Bangkok', country: 'Thailand', name: 'Suvarnabhumi Airport (BKK)' },
  DMK: { city: 'Bangkok', country: 'Thailand', name: 'Don Mueang Airport (DMK)' },
  DXB: { city: 'Dubai', country: 'UAE', name: 'Dubai International Airport (DXB)' },
  DOH: { city: 'Doha', country: 'Qatar', name: 'Hamad International Airport (DOH)' },
  AUH: { city: 'Abu Dhabi', country: 'UAE', name: 'Zayed International Airport (AUH)' },
  HND: { city: 'Tokyo', country: 'Japan', name: 'Haneda Airport (HND)' },
  NRT: { city: 'Tokyo', country: 'Japan', name: 'Narita International Airport (NRT)' },
  KIX: { city: 'Osaka', country: 'Japan', name: 'Kansai International Airport (KIX)' },
  ICN: { city: 'Seoul', country: 'South Korea', name: 'Incheon International Airport (ICN)' },
  HKG: { city: 'Hong Kong', country: 'Hong Kong', name: 'Hong Kong International Airport (HKG)' },
  TPE: { city: 'Taipei', country: 'Taiwan', name: 'Taoyuan International Airport (TPE)' },
  SGN: { city: 'Ho Chi Minh City', country: 'Vietnam', name: 'Tan Son Nhat Airport (SGN)' },
  HAN: { city: 'Hanoi', country: 'Vietnam', name: 'Noi Bai International Airport (HAN)' },
  KUL: { city: 'Kuala Lumpur', country: 'Malaysia', name: 'Kuala Lumpur Airport (KUL)' },
  CGK: { city: 'Jakarta', country: 'Indonesia', name: 'Soekarno-Hatta Airport (CGK)' },
  DPS: { city: 'Bali', country: 'Indonesia', name: 'Ngurah Rai Airport (DPS)' },
  MNL: { city: 'Manila', country: 'Philippines', name: 'Ninoy Aquino Airport (MNL)' },
  LHR: { city: 'London', country: 'United Kingdom', name: 'Heathrow Airport (LHR)' },
  LGW: { city: 'London', country: 'United Kingdom', name: 'Gatwick Airport (LGW)' },
  CDG: { city: 'Paris', country: 'France', name: 'Charles de Gaulle Airport (CDG)' },
  ORY: { city: 'Paris', country: 'France', name: 'Orly Airport (ORY)' },
  AMS: { city: 'Amsterdam', country: 'Netherlands', name: 'Schiphol Airport (AMS)' },
  BER: { city: 'Berlin', country: 'Germany', name: 'Berlin Brandenburg Airport (BER)' },
  MUC: { city: 'Munich', country: 'Germany', name: 'Munich Airport (MUC)' },
  ZRH: { city: 'Zurich', country: 'Switzerland', name: 'Zurich Airport (ZRH)' },
  VIE: { city: 'Vienna', country: 'Austria', name: 'Vienna International Airport (VIE)' },
  FCO: { city: 'Rome', country: 'Italy', name: 'Leonardo da Vinci–Fiumicino Airport (FCO)' },
  MXP: { city: 'Milan', country: 'Italy', name: 'Malpensa Airport (MXP)' },
  MAD: { city: 'Madrid', country: 'Spain', name: 'Adolfo Suárez Madrid–Barajas (MAD)' },
  BCN: { city: 'Barcelona', country: 'Spain', name: 'Josep Tarradellas Barcelona-El Prat (BCN)' },
  CPH: { city: 'Copenhagen', country: 'Denmark', name: 'Copenhagen Airport (CPH)' },
  ARN: { city: 'Stockholm', country: 'Sweden', name: 'Stockholm Arlanda Airport (ARN)' },
  OSL: { city: 'Oslo', country: 'Norway', name: 'Oslo Airport (OSL)' },
  HEL: { city: 'Helsinki', country: 'Finland', name: 'Helsinki Airport (HEL)' },
  JFK: { city: 'New York', country: 'United States', name: 'John F. Kennedy Airport (JFK)' },
  EWR: { city: 'New York', country: 'United States', name: 'Newark Liberty Airport (EWR)' },
  LGA: { city: 'New York', country: 'United States', name: 'LaGuardia Airport (LGA)' },
  LAX: { city: 'Los Angeles', country: 'United States', name: 'Los Angeles International (LAX)' },
  SFO: { city: 'San Francisco', country: 'United States', name: 'San Francisco International (SFO)' },
  ORD: { city: 'Chicago', country: 'United States', name: 'O\'Hare International Airport (ORD)' },
  MIA: { city: 'Miami', country: 'United States', name: 'Miami International Airport (MIA)' },
  SEA: { city: 'Seattle', country: 'United States', name: 'Seattle-Tacoma International (SEA)' },
  BOS: { city: 'Boston', country: 'United States', name: 'Logan International Airport (BOS)' },
  DEN: { city: 'Denver', country: 'United States', name: 'Denver International Airport (DEN)' },
  DFW: { city: 'Dallas', country: 'United States', name: 'Dallas/Fort Worth International (DFW)' },
  ATL: { city: 'Atlanta', country: 'United States', name: 'Hartsfield-Jackson Atlanta (ATL)' },
  YVR: { city: 'Vancouver', country: 'Canada', name: 'Vancouver International Airport (YVR)' },
  YYZ: { city: 'Toronto', country: 'Canada', name: 'Toronto Pearson International (YYZ)' },
  SYD: { city: 'Sydney', country: 'Australia', name: 'Sydney Kingsford Smith Airport (SYD)' },
  MEL: { city: 'Melbourne', country: 'Australia', name: 'Melbourne Airport (MEL)' },
  AKL: { city: 'Auckland', country: 'New Zealand', name: 'Auckland Airport (AKL)' },
  DEL: { city: 'New Delhi', country: 'India', name: 'Indira Gandhi International (DEL)' },
  BOM: { city: 'Mumbai', country: 'India', name: 'Chhatrapati Shivaji Maharaj (BOM)' },
  BLR: { city: 'Bengaluru', country: 'India', name: 'Kempegowda International (BLR)' },
  MEX: { city: 'Mexico City', country: 'Mexico', name: 'Benito Juárez International (MEX)' },
  GRU: { city: 'São Paulo', country: 'Brazil', name: 'Guarulhos International Airport (GRU)' },
  EZE: { city: 'Buenos Aires', country: 'Argentina', name: 'Ezeiza International Airport (EZE)' },
  CAI: { city: 'Cairo', country: 'Egypt', name: 'Cairo International Airport (CAI)' },
  JNB: { city: 'Johannesburg', country: 'South Africa', name: 'O. R. Tambo International (JNB)' },
  CPT: { city: 'Cape Town', country: 'South Africa', name: 'Cape Town International (CPT)' },
};

// ─── DESTINATION AUTOCOMPLETE (proxy to Photon with IATA + City filtering) ──
app.get('/api/autocomplete/destinations', async (req, res) => {
  const rawQ = (req.query.q || '').trim();
  if (rawQ.length < 2) return res.json({ suggestions: [] });

  const upperQ = rawQ.toUpperCase();
  const suggestions = [];

  // Check exact 3-letter IATA code match first
  if (upperQ.length === 3 && IATA_MAP[upperQ]) {
    const item = IATA_MAP[upperQ];
    suggestions.push({
      display: `${item.city} (${upperQ}), ${item.country}`,
      city: item.city,
      country: item.country,
      iata: upperQ,
    });
  }

  try {
    const { data } = await axios.get('https://photon.komoot.io/api/', {
      params: { q: rawQ, limit: 10, lang: 'en' },
      timeout: 4000,
    });

    const photonItems = (data.features || [])
      .filter(f => {
        const p = f.properties || {};
        const type = (p.type || '').toLowerCase();
        const osmVal = (p.osm_value || '').toLowerCase();

        // SKIP countries, continents, broad states/regions
        if (type === 'country' || osmVal === 'country' || type === 'continent') return false;
        if ((type === 'state' || osmVal === 'state' || osmVal === 'province') && !p.city && !p.town) return false;

        return true;
      })
      .map(f => {
        const p = f.properties || {};
        const name = p.name || '';
        const city = p.city || p.town || p.village || p.county || '';
        const country = p.country || '';

        // If the name is just a country, skip
        if (country && name.toLowerCase() === country.toLowerCase()) return null;

        // Build clean "City/Place, Country" string
        const mainLabel = name || city;
        let display = mainLabel;
        if (city && city !== mainLabel) display += `, ${city}`;
        if (country) display += `, ${country}`;

        return { display, city: city || mainLabel, country, lat: f.geometry?.coordinates?.[1], lon: f.geometry?.coordinates?.[0] };
      })
      .filter(Boolean);

    for (const item of photonItems) {
      if (!suggestions.some(s => s.display === item.display)) {
        suggestions.push(item);
      }
    }

    res.json({ suggestions: suggestions.slice(0, 6) });
  } catch (err) {
    console.error('Autocomplete proxy error:', err.message);
    res.json({ suggestions: suggestions.slice(0, 6) });
  }
});

// ─── HEALTH ───────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
