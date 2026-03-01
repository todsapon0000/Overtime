export function calculateSinotransOT(dateStr, startTime, endTime, isHoliday = false, brake = true) {
    debugger;
    // 1. แกะชื่อวัน (เช่น "Sun 21 Dec" -> "Sun") เพื่อเช็คประเภทวัน
    const dayName = dateStr.split(' ')[0]; 
    const isSunday = (dayName === 'Sun');
    const isSaturday = (dayName === 'Sat');
    const isWorkingDay = !isSunday && !isHoliday && !isSaturday;

    // 2. ฟังก์ชันแปลง HH:mm เป็นตัวเลข
    const toNum = (t) => {
        if (!t || !t.includes(':')) return 0;
        const [h, m] = t.split(':').map(Number);
        return h + (m / 60);
    };

    let start = toNum(startTime);
    let end = toNum(endTime);

    // --- Logic จัดการการข้ามเที่ยงคืน ---
    // ถ้าเวลาเลิกน้อยกว่าเวลาเริ่ม แสดงว่าข้ามไปอีกวัน (บวก 24 ชม.)
    if (end < start) {
        end += 24;
    }

    let ot15 = 0;
    let ot30 = 0;

    // 3. คำนวณตามช่วงเวลา (Slot Based Calculation)
    // วนลูปเช็คทีละ 0.5 ชม. (หรือใช้ Math logic) เพื่อความแม่นยำ
    for (let t = start; t < end; t += 0.5) {
        let currentSlot = t;
        let nextSlot = t + 0.5;

        // ตรวจสอบว่า Slot นี้เป็นเวลาทำงานปกติหรือไม่ (08:30 - 17:30)
        let isNormalWorkTime  = (currentSlot >= 8.5 && nextSlot <= 17.5 && !isSunday && !isHoliday);
        

        if (isWorkingDay) {
            // วันปกติ: ถ้าไม่ใช่เวลาทำงานปกติ ให้คิดเป็น OT 1.5
            if (!isNormalWorkTime) {
                if (brake === false) {
                    if (!(currentSlot >= 12 && nextSlot <= 13)) {
                        ot15 += 0.5;
                    }
                } else {
                    ot15 += 0.5;
                }
                // ยกเว้นช่วงพักเที่ยง 12:00-13:00 และพักเย็น 17:30-18:00

            }
        } 
        else if (isSaturday) {
            // 1. กำหนดช่วงเวลาทำงานปกติ (08:30 - 12:00 = 3.5 ชม. แรก)
            const isNormalMorningWork = (currentSlot >= 8.5 && nextSlot <= 12.0);
            
            // 2. ช่วงพักเที่ยง (12:00 - 13:00)
            const isLunchBreak = (currentSlot >= 12.0 && nextSlot <= 13.0);

            // 3. เช็คว่าเป็นเวลาหลังเที่ยงคืน (ข้ามเข้าสู่วันอาทิตย์) หรือยัง
            // เนื่องจากลูปมีการ end += 24 หากข้ามคืน ดังนั้นค่า t ที่เกิน 24 คือวันใหม่
            const isNextDaySunday = (currentSlot >= 24);

            if (isNormalMorningWork) {
                // 3.5 ชม. แรกเป็นเวลาทำงานปกติ ไม่นับ OT
                ot15 += 0.0; 
            } 
            else if (isLunchBreak) {
                // เช็คเงื่อนไขพัก (brake)
                if (brake === false) {
                    if (!(currentSlot >= 12 && nextSlot <= 13)) {
                        ot15 += 0.5;
                    }
                } else {
                    ot15 += 0.5;
                }
            }
            else {
                // ช่วงหลังจาก 13:00 เป็นต้นไป
                if (isNextDaySunday) {
                    // หลังเที่ยงคืนที่ข้ามไปวันอาทิตย์แล้ว ให้คิดเป็น OT 3.0
                    ot30 += 0.5;
                } else {
                    ot15 += 0.5;
                }
            }
        } else if (isSunday || isHoliday) {
            
            isNormalWorkTime = false
            if (!isNormalWorkTime) {
                // ช่วงเวลาปกติ 08:30-17:30: 3.5 ชม. แรกเป็น 1.5 เท่า ที่เหลือเป็น 3.0 เท่า
                if (ot15 < 3.5) {
                    ot15 += 0.5;
                } else {
                    ot30 += 0.5;
                }
            } else {
                if (brake === false) {
                    if (!(currentSlot >= 12 && nextSlot <= 13) && !(currentSlot >= 17.5 && nextSlot <= 18)) {
                        ot30 += 0.5;
                    }
                } else {
                    ot30 += 0.5;
                }

            }
        }
    }
    debugger;
    // 4. หักเวลาพัก 30 นาที หากทำ OT รวม >= 2 ชม.
    let rawOT = ot15 + ot30;

    // 5. หักเวลาพัก 30 นาที (0.5 ชม.) หากทำ OT รวมตั้งแต่ 2 ชม. ขึ้นไป
    let netOT = rawOT;

    if (ot15 || ot30) {
        if (brake === false) {
            if(ot15 >= 2.0) {
                ot15 = ot15 - 0.5
            }
        }
    }


    // 5. คำนวณค่าอาหาร
    let food = (netOT > 4.5) ? 100 : (netOT > 1.0 ? 50 : 0);

    return {
        ot15: ot15.toFixed(2),
        ot30: ot30.toFixed(2),
        netOT: netOT.toFixed(2),
        food: food
    };
}

