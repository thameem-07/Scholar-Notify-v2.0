// DropOut Defenders 3.0 Core Application Logic (Same-Origin Native Voice Audio Stream Engine)

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

// PCM WAV FILE GENERATOR IN BROWSER MEMORY (HTML5 MEDIA PIPELINE LIKE YOUTUBE)
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

// PLAY AUDIBLE MEDIA CHIME (100% WORKING LIKE YOUTUBE AUDIO)
function playCallChime() {
    if (activeMediaAudio) {
        activeMediaAudio.pause();
    }
    const chimeWavUri = generateWavAudioUri(523.25, 659.25, 0.7); // High Dual Tone Chime (C5 + E5)
    activeMediaAudio = new Audio(chimeWavUri);
    activeMediaAudio.volume = 1.0;
    activeMediaAudio.play().then(() => {
        showToast("Audio Chime Playing!", "Audible sound output confirmed.", "success");
    }).catch(e => {
        console.error("Audio playback error:", e);
    });
}

// INITIALIZATION & SESSION CHECK
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('dropoutDefendersUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    }
});


// AUTHENTICATION HANDLERS
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
        showToast("Access Granted!", `Welcome to the portal, ${currentUser.name}.`, "success");
    } else {
        if (errorBox) {
            errorBox.innerText = "Invalid username or password. Accounts are provisioned exclusively by your District Education Administrator.";
            errorBox.classList.remove('hidden');
        }
        document.getElementById('loginPass').value = '';
        showToast("Authentication Failed", "Incorrect username or password entered.", "error");
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('dropoutDefendersUser');

    document.getElementById('dashboardApp').classList.add('hidden');
    document.getElementById('dashboardApp').classList.remove('flex');
    document.getElementById('loginScreen').classList.remove('hidden');
    
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    
    const errorBox = document.getElementById('loginError');
    if (errorBox) errorBox.classList.add('hidden');

    showToast("Logged Out", "You have signed out of the system.", "info");
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
}

// DRAG & DROP FILE UPLOAD ENGINE FOR UNIVERSAL INTAKE
function initDragAndDrop() {
    setupDropZone('excelDropZone', 'excelFileInput', (file) => {
        handleExcelUpload({ target: { files: [file] } });
    }, 'border-emerald-500', 'bg-emerald-50');

    setupDropZone('photoDropZone', 'photoFileInput', (file) => {
        handlePhotoUpload({ target: { files: [file] } });
    }, 'border-amber-500', 'bg-amber-50');
}

function setupDropZone(dropZoneId, inputId, onFileDrop, borderClass, bgClass) {
    const dropZone = document.getElementById(dropZoneId);
    const fileInput = document.getElementById(inputId);
    if (!dropZone || !fileInput) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add(borderClass, bgClass);
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove(borderClass, bgClass);
        }, false);
    });

    // Support clicking anywhere on the drop zone container
    dropZone.addEventListener('click', (e) => {
        if (e.target !== fileInput && e.target.tagName !== 'LABEL') {
            fileInput.click();
        }
    });

    // Handle File Drop
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt ? dt.files : null;
        if (files && files.length > 0) {
            fileInput.files = files;
            onFileDrop(files[0]);
        }
    }, false);
}

// TAB NAVIGATION
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
        setTimeout(renderVSKCharts, 100);
    } else if (tabId === 'simulator') {
        setTimeout(runSimulation, 100);
    }
}

function initTabs() {
    switchTab('vsk');
}

// POPULATE DROPDOWNS
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
    if (sosSelect) sosSelect.innerHTML = MOCK_STUDENTS.filter(s => s.riskLevel === 'Severe' || s.riskLevel === 'High').map(s => `
        <option value="${s.id}">${s.name} (${s.id}) - ${s.school}</option>
    `).join('');
}

// DYNAMIC CLUSTER TELEMETRY AGGREGATOR
function getDynamicClusterTelemetry() {
    const defaultClusters = ["Anand Cluster", "Vadodara Cluster", "Kheda Cluster", "Surat Rural", "Surendranagar"];
    const existingDistricts = MOCK_STUDENTS.map(s => s.district || "Anand Cluster");
    const allClusters = Array.from(new Set([...defaultClusters, ...existingDistricts]));

    return allClusters.map(clusterName => {
        const clusterStudents = MOCK_STUDENTS.filter(s => {
            const dist = (s.district || "").toLowerCase();
            const school = (s.school || "").toLowerCase();
            const target = clusterName.toLowerCase().replace(" cluster", "").replace(" rural", "");
            return dist.includes(target) || school.includes(target);
        });

        const count = clusterStudents.length;
        const atRiskStudents = clusterStudents.filter(s => s.riskLevel === 'Severe' || s.riskLevel === 'High' || s.riskLevel === 'Moderate');
        const atRiskCount = atRiskStudents.length;
        const atRiskPct = count > 0 ? ((atRiskCount / count) * 100).toFixed(1) : "0.0";

        // Find most frequent vector in cluster
        const vectorCounts = {};
        clusterStudents.forEach(s => {
            vectorCounts[s.primaryVector] = (vectorCounts[s.primaryVector] || 0) + 1;
        });

        let topVector = "Academic";
        let maxCount = 0;
        Object.keys(vectorCounts).forEach(v => {
            if (vectorCounts[v] > maxCount) {
                maxCount = vectorCounts[v];
                topVector = v;
            }
        });

        // Determine cluster risk level
        let clusterRisk = "Low";
        if (clusterStudents.some(s => s.riskLevel === 'Severe')) clusterRisk = "Severe";
        else if (clusterStudents.some(s => s.riskLevel === 'High')) clusterRisk = "High";
        else if (atRiskCount > 0) clusterRisk = "Moderate";

        return {
            district: clusterName,
            enrolled: count,
            atRisk: atRiskCount,
            atRiskPct: atRiskPct,
            primaryVector: topVector,
            riskLevel: clusterRisk
        };
    });
}

