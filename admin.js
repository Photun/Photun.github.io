// Dashboard logic: creates bands, lists bands, edits metadata, maps names->uid
for drum major.
import { auth, db } from './firebase-config.js';
import { ref, push, set, get, update, remove } from 'https://www.gstatic.com/
firebasejs/9.22.2/firebase-database.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/
firebase-auth.js';
import { makeJoinCode } from './utils.js';
// UI nodes
const dashboard = document.getElementById('dashboard');
const authArea = document.getElementById('authArea');
const bandsList = document.getElementById('bandsList');
const createBandBtn = document.getElementById('createBandBtn');
const newBandName = document.getElementById('newBandName');
const bandEditor = document.getElementById('bandEditor');
const bandTitle = document.getElementById('bandTitle');
const bandJoinCode = document.getElementById('bandJoinCode');
const secretNameInput = document.getElementById('secretNameInput');
const saveSecret = document.getElementById('saveSecret');
const membersList = document.getElementById('membersList');
const sessionToggle = document.getElementById('sessionToggle');
const notSignedInMsg = document.getElementById('notSignedInMsg');
const globalDrumMajor = document.getElementById('globalDrumMajor');
const regenJoin = document.getElementById('regenJoin');
const deleteBandBtn = document.getElementById('deleteBand');
let myUid = null;
let myBands = {};
let selectedBandId = null;
function show(el){ el?.classList.remove('hidden'); }
function hide(el){ el?.classList.add('hidden'); }
onAuthStateChanged(auth, async (user) => {
if (!user) {
hide(dashboard);
8
show(authArea);
show(notSignedInMsg);
return;
}
myUid = user.uid;
hide(authArea);
hide(notSignedInMsg);
show(dashboard);
await ensureUserProfile(user);
loadBands();
});
async function ensureUserProfile(user){
const userRef = ref(db, `users/${user.uid}`);
const snap = await get(userRef);
if (!snap.exists()){
await set(userRef, { uid: user.uid, name: user.email?.split('@')[0] ||
'(user)', bandId: '', instrument: '', preferredPart: 1 });
}
}
// Create band
createBandBtn?.addEventListener('click', async () => {
const name = newBandName.value.trim();
if (!name) return alert('Enter a band name');
let joinCode = makeJoinCode();
// simple uniqueness check
const allSnap = await get(ref(db, 'bands'));
const bands = allSnap.val() || {};
for (let i=0;i<5;i++){
const collision = Object.values(bands).some(b => b.joinCode === joinCode);
if (!collision) break;
joinCode = makeJoinCode();
}
const bandRef = push(ref(db, 'bands'));
const bandId = bandRef.key;
await set(bandRef, {
title: name,
joinCode,
members: {},
secretName: '',
session: { active: false, timestamp: Date.now() },
createdBy: myUid
});
newBandName.value = '';
loadBands();
9
});
// Load bands owned by me
async function loadBands(){
const snap = await get(ref(db, 'bands'));
const bands = snap.val() || {};
myBands = {};
bandsList.innerHTML = '';
Object.entries(bands).forEach(([bandId, band]) => {
if (band.createdBy !== myUid) return; // only show bands you created
myBands[bandId] = band;
const li = document.createElement('li');
li.className = 'bandItem';
li.innerHTML = `<div class="row spaceBetween"><div><strong>${band.title ||
bandId}</strong> <span class="muted">(${band.joinCode || ''})</span></div></
div>`;
const openBtn = document.createElement('button');
openBtn.className = 'btn small';
openBtn.textContent = 'Open';
openBtn.addEventListener('click', () => selectBand(bandId));
li.appendChild(openBtn);
bandsList.appendChild(li);
});
// clear editor
hide(bandEditor);
}
// Select band
async function selectBand(bandId){
selectedBandId = bandId;
const bandRef = ref(db, `bands/${bandId}`);
const snap = await get(bandRef);
const band = snap.val();
if (!band) return alert('Band not found');
show(bandEditor);
bandTitle.textContent = `Band: ${band.title || bandId}`;
bandJoinCode.textContent = band.joinCode || '';
secretNameInput.value = band.secretName || '';
sessionToggle.checked = band.session?.active || false;
// show drum major name in header
if (band.drumMajor) {
const dmSnap = await get(ref(db, `users/${band.drumMajor}`));
globalDrumMajor.textContent = dmSnap.exists() ? (dmSnap.val().name || '(no
name)') : '(unknown)';
} else {
globalDrumMajor.textContent = '—';
}
renderMembers(bandId);
10
}
// Save secret name
saveSecret?.addEventListener('click', async () => {
if (!selectedBandId) return;
await update(ref(db, `bands/${selectedBandId}`), { secretName:
secretNameInput.value });
alert('Saved');
loadBands();
});
// Toggle session active
sessionToggle?.addEventListener('change', async () => {
if (!selectedBandId) return;
await update(ref(db, `bands/${selectedBandId}/session`), { active: !!
sessionToggle.checked, timestamp: Date.now() });
});
// Regenerate join code
regenJoin?.addEventListener('click', async () => {
if (!selectedBandId) return;
const newCode = makeJoinCode();
await update(ref(db, `bands/${selectedBandId}`), { joinCode: newCode });
bandJoinCode.textContent = newCode;
alert('Join code regenerated');
loadBands();
});
// Delete band
deleteBandBtn?.addEventListener('click', async () => {
if (!selectedBandId) return;
if (!confirm('Delete this band? This cannot be undone.')) return;
await remove(ref(db, `bands/${selectedBandId}`));
selectedBandId = null;
hide(bandEditor);
loadBands();
});
// Render members list (by reading /users and filtering bandId)
async function renderMembers(bandId){
membersList.innerHTML = '';
const usersSnap = await get(ref(db, 'users'));
const users = usersSnap.val() || {};
const members = Object.values(users).filter(u => u.bandId === bandId);
members.forEach(u => {
const li = document.createElement('li');
li.className = 'memberItem';
li.innerHTML = `<div class="row spaceBetween"><div><strong>${u.name || '(no
11
name)'}</strong> — <span class="muted">${u.instrument || ''}</span></div></
div>`;
const setBtn = document.createElement('button');
setBtn.className = 'btn tiny';
setBtn.textContent = 'Set Drum Major';
setBtn.addEventListener('click', async () => {
if (!u.uid) return alert('User object missing uid');
await update(ref(db, `bands/${bandId}`), { drumMajor: u.uid });
alert(`${u.name} set as drum major`);
selectBand(bandId); // refresh
});
li.appendChild(setBtn);
membersList.appendChild(li);
});
}
// Poll for updates every 10s for convenience
setInterval(() => {
if (myUid) loadBands();
}, 10000);
