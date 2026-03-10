import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBOj5yJQ2kcU4_xrUY1sDPB3XU3lWupX-A",
  authDomain: "miiglesia-plus.firebaseapp.com",
  projectId: "miiglesia-plus",
  storageBucket: "miiglesia-plus-storage.appspot.com",
  messagingSenderId: "407699856167",
  appId: "1:407699856167:web:5d421d407ab7c9789aa702",
  measurementId: "G-VEPJFQGCQB"
};

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
