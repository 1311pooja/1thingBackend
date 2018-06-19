const express = require('express');
const router = express.Router();
const collaborationController = require('../controllers/collaboration');

router.post('/register', collaborationController.register);

module.exports = router;