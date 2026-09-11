const state = {
  view: 'dashboard',
  alumni: { page: 1, pageSize: 10, q: '', status: '', department: '', selected: new Set(), total: 0 },
  cache: { dashboard: null, events: [], news: [], notifications: [], settings: {} },
};

const token = localStorage.getItem('baustAdminToken');
const views = {
  dashboard: document.getElementById('dashboardView'),
  alumni: document.getElementById('alumniView'),
  events: document.getElementById('eventsView'),
  news: document.getElementById('newsView'),
  reports: document.getElementById('reportsView'),
  notifications: document.getElementById('notificationsView'),
  settings: document.getElementById('settingsView'),
};

if (!token) window.location.href = '/site/index3.html';

function $(selector, root = document) {
  return root.querySelector(selector);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  }[char]));
}

async function api(path, options = {}) {
  try {
    const response = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    if (response.status === 401) {
      localStorage.removeItem('baustAdminToken');
      window.location.href = '/site/index3.html';
      throw new Error('Unauthorized');
    }
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();
    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.payload = data;
      error.status = response.status;
      throw error;
    }
    return data;
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('TypeError')) {
      throw new Error('Network error - unable to reach the server. Please check your connection.');
    }
    throw error;
  }
}

function toast(message, tone = 'dark') {
  const item = document.createElement('div');
  item.className = 'toast';
  const toneColors = {
    error: '#dc2626',
    success: '#059669',
    info: '#0284c7',
    warn: '#d97706',
    dark: '#0f172a'
  };
  item.style.background = toneColors[tone] || toneColors.dark;
  item.textContent = message;
  document.getElementById('toastStack').appendChild(item);
  
  // Auto remove after 3.5 seconds
  const timer = setTimeout(() => {
    item.style.opacity = '0';
    item.style.transform = 'translateX(400px)';
    item.style.transition = 'all 0.3s ease';
    setTimeout(() => item.remove(), 300);
  }, 3200);
  
  // Allow manual close by clicking
  item.style.cursor = 'pointer';
  item.addEventListener('click', () => {
    clearTimeout(timer);
    item.style.opacity = '0';
    item.style.transform = 'translateX(400px)';
    setTimeout(() => item.remove(), 300);
  });
}

function setLoading(view, message = 'Loading data...') {
  views[view].innerHTML = `<div class="card card-pad empty" style="min-height: 200px; display: flex; align-items: center; justify-content: center;">
    <div style="text-align: center;">
      <div style="width: 40px; height: 40px; border: 3px solid var(--line); border-top-color: var(--brand); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px;" class="spinner"></div>
      <p>${message}</p>
    </div>
  </div>`;
}
if (!document.querySelector('style[data-loader]')) {
  const style = document.createElement('style');
  style.setAttribute('data-loader', '1');
  style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
}

function openModal(title, body) {
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = body;
  $('#modalBackdrop').hidden = false;
  // Focus on first input after modal opens
  setTimeout(() => {
    const firstInput = $('#modalBody').querySelector('input, select, textarea');
    if (firstInput) firstInput.focus();
  }, 150);
}

function closeModal() {
  $('#modalBackdrop').hidden = true;
  $('#modalBody').innerHTML = '';
}

function badge(value) {
  const clean = escapeHtml(value || 'draft');
  return `<span class="badge ${clean.toLowerCase()}">${clean}</span>`;
}

function field(name, label, value = '', type = 'text', full = false, extra = '') {
  const isRequired = !extra.includes('readonly') && name !== 'avatar' && name !== 'bio';
  const requiredAttr = isRequired ? 'required' : '';
  return `<div class="field ${full ? 'full' : ''}">
    <label for="${name}">${label}${isRequired ? '<span style="color:var(--danger);margin-left:2px;">*</span>' : ''}</label>
    <input id="${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" ${requiredAttr} ${extra} placeholder="Enter ${label.toLowerCase()}">
    <div class="field-error" data-error="${name}"></div>
  </div>`;
}

function textarea(name, label, value = '') {
  return `<div class="field full">
    <label for="${name}">${label}</label>
    <textarea id="${name}" name="${name}" rows="4">${escapeHtml(value)}</textarea>
    <div class="field-error" data-error="${name}"></div>
  </div>`;
}

