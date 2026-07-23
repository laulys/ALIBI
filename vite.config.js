import { defineConfig, loadEnv } from 'vite';
import { generateExcuse, validatePayload } from './api/_lib/core.js';
import { fetchTraffic, validateCoords } from './api/_lib/traffic.js';

// Dev-only stand-in for the Vercel serverless function so `npm run dev`
// exercises the real flow. With ANTHROPIC_API_KEY set it calls the same
// core as production; without it, it returns a canned specimen response
// BUILT FROM THE REAL WEATHER PAYLOAD (rain excuses only when it rains).
// Variety guarantees: a shuffle-bag per (lang, wet, chaos) means no variant
// repeats until every variant in the branch has been served, and randomized
// details (names, time windows, credibility jitter) keep even a returning
// skeleton from reading identical. Tone contract: mild/spicy read like real
// texts; delulu is grounded absurdity.
const RAINY_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function mockVariants({ lang, wet, T, D, city }) {
  const tech = pick(lang === 'es' ? ['Andrés', 'Sergio', 'Íñigo'] : ['Andrés', 'Dave', 'Marek']);
  const admin = pick(lang === 'es' ? ['Rosa', 'Marisol', 'Puri'] : ['Rosa', 'Karen', 'Deb']);
  const neighbor = pick(lang === 'es' ? ['Gerardo', 'Paco', 'Chema'] : ['Gerald', 'Dennis', 'Roy']);
  const cat = pick(['Michi', 'Coco', 'Nube']);
  const win = pick(lang === 'es' ? ['entre las 4 y las 7', 'entre las 12 y las 3', 'entre las 5 y las 8'] : ['between 4 and 7', 'between 12 and 3', 'between 5 and 8']);
  const late = pick(['6', '7', '8']);

  const M = {
    en: {
      wet: {
        mild: [
          { excuse: `I'm really sorry, I have to cancel — with this ${D} the end of my street has flooded again and I can't get the car out. Can we move it to tomorrow?`, credibility: 89, risk_note: '11% chance they check the radar right as the rain stops.' },
          { excuse: `Bad timing on my end — a leak opened up in the ceiling with this rain and I'm waiting for the insurance assessor. I'll text you as soon as it's sorted.`, credibility: 84, risk_note: '14% chance they ask for a photo of the leak. Every ceiling has suspicious stains; you’ll manage.' },
          { excuse: `I can't make it today — the rain got into the garage and I'm helping my neighbor move everything before it gets worse. Tomorrow works if that's okay?`, credibility: 86, risk_note: '12% chance the neighbor gets mentioned at a dinner you both attend.' },
        ],
        spicy: [
          { excuse: `I have to push — the rain flooded the storage units and the building manager, ${admin}, wants every tenant to check theirs before ${late}. I'm still in the queue. Really sorry.`, credibility: 66, risk_note: `23% chance someone in your building actually knows ${admin}. There is no ${admin}.` },
          { excuse: `Can't come — my downstairs neighbor's awning came down in the rain onto my scooter and he doesn't get home until ${late} to help lift it. I'm so sorry, rain check (literally).`, credibility: 62, risk_note: '19% chance they walk past your street and count the awnings.' },
          { excuse: `I have to cancel — with the rain they've closed the bus lane on the avenue and the taxi app says 40+ minutes. By the time I'd arrive we'd have ten minutes left. Reschedule?`, credibility: 64, risk_note: '17% chance they open the same app and see 12 minutes.' },
        ],
        delulu: [
          { excuse: `I can't come — this rain re-activated the leak the plumber swore he fixed in March, and we are now in a two-bucket situation that requires constant supervision. I am the supervisor. The buckets cannot be delegated.`, credibility: 28, risk_note: '31% chance they ask why a bucket needs supervision. It rotates. That’s why.' },
          { excuse: `I was fully on my way, but the rain swept my neighbor ${neighbor}'s inflatable hot tub into my driveway and it is now blocking both cars in what his insurance calls "an act of weather". ${neighbor} is at a christening until ${late}. I have measured; there is no way around it.`, credibility: 24, risk_note: '23% chance someone asks to see the hot tub. There is a hot tub, but it is not survivable as an anecdote.' },
          { excuse: `I have to cancel — the building group chat has declared "phase yellow" because the garage drain is gurgling with this rain, and as the only person under sixty I've been issued a mop and a rank. I cannot abandon my post.`, credibility: 26, risk_note: '28% chance they ask your rank. You are a corporal now. Own it.' },
        ],
      },
      dry: {
        mild: [
          { excuse: `I'm so sorry, I have to reschedule — my car battery died this afternoon, of course on a ${D} day when I actually needed it, and I'm waiting for roadside assistance. Tomorrow instead?`, credibility: 88, risk_note: `9% chance they know roadside assistance in ${city} answers in under an hour.` },
          { excuse: `Something came up at home — the water heater technician finally confirmed for this evening and someone has to be here. Can we move it to tomorrow? Sorry for the short notice.`, credibility: 87, risk_note: '8% chance they ask which brand. Say the building picked it; buildings always pick.' },
          { excuse: `I have to cancel today — they scheduled roof work on our building while the weather holds and we've been asked to stay available. Tomorrow I'm fully free.`, credibility: 84, risk_note: `13% chance they walk by and look up. Scaffolding takes weeks; you’re covered.` },
        ],
        spicy: [
          { excuse: `I have to bail — the boiler technician finally has a slot today, "${win}", his name is ${tech}, and if I miss him the next appointment is in three weeks. Tomorrow, promise.`, credibility: 68, risk_note: '21% chance they ask how the boiler went. Prepare one (1) sentence about valves.' },
          { excuse: `Can't make it — my sister's cat ${cat} got out onto the neighbor's roof (again) and with this ${D} everyone's out, so I'm the designated rescuer. Give me until tomorrow.`, credibility: 60, risk_note: '24% chance they request cat photos as proof. Have one ready from March.' },
          { excuse: `I got locked out — the door clicked shut while I was taking the recycling down and the locksmith quoted "${win}". I'm on the stairs with one flip-flop. Tomorrow?`, credibility: 63, risk_note: '18% chance they ask which locksmith. Say the one with the magnet flyers; there’s always one.' },
        ],
        delulu: [
          { excuse: `I can't come — with this ${D} my neighbor chose today to drone-photograph his roof, the drone is now lodged in my chimney, and he is convinced only my ladder can save it. I have been holding the ladder for forty minutes. I am load-bearing now.`, credibility: 27, risk_note: '34% chance they ask why the fire brigade wasn’t called. He doesn’t want it "on record".' },
          { excuse: `I have to cancel — the car sat in the ${T} sun all afternoon and the chocolate delivery I forgot in the trunk has entered what the detailing guy calls "phase two". If I don't act in the next hour it legally becomes part of the upholstery. I have to act now.`, credibility: 25, risk_note: '29% chance they ask what "phase two" is. Do not explain phase two. The mystery is the alibi.' },
          { excuse: `I can't make it — the neighbors' smart awning has decided this ${D} is a storm and is opening and closing every 90 seconds, which sets off their alarm, and I hold the only spare key. I have become infrastructure.`, credibility: 26, risk_note: '26% chance they suggest unplugging it. It cannot be unplugged. Nobody knows why.' },
        ],
      },
    },
    es: {
      wet: {
        mild: [
          { excuse: `Lo siento mucho, tengo que cancelar — con esta ${D} se ha vuelto a inundar el final de mi calle y no puedo sacar el coche. ¿Lo movemos a mañana?`, credibility: 89, risk_note: '11% de probabilidad de que miren el radar justo cuando pare de llover.' },
          { excuse: `Me ha surgido un problema en casa — se ha abierto una gotera con esta lluvia y estoy esperando al perito del seguro. Te escribo en cuanto lo resuelva.`, credibility: 84, risk_note: '14% de probabilidad de que pidan foto de la gotera. Todo techo tiene manchas sospechosas; te apañas.' },
          { excuse: `Hoy no llego — ha entrado agua en el garaje y estoy ayudando a mi vecina a sacar las cosas antes de que vaya a más. ¿Te viene bien mañana?`, credibility: 86, risk_note: '12% de probabilidad de que la vecina salga en una cena en la que estáis los dos.' },
        ],
        spicy: [
          { excuse: `Tengo que aplazarlo — se han inundado los trasteros y la administradora, ${admin}, quiere que cada vecino revise el suyo antes de las ${late}. Sigo en la cola. Lo siento de verdad.`, credibility: 66, risk_note: `23% de probabilidad de que alguien de tu portal conozca a ${admin}. No existe ${admin}.` },
          { excuse: `No puedo ir — el toldo del vecino de abajo se ha caído con la lluvia encima de mi moto y él no vuelve hasta las ${late} para ayudarme a levantarlo. Lo siento muchísimo.`, credibility: 62, risk_note: '19% de probabilidad de que pasen por tu calle y cuenten los toldos.' },
          { excuse: `Tengo que cancelar — con la lluvia han cortado el carril bus de la avenida y la app del taxi marca más de 40 minutos. Para cuando llegara nos quedarían diez minutos. ¿Lo pasamos?`, credibility: 64, risk_note: '17% de probabilidad de que abran la misma app y vean 12 minutos.' },
        ],
        delulu: [
          { excuse: `No puedo ir — esta lluvia ha reactivado la gotera que el fontanero juró haber arreglado en marzo, y ahora tenemos una situación de dos cubos que requiere supervisión constante. La supervisora soy yo. Los cubos no se pueden delegar.`, credibility: 28, risk_note: '31% de probabilidad de que pregunten por qué un cubo necesita supervisión. Rota. Por eso.' },
          { excuse: `Iba de camino, de verdad, pero la lluvia ha arrastrado el jacuzzi hinchable de mi vecino ${neighbor} hasta mi entrada y ahora bloquea los dos coches en lo que su seguro llama "causa meteorológica". ${neighbor} está en un bautizo hasta las ${late}. Lo he medido; no hay manera de rodearlo.`, credibility: 24, risk_note: '23% de probabilidad de que pidan ver el jacuzzi. Hay jacuzzi, pero la anécdota no es sobrevivible.' },
          { excuse: `Tengo que cancelar — el grupo del edificio ha declarado "fase amarilla" porque el desagüe del garaje hace ruidos con esta lluvia, y como única persona menor de sesenta me han asignado una fregona y un rango. No puedo abandonar mi puesto.`, credibility: 26, risk_note: '28% de probabilidad de que pregunten tu rango. Ahora eres cabo. Asúmelo.' },
        ],
      },
      dry: {
        mild: [
          { excuse: `Lo siento mucho, tengo que cambiar el plan — se me ha muerto la batería del coche esta tarde, justo un día de ${D} que lo necesitaba, y estoy esperando a la grúa. ¿Mañana mejor?`, credibility: 88, risk_note: `9% de probabilidad de que sepan que la grúa en ${city} tarda menos de una hora.` },
          { excuse: `Me ha surgido algo en casa — el técnico del termo por fin ha confirmado para esta tarde y alguien tiene que estar. ¿Lo pasamos a mañana? Perdona el aviso con poco margen.`, credibility: 87, risk_note: '8% de probabilidad de que pregunten la marca. Di que lo eligió la comunidad; la comunidad siempre elige.' },
          { excuse: `Hoy tengo que cancelar — han programado obra en el tejado del edificio aprovechando el buen tiempo y nos han pedido estar disponibles. Mañana estoy totalmente libre.`, credibility: 84, risk_note: '13% de probabilidad de que pasen y miren hacia arriba. Un andamio tarda semanas; vas sobrada.' },
        ],
        spicy: [
          { excuse: `Te tengo que fallar — el técnico de la caldera por fin tiene hueco hoy, "${win}", se llama ${tech}, y si lo pierdo la próxima cita es en tres semanas. Mañana sin falta, prometido.`, credibility: 68, risk_note: '21% de probabilidad de que pregunten qué tal la caldera. Prepara una (1) frase sobre válvulas.' },
          { excuse: `No llego — el gato de mi hermana, ${cat}, se ha escapado (otra vez) al tejado del vecino y con este ${D} no hay nadie, así que me toca a mí el rescate. Dame hasta mañana.`, credibility: 60, risk_note: '24% de probabilidad de que pidan fotos del gato como prueba. Ten una lista de marzo.' },
          { excuse: `Me he quedado fuera de casa — se me ha cerrado la puerta bajando el reciclaje y el cerrajero me ha dado "${win}". Estoy en la escalera con una chancla. ¿Mañana?`, credibility: 63, risk_note: '18% de probabilidad de que pregunten qué cerrajero. Di el de los imanes del buzón; siempre hay uno.' },
        ],
        delulu: [
          { excuse: `No puedo ir — con este ${D} mi vecino ha elegido hoy para fotografiar su tejado con el dron, el dron está ahora encajado en mi chimenea, y él está convencido de que solo mi escalera puede salvarlo. Llevo cuarenta minutos sujetando la escalera. Ya formo parte de la estructura.`, credibility: 27, risk_note: '34% de probabilidad de que pregunten por qué no llamó a los bomberos. No quiere que "conste".' },
          { excuse: `Tengo que cancelar — el coche ha estado toda la tarde al sol a ${T} y el pedido de bombones que olvidé en el maletero ha entrado en lo que el del detailing llama "fase dos". Si no actúo en la próxima hora pasa legalmente a formar parte de la tapicería. Tengo que actuar ya.`, credibility: 25, risk_note: '29% de probabilidad de que pregunten qué es la "fase dos". No expliques la fase dos. El misterio es la coartada.' },
          { excuse: `No llego — el toldo inteligente de los vecinos ha decidido que este ${D} es una tormenta y se abre y se cierra cada 90 segundos, lo que dispara su alarma, y yo tengo la única llave de repuesto. Me he convertido en infraestructura.`, credibility: 26, risk_note: '26% de probabilidad de que sugieran desenchufarlo. No se puede desenchufar. Nadie sabe por qué.' },
        ],
      },
    },
  };
  return M[lang][wet ? 'wet' : 'dry'];
}

