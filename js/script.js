/* ==========================================================
   Barber-Note v1.1.0 — FULL VERSION + NEW NAVIGATION
   ========================================================== */
/* =========== SECTION 1: INITIALIZATION & GLOBAL VARIABLES =========== */
const $ = id => document.getElementById(id);

// 1. ตั้งค่าเลขเวอร์ชันและวันที่อัปเดตล่าสุด
const APP_VERSION = "1.1.0";
const LAST_UPDATED = "07/09/2026";

// 2. ตัวแปรหลักของระบบ
let db = JSON.parse(localStorage.getItem("barber_db")) || [];
let archives = JSON.parse(localStorage.getItem("barber_archives")) || [];
let account = JSON.parse(localStorage.getItem("barber_account")) || { balance: 0, logs: [] };

let conf = JSON.parse(localStorage.getItem("barber_conf")) || { 
    shop: localStorage.getItem("shopName") || "Barber Shop", 
    perc: parseFloat(localStorage.getItem("shopPerc")) || 50, 
    guar: parseFloat(localStorage.getItem("shopGuar")) || 0,
    theme: localStorage.getItem("shopTheme") || "light",
    voice: localStorage.getItem("shopVoice") || "female",
    sound: localStorage.getItem("shopSound") || "on"
};

let payMethod = "";

// 3. แสดงผลเลขเวอร์ชัน วันที่ และชื่อร้านเฉพาะจุดเมื่อ DOM พร้อม
document.addEventListener("DOMContentLoaded", () => {
    if ($("display-version")) $("display-version").innerText = APP_VERSION;
    if ($("display-date")) $("display-date").innerText = LAST_UPDATED;

    // ✅ แก้ไข: แสดงชื่อร้านเฉพาะจุดที่มี ID หรือ Class สำหรับชื่อร้านเท่านั้น (ไม่ทับหน้าแรก)
    const savedShopName = localStorage.getItem("shopName") || conf.shop || "BARBER SHOP";
    if ($("shopTitleDisplay")) $("shopTitleDisplay").innerText = savedShopName;
    document.querySelectorAll('.shop-title-text').forEach(el => el.innerText = savedShopName);
});
/* =========== SECTION 2: MAIN NAVIGATION =========== */
function switchMainView(viewName, subNum = null) {
    // ซ่อนทุกหน้าก่อน
    document.querySelectorAll('.app-page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });

    // 1. หน้าแรก (เช็คเผื่อทั้ง 'home' และ 'pageHome')
    if (viewName === 'home' || viewName === 'pageHome') {
        const homePage = document.getElementById('pageHome');
        if (homePage) {
            homePage.classList.add('active');
            homePage.style.display = 'block';
        }
        if (typeof updateNavDisplay === 'function') updateNavDisplay('home');
        return;
    }

    // 2. กลุ่มหน้าทำงาน/รายงาน/บัญชี (เช็คเผื่อทั้ง 'workGroup' และ 'pageWorkGroup')
    if (viewName === 'workGroup' || viewName === 'pageWorkGroup') {
        const workPage = document.getElementById('pageWorkGroup');
        if (!workPage) return;
        workPage.classList.add('active');
        workPage.style.display = 'block';
        
        // เรียก goSub เปลี่ยนแท็บย่อยตาม subNum ที่ส่งมา (ถ้าไม่ส่งมาให้เปิดแท็บ 1)
        if (typeof goSub === 'function') {
            goSub(subNum || 1);
        }
        if (typeof updateNavDisplay === 'function') updateNavDisplay('workGroup', subNum);
        return;
    }

    // 3. รายงานสรุป
    if (viewName === 'summaryPage' || viewName === 'pageSummary') {
        const summaryPage = document.getElementById('pageSummary');
        if (!summaryPage) return;
        summaryPage.classList.add('active');
        summaryPage.style.display = 'block';
        if (typeof switchMainTab === 'function') switchMainTab('pageSummary', 'summaryTab1');
        if (typeof updateNavDisplay === 'function') updateNavDisplay('summaryPage');
        return;
    }

    // 4. สรุปรายเดือน
    if (viewName === 'monthlySummary' || viewName === 'pageMonthlyReport') {
        const monthlyPage = document.getElementById('pageMonthlyReport');
        if (!monthlyPage) return;
        monthlyPage.classList.add('active');
        monthlyPage.style.display = 'block';
        if (typeof switchMainTab === 'function') switchMainTab('pageMonthlyReport', 'monthlyTab1');
        if (typeof updateNavDisplay === 'function') updateNavDisplay('monthlySummary');
        return;
    }

    // 5. หน้าเปรียบเทียบ
    if (viewName === 'comparePage' || viewName === 'pageComparison') {
        const comparisonPage = document.getElementById('pageComparison');
        if (!comparisonPage) return;
        comparisonPage.classList.add('active');
        comparisonPage.style.display = 'block';
        if (typeof updateNavDisplay === 'function') updateNavDisplay('comparePage');
        return;
    }
}
function go(p) {
    document.querySelectorAll('.page, .app-page').forEach(pg => {
        pg.classList.remove('active');
        pg.style.display = 'none'; 
    });
    
    const targetPage = document.getElementById('p' + p) || document.getElementById('page' + p);
    if (targetPage) {
        targetPage.classList.add('active');
        targetPage.style.display = 'block';
    }
    
    document.querySelectorAll('.nav-item').forEach((btn, i) => {
        const isSelected = (i + 1) === p;
        btn.classList.toggle('active', isSelected);
        btn.style.color = isSelected ? 'var(--accent)' : 'var(--text)';
        btn.style.opacity = isSelected ? '1' : '0.5';
    });

    // ✅ แก้ไข: ลบการเขียนทับ h2 ออกจากฟังก์ชัน go
    const dateInpValue = $("dateInp")?.value || new Date().toISOString().split('T')[0];
    if (p === 2) {
        if (typeof renderDay === 'function') renderDay(dateInpValue);
        updateDateDisplay(dateInpValue);
    }
    if (p === 3) { 
        if ($("accDate") && $("dateInp")) {
            $("accDate").value = $("dateInp").value;
        }
        if (typeof loadAccountStatus === 'function') {
            loadAccountStatus(); 
        }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ========= SECTION 2.1: BOTTOM NAVIGATION ========= */
function updateNavDisplay(viewName, subNum) {
    const nav = document.querySelector('.bottom-nav');
    if (!nav) return;

    // ✅ ล้าง Active ทุกปุ่มก่อน
    nav.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // 🔹 กรณี = หน้าแรก
    if (viewName === 'home' || viewName === 'pageHome') {
        nav.querySelector('#navHome')?.classList.add('active');
    }
    // 🔹 กรณี = กลุ่มงาน (บันทึก/รายงาน/บัญชี) ใช้ subNum ตัดสินใจ
    else if (viewName === 'workGroup' || viewName.startsWith('sub')) {
        let num = subNum;
        // ถ้าไม่มีเลข ลองดึงจากชื่อ เช่น "sub2" → เลข 2
        if (!num && typeof viewName === 'string' && viewName.startsWith('sub')) {
            num = parseInt(viewName.replace('sub', ''), 10);
        }
        // ✅ กำหนด Active ตรงๆ ตาม ID ที่มีใน HTML เลย!
        if (num === 1) nav.querySelector('#nav1')?.classList.add('active');   // บันทึก
        if (num === 2) nav.querySelector('#nav2')?.classList.add('active');   // รายงาน
        if (num === 3) nav.querySelector('#nav3')?.classList.add('active');   // บัญชี
    }
    // 🔹 กรณี = ตั้งค่า
    else if (viewName === 'settings') {
        nav.querySelector('#navSettings')?.classList.add('active');
    }
}
/* =========== SECTION 3: SUB-PAGE NAVIGATION =========== */
function goSub(num) {
    const workPage = document.getElementById('pageWorkGroup');
    if (!workPage) return;

    workPage.querySelectorAll('.sub-page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });

    const target = document.getElementById('p' + num);
    if (!target) return;
    target.classList.add('active');
    target.style.display = 'block';

    updateNavDisplay('sub' + num);

    const dateInput = document.getElementById('dateInp');
    const dInp = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];

    if (num === 2) {
        if (typeof renderDay === 'function') renderDay(dInp);
        if (typeof updateDateDisplay === 'function') updateDateDisplay(dInp);
    }
    if (num === 3) {
        const accDate = document.getElementById('accDate');
        if (accDate && dateInput) accDate.value = dateInput.value;
        if (typeof loadAccountStatus === 'function') loadAccountStatus();
    }
}

/* =========== SECTION 4: MAIN TABS =========== */   
function switchMainTab(pageId, tabId, event) {
    if (event && event.preventDefault) event.preventDefault();

    // 1. จัดการสลับ "หน้าหลัก" (Main Pages/Sections)
    const allPages = document.querySelectorAll('.page-content, section[id^="page-"], .main-page');
    if (allPages.length > 0) {
        allPages.forEach(p => {
            p.style.display = 'none';
            p.classList.remove('active');
        });
    }

    const currentPage = document.getElementById(pageId);
    if (currentPage) {
        currentPage.style.display = 'block';
        currentPage.classList.add('active');
    }

    // 2. จัดการสลับ "แท็บย่อย" ภายในหน้านั้น (ถ้ามี tabId)
    if (tabId && currentPage) {
        currentPage.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
            panel.style.display = 'none';
        });

        const targetPanel = document.getElementById(tabId);
        if (targetPanel) {
            targetPanel.classList.add('active');
            targetPanel.style.display = 'block';
        }

        currentPage.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    }

    // 3. ✅ สั่งอัปเดต Bottom Nav ผ่าน updateNavDisplay ให้เป็นมาตรฐานเดียวกัน
    updateNavDisplay(pageId);

    // 4. โหลดข้อมูลตามเงื่อนไขแท็บ
    if (tabId === 'monthlyTab2') {
        if (typeof initYearOptions === 'function') initYearOptions();
        if (typeof renderYearlyIncomeSummary === 'function') renderYearlyIncomeSummary();
    } else if (pageId === 'report' || pageId === 'pageReport' || tabId === 'monthlyTab1') {
        if (typeof loadHistMonth === 'function') loadHistMonth();
    }
}
/* =========== SECTION 5: AUTO-UPDATE =========== */  
(function autoUpdate() {
    // 1. กำหนดเวอร์ชันปัจจุบันของแอป (หากยังไม่มีการตั้งค่าไว้ภายนอก)
    const APP_VERSION = typeof window.APP_VERSION !== 'undefined' ? window.APP_VERSION : '1.0.1';
    
    // 2. ดึงเวอร์ชันเดิมที่บันทึกไว้ในเครื่องผู้ใช้
    const currentStoredVersion = localStorage.getItem("app_v");

    // 3. ตรวจสอบว่าเวอร์ชันไม่ตรงกันหรือไม่ (มีการอัปเดตระบบ)
    if (currentStoredVersion !== APP_VERSION) {
        console.log(`[AutoUpdate] Updating system from ${currentStoredVersion || 'None'} to ${APP_VERSION}`);
        
        // บันทึกเวอร์ชันใหม่ลง localStorage
        localStorage.setItem("app_v", APP_VERSION);

        // (Optional) ล้าง Cache หรือ Service Worker เก่าออก
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }

        // แจ้งเตือนผู้ใช้แล้วทำการ Reload เพื่อโหลดไฟล์ JS/CSS ใหม่ล่าสุด
        if (currentStoredVersion) {
            if (typeof notify === 'function') {
                notify("info", "อัปเดตระบบ", "กำลังโหลดเวอร์ชันใหม่ล่าสุด...");
            }
            setTimeout(() => {
                window.location.reload(true);
            }, 1000);
        }
    }
})();
/* ===========  SECTION 6: DATE DISPLAY =========== */  
function updateDateDisplay(v) {
    if (!v) return;
    const [y, m, d] = v.split('-');
    const thaiYearFull = parseInt(y) + 543;
    const thaiYearShort = thaiYearFull.toString().slice(-2);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    
    const dayName = days[new Date(v + 'T00:00:00').getDay()].substring(0, 2);
    const formattedDate = `${parseInt(d)} ${months[parseInt(m) - 1]} ${thaiYearShort} (${dayName})`;
    
    const el = $("dateDisplay");
    if (el) el.innerText = formattedDate;

    const el2 = $("displayDateThai");
    if (el2) el2.innerText = formattedDate;

    if (typeof renderDay === "function") renderDay(v);
}
/* ========= SECTION 7: SAVE DATA ========= */
function saveDB() {
    try {
        localStorage.setItem("barber_db", JSON.stringify(db));
        localStorage.setItem("barber_archives", JSON.stringify(archives));
        localStorage.setItem("barber_account", JSON.stringify(account));
        localStorage.setItem("barber_conf", JSON.stringify(conf));
        return true;
    } catch (e) { console.error("❌ บันทึกไม่ได้:", e); return false; }
}
function saveSettings() {
    try {
        // 1. ดึงค่าจากฟอร์ม
        const settings = {
            shop:  $("setShop")?.value || "",
            perc:  parseFloat($("setPerc")?.value) || 0,
            guar:  parseFloat($("setGuar")?.value) || 0,
            theme: $("setTheme")?.value || "light",
            voice: $("setVoice")?.value || "default.mp3",
            sound: $("setSound")?.value || "on"
        };

        // 2. อัปเดตตัวแปรกลาง (conf) ทันที
        if (typeof conf !== "undefined") {
            Object.assign(conf, settings);
        }

        // 3. บันทึกลง LocalStorage และ DB
        if (typeof conf !== "undefined") {
            localStorage.setItem('barber_conf', JSON.stringify(conf));
        }
        localStorage.setItem('shopName',  settings.shop);
        localStorage.setItem('shopPerc',  settings.perc);
        localStorage.setItem('shopGuar',  settings.guar);
        localStorage.setItem('shopTheme', settings.theme);
        localStorage.setItem('shopVoice', settings.voice);
        localStorage.setItem('shopSound', settings.sound);

        if (typeof saveDB === "function") saveDB();

        // 4. อัปเดตการแสดงผลชื่อร้าน
        const nameDisp = $("shopNameDisp") || $("shopNameDisplay");
        if (nameDisp) {
            nameDisp.innerText = settings.shop.toUpperCase();
        } 

        // 5. เรียกฟังก์ชันอัปเดต UI 
        if (typeof applyTheme === "function") applyTheme(settings.theme);
        if (typeof calculateMoney === "function") calculateMoney(); 
        
        // ดึงวันที่จาก dateInp เพื่อป้องกันการส่งค่า undefined ให้ renderDay
        const currentDate = $("dateInp")?.value || new Date().toISOString().split('T')[0];
        if (typeof renderDay === "function") renderDay(currentDate); 

        // 6. ปิด Modal
        if ($("modalSet")) $("modalSet").style.display = 'none';
        
        // 7. แจ้งเตือนความสำเร็จ
        if (typeof notify === "function") {
            notify("success", "บันทึกสำเร็จ", "ระบบได้ดำเนินการบันทึกการตั้งค่าเรียบร้อยแล้ว");
        }

    } catch (e) {
        console.error("saveSettings error:", e);
        if (typeof notify === "function") {
            notify("error", "เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลตั้งค่าได้");
        }
    }
}

