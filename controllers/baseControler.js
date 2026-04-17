// controllers/baseControler.js
const User = require('../services/user/User');

class BaseController {
  constructor() {
    
  }

  /**
   * Get the base URL from the request
   * @param {Object} req - Express request object
   * @returns {string} Base URL (e.g., 'http://localhost:3000' or 'https://yourdomain.com')
   */
  getBaseUrl(req) {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    return `${protocol}://${host}`;
  }

  /**
   * Validate session and get user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object|null} User object if valid, null if invalid
   */
  async validateSession(req, res) {
    try {
      if (!req.sessionId) {
        res.status(401).json({ message: 'לא מחובר' });
        return null;
      }

      // Create user from sessionId
      const u = await User.fromSessionId(req.sessionId);
      if (!u.isSuccess) {
        res.status(401).json({ message: u.message || 'סשן לא תקין' });
        return null;
      }

      return u;
    } catch (error) {
      res.status(500).json({ message: 'שגיאה באימות הסשן' });
      return null;
    }
  }

  handleError(res, err) {
    res.status(500).json({ error: err.message || 'תקלה לא צפויה בשירות' });
  }
}

module.exports = BaseController;