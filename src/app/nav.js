// ============ NAV ============
const NAV = [
  { key: 'tasks',     label: 'Tareas',      icon: '☰' },
  { key: 'projects',  label: 'Proyectos',   icon: '◫' },
  { key: 'clients',   label: 'Clientes',    icon: '⊙' },
  { key: 'budgets',   label: 'Presupuestos',icon: '$' },
  { key: 'finance',   label: 'Finanzas',    icon: '◷' },
  { key: 'reports',   label: 'Reportes',    icon: '◈' },
  { key: 'documents', label: 'Documentos', icon: '▤' },
  { key: 'resources', label: 'Recursos',   icon: '◇' },
  { key: 'team',      label: 'Equipo',     icon: '◐' },
  { key: 'guide',     label: 'Manual',     icon: '?' },
];

function renderNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = NAV.map(n => `
    <div class="nav-item ${currentView === n.key ? 'active' : ''}" onclick="go('${n.key}')">
      <span class="w-5 text-center opacity-70">${n.icon}</span>
      <span>${n.label}</span>
    </div>
  `).join('');
  const me = currentMember();
  document.getElementById('userInfo').innerHTML = `
    <button onclick="openMemberPicker()" class="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition">
      <span class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold" style="background:${me?.color || '#666'}">${(me?.name || '?')[0]}</span>
      <span class="text-sm font-medium">${me?.name || 'Sin usuario'}</span>
    </button>
  `;
  // Bell badge
  const c = unreadCount();
  const badge = document.getElementById('bellBadge');
  if (c > 0) { badge.classList.remove('hidden'); badge.textContent = c > 9 ? '9+' : c; }
  else { badge.classList.add('hidden'); }
}

function go(view) {
  currentView = view;
  currentTaskId = null;
  renderNav();
  render();
  closeSidebar();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('show');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
}

// ============ RENDER DISPATCH ============
function render() {
  const main = document.getElementById('main');
  const views = {
    tasks: renderTasks,
    projects: renderProjects,
    clients: renderClients,
    budgets: renderBudgets,
    finance: renderFinance,
    reports: renderReports,
    documents: renderDocuments,
    resources: renderResources,
    team: renderTeam,
    guide: renderGuide,
  };
  main.innerHTML = views[currentView]();
  attachViewEvents();
}

// ============ HEADER TEMPLATE ============
function viewHeader(title, subtitle, actions = '') {
  return `
    <div class="px-4 md:px-10 pt-8 md:pt-10 pb-4 md:pb-6 flex items-end justify-between gap-3 flex-wrap">
      <div class="min-w-0">
        <h1 class="text-2xl md:text-3xl font-semibold tracking-tight">${title}</h1>
        ${subtitle ? `<p class="text-gray-500 mt-1 text-sm">${subtitle}</p>` : ''}
      </div>
      <div class="flex gap-2 flex-wrap items-center">${actions}</div>
    </div>
  `;
}

