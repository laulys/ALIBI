// Shared traffic lookup (TomTom Flow Segment Data). Used by the Vercel
// function (api/traffic.js) and the Vite dev middleware. Returns the nearest
// road segment's current speed vs free-flow speed around the given point.

export async function fetchTraffic(lat, lon, apiKey) {
  const url = new URL('https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json');
  url.searchParams.set('point', `${lat},${lon}`);
  url.searchParams.set('unit', 'KMPH');
  url.searchParams.set('key', apiKey);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TomTom ${res.status}`);
  const data = await res.json();
  const seg = data.flowSegmentData;
  if (!seg || !Number.isFinite(seg.currentSpeed)) throw new Error('no segment data');
  const ratio = seg.freeFlowSpeed > 0 ? seg.currentSpeed / seg.freeFlowSpeed : 1;
  const level = seg.roadClosure ? 'closed' : ratio < 0.55 ? 'jam' : ratio < 0.8 ? 'slow' : 'free';
  return {
    available: true,
    level,
    currentSpeed: Math.round(seg.currentSpeed),
    freeFlowSpeed: Math.round(seg.freeFlowSpeed),
    delayFactor: Math.max(0, Math.round((1 - ratio) * 100)),
  };
}

export function validateCoords(lat, lon) {
  const la = Number(lat);
  const lo = Number(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) return null;
  return { lat: la, lon: lo };
}
