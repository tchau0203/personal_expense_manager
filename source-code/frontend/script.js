/* ================================================================
   script.js — Personal Expense Manager Phase 2
   ================================================================ */

const API = '/api';

// ── Category helpers ─────────────────────────────────────────────
const CATEGORY_EMOJI = {
  'Ăn uống': '🍜', 'Đi lại': '🚗', 'Mua sắm': '🛍️',
  'Giải trí': '🎮', 'Y tế': '💊', 'Giáo dục': '📚',
  'Tiền nhà': '🏠', 'Khác': '📦'
};
const emoji = cat => CATEGORY_EMOJI[cat] || '📦';

// ── Format helpers ───────────────────────────────────────────────
const formatVND = n =>
  Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const formatDate = str => {
  if (!str) return '—';
  const d = new Date(str);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Toast ────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  clearTimeout(toastTimer);
  el.textContent = msg;
  el.className = `toast ${type}`;
  requestAnimationFrame(() => el.classList.add('show'));
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

// ── Auth State ───────────────────────────────────────────────────
let currentToken = localStorage.getItem('token') || null;
let currentUser  = JSON.parse(localStorage.getItem('user') || 'null');

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {})
  };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers || {}) }
  });

  if (res.status === 401) {
    logout(false);
    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Lỗi ${res.status}`);
  return data;
}

// ── Auth functions ───────────────────────────────────────────────
async function doLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-login');
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  clearAuthErrors('login');
  if (!username) { setErr('err-login-username', 'Vui lòng nhập tên đăng nhập.'); return; }
  if (!password) { setErr('err-login-password', 'Vui lòng nhập mật khẩu.'); return; }

  setLoading(btn, true);
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    saveAuth(data.token, data.user);
    showApp();
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
}

async function doRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-register');
  const username = document.getElementById('reg-username').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  clearAuthErrors('register');
  let valid = true;
  if (!username) { setErr('err-reg-username', 'Vui lòng nhập tên đăng nhập.'); valid = false; }
  if (!email || !/\S+@\S+\.\S+/.test(email)) { setErr('err-reg-email', 'Email không hợp lệ.'); valid = false; }
  if (!password || password.length < 6) { setErr('err-reg-password', 'Mật khẩu phải có ít nhất 6 ký tự.'); valid = false; }
  if (!valid) return;

  setLoading(btn, true);
  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
    saveAuth(data.token, data.user);
    showApp();
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
}

function saveAuth(token, user) {
  currentToken = token;
  currentUser  = user;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function logout(redirect = true) {
  currentToken = null;
  currentUser  = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  allExpenses = [];
  if (redirect) showAuthPage();
}

function showAuthPage() {
  document.getElementById('auth-page').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

function showApp() {
  document.getElementById('auth-page').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  updateSidebarUser();
  loadExpenses();
  initBudgetSelectors();
}

function updateSidebarUser() {
  if (!currentUser) return;
  const initials = currentUser.username.charAt(0).toUpperCase();
  document.getElementById('sidebar-avatar').textContent     = initials;
  document.getElementById('sidebar-username').textContent   = currentUser.username;
  document.getElementById('profile-avatar-big').textContent = initials;
  document.getElementById('profile-username').textContent   = currentUser.username;
  document.getElementById('profile-email').textContent      = currentUser.email || '—';
  document.getElementById('profile-created').textContent    = currentUser.created_at
    ? formatDate(currentUser.created_at) : '—';
}

function setErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearAuthErrors(type) {
  const ids = type === 'login'
    ? ['err-login-username', 'err-login-password']
    : ['err-reg-username', 'err-reg-email', 'err-reg-password'];
  ids.forEach(id => setErr(id, ''));
}

function setLoading(btn, loading) {
  const text   = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');
  if (text)   text.style.display   = loading ? 'none' : 'inline';
  if (loader) loader.style.display = loading ? 'inline' : 'none';
  btn.disabled = loading;
}

// ── Expense State ────────────────────────────────────────────────
let allExpenses    = [];
let pendingDeleteId = null;
let currentPage    = 1;
const PAGE_LIMIT   = 20;

// ── Load Expenses ────────────────────────────────────────────────
async function loadExpenses() {
  try {
    const search   = document.getElementById('search-input')?.value.trim() || '';
    const category = document.getElementById('filter-category')?.value || '';
    const sort     = document.getElementById('sort-select')?.value || 'date-desc';

    const params = new URLSearchParams({
      page: currentPage, limit: PAGE_LIMIT, sort,
      ...(search   ? { search }   : {}),
      ...(category ? { category } : {})
    });

    const data = await apiFetch(`/expenses?${params}`);
    allExpenses = data.data || data;
    const total = data.total || allExpenses.length;

    renderDashboard();
    renderTable();
    renderPagination(total);
  } catch (e) {
    showToast('❌ ' + e.message, 'error');
  }
}

// ── Dashboard ────────────────────────────────────────────────────
function renderDashboard() {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear  = now.getFullYear();

  const total = allExpenses.reduce((s, x) => s + Number(x.amount), 0);
  const monthly = allExpenses
    .filter(x => {
      const d = new Date(x.expense_date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    })
    .reduce((s, x) => s + Number(x.amount), 0);
  const count = allExpenses.length;
  const avg   = count ? total / count : 0;

  document.getElementById('stat-total').textContent = formatVND(total);
  document.getElementById('stat-month').textContent = formatVND(monthly);
  document.getElementById('stat-count').textContent = count;
  document.getElementById('stat-avg').textContent   = formatVND(avg);
  document.getElementById('stat-month-label').textContent =
    `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;

  renderCategorySummary(total);
  renderRecentList();
}

