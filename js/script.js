/* ==========================================================
   Barber-Note v1.1.0 — FULL VERSION + NEW NAVIGATION
   ========================================================== */
/* ========= SECTION 1: GLOBAL VARIABLES ========= */
const $ = id => document.getElementById(id);
const APP_VERSION = "1.1.0";
const LAST_UPDATED = "07/09/2026";
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

/* ========= SECTION 2: NEW NAVIGATION SYSTEM — สลับหน้าหลัก ========= */
// ✅ สลับแท็บ → ป้องกัน Uncaught Error และจัดการ Event Target อย่างถูกต้อง
function switchSummaryTab(tabId, evt) {
    // ซ่อนหน้าต่างตั้งค่าเมื่อสลับแท็บ (ไม่ให้เด้งเอง)
    const modal = document.getElementById('modalSet');
    if (modal) modal.style.display = 'none';

    // ตรวจสอบว่ามี Element ปลายทางหรือไม่ก่อนสั่งงาน
    const targetTab = document.getElementById(tabId);
    if (!targetTab) {
        console.warn('ไม่พบ Element ID:', tabId);
        return;
    }

    // ลบ class active เดิมออก
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    // เปิดใช้งานแท็บเป้าหมาย
    targetTab.classList.add('active');

    // จัดการ Event และ Active State ของปุ่ม
    const currentEvent = evt || window.event;
    if (currentEvent && currentEvent.currentTarget) {
        currentEvent.currentTarget.classList.add('active');
    } else if (currentEvent && currentEvent.target) {
        const btn = currentEvent.target.closest('.tab-btn');
        if (btn) btn.classList.add('active');
    }

    // ควบคุมเมนูล่าง
    const hideTabs = ['tabDaily', 'tabMonth', 'tabAnalytics'];
    const nav1 = document.getElementById('nav1');
    const nav2 = document.getElementById('nav2');
    const nav3 = document.getElementById('nav3');
    const bottomNav = document.querySelector('.bottom-nav');

    if (hideTabs.includes(tabId)) {
        if (nav1) nav1.style.display = 'none';
        if (nav2) nav2.style.display = 'none';
        if (nav3) nav3.style.display = 'none';
        if (bottomNav) bottomNav.style.gridTemplateColumns = '1fr';
    } else {
        if (nav1) nav1.style.display = 'flex';
        if (nav2) nav2.style.display = 'flex';
        if (nav3) nav3.style.display = 'flex';
        if (bottomNav) bottomNav.style.gridTemplateColumns = 'repeat(4, 1fr)';
    }
}

// ✅ สลับหน้าย่อย → แสดงเมนูครบ 4 ปุ่มเสมอ
const originalGoSub = typeof goSub === 'function' ? goSub : null;
window.goSub = function(num) {
    if (originalGoSub) originalGoSub(num);
    if (typeof updateNavDisplay === 'function') updateNavDisplay('sub' + num);
};

// ✅ สลับหน้าหลัก → แสดงเมนูครบ 4 ปุ่มเสมอ
const originalSwitchMain = typeof switchMainView === 'function' ? switchMainView : null;
window.switchMainView = function(viewName) {
    if (originalSwitchMain) originalSwitchMain(viewName);
    if (typeof updateNavDisplay === 'function') updateNavDisplay(viewName);
};

