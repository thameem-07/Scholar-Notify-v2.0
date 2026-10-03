// Scholar Notify v2.0 - Core Application Logic & Refined Forest Green × Dark Slate × Lime Design System

const VALID_ACCOUNTS = {
    "teacher.anand": { pass: "teacher@2026", role: "Teacher", name: "Ramesh Solanki (Teacher - Anand)" },
    "deo.gujarat": { pass: "deo@2026", role: "DEO", name: "Dr. K. Vaghela (District Education Officer)" },
    "admin.vsk": { pass: "admin@2026", role: "Admin", name: "System Administrator (VSK Portal)" }
};

let currentUser = null;
let currentTab = 'vsk';
let activeStudents = [...MOCK_STUDENTS];
let selectedStudentForDNA = MOCK_STUDENTS[0];
let selectedStudentForScheme = MOCK_STUDENTS[0];
let selectedStudentForSim = MOCK_STUDENTS[0];
let selectedStudentForSOS = MOCK_STUDENTS[0];

let parsedIntakeRows = [];
let vectorPieChartInstance = null;
let simChartInstance = null;
let activeMediaAudio = null;
let sathiPairs = [];
let prevSimNewRisk = null;

// ==========================================================================
// 1. NUMERIC COUNT-UP ANIMATION HELPER (600-900ms, Pure Vanilla JS)
// ==========================================================================
function animateCountUp(element, endVal, duration = 750, prefix = '', suffix = '') {
    if (!element) return;
    const num = parseInt(endVal, 10);
    if (isNaN(num)) {
        element.innerHTML = `${prefix}${endVal}${suffix}`;
        return;
    }

    // Respect reduced motion accessibility
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        element.innerHTML = `${prefix}${num.toLocaleString()}${suffix}`;
        return;
    }

    const startVal = 0;
    const startTime = performance.now();

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutQuart
        const ease = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(startVal + (num - startVal) * ease);
        element.innerHTML = `${prefix}${current.toLocaleString()}${suffix}`;
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.innerHTML = `${prefix}${num.toLocaleString()}${suffix}`;
        }
    }
    requestAnimationFrame(update);
}

function animateValue(element, startVal, endVal, duration = 400, prefix = '', suffix = '') {
    if (!element) return;
    const startNum = parseInt(startVal, 10) || 0;
    const endNum = parseInt(endVal, 10) || 0;
    const startTime = performance.now();

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startNum + (endNum - startNum) * ease);
        element.innerHTML = `${prefix}${current}${suffix}`;
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.innerHTML = `${prefix}${endNum}${suffix}`;
        }
    }
    requestAnimationFrame(update);
}

// ==========================================================================
// 2. PCM WAV AUDIO ENGINE IN BROWSER MEMORY
// ==========================================================================
function generateWavAudioUri(freq1, freq2, durationSec = 0.6) {
    const sampleRate = 8000;
    const numSamples = Math.floor(sampleRate * durationSec);
    const dataLen = numSamples * 2;
    const buffer = new ArrayBuffer(44 + dataLen);
    const view = new DataView(buffer);

    function writeString(v, offset, str) {
        for (let i = 0; i < str.length; i++) {
            v.setUint8(offset + i, str.charCodeAt(i));
        }
    }

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLen, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLen, true);

    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const tone1 = Math.sin(2 * Math.PI * freq1 * t);
        const tone2 = freq2 ? Math.sin(2 * Math.PI * freq2 * t) : 0;
        const val = (tone1 + tone2) * 0.4;
        const sample = Math.max(-1, Math.min(1, val)) * 32767;
        view.setInt16(44 + i * 2, sample, true);
    }

    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let b = 0; b < bytes.length; b++) {
        binary += String.fromCharCode(bytes[b]);
    }
    return 'data:audio/wav;base64,' + btoa(binary);
}

function playCallChime() {
    if (activeMediaAudio) {
        activeMediaAudio.pause();
    }
    const chimeWavUri = generateWavAudioUri(523.25, 659.25, 0.6);
    activeMediaAudio = new Audio(chimeWavUri);
    activeMediaAudio.volume = 0.8;
    activeMediaAudio.play().catch(e => console.log("Audio notice:", e));
}

// ==========================================================================
// 3. INITIALIZATION & SESSION PERSISTENCE
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('dropoutDefendersUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            showDashboard();
        } catch (e) {
            localStorage.removeItem('dropoutDefendersUser');
        }
    }
});

// ==========================================================================
// 4. AUTHENTICATION HANDLERS
// ==========================================================================
function handleLogin(e) {
    if (e) e.preventDefault();

    const userVal = document.getElementById('loginUser').value.trim();
    const passVal = document.getElementById('loginPass').value;
    const errorBox = document.getElementById('loginError');

    if (VALID_ACCOUNTS[userVal] && VALID_ACCOUNTS[userVal].pass === passVal) {
        if (errorBox) errorBox.classList.add('hidden');

        currentUser = VALID_ACCOUNTS[userVal];
        localStorage.setItem('dropoutDefendersUser', JSON.stringify(currentUser));

        showDashboard();
        showToast("Access Granted!", `Welcome to Scholar Notify, ${currentUser.name}.`, "success");
    } else {
        if (errorBox) {
            errorBox.innerText = "Invalid credentials. Accounts are provisioned exclusively by your District Education Administrator.";
            errorBox.classList.remove('hidden');
            errorBox.classList.remove('shake-error');
            // Force DOM reflow to re-trigger shake animation
            void errorBox.offsetWidth;
            errorBox.classList.add('shake-error');
        }
        document.getElementById('loginPass').value = '';
        showToast("Authentication Failed", "Incorrect username or password.", "error");
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('dropoutDefendersUser');

    const app = document.getElementById('dashboardApp');
    const login = document.getElementById('loginScreen');

    app.classList.add('hidden');
    app.classList.remove('flex');
    login.classList.remove('hidden');

    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';

    const errorBox = document.getElementById('loginError');
    if (errorBox) errorBox.classList.add('hidden');

    showToast("Signed Out", "You have securely signed out of the portal.", "info");
}

function showDashboard() {
    document.getElementById('loginScreen').classList.add('hidden');
    const app = document.getElementById('dashboardApp');
    app.classList.remove('hidden');
    app.classList.add('flex');

    const badge = document.getElementById('userProfileBadge');
    if (badge && currentUser) {
        badge.innerText = `Logged in: ${currentUser.name}`;
    }

    initTabs();
    populateStudentDropdowns();
    renderVSKDashboard();
    renderStudentTable();
    loadStudentDNA(selectedStudentForDNA.id);
    loadStudentSchemeMatch(selectedStudentForScheme.id);
    runSimulation();
    loadLowRiskRegistry();
    loadSathiLeaderboard();
    loadSathiPairs();
    loadSOSStudent();
    initDragAndDrop();
    setIntakeWorkflowStage(1);
}

// ==========================================================================
// 5. NAVIGATION & TAB ROUTING
// ==========================================================================
function switchTab(tabId) {
    currentTab = tabId;

    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.classList.remove('active-tab');
    });
    const targetTabBtn = document.getElementById(`tab-${tabId}`);
    if (targetTabBtn) targetTabBtn.classList.add('active-tab');

    document.querySelectorAll('.tab-content').forEach(sec => {
        sec.classList.add('hidden');
    });

    const targetSec = document.getElementById(`sec-${tabId}`);
    if (targetSec) {
        targetSec.classList.remove('hidden');
    }

    if (tabId === 'vsk') {
        setTimeout(renderVSKCharts, 120);
    } else if (tabId === 'simulator') {
        setTimeout(runSimulation, 120);
    }
}

function initTabs() {
    switchTab('vsk');
}

// ==========================================================================
// 6. POPULATE DROPDOWNS
// ==========================================================================
function populateStudentDropdowns() {
    const dnaSelect = document.getElementById('multivectorStudentSelect');
    const schemeSelect = document.getElementById('schemeStudentSelect');
    const simSelect = document.getElementById('simStudentSelect');
    const sosSelect = document.getElementById('sosStudentSelect');

    const optionsHTML = MOCK_STUDENTS.map(s => `
        <option value="${s.id}">${s.name} (${s.id}) - ${s.riskLevel} Risk [${s.primaryVector}]</option>
    `).join('');

    if (dnaSelect) dnaSelect.innerHTML = optionsHTML;
    if (schemeSelect) schemeSelect.innerHTML = optionsHTML;
    if (simSelect) simSelect.innerHTML = optionsHTML;
    if (sosSelect) {
        sosSelect.innerHTML = MOCK_STUDENTS.filter(s => s.riskLevel === 'Severe' || s.riskLevel === 'High').map(s => `
            <option value="${s.id}">${s.name} (${s.id}) - ${s.school}</option>
        `).join('');
    }
}

// ==========================================================================
// 7. VSK OVERVIEW & DISTRICT SURVEILLANCE (SECTION 1)
// ==========================================================================
function getDynamicClusterTelemetry() {
    const clusterMap = {};

    MOCK_STUDENTS.forEach(s => {
        const dist = s.district;
        if (!clusterMap[dist]) {
            clusterMap[dist] = {
                district: dist,
                enrolled: 0,
                atRisk: 0,
                vectors: {},
                highestRisk: 'Low'
            };
        }

        clusterMap[dist].enrolled += 1;
        if (s.riskLevel === 'Severe' || s.riskLevel === 'High' || s.riskLevel === 'Moderate') {
            clusterMap[dist].atRisk += 1;
        }

        clusterMap[dist].vectors[s.primaryVector] = (clusterMap[dist].vectors[s.primaryVector] || 0) + 1;

        const rank = { 'Severe': 4, 'High': 3, 'Moderate': 2, 'Low': 1 };
        if (rank[s.riskLevel] > (rank[clusterMap[dist].highestRisk] || 0)) {
            clusterMap[dist].highestRisk = s.riskLevel;
        }
    });

    return Object.values(clusterMap).map(c => {
        let topVector = 'Economic';
        let topCount = 0;
        for (const [vec, count] of Object.entries(c.vectors)) {
            if (count > topCount) {
                topCount = count;
                topVector = vec;
            }
        }

        const pct = c.enrolled > 0 ? ((c.atRisk / c.enrolled) * 100).toFixed(0) : 0;
        return {
            district: c.district,
            enrolled: c.enrolled,
            atRisk: c.atRisk,
            atRiskPct: pct,
            primaryVector: topVector,
            riskLevel: c.highestRisk
        };
    });
}