function renderCategorySummary(grandTotal) {
  const catMap = {};
  allExpenses.forEach(x => {
    catMap[x.category] = (catMap[x.category] || 0) + Number(x.amount);
  });
  const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const el = document.getElementById('category-summary');

  if (!sorted.length) {
    el.innerHTML = '<div class="empty-state small">Chưa có dữ liệu</div>';
    return;
  }

  el.innerHTML = sorted.map(([cat, amt]) => {
    const pct = grandTotal ? Math.round((amt / grandTotal) * 100) : 0;
    return `
      <div class="category-item">
        <span class="cat-emoji">${emoji(cat)}</span>
        <div class="cat-info">
          <div class="cat-name">${cat} <span style="color:var(--text-muted);font-size:11px">(${pct}%)</span></div>
          <div class="cat-bar-wrap"><div class="cat-bar" style="width:${pct}%"></div></div>
        </div>
        <span class="cat-amount">${formatVND(amt)}</span>
      </div>`;
  }).join('');
}

function renderRecentList() {
  const el     = document.getElementById('recent-list');
  const recent = [...allExpenses].slice(0, 5);

  if (!recent.length) {
    el.innerHTML = '<div class="empty-state small">Chưa có giao dịch nào</div>';
    return;
  }
  el.innerHTML = recent.map(x => `
    <div class="recent-item">
      <div class="recent-icon">${emoji(x.category)}</div>
      <div class="recent-body">
        <div class="recent-desc">${escHtml(x.description)}</div>
        <div class="recent-meta">${x.category} · ${formatDate(x.expense_date)}</div>
      </div>
      <span class="recent-amount">-${formatVND(x.amount)}</span>
    </div>`).join('');
}

