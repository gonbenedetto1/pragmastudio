// ============ BOOT ============
// Mostrar overlay de login por defecto hasta que Supabase confirme sesión
renderLoginOverlay();
renderNav();
render();

// Migración: si todavía tenés la plantilla vieja redundante, pasala a la nueva
(function migratePaymentTemplate() {
  const OLD = 'Hola {name}! 👋\n\nTe paso el recordatorio del pago mensual del proyecto *{project}* correspondiente a {month}.\n\nMonto: {amount} (≈ {amountARS} al cambio de hoy, cotización USD {rate})\n\n¡Gracias!\nPragma Studio';
  const NEW = 'Hola {name}! 👋\n\nTe paso el recordatorio del pago mensual del proyecto *{project}* correspondiente a {month}.\n\nMonto: {amount}\n\n¡Gracias!\nPragma Studio';
  if (state.paymentMessageTemplate === OLD) {
    state.paymentMessageTemplate = NEW;
    save();
  }
})();

// Show pending notifications toast on app load + auto-refresh blue dollar
setTimeout(() => {
  const unread = (state.notifications || []).filter(n => n.forMemberId === currentMemberId && !n.read);
  if (unread.length > 0) {
    const recent = unread[unread.length - 1];
    showToast(`Tenés ${unread.length} notificación${unread.length>1?'es':''} sin leer · ${recent.text}`, 'info', 6000);
  }
  // Auto-fetch blue dollar (silently) if stale
  autoFetchBlueIfStale();
}, 800);

// Init cloud sync (or show setup if not configured)
if (getSupabaseConfig()) {
  initSupabase();
} else if (localStorage.getItem('pragma_cloud_skip')) {
  setSyncStatus('Solo local', '#999');
} else {
  document.getElementById('setupOverlay').classList.remove('hidden');
  setSyncStatus('Sin sincronizar', '#999');
}
