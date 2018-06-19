const MilestonesModel = require('../models/milestones');

var milestonesController = {};


milestonesController.addMilestones = (req, res) => {
    var milestones = new MilestonesModel({
        projectId: req.body.projectId,
        title: req.body.title,
        startDate: req.body.startDate,
        endDate: req.body.endDate
    });
    milestones.save((err, data) => {
        if (err)
            res.json(500, err);
        else
            res.json(201, {
                data: data
            })
    })
}
milestonesController.updateMilestones = (req, res) => {
    if(req.body.milestonesId){
    let update = {
        title: req.body.title,
        startDate: req.body.startDate,
        endDate: req.body.endDate
    };

    MilestonesModel.update({ _id: req.body.milestonesId }, { $set: update }, (err, update) => {
        if (err)
            res.json(500, err)
        else
            res.json(200, {
                msg: "successfully update"
            })
    })
    }else{
        res.json(400, {
            msg: "missing parameter"
        }) 
    }
}

module.exports = milestonesController;