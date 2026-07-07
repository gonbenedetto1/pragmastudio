function openIncomeModal(id) {
  const i = id ? state.incomes.find(x => x.id === id) : { id: null, concept: '', amount: '', currency: state.defaultCurrency || 'ARS', date: todayISO(), projectId: '', status: 'CONFIRMED' };
  openModal(`
    <div class="p-6">
      <h2 class="text-xl font-semibold mb-4">${id ? 'Editar ingreso' : 'Nuevo ingreso'}</h2>
      <form onsubmit="saveIncome(event)" class="space-y-3">
        <input type="hidden" name="id" value="${i.id || ''}" />
        <div><label class="text-xs text-gray-500">Concepto</label><input name="concept" class="input" required autofocus value="${escapeAttr(i.concept)}" /></div>
        <div class="grid grid-cols-3 gap-3">
          <div><label class="text-xs text-gray-500">Monto</label><input type="number" step="0.01" name="amount" class="input" required value="${i.amount}" /></div>
          <div>
            <label class="text-xs text-gray-500">Moneda</label>
            <select name="currency">
              <option value="ARS" ${(i.currency||'ARS')==='ARS'?'selected':''}>ARS</option>
              <option value="USD" ${i.currency==='USD'?'selected':''}>USD</option>
            </select>
          </div>
          <div><label class="text-xs text-gray-500">Fecha</label><input type="date" name="date" class="input" required value="${i.date}" /></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-gray-500">Proyecto</label>
            <select name="projectId">
              <option value="">Sin proyecto</option>
              ${state.projects.map(p => `<option value="${p.id}" ${i.projectId===p.id?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-500">Estado</label>
            <select name="status">
              <option value="CONFIRMED" ${(i.status||'CONFIRMED')==='CONFIRMED'?'selected':''}>Confirmado / Cobrado</option>
              <option value="PENDING"   ${i.status==='PENDING'?'selected':''}>Pendiente de cobro</option>
            </select>
          </div>
        </div>
        <div class="flex justify-${id?'between':'end'} gap-2 pt-3">
          ${id ? `<button type="button" class="btn-ghost text-red-600 text-sm" onclick="deleteIncome('${id}')">Eliminar</button>` : ''}
          <div class="flex gap-2">
            <button type="button" class="btn-ghost" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar</button>
          </div>
        </div>
      </form>
    </div>
  `);
}

function saveIncome(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.amount = Number(data.amount);
  if (data.id) {
    const existing = state.incomes.find(x => x.id === data.id);
    const wasConfirmed = (existing.status || 'CONFIRMED') === 'CONFIRMED';
    const willBeConfirmed = (data.status || 'CONFIRMED') === 'CONFIRMED';
    if (willBeConfirmed && !wasConfirmed) {
      data.exchangeRateAtTime = Number(state.exchangeRate) || 1200;
      data.exchangeRateSource = state.exchangeRateSource || 'manual';
      data.confirmedAt = new Date().toISOString();
    } else if (!willBeConfirmed) {
      data.exchangeRateAtTime = null;
      data.confirmedAt = null;
    } else {
      data.exchangeRateAtTime = existing.exchangeRateAtTime || null;
    }
    Object.assign(existing, data);
  } else {
    if ((data.status || 'CONFIRMED') === 'CONFIRMED') {
      data.exchangeRateAtTime = Number(state.exchangeRate) || 1200;
      data.exchangeRateSource = state.exchangeRateSource || 'manual';
      data.confirmedAt = new Date().toISOString();
    }
    state.incomes.push({ ...data, id: uid() });
  }
  save(); closeModal(); render();
}
function deleteIncome(id) {
  if (!confirm('¿Eliminar ingreso?')) return;
  state.incomes = state.incomes.filter(x => x.id !== id);
  save(); closeModal(); render();
}

function openExpenseModal(id) {
  const ex = id ? state.expenses.find(x => x.id === id) : { id: null, concept: '', amount: '', currency: state.defaultCurrency || 'ARS', date: todayISO(), category: 'VARIABLE', projectId: '', status: 'PAID', recurring: true, recurringEndDate: '' };
  const isFixed = (ex.category || 'VARIABLE') === 'FIXED';
  const isRecurring = ex.recurring !== false;
  openModal(`
    <div class="p-6">
      <h2 class="text-xl font-semibold mb-4">${id ? 'Editar gasto' : 'Nuevo gasto'}</h2>
      <form onsubmit="saveExpense(event)" class="space-y-3">
        <input type="hidden" name="id" value="${ex.id || ''}" />
        <div><label class="text-xs text-gray-500">Concepto</label><input name="concept" class="input" required autofocus value="${escapeAttr(ex.concept)}" /></div>
        <div class="grid grid-cols-4 gap-3">
          <div><label class="text-xs text-gray-500">Monto</label><input type="number" step="0.01" name="amount" class="input" required value="${ex.amount}" /></div>
          <div>
            <label class="text-xs text-gray-500">Moneda</label>
            <select name="currency">
              <option value="ARS" ${(ex.currency||'ARS')==='ARS'?'selected':''}>ARS</option>
              <option value="USD" ${ex.currency==='USD'?'selected':''}>USD</option>
            </select>
          </div>
          <div><label class="text-xs text-gray-500">Fecha</label><input type="date" name="date" class="input" required value="${ex.date}" /></div>
          <div>
            <label class="text-xs text-gray-500">Categoría</label>
            <select name="category" onchange="toggleRecurringFields(this.value)">
              ${Object.entries(EXPENSE_CAT).map(([k,v]) => `<option value="${k}" ${ex.category===k?'selected':''}>${v}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-gray-500">Proyecto</label>
            <select name="projectId">
              <option value="">Sin proyecto</option>
              ${state.projects.map(p => `<option value="${p.id}" ${ex.projectId===p.id?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-500">Estado</label>
            <select name="status">
              <option value="PAID"    ${(ex.status||'PAID')==='PAID'?'selected':''}>Pagado</option>
              <option value="PENDING" ${ex.status==='PENDING'?'selected':''}>Pendiente</option>
            </select>
          </div>
        </div>

        <div id="recurringBox" class="${isFixed?'':'hidden'} bg-gray-50 rounded-lg p-3 space-y-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="recurring" ${isRecurring?'checked':''} class="w-4 h-4" />
            <span class="text-sm font-medium">Repetir este gasto cada mes</span>
          </label>
          <p class="text-[11px] text-gray-500">Va a aparecer automáticamente como <b>pendiente</b> en los meses siguientes. Los marcás como pagado cuando corresponda.</p>
          <div>
            <label class="text-xs text-gray-500">Pagar hasta <span class="text-gray-400">(opcional, si querés darlo de baja en una fecha futura)</span></label>
            <input type="date" name="recurringEndDate" class="input" value="${ex.recurringEndDate || ''}" />
          </div>
          ${id && ex.recurringEndDate ? `<p class="text-[11px] text-amber-700">⚠ Este gasto está dado de baja a partir de ${fmt(ex.recurringEndDate)}.</p>` : ''}
        </div>

        <div class="flex justify-${id?'between':'end'} gap-2 pt-3">
          ${id ? `<button type="button" class="btn-ghost text-red-600 text-sm" onclick="deleteExpense('${id}')">Eliminar</button>` : ''}
          <div class="flex gap-2">
            <button type="button" class="btn-ghost" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar</button>
          </div>
        </div>
      </form>
    </div>
  `);
}

function toggleRecurringFields(category) {
  const box = document.getElementById('recurringBox');
  if (!box) return;
  if (category === 'FIXED') box.classList.remove('hidden');
  else box.classList.add('hidden');
}

function saveExpense(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.amount = Number(data.amount);
  // El checkbox sólo entra a FormData si está checked; si no está, queda undefined
  data.recurring = data.category === 'FIXED' ? (data.recurring === 'on') : false;
  data.recurringEndDate = data.recurringEndDate || null;
  if (data.id) {
    const existing = state.expenses.find(x => x.id === data.id);
    const wasPaid = (existing.status || 'PAID') === 'PAID';
    const willBePaid = (data.status || 'PAID') === 'PAID';
    if (willBePaid && !wasPaid) {
      data.exchangeRateAtTime = Number(state.exchangeRate) || 1200;
      data.exchangeRateSource = state.exchangeRateSource || 'manual';
      data.paidAt = new Date().toISOString();
    } else if (!willBePaid) {
      data.exchangeRateAtTime = null;
      data.paidAt = null;
    } else {
      data.exchangeRateAtTime = existing.exchangeRateAtTime || null;
    }
    Object.assign(existing, data);
  } else {
    if ((data.status || 'PAID') === 'PAID') {
      data.exchangeRateAtTime = Number(state.exchangeRate) || 1200;
      data.exchangeRateSource = state.exchangeRateSource || 'manual';
      data.paidAt = new Date().toISOString();
    }
    state.expenses.push({ ...data, id: uid() });
  }
  save(); closeModal(); render();
}
function deleteExpense(id) {
  const e = state.expenses.find(x => x.id === id);
  const paymentsCount = e ? (state.recurringExpensePayments || []).filter(r => r.expenseId === id).length : 0;
  const detail = paymentsCount > 0
    ? `\n\nTambién se borrarán los ${paymentsCount} pago${paymentsCount>1?'s':''} recurrente${paymentsCount>1?'s':''} registrado${paymentsCount>1?'s':''}.`
    : '';
  if (!confirm(`¿Eliminar gasto?${detail}`)) return;
  state.expenses = state.expenses.filter(x => x.id !== id);
  state.recurringExpensePayments = (state.recurringExpensePayments || []).filter(r => r.expenseId !== id);
  save(); closeModal(); render();
}

