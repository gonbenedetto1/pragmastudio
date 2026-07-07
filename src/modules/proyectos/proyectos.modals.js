function openProjectModal(id) {
  const p = id ? getProject(id) : { id: null, name: '', description: '', color: DEFAULT_PROJECT_COLOR, projectTypes: ['SYSTEM'], status: 'LEAD', startDate: todayISO(), endDate: '', budget: '', monthlyFee: '', monthlyFeeCurrency: state.defaultCurrency || 'ARS', clientId: '', contactName: '', contactEmail: '', contactPhone: '', systemUrl: '' };
  const pColor = p.color || DEFAULT_PROJECT_COLOR;
  const ptypes = getProjectTypes(p);
  openModal(`
    <div class="p-6">
      <h2 class="text-xl font-semibold mb-4">${id ? 'Editar proyecto' : 'Nuevo proyecto'}</h2>
      <form onsubmit="saveProject(event)" class="space-y-3">
        <input type="hidden" name="id" value="${p.id || ''}" />
        <div>
          <label class="text-xs text-gray-500 mb-1 block">Tipo de proyecto <span class="text-gray-400">(podés elegir más de uno)</span></label>
          <div class="grid grid-cols-3 gap-2">
            ${PROJECT_TYPE_ORDER.map(k => {
              const t = PROJECT_TYPE[k];
              const checked = ptypes.includes(k);
              return `
                <label class="cursor-pointer">
                  <input type="checkbox" name="projectTypes" value="${k}" ${checked?'checked':''} class="peer sr-only" />
                  <span class="block p-3 rounded-lg border-2 border-gray-200 peer-checked:border-black peer-checked:bg-gray-50 hover:border-gray-400 transition text-center">
                    <div class="text-sm font-medium">${t.label}</div>
                    <div class="text-[10px] text-gray-500 mt-0.5">${t.hint}</div>
                  </span>
                </label>
              `;
            }).join('')}
          </div>
        </div>
        <div>
          <label class="text-xs text-gray-500">Nombre</label>
          <input name="name" class="input" required autofocus value="${escapeAttr(p.name)}" />
        </div>
        <div>
          <label class="text-xs text-gray-500">Descripción</label>
          <textarea name="description" class="input" rows="2">${escapeHtml(p.description || '')}</textarea>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label class="text-xs text-gray-500">Estado</label>
            <select name="status">
              ${PROJECT_STATUS_ORDER.map(k => `<option value="${k}" ${p.status===k?'selected':''}>${PROJECT_STATUS[k].label}</option>`).join('')}
            </select>
          </div>
          <div class="col-span-2">
            <label class="text-xs text-gray-500">Cliente <span class="text-gray-400">(para facturación)</span></label>
            <div class="flex gap-2">
              <select name="clientId" class="input flex-1">
                <option value="">— Sin cliente —</option>
                ${(state.clients||[]).map(c => `<option value="${c.id}" ${p.clientId===c.id?'selected':''}>${escapeHtml(clientLabel(c))}</option>`).join('')}
              </select>
              <button type="button" class="btn-ghost text-sm whitespace-nowrap" onclick="closeModal(); openClientModal();" title="Crear un cliente nuevo">+ Nuevo</button>
            </div>
          </div>
          <div>
            <label class="text-xs text-gray-500">Contacto</label>
            <input name="contactName" class="input" value="${escapeAttr(p.contactName || '')}" placeholder="Nombre" />
          </div>
          <div>
            <label class="text-xs text-gray-500">WhatsApp</label>
            <input name="contactPhone" class="input" value="${escapeAttr(p.contactPhone || '')}" placeholder="+54 9 11 5555-5555" />
          </div>
          <div class="col-span-2">
            <label class="text-xs text-gray-500">Email contacto</label>
            <input type="email" name="contactEmail" class="input" value="${escapeAttr(p.contactEmail || '')}" />
          </div>
          <div class="col-span-2">
            <label class="text-xs text-gray-500">Link al sistema del cliente</label>
            <input type="url" name="systemUrl" class="input" value="${escapeAttr(p.systemUrl || '')}" placeholder="https://..." />
          </div>
          <div>
            <label class="text-xs text-gray-500">Inicio</label>
            <input type="date" name="startDate" class="input" value="${p.startDate || ''}" />
          </div>
          <div>
            <label class="text-xs text-gray-500">Fin</label>
            <input type="date" name="endDate" class="input" value="${p.endDate || ''}" />
          </div>
          <div>
            <label class="text-xs text-gray-500">Presupuesto total</label>
            <input type="number" name="budget" class="input" value="${p.budget || ''}" />
          </div>
          <div>
            <label class="text-xs text-gray-500">Mensualidad</label>
            <div class="flex gap-2 items-stretch">
              <input type="number" name="monthlyFee" class="input flex-1" value="${p.monthlyFee || ''}" placeholder="0" />
              <div class="flex gap-1 bg-gray-100 rounded-lg p-1">
                <label class="cursor-pointer">
                  <input type="radio" name="monthlyFeeCurrency" value="ARS" ${(p.monthlyFeeCurrency||'ARS')==='ARS'?'checked':''} class="peer sr-only" />
                  <span class="px-3 py-1.5 rounded-md text-sm font-medium block peer-checked:bg-white peer-checked:shadow-sm text-gray-600 peer-checked:text-black transition">ARS</span>
                </label>
                <label class="cursor-pointer">
                  <input type="radio" name="monthlyFeeCurrency" value="USD" ${p.monthlyFeeCurrency==='USD'?'checked':''} class="peer sr-only" />
                  <span class="px-3 py-1.5 rounded-md text-sm font-medium block peer-checked:bg-white peer-checked:shadow-sm text-gray-600 peer-checked:text-black transition">USD</span>
                </label>
              </div>
            </div>
            <p class="text-[11px] text-gray-400 mt-1">⚠ Si cobrás en dólares, elegí USD acá. Si no, los mensajes saldrán mal.</p>
          </div>
          <div class="col-span-2">
            <label class="text-xs text-gray-500 mb-1 block">Color</label>
            <div class="flex gap-2 flex-wrap">
              ${PROJECT_COLORS.map(c => `
                <label class="cursor-pointer" title="${c.name}">
                  <input type="radio" name="color" value="${c.value}" ${pColor===c.value?'checked':''} class="peer sr-only" />
                  <span class="block w-8 h-8 rounded-full transition peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-black hover:scale-110" style="background:${c.value}"></span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-3">
          <button type="button" class="btn-ghost" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="btn-primary">Guardar</button>
        </div>
      </form>
    </div>
  `);
}

function saveProject(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd.entries());
  data.budget     = data.budget     ? Number(data.budget)     : null;
  data.monthlyFee = data.monthlyFee ? Number(data.monthlyFee) : null;
  // Multi-select de tipos
  data.projectTypes = fd.getAll('projectTypes');
  if (data.projectTypes.length === 0) data.projectTypes = ['OTHER'];
  delete data.projectType;  // limpia campo legacy
  if (data.id) {
    Object.assign(getProject(data.id), data);
  } else {
    state.projects.push({ ...data, id: uid() });
  }
  save(); closeModal(); render();
}

function deleteProject(id) {
  const tasks = state.tasks.filter(t => t.projectId === id);
  if (tasks.length > 0 && !confirm(`Este proyecto tiene ${tasks.length} tareas asociadas. ¿Eliminar igual?`)) return;
  if (!confirm('¿Eliminar proyecto?')) return;
  state.projects = state.projects.filter(p => p.id !== id);
  state.tasks    = state.tasks.filter(t => t.projectId !== id);
  save(); closeModal(); render();
}

// ---- Client profile modal ----
function openProjectProfileModal(projectId) {
  const p = getProject(projectId);
  const v = {
    contactName:'', contactRole:'', contactPhone:'', contactPhone2:'',
    contactEmail:'', contactEmail2:'',
    companyName:'', taxId:'', industry:'', website:'',
    address:'', city:'', country:'',
    domain:'', domainProvider:'', domainExpiry:'',
    hostingProvider:'', serverInfo:'', adminUrl:'',
    credentialsLink:'', repoUrl:'', techStack:'', techNotes:'',
    instagram:'', facebook:'', linkedin:'', tiktok:'',
    source:'', firstContactDate:'', commercialNotes:'',
    ...p,
  };

  const fld = (name, label, type='text', value='', placeholder='', wide=false) => `
    <div class="${wide?'col-span-2':''}">
      <label class="text-xs text-gray-500">${label}</label>
      <input type="${type}" name="${name}" class="input" value="${escapeAttr(value||'')}" placeholder="${escapeAttr(placeholder)}" />
    </div>`;
  const txt = (name, label, value='', rows=2) => `
    <div class="col-span-2">
      <label class="text-xs text-gray-500">${label}</label>
      <textarea name="${name}" class="input" rows="${rows}">${escapeHtml(value||'')}</textarea>
    </div>`;
  const sec = (title) => `<h3 class="text-xs uppercase tracking-wider text-gray-500 font-semibold mt-5 mb-2 pb-1 border-b border-gray-100">${title}</h3>`;

  openModal(`
    <div class="p-6">
      <div class="flex items-center gap-2 mb-1">
        <span class="w-3 h-3 rounded-full" style="background:${p?.color || '#9ca3af'}"></span>
        <h2 class="text-xl font-semibold">Perfil del cliente</h2>
      </div>
      <p class="text-sm text-gray-500 mb-4">${escapeHtml(p.name)}</p>

      <form onsubmit="saveProjectProfile(event, '${p.id}')">
        ${sec('Contacto principal')}
        <div class="grid grid-cols-2 gap-3">
          ${fld('contactName',  'Nombre',           'text',  v.contactName)}
          ${fld('contactRole',  'Cargo',            'text',  v.contactRole,  'Ej: CEO, Marketing')}
          ${fld('contactPhone', 'WhatsApp',         'tel',   v.contactPhone, '+54 9 11...')}
          ${fld('contactPhone2','Teléfono fijo',    'tel',   v.contactPhone2)}
          ${fld('contactEmail', 'Email principal',  'email', v.contactEmail)}
          ${fld('contactEmail2','Email secundario', 'email', v.contactEmail2)}
        </div>

        ${sec('Empresa')}
        <div class="grid grid-cols-2 gap-3">
          ${fld('companyName', 'Razón social', 'text', v.companyName)}
          ${fld('taxId',       'CUIT / Tax ID','text', v.taxId)}
          ${fld('industry',    'Industria',    'text', v.industry, 'Ej: Inmobiliario')}
          ${fld('website',     'Sitio web',    'url',  v.website,  'https://...')}
          ${fld('address',     'Dirección',    'text', v.address,  '', true)}
          ${fld('city',        'Ciudad',       'text', v.city)}
          ${fld('country',     'País',         'text', v.country)}
        </div>

        ${sec('Datos técnicos')}
        <div class="grid grid-cols-2 gap-3">
          ${fld('domain',          'Dominio',              'text', v.domain,          'empresa.com')}
          ${fld('domainProvider',  'Proveedor dominio',    'text', v.domainProvider,  'Ej: NIC.ar, GoDaddy')}
          ${fld('domainExpiry',    'Vencimiento dominio',  'date', v.domainExpiry)}
          ${fld('hostingProvider', 'Hosting',              'text', v.hostingProvider, 'Ej: Vercel, AWS')}
          ${fld('serverInfo',      'Server / IP',          'text', v.serverInfo)}
          ${fld('adminUrl',        'Panel admin',          'url',  v.adminUrl,        'https://...')}
          ${fld('credentialsLink', 'Credenciales (link)',  'url',  v.credentialsLink, '1Password, Bitwarden...')}
          ${fld('repoUrl',         'Repositorio',          'url',  v.repoUrl,         'github.com/...')}
          ${fld('techStack',       'Stack tecnológico',    'text', v.techStack,       'Next.js + Supabase', true)}
          ${txt('techNotes',       'Notas técnicas',       v.techNotes, 3)}
        </div>

        ${sec('Redes sociales')}
        <div class="grid grid-cols-2 gap-3">
          ${fld('instagram', 'Instagram', 'text', v.instagram, '@usuario')}
          ${fld('facebook',  'Facebook',  'text', v.facebook,  'facebook.com/...')}
          ${fld('linkedin',  'LinkedIn',  'url',  v.linkedin)}
          ${fld('tiktok',    'TikTok',    'text', v.tiktok,    '@usuario')}
        </div>

        ${sec('Comercial')}
        <div class="grid grid-cols-2 gap-3">
          ${fld('source',           'Cómo llegó',       'text', v.source, 'Referido, web, evento...')}
          ${fld('firstContactDate', 'Primer contacto',  'date', v.firstContactDate)}
          ${txt('commercialNotes',  'Notas comerciales', v.commercialNotes, 3)}
        </div>

        <div class="flex justify-end gap-2 pt-5 mt-4 border-t border-gray-100">
          <button type="button" class="btn-ghost" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="btn-primary">Guardar perfil</button>
        </div>
      </form>
    </div>
  `);
}

function saveProjectProfile(e, projectId) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  Object.assign(getProject(projectId), data);
  save();
  closeModal();
  openProjectDetail(projectId);
}

// ---- Income / Expense modals ----
