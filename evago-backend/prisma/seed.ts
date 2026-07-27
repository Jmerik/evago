import { prisma } from '../server/db';

/**
 * Seeds the OrganizerCalendar table with partner calendar entries.
 * 
 * In production, these would contain real Luma API keys from organizer partners.
 * For the MVP, we use "demo-key-xxx" keys that the discovery route
 * recognises and returns mock data for.
 */
async function main() {
  await prisma.organizerCalendar.deleteMany();

  await prisma.organizerCalendar.createMany({
    data: [
      {
        name: 'TOKEN2049 Official',
        lumaApiKey: 'demo-key-token2049',
        region: 'singapore',
        city: 'Singapore',
        country: 'Singapore',
      },
      {
        name: 'Singapore Blockchain Week',
        lumaApiKey: 'demo-key-sbw',
        region: 'singapore',
        city: 'Singapore',
        country: 'Singapore',
      },
      {
        name: 'Web3 Summit APAC',
        lumaApiKey: 'demo-key-web3summit',
        region: 'bangkok',
        city: 'Bangkok',
        country: 'Thailand',
      },
      {
        name: 'Thailand Crypto Expo',
        lumaApiKey: 'demo-key-tce',
        region: 'bangkok',
        city: 'Bangkok',
        country: 'Thailand',
      },
      {
        name: 'Dubai Blockchain Summit',
        lumaApiKey: 'demo-key-dbs',
        region: 'dubai',
        city: 'Dubai',
        country: 'UAE',
      },
    ],
  });

  const count = await prisma.organizerCalendar.count();
  console.log(`Seeded ${count} organizer calendars.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
