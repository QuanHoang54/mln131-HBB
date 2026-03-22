import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAeuogqQ8LeNc9qVQKtnjEprKqrYa4iTFs",
  authDomain: "mln131-a305b.firebaseapp.com",
  projectId: "mln131-a305b",
  storageBucket: "mln131-a305b.firebasestorage.app",
  messagingSenderId: "72198402136",
  appId: "1:72198402136:web:b7c871084361350c85da2d",
  measurementId: "G-FY12PTNPND",
  databaseURL: "https://mln131-a305b-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getDatabase(app);
