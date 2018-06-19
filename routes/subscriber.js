const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriber');




router.post('/subscribe', subscriberController.subscribe); 
router.post('/chatBotSubscribe', subscriberController.chatBotSubscribe);

module.exports = router;