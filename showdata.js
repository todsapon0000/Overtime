import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, getDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js";
import { editDataToFirestore } from './editdata.js';
import { calculateSinotransOT } from './calculateOT.js';

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
    const db = getFirestore(app);
    const usersCol = collection(db, "test");

    let defaultDateStart = new Date(2025,11,21)
    let defaultDateEnd = new Date(2026,0,20)
    let rowData;
    let sumot15;
    let sumot30;

    let calculateOT = null;

    const now = new Date();
    const currentMonth = now.getMonth(); // เดือนปัจจุบัน (0-11)
    const currentYear = now.getFullYear(); // ปีปัจจุบัน

    // ตรวจสอบว่า defaultDateEnd เป็นเดือนปัจจุบันหรือไม่
    if (
        !defaultDateEnd || 
        defaultDateEnd.getMonth() !== currentMonth || 
        defaultDateEnd.getFullYear() !== currentYear
    ) {
        // 1. ตั้งค่า defaultDateStart เป็นวันที่ 21 ของเดือนที่แล้ว
        // การใช้ new Date(ปี, เดือน - 1, 21) จะคำนวณย้อนเดือนให้อัตโนมัติ (แม้จะเป็นเดือนมกราคมก็จะย้อนไปธันวาคมปีก่อนหน้าให้)
        defaultDateStart = new Date(currentYear, currentMonth - 1, 21);

        // 2. ตั้งค่า defaultDateEnd เป็นวันที่ 20 ของเดือนปัจจุบัน
        defaultDateEnd = new Date(currentYear, currentMonth, 20);
    }

// 0.1 Date Formatting for Display and Map Key
function formatDateString(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const month = date.toLocaleString('en-US', { month: 'short' }); 
    const dayName = days[date.getDay()];
    const dateNum = date.getDate();
    return `${dayName} ${dateNum} ${month}`;
}

// 0.2 Time to Minutes
function timeStringToMinutes(timeStr) {
    debugger;
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.split(':');
    if (parts.length !== 2) return 0;
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    return (hours * 60) + minutes;
}


