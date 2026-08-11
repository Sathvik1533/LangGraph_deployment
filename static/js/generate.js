// Executive Studio Code Engine Controller

let currentResponseData = null;

function generateArtifactFilename(task, language) {
    const lang = (language || 'python').toLowerCase();
    const extMap = {
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
    const ext = extMap[lang] || '.py';
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
    // Remove language suffixes
    intent = intent.replace(/\s+(?:in|using|with)\s+(?:python|java|c\+\+|cpp|javascript|typescript|c)\b/gi, '');
    intent = intent.trim();
    if (intent) {
        intent = intent.charAt(0).toUpperCase() + intent.slice(1);
    }
    return intent || "General Code Implementation";
}

function updateTaskIntentPreview() {
    const taskInput = document.getElementById('taskInput');
    const languageSelect = document.getElementById('languageSelect');
    const taskIntentDisplay = document.getElementById('taskIntentDisplay');
    const authoritativeLangDisplay = document.getElementById('authoritativeLangDisplay');

    const task = taskInput ? taskInput.value.trim() : '';
    const lang = languageSelect ? languageSelect.value.toLowerCase() : 'python';
    const intent = extractTaskIntent(task);

    if (taskIntentDisplay) {
        taskIntentDisplay.textContent = intent;
    }

    if (authoritativeLangDisplay) {
        const langMap = {
            'python': { label: 'PYTHON 3.11', cls: 'cyber-badge-indigo' },
            'java': { label: 'JAVA 17', cls: 'cyber-badge-terracotta' },
            'cpp': { label: 'C++ 20', cls: 'cyber-badge-emerald' }
        };
        const info = langMap[lang] || { label: lang.toUpperCase(), cls: 'cyber-badge-indigo' };
        authoritativeLangDisplay.textContent = info.label;
        authoritativeLangDisplay.className = `cyber-badge ${info.cls}`;
    }
}

function updateCodeEditorHeader() {
    const taskInput = document.getElementById('taskInput');
    const languageSelect = document.getElementById('languageSelect');
    const codeTabHeader = document.querySelector('.code-editor-header span') || document.getElementById('codeEditorHeaderLabel');
    if (!codeTabHeader) return;

    const task = taskInput ? taskInput.value.trim() : '';
    const lang = languageSelect ? languageSelect.value : 'python';
    
    if (currentResponseData && currentResponseData.filename) {
        codeTabHeader.textContent = currentResponseData.filename;
    } else if (task) {
        codeTabHeader.textContent = generateArtifactFilename(task, lang);
    } else {
        codeTabHeader.textContent = generateArtifactFilename('', lang);
    }
    updateTaskIntentPreview();
}

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
    if (taskInput && !taskInput.value.trim()) {
        taskInput.value = 'Write a Python function that reverses a string and create tests for it.';
    }
    
    if (preset && taskInput) {
        if (preset === 'reverser' || preset === 'string') {
            taskInput.value = 'Write a Python function that reverses a string and create tests for it.';
        } else if (preset === 'email') {
            taskInput.value = 'Write a Python function that validates an email address.';
        } else if (preset === 'java_list') {
            taskInput.value = 'Create a singly linked list in Java with insertion, deletion, and traversal.';
        } else if (preset === 'fibonacci') {
            taskInput.value = 'Write a function to calculate fibonacci numbers with self-validation assertions';
        }
    }

    // Hide inline alert on input and update tab header
    taskInput?.addEventListener('input', () => {
        const alert = document.getElementById('taskInlineAlert');
        if (alert) alert.style.display = 'none';
        localStorage.setItem('langgraph_last_task', taskInput.value.trim());
        localStorage.setItem('ai_workflow_current_task', taskInput.value.trim());
        updateCodeEditorHeader();
        updateTaskIntentPreview();
    });

    // Language Change Listener to Update Tab Header Filename & Intent Preview
    const languageSelect = document.getElementById('languageSelect');
    languageSelect?.addEventListener('change', () => {
        const lang = languageSelect.value || 'python';
        localStorage.setItem('langgraph_last_lang', lang);
        localStorage.setItem('ai_workflow_current_lang', lang);
        updateCodeEditorHeader();
        updateTaskIntentPreview();
    });

    updateCodeEditorHeader();
    updateTaskIntentPreview();

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

    // Bind Copy & Download - STRICTLY copies clean source code with generated filename
    document.getElementById('copyCodeBtn')?.addEventListener('click', () => {
        if (currentResponseData && currentResponseData.code) {
            // Strip any accidental markdown before copying
            const cleanCode = currentResponseData.code
                .replace(/^```[a-zA-Z]*\n?/gm, '')
                .replace(/```$/gm, '')
                .trim();
            copyToClipboard(cleanCode);
            showToast('Clean source code copied to clipboard!', 'success');
        } else {
            showToast('No code generated yet to copy.', 'warning');
        }
    });

    document.getElementById('downloadCodeBtn')?.addEventListener('click', () => {
        if (currentResponseData && currentResponseData.code) {
            const task = document.getElementById('taskInput')?.value || '';
            const lang = document.getElementById('languageSelect')?.value || 'python';
            const filename = currentResponseData.filename || generateArtifactFilename(task, lang);
            const cleanCode = currentResponseData.code
                .replace(/^```[a-zA-Z]*\n?/gm, '')
                .replace(/```$/gm, '')
                .trim();
            downloadFile(cleanCode, filename);
            showToast(`Downloaded ${filename} successfully!`, 'success');
        } else {
            showToast('No code generated yet to download.', 'warning');
        }
    });
});

