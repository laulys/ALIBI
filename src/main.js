import './style.css';
import { searchCities, reverseGeocode, fetchWeather, describeWeather, prefersFahrenheit } from './weather.js';
import { STRINGS, lang, t, setLang, applyLang } from './i18n.js';

const $ = (id) => document.getElementById(id);

const state = {
  place: null, // { name, country, lat, lon }
  weather: null, // { temp, precip, wind, code, unit, localTime }
  traffic: null, // { level, delayFactor, currentSpeed, freeFlowSpeed } or null
  audience: null,
  chaos: 'spicy',
  result: null, // { excuse, credibility, risk_note }
  history: [], // excuses already shown this session, so regenerations stay fresh
  docId: '',
  generating: false,
};

const docNumber = () => `${t('docPrefix')} ${state.docId}`;

const CHAOS_LEVELS = ['mild', 'spicy', 'delulu'];
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- paper noise texture ---------------- */

function makeNoise() {
  const size = 96;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const shade = 90 + Math.random() * 90;
    img.data[i] = img.data[i + 1] = shade;
    img.data[i + 2] = shade * 0.92;
    img.data[i + 3] = Math.random() < 0.5 ? 0 : 10;
  }
  ctx.putImageData(img, 0, 0);
  document.documentElement.style.setProperty('--noise-img', `url(${c.toDataURL()})`);
}

/* ---------------- typewriter tagline ---------------- */

let typeTimer = null;

function typeTagline() {
  const el = $('tagline');
  const full = t('tagline');
  clearInterval(typeTimer);
  if (reducedMotion()) {
    el.textContent = full;
    el.classList.remove('typing');
    return;
  }
  el.textContent = '';
  el.classList.add('typing');
  let i = 0;
  typeTimer = setInterval(() => {
    i += 1;
    el.textContent = full.slice(0, i);
    if (i >= full.length) {
      clearInterval(typeTimer);
      el.classList.remove('typing');
    }
  }, 16);
}

/* ---------------- language ---------------- */

function localizeDynamic() {
  // strings owned by JS state rather than static markup
  $('chaos-hint').textContent = STRINGS[lang].chaosHints[state.chaos];
  $('lang-toggle').textContent = t('langToggle');
  if (state.weather) renderReadout();
  if (state.result && !$('certificate').hidden) {
    $('conditions-line').textContent = conditionsLine();
    $('cred-class').textContent = credClass(state.result.credibility);
    $('doc-number').textContent = docNumber();
  }
  updateGenerateGate();
}

$('lang-toggle').addEventListener('click', () => {
  setLang(lang === 'en' ? 'es' : 'en');
  localizeDynamic();
  typeTagline();
});

/* ---------------- section 1: location ---------------- */

const cityInput = $('city-input');
const cityResults = $('city-results');
const locError = $('loc-error');
const useFahrenheit = prefersFahrenheit();
let searchTimer = null;
let searchSeq = 0;

function showLocError(msg) {
  locError.textContent = msg;
  locError.hidden = false;
}

async function setPlace(place) {
  locError.hidden = true;
  cityResults.hidden = true;
  state.place = place;
  state.weather = null;
  state.traffic = null;
  renderReadout(true);
  fetchTrafficInfo(place);
  try {
    state.weather = await fetchWeather(place.lat, place.lon, useFahrenheit);
    renderReadout();
  } catch {
    state.place = null;
    $('weather-readout').hidden = true;
    $('loc-controls').hidden = false;
    showLocError(t('locFail'));
  }
  updateGenerateGate();
}

async function fetchTrafficInfo(place) {
  try {
    const res = await fetch(`/api/traffic?lat=${place.lat}&lon=${place.lon}`);
    const data = await res.json();
    if (data.available && state.place === place) {
      state.traffic = data;
      if (state.weather) renderReadout();
    }
  } catch {
    // traffic is optional evidence — silently skip
  }
}

function trafficLabel() {
  const tr = state.traffic;
  if (!tr) return '';
  const label = STRINGS[lang].trafficLevels[tr.level] || tr.level;
  return tr.level === 'slow' || tr.level === 'jam' ? `${label} (+${tr.delayFactor}%)` : label;
}

function renderReadout(loading = false) {
  const box = $('weather-readout');
  const rows = $('readout-rows');
  $('loc-controls').hidden = true;
  box.hidden = false;
  const p = state.place;
  const w = state.weather;
  const placeLabel = `${p.name}${p.country ? ', ' + p.country : ''}`;
  const entries = loading
    ? [[t('kLocation'), placeLabel], [t('kConditions'), t('verifying')]]
    : [
        [t('kLocation'), placeLabel],
        [t('kTemperature'), `${w.temp}${w.unit}`],
        [t('kConditions'), describeWeather(w.code, lang)],
        [t('kWind'), `${w.wind} km/h`],
        [t('kPrecip'), `${w.precip} mm`],
        ...(state.traffic ? [[t('kTraffic'), trafficLabel()]] : []),
      ];
  rows.innerHTML = entries
    .map(
      ([k, val]) =>
        `<div class="readout-row"><span class="k">${k}</span><span class="leader"></span><span class="v">${val}</span></div>`
    )
    .join('');
}

