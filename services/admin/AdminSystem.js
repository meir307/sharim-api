const CRUD = require('../../dal/CRUD');
const dbConfig = require('../../config/db');
const SqlParams = require('../../dal/SqlParams');
const userService = require('../user/userService');
const User = require('../user/User');

class AdminSystem {
  constructor() {
    this.crud = new CRUD(dbConfig.connectionString);
    this.isSuccess = false;
    this.message = '';
  }

  /**
   * Check if user is admin (adminType array contains 1)
   * @param {Object} user - User object with adminType
   * @returns {boolean} - True if user is admin
   */
  isAdmin(user) {
    if (!user || !user.adminType) {
      return false;
    }

    let adminTypeArray = user.adminType;
    
    // Parse adminType if it's a string (JSON like "[1,2]" or comma-separated like "1,2")
    if (typeof adminTypeArray === 'string') {
      try {
        // Try parsing as JSON first (handles "[1,2]" format)
        adminTypeArray = JSON.parse(adminTypeArray);
      } catch (e) {
        // If not JSON, try splitting by comma (handles "1,2" format)
        adminTypeArray = adminTypeArray.split(',').map(item => {
          const trimmed = item.trim();
          // Try to convert to number if possible, otherwise keep as string
          return isNaN(trimmed) ? trimmed : Number(trimmed);
        });
      }
    }
    
    // Check if adminType is an array and contains 1 (as number or string)
    return Array.isArray(adminTypeArray) && (adminTypeArray.includes('1') || adminTypeArray.includes(1));
  }

  /**
   * Login as another user (admin only)
   * @param {string} userId - Target user ID
   * @param {Object} admin - Admin user object
   * @returns {Promise<Object|null>} - User object with sessionId or null if error
   */
  async loginAsUser(userId, admin) {
    try {
      // Validate admin
      if (!this.isAdmin(admin)) {
        this.isSuccess = false;
        this.message = 'Access denied: Admin privileges required';
        return null;
      }

      if (!userId) {
        this.isSuccess = false;
        this.message = 'User ID is required';
        return null;
      }

      // Get target user by ID
      const targetUserData = await userService.getUserById(userId);
      
      if (!targetUserData) {
        this.isSuccess = false;
        this.message = 'User not found';
        return null;
      }

      // Get existing sessionId from users_login (don't modify target user's session)
      const sessionQuery = 'SELECT sessionId FROM users_login WHERE userId = ? ORDER BY dtLogedIn DESC LIMIT 1';
      const sessionParams = [new SqlParams('userId', targetUserData.id)];
      const sessionResult = await this.crud.executeQueryWithParams(sessionQuery, sessionParams);
      
      let existingSessionId = null;
      if (sessionResult && sessionResult.length > 0) {
        existingSessionId = sessionResult[0].sessionId;
      }

      if(!existingSessionId) {
        this.isSuccess = false;
        this.message = '׳”׳׳©׳×׳׳© ׳׳™׳ ׳• ׳׳—׳•׳‘׳¨';
        return null;
      }

      // Create User instance for target user
      const targetUser = new User({
        id: targetUserData.id,
        email: targetUserData.email,
        fullName: targetUserData.fullName,
        phone: targetUserData.phone,
        role: targetUserData.role,
        adminType: targetUserData.adminType,
        clientType: admin.clientType || 'web',
        createdAt: targetUserData.createdAt
      });

      // Set the existing sessionId without modifying the target user's session
      targetUser.sessionId = existingSessionId;

      this.isSuccess = true;
      this.message = 'Login successful!';
      return targetUser;
    } catch (error) {
      console.error('Error in loginAsUser:', error);
      this.isSuccess = false;
      this.message = 'Error logging in as user: ' + error.message;
      return null;
    }
  }


  async updateUser(user) {
    try {
      const query = 'UPDATE users SET fullName = ?, email = ?, phone = ?, role = ?, adminType = ? , isActive = ? WHERE id = ?';
      const params = [
        new SqlParams('fullName', user.fullName),
        new SqlParams('email', user.email),
        new SqlParams('phone', user.phone),
        new SqlParams('role', user.role),
        new SqlParams('adminType', user.adminType),
        new SqlParams('isActive', user.isActive),
        new SqlParams('id', user.id)
      ];
      await this.crud.executeNonQueryWithParams(query, params);
      return true;
    } catch (error) {
      console.error('Error in updateUser:', error);
      return false;
    }
  }
} 

module.exports = AdminSystem;


