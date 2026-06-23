# PointClickCare FHIR — Test App

A small Node.js test app that pulls test data from the
[PointClickCare FHIR API](https://fhir.pointclickcare.com) (FHIR R4 / USCDI
Connector). It ships with **bundled de-identified mock data so it runs out of the
box**, and switches to **live calls against the PointClickCare FHIR Sandbox** the
moment you add credentials.

The browser only ever talks to the local backend — the OAuth secret stays
server-side and there are no browser CORS issues.

## What it shows

A simple clinical viewer:

- **Patient** list and demographics
- **Condition** (problems)
- **Observation** (vitals & labs)
- **MedicationRequest** (medications)
- **AllergyIntolerance** (allergies)

A badge in the header shows whether you're viewing **MOCK DATA** or the
**LIVE PCC Sandbox**.

## Quick start (mock mode, no credentials)

```bash
cd fhir-test-app
npm install
npm start
```

Open <http://localhost:3000>. You'll see three sample patients with realistic
FHIR R4 records. No network calls are made.

## Switching to the live PointClickCare Sandbox

1. **Register an app** in the
   [PointClickCare Developer Program](https://developer.pointclickcare.com).
   Choose an authentication method and request the FHIR scopes (SMART on FHIR)
   your app needs. Development apps are auto-approved into the shared FHIR
   Sandbox, which contains de-identified medical records.
2. From your app listing under **My Apps**, copy the **Client ID** and
   **Client Secret**.
3. Copy the env template and fill in your values:

   ```bash
   cp .env.example .env
   # edit .env: set PCC_CLIENT_ID and PCC_CLIENT_SECRET
   ```

4. Confirm the **token URL**, **FHIR base URL**, and **scopes** in `.env`
   against the exact values shown in your app listing (these can differ per
   environment).
5. Restart:

   ```bash
   npm start
   ```

   The console and the UI badge will now say **LIVE**. The app authenticates
   with the OAuth2 `client_credentials` (system-to-system) flow, caches the
   token until just before it expires, and proxies FHIR reads to the Sandbox.

> The default `PCC_TOKEN_URL` and `PCC_FHIR_BASE_URL` in `.env.example` are
> best-guess defaults. The authoritative endpoints and the exact OAuth flow your
> app is provisioned for come from your PointClickCare developer app listing —
> always confirm them there.

## Project layout

| File | Purpose |
| --- | --- |
| `server.js` | Express backend. Serves the UI and `/api/*` routes; picks live vs. mock at startup. |
| `fhir-client.js` | Live PCC client: OAuth2 `client_credentials` + FHIR fetch wrapper with token caching. |
| `mock-data.js` | Bundled de-identified FHIR R4 test data (Patient, Condition, Observation, MedicationRequest, AllergyIntolerance). |
| `load-env.js` | Loads `.env` (Node built-in) before any module reads `process.env`. |
| `public/` | Front-end (HTML/CSS/JS) — talks only to the local `/api/*` routes. |
| `.env.example` | Credential template. Copy to `.env` (which is git-ignored). |

## API routes (local backend)

| Route | Returns |
| --- | --- |
| `GET /api/mode` | Whether the app is in `live` or `mock` mode, plus the configured FHIR base URL. |
| `GET /api/patients` | List of patients (`Patient` search). |
| `GET /api/patients/:id` | One patient plus their Conditions, Observations, Medications, and Allergies. |

In **live mode** these map to real FHIR reads:
`GET [base]/Patient`, `GET [base]/Patient/{id}`, and
`GET [base]/{ResourceType}?patient={id}`.

## Notes

- Requires **Node.js ≥ 18** (uses the built-in `fetch`). `.env` loading uses
  `process.loadEnvFile` (Node ≥ 20.6); older Node still runs fine in mock mode
  or with real environment variables exported.
- `.env` is git-ignored — **never commit real credentials**.
- The mock data is fictional and contains no PHI.
