// Hallmark Design History Page Controller

let currentSelectedRun = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Load Sidebar
    const sidebarRes = await fetch('/templates/navigation.html');
    if (sidebarRes.ok) {
        document.getElementById('sidebarContainer').innerHTML = await sidebarRes.text();
        setActiveNav('history');
    }

    renderHistoryTable();

    // Bind Search & Filters
    document.getElementById('searchInput')?.addEventListener('input', renderHistoryTable);
    document.getElementById('filterStatusSelect')?.addEventListener('change', renderHistoryTable);
    document.getElementById('clearHistoryBtn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all run history?')) {
            clearRunHistory();
            renderHistoryTable();
        }
    });

    // Modal Copy & Download
    document.getElementById('modalCopyBtn')?.addEventListener('click', () => {
        if (currentSelectedRun && currentSelectedRun.code) {
            copyToClipboard(currentSelectedRun.code);
        }
    });

    document.getElementById('modalDownloadBtn')?.addEventListener('click', () => {
        if (currentSelectedRun && currentSelectedRun.code) {
            const ext = getFileExtension(currentSelectedRun.language || 'python');
            downloadFile(currentSelectedRun.code, `history_${currentSelectedRun.id}${ext}`);
        }
    });

    document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);
});

function renderHistoryTable() {
    const history = getRunHistory();
    const tbody = document.getElementById('historyTableBody');
    const searchVal = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const filterStatus = document.getElementById('filterStatusSelect')?.value || 'all';

    if (!tbody) return;

    let filtered = history.filter(run => {
        const matchesSearch = run.task.toLowerCase().includes(searchVal) || (run.code && run.code.toLowerCase().includes(searchVal));
        const matchesStatus = filterStatus === 'all' ? true : filterStatus === 'passed' ? run.success : !run.success;
        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 36px; text-align: center; color: var(--text-muted);">
                    No historical runs match the criteria.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(run => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer;" onclick="openModal('${run.id}')">
            <td style="padding: 14px 16px; font-weight: 500; color: var(--text-primary);">${run.task}</td>
            <td style="padding: 14px 16px;">
                <span class="badge badge-info">${(run.language || 'python').toUpperCase()}</span>
            </td>
            <td style="padding: 14px 16px;">
                <span class="badge ${run.success ? 'badge-success' : 'badge-error'}">
                    ${run.success ? 'PASSED' : 'FAILED'}
                </span>
            </td>
            <td style="padding: 14px 16px; font-family: var(--font-mono); color: var(--text-secondary);">${run.iterations} loop(s)</td>
            <td style="padding: 14px 16px; color: var(--text-muted); font-size: 13px;">${new Date(run.timestamp).toLocaleTimeString()}</td>
        </tr>
    `).join('');
}

function openModal(runId) {
    const history = getRunHistory();
    const run = history.find(r => r.id === runId);
    if (!run) return;

    currentSelectedRun = run;
    document.getElementById('modalTaskTitle').textContent = run.task;
    document.getElementById('modalCodeDisplay').textContent = run.code || '# No code content';
    document.getElementById('modalReportDisplay').textContent = run.report || '# No report content';
    
    document.getElementById('runModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('runModal').style.display = 'none';
    currentSelectedRun = null;
}
