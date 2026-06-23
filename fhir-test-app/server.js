// Express backend for the PointClickCare FHIR test app.
//
// Responsibilities:
//   1. Hold the OAuth secret server-side (never exposed to the browser).
//   2. Proxy a small set of FHIR reads to the PCC FHIR Sandbox.
//   3. Fall back to bundled mock FHIR data when no credentials are configured,
//      so the app runs out of the box.
//
// The browser only ever talks to these local /api/* routes.

import './load-env.js';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { mock } from './mock-data.js';
import { live, isLiveMode, modeInfo } from './fhir-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Pick the data source once at startup based on configured credentials.
const source = isLiveMode ? live : mock;

// Resource types this test app knows how to fetch per patient.
const PATIENT_RESOURCES = ['Condition', 'Observation', 'MedicationRequest', 'AllergyIntolerance'];

app.use(express.static(join(__dirname, 'public')));

// Small async wrapper so route handlers can throw and get a clean 502.
const wrap = (fn) => (req, res) => {
  Promise.resolve(fn(req, res)).catch((err) => {
    console.error(err);
    res.status(502).json({
      error: 'upstream_error',
      message: err.message,
      hint: isLiveMode
        ? 'Check PCC credentials, token URL, FHIR base URL, and approved scopes.'
        : 'Unexpected error serving mock data.',
    });
  });
};

// Tells the UI whether it is showing live or mock data.
app.get('/api/mode', (req, res) => {
  res.json(modeInfo());
});

// List patients.
app.get('/api/patients', wrap(async (req, res) => {
  const bundle = await source.listPatients();
  const patients = (bundle.entry || []).map((e) => e.resource);
  res.json({ total: bundle.total ?? patients.length, patients });
}));

// One patient plus all of their clinical resources, assembled for the UI.
app.get('/api/patients/:id', wrap(async (req, res) => {
  const { id } = req.params;
  const patient = await source.getPatient(id);
  if (!patient) {
    return res.status(404).json({ error: 'not_found', message: `Patient ${id} not found` });
  }

  const sections = {};
  await Promise.all(
    PATIENT_RESOURCES.map(async (type) => {
      const bundle = await source.searchByPatient(type, id);
      sections[type] = (bundle.entry || []).map((e) => e.resource);
    })
  );

  res.json({ patient, sections });
}));

app.listen(PORT, () => {
  const { mode, fhirBaseUrl } = modeInfo();
  console.log(`\n  PCC FHIR test app running:  http://localhost:${PORT}`);
  console.log(`  Data source: ${mode.toUpperCase()}${mode === 'live' ? ` (${fhirBaseUrl})` : ' (bundled de-identified test data)'}`);
  if (mode === 'mock') {
    console.log('  → Set PCC_CLIENT_ID and PCC_CLIENT_SECRET (see .env.example) to use the live Sandbox.\n');
  } else {
    console.log('');
  }
});
