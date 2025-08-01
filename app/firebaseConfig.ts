// app/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDE-d66lOrk3hqa0X4t7-4GlQfvbUq6ovs",
  authDomain: "labortracker-cab93.firebaseapp.com",
  projectId: "labortracker-cab93",
  storageBucket: "labortracker-cab93.appspot.com",
  messagingSenderId: "971447295093",
  appId: "1:971447295093:web:a4c1e8f7b14e8516506c3c",
  measurementId: "G-QFYE5GZPEG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);         // Memory persistence for Expo Go
const db = getFirestore(app);

export { app, auth, db };