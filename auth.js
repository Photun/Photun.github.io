// Auth helpers (Email/Password flows). Relies on firebase-config.js exports.
import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';


// UI bindings - keep minimal
const loginForm = document.getElementById('loginForm');
const signInBtn = document.getElementById('signIn');
const signUpBtn = document.getElementById('signUp');
const authMsg = document.getElementById('authMsg');


if (loginForm) {
signInBtn?.addEventListener('click', async (e) => {
e.preventDefault();
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
const email = document.getElementById('email').value;
const password = document.getElementById('password').value;
try {
const userCred = await createUserWithEmailAndPassword(auth, email, password);
authMsg.textContent = 'Account created. Please ask the project owner to mark you as admin in RTDB (see docs).';
} catch (err) {
authMsg.textContent = 'Error: ' + err.message;
}
});
}


// Expose signOut via topbar control
onAuthStateChanged(auth, (user) => {
const userControls = document.getElementById('userControls');
if (!userControls) return;
userControls.innerHTML = '';
if (user) {
const txt = document.createElement('span');
txt.textContent = user.email ?? '(admin)';
const out = document.createElement('button');
out.className = 'btn ghost small';
out.textContent = 'Sign out';
out.addEventListener('click', () => signOut(auth));
userControls.appendChild(txt);
userControls.appendChild(out);
}
});


export { auth };
