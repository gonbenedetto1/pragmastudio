// ============ PRESUPUESTOS ============
const BUDGET_STATUS = {
  DRAFT:    { label: 'Borrador',  color: 'bg-gray-100 text-gray-700' },
  SENT:     { label: 'Enviado',   color: 'bg-blue-100 text-blue-700' },
  ACCEPTED: { label: 'Aceptado',  color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rechazado', color: 'bg-red-100 text-red-700' },
  EXPIRED:  { label: 'Vencido',   color: 'bg-amber-100 text-amber-700' },
};
const BUDGET_STATUS_ORDER = ['DRAFT','SENT','ACCEPTED','REJECTED','EXPIRED'];

const BUDGET_CATEGORIES = [
  { key: 'ERP',         label: 'Implementación ERP',      defaultPricing: 'IMPL_PLUS_MAINT' },
  { key: 'CRM',         label: 'CRM',                      defaultPricing: 'IMPL_PLUS_MAINT' },
  { key: 'ECOMMERCE',   label: 'Ecommerce',                defaultPricing: 'IMPL_PLUS_MAINT' },
  { key: 'AUTOMATION',  label: 'Automatizaciones',         defaultPricing: 'FIXED' },
  { key: 'INTEGRATION', label: 'Integraciones',            defaultPricing: 'FIXED' },
  { key: 'AI',          label: 'Inteligencia Artificial',  defaultPricing: 'EVOLUTIVE' },
  { key: 'WEB',         label: 'Desarrollo Web',           defaultPricing: 'FIXED' },
  { key: 'MOBILE',      label: 'Desarrollo Mobile',        defaultPricing: 'FIXED' },
  { key: 'CUSTOM',      label: 'Desarrollo a Medida',      defaultPricing: 'EVOLUTIVE' },
  { key: 'CONSULTING',  label: 'Consultoría',              defaultPricing: 'HOUR_BUCKET' },
];

const PRICING_MODELS = [
  { key: 'FIXED',          label: 'Precio fijo',                       minMargin: 40, targetMargin: 52,
    description: 'Cobrás un monto cerrado al firmar. El cliente sabe exactamente cuánto va a pagar. Ideal cuando el alcance está claro y acotado.' },
  { key: 'HOUR_BUCKET',    label: 'Bolsa de horas / T&M',              minMargin: 45, targetMargin: 55,
    description: 'Cliente compra un paquete de horas y se consumen. Para soporte continuo o cuando el alcance va a cambiar.' },
  { key: 'SUBSCRIPTION',   label: 'Suscripción mensual',               minMargin: 55, targetMargin: 70,
    description: 'Solo cobrás mensual recurrente, sin desarrollo inicial. Para SaaS o cuando todo es uso continuo del producto.' },
  { key: 'IMPL_PLUS_MAINT',label: 'Implementación + mantenimiento',    minMargin: 40, targetMargin: 52,
    description: 'Un monto inicial por el desarrollo + mensual por soporte y mejoras. Lo más recomendado para sistemas (ERP/CRM).' },
  { key: 'EVOLUTIVE',      label: 'Desarrollo evolutivo',              minMargin: 45, targetMargin: 55,
    description: 'Cobrás por sprint o iteración sobre un backlog priorizado. Cliente paga por avance. Ideal para productos a largo plazo.' },
];

// Sugerencias de módulos típicos por categoría (clickeables al armar el presupuesto)
const COMMON_MODULES_BY_CATEGORY = {
  ERP: [
    { title: 'Login y gestión de usuarios',  complexity: 'SIMPLE' },
    { title: 'Dashboard con métricas',        complexity: 'MEDIUM' },
    { title: 'ABM de clientes',               complexity: 'SIMPLE' },
    { title: 'ABM de productos',              complexity: 'SIMPLE' },
    { title: 'Módulo de facturación',         complexity: 'COMPLEX' },
    { title: 'Gestión de stock',              complexity: 'MEDIUM' },
    { title: 'Reportes y exportación',        complexity: 'MEDIUM' },
    { title: 'Integración con AFIP',          complexity: 'COMPLEX' },
  ],
  CRM: [
    { title: 'Login y usuarios',              complexity: 'SIMPLE' },
    { title: 'Pipeline de oportunidades',     complexity: 'MEDIUM' },
    { title: 'Gestión de leads',              complexity: 'SIMPLE' },
    { title: 'Email tracking',                complexity: 'COMPLEX' },
    { title: 'Dashboard de ventas',           complexity: 'MEDIUM' },
    { title: 'Integración con WhatsApp',      complexity: 'COMPLEX' },
  ],
  WEB: [
    { title: 'Landing page principal',        complexity: 'SIMPLE' },
    { title: 'Sección "Quiénes somos"',       complexity: 'VERY_SIMPLE' },
    { title: 'Catálogo de productos/servicios',complexity: 'MEDIUM' },
    { title: 'Formulario de contacto',        complexity: 'VERY_SIMPLE' },
    { title: 'Blog / noticias',               complexity: 'SIMPLE' },
    { title: 'SEO básico + Analytics',        complexity: 'SIMPLE' },
  ],
  ECOMMERCE: [
    { title: 'Catálogo con filtros',          complexity: 'MEDIUM' },
    { title: 'Carrito de compras',            complexity: 'MEDIUM' },
    { title: 'Checkout + pasarela de pagos',  complexity: 'COMPLEX' },
    { title: 'Panel administrativo',          complexity: 'COMPLEX' },
    { title: 'Gestión de envíos',             complexity: 'MEDIUM' },
    { title: 'Sincronización con stock',      complexity: 'MEDIUM' },
  ],
  MOBILE: [
    { title: 'Login con autenticación',       complexity: 'MEDIUM' },
    { title: 'Onboarding del usuario',        complexity: 'SIMPLE' },
    { title: 'Pantallas principales',         complexity: 'MEDIUM' },
    { title: 'Notificaciones push',           complexity: 'COMPLEX' },
    { title: 'Publicación en App/Play Store', complexity: 'SIMPLE' },
  ],
  AUTOMATION: [
    { title: 'Workflow de aprobación',        complexity: 'MEDIUM' },
    { title: 'Integración entre apps',        complexity: 'COMPLEX' },
    { title: 'Notificaciones automáticas',    complexity: 'SIMPLE' },
    { title: 'Reportes automáticos',          complexity: 'MEDIUM' },
  ],
  INTEGRATION: [
    { title: 'Integración con AFIP',          complexity: 'COMPLEX' },
    { title: 'Pasarela de pagos',             complexity: 'COMPLEX' },
    { title: 'WhatsApp Business API',         complexity: 'COMPLEX' },
    { title: 'Google Calendar / Sheets',      complexity: 'MEDIUM' },
  ],
  AI: [
    { title: 'Chatbot inteligente',           complexity: 'COMPLEX' },
    { title: 'Análisis de documentos',        complexity: 'COMPLEX' },
    { title: 'Recomendaciones personalizadas',complexity: 'VERY_COMPLEX' },
    { title: 'Generación de contenido',       complexity: 'MEDIUM' },
  ],
  CUSTOM: [
    { title: 'Relevamiento de requerimientos',complexity: 'MEDIUM' },
    { title: 'Arquitectura del sistema',      complexity: 'COMPLEX' },
    { title: 'Desarrollo del core',           complexity: 'VERY_COMPLEX' },
  ],
  CONSULTING: [
    { title: 'Jornada de consultoría',        complexity: 'SIMPLE' },
    { title: 'Auditoría técnica',             complexity: 'MEDIUM' },
    { title: 'Plan de mejora',                complexity: 'MEDIUM' },
  ],
};

function getBudgetCategories(b) {
  if (Array.isArray(b.categories) && b.categories.length) return b.categories;
  if (b.category) return [b.category];
  return ['WEB'];
}

// Matriz recalibrada para velocidad real con IA (Cursor + Claude + Supabase + Vercel)
const COMPLEXITY_LEVELS = [
  { key: 'VERY_SIMPLE',  label: 'Muy simple',   min: 0.5, max: 1,  default: 1,  devSenior: false },
  { key: 'SIMPLE',       label: 'Simple',       min: 1,   max: 3,  default: 2,  devSenior: false },
  { key: 'MEDIUM',       label: 'Media',        min: 3,   max: 8,  default: 5,  devSenior: false },
  { key: 'COMPLEX',      label: 'Compleja',     min: 8,   max: 20, default: 12, devSenior: true  },
  { key: 'VERY_COMPLEX', label: 'Muy compleja', min: 20,  max: 50, default: 30, devSenior: true  },
];

const RISK_FACTORS_LIST = [
  { id: 'INTEGRATION', label: 'Integración con terceros',           min: 0.15, max: 0.30, def: 0.20 },
  { id: 'UNKNOWN_API', label: 'API desconocida / sin documentación',min: 0.20, max: 0.40, def: 0.30 },
  { id: 'LEGACY',      label: 'Sistema legacy',                     min: 0.25, max: 0.50, def: 0.35 },
  { id: 'URGENT',      label: 'Plazo urgente',                      min: 0.20, max: 0.40, def: 0.30 },
  { id: 'UNCLEAR_REQ', label: 'Requerimientos poco definidos',      min: 0.20, max: 0.50, def: 0.30 },
  { id: 'CLIENT_DEP',  label: 'Dependencia del cliente',            min: 0.10, max: 0.25, def: 0.15 },
  { id: 'DATA_MIG',    label: 'Migración de datos',                 min: 0.15, max: 0.35, def: 0.25 },
  { id: 'AI',          label: 'Inteligencia Artificial',            min: 0.30, max: 0.60, def: 0.45 },
];

// Rates re-calibradas: costo muy bajo (tu tiempo + IA tools), sale moderado.
// Margen objetivo 85%+ porque la productividad con IA lo permite.
const ROLE_RATES = {
  FUNCTIONAL: { cost: 3,  sale: 30 },
  UX:         { cost: 3,  sale: 30 },
  DEV_JR:     { cost: 2,  sale: 22 },
  DEV_SSR:    { cost: 4,  sale: 38 },
  DEV_SR:     { cost: 8,  sale: 55 },
  QA:         { cost: 2,  sale: 24 },
  PM:         { cost: 6,  sale: 45 },
  AI:         { cost: 12, sale: 70 },
};

const DISCIPLINE_PCT = {
  functional: 0.25,
  ux:         0.15,
  qa:         0.20,
  training:   0.07,
  docs:       0.07,
  pm:         0.15,
};

// Motor de estimación: dada la spec del presupuesto, calcula horas/costo/precio/margen
function estimateBudget(budget) {
  const cats = getBudgetCategories(budget);
  const items = (budget.items || []).map(item => {
    const complexity = COMPLEXITY_LEVELS.find(c => c.key === item.complexity) || COMPLEXITY_LEVELS[2];
    const hoursDev = Number(item.hoursDev) || complexity.default;

    const hoursFunctional = hoursDev * DISCIPLINE_PCT.functional;
    const hoursUX         = hoursDev * DISCIPLINE_PCT.ux;
    const hoursQA         = hoursDev * DISCIPLINE_PCT.qa;
    const hoursTraining   = hoursDev * DISCIPLINE_PCT.training;
    const hoursDocs       = hoursDev * DISCIPLINE_PCT.docs;
    const techSubtotal    = hoursFunctional + hoursUX + hoursDev + hoursQA + hoursTraining + hoursDocs;
    const hoursPM         = techSubtotal * DISCIPLINE_PCT.pm;
    const itemHours       = techSubtotal + hoursPM;

    const isAI    = cats.includes('AI');
    const devRate = isAI ? ROLE_RATES.AI : (complexity.devSenior ? ROLE_RATES.DEV_SR : ROLE_RATES.DEV_SSR);

    const cost =
      hoursFunctional * ROLE_RATES.FUNCTIONAL.cost +
      hoursUX         * ROLE_RATES.UX.cost +
      hoursDev        * devRate.cost +
      hoursQA         * ROLE_RATES.QA.cost +
      hoursTraining   * ROLE_RATES.FUNCTIONAL.cost +
      hoursDocs       * ROLE_RATES.FUNCTIONAL.cost +
      hoursPM         * ROLE_RATES.PM.cost;

    const revenue =
      hoursFunctional * ROLE_RATES.FUNCTIONAL.sale +
      hoursUX         * ROLE_RATES.UX.sale +
      hoursDev        * devRate.sale +
      hoursQA         * ROLE_RATES.QA.sale +
      hoursTraining   * ROLE_RATES.FUNCTIONAL.sale +
      hoursDocs       * ROLE_RATES.FUNCTIONAL.sale +
      hoursPM         * ROLE_RATES.PM.sale;

    return { ...item, hoursDev, hoursFunctional, hoursUX, hoursQA, hoursTraining, hoursDocs, hoursPM, itemHours, cost, revenue };
  });

  const totalByDiscipline = {
    functional: items.reduce((a,b) => a + b.hoursFunctional, 0),
    ux:         items.reduce((a,b) => a + b.hoursUX, 0),
    dev:        items.reduce((a,b) => a + b.hoursDev, 0),
    qa:         items.reduce((a,b) => a + b.hoursQA, 0),
    training:   items.reduce((a,b) => a + b.hoursTraining, 0),
    docs:       items.reduce((a,b) => a + b.hoursDocs, 0),
    pm:         items.reduce((a,b) => a + b.hoursPM, 0),
  };

  const baseHours   = items.reduce((a,b) => a + b.itemHours, 0);
  const baseCost    = items.reduce((a,b) => a + b.cost, 0);
  const baseRevenue = items.reduce((a,b) => a + b.revenue, 0);

  const activeRisks = budget.riskFactors || [];
  const riskSum = Math.min(1.0, activeRisks.reduce((sum, r) => {
    const factor = RISK_FACTORS_LIST.find(f => f.id === r.id);
    return sum + (Number(r.value) || factor?.def || 0);
  }, 0));

  const contingency = (Number(budget.contingencyPct) || 12) / 100;
  const multiplier  = (1 + riskSum) * (1 + contingency);
  const finalHours   = baseHours   * multiplier;
  const finalCost    = baseCost    * multiplier;
  const finalRevenue = baseRevenue * multiplier;
  const margin = finalRevenue > 0 ? ((finalRevenue - finalCost) / finalRevenue) * 100 : 0;

  const pricingModel = PRICING_MODELS.find(p => p.key === budget.pricingModel) || PRICING_MODELS[0];
  let marginStatus = 'red';
  if (margin >= pricingModel.targetMargin) marginStatus = 'green';
  else if (margin >= pricingModel.minMargin) marginStatus = 'yellow';

  return {
    items, totalByDiscipline,
    baseHours, finalHours, baseCost, finalCost, baseRevenue, finalRevenue,
    margin, marginStatus, riskSum, contingencyPct: contingency * 100,
    minMargin: pricingModel.minMargin, targetMargin: pricingModel.targetMargin, pricingModel,
  };
}

const PROJECT_TYPE = {
  SYSTEM: { label: 'Sistema', hint: 'Mensualidad' },
  WEB:    { label: 'Web',     hint: 'Inicio/fin' },
  OTHER:  { label: 'Otro',    hint: 'Cualquier otro' },
};
const PROJECT_TYPE_ORDER = ['SYSTEM','WEB','OTHER'];

// Paleta de colores standard para proyectos (8 colores)
const PROJECT_COLORS = [
  { value: '#6b7280', name: 'Gris' },
  { value: '#3b82f6', name: 'Azul' },
  { value: '#8b5cf6', name: 'Violeta' },
  { value: '#ec4899', name: 'Rosa' },
  { value: '#10b981', name: 'Verde' },
  { value: '#f59e0b', name: 'Ámbar' },
  { value: '#f97316', name: 'Naranja' },
  { value: '#ef4444', name: 'Rojo' },
];
const DEFAULT_PROJECT_COLOR = '#6b7280';

// Devuelve los tipos del proyecto como array (maneja legacy con projectType string)
function getProjectTypes(p) {
  if (Array.isArray(p.projectTypes) && p.projectTypes.length) return p.projectTypes;
  if (p.projectType) return [p.projectType];
  return ['OTHER'];
}
function projectTypesText(p) {
  return getProjectTypes(p).map(k => (PROJECT_TYPE[k] || PROJECT_TYPE.OTHER).label).join(' · ');
}

