module.exports = function internalAuth(req, res, next) {
    const provided = req.headers['x-internal-secret'];
    const expected = process.env.INTERNAL_SERVICE_SECRET || 'wowwraps_internal_secret';
  
    if (!provided || provided !== expected) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    return next();
  };