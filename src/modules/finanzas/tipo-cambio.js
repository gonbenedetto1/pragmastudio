const DOLAR_SOURCES = [
  { key: 'blue',    label: 'Blue',     desc: 'Mercado paralelo' },
  { key: 'oficial', label: 'Oficial',  desc: 'BCRA' },
  { key: 'mep',     label: 'MEP/Bolsa',desc: 'AL30' },
  { key: 'cripto',  label: 'Cripto',   desc: 'Stablecoin' },
  { key: 'tarjeta', label: 'Tarjeta',  desc: 'Oficial + impuestos' },
];

async function fetchBluelyticsBlue({ silent = false } = {}) {
  try {
    if (!silent) showToast('Buscando dólar blue...', 'info', 1500);
    const res = await fetch('https://api.bluelytics.com.ar/v2/latest');
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const rate = Number(data?.blue?.value_avg);
    if (!rate || isNaN(rate)) throw new Error('No rate');
    state.exchangeRate = Math.round(rate);
    state.exchangeRateSource = 'bluelytics';
    state.exchangeRateUpdatedAt = data.last_update || new Date().toISOString();
    save();
    if (!silent) showToast(`✓ Dólar blue: $${rate.toLocaleString('es-AR')} (Bluelytics)`, 'success', 3500);
    render();
    return rate;
  } catch (err) {
    console.warn('Bluelytics fetch failed:', err);
    if (!silent) alert('No se pudo obtener la cotización del blue. Cargala manual.\n\n' + (err.message || err));
    return null;
  }
}

async function autoFetchBlueIfStale() {
  // Auto-fetch on boot if rate is older than 4h or never set
  const last = state.exchangeRateUpdatedAt ? new Date(state.exchangeRateUpdatedAt).getTime() : 0;
  const ageHours = (Date.now() - last) / 1000 / 3600;
  if (ageHours > 4) {
    await fetchBluelyticsBlue({ silent: true });
  }
}

async function fetchDollarRate(source = 'blue') {
  try {
    showToast('Buscando cotización...', 'info', 1500);
    const res = await fetch(`https://dolarapi.com/v1/dolares/${source}`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const rate = Number(data.venta || data.compra);
    if (!rate || isNaN(rate)) throw new Error('No rate');
    state.exchangeRate = Math.round(rate);
    state.exchangeRateSource = source;
    state.exchangeRateUpdatedAt = data.fechaActualizacion || new Date().toISOString();
    save();
    showToast(`✓ Dólar ${source}: $${rate.toLocaleString('es-AR')}`, 'success', 3500);
    render();
  } catch (err) {
    console.error('fetchDollarRate error:', err);
    alert('No se pudo obtener la cotización. Cargala manual.\n\n' + (err.message || err));
  }
}

function openExchangeRateModal() {
  const updatedLabel = state.exchangeRateUpdatedAt
    ? new Date(state.exchangeRateUpdatedAt).toLocaleString('es-AR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
    : 'nunca';
  let srcLabel = 'Manual';
  if (state.exchangeRateSource === 'bluelytics') srcLabel = 'Blue (Bluelytics)';
  else if (state.exchangeRateSource && state.exchangeRateSource !== 'manual') {
    srcLabel = DOLAR_SOURCES.find(s => s.key === state.exchangeRateSource)?.label || state.exchangeRateSource;
  }

  openModal(`
    <div class="p-6">
      <h2 class="text-xl font-semibold mb-1">Cotización del dólar</h2>
      <p class="text-sm text-gray-500 mb-4">Actualizada: ${updatedLabel} · Fuente: ${srcLabel}</p>

      <div class="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 mb-4">
        <div class="flex items-center justify-between mb-2">
          <div>
            <div class="text-xs uppercase tracking-wider text-blue-700 font-semibold">Dólar Blue automático</div>
            <div class="text-xs text-blue-600 mt-0.5">Bluelytics · usado para todas las conversiones</div>
          </div>
          <button onclick="fetchBluelyticsBlue().then(closeModal)" class="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            Actualizar ahora
          </button>
        </div>
      </div>

      <form onsubmit="saveManualRate(event)" class="space-y-3">
        <div>
          <label class="text-xs text-gray-500">Valor manual (ARS por USD)</label>
          <div class="flex gap-2">
            <input type="number" step="1" name="rate" class="input flex-1 text-lg font-semibold" value="${state.exchangeRate || 1200}" autofocus />
            <button type="submit" class="btn-primary">Guardar</button>
          </div>
        </div>
      </form>

      <details class="mt-5 pt-4 border-t border-gray-100">
        <summary class="text-xs text-gray-500 uppercase tracking-wider font-semibold cursor-pointer hover:text-gray-900">Otras cotizaciones (dolarapi.com)</summary>
        <div class="grid grid-cols-2 gap-2 mt-3">
          ${DOLAR_SOURCES.map(s => `
            <button onclick="fetchDollarRate('${s.key}'); closeModal()" class="text-left p-3 rounded-lg border border-gray-200 hover:border-black hover:bg-gray-50 transition">
              <div class="font-medium text-sm">${s.label}</div>
              <div class="text-xs text-gray-500">${s.desc}</div>
            </button>
          `).join('')}
        </div>
      </details>
    </div>
  `);
}

function saveManualRate(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  const rate = Number(data.rate);
  if (!rate || isNaN(rate)) return alert('Valor inválido');
  state.exchangeRate = rate;
  state.exchangeRateSource = 'manual';
  state.exchangeRateUpdatedAt = new Date().toISOString();
  save();
  closeModal();
  showToast('Cotización actualizada', 'success');
  render();
}