/* 🎨 ฟังก์ชันเปลี่ยนธีม (อัปเดตให้รองรับ dataset/attribute เพิ่มเติมเพื่อ CSS) */
function applyTheme(theme) {
    // ลบ class เก่าทั้งหมด
    document.body.classList.remove("vintage", "navy", "light");
    
    // กำหนดธีมใหม่
    const selectedTheme = theme || "light";
    if (selectedTheme !== "light") {
        document.body.classList.add(selectedTheme);
    }
    
    // อัปเดต data-theme ให้ตรงกับ CSS Selector [data-theme="..."]
    document.body.setAttribute("data-theme", selectedTheme);

    // บันทึกค่าลงเครื่อง
    localStorage.setItem("selectedTheme", selectedTheme);
    localStorage.setItem("shopTheme", selectedTheme);
}

/* 🚀 โหลดธีมทันทีที่เปิดเว็บ */
document.addEventListener("DOMContentLoaded", function() {
    const savedTheme = localStorage.getItem("selectedTheme") || localStorage.getItem("shopTheme") || "light";

    // สั่งเปลี่ยนธีม
    applyTheme(savedTheme);

    // จัดการตัวเลือก Dropdown
    const themeSelector = $("setTheme");
    if (themeSelector) {
        themeSelector.value = savedTheme;
        themeSelector.addEventListener("change", function() {
            applyTheme(this.value);
            if (navigator.vibrate) navigator.vibrate(10); 
        });
    }
});
/* ========= SECTION 8: NOTIFY & SOUND ========= */
function speak(type, message = "") {
    if (conf.sound === "off") return;
    const isMan = conf.voice === "male";
    const audioId = (type === "success") 
        ? (isMan ? "successSoundMan" : "successSoundWoman")
        : (isMan ? "errorSoundMan" : "errorSoundWoman");
    
    const audio = $(audioId);
    if (audio) { 
        audio.pause(); 
        audio.currentTime = 0; 
        audio.play().catch(e => console.warn("Audio autoplay prevented:", e)); 
    }
    if (message && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'th-TH';
        window.speechSynthesis.speak(utterance);
    }
}
document.addEventListener('click', function unlockAudio() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    }
    document.removeEventListener('click', unlockAudio);
}, { once: true });

function notify(type, title, text = "") {
    speak(type);
    if (typeof Swal === 'undefined') { alert(`${title}\n${text}`); return; }
    Swal.fire({ 
        icon: type, title, text, timer: 2200, showConfirmButton: false,
        timerProgressBar: true, background: 'var(--card)', color: 'var(--text)',
        iconColor: type === 'success' ? 'var(--success)' : 'var(--danger)'
    });
}

/* ========= SECTION 9: PAYMENT TYPE ========= */
function setPaymentType(m) {
    payMethod = m;
    const mixPanel = $("mixPanel");
    const payTypeSelect = $("payTypeSelect");
    if (payTypeSelect) payTypeSelect.value = m;
    if (mixPanel) mixPanel.style.display = (m === 'Mix') ? 'block' : 'none';
    if (m === 'Mix') {
        const price = parseFloat($("priceInp")?.value) || 0;
        const tip = parseFloat($("tipInp")?.value) || 0;
        const total = price + tip;
        if ($("mixTrans")) $("mixTrans").value = total > 0 ? total : "";
    }
}

/* ========= SECTION 10: SAVE RECORD ========= */
function handleSave(event) {
    const dInp = $("dateInp")?.value || "";
    const tStart = $("tStart")?.value || "";
    const tEnd = $("tEnd")?.value || "";
    const price = parseFloat($("priceInp")?.value) || 0;
    const tip = parseFloat($("tipInp")?.value) || 0;
    const hairStyleSelect = $("hairStyle");
    const currentPay = payMethod;
    if (!currentPay) return notify("error", "ระบุข้อมูลไม่ครบ", "กรุณาเลือกวิธีชำระเงิน");
    if (price === 0 && !["Free","Free-Cash","Free-Trans","Holiday","Guarantee"].includes(currentPay)) {
        return notify("error", "ระบุข้อมูลไม่ครบ", "กรุณาระบุจำนวนเงิน");
    }
    if (hairStyleSelect && hairStyleSelect.value === "" && !/^Free/.test(currentPay)) {
        return notify("error", "ระบุข้อมูลไม่ครบ", "กรุณาเลือกทรงผม");
    }
    let finalCash = 0, finalTrans = 0;
    switch (currentPay) {
        case "Free": finalCash = finalTrans = 0; break;
        case "Free-Cash": finalCash = price; break;
        case "Free-Trans": finalTrans = price + tip; break;
        case "Cash": finalCash = price + tip; break;
        case "Trans": finalTrans = price + tip; break;
        case "Mix":
            finalCash = parseFloat($("mixCash")?.value) || 0;
            finalTrans = parseFloat($("mixTrans")?.value) || 0; break;
    }
    const svcs = [];
    if (hairStyleSelect?.value) svcs.push(hairStyleSelect.value);
    if ($("extra1")?.value) svcs.push($("extra1").value);
    if ($("extra2")?.value) svcs.push($("extra2").value);
    db.push({
        id: Date.now(), date: dInp, time: tStart, endTime: tEnd,
        price, tip, pay: currentPay, svcs,
        payCash: finalCash, payTrans: finalTrans,
        custType: $("custType")?.value || "none",
        type: 'SERVICE'
    });
    saveDB();
    notify("success", "บันทึกสำเร็จ", "จัดเก็บข้อมูลเรียบร้อยแล้ว");
    $("priceInp").value = ""; $("tipInp").value = "0";
    payMethod = ""; setPaymentType("");
    if (hairStyleSelect) hairStyleSelect.selectedIndex = 0;
    $("extra1") && ($("extra1").selectedIndex = 0);
    $("extra2") && ($("extra2").selectedIndex = 0);
    const now = new Date();
    const curTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    $("tStart") && ($("tStart").value = curTime);
    $("tEnd") && ($("tEnd").value = curTime);
    renderDay(dInp);
    loadAccountStatus();
}

