const API_BASE_URL = typeof window !== 'undefined' && window.location.origin.includes('localhost')
  ? 'http://localhost:3001/api'
  : '/api';

export const evagoApi = {
  /**
   * Validate a Luma API key
   */
  async validateLumaKey(apiKey) {
    const response = await fetch(`${API_BASE_URL}/luma/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });
    if (!response.ok) {
      throw new Error('Failed to validate Luma API key');
    }
    return response.json();
  },

  /**
   * Fetch Luma events using API key
   */
  async fetchLumaEvents(apiKey) {
    const response = await fetch(`${API_BASE_URL}/luma/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch Luma events');
    }
    return response.json();
  },

  /**
   * Get available regions from partner organizer calendars
   */
  async getRegions() {
    const response = await fetch(`${API_BASE_URL}/discovery/regions`);
    if (!response.ok) {
      throw new Error('Failed to fetch regions');
    }
    return response.json();
  },

  /**
   * Get aggregated events from all organizer calendars in a region
   */
  async getEventsByRegion(region) {
    const url = new URL(`${API_BASE_URL}/discovery/events`);
    url.searchParams.append('region', region);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Failed to fetch events for region');
    }
    return response.json();
  },

  /**
   * Save a public custom event
   */
  async createCustomEvent(eventData) {
    const response = await fetch(`${API_BASE_URL}/discovery/custom-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: eventData }),
    });
    if (!response.ok) {
      throw new Error('Failed to create custom event');
    }
    return response.json();
  },

  /**
   * Save confirmed TravelPass to backend
   */
  async saveTravelPass(itinerary, booking) {
    const response = await fetch(`${API_BASE_URL}/itinerary/pass`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itinerary, booking }),
    });
    if (!response.ok) {
      throw new Error('Failed to save travel pass');
    }
    return response.json();
  },

  /**
   * Get latest saved TravelPass
   */
  async getLatestPass() {
    const response = await fetch(`${API_BASE_URL}/itinerary/pass`);
    if (!response.ok) {
      throw new Error('Failed to fetch travel pass');
    }
    return response.json();
  },
};
