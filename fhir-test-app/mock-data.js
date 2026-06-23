// Bundled, de-identified FHIR R4 test data.
//
// This mirrors the shape of what the PointClickCare FHIR Sandbox returns so the
// app is fully demonstrable with no credentials. All names, dates, and IDs are
// fictional and contain no Protected Health Information (PHI).
//
// Each resource follows the US Core / FHIR R4 profiles that PCC's USCDI
// Connector exposes. Responses are returned as FHIR `searchset` Bundles, exactly
// like a real FHIR server.

const PATIENTS = [
  {
    resourceType: 'Patient',
    id: 'pat-1001',
    meta: { profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient'] },
    identifier: [{ system: 'https://fhir.pointclickcare.com/patient', value: 'PCC-1001' }],
    active: true,
    name: [{ use: 'official', family: 'Hawkins', given: ['Eleanor', 'R'] }],
    gender: 'female',
    birthDate: '1939-04-12',
    address: [{ use: 'home', line: ['482 Birchwood Ln'], city: 'Springfield', state: 'IL', postalCode: '62704', country: 'US' }],
    telecom: [{ system: 'phone', value: '+1-217-555-0142', use: 'home' }],
  },
  {
    resourceType: 'Patient',
    id: 'pat-1002',
    meta: { profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient'] },
    identifier: [{ system: 'https://fhir.pointclickcare.com/patient', value: 'PCC-1002' }],
    active: true,
    name: [{ use: 'official', family: 'Okafor', given: ['Daniel'] }],
    gender: 'male',
    birthDate: '1945-11-30',
    address: [{ use: 'home', line: ['17 Maple Court'], city: 'Madison', state: 'WI', postalCode: '53703', country: 'US' }],
    telecom: [{ system: 'phone', value: '+1-608-555-0198', use: 'home' }],
  },
  {
    resourceType: 'Patient',
    id: 'pat-1003',
    meta: { profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient'] },
    identifier: [{ system: 'https://fhir.pointclickcare.com/patient', value: 'PCC-1003' }],
    active: true,
    name: [{ use: 'official', family: 'Delgado', given: ['Maria', 'L'] }],
    gender: 'female',
    birthDate: '1952-07-08',
    address: [{ use: 'home', line: ['9009 Sunset Blvd', 'Apt 3B'], city: 'Phoenix', state: 'AZ', postalCode: '85004', country: 'US' }],
    telecom: [{ system: 'phone', value: '+1-602-555-0177', use: 'mobile' }],
  },
];

// Clinical resources keyed by patient id.
const CONDITIONS = {
  'pat-1001': [
    cond('cond-2001', 'pat-1001', '44054006', 'Type 2 diabetes mellitus', 'active', '2018-03-15'),
    cond('cond-2002', 'pat-1001', '38341003', 'Hypertensive disorder', 'active', '2016-09-01'),
  ],
  'pat-1002': [
    cond('cond-2003', 'pat-1002', '13644009', 'Hypercholesterolemia', 'active', '2019-01-22'),
    cond('cond-2004', 'pat-1002', '195967001', 'Asthma', 'active', '2005-06-10'),
  ],
  'pat-1003': [
    cond('cond-2005', 'pat-1003', '69896004', 'Rheumatoid arthritis', 'active', '2014-11-05'),
  ],
};

const OBSERVATIONS = {
  'pat-1001': [
    vitals('obs-3001', 'pat-1001', '8480-6', 'Systolic blood pressure', 142, 'mm[Hg]', '2024-05-02T09:15:00Z'),
    vitals('obs-3002', 'pat-1001', '8462-4', 'Diastolic blood pressure', 88, 'mm[Hg]', '2024-05-02T09:15:00Z'),
    vitals('obs-3003', 'pat-1001', '4548-4', 'Hemoglobin A1c', 7.4, '%', '2024-04-18T08:00:00Z'),
    vitals('obs-3004', 'pat-1001', '29463-7', 'Body weight', 68.5, 'kg', '2024-05-02T09:10:00Z'),
  ],
  'pat-1002': [
    vitals('obs-3005', 'pat-1002', '2093-3', 'Total cholesterol', 214, 'mg/dL', '2024-03-30T07:45:00Z'),
    vitals('obs-3006', 'pat-1002', '8867-4', 'Heart rate', 72, '/min', '2024-05-11T10:30:00Z'),
  ],
  'pat-1003': [
    vitals('obs-3007', 'pat-1003', '8310-5', 'Body temperature', 37.1, 'Cel', '2024-05-20T14:00:00Z'),
    vitals('obs-3008', 'pat-1003', '718-7', 'Hemoglobin', 11.8, 'g/dL', '2024-05-20T14:05:00Z'),
  ],
};

const MEDICATIONS = {
  'pat-1001': [
    med('med-4001', 'pat-1001', '860975', 'Metformin 500 mg oral tablet', 'active', '2024-01-10'),
    med('med-4002', 'pat-1001', '197361', 'Lisinopril 10 mg oral tablet', 'active', '2023-12-01'),
  ],
  'pat-1002': [
    med('med-4003', 'pat-1002', '617312', 'Atorvastatin 20 mg oral tablet', 'active', '2024-02-15'),
  ],
  'pat-1003': [
    med('med-4004', 'pat-1003', '105585', 'Methotrexate 2.5 mg oral tablet', 'active', '2024-01-05'),
    med('med-4005', 'pat-1003', '197805', 'Folic acid 1 mg oral tablet', 'active', '2024-01-05'),
  ],
};

const ALLERGIES = {
  'pat-1001': [
    allergy('alg-5001', 'pat-1001', '7980', 'Penicillin', 'high', 'Rash'),
  ],
  'pat-1002': [
    allergy('alg-5002', 'pat-1002', '1191', 'Aspirin', 'low', 'Hives'),
  ],
  'pat-1003': [],
};

// ---- helpers to keep resource definitions terse -------------------------

function cond(id, patientId, code, text, clinicalStatus, onset) {
  return {
    resourceType: 'Condition',
    id,
    meta: { profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-condition-problems-health-concerns'] },
    clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: clinicalStatus }] },
    verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed' }] },
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'problem-list-item' }] }],
    code: { coding: [{ system: 'http://snomed.info/sct', code, display: text }], text },
    subject: { reference: `Patient/${patientId}` },
    onsetDateTime: onset,
  };
}