/* ========= SECTION 11: RENDER DAILY REPORT ========= */
function renderDay(selectedDate) {
    let dInp = selectedDate || ($("dateInp") ? $("dateInp").value : new Date().toISOString().split('T')[0]);
    if ($("dateInp")) $("dateInp").value = dInp;
    let allRec = db.filter(r => r.date === dInp);
    const days = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    const dayName = days[new Date(dInp).getDay()];
    if (allRec.length === 0 && typeof archives !== 'undefined') {
        const archivedDay = archives.find(a => a.date === dInp);
        if (archivedDay && archivedDay.details) {
            allRec = archivedDay.details;
        }
    }
    const isHoliday = allRec.some(r => r.type && r.type.toUpperCase() === 'HOLIDAY');
    const stats = {};
    const extraSvcs = ["โกนหนวด", "กันหน้า", "สระผม", "กันจอน", "ย้อมแฟชั่น", "ดัดผม"];
    let tot = 0, trans = 0, cash = 0, tips = 0;
    let listHtml = "";
    let realCustomerCount = 0;
    let countNew = 0;
    let countRegular = 0;
    allRec.slice().sort((a, b) => a.time.localeCompare(b.time)).forEach((r, i) => {
        const p = parseFloat(r.price) || 0;
        const t = parseFloat(r.tip) || 0;
        const rType = r.type ? String(r.type).toUpperCase().trim() : '';
        const currentSvcs = Array.isArray(r.svcs) ? r.svcs : [];
        const cType = r.custType || 'none';
        const timeShow = r.endTime ? `${r.time}-${r.endTime}` : r.time;
        tot += p; tips += t;
        if (r.pay === 'Mix') {
            const pCash = parseFloat(r.payCash) || 0;
            const pTrans = parseFloat(r.payTrans) || 0;
            trans += pTrans; cash += (pCash - t);
        } else if (r.pay === 'Trans' || r.pay === 'โอน') {
            trans += (p + t);
        } else {
            cash += p;
        }
        if (rType === 'HOLIDAY' || rType === 'GUARANTEE' || p === 0) {
        } else {
            if (currentSvcs.length > 0) {
                realCustomerCount++;
                if (cType === 'new') countNew++;
                if (cType === 'regular') countRegular++;
            }
            currentSvcs.forEach(s => { if (s) stats[s] = (stats[s] || 0) + 1; });
        }
        let custTag = ""; 
        let payIcon = r.pay === 'Trans' ? '📱' : '💶';
        let mixText = "";
        if (r.pay === 'Mix') {
            payIcon = '🌓';
            mixText = `<br><small style="color:#64748b; font-size:10px;">(สด:${r.payCash}/โอน:${r.payTrans})</small>`;
        } 
        listHtml += `
        <div class="history-row" style="padding:15px; border-bottom:1px solid #f1f5f9; background:#fff;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:28px; height:28px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; color:#64748b;">${i+1}</div>
                    <div style="display:flex; flex-direction:column;">
                        <div style="font-weight:800; font-size:14px; color:#1e293b;">
                            <span style="color:#64748b;">[${timeShow}]</span> ${currentSvcs.join(' + ')}${custTag}
                        </div>
                        <div style="display:flex; gap:8px; margin-top:2px;">
                            ${t ? `<small style="color:#be185d; font-weight:700;">🔹 ทิป: ฿${t}</small>` : ''}
                        </div>
                    </div>
                </div>
                <div style="text-align:right;">
                    <b style="font-size:16px; color:#1e293b;">${payIcon} ฿${p}${t ? ` <span style="color:#be185d;">(+${t})</span>` : ''}</b>
                    ${mixText}
                    <div style="margin-top:4px;">
                        <span style="font-size:11px; font-weight:700; color:#ef4444; cursor:pointer;" onclick="delRec(${r.id})">ลบ</span>
                    </div>
                </div>
            </div>
        </div>`;
    });
    const bEarn = isHoliday ? 0 : Math.max(tot * (conf.perc / 100), conf.guar) + tips;
    const sEarn = isHoliday ? 0 : tot - (bEarn - tips);
    const settle = isHoliday ? 0 : cash - bEarn;
    if ($("dTotal")) $("dTotal").innerText = tot.toLocaleString();
    if ($("dTrans")) $("dTrans").innerText = trans.toLocaleString();
    if ($("dCash")) $("dCash").innerText = cash.toLocaleString();
    if ($("dBarber")) $("dBarber").innerText = Math.floor(bEarn).toLocaleString();
    if ($("dShop")) $("dShop").innerText = Math.floor(sEarn).toLocaleString();
    if ($("dCounts")) {
        if (isHoliday) {
            $("dCounts").innerHTML = "<span style='color:#64748b;'>🏖️ วันหยุด</span>";
        } else if (allRec.length === 0) {
            $("dCounts").innerHTML = "<span style='color:#94a3b8;'>ไม่มีข้อมูล</span>";
        } else {
            let detail = "";
            if (countNew > 0 || countRegular > 0) {
                detail = `<div style="margin-top:4px; padding-top:4px; border-top:1px dashed #e2e8f0;"><span style="color:#22c55e;">🌟 ใหม่: ${countNew}</span> <span style="opacity:0.5;">|</span> <span style="color:#f59e0b;">📌 ประจำ: ${countRegular}</span></div>`;
            }
            $("dCounts").innerHTML = `<b style="font-size:16px;">ลูกค้า: ${realCustomerCount} คน</b>${detail}`;
        }
    }
    let sH = `<div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px;">`;
    const cleanExtras = extraSvcs.map(s => s.trim().toLowerCase());
    const allStatsKeys = Object.keys(stats);
    const haircutGroup = allStatsKeys.filter(k => !cleanExtras.includes(k.trim().toLowerCase()));
    const extraGroup = allStatsKeys.filter(k => cleanExtras.includes(k.trim().toLowerCase()));
    haircutGroup.forEach(k => { sH += `<span style="background:#4338ca;color:#fff;padding:3px 10px;border-radius:6px;font-size:10px;font-weight:800;">${k}: ${stats[k]}</span>`; });
    extraGroup.forEach(k => { sH += `<span style="background:#e0f2fe;color:#0369a1;padding:3px 10px;border-radius:6px;font-size:10px;font-weight:700;">${k}: ${stats[k]}</span>`; });
    if ($("dServiceStats")) $("dServiceStats").innerHTML = sH + `</div>`;
    let txt = "", statusColor = "", icon = "";
    if (isHoliday) { txt = "วันหยุด"; statusColor = "#1e40af"; icon = "🏖️"; }
    else if (allRec.length === 0) { txt = "รอข้อมูล..."; statusColor = "#64748b"; icon = "📝"; }
    else if (tot === 0) { txt = "ร้านจ่ายประกัน"; statusColor = "#0369a1"; icon = "🛡️"; }
    else if (settle > 0) { txt = `ช่างคืนร้าน ฿${Math.floor(settle).toLocaleString()}`; statusColor = "#b91c1c"; icon = "🥷"; }
    else if (settle < 0) { txt = `ร้านคืนช่าง ฿${Math.floor(Math.abs(settle)).toLocaleString()}`; statusColor = "#4338ca"; icon = "🏠"; }
    else { txt = "ยอดพอดี"; statusColor = "#15803d"; icon = "✅"; }
    const actionBox = $("settleBarContainer");
    if (actionBox) {
        actionBox.style.display = "flex";
        actionBox.style.gap = "10px";
        actionBox.innerHTML = `
            <div id="settleBar" style="flex:8; height:55px; background:#fff; display:flex; align-items:center; justify-content:center; border-radius:18px; font-weight:800; font-size:15px; color:${statusColor}; border:1px solid #e2e8f0;">
                <span style="margin-right:8px; font-size:18px;">${icon}</span> ${txt}
            </div>
            <button id="btnSubmitSend" onclick="saveAndGo('${dInp}', ${tot})" 
                style="flex:2.2; height:55px; background:#ff6f00; color:#fff; border-radius:18px; border:none; font-size:20px; cursor:pointer;">
                <i class="fas fa-paper-plane"></i>
            </button>`;
    }
    const dList = $("dailyList");
    if (dList) {
        const dateParts = dInp.split('-'); 
        let displayDateBE = dInp;
        if (dateParts.length === 3) {
            const d = dateParts[2];
            const m = dateParts[1];
            const yBE = parseInt(dateParts[0]) + 543;
            displayDateBE = `${d}/${m}/${yBE.toString().slice(-2)}`;
        }
        dList.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:#fff; border-radius:16px; border-bottom:2px solid #f1f5f9; margin-bottom:10px;">           
                <div style="display:flex; align-items:center; gap:8px;">
                    <b style="font-size:14px; color:#1e293b;">รายงานวันที่</b>             
                    <div style="position:relative; background:#eef2ff; padding:6px 12px; border-radius:10px; border:1px solid #e0e7ff; min-width:140px; height:36px;"> 
                        <span style="font-size:14px; font-weight:700; color:#4338ca;">${dayName} ${displayDateBE}</span>                   
                        <input type="date" id="reportDateSelector" value="${dInp}" onchange="renderDay(this.value)" style="position:absolute; opacity:0; left:0; top:0; width:100%; height:100%; cursor:pointer;">
                    </div>
                    <button onclick="deleteArchiveDate('${dInp}')" title="ลบข้อมูลของวันนี้" style="background:#fde8e8; color:#e11d48; border:none; width:44px; height:44px; border-radius:12px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; font-size:18px;">
                      <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
                <div style="display:flex; align-items:center;">
                    <i class="fab fa-line" style="color:#06c755; font-size:36px; cursor:pointer;" onclick="shareLine()"></i>
                </div>
            </div>
            <div style="padding:0 5px;">
                ${isHoliday ? `<center style='padding:30px; color:#64748b;'>🏖️ วันหยุด (${displayDateBE})</center>` : (listHtml || "<center style='padding:30px; color:#94a3b8;'>ไม่มีข้อมูล</center>")}
            </div>`;
    } 
}

/* ========= SECTION 12: DELETE RECORD ========= */
function delRec(id) {
    if (confirm("ลบรายการนี้?")) { db = db.filter(r => r.id !== id); saveDB(); renderDay(); }
}
function deleteArchiveDate(date) {
    if (confirm(`ลบข้อมูลวันที่ ${date} ทั้งหมด?`)) {
        db = db.filter(r => r.date !== date);
        archives = archives.filter(a => a.date !== date);
        saveDB(); renderDay(); loadAccountStatus();
        notify("success", "สำเร็จ", "ลบข้อมูลเรียบร้อย");
    }
}

/* ========= SECTION 13: SAVE & CLOSE DAY ========= */
async function saveAndGo(date, total) {
    const alreadySent = archives.some(a => a.date === date);
    if (alreadySent) return notify("error", "แจ้งเตือน", `วันที่ ${date} ส่งข้อมูลแล้ว`);
    const { isConfirmed } = await Swal.fire({
        title: "ยืนยันส่งข้อมูล", text: `วันที่ ${date} ?`, icon: "question",
        showCancelButton: true, confirmButtonText: "ยืนยัน", cancelButtonText: "ยกเลิก"
    });
    if (!isConfirmed) return;
    const allToday = db.filter(r => r.date === date);
    const isHoliday = allToday.some(r => r.type === "HOLIDAY");
    let cash = 0;
    allToday.forEach(r => {
        if (/Cash/i.test(r.pay)) cash += (r.price||0) + (r.tip||0);
        else if (/Mix/i.test(r.pay)) cash += Number(r.payCash)||0;
    });
    const commission = total * (conf.perc/100);
    const baseEarn = Math.max(commission, conf.guar);
    const bEarn = isHoliday ? 0 : baseEarn + allToday.reduce((s,r)=>s+(r.tip||0),0);
    const settle = isHoliday ? 0 : cash - bEarn;
    archives.push({ date, total, cash, barber: Math.floor(bEarn), settle, type: isHoliday?"HOLIDAY":"WORK", details: allToday });
    if (!isHoliday) account.balance = -settle;
    db = db.filter(r => r.date !== date);
    saveDB();
    notify("success", "สำเร็จ", "ส่งข้อมูลเรียบร้อย");
    renderDay(date); loadAccountStatus();
}

/* ========= SECTION 14: ACCOUNT STATUS ========= */
function loadAccountStatus() {
    const today = $("dateInp")?.value || new Date().toISOString().split('T')[0];
    if ($("accDate")) $("accDate").value = today;

    // ดึงข้อมูล Archive ล่าสุด และ Archive ของวันนี้
    const lastArchive = archives.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
    const todayArchive = archives.find(a => a.date === today);

    // คำนวณยอดเงินรวมคงเหลือตาม Logic เดิม
    const bal = account.balance || 0;
    const todaySettle = todayArchive ? todayArchive.settle : 0;
    const totalBal = bal + todaySettle;

    // อัปเดต UI ตาม Element ของเดิม
    if ($("accOldVal")) $("accOldVal").innerText = `฿${bal.toLocaleString()}`;
    if ($("accDateLabel")) $("accDateLabel").innerText = lastArchive ? lastArchive.date : "ยังไม่มีข้อมูล";
    if ($("accTodayVal")) $("accTodayVal").innerText = `฿${todaySettle.toLocaleString()}`;
    if ($("accTotalVal")) $("accTotalVal").innerText = `฿${totalBal.toLocaleString()}`;
    if ($("accLight")) $("accLight").style.background = totalBal >= 0 ? "#22c55e" : "#ef4444";

    // อัปเดต Badge แสดงสถานะ
    if ($("statusBadge")) {
        if (totalBal > 0) { 
            $("statusBadge").innerText = "ร้านคืนช่าง"; 
            $("statusBadge").style.background = "#dbeafe"; 
            $("statusBadge").style.color = "#1d4ed8"; 
        } else if (totalBal < 0) { 
            $("statusBadge").innerText = "ช่างคืนร้าน"; 
            $("statusBadge").style.background = "#fee2e2"; 
            $("statusBadge").style.color = "#dc2626"; 
        } else { 
            $("statusBadge").innerText = "ยอดพอดี"; 
            $("statusBadge").style.background = "#dcfce7"; 
            $("statusBadge").style.color = "#16a34a"; 
        }
    }
}

/* ========= SECTION 15: CLEAR ACCOUNT & HISTORY ========= */
async function clearAccount() {
    const date = $("accDate")?.value || new Date().toISOString().split('T')[0];
    const note = $("accNote")?.value || "เคลียร์ยอด";

    const { isConfirmed } = await Swal.fire({
        title: "ยืนยันเคลียร์เงิน", 
        text: `ยืนยัน ณ วันที่ ${date} ?`, 
        icon: "question",
        showCancelButton: true, 
        confirmButtonText: "ยืนยัน", 
        cancelButtonText: "ยกเลิก"
    });

    if (!isConfirmed) return;

    // เพิ่มรายการลงด้านหน้าสุด (unshift) และ reset balance เป็น 0 ตามของเดิม
    account.logs.unshift({ date, balance: account.balance, note });
    account.balance = 0;

    if (typeof saveDB === "function") saveDB();
    notify("success", "สำเร็จ", "เคลียร์ยอดเรียบร้อย");

    // ล้างช่องกรอกหมายเหตุ
    if ($("accNote")) $("accNote").value = "";

    loadAccountStatus();
}

function openHistoryModal() {
    const list = $("accHistory");
    if (!list) return;

    list.innerHTML = account.logs.length === 0 
        ? "<center style='padding:20px;color:#94a3b8'>ยังไม่มีประวัติ</center>"
        : account.logs.map(l => `
            <div style="padding:10px;border-bottom:1px solid #eee;">
                <b>${l.date}</b> | ${l.note}<br>
                <span style="color:${l.balance >= 0 ? '#22c55e' : '#ef4444'}">฿${(l.balance || 0).toLocaleString()}</span>
            </div>
        `).join("");

    if ($("historyModal")) $("historyModal").style.display = "flex";
}

function closeHistoryModal() { 
    if ($("historyModal")) $("historyModal").style.display = "none"; 
}

/* ========= SECTION 16: INSURANCE & HOLIDAY========= */
async function handleInsurance() {
    const d = $("dateInp")?.value || new Date().toISOString().split('T')[0];
    const g = parseInt(conf.guar) || 0;

    // 1. ตรวจสอบการตั้งค่ายอดประกัน
    if (g <= 0) {
        notify("error", "ข้อมูลไม่ครบถ้วน", "กรุณาตั้งค่าเงินประกันรายได้ในระบบก่อนดำเนินการ");
        return;
    }

    // 2. ตรวจสอบว่าเปิดประกันไปหรือยัง
    const isClaimed = db.some(r => r.date === d && r.type === "GUARANTEE_CLAIM");
    if (isClaimed) {
        notify("error", "แจ้งเตือน", "ระบบประกันรายได้ของวันนี้มีการเปิดใช้งานเรียบร้อยแล้ว");
        return;
    }

    // 3. ยืนยันการเปิดระบบประกันรายได้
    const result = await Swal.fire({
        title: 'ยืนยันการเปิดระบบประกัน',
        text: `ต้องการเปิดระบบประกันรายได้จำนวน ฿${g.toLocaleString()} สำหรับวันที่ ${d} ใช่หรือไม่?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: 'var(--success)',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'ยืนยันการเปิดระบบ',
        cancelButtonText: 'ยกเลิก',
        background: 'var(--card)',
        color: 'var(--text)'
    });

    if (result.isConfirmed) {
        db.push({ 
            id: Date.now(), 
            date: d, 
            time: "00:00", 
            svcs: ["🛡️ ประกันรายวัน"], 
            price: g, // บันทึกยอดประกันตามที่กำหนดในตั้งค่า (conf.guar)
            pay: "N/A", 
            type: "GUARANTEE_CLAIM" 
        });
        saveDB(); 
        notify("success", "ดำเนินการสำเร็จ", `เปิดระบบประกันรายได้จำนวน ฿${g.toLocaleString()} เรียบร้อยแล้ว`);
        renderDay(d);
    }
}

async function handleHoliday() {
    const d = $("dateInp")?.value || new Date().toISOString().split('T')[0];

    // ตรวจสอบบันทึกซ้ำ
    const isHoliday = db.some(r => r.date === d && r.type === "HOLIDAY");
    if (isHoliday) {
        notify("error", "แจ้งเตือน", "วันที่เลือกได้ดำเนินการบันทึกเป็นวันหยุดเรียบร้อยแล้ว");
        return;
    }

    // ยืนยันการบันทึกวันหยุด
    const result = await Swal.fire({
        title: 'ยืนยันการบันทึกวันหยุด',
        text: `ต้องการบันทึกวันที่ ${d} เป็น "วันหยุด" ใช่หรือไม่? (ระบบจะไม่คำนวณรายได้ในวันนี้)`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--success)',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'ยืนยันการบันทึก',
        cancelButtonText: 'ยกเลิก',
        background: 'var(--card)',
        color: 'var(--text)'
    });

    if (result.isConfirmed) {
        db.push({
            id: Date.now(),
            date: d, 
            time: "00:00",
            svcs: ["🏖️ วันหยุด"],
            price: 0, 
            pay: "N/A",
            type: "HOLIDAY",
            off: true  
        });
        saveDB();
        notify("success", "ดำเนินการสำเร็จ", "บันทึกข้อมูลวันหยุดเรียบร้อยแล้ว");
        renderDay(d);
    }
}

/* ========= SECTION 17: SETTINGS & THEME ========= */
// ✅ เปิดหน้าต่างตั้งค่า
function openSettings() {
    if ($("setShop")) $("setShop").value = conf.shop;
    if ($("setPerc")) $("setPerc").value = conf.perc;
    if ($("setGuar")) $("setGuar").value = conf.guar;
    if ($("setTheme")) $("setTheme").value = conf.theme;
    if ($("setSound")) $("setSound").value = conf.sound;
    if ($("setVoice")) $("setVoice").value = conf.voice;

    const modal = document.getElementById("modalSet");
    if (modal) {
        modal.style.display = "flex";
        modal.style.zIndex = "10000";
    }
}

// ✅ ปิดหน้าต่างตั้งค่า
function closeSettings() {
    const modal = document.getElementById("modalSet");
    if (modal) {
        modal.style.display = "none";
    }
}

