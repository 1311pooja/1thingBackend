const express = require('express');
const router = express.Router();
const activitiesCardsController = require('../controllers/activitiesCards');




// router.post('/add', campaignController.addCampaign);
router.post('/addActivityCardsFromExcelSheet',activitiesCardsController.addActivityCardsFromExcelSheet)
router.post('/changeActivityStatus',activitiesCardsController.changeActivityStatus);
router.get('/downloadAndReadExcelSheet', activitiesCardsController.downloadAndReadExcelSheet);
router.get('/downloadAndReadExcelSheet1', activitiesCardsController.downloadAndReadExcelSheet1);
router.post('/apiCheckingMethod', activitiesCardsController.apiCheckingMethod);
router.post('/startProject', activitiesCardsController.startProject);
router.post('/startProject1', activitiesCardsController.startProject1);
router.post('/addTask', activitiesCardsController.addTask);
router.post('/addStage', activitiesCardsController.addStage);
router.post('/addTask1', activitiesCardsController.addTask1);
router.post('/addStage1', activitiesCardsController.addStage1);
router.post('/updateInStage', activitiesCardsController.updateInStage);
router.post('/updateInTask1', activitiesCardsController.updateInTask1);
router.post('/startTaskTimer', activitiesCardsController.startTaskTimer);
router.post('/startTaskTimer1', activitiesCardsController.startTaskTimer1);
router.put('/deletedStage1', activitiesCardsController.deletedStage1);
router.put('/deleteTask1', activitiesCardsController.deleteTask1);
router.post('/startExistingActivity',activitiesCardsController.startExistingActivity);
router.get('/addonsPayment',activitiesCardsController.addonsPayment);

module.exports = router;

