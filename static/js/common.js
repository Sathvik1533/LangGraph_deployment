// Executive Engineering Platform Controller & Auto-Awakening First-Visit Tour Engine

const API_URL = window.location.origin + '/invoke';
const HEALTH_API_URL = window.location.origin + '/health';
const HISTORY_STORAGE_KEY = 'ai_workflow_studio_history_v3';
const TOUR_COMPLETED_KEY = 'ai_workflow_studio_tour_completed_v3';

// Page Stepper Order Definition
const PLATFORM_PAGES = [
    { id: 'dashboard', path: '/', name: 'Overview' },
    { id: 'generator', path: '/generate', name: 'Workspace' },
    { id: 'workflow', path: '/workflow', name: 'Pipeline' },
    { id: 'history', path: '/history', name: 'Runs' }
];

function toggleCustomSelect(trigger, e) {
    if (e) e.stopPropagation();
    const wrapper = trigger ? trigger.closest('.custom-select-wrapper') : null;
    if (!wrapper) return;
    document.querySelectorAll('.custom-select-wrapper').forEach(w => {
        if (w !== wrapper) w.classList.remove('open');
    });
    wrapper.classList.toggle('open');
}

document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select-wrapper').forEach(w => w.classList.remove('open'));
});

function extractTaskIntent(rawTask) {
    if (!rawTask) return "General Code Implementation";
    let intent = rawTask.trim();
    const patterns = [
        /^write\s+(?:a|an)\s+(?:python|java|c\+\+|cpp|javascript|typescript|c)\s+(?:function|script|program|class|module|algorithm)\s+(?:that|to|for|which)\s+/i,
        /^write\s+(?:a|an)\s+(?:function|script|program|class|module|algorithm)\s+(?:that|to|for|which)\s+/i,
        /^create\s+(?:a|an)\s+(?:python|java|c\+\+|cpp|javascript|typescript|c)\s+(?:function|script|program|class|module|algorithm)\s+(?:that|to|for|which|with)\s+/i,
        /^create\s+(?:a|an)\s+(?:function|script|program|class|module|algorithm)\s+(?:that|to|for|which|with)\s+/i,
        /^implement\s+(?:a|an)\s+(?:python|java|c\+\+|cpp|javascript|typescript|c)\s+(?:function|script|program|class|module|algorithm)\s+(?:that|to|for|which|with)\s+/i,
        /^implement\s+(?:a|an)\s+(?:function|script|program|class|module|algorithm)\s+(?:that|to|for|which|with)\s+/i,
        /^build\s+(?:a|an)\s+(?:python|java|c\+\+|cpp|javascript|typescript|c)\s+(?:function|script|program|class|module|algorithm)\s+(?:that|to|for|which|with)\s+/i,
        /^build\s+(?:a|an)\s+(?:function|script|program|class|module|algorithm)\s+(?:that|to|for|which|with)\s+/i
    ];
    for (const pat of patterns) {
        if (pat.test(intent)) {
            intent = intent.replace(pat, '');
            break;
        }
    }
    intent = intent.replace(/\s+(?:in|using|with)\s+(?:python|java|c\+\+|cpp|javascript|typescript|c)\b/gi, '');
    intent = intent.trim();
    if (intent) {
        intent = intent.charAt(0).toUpperCase() + intent.slice(1);
    }
    return intent || "General Code Implementation";
}

function generateArtifactFilename(rawTask, lang) {
    const langMap = { 'python': '.py', 'java': '.java', 'cpp': '.cpp' };
    const ext = langMap[(lang || 'python').toLowerCase()] || '.py';
    let base = (rawTask || 'solution').toLowerCase();
    base = base.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    if (!base) base = 'solution';
    return `${base}${ext}`;
}