let activeHitlThreadId = null;

async function handleGenerate(overrideMode) {
    const taskInput = document.getElementById('taskInput');
    const languageSelect = document.getElementById('languageSelect');
    const maxIterationsSelect = document.getElementById('maxIterationsSelect');
    const hitlToggle = document.getElementById('hitlModeToggle');
    const generateBtn = document.getElementById('generateBtn');
    const taskInlineAlert = document.getElementById('taskInlineAlert');

    const task = taskInput ? taskInput.value.trim() : '';
    if (!task) {
        if (taskInlineAlert) {
            taskInlineAlert.style.display = 'flex';
            document.getElementById('taskInlineAlertText').textContent = 'Please enter a task specification or click a preset button above before executing.';
        }
        if (taskInput) taskInput.focus();
        return;
    }

    if (taskInlineAlert) taskInlineAlert.style.display = 'none';

    // Target language is AUTHORITATIVE from the UI selector
    const language = languageSelect ? languageSelect.value.toLowerCase() : 'python';
    const taskIntent = extractTaskIntent(task);
    const maxIterations = maxIterationsSelect ? (parseInt(maxIterationsSelect.value) || 3) : 3;
    const hitlMode = hitlToggle ? hitlToggle.checked : false;
    const mode = (typeof overrideMode === 'string' && overrideMode) ? overrideMode : 'live';

    // Generate authoritative run_id (thread ID)
    const runId = (mode === 'simulation' ? 'sim_' : 'run_') + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // Save initial context to localStorage for passive reload restoration
    localStorage.setItem('langgraph_last_task', task);
    localStorage.setItem('ai_workflow_current_task', task);
    localStorage.setItem('langgraph_task_intent', taskIntent);
    localStorage.setItem('ai_workflow_task_intent', taskIntent);
    localStorage.setItem('langgraph_last_lang', language);
    localStorage.setItem('ai_workflow_current_lang', language);

    if (typeof setCurrentWorkflowRun === 'function') {
        setCurrentWorkflowRun({
            runId: runId,
            task: task,
            task_intent: taskIntent,
            language: language,
            target_language: language,
            mode: mode,
            status: 'RUNNING',
            currentNode: 'START',
            generatedCode: null,
            testResult: null,
            iteration: 1,
            maxIterations: maxIterations,
            hitl_enabled: hitlMode,
            timestamp: new Date().toISOString()
        });
    }

    // Show toast and minimize tour if open
    if (typeof minimizeTourForExecution === 'function') {
        minimizeTourForExecution();
    }
    showToast(`🚀 Launching ${mode.toUpperCase()} Workflow for intent: "${taskIntent}" in ${language.toUpperCase()}`, 'info');

    // Immediate Redirection to Pipeline Visualizer with authoritative target language & task intent
    const targetUrl = `/workflow?run=${encodeURIComponent(runId)}&task=${encodeURIComponent(task)}&intent=${encodeURIComponent(taskIntent)}&lang=${encodeURIComponent(language)}&max=${maxIterations}&hitl=${hitlMode}&mode=${mode}&autoRun=true`;
    
    setTimeout(() => {
        window.location.href = targetUrl;
    }, 250);
}

