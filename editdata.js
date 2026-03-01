import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import { getFirestore, collection, updateDoc, doc, setDoc, where, query, getDocs } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js";

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

export async function editDataToFirestore(finalDocId, brake, holiday, date, checkin, checkout, ot) {
    debugger;
    
    

    const docRef = doc(db, "test", finalDocId); 
    
    const newDocData = {
        brake: brake,
        holiday: holiday,
        date: date, 
        checkin: checkin,
        checkout: checkout,
        ot: ot
    };

    try {
        await setDoc(docRef, newDocData, { merge: true }); 
        
        console.log("บันทึกข้อมูลสำเร็จ:", finalDocId);
        alert("บันทึกข้อมูลเรียบร้อย!");

    } catch (e) {
        console.error("Firebase SET/UPDATE Error:", e);
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + e.message);
    }
}

        const subedit = document.getElementById('submitedit');

    subedit.addEventListener('click', async (e) => {
        debugger;
        
        const q = query(collection(db, "test"), where("date", "==", edit_date));
        const querySnapshot = await getDocs(q);
        

        const modal = document.getElementById('Modaledit');
        const edit_id = document.getElementById('editid');
        const edit_brake = document.getElementById('editbrake');
        const edit_holiday = document.getElementById('editholiday').value;
        const edit_date = document.getElementById('editdate').value;
        const edit_checkin = document.getElementById('editcheckin').value;
        const edit_checkout = document.getElementById('editcheckout').value;
        const edit_ot = document.getElementById('editot').value;

        const brake = edit_brake.checked;
        const date = formatDateString(edit_date.toString())

        

        debugger;
        
        editDataToFirestore(edit_id, brake, edit_holiday, date, edit_checkin, edit_checkout, edit_ot);

        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) {
            modalInstance.hide(); // ✅ SUCCESS: Dismiss the modal
        }

        debugger;
    });

function formatDateString(date) {
    // 🛑 SOLUTION: Convert the input string/value to a Date object
    let dateObject;

    if (typeof date === 'string' || typeof date === 'number') {
        // If the input is a String or Timestamp, create a new Date object
        dateObject = new Date(date);
    } else if (date instanceof Date) {
        // If the input is already a Date object, use it directly
        dateObject = date;
    } else {
        // Handle invalid input (optional, but good practice)
        console.error("Invalid date input provided.");
        return ""; 
    }
    
    // Now use the valid dateObject for formatting
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Check if the Date object is valid (e.g., New Date("Invalid Date String") returns Invalid Date)
    if (isNaN(dateObject.getTime())) {
         console.error("Input could not be parsed as a valid date.");
         return "";
    }
    
    // Use the dateObject for all Date methods:
    const month = dateObject.toLocaleString('en-US', { month: 'short' }); 
    const dayName = days[dateObject.getDay()];
    const dateNum = dateObject.getDate();
    
    return `${dayName} ${dateNum} ${month}`;
}