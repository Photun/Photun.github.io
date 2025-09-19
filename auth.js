// Auth helpers (Email/Password flows). Creates a minimal /users/<uid> entry on signup
import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { ref, set, get } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';
import { db } from './firebase-config.js';


const loginForm = document.getElementById('loginForm');
const signInBtn = document.getElementById('signIn');
const signUpBtn = document.getElementById('signUp');
const authMsg = document.getElementById('authMsg');


if (loginForm) {
signInBtn?.addEventListener('click', async (e) => {
e.preventDefault();
authMsg.textContent = '';
const email = document.getElementById('email').value;
const password = document.getElementById('password').value;
try {
await signInWithEmailAndPassword(auth, email, password);
authMsg.textContent = 'Signed in.';
} catch (err) {
authMsg.textContent = 'Error: ' + err.message;
}
});


signUpBtn?.addEventListener('click', async (e) => {
e.preventDefault();
authMsg.textContent = '';
const email = document.getElementById('email').value;
const password = document.getElementById('password').value;
try {
const userCred = await createUserWithEmailAndPassword(auth, email, password);
// create basic user profile in /users/<uid>
const uid = userCred.user.uid;
const userRef = ref(db, `users/${uid}`);
await set(userRef, {
uid,
name: email.split('@')[0],
bandId: '',
instrument: '',
preferredPart: 1
});
authMsg.textContent = 'Account created. You can create bands now.';
} catch (err) {
authMsg.textContent = 'Error: ' + err.message;
}
});
}


// userControls UI
onAuthStateChanged(auth, (user) => {
const userControls = document.getElementById('userControls');
if (!userControls) return;
userControls.innerHTML = '';
if (user) {
const txt = document.createElement('span');
txt.textContent = user.email ?? '(user)';
const out = document.createElement('button');
out.className = 'btn ghost small';
out.textContent = 'Sign out';
out.addEventListener('click', async () => {
await signOut(auth);
window.location.reload();
});
userControls.appendChild(txt);
userControls.appendChild(out);
}
});


export { auth };
