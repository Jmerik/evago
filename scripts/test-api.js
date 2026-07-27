const http = require('http');

const base = 'localhost';
const port = 3001;

const tests = [
  { method: 'GET', path: '/api/health' },
  { method: 'GET', path: '/api/discovery/regions' },
  { method: 'GET', path: '/api/discovery/events?region=singapore' },
  { method: 'GET', path: '/api/autocomplete/destinations?q=sin' },
  { method: 'POST', path: '/api/travel/search', body: { departure: 'London (LHR)', returnPlace: 'London (LHR)', destinations: ['Singapore'], startDate: '2026-09-18' } },
  { method: 'POST', path: '/api/luma/validate', body: { apiKey: 'test-key' } },
  { method: 'POST', path: '/api/itinerary/pass', body: { itinerary: [{ name: 'Test Event' }], booking: {} } },
  { method: 'GET', path: '/api/itinerary/pass?userId=default-user' },
  { method: 'POST', path: '/api/discovery/custom-event', body: { event: { name: 'Test', region: 'singapore', date: '2026-09-18' } } },
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
        console.log(JSON.stringify(res.body, null, 2).substring(0, 500));
      } else {
        console.log(res.body ? res.body.substring(0, 500) : '');
      }
    } catch (err) {
      console.log(`ERROR ${t.method} ${t.path}: ${err.message}`);
    }
    console.log('---');
  }
}

main();
