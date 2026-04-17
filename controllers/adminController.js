const BaseController = require('./baseControler');
const userService = require('../services/user/userService');
const AdminSystem = require('../services/admin/AdminSystem');
const User = require('../services/user/User');
const SqlParams = require('../dal/SqlParams');

class AdminController extends BaseController {
  async getUsers(req, res) {
    try {
      const u = await this.validateSession(req, res);
      if (!u) return;

      const { searchQuery } = req.body || {};
      
      const users = await userService.getUsers(searchQuery);

      return res.status(200).json({ 
        message: 'Users retrieved successfully', 
        users: users 
      });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async loginAsUser(req, res) {
    try {
      // Validate admin session
      const admin = await this.validateSession(req, res);
      if (!admin) return;

      const { userId } = req.body || {};
      
      // Use AdminSystem service to handle login as user
      const adminSystem = new AdminSystem();
      const targetUser = await adminSystem.loginAsUser(userId, admin);

      if (!targetUser || !adminSystem.isSuccess) {
        const statusCode = !targetUser ? 404 : 403;
        return res.status(statusCode).json({ 
          message: adminSystem.message || 'Error logging in as user' 
        });
      }

      // Return same format as login (includes sessionId from users_login)
      return res.status(200).json({ 
        message: adminSystem.message || 'Login successful!', 
        user: targetUser.getSafeUser() 
      });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async updateUser(req, res) {
    try {
      // Validate admin session
      const admin = await this.validateSession(req, res);
      if (!admin) return;

      // Optionally validate admin privileges
      const adminSystem = new AdminSystem();
      if (!adminSystem.isAdmin(admin)) {
        return res.status(403).json({ 
          message: 'Access denied: Admin privileges required' 
        });
      }
      
      await adminSystem.updateUser(req.body);
      
      // Create User instance with updated data for response
      const updatedUser = new User({
        id: req.body.id,
        fullName: req.body.fullName,
        email: req.body.email,
        phone: req.body.phone,
        role: req.body.role,
        adminType: req.body.adminType,
        clientType: 'web'
      });
      
      updatedUser.isActive = req.body.isActive;
      
      return res.status(200).json({ 
        message: 'משתמש עודכן בהצלחה', 
        user: updatedUser.getSafeUser() 
      });

    } catch (err) {
      this.handleError(res, err);
    }
  }
}

module.exports = new AdminController();

