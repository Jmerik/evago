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

// ─── HEALTH ───────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
