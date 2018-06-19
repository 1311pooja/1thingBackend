const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const cronController=require('../controllers/cron')



router.post('/register', userController.register);
//router.get('/users',userController.getAllUsers);
router.get('/designers',userController.getAllDesigners);

router.get('/login',userController.login)
router.post('/search',userController.testingSearch);
router.post('/quickChat',userController.quickChat);
router.post('/quickChatWithLogin',userController.quickChatWithLogin)
router.get('/sendmail',userController.sendmail);
router.post("/userLogin",userController.userLogin)
router.get('/sendMailForUsers',cronController.sendMailAgain);
router.post('/redirect',userController.setCookies);
router.post('/crossChat',userController.quickChatWithCrossSign);


//workspace routes
router.get('/getUser/:id',userController.findUserDetailsForWorkspace)

//add excel data for users from mattermost

router.post('/addUsersByExcelSheet',userController.addUsersByExcelSheet);

//pooja is working
router.post('/emailAlreadyExist',userController.emailAlreadyExist )
router.post('/userSignUp',userController.userSignUp )
router.post('/userSignUpSpecific',userController.userSignUpSpecific )
router.get('/getUserV3/:id',userController.findUserDetailsForWorkspaceV3);
router.get('/getUserV4/:id',userController.findUserDetailsForWorkspaceV4);
router.get('/getUserV3ByTeamId/:id',userController.findUserDetailsForWorkspaceV3ByTeamId);
router.post('/getChannelsMsgByTeamId',userController.getChannelsMsgByTeamId);
router.post('/redirectToLanding',userController.setCookiesLanding);
// router.post('/addDesignerLeadInClientTeam',userController.addDesignerLeadInClientTeam);
router.post('/checkLocationValidOrNot', userController.checkLocationValidOrNot);
router.post('/saveNameOfUser', userController.saveNameOfUser);
router.post('/savePasswordOfUser', userController.savePasswordOfUser);
// router.post('/sendEmailSystemAfterSignUp', userController.sendEmailSystemAfterSignUp);
router.post('/userSignUpTesting',userController.userSignUpTesting );
router.get('/updateLocations',userController.updateLocations);
router.post('/signUpForUserApp',userController.signUpForUserApp);
router.get('/getSignupType',userController.getSignupType);
router.post('/checkMultipartData',userController.checkMultipartData);

//<-------Admin panel---------->
router.get('/getAllUsersData',userController.getAllUsersData);
router.get('/checkUserDublicacy',userController.checkUserDublicacy);


module.exports = router;