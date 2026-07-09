import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
} from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';
import {
  getFunctions,
  httpsCallable,
} from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-functions.js';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
} from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCyznwtqwPZh3-1jbo6dLqsPEXtcWKtgQo',
  authDomain: 'band2-d72ec.firebaseapp.com',
  databaseURL: 'https://band2-d72ec-default-rtdb.firebaseio.com',
  projectId: 'band2-d72ec',
  storageBucket: 'band2-d72ec.firebasestorage.app',
  messagingSenderId: '460954161149',
  appId: '1:460954161149:web:a6288daa614ed132fbd394',
  measurementId: 'G-TX5K0ZZZFP',
};

const functionsBase = 'https://us-central1-band2-d72ec.cloudfunctions.net';
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app, 'us-central1');
const storage = getStorage(app);

const instruments = [
  ['flute', 'Flute', ['fl', 'flute']],
  ['piccolo', 'Piccolo', ['picc', 'piccolo']],
  ['clarinet', 'Clarinet', ['clarinet', 'clar', 'cl']],
  ['bass_clarinet', 'Bass Clarinet', ['bass clarinet', 'bass_clarinet', 'bassclarinet', 'bcl', 'bass cl']],
  ['alto_saxophone', 'Alto Saxophone', ['alto sax', 'alto_sax', 'alto', 'alto saxophone']],
  ['tenor_saxophone', 'Tenor Saxophone', ['tenor sax', 'tenor_sax', 'tenor', 'tenor saxophone']],
  ['baritone_saxophone', 'Baritone Saxophone', ['bari sax', 'baritone sax', 'baritone_sax', 'bari']],
  ['trumpet', 'Trumpet', ['trumpet', 'trpt', 'tpt']],
  ['horn', 'Horn', ['horn', 'mello', 'mellophone']],
  ['trombone', 'Trombone', ['trombone', 'bone']],
  ['euphonium', 'Euphonium', ['euphonium', 'euph', 'baritone horn']],
  ['tuba', 'Tuba', ['tuba']],
  ['snare_drum', 'Snare Drum', ['snare', 'snare drum', 'sd']],
  ['tenor_drum', 'Tenor Drum', ['tenor drum', 'tenors', 'quads', 'quints']],
  ['bass_drum', 'Bass Drum', ['bass drum', 'bassdrum', 'bd']],
  ['cymbals', 'Cymbals', ['cymbal', 'cymbals', 'cyms']],
  ['auxiliary_percussion', 'Auxiliary Percussion', ['auxiliary', 'aux', 'percussion', 'aux percussion']],
];

const instrumentLabels = Object.fromEntries(instruments.map(([id, label]) => [id, label]));
const concertKeys = ['Bb', 'C', 'Eb', 'F', 'Ab', 'Db', 'G', 'D'];

const state = {
  email: '',
  bands: [],
  selectedBandId: '',
  rows: [],
};

const els = {
  authSection: document.getElementById('director-auth'),
  appSection: document.getElementById('director-app'),
  loginForm: document.getElementById('director-login-form'),
  email: document.getElementById('director-email'),
  code: document.getElementById('director-code'),
  codeStep: document.getElementById('code-step'),
  sendCode: document.getElementById('send-code-button'),
  verifyCode: document.getElementById('verify-code-button'),
  authStatus: document.getElementById('director-auth-status'),
  signOut: document.getElementById('director-sign-out'),
  portalTitle: document.getElementById('portal-title'),
  bandSelect: document.getElementById('band-select'),
  bandName: document.getElementById('band-name'),
  bandJoinCode: document.getElementById('band-join-code'),
  saveBand: document.getElementById('save-band-button'),
  bandStatus: document.getElementById('band-status'),
  memberCount: document.getElementById('member-count'),
  memberList: document.getElementById('member-list'),
  pieceTitle: document.getElementById('piece-title'),
  pieceId: document.getElementById('piece-id'),
  pieceTempo: document.getElementById('piece-tempo'),
  pieceCategory: document.getElementById('piece-category'),
  dropzone: document.getElementById('director-dropzone'),
  files: document.getElementById('piece-files'),
  uploadReview: document.getElementById('upload-review'),
  uploadPiece: document.getElementById('upload-piece-button'),
  uploadStatus: document.getElementById('upload-status'),
  pieceList: document.getElementById('piece-list'),
  shortyTitle: document.getElementById('shorty-title'),
  shortyId: document.getElementById('shorty-id'),
  shortyKey: document.getElementById('shorty-key'),
  shortyNotes: document.getElementById('shorty-notes'),
  shortyText: document.getElementById('shorty-text'),
  saveShorty: document.getElementById('save-shorty-button'),
  shortyStatus: document.getElementById('shorty-status'),
  shortyList: document.getElementById('shorty-list'),
};

