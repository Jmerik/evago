import fs from 'fs';
import path from 'path';

/**
 * Simple JSON-based data store for MVP.
 * Reads/writes to a local JSON file — zero native dependencies.
 * Replace with a real database (Postgres, Supabase, PlanetScale) for production.
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

const DATA_FILE = path.resolve(__dirname, '../data/store.json');

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readStore(): DataStore {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    const empty: DataStore = { organizerCalendars: [], itineraryItems: [], publicCustomEvents: [], savedPasses: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(empty, null, 2));
    return empty;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
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

  /** Used by seed script */
  seed(calendars: OrganizerCalendar[]) {
    const store = readStore();
    store.organizerCalendars = calendars;
    if (!store.publicCustomEvents) store.publicCustomEvents = [];
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
    const userPasses = store.savedPasses.filter(p => p.userId === userId);
    return userPasses.length > 0 ? userPasses[userPasses.length - 1] : null;
  }
};
