// middleware/sessionId.js
module.exports = (req, res, next) => {
  req.sessionId = req.headers['sessionid'] || req.session?.id || null;
  next();
}; 