// Executive Engineering Platform Controller & Strict Guided Tour Engine

const API_URL = window.location.origin + '/invoke';
const HEALTH_API_URL = window.location.origin + '/health';
const HISTORY_STORAGE_KEY = 'langgraph_studio_history_v3';
const TOUR_GLOBAL_DISABLED_KEY = 'langgraph_global_tour_disabled_v2';
const TOUR_PAGE_SEEN_PREFIX = 'langgraph_tour_page_seen_v2_';

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
                        <div class="cmd-spotlight-item" onclick="startFullTourManually(); closeCommandPalette();">
                            <span style="display:flex; align-items:center; gap:10px;"><span class="material-symbols-outlined">explore</span> Re-launch Guided Tour</span>
                            <span class="cyber-badge cyber-badge-emerald">TOUR</span>
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
        dismissTourPermanently();
    }
});

// Comprehensive Element-by-Element Tour Specification
const FULL_PLATFORM_TOUR = [
    {
        path: '/',
        pageName: 'Command Center',
        nextUrl: '/generate',
        steps: [
            {
                selector: '.top-navbar',
                title: '1/5 Navigation Header Bar',
                desc: 'Floating pill bar with quick links to Overview, Code Workbench, State Graph, Telemetry, and Audit Logs.'
            },
            {
                selector: '[data-tooltip*="Total Executions"]',
                title: '1/5 Metric: Total Executions',
                desc: 'Displays the total number of code verification runs processed by the LangGraph multi-agent engine.'
            },
            {
                selector: '[data-tooltip*="Pass Rate"]',
                title: '1/5 Metric: Verification Pass Rate',
                desc: 'Percentage of code generation runs that executed cleanly without assertion failures.'
            },
            {
                selector: '[data-tooltip*="Self-Fix Ceiling"]',
                title: '1/5 Metric: Self-Fix Ceiling',
                desc: 'Maximum self-correction loops allowed before the conditional edge router terminates.'
            },
            {
                selector: '[data-tooltip*="Runtime Sandbox"]',
                title: '1/5 Metric: Runtime Sandbox Scope',
                desc: 'Supports multi-language execution in Python 3.11, Java 17, and C++ 20.'
            },
            {
                selector: '[data-tooltip*="Task Specification Presets"]',
                title: '1/5 Presets Grid',
                desc: 'One-click task presets (Fibonacci, Palindrome, Safe Division, Data Aggregator) ready for instant execution.'
            },
            {
                selector: '.studio-card:has(.cyber-badge-terracotta)',
                title: '1/5 State Graph Pipeline Overview',
                desc: 'Visual summary of the Developer → Sandbox → Router agent execution chain.'
            },
            {
                selector: '#dashboardHistoryBody',
                title: '1/5 Recent Executions Audit Table',
                desc: 'Real-time table tracking the 5 most recent runs, language tags, pass/fail status, and timestamps.'
            }
        ]
    },
    {
        path: '/generate',
        pageName: 'Code Workbench',
        nextUrl: '/workflow',
        steps: [
            {
                selector: '#taskInput',
                title: '2/5 Task Specification Requirement',
                desc: 'Please specify your coding task by typing in this box OR clicking a quick preset button (Fibonacci, Palindrome, Safe Division) below to unlock the tour!'
            },
            {
                selector: '#langSelectWrapper',
                title: '2/5 Custom Target Language Dropdown',
                desc: 'Bespoke custom web dropdown selector for Python 3.11, Java 17, or C++ 20 target syntax.'
            },
            {
                selector: '#ceilingSelectWrapper',
                title: '2/5 Custom Self-Fix Ceiling Dropdown',
                desc: 'Custom studio dropdown configuring maximum self-correction loops (1, 3, or 5 iterations).'
            },
            {
                selector: '#generateBtn',
                title: '2/5 Execute & Verify Action',
                desc: 'Submits your specification to trigger multi-agent generation, sandbox testing, and assertion checks.'
            },
            {
                selector: '.code-editor-pane:first-child',
                title: '2/5 Solution Code Viewer',
                desc: 'Displays line-numbered source code output generated by the Developer agent.'
            },
            {
                selector: '.code-editor-pane:last-child',
                title: '2/5 Verification Report Terminal',
                desc: 'Displays test stdout/stderr, evaluation output, and assertion results.'
            }
        ]
    },
    {
        path: '/workflow',
        pageName: 'State Graph Canvas',
        nextUrl: '/execution',
        steps: [
            {
                selector: '#canvasTaskInput',
                title: '3/5 Dynamic Task Simulation Bar',
                desc: 'Enter any prompt or pick a preset (Prime Checker, Fibonacci, Palindrome, Factorial) to update the graph canvas.'
            },
            {
                selector: 'svg',
                title: '3/5 Visual State Graph Canvas',
                desc: 'SVG canvas showing active node highlights (START → Developer → Tester → Router → END).'
            },
            {
                selector: '#simStepBtn',
                title: '3/5 Step Simulator Controls',
                desc: 'Step forward node-by-node or click Auto-Play to stream state transitions.'
            },
            {
                selector: '#inspectorCard',
                title: '3/5 High-Legibility State Inspector',
                desc: 'Syntax-highlighted dark containers displaying exact CrewState inputs and updated reducer outputs.'
            }
        ]
    },
    {
        path: '/execution',
        pageName: 'Telemetry & Logs',
        nextUrl: '/history',
        steps: [
            {
                selector: '[data-tooltip*="API Health Status"]',
                title: '4/5 Metric: API Health Status',
                desc: 'Operational status of the FastAPI REST backend engine.'
            },
            {
                selector: '[data-tooltip*="Circuit Breaker"]',
                title: '4/5 Metric: Circuit Breaker Status',
                desc: 'Protection mechanism that trips if consecutive upstream errors occur.'
            },
            {
                selector: '[data-tooltip*="Rate Limiter"]',
                title: '4/5 Metric: Rate Limiter Guardrail',
                desc: 'Sliding-window rate limit guardrail preventing API abuse.'
            },
            {
                selector: '#logTerminal',
                title: '4/5 Live Diagnostics Terminal',
                desc: 'Real-time trace logs streaming system events, health status, and execution flows.'
            }
        ]
    },
    {
        path: '/history',
        pageName: 'Audit Logs',
        nextUrl: '/',
        steps: [
            {
                selector: '#searchInput',
                title: '5/5 Search & Filter Controls',
                desc: 'Search past executions by keyword or filter by Passed/Failed status.'
            },
            {
                selector: 'table',
                title: '5/5 Audit Log Table',
                desc: 'Click any row to open the complete source code and verification report modal.'
            }
        ]
    }
];

