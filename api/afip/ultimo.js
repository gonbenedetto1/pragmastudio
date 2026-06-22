const { verifyAuth, getAfipClient } = require('../../lib/afip-helpers');

// GET /api/afip/ultimo?tipo=11
// Devuelve el último número emitido en el PV para el tipo de comprobante dado.
module.exports = async function handler(req, res) {
  const auth = await verifyAuth(req);
  if (!auth.ok) return res.status(401).json({ error: auth.error });

  const cbteTipo = Number(req.query?.tipo) || 11;

  let afip;
  try { afip = getAfipClient(); }
  catch (e) { return res.status(500).json({ error: e.message }); }

  try {
    const ptoVta = Number(process.env.AFIP_POINT_OF_SALE);
    const last = await afip.ElectronicBilling.getLastVoucher(ptoVta, cbteTipo);
    return res.status(200).json({ ptoVta, cbteTipo, lastNumber: last || 0 });
  } catch (err) {
    return res.status(500).json({ error: err?.message || String(err) });
  }
};
