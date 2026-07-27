import express from 'express';
import cors from 'cors';
import { lumaRouter } from './routes/luma';
import { discoveryRouter } from './routes/discovery';
import { itineraryRouter } from './routes/itinerary';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/luma', lumaRouter);
app.use('/api/discovery', discoveryRouter);
app.use('/api/itinerary', itineraryRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`EVAGO backend server listening on port ${PORT}`);
});