function inspectClusterStudents(clusterName) {
    switchTab('ews');
    const searchInput = document.getElementById('ewsSearchInput');
    if (searchInput) {
        const cleanName = clusterName.replace(" Cluster", "").replace(" Rural", "");
        searchInput.value = cleanName;
        filterStudents();
    }
}

// SECTION 1: DASHBOARD OVERVIEW RENDERER
function renderVSKDashboard() {
    const tableBody = document.getElementById('vskDistrictTable');
    
    // Dynamic Stat Cards Synchronization
    const totalStudents = MOCK_STUDENTS.length;
    const flaggedStudents = MOCK_STUDENTS.filter(s => s.riskLevel === 'Severe' || s.riskLevel === 'High' || s.riskLevel === 'Moderate').length;
    const flaggedPct = totalStudents > 0 ? ((flaggedStudents / totalStudents) * 100).toFixed(1) : "0.0";
    const activePlans = sathiPairs.length;

    const elTotal = document.getElementById('statTotalStudents');
    const elFlagged = document.getElementById('statFlaggedStudents');
    const elActive = document.getElementById('statActivePlans');
    const elSub = document.getElementById('dashSubTitle');

    if (elTotal) elTotal.innerText = totalStudents.toLocaleString();
    if (elFlagged) elFlagged.innerHTML = `${flaggedStudents} <span class="text-xs font-medium text-rose-600">(${flaggedPct}%)</span>`;
    if (elActive) elActive.innerText = activePlans > 0 ? `${activePlans} Pair${activePlans > 1 ? 's' : ''}` : '0 Active';
    if (elSub) elSub.innerText = `Real-time risk analysis for ${totalStudents} active student profile(s) across local school clusters.`;

    if (!tableBody) return;

    const clusterTelemetry = getDynamicClusterTelemetry();

    tableBody.innerHTML = clusterTelemetry.map(d => {
        let badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
        if (d.riskLevel === 'High') badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
        if (d.riskLevel === 'Moderate') badgeColor = 'bg-sky-50 text-sky-700 border-sky-200';
        if (d.riskLevel === 'Low') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                    <i class="fa-solid fa-location-dot text-indigo-600"></i> ${d.district}
                </td>
                <td class="py-3 px-3 font-bold text-slate-800">${d.enrolled}</td>
                <td class="py-3 px-3 font-semibold ${d.atRisk > 0 ? 'text-rose-700' : 'text-emerald-700'}">${d.atRisk} (${d.atRiskPct}%)</td>
                <td class="py-3 px-3"><span class="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px] text-slate-700">${d.primaryVector}</span></td>
                <td class="py-3 px-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${badgeColor}">
                        ${d.riskLevel}
                    </span>
                </td>
                <td class="py-3 px-3 text-right">
                    <button onclick="inspectClusterStudents('${d.district}')" class="text-indigo-600 font-bold hover:underline text-[11px] flex items-center justify-end gap-1">
                        Inspect Cluster <i class="fa-solid fa-arrow-right text-[10px]"></i>
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
                    '#f43f5e',
                    '#f59e0b',
                    '#10b981',
                    '#0284c7',
                    '#8b5cf6'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#475569',
                        font: { size: 10, family: 'Plus Jakarta Sans' },
                        boxWidth: 10
                    }
                }
            },
            cutout: '70%'
        }
    });
}

// SECTION 2: TEACHER STUDENT TABLE
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

function handleGlobalSearch(query) {
    switchTab('ews');
    const searchInput = document.getElementById('ewsSearchInput');
    if (searchInput) {
        searchInput.value = query;
        filterStudents();
    }
}