/* ========= SECTION 3: SUB-PAGE NAVIGATION — สลับหน้าย่อยบันทึก/รายงาน/บัญชี ========= */
function goSub(num) {
    // ซ่อนทุกหน้าย่อย
    document.querySelectorAll('.sub-page').forEach(page => {
        page.classList.remove('active');
    });
    // ปรับสถานะเมนู
    document.querySelectorAll('.bottom-nav .nav-item').forEach(nav => {
        nav.classList.remove('active');
    });

    // แสดงหน้าที่เลือก
    const target = document.getElementById('p' + num);
    if (target) target.classList.add('active');
    
    const nav = document.getElementById('nav' + num);
    if (nav) nav.classList.add('active');

    // โหลดข้อมูลหน้าที่เปิด
    const dateInput = document.getElementById("dateInp");
    const dInp = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];

    if (num === 2 && typeof renderDay === 'function') renderDay(dInp);
    if (num === 3) {
        const accDate = document.getElementById("accDate");
        if (accDate && dateInput) accDate.value = dateInput.value;
        if (typeof loadAccountStatus === 'function') loadAccountStatus();
    }
}
/* ========= SECTION 4: SUMMARY TABS — สลับแท็บสรุปเดือน/วิเคราะห์ ========= */
// ✅ สลับแท็บหน้าสรุป — รองรับ 3 แท็บ เต็มรูปแบบ
function switchSummaryTab(tabId) {     
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));     
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));     
    document.getElementById(tabId).classList.add('active');     
    event.target.classList.add('active'); 
}

/* ========= SECTION 5: AUTO-UPDATE ========= */
(function autoUpdate() {
    const currentStoredVersion = localStorage.getItem("app_v");
    if (currentStoredVersion !== APP_VERSION) {
        localStorage.setItem("app_v", APP_VERSION);
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            }).then(() => window.location.replace(window.location.href));
        } else {
            window.location.replace(window.location.href);
        }
    }
})();

/* ========= SECTION 6: DATE DISPLAY ========= */
function updateDateDisplay(v) {
    if (!v) return;
    const [y, m, d] = v.split('-');
    const thaiYearFull = parseInt(y) + 543;
    const thaiYearShort = thaiYearFull.toString().slice(-2);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const days = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
    const dayName = days[new Date(v + 'T00:00:00').getDay()].substring(0,2);
    const formattedDate = `${parseInt(d)} ${months[parseInt(m)-1]} ${thaiYearShort} (${dayName})`;
    const el = $("dateDisplay");
    if (el) el.innerText = formattedDate;
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
    const lastArchive = archives.sort((a,b) => b.date.localeCompare(a.date))[0];
    const todayArchive = archives.find(a => a.date === today);
    const bal = account.balance || 0;
    const totalBal = bal + (todayArchive ? todayArchive.settle : 0);
    if ($("accOldVal")) $("accOldVal").innerText = `฿${bal.toLocaleString()}`;
    if ($("accDateLabel")) $("accDateLabel").innerText = lastArchive ? lastArchive.date : "ยังไม่มีข้อมูล";
    if ($("accTodayVal")) $("accTodayVal").innerText = todayArchive ? `฿${todayArchive.settle.toLocaleString()}` : "฿0";
    if ($("accTotalVal")) $("accTotalVal").innerText = `฿${totalBal.toLocaleString()}`;
    if ($("accLight")) $("accLight").style.background = totalBal >= 0 ? "#22c55e" : "#ef4444";
    if ($("statusBadge")) {
        if (totalBal > 0) { $("statusBadge").innerText = "ร้านคืนช่าง"; $("statusBadge").style.background = "#dbeafe"; $("statusBadge").style.color = "#1d4ed8"; }
        else if (totalBal < 0) { $("statusBadge").innerText = "ช่างคืนร้าน"; $("statusBadge").style.background = "#fee2e2"; $("statusBadge").style.color = "#dc2626"; }
        else { $("statusBadge").innerText = "ยอดพอดี"; $("statusBadge").style.background = "#dcfce7"; $("statusBadge").style.color = "#16a34a"; }
    }
}

