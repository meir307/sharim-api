const BaseController = require('./baseControler');
//const userService = require('../services/user/userService');
const User = require('../services/user/User');


class UserController extends BaseController {
  
  async register(req, res) {
    try {
      //  console.log('Session ID:', req.sessionId);
      const u = new User(req.body);
      const baseUrl = this.getBaseUrl(req);
      await u.createUser(baseUrl, 'register')

      if (u.isSuccess) {
        return res.status(201).json({ message: 'משתמש נרשם בהצלחה', user: u });
      }
      return res.status(500).json({ message: u.message });

      //      const newUser = await userService.createUser(req.body);

    } catch (err) {
      this.handleError(res, err);
    }
  }

  async login(req, res) {
    try {
      const credentials = req.body;
      const u = new User(credentials);
      await u.login();
      //const userFactories = u.getSafeUser();

      if (u.isSuccess) {
        return res.status(200).json({ message: 'התחברות בוצעה בהצלחה', user: u.getSafeUser() });
      }
      return res.status(401).json({ message: u.message || 'פרטי התחברות שגויים' });

    } catch (err) {
      this.handleError(res, err);
    }
  }



  async activate(req, res) {
    try {
      const { code } = req.body || {};
      
      if (!code) {
        return res.status(400).json({ 
          success: false,
          message: 'קוד הפעלה נדרש' 
        });
      }

      const user = new User({});
      const success = await user.activateUser(code);

      if (success) {
        return res.status(200).json({ 
          success: true,
          message: user.message || 'המשתמש הופעל בהצלחה' 
        });
      } else {
        return res.status(400).json({ 
          success: false,
          message: user.message || 'תקלה בהפעלת המשתמש' 
        });
      }

    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message || 'תקלה בהפעלת המשתמש'
      });
    }
  }

  async activateTrustee(req, res) {
    try {
      const { code, password } = req.body || {};
      
      if (!code || !password) {
        return res.status(400).json({ 
          success: false,
          message: 'קוד הפעלה וסיסמה נדרשים' 
        });
      }

      const user = new User({});
      const success = await user.activateTrustee(code, password);

      if (success) {
        return res.status(200).json({ 
          success: true,
          message: user.message || 'המשתמש הופעל והסיסמה נקבעה בהצלחה' 
        });
      } else {
        return res.status(400).json({ 
          success: false,
          message: user.message || 'תקלה בהפעלת המשתמש' 
        });
      }

    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message || 'תקלה בהפעלת המשתמש'
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body || {};
      
      if (!email) {
        return res.status(400).json({ 
          success: false,
          message: 'כתובת אימייל נדרשת' 
        });
      }

      const user = new User({});
      // Use getClientUrl if available, otherwise getBaseUrl
      const baseUrl = this.getClientUrl ? this.getClientUrl(req) : this.getBaseUrl(req);
      const success = await user.forgotPassword(email, baseUrl);

      if (success) {
        return res.status(200).json({ 
          success: true,
          message: user.message || 'אם המייל קיים במערכת, נשלח קישור לאיפוס סיסמה' 
        });
      } else {
        return res.status(400).json({ 
          success: false,
          message: user.message || 'תקלה בשליחת קישור איפוס סיסמה' 
        });
      }

    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message || 'תקלה בשליחת קישור איפוס סיסמה'
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { code, newPassword } = req.body || {};
      
      if (!code || !newPassword) {
        return res.status(400).json({ 
          success: false,
          message: 'קוד איפוס וסיסמה חדשה נדרשים' 
        });
      }

      const user = new User({});
      const success = await user.resetPassword(code, newPassword);

      if (success) {
        return res.status(200).json({ 
          success: true,
          message: user.message || 'סיסמה עודכנה בהצלחה' 
        });
      } else {
        return res.status(400).json({ 
          success: false,
          message: user.message || 'תקלה באיפוס הסיסמה' 
        });
      }

    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message || 'תקלה באיפוס הסיסמה'
      });
    }
  }

  async changePassword(req, res) {
    try {
      if (!req.sessionId) {
        return res.status(401).json({ 
          success: false,
          message: 'לא מחובר' 
        });
      }

      // Create user from sessionId
      const u = await User.fromSessionId(req.sessionId);
      if (!u.isSuccess) {
        return res.status(401).json({ 
          success: false,
          message: u.message || 'סשן לא תקין' 
        });
      }

      const { currentPassword, newPassword } = req.body || {};
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          success: false,
          message: 'סיסמה נוכחית וסיסמה חדשה נדרשות' 
        });
      }

      const user = new User({});
      const success = await user.changePassword(u.id, currentPassword, newPassword);

      if (success) {
        return res.status(200).json({ 
          success: true,
          message: user.message || 'סיסמה עודכנה בהצלחה' 
        });
      } else {
        return res.status(400).json({ 
          success: false,
          message: user.message || 'תקלה בעדכון הסיסמה' 
        });
      }

    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message || 'תקלה בעדכון הסיסמה'
      });
    }
  }

  async updateProfile(req, res) {
    try {
      if (!req.sessionId) {
        return res.status(401).json({ message: 'לא מחובר' });
      }

      // Create user from sessionId
      const u = await User.fromSessionId(req.sessionId);
      if (!u.isSuccess) {
        return res.status(401).json({ message: u.message || 'סשן לא תקין' });
      }

      // Get profile data from request body
      const { fullName, email, phone } = req.body || {};
      
      // Create user instance with update data
      const user = new User({
        id: u.id,
        fullName: fullName || u.fullName,
        email: email || u.email,
        phone: phone || u.phone,
        password: '', // Don't update password here
        role: u.role,
        clientType: u.clientType
      });

      // Update user in database
      const success = await user.updateUser();
      if (!success) {
        return res.status(500).json({ message: 'תקלה בעדכון הפרופיל' });
      }

      // Reload user data to get updated values
      user.sessionId = req.sessionId;
      await user.loadUserBySessionId();
      
      return res.status(200).json({ 
        message: 'פרופיל עודכן בהצלחה', 
        user: user.getSafeUser() 
      });

    } catch (err) {
      this.handleError(res, err);
    }
  }

  async saveCategories(req, res) {
    try {
      if (!req.sessionId) {
        return res.status(401).json({ success: false, message: 'לא מחובר' });
      }

      const u = await User.fromSessionId(req.sessionId);
      if (!u.isSuccess) {
        return res.status(401).json({ success: false, message: u.message || 'סשן לא תקין' });
      }

      const { categories } = req.body || {};
      if (categories === undefined || categories === null) {
        return res.status(400).json({ success: false, message: 'קטגוריות נדרשות' });
      }

      const user = new User({ id: u.id });
      const ok = await user.saveCategories(categories);
      if (!ok) {
        return res.status(500).json({ success: false, message: user.message || 'תקלה בשמירת קטגוריות' });
      }

      return res.status(200).json({ success: true, message: 'קטגוריות נשמרו בהצלחה' });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async saveArtists(req, res) {
    try {
      if (!req.sessionId) {
        return res.status(401).json({ success: false, message: 'לא מחובר' });
      }

      const u = await User.fromSessionId(req.sessionId);
      if (!u.isSuccess) {
        return res.status(401).json({ success: false, message: u.message || 'סשן לא תקין' });
      }

      const { artists } = req.body || {};
      if (artists === undefined || artists === null) {
        return res.status(400).json({ success: false, message: 'אמנים נדרשים' });
      }

      const user = new User({ id: u.id });
      const ok = await user.saveArtists(artists);
      if (!ok) {
        return res.status(500).json({ success: false, message: user.message || 'תקלה בשמירת אמנים' });
      }

      return res.status(200).json({ success: true, message: 'אמנים נשמרו בהצלחה' });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async savePlaylists(req, res) {
    try {
      if (!req.sessionId) {
        return res.status(401).json({
          success: false,
          message: 'לא מחובר',
          errorMessage: 'לא מחובר'
        });
      }

      const u = await User.fromSessionId(req.sessionId);
      if (!u.isSuccess) {
        const msg = u.message || 'סשן לא תקין';
        return res.status(401).json({
          success: false,
          message: msg,
          errorMessage: msg
        });
      }

      const { playLists } = req.body || {};
      if (playLists === undefined || playLists === null) {
        const msg = 'פלייליסטים נדרשים';
        return res.status(400).json({
          success: false,
          message: msg,
          errorMessage: msg
        });
      }

      const user = new User({ id: u.id });
      const ok = await user.savePlaylists(playLists);
      if (!ok) {
        const msg = user.message || 'תקלה בשמירת פלייליסטים';
        return res.status(500).json({
          success: false,
          message: msg,
          errorMessage: msg
        });
      }

      return res.status(200).json({ success: true, message: 'פלייליסטים נשמרו בהצלחה' });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async saveFeedbackQuestions(req, res) {
    try {
      if (!req.sessionId) {
        return res.status(401).json({
          success: false,
          message: 'לא מחובר',
          errorMessage: 'לא מחובר'
        });
      }

      const u = await User.fromSessionId(req.sessionId);
      if (!u.isSuccess) {
        const msg = u.message || 'סשן לא תקין';
        return res.status(401).json({
          success: false,
          message: msg,
          errorMessage: msg
        });
      }

      const body = req.body || {};
      const feedbackQuestions =
        body.FeedbackQuestions !== undefined
          ? body.FeedbackQuestions
          : body.feedbackQuestions;
      if (feedbackQuestions === undefined || feedbackQuestions === null) {
        const msg = 'שאלות משוב נדרשות';
        return res.status(400).json({
          success: false,
          message: msg,
          errorMessage: msg
        });
      }

      const user = new User({ id: u.id });
      const ok = await user.saveFeedbackQuestions(feedbackQuestions);
      if (!ok) {
        const msg = user.message || 'תקלה בשמירת שאלות המשוב';
        return res.status(500).json({
          success: false,
          message: msg,
          errorMessage: msg
        });
      }

      return res.status(200).json({
        success: true,
        message: 'שאלות המשוב נשמרו בהצלחה'
      });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async saveLandingPages(req, res) {
    try {
      if (!req.sessionId) {
        return res.status(401).json({
          success: false,
          message: 'לא מחובר',
          errorMessage: 'לא מחובר'
        });
      }

      const u = await User.fromSessionId(req.sessionId);
      if (!u.isSuccess) {
        const msg = u.message || 'סשן לא תקין';
        return res.status(401).json({
          success: false,
          message: msg,
          errorMessage: msg
        });
      }

      const body = req.body || {};
      const landingPages =
        body.LandingPages !== undefined ? body.LandingPages : body.landingPages;
      if (landingPages === undefined || landingPages === null) {
        const msg = 'דפי נחיתה נדרשים';
        return res.status(400).json({
          success: false,
          message: msg,
          errorMessage: msg
        });
      }

      const user = new User({ id: u.id });
      const ok = await user.saveLandingPages(landingPages);
      if (!ok) {
        const msg = user.message || 'תקלה בשמירת דפי הנחיתה';
        return res.status(500).json({
          success: false,
          message: msg,
          errorMessage: msg
        });
      }

      return res.status(200).json({
        success: true,
        message: 'דפי הנחיתה נשמרו בהצלחה'
      });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async getUserByEmail(req, res) {
    try {
      const u = await this.validateSession(req, res);
      if (!u) return;

      const { email } = req.body || {};
      
      if (!email) {
        return res.status(400).json({ 
          message: 'כתובת אימייל נדרשת' 
        });
      }

      const userService = require('../services/user/userService');
      const user = await userService.getUserByEmail(email);

      if (!user) {
        return res.status(404).json({ 
          message: 'ממונה עם מייל זה לא רשום במערכת' 
        });
      }

      return res.status(200).json({ 
        message: 'המשתמש נטען בהצלחה', 
        user: user
      });
    } catch (err) {
      this.handleError(res, err);
    }
  }

 
}

module.exports = new UserController(); 