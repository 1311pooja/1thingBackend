const ProjectModel = require('../models/project');
const UserModel = require('../models/user')
const MilestonesModel = require('../models/milestones')
const userController = require('../controllers/user');
const paymentModel = require('../models/projectPayment');
const productJourney = require('../models/productJourney');
const moment = require('moment-timezone');
const async = require('async');
const utility = require('../utils/utility')


var projectController = {};
//extra
projectController.getAllProject = (req, res) => {
    let skipValue;
    let limitValue = 5;

    if (req.query.page != undefined && req.query.page >= 1) {
        skipValue = 5 * req.query.page - 5;
    }
    else {
        skipValue = 0;
    }
    if (req.query.limit != undefined) {
        limitValue = req.query.limit;
    }
    async.parallel({
        project: function (callback) {
            ProjectModel.find({ isActive: true }).skip(skipValue).limit(limitValue).exec((err, data) => {
                if (err)
                    callback(true)
                else
                    callback(null, data)
            })
        },
        count: function (callback) {
            ProjectModel.count({ isActive: true }, (err, count) => {
                if (err)
                    callback(true)
                else
                    callback(null, count)
            })
        }
    }, function (err, results) {
        if (err) {
            res.json(500, {
                statusCode: 500,
                err: err
            })
        } else {
            res.json(200, {
                data: results.project,
                count: results.count
            })
        }

    })
}
//extra
projectController.getProjectById = (req, res) => {
    async.parallel({
        project: function (callback) {
            ProjectModel.findOne({ _id: req.params.id, isActive: true }, (err, data) => {
                if (err)
                    callback(err)
                else
                    callback(null, data)
            })
        },
        milestones: function (callback) {
            MilestonesModel.find({ projectId: req.params.id, isActive: true }, (err, dta) => {
                if (err)
                    callback(err)
                else
                    callback(null, dta)
            })
        }
    }, function (err, results) {
        if (err) {
            res.json(500, {
                statusCode: 500,
                err: err
            })
        } else {
            res.json(200, {
                data: results.project,
                milestones: results.milestones
            })
        }
    });
}

