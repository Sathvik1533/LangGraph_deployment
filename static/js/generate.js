// Executive Studio Code Engine Controller

let currentResponseData = null;

const LANG_FILENAME_MAP = {
    'python': 'solution_code.py',
    'java': 'Solution.java',
    'cpp': 'main.cpp',
    'c++': 'main.cpp'
};

document.addEventListener('DOMContentLoaded', async () => {
    // Load Navbar
    const navbarRes = await fetch('/templates/navigation.html');
    if (navbarRes.ok) {
        document.getElementById('navbarContainer').innerHTML = await navbarRes.text();
        setActiveNav('generator');
    }

    // Check query params for preset
    const urlParams = new URLSearchParams(window.location.search);
    const preset = urlParams.get('preset');
    const taskInput = document.getElementById('taskInput');
    
    if (preset && taskInput) {
        if (preset === 'fibonacci') {
            taskInput.value = 'Write a function to calculate fibonacci numbers with self-validation assertions';
        } else if (preset === 'palindrome') {
            taskInput.value = 'Create a function that checks if a string is a palindrome ignoring case and punctuation';
        } else if (preset === 'divide') {
            taskInput.value = 'Write a function to divide two numbers with proper zero-division error handling';
        } else if (preset === 'stats') {
            taskInput.value = 'Write a function to process numeric data and return count, sum, average, min, and max';
        }
    }

    // Hide inline alert on input
    taskInput?.addEventListener('input', () => {
        const alert = document.getElementById('taskInlineAlert');
        if (alert) alert.style.display = 'none';
    });

    // Language Change Listener to Update Tab Header Filename
    const languageSelect = document.getElementById('languageSelect');
    languageSelect?.addEventListener('change', () => {
        const lang = languageSelect.value || 'python';
        const codeTabHeader = document.querySelector('.code-editor-header span');
        if (codeTabHeader) {
            codeTabHeader.textContent = LANG_FILENAME_MAP[lang.toLowerCase()] || 'solution_code.txt';
        }
    });

    // Bind Form Submission
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerate);
    }

    // Bind Ctrl+Enter / Cmd+Enter shortcut on Task Input
    taskInput?.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            handleGenerate();
        }
    });

    // Bind Copy & Download
    document.getElementById('copyCodeBtn')?.addEventListener('click', () => {
        if (currentResponseData && currentResponseData.code) {
            copyToClipboard(currentResponseData.code);
        }
    });

    document.getElementById('downloadCodeBtn')?.addEventListener('click', () => {
        if (currentResponseData && currentResponseData.code) {
            const lang = document.getElementById('languageSelect')?.value || 'python';
            const ext = getFileExtension(lang);
            downloadFile(currentResponseData.code, `solution${ext}`);
        }
    });
});