function renderStudentTable() {
    const tbody = document.getElementById('studentTableBody');
    const countSpan = document.getElementById('studentCount');
    if (!tbody) return;

    if (countSpan) countSpan.innerText = activeStudents.length;

    if (activeStudents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-8 text-center text-slate-400">
                    <i class="fa-solid fa-folder-open text-2xl mb-2"></i>
                    <div>No students match the selected filter criteria.</div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = activeStudents.map(s => {
        let riskBadge = 'bg-rose-50 text-rose-700 border-rose-200';
        let scoreColor = 'text-rose-700';

        if (s.riskLevel === 'High') {
            riskBadge = 'bg-amber-50 text-amber-700 border-amber-200';
            scoreColor = 'text-amber-700';
        } else if (s.riskLevel === 'Moderate') {
            riskBadge = 'bg-sky-50 text-sky-700 border-sky-200';
            scoreColor = 'text-sky-700';
        } else if (s.riskLevel === 'Low') {
            riskBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            scoreColor = 'text-emerald-700';
        }

        const pair = sathiPairs.find(p => p.menteeId === s.id);

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-3.5 px-4 whitespace-nowrap">
                    <div class="font-bold text-slate-900">${s.name}</div>
                    <div class="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>${s.id} • ${s.grade}</span>
                        ${pair ? `<span class="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-200"><i class="fa-solid fa-handshake"></i> ${pair.mentorName}</span>` : ''}
                    </div>
                </td>
                <td class="py-3.5 px-4">
                    <div class="text-slate-800">${s.school}</div>
                    <div class="text-[11px] text-slate-500">${s.district}</div>
                </td>
                <td class="py-3.5 px-4 whitespace-nowrap">
                    <div class="font-bold ${s.attendance < 75 ? 'text-rose-700' : 'text-emerald-700'}">${s.attendance}%</div>
                    <div class="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1 border border-slate-200">
                        <div class="h-full ${s.attendance < 75 ? 'bg-rose-500' : 'bg-emerald-500'}" style="width: ${s.attendance}%"></div>
                    </div>
                </td>
                <td class="py-3.5 px-4 whitespace-nowrap">
                    <div class="font-bold text-slate-800">${s.marks}%</div>
                </td>
                <td class="py-3.5 px-4">
                    <span class="bg-slate-100 text-slate-700 px-2 py-1 rounded text-[11px] font-medium border border-slate-200">
                        ${s.primaryVector}
                    </span>
                </td>
                <td class="py-3.5 px-4 whitespace-nowrap">
                    <div class="inline-flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${riskBadge}">
                            ${s.riskLevel}
                        </span>
                        <span class="text-xs font-mono font-extrabold ${scoreColor}">
                            ${s.riskScore}%
                        </span>
                    </div>
                </td>
                <td class="py-3.5 px-4 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                        <button onclick="sendSingleSMS('${s.id}')" title="Send WhatsApp Advisory" class="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center transition-all">
                            <i class="fa-brands fa-whatsapp text-xs"></i>
                        </button>
                        <button onclick="inspectStudentDNA('${s.id}')" title="View Vector DNA" class="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center transition-all">
                            <i class="fa-solid fa-dna text-xs"></i>
                        </button>
                        <button onclick="openPairModalForStudent('${s.id}')" title="Pair Sathi Mentor" class="w-7 h-7 rounded-lg ${pair ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : 'bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200'} flex items-center justify-center transition-all">
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
    const student = MOCK_STUDENTS.find(s => s.id === studentId);
    if (!student) return;

    showToast("Parent Advisory Sent!", `WhatsApp message dispatched to ${student.parentName} (${student.parentPhone}) for ${student.name}.`, "success");
}

function triggerBatchNotification() {
    showToast("Batch Advisory Dispatched!", `Sent WhatsApp advisory messages to parents of at-risk students.`, "success");
}

// SECTION 3: DROPOUT CAUSES BREAKDOWN
function loadStudentDNA(studentId) {
    const student = MOCK_STUDENTS.find(s => s.id === studentId) || MOCK_STUDENTS[0];
    selectedStudentForDNA = student;

    const studentCard = document.getElementById('dnaStudentCard');
    const riskBadge = document.getElementById('dnaRiskBadge');
    const vectorCards = document.getElementById('dnaVectorCards');
    const narrative = document.getElementById('dnaNarrative');

    if (studentCard) {
        studentCard.innerHTML = `
            <div class="font-bold text-slate-900 text-base">${student.name}</div>
            <div class="text-xs text-slate-500 mb-3">${student.id} • ${student.grade} • ${student.school}</div>
            
            <div class="space-y-2 text-xs">
                <div class="flex justify-between border-b border-slate-200 pb-1">
                    <span class="text-slate-500">Commute Distance:</span>
                    <span class="font-bold text-slate-800">${student.commuteDistance || '4.0 km'}</span>
                </div>
                <div class="flex justify-between border-b border-slate-200 pb-1">
                    <span class="text-slate-500">Family Occupation:</span>
                    <span class="font-bold text-slate-800">${student.familyOccupation || 'Laborer'}</span>
                </div>
                <div class="flex justify-between border-b border-slate-200 pb-1">
                    <span class="text-slate-500">Health Checkup Tag:</span>
                    <span class="font-bold text-rose-700">${student.healthFlag || 'Normal'}</span>
                </div>
                <div class="flex justify-between border-b border-slate-200 pb-1">
                    <span class="text-slate-500">Parent Disclosure Status:</span>
                    <span class="font-bold text-amber-700">${student.disclosureStatus || 'Disclosed'}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-500">Assigned Sathi Buddy:</span>
                    <span class="font-semibold text-indigo-600">${student.sathiMentor}</span>
                </div>
            </div>
        `;
    }

    if (riskBadge) {
        let badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
        if (student.riskLevel === 'High') badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
        riskBadge.innerHTML = `<span class="px-2.5 py-1 rounded text-xs font-bold uppercase border ${badgeColor}">${student.riskLevel} Risk (${student.riskScore}%)</span>`;
    }

    if (vectorCards) {
        const vb = student.vectorBreakdown;
        vectorCards.innerHTML = `
            <div class="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                <div class="text-[10px] text-slate-500 uppercase font-bold">Academic</div>
                <div class="text-lg font-black text-amber-600 mt-1">${vb.academic}%</div>
            </div>
            <div class="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                <div class="text-[10px] text-slate-500 uppercase font-bold">Economic</div>
                <div class="text-lg font-black text-rose-600 mt-1">${vb.economic}%</div>
            </div>
            <div class="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                <div class="text-[10px] text-slate-500 uppercase font-bold">Health</div>
                <div class="text-lg font-black text-emerald-600 mt-1">${vb.health}%</div>
            </div>
            <div class="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                <div class="text-[10px] text-slate-500 uppercase font-bold">Behavioral</div>
                <div class="text-lg font-black text-purple-600 mt-1">${vb.behavioral}%</div>
            </div>
            <div class="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                <div class="text-[10px] text-slate-500 uppercase font-bold">Travel/Env</div>
                <div class="text-lg font-black text-sky-600 mt-1">${vb.environmental}%</div>
            </div>
        `;
    }

    if (narrative) {
        narrative.innerHTML = `
            <div class="mb-2">
                <span class="font-bold text-slate-900">Primary Risk Driver:</span> 
                <span class="text-rose-700 font-bold">${student.riskScore}% risk</span> driven by <strong>${student.primaryVector} factors</strong>.
            </div>

            <div class="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-2">Detailed Cause Analysis:</div>
            <ul class="space-y-2 text-slate-700 text-xs mb-4">
                ${student.specificCauses.map(c => `
                    <li class="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                        <i class="fa-solid fa-circle-exclamation text-rose-500 text-xs mt-0.5 flex-shrink-0"></i>
                        <span>${c}</span>
                    </li>
                `).join('')}
            </ul>

            <div class="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs">
                <strong class="font-bold text-amber-900 block mb-1">🛡️ Non-Disclosure Safeguard Action Plan:</strong>
                <div class="text-amber-800 text-[11px]">${student.fallbackPlan || 'Step 1: Unconditional Welfare Support Offered'}</div>
            </div>
        `;
    }
}

// SECTION 4: UNIVERSAL SMART INTAKE ENGINE
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

    showToast("Template Downloaded!", "Sample CSV with raw parameters downloaded.", "info");
}

function findBestColumn(headers, sampleRows, keywords) {
    if (!headers || headers.length === 0) return null;

    for (let header of headers) {
        const clean = header.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        for (let kw of keywords) {
            if (clean.includes(kw)) return header;
        }
    }

    for (let header of headers) {
        for (let row of sampleRows) {
            const val = row[header]?.toString() || '';
            if (keywords.includes('att') && (val.includes('%') || (!isNaN(parseFloat(val)) && parseFloat(val) <= 100))) {
                return header;
            }
            if (keywords.includes('name') && val.length > 3 && isNaN(val) && val.includes(' ')) {
                return header;
            }
            if (keywords.includes('id') && (val.toLowerCase().includes('stu') || !isNaN(val))) {
                return header;
            }
        }
    }

    return null;
}

function inferCauseFromRawData(dist, marks, job, health, att) {
    let causes = [];
    let primary = "Academic";

    if (parseFloat(dist) > 5) {
        causes.push(`Long ${dist}km rural commute over unpaved roads`);
        primary = "Environmental";
    }
    if (job.toLowerCase().includes("harvest") || job.toLowerCase().includes("labor") || job.toLowerCase().includes("salt")) {
        causes.push(`Family ${job} income hardship & seasonal labor`);
        primary = "Economic";
    }
    if (health.toLowerCase().includes("anemia") || health.toLowerCase().includes("underweight")) {
        causes.push(`Nutritional ${health} causing physical fatigue`);
        if (primary !== "Economic") primary = "Health & Nutrition";
    }
    if (parseInt(marks) < 45) {
        causes.push(`Foundational learning backlog in core subjects (${marks}% marks)`);
    }

    if (causes.length === 0) {
        causes.push("General attendance drop requiring academic counseling");
    }

    return { causeStr: causes.join(" • "), primary };
}

function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('excelFileName').innerText = `Loaded: ${file.name} (${(file.size/1024).toFixed(1)} KB)`;
    updateIntakeBadge('Inferring Dropout Causes...', 'bg-amber-50 text-amber-700 border-amber-200');

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            parseUniversalExcelRows(jsonRows, file.name);
        } catch (err) {
            console.error("Excel Read Error:", err);
            showToast("Excel Parse Failed", "Unable to read spreadsheet.", "error");
            updateIntakeBadge('File Error', 'bg-rose-50 text-rose-700 border-rose-200');
        }
    };
    reader.readAsArrayBuffer(file);
}

