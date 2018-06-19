const PaymentModel = require("../models/projectPayment");
const ProjectModel = require("../models/project");
const UserModel = require("../models/user");
const ActivitiesCardsModel = require("../models/activitiesCards");
const PaymentHistoryModel = require("../models/paymentHistory");
const env = require("../utils/env");
const moment = require('moment-timezone');
// const ActivitiesLog = require("../models.activities_log");

const async = require("async");
const utility = require("../utils/utility");

var paymentController = {};

paymentController.projectPaymentSave = (req, res) => {
  console.log("body of req------>", req.body);
  
  var userObject={}; //for mettermost login
  var teamObject={}; //for team

  //to find current and renewal date
  let currDate  = new Date();
  let currDay   = currDate.getDate();
  let currMonth = currDate.getMonth() + 1;
  let currYear  = currDate.getFullYear();
  var currentDate   = currMonth + "." + currDay + "." + currYear;
  
  let ModMonth = currMonth + 1;
  if (ModMonth > 12)
   { 
     ModMonth = 1;
     currYear = currYear + 1;
   }
  var renewDate = ModMonth + "." + currDay + "." + currYear;


  if (req.body.transactionId && req.body.userId && req.body.projectId) {
  ProjectModel.findOne({
    _id:req.body.projectId,
    "user.id":req.body.userId},(err, projectData)=>{
    if(err){
      res.json(500,{
        statusCode:500,
        err:err
      })
    }
    else if(projectData){
      if(!projectData.paymentDone){
        UserModel.findOne({userId:req.body.userId},(err, userData)=>{
          if(err){
            res.json(500,{
              statusCode:500,
              err:err
            })
          }
          else if(userData){

            //object for mattermost login
            userObject = {
                email: userData.email,
                password:userData.password,
            };

            //object for add in team
            teamObject = {
              teamId : projectData.teamDetails.teamId,
              adminUserId :projectData.DLead.workspaceId,
            }
            
            //object for payment save
            let obj = {
                user: {
                  userId: req.body.userId,
                  name: userData.name
                },
                transactionId: req.body.transactionId,
                amount: req.body.amount,
                projectId: req.body.projectId,
                renewalDate:renewDate,
                paymentDate:currentDate
              };
            var payment = new PaymentModel(obj);
            payment.save((err, data) => {
              if (err) {
                res.send(500, err);
              } else {
                utility.paymentCapture(
                  req.body.transactionId,
                  req.body.amount,
                  (err, data) => {
                    if (err) {
                      console.log("capture err------>", err);
                      res.send(500, err);
                    } else {
                      console.log("capture data----->", data);
                      ActivitiesCardsModel.find({}, (err, data) => {
                        var _activityCardsArr = [];
                        if (err) {
                          res.json(500, {
                            statusCode: 500,
                            err: err
                          });
                        }
                        else if (data) {
                          async.forEachSeries(
                            data,
                            (result, callback) => {
                              console.log("result--------->", result);

                              let obj = {
                                activitiesCardId: result._id,
                                name: result.name,
                                status: "start",
                                fileName: result.fileName,
                                team: result.team,
                                deliverables: result.deliverables,
                                approxDesignHours:result.approxDesignHours,
                                approxTimeline:result.approxTimeline,
                                bigTitles:result.bigTitles,
                                stages:result.stages,
                                bannerURL:result.bannerURL,
                                iconURL:result.iconURL,
                                colorCode:result.colorCode,
                              };
                              _activityCardsArr.push(obj);
                              callback();
                            },
                            err => {
                              ProjectModel.findOne(
                                { _id: req.body.projectId },
                                (err, project) => {
                                  project.paymentDone = true;
                                  project.activities = _activityCardsArr;
                                  project.save((err, data) => {
                                    if (err) return res.status(400).send({ msg: err });
                                    else {
                                      utility.loginByMattermost(env.teamCreatecredentials, (err, login)=>{
                                        if(err){
                                        console.log('add in team error 1');
                                          res.json(500, {
                                            statusCode: 500,
                                            err: err
                                          });
                                        }
                                        else{
                                          let token = login.headers.token;
                                          console.log('token-------->', token)
                                          utility.addSingleUserinClienTeam(teamObject, token, (err, addDesigner)=>{
                                            if(err){
                                              res.json(500,{
                                                statusCode : 500,
                                                err : err
                                              })
                                            }
                                            else if(addDesigner){
                                              paymentController.addDLInSetOfChannels(project,token,(err,addedInChannel)=>{
                                                  if(err){
                                                    console.log("err 10")
                                                    res.json(500,{
                                                      statusCode:500,
                                                      err:err
                                                    })
                                                  }
                                                  else if(addedInChannel){
                                                    res.json(200, {
                                                        statusCode: 200,
                                                        msg:"payment captured successfully",
                                                        data: project
                                                    });
                                                  }
                                              })
                                            }
                                          })
                                        }
                                      })  
                                    }
                                  });
                                }
                              );
                            }
                          );
                        }
                      });
                    }
                  }
                );
              }
            });
          }
        }) 
      }
      else{
          res.json(400,{
            statusCode:400,
            msg:"payment allready done!"
          })
        }
      }
      else{
        res.json(404,{
            statusCode:404,
            msg:"no record found!"
          })
        }
    })
  }
  else{
    res.json(400,{
            statusCode:400,
            msg:"missing parameter!"
        })
  }
};