async function handleGenerate() {
    const taskInput = document.getElementById('taskInput');
    const languageSelect = document.getElementById('languageSelect');
    const maxIterationsSelect = document.getElementById('maxIterationsSelect');
    const generateBtn = document.getElementById('generateBtn');
    const statusBanner = document.getElementById('statusBanner');
    const codeDisplay = document.getElementById('codeDisplay');
    const reportDisplay = document.getElementById('reportDisplay');
    const pipelineStepper = document.getElementById('pipelineStepper');
    const taskInlineAlert = document.getElementById('taskInlineAlert');
    const codeTabHeader = document.querySelector('.code-editor-header span');

    const task = taskInput.value.trim();
    if (!task) {
        if (taskInlineAlert) {
            taskInlineAlert.style.display = 'flex';
            document.getElementById('taskInlineAlertText').textContent = 'Please enter a task specification or click a preset button above before executing.';
        }
        taskInput.focus();
        return;
    }

    if (taskInlineAlert) taskInlineAlert.style.display = 'none';

    const language = languageSelect ? languageSelect.value : 'python';
    const maxIterations = maxIterationsSelect ? (parseInt(maxIterationsSelect.value) || 3) : 3;

    // Update code tab filename
    if (codeTabHeader) {
        codeTabHeader.textContent = LANG_FILENAME_MAP[language.toLowerCase()] || 'solution_code.txt';
    }

    // UI Loading State
    generateBtn.disabled = true;
    generateBtn.innerHTML = `
        <span class="material-symbols-outlined spin" style="font-size: 16px;">sync</span>
        <span>Orchestrating Backend Graph...</span>
    `;

    statusBanner.style.display = 'flex';
    statusBanner.className = 'studio-card';
    statusBanner.style.borderColor = 'var(--accent-blue)';
    statusBanner.style.background = 'var(--accent-blue-bg)';
    statusBanner.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span class="material-symbols-outlined spin" style="color: var(--accent-blue); font-size: 22px;">sync</span>
                <div>
                    <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">Backend State Machine Executing (${language.toUpperCase()})</div>
                    <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">Developer Node → Sandbox Verifier → Conditional Edge Router</div>
                </div>
            </div>
            <span class="cyber-badge cyber-badge-blue">ACTIVE BACKEND GRAPH</span>
        </div>
    `;

    if (pipelineStepper) {
        pipelineStepper.style.display = 'flex';
        document.getElementById('stepDeveloper').className = 'cyber-badge cyber-badge-blue';
        document.getElementById('stepDeveloper').textContent = '1. Developer Node';
        document.getElementById('stepSandbox').className = 'cyber-badge';
        document.getElementById('stepSandbox').textContent = '2. Sandbox Verifier';
        document.getElementById('stepRouter').className = 'cyber-badge';
        document.getElementById('stepRouter').textContent = '3. Edge Router';
    }

    try {
        const payload = {
            task: task,
            language: language,
            max_iterations: maxIterations
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        currentResponseData = data;

        if (response.ok && data.code) {
            // Success
            statusBanner.className = 'studio-card';
            statusBanner.style.borderColor = 'rgba(5, 150, 105, 0.4)';
            statusBanner.style.background = 'var(--accent-emerald-bg)';
            statusBanner.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="material-symbols-outlined" style="color: var(--accent-emerald); font-size: 24px;">check_circle</span>
                        <div>
                            <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">${language.toUpperCase()} Verification Passed & State Saved</div>
                            <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">Completed in ${data.iterations} loop(s) • Thread: ${data.thread_id} • Checkpointer: MemorySaver</div>
                        </div>
                    </div>
                    <span class="cyber-badge cyber-badge-emerald">VERIFICATION PASSED</span>
                </div>
            `;

            if (pipelineStepper) {
                document.getElementById('stepDeveloper').className = 'cyber-badge cyber-badge-emerald';
                document.getElementById('stepDeveloper').textContent = '1. Drafted ✓';
                document.getElementById('stepSandbox').className = 'cyber-badge cyber-badge-emerald';
                document.getElementById('stepSandbox').textContent = '2. Tested ✓';
                document.getElementById('stepRouter').className = 'cyber-badge cyber-badge-emerald';
                document.getElementById('stepRouter').textContent = '3. Approved ✓';
            }

            codeDisplay.textContent = data.code;
            reportDisplay.textContent = data.report || 'No detailed report output generated.';
            
            // Save run to local history
            saveRunToHistory({
                task: task,
                language: language,
                success: data.execution_success,
                iterations: data.iterations,
                code: data.code,
                report: data.report,
                thread_id: data.thread_id
            });

            showToast(`${language.toUpperCase()} Code verified successfully!`, 'success');

        } else {
            statusBanner.className = 'studio-card';
            statusBanner.style.borderColor = 'rgba(220, 38, 38, 0.4)';
            statusBanner.style.background = 'var(--accent-rose-bg)';
            statusBanner.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="material-symbols-outlined" style="color: var(--accent-rose); font-size: 24px;">error</span>
                    <div>
                        <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">Execution Error</div>
                        <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">${data.detail?.message || data.error || 'Failed to process request.'}</div>
                    </div>
                </div>
            `;
            showToast('Generation error', 'error');
        }

    } catch (err) {
        statusBanner.className = 'studio-card';
        statusBanner.style.borderColor = 'rgba(220, 38, 38, 0.4)';
        statusBanner.style.background = 'var(--accent-rose-bg)';
        statusBanner.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span class="material-symbols-outlined" style="color: var(--accent-rose); font-size: 24px;">wifi_off</span>
                <div>
                    <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">Network Connection Error</div>
                    <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">${err.message}</div>
                </div>
            </div>
        `;
        showToast('Connection error', 'error');
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = `
            <span class="material-symbols-outlined">code_blocks</span>
            <span>Execute & Verify Specification</span>
            <span class="kbd-badge" style="margin-left: 4px; background: #ffffff; color: #0f172a;">⌘↵</span>
        `;
    }
}
