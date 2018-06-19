const careersModel = require("../models/careers");

var careersController = {};

careersController.register = (req, res) => {
     let careers = new careersModel({
                        name:req.body.name,
                        email: (req.body.email).toLowerCase(),
                        profileLink: req.body.profileLink,
                    });
     careers.save((err, data) => {
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

module.exports = careersController;
