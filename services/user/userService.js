const CRUD = require('../../dal/CRUD');
const dbConfig = require('../../config/db');
const SqlParams = require('../../dal/SqlParams');

class UserService {
    constructor() {
        this.crud = new CRUD(dbConfig.connectionString);
    }

    /**
     * Get users by name using executeQueryWithParams
     * @param {string} name - Name to search for
     * @returns {Promise<Object[]>} - Array of users
     */
    async getUsersByName(name) {
        try {
            const query = 'SELECT * FROM users WHERE name = ?';
            const params = [new SqlParams('Name', name)];
            return await this.crud.executeQueryWithParams(query, params);
        } catch (error) {
            console.error('Error in getUsersByName:', error);
            throw error;
        }
    }

    /**
     * Create a new user
     * @param {string} name - User's name
     * @param {string} email - User's email
     * @returns {Promise<Object>} - Created user object
     */
    async createUser(user) {
        try {
            // Validate input
            if (!this.Validate()) {
                throw new Error('Name and email are required');
            }

            if (this.isExists)
                return;

            this.insert2db(user)


            // Create new user
           
        } catch (error) {
            console.error('Error in createUser:', error);
            throw error;
        }
    }

    async insert2db(user){
        const query = 'INSERT INTO users (Name, Email, Password) VALUES (?, ?, ?)';
        const params = [
            new SqlParams('Name', user.name),
            new SqlParams('Email', user.email),
            new SqlParams('Password', user.password)
        ];

        await this.crud.executeNonQueryWithParams(query, params);
    }

    async isExists(phone, email){
        
        try {
            const query = 'SELECT * FROM users WHERE phone = ? or email= ?';
            const params = [
                new SqlParams('phone', phone),
                new SqlParams('email', email)
            ];

            const existingUser =  await this.crud.executeQueryWithParams(query, params);
            if (existingUser.length > 0) {
                this.isSuccess = false;
                this.message = "׳׳©׳×׳׳© ׳¢׳ ׳₪׳¨׳˜׳™׳ ׳׳׳” ׳›׳‘׳¨ ׳¨׳©׳•׳ ׳‘׳׳¢׳¨׳›׳×.";
            }
            this.isSuccess =true;


        } catch (error) {
            console.error('Error in isExists:', error);
            throw error;
        }


         
    }


    /**
     * Get user by ID
     * @param {string} id - User ID
     * @returns {Promise<Object>} - User object
     */
    async getUserById(id) {
        try {
            const query = 'SELECT * FROM users WHERE id = ?';
            const params = [new SqlParams('id', id)];
            const users = await this.crud.executeQueryWithParams(query, params);
            
            if (users.length === 0) {
                return null;
            }
            
            return users[0];
        } catch (error) {
            console.error('Error in getUserById:', error);
            throw error;
        }
    }

    /**
     * Update user
     * @param {string} id - User ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} - Updated user object
     */
    async updateUser(id, updateData) {
        try {
            const query = 'UPDATE users SET name = ?, email = ?, updatedAt = ? WHERE id = ?';
            const params = [
                new SqlParams('name', updateData.name),
                new SqlParams('email', updateData.email),
                new SqlParams('updatedAt', new Date().toISOString()),
                new SqlParams('id', id)
            ];

            const affectedRows = await this.crud.executeNonQueryWithParams(query, params);
            if (affectedRows === 0) {
                throw new Error('User not found');
            }

            return { id, ...updateData, updatedAt: new Date().toISOString() };
        } catch (error) {
            console.error('Error in updateUser:', error);
            throw error;
        }
    }

    /**
     * Delete user
     * @param {string} id - User ID
     * @returns {Promise<boolean>} - Success status
     */
    async deleteUser(id) {
        try {
            const query = 'DELETE FROM users WHERE id = ?';
            const params = [new SqlParams('id', id)];
            const affectedRows = await this.crud.executeNonQueryWithParams(query, params);
            return affectedRows > 0;
        } catch (error) {
            console.error('Error in deleteUser:', error);
            throw error;
        }
    }

    async getAllUsers() {
        try {
            const query = 'SELECT * FROM users';
            return await this.crud.executeQueryWithParams(query);
        } catch (error) {
            console.error('Error in getAllUsers:', error);
            throw error;
        }
    }

    async getUsers(searchQuery = null) {
        try {
            let query = 'SELECT id, fullName, email, phone, role, adminType, createdAt, isActive FROM users';
            const params = [];

            if (searchQuery && searchQuery.trim() !== '') {
                const searchTerm = `%${searchQuery.trim()}%`;
                query += ' WHERE (fullName LIKE ? OR email LIKE ? OR phone LIKE ?)';
                params.push(
                    new SqlParams('search', searchTerm),
                    new SqlParams('search', searchTerm),
                    new SqlParams('search', searchTerm)
                );
            }

            query += ' ORDER BY createdAt DESC';

            return await this.crud.executeQueryWithParams(query, params);
        } catch (error) {
            console.error('Error in getUsers:', error);
            throw error;
        }
    }

    async getUserByEmail(email) {
        try {
            const query = 'SELECT id, fullName, email, phone, role, adminType, createdAt, isActive FROM users WHERE email = ? and isActive = 1 and role = 1';
            const params = [new SqlParams('email', email)];
            const users = await this.crud.executeQueryWithParams(query, params);
            
            if (users.length === 0) {
                return null;
            }
            
            return users[0];
        } catch (error) {
            console.error('Error in getUserByEmail:', error);
            throw error;
        }
    }
}

module.exports = new UserService(); 