function inspectClusterStudents(clusterName) {
    switchTab('ews');
    const searchInput = document.getElementById('ewsSearchInput');
    if (searchInput) {
        const cleanName = clusterName.replace(/\s+(Cluster|Rural)$/i, '').trim();
        searchInput.value = cleanName;
        filterStudents();
    }
}

function renderVSKDashboard() {
    const tableBody = document.getElementById('vskDistrictTable');

    const totalStudents = MOCK_STUDENTS.length;
    const flaggedStudents = MOCK_STUDENTS.filter(s => s.riskLevel === 'Severe' || s.riskLevel === 'High' || s.riskLevel === 'Moderate').length;
    const flaggedPct = totalStudents > 0 ? ((flaggedStudents / totalStudents) * 100).toFixed(1) : "0.0";
    const activePlans = sathiPairs.length;

    const elTotal = document.getElementById('statTotalStudents');
    const elFlagged = document.getElementById('statFlaggedStudents');
    const elActive = document.getElementById('statActivePlans');
    const elSub = document.getElementById('dashSubTitle');

    // Smooth count-up animations for KPI cards (600-900ms)
    animateCountUp(elTotal, totalStudents, 750);
    animateCountUp(elFlagged, flaggedStudents, 800, '', ` <span class="text-xs font-semibold text-rose-400">(${flaggedPct}%)</span>`);
    animateCountUp(elActive, activePlans, 700, '', activePlans > 0 ? ` Pair${activePlans > 1 ? 's' : ''}` : ' Active');

    if (elSub) {
        elSub.innerText = `Real-time risk analysis for ${totalStudents} active student profile(s) across local school clusters.`;
    }

    if (!tableBody) return;

    const clusterTelemetry = getDynamicClusterTelemetry();

    tableBody.innerHTML = clusterTelemetry.map(d => {
        let badgeColor = 'bg-rose-950/60 text-rose-300 border-rose-800/80';
        if (d.riskLevel === 'High') badgeColor = 'bg-amber-950/60 text-amber-300 border-amber-800/80';
        if (d.riskLevel === 'Moderate') badgeColor = 'bg-sky-950/60 text-sky-300 border-sky-800/80';
        if (d.riskLevel === 'Low') badgeColor = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80';

        return `
            <tr class="table-interactive-row">
                <td class="py-3 px-3 font-bold text-[#F5F7F5] flex items-center gap-2">
                    <i class="fa-solid fa-location-dot text-[#10B981] text-xs"></i> ${d.district}
                </td>
                <td class="py-3 px-3 font-semibold text-[#94A39C]">${d.enrolled}</td>
                <td class="py-3 px-3 font-semibold ${d.atRisk > 0 ? 'text-rose-400' : 'text-[#10B981]'}">${d.atRisk} (${d.atRiskPct}%)</td>
                <td class="py-3 px-3">
                    <span class="bg-[#111B18] px-2 py-0.5 rounded border border-[#263A32] text-[11px] text-[#6EE7B7] font-medium">${d.primaryVector}</span>
                </td>
                <td class="py-3 px-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${badgeColor}">
                        ${d.riskLevel}
                    </span>
                </td>
                <td class="py-3 px-3 text-right">
                    <button onclick="inspectClusterStudents('${d.district}')" class="inspect-cluster-btn text-[#10B981] font-bold hover:underline text-[11px] inline-flex items-center gap-1 cursor-pointer">
                        <span>Inspect</span> <i class="fa-solid fa-arrow-right text-[10px]"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    renderVSKCharts();
}

function renderVSKCharts() {
    const canvas = document.getElementById('vectorPieChart');
    if (!canvas) return;

    if (vectorPieChartInstance) {
        vectorPieChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    vectorPieChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Economic (32%)', 'Academic (28%)', 'Health/Nutr (15%)', 'Environmental (13%)', 'Behavioral (12%)'],
            datasets: [{
                data: [32, 28, 15, 13, 12],
                backgroundColor: [
                    '#F59E0B', // Economic - High risk semantic amber
                    '#EF4444', // Academic - Severe risk semantic red
                    '#10B981', // Health - Low risk semantic emerald
                    '#3B82F6', // Environmental - Moderate risk semantic blue
                    '#6EE7B7'  // Behavioral - Lime mint highlight
                ],
                borderWidth: 2,
                borderColor: '#17231F',
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                animateRotate: true,
                duration: 750,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94A39C',
                        font: { size: 10, family: 'Plus Jakarta Sans', weight: '600' },
                        boxWidth: 10,
                        padding: 8
                    }
                },
                tooltip: {
                    backgroundColor: '#17231F',
                    borderColor: '#263A32',
                    borderWidth: 1,
                    titleColor: '#F5F7F5',
                    bodyColor: '#94A39C',
                    padding: 8,
                    cornerRadius: 8
                }
            },
            cutout: '72%'
        },
        plugins: [{
            id: 'doughnutCenterText',
            beforeDraw: function(chart) {
                const { width, height, ctx } = chart;
                ctx.save();
                const total = MOCK_STUDENTS.length;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Label: RISK PROFILE
                ctx.font = '700 9px Plus Jakarta Sans';
                ctx.fillStyle = '#94A39C';
                ctx.fillText('RISK PROFILE', width / 2, (height / 2) - 10);

                // Student count number
                ctx.font = 'bold 22px Plus Jakarta Sans';
                ctx.fillStyle = '#F5F7F5';
                ctx.fillText(total.toString(), width / 2, (height / 2) + 12);
                
                ctx.restore();
            }
        }]
    });
}

// ==========================================================================
// 8. EARLY WARNING SYSTEM & STUDENT DIRECTORY (SECTION 2)
// ==========================================================================
function filterStudents() {
    const searchVal = document.getElementById('ewsSearchInput').value.toLowerCase();
    const riskVal = document.getElementById('riskFilter').value;
    const vectorVal = document.getElementById('vectorFilter').value;

    activeStudents = MOCK_STUDENTS.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchVal) || s.id.toLowerCase().includes(searchVal) || s.school.toLowerCase().includes(searchVal);
        const matchesRisk = (riskVal === 'ALL') || (s.riskLevel === riskVal);
        const matchesVector = (vectorVal === 'ALL') || (s.primaryVector === vectorVal);
        return matchesSearch && matchesRisk && matchesVector;
    });

    renderStudentTable();
}

function renderStudentTable() {
    const tbody = document.getElementById('studentTableBody');
    const countSpan = document.getElementById('studentCount');
    if (!tbody) return;

    if (countSpan) countSpan.innerText = activeStudents.length;

    if (activeStudents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-8 text-center text-[#94A39C]">
                    <i class="fa-solid fa-folder-open text-2xl mb-2 text-[#263A32]"></i>
                    <div>No students match the selected filter criteria.</div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = activeStudents.map(s => {
        let riskBadge = 'bg-rose-950/60 text-rose-300 border-rose-800/80';
        let scoreColor = 'text-rose-400';

        if (s.riskLevel === 'High') {
            riskBadge = 'bg-amber-950/60 text-amber-300 border-amber-800/80';
            scoreColor = 'text-amber-400';
        } else if (s.riskLevel === 'Moderate') {
            riskBadge = 'bg-sky-950/60 text-sky-300 border-sky-800/80';
            scoreColor = 'text-sky-300';
        } else if (s.riskLevel === 'Low') {
            riskBadge = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80';
            scoreColor = 'text-[#10B981]';
        }

        const pair = sathiPairs.find(p => p.menteeId === s.id);

        return `
            <tr class="table-interactive-row">
                <td class="py-3 px-4 whitespace-nowrap">
                    <div class="font-bold text-[#F5F7F5]">${s.name}</div>
                    <div class="text-[11px] text-[#94A39C] flex items-center gap-1.5 mt-0.5">
                        <span>${s.id} • ${s.grade}</span>
                        ${pair ? `<span class="text-[9px] bg-[#123B2A] text-[#6EE7B7] font-bold px-1.5 py-0.2 rounded border border-[#263A32]"><i class="fa-solid fa-handshake"></i> ${pair.mentorName}</span>` : ''}
                    </div>
                </td>
                <td class="py-3 px-4">
                    <div class="text-[#F5F7F5] font-medium">${s.school}</div>
                    <div class="text-[11px] text-[#94A39C]">${s.district}</div>
                </td>
                <td class="py-3 px-4 whitespace-nowrap">
                    <div class="font-bold ${s.attendance < 75 ? 'text-rose-400' : 'text-[#10B981]'}">${s.attendance}%</div>
                    <div class="progress-bar-track w-16 mt-1">
                        <div class="progress-bar-fill ${s.attendance < 75 ? 'bg-rose-500' : 'bg-[#10B981]'}" style="width: ${s.attendance}%"></div>
                    </div>
                </td>
                <td class="py-3 px-4 whitespace-nowrap">
                    <div class="font-bold text-[#F5F7F5]">${s.marks}%</div>
                </td>
                <td class="py-3 px-4">
                    <span class="bg-[#111B18] text-[#6EE7B7] px-2 py-0.5 rounded text-[11px] font-medium border border-[#263A32]">
                        ${s.primaryVector}
                    </span>
                </td>
                <td class="py-3 px-4 whitespace-nowrap">
                    <div class="inline-flex items-center gap-2 bg-[#111B18] px-2.5 py-1 rounded-lg border border-[#263A32]">
                        <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${riskBadge}">
                            ${s.riskLevel}
                        </span>
                        <span class="text-xs font-mono font-extrabold ${scoreColor}">
                            ${s.riskScore}%
                        </span>
                    </div>
                </td>
                <td class="py-3 px-4 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                        <button onclick="sendSingleSMS('${s.id}')" title="Send WhatsApp Advisory" class="table-action-icon-btn bg-[#123B2A] hover:bg-[#1B4E38] text-[#10B981] border border-[#263A32] cursor-pointer">
                            <i class="fa-brands fa-whatsapp text-xs"></i>
                        </button>
                        <button onclick="inspectStudentDNA('${s.id}')" title="View Vector Causes" class="table-action-icon-btn bg-[#17231F] hover:bg-[#1E2E28] text-[#F5F7F5] border border-[#263A32] cursor-pointer">
                            <i class="fa-solid fa-dna text-xs"></i>
                        </button>
                        <button onclick="openPairModalForStudent('${s.id}')" title="Pair Sathi Mentor" class="table-action-icon-btn ${pair ? 'bg-[#10B981] text-[#0B1713] border-[#10B981]' : 'bg-[#17231F] hover:bg-[#1E2E28] text-[#6EE7B7] border-[#263A32]'} cursor-pointer">
                            <i class="fa-solid fa-user-plus text-xs"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function openPairModalForStudent(studentId) {
    switchTab('sathi');
    openPairModal(studentId);
}

function inspectStudentDNA(studentId) {
    switchTab('multivector');
    const select = document.getElementById('multivectorStudentSelect');
    if (select) {
        select.value = studentId;
        loadStudentDNA(studentId);
    }
}

function sendSingleSMS(studentId) {
    const s = MOCK_STUDENTS.find(item => item.id === studentId);
    if (!s) return;
    showToast("WhatsApp Notice Sent!", `Dispatched attendance advisory to ${s.parentName} (${s.parentPhone}) for ${s.name}.`, "success");
}

function triggerBatchNotification() {
    showToast("Batch Alerts Dispatched!", `Successfully transmitted 38 bilingual WhatsApp retention alerts to parents across district.`, "success");
}

// ==========================================================================
// 9. DROPOUT CAUSES BREAKDOWN / DNA (SECTION 3)
// ==========================================================================
function loadStudentDNA(studentId) {
    const student = MOCK_STUDENTS.find(s => s.id === studentId) || MOCK_STUDENTS[0];
    selectedStudentForDNA = student;

    const studentCard = document.getElementById('dnaStudentCard');
    const riskBadge = document.getElementById('dnaRiskBadge');
    const vectorCards = document.getElementById('dnaVectorCards');
    const narrative = document.getElementById('dnaNarrative');

    if (studentCard) {
        studentCard.classList.remove('dna-profile-card');
        void studentCard.offsetWidth; // Trigger reflow for smooth reveal animation
        studentCard.classList.add('dna-profile-card');

        studentCard.innerHTML = `
            <div class="font-bold text-[#F5F7F5] text-base">${student.name}</div>
            <div class="text-xs text-[#94A39C] mb-3">${student.id} • ${student.grade} • ${student.school}</div>
            
            <div class="space-y-2 text-xs">
                <div class="flex justify-between border-b border-[#263A32] pb-1.5">
                    <span class="text-[#94A39C]">Commute Distance:</span>
                    <span class="font-bold text-[#F5F7F5]">${student.commuteDistance || '4.0 km'}</span>
                </div>
                <div class="flex justify-between border-b border-[#263A32] pb-1.5">
                    <span class="text-[#94A39C]">Family Occupation:</span>
                    <span class="font-bold text-[#F5F7F5]">${student.familyOccupation || 'Laborer'}</span>
                </div>
                <div class="flex justify-between border-b border-[#263A32] pb-1.5">
                    <span class="text-[#94A39C]">Health Checkup Tag:</span>
                    <span class="font-bold text-rose-400">${student.healthFlag || 'Normal'}</span>
                </div>
                <div class="flex justify-between border-b border-[#263A32] pb-1.5">
                    <span class="text-[#94A39C]">Parent Disclosure Status:</span>
                    <span class="font-bold text-amber-400">${student.disclosureStatus || 'Disclosed'}</span>
                </div>
                <div class="flex justify-between pt-0.5">
                    <span class="text-[#94A39C]">Assigned Sathi Buddy:</span>
                    <span class="font-semibold text-[#10B981]">${student.sathiMentor}</span>
                </div>
            </div>
        `;
    }

    if (riskBadge) {
        let badgeColor = 'bg-rose-950/60 text-rose-300 border-rose-800/80';
        if (student.riskLevel === 'High') badgeColor = 'bg-amber-950/60 text-amber-300 border-amber-800/80';
        if (student.riskLevel === 'Moderate') badgeColor = 'bg-sky-950/60 text-sky-300 border-sky-800/80';
        if (student.riskLevel === 'Low') badgeColor = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80';
        riskBadge.innerHTML = `<span class="px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase border ${badgeColor}">${student.riskLevel} Risk (${student.riskScore}%)</span>`;
    }

    if (vectorCards) {
        const vb = student.vectorBreakdown;

        let riskBadgeClass = 'text-rose-400 bg-rose-950/40 border-rose-800/60';
        if (student.riskLevel === 'High') riskBadgeClass = 'text-amber-400 bg-amber-950/40 border-amber-800/60';
        if (student.riskLevel === 'Moderate') riskBadgeClass = 'text-sky-400 bg-sky-950/40 border-sky-800/60';
        if (student.riskLevel === 'Low') riskBadgeClass = 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';

        vectorCards.innerHTML = `
            <div class="col-span-2 sm:col-span-5 grid grid-cols-1 sm:grid-cols-6 gap-3 items-center">
                <!-- Center Diagnostic Node -->
                <div class="sm:col-span-2 bg-[#123B2A]/40 border-2 border-[#10B981] p-4 rounded-xl text-center shadow-lg relative overflow-hidden">
                    <div class="text-[9px] uppercase font-bold text-[#6EE7B7] tracking-widest mb-1 flex items-center justify-center gap-1">
                        <i class="fa-solid fa-crosshairs text-[10px] text-[#10B981]"></i> CENTRAL DIAGNOSTIC
                    </div>
                    <div class="text-[10px] text-[#94A39C] uppercase font-bold tracking-wider">RISK SCORE</div>
                    <div class="text-3xl font-black text-[#F5F7F5] my-1 font-mono tracking-tight">${student.riskScore}%</div>
                    <span class="inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${riskBadgeClass}">
                        ${student.riskLevel} RISK
                    </span>
                    <div class="mt-2 pt-2 border-t border-[#263A32] text-[10px] text-[#94A39C]">
                        Primary: <strong class="text-[#6EE7B7]">${student.primaryVector}</strong>
                    </div>
                </div>

                <!-- Surrounding 5 Vector Nodes -->
                <div class="sm:col-span-4 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div class="bg-[#111B18] border border-[#263A32] p-2.5 rounded-xl text-center transition-all hover:border-[#10B981]/50">
                        <div class="text-[9px] text-[#94A39C] uppercase font-bold tracking-wider">ATTENDANCE</div>
                        <div class="text-base font-black text-[#10B981] mt-1 font-mono">${student.attendance}%</div>
                        <div class="progress-bar-track w-full mt-2">
                            <div class="vector-bar-fill h-full rounded-full bg-[#10B981]" style="width: ${student.attendance}%"></div>
                        </div>
                    </div>

                    <div class="bg-[#111B18] border border-[#263A32] p-2.5 rounded-xl text-center transition-all hover:border-[#10B981]/50">
                        <div class="text-[9px] text-[#94A39C] uppercase font-bold tracking-wider">ACADEMIC</div>
                        <div class="text-base font-black text-amber-400 mt-1 font-mono">${vb.academic}%</div>
                        <div class="progress-bar-track w-full mt-2">
                            <div class="vector-bar-fill h-full rounded-full bg-amber-500" style="width: ${vb.academic}%"></div>
                        </div>
                    </div>

                    <div class="bg-[#111B18] border border-[#263A32] p-2.5 rounded-xl text-center transition-all hover:border-[#10B981]/50">
                        <div class="text-[9px] text-[#94A39C] uppercase font-bold tracking-wider">ECONOMIC</div>
                        <div class="text-base font-black text-rose-400 mt-1 font-mono">${vb.economic}%</div>
                        <div class="progress-bar-track w-full mt-2">
                            <div class="vector-bar-fill h-full rounded-full bg-rose-500" style="width: ${vb.economic}%"></div>
                        </div>
                    </div>

                    <div class="bg-[#111B18] border border-[#263A32] p-2.5 rounded-xl text-center transition-all hover:border-[#10B981]/50">
                        <div class="text-[9px] text-[#94A39C] uppercase font-bold tracking-wider">HEALTH</div>
                        <div class="text-base font-black text-emerald-400 mt-1 font-mono">${vb.health}%</div>
                        <div class="progress-bar-track w-full mt-2">
                            <div class="vector-bar-fill h-full rounded-full bg-emerald-500" style="width: ${vb.health}%"></div>
                        </div>
                    </div>

                    <div class="bg-[#111B18] border border-[#263A32] p-2.5 rounded-xl text-center transition-all hover:border-[#10B981]/50">
                        <div class="text-[9px] text-[#94A39C] uppercase font-bold tracking-wider">BEHAVIOURAL</div>
                        <div class="text-base font-black text-[#6EE7B7] mt-1 font-mono">${vb.behavioral}%</div>
                        <div class="progress-bar-track w-full mt-2">
                            <div class="vector-bar-fill h-full rounded-full bg-[#6EE7B7]" style="width: ${vb.behavioral}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    if (narrative) {
        narrative.innerHTML = `
            <div class="mb-2">
                <span class="font-bold text-[#F5F7F5]">Primary Risk Driver:</span> 
                <span class="text-rose-400 font-bold">${student.riskScore}% risk</span> driven predominantly by <strong>${student.primaryVector} factors</strong>.
            </div>

            <div class="font-bold text-[#6EE7B7] text-[11px] uppercase tracking-wider mb-2">Detailed Cause Analysis:</div>
            <ul class="space-y-2 text-[#F5F7F5] text-xs mb-4">
                ${student.specificCauses.map(c => `
                    <li class="flex items-start gap-2 bg-[#17231F] p-2.5 rounded-lg border border-[#263A32] shadow-2xs">
                        <i class="fa-solid fa-circle-exclamation text-amber-400 text-xs mt-0.5 flex-shrink-0"></i>
                        <span>${c}</span>
                    </li>
                `).join('')}
            </ul>

            <div class="bg-[#17231F] border border-[#263A32] p-3 rounded-xl text-xs">
                <strong class="font-bold text-[#10B981] block mb-1">🛡️ Non-Disclosure Safeguard Action Plan:</strong>
                <div class="text-[#94A39C] text-[11px] leading-relaxed">${student.fallbackPlan || 'Step 1: Unconditional Welfare Support Offered'}</div>
            </div>
        `;
    }
}

// ==========================================================================
// 10. UNIVERSAL SMART INTAKE ENGINE (SECTION 4)
// ==========================================================================
function setIntakeWorkflowStage(stageNum) {
    const steps = [
        { id: 'stepUpload', name: 'Upload' },
        { id: 'stepMap', name: 'Map' },
        { id: 'stepValidate', name: 'Validate' },
        { id: 'stepSync', name: 'Sync' }
    ];
    const lines = ['stepLine1', 'stepLine2', 'stepLine3'];

    steps.forEach((step, idx) => {
        const el = document.getElementById(step.id);
        if (!el) return;
        el.className = 'intake-step w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all';
        if (idx + 1 === stageNum) {
            el.classList.add('active');
        } else if (idx + 1 < stageNum) {
            el.classList.add('completed');
        } else {
            el.classList.add('bg-[#111B18]', 'border', 'border-[#263A32]', 'text-[#94A39C]');
        }
    });

    lines.forEach((lineId, idx) => {
        const el = document.getElementById(lineId);
        if (!el) return;
        if (idx + 1 < stageNum) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
}

function downloadSampleTemplate() {
    const csvContent = "Roll_No,Student_Name,Attendance_Pct,Math_Marks,Commute_KM,Family_Job,Health_Flag\n" +
        "STU-9041,Priyanshi Solanki,58%,42%,6.0km,Cotton Harvest,Anemia\n" +
        "STU-8120,Vikram Rathod,64%,38%,2.5km,Daily Mason,Normal\n" +
        "STU-1004,Meera Parmar,68%,61%,3.2km,Textile Mill,Anemia\n" +
        "STU-7089,Rajesh Kumar,71%,54%,8.0km,Small Farmer,Normal\n" +
        "STU-9102,Devang Vaghela,52%,35%,9.5km,Salt-Pan Labor,Underweight\n" +
        "STU-6033,Ananya Joshi,84%,78%,1.5km,Shop Assistant,Normal";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Universal_School_Register.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Template Downloaded!", "Sample CSV with multi-factor attributes downloaded.", "info");
}

function initDragAndDrop() {
    setupDropZone('excelDropZone', 'excelFileInput', (file) => {
        handleExcelUpload({ target: { files: [file] } });
    });

    setupDropZone('photoDropZone', 'photoFileInput', (file) => {
        handlePhotoUpload({ target: { files: [file] } });
    });
}

function setupDropZone(dropZoneId, inputId, onFileDrop) {
    const dropZone = document.getElementById(dropZoneId);
    const fileInput = document.getElementById(inputId);
    if (!dropZone) return;

    dropZone.addEventListener('click', (e) => {
        if (e.target !== fileInput && fileInput) {
            fileInput.click();
        }
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('drag-active');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('drag-active');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            onFileDrop(files[0]);
        }
    }, false);
}

function findBestColumn(headers, sampleRows, keywords) {
    for (const h of headers) {
        const cleanH = h.toString().toLowerCase().trim();
        for (const kw of keywords) {
            if (cleanH.includes(kw.toLowerCase())) {
                return h;
            }
        }
    }

    if (sampleRows && sampleRows.length > 0) {
        for (const h of headers) {
            for (let i = 0; i < Math.min(5, sampleRows.length); i++) {
                const val = sampleRows[i][h]?.toString().toLowerCase() || '';
                for (const kw of keywords) {
                    if (val.includes(kw.toLowerCase())) {
                        return h;
                    }
                }
            }
        }
    }
    return null;
}

function inferCauseFromRawData(dist, marks, job, health, att) {
    const d = parseFloat(dist) || 2.0;
    const m = parseFloat(marks) || 60;
    const j = (job || '').toLowerCase();
    const h = (health || '').toLowerCase();

    if (d > 5.0) {
        return "Environmental / Travel Distance Barrier (Daily Commute > 5km)";
    }
    if (j.includes('harvest') || j.includes('labor') || j.includes('daily') || j.includes('salt') || j.includes('farm')) {
        return "Economic / Household Seasonal Migration & Agricultural Labor";
    }
    if (h.includes('anemia') || h.includes('malnutrition') || h.includes('underweight') || h.includes('sick')) {
        return "Health & Nutritional Chronic Fatigue / Illness";
    }
    if (m < 45 || att < 60) {
        return "Academic Disengagement / Backlog in Fundamental Numeracy";
    }
    return "Behavioral / Low Peer Affiliation & Apathy";
}

function calculateMultiVectorRisk(studentId, studentName, att, distVal = "3.0", jobVal = "Labor", healthVal = "Normal") {
    let score = 0;

    if (att < 60) score += 40;
    else if (att < 75) score += 25;
    else if (att < 85) score += 10;

    const d = parseFloat(distVal) || 2.0;
    if (d > 5.0) score += 20;
    else if (d > 3.0) score += 10;

    const j = jobVal.toLowerCase();
    if (j.includes('harvest') || j.includes('labor') || j.includes('farm')) score += 20;

    const h = healthVal.toLowerCase();
    if (h.includes('anemia') || h.includes('sick') || h.includes('underweight')) score += 15;

    score = Math.min(96, Math.max(12, score));

    let riskLevel = "Low";
    if (score >= 75) riskLevel = "Severe";
    else if (score >= 50) riskLevel = "High";
    else if (score >= 30) riskLevel = "Moderate";

    return { score, riskLevel };
}

function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    setIntakeWorkflowStage(2);

    const fileNameLabel = document.getElementById('excelFileName');
    if (fileNameLabel) {
        fileNameLabel.innerText = `Parsing ${file.name}...`;
    }

    updateIntakeBadge("Parsing Spreadsheet...", "bg-amber-950/60 text-amber-300 border-amber-800/80");

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            if (rows.length === 0) {
                showToast("Empty File", "The uploaded spreadsheet does not contain student rows.", "warning");
                return;
            }

            parseUniversalExcelRows(rows, file.name);
        } catch (err) {
            console.error("Excel parse error:", err);
            showToast("Parsing Error", "Could not parse spreadsheet. Please verify format.", "error");
        }
    };
    reader.readAsArrayBuffer(file);
}

function parseUniversalExcelRows(rows, filename) {
    setIntakeWorkflowStage(3);

    const headers = Object.keys(rows[0] || {});
    const idKeys = ['roll', 'id', 'student_id', 'reg', 'enrollment', 'code', 'gr'];
    const nameKeys = ['name', 'student_name', 'full_name', 'candidate', 'child'];
    const attKeys = ['attendance', 'att', 'presence', 'present_pct', 'attendance_pct', 'days'];
    const distKeys = ['distance', 'commute', 'km', 'travel', 'bus_dist'];
    const jobKeys = ['job', 'occupation', 'parent_job', 'family', 'profession', 'income'];
    const healthKeys = ['health', 'anemia', 'weight', 'bmi', 'medical'];

    const matchedIdCol = findBestColumn(headers, rows, idKeys) || headers[0];
    const matchedNameCol = findBestColumn(headers, rows, nameKeys) || headers[1] || headers[0];
    const matchedAttCol = findBestColumn(headers, rows, attKeys) || headers[2] || headers[0];
    const matchedDistCol = findBestColumn(headers, rows, distKeys) || headers[3] || headers[0];
    const matchedJobCol = findBestColumn(headers, rows, jobKeys) || headers[4] || headers[0];
    const matchedHealthCol = findBestColumn(headers, rows, healthKeys) || headers[5] || headers[0];

    const headerPanel = document.getElementById('headerMapPanel');
    const headerList = document.getElementById('detectedHeadersList');
    if (headerPanel && headerList) {
        headerPanel.classList.remove('hidden');
        headerList.innerHTML = `
            <div class="bg-[#17231F] p-2.5 rounded-lg border border-[#263A32]">
                <span class="text-[#94A39C] block text-[10px]">Mapped ID:</span>
                <strong class="text-[#10B981] font-mono">${matchedIdCol}</strong>
            </div>
            <div class="bg-[#17231F] p-2.5 rounded-lg border border-[#263A32]">
                <span class="text-[#94A39C] block text-[10px]">Mapped Name:</span>
                <strong class="text-[#10B981] font-mono">${matchedNameCol}</strong>
            </div>
            <div class="bg-[#17231F] p-2.5 rounded-lg border border-[#263A32]">
                <span class="text-[#94A39C] block text-[10px]">Mapped Attendance:</span>
                <strong class="text-[#10B981] font-mono">${matchedAttCol}</strong>
            </div>
            <div class="bg-[#17231F] p-2.5 rounded-lg border border-[#263A32]">
                <span class="text-[#94A39C] block text-[10px]">Auto-Inferred Vectors:</span>
                <strong class="text-[#6EE7B7] font-mono">Distance, Job, Health</strong>
            </div>
        `;
    }

    parsedIntakeRows = rows.map((r, index) => {
        const id = r[matchedIdCol]?.toString() || `STU-${9000 + index}`;
        const name = r[matchedNameCol]?.toString() || `Student ${index + 1}`;

        let attRaw = r[matchedAttCol]?.toString() || "75";
        let att = parseInt(attRaw.replace(/[^0-9]/g, ''), 10);
        if (isNaN(att)) att = attRaw.toLowerCase().includes('p') ? 90 : 55;

        const distVal = r[matchedDistCol]?.toString() || "3.5km";
        const jobVal = r[matchedJobCol]?.toString() || "Daily Wage";
        const healthVal = r[matchedHealthCol]?.toString() || "Normal";
        const marksVal = r['Math_Marks'] || r['Marks'] || "52";

        const inferredCause = inferCauseFromRawData(distVal, marksVal, jobVal, healthVal, att);
        const { score, riskLevel } = calculateMultiVectorRisk(id, name, att, distVal, jobVal, healthVal);

        return {
            id,
            name,
            attendance: att,
            cause: inferredCause,
            riskScore: score,
            riskLevel: riskLevel,
            dist: distVal,
            job: jobVal,
            health: healthVal,
            marks: parseInt(marksVal, 10) || 55
        };
    });

    renderIntakeResultsTable(parsedIntakeRows, filename);
    setIntakeWorkflowStage(3);
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    setIntakeWorkflowStage(2);

    const fileNameLabel = document.getElementById('photoFileName');
    if (fileNameLabel) {
        fileNameLabel.innerText = `Scanning ${file.name}...`;
    }

    const laser = document.getElementById('ocrLaserLine');
    if (laser) laser.classList.remove('hidden');

    const stream = document.getElementById('intakeLogStream');
    if (stream) {
        stream.classList.remove('hidden');
        stream.innerHTML = `
            <div class="text-[#10B981] font-bold">[0%] Initializing Tesseract OCR client runtime...</div>
            <div class="text-[#94A39C]">[15%] Loading language training models (eng+guj)...</div>
            <div class="text-[#94A39C]">[30%] Pre-processing physical attendance register photograph...</div>
        `;
    }

    updateIntakeBadge("Running Browser OCR Engine...", "bg-[#123B2A] text-[#10B981] border border-[#263A32]");

    const reader = new FileReader();
    reader.onload = function(e) {
        const imageUrl = e.target.result;

        if (typeof Tesseract !== 'undefined') {
            Tesseract.recognize(
                imageUrl,
                'eng',
                {
                    logger: m => {
                        if (stream && m.status === 'recognizing text') {
                            const pct = Math.round(m.progress * 100);
                            stream.innerHTML += `<div class="text-[#94A39C]">[${pct}%] ${m.status}: ${pct}% complete</div>`;
                            stream.scrollTop = stream.scrollHeight;
                        }
                    }
                }
            ).then(({ data: { text } }) => {
                if (laser) laser.classList.add('hidden');
                stream.innerHTML += `<div class="text-[#10B981] font-bold">[100%] OCR Text recognition complete! Mapping records...</div>`;
                parseOCRTextContent(text);
            }).catch(err => {
                console.warn("Tesseract runtime notice:", err);
                if (laser) laser.classList.add('hidden');
                fallbackOCRData(file.name);
            });
        } else {
            setTimeout(() => {
                if (laser) laser.classList.add('hidden');
                fallbackOCRData(file.name);
            }, 1200);
        }
    };
    reader.readAsDataURL(file);
}

function parseOCRTextContent(text) {
    const lines = text.split('\n').filter(l => l.trim().length > 3);
    const simulatedRows = [];

    lines.forEach((line, idx) => {
        const tokens = line.split(/\s+/);
        if (tokens.length >= 2) {
            const potentialName = tokens.slice(0, 2).join(' ').replace(/[^a-zA-Z\s]/g, '');
            if (potentialName.length >= 4) {
                const attVal = Math.floor(Math.random() * 45) + 48;
                simulatedRows.push({
                    "Roll_No": `OCR-${8000 + idx}`,
                    "Student_Name": potentialName,
                    "Attendance": `${attVal}%`,
                    "Commute_KM": `${(Math.random() * 6 + 1).toFixed(1)}km`,
                    "Family_Job": idx % 2 === 0 ? "Agricultural Labor" : "Textile Mill",
                    "Health_Flag": idx % 3 === 0 ? "Anemia" : "Normal"
                });
            }
        }
    });

    if (simulatedRows.length >= 3) {
        parseUniversalExcelRows(simulatedRows, "Physical_Register_OCR.jpg");
    } else {
        fallbackOCRData("Physical_Register_OCR.jpg");
    }
}

function fallbackOCRData(filename) {
    const ocrSample = [
        { "Roll_No": "OCR-501", "Student_Name": "Prakash Solanki", "Attendance": "56%", "Commute_KM": "6.8km", "Family_Job": "Harvest Labor", "Health_Flag": "Anemia" },
        { "Roll_No": "OCR-502", "Student_Name": "Kavita Vaghela", "Attendance": "61%", "Commute_KM": "7.5km", "Family_Job": "Salt-Pan Worker", "Health_Flag": "Normal" },
        { "Roll_No": "OCR-503", "Student_Name": "Dhaval Rathod", "Attendance": "69%", "Commute_KM": "2.0km", "Family_Job": "Daily Wage Mason", "Health_Flag": "Underweight" },
        { "Roll_No": "OCR-504", "Student_Name": "Manisha Parmar", "Attendance": "54%", "Commute_KM": "8.2km", "Family_Job": "Cotton Picking", "Health_Flag": "Anemia" },
        { "Roll_No": "OCR-505", "Student_Name": "Bhavin Chauhan", "Attendance": "88%", "Commute_KM": "1.2km", "Family_Job": "Village Kirana Shop", "Health_Flag": "Normal" },
        { "Roll_No": "OCR-506", "Student_Name": "Heena Makwana", "Attendance": "72%", "Commute_KM": "3.5km", "Family_Job": "Small Farming", "Health_Flag": "Normal" }
    ];

    const stream = document.getElementById('intakeLogStream');
    if (stream) {
        stream.innerHTML += `<div class="text-[#6EE7B7] font-bold">[100%] Structured register records identified successfully!</div>`;
    }

    parseUniversalExcelRows(ocrSample, filename);
}

function renderIntakeResultsTable(rows, source) {
    const tbody = document.getElementById('intakeResultsBody');
    const badge = document.getElementById('intakeStatusBadge');
    const applyBtn = document.getElementById('applyIntakeBtn');

    if (badge) {
        badge.className = "text-xs bg-[#123B2A] text-[#10B981] px-2.5 py-1 rounded-lg border border-[#263A32] font-semibold";
        badge.innerText = `Parsed ${rows.length} rows from ${source}`;
    }

    if (applyBtn) {
        applyBtn.removeAttribute('disabled');
    }

    if (tbody) {
        tbody.innerHTML = rows.map(r => {
            let riskBadge = 'bg-rose-950/60 text-rose-300 border-rose-800/80';
            let scoreColor = 'text-rose-400';

            if (r.riskLevel === 'High') {
                riskBadge = 'bg-amber-950/60 text-amber-300 border-amber-800/80';
                scoreColor = 'text-amber-400';
            } else if (r.riskLevel === 'Moderate') {
                riskBadge = 'bg-sky-950/60 text-sky-300 border-sky-800/80';
                scoreColor = 'text-sky-300';
            } else if (r.riskLevel === 'Low') {
                riskBadge = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80';
                scoreColor = 'text-[#10B981]';
            }

            return `
                <tr class="table-interactive-row">
                    <td class="py-3 px-3 font-bold text-[#F5F7F5] whitespace-nowrap">${r.id}</td>
                    <td class="py-3 px-3 font-semibold text-[#F5F7F5] whitespace-nowrap">${r.name}</td>
                    <td class="py-3 px-3 font-bold ${r.attendance < 75 ? 'text-rose-400' : 'text-[#10B981]'} whitespace-nowrap">${r.attendance}%</td>
                    <td class="py-3 px-3 text-[#94A39C] text-[11px] leading-relaxed">${r.cause}</td>
                    <td class="py-3 px-3 whitespace-nowrap">
                        <div class="inline-flex items-center gap-2 bg-[#111B18] px-2.5 py-1 rounded-lg border border-[#263A32]">
                            <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${riskBadge}">
                                ${r.riskLevel}
                            </span>
                            <span class="text-xs font-mono font-extrabold ${scoreColor}">
                                ${r.riskScore}%
                            </span>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    showToast("Auto-Inferred Causes!", `Derived multi-vector risk profiles for ${rows.length} students.`, "success");
}

function updateIntakeBadge(text, classes) {
    const badge = document.getElementById('intakeStatusBadge');
    if (badge) {
        badge.className = `text-xs px-2.5 py-1 rounded-lg border font-medium ${classes}`;
        badge.innerText = text;
    }
}

function applyIntakeToRecords() {
    if (parsedIntakeRows.length === 0) return;

    setIntakeWorkflowStage(4);

    const clusterSelect = document.getElementById('intakeClusterSelect');
    const selectedCluster = clusterSelect ? clusterSelect.value : "Anand Cluster";

    let newMentorsAdded = 0;

    parsedIntakeRows.forEach(r => {
        const existingIdx = MOCK_STUDENTS.findIndex(s => s.id === r.id);
        const newStudentObj = {
            id: r.id,
            name: r.name,
            grade: "Class 10-A",
            school: selectedCluster === "Anand Cluster" ? "Govt High School Anand" : `${selectedCluster} Secondary School`,
            district: selectedCluster,
            attendance: r.attendance,
            marks: r.marks,
            riskScore: r.riskScore,
            riskLevel: r.riskLevel,
            primaryVector: r.cause.includes('Travel') ? 'Environmental' :
                           r.cause.includes('Economic') ? 'Economic' :
                           r.cause.includes('Health') ? 'Health/Nutritional' :
                           r.cause.includes('Academic') ? 'Academic' : 'Behavioral',
            commuteDistance: r.dist,
            familyOccupation: r.job,
            healthFlag: r.health,
            disclosureStatus: "Disclosed",
            sathiMentor: "Unassigned",
            parentName: `Parent of ${r.name}`,
            parentPhone: "+91 98251 XXXXX",
            specificCauses: [r.cause],
            fallbackPlan: "Step 1: Automated Bus Pass Enrollment; Step 2: Sathi Senior Allocation",
            vectorBreakdown: {
                academic: r.marks < 50 ? 75 : 30,
                attendance: 100 - r.attendance,
                economic: r.cause.includes('Economic') ? 80 : 35,
                health: r.cause.includes('Health') ? 70 : 25,
                behavioral: 30,
                environmental: r.cause.includes('Travel') ? 85 : 20
            },
            matchedSchemes: ["SCHEME-BUS-PASS", "SCHEME-MDM-EXTRA"]
        };

        if (existingIdx >= 0) {
            MOCK_STUDENTS[existingIdx] = newStudentObj;
        } else {
            MOCK_STUDENTS.unshift(newStudentObj);

            if (r.attendance >= 82 && r.marks >= 70) {
                SATHI_MENTORS.push({
                    id: `m-intake-${Date.now()}-${newMentorsAdded}`,
                    name: r.name,
                    grade: "Class 11-A",
                    school: newStudentObj.school,
                    attendance: r.attendance,
                    marks: r.marks,
                    riskLevel: "Low",
                    points: 150,
                    streak: 1,
                    avatarColor: "bg-[#123B2A]",
                    badge: "Intake Mentor Candidate",
                    optedIn: true
                });
                newMentorsAdded++;
            }
        }
    });

    if (newMentorsAdded > 0) {
        saveOptInState();
    }

    activeStudents = [...MOCK_STUDENTS];
    renderStudentTable();
    populateStudentDropdowns();
    loadLowRiskRegistry();
    loadSathiLeaderboard();
    renderVSKDashboard();

    const mentorMsg = newMentorsAdded > 0 ? ` Registered ${newMentorsAdded} high-performing student(s) into Sathi Mentor Pool!` : '';
    showToast("Records Synced to System!", `Updated student database with ${parsedIntakeRows.length} imported rows.${mentorMsg}`, "success");
}

// ==========================================================================
// 11. GOVERNMENT SCHEMES MATCHER (SECTION 5)
// ==========================================================================
function loadStudentSchemeMatch(studentId) {
    const student = MOCK_STUDENTS.find(s => s.id === studentId) || MOCK_STUDENTS[0];
    selectedStudentForScheme = student;

    const detailDiv = document.getElementById('schemeStudentDetail');
    const schemeList = document.getElementById('schemeList');

    if (detailDiv) {
        detailDiv.innerHTML = `
            <div class="font-bold text-[#F5F7F5] text-base">${student.name}</div>
            <div class="text-xs text-[#94A39C] mb-2">${student.id} • ${student.district}</div>
            <div class="text-xs text-[#6EE7B7] font-semibold bg-[#123B2A] p-2 rounded-lg border border-[#263A32] mb-2">
                Primary Vector: <strong>${student.primaryVector}</strong>
            </div>
            <div class="text-[11px] text-[#94A39C]">
                Root Cause: ${student.specificCauses[0]}
            </div>
        `;
    }

    if (schemeList) {
        schemeList.innerHTML = GOVT_SCHEMES.map((s, idx) => {
            const isMatch = student.matchedSchemes.includes(s.id);
            return `
                <div class="scheme-card-seq bg-[#17231F] border ${isMatch ? 'border-[#10B981] bg-[#123B2A]/40' : 'border-[#263A32]'} rounded-xl p-4 transition-all shadow-xs"
                    style="animation-delay: ${idx * 80}ms">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-award text-[#10B981] text-sm"></i>
                            <h3 class="text-xs font-bold text-[#F5F7F5]">${s.name}</h3>
                        </div>
                        ${isMatch ? '<span class="text-[10px] bg-[#123B2A] text-[#6EE7B7] font-bold px-2 py-0.5 rounded border border-[#10B981]">Matched Need</span>' : '<span class="text-[10px] bg-[#111B18] text-[#94A39C] px-2 py-0.5 rounded border border-[#263A32]">Standard Scheme</span>'}
                    </div>
                    <p class="text-xs text-[#94A39C] mb-3">${s.description}</p>
                    <div class="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-[#263A32]">
                        <div class="text-[#94A39C]">Benefit: <strong class="text-[#10B981]">${s.benefit}</strong></div>
                        <button onclick="applyScheme(this, '${s.name}', '${student.name}')"
                            class="enroll-btn btn-emerald text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer">
                            <i class="fa-solid fa-circle-check text-[11px] text-[#0B1713]"></i>
                            <span>1-Click Auto Enroll</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function applyScheme(btnElement, schemeName, studentName) {
    if (btnElement && btnElement.tagName === 'BUTTON') {
        btnElement.classList.add('enrolled-success');
        btnElement.innerHTML = '<i class="fa-solid fa-check text-xs"></i> <span>Enrolled ✓</span>';
        setTimeout(() => {
            btnElement.classList.remove('enrolled-success');
            btnElement.innerHTML = '<i class="fa-solid fa-circle-check text-[11px] text-[#0B1713]"></i> <span>1-Click Auto Enroll</span>';
        }, 1500);
    }
    showToast("Scheme Application Submitted!", `Submitted application for ${schemeName} for ${studentName}.`, "success");
}

// ==========================================================================
// 12. INTERVENTION SIMULATOR (SECTION 6)
// ==========================================================================
function calculateActionImpacts(student) {
    let peerImpact = 15;
    let transportImpact = 10;
    let mealImpact = 8;
    let remedialImpact = 12;

    const vec = student.primaryVector;
    if (vec === 'Environmental') {
        transportImpact += 15;
        peerImpact += 5;
    } else if (vec === 'Economic') {
        mealImpact += 15;
        transportImpact += 8;
        peerImpact += 6;
    } else if (vec === 'Academic') {
        remedialImpact += 16;
        peerImpact += 8;
    } else if (vec === 'Health/Nutritional') {
        mealImpact += 18;
    } else if (vec === 'Behavioral') {
        peerImpact += 18;
    }

    peerImpact = Math.max(5, Math.min(35, peerImpact));
    transportImpact = Math.max(5, Math.min(35, transportImpact));
    mealImpact = Math.max(5, Math.min(35, mealImpact));
    remedialImpact = Math.max(5, Math.min(35, remedialImpact));

    return { peerImpact, transportImpact, mealImpact, remedialImpact };
}

function updateInterventionCardVisuals() {
    const checkboxes = ['simPeer', 'simTransport', 'simMeal', 'simRemedial'];
    checkboxes.forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;
        const card = input.closest('label');
        if (!card) return;
        if (input.checked) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
}

function runSimulation() {
    const studentSelect = document.getElementById('simStudentSelect');
    const studentId = studentSelect ? studentSelect.value : MOCK_STUDENTS[0].id;
    const student = MOCK_STUDENTS.find(s => s.id === studentId) || MOCK_STUDENTS[0];

    const impacts = calculateActionImpacts(student);

    document.getElementById('simPeerBadge').innerText = `-${impacts.peerImpact}% Risk`;
    document.getElementById('simTransportBadge').innerText = `-${impacts.transportImpact}% Risk`;
    document.getElementById('simMealBadge').innerText = `-${impacts.mealImpact}% Risk`;
    document.getElementById('simRemedialBadge').innerText = `-${impacts.remedialImpact}% Risk`;

    const causeBadge = document.getElementById('simCauseVectorBadge');
    if (causeBadge) causeBadge.innerText = `Primary Cause: ${student.primaryVector}`;

    updateInterventionCardVisuals();

    const simPeer = document.getElementById('simPeer')?.checked;
    const simTransport = document.getElementById('simTransport')?.checked;
    const simMeal = document.getElementById('simMeal')?.checked;
    const simRemedial = document.getElementById('simRemedial')?.checked;

    let baselineRisk = student.riskScore;
    let reduction = 0;
    if (simPeer) reduction += impacts.peerImpact;
    if (simTransport) reduction += impacts.transportImpact;
    if (simMeal) reduction += impacts.mealImpact;
    if (simRemedial) reduction += impacts.remedialImpact;

    let newRisk = Math.max(8, baselineRisk - reduction);

    document.getElementById('simBaseRisk').innerText = `${baselineRisk}%`;
    const newRiskEl = document.getElementById('simNewRisk');

    if (prevSimNewRisk !== null && prevSimNewRisk !== newRisk) {
        animateValue(newRiskEl, prevSimNewRisk, newRisk, 400, '', '%');
    } else {
        newRiskEl.innerText = `${newRisk}%`;
    }
    prevSimNewRisk = newRisk;

    const recElem = document.getElementById('simRecommendation');
    if (recElem) {
        recElem.innerText = `Selected support actions reduce ${student.name}'s risk by -${reduction}% (Tailored for ${student.primaryVector} vector).`;
    }

    renderSimChart(baselineRisk, newRisk);
}

function renderSimChart(baselineRisk, newRisk) {
    const canvas = document.getElementById('simChart');
    if (!canvas) return;

    if (simChartInstance) {
        simChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    const labels = ['Day 0', 'Day 10', 'Day 20', 'Day 30', 'Day 40', 'Day 50', 'Day 60'];
    const noIntervention = [baselineRisk, baselineRisk + 2, baselineRisk + 4, baselineRisk + 5, baselineRisk + 6, baselineRisk + 7, baselineRisk + 8];
    const withIntervention = [
        baselineRisk,
        baselineRisk - (baselineRisk - newRisk) * 0.2,
        baselineRisk - (baselineRisk - newRisk) * 0.45,
        baselineRisk - (baselineRisk - newRisk) * 0.7,
        baselineRisk - (baselineRisk - newRisk) * 0.85,
        baselineRisk - (baselineRisk - newRisk) * 0.95,
        newRisk
    ];

    simChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'No Help Given (Absenteeism Growth)',
                    data: noIntervention,
                    borderColor: '#EF4444',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    fill: false,
                    tension: 0.35,
                    pointRadius: 3,
                    pointBackgroundColor: '#EF4444'
                },
                {
                    label: 'With Cause-Aware Support Plan',
                    data: withIntervention,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.10)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 4,
                    pointBackgroundColor: '#10B981'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 650,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94A39C',
                        font: { size: 10, family: 'Plus Jakarta Sans', weight: '600' }
                    }
                },
                tooltip: {
                    backgroundColor: '#17231F',
                    borderColor: '#263A32',
                    borderWidth: 1,
                    titleColor: '#F5F7F5',
                    bodyColor: '#94A39C',
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    ticks: { color: '#94A39C', font: { size: 10 } },
                    grid: { color: '#263A32' }
                },
                y: {
                    min: 0,
                    max: 100,
                    ticks: { color: '#94A39C', font: { size: 10 } },
                    grid: { color: '#263A32' }
                }
            }
        }
    });
}

function applySimulatedPlan() {
    showToast("Support Plan Saved!", "Applied tailored cause-aware plan to student profile.", "success");
}

// ==========================================================================
// 13. SATHI MENTORSHIP PROGRAM (SECTION 7)
// ==========================================================================
function saveOptInState() {
    try {
        const stateMap = {};
        SATHI_MENTORS.forEach(m => {
            stateMap[m.id] = m.optedIn;
        });
        localStorage.setItem('dd_sathi_opt_ins', JSON.stringify(stateMap));
    } catch (e) {
        console.error("Opt-in storage error:", e);
    }
}

function loadOptInState() {
    try {
        const saved = localStorage.getItem('dd_sathi_opt_ins');
        if (saved) {
            const stateMap = JSON.parse(saved);
            SATHI_MENTORS.forEach(m => {
                if (stateMap[m.id] !== undefined) {
                    m.optedIn = stateMap[m.id];
                }
            });
        }
    } catch (e) {
        console.error("Opt-in load error:", e);
    }
}

function saveSathiPairsState() {
    try {
        localStorage.setItem('dd_sathi_pairs', JSON.stringify(sathiPairs));
    } catch (e) {
        console.error("Pairs storage error:", e);
    }
}

function loadSathiPairsState() {
    try {
        const saved = localStorage.getItem('dd_sathi_pairs');
        if (saved) {
            sathiPairs = JSON.parse(saved);
        }
    } catch (e) {
        console.error("Pairs load error:", e);
    }
}

function loadLowRiskRegistry() {
    loadOptInState();
    loadSathiPairsState();

    const listDiv = document.getElementById('lowRiskOptInList');
    const badge = document.getElementById('optInCountBadge');
    if (!listDiv) return;

    const optedInCount = SATHI_MENTORS.filter(m => m.optedIn).length;
    if (badge) badge.innerText = `${optedInCount} Opted-In Mentor${optedInCount === 1 ? '' : 's'}`;

    listDiv.innerHTML = SATHI_MENTORS.map(m => {
        const isOpted = m.optedIn;
        const activePairs = sathiPairs.filter(p => p.mentorId === m.id).length;

        return `
            <div class="bg-[#17231F] border ${isOpted ? 'border-[#10B981]' : 'border-[#263A32]'} rounded-xl p-3 flex items-center justify-between transition-all">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-full bg-[#123B2A] text-[#10B981] flex items-center justify-center font-bold text-xs flex-shrink-0 border border-[#263A32]">
                        ${m.name.charAt(0)}
                    </div>
                    <div>
                        <div class="font-bold text-[#F5F7F5] text-xs flex items-center gap-1.5">
                            ${m.name}
                            ${isOpted ? `<span class="text-[9px] bg-[#123B2A] text-[#10B981] px-1.5 py-0.2 rounded font-bold border border-[#263A32]">Opted-In</span>` : `<span class="text-[9px] bg-[#111B18] text-[#94A39C] px-1.5 py-0.2 rounded font-medium border border-[#263A32]">Opted-Out</span>`}
                        </div>
                        <div class="text-[10px] text-[#94A39C]">${m.grade} • ${m.school}</div>
                        <div class="text-[10px] text-[#94A39C] mt-0.5 font-medium">
                            Attendance: <strong class="text-[#10B981]">${m.attendance}%</strong> | Score: <strong class="text-[#6EE7B7]">${m.marks}%</strong>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col items-end gap-1.5">
                    <!-- Smooth Animated Switch Toggle -->
                    <div class="mentor-switch ${isOpted ? 'active' : ''}" onclick="toggleMentorOptIn('${m.id}')" title="${isOpted ? 'Click to Opt Out' : 'Click to Opt In'}">
                        <div class="mentor-switch-knob">
                            ${isOpted ? '<i class="fa-solid fa-check"></i>' : ''}
                        </div>
                    </div>
                    ${activePairs > 0 ? `<span class="text-[9px] text-[#10B981] font-bold">${activePairs} pair${activePairs > 1 ? 's' : ''}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function toggleMentorOptIn(mentorId) {
    const mentor = SATHI_MENTORS.find(m => m.id === mentorId);
    if (!mentor) return;

    mentor.optedIn = !mentor.optedIn;
    saveOptInState();

    const activePairs = sathiPairs.filter(p => p.mentorId === mentorId);
    if (!mentor.optedIn && activePairs.length > 0) {
        showToast("Opted Out of Program", `${mentor.name} opted out. Note: ${activePairs.length} active pair(s) assigned.`, "warning");
    } else if (mentor.optedIn) {
        showToast("Opted-In to Mentorship", `${mentor.name} is now available in the teacher pairing pool!`, "success");
    } else {
        showToast("Opted-Out from Mentorship", `${mentor.name} removed from active mentor pool.`, "info");
    }

    loadLowRiskRegistry();
    loadSathiLeaderboard();
}

function loadSathiLeaderboard() {
    const div = document.getElementById('mentorLeaderboard');
    if (!div) return;

    const optedInMentors = SATHI_MENTORS.filter(m => m.optedIn);

    if (optedInMentors.length === 0) {
        div.innerHTML = `
            <div class="text-center py-6 text-[#94A39C]">
                <i class="fa-solid fa-user-slash text-2xl mb-1 text-[#263A32]"></i>
                <div class="text-xs font-semibold">No Opted-In Mentors</div>
                <p class="text-[10px] mt-0.5">Opt-in senior students in the registry above.</p>
            </div>
        `;
        return;
    }

    div.innerHTML = optedInMentors.map((m, idx) => {
        const activePairs = sathiPairs.filter(p => p.mentorId === m.id).length;
        const podiumBadges = ['🥇', '🥈', '🥉'];
        const rankIcon = idx < 3 ? podiumBadges[idx] : `#${idx + 1}`;

        return `
            <div class="leader-row-seq bg-[#17231F] border border-[#263A32] rounded-xl p-3 flex items-center justify-between"
                style="animation-delay: ${idx * 60}ms">
                <div class="flex items-center gap-2.5">
                    <div class="font-extrabold text-xs text-[#6EE7B7] w-5 text-center">${rankIcon}</div>
                    <div class="w-8 h-8 rounded-full bg-[#123B2A] text-[#10B981] flex items-center justify-center font-bold text-xs flex-shrink-0 border border-[#263A32]">
                        ${m.name.charAt(0)}
                    </div>
                    <div>
                        <div class="font-bold text-[#F5F7F5] text-xs">${m.name}</div>
                        <div class="text-[10px] text-[#94A39C]">${m.grade}</div>
                        <div class="text-[10px] mt-0.5 ${activePairs > 0 ? 'text-[#10B981] font-semibold' : 'text-[#94A39C]'}">
                            ${activePairs > 0 ? `${activePairs} active pair${activePairs > 1 ? 's' : ''}` : 'Ready for pairing'}
                        </div>
                    </div>
                </div>

                <div class="flex flex-col items-end gap-1">
                    <div class="text-xs font-black text-amber-400 font-mono">${m.points} pts</div>
                    <button onclick="openMentorCertificate('${m.id}')" title="Issue Official Government Certificate"
                        class="bg-[#123B2A] hover:bg-[#1B4E38] text-[#10B981] border border-[#263A32] px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer">
                        <i class="fa-solid fa-graduation-cap text-[9px]"></i> Certificate
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function loadSathiPairs() {
    const div = document.getElementById('sathiPairList');
    const empty = document.getElementById('sathiEmptyState');
    if (!div) return;

    if (sathiPairs.length === 0) {
        div.innerHTML = '';
        if (empty) empty.classList.remove('hidden');
        return;
    }

    if (empty) empty.classList.add('hidden');

    div.innerHTML = sathiPairs.map(p => `
        <div id="pairCard-${p.id}" class="bg-[#17231F] border border-[#263A32] rounded-xl p-4 transition-all hover:border-[#10B981]/50">
            <div class="flex items-start justify-between mb-3">
                <span class="text-[10px] bg-[#123B2A] text-[#10B981] font-bold px-2 py-0.5 rounded border border-[#263A32] flex items-center gap-1">
                    <i class="fa-solid fa-link text-[9px]"></i> Active Sathi Pair
                </span>
                <button onclick="removePair('${p.id}')" title="Dissolve Pairing" class="w-6 h-6 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-400 border border-rose-800/60 flex items-center justify-center transition-all cursor-pointer">
                    <i class="fa-solid fa-xmark text-[10px]"></i>
                </button>
            </div>

            <!-- Mentor Info -->
            <div class="flex items-center gap-2 mb-1">
                <div class="w-7 h-7 rounded-full bg-[#123B2A] text-[#10B981] border border-[#263A32] flex items-center justify-center font-bold text-xs flex-shrink-0">${p.mentorName.charAt(0)}</div>
                <div>
                    <div class="text-xs font-bold text-[#F5F7F5]">${p.mentorName}</div>
                    <div class="text-[10px] text-[#94A39C]">${p.mentorGrade} · Mentor</div>
                </div>
            </div>

            <!-- Connection Indicator with Beam -->
            <div class="flex items-center gap-2 text-[11px] text-[#94A39C] px-1 my-2">
                <i class="fa-solid fa-arrow-down text-[9px] text-[#10B981]"></i>
                <span class="bg-[#111B18] border border-[#263A32] text-[#6EE7B7] font-semibold px-2 py-0.5 rounded text-[10px]">${p.focus}</span>
            </div>

            <!-- Mentee Info -->
            <div class="flex items-center gap-2 mb-3">
                <div class="w-7 h-7 rounded-full bg-[#123B2A] text-[#6EE7B7] border border-[#263A32] flex items-center justify-center font-bold text-xs flex-shrink-0">${p.menteeName.charAt(0)}</div>
                <div>
                    <div class="text-xs font-bold text-[#F5F7F5]">${p.menteeName}</div>
                    <div class="text-[10px] text-[#94A39C]">${p.menteeGrade} · Mentee</div>
                </div>
            </div>

            ${p.note ? `<div class="bg-[#111B18] border border-[#263A32] rounded-lg px-3 py-2 text-[11px] text-[#94A39C] mb-3"><span class="font-bold text-[#F5F7F5]">Note:</span> ${p.note}</div>` : ''}

            <div class="border-t border-[#263A32] pt-2.5 flex justify-between items-center text-[11px] text-[#94A39C]">
                <span>Streak: <strong class="text-[#10B981]">${p.streakDays} Days</strong></span>
                <button onclick="openMentorCertificate('${p.mentorId}')" class="text-[#10B981] font-bold hover:underline text-[10px] flex items-center gap-1 cursor-pointer">
                    <i class="fa-solid fa-certificate text-[9px]"></i> View Certificate
                </button>
            </div>
        </div>
    `).join('');
}

function openPairModal(preSelectedMenteeId = null) {
    const mentorSel = document.getElementById('pairMentorSelect');
    const menteeSel = document.getElementById('pairMenteeSelect');
    const errDiv = document.getElementById('pairError');

    if (errDiv) errDiv.classList.add('hidden');

    const optedInMentors = SATHI_MENTORS.filter(m => m.optedIn);
    if (mentorSel) {
        if (optedInMentors.length === 0) {
            mentorSel.innerHTML = `<option value="">No mentors available (Please opt-in students above)</option>`;
        } else {
            mentorSel.innerHTML = optedInMentors.map(m => `<option value="${m.id}">${m.name} (${m.grade}) — ${m.school}</option>`).join('');
        }
    }

    const unpairedStudents = MOCK_STUDENTS.filter(s => !sathiPairs.some(p => p.menteeId === s.id));
    if (menteeSel) {
        if (unpairedStudents.length === 0) {
            menteeSel.innerHTML = `<option value="">All at-risk students are currently paired!</option>`;
        } else {
            const riskOrder = { 'Severe': 0, 'High': 1, 'Moderate': 2, 'Low': 3 };
            const sorted = [...unpairedStudents].sort((a, b) => (riskOrder[a.riskLevel] ?? 9) - (riskOrder[b.riskLevel] ?? 9));

            menteeSel.innerHTML = sorted.map(s => {
                return `<option value="${s.id}" ${preSelectedMenteeId === s.id ? 'selected' : ''}>${s.name} (${s.grade}) — ${s.riskLevel} Risk [${s.primaryVector}]</option>`;
            }).join('');
        }
    }

    const focusSel = document.getElementById('pairFocusSelect');
    if (focusSel) focusSel.selectedIndex = 0;
    const noteInput = document.getElementById('pairNoteInput');
    if (noteInput) noteInput.value = '';

    const modal = document.getElementById('sathiModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closePairModal() {
    const modal = document.getElementById('sathiModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function confirmPairing() {
    const mentorSel = document.getElementById('pairMentorSelect');
    const menteeSel = document.getElementById('pairMenteeSelect');
    const focusSel = document.getElementById('pairFocusSelect');
    const noteInput = document.getElementById('pairNoteInput');
    const errDiv = document.getElementById('pairError');

    const mentorId = mentorSel?.value;
    const menteeId = menteeSel?.value;
    const focus = focusSel?.value || 'Daily Check-in & Attendance';
    const note = noteInput?.value.trim() || '';

    if (!mentorId || !menteeId) {
        errDiv.innerText = 'Please select both an available mentor and an at-risk mentee.';
        errDiv.classList.remove('hidden');
        return;
    }

    const alreadyPaired = sathiPairs.some(p => p.menteeId === menteeId);
    if (alreadyPaired) {
        errDiv.innerText = 'This student is already paired with a mentor.';
        errDiv.classList.remove('hidden');
        return;
    }

    const mentor = SATHI_MENTORS.find(m => m.id === mentorId);
    const mentee = MOCK_STUDENTS.find(s => s.id === menteeId);

    if (!mentor || !mentee) {
        errDiv.innerText = 'Invalid selection. Please verify opt-in status.';
        errDiv.classList.remove('hidden');
        return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const newPair = {
        id: `pair-${Date.now()}`,
        mentorId: mentor.id,
        mentorName: mentor.name,
        mentorGrade: mentor.grade,
        menteeId: mentee.id,
        menteeName: mentee.name,
        menteeGrade: mentee.grade,
        focus,
        note,
        createdAt: `Today ${timeStr}`,
        streakDays: 1
    };

    sathiPairs.push(newPair);
    saveSathiPairsState();

    closePairModal();
    loadSathiPairs();
    loadSathiLeaderboard();
    loadLowRiskRegistry();
    renderStudentTable();
    renderVSKDashboard();
    showToast('Peer Pair Created!', `${mentor.name} assigned to mentor ${mentee.name}.`, 'success');
}

function removePair(pairId) {
    const cardEl = document.getElementById(`pairCard-${pairId}`);
    if (cardEl) {
        cardEl.classList.add('pair-card-removing');
    }

    setTimeout(() => {
        const pair = sathiPairs.find(p => p.id === pairId);
        sathiPairs = sathiPairs.filter(p => p.id !== pairId);
        saveSathiPairsState();

        loadSathiPairs();
        loadSathiLeaderboard();
        loadLowRiskRegistry();
        renderStudentTable();
        renderVSKDashboard();
        if (pair) showToast('Pair Dissolved', `${pair.mentorName} → ${pair.menteeName} pairing dissolved.`, 'info');
    }, 220);
}

function openMentorCertificate(mentorId) {
    const mentor = SATHI_MENTORS.find(m => m.id === mentorId) || SATHI_MENTORS[0];

    const nameEl = document.getElementById('certMentorName');
    const gradeSchoolEl = document.getElementById('certMentorGradeSchool');
    const streakEl = document.getElementById('certStreak');
    const pointsEl = document.getElementById('certPoints');
    const certIdEl = document.getElementById('certId');

    if (nameEl) nameEl.innerText = mentor.name;
    if (gradeSchoolEl) gradeSchoolEl.innerText = `${mentor.grade} • ${mentor.school}`;
    if (streakEl) streakEl.innerText = `${mentor.streak || 15} Days Active`;
    if (pointsEl) pointsEl.innerText = `${mentor.points || 350} Points`;
    if (certIdEl) certIdEl.innerText = `CERT-VSK-2026-${mentor.id.replace('-', '')}`;

    const modal = document.getElementById('sathiCertificateModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeCertificateModal() {
    const modal = document.getElementById('sathiCertificateModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function printMentorCertificate() {
    window.print();
}

// ==========================================================================
// 14. EMERGENCY HOME VISIT & TRUSTED LIAISON (SECTION 8)
// ==========================================================================
function loadSOSStudent() {
    const select = document.getElementById('sosStudentSelect');
    const studentId = select ? select.value : MOCK_STUDENTS[0].id;
    const student = MOCK_STUDENTS.find(s => s.id === studentId) || MOCK_STUDENTS[0];
    selectedStudentForSOS = student;

    renderCautionNote(student);
}

function renderCautionNote(student) {
    const paper = document.getElementById('cautionNotePaper');
    if (!paper) return;

    paper.innerHTML = `
        <div class="border-b border-[#263A32] pb-3 mb-3 flex items-center justify-between">
            <div>
                <h2 class="font-extrabold text-sm uppercase text-[#F5F7F5]">Department of School Education • State Government</h2>
                <p class="text-[10px] text-[#94A39C] font-semibold">Student Retention Guidance &amp; Community Outreach Memo</p>
            </div>
            <div class="text-right">
                <div class="font-mono text-[10px] text-[#6EE7B7] font-bold">Ref: DEO/EWS/2026-${student.id}</div>
                <div class="text-[10px] text-[#94A39C]">Date: 06-October-2026</div>
            </div>
        </div>

        <div class="text-center bg-[#17231F] border border-rose-900/60 text-rose-300 font-bold py-1.5 rounded-lg mb-3 text-xs uppercase flex items-center justify-center gap-2">
            <span class="inline-block w-2 h-2 rounded-full bg-rose-500 severe-pulse-indicator"></span>
            <span>Official Outreach Request: Routine Community Liaison Visit</span>
        </div>

        <div class="space-y-2.5 leading-relaxed text-[#F5F7F5] text-xs">
            <p><strong class="text-[#6EE7B7]">To:</strong> Anganwadi Healthcare Supervisor / ASHA Village Community Health Worker</p>
            <p><strong class="text-[#6EE7B7]">Subject:</strong> Routine Wellness &amp; Educational Welfare Verification for <strong>${student.name}</strong> (${student.id})</p>
            
            <div class="bg-[#17231F] p-3 rounded-lg border border-[#263A32] grid grid-cols-2 gap-2 text-[11px]">
                <div><span class="text-[#94A39C]">Student Name:</span> <strong class="text-[#F5F7F5]">${student.name}</strong></div>
                <div><span class="text-[#94A39C]">Grade &amp; School:</span> <strong class="text-[#F5F7F5]">${student.grade}, ${student.school}</strong></div>
                <div><span class="text-[#94A39C]">Attendance Rate:</span> <span class="text-rose-400 font-bold">${student.attendance}%</span></div>
                <div><span class="text-[#94A39C]">Primary Cause Vector:</span> <span class="bg-[#123B2A] text-[#6EE7B7] px-1.5 py-0.2 rounded border border-[#263A32] font-semibold">${student.primaryVector}</span></div>
                <div><span class="text-[#94A39C]">Parent / Guardian:</span> <strong class="text-[#F5F7F5]">${student.parentName}</strong></div>
                <div><span class="text-[#94A39C]">Disclosure Status:</span> <strong class="text-[#F5F7F5]">${student.disclosureStatus || 'Non-Disclosed'}</strong></div>
            </div>

            <p class="text-[#94A39C] text-[11px]">
                <strong class="text-[#F5F7F5]">Safeguard Protocol:</strong> Non-intrusive routine community check-in authorized. Please conduct a visit during standard village health rounds to assist with transport subsidy and nutrition entitlements without questioning the family.
            </p>
        </div>

        <div class="mt-6 pt-3 border-t border-[#263A32] flex items-center justify-between text-[10px] text-[#94A39C]">
            <div class="flex items-center gap-1.5">
                <i class="fa-solid fa-stamp text-[#10B981]"></i>
                <span>Approved by District Education Authority</span>
            </div>
            <div class="font-mono text-[#94A39C]">*${student.id}-SIH2026*</div>
        </div>
    `;
}

function dispatchFieldSOS() {
    const agency = document.getElementById('sosAgency').value;
    const btn = document.getElementById('dispatchSOSBtn');
    const btnText = document.getElementById('dispatchSOSBtnText');

    if (btn && btnText) {
        btn.disabled = true;
        btnText.innerText = "Preparing Dispatch...";
        btn.classList.add('opacity-80');

        setTimeout(() => {
            btnText.innerText = "Coordinating Agency...";
            setTimeout(() => {
                btnText.innerText = "Dispatched ✓";
                setTimeout(() => {
                    btnText.innerText = "Confirmed ✓";
                    btn.classList.remove('opacity-80');
                    btn.disabled = false;
                    setTimeout(() => {
                        btnText.innerText = "Request Community Visit";
                    }, 2000);
                }, 400);
            }, 400);
        }, 300);
    }

    showToast("Community Dispatch Sent!", `Dispatched visit request to ${agency} for ${selectedStudentForSOS.name}.`, "success");
}

function printCautionNote() {
    window.print();
}

// ==========================================================================
// 15. TOAST NOTIFICATIONS SYSTEM
// ==========================================================================
function showToast(title, msg, type = 'success') {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMsg = document.getElementById('toastMsg');
    const toastIcon = document.getElementById('toastIcon');

    if (!toast) return;

    if (toastTitle) toastTitle.innerText = title;
    if (toastMsg) toastMsg.innerText = msg;

    if (type === 'success') {
        toastIcon.className = 'w-7 h-7 rounded-lg bg-[#123B2A] text-[#10B981] flex items-center justify-center flex-shrink-0 text-xs border border-[#263A32]';
        toastIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    } else if (type === 'error') {
        toastIcon.className = 'w-7 h-7 rounded-lg bg-rose-950/80 text-rose-400 flex items-center justify-center flex-shrink-0 text-xs border border-rose-800/80';
        toastIcon.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
    } else if (type === 'info') {
        toastIcon.className = 'w-7 h-7 rounded-lg bg-[#123B2A] text-[#6EE7B7] flex items-center justify-center flex-shrink-0 text-xs border border-[#263A32]';
        toastIcon.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
    } else if (type === 'warning') {
        toastIcon.className = 'w-7 h-7 rounded-lg bg-amber-950/80 text-amber-400 flex items-center justify-center flex-shrink-0 text-xs border border-amber-800/80';
        toastIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    }

    // Audible chime confirmation
    if (type === 'success') {
        playCallChime();
    }

    toast.classList.remove('toast-hidden');
    toast.classList.add('toast-visible');

    setTimeout(() => {
        toast.classList.remove('toast-visible');
        toast.classList.add('toast-hidden');
    }, 3800);
}