// Initialize Page Flow Stepper & Previous/Next Navigation
function initPageFlowStepper() {
    const currentPath = window.location.pathname;
    let currentIndex = PLATFORM_PAGES.findIndex(p => p.path === currentPath);
    if (currentIndex === -1) {
        if (currentPath.includes('generate')) currentIndex = 1;
        else if (currentPath.includes('workflow')) currentIndex = 2;
        else if (currentPath.includes('history')) currentIndex = 3;
        else currentIndex = 0;
    }

    const prevBtn = document.getElementById('pageFlowPrevBtn');
    const nextBtn = document.getElementById('pageFlowNextBtn');
    const prevLabel = document.getElementById('pageFlowPrevLabel');
    const nextLabel = document.getElementById('pageFlowNextLabel');
    const pageFlowBadge = document.getElementById('pageFlowBadge');
    const pageFlowTitle = document.getElementById('pageFlowTitle');

    if (pageFlowBadge) {
        pageFlowBadge.textContent = `${currentIndex + 1} / ${PLATFORM_PAGES.length}`;
    }
    if (pageFlowTitle) {
        pageFlowTitle.textContent = PLATFORM_PAGES[currentIndex]?.name || 'Overview';
    }

    if (prevBtn && nextBtn) {
        if (currentIndex === 0) {
            prevBtn.classList.add('disabled');
            prevBtn.disabled = true;
            if (prevLabel) prevLabel.textContent = 'Previous';
        } else {
            prevBtn.classList.remove('disabled');
            prevBtn.disabled = false;
            const prevPage = PLATFORM_PAGES[currentIndex - 1];
            if (prevLabel) prevLabel.textContent = `← ${prevPage.name}`;
        }

        if (currentIndex === PLATFORM_PAGES.length - 1) {
            nextBtn.classList.add('disabled');
            nextBtn.disabled = true;
            if (nextLabel) nextLabel.textContent = 'Next';
        } else {
            nextBtn.classList.remove('disabled');
            nextBtn.disabled = false;
            const nextPage = PLATFORM_PAGES[currentIndex + 1];
            if (nextLabel) nextLabel.textContent = `${nextPage.name} →`;
        }
    }

    // Highlight active flow stepper node
    document.querySelectorAll('.flow-step-node').forEach((node, idx) => {
        if (idx === currentIndex) {
            node.classList.add('active');
        } else {
            node.classList.remove('active');
        }
    });
}

function navigatePageStep(direction) {
    const currentPath = window.location.pathname;
    let currentIndex = PLATFORM_PAGES.findIndex(p => p.path === currentPath);
    if (currentIndex === -1) {
        if (currentPath.includes('generate')) currentIndex = 1;
        else if (currentPath.includes('workflow')) currentIndex = 2;
        else if (currentPath.includes('history')) currentIndex = 3;
        else currentIndex = 0;
    }

    const targetIndex = currentIndex + direction;
    if (targetIndex >= 0 && targetIndex < PLATFORM_PAGES.length) {
        const targetPage = PLATFORM_PAGES[targetIndex];
        showToast(`Navigating to ${targetPage.name}...`, 'info');
        window.location.href = targetPage.path;
    }
}

const CURRENT_RUN_STORAGE_KEY = 'ai_workflow_current_run';

// Unified State Management: Single Source of Truth across all pages
function getCurrentWorkflowRun() {
    try {
        const raw = localStorage.getItem(CURRENT_RUN_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function setCurrentWorkflowRun(run) {
    try {
        if (!run) {
            localStorage.removeItem(CURRENT_RUN_STORAGE_KEY);
            return;
        }
        localStorage.setItem(CURRENT_RUN_STORAGE_KEY, JSON.stringify(run));
    } catch (e) {
        console.warn('Failed to set current workflow run:', e);
    }
}

// Save run to local & disk history
async function saveRunToHistory(runData) {
    try {
        const entry = {
            id: runData.id || runData.runId || ('run_' + Date.now()),
            timestamp: runData.timestamp || new Date().toISOString(),
            task: runData.task,
            language: runData.language || 'python',
            mode: runData.mode || 'live',
            success: !!runData.success,
            iterations: runData.iterations || 1,
            code: runData.code || '',
            report: runData.report || '',
            thread_id: runData.thread_id || runData.id || ''
        };

        // 1. Save to localStorage
        const history = getRunHistoryLocal();
        const updatedHistory = [entry, ...history.filter(r => r.id !== entry.id)].slice(0, 50);
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));

        // 2. Save to backend disk API
        fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        }).catch(err => console.warn('Failed to sync history to backend API:', err));

        // 3. Update active run state
        setCurrentWorkflowRun({
            ...entry,
            runId: entry.id,
            status: entry.success ? 'SUCCESS' : 'FAILED',
            currentNode: 'END',
            generatedCode: entry.code,
            testResult: entry.report,
            iteration: entry.iterations
        });
    } catch (e) {
        console.warn('Failed to save run to history:', e);
    }
}