// ── Expense Table ────────────────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById('expense-tbody');
  if (!allExpenses.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">Không tìm thấy khoản chi tiêu nào.</div></td></tr>`;
    return;
  }
  tbody.innerHTML = allExpenses.map((x, i) => `
    <tr>
      <td style="color:var(--text-muted)">${(currentPage - 1) * PAGE_LIMIT + i + 1}</td>
      <td>
        ${escHtml(x.description)}
        ${x.is_recurring ? '<span class="badge-recurring">🔁 Định kỳ</span>' : ''}
      </td>
      <td><span class="category-badge">${emoji(x.category)} ${x.category}</span></td>
      <td style="color:var(--text-secondary)">${formatDate(x.expense_date)}</td>
      <td class="amount-cell">-${formatVND(x.amount)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-edit" id="edit-${x.id}" onclick="openEditModal(${x.id})">✏️ Sửa</button>
          <button class="btn-delete" id="del-${x.id}" onclick="confirmDelete(${x.id})">🗑️ Xoá</button>
        </div>
      </td>
    </tr>`).join('');
}

// ── Pagination ───────────────────────────────────────────────────
function renderPagination(total) {
  const pages    = Math.ceil(total / PAGE_LIMIT);
  const el       = document.getElementById('pagination');
  if (!el || pages <= 1) { if (el) el.innerHTML = ''; return; }

  let html = `<button class="page-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - currentPage) <= 2) {
      html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" onclick="goPage(${p})">${p}</button>`;
    } else if (Math.abs(p - currentPage) === 3) {
      html += `<span style="color:var(--text-muted);padding:0 4px">…</span>`;
    }
  }
  html += `<button class="page-btn" onclick="goPage(${currentPage + 1})" ${currentPage === pages ? 'disabled' : ''}>›</button>`;
  el.innerHTML = html;
}

function goPage(p) {
  currentPage = p;
  loadExpenses();
}

// ── Add Expense ──────────────────────────────────────────────────
function validateForm() {
  const desc   = document.getElementById('input-desc');
  const amount = document.getElementById('input-amount');
  const date   = document.getElementById('input-date');
  const cat    = document.getElementById('input-category');
  let valid    = true;

  const setFieldErr = (el, errId, msg) => {
    document.getElementById(errId).textContent = msg;
    el.classList.toggle('invalid', !!msg);
    if (msg) valid = false;
  };

  setFieldErr(desc,   'err-desc',     desc.value.trim() ? '' : 'Vui lòng nhập mô tả.');
  setFieldErr(amount, 'err-amount',
    !amount.value ? 'Vui lòng nhập số tiền.' :
    Number(amount.value) <= 0 ? 'Số tiền phải lớn hơn 0.' : '');
  setFieldErr(date,   'err-date',     date.value ? '' : 'Vui lòng chọn ngày.');
  setFieldErr(cat,    'err-category', cat.value  ? '' : 'Vui lòng chọn danh mục.');

  return valid;
}

