const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret')
    req.user = decoded
    return next()
  } catch (error) {
    return res.status(401).json({ error: 'Token không hợp lệ' })
  }
}