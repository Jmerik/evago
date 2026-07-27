import * as fs from 'fs';
import * as path from 'path';

/**
 * Simple JSON-based data store for MVP.
 * On Vercel (read-only filesystem), writes go to /tmp.
 * Replace with a real database (Postgres, Supabase) for production.
 */

export interface OrganizerCalendar {
  id: string;
  name: string;
  lumaApiKey: string;
  region: string;
  city: string;
  country: string;
  isActive: boolean;
}

export interface ItineraryItem {
  userId: string;
  eventId: string;
  eventName: string;
  status: string;
  addedAt: string;
}

interface DataStore {
  organizerCalendars: OrganizerCalendar[];
  itineraryItems: ItineraryItem[];
  publicCustomEvents: any[];
  savedPasses: any[];
}

// On Vercel the project root is read-only; use /tmp for mutable data
const DATA_FILE = process.env.VERCEL
  ? '/tmp/evago-store.json'
  : path.resolve(__dirname, '../data/store.json');

const SEED_CALENDARS: OrganizerCalendar[] = [
  { id: '1', name: 'TOKEN2049 Official', lumaApiKey: 'demo-key-token2049', region: 'singapore', city: 'Singapore', country: 'Singapore', isActive: true },
  { id: '2', name: 'Singapore Blockchain Week', lumaApiKey: 'demo-key-sbw', region: 'singapore', city: 'Singapore', country: 'Singapore', isActive: true },
  { id: '3', name: 'Web3 Summit APAC', lumaApiKey: 'demo-key-web3summit', region: 'bangkok', city: 'Bangkok', country: 'Thailand', isActive: true },
  { id: '4', name: 'Thailand Crypto Expo', lumaApiKey: 'demo-key-tce', region: 'bangkok', city: 'Bangkok', country: 'Thailand', isActive: true },
  { id: '5', name: 'Dubai Blockchain Summit', lumaApiKey: 'demo-key-dbs', region: 'dubai', city: 'Dubai', country: 'UAE', isActive: true },
];

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readStore(): DataStore {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    const initial: DataStore = {
      organizerCalendars: SEED_CALENDARS,
      itineraryItems: [],
      publicCustomEvents: [],
      savedPasses: [],
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as DataStore;
  // Ensure seed calendars are always present (Vercel /tmp resets between cold starts)
  if (!raw.organizerCalendars || raw.organizerCalendars.length === 0) {
    raw.organizerCalendars = SEED_CALENDARS;
  }
  return raw;
}

function writeStore(data: DataStore) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export const db = {
  getOrganizerCalendars(region?: string): OrganizerCalendar[] {
    const store = readStore();
    let calendars = store.organizerCalendars.filter(c => c.isActive);
    if (region) {
      calendars = calendars.filter(c => c.region === region.toLowerCase());
    }
    return calendars;
  },

  getRegions(): { region: string; city: string; country: string }[] {
    const store = readStore();
    const regionMap = new Map<string, { region: string; city: string; country: string }>();
    for (const cal of store.organizerCalendars.filter(c => c.isActive)) {
      if (!regionMap.has(cal.region)) {
        regionMap.set(cal.region, { region: cal.region, city: cal.city, country: cal.country });
      }
    }
    return Array.from(regionMap.values());
  },

  addItineraryItem(item: ItineraryItem) {
    const store = readStore();
    store.itineraryItems.push(item);
    writeStore(store);
  },

  getItinerary(userId: string): ItineraryItem[] {
    const store = readStore();
    return store.itineraryItems.filter(i => i.userId === userId);
  },

  seed(calendars: OrganizerCalendar[]) {
    const store = readStore();
    store.organizerCalendars = calendars;
    if (!store.publicCustomEvents) store.publicCustomEvents = [];
    if (!store.savedPasses) store.savedPasses = [];
    writeStore(store);
  },

  getPublicCustomEvents(region: string): any[] {
    const store = readStore();
    if (!store.publicCustomEvents) return [];
    return store.publicCustomEvents.filter(e => e.region === region.toLowerCase());
  },

  addPublicCustomEvent(event: any) {
    const store = readStore();
    if (!store.publicCustomEvents) store.publicCustomEvents = [];
    store.publicCustomEvents.push(event);
    writeStore(store);
  },

  savePass(passData: any) {
    const store = readStore();
    if (!store.savedPasses) store.savedPasses = [];
    store.savedPasses.push(passData);
    writeStore(store);
  },

  getLatestPass(userId: string = 'default-user'): any | null {
    const store = readStore();
    if (!store.savedPasses || store.savedPasses.length === 0) return null;
    const userPasses = store.savedPasses.filter((p: any) => p.userId === userId);
    return userPasses.length > 0 ? userPasses[userPasses.length - 1] : null;
  }
};
