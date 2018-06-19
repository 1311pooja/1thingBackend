const subscriberModel = require('../models/subscriber')
const utility = require('../utils/utility')

var subscriberController = {};

subscriberController.subscribe = (req, res) => {
    subscriberModel.findOne({ email: req.body.email,userType:req.body.type }, (err, exist) => {
        if (err) {
            res.json(500, err)
        } else if (exist) {
            res.json(401, {
                msg: "email already exist"
            })
        } else {
            subscriber = new subscriberModel({
                email: req.body.email,
                isEmail: true,
                userType:req.body.type
            })
            subscriber.save((err, data) => {
                if (err)
                    res.json(500, err);
                else {
                    var email = req.body.email;
                    var username = email.split('@');
                    username = username[0]
                    var obj = {
                        name: username
                    }
                    if(data.userType=="client"){
                        res.render('monochromeBetterDesign', {
                            info1: obj,
                        }, function (err, HTML) {
                            console.log("err",err,HTML)
                            utility.sendMail(data.email, HTML,'Monochrome: Design a better product','eshaan@1thing.design', (err, data) => {
                                console.log("err", err, data)
                            })
                            res.json(200, {
                                data: data
                            })
                        })
                    }else if(data.userType=="designer"){
                        res.render('monochromeForDesigner', {
                            info1: obj,
                        }, function (err, HTML) {
                            console.log("err",err,HTML)
                            utility.sendMail(data.email, HTML, 'Monochrome: Become a better designer','eshaan@1thing.design',(err, data) => {
                                console.log("err", err, data)
                            })
                            res.json(200, {
                                data: data
                            })
                        })
                    }else{
                        res.json(200, {
                            data: data
                        }) 
                    }
                    
                }
            })
        }
    })
}

subscriberController.chatBotSubscribe = (req, res) => {
    let subscriber = new subscriberModel({
                        name:req.body.name,
                        email: req.body.email,
                        isEmail: true,
                        userType:(req.body.type).toLowerCase()
                    });
     subscriber.save((err, data) => {
        if (err)
            res.json(500, err);
        else {
            res.json(200,{
                statusCode:200,
                msg:"Subscribed!"
            })
        }
    });
}



module.exports = subscriberController;