const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaign');




router.post('/add', campaignController.addCampaign);

module.exports = router;