paymentController.addDLInSetOfChannels=(project,token,channelCallback)=>{
  // ADD DL in design channel
  async.parallel(
    {
      mimifrom1thing: function(callback1){
              let _arr =[{user_id:project.DLead.workspaceId}];
              let _addUserInChannel={
                  teamId:project.teamDetails.teamId,
                  channelId:project.mimiChannelId,
                  userData:_arr,
              }
              utility.addUserinDifferentChannels(_addUserInChannel,token,(err,mimifrom1thingAddedUser)=>{
                if(err){
                  console.log("error in addUserinDifferentChannels review")
                }
                else if(mimifrom1thingAddedUser){
                  callback1(err,mimifrom1thingAddedUser);
                }
              })
           },
      design: function(callback2){
              let _arr =[{user_id:project.DLead.workspaceId}];
              let _addUserInChannel={
                  teamId:project.teamDetails.teamId,
                  channelId:project.designChannelId,
                  userData:_arr,
              }
              utility.addUserinDifferentChannels(_addUserInChannel,token,(err,designAddedUser)=>{
                if(err){
                  console.log("error in addUserinDifferentChannels design")
                }
                else if(designAddedUser){
                  callback2(err,designAddedUser);
                }
              })
           },
      review:function(callback3){
              let _arr =[{user_id:project.DLead.workspaceId}];
              let _addUserInChannel={
                  teamId:project.teamDetails.teamId,
                  channelId:project.reviewChannelId,
                  userData:_arr,
              }
              utility.addUserinDifferentChannels(_addUserInChannel,token,(err,reviewAddedUser)=>{
                if(err){
                  console.log("error in addUserinDifferentChannels review")
                }
                else if(reviewAddedUser){
                  callback3(err,reviewAddedUser);
                }
              })
          }
      },function(err, result){
        if(err){
          console.log("err========>", err)
          channelCallback(err,"");
        }
        else{
          console.log("else========>")
          channelCallback(null,result)
        }
      }
  )
}

paymentController.subscribePlan = (req, res)=>{
  console.log("req------->", req.body);
  var planId, totalCount, period;

  if(req.body.planType==="weekly"){
    if(req.body.discount==='1thing'){
      console.log('discount ------>', env.weekly_12perOffId)
      planId=env.weekly_12perOffId;
      totalCount=env.weekly_count;
      discount=true;
      discountType='12perOff';
    }
    else{
      planId=env.weekly_planId;
      totalCount=env.weekly_count;
      discount=false;
      discountType='';
    }
    
  }
  else if(req.body.planType==="quaterly"){
    planId=env.quaterly_planId;
    totalCount=env.quaterly_count;
  }
  else if(req.body.planType==="yearly"){
    planId=env.yearly_planId;
    totalCount=env.yearly_count;
  }

  ProjectModel.findOne({_id:req.body.projectId, "user.id":req.body.userId},(err, projectData)=>{
    // console.log('project data  --->', projectData)
    if(err){
      res.json(500,{
        statusCode:500,
        err:err,
      })
    }
    else if(projectData){
      console.log('projectData')
      let _data = {
        planId:planId,
        totalCount:totalCount
      }
        utility.subscribePlan(_data, (err, subscriptionData)=>{
          if(err){
            res.json(500,{
              statusCode:500,
              err:err
            })
          }
          else{
            console.log('subscriptionData')
            projectData.subscriptionId=subscriptionData.id;
            projectData.period=req.body.planType;
            projectData.discount=discount;
            projectData.discountType=discountType;
            projectData.save((err, saveProjectData)=>{
              if(err){
                res.json(500,{
                  statusCode:500,
                  err:err
                });
              }
              else{
                res.json(200,{
                  statusCode:200,
                  data:subscriptionData.id
              });
            }
          })
        }
      })
    }
    else{
      res.status(404).send('Not Found!');
    }
  })
}