/* ========= SECTION 15: CLEAR ACCOUNT & HISTORY ========= */
async function clearAccount() {
    const date = $("accDate")?.value || new Date().toISOString().split('T')[0];
    const note = $("accNote")?.value || "เคลียร์ยอด";
    const { isConfirmed } = await Swal.fire({
        title: "ยืนยันเคลียร์เงิน", text: `ยืนยัน ณ วันที่ ${date} ?`, icon: "question",
        showCancelButton: true, confirmButtonText: "ยืนยัน", cancelButtonText: "ยกเลิก"
    });
    if (!isConfirmed) return;
    account.logs.unshift({ date, balance: account.balance, note });
    account.balance = 0;
    saveDB();
    notify("success", "สำเร็จ", "เคลียร์ยอดเรียบร้อย");
    loadAccountStatus();
}
function openHistoryModal() {
    const list = $("accHistory");
    list.innerHTML = account.logs.length === 0 ? "<center style='padding:20px;color:#94a3b8'>ยังไม่มีประวัติ</center>"
        : account.logs.map(l => `<div style="padding:10px;border-bottom:1px solid #eee;"><b>${l.date}</b> | ${l.note}<br><span style="color:${l.balance>=0?'#22c55e':'#ef4444'}">฿${l.balance.toLocaleString()}</span></div>`).join("");
    $("historyModal").style.display = "flex";
}
function closeHistoryModal() { $("historyModal").style.display = "none"; }

/* ========= SECTION 16: HOLIDAY & INSURANCE ========= */
function handleHoliday() {
    const date = $("dateInp")?.value || new Date().toISOString().split('T')[0];
    if (db.some(r => r.date === date && r.type === "HOLIDAY")) return notify("error", "แจ้งเตือน", "วันนี้บันทึกวันหยุดไปแล้ว");
    db.push({ id: Date.now(), date, type: "HOLIDAY" });
    saveDB();
    notify("success", "สำเร็จ", "บันทึกวันหยุดเรียบร้อย");
    renderDay(date);
}
function handleInsurance() {
    const date = $("dateInp")?.value || new Date().toISOString().split('T')[0];
    const total = db.filter(r => r.date === date).reduce((s,r)=>s+(r.price||0),0);
    if (total >= conf.guar) return notify("success", "ไม่ต้องใช้สิทธิ", `ยอด ฿${total} ≥ หลักประกัน ฿${conf.guar}`);
    const short = conf.guar - total;
    db.push({ id: Date.now(), date, type: "GUARANTEE_CLAIM", price: short });
    saveDB();
    notify("success", "ใช้สิทธิสำเร็จ", `ขอเพิ่ม ฿${short}`);
    renderDay(date);
}

/* ========= SECTION 17: SETTINGS & THEME ========= */
function openSettings() { 
    if ($("setShop")) $("setShop").value = conf.shop;
    if ($("setPerc")) $("setPerc").value = conf.perc;
    if ($("setGuar")) $("setGuar").value = conf.guar;
    if ($("setTheme")) $("setTheme").value = conf.theme;
    if ($("setSound")) $("setSound").value = conf.sound;
    if ($("setVoice")) $("setVoice").value = conf.voice;
    $("modalSet").style.display = "flex"; 
}
function applyTheme(t) {
    document.body.classList.remove("navy", "vintage");
    if (t === "navy") document.body.classList.add("navy");
    else if (t === "vintage") document.body.classList.add("vintage");
    conf.theme = t; localStorage.setItem("shopTheme", t);
}
function saveSettings() {
    conf.shop = $("setShop")?.value || "Barber Shop";
    conf.perc = parseFloat($("setPerc")?.value) || 50;
    conf.guar = parseFloat($("setGuar")?.value) || 0;
    conf.theme = $("setTheme")?.value || "light";
    conf.sound = $("setSound")?.value || "on";
    conf.voice = $("setVoice")?.value || "female";
    localStorage.setItem("shopName", conf.shop);
    localStorage.setItem("shopPerc", conf.perc);
    localStorage.setItem("shopGuar", conf.guar);
    saveDB();
    applyTheme(conf.theme);
    $("modalSet").style.display = "none";
    notify("success", "บันทึกสำเร็จ", "ตั้งค่าถูกบันทึกแล้ว");
}

