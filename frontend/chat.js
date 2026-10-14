/* ================================================================
   AI CHAT WIDGET — Floating Financial Assistant (Gemini)
   ================================================================ */

let aiChatHistory = [];
let aiChatOpen    = false;
let aiChatTyping  = false;

function initAIChat() {
  const fab      = document.getElementById('ai-chat-fab');
  const panel    = document.getElementById('ai-chat-panel');
  const closeBtn = document.getElementById('ai-chat-close');
  const clearBtn = document.getElementById('ai-chat-clear');
  const form     = document.getElementById('ai-chat-form');
  const input    = document.getElementById('ai-chat-input');
  const backdrop = document.getElementById('ai-chat-backdrop');
  if (!fab || fab._chatInitialized) return;
  fab._chatInitialized = true;

  // Show FAB
  fab.style.display = 'flex';
  renderAIWelcome();

  // Toggle panel open/close
  fab.addEventListener('click', () => {
    aiChatOpen = !aiChatOpen;
    panel.classList.toggle('open', aiChatOpen);
    fab.classList.toggle('open', aiChatOpen);
    backdrop.classList.toggle('show', aiChatOpen && window.innerWidth <= 480);
    panel.setAttribute('aria-hidden', String(!aiChatOpen));
    if (aiChatOpen) {
      setTimeout(() => input && input.focus(), 300);
      const badge = document.getElementById('ai-chat-badge');
      if (badge) badge.style.display = 'none';
    }
  });

  closeBtn && closeBtn.addEventListener('click', () => {
    aiChatOpen = false;
    panel.classList.remove('open');
    fab.classList.remove('open');
    backdrop.classList.remove('show');
    panel.setAttribute('aria-hidden', 'true');
  });

  backdrop && backdrop.addEventListener('click', () => closeBtn && closeBtn.click());

  clearBtn && clearBtn.addEventListener('click', () => {
    aiChatHistory = [];
    renderAIWelcome();
  });

  form && form.addEventListener('submit', e => {
    e.preventDefault();
    const msg = input ? input.value.trim() : '';
    if (!msg || aiChatTyping) return;
    input.value = '';
    sendAIMessage(msg);
  });

  // Suggestion chips
  const suggestions = document.getElementById('ai-chat-suggestions');
  if (suggestions) {
    suggestions.addEventListener('click', e => {
      const chip = e.target.closest('[data-msg]');
      if (chip && !aiChatTyping) sendAIMessage(chip.dataset.msg);
    });
  }
}

function renderAIWelcome() {
  const el = document.getElementById('ai-chat-messages');
  if (!el) return;
  el.innerHTML = `
    <div class="ai-chat-welcome">
      <div class="ai-chat-welcome-icon">🤖</div>
      <h4>Xin chào! Tôi là Trợ lý AI Tài chính</h4>
      <p>Tôi biết về chi tiêu, ngân sách và mục tiêu của bạn.<br>Hỏi tôi bất cứ điều gì về tài chính cá nhân!</p>
    </div>`;
}

function appendAIMessage(role, text) {
  const el = document.getElementById('ai-chat-messages');
  if (!el) return;
  const welcome = el.querySelector('.ai-chat-welcome');
  if (welcome) welcome.remove();

  const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const div  = document.createElement('div');
  div.className = `ai-msg ${role}`;

  const html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');

  div.innerHTML = role === 'ai'
    ? `<div class="ai-msg-icon">🤖</div><div><div class="ai-msg-bubble">${html}</div><div class="ai-msg-time">${time}</div></div>`
    : `<div><div class="ai-msg-bubble">${html}</div><div class="ai-msg-time">${time}</div></div>`;

  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function showAITyping() {
  const el = document.getElementById('ai-chat-messages');
  if (!el || document.getElementById('ai-typing')) return;
  const div = document.createElement('div');
  div.className = 'ai-msg ai'; div.id = 'ai-typing';
  div.innerHTML = `<div class="ai-msg-icon">🤖</div><div class="ai-typing-indicator"><div class="ai-typing-dot"></div><div class="ai-typing-dot"></div><div class="ai-typing-dot"></div></div>`;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function hideAITyping() {
  const el = document.getElementById('ai-typing');
  if (el) el.remove();
}

function setAIChatStatus(text, color = '#10b981') {
  const el = document.getElementById('ai-chat-status');
  if (el) { el.textContent = `● ${text}`; el.style.color = color; }
}

async function sendAIMessage(userMsg) {
  if (aiChatTyping) return;
  aiChatTyping = true;
  const sendBtn = document.getElementById('ai-chat-send');
  const inputEl = document.getElementById('ai-chat-input');
  if (sendBtn) sendBtn.disabled = true;
  if (inputEl) inputEl.disabled = true;

  appendAIMessage('user', userMsg);
  aiChatHistory.push({ role: 'user', content: userMsg });
  showAITyping();
  setAIChatStatus('Đang suy nghĩ...', '#f59e0b');

  try {
    const data = await apiFetch('/chat', {
      method: 'POST',
      body: JSON.stringify({ message: userMsg, history: aiChatHistory.slice(-10) }),
    });
    hideAITyping();
    const reply = data.reply || 'Xin lỗi, tôi không thể trả lời lúc này.';
    appendAIMessage('ai', reply);
    aiChatHistory.push({ role: 'model', content: reply });
    setAIChatStatus('Sẵn sàng hỗ trợ', '#10b981');
  } catch (err) {
    hideAITyping();
    appendAIMessage('ai', `❌ ${err.message || 'Không thể kết nối AI. Vui lòng thử lại.'}`);
    setAIChatStatus('Gặp lỗi', '#f43f5e');
    setTimeout(() => setAIChatStatus('Sẵn sàng hỗ trợ', '#10b981'), 3000);
  } finally {
    aiChatTyping = false;
    if (sendBtn) sendBtn.disabled = false;
    if (inputEl) { inputEl.disabled = false; inputEl.focus(); }
  }
}

// Init chat when #app becomes visible (post-login)
document.addEventListener('DOMContentLoaded', () => {
  const appEl = document.getElementById('app');
  if (!appEl) return;
  const obs = new MutationObserver(() => {
    if (appEl.style.display !== 'none') {
      initAIChat();
    }
  });
  obs.observe(appEl, { attributes: true, attributeFilter: ['style'] });
});
