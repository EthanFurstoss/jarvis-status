// Live client for the PointClickCare FHIR API.
//
// Implements the OAuth2 "client_credentials" (system-to-system) flow and a thin
// FHIR fetch wrapper. Tokens are cached in memory until shortly before they
// expire. This module is only used when credentials are configured; otherwise
// the server serves bundled mock data (see mock-data.js).

const config = {
  clientId: process.env.PCC_CLIENT_ID || '',
  clientSecret: process.env.PCC_CLIENT_SECRET || '',
  tokenUrl: process.env.PCC_TOKEN_URL || 'https://connect.pointclickcare.com/auth/token',
  fhirBaseUrl: process.env.PCC_FHIR_BASE_URL || 'https://fhir.pointclickcare.com/r4',
  scopes: process.env.PCC_SCOPES || '',
};

// Live mode is on only when both halves of the credential are present.
export const isLiveMode = Boolean(config.clientId && config.clientSecret);

export function modeInfo() {
  return {
    mode: isLiveMode ? 'live' : 'mock',
    fhirBaseUrl: config.fhirBaseUrl,
    tokenUrl: config.tokenUrl,
    scopes: config.scopes || null,
  };
}

let cachedToken = null; // { accessToken, expiresAt }

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - 60_000 > now) {
    return cachedToken.accessToken;
  }

  const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  const body = new URLSearchParams({ grant_type: 'client_credentials' });
  if (config.scopes) body.set('scope', config.scopes);

  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`OAuth token request failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const json = await res.json();
  const expiresInMs = (json.expires_in ? Number(json.expires_in) : 300) * 1000;
  cachedToken = { accessToken: json.access_token, expiresAt: now + expiresInMs };
  return cachedToken.accessToken;
}

// GET an arbitrary FHIR path (e.g. "Patient", "Patient/123",
// "Condition?patient=123"). Returns parsed JSON (a Resource or Bundle).
export async function fhirGet(path) {
  const token = await getAccessToken();
  const url = `${config.fhirBaseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/fhir+json',
    },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`FHIR request failed (${res.status}) for ${path}: ${detail.slice(0, 300)}`);
  }
  return res.json();
}

export const live = {
  listPatients: () => fhirGet('Patient'),
  getPatient: (id) => fhirGet(`Patient/${encodeURIComponent(id)}`),
  searchByPatient: (resourceType, patientId) =>
    fhirGet(`${resourceType}?patient=${encodeURIComponent(patientId)}`),
};