paymentController.paymentAfterSubscribe = (req, res) =>{
  console.log('req for paymentAfterSubscribe---->', req.body);
  if(req.body.projectId && req.body.userId && req.body.transactionId && req.body.subscriptionId){
    ProjectModel.findOne({ 
      _id : req.body.projectId,
      "user.id" : req.body.userId,
      subscriptionId: req.body.subscriptionId,
     },(err, projectData)=>{
       if(err){
         res.json(500, {
           statusCode:500,
           err:err
         })
       }
       else if(projectData){
         let paidHours=[]; let interval = 0; let nextDate;

          if(projectData.period==='weekly'){
            if(projectData.discount){
              if(projectData.discountType==='12perOff'){
                unitAmount = env.weekly_12perOffAmount;
              }
            }
            else{
                unitAmount = env.weekly_amount;
            }
            
            interval=1;
            paidHours[0]=env.weekly_hours;
            subscriptionCount=env.weekly_count;
            unitHours = env.weekly_hours;
            let startDate = moment().tz('Asia/Kolkata').format('MM/DD/YYYY');
            let nextTemp = moment(startDate, "MM/DD/YYYY").add('days', 7);
            nextDate = nextTemp.format('MM')+'/'+nextTemp.format('DD')+'/'+nextTemp.format('YYYY');
          }
          else if(projectData.period==='quaterly'){
            paidHours[0]=env.quaterly_hours;
            interval=3;
            subscriptionCount=env.quaterly_count;
            unitAmount = env.quaterly_amount;
            unitHours=env.quaterly_hours;

            //monthly date ????
          }
          else if(projectData.period==='yearly'){
            paidHours[0]=env.yearly_hours;
            interval=1;
            subscriptionCount=env.yearly_count;
            unitAmount = env.yearly_amount;
            unitHours=env.quaterly_hours;

            //yearly date ????
          }
          projectData.paidHours=paidHours;
          projectData.save((err, projectSave)=>{
            if(err){
              res.json(500, {
                statusCode:500,
                err:err
              })
            }
            else{
              let paymentData={};
              PaymentModel.findOne({subscriptionId:req.body.subscriptionId},
                (err, paymentData)=>{
                  if(err){
                    res.status(500).send({err:err});
                  }
                  else if(paymentData){
                    paymentData={};
                    paymentData.transactionId=req.body.transactionId;
                    paymentData.subscriptionId=req.body.subscriptionId;
                    paymentData.paymentSignature=req.body.paymentSignature;
                    paymentData.period=projectData.period;
                    paymentData.interval=interval;
                    paymentData.subscriptionCount=subscriptionCount;
                    paymentData.paidCount=1;
                    paymentData.unitAmount=unitAmount;
                    paymentData.paidHours=paidHours;
                    paymentData.projectId=req.body.projectId;
                    paymentData.nextDewDate=nextDate;
                    paymentData.user.userId=req.body.userId;
                    paymentData.user.name=req.body.name
                        
                    paymentData.unitHours=unitHours;
                    paymentData.discount=projectData.discount;
                    paymentData.discountType=projectData.discountType;  
                    paymentData.paymentDate=moment().tz('Asia/Kolkata').format('MM/DD/YYYY');
                    paymentModel.save((err, paymentDataUpdate)=>{
                      if(err){
                        res.status(500).send({err:err});
                      }
                      else if(paymentDataUpdate){
                        paymentController.addActivitiesInProject(req, paymentDataUpdate,(err, data)=>{
                          if(err){
                            res.status(500).send({err:err});
                          }
                          else{
                            res.status(200).send(data);
                          }
                        });
                      }
                    });
                  }
                  else{
                    paymentData={};
                    paymentObj = {
                        transactionId:req.body.transactionId,
                        subscriptionId:req.body.subscriptionId,
                        paymentSignature:req.body.paymentSignature,
                        period:projectData.period,
                        interval:interval,
                        subscriptionCount:subscriptionCount,
                        paidCount:1,
                        unitAmount:unitAmount,
                        paidHours:paidHours,
                        projectId:req.body.projectId,
                        nextDewDate:nextDate,
                        user:{
                            userId:req.body.userId,
                            name:projectData.user.name,
                        },
                        unitHours:unitHours,
                        discount:projectData.discount,
                        discountType:projectData.discountType,  
                        paymentDate:moment().tz('Asia/Kolkata').format('MM/DD/YYYY'),
                    }
                    let paymentModel = new PaymentModel(paymentObj);
                    paymentModel.save((err, savePaymentData)=>{
                      if(err){
                        res.status(500).send({err:err});
                      }
                      else if(savePaymentData){
                        paymentController.addActivitiesInProject(req, savePaymentData,(err, data)=>{
                          if(err){
                            res.status(500).send({err:err});
                          }
                          else{
                            res.status(200).send(data);
                          }
                        });
                      }
                    })
                  }
                })
              // var paymentObj = {
              //     transactionId:req.body.transactionId,
              //     subscriptionId:req.body.subscriptionId,
              //     paymentSignature:req.body.paymentSignature,
              //     period:projectData.period,
              //     interval:interval,
              //     subscriptionCount:subscriptionCount,
              //     paidCount:1,
              //     unitAmount:unitAmount,
              //     paidHours:paidHours,
              //     projectId:req.body.projectId,
              //     nextDewDate:nextDate,
              //     user:{
              //         userId:req.body.userId,
              //         name:projectData.user.name,
              //     },
              //     unitHours:unitHours,
              //     discount:projectData.discount,
              //     discountType:projectData.discountType,  
              //     paymentDate:moment().tz('Asia/Kolkata').format('MM/DD/YYYY'),
              // }
              // let paymentModel = new PaymentModel(paymentObj);
              // paymentModel.save((err, paymentData)=>{
              //   if(err){
              //     res.json(500,{
              //       statusCode:500,
              //       err:err
              //     })
              //   }
              //   else{
              //     console.log('payment data-------->', paymentData);
              //     ActivitiesCardsModel.find({}, (err, data) => {
              //       var _activityCardsArr = [];
              //       if (err) {
              //         res.json(500, {
              //           statusCode: 500,
              //           err: err
              //         });
              //       }
              //       else if (data) {
              //         async.forEachSeries(
              //           data,
              //           (result, callback) => {
              //             // console.log("result--------->", result);

              //             let obj = {
              //               activitiesCardId: result._id,
              //               name: result.name,
              //               status: "start",
              //               fileName: result.fileName,
              //               team: result.team,
              //               deliverables: result.deliverables,
              //               approxDesignHours:result.approxDesignHours,
              //               approxTimeline:result.approxTimeline,
              //               bigTitles:result.bigTitles,
              //               stages:result.stages,
              //               bannerURL:result.bannerURL,
              //               iconURL:result.iconURL,
              //               colorCode:result.colorCode,
              //             };
              //             _activityCardsArr.push(obj);
              //             callback();
              //           },
              //           err => {
              //             ProjectModel.findOne(
              //               { _id: req.body.projectId },
              //               (err, project) => {
              //                 project.paymentDone = true;
              //                 project.activities = _activityCardsArr;
              //                 project.save((err, data) => {
              //                   if (err) return res.status(500).send({ msg: err });
              //                   else {
              //                     res.json(200,{
              //                         statusCode:200,
              //                         msg:'Payment Successfully Done!'
              //                     });
              //                   }
              //                 });
              //               }
              //             );
              //           }
              //         );
              //       }
              //     });
              //   }
              // });
            }
          });
        }
        else{
          res.json(400,{
            statusCode:400,
            msg:"payment allready done!"
          })
        }
     });
  }
  else{
    res.json(400, {
      statusCode:400,
      msg:'Incomplete Arguments!'
    });
  }  


}

