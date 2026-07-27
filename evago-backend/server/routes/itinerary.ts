import { Router, Request, Response } from 'express';
import { db } from '../db';

export const itineraryRouter = Router();

/**
 * POST /api/itinerary/pass
 * Saves a confirmed TravelPass and itinerary to the database
 */
itineraryRouter.post('/pass', (req: Request, res: Response) => {
  const { itinerary, booking, userId = 'default-user' } = req.body;

  if (!itinerary || !Array.isArray(itinerary)) {
    return res.status(400).json({ error: 'Valid itinerary array is required' });
  }

  const passRecord = {
    id: `pass-${Date.now()}`,
    userId,
    itinerary,
    booking: booking || null,
    createdAt: new Date().toISOString(),
  };

  db.savePass(passRecord);
  res.json({ success: true, pass: passRecord });
});

/**
 * GET /api/itinerary/pass
 * Retrieves the latest saved TravelPass for the user
 */
itineraryRouter.get('/pass', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default-user';
  const pass = db.getLatestPass(userId);

  res.json({ success: true, pass });
});
