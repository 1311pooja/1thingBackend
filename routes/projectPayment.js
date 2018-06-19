const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/projectPayment');


router.post('/projectPaymentSave',paymentController.projectPaymentSave);
router.post('/subscribePlan',paymentController.subscribePlan); 
router.post('/paymentAfterSubscribe',paymentController.paymentAfterSubscribe); 
// router.get('/getAllDomains', domainsDetailsController.getAllDomains);

module.exports = router;