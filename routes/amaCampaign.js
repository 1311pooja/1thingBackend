const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/amaCampaign');




router.post('/add', campaignController.addCampaign);
router.post('/userSignupFromExcelSheet',campaignController.userSignupFromExcelSheet)
module.exports = router;