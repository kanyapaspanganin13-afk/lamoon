/* ==========================================================
   Barber-Note v1.0.7 — SEPARATED VERSION
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
    voice: localStorage.getItem("shopVoice") || "default.mp3",
    sound: localStorage.getItem("shopSound") || "on"
};
let payMethod = "";
let selectedServices = [];

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

/* ========= SECTION 3: PAGE NAVIGATION ========= */
function go(p) {
    document.querySelectorAll('.page').forEach(pg => { pg.classList.remove('active'); pg.style.display = 'none'; });
    const targetPage = $(`p${p}`);
    if (targetPage) { targetPage.classList.add('active'); targetPage.style.display = 'block'; }
    
    document.querySelectorAll('.nav-item').forEach((btn, i) => {
        const isSelected = (i + 1) === p;
        btn.classList.toggle('active', isSelected);
        btn.style.color = isSelected ? 'var(--accent)' : 'var(--text)';
        btn.style.opacity = isSelected ? '1' : '0.5';
    });
    
    const savedShopName = localStorage.getItem("shopName") || "BARBER SHOP";
    const shopTitleEl = document.querySelector('h2');
    if (shopTitleEl) shopTitleEl.innerText = savedShopName;
    
    const dateInpValue = $("dateInp")?.value || new Date().toISOString().split('T')[0];
    if (p === 2) {
        if (typeof renderDay === 'function') renderDay(dateInpValue);
    }
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
    if (typeof conf === 'undefined' || conf.sound === "off") return;
    const isMan = conf.voice === "male" || conf.voice === "default.mp3";
    const audioId = (type === "success") 
        ? (isMan ? "successSoundMan" : "successSoundWoman")
        : (isMan ? "errorSoundMan" : "errorSoundWoman");
    const audio = $(audioId);
    if (audio) { audio.pause(); audio.currentTime = 0; audio.play().catch(()=>{}); }
}
function notify(type, title, text = "") {
    speak(type);
    if (typeof Swal === 'undefined') { alert(`${title}\n${text}`); return; }
    Swal.fire({ icon: type, title, text, timer: 2200, showConfirmButton: false,
        timerProgressBar: true, background: 'var(--card)', color: 'var(--text)',
        iconColor: type === 'success' ? 'var(--success)' : 'var(--danger)',
        customClass: { popup: 'swal2-popup' }
    });
}

/* ========= SECTION 7: PAYMENT TYPE ========= */
function setPaymentType(m) {
    payMethod = m;
    const mixPanel = $("mixPanel");
    const payTypeSelect = $("payTypeSelect");
    if (payTypeSelect) {
        payTypeSelect.value = m;
        if (m === "") { payTypeSelect.selectedIndex = 0; }
    }
    if (m === "") {
        if ($("mixCash")) $("mixCash").value = "";
        if ($("mixTrans")) $("mixTrans").value = "";
        if (mixPanel) mixPanel.style.display = 'none';
        return;
    }
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

    if (!currentPay) { return notify("error", "ระบุข้อมูลไม่ครบ", "กรุณาเลือกวิธีชำระเงิน"); }
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
        case "Cash": case "เงินสด": finalCash = price + tip; break;
        case "Trans": case "โอน": finalTrans = price + tip; break;
        case "Mix":
            finalCash = parseFloat($("mixCash")?.value) || 0;
            finalTrans = parseFloat($("mixTrans")?.value) || 0; break;
    }

    const svcs = [];
    if (hairStyleSelect?.value) svcs.push(hairStyleSelect.value);
    if ($("extra1")?.value) svcs.push($("extra1").value);
    if ($("extra2")?.value) svcs.push($("extra2").value);

    const newRec = {
        id: Date.now(), date: dInp, time: tStart, endTime: tEnd,
        price, tip, pay: currentPay, svcs,
        payCash: finalCash, payTrans: finalTrans,
        custType: $("custType")?.value || "none",
        type: 'SERVICE',
        isGift: /^Free/.test(currentPay)
    };

    db.push(newRec);
    saveDB();
    notify("success", "บันทึกสำเร็จ", "จัดเก็บข้อมูลเรียบร้อยแล้ว");

    // Reset form
    $("priceInp").value = ""; $("tipInp").value = "0";
    $("mixCash") && ($("mixCash").value = "");
    $("mixTrans") && ($("mixTrans").value = "");
    payMethod = ""; setPaymentType("");
    if (hairStyleSelect) hairStyleSelect.selectedIndex = 0;
    $("extra1") && ($("extra1").selectedIndex = 0);
    $("extra2") && ($("extra2").selectedIndex = 0);
    $("custType") && ($("custType").selectedIndex = 0);

    // Auto set current time
    const now = new Date();
    const curTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    $("tStart") && ($("tStart").value = curTime);
    $("tEnd") && ($("tEnd").value = `${(now.getHours()+0).toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`);

    if (typeof renderDay === 'function') renderDay(dInp);
    if (typeof loadAccountStatus === 'function') loadAccountStatus();
}

