const store = require('./lib/store');

/**
 * Seeds the JSON store with partner calendar entries.
 *
 * In production, these would contain real Luma API keys from organizer partners.
 * For the MVP, we use "demo-key-xxx" keys that the discovery route
 * recognises and returns mock data for.
 */

async function main() {
  store.seed([
    { id: '1', name: 'TOKEN2049 Official', lumaApiKey: 'demo-key-token2049', region: 'singapore', city: 'Singapore', country: 'Singapore', isActive: true },
    { id: '2', name: 'Singapore Blockchain Week', lumaApiKey: 'demo-key-sbw', region: 'singapore', city: 'Singapore', country: 'Singapore', isActive: true },
    { id: '3', name: 'Web3 Summit APAC', lumaApiKey: 'demo-key-web3summit', region: 'bangkok', city: 'Bangkok', country: 'Thailand', isActive: true },
    { id: '4', name: 'Thailand Crypto Expo', lumaApiKey: 'demo-key-tce', region: 'bangkok', city: 'Bangkok', country: 'Thailand', isActive: true },
    { id: '5', name: 'Dubai Blockchain Summit', lumaApiKey: 'demo-key-dbs', region: 'dubai', city: 'Dubai', country: 'UAE', isActive: true },
  ]);

  console.log('Seeded organizer calendars to JSON store.');
}

main().catch(console.error);