function select(name, label, value, options) {
  return `<div class="field">
    <label for="${name}">${label}</label>
    <select id="${name}" name="${name}">
      ${options.map((option) => `<option value="${option}" ${value === option ? 'selected' : ''}>${option}</option>`).join('')}
    </select>
    <div class="field-error" data-error="${name}"></div>
  </div>`;
}

function serializeForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function showErrors(form, errors = {}) {
  form.querySelectorAll('[data-error]').forEach((node) => { node.textContent = ''; node.style.display = 'none'; });
  Object.entries(errors).forEach(([key, value]) => {
    const target = form.querySelector(`[data-error="${key}"]`);
    const input = form.querySelector(`[name="${key}"]`);
    if (target) {
      target.textContent = value;
      target.style.display = 'block';
      if (input) {
        input.style.borderColor = 'var(--danger)';
        input.addEventListener('input', () => {
          input.style.borderColor = '';
          target.textContent = '';
          target.style.display = 'none';
        }, { once: true });
      }
    }
  });
}

function renderBars(items, empty = 'No data available') {
  if (!items || !items.length) return `<div class="empty" style="min-height:150px;display:flex;align-items:center;justify-content:center;">${empty}</div>`;
  const max = Math.max(...items.map((item) => Number(item.value) || 0), 1);
  return items.map((item) => `<div class="bar-row">
    <span style="font-weight:500;color:var(--ink);">${escapeHtml(item.label)}</span>
    <div class="bar"><span style="width:${Math.max((Number(item.value) || 0) / max * 100, 3)}%"></span></div>
    <strong style="font-weight:700;min-width:40px;text-align:right;">${item.value}</strong>
  </div>`).join('');
}

async function renderDashboard() {
  setLoading('dashboard');
  const data = await api('/api/admin/dashboard');
  state.cache.dashboard = data;
  const stats = [
    { label: 'Alumni', number: data.stats.totalAlumni, detail: 'Total records', trend: '+ live', icon: '👥' },
    { label: 'Active', number: data.stats.activeAlumni, detail: 'Approved alumni', trend: '+ verified', icon: '✓' },
    { label: 'Pending', number: data.stats.pendingAlumni, detail: 'Need review', trend: '⚠ action', icon: '⏳' },
    { label: 'Events', number: data.stats.totalEvents, detail: `${data.stats.upcomingEvents} upcoming`, trend: '+ schedule', icon: '📅' },
    { label: 'News', number: data.stats.totalNews, detail: 'Announcements', trend: '+ content', icon: '📰' },
    { label: 'Participation', number: data.stats.eventRegistrations, detail: 'Event signups', trend: '+ engagement', icon: '👤' },
  ];
  views.dashboard.innerHTML = `
    <div style="margin-bottom: 24px;">
      <p class="eyebrow">Welcome back</p>
      <h1 style="margin-bottom: 2px;">Dashboard</h1>
      <p style="color: var(--muted); margin: 0;">Overview of your alumni association activity</p>
    </div>
    <div class="grid stats-grid">${stats.map((stat) => `
      <article class="card stat-card">
        <div class="icon" style="font-size:24px;">${stat.icon}</div>
        <strong>${stat.number.toLocaleString()}</strong>
        <p>${stat.label}</p>
        <span class="trend">${stat.detail}</span>
      </article>
    `).join('')}</div>
    <div class="grid two-grid" style="margin-top:24px">
      <section class="card card-pad chart"><h2>Alumni Registration Growth</h2>${renderBars(data.charts.alumniGrowth)}</section>
      <section class="card card-pad chart"><h2>Active vs Inactive</h2>${renderBars(data.charts.alumniStatus)}</section>
      <section class="card card-pad chart"><h2>Alumni by Department</h2>${renderBars(data.charts.alumniByDepartment)}</section>
      <section class="card card-pad chart"><h2>Event Participation</h2>${renderBars(data.charts.eventParticipation)}</section>
      <section class="card card-pad"><h2>Recent Registrations</h2>${renderAlumniMini(data.recentRegistrations)}</section>
      <section class="card card-pad"><h2>Recent Activities</h2>${renderActivities(data.recentActivities)}</section>
    </div>`;
}