function getRunHistoryLocal() {
    try {
        const data = localStorage.getItem(HISTORY_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

async function fetchServerRunHistory() {
    try {
        const res = await fetch('/api/history');
        if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data.runs) && data.runs.length > 0) {
                localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(data.runs));
                return data.runs;
            }
        }
    } catch (e) {
        console.warn('Failed to fetch backend run history:', e);
    }
    return getRunHistoryLocal();
}

function getRunHistory() {
    return getRunHistoryLocal();
}

async function clearRunHistory() {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    try {
        await fetch('/api/history', { method: 'DELETE' });
    } catch (e) {}
    showToast('Audit log history cleared', 'info');
}

// Toast Notification with Positive, Modern Visuals
function showToast(message, type = 'info') {
    const config = {
        info: { icon: 'auto_awesome', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
        success: { icon: 'check_circle', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
        error: { icon: 'error', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
        warning: { icon: 'warning', color: '#d97706', bg: '#fffbeb', border: '#fde68a' }
    };
    
    const cfg = config[type] || config.info;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '10px';
    toast.style.padding = '12px 18px';
    toast.style.borderRadius = '12px';
    toast.style.background = '#0f172a';
    toast.style.color = '#ffffff';
    toast.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)';
    toast.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.zIndex = '99999';
    toast.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
    toast.style.transform = 'translateY(0)';
    
    toast.innerHTML = `
        <span class="material-symbols-outlined" style="color: ${cfg.color}; font-size: 20px;">${cfg.icon}</span>
        <span style="font-size: 13.5px; font-weight: 600;">${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 250);
    }, 2800);
}

// Set Active Navigation (Derived directly from Route/Pathname)
function setActiveNav(pageId) {
    let currentId = pageId;
    if (!currentId) {
        const path = window.location.pathname;
        if (path === '/' || path.includes('overview') || path.includes('dashboard')) currentId = 'dashboard';
        else if (path.includes('generate') || path.includes('workspace')) currentId = 'generator';
        else if (path.includes('workflow') || path.includes('pipeline')) currentId = 'workflow';
        else if (path.includes('history') || path.includes('runs')) currentId = 'history';
        else currentId = 'dashboard';
    }

    document.querySelectorAll('.nav-link-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === currentId) {
            item.classList.add('active');
        }
    });

    document.querySelectorAll('.mobile-nav-link').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === currentId) {
            item.classList.add('active');
        }
    });
}

// Minimize/Close Tour overlay during active execution
function minimizeTourForExecution() {
    sessionStorage.setItem('ai_workflow_tour_dismissed', 'true');
    closeSpotlightTour();
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
    'cpp': '.cpp',
    'c++': '.cpp',
    'c': '.c',
    'javascript': '.js',
    'js': '.js',
    'typescript': '.ts',
    'ts': '.ts'
};

function getFileExtension(lang) {
    return LANGUAGE_EXT[lang.toLowerCase()] || '.txt';
}

function generateArtifactFilename(task, language) {
    const lang = (language || 'python').toLowerCase();
    const ext = LANGUAGE_EXT[lang] || '.py';
    const taskLower = (task || '').toLowerCase();

    let base = 'Solution';
    if (taskLower.includes('linked list') || taskLower.includes('linkedlist') || taskLower.includes('node')) {
        base = 'LinkedList';
    } else if (taskLower.includes('email') || taskLower.includes('validate email')) {
        base = 'EmailValidator';
    } else if (taskLower.includes('binary search tree') || taskLower.includes('bst')) {
        base = 'BinarySearchTree';
    } else if (taskLower.includes('binary search')) {
        base = 'BinarySearch';
    } else if (taskLower.includes('stack')) {
        base = 'Stack';
    } else if (taskLower.includes('queue')) {
        base = 'Queue';
    } else if (taskLower.includes('fibonacci')) {
        base = 'Fibonacci';
    } else if (taskLower.includes('palindrome')) {
        base = 'PalindromeChecker';
    } else if (taskLower.includes('prime')) {
        base = 'PrimeChecker';
    } else if (taskLower.includes('matrix') || taskLower.includes('2d array')) {
        base = 'MatrixOperations';
    } else if (taskLower.includes('sort') || taskLower.includes('quicksort') || taskLower.includes('mergesort')) {
        base = 'SortService';
    } else if (taskLower.includes('todo')) {
        base = 'TodoService';
    } else if (taskLower.includes('reverse')) {
        base = 'StringReverser';
    } else if (taskLower.includes('factorial')) {
        base = 'Factorial';
    } else if (taskLower.includes('stats') || taskLower.includes('statistics')) {
        base = 'StatisticsService';
    } else {
        const cleanTask = task.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        const stopWords = ['write', 'create', 'function', 'code', 'python', 'java', 'cpp', 'that', 'with', 'check', 'calculate', 'using', 'return', 'make', 'program', 'implement', 'build', 'for', 'the', 'and', 'from'];
        const words = cleanTask.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w.toLowerCase())).map(w => w.charAt(0).toUpperCase() + w.slice(1));
        base = words.slice(0, 3).join('') || 'Solution';
    }

    const formattedName = base.charAt(0).toUpperCase() + base.slice(1);
    return `${formattedName}${ext}`;
}

// Command Palette (Cmd + K) Controller
function initCommandPalette() {
    if (!document.getElementById('cmdSpotlightBackdrop')) {
        const modalHtml = `
            <div id="cmdSpotlightBackdrop" class="cmd-spotlight-backdrop">
                <div class="cmd-spotlight-modal" onclick="event.stopPropagation()">
                    <input id="cmdSpotlightInput" class="cmd-spotlight-input" placeholder="Type a command or search platform (Overview, Workspace, Pipeline, Workshop Origin)..." autofocus/>
                    <div>
                        <div class="cmd-spotlight-item" onclick="navigateTo('/')">
                            <span style="display:flex; align-items:center; gap:10px;"><span class="material-symbols-outlined">dashboard</span> Overview & Dashboard</span>
                            <span class="cyber-badge cyber-badge-terracotta">1</span>
                        </div>
                        <div class="cmd-spotlight-item" onclick="navigateTo('/generate')">
                            <span style="display:flex; align-items:center; gap:10px;"><span class="material-symbols-outlined">code_blocks</span> Workspace & Human Review</span>
                            <span class="cyber-badge cyber-badge-terracotta">2</span>
                        </div>
                        <div class="cmd-spotlight-item" onclick="navigateTo('/workflow')">
                            <span style="display:flex; align-items:center; gap:10px;"><span class="material-symbols-outlined">account_tree</span> Interactive Pipeline Visualizer</span>
                            <span class="cyber-badge cyber-badge-terracotta">3</span>
                        </div>
                        <div class="cmd-spotlight-item" onclick="navigateTo('/execution')">
                            <span style="display:flex; align-items:center; gap:10px;"><span class="material-symbols-outlined">analytics</span> Telemetry & Health</span>
                            <span class="cyber-badge cyber-badge-terracotta">4</span>
                        </div>
                        <div class="cmd-spotlight-item" onclick="navigateTo('/history')">
                            <span style="display:flex; align-items:center; gap:10px;"><span class="material-symbols-outlined">history</span> Audit Log History</span>
                            <span class="cyber-badge cyber-badge-terracotta">5</span>
                        </div>
                        <div class="cmd-spotlight-item" onclick="openWorkshopOriginModal(); closeCommandPalette();">
                            <span style="display:flex; align-items:center; gap:10px;"><span class="material-symbols-outlined">info</span> Workshop Origin (Project → Product)</span>
                            <span class="cyber-badge cyber-badge-indigo">ORIGIN</span>
                        </div>
                        <div class="cmd-spotlight-item" onclick="openPlatformGuide(); closeCommandPalette();">
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
        closeWorkshopOriginModal();
        dismissTourPermanently();
    }
});