const call = (name, data = {}) => httpsCallable(functions, name)(data).then((result) => result.data);

function setStatus(el, message, kind = 'neutral') {
  if (!el) return;
  el.textContent = message;
  el.dataset.kind = kind;
}

function selectedBand() {
  return state.bands.find((band) => band.bandId === state.selectedBandId) || state.bands[0] || null;
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

function titleCase(value) {
  return String(value || '')
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function inferTitle(files) {
  const first = files[0]?.name || '';
  return titleCase(first.replace(/\.[^.]+$/, '').replace(/\b(part|pt|score|music|sheet)\b/ig, ''));
}

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferInstrument(path) {
  const normalized = normalizeName(path);
  let best = ['', 0];
  for (const [id, , aliases] of instruments) {
    for (const alias of aliases) {
      const score = normalized.includes(alias) ? alias.length : 0;
      if (score > best[1]) best = [id, score];
    }
  }
  return best[0];
}

function inferPart(path) {
  const normalized = normalizeName(path);
  const numberMatch = normalized.match(/\b(?:part|pt)?\s*([123])\b/);
  const order = numberMatch ? Number(numberMatch[1]) : 1;
  return {
    partId: `part${order}`,
    label: `Part ${order}`,
    order,
  };
}

function storageFileName(originalName, partId, index) {
  const extension = originalName.match(/\.[^.]+$/)?.[0].toLowerCase() || '.png';
  const baseName = slugify(originalName.replace(/\.[^.]+$/, '')) || `file_${index + 1}`;
  return `${partId}_${baseName}${extension}`;
}

function sourceTypeForRows(rows) {
  const extensions = rows.map((row) => row.file.name.split('.').pop()?.toLowerCase() || '');
  if (extensions.some((ext) => ext === 'musicxml' || ext === 'xml')) return 'musicxml';
  if (extensions.some((ext) => ext === 'mid' || ext === 'midi')) return 'midi';
  return 'image';
}

function duplicateMappings(rows) {
  const seen = new Set();
  const duplicates = [];
  for (const row of rows) {
    for (const instrument of row.instruments) {
      const key = `${instrument}:${row.partId}`;
      if (seen.has(key)) duplicates.push(`${instrumentLabels[instrument] || instrument} ${row.label}`);
      seen.add(key);
    }
  }
  return duplicates;
}

function renderAuth(signedIn) {
  els.authSection.hidden = signedIn;
  els.appSection.hidden = !signedIn;
}

async function refreshLeader() {
  setStatus(els.bandStatus, 'Loading band data...');
  const data = await call('leaderMe');
  state.email = data.email || '';
  state.bands = Array.isArray(data.bands) ? data.bands : [];
  if (!state.selectedBandId || !state.bands.some((band) => band.bandId === state.selectedBandId)) {
    state.selectedBandId = state.bands[0]?.bandId || '';
  }
  renderDashboard();
  setStatus(els.bandStatus, '');
}

function renderDashboard() {
  const band = selectedBand();
  els.portalTitle.textContent = band ? `${band.name} portal` : 'Band portal';
  els.bandSelect.innerHTML = state.bands.map((item) =>
    `<option value="${escapeHtml(item.bandId)}">${escapeHtml(item.name || item.bandId)}</option>`
  ).join('');
  els.bandSelect.value = state.selectedBandId;
  els.bandName.value = band?.name || '';
  els.bandJoinCode.value = band?.joinCode || '';
  renderMembers(band);
  renderPieces(band);
  renderShorties(band);
}

function renderMembers(band) {
  const members = Array.isArray(band?.members) ? band.members : [];
  els.memberCount.textContent = `${members.length} ${members.length === 1 ? 'member' : 'members'}`;
  els.memberList.innerHTML = members.length
    ? members.map((member) => `
      <div class="member-row">
        <strong>${escapeHtml(member.name || 'Unnamed')}</strong>
        <span>${escapeHtml(titleCase(member.instrument || 'No instrument'))}</span>
      </div>
    `).join('')
    : '<p class="muted">No members have joined this band yet.</p>';
}

function countParts(piece) {
  return Object.values(piece.parts || {}).reduce((sum, parts) => sum + Object.keys(parts || {}).length, 0);
}

function renderPieces(band) {
  const pieces = Object.entries(band?.pieces || {})
    .sort(([, a], [, b]) => (a.title || '').localeCompare(b.title || ''));
  els.pieceList.innerHTML = pieces.length
    ? pieces.map(([pieceId, piece]) => `
      <article class="portal-record" data-piece-id="${escapeHtml(pieceId)}">
        <div>
          <h3>${escapeHtml(piece.title || pieceId)}</h3>
          <p>${escapeHtml(pieceId)} - ${piece.tempo ? `${piece.tempo} bpm` : 'No tempo'} - ${countParts(piece)} parts</p>
        </div>
        <div class="record-actions">
          <button class="button secondary" data-action="edit-piece" type="button">Edit</button>
          <button class="button danger" data-action="delete-piece" type="button">Delete</button>
        </div>
      </article>
    `).join('')
    : '<p class="muted">No private pieces uploaded yet.</p>';
}

function renderShorties(band) {
  const shorties = Object.entries(band?.shorties || {})
    .sort(([, a], [, b]) => (a.title || '').localeCompare(b.title || ''));
  els.shortyList.innerHTML = shorties.length
    ? shorties.map(([shortyId, shorty]) => `
      <article class="portal-record" data-shorty-id="${escapeHtml(shortyId)}">
        <div>
          <h3>${escapeHtml(shorty.title || shortyId)}</h3>
          <p>${escapeHtml(shortyId)} - Concert ${escapeHtml(shorty.concertKey || 'Bb')}</p>
        </div>
        <div class="record-actions">
          <button class="button secondary" data-action="edit-shorty" type="button">Edit</button>
          <button class="button danger" data-action="delete-shorty" type="button">Delete</button>
        </div>
      </article>
    `).join('')
    : '<p class="muted">No shorties saved yet.</p>';
}

function renderRows() {
  if (state.rows.length === 0) {
    els.uploadReview.innerHTML = '';
    els.uploadPiece.disabled = true;
    return;
  }

  els.uploadReview.innerHTML = `
    <table class="review-table">
      <thead>
        <tr>
          <th>File</th>
          <th>Instruments</th>
          <th>Part</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${state.rows.map((row) => `
          <tr data-row-id="${escapeHtml(row.id)}">
            <td>
              <strong>${escapeHtml(row.file.name)}</strong>
              <small>${escapeHtml(row.detected ? `Detected ${instrumentLabels[row.detected]}` : 'Choose instrument')}</small>
            </td>
            <td>
              <select multiple data-field="instruments">
                ${instruments.map(([id, label]) => `
                  <option value="${id}" ${row.instruments.includes(id) ? 'selected' : ''}>${label}</option>
                `).join('')}
              </select>
            </td>
            <td>
              <select data-field="part">
                <option value="1" ${row.order === 1 ? 'selected' : ''}>Part 1</option>
                <option value="2" ${row.order === 2 ? 'selected' : ''}>Part 2</option>
                <option value="3" ${row.order === 3 ? 'selected' : ''}>Part 3</option>
              </select>
              <small>${escapeHtml(row.partId)} - ${escapeHtml(row.label)}</small>
            </td>
            <td>
              <button class="button secondary compact" data-action="remove-row" type="button">Remove</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  const problems = uploadProblems();
  els.uploadPiece.disabled = problems.length > 0;
  setStatus(els.uploadStatus, problems[0] || 'Ready to upload.', problems.length ? 'error' : 'success');
}

function uploadProblems() {
  const pieceId = slugify(els.pieceId.value || els.pieceTitle.value);
  const tempo = Number(els.pieceTempo.value);
  const duplicates = duplicateMappings(state.rows);
  if (!selectedBand()) return ['Choose a band first.'];
  if (!els.pieceTitle.value.trim() || !pieceId) return ['Piece title and ID are required.'];
  if (!els.pieceTempo.value.trim()) return ['Tempo is required.'];
  if (!Number.isFinite(tempo) || tempo < 20 || tempo > 320) return ['Tempo must be between 20 and 320.'];
  if (state.rows.length === 0) return ['Add files first.'];
  if (state.rows.some((row) => row.instruments.length === 0)) return ['Every file needs at least one instrument.'];
  if (duplicates.length) return [`Duplicate mapping: ${duplicates[0]}.`];
  return [];
}

function handleFiles(fileList) {
  const files = Array.from(fileList || []).filter((file) => !file.name.startsWith('.') && file.size > 0);
  if (files.length === 0) return;
  if (!els.pieceTitle.value.trim()) {
    const title = inferTitle(files);
    els.pieceTitle.value = title;
    els.pieceId.value = slugify(title);
  }
  state.rows = files.map((file, index) => {
    const detected = inferInstrument(file.name);
    const part = inferPart(file.name);
    return {
      id: `${file.name}-${file.lastModified}-${file.size}-${index}`,
      file,
      detected,
      instruments: detected ? [detected] : [],
      ...part,
    };
  });
  renderRows();
}

async function uploadPiece() {
  const problems = uploadProblems();
  if (problems.length) {
    setStatus(els.uploadStatus, problems[0], 'error');
    return;
  }

  const band = selectedBand();
  const bandId = band.bandId;
  const pieceId = slugify(els.pieceId.value || els.pieceTitle.value);
  const parts = {};
  els.uploadPiece.disabled = true;
  setStatus(els.uploadStatus, 'Preparing upload...');

  try {
    for (let index = 0; index < state.rows.length; index += 1) {
      const row = state.rows[index];
      const folder = row.instruments.length > 1 ? 'shared' : row.instruments[0];
      const fileName = storageFileName(row.file.name, row.partId, index);
      const path = `music/bands/${bandId}/${pieceId}/${folder}/${fileName}`;
      setStatus(els.uploadStatus, `Uploading ${index + 1} of ${state.rows.length}: ${row.file.name}`);
      await uploadBytes(storageRef(storage, path), row.file, {
        contentType: row.file.type || 'application/octet-stream',
      });
      for (const instrument of row.instruments) {
        parts[instrument] ||= {};
        parts[instrument][row.partId] = {
          label: row.label,
          order: row.order,
          path,
        };
      }
    }

    setStatus(els.uploadStatus, 'Writing metadata...');
    await call('leaderUpsertPiece', {
      bandId,
      pieceId,
      title: els.pieceTitle.value.trim(),
      tempo: Number(els.pieceTempo.value),
      category: els.pieceCategory.value.trim(),
      sourceType: sourceTypeForRows(state.rows),
      parts,
    });

    state.rows = [];
    els.files.value = '';
    els.pieceTitle.value = '';
    els.pieceId.value = '';
    els.pieceTempo.value = '';
    els.pieceCategory.value = '';
    renderRows();
    await refreshLeader();
    setStatus(els.uploadStatus, 'Piece uploaded.', 'success');
  } catch (error) {
    setStatus(els.uploadStatus, messageFromError(error), 'error');
  } finally {
    els.uploadPiece.disabled = uploadProblems().length > 0;
  }
}

function fillPieceEditor(pieceId) {
  const band = selectedBand();
  const piece = band?.pieces?.[pieceId];
  if (!piece) return;
  els.pieceTitle.value = piece.title || pieceId;
  els.pieceId.value = pieceId;
  els.pieceTempo.value = piece.tempo || '';
  els.pieceCategory.value = piece.category || '';
  state.rows = [];
  renderRows();
  setStatus(els.uploadStatus, 'Metadata loaded. Choose files to replace the piece, or delete it below.');
}

async function deletePiece(pieceId) {
  const band = selectedBand();
  if (!band) return;
  if (!window.confirm(`Delete ${pieceId} and its uploaded files?`)) return;
  await call('leaderDeletePiece', {
    bandId: band.bandId,
    pieceId,
    deleteStorage: true,
  });
  await refreshLeader();
}

async function saveBand() {
  const band = selectedBand();
  if (!band) return;
  setStatus(els.bandStatus, 'Saving...');
  try {
    await call('leaderUpdateBand', {
      bandId: band.bandId,
      name: els.bandName.value.trim(),
      joinCode: els.bandJoinCode.value.trim().toUpperCase(),
    });
    await refreshLeader();
    setStatus(els.bandStatus, 'Band saved.', 'success');
  } catch (error) {
    setStatus(els.bandStatus, messageFromError(error), 'error');
  }
}

async function saveShorty() {
  const band = selectedBand();
  const title = els.shortyTitle.value.trim();
  const shortyId = slugify(els.shortyId.value || title);
  if (!band || !title || !shortyId || !els.shortyText.value.trim()) {
    setStatus(els.shortyStatus, 'Title, ID, and template text are required.', 'error');
    return;
  }
  setStatus(els.shortyStatus, 'Saving shorty...');
  try {
    await call('leaderUpsertShorty', {
      bandId: band.bandId,
      shortyId,
      title,
      concertKey: els.shortyKey.value,
      text: els.shortyText.value,
      notes: els.shortyNotes.value.trim(),
    });
    els.shortyTitle.value = '';
    els.shortyId.value = '';
    els.shortyText.value = '';
    els.shortyNotes.value = '';
    await refreshLeader();
    setStatus(els.shortyStatus, 'Shorty saved.', 'success');
  } catch (error) {
    setStatus(els.shortyStatus, messageFromError(error), 'error');
  }
}

function fillShortyEditor(shortyId) {
  const band = selectedBand();
  const shorty = band?.shorties?.[shortyId];
  if (!shorty) return;
  els.shortyTitle.value = shorty.title || shortyId;
  els.shortyId.value = shortyId;
  els.shortyKey.value = concertKeys.includes(shorty.concertKey) ? shorty.concertKey : 'Bb';
  els.shortyText.value = shorty.text || '';
  els.shortyNotes.value = shorty.notes || '';
}

async function deleteShorty(shortyId) {
  const band = selectedBand();
  if (!band) return;
  if (!window.confirm(`Delete ${shortyId}?`)) return;
  await call('leaderDeleteShorty', {
    bandId: band.bandId,
    shortyId,
  });
  await refreshLeader();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char]));
}

