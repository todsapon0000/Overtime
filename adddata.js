import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js";

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

async function addDataToFirestore(brake,holiday,date,checkin,checkout,ot) {
        debugger;
        if (!date) {
            console.error("วันที่ไม่สมบูรณ์ ไม่สามารถบันทึกข้อมูลได้");
            return;
        }
        try {
            console.log(db);
            const docRef = await addDoc(collection(db, "test"), {
                brake: brake,
                holiday: holiday,
                date: date,
                checkin: checkin,
                checkout: checkout,
                ot: ot
            });
            console.log("บันทึกข้อมูลสำเร็จด้วย");
        } catch (e) {
            console.error("เกิดข้อผิดพลาดในการเพิ่มข้อมูล ", e);
        }
    }

        const sub = document.getElementById('submit');

    sub.addEventListener('click', (e) => {
        debugger;
        const modalElement = document.getElementById('myCustomModal');
        const add_brake = document.getElementById('addbrake');
        const add_holiday = document.getElementById('addholiday').value;
        const add_date = document.getElementById('adddate').value;
        const add_checkin = document.getElementById('addcheckin').value;
        const add_checkout = document.getElementById('addcheckout').value;
        const add_ot = document.getElementById('addot').value;

        const brake = add_brake.checked;
        const date = add_date

        // ฟังก์ชันสำหรับเช็คว่า String เป็นรูปแบบ xxxx-xx-xx หรือไม่
        function isValidDateFormat(dateString) {
            // Regex สำหรับตรวจสอบเลข 4 หลัก - เลข 2 หลัก - เลข 2 หลัก
            const regex = /^\d{4}-\d{2}-\d{2}$/;
            
            // ถ้าตรงตามรูปแบบจะคืนค่า true
            return regex.test(dateString);
        }

        debugger;
        if(!add_date){
            alert("ข้อมูลไม่สมบูรณ์")
        } else {

            let finaldate
            if(isValidDateFormat(add_date)){
                finaldate = formatDateString(add_date);
            } else {
                finaldate = add_date
            }

            
            addDataToFirestore(brake, add_holiday, finaldate, add_checkin, add_checkout, add_ot);

            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }

        }

        debugger;
    });

function formatDateString(date) {
    let dateObject;

    if (typeof date === 'string' || typeof date === 'number') {
        dateObject = new Date(date);
    } else if (date instanceof Date) {
        dateObject = date;
    } else {
        console.error("Invalid date input provided.");
        return ""; 
    }
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    if (isNaN(dateObject.getTime())) {
         console.error("Input could not be parsed as a valid date.");
         return "";
    }
    
    const month = dateObject.toLocaleString('en-US', { month: 'short' }); 
    const dayName = days[dateObject.getDay()];
    const dateNum = dateObject.getDate();
    
    return `${dayName} ${dateNum} ${month}`;
}