/* ==========================================================
   Barber-Note v1.0.7 — FULL COMPLETE VERSION
   ========================================================== */

/* ========= SECTION 1: GLOBAL VARIABLES ========= */
const $ = id => document.getElementById(id);
const APP_VERSION = "1.0.7";
const LAST_UPDATED = "27/03/2026";

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

/* ========= SECTION 2: AUTO-UPDATE ========= */
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

/* ========= SECTION 3: PAGE NAVIGATION — ส่วนสำคัญที่ทำให้ปุ่มกดได้ ========= */
function go(p) {
    // ซ่อนทุกหน้า
    document.querySelectorAll('.page').forEach(pg => { 
        pg.classList.remove('active'); 
        pg.style.display = 'none'; 
    });
    
    // แสดงหน้าที่เลือก
    const targetPage = $(`p${p}`);
    if (targetPage) { 
        targetPage.classList.add('active'); 
        targetPage.style.display = 'block'; 
    }
    
    // อัปเดตสถานะปุ่มเมนู
    document.querySelectorAll('.nav-item').forEach((btn, i) => {
        const isSelected = (i + 1) === p;
        btn.classList.toggle('active', isSelected);
        btn.style.color = isSelected ? 'var(--accent)' : 'var(--text)';
        btn.style.opacity = isSelected ? '1' : '0.5';
    });
    
    // อัปเดตชื่อร้าน
    const savedShopName = localStorage.getItem("shopName") || "BARBER SHOP";
    const shopTitleEl = document.querySelector('h2');
    if (shopTitleEl) shopTitleEl.innerText = savedShopName;
    
    // โหลดข้อมูลเฉพาะหน้า
    const dateInpValue = $("dateInp")?.value || new Date().toISOString().split('T')[0];
    if (p === 2 && typeof renderDay === 'function') renderDay(dateInpValue);
    if (p === 3) {
        if ($("accDate") && $("dateInp")) $("accDate").value = $("dateInp").value;
        if (typeof loadAccountStatus === 'function') loadAccountStatus();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ========= SECTION 4: DATE DISPLAY ========= */
function updateDateDisplay(v) {
    if (!v) return;
    const [y, m, d] = v.split('-');
    const thaiYearFull = parseInt(y) + 543;
    const thaiYearShort = thaiYearFull.toString().slice(-2);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const formattedDate = `${parseInt(d)} ${months[parseInt(m)-1]} ${thaiYearShort}`;
    const el = $("dateDisplay");
    if (el) el.innerText = formattedDate;
    if (typeof renderDay === "function") renderDay(v);
}

/* ========= SECTION 5: SAVE DATA ========= */
function saveDB() {
    try {
        localStorage.setItem("barber_db", JSON.stringify(db));
        localStorage.setItem("barber_archives", JSON.stringify(archives));
        localStorage.setItem("barber_account", JSON.stringify(account));
        localStorage.setItem("barber_conf", JSON.stringify(conf));
        return true;
    } catch (e) { console.error("❌ บันทึกไม่ได้:", e); return false; }
}

/* ========= SECTION 6: NOTIFY & SOUND ========= */
function speak(type) {
    if (conf.sound === "off") return;
    const isMan = conf.voice === "male";
    const audioId = (type === "success") 
        ? (isMan ? "successSoundMan" : "successSoundWoman")
        : (isMan ? "errorSoundMan" : "errorSoundWoman");
    const audio = $(audioId);
    if (audio) { audio.pause(); audio.currentTime = 0; audio.play().catch(()=>{}); }
}
function notify(type, title, text = "") {
    speak(type);
    if (typeof Swal === 'undefined') { alert(`${title}\n${text}`); return; }
    Swal.fire({ 
        icon: type, title, text, timer: 2200, showConfirmButton: false,
        timerProgressBar: true, background: 'var(--card)', color: 'var(--text)',
        iconColor: type === 'success' ? 'var(--success)' : 'var(--danger)'
    });
}

/* ========= SECTION 7: PAYMENT TYPE ========= */
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

/* ========= SECTION 8: SAVE RECORD ========= */
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

    // รีเซ็ตฟอร์ม
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

/* ========= SECTION 9: RENDER DAILY REPORT ========= */
function renderDay(selectedDate) {
    const dInp = selectedDate || ($("dateInp")?.value || new Date().toISOString().split('T')[0]);
    if ($("dateInp")) $("dateInp").value = dInp;

    // แปลงวันที่ + ชื่อวัน (พุทธศักราช)
    const days = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    const dayName = days[new Date(dInp).getDay()];
    const dateParts = dInp.split('-');
    let displayDateBE = dInp;
    if (dateParts.length === 3) {
        const d = dateParts[2];
        const m = dateParts[1];
        const yBE = parseInt(dateParts[0]) + 543;
        displayDateBE = `${d}/${m}/${yBE}`;
    }

    let allRec = db.filter(r => r.date === dInp);
    if (typeof archives !== 'undefined') {
        const archived = archives.find(a => a.date === dInp);
        if (archived?.details) allRec = archived.details;
    }
    const isHoliday = allRec.some(r => r.type === "HOLIDAY");

    // คำนวณยอด
    let tot = 0, trans = 0, cash = 0, tips = 0;
    let realCustomerCount = 0;
    let listHtml = "";

    allRec.slice().sort((a, b) => (a.time || "").localeCompare(b.time || "")).forEach((r, i) => {
        const p = Number(r.price) || 0;
        const t = Number(r.tip) || 0;
        tot += p;
        tips += t;

        // แยกประเภทการจ่าย
        if (/Trans|โอน/i.test(r.pay)) {
            trans += p + t;
        } else if (/Mix/i.test(r.pay)) {
            cash += Number(r.payCash) || 0;
            trans += Number(r.payTrans) || 0;
        } else if (!/Free/i.test(r.pay)) {
            cash += p + t;
        }

        // นับลูกค้า
        if (!/HOLIDAY|GUARANTEE|Free/i.test(r.type || r.pay)) {
            const svcs = Array.isArray(r.svcs) ? r.svcs : [];
            if (svcs.length > 0) realCustomerCount++;
        }

        // แสดงรายการ
        const timeShow = r.endTime ? `${r.time}-${r.endTime}` : r.time;
        const svcs = Array.isArray(r.svcs) ? r.svcs.join(' + ') : r.svcs;
        const payIcon = /Trans|โอน/i.test(r.pay) ? '📱' : '💵';
        listHtml += `
        <div style="padding:12px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center;">
            <div><b>${i+1}. ${timeShow} | ${svcs || '-'}</b><br><small>${payIcon} ${r.pay} | ฿${p}${t ? ` + ทิป฿${t}` : ''}</small></div>
            <button onclick="delRec(${r.id})" style="border:none;background:#fee2e2;color:#dc2626;border-radius:8px;padding:4px 8px;cursor:pointer;">ลบ</button>
        </div>`;
    });

    // คำนวณส่วนแบ่ง
    const bEarn = isHoliday ? 0 : Math.max(tot * (conf.perc / 100), conf.guar) + tips;
    const sEarn = isHoliday ? 0 : tot - (bEarn - tips);
    const settle = isHoliday ? 0 : cash - bEarn;

    // อัปเดตค่าบนหน้าจอ
    if ($("dTotal")) $("dTotal").innerText = tot.toLocaleString();
    if ($("dTrans")) $("dTrans").innerText = trans.toLocaleString();
    if ($("dCash")) $("dCash").innerText = cash.toLocaleString();
    if ($("dBarber")) $("dBarber").innerText = Math.floor(bEarn).toLocaleString();
    if ($("dShop")) $("dShop").innerText = Math.floor(sEarn).toLocaleString();
    if ($("dCounts")) {
        if (isHoliday) {
            $("dCounts").innerHTML = "🏖️ วันหยุด";
        } else if (allRec.length === 0) {
            $("dCounts").innerHTML = "ไม่มีข้อมูล";
        } else {
            $("dCounts").innerText = `ลูกค้า ${realCustomerCount} คน`;
        }
    }

    // === แถบสถานะ + ปุ่มส่งงาน ส่วนบน ===
    let statusText = "", statusColor = "", icon = "";
    if (isHoliday) {
        statusText = "วันหยุด"; statusColor = "#1e40af"; icon = "🏖️";
    } else if (allRec.length === 0) {
        statusText = "รอข้อมูล..."; statusColor = "#64748b"; icon = "📝";
    } else if (settle > 0) {
        statusText = `ช่างคืนร้าน ฿${Math.floor(settle).toLocaleString()}`; statusColor = "#b91c1c"; icon = "🥷";
    } else if (settle < 0) {
        statusText = `ร้านคืนช่าง ฿${Math.floor(Math.abs(settle)).toLocaleString()}`; statusColor = "#4338ca"; icon = "🏠";
    } else {
        statusText = "ยอดพอดี"; statusColor = "#15803d"; icon = "✅";
    }

    const settleBar = $("settleBarContainer") || $("settleBar");
    if (settleBar) {
        settleBar.style.display = "flex";
        settleBar.style.gap = "10px";
        settleBar.style.marginBottom = "18px";
        settleBar.innerHTML = `
            <div id="settleBar" style="flex:8; height:55px; background:rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; border-radius:18px; font-weight:800; font-size:14px; color:${statusColor}; border:1px solid var(--border);">
                <span style="margin-right:8px; font-size:18px;">${icon}</span> ${statusText}
            </div>
            <button onclick="saveAndGo('${dInp}', ${tot})" 
                style="flex:2.2; height:55px; background:#ff7a00; color:#fff; border-radius:18px; border:none; font-size:22px; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                ➤
            </button>`;
    }

    // === แถบวันที่ + ปุ่มลบ + ปุ่มส่งไลน์ ส่วนล่าง ===
    const dList = $("dailyList");
    if (dList) {
        dList.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 12px; background: rgba(255,255,255,0.08); border-radius: 16px; box-sizing: border-box; margin-bottom: 15px;">
                <span style="font-size: 15px; font-weight: 600; color: var(--text); white-space: nowrap;">รายงานวันที่</span>
                <div style="position: relative; flex:1; padding: 10px 12px; border-radius: 10px; background: rgba(37,99,235,0.2); display: flex; align-items: center; justify-content: center; cursor: pointer; min-width: 140px;">
                    <span style="font-size: 15px; font-weight: 700; color: #93c5fd;">${dayName} ${displayDateBE}</span>
                    <input type="date" value="${dInp}" onchange="renderDay(this.value)" style="position:absolute; opacity:0; width:100%; height:100%; cursor:pointer;">
                </div>
                <button onclick="deleteArchiveDate('${dInp}')" title="ลบข้อมูลวันนี้" 
                    style="width: 44px; height: 44px; border-radius: 10px; border: none; background: #fee2e2; color: #dc2626; font-size: 18px; cursor: pointer;">🗑️</button>
                <button onclick="shareLine()" 
                    style="width: 60px; height: 44px; border-radius: 10px; border: none; background: #00c300; color: white; font-size: 13px; font-weight: 700; cursor: pointer;">LINE</button>
            </div>
            <div style="padding: 0 5px;">
                ${isHoliday ? `<center style='padding:30px; color:#64748b;'>🏖️ วันหยุด (${dayName} ${displayDateBE})</center>` : (listHtml || "<center style='padding:30px; color:#94a3b8;'>ไม่มีข้อมูล</center>")}
            </div>
        `;
    }
}

/* ========= SECTION 10: DELETE RECORD ========= */
function delRec(id) {
    if (confirm("ลบรายการนี้?")) { db = db.filter(r => r.id !== id); saveDB(); renderDay(); }
}

/* ========= SECTION 11: SAVE & CLOSE DAY ========= */
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

/* ========= SECTION 12: ACCOUNT STATUS ========= */
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

/* ========= SECTION 13: CLEAR ACCOUNT & HISTORY ========= */
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

/* ========= SECTION 14: HOLIDAY & INSURANCE ========= */
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

/* ========= SECTION 15: SETTINGS & THEME ========= */
function openSettings() { 
    if ($("setShop")) $("setShop").value = conf.shop;
    if ($("setPerc")) $("setPerc").value = conf.perc;
    if ($("setGuar")) $("setGuar").value = conf.guar;
    if ($("setTheme")) $("setTheme").value = conf.theme;
    if ($("setSound")) $("setSound").value = conf.sound;
    if ($("setVoice")) $("setVoice").value = conf.voice;
    $("modalSet").style.display = "flex"; 
}
function closeReportModal() { $("reportModal").style.display = "none"; }

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
    document.querySelector("h2").innerText = conf.shop;
    applyTheme(conf.theme);
    $("modalSet").style.display = "none";
    notify("success", "บันทึกสำเร็จ", "ตั้งค่าถูกบันทึกแล้ว");
}

/* ========= SECTION 16: MONTHLY & EXPORT ========= */
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
    XLSX.writeFile(XLSX.utils.book_new(), `สรุป-${name}.xlsx`);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "สรุป");
    XLSX.writeFile(wb, `สรุป-${name}.xlsx`);
    notify("success", "สำเร็จ", "ดาวน์โหลดเรียบร้อย");
}

/* ========= SECTION 17: IMPORT / EXPORT / CLEAR ========= */
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

/* ========= SECTION 18: MODAL HELPERS ========= */
window.onclick = e => {
    if (e.target.classList.contains("modal")) e.target.style.display = "none";
};

/* ========= ✅ SECTION 19: INITIALIZE — ส่วนสำคัญ โหลดค่าเริ่มต้น ========= */
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toISOString().split('T')[0];
    
    // ตั้งค่าวันที่ปัจจุบัน
    if ($("dateInp")) { $("dateInp").value = today; updateDateDisplay(today); }
    if ($("accDate")) $("accDate").value = today;
    
    // ตั้งค่าชื่อร้านและธีม
    document.querySelector("h2").innerText = conf.shop;
    applyTheme(conf.theme);
    
    // ตั้งค่าเวลาปัจจุบัน
    const now = new Date();
    const curTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    if ($("tStart")) $("tStart").value = curTime;
    if ($("tEnd")) $("tEnd").value = curTime;
    
    // โหลดข้อมูลหน้าแรก
    renderDay(today);
    loadAccountStatus();
    
    // ✅ ตั้งค่าเริ่มต้นให้แสดงหน้าแรก
    go(1);
});
