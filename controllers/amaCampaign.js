const CampaignModel = require('../models/amaCampaign');
const moment = require('moment-timezone');
const utility = require('../utils/utility')
const env = require('../utils/env')
const async = require('async');
const config = require('../config');

var fs = require('fs');
const XLSX = require('xlsx');
var xlstojson = require("xls-to-json");
var xlsxtojson = require("xls-to-json");
var multer = require('multer');

var campaignController = {};

//right now its not working function .its relpace with another addCampaign function.

campaignController.amaUserSignupInMattermost = (data, callback) => {
    if (data.email && data.name && data.password) {
        let email = data.email.toLowerCase();
        var password = data.password
        var userArray = [], obj = {};
        var userName = data.name
        userArray.push(userName);
        console.log("username", userName)
        utility.loginByMattermost(env.designer_admin, (err, varunObject) => {
            if (err) {
                console.log("err in loginByMattermost=====>",err )
                callback(err)
            }
            // console.log("login admin", err, varunObject.body)
            // console.log("admintok", varunObject.headers.token, varunObject.body.id)
            var adminToken = varunObject.headers.token
            var adminId = varunObject.body.id;
            // console.log("username checking", userArray)
            utility.userExistByEmail(email, adminToken, (err, user) => {
                // console.log("id checking userExistByEmail", err, user)
                if (user) {
                    let objs = {
                        userId: user.id
                    }
                    utility.addUserinMonochromeTeam(objs, adminToken, (err, clientData) => {
                        // console.log("checking add monochrome team", err, clientData)
                        callback(null, "success")
                    })
                }
                else {
                    userObject = {
                        "email": data.email.toLowerCase(),
                        "password": password,
                        "username": userName
                    }
                    console.log("userObject^^^^^^^^^^^^^^^^^", userObject)
                    utility.sign_up(userObject, (err, user) => {
                        // console.log("id checking from signup", err, user)
                        if (err) {
                            console.log("err in sign_up=====>",err )
                            callback(err)
                        }
                        let userIdObject = {
                            userId: user.id
                        }
                        utility.addUserinMonochromeTeam(userIdObject, adminToken, (err, clientData) => {
                            // console.log("add user in team", err, clientData)
                            if (err) {
                                callback(err)
                            } else {
                                callback(null, "success")
                            }
                        })
                    })
                }
            })
        })
    } else {
        callback("soryy missing parameters")
    }
}

campaignController.addCampaign = (req, res) => {
    if (req.body.email && req.body.name && req.body.referName && req.body.referEmail && req.body.linkedin) {
        let email = req.body.email.toLowerCase();
        let password = utility.createPassword(6);
        var userName = req.body.name.split(' ');
        if (userName[0] && userName[1]) {
            userName = userName[0] + '_' + userName[1]
        } else {
            userName = userName[0]
        }
        userName = userName + '_' + utility.randomStringforUsername(3)
        CampaignModel.findOne({ email: email }, (err, exist) => {
            console.log("in node mongo exist ", err, exist)
            if (err) {
                res.json(500, err)
            } else if (exist) {
                obj = {
                    name: req.body.name,
                    email: email,
                    password: password,
                    linkedin: req.body.linkedin,
                    invite: {
                        name: req.body.referName,
                        email: req.body.referEmail
                    },
                    userName: userName,
                    alreadyExist: true,
                }
                let campaign = new CampaignModel(obj);
                campaignController.sendEmail(obj, res, (err, sending) => {
                    console.log("mail sent")
                })
                campaign.save((err, data) => {
                    if (err) {
                        res.json(500, err)
                    } else {
                        res.json(201, "success")
                    }
                })
            } else {
                obj = {
                    name: req.body.name,
                    email: email,
                    password: password,
                    linkedin: req.body.linkedin,
                    invite: {
                        name: req.body.referName,
                        email: req.body.referEmail
                    },
                    userName: userName,
                }
                let campaign = new CampaignModel(obj);
                campaignController.sendEmail(obj, res, (err, sending) => {
                    console.log("mail sent")
                })
                campaign.save((err, data) => {
                    if (err) {
                        res.json(500, err)
                    } else {
                        res.json(201, "success")
                    }
                })
            }
        })
    } else {
        res.json(400, "soryy missing parameters")
    }
}
campaignController.sendEmail = (data, res, callback) => {
    async.parallel({
        ama: function (callback) {
            res.render('ama', {
                info1: data,
            }, function (err, HTML) {
                utility.sendMail(data.email, HTML, 'Monochrome Live: AMA with Rajnish Kumar', 'steve@1thing.design', (err, data) => {
                    console.log("err", err, data)
                    callback(err, data)
                })
            })
        },
        amaReferel: function (callback) {
            console.log("hey checked email id", data)
            res.render('amaReferel', {
                info1: data,
            }, function (err, HTML) {
                utility.sendMail(data.invite.email, HTML, "Did you hear about the AMA that "+data.name + " is attending?", "steve@1thing.design", (err, data) => {
                    console.log("err", err, data)
                    callback(null, "ok")

                })
            })
        }
    }, function (err, results) {
        callback(err, results)
    });
}

