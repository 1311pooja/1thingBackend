const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project');



router.get('/list',projectController.getAllProject);
router.put('/update',projectController.updateStage);
router.get('/getProject/:id',projectController.getProjectById);
router.post('/addModules',projectController.addModulesInProject);
router.post('/addProposal',projectController.addProposal);
router.post('/addDocument',projectController.addDocumentLink);
//router.post('/addTeam',projectController.addTeam);
router.put('/updateModules',projectController.updateModulesInProject);
router.delete('/removeModules',projectController.removeModulesInProject);
router.post('/addTeam',projectController.addTeam)
router.put('/updateProjectByUser',projectController.updateProjectByUser);
router.post('/addProjectByUser',projectController.addProjectByUser);

//workspace pannel.
router.post('/addProjectFromWorkspace',projectController.addProjectFromWorkspace)
router.put('/updateProjectFromWorkspace',projectController.updateProjectFromWorkspace);
router.put('/updateTimelineForWorkspace',projectController.updateTimelineForWorkspace);
router.put('/updateProject',projectController.updateProject);
router.get('/getAllProjectsForWorkspace/:id',projectController.getAllProjectsForWorkspace);
router.get('/getProjectByIds/:id',projectController.getProjectByIds)

//pooja's code
router.get('/addProjectByUserChatBot',projectController.addProjectByUserChatBot);
router.post('/confirmDesignerLead',projectController.confirmDesignerLead);
router.post('/likeWorkSpace',projectController.likeWorkSpace);

router.post('/saveAggrementOfUser', projectController.saveAggrementOfUser);
router.post('/saveProductNameOfUser', projectController.saveProductNameOfUser);
router.post('/saveTagsOfUser', projectController.saveTagsOfUser);
router.post('/saveTypeOfProjectOfUser', projectController.saveTypeOfProjectOfUser);
router.post('/saveProjectLinkOfUser', projectController.saveProjectLinkOfUser);
router.post('/addProjectByUserChatBots', projectController.addProjectByUserChatBots);
router.post('/updateActivities', projectController.updateActivities);
router.post('/addActivities', projectController.addActivities);
router.get('/getAllProducts', projectController.getAllProducts);
router.get('/getAllProjectsOfProduct/:projectId', projectController.getAllProjectsOfProduct);
router.get('/getProjectInfo/', projectController.getProjectInfo);
router.post('/updateStatus/', projectController.updateStatus);


module.exports = router;