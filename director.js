import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  sendSignInLinkToEmail,
} from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functionsBase = 'https://us-central1-band2-d72ec.cloudfunctions.net';
const emailStorageKey = 'notelinkDirectorEmail';
const actionCodeSettings = {
  url: 'https://photun.github.io/director-portal.html',
  handleCodeInApp: true,
};

const form = document.getElementById('director-login-form');
const emailInput = document.getElementById('director-email');
const submitButton = document.getElementById('send-code-button');
const status = document.getElementById('director-auth-status');

function setStatus(message, kind = 'neutral') {
  status.textContent = message;
  status.dataset.kind = kind;
}

function messageFromError(error) {
  return error?.message || String(error) || 'Something went wrong.';
}

async function checkLeaderEmail(email) {
  const response = await fetch(`${functionsBase}/checkLeaderEmail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.ok !== true) {
    throw new Error(result.error || 'No NoteLink band is registered to that email yet.');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = emailInput.value.trim();
  if (!email) return;

  submitButton.disabled = true;
  setStatus('Checking director access...');
  try {
    await checkLeaderEmail(email);
    localStorage.setItem(emailStorageKey, email);
    setStatus('Sending sign-in link...');
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    setStatus('Sign-in link sent. Check your inbox and spam folder, then open the link from this browser.', 'success');
  } catch (error) {
    setStatus(messageFromError(error), 'error');
  } finally {
    submitButton.disabled = false;
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = 'director-portal.html';
  }
});
