const express = require('express');
const router = express.Router();
const domainsDetailsController = require('../controllers/domains_details');




// router.post('/add', campaignController.addCampaign);
router.post('/getDomainsDetialsExcelSheet',domainsDetailsController.getDomainsDetialsExcelSheet)
router.get('/getDomainsTags',domainsDetailsController.getDomainsTags);
router.get('/getAllDomains', domainsDetailsController.getAllDomains);
router.get('/getAllProjects', domainsDetailsController.getAllProjects);
router.get('/KindOfMembers', domainsDetailsController.KindOfMembers);

module.exports = router;