campaignController.userSignupFromExcelSheet = (req, res) => {
    var exceltojson, extension, fileExtension;
    var storage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, './public')
        },
        filename: function (req, file, cb) {
            console.log("filename", file.fieldname)
            var datetimestamp = Date.now();
            let d = new Date();
            let curr_date = d.getDate();
            let curr_month = d.getMonth();
            curr_month++;
            let curr_year = d.getFullYear();
            let date = (curr_date + "-" + curr_month + "-" + curr_year);
            let time = (d.getHours() + "-" + d.getMinutes() + "-" + d.getSeconds());
            cb(null, file.fieldname + '-' + date + '-' + time + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
        }
    });
    var upload = multer({ //multer settings
        storage: storage,
        fileFilter: function (req, file, callback) { //file filter
            console.log("file information", file)
            if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {
                return callback(new Error('Wrong extension type'));
            }
            callback(null, true);
        }
    }).single('file');
    upload(req, res, function (err) {
        console.log("err in uploading file",req.file, err)
        //    console.log("req",req)
        if (err) {
            res.json({ error_code: 1, err_desc: err });
            return;
        }
        /** Multer gives us file info in req.file object */
        if (!req.file) {
            res.json({ error_code: 1, err_desc: "No file passed" });
            return;
        }
        if (req.file.originalname.split('.')[req.file.originalname.split('.').length - 1] === 'xlsx') {
            exceltojson = xlsxtojson;
        } else {
            exceltojson = xlstojson;
        }
        console.log(req.file.path);
        try {
            exceltojson({
                input: req.file.path,
                output: null, //since we don't need output.json
                lowerCaseHeaders: true
            }, function (err, result) {
                if (err) {
                    return res.json({ error_code: 1, err_desc: err, data: null });
                }
                else {
                    // console.log("xcel data********", result);
                    console.log(' in result filed')
                    var count = 1;
                    async.forEachSeries(result, (data, callback) => {
                        var myobj = {};
                        console.log("start point", data);
                        if (data.email && data.userName && data.password) {
                            let userObj={
                                email:data.email,
                                name:data.userName,
                                password:data.password
                            }
                            campaignController.amaUserSignupInMattermost(userObj, (err, respond) => {
                                if (err) {
                                    console.log("error point")
                                    callback(err)
                                }
                                else {
                                    console.log("counting", count++);
                                    setImmediate(callback)
                                }
                            })
                        }
                        else {
                            console.log("no data");
                            callback(true, 'no data');
                        }
                    }, (err) => {
                        if (err) {
                            console.log("err", err);
                            return res.json({ data: "Invalid Data", 'err': 'not uploaded file' });
                        }
                        else {
                            console.log("lastest Approach");
                            return res.json({ error_code: 0, err_desc: null, 'message': 'Successfully uploaded' });
                        }

                    })
                }
            });
        } catch (e) {
            res.json({ error_code: 1, err_desc: "Corupted excel file" });
        }

    })
}
module.exports = campaignController;
