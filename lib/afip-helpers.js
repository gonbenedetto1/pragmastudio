const Afip = require('@afipsdk/afip.js');

// Verifica el JWT de Supabase Auth usando fetch directo a la API REST
// (evita @supabase/supabase-js que requiere WebSocket nativo en Node 22+)
async function verifyAuth(req) {
  const auth = req.headers?.authorization;
  if (!auth) return { ok: false, error: 'Sin token de autenticación' };
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return { ok: false, error: 'Supabase no está configurado en el servidor' };
  }
  try {
    const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: process.env.SUPABASE_SERVICE_KEY,
      },
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return { ok: false, error: `Token inválido o expirado (${res.status}) ${txt}` };
    }
    const user = await res.json();
    if (!user || !user.id) return { ok: false, error: 'Token inválido' };
    return { ok: true, user };
  } catch (e) {
    return { ok: false, error: 'Error verificando auth: ' + e.message };
  }
}

// Inicializa el cliente AFIP con cert/key desde env vars (en base64)
function getAfipClient() {
  const required = ['AFIP_CUIT', 'AFIP_CERT', 'AFIP_KEY', 'AFIP_POINT_OF_SALE'];
  for (const k of required) {
    if (!process.env[k]) throw new Error(`Falta variable de entorno: ${k}`);
  }
  const cert = Buffer.from(process.env.AFIP_CERT, 'base64').toString('utf8');
  const key  = Buffer.from(process.env.AFIP_KEY,  'base64').toString('utf8');
  const config = {
    CUIT: Number(process.env.AFIP_CUIT),
    cert,
    key,
    production: process.env.AFIP_PRODUCTION === 'true',
    // Vercel: /tmp es escribible y efímero (perfecto para el ticket de acceso de 12h)
    res_folder: '/tmp/afip-res/',
    ta_folder:  '/tmp/afip-ta/',
  };
  // afipsdk.com da pocos requests gratis sin token. Si registrás cuenta en app.afipsdk.com
  // podés generar un access_token (gratis) y subirlo a las env vars de Vercel.
  if (process.env.AFIP_SDK_TOKEN) {
    config.access_token = process.env.AFIP_SDK_TOKEN;
  }
  return new Afip(config);
}

module.exports = { verifyAuth, getAfipClient };
