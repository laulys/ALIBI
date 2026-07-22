import { generateExcuse } from './_lib/core.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'The Bureau is not configured. (Missing ANTHROPIC_API_KEY.)' });
  }
  try {
    const result = await generateExcuse(req.body, apiKey);
    return res.status(200).json(result);
  } catch (err) {
    const status = err.status === 400 ? 400 : 502;
    console.error('excuse generation failed:', err.message);
    return res.status(status).json({
      error:
        status === 400
          ? 'Malformed filing. Please review your form and resubmit.'
          : 'The Bureau is experiencing delays. Please resubmit your request.',
    });
  }
}
