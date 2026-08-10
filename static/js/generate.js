// Backend integration for generate.html
let selectedLanguage = 'python';
let generatedCode = '';
let lastGenerationData = null;
let currentThreadId = null;
const API_URL = '/invoke';

document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const outputSection = document.getElementById('output-section');
    const btnIcon = document.getElementById('btn-icon');
    const btnText = document.getElementById('btn-text');
    const btnLoader = document.getElementById('btn-loader');
    const taskInput = document.getElementById('task-description');

    // Language selection
    const languageRadios = document.querySelectorAll('input[name="language"]');
    languageRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            selectedLanguage = e.target.value;
        });
    });

    // Generate button click
    generateBtn.addEventListener('click', async () => {
        const task = taskInput.value.trim();
        
        if (!task) {
            taskInput.classList.add('border-error');
            setTimeout(() => taskInput.classList.remove('border-error'), 1000);
            return;
        }

        // UI loading state
        btnIcon.style.display = 'none';
        btnText.textContent = 'Generating...';
        btnLoader.style.display = 'block';
        generateBtn.classList.add('opacity-80', 'pointer-events-none');
        outputSection.classList.remove('active');

        try {
            const requestBody = {
                task: task,
                language: selectedLanguage
            };
            
            if (currentThreadId) {
                requestBody.thread_id = currentThreadId;
            }

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail?.message || `API Error: ${response.status}`);
            }

            const data = await response.json();
            lastGenerationData = data;
            generatedCode = data.code;

            if (data.thread_id) {
                currentThreadId = data.thread_id;
            }

            displayGeneratedCode(data.code, data.execution_success);

            saveToRecent({
                task: task.substring(0, 50),
                language: selectedLanguage,
                success: data.execution_success,
                timestamp: new Date().toISOString(),
                code: data.code,
                report: data.report
            });

            outputSection.classList.add('active');
            setTimeout(() => {
                outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);

        } catch (error) {
            console.error('Generation error:', error);
            alert(`Failed to generate code: ${error.message}`);
        } finally {
            btnIcon.style.display = 'block';
            btnText.textContent = 'Generate Code';
            btnLoader.style.display = 'none';
            generateBtn.classList.remove('opacity-80', 'pointer-events-none');
        }
    });

    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            generateBtn.click();
        }
    });

    // Copy/Download buttons
    setTimeout(() => {
        const buttons = outputSection.querySelectorAll('button');
        buttons.forEach(btn => {
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon && icon.textContent.trim() === 'content_copy') {
                btn.addEventListener('click', copyCode);
            } else if (icon && icon.textContent.trim() === 'download') {
                btn.addEventListener('click', downloadCode);
            }
        });
    }, 500);

    // Fix navigation links
    document.querySelectorAll('a[href="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const text = link.textContent.trim();
            
            if (text === 'Dashboard') window.location.href = '/';
            else if (text === 'Workflows') window.location.href = '/workflow';
            else if (text === 'Code Generator' || text === 'Generate') window.location.href = '/generate';
            else if (text.includes('History')) window.location.href = '/history';
            else if (text === 'Settings') window.location.href = '/';
        });
    });
});