// ==========================================================================
// WORKSHOP ORIGIN MODAL CONTROLLER ("WHERE IT STARTED" / "PROJECT -> PRODUCT")
// ==========================================================================
function initWorkshopOriginModal() {
    if (!document.getElementById('workshopOriginBackdrop')) {
        const modalHtml = `
            <div id="workshopOriginBackdrop" class="workshop-origin-modal-backdrop" onclick="closeWorkshopOriginModal()">
                <div class="workshop-origin-modal" onclick="event.stopPropagation()">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div class="brand-icon" style="background: var(--accent-terracotta);">
                                <span class="material-symbols-outlined" style="font-size: 20px;">history_edu</span>
                            </div>
                            <div>
                                <h2 style="font-size: 18px; font-weight: 700; margin: 0;">Where It Started — Project → Product</h2>
                                <p style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">From a LangGraph workshop assignment to a production AI workflow platform.</p>
                            </div>
                        </div>
                        <button onclick="closeWorkshopOriginModal()" style="background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px;">
                            <span class="material-symbols-outlined" style="font-size: 22px;">close</span>
                        </button>
                    </div>

                    <div style="margin-bottom: 24px; line-height: 1.65; color: var(--text-secondary); font-size: 14px;">
                        <p style="margin-bottom: 14px;">
                            This project began as a <strong>LangGraph multi-agent workshop assignment</strong> designed to demonstrate state-based collaboration between specialized AI agents:
                        </p>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-bottom: 18px;">
                            <div style="background: #f8fafc; border: 1px solid var(--border-subtle); border-radius: 10px; padding: 12px;">
                                <div style="font-weight: 700; color: #ea580c; font-size: 13px;">1. Developer Agent</div>
                                <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">Drafts candidate code solutions tailored to the user prompt.</div>
                            </div>
                            <div style="background: #f8fafc; border: 1px solid var(--border-subtle); border-radius: 10px; padding: 12px;">
                                <div style="font-weight: 700; color: #6366f1; font-size: 13px;">2. Reviewer / HITL</div>
                                <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">Human & AI gate inspects, modifies, and approves code.</div>
                            </div>
                            <div style="background: #f8fafc; border: 1px solid var(--border-subtle); border-radius: 10px; padding: 12px;">
                                <div style="font-weight: 700; color: #059669; font-size: 13px;">3. Tester Agent</div>
                                <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">Automated sandbox execution with self-healing feedback loop.</div>
                            </div>
                        </div>
                        <p style="margin-bottom: 14px;">
                            Instead of stopping at a developer playground, we wrapped the underlying workflow into <strong>AI Workflow Studio</strong> — adding an interactive visual state graph, 7-layer security guardrails, live code editing gates, and end-to-end telemetry.
                        </p>
                    </div>

                    <div style="display: flex; gap: 12px; justify-content: flex-end; flex-wrap: wrap; border-top: 1px solid var(--border-subtle); padding-top: 18px;">
                        <button class="cyber-btn cyber-btn-secondary" onclick="closeWorkshopOriginModal(); if (typeof openSecurityLabModal === 'function') openSecurityLabModal(); else window.location.href='/?openLab=true';" style="font-size: 13px;">
                            <span class="material-symbols-outlined" style="font-size: 16px; color: var(--accent-indigo);">science</span>
                            <span>Security Lab</span>
                        </button>
                        <a href="https://langgraph-deployment-qhy0.onrender.com/" target="_blank" rel="noopener noreferrer" class="cyber-btn cyber-btn-secondary" style="font-size: 13px; text-decoration: none;">
                            <span class="material-symbols-outlined" style="font-size: 16px;">open_in_new</span>
                            Open Original Workshop Playground
                        </a>
                        <button class="cyber-btn cyber-btn-primary" onclick="closeWorkshopOriginModal()" style="font-size: 13px;">
                            <span>Continue in Product</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
}

function openWorkshopOriginModal() {
    initWorkshopOriginModal();
    const backdrop = document.getElementById('workshopOriginBackdrop');
    if (backdrop) backdrop.style.display = 'flex';
}

function closeWorkshopOriginModal() {
    const backdrop = document.getElementById('workshopOriginBackdrop');
    if (backdrop) backdrop.style.display = 'none';
}

// ==========================================================================
// 6-STEP GUIDED PRODUCT TOUR (OVERVIEW ➔ WORKSPACE ➔ PIPELINE ➔ RESULT ➔ UNDER THE HOOD)
// ==========================================================================
const FULL_PLATFORM_TOUR = [
    {
        path: '/',
        pageName: 'Overview',
        nextUrl: '/generate',
        steps: [
            {
                selector: '.top-navbar',
                title: 'Step 1: Welcome to AI Workflow Studio',
                desc: 'AI Workflow Studio coordinates specialized AI agents (Developer, Reviewer Gate, and Sandbox Tester) through a reliable LangGraph state machine with automatic self-healing loops.'
            }
        ]
    },
    {
        path: '/generate',
        pageName: 'Workspace',
        nextUrl: '/workflow',
        steps: [
            {
                selector: '#taskInput',
                title: 'Step 2: Workspace & Task Specification',
                desc: 'Enter any coding task, choose your target programming language (Python, Java, C++), and optionally enable the Human Review Gate for live sign-off before testing.'
            },
            {
                selector: '#workflowStageBanner',
                title: 'Step 3: Workflow Execution Lifecycle',
                desc: 'Click "Run Workflow" to launch the pipeline: Developer Agent drafts code ➔ Sandbox Tester executes assertions ➔ Self-Healing Loop fixes failures ➔ Verified Result is produced.'
            },
            {
                selector: '.workbench-output-grid',
                title: 'Step 4: Verified Results & Code Conversion',
                desc: 'View actual verified source code and test outputs with 1-click clipboard copy, file download, and dynamic translation into Python, Java, or C++.'
            }
        ]
    },
    {
        path: '/workflow',
        pageName: 'Pipeline',
        nextUrl: '/history',
        steps: [
            {
                selector: '#stateGraphSvg, svg',
                title: 'Step 5: Execution Details & State Machine Visualizer',
                desc: 'Watch real-time state channel updates, animated token orbs, sandbox assertion evaluations, and the traceback feedback loop that powers agentic self-healing.'
            }
        ]
    },
    {
        path: '/history',
        pageName: 'Runs',
        nextUrl: '/',
        steps: [
            {
                selector: 'table, #historyTableBody',
                title: 'Step 6: Runs History & Under the Hood',
                desc: 'Review complete audit trails of all past runs with thread IDs and test outputs. Click "Under the Hood" in the navbar anytime to explore how LangGraph powers this architecture.'
            }
        ]
    }
];

let currentTourPageIndex = 0;
let currentTourStepIndex = 0;

function getTouredPages() {
    try {
        return JSON.parse(sessionStorage.getItem('ai_workflow_toured_pages') || '[]');
    } catch(e) { return []; }
}

function markPageToured(path) {
    const pages = getTouredPages();
    if (!pages.includes(path)) {
        pages.push(path);
        sessionStorage.setItem('ai_workflow_toured_pages', JSON.stringify(pages));
    }
}

function autoAwakenSpotlightTour(forceLaunch = false) {
    const currentPath = window.location.pathname;
    const isCompleted = localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
    const isDismissed = sessionStorage.getItem('ai_workflow_tour_dismissed') === 'true';
    const isManualSession = sessionStorage.getItem('ai_workflow_manual_tour_session') === 'true';

    // IF TOUR WAS COMPLETED OR EXPLICITLY DISMISSED, DO NOT AUTO-TRIGGER UNLESS MANUALLY REQUESTED
    if (!forceLaunch && (isCompleted || isDismissed) && !isManualSession) {
        return;
    }

    // IF THIS SPECIFIC PAGE WAS ALREADY TOURED IN THIS SESSION, DO NOT RE-TRIGGER UNLESS FORCED
    const touredPages = getTouredPages();
    if (!forceLaunch && touredPages.includes(currentPath) && !isManualSession) {
        return;
    }

    // Mark this page as toured
    markPageToured(currentPath);

    currentTourPageIndex = FULL_PLATFORM_TOUR.findIndex(p => p.path === currentPath);
    if (currentTourPageIndex === -1) {
        if (currentPath.includes('generate')) currentTourPageIndex = 1;
        else if (currentPath.includes('workflow')) currentTourPageIndex = 2;
        else if (currentPath.includes('history')) currentTourPageIndex = 3;
        else currentTourPageIndex = 0;
    }

    ensureTourCalloutExists();
    currentTourStepIndex = 0;
    
    const resumeStep = sessionStorage.getItem('ai_workflow_tour_resume_step');
    if (resumeStep !== null) {
        currentTourStepIndex = parseInt(resumeStep, 10);
        sessionStorage.removeItem('ai_workflow_tour_resume_step');
    }

    renderSpotlightStep();
}

function ensureTourCalloutExists() {
    if (!document.getElementById('tourCalloutCard')) {
        const calloutHtml = `
            <div id="tourCalloutCard" class="tour-callout-card" style="display: none; position: fixed; z-index: 99999; width: 400px; max-width: calc(100vw - 32px); background: #ffffff; border: 1px solid var(--border-subtle); border-radius: 16px; padding: 22px; box-shadow: 0 20px 35px -5px rgba(0,0,0,0.25), 0 10px 15px -5px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-outlined" style="color: var(--accent-terracotta); font-size: 22px;">explore</span>
                        <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary);" id="tourTitle">AI Workflow Studio Guide</h3>
                    </div>
                    <button onclick="dismissTourPermanently()" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 6px;" title="Close Tour">
                        <span class="material-symbols-outlined" style="font-size: 20px;">close</span>
                    </button>
                </div>

                <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 18px;" id="tourDesc"></p>

                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
                    <span class="cyber-badge cyber-badge-terracotta" id="tourCounter">Step 1</span>
                    <div style="display: flex; gap: 8px;">
                        <button class="cyber-btn cyber-btn-secondary" style="font-size: 12px; padding: 6px 12px; border-radius: var(--radius-pill);" onclick="prevSpotlightStep()" id="tourPrevBtn">← Back</button>
                        <button class="cyber-btn cyber-btn-primary" style="font-size: 12px; padding: 6px 14px; border-radius: var(--radius-pill);" onclick="nextSpotlightStep()" id="tourNextBtn">Next →</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', calloutHtml);
    }
}

