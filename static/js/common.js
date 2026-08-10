// Executive Engineering Platform Controller & Interactive Platform Guide

const API_URL = window.location.origin + '/invoke';
const HEALTH_API_URL = window.location.origin + '/health';
const HISTORY_STORAGE_KEY = 'langgraph_studio_history_v3';

// Save run to local history
function saveRunToHistory(runData) {
    try {
        const history = getRunHistory();
        history.unshift({
            id: 'run_' + Date.now(),
            timestamp: new Date().toISOString(),
            task: runData.task,
            language: runData.language || 'python',
            success: runData.success || false,
            iterations: runData.iterations || 1,
            code: runData.code || '',
            report: runData.report || '',
            thread_id: runData.thread_id || ''
        });
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
    } catch (e) {
        console.warn('Failed to save run to history:', e);
    }
}

// Get run history
function getRunHistory() {
    try {
        const data = localStorage.getItem(HISTORY_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

// Clear run history
function clearRunHistory() {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    showToast('Audit log history cleared', 'info');
}

// Toast Notification
function showToast(message, type = 'info') {
    const icons = {
        info: 'info',
        success: 'check_circle',
        error: 'error',
        warning: 'warning'
    };
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <span class="material-symbols-outlined" style="color: ${type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#ea580c'}; font-size: 20px;">${icons[type]}</span>
        <span style="font-size: 13.5px; font-weight: 600;">${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.2s ease';
        setTimeout(() => toast.remove(), 200);
    }, 2800);
}

// Set Active Navigation
function setActiveNav(pageId) {
    document.querySelectorAll('.nav-link-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageId) {
            item.classList.add('active');
        }
    });
}

// Copy Code to Clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Code copied to clipboard!', 'success');
        return true;
    } catch (err) {
        showToast('Failed to copy code', 'error');
        return false;
    }
}

// Download File
function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`, 'success');
}

const LANGUAGE_EXT = {
    'python': '.py',
    'java': '.java',
    'cpp': '.cpp'
};

function getFileExtension(lang) {
    return LANGUAGE_EXT[lang.toLowerCase()] || '.txt';
}

// Command Palette (Cmd + K) Controller
function initCommandPalette() {
    if (!document.getElementById('cmdSpotlightBackdrop')) {
        const modalHtml = `
            <div id="cmdSpotlightBackdrop" class="cmd-spotlight-backdrop">
                <div class="cmd-spotlight-modal" onclick="event.stopPropagation()">
                    <input id="cmdSpotlightInput" class="cmd-spotlight-input" placeholder="Type a command or search studio..." autofocus/>
                    <div>
                        <div class="cmd-spotlight-item" onclick="navigateTo('/')">
                            <span style="display:flex; align-items:center; gap:10px;"><span class="material-symbols-outlined">dashboard</span> Open Command Center</span>
                            <span class="cyber-badge cyber-badge-terracotta">1</span>
                        </div>
                        <div class="cmd-spotlight-item" onclick="navigateTo('/generate')">
                            <span style="display:flex; align-items:center; gap:10px;"><span class="material-symbols-outlined">code_blocks</span> Open Code Workbench</span>
                            <span class="cyber-badge cyber-badge-terracotta">2</span>
                        </div>
                        <div class="cmd-spotlight-item" onclick="navigateTo('/workflow')">
                            <span style="display:flex; align-items:center; gap:10px;"><span class="material-symbols-outlined">account_tree</span> Inspect State Canvas</span>
                            <span class="cyber-badge cyber-badge-terracotta">3</span>
                        </div>
                        <div class="cmd-spotlight-item" onclick="navigateTo('/execution')">
                            <span style="display:flex; align-items:center; gap:10px;"><span class="material-symbols-outlined">analytics</span> View Telemetry</span>
                            <span class="cyber-badge cyber-badge-terracotta">4</span>
                        </div>
                        <div class="cmd-spotlight-item" onclick="navigateTo('/history')">
                            <span style="display:flex; align-items:center; gap:10px;"><span class="material-symbols-outlined">history</span> View Audit Log</span>
                            <span class="cyber-badge cyber-badge-terracotta">5</span>
                        </div>
                        <div class="cmd-spotlight-item" onclick="openPlatformGuide(); closeCommandPalette();">
                            <span style="display:flex; align-items:center; gap:10px;"><span class="material-symbols-outlined">menu_book</span> Launch Interactive Platform Guide</span>
                            <span class="cyber-badge cyber-badge-emerald">HELP</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('cmdSpotlightBackdrop').addEventListener('click', closeCommandPalette);
    }
}

function openCommandPalette() {
    initCommandPalette();
    const backdrop = document.getElementById('cmdSpotlightBackdrop');
    if (backdrop) {
        backdrop.style.display = 'flex';
        document.getElementById('cmdSpotlightInput')?.focus();
    }
}

function closeCommandPalette() {
    const backdrop = document.getElementById('cmdSpotlightBackdrop');
    if (backdrop) {
        backdrop.style.display = 'none';
    }
}

function navigateTo(path) {
    closeCommandPalette();
    window.location.href = path;
}

// Global Shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openCommandPalette();
    } else if (e.key === 'Escape') {
        closeCommandPalette();
        closePlatformGuide();
    }
});

