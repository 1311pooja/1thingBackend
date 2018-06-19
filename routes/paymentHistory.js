const express = require('express');
const router = express.Router();
const paymentHistory = require('../controllers/paymentHistory');



router.post('/webhook',paymentHistory.getPaymentsByWebhook);



module.exports = router;