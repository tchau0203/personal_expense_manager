/* ===========================
   script.js — Personal Expense Manager
   =========================== */

const API = '/api/expenses';

// ── Category helpers ─────────────────────────────────────────────────────────
const CATEGORY_EMOJI = {
  'Ăn uống': '🍜', 'Đi lại': '🚗', 'Mua sắm': '🛍️',
  'Giải trí': '🎮', 'Y tế': '💊', 'Giáo dục': '📚',
  'Tiền nhà': '🏠', 'Khác': '📦'
};

const emoji = cat => CATEGORY_EMOJI[cat] || '📦';

// ── Format currency ───────────────────────────────────────────────────────────
const formatVND = n =>
  Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

// ── Format date ───────────────────────────────────────────────────────────────
const formatDate = str => {
  if (!str) return '—';
  const d = new Date(str);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ── Toast ─────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  clearTimeout(toastTimer);
  el.textContent = msg;
  el.className = `toast ${type}`;
  requestAnimationFrame(() => el.classList.add('show'));
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

// ── State ─────────────────────────────────────────────────────────────────────
let allExpenses = [];
let pendingDeleteId = null;

// ── Fetch all expenses ────────────────────────────────────────────────────────
async function loadExpenses() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error('Không thể tải dữ liệu');
    allExpenses = await res.json();
    renderDashboard();
    renderTable();
  } catch (e) {
    showToast('❌ ' + e.message, 'error');
  }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function renderDashboard() {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const total = allExpenses.reduce((s, x) => s + Number(x.amount), 0);
  const monthlyExpenses = allExpenses.filter(x => {
    const d = new Date(x.expense_date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const monthly = monthlyExpenses.reduce((s, x) => s + Number(x.amount), 0);
  const count = allExpenses.length;
  const avg = count ? total / count : 0;

  document.getElementById('stat-total').textContent = formatVND(total);
  document.getElementById('stat-month').textContent = formatVND(monthly);
  document.getElementById('stat-count').textContent = count;
  document.getElementById('stat-avg').textContent = formatVND(avg);
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
  const el = document.getElementById('recent-list');
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

// ── Expense Table ─────────────────────────────────────────────────────────────
function getFiltered() {
  const search = document.getElementById('search-input').value.trim().toLowerCase();
  const cat = document.getElementById('filter-category').value;
  const sort = document.getElementById('sort-select').value;

  let list = [...allExpenses];

  if (search) list = list.filter(x => x.description.toLowerCase().includes(search));
  if (cat) list = list.filter(x => x.category === cat);

  if (sort === 'date-desc') list.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
  else if (sort === 'date-asc') list.sort((a, b) => new Date(a.expense_date) - new Date(b.expense_date));
  else if (sort === 'amount-desc') list.sort((a, b) => Number(b.amount) - Number(a.amount));
  else if (sort === 'amount-asc') list.sort((a, b) => Number(a.amount) - Number(b.amount));

  return list;
}

function renderTable() {
  const tbody = document.getElementById('expense-tbody');
  const list = getFiltered();

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">Không tìm thấy khoản chi tiêu nào.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((x, i) => `
    <tr>
      <td style="color:var(--text-muted)">${i + 1}</td>
      <td>${escHtml(x.description)}</td>
      <td><span class="category-badge">${emoji(x.category)} ${x.category}</span></td>
      <td style="color:var(--text-secondary)">${formatDate(x.expense_date)}</td>
      <td class="amount-cell">-${formatVND(x.amount)}</td>
      <td>
        <button class="btn-delete" data-id="${x.id}" id="del-${x.id}" onclick="confirmDelete(${x.id})">
          🗑️ Xoá
        </button>
      </td>
    </tr>`).join('');
}

// ── Add Expense ───────────────────────────────────────────────────────────────
function validateForm() {
  const desc = document.getElementById('input-desc');
  const amount = document.getElementById('input-amount');
  const date = document.getElementById('input-date');
  const cat = document.getElementById('input-category');
  let valid = true;

  const setErr = (el, errId, msg) => {
    document.getElementById(errId).textContent = msg;
    el.classList.toggle('invalid', !!msg);
    if (msg) valid = false;
  };

  setErr(desc, 'err-desc', desc.value.trim() ? '' : 'Vui lòng nhập mô tả.');
  setErr(amount, 'err-amount',
    !amount.value ? 'Vui lòng nhập số tiền.' :
    Number(amount.value) <= 0 ? 'Số tiền phải lớn hơn 0.' : '');
  setErr(date, 'err-date', date.value ? '' : 'Vui lòng chọn ngày.');
  setErr(cat, 'err-category', cat.value ? '' : 'Vui lòng chọn danh mục.');

  return valid;
}

async function submitExpense(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const btnText = document.querySelector('.btn-text');
  const btnLoader = document.querySelector('.btn-loader');
  const btnSubmit = document.getElementById('btn-submit');

  btnText.style.display = 'none';
  btnLoader.style.display = 'inline';
  btnSubmit.disabled = true;

  const body = {
    description: document.getElementById('input-desc').value.trim(),
    amount: Number(document.getElementById('input-amount').value),
    category: document.getElementById('input-category').value,
    date: document.getElementById('input-date').value,
  };

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Thêm chi tiêu thất bại');
    showToast('✅ Đã thêm khoản chi tiêu thành công!', 'success');
    closeModal();
    resetForm();
    await loadExpenses();
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  } finally {
    btnText.style.display = 'inline';
    btnLoader.style.display = 'none';
    btnSubmit.disabled = false;
  }
}

function resetForm() {
  document.getElementById('expense-form').reset();
  ['err-desc','err-amount','err-date','err-category'].forEach(id => {
    document.getElementById(id).textContent = '';
  });
  ['input-desc','input-amount','input-date','input-category'].forEach(id => {
    document.getElementById(id).classList.remove('invalid');
  });
}

// ── Delete ────────────────────────────────────────────────────────────────────
function confirmDelete(id) {
  pendingDeleteId = id;
  document.getElementById('confirm-overlay').classList.add('open');
}

async function doDelete() {
  if (!pendingDeleteId) return;
  try {
    const res = await fetch(`${API}/${pendingDeleteId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Không thể xoá');
    showToast('🗑️ Đã xoá khoản chi tiêu.', 'info');
    await loadExpenses();
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  } finally {
    pendingDeleteId = null;
    document.getElementById('confirm-overlay').classList.remove('open');
  }
}

// ── Navigation ────────────────────────────────────────────────────────────────
function navigate(target) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));

  const titles = { dashboard: ['Tổng quan', 'Xin chào! Đây là tóm tắt chi tiêu của bạn.'], list: ['Danh sách chi tiêu', 'Tất cả các khoản đã ghi nhận.'] };
  const t = titles[target] || titles.dashboard;
  document.getElementById('page-title').textContent = t[0];
  document.getElementById('page-subtitle').textContent = t[1];

  document.getElementById(`nav-${target}`).classList.add('active');
  document.getElementById(`section-${target}`).classList.add('active');

  if (target === 'list') renderTable();
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function openModal() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('input-date').value = today;
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('input-desc').focus();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

// ── Escape HTML ───────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Header date
  const now = new Date();
  document.getElementById('header-date').textContent =
    now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  // Navigation
  document.getElementById('nav-dashboard').addEventListener('click', e => { e.preventDefault(); navigate('dashboard'); });
  document.getElementById('nav-list').addEventListener('click', e => { e.preventDefault(); navigate('list'); });
  document.getElementById('nav-add').addEventListener('click', e => { e.preventDefault(); openModal(); });
  document.getElementById('link-view-all').addEventListener('click', e => { e.preventDefault(); navigate('list'); });

  // Modal open/close
  document.getElementById('btn-open-add-modal').addEventListener('click', openModal);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('btn-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  // Delete confirm
  document.getElementById('btn-confirm-delete').addEventListener('click', doDelete);
  document.getElementById('btn-confirm-cancel').addEventListener('click', () => {
    pendingDeleteId = null;
    document.getElementById('confirm-overlay').classList.remove('open');
  });

  // Form submit
  document.getElementById('expense-form').addEventListener('submit', submitExpense);

  // Filter & search realtime
  document.getElementById('search-input').addEventListener('input', renderTable);
  document.getElementById('filter-category').addEventListener('change', renderTable);
  document.getElementById('sort-select').addEventListener('change', renderTable);

  // Load data
  loadExpenses();
});