// ✅ สลับแท็บ — ห้ามยุ่งกับหน้าต่างตั้งค่าเด็ดขาด!
function switchSummaryTab(tabId, evt) {
    // ❌ ไม่ต้องมีบรรทัดเกี่ยวกับ modal เลย ทั้งเปิดและปิด

    const targetTab = document.getElementById(tabId);
    if (!targetTab) {
        console.warn("ไม่พบแท็บ:", tabId);
        return;
    }

    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    targetTab.classList.add("active");

    const e = evt || window.event;
    const btn = e?.currentTarget || e?.target?.closest(".tab-btn");
    if (btn) btn.classList.add("active");

    const hideTabs = ["tabOverview", "tabMonth", "tabAnalytics"];
    const allNav = document.querySelectorAll("#pageSummary .bottom-nav .nav-item");
    const navWrap = document.querySelector("#pageSummary .bottom-nav");

    if (hideTabs.includes(tabId)) {
        allNav.forEach((item, i) => {
            item.style.display = i === 0 ? "flex" : "none";
        });
        if (navWrap) navWrap.style.gridTemplateColumns = "1fr";
    } else {
        allNav.forEach(item => {
            item.style.display = "flex";
        });
        if (navWrap) navWrap.style.gridTemplateColumns = "repeat(4, 1fr)";
    }
}
/* ========= SECTION 18: MONTHLY SUMMARY & EXCEL EXPORT ========= */
function loadHistDaily() {
    // Helper Selector ป้องกัน Error กรณีไม่ได้ประกาศ $ ไว้ใน Scope หลัก
    const $ = id => typeof window.$ === 'function' ? window.$(id) : document.getElementById(id);

    const d = $("histDate")?.value;
    if (!d) return;

    const f = archives.find(a => a.date === d);
    if (!f) return alert("ไม่พบข้อมูลของวันนี้");

    let cashTotal = Number(f.cash) || 0;
    let transTotal = Number(f.trans) || 0;
    let totalRevenue = cashTotal + transTotal;
    let customerCount = f.count || (f.details ? f.details.length : 0);
    const barberEarn = Math.floor(f.barber || 0);
    const shopEarn = Math.floor(f.shop || 0);

    // 1. นับจำนวนประเภทบริการ
    const svcCounts = {};
    (f.details || []).forEach(r => {
        if (!r.svcs) return;
        const services = Array.isArray(r.svcs) ? r.svcs : [r.svcs];
        services.forEach(s => {
            if (s) svcCounts[s] = (svcCounts[s] || 0) + 1;
        });
    });

    const svcHTML = Object.entries(svcCounts).map(([name, count]) => `
        <div style="background:rgba(203, 213, 225, 0.1); padding:6px 12px; border-radius:10px; font-size:12px; color:#cbd5e1; font-weight:600; display:inline-block; margin:3px; border:1px solid rgba(255, 255, 255, 0.1);">
            ${name} <span style="opacity:0.7; margin-left:4px;">x${count}</span>
        </div>
    `).join("");

    // 2. คำนวณยอดเคลียร์เงินระหว่างช่างกับร้าน
    let settleHTML = "";
    if (cashTotal > barberEarn) {
        const toShop = cashTotal - barberEarn;
        settleHTML = `
        <div style="background:rgba(251,146,60,0.1); padding:16px; border-radius:16px; margin-bottom:20px; text-align:center; border:1px solid rgba(251,146,60,0.3);">
            <div style="font-size:16px; color:#fdba74; font-weight:600; margin-bottom:4px;">🕵️‍♀️ ช่างคืนร้าน</div>
            <div style="font-size:24px; color:#fb923c; font-weight:800;">฿${toShop.toLocaleString()}</div>
        </div>`;
    } else if (barberEarn > cashTotal) {
        const toBarber = barberEarn - cashTotal;
        settleHTML = `
        <div style="background:rgba(56,189,248,0.1); padding:16px; border-radius:16px; margin-bottom:20px; text-align:center; border:1px solid rgba(56,189,248,0.3);">
            <div style="font-size:16px; color:#7dd3fc; font-weight:600; margin-bottom:4px;">🏠 ร้านคืนช่าง</div>
            <div style="font-size:24px; color:#38bdf8; font-weight:800;">฿${toBarber.toLocaleString()}</div>
        </div>`;
    }

    // 3. แสดงรายการย่อย (Rows)
    const rows = (f.details || [])
        .slice()
        .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
        .map((r, index) => {
            const p = Number(r.price) || 0;
            const t = Number(r.tip) || 0;
            const fullTime = (r.time && r.endTime) ? `${r.time}-${r.endTime}` : (r.time || "--:--");
            
            let payText = "";
            if (r.pay === 'Mix') {
                payText = `🌓 ผสม (สด:${Number(r.payCash || 0).toLocaleString()}/โอน:${Number(r.payTrans || 0).toLocaleString()})`;
            } else {
                payText = r.pay === 'Trans' ? '📱 โอน' : '💶 เงินสด';
            }

            const serviceText = Array.isArray(r.svcs) ? r.svcs.join(' + ') : (r.svcs || '-');

            return `
            <div style="padding:14px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:28px; height:28px; background:rgba(255,255,255,0.08); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:#94a3b8;">${index + 1}</div>
                    <div>
                        <div style="font-weight:700; font-size:14px; color:#f8fafc;">${serviceText}</div>
                        <div style="font-size:13px; color:#94a3b8; font-weight:500; margin-top:2px;">⏱ ${fullTime} • ${payText}</div>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:16px; font-weight:800; color:#f8fafc;">฿${p.toLocaleString()}</div>
                    ${t > 0 ? `<div style="font-size:12px; font-weight:600; color:#f472b6;">+ Tip ฿${t.toLocaleString()}</div>` : ''}
                </div>
            </div>`;
        }).join("");

    // 4. แปลงรูปแบบวันที่แสดงหัวข้อ (แก้ไขจุดเสี่ยง Date parsing บน iOS)
    let displayTitleDate = d;
    try {
        const [y, m, dayNum] = d.split('-').map(Number);
        const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const days = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
        
        const dateObj = new Date(y, m - 1, dayNum);
        const dayIdx = dateObj.getDay();
        const shortYear = (y + 543).toString().slice(-2);
        
        displayTitleDate = `${dayNum} ${months[m - 1]} ${shortYear} (${days[dayIdx]})`;
    } catch (e) {
        displayTitleDate = d;
    }

    // 5. แสดงผลลงใน Container บนหน้าจอโดยตรง
    const targetContainer = $("dailyReportInlineContent") || $("monthlyContent1");
    if (targetContainer) {
        targetContainer.innerHTML = `
            <div style="font-family:'Inter', system-ui, sans-serif; background:#0f172a; padding:20px; color:#f1f5f9; border-radius:16px;">
                <div style="text-align:center; margin-bottom:20px;">
                    <div style="font-size:18px; font-weight:800; color:#38bdf8;">รายงาน ${displayTitleDate}</div>
                    <div style="font-size:14px; color:#94a3b8; font-weight:600; margin-top:10px;">ยอดเงินรวม</div>
                    <div style="font-size:40px; font-weight:900; color:#ffffff; margin-top:2px;">฿${totalRevenue.toLocaleString()}</div>
                </div>

                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-bottom:20px;">
                    <div style="background:#14532d; padding:12px 6px; border-radius:14px; text-align:center; color:#ffffff;">
                        <div style="font-size:12px; opacity:0.8; font-weight:600; margin-bottom:2px;">💶 เงินสด</div>
                        <div style="font-size:15px; font-weight:800;">฿${cashTotal.toLocaleString()}</div>
                    </div>
                    <div style="background:#1e3a8a; padding:12px 6px; border-radius:14px; text-align:center; color:#ffffff;">
                        <div style="font-size:12px; opacity:0.8; font-weight:600; margin-bottom:2px;">📱 เงินโอน</div>
                        <div style="font-size:15px; font-weight:800;">฿${transTotal.toLocaleString()}</div>
                    </div>
                    <div style="background:#78350f; padding:12px 6px; border-radius:14px; text-align:center; color:#ffffff;">
                        <div style="font-size:12px; opacity:0.8; font-weight:600; margin-bottom:2px;">👤 ลูกค้า</div>
                        <div style="font-size:15px; font-weight:800;">${customerCount}</div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
                    <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:12px; border-radius:14px; text-align:center;">
                        <div style="font-size:13px; color:#94a3b8; font-weight:600; margin-bottom:2px;">ยอดเงินช่าง</div>
                        <div style="font-size:18px; font-weight:800; color:#f8fafc;">฿${barberEarn.toLocaleString()}</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:12px; border-radius:14px; text-align:center;">
                        <div style="font-size:13px; color:#94a3b8; font-weight:600; margin-bottom:2px;">ยอดเงินร้าน</div>
                        <div style="font-size:18px; font-weight:800; color:#f8fafc;">฿${shopEarn.toLocaleString()}</div>
                    </div>
                </div>

                ${settleHTML}

                <div style="margin-bottom:20px;">
                    <div style="font-size:13px; color:#94a3b8; font-weight:700; text-transform:uppercase; margin-bottom:8px; text-align:center;">สรุปประเภทงาน</div>
                    <div style="text-align:center;">${svcHTML || '<span style="color:#64748b; font-size:13px;">ไม่มีข้อมูลบริการ</span>'}</div>
                </div>

                <div style="font-weight:800; font-size:15px; color:#f8fafc; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                    <div style="width:4px; height:16px; background:#cbd5e1; border-radius:2px;"></div>
                    รายละเอียดงาน
                </div>
                <div>
                    ${rows || '<div style="text-align:center; color:#64748b; padding:20px;">ไม่มีรายการย่อย</div>'}
                </div>
            </div>
        `;
    }
}
/* ========= FIX: BIND ALL MONTH PICKERS ========= */
document.addEventListener("DOMContentLoaded", () => {
    // ผูก Event ให้กับ Month Picker ทุกตัวในหน้าเว็บ
    const pickers = ["monthlyReportPicker", "histMonth"];
    pickers.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("change", (e) => {
                const selectedValue = e.target.value;
                // Sync ค่าไปยัง Picker ตัวอื่นๆ ให้ตรงกัน
                pickers.forEach(otherId => {
                    const otherEl = document.getElementById(otherId);
                    if (otherEl && otherEl !== e.target) {
                        otherEl.value = selectedValue;
                    }
                });
                // โหลดข้อมูลใหม่ทันทีที่เปลี่ยนเดือน
                loadHistMonth();
            });
        }
    });
});

