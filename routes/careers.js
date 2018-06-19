const express = require('express');
const router = express.Router();
const careersController = require('../controllers/careers');

router.post('/register', careersController.register);

module.exports = router;