projectController.updateStage = (req, res) => {
    var active = false, update = {};
    if (req.body.stage && req.body.status && req.body.projectId) {
        if (req.body.stage == "conversationStage") {
            if (req.body.status == "activate") {
                active = true
            }
            update = {
                'status': "conversationStage",
                'conversationStage.complete.status': active,
                'conversationStage.complete.date': moment().tz('Asia/Kolkata').format('MM/DD/YYYY'),
                'conversationStage.complete.time': moment().tz('Asia/Kolkata').format('LLLL'),
                // 'conversationStage.hold.status': hold,
                // 'conversationStage.hold.date': moment().tz('Asia/Kolkata').format('MM/DD/YYYY'),
                // 'conversationStage.hold.time': moment().tz('Asia/Kolkata').format('LLLL'),
                'documentStage.yetToStart.status': active,
                'documentStage.yetToStart.date': moment().tz('Asia/Kolkata').format('MM/DD/YYYY'),
                'documentStage.yetToStart.time': moment().tz('Asia/Kolkata').format('LLLL'),
                'conversationStage.running.status': false,
                'conversationStage.running.date': moment().tz('Asia/Kolkata').format('MM/DD/YYYY'),
                'conversationStage.running.time': moment().tz('Asia/Kolkata').format('LLLL')
            }
        } else if (req.body.stage == "documentStage") {
            if (req.body.status == "activate") {
                active = true
            }
            update = {
                'status': "documentStage",
                'documentStage.running.status': active,
                'documentStage.running.date': moment().tz('Asia/Kolkata').format('MM/DD/YYYY'),
                'documentStage.running.time': moment().tz('Asia/Kolkata').format('LLLL'),
                'documentStage.yetToStart.status': false,
                'documentStage.yetToStart.date': moment().tz('Asia/Kolkata').format('MM/DD/YYYY'),
                'documentStage.yetToStart.time': moment().tz('Asia/Kolkata').format('LLLL'),
                'conversationStage.complete.status': active,
                'conversationStage.complete.date': moment().tz('Asia/Kolkata').format('MM/DD/YYYY'),
                'conversationStage.complete.time': moment().tz('Asia/Kolkata').format('LLLL'),
                'conversationStage.running.status': false,
                'conversationStage.running.date': moment().tz('Asia/Kolkata').format('MM/DD/YYYY'),
                'conversationStage.running.time': moment().tz('Asia/Kolkata').format('LLLL'),
                'ongoingStage.yetToStart.status': active,
                'ongoingStage.yetToStart.date': moment().tz('Asia/Kolkata').format('MM/DD/YYYY'),
                'ongoingStage.yetToStart.time': moment().tz('Asia/Kolkata').format('LLLL')
            }
        } else if (req.body.stage == "ongoingStage") {
            if (req.body.status == "activate") {
                active = true
            }
            update = {
                'status': "ongoingStage",
                'documentStage.complete.status': active,
                'documentStage.complete.date': moment().tz('Asia/Kolkata').format('MM/DD/YYYY'),
                'documentStage.complete.time': moment().tz('Asia/Kolkata').format('LLLL'),
                'documentStage.running.status': false,
                'documentStage.running.date': moment().tz('Asia/Kolkata').format('MM/DD/YYYY'),
                'documentStage.running.time': moment().tz('Asia/Kolkata').format('LLLL'),
                'ongoingStage.running.status': active,
                'ongoingStage.running.date': moment().tz('Asia/Kolkata').format('MM/DD/YYYY'),
                'ongoingStage.running.time': moment().tz('Asia/Kolkata').format('LLLL'),
                'ongoingStage.yetToStart.status': false,
                'ongoingStage.yetToStart.date': moment().tz('Asia/Kolkata').format('MM/DD/YYYY'),
                'ongoingStage.yetToStart.time': moment().tz('Asia/Kolkata').format('LLLL')
            }
        }
        console.log("update object", update)
        ProjectModel.update({ _id: req.body.projectId }, { $set: update }, (err, update) => {
            if (err)
                res.json(500, {
                    statusCode: 500,
                    err: err
                })
            else
                res.json(200, {
                    update: "update successfully"
                })
        })
    } else {
        res.json(400, {
            msg: "please provide projectId,stage,status"
        })
    }
}

projectController.addModulesInProject = (req, res) => {
    if (req.body.projectId) {
        ProjectModel.update({ _id: req.body.projectId }, { $push: { module: { module: req.body.module } } }, (err, update) => {
            if (err)
                res.json(500, {
                    statusCode: 500,
                    err: err
                })
            else
                res.json(200, {
                    update: "update successfully"
                })
        })
    } else {
        res.json(400, {
            msg: "please provide project Id"
        })
    }
}
projectController.updateModulesInProject = (req, res) => {
    ProjectModel.update({ _id: req.body.projectId, 'module._id': req.body.moduleId },
        { $set: { 'module.$.module': req.body.module } }, (err, update) => {
            if (err)
                res.json(500, {
                    statusCode: 500,
                    err: err
                })
            else
                res.json(200, {
                    update: "update successfully"
                })
        })
}
projectController.removeModulesInProject = (req, res) => {
    ProjectModel.update({ _id: req.body.projectId, 'module._id': req.body.moduleId },
        { $pull: { module: { _id: req.body.moduleId } } }, (err, update) => {
            if (err)
                res.json(500, {
                    statusCode: 500,
                    err: err
                })
            else
                res.json(200, {
                    update: "remove successfully"
                })
        })
}
projectController.addProposal = (req, res) => {
    if (req.body.projectId) {
        let update = {
            'proposal.timeEstimation': req.body.time,
            'proposal.costEstimation': req.body.cost,
            'proposal.tags': req.body.tags,
            'proposal.expectedHours': req.body.hours
        }
        ProjectModel.update({ _id: req.body.projectId }, { $set: update }, (err, update) => {
            if (err)
                res.json(500, {
                    statusCode: 500,
                    err: err
                })
            else
                res.json(200, {
                    update: "update successfully"
                })
        })
    } else {
        res.json(400, {
            msg: "please provide project Id"
        })
    }
}
projectController.addDocumentLink = (req, res) => {
    let update = {
        documentLink: req.body.link
    }
    ProjectModel.update({ _id: req.body.projectId }, { $set: update }, (err, update) => {
        if (err)
            res.json(500, err)
        else
            res.json(200, {
                update: "update successfully"
            })
    })
}
projectController.addTeam = (req, res) => {
    ProjectModel.update({ _id: req.body.projectId }, { $push: { team: req.body.team } }, (err, update) => {
        if (err)
            res.json(500, err)
        else
            res.json(200, {
                update: "update successfully"
            })
    })
}

