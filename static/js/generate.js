// Linear Studio Code Engine Controller

let currentResponseData = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Load Sidebar
    const sidebarRes = await fetch('/templates/navigation.html');
    if (sidebarRes.ok) {
        document.getElementById('sidebarContainer').innerHTML = await sidebarRes.text();
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
            const lang = document.getElementById('languageSelect').value || 'python';
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

    const task = taskInput.value.trim();
    if (!task) {
        showToast('Please enter a task specification', 'warning');
        return;
    }

    const language = languageSelect.value;
    const maxIterations = parseInt(maxIterationsSelect.value) || 3;

    // UI Loading State
    generateBtn.disabled = true;
    generateBtn.innerHTML = `
        <span class="material-symbols-outlined spin" style="font-size: 16px;">sync</span>
        <span>Running Execution Pipeline...</span>
    `;

    statusBanner.style.display = 'flex';
    statusBanner.className = 'card';
    statusBanner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span class="material-symbols-outlined" style="color: var(--primary);">sync</span>
            <div>
                <div style="font-weight: 600; font-size: 13.5px;">Developer Engine Generating & Sandbox Validating Code</div>
                <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 2px;">Evaluating conditional router assertions...</div>
            </div>
        </div>
    `;

    if (pipelineStepper) {
        pipelineStepper.style.display = 'flex';
        document.getElementById('stepDeveloper').className = 'badge badge-info';
        document.getElementById('stepDeveloper').textContent = '1. Drafting Code...';
        document.getElementById('stepSandbox').className = 'badge';
        document.getElementById('stepSandbox').textContent = '2. Testing...';
        document.getElementById('stepRouter').className = 'badge';
        document.getElementById('stepRouter').textContent = '3. Route Guard';
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
            statusBanner.className = 'card';
            statusBanner.style.borderColor = 'var(--accent-emerald)';
            statusBanner.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="material-symbols-outlined" style="color: var(--accent-emerald); font-size: 22px;">check_circle</span>
                        <div>
                            <div style="font-weight: 600; font-size: 13.5px;">Verification Passed</div>
                            <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 1px;">Completed in ${data.iterations} iteration(s) • Thread: ${data.thread_id}</div>
                        </div>
                    </div>
                    <span class="badge badge-success">PASSED ALL CHECKS</span>
                </div>
            `;

            if (pipelineStepper) {
                document.getElementById('stepDeveloper').className = 'badge badge-success';
                document.getElementById('stepDeveloper').textContent = '1. Drafted ✓';
                document.getElementById('stepSandbox').className = 'badge badge-success';
                document.getElementById('stepSandbox').textContent = '2. Verified ✓';
                document.getElementById('stepRouter').className = 'badge badge-success';
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

            showToast('Code verified successfully!', 'success');

        } else {
            statusBanner.className = 'card';
            statusBanner.style.borderColor = 'var(--accent-rose)';
            statusBanner.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="material-symbols-outlined" style="color: var(--accent-rose); font-size: 22px;">error</span>
                    <div>
                        <div style="font-weight: 600; font-size: 13.5px;">Execution Error</div>
                        <div style="font-size: 11.5px; color: var(--text-secondary);">${data.detail?.message || data.error || 'Failed to process request.'}</div>
                    </div>
                </div>
            `;
            showToast('Generation error', 'error');
        }

    } catch (err) {
        statusBanner.className = 'card';
        statusBanner.style.borderColor = 'var(--accent-rose)';
        statusBanner.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span class="material-symbols-outlined" style="color: var(--accent-rose); font-size: 22px;">wifi_off</span>
                <div>
                    <div style="font-weight: 600; font-size: 13.5px;">Network Failure</div>
                    <div style="font-size: 11.5px; color: var(--text-secondary);">${err.message}</div>
                </div>
            </div>
        `;
        showToast('Connection error', 'error');
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = `
            <span class="material-symbols-outlined">code_blocks</span>
            <span>Execute & Verify Specification</span>
            <span class="kbd-badge" style="margin-left: 4px; background: #ffffff; color: #000000; border: none;">⌘↵</span>
        `;
    }
}