function vitals(id, patientId, code, text, value, unit, when) {
  return {
    resourceType: 'Observation',
    id,
    meta: { profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-vital-signs'] },
    status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
    code: { coding: [{ system: 'http://loinc.org', code, display: text }], text },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: when,
    valueQuantity: { value, unit, system: 'http://unitsofmeasure.org', code: unit },
  };
}

function med(id, patientId, code, text, status, authoredOn) {
  return {
    resourceType: 'MedicationRequest',
    id,
    meta: { profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-medicationrequest'] },
    status,
    intent: 'order',
    medicationCodeableConcept: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code, display: text }], text },
    subject: { reference: `Patient/${patientId}` },
    authoredOn,
  };
}

function allergy(id, patientId, code, text, criticality, reaction) {
  return {
    resourceType: 'AllergyIntolerance',
    id,
    meta: { profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-allergyintolerance'] },
    clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active' }] },
    verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification', code: 'confirmed' }] },
    criticality,
    code: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code, display: text }], text },
    patient: { reference: `Patient/${patientId}` },
    reaction: reaction ? [{ manifestation: [{ text: reaction }] }] : undefined,
  };
}

// Wrap an array of resources in a FHIR searchset Bundle, like a real server.
function bundle(resources) {
  return {
    resourceType: 'Bundle',
    type: 'searchset',
    total: resources.length,
    entry: resources.map((r) => ({
      fullUrl: `urn:uuid:${r.id}`,
      resource: r,
    })),
  };
}

const RESOURCE_MAP = {
  Condition: CONDITIONS,
  Observation: OBSERVATIONS,
  MedicationRequest: MEDICATIONS,
  AllergyIntolerance: ALLERGIES,
};

export const mock = {
  // GET [base]/Patient
  listPatients() {
    return bundle(PATIENTS);
  },
  // GET [base]/Patient/{id}
  getPatient(id) {
    return PATIENTS.find((p) => p.id === id) || null;
  },
  // GET [base]/{ResourceType}?patient={id}
  searchByPatient(resourceType, patientId) {
    const table = RESOURCE_MAP[resourceType];
    if (!table) return bundle([]);
    return bundle(table[patientId] || []);
  },
};
