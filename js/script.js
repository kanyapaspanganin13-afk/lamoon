/* =========== SECTION 1: ค่าคงที่ & เวอร์ชัน & ตัวแปรกลาง =========== */
const $ = id => document.getElementById(id);
const VERSION_MAJOR = "1.0"; // แก้ไขตัดจุดออก เพื่อป้องกันการแสดงผลเป็น 1.0.0
const LAST_UPDATED = "14/09/2026";
const MONTH_NAMES = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const MONTH_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const DAY_NAMES = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"];
const DAY_SHORT = ["อา.","จ.","อ.","พ.","พฤ.","ศ.","ส."];
const HAIR_LIST = ["แฟชั่น","สกินเฟด","รองทรง","ตำรวจ/ทหาร","นักเรียน","ทรงนักเรียน","เปิดข้าง","ซอยผม/เล็มผม","แก้ผม","โกนผม","เด็ก"];
const EXTRA_LIST = ["โกนหนวด","กันหน้า","สระผม","กันจอน","ย้อมแฟชั่น","ดัดผม","แคะหู"];

// ✅ ฟังก์ชันช่วยเรื่องวันที่ (ย้ายขึ้นมาไว้ด้านบนก่อนถูกเรียกใช้)
function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ✅ คำนวณเวอร์ชันอัตโนมัติ
window.APP_VERSION = "";
(function initVersion() {
    const [maj, min] = VERSION_MAJOR.split('.').map(Number);
    const sMaj = parseInt(localStorage.getItem("ver_x") || String(maj));
    const sMin = parseInt(localStorage.getItem("ver_y") || String(min));
    let sPatch = parseInt(localStorage.getItem("ver_z") || "0");
    let x = sMaj, y = sMin, z = sPatch;
    
    if (maj !== sMaj || min !== sMin) {
        x = maj; y = min; z = 0;
        localStorage.setItem("ver_x", String(x));
        localStorage.setItem("ver_y", String(y));
        localStorage.setItem("ver_z", String(z));
        localStorage.setItem("ver_lastDate", getTodayKey());
    } else {
        const lastDate = localStorage.getItem("ver_lastDate") || "";
        const today = getTodayKey();
        if (lastDate !== today) {
            z = sPatch + 1;
            localStorage.setItem("ver_z", String(z));
            localStorage.setItem("ver_lastDate", today);
        }
    }
    window.APP_VERSION = `${x}.${y}.${z}`;
})();

// ✅ ตัวแปรกลาง (Global Scope)
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
/* =========== SECTION 2: ฟังก์ชันช่วยทั่วไป =========== */
function saveDB() {
    try {
        localStorage.setItem("barber_db", JSON.stringify(db));
        localStorage.setItem("barber_archives", JSON.stringify(archives));
        localStorage.setItem("barber_account", JSON.stringify(account));
        localStorage.setItem("barber_conf", JSON.stringify(conf));
        return true;
    } catch(e) { 
        console.error("❌ บันทึกไม่ได้:", e); 
        return false; 
    }
}

function notify(type, title, text = "") {
    speak(type, text || title);
    if (typeof Swal === 'undefined') { alert(`${title}\n${text}`); return; }
    Swal.fire({
        icon: type, 
        title: title, 
        text: text, 
        timer: 2200, 
        showConfirmButton: false,
        timerProgressBar: true, 
        background: 'var(--card,#1e293b)', 
        color: 'var(--text,#fff)',
        iconColor: type === 'success' ? 'var(--success,#10b981)' : 'var(--danger,#ef4444)'
    });
}

function speak(type, message = "") {
    const soundSetting = conf.sound || localStorage.getItem('shopSound') || "on";
    if (soundSetting === "off") return;
    
    const voiceSetting = String(conf.voice || localStorage.getItem('shopVoice') || "").toLowerCase();
    const isMan = voiceSetting.includes("male") || voiceSetting.includes("man");
    const audioId = type === "success" 
        ? (isMan ? "successSoundMan" : "successSoundWoman")
        : (isMan ? "errorSoundMan" : "errorSoundWoman");
    const audio = $(audioId) || $(type === "success" ? "successSound" : "errorSound");
    
    if (audio) { 
        audio.pause(); 
        audio.currentTime = 0; 
        audio.play().catch(e => console.warn("Audio blocked:", e)); 
    }
    
    if (message && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(message);
        u.lang = 'th-TH'; 
        u.rate = 1.0;
        window.speechSynthesis.speak(u);
    }
}

// 🔓 ปลดล็อกเสียง Autoplay
document.addEventListener('click', function unlockAudio() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    }
    document.removeEventListener('click', unlockAudio, { once: true });
}, { once: true });

function formatDateThai(v) {
    if (!v) return "-";
    const parts = v.split('-');
    if (parts.length !== 3) return v;
    
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    
    // เติม T00:00:00 เพื่อป้องกันปัญหาเรื่อง Timezone เบี่ยงเบนวัน
    const dateObj = new Date(`${v}T00:00:00`);
    const dn = DAY_SHORT[dateObj.getDay()] || "";
    
    const monthStr = MONTH_SHORT[m - 1] || "";
    const yearStr = (+y + 543).toString().slice(-2);
    
    return `${d} ${monthStr} ${yearStr} (${dn})`;
}

function getShareConfig() {
    const rawRate = localStorage.getItem('shopCommissionRate');
    const defaultRate = (parseFloat(conf.perc) || 50) / 100;
    
    return {
        rate: rawRate !== null ? parseFloat(rawRate) : defaultRate,
        offsiteB: parseFloat(localStorage.getItem('offsiteBarberFee')) || 200,
        offsiteS: parseFloat(localStorage.getItem('offsiteShopFee')) || 100,
        freeB: parseFloat(localStorage.getItem('freeBarberComp')) || 100,
        freeS: parseFloat(localStorage.getItem('freeShopComp')) || 0,
        guar: parseFloat(conf.guar) || 0,
        extraMode: localStorage.getItem('extraSplitMode') || 'split'
    };
}

function calcShares(price, custType, isFree) {
    const c = getShareConfig();
    const p = parseFloat(price) || 0;
    
    if (custType === 'offsite' && isFree) return { b: c.freeB, s: c.freeS };
    if (custType === 'offsite') {
        if (c.extraMode === 'barber') return { b: p, s: 0 };
        return { b: c.offsiteB, s: c.offsiteS };
    }
    if (isFree) return { b: c.freeB, s: c.freeS };
    
    const b = Math.round(p * (1 - c.rate));
    return { b: b, s: p - b };
}
/* =========== SECTION 3: การนำทาง & แท็บ =========== */
function switchMainView(viewName, subNum = null) {
    document.querySelectorAll('.app-page, .page-content, .main-page').forEach(p => {
        p.classList.remove('active'); 
        p.style.display = 'none';
    });
    
    if (viewName === 'home' || viewName === 'pageHome') {
        const p = $('pageHome');
        if (p) { p.classList.add('active'); p.style.display = 'block'; }
        if (typeof updateNavDisplay === 'function') updateNavDisplay('home');
        return;
    }
    if (viewName === 'workGroup' || viewName === 'pageWorkGroup') {
        const p = $('pageWorkGroup'); if (!p) return;
        p.classList.add('active'); p.style.display = 'block';
        if (typeof goSub === 'function') goSub(subNum || 1);
        if (typeof updateNavDisplay === 'function') updateNavDisplay('workGroup', subNum);
        return;
    }
    if (viewName === 'summaryPage' || viewName === 'pageSummary') {
        const p = $('pageSummary'); if (!p) return;
        p.classList.add('active'); p.style.display = 'block';
        if (typeof switchMainTab === 'function') switchMainTab('pageSummary', 'summaryTab1');
        if (typeof updateNavDisplay === 'function') updateNavDisplay('summaryPage');
        return;
    }
    if (viewName === 'monthlySummary' || viewName === 'pageMonthlyReport') {
        const p = $('pageMonthlyReport'); if (!p) return;
        p.classList.add('active'); p.style.display = 'block';
        if (typeof switchMainTab === 'function') switchMainTab('pageMonthlyReport', 'monthlyTab1');
        if (typeof updateNavDisplay === 'function') updateNavDisplay('monthlySummary');
        return;
    }
    if (viewName === 'comparePage' || viewName === 'pageComparison') {
        const p = $('pageComparison'); if (!p) return;
        p.classList.add('active'); p.style.display = 'block';
        if (typeof updateNavDisplay === 'function') updateNavDisplay('comparePage');
        return;
    }
}