/* ========= FIX: LOAD HIST MONTH ========= */
function loadHistMonth() {
    const $ = (id) => document.getElementById(id);
    const picker = $("monthlyReportPicker") || $("histMonth");
    let m = picker ? picker.value : '';

    if (!m) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        m = `${yyyy}-${mm}`;
        if (picker) picker.value = m;
    }

    if (typeof archives === 'undefined' || !Array.isArray(archives)) return;

    let [y, mNum] = m.split('-').map(Number);
    const searchYear = y > 2500 ? y - 543 : y;
    const targetPrefix = `${searchYear}-${String(mNum).padStart(2, '0')}`;
    
    const monthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const monthThaiName = monthNames[mNum - 1] || '';
    const displayYearThai = searchYear + 543;
    const monthNameFormatted = `${monthThaiName} ${displayYearThai}`;

    const filtered = archives.filter(a => a.date && a.date.startsWith(targetPrefix));

    if (!filtered.length) {
        if ($("shopTotalMonth")) $("shopTotalMonth").innerText = "฿0";
        if (typeof notify === 'function') notify("error", "ไม่พบข้อมูล", `ไม่มีข้อมูลของเดือน ${monthNameFormatted}`);
        
        if (typeof generateMonthlyReport === 'function') {
            generateMonthlyReport(m, 0, 0, 0, 0, 0, 0, {}, {}, {}, 0, 0, 0);
        }
        return;
    }

    let countNew = 0, countRegular = 0;  
    let monthTotal = 0, monthBarber = 0, monthCount = 0, monthGuarDays = 0; 
    let hairStats = {}, serviceStats = {};
    let offDays = 0, workDays = 0;
    let weeklyData = {};

    const haircutList = ["แฟชั่น", "สกินเฟด", "รองทรง", "ตำรวจ/ทหาร", "นักเรียน", "ทรงนักเรียน", "เปิดข้าง", "ซอยผม/เล็มผม", "แก้ผม", "โกนผม", "เด็ก"];
    const dayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

    filtered.forEach(day => {
        const [dYear, dMonth, dDay] = day.date.split('-').map(Number);
        const dObj = new Date(dYear, dMonth - 1, dDay);
        
        const firstDayOfMonth = new Date(dYear, dMonth - 1, 1).getDay();
        let wIdx = Math.ceil((dDay + firstDayOfMonth) / 7);
        const wKey = `สัปดาห์ที่ ${wIdx}`;

        if (!weeklyData[wKey]) {
            weeklyData[wKey] = { 
                customers: 0, workDays: 0, offDays: 0, 
                zeroDays: 0, guarDays: 0, dailyCounts: [],
                countNew: 0, countRegular: 0, 
                popularHair: {}, 
                popularService: {}, 
                income: 0 
            };
        }

        if (day.off === true || day.type === "HOLIDAY") {
            offDays++;
            weeklyData[wKey].offDays++;
            return;
        }

        workDays++;
        weeklyData[wKey].workDays++;

        const dailyIncome = Number(day.total) || 0;
        const dailyBarber = Number(day.barber) || 0; 
        
        monthTotal += dailyIncome;
        monthBarber += dailyBarber;
        weeklyData[wKey].income += dailyIncome;

        let dayCustomerCount = 0; 

        if (day.details && Array.isArray(day.details)) {
            day.details.forEach(d => {
                if (d.type === "SERVICE" || !d.type) {
                    monthCount++;
                    dayCustomerCount++; 
                    weeklyData[wKey].customers++; 
                    
                    const type = String(d.custType || "").toLowerCase().trim();
                    if (type === "new") {
                        countNew++;
                        weeklyData[wKey].countNew++;
                    } else if (type === "regular") {
                        countRegular++;
                        weeklyData[wKey].countRegular++;
                    }

                    const svcs = Array.isArray(d.svcs) ? d.svcs : [d.svcs];
                    svcs.forEach(s => {
                        if (!s) return;
                        const cleanS = String(s).trim();
                        if (haircutList.includes(cleanS)) {
                            // เก็บยอดรวมรายเดือน
                            hairStats[cleanS] = (hairStats[cleanS] || 0) + 1;
                            // ✅ เพิ่มส่วนนับยอดสถิิติทรงผมแยกรายสัปดาห์
                            weeklyData[wKey].popularHair[cleanS] = (weeklyData[wKey].popularHair[cleanS] || 0) + 1;
                        } else {
                            // เก็บยอดรวมรายเดือน
                            serviceStats[cleanS] = (serviceStats[cleanS] || 0) + 1;
                            // ✅ เพิ่มส่วนนับยอดสถิติบริการเสริมแยกรายสัปดาห์
                            weeklyData[wKey].popularService[cleanS] = (weeklyData[wKey].popularService[cleanS] || 0) + 1;
                        }
                    });
                }
            });
        }

        if (dayCustomerCount === 0) weeklyData[wKey].zeroDays++;
        
        weeklyData[wKey].dailyCounts.push({ 
            dayName: dayNames[dObj.getDay()], 
            count: dayCustomerCount, 
            income: dailyIncome,
            barberEarn: dailyBarber 
        });
    });

    const avgCustomerPerDay = workDays > 0 ? (monthCount / workDays) : 0;

    if (typeof generateMonthlyReport === 'function') {
        generateMonthlyReport(m, monthTotal, monthBarber, monthCount, workDays, offDays, avgCustomerPerDay, weeklyData, hairStats, serviceStats, monthGuarDays, countNew, countRegular);
    }
}
function generateMonthlyReport(m, monthTotal, monthBarber, monthCount, workDays, offDays, avgCustomerPerDay, weeklyData, hairStats, serviceStats, monthGuarDays, countNew, countRegular) {
    // Helper Selector กัน Error เรื่อง $
    const $ = id => document.getElementById(id);

    // --- 1. เตรียมข้อมูลพื้นฐาน & นับยอดลูกค้าใหม่/ประจำใหม่ป้องกันค่าเป็น 0 ---
    const weekEntries = Object.entries(weeklyData || {});
    const weekKeys = Object.keys(weeklyData || {}); 
    const dayStats = {};
    
    let totalNew = 0;
    let totalRegular = 0;

    weekEntries.forEach(([wk, data]) => {
        totalNew += (data.countNew || 0);
        totalRegular += (data.countRegular || 0);

        if (data.dailyCounts) {
            data.dailyCounts.forEach(d => {
                const dayName = d.dayName ? d.dayName.split(' ')[0] : '';
                if (dayName) {
                    if (!dayStats[dayName]) dayStats[dayName] = { total: 0, count: 0 };
                    if (d.count > 0) {
                        dayStats[dayName].total += d.count;
                        dayStats[dayName].count += 1;
                    }
                }
            });
        }
    });

    const dayAverages = Object.entries(dayStats).filter(([name, data]) => data.count > 0).map(([name, data]) => ({ name, avg: data.total / data.count }));
    
    // แก้ไขจุดที่ 1: Copy Array ก่อน Sort ป้องกันข้อมูลตีกัน
    const busiestDay = [...dayAverages].sort((a, b) => b.avg - a.avg)[0];
    const quietestDay = [...dayAverages].sort((a, b) => a.avg - b.avg)[0];
    
    const topIncomeWeek = weekEntries.length > 0 ? weekEntries.reduce((p, c) => ((c[1].income || 0) > (p[1].income || 0) ? c : p)) : null;
    const topCountWeek = weekEntries.length > 0 ? weekEntries.reduce((p, c) => (((c[1].countNew || 0) + (c[1].countRegular || 0)) > ((p[1].countNew || 0) + (p[1].countRegular || 0)) ? c : p)) : null;

    const topHair = Object.entries(hairStats || {}).sort((a, b) => b[1] - a[1])[0];
    const topService = Object.entries(serviceStats || {}).sort((a, b) => b[1] - a[1])[0];

    // --- 2. วิเคราะห์ลูกค้า (รายสัปดาห์ & รายเดือน) ---
    let maxNewWeek = "-"; 
    let maxRegWeek = "-";
    let nUp = 0, nDown = 0, rUp = 0, rDown = 0;

    weekKeys.forEach((wk, idx) => {
        const curr = weeklyData[wk];
        const n = curr.countNew || 0;
        const r = curr.countRegular || 0;
        
        curr.newAnalysis = (n > r) ? "กลุ่มหลักอาทิตย์นี้" : (n < r) ? "น้อยกว่าลูกค้าประจำ" : "เท่ากับลูกค้าประจำ";
        curr.regAnalysis = (r > n) ? "กลุ่มหลักอาทิตย์นี้" : (r < n) ? "น้อยกว่าลูกค้าใหม่" : "เท่ากับลูกค้าใหม่";

        if (n > r && (maxNewWeek === "-" || n > (weeklyData[maxNewWeek]?.countNew || 0))) {
            maxNewWeek = wk;
        }
        if (r > n && (maxRegWeek === "-" || r > (weeklyData[maxRegWeek]?.countRegular || 0))) {
            maxRegWeek = wk;
        }

        if (idx > 0) {
            const prev = weeklyData[weekKeys[idx - 1]];
            const pN = prev.countNew || 0;
            const pR = prev.countRegular || 0;
            if (n > pN) nUp++; else if (n < pN) nDown++;
            if (r > pR) rUp++; else if (r < pR) rDown++;
        }
    });

    // --- 3. ฟังก์ชัน Render กราฟสถิติ ---
    const renderStats = (statsObj, defaultColor) => {
        if (!statsObj || typeof statsObj !== 'object') return `<div style="font-size:12px; color:#94a3b8; opacity:0.5; text-align:center;">ไม่มีข้อมูล</div>`;
        const entries = Object.entries(statsObj).sort((a, b) => b[1] - a[1]);
        if (entries.length === 0) return `<div style="font-size:12px; color:#94a3b8; opacity:0.5; text-align:center;">ไม่มีข้อมูล</div>`;
        
        const maxVal = entries[0][1];
        const extraSvcs = ["โกนหนวด", "กันหน้า", "สระผม", "กันจอน", "ย้อมแฟชั่น", "ดัดผม", "แคะหู"];
    
        return entries.map(([name, count]) => {
            const width = maxVal > 0 ? (count / maxVal) * 100 : 0;
            const barColor = defaultColor || (extraSvcs.includes(name) ? '#38bdf8' : '#facc15');
    
            return `
            <div style="margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:4px;">
                    <span style="color:#f8fafc; opacity:0.9;">${name}</span>
                    <span style="font-weight:700; color:${barColor};">${count}</span>
                </div>
                <div style="width:100%; height:8px; background:rgba(255,255,255,0.1); border-radius:10px; overflow:hidden;">
                    <div style="width:${width}%; height:100%; background:${barColor}; border-radius:10px; transition: width 0.8s ease-out;"></div>
                </div>
            </div>`;
        }).join("");
    };

    // --- 4. สรุปภาพรวม (Insights) ---
    const insights = [
        `วันทำงาน: เปิดร้านทั้งหมด <b>${workDays} วัน</b> (หยุด ${offDays} วัน)`,
        `สัปดาห์ที่มีลูกค้ามากที่สุด: <b>${topCountWeek ? topCountWeek[0] : "-"}</b> (${topCountWeek ? (topCountWeek[1].customers || "-") : "-"} คน)`,
        (topIncomeWeek && (topIncomeWeek[1].income || 0) > 0) 
            ? `สัปดาห์ที่มีรายได้สูงสุด: <b>${topIncomeWeek[0]}</b> (฿${topIncomeWeek[1].income.toLocaleString()})` 
            : `สัปดาห์ที่มีรายได้สูงสุด: <b>-</b>`
    ];
    
    if (totalNew > 0 || totalRegular > 0) {
        const newColor = "#38bdf8"; 
        const regColor = "#c084fc"; 
        const newText = `<span style="color: ${newColor}; font-weight: bold;">ใหม่ ${totalNew > 0 ? totalNew : "-"}</span>`;
        const regText = `<span style="color: ${regColor}; font-weight: bold;">ประจำ ${totalRegular > 0 ? totalRegular : "-"}</span>`;
        
        insights.push(`โครงสร้างลูกค้าเดือนนี้: <b>${totalRegular > totalNew ? "ลูกค้าประจำเป็นฐานหลัก" : totalNew > totalRegular ? "ลูกค้าใหม่เพิ่มมากขึ้น" : "สัดส่วนลูกค้าพอๆ กัน"} (${regText} / ${newText})</b>`);
             
        const maxNewText = `<span style="color: ${newColor};">ใหม่ (<b>${maxNewWeek !== "-" ? maxNewWeek : "-"}</b>)</span>`;
        const maxRegText = `<span style="color: ${regColor};">ประจำ (<b>${maxRegWeek !== "-" ? maxRegWeek : "-"}</b>)</span>`;
        
        insights.push(`สถิติลูกค้าเยอะสุดแยกกลุ่ม: ${maxNewText} | ${maxRegText}`);
    } 

    if (busiestDay && busiestDay.avg > 0) {
        const dayText = (!quietestDay || busiestDay.avg === quietestDay.avg) 
            ? `ลูกค้าเข้าเยอะใน <b>วัน${busiestDay.name}</b>` 
            : `ลูกค้าเข้าเยอะใน <b>วัน${busiestDay.name}</b> และน้อยใน <b>วัน${quietestDay.name}</b>`;
        insights.push(dayText);
    } else {
        insights.push(`สถิติรายวัน: -`);
    }
    
    insights.push(`ทรงผมยอดนิยม: <b>${topHair ? topHair[0] : '-'}</b> | บริการยอดนิยม: <b>${topService ? topService[0] : '-'}</b>`);
   
    // --- 5. รายละเอียดวิเคราะห์รายสัปดาห์ (Weekly Html) ---
    const weeklyHtml = weekEntries.map(([wk, data]) => {
        const weeklyTotalIncome = data.income || 0;
        let sumBarber = 0;
        if (data.dailyCounts) {
            data.dailyCounts.forEach(day => { sumBarber += Number(day.barberEarn || 0); });
        }
        const wBarber = sumBarber;
        const wShop = weeklyTotalIncome - wBarber;
        
        const sortedDays = data.dailyCounts ? [...data.dailyCounts].sort((a,b) => b.count - a.count) : [];
        const maxCount = sortedDays.length > 0 ? sortedDays[0].count : 0;
        const minCount = sortedDays.length > 0 ? sortedDays[sortedDays.length - 1].count : 0;

        const bestDay = (maxCount > 0) ? `${sortedDays[0].dayName} (${maxCount})` : "-";
        let worstDay = (sortedDays.length > 1 && maxCount !== minCount) ? `${sortedDays[sortedDays.length - 1].dayName} (${minCount})` : "-";

        const popHair = Object.entries(data.popularHair || {}).sort((a,b) => b[1] - a[1]).slice(0, 2).map(([name, count]) => `
            <span style="background:rgba(190,242,100,0.1); color:#bef264; padding:2px 8px; border-radius:8px; font-size:10px; border:1px solid rgba(190,242,100,0.2); margin-right:4px;">✂️ ${name} ${count}</span>
        `).join("");

        const popService = Object.entries(data.popularService || {}).sort((a,b) => b[1] - a[1]).slice(0, 2).map(([name, count]) => `
            <span style="background:rgba(56,189,248,0.1); color:#38bdf8; padding:2px 8px; border-radius:8px; font-size:10px; border:1px solid rgba(56,189,248,0.2); margin-right:4px;">🧴 ${name} ${count}</span>
        `).join("");

        return `
        <div style="background:#020617; border:1px solid rgba(255,255,255,0.08); padding:16px; border-radius:22px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div style="font-size:15px; font-weight:800; color:#f8fafc;">🗓️ ${wk}</div>
                <div style="font-size:10px; color:#94a3b8;">เปิด ${data.workDays || 0} | หยุด ${data.offDays || 0}</div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:6px; margin-bottom:10px;">
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); padding:6px 4px; border-radius:12px; text-align:center;">
                    <div style="font-size:9px; color:#94a3b8; margin-bottom:2px;">ยอดรวม</div>
                    <div style="font-size:13px; font-weight:800; color:#ffffff;">฿${weeklyTotalIncome.toLocaleString()}</div>
                </div>
                <div style="background:rgba(190,242,100,0.05); border:1px solid rgba(190,242,100,0.2); padding:6px 4px; border-radius:12px; text-align:center;">
                    <div style="font-size:9px; color:#bef264; margin-bottom:2px;">ช่าง</div>
                    <div style="font-size:13px; font-weight:800; color:#bef264;">฿${Math.floor(wBarber).toLocaleString()}</div>
                </div>
                <div style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.2); padding:6px 4px; border-radius:12px; text-align:center;">
                    <div style="font-size:9px; color:#38bdf8; margin-bottom:2px;">ร้าน</div>
                    <div style="font-size:13px; font-weight:800; color:#38bdf8;">฿${Math.floor(wShop).toLocaleString()}</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 10px;">
                <div style="background: rgba(255,255,255,0.02); padding: 6px 4px; border-radius: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="font-size: 8px; color: #64748b; margin-bottom: 2px;">👤 รวม</div>
                    <div style="font-size: 12px; font-weight: 700; color: #38bdf8;">${data.customers || 0}</div>
                </div>
                <div style="background: rgba(34,197,94,0.05); padding: 6px 4px; border-radius: 12px; text-align: center; border: 1px solid rgba(34,197,94,0.1);">
                    <div style="font-size: 8px; color: #4ade80; margin-bottom: 2px;">🌟 ใหม่</div>
                    <div style="font-size: 12px; font-weight: 700; color: #4ade80;">${data.countNew || 0}</div>
                </div>
                <div style="background: rgba(168,85,247,0.05); padding: 6px 4px; border-radius: 12px; text-align: center; border: 1px solid rgba(168,85,247,0.1);">
                    <div style="font-size: 8px; color: #c084fc; margin-bottom: 2px;">📌 ประจำ</div>
                    <div style="font-size: 12px; font-weight: 700; color: #c084fc;">${data.countRegular || 0}</div>
                </div>
            </div>

            <div style="font-size: 11px; color: #94a3b8; line-height: 1.7; padding: 0 4px 10px 4px; border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 10px;">
                ${data.countNew > 0 ? `<div>🌟 ลูกค้าใหม่: <span style="color: #4ade80; font-weight: 800;">${data.newAnalysis} (${data.countNew})</span></div>` : ''}
                ${data.countRegular > 0 ? `<div>📌 ลูกค้าประจำ: <span style="color: #facc15; font-weight: 800;">${data.regAnalysis} (${data.countRegular})</span></div>` : ''}
                <div style="margin-top: 2px;">📈 ลูกค้าเยอะที่สุด: <span style="color: #f1f5f9; font-weight: 600;">${bestDay}</span></div>
                <div>📉 ลูกค้าน้อยที่สุด: <span style="color: #f1f5f9; font-weight: 600;">${worstDay}</span></div>
            </div>      
            <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top: 8px;">
                ${popHair} ${popService}
            </div>
        </div>`;
    }).join("");

    let displayMonthTitle = m;
    try {
        const [y, mNum] = m.split('-');
        displayMonthTitle = new Date(y, mNum - 1, 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
    } catch(e) { displayMonthTitle = m; }

    // --- 6. ฉีด HTML แยกแสดงผลลงใน 3 แท็บหลัก ---
    if ($("monthlyIncomeContent")) {
        $("monthlyIncomeContent").innerHTML = `
            <div style="background:#0f172a; padding:20px; color:#f1f5f9; border-radius:20px; font-family: system-ui, sans-serif;">
                <div style="text-align:center; padding:10px 0 20px 0;">
                    <div style="font-size:14px; color:#94a3b8; font-weight:700; margin-bottom:4px;">✂️ รายได้รวมประจำเดือน (${displayMonthTitle})</div>
                    <div style="font-size:42px; font-weight:900; color:#ffffff;">฿${monthTotal.toLocaleString()}</div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); padding:12px; border-radius:16px; text-align:center;">
                        <div style="font-size:11px; color:#94a3b8;">รายได้ช่าง</div>
                        <div style="font-size:18px; font-weight:800; color:#f8fafc;">฿${Math.floor(monthBarber).toLocaleString()}</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); padding:12px; border-radius:16px; text-align:center;">
                        <div style="font-size:11px; color:#94a3b8;">รายได้ร้าน</div>
                        <div style="font-size:18px; font-weight:800; color:#f8fafc;">฿${Math.floor(monthTotal - monthBarber).toLocaleString()}</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 12px;">
                    <div style="background: rgba(56,189,248,0.15); padding: 8px 4px; border-radius: 12px; font-size: 12px; font-weight: 700; color: #38bdf8; text-align: center; border: 1px solid rgba(56,189,248,0.2);">
                        👤 ลูกค้า ${monthCount}
                    </div>
                    <div style="background: rgba(34,197,94,0.15); padding: 8px 4px; border-radius: 12px; font-size: 12px; font-weight: 700; color: #4ade80; text-align: center; border: 1px solid rgba(34,197,94,0.2);">
                        🌟 ใหม่ ${countNew || 0}
                    </div>
                    <div style="background: rgba(168,85,247,0.15); padding: 8px 4px; border-radius: 12px; font-size: 12px; font-weight: 700; color: #c084fc; text-align: center; border: 1px solid rgba(168,85,247,0.2);">
                        📌 ประจำ ${countRegular || 0}
                    </div>
                </div>

                <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 6px;">
                    <div style="background: rgba(255,255,255,0.08); padding: 6px 12px; border-radius: 10px; font-size: 11px; font-weight: 600; color: #f8fafc;">
                        📅 เปิด ${workDays} วัน
                    </div>
                    <div style="background: rgba(244,63,94,0.15); padding: 6px 12px; border-radius: 10px; font-size: 11px; font-weight: 600; color: #fb7185;">
                        ⛱️ หยุด ${offDays} วัน
                    </div>
                    <div style="background: rgba(250,204,21,0.15); padding: 6px 12px; border-radius: 10px; font-size: 11px; font-weight: 600; color: #facc15;">
                        🛡️ ประกัน ${monthGuarDays || 0} วัน
                    </div>
                    <div style="background: rgba(147,51,234,0.15); padding: 6px 12px; border-radius: 10px; font-size: 11px; font-weight: 600; color: #a855f7;">
                        📊 เฉลี่ย ${(avgCustomerPerDay || 0).toFixed(2)} คน/วัน
                    </div>
                </div>
            </div>
        `;
    }

    if ($("incomeAnalyticsContent")) {
        $("incomeAnalyticsContent").innerHTML = `
            <div style="background:#0f172a; padding:20px; color:#f1f5f9; border-radius:20px; font-family: system-ui, sans-serif;">
                <div style="background:rgba(250,204,21,0.08); border:1px solid rgba(250,204,21,0.25); padding:16px; border-radius:16px; margin-bottom:20px;">
                    <div style="font-size:14px; font-weight:800; color:#facc15; margin-bottom:10px;">⌛ วิเคราะห์ภาพรวมประจำเดือน</div>
                    ${insights.map(i => `<div style="font-size:12.5px; color:#f8fafc; margin-bottom:6px;">• ${i}</div>`).join("")}
                </div>

                <div>
                    <div style="font-size:14px; font-weight:800; color:#38bdf8; margin-bottom:12px;">🌀 รายละเอียดแยกสัปดาห์</div>
                    ${weeklyHtml}
                </div>
            </div>
        `;
    }

    if ($("servicesStatsContent")) {
        $("servicesStatsContent").innerHTML = `
            <div style="background:#0f172a; padding:20px; color:#f1f5f9; border-radius:20px; font-family: system-ui, sans-serif;">
                <div style="margin-bottom:24px;">
                    <div style="font-size:14px; font-weight:800; color:#bef264; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                        <div style="width:4px; height:16px; background:#bef264; border-radius:2px;"></div> ทรงผมยอดนิยม
                    </div>
                    ${renderStats(hairStats, "#bef264")}
                </div>

                <div>
                    <div style="font-size:14px; font-weight:800; color:#38bdf8; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                        <div style="width:4px; height:16px; background:#38bdf8; border-radius:2px;"></div> บริการยอดนิยม
                    </div>
                    ${renderStats(serviceStats, "#38bdf8")}
                </div>
            </div>
        `;
    }
}
// ================= แท็บที่ 1: รายงานประจำเดือน (ตารางรายวัน) =================
function renderDailyTableReport() {
    const picker = document.getElementById('monthlyReportPicker') || document.getElementById('histMonth');
    const content = document.getElementById('monthlyContent1') || document.getElementById('monthlyIncomeContent');
    if (!content) return;

    if (typeof archives === 'undefined' || !Array.isArray(archives)) {
        content.innerHTML = '<div style="text-align:center; padding: 20px; color: #64748b;">ไม่พบฐานข้อมูลหลัก (archives)</div>';
        return;
    }

    let mVal = picker ? picker.value : '';
    if (!mVal) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        mVal = `${yyyy}-${mm}`;
        if (picker) picker.value = mVal;
    }

    const [y, mNum] = mVal.split('-').map(Number);
    const targetPrefix = `${y}-${String(mNum).padStart(2, '0')}`;
    
    // กรองข้อมูลเดือนที่เลือก
    const filtered = archives.filter(a => a.date && a.date.startsWith(targetPrefix));

    const monthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const monthThaiName = monthNames[mNum - 1] || '';
    const thaiDayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

    const currentShopName = (typeof conf !== 'undefined' && conf.shop) ? conf.shop : (localStorage.getItem('shopName') || 'Barber Shop');

    let totalCust = 0, totalBarber = 0, totalShave = 0, totalWash = 0, totalDye = 0;
    let workDays = 0; // ตัวแปรนับจำนวนวันเปิดทำงาน
    let rowsHTML = '';

    // เรียงวันที่จาก 1 -> 31
    filtered.sort((a, b) => a.date.localeCompare(b.date));

    filtered.forEach(day => {
        // ตรวจสอบวันหยุด
        const isOffDay = day.off === true || day.type === "HOLIDAY";

        let dayCust = 0;
        let shave = 0, wash = 0, dye = 0;

        if (!isOffDay) {
            workDays++; // นับเฉพาะวันที่ไม่ใช่วันหยุด

            if (day.details && Array.isArray(day.details)) {
                day.details.forEach(d => {
                    if (d.type === "SERVICE" || !d.type) {
                        dayCust++;
                        const svcs = Array.isArray(d.svcs) ? d.svcs : [d.svcs];
                        svcs.forEach(s => {
                            if (!s) return;
                            const cleanS = String(s).trim();
                            if (cleanS.includes("โกน")) shave++;
                            if (cleanS.includes("สระ")) wash++;
                            if (cleanS.includes("ย้อม") || cleanS.includes("สี")) dye++;
                        });
                    }
                });
            } else {
                dayCust = Number(day.count) || 0;
            }
        }

        const barber = isOffDay ? 0 : (Number(day.barber) || 0);

        totalCust += dayCust;
        totalBarber += barber;
        totalShave += shave;
        totalWash += wash;
        totalDye += dye;

        // คำนวณชื่อวัน
        let displayDayName = day.dayName || '-';
        if (day.date) {
            const [dYear, dMonth, dDay] = day.date.split('-').map(Number);
            const dObj = new Date(dYear, dMonth - 1, dDay);
            if (!isNaN(dObj.getTime())) {
                displayDayName = thaiDayNames[dObj.getDay()];
            }
        }

        const dayNum = day.date ? day.date.split('-')[2] : '-';

        // ถ้าเป็นวันหยุด ให้แสดงคำว่า "หยุด" ตัวหนังสือสีแดง
        if (isOffDay) {
            rowsHTML += `
                <tr style="background-color: #fef2f2;">
                    <td>${parseInt(dayNum, 10)}</td>
                    <td>${displayDayName}</td>
                    <td colspan="5" style="color: #ef4444; font-weight: 700; text-align: center;">หยุด</td>
                </tr>
            `;
        } else {
            rowsHTML += `
                <tr>
                    <td>${parseInt(dayNum, 10)}</td>
                    <td>${displayDayName}</td>
                    <td>${dayCust}</td>
                    <td>${barber.toLocaleString()}</td>
                    <td>${shave}</td>
                    <td>${wash}</td>
                    <td>${dye}</td>
                </tr>
            `;
        }
    });

    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 10px;">
            <h3 style="margin: 0; color: var(--primary, #0284c7);">รายงานร้าน: <span class="shop-name-display">${currentShopName}</span></h3>
            <p style="margin: 4px 0; font-weight: 700; color: var(--text, #334155);">ประจำเดือน: ${monthThaiName} ${y + 543}</p>
        </div>
        <table class="summary-table" style="width:100%; border-collapse: collapse; text-align:center;">
            <thead>
                <tr style="background-color: var(--bg, #f1f5f9);">
                    <th>วันที่</th>
                    <th>วัน</th>
                    <th>ลูกค้า</th>
                    <th>ยอดช่าง</th>
                    <th>โกน</th>
                    <th>สระ</th>
                    <th>ย้อม</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHTML || '<tr><td colspan="7" style="text-align:center; padding: 20px; color:#94a3b8;">ไม่มีข้อมูลในเดือนนี้</td></tr>'}
            </tbody>
            <tfoot>
                <tr style="background-color: #ffeb3b; font-weight: bold; color: #000;">
                    <td>รวมยอด</td>
                    <td style="color: #0284c7;">เปิด ${workDays} วัน</td>
                    <td>${totalCust}</td>
                    <td>${totalBarber.toLocaleString()}</td>
                    <td>${totalShave}</td>
                    <td>${totalWash}</td>
                    <td>${totalDye}</td>
                </tr>
            </tfoot>
        </table>
    `;
}
// ================= แท็บที่ 2: รายได้ย้อนหลัง 12 เดือน =================
function renderYearlyIncomeSummary() {
    const select = document.getElementById('yearFilterSelect') || document.getElementById('histYear');
    const tbody = document.getElementById('yearlyTableBody');
    if (!tbody) return;

    if (typeof archives === 'undefined' || !Array.isArray(archives)) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">ไม่พบฐานข้อมูลหลัก (archives)</td></tr>';
        return;
    }

    const selectedYear = parseInt(select && select.value ? select.value : new Date().getFullYear(), 10);
    const monthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    let grandCust = 0, grandBarber = 0, grandShop = 0, grandTotal = 0;
    let html = '';

    monthNames.forEach((monthName, idx) => {
        const mNum = idx + 1;
        const targetPrefix = `${selectedYear}-${String(mNum).padStart(2, '0')}`;

        // กรอง archives เฉพาะเดือนนั้นๆ
        const monthData = archives.filter(a => a.date && a.date.startsWith(targetPrefix));

        let mCust = 0, mBarber = 0, mTotal = 0;

        monthData.forEach(day => {
            // คำนวณลูกค้า
            if (day.details && Array.isArray(day.details)) {
                day.details.forEach(d => {
                    if (d.type === "SERVICE" || !d.type) mCust++;
                });
            } else {
                mCust += Number(day.count) || 0;
            }

            const dailyTotal = Number(day.total) || 0;
            const dailyBarber = Number(day.barber) || 0;

            mBarber += dailyBarber;
            mTotal += dailyTotal;
        });

        const mShop = mTotal - mBarber; // ยอดร้าน = ยอดรวม - ยอดช่าง

        grandCust += mCust;
        grandBarber += mBarber;
        grandShop += mShop;
        grandTotal += mTotal;

        html += `
            <tr>
                <td style="text-align: left; font-weight: 600;">${idx + 1}. ${monthName}</td>
                <td>${mCust ? mCust.toLocaleString() : '-'}</td>
                <td>${mBarber ? mBarber.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}</td>
                <td>${mShop ? mShop.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}</td>
                <td style="font-weight: 700;">${mTotal ? mTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;

    // แสดงผลรวมด้านล่าง
    const elemCust = document.getElementById('yearlyTotalCust');
    const elemBarber = document.getElementById('yearlyTotalBarber');
    const elemShop = document.getElementById('yearlyTotalShop');
    const elemGrand = document.getElementById('yearlyGrandTotal');

    if (elemCust) elemCust.innerText = grandCust.toLocaleString();
    if (elemBarber) elemBarber.innerText = grandBarber.toLocaleString('th-TH', { minimumFractionDigits: 2 });
    if (elemShop) elemShop.innerText = grandShop.toLocaleString('th-TH', { minimumFractionDigits: 2 });
    if (elemGrand) elemGrand.innerText = grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 });
}
// ฟังก์ชันช่วยแปลงชื่อเดือนภาษาไทย
function getThaiMonthName(m) {
    const months = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return months[m];
}