async function submitHitlAction(action) {
    if (!activeHitlThreadId) {
        showToast('No active review session found', 'error');
        return;
    }

    const languageSelect = document.getElementById('languageSelect');
    const language = languageSelect ? languageSelect.value : 'python';
    const hitlReviewModal = document.getElementById('hitlReviewModal');
    const hitlEditableCode = document.getElementById('hitlEditableCode');
    const hitlFeedbackInput = document.getElementById('hitlFeedbackInput');
    const statusBanner = document.getElementById('statusBanner');
    const codeDisplay = document.getElementById('codeDisplay');
    const reportDisplay = document.getElementById('reportDisplay');
    const taskInput = document.getElementById('taskInput');

    showToast(`Processing human action: ${action.toUpperCase()}...`, 'info');

    try {
        const payload = {
            thread_id: activeHitlThreadId,
            action: action,
            edited_code: hitlEditableCode ? hitlEditableCode.value : null,
            feedback: hitlFeedbackInput ? hitlFeedbackInput.value : null,
            language: language
        };

        const response = await fetch('/hitl/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        currentResponseData = data;

        if (action === 'abort') {
            if (hitlReviewModal) hitlReviewModal.style.display = 'none';
            if (statusBanner) {
                statusBanner.style.display = 'block';
                statusBanner.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                statusBanner.style.background = 'var(--accent-rose-bg)';
                statusBanner.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="material-symbols-outlined" style="color: #f87171; font-size: 24px;">cancel</span>
                        <div>
                            <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">Task Cancelled by Human Reviewer</div>
                            <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">Execution was halted safely without running untrusted code.</div>
                        </div>
                    </div>
                `;
            }
            showToast('🛑 Task aborted by user', 'info');

        } else if (action === 'reject') {
            // Revised by AI, still awaiting review
            if (codeDisplay) codeDisplay.textContent = data.code || '';
            if (hitlEditableCode) hitlEditableCode.value = data.code || '';
            if (reportDisplay) reportDisplay.textContent = data.report || '';
            showToast('🔄 AI revised code based on your feedback! Please review.', 'success');

        } else {
            // Approved or Edited -> Tests Ran!
            if (hitlReviewModal) hitlReviewModal.style.display = 'none';
            renderSuccessfulExecution(data, language, taskInput ? taskInput.value : '');
        }

    } catch (err) {
        showToast(`Failed to process review action: ${err.message}`, 'error');
    }
}

function renderSuccessfulExecution(data, language, task) {
    const statusBanner = document.getElementById('statusBanner');
    const codeDisplay = document.getElementById('codeDisplay');
    const reportDisplay = document.getElementById('reportDisplay');
    const pipelineStepper = document.getElementById('pipelineStepper');
    const reportBadge = document.getElementById('reportBadge');

    const stageDevBadge = document.getElementById('stageDevBadge');
    const stageTestBadge = document.getElementById('stageTestBadge');
    const stageResultBadge = document.getElementById('stageResultBadge');
    const stageStatusTag = document.getElementById('stageStatusTag');

    if (stageDevBadge) {
        stageDevBadge.className = 'cyber-badge cyber-badge-emerald';
        stageDevBadge.textContent = '1. Developer ✓';
    }
    if (stageTestBadge) {
        stageTestBadge.className = 'cyber-badge cyber-badge-emerald';
        stageTestBadge.textContent = '2. Tester ✓';
    }
    if (stageResultBadge) {
        stageResultBadge.className = 'cyber-badge cyber-badge-emerald';
        stageResultBadge.textContent = '3. Validated ✓';
    }
    if (stageStatusTag) {
        stageStatusTag.className = 'cyber-badge cyber-badge-emerald';
        stageStatusTag.textContent = 'COMPLETE';
    }

    if (reportBadge) {
        reportBadge.className = 'cyber-badge cyber-badge-emerald';
        reportBadge.textContent = 'PASSED';
    }

    if (statusBanner) {
        statusBanner.style.display = 'block';
        statusBanner.className = 'studio-card';
        statusBanner.style.borderColor = 'rgba(5, 150, 105, 0.4)';
        statusBanner.style.background = 'var(--accent-emerald-bg)';
        statusBanner.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="material-symbols-outlined" style="color: var(--accent-emerald); font-size: 24px;">check_circle</span>
                    <div>
                        <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">${(language || 'Python').toUpperCase()} Code — All Tests Passed!</div>
                        <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">Completed in ${data.iterations || 1} attempt(s) • Session: ${data.thread_id || 'active'}</div>
                    </div>
                </div>
                <span class="cyber-badge cyber-badge-emerald">PASSED</span>
            </div>
        `;
    }

    if (pipelineStepper) {
        const stepDev = document.getElementById('stepDeveloper');
        if (stepDev) {
            stepDev.className = 'cyber-badge cyber-badge-emerald';
            stepDev.textContent = '1. Written ✓';
        }
        const stepSand = document.getElementById('stepSandbox');
        if (stepSand) {
            stepSand.className = 'cyber-badge cyber-badge-emerald';
            stepSand.textContent = '2. Tested ✓';
        }
        const stepRout = document.getElementById('stepRouter');
        if (stepRout) {
            stepRout.className = 'cyber-badge cyber-badge-emerald';
            stepRout.textContent = '3. Approved ✓';
        }
    }

    if (codeDisplay) {
        codeDisplay.style.fontStyle = 'normal';
        codeDisplay.style.color = '#f8fafc';
        codeDisplay.textContent = data.code || '';
    }

    if (reportDisplay) {
        reportDisplay.style.fontStyle = 'normal';
        reportDisplay.style.color = '#94a3b8';
        reportDisplay.textContent = data.report || 'No detailed report output generated.';
    }
    
    if (typeof setCurrentWorkflowRun === 'function') {
        setCurrentWorkflowRun({
            runId: data.thread_id || ('run_' + Date.now()),
            task: task,
            language: language,
            status: (data.execution_success || data.success) ? 'SUCCESS' : 'FAILED',
            currentNode: 'END',
            generatedCode: data.code || '',
            testResult: data.report || '',
            iteration: data.iterations || 1,
            timestamp: new Date().toISOString()
        });
    }

    // Save run to local history
    saveRunToHistory({
        task: task,
        language: language,
        success: data.execution_success || data.success,
        iterations: data.iterations,
        code: data.code,
        report: data.report,
        thread_id: data.thread_id
    });

    showToast(`${language.toUpperCase()} Code verified successfully!`, 'success');
    showConversionBar(language);
}

function renderFailedExecution(data) {
    const statusBanner = document.getElementById('statusBanner');
    const codeDisplay = document.getElementById('codeDisplay');
    const reportDisplay = document.getElementById('reportDisplay');
    const pipelineStepper = document.getElementById('pipelineStepper');
    const reportBadge = document.getElementById('reportBadge');

    const stageStatusTag = document.getElementById('stageStatusTag');
    if (stageStatusTag) {
        stageStatusTag.className = 'cyber-badge cyber-badge-rose';
        stageStatusTag.textContent = 'HALTED / ALERT';
    }
    if (reportBadge) {
        reportBadge.className = 'cyber-badge cyber-badge-rose';
        reportBadge.textContent = 'FAILED';
    }

    statusBanner.className = 'studio-card';
    statusBanner.style.borderColor = 'rgba(220, 38, 38, 0.4)';
    statusBanner.style.background = 'var(--accent-rose-bg)';
    statusBanner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span class="material-symbols-outlined" style="color: var(--accent-rose); font-size: 24px;">error</span>
            <div>
                <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">Execution Alert</div>
                <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">${data.error || data.detail?.message || 'The system could not verify the generated code.'}</div>
            </div>
        </div>
    `;
    if (pipelineStepper) pipelineStepper.style.display = 'none';
    if (data.code) {
        codeDisplay.style.fontStyle = 'normal';
        codeDisplay.style.color = '#f8fafc';
        codeDisplay.textContent = data.code;
    }
    if (data.report) {
        reportDisplay.style.fontStyle = 'normal';
        reportDisplay.textContent = data.report;
    }
}

// Show conversion bar and hide the button for the current language
function showConversionBar(currentLang) {
    const bar = document.getElementById('conversionBar');
    if (!bar) return;
    bar.style.display = 'block';
    updateConversionButtons(currentLang);
}

function updateConversionButtons(currentLang) {
    const normalized = currentLang.toLowerCase();
    document.getElementById('convertPythonBtn').style.display = normalized === 'python' ? 'none' : 'inline-flex';
    document.getElementById('convertJavaBtn').style.display = normalized === 'java' ? 'none' : 'inline-flex';
    document.getElementById('convertCppBtn').style.display = (normalized === 'cpp' || normalized === 'c++') ? 'none' : 'inline-flex';
}

// Dynamic code conversion — re-sends the same task in a different language
async function handleConvert(targetLang) {
    const taskInput = document.getElementById('taskInput');
    const task = taskInput?.value.trim();
    if (!task) {
        showToast('No task to convert. Generate code first!', 'warning');
        return;
    }

    const statusBanner = document.getElementById('statusBanner');
    const codeDisplay = document.getElementById('codeDisplay');
    const reportDisplay = document.getElementById('reportDisplay');
    const codeTabHeader = document.querySelector('.code-editor-header span');
    const maxIterationsSelect = document.getElementById('maxIterationsSelect');
    const maxIterations = maxIterationsSelect ? (parseInt(maxIterationsSelect.value) || 3) : 3;

    const langLabels = { python: 'Python 3.11', java: 'Java 17', cpp: 'C++ 20' };

    // Update language dropdown to reflect conversion target
    const hidden = document.getElementById('languageSelect');
    if (hidden) hidden.value = targetLang;
    const valSpan = document.getElementById('langSelectValue');
    if (valSpan) valSpan.textContent = langLabels[targetLang] || targetLang;

    // Update code tab filename
    updateCodeEditorHeader();

    // Show converting status
    statusBanner.style.display = 'flex';
    statusBanner.className = 'studio-card';
    statusBanner.style.borderColor = 'var(--accent-indigo)';
    statusBanner.style.background = 'var(--accent-indigo-bg)';
    statusBanner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span class="material-symbols-outlined spin" style="color: var(--accent-indigo); font-size: 22px;">sync</span>
            <div>
                <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">Converting to ${langLabels[targetLang] || targetLang}...</div>
                <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">Re-generating the same task in a different language</div>
            </div>
        </div>
    `;

    // Disable conversion buttons during conversion
    document.querySelectorAll('#conversionBtns button').forEach(btn => btn.disabled = true);

    try {
        const payload = { task, language: targetLang, max_iterations: maxIterations };
        const response = await fetch('/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        currentResponseData = data;

        if (response.ok && data.code) {
            statusBanner.style.borderColor = 'rgba(5, 150, 105, 0.4)';
            statusBanner.style.background = 'var(--accent-emerald-bg)';
            statusBanner.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="material-symbols-outlined" style="color: var(--accent-emerald); font-size: 24px;">check_circle</span>
                        <div>
                            <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">Converted to ${(langLabels[targetLang] || targetLang).toUpperCase()} successfully!</div>
                            <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">Completed in ${data.iterations} loop(s) • Thread: ${data.thread_id}</div>
                        </div>
                    </div>
                    <span class="cyber-badge cyber-badge-emerald">CONVERTED</span>
                </div>
            `;

            codeDisplay.textContent = data.code;
            reportDisplay.textContent = data.report || 'No detailed report.';

            saveRunToHistory({
                task, language: targetLang, success: data.execution_success,
                iterations: data.iterations, code: data.code, report: data.report, thread_id: data.thread_id
            });

            showConversionBar(targetLang);
            showToast(`Code converted to ${langLabels[targetLang]}!`, 'success');
        } else {
            statusBanner.style.borderColor = 'rgba(220, 38, 38, 0.4)';
            statusBanner.style.background = 'var(--accent-rose-bg)';
            statusBanner.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="material-symbols-outlined" style="color: var(--accent-rose); font-size: 24px;">error</span>
                    <div>
                        <div style="font-weight: 700; font-size: 14px;">Conversion Error</div>
                        <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">${data.detail?.message || data.error || 'Failed to convert.'}</div>
                    </div>
                </div>
            `;
            showToast('Conversion failed', 'error');
        }
    } catch (err) {
        statusBanner.style.borderColor = 'rgba(220, 38, 38, 0.4)';
        statusBanner.style.background = 'var(--accent-rose-bg)';
        statusBanner.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span class="material-symbols-outlined" style="color: var(--accent-rose); font-size: 24px;">wifi_off</span>
                <div>
                    <div style="font-weight: 700; font-size: 14px;">Connection Error</div>
                    <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">${err.message}</div>
                </div>
            </div>
        `;
        showToast('Connection error', 'error');
    } finally {
        document.querySelectorAll('#conversionBtns button').forEach(btn => btn.disabled = false);
    }
}
