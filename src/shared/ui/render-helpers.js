// ============ RENDER HELPERS (UI compartida) ============
// Helpers de render reutilizados por varios módulos (reportes, tareas, etc.).
function statCard(label, value) {
  return `
    <div class="card p-5">
      <div class="text-xs text-gray-500">${label}</div>
      <div class="text-2xl font-semibold mt-1">${value}</div>
    </div>
  `;
}

function taskRow(t) {
  const p = getProject(t.projectId);
  const assignee = getMember(t.assigneeId);
  const isOverdue = t.dueDate && t.dueDate < todayISO() && t.status !== 'COMPLETED';
  return `
    <div class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer" onclick="openTaskDetail('${t.id}')">
      <span class="chip ${STATUS[t.status].color}">${STATUS[t.status].label}</span>
      <div class="flex-1">
        <div class="text-sm font-medium">${escapeHtml(t.title)}</div>
        <div class="text-xs text-gray-500">${p ? escapeHtml(p.name) : 'Sin proyecto'}</div>
      </div>
      ${assignee ? `<span class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold" style="background:${assignee.color}" title="${escapeAttr(assignee.name)}">${escapeHtml(assignee.name[0])}</span>` : '<span class="w-6"></span>'}
      <span class="chip ${PRIORITY[t.priority].color}">${PRIORITY[t.priority].label}</span>
      <span class="text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'} w-20 text-right">${fmt(t.dueDate)}</span>
    </div>
  `;
}
