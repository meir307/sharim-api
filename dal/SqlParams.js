class SqlParams {
    /**
     * @param {string} name - Parameter name
     * @param {any} value - Parameter value
     */
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
}

module.exports = SqlParams; 