$('btn-geolocate').addEventListener('click', () => {
  locError.hidden = true;
  if (!navigator.geolocation) {
    showLocError(t('geoUnsupported'));
    return;
  }
  const btn = $('btn-geolocate');
  btn.disabled = true;
  btn.textContent = t('btnGeoBusy');
  const restore = () => {
    btn.disabled = false;
    btn.innerHTML = t('btnGeo');
  };
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      const rev = await reverseGeocode(latitude, longitude);
      restore();
      setPlace({ name: rev.name, country: rev.country, lat: latitude, lon: longitude });
    },
    () => {
      restore();
      showLocError(t('geoDenied'));
    },
    { timeout: 12000, maximumAge: 300000 }
  );
});

cityInput.addEventListener('input', () => {
  const q = cityInput.value.trim();
  clearTimeout(searchTimer);
  if (q.length < 2) {
    cityResults.hidden = true;
    return;
  }
  searchTimer = setTimeout(async () => {
    const seq = ++searchSeq;
    try {
      const results = await searchCities(q);
      if (seq !== searchSeq) return;
      cityResults.innerHTML = results.length
        ? results
            .map(
              (r, i) =>
                `<li role="option" data-i="${i}">${r.name}${r.region ? ', ' + r.region : ''} <span class="country">(${r.country})</span></li>`
            )
            .join('')
        : `<li class="empty">${t('cityNone')}</li>`;
      cityResults.hidden = false;
      cityResults._results = results;
    } catch {
      if (seq !== searchSeq) return;
      cityResults.innerHTML = `<li class="empty">${t('cityFail')}</li>`;
      cityResults.hidden = false;
    }
  }, 280);
});

cityResults.addEventListener('click', (e) => {
  const li = e.target.closest('li[data-i]');
  if (!li) return;
  const r = cityResults._results[Number(li.dataset.i)];
  cityInput.value = '';
  setPlace(r);
});

cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const first = cityResults.querySelector('li[data-i]');
    if (first && !cityResults.hidden) first.click();
  }
  if (e.key === 'Escape') cityResults.hidden = true;
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.citysearch')) cityResults.hidden = true;
});

$('btn-change-loc').addEventListener('click', () => {
  state.place = null;
  state.weather = null;
  $('weather-readout').hidden = true;
  $('loc-controls').hidden = false;
  updateGenerateGate();
  cityInput.focus();
});

/* ---------------- section 2 + 3 ---------------- */

document.querySelectorAll('input[name="audience"]').forEach((input) => {
  input.addEventListener('change', () => {
    state.audience = input.value;
    updateGenerateGate();
  });
});

const chaosRange = $('chaos-range');
chaosRange.addEventListener('input', () => {
  const level = CHAOS_LEVELS[Number(chaosRange.value)];
  state.chaos = level;
  chaosRange.setAttribute('aria-valuetext', STRINGS[lang].chaosLabels[Number(chaosRange.value)]);
  $('chaos-hint').textContent = STRINGS[lang].chaosHints[level];
  document.querySelectorAll('.chaos-labels span').forEach((s) => {
    s.classList.toggle('active', s.dataset.level === chaosRange.value);
  });
});

function updateGenerateGate() {
  const ready = Boolean(state.weather && state.audience);
  $('btn-generate').disabled = !ready || state.generating;
  const missing = [];
  if (!state.weather) missing.push('1');
  if (!state.audience) missing.push('2');
  $('req-note').hidden = ready;
  if (!ready) {
    $('req-note').textContent =
      missing.length === 2 ? t('reqBoth') : t('reqOne').replace('{n}', missing[0]);
  }
}

/* ---------------- generation ---------------- */

let loadingTimer = null;

function startLoadingTicker() {
  const status = $('gen-status');
  const messages = STRINGS[lang].loading;
  status.hidden = false;
  let i = Math.floor(Math.random() * messages.length);
  status.textContent = messages[i];
  loadingTimer = setInterval(() => {
    i = (i + 1) % messages.length;
    status.textContent = messages[i];
  }, 1700);
}

function stopLoadingTicker() {
  clearInterval(loadingTimer);
  $('gen-status').hidden = true;
}

