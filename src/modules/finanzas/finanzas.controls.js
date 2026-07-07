function monthBalance(month) {
  const m = month || financeMonth;
  const inc = state.incomes.filter(i => i.date && i.date.startsWith(m)).reduce((a,b) => a + Number(b.amount||0), 0);
  const autoInc = getAutoIncomes(m).reduce((a,b) => a + Number(b.amount||0), 0);
  const exp = state.expenses.filter(e => e.date && e.date.startsWith(m)).reduce((a,b) => a + Number(b.amount||0), 0);
  return inc + autoInc - exp;
}

function setFinanceMode(m) { financeMode = m; render(); }

function setBaseCurrency(cur) {
  state.defaultCurrency = (cur === 'ARS' ? 'ARS' : 'USD');
  save();
  render();
}

function openFinanceBreakdown(kind) {
  const audit = window._financeAudit;
  if (!audit) { alert('Recargá la página y probá de nuevo'); return; }
  const rows = kind === 'income' ? audit.income : audit.expense;
  const totalARS = kind === 'income' ? audit.totalIncARS : audit.totalExpARS;
  const totalUSD = kind === 'income' ? audit.totalIncUSD : audit.totalExpUSD;
  const baseCur = audit.baseCur;
  const title = kind === 'income' ? 'Detalle de Cobrado' : 'Detalle de Pagado';
  const color = kind === 'income' ? 'text-green-700' : 'text-red-600';
  const rateNow = Number(state.exchangeRate) || 1200;

  // Ordenamos por mes y monto descendente
  const sorted = [...rows].sort((a,b) => a.monthKey.localeCompare(b.monthKey) || b.arsAmt - a.arsAmt);

  openModal(`
    <div class="p-6 inv-slide-in">
      <div class="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 class="text-lg font-semibold">${title}</h2>
          <p class="text-xs text-gray-500 mt-0.5">${escapeHtml(audit.label)} · Tipo cambio actual $${rateNow.toLocaleString('es-AR')}</p>
        </div>
        <button onclick="closeModal()" class="text-gray-400 hover:text-gray-900 text-xl leading-none">✕</button>
      </div>

      <div class="bg-gray-50 rounded-lg p-4 mb-4 grid grid-cols-2 gap-3">
        <div>
          <div class="text-[10px] uppercase tracking-wider text-gray-500">Total en ARS</div>
          <div class="text-lg font-bold ${color}">${fmtAmount(totalARS, 'ARS')}</div>
        </div>
        <div>
          <div class="text-[10px] uppercase tracking-wider text-gray-500">Total en USD</div>
          <div class="text-lg font-bold ${color}">${fmtAmount(totalUSD, 'USD')}</div>
        </div>
      </div>

      <div class="text-xs text-gray-500 mb-2 flex items-center justify-between">
        <span>${sorted.length} contribuciones · cada pago con su cotización congelada</span>
      </div>

      <div class="max-h-96 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
        ${sorted.length === 0 ? '<div class="p-6 text-center text-gray-400 text-sm">Sin movimientos en el período.</div>' : sorted.map(r => {
          const [yy, mm] = r.monthKey.split('-');
          const monthLabel = `${MONTH_NAMES_SHORT[Number(mm)-1]} '${yy.slice(2)}`;
          const it = r.it;
          const isCarry = it._carryOver;
          const isForeign = it._foreignPayment;
          const chipLabel = isCarry ? `arrastre ${it._carryOverFrom || ''}` : isForeign ? `arrastre ${it._originalPeriod || ''}` : (it.auto ? 'auto' : 'manual');
          const p = it.projectId ? getProject(it.projectId) : null;
          return `
            <div class="flex items-center gap-3 p-3 hover:bg-gray-50">
              <div class="text-[10px] font-semibold text-gray-500 uppercase w-14 shrink-0">${monthLabel}</div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">${escapeHtml(it.concept || '')}</div>
                <div class="text-[10px] text-gray-500 mt-0.5">${escapeHtml(chipLabel)}${p ? ' · ' + escapeHtml(p.name) : ''}</div>
              </div>
              <div class="text-right shrink-0">
                <div class="text-sm font-semibold ${color}">${fmtAmount(baseCur === 'USD' ? r.usdAmt : r.arsAmt, baseCur)}</div>
                <div class="text-[10px] text-gray-400">${fmtAmount(baseCur === 'USD' ? r.arsAmt : r.usdAmt, baseCur === 'USD' ? 'ARS' : 'USD')}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="mt-3 text-[11px] text-gray-500 leading-relaxed">
        <b>Cash basis</b>: cada pago cuenta en el mes en que se hizo, no en el período del comprobante.
        Los importes en la otra moneda usan el <b>tipo de cambio congelado al momento del pago</b>.
      </div>

      <div class="flex justify-end pt-4 mt-4 border-t border-gray-100">
        <button class="btn-ghost" onclick="closeModal()">Cerrar</button>
      </div>
    </div>
  `);
}

function getDisplayYear() {
  if (financeMode === 'year') return Number(financeYear);
  if (financeMode === 'range') return Number((financeFrom || todayISO()).slice(0,4));
  return Number((financeMonth || todayISO()).slice(0,4));
}

function navYear(delta) {
  const y = getDisplayYear() + delta;
  if (financeMode === 'year') {
    financeYear = String(y);
  } else if (financeMode === 'month') {
    const mm = financeMonth.slice(5, 7);
    financeMonth = `${y}-${mm}`;
  } else if (financeMode === 'range') {
    // Shift range by 1 year
    const shiftDate = (d) => {
      const [yy, mm, dd] = d.split('-');
      return `${Number(yy)+delta}-${mm}-${dd}`;
    };
    if (financeFrom) financeFrom = shiftDate(financeFrom);
    if (financeTo)   financeTo   = shiftDate(financeTo);
    financeYear = String(y);
  }
  render();
}

function selectFinanceMonth(monthKey) {
  financeMode = 'month';
  financeMonth = monthKey;
  render();
}

function openRangePickerInline() {
  if (financeMode === 'range') {
    // Si ya estaba activo, vuelvo al mes actual
    financeMode = 'month';
  } else {
    financeMode = 'range';
    // Inicializar rango si no estaba
    if (!financeFrom) financeFrom = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0,10);
    if (!financeTo) financeTo = todayISO();
  }
  render();
}