projectController.addTeam = (req, res) => {
    console.log("req", req.body)
    ProjectModel.findOne({ _id: req.body.projectId }, (err, data) => {
        console.log("data", data)
        if (err)
            res.json(500, err)
        else
            data.team = req.body.team;
        data.save((err, obj) => {
            if (err)
                res.json(500, err)
            else
                res.json(200, {
                    data: data
                })
        })
    })
}
projectController.addProjectByUser = (req, res) => {
    if (req.body.projectName && req.body.userId && req.body.userName) {
        console.log("dbjvcbhsanbj")
        var project = new ProjectModel({
            name: req.body.projectName,
            platform: req.body.platform,
            projectType: {
                projectType: req.body.type,
                link: req.body.link
            },
            userDocumentLink: req.body.userDocumentLink,
            domain: req.body.domain,
            similarProduct: req.body.similarProduct,
            user: {
                id: req.body.userId,
                name: req.body.userName
            }
        });
        project.save((err, data) => {
            if (err) {
                console.log("err", err)
                res.json(500, {
                    statusCode: 500,
                    err: err
                })
            } else {
                res.json(201, {
                    data: data
                })
            }
        })
    } else {
        res.json(400, {
            msg: "please provide all fields"
        })
    }
}
projectController.updateProjectByUser = (req, res) => {
    if (req.body.projectId && req.body.startTime && req.body.timeline && req.body.budgetRange && req.body.designObjective && req.body.referenceLink) {
        async.parallel({
            one: function (callback) {
                let update = {
                    'userProposal.startTime': req.body.startTime,
                    'userProposal.timeline': req.body.timeline,
                    'userProposal.budgetRange': req.body.budgetRange,
                    'userProposal.designObjective': req.body.designObjective,
                    'userProposal.referenceLink': req.body.referenceLink
                }
                ProjectModel.update({ _id: req.body.projectId }, { $set: update }, (err, update) => {
                    if (err)
                        res.json(500, err)
                    else {
                        callback(null, update)
                    }
                })
            },
            userData: function (callback) {
                UserModel.findOne({ _id: req.body.userId }, (err, data) => {
                    callback(err, data)
                })
            }
        }, function (err, results) {
            if (err) {
                res.json(500, {
                    err: err,
                    statusCode: 500
                })
            } else {
                ProjectModel.findOne({ _id: req.body.projectId }, (err, pdata) => {
                    if (err) {
                        res.json(500, {
                            statusCode: 500,
                            err: err
                        })
                    } else {
                        var user = {}, project = {};
                        user = results.userData
                        project = pdata
                        res.render('nextStepWith1Thing', {
                            info1: user,
                            info2: project
                        }, function (err, HTML) {
                            utility.sendMail(user.email, HTML, 'next steps with 1Thing', 'divanshu@1thing.design', (err, data) => {
                                console.log("at the time mail", err, data)
                                // callback(err, data)
                            })
                        })
                        res.json(200, {
                            update: "update successfully"
                        })
                    }
                })
            }
        });
    } else {
        res.json(400, {
            msg: "please provide project Id"
        })
    }
}