async function submitExpense(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const btn = document.getElementById('btn-submit');
  setLoading(btn, true);

  const editId = document.getElementById('edit-id').value;
  const isRecurring = document.getElementById('input-recurring').checked;
  const body = {
    description:        document.getElementById('input-desc').value.trim(),
    amount:             Number(document.getElementById('input-amount').value),
    category:           document.getElementById('input-category').value,
    date:               document.getElementById('input-date').value,
    is_recurring:       isRecurring,
    recurring_interval: isRecurring ? document.getElementById('input-recurring-interval').value : null,
  };

  try {
    if (editId) {
      await apiFetch(`/expenses/${editId}`, { method: 'PUT', body: JSON.stringify(body) });
      showToast('✅ Đã cập nhật chi tiêu!', 'success');
    } else {
      await apiFetch('/expenses', { method: 'POST', body: JSON.stringify(body) });
      showToast('✅ Đã thêm khoản chi tiêu thành công!', 'success');
    }
    closeModal();
    resetForm();
    currentPage = 1;
    await loadExpenses();
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
}

function resetForm() {
  document.getElementById('expense-form').reset();
  document.getElementById('edit-id').value = '';
  document.getElementById('modal-title').textContent = 'Thêm khoản chi tiêu';
  document.getElementById('btn-submit').querySelector('.btn-text').textContent = 'Lưu chi tiêu';
  document.getElementById('input-recurring-interval').style.display = 'none';
  ['err-desc','err-amount','err-date','err-category'].forEach(id =>
    document.getElementById(id).textContent = '');
  ['input-desc','input-amount','input-date','input-category'].forEach(id =>
    document.getElementById(id).classList.remove('invalid'));
}

// ── Edit Expense ─────────────────────────────────────────────────
function openEditModal(id) {
  const exp = allExpenses.find(x => x.id === id);
  if (!exp) return;

  document.getElementById('edit-id').value = id;
  document.getElementById('modal-title').textContent = 'Chỉnh sửa chi tiêu';
  document.getElementById('btn-submit').querySelector('.btn-text').textContent = 'Cập nhật';

  document.getElementById('input-desc').value     = exp.description;
  document.getElementById('input-amount').value   = Number(exp.amount);
  document.getElementById('input-date').value     = exp.expense_date
    ? exp.expense_date.split('T')[0] : '';
  document.getElementById('input-category').value = exp.category;
  document.getElementById('input-recurring').checked = exp.is_recurring || false;

  const intervalSel = document.getElementById('input-recurring-interval');
  if (exp.is_recurring) {
    intervalSel.style.display = '';
    intervalSel.value = exp.recurring_interval || 'monthly';
  } else {
    intervalSel.style.display = 'none';
  }

  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('input-desc').focus();
}

// ── Delete ───────────────────────────────────────────────────────
function confirmDelete(id) {
  pendingDeleteId = id;
  document.getElementById('confirm-overlay').classList.add('open');
}

async function doDelete() {
  if (!pendingDeleteId) return;
  try {
    await apiFetch(`/expenses/${pendingDeleteId}`, { method: 'DELETE' });
    showToast('🗑️ Đã xoá khoản chi tiêu.', 'info');
    await loadExpenses();
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  } finally {
    pendingDeleteId = null;
    document.getElementById('confirm-overlay').classList.remove('open');
  }
}

// ── Modal helpers ────────────────────────────────────────────────
function openModal() {
  resetForm();
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('input-date').value = today;
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('input-desc').focus();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  resetForm();
}

// ── Navigation ───────────────────────────────────────────────────
function navigate(target) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));

  const titles = {
    dashboard: ['Tổng quan',     'Xin chào! Đây là tóm tắt chi tiêu của bạn.'],
    analytics: ['Phân tích',     'Biểu đồ và xu hướng chi tiêu của bạn.'],
    budget:    ['Ngân sách',     'Thiết lập và theo dõi giới hạn chi tiêu.'],
    list:      ['Danh sách',     'Tất cả các khoản đã ghi nhận.'],
    profile:   ['Hồ sơ cá nhân','Thông tin tài khoản và cài đặt.'],
  };
  const t = titles[target] || titles.dashboard;
  document.getElementById('page-title').textContent    = t[0];
  document.getElementById('page-subtitle').textContent = t[1];

  const navEl = document.getElementById(`nav-${target}`);
  if (navEl) navEl.classList.add('active');
  const sectEl = document.getElementById(`section-${target}`);
  if (sectEl) sectEl.classList.add('active');

  if (target === 'list')      { currentPage = 1; loadExpenses(); }
  if (target === 'analytics') renderCharts();
  if (target === 'budget')    loadBudgets();
  if (target === 'profile')   loadProfile();
}

// ── Dark Mode ────────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeBtn(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeBtn(next);
  // Re-render charts with new theme
  if (document.getElementById('section-analytics').classList.contains('active')) {
    destroyCharts();
    renderCharts();
  }
}

function updateThemeBtn(theme) {
  const btn = document.getElementById('btn-theme');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ── Charts ───────────────────────────────────────────────────────
let chartInstances = {};

function destroyCharts() {
  Object.values(chartInstances).forEach(c => c && c.destroy());
  chartInstances = {};
}

let currentRange = 'month';

function getChartColors() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  return {
    text:    isDark ? '#9fa8c7' : '#4a5280',
    grid:    isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
    tooltip: isDark ? '#1e2130' : '#ffffff',
  };
}

