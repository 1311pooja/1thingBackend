const express = require('express');
const router = express.Router();
const milestonesController = require('../controllers/milestones');




router.post('/add', milestonesController.addMilestones);
router.put('/update',milestonesController.updateMilestones);

module.exports = router;