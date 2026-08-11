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
        localStorage.setItem('langgraph_last_task', taskInput.value.trim());
    });

    // Language Change Listener to Update Tab Header Filename
    const languageSelect = document.getElementById('languageSelect');
    languageSelect?.addEventListener('change', () => {
        const lang = languageSelect.value || 'python';
        localStorage.setItem('langgraph_last_lang', lang);
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

let activeHitlThreadId = null;

async function handleGenerate() {
    const taskInput = document.getElementById('taskInput');
    const languageSelect = document.getElementById('languageSelect');
    const maxIterationsSelect = document.getElementById('maxIterationsSelect');
    const hitlToggle = document.getElementById('hitlModeToggle');
    const generateBtn = document.getElementById('generateBtn');
    const statusBanner = document.getElementById('statusBanner');
    const codeDisplay = document.getElementById('codeDisplay');
    const reportDisplay = document.getElementById('reportDisplay');
    const pipelineStepper = document.getElementById('pipelineStepper');
    const taskInlineAlert = document.getElementById('taskInlineAlert');
    const codeTabHeader = document.querySelector('.code-editor-header span');
    const hitlReviewModal = document.getElementById('hitlReviewModal');

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
    if (hitlReviewModal) hitlReviewModal.style.display = 'none';

    const language = languageSelect ? languageSelect.value : 'python';
    const maxIterations = maxIterationsSelect ? (parseInt(maxIterationsSelect.value) || 3) : 3;
    const hitlMode = hitlToggle ? hitlToggle.checked : false;

    // Save to localStorage so Canvas Simulator syncs automatically
    localStorage.setItem('langgraph_last_task', task);
    localStorage.setItem('langgraph_last_lang', language);

    // Update code tab filename
    if (codeTabHeader) {
        codeTabHeader.textContent = LANG_FILENAME_MAP[language.toLowerCase()] || 'solution_code.txt';
    }

    // UI Loading State
    generateBtn.disabled = true;
    generateBtn.innerHTML = `
        <span class="material-symbols-outlined spin" style="font-size: 16px;">sync</span>
        <span>${hitlMode ? 'Drafting for Review...' : 'Running Workflow...'}</span>
    `;

    // Update Workflow Stages Banner
    const stageDevBadge = document.getElementById('stageDevBadge');
    const stageTestBadge = document.getElementById('stageTestBadge');
    const stageResultBadge = document.getElementById('stageResultBadge');
    const stageStatusTag = document.getElementById('stageStatusTag');

    if (stageDevBadge) {
        stageDevBadge.className = 'cyber-badge cyber-badge-terracotta';
        stageDevBadge.textContent = '1. Developer (Drafting...)';
    }
    if (stageTestBadge) {
        stageTestBadge.className = 'cyber-badge';
        stageTestBadge.textContent = hitlMode ? '2. Review Gate' : '2. Tester';
    }
    if (stageResultBadge) {
        stageResultBadge.className = 'cyber-badge';
        stageResultBadge.textContent = '3. Result';
    }
    if (stageStatusTag) {
        stageStatusTag.className = 'cyber-badge cyber-badge-indigo';
        stageStatusTag.textContent = 'EXECUTING';
    }

    statusBanner.style.display = 'flex';
    statusBanner.className = 'studio-card';
    statusBanner.style.borderColor = 'var(--accent-blue)';
    statusBanner.style.background = 'var(--accent-blue-bg)';
    statusBanner.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span class="material-symbols-outlined spin" style="color: var(--accent-blue); font-size: 22px;">sync</span>
                <div>
                    <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">${hitlMode ? 'Developer Agent Drafting Code (Human Gate Enabled)...' : 'Developer Agent generating ' + language.toUpperCase() + ' solution...'}</div>
                    <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">${hitlMode ? 'Will pause for human sign-off before testing' : 'Developer Agent ➔ Sandbox Tester ➔ Verification'}</div>
                </div>
            </div>
            <span class="cyber-badge cyber-badge-blue">${hitlMode ? 'REVIEW GATE' : 'IN PROGRESS'}</span>
        </div>
    `;

    if (pipelineStepper) {
        pipelineStepper.style.display = 'flex';
        document.getElementById('stepDeveloper').className = 'cyber-badge cyber-badge-blue';
        document.getElementById('stepDeveloper').textContent = '1. Developer...';
        document.getElementById('stepSandbox').className = 'cyber-badge';
        document.getElementById('stepSandbox').textContent = hitlMode ? '2. Review Gate' : '2. Tester...';
        document.getElementById('stepRouter').className = 'cyber-badge';
        document.getElementById('stepRouter').textContent = '3. Result';
    }

    try {
        const payload = {
            task: task,
            language: language,
            max_iterations: maxIterations,
            hitl_mode: hitlMode
        };

        const response = await fetch('/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        currentResponseData = data;
        activeHitlThreadId = data.thread_id;

        if (response.ok && data.hitl_status === 'awaiting_human_review') {
            // Paused at Human Review Gate
            if (stageDevBadge) {
                stageDevBadge.className = 'cyber-badge cyber-badge-emerald';
                stageDevBadge.textContent = '1. Developer ✓';
            }
            if (stageTestBadge) {
                stageTestBadge.className = 'cyber-badge cyber-badge-indigo';
                stageTestBadge.textContent = '2. Review Gate ⏸';
            }
            if (stageStatusTag) {
                stageStatusTag.className = 'cyber-badge cyber-badge-indigo';
                stageStatusTag.textContent = 'PAUSED FOR REVIEW';
            }

            statusBanner.style.borderColor = 'rgba(99, 102, 241, 0.5)';
            statusBanner.style.background = 'rgba(99, 102, 241, 0.08)';
            statusBanner.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="material-symbols-outlined" style="color: var(--accent-indigo); font-size: 24px;">pause_circle</span>
                        <div>
                            <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">⏸️ Paused at Human Review Gate</div>
                            <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">Inspect, edit, or approve the drafted code below before sandbox testing.</div>
                        </div>
                    </div>
                    <span class="cyber-badge cyber-badge-indigo">SIGN-OFF REQUIRED</span>
                </div>
            `;

            if (pipelineStepper) {
                document.getElementById('stepDeveloper').className = 'cyber-badge cyber-badge-emerald';
                document.getElementById('stepDeveloper').textContent = '1. Written ✓';
                document.getElementById('stepSandbox').className = 'cyber-badge cyber-badge-indigo';
                document.getElementById('stepSandbox').textContent = '2. Review Gate ⏸';
                document.getElementById('stepRouter').className = 'cyber-badge';
                document.getElementById('stepRouter').textContent = '3. Pending';
            }

            codeDisplay.style.fontStyle = 'normal';
            codeDisplay.style.color = '#f8fafc';
            codeDisplay.textContent = data.code;

            reportDisplay.style.fontStyle = 'normal';
            reportDisplay.textContent = data.report || 'Awaiting human sign-off before running sandbox tests.';

            // Show Interactive Review Modal
            if (hitlReviewModal) {
                hitlReviewModal.style.display = 'block';
                const codeArea = document.getElementById('hitlEditableCode');
                if (codeArea) codeArea.value = data.code || '';
                hitlReviewModal.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            showToast('⏸️ Code drafted! Sign-off required at Human Review Gate.', 'info');

        } else if (response.ok && data.code) {
            // Standard Execution Complete
            renderSuccessfulExecution(data, language, task);
        } else {
            renderFailedExecution(data);
        }
    } catch (err) {
        renderFailedExecution({ error: err.message });
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = `
            <span class="material-symbols-outlined">rocket_launch</span>
            <span>Run Workflow</span>
        `;
    }
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
            showToast('🛑 Task aborted by user', 'info');

        } else if (action === 'reject') {
            // Revised by AI, still awaiting review
            codeDisplay.textContent = data.code;
            if (hitlEditableCode) hitlEditableCode.value = data.code || '';
            reportDisplay.textContent = data.report;
            showToast('🔄 AI revised code based on your feedback! Please review.', 'success');

        } else {
            // Approved or Edited -> Tests Ran!
            if (hitlReviewModal) hitlReviewModal.style.display = 'none';
            renderSuccessfulExecution(data, language, taskInput ? taskInput.value : 'Task');
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

    statusBanner.className = 'studio-card';
    statusBanner.style.borderColor = 'rgba(5, 150, 105, 0.4)';
    statusBanner.style.background = 'var(--accent-emerald-bg)';
    statusBanner.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span class="material-symbols-outlined" style="color: var(--accent-emerald); font-size: 24px;">check_circle</span>
                <div>
                    <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">${language.toUpperCase()} Code — All Tests Passed!</div>
                    <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">Completed in ${data.iterations} attempt(s) • Session: ${data.thread_id || 'active'}</div>
                </div>
            </div>
            <span class="cyber-badge cyber-badge-emerald">PASSED</span>
        </div>
    `;

    if (pipelineStepper) {
        document.getElementById('stepDeveloper').className = 'cyber-badge cyber-badge-emerald';
        document.getElementById('stepDeveloper').textContent = '1. Written ✓';
        document.getElementById('stepSandbox').className = 'cyber-badge cyber-badge-emerald';
        document.getElementById('stepSandbox').textContent = '2. Tested ✓';
        document.getElementById('stepRouter').className = 'cyber-badge cyber-badge-emerald';
        document.getElementById('stepRouter').textContent = '3. Approved ✓';
    }

    codeDisplay.style.fontStyle = 'normal';
    codeDisplay.style.color = '#f8fafc';
    codeDisplay.textContent = data.code;

    reportDisplay.style.fontStyle = 'normal';
    reportDisplay.style.color = '#94a3b8';
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
    if (codeTabHeader) {
        codeTabHeader.textContent = LANG_FILENAME_MAP[targetLang.toLowerCase()] || 'solution_code.txt';
    }

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
        const response = await fetch(API_URL, {
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
