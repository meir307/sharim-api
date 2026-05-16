const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Bind the method to the instance!
router.post('/register', userController.register.bind(userController));
router.post('/login', userController.login.bind(userController));
router.post('/activate', userController.activate.bind(userController));
router.post('/activateTrustee', userController.activateTrustee.bind(userController));
router.post('/forgotPassword', userController.forgotPassword.bind(userController));
router.post('/resetPassword', userController.resetPassword.bind(userController));
router.post('/changePassword', userController.changePassword.bind(userController));
router.post('/updateProfile', userController.updateProfile.bind(userController));
router.post('/SaveCategories', userController.saveCategories.bind(userController));
router.post('/SaveArtists', userController.saveArtists.bind(userController));
router.post('/SavePlaylists', userController.savePlaylists.bind(userController));
router.post('/SaveFeedbackQuestions', userController.saveFeedbackQuestions.bind(userController));
router.post('/getUserByEmail', userController.getUserByEmail.bind(userController));



module.exports = router;


 