function renderSpotlightStep() {
    ensureTourCalloutExists();
    const pageTour = FULL_PLATFORM_TOUR[currentTourPageIndex];
    if (!pageTour || !pageTour.steps) return;

    // Show subordinate flow bar when tour is actively running
    const flowBar = document.getElementById('pageFlowBarContainer');
    if (flowBar) flowBar.classList.add('active');

    document.querySelectorAll('.element-highlighted').forEach(el => el.classList.remove('element-highlighted'));

    const step = pageTour.steps[currentTourStepIndex];
    if (!step) {
        advanceToNextPageInTour();
        return;
    }

    const targetEl = document.querySelector(step.selector);
    const callout = document.getElementById('tourCalloutCard');
    const nextBtn = document.getElementById('tourNextBtn');
    const prevBtn = document.getElementById('tourPrevBtn');

    if (prevBtn) {
        if (currentTourStepIndex === 0 && currentTourPageIndex === 0) {
            prevBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'inline-flex';
        }
    }

    const isLastStepOnPage = currentTourStepIndex === pageTour.steps.length - 1;
    const isLastPage = currentTourPageIndex === FULL_PLATFORM_TOUR.length - 1;

    let buttonText = 'Next →';
    if (isLastStepOnPage) {
        if (isLastPage) {
            buttonText = 'Finish Tour 🎉';
        } else {
            buttonText = `Next: ${FULL_PLATFORM_TOUR[currentTourPageIndex + 1]?.pageName || 'Next Page'} →`;
        }
    }

    if (nextBtn) {
        nextBtn.textContent = buttonText;
        nextBtn.disabled = false;
        nextBtn.style.opacity = '1';
        nextBtn.style.cursor = 'pointer';
    }

    document.getElementById('tourTitle').textContent = step.title;
    document.getElementById('tourDesc').textContent = step.desc;
    
    let globalStepIndex = 0;
    let totalSteps = 0;
    for (let i = 0; i < FULL_PLATFORM_TOUR.length; i++) {
        totalSteps += FULL_PLATFORM_TOUR[i].steps.length;
        if (i < currentTourPageIndex) {
            globalStepIndex += FULL_PLATFORM_TOUR[i].steps.length;
        } else if (i === currentTourPageIndex) {
            globalStepIndex += currentTourStepIndex + 1;
        }
    }
    
    document.getElementById('tourCounter').textContent = `Step ${globalStepIndex} / ${totalSteps}`;

    if (targetEl) {
        targetEl.classList.add('element-highlighted');
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const rect = targetEl.getBoundingClientRect();
        callout.style.display = 'block';

        const cardWidth = 400;
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
        callout.style.bottom = 'auto';
    } else {
        callout.style.display = 'block';
        callout.style.bottom = '28px';
        callout.style.left = '28px';
        callout.style.top = 'auto';
    }
}