function displayGeneratedCode(code, success) {
    const codeContainer = document.querySelector('.code-container pre');
    const statusBox = document.querySelector('#output-section > div:last-child');
    const fileNameEl = document.querySelector('.code-container .bg-surface-container-high span:last-child');
    
    const extensions = { python: '.py', java: '.java', cpp: '.cpp' };
    if (fileNameEl) {
        fileNameEl.textContent = `generated_code${extensions[selectedLanguage] || '.txt'}`;
    }

    // Check if code contains error messages
    let errorMessage = '';
    if (code.includes('# ERROR:') || code.includes('# The LLM returned invalid output')) {
        // Extract the error message
        const errorLines = code.split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed.startsWith('# ERROR:') || trimmed.includes('LLM returned invalid');
        });
        errorMessage = errorLines
            .map(line => line.replace('# ERROR:', '').replace('# The LLM returned invalid output.', '').trim())
            .filter(line => line.length > 0)
            .join(' ');
    }

    // Clean code - remove markdown and ALL error-related comments
    let cleanCode = code.replace(/```python|```java|```cpp|```c\+\+|```/g, '').trim();
    
    // Remove ALL error-related comments
    cleanCode = cleanCode.split('\n').filter(line => {
        const trimmed = line.trim();
        return !trimmed.startsWith('# ERROR:') && 
               !trimmed.includes('LLM returned invalid') &&
               !trimmed.includes('DEVELOPER ERROR') &&
               trimmed !== '#';  // Remove standalone # lines
    }).join('\n').trim();
    
    // If code is empty or too short after cleaning, show appropriate placeholder
    if (!cleanCode || cleanCode.length < 10) {
        if (errorMessage) {
            cleanCode = `// Code generation failed\n// See error message below for details`;
        } else {
            cleanCode = `// Code generation in progress...\n// Please check the report for details.`;
        }
    }
    
    generatedCode = cleanCode;
    
    if (codeContainer) {
        codeContainer.innerHTML = syntaxHighlight(cleanCode, selectedLanguage);
    }

    if (statusBox) {
        if (success) {
            statusBox.className = 'mt-4 p-4 bg-secondary-fixed-dim border-3 border-on-background neo-shadow flex items-start gap-3 rounded-DEFAULT';
            statusBox.innerHTML = `
                <span class="material-symbols-outlined text-on-secondary-fixed font-bold mt-1">check_circle</span>
                <div>
                    <h4 class="font-display-lg text-[18px] text-on-secondary-fixed font-bold">Generation Successful</h4>
                    <p class="font-body-md text-body-md text-on-secondary-fixed mt-1">Agent successfully wrote, tested, and validated the requested code.</p>
                </div>
            `;
        } else {
            // Use extracted error message if available
            const errorDetail = errorMessage || 'The agent encountered errors. Code may be incomplete or invalid.';
            statusBox.className = 'mt-4 p-4 bg-error-container border-3 border-on-background neo-shadow flex items-start gap-3 rounded-DEFAULT';
            statusBox.innerHTML = `
                <span class="material-symbols-outlined text-on-error-container font-bold mt-1">warning</span>
                <div>
                    <h4 class="font-display-lg text-[18px] text-on-error-container font-bold">Generation Failed</h4>
                    <p class="font-body-md text-body-md text-on-error-container mt-1">${errorDetail}</p>
                    ${lastGenerationData?.report ? `<details class="mt-2"><summary class="cursor-pointer font-bold">View Execution Report</summary><pre class="mt-2 text-xs whitespace-pre-wrap">${lastGenerationData.report}</pre></details>` : ''}
                </div>
            `;
        }
    }
}

function syntaxHighlight(code, lang) {
    let html = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    if (lang === 'python') {
        html = html
            .replace(/\b(def|class|if|else|elif|for|while|return|import|from|try|except|with|as|in|is|and|or|not|lambda|yield|break|continue|pass|async|await)\b/g, '<span style="color: #c678dd;">$1</span>')
            .replace(/\b(\d+\.?\d*)\b/g, '<span style="color: #d19a66;">$1</span>')
            .replace(/(#[^\n]*)/g, '<span style="color: #5c6370;">$1</span>')
            .replace(/("(?:[^"\\]|\\.)*"|\'(?:[^\'\\]|\\.)*\'|"""[\s\S]*?""")/g, '<span style="color: #98c379;">$1</span>')
            .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '<span style="color: #61afef;">$1</span>(');
    } else if (lang === 'java') {
        html = html
            .replace(/\b(public|private|protected|static|final|class|interface|void|int|String|boolean|if|else|for|while|return|new|this|try|catch|throw|import)\b/g, '<span style="color: #c678dd;">$1</span>')
            .replace(/\b(\d+\.?\d*[fFdDlL]?)\b/g, '<span style="color: #d19a66;">$1</span>')
            .replace(/(\/\/[^\n]*)/g, '<span style="color: #5c6370;">$1</span>')
            .replace(/("(?:[^"\\]|\\.)*")/g, '<span style="color: #98c379;">$1</span>')
            .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '<span style="color: #61afef;">$1</span>(');
    } else if (lang === 'cpp') {
        html = html
            .replace(/\b(int|float|double|char|bool|void|if|else|for|while|return|new|delete|this|try|catch|throw|include|using|namespace|std)\b/g, '<span style="color: #c678dd;">$1</span>')
            .replace(/\b(\d+\.?\d*[fFdDlLuU]*)\b/g, '<span style="color: #d19a66;">$1</span>')
            .replace(/(\/\/[^\n]*)/g, '<span style="color: #5c6370;">$1</span>')
            .replace(/("(?:[^"\\]|\\.)*")/g, '<span style="color: #98c379;">$1</span>')
            .replace(/#include\s*[<"]([^>"]+)[>"]/g, '<span style="color: #c678dd;">#include</span> <span style="color: #98c379;">&lt;$1&gt;</span>')
            .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '<span style="color: #61afef;">$1</span>(');
    }
    
    return html;
}

function copyCode() {
    navigator.clipboard.writeText(generatedCode).then(() => {
        alert('Code copied to clipboard!');
    }).catch(() => {
        alert('Failed to copy code');
    });
}

function downloadCode() {
    const extensions = { python: '.py', java: '.java', cpp: '.cpp' };
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated_code${extensions[selectedLanguage] || '.txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function saveToRecent(data) {
    const recent = JSON.parse(localStorage.getItem('recentGenerations') || '[]');
    recent.unshift(data);
    if (recent.length > 20) recent.pop();
    localStorage.setItem('recentGenerations', JSON.stringify(recent));
    localStorage.setItem('lastGeneration', JSON.stringify(lastGenerationData));
}