let currentTourPageIndex = 0;
let currentTourStepIndex = 0;

function autoAwakenSpotlightTour() {
    const currentPath = window.location.pathname;
    const isGloballyDisabled = localStorage.getItem(TOUR_GLOBAL_DISABLED_KEY) === 'true';
    const isPageSeen = localStorage.getItem(TOUR_PAGE_SEEN_PREFIX + currentPath) === 'true';
    const isManualSession = sessionStorage.getItem('langgraph_manual_tour_session') === 'true';

    if ((isGloballyDisabled || isPageSeen) && !isManualSession) {
        return;
    }

    currentTourPageIndex = FULL_PLATFORM_TOUR.findIndex(p => p.path === currentPath);
    if (currentTourPageIndex === -1) currentTourPageIndex = 0;

    localStorage.setItem(TOUR_PAGE_SEEN_PREFIX + currentPath, 'true');

    if (!document.getElementById('tourCalloutCard')) {
        const calloutHtml = `
            <div id="tourCalloutCard" class="tour-callout-card" style="display: none;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-outlined" style="color: var(--accent-terracotta); font-size: 22px;">explore</span>
                        <h3 style="font-size: 15px; font-weight: 700;" id="tourTitle">Platform Tour Guide</h3>
                    </div>
                    <button onclick="dismissTourPermanently()" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer;" title="Close & Disable Tour">
                        <span class="material-symbols-outlined" style="font-size: 20px;">close</span>
                    </button>
                </div>

                <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 18px;" id="tourDesc"></p>

                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span class="cyber-badge cyber-badge-terracotta" id="tourCounter">Step 1</span>
                    <button class="cyber-btn cyber-btn-primary" style="font-size: 12.5px; padding: 6px 14px;" onclick="nextSpotlightStep()" id="tourNextBtn">Next Element →</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', calloutHtml);
    }

    currentTourStepIndex = 0;
    renderSpotlightStep();
}

function renderSpotlightStep() {
    const pageTour = FULL_PLATFORM_TOUR[currentTourPageIndex];
    if (!pageTour || !pageTour.steps) return;

    document.querySelectorAll('.element-highlighted').forEach(el => el.classList.remove('element-highlighted'));

    const step = pageTour.steps[currentTourStepIndex];
    if (!step) {
        advanceToNextPageInTour();
        return;
    }

    const targetEl = document.querySelector(step.selector);
    const callout = document.getElementById('tourCalloutCard');
    const nextBtn = document.getElementById('tourNextBtn');

    const isLastStepOnPage = currentTourStepIndex === pageTour.steps.length - 1;
    const isLastPage = currentTourPageIndex === FULL_PLATFORM_TOUR.length - 1;

    let buttonText = 'Next Element →';
    if (isLastStepOnPage) {
        if (isLastPage) {
            buttonText = 'Finish Platform Tour 🎉';
        } else {
            buttonText = `Proceed to ${FULL_PLATFORM_TOUR[currentTourPageIndex + 1]?.pageName || 'Next Page'} →`;
        }
    }

    // STRICT USER REQUIREMENT CHECK FOR CODE WORKBENCH (#taskInput Step):
    if (window.location.pathname === '/generate' && currentTourStepIndex === 0) {
        const taskInput = document.getElementById('taskInput');
        const hasText = taskInput && taskInput.value.trim() !== '';

        if (!hasText) {
            if (nextBtn) {
                nextBtn.disabled = true;
                nextBtn.style.opacity = '0.5';
                nextBtn.style.cursor = 'not-allowed';
                nextBtn.title = 'Please enter a task or click a preset button first';
            }

            // Bind input listener to dynamically enable next button when text is provided
            if (taskInput && !taskInput.dataset.tourBound) {
                taskInput.dataset.tourBound = 'true';
                taskInput.addEventListener('input', () => {
                    if (taskInput.value.trim() !== '') {
                        if (nextBtn) {
                            nextBtn.disabled = false;
                            nextBtn.style.opacity = '1';
                            nextBtn.style.cursor = 'pointer';
                            nextBtn.title = '';
                        }
                    }
                });
            }
        } else {
            if (nextBtn) {
                nextBtn.disabled = false;
                nextBtn.style.opacity = '1';
                nextBtn.style.cursor = 'pointer';
                nextBtn.title = '';
            }
        }
    } else {
        if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.style.opacity = '1';
            nextBtn.style.cursor = 'pointer';
            nextBtn.title = '';
        }
    }

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
        document.getElementById('tourCounter').textContent = `${pageTour.pageName} (${currentTourStepIndex + 1}/${pageTour.steps.length})`;
        if (nextBtn) nextBtn.textContent = buttonText;
    } else {
        callout.style.display = 'block';
        callout.style.bottom = '28px';
        callout.style.left = '28px';
        callout.style.top = 'auto';
        document.getElementById('tourTitle').textContent = step.title;
        document.getElementById('tourDesc').textContent = step.desc;
        document.getElementById('tourCounter').textContent = `${pageTour.pageName} (${currentTourStepIndex + 1}/${pageTour.steps.length})`;
        if (nextBtn) nextBtn.textContent = buttonText;
    }
}

function nextSpotlightStep() {
    const pageTour = FULL_PLATFORM_TOUR[currentTourPageIndex];
    
    // Check if on Task Input step on Code Workbench
    if (window.location.pathname === '/generate' && currentTourStepIndex === 0) {
        const taskInput = document.getElementById('taskInput');
        if (!taskInput || !taskInput.value.trim()) {
            const inlineAlert = document.getElementById('taskInlineAlert');
            if (inlineAlert) {
                inlineAlert.style.display = 'flex';
                document.getElementById('taskInlineAlertText').textContent = 'Please enter a task specification or click a quick preset button (Fibonacci, Palindrome, Safe Division) before proceeding.';
            }
            taskInput?.focus();
            return; // STRICT BLOCK: Do not advance until user specifies requirement!
        }
    }

    if (currentTourStepIndex < pageTour.steps.length - 1) {
        currentTourStepIndex++;
        renderSpotlightStep();
    } else {
        advanceToNextPageInTour();
    }
}

function advanceToNextPageInTour() {
    const pageTour = FULL_PLATFORM_TOUR[currentTourPageIndex];
    const isLastPage = currentTourPageIndex === FULL_PLATFORM_TOUR.length - 1;

    if (isLastPage) {
        dismissTourPermanently();
        showToast('🎉 Full platform tour completed from 0 to 100%!', 'success');
    } else if (pageTour && pageTour.nextUrl) {
        const nextTarget = FULL_PLATFORM_TOUR[currentTourPageIndex + 1];
        showToast(`Proceeding to ${nextTarget?.pageName}...`, 'info');
        setTimeout(() => {
            window.location.href = pageTour.nextUrl;
        }, 600);
    } else {
        dismissTourPermanently();
    }
}

function dismissTourPermanently() {
    localStorage.setItem(TOUR_GLOBAL_DISABLED_KEY, 'true');
    FULL_PLATFORM_TOUR.forEach(p => {
        localStorage.setItem(TOUR_PAGE_SEEN_PREFIX + p.path, 'true');
    });
    sessionStorage.removeItem('langgraph_manual_tour_session');
    closeSpotlightTour();
    showToast('Tour completed/dismissed. Click "Platform Guide" anytime to re-run.', 'info');
}

function closeSpotlightTour() {
    document.querySelectorAll('.element-highlighted').forEach(el => el.classList.remove('element-highlighted'));
    const callout = document.getElementById('tourCalloutCard');
    if (callout) callout.style.display = 'none';
}

function startFullTourManually() {
    localStorage.removeItem(TOUR_GLOBAL_DISABLED_KEY);
    FULL_PLATFORM_TOUR.forEach(p => {
        localStorage.removeItem(TOUR_PAGE_SEEN_PREFIX + p.path);
    });
    sessionStorage.setItem('langgraph_manual_tour_session', 'true');
    window.location.href = '/';
}

function openPlatformGuide() {
    startFullTourManually();
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

    // Auto-Awaken Multi-Page Tour after 800ms
    setTimeout(autoAwakenSpotlightTour, 800);
});
