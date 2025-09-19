// firebase-config.js
// For a static site using the Firebase CDN (no bundler required).
// Replace the firebaseConfig values with the ones from your Firebase console.

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
// If you want analytics, uncomment the import below and call getAnalytics(app)
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyCyznwtqwPZh3-1jbo6dLqsPEXtcWKtgQo",
  authDomain: "band2-d72ec.firebaseapp.com",
  databaseURL: "https://band2-d72ec-default-rtdb.firebaseio.com",
  projectId: "band2-d72ec",
  storageBucket: "band2-d72ec.firebasestorage.app",
  messagingSenderId: "460954161149",
  appId: "1:460954161149:web:2f3f2ae16ec6fc07fbd394",
  measurementId: "G-DRLCDT6KRK"
};

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // optional

export const auth = getAuth(app);
export const db = getDatabase(app);
