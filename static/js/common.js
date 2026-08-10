// Executive Engineering Platform Controller & Proactive Page Guide

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
        closeProactiveGuide();
    }
});

// Page-Aware Proactive Guide Explanations
const PAGE_GUIDE_DATA = {
    '/': {
        title: "Overview Command Center",
        badge: "PAGE GUIDE: 1 / 5",
        desc: "Welcome to LangGraph Studio! This Command Center summarizes live platform health, total code verification runs, self-correction limits, and one-click task specification presets.",
        nextPage: "/generate",
        nextText: "Go to Code Workbench →"
    },
    '/generate': {
        title: "Code Workbench & Verification Studio",
        badge: "PAGE GUIDE: 2 / 5",
        desc: "This workbench lets you submit natural language code specifications in Python, Java, or C++. The Developer agent drafts code, while the Sandbox Verifier executes automated assertion tests.",
        nextPage: "/workflow",
        nextText: "Go to State Graph →"
    },
    '/workflow': {
        title: "Interactive State Graph Canvas",
        badge: "PAGE GUIDE: 3 / 5",
        desc: "This interactive canvas visualizes the LangGraph state machine. Click 'Simulate Backend Execution Step' to step through nodes (START → Developer → Tester → Router → END) and inspect CrewState variables.",
        nextPage: "/execution",
        nextText: "Go to Telemetry →"
    },
    '/execution': {
        title: "System Telemetry & Diagnostics",
        badge: "PAGE GUIDE: 4 / 5",
        desc: "Monitors production API health, circuit breaker status, sliding-window rate limiters, and live streaming diagnostics logs.",
        nextPage: "/history",
        nextText: "Go to Audit Log →"
    },
    '/history': {
        title: "Verification Audit Log",
        badge: "PAGE GUIDE: 5 / 5",
        desc: "Searchable and filterable history of all past verification runs. Click any table row to open the complete source code and execution report modal.",
        nextPage: "/",
        nextText: "Return to Command Center →"
    }
};

function autoAwakenPageGuide() {
    const currentPath = window.location.pathname;
    const pageKey = Object.keys(PAGE_GUIDE_DATA).find(p => p === currentPath) || '/';
    const guide = PAGE_GUIDE_DATA[pageKey];

    if (!document.getElementById('proactiveGuideCard')) {
        const cardHtml = `
            <div id="proactiveGuideCard" class="proactive-guide-card">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-outlined" style="color: var(--accent-terracotta); font-size: 20px;">explore</span>
                        <h3 style="font-size: 15px; font-weight: 700;" id="proactiveTitle">${guide.title}</h3>
                    </div>
                    <button onclick="closeProactiveGuide()" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer;">
                        <span class="material-symbols-outlined" style="font-size: 20px;">close</span>
                    </button>
                </div>

                <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.55; margin-bottom: 16px;" id="proactiveDesc">${guide.desc}</p>

                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span class="cyber-badge cyber-badge-terracotta" style="font-size: 10px;" id="proactiveBadge">${guide.badge}</span>
                    <button class="cyber-btn cyber-btn-primary" style="font-size: 12px; padding: 6px 14px;" onclick="window.location.href='${guide.nextPage}'" id="proactiveNextBtn">${guide.nextText}</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', cardHtml);
    }
}

function closeProactiveGuide() {
    const card = document.getElementById('proactiveGuideCard');
    if (card) {
        card.style.display = 'none';
    }
}

// Global Hover Tooltip System
function initHoverTooltips() {
    let tooltipPopup = document.getElementById('customTooltipPopup');
    if (!tooltipPopup) {
        tooltipPopup = document.createElement('div');
        tooltipPopup.id = 'customTooltipPopup';
        tooltipPopup.className = 'custom-tooltip-popup';
        document.body.appendChild(tooltipPopup);
    }

    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
            const text = target.getAttribute('data-tooltip');
            if (text) {
                tooltipPopup.textContent = text;
                tooltipPopup.style.opacity = '1';

                const rect = target.getBoundingClientRect();
                let top = rect.bottom + 8;
                let left = rect.left + (rect.width / 2) - 140;

                if (left < 10) left = 10;
                if (left + 280 > window.innerWidth) left = window.innerWidth - 290;
                if (top + 60 > window.innerHeight) top = rect.top - 60;

                tooltipPopup.style.top = top + 'px';
                tooltipPopup.style.left = left + 'px';
            }
        }
    });

    document.addEventListener('mouseout', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
            tooltipPopup.style.opacity = '0';
        }
    });
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
    initHoverTooltips();

    // Auto-Awaken Proactive Guide after 600ms
    setTimeout(autoAwakenPageGuide, 600);
});