paymentController.addActivitiesInProject = (req, paymentData, mainCallback)=>{
  ActivitiesCardsModel.find({}, (err, data) => {
    var _activityCardsArr = [];
    if (err) {
      mainCallback({err:err});
    }
    else if (data) {
      async.forEachSeries(
        data,
        (result, callback) => {
          // console.log("result--------->", result);

          let obj = {
            activitiesCardId: result._id,
            name: result.name,
            status: "start",
            fileName: result.fileName,
            team: result.team,
            deliverables: result.deliverables,
            approxDesignHours:result.approxDesignHours,
            approxTimeline:result.approxTimeline,
            bigTitles:result.bigTitles,
            stages:result.stages,
            bannerURL:result.bannerURL,
            iconURL:result.iconURL,
            colorCode:result.colorCode,
          };
          _activityCardsArr.push(obj);
          callback();
        },
        err => {
          ProjectModel.findOne(
            { _id: req.body.projectId },
            (err, project) => {
              project.paymentDone = true;
              project.activities = _activityCardsArr;
              project.save((err, data) => {
                if (err) {
                  mainCallback({err:err});
                }
                else {
                  mainCallback(null,{msg:'Payment Successfully Done!'})
                }
              });
            }
          );
        }
      );
    }
  });
}



module.exports = paymentController;
