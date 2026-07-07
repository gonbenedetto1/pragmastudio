// ============================================================
// AFIP — Facturación Electrónica (Factura C / Monotributo)
// ============================================================

// Tipos de documento del receptor (AFIP). Reusado en el modal de cliente
// y en el modal de emisión de factura.
const CLIENT_DOC_TYPES = [
  { v: '99', label: 'Consumidor Final' },
  { v: '80', label: 'CUIT' },
  { v: '86', label: 'CUIL' },
  { v: '96', label: 'DNI' },
];
const DOC_TYPE_LABELS = CLIENT_DOC_TYPES.reduce((m, d) => (m[d.v] = d.label, m), {});
// Condición frente al IVA del receptor. Códigos oficiales AFIP (FEParamGetCondicionIvaReceptor).
// Obligatorio en el comprobante desde RG 5616 (abril 2025), también para Factura C.
const CONDICION_IVA_RECEPTOR = [
  { code: 5, label: 'Consumidor Final' },
  { code: 1, label: 'Responsable Inscripto' },
  { code: 6, label: 'Monotributo' },
  { code: 4, label: 'Exento' },
];
const CONDICION_IVA = CONDICION_IVA_RECEPTOR.map(c => c.label);
const CONDICION_IVA_CODES = CONDICION_IVA_RECEPTOR.reduce((m, c) => (m[c.label] = c.code, m), {});
const CONDICION_IVA_LABELS = CONDICION_IVA_RECEPTOR.reduce((m, c) => (m[c.code] = c.label, m), {});
// Convierte la condición guardada en el cliente (label) al código AFIP; default Consumidor Final (5).
function condicionIVACode(label) { return CONDICION_IVA_CODES[label] || 5; }

function _incomeIdFor(item) {
  if (!item || !item.id) return null;
  return item.auto ? `auto:${item.projectId}:${item.month}` : item.id;
}

// Total cobrado convertido a ARS, usando la cotización CONGELADA de cada pago.
// AFIP factura siempre en pesos, así que tenemos que comparar contra ARS.
function getCollectedInARS(item) {
  const s = getPaymentSummary(item);
  return s.payments.reduce((sum, p) => {
    const amt = p.amount != null ? Number(p.amount) : s.expected;
    const cur = p.currency || item.currency || 'ARS';
    const rate = Number(p.exchangeRate) || Number(state.exchangeRate) || 1200;
    return sum + (cur === 'USD' ? amt * rate : amt);
  }, 0);
}

function getAllInvoicesFor(item) {
  const incomeId = _incomeIdFor(item);
  if (!incomeId) return [];
  return (state.invoices || []).filter(inv => inv.incomeId === incomeId && !inv.voided);
}

function getInvoicedInARS(item) {
  return getAllInvoicesFor(item).reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
}

// Diferencia entre lo cobrado (en ARS) y lo ya facturado.
// Si > 0 → hay saldo para facturar.
function getRemainingToInvoiceARS(item) {
  return Math.max(0, getCollectedInARS(item) - getInvoicedInARS(item));
}

// Mantengo nombres viejos para compat, pero ahora con semántica de "totalmente facturado"
function hasInvoiceFor(item) {
  if (!item || !item.id) return false;
  const invoices = getAllInvoicesFor(item);
  if (invoices.length === 0) return false;
  return getRemainingToInvoiceARS(item) < 0.5; // tolerancia de centavos
}

function getInvoiceFor(item) {
  const invoices = getAllInvoicesFor(item);
  return invoices[0] || null; // primera factura (las demás se muestran agrupadas)
}

// ¿Hay algo para facturar ahora? (cobrado > facturado)
function canEmitInvoice(item) {
  return getRemainingToInvoiceARS(item) > 0.5;
}

