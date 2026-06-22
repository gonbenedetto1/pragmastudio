const { createClient } = require('@supabase/supabase-js');
const Afip = require('@afipsdk/afip.js');

// Verifica el JWT de Supabase Auth para que solo usuarios logueados puedan llamar
async function verifyAuth(req) {
  const auth = req.headers?.authorization;
  if (!auth) return { ok: false, error: 'Sin token de autenticación' };
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return { ok: false, error: 'Supabase no está configurado en el servidor' };
  }
  try {
    const sb = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      { auth: { persistSession: false } }
    );
    const { data: { user }, error } = await sb.auth.getUser(token);
    if (error || !user) return { ok: false, error: 'Token inválido o expirado' };
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
  return new Afip({
    CUIT: Number(process.env.AFIP_CUIT),
    cert,
    key,
    production: process.env.AFIP_PRODUCTION === 'true',
    // Vercel: /tmp es escribible y efímero (perfecto para el ticket de acceso de 12h)
    res_folder: '/tmp/afip-res/',
    ta_folder:  '/tmp/afip-ta/',
  });
}

module.exports = { verifyAuth, getAfipClient };