//new admin pannel API


projectController.addProjectFromWorkspace = (req, res) => {
    if (req.body.projectName && req.body.userId && req.body.userName) {
        console.log("dbjvcbhsanbj")
        var project = new ProjectModel({
            name: req.body.projectName,
            projectType: {
                projectType: req.body.type,
                link: req.body.link
            },
            userDocumentLink: req.body.userDocumentLink,
            domain: req.body.domain,
            similarProduct: req.body.similarProduct,
            user: {
                id: req.body.userId,
                name: req.body.userName
            },
            statusBar:{
                product:{
                    completed:true,
                    completedDate:moment().tz('Asia/Kolkata').format('LLLL')
                   }
            }
        });
        project.save((err, data) => {
            if (err) {
                console.log("err", err)
                res.json(500, {
                    statusCode: 500,
                    err: err
                })
            } else {
                res.json(201, {
                    data: data
                })
            }
        })
    } else {
        res.json(400, {
            msg: "please provide all fields"
        })
    }
}
projectController.updateProjectFromWorkspace = (req, res) => {
    if (req.body.projectId && req.body.designObjective && req.body.referenceLink) {
        let update = {
            'platform': req.body.platform,
            'userProposal.designServices': req.body.designServices,
            'userProposal.designObjective': req.body.designObjective,
            'userProposal.referenceLink': req.body.referenceLink,
            'statusBar.design.completed':true,
            'statusBar.design.completedDate':moment().tz('Asia/Kolkata').format('LLLL')
        }
        ProjectModel.update({ _id: req.body.projectId }, { $set: update }, (err, update) => {
            if (err)
                res.json(500, err)
            else {
                res.json(200, update)
            }
        })
    }
}
projectController.updateTimelineForWorkspace = (req, res) => {
    if (req.body.projectId && req.body.startTime && req.body.timeline && req.body.budgetRange) {
        let update = {
            'userProposal.startTime': req.body.startTime,
            'userProposal.timeline': req.body.timeline,
            'userProposal.budgetRange': req.body.budgetRange,
            'statusBar.timeline.completed':true,
            'statusBar.timeline.completedDate':moment().tz('Asia/Kolkata').format('LLLL')
        }
        ProjectModel.update({ _id: req.body.projectId }, { $set: update }, (err, update) => {
            if (err)
                res.json(500, err)
            else {
                res.json(200, update)
            }
        })
    }
}
projectController.updateProject = (req, res) => {
    if (req.body.projectId) {
        let project = {
            name: req.body.projectName,
            projectType: {
                projectType: req.body.type,
                link: req.body.link
            },
            userDocumentLink: req.body.userDocumentLink,
            domain: req.body.domain,
            similarProduct: req.body.similarProduct,
        };
        ProjectModel.update({ _id: req.body.projectId }, { $set: project }, (err, update) => {
            if (err)
                res.json(500, err)
            else {
                res.json(200, update)
            }
        })
    } else {
        res.json(400, {
            msg: "please provide all fields"
        })
    }
}

