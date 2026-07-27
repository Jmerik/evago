const express = require('express');
const axios = require('axios');
const store = require('../lib/store');

const router = express.Router();

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

router.get('/regions', (_req, res) => {
  res.json({ success: true, regions: store.getRegions() });
});

router.get('/events', async (req, res) => {
  const { region } = req.query;
  if (!region || typeof region !== 'string') {
    return res.status(400).json({ error: 'Region query parameter is required' });
  }

  const calendars = store.getOrganizerCalendars(region);
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
            id: `luma-${entry.id}`,
            source: 'luma',
            sourceId: entry.id,
            name: entry.name,
            type: entry.access === 'manage' ? 'main_conference' : 'side_event',
            startAt: entry.start_at,
            endAt: entry.end_at,
            venue: {
              address: geo.address || 'TBA',
              city: geo.city || cal.city,
              fullAddress: geo.full_address || geo.address || 'Address details in pass',
            },
            organizerCalendar: cal.name,
          });
        }
      } catch (err) {
        console.error(`Failed to fetch from calendar "${cal.name}":`, err.message);
      }
    }
  }

  const publicCustom = store.getPublicCustomEvents(region);
  allEvents.push(...publicCustom);
  allEvents.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  res.json({ success: true, events: allEvents });
});

router.post('/custom-event', (req, res) => {
  const { event } = req.body;
  if (!event || !event.region) {
    return res.status(400).json({ error: 'Event object with region is required' });
  }

  const newEvent = {
    ...event,
    id: `public-custom-${Date.now()}`,
    source: 'custom_public',
    type: 'side_event',
  };

  store.addPublicCustomEvent(newEvent);
  res.json({ success: true, event: newEvent });
});

module.exports = router;