/* ========= SECTION 9: RENDER DAILY REPORT ========= */
function renderDay(selectedDate) {
    const dInp = selectedDate || ($("dateInp")?.value || new Date().toISOString().split('T')[0]);
    if ($("dateInp")) $("dateInp").value = dInp;
    let allRec = db.filter(r => r.date === dInp);
    if (allRec.length === 0 && archives) {
        const archived = archives.find(a => a.date === dInp);
        if (archived?.details) allRec = archived.details;
    }

    const isHoliday = allRec.some(r => r.type === "HOLIDAY");
    let tot = 0, trans = 0, cash = 0, tips = 0;
    let realCustomerCount = 0, countNew = 0, countRegular = 0;
    let listHtml = "";

    allRec.slice().sort((a,b) => (a.time||"").localeCompare(b.time||"")).forEach((r,i) => {
        const p = Number(r.price)||0, t = Number(r.tip)||0;
        const payStr = String(r.pay||"");
        let payIcon = "💶", moneyText = `฿${p}`;
        const isPureFree = /ฟรี|free/i.test(payStr) && !/(สด|cash|โอน|trans)/i.test(payStr);

        if (/Free-Cash/i.test(payStr)) { payIcon = "🎁+💶"; cash += p; tot += p; }
        else if (/Free-Trans/i.test(payStr)) { payIcon = "🎁+📱"; trans += p+t; tot += p; }
        else if (isPureFree) { payIcon = "🎁 ฟรี"; moneyText = "<span style=color:#94a3b8>฿0</span>"; }
        else if (/Mix/i.test(payStr)) { payIcon = "🌓"; cash += Number(r.payCash)||0; trans += Number(r.payTrans)||0; tot += p; }
        else if (/Trans|โอน/i.test(payStr)) { payIcon = "📱"; trans += p+t; tot += p; }
        else { payIcon = "💵"; cash += p; tot += p; }

        if (!isPureFree) tips += t;
        const rType = String(r.type||"").toUpperCase();
        if (!["HOLIDAY","GUARANTEE_CLAIM"].includes(rType) && !isPureFree) {
            realCustomerCount++;
            if (r.custType === "new") countNew++;
            if (r.custType === "regular") countRegular++;
        }

        const timeShow = r.endTime ? `${r.time}-${r.endTime}` : r.time;
        const svcs = Array.isArray(r.svcs) ? r.svcs.join(' + ') : r.svcs;
        const custTag = r.custType==="new"?"🌟":(r.custType==="regular"?"📌":"");
        listHtml += `
        <div style="padding:12px; border-bottom:1px solid #f1f5f9; background:#fff;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; gap:10px; align-items:center;">
                    <div style="width:28px; height:28px; background:#f8fafc; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold; color:#64748b;">${i+1}</div>
                    <div><div style="font-weight:bold;">[${timeShow}] ${svcs} ${custTag}</div>
                    <small style="color:#94a3b8;">${t?"🔹 ทิป ฿"+t:""}</small></div>
                </div>
                <div style="text-align:right;">
                    <div><span style="font-size:12px;">${payIcon}</span> ${moneyText}${t?`<span style=color:#be185d>+฿${t}</span>`:""}</div>
                    <div style="color:#ef4444; font-size:11px; cursor:pointer;" onclick="delRec(${r.id})">ลบ</div>
                </div>
            </div>
        </div>`;
    });

    const bEarn = isHoliday ? 0 : Math.max(tot*(conf.perc/100), conf.guar) + tips;
    const sEarn = isHoliday ? 0 : tot - (bEarn - tips);
    const settle = isHoliday ? 0 : cash - bEarn;

    if ($("dTotal")) $("dTotal").innerText = tot.toLocaleString();
    if ($("dTrans")) $("dTrans").innerText = trans.toLocaleString();
    if ($("dCash")) $("dCash").innerText = cash.toLocaleString();
    if ($("dBarber")) $("dBarber").innerText = Math.floor(bEarn).toLocaleString();
    if ($("dShop")) $("dShop").innerText = Math.floor(sEarn).toLocaleString();
    if ($("dCounts")) {
        if (isHoliday) $("dCounts").innerHTML = "<span style=color:#64748b>🏖️ วันหยุด</span>";
        else if (allRec.length === 0) $("dCounts").innerHTML = "<span style=color:#94a3b8>ไม่มีข้อมูล</span>";
        else $("dCounts").innerHTML = `ลูกค้า: ${realCustomerCount} คน ${countNew?`<span style=color:#22c55e> ใหม่:${countNew}</span>`:""} ${countRegular?`<span style=color:#f59e0b> ประจำ:${countRegular}</span>`:""}`;
    }

    let statusText = "", statusColor = "", icon = "";
    if (isHoliday) { statusText="วันหยุด"; statusColor="#1e40af"; icon="🏖️"; }
    else if (allRec.length === 0) { statusText="รอข้อมูล..."; statusColor="#64748b"; icon="📝"; }
    else if (settle > 0) { statusText=`ช่างคืนร้าน ฿${Math.floor(settle).toLocaleString()}`; statusColor="#b91c1c"; icon="🕵️"; }
    else if (settle < 0) { statusText=`ร้านคืนช่าง ฿${Math.floor(Math.abs(settle)).toLocaleString()}`; statusColor="#4338ca"; icon="🏠"; }
    else { statusText="ยอดพอดี"; statusColor="#15803d"; icon="✅"; }

    if ($("settleBarContainer")) $("settleBarContainer").innerHTML = `
        <div id="settleBar" style="height:55px; background:#f1f5f9; border-radius:18px; display:flex; align-items:center; justify-content:center; font-weight:bold; color:${statusColor};">
            ${icon} ${statusText}
        </div>
        <button id="btnSubmitSend" onclick="saveAndGo('${dInp}', ${tot})" style="background:#ff6f00; color:#fff; border:none; border-radius:18px; font-size:22px; cursor:pointer;">
            <i id="btnIcon" class="fas fa-paper-plane"></i>
        </button>`;

    const dayName = ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'][new Date(dInp).getDay()];
    const [y,m,d] = dInp.split('-');
    const displayDate = `${d}/${m}/${parseInt(y)+543}`;
    if ($("dailyList")) $("dailyList").innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:#fff; border-radius:12px; border-bottom:2px solid #f1f5f9;">
            <div style="display:flex; align-items:center; gap:10px;">
                <b>รายงานวันที่</b>
                <div style="background:#f1f5f9; padding:5px 12px; border-radius:8px; position:relative;">
                    <span style="color:#6366f1; font-weight:bold;">${dayName} ${displayDate}</span>
                    <input type="date" value="${dInp}" onchange="renderDay(this.value)" style="position:absolute; inset:0; opacity:0; cursor:pointer;">
                </div>
                <button onclick="deleteArchiveDate('${dInp}')" style="background:#fee2e2; color:#ef4444; border:1px solid #fecaca; border-radius:10px; width:34px; height:34px; cursor:pointer;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
            <i class="fab fa-line" style="color:#22c55e; font-size:34px; cursor:pointer;" onclick="shareLine()"></i>
        </div>
        ${listHtml||"<center style=padding:30px;color:#94a3b8>ไม่มีข้อมูล</center>"}`;
}

/* ========= SECTION 10: SAVE & CLOSE DAY ========= */
async function saveAndGo(date, total) {
    const alreadySent = archives.some(a => a.date === date);
    if (alreadySent) { notify("error", "แจ้งเตือน", `วันที่ ${date} ส่งข้อมูลแล้ว`); return; }

    const { isConfirmed } = await Swal.fire({
        title: "ยืนยันส่งข้อมูล", text: `วันที่ ${date} ?`, icon: "question",
        showCancelButton: true, confirmButtonColor: "var(--success)",
        confirmButtonText: "ยืนยัน", cancelButtonText: "ยกเลิก"
    });
    if (!isConfirmed) return;

    const allToday = db.filter(r => r.date === date);
    const todayData = allToday.filter(r => r.type === 'SERVICE');
    const isHoliday = allToday.some(r => r.type === 'HOLIDAY');
    let cash = 0, tips = 0;
    todayData.forEach(r => {
        const p = Number(r.price)||0, t = Number(r.tip)||0;
        tips += t;
        if (/Cash|เงินสด/i.test(r.pay)) cash += p+t;
        else if (/Mix/i.test(r.pay)) cash += Number(r.payCash)||0;
    });

    const commission = total * (conf.perc/100);
    const baseEarn = Math.max(commission, conf.guar);
    const bEarn = isHoliday ? 0 : baseEarn + tips;
    const settle = isHoliday ? 0 : cash - bEarn;

    const data = { date, total, cash, barber: Math.floor(bEarn), settle,
        type: isHoliday ? "HOLIDAY" : "WORK", details: allToday,
        guar_used: conf.guar, perc_used: conf.perc };

    const idx = archives.findIndex(a => a.date === date);
    idx > -1 ? (archives[idx] = data) : archives.push(data);
    if (!isHoliday) account.balance = -settle;
    db = db.filter(r => r.date !== date);
    saveDB();
    notify("success", "สำเร็จ", "ส่งข้อมูลเรียบร้อย");
    renderDay(date);
    loadAccountStatus();
}

/* ========= SECTION 11: DELETE RECORD ========= */
function delRec(id) {
    if (confirm("ลบรายการนี้?")) {
        db = db.filter(r => r.id !== id);
        saveDB();
        renderDay();
    }
}
async function deleteArchiveDate(date) {
    const { isConfirmed } = await Swal.fire({
        title: "ยืนยันลบ", text: `ลบข้อมูลวันที่ ${date} ?`, icon: "warning",
        showCancelButton: true, confirmButtonColor: "#ef4444",
        confirmButtonText: "ลบ", cancelButtonText: "ยกเลิก"
    });
    if (isConfirmed) {
        archives = archives.filter(a => a.date !== date);
        saveDB();
        renderDay(date);
    }
}

/* ========= SECTION 12: ACCOUNT & SETTLEMENT ========= */
function loadAccountStatus() {
    const today = $("dateInp")?.value || new Date().toISOString().split('T')[0];
    if ($("accDate")) $("accDate").value = today;
    
    const lastArchive = archives.sort((a,b) => b.date.localeCompare(a.date))[0];
    const oldBalance
// ========= ดำเนินการต่อจากส่วนที่ขาดไป =========
    const todayArchive = archives.find(a => a.date === today);
    const bal = account.balance || 0;

    if ($("accOldVal")) $("accOldVal").innerText = `฿${bal.toLocaleString()}`;
    if ($("accDateLabel")) $("accDateLabel").innerText = lastArchive ? lastArchive.date : "ยังไม่มีข้อมูล";
    if ($("accTodayVal")) $("accTodayVal").innerText = todayArchive ? `฿${todayArchive.settle.toLocaleString()}` : "฿0";
    if ($("accTotalVal")) $("accTotalVal").innerText = `฿${(bal + (todayArchive ? todayArchive.settle : 0)).toLocaleString()}`;
    if ($("accLight")) $("accLight").style.background = (bal + (todayArchive ? todayArchive.settle : 0)) >= 0 ? "#22c55e" : "#ef4444";
    if ($("statusBadge")) {
        const total = bal + (todayArchive ? todayArchive.settle : 0);
        if (total > 0) { $("statusBadge").innerText = "ร้านคืนช่าง"; $("statusBadge").style.background = "#dbeafe"; $("statusBadge").style.color = "#1d4ed8"; }
        else if (total < 0) { $("statusBadge").innerText = "ช่างคืนร้าน"; $("statusBadge").style.background = "#fee2e2"; $("statusBadge").style.color = "#dc2626"; }
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
    if (!list) return;
    list.innerHTML = account.logs.length === 0 ? "<center style='padding:20px;color:#94a3b8'>ยังไม่มีประวัติ</center>"
        : account.logs.map(l => `
            <div style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #eee;">
                <div><b>${l.date}</b><br><small>${l.note}</small></div>
                <div style="font-weight:bold;color:${l.balance>=0?'#22c55e':'#ef4444'}">฿${l.balance.toLocaleString()}</div>
            </div>`).join("");
    $("historyModal").style.display = "flex";
}
function closeHistoryModal() { $("historyModal").style.display = "none"; }

/* ========= SECTION 14: MONTHLY SUMMARY & EXPORT ========= */
function loadHistMonth() {
    const v = $("histMonth")?.value;
    if (!v) return;
    const [y, m] = v.split('-');
    const name = new Date(y, m-1, 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
    const list = archives.filter(a => a.date?.startsWith(`${y}-${m.padStart(2,'0')}`));
    if (list.length === 0) return notify("error", "ไม่พบข้อมูล", name);

    const total = list.reduce((s,a)=>s+(a.total||0),0);
    const cash = list.reduce((s,a)=>s+(a.cash||0),0);
    const barber = list.reduce((s,a)=>s+(a.barber||0),0);
    const settle = list.reduce((s,a)=>s+(a.settle||0),0);
    const days = list.filter(a => a.type !== "HOLIDAY").length;
    const holidays = list.filter(a => a.type === "HOLIDAY").length;

    $("reportTitle").innerText = `📊 สรุป ${name}`;
    $("reportContent").innerHTML = `
        <div style="padding:10px 0;">
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
                <span>จำนวนวันทำการ</span><b>${days} วัน ${holidays?`(พัก ${holidays} วัน)`:""}</b>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
                <span>💰 ยอดรวมทั้งหมด</span><b>฿${total.toLocaleString()}</b>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
                <span>💵 เงินสดรวม</span><b>฿${cash.toLocaleString()}</b>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
                <span>🧑‍💻 ส่วนของช่าง</span><b>฿${barber.toLocaleString()}</b>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
                <span>⚖️ ยอดค้างรวม</span><b style="color:${settle>=0?'#22c55e':'#ef4444'}">฿${settle.toLocaleString()}</b>
            </div>
        </div>`;
    $("reportModal").style.display = "flex";
}

function exportToExcel(monthValue) {
    if (!monthValue) return;
    const [y, m] = monthValue.split('-');
    const name = new Date(y, m-1, 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
    const list = archives.filter(a => a.date?.startsWith(`${y}-${m.padStart(2,'0')}`));
    if (list.length === 0) return notify("error", "ไม่พบข้อมูล", name);

    const rows = [["วันที่", "ประเภท", "ยอดรวม", "เงินสด", "ส่วนช่าง", "ยอดค้าง"]];
    list.forEach(a => rows.push([a.date, a.type === "HOLIDAY" ? "วันหยุด" : "ทำการ", a.total, a.cash, a.barber, a.settle]));
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "สรุป");
    XLSX.writeFile(wb, `สรุป-${name}.xlsx`);
    notify("success", "สำเร็จ", "ดาวน์โหลด Excel เรียบร้อย");
}

/* ========= SECTION 15: HOLIDAY & INSURANCE ========= */
function handleHoliday() {
    const date = $("dateInp")?.value || new Date().toISOString().split('T')[0];
    if (db.some(r => r.date === date && r.type === "HOLIDAY")) {
        return notify("error", "แจ้งเตือน", "วันนี้บันทึกวันหยุดไปแล้ว");
    }
    db.push({ id: Date.now(), date, type: "HOLIDAY", note: "วันหยุด" });
    saveDB();
    notify("success", "สำเร็จ", "บันทึกวันหยุดเรียบร้อย");
    renderDay(date);
}

function handleInsurance() {
    const date = $("dateInp")?.value || new Date().toISOString().split('T')[0];
    const todayData = db.filter(r => r.date === date && r.type === "SERVICE");
    const total = todayData.reduce((s,r)=>s+(r.price||0),0);
    if (total >= conf.guar) return notify("success", "ไม่ต้องใช้สิทธิ", `ยอด ${total} ≥ หลักประกัน ฿${conf.guar}`);

    const short = conf.guar - total;
    db.push({ id: Date.now(), date, type: "GUARANTEE_CLAIM", price: short, note: `ขอเพิ่ม ฿${short}` });
    saveDB();
    notify("success", "ใช้สิทธิสำเร็จ", `ขอเพิ่ม ฿${short}`);
    renderDay(date);
}

/* ========= SECTION 16: SETTINGS & THEME ========= */
function openSettings() { $("modalSet").style.display = "flex"; }
function closeReportModal() { $("reportModal").style.display = "none"; }

function applyTheme(t) {
    document.body.classList.remove("navy", "vintage");
    if (t === "navy") document.body.classList.add("navy");
    else if (t === "vintage") document.body.classList.add("vintage");
    conf.theme = t;
    localStorage.setItem("shopTheme", t);
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
    localStorage.setItem("shopTheme", conf.theme);
    localStorage.setItem("shopSound", conf.sound);
    localStorage.setItem("shopVoice", conf.voice);
    saveDB();
    document.querySelector("h2").innerText = conf.shop;
    $("modalSet").style.display = "none";
    notify("success", "บันทึกสำเร็จ", "ตั้งค่าถูกบันทึกแล้ว");
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
    const f = input.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.db || !data.archives || !data.account || !data.conf) throw "Invalid";
            db = data.db; archives = data.archives; account = data.account; conf = data.conf;
            saveDB();
            document.querySelector("h2").innerText = conf.shop;
            applyTheme(conf.theme);
            notify("success", "คืนค่าสำเร็จ", "รีเฟรชหน้าเพจเพื่อใช้งาน");
        } catch { notify("error", "ไฟล์ไม่ถูกต้อง"); }
    };
    reader.readAsText(f);
}

async function clearData() {
    const { isConfirmed } = await Swal.fire({
        title: "⚠️ ล้างข้อมูลทั้งหมด", text: "แน่ใจหรือไม่? ไม่สามารถกู้คืนได้",
        icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444",
        confirmButtonText: "ล้างข้อมูล", cancelButtonText: "ยกเลิก"
    });
    if (!isConfirmed) return;
    localStorage.clear();
    location.reload();
}

/* ========= SECTION 18: LINE SHARE & COMPARISON ========= */
function shareLine() {
    const d = $("dateInp")?.value || new Date().toISOString().split('T')[0];
    const [y, m, day] = d.split('-');
    const thaiDate = `${day}/${m}/${parseInt(y)+543}`;
    const t = $("dTotal")?.innerText || "0";
    const c = $("dCash")?.innerText || "0";
    const tr = $("dTrans")?.innerText || "0";
    const b = $("dBarber")?.innerText || "0";
    const s = $("dShop")?.innerText || "0";
    const msg = `📝 รายงานประจำวัน ${thaiDate}
💰 ยอดรวม: ฿${t}
💵 เงินสด: ฿${c}
📱 เงินโอน: ฿${tr}
🧑‍💻 ส่วนช่าง: ฿${b}
🏠 ส่วนร้าน: ฿${s}`;
    $("msgEdit").value = msg;
    $("linePreview").style.display = "flex";
}

function sendToLineFinal() {
    const msg = encodeURIComponent($("msgEdit")?.value || "");
    window.open(`https://line.me/R/oaMessage/${"YOUR_LINE_BOT_ID"}/?${msg}`, "_blank");
    $("linePreview").style.display = "none";
}

function openComparisonSelector() {
    Swal.fire({
        title: "เลือกช่วงวันที่", html: `
            <div style="display:flex; gap:10px; justify-content:center;">
                <input type="date" id="cmpStart" value="${new Date().toISOString().slice(0,10)}">
                <span>ถึง</span>
                <input type="date" id="cmpEnd" value="${new Date().toISOString().slice(0,10)}">
            </div>`,
        showCancelButton: true, confirmButtonText: "ดูสรุป", cancelButtonText: "ปิด",
        preConfirm: () => ({ start: document.getElementById("cmpStart").value, end: document.getElementById("cmpEnd").value })
    }).then(r => { if (r.isConfirmed) showComparison(r.value.start, r.value.end); });
}

function showComparison(start, end) {
    const list = archives.filter(a => a.date >= start && a.date <= end);
    if (!list.length) return notify("error", "ไม่พบข้อมูล");
    const total = list.reduce((s,a)=>s+(a.total||0),0);
    const cash = list.reduce((s,a)=>s+(a.cash||0),0);
    const barber = list.reduce((s,a)=>s+(a.barber||0),0);
    const settle = list.reduce((s,a)=>s+(a.settle||0),0);
    const days = list.filter(a => a.type !== "HOLIDAY").length;
    $("reportTitle").innerText = "📊 เปรียบเทียบช่วงวันที่";
    $("reportContent").innerHTML = `
        <div style="padding:10px 0;">
            <p style="text-align:center; color:#6366f1; font-weight:bold;">${start} ถึง ${end}</p>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
                <span>จำนวนวันทำการ</span><b>${days} วัน</b>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
                <span>💰 ยอดรวมทั้งหมด</span><b>฿${total.toLocaleString()}</b>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
                <span>💵 เงินสดรวม</span><b>฿${cash.toLocaleString()}</b>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
                <span>🧑‍💻 ส่วนช่าง</span><b>฿${barber.toLocaleString()}</b>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
                <span>⚖️ ยอดค้างรวม</span><b style="color:${settle>=0?'#22c55e':'#ef4444'}">฿${settle.toLocaleString()}</b>
            </div>
        </div>`;
    $("reportModal").style.display = "flex";
}

function handleGoogleSheet() {
    window.open("https://docs.google.com/spreadsheets", "_blank");
}

/* ========= SECTION 19: MODAL & DATE INIT ========= */
window.onclick = e => {
    if (e.target.classList.contains("modal")) e.target.style.display = "none";
};

document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toISOString().split('T')[0];
    if ($("dateInp")) { $("dateInp").value = today; updateDateDisplay(today); }
    if ($("accDate")) $("accDate").value = today;
    if ($("setShop")) $("setShop").value = conf.shop;
    if ($("setPerc")) $("setPerc").value = conf.perc;
    if ($("setGuar")) $("setGuar").value = conf.guar;
    if ($("setTheme")) $("setTheme").value = conf.theme;
    if ($("setSound")) $("setSound").value = conf.sound;
    if ($("setVoice")) $("setVoice").value = conf.voice;
    applyTheme(conf.theme);
    document.querySelector("h2").innerText = conf.shop;

    const now = new Date();
    const curTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    if ($("tStart")) $("tStart").value = curTime;
    if ($("tEnd")) $("tEnd").value = curTime;

    renderDay(today);
    loadAccountStatus();
});
