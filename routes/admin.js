const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');



router.get('/login', adminController.login);
router.post('/register',adminController.register)
router.post('/registerAllreadyInW',adminController.registerAllreadyInW)
module.exports = router;