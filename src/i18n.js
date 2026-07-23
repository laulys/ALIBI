// Bilingual UI strings. Elements with [data-i18n] get textContent swapped;
// [data-i18n-html] gets innerHTML (trusted, static strings only).

export const STRINGS = {
  en: {
    agency: 'Bureau of Plausible Deniability',
    formTitle: 'Application for Emergency Excuse',
    tagline: '“Plausible deniability, as a service.” — Type or print legibly. Lie in black ink only.',
    confidential: 'Confidential',
    received: 'Received',
    caseFile: 'Case file: your whereabouts',
    s1Title: '<b>Section 1.</b> Verified conditions',
    s1Hint: 'The Bureau requires your coordinates. Evidence makes the lie.',
    btnGeo: '<span aria-hidden="true">⌖</span> Use my location',
    btnGeoBusy: 'Locating…',
    divider: '— or —',
    cityPlaceholder: 'Type your city',
    citySearchLabel: 'Search for a city',
    cityNone: 'No such place on record. Suspicious.',
    cityFail: 'Registry unavailable. Try again.',
    amend: 'Amend location',
    kLocation: 'Location',
    kTemperature: 'Temperature',
    kConditions: 'Conditions',
    kWind: 'Wind',
    kPrecip: 'Precipitation',
    kTraffic: 'Traffic',
    trafficLevels: { free: 'free-flowing', slow: 'slow', jam: 'heavy jam', closed: 'road closed' },
    verifying: 'verifying…',
    locFail: 'Could not verify local conditions. The sky is refusing to cooperate — try again.',
    geoDenied: 'Location denied. Very alibi of you. Type a city instead.',
    geoUnsupported: 'This device refuses to disclose its whereabouts. Type a city instead.',
    s2Title: '<b>Section 2.</b> Recipient of excuse',
    s2Hint: 'Mark one (1) box. The Bureau does not judge. The Bureau bills.',
    aud_boss: 'My boss',
    aud_friend: 'A friend',
    aud_date: 'A date',
    aud_family: 'Family',
    aud_gym: 'The gym',
    s3Title: '<b>Section 3.</b> Chaos clearance level',
    chaosHints: {
      mild: 'Mild — genuinely plausible. Boring on purpose.',
      spicy: 'Spicy — plausible, with one oddly specific detail.',
      delulu: 'Delulu — unhinged escalation. Weather-backed, fact-free.',
    },
    chaosLabels: ['Mild', 'Spicy', 'Delulu'],
    sigScript: 'definitely me',
    sigLine: 'Applicant’s signature (any name works)',
    btnGenerate: 'Generate alibi',
    btnFiling: 'Filing…',
    reqBoth: 'Complete Sections 1 & 2 to file.',
    reqOne: 'Complete Section {n} to file.',
    processing: '"PROCESSING: "',
    loading: [
      'consulting local traffic cameras…',
      'checking if it actually rained…',
      'bribing a meteorologist…',
      'cross-referencing your neighbor’s doorbell footage…',
      'shredding contradictory evidence…',
      'notarizing supporting documents…',
      'calibrating the plausibility gauge…',
      'obtaining sign-off from Dept. 404…',
    ],
    genFail: 'The Bureau is experiencing delays. Please resubmit your request.',
    certTitle: 'Official Alibi Certificate',
    docPrefix: 'DOCUMENT No.',
    stamp: 'Approved',
    gaugeLabel: 'Credibility',
    credClasses: { high: 'ROUTINE', mid: 'QUESTIONABLE', low: 'DELUSIONAL' },
    riskTitle: 'Risk assessment',
    condTitle: 'Verified conditions',
    wind: 'wind',
    btnCopy: 'Copy excuse',
    copied: 'Copied ✓',
    copyFail: 'Copy failed',
    btnRegen: 'I need a better one ↻',
    finePrint:
      'The Bureau approves all excuses. That is the business model.<br/>Void where prohibited. Valid everywhere else, emotionally.',
    deskFoot: 'For entertainment purposes. Probably.',
    deskFootSub: 'No data stored · Weather by Open-Meteo · Lies by you',
    langToggle: 'Español',
  },
  es: {
    agency: 'Oficina de la Negación Plausible',
    formTitle: 'Solicitud de Excusa de Emergencia',
    tagline: '“Negación plausible, como servicio.” — Escriba a máquina o con letra clara. Mienta solo con tinta negra.',
    confidential: 'Confidencial',
    received: 'Recibido',
    caseFile: 'Expediente: su paradero',
    s1Title: '<b>Sección 1.</b> Condiciones verificadas',
    s1Hint: 'La Oficina requiere sus coordenadas. La evidencia hace la mentira.',
    btnGeo: '<span aria-hidden="true">⌖</span> Usar mi ubicación',
    btnGeoBusy: 'Localizando…',
    divider: '— o —',
    cityPlaceholder: 'Escriba su ciudad',
    citySearchLabel: 'Buscar una ciudad',
    cityNone: 'No consta ese lugar en el registro. Sospechoso.',
    cityFail: 'Registro no disponible. Inténtelo de nuevo.',
    amend: 'Corregir ubicación',
    kLocation: 'Ubicación',
    kTemperature: 'Temperatura',
    kConditions: 'Condiciones',
    kWind: 'Viento',
    kPrecip: 'Precipitación',
    kTraffic: 'Tráfico',
    trafficLevels: { free: 'fluido', slow: 'lento', jam: 'atasco', closed: 'vía cortada' },
    verifying: 'verificando…',
    locFail: 'No se pudieron verificar las condiciones locales. El cielo se niega a cooperar — inténtelo de nuevo.',
    geoDenied: 'Ubicación denegada. Muy de coartada por su parte. Escriba una ciudad.',
    geoUnsupported: 'Este dispositivo se niega a revelar su paradero. Escriba una ciudad.',
    s2Title: '<b>Sección 2.</b> Destinatario de la excusa',
    s2Hint: 'Marque una (1) casilla. La Oficina no juzga. La Oficina factura.',
    aud_boss: 'Mi jefe',
    aud_friend: 'Una amistad',
    aud_date: 'Una cita',
    aud_family: 'La familia',
    aud_gym: 'El gimnasio',
    s3Title: '<b>Sección 3.</b> Nivel de caos autorizado',
    chaosHints: {
      mild: 'Suave — genuinamente creíble. Aburrida a propósito.',
      spicy: 'Picante — creíble, con un detalle extrañamente específico.',
      delulu: 'Delulu — escalada desquiciada. Con datos del clima, sin hechos.',
    },
    chaosLabels: ['Suave', 'Picante', 'Delulu'],
    sigScript: 'yo, de verdad',
    sigLine: 'Firma del solicitante (cualquier nombre vale)',
    btnGenerate: 'Generar coartada',
    btnFiling: 'Tramitando…',
    reqBoth: 'Complete las Secciones 1 y 2 para tramitar.',
    reqOne: 'Complete la Sección {n} para tramitar.',
    processing: '"TRAMITANDO: "',
    loading: [
      'consultando cámaras de tráfico locales…',
      'comprobando si de verdad llovió…',
      'sobornando a una meteoróloga…',
      'contrastando la cámara del timbre del vecino…',
      'triturando pruebas contradictorias…',
      'notarizando documentos de apoyo…',
      'calibrando el medidor de plausibilidad…',
      'obteniendo el visto bueno del Depto. 404…',
    ],
    genFail: 'La Oficina sufre demoras. Vuelva a presentar su solicitud.',
    certTitle: 'Certificado Oficial de Coartada',
    docPrefix: 'DOCUMENTO N.º',
    stamp: 'Aprobado',
    gaugeLabel: 'Credibilidad',
    credClasses: { high: 'RUTINARIO', mid: 'CUESTIONABLE', low: 'DELIRANTE' },
    riskTitle: 'Evaluación de riesgo',
    condTitle: 'Condiciones verificadas',
    wind: 'viento',
    btnCopy: 'Copiar excusa',
    copied: 'Copiada ✓',
    copyFail: 'Error al copiar',
    btnRegen: 'Necesito una mejor ↻',
    finePrint:
      'La Oficina aprueba todas las excusas. Ese es el modelo de negocio.<br/>Nulo donde esté prohibido. Válido en el resto, emocionalmente.',
    deskFoot: 'Con fines de entretenimiento. Probablemente.',
    deskFootSub: 'No se guardan datos · Clima de Open-Meteo · Mentiras suyas',
    langToggle: 'English',
  },
};

export let lang = (() => {
  const saved = localStorage.getItem('alibi-lang');
  if (saved === 'en' || saved === 'es') return saved;
  return (navigator.language || '').toLowerCase().startsWith('es') ? 'es' : 'en';
})();

export function t(key) {
  return STRINGS[lang][key];
}

export function setLang(next) {
  lang = next;
  localStorage.setItem('alibi-lang', next);
  applyLang();
}

export function applyLang() {
  const dict = STRINGS[lang];
  document.documentElement.lang = lang;
  document.documentElement.style.setProperty('--processing-label', dict.processing);
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = dict[el.dataset.i18n];
    if (typeof v === 'string') el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const v = dict[el.dataset.i18nHtml];
    if (typeof v === 'string') el.innerHTML = v;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = dict[el.dataset.i18nPlaceholder];
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', dict[el.dataset.i18nAria]);
  });
  document.querySelectorAll('.chaos-labels span').forEach((el, i) => {
    el.textContent = dict.chaosLabels[i];
  });
}
