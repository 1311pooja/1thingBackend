const express = require('express');
const router = express.Router();
const platformController = require('../controllers/platform');




router.post('/add', platformController.addPlatform);

module.exports = router;