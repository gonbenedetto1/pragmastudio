function updateInvoiceDocPlaceholder(docType) {
  const inp = document.getElementById('invoiceDocNumber');
  if (!inp) return;
  if (docType === '99') {
    inp.placeholder = '(no requerido)';
    inp.value = '';
  } else if (docType === '80') {
    inp.placeholder = 'CUIT (11 dígitos)';
  } else if (docType === '86') {
    inp.placeholder = 'CUIL (11 dígitos)';
  } else {
    inp.placeholder = 'DNI (7-8 dígitos)';
  }
}


async function checkAfipStatus() {
  try {
    const status = await callApi('/api/afip/estado');
    const lines = [
      `CUIT: ${status.cuit || '—'}`,
      `PV: ${status.ptoVta || '—'}`,
      `Producción: ${status.production ? 'SÍ' : 'no (homologación)'}`,
      `AFIP: ${status.afipConnection === 'ok' ? '✓ conectado' : '✗ ' + (status.afipError || 'error')}`,
      `Último Factura C: ${status.lastFacturaC ?? '—'}`,
    ];
    alert('Estado AFIP\n\n' + lines.join('\n'));
  } catch (err) {
    alert('Error: ' + (err.message || String(err)));
  }
}

