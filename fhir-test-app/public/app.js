// Front-end for the PCC FHIR test app. Talks only to the local /api/* routes;
// the server handles OAuth and either proxies the PCC Sandbox or serves mock data.

const els = {
  modeBadge: document.getElementById('mode-badge'),
  patientList: document.getElementById('patient-list'),
  detail: document.getElementById('detail'),
  footer: document.getElementById('footer-note'),
};

let selectedId = null;

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  return res.json();
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function patientName(p) {
  const n = (p.name && p.name[0]) || {};
  const given = (n.given || []).join(' ');
  return [given, n.family].filter(Boolean).join(' ') || '(unnamed)';
}

function ageFromBirthDate(birthDate) {
  if (!birthDate) return '—';
  const dob = new Date(birthDate);
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

function codeText(concept) {
  if (!concept) return '—';
  if (concept.text) return concept.text;
  const c = (concept.coding && concept.coding[0]) || {};
  return c.display || c.code || '—';
}

// ---- rendering ----------------------------------------------------------

async function loadMode() {
  try {
    const info = await getJSON('/api/mode');
    const live = info.mode === 'live';
    els.modeBadge.textContent = live ? 'LIVE · PCC Sandbox' : 'MOCK DATA';
    els.modeBadge.className = `badge ${live ? 'badge-live' : 'badge-mock'}`;
    els.footer.textContent = live
      ? `Live data from ${info.fhirBaseUrl}`
      : 'Showing bundled de-identified FHIR R4 test data. Add PCC credentials to use the live Sandbox.';
  } catch {
    els.modeBadge.textContent = 'UNKNOWN';
  }
}

async function loadPatients() {
  try {
    const { patients, total } = await getJSON('/api/patients');
    els.patientList.innerHTML = '';
    if (!patients.length) {
      els.patientList.innerHTML = '<li class="muted">No patients returned.</li>';
      return;
    }
    for (const p of patients) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.dataset.id = p.id;
      btn.innerHTML = `
        <div class="pname">${esc(patientName(p))}</div>
        <div class="pmeta">${esc(p.gender || '—')} · DOB ${esc(p.birthDate || '—')} · #${esc(p.id)}</div>`;
      btn.addEventListener('click', () => selectPatient(p.id));
      li.appendChild(btn);
      els.patientList.appendChild(li);
    }
    els.patientList.dataset.total = total;
  } catch (err) {
    els.patientList.innerHTML = `<li class="error">${esc(err.message)}</li>`;
  }
}

async function selectPatient(id) {
  selectedId = id;
  document.querySelectorAll('.patient-list button').forEach((b) =>
    b.classList.toggle('active', b.dataset.id === id));
  els.detail.innerHTML = '<div class="empty-state"><p>Loading patient…</p></div>';

  try {
    const { patient, sections } = await getJSON(`/api/patients/${encodeURIComponent(id)}`);
    els.detail.innerHTML = renderPatient(patient, sections);
  } catch (err) {
    els.detail.innerHTML = `<div class="error">${esc(err.message)}</div>`;
  }
}

function renderPatient(p, sections) {
  const addr = (p.address && p.address[0]) || {};
  const addrLine = [
    (addr.line || []).join(', '),
    [addr.city, addr.state].filter(Boolean).join(', '),
    addr.postalCode,
  ].filter(Boolean).join(' · ');
  const phone = (p.telecom || []).find((t) => t.system === 'phone');

  return `
    <div class="patient-header">
      <h3>${esc(patientName(p))}</h3>
      <div class="demographics">
        <span><b>Age</b> ${esc(ageFromBirthDate(p.birthDate))}</span>
        <span><b>Sex</b> ${esc(p.gender || '—')}</span>
        <span><b>DOB</b> ${esc(p.birthDate || '—')}</span>
        <span><b>MRN</b> ${esc((p.identifier && p.identifier[0] && p.identifier[0].value) || p.id)}</span>
        ${phone ? `<span><b>Phone</b> ${esc(phone.value)}</span>` : ''}
        ${addrLine ? `<span><b>Address</b> ${esc(addrLine)}</span>` : ''}
      </div>
    </div>
    ${renderConditions(sections.Condition)}
    ${renderObservations(sections.Observation)}
    ${renderMedications(sections.MedicationRequest)}
    ${renderAllergies(sections.AllergyIntolerance)}
  `;
}

function cardShell(title, count, inner) {
  return `
    <div class="card">
      <h4>${esc(title)} <span class="count-pill">${count}</span></h4>
      ${count ? inner : '<p class="none">None on record.</p>'}
    </div>`;
}

function renderConditions(items = []) {
  const rows = items.map((c) => `
    <tr>
      <td>${esc(codeText(c.code))}</td>
      <td><span class="tag tag-active">${esc(statusOf(c.clinicalStatus))}</span></td>
      <td>${esc(c.onsetDateTime ? c.onsetDateTime.slice(0, 10) : '—')}</td>
    </tr>`).join('');
  return cardShell('Conditions', items.length,
    `<table><thead><tr><th>Problem</th><th>Status</th><th>Onset</th></tr></thead><tbody>${rows}</tbody></table>`);
}

function renderObservations(items = []) {
  const rows = items.map((o) => `
    <tr>
      <td>${esc(codeText(o.code))}</td>
      <td>${esc(valueOf(o))}</td>
      <td>${esc(o.effectiveDateTime ? o.effectiveDateTime.slice(0, 10) : '—')}</td>
    </tr>`).join('');
  return cardShell('Observations & Vitals', items.length,
    `<table><thead><tr><th>Measure</th><th>Value</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>`);
}

function renderMedications(items = []) {
  const rows = items.map((m) => `
    <tr>
      <td>${esc(codeText(m.medicationCodeableConcept))}</td>
      <td><span class="tag tag-active">${esc(m.status || '—')}</span></td>
      <td>${esc(m.authoredOn ? m.authoredOn.slice(0, 10) : '—')}</td>
    </tr>`).join('');
  return cardShell('Medications', items.length,
    `<table><thead><tr><th>Medication</th><th>Status</th><th>Ordered</th></tr></thead><tbody>${rows}</tbody></table>`);
}

function renderAllergies(items = []) {
  const rows = items.map((a) => {
    const crit = a.criticality || 'unknown';
    const cls = crit === 'high' ? 'tag-high' : crit === 'low' ? 'tag-low' : 'tag';
    const reaction = (a.reaction && a.reaction[0] && (a.reaction[0].manifestation || [])[0]);
    return `
      <tr>
        <td>${esc(codeText(a.code))}</td>
        <td><span class="tag ${cls}">${esc(crit)}</span></td>
        <td>${esc(reaction ? (reaction.text || codeText(reaction)) : '—')}</td>
      </tr>`;
  }).join('');
  return cardShell('Allergies', items.length,
    `<table><thead><tr><th>Substance</th><th>Criticality</th><th>Reaction</th></tr></thead><tbody>${rows}</tbody></table>`);
}

function statusOf(concept) {
  const c = concept && concept.coding && concept.coding[0];
  return (c && c.code) || '—';
}

function valueOf(o) {
  if (o.valueQuantity) {
    const v = o.valueQuantity;
    return `${v.value} ${v.unit || ''}`.trim();
  }
  if (o.valueString) return o.valueString;
  if (o.valueCodeableConcept) return codeText(o.valueCodeableConcept);
  return '—';
}

// ---- boot ---------------------------------------------------------------
loadMode();
loadPatients();