function prevSpotlightStep() {
    if (currentTourStepIndex > 0) {
        currentTourStepIndex--;
        renderSpotlightStep();
    } else if (currentTourPageIndex > 0) {
        const prevTarget = FULL_PLATFORM_TOUR[currentTourPageIndex - 1];
        sessionStorage.setItem('ai_workflow_manual_tour_session', 'true');
        sessionStorage.setItem('ai_workflow_tour_resume_step', prevTarget.steps.length - 1);
        showToast(`Returning to ${prevTarget.pageName}...`, 'info');
        window.location.href = prevTarget.path;
    }
}

function nextSpotlightStep() {
    const pageTour = FULL_PLATFORM_TOUR[currentTourPageIndex];
    if (!pageTour) return;

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
        showToast('🎉 You completed the full platform tour!', 'success');
    } else if (pageTour && pageTour.nextUrl) {
        const nextTarget = FULL_PLATFORM_TOUR[currentTourPageIndex + 1];
        sessionStorage.setItem('ai_workflow_manual_tour_session', 'true');
        showToast(`Proceeding to ${nextTarget?.pageName}...`, 'info');
        setTimeout(() => {
            window.location.href = pageTour.nextUrl;
        }, 500);
    } else {
        dismissTourPermanently();
    }
}

function dismissTourPermanently() {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    sessionStorage.setItem('ai_workflow_tour_dismissed', 'true');
    sessionStorage.removeItem('ai_workflow_manual_tour_session');
    closeSpotlightTour();
    showToast('Tour closed. Click "Tour" in navbar anytime to reopen!', 'info');
}

function closeSpotlightTour() {
    document.querySelectorAll('.element-highlighted').forEach(el => el.classList.remove('element-highlighted'));
    const callout = document.getElementById('tourCalloutCard');
    if (callout) callout.style.display = 'none';

    const flowBar = document.getElementById('pageFlowBarContainer');
    if (flowBar) flowBar.classList.remove('active');
}

function openPlatformGuide() {
    sessionStorage.removeItem('ai_workflow_tour_dismissed');
    sessionStorage.setItem('ai_workflow_manual_tour_session', 'true');
    autoAwakenSpotlightTour(true);
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

                // Position above the target element by default to prevent covering buttons/inputs below
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

window.toggleMobileNav = function() {
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
};

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    let pageId = 'dashboard';
    
    if (path.includes('generate')) pageId = 'generator';
    else if (path.includes('workflow')) pageId = 'workflow';
    else if (path.includes('execution')) pageId = 'execution';
    else if (path.includes('history')) pageId = 'history';
    
    setActiveNav(pageId);
    initPageFlowStepper();
    initCommandPalette();
    initWorkshopOriginModal();
    initHoverTooltips();

    // Auto-Awaken Multi-Page Tour after 600ms for First Visit
    setTimeout(autoAwakenSpotlightTour, 600);
});

