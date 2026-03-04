import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB0j5yJQ2kU4_xrU1sDPB3XU3lWupX-A",
  authDomain: "miiglesia-plus.firebaseapp.com",            // ← corregido
  projectId:  "miiglesia-plus",                             // ← corregido
  storageBucket: "miiglesia-plus-storage.appspot.com",      // ← tu bucket NUEVO
  messagingSenderId: "407690856167",
  appId: "1:407690856167:web:5b421440b7ab7c9789aa702",
  measurementId: "G-VEPJFQGQB"
};

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
