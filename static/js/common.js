// Executive Engineering Platform Controller & Auto-Awakening First-Visit Tour Engine

const API_URL = window.location.origin + '/invoke';
const HEALTH_API_URL = window.location.origin + '/health';
const HISTORY_STORAGE_KEY = 'langgraph_studio_history_v3';
const TOUR_COMPLETED_KEY = 'langgraph_v3_tour_completed';

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

// Comprehensive Element-by-Element Tour Specification in Plain English
const FULL_PLATFORM_TOUR = [
    {
        path: '/',
        pageName: 'Command Center',
        nextUrl: '/generate',
        steps: [
            {
                selector: '.top-navbar',
                title: '1/5 Navigation Bar',
                desc: 'Use these top links to easily move between the Overview, Code Workbench, State Graph, Telemetry, and Audit Log pages.'
            },
            {
                selector: '[data-tooltip*="Total Executions"]',
                title: '1/5 Total Tasks Completed',
                desc: 'Shows how many coding tasks our AI team has generated and tested so far.'
            },
            {
                selector: '[data-tooltip*="Pass Rate"]',
                title: '1/5 Test Pass Rate',
                desc: 'The percentage of AI-generated code that passed all automated test checks cleanly.'
            },
            {
                selector: '[data-tooltip*="Self-Fix Ceiling"]',
                title: '1/5 Max Fix Attempts',
                desc: 'The maximum number of times (up to 3 times) the AI can automatically fix its own code if an error happens.'
            },
            {
                selector: '[data-tooltip*="Coding Languages"]',
                title: '1/5 Supported Languages',
                desc: 'You can generate and test code in Python, Java, or C++.'
            },
            {
                selector: '[data-tooltip*="Task Specification Presets"]',
                title: '1/5 Ready-Made Examples',
                desc: 'Click any example (like Prime Checker or Fibonacci) to generate code instantly.'
            },
            {
                selector: '.studio-card:has(.cyber-badge-terracotta)',
                title: '1/5 AI Team Pipeline',
                desc: 'Shows how our AI team works together: Developer writes code -> Tester tests code -> Router fixes errors.'
            },
            {
                selector: '#dashboardHistoryBody',
                title: '1/5 Recent Activity Log',
                desc: 'A real-time list of your 5 most recent code generation tasks and whether they passed or failed.'
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
                title: '2/5 Task Specification Input',
                desc: 'Please type what program you want to build in this box, OR click one of the quick preset buttons below (Fibonacci, Palindrome, Safe Division) to continue!'
            },
            {
                selector: '#langSelectWrapper',
                title: '2/5 Target Language Selector',
                desc: 'Choose whether you want your code written in Python 3.11, Java 17, or C++ 20.'
            },
            {
                selector: '#ceilingSelectWrapper',
                title: '2/5 Self-Fix Limit',
                desc: 'Choose how many times (1, 3, or 5 loops) the AI can try fixing its own code errors.'
            },
            {
                selector: '#generateBtn',
                title: '2/5 Run Task Button',
                desc: 'Click this button to start the AI code generation and run automatic test checks.'
            },
            {
                selector: '.code-editor-pane:first-child',
                title: '2/5 Generated Code Window',
                desc: 'Displays the complete source code written by our Developer AI.'
            },
            {
                selector: '.code-editor-pane:last-child',
                title: '2/5 Test Results Terminal',
                desc: 'Displays the test results and log outputs from running your code.'
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
                title: '3/5 Task Simulator Bar',
                desc: 'Type any task or pick a preset to update the live visual graph diagram.'
            },
            {
                selector: 'svg',
                title: '3/5 Visual State Graph Diagram',
                desc: 'A visual diagram showing how data flows between our AI agents (START -> Developer -> Tester -> Router -> END).'
            },
            {
                selector: '#simStepBtn',
                title: '3/5 Simulator Controls',
                desc: 'Click "Step Forward" to move step-by-step through the process, OR click "Auto-Play Tour" to watch active nodes glow in real time!'
            },
            {
                selector: '#inspectorCard',
                title: '3/5 State Inspector Card',
                desc: 'Displays the exact input payload and code output at each step of the process.'
            }
        ]
    },
    {
        path: '/execution',
        pageName: 'Telemetry & Logs',
        nextUrl: '/history',
        steps: [
            {
                selector: '[data-tooltip*="System Status"]',
                title: '4/5 Server Status',
                desc: 'Shows if our server and AI helpers are online and ready to build your code.'
            },
            {
                selector: '[data-tooltip*="Safety Guard"]',
                title: '4/5 Safety Guard',
                desc: 'Automatically pauses requests if server issues occur, protecting your app from crashing.'
            },
            {
                selector: '[data-tooltip*="Speed Limiter"]',
                title: '4/5 Speed Limiter',
                desc: 'Prevents too many requests at once so everyone gets fast and reliable answers.'
            },
            {
                selector: '#logTerminal',
                title: '4/5 Live System Log Stream',
                desc: 'A live scrolling terminal showing internal system health logs and execution events.'
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
                title: '5/5 Search & Filter Bar',
                desc: 'Search past code runs by keyword or filter by Passed/Failed status.'
            },
            {
                selector: 'table',
                title: '5/5 Audit History Table',
                desc: 'Click any row in this table to open a pop-up window showing the full source code and test details.'
            }
        ]
    }
];

