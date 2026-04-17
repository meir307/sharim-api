

class CommonService {
    constructor() {
       
    }

    /**
     * Formats a date to a specific format
     * @param {Date} date - The date to format
     * @param {string} format - The desired format
     * @returns {string} Formatted date string
     */
    formatDate(date, format = 'YYYY-MM-DD') {
        if (!date) return null;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    }

    /**
     * Validates an email address
     * @param {string} email - The email to validate
     * @returns {boolean} Whether the email is valid
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Generates a random string of specified length
     * @param {number} length - Length of the random string
     * @returns {string} Random string
     */
    generateRandomString(length = 10) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    /**
     * Sanitizes input data by removing potentially harmful characters
     * @param {string} input - The input to sanitize
     * @returns {string} Sanitized input
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input.replace(/[<>]/g, '');
    }

    /**
     * Checks if a value is empty (null, undefined, empty string, or empty array)
     * @param {any} value - The value to check
     * @returns {boolean} Whether the value is empty
     */
    isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim() === '';
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }

    /**
     * Generates a GUID/UUID string
     * @returns {string} A new GUID in format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
     */
    generateGUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Converts date string (dd/MM/yyyy format) or Date object to MySQL datetime format
     * @param {string|Date} dateString - Date in dd/MM/yyyy format, Date object, or ISO string
     * @returns {string|null} Formatted date string in YYYY-MM-DD HH:mm:ss format for MySQL, or null
     */
    formatDateForMySQL(dateString) {
        if (!dateString) return null;
        // If date is in DD/MM/YYYY format, convert to Date object
        if (typeof dateString === 'string' && dateString.includes('/')) {
            const [day, month, year] = dateString.split('/');
            const date = new Date(year, month - 1, day);
            return this.formatDate(date, 'YYYY-MM-DD HH:mm:ss');
        }
        // If already a Date object or ISO string, format it
        return this.formatDate(new Date(dateString), 'YYYY-MM-DD HH:mm:ss');
    }
}

module.exports = new CommonService(); 
