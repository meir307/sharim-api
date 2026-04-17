const express = require('express');
const router = express.Router();
const { router: commonRouter, LoadCache } = require('../controllers/commonController');

// Mount the common controller routes
router.use('/', commonRouter);

// Add the init route
router.post('/init', LoadCache);

module.exports = router; 
