const express = require('express');
const axios = require('axios');
const IATA_MAP = require('../lib/iata');

const router = express.Router();

router.get('/destinations', async (req, res) => {
  const rawQ = (req.query.q || '').trim();
  if (rawQ.length < 2) {
    return res.json({ suggestions: [] });
  }

  const upperQ = rawQ.toUpperCase();
  const suggestions = [];

  // 1. Exact 3-letter IATA code match
  if (upperQ.length === 3 && IATA_MAP[upperQ]) {
    const item = IATA_MAP[upperQ];
    suggestions.push({
      display: `${item.city} (${upperQ}), ${item.country}`,
      city: item.city,
      country: item.country,
      iata: upperQ,
    });
  }

  // 2. Prefix match for IATA codes
  if (upperQ.length >= 2 && upperQ.length < 3) {
    const prefixMatches = Object.entries(IATA_MAP)
      .filter(([code]) => code.startsWith(upperQ))
      .slice(0, 4);
    for (const [code, item] of prefixMatches) {
      const disp = `${item.city} (${code}), ${item.country}`;
      if (!suggestions.some(s => s.display === disp)) {
        suggestions.push({ display: disp, city: item.city, country: item.country, iata: code });
      }
    }
  }

  try {
    const { data } = await axios.get('https://photon.komoot.io/api/', {
      params: { q: rawQ, limit: 10, lang: 'en' },
      timeout: 4000,
    });

    const photonItems = (data.features || [])
      .filter((f) => {
        const p = f.properties || {};
        const type = (p.type || '').toLowerCase();
        const osmVal = (p.osm_value || '').toLowerCase();

        if (type === 'country' || osmVal === 'country' || type === 'continent') return false;
        if ((type === 'state' || osmVal === 'state' || osmVal === 'province') && !p.city && !p.town) return false;
        return true;
      })
      .map((f) => {
        const p = f.properties || {};
        const name = p.name || '';
        const city = p.city || p.town || p.village || p.county || '';
        const country = p.country || '';

        if (country && name.toLowerCase() === country.toLowerCase()) return null;

        const mainLabel = name || city;
        let display = mainLabel;
        if (city && city !== mainLabel) display += `, ${city}`;
        if (country) display += `, ${country}`;

        return {
          display,
          city: city || mainLabel,
          country,
          lat: f.geometry?.coordinates?.[1],
          lon: f.geometry?.coordinates?.[0],
        };
      })
      .filter(Boolean);

    for (const item of photonItems) {
      if (!suggestions.some(s => s.display === item.display)) {
        suggestions.push(item);
      }
    }

    res.json({ suggestions: suggestions.slice(0, 6) });
  } catch (err) {
    console.error('Autocomplete proxy error:', err.message);
    res.json({ suggestions: suggestions.slice(0, 6) });
  }
});

module.exports = router;