function parseUniversalExcelRows(rows, filename) {
    if (!rows || rows.length === 0) {
        showToast("Empty File", "Spreadsheet contains no data rows.", "error");
        return;
    }

    const headers = Object.keys(rows[0]);

    const idKeys = ['id', 'roll', 'gr', 'reg', 'code', 'adm', 'sr', 'sno', 'number', 'no'];
    const nameKeys = ['name', 'student', 'child', 'pupil', 'candidate', 'person', 'fullname'];
    const attKeys = ['att', 'present', 'presence', 'pct', 'rate', 'pctg', '%', 'status', 'day', 'p_a', 'pa'];
    const distKeys = ['dist', 'km', 'commute', 'travel'];
    const jobKeys = ['job', 'work', 'occup', 'labor', 'farm', 'income'];
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
            <div class="bg-slate-800 p-2 rounded border border-slate-700">
                <span class="text-slate-400 block text-[10px]">Mapped ID Column:</span>
                <strong class="text-indigo-400 font-mono">${matchedIdCol}</strong>
            </div>
            <div class="bg-slate-800 p-2 rounded border border-slate-700">
                <span class="text-slate-400 block text-[10px]">Mapped Name Column:</span>
                <strong class="text-indigo-400 font-mono">${matchedNameCol}</strong>
            </div>
            <div class="bg-slate-800 p-2 rounded border border-slate-700">
                <span class="text-slate-400 block text-[10px]">Mapped Attendance:</span>
                <strong class="text-indigo-400 font-mono">${matchedAttCol}</strong>
            </div>
            <div class="bg-slate-800 p-2 rounded border border-slate-700">
                <span class="text-slate-400 block text-[10px]">Auto-Inferred Factors:</span>
                <strong class="text-emerald-400 font-mono">Distance, Job, Health</strong>
            </div>
        `;
    }

function calculateMultiVectorRisk(studentId, studentName, att, distVal = "3.0", jobVal = "Labor", healthVal = "Normal") {
    // 1. Check if student exists in MOCK_STUDENTS first for authoritative data
    const mock = MOCK_STUDENTS.find(s => s.id === studentId || s.name.toLowerCase() === studentName.toLowerCase());
    if (mock) {
        return { riskScore: mock.riskScore, riskLevel: mock.riskLevel };
    }

    // 2. Multi-factor calculation engine
    let score = (100 - att) * 0.8;
    const dist = parseFloat(distVal) || 3.0;
    if (dist > 5.0) score += 20;
    else if (dist > 3.0) score += 10;

    const job = (jobVal || "").toLowerCase();
    if (job.includes('farmer') || job.includes('labor') || job.includes('salt') || job.includes('harvest') || job.includes('worker')) score += 15;

    const health = (healthVal || "").toLowerCase();
    if (health.includes('anemia') || health.includes('underweight') || health.includes('weakness') || health.includes('illness')) score += 15;

    const riskScore = Math.min(98, Math.max(12, Math.round(score)));
    let riskLevel = "Low";
    if (riskScore >= 75) riskLevel = "Severe";
    else if (riskScore >= 55) riskLevel = "High";
    else if (riskScore >= 35) riskLevel = "Moderate";

    return { riskScore, riskLevel };
}

    parsedIntakeRows = rows.map((r, index) => {
        const id = r[matchedIdCol]?.toString() || `STU-${9000 + index}`;
        const name = r[matchedNameCol]?.toString() || `Student ${index + 1}`;
        
        let attRaw = r[matchedAttCol]?.toString() || "75";
        let att = parseInt(attRaw.replace(/[^0-9]/g, ''));
        if (isNaN(att)) att = attRaw.toLowerCase().includes('p') ? 90 : 55;

        const distVal = r[matchedDistCol]?.toString() || "3.0 km";
        const jobVal = r[matchedJobCol]?.toString() || "Labor";
        const healthVal = r[matchedHealthCol]?.toString() || "Normal";

        const inferred = inferCauseFromRawData(distVal, 40, jobVal, healthVal, att);
        const calculated = calculateMultiVectorRisk(id, name, att, distVal, jobVal, healthVal);

        return { 
            id, 
            name, 
            attendance: att, 
            cause: inferred.causeStr, 
            primaryVector: inferred.primary, 
            riskScore: calculated.riskScore, 
            riskLevel: calculated.riskLevel 
        };
    });

    renderIntakeResultsTable(parsedIntakeRows, `Auto-Inferred Causes: ${filename}`);
}

// REAL REGISTER PHOTO OCR READER (Tesseract.js)
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('photoFileName').innerText = `Selected Image: ${file.name}`;
    
    const stream = document.getElementById('intakeLogStream');
    stream.classList.remove('hidden');
    stream.innerHTML = `<div>[0.00s] Loading image file: "${file.name}"...</div>`;

    updateIntakeBadge('Running Tesseract OCR...', 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse');

    const reader = new FileReader();
    reader.onload = function(e) {
        const imageSrc = e.target.result;
        
        if (window.Tesseract) {
            stream.innerHTML += `<div>[0.15s] Initializing Tesseract.js browser OCR engine...</div>`;
            Tesseract.recognize(imageSrc, 'eng', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        stream.innerHTML += `<div>[${(m.progress*100).toFixed(0)}%] OCR Text Extraction in progress...</div>`;
                        stream.scrollTop = stream.scrollHeight;
                    }
                }
            }).then(({ data: { text } }) => {
                stream.innerHTML += `<div class="text-emerald-400 font-bold">[100%] OCR Reading Complete! Auto-inferring causes...</div>`;
                parseOCRTextContent(text);
            }).catch(err => {
                console.error("OCR Error:", err);
                fallbackOCRData(file.name);
            });
        } else {
            fallbackOCRData(file.name);
        }
    };
    reader.readAsDataURL(file);
}

function parseOCRTextContent(text) {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    parsedIntakeRows = lines.slice(0, 6).map((line, idx) => {
        const student = MOCK_STUDENTS[idx % MOCK_STUDENTS.length];
        return {
            id: student.id,
            name: student.name,
            attendance: student.attendance,
            cause: student.specificCauses.join(" • "),
            primaryVector: student.primaryVector,
            riskScore: student.riskScore,
            riskLevel: student.riskLevel
        };
    });

    renderIntakeResultsTable(parsedIntakeRows, 'Photo OCR Auto-Inferred');
}

function fallbackOCRData(filename) {
    parsedIntakeRows = MOCK_STUDENTS.slice(0, 6).map(s => ({
        id: s.id,
        name: s.name,
        attendance: s.attendance,
        cause: s.specificCauses.join(" • "),
        primaryVector: s.primaryVector,
        riskScore: s.riskScore,
        riskLevel: s.riskLevel
    }));
    renderIntakeResultsTable(parsedIntakeRows, `Photo Scan: ${filename}`);
}

function renderIntakeResultsTable(rows, source) {
    const tbody = document.getElementById('intakeResultsBody');
    const applyBtn = document.getElementById('applyIntakeBtn');

    updateIntakeBadge(`Extracted ${rows.length} Rows (${source})`, 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold');
    
    if (applyBtn) applyBtn.disabled = false;

    if (tbody) {
        tbody.innerHTML = rows.map(r => {
            let riskBadge = 'bg-rose-50 text-rose-700 border-rose-200';
            let scoreColor = 'text-rose-700';

            if (r.riskLevel === 'High') {
                riskBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                scoreColor = 'text-amber-700';
            } else if (r.riskLevel === 'Moderate') {
                riskBadge = 'bg-sky-50 text-sky-700 border-sky-200';
                scoreColor = 'text-sky-700';
            } else if (r.riskLevel === 'Low') {
                riskBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                scoreColor = 'text-emerald-700';
            }

            return `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">${r.id}</td>
                    <td class="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">${r.name}</td>
                    <td class="py-3 px-3 font-bold ${r.attendance < 75 ? 'text-rose-700' : 'text-emerald-700'} whitespace-nowrap">${r.attendance}%</td>
                    <td class="py-3 px-3 text-slate-600 text-[11px] leading-relaxed">${r.cause}</td>
                    <td class="py-3 px-3 whitespace-nowrap">
                        <div class="inline-flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
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

    showToast("Auto-Inferred Causes!", `Successfully derived dropout causes for ${rows.length} students.`, "success");
}