function messageFromError(error) {
  return error?.message || String(error) || 'Something went wrong.';
}

els.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = els.email.value.trim();
  if (!email) return;
  els.sendCode.disabled = true;
  setStatus(els.authStatus, 'Sending code...');
  try {
    const response = await fetch(`${functionsBase}/requestLeaderCode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok !== true) throw new Error(result.error || 'Unable to send code.');
    els.codeStep.hidden = false;
    els.code.focus();
    setStatus(
      els.authStatus,
      result.emailSent
        ? 'Code sent. Check your inbox.'
        : 'Code created, but email is not configured yet. Contact NoteLink support.',
      result.emailSent ? 'success' : 'error',
    );
  } catch (error) {
    setStatus(els.authStatus, messageFromError(error), 'error');
  } finally {
    els.sendCode.disabled = false;
  }
});

els.verifyCode.addEventListener('click', async () => {
  els.verifyCode.disabled = true;
  setStatus(els.authStatus, 'Verifying...');
  try {
    const response = await fetch(`${functionsBase}/verifyLeaderCode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: els.email.value.trim(),
        code: els.code.value.trim(),
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok !== true || !result.token) {
      throw new Error(result.error || 'Unable to verify code.');
    }
    await signInWithCustomToken(auth, result.token);
    await auth.currentUser?.getIdToken(true);
    setStatus(els.authStatus, 'Signed in.', 'success');
  } catch (error) {
    setStatus(els.authStatus, messageFromError(error), 'error');
  } finally {
    els.verifyCode.disabled = false;
  }
});

