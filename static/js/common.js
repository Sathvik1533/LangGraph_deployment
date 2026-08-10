// Executive Engineering Platform Controller & Autonomous Spotlight Tour Engine

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
        closeSpotlightTour();
    }
});

// Autonomous Element Spotlight Tour Steps per Page
const PAGE_SPOTLIGHT_STEPS = {
    '/': [
        {
            selector: '.top-navbar',
            title: '1. Floating Navigation Header',
            desc: 'Seamlessly switch between Overview, Code Workbench, State Graph, Telemetry, and Audit Logs.',
            nextText: 'Next: Command Center Stats →'
        },
        {
            selector: '.studio-card-hover',
            title: '2. Operational Telemetry Metrics',
            desc: 'Real-time indicators tracking total multi-agent runs, assertion success rate, self-correction ceiling limits, and sandbox language support.',
            nextText: 'Next: Task Presets →'
        },
        {
            selector: '[data-tooltip*="Task Specification Presets"]',
            title: '3. Task Specification Presets',
            desc: 'Pre-configured algorithms (Fibonacci, Palindrome, Safe Division, Data Aggregator) ready for instant multi-agent execution.',
            nextText: 'Next: Audit Table →'
        }
    ],
    '/generate': [
        {
            selector: '#taskInput',
            title: '1. Task Specification Input',
            desc: 'Describe what algorithm or program you want the Developer agent to draft and validate.',
            nextText: 'Next: Language Selector →'
        },
        {
            selector: '#languageSelect',
            title: '2. Multi-Language Target',
            desc: 'Choose target programming language (Python 3.11, Java 17, or C++ 20).',
            nextText: 'Next: Execute Button →'
        },
        {
            selector: '#generateBtn',
            title: '3. Execute & Verify Action',
            desc: 'Triggers the Developer agent, Sandbox execution, and automated assertion checks.',
            nextText: 'Next: Dual Code & Log Viewers →'
        },
        {
            selector: '.code-editor-pane',
            title: '4. Code & Log Workbench',
            desc: 'View generated source code on the left and real-time execution stdout/assertion logs on the right.',
            nextText: 'Finish Tour'
        }
    ],
    '/workflow': [
        {
            selector: 'svg',
            title: '1. State Graph Canvas',
            desc: 'Visual state machine showing node transitions (START → Developer → Tester → Router → END).',
            nextText: 'Next: Step Simulator →'
        },
        {
            selector: '#simStepBtn',
            title: '2. Step Simulator Controls',
            desc: 'Click to advance execution node-by-node or toggle Auto-Play to stream state updates.',
            nextText: 'Next: High-Legibility Inspector →'
        },
        {
            selector: '#inspectorCard',
            title: '3. High-Legibility State Inspector',
            desc: 'Syntax-highlighted dark containers displaying exact CrewState inputs and reducer outputs.',
            nextText: 'Finish Tour'
        }
    ]
};

let currentTourIndex = 0;
let currentTourPageSteps = [];

function autoAwakenSpotlightTour() {
    const currentPath = window.location.pathname;
    const pageKey = Object.keys(PAGE_SPOTLIGHT_STEPS).find(p => p === currentPath) || '/';
    currentTourPageSteps = PAGE_SPOTLIGHT_STEPS[pageKey] || PAGE_SPOTLIGHT_STEPS['/'];

    if (!document.getElementById('tourCalloutCard')) {
        const calloutHtml = `
            <div id="tourCalloutCard" class="tour-callout-card" style="display: none;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-outlined" style="color: var(--accent-terracotta); font-size: 22px;">flag</span>
                        <h3 style="font-size: 16px; font-weight: 700;" id="tourTitle">Feature Spotlight</h3>
                    </div>
                    <button onclick="closeSpotlightTour()" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer;">
                        <span class="material-symbols-outlined" style="font-size: 20px;">close</span>
                    </button>
                </div>

                <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 18px;" id="tourDesc"></p>

                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span class="cyber-badge cyber-badge-terracotta" id="tourCounter">Step 1 of 3</span>
                    <button class="cyber-btn cyber-btn-primary" style="font-size: 12.5px; padding: 6px 14px;" onclick="nextSpotlightStep()" id="tourNextBtn">Next Step →</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', calloutHtml);
    }

    currentTourIndex = 0;
    renderSpotlightStep();
}

function renderSpotlightStep() {
    if (!currentTourPageSteps || currentTourPageSteps.length === 0) return;

    // Clear existing highlights
    document.querySelectorAll('.element-highlighted').forEach(el => el.classList.remove('element-highlighted'));

    const step = currentTourPageSteps[currentTourIndex];
    if (!step) {
        closeSpotlightTour();
        return;
    }

    const targetEl = document.querySelector(step.selector);
    const callout = document.getElementById('tourCalloutCard');

    if (targetEl) {
        targetEl.classList.add('element-highlighted');
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const rect = targetEl.getBoundingClientRect();
        callout.style.display = 'block';

        let top = rect.bottom + 16;
        let left = rect.left;

        if (left + 380 > window.innerWidth) left = window.innerWidth - 400;
        if (left < 20) left = 20;
        if (top + 200 > window.innerHeight) top = rect.top - 210;

        callout.style.top = top + 'px';
        callout.style.left = left + 'px';

        document.getElementById('tourTitle').textContent = step.title;
        document.getElementById('tourDesc').textContent = step.desc;
        document.getElementById('tourCounter').textContent = `Step ${currentTourIndex + 1} of ${currentTourPageSteps.length}`;
        document.getElementById('tourNextBtn').textContent = step.nextText;
    } else {
        // Fallback positioning
        callout.style.display = 'block';
        callout.style.bottom = '28px';
        callout.style.left = '28px';
        callout.style.top = 'auto';
        document.getElementById('tourTitle').textContent = step.title;
        document.getElementById('tourDesc').textContent = step.desc;
        document.getElementById('tourCounter').textContent = `Step ${currentTourIndex + 1} of ${currentTourPageSteps.length}`;
        document.getElementById('tourNextBtn').textContent = step.nextText;
    }
}

function nextSpotlightStep() {
    if (currentTourIndex < currentTourPageSteps.length - 1) {
        currentTourIndex++;
        renderSpotlightStep();
    } else {
        closeSpotlightTour();
        showToast('Autonomous spotlight tour completed!', 'success');
    }
}

function closeSpotlightTour() {
    document.querySelectorAll('.element-highlighted').forEach(el => el.classList.remove('element-highlighted'));
    const callout = document.getElementById('tourCalloutCard');
    if (callout) callout.style.display = 'none';
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

    // Auto-Awaken Spotlight Tour after 800ms
    setTimeout(autoAwakenSpotlightTour, 800);
});
