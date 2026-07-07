// ============ FINANCE ============
let financeMode  = 'month';                                 // 'month' | 'year' | 'range'
let financeMonth = new Date().toISOString().slice(0,7);     // YYYY-MM
let financeYear  = String(new Date().getFullYear());
let financeFrom  = new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).toISOString().slice(0,10);
let financeTo    = new Date().toISOString().slice(0,10);

function lastDayOfMonth(yyyymm) {
  const [y, m] = yyyymm.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${yyyymm}-${String(last).padStart(2,'0')}`;
}

function monthsBetween(fromDate, toDate) {
  const out = [];
  let [fy, fm] = fromDate.split('-').slice(0,2).map(Number);
  const [ty, tm] = toDate.split('-').slice(0,2).map(Number);
  while (fy < ty || (fy === ty && fm <= tm)) {
    out.push(`${fy}-${String(fm).padStart(2,'0')}`);
    fm++; if (fm > 12) { fm = 1; fy++; }
  }
  return out;
}

const MONTH_NAMES_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTH_NAMES_FULL  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function getFinanceRange() {
  if (financeMode === 'month') {
    const [y, m] = financeMonth.split('-').map(Number);
    return { from: financeMonth + '-01', to: lastDayOfMonth(financeMonth), label: `${MONTH_NAMES_FULL[m-1]} ${y}` };
  }
  if (financeMode === 'year') {
    return { from: `${financeYear}-01-01`, to: `${financeYear}-12-31`, label: `Año ${financeYear}` };
  }
  return { from: financeFrom, to: financeTo, label: `${fmt(financeFrom)} → ${fmt(financeTo)}` };
}

function isMonthCharged(projectId, month) {
  return (state.recurringChargeLog || []).some(r => r.projectId === projectId && r.month === month);
}
function getChargeRecord(projectId, month) {
  return (state.recurringChargeLog || []).find(r => r.projectId === projectId && r.month === month);
}
function toggleMonthCharged(projectId, month) {
  if (isMonthCharged(projectId, month)) {
    state.recurringChargeLog = state.recurringChargeLog.filter(r => !(r.projectId === projectId && r.month === month));
  } else {
    const rate = Number(state.exchangeRate) || 1200;
    state.recurringChargeLog.push({
      id: uid(),
      projectId,
      month,
      chargedAt: new Date().toISOString(),
      chargedBy: currentMemberId,
      exchangeRate: rate,
      exchangeRateSource: state.exchangeRateSource || 'manual',
    });
    const p = getProject(projectId);
    const inAR = (p && p.monthlyFeeCurrency === 'USD') ? ` · cotización $${rate.toLocaleString('es-AR')}` : '';
    showToast(`Pago marcado como cobrado${inAR}`, 'success');
  }
  save(); render();
}

function getAutoIncomes(month) {
  // Ingresos virtuales a partir de proyectos ACTIVE_RECURRING con mensualidad
  const out = [];
  state.projects.forEach(p => {
    if (p.status !== 'ACTIVE_RECURRING' || !p.monthlyFee) return;
    const startMonth = (p.startDate || '').slice(0, 7);
    if (startMonth && startMonth > month) return;
    const endMonth = (p.endDate || '').slice(0, 7);
    if (endMonth && endMonth < month) return;
    const charged = isMonthCharged(p.id, month);
    out.push({
      id: `auto-${p.id}-${month}`,
      amount: Number(p.monthlyFee),
      currency: p.monthlyFeeCurrency || state.defaultCurrency || 'ARS',
      date: month + '-01',
      month,
      concept: `Mensualidad · ${p.name}`,
      projectId: p.id,
      auto: true,
      status: charged ? 'CHARGED' : 'PENDING',
    });
  });
  return out;
}

function getAutoIncomesInRange(from, to) {
  const fromM = from.slice(0,7);
  const toM = to.slice(0,7);
  return monthsBetween(fromM + '-01', toM + '-01').flatMap(m => getAutoIncomes(m));
}

// ---- Auto expenses (gastos fijos recurrentes) ----
function getExpensePaymentRecord(expenseId, month) {
  return (state.recurringExpensePayments || []).find(r => r.expenseId === expenseId && r.month === month);
}
function isExpenseMonthPaid(expenseId, month) {
  return !!getExpensePaymentRecord(expenseId, month);
}

function getAutoExpenses(month) {
  // Genera gastos virtuales para meses posteriores a partir de gastos FIXED con recurring=true
  const out = [];
  state.expenses.forEach(e => {
    if (e.category !== 'FIXED') return;
    if (e.recurring === false) return;
    const expenseMonth = (e.date || '').slice(0, 7);
    if (!expenseMonth || expenseMonth >= month) return;        // sólo en meses POSTERIORES al original
    const endMonth = (e.recurringEndDate || '').slice(0, 7);
    if (endMonth && endMonth < month) return;                  // ya fue dado de baja
    const payment = getExpensePaymentRecord(e.id, month);
    out.push({
      id: `auto-exp-${e.id}-${month}`,
      sourceExpenseId: e.id,
      amount: Number(e.amount),
      currency: e.currency || 'ARS',
      date: month + '-01',
      month,
      concept: e.concept,
      category: e.category,
      projectId: e.projectId,
      auto: true,
      status: payment ? 'PAID' : 'PENDING',
      exchangeRateAtTime: payment?.exchangeRate || null,
    });
  });
  return out;
}

function getAutoExpensesInRange(from, to) {
  const fromM = from.slice(0,7);
  const toM = to.slice(0,7);
  return monthsBetween(fromM + '-01', toM + '-01').flatMap(m => getAutoExpenses(m));
}

// ---- Carry-over (arrastre) ----
// Sólo se arrastran INGRESOS con cobro PARCIAL (algo cobrado, falta resto).
// Y SÓLO en el mes inmediatamente siguiente al original — no se proyecta
// hacia futuros meses indefinidamente.
function prevMonthKey(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  const prevM = m === 1 ? 12 : m - 1;
  const prevY = m === 1 ? y - 1 : y;
  return `${prevY}-${String(prevM).padStart(2,'0')}`;
}

// ---- Cash-flow: lista todos los pagos con su fecha real (no la fecha del item original) ----
function getAllCashFlowPayments(kind) {
  const out = [];

  if (kind === 'income') {
    // 1. Pagos explícitos sobre ingresos manuales
    (state.incomePayments || []).forEach(p => {
      const inc = state.incomes.find(i => i.id === p.incomeId);
      if (!inc) return;
      out.push({
        amount: Number(p.amount) || 0,
        currency: p.currency || inc.currency || 'ARS',
        date: (p.date || p.paidAt || '').slice(0, 10),
        exchangeRate: Number(p.exchangeRate) || Number(inc.exchangeRateAtTime) || Number(state.exchangeRate) || 1200,
      });
    });
    // 2. Pagos sobre mensualidades recurrentes (cobros)
    (state.recurringChargeLog || []).forEach(r => {
      const proj = getProject(r.projectId);
      if (!proj) return;
      const amount = r.amount != null ? Number(r.amount) : Number(proj.monthlyFee || 0);
      out.push({
        amount,
        currency: r.currency || proj.monthlyFeeCurrency || 'ARS',
        date: (r.date || r.chargedAt || '').slice(0, 10),       // ← prefiere r.date
        exchangeRate: Number(r.exchangeRate) || Number(state.exchangeRate) || 1200,
      });
    });
    // 3. Sintético: ingresos confirmados sin payment log (back-compat con data vieja)
    state.incomes.forEach(i => {
      if ((state.incomePayments || []).some(p => p.incomeId === i.id)) return;
      if ((i.status || 'CONFIRMED') !== 'CONFIRMED') return;
      out.push({
        amount: Number(i.amount) || 0,
        currency: i.currency || 'ARS',
        date: ((i.confirmedAt && i.confirmedAt.slice(0,10)) || i.date || '').slice(0, 10),
        exchangeRate: Number(i.exchangeRateAtTime) || Number(state.exchangeRate) || 1200,
      });
    });
  } else {
    // 1. Pagos explícitos sobre gastos manuales
    (state.expensePayments || []).forEach(p => {
      const exp = state.expenses.find(e => e.id === p.expenseId);
      if (!exp) return;
      out.push({
        amount: Number(p.amount) || 0,
        currency: p.currency || exp.currency || 'ARS',
        date: (p.date || p.paidAt || '').slice(0, 10),
        exchangeRate: Number(p.exchangeRate) || Number(exp.exchangeRateAtTime) || Number(state.exchangeRate) || 1200,
      });
    });
    // 2. Pagos sobre gastos fijos recurrentes
    (state.recurringExpensePayments || []).forEach(r => {
      const exp = state.expenses.find(e => e.id === r.expenseId);
      if (!exp) return;
      const amount = r.amount != null ? Number(r.amount) : Number(exp.amount || 0);
      out.push({
        amount,
        currency: r.currency || exp.currency || 'ARS',
        date: (r.date || r.paidAt || '').slice(0, 10),          // ← prefiere r.date
        exchangeRate: Number(r.exchangeRate) || Number(state.exchangeRate) || 1200,
      });
    });
    // 3. Sintético: gastos pagados sin payment log (back-compat con data vieja)
    state.expenses.forEach(e => {
      if ((state.expensePayments || []).some(p => p.expenseId === e.id)) return;
      if ((e.status || 'PAID') !== 'PAID') return;
      out.push({
        amount: Number(e.amount) || 0,
        currency: e.currency || 'ARS',
        date: ((e.paidAt && e.paidAt.slice(0,10)) || e.date || '').slice(0, 10),
        exchangeRate: Number(e.exchangeRateAtTime) || Number(state.exchangeRate) || 1200,
      });
    });
  }

  // Filtrar entries con fecha vacía (no se pueden ubicar en el tiempo)
  return out.filter(p => p.date);
}

// Arrastres encadenados: una vez parcial, se sigue mostrando en cada mes
// posterior hasta que se cobre 100%. Si no cobrás en junio → julio sigue
// mostrándolo. Si tampoco en julio → agosto. Y así.
// Sólo aplica en vista Mes; en Año/Rango no se muestra para no duplicar.
function getCarryOversForMonth(viewedMonth) {
  const incomes = [];

  // Manual incomes anteriores con saldo parcial
  state.incomes.forEach(i => {
    if (!i.date) return;
    const m = i.date.slice(0, 7);
    if (m >= viewedMonth) return;
    const tmp = { ...i, _kind: 'income' };
    const sum = getPaymentSummary(tmp);
    if (sum.status !== 'PARTIAL') return;
    incomes.push({ ...i, _kind: 'income', _carryOver: true, _carryOverFrom: m, _carryOverRemaining: sum.remaining });
  });

  // Recurring incomes (mensualidades) parciales de meses anteriores
  state.projects.forEach(p => {
    if (p.status !== 'ACTIVE_RECURRING' || !p.monthlyFee) return;
    const start = (p.startDate || '').slice(0, 7);
    if (!start) return;
    const end = (p.endDate || '').slice(0, 7);
    monthsBetween(start + '-01', viewedMonth + '-01').forEach(m => {
      if (m >= viewedMonth) return;
      if (end && m > end) return;
      const autoInc = getAutoIncomes(m).find(x => x.projectId === p.id);
      if (!autoInc) return;
      const sum = getPaymentSummary(autoInc);
      if (sum.status !== 'PARTIAL') return;
      incomes.push({ ...autoInc, _carryOver: true, _carryOverFrom: m, _carryOverRemaining: sum.remaining });
    });
  });

  return { incomes, expenses: [] };
}

function toggleExpenseMonthPaid(expenseId, month) {
  if (isExpenseMonthPaid(expenseId, month)) {
    state.recurringExpensePayments = state.recurringExpensePayments.filter(r => !(r.expenseId === expenseId && r.month === month));
  } else {
    state.recurringExpensePayments.push({
      id: uid(),
      expenseId,
      month,
      paidAt: new Date().toISOString(),
      paidBy: currentMemberId,
      exchangeRate: Number(state.exchangeRate) || 1200,
      exchangeRateSource: state.exchangeRateSource || 'manual',
    });
    showToast('Gasto marcado como pagado', 'success');
  }
  save(); render();
}

function cancelRecurringExpense(expenseId) {
  const e = state.expenses.find(x => x.id === expenseId);
  if (!e) return;
  if (!confirm(`¿Dar de baja el gasto fijo "${e.concept}"? Dejará de aparecer desde el próximo mes. Lo histórico se mantiene.`)) return;
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  e.recurringEndDate = lastDayOfMonth.toISOString().slice(0, 10);
  save(); render();
  showToast('Gasto fijo dado de baja desde el próximo mes', 'success');
}