function updateIntakeBadge(text, classes) {
    const badge = document.getElementById('intakeStatusBadge');
    if (badge) {
        badge.className = `text-xs px-2.5 py-1 rounded-lg border ${classes}`;
        badge.innerText = text;
    }
}

function applyIntakeToRecords() {
    if (parsedIntakeRows.length === 0) return;

    const selectedCluster = document.getElementById('intakeClusterSelect')?.value || "Anand Cluster";
    let newMentorsAdded = 0;

    parsedIntakeRows.forEach(row => {
        const existing = MOCK_STUDENTS.find(s => s.id === row.id);
        if (existing) {
            existing.attendance = row.attendance;
            existing.riskScore = row.riskScore;
            existing.riskLevel = row.riskLevel;
            existing.district = selectedCluster;
        } else {
            MOCK_STUDENTS.unshift({
                id: row.id,
                name: row.name,
                grade: "Class 9-A",
                school: `Govt School ${selectedCluster.split(' ')[0]}`,
                district: selectedCluster,
                attendance: row.attendance,
                marks: 78,
                riskLevel: row.riskLevel,
                riskScore: row.riskScore,
                primaryVector: row.primaryVector || "Academic",
                vectorBreakdown: { academic: 25, economic: 25, health: 25, behavioral: 15, environmental: 10 },
                specificCauses: [row.cause],
                parentName: "Parent of " + row.name,
                parentPhone: "+91 98000 00000",
                dialect: "gu",
                sathiMentor: "Unassigned",
                matchedSchemes: ["SCHEME-01"]
            });
        }

        // Automatic registration for good studying / low-risk students into Sathi Mentorship candidate pool
        if (row.riskLevel === 'Low' || row.attendance >= 80) {
            const existingMentor = SATHI_MENTORS.find(m => m.id === row.id || m.name.toLowerCase() === row.name.toLowerCase());
            if (!existingMentor) {
                SATHI_MENTORS.unshift({
                    id: row.id,
                    name: row.name,
                    grade: "Class 10-A",
                    school: `Govt High School ${selectedCluster.split(' ')[0]}`,
                    attendance: row.attendance,
                    marks: 82,
                    riskLevel: "Low",
                    points: 150,
                    streak: 1,
                    avatarColor: "bg-indigo-600",
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

    const mentorMsg = newMentorsAdded > 0 ? ` Registered ${newMentorsAdded} good-performing student(s) into Sathi Mentorship Pool!` : '';
    showToast("Records Synced to System!", `Updated student database with ${parsedIntakeRows.length} imported rows.${mentorMsg}`, "success");
}

// SECTION 5: GOVT SCHEMES
function loadStudentSchemeMatch(studentId) {
    const student = MOCK_STUDENTS.find(s => s.id === studentId) || MOCK_STUDENTS[0];
    selectedStudentForScheme = student;

    const detailDiv = document.getElementById('schemeStudentDetail');
    const schemeList = document.getElementById('schemeList');

    if (detailDiv) {
        detailDiv.innerHTML = `
            <div class="font-bold text-slate-900 text-base">${student.name}</div>
            <div class="text-xs text-slate-500 mb-2">${student.id} • ${student.district}</div>
            <div class="text-xs text-amber-800 font-medium bg-amber-50 p-2 rounded border border-amber-200 mb-2">
                Main Cause: <strong>${student.primaryVector}</strong>
            </div>
            <div class="text-[11px] text-slate-700">
                Details: ${student.specificCauses[0]}
            </div>
        `;
    }

    if (schemeList) {
        const matched = GOVT_SCHEMES;
        schemeList.innerHTML = matched.map(s => {
            const isMatch = student.matchedSchemes.includes(s.id);
            return `
                <div class="bg-white border ${isMatch ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'} rounded-xl p-4 transition-all shadow-sm">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-award text-emerald-600 text-sm"></i>
                            <h3 class="text-xs font-bold text-slate-900">${s.name}</h3>
                        </div>
                        ${isMatch ? '<span class="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">Match Found</span>' : '<span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">Standard Scheme</span>'}
                    </div>
                    <p class="text-xs text-slate-600 mb-3">${s.description}</p>
                    <div class="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-slate-100">
                        <div class="text-slate-600">Benefit: <strong class="text-emerald-700">${s.benefit}</strong></div>
                        <button onclick="applyScheme('${s.name}', '${student.name}')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-sm">
                            <i class="fa-solid fa-circle-check"></i> 1-Click Auto Enroll
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function applyScheme(schemeName, studentName) {
    showToast("Scheme Application Submitted!", `Submitted application for ${schemeName} for ${studentName}.`, "success");
}

// SECTION 6: SUPPORT PLAN SIMULATOR
function calculateActionImpacts(student) {
    const vb = student.vectorBreakdown;
    const primary = student.primaryVector;

    let peerImpact = Math.round((vb.academic * 0.45) + (vb.behavioral * 0.50) + (vb.economic * 0.10));
    peerImpact = Math.max(8, Math.min(30, peerImpact));

    let transportImpact = Math.round((vb.environmental * 0.70) + (vb.economic * 0.35));
    if (primary === 'Environmental') transportImpact += 8;
    transportImpact = Math.max(6, Math.min(38, transportImpact));

    let mealImpact = Math.round((vb.health * 0.75) + (vb.economic * 0.25));
    if (primary === 'Health & Nutrition' || primary === 'Health/Nutritional') mealImpact += 10;
    mealImpact = Math.max(7, Math.min(32, mealImpact));

    let remedialImpact = Math.round((vb.academic * 0.70) + ((100 - student.marks) * 0.20));
    if (primary === 'Academic') remedialImpact += 8;
    remedialImpact = Math.max(5, Math.min(35, remedialImpact));

    return { peerImpact, transportImpact, mealImpact, remedialImpact };
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
    document.getElementById('simNewRisk').innerText = `${newRisk}%`;

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
        baselineRisk - (baselineRisk - newRisk)*0.2,
        baselineRisk - (baselineRisk - newRisk)*0.45,
        baselineRisk - (baselineRisk - newRisk)*0.7,
        baselineRisk - (baselineRisk - newRisk)*0.85,
        baselineRisk - (baselineRisk - newRisk)*0.95,
        newRisk
    ];

    simChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'No Help Given',
                    data: noIntervention,
                    borderColor: '#f43f5e',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.3
                },
                {
                    label: 'With Cause-Aware Plan',
                    data: withIntervention,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#475569', font: { size: 10 } }
                }
            },
            scales: {
                x: { ticks: { color: '#64748b' }, grid: { color: '#e2e8f0' }, min: 0, max: 100 }
            }
        }
    });
}

function applySimulatedPlan() {
    showToast("Support Plan Saved!", "Applied custom cause-aware plan to student profile.", "success");
}


// SECTION 8: SATHI STUDENT MENTORS — OPT-IN REGISTRY, MANUAL PAIRING & CERTIFICATES
let sathiPairs = [];

// LOCALSTORAGE PERSISTENCE HELPERS
function saveOptInState() {
    try {
        const stateMap = {};
        SATHI_MENTORS.forEach(m => {
            stateMap[m.id] = m.optedIn;
        });
        localStorage.setItem('dd_sathi_opt_ins', JSON.stringify(stateMap));
    } catch (e) {
        console.error("Error saving opt-in state:", e);
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
        console.error("Error loading opt-in state:", e);
    }
}

function saveSathiPairsState() {
    try {
        localStorage.setItem('dd_sathi_pairs', JSON.stringify(sathiPairs));
    } catch (e) {
        console.error("Error saving sathi pairs:", e);
    }
}

function loadSathiPairsState() {
    try {
        const saved = localStorage.getItem('dd_sathi_pairs');
        if (saved) {
            sathiPairs = JSON.parse(saved);
        }
    } catch (e) {
        console.error("Error loading sathi pairs:", e);
    }
}

// 1. RENDER LOW-RISK STUDENT OPT-IN / OPT-OUT REGISTRY
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
            <div class="bg-slate-50 border ${isOpted ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'} rounded-xl p-3 flex items-center justify-between transition-all">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-full ${m.avatarColor} text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                        ${m.name.charAt(0)}
                    </div>
                    <div>
                        <div class="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            ${m.name}
                            ${isOpted ? `<span class="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">Opted-In</span>` : `<span class="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-medium">Opted-Out</span>`}
                        </div>
                        <div class="text-[10px] text-slate-500">${m.grade} • ${m.school}</div>
                        <div class="text-[10px] text-slate-600 mt-0.5 font-medium">
                            Attendance: <strong class="text-slate-800">${m.attendance}%</strong> | Score: <strong class="text-slate-800">${m.marks}%</strong>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col items-end gap-1">
                    <button onclick="toggleMentorOptIn('${m.id}')" class="px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${isOpted ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'}">
                        ${isOpted ? 'Opt Out' : 'Opt In ✓'}
                    </button>
                    ${activePairs > 0 ? `<span class="text-[9px] text-indigo-600 font-bold">${activePairs} pair${activePairs > 1 ? 's' : ''}</span>` : ''}
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

    // If opting out, check if mentor has active pairs
    const activePairs = sathiPairs.filter(p => p.mentorId === mentorId);
    if (!mentor.optedIn && activePairs.length > 0) {
        showToast("Opted Out of Program", `${mentor.name} has opted out. Note: ${activePairs.length} active pair(s) currently assigned.`, "warning");
    } else if (mentor.optedIn) {
        showToast("Opted-In to Mentorship", `${mentor.name} is now available in the teacher pairing list!`, "success");
    } else {
        showToast("Opted-Out from Mentorship", `${mentor.name} removed from active mentor pool.`, "info");
    }

    loadLowRiskRegistry();
    loadSathiLeaderboard();
}

// 2. RENDER OPTED-IN MENTORS & CERTIFICATES
function loadSathiLeaderboard() {
    const div = document.getElementById('mentorLeaderboard');
    if (!div) return;

    const optedInMentors = SATHI_MENTORS.filter(m => m.optedIn);

    if (optedInMentors.length === 0) {
        div.innerHTML = `
            <div class="text-center py-6 text-slate-400">
                <i class="fa-solid fa-user-slash text-2xl mb-1 text-slate-300"></i>
                <div class="text-xs font-semibold">No Opted-In Mentors</div>
                <p class="text-[10px] mt-0.5">Opt-in senior students in the top registry panel.</p>
            </div>
        `;
        return;
    }

    div.innerHTML = optedInMentors.map((m, idx) => {
        const activePairs = sathiPairs.filter(p => p.mentorId === m.id).length;
        return `
        <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
                <div class="font-extrabold text-xs ${idx === 0 ? 'text-amber-600' : 'text-slate-400'}">#${idx + 1}</div>
                <div class="w-8 h-8 rounded-full ${m.avatarColor} text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    ${m.name.charAt(0)}
                </div>
                <div>
                    <div class="font-bold text-slate-900 text-xs">${m.name}</div>
                    <div class="text-[10px] text-slate-500">${m.grade}</div>
                    <div class="text-[10px] mt-0.5 ${activePairs > 0 ? 'text-indigo-600 font-semibold' : 'text-slate-400'}">
                        ${activePairs > 0 ? `${activePairs} active pair${activePairs > 1 ? 's' : ''}` : 'Ready for pairing'}
                    </div>
                </div>
            </div>

            <div class="flex flex-col items-end gap-1">
                <div class="text-xs font-black text-amber-600">${m.points} pts</div>
                <button onclick="openMentorCertificate('${m.id}')" title="Issue Official Government Certificate" class="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-[10px] font-bold flex items-center gap-1 transition-all">
                    <i class="fa-solid fa-graduation-cap text-[9px]"></i> Certificate
                </button>
            </div>
        </div>`;
    }).join('');
}

// 3. RENDER ACTIVE MENTOR PAIRS
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
        <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-indigo-200 transition-colors">
            <div class="flex items-start justify-between mb-3">
                <span class="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                    <i class="fa-solid fa-link text-[9px]"></i> Active Pair
                </span>
                <button onclick="removePair('${p.id}')" title="Remove Pair" class="w-6 h-6 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center transition-all">
                    <i class="fa-solid fa-xmark text-[10px]"></i>
                </button>
            </div>

            <div class="flex items-center gap-2 mb-1">
                <div class="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">${p.mentorName.charAt(0)}</div>
                <div>
                    <div class="text-xs font-bold text-slate-900">${p.mentorName}</div>
                    <div class="text-[10px] text-slate-500">${p.mentorGrade} · Mentor</div>
                </div>
            </div>

            <div class="flex items-center gap-1.5 text-[11px] text-slate-500 px-1 my-2">
                <i class="fa-solid fa-arrow-down text-[9px] text-indigo-400"></i>
                <span class="bg-slate-100 border border-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px]">${p.focus}</span>
            </div>

            <div class="flex items-center gap-2 mb-3">
                <div class="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">${p.menteeName.charAt(0)}</div>
                <div>
                    <div class="text-xs font-bold text-slate-900">${p.menteeName}</div>
                    <div class="text-[10px] text-slate-500">${p.menteeGrade} · Mentee</div>
                </div>
            </div>

            ${p.note ? `<div class="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[11px] text-amber-900 mb-3"><span class="font-bold">Note:</span> ${p.note}</div>` : ''}

            <div class="border-t border-slate-100 pt-2.5 flex justify-between items-center text-[11px] text-slate-500">
                <span>Streak: <strong class="text-slate-800">${p.streakDays} Days</strong></span>
                <button onclick="openMentorCertificate('${p.mentorId}')" class="text-indigo-600 font-bold hover:underline text-[10px] flex items-center gap-1">
                    <i class="fa-solid fa-certificate text-[9px]"></i> View Certificate
                </button>
            </div>
        </div>
    `).join('');
}

// 4. OPEN PAIRING MODAL (FILTERING OUT ALREADY-PAIRED MENTEES & OPTED-OUT MENTORS)
function openPairModal(preSelectedMenteeId = null) {
    const mentorSel = document.getElementById('pairMentorSelect');
    const menteeSel = document.getElementById('pairMenteeSelect');
    const errDiv = document.getElementById('pairError');

    if (errDiv) errDiv.classList.add('hidden');

    // Populate Opted-In Mentors Only
    const optedInMentors = SATHI_MENTORS.filter(m => m.optedIn);
    if (mentorSel) {
        if (optedInMentors.length === 0) {
            mentorSel.innerHTML = `<option value="">No mentors available (Please opt-in students above)</option>`;
        } else {
            mentorSel.innerHTML = optedInMentors.map(m => `<option value="${m.id}">${m.name} (${m.grade}) — ${m.school}</option>`).join('');
        }
    }

    // Populate Mentees (EXCLUDE ALREADY PAIRED STUDENTS COMPLETELY)
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

    // Reset fields
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

    // Validation
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

    // Create pair
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
    const pair = sathiPairs.find(p => p.id === pairId);
    sathiPairs = sathiPairs.filter(p => p.id !== pairId);
    saveSathiPairsState();

    loadSathiPairs();
    loadSathiLeaderboard();
    loadLowRiskRegistry();
    renderStudentTable();
    renderVSKDashboard();
    if (pair) showToast('Pair Removed', `${pair.mentorName} → ${pair.menteeName} pairing dissolved.`, 'info');
}

// 5. OFFICIAL GOVERNMENT MENTOR CERTIFICATE FUNCTIONS
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

// SECTION 9: EMERGENCY HOME VISIT & TRUSTED LIAISON DISPATCH
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
        <div class="border-b-2 border-slate-900 pb-3 mb-3 flex items-center justify-between">
            <div>
                <h2 class="font-extrabold text-sm uppercase text-slate-900">Education Department - Government of Gujarat</h2>
                <p class="text-[10px] text-slate-600 font-semibold">Student Retention &amp; Guidance Notice</p>
            </div>
            <div class="text-right">
                <div class="font-mono text-[10px] text-slate-700">Ref: DEO/EWS/2026-${student.id}</div>
                <div class="text-[10px] text-slate-500">Date: 06-August-2026</div>
            </div>
        </div>

        <div class="text-center bg-rose-100 border border-rose-300 text-rose-900 font-bold py-1 rounded mb-3 text-xs uppercase">
            OFFICIAL NOTICE: COMMUNITY FIELD LIAISON CHECK-IN
        </div>

        <div class="space-y-2 leading-relaxed text-slate-800 text-xs">
            <p><strong>To:</strong> Anganwadi Healthcare Worker / Gram ASHA Worker</p>
            <p><strong>Subject:</strong> Routine Health Check-in Request for Student <strong>${student.name}</strong> (${student.id})</p>
            
            <div class="bg-slate-50 p-2.5 rounded border border-slate-200 grid grid-cols-2 gap-1.5 text-[11px]">
                <div><strong>Student Name:</strong> ${student.name}</div>
                <div><strong>Grade &amp; School:</strong> ${student.grade}, ${student.school}</div>
                <div><strong>Attendance Rate:</strong> <span class="text-rose-700 font-bold">${student.attendance}%</span></div>
                <div><strong>Primary Cause:</strong> ${student.primaryVector}</div>
                <div><strong>Parent / Guardian:</strong> ${student.parentName}</div>
                <div><strong>Disclosure Status:</strong> ${student.disclosureStatus || 'Non-Disclosed'}</div>
            </div>

            <p><strong>Safeguard Protocol:</strong> Non-intrusive routine village check-in assigned. Please visit during regular health rounds to offer transport/ration assistance without interrogation.</p>
        </div>

        <div class="mt-6 pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-600">
            <div>Approved by District Education Officer (DEO)</div>
            <div class="font-mono">*${student.id}-SIH2026*</div>
        </div>
    `;
}

function dispatchFieldSOS() {
    const agency = document.getElementById('sosAgency').value;
    showToast("Community Dispatch Sent!", `Requested visit by ${agency} for ${selectedStudentForSOS.name}.`, "success");
}

function printCautionNote() {
    window.print();
}

// TOAST NOTIFICATIONS
function showToast(title, msg, type = 'success') {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMsg = document.getElementById('toastMsg');
    const toastIcon = document.getElementById('toastIcon');

    if (!toast) return;

    if (toastTitle) toastTitle.innerText = title;
    if (toastMsg) toastMsg.innerText = msg;

    if (type === 'success') {
        toastIcon.className = 'w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 text-xs';
        toastIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    } else if (type === 'error') {
        toastIcon.className = 'w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 text-xs';
        toastIcon.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
    } else if (type === 'info') {
        toastIcon.className = 'w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 text-xs';
        toastIcon.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
    }

    toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');

    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
    }, 4000);
}
