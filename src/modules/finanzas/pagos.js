// ============ PARTIAL PAYMENTS ============
// Devuelve { expected, totalPaid, remaining, percent, status, payments[] }
function getPaymentSummary(item) {
  const expected = Number(item.amount) || 0;
  let payments = [];
  let kind = '';

  if (item.auto && item.sourceExpenseId) {
    kind = 'expense_recurring';
    payments = (state.recurringExpensePayments || []).filter(r => r.expenseId === item.sourceExpenseId && r.month === item.month);
  } else if (item.auto) {
    kind = 'income_recurring';
    payments = (state.recurringChargeLog || []).filter(r => r.projectId === item.projectId && r.month === item.month);
  } else if (item._kind === 'income') {
    kind = 'income';
    payments = (state.incomePayments || []).filter(p => p.incomeId === item.id);
    // Backwards compat: status=CONFIRMED sin pagos = pago completo sintético
    if (payments.length === 0 && (item.status || 'CONFIRMED') === 'CONFIRMED') {
      payments = [{ id: '__synth__'+item.id, amount: expected, exchangeRate: item.exchangeRateAtTime || state.exchangeRate, synthetic: true, paidAt: item.confirmedAt || item.date }];
    }
  } else if (item._kind === 'expense') {
    kind = 'expense';
    payments = (state.expensePayments || []).filter(p => p.expenseId === item.id);
    if (payments.length === 0 && (item.status || 'PAID') === 'PAID') {
      payments = [{ id: '__synth__'+item.id, amount: expected, exchangeRate: item.exchangeRateAtTime || state.exchangeRate, synthetic: true, paidAt: item.paidAt || item.date }];
    }
  }

  // Suma: si el pago tiene amount explícito úsalo, si no asume completo (legacy)
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount != null ? Number(p.amount) : expected), 0);
  const remaining = Math.max(0, expected - totalPaid);
  const percent = expected > 0 ? Math.min(100, Math.round((totalPaid / expected) * 100)) : 0;
  let status;
  if (totalPaid <= 0) status = 'PENDING';
  else if (totalPaid >= expected) status = 'PAID';
  else status = 'PARTIAL';

  return { expected, totalPaid, remaining, percent, status, payments, kind };
}

// Devuelve { label, color } según el tipo (ingreso/gasto) y el estado del pago
function getPaymentChip(item) {
  const s = getPaymentSummary(item);
  const isInc = item._kind === 'income' || (item.auto && !item.sourceExpenseId);
  if (s.status === 'PAID')    return { label: isInc ? 'Cobrado' : 'Pagado',        color: 'bg-green-100 text-green-700' };
  if (s.status === 'PARTIAL') return { label: `${s.percent}% ${isInc?'cobrado':'pagado'}`, color: 'bg-blue-100 text-blue-700' };
  return                       { label: 'Pendiente',                                color: 'bg-amber-100 text-amber-800' };
}

function addPaymentToItem(item, amount, date, note) {
  const rate = Number(state.exchangeRate) || 1200;
  const userDate = date || todayISO();
  const base = {
    id: uid(),
    amount: Number(amount),
    currency: item.currency || 'ARS',           // ← guarda moneda explícita
    date: userDate,                             // ← fecha que el usuario eligió
    paidAt: new Date().toISOString(),           // ← timestamp de cuando se registró
    paidBy: currentMemberId,
    exchangeRate: rate,
    exchangeRateSource: state.exchangeRateSource || 'manual',
    note: note || '',
  };

  if (item.auto && item.sourceExpenseId) {
    state.recurringExpensePayments.push({ ...base, expenseId: item.sourceExpenseId, month: item.month });
  } else if (item.auto) {
    // chargedAt = user-chosen date (no el timestamp). El timestamp queda en paidAt.
    state.recurringChargeLog.push({ ...base, projectId: item.projectId, month: item.month, chargedAt: userDate, chargedBy: currentMemberId });
  } else if (item._kind === 'income') {
    const real = state.incomes.find(x => x.id === item.id);
    if (real) real.status = 'CONFIRMED';
    state.incomePayments.push({ ...base, incomeId: item.id });
  } else if (item._kind === 'expense') {
    const real = state.expenses.find(x => x.id === item.id);
    if (real) real.status = 'PAID';
    state.expensePayments.push({ ...base, expenseId: item.id });
  }
  save();
}

