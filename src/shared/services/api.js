async function getAuthToken() {
  if (!sb) throw new Error('Supabase no disponible');
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.access_token) throw new Error('Sesión expirada — re-loguéate');
  return session.access_token;
}

async function callApi(path, opts = {}) {
  const token = await getAuthToken();
  const res = await fetch(path, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let json;
  try { json = await res.json(); } catch { json = { error: 'Respuesta inválida del servidor' }; }
  if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
  return json;
}