async function generate() {
  if (state.generating || !state.weather || !state.audience) return;
  state.generating = true;
  $('gen-error').hidden = true;
  const btn = $('btn-generate');
  btn.disabled = true;
  btn.textContent = t('btnFiling');
  startLoadingTicker();
  try {
    const res = await fetch('/api/excuse', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        city: state.place.name,
        audience: state.audience,
        chaos: state.chaos,
        lang,
        previous: state.history.slice(-5),
        traffic: state.traffic,
        weather: { ...state.weather, description: describeWeather(state.weather.code, lang) },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || t('genFail'));
    state.result = data;
    state.history.push(data.excuse);
    if (state.history.length > 8) state.history.shift();
    state.docId = `AL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}`;
    renderCertificate();
  } catch (err) {
    const slip = $('gen-error');
    slip.textContent = err.message || t('genFail');
    slip.hidden = false;
  } finally {
    state.generating = false;
    stopLoadingTicker();
    btn.textContent = t('btnGenerate');
    updateGenerateGate();
  }
}

$('form').addEventListener('submit', (e) => {
  e.preventDefault();
  generate();
});

/* ---------------- certificate ---------------- */

function credClass(score) {
  const c = STRINGS[lang].credClasses;
  if (score >= 75) return c.high;
  if (score >= 45) return c.mid;
  return c.low;
}

function conditionsLine() {
  const w = state.weather;
  const p = state.place;
  const time = w.localTime ? w.localTime.replace('T', ' · ') : '';
  const traffic = state.traffic ? ` · ${t('kTraffic').toLowerCase()}: ${trafficLabel()}` : '';
  return `${w.temp}${w.unit} · ${describeWeather(w.code, lang)} · ${t('wind')} ${w.wind} km/h${traffic} · ${p.name}${time ? ' · ' + time : ''}`;
}

function buildGaugeTicks() {
  const g = $('gauge-ticks');
  if (g.childElementCount) return;
  const cx = 100;
  const cy = 104;
  let html = '';
  for (let val = 0; val <= 100; val += 5) {
    const angle = (Math.PI * (180 - val * 1.8)) / 180;
    const major = val % 10 === 0;
    const r1 = 82;
    const r2 = major ? 71 : 76;
    const x1 = cx + r1 * Math.cos(angle);
    const y1 = cy - r1 * Math.sin(angle);
    const x2 = cx + r2 * Math.cos(angle);
    const y2 = cy - r2 * Math.sin(angle);
    html += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" ${major ? '' : 'class="minor"'}/>`;
  }
  g.innerHTML = html;
}

function renderCertificate() {
  const { excuse, credibility, risk_note } = state.result;
  const cert = $('certificate');
  buildGaugeTicks();

  $('excuse-text').textContent = excuse;
  $('risk-note').textContent = risk_note;
  $('conditions-line').textContent = conditionsLine();
  $('doc-number').textContent = docNumber();
  $('cred-class').textContent = credClass(credibility);
  $('barcode').textContent = `*${state.docId.replace(/\D+/g, '').slice(0, 10)}*`;

  // reset animations
  cert.hidden = false;
  const stamp = $('stamp');
  stamp.classList.remove('slam');
  cert.classList.remove('thud');
  const needle = $('gauge-needle');
  needle.style.transition = 'none';
  needle.style.transform = 'rotate(-90deg)';
  $('cred-value').textContent = '0';
  void cert.offsetWidth; // reflow to restart animations
  stamp.classList.add('slam');
  cert.classList.add('thud');
  needle.style.transition = '';
  requestAnimationFrame(() => {
    needle.style.transform = `rotate(${credibility * 1.8 - 90}deg)`;
  });

  // count-up
  if (reducedMotion()) {
    $('cred-value').textContent = credibility;
    needle.style.transform = `rotate(${credibility * 1.8 - 90}deg)`;
  } else {
    const start = performance.now();
    const dur = 1400;
    const tick = (now) => {
      const k = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - k, 4);
      $('cred-value').textContent = Math.round(credibility * eased);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  cert.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
}

/* ---------------- certificate actions ---------------- */

function copyFallback(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {}
  ta.remove();
  return ok;
}

$('btn-copy').addEventListener('click', async () => {
  const btn = $('btn-copy');
  const text = state.result.excuse;
  let ok = false;
  try {
    await navigator.clipboard.writeText(text);
    ok = true;
  } catch {
    ok = copyFallback(text);
  }
  btn.textContent = ok ? t('copied') : t('copyFail');
  setTimeout(() => (btn.textContent = t('btnCopy')), 1600);
});

$('btn-regen').addEventListener('click', () => {
  generate();
  $('gen-status').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
});

/* ---------------- boot ---------------- */

makeNoise();
applyLang();
localizeDynamic();
typeTagline();