els.signOut.addEventListener('click', () => signOut(auth));
els.bandSelect.addEventListener('change', () => {
  state.selectedBandId = els.bandSelect.value;
  renderDashboard();
});
els.saveBand.addEventListener('click', saveBand);
els.files.addEventListener('change', (event) => handleFiles(event.target.files));
els.dropzone.addEventListener('dragover', (event) => event.preventDefault());
els.dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  handleFiles(event.dataTransfer.files);
});
els.pieceTitle.addEventListener('input', () => {
  if (!els.pieceId.value.trim()) els.pieceId.value = slugify(els.pieceTitle.value);
  renderRows();
});
els.pieceId.addEventListener('input', () => {
  els.pieceId.value = slugify(els.pieceId.value);
  renderRows();
});
els.pieceTempo.addEventListener('input', renderRows);
els.uploadPiece.addEventListener('click', uploadPiece);
els.saveShorty.addEventListener('click', saveShorty);
els.shortyTitle.addEventListener('input', () => {
  if (!els.shortyId.value.trim()) els.shortyId.value = slugify(els.shortyTitle.value);
});

els.uploadReview.addEventListener('change', (event) => {
  const rowEl = event.target.closest('[data-row-id]');
  if (!rowEl) return;
  const row = state.rows.find((item) => item.id === rowEl.dataset.rowId);
  if (!row) return;
  if (event.target.dataset.field === 'instruments') {
    row.instruments = Array.from(event.target.selectedOptions, (option) => option.value);
  }
  if (event.target.dataset.field === 'part') {
    const order = Number(event.target.value);
    row.order = order;
    row.partId = `part${order}`;
    row.label = `Part ${order}`;
  }
  renderRows();
});

