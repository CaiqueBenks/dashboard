import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCHfrpdaCmkmKvbEn-Hs-ndGUd7nAa0qOE",
  authDomain: "dashboard-9108c.firebaseapp.com",
  projectId: "dashboard-9108c",
  storageBucket: "dashboard-9108c.firebasestorage.app",
  messagingSenderId: "294553848593",
  appId: "1:294553848593:web:c444d63dcaf0d6c2759ab0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
