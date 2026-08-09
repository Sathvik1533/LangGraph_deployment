// Common JavaScript for Multi-Page Dashboard

// Configuration
const API_URL = window.location.origin + '/invoke';
const THREADS_API_URL = window.location.origin + '/threads';

// Global State
let currentThreadId = null;
let selectedLanguage = 'python';

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
        <span class="material-symbols-outlined">${icons[type]}</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Check System Health
async function checkSystemHealth() {
    try {
        const response = await fetch(window.location.origin + '/health');
        if (response.ok) {
            const data = await response.json();
            return data;
        }
    } catch (error) {
        console.warn('Health check failed:', error);
    }
    return null;
}

// Check Redis Status
async function checkRedisStatus() {
    try {
        const response = await fetch(THREADS_API_URL);
        if (response.ok) {
            const data = await response.json();
            return data.checkpointing_enabled || false;
        }
    } catch (error) {
        return false;
    }
}

// Set Active Navigation
function setActiveNav(pageId) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageId) {
            item.classList.add('active');
        }
    });
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
}

// Format Date
function formatDate(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

// Format Duration
function formatDuration(seconds) {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}m ${secs}s`;
}

// Language Names
const LANGUAGE_NAMES = {
    'python': 'Python',
    'java': 'Java',
    'cpp': 'C++',
    'javascript': 'JavaScript'
};

// Language Extensions
const LANGUAGE_EXTENSIONS = {
    'python': '.py',
    'java': '.java',
    'cpp': '.cpp',
    'javascript': '.js'
};

// Get Language Display Name
function getLanguageName(lang) {
    return LANGUAGE_NAMES[lang] || lang.toUpperCase();
}

// Get File Extension
function getFileExtension(lang) {
    return LANGUAGE_EXTENSIONS[lang] || '.txt';
}

// Copy to Clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!', 'success');
        return true;
    } catch (err) {
        showToast('Failed to copy', 'error');
        return false;
    }
}

// Download File
function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File downloaded!', 'success');
}

// Clean Code (Remove markdown artifacts)
function cleanCode(code) {
    if (!code) return '';
    
    let cleaned = code
        // Remove markdown code fences
        .replace(/```(?:python|java|cpp|c\+\+|javascript)?\s*/gi, '')
        .replace(/```\s*/g, '')
        // Remove markdown headers
        .replace(/###\s*/g, '')
        .replace(/##\s*/g, '')
        .replace(/#\s+/gm, '')
        // Remove markdown formatting
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/_(.+?)_/g, '$1')
        // Remove HTML tags
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?[^>]+(>|$)/g, '')
        // Remove keyword artifacts
        .replace(/"keyword"[>\s]*/gi, '')
        .replace(/'keyword'[>\s]*/gi, '')
        .replace(/keyword\s*>/gi, '')
        .replace(/>\s*keyword/gi, '')
        .trim();
    
    // Extract from markdown blocks
    const codeBlockMatch = cleaned.match(/```(?:python|java|cpp|c\+\+)?\s*([\s\S]*?)```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
        cleaned = codeBlockMatch[1].trim();
    }
    
    return cleaned;
}

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
    // Set active navigation based on current page
    const path = window.location.pathname;
    let pageId = 'dashboard';
    
    if (path.includes('generate')) pageId = 'generator';
    else if (path.includes('workflow')) pageId = 'workflow';
    else if (path.includes('execution')) pageId = 'execution';
    else if (path.includes('history')) pageId = 'history';
    
    setActiveNav(pageId);
    
    console.log('🚀 LangGraph Multi-Page Dashboard initialized');
});
