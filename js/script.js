/* ==========================================================
   Barber-Note v1.1.0 — FULL VERSION + NEW NAVIGATION
   ========================================================== */
/* =========== SECTION 1: INITIALIZATION & GLOBAL VARIABLES =========== */
const $ = id => document.getElementById(id);
const BUILD_MARK = "1.0.0-20260917-1045"; // 👈 เปลี่ยนชุดตัวเลขนี้
const LAST_UPDATED = "17/09/2026";
window.APP_VERSION = "";
window.BUILD_NUMBER = "";

(function initVersion() {
    const storedMark = localStorage.getItem("build_mark") || "";
    let storedBuild = parseInt(localStorage.getItem("build_num") || "0");

    // ถ้ายังไม่มีบิลด์สะสม หรือเปลี่ยน BUILD_MARK ใหม่ → ให้เพิ่มเลขบิลด์
    if (BUILD_MARK !== storedMark) {
        storedBuild = storedBuild <= 0 ? 1 : storedBuild + 1; // 🟢 ถ้าเริ่มต้นใหม่ให้เป็น 1
        localStorage.setItem("build_mark", BUILD_MARK);
        localStorage.setItem("build_num", String(storedBuild));
        console.log(`🔄 พบการเปลี่ยนแปลงโค้ด — อัปเดตบิลด์ #${storedBuild}`);
    }
    // กำหนดค่าไว้ใช้งานทั่วทั้งแอป
    window.BUILD_NUMBER = storedBuild;
    window.APP_VERSION = BUILD_MARK.split('-')[0] + `.${storedBuild}`;

    // แสดงผลบนหน้าเว็บ (พร้อมป้องการเรียกใช้องค์ประกอบ HTML ก่อนโหลดเสร็จ)
    const renderVersion = () => {
        const verEl = document.getElementById("appVersionDisplay");
        if (verEl) {
            verEl.innerHTML = `v${window.APP_VERSION} · ${LAST_UPDATED}`;
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", renderVersion);
    } else {
        renderVersion();
    }

    console.log(`✅ เวอร์ชันปัจจุบัน: v${window.APP_VERSION} (บิลด์ #${storedBuild})`);
})();
// ========== GLOBAL VARIABLES & INITIALIZATION ==========
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

// ✅ แสดงผลหน้าจอเมื่อโหลด DOM เสร็จ
document.addEventListener("DOMContentLoaded", () => {
    // 1. แสดงเลขเวอร์ชัน
    const el = document.getElementById("appVersionDisplay");
    if (el) {
        const [d, m, y] = LAST_UPDATED.split('/');
        const yrBE = (parseInt(y) + 543).toString().slice(-2);
        el.innerText = `V${window.APP_VERSION} | Update ${d}/${m}/${yrBE}`;
    }
    // 2. แสดงชื่อร้าน
    const savedShopName = localStorage.getItem("shopName") || conf.shop || "BARBER SHOP";
    if ($("shopTitleDisplay")) $("shopTitleDisplay").innerText = savedShopName;
    document.querySelectorAll('.shop-title-text').forEach(el => el.innerText = savedShopName);
    
    // 3. เริ่มระบบสาขา
    initBranchSystem();
    
    // ✅ วางตรงนี้ — ข้างใน DOMContentLoaded เหมือนกัน
    // อัปเดตข้อมูลเก่าให้มีชื่อสาขา — รันครั้งเดียว
    (function migrateOldData() {
        const currentBranch = localStorage.getItem("active_branch_name")
                           || localStorage.getItem("shopName")
                           || "สาขาไม่ระบุ";
        let changed = false;

        // อัปเดต db
        if (Array.isArray(db)) {
            db.forEach(item => {
                if (!item.branch) {
                    item.branch = currentBranch;
                    changed = true;
                }
            });
        }

        // อัปเดต archives
        if (Array.isArray(archives)) {
            archives.forEach(day => {
                if (!day.branch) {
                    day.branch = currentBranch;
                    changed = true;
                }
                // อัปเดตใน details ด้วยถ้ามี
                if (day.details && Array.isArray(day.details)) {
                    day.details.forEach(d => {
                        if (!d.branch) d.branch = currentBranch;
                    });
                }
            });
        }

        if (changed && typeof saveDB === "function") {
            saveDB();
            console.log("✅ อัปเดตข้อมูลเก่าเรียบร้อย:", currentBranch);
        }
    })();
}); // ✅ ปิด DOMContentLoaded ทีเดียวท้ายสุด 
/* =========== SECTION 1A: BRANCH SYSTEM =========== */
const ACTIVE_BRANCH_KEY = "active_branch_name";
const VIEW_SCOPE_KEY = "view_data_scope";

function getActiveBranch() {
  return localStorage.getItem(ACTIVE_BRANCH_KEY) || "สาขาไม่ระบุ";
}

function setActiveBranch(name) {
  name = (name || "").trim();
  if (!name) return;
  localStorage.setItem(ACTIVE_BRANCH_KEY, name);
  renderBranchUI();
  if (typeof renderDay === "function") renderDay();
  if (typeof renderMonthReport === "function") renderMonthReport();
}

function promptSetupBranch() {
  const current = getActiveBranch();
  const newName = prompt("ตั้งชื่อสาขาที่ท่านกำลังทำงาน", current);
  if (newName && newName.trim()) {
    setActiveBranch(newName.trim());
    if (typeof notify === "function") notify("success", "สำเร็จ", `ทำงานที่: ${newName}`);
  }
}

function getViewScope() {
  return localStorage.getItem(VIEW_SCOPE_KEY) || "all";
}

function setViewScope(mode) {
  localStorage.setItem(VIEW_SCOPE_KEY, mode);
  if (typeof renderDay === "function") renderDay();
  if (typeof renderMonthReport === "function") renderMonthReport();
}

function renderBranchUI() {
  const el = document.getElementById("currentBranchDisplay");
  if (el) el.textContent = getActiveBranch();
}

function initBranchSystem() {
  // ❌ ไม่ถามอัตโนมัติ — ไปตั้งค่าที่หน้าตั้งค่าแทน
  renderBranchUI();
}
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
    const allPages = document.querySelectorAll('.page-content, section[id^="page-"], .main-page, .app-page');
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
        
        // Active ปุ่มแท็บที่ถูกกด
        if (event && event.currentTarget) {
            event.currentTarget.classList.add('active');
        }
    }

    // 3. สั่งอัปเดต Bottom Nav
    if (typeof updateNavDisplay === 'function') {
        updateNavDisplay(pageId);
    }

    // 🟢 4. โหลดข้อมูลตามเงื่อนไขแท็บ (แก้ไขจุดนี้)
    if (tabId === 'monthlyTab2') {
        if (typeof initYearOptions === 'function') initYearOptions();
        if (typeof renderYearlyIncomeSummary === 'function') renderYearlyIncomeSummary();
    } else if (tabId === 'monthlyTab1' || pageId === 'pageMonthlyReport') {
        // เรียก renderDailyTableReport() เพื่อวาดตารางสรุปประจำเดือน
        if (typeof renderDailyTableReport === 'function') renderDailyTableReport();
        if (typeof loadHistMonth === 'function') loadHistMonth();
    } else if (pageId === 'report' || pageId === 'pageReport') {
        if (typeof loadHistMonth === 'function') loadHistMonth();
    }
}
/* =========== SECTION 5: AUTO-UPDATE SYSTEM =========== */  
(function autoUpdate() {
    // 🟢 ใช้ BUILD_MARK หรือ APP_VERSION ร่วมกับ Timestamp
    const APP_VERSION = window.APP_VERSION || '1.0.0';
    // สร้าง Build Signature จากเวอร์ชัน + เลขบิลด์อัปเดตล่าสุด
    const BUILD_SIGNATURE = (typeof BUILD_MARK !== 'undefined') 
                            ? `${APP_VERSION}_${BUILD_MARK}` 
                            : APP_VERSION;

    const currentStoredVersion = localStorage.getItem("app_v");

    // ตรวจพบเวอร์ชันใหม่หรือโค้ดมีการอัปเดต
    if (currentStoredVersion !== BUILD_SIGNATURE) {
        console.log(`[AutoUpdate] ตรวจพบไฟล์ใหม่: ${currentStoredVersion || '---'} → ${BUILD_SIGNATURE}`);

        // 1. ล้าง Cache API ทั้งหมดในเบราว์เซอร์
        if ('caches' in window) {
            caches.keys().then(names => {
                Promise.all(names.map(name => caches.delete(name))).then(() => {
                    // 2. บันทึกเวอร์ชันใหม่เมื่อล้าง Cache สำเร็จ
                    localStorage.setItem("app_v", BUILD_SIGNATURE);
                    
                    if (currentStoredVersion) {
                        if (typeof notify === 'function') {
                            notify("info", "✨ อัปเดตระบบ", `กำลังรีโหลดเวอร์ชันใหม่...`);
                        }
                        setTimeout(() => {
                            window.location.reload(true);
                        }, 800);
                    } else {
                        localStorage.setItem("app_v", BUILD_SIGNATURE);
                    }
                });
            });
        } else {
            localStorage.setItem("app_v", BUILD_SIGNATURE);
            if (currentStoredVersion) {
                window.location.reload(true);
            }
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
        localStorage.setItem("barber_db", JSON.stringify(typeof db !== "undefined" ? db : []));
        localStorage.setItem("barber_archives", JSON.stringify(typeof archives !== "undefined" ? archives : []));
        localStorage.setItem("barber_account", JSON.stringify(typeof account !== "undefined" ? account : {}));
        localStorage.setItem("barber_conf", JSON.stringify(typeof conf !== "undefined" ? conf : {}));
        return true;
    } catch (e) { 
        console.error("❌ บันทึกไม่ได้:", e); 
        return false; 
    }
}

function saveSettings() {
    // Helper Selector กัน Error
    const $ = (id) => document.getElementById(id);
    try {
        // 1. ดึงค่าจากฟอร์ม (ใช้ช่องชื่อร้านเป็นชื่อสาขา)
        const settings = {
            shop:        $("setShop")?.value?.trim() || "สาขาไม่ระบุ",
            branch:      $("setShop")?.value?.trim() || "สาขาไม่ระบุ", // ✅ ใช้ค่าเดิมร่วมกัน
            perc:        parseFloat($("setPerc")?.value) || 0,
            guar:        parseFloat($("setGuar")?.value) || 0,
            offsiteRate: parseFloat($("setOffsite")?.value) || 0,
            theme:       $("setTheme")?.value || "light",
            voice:       $("setVoice")?.value || "default.mp3",
            sound:       $("setSound")?.value || "on"
        };

        // 2. อัปเดตตัวแปรกลาง
        if (typeof conf !== "undefined") {
            Object.assign(conf, settings);
        } else {
            window.conf = { ...settings };
        }

        // 3. บันทึกลง LocalStorage
        const confJSON = JSON.stringify(window.conf);
        localStorage.setItem('barber_conf', confJSON);
        localStorage.setItem('barberConf', confJSON);

        // บันทึกแยกคีย์ — ✅ เพิ่มบรรทัด active_branch_name
        localStorage.setItem('shopName',          settings.shop);
        localStorage.setItem('active_branch_name', settings.branch); // ← ขาดจุดนี้! เพิ่มแล้วทำงานครบ ✅
        localStorage.setItem('shopPerc',          settings.perc);
        localStorage.setItem('shopGuar',          settings.guar);
        localStorage.setItem('shopOffsiteRate',   settings.offsiteRate);
        localStorage.setItem('shopTheme',         settings.theme);
        localStorage.setItem('shopVoice',         settings.voice);
        localStorage.setItem('shopSound',         settings.sound);

        if (typeof saveDB === "function") saveDB();

        // 4. อัปเดตการแสดงผล
        const nameDisp = $("shopNameDisp") || $("shopNameDisplay");
        if (nameDisp) {
            nameDisp.innerText = settings.shop.toUpperCase();
        }

        // ✅ รีเฟรชส่วนที่แสดงชื่อสาขา + รายงาน
        if (typeof renderBranchUI === "function") renderBranchUI();
        if (typeof applyTheme === "function") applyTheme(settings.theme);
        if (typeof calculateMoney === "function") calculateMoney();

        const currentDate = $("dateInp")?.value || new Date().toISOString().split('T')[0];
        if (typeof renderDay === "function") renderDay(currentDate);
        if (typeof renderDailyTableReport === "function") renderDailyTableReport(); // รีเฟรชรายงานทันที

        if ($("modalSet")) $("modalSet").style.display = 'none';

        // แจ้งผล
        if (typeof notify === "function") {
            notify("success", "บันทึกสำเร็จ", `สาขา: ${settings.branch}`);
        } else if (typeof Swal !== 'undefined') {
            Swal.fire({ title: 'บันทึกสำเร็จ', text: `สาขา: ${settings.branch}`, icon: 'success', timer: 1500, showConfirmButton: false });
        }
    } catch (e) {
        console.error("saveSettings error:", e);
        if (typeof notify === "function") {
            notify("error", "เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลตั้งค่าได้");
        } else if (typeof Swal !== 'undefined') {
            Swal.fire({ title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถบันทึกข้อมูลตั้งค่าได้', icon: 'error' });
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
    // 🎯 ดึงค่าจากการตั้งค่าพร้อม Fallback กัน undefined
    const currentConf = (typeof conf !== 'undefined' && conf) ? conf : JSON.parse(localStorage.getItem('barber_conf') || '{}');
    
    // 1. ตรวจสอบสถานะการเปิด/ปิดเสียง
    const soundSetting = currentConf.sound || localStorage.getItem('shopSound') || "on";
    if (soundSetting === "off") return;

    // 2. ตรวจสอบประเภทเสียง (รองรับทั้งการตั้งค่าเพศ male/female หรือชื่อไฟล์)
    const voiceSetting = String(currentConf.voice || localStorage.getItem('shopVoice') || "").toLowerCase();
    const isMan = voiceSetting === "male" || voiceSetting.includes("man") || voiceSetting.includes("male");

    // 3. เลือกระบุ Element เสียงตามการตั้งค่า
    const audioId = (type === "success") 
        ? (isMan ? "successSoundMan" : "successSoundWoman")
        : (isMan ? "errorSoundMan" : "errorSoundWoman");
    
    const $ = (id) => document.getElementById(id);
    const audio = $(audioId) || $(type === "success" ? "successSound" : "errorSound"); // ถอยไปใช้ ID หลักหากไม่แยกชาย/หญิง
    
    if (audio) { 
        audio.pause(); 
        audio.currentTime = 0; 
        audio.play().catch(e => console.warn("Audio autoplay prevented:", e)); 
    }

    // 4. อ่านข้อความเสียง (Text-to-Speech)
    if (message && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'th-TH';
        utterance.rate = 1.0; // ความเร็วปกติ
        window.speechSynthesis.speak(utterance);
    }
}

// 🔓 ปลดล็อกการเล่นเสียง Autoplay บนเบราว์เซอร์
document.addEventListener('click', function unlockAudio() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    }
    document.removeEventListener('click', unlockAudio);
}, { once: true });

function notify(type, title, text = "") {
    // 📢 ส่งข้อความ title/text ให้อ่านเสียง TTS ตามการตั้งค่า
    const speechMsg = text || title;
    speak(type, speechMsg);

    // แสดงแจ้งเตือน SweetAlert2 หรือ alert ปกติ
    if (typeof Swal === 'undefined') { 
        alert(`${title}\n${text}`); 
        return; 
    }

    Swal.fire({ 
        icon: type, 
        title: title, 
        text: text, 
        timer: 2200, 
        showConfirmButton: false,
        timerProgressBar: true, 
        background: 'var(--card, #1e293b)', 
        color: 'var(--text, #ffffff)',
        iconColor: type === 'success' ? 'var(--success, #10b981)' : 'var(--danger, #ef4444)'
    });
}
/* ========= SECTION 9: PAYMENT TYPE ========= */
function editTime(id) {
    const rec = db.find(r => r.id === id);
    if (!rec) return;
    
    const newStart = prompt("⏱️ แก้เวลาเริ่ม (HH:MM)", rec.time);
    if (!newStart) return;
    
    const newEnd = prompt("⏱️ แก้เวลาเสร็จ (HH:MM)", rec.endTime || "");
    
    rec.time = newStart;
    // ถ้าไม่มีเวลาเสร็จ ให้บวกไป 30 นาทีอัตโนมัติ (ถ้ามีฟังก์ชัน addMinutes)
    rec.endTime = newEnd || (typeof addMinutes === 'function' ? addMinutes(newStart, 30) : "");
    
    saveDB();
    renderDay();
}

function setPaymentType(m) {
    payMethod = m;

    const priceInp = $("priceInp");
    const mixPanel = $("mixPanel");
    const payTypeSelect = $("payTypeSelect");

    // 🎯 จัดการ Dropdown เลือกประเภทจ่ายเงิน
    if (payTypeSelect) {
        if (m === "") {
            payTypeSelect.value = "";
            payTypeSelect.selectedIndex = 0;
            
            // 🔥 รีเฟรช Element แก้ปัญหา UI ไอคอนทับข้อความ
            const originalDisplay = payTypeSelect.style.display;
            payTypeSelect.style.display = 'none';
            payTypeSelect.offsetHeight; // Trigger reflow
            payTypeSelect.style.display = originalDisplay;
        } else {
            payTypeSelect.value = m;
        }
    }

    // 🧹 เคลียร์ค่าเมื่อรีเซ็ต หรือเมื่อเลือกสิทธิ์ฟรีทุกรูปแบบ (Free / Free+Cash / Free+Trans)
    const isFreeType = m === 'Free' || m === 'FreeCash' || m === 'FreeTrans';

    if (m === "" || isFreeType) {
        if ($("mixCash")) $("mixCash").value = "";
        if ($("mixTrans")) $("mixTrans").value = "";
        if (mixPanel) mixPanel.style.display = 'none';

        if (isFreeType && priceInp) {
            // 🎯 ให้ยึดค่าจากตั้งค่า: ปลดล็อก/ล็อก ช่องราคาตามการใช้งานปกติ ไม่ไปเขียนทับค่า 300 หรือ 0 ที่ตั้งไว้
            priceInp.readOnly = false;
            priceInp.style.opacity = '1';
        }

        if (m === "") return;
    } else {
        // 🔓 ปลดล็อกช่องราคาสำหรับวิธีชำระปกติ
        if (priceInp) {
            priceInp.readOnly = false;
            priceInp.style.opacity = '1';
        }
    }

    // 🧮 จัดการแผงการชำระแบบผสม (Mix Panel)
    if (mixPanel) {
        if (m === 'Mix') {
            mixPanel.style.display = 'block';
            if ($("mixCash")) $("mixCash").value = ""; 
            updateMixValues(); // คำนวณยอดโอนเริ่มต้นให้อัตโนมัติ
            mixPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            mixPanel.style.display = 'none';
        }
    }
}

// 🔄 คำนวณยอดเงินสด/เงินโอนอัตโนมัติ
function updateMixValues(fromField = 'cash') {
    const price = parseFloat($("priceInp")?.value) || 0;
    const tip = parseFloat($("tipInp")?.value) || 0;
    const total = price + tip;

    if (fromField === 'cash') {
        const cash = parseFloat($("mixCash")?.value) || 0;
        const remain = total - cash;
        if ($("mixTrans")) {
            $("mixTrans").value = remain >= 0 ? remain : 0;
        }
    } else if (fromField === 'trans') {
        const trans = parseFloat($("mixTrans")?.value) || 0;
        const remain = total - trans;
        if ($("mixCash")) {
            $("mixCash").value = remain >= 0 ? remain : 0;
        }
    }
}

// 📌 ผูก Event Listeners ปลอดภัยเมื่อ DOM โหลดเรียบร้อย
document.addEventListener("DOMContentLoaded", () => {
    if ($("mixCash")) {
        $("mixCash").addEventListener("input", function() {
            if (payMethod === 'Free' || payMethod === '') {
                this.value = "";
                if ($("mixTrans")) $("mixTrans").value = "";
                return;
            }
            updateMixValues('cash');
        });
    }

    if ($("mixTrans")) {
        $("mixTrans").addEventListener("input", function() {
            if (payMethod === 'Free' || payMethod === '') {
                this.value = "";
                if ($("mixCash")) $("mixCash").value = "";
                return;
            }
            updateMixValues('trans');
        });
    }

    // อัปเดตยอด Mix ทันทีเมื่อมีการเปลี่ยนราคาหรือทิป
    $("priceInp")?.addEventListener("input", () => { if (payMethod === 'Mix') updateMixValues('cash'); });
    $("tipInp")?.addEventListener("input", () => { if (payMethod === 'Mix') updateMixValues('cash'); });
});

/* ========== SECTION 10: BUSINESS LOGIC & COMMISSION CALCULATION ========== */
// 🟢 1. ฟังก์ชันจัดการเมื่อเปลี่ยนประเภทลูกค้า (ปลดล็อก readOnly ให้แก้ไขราคาได้)
// 1. ฟังก์ชันจัดการเมื่อเปลี่ยนประเภทลูกค้า
function handleCustTypeChange(value) {
    const priceInp = document.getElementById('priceInp');
    if (!priceInp) return;

    if (value === 'offsite') {
        // ดึงค่าตั้งต้นจากการตั้งค่า
        const offsiteRate = (typeof conf !== 'undefined' && conf.offsiteRate) 
                            ? conf.offsiteRate 
                            : parseFloat(localStorage.getItem('offsiteRate'));

        // 🔔 ถ้ายังไม่ได้ตั้งค่าส่วนแบ่ง/ราคานอกสถานที่ ให้แสดงแจ้งเตือน
        if (!offsiteRate || isNaN(offsiteRate)) {
            if (typeof notify === "function") {
                notify("warning", "ยังไม่ได้ตั้งค่า", "ยังไม่ได้ตั้งค่าส่วนแบ่งนอกสถานที่ กรุณาตั้งค่าในเมนูการตั้งค่า");
            } else if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'ยังไม่ได้ตั้งค่าส่วนแบ่ง',
                    text: 'กรุณาไปตั้งค่าราคาส่วนแบ่งงานนอกสถานที่ในการตั้งค่าระบบก่อน',
                    icon: 'warning',
                    confirmButtonText: 'ตกลง'
                });
            }
            priceInp.value = '';
        } else {
            priceInp.value = offsiteRate;
        }

        // 🔓 ปลดล็อกช่องราคา ให้ระบุ/แก้ไขราคาจริงได้อิสระ
        priceInp.readOnly = false;
        priceInp.style.opacity = '1';
        priceInp.focus();
        priceInp.select();
    } else {
        priceInp.readOnly = false;
        priceInp.style.opacity = '1';
    }
}
// 🟢 2. ฟังก์ชันคำนวณส่วนแบ่งช่าง/ร้าน (คำนวณตามราคาที่กรอกจริง ไม่ฮาร์ดโค้ด)
function calcShares(price, custType, isFree = false, shopCommissionRate = 0.50) {
    const numericPrice = parseFloat(price) || 0;
    
    // หากเป็นรายการฟรี
    if (isFree) {
        return { b: 0, s: 0, barberShare: 0, shopShare: 0 };
    }
    
    if (custType === 'offsite') {
        // 🚗 นอกสถานที่: คำนวณจากราคาที่กรอกจริง (ร้านเก็บค่าบริการคงที่ 100 ส่วนที่เหลือเป็นของช่าง)
        const offsiteShopFee = parseFloat(localStorage.getItem('offsiteShopFee')) || 100;
        const shop = Math.min(numericPrice, offsiteShopFee); // ร้านได้ตามค่าธรรมเนียม (ไม่เกินราคางาน)
        const barber = Math.max(0, numericPrice - shop);     // ช่างได้ส่วนที่เหลือทั้งหมด
        
        return { b: barber, s: shop, barberShare: barber, shopShare: shop };
    } else {
        // ✂️ ในร้านปกติ: คำนวณตาม % ที่กำหนด
        const barber = Math.round(numericPrice * shopCommissionRate);
        const shop = numericPrice - barber;
        return { b: barber, s: shop, barberShare: barber, shopShare: shop };
    }
}

// สร้าง Alias ไว้รองรับกรณีที่มีฟังก์ชันอื่นเรียกใช้ชื่อเต็ม
const calculateShares = calcShares;

/* ========= SECTION 11: SAVE RECORD ========= */
async function handleSave(event) {
    const $ = (id) => document.getElementById(id);
    
    // ✅ 1. ดึงค่าพื้นฐาน
    const todayStr = new Date().toISOString().split('T')[0];
    const dInp = $("dateInp")?.value || todayStr;
    const tStart = $("tStart")?.value || "";
    const tEnd = $("tEnd")?.value || "";
    const price = parseFloat($("priceInp")?.value) || 0;
    const tip = parseFloat($("tipInp")?.value) || 0;
    const custTypeVal = $("custType")?.value || 'none';
    const hairStyleSelect = $("hairStyle");
    const currentPay = payMethod;
    
    // ✅ 2. ตรวจสอบความครบถ้วน
    if (!currentPay) {
        if (navigator.vibrate) navigator.vibrate(100);
        return notify("error", "ระบุข้อมูลไม่ครบ", "กรุณาเลือกวิธีชำระเงิน");
    }
    const isFreePay = /^Free/.test(currentPay) || ["Holiday", "Guarantee"].includes(currentPay);
    if (price === 0 && !isFreePay) {
        if (navigator.vibrate) navigator.vibrate(100);
        $("priceInp")?.focus();
        return notify("error", "ระบุข้อมูลไม่ครบ", "กรุณาระบุจำนวนเงิน");
    }
    if (hairStyleSelect && !isFreePay) {
        const val = hairStyleSelect.value;
        if (!val || val === "" || val === "เลือกทรงผม") {
            if (navigator.vibrate) navigator.vibrate(100);
            hairStyleSelect.focus();
            return notify("error", "ระบุข้อมูลไม่ครบ", "กรุณาเลือกทรงผม");
        }
    }
    
    // ✅ 3. จัดการยอดเงินตามประเภทจ่าย
    let finalCash = 0, finalTrans = 0;
    switch (currentPay) {
        case "Free": 
            finalCash = finalTrans = 0; 
            break;
        case "Free-Cash": 
            finalCash = price; 
            break;
        case "Free-Trans": 
            finalTrans = price + tip; 
            break;
        case "Cash": 
            finalCash = price + tip; 
            break;
        case "Trans": 
            finalTrans = price + tip; 
            break;
        case "Mix":
            finalCash = parseFloat($("mixCash")?.value) || 0;
            finalTrans = parseFloat($("mixTrans")?.value) || 0;
            
            if (finalCash + finalTrans !== price + tip) {
                const result = await Swal.fire({
                    title: 'ยืนยันยอดเงิน',
                    text: `จ่ายจริง ${finalCash + finalTrans} / บิล ${price + tip}`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: 'var(--success)',
                    confirmButtonText: 'บันทึกต่อ',
                    cancelButtonText: 'แก้ไข',
                    background: 'var(--card)',
                    color: 'var(--text)'
                });
                if (!result.isConfirmed) return;
            }
            break;
    }
    
    // ✅ 4. รวบรวมรายการบริการ
    const svcs = [];
    if (hairStyleSelect?.value) svcs.push(hairStyleSelect.value);
    if ($("extra1")?.value) svcs.push($("extra1").value);
    if ($("extra2")?.value) svcs.push($("extra2").value);
    
    // 🟢 4.1 คำนวณส่วนแบ่ง — ปรับให้ตรงหน้าตั้งค่า 100%
    let barberShare = 0;
    let shopShare = 0;
    const isOffsite = (custTypeVal === 'offsite');
    const isFree = /^Free/.test(currentPay);
    
    // ดึงค่าการตั้งค่า — ตรงกับ renderDay ทุกประการ
    const shopRate = parseFloat(localStorage.getItem('shopCommissionRate')) || 
        ((typeof conf !== 'undefined' && conf && conf.perc) ? (conf.perc / 100) : 0.50);
    
    // ✅ นอกสถานที่ — ดึงทั้งค่าช่างและร้าน
    const offsiteBarberFee = parseFloat(localStorage.getItem('offsiteBarberFee')) || 
        ((typeof conf !== 'undefined' && conf && conf.offsiteBarber) ? conf.offsiteBarber : 200);
    const offsiteShopFee = parseFloat(localStorage.getItem('offsiteShopFee')) || 
        ((typeof conf !== 'undefined' && conf && conf.offsiteShop) ? conf.offsiteShop : 100);
    
    // ✅ ค่าชดเชยกรณีฟรี
    const freeBarberComp = parseFloat(localStorage.getItem('freeBarberComp')) || 
        ((typeof conf !== 'undefined' && conf && conf.freeBarber) ? conf.freeBarber : 100);
    const freeShopComp = parseFloat(localStorage.getItem('freeShopComp')) || 
        ((typeof conf !== 'undefined' && conf && conf.freeShop) ? conf.freeShop : 0);
    
    if (isOffsite && isFree) {
        // 📌 นอกสถานที่ + ฟรี → ค่าชดเชยตามตั้งค่า
        barberShare = freeBarberComp;
        shopShare = freeShopComp;
    } else if (isOffsite) {
        // 🚗 นอกสถานที่ปกติ → ตามค่าที่กำหนดแยกกันในหน้าตั้งค่า
        barberShare = offsiteBarberFee;
        shopShare = offsiteShopFee;
        // 💡 ถ้าต้องการให้รวมเท่ากับราคาที่จ่าย เปลี่ยนเป็น:
        // barberShare = offsiteBarberFee;
        // shopShare = Math.max(0, price - offsiteBarberFee);
    } else if (isFree) {
        // 📌 ฟรีในร้าน → ค่าชดเชย
        barberShare = freeBarberComp;
        shopShare = freeShopComp;
    } else {
        // 📌 ปกติในร้าน → คิดเป็น %
        const bPart = Math.round(price * (1 - shopRate));
        barberShare = bPart;
        shopShare = price - bPart;
    }
    
    // ✅ 5. บันทึกข้อมูล
    db.push({
        id: Date.now(), 
        date: dInp, 
        branch: getActiveBranch(), // ✅ เพิ่มตรงนี้  
        startTime: tStart || "", 
        time: tStart || "", 
        endTime: tEnd || (typeof addMinutes === 'function' ? addMinutes(tStart, 30) : tStart),
        price: price || 0, 
        tip: tip || 0, 
        pay: currentPay || "", 
        svcs: svcs || [],
        payCash: typeof finalCash !== 'undefined' ? finalCash : 0, 
        payTrans: typeof finalTrans !== 'undefined' ? finalTrans : 0,
        custType: custTypeVal || 'none',
        barberShare: barberShare, 
        shopShare: shopShare, 
        type: 'SERVICE'
    });
    saveDB();
    
    // ✅ 6. แจ้งผลสำเร็จ
    notify("success", "บันทึกสำเร็จ", "จัดเก็บข้อมูลเรียบร้อยแล้ว");
    const sfx = document.getElementById("successSound");
    if (sfx) {
        sfx.currentTime = 0;
        sfx.play().catch(e => console.log("Audio play failed"));
    }
    
    // ✨ 7. Animation ปุ่มบันทึก
    const btnSave = event?.currentTarget || document.querySelector(".btn-save");
    if (btnSave) {
        const originalContent = btnSave.innerHTML;
        const originalBg = btnSave.style.background;
        btnSave.style.setProperty("background", "var(--success)", "important");
        btnSave.innerHTML = `<i class="fas fa-check-circle"></i> <span>เรียบร้อย</span>`;
        setTimeout(() => {
            btnSave.style.background = originalBg;
            btnSave.innerHTML = originalContent;
        }, 1200);
    }
    
    // ✅ 8. รีเซ็ตฟอร์ม
    payMethod = ""; 
    if (typeof setPaymentType === 'function') setPaymentType("");
    
    const now = new Date();
    const curTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    $("tStart") && ($("tStart").value = curTime);
    $("tEnd") && ($("tEnd").value = curTime);
    
    if ($("priceInp")) {
        $("priceInp").value = "";
        $("priceInp").readOnly = false;
        $("priceInp").style.backgroundColor = "";
    }
    
    $("tipInp") && ($("tipInp").value = "0");
    $("mixCash") && ($("mixCash").value = "");
    $("mixTrans") && ($("mixTrans").value = "");
    
    if (hairStyleSelect) hairStyleSelect.selectedIndex = 0;
    $("extra1") && ($("extra1").selectedIndex = 0);
    $("extra2") && ($("extra2").selectedIndex = 0);
    $("custType") && ($("custType").selectedIndex = 0);
    
    if ($("mixPanel")) $("mixPanel").style.display = 'none';
    
    // ✅ โหลดข้อมูลใหม่
    if (typeof renderDay === 'function') renderDay(dInp);
    if (typeof loadAccountStatus === 'function') loadAccountStatus();
    
    if ($("custType")) $("custType").focus();
}
/* ========= SECTION 12: RENDER DAILY REPORT ========= */
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
    const extraSvcs = ["โกนหนวด", "กันหน้า", "สระผม", "กันจอน", "ย้อมแฟชั่น", "ดัดผม", "แคะหู"];
    
    let tot = 0, trans = 0, cash = 0, tips = 0;
    let calcBarberShare = 0;
    let calcShopShare = 0;

    // ✅ ปรับปรุง: ดึงค่าการตั้งค่าให้ครบถ้วน ทั้ง localStorage และ conf
    const shopRate = parseFloat(localStorage.getItem('shopCommissionRate')) || ((typeof conf !== 'undefined' && conf && conf.perc) ? (conf.perc / 100) : 0.50);
    
    // 🟢 นอกสถานที่ — ดึงค่าตามลำดับ: localStorage → conf → ค่าเริ่มต้น
    const offsiteBarberFee = parseFloat(localStorage.getItem('offsiteBarberFee')) || ((typeof conf !== 'undefined' && conf && conf.offsiteBarber) ? conf.offsiteBarber : 200);
    const offsiteShopFee = parseFloat(localStorage.getItem('offsiteShopFee')) || ((typeof conf !== 'undefined' && conf && conf.offsiteShop) ? conf.offsiteShop : 100);
    
    const freeBarberComp = parseFloat(localStorage.getItem('freeBarberComp')) || ((typeof conf !== 'undefined' && conf && conf.freeBarber) ? conf.freeBarber : 100);
    const freeShopComp = parseFloat(localStorage.getItem('freeShopComp')) || ((typeof conf !== 'undefined' && conf && conf.freeShop) ? conf.freeShop : 0);

    let listHtml = "";
    let realCustomerCount = 0;
    let countNew = 0;
    let countRegular = 0;
    let countOffsite = 0;

    allRec.slice().sort((a, b) => a.time.localeCompare(b.time)).forEach((r, i) => {
        const p = parseFloat(r.price) || 0;
        const t = parseFloat(r.tip) || 0;
        const rType = r.type ? String(r.type).toUpperCase().trim() : '';
        const currentSvcs = Array.isArray(r.svcs) ? r.svcs : [];
        const cType = r.custType || 'none';
        const timeShow = r.endTime ? `${r.time}-${r.endTime}` : r.time;
        const payStr = r.pay ? String(r.pay).trim() : 'เงินสด';
        const isFree = payStr.includes('ฟรี') || payStr.toLowerCase().includes('free');
        const isPureFree = isFree && !(payStr.includes('สด') || payStr.toLowerCase().includes('cash') || payStr.includes('โอน') || payStr.toLowerCase().includes('trans'));
        
        // 1. คำนวณยอดเงินรวม
        if (payStr.includes('Mix') || payStr.includes('ผสม')) {
            const pCash = parseFloat(r.payCash) || 0;
            const pTrans = parseFloat(r.payTrans) || 0;
            tot += p; trans += pTrans; cash += (pCash - t);
        } else if (payStr.includes('Trans') || payStr.includes('โอน') || payStr.includes('📱')) {
            tot += p; trans += (p + t);
        } else if (!isPureFree) {
            tot += p; cash += p;
        }
        if (!isPureFree) tips += t;

        // 2. 🟢 คำนวณส่วนแบ่ง — ปรับปรุงตรงนี้
        if (r.barberShare !== undefined && r.shopShare !== undefined) {
            calcBarberShare += r.barberShare;
            calcShopShare += r.shopShare;
        } else if (cType === 'offsite' && isFree) {
            // นอกสถานที่ + ฟรี → ใช้ค่าชดเชยตามตั้งค่า
            calcBarberShare += freeBarberComp;
            calcShopShare += freeShopComp;
        } else if (cType === 'offsite') {
            // ✅ นอกสถานที่ ปกติ → ตามค่าที่กำหนดในหน้าตั้งค่าโดยตรง
            calcBarberShare += offsiteBarberFee;
            calcShopShare += offsiteShopFee;
            // หมายเหตุ: ถ้าต้องการให้ยอดรวมตรงกับราคาที่ระบุ ให้ใช้บรรทัดล่างแทน
            // calcBarberShare += offsiteBarberFee;
            // calcShopShare += Math.max(0, p - offsiteBarberFee);
        } else if (isFree) {
            calcBarberShare += freeBarberComp;
            calcShopShare += freeShopComp;
        } else {
            const bPart = Math.round(p * (1 - shopRate));
            calcBarberShare += bPart;
            calcShopShare += (p - bPart);
        }

        // 3. สถิติลูกค้า
        if (!(rType === 'HOLIDAY' || rType === 'GUARANTEE' || (p === 0 && isPureFree))) {
            if (currentSvcs.length > 0 || cType === 'offsite') {
                realCustomerCount++;
                if (cType === 'new') countNew++;
                if (cType === 'regular') countRegular++;
                if (cType === 'offsite') countOffsite++;
            }
            currentSvcs.forEach(s => { if (s) stats[s] = (stats[s] || 0) + 1; });
        }

        // 4. สร้างรายการแสดงผล
        let payIcon = '💵';
        let moneyDetailText = `฿${p}`;
        if (isFree) {
            if (payStr.includes('สด') || payStr.toLowerCase().includes('cash')) {
                payIcon = '🎁 + 💵';
            } else if (payStr.includes('โอน') || payStr.includes('Trans') || payStr.toLowerCase().includes('trans')) {
                payIcon = '🎁 + 📱';
            } else {
                payIcon = '🎁 ใช้สิทธิ์ฟรี';
                moneyDetailText = `<span style="color:#64748b; font-size:13px; font-weight:normal;">฿0</span>`;
            }
        } else if (payStr.includes('Mix') || payStr.includes('ผสม')) {
            payIcon = '🌓';
            const pCash = parseFloat(r.payCash) || 0;
            const pTrans = parseFloat(r.payTrans) || 0;
            moneyDetailText = `฿${p} <br><small style="color:#64748b; font-size:10px; font-weight:normal;">(สด:${pCash}/โอน:${pTrans})</small>`;
        } else if (payStr.includes('Trans') || payStr.includes('โอน') || payStr.includes('📱')) {
            payIcon = '📱';
        }
        let custTag = ""; 
        if (cType === 'offsite') custTag = ` <span style="background:#ef4444; color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; font-weight:bold;">🚗 นอกสถานที่</span>`;
        else if (cType === 'new') custTag = ` <span style="color:#22c55e; font-size:11px; font-weight:bold;">[🌟]</span>`;
        else if (cType === 'regular') custTag = ` <span style="color:#eab308; font-size:11px; font-weight:bold;">[📌]</span>`;
        listHtml += `
        <div class="history-row" style="padding:15px; border-bottom:1px solid #f1f5f9; background:#fff;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:28px; height:28px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; color:#64748b; flex-shrink:0;">
                        ${i+1}
                    </div>
                    <div style="display:flex; flex-direction:column;">
                        <div style="font-weight:800; font-size:14px; color:#1e293b; margin-bottom:2px;">
                            <span style="color:#64748b; font-weight:500;">[${timeShow}]</span> ${currentSvcs.join(' + ') || 'ตัดนอกสถานที่'}${custTag}
                        </div>
                        <div style="display:flex; gap:8px; align-items:center;">
                            ${t ? `<small style="color:#be185d; font-weight:700; font-size:11px;">🔹 ทิป: ฿${t}</small>` : '<small style="color:#94a3b8; font-size:11px;">(ไม่มีทิป)</small>'}
                        </div>
                    </div>
                </div>
                <div style="text-align:right;">
                    <b style="font-size:15px; display:block; color:#1e293b; line-height:1.2;">
                        <span style="font-size:13px; font-weight:bold;">${payIcon}</span> ${moneyDetailText}${t ? ` <span style="color:#be185d;">(+${t})</span>` : ''}
                    </b>
                    <span style="font-size:11px; font-weight:700; color:#ef4444; cursor:pointer;" onclick="delRec(${r.id})">ลบ</span>
                </div>
            </div>
        </div>`;
    });

    // 5. สรุปยอดเงิน
    const guarAmt = (typeof conf !== 'undefined' && conf && conf.guar) ? conf.guar : 0;
    const bEarn = isHoliday ? 0 : Math.max(calcBarberShare, guarAmt) + tips;
    const sEarn = isHoliday ? 0 : (tot - (bEarn - tips)); 
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
            if (countNew > 0 || countRegular > 0 || countOffsite > 0) {
                detail = `
                <div style="font-size: 12px; font-weight: 700; margin-top: 4px; border-top: 1px dashed #e2e8f0; padding-top: 4px;">
                    <span style="color: #22c55e;">🌟 ใหม่: ${countNew}</span> 
                    <span style="opacity: 0.3;">|</span> 
                    <span style="color: #f59e0b;">📌 ประจำ: ${countRegular}</span>
                    <span style="opacity: 0.3;">|</span> 
                    <span style="color: #ef4444;">🚗 นอกสถานที่: ${countOffsite}</span>
                </div>`;
            }
            $("dCounts").innerHTML = `
                <div style="line-height: 1.2;">
                    <b style="font-size: 16px;">ลูกค้า: ${realCustomerCount} คน</b>
                    ${detail}
                </div>`;
        }
    }

    let sH = `<div style="display:flex; flex-wrap:wrap; gap:4px; justify-content:center; margin-bottom:8px;">`;
    const cleanExtras = extraSvcs.map(s => s.trim().toLowerCase());
    const allStatsKeys = Object.keys(stats);
    const haircutGroup = allStatsKeys.filter(k => !cleanExtras.includes(k.trim().toLowerCase()));
    const extraGroup = allStatsKeys.filter(k => cleanExtras.includes(k.trim().toLowerCase()));
    haircutGroup.forEach(k => {
        sH += `<span style="background:#4338ca;color:#fff;padding:3px 10px;border-radius:6px;font-size:10px;font-weight:800;">${k}: ${stats[k]}</span>`;
    });
    extraGroup.forEach(k => {
        sH += `<span style="background:#e0f2fe;color:#0369a1;padding:3px 10px;border-radius:6px;font-size:10px;font-weight:700;border:1px solid #bae6fd;">${k}: ${stats[k]}</span>`;
    });
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
            <div id="settleBar" style="flex:8; height:55px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; border-radius:18px; font-weight:800; font-size:14px; color:${statusColor}; border:1px solid #e2e8f0;">
                <span style="margin-right:8px; font-size:18px;">${icon}</span> ${txt}
            </div>
            <button id="btnSubmitSend" onclick="saveAndGo('${dInp}', ${tot})" 
                style="flex:2.2; height:55px; background:#ff6f00; color:#fff; border-radius:18px; border:none; font-size:22px; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                <i id="btnIcon" class="fas fa-paper-plane"></i>
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
            displayDateBE = `${d}/${m}/${yBE}`;
        }
        dList.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 8px 12px; border-radius: 12px; border-bottom: 2px solid #f1f5f9; margin-bottom: 10px;">            
                <div style="display: flex; align-items: center; gap: 10px; margin-right: 15px;">
                    <b style="font-size: 13px; color: #1e293b;">รายงานวันที่</b>            
                    <div style="position: relative; background: #f1f5f9; padding: 5px 12px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; align-items: center; cursor: pointer; width: 140px; height: 34px;"> 
                        <span style="font-size: 14px; font-weight: 700; color: #6366f1; width: 100%; text-align: center;">
                            ${dayName} ${displayDateBE}
                        </span>                            
                        <input type="date" id="reportDateSelector" value="${dInp}" 
                               onchange="renderDay(this.value)" 
                               style="position: absolute; opacity: 0; left: 0; top: 0; width: 100%; height: 100%; cursor: pointer;">
                    </div>
                    <button onclick="deleteArchiveDate('${dInp}')" 
                            title="ลบข้อมูลของวันนี้"
                            style="background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; width: 34px; height: 34px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;">
                        <i class="fas fa-trash-alt" style="font-size: 18px;"></i>
                    </button>
                </div>
                <div style="display: flex; align-items: center;">
                    <i class="fab fa-line" style="color: #22c55e; font-size: 34px; cursor: pointer;" onclick="shareLine()"></i>
                </div>
            </div>
            <div style="padding: 0 5px;">
                ${isHoliday ? `<center style='padding:30px; color:#64748b;'>🏖️ วันหยุด (${displayDateBE})</center>` : (listHtml || "<center style='padding:30px; color:#94a3b8;'>ไม่มีข้อมูล</center>")}
            </div>`;
    } 
}

/* ========= SECTION 13: DELETE RECORD ========= */
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

/* ========= SECTION 14: SAVE & CLOSE DAY ========= */
async function saveAndGo(date, total) {
    if (typeof db === 'undefined' || typeof archives === 'undefined') return;
    const btn = document.getElementById("btnSubmitSend");
    const icon = document.getElementById("btnIcon");

    // 🎯 1. ดักจับข้อมูลซ้ำ
    const alreadySent = archives.some(a => a.date === date);
    if (alreadySent) {
        if (window.notify) notify("error", "แจ้งเตือน", `วันที่ ${date} ส่งข้อมูลแล้ว`);
        if (btn) {
            btn.disabled = true; 
            btn.style.background = "#94a3b8";
            if (icon) icon.className = "fas fa-paper-plane";
            btn.style.cursor = "default";
        }
        return;
    }

    // 🎯 2. ยืนยันก่อนส่ง
    const { isConfirmed } = await Swal.fire({
        title: "ยืนยันส่งข้อมูล", 
        text: `วันที่ ${date} ?`, 
        icon: "question",
        showCancelButton: true, 
        confirmButtonText: "ยืนยัน", 
        cancelButtonText: "ยกเลิก",
        confirmButtonColor: 'var(--success)',
        cancelButtonColor: '#6b7280',
        background: 'var(--card)',
        color: 'var(--text)'
    });
    if (!isConfirmed) return;

    // 🎯 3. เปลี่ยนสถานะปุ่มระหว่างส่ง
    if (btn) {
        if (btn.disabled) return; 
        btn.disabled = true;              
        btn.style.background = "var(--success)"; 
        if (icon) icon.className = "fas fa-spinner fa-spin"; 
    }

    // 🎯 4. คำนวณยอดเงิน (ตรรกะเดิม 100% ป้องกันตกเคส)
    const allToday = db.filter(r => r.date === date);
    const todayData = allToday.filter(r => r.type === 'SERVICE');
    const isHoliday = allToday.some(r => r.type === "HOLIDAY");

    let cash = 0;
    todayData.forEach(r => {
        // ✅ ใช้ Regex เหมือนเดิม ครอบคลุมทุกแบบ: Cash / เงินสด / cash
        if (/Cash/i.test(r.pay)) { 
            cash += (Number(r.price) || 0) + (Number(r.tip) || 0); 
        } else if (/Mix/i.test(r.pay)) { 
            cash += Number(r.payCash) || 0; 
        }
    });

    // 🟢 ล็อคค่าคอมมิชชันและค่าประกัน ณ วันที่ส่ง
    const currentPerc = Number(conf.perc) || 0;
    const currentGuar = Number(conf.guar) || 0;
    const commission = total * (currentPerc / 100);
    const baseEarn = Math.max(commission, currentGuar);
    const totalTips = todayData.reduce((s, r) => s + (Number(r.tip) || 0), 0);
    const bEarn = isHoliday ? 0 : baseEarn + totalTips;
    const settle = isHoliday ? 0 : cash - bEarn;

    // 🎯 5. บันทึกลง archives พร้อมฟิลด์ย้อนหลัง
    const data = { 
        date, 
        total, 
        cash, 
        barber: Math.floor(bEarn), 
        settle, 
        type: isHoliday ? "HOLIDAY" : "WORK", 
        details: allToday,
        guar_used: currentGuar,
        perc_used: currentPerc
    };

    const idx = archives.findIndex(a => a.date === date);
    if (idx > -1) { archives[idx] = data; } else { archives.push(data); }

    if (!isHoliday) account.balance = -settle;
    db = db.filter(r => r.date !== date);

    // 🎯 6. บันทึกข้อมูล + จัดการสถานะปุ่ม
    try {
        if (typeof saveDB === "function") { await saveDB(); } else { await save(); }
        
        if (btn) {
            btn.style.background = "#94a3b8";
            if (icon) icon.className = "fas fa-paper-plane";
            btn.disabled = true;              
            btn.style.cursor = "default";
        }
        
        notify("success", "สำเร็จ", "ส่งข้อมูลเรียบร้อย");
        // ✅ เพิ่ม renderDay(date) ที่ขาดไป!
        renderDay(date);
        loadAccountStatus();
    } catch (e) {
        if (btn) {
            btn.disabled = false;
            btn.style.background = "var(--danger)";
            if (icon) icon.className = "fas fa-paper-plane";
        }
        if (window.notify) notify("error", "เกิดข้อผิดพลาด", "ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    }
}
/* ========= SECTION 15: ACCOUNT STATUS ========= */
function loadAccountStatus() {
    const getEl = (id) => document.getElementById(id);
    
    let todayKey = getEl("accDate")?.value;
    
    if (!todayKey) {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        todayKey = `${y}-${m}-${d}`;
    }
    if (typeof archives === "undefined") return;
    // 🎯 1. ดึงยอด "ค้างวันนี้"
    const todayData = archives.find(a => a.date === todayKey);
    let todaySettle = todayData ? -todayData.settle : 0;
    // 🎯 2. ดึงยอด "ค้างเดิม"
    let oldSettle = archives.reduce((sum, day) => {
        // เงื่อนไข: ไม่ใช่วันนี้ และ ยอดยังไม่เป็น 0 (ยังค้างอยู่)
        if (day.date !== todayKey && day.settle !== 0) {
            return sum + (Number(-day.settle) || 0);
        }
        return sum;
    }, 0);
    // 🎯 3. คำนวณ "ยอดต้องเคลียร์รวม"
    let totalBalance = oldSettle + todaySettle;
    if (typeof account !== "undefined") {
        account.balance = totalBalance;
    }
    // แสดงยอดวันนี้
    if (getEl("accTodayVal")) getEl("accTodayVal").innerText = `฿${todaySettle.toLocaleString()}`;
    // 🟢 แก้ไขจุดนี้: แสดงยอดค้างเดิมพร้อมข้อความว่าใครค้าง
    const oldValEl = getEl("accOldVal");
    if (oldValEl) {
        if (oldSettle < 0) {
            oldValEl.innerHTML = `<small style="color:#991b1b">ช่างค้าง:</small> ฿${Math.abs(oldSettle).toLocaleString()}`;
        } else if (oldSettle > 0) {
            oldValEl.innerHTML = `<small style="color:#166534">ร้านค้าง:</small> ฿${oldSettle.toLocaleString()}`;
        } else {
            oldValEl.innerText = `฿0`;
        }
    }
        // ยอดรวมทั้งหมด
    if (getEl("accTotalVal")) {
        getEl("accTotalVal").innerText = `฿${Math.abs(totalBalance).toLocaleString()}`;
    }
    // ส่วนหัววันที่
    if (getEl("accDateLabel")) {
        getEl("accDateLabel").innerText = new Date(todayKey).toLocaleDateString('th-TH', { 
            day: 'numeric', month: 'short', year: 'numeric' 
        });
    }
    // อัปเดตสถานะป้าย Badge (ยอดรวมสรุป)
    const badge = getEl("statusBadge");
    if (badge) {
        if (totalBalance < 0) {
            badge.innerText = "🥷 ช่างคืนร้าน";
            badge.style.backgroundColor = "#fee2e2"; badge.style.color = "#991b1b";
        } else if (totalBalance > 0) {
            badge.innerText = "🏠 ร้านคืนช่าง";
            badge.style.backgroundColor = "#dcfce7"; badge.style.color = "#166534";
        } else {
            badge.innerText = "✅ ยอดลงตัว";
            badge.style.backgroundColor = "#f1f5f9"; badge.style.color = "#64748b";
        }
    }
    if (typeof updateStatusUI === 'function') updateStatusUI(totalBalance);
}
function updateStatusUI(net) {
    const getEl = (id) => document.getElementById(id);
    const badge = getEl("statusBadge");
    const light = getEl("accLight"); 
    // ✅ ปรับตรรกะสี: ลบ=แดง (ช่างคืนร้าน) | บวก=น้ำเงิน (ร้านคืนช่าง)
    let color = net < 0 ? "#dc2626" : (net > 0 ? "#1e3a8a" : "#16a34a");
    let txt = net < 0 ? "🥷 ช่างคืนร้าน" : (net > 0 ? "🏠 ร้านคืนช่าง" : "✅ ยอดลงตัว");
    if (badge) {
        badge.innerText = txt;
        badge.style.background = net < 0 ? "#fef2f2" : (net > 0 ? "#eff6ff" : "#f0fdf4");
        badge.style.color = color;
    }
    if (light) {
        light.style.background = color;
        light.style.boxShadow = `0 0 12px ${color}`;
    }
}
/* ========= SECTION 16: CLEAR ACCOUNT & HISTORY ========= */
async function clearAccount() {
    const getEl = (id) => document.getElementById(id);
    
    // ดึงยอดรวมสุทธิปัจจุบัน
    const todayKey = getEl("accDate")?.value || new Date().toISOString().split('T')[0];
    const todayData = (typeof archives !== "undefined") ? archives.find(a => a.date === todayKey) : null;
    const todaySettle = todayData ? Number(todayData.settle) || 0 : 0;
    const oldSettle = Number(account?.balance) || 0;
    const net = oldSettle + todaySettle;

    if (net === 0) {
        if (typeof notify === "function") notify("error", "แจ้งเตือน", "ขณะนี้ยอดคงค้างเป็นศูนย์เรียบร้อยแล้ว");
        return;
    }

    const accNoteEl = getEl("accNote");
    const note = (accNoteEl && accNoteEl.value.trim()) || "สรุปยอดบัญชีค้างชำระ";

    const result = await Swal.fire({
        title: 'ยืนยันการสรุปยอดบัญชี',
        text: `ต้องการดำเนินการเคลียร์ยอดค้างจำนวน ${Math.abs(net).toLocaleString()} บาท ใช่หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#22c55e',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'ยืนยันดำเนินการ',
        cancelButtonText: 'ยกเลิก'
    });

    if (!result.isConfirmed) return;

    // บันทึก Log ลงด้านหน้าสุด
    if (!account.logs) account.logs = [];
    account.logs.unshift({
        date: todayKey,
        amount: net,
        note: note
    });

    // Reset ยอด balance บัญชีค้างเดิมเป็น 0 (ไม่ไปแก้ไข archives ประวัติย้อนหลัง)
    account.balance = 0;
    if (todayData) todayData.settle = 0;

    // บันทึกข้อมูล
    if (typeof saveDB === "function") saveDB();
    else if (typeof save === "function") save();

    if (typeof notify === "function") notify("success", "ดำเนินการสำเร็จ", "ระบบได้ดำเนินการเคลียร์ยอดบัญชีเรียบร้อยแล้ว");
    if (accNoteEl) accNoteEl.value = "";

    if (typeof loadAccountHistory === 'function') loadAccountHistory();
    loadAccountStatus(); 
}
function loadAccountHistory() {
    const getEl = (id) => document.getElementById(id);
    const historyContainer = getEl("accHistory");
    if (!historyContainer) return;

    if (!account.logs || account.logs.length === 0) {
        historyContainer.innerHTML = '<center style="padding:30px; color:#94a3b8; font-size:13px;">ไม่มีประวัติการบันทึกบัญชี</center>';
        return;
    }

    const historyHtml = account.logs.map((l, index) => {
        const isBarberDebt = l.amount < 0; 
        const color = isBarberDebt ? '#dc2626' : '#1e3a8a';
        const sign = l.amount > 0 ? '+' : (l.amount < 0 ? '-' : '');

        return `
        <div class="log-item" style="padding:12px 15px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center; background:#fff;">
            <div style="flex:1;">
                <b style="font-size:12px; color:#64748b;">${l.date}</b><br>
                <span style="font-size:13.5px; font-weight:700; color:#1e293b;">${l.note}</span>
            </div>
            <div style="text-align:right; flex-shrink:0;">
                <b style="font-size:14px; color:${color}; display:block; margin-bottom:4px;">
                    ${sign}฿${Math.abs(l.amount).toLocaleString()}
                </b>
                <div style="display:flex; gap:10px; justify-content:flex-end;">
                    <small style="color:#ef4444; font-weight:700; cursor:pointer;" onclick="deleteAccountLog(${index})">ลบ</small>
                </div>
            </div>
        </div>`;
    }).join('');

    historyContainer.innerHTML = historyHtml;
}

