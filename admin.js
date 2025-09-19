// Dashboard logic: creates bands, lists bands, edits metadata, maps names->uid for drum major.
import { auth, db } from './firebase-config.js';
import { ref, push, set, onValue, update, get, child, query, orderByChild } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { makeJoinCode } from './utils.js';


// UI nodes
const dashboard = document.getElementById('dashboard');
const authBox = document.getElementById('authBox');
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
const adminOnlyMsg = document.getElementById('adminOnlyMsg');


let myUid = null;
let myBands = {};
let selectedBandId = null;


function hideAll() {
dashboard?.classList.add('hidden');
authBox?.classList.remove('hidden');
bandEditor?.classList.add('hidden');
adminOnlyMsg?.classList.add('hidden');
}


onAuthStateChanged(auth, async (user) => {
if (!user) { hideAll(); return; }
myUid = user.uid;
// Check admin flag at /admins/<uid>
const adminRef = ref(db, `admins/${myUid}`);
const snapshot = await get(adminRef);
if (!snapshot.exists()) {
hideAll();
adminOnly