els.uploadReview.addEventListener('click', (event) => {
  if (event.target.dataset.action !== 'remove-row') return;
  const rowEl = event.target.closest('[data-row-id]');
  state.rows = state.rows.filter((item) => item.id !== rowEl?.dataset.rowId);
  renderRows();
});

els.pieceList.addEventListener('click', async (event) => {
  const record = event.target.closest('[data-piece-id]');
  if (!record) return;
  const pieceId = record.dataset.pieceId;
  if (event.target.dataset.action === 'edit-piece') fillPieceEditor(pieceId);
  if (event.target.dataset.action === 'delete-piece') {
    try {
      await deletePiece(pieceId);
    } catch (error) {
      setStatus(els.uploadStatus, messageFromError(error), 'error');
    }
  }
});

els.shortyList.addEventListener('click', async (event) => {
  const record = event.target.closest('[data-shorty-id]');
  if (!record) return;
  const shortyId = record.dataset.shortyId;
  if (event.target.dataset.action === 'edit-shorty') fillShortyEditor(shortyId);
  if (event.target.dataset.action === 'delete-shorty') {
    try {
      await deleteShorty(shortyId);
    } catch (error) {
      setStatus(els.shortyStatus, messageFromError(error), 'error');
    }
  }
});

onAuthStateChanged(auth, async (user) => {
  renderAuth(Boolean(user));
  if (!user) return;
  try {
    await user.getIdToken(true);
    await refreshLeader();
  } catch (error) {
    setStatus(els.bandStatus, messageFromError(error), 'error');
  }
});
