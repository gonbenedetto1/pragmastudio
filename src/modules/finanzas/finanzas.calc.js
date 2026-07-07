function reactivateRecurringExpense(expenseId) {
  const e = state.expenses.find(x => x.id === expenseId);
  if (!e) return;
  e.recurringEndDate = null;
  save(); render();
  showToast('Gasto fijo reactivado', 'success');
}

// Borrado total: elimina el gasto + todo el historial de pagos recurrentes
function deleteRecurringExpenseFull(expenseId) {
  const e = state.expenses.find(x => x.id === expenseId);
  if (!e) return;
  const paymentsCount = (state.recurringExpensePayments || []).filter(r => r.expenseId === expenseId).length;
  const detail = paymentsCount > 0
    ? `\n\nSe va a borrar el gasto original y los ${paymentsCount} pago${paymentsCount>1?'s':''} registrado${paymentsCount>1?'s':''}.`
    : '';
  if (!confirm(`¿Eliminar completamente "${e.concept}"?${detail}\n\nEsto NO se puede deshacer.`)) return;
  state.expenses = state.expenses.filter(x => x.id !== expenseId);
  state.recurringExpensePayments = (state.recurringExpensePayments || []).filter(r => r.expenseId !== expenseId);
  save(); render();
  showToast('Gasto eliminado completamente', 'success');
}

function inRange(date, from, to) {
  return date >= from && date <= to;
}

function fmtAmount(n, currency) {
  const c = currency || state.defaultCurrency || 'ARS';
  const symbol = c === 'USD' ? 'US$' : '$';
  return symbol + (Number(n)||0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function toBaseCurrency(amount, fromCurrency, toCurrency) {
  const from = fromCurrency || 'ARS';
  const to = toCurrency || state.defaultCurrency || 'ARS';
  if (from === to) return Number(amount);
  const rate = Number(state.exchangeRate) || 1200;
  if (from === 'USD' && to === 'ARS') return Number(amount) * rate;
  if (from === 'ARS' && to === 'USD') return Number(amount) / rate;
  return Number(amount);
}

function convertAt(amount, fromCurrency, toCurrency, rate) {
  const from = fromCurrency || 'ARS';
  const to = toCurrency || state.defaultCurrency || 'ARS';
  if (from === to) return Number(amount);
  const r = Number(rate) || 1200;
  if (from === 'USD' && to === 'ARS') return Number(amount) * r;
  if (from === 'ARS' && to === 'USD') return Number(amount) / r;
  return Number(amount);
}

// Cotización efectiva del item: la "congelada" si fue confirmado, o la actual si está pendiente
function getEffectiveRate(item) {
  if (item.auto) {
    if (item.sourceExpenseId) {
      // Gasto fijo auto: chequear log de pagos recurrentes
      const record = getExpensePaymentRecord(item.sourceExpenseId, item.month);
      if (record && record.exchangeRate) return Number(record.exchangeRate);
    } else {
      // Mensualidad de proyecto
      const record = getChargeRecord(item.projectId, item.month);
      if (record && record.exchangeRate) return Number(record.exchangeRate);
    }
  } else if (item.exchangeRateAtTime) {
    return Number(item.exchangeRateAtTime);
  }
  return Number(state.exchangeRate) || 1200;
}

function toBaseCurrencyForItem(item, toCurrency) {
  return convertAt(item.amount, item.currency, toCurrency, getEffectiveRate(item));
}

// ---- USD exchange rate ----