let currentTourPageIndex = 0;
let currentTourStepIndex = 0;

function getTouredPages() {
    try {
        return JSON.parse(sessionStorage.getItem('langgraph_toured_pages') || '[]');
    } catch(e) { return []; }
}

function markPageToured(path) {
    const pages = getTouredPages();
    if (!pages.includes(path)) {
        pages.push(path);
        sessionStorage.setItem('langgraph_toured_pages', JSON.stringify(pages));
    }
}

function autoAwakenSpotlightTour() {
    const currentPath = window.location.pathname;
    const isCompleted = localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
    const isDismissed = sessionStorage.getItem('langgraph_tour_dismissed') === 'true';
    const isTourInProgress = sessionStorage.getItem('langgraph_tour_in_progress') === 'true';
    const isManualSession = sessionStorage.getItem('langgraph_manual_tour_session') === 'true';

    // IF TOUR WAS COMPLETED OR EXPLICITLY DISMISSED, DO NOT AUTO-TRIGGER AGAIN
    if ((isCompleted || isDismissed) && !isManualSession) {
        console.log(`💡 Tour completed or dismissed. Stopping auto-trigger on ${currentPath}.`);
        return;
    }

    // IF THIS SPECIFIC PAGE WAS ALREADY TOURED IN THIS SESSION, DO NOT RE-TRIGGER
    const touredPages = getTouredPages();
    if (touredPages.includes(currentPath) && !isManualSession) {
        console.log(`💡 Page ${currentPath} already toured. Skipping auto-trigger.`);
        return;
    }

    if (!isTourInProgress && !isManualSession) {
        sessionStorage.setItem('langgraph_tour_in_progress', 'true');
    }

    // Mark this page as toured
    markPageToured(currentPath);

    currentTourPageIndex = FULL_PLATFORM_TOUR.findIndex(p => p.path === currentPath);
    if (currentTourPageIndex === -1) currentTourPageIndex = 0;

    if (!document.getElementById('tourCalloutCard')) {
        const calloutHtml = `
            <div id="tourCalloutCard" class="tour-callout-card" style="display: none;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-outlined" style="color: var(--accent-terracotta); font-size: 22px;">explore</span>
                        <h3 style="font-size: 15px; font-weight: 700;" id="tourTitle">Platform Tour Guide</h3>
                    </div>
                    <button onclick="dismissTourPermanently()" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer;" title="Close & Stop Tour">
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

        const cardWidth = 380;
        const cardHeight = 220;

        let top = rect.bottom + 16;
        let left = rect.left;

        if (top + cardHeight > window.innerHeight - 20) {
            top = rect.top - cardHeight - 16;
        }

        top = Math.max(88, Math.min(top, window.innerHeight - cardHeight - 20));
        left = Math.max(20, Math.min(left, window.innerWidth - cardWidth - 20));

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
    
    if (window.location.pathname === '/generate' && currentTourStepIndex === 0) {
        const taskInput = document.getElementById('taskInput');
        if (!taskInput || !taskInput.value.trim()) {
            const inlineAlert = document.getElementById('taskInlineAlert');
            if (inlineAlert) {
                inlineAlert.style.display = 'flex';
                document.getElementById('taskInlineAlertText').textContent = 'Please enter a task specification or click a quick preset button (Fibonacci, Palindrome, Safe Division) before proceeding.';
            }
            taskInput?.focus();
            return;
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
        sessionStorage.setItem('langgraph_tour_in_progress', 'true');
        showToast(`Proceeding to ${nextTarget?.pageName}...`, 'info');
        setTimeout(() => {
            window.location.href = pageTour.nextUrl;
        }, 600);
    } else {
        dismissTourPermanently();
    }
}

function dismissTourPermanently() {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    sessionStorage.setItem('langgraph_tour_dismissed', 'true');
    sessionStorage.removeItem('langgraph_tour_in_progress');
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
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    sessionStorage.removeItem('langgraph_tour_dismissed');
    sessionStorage.removeItem('langgraph_toured_pages');
    sessionStorage.setItem('langgraph_tour_in_progress', 'true');
    sessionStorage.setItem('langgraph_manual_tour_session', 'true');
    window.location.href = '/';
}

function openPlatformGuide() {
    startFullTourManually();
}

// Global Hover Tooltip System (Smart Top-Positioned & Unobstructive)
function initHoverTooltips() {
    let tooltipPopup = document.getElementById('customTooltipPopup');
    if (!tooltipPopup) {
        tooltipPopup = document.createElement('div');
        tooltipPopup.id = 'customTooltipPopup';
        tooltipPopup.className = 'custom-tooltip-popup';
        tooltipPopup.style.pointerEvents = 'none';
        document.body.appendChild(tooltipPopup);
    }

    document.addEventListener('mouseover', (e) => {
        // Do not display tooltips if a custom dropdown menu is currently open
        if (document.querySelector('.custom-select-wrapper.open')) {
            tooltipPopup.style.opacity = '0';
            return;
        }

        const target = e.target.closest('[data-tooltip]');
        if (target) {
            const text = target.getAttribute('data-tooltip');
            if (text) {
                tooltipPopup.textContent = text;
                tooltipPopup.style.opacity = '1';

                const rect = target.getBoundingClientRect();
                const tooltipHeight = tooltipPopup.offsetHeight || 44;
                const tooltipWidth = tooltipPopup.offsetWidth || 240;

                // Position above the target element by default to prevent covering dropdowns/inputs below
                let top = rect.top - tooltipHeight - 10;
                let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);

                if (top < 10) {
                    // Fallback to below if top viewport edge is reached
                    top = rect.bottom + 10;
                }

                if (left < 10) left = 10;
                if (left + tooltipWidth > window.innerWidth - 10) left = window.innerWidth - tooltipWidth - 10;

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

    // Auto-Awaken Multi-Page Tour after 600ms for First Visit
    setTimeout(autoAwakenSpotlightTour, 600);
});

// Mobile Navigation Drawer Toggle
function toggleMobileNav() {
    const overlay = document.getElementById('mobileNavOverlay');
    const drawer = document.getElementById('mobileNavDrawer');
    const icon = document.getElementById('mobileMenuIcon');
    if (!drawer) return;
    const isOpen = drawer.classList.contains('open');
    if (isOpen) {
        drawer.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        if (icon) icon.textContent = 'menu';
    } else {
        drawer.classList.add('open');
        if (overlay) overlay.classList.add('open');
        if (icon) icon.textContent = 'close';
    }
}

