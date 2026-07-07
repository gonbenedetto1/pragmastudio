// ============ CONSTANTS ============
const STATUS = {
  PENDING:     { label: 'Pendiente',   color: 'bg-gray-200 text-gray-700' },
  IN_PROGRESS: { label: 'En progreso', color: 'bg-blue-100 text-blue-700' },
  IN_REVIEW:   { label: 'En revisión', color: 'bg-amber-100 text-amber-800' },
  COMPLETED:   { label: 'Completada',  color: 'bg-green-100 text-green-700' },
  BLOCKED:     { label: 'Bloqueada',   color: 'bg-red-100 text-red-700' },
};
const STATUS_ORDER = ['PENDING','IN_PROGRESS','IN_REVIEW','BLOCKED','COMPLETED'];
const PRIORITY = {
  LOW:    { label: 'Baja',   color: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: 'Media',  color: 'bg-blue-50 text-blue-700' },
  HIGH:   { label: 'Alta',   color: 'bg-orange-100 text-orange-700' },
  URGENT: { label: 'Urgente',color: 'bg-red-100 text-red-700' },
};
const EXPENSE_CAT = {
  FIXED:      'Fijo',
  VARIABLE:   'Variable',
  INVESTMENT: 'Inversión',
};
const PROJECT_STATUS = {
  LEAD:             { label: 'Lead',              color: 'bg-gray-100 text-gray-700' },
  POSSIBLE:         { label: 'Posible',           color: 'bg-blue-50 text-blue-700' },
  IN_DEVELOPMENT:   { label: 'En desarrollo',     color: 'bg-amber-100 text-amber-800' },
  ACTIVE_RECURRING: { label: 'Activo mensualidad',color: 'bg-green-100 text-green-700' },
  PAUSED:           { label: 'Pausado',           color: 'bg-yellow-100 text-yellow-700' },
  DONE:             { label: 'Terminado',         color: 'bg-purple-100 text-purple-700' },
  ARCHIVED:         { label: 'Archivado',         color: 'bg-gray-50 text-gray-500' },
};
const PROJECT_STATUS_ORDER = ['LEAD','POSSIBLE','IN_DEVELOPMENT','ACTIVE_RECURRING','PAUSED','DONE','ARCHIVED'];