projectController.getAllProjectsForWorkspace = (req, res) => {
    if (req.params.id) {
        let condition = {
            "user.id": req.params.id,
            'isActive': true
        };
        ProjectModel.findOne(condition,{_id:1,statusBar:1}, (err, data) => {
            if (err)
                res.json(500, err)
            else
                res.json(200, data)
        })
    } else {
        res.json(400, {
            msg: "please provide userId"
        })
    }
}
projectController.getProjectByIds = (req, res) => {
    let filter={};
    console.log("checking",req.query)
    if (req.query.stage == 1) {
        filter.name=1;
        filter.projectType=1;
        filter.domain=1
        filter.similarProduct=1
        filter.userDocumentLink=1
        filter.statusBar=1
        filter._id=1
    }
    if (req.query.stage == 2) {
        filter.platform=1;
        filter.userProposal=1
        filter.statusBar=1
        filter._id=1
    }
    if (req.query.stage == 3) {
        filter.userProposal=1
        filter.statusBar=1
        filter._id=1
    }
    console.log("fileter",filter)
    ProjectModel.findOne({ _id: req.params.id, isActive: true },filter, (err, data) => {
        if (err)
            res.json(500, err)
        else
            res.json(200, data)
    })
}


//******************pooja's code********************
projectController.addProjectByUserChatBot = (data, dLead, req,callback) => {
        // console.log("in add project dbjvcbhsanbj")
    
    if (req.body.projectName && data.userId && data.userName) {
        // console.log("dbjvcbhsanbj")
        var project = new ProjectModel({
            name: req.body.projectName,
            allTags: req.body.allTags,
            // domainName:req.body.domainName===""?[]:req.body.domainName,
            // subDomains:req.body.subDomains===""?[]:req.body.subDomains,
            // projects:req.body.projects===""?[]:req.body.projects,
            // memberTypes:req.body.memberTypes===""?[]:req.body.memberTypes,
            projectType: {
                projectType: req.body.type,
                link: req.body.link
            },
            user: {
                id: data.userId,
                name: data.name,
            },
            mUserId:data._id,
            DLead:{
                workspaceId:dLead.workspaceId,
                name:dLead.name,
                mongooseId:dLead.mongooseId,
            }
        });
        project.save((err, data) => {
            // console.log("project data",err,data)
            callback(err,data)
        })
    } 
    else {
        // res.json(400, {
        //     msg: "please provide all fields"
        // })
        console.log('in project else ');
        callback(true,{msg: "please provide all fields"});
    }
}

projectController.addProjectByUserChatBots = (data,dLead,req,callback) => {
    
    if (req.body.projectName && data.userId && data.userName) {
        // console.log("dbjvcbhsanbj")

        let arr = [];
        async.forEachSeries(dLead, (designLead, dlCallback)=>{
            arr.push({
                workspaceId:designLead.workspaceId,
                name:designLead.name,
                mongooseId:designLead.mongooseId,
            });
            dlCallback();
        },err=>{

                var project = new ProjectModel({
                name: req.body.projectName,
                allTags: req.body.allTags,
                domainName:req.body.domainName===""?[]:req.body.domainName,
                subDomains:req.body.subDomains===""?[]:req.body.subDomains,
                projects:req.body.projects===""?[]:req.body.projects,
                memberTypes:req.body.memberTypes===""?[]:req.body.memberTypes,
                projectType: {
                    projectType: req.body.type,
                    link: req.body.link
                },
                user: {
                    id: data.userId,
                    name: data.name,
                },
                assigneTopDLead:arr,
            });
            project.save((err, data) => {
                // console.log("project data",err,data)
                callback(err,data)
            })
        })    
    } 
    else {
        // res.json(400, {
        //     msg: "please provide all fields"
        // })
        console.log('in project else ');
        callback(true,{msg: "please provide all fields"});
    }
}

//code to conform dLead
projectController.confirmDesignerLead = (req, res)=>{
    console.log('req------>', req.body.projectId);
    ProjectModel.findOneAndUpdate({_id:req.body.projectId},
        {$set:{assignDLeadConformation:true}},(err, updated)=>{
            // console.log('updated------->', updated)
            if(err){
                res.json(500,{
                    statusCode:500,
                    err:err
                })
            }
            else{
                res.json(200,{
                    statusCode:200,
                    msg:"confirmed"
                })
            }
        });
}