// Interactive Proactive Platform Onboarding Guide
const GUIDE_STEPS = [
    {
        title: "Welcome to LangGraph Studio",
        badge: "PLATFORM ARCHITECTURE",
        desc: "LangGraph Studio is an automated multi-agent code generation and verification platform. It features a self-correcting state machine that drafts code, runs tests in a sandbox, and routes back to the developer agent if assertions fail.",
        actionText: "Explore Key Features →",
        page: "/"
    },
    {
        title: "1. Code Workbench & Verification Studio",
        badge: "CODE ENGINE",
        desc: "Submit natural language task specifications in Python, Java, or C++. The Developer node drafts the solution, while the Sandbox Verifier executes self-contained assertion tests.",
        actionText: "Try Code Workbench",
        page: "/generate"
    },
    {
        title: "2. Interactive State Graph Canvas",
        badge: "STATE MACHINE VISUALIZER",
        desc: "Visual representation of the LangGraph state machine. Click any node to inspect CrewState variables (messages, code, report, execution_success, iterations) or run the live step simulator.",
        actionText: "Inspect State Canvas",
        page: "/workflow"
    },
    {
        title: "3. Real-Time Telemetry & Diagnostics",
        badge: "SYSTEM HEALTH",
        desc: "Monitors API circuit breaker status, sliding-window rate limiters, memory checkpointers, and live streaming diagnostics logs.",
        actionText: "View System Telemetry",
        page: "/execution"
    },
    {
        title: "4. Audit Log & Run Replay",
        badge: "AUDIT LOGS",
        desc: "Searchable and filterable history of all previous executions. Click any past run to open the full code & verification report modal.",
        actionText: "Open Audit Logs",
        page: "/history"
    }
];

let currentGuideIndex = 0;

function initPlatformGuide() {
    if (!document.getElementById('platformGuideBackdrop')) {
        const guideHtml = `
            <div id="platformGuideBackdrop" class="cmd-spotlight-backdrop">
                <div class="studio-card" style="width: 100%; max-width: 600px; background: #ffffff; border-color: var(--border-medium);" onclick="event.stopPropagation()">
                    
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span class="material-symbols-outlined" style="color: var(--accent-terracotta); font-size: 24px;">menu_book</span>
                            <h2 style="font-size: 20px; font-weight: 700;">Platform Interactive Guide</h2>
                        </div>
                        <button onclick="closePlatformGuide()" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer;">
                            <span class="material-symbols-outlined" style="font-size: 24px;">close</span>
                        </button>
                    </div>

                    <div style="background: var(--bg-inset); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid var(--border-subtle);">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                            <h3 style="font-size: 17px; font-weight: 700;" id="guideStepTitle">Welcome to LangGraph Studio</h3>
                            <span class="cyber-badge cyber-badge-terracotta" id="guideStepBadge">PLATFORM ARCHITECTURE</span>
                        </div>
                        <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.65;" id="guideStepDesc"></p>
                    </div>

                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 12.5px; color: var(--text-muted); font-family: var(--font-mono);" id="guideStepCounter">Step 1 of 5</span>

                        <div style="display: flex; gap: 10px;">
                            <button id="guidePrevBtn" class="cyber-btn cyber-btn-secondary" onclick="prevGuideStep()">Previous</button>
                            <button id="guideNextBtn" class="cyber-btn cyber-btn-primary" onclick="nextGuideStep()">Next Step →</button>
                        </div>
                    </div>

                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', guideHtml);
        document.getElementById('platformGuideBackdrop').addEventListener('click', closePlatformGuide);
    }
}

function renderGuideStep() {
    const step = GUIDE_STEPS[currentGuideIndex];
    document.getElementById('guideStepTitle').textContent = step.title;
    document.getElementById('guideStepBadge').textContent = step.badge;
    document.getElementById('guideStepDesc').textContent = step.desc;
    document.getElementById('guideStepCounter').textContent = `Step ${currentGuideIndex + 1} of ${GUIDE_STEPS.length}`;
    document.getElementById('guideNextBtn').textContent = step.actionText;

    document.getElementById('guidePrevBtn').disabled = currentGuideIndex === 0;
}

function openPlatformGuide() {
    initPlatformGuide();
    currentGuideIndex = 0;
    renderGuideStep();
    document.getElementById('platformGuideBackdrop').style.display = 'flex';
}

function closePlatformGuide() {
    const backdrop = document.getElementById('platformGuideBackdrop');
    if (backdrop) {
        backdrop.style.display = 'none';
    }
}

function nextGuideStep() {
    const currentStep = GUIDE_STEPS[currentGuideIndex];
    if (currentGuideIndex < GUIDE_STEPS.length - 1) {
        currentGuideIndex++;
        renderGuideStep();
    } else {
        closePlatformGuide();
        showToast('Guided tour completed!', 'success');
    }

    if (currentStep.page && window.location.pathname !== currentStep.page) {
        window.location.href = currentStep.page;
    }
}

function prevGuideStep() {
    if (currentGuideIndex > 0) {
        currentGuideIndex--;
        renderGuideStep();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    let pageId = 'dashboard';
    
    if (path.includes('generate')) pageId = 'generator';
    else if (path.includes('workflow')) pageId = 'workflow';
    else if (path.includes('execution')) pageId = 'execution';
    else if (path.includes('history')) pageId = 'history';
    
    setActiveNav(pageId);
    initCommandPalette();
    initPlatformGuide();
});
