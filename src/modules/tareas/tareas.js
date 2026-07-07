// ============ TASKS ============
let tasksViewMode = 'kanban';
let tasksFilter = { projectId: '', status: '' };

function renderTasks() {
  return `
    ${viewHeader('Tareas', `${state.tasks.length} en total`,
      `<div class="flex gap-1 bg-gray-100 rounded-lg p-1">
         <button class="px-3 py-1 rounded-md text-sm ${tasksViewMode==='list'?'bg-white shadow-sm':''}" onclick="tasksViewMode='list'; render()">Lista</button>
         <button class="px-3 py-1 rounded-md text-sm ${tasksViewMode==='kanban'?'bg-white shadow-sm':''}" onclick="tasksViewMode='kanban'; render()">Tablero</button>
         <button class="px-3 py-1 rounded-md text-sm ${tasksViewMode==='gantt'?'bg-white shadow-sm':''}" onclick="tasksViewMode='gantt'; render()">Gantt</button>
       </div>
       <button class="btn-primary" onclick="openTaskModal()">+ Nueva</button>`
    )}

    <div class="px-4 md:px-10 pb-4 flex gap-2">
      <select class="input max-w-xs" onchange="tasksFilter.projectId=this.value; render()">
        <option value="">Todos los proyectos</option>
        ${state.projects.map(p => `<option value="${p.id}" ${tasksFilter.projectId===p.id?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}
      </select>
    </div>

    <div class="px-4 md:px-10 pb-10">
      ${tasksViewMode === 'kanban' ? renderKanban() : tasksViewMode === 'gantt' ? renderGantt() : renderTaskList()}
    </div>
  `;
}

function filteredTasks() {
  return state.tasks.filter(t =>
    (!tasksFilter.projectId || t.projectId === tasksFilter.projectId) &&
    (!tasksFilter.status    || t.status    === tasksFilter.status)
  );
}

function renderKanban() {
  const tasks = filteredTasks();
  return `
    <div class="flex gap-4 overflow-x-auto scroll-hide pb-4">
      ${STATUS_ORDER.map(s => {
        const colTasks = tasks.filter(t => t.status === s);
        return `
          <div class="kanban-col flex-1">
            <div class="flex items-center justify-between mb-3 px-1">
              <div class="flex items-center gap-2">
                <span class="chip ${STATUS[s].color}">${STATUS[s].label}</span>
                <span class="text-xs text-gray-500">${colTasks.length}</span>
              </div>
            </div>
            <div>
              ${colTasks.map(t => kanbanCard(t)).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function kanbanCard(t) {
  const p = getProject(t.projectId);
  const assignee = getMember(t.assigneeId);
  const isOverdue = t.dueDate && t.dueDate < todayISO() && t.status !== 'COMPLETED';
  return `
    <div class="task-card" onclick="openTaskDetail('${t.id}')">
      <div class="flex items-center justify-between mb-2">
        ${p ? `<span class="text-xs font-medium truncate" style="color:${p?.color || '#6b7280'}">● ${escapeHtml(p.name)}</span>` : '<span></span>'}
        <span class="chip ${PRIORITY[t.priority].color}">${PRIORITY[t.priority].label}</span>
      </div>
      <div class="text-sm font-medium">${escapeHtml(t.title)}</div>
      <div class="flex items-center justify-between mt-2">
        ${t.dueDate ? `<span class="text-xs ${isOverdue?'text-red-600 font-medium':'text-gray-500'}">${isOverdue?'⚠ ':''}${fmt(t.dueDate)}</span>` : '<span></span>'}
        ${assignee ? `<span class="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-semibold" style="background:${assignee.color}" title="${escapeAttr(assignee.name)}">${escapeHtml(assignee.name[0])}</span>` : ''}
      </div>
      ${t.status === 'BLOCKED' && t.blockedReason ? `<div class="text-xs text-red-600 mt-2 italic">${escapeHtml(t.blockedReason)}</div>` : ''}
    </div>
  `;
}

function renderTaskList() {
  const tasks = filteredTasks();
  if (tasks.length === 0) return `<div class="card p-10 text-center text-gray-400">No hay tareas. Creá la primera.</div>`;
  return `
    <div class="card">
      ${tasks.map(taskRow).join('<div class="border-t border-gray-100"></div>')}
    </div>
  `;
}

// ============ GANTT ============
function renderGantt() {
  const tasks = filteredTasks().filter(t => t.startDate && t.dueDate);
  if (tasks.length === 0) return `<div class="card p-10 text-center text-gray-400">Necesitás tareas con fecha de inicio y fin para ver el Gantt.</div>`;

  // Compute date range
  const dates = tasks.flatMap(t => [new Date(t.startDate), new Date(t.dueDate)]);
  let minDate = new Date(Math.min(...dates));
  let maxDate = new Date(Math.max(...dates));
  // Pad 2 days each side
  minDate.setDate(minDate.getDate() - 2);
  maxDate.setDate(maxDate.getDate() + 2);
  const totalDays = Math.max(1, Math.round((maxDate - minDate) / 86400000));
  const dayWidth = 32; // px per day
  const chartWidth = totalDays * dayWidth;

  // Group tasks by project
  const byProject = {};
  tasks.forEach(t => {
    if (!byProject[t.projectId]) byProject[t.projectId] = [];
    byProject[t.projectId].push(t);
  });

  // Build day headers (show every 2 days for density)
  let headers = '';
  for (let i = 0; i <= totalDays; i++) {
    const d = new Date(minDate); d.setDate(d.getDate() + i);
    const isMonday = d.getDay() === 1;
    const isFirst = d.getDate() === 1;
    headers += `<div class="inline-block text-center text-[10px] ${isFirst?'font-bold':'text-gray-500'} border-l ${isMonday?'border-gray-300':'border-gray-100'}" style="width:${dayWidth}px;height:28px;line-height:28px">${d.getDate()}${isFirst?'/'+(d.getMonth()+1):''}</div>`;
  }

  // Today marker
  const today = new Date(); today.setHours(0,0,0,0);
  const todayOffset = Math.round((today - minDate) / 86400000) * dayWidth;
  const showToday = today >= minDate && today <= maxDate;

  // Rows
  let rows = '';
  Object.entries(byProject).forEach(([pid, ptasks]) => {
    const proj = getProject(pid);
    rows += `
      <div class="flex items-center border-b border-gray-100" style="height:36px">
        <div class="w-56 flex-shrink-0 px-3 text-xs font-semibold truncate flex items-center gap-2 bg-gray-50">
          <span class="w-2 h-2 rounded-full flex-shrink-0" style="background:${proj?.color || '#9ca3af'}"></span>
          ${escapeHtml(proj?.name || '—')}
        </div>
        <div class="relative" style="width:${chartWidth}px;height:100%"></div>
      </div>
    `;
    ptasks.forEach(t => {
      const start = new Date(t.startDate);
      const end = new Date(t.dueDate);
      const offsetDays = Math.round((start - minDate) / 86400000);
      const durDays = Math.max(1, Math.round((end - start) / 86400000) + 1);
      const left = offsetDays * dayWidth;
      const width = durDays * dayWidth - 4;
      const overdue = end < today && t.status !== 'COMPLETED';
      const bg = t.status === 'COMPLETED' ? '#86efac' : t.status === 'BLOCKED' ? '#fca5a5' : t.status === 'IN_PROGRESS' ? '#93c5fd' : t.status === 'IN_REVIEW' ? '#fcd34d' : '#d1d5db';
      rows += `
        <div class="flex items-center border-b border-gray-100 hover:bg-gray-50" style="height:32px">
          <div class="w-56 flex-shrink-0 px-3 pl-8 text-xs truncate cursor-pointer" onclick="openTaskDetail('${t.id}')" title="${escapeAttr(t.title)}">${escapeHtml(t.title)}</div>
          <div class="relative" style="width:${chartWidth}px;height:100%">
            <div class="absolute rounded-md shadow-sm cursor-pointer flex items-center px-2 text-[11px] font-medium text-gray-800 overflow-hidden ${overdue ? 'ring-2 ring-red-400' : ''}"
                 style="left:${left}px;top:6px;height:20px;width:${width}px;background:${bg}"
                 onclick="openTaskDetail('${t.id}')" title="${escapeAttr(t.title)} · ${fmt(t.startDate)} → ${fmt(t.dueDate)}">
              ${escapeHtml(t.title)}
            </div>
          </div>
        </div>
      `;
    });
  });

  return `
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <div style="min-width:${chartWidth + 224}px">
          <div class="flex border-b border-gray-200 bg-gray-50 sticky top-0">
            <div class="w-56 flex-shrink-0 px-3 text-xs font-semibold flex items-center" style="height:28px">Tarea</div>
            <div class="relative" style="width:${chartWidth}px">
              ${headers}
              ${showToday ? `<div class="absolute top-0 bottom-0 border-l-2 border-red-500 pointer-events-none" style="left:${todayOffset}px;height:28px"></div>` : ''}
            </div>
          </div>
          <div class="relative">
            ${rows}
            ${showToday ? `<div class="absolute top-0 bottom-0 border-l-2 border-red-400 opacity-50 pointer-events-none" style="left:${224+todayOffset}px;width:2px"></div>` : ''}
          </div>
        </div>
      </div>
      <div class="px-4 py-2 text-xs text-gray-500 flex gap-4 flex-wrap border-t border-gray-100">
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded" style="background:#d1d5db"></span>Pendiente</span>
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded" style="background:#93c5fd"></span>En progreso</span>
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded" style="background:#fcd34d"></span>En revisión</span>
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded" style="background:#86efac"></span>Completada</span>
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded" style="background:#fca5a5"></span>Bloqueada</span>
        <span class="flex items-center gap-1"><span class="border-l-2 border-red-500 h-3"></span>Hoy</span>
      </div>
    </div>
  `;
}

