import { fetchTraffic, validateCoords } from './_lib/traffic.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const apiKey = process.env.TOMTOM_API_KEY;
  if (!apiKey) return res.status(200).json({ available: false });
  const coords = validateCoords(req.query.lat, req.query.lon);
  if (!coords) return res.status(400).json({ error: 'Invalid coordinates' });
  try {
    const traffic = await fetchTraffic(coords.lat, coords.lon, apiKey);
    res.setHeader('cache-control', 's-maxage=120, stale-while-revalidate=60');
    return res.status(200).json(traffic);
  } catch (err) {
    console.error('traffic lookup failed:', err.message);
    return res.status(200).json({ available: false });
  }
}