function getFilteredForCharts() {
  const now   = new Date();
  let from    = new Date();
  if (currentRange === 'month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (currentRange === '3months') {
    from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  } else {
    from = new Date(now.getFullYear(), 0, 1);
  }
  return allExpenses.filter(x => new Date(x.expense_date) >= from);
}

async function renderCharts() {
  // Reload all data for charts (no pagination)
  try {
    const data = await apiFetch(`/expenses?limit=1000&sort=date-asc`);
    const expenses = data.data || data;

    const now  = new Date();
    let from   = new Date();
    if (currentRange === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (currentRange === '3months') {
      from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    } else {
      from = new Date(now.getFullYear(), 0, 1);
    }
    const filtered = expenses.filter(x => new Date(x.expense_date) >= from);

    destroyCharts();
    renderPieChart(filtered);
    renderBarChart(expenses);
    renderLineChart(expenses);
  } catch (e) {
    showToast('❌ Lỗi tải biểu đồ: ' + e.message, 'error');
  }
}

function renderPieChart(data) {
  const catMap = {};
  data.forEach(x => {
    catMap[x.category] = (catMap[x.category] || 0) + Number(x.amount);
  });
  const labels = Object.keys(catMap);
  const values = Object.values(catMap);
  const colors = ['#6c63ff','#60a5fa','#4ade80','#fbbf24','#f87171','#a78bfa','#34d399','#fb923c'];
  const { text, tooltip } = getChartColors();

  const ctx = document.getElementById('chart-pie').getContext('2d');
  chartInstances.pie = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors.slice(0, labels.length), borderWidth: 0 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: text, font: { family: 'Inter', size: 12 }, padding: 12 } },
        tooltip: {
          backgroundColor: tooltip,
          bodyColor: text, titleColor: text,
          callbacks: { label: ctx => ` ${formatVND(ctx.raw)}` }
        }
      }
    }
  });
}

function renderBarChart(data) {
  const monthMap = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
    monthMap[key] = 0;
  }
  data.forEach(x => {
    const d   = new Date(x.expense_date);
    const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
    if (key in monthMap) monthMap[key] += Number(x.amount);
  });

  const { text, grid, tooltip } = getChartColors();
  const ctx = document.getElementById('chart-bar').getContext('2d');
  chartInstances.bar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(monthMap),
      datasets: [{
        label: 'Chi tiêu',
        data: Object.values(monthMap),
        backgroundColor: 'rgba(108,99,255,0.7)',
        borderRadius: 6, borderSkipped: false,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tooltip, bodyColor: text, titleColor: text,
          callbacks: { label: ctx => ` ${formatVND(ctx.raw)}` }
        }
      },
      scales: {
        x: { ticks: { color: text }, grid: { color: grid } },
        y: { ticks: { color: text, callback: v => formatVND(v) }, grid: { color: grid } }
      }
    }
  });
}

function renderLineChart(data) {
  const dayMap = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dayMap[key] = 0;
  }
  data.forEach(x => {
    const key = x.expense_date?.split('T')[0];
    if (key in dayMap) dayMap[key] += Number(x.amount);
  });

  const { text, grid, tooltip } = getChartColors();
  const ctx = document.getElementById('chart-line').getContext('2d');
  chartInstances.line = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Object.keys(dayMap).map(d => {
        const dt = new Date(d);
        return `${dt.getDate()}/${dt.getMonth() + 1}`;
      }),
      datasets: [{
        label: 'Chi tiêu',
        data: Object.values(dayMap),
        borderColor: '#6c63ff', backgroundColor: 'rgba(108,99,255,0.1)',
        borderWidth: 2, pointRadius: 3, fill: true, tension: 0.4,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tooltip, bodyColor: text, titleColor: text,
          callbacks: { label: ctx => ` ${formatVND(ctx.raw)}` }
        }
      },
      scales: {
        x: { ticks: { color: text, maxTicksLimit: 10 }, grid: { color: grid } },
        y: { ticks: { color: text, callback: v => formatVND(v) }, grid: { color: grid } }
      }
    }
  });
}

