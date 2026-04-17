const mysql = require('mysql2/promise');
const SqlParams = require('./SqlParams');

class CRUD {
    /**
     * @param {string} connStr - MySQL connection string
     */
    constructor(connStr) {
        this.connectionString = connStr;
        this.connection = null;
        this.transaction = null;
        this.lastInsertedId = null;
    }

    /**
     * Begin a new transaction
     */
    async beginTransaction() {
        this.connection = await mysql.createConnection(this.connectionString);
        this.transaction = await this.connection.beginTransaction();
    }

    /**
     * Commit the current transaction
     */
    async commitTransaction() {
        if (this.transaction) {
            await this.transaction.commit();
            this.transaction = null;
            await this.connection.end();
        }
    }

    /**
     * Rollback the current transaction
     */
    async rollbackTransaction() {
        if (this.transaction) {
            await this.transaction.rollback();
            this.transaction = null;
            await this.connection.end();
        }
    }

    /**
     * Execute a non-query SQL command with parameters
     * @param {string} query - SQL query to execute
     * @param {SqlParams[]} params - Array of SQL parameters
     * @returns {Promise<number>} - Number of affected rows
     */
    async executeNonQueryWithParams(query, params) {
        let conn = this.transaction ? this.connection : await mysql.createConnection(this.connectionString);
        
        try {
            const [result] = await conn.execute(query, this._prepareParams(params));
            this.lastInsertedId = result.insertId;
            return result.affectedRows;
        } finally {
            if (!this.transaction) {
                await conn.end();
            }
        }
    }

    /**
     * Execute a scalar query
     * @param {string} query - SQL query to execute
     * @returns {Promise<string>} - Scalar result
     */
    async executeScalar(query) {
        const conn = await mysql.createConnection(this.connectionString);
        
        try {
            const [rows] = await conn.execute(query);
            return rows[0] ? Object.values(rows[0])[0] : null;
        } finally {
            await conn.end();
        }
    }

    /**
     * Execute a query with parameters and return results as an array of objects
     * @param {string} query - SQL query to execute
     * @param {SqlParams[]} params - Array of SQL parameters
     * @returns {Promise<Object[]>} - Query results
     */
    async executeQueryWithParams(query, params) {
        const conn = await mysql.createConnection(this.connectionString);
        
        try {
            const [rows] = await conn.execute(query, this._prepareParams(params));
            return rows;
        } finally {
            await conn.end();
        }
    }

    /**
     * Prepare parameters for MySQL query
     * @private
     * @param {SqlParams[]} params - Array of SQL parameters
     * @returns {any[]} - Prepared parameters
     */
    _prepareParams(params) {
        if (params)
            return params.map(p => p.value);

        return null;
    }
}

module.exports = CRUD;  