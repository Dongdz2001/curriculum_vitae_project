// src/firebase.js
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBAhMRuASlC4z_uqBXTkEH3-TTRghyUGPQ",
  authDomain: "cv-project-personal.firebaseapp.com",
  projectId: "cv-project-personal",
  storageBucket: "cv-project-personal.appspot.com",
  messagingSenderId: "874953440211",
  appId: "1:874953440211:web:dac65263c80ae09f8b8d26"
};

// Khởi tạo Firebase app
const app = initializeApp(firebaseConfig)

// Khởi tạo Firestore
const db = getFirestore(app)
const storage = getStorage(app);

export { db, storage }