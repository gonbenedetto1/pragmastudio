// ============ EXPORT / IMPORT ============
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `pragma-backup-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
function importData() {
  document.getElementById('fileInput').click();
}
document.getElementById('fileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!confirm('Esto reemplaza todos los datos actuales. ¿Continuar?')) return;
      state = { ...structuredClone(DEFAULT_STATE), ...imported };
      save(); render();
    } catch {
      alert('Archivo inválido.');
    }
  };
  reader.readAsText(file);
});

