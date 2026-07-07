// ============ KEYBOARD ============
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'n') { e.preventDefault(); openTaskModal(); }
  if (e.key === 'Escape') closeModal();
});