async function getMergedTimesheetData(firebaseMap) {
    const timesheetData = [];

    const today = new Date();
    const currentYear = today.getFullYear();

    let totalOT15 = 0;
    let totalOT30 = 0;
    let totalNetOT = 0;
    let totalFood = 0;

    
    debugger;


    let currentDate = new Date(defaultDateStart)
    let endDate = new Date(defaultDateEnd)

    while (currentDate <= endDate) {

        
        const dateStr = formatDateString(currentDate); // Key: Sun 21 Dec, Wed 31 Dec, etc.
        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6; 
 
        // 🎯 Lookup: ค้นหาข้อมูลจาก MapKey
        const docData = firebaseMap.get(dateStr); 
        

        debugger;
        
        if (docData) {
            
            const otMinutes = timeStringToMinutes(docData.ot);
            const checkoutMinutes = timeStringToMinutes(docData.checkout);
            const midnightMinutes = timeStringToMinutes('00:00');
            
            let ot15_Duration, ot30_Duration;

            debugger;



            calculateOT = await calculateSinotransOT(dateStr, docData.checkin, docData.ot, false, docData.brake)

            totalOT15 += parseFloat(calculateOT.ot15 || 0);
            totalOT30 += parseFloat(calculateOT.ot30 || 0);
            totalNetOT += parseFloat(calculateOT.netOT || 0);
            totalFood += parseFloat(calculateOT.food || 0);
    

            // *** B. คำนวณค่าแรง ***
            const hourlyRate = (12000 / 30) / 8;
            sumot15 = hourlyRate * 1.5 * calculateOT.ot15;
            sumot30 = hourlyRate * 3 * calculateOT.ot30;
            const total = sumot15 + sumot30;

            let totalOT = parseFloat(calculateOT.ot15) + parseFloat(calculateOT.ot30)

            const ot15Value = parseFloat(calculateOT.ot15) || 0;
            const ot30Value = parseFloat(calculateOT.ot30) || 0;

            rowData = {
                id: docData.id,
                brake: docData.brake || '', 
                holiday: docData.holiday || '', 
                date: dateStr, 
                checkin: docData.checkin, 
                checkout: docData.checkout, 
                ot: docData.ot, 
                ot15: parseFloat(calculateOT.ot15) === 0 ? '' : calculateOT.ot15, 
                sumot15: sumot15 === 0 ? '' : sumot15, 
                ot3: (ot15Value === 0) ? '' : (ot30Value === 0 ? 0 : ot30Value),
                sumot3: (ot15Value === 0) ? '' : (sumot30 === 0 ? 0 : sumot30),
                totalOT: totalOT === 0 ? '' : totalOT,
                total: total === 0 ? '' : total
            };

        } else {
            rowData = {
                brake: '', 
                holiday: '', 
                date: dateStr, 
                checkin: '', 
                checkout: '', 
                ot: '', 
                ot15: '', 
                sumot15: '', 
                ot3: '', 
                sumot3: '', 
                totalOT: '',
                total: '',
            };
        }
        
        timesheetData.push(rowData);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    updateSummaryTable(totalOT15, totalOT30, totalNetOT, totalFood);


    let Header = defaultDateStart + defaultDateEnd

    updateHeaderDisplay(Header);

    return timesheetData;
}


// ===============================================
// 2. Main Execution (onSnapshot)
// ===============================================



let dataTable = null;
let dataTablesum = null;

function createMonthFilterDropdown(monthsArray) {
    // 1. สร้าง Array ตัวย่อเพื่อเอาไว้เทียบกับลำดับเดือน (0-11)
    const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // 2. ดึงชื่อย่อของเดือนปัจจุบันออกมา
    const currentMonthShort = monthShortNames[new Date().getMonth()]; // เช่น ถ้าเดือนนี้กุมภาพันธ์ จะได้ 'Feb'

    // 3. สร้าง HTML Option Tags
    const monthOptionsHtml = monthsArray.map(month => {
        // เทียบว่าค่า value ใน array ตรงกับชื่อย่อเดือนปัจจุบันหรือไม่
        const isDefault = (month.value === currentMonthShort) ? 'selected' : '';
        
        return `<option value="${month.value}" ${isDefault}>${month.text}</option>`;
    }).join('');

    // 4. สร้าง Container และ Select Tag
    let filterContainer = document.createElement('div');
    filterContainer.className = 'month-filter-container';

    filterContainer.innerHTML = `
        <select id="month-select" class="form-select" style="display: inline-block; width: auto;">
            <option value="">เลือกเดือน</option>
            ${monthOptionsHtml}
        </select>
    `;
    
    return filterContainer;
}

const months = [
    { value: 'Jan', text: 'มกราคม' },
    { value: 'Feb', text: 'กุมภาพันธ์' },
    { value: 'Mar', text: 'มีนาคม' },
    { value: 'Apr', text: 'เมษายน' },
    { value: 'May', text: 'พฤษภาคม' },
    { value: 'Jun', text: 'มิถุนายน' },
    { value: 'Jul', text: 'กรกฎาคม' },
    { value: 'Aug', text: 'สิงหาคม' },
    { value: 'Sep', text: 'กันยายน' },
    { value: 'Oct', text: 'ตุลาคม' },
    { value: 'Nov', text: 'พฤศจิกายน' },
    { value: 'Dec', text: 'ธันวาคม' }
];

let filterDropdownElement = createMonthFilterDropdown(months);


let btnadd = document.createElement('div');
//let btnedit = document.createElement('div');

btnadd.innerHTML = '<button class="btn btn-success" id="btnadd">ADD</button> <a id="status-message"></a>';


let tablereport = document.createElement('div');



function updateSummaryTable(ot15, ot30, net, food) {

    const hourlyRate = (12000 / 30) / 8;

    tablereport.innerHTML = `
        <table class="table table-bordered table-striped table-hover display" border="1" style="width:100%; border-collapse: collapse; text-align: center; margin: 20px auto;margin-top: -10px;margin-bottom: 12px;" id="tablereport">
            <thead class="table-success">
                <tr>
                    <th>OT 1.5 (ชม.)</th>
                    <th>เป็นเงิน (OT 1.5)</th>
                    <th>OT 3.0 (ชม.)</th>
                    <th>เป็นเงิน (OT 3.0)</th>
                    <th>จำนวน ชม. ทั้งหมด</th>
                    <th>เป็นเงิน</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${ot15}</td>
                    <td>${(hourlyRate * 1.5 * ot15)}</td>
                    <td>${ot30}</td>
                    <td>${(hourlyRate * 3 * ot30)}</td>
                    <td>${(ot15 + ot30)}</td>
                    <td>${((hourlyRate * 1.5 * ot15) + (hourlyRate * 3 * ot30))}</td>
                </tr>
            </tbody>
        </table>
    `;
}

let firebaseDataMap = new Map();
debugger;

onSnapshot(usersCol, (querySnapshot) => {
    
    // 1. สร้าง Map จาก Firebase (ใช้ใน Global Scope)
    querySnapshot.forEach((doc) => {
        const docData = doc.data();
        docData.id = doc.id; // <<< เพิ่มบรรทัดนี้
        firebaseDataMap.set(docData.date, docData); 
    });
    debugger;
    // 2. เรียก Render ด้วยช่วงเริ่มต้น
    loadAndRenderData();
});



async function loadAndRenderData() {

    debugger;
    const finalData = await getMergedTimesheetData(firebaseDataMap);
    
    if (dataTable !== null) {

        dataTable.clear().rows.add(finalData).draw();
    } else {

        dataTable = $('#data-table').DataTable({
            data: finalData,
                columns: [
                    { data: 'holiday', title: 'Holiday' },
                    { data: 'date', title: 'Date' }, 
                    { data: 'checkin', title: 'In' },
                    { data: 'checkout', title: 'checkout' }, 
                    { data: 'ot', title: 'Out' },
                    { data: 'ot15', title: '1.5x', className: 'dt-body-right' },
                    { data: 'sumot15', title: '฿1.5', className: 'dt-body-right' },
                    { data: 'ot3', title: '3.0x', className: 'dt-body-right' },
                    { data: 'sumot3', title: '฿3.0', className: 'dt-body-right' },
                    { data: 'totalOT', title: 'Hr', className: 'dt-body-right' },
                    { data: 'total', title: 'Amt', className: 'dt-body-right' },
                    { 
                        data: null, 
                        title: 'Action', 
                        orderable: false, // ห้ามจัดเรียง
                        render: function(data, type, row) {
                            
                            return buildButton(row);
                        
                        }
                    }
                ],
                
            
            searching: true, 
            info: true, 
            ordering: false, 
            responsive: false,
            pageLength: 31,
            paging: true,
            autoWidth: false,
            scrollX: false,
            //pagingType: 'month_name',
            
            layout: {
                top3:function() { 
                    let wrapper = document.createElement('div');
                    
                    // ใช้ Flexbox ของ Bootstrap เพื่อดึง ADD ไปซ้าย และ Dropdown ไปขวา
                    wrapper.className = "d-flex justify-content-between align-items-center w-100 mb-3";

                    wrapper.style.marginTop = "-20px";
                    
                    // ใส่ปุ่ม ADD (จะอยู่ฝั่งซ้ายอัตโนมัติ)
                    wrapper.appendChild(btnadd);
                    
                    // ใส่ Dropdown เลือกเดือน (จะถูกผลักไปฝั่งขวาอัตโนมัติ)
                    wrapper.appendChild(filterDropdownElement); 
                    
                    return wrapper; // ส่งค่ากลับ 1 element ที่รวมทุกอย่างไว้แล้ว
                },
                topStart: tablereport,
                topEnd: '',
                bottomStart: '',
                bottomEnd: '',
            },
        });


        
        // ผูก Listener เมื่อสร้างตารางเสร็จ
        return dataTable;
    }
}



$(document).ready(function() {
    $('#data-table').on('init.dt', function() {
        $('#btnadd').on('click', function() {
            openGenericAddModal()
        });
    });

    $(document).ready(function() {
        // ... (Listener btnadd และ .edit-btn) ...

        // 🎯 1. Listener สำหรับปุ่ม SUBMIT ใน Modal (ผูกเพียงครั้งเดียว)
        $('#submitedit').on('click', async (e) => { // สมมติว่า ID ของปุ่ม Submit คือ #submitedit
            e.preventDefault(); 
            
            // 2. ดึง Doc ID จาก Hidden Field
            const finalDocId = $('#editid').val();
            
            // 3. ดึงค่าล่าสุดจาก Input Fields โดยตรง
            const brake = $('#editbrake').prop('checked')
            const holiday = $('#editholiday').val(); 
            const checkin = $('#editcheckin').val(); 
            const checkout = $('#editcheckout').val(); 
            const ot = $('#editot').val();
            const dateRaw = $('#editdate').val(); // YYYY-MM-DD
            debugger;

            editDataToFirestore(finalDocId, brake, holiday, dateRaw, checkin, checkout, ot); // 👈 ส่ง Doc ID เข้าไป

            // 6. ซ่อน Modal
            const Modaledit = document.getElementById('Modaledit'); // หรือ myCustomModal
            const modalInstance = bootstrap.Modal.getInstance(Modaledit);
            if (modalInstance) {
                modalInstance.hide();
            }
        });
    });

    $('#data-table').on('click', '.edit-btn', function(e) {
        e.preventDefault(); 

        // 1. ดึง Document ID จาก data-doc-id
        const docIdToEdit = $(this).data('doc-id');
        debugger;
        
        if (!docIdToEdit) {
             console.error('ไม่พบ Document ID!');
             alert('ไม่สามารถแก้ไขได้: Document ID หายไป');
             return;
        }

        // 2. เรียกฟังก์ชันเพื่อดึงข้อมูลจาก Map และเปิด Modal
        openEditModal(docIdToEdit); 
    });

// ใน showdata.js (Listener)

$(document).on('change', '#month-select', function() {

    debugger;
    const selectedMonthAbbr = $(this).val();
    
    // ล้างตัวกรอง Custom Search ของ DataTable ออกทั้งหมด
    $.fn.dataTable.ext.search = []; 

    if (selectedMonthAbbr) {
        const check = checkmonth(selectedMonthAbbr);
        if (check && check.start && check.end) {
            // อัปเดตช่วงวันที่สำหรับ Query ข้อมูล
            defaultDateStart = check.start;
            defaultDateEnd = check.end;

            // เรียกฟังก์ชันโหลดข้อมูลและวาดตารางใหม่
            loadAndRenderData(); 
        } else {
            alert('ไม่พบช่วงรอบบัญชีสำหรับเดือนนี้');
        }
    }
});

// ดักจับการคลิกปุ่ม Delete ในตาราง
$(document).on('click', '.del-btn', async function(e) {
    

    debugger;
    // ดึง docId จากแอตทริบิวต์ data-id
    const docId = $(this).data('doc-id');
    const data = firebaseDataMap.get(docId)

    // ตรวจสอบเบื้องต้นว่า docId ไม่ว่าง เพื่อป้องกัน Error indexOf
    if (!docId) {
        console.error("Error: Document ID is undefined.");
        return;
    }

    if (confirm("ยืนยันการลบข้อมูลแถวนี้?")) {
        try {
            // ใช้ฟังก์ชันจาก Firebase SDK ที่ Initialize ไว้แล้วในไฟล์หลัก
            // สมมติว่าคุณใช้ Firebase แบบ Modular ผ่าน window หรือประกาศไว้ส่วนกลาง

            const docRef = doc(db, "test", data.id);
            
            await deleteDoc(docRef);
            firebaseDataMap.delete(docId); // ลบออกจาก Map ในเครื่อง
            loadAndRenderData(); // สั่งวาดตารางใหม่ทันทีโดยไม่ต้อง Refresh หน้า
            


            console.log("ลบข้อมูล ID:", docId, "สำเร็จ");

            //location.reload();

        } catch (error) {
            console.error("Error deleting document:", error);
            alert("ไม่สามารถลบข้อมูลได้: " + error.message);
        }
    }
});

});

function checkmonth(selectedMonth) {

    debugger;

    let date = new Date(2025,11,21)

    let start = ''
    let end = ''

    let day = date.getDate()

    let month = date.getMonth()

    let year = date.getFullYear()

    let Rangedate = []
    
    if(selectedMonth == 'Jan') {

        start = new Date(year,month,day)
        end = new Date(year,month+1,day-1)

        Rangedate = {
            start: start,
            end: end
        }
    } else if(selectedMonth == 'Feb') {

        start = new Date(year,month+1,day)
        end = new Date(year,month+2,day-1)

        Rangedate = {
            start: start,
            end: end
        }
    } else if(selectedMonth == 'Mar') {

        start = new Date(year,month+2,day)
        end = new Date(year,month+3,day-1)

        Rangedate = {
            start: start,
            end: end
        }
    } else if(selectedMonth == 'Apr') {

        start = new Date(year,month+3,day)
        end = new Date(year,month+4,day-1)

        Rangedate = {
            start: start,
            end: end
        }
    } else if(selectedMonth == 'May') {

        start = new Date(year,month+4,day)
        end = new Date(year,month+5,day-1)

        Rangedate = {
            start: start,
            end: end
        }
    } else if(selectedMonth == 'Jun') {

        start = new Date(year,month+5,day)
        end = new Date(year,month+6,day-1)

        Rangedate = {
            start: start,
            end: end
        }
    } else if(selectedMonth == 'Jul') {

        start = new Date(year,month+6,day)
        end = new Date(year,month+7,day-1)

        Rangedate = {
            start: start,
            end: end
        }
    } else if(selectedMonth == 'Aug') {

        start = new Date(year,month+7,day)
        end = new Date(year,month+8,day-1)

        Rangedate = {
            start: start,
            end: end
        }
    } else if(selectedMonth == 'Sep') {

        start = new Date(year,month+8,day)
        end = new Date(year,month+9,day-1)

        Rangedate = {
            start: start,
            end: end
        }
    } else if(selectedMonth == 'Oct') {

        start = new Date(year,month+9,day)
        end = new Date(year,month+10,day-1)

        Rangedate = {
            start: start,
            end: end
        }
    } else if(selectedMonth == 'Nov') {

        start = new Date(year,month+10,day)
        end = new Date(year,month+11,day-1)

        Rangedate = {
            start: start,
            end: end
        }
    } else if(selectedMonth == 'Dec') {

        start = new Date(year,month+11,day)
        end = new Date(year,month+12,day-1)

        Rangedate = {
            start: start,
            end: end
        }
    }

    return Rangedate
    
}

/**
 * สร้าง HTML สำหรับปุ่ม Edit
 * @param {object} rowData - ข้อมูลของแถวทั้งหมด (รวมถึง Document ID)
 * @returns {string} HTML ของปุ่ม
 */
function buildButton(rowData) {
    const docId = rowData.date; 
    const btnStyle = "display: flex; align-items: center; justify-content: center; gap: 4px;";
    
    return `
        <div class="btn-group" style="display: flex; justify-content: center;">
            <button class="btn btn-xs btn-primary edit-btn" data-doc-id="${docId}" style="${btnStyle}">
                <i class="fa fa-edit">a</i>
            </button>

        </div>
    `;
}


async function openEditModal(docId, rowData) {


    const DocId = docId.trim(); 
    const data = firebaseDataMap.get(DocId);
    //console.log(data.date.exists())

    try {
        debugger;
        if (data) {

            // 1. เก็บ ID สำหรับใช้ในการบันทึก
            $('#editid').val(data.id); // แนะนำให้ใช้ Field สำหรับเก็บ ID จริง ๆ
            
            // 2. Populate ข้อมูล (ใช้ตามชื่อ Field ใน Firestore)
            $('#editcheckin').val(data.checkin || '');    
            $('#editcheckout').val(data.checkout || '');  
            $('#editbrake').val(data.brake || '');        
            $('#editholiday').val(data.holiday || '');    
            $('#editot').val(data.ot || '');
            $('#editdate').val(docId).prop('readonly', true).prop('disabled', true);
            
            // 3. แสดง Modal
            const Modaledit = new bootstrap.Modal(document.getElementById('Modaledit'));
            Modaledit.show();
            
        } else {
            debugger;

            //$('#adddate').prop('readonly', true);
            $('#adddate').val(docId).prop('readonly', true).prop('disabled', true);

            const modeladd = new bootstrap.Modal(document.getElementById('myCustomModal'));
            modeladd.show();
            
        }
    } catch (e) {
        console.error('ERROR during Firestore operation:', e);
        alert('เกิดข้อผิดพลาดในการดึงข้อมูลจากฐานข้อมูล');
    }
}

function openGenericAddModal() {
    
    const dateInputId = '#adddate'; 

    $(dateInputId).val('').prop('readonly', false).prop('disabled', false);
 
    
    const modeladd = new bootstrap.Modal(document.getElementById('myCustomModal'));
    modeladd.show();
}

async function updateHeaderDisplay(selectedMonthText) {
    // ดึง Element จาก index
    const headerTitle = document.getElementById('header-title');
    const headerSubtitle = document.getElementById('header-subtitle');
    const headerSubtitle2 = document.getElementById('header-subtitle2');

    if (headerTitle && headerSubtitle) {
        
        // แสดงช่วงวันที่ (ดึงจากตัวแปร Global ที่คุณมี)
        const start = formatDateString(defaultDateStart);
        const end = formatDateString(defaultDateEnd);
        headerSubtitle.innerText = `${start.slice(-6)} - ${end.slice(-6)} || เงินจะออกสิ้นเดือน ${end.slice(-3)}`;
    }
}