function removePayment(kind, paymentId) {
  if (paymentId.startsWith('__synth__')) {
    // Sintético: viene del status binario. Limpiar el status del item.
    const realId = paymentId.slice('__synth__'.length);
    const inc = state.incomes.find(x => x.id === realId);
    if (inc) { inc.status = 'PENDING'; inc.exchangeRateAtTime = null; inc.confirmedAt = null; }
    const exp = state.expenses.find(x => x.id === realId);
    if (exp) { exp.status = 'PENDING'; exp.exchangeRateAtTime = null; exp.paidAt = null; }
  } else if (kind === 'income_recurring') {
    state.recurringChargeLog = state.recurringChargeLog.filter(r => r.id !== paymentId);
  } else if (kind === 'expense_recurring') {
    state.recurringExpensePayments = state.recurringExpensePayments.filter(r => r.id !== paymentId);
  } else if (kind === 'income') {
    state.incomePayments = state.incomePayments.filter(r => r.id !== paymentId);
  } else if (kind === 'expense') {
    state.expensePayments = state.expensePayments.filter(r => r.id !== paymentId);
  }
  save();
}

let _currentPaymentsItem = null;
function openPaymentsModal(item) {
  _currentPaymentsItem = item;
  renderPaymentsModal();
}
function renderPaymentsModal() {
  const item = _currentPaymentsItem;
  if (!item) return;
  const s = getPaymentSummary(item);
  const isInc = item._kind === 'income' || (item.auto && !item.sourceExpenseId);
  const cur = item.currency || 'ARS';

  openModal(`
    <div class="p-6">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="flex-1 min-w-0">
          <h2 class="text-xl font-semibold truncate">${escapeHtml(item.concept)}</h2>
          <p class="text-sm text-gray-500">${isInc ? 'Cobros' : 'Pagos'} registrados</p>
        </div>
        <button onclick="closeModal()" class="text-gray-400 hover:text-gray-900 text-lg">✕</button>
      </div>

      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="bg-gray-50 rounded-lg p-3">
          <div class="text-[11px] text-gray-500 uppercase">Esperado</div>
          <div class="font-semibold">${fmtAmount(s.expected, cur)}</div>
        </div>
        <div class="bg-green-50 rounded-lg p-3">
          <div class="text-[11px] text-green-700 uppercase">${isInc?'Cobrado':'Pagado'}</div>
          <div class="font-semibold text-green-700">${fmtAmount(s.totalPaid, cur)} <span class="text-xs font-normal">(${s.percent}%)</span></div>
        </div>
        <div class="bg-amber-50 rounded-lg p-3">
          <div class="text-[11px] text-amber-800 uppercase">Falta</div>
          <div class="font-semibold text-amber-800">${fmtAmount(s.remaining, cur)}</div>
        </div>
      </div>

      <div class="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div class="h-full ${s.status==='PAID'?'bg-green-500':'bg-blue-500'} transition-all" style="width:${s.percent}%"></div>
      </div>

      <h3 class="text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold">Pagos (${s.payments.length})</h3>
      <div class="space-y-1 mb-5 max-h-48 overflow-y-auto">
        ${s.payments.length === 0 ? '<div class="text-sm text-gray-400 italic">Sin pagos todavía.</div>' : s.payments.map(p => `
          <div class="flex items-center justify-between py-2 border-b border-gray-100 text-sm group">
            <div class="flex-1 min-w-0">
              <div class="font-medium">${fmtAmount(p.amount != null ? p.amount : s.expected, cur)}</div>
              <div class="text-xs text-gray-500">${fmt(p.date || p.paidAt || p.chargedAt)}${p.note?` · ${escapeHtml(p.note)}`:''}${p.synthetic?' · <span class="italic">legacy</span>':''}</div>
            </div>
            <button onclick="removePayment('${s.kind}','${p.id}'); renderPaymentsModal()" class="opacity-0 group-hover:opacity-100 text-red-500 text-xs px-2 transition" title="Eliminar este pago">✕</button>
          </div>
        `).join('')}
      </div>

      <h3 class="text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold">Agregar pago</h3>
      <form onsubmit="submitPayment(event)" class="space-y-3">
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-gray-500">Monto en <b>${cur}</b></label>
            <div class="relative">
              <input id="paymentAmountInput" type="number" step="0.01" name="amount" class="input pr-12" required value="${s.remaining || ''}" oninput="updatePaymentConversionPreview()" />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold pointer-events-none">${cur}</span>
            </div>
            <div id="paymentConversionPreview" class="text-[11px] text-blue-700 mt-1 font-medium min-h-[16px]"></div>
          </div>
          <div>
            <label class="text-xs text-gray-500">Fecha del pago</label>
            <input type="date" name="date" class="input" value="${todayISO()}" />
          </div>
        </div>
        <p class="text-[11px] text-gray-500">⚠ El monto se cuenta en <b>${cur}</b>. Si el cobro real fue en ${cur==='USD'?'pesos':'dólares'}, convertilo a ${cur} antes de cargarlo.</p>
        <div>
          <label class="text-xs text-gray-500">Nota (opcional)</label>
          <input type="text" name="note" class="input" placeholder="Ej: 1er adelanto, transferencia, etc." />
        </div>

        <div class="flex flex-wrap gap-1">
          <button type="button" onclick="setPaymentAmount(${s.remaining})" class="chip bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer">Falta (${fmtAmount(s.remaining, cur)})</button>
          <button type="button" onclick="setPaymentAmount(${s.expected * 0.5})" class="chip bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer">50%</button>
          <button type="button" onclick="setPaymentAmount(${s.expected * 0.25})" class="chip bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer">25%</button>
          <button type="button" onclick="setPaymentAmount(${s.expected})" class="chip bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer">Total</button>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <button type="button" class="btn-ghost" onclick="closeModal()">Cerrar</button>
          <button type="submit" class="btn-primary">Agregar pago</button>
        </div>
      </form>
    </div>
  `);

  // Mostrar la conversión apenas se abre, así detectás si la moneda está mal
  setTimeout(() => updatePaymentConversionPreview(), 30);
}

