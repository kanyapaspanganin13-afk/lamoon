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