function go(p) {
    document.querySelectorAll('.page, .app-page, .page-content').forEach(pg => {
        pg.classList.remove('active'); 
        pg.style.display = 'none';
    });
    const target = $('p' + p) || $('page' + p);
    if (target) { target.classList.add('active'); target.style.display = 'block'; }
    
    document.querySelectorAll('.nav-item').forEach((btn, i) => {
        const sel = (i + 1) === p;
        btn.classList.toggle('active', sel);
        btn.style.color = sel ? 'var(--accent, #3b82f6)' : 'var(--text, #fff)';
        btn.style.opacity = sel ? '1' : '0.5';
    });
    
    const d = $('dateInp')?.value || new Date().toISOString().split('T')[0];
    if (p === 2) {
        if (typeof renderDay === 'function') renderDay(d);
        if (typeof updateDateDisplay === 'function') updateDateDisplay(d);
    }
    if (p === 3) {
        if ($('accDate') && $('dateInp')) $('accDate').value = $('dateInp').value;
        if (typeof loadAccountStatus === 'function') loadAccountStatus();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateNavDisplay(viewName, subNum) {
    const nav = document.querySelector('.bottom-nav'); if (!nav) return;
    nav.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    
    if (viewName === 'home' || viewName === 'pageHome') {
        nav.querySelector('#navHome')?.classList.add('active');
    } else if (viewName === 'workGroup' || viewName.startsWith('sub')) {
        let num = subNum;
        if (!num && viewName.startsWith('sub')) num = parseInt(viewName.replace('sub', ''), 10);
        if (num === 1) nav.querySelector('#nav1')?.classList.add('active');
        if (num === 2) nav.querySelector('#nav2')?.classList.add('active');
        if (num === 3) nav.querySelector('#nav3')?.classList.add('active');
    } else if (viewName === 'summaryPage' || viewName === 'pageSummary') {
        nav.querySelector('#navSummary')?.classList.add('active');
    } else if (viewName === 'monthlySummary' || viewName === 'pageMonthlyReport') {
        nav.querySelector('#navMonthly')?.classList.add('active');
    } else if (viewName === 'comparePage' || viewName === 'pageComparison') {
        nav.querySelector('#navCompare')?.classList.add('active');
    } else if (viewName === 'settings') {
        nav.querySelector('#navSettings')?.classList.add('active');
    }
}

function goSub(num) {
    const wp = $('pageWorkGroup'); if (!wp) return;
    wp.querySelectorAll('.sub-page').forEach(p => {
        p.classList.remove('active'); 
        p.style.display = 'none';
    });
    const t = $('p' + num); if (!t) return;
    t.classList.add('active'); t.style.display = 'block';
    updateNavDisplay('sub' + num);
    
    const d = $('dateInp')?.value || new Date().toISOString().split('T')[0];
    if (num === 2) {
        if (typeof renderDay === 'function') renderDay(d);
        if (typeof updateDateDisplay === 'function') updateDateDisplay(d);
    }
    if (num === 3) {
        if ($('accDate') && $('dateInp')) $('accDate').value = $('dateInp').value;
        if (typeof loadAccountStatus === 'function') loadAccountStatus();
    }
}

function switchMainTab(pageId, tabId, event) {
    if (event?.preventDefault) event.preventDefault();
    
    document.querySelectorAll('.page-content, section[id^="page-"], .main-page').forEach(p => {
        p.style.display = 'none'; 
        p.classList.remove('active');
    });
    const pg = $(pageId);
    if (pg) { pg.style.display = 'block'; pg.classList.add('active'); }
    
    if (tabId && pg) {
        pg.querySelectorAll('.tab-panel').forEach(p => {
            p.classList.remove('active'); 
            p.style.display = 'none';
        });
        const tp = $(tabId);
        if (tp) { tp.classList.add('active'); tp.style.display = 'block'; }
        
        // แก้ไข: เติม Class active กลับคืนให้ปุ่ม Tab ที่กด
        pg.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        if (event?.currentTarget) {
            event.currentTarget.classList.add('active');
        } else {
            const activeBtn = pg.querySelector(`.tab-btn[onclick*="${tabId}"]`);
            if (activeBtn) activeBtn.classList.add('active');
        }
    }
    updateNavDisplay(pageId);
    
    if (tabId === 'monthlyTab2') {
        if (typeof initYearOptions === 'function') initYearOptions();
        if (typeof renderYearlyIncomeSummary === 'function') renderYearlyIncomeSummary();
    } else if (pageId === 'report' || pageId === 'pageReport' || tabId === 'monthlyTab1') {
        if (typeof loadHistMonth === 'function') loadHistMonth();
    }
}
/* =========== SECTION 4: การอัปเดตอัตโนมัติ & วันที่ & ตั้งค่า =========== */
function autoUpdate() {
    const currentVer = window.APP_VERSION || '1.0.0';
    const storedVer = localStorage.getItem("app_v");
    
    if (storedVer && storedVer !== currentVer) {
        console.log(`[AutoUpdate] ${storedVer} → ${currentVer}`);
        localStorage.setItem("app_v", currentVer);
        
        if ('caches' in window) {
            caches.keys().then(names => names.forEach(n => caches.delete(n)));
        }
        
        if (typeof notify === 'function') {
            notify("info", "✨ อัปเดตระบบ", `เวอร์ชัน ${currentVer}`);
        }
        setTimeout(() => window.location.reload(), 1200);
    } else if (!storedVer) {
        localStorage.setItem("app_v", currentVer);
    }
}

function updateDateDisplay(v) {
    if (!v) return;
    const f = formatDateThai(v);
    if ($("dateDisplay")) $("dateDisplay").innerText = f;
    if ($("displayDateThai")) $("displayDateThai").innerText = f;
    // ⚠️ ตัด renderDay(v) ออกเพื่อป้องกัน Infinite Loop
}

function applyTheme(theme) {
    document.body.classList.remove("vintage", "navy", "light");
    const t = theme || "light";
    if (t !== "light") document.body.classList.add(t);
    document.body.setAttribute("data-theme", t);
    localStorage.setItem("selectedTheme", t);
    localStorage.setItem("shopTheme", t);
}

document.addEventListener("DOMContentLoaded", function() {
    autoUpdate();
    const savedTheme = localStorage.getItem("selectedTheme") || localStorage.getItem("shopTheme") || conf.theme || "light";
    applyTheme(savedTheme);
    
    const ts = $("setTheme");
    if (ts) {
        ts.value = savedTheme;
        ts.addEventListener("change", function() {
            applyTheme(this.value);
            if (navigator.vibrate) navigator.vibrate(10);
        });
    }
});

function openSettings() {
    if ($("setShop")) $("setShop").value = conf.shop || "";
    if ($("setPerc")) $("setPerc").value = conf.perc !== undefined ? conf.perc : 50;
    if ($("setGuar")) $("setGuar").value = conf.guar !== undefined ? conf.guar : 0;
    if ($("setOffsite")) $("setOffsite").value = conf.offsiteRate || 200;
    if ($("setTheme")) $("setTheme").value = conf.theme || "light";
    if ($("setSound")) $("setSound").value = conf.sound || "on";
    if ($("setVoice")) $("setVoice").value = conf.voice || "female";
    
    const m = $("modalSet");
    if (m) { m.style.display = "flex"; m.style.zIndex = "10000"; }
}

function closeSettings() {
    if ($("modalSet")) $("modalSet").style.display = "none";
}

function saveSettings() {
    try {
        const settings = {
            shop: $("setShop")?.value?.trim() || "Barber Shop",
            perc: parseFloat($("setPerc")?.value) || 0,
            guar: parseFloat($("setGuar")?.value) || 0,
            offsiteRate: parseFloat($("setOffsite")?.value) || 200,
            theme: $("setTheme")?.value || "light",
            voice: $("setVoice")?.value || "female",
            sound: $("setSound")?.value || "on"
        };
        
        Object.assign(conf, settings);
        const json = JSON.stringify(conf);
        localStorage.setItem('barber_conf', json);
        localStorage.setItem('barberConf', json);
        localStorage.setItem('shopName', settings.shop);
        localStorage.setItem('shopPerc', settings.perc);
        localStorage.setItem('shopGuar', settings.guar);
        localStorage.setItem('shopOffsiteRate', settings.offsiteRate);
        localStorage.setItem('shopTheme', settings.theme);
        localStorage.setItem('shopVoice', settings.voice);
        localStorage.setItem('shopSound', settings.sound);
        
        if (typeof saveDB === "function") saveDB();
        applyTheme(settings.theme);
        
        const d = $("dateInp")?.value || new Date().toISOString().split('T')[0];
        if (typeof renderDay === "function") renderDay(d);
        
        closeSettings();
        if (typeof notify === "function") notify("success", "บันทึกสำเร็จ", "บันทึกการตั้งค่าเรียบร้อยแล้ว");
    } catch (e) {
        console.error("saveSettings error:", e);
        if (typeof notify === "function") notify("error", "เกิดข้อผิดพลาด", "ไม่สามารถบันทึกได้");
    }
}

function switchSummaryTab(tabId, evt) {
    const target = document.getElementById(tabId);
    if (!target) return;
    
    const parent = target.closest('.page-content, .app-page') || document;
    parent.querySelectorAll(".tab-panel").forEach(p => {
        p.classList.remove("active");
        p.style.display = "none";
    });
    
    target.classList.add("active");
    target.style.display = "block";
    
    const e = evt || window.event;
    const btn = e?.currentTarget || e?.target?.closest(".tab-btn");
    if (btn) {
        btn.parentElement.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    }
    
    const hideTabs = ["tabOverview", "tabMonth", "tabAnalytics"];
    const allNav = document.querySelectorAll("#pageSummary .bottom-nav .nav-item");
    const navWrap = document.querySelector("#pageSummary .bottom-nav");
    
    if (hideTabs.includes(tabId)) {
        allNav.forEach((item, i) => item.style.display = i === 0 ? "flex" : "none");
        if (navWrap) navWrap.style.gridTemplateColumns = "1fr";
    } else {
        allNav.forEach(item => item.style.display = "");
        if (navWrap) navWrap.style.gridTemplateColumns = "";
    }
}
/* =========== SECTION 5: ประเภทการชำระเงิน & เหตุการณ์ =========== */
function editTime(id) {
    const rec = db.find(r => r.id === id); 
    if (!rec) return;
    
    const ns = prompt("⏱️ แก้เวลาเริ่ม (HH:MM)", rec.time || ""); 
    if (ns === null) return;
    const ne = prompt("⏱️ แก้เวลาเสร็จ (HH:MM)", rec.endTime || "");
    
    rec.time = ns;
    rec.endTime = ne !== null ? ne : "";
    
    saveDB(); 
    
    // ดึงวันที่ของบันทึกนั้น หรือใช้วันที่ปัจจุบันใน Input เพื่อสั่ง renderDay ให้ถูกต้อง
    const targetDate = rec.date || $("dateInp")?.value || new Date().toISOString().split('T')[0];
    if (typeof renderDay === "function") renderDay(targetDate);
}

function setPaymentType(m) {
    payMethod = m;
    const priceInp = $("priceInp");
    const mixPanel = $("mixPanel");
    const sel = $("payTypeSelect");
    
    if (sel) {
        if (m === "") {
            sel.value = ""; 
            sel.selectedIndex = 0;
            const od = sel.style.display;
            sel.style.display = 'none'; 
            sel.offsetHeight; // Force reflow
            sel.style.display = od;
        } else { 
            sel.value = m; 
        }
    }
    
    const isFree = m === 'Free' || m === 'FreeCash' || m === 'FreeTrans';
    if (m === "" || isFree) {
        if ($("mixCash")) $("mixCash").value = "";
        if ($("mixTrans")) $("mixTrans").value = "";
        if (mixPanel) mixPanel.style.display = 'none';
        if (isFree && priceInp) { 
            priceInp.readOnly = false; 
            priceInp.style.opacity = '1'; 
        }
        if (m === "") return;
    } else {
        if (priceInp) { 
            priceInp.readOnly = false; 
            priceInp.style.opacity = '1'; 
        }
    }
    
    if (mixPanel) {
        if (m === 'Mix') {
            mixPanel.style.display = 'block';
            if ($("mixCash")) $("mixCash").value = "";
            updateMixValues('cash');
            mixPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else { 
            mixPanel.style.display = 'none'; 
        }
    }
}

function updateMixValues(from = 'cash') {
    const price = parseFloat($("priceInp")?.value) || 0;
    const tip = parseFloat($("tipInp")?.value) || 0;
    const total = price + tip;
    
    if (from === 'cash') {
        const c = parseFloat($("mixCash")?.value) || 0;
        if ($("mixTrans")) $("mixTrans").value = Math.max(0, total - c);
    } else {
        const t = parseFloat($("mixTrans")?.value) || 0;
        if ($("mixCash")) $("mixCash").value = Math.max(0, total - t);
    }
}

function handleCustTypeChange(value) {
    const priceInp = $("priceInp"); 
    if (!priceInp) return;
    
    // ดึงค่าบริการนอกสถานที่จากการตั้งค่า (ถ้าไม่มีให้ใช้ 300)
    const offsitePrice = parseFloat(conf.offsiteRate) || parseFloat(localStorage.getItem('offsiteBarberFee')) || 300;
    
    if (value === 'offsite') {
        priceInp.value = offsitePrice; 
        priceInp.readOnly = true;
        priceInp.style.opacity = '0.7';
    } else {
        if (priceInp.value == offsitePrice) priceInp.value = '';
        priceInp.readOnly = false; 
        priceInp.style.opacity = '1';
    }
}

// ✅ ฟังก์ชันผูก Event Listener สำหรับระบบชำระเงิน
function initPaymentEvents() {
    $("mixCash")?.addEventListener("input", function() {
        if (payMethod === 'Free' || payMethod === '') {
            this.value = ""; 
            if ($("mixTrans")) $("mixTrans").value = ""; 
            return;
        }
        updateMixValues('cash');
    });
    
    $("mixTrans")?.addEventListener("input", function() {
        if (payMethod === 'Free' || payMethod === '') {
            this.value = ""; 
            if ($("mixCash")) $("mixCash").value = ""; 
            return;
        }
        updateMixValues('trans');
    });
    
    $("priceInp")?.addEventListener("input", () => { 
        if (payMethod === 'Mix') updateMixValues('cash'); 
    });
    
    $("tipInp")?.addEventListener("input", () => { 
        if (payMethod === 'Mix') updateMixValues('cash'); 
    });
}

// ผูก Event Listener เมื่อ DOM โหลดเสร็จ
document.addEventListener("DOMContentLoaded", initPaymentEvents);
/* =========== SECTION 6: บันทึก/แก้ไข/ลบข้อมูล =========== */
async function handleSave(event) {
    const todayStr = new Date().toISOString().split('T')[0];
    const dInp = $("dateInp")?.value || todayStr;
    const tStart = $("tStart")?.value || "";
    const tEnd = $("tEnd")?.value || "";
    const price = parseFloat($("priceInp")?.value) || 0;
    const tip = parseFloat($("tipInp")?.value) || 0;
    const custTypeVal = $("custType")?.value || 'none';
    const hairSel = $("hairStyle");
    const curPay = payMethod;
    
    if (!curPay) {
        if (navigator.vibrate) navigator.vibrate(100);
        return notify("error", "ข้อมูลไม่ครบ", "เลือกวิธีชำระเงิน");
    }
    
    const isFreePay = /^Free/.test(curPay) || ["Holiday", "Guarantee"].includes(curPay);
    if (price === 0 && !isFreePay) {
        if (navigator.vibrate) navigator.vibrate(100);
        $("priceInp")?.focus();
        return notify("error", "ข้อมูลไม่ครบ", "ระบุจำนวนเงิน");
    }
    
    if (hairSel && !isFreePay) {
        const v = hairSel.value;
        if (!v || v === "" || v === "เลือกทรงผม") {
            if (navigator.vibrate) navigator.vibrate(100);
            hairSel.focus();
            return notify("error", "ข้อมูลไม่ครบ", "เลือกทรงผม");
        }
    }
    
    let fCash = 0, fTrans = 0;
    switch (curPay) {
        case "Free": fCash = fTrans = 0; break;
        case "Free-Cash": 
        case "FreeCash": fCash = price; break;
        case "Free-Trans": 
        case "FreeTrans": fTrans = price + tip; break;
        case "Cash": fCash = price + tip; break;
        case "Trans": fTrans = price + tip; break;
        case "Mix":
            fCash = parseFloat($("mixCash")?.value) || 0;
            fTrans = parseFloat($("mixTrans")?.value) || 0;
            if (fCash + fTrans !== price + tip) {
                const r = await Swal.fire({
                    title: 'ยืนยันยอด', 
                    text: `จ่ายจริง ${fCash + fTrans} / บิล ${price + tip}`,
                    icon: 'warning', 
                    showCancelButton: true,
                    confirmButtonText: 'บันทึกต่อ', 
                    cancelButtonText: 'แก้ไข'
                });
                if (!r.isConfirmed) return;
            }
            break;
    }
    
    const svcs = [];
    if (hairSel?.value) svcs.push(hairSel.value);
    if ($("extra1")?.value) svcs.push($("extra1").value);
    if ($("extra2")?.value) svcs.push($("extra2").value);
    
    const isOffsite = custTypeVal === 'offsite';
    const isFree = /^Free/.test(curPay);
    const shares = typeof calcShares === 'function' ? calcShares(price, custTypeVal, isFree) : { b: 0, s: price };
    
    // บันทึกข้อมูลลงฐานข้อมูล (ใส่ทั้ง startTime และ time)
    db.push({
        id: Date.now(), 
        date: dInp, 
        startTime: tStart, // 👈 เพิ่มไว้ป้องกัน Error reading 'startTime'
        time: tStart,
        endTime: tEnd || tStart, 
        price, 
        tip, 
        pay: curPay, 
        svcs,
        payCash: fCash, 
        payTrans: fTrans, 
        custType: custTypeVal,
        barberShare: shares.b, 
        shopShare: shares.s, 
        type: 'SERVICE'
    });
    
    saveDB();
    notify("success", "บันทึกสำเร็จ", "จัดเก็บข้อมูลเรียบร้อย");
    
    const btn = event?.currentTarget || document.querySelector(".btn-pay");
    if (btn) {
        const oc = btn.innerHTML, ob = btn.style.background;
        btn.style.background = "var(--success)";
        btn.innerHTML = `<i class="fas fa-check-circle"></i> เรียบร้อย`;
        setTimeout(() => { btn.style.background = ob; btn.innerHTML = oc; }, 1200);
    }
    
    payMethod = "";
    if (typeof setPaymentType === 'function') setPaymentType("");
    
    const now = new Date();
    const ct = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    if ($("tStart")) $("tStart").value = ct;
    if ($("tEnd")) $("tEnd").value = ct;
    if ($("priceInp")) { 
        $("priceInp").value = ""; 
        $("priceInp").readOnly = false; 
        $("priceInp").style.opacity = "1"; 
    }
    if ($("tipInp")) $("tipInp").value = "0";
    if ($("mixCash")) $("mixCash").value = "";
    if ($("mixTrans")) $("mixTrans").value = "";
    if (hairSel) hairSel.selectedIndex = 0;
    if ($("extra1")) $("extra1").selectedIndex = 0;
    if ($("extra2")) $("extra2").selectedIndex = 0;
    if ($("custType")) $("custType").selectedIndex = 0;
    if ($("mixPanel")) $("mixPanel").style.display = 'none';
    
    if (typeof renderDay === 'function') renderDay(dInp);
    if (typeof loadAccountStatus === 'function') loadAccountStatus();
    $("custType")?.focus();
}

function delRec(id) {
    const rec = db.find(r => r.id === id);
    if (!rec) return;
    
    const targetDate = rec.date || $("dateInp")?.value || new Date().toISOString().split('T')[0];
    
    if (confirm("ลบรายการนี้?")) {
        db = db.filter(r => r.id !== id);
        saveDB(); 
        if (typeof renderDay === 'function') renderDay(targetDate);
        if (typeof loadAccountStatus === 'function') loadAccountStatus();
    }
}

function deleteArchiveDate(date) {
    if (confirm(`ลบข้อมูลวันที่ ${date} ทั้งหมด?`)) {
        db = db.filter(r => r.date !== date);
        archives = archives.filter(a => a.date !== date);
        saveDB(); 
        if (typeof renderDay === 'function') renderDay(date); 
        if (typeof loadAccountStatus === 'function') loadAccountStatus();
        notify("success", "สำเร็จ", "ลบข้อมูลเรียบร้อย");
    }
}

async function saveAndGo(date, total) {
    const btn = $("btnSubmitSend");
    
    if (archives.some(a => a.date === date)) {
        notify("error", "แจ้งเตือน", `วันที่ ${date} ส่งข้อมูลแล้ว`);
        if (btn) { btn.disabled = true; btn.style.background = "var(--text-muted, #94a3b8)"; }
        return;
    }
    
    const { isConfirmed } = await Swal.fire({
        title: "ยืนยันส่งข้อมูล", 
        text: `ส่งข้อมูลสรุปของวันที่ ${date} ใช่หรือไม่?`, 
        icon: "question",
        showCancelButton: true, 
        confirmButtonText: "ยืนยัน", 
        cancelButtonText: "ยกเลิก"
    });
    if (!isConfirmed) return;
    
    if (btn) { btn.disabled = true; btn.style.background = "var(--success)"; }
    
    const allToday = db.filter(r => r.date === date);
    const todayData = allToday.filter(r => r.type === 'SERVICE');
    const isHoliday = allToday.some(r => r.type === "HOLIDAY");
    
    // คำนวณยอดเงินสดรวมจาก field payCash โดยตรงเพื่อความถูกต้อง
    let cash = todayData.reduce((s, r) => s + (Number(r.payCash) || 0), 0);
    
    const curPerc = Number(conf.perc) || 0;
    const curGuar = Number(conf.guar) || 0;
    const commission = total * (curPerc / 100);
    const baseEarn = Math.max(commission, curGuar);
    const totalTips = todayData.reduce((s, r) => s + (Number(r.tip) || 0), 0);
    const bEarn = isHoliday ? 0 : baseEarn + totalTips;
    const settle = isHoliday ? 0 : cash - bEarn;
    
    const data = {
        date, 
        total, 
        cash, 
        barber: Math.floor(bEarn), 
        settle,
        type: isHoliday ? "HOLIDAY" : "WORK", 
        details: allToday,
        guar_used: curGuar, 
        perc_used: curPerc
    };
    
    const idx = archives.findIndex(a => a.date === date);
    if (idx > -1) {
        archives[idx] = data;
    } else {
        archives.push(data);
    }
    
    if (!isHoliday && typeof account === 'object') {
        account.balance = -settle;
    }
    
    db = db.filter(r => r.date !== date);
    
    try {
        saveDB();
        if (btn) { btn.style.background = "var(--text-muted, #94a3b8)"; btn.disabled = true; }
        notify("success", "สำเร็จ", "ส่งข้อมูลเรียบร้อย");
        if (typeof renderDay === 'function') renderDay(date); 
        if (typeof loadAccountStatus === 'function') loadAccountStatus();
    } catch (e) {
        if (btn) { btn.disabled = false; btn.style.background = "var(--danger)"; }
        notify("error", "ผิดพลาด", "ส่งไม่สำเร็จ");
    }
}
/* =========== SECTION 7: แสดงผลรายงาน =========== */
function renderDay(selectedDate) {
    let dInp = selectedDate || ($("dateInp")?.value || new Date().toISOString().split('T')[0]);
    if ($("dateInp")) $("dateInp").value = dInp;
    
    let allRec = db.filter(r => r.date === dInp);
    const dayShortArray = typeof DAY_SHORT !== 'undefined' ? DAY_SHORT : ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];
    const dayName = dayShortArray[new Date(dInp).getDay()];
    
    if (allRec.length === 0 && typeof archives !== 'undefined') {
        const ar = archives.find(a => a.date === dInp);
        if (ar?.details) allRec = ar.details;
    }
    
    const isHoliday = allRec.some(r => r.type && String(r.type).toUpperCase() === 'HOLIDAY');
    
    // Safety check สำหรับ Share Config
    const c = typeof getShareConfig === 'function' 
        ? getShareConfig() 
        : { perc: Number(conf?.perc) || 0, guar: Number(conf?.guar) || 0 };
        
    let tot = 0, trans = 0, cash = 0, tips = 0;
    let calcB = 0, calcS = 0, cust = 0, cNew = 0, cReg = 0, cOff = 0;
    const stats = {};
    let listHtml = "";
    
    allRec.slice().sort((a, b) => (a.time || '').localeCompare(b.time || '')).forEach((r, i) => {
        const p = parseFloat(r.price) || 0;
        const t = parseFloat(r.tip) || 0;
        const rType = r.type ? String(r.type).toUpperCase().trim() : '';
        const curSvcs = Array.isArray(r.svcs) ? r.svcs : [];
        const cType = r.custType || 'none';
        const tShow = r.endTime ? `${r.time}-${r.endTime}` : r.time;
        const isFree = /^Free/.test(r.pay);
        
        tot += p; 
        tips += t;
        
        if (r.barberShare !== undefined && r.shopShare !== undefined) {
            calcB += r.barberShare; 
            calcS += r.shopShare;
        } else if (typeof calcShares === 'function') {
            const sh = calcShares(p, cType, isFree);
            calcB += sh.b; 
            calcS += sh.s;
        }
        
        // แยกประเภทการชำระเงินเพื่อรวมยอดเงินสด/เงินโอน
        if (r.pay === 'Mix') {
            const pc = parseFloat(r.payCash) || 0;
            const pt = parseFloat(r.payTrans) || 0;
            trans += pt; 
            cash += pc; // ใช้ยอด payCash โดยตรง
        } else if (r.pay === 'Trans' || r.pay === 'โอน' || r.pay === 'FreeTrans' || r.pay === 'Free-Trans') {
            trans += (p + t);
        } else { 
            cash += (r.payCash !== undefined ? parseFloat(r.payCash) : (p + t)); 
        }
        
        if (rType !== 'HOLIDAY' && rType !== 'GUARANTEE') {
            if (curSvcs.length > 0 || cType === 'offsite') {
                cust++;
                if (cType === 'new') cNew++;
                if (cType === 'regular') cReg++;
                if (cType === 'offsite') cOff++;
            }
            curSvcs.forEach(s => { if (s) stats[s] = (stats[s] || 0) + 1; });
        }
        
        let custTag = "";
        if (cType === 'offsite') custTag = ` <span style="background:var(--danger, #ef4444);color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;font-weight:bold;">🚗 นอกสถานที่</span>`;
        else if (cType === 'new') custTag = ` <span style="background:var(--success, #22c55e);color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;">🌟 ใหม่</span>`;
        else if (cType === 'regular') custTag = ` <span style="background:var(--warning, #f59e0b);color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;">📌 ประจำ</span>`;
        
        let payIcon = (r.pay === 'Trans' || r.pay === 'โอน') ? '📱' : '💶';
        let mixText = "";
        if (r.pay === 'Mix') {
            payIcon = '🌓';
            mixText = `<br><small style="color:var(--text-muted, #64748b);font-size:10px;">(สด:${r.payCash || 0}/โอน:${r.payTrans || 0})</small>`;
        }
        
        listHtml += `
        <div class="history-row" style="padding:15px;border-bottom:1px solid var(--border-color, #f1f5f9);background:var(--bg-card, #fff);">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:28px;height:28px;background:var(--bg-sub, #f8fafc);border:1px solid var(--border-color, #e2e8f0);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--text-muted, #64748b);">${i+1}</div>
                    <div>
                        <div style="font-weight:800;font-size:14px;color:var(--text-main, #1e293b);">
                            <span style="color:var(--text-muted, #64748b);">[${tShow}]</span> ${curSvcs.join(' + ') || 'บริการทั่วไป'}${custTag}
                        </div>
                        ${t ? `<div style="display:flex;gap:8px;margin-top:2px;"><small style="color:var(--accent-pink, #be185d);font-weight:700;">🔹 ทิป: ฿${t}</small></div>` : ''}
                    </div>
                </div>
                <div style="text-align:right;">
                    <b style="font-size:16px;color:var(--text-main, #1e293b);">${payIcon} ฿${p}${t ? ` <span style="color:var(--accent-pink, #be185d);">(+${t})</span>` : ''}</b>
                    ${mixText}
                    <div style="margin-top:4px;">
                        <span style="font-size:11px;font-weight:700;color:var(--danger, #ef4444);cursor:pointer;" onclick="delRec(${r.id})">ลบ</span>
                    </div>
                </div>
            </div>
        </div>`;
    });
    
    const bEarn = isHoliday ? 0 : Math.max(calcB, c.guar || 0) + tips;
    const sEarn = isHoliday ? 0 : calcS;
    const settle = isHoliday ? 0 : cash - bEarn;
    
    if ($("dTotal")) $("dTotal").innerText = tot.toLocaleString();
    if ($("dTrans")) $("dTrans").innerText = trans.toLocaleString();
    if ($("dCash")) $("dCash").innerText = cash.toLocaleString();
    if ($("dBarber")) $("dBarber").innerText = Math.floor(bEarn).toLocaleString();
    if ($("dShop")) $("dShop").innerText = Math.floor(sEarn).toLocaleString();
    
    if ($("dCounts")) {
        if (isHoliday) $("dCounts").innerHTML = "<span style='color:var(--text-muted, #64748b);'>🏖️ วันหยุด</span>";
        else if (allRec.length === 0) $("dCounts").innerHTML = "<span style='color:var(--text-muted, #94a3b8);'>ไม่มีข้อมูล</span>";
        else {
            let detail = "";
            if (cNew + cReg + cOff > 0) {
                detail = `<div style="margin-top:4px;padding-top:4px;border-top:1px dashed var(--border-color, #e2e8f0);font-size:12px;">
                    <span style="color:var(--success, #22c55e);">🌟 ใหม่: ${cNew}</span> |
                    <span style="color:var(--warning, #f59e0b);">📌 ประจำ: ${cReg}</span> |
                    <span style="color:var(--danger, #ef4444);">🚗 นอกสถานที่: ${cOff}</span>
                </div>`;
            }
            $("dCounts").innerHTML = `<b style="font-size:16px;">ลูกค้า: ${cust} คน</b>${detail}`;
        }
    }
    
    let sH = `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">`;
    const extraArr = typeof EXTRA_LIST !== 'undefined' ? EXTRA_LIST : [];
    const cleanExtras = extraArr.map(s => s.trim().toLowerCase());
    
    Object.entries(stats).forEach(([k, v]) => {
        const isExtra = cleanExtras.includes(k.trim().toLowerCase());
        const bg = isExtra ? 'var(--badge-extra-bg, #e0f2fe)' : 'var(--primary, #4338ca)';
        const color = isExtra ? 'var(--badge-extra-color, #0369a1)' : '#fff';
        sH += `<span style="background:${bg};color:${color};padding:3px 10px;border-radius:6px;font-size:10px;font-weight:${isExtra ? 700 : 800};">${k}: ${v}</span>`;
    });
    if ($("dServiceStats")) $("dServiceStats").innerHTML = sH + `</div>`;
    
    let txt = "", statusColor = "", icon = "";
    if (isHoliday) { txt = "วันหยุด"; statusColor = "var(--primary, #1e40af)"; icon = "🏖️"; }
    else if (allRec.length === 0) { txt = "รอข้อมูล..."; statusColor = "var(--text-muted, #64748b)"; icon = "📝"; }
    else if (tot === 0) { txt = "ร้านจ่ายประกัน"; statusColor = "var(--info, #0369a1)"; icon = "🛡️"; }
    else if (settle > 0) { txt = `ช่างคืนร้าน ฿${Math.floor(settle).toLocaleString()}`; statusColor = "var(--danger, #b91c1c)"; icon = "🥷"; }
    else if (settle < 0) { txt = `ร้านคืนช่าง ฿${Math.floor(Math.abs(settle)).toLocaleString()}`; statusColor = "var(--primary, #4338ca)"; icon = "🏠"; }
    else { txt = "ยอดพอดี"; statusColor = "var(--success, #15803d)"; icon = "✅"; }
    
    const actionBox = $("settleBarContainer");
    if (actionBox) {
        actionBox.style.display = "flex"; 
        actionBox.style.gap = "10px";
        actionBox.innerHTML = `
            <div id="settleBar" style="flex:8;height:55px;background:var(--bg-card, #fff);display:flex;align-items:center;justify-content:center;border-radius:18px;font-weight:800;font-size:15px;color:${statusColor};border:1px solid var(--border-color, #e2e8f0);">
                <span style="margin-right:8px;font-size:18px;">${icon}</span> ${txt}
            </div>
            <button id="btnSubmitSend" onclick="saveAndGo('${dInp}', ${tot})" 
                style="flex:2.2;height:55px;background:var(--brand-orange, #ff6f00);color:#fff;border-radius:18px;border:none;font-size:20px;cursor:pointer;">
                <i class="fas fa-paper-plane"></i>
            </button>`;
    }
    
    const dList = $("dailyList");
    if (dList) {
        const dp = dInp.split('-');
        const dBE = `${dp[2]}/${dp[1]}/${(parseInt(dp[0]) + 543).toString().slice(-2)}`;
        dList.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--bg-card, #fff);border-radius:16px;border-bottom:2px solid var(--border-color, #f1f5f9);margin-bottom:10px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <b style="font-size:14px;color:var(--text-main, #1e293b);">รายงานวันที่</b>
                    <div style="position:relative;background:var(--bg-sub, #eef2ff);padding:6px 12px;border-radius:10px;border:1px solid var(--border-color, #e0e7ff);min-width:140px;height:36px;">
                        <span style="font-size:14px;font-weight:700;color:var(--primary, #4338ca);">${dayName} ${dBE}</span>
                        <input type="date" value="${dInp}" onchange="renderDay(this.value)" 
                            style="position:absolute;opacity:0;left:0;top:0;width:100%;height:100%;cursor:pointer;">
                    </div>
                    <button onclick="deleteArchiveDate('${dInp}')" title="ลบข้อมูลวันนี้"
                        style="background:var(--danger-light, #fde8e8);color:var(--danger, #e11d48);border:none;width:44px;height:44px;border-radius:12px;cursor:pointer;font-size:18px;">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                <div style="display:flex;align-items:center;">
                    <i class="fab fa-line" style="color:#06c755;font-size:36px;cursor:pointer;" onclick="shareLine()"></i>
                </div>
            </div>
            <div style="padding:0 5px;">
                ${isHoliday ? `<center style='padding:30px;color:var(--text-muted, #64748b);'>🏖️ วันหยุด (${dBE})</center>` : (listHtml || "<center style='padding:30px;color:var(--text-muted, #94a3b8);'>ไม่มีข้อมูล</center>")}
            </div>`;
    }
}
/* =========== SECTION 8: สถานะบัญชี & ประวัติ & ประกัน & วันหยุด =========== */
function loadAccountStatus() {
    let todayKey = $("accDate")?.value;
    if (!todayKey) {
        const n = new Date();
        todayKey = `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
    }
    
    // ดึงยอดเคลียร์ของวันนี้จาก archives
    const todayData = Array.isArray(archives) ? archives.find(a => a.date === todayKey) : null;
    const todaySettle = todayData ? Number(todayData.settle) || 0 : 0;
    
    // ยอดยกมาจากบัญชีหลัก (ลบยอดวันนี้ออกชั่วคราวเพื่อไม่ให้คิดซ้ำ)
    const oldSettle = Number(account?.balance || 0);
    const totalBalance = oldSettle + todaySettle;
    
    if ($("accTodayVal")) $("accTodayVal").innerText = `฿${Math.abs(todaySettle).toLocaleString()}`;
    const ov = $("accOldVal");
    if (ov) {
        if (oldSettle < 0) ov.innerHTML = `<small style="color:var(--danger, #dc2626);">ช่างค้าง:</small> ฿${Math.abs(oldSettle).toLocaleString()}`;
        else if (oldSettle > 0) ov.innerHTML = `<small style="color:var(--success, #16a34a);">ร้านค้าง:</small> ฿${oldSettle.toLocaleString()}`;
        else ov.innerText = `฿0`;
    }
    if ($("accTotalVal")) $("accTotalVal").innerText = `฿${Math.abs(totalBalance).toLocaleString()}`;
    if ($("accDateLabel")) {
        try {
            $("accDateLabel").innerText = new Date(todayKey).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch(e) {
            $("accDateLabel").innerText = todayKey;
        }
    }
    
    if (typeof updateStatusUI === 'function') updateStatusUI(totalBalance);
}

function updateStatusUI(net) {
    const badge = $("statusBadge");
    const light = $("accLight");
    
    let color = net < 0 ? "var(--danger, #dc2626)" : (net > 0 ? "var(--primary, #1e3a8a)" : "var(--success, #16a34a)");
    let bgColor = net < 0 ? "var(--danger-light, #fef2f2)" : (net > 0 ? "var(--primary-light, #eff6ff)" : "var(--success-light, #f0fdf4)");
    let txt = net < 0 ? "🥷 ช่างคืนร้าน" : (net > 0 ? "🏠 ร้านคืนช่าง" : "✅ ยอดลงตัว");
    
    if (badge) {
        badge.innerText = txt;
        badge.style.background = bgColor;
        badge.style.color = color;
    }
    if (light) { 
        light.style.background = color; 
        light.style.boxShadow = `0 0 12px ${color}`; 
    }
}

async function clearAccount() {
    const todayKey = $("accDate")?.value || new Date().toISOString().split('T')[0];
    const todayData = Array.isArray(archives) ? archives.find(a => a.date === todayKey) : null;
    const todaySettle = todayData ? Number(todayData.settle) || 0 : 0;
    const oldSettle = Number(account?.balance) || 0;
    const net = oldSettle + todaySettle;
    
    if (net === 0) { 
        if (typeof notify === 'function') notify("error", "แจ้งเตือน", "ยอดคงค้างเป็นศูนย์แล้ว"); 
        return; 
    }
    
    const note = $("accNote")?.value?.trim() || "สรุปยอดบัญชีค้างชำระ";
    
    let isConfirmed = false;
    if (typeof Swal !== 'undefined') {
        const r = await Swal.fire({
            title: 'ยืนยันการเคลียร์ยอด',
            text: `เคลียร์ยอดค้าง ${Math.abs(net).toLocaleString()} บาท?`,
            icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#22c55e', confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก'
        });
        isConfirmed = r.isConfirmed;
    } else {
        isConfirmed = confirm(`เคลียร์ยอดค้าง ${Math.abs(net).toLocaleString()} บาท?`);
    }
    
    if (!isConfirmed) return;
    
    if (!account) account = { balance: 0, logs: [] };
    if (!account.logs) account.logs = [];
    
    // บันทึก Log การเคลียร์
    account.logs.unshift({ 
        id: Date.now(),
        date: todayKey, 
        amount: net, 
        note: note 
    });
    
    account.balance = 0;
    if (todayData) todayData.settle = 0;
    
    if (typeof saveDB === 'function') saveDB();
    if (typeof notify === 'function') notify("success", "สำเร็จ", "เคลียร์ยอดเรียบร้อย");
    if ($("accNote")) $("accNote").value = "";
    
    if (typeof loadAccountHistory === 'function') loadAccountHistory();
    loadAccountStatus();
}

function loadAccountHistory() {
    const hc = $("accHistory"); if (!hc) return;
    if (!account?.logs || account.logs.length === 0) {
        hc.innerHTML = '<center style="padding:30px;color:var(--text-muted, #94a3b8);font-size:13px;">ไม่มีประวัติ</center>';
        return;
    }
    
    hc.innerHTML = account.logs.map((l, i) => {
        const isDebt = l.amount < 0;
        const color = isDebt ? 'var(--danger, #dc2626)' : 'var(--primary, #1e3a8a)';
        const sign = l.amount > 0 ? '+' : '';
        return `
        <div style="padding:12px 15px;border-bottom:1px solid var(--border-color, #f1f5f9);display:flex;justify-content:space-between;align-items:center;background:var(--bg-card, #fff);">
            <div style="flex:1;">
                <b style="font-size:12px;color:var(--text-muted, #64748b);">${l.date}</b><br>
                <span style="font-size:13.5px;font-weight:700;color:var(--text-main, #1e293b);">${l.note}</span>
            </div>
            <div style="text-align:right;">
                <b style="font-size:14px;color:${color};display:block;margin-bottom:4px;">${sign}฿${Number(l.amount).toLocaleString()}</b>
                <small style="color:var(--danger, #ef4444);font-weight:700;cursor:pointer;" onclick="deleteAccountLog(${i})">ลบ</small>
            </div>
        </div>`;
    }).join('');
}

async function deleteAccountLog(index) {
    let isConfirmed = false;
    if (typeof Swal !== 'undefined') {
        const r = await Swal.fire({
            title: 'ยืนยันลบ', text: 'ลบรายการนี้ใช่หรือไม่?', icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก'
        });
        isConfirmed = r.isConfirmed;
    } else {
        isConfirmed = confirm('ลบรายการนี้ใช่หรือไม่?');
    }
    
    if (!isConfirmed) return;
    
    const removed = account.logs[index];
    if (removed) {
        // คืนค่า balance กลับก่อนทำการลบ Log
        account.balance = (account.balance || 0) + (Number(removed.amount) || 0);
        account.logs.splice(index, 1);
    }
    
    if (typeof saveDB === 'function') saveDB();
    if (typeof notify === 'function') notify("success", "สำเร็จ", "ลบเรียบร้อย");
    
    loadAccountHistory(); 
    loadAccountStatus();
}

function openHistoryModal() {
    const list = $("accHistoryModalList") || $("accHistory"); 
    if (!list) return;
    
    if (!account?.logs || account.logs.length === 0) {
        list.innerHTML = "<center style='padding:20px;color:var(--text-muted, #94a3b8)'>ยังไม่มีประวัติ</center>";
    } else {
        list.innerHTML = account.logs.map(l => {
            const isDebt = l.amount < 0;
            const color = isDebt ? 'var(--danger, #ef4444)' : 'var(--success, #22c55e)';
            return `
            <div style="padding:10px;border-bottom:1px solid var(--border-color, #eee);background:var(--bg-card, #fff);">
                <b style="color:var(--text-main, #1e293b);">${l.date}</b> | <span style="color:var(--text-muted, #64748b);">${l.note}</span><br>
                <span style="color:${color};font-weight:700;">฿${Number(l.amount).toLocaleString()}</span>
            </div>`;
        }).join("");
    }
    
    if ($("historyModal")) $("historyModal").style.display = "flex";
}

function closeHistoryModal() {
    if ($("historyModal")) $("historyModal").style.display = "none";
}

async function handleInsurance() {
    const d = $("dateInp")?.value || new Date().toISOString().split('T')[0];
    const g = parseInt(conf?.guar) || 0;
    
    if (g <= 0) { 
        if (typeof notify === 'function') notify("error", "ข้อมูลไม่ครบ", "ตั้งค่าเงินประกันก่อน"); 
        return; 
    }
    if (db.some(r => r.date === d && r.type === "GUARANTEE_CLAIM")) {
        if (typeof notify === 'function') notify("error", "แจ้งเตือน", "เปิดประกันวันนี้แล้ว"); 
        return;
    }
    
    let isConfirmed = false;
    if (typeof Swal !== 'undefined') {
        const r = await Swal.fire({
            title: 'ยืนยันเปิดประกัน', text: `จำนวน ฿${g.toLocaleString()} วันที่ ${d}?`,
            icon: 'question', showCancelButton: true, confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก'
        });
        isConfirmed = r.isConfirmed;
    } else {
        isConfirmed = confirm(`ยืนยันเปิดประกัน จำนวน ฿${g.toLocaleString()} วันที่ ${d}?`);
    }
    
    if (isConfirmed) {
        db.push({ id: Date.now(), date: d, time: "00:00", svcs: ["🛡️ ประกันรายวัน"], price: g, pay: "N/A", type: "GUARANTEE_CLAIM" });
        if (typeof saveDB === 'function') saveDB(); 
        if (typeof notify === 'function') notify("success", "สำเร็จ", `เปิดประกัน ฿${g.toLocaleString()}`); 
        if (typeof renderDay === 'function') renderDay(d);
    }
}

async function handleHoliday() {
    const d = $("dateInp")?.value || new Date().toISOString().split('T')[0];
    if (db.some(r => r.date === d && r.type === "HOLIDAY")) {
        if (typeof notify === 'function') notify("error", "แจ้งเตือน", "บันทึกวันหยุดแล้ว"); 
        return;
    }
    
    let isConfirmed = false;
    if (typeof Swal !== 'undefined') {
        const r = await Swal.fire({
            title: 'ยืนยันบันทึกวันหยุด', text: `วันที่ ${d}?`, icon: 'warning',
            showCancelButton: true, confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก'
        });
        isConfirmed = r.isConfirmed;
    } else {
        isConfirmed = confirm(`ยืนยันบันทึกวันหยุด วันที่ ${d}?`);
    }
    
    if (isConfirmed) {
        db.push({ id: Date.now(), date: d, time: "00:00", svcs: ["🏖️ วันหยุด"], price: 0, pay: "N/A", type: "HOLIDAY", off: true });
        if (typeof saveDB === 'function') saveDB(); 
        if (typeof notify === 'function') notify("success", "สำเร็จ", "บันทึกวันหยุดเรียบร้อย"); 
        if (typeof renderDay === 'function') renderDay(d);
    }
}
/* =========== SECTION 9: รายงานเดือน, Excel, เปรียบเทียบ, สำรอง, แชร์ =========== */
function loadHistDaily() {
    const d = $("histDate")?.value; 
    if (!d) return;
    
    const f = Array.isArray(archives) ? archives.find(a => a.date === d) : null;
    if (!f) {
        if (typeof notify === 'function') notify("error", "แจ้งเตือน", "ไม่พบข้อมูลประจำวันที่เลือก");
        else alert("ไม่พบข้อมูล");
        return;
    }
    
    let cashTotal = Number(f.cash) || 0;
    let transTotal = Number(f.trans) || 0;
    let totalRevenue = cashTotal + transTotal;
    let customerCount = f.count || (f.details ? f.details.length : 0);
    
    // Safety check สำหรับ Share Config
    const c = typeof getShareConfig === 'function' 
        ? getShareConfig() 
        : { perc: Number(conf?.perc) || 0, guar: Number(conf?.guar) || 0 };
        
    let calcB = 0, calcS = 0, totalTips = 0;
    const details = Array.isArray(f.details) ? f.details : [];
    
    if (details.length > 0) {
        details.forEach(r => {
            const p = Number(r.price) || 0;
            const t = Number(r.tip) || 0;
            const cType = r.custType || 'none';
            const isFree = /^Free/.test(r.pay);
            totalTips += t;
            
            if (r.barberShare !== undefined && r.shopShare !== undefined) { 
                calcB += Number(r.barberShare); 
                calcS += Number(r.shopShare); 
            } else if (typeof calcShares === 'function') {
                const sh = calcShares(p, cType, isFree);
                calcB += sh.b; 
                calcS += sh.s;
            }
        });
    } else { 
        calcB = Number(f.barber) || 0; 
        calcS = Number(f.shop) || 0; 
    }
    
    const guarantee = Number(c.guar) || 0;
    const barberEarn = Math.floor(Math.max(calcB, guarantee) + totalTips);
    const shopEarn = Math.floor(calcS);
    
    const svcCounts = {};
    details.forEach(r => {
        const services = Array.isArray(r.svcs) ? r.svcs : (r.svcs ? [r.svcs] : []);
        if (services.length > 0) {
            services.forEach(s => { if (s) svcCounts[s] = (svcCounts[s] || 0) + 1; });
        } else if (r.custType === 'offsite') {
            svcCounts['ตัดนอกสถานที่'] = (svcCounts['ตัดนอกสถานที่'] || 0) + 1;
        }
    });
    
    const svcHTML = Object.entries(svcCounts).map(([name, count]) => `
        <div style="background:var(--bg-sub, rgba(203,213,225,0.1));padding:6px 12px;border-radius:10px;font-size:12px;color:var(--text-main, #cbd5e1);font-weight:600;display:inline-block;margin:3px;border:1px solid var(--border-color, rgba(255,255,255,0.1));">
            ${name} <span style="opacity:0.7;margin-left:4px;">x${count}</span>
        </div>`).join("");
    
    let settleHTML = "";
    if (cashTotal > barberEarn) {
        const toShop = cashTotal - barberEarn;
        settleHTML = `<div style="background:var(--warning-light, rgba(251,146,60,0.1));padding:16px;border-radius:16px;margin-bottom:20px;text-align:center;border:1px solid var(--warning, rgba(251,146,60,0.3));">
            <div style="font-size:16px;color:var(--warning, #fdba74);font-weight:600;">🕵️‍♀️ ช่างคืนร้าน</div>
            <div style="font-size:24px;color:var(--brand-orange, #fb923c);font-weight:800;">฿${toShop.toLocaleString()}</div></div>`;
    } else if (barberEarn > cashTotal) {
        const toBarber = barberEarn - cashTotal;
        settleHTML = `<div style="background:var(--primary-light, rgba(56,189,248,0.1));padding:16px;border-radius:16px;margin-bottom:20px;text-align:center;border:1px solid var(--primary, rgba(56,189,248,0.3));">
            <div style="font-size:16px;color:var(--primary, #7dd3fc);font-weight:600;">🏠 ร้านคืนช่าง</div>
            <div style="font-size:24px;color:var(--primary, #38bdf8);font-weight:800;">฿${toBarber.toLocaleString()}</div></div>`;
    } else {
        settleHTML = `<div style="background:var(--success-light, rgba(34,197,94,0.1));padding:16px;border-radius:16px;margin-bottom:20px;text-align:center;border:1px solid var(--success, rgba(34,197,94,0.3));">
            <div style="font-size:16px;color:var(--success, #86efac);font-weight:600;">✅ ยอดเงินพอดี</div>
            <div style="font-size:20px;color:var(--success, #4ade80);font-weight:800;">฿0</div></div>`;
    }
    
    const rows = details.slice().sort((a, b) => (a.time || "").localeCompare(b.time || "")).map((r, i) => {
        const p = Number(r.price) || 0;
        const t = Number(r.tip) || 0;
        const fullTime = (r.time && r.endTime) ? `${r.time}-${r.endTime}` : (r.time || "--:--");
        let payText = "";
        if (r.pay === 'Mix') payText = `🌓 ผสม (สด:${Number(r.payCash || 0).toLocaleString()}/โอน:${Number(r.payTrans || 0).toLocaleString()})`;
        else payText = (r.pay === 'Trans' || r.pay === 'โอน') ? '📱 โอน' : '💶 เงินสด';
        
        const serviceText = Array.isArray(r.svcs) && r.svcs.length > 0 ? r.svcs.join(' + ') : 'ตัดนอกสถานที่';
        let custTag = "";
        if (r.custType === 'offsite') custTag = `<span style="background:var(--danger, #ef4444);color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;margin-left:6px;font-weight:bold;">🚗 นอกสถานที่</span>`;
        else if (r.custType === 'new') custTag = `<span style="background:var(--success, #22c55e);color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;margin-left:6px;">🌟 ใหม่</span>`;
        else if (r.custType === 'regular') custTag = `<span style="background:var(--warning, #f59e0b);color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;margin-left:6px;">📌 ประจำ</span>`;
        
        return `
        <div style="padding:14px;background:var(--bg-card, rgba(255,255,255,0.03));border:1px solid var(--border-color, rgba(255,255,255,0.08));border-radius:16px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:12px;">
                <div style="width:28px;height:28px;background:var(--bg-sub, rgba(255,255,255,0.08));border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:var(--text-muted, #94a3b8);">${i + 1}</div>
                <div>
                    <div style="font-weight:700;font-size:14px;color:var(--text-main, #f8fafc);">${serviceText}${custTag}</div>
                    <div style="font-size:13px;color:var(--text-muted, #94a3b8);font-weight:500;margin-top:2px;">⏱ ${fullTime} • ${payText}</div>
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:16px;font-weight:800;color:var(--text-main, #f8fafc);">฿${p.toLocaleString()}</div>
                ${t > 0 ? `<div style="font-size:12px;font-weight:600;color:var(--accent-pink, #f472b6);">+ Tip ฿${t.toLocaleString()}</div>` : ''}
            </div>
        </div>`;
    }).join("");
    
    let displayTitleDate = d;
    try {
        const monthNames = typeof MONTH_SHORT !== 'undefined' ? MONTH_SHORT : ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
        const dayNames = typeof DAY_SHORT !== 'undefined' ? DAY_SHORT : ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];
        
        const [y, m, dayNum] = d.split('-').map(Number);
        const dateObj = new Date(`${y}-${String(m).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}T00:00:00`);
        displayTitleDate = `${dayNum} ${monthNames[m - 1]} ${(y + 543).toString().slice(-2)} (${dayNames[dateObj.getDay()]})`;
    } catch (e) { 
        displayTitleDate = d; 
    }
    
    const target = $("dailyReportInlineContent") || $("monthlyContent1");
    if (target) {
        target.innerHTML = `
        <div style="font-family:inherit;background:var(--bg-card, #0f172a);padding:20px;color:var(--text-main, #f1f5f9);border-radius:16px;border:1px solid var(--border-color, transparent);">
            <div style="text-align:center;margin-bottom:20px;">
                <div style="font-size:18px;font-weight:800;color:var(--primary, #38bdf8);">รายงาน ${displayTitleDate}</div>
                <div style="font-size:14px;color:var(--text-muted, #94a3b8);font-weight:600;margin-top:10px;">ยอดเงินรวม</div>
                <div style="font-size:40px;font-weight:900;color:var(--text-main, #ffffff);margin-top:2px;">฿${totalRevenue.toLocaleString()}</div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;">
                <div style="background:var(--success-dark, #14532d);padding:12px 6px;border-radius:14px;text-align:center;color:#fff;">
                    <div style="font-size:12px;opacity:0.8;font-weight:600;">💶 เงินสด</div>
                    <div style="font-size:15px;font-weight:800;">฿${cashTotal.toLocaleString()}</div>
                </div>
                <div style="background:var(--primary-dark, #1e3a8a);padding:12px 6px;border-radius:14px;text-align:center;color:#fff;">
                    <div style="font-size:12px;opacity:0.8;font-weight:600;">📱 เงินโอน</div>
                    <div style="font-size:15px;font-weight:800;">฿${transTotal.toLocaleString()}</div>
                </div>
                <div style="background:var(--warning-dark, #78350f);padding:12px 6px;border-radius:14px;text-align:center;color:#fff;">
                    <div style="font-size:12px;opacity:0.8;font-weight:600;">👤 ลูกค้า</div>
                    <div style="font-size:15px;font-weight:800;">${customerCount}</div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
                <div style="background:var(--bg-sub, rgba(255,255,255,0.05));border:1px solid var(--border-color, rgba(255,255,255,0.1));padding:12px;border-radius:14px;text-align:center;">
                    <div style="font-size:13px;color:var(--text-muted, #94a3b8);font-weight:600;">ยอดเงินช่าง</div>
                    <div style="font-size:18px;font-weight:800;color:var(--text-main, #f8fafc);">฿${barberEarn.toLocaleString()}</div>
                </div>
                <div style="background:var(--bg-sub, rgba(255,255,255,0.05));border:1px solid var(--border-color, rgba(255,255,255,0.1));padding:12px;border-radius:14px;text-align:center;">
                    <div style="font-size:13px;color:var(--text-muted, #94a3b8);font-weight:600;">ยอดเงินร้าน</div>
                    <div style="font-size:18px;font-weight:800;color:var(--text-main, #f8fafc);">฿${shopEarn.toLocaleString()}</div>
                </div>
            </div>
            ${settleHTML}
            <div style="margin-bottom:20px;">
                <div style="font-size:13px;color:var(--text-muted, #94a3b8);font-weight:700;text-transform:uppercase;margin-bottom:8px;text-align:center;">สรุปประเภทงาน</div>
                <div style="text-align:center;">${svcHTML || '<span style="color:var(--text-muted, #64748b);font-size:13px;">ไม่มีข้อมูล</span>'}</div>
            </div>
            <div style="font-weight:800;font-size:15px;color:var(--text-main, #f8fafc);margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                <div style="width:4px;height:16px;background:var(--text-muted, #cbd5e1);border-radius:2px;"></div>รายละเอียดงาน
            </div>
            <div>${rows || '<div style="text-align:center;color:var(--text-muted, #64748b);padding:20px;">ไม่มีรายการ</div>'}</div>
        </div>`;
    }
}

// ผูกตัวเลือกเดือน (ป้องกัน Event Loop ซ้ำซ้อน)
document.addEventListener("DOMContentLoaded", () => {
    const pickers = ["monthlyReportPicker", "histMonth"];
    let isSyncing = false;
    
    pickers.forEach(id => {
        const el = document.getElementById(id); 
        if (!el) return;
        
        el.addEventListener("change", (e) => {
            if (isSyncing) return;
            isSyncing = true;
            const val = e.target.value;
            
            pickers.forEach(otherId => {
                const other = document.getElementById(otherId);
                if (other && other !== e.target) other.value = val;
            });
            
            if (typeof loadHistMonth === 'function') loadHistMonth();
            if (typeof generateMonthlyReport === 'function') generateMonthlyReport(val);
            
            isSyncing = false;
        });
    });
});
function loadHistMonth() {
    const picker = $("monthlyReportPicker") || $("histMonth");
    let m = picker ? picker.value : '';
    if (!m) {
        const now = new Date();
        m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (picker) picker.value = m;
    }
    if (!Array.isArray(archives)) return;
    
    let [y, mNum] = m.split('-').map(Number);
    const searchYear = y > 2500 ? y - 543 : y;
    const targetPrefix = `${searchYear}-${String(mNum).padStart(2, '0')}`;
    
    // Safety check สำหรับตัวแปร Global
    const monthNames = typeof MONTH_NAMES !== 'undefined' ? MONTH_NAMES : ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    const dayNames = typeof DAY_NAMES !== 'undefined' ? DAY_NAMES : ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
    const hairList = typeof HAIR_LIST !== 'undefined' ? HAIR_LIST : [];
    
    const monthThaiName = `${monthNames[mNum - 1] || ''} ${searchYear + 543}`;
    
    const filtered = archives.filter(a => a.date && a.date.startsWith(targetPrefix));
    if (!filtered.length) {
        if ($("shopTotalMonth")) $("shopTotalMonth").innerText = "฿0";
        if (typeof notify === 'function') notify("error", "ไม่พบข้อมูล", `ไม่มีข้อมูลเดือน ${monthThaiName}`);
        if (typeof generateMonthlyReport === 'function') {
            generateMonthlyReport(m, 0, 0, 0, 0, 0, 0, {}, {}, {}, 0, 0, 0, 0);
        }
        return;
    }
    
    const c = typeof getShareConfig === 'function' ? getShareConfig() : { perc: 0, guar: 0 };
    let countNew = 0, countRegular = 0, countOffsite = 0;
    let monthTotal = 0, monthBarber = 0, monthCount = 0, monthGuarDays = 0;
    let hairStats = {}, serviceStats = {};
    let offDays = 0, workDays = 0;
    let weeklyData = {};
    
    filtered.forEach(day => {
        const [dYear, dMonth, dDay] = day.date.split('-').map(Number);
        const dObj = new Date(dYear, dMonth - 1, dDay);
        let wIdx = Math.ceil(dDay / 7); 
        if (wIdx > 5) wIdx = 5;
        const wKey = `สัปดาห์ที่ ${wIdx}`;
        
        if (!weeklyData[wKey]) {
            weeklyData[wKey] = { 
                customers: 0, workDays: 0, offDays: 0, zeroDays: 0, guarDays: 0,
                dailyCounts: [], countNew: 0, countRegular: 0, countOffsite: 0,
                popularHair: {}, popularService: {}, income: 0 
            };
        }
        
        if (day.off === true || day.type === "HOLIDAY") {
            offDays++; 
            weeklyData[wKey].offDays++; 
            return;
        }
        
        workDays++; 
        weeklyData[wKey].workDays++;
        
        let dailyIncome = Number(day.cash || 0) + Number(day.trans || 0);
        if (dailyIncome === 0 && day.total) dailyIncome = Number(day.total);
        
        let calcBarberShare = 0, totalTips = 0, dayCustomerCount = 0;
        
        if (day.details && Array.isArray(day.details) && day.details.length > 0) {
            day.details.forEach(d => {
                if (d.type === "SERVICE" || !d.type) {
                    monthCount++; 
                    dayCustomerCount++; 
                    weeklyData[wKey].customers++;
                    
                    const p = Number(d.price) || 0;
                    const t = Number(d.tip) || 0;
                    const cType = String(d.custType || "").toLowerCase().trim();
                    const isFree = /^Free/.test(d.pay);
                    totalTips += t;
                    
                    if (d.barberShare !== undefined) {
                        calcBarberShare += Number(d.barberShare);
                    } else if (typeof calcShares === 'function') {
                        const sh = calcShares(p, cType, isFree);
                        calcBarberShare += sh.b;
                    }
                    
                    if (cType === "new" || cType === "ใหม่") { 
                        countNew++; weeklyData[wKey].countNew++; 
                    } else if (cType === "regular" || cType === "ประจำ") { 
                        countRegular++; weeklyData[wKey].countRegular++; 
                    } else if (cType === "offsite" || cType === "นอกสถานที่") { 
                        countOffsite++; weeklyData[wKey].countOffsite++; 
                    }
                    
                    const svcs = Array.isArray(d.svcs) ? d.svcs : [d.svcs];
                    svcs.forEach(s => {
                        if (!s) return;
                        const cleanS = String(s).trim();
                        if (hairList.includes(cleanS)) {
                            hairStats[cleanS] = (hairStats[cleanS] || 0) + 1;
                            weeklyData[wKey].popularHair[cleanS] = (weeklyData[wKey].popularHair[cleanS] || 0) + 1;
                        } else {
                            serviceStats[cleanS] = (serviceStats[cleanS] || 0) + 1;
                            weeklyData[wKey].popularService[cleanS] = (weeklyData[wKey].popularService[cleanS] || 0) + 1;
                        }
                    });
                }
            });
        } else {
            calcBarberShare = Number(day.barber) || 0;
            dayCustomerCount = day.count || 0;
            monthCount += dayCustomerCount;
            weeklyData[wKey].customers += dayCustomerCount;
        }
        
        // คำนวณประกันรายได้เฉพาะเมื่อมีลูกค้าเข้าทำรายการ
        let isGuaranteeDay = false;
        const guarAmount = Number(c.guar) || 0;
        
        if (guarAmount > 0 && calcBarberShare < guarAmount && dayCustomerCount > 0) {
            isGuaranteeDay = true;
        } else if (day.isGuarantee || day.guarantee) {
            isGuaranteeDay = true;
        }
        
        if (isGuaranteeDay) { 
            monthGuarDays++; 
            weeklyData[wKey].guarDays++; 
        }
        
        // ยอดรวมส่วนแบ่งช่าง (ประกันจะคิดก็ต่อเมื่อมีลูกค้า และส่วนแบ่งปกติไม่ถึงเกณฑ์ประกัน)
        const effectiveBarberEarn = (dayCustomerCount > 0 && guarAmount > 0) 
            ? Math.max(calcBarberShare, guarAmount) 
            : calcBarberShare;
            
        const dailyBarber = Math.floor(effectiveBarberEarn + totalTips);
        
        monthTotal += dailyIncome; 
        monthBarber += dailyBarber;
        weeklyData[wKey].income += dailyIncome;
        
        if (dayCustomerCount === 0) weeklyData[wKey].zeroDays++;
        
        weeklyData[wKey].dailyCounts.push({
            dayName: dayNames[dObj.getDay()] || '', 
            count: dayCustomerCount,
            income: dailyIncome, 
            barberEarn: dailyBarber
        });
    });
    
    const avgCustomerPerDay = workDays > 0 ? (monthCount / workDays) : 0;
    
    if (typeof generateMonthlyReport === 'function') {
        generateMonthlyReport(
            m, monthTotal, monthBarber, monthCount, workDays, offDays,
            avgCustomerPerDay, weeklyData, hairStats, serviceStats, monthGuarDays,
            countNew, countRegular, countOffsite
        );
    }
}
function generateMonthlyReport(m, monthTotal, monthBarber, monthCount, workDays, offDays, avg, weeklyData, hairStats, serviceStats, guarDays, countNew, countRegular, countOffsite) {
    const c = typeof getShareConfig === 'function' ? getShareConfig() : { perc: 0, guar: 0 };
    const weekEntries = Object.entries(weeklyData || {});
    const weekKeys = Object.keys(weeklyData || {});
    const dayStats = {};
    let totalNew = 0, totalRegular = 0, totalOffsite = 0;
    
    weekEntries.forEach(([wk, data]) => {
        totalNew += (data.countNew || 0);
        totalRegular += (data.countRegular || 0);
        totalOffsite += (data.countOffsite || 0);
        if (Array.isArray(data.dailyCounts)) {
            data.dailyCounts.forEach(d => {
                const dn = d.dayName ? String(d.dayName).trim().split(' ')[0] : '';
                if (dn && d.count > 0) {
                    if (!dayStats[dn]) dayStats[dn] = { total: 0, count: 0 };
                    dayStats[dn].total += d.count; 
                    dayStats[dn].count++;
                }
            });
        }
    });
    
    const dayAverages = Object.entries(dayStats)
        .filter(([, data]) => data.count > 0)
        .map(([name, data]) => ({ name, avg: data.total / data.count }));
    
    const busiestDay = [...dayAverages].sort((a, b) => b.avg - a.avg)[0];
    const quietestDay = [...dayAverages].sort((a, b) => a.avg - b.avg)[0];
    const topIncomeWeek = weekEntries.length > 0 ? weekEntries.reduce((p, c) => ((c[1].income || 0) > (p[1].income || 0) ? c : p)) : null;
    const topCountWeek = weekEntries.length > 0 ? weekEntries.reduce((p, c) => 
        (((c[1].countNew || 0) + (c[1].countRegular || 0) + (c[1].countOffsite || 0)) > 
         ((p[1].countNew || 0) + (p[1].countRegular || 0) + (p[1].countOffsite || 0)) ? c : p)) : null;
    const topHair = Object.entries(hairStats || {}).sort((a, b) => b[1] - a[1])[0];
    const topService = Object.entries(serviceStats || {}).sort((a, b) => b[1] - a[1])[0];
    
    let maxNewWeek = "-", maxRegWeek = "-", maxOffsiteWeek = "-";
    weekKeys.forEach(wk => {
        const curr = weeklyData[wk];
        if (!curr) return;
        const n = curr.countNew || 0, r = curr.countRegular || 0, o = curr.countOffsite || 0;
        if (n > 0 && (maxNewWeek === "-" || n > (weeklyData[maxNewWeek]?.countNew || 0))) maxNewWeek = wk;
        if (r > 0 && (maxRegWeek === "-" || r > (weeklyData[maxRegWeek]?.countRegular || 0))) maxRegWeek = wk;
        if (o > 0 && (maxOffsiteWeek === "-" || o > (weeklyData[maxOffsiteWeek]?.countOffsite || 0))) maxOffsiteWeek = wk;
    });
    
    const renderStats = (statsObj, defaultColor) => {
        if (!statsObj || typeof statsObj !== 'object') return '<div style="font-size:12px;color:var(--text-muted, #94a3b8);opacity:0.6;text-align:center;">ไม่มีข้อมูล</div>';
        const entries = Object.entries(statsObj).sort((a, b) => b[1] - a[1]);
        if (entries.length === 0) return '<div style="font-size:12px;color:var(--text-muted, #94a3b8);opacity:0.6;text-align:center;">ไม่มีข้อมูล</div>';
        const maxVal = entries[0][1];
        return entries.map(([name, count]) => {
            const width = maxVal > 0 ? (count / maxVal) * 100 : 0;
            return `<div style="margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px;">
                    <span style="color:var(--text-main, #f8fafc);opacity:0.9;font-weight:500;">${name}</span>
                    <span style="font-weight:700;color:${defaultColor};">${count}</span>
                </div>
                <div style="width:100%;height:8px;background:var(--bg-sub, rgba(255,255,255,0.1));border-radius:10px;overflow:hidden;">
                    <div style="width:${width}%;height:100%;background:${defaultColor};border-radius:10px;transition:width 0.3s ease;"></div>
                </div></div>`;
        }).join("");
    };
    
    const insights = [
        `วันทำงาน: เปิดร้านทั้งหมด <b>${workDays} วัน</b> (หยุด ${offDays} วัน)`,
        `สัปดาห์ที่มีลูกค้ามากที่สุด: <b>${topCountWeek ? topCountWeek[0] : "-"}</b>`,
        topIncomeWeek ? `สัปดาห์ที่มีรายได้สูงสุด: <b>${topIncomeWeek[0]}</b> (฿${Number(topIncomeWeek[1].income || 0).toLocaleString()})` : `สัปดาห์ที่มีรายได้สูงสุด: <b>-</b>`
    ];
    
    if (totalNew > 0 || totalRegular > 0 || totalOffsite > 0) {
        insights.push(`โครงสร้างลูกค้า: <span style="color:var(--accent-purple, #c084fc);font-weight:bold;">ประจำ ${totalRegular || 0}</span> / <span style="color:var(--primary, #38bdf8);font-weight:bold;">ใหม่ ${totalNew || 0}</span> / <span style="color:var(--brand-orange, #f97316);font-weight:bold;">นอกสถานที่ ${totalOffsite || 0}</span>`);
        insights.push(`ลูกค้าเยอะสุดแยกกลุ่ม: ใหม่(<b>${maxNewWeek}</b>) | ประจำ(<b>${maxRegWeek}</b>) | นอกสถานที่(<b>${maxOffsiteWeek}</b>)`);
    }
    
    if (busiestDay && busiestDay.avg > 0) {
        const dayText = (!quietestDay || busiestDay.avg === quietestDay.avg)
            ? `ลูกค้าเข้าเยอะใน <b>วัน${busiestDay.name}</b>`
            : `ลูกค้าเข้าเยอะใน <b>วัน${busiestDay.name}</b> และน้อยใน <b>วัน${quietestDay.name}</b>`;
        insights.push(dayText);
    }
    
    insights.push(`ทรงผมยอดนิยม: <b>${topHair ? topHair[0] : '-'}</b> | บริการยอดนิยม: <b>${topService ? topService[0] : '-'}</b>`);
    
    const weeklyHtml = weekEntries.map(([wk, data]) => {
        const weeklyTotalIncome = Number(data.income) || 0;
        let sumBarber = 0;
        if (Array.isArray(data.dailyCounts)) {
            data.dailyCounts.forEach(d => { sumBarber += Number(d.barberEarn || 0); });
        }
        const wBarber = Math.floor(sumBarber);
        const wShop = Math.floor(Math.max(0, weeklyTotalIncome - wBarber));
        const sortedDays = Array.isArray(data.dailyCounts) ? [...data.dailyCounts].sort((a, b) => b.count - a.count) : [];
        const maxCount = sortedDays.length > 0 ? sortedDays[0].count : 0;
        const minCount = sortedDays.length > 0 ? sortedDays[sortedDays.length - 1].count : 0;
        const bestDay = maxCount > 0 ? `${sortedDays[0].dayName} (${maxCount})` : "-";
        const worstDay = (sortedDays.length > 1 && maxCount !== minCount) ? `${sortedDays[sortedDays.length - 1].dayName} (${minCount})` : "-";
        
        const popHair = Object.entries(data.popularHair || {}).sort((a, b) => b[1] - a[1]).slice(0, 2)
            .map(([name, count]) => `<span style="background:var(--accent-green-light, rgba(190,242,100,0.1));color:var(--accent-green, #bef264);padding:2px 8px;border-radius:8px;font-size:10px;border:1px solid var(--accent-green-border, rgba(190,242,100,0.2));margin-right:4px;">✂️ ${name} ${count}</span>`).join("");
        const popService = Object.entries(data.popularService || {}).sort((a, b) => b[1] - a[1]).slice(0, 2)
            .map(([name, count]) => `<span style="background:var(--primary-light, rgba(56,189,248,0.1));color:var(--primary, #38bdf8);padding:2px 8px;border-radius:8px;font-size:10px;border:1px solid var(--primary-border, rgba(56,189,248,0.2));margin-right:4px;">🧴 ${name} ${count}</span>`).join("");
        
        return `
        <div style="background:var(--bg-sub, rgba(15,23,42,0.6));border:1px solid var(--border-color, rgba(255,255,255,0.08));padding:16px;border-radius:22px;margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <div style="font-size:15px;font-weight:800;color:var(--text-main, #f8fafc);">🗓️ ${wk}</div>
                <div style="font-size:10px;color:var(--text-muted, #94a3b8);">เปิด ${data.workDays || 0} | หยุด ${data.offDays || 0}</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px;">
                <div style="background:var(--bg-card, rgba(255,255,255,0.03));border:1px solid var(--border-color, rgba(255,255,255,0.1));padding:6px 4px;border-radius:12px;text-align:center;">
                    <div style="font-size:9px;color:var(--text-muted, #94a3b8);margin-bottom:2px;">ยอดรวม</div>
                    <div style="font-size:13px;font-weight:800;color:var(--text-main, #fff);">฿${weeklyTotalIncome.toLocaleString()}</div>
                </div>
                <div style="background:var(--accent-green-light, rgba(190,242,100,0.05));border:1px solid var(--accent-green-border, rgba(190,242,100,0.2));padding:6px 4px;border-radius:12px;text-align:center;">
                    <div style="font-size:9px;color:var(--accent-green, #bef264);margin-bottom:2px;">ช่าง</div>
                    <div style="font-size:13px;font-weight:800;color:var(--accent-green, #bef264);">฿${wBarber.toLocaleString()}</div>
                </div>
                <div style="background:var(--primary-light, rgba(56,189,248,0.05));border:1px solid var(--primary-border, rgba(56,189,248,0.2));padding:6px 4px;border-radius:12px;text-align:center;">
                    <div style="font-size:9px;color:var(--primary, #38bdf8);margin-bottom:2px;">ร้าน</div>
                    <div style="font-size:13px;font-weight:800;color:var(--primary, #38bdf8);">฿${wShop.toLocaleString()}</div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:10px;">
                <div style="background:var(--bg-card, rgba(255,255,255,0.02));padding:6px 2px;border-radius:10px;text-align:center;border:1px solid var(--border-color, rgba(255,255,255,0.05));">
                    <div style="font-size:8px;color:var(--text-muted, #64748b);margin-bottom:2px;">👤 รวม</div>
                    <div style="font-size:11px;font-weight:700;color:var(--primary, #38bdf8);">${data.customers || 0}</div>
                </div>
                <div style="background:var(--success-light, rgba(34,197,94,0.05));padding:6px 2px;border-radius:10px;text-align:center;border:1px solid var(--success-border, rgba(34,197,94,0.1));">
                    <div style="font-size:8px;color:var(--success, #4ade80);margin-bottom:2px;">🌟 ใหม่</div>
                    <div style="font-size:11px;font-weight:700;color:var(--success, #4ade80);">${data.countNew || 0}</div>
                </div>
                <div style="background:var(--accent-purple-light, rgba(168,85,247,0.05));padding:6px 2px;border-radius:10px;text-align:center;border:1px solid var(--accent-purple-border, rgba(168,85,247,0.1));">
                    <div style="font-size:8px;color:var(--accent-purple, #c084fc);margin-bottom:2px;">📌 ประจำ</div>
                    <div style="font-size:11px;font-weight:700;color:var(--accent-purple, #c084fc);">${data.countRegular || 0}</div>
                </div>
                <div style="background:var(--warning-light, rgba(249,115,22,0.05));padding:6px 2px;border-radius:10px;text-align:center;border:1px solid var(--warning-border, rgba(249,115,22,0.1));">
                    <div style="font-size:8px;color:var(--brand-orange, #f97316);margin-bottom:2px;">🚗 นอก</div>
                    <div style="font-size:11px;font-weight:700;color:var(--brand-orange, #f97316);">${data.countOffsite || 0}</div>
                </div>
            </div>
            <div style="font-size:11px;color:var(--text-muted, #94a3b8);line-height:1.7;padding:0 4px 10px 4px;border-bottom:1px solid var(--border-color, rgba(255,255,255,0.05));margin-bottom:10px;">
                ${data.countNew > 0 ? `<div>🌟 ลูกค้าใหม่: ${data.countNew} ราย</div>` : ''}
                ${data.countRegular > 0 ? `<div>📌 ลูกค้าประจำ: ${data.countRegular} ราย</div>` : ''}
                ${data.countOffsite > 0 ? `<div>🚗 นอกสถานที่: ${data.countOffsite} ราย</div>` : ''}
                <div style="margin-top:2px;">📈 ลูกค้าเยอะที่สุด: <span style="color:var(--text-main, #f1f5f9);font-weight:600;">${bestDay}</span></div>
                <div>📉 ลูกค้าน้อยที่สุด: <span style="color:var(--text-main, #f1f5f9);font-weight:600;">${worstDay}</span></div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;">${popHair} ${popService}</div>
        </div>`;
    }).join("");
    
    let displayMonthTitle = m;
    try {
        const [y, mNum] = m.split('-').map(Number);
        const searchYear = y > 2500 ? y - 543 : y;
        const monthNames = typeof MONTH_NAMES !== 'undefined' ? MONTH_NAMES : ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
        displayMonthTitle = `${monthNames[mNum - 1] || ''} ${searchYear + 543}`;
    } catch (e) { displayMonthTitle = m; }
    
    if ($("monthlyIncomeContent")) {
        const shopIncomeTotal = Math.max(0, monthTotal - monthBarber);
        $("monthlyIncomeContent").innerHTML = `
        <div style="background:var(--bg-card, #0f172a);padding:20px;color:var(--text-main, #f1f5f9);border-radius:20px;font-family:inherit;">
            <div style="text-align:center;padding:10px 0 20px 0;">
                <div style="font-size:14px;color:var(--text-muted, #94a3b8);font-weight:700;margin-bottom:4px;">✂️ รายได้รวมเดือน (${displayMonthTitle})</div>
                <div style="font-size:42px;font-weight:900;color:var(--text-main, #fff);">฿${Number(monthTotal || 0).toLocaleString()}</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
                <div style="background:var(--bg-sub, rgba(255,255,255,0.03));border:1px solid var(--border-color, rgba(255,255,255,0.1));padding:12px;border-radius:16px;text-align:center;">
                    <div style="font-size:11px;color:var(--text-muted, #94a3b8);">รายได้ช่าง</div>
                    <div style="font-size:18px;font-weight:800;color:var(--text-main, #f8fafc);">฿${Math.floor(monthBarber || 0).toLocaleString()}</div>
                </div>
                <div style="background:var(--bg-sub, rgba(255,255,255,0.03));border:1px solid var(--border-color, rgba(255,255,255,0.1));padding:12px;border-radius:16px;text-align:center;">
                    <div style="font-size:11px;color:var(--text-muted, #94a3b8);">รายได้ร้าน</div>
                    <div style="font-size:18px;font-weight:800;color:var(--text-main, #f8fafc);">฿${Math.floor(shopIncomeTotal).toLocaleString()}</div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:12px;">
                <div style="background:var(--primary-light, rgba(56,189,248,0.15));padding:8px 2px;border-radius:10px;font-size:11px;font-weight:700;color:var(--primary, #38bdf8);text-align:center;border:1px solid var(--primary-border, rgba(56,189,248,0.2));">👤 ลูกค้า ${monthCount}</div>
                <div style="background:var(--success-light, rgba(34,197,94,0.15));padding:8px 2px;border-radius:10px;font-size:11px;font-weight:700;color:var(--success, #4ade80);text-align:center;border:1px solid var(--success-border, rgba(34,197,94,0.2));">🌟 ใหม่ ${countNew || 0}</div>
                <div style="background:var(--accent-purple-light, rgba(168,85,247,0.15));padding:8px 2px;border-radius:10px;font-size:11px;font-weight:700;color:var(--accent-purple, #c084fc);text-align:center;border:1px solid var(--accent-purple-border, rgba(168,85,247,0.2));">📌 ประจำ ${countRegular || 0}</div>
                <div style="background:var(--warning-light, rgba(249,115,22,0.15));padding:8px 2px;border-radius:10px;font-size:11px;font-weight:700;color:var(--brand-orange, #f97316);text-align:center;border:1px solid var(--warning-border, rgba(249,115,22,0.2));">🚗 นอก ${countOffsite || 0}</div>
            </div>
            <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px;">
                <div style="background:var(--bg-sub, rgba(255,255,255,0.08));padding:6px 12px;border-radius:10px;font-size:11px;font-weight:600;color:var(--text-main, #f8fafc);">📅 เปิด ${workDays} วัน</div>
                <div style="background:var(--danger-light, rgba(244,63,94,0.15));padding:6px 12px;border-radius:10px;font-size:11px;font-weight:600;color:var(--danger, #fb7185);">⛱️ หยุด ${offDays} วัน</div>
                <div style="background:var(--warning-light, rgba(250,204,21,0.15));padding:6px 12px;border-radius:10px;font-size:11px;font-weight:600;color:var(--warning, #facc15);">🛡️ ประกัน ${guarDays || 0} วัน</div>
                <div style="background:var(--accent-purple-light, rgba(147,51,234,0.15));padding:6px 12px;border-radius:10px;font-size:11px;font-weight:600;color:var(--accent-purple, #a855f7);">📊 เฉลี่ย ${(avg || 0).toFixed(2)} คน/วัน</div>
            </div>
        </div>`;
    }
    
    if ($("incomeAnalyticsContent")) {
        $("incomeAnalyticsContent").innerHTML = `
        <div style="background:var(--bg-card, #0f172a);padding:20px;color:var(--text-main, #f1f5f9);border-radius:20px;font-family:inherit;">
            <div style="background:var(--warning-light, rgba(250,204,21,0.08));border:1px solid var(--warning-border, rgba(250,204,21,0.25));padding:16px;border-radius:16px;margin-bottom:20px;">
                <div style="font-size:14px;font-weight:800;color:var(--warning, #facc15);margin-bottom:10px;">⌛ วิเคราะห์ภาพรวมเดือน</div>
                ${insights.map(i => `<div style="font-size:12.5px;color:var(--text-main, #f8fafc);margin-bottom:6px;">• ${i}</div>`).join("")}
            </div>
            <div>
                <div style="font-size:14px;font-weight:800;color:var(--primary, #38bdf8);margin-bottom:12px;">🌀 รายละเอียดแยกสัปดาห์</div>
                ${weeklyHtml}
            </div>
        </div>`;
    }
    
    if ($("servicesStatsContent")) {
        $("servicesStatsContent").innerHTML = `
        <div style="background:var(--bg-card, #0f172a);padding:20px;color:var(--text-main, #f1f5f9);border-radius:20px;font-family:inherit;">
            <div style="margin-bottom:24px;">
                <div style="font-size:14px;font-weight:800;color:var(--accent-green, #bef264);margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                    <div style="width:4px;height:16px;background:var(--accent-green, #bef264);border-radius:2px;"></div>ทรงผมยอดนิยม
                </div>
                ${renderStats(hairStats, "var(--accent-green, #bef264)")}
            </div>
            <div>
                <div style="font-size:14px;font-weight:800;color:var(--primary, #38bdf8);margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                    <div style="width:4px;height:16px;background:var(--primary, #38bdf8);border-radius:2px;"></div>บริการยอดนิยม
                </div>
                ${renderStats(serviceStats, "var(--primary, #38bdf8)")}
            </div>
        </div>`;
    }
}
function renderDailyTableReport() {
    const picker = document.getElementById('monthlyReportPicker') || document.getElementById('histMonth');
    const content = document.getElementById('monthlyContent1') || document.getElementById('monthlyIncomeContent');
    if (!content) return;
    if (!Array.isArray(archives)) {
        content.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted, #64748b);">ไม่พบฐานข้อมูล</div>';
        return;
    }
    
    let mVal = picker ? picker.value : '';
    if (!mVal) {
        const now = new Date();
        mVal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (picker) picker.value = mVal;
    }
    
    const [rawY, mNum] = mVal.split('-').map(Number);
    // รองรับทั้ง พ.ศ. และ ค.ศ.
    const y = rawY > 2500 ? rawY - 543 : rawY;
    const targetPrefix = `${y}-${String(mNum).padStart(2, '0')}`;
    const filtered = archives.filter(a => a.date && a.date.startsWith(targetPrefix));
    
    const monthNames = typeof MONTH_NAMES !== 'undefined' ? MONTH_NAMES : ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    const dayNames = typeof DAY_NAMES !== 'undefined' ? DAY_NAMES : ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];
    const monthThaiName = monthNames[mNum - 1] || '';
    const currentShopName = (typeof conf !== 'undefined' && conf.shop) || localStorage.getItem('shopName') || 'Barber Shop';
    
    let totalCust = 0, totalBarber = 0, totalShave = 0, totalWash = 0, totalDye = 0, workDays = 0;
    let rowsHTML = '';
    
    filtered.sort((a, b) => a.date.localeCompare(b.date)).forEach(day => {
        const isOffDay = day.off === true || day.type === "HOLIDAY";
        let dayCust = 0, shave = 0, wash = 0, dye = 0;
        
        if (!isOffDay) {
            workDays++;
            if (day.details && Array.isArray(day.details)) {
                day.details.forEach(d => {
                    if (d.type === "SERVICE" || !d.type) {
                        dayCust++;
                        const svcs = Array.isArray(d.svcs) ? d.svcs : [d.svcs];
                        svcs.forEach(s => {
                            if (!s) return;
                            const cs = String(s).trim();
                            if (cs.includes("โกน")) shave++;
                            if (cs.includes("สระ")) wash++;
                            if (cs.includes("ย้อม") || cs.includes("สี")) dye++;
                        });
                    }
                });
            } else { dayCust = Number(day.count) || 0; }
        }
        
        const barber = isOffDay ? 0 : (Number(day.barber) || 0);
        totalCust += dayCust; totalBarber += barber; totalShave += shave; totalWash += wash; totalDye += dye;
        
        let displayDayName = day.dayName || '-';
        if (day.date) {
            const [dY, dM, dD] = day.date.split('-').map(Number);
            const dObj = new Date(dY, dM - 1, dD);
            if (!isNaN(dObj.getTime())) displayDayName = dayNames[dObj.getDay()];
        }
        
        const dayNum = day.date ? day.date.split('-')[2] : '-';
        
        if (isOffDay) {
            rowsHTML += `<tr style="background-color:var(--danger-light, rgba(239,68,68,0.1));">
                <td>${parseInt(dayNum, 10)}</td><td>${displayDayName}</td>
                <td colspan="5" style="color:var(--danger, #ef4444);font-weight:700;text-align:center;">หยุด</td></tr>`;
        } else {
            rowsHTML += `<tr>
                <td>${parseInt(dayNum, 10)}</td><td>${displayDayName}</td>
                <td>${dayCust || '-'}</td>
                <td>${barber > 0 ? barber.toLocaleString() : '-'}</td>
                <td>${shave || '-'}</td><td>${wash || '-'}</td><td>${dye || '-'}</td></tr>`;
        }
    });
    
    content.innerHTML = `
        <div style="text-align:center;margin-bottom:10px;">
            <h3 style="margin:0;color:var(--primary, #0284c7);">รายงานร้าน: <span class="shop-name-display">${currentShopName}</span></h3>
            <p style="margin:4px 0;font-weight:700;color:var(--text-main, #334155);">เดือน: ${monthThaiName} ${y + 543}</p>
        </div>
        <table class="summary-table" style="width:100%;border-collapse:collapse;text-align:center;">
            <thead><tr style="background-color:var(--bg-sub, #f1f5f9);color:var(--text-main, #0f172a);">
                <th>วันที่</th><th>วัน</th><th>ลูกค้า</th><th>ยอดช่าง</th><th>โกน</th><th>สระ</th><th>ย้อม</th>
            </tr></thead>
            <tbody>${rowsHTML || '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted, #94a3b8);">ไม่มีข้อมูล</td></tr>'}</tbody>
            <tfoot><tr style="background-color:var(--warning-light, #fef08a);font-weight:bold;color:var(--text-main, #0f172a);">
                <td>รวมยอด</td><td style="color:var(--primary, #0284c7);">เปิด ${workDays} วัน</td>
                <td>${totalCust || '-'}</td><td>${totalBarber > 0 ? totalBarber.toLocaleString() : '0'}</td>
                <td>${totalShave || '-'}</td><td>${totalWash || '-'}</td><td>${totalDye || '-'}</td>
            </tr></tfoot>
        </table>`;
}

function renderYearlyIncomeSummary() {
    const select = document.getElementById('yearFilterSelect') || document.getElementById('histYear');
    const tbody = document.getElementById('yearlyTableBody');
    if (!tbody) return;
    if (!Array.isArray(archives)) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted, #94a3b8);">ไม่พบฐานข้อมูล</td></tr>';
        return;
    }
    
    const rawYear = parseInt(select?.value || new Date().getFullYear(), 10);
    const selectedYear = rawYear > 2500 ? rawYear - 543 : rawYear;
    const monthNames = typeof MONTH_NAMES !== 'undefined' ? MONTH_NAMES : ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    
    let grandCust = 0, grandBarber = 0, grandShop = 0, grandTotal = 0;
    let html = '';
    
    monthNames.forEach((monthName, idx) => {
        const mNum = idx + 1;
        const targetPrefix = `${selectedYear}-${String(mNum).padStart(2, '0')}`;
        const monthData = archives.filter(a => a.date && a.date.startsWith(targetPrefix));
        let mCust = 0, mBarber = 0, mTotal = 0;
        
        monthData.forEach(day => {
            if (day.details && Array.isArray(day.details)) {
                day.details.forEach(d => { if (d.type === "SERVICE" || !d.type) mCust++; });
            } else { mCust += Number(day.count) || 0; }
            mBarber += Number(day.barber) || 0;
            mTotal += Number(day.total) || 0;
        });
        
        const mShop = mTotal - mBarber;
        grandCust += mCust; grandBarber += mBarber; grandShop += mShop; grandTotal += mTotal;
        
        html += `<tr>
            <td style="text-align:left;font-weight:600;">${idx + 1}. ${monthName}</td>
            <td>${mCust ? mCust.toLocaleString() : '-'}</td>
            <td>${mBarber ? mBarber.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}</td>
            <td>${mShop ? mShop.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}</td>
            <td style="font-weight:700;">${mTotal ? mTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}</td>
        </tr>`;
    });
    
    tbody.innerHTML = html;
    
    const setElemText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };
    
    setElemText('yearlyTotalCust', grandCust.toLocaleString());
    setElemText('yearlyTotalBarber', grandBarber.toLocaleString('th-TH', { minimumFractionDigits: 2 }));
    setElemText('yearlyTotalShop', grandShop.toLocaleString('th-TH', { minimumFractionDigits: 2 }));
    setElemText('yearlyGrandTotal', grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 }));
}

