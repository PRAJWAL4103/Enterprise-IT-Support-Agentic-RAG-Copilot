// ============================================================
// IT Copilot — Client Application Script
// ============================================================

const chat = document.getElementById('chat');
const form = document.getElementById('chatForm');
const question = document.getElementById('question');
const trace = document.getElementById('trace');
const sourceUsed = document.getElementById('sourceUsed');
const sendBtn = form ? form.querySelector('.send-btn') : null;

// Utility functions
function escapeHtml(s = '') {
    return String(s).replace(/[&<>'"]/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[c]));
}

function formatText(s = '') {
    return escapeHtml(s).replace(/\n/g, '<br>');
}

// Add message to chat area
function addMessage(role, text, source = '', citations = []) {
    const wrap = document.createElement('div');
    wrap.className = `message ${role}`;

    const citeHtml = (citations && citations.length)
        ? `<div class="citations">
             <strong>Sources</strong><br>
             ${citations.map(c => c.url ? `<a href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.title || c.url)}</a>` : `<span>${escapeHtml(c.title || 'Private KB')}</span>`).join('<br>')}
           </div>`
        : '';

    const sourceHtml = source
        ? `<div class="answer-source">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
             Source: ${escapeHtml(source)}
           </div>`
        : '';

    wrap.innerHTML = `
        <div class="avatar" aria-hidden="true">${role === 'user' ? 'U' : 'AI'}</div>
        <div class="bubble">
            ${formatText(text)}
            ${sourceHtml}
            ${citeHtml}
        </div>
    `;

    chat.appendChild(wrap);
    chat.scrollTop = chat.scrollHeight;
}

// Render trace timeline items
function renderTrace(items = []) {
    if (!trace) return;
    if (!items || !items.length) {
        trace.innerHTML = '<div class="empty">No request yet.</div>';
        return;
    }

    trace.innerHTML = items.map((x, idx) => {
        const isRunning = idx === items.length - 1 && (x.toLowerCase().includes('running') || x.toLowerCase().includes('retriev') || x.toLowerCase().includes('workflow'));
        return `
            <div class="trace-item ${isRunning ? 'running' : ''}">
                ${escapeHtml(x)}
            </div>
        `;
    }).join('');
}

// Cyan glowing ring loading bubble
function showLoader() {
    const wrap = document.createElement('div');
    wrap.className = 'message assistant loader-msg';
    wrap.id = 'activeLoader';
    wrap.innerHTML = `
        <div class="avatar" aria-hidden="true">AI</div>
        <div class="bubble loader-bubble">
            <div class="cyan-spinner-box" aria-hidden="true">
                <div class="cyan-spinner"></div>
            </div>
            <span class="loader-text">Analyzing query &amp; retrieving knowledge...</span>
        </div>
    `;
    chat.appendChild(wrap);
    chat.scrollTop = chat.scrollHeight;
}

function hideLoader() {
    const el = document.getElementById('activeLoader');
    if (el) el.remove();
}

// Send user query to LangGraph backend
async function askAgent(q) {
    if (!q || !q.trim()) return;
    const cleanQuery = q.trim();

    addMessage('user', cleanQuery);
    if (question) {
        question.value = '';
        question.style.height = 'auto';
    }

    renderTrace(['Running LangGraph workflow...']);
    if (sourceUsed) sourceUsed.textContent = 'Running...';
    if (sendBtn) sendBtn.disabled = true;

    showLoader();

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: cleanQuery })
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.detail || 'Request failed with status ' + res.status);
        }

        hideLoader();
        addMessage('assistant', data.answer, data.source_used, data.citations || []);
        renderTrace(data.trace || []);
        if (sourceUsed) sourceUsed.textContent = data.source_used || 'Done';
    } catch (e) {
        hideLoader();
        addMessage('assistant', `Error: ${e.message}`);
        renderTrace(['Request failed: ' + e.message]);
        if (sourceUsed) sourceUsed.textContent = 'Error';
    } finally {
        hideLoader();
        if (sendBtn) sendBtn.disabled = false;
        if (question) question.focus();
    }
}

// Form submit
if (form) {
    form.addEventListener('submit', e => {
        e.preventDefault();
        const q = question ? question.value.trim() : '';
        if (q) askAgent(q);
    });
}

// Enter sends, Shift+Enter adds newline
if (question) {
    question.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (form) form.requestSubmit();
        }
    });

    // Auto-grow textarea
    question.addEventListener('input', () => {
        question.style.height = 'auto';
        question.style.height = Math.min(question.scrollHeight, 140) + 'px';
    });
}

// Example chips
document.querySelectorAll('.example').forEach(b => {
    b.addEventListener('click', () => {
        askAgent(b.textContent.trim());
    });
});

// Segmented Control Tabs (Trace / Tools)
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const target = document.getElementById('tab-' + btn.dataset.tab);
        if (target) target.classList.remove('hidden');
    });
});

// Upload modal management
const modal = document.getElementById('uploadModal');
const openUpload = document.getElementById('openUpload');
const openUpload2 = document.getElementById('openUpload2');
const openUpload3 = document.getElementById('openUpload3');
const closeUpload = document.getElementById('closeUpload');

function openModal() {
    if (modal) modal.classList.remove('hidden');
}
function closeModal() {
    if (modal) modal.classList.add('hidden');
}

if (openUpload) openUpload.onclick = openModal;
if (openUpload2) openUpload2.onclick = openModal;
if (openUpload3) openUpload3.onclick = openModal;
if (closeUpload) closeUpload.onclick = closeModal;

if (modal) {
    modal.addEventListener('click', e => {
        if (e.target === modal) closeModal();
    });
}
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

// Document Upload action
const uploadBtn = document.getElementById('uploadBtn');
if (uploadBtn) {
    uploadBtn.onclick = async () => {
        const fileInput = document.getElementById('fileInput');
        const adminKey = document.getElementById('adminKey');
        const status = document.getElementById('uploadStatus');

        const file = fileInput ? fileInput.files[0] : null;
        const key = adminKey ? adminKey.value : '';

        if (!file) {
            if (status) status.textContent = 'Please choose a file first.';
            return;
        }

        if (status) status.textContent = 'Parsing & indexing document chunks...';
        uploadBtn.disabled = true;

        const fd = new FormData();
        fd.append('file', file);

        try {
            const r = await fetch('/api/ingest', {
                method: 'POST',
                headers: { 'X-Admin-Key': key },
                body: fd
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.detail || 'Upload failed');
            if (status) status.textContent = `Indexed ${d.file || 'document'}: ${d.chunks || 0} chunks (${d.ids_created || 0} vectors).`;
            if (fileInput) fileInput.value = '';
        } catch (e) {
            if (status) status.textContent = `Error: ${e.message}`;
        } finally {
            uploadBtn.disabled = false;
        }
    };
}

// Light / Dark Theme Switcher (Shared)
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    const sunIcon = themeToggle.querySelector('.icon-sun');
    const moonIcon = themeToggle.querySelector('.icon-moon');

    function syncIcons() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (sunIcon && moonIcon) {
            sunIcon.style.display = isDark ? 'block' : 'none';
            moonIcon.style.display = isDark ? 'none' : 'block';
        }
    }
    syncIcons();

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('it_copilot_theme', next);
        syncIcons();
    });
}