function renderAlumniMini(rows) {
  if (!rows.length) return '<div class="empty" style="padding:20px;background:var(--bg-secondary);border-radius:10px;text-align:center;">No recent registrations yet</div>';
  return `<div class="activity-list">${rows.map((row) => `<div class="activity-item" style="display:flex;gap:10px;align-items:flex-start;">
    <div style="flex:1;">
      <strong style="display:block;margin-bottom:2px;">${escapeHtml(row.fullName)}</strong>
      <p style="margin:0;font-size:12px;color:var(--muted);">${escapeHtml(row.email)}</p>
    </div>
    ${badge(row.status)}
  </div>`).join('')}</div>`;
}

function renderActivities(rows) {
  if (!rows.length) return '<div class="empty" style="padding:20px;background:var(--bg-secondary);border-radius:10px;text-align:center;">No recent activities yet</div>';
  return `<div class="activity-list">${rows.map((row) => `<div class="activity-item">
    <strong style="display:block;margin-bottom:4px;color:var(--ink);">${escapeHtml(row.message)}</strong>
    <p style="margin:0;font-size:12px;color:var(--muted);">${new Date(row.createdAt).toLocaleString()}</p>
  </div>`).join('')}</div>`;
}

async function renderAlumni() {
  setLoading('alumni');
  const params = new URLSearchParams({
    page: state.alumni.page,
    pageSize: state.alumni.pageSize,
    q: state.alumni.q,
    status: state.alumni.status,
    department: state.alumni.department,
  });
  const data = await api(`/api/admin/alumni?${params}`);
  state.alumni.total = data.total;
  const pages = Math.max(Math.ceil(data.total / state.alumni.pageSize), 1);
  views.alumni.innerHTML = `
    <div class="toolbar">
      <div class="toolbar-left">
        <input id="alumniSearch" type="search" placeholder="Search alumni" value="${escapeHtml(state.alumni.q)}">
        <select id="statusFilter"><option value="">All status</option>${['active','pending','inactive','rejected'].map((s) => `<option value="${s}" ${state.alumni.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
      </div>
      <div class="toolbar-right">
        <button class="secondary-button" id="exportAlumniBtn">Export CSV</button>
        <button class="secondary-button" id="bulkActiveBtn">Bulk Activate</button>
        <button class="danger-button" id="bulkDeleteBtn">Bulk Delete</button>
        <button class="button" id="addAlumniBtn">Add Alumni</button>
      </div>
    </div>
    <section class="card table-wrap">
      <table>
        <thead><tr><th><input type="checkbox" id="selectAllAlumni"></th><th>Name</th><th>Email</th><th>Department</th><th>Batch</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${data.rows.length ? data.rows.map(renderAlumniRow).join('') : `<tr><td colspan="8" class="empty">No alumni found.</td></tr>`}</tbody>
      </table>
    </section>
    <div class="toolbar" style="margin-top:14px">
      <span>Page ${state.alumni.page} of ${pages} · ${data.total} records</span>
      <div class="toolbar-right">
        <button class="secondary-button" id="prevAlumni" ${state.alumni.page <= 1 ? 'disabled' : ''}>Previous</button>
        <button class="secondary-button" id="nextAlumni" ${state.alumni.page >= pages ? 'disabled' : ''}>Next</button>
      </div>
    </div>`;
  bindAlumniEvents(data.rows, pages);
}

function renderAlumniRow(row) {
  return `<tr>
    <td><input type="checkbox" class="alumni-check" value="${row._id}" ${state.alumni.selected.has(row._id) ? 'checked' : ''}></td>
    <td><strong>${escapeHtml(row.fullName)}</strong><br><small>${escapeHtml(row.studentId || 'No student ID')}</small></td>
    <td>${escapeHtml(row.email)}</td>
    <td>${escapeHtml(row.department || '-')}</td>
    <td>${escapeHtml(row.batch || row.graduationYear || '-')}</td>
    <td>${escapeHtml(row.location || '-')}</td>
    <td>${badge(row.status)}</td>
    <td><div class="row-actions">
      <button data-action="view" data-id="${row._id}">View</button>
      <button data-action="edit" data-id="${row._id}">Edit</button>
      <button data-action="delete" data-id="${row._id}">Delete</button>
    </div></td>
  </tr>`;
}

function bindAlumniEvents(rows, pages) {
  $('#alumniSearch').addEventListener('input', debounce((event) => { state.alumni.q = event.target.value; state.alumni.page = 1; renderAlumni(); }, 250));
  $('#statusFilter').addEventListener('change', (event) => { state.alumni.status = event.target.value; state.alumni.page = 1; renderAlumni(); });
  $('#addAlumniBtn').addEventListener('click', () => openAlumniForm());
  $('#exportAlumniBtn').addEventListener('click', exportAlumni);
  $('#prevAlumni').addEventListener('click', () => { state.alumni.page = Math.max(1, state.alumni.page - 1); renderAlumni(); });
  $('#nextAlumni').addEventListener('click', () => { state.alumni.page = Math.min(pages, state.alumni.page + 1); renderAlumni(); });
  $('#selectAllAlumni').addEventListener('change', (event) => {
    rows.forEach((row) => event.target.checked ? state.alumni.selected.add(row._id) : state.alumni.selected.delete(row._id));
    renderAlumni();
  });
  document.querySelectorAll('.alumni-check').forEach((input) => input.addEventListener('change', (event) => {
    event.target.checked ? state.alumni.selected.add(event.target.value) : state.alumni.selected.delete(event.target.value);
  }));
  document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => handleAlumniAction(button.dataset.action, button.dataset.id)));
  $('#bulkActiveBtn').addEventListener('click', () => bulkAlumni('active'));
  $('#bulkDeleteBtn').addEventListener('click', () => bulkAlumni('delete'));
}

async function handleAlumniAction(action, id) {
  if (action === 'view') return openAlumniDetails(id);
  if (action === 'edit') return openAlumniForm(await api(`/api/admin/alumni/${id}`));
  if (action === 'delete') {
    return confirm_dialog('Are you sure you want to delete this alumni record? This action cannot be undone.', async (confirmed) => {
      if (confirmed) {
        try {
          await api(`/api/admin/alumni/${id}`, { method: 'DELETE' });
          toast('Alumni deleted successfully.', 'success');
          renderAlumni();
          renderDashboard();
        } catch (error) {
          toast(error.message, 'error');
        }
      }
    });
  }
}

async function bulkAlumni(action) {
  const ids = [...state.alumni.selected];
  if (!ids.length) return toast('Select at least one alumni record.', 'error');
  if (action === 'delete') {
    return confirm_dialog(`Are you sure you want to delete ${ids.length} selected alumni records? This action cannot be undone.`, async (confirmed) => {
      if (confirmed) {
        try {
          await api('/api/admin/alumni/bulk', { method: 'POST', body: JSON.stringify({ ids, action }) });
          state.alumni.selected.clear();
          toast('Bulk delete completed successfully.', 'success');
          renderAlumni();
          renderDashboard();
        } catch (error) {
          toast(error.message, 'error');
        }
      }
    });
  } else {
    try {
      await api('/api/admin/alumni/bulk', { method: 'POST', body: JSON.stringify({ ids, action }) });
      state.alumni.selected.clear();
      toast(`Bulk ${action} completed successfully.`, 'success');
      renderAlumni();
      renderDashboard();
    } catch (error) {
      toast(error.message, 'error');
    }
  }
}

async function exportAlumni() {
  const response = await fetch('/api/admin/alumni/export', { headers: { Authorization: `Bearer ${token}` } });
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'alumni-export.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function alumniFormHtml(row = {}) {
  return `<form id="alumniForm" class="form-grid">
    <div class="field full"><h3 style="margin-top:0;">Personal Information</h3></div>
    ${field('firstName', 'First Name', row.firstName)}
    ${field('lastName', 'Last Name', row.lastName)}
    ${field('email', 'Email Address', row.email, 'email')}
    ${field('phone', 'Phone Number', row.phone)}
    
    <div class="field full" style="grid-column:1/-1;margin-top:8px;"><h3 style="margin-top:0;">Academic Information</h3></div>
    ${field('studentId', 'Student ID', row.studentId)}
    ${field('department', 'Department', row.department)}
    ${field('program', 'Program', row.program)}
    ${field('graduationYear', 'Graduation Year', row.graduationYear)}
    ${field('batch', 'Batch', row.batch)}
    
    <div class="field full" style="grid-column:1/-1;margin-top:8px;"><h3 style="margin-top:0;">Professional Information</h3></div>
    ${field('currentJob', 'Current Job Title', row.currentJob)}
    ${field('company', 'Company', row.company)}
    ${field('location', 'Current Location', row.location)}
    ${field('linkedin', 'LinkedIn/Profile URL', row.linkedin)}
    
    <div class="field full" style="grid-column:1/-1;margin-top:8px;"><h3 style="margin-top:0;">Account Status</h3></div>
    ${select('status', 'Account Status', row.status || 'pending', ['pending','active','inactive','rejected'])}
    
    ${textarea('bio', 'Profile Summary', row.bio)}
    
    <div class="modal-actions field full">
      <button type="button" class="secondary-button" id="cancelModal">Cancel</button>
      <button class="button" type="submit">${row._id ? 'Save Changes' : 'Create Alumni'}</button>
    </div>
  </form>`;
}

function openAlumniForm(row = {}) {
  openModal(row._id ? 'Edit Alumni' : 'Add Alumni', alumniFormHtml(row));
  $('#cancelModal').addEventListener('click', closeModal);
  $('#alumniForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      const method = row._id ? 'PUT' : 'POST';
      const url = row._id ? `/api/admin/alumni/${row._id}` : '/api/admin/alumni';
      await api(url, { method, body: JSON.stringify(serializeForm(form)) });
      closeModal();
      toast('Alumni saved.', 'success');
      renderAlumni();
      renderDashboard();
    } catch (error) {
      showErrors(form, error.payload?.errors);
      toast(error.message, 'error');
    }
  });
}

async function openAlumniDetails(id) {
  const row = await api(`/api/admin/alumni/${id}`);
  openModal('Alumni Profile', `<div class="grid two-grid">
    <section class="card-pad">
      <h3 style="margin-bottom:8px;font-size:18px;">${escapeHtml(row.fullName)}</h3>
      <p style="margin:8px 0;color:var(--muted);">${escapeHtml(row.currentJob || 'Career information not added')} ${row.company ? `<br><strong>${escapeHtml(row.company)}</strong>` : ''}</p>
      <div style="margin:12px 0;">${badge(row.status)}</div>
    </section>
    <section class="card-pad">
      <div style="line-height:1.8;">
        <p style="margin:0 0 8px;"><strong>Email:</strong><br>${escapeHtml(row.email)}</p>
        <p style="margin:0 0 8px;"><strong>Phone:</strong><br>${escapeHtml(row.phone || '-')}</p>
        <p style="margin:0 0 8px;"><strong>Department:</strong><br>${escapeHtml(row.department || '-')}</p>
        <p style="margin:0;"><strong>Batch:</strong><br>${escapeHtml(row.batch || '-')}</p>
      </div>
    </section>
    <section class="card-pad">
      <div style="line-height:1.8;">
        <p style="margin:0 0 8px;"><strong>Graduation:</strong><br>${escapeHtml(row.graduationYear || '-')}</p>
        <p style="margin:0 0 8px;"><strong>Location:</strong><br>${escapeHtml(row.location || '-')}</p>
        <p style="margin:0;"><strong>Registered:</strong><br>${new Date(row.createdAt).toLocaleDateString()}</p>
      </div>
    </section>
    <section class="card-pad">
      <strong style="display:block;margin-bottom:8px;">Profile Bio</strong>
      <p style="margin:0;color:var(--ink);">${escapeHtml(row.bio || 'No profile summary available.')}</p>
    </section>
    <div class="modal-actions field full" style="grid-column:1/-1;margin-top:20px;padding-top:20px;border-top:1px solid var(--line);">
      <button class="secondary-button" id="editFromDetails">Edit Profile</button>
      <button class="button" id="messageFromDetails">Contact</button>
      <button class="danger-button" id="deleteFromDetails">Delete</button>
    </div>
  </div>`);
  $('#editFromDetails').addEventListener('click', () => openAlumniForm(row));
  $('#messageFromDetails').addEventListener('click', () => toast('Contact feature will be available in future updates.', 'info'));
  $('#deleteFromDetails').addEventListener('click', () => handleAlumniAction('delete', row._id));
}

async function renderCollection(name) {
  const title = name === 'events' ? 'Events' : 'News';
  setLoading(name);
  const rows = await api(`/api/admin/${name}`);
  state.cache[name] = rows;
  views[name].innerHTML = `
    <div class="toolbar"><h2>${title} Management</h2><button class="button" id="addCollectionBtn">Add ${title.slice(0, -1)}</button></div>
    <section class="card table-wrap"><table><thead><tr><th>Title</th><th>${name === 'events' ? 'Date / Venue' : 'Category / Author'}</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
    <tbody>${rows.length ? rows.map((row) => renderCollectionRow(name, row)).join('') : `<tr><td colspan="5" class="empty">No ${title.toLowerCase()} found.</td></tr>`}</tbody></table></section>`;
  $('#addCollectionBtn').addEventListener('click', () => openCollectionForm(name));
  views[name].querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => collectionAction(name, button.dataset.action, button.dataset.id)));
}

function renderCollectionRow(name, row) {
  const meta = name === 'events' ? `${escapeHtml(row.date || '-')} · ${escapeHtml(row.venue || '-')}` : `${escapeHtml(row.category || '-')} · ${escapeHtml(row.author || '-')}`;
  return `<tr><td><strong>${escapeHtml(row.title)}</strong><br><small>${escapeHtml((row.description || row.content || '').slice(0, 80))}</small></td><td>${meta}</td><td>${badge(row.status)}</td><td>${new Date(row.updatedAt || row.createdAt).toLocaleDateString()}</td>
    <td><div class="row-actions"><button data-action="edit" data-id="${row.id}">Edit</button><button data-action="delete" data-id="${row.id}">Delete</button></div></td></tr>`;
}

function collectionFormHtml(name, row = {}) {
  if (name === 'events') {
    return `<form id="collectionForm" class="form-grid">
      ${field('title', 'Event Title', row.title)}
      ${field('date', 'Date', row.date, 'date')}
      ${field('time', 'Time', row.time, 'time')}
      ${field('venue', 'Venue', row.venue)}
      ${field('capacity', 'Capacity', row.capacity || '', 'number')}
      ${select('status', 'Status', row.status || 'draft', ['draft','published','unpublished','completed'])}
      ${field('image', 'Image URL', row.image, 'url', true)}
      ${textarea('description', 'Description', row.description)}
      <div class="modal-actions field full"><button type="button" class="secondary-button" id="cancelModal">Cancel</button><button class="button">Save Event</button></div>
    </form>`;
  }
  return `<form id="collectionForm" class="form-grid">
    ${field('title', 'News Title', row.title)}
    ${field('category', 'Category', row.category)}
    ${field('author', 'Author', row.author)}
    ${field('publishDate', 'Publish Date', row.publishDate, 'date')}
    ${select('status', 'Status', row.status || 'draft', ['draft','published','unpublished','scheduled'])}
    ${field('image', 'Featured Image URL', row.image, 'url', true)}
    ${textarea('content', 'Content', row.content)}
    <div class="modal-actions field full"><button type="button" class="secondary-button" id="cancelModal">Cancel</button><button class="button">Save News</button></div>
  </form>`;
}

function openCollectionForm(name, row = {}) {
  openModal(row.id ? `Edit ${name}` : `Add ${name}`, collectionFormHtml(name, row));
  $('#cancelModal').addEventListener('click', closeModal);
  $('#collectionForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await api(row.id ? `/api/admin/${name}/${row.id}` : `/api/admin/${name}`, {
        method: row.id ? 'PUT' : 'POST',
        body: JSON.stringify(serializeForm(event.currentTarget)),
      });
      closeModal();
      toast('Saved successfully.', 'success');
      renderCollection(name);
      renderDashboard();
    } catch (error) {
      toast(error.message, 'error');
    }
  });
}

async function collectionAction(name, action, id) {
  const row = state.cache[name].find((item) => item.id === id);
  if (action === 'edit') return openCollectionForm(name, row);
  if (action === 'delete') {
    return confirm_dialog(`Are you sure you want to delete "${row.title}"? This action cannot be undone.`, async (confirmed) => {
      if (confirmed) {
        try {
          await api(`/api/admin/${name}/${id}`, { method: 'DELETE' });
          toast('Deleted successfully.', 'success');
          renderCollection(name);
          renderDashboard();
        } catch (error) {
          toast(error.message, 'error');
        }
      }
    });
  }
}

async function renderReports() {
  setLoading('reports');
  const data = state.cache.dashboard || await api('/api/admin/dashboard');
  views.reports.innerHTML = `<div class="grid two-grid">
    <section class="card card-pad chart"><h2>Alumni by Graduation Year</h2>${renderBars(data.charts.alumniByYear)}</section>
    <section class="card card-pad chart"><h2>Alumni by Location</h2>${renderBars(data.charts.alumniByLocation)}</section>
    <section class="card card-pad chart"><h2>Alumni by Department</h2>${renderBars(data.charts.alumniByDepartment)}</section>
    <section class="card card-pad chart"><h2>Event Participation</h2>${renderBars(data.charts.eventParticipation)}</section>
  </div>`;
}

async function renderNotifications() {
  setLoading('notifications');
  const rows = await api('/api/admin/notifications');
  state.cache.notifications = rows;
  updateBadge(rows);
  views.notifications.innerHTML = `<div class="toolbar"><h2>Notifications</h2><button class="secondary-button" id="markAllRead">Mark all read</button></div>
    <div class="notification-list">${rows.length ? rows.map((row) => `<div class="notification-item"><strong>${escapeHtml(row.title)}</strong><p>${escapeHtml(row.message)}</p><small>${new Date(row.createdAt).toLocaleString()} ${row.read ? '· Read' : '· Unread'}</small></div>`).join('') : '<div class="card empty">No notifications.</div>'}</div>`;
  $('#markAllRead').addEventListener('click', async () => {
    await api('/api/admin/notifications/read', { method: 'POST', body: JSON.stringify({}) });
    toast('Notifications marked read.', 'success');
    renderNotifications();
  });
}

async function renderSettings() {
  setLoading('settings');
  const settings = await api('/api/admin/settings');
  state.cache.settings = settings;
  views.settings.innerHTML = `<form id="settingsForm" class="card card-pad form-grid">
    <div class="field full" style="margin-bottom:20px;"><h2 style="margin-top:0;margin-bottom:4px;">General Settings</h2><p style="margin:0;color:var(--muted);font-size:13px;">Configure your alumni association details</p></div>
    ${field('associationName', 'Association Name', settings.associationName, 'text', false)}
    ${field('contactEmail', 'Contact Email', settings.contactEmail, 'email', false)}
    ${field('phone', 'Phone Number', settings.phone)}
    ${field('address', 'Physical Address', settings.address, 'text', true)}
    ${field('website', 'Website URL', settings.website, 'url', true)}
    
    <div class="field full" style="margin-top:24px;margin-bottom:20px;padding-top:20px;border-top:1px solid var(--line);"><h2 style="margin-top:0;margin-bottom:4px;">Admin Profile</h2><p style="margin:0;color:var(--muted);font-size:13px;">Your account information</p></div>
    ${field('adminName', 'Admin Name', settings.adminName, 'text', false)}
    ${field('adminEmail', 'Admin Email', settings.adminEmail, 'email', false)}
    
    <div class="field full" style="margin-top:24px;padding-top:20px;border-top:1px solid var(--line);"><h2 style="margin-top:0;margin-bottom:8px;">System Information</h2><div style="padding:16px;background:var(--bg-secondary);border-radius:10px;border-left:3px solid var(--brand);"><p style="margin:0;"><strong>Version:</strong> ${escapeHtml(settings.version || '1.0.0')}</p><p style="margin:4px 0 0;"><strong>Storage:</strong> JSON-based local storage</p></div></div>
    
    <div class="modal-actions field full" style="margin-top:24px;padding-top:20px;border-top:1px solid var(--line);">
      <button class="button">Save Settings</button>
    </div>
  </form>`;
  $('#settingsForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify(serializeForm(event.currentTarget)) });
      toast('Settings saved successfully.', 'success');
    } catch (error) {
      toast(error.message, 'error');
    }
  });
}

function updateBadge(rows = state.cache.notifications) {
  $('#notificationBadge').textContent = rows.filter((row) => !row.read).length;
}

function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

async function handleGlobalSearch(event) {
  const q = event.target.value.trim();
  const box = $('#searchResults');
  if (!q) {
    box.hidden = true;
    box.innerHTML = '';
    return;
  }
  const rows = await api(`/api/admin/search?q=${encodeURIComponent(q)}`);
  box.hidden = false;
  box.innerHTML = rows.length ? rows.map((row) => `<button class="search-result" data-target="${row.target}"><strong>${escapeHtml(row.title)}</strong><br><small>${escapeHtml(row.type)} · ${escapeHtml(row.subtitle)}</small></button>`).join('') : '<div class="empty">No results found.</div>';
  box.querySelectorAll('[data-target]').forEach((button) => button.addEventListener('click', () => {
    const [view] = button.dataset.target.split(':');
    switchView(view === 'alumni' ? 'alumni' : view === 'events' ? 'events' : 'news');
    box.hidden = true;
  }));
}

function confirm_dialog(message, callback) {
  openModal('Confirm Action', `<div class="card-pad">
    <p style="margin:0 0 20px;color:var(--ink);">${escapeHtml(message)}</p>
    <div class="modal-actions" style="border:0;padding:0;margin:0;gap:10px;">
      <button class="secondary-button" id="confirmCancel" style="flex:1;">Cancel</button>
      <button class="danger-button" id="confirmOk" style="flex:1;">Confirm</button>
    </div>
  </div>`);
  document.getElementById('confirmOk').addEventListener('click', () => {
    closeModal();
    callback(true);
  });
  document.getElementById('confirmCancel').addEventListener('click', () => {
    closeModal();
    callback(false);
  });
}

async function switchView(view) {
  state.view = view;
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === view));
  Object.entries(views).forEach(([key, node]) => node.classList.toggle('active', key === view));
  $('#pageTitle').textContent = view[0].toUpperCase() + view.slice(1);
  $('#sidebar').classList.remove('open');
  $('#drawerBackdrop').classList.remove('show');
  try {
    if (view === 'dashboard') await renderDashboard();
    if (view === 'alumni') await renderAlumni();
    if (view === 'events') await renderCollection('events');
    if (view === 'news') await renderCollection('news');
    if (view === 'reports') await renderReports();
    if (view === 'notifications') await renderNotifications();
    if (view === 'settings') await renderSettings();
  } catch (error) {
    views[view].innerHTML = `<div class="card empty">${escapeHtml(error.message || 'Unable to load this section.')}</div>`;
    toast(error.message || 'Unable to load section.', 'error');
  }
}

document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => switchView(item.dataset.view)));
$('#modalClose').addEventListener('click', closeModal);
$('#modalBackdrop').addEventListener('click', (event) => { if (event.target.id === 'modalBackdrop') closeModal(); });
$('#logoutBtn').addEventListener('click', () => { localStorage.removeItem('baustAdminToken'); window.location.href = '/site/index3.html'; });
$('#menuBtn').addEventListener('click', () => { $('#sidebar').classList.add('open'); $('#drawerBackdrop').classList.add('show'); });
$('#drawerBackdrop').addEventListener('click', () => { $('#sidebar').classList.remove('open'); $('#drawerBackdrop').classList.remove('show'); });
$('#globalSearch').addEventListener('input', debounce(handleGlobalSearch, 250));
$('#notificationBtn').addEventListener('click', () => switchView('notifications'));

switchView('dashboard');
api('/api/admin/notifications').then((rows) => { state.cache.notifications = rows; updateBadge(rows); }).catch(() => {});
