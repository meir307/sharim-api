const CRUD = require('../../dal/CRUD');
const dbConfig = require('../../config/db');
const SqlParams = require('../../dal/SqlParams');
const commonService = require('../common/commonService');
const bcrypt = require('bcrypt');
const RegistrationMail = require('../mail/Registration/RegistrationMail');
const PasswordResetMail = require('../mail/PasswordReset/PasswordResetMail');
const RegistrationCommitteeMemberMail = require('../mail/RegistrationCommitteeMember/RegistrationCommitteeMemberMail');
const { randomSixDigitString } = require('../../utils/helpers');

function parseJsonColumn(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'object' && !Buffer.isBuffer(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
}

class User {

  isSuccess;
  id = null
  fullName = ''
  phone = ''
  email = ''
  password = ''
  role = ''
  categories = ''
  artists = ''
  playLists = null
  feedbackQuestions = null
  emitCode = ''
  adminType = null
  activationCode = ''
  resetCode = ''
  isActive = 0
  factoryName = ''

  constructor(user) {

    this.fullName = user.fullName;
    this.phone = user.phone;
    this.email = user.email;
    this.password = user.password;
    this.isSuccess = false;
    this.crud = new CRUD(dbConfig.connectionString);
    this.clientType = user.clientType;
    this.role = user.role;
    this.categories = user.categories;
    this.artists = user.artists;
    this.playLists = user.playLists !== undefined ? user.playLists : null;
    this.feedbackQuestions =
      user.feedbackQuestions !== undefined ? user.feedbackQuestions : null;
    this.emitCode = user.emitCode != null ? String(user.emitCode) : '';
    this.adminType = user.adminType || null;
    this.id = user.id;
    this.factoryName = user.factoryName || '';
  }

  // Static method to create User from sessionId
  static async fromSessionId(sessionId) {
    const user = new User({
      fullName: '',
      phone: '',
      email: '',
      password: '',
      clientType: 'web',
      role: ''
    });
    
    user.sessionId = sessionId;
    await user.loadUserBySessionId();
    return user;
  }

  // Method to load user data by sessionId
  async loadUserBySessionId() {
    try {
      const query = `
        SELECT u.*, ul.clientType 
        FROM users u 
        INNER JOIN users_login ul ON u.id = ul.userId 
        WHERE ul.sessionId = ?
      `;
      const params = [
        new SqlParams('sessionId', this.sessionId)
      ];

      const result = await this.crud.executeQueryWithParams(query, params);
      
      if (result.length > 0) {
        const userData = result[0];
        this.id = userData.id;
        this.fullName = userData.fullName;
        this.phone = userData.phone;
        this.email = userData.email;
        this.role = userData.role;
        this.categories = userData.categories;
        this.artists = userData.artists;
        this.playLists = parseJsonColumn(userData.playLists);
        this.feedbackQuestions = parseJsonColumn(userData.feedbackQuestions);
        this.emitCode = userData.emitCode != null ? String(userData.emitCode) : '';
        this.adminType = userData.adminType || null;
        this.clientType = userData.clientType;
        this.createdAt = userData.createdAt;
        this.isActive = userData.isActive || 0;
        this.isSuccess = true;
        return true;
      } else {
        this.isSuccess = false;
        this.message = 'הסשן לא נמצא או שפג תוקפו';
        return false;
      }
    } catch (error) {
      console.error('Error loading user by sessionId:', error);
      this.isSuccess = false;
      this.message = 'שגיאה בטעינת פרטי הסשן';
      return false;
    }
  }


  async login() {
    if (await this.checkCredentials()) {
      if (await this.existsInUsersLogin()) {
        await this.updateUsersLogin();
      }
      else {
        await this.insertUsersLogin();
      }
      this.isSuccess = true;
    }
    else {
      this.isSuccess = false;
      this.message = 'שם משתמש או סיסמה שגויים';
    }
  }

  async insertUsersLogin() {
    this.sessionId = commonService.generateGUID();
    const query = 'INSERT INTO users_login (userId, clientType, sessionId,dtLogedIn) VALUES (?, ?, ?, ?)';
    const params = [  
      new SqlParams('userId', this.id),
      new SqlParams('clientType',  this.clientType), 
      new SqlParams('sessionId',  this.sessionId),
      new SqlParams('dtLogedIn', commonService.formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'))
    ];

    await this.crud.executeNonQueryWithParams(query, params);
  }

  async updateUsersLogin() {

    this.sessionId = commonService.generateGUID();
    const query = 'UPDATE users_login SET sessionId = ?, dtLogedIn = ? WHERE userId = ? AND clientType = ?';
    const params = [
      new SqlParams('sessionId',  this.sessionId),
      new SqlParams('dtLogedIn', commonService.formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')),
      new SqlParams('userId', this.id),
      new SqlParams('clientType', this.clientType)
    ];

    await this.crud.executeNonQueryWithParams(query, params);

  }



  async existsInUsersLogin() {
    const query = 'SELECT * FROM users_login WHERE userId = ? AND clientType = ?';
    const params = [
      new SqlParams('userId', this.id),
      new SqlParams('clientType', this.clientType)
    ];

    const result = await this.crud.executeQueryWithParams(query, params);
    if (result.length > 0) {
      return true;
    }
    else {
      return false;
    }
  }

  async checkCredentials() {
    const query = 'SELECT * FROM users WHERE email = ?';
    const params = [
      new SqlParams('email', this.email)
    ];

    const result = await this.crud.executeQueryWithParams(query, params);
    if (result.length > 0) {
      const userData = result[0];
      
      // Compare password using bcrypt
      const passwordMatch = await bcrypt.compare(this.password, userData.password);
      
      if (!passwordMatch) {
        this.isSuccess = false;
        return false;
      }
      
      // Assign the result object properties to the current user object
      this.id = userData.id;
      this.fullName = userData.fullName;
      this.phone = userData.phone;
      this.email = userData.email;
      this.createdAt = userData.createdAt;
      this.activationCode = userData.activationCode;
      this.role = userData.role;
      this.categories = userData.categories;
      this.artists = userData.artists;
      this.playLists = parseJsonColumn(userData.playLists);
      this.feedbackQuestions = parseJsonColumn(userData.feedbackQuestions);
      this.emitCode = userData.emitCode != null ? String(userData.emitCode) : '';
      this.adminType = userData.adminType || null;
      this.isActive = userData.isActive || 0;

      // Check if user is active
      if (this.isActive !== 1) {
        this.isSuccess = false;
        this.message = 'החשבון לא הופעל. נא להפעיל את החשבון לפני התחברות';
        return false;
      }

      this.isSuccess = true;
      return true;
    }
    else {
      this.isSuccess = false;
      return false;
    }
  }



  async createUser(baseUrl = null, createBy = '') {
    try {
      // Validate input
      //  if (!this.Validate()) {
      //      throw new Error('Name and email are required');
      //  }

      if (await this.isExists())
      {
        this.message = "משתמש עם פרטים אלה כבר רשום במערכת.";
        return false;
      }

      await this.insert2db()

      this.isSuccess = true;

      // if (createBy == 'register') {
      //   try {
      //     const mail = new RegistrationMail(this, baseUrl);
      //     await mail.send();
      //   } catch (emailError) {
      //     console.error('Failed to send registration email:', emailError);
      //     // Don't fail the operation if email fails
      //   }
      // } 
      return this;

    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  async deleteUser(userId) {

    var query = 'DELETE FROM users_login WHERE userId = ?';
    var params = [
      new SqlParams('id', userId)
    ];
    await this.crud.executeNonQueryWithParams(query, params);

    query = 'DELETE FROM users WHERE id = ?';
    params = [
      new SqlParams('id', userId)
    ];
    await this.crud.executeNonQueryWithParams(query, params);
  }

  async saveCategories(categories) {
    try {
      const payload =
        typeof categories === 'string' ? categories : JSON.stringify(categories);
      const query = 'UPDATE users SET categories = ? WHERE id = ?';
      const params = [
        new SqlParams('categories', payload),
        new SqlParams('id', this.id)
      ];
      await this.crud.executeNonQueryWithParams(query, params);
      this.isSuccess = true;
      this.message = 'קטגוריות נשמרו בהצלחה';
      return true;
    } catch (error) {
      console.error('Error in saveCategories:', error);
      this.message = 'שגיאה בשמירת קטגוריות';
      return false;
    }
  }

  async saveArtists(artists) {
    try {
      const payload =
        typeof artists === 'string' ? artists : JSON.stringify(artists);
      const query = 'UPDATE users SET artists = ? WHERE id = ?';
      const params = [
        new SqlParams('artists', payload),
        new SqlParams('id', this.id)
      ];
      await this.crud.executeNonQueryWithParams(query, params);
      this.isSuccess = true;
      this.message = 'אמנים נשמרו בהצלחה';
      return true;
    } catch (error) {
      console.error('Error in saveArtists:', error);
      this.message = 'שגיאה בשמירת אמנים';
      return false;
    }
  }

  async savePlaylists(playLists) {
    try {
      const payload =
        typeof playLists === 'string' ? playLists : JSON.stringify(playLists);
      const query = 'UPDATE users SET playLists = ? WHERE id = ?';
      const params = [
        new SqlParams('playLists', payload),
        new SqlParams('id', this.id)
      ];
      await this.crud.executeNonQueryWithParams(query, params);
      this.isSuccess = true;
      this.message = 'פלייליסטים נשמרו בהצלחה';
      return true;
    } catch (error) {
      console.error('Error in savePlaylists:', error);
      this.message = 'שגיאה בשמירת פלייליסטים';
      return false;
    }
  }

  async saveFeedbackQuestions(feedbackQuestions) {
    try {
      const payload =
        typeof feedbackQuestions === 'string'
          ? feedbackQuestions
          : JSON.stringify(feedbackQuestions);
      const query = 'UPDATE users SET feedbackQuestions = ? WHERE id = ?';
      const params = [
        new SqlParams('feedbackQuestions', payload),
        new SqlParams('id', this.id)
      ];
      await this.crud.executeNonQueryWithParams(query, params);
      this.isSuccess = true;
      this.message = 'שאלות המשוב נשמרו בהצלחה';
      return true;
    } catch (error) {
      console.error('Error in saveFeedbackQuestions:', error);
      this.message = 'שגיאה בשמירת שאלות המשוב';
      return false;
    }
  }

  async updateUser() {
    try {
      const query = 'UPDATE users SET fullname = ?, email = ?, phone = ? WHERE id = ?';
      const params = [
        new SqlParams('fullname', this.fullName),
        new SqlParams('email', this.email),
        new SqlParams('phone', this.phone),
        new SqlParams('id', this.id)
      ];
      await this.crud.executeNonQueryWithParams(query, params);
      return true;
    } catch (error) {
      console.error('Error in updateUser:', error);
      return false;
    }
  }



  async insert2db() {
    this.activationCode = commonService.generateGUID();
    this.isActive = 1; // skip for now User is inactive until activated
    
    // Hash the password before storing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(this.password, saltRounds);
    this.emitCode = randomSixDigitString();

    const query =
      'INSERT INTO users (fullname, email, phone, password, createdAt, role, activationCode, isActive, playLists, emitCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const params = [
      new SqlParams('fullname', this.fullName),
      new SqlParams('email', this.email),
      new SqlParams('phone', this.phone),
      new SqlParams('password', hashedPassword),
      new SqlParams('createdAt', commonService.formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')),
      new SqlParams('role', this.role),
      new SqlParams('activationCode', this.activationCode),
      new SqlParams('isActive', this.isActive),
      new SqlParams('playLists', null),
      new SqlParams('emitCode', this.emitCode),
    ];

    await this.crud.executeNonQueryWithParams(query, params);
    this.id = this.crud.lastInsertedId;
  }

  async isExists() {

    try {
      const query = 'SELECT * FROM users WHERE (phone = ? or email= ?) and isActive = 1';
      const params = [
        new SqlParams('phone', this.phone),
        new SqlParams('email', this.email)
      ];

      const existingUser = await this.crud.executeQueryWithParams(query, params);
      if (existingUser.length > 0) {
        this.message = "משתמש עם פרטים אלה כבר רשום במערכת.";
        return true;
      }
     
      return false;

    } catch (error) {
      console.error('Error in isExists:', error);
      return false;
    }

  }

  async activateUser(activationCode) {
    try {
      

      // Find user by activation code
      const query = 'SELECT * FROM users WHERE activationCode = ?';
      const params = [
        new SqlParams('activationCode', activationCode)
      ];

      const users = await this.crud.executeQueryWithParams(query, params);
      
      if (users.length === 0) {
        this.message = 'קוד הפעלה לא תקין';
        return false;
      }

      const user = users[0];

      // Check if already activated
      if (user.isActive === 1) {
        this.message = 'המשתמש כבר הופעל';
        return false;
      }

      // Activate user by setting isActive = 1 and clearing activation code
      const updateQuery = 'UPDATE users SET isActive = 1, activationCode = NULL WHERE id = ?';
      const updateParams = [
        new SqlParams('id', user.id)
      ];

      await this.crud.executeNonQueryWithParams(updateQuery, updateParams);
      
      this.isSuccess = true;
      this.message = 'המשתמש הופעל בהצלחה';
      return true;

    } catch (error) {
      console.error('Error in activateUser:', error);
      this.message = 'תקלה בהפעלת המשתמש';
      return false;
    }
  }

  async activateTrustee(activationCode, password) {
    try {
      if (!activationCode || !password) {
        this.message = 'קוד הפעלה וסיסמה נדרשים';
        return false;
      }

      if (password.length < 6) {
        this.message = 'סיסמה חייבת להכיל לפחות 6 תווים';
        return false;
      }

      // Find user by activation code
      const query = 'SELECT * FROM users WHERE activationCode = ?';
      const params = [
        new SqlParams('activationCode', activationCode)
      ];

      const users = await this.crud.executeQueryWithParams(query, params);
      
      if (users.length === 0) {
        this.message = 'קוד הפעלה לא תקין';
        return false;
      }

      const user = users[0];

      // Check if already activated
      if (user.isActive === 1) {
        this.message = 'המשתמש כבר הופעל';
        return false;
      }

      // Hash the password before storing
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Activate user, set password, and clear activation code
      const updateQuery = 'UPDATE users SET isActive = ?, password = ?, activationCode = NULL WHERE id = ?';
      const updateParams = [
        new SqlParams('isActive', 1),
        new SqlParams('password', hashedPassword),
        new SqlParams('id', user.id)
      ];

      await this.crud.executeNonQueryWithParams(updateQuery, updateParams);
      
      this.isSuccess = true;
      this.message = 'המשתמש הופעל והסיסמה נקבעה בהצלחה';
      return true;

    } catch (error) {
      console.error('Error in activateTrustee:', error);
      this.message = 'תקלה בהפעלת המשתמש';
      return false;
    }
  }

  async forgotPassword(email, baseUrl = null) {
    try {
      if (!email) {
        this.message = 'כתובת אימייל נדרשת';
        return false;
      }

      // Find user by email
      const query = 'SELECT * FROM users WHERE email = ?';
      const params = [
        new SqlParams('email', email)
      ];

      const users = await this.crud.executeQueryWithParams(query, params);
      
      if (users.length === 0) {
        // Don't reveal if email exists or not (security best practice)
        this.message = 'אם המייל קיים במערכת, נשלח קישור לאיפוס סיסמה';
        this.isSuccess = true; // Return success even if user doesn't exist
        return true;
      }

      const user = users[0];

      // Check if user is activated
      if (user.isActive !== 1) {
        this.message = 'יש להפעיל את החשבון לפני איפוס סיסמה';
        return false;
      }

      // Generate reset code
      const resetCode = commonService.generateGUID();
      const resetCodeExpiry = new Date();
      resetCodeExpiry.setHours(resetCodeExpiry.getHours() + 24); // Valid for 24 hours

      // Update user with reset code
      const updateQuery = 'UPDATE users SET resetCode = ?, resetCodeExpiry = ? WHERE id = ?';
      const updateParams = [
        new SqlParams('resetCode', resetCode),
        new SqlParams('resetCodeExpiry', commonService.formatDate(resetCodeExpiry, 'YYYY-MM-DD HH:mm:ss')),
        new SqlParams('id', user.id)
      ];

      await this.crud.executeNonQueryWithParams(updateQuery, updateParams);

      // Load user data for email
      this.id = user.id;
      this.fullName = user.fullName;
      this.email = user.email;
      this.resetCode = resetCode;

      // Send password reset email
      try {
        const mail = new PasswordResetMail(this, baseUrl);
        await mail.send();
        console.log('Password reset email sent successfully');
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't fail the operation if email fails
      }

      this.isSuccess = true;
      this.message = 'אם המייל קיים במערכת, נשלח קישור לאיפוס סיסמה';
      return true;

    } catch (error) {
      console.error('Error in forgotPassword:', error);
      this.message = 'תקלה בשליחת קישור איפוס סיסמה';
      return false;
    }
  }

  async resetPassword(resetCode, newPassword) {
    try {
      if (!resetCode || !newPassword) {
        this.message = 'קוד איפוס וסיסמה חדשה נדרשים';
        return false;
      }

      if (newPassword.length < 6) {
        this.message = 'סיסמה חייבת להכיל לפחות 6 תווים';
        return false;
      }

      // Find user by reset code
      const query = 'SELECT * FROM users WHERE resetCode = ?';
      const params = [
        new SqlParams('resetCode', resetCode)
      ];

      const users = await this.crud.executeQueryWithParams(query, params);
      
      if (users.length === 0) {
        this.message = 'קוד איפוס לא תקין';
        return false;
      }

      const user = users[0];

      // Check if reset code is expired
      if (user.resetCodeExpiry) {
        const expiryDate = new Date(user.resetCodeExpiry);
        const now = new Date();
        if (now > expiryDate) {
          this.message = 'קוד איפוס פג תוקף. נא לבקש קוד חדש';
          return false;
        }
      }

      // Check if user is activated
      if (user.isActive !== 1) {
        this.message = 'יש להפעיל את החשבון לפני איפוס סיסמה';
        return false;
      }

      // Hash new password before storing
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password and clear reset code
      const updateQuery = 'UPDATE users SET password = ?, resetCode = NULL, resetCodeExpiry = NULL WHERE id = ?';
      const updateParams = [
        new SqlParams('password', hashedPassword),
        new SqlParams('id', user.id)
      ];

      await this.crud.executeNonQueryWithParams(updateQuery, updateParams);
      
      this.isSuccess = true;
      this.message = 'סיסמה עודכנה בהצלחה';
      return true;

    } catch (error) {
      console.error('Error in resetPassword:', error);
      this.message = 'תקלה באיפוס הסיסמה';
      return false;
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      
      if (currentPassword === newPassword) {
        this.message = 'הסיסמה החדשה חייבת להיות שונה מהסיסמה הנוכחית';
        return false;
      }

      // Find user by ID
      const query = 'SELECT * FROM users WHERE id = ?';
      const params = [
        new SqlParams('id', userId)
      ];

      const users = await this.crud.executeQueryWithParams(query, params);
      
      if (users.length === 0) {
        this.message = 'משתמש לא נמצא';
        return false;
      }

      const user = users[0];

      // Verify current password using bcrypt
      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatch) {
        this.message = 'סיסמה נוכחית שגויה';
        return false;
      }

      // Hash new password before storing
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
      const updateParams = [
        new SqlParams('password', hashedPassword),
        new SqlParams('id', userId)
      ];

      await this.crud.executeNonQueryWithParams(updateQuery, updateParams);
      
      this.isSuccess = true;
      this.message = 'סיסמה עודכנה בהצלחה';
      return true;

    } catch (error) {
      console.error('Error in changePassword:', error);
      this.message = 'תקלה בעדכון הסיסמה';
      return false;
    }
  }

  getSafeUser() {
    return {
      id: this.id,
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      createdAt: this.createdAt,
      sessionId: this.sessionId,
      role: this.role,
      categories: this.categories,
      artists: this.artists,
      playLists: this.playLists,
      feedbackQuestions: this.feedbackQuestions,
      emitCode: this.emitCode,
      AdminType: this.adminType,
      isAuthenticated: true,
      isActive: this.isActive

    };
  }

}

module.exports = User; 