//code to like workspace
projectController.likeWorkSpace = (req, res)=>{
    console.log('req------>', req.body.projectId);
    ProjectModel.findOneAndUpdate({_id:req.body.projectId},
        {$set:{likeWorkSpace:true}},(err, updated)=>{
            console.log('updated------->', updated)
            if(err){
                res.json(500,{
                    statusCode:500,
                    err:err
                })
            }
            else{
                res.json(200,{
                    statusCode:200,
                    msg:"likedWorkSpace"
                })
            }
        });
}

//aggrement api 
projectController.saveAggrementOfUser = (req, res)=>{
 if(req.body.aggrement){ 
    let project = new ProjectModel({aggrement:(req.body.aggrement==="yes"?true:false)});
    project.save((err, data)=>{
      if(err){
        res.json(500,{
          statusCode:500,
          err:err,
        })
      }
      else if(data){
        res.json(200,{
          statusCode:200,
          data:data
        })
      } 
    })
  }
  else{
    res.json(400,{
      statusCode:400,
      msg:"Please provide agrrement!"
    })
  }
}

//productName api 
projectController.saveProductNameOfUser = (req, res)=>{
  ProjectModel.findOneAndUpdate(
    {_id:req.body.projectId},
    {$set:{name:req.body.projectName}},
    {new:true},
    (err, data)=>{
      if(err){
        res.json(500,{
          statusCode:500,
          err:err,
        })
      }
      else if(data){
        res.json(200,{
          statusCode:200,
          msg:"OK",
          data:data,
        })
      }
      else{
        res.json(404,{
          statusCode:404,
          msg:"NOT FOUND!"
        })
      }
    }
  )
}

//All tags api 
projectController.saveTagsOfUser = (req, res)=>{
  ProjectModel.findOneAndUpdate(
    {_id:req.body.projectId},
    {$set:{allTags: req.body.allTags,}},
    {new:true},
    (err, data)=>{
      if(err){
        res.json(500,{
          statusCode:500,
          err:err,
        })
      }
      else if(data){
        res.json(200,{
          statusCode:200,
          msg:"OK",
          data:data,
        })
      }
      else{
        res.json(404,{
          statusCode:404,
          msg:"NOT FOUND!"
        })
      }
    }
  )
}

//Type of Project api 
projectController.saveTypeOfProjectOfUser = (req, res)=>{
  ProjectModel.findOneAndUpdate(
    {_id:req.body.projectId},
    {$set:{"projectType.projectType": req.body.type,}},
    {new:true},
    (err, data)=>{
      if(err){
        res.json(500,{
          statusCode:500,
          err:err,
        })
      }
      else if(data){
        res.json(200,{
          statusCode:200,
          msg:"OK",
          data:data,
        })
      }
      else{
        res.json(404,{
          statusCode:404,
          msg:"NOT FOUND!"
        })
      }
    }
  )
}

//ProjectLink api 
projectController.saveProjectLinkOfUser = (req, res)=>{
    if(req.body.link && req.body.projectId){
        ProjectModel.findOneAndUpdate(
            {_id:req.body.projectId},
            {$set:{"projectType.link": req.body.link,}},
            {new:true},
            (err, data)=>{
            if(err){
                res.json(500,{
                statusCode:500,
                err:err,
                })
            }
            else if(data){
                res.json(200,{
                statusCode:200,
                msg:"OK",
                data:data,
                })
            }
            else{
                res.json(404,{
                statusCode:404,
                msg:"NOT FOUND!"
                })
            }
            }
        )
    }
    else{
        res.json(400,{
            statusCode:400,
            msg:"Please provide all parameters!"
        })
    }
  
}