// ── Budget ───────────────────────────────────────────────────────
function initBudgetSelectors() {
  const now = new Date();
  const mSel = document.getElementById('budget-month-sel');
  const ySel = document.getElementById('budget-year-sel');
  if (!mSel || !ySel) return;

  mSel.innerHTML = Array.from({ length: 12 }, (_, i) =>
    `<option value="${i + 1}" ${i + 1 === now.getMonth() + 1 ? 'selected' : ''}>Tháng ${i + 1}</option>`
  ).join('');

  ySel.innerHTML = [-1, 0, 1].map(offset => {
    const y = now.getFullYear() + offset;
    return `<option value="${y}" ${offset === 0 ? 'selected' : ''}>${y}</option>`;
  }).join('');

  mSel.addEventListener('change', loadBudgets);
  ySel.addEventListener('change', loadBudgets);
}

async function loadBudgets() {
  const month = document.getElementById('budget-month-sel')?.value;
  const year  = document.getElementById('budget-year-sel')?.value;
  if (!month || !year) return;

  try {
    const budgets = await apiFetch(`/budgets?month=${month}&year=${year}`);
    renderBudgetList(budgets);
  } catch (e) {
    showToast('❌ ' + e.message, 'error');
  }
}

function renderBudgetList(budgets) {
  const el = document.getElementById('budget-list');
  if (!budgets.length) {
    el.innerHTML = '<div class="empty-state">Chưa có ngân sách nào cho tháng này.</div>';
    return;
  }

  el.innerHTML = budgets.map(b => {
    const pct     = b.amount > 0 ? Math.round((b.spent / b.amount) * 100) : 0;
    const barClass = pct >= 100 ? 'over' : pct >= 80 ? 'warning' : '';
    const pctClass = pct >= 100 ? 'danger-text' : pct >= 80 ? 'warn-text' : '';
    const warning  = pct >= 80 ? (pct >= 100 ? ' ⚠️ Đã vượt ngân sách!' : ' ⚠️ Gần đến giới hạn!') : '';
    return `
      <div class="budget-item">
        <div class="budget-item-header">
          <div class="budget-cat">${emoji(b.category)} ${b.category}</div>
          <div class="budget-amounts">Đã chi: <span>${formatVND(b.spent)}</span> / ${formatVND(b.amount)}</div>
        </div>
        <div class="budget-bar-wrap">
          <div class="budget-bar ${barClass}" style="width:${Math.min(pct, 100)}%"></div>
        </div>
        <div class="budget-pct ${pctClass}">${pct}%${warning}</div>
        <div class="budget-actions">
          <button class="btn btn-ghost btn-sm" onclick="deleteBudget(${b.id})">🗑️ Xoá</button>
        </div>
      </div>`;
  }).join('');
}

async function submitBudget(e) {
  e.preventDefault();
  const amount = Number(document.getElementById('budget-amount').value);
  if (!amount || amount <= 0) {
    setErr('err-budget-amount', 'Ngân sách phải lớn hơn 0.');
    return;
  }
  setErr('err-budget-amount', '');

  const category = document.getElementById('budget-category').value;
  const month    = document.getElementById('budget-month-sel').value;
  const year     = document.getElementById('budget-year-sel').value;

  try {
    await apiFetch('/budgets', {
      method: 'POST',
      body: JSON.stringify({ category, amount, month: parseInt(month), year: parseInt(year) })
    });
    showToast('✅ Đã lưu ngân sách!', 'success');
    document.getElementById('budget-modal-overlay').classList.remove('open');
    document.getElementById('budget-form').reset();
    await loadBudgets();
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  }
}

