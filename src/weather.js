// Open-Meteo helpers: geocoding, reverse geocoding, current conditions.

const WMO = {
  0: 'clear sky', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
  45: 'fog', 48: 'freezing fog',
  51: 'light drizzle', 53: 'drizzle', 55: 'heavy drizzle',
  56: 'freezing drizzle', 57: 'heavy freezing drizzle',
  61: 'light rain', 63: 'rain', 65: 'heavy rain',
  66: 'freezing rain', 67: 'heavy freezing rain',
  71: 'light snow', 73: 'snow', 75: 'heavy snow', 77: 'snow grains',
  80: 'rain showers', 81: 'heavy rain showers', 82: 'violent rain showers',
  85: 'snow showers', 86: 'heavy snow showers',
  95: 'thunderstorm', 96: 'thunderstorm with hail', 99: 'thunderstorm with heavy hail',
};

const WMO_ES = {
  0: 'cielo despejado', 1: 'mayormente despejado', 2: 'parcialmente nublado', 3: 'cubierto',
  45: 'niebla', 48: 'niebla helada',
  51: 'llovizna ligera', 53: 'llovizna', 55: 'llovizna intensa',
  56: 'llovizna helada', 57: 'llovizna helada intensa',
  61: 'lluvia ligera', 63: 'lluvia', 65: 'lluvia intensa',
  66: 'lluvia helada', 67: 'lluvia helada intensa',
  71: 'nieve ligera', 73: 'nieve', 75: 'nieve intensa', 77: 'cinarra',
  80: 'chubascos', 81: 'chubascos fuertes', 82: 'chubascos violentos',
  85: 'chubascos de nieve', 86: 'chubascos de nieve fuertes',
  95: 'tormenta', 96: 'tormenta con granizo', 99: 'tormenta con granizo fuerte',
};

export function describeWeather(code, lang = 'en') {
  if (lang === 'es') return WMO_ES[code] || 'actividad celeste sin identificar';
  return WMO[code] || 'unidentified sky activity';
}

export function prefersFahrenheit() {
  const lang = navigator.language || '';
  return /-(US|BS|BZ|KY|LR)$/i.test(lang);
}

export async function searchCities(query) {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', query);
  url.searchParams.set('count', '6');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');
  const res = await fetch(url);
  if (!res.ok) throw new Error('geocoding failed');
  const data = await res.json();
  return (data.results || []).map((r) => ({
    name: r.name,
    region: r.admin1 || '',
    country: r.country_code ? r.country_code.toUpperCase() : '',
    lat: r.latitude,
    lon: r.longitude,
  }));
}

export async function reverseGeocode(lat, lon) {
  try {
    const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
    url.searchParams.set('latitude', lat);
    url.searchParams.set('longitude', lon);
    url.searchParams.set('localityLanguage', 'en');
    const res = await fetch(url);
    if (!res.ok) throw new Error('reverse geocode failed');
    const data = await res.json();
    const name = data.city || data.locality || data.principalSubdivision;
    if (!name) throw new Error('no locality');
    return { name, country: (data.countryCode || '').toUpperCase() };
  } catch {
    return { name: 'Undisclosed location', country: '' };
  }
}

export async function fetchWeather(lat, lon, fahrenheit) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('current', 'temperature_2m,precipitation,weather_code,wind_speed_10m');
  url.searchParams.set('timezone', 'auto');
  if (fahrenheit) url.searchParams.set('temperature_unit', 'fahrenheit');
  const res = await fetch(url);
  if (!res.ok) throw new Error('weather fetch failed');
  const data = await res.json();
  const c = data.current;
  return {
    temp: Math.round(c.temperature_2m),
    precip: Math.round((c.precipitation || 0) * 10) / 10,
    wind: Math.round(c.wind_speed_10m),
    code: c.weather_code,
    unit: fahrenheit ? '°F' : '°C',
    localTime: c.time,
  };
}