// Shuffle-bag per branch: every variant is served once (random order) before
// any repeats, and the first card of a fresh bag never equals the last served.
const bags = new Map();
const lastServed = new Map();

function drawIndex(key, size) {
  let bag = bags.get(key);
  if (!bag || !bag.length) {
    bag = Array.from({ length: size }, (_, i) => i);
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    if (bag.length > 1 && bag[0] === lastServed.get(key)) bag.push(bag.shift());
    bags.set(key, bag);
  }
  const idx = bag.shift();
  lastServed.set(key, idx);
  return idx;
}

function buildMock({ chaos, lang, weather, city }) {
  const wet = weather.precip > 0.2 || RAINY_CODES.has(weather.code);
  const variants = mockVariants({
    lang,
    wet,
    T: `${weather.temp}${weather.unit}`,
    D: weather.description,
    city,
  })[chaos];
  const key = `${lang}|${wet ? 'w' : 'd'}|${chaos}`;
  const v = variants[drawIndex(key, variants.length)];
  const jitter = Math.floor(Math.random() * 7) - 3;
  return { ...v, credibility: Math.max(5, Math.min(95, v.credibility + jitter)) };
}

function devExcuseApi(apiKey, tomtomKey) {
  return {
    name: 'alibi-dev-excuse-api',
    configureServer(server) {
      server.middlewares.use('/api/traffic', async (req, res) => {
        res.setHeader('content-type', 'application/json');
        const url = new URL(req.url, 'http://localhost');
        const coords = validateCoords(url.searchParams.get('lat'), url.searchParams.get('lon'));
        if (!coords) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid coordinates' }));
          return;
        }
        if (tomtomKey) {
          try {
            res.end(JSON.stringify(await fetchTraffic(coords.lat, coords.lon, tomtomKey)));
          } catch (err) {
            console.error('[alibi] traffic lookup failed:', err.message);
            res.end(JSON.stringify({ available: false }));
          }
          return;
        }
        // No TomTom key: serve a plausible mock so the UI flow is testable.
        console.warn('[alibi] TOMTOM_API_KEY not set — serving mock traffic');
        const roll = Math.random();
        const mock =
          roll < 0.45
            ? { level: 'free', delayFactor: 0, currentSpeed: 48, freeFlowSpeed: 50 }
            : roll < 0.8
              ? { level: 'slow', delayFactor: 31, currentSpeed: 33, freeFlowSpeed: 48 }
              : { level: 'jam', delayFactor: 62, currentSpeed: 18, freeFlowSpeed: 48 };
        res.end(JSON.stringify({ available: true, ...mock }));
      });
      server.middlewares.use('/api/excuse', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        let raw = '';
        req.on('data', (c) => (raw += c));
        req.on('end', async () => {
          res.setHeader('content-type', 'application/json');
          try {
            const body = JSON.parse(raw || '{}');
            if (!apiKey) {
              const payload = validatePayload(body);
              console.warn('[alibi] ANTHROPIC_API_KEY not set — serving weather-aware mock excuse');
              await new Promise((r) => setTimeout(r, 2600));
              res.end(JSON.stringify(buildMock({ ...payload, weather: { ...payload.weather, code: body.weather?.code } })));
              return;
            }
            const result = await generateExcuse(body, apiKey);
            res.end(JSON.stringify(result));
          } catch (err) {
            console.error('[alibi] dev api error:', err.message);
            res.statusCode = err.status === 400 ? 400 : 502;
            res.end(JSON.stringify({ error: 'The Bureau is experiencing delays. Please resubmit your request.' }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Load .env / .env.local so ANTHROPIC_API_KEY works in dev without exporting
  // it in the shell. The key stays server-side: only VITE_-prefixed vars ever
  // reach client code, and this one is not prefixed.
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = process.env.ANTHROPIC_API_KEY || env.ANTHROPIC_API_KEY || '';
  const tomtomKey = process.env.TOMTOM_API_KEY || env.TOMTOM_API_KEY || '';
  return {
    server: { port: Number(process.env.PORT) || 5173 },
    plugins: [devExcuseApi(apiKey, tomtomKey)],
  };
});