//update activities in project
projectController.updateActivities = (req, res)=>{
    let update = {
        "activities.$.stages":req.body.stages,
        "activities.$.team":req.body.team,
        "activities.$.deliverables":req.body.deliverables,
        "activities.$.activitiesCardId":req.body.activityCardId,
        "activities.$.bigTitles":req.body.bigTitles,
        "activities.$.bannerURL":req.body.bannerURL,
        "activities.$.iconURL":req.body.iconURL,
        "activities.$.colorCode":req.body.colorCode,
        "activities.$.name":req.body.name,
        "activities.$.fileName":req.body.fileName,
        "activities.$.approxDesignHours":req.body.approxDesignHours,
        "activities.$.approxTimeline":req.body.approxTimeline,
    };
    ProjectModel.findOneAndUpdate(
        {
            _id: req.body.projectId,
            "user.id": req.body.userId,
            "activities._id": req.body.activityId
        },
        {$set:update},
        {new :true},
        (err, updatedData)=>{
            if(err){
                res.json(500,{
                    statusCode:500,
                    err:err
                })
            }
            else{
                res.json(200,{
                    statusCode:200,
                    data:updatedData
                });
            }
        });
}

//add activities in project
projectController.addActivities=(req, res)=>{
    let _obj = {
        activitiesCardId:req.body.activitiesCardId,
        name:req.body.name,
        status:req.body.status,
        fileName:req.body.fileName,
        team:req.body.team,
        deliverables:req.body.deliverables,
        approxDesignHours:req.body.approxDesignHours,
        approxTimeline:req.body.approxTimeline,
        bigTitles:req.body.bigTitles,
        stages:req.body.stages,
        bannerURL:req.body.bannerURL,
        iconURL:req.body.iconURL,
        colorCode:req.body.colorCode,
    }
    if (req.body.projectId) {
        ProjectModel.update(
            { _id: req.body.projectId ,
              "user.id":req.body.userId
            }, { $push: { activities: _obj } }, (err, update) => {
            if (err){
                res.json(500, {
                    statusCode: 500,
                    err: err
                });
            }
            else
                res.json(200, {
                    update: "update successfully"
                })
        })
    } else {
        res.json(400, {
            msg: "please provide project Id"
        })
    }
}

//update project Status
projectController.updateStatus = (req, res)=>{
    // let _obj = {
    //     productStatus:"Onboarded"
    // }
    let _obj = {
        productStatus:"Payment done"
    }

    ProjectModel.update({paymentDone:true},{$set : _obj},{multi : true},(err, data)=>{
        if(err){
            res.status(500).send({err:err});
        }
        else if(data){
            
            res.status(200).send({msg : data});
        }
    })

    
}



