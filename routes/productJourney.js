const express = require('express');
const router = express.Router();
const productJourneyController = require('../controllers/productJourney');




// router.post('/add', campaignController.addCampaign);
router.post('/getProjectJourneyData1',productJourneyController.getProjectJourneyData1)
router.post('/getJourneyData1',productJourneyController.getJourneyData1);
router.post('/updateOffLineStatus1',productJourneyController.updateOffLineStatus1)

module.exports = router;