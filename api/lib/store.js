const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Simple JSON-based data store for MVP.
 * On Vercel (read-only filesystem), writes go to /tmp.
 * Replace with a real database (Postgres, Supabase) for production.
 */

const SEED_CALENDARS = [
  { id: '1', name: 'TOKEN2049 Official', lumaApiKey: 'demo-key-token2049', region: 'singapore', city: 'Singapore', country: 'Singapore', isActive: true },
  { id: '2', name: 'Singapore Blockchain Week', lumaApiKey: 'demo-key-sbw', region: 'singapore', city: 'Singapore', country: 'Singapore', isActive: true },
  { id: '3', name: 'Web3 Summit APAC', lumaApiKey: 'demo-key-web3summit', region: 'bangkok', city: 'Bangkok', country: 'Thailand', isActive: true },
  { id: '4', name: 'Thailand Crypto Expo', lumaApiKey: 'demo-key-tce', region: 'bangkok', city: 'Bangkok', country: 'Thailand', isActive: true },
  { id: '5', name: 'Dubai Blockchain Summit', lumaApiKey: 'demo-key-dbs', region: 'dubai', city: 'Dubai', country: 'UAE', isActive: true },
];

const DATA_FILE = process.env.VERCEL
  ? '/tmp/evago-store.json'
  : path.resolve(__dirname, '../../data/store.json');

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readStore() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    const initial = {
      organizerCalendars: SEED_CALENDARS,
      itineraryItems: [],
      publicCustomEvents: [],
      savedPasses: [],
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  if (!raw.organizerCalendars || raw.organizerCalendars.length === 0) {
    raw.organizerCalendars = SEED_CALENDARS;
  }
  if (!raw.publicCustomEvents) raw.publicCustomEvents = [];
  if (!raw.savedPasses) raw.savedPasses = [];
  return raw;
}

function writeStore(data) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getOrganizerCalendars(region) {
  const store = readStore();
  let calendars = store.organizerCalendars.filter(c => c.isActive);
  if (region) {
    calendars = calendars.filter(c => c.region === region.toLowerCase());
  }
  return calendars;
}

function getRegions() {
  const store = readStore();
  const regionMap = new Map();
  for (const cal of store.organizerCalendars.filter(c => c.isActive)) {
    if (!regionMap.has(cal.region)) {
      regionMap.set(cal.region, { region: cal.region, city: cal.city, country: cal.country });
    }
  }
  return Array.from(regionMap.values());
}

function addItineraryItem(item) {
  const store = readStore();
  store.itineraryItems.push(item);
  writeStore(store);
}

function getItinerary(userId) {
  const store = readStore();
  return store.itineraryItems.filter(i => i.userId === userId);
}

function seed(calendars) {
  const store = readStore();
  store.organizerCalendars = calendars;
  if (!store.publicCustomEvents) store.publicCustomEvents = [];
  if (!store.savedPasses) store.savedPasses = [];
  writeStore(store);
}

function getPublicCustomEvents(region) {
  const store = readStore();
  if (!store.publicCustomEvents) return [];
  return store.publicCustomEvents.filter(e => e.region === region.toLowerCase());
}

function addPublicCustomEvent(event) {
  const store = readStore();
  if (!store.publicCustomEvents) store.publicCustomEvents = [];
  store.publicCustomEvents.push(event);
  writeStore(store);
}

function savePass(passData) {
  const store = readStore();
  if (!store.savedPasses) store.savedPasses = [];
  store.savedPasses.push(passData);
  writeStore(store);
}

function getLatestPass(userId = 'default-user') {
  const store = readStore();
  if (!store.savedPasses || store.savedPasses.length === 0) return null;
  const userPasses = store.savedPasses.filter(p => p.userId === userId);
  return userPasses.length > 0 ? userPasses[userPasses.length - 1] : null;
}

module.exports = {
  readStore,
  writeStore,
  getOrganizerCalendars,
  getRegions,
  addItineraryItem,
  getItinerary,
  seed,
  getPublicCustomEvents,
  addPublicCustomEvent,
  savePass,
  getLatestPass,
  SEED_CALENDARS,
};