function initYearOptions() {
    const select = document.getElementById('yearFilterSelect');
    if (!select) return;
    const currentYear = new Date().getFullYear();
    let html = '';
    for (let y = currentYear; y >= currentYear - 5; y--) {
        const isSel = (y === currentYear) ? 'selected' : '';
        html += `<option value="${y}" ${isSel}>ปี พ.ศ. ${y + 543} (${y})</option>`;
    }
    select.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
    initYearOptions();
    if (typeof renderYearlyIncomeSummary === 'function') renderYearlyIncomeSummary();
});
function exportMonthlyExcel() {
    const picker = document.getElementById('monthlyReportPicker') || document.getElementById('histMonth');
    if (!picker) return typeof notify === 'function' ? notify("error", "ผิดพลาด", "ไม่พบช่องเลือกเดือน") : alert("ไม่พบช่องเลือกเดือน");
    
    const monthValue = picker.value;
    if (!monthValue || typeof XLSX === 'undefined') {
        return typeof notify === 'function' ? notify("error", "ผิดพลาด", "กรุณาเลือกเดือน หรือเช็คไลบรารี SheetJS") : alert("กรุณาเลือกเดือน หรือเช็คไลบรารี SheetJS");
    }
    
    const [rawYear, month] = monthValue.split('-').map(Number);
    // แปลงปีให้เป็น ค.ศ. สำหรับ filter และ พ.ศ. สำหรับแสดงผล
    const yearCe = rawYear > 2500 ? rawYear - 543 : rawYear;
    const yearBe = yearCe + 543;
    const monthPad = String(month).padStart(2, '0');
    
    const monthNames = typeof MONTH_NAMES !== 'undefined' ? MONTH_NAMES : ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    const dayThaiNames = typeof DAY_NAMES !== 'undefined' ? DAY_NAMES : ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];
    
    const monthName = `${monthNames[month - 1] || ''} ${yearBe}`;
    const searchPrefix = `${yearCe}-${monthPad}`;
    
    const list = (typeof archives !== 'undefined' ? archives : []).filter(a => a.date?.startsWith(searchPrefix));
    if (!list.length) {
        return typeof notify === 'function' ? notify("error", "ไม่พบข้อมูล", `ไม่มีข้อมูลเดือน ${monthName}`) : alert(`ไม่มีข้อมูลเดือน ${monthName}`);
    }
    
    const shopName = (typeof conf !== 'undefined' && conf.shop) || localStorage.getItem('shopName') || 'Barber Shop';
    const rows = [
        [`รายงานร้าน: ${shopName}`],
        [`เดือน: ${monthName}`],
        ["วันที่", "วัน", "ลูกค้า", "ยอดช่าง", "โกน", "สระ", "ย้อม"]
    ];
    
    let totalCust = 0, totalIncome = 0, totalShave = 0, totalWash = 0, totalDye = 0;
    let workDays = 0;
    
    list.sort((a, b) => a.date.localeCompare(b.date)).forEach(a => {
        const isOffDay = a.off === true || a.type === "HOLIDAY";
        const dateParts = a.date ? a.date.split('-') : [];
        const dayOnly = dateParts.length === 3 ? parseInt(dateParts[2], 10) : '';
        const dateObj = new Date(yearCe, month - 1, dayOnly);
        const dayName = !isNaN(dateObj.getTime()) ? dayThaiNames[dateObj.getDay()] : '';
        
        let shave = 0, wash = 0, dye = 0, cust = 0;
        
        if (!isOffDay) {
            workDays++;
            if (Array.isArray(a.details)) {
                a.details.forEach(d => {
                    if (d.type === "SERVICE" || !d.type) {
                        cust++;
                        const svcsArr = Array.isArray(d.svcs) ? d.svcs : [d.svcs || ''];
                        const svcsText = svcsArr.join(' ');
                        if (svcsText.includes('โกน')) shave++;
                        if (svcsText.includes('สระ')) wash++;
                        if (svcsText.includes('ย้อม') || svcsText.includes('สี')) dye++;
                    }
                });
            } else {
                cust = Number(a.count) || 0;
            }
        }
        
        const income = isOffDay ? 0 : (Number(a.barber) || Number(a.total) || 0);
        
        totalCust += cust;
        totalIncome += income;
        totalShave += shave;
        totalWash += wash;
        totalDye += dye;
        
        if (isOffDay) {
            rows.push([dayOnly, dayName, "หยุด", "-", "-", "-", "-"]);
        } else {
            rows.push([dayOnly, dayName, cust || '-', income || '-', shave || '-', wash || '-', dye || '-']);
        }
    });
    
    rows.push(["รวมยอด", `เปิด ${workDays} วัน`, totalCust, totalIncome, totalShave, totalWash, totalDye]);
    
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "รายงานรายเดือน");
    
    const fileName = `รายงานรายเดือน-${monthName}.xlsx`;
    const fileData = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([fileData], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    
    if (isIOS) { 
        a.target = "_blank"; 
        a.rel = "noopener"; 
    }
    
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 2000); // ขยายเวลาเปิด Blob เพื่อให้ iOS/Safari โหลดไฟล์เสร็จสมบูรณ์
    
    if (typeof notify === 'function') notify("success", "สำเร็จ", `ส่งออกข้อมูลเดือน ${monthName} เรียบร้อย`);
}