function setPaymentAmount(amount) {
  const inp = document.getElementById('paymentAmountInput');
  if (inp) inp.value = Number(amount).toFixed(2);
  updatePaymentConversionPreview();
}

// Live preview: muestra la conversión a la otra moneda al cambio actual
// para que el usuario detecte si está cargando en la moneda equivocada
function updatePaymentConversionPreview() {
  if (!_currentPaymentsItem) return;
  const inp = document.getElementById('paymentAmountInput');
  const preview = document.getElementById('paymentConversionPreview');
  if (!inp || !preview) return;
  const amount = Number(inp.value) || 0;
  if (amount <= 0) { preview.textContent = ''; return; }
  const cur = _currentPaymentsItem.currency || 'ARS';
  const rate = Number(state.exchangeRate) || 1200;
  if (cur === 'USD') {
    const ars = amount * rate;
    preview.innerHTML = `≈ $${ars.toLocaleString('es-AR', {maximumFractionDigits: 0})} ARS <span class="text-gray-400 font-normal">(al cambio actual $${rate.toLocaleString('es-AR')})</span>`;
  } else if (cur === 'ARS') {
    const usd = amount / rate;
    preview.innerHTML = `≈ US$${usd.toLocaleString('es-AR', {maximumFractionDigits: 2})} USD <span class="text-gray-400 font-normal">(al cambio actual $${rate.toLocaleString('es-AR')})</span>`;
  } else {
    preview.textContent = '';
  }
}

function submitPayment(e) {
  e.preventDefault();
  if (!_currentPaymentsItem) return;
  const data = Object.fromEntries(new FormData(e.target).entries());
  const amount = Number(data.amount);
  if (!amount || isNaN(amount)) return alert('Monto inválido');
  addPaymentToItem(_currentPaymentsItem, amount, data.date, data.note);
  // Refrescamos el item con el nuevo state
  if (_currentPaymentsItem.auto && _currentPaymentsItem.sourceExpenseId) {
    // Recompute auto-expense
    const fresh = getAutoExpenses(_currentPaymentsItem.month).find(x => x.sourceExpenseId === _currentPaymentsItem.sourceExpenseId);
    if (fresh) _currentPaymentsItem = { ...fresh, _kind: 'expense' };
  } else if (_currentPaymentsItem.auto) {
    const fresh = getAutoIncomes(_currentPaymentsItem.month).find(x => x.projectId === _currentPaymentsItem.projectId);
    if (fresh) _currentPaymentsItem = { ...fresh, _kind: 'income' };
  }
  renderPaymentsModal();
  // re-render main view in background
  render();
}

