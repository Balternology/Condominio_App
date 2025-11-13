// Service to fetch current UF value from CMF API
// Exposes: fetchCurrentUf() -> { valueClp: number, date: string }

const isDev = import.meta.env.DEV;
// In dev, use Vite proxy path to avoid CORS; in prod, call full CMF API URL
const API_URL = isDev
  ? (import.meta.env.VITE_CMF_API_PROXY_PATH || '/cmf/uf')
  : (import.meta.env.VITE_CMF_API_URL || 'https://api.cmfchile.cl/api-sbifv3/recursos_api/uf');
const API_KEY = import.meta.env.VITE_CMF_API_KEY;

function parseChileanNumber(str) {
  if (typeof str !== 'string') return NaN;
  // Convert "20.939,49" -> 20939.49
  const normalized = str.replace(/\./g, '').replace(',', '.');
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : NaN;
}

export async function fetchCurrentUf(signal) {
  if (!API_KEY) {
    throw new Error('Falta VITE_CMF_API_KEY en variables de entorno');
  }
  const url = `${API_URL}?apikey=${API_KEY}&formato=json`;
  const res = await fetch(url, {
    signal,
    headers: { 'Accept': 'application/json' }
  });
  if (!res.ok) {
    let detail = '';
    try { detail = await res.text(); } catch {}
    throw new Error(`Error al consultar UF: ${res.status} ${res.statusText}${detail ? ` - ${detail}` : ''}`);
  }
  const data = await res.json();
  // Expected JSON: { UFs: [ { Valor: "20.939,49", Fecha: "YYYY-MM-DD" } ] }
  const ufItem = data?.UFs?.[0];
  if (!ufItem) {
    throw new Error('Respuesta UF inesperada');
  }
  const valueClp = parseChileanNumber(ufItem.Valor);
  const date = ufItem.Fecha;
  if (!Number.isFinite(valueClp)) {
    throw new Error('No se pudo parsear el valor UF');
  }
  return { valueClp, date };
}

export function formatClp(amount) {
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `CLP ${Math.round(amount).toLocaleString('es-CL')}`;
  }
}

export function formatNumberUf(n) {
  try {
    return new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  } catch {
    return String(n);
  }
}