async function deleteBudget(id) {
  try {
    await apiFetch(`/budgets/${id}`, { method: 'DELETE' });
    showToast('🗑️ Đã xoá ngân sách.', 'info');
    loadBudgets();
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  }
}

// ── Profile ──────────────────────────────────────────────────────
async function loadProfile() {
  try {
    const user = await apiFetch('/auth/me');
    document.getElementById('profile-username').textContent = user.username;
    document.getElementById('profile-email').textContent    = user.email;
    document.getElementById('profile-created').textContent  = formatDate(user.created_at);
    const initials = user.username.charAt(0).toUpperCase();
    document.getElementById('profile-avatar-big').textContent = initials;
  } catch (e) {
    console.error(e);
  }
}

async function submitChangePassword(e) {
  e.preventDefault();
  const oldPw  = document.getElementById('old-password').value;
  const newPw  = document.getElementById('new-password').value;
  const confPw = document.getElementById('confirm-password').value;

  ['err-old-pw','err-new-pw','err-confirm-pw'].forEach(id => setErr(id, ''));
  let valid = true;
  if (!oldPw) { setErr('err-old-pw', 'Vui lòng nhập mật khẩu hiện tại.'); valid = false; }
  if (!newPw || newPw.length < 6) { setErr('err-new-pw', 'Mật khẩu mới phải có ít nhất 6 ký tự.'); valid = false; }
  if (newPw !== confPw) { setErr('err-confirm-pw', 'Mật khẩu không khớp.'); valid = false; }
  if (!valid) return;

  try {
    await apiFetch('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw })
    });
    showToast('✅ Đã đổi mật khẩu thành công!', 'success');
    document.getElementById('change-pw-form').reset();
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  }
}

