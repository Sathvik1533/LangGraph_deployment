// Backend integration for history.html
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    setupFilters();
    setupNavigation();
});

function loadHistory() {
    const recent = JSON.parse(localStorage.getItem('recentGenerations') || '[]');
    const gridContainer = document.querySelector('.grid');
    const emptyState = document.querySelector('section.hidden');
    
    if (recent.length === 0) {
        if (gridContainer) gridContainer.style.display = 'none';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    // Generate cards
    gridContainer.innerHTML = recent.map((item, index) => {
        const languageEmoji = { python: '🐍', java: '☕', cpp: '⚡' };
        const languageName = { python: 'Python', java: 'Java', cpp: 'C++' };
        const statusClass = item.success ? 'success-bg' : 'error-bg';
        const statusText = item.success ? 'Success' : 'Failed';
        const statusTextColor = item.success ? 'text-on-background' : 'text-on-primary';
        
        const timeAgo = getTimeAgo(new Date(item.timestamp));
        
        return `
            <article class="bg-surface-container-lowest border-3 border-on-background p-[24px] flex flex-col gap-sm neo-shadow neo-shadow-hover transition-all duration-200 group">
                <div class="flex justify-between items-start">
                    <div class="bg-surface-container-high border-2 border-on-background px-xs py-1 flex items-center gap-1">
                        <span>${languageEmoji[item.language] || '📄'}</span>
                        <span class="font-label-sm text-label-sm uppercase">${languageName[item.language] || item.language}</span>
                    </div>
                    <div class="${statusClass} border-2 border-on-background px-xs py-1 font-label-sm text-label-sm uppercase ${statusTextColor}">
                        ${statusText}
                    </div>
                </div>
                <div class="flex flex-col gap-xs mt-xs">
                    <h3 class="font-body-lg text-body-lg text-on-background line-clamp-2">${escapeHtml(item.task)}</h3>
                    <p class="font-code-md text-code-md text-on-surface-variant flex items-center gap-1 mt-1">
                        <span class="material-symbols-outlined text-[14px]">schedule</span> ${timeAgo}
                    </p>
                </div>
                <div class="mt-auto pt-sm flex gap-xs flex-wrap">
                    <button onclick="viewCode(${index})" class="flex-1 h-[44px] bg-primary text-on-primary border-3 border-on-background font-body-md font-bold flex justify-center items-center gap-xs hover:-translate-y-1 transition-transform">
                        <span class="material-symbols-outlined text-[18px]">code</span> View Code
                    </button>
                    <button onclick="rerun(${index})" class="h-[44px] w-[44px] bg-surface-container-lowest border-3 border-on-background flex justify-center items-center hover:bg-primary-container transition-colors" title="Re-run">
                        <span class="material-symbols-outlined text-[18px]">refresh</span>
                    </button>
                    <button onclick="deleteGeneration(${index})" class="h-[44px] w-[44px] bg-surface-container-lowest border-3 border-on-background flex justify-center items-center hover:bg-[#FF0055] hover:text-on-primary transition-colors" title="Delete">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </div>
            </article>
        `;
    }).join('');
    
    updateFilterCounts(recent);
}

function setupFilters() {
    const filterButtons = document.querySelectorAll('button[class*="h-[44px]"]');
    const searchInput = document.querySelector('input[placeholder*="Search"]');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Toggle active state
            filterButtons.forEach(b => {
                if (b !== btn && !b.textContent.includes('Clear')) {
                    b.classList.remove('bg-on-background', 'text-on-primary');
                    b.classList.add('bg-surface-container-lowest', 'text-on-background');
                }
            });
            
            if (!btn.textContent.includes('Clear')) {
                btn.classList.toggle('bg-on-background');
                btn.classList.toggle('bg-surface-container-lowest');
                btn.classList.toggle('text-on-primary');
                btn.classList.toggle('text-on-background');
            }
            
            // Filter logic here
            const filterText = btn.textContent.toLowerCase();
            filterHistory(filterText);
        });
    });
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterHistory(e.target.value);
        });
    }
    
    // Clear all button
    const clearBtn = document.querySelector('button:has-text("Clear all")') || 
                    Array.from(filterButtons).find(btn => btn.textContent.includes('Clear'));
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            loadHistory();
            if (searchInput) searchInput.value = '';
        });
    }
}

function filterHistory(query) {
    const recent = JSON.parse(localStorage.getItem('recentGenerations') || '[]');
    const filtered = recent.filter(item => {
        const searchText = `${item.task} ${item.language}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
    });
    
    // Re-render with filtered items
    const gridContainer = document.querySelector('.grid');
    if (filtered.length === 0) {
        gridContainer.innerHTML = '<p class="col-span-full text-center text-on-surface-variant p-8">No results found</p>';
    } else {
        // Use same rendering logic as loadHistory
        loadHistory();
    }
}

function updateFilterCounts(recent) {
    const counts = {
        all: recent.length,
        python: recent.filter(i => i.language === 'python').length,
        java: recent.filter(i => i.language === 'java').length,
        cpp: recent.filter(i => i.language === 'cpp').length,
        success: recent.filter(i => i.success).length,
        failed: recent.filter(i => !i.success).length
    };
    
    // Update badge numbers
    document.querySelectorAll('button span[class*="px-1"]').forEach(badge => {
        const parent = badge.closest('button');
        const text = parent.textContent.toLowerCase();
        
        if (text.includes('all')) badge.textContent = counts.all;
        else if (text.includes('python')) badge.textContent = counts.python;
        else if (text.includes('java')) badge.textContent = counts.java;
        else if (text.includes('c++')) badge.textContent = counts.cpp;
        else if (text.includes('success')) badge.textContent = counts.success;
        else if (text.includes('failed')) badge.textContent = counts.failed;
    });
}

function setupNavigation() {
    document.querySelectorAll('a[href="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const text = link.textContent.trim();
            
            if (text.includes('Agent Runs') || text.includes('Runs')) window.location.href = '/execution';
            else if (text.includes('History')) window.location.href = '/history';
            else if (text.includes('Monitors')) window.location.href = '/';
            else if (text.includes('Settings')) window.location.href = '/';
        });
    });
    
    // "New Run" button
    const newRunBtn = document.querySelector('button:has-text("New Run")') || 
                     document.querySelector('button:contains("New Run")');
    if (newRunBtn) {
        newRunBtn.addEventListener('click', () => {
            window.location.href = '/generate';
        });
    }
}

function viewCode(index) {
    const recent = JSON.parse(localStorage.getItem('recentGenerations') || '[]');
    const item = recent[index];
    
    if (item) {
        localStorage.setItem('currentView', JSON.stringify(item));
        window.location.href = '/generate';
    }
}

function rerun(index) {
    const recent = JSON.parse(localStorage.getItem('recentGenerations') || '[]');
    const item = recent[index];
    
    if (item) {
        localStorage.setItem('prefillTask', item.task);
        localStorage.setItem('prefillLanguage', item.language);
        window.location.href = '/generate';
    }
}

function deleteGeneration(index) {
    if (!confirm('Are you sure you want to delete this generation?')) return;
    
    const recent = JSON.parse(localStorage.getItem('recentGenerations') || '[]');
    recent.splice(index, 1);
    localStorage.setItem('recentGenerations', JSON.stringify(recent));
    
    loadHistory();
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 172800) return 'Yesterday';
    return `${Math.floor(seconds / 86400)} days ago`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
