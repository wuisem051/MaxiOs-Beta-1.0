import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "pool-btc.firebaseapp.com",
  projectId: "pool-btc",
  storageBucket: "pool-btc.firebasestorage.app",
  messagingSenderId: "1018976881268",
  appId: "1:1018976881268:web:2ae49a483b126442c7df21",
  measurementId: "G-QN5F28JF81"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
