import { Router, Request, Response } from 'express';
import axios from 'axios';

export const lumaRouter = Router();

const lumaApi = axios.create({
  baseURL: 'https://public-api.luma.com',
  timeout: 10000,
});

lumaRouter.post('/validate', async (req: Request, res: Response) => {
  const { apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ error: 'Missing apiKey' });
  }

  // Support a mock test key for development
  if (apiKey === 'test-key') {
    return res.json({ success: true, calendar: { id: 'cal-mock', name: 'Mock Calendar' } });
  }

  try {
    const response = await lumaApi.get('/v1/calendars/get', {
      headers: { 'x-luma-api-key': apiKey }
    });
    return res.json({ success: true, calendar: response.data });
  } catch (error: any) {
    console.error('Luma validation error:', error.response?.data || error.message);
    return res.status(401).json({ error: 'Invalid API Key or API error' });
  }
});

lumaRouter.post('/events', async (req: Request, res: Response) => {
  const { apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ error: 'Missing apiKey' });
  }

  if (apiKey === 'test-key') {
    return res.json({
      success: true,
      events: [
        {
          id: 'evt-token2049',
          name: 'TOKEN2049 Singapore (Mock)',
          type: 'main_conference',
          startAt: '2026-09-18T00:00:00Z',
          venue: { city: 'Singapore', fullAddress: 'Marina Bay Sands' },
          rsvpStatus: 'going'
        },
        {
          id: 'evt-side1',
          name: 'VC Breakfast (Mock)',
          type: 'side_event',
          startAt: '2026-09-18T08:00:00Z',
          venue: { city: 'Singapore', fullAddress: 'Fullerton Hotel' },
          rsvpStatus: 'going'
        }
      ]
    });
  }

  try {
    const response = await lumaApi.get('/v1/calendars/events/list', {
      headers: { 'x-luma-api-key': apiKey },
      params: { access: ['manage', 'view'] } // Using array format for axios
    });
    
    const entries = response.data.entries || [];
    const normalizedEvents = entries.map((entry: any) => {
      const geo = entry.geo_address_json || {};
      return {
        id: `luma-${entry.id}`,
        source: 'luma',
        sourceId: entry.id,
        name: entry.name,
        type: entry.access === 'manage' ? 'main_conference' : 'side_event',
        startAt: entry.start_at,
        endAt: entry.end_at,
        timezone: entry.timezone,
        venue: {
          address: geo.address || 'TBA',
          city: geo.city || null,
          fullAddress: geo.full_address || geo.address || 'Address details in pass',
        },
        rsvpStatus: 'going',
      };
    });

    return res.json({ success: true, events: normalizedEvents });
  } catch (error: any) {
    console.error('Luma events error:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({ error: 'Failed to fetch events from Luma' });
  }
});
