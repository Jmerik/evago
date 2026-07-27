const http = require('http');

const base = 'localhost';
const port = 3001;

const tests = [
  // Health
  { method: 'GET', path: '/api/health' },

  // Discovery
  { method: 'GET', path: '/api/discovery/regions' },
  { method: 'GET', path: '/api/discovery/events?region=singapore' },

  // Autocomplete
  { method: 'GET', path: '/api/autocomplete/destinations?q=sin' },

  // Travel search — NEW format with segments
  {
    method: 'POST',
    path: '/api/travel/search',
    body: {
      segments: [
        {
          from: 'London (LHR)',
          to: 'Singapore',
          departDate: '2026-09-17',
          arriveBy: '2026-09-18T08:00:00+08:00',
        },
      ],
      returnLeg: {
        from: 'Singapore',
        to: 'London (LHR)',
        departDate: '2026-09-22',
      },
    },
  },

  // Travel search — multi-segment with arrival deadlines and no return
  {
    method: 'POST',
    path: '/api/travel/search',
    body: {
      segments: [
        {
          from: 'London (LHR)',
          to: 'Singapore',
          departDate: '2026-09-17',
          arriveBy: '2026-09-18T08:00:00+08:00',
        },
        {
          from: 'Singapore',
          to: 'Bangkok',
          departDate: '2026-09-18',
          arriveBy: '2026-09-20T09:00:00+07:00',
        },
      ],
      returnLeg: null,
    },
  },

  // Travel search — simulate frontend payload (same-day arrival cutoff)
  {
    method: 'POST',
    path: '/api/travel/search',
    body: {
      segments: [
        {
          from: 'London (LHR)',
          to: 'Singapore',
          departDate: '2026-09-18',
          arriveBy: '2026-09-18T08:30:00+08:00',
        },
      ],
      returnLeg: { from: 'Singapore', to: 'London (LHR)', departDate: '2026-09-21' },
    },
  },

  // Travel search — legacy compat no return
  {
    method: 'POST',
    path: '/api/travel/search',
    body: {
      departure: 'London (LHR)',
      returnPlace: 'London (LHR)',
      destinations: ['Singapore'],
      startDate: '2026-09-17',
      endDate: '',
    },
  },

  // Travel search — missing segments should 400
  { method: 'POST', path: '/api/travel/search', body: {} },

  // Luma
  { method: 'POST', path: '/api/luma/validate', body: { apiKey: 'test-key' } },

  // Itinerary
  { method: 'POST', path: '/api/itinerary/pass', body: { itinerary: [{ name: 'Test Event' }], booking: {} } },
  { method: 'GET', path: '/api/itinerary/pass?userId=default-user' },

  // Custom event
  {
    method: 'POST',
    path: '/api/discovery/custom-event',
    body: { event: { name: 'Test', region: 'singapore', date: '2026-09-18' } },
  },
];

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const req = http.request(
      { hostname: base, port, path, method, headers: body ? { 'Content-Type': 'application/json' } : {} },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function main() {
  for (const t of tests) {
    try {
      const res = await request(t.method, t.path, t.body);
      console.log(`${res.status} ${t.method} ${t.path}`);
      if (res.body && typeof res.body === 'object') {
        console.log(JSON.stringify(res.body, null, 2).substring(0, 800));
      } else {
        console.log(res.body ? res.body.substring(0, 800) : '');
      }
    } catch (err) {
      console.log(`ERROR ${t.method} ${t.path}: ${err.message}`);
    }
    console.log('---');
  }
}

main();
