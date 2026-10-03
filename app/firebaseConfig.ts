// app/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
if (!apiKey) {
  throw new Error('Missing VITE_FIREBASE_API_KEY. Set it in the local or deployment environment.');
}

const firebaseConfig = {
  apiKey,
  authDomain: "labortracker-cab93.firebaseapp.com",
  projectId: "labortracker-cab93",
  storageBucket: "labortracker-cab93.appspot.com",
  messagingSenderId: "971447295093",
  appId: "1:971447295093:web:a4c1e8f7b14e8516506c3c",
  measurementId: "G-QFYE5GZPEG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };