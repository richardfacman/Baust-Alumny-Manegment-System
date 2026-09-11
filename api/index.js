const app = require('../backend/server');

module.exports = (req, res) => {
  const originalPath = req.query && req.query.path;
  if (originalPath) {
    const query = new URLSearchParams(req.query);
    query.delete('path');
    const queryString = query.toString();
    req.url = `/api${originalPath}${queryString ? `?${queryString}` : ''}`;
  }

  return app(req, res);
};