function openReportFullscreen() {
    const mc = document.getElementById('fullReportContent');
    if (!mc) return;
    
    const tableHead = document.getElementById('compareTableHead');
    const tableBody = document.getElementById('comparisonSingleContent');
    const tableFoot = document.getElementById('compareTableFoot');
    const hasComp = tableBody && tableBody.innerHTML.trim();
    
    if (hasComp) {
        mc.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-family:inherit;text-align:center;font-size:12px;color:var(--text-main, #0f172a);">
                <thead>${tableHead?.innerHTML || ''}</thead>
                <tbody>${tableBody.innerHTML}</tbody>
                <tfoot>${tableFoot?.innerHTML || ''}</tfoot>
            </table>`;
    } else {
        const tc = document.getElementById('monthlyContent1') || document.getElementById('monthlyIncomeContent');
        if (!tc || !tc.innerHTML.trim()) {
            return typeof notify === 'function' ? notify("error", "ไม่พบข้อมูล", "เลือกข้อมูลแล้วกดประมวลผลก่อน") : alert("เลือกข้อมูลแล้วกดประมวลผลก่อน");
        }
        mc.innerHTML = tc.innerHTML;
    }
    
    const modal = document.getElementById('fullReportModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeReportFullscreen() {
    const modal = document.getElementById('fullReportModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function openPreviewModal() {
    openReportFullscreen();
}

async function handleGoogleSheet() {
    const playStoreUrl = "https://play.google.com/store/apps/details?id=com.google.android.apps.docs.editors.sheets";
    const appStoreUrl = "https://apps.apple.com/th/app/google-sheets/id441411228";
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    let hasSwitched = false;
    
    const vh = () => { if (document.hidden) hasSwitched = true; };
    document.addEventListener("visibilitychange", vh);
    window.location.href = "googlesheets://";
    
    setTimeout(() => {
        document.removeEventListener("visibilitychange", vh);
        if (!hasSwitched) {
            if (typeof notify === 'function') notify("warning", "ไม่พบแอป", "ตรวจสอบการติดตั้ง Google Sheets...");
            if (confirm("ไม่พบแอป Google Sheets\nต้องการไปหน้าติดตั้งหรือไม่?")) {
                if (isAndroid) window.location.href = playStoreUrl;
                else if (isIOS) window.location.href = appStoreUrl;
                else window.open("https://sheets.google.com", "_blank");
            }
        } else {
            if (typeof notify === 'function') notify("success", "สำเร็จ", "เปิดแอป Google Sheets เรียบร้อย");
        }
    }, 2000);
}
/* =========== SECTION 10: ระบบแชร์ LINE / MODAL / โหลดเริ่มต้น =========== */

// Helper function ส่วนกลางสำหรับดึง Element
const $ = (id) => document.getElementById(id);

function shareLine() {
    const dateEl = $("dateInp");
    if (!dateEl || !dateEl.value) {
        if (typeof Swal !== 'undefined') Swal.fire({ title: 'กรุณาเลือกวันที่', icon: 'warning' });
        return;
    }
    const dInp = dateEl.value;
    const today = (typeof db !== 'undefined' ? db : []).filter(r => r.date === dInp);
    
    // 🔴 ตรวจสอบข้อมูล
    if (!today.length) {
        const errSfx = $("errorSound"); 
        if (errSfx && typeof errSfx.play === 'function') {
            errSfx.play().catch(() => {}); // ป้องกัน Autoplay Restriction Error
        }
        if (typeof Swal !== 'undefined') Swal.fire({ title: 'ไม่พบข้อมูล', text: 'วันที่เลือกไม่มีการบันทึกไว้', icon: 'info' });
        return;
    }

    // 🗓️ จัดการวันที่และดึงข้อมูลจาก การตั้งค่า (conf / localStorage)
    const [yRaw, m, d] = dInp.split('-');
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const yNum = parseInt(yRaw, 10);
    const yBe = yNum < 2500 ? yNum + 543 : yNum;
    const fDate = `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${yBe.toString().slice(-2)}`;
    
    // 🎯 ดึงค่าจากการตั้งค่าพร้อม Fallback กัน undefined
    const currentConf = (typeof conf !== 'undefined' && conf) ? conf : JSON.parse(localStorage.getItem('barberConf') || '{}');
    const shopName = currentConf.shop || "Barber Shop";
    const perc = Number(currentConf.perc) || 50; // default 50%
    const guar = Number(currentConf.guar) || 0;
    const offsiteRate = Number(currentConf.offsiteRate) || 200; // ค่าฟิกนอกสถานที่

    let tot = 0, cash = 0, trans = 0, tips = 0;
    let bEarnBase = 0; // ยอดส่วนแบ่งช่าง (ไม่รวมทิป)
    let stats = {}, realCustomerCount = 0, newCount = 0, regCount = 0, offsiteCount = 0, giftCount = 0;

    // 📝 ประมวลผลรายการลูกค้า
    const clientList = today.slice().sort((a,b)=>(a.time||'').localeCompare(b.time||'')).map((r,i)=>{
        const p = Number(r.price)||0, t = Number(r.tip)||0;
        const payType = String(r.pay||"").trim();
        let detailText = "", pIcon = '💵', displayPrice = p;

        if (['Free','Gift','ของขวัญ'].includes(payType)) { 
            displayPrice=0; pIcon='🎁'; trans+=t; giftCount++; 
        }
        else if (payType==='Free-Cash') { 
            cash+=p; tot+=p; pIcon='🎁+💵'; giftCount++; 
        }
        else if (payType==='Free-Trans') { 
            trans+=(p+t); tot+=p; pIcon='🎁+📱'; giftCount++; 
        }
        else if (payType==='Mix') { 
            const pc=Number(r.payCash)||0, pt=Number(r.payTrans)||0; 
            cash+=pc; trans+=pt; tot+=p; 
            detailText=` (สด:${pc}/โอน:${pt})`; pIcon='🌓'; 
        }
        else if (['Trans','โอน'].includes(payType)) { 
            trans+=(p+t); tot+=p; pIcon='📱'; 
        }
        else { 
            cash+=p; tot+=p; 
        }

        tips += t;

        if (!['GUARANTEE','HOLIDAY'].includes(String(r.type||'').toUpperCase())) {
            realCustomerCount++;
            const cType = String(r.custType || r.type || "").toLowerCase();
            
            // 🎯 คำนวณส่วนแบ่งช่างแยกตามประเภทลูกค้าและการตั้งค่า
            if (cType === 'offsite' || cType.includes('นอกสถานที่')) {
                offsiteCount++;
                bEarnBase += offsiteRate; 
            } else if (cType === 'new' || cType === 'ใหม่') {
                newCount++;
                bEarnBase += p * (perc / 100);
            } else {
                regCount++;
                bEarnBase += p * (perc / 100);
            }
            
            if (r.hair && r.hair.includes("เด็ก")) stats["เด็ก"] = (stats["เด็ก"] || 0) + 1;
            (r.svcs||[]).forEach(s=>{if(s) stats[s]=(stats[s]||0)+1;});
        }

        const tShow = r.endTime ? `${r.time}-${r.endTime}` : r.time;
        const svcsText = Array.isArray(r.svcs) ? r.svcs.join('+') : '';
        return `${i+1}. [${tShow}] ${svcsText} = ${displayPrice}${t?` (+ทิป ${t})`:''}${detailText} ${pIcon}`;
    }).join('\n');

    // 📊 ส่วนสรุปงาน
    const allowed = ["เด็ก", "สระผม", "โกนหนวด", "ย้อมผม", "ย้อมสี"];
    const icons = { "เด็ก": "🧒", "สระ": "🧼", "โกน": "🪒", "ย้อม": "🎨" };
    let statText = Object.entries(stats)
        .filter(([k]) => allowed.some(a => k.includes(a)))
        .map(([k, v]) => `${icons[Object.keys(icons).find(i => k.includes(i))] || '🔹'} ${k}: ${v}`).join('\n');

    // 💰 คำนวณรายได้รวมช่าง/ร้าน (การันตีรายได้ช่างตามตั้งค่า)
    let bEarn = Math.max(bEarnBase, guar) + tips;
    let shopEarn = Math.max(0, tot - (bEarn - tips)); 
    let settle = cash - (bEarn - tips); 

    // 🔄 ยอดค้างสะสม
    let oldBalance = 0, periodText = "", hasOldBalance = false;
    if (typeof archives !== "undefined" && Array.isArray(archives)) {
        const pendingDays = archives.filter(day => day.date !== dInp && Number(day.settle) !== 0);
        if (pendingDays.length > 0) {
            hasOldBalance = true;
            oldBalance = pendingDays.reduce((sum,day)=>sum+(Number(-day.settle)||0),0);
            const fmt = iso=>{const p=iso.split('-');return `${parseInt(p[2])}/${parseInt(p[1])}`;};
            const yr = iso=>{
                const yearVal = parseInt(iso.split('-')[0], 10);
                return (yearVal < 2500 ? yearVal + 543 : yearVal).toString().slice(-2);
            };
            if (pendingDays.length===1) {
                periodText = `${fmt(pendingDays[0].date)}/${yr(pendingDays[0].date)}`;
            } else {
                const l=pendingDays.length-1; 
                periodText = `${fmt(pendingDays[0].date)} - ${fmt(pendingDays[l].date)}/${yr(pendingDays[l].date)}`;
            }
        }
    }
    let todayDiff = -settle, finalNet = oldBalance + todayDiff;

    // ✉️ ประกอบข้อความส่ง LINE
    let msg = `💈 รายงานร้าน: ${shopName}\n`;
    msg += `📅 วันที่: ${fDate}\n`;
    msg += `-------------------------\n`;
    msg += `👤 ลูกค้าทั้งหมด: ${realCustomerCount} คน`;

    const custTypeParts = [];
    if (newCount > 0) custTypeParts.push(`ใหม่:${newCount}`);
    if (regCount > 0) custTypeParts.push(`ประจำ:${regCount}`);
    if (offsiteCount > 0) custTypeParts.push(`นอกสถานที่:${offsiteCount}`);

    if (custTypeParts.length > 0) {
        msg += `\n ${custTypeParts.join(' | ')}`;
    }

    msg += `\n-------------------------\n${clientList}\n`;
    msg += `-------------------------\n🏷️ สรุปงาน:\n${statText || '(ไม่มีรายการ)'}\n`;
    msg += `-------------------------\n`;
    msg += `💰 ยอด: ${tot.toLocaleString()} | 🧧 ทิปโอน: ${tips.toLocaleString()}\n`;
    msg += `📱 โอน: ${trans.toLocaleString()} | 💵 เงินสด: ${cash.toLocaleString()}`;
    if (giftCount) msg += ` | 🎁: ${giftCount}`;
    msg += `\n🤵 ช่าง: ${Math.floor(bEarn).toLocaleString()}\n🏠 ร้าน: ${Math.floor(shopEarn).toLocaleString()}\n`;
    msg += `-------------------------\n`;

    if (hasOldBalance && oldBalance !== 0) {
        msg += settle>0?`🟧 ช่างคืนร้าน: ${Math.abs(Math.floor(settle)).toLocaleString()} บาท\n`:`🟦 ร้านคืนช่าง: ${Math.abs(Math.floor(settle)).toLocaleString()} บาท\n`;
        msg += `-------------------------\n🚨 สถานะบัญชี\nวันที่ ${periodText}: ${oldBalance>0?'ร้านค้าง':'ช่างค้าง'} ${Math.abs(oldBalance).toLocaleString()} บาท\n`;
        msg += `(${Math.abs(oldBalance)} ${todayDiff>=0?'+':'-'} ${Math.abs(Math.floor(todayDiff)).toLocaleString()}) = ${Math.abs(Math.floor(finalNet)).toLocaleString()}\n\n`;
        msg += finalNet>0?`📌 🟦 ยอดสุทธิ: ร้านคืนช่าง ${Math.abs(Math.floor(finalNet)).toLocaleString()} บาท`:`📌 🟧 ยอดสุทธิ: ช่างคืนร้าน ${Math.abs(Math.floor(finalNet)).toLocaleString()} บาท`;
    } else {
        msg += settle>0?`🟧 ช่างคืนร้าน: ${Math.abs(Math.floor(settle)).toLocaleString()} บาท`:(settle<0?`🟦 ร้านคืนช่าง: ${Math.abs(Math.floor(settle)).toLocaleString()} บาท`:`✅ ยอดลงตัวพอดี`);
    }

    // แสดง Preview
    const msgEdit = $("msgEdit"), previewArea = $("linePreview");
    if (msgEdit && previewArea) { 
        msgEdit.value = msg; 
        
        msgEdit.style.width = "100%";
        msgEdit.style.height = "320px";
        msgEdit.style.padding = "12px";
        msgEdit.style.fontSize = "14px";
        msgEdit.style.borderRadius = "12px";
        msgEdit.style.background = "#1e293b";
        msgEdit.style.color = "#ffffff";
        msgEdit.style.boxSizing = "border-box";
        
        previewArea.style.display = "flex"; 
    } else { 
        window.open(`https://line.me/R/msg/text/?${encodeURIComponent(msg)}`, '_blank'); 
    }
}

function sendToLineFinal() {
    const msgEdit = $("msgEdit"), previewArea = $("linePreview");
    
    if (!msgEdit || !msgEdit.value.trim()) {
        if (typeof Swal !== 'undefined') Swal.fire({ title: 'ไม่พบข้อความ', text: 'กรุณาตรวจสอบข้อความก่อนส่ง', icon: 'warning' });
        return;
    }
    
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(msgEdit.value)}`, '_blank');
    if (previewArea) previewArea.style.display = "none";
}

function closeLineModal() { 
    const previewArea = $("linePreview"); 
    if (previewArea) previewArea.style.display = "none"; 
}

/* ========= ✅ INITIALIZE — โหลดค่าเริ่มต้นเมื่อเปิดหน้า ========= */
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toISOString().split('T')[0];
    
    // โหลดการตั้งค่าพร้อม Fallback กัน Crash
    const safeConf = (typeof conf !== 'undefined' && conf) ? conf : JSON.parse(localStorage.getItem('barberConf') || '{}');
    
    // ตั้งค่าวันที่ปัจจุบัน
    if ($("dateInp")) { 
        $("dateInp").value = today; 
        if (typeof updateDateDisplay === 'function') updateDateDisplay(today); 
    }
    if ($("accDate")) $("accDate").value = today;
    
    // ตั้งค่าชื่อร้านและธีม
    if (typeof applyTheme === 'function' && safeConf.theme) applyTheme(safeConf.theme);
    const entryShop = $("entryShopName");
    if (entryShop) entryShop.innerText = safeConf.shop || 'Barber Shop';
    
    // ตั้งค่าเวลาปัจจุบัน
    const now = new Date();
    const curTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    if ($("tStart")) $("tStart").value = curTime;
    if ($("tEnd")) $("tEnd").value = curTime;
    
    // โหลดข้อมูลหน้าแรก
    if (typeof renderDay === 'function') renderDay(today);
    if (typeof loadAccountStatus === 'function') loadAccountStatus();
    
    // เปิดหน้าแรกเมื่อโหลดเสร็จ
    if (typeof goSub === 'function') goSub(1);

    // อัปเดตชื่อร้านทุกจุดที่แสดง
    const shopNameElements = document.querySelectorAll('.shop-name-display');
    shopNameElements.forEach(el => {
        el.innerText = safeConf.shop || 'Barber Shop';
    });

    // ตั้งค่าช่วงเดือนเริ่มต้นสำหรับรายงาน
    const nowDate = new Date();
    const currentMonth = `${nowDate.getFullYear()}-${(nowDate.getMonth() + 1).toString().padStart(2, '0')}`;
    if ($("histMonth")) {
        $("histMonth").value = currentMonth;
    }

    // ตั้งค่าปี-เดือนเริ่มต้นสำหรับเปรียบเทียบ
    if ($("compMonth1")) {
        const lastMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1);
        $("compMonth1").value = `${lastMonth.getFullYear()}-${(lastMonth.getMonth() + 1).toString().padStart(2, '0')}`;
    }
    if ($("compMonth2")) {
        $("compMonth2").value = currentMonth;
    }

    // ตั้งค่าสถานะเสียงตามค่าที่บันทึกไว้
    if (safeConf.sound === "off") {
        document.body.classList.add("muted");
    } else {
        document.body.classList.remove("muted");
    }

    // ปรับการแสดงผลบนมือถือ
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
    }

    // ผูก Event เปลี่ยนเดือนในหน้ารายงานให้คำนวณและอัปเดตตารางทันที
    const monthlyPicker = $("monthlyReportPicker") || $("histMonth");
    if (monthlyPicker) {
        monthlyPicker.addEventListener('change', function(e) {
            const selectedMonth = e.target.value;
            
            const mainPicker = $("histMonth");
            if (mainPicker && mainPicker !== monthlyPicker) {
                mainPicker.value = selectedMonth;
            }
            
            if (typeof loadHistMonth === 'function') loadHistMonth();
            if (typeof renderDailyTableReport === 'function') renderDailyTableReport();
        });
    }

    // ซ่อนหน้าโหลด / แสดงเนื้อหาหลัก
    const loadingScreen = $("loadingScreen");
    if (loadingScreen) {
        loadingScreen.style.display = "none";
    }

    // แจ้งเวอร์ชันและเวลาอัปเดต
    const appVer = typeof APP_VERSION !== 'undefined' ? APP_VERSION : '1.0.0';
    const lastUpd = typeof LAST_UPDATED !== 'undefined' ? LAST_UPDATED : '-';
    console.log(`✅ Barber-Note v${appVer} โหลดสมบูรณ์ — ${lastUpd}`);
});
// =========== ระบบเปรียบเทียบข้อมูล ===========

function getDayName(dateStr) {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dayShortNames = (typeof DAY_SHORT !== 'undefined' && Array.isArray(DAY_SHORT)) 
        ? DAY_SHORT 
        : (typeof DAY_NAMES !== 'undefined' ? DAY_NAMES : ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.']);
    
    const dateObj = new Date(y, m - 1, d);
    return !isNaN(dateObj.getTime()) ? dayShortNames[dateObj.getDay()] : '-';
}

function formatShortDate(dateStr) {
    if (!dateStr) return '-';
    const [yearRaw, month, day] = dateStr.split('-');
    const yearNum = parseInt(yearRaw, 10);
    const yearBe = yearNum < 2500 ? yearNum + 543 : yearNum;
    return `${parseInt(day, 10)}/${parseInt(month, 10)}/${yearBe.toString().slice(-2)}`;
}

function formatTHDate(dateStr) {
    if (!dateStr) return '-';
    const [yearRaw, month, day] = dateStr.split('-');
    const yearNum = parseInt(yearRaw, 10);
    const yearBe = yearNum < 2500 ? yearNum + 543 : yearNum;
    return `${parseInt(day, 10)}/${parseInt(month, 10)}/${yearBe}`;
}

function getDatesArray(startDate, endDate) {
    const dates = [];
    if (!startDate || !endDate) return dates;
    
    let curr = new Date(startDate + 'T00:00:00');
    let last = new Date(endDate + 'T00:00:00');
    
    if (isNaN(curr.getTime()) || isNaN(last.getTime())) return dates;

    while (curr <= last) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        curr.setDate(curr.getDate() + 1);
    }
    return dates;
}

function processComparison() {
    const d1s = document.getElementById('startDate1')?.value;
    const d1e = document.getElementById('endDate1')?.value;
    const d2s = document.getElementById('startDate2')?.value;
    const d2e = document.getElementById('endDate2')?.value;
    const topic = document.getElementById('compareTopic')?.value || 'total';
    
    if (!d1s || !d1e || !d2s || !d2e) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({ title: 'ข้อมูลไม่ครบถ้วน', text: 'กรุณาเลือกช่วงเวลาให้ครบถ้วนทั้ง 2 ช่วง', icon: 'warning' });
        } else {
            alert("กรุณาเลือกช่วงเวลาให้ครบถ้วนทั้ง 2 ช่วง");
        }
        return;
    }
    
    const range1 = getDatesArray(d1s, d1e);
    const range2 = getDatesArray(d2s, d2e);
    const maxRows = Math.max(range1.length, range2.length);
    
    const topicLabel = (t) => {
        const map = { cust: 'ลูกค้า', barber: 'รายได้ช่าง', shop: 'รายได้ร้าน', total: 'รายได้รวม' };
        return map[t] || 'รายได้';
    };
    const label = topicLabel(topic);
    
    const headHtml = `
        <tr>
            <th colspan="4" style="background:var(--summary-bg, #f1f5f9);color:var(--primary, #0f172a);border:1px solid var(--summary-border, #cbd5e1);">📅 ช่วงที่ 1 (${formatTHDate(d1s)} - ${formatTHDate(d1e)})</th>
            <th colspan="4" style="background:var(--btn-compare1, #6366f1);color:var(--btn-text, #ffffff);">📅 ช่วงที่ 2 (${formatTHDate(d2s)} - ${formatTHDate(d2e)})</th>
        </tr>
        <tr>
            <th style="background:var(--primary, #0f172a);color:#fff;">วัน</th>
            <th style="background:var(--primary, #0f172a);color:#fff;">วันที่</th>
            <th style="background:var(--primary, #0f172a);color:#fff;">ลูกค้า</th>
            <th style="background:var(--primary, #0f172a);color:#fff;">${label}</th>
            <th style="background:var(--btn-compare2, #4f46e5);color:#fff;">วัน</th>
            <th style="background:var(--btn-compare2, #4f46e5);color:#fff;">วันที่</th>
            <th style="background:var(--btn-compare2, #4f46e5);color:#fff;">ลูกค้า</th>
            <th style="background:var(--btn-compare2, #4f46e5);color:#fff;">${label}</th>
        </tr>`;
    
    function getValueByTopic(dd, t) {
        if (!dd) return 0;
        switch (t) {
            case 'cust': return dd.cust || 0;
            case 'barber': return dd.barber || 0;
            case 'shop': return dd.shop || 0;
            case 'total': return dd.total || 0;
            default: return dd.total || 0;
        }
    }
    
    function getDayDataFull(dateStr) {
        const list = Array.isArray(archives) ? archives : (typeof db !== 'undefined' && Array.isArray(db) ? db : []);
        if (!list.length) return { cust: 0, barber: 0, shop: 0, total: 0 };
        
        const dayRecords = list.filter(a => a.date === dateStr);
        if (!dayRecords.length) return { cust: 0, barber: 0, shop: 0, total: 0 };
        
        let cust = 0, barber = 0, shop = 0, total = 0;
        dayRecords.forEach(a => {
            cust += Number(a.count) || (a.details && Array.isArray(a.details) ? a.details.length : 0);
            const bVal = Number(a.barber || 0);
            const tVal = Number(a.total || 0);
            barber += bVal;
            total += tVal;
            
            if (typeof a.shop !== 'undefined' && a.shop !== null && a.shop !== '') {
                shop += Number(a.shop);
            } else {
                shop += Math.max(0, tVal - bVal);
            }
        });
        return { cust, barber, shop, total };
    }
    
    let bodyHtml = '';
    let sum1Cust = 0, sum1Val = 0, sum2Cust = 0, sum2Val = 0;
    
    for (let i = 0; i < maxRows; i++) {
        const rowBg1 = i % 2 === 0 ? 'var(--summary-bg, #f8fafc)' : 'var(--card, #ffffff)';
        const rowBg2 = i % 2 === 0 ? 'rgba(147,142,245,0.08)' : 'var(--card, #ffffff)';
        const border = '1px solid var(--border, #e2e8f0)';
        
        const date1 = range1[i] || null;
        const dayName1 = date1 ? getDayName(date1) : '-';
        const data1 = date1 ? getDayDataFull(date1) : null;
        const val1 = data1 ? getValueByTopic(data1, topic) : 0;
        if (data1) { sum1Cust += data1.cust; sum1Val += val1; }
        
        const date2 = range2[i] || null;
        const dayName2 = date2 ? getDayName(date2) : '-';
        const data2 = date2 ? getDayDataFull(date2) : null;
        const val2 = data2 ? getValueByTopic(data2, topic) : 0;
        if (data2) { sum2Cust += data2.cust; sum2Val += val2; }
        
        const fmtVal = (v, t) => {
            if (v === null || v === undefined || v === 0) return '-';
            return t === 'cust' ? v.toLocaleString() : '฿' + v.toLocaleString();
        };
        
        bodyHtml += `
            <tr>
                <td style="background:${rowBg1};color:var(--primary, #0f172a);border:${border};font-weight:500;">${dayName1}</td>
                <td style="background:${rowBg1};color:var(--text, #334155);border:${border};">${date1 ? formatShortDate(date1) : '-'}</td>
                <td style="background:${rowBg1};color:var(--text, #334155);border:${border};font-weight:500;">${data1 && data1.cust ? data1.cust.toLocaleString() : '-'}</td>
                <td style="background:${rowBg1};color:var(--success, #16a34a);border:${border};font-weight:600;">${fmtVal(val1, topic)}</td>
                <td style="background:${rowBg2};color:var(--btn-compare1, #6366f1);border:${border};font-weight:500;">${dayName2}</td>
                <td style="background:${rowBg2};color:var(--text, #334155);border:${border};">${date2 ? formatShortDate(date2) : '-'}</td>
                <td style="background:${rowBg2};color:var(--text, #334155);border:${border};font-weight:500;">${data2 && data2.cust ? data2.cust.toLocaleString() : '-'}</td>
                <td style="background:${rowBg2};color:var(--success, #16a34a);border:${border};font-weight:600;">${fmtVal(val2, topic)}</td>
            </tr>`;
    }
    
    const fmtSum = (v, t) => {
        const val = v || 0;
        return t === 'cust' ? val.toLocaleString() : '฿' + val.toLocaleString();
    };
    
    const footHtml = `
        <tr style="font-weight:bold;">
            <td style="background:var(--warning, #f59e0b);color:#000;border:2px solid var(--btn-his2, #cbd5e1);">รวม</td>
            <td style="background:var(--summary-bg, #f1f5f9);color:var(--warning, #d97706);border:2px solid var(--btn-his2, #cbd5e1);">${range1.length} วัน</td>
            <td style="background:var(--summary-bg, #f1f5f9);color:var(--text, #334155);border:2px solid var(--btn-his2, #cbd5e1);font-size:1.05em;">${(sum1Cust || 0).toLocaleString()}</td>
            <td style="background:var(--summary-bg, #f1f5f9);color:var(--success, #16a34a);border:2px solid var(--btn-his2, #cbd5e1);font-size:1.05em;">${fmtSum(sum1Val, topic)}</td>
            <td style="background:var(--warning, #f59e0b);color:#000;border:2px solid var(--btn-his2, #cbd5e1);">รวม</td>
            <td style="background:rgba(147,142,245,0.15);color:var(--btn-compare1, #6366f1);border:2px solid var(--btn-his2, #cbd5e1);">${range2.length} วัน</td>
            <td style="background:rgba(147,142,245,0.15);color:var(--text, #334155);border:2px solid var(--btn-his2, #cbd5e1);font-size:1.05em;">${(sum2Cust || 0).toLocaleString()}</td>
            <td style="background:rgba(147,142,245,0.15);color:var(--success, #16a34a);border:2px solid var(--btn-his2, #cbd5e1);font-size:1.05em;">${fmtSum(sum2Val, topic)}</td>
        </tr>`;
    
    const headEl = document.getElementById('compareTableHead');
    const bodyEl = document.getElementById('comparisonSingleContent');
    const footEl = document.getElementById('compareTableFoot');
    
    if (headEl) headEl.innerHTML = headHtml;
    if (bodyEl) bodyEl.innerHTML = bodyHtml;
    if (footEl) footEl.innerHTML = footHtml;
}
// =========== สำรอง / นำเข้า / ล้างข้อมูล ===========

function exportBackup() {
    try {
        const data = {
            db: typeof db !== 'undefined' ? db : JSON.parse(localStorage.getItem("barber_db") || "[]"),
            archives: typeof archives !== 'undefined' ? archives : JSON.parse(localStorage.getItem("barber_archives") || "[]"),
            account: typeof account !== 'undefined' ? account : JSON.parse(localStorage.getItem("barber_account") || '{"balance":0,"logs":[]}'),
            conf: typeof conf !== 'undefined' ? conf : JSON.parse(localStorage.getItem("barber_conf") || "{}"),
            exported: new Date().toISOString()
        };

        const dateStr = new Date().toISOString().split('T')[0];
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `Barber-Backup-${dateStr}.json`;
        
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);

        if (typeof notify === 'function') {
            notify("success", "สำรองข้อมูลสำเร็จ", "สร้างไฟล์สำรองเรียบร้อย");
        } else if (typeof Swal !== 'undefined') {
            Swal.fire("สำเร็จ", "สำรองข้อมูลเรียบร้อยแล้ว", "success");
        }
    } catch (e) {
        console.error("Export Error:", e);
        if (typeof notify === 'function') {
            notify("error", "ผิดพลาด", "ไม่สามารถสร้างไฟล์สำรองได้");
        } else if (typeof Swal !== 'undefined') {
            Swal.fire("ผิดพลาด", "ไม่สามารถสร้างไฟล์สำรองได้", "error");
        }
    }
}

function importBackup(input) {
    const file = input.files?.[0]; 
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data || typeof data !== 'object' || (!data.db && !data.archives && !data.account && !data.conf)) {
                throw new Error("Wrong format");
            }

            const processImport = () => {
                if (data.db !== undefined) localStorage.setItem("barber_db", JSON.stringify(data.db));
                if (data.archives !== undefined) localStorage.setItem("barber_archives", JSON.stringify(data.archives));
                if (data.account !== undefined) localStorage.setItem("barber_account", JSON.stringify(data.account));
                if (data.conf !== undefined) localStorage.setItem("barber_conf", JSON.stringify(data.conf));

                if (typeof db !== 'undefined' && data.db) db = data.db;
                if (typeof archives !== 'undefined' && data.archives) archives = data.archives;
                if (typeof account !== 'undefined' && data.account) account = data.account;
                if (typeof conf !== 'undefined' && data.conf) conf = data.conf;

                if (typeof notify === 'function') {
                    notify("success", "สำเร็จ", "กำลังรีโหลดข้อมูล...");
                }
                setTimeout(() => location.reload(), 1200);
            };

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'ยืนยันการนำเข้าข้อมูล',
                    text: "ข้อมูลปัจจุบันจะถูกเขียนทับด้วยข้อมูลจากไฟล์สำรอง",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'นำเข้าข้อมูล',
                    cancelButtonText: 'ยกเลิก',
                    confirmButtonColor: 'var(--primary, #3085d6)'
                }).then((r) => { 
                    if (r.isConfirmed) processImport(); 
                });
            } else if (confirm("ยืนยันการนำเข้าข้อมูล? ข้อมูลปัจจุบันจะถูกแทนที่")) {
                processImport();
            }

        } catch (err) {
            console.error("Import Error:", err);
            if (typeof notify === 'function') {
                notify("error", "ไฟล์ไม่ถูกต้อง", "ใช้ไฟล์ .json ที่สำรองจากระบบนี้เท่านั้น");
            } else if (typeof Swal !== 'undefined') {
                Swal.fire("ไฟล์ไม่ถูกต้อง", "โปรดใช้ไฟล์ .json ที่สำรองจากระบบเท่านั้น", "error");
            }
        } finally {
            input.value = '';
        }
    };

    reader.readAsText(file);
}

function clearData() {
    const executeClear = () => {
        localStorage.removeItem("barber_db");
        localStorage.removeItem("barber_archives");
        localStorage.removeItem("barber_account");

        if (typeof db !== 'undefined') db = [];
        if (typeof archives !== 'undefined') archives = [];
        if (typeof account !== 'undefined') account = { balance: 0, logs: [] };

        if (typeof notify === 'function') {
            notify("success", "สำเร็จ", "ล้างข้อมูลเรียบร้อยแล้ว");
        }
        setTimeout(() => location.reload(), 1000);
    };

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'ล้างข้อมูลทั้งหมด?',
            text: "ข้อมูลการบันทึกและประวัติทั้งหมดจะถูกลบ ไม่สามารถกู้คืนได้!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ล้างข้อมูล',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#d33'
        }).then((result) => {
            if (result.isConfirmed) {
                executeClear();
            }
        });
    } else if (confirm("เตือน: ต้องการล้างข้อมูลทั้งหมดหรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
        executeClear();
    }
}
/* ========= END OF SCRIPT — สิ้นสุดโค้ดทั้งหมด ========= */