async function deleteAccountLog(index) {
    const result = await Swal.fire({
        title: 'ยืนยันการลบประวัติบัญชี',
        text: "ต้องการดำเนินการลบรายการนี้ใช่หรือไม่?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'ยืนยันการลบ',
        cancelButtonText: 'ยกเลิก'
    });

    if (!result.isConfirmed) return;

    // คืนค่ายอดเงินกลับเข้า account.balance
    const removedLog = account.logs[index];
    if (removedLog) {
        account.balance = (account.balance || 0) + removedLog.amount;
    }

    account.logs.splice(index, 1);

    if (typeof saveDB === "function") saveDB();
    else if (typeof save === "function") save();

    if (typeof notify === "function") notify("success", "ดำเนินการสำเร็จ", "ลบประวัติและคืนค่ายอดเงินเรียบร้อยแล้ว");

    loadAccountHistory();
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

/* ========= SECTION 17: INSURANCE & HOLIDAY========= */
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
            type: "GUARANTEE_CLAIM",
            isGuar: true // 🟢 เพิ่มบรรทัดนี้เพื่อระบุว่ากดเปิดประกันจริง
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

/* ========= SECTION 18: SETTINGS & THEME ========= */
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
/* ========= SECTION 19: MONTHLY SUMMARY & EXCEL EXPORT ========= */
function loadHistDaily() {
    const $ = id => typeof window.$ === 'function' ? window.$(id) : document.getElementById(id);

    const d = $("histDate")?.value;
    if (!d) return;

    const f = archives.find(a => a.date === d);
    if (!f) return alert("ไม่พบข้อมูลของวันนี้");

    const details = f.details || [];
    
    // 🎯 1. ดึงการตั้งค่าส่วนแบ่งและเงื่อนไขต่างๆ
    const shopRate = parseFloat(localStorage.getItem('shopCommissionRate')) || ((typeof conf !== 'undefined' && conf && conf.perc) ? (conf.perc / 100) : 0.50);
    const offsiteBarberFee = parseFloat(localStorage.getItem('offsiteBarberFee')) || 200;
    const offsiteShopFee = parseFloat(localStorage.getItem('offsiteShopFee')) || 100;
    const freeBarberComp = parseFloat(localStorage.getItem('freeBarberComp')) || 100;
    const freeShopComp = parseFloat(localStorage.getItem('freeShopComp')) || 0;

    let tot = 0, transTotal = 0, cashTotal = 0, totalTips = 0;
    let calcBarberShare = 0;
    let calcShopShare = 0;

    // ⚡ 2. คำนวณยอดเงินและส่วนแบ่งจริงจากรายการย่อย (f.details)
    if (details.length > 0) {
        details.forEach(r => {
            const p = Number(r.price) || 0;
            const t = Number(r.tip) || 0;
            const cType = r.custType || 'none';
            const payStr = r.pay ? String(r.pay).trim() : 'เงินสด';

            const isFree = payStr.includes('ฟรี') || payStr.toLowerCase().includes('free');
            const isPureFree = isFree && !(payStr.includes('สด') || payStr.toLowerCase().includes('cash') || payStr.includes('โอน') || payStr.toLowerCase().includes('trans'));

            // คำนวณ Cash / Trans / Total / Tip
            if (payStr.includes('Mix') || payStr.includes('ผสม')) {
                const pCash = Number(r.payCash) || 0;
                const pTrans = Number(r.payTrans) || 0;
                tot += p; 
                transTotal += pTrans; 
                cashTotal += (pCash - t);
            } else if (payStr.includes('Trans') || payStr.includes('โอน') || payStr.includes('📱')) {
                tot += p; 
                transTotal += (p + t);
            } else if (!isPureFree) {
                tot += p; 
                cashTotal += p;
            }

            if (!isPureFree) totalTips += t;

            // คำนวณส่วนแบ่ง Barber / Shop
            if (r.barberShare !== undefined && r.shopShare !== undefined) {
                calcBarberShare += Number(r.barberShare);
                calcShopShare += Number(r.shopShare);
            } else if (cType === 'offsite' && isFree) {
                calcBarberShare += freeBarberComp;
                calcShopShare += freeShopComp;
            } else if (cType === 'offsite') {
                calcBarberShare += offsiteBarberFee;
                calcShopShare += (p > 0 ? (p - offsiteBarberFee) : offsiteShopFee);
            } else if (isFree) {
                calcBarberShare += freeBarberComp;
                calcShopShare += freeShopComp;
            } else {
                const bPart = Math.round(p * (1 - shopRate));
                calcBarberShare += bPart;
                calcShopShare += (p - bPart);
            }
        });
    } else {
        // กรณีไม่มีรายละเอียดรายการย่อย
        cashTotal = Number(f.cash) || 0;
        transTotal = Number(f.trans) || 0;
        tot = cashTotal + transTotal;
        calcBarberShare = Number(f.barber) || 0;
        calcShopShare = Number(f.shop) || 0;
    }

    const totalRevenue = tot;
    const customerCount = f.count || details.length;

    // ⚡ 3. สรุปยอดเงินช่างและร้าน (คิดประกันรายได้สัมพันธ์กับยอดร้าน)
    const isHoliday = details.some(r => r.type && String(r.type).toUpperCase() === 'HOLIDAY');
    const guarantee = (typeof conf !== 'undefined' && conf && conf.guar) ? conf.guar : 0;
    
    const barberEarn = isHoliday ? 0 : Math.floor(Math.max(calcBarberShare, guarantee) + totalTips);
    // ✅ ยอดร้าน = ยอดรวมทั้งหมด - (ยอดช่าง - ทิป)
    const shopEarn = isHoliday ? 0 : Math.floor(totalRevenue - (barberEarn - totalTips));

    // ⚡ 4. นับจำนวนประเภทบริการ
    const svcCounts = {};
    details.forEach(r => {
        const services = Array.isArray(r.svcs) ? r.svcs : (r.svcs ? [r.svcs] : []);
        if (services.length > 0) {
            services.forEach(s => {
                if (s) svcCounts[s] = (svcCounts[s] || 0) + 1;
            });
        } else if (r.custType === 'offsite') {
            svcCounts['ตัดนอกสถานที่'] = (svcCounts['ตัดนอกสถานที่'] || 0) + 1;
        }
    });

    const svcHTML = Object.entries(svcCounts).map(([name, count]) => `
        <div style="background:rgba(203, 213, 225, 0.1); padding:6px 12px; border-radius:10px; font-size:12px; color:#cbd5e1; font-weight:600; display:inline-block; margin:3px; border:1px solid rgba(255, 255, 255, 0.1);">
            ${name} <span style="opacity:0.7; margin-left:4px;">x${count}</span>
        </div>
    `).join("");

    // ⚡ 5. คำนวณยอด เคลียร์เงิน (Settle)
    let settleHTML = "";
    const settle = isHoliday ? 0 : cashTotal - barberEarn;

    if (settle > 0) {
        settleHTML = `
        <div style="background:rgba(251,146,60,0.1); padding:16px; border-radius:16px; margin-bottom:20px; text-align:center; border:1px solid rgba(251,146,60,0.3);">
            <div style="font-size:16px; color:#fdba74; font-weight:600; margin-bottom:4px;">🕵️‍♀️ ช่างคืนร้าน</div>
            <div style="font-size:24px; color:#fb923c; font-weight:800;">฿${Math.floor(settle).toLocaleString()}</div>
        </div>`;
    } else if (settle < 0) {
        settleHTML = `
        <div style="background:rgba(56,189,248,0.1); padding:16px; border-radius:16px; margin-bottom:20px; text-align:center; border:1px solid rgba(56,189,248,0.3);">
            <div style="font-size:16px; color:#7dd3fc; font-weight:600; margin-bottom:4px;">🏠 ร้านคืนช่าง</div>
            <div style="font-size:24px; color:#38bdf8; font-weight:800;">฿${Math.floor(Math.abs(settle)).toLocaleString()}</div>
        </div>`;
    } else {
        settleHTML = `
        <div style="background:rgba(34,197,94,0.1); padding:16px; border-radius:16px; margin-bottom:20px; text-align:center; border:1px solid rgba(34,197,94,0.3);">
            <div style="font-size:16px; color:#86efac; font-weight:600; margin-bottom:4px;">✅ ยอดเงินพอดี</div>
            <div style="font-size:20px; color:#4ade80; font-weight:800;">฿0</div>
        </div>`;
    }

    // ⚡ 6. แสดงรายการย่อย
    const rows = details
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
                payText = (r.pay === 'Trans' || r.pay === 'โอน') ? '📱 โอน' : '💶 เงินสด';
            }

            const serviceText = Array.isArray(r.svcs) && r.svcs.length > 0 ? r.svcs.join(' + ') : 'ตัดนอกสถานที่';

            let custTag = "";
            if (r.custType === 'offsite') {
                custTag = `<span style="background:#ef4444; color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; margin-left:6px; font-weight:bold;">🚗 นอกสถานที่</span>`;
            } else if (r.custType === 'new') {
                custTag = `<span style="background:#22c55e; color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; margin-left:6px;">🌟 ใหม่</span>`;
            } else if (r.custType === 'regular') {
                custTag = `<span style="background:#f59e0b; color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; margin-left:6px;">📌 ประจำ</span>`;
            }

            return `
            <div style="padding:14px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:28px; height:28px; background:rgba(255,255,255,0.08); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:#94a3b8;">${index + 1}</div>
                    <div>
                        <div style="font-weight:700; font-size:14px; color:#f8fafc;">${serviceText}${custTag}</div>
                        <div style="font-size:13px; color:#94a3b8; font-weight:500; margin-top:2px;">⏱ ${fullTime} • ${payText}</div>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:16px; font-weight:800; color:#f8fafc;">฿${p.toLocaleString()}</div>${t > 0 ? `<div style="font-size:12px; font-weight:600; color:#f472b6;">+ Tip ฿${t.toLocaleString()}</div>` : ''}
                </div>
            </div>`;
        }).join("");

    // ⚡ 7. แปลงรูปแบบวันที่
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

    // ⚡ 8. แสดงผล UI
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
    const pickers = ["monthlyReportPicker", "histMonth"];
    let isSyncing = false;

    pickers.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        el.addEventListener("change", (e) => {
            if (isSyncing) return;
            isSyncing = true;

            const selectedValue = e.target.value;

            // Sync ค่าไปยัง Picker ตัวอื่น
            pickers.forEach(otherId => {
                const otherEl = document.getElementById(otherId);
                if (otherEl && otherEl !== e.target) {
                    otherEl.value = selectedValue;
                }
            });

            // เรียกอัปเดตรายงาน
            if (typeof loadHistMonth === 'function') loadHistMonth(selectedValue);
            if (typeof generateMonthlyReport === 'function') generateMonthlyReport(selectedValue);

            isSyncing = false;
        });
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
            generateMonthlyReport(m, 0, 0, 0, 0, 0, 0, 0, {}, {}, {}, 0, 0, 0, 0);
        }
        return;
    }

    // 🎯 1. ดึงการตั้งค่าล่าสุด
    const shopRate = parseFloat(localStorage.getItem('shopCommissionRate')) || ((typeof conf !== 'undefined' && conf && conf.perc) ? (conf.perc / 100) : 0.50);
    const offsiteBarberFee = parseFloat(localStorage.getItem('offsiteBarberFee')) || 200;
    const freeBarberComp = parseFloat(localStorage.getItem('freeBarberComp')) || 100;
    const guarantee = (typeof conf !== 'undefined' && conf && conf.guar) ? conf.guar : 0;

    let countNew = 0, countRegular = 0, countOffsite = 0;  
    let monthTotal = 0, monthBarber = 0, monthShop = 0, monthCount = 0, monthGuarDays = 0; 
    let hairStats = {}, serviceStats = {};
    let offDays = 0, workDays = 0;
    let weeklyData = {};

    const haircutList = ["แฟชั่น", "สกินเฟด", "รองทรง", "ตำรวจ/ทหาร", "นักเรียน", "ทรงนักเรียน", "เปิดข้าง", "ซอยผม/เล็มผม", "แก้ผม", "โกนผม", "เด็ก"];
    const dayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

    filtered.forEach(day => {
        const [dYear, dMonth, dDay] = day.date.split('-').map(Number);
        const dObj = new Date(dYear, dMonth - 1, dDay);
        
        // ⚡ ปรับปรุงการคำนวณสัปดาห์ให้เริ่มนับตามวันอาทิตย์จริง
        const firstDayOfMonth = new Date(dYear, dMonth - 1, 1).getDay();
        let wIdx = Math.ceil((dDay + firstDayOfMonth) / 7);
        if (wIdx > 5) wIdx = 5;
        const wKey = `สัปดาห์ที่ ${wIdx}`;

        if (!weeklyData[wKey]) {
            weeklyData[wKey] = { 
                customers: 0, workDays: 0, offDays: 0, 
                zeroDays: 0, guarDays: 0, dailyCounts: [],
                countNew: 0, countRegular: 0, countOffsite: 0,
                popularHair: {}, 
                popularService: {}, 
                income: 0,
                shopIncome: 0 
            };
        }

        if (day.off === true || day.type === "HOLIDAY") {
            offDays++;
            weeklyData[wKey].offDays++;
            return;
        }

        workDays++;
        weeklyData[wKey].workDays++;

        // ⚡ คำนวณยอดเงินรวมรายวัน
        let dailyIncome = Number(day.cash || 0) + Number(day.trans || 0);
        if (dailyIncome === 0 || day.total) dailyIncome = Number(day.total || dailyIncome);

        let calcBarberShare = 0;
        let totalTips = 0;
        let dayCustomerCount = 0; 

        if (day.details && Array.isArray(day.details) && day.details.length > 0) {
            day.details.forEach(d => {
                if (d.type === "SERVICE" || !d.type) {
                    monthCount++;
                    dayCustomerCount++; 
                    weeklyData[wKey].customers++; 
                    
                    const p = Number(d.price) || 0;
                    const t = Number(d.tip) || 0;
                    const cType = String(d.custType || "").toLowerCase().trim();
                    const payStr = String(d.pay || "").trim();
                    const isFree = payStr.startsWith("Free") || payStr.includes("ฟรี");

                    totalTips += t;

                    // คำนวณส่วนแบ่งช่าง
                    if (d.barberShare !== undefined) {
                        calcBarberShare += Number(d.barberShare);
                    } else if (cType === 'offsite' && isFree) {
                        calcBarberShare += freeBarberComp;
                    } else if (cType === 'offsite') {
                        calcBarberShare += offsiteBarberFee;
                    } else if (isFree) {
                        calcBarberShare += freeBarberComp;
                    } else {
                        calcBarberShare += Math.round(p * (1 - shopRate));
                    }

                    // สรุปประเภทลูกค้า
                    if (cType === "new") {
                        countNew++;
                        weeklyData[wKey].countNew++;
                    } else if (cType === "regular") {
                        countRegular++;
                        weeklyData[wKey].countRegular++;
                    } else if (cType === "offsite") {
                        countOffsite++;
                        weeklyData[wKey].countOffsite++;
                    }

                    // สรุปสถิติทรงผม/บริการ
                    const svcs = Array.isArray(d.svcs) ? d.svcs : [d.svcs];
                    svcs.forEach(s => {
                        if (!s) return;
                        const cleanS = String(s).trim();
                        if (haircutList.includes(cleanS)) {
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

        // ตรวจสอบเงื่อนไขประกันรายได้ช่าง
        let isGuaranteeDay = false;
        if (guarantee > 0 && calcBarberShare < guarantee && dayCustomerCount > 0) {
            isGuaranteeDay = true;
        } else if (day.isGuarantee || day.guarantee) {
            isGuaranteeDay = true;
        }

        if (isGuaranteeDay) {
            monthGuarDays++;
            weeklyData[wKey].guarDays++;
        }

        // ส่วนแบ่งช่างสุทธิต่อวัน (รวมทิป)
        const pureBarberCost = Math.max(calcBarberShare, (dayCustomerCount > 0 ? guarantee : 0));
        const dailyBarberNet = Math.floor(pureBarberCost + totalTips);
        
        // รายได้สุทธิของร้านต่อวัน
        const dailyShopNet = Math.max(0, dailyIncome - pureBarberCost);

        monthTotal += dailyIncome;
        monthBarber += dailyBarberNet;
        monthShop += dailyShopNet;

        weeklyData[wKey].income += dailyIncome;
        weeklyData[wKey].shopIncome += dailyShopNet;

        if (dayCustomerCount === 0) weeklyData[wKey].zeroDays++;
        
        weeklyData[wKey].dailyCounts.push({ 
            dayName: dayNames[dObj.getDay()], 
            count: dayCustomerCount, 
            income: dailyIncome,
            barberEarn: dailyBarberNet,
            shopEarn: dailyShopNet
        });
    });

    const avgCustomerPerDay = workDays > 0 ? (monthCount / workDays) : 0;

    // อัปเดต Element บนหน้าเว็บ
    if ($("shopTotalMonth")) {
        $("shopTotalMonth").innerText = `฿${Math.floor(monthShop).toLocaleString()}`;
    }

    // ส่งค่าให้ฟังก์ชันสร้างอินเทอร์เฟซรายงาน
    if (typeof generateMonthlyReport === 'function') {
        generateMonthlyReport(
            m, 
            monthTotal, 
            monthBarber, 
            monthShop, 
            monthCount, 
            workDays, 
            offDays, 
            avgCustomerPerDay, 
            weeklyData, 
            hairStats, 
            serviceStats, 
            monthGuarDays, 
            countNew, 
            countRegular, 
            countOffsite
        );
    }
}
function generateMonthlyReport(m, monthTotal, monthBarber, monthShop, monthCount, workDays, offDays, avgCustomerPerDay, weeklyData, hairStats, serviceStats, monthGuarDays, countNew, countRegular, countOffsite) {
    // Helper Selector
    const $ = id => document.getElementById(id);
    
    // 🎯 1. คำนวณยอดจากรายสัปดาห์ เพื่อความแม่นยำ
    const weekEntries = Object.entries(weeklyData || {});
    const weekKeys = Object.keys(weeklyData || {}); 
    const dayStats = {};
    
    let totalNew = 0;
    let totalRegular = 0;
    let totalOffsite = 0;
    let calculatedMonthBarber = 0;
    let calculatedMonthShop = 0;

    weekEntries.forEach(([wk, data]) => {
        totalNew += (data.countNew || 0);
        totalRegular += (data.countRegular || 0);
        totalOffsite += (data.countOffsite || 0);
        
        let wBarberEarn = 0;
        if (data.dailyCounts) {
            data.dailyCounts.forEach(d => {
                wBarberEarn += Number(d.barberEarn || 0);
                const dayName = d.dayName ? d.dayName.split(' ')[0] : '';
                if (dayName && d.count > 0) {
                    if (!dayStats[dayName]) dayStats[dayName] = { total: 0, count: 0 };
                    dayStats[dayName].total += d.count;
                    dayStats[dayName].count += 1;
                }
            });
        }
        const wIncome = Number(data.income || 0);
        const wShopEarn = data.shopIncome !== undefined ? Number(data.shopIncome) : Math.max(0, wIncome - wBarberEarn);
        
        calculatedMonthBarber += wBarberEarn;
        calculatedMonthShop += wShopEarn;
    });

    // ✅ คำนวณยอดเงินรายเดือน (รายได้ร้าน = ยอดรวม - ยอดช่าง)
    const finalTotalIncome = monthTotal !== undefined ? Number(monthTotal) : (calculatedMonthBarber + calculatedMonthShop);
    const finalBarberEarn = monthBarber !== undefined ? Number(monthBarber) : calculatedMonthBarber;
    const finalShopEarn = Math.max(0, finalTotalIncome - finalBarberEarn);
    
    // 🟢 [แก้ไขถาวร] บังคับประกันเป็น 0 วันเสมอ
    const displayGuarDays = 0;

    // --- 2. สถิติรายวัน ---
    const dayAverages = Object.entries(dayStats).filter(([_, d]) => d.count > 0).map(([name, d]) => ({ name, avg: d.total / d.count }));
    const busiestDay = [...dayAverages].sort((a, b) => b.avg - a.avg)[0];
    const quietestDay = [...dayAverages].sort((a, b) => a.avg - b.avg)[0];
    
    const topIncomeWeek = weekEntries.length > 0 ? weekEntries.reduce((p, c) => ((c[1].income || 0) > (p[1].income || 0) ? c : p)) : null;
    const topCountWeek = weekEntries.length > 0 ? weekEntries.reduce((p, c) => ((c[1].customers || 0) > (p[1].customers || 0) ? c : p)) : null;
    const topHair = Object.entries(hairStats || {}).sort((a, b) => b[1] - a[1])[0];
    const topService = Object.entries(serviceStats || {}).sort((a, b) => b[1] - a[1])[0];

    // --- 3. วิเคราะห์ลูกค้า ---
    let maxNewWeek = "-", maxRegWeek = "-", maxOffsiteWeek = "-";
    weekKeys.forEach(wk => {
        const curr = weeklyData[wk];
        const n = curr.countNew || 0, r = curr.countRegular || 0, o = curr.countOffsite || 0;
        curr.newAnalysis = n > r ? "กลุ่มหลักอาทิตย์นี้" : n < r ? "น้อยกว่าลูกค้าประจำ" : "เท่ากับลูกค้าประจำ";
        curr.regAnalysis = r > n ? "กลุ่มหลักอาทิตย์นี้" : r < n ? "น้อยกว่าลูกค้าใหม่" : "เท่ากับลูกค้าใหม่";
        if (n > 0 && (maxNewWeek === "-" || n > (weeklyData[maxNewWeek]?.countNew || 0))) maxNewWeek = wk;
        if (r > 0 && (maxRegWeek === "-" || r > (weeklyData[maxRegWeek]?.countRegular || 0))) maxRegWeek = wk;
        if (o > 0 && (maxOffsiteWeek === "-" || o > (weeklyData[maxOffsiteWeek]?.countOffsite || 0))) maxOffsiteWeek = wk;
    });

    // --- 4. Render กราฟ ---
    const renderStats = (statsObj, defaultColor) => {
        if (!statsObj || Object.keys(statsObj).length === 0) return `<div style="font-size:12px; color:#94a3b8; text-align:center;">ไม่มีข้อมูล</div>`;
        const entries = Object.entries(statsObj).sort((a, b) => b[1] - a[1]);
        const maxVal = entries[0][1];
        const extraSvcs = ["โกนหนวด", "กันหน้า", "สระผม", "กันจอน", "ย้อมแฟชั่น", "ดัดผม", "แคะหู"];
        return entries.map(([name, count]) => {
            const width = maxVal > 0 ? (count / maxVal) * 100 : 0;
            const barColor = defaultColor || (extraSvcs.includes(name) ? '#38bdf8' : '#facc15');
            return `<div style="margin-bottom:10px;">
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

    // --- 5. ข้อสรุป ---
    const insights = [
        `วันทำงาน: เปิดร้านทั้งหมด <b>${workDays} วัน</b> (หยุด ${offDays} วัน)`,
        `สัปดาห์ที่มีลูกค้ามากที่สุด: <b>${topCountWeek ? topCountWeek[0] : "-"}</b> (${topCountWeek?.[1]?.customers || "-"} คน)`,
        (topIncomeWeek?.[1]?.income > 0) 
            ? `สัปดาห์ที่มีรายได้สูงสุด: <b>${topIncomeWeek[0]}</b> (฿${topIncomeWeek[1].income.toLocaleString()})` 
            : `สัปดาห์ที่มีรายได้สูงสุด: <b>-</b>`
    ];
    if (totalNew || totalRegular || totalOffsite) {
        insights.push(`โครงสร้างลูกค้าเดือนนี้: <b>(ประจำ ${totalRegular || 0} / ใหม่ ${totalNew || 0} / นอกสถานที่ ${totalOffsite || 0})</b>`);
        insights.push(`สถิติลูกค้าเยอะสุด: ใหม่ (<b>${maxNewWeek}</b>) | ประจำ (<b>${maxRegWeek}</b>) | นอกสถานที่ (<b>${maxOffsiteWeek}</b>)`);
    }
    if (busiestDay?.avg > 0) {
        insights.push(!quietestDay || busiestDay.avg === quietestDay.avg 
            ? `ลูกค้าเข้าเยอะใน <b>วัน${busiestDay.name}</b>` 
            : `ลูกค้าเข้าเยอะใน <b>วัน${busiestDay.name}</b> และน้อยใน <b>วัน${quietestDay.name}</b>`);
    }
    insights.push(`ทรงผมยอดนิยม: <b>${topHair?.[0] || '-'}</b> | บริการยอดนิยม: <b>${topService?.[0] || '-'}</b>`);

    // --- 6. รายสัปดาห์ ---
    const weeklyHtml = weekEntries.map(([wk, data]) => {
        const weeklyTotalIncome = Number(data.income || 0);
        let sumBarber = 0;
        if (data.dailyCounts) data.dailyCounts.forEach(d => sumBarber += Number(d.barberEarn || 0));
        const wBarber = Math.floor(sumBarber);
        const wShop = Math.floor(data.shopIncome !== undefined ? Number(data.shopIncome) : Math.max(0, weeklyTotalIncome - wBarber));
        const sortedDays = data.dailyCounts ? [...data.dailyCounts].sort((a, b) => b.count - a.count) : [];
        const maxCount = sortedDays[0]?.count || 0, minCount = sortedDays.at(-1)?.count || 0;
        const bestDay = maxCount > 0 ? `${sortedDays[0].dayName} (${maxCount})` : "-";
        const worstDay = sortedDays.length > 1 && maxCount !== minCount ? `${sortedDays.at(-1).dayName} (${minCount})` : "-";
        const popHair = Object.entries(data.popularHair || {}).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([n, c]) => 
            `<span style="background:rgba(190,242,100,0.1); color:#bef264; padding:2px 8px; border-radius:8px; font-size:10px; border:1px solid rgba(190,242,100,0.2); margin-right:4px;">✂️ ${n} ${c}</span>`
        ).join("");
        const popService = Object.entries(data.popularService || {}).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([n, c]) => 
            `<span style="background:rgba(56,189,248,0.1); color:#38bdf8; padding:2px 8px; border-radius:8px; font-size:10px; border:1px solid rgba(56,189,248,0.2); margin-right:4px;">🧴 ${n} ${c}</span>`
        ).join("");
        return `<div style="background:#020617; border:1px solid rgba(255,255,255,0.08); padding:16px; border-radius:22px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <div style="font-size:15px; font-weight:800; color:#f8fafc;">🗓️ ${wk}</div>
                <div style="font-size:10px; color:#94a3b8;">เปิด ${data.workDays || 0} | หยุด ${data.offDays || 0}</div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:6px; margin-bottom:10px;">
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); padding:6px; border-radius:12px; text-align:center;">
                    <div style="font-size:9px; color:#94a3b8; margin-bottom:2px;">ยอดรวม</div>
                    <div style="font-size:13px; font-weight:800; color:#fff;">฿${weeklyTotalIncome.toLocaleString()}</div>
                </div>
                <div style="background:rgba(190,242,100,0.05); border:1px solid rgba(190,242,100,0.2); padding:6px; border-radius:12px; text-align:center;">
                    <div style="font-size:9px; color:#bef264; margin-bottom:2px;">ช่าง</div>
                    <div style="font-size:13px; font-weight:800; color:#bef264;">฿${wBarber.toLocaleString()}</div>
                </div>
                <div style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.2); padding:6px; border-radius:12px; text-align:center;">
                    <div style="font-size:9px; color:#38bdf8; margin-bottom:2px;">ร้าน</div>
                    <div style="font-size:13px; font-weight:800; color:#38bdf8;">฿${wShop.toLocaleString()}</div>
                </div>
            </div>
            <div style="display:grid; grid-template-columns: repeat(4,1fr); gap:4px; margin-bottom:10px;">
                <div style="background:rgba(255,255,255,0.02); padding:6px; border-radius:10px; text-align:center; border:1px solid rgba(255,255,255,0.05);">
                    <div style="font-size:8px; color:#64748b; margin-bottom:2px;">👤 รวม</div>
                    <div style="font-size:11px; font-weight:700; color:#38bdf8;">${data.customers || 0}</div>
                </div>
                <div style="background:rgba(34,197,94,0.05); padding:6px; border-radius:10px; text-align:center; border:1px solid rgba(34,197,94,0.1);">
                    <div style="font-size:8px; color:#4ade80; margin-bottom:2px;">🌟 ใหม่</div>
                    <div style="font-size:11px; font-weight:700; color:#4ade80;">${data.countNew || 0}</div>
                </div>
                <div style="background:rgba(168,85,247,0.05); padding:6px; border-radius:10px; text-align:center; border:1px solid rgba(168,85,247,0.1);">
                    <div style="font-size:8px; color:#c084fc; margin-bottom:2px;">📌 ประจำ</div>
                    <div style="font-size:11px; font-weight:700; color:#c084fc;">${data.countRegular || 0}</div>
                </div>
                <div style="background:rgba(249,115,22,0.05); padding:6px; border-radius:10px; text-align:center; border:1px solid rgba(249,115,22,0.1);">
                    <div style="font-size:8px; color:#f97316; margin-bottom:2px;">🚗 นอก</div>
                    <div style="font-size:11px; font-weight:700; color:#f97316;">${data.countOffsite || 0}</div>
                </div>
            </div>
            <div style="font-size:11px; color:#94a3b8; line-height:1.7; padding:0 4px 10px; border-bottom:1px solid rgba(255,255,255,0.05); margin-bottom:10px;">
                ${data.countNew > 0 ? `<div>🌟 ลูกค้าใหม่: <span style="color:#4ade80; font-weight:800;">${data.newAnalysis} (${data.countNew})</span></div>` : ''}
                ${data.countRegular > 0 ? `<div>📌 ลูกค้าประจำ: <span style="color:#facc15; font-weight:800;">${data.regAnalysis} (${data.countRegular})</span></div>` : ''}
                ${data.countOffsite > 0 ? `<div>🚗 นอกสถานที่: <span style="color:#f97316; font-weight:800;">${data.countOffsite} ราย</span></div>` : ''}
                <div style="margin-top:2px;">📈 เยอะสุด: <span style="color:#f1f5f9; font-weight:600;">${bestDay}</span></div>
                <div>📉 น้อยสุด: <span style="color:#f1f5f9; font-weight:600;">${worstDay}</span></div>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:4px;">${popHair}${popService}</div>
        </div>`;
    }).join("");

    // ชื่อเดือน
    let displayMonthTitle = m;
    try {
        const [y, mn] = m.split('-');
        displayMonthTitle = new Date(y, mn - 1, 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
    } catch { displayMonthTitle = m; }

    // --- 7. แสดงผล ---
    if ($("monthlyIncomeContent")) {
        $("monthlyIncomeContent").innerHTML = `
            <div style="background:#0f172a; padding:20px; color:#f1f5f9; border-radius:20px; font-family:system-ui,sans-serif;">
                <div style="text-align:center; padding:10px 0 20px;">
                    <div style="font-size:14px; color:#94a3b8; font-weight:700; margin-bottom:4px;">✂️ รายได้รวมประจำเดือน (${displayMonthTitle})</div>
                    <div style="font-size:42px; font-weight:900; color:#fff;">฿${Math.floor(finalTotalIncome).toLocaleString()}</div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); padding:12px; border-radius:16px; text-align:center;">
                        <div style="font-size:11px; color:#94a3b8;">รายได้ช่าง</div>
                        <div style="font-size:18px; font-weight:800; color:#bef264;">฿${Math.floor(finalBarberEarn).toLocaleString()}</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); padding:12px; border-radius:16px; text-align:center;">
                        <div style="font-size:11px; color:#94a3b8;">รายได้ร้าน</div>
                        <div style="font-size:18px; font-weight:800; color:#38bdf8;">฿${Math.floor(finalShopEarn).toLocaleString()}</div>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:4px; margin-bottom:12px;">
                    <div style="background:rgba(56,189,248,0.15); padding:8px 2px; border-radius:10px; font-size:11px; font-weight:700; color:#38bdf8; text-align:center; border:1px solid rgba(56,189,248,0.2);">👤 ลูกค้า ${monthCount}</div>
                    <div style="background:rgba(34,197,94,0.15); padding:8px 2px; border-radius:10px; font-size:11px; font-weight:700; color:#4ade80; text-align:center; border:1px solid rgba(34,197,94,0.2);">🌟 ใหม่ ${countNew || 0}</div>
                    <div style="background:rgba(168,85,247,0.15); padding:8px 2px; border-radius:10px; font-size:11px; font-weight:700; color:#c084fc; text-align:center; border:1px solid rgba(168,85,247,0.2);">📌 ประจำ ${countRegular || 0}</div>
                    <div style="background:rgba(249,115,22,0.15); padding:8px 2px; border-radius:10px; font-size:11px; font-weight:700; color:#f97316; text-align:center; border:1px solid rgba(249,115,22,0.2);">🚗 นอก ${countOffsite || 0}</div>
                </div>
                <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:6px;">
                    <div style="background:rgba(255,255,255,0.08); padding:6px 12px; border-radius:10px; font-size:11px; font-weight:600; color:#f8fafc;">📅 เปิด ${workDays} วัน</div>
                    <div style="background:rgba(244,63,94,0.15); padding:6px 12px; border-radius:10px; font-size:11px; font-weight:600; color:#fb7185;">⛱️ หยุด ${offDays} วัน</div>
                    <div style="background:rgba(250,204,21,0.15); padding:6px 12px; border-radius:10px; font-size:11px; font-weight:600; color:#facc15;">🛡️ ประกัน 0 วัน</div>
                    <div style="background:rgba(147,51,234,0.15); padding:6px 12px; border-radius:10px; font-size:11px; font-weight:600; color:#a855f7;">📊 เฉลี่ย ${(avgCustomerPerDay || 0).toFixed(2)} คน/วัน</div>
                </div>
            </div>
        `;
    }
    if ($("incomeAnalyticsContent")) {
        $("incomeAnalyticsContent").innerHTML = `
            <div style="background:#0f172a; padding:20px; border-radius:20px; font-family:system-ui,sans-serif;">
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
            <div style="background:#0f172a; padding:20px; border-radius:20px; font-family:system-ui,sans-serif;">
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
    
    // ✅ ดึงโหมดการแสดงผล + สาขาปัจจุบัน
    const viewAll = (localStorage.getItem("view_data_scope") || "all") === "all";
    const activeBranch = localStorage.getItem("active_branch_name") || "สาขาไม่ระบุ";
    
    // กรองข้อมูลเดือนที่เลือก + ตามโหมดที่เลือก
    let filtered = archives.filter(a => a.date && a.date.startsWith(targetPrefix));
    if (!viewAll) {
        filtered = filtered.filter(a => a.branch === activeBranch);
    }
    
    const monthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const monthThaiName = monthNames[mNum - 1] || '';
    const thaiDayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
    
    // ✅ ปรับชื่อหัวรายงาน
    let reportTitle = "";
    if (viewAll) {
        reportTitle = `รายงานทุกสาขา · ประจำเดือน: ${monthThaiName} ${y + 543}`;
    } else {
        reportTitle = `รายงาน: ${activeBranch} · ประจำเดือน: ${monthThaiName} ${y + 543}`;
    }
    
    let totalCust = 0, totalBarber = 0, totalShave = 0, totalWash = 0, totalDye = 0;
    let workDays = 0;
    let rowsHTML = '';
    
    // เรียงวันที่จาก 1 -> 31
    filtered.sort((a, b) => a.date.localeCompare(b.date));
    
    filtered.forEach(day => {
        const isOffDay = day.off === true || day.type === "HOLIDAY";
        let dayCust = 0;
        let shave = 0, wash = 0, dye = 0;
        
        // ✅ แก้ตรงนี้ — ถ้าไม่มีชื่อสาขาให้ใช้ชื่อปัจจุบันแทน
        const branchName = day.branch 
                        || localStorage.getItem("active_branch_name") 
                        || "สาขาไม่ระบุ";
        
        if (!isOffDay) {
            workDays++;
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
        
        if (isOffDay) {
            rowsHTML += `
                <tr style="background-color: #fef2f2;">
                    <td>${parseInt(dayNum, 10)}</td>
                    <td>${displayDayName}</td>
                    <td>${branchName}</td>
                    <td colspan="5" style="color: #ef4444; font-weight: 700; text-align: center;">หยุด</td>
                </tr>
            `;
        } else {
            rowsHTML += `
                <tr>
                    <td>${parseInt(dayNum, 10)}</td>
                    <td>${displayDayName}</td>
                    <td>${branchName}</td>
                    <td>${dayCust || '-'}</td>
                    <td>${barber > 0 ? barber.toLocaleString() : '-'}</td>
                    <td>${shave || '-'}</td>
                    <td>${wash || '-'}</td>
                    <td>${dye || '-'}</td>
                </tr>
            `;
        }
    });
    
    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 10px;">
            <h3 style="margin: 0; color: var(--primary, #0284c7);">${reportTitle}</h3>
        </div>
        <table class="summary-table" style="width:100%; border-collapse: collapse; text-align:center;">
            <thead>
                <tr style="background-color: var(--bg, #f1f5f9);">
                    <th>วันที่</th>
                    <th>วัน</th>
                    <th>สาขา</th>
                    <th>ลูกค้า</th>
                    <th>ยอดช่าง</th>
                    <th>โกน</th>
                    <th>สระ</th>
                    <th>ย้อม</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHTML || '<tr><td colspan="8" style="text-align:center; padding: 20px; color:#94a3b8;">ไม่มีข้อมูลในเดือนนี้</td></tr>'}
            </tbody>
            <tfoot>
                <tr style="background-color: #ffeb3b; font-weight: bold; color: #000;">
                    <td>รวมยอด</td>
                    <td style="color: #0284c7;">เปิด ${workDays} วัน</td>
                    <td>-</td>
                    <td>${totalCust || '-'}</td>
                    <td>${totalBarber > 0 ? totalBarber.toLocaleString() : '0'}</td>
                    <td>${totalShave || '-'}</td>
                    <td>${totalWash || '-'}</td>
                    <td>${totalDye || '-'}</td>
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
        // ให้ปีปัจจุบันเป็นค่าเริ่มต้น (Selected) ทันที
        const isSelected = (y === currentYear) ? 'selected' : '';
        html += `<option value="${y}" ${isSelected}>ปี ${y}</option>`;
    }

    select.innerHTML = html;
}

// เรียกใช้ฟังก์ชันตอนโหลดหน้าเว็บ
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
    // ส่งออกไฟล์ รองรับทุกระบบ
    const fileName = `รายงานรายเดือน-${monthName}.xlsx`;
    const fileData = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([fileData], { 
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
    });
    const url = URL.createObjectURL(blob);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    if (isIOS) { a.target = "_blank"; a.rel = "noopener"; }
    
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    notify("success", "สำเร็จ", `ส่งออกข้อมูลเดือน ${monthName} เรียบร้อยแล้ว`);
}
// ✅ เปิดพรีวิว — ใช้ร่วมกันได้ทั้ง 2 หน้า
function openReportFullscreen() {
    const modalContent = document.getElementById('fullReportContent');
    if (!modalContent) return;

    // ===== ตรวจสอบหน้าหลักที่กำลังเปิดอยู่ =====
    const pageMonthly = document.getElementById('pageMonthlyReport');
    const pageCompare = document.getElementById('pageComparison');
    
    // ตรวจสอบว่าหน้าไหนกำลังแสดงอยู่
    const isMonthlyPage = pageMonthly && (pageMonthly.style.display !== 'none');
    const isComparePage = pageCompare && (pageCompare.style.display !== 'none');

    // ดึงข้อมูล
    const compareBody = document.getElementById('comparisonSingleContent');
    const compareHead = document.getElementById('compareTableHead');
    const compareFoot = document.getElementById('compareTableFoot');
    const monthlyCard = document.getElementById('monthlyContent1');

    const hasCompareData = compareBody && compareBody.innerHTML.trim() !== '';
    const hasMonthlyData = monthlyCard && monthlyCard.innerHTML.trim() !== '';

    let contentToShow = '';
    let sourceType = '';

    // ===== เลือกข้อมูลตามหน้าที่กำลังเปิดอยู่ =====
    if (isMonthlyPage) {
        // ✅ อยู่หน้าสรุปรายเดือน → แสดงข้อมูลรายเดือน
        if (hasMonthlyData) {
            contentToShow = monthlyCard.innerHTML;
            sourceType = 'monthly';
        } else {
            const msg = "กรุณาเลือกเดือนก่อนครับ";
            if (typeof notify === 'function') notify("info", "ยังไม่มีข้อมูล", msg);
            else alert(msg);
            return;
        }
    }
    else if (isComparePage) {
        // ✅ อยู่หน้าเปรียบเทียบ → แสดงข้อมูลเปรียบเทียบ
        if (hasCompareData) {
            contentToShow = `
                <table style="width:100%; border-collapse:collapse; font-family:Tahoma,sans-serif; text-align:center; font-size:11px;">
                    <thead>${compareHead?.innerHTML || ''}</thead>
                    <tbody>${compareBody.innerHTML}</tbody>
                    <tfoot>${compareFoot?.innerHTML || ''}</tfoot>
                </table>
            `;
            sourceType = 'compare';
        } else {
            const msg = "กรุณากดปุ่ม 'ประมวลผล' ก่อนครับ";
            if (typeof notify === 'function') notify("info", "ยังไม่มีข้อมูล", msg);
            else alert(msg);
            return;
        }
    }
    else {
        // ไม่รู้อยู่หน้าไหน → ใช้ข้อมูลที่มี
        if (hasMonthlyData) {
            contentToShow = monthlyCard.innerHTML;
            sourceType = 'monthly';
        } else if (hasCompareData) {
            contentToShow = `
                <table style="width:100%; border-collapse:collapse; font-family:Tahoma,sans-serif; text-align:center; font-size:11px;">
                    <thead>${compareHead?.innerHTML || ''}</thead>
                    <tbody>${compareBody.innerHTML}</tbody>
                    <tfoot>${compareFoot?.innerHTML || ''}</tfoot>
                </table>
            `;
            sourceType = 'compare';
        } else {
            const msg = "กรุณาเลือกข้อมูลแล้วกดประมวลผลก่อนครับ";
            if (typeof notify === 'function') notify("error", "ไม่พบข้อมูล", msg);
            else alert(msg);
            return;
        }
    }

    // แสดงเนื้อหา
    modalContent.innerHTML = contentToShow;

    // แสดง Modal
    const modal = document.getElementById('fullReportModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    console.log(`📄 พรีวิว: ${sourceType === 'monthly' ? 'สรุปรายเดือน' : 'เปรียบเทียบข้อมูล'}`);
}
// ✅ ปิดพรีวิว และล้าง HTML ป้องกันข้อมูลตกค้าง
function closeReportFullscreen() {
    const modal = document.getElementById('fullReportModal');
    const modalContent = document.getElementById('fullReportContent');
    
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    if (modalContent) {
        modalContent.innerHTML = ''; // ล้างข้อมูลพรีวิวเมื่อปิด
    }
}

// ✅ เรียกใช้จากปุ่ม "พรีวิว" ในหน้าเปรียบเทียบ
function openPreviewModal() {
    openReportFullscreen();
}
/* ========= SECTION 20: GOOGLE SHEETS & SHARE ========= */
async function handleGoogleSheet() {
    const playStoreUrl = "https://play.google.com/store/apps/details?id=com.google.android.apps.docs.editors.sheets";
    const appStoreUrl = "https://apps.apple.com/th/app/google-sheets/id441411228";
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    let hasSwitched = false;
    const visibilityHandler = () => {
        if (document.hidden) hasSwitched = true;
    };
    document.addEventListener("visibilitychange", visibilityHandler);

    // เรียกสลับไปยังแอป Google Sheets โดยตรง
    window.location.href = "googlesheets://";

    setTimeout(() => {
        document.removeEventListener("visibilitychange", visibilityHandler);
        if (!hasSwitched) {
            if (typeof notify === 'function') notify("warning", "ไม่พบแอปพลิเคชัน", "กำลังตรวจสอบการติดตั้ง Google Sheets...");
            const userConfirm = confirm("ไม่พบแอป Google Sheets ในเครื่องของคุณ\nต้องการไปหน้าติดตั้ง (Store) เพื่อใช้งานหรือไม่?");
            if (userConfirm) {
                if (isAndroid) window.location.href = playStoreUrl;
                else if (isIOS) window.location.href = appStoreUrl;
                else window.open("https://sheets.google.com", "_blank");
            } else {
                if (typeof notify === 'function') notify("info", "ยกเลิก", "คุณสามารถใช้งานผ่านเบราว์เซอร์แทนได้");
            }
        } else {
            if (typeof notify === 'function') notify("success", "สำเร็จ", "เปิดแอป Google Sheets เรียบร้อยแล้ว");
        }
    }, 2000);
}

/* ========= SECTION 21: COMPARISON REPORT & DATE UTILS ========= */
// Helper: แปลงวันที่เป็นชื่อวันแบบย่อ ภาษาไทย
function getDayName(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    // ✅ ใช้ตัวย่อ: อา., จ., อ., พ., พฤ., ศ., ส.
    const dayNames = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    return dayNames[dateObj.getDay()];
}

// Helper: แปลงวันที่
function formatShortDate(dateStr) {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${(parseInt(year) + 543).toString().slice(-2)}`;
}

function formatTHDate(dateStr) {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${parseInt(year) + 543}`;
}

// สร้างรายการวันที่
function getDatesArray(startDate, endDate) {
    let dates = [];
    let currDate = new Date(startDate + 'T00:00:00');
    let lastDate = new Date(endDate + 'T00:00:00');
    while (currDate <= lastDate) {
        const y = currDate.getFullYear();
        const m = String(currDate.getMonth() + 1).padStart(2, '0');
        const d = String(currDate.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        currDate.setDate(currDate.getDate() + 1);
    }
    return dates;
}

function processComparison() {
    const d1_start = document.getElementById('startDate1')?.value;
    const d1_end   = document.getElementById('endDate1')?.value;
    const d2_start = document.getElementById('startDate2')?.value;
    const d2_end   = document.getElementById('endDate2')?.value;

    const topic = document.getElementById('compareTopic')?.value || 'total';

    if (!d1_start || !d1_end || !d2_start || !d2_end) {
        alert("กรุณาเลือกช่วงเวลาให้ครบถ้วนทั้ง 2 ช่วง");
        return;
    }

    const range1 = getDatesArray(d1_start, d1_end);
    const range2 = getDatesArray(d2_start, d2_end);
    const maxRows = Math.max(range1.length, range2.length);

    const topicLabel = (t) => {
        const map = { cust:'ลูกค้า', barber:'รายได้ช่าง', shop:'รายได้ร้าน', total:'รายได้รวม' };
        return map[t] || 'รายได้';
    };
    const label = topicLabel(topic);

    const headHtml = `
        <tr>
            <th colspan="4" style="background: var(--summary-bg); color: var(--primary); border: 1px solid var(--summary-border);">📅 ช่วงที่ 1 (${formatTHDate(d1_start)} - ${formatTHDate(d1_end)})</th>
            <th colspan="4" style="background: var(--btn-compare1); color: var(--btn-text);">📅 ช่วงที่ 2 (${formatTHDate(d2_start)} - ${formatTHDate(d2_end)})</th>
        </tr>
        <tr>
            <th style="background: var(--primary); color: #fff;">วัน</th>
            <th style="background: var(--primary); color: #fff;">วันที่</th>
            <th style="background: var(--primary); color: #fff;">ลูกค้า</th>
            <th style="background: var(--primary); color: #fff;">${label}</th>
            <th style="background: var(--btn-compare2); color: #fff;">วัน</th>
            <th style="background: var(--btn-compare2); color: #fff;">วันที่</th>
            <th style="background: var(--btn-compare2); color: #fff;">ลูกค้า</th>
            <th style="background: var(--btn-compare2); color: #fff;">${label}</th>
        </tr>
    `;

    function getValueByTopic(dayData, t) {
        switch(t) {
            case 'cust':   return dayData.cust;
            case 'barber': return dayData.barber;
            case 'shop':   return dayData.shop;
            case 'total':  return dayData.total;
            default:       return dayData.total;
        }
    }

    function getDayDataFull(dateStr) {
        const list = typeof archives !== 'undefined' ? archives : [];
        if (!list.length) return { cust: 0, barber: 0, shop: 0, total: 0 };
        const dayRecords = list.filter(a => a.date === dateStr);
        if (!dayRecords.length) return { cust: 0, barber: 0, shop: 0, total: 0 };
    
        let cust = 0, barber = 0, shop = 0, total = 0;
        dayRecords.forEach(a => {
            cust   += a.count || (a.details && Array.isArray(a.details) ? a.details.length : 0);
            barber += Number(a.barber || 0);
            total  += Number(a.total || 0);
            
            // ✅ อนุญาตให้ติดลบได้ตามจริง (ถ้าร้านต้องจ่ายส่วนต่างประกัน)
            if (typeof a.shop !== 'undefined' && a.shop !== null && a.shop !== '') {
                shop += Number(a.shop);
            } else {
                const recTotal = Number(a.total || 0);
                const recBarber = Number(a.barber || 0);
                shop += (recTotal - recBarber); 
            }
        });
    
        return { cust, barber, shop, total };
    }

    let bodyHtml = '';
    let sum1Cust = 0, sum1Val = 0;
    let sum2Cust = 0, sum2Val = 0;

    // ✅ ตัวแปลงฟอร์แมต รองรับค่าติดลบ และค่า 0
    const fmtVal = (v, t, hasData) => {
        if (!hasData) return '-';
        if (v === 0) return t === 'cust' ? '0' : '฿0';
        if (t === 'cust') return v.toLocaleString();
        return v < 0 ? `-฿${Math.abs(v).toLocaleString()}` : `฿${v.toLocaleString()}`;
    };

    for (let i = 0; i < maxRows; i++) {
        const rowBg1 = i % 2 === 0 ? 'var(--summary-bg)' : 'var(--card)';
        const rowBg2 = i % 2 === 0 ? 'rgba(147, 142, 245, 0.08)' : 'var(--card)';
        const border = '1px solid var(--border)';

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

        // กำหนดสีของข้อความ (ถ้าติดลบให้แสดงสีแดง)
        const valColor1 = val1 < 0 ? '#ef4444' : 'var(--success)';
        const valColor2 = val2 < 0 ? '#ef4444' : 'var(--success)';

        bodyHtml += `
            <tr>
                <td style="background: ${rowBg1}; color: var(--primary); border: ${border}; font-weight:500;">${dayName1}</td>
                <td style="background: ${rowBg1}; color: var(--text); border: ${border};">${date1 ? formatShortDate(date1) : '-'}</td>
                <td style="background: ${rowBg1}; color: var(--text); border: ${border}; font-weight:500;">${data1 ? data1.cust.toLocaleString() : '-'}</td>
                <td style="background: ${rowBg1}; color: ${valColor1}; border: ${border}; font-weight:600;">${fmtVal(val1, topic, !!data1)}</td>
                <td style="background: ${rowBg2}; color: var(--btn-compare1); border: ${border}; font-weight:500;">${dayName2}</td>
                <td style="background: ${rowBg2}; color: var(--text); border: ${border};">${date2 ? formatShortDate(date2) : '-'}</td>
                <td style="background: ${rowBg2}; color: var(--text); border: ${border}; font-weight:500;">${data2 ? data2.cust.toLocaleString() : '-'}</td>
                <td style="background: ${rowBg2}; color: ${valColor2}; border: ${border}; font-weight:600;">${fmtVal(val2, topic, !!data2)}</td>
            </tr>
        `;
    }

    const fmtSum = (v, t) => {
        const val = v || 0;
        if (t === 'cust') return val.toLocaleString();
        return val < 0 ? `-฿${Math.abs(val).toLocaleString()}` : `฿${val.toLocaleString()}`;
    };

    const sum1Color = sum1Val < 0 ? '#ef4444' : 'var(--success)';
    const sum2Color = sum2Val < 0 ? '#ef4444' : 'var(--success)';

    const footHtml = `
        <tr style="font-weight: bold;">
            <td style="background: var(--warning); color: #000; border: 2px solid var(--btn-his2);">รวม</td>
            <td style="background: var(--summary-bg); color: var(--warning); border: 2px solid var(--btn-his2);">${range1.length} วัน</td>
            <td style="background: var(--summary-bg); color: var(--text); border: 2px solid var(--btn-his2); font-size: 1.05em;">${(sum1Cust || 0).toLocaleString()}</td>
            <td style="background: var(--summary-bg); color: ${sum1Color}; border: 2px solid var(--btn-his2); font-size: 1.05em;">${fmtSum(sum1Val, topic)}</td>
            <td style="background: var(--warning); color: #000; border: 2px solid var(--btn-his2);">รวม</td>
            <td style="background: rgba(147, 142, 245, 0.15); color: var(--btn-compare1); border: 2px solid var(--btn-his2);">${range2.length} วัน</td>
            <td style="background: rgba(147, 142, 245, 0.15); color: var(--text); border: 2px solid var(--btn-his2); font-size: 1.05em;">${(sum2Cust || 0).toLocaleString()}</td>
            <td style="background: rgba(147, 142, 245, 0.15); color: ${sum2Color}; border: 2px solid var(--btn-his2); font-size: 1.05em;">${fmtSum(sum2Val, topic)}</td>
        </tr>
    `;

    document.getElementById('compareTableHead').innerHTML = headHtml;
    document.getElementById('comparisonSingleContent').innerHTML = bodyHtml;
    document.getElementById('compareTableFoot').innerHTML = footHtml;
}
/* ========= SECTION 22: IMPORT / EXPORT / CLEAR ========= */
// 1. ฟังก์ชันส่งออกข้อมูล (Export)
function exportBackup() {
    try {
        const data = {
            db: typeof db !== 'undefined' ? db : JSON.parse(localStorage.getItem("barber_db") || "[]"),
            archives: typeof archives !== 'undefined' ? archives : JSON.parse(localStorage.getItem("barber_archives") || "[]"),
            account: typeof account !== 'undefined' ? account : JSON.parse(localStorage.getItem("barber_account") || '{"balance":0,"logs":[]}'), 
            conf: typeof conf !== 'undefined' ? conf : JSON.parse(localStorage.getItem("barber_conf") || "{}"),
            activeBranch: localStorage.getItem("active_branch_name") || null, // ✅ สำรองชื่อสาขาด้วย
            viewScope: localStorage.getItem("view_data_scope") || null,       // ✅ สำรองโหมดการแสดงผลด้วย
            exported: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Barber-Backup-${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.json`;
        a.click();
        
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
            if (!data.db && !data.archives && !data.account && !data.conf) {
                throw new Error("Wrong format");
            }
            const processImport = () => {
                if (data.db !== undefined) localStorage.setItem("barber_db", JSON.stringify(data.db));
                if (data.archives !== undefined) localStorage.setItem("barber_archives", JSON.stringify(data.archives));
                if (data.account !== undefined) localStorage.setItem("barber_account", JSON.stringify(data.account));
                if (data.conf !== undefined) localStorage.setItem("barber_conf", JSON.stringify(data.conf));
                
                // ✅ คืนค่าชื่อสาขาและโหมดการแสดงผล (ถ้ามีในไฟล์)
                if (data.activeBranch !== null) localStorage.setItem("active_branch_name", data.activeBranch);
                if (data.viewScope !== null) localStorage.setItem("view_data_scope", data.viewScope);
                
                if (typeof db !== 'undefined' && data.db) db = data.db;
                if (typeof archives !== 'undefined' && data.archives) archives = data.archives;
                if (typeof account !== 'undefined' && data.account) account = data.account;
                if (typeof conf !== 'undefined' && data.conf) conf = data.conf;
                
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
            } else {
                alert("กรุณาใช้ไฟล์ .json ที่สำรองจากแอปนี้เท่านั้น");
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
/* ========= SECTION 23: MODAL HELPERS ========= */
window.onclick = e => {
    if (e.target.classList.contains("modal")) e.target.style.display = "none";
};
function closeReportModal() { $("reportModal").style.display = "none"; }

/* ========= SECTION 24: SHARE LINE ========= */
function shareLine() {
    // Helper Selector กัน Error
    const $ = (id) => document.getElementById(id);

    const dateEl = $("dateInp");
    if (!dateEl || !dateEl.value) {
        if (typeof Swal !== 'undefined') Swal.fire({ title: 'กรุณาเลือกวันที่', icon: 'warning' });
        return;
    }
    const dInp = dateEl.value;
    const today = db.filter(r => r.date === dInp);
    
    // 🔴 ตรวจสอบข้อมูล
    if (!today.length) {
        const errSfx = document.getElementById("errorSound"); 
        if (errSfx) errSfx.play();
        if (typeof Swal !== 'undefined') Swal.fire({ title: 'ไม่พบข้อมูล', text: 'วันที่เลือกไม่มีการบันทึกไว้', icon: 'info' });
        return;
    }

    // 🗓️ จัดการวันที่และดึงข้อมูลจาก การตั้งค่า (conf / localStorage)
    const [y, m, d] = dInp.split('-');
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const fDate = `${parseInt(d)} ${months[parseInt(m)-1]} ${(parseInt(y)+543).toString().slice(-2)}`;
    
    // 🎯 ดึงค่าจากการตั้งค่าพร้อม Fallback กัน undefined
    const currentConf = (typeof conf !== 'undefined' && conf) ? conf : JSON.parse(localStorage.getItem('barberConf') || '{}');
    const shopName = currentConf.shop || "Barber Shop";
    const perc = Number(currentConf.perc) || 50; // default 50%
    const guar = Number(currentConf.guar) || 0;
    const offsiteRate = Number(currentConf.offsiteRate) || 200; // ค่าฟิกนอกสถานที่ (ถ้ามีตั้งไว้)

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
                bEarnBase += offsiteRate; // 🚗 คิดตามค่าบริการนอกสถานที่ที่กำหนดไว้
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
    let shopEarn = Math.max(0, tot - (bEarn - tips)); // ป้องกันร้านติดลบกรณีมีประกันรายได้
    let settle = cash - (bEarn - tips); // ยอดเคลียร์เงินสด (หักทิปออก)

    // 🔄 ยอดค้างสะสม
    let oldBalance = 0, periodText = "", hasOldBalance = false;
    if (typeof archives !== "undefined" && Array.isArray(archives)) {
        const pendingDays = archives.filter(day => day.date !== dInp && Number(day.settle) !== 0);
        if (pendingDays.length > 0) {
            hasOldBalance = true;
            oldBalance = pendingDays.reduce((sum,day)=>sum+(Number(-day.settle)||0),0);
            const fmt = iso=>{const p=iso.split('-');return `${parseInt(p[2])}/${parseInt(p[1])}`;};
            const yr = iso=>(parseInt(iso.split('-')[0])+543).toString().slice(-2);
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
    const $ = (id) => document.getElementById(id);
    const msgEdit = $("msgEdit"), previewArea = $("linePreview"); // ✅ เพิ่มบรรทัดนี้เข้าไป
    
    if (!msgEdit || !msgEdit.value.trim()) {
        if (typeof Swal !== 'undefined') Swal.fire({ title: 'ไม่พบข้อความ', text: 'กรุณาตรวจสอบข้อความก่อนส่ง', icon: 'warning' });
        return;
    }
    
    // เปิดแอป LINE เพื่อส่งข้อความ
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(msgEdit.value)}`, '_blank');
    
    // ปิดหน้าจอ Preview
    if (previewArea) previewArea.style.display = "none";
}
// 🔴 ฟังก์ชันปิด Modal (แก้ไข ID ให้ตรงกับ linePreview)
function closeLineModal() { 
    const $ = (id) => document.getElementById(id);
    const previewArea = $("linePreview"); 
    if (previewArea) previewArea.style.display = "none"; 
}
/* ========= ✅ INITIALIZE — โหลดค่าเริ่มต้นเมื่อเปิดหน้า ========= */
document.addEventListener("DOMContentLoaded", () => {
    // 1. ฟังก์ชันตัวช่วยดึง Element เพื่อป้องกัน Error
    const $ = id => document.getElementById(id);
    const today = new Date().toISOString().split('T')[0];

    // 2. ดึงค่า conf แบบปลอดภัย (มี Fallback กัน Crash)
    const safeConf = (typeof conf !== 'undefined' && conf) 
        ? conf 
        : JSON.parse(localStorage.getItem('barberConf') || '{}');

    // ตั้งค่าวันที่ปัจจุบัน
    if ($("dateInp")) { 
        $("dateInp").value = today; 
        if (typeof updateDateDisplay === 'function') updateDateDisplay(today); 
    }
    if ($("accDate")) $("accDate").value = today;

    // ตั้งค่าชื่อร้านและธีมแบบ ปลอดภัย
    if (typeof applyTheme === 'function' && safeConf.theme) {
        applyTheme(safeConf.theme);
    }
    
    const entryShop = $("entryShopName");
    if (entryShop) entryShop.innerText = safeConf.shop || 'Barber Shop';

    // ตั้งค่าเวลาปัจจุบัน
    const now = new Date();
    const curTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    if ($("tStart")) $("tStart").value = curTime;
    if ($("tEnd")) $("tEnd").value = curTime;

    // โหลดข้อมูลหน้าแรกแบบปลอดภัย
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
    if ($("histMonth")) $("histMonth").value = currentMonth;
    if ($("monthlyReportPicker")) $("monthlyReportPicker").value = currentMonth;

    // ตั้งค่าปี-เดือนเริ่มต้นสำหรับเปรียบเทียบ (คำนวณเดือนก่อนหน้าแบบปลอดภัย)
    if ($("compMonth1")) {
        const prevMonthDate = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1);
        const prevMonth = `${prevMonthDate.getFullYear()}-${(prevMonthDate.getMonth() + 1).toString().padStart(2, '0')}`;
        $("compMonth1").value = prevMonth;
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

    // ผูก Event เปลี่ยนเดือนให้ครอบคลุมทุก Picker
    const handleMonthChange = (e) => {
        const selectedMonth = e.target.value;
        if ($("histMonth")) $("histMonth").value = selectedMonth;
        if ($("monthlyReportPicker")) $("monthlyReportPicker").value = selectedMonth;

        if (typeof loadHistMonth === 'function') loadHistMonth();
        if (typeof renderDailyTableReport === 'function') renderDailyTableReport();
    };

    if ($("monthlyReportPicker")) $("monthlyReportPicker").addEventListener('change', handleMonthChange);
    if ($("histMonth")) $("histMonth").addEventListener('change', handleMonthChange);

    // ซ่อนหน้าโหลด / แสดงเนื้อหาหลัก
    const loadingScreen = $("loadingScreen");
    if (loadingScreen) {
        loadingScreen.style.display = "none";
    }

    // แจ้งเวอร์ชันและเวลาอัปเดตแบบกัน Crash
    const ver = typeof APP_VERSION !== 'undefined' ? APP_VERSION : '1.0.0';
    const upd = typeof LAST_UPDATED !== 'undefined' ? LAST_UPDATED : '-';
    console.log(`✅ Barber-Note v${ver} โหลดสมบูรณ์ — ${upd}`);
});
/* ========= END OF SCRIPT — สิ้นสุดโค้ดทั้งหมด ========= */
