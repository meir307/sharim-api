const express = require('express');
const router = express.Router();
const sharingController = require('../controllers/sharingController');

router.post('/RequestSharing', sharingController.requestSharing.bind(sharingController));
router.post('/refreshLyrics', sharingController.refreshLyrics.bind(sharingController));
router.post('/updateActiveLink', sharingController.updateActiveLink.bind(sharingController));
router.post('/sharingAction', sharingController.sharingAction.bind(sharingController));

module.exports = router;
