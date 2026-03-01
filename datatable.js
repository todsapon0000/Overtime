import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8hQxE1fHCrBsrvsYY2bR_cU6B9TjxRB4",
  authDomain: "overtime-aff88.firebaseapp.com",
  projectId: "overtime-aff88",
  storageBucket: "overtime-aff88.firebasestorage.app",
  messagingSenderId: "997144871426",
  appId: "1:997144871426:web:6bcbc5583afd8fe9fe9d1b",
  measurementId: "G-GD4XQGHCWT"
};

let dataTable = null

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const usersCol = collection(db, "test");

//const q = query(usersCol, orderBy("date", "desc"));

    debugger;
onSnapshot(usersCol, (querySnapshot) => {
    const resultData = [];
    querySnapshot.forEach((doc) => {
        debugger;
        const docData = doc.data();

        resultData.push({
            brake: docData.brake,
            holiday: docData.holiday,
            date: docData.date,
            checkin: docData.checkin,
            checkout: docData.checkout,
            ot: docData.ot,
            ot15: docData.ot15,
            sumot15: docData.sumot15,
            ot3: docData.ot3,
            sumot3: docData.sumot3,
            total: docData.total
    });
})

    debugger;
    dataTable = $('#data-table').DataTable({
            data: resultData,
            columns: [
                { data: 'brake', title: 'brake'},
                { data: 'holiday', title: 'holiday'},
                { data: 'date', title: 'date'},
                { data: 'checkin', title: 'checkin'},
                { data: 'checkout', title: 'checkout'},
                { data: 'ot', title: 'ot'},
                { data: 'ot15', title: 'ot15'},
                { data: 'sumot15', title: 'sumot15'},
                { data: 'ot3', title: 'ot3'},
                { data: 'sumot3', title: 'sumot3'},
                { data: 'total', title: 'total'}
                
            ],
                responsive: true,
                autoWidth: false, 
                lengthChange : false,
                ordering: false,
        })

});



