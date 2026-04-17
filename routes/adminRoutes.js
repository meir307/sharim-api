const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.post('/getUsers', adminController.getUsers.bind(adminController));
router.post('/loginAsUser', adminController.loginAsUser.bind(adminController));

module.exports = router;


