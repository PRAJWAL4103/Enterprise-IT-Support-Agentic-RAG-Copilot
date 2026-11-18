const chat = document.getElementById('chat');
const form = document.getElementById('chatForm');
const question = document.getElementById('question');
const trace = document.getElementById('trace');
const sourceUsed = document.getElementById('sourceUsed');
const sendBtn = form.querySelector('.send-btn');

function escapeHtml(s = '') { return s.replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }
function formatText(s = '') { return escapeHtml(s).replace(/\n/g, '<br>'); }

function addMessage(role, text, source = '', citations = []) {
    const wrap = document.createElement('div'); wrap.className = `message ${role}`;
    const citeHtml = citations.length ? `<div class="citations"><strong>Sources</strong><br>${citations.map(c => c.url ? `<a href="${escapeHtml(c.url)}" target="_blank" rel="noopener">${escapeHtml(c.title)}</a>` : escapeHtml(c.title)).join('<br>')}</div>` : '';
    wrap.innerHTML = `<div class="avatar">AI</div><div class="bubble">${formatText(text)}${source ? `<div class="answer-source">Source: ${escapeHtml(source)}</div>` : ''}${citeHtml}</div>`;
    chat.appendChild(wrap); chat.scrollTop = chat.scrollHeight;
}

function renderTrace(items = []) {
    trace.innerHTML = items.length ? items.map(x => `<div class="trace-item">${escapeHtml(x)}</div>`).join('') : '<div class="empty">No trace.</div>';
}

function showLoader() {
    const wrap = document.createElement('div');
    wrap.className = 'message assistant loader-msg';
    wrap.id = 'activeLoader';
    wrap.innerHTML = `
        <div class="avatar">AI</div>
        <div class="bubble loader-bubble">
            <div class="loader-box">
                <div class="loader">
                    <div class="inner one"></div>
                    <div class="inner two"></div>
                    <div class="inner three"></div>
                </div>
            </div>
            <span class="loader-text">Analyzing & retrieving knowledge...</span>
        </div>
    `;
    chat.appendChild(wrap);
    chat.scrollTop = chat.scrollHeight;
}

function hideLoader() {
    const el = document.getElementById('activeLoader');
    if (el) el.remove();
}

async function askAgent(q) {
    addMessage('user', q); question.value = ''; question.style.height = 'auto';
    renderTrace(['Running LangGraph workflow...']); sourceUsed.textContent = 'Running';
    sendBtn.disabled = true;
    showLoader();
    try {
        const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q }) });
        const data = await res.json(); if (!res.ok) throw new Error(data.detail || 'Request failed');
        hideLoader();
        addMessage('assistant', data.answer, data.source_used, data.citations || []); renderTrace(data.trace || []); sourceUsed.textContent = data.source_used;
    } catch (e) {
        hideLoader();
        addMessage('assistant', `Error: ${e.message}`); renderTrace(['Request failed']); sourceUsed.textContent = 'Error';
    }
    finally {
        hideLoader();
        sendBtn.disabled = false;
    }
}

form.addEventListener('submit', e => { e.preventDefault(); const q = question.value.trim(); if (q) askAgent(q); });
// Enter sends, Shift+Enter adds a new line
question.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
document.querySelectorAll('.example').forEach(b => b.addEventListener('click', () => askAgent(b.textContent.trim())));

// Upload modal
const modal = document.getElementById('uploadModal');
document.getElementById('openUpload').onclick = () => modal.classList.remove('hidden');
document.getElementById('closeUpload').onclick = () => modal.classList.add('hidden');
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.classList.add('hidden'); });

document.getElementById('uploadBtn').onclick = async () => {
    const file = document.getElementById('fileInput').files[0]; const key = document.getElementById('adminKey').value; const status = document.getElementById('uploadStatus');
    if (!file) { status.textContent = 'Choose a file first.'; return; }
    status.textContent = 'Indexing document...'; const fd = new FormData(); fd.append('file', file);
    try { const r = await fetch('/api/ingest', { method: 'POST', headers: { 'X-Admin-Key': key }, body: fd }); const d = await r.json(); if (!r.ok) throw new Error(d.detail || 'Upload failed'); status.textContent = `Indexed ${d.file}: ${d.chunks} chunks.`; } catch (e) { status.textContent = `Error: ${e.message}`; }
};
