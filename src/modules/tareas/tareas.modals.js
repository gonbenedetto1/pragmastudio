function openTaskModal(id) {
  const t = id ? getTask(id) : { id: null, title: '', description: '', status: 'PENDING', priority: 'MEDIUM', projectId: state.projects[0]?.id || '', assigneeId: currentMemberId, startDate: todayISO(), dueDate: '', estimatedHrs: '', actualHrs: '' };
  const isNew = !id;
  const isDone = t.status === 'COMPLETED';
  openModal(`
    <div class="p-6">
      <h2 class="text-xl font-semibold mb-4">${id ? 'Editar tarea' : 'Nueva tarea'}</h2>
      <form id="taskForm" class="space-y-3" onsubmit="saveTask(event)">
        <input type="hidden" name="id" value="${t.id || ''}" />
        <div>
          <label class="text-xs text-gray-500">Título</label>
          <input name="title" class="input" required autofocus value="${escapeAttr(t.title)}" />
        </div>
        <div>
          <label class="text-xs text-gray-500">Descripción</label>
          <textarea name="description" class="input" rows="2">${escapeHtml(t.description || '')}</textarea>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-gray-500">Proyecto</label>
            <select name="projectId" required>
              ${state.projects.length === 0 ? '<option value="">(Creá un proyecto primero)</option>' :
                state.projects.map(p => `<option value="${p.id}" ${t.projectId===p.id?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-500">Prioridad</label>
            <select name="priority">
              ${Object.entries(PRIORITY).map(([k,v]) => `<option value="${k}" ${t.priority===k?'selected':''}>${v.label}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-500">Estado</label>
            <select name="status">
              ${STATUS_ORDER.map(k => `<option value="${k}" ${t.status===k?'selected':''}>${STATUS[k].label}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-500">Asignado a</label>
            <select name="assigneeId">
              <option value="">Sin asignar</option>
              ${state.members.map(m => `<option value="${m.id}" ${t.assigneeId===m.id?'selected':''}>${escapeHtml(m.name)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-500">Fecha límite</label>
            <input type="date" name="dueDate" class="input" value="${t.dueDate || ''}" />
          </div>
          <div>
            <label class="text-xs text-gray-500">Fecha inicio</label>
            <input type="date" name="startDate" class="input" value="${t.startDate || ''}" />
          </div>
          <div>
            <label class="text-xs text-gray-500">Horas estimadas</label>
            <input type="number" step="0.25" name="estimatedHrs" class="input" value="${t.estimatedHrs || ''}" placeholder="0" />
          </div>
          ${!isNew ? `
          <div>
            <label class="text-xs text-gray-500">Horas reales ${isDone ? '' : '<span class="text-gray-400">(al finalizar)</span>'}</label>
            <input type="number" step="0.25" name="actualHrs" class="input" value="${t.actualHrs || ''}" placeholder="0" />
          </div>` : ''}
        </div>
        <div id="blockedReasonBox" class="${t.status === 'BLOCKED' ? '' : 'hidden'}">
          <label class="text-xs text-red-600">Motivo del bloqueo <b>(obligatorio)</b></label>
          <textarea name="blockedReason" class="input" rows="2">${escapeHtml(t.blockedReason || '')}</textarea>
        </div>
        <div class="flex justify-between pt-3">
          <div>${id ? `<button type="button" class="btn-ghost text-red-600 text-sm" onclick="deleteTask('${id}')">Eliminar</button>` : ''}</div>
          <div class="flex gap-2">
            <button type="button" class="btn-ghost" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar</button>
          </div>
        </div>
      </form>
    </div>
  `);

  const statusSel = document.querySelector('#taskForm select[name="status"]');
  statusSel.addEventListener('change', (e) => {
    document.getElementById('blockedReasonBox').classList.toggle('hidden', e.target.value !== 'BLOCKED');
  });
}

function saveTask(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd.entries());

  if (data.status === 'BLOCKED' && !data.blockedReason?.trim()) {
    alert('Tenés que escribir un motivo para marcarla como bloqueada.');
    return;
  }
  if (!data.projectId) {
    alert('Creá un proyecto primero.');
    return;
  }

  data.estimatedHrs = data.estimatedHrs ? Number(data.estimatedHrs) : null;
  data.actualHrs    = data.actualHrs    ? Number(data.actualHrs)    : null;

  // Si se completa y no cargó horas reales, pedirlas
  if (data.status === 'COMPLETED' && !data.actualHrs) {
    const hrs = prompt('¿Cuántas horas te llevó realmente?' + (data.estimatedHrs ? ` (estimaste ${data.estimatedHrs}h)` : ''), data.estimatedHrs || '');
    if (hrs === null) return;
    const n = Number(hrs);
    if (!isNaN(n) && n > 0) data.actualHrs = n;
  }

  if (data.id) {
    const t = getTask(data.id);
    const oldStatus = t.status;
    const oldAssignee = t.assigneeId;
    Object.assign(t, data);
    if (data.status !== oldStatus) {
      pushHistory(t.id, 'status', oldStatus, data.status);
      if (data.status === 'COMPLETED') t.completedAt = new Date().toISOString();
    }
    if (data.assigneeId && data.assigneeId !== oldAssignee && data.assigneeId !== currentMemberId) {
      notify(data.assigneeId, t.id, `Te asignaron: ${t.title}`);
      const m = getMember(data.assigneeId);
      showToast(`Asignada a ${m?.name || 'miembro'} · ${state.emailConfig?.enabled ? '✉ Email enviado' : ''}`, 'success');
    }
    t.updatedAt = new Date().toISOString();
  } else {
    const t = {
      ...data,
      id: uid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: data.status === 'COMPLETED' ? new Date().toISOString() : null,
    };
    state.tasks.push(t);
    pushHistory(t.id, 'created', null, null);
    if (data.assigneeId && data.assigneeId !== currentMemberId) {
      notify(data.assigneeId, t.id, `Te asignaron: ${t.title}`);
      const m = getMember(data.assigneeId);
      showToast(`Asignada a ${m?.name || 'miembro'} · ${state.emailConfig?.enabled ? '✉ Email enviado' : ''}`, 'success');
    }
  }
  save();
  closeModal();
  render();
}

function deleteTask(id) {
  if (!confirm('¿Eliminar esta tarea?')) return;
  state.tasks = state.tasks.filter(t => t.id !== id);
  state.comments = state.comments.filter(c => c.taskId !== id);
  state.history  = state.history.filter(h => h.taskId !== id);
  save(); closeModal(); render();
}

// ---- Task detail ----
function openTaskDetail(id) {
  const t = getTask(id);
  const p = getProject(t.projectId);
  const comments = state.comments.filter(c => c.taskId === id).sort((a,b) => a.createdAt.localeCompare(b.createdAt));
  const history  = state.history.filter(h => h.taskId === id).sort((a,b) => a.createdAt.localeCompare(b.createdAt));
  const feed = [...comments.map(c => ({type:'comment', ...c})), ...history.map(h => ({type:'history', ...h}))].sort((a,b) => a.createdAt.localeCompare(b.createdAt));

  openModal(`
    <div class="p-6">
      <div class="flex items-start justify-between mb-2">
        <div class="flex-1 pr-4">
          <div class="flex items-center gap-2 mb-1">
            ${p ? `<span class="text-xs font-medium" style="color:${p?.color || '#6b7280'}">● ${escapeHtml(p.name)}</span>` : ''}
            <span class="chip ${PRIORITY[t.priority].color}">${PRIORITY[t.priority].label}</span>
          </div>
          <h2 class="text-xl font-semibold">${escapeHtml(t.title)}</h2>
        </div>
        <button class="btn-ghost text-sm" onclick="openTaskModal('${t.id}')">Editar</button>
      </div>

      ${t.description ? `<p class="text-sm text-gray-700 my-3">${escapeHtml(t.description)}</p>` : ''}

      <div class="flex flex-wrap gap-2 my-4">
        <span class="chip ${STATUS[t.status].color}">${STATUS[t.status].label}</span>
        ${t.dueDate ? `<span class="chip bg-gray-100 text-gray-700">Vence ${fmt(t.dueDate)}</span>` : ''}
        ${t.estimatedHrs ? `<span class="chip bg-gray-100 text-gray-700">Est: ${t.estimatedHrs}h</span>` : ''}
        ${t.actualHrs ? `<span class="chip bg-gray-100 text-gray-700">Real: ${t.actualHrs}h</span>` : ''}
      </div>

      <div class="grid grid-cols-5 gap-1 mb-4">
        ${STATUS_ORDER.map(s => `
          <button class="chip ${t.status===s?STATUS[s].color:'bg-gray-100 text-gray-500'} py-2" onclick="quickStatus('${t.id}','${s}')">${STATUS[s].label}</button>
        `).join('')}
      </div>

      ${t.status === 'BLOCKED' && t.blockedReason ? `
        <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div class="text-xs font-semibold text-red-700 mb-1">Motivo del bloqueo</div>
          <div class="text-sm text-red-900">${escapeHtml(t.blockedReason)}</div>
        </div>
      ` : ''}

      <h3 class="text-xs uppercase tracking-wider text-gray-500 mb-2">Actividad</h3>
      <div class="space-y-2 max-h-60 overflow-y-auto mb-3">
        ${feed.length === 0 ? '<div class="text-sm text-gray-400">Sin actividad aún.</div>' : feed.map(e => {
          if (e.type === 'comment') {
            const author = getMember(e.authorId);
            return `<div class="bg-gray-50 rounded-lg p-3 text-sm">
              <div class="flex items-center gap-2 mb-1">
                ${author ? `<span class="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-semibold" style="background:${author.color}">${escapeHtml(author.name[0])}</span><span class="text-xs font-medium">${escapeHtml(author.name)}</span>` : ''}
                <span class="text-xs text-gray-500">${new Date(e.createdAt).toLocaleString('es-AR')}</span>
              </div>
              <div class="text-gray-900">${renderMentions(e.content)}</div>
            </div>`;
          } else {
            const msg = e.action === 'created' ? 'Tarea creada' : `Estado: ${STATUS[e.from]?.label || e.from} → ${STATUS[e.to]?.label || e.to}`;
            return `<div class="text-xs text-gray-500 px-3">${msg} · ${new Date(e.createdAt).toLocaleString('es-AR')}</div>`;
          }
        }).join('')}
      </div>

      <form onsubmit="addComment(event, '${t.id}')" class="flex gap-2">
        <input name="content" class="input" placeholder="Comentario... (@nombre para notificar)" required />
        <button class="btn-primary">Enviar</button>
      </form>
      <p class="text-[11px] text-gray-400 mt-1">Miembros: ${state.members.map(m => '@' + m.name).join(', ')}</p>
    </div>
  `);
}

function quickStatus(taskId, status) {
  const t = getTask(taskId);
  if (status === 'BLOCKED' && !t.blockedReason) {
    const reason = prompt('Motivo del bloqueo (obligatorio):');
    if (!reason?.trim()) return;
    t.blockedReason = reason.trim();
  }
  if (status === 'COMPLETED' && !t.actualHrs) {
    const hrs = prompt('¿Cuántas horas te llevó realmente?' + (t.estimatedHrs ? ` (estimaste ${t.estimatedHrs}h)` : ''), t.estimatedHrs || '');
    if (hrs === null) return;
    const n = Number(hrs);
    if (!isNaN(n) && n > 0) t.actualHrs = n;
  }
  const oldStatus = t.status;
  t.status = status;
  t.updatedAt = new Date().toISOString();
  if (status === 'COMPLETED') t.completedAt = new Date().toISOString();
  pushHistory(taskId, 'status', oldStatus, status);
  save();
  openTaskDetail(taskId);
}

function addComment(e, taskId) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const content = fd.get('content');
  const mentions = parseMentions(content);
  state.comments.push({
    id: uid(),
    taskId,
    authorId: currentMemberId,
    content,
    mentions,
    createdAt: new Date().toISOString(),
  });
  const task = getTask(taskId);
  mentions.forEach(mid => notify(mid, taskId, `Te mencionaron en "${task.title}"`));
  save();
  openTaskDetail(taskId);
}

// ---- Project modal ----
