// ============ HELPERS ============
function getProject(id) { return state.projects.find(p => p.id === id); }
function getTask(id)    { return state.tasks.find(t => t.id === id); }
function getMember(id)  { return state.members.find(m => m.id === id); }
function getClient(id)  { return (state.clients || []).find(c => c.id === id); }
// Etiqueta corta del cliente: nombre + documento (si tiene).
function clientLabel(c) {
  if (!c) return '';
  const dt = c.docType && c.docType !== '99' ? DOC_TYPE_LABELS[c.docType] || '' : '';
  return dt && c.docNumber ? `${c.name} · ${dt} ${c.docNumber}` : c.name;
}
function currentMember(){ return getMember(currentMemberId) || state.members[0]; }

function parseMentions(text) {
  const mentions = [];
  state.members.forEach(m => {
    const re = new RegExp(`@${m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(text)) mentions.push(m.id);
  });
  return mentions;
}

function renderMentions(text) {
  let out = escapeHtml(text);
  state.members.forEach(m => {
    const re = new RegExp(`@${m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    out = out.replace(re, `<span class="bg-blue-50 text-blue-700 rounded px-1">@${escapeHtml(m.name)}</span>`);
  });
  return out;
}

function unreadCount() {
  return state.notifications.filter(n => n.forMemberId === currentMemberId && !n.read).length;
}

function projectProgress(pid) {
  const tasks = state.tasks.filter(t => t.projectId === pid);
  if (tasks.length === 0) return 0;
  return Math.round(tasks.filter(t => t.status === 'COMPLETED').length / tasks.length * 100);
}

function pushHistory(taskId, action, from, to) {
  state.history.push({ id: uid(), taskId, action, from, to, createdAt: new Date().toISOString() });
}

function notify(forMemberId, taskId, text) {
  if (!forMemberId || forMemberId === currentMemberId) return;
  state.notifications.push({
    id: uid(),
    forMemberId,
    fromMemberId: currentMemberId,
    taskId,
    text,
    read: false,
    createdAt: new Date().toISOString(),
  });
  // Send email if configured
  sendNotificationEmail(forMemberId, taskId, text);
}

// ---- Toast helper ----
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="text-lg flex-shrink-0">${type === 'success' ? '✓' : type === 'info' ? '🔔' : '!'}</span>
    <span class="text-sm flex-1">${escapeHtml(message)}</span>
  `;
  toast.onclick = () => toast.remove();
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity .3s, transform .3s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ---- Email (EmailJS) ----
function sendNotificationEmail(forMemberId, taskId, text) {
  const cfg = state.emailConfig;
  if (!cfg || !cfg.enabled || !cfg.serviceId || !cfg.templateId || !cfg.publicKey) return;
  const member = getMember(forMemberId);
  if (!member || !member.email) return;
  const task = getTask(taskId);
  const sender = currentMember();
  if (typeof emailjs === 'undefined') return;
  emailjs.send(cfg.serviceId, cfg.templateId, {
    to_email: member.email,
    to_name: member.name,
    from_name: sender?.name || 'Pragma',
    message: text,
    task_title: task?.title || '',
    task_url: window.location.href,
  }, { publicKey: cfg.publicKey }).catch(err => console.warn('EmailJS error:', err));
}

// ---- Drag and drop for projects ----
let _draggingProjectId = null;

function dragProjectStart(e, projectId) {
  _draggingProjectId = projectId;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', projectId);
  e.currentTarget.classList.add('dragging');
}
function dragProjectEnd(e) {
  e.currentTarget.classList.remove('dragging');
  _draggingProjectId = null;
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
}
function dragColOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}
function dragColLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    e.currentTarget.classList.remove('drag-over');
  }
}
function dropProject(e, status) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const pid = _draggingProjectId || e.dataTransfer.getData('text/plain');
  if (!pid) return;
  const p = getProject(pid);
  if (!p || p.status === status) return;
  p.status = status;
  save();
  render();
  showToast(`"${p.name}" → ${PROJECT_STATUS[status].label}`, 'success');
}