// ── Export ───────────────────────────────────────────────────────
async function exportCSV() {
  try {
    const data = await apiFetch('/expenses?limit=5000&sort=date-desc');
    const expenses = data.data || data;
    const header = 'STT,Mô tả,Danh mục,Ngày,Số tiền (VND),Định kỳ';
    const rows = expenses.map((x, i) =>
      `${i + 1},"${x.description.replace(/"/g, '""')}",${x.category},${x.expense_date?.split('T')[0]},${Number(x.amount)},${x.is_recurring ? 'Có' : 'Không'}`
    );
    const csv  = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `chi-tieu-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast('📥 Đã xuất file CSV!', 'success');
  } catch (e) {
    showToast('❌ ' + e.message, 'error');
  }
}

async function exportPDF() {
  try {
    // Dynamic import jsPDF
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    document.head.appendChild(script);
    await new Promise(res => { script.onload = res; });

    const data     = await apiFetch('/expenses?limit=5000&sort=date-desc');
    const expenses = data.data || data;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('BAO CAO CHI TIEU CA NHAN', 14, 18);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, 14, 26);

    let y = 38;
    doc.setFont('helvetica', 'bold');
    doc.text('STT', 14, y); doc.text('Mo ta', 26, y);
    doc.text('Danh muc', 100, y); doc.text('Ngay', 135, y); doc.text('So tien', 165, y);
    doc.line(14, y + 2, 196, y + 2);
    y += 8;
    doc.setFont('helvetica', 'normal');

    let total = 0;
    expenses.forEach((x, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      const amt = Number(x.amount);
      total += amt;
      const desc = x.description.length > 45 ? x.description.substring(0, 45) + '...' : x.description;
      doc.text(String(i + 1), 14, y);
      doc.text(desc, 26, y);
      doc.text(x.category, 100, y);
      doc.text(x.expense_date?.split('T')[0] || '', 135, y);
      doc.text(amt.toLocaleString('vi-VN'), 165, y);
      y += 7;
    });

    doc.line(14, y + 2, 196, y + 2);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text(`Tong cong: ${total.toLocaleString('vi-VN')} VND`, 14, y);

    doc.save(`bao-cao-chi-tieu-${Date.now()}.pdf`);
    showToast('📄 Đã xuất file PDF!', 'success');
  } catch (e) {
    showToast('❌ Lỗi xuất PDF: ' + e.message, 'error');
  }
}

// ── Keyboard Shortcuts ───────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (!currentToken) return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
  if (e.key === 'n' || e.key === 'N') openModal();
  if (e.key === 'Escape') {
    closeModal();
    document.querySelectorAll('.modal-overlay').forEach(o => o.classList.remove('open'));
  }
});

// ── Init ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  // Header date
  const now = new Date();
  document.getElementById('header-date').textContent =
    now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  // Auth forms
  document.getElementById('login-form').addEventListener('submit', doLogin);
  document.getElementById('register-form').addEventListener('submit', doRegister);
  document.getElementById('go-register').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('login-form-wrap').style.display    = 'none';
    document.getElementById('register-form-wrap').style.display = '';
  });
  document.getElementById('go-login').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('register-form-wrap').style.display = 'none';
    document.getElementById('login-form-wrap').style.display    = '';
  });

  // Logout
  document.getElementById('btn-logout').addEventListener('click', () => logout());

  // Navigation
  document.getElementById('nav-dashboard').addEventListener('click', e => { e.preventDefault(); navigate('dashboard'); });
  document.getElementById('nav-analytics').addEventListener('click', e => { e.preventDefault(); navigate('analytics'); });
  document.getElementById('nav-budget').addEventListener('click',    e => { e.preventDefault(); navigate('budget'); });
  document.getElementById('nav-add').addEventListener('click',       e => { e.preventDefault(); openModal(); });
  document.getElementById('nav-list').addEventListener('click',      e => { e.preventDefault(); navigate('list'); });
  document.getElementById('nav-profile').addEventListener('click',   e => { e.preventDefault(); navigate('profile'); });
  document.getElementById('link-view-all').addEventListener('click', e => { e.preventDefault(); navigate('list'); });

  // Theme
  document.getElementById('btn-theme').addEventListener('click', toggleTheme);

  // Header add button
  document.getElementById('btn-open-add-modal').addEventListener('click', openModal);

  // Expense modal
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('btn-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  // Recurring toggle
  document.getElementById('input-recurring').addEventListener('change', e => {
    document.getElementById('input-recurring-interval').style.display =
      e.target.checked ? '' : 'none';
  });

  // Expense form
  document.getElementById('expense-form').addEventListener('submit', submitExpense);

  // Delete confirm
  document.getElementById('btn-confirm-delete').addEventListener('click', doDelete);
  document.getElementById('btn-confirm-cancel').addEventListener('click', () => {
    pendingDeleteId = null;
    document.getElementById('confirm-overlay').classList.remove('open');
  });

  // Search / filter
  document.getElementById('search-input').addEventListener('input', () => { currentPage = 1; loadExpenses(); });
  document.getElementById('filter-category').addEventListener('change', () => { currentPage = 1; loadExpenses(); });
  document.getElementById('sort-select').addEventListener('change', () => { currentPage = 1; loadExpenses(); });

  // Export
  document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
  document.getElementById('btn-export-pdf').addEventListener('click', exportPDF);

  // Budget modal
  document.getElementById('btn-open-budget-modal').addEventListener('click', () => {
    document.getElementById('budget-modal-overlay').classList.add('open');
  });
  document.getElementById('budget-modal-close').addEventListener('click', () => {
    document.getElementById('budget-modal-overlay').classList.remove('open');
  });
  document.getElementById('budget-modal-cancel').addEventListener('click', () => {
    document.getElementById('budget-modal-overlay').classList.remove('open');
  });
  document.getElementById('budget-form').addEventListener('submit', submitBudget);

  // Analytics time filter
  document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRange = btn.dataset.range;
      renderCharts();
    });
  });

  // Profile
  document.getElementById('change-pw-form').addEventListener('submit', submitChangePassword);

  // Check auth on load
  if (currentToken && currentUser) {
    showApp();
  } else {
    showAuthPage();
  }
});
