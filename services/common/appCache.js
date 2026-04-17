// services/common/appCache.js
const CRUD = require('../../dal/CRUD');
const dbConfig = require('../../config/db');

const appCache = {
    
    params:{},
    // Add more properties as needed

    async load() {
        const crud = new CRUD(dbConfig.connectionString);
        this.params.su_params = await crud.executeQueryWithParams('SELECT * FROM zu_params');

       // this.params.su_routine_check_types = await crud.executeQueryWithParams('SELECT * FROM routine_factory_check_types order by displayOrder');

        // Load more data as needed
    },

    getParamValue(key) {
        return this.params ? this.params[key] : undefined;
    }
};

module.exports = appCache;
