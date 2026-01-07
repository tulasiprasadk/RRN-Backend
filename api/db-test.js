import { sequelize } from '../../config/database.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await sequelize.authenticate()
    return res.status(200).json({ ok: true })
  } catch (err) {
    // return the error message for diagnostics (do not leak stack in production)
    const message = err && err.message ? err.message : String(err)
    return res.status(500).json({ ok: false, error: message })
  }
}
