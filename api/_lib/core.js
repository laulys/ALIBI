// Shared excuse-generation core. Used by the Vercel function (api/excuse.js)
// and by the Vite dev-server middleware so local dev exercises the same code.

const AUDIENCES = {
  boss: 'their boss — needs to survive a workplace context, mildly professional register',
  friend: 'a close friend — casual register, can be a bit shameless',
  date: 'a date they are bailing on — apologetic but charming, must leave the door open',
  family: 'a family member — familiar register, guilt is in play',
  gym: 'their gym buddy / trainer — fitness-adjacent, self-aware about skipping',
};

const CHAOS = {
  mild: `CHAOS LEVEL: MILD. The excuse must be COMPLETELY believable and mundane —
indistinguishable from a real text a normal person would actually send. No comedy, no
quirky details, no performative writing. A boring personal-logistics reason (car trouble,
a repair visit, building works, a family errand) is ideal; use the weather as supporting
context only when it genuinely helps. Credibility should land between 80 and 95.`,
  spicy: `CHAOS LEVEL: SPICY. Still a fully usable, realistic excuse the user could send
word-for-word — but include exactly ONE concrete, specific detail (a first name, an exact
time window, a street, a brand) that makes it feel extra true. The detail must be
mundane-specific, NOT wacky or comedic. Grounded in the real conditions. Credibility
should land between 55 and 75.`,
  delulu: `CHAOS LEVEL: DELULU. The comedy tier — but GROUNDED absurdity. Every element must
be physically possible and technically believable: no prophecies, psychic body parts,
talking animals, or supernatural claims. The humor comes from an escalating chain of
mundane events taken far too seriously — over-specific detail, misplaced confidence, and
treating a trivial situation as a crisis that "cannot be delegated". Still cite the real
weather and city as supporting evidence. The reader should laugh AND half-believe it could
genuinely have happened. Credibility should land between 15 and 40.`,
};

const SYSTEM_PROMPT = `You are the excuse-generation engine of ALIBI, a parody web service
("plausible deniability as a service") run by the fictional Bureau of Plausible Deniability.
You write short excuses for skipping obligations, grounded in the user's real current
weather and city.

Rules for the excuse:
- 2 to 3 sentences, first person, ready to paste directly into a text message.
- No greetings, no sign-offs, no emoji, no quotation marks around it.
- Weave the weather in naturally — never recite it like a weather report.
- Never mention ALIBI, the Bureau, AI, or that the excuse was generated.
- REGISTER: Mild and Spicy excuses must sound like real human texting — natural, casual,
  slightly imperfect, contractions, no literary flourishes, no jokes. People must be able
  to send them for real. The parody of this service lives ONLY in the risk_note and in the
  Delulu level, never in the Mild/Spicy excuse text itself.

HARD CONSISTENCY RULE — the verified conditions are ground truth:
- Never invent weather that contradicts the data. No rain, storms, floods, snow, wind, or
  clouds unless the data actually shows them (e.g. rain requires precipitation > 0 or rainy
  conditions; wind chaos requires meaningful wind speed).
- If conditions are clear and dry, the excuse must be built on clear-and-dry problems
  (heat, sun, glare, pollen, pressure, a suspiciously perfect day…).
- At higher chaos levels, escalate the IMPLICATIONS of the real conditions, never the
  weather facts themselves.

Rules for the other fields:
- "credibility": an integer 0-100 rating how believable the excuse is, consistent with the
  requested chaos level.
- "risk_note": ONE deadpan sentence (max 140 characters) assessing a specific way this
  excuse could fall apart, ideally with a fake-precise statistic
  (e.g. "6% chance your boss also lives on your street and knows it's sunny").

OUTPUT FORMAT — absolute rule: respond with ONLY a single valid JSON object, exactly:
{"excuse": "...", "credibility": 87, "risk_note": "..."}
No markdown fences, no extra keys, no commentary, no text before or after the JSON.`;

function bad(msg) {
  const e = new Error(msg);
  e.status = 400;
  return e;
}

export function validatePayload(body) {
  if (!body || typeof body !== 'object') throw bad('Missing request body');
  const { city, audience, chaos, weather, lang, previous } = body;
  if (typeof city !== 'string' || !city.trim() || city.length > 80) throw bad('Invalid city');
  if (!Object.hasOwn(AUDIENCES, audience)) throw bad('Invalid audience');
  if (!Object.hasOwn(CHAOS, chaos)) throw bad('Invalid chaos level');
  if (!weather || typeof weather !== 'object') throw bad('Missing weather');
  const { temp, precip, wind, description, unit, localTime } = weather;
  if (![temp, precip, wind].every((n) => Number.isFinite(n))) throw bad('Invalid weather data');
  if (typeof description !== 'string' || description.length > 60) throw bad('Invalid conditions');
  return {
    city: city.trim(),
    audience,
    chaos,
    lang: lang === 'es' ? 'es' : 'en',
    previous: (Array.isArray(previous) ? previous : typeof previous === 'string' && previous ? [previous] : [])
      .filter((s) => typeof s === 'string' && s.trim())
      .slice(-5)
      .map((s) => s.slice(0, 600)),
    weather: {
      temp,
      precip,
      wind,
      description,
      unit: unit === '°F' ? '°F' : '°C',
      localTime: typeof localTime === 'string' ? localTime.slice(0, 32) : '',
    },
  };
}

function buildUserPrompt({ city, audience, chaos, lang, weather, previous }) {
  const avoid = previous.length
    ? `\nThe user has already seen the following excuse(s) this session and asked for a better
one. Produce a CLEARLY different scenario — do not reuse the situation, objects, or names
of ANY of them:\n${previous.map((p) => `«${p}»`).join('\n')}\n`
    : '';
  return `Verified current conditions (real data from Open-Meteo):
- City: ${city}
- Temperature: ${weather.temp}${weather.unit}
- Conditions: ${weather.description}
- Precipitation: ${weather.precip} mm
- Wind: ${weather.wind} km/h
- Local time: ${weather.localTime || 'unknown'}

The excuse is for: ${AUDIENCES[audience]}.

${CHAOS[chaos]}
${avoid}
Write the "excuse" and "risk_note" in ${lang === 'es' ? 'Spanish (es-ES, natural peninsular register)' : 'English'}.

Generate the JSON now.`;
}

function parseModelJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Model returned non-JSON output');
  }
}

export async function generateExcuse(rawBody, apiKey) {
  const payload = validatePayload(rawBody);
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      temperature: 1,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(payload) }],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const e = new Error(`Anthropic API ${res.status}: ${detail.slice(0, 300)}`);
    e.status = 502;
    throw e;
  }
  const data = await res.json();
  const text = (data.content || []).map((b) => b.text || '').join('');
  const out = parseModelJson(text);
  const excuse = String(out.excuse || '').trim();
  const risk = String(out.risk_note || '').trim();
  const credibility = Math.max(0, Math.min(100, Math.round(Number(out.credibility))));
  if (!excuse || !risk || !Number.isFinite(credibility)) {
    throw new Error('Model output missing required fields');
  }
  return { excuse, credibility, risk_note: risk };
}