//<---------------------*********************Admin panel*******************------------------>
projectController.getAllProducts = (req, res)=>{
    console.log('page = ', req.query.page, " limit = ", req.query.limit)
  let page = parseInt(req.query.page);
  let limit = parseInt(req.query.limit);
  ProjectModel.find().skip((page-1)*limit).limit(limit).exec((err, projectData)=>{
    if(err){
            res.json(500,{
                statusCode:500,
                err:err
            });
        }
        else if(projectData.length>0){
            console.log('projectData.length = ', projectData.length)
            var products = [];
            async.forEachSeries(projectData, (pData, projectCallback)=>{
                
                UserModel.findOne({newUser:true},(err, userData)=>{
                    if(err){
                        console.log('err in product 1');
                        res.json(500,{
                            statusCode:500,
                            err:err
                        });
                    }
                    else if(userData){
                        // console.log('userData = ');

                        
                        let _obj ={
                            productName:pData.name,
                            projectId:pData._id,
                            startProjects:0,
                            DLead:pData.DLead===undefined?"":pData.DLead,
                            Pc:pData.user.name,
                            StartDate:pData.createdAt,
                            pricingPlan:pData.period===undefined?"":pData.period,
                            nextBillingDate:'',
                            nextBillHours:0,
                            status:pData.productStatus
                        };
                        let count=0;
                        if(pData.activities.length>0){

                            async.forEachSeries(pData.activities, (activityData, activityCallback)=>{
                                if(activityData.fileCreated){
                                    count++;
                                    activityCallback();
                                }
                                else{
                                    activityCallback();
                                }
                            },(err)=>{
                                paymentModel.findOne({projectId:pData._id},(err, paymentData)=>{
                                    if(err){
                                        res.json(500,{
                                            statusCode:500,
                                            err:err
                                        });
                                    }
                                    else if(paymentData && paymentData.subscriptionId){
                                        let i=0;
                                        let paidHours = paymentData.paidHours;
                                        let workingHours = paymentData.workingHours; 
                                        let extraHours=0;
                                        async.forEach(paidHours, (item, eachCallback)=>{
                                            if(workingHours[i]>paidHours[i]){
                                                extraHours = extraHours+(workingHours[i]-paidHours[i]);
                                                i++;
                                                eachCallback();
                                            }
                                            else{
                                                i++;
                                                eachCallback();
                                            }
                                            }, err=>{
                                                _obj.nextBillHours = extraHours+paymentData.unitHours;
                                                _obj.nextBillingDate = paymentData.nextDewDate;
                                                _obj.pricingPlan = paymentData.period;
                                                products.push(_obj);
                                                projectCallback();
                                            });

                                        }
                                        else{
                                            products.push(_obj);
                                            projectCallback();
                                        }
                                    })

                                 });
                            }
                            else{
                                products.push(_obj);
                                projectCallback();
                            }
                    }
                    else{
                        projectCallback();
                    }
                })
            }, err=>{
                ProjectModel.find({},(err, prod)=>{
                    res.json(200,{
                        statusCode:200,
                        data:products,
                        totalCount:prod.length
                    })    
                })
                
            })
        }
  });
}

projectController.getAllProjectsOfProduct = (req, res)=>{
    ProjectModel.findOne({_id : req.params.projectId}, (err, projectData)=>{
        if(err){
            res.json(500,{
                statusCode:500,
                err:err
            })
        }
        else if(projectData){
            let _obj = {
                productName:projectData.name,
                pcName:projectData.user.name,
                dLead:projectData.DLead==='undefined'?"":projectData.DLead,
                dps:projectData.assigneDPs.length===0?[]:projectData.assigneDPs,
                projects:[],
                status:''
            }
            let projectsDetails = [];
            async.forEachSeries(projectData.activities, (activities, projectCallback)=>{
                 let _project = {
                     name:activities.name,
                     status:activities.status,
                     startDate:activities.startDate,
                     endDate:activities.endDate,
                     id:activities._id,
                 };
                 projectsDetails.push(_project);
                 projectCallback();
            },(err)=>{
                _obj.projects = projectsDetails;
                res.json(200,{
                    statusCode:200,
                    data:_obj
                })
            });
        }
        else{
            res.json(500,{
                statusCode:500,
                msg:'Not Found',
            })
        }
    })
}

projectController.getProjectInfo = (req, res)=>{
    ProjectModel.findOne({_id:req.query.productId},(err, projectData)=>{
        if(err){
            res.json(500,{
                statusCode:500,
                err:err
            });
        }
        else if(projectData){
            let _obj = {
                pc:projectData.user.name,
                dLead:projectData.DLead==='undefined'?'':projectData.DLead,
                thingsToDo:[]
            };
            productJourney.findOne({activityId:req.query.projectId},(err, productJourneyData)=>{
                if(err){
                    res.json(500,{
                        statusCode:500,
                        err:err
                    });
                }
                else if(productJourneyData){
                    _obj.thingsToDo = productJourneyData.thingsToDo;
                    res.json(200,{
                        statusCode:200,
                        data:_obj
                    });
                }
                else{
                    res.json(200,{
                        statusCode:200,
                        data:_obj
                    });
                }
            });
        }
        else{
            res.json(404,{
                statusCode:404,
                msg:'Not Found!'
            })
        }
    });
}


module.exports = projectController; 
