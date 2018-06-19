const express = require('express');
const router = express.Router();
const designerController = require('../controllers/designer');




router.post('/quickChat', designerController.quickChatWithLogin);
router.post('/addDesigner',designerController.addDesigner);
router.put('/addDesignerDetails',designerController.addDesignerDetails);
router.put('/designerExpertise',designerController.designerExpertise);
router.put('/addPerspective',designerController.addPerspective)
router.put('/addExpertige',designerController.addExpertige);
router.put('/ratingYourself',designerController.ratingYourself);

router.get('/getProfileInfoByUsername/:userName',designerController.getProfileInfoByUsername)
router.post('/addDesignerForDummyData',designerController.addDesignerForDummyData);

//workspace
router.put('/addAboutYourself',designerController.addAboutYourself);
router.put('/addExpertigeForWorkspace',designerController.addExpertigeForWorkspace);
router.put('/addPerspectiveForWorkspace',designerController.addPerspectiveForWorkspace);
router.put('/ratingYourselfFromWorkspace',designerController.ratingYourselfFromWorkspace);
router.get('/getDesignerDetailsByStage/:id',designerController.getDesignerDetailsByStage)


//for geting list of all users

router.get('/usersCsvDownloads',designerController.usersCsvDownloads)

//for add designers from mattermost excel data
router.post('/addUsersByExcelSheet',designerController.addUsersByExcelSheet)

// for add informations of designer for algorithm
router.post('/addDsignerInfoForAlgorithm',designerController.addDsignerInfoForAlgorithm)
// router.post('/getTopSelectDesigner',designerController.getTopSelectDesigner);
router.post('/signupDesignerAlreadyInWorkspace',designerController.signupDesignerAlreadyInWorkspace)
router.get('/getTopSelectDesigner/:projectId',designerController.getTopSelectDesigner)
router.post('/selectDL',designerController.selectDL)
router.get('/checkDesignerDublicacy',designerController.checkDesignerDublicacy)
router.post('/updateDesignerStatus',designerController.updateDesignerStatus);
router.get('/getAllDps',designerController.getAllDps);
router.post('/selectDps',designerController.selectDps);
router.post('/getSelecetDps1',designerController.getSelecetDps1);
router.post('/deteteDps',designerController.deteteDps);



module.exports = router;