const PAYMENT_VARS = [
  { key: 'name',    label: 'Nombre contacto', resolve: (p, i) => p.contactName || '' },
  { key: 'client',  label: 'Cliente',         resolve: (p, i) => p.contactName || p.name || '' },
  { key: 'project', label: 'Proyecto',        resolve: (p, i) => p.name || '' },
  { key: 'company', label: 'Empresa',         resolve: (p, i) => p.companyName || p.name || '' },
  { key: 'role',    label: 'Cargo',           resolve: (p, i) => p.contactRole || '' },
  { key: 'month',   label: 'Mes',             resolve: (p, i) => {
      const [y, mm] = (i.month || i.date || '').split('-');
      return mm ? `${MONTH_NAMES_FULL[Number(mm)-1]} ${y}` : '';
    } },
  // {amount} → SIEMPRE convertido a moneda base (ARS por defecto) al cambio actual
  { key: 'amount', label: 'Monto (moneda base)', resolve: (p, i) => {
      const base = state.defaultCurrency || 'ARS';
      const rate = Number(state.exchangeRate) || 1200;
      const converted = convertAt(i.amount, i.currency, base, rate);
      return fmtAmount(converted, base);
    } },
  { key: 'amountOriginal', label: 'Monto original', resolve: (p, i) => fmtAmount(i.amount, i.currency) },
  { key: 'amountARS',  label: 'Monto en ARS hoy', resolve: (p, i) => {
      if (i.currency === 'ARS') return fmtAmount(i.amount, 'ARS');
      const rate = Number(state.exchangeRate) || 1200;
      return fmtAmount(Number(i.amount) * rate, 'ARS');
    } },
  { key: 'amountUSD',  label: 'Monto en USD hoy', resolve: (p, i) => {
      if (i.currency === 'USD') return fmtAmount(i.amount, 'USD');
      const rate = Number(state.exchangeRate) || 1200;
      return fmtAmount(Number(i.amount) / rate, 'USD');
    } },
  { key: 'rate',    label: 'Cotización USD',  resolve: () => '$' + (Number(state.exchangeRate)||1200).toLocaleString('es-AR') },
  { key: 'date',    label: 'Fecha hoy',       resolve: () => new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'long', year:'numeric' }) },
];

function buildPaymentMessage(income) {
  const p = getProject(income.projectId);
  if (!p) return '';
  let msg = state.paymentMessageTemplate || '';
  PAYMENT_VARS.forEach(v => {
    // Función como reemplazo: evita interpretar $ como backreference
    msg = msg.replace(new RegExp(`\\{${v.key}\\}`, 'g'), () => String(v.resolve(p, income) ?? ''));
  });
  return msg;
}

function sendPaymentReminder(income) {
  const p = getProject(income.projectId);
  if (!p) return;
  if (!p.contactPhone) {
    alert('Este proyecto no tiene WhatsApp del cliente cargado. Editá el proyecto para agregarlo.');
    return;
  }
  openPaymentMessageModal(income);
}

let _currentPaymentIncome = null;

function openPaymentMessageModal(income) {
  _currentPaymentIncome = income;
  const p = getProject(income.projectId);
  const phone = (p.contactPhone || '').replace(/[^\d]/g, '');
  const msg = buildPaymentMessage(income);
  const itemCurrency = income.currency || 'ARS';
  const base = state.defaultCurrency || 'ARS';
  const rate = Number(state.exchangeRate) || 1200;
  const showCurrencyWarning = itemCurrency === 'ARS' && Number(income.amount) > 0 && Number(income.amount) <= 200;

  openModal(`
    <div class="p-6">
      <div class="flex items-center gap-2 mb-1">
        <span class="w-8 h-8 rounded-lg bg-green-600 text-white flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
        </span>
        <h2 class="text-xl font-semibold">Recordatorio de pago</h2>
      </div>
      <p class="text-sm text-gray-500 mb-3">
        Para <b>${escapeHtml(p.contactName || p.name)}</b>
        · ${escapeHtml(p.contactPhone)}
      </p>

      <div class="bg-gray-50 rounded-lg p-3 mb-4 flex items-center justify-between text-sm">
        <div>
          <div class="text-xs text-gray-500">Mensualidad original</div>
          <div class="font-semibold">${fmtAmount(income.amount, itemCurrency)} <span class="text-xs text-gray-500 font-normal">${itemCurrency}</span></div>
        </div>
        ${itemCurrency !== base ? `
          <div class="text-right">
            <div class="text-xs text-gray-500">Al cambio actual</div>
            <div class="font-semibold">${fmtAmount(convertAt(income.amount, itemCurrency, base, rate), base)} <span class="text-xs text-gray-500 font-normal">${base}</span></div>
          </div>
        ` : ''}
        <button onclick="closeModal(); openProjectModal('${p.id}')" class="ml-2 text-xs text-blue-600 hover:underline whitespace-nowrap">Cambiar</button>
      </div>

      ${showCurrencyWarning ? `
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-900">
          <b>¿Está bien la moneda?</b> El monto es ${fmtAmount(income.amount, itemCurrency)} en <b>${itemCurrency}</b>. Si en realidad cobrás <b>US$${income.amount}</b>, editá el proyecto y cambiá la moneda a USD.
          <button onclick="closeModal(); openProjectModal('${p.id}')" class="block mt-2 text-blue-700 underline">Editar proyecto →</button>
        </div>
      ` : ''}

      <label class="text-xs text-gray-500 font-semibold">Mensaje</label>
      <textarea id="paymentMsgText" class="input mt-1" rows="10" style="white-space:pre-wrap">${escapeHtml(msg)}</textarea>
      <p class="text-[11px] text-gray-500 mt-1">Editá lo que necesites antes de enviar. El mensaje se abrirá en WhatsApp para que vos lo mandes.</p>

      <div class="flex items-center gap-2 mt-3 text-xs text-gray-500">
        <button type="button" onclick="resetPaymentMsg()" class="text-blue-600 hover:underline">↺ Restaurar desde plantilla</button>
        <span>·</span>
        <button type="button" onclick="closeModal(); go('team')" class="text-blue-600 hover:underline">✎ Editar plantilla para próximas</button>
      </div>

      <div class="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
        <button onclick="closeModal()" class="btn-ghost">Cancelar</button>
        <button onclick="copyPaymentMsg()" class="btn-ghost" title="Copiar al portapapeles">📋 Copiar</button>
        <button onclick="sendPaymentNow('${phone}')" class="btn-primary" style="background:#16a34a">Enviar por WhatsApp</button>
      </div>
    </div>
  `);
}

function resetPaymentMsg() {
  if (!_currentPaymentIncome) return;
  const msg = buildPaymentMessage(_currentPaymentIncome);
  document.getElementById('paymentMsgText').value = msg;
  showToast('Mensaje restaurado', 'info', 1500);
}

function copyPaymentMsg() {
  const text = document.getElementById('paymentMsgText').value;
  navigator.clipboard.writeText(text).then(() => {
    showToast('✓ Copiado al portapapeles', 'success', 2000);
  });
}

function sendPaymentNow(phone) {
  const text = document.getElementById('paymentMsgText').value;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  closeModal();
}