function getShortThaiMonth(m) {
    const months = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return months[m];
}
function initYearOptions() {
    const select = document.getElementById('yearFilterSelect');
    if (!select) return;

    const currentYear = new Date().getFullYear();
    let html = '';

    for (let y = currentYear; y >= currentYear - 5; y--) {
        html += `<option value="${y}">ปี ${y}</option>`;
    }

    select.innerHTML = html;
}

// เรียกใช้ฟังก์ชันตอนโหลดหน้าเว็บ (แก้ไขชื่อฟังก์ชันให้ตรงกันแล้ว)
document.addEventListener('DOMContentLoaded', () => {
    initYearOptions();
    if (typeof renderYearlyIncomeSummary === 'function') {
        renderYearlyIncomeSummary();
    }
});
// 1. ส่งออก Excel สำหรับหน้า "สรุปรายเดือน" (ดึงข้อมูลรายวันทั้งเดือน)
function exportMonthlyExcel() {
    const picker = document.getElementById('monthlyReportPicker');
    if (!picker) return notify("error", "ผิดพลาด", "ไม่พบช่องเลือกเดือน");
    
    const monthValue = picker.value; // รูปแบบ: "2569-09" (พ.ศ.)
    if (!monthValue || typeof XLSX === 'undefined') {
        return notify("error", "ผิดพลาด", "กรุณาเลือกเดือน หรือเช็คการโหลดไลบรารี SheetJS");
    }

    const [yearBe, month] = monthValue.split('-');
    const monthPad = String(month).padStart(2, '0');

    const monthThaiNames = [
        '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const dayThaiNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
    const monthName = `${monthThaiNames[parseInt(month, 10)]} ${yearBe}`;
    const searchPrefix = `${yearBe}-${monthPad}`;
    
    const list = (archives || []).filter(a => a.date?.startsWith(searchPrefix));
    if (!list.length) {
        return notify("error", "ไม่พบข้อมูล", `ไม่มีข้อมูลของเดือน ${monthName}`);
    }

    // ✅ หัวตาราง + คอลัมน์ตรงตามต้องการ
    const rows = [
        [`รายงานร้าน: ${(conf?.shop || localStorage.getItem('shopName') || 'Barber Shop')}`],
        [`ประจำเดือน: ${monthName}`],
        ["วันที่", "วัน", "ลูกค้า", "ยอดช่าง", "โกน", "สระ", "ย้อม"]
    ];
    
    let totalCust = 0, totalIncome = 0, totalShave = 0, totalWash = 0, totalDye = 0;
    const workDays = list.length; // จำนวนวันทำการ

    list.forEach(a => {
        const dateParts = a.date ? a.date.split('-') : [];
        const dayOnly = dateParts.length === 3 ? parseInt(dateParts[2], 10) : ''; // ✅ แสดงแค่ตัวเลขวันที่ 1,2,3...

        // คำนวณชื่อวัน
        const yCe = parseInt(yearBe, 10) - 543;
        const m = parseInt(month, 10) - 1;
        const d = parseInt(dayOnly, 10);
        const dateObj = new Date(yCe, m, d);
        const dayName = dateObj.getDay() >= 0 ? dayThaiNames[dateObj.getDay()] : '';
        
        // นับบริการ
        let shave = 0, wash = 0, dye = 0;
        if (Array.isArray(a.details)) {
            a.details.forEach(d => {
                const svcs = (d.svcs || []).join(' ');
                if (svcs.includes('โกน')) shave++;
                if (svcs.includes('สระ')) wash++;
                if (svcs.includes('ย้อม')) dye++;
            });
        }
        
        const cust = a.count || (a.details ? a.details.length : 0);
        const income = a.barber || a.total || 0;

        totalCust += cust;
        totalIncome += income;
        totalShave += shave;
        totalWash += wash;
        totalDye += dye;

        // ✅ คอลัมน์: วันที่(เลข), วัน, ลูกค้า, ยอดช่าง, โกน, สระ, ย้อม
        rows.push([dayOnly, dayName, cust, income, shave || '-', wash || '-', dye || '-']);
    });

    // ✅ แถวรวมท้าย: "รวมยอด" + "เปิด X วัน" (ลบคำว่า "ทั้งเดือน" ออก)
    rows.push(["รวมยอด", `เปิด ${workDays} วัน`, totalCust, totalIncome, totalShave, totalWash, totalDye]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "รายงานรายเดือน");

   // ========== ✅ ใช้ Web Share API สำหรับ iOS เพื่อเปิดหน้า Preview ทันที ==========
    const fileName = `รายงานรายเดือน-${monthName}.xlsx`;
    const fileData = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const file = new File([fileData], fileName, { 
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
    });

    // ตรวจสอบว่าเบราว์เซอร์รองรับการแชร์ไฟล์ (Safari บน iOS รองรับ)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
            files: [file],
            title: `รายงานประจำเดือน ${monthName}`,
        }).catch((err) => {
            // ยกเลิกการแชร์ หรือปิดหน้าต่าง
            console.log('Share canceled or failed:', err);
        });
    } else {
        // สำหรับ Android / PC ที่ไม่รองรับ Web Share
        const blob = new Blob([fileData], { 
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    }

    notify("success", "สำเร็จ", `เตรียมไฟล์รายงานเดือน ${monthName} เรียบร้อยแล้ว`);
}
   function exportComparisonToExcel() {
    if (typeof XLSX === 'undefined') return notify("error", "ผิดพลาด", "ไม่พบไลบรารี XLSX");
    
    const m1 = document.getElementById('compareMonth1')?.value;
    const m2 = document.getElementById('compareMonth2')?.value;
    if (!m1 || !m2) return notify("error", "แจ้งเตือน", "กรุณาเลือกเดือนที่ต้องการเปรียบเทียบให้ครบทั้ง 2 ช่อง");

    // ✅ ฟังก์ชันช่วยแปลงค่าเดือนและค้นหาข้อมูล
    const getMonthData = (monthVal) => {
        const [yBe, m] = monthVal.split('-');
        const yCe = parseInt(yBe, 10) - 543;
        const mPad = String(m).padStart(2, '0');
        return (archives || []).filter(a => a.date?.startsWith(`${yCe}-${mPad}`));
    };

    const data1 = getMonthData(m1);
    const data2 = getMonthData(m2);

    const calcTotal = (data) => {
        let cust = 0, income = 0;
        data.forEach(a => {
            cust += a.count || (a.details ? a.details.length : 0);
            income += a.barber || a.total || 0;
        });
        return { cust, income };
    };

    const res1 = calcTotal(data1);
    const res2 = calcTotal(data2);

    const rows = [
        ["รายงานวิเคราะห์เปรียบเทียบยอดขาย"],
        ["หัวข้อเปรียบเทียบ", `เดือน ${m1}`, `เดือน ${m2}`, "ผลต่าง (Diff)"],
        ["จำนวนลูกค้า (คน)", res1.cust, res2.cust, res2.cust - res1.cust],
        ["รายได้รวม (บาท)", res1.income, res2.income, res2.income - res1.income]
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "เปรียบเทียบ");
    XLSX.writeFile(wb, `เปรียบเทียบ-${m1}-VS-${m2}.xlsx`);
    notify("success", "สำเร็จ", "ส่งออกข้อมูลเปรียบเทียบเรียบร้อยแล้ว");
}
/* ========= SECTION 19: GOOGLE SHEETS & SHARE ========= */
async function handleGoogleSheet() {
    const picker = document.getElementById('monthlyReportPicker') || document.getElementById('histMonth');
    let mVal = picker ? picker.value : '';
    if (!mVal) {
        const now = new Date();
        const yyyy = now.getFullYear() + 543;
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        mVal = `${yyyy}-${mm}`;
    }

    const [yearBe, mNum] = mVal.split('-').map(Number);
    const monthPad = String(mNum).padStart(2, '0');
    const targetPrefix = `${yearBe}-${monthPad}`;

    const filtered = (typeof archives !== 'undefined' ? archives : []).filter(a => 
        a.date && a.date.startsWith(targetPrefix)
    );

    const monthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const monthThaiName = monthNames[mNum - 1] || '';

    if (!filtered.length) {
        const msg = `ไม่มีข้อมูลของเดือน ${monthThaiName} ${yearBe}`;
        return typeof notify === 'function' ? notify("error", "ไม่พบข้อมูล", msg) : alert(msg);
    }

    // ========== 1. สั่งเปิด/สลับไปแอป Google Sheets โดยตรง ==========
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    const playStoreUrl = "https://play.google.com/store/apps/details?id=com.google.android.apps.docs.editors.sheets";
    const appStoreUrl = "https://apps.apple.com/th/app/google-sheets/id441411228";

    let hasSwitched = false;
    const visibilityHandler = () => {
        if (document.hidden) hasSwitched = true;
    };
    document.addEventListener("visibilitychange", visibilityHandler);

    // ยิง URL Scheme ตรงเพื่อสั่งเปิดแอป Google Sheets
    window.location.href = "googlesheets://";

    // ========== 2. หน่วงเวลาตรวจเช็คว่าในเครื่องมีแอปหรือไม่ ==========
    setTimeout(() => {
        document.removeEventListener("visibilitychange", visibilityHandler);

        if (!hasSwitched) {
            // กรณีไม่มีแอป Google Sheets ในเครื่อง
            if (typeof notify === 'function') notify("warning", "ไม่พบแอปพลิเคชัน", "กำลังตรวจสอบการติดตั้ง Google Sheets...");

            const userConfirm = confirm("ไม่พบแอป Google Sheets ในเครื่องของคุณ\nต้องการไปหน้าติดตั้ง (Store) เพื่อใช้งานหรือไม่?");
            
            if (userConfirm) {
                if (isAndroid) {
                    window.location.href = playStoreUrl;
                } else if (isIOS) {
                    window.location.href = appStoreUrl;
                } else {
                    window.open("https://sheets.google.com", "_blank");
                }
            } else {
                if (typeof notify === 'function') notify("info", "ยกเลิก", "คุณสามารถใช้งานผ่านเบราว์เซอร์แทนได้");
            }
        } else {
            // กรณีเปิดแอปสำเร็จ
            if (typeof notify === 'function') notify("success", "สำเร็จ", "เปิดแอป Google Sheets เรียบร้อยแล้ว");
        }
    }, 2000);
}
function openComparisonSelector() {
    if (typeof notify === 'function') {
        notify("info", "กำลังพัฒนา", "ฟังก์ชันเปรียบเทียบจะเพิ่มเร็วๆ นี้");
    }
}

/* ========= SECTION 20: IMPORT / EXPORT / CLEAR ========= */
// 1. ฟังก์ชันส่งออกข้อมูล (Export)
function exportBackup() {
    try {
        const data = {
            db: typeof db !== 'undefined' ? db : JSON.parse(localStorage.getItem("barber_db") || "[]"),
            archives: typeof archives !== 'undefined' ? archives : JSON.parse(localStorage.getItem("barber_archives") || "[]"),
            account: typeof account !== 'undefined' ? account : JSON.parse(localStorage.getItem("barber_account") || '{"balance":0,"logs":[]}'), 
            conf: typeof conf !== 'undefined' ? conf : JSON.parse(localStorage.getItem("barber_conf") || "{}"),
            exported: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Barber-Backup-${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.json`;
        a.click();
        
        // คืนค่า Memory
        URL.revokeObjectURL(url);

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'สำรองข้อมูลสำเร็จ',
                text: 'ระบบสร้างไฟล์สำรองเรียบร้อยแล้ว',
                icon: 'success',
                confirmButtonColor: 'var(--success, #22c55e)'
            });
        } else if (typeof notify === 'function') {
            notify("success", "สำรองข้อมูลเรียบร้อย", "สำเร็จ");
        }
    } catch (e) { 
        if (typeof Swal !== 'undefined') {
            Swal.fire({ title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถสร้างไฟล์สำรองได้', icon: 'error' });
        } else if (typeof notify === 'function') {
            notify("error", "ไม่สามารถสร้างไฟล์สำรองได้", "ข้อผิดพลาด");
        }
    }
}
// 2. ฟังก์ชันนำเข้าข้อมูล (Import)
function importBackup(input) {
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            // ตรวจสอบโครงสร้างไฟล์
            if (!data.db && !data.archives) throw new Error("Wrong format");

            const processImport = () => {
                // เขียนทับ LocalStorage
                localStorage.setItem("barber_db", JSON.stringify(data.db || []));
                localStorage.setItem("barber_archives", JSON.stringify(data.archives || []));
                localStorage.setItem("barber_account", JSON.stringify(data.account || { balance: 0, logs: [] }));
                localStorage.setItem("barber_conf", JSON.stringify(data.conf || {}));

                // อัปเดตตัวแปร Global ใน App (ถ้ามี)
                if (typeof db !== 'undefined') db = data.db || [];
                if (typeof archives !== 'undefined') archives = data.archives || [];
                if (typeof account !== 'undefined') account = data.account || { balance: 0, logs: [] };
                if (typeof conf !== 'undefined') conf = data.conf || {};

                if (typeof Swal !== 'undefined') {
                    Swal.fire({ title: 'สำเร็จ', text: 'กำลังรีโหลดข้อมูล...', icon: 'success', showConfirmButton: false, timer: 1500 });
                }
                setTimeout(() => location.reload(), 1500);
            };

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'ยืนยันการนำเข้าข้อมูล',
                    text: "ข้อมูลปัจจุบันจะถูกแทนที่ด้วยข้อมูลจากไฟล์นี้",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'ยืนยัน',
                    cancelButtonText: 'ยกเลิก',
                    background: 'var(--card, #1e293b)',
                    color: 'var(--text, #f8fafc)'
                }).then((result) => {
                    if (result.isConfirmed) processImport();
                });
            } else {
                if (confirm("นำเข้าข้อมูล? ข้อมูลปัจจุบันจะถูกแทนที่ด้วยข้อมูลจากไฟล์นี้")) {
                    processImport();
                }
            }
        } catch(err) { 
            if (typeof Swal !== 'undefined') {
                Swal.fire({ title: 'ไฟล์ไม่ถูกต้อง', text: 'กรุณาใช้ไฟล์ .json ที่สำรองจากแอปนี้เท่านั้น', icon: 'error' });
            } else if (typeof notify === 'function') {
                notify("error", "กรุณาใช้ไฟล์ .json ที่สำรองจากแอปนี้เท่านั้น", "ไฟล์ไม่ถูกต้อง");
            }
        }
    };
    reader.readAsText(file);
}

// 3. ฟังก์ชันล้างข้อมูล (Clear Data)
function clearData() {
    const executeClear = () => {
        localStorage.removeItem("barber_db");
        localStorage.removeItem("barber_archives");
        localStorage.removeItem("barber_account");
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'ล้างข้อมูลสำเร็จ',
                icon: 'success',
                timer: 1000,
                showConfirmButton: false
            });
        }
        setTimeout(() => location.reload(), 1000);
    };

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'ล้างข้อมูลทั้งหมด?',
            text: "รายงานและบัญชีจะหายถาวร (ควรสำรองข้อมูลก่อน)",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ยืนยันลบข้อมูล',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) executeClear();
        });
    } else {
        if (confirm("ล้างข้อมูลทั้งหมด? รายงานและบัญชีจะหายถาวร")) {
            executeClear();
        }
    }
}
/* ========= SECTION 21: MODAL HELPERS ========= */
window.onclick = e => {
    if (e.target.classList.contains("modal")) e.target.style.display = "none";
};
function closeReportModal() { $("reportModal").style.display = "none"; }

/* ========= SECTION 22: SHARE LINE ========= */
function shareLine() {
    const dateEl = $("dateInp");
    if (!dateEl || !dateEl.value) {
        if (typeof Swal !== 'undefined') Swal.fire({ title: 'กรุณาเลือกวันที่', icon: 'warning' });
        return;
    }
    const dInp = dateEl.value;
    const today = db.filter(r => r.date === dInp);
    if (!today.length) {
        if (typeof Swal !== 'undefined') Swal.fire({ title: 'ไม่พบข้อมูล', text: 'วันที่เลือกไม่มีการบันทึกไว้', icon: 'info' });
        return;
    }
    const [y, m, d] = dInp.split('-');
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const fDate = `${parseInt(d)} ${months[parseInt(m)-1]} ${(parseInt(y)+543).toString().slice(-2)}`;
    const shopName = conf.shop || "Barber Shop";
    const perc = Number(conf.perc) || 0;
    const guar = Number(conf.guar) || 0;
    let tot = 0, cash = 0, trans = 0, tips = 0;
    let stats = {}, realCustomerCount = 0, newCount = 0, regCount = 0, giftCount = 0;
    const clientList = today.slice().sort((a,b)=>(a.time||'').localeCompare(b.time||'')).map((r,i)=>{
        const p = Number(r.price)||0, t = Number(r.tip)||0;
        const payType = String(r.pay||"").trim();
        let detailText = "", pIcon = '💵', displayPrice = p;
        if (['Free','Gift','ของขวัญ'].includes(payType)) { displayPrice=0; pIcon='🎁'; trans+=t; giftCount++; }
        else if (payType==='Free-Cash') { cash+=p; tot+=p; pIcon='🎁+💵'; giftCount++; }
        else if (payType==='Free-Trans') { trans+=(p+t); tot+=p; pIcon='🎁+📱'; giftCount++; }
        else if (payType==='Mix') { const pc=Number(r.payCash)||0, pt=Number(r.payTrans)||0; cash+=pc; trans+=pt; tot+=p; detailText=` (สด:${pc}/โอน:${pt})`; pIcon='🌓'; }
        else if (['Trans','โอน'].includes(payType)) { trans+=(p+t); tot+=p; pIcon='📱'; }
        else { cash+=p; tot+=p; }
        tips += t;
        if (!['GUARANTEE','HOLIDAY'].includes(String(r.type||'').toUpperCase())) {
            realCustomerCount++;
            const cType = String(r.custType||"").toLowerCase();
            if (cType==='new') newCount++; else if (cType==='regular') regCount++;
            (r.svcs||[]).forEach(s=>{if(s) stats[s]=(stats[s]||0)+1;});
        }
        const tShow = r.endTime ? `${r.time}-${r.endTime}` : r.time;
        const svcsText = Array.isArray(r.svcs) ? r.svcs.join('+') : '';
        return `${i+1}. [${tShow}] ${svcsText} = ${displayPrice}${t?` (+ทิป ${t})`:''}${detailText} ${pIcon}`;
    }).join('\n');
    let bEarn = Math.max(tot*(perc/100), guar) + tips;
    let shopEarn = tot - (bEarn - tips);
    let settle = cash - bEarn;
    let oldBalance = 0, periodText = "", hasOldBalance = false;
    if (typeof archives !== "undefined" && Array.isArray(archives)) {
        const pendingDays = archives.filter(day => day.date !== dInp && Number(day.settle) !== 0);
        if (pendingDays.length > 0) {
            hasOldBalance = true;
            oldBalance = pendingDays.reduce((sum,day)=>sum+(Number(-day.settle)||0),0);
            const fmt = iso=>{const p=iso.split('-');return `${parseInt(p[2])}/${parseInt(p[1])}`;};
            const yr = iso=>(parseInt(iso.split('-')[0])+543).toString().slice(-2);
            if (pendingDays.length===1) periodText = `${fmt(pendingDays[0].date)}/${yr(pendingDays[0].date)}`;
            else { const l=pendingDays.length-1; periodText = `${fmt(pendingDays[0].date)} - ${fmt(pendingDays[l].date)}/${yr(pendingDays[l].date)}`; }
        }
    }
    let todayDiff = -settle, finalNet = oldBalance + todayDiff;
    let msg = `💈 รายงานร้าน: ${shopName}\n📅 วันที่: ${fDate}\n-------------------------\n👤 ลูกค้าทั้งหมด: ${realCustomerCount} คน${newCount||regCount?`\n ใหม่:${newCount} | ประจำ:${regCount}`:''}\n-------------------------\n${clientList}\n-------------------------\n💰 ยอด: ${tot.toLocaleString()} | 🧧 ทิปโอน: ${tips.toLocaleString()}\n📱 โอน: ${trans.toLocaleString()} | 💵 เงินสด: ${cash.toLocaleString()}${giftCount?` | 🎁: ${giftCount}`:''}\n🤵 ช่าง: ${Math.floor(bEarn).toLocaleString()}\n🏠 ร้าน: ${Math.floor(shopEarn).toLocaleString()}\n-------------------------\n`;
    if (hasOldBalance && oldBalance !== 0) {
        msg += settle>0?`🟧 ช่างคืนร้าน: ${Math.abs(Math.floor(settle)).toLocaleString()} บาท\n`:`🟦 ร้านคืนช่าง: ${Math.abs(Math.floor(settle)).toLocaleString()} บาท\n`;
        msg += `-------------------------\n🚨 สถานะบัญชี\nวันที่ ${periodText}: ${oldBalance>0?'ร้านค้าง':'ช่างค้าง'} ${Math.abs(oldBalance).toLocaleString()} บาท\n(${Math.abs(oldBalance)} ${todayDiff>=0?'+':'-'} ${Math.abs(Math.floor(todayDiff)).toLocaleString()}) = ${Math.abs(Math.floor(finalNet)).toLocaleString()}\n\n`;
        msg += finalNet>0?`📌 🟦 ยอดสุทธิ: ร้านคืนช่าง ${Math.abs(Math.floor(finalNet)).toLocaleString()} บาท`:`📌 🟧 ยอดสุทธิ: ช่างคืนร้าน ${Math.abs(Math.floor(finalNet)).toLocaleString()} บาท`;
    } else {
        msg += settle>0?`🟧 ช่างคืนร้าน: ${Math.abs(Math.floor(settle)).toLocaleString()} บาท`:(settle<0?`🟦 ร้านคืนช่าง: ${Math.abs(Math.floor(settle)).toLocaleString()} บาท`:`✅ ยอดลงตัวพอดี`);
    }
    const msgEdit = $("msgEdit"), previewArea = $("linePreview");
    if (msgEdit && previewArea) { msgEdit.value = msg; previewArea.style.display = "flex"; }
    else { window.open(`https://line.me/R/msg/text/?${encodeURIComponent(msg)}`, '_blank'); }
}
function sendToLineFinal() {
    const msgEdit = $("msgEdit"), previewArea = $("linePreview");
    if (!msgEdit || !msgEdit.value.trim()) {
        if (typeof Swal !== 'undefined') Swal.fire({ title:'ไม่พบข้อความ', text:'กรุณาตรวจสอบข้อความก่อนส่ง', icon:'warning' });
        return;
    }
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(msgEdit.value)}`, '_blank');
    if (previewArea) previewArea.style.display = "none";
}
function closeLineModal() { const m=$("lineModal"); if(m)m.style.display="none"; }

/* ========= ✅ INITIALIZE — โหลดค่าเริ่มต้นเมื่อเปิดหน้า ========= */
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toISOString().split('T')[0];
    
    // ตั้งค่าวันที่ปัจจุบัน
    if ($("dateInp")) { $("dateInp").value = today; updateDateDisplay(today); }
    if ($("accDate")) $("accDate").value = today;
    
    // ตั้งค่าชื่อร้านและธีม
    applyTheme(conf.theme);
    const entryShop = $("entryShopName");
    if (entryShop) entryShop.innerText = conf.shop;
    
    // ตั้งค่าเวลาปัจจุบัน
    const now = new Date();
    const curTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    if ($("tStart")) $("tStart").value = curTime;
    if ($("tEnd")) $("tEnd").value = curTime;
    
    // โหลดข้อมูลหน้าแรก
    renderDay(today);
    loadAccountStatus();
    
    // ✅ เปิดหน้าแรกเมื่อโหลดเสร็จ
    goSub(1);

    // 🔄 อัปเดตชื่อร้านทุกจุดที่แสดง
    const shopNameElements = document.querySelectorAll('.shop-name-display');
    shopNameElements.forEach(el => {
        el.innerText = conf.shop;
    });

    // 📅 ตั้งค่าช่วงเดือนเริ่มต้นสำหรับรายงาน
    const nowDate = new Date();
    const currentMonth = `${nowDate.getFullYear()}-${(nowDate.getMonth() + 1).toString().padStart(2, '0')}`;
    if ($("histMonth")) {
        $("histMonth").value = currentMonth;
    }

    // 🎯 ตั้งค่าปี-เดือนเริ่มต้นสำหรับเปรียบเทียบ
    if ($("compMonth1")) {
        const lastMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1);
        $("compMonth1").value = `${lastMonth.getFullYear()}-${(lastMonth.getMonth() + 1).toString().padStart(2, '0')}`;
    }
    if ($("compMonth2")) {
        $("compMonth2").value = currentMonth;
    }

    // 🔊 ตั้งค่าสถานะเสียงตามค่าที่บันทึกไว้
    if (conf.sound === "off") {
        document.body.classList.add("muted");
    } else {
        document.body.classList.remove("muted");
    }

    // 📱 ปรับการแสดงผลบนมือถือ
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
    }

    // 🔄 [เพิ่มใหม่] ผูก Event เปลี่ยนเดือนในหน้ารายงานให้คำนวณและอัปเดตตารางทันที
    const monthlyPicker = document.getElementById('monthlyReportPicker') || document.getElementById('histMonth');
    if (monthlyPicker) {
        monthlyPicker.addEventListener('change', function(e) {
            const selectedMonth = e.target.value;
            
            const mainPicker = document.getElementById('histMonth');
            if (mainPicker && mainPicker !== monthlyPicker) {
                mainPicker.value = selectedMonth;
            }
            
            if (typeof loadHistMonth === 'function') loadHistMonth();
            if (typeof renderDailyTableReport === 'function') renderDailyTableReport();
        });
    }

    // ✅ ซ่อนหน้าโหลด / แสดงเนื้อหาหลัก
    const loadingScreen = document.getElementById("loadingScreen");
    if (loadingScreen) {
        loadingScreen.style.display = "none";
    }

    // ✅ แจ้งเวอร์ชันและเวลาอัปเดต
    console.log(`✅ Barber-Note v${APP_VERSION} โหลดสมบูรณ์ — ${LAST_UPDATED}`);
});
/* ========= END OF SCRIPT — สิ้นสุดโค้ดทั้งหมด ========= */
