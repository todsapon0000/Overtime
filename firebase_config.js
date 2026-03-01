// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getFirestore, collection, onSnapshot, query, orderBy, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB8hQxE1fHCrBsrvsYY2bR_cU6B9TjxRB4",
    authDomain: "overtime-aff88.firebaseapp.com",
    projectId: "overtime-aff88",
    storageBucket: "overtime-aff88.firebasestorage.app",
    messagingSenderId: "997144871426",
    appId: "1:997144871426:web:6bcbc5583afd8fe9fe9d1b",
    measurementId: "G-GD4XQGHCWT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Export the database instance for use in other files
export { app, db, analytics };