/* ========= SECTION 18: MONTHLY SUMMARY & EXCEL EXPORT ========= */
function loadHistMonth() {
    const v = $("histMonth")?.value; if (!v) return;
    const [y, m] = v.split('-');
    const name = new Date(y, m-1, 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
    const list = archives.filter(a => a.date?.startsWith(`${y}-${m.padStart(2,'0')}`));
    if (!list.length) return notify("error", "ไม่พบข้อมูล", name);
    const total = list.reduce((s,a)=>s+(a.total||0),0);
    const cash = list.reduce((s,a)=>s+(a.cash||0),0);
    const barber = list.reduce((s,a)=>s+(a.barber||0),0);
    const settle = list.reduce((s,a)=>s+(a.settle||0),0);
    $("reportTitle").innerText = `📊 สรุป ${name}`;
    $("reportContent").innerHTML = `ยอดรวม: ฿${total.toLocaleString()}<br>เงินสด: ฿${cash.toLocaleString()}<br>ส่วนช่าง: ฿${barber.toLocaleString()}<br>ยอดค้าง: ฿${settle.toLocaleString()}`;
    $("reportModal").style.display = "flex";
}
function exportToExcel(monthValue) {
    if (!monthValue || typeof XLSX === 'undefined') return;
    const [y, m] = monthValue.split('-');
    const name = new Date(y, m-1, 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
    const list = archives.filter(a => a.date?.startsWith(`${y}-${m.padStart(2,'0')}`));
    if (!list.length) return notify("error", "ไม่พบข้อมูล", name);
    const rows = [["วันที่", "ยอด", "สด", "ช่าง", "ค้าง"]];
    list.forEach(a => rows.push([a.date, a.total, a.cash, a.barber, a.settle]));
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "สรุป");
    XLSX.writeFile(wb, `สรุป-${name}.xlsx`);
    notify("success", "สำเร็จ", "ดาวน์โหลดเรียบร้อย");
}
function exportMonthlyExcel() {
    notify("info", "กำลังพัฒนา", "ฟังก์ชันส่งออกตารางรายวันจะเพิ่มเร็วๆ นี้");
}

/* ========= SECTION 19: GOOGLE SHEETS & COMPARISON ========= */
function handleGoogleSheet() {
    window.open("https://docs.google.com/spreadsheets", "_blank");
}
function openComparisonSelector() {
    notify("info", "กำลังพัฒนา", "ฟังก์ชันเปรียบเทียบจะเพิ่มเร็วๆ นี้");
}

/* ========= SECTION 20: IMPORT / EXPORT / CLEAR ========= */
function exportBackup() {
    const backup = { db, archives, account, conf, exported: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
    notify("success", "สำเร็จ", "สำรองข้อมูลเรียบร้อย");
}
function importBackup(input) {
    const f = input.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.db || !data.archives || !data.account || !data.conf) throw "Invalid";
            db = data.db; archives = data.archives; account = data.account; conf = data.conf;
            saveDB(); location.reload();
        } catch { notify("error", "ไฟล์ไม่ถูกต้อง"); }
    };
    reader.readAsText(f);
}
async function clearData() {
    const { isConfirmed } = await Swal.fire({
        title: "⚠️ ล้างข้อมูลทั้งหมด", text: "แน่ใจหรือไม่?", icon: "warning",
        showCancelButton: true, confirmButtonColor: "#ef4444"
    });
    if (isConfirmed) { localStorage.clear(); location.reload(); }
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

    // ✅ ซ่อนหน้าโหลด / แสดงเนื้อหาหลัก
    const loadingScreen = document.getElementById("loadingScreen");
    if (loadingScreen) {
        loadingScreen.style.display = "none";
    }

    // ✅ แจ้งเวอร์ชันและเวลาอัปเดต
    console.log(`✅ Barber-Note v${APP_VERSION} โหลดสมบูรณ์ — ${LAST_UPDATED}`);
});
/* ========= END OF SCRIPT — สิ้นสุดโค้ดทั้งหมด ========= */
