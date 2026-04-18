const express = require('express');
const router = express.Router();
const songChordMulter = require('../middleware/songChordMulter');
const songController = require('../controllers/songController');

router.post('/fetchSongs', songController.fetchSongs.bind(songController));
router.post('/upsert', songChordMulter, songController.upsert.bind(songController));

module.exports = router;
