const collaborationModel = require("../models/collaboration");

var collaborationController = {};

collaborationController.register = (req, res) => {
    let collaboration = new collaborationModel({
        name:req.body.name,
        email:req.body.email,
        link:req.body.link,
        aboutYou:req.body.aboutYou
    });
   collaboration.save((err, data) => {
        if (err)
            res.json(500, err);
        else {
            res.json(200,{
                statusCode:200,
                msg:"registered!"
            })
        }
    });
};

module.exports = collaborationController;
