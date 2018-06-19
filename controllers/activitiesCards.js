const ActivitiesCardsModel = require("../models/activitiesCards");
const UserModel = require("../models/user");
const ProjectModel = require("../models/project");
const ProjectPaymentModel = require("../models/projectPayment");
const DesignerModel = require("../models/designer");
const ActivitiesLog = require("../models/activities_log");
const ProductJourneyModel = require("../models/productJourney");
const PaymentModel = require("../models/projectPayment");
const utility = require("../utils/utility");
const env = require("../utils/env");
const moment = require("moment-timezone");
var express = require('express');
var app = express();
const mongoose = require('mongoose');
const logger1 = require("../utils/logger");
const logger = logger1.logger1;

var xlsxtojson = require("xls-to-json");
var multer = require("multer");
var path = require("path");
var async = require("async");
var fs = require("fs");
var cron = require("node-cron");

var ActivitiesCardController = {};

//POST DATA FROM EXCEL SHEET INTO DATABASE
ActivitiesCardController.addActivityCardsFromExcelSheet = (req, res) => {
  var exceltojson, extension, fileExtension;
  var count = 0;
  var storage = multer.diskStorage({
    //multers disk storage settings
    destination: function(req, file, cb) {
      cb(null, "./");
    },
    filename: function(req, file, cb) {
      cb(
        null,
        "activityfile" +
          "." +
          file.originalname.split(".")[file.originalname.split(".").length - 1]
      );
    }
  });

  var upload = multer({
    //multer settings
    storage: storage,
    fileFilter: function(req, file, callback) {
      //file filter
      if (
        ["xls", "xlsx"].indexOf(
          file.originalname.split(".")[file.originalname.split(".").length - 1]
        ) === -1
      ) {
        return callback(new Error("Wrong extension type"));
      }
      callback(null, true);
    }
  }).single("file");
  upload(req, res, function(err) {
    console.log("err in uploading file", req.file, err);
    if (err) {
      console.log("err in 1st", err);
      res.json({ error_code: 1, err_desc: err });
      return;
    }
    /** Multer gives us file info in req.file object */
    if (!req.file) {
      console.log("err in req.file", err);
      res.json({ error_code: 1, err_desc: "No file passed" });
      return;
    }
    if (
      req.file.originalname.split(".")[
        req.file.originalname.split(".").length - 1
      ] === "xlsx"
    ) {
      exceltojson = xlsxtojson;
    } else {
      exceltojson = xlstojson;
    }
    try {
      exceltojson(
        {
          input: req.file.path,
          output: null, //since we don't need output.json
          lowerCaseHeaders: true
        },
        function(err, result) {
          if (err) {
            console.log("err in 2nd", err);
            return res.json({ error_code: 1, err_desc: err, data: null });
          } else {
            var count = 1;
            let domain = "";
            async.forEachSeries(
              result,
              (data, callback) => {
                console.log("Data-----------", data);
                // callback();
                if (data.Name) {
                  let myobj = {
                    name: data.Name.trim(),
                    fileName: data.FileName.trim(),
                    team:
                      data.Team === ""
                        ? []
                        : utility.trimString(data.Team.split(",")),
                    deliverables:
                      data.Deliverables === ""
                        ? []
                        : utility.trimString(data.Deliverables.split(",")),
                    approxDesignHours: data.ApproxDesignHours.trim(),
                    approxTimeline: data.ApproxTimeline.trim(),
                    bigTitles: data.BigTitles.trim(),
                    stages:
                      data.Stages === ""
                        ? []
                        : utility.trimString(data.Stages.split(",")),
                    bannerURL: data.BannerURL,
                    iconURL: data.IconURL,
                    colorCode: data.ColorCode
                  };
                  let activitiesCards = new ActivitiesCardsModel(myobj);
                  activitiesCards.save((err, data) => {
                    if (err) {
                      console.log("errror in saving", err);
                      callback(err, null);
                    } else {
                      console.log("data==", data);
                      callback();
                    }
                  });
                } else {
                  callback(true, "no data");
                }
              },
              err => {
                if (err) {
                  console.log("err", err);
                  return res.json({
                    data: "Invalid Data",
                    err: "not uploaded file"
                  });
                } else {
                  console.log("lastest Approach");
                  return res.json({
                    error_code: 0,
                    err_desc: null,
                    message: "Successfully uploaded"
                  });
                }
              }
            );
          }
        }
      );
    } catch (e) {
      res.json({ error_code: 1, err_desc: "Corupted excel file" });
    }

    try {
      fs.unlinkSync(req.file.path);
    } catch (e) {
      //error deleting the file
      console.log("in catch");
    }
  });
};

ActivitiesCardController.changeActivityStatus = (req, res) => {
  console.log("starting point in changeActivityStatus");
  var userInfo = {};
  var projectInfo = {};
  var paymentInfo = {};
  var designerInfo = {};
  var folderName = "";
  var fileName = "";
  var folderId = "";
  var uploadData = {};

  var today = new Date();
  let daysArr = [];
  for (let i = 0; i < 57; i++) {
    let date = today.toString().split(" ");
    // console.log("date====>", date);
    daysArr.push(date[2] + "-" + date[1] + "-" + date[3]);
    today.setDate(today.getDate() + 1);
  }

  if (req.body.projectId && req.body.userId && req.body.activityId) {
    //find user data
    UserModel.findOne({ userId: req.body.userId }, (err, userData) => {
      if (err) {
        console.log("err1-------changeActivityStatus ");
        res.json(500, {
          statusCode: 500,
          err: err
        });
      } else if (userData) {
        // console.log("data-------->", userData);
        userInfo = {
          name: userData.name,
          email: userData.email,
          mobile: userData.mobile
        };
        ProjectPaymentModel.findOne(
          {
            projectId: req.body.projectId,
            "user.userId": req.body.userId
          },
          (err, paymentData) => {
            if (err) {
              console.log("err2-------changeActivityStatus ");
              res.json(500, {
                statusCode: 500,
                err: err
              });
            } else if (paymentData) {
              // console.log("paymentData------->", paymentData);
              //payment info
              paymentInfo = {
                kickOffDate: paymentData.paymentDate,
                renewalDate: paymentData.renewalDate
              };
              ProjectModel.findOne(
                {
                  _id: req.body.projectId
                },
                (err, projectData) => {
                  if (err) {
                    console.log("err3-------changeActivityStatus ");
                    res.json(500, {
                      statusCode: 500,
                      err: err
                    });
                  } else if (projectData) {
                    DesignerModel.findOne(
                      { userId: projectData.DLead.workspaceId },
                      (err, designerData) => {
                        if (err) {
                          console.log("err4-------changeActivityStatus ");
                          res.json(500, {
                            statusCode: 500,
                            err: err
                          });
                        } else {
                          //dL info
                          designerInfo = {
                            name: designerData.name,
                            email: designerData.email,
                            mobile: designerData.mobile
                          };
                          if (projectData.paymentDone) {
                            //project Info
                            projectInfo = {
                              name: projectData.name,
                              link:
                                projectData.projectType.link === ""
                                  ? "--"
                                  : projectData.projectType.link,
                              teamName: projectData.teamDetails.name
                            };
                            if (projectData.folderCreated) {
                              console.log("m in folder all ready created");

                              folderId = projectData.folderId;
                              async.forEachSeries(
                                projectData.activities,
                                (activityData, callback2) => {
                                  // console.log("data----->created", activityData);
                                  if (
                                    activityData._id.toString() ===
                                      req.body.activityId &&
                                    !activityData.fileCreated
                                  ) {
                                    fileName = activityData.fileName;
                                    statgesArr = activityData.stages;
                                    console.log("m in allready created file");
                                    callback2("success", null);
                                  } else {
                                    callback2();
                                  }
                                },
                                err => {
                                  if (err === "success") {
                                    console.log("m in existing folder");
                                    //write code here for editing in excel sheet then upload it

                                    uploadData = {
                                      fileName: fileName,
                                      statgesArr: statgesArr,
                                      folderName: "",
                                      userInfo: userInfo,
                                      projectInfo: projectInfo,
                                      designerInfo: designerInfo,
                                      paymentInfo: paymentInfo,
                                      folderId: folderId,
                                      days: daysArr
                                    };
                                    utility.uploadSheetOnDrive(
                                      uploadData,
                                      (err, result) => {
                                        if (err) {
                                          console.log(
                                            "err5-------changeActivityStatus "
                                          );
                                          res.json(500, {
                                            statusCode: 500,
                                            err: err
                                          });
                                        } else {
                                          console.log(
                                            "come back from uploadSheetOnDrive   ",
                                            result
                                          );
                                          let update = {
                                            "activities.$.status": "ongoing",
                                            "activities.$.fileId":
                                              result.fileId,
                                            "activities.$.fileCreated": true,
                                            "activities.$.sheetFolders":
                                              result.sheet_FolderId
                                          };

                                          ActivitiesCardController.saveAfterUploadedSheet(
                                            uploadData,
                                            req,
                                            update,
                                            (err, uploadCallback) => {
                                              if (err) {
                                                console.log(
                                                  "err6-------changeActivityStatus "
                                                );
                                                res.json(500, {
                                                  statusCode: 500,
                                                  err: err
                                                });
                                              } else {
                                                res.json(200, {
                                                  statusCode: 200,
                                                  msg: uploadCallback
                                                });
                                              }
                                            }
                                          );
                                        }
                                      }
                                    );
                                  } else {
                                    res.json(300, {
                                      statusCode: 300,
                                      msg:
                                        "file already uploaded! or incorrect activity id!"
                                    });
                                  }
                                }
                              );
                            } else {
                              console.log("m in new folder ");

                              //folder and file name for 1st time
                              folderName =
                                projectData.name +
                                "_" +
                                utility.randomString(3);
                              async.forEachSeries(
                                projectData.activities,
                                (activityData, callback1) => {
                                  // console.log("data---->", activityData);
                                  if (
                                    activityData._id.toString() ===
                                    req.body.activityId
                                  ) {
                                    fileName = activityData.fileName;
                                    statgesArr = activityData.stages;
                                    callback1("success", null);
                                  } else {
                                    callback1();
                                  }
                                },
                                err => {
                                  console.log("m in  async.forEachSeries");
                                  if (err === "success") {
                                    console.log("m in  success");
                                    //write code here for editing in excel sheet then upload it

                                    uploadData = {
                                      fileName: fileName,
                                      statgesArr: statgesArr,
                                      folderName: folderName,
                                      userInfo: userInfo,
                                      projectInfo: projectInfo,
                                      designerInfo: designerInfo,
                                      paymentInfo: paymentInfo,
                                      folderId: "",
                                      days: daysArr
                                    };
                                    console.log(
                                      "before uploadSheetOnDrive   ==========="
                                    );
                                    utility.uploadSheetOnDrive(
                                      uploadData,
                                      (err, result) => {
                                        if (err) {
                                          console.log(
                                            "err8-------changeActivityStatus "
                                          );
                                          res.json(500, {
                                            statusCode: 500,
                                            err: err
                                          });
                                        } else {
                                          console.log(
                                            "result new folder",
                                            result
                                          );

                                          let update = {
                                            "activities.$.status": "ongoing",
                                            "activities.$.fileId":
                                              result.fileId,
                                            "activities.$.fileCreated": true,
                                            "activities.$.sheetFolders":
                                              result.sheet_FolderId,
                                            folderId: result.folder_id,
                                            folderCreated: true
                                          };

                                          // update in project model and productJourney and activity logs
                                          ActivitiesCardController.saveAfterUploadedSheet(
                                            uploadData,
                                            req,
                                            update,
                                            (err, uploadCallback) => {
                                              if (err) {
                                                console.log(
                                                  "err9-------changeActivityStatus "
                                                );
                                                res.json(500, {
                                                  statusCode: 500,
                                                  err: err
                                                });
                                              } else {
                                                console.log("m updated");
                                                res.json(200, {
                                                  statusCode: 200,
                                                  msg: uploadCallback
                                                });
                                              }
                                            }
                                          );
                                        }
                                      }
                                    );
                                  } else {
                                    res.json(300, {
                                      statusCode: 300,
                                      msg: "Incorrect activity id"
                                    });
                                  }
                                }
                              );
                            }
                          } else {
                            res.json(402, {
                              statusCode: 402,
                              msg: "Payment required!"
                            });
                          }
                        }
                      }
                    );
                  }
                }
              );
            } else {
              res.json(404, {
                statusCode: 404,
                msg: "Payment Data Not Found!"
              });
            }
          }
        );
      } else {
        res.json(404, {
          statusCode: 404,
          msg: "Record Not Found!"
        });
      }
    });
  } else {
    res.json(400, {
      statusCode: 400,
      msg: "Bad Request!"
    });
  }
};
ActivitiesCardController.startExistingActivity = (req, res) => {
  // let obj = {
  //   "projectId":"",
  //   "userId":"",
  //   "activityId":"",
  //   "activityStatus": "ongoing",
  //   "fileId":result.fileId,
  //   "sheetFolderId":result.sheet_FolderId,
  //   "resource":[],
  //   "activityName":"",
  //   "statgesArr":[],
  //   }
  let resource = [
    {
      name: "Workspace by 1THING",
      purpose: "Communications",
      link: env.base_path + req.body.teamName + "/channels/town-square"
    },
    {
      name: "Google Drive",
      purpose: "Documents",
      link: "https://drive.google.com/drive/folders/" + req.body.folder_id
    }
  ];
  let update = {
    "activities.$.status": "ongoing",
    "activities.$.fileId": req.body.fileId,
    "activities.$.fileCreated": true,
    "activities.$.sheetFolders": req.body.sheet_FolderId
  };
  let stagesArr = ["Stage1", "Stage 2", "Stage 3"];
  ProjectModel.findOneAndUpdate(
    {
      _id: req.body.projectId,
      "user.id": req.body.userId,
      paymentDone: true,
      "activities._id": req.body.activityId
    },
    { $set: update },
    { new: true },
    (err, data) => {
      if (err) {
        console.log("err in 1st------>", err);
        res.json(500, {
          statusCode: 500,
          err: err
        });
      }
      if (data) {
        let obj = {
          activityId: req.body.activityId,
          projectId: req.body.projectId,
          userId: req.body.userId,
          // startDate: new Date().toString(),
          startDate: "",
          "aboutPc.activityName": req.body.fileName,
          endDate: "",
          resources: resource,
          allStages: stagesArr
        };
        let productJourney = new ProductJourneyModel(obj);
        productJourney.save((err, pJData) => {
          if (err) {
            res.json(500, {
              statusCode: 500,
              err: err
            });
          } else {
            // uploadCallback(null, data)
            res.status(200).send({ data: data });
          }
        });
      } else {
        // uploadCallback(null, "no data");
        res.status(200).send({ data: "no data" });
      }
    }
  );
};

ActivitiesCardController.saveAfterUploadedSheet = (uploadData,req,update,uploadCallback) => {
  let resource = [
    {
      name: "Workspace by 1THING",
      purpose: "Communications",
      link:
        env.base_path +
        uploadData.projectInfo.teamName +
        "/channels/town-square"
    },
    {
      name: "Google Drive",
      purpose: "Documents",
      link:
        "https://drive.google.com/drive/folders/" +
        (uploadData.folderId === "" ? update.folderId : uploadData.folderId)
    }
  ];

  var activityLog = {};
  ProjectModel.findOneAndUpdate(
    {
      _id: req.body.projectId,
      "user.id": req.body.userId,
      paymentDone: true,
      "activities._id": req.body.activityId
    },
    { $set: update },
    { new: true },
    (err, data) => {
      if (err) {
        console.log("err in 1st------>", err);
        res.json(500, {
          statusCode: 500,
          err: err
        });
      }
      if (data) {
        let obj = {
          activityId: req.body.activityId,
          projectId: req.body.projectId,
          userId: req.body.userId,
          // startDate: new Date().toString(),
          startDate: "",
          "aboutPc.activityName": uploadData.fileName,
          endDate: "",
          resources: resource,
          allStages: uploadData.statgesArr
        };
        let productJourney = new ProductJourneyModel(obj);
        productJourney.save((err, pJData) => {
          if (err) {
            res.json(500, {
              statusCode: 500,
              err: err
            });
          } else {
            uploadCallback(null, data);
          }
        });
      } else {
        uploadCallback(null, "no data");
      }
    }
  );
};

cron.schedule("0 21 * * *", function() {
  let date = new Date();
  console.log(
    "running a task every minute",
    date.getHours(),
    ":",
    date.getMinutes()
  );
  ActivitiesCardController.downloadAndReadExcelSheet1();
});
ActivitiesCardController.downloadAndReadExcelSheet = (req, res) => {
  var date = new Date();
  console.log("time is : ", date.getHours(), " : ", date.getMinutes());
  ProjectModel.find({ folderCreated: true }, (err, projectData) => {
    if (err) {
      console.log("err in 1");
    } else if (projectData) {
      console.log("length----------->", projectData.length);
      let _arr = [];
      async.forEachSeries(
        projectData,
        (projectResult, callback) => {
          // console.log('projecrResult*********************', projecrResult)
          async.forEachSeries(
            projectResult.activities,
            (result, callback1) => {
              // console.log("result.fileCreated1=======>",projectResult.name, "file name=========>", result.fileName)
              if (result.fileCreated) {
                utility.downloadExcelSheetFromDrive(
                  result.fileId,
                  (err, downLoadData) => {
                    // console.log("result.fileCreated2=======>",projectResult.name, "file name=========>", result.fileName)
                    if (err) {
                      console.log("err in 2");
                      callback1();
                    } else if (downLoadData) {
                      // console.log('yesss');
                      utility.readAllCellsValueOfExcelSheet(
                        result.status,
                        (err, toUpdateData) => {
                          if (err) {
                            console.log("err in 3");
                            callback1();
                          } else if (toUpdateData.length !== 0) {
                            // console.log('toUpdateData====>',toUpdateData)
                            let _projectDataUpdate = {
                              "activities.$.status":
                                toUpdateData.aboutPc.sheetStatus ===
                                  "Yet to Start" ||
                                toUpdateData.aboutPc.sheetStatus ===
                                  "In Progress"
                                  ? "ongoing"
                                  : "Completed",
                              "activities.$.weeks":
                                toUpdateData.dailyUpdates.weeks,
                              "activities.$.startDate":
                                toUpdateData.aboutPc.startDate,
                              "activities.$.endDate":
                                toUpdateData.aboutPc.endDate
                            };
                            ProjectModel.findOneAndUpdate(
                              { "activities._id": result._id },
                              { $set: _projectDataUpdate },
                              { new: true },
                              (err, updatedProject) => {
                                if (err) {
                                  console.log("err in update");
                                  callback1();
                                } else if (updatedProject) {
                                  ProductJourneyModel.findOne(
                                    { activityId: result._id },
                                    (err, findProductJourney) => {
                                      if (err) {
                                        console.log("err in 4");
                                        callback1();
                                      } else if (findProductJourney) {
                                        console.log(
                                          "things to do",
                                          toUpdateData.dailyUpdates.weeks
                                        );
                                        findProductJourney.aboutPc.sheetStatus =
                                          toUpdateData.aboutPc.sheetStatus;
                                        findProductJourney.startDate =
                                          toUpdateData.aboutPc.startDate;
                                        findProductJourney.endDate =
                                          toUpdateData.aboutPc.endDate;
                                        findProductJourney.rightDesignTeam =
                                          toUpdateData.rdt;
                                        findProductJourney.resources =
                                          toUpdateData.resource;
                                        findProductJourney.thingsToDo =
                                          toUpdateData.thingsToDo.thingsToDoData;
                                        findProductJourney.dailyUpdates =
                                          toUpdateData.dailyUpdates.dailyData;
                                        findProductJourney.totalMinHours =
                                          toUpdateData.thingsToDo.lastRowData.totalMinHours;
                                        findProductJourney.totalMaxHours =
                                          toUpdateData.thingsToDo.lastRowData.totalMaxHours;
                                        findProductJourney.inProgress =
                                          toUpdateData.dailyUpdates.inProgress;
                                        findProductJourney.completeted =
                                          toUpdateData.dailyUpdates.completeted;
                                        // findProductJourney.endDate =
                                        //   toUpdateData.thingsToDo.lastRowData.endDate;
                                        findProductJourney.weeks =
                                          toUpdateData.dailyUpdates.weeks;

                                        findProductJourney.save(
                                          (err, updatedProductJourney) => {
                                            if (err) {
                                              callback1();
                                            } else {
                                              // console.log("updatedProductJourney" ,updatedProductJourney)
                                              let _data = {
                                                updatedProject: updatedProject,
                                                updatedProductJourney: updatedProductJourney
                                              };
                                              callback1();
                                            }
                                          }
                                        );
                                      } else {
                                        console.log("findProductJourney else");
                                        callback1();
                                      }
                                    }
                                  );
                                } else {
                                  callback1();
                                }
                              }
                            );
                          } else {
                            console.log("out download not ready");
                            callback1();
                          }
                        }
                      );
                    } else {
                      console.log("out not downloaded");
                      callback1();
                    }
                  }
                );
              } else {
                callback1();
              }
            },
            err => {
              callback();
            }
          );
        },
        err => {
          console.log("Data successfully updated!");
        }
      );
    }
  });
};

//addons method
ActivitiesCardController.downloadAndReadExcelSheet1 = (req, res) => {
  var date = new Date();
  var hoursArr = [];
  var nextPaymentDate = "";
  // console.log("time is : ", date.getHours(), " : ", date.getMinutes());
  ProjectModel.find({ folderCreated: true}, (err, projectData) => {
    if (err) {
      console.log("err in 1");
    } else if (projectData) {
      console.log("length----------->", projectData.length);
      let _arr = [];
      async.forEachSeries(
        projectData,
        (projectResult, callback) => {
          ProjectPaymentModel.findOne(
            { projectId: projectResult._id },
            (err, paymentData) => {
              if (err) {
                console.log("err in project payment ", err);
                callback();
              } else if (paymentData) {
                console.log(
                  "projecrResult*********************",
                  projectResult.name,
                  paymentData.paymentDate
                );
                let startDate = paymentData.paymentDate;
                async.forEachSeries(
                  projectResult.activities,
                  (result, callback1) => {
                    // console.log("result.fileCreated1=======>",projectResult.name, "file name=========>", result.fileName)
                    if (result.fileCreated) {
                      utility.downloadExcelSheetFromDrive(
                        result.fileId,
                        (err, downLoadData) => {
                          // console.log("result.fileCreated2=======>",projectResult.name, "file name=========>", result.fileName)
                          if (err) {
                            console.log("err in 2");
                            callback1();
                          } else if (downLoadData) {
                            // console.log('yesss');
                            utility.readAllCellsValueOfExcelSheet1(
                              result.status,
                              startDate,
                              projectResult.name,
                              (err, toUpdateData) => {
                                if (err) {
                                  console.log("err in 3");
                                  callback1();
                                } else if (toUpdateData.length !== 0) {
                                  console.log(
                                    "toUpdateData====>",
                                    toUpdateData.dailyUpdates.weeks
                                  );
                                  let _projectDataUpdate = {
                                    "activities.$.status":
                                      toUpdateData.aboutPc.sheetStatus ===
                                        "Yet to Start" ||
                                      toUpdateData.aboutPc.sheetStatus ===
                                        "In Progress"
                                        ? "ongoing"
                                        : "Completed",
                                    "activities.$.weeks":
                                      toUpdateData.dailyUpdates.weeks,
                                    "activities.$.startDate":
                                      toUpdateData.aboutPc.startDate,
                                    "activities.$.endDate":
                                      toUpdateData.aboutPc.endDate
                                  };
                                  ProjectModel.findOneAndUpdate(
                                    { "activities._id": result._id },
                                    { $set: _projectDataUpdate },
                                    { new: true },
                                    (err, updatedProject) => {
                                      if (err) {
                                        console.log("err in update");
                                        callback1();
                                      } else if (updatedProject) {
                                        ProductJourneyModel.findOne(
                                          { activityId: result._id },
                                          (err, findProductJourney) => {
                                            if (err) {
                                              console.log("err in 4");
                                              callback1();
                                            } else if (findProductJourney) {
                                              console.log(
                                                "things to do",
                                                toUpdateData.dailyUpdates.weeks
                                              );
                                              findProductJourney.aboutPc.sheetStatus =
                                                toUpdateData.aboutPc.sheetStatus;
                                              findProductJourney.startDate =
                                                toUpdateData.aboutPc.startDate;
                                              findProductJourney.endDate =
                                                toUpdateData.aboutPc.endDate;
                                              findProductJourney.rightDesignTeam =
                                                toUpdateData.rdt;
                                              findProductJourney.resources =
                                                toUpdateData.resource;
                                              findProductJourney.thingsToDo =
                                                toUpdateData.thingsToDo.thingsToDoData;
                                              findProductJourney.dailyUpdates =
                                                toUpdateData.dailyUpdates.dailyData;
                                              findProductJourney.totalMinHours =
                                                toUpdateData.thingsToDo.lastRowData.totalMinHours;
                                              findProductJourney.totalMaxHours =
                                                toUpdateData.thingsToDo.lastRowData.totalMaxHours;
                                              // findProductJourney.inProgress =
                                              //   toUpdateData.dailyUpdates.inProgress;
                                              // findProductJourney.completeted =
                                              //   toUpdateData.dailyUpdates.completeted;
                                              // findProductJourney.endDate =
                                              //   toUpdateData.thingsToDo.lastRowData.endDate;
                                              findProductJourney.weeks =
                                                toUpdateData.dailyUpdates.weeks;

                                              findProductJourney.save(
                                                (
                                                  err,
                                                  updatedProductJourney
                                                ) => {
                                                  if (err) {
                                                    callback1();
                                                  } else {
                                                    // console.log("updatedProductJourney" ,updatedProductJourney)
                                                    let _data = {
                                                      updatedProject: updatedProject,
                                                      updatedProductJourney: updatedProductJourney
                                                    };
                                                    callback1();
                                                  }
                                                }
                                              );
                                            } else {
                                              console.log(
                                                "findProductJourney else"
                                              );
                                              callback1();
                                            }
                                          }
                                        );
                                      } else {
                                        callback1();
                                      }
                                    }
                                  );
                                } else {
                                  console.log("out download not ready");
                                  callback1();
                                }
                              }
                            );
                          } else {
                            console.log("out not downloaded");
                            callback1();
                          }
                        }
                      );
                    } else {
                      callback1();
                    }
                  },
                  err => {
                    // console.log('projecrResult*********************', paymentData);

                    let dewDate = moment(new Date(paymentData.nextDewDate))
                      .subtract(1, "days")
                      .format("MM/DD/YYYY");
                    let currentDate = moment()
                      .tz("Asia/Kolkata")
                      .format("MM/DD/YYYY");
                    console.log("dewDate -> ", dewDate);
                    // if(currentDate===dewDate){
                    // console.log(' satisfy condition')
                    ProjectModel.findOne(
                      { _id: paymentData.projectId },
                      (err, projects) => {
                        if (err) {
                          console.log("error in calculating hours 1");
                          callback();
                        } else {
                          async.waterfall(
                            [
                              function(totalHoursCallback) {
                                let count = 0;
                                (hoursArr = []), (Total = []);
                                // console.log('projects ------->', projects)
                                async.forEachSeries(
                                  projects.activities,
                                  (hoursresult, hoursCallback) => {
                                    //  console.log('hoursresult ------>', hoursresult)
                                    if (
                                      hoursresult.weeks.length > 0 &&
                                      count == 0
                                    ) {
                                      //  console.log('hy-------->', hoursresult.weeks);
                                      hoursArr = hoursresult.weeks;
                                      count++;
                                      hoursCallback();
                                    } else if (
                                      hoursresult.weeks.length > 0 &&
                                      count > 0
                                    ) {
                                      let arr1 = [];
                                      arr1 = hoursresult.weeks;
                                      // let maxLen = arr1.length>hoursArr.length?arr1.length:hoursArr.length;
                                      let maxArr = [];
                                      maxArr =
                                        arr1.length > hoursArr.length
                                          ? arr1
                                          : hoursArr;
                                      let i = 0;
                                      async.forEach(
                                        maxArr,
                                        (item, eachCallback) => {
                                          let a =
                                            arr1[i] === undefined ? 0 : arr1[i];
                                          let b =
                                            hoursArr[i] === undefined
                                              ? 0
                                              : hoursArr[i];
                                          Total.push(a + b);
                                          i++;
                                          eachCallback();
                                        },
                                        err => {
                                          hoursArr = [];
                                          hoursArr = Total;
                                          Total = [];
                                          hoursCallback();
                                        }
                                      );
                                    } else {
                                      hoursCallback();
                                    }
                                  },
                                  err => {
                                    totalHoursCallback(null, hoursArr);

                                    //   callback();
                                  }
                                );
                              },
                              function(workingHours, extraAmountCallback) {
                                console.log(
                                  "callback called====================",
                                  workingHours,
                                  "\n paidCount = ",
                                  paymentData.paidCount,
                                  "\n paidHours = ",
                                  paymentData.paidHours
                                );

                                let paidCount = paymentData.paidCount;
                                let paidHours = paymentData.paidHours;
                                // let workingHours = hoursArr;
                                let extraAmount = 0;
                                let i = 0;
                                if (paidHours.length >= workingHours.length) {
                                  i = 0;
                                  console.log("in small");
                                  async.forEach(
                                    paidHours,
                                    (item, eachCallback) => {
                                      if (workingHours[i] > paidHours[i]) {
                                        extraAmount =
                                          extraAmount +
                                          (workingHours[i] - paidHours[i]);
                                        i++;
                                        eachCallback();
                                      } else {
                                        i++;
                                        eachCallback();
                                      }
                                    },
                                    err => {
                                      console.log(
                                        "in extra amount call",
                                        workingHours,
                                        extraAmount.toFixed(2)
                                      );
                                      extraAmountCallback(
                                        null,
                                        workingHours,
                                        extraAmount.toFixed(2)
                                      );
                                    }
                                  );
                                } else {
                                  console.log("in greater");
                                  i = 0;
                                  async.forEach(
                                    workingHours,
                                    (item, eachCallback) => {
                                      console.log(
                                        "paid hours = ",
                                        paidHours[i] === undefined
                                          ? 0
                                          : paidHours[i]
                                      );
                                      let _paidHours =
                                        paidHours[i] === undefined
                                          ? 0
                                          : paidHours[i];
                                      if (workingHours[i] > _paidHours) {
                                        extraAmount =
                                          extraAmount +
                                          (workingHours[i] - _paidHours);
                                        i++;
                                        eachCallback();
                                      } else {
                                        i++;
                                        eachCallback();
                                      }
                                    },
                                    err => {
                                      console.log(
                                        "in extra amount call",
                                        workingHours,
                                        extraAmount.toFixed(2)
                                      );
                                      extraAmountCallback(
                                        null,
                                        workingHours,
                                        extraAmount.toFixed(2)
                                      );
                                    }
                                  );
                                }
                              }
                            ],
                            function(err, workingHours, extraHours) {
                              console.log(
                                "workingHours= ",
                                workingHours,
                                "extraHours = ",
                                extraHours
                              );
                              paymentData.workingHours = workingHours;
                              paymentData.save((err, saveInPayment) => {
                                if (err) {
                                  console.log("error in saving working hours");
                                  callback();
                                } else if (saveInPayment) {
                                  console.log("save in payment ",currentDate,dewDate);
                                  //  callback();
                                  if (currentDate === dewDate && 'production' == app.get('env')) {
                                    console.log(" satisfy condition");
                                    logger.log(" satisfy condition", new Date())
                                    if ( extraHours > 0 && paymentData.subscriptionId) {
                                      console.log("subscriptionId    ",paymentData.subscriptionId);
                                      logger.log("subscriptionId    ",paymentData.subscriptionId, new Date());
                                      let _obj = {
                                          amount:extraHours * paymentData.unitAmount * 100,
                                          subscriptionId: paymentData.subscriptionId
                                      };
                                      utility.subscriptionAddons(
                                        _obj,
                                        (err, addonsResponse) => {
                                          if (err) {
                                            logger.log("err in addons ", err, new Date());
                                            
                                            callback();
                                          } else if (addonsResponse) {
                                            logger.log("addonsResponse",addonsResponse, new Date());
                                            let _addonsHours = workingHours;
                                            _addonsHours.push(10);
                                            paymentData.addonHours = _addonsHours;
                                            paymentData.save(
                                              (err, saveAddons) => {
                                                if (err) {
                                                  logger.log("error in saving working hours", new Date());
                                                  callback();
                                                } else if (saveAddons) {
                                                  logger.log("save addons!", new Date());
                                                  callback();
                                                }
                                              }
                                            );
                                          }
                                        }
                                      );
                                    } else {
                                      let _addonsHours = workingHours;
                                      _addonsHours.push(10);
                                      paymentData.addonHours = _addonsHours;
                                      paymentData.save((err, saveAddons) => {
                                        if (err) {
                                          console.log(
                                            "error in saving working hours"
                                          );
                                          callback();
                                        } else if (saveAddons) {
                                          console.log("save addons!");
                                          callback();
                                        }
                                      });
                                    }
                                  } else {
                                    console.log('testing development');
                                    callback();
                                  }
                                } else {
                                  callback();
                                }
                              });
                            }
                          );
                        }
                      }
                    );
                    // }
                  }
                );
              } else {
                callback();
              }
            }
          );
        },
        err => {
          // code for addons in subscription payment
          console.log("Data successfully updated!");
          // res.status(200).send({data:projectData})                                                    
        }
      );
    }
  });
};

ActivitiesCardController.apiCheckingMethod = (req, res) => {
  console.log("body of req------>", req.body);

  var userObject = {}; //for mettermost login
  var teamObject = {}; //for team

  //to find current and renewal date
  let currDate = new Date();
  let currDay = currDate.getDate();
  let currMonth = currDate.getMonth() + 1;
  let currYear = currDate.getFullYear();
  var currentDate = currMonth + "." + currDay + "." + currYear;

  let ModMonth = currMonth + 1;
  if (ModMonth > 12) {
    ModMonth = 1;
    currYear = currYear + 1;
  }
  var renewDate = ModMonth + "." + currDay + "." + currYear;

  if (req.body.transactionId && req.body.userId && req.body.projectId) {
    ProjectModel.findOne(
      {
        _id: req.body.projectId,
        "user.id": req.body.userId
      },
      (err, projectData) => {
        if (err) {
          console.log("error 1");
          res.json(500, {
            statusCode: 500,
            err: err
          });
        } else if (projectData) {
          if (!projectData.paymentDone) {
            UserModel.findOne({ userId: req.body.userId }, (err, userData) => {
              if (err) {
                console.log("error 2");
                res.json(500, {
                  statusCode: 500,
                  err: err
                });
              } else if (userData) {
                //object for mattermost login
                userObject = {
                  email: userData.email,
                  password: userData.password
                };

                //object for add in team
                teamObject = {
                  teamId: projectData.teamDetails.teamId,
                  adminUserId: projectData.DLead.workspaceId
                };

                //object for payment save
                let obj = {
                  user: {
                    userId: req.body.userId,
                    name: userData.name
                  },
                  transactionId: req.body.transactionId,
                  amount: req.body.amount,
                  projectId: req.body.projectId,
                  renewalDate: renewDate,
                  paymentDate: currentDate
                };
                var payment = new PaymentModel(obj);
                payment.save((err, data) => {
                  if (err) {
                    console.log("error 5");
                    res.send(500, err);
                  } else {
                    ActivitiesCardsModel.find({}, (err, data) => {
                      var _activityCardsArr = [];
                      if (err) {
                        console.log("error 6");
                        res.json(500, {
                          statusCode: 500,
                          err: err
                        });
                      } else if (data.length > 0) {
                        console.log(
                          "data of ActivitiesCardsModel=====>",
                          data.length
                        );

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
                              approxDesignHours: result.approxDesignHours,
                              approxTimeline: result.approxTimeline,
                              bigTitles: result.bigTitles,
                              stages: result.stages,
                              bannerURL: result.bannerURL,
                              iconURL: result.iconURL,
                              colorCode: result.colorCode
                            };
                            _activityCardsArr.push(obj);
                            callback();
                          },
                          err => {
                            ProjectModel.findOne(
                              { _id: req.body.projectId },
                              (err, project) => {
                                project.paymentDone = true;
                                project.assignDLeadConformation = true;
                                project.likeWorkSpace = true;
                                project.activities = _activityCardsArr;
                                project.save((err, data) => {
                                  if (err) {
                                    console.log("error 7");
                                    return res.status(400).send({ msg: err });
                                  } else {
                                    utility.loginByMattermost(
                                      env.teamCreatecredentials,
                                      (err, login) => {
                                        if (err) {
                                          console.log("error 8");
                                          res.json(500, {
                                            statusCode: 500,
                                            err: err
                                          });
                                        } else {
                                          let token = login.headers.token;
                                          console.log("token-------->", token);
                                          utility.addSingleUserinClienTeam(
                                            teamObject,
                                            token,
                                            (err, addDesigner) => {
                                              if (err) {
                                                console.log("error 9");
                                                res.json(500, {
                                                  statusCode: 500,
                                                  err: err
                                                });
                                              } else if (addDesigner) {
                                                ActivitiesCardController.addDLInSetOfChannels(
                                                  project,
                                                  token,
                                                  (err, addedInChannel) => {
                                                    if (err) {
                                                      console.log("err 10");
                                                      res.json(500, {
                                                        statusCode: 500,
                                                        err: err
                                                      });
                                                    } else if (addedInChannel) {
                                                      res.json(200, {
                                                        statusCode: 200,
                                                        msg:
                                                          "payment captured successfully",
                                                        data: project
                                                      });
                                                    }
                                                  }
                                                );
                                              }
                                            }
                                          );
                                        }
                                      }
                                    );
                                  }
                                });
                              }
                            );
                          }
                        );
                      } else {
                        res.json(400, {
                          statusCode: 400,
                          msg: "Activity cards not found!"
                        });
                      }
                    });
                  }
                });
              }
            });
          } else {
            res.json(400, {
              statusCode: 400,
              msg: "payment allready done!"
            });
          }
        } else {
          res.json(404, {
            statusCode: 404,
            msg: "no record found!"
          });
        }
      }
    );
  } else {
    res.json(400, {
      statusCode: 400,
      msg: "missing parameter!"
    });
  }
};

ActivitiesCardController.addDLInSetOfChannels = (project,token,channelCallback) => {
  // ADD DL in design channel
  async.parallel(
    {
      mimifrom1thing: function(callback1) {
        let _arr = [{ user_id: project.DLead.workspaceId }];
        let _addUserInChannel = {
          teamId: project.teamDetails.teamId,
          channelId: project.mimiChannelId,
          userData: _arr
        };
        utility.addUserinDifferentChannels(
          _addUserInChannel,
          token,
          (err, mimifrom1thingAddedUser) => {
            if (err) {
              console.log("error in addUserinDifferentChannels mimifrom1thing");
            } else if (mimifrom1thingAddedUser) {
              callback1(err, mimifrom1thingAddedUser);
            }
          }
        );
      },
      design: function(callback2) {
        let _arr = [{ user_id: project.DLead.workspaceId }];
        let _addUserInChannel = {
          teamId: project.teamDetails.teamId,
          channelId: project.designChannelId,
          userData: _arr
        };
        utility.addUserinDifferentChannels(
          _addUserInChannel,
          token,
          (err, designAddedUser) => {
            if (err) {
              console.log("error in addUserinDifferentChannels design");
            } else if (designAddedUser) {
              callback2(err, designAddedUser);
            }
          }
        );
      },
      review: function(callback3) {
        let _arr = [{ user_id: project.DLead.workspaceId }];
        let _addUserInChannel = {
          teamId: project.teamDetails.teamId,
          channelId: project.reviewChannelId,
          userData: _arr
        };
        utility.addUserinDifferentChannels(
          _addUserInChannel,
          token,
          (err, reviewAddedUser) => {
            if (err) {
              console.log("error in addUserinDifferentChannels review");
            } else if (reviewAddedUser) {
              callback3(err, reviewAddedUser);
            }
          }
        );
      }
    },
    function(err, result) {
      if (err) {
        console.log("err========>", err);
        channelCallback(err, "");
      } else {
        console.log("else========>");
        channelCallback(null, result);
      }
    }
  );
};

//Methods for new sheet in web

//method to start Activity/projects
ActivitiesCardController.startProject1 = async (req, callback) => {
  if (req.projectId && req.userId && req.activityId) {
    let update = {
      "activities.$.status": "ongoing",
      "activities.$.fileCreated": true
    };
    ProjectModel.findOne(
      {
        _id: req.projectId,
        "user.id": req.userId,
        paymentDone: true,
        "activities._id": req.activityId
      },
      (err, projectData) => {
        if (err) {
          console.log("err in 1st------>", err);
          // res.json(500, {
          //   statusCode: 500,
          //   err: err
          // });
          callback({ status: 404, err: err });
        } else if (projectData) {
          var acitivityName = "",
            stagesArr = [];
          async.forEachSeries(
            projectData.activities,
            (pResult, pCallback) => {
              if (
                JSON.stringify(pResult._id) ===
                  JSON.stringify(req.activityId) &&
                !pResult.fileCreated
              ) {
                console.log("match");
                acitivityName = pResult.name;
                stagesArr = pResult.stages;
                pCallback(true);
              } else {
                console.log("not match ");
                pCallback();
              }
            },
            err => {
              console.log("err ", err);
              if (err) {
                if (!projectData.folderCreated) {
                  update.folderCreated = true;
                }
                ProjectModel.update(
                  {
                    _id: req.projectId,
                    "user.id": req.userId,
                    paymentDone: true,
                    "activities._id": req.activityId
                  },
                  { $set: update },
                  (err, updatedData) => {
                    if (err) {
                      // res.status(500).send({err:err});
                      callback({ status: 404, err: err });
                    } else if (updatedData) {
                      //things to do arr
                      let newStage = [];
                      let taskArr = [];

                      let taskObj = {
                        createdDate: moment().tz("Asia/Kolkata").format("MM/DD/YYYY"),
                        "createdBy.userId":projectData.user.id,
                        "createdBy.mongooseId":projectData.mUserId,
                        "createdBy.name":projectData.user.name
                      };
                      taskArr.push(taskObj);
                      let stageObj = {
                        createdDate: moment().tz("Asia/Kolkata").format("MM/DD/YYYY"),
                        tasks: taskArr,
                        "createdBy.userId":projectData.user.id,
                        "createdBy.mongooseId":projectData.mUserId,
                        "createdBy.name":projectData.user.name
                      };

                      newStage.push(stageObj);
                      let obj = {
                        activityId: req.activityId,
                        projectId: req.projectId,
                        userId: req.userId,
                        startDate: moment()
                          .tz("Asia/Kolkata")
                          .format("MM/DD/YYYY"),
                        "aboutPc.activityName": acitivityName,
                        allStages: stagesArr,
                        thingsToDo: newStage
                        // dailyUpdates:dailyUpdateArr
                      };
                      let productJourney = new ProductJourneyModel(obj);
                      productJourney.save((err, pJData) => {
                        if (err) {
                          // res.json(500, {
                          //   statusCode: 500,
                          //   err: err
                          // });
                          callback({ status: 404, err: err });
                        } else if (pJData) {
                          // res.status(200).send({data:pJData})
                          callback(null, { status: 200, data: pJData });
                        }
                      });
                    }
                  }
                );
              } else {
                // res.status(404).send({msg : "Project Not Found or Project Already Start"});
                callback({
                  status: 404,
                  err: "Project Not Found or Project Already Start"
                });
              }
            }
          );
        } else {
          // console.log("not found data")
          callback({ status: 404, err: "Not Found" });
        }
      }
    );
  } else {
    // return (new Error({status:401, err:"Incomplete Parameters!"}));
    callback({ status: 400, err: "Incomplete Parameters!" });
  }
};

ActivitiesCardController.startProject = async (req1, res) => {
  let req = req1.body;
  console.log("req = ", req);
  if (req.projectId && req.userId && req.activityId) {
    let update = {
      "activities.$.status": "ongoing",
      "activities.$.fileCreated": true
    };
    ProjectModel.findOne(
      {
        _id: req.projectId,
        "user.id": req.userId,
        // paymentDone: true,
        "activities._id": req.activityId
      },
      (err, projectData) => {
        if (err) {
          console.log("err in 1st------>", err);
          res.json(500, {
            statusCode: 500,
            err: err
          });
        } else if (projectData) {
          var acitivityName = "",
            stagesArr = [];
          async.forEachSeries(
            projectData.activities,
            (pResult, pCallback) => {
              if (
                JSON.stringify(pResult._id) ===
                  JSON.stringify(req.activityId) &&
                !pResult.fileCreated
              ) {
                console.log("match");
                acitivityName = pResult.name;
                stagesArr = pResult.stages;
                pCallback(true);
              } else {
                console.log("not match ");
                pCallback();
              }
            },
            err => {
              console.log("err ", err);
              if (err) {
                if (!projectData.folderCreated) {
                  update.folderCreated = true;
                }
                ProjectModel.update(
                  {
                    _id: req.projectId,
                    "user.id": req.userId,
                    paymentDone: true,
                    "activities._id": req.activityId
                  },
                  { $set: update },
                  (err, updatedData) => {
                    if (err) {
                      // res.status(500).send({err:err});
                      callback({ status: 404, err: err });
                    } else if (updatedData) {
                      //things to do arr
                      let newStage = [];
                      let taskArr = [];

                      let taskObj = {
                        createdDate: moment().tz("Asia/Kolkata").format("MM/DD/YYYY"),
                        "createdBy.userId":projectData.user.id,
                        "createdBy.mongooseId":projectData.mUserId,
                        "createdBy.name":projectData.user.name
                      };
                      taskArr.push(taskObj);
                      let stageObj = {
                        createdDate: moment().tz("Asia/Kolkata").format("MM/DD/YYYY"),
                        "createdBy.userId":projectData.user.id,
                        "createdBy.mongooseId":projectData.mUserId,
                        "createdBy.name":projectData.user.name,
                        tasks: taskArr
                      };

                      newStage.push(stageObj);
                      let obj = {
                        activityId: req.activityId,
                        projectId: req.projectId,
                        userId: req.userId,
                        startDate: moment()
                          .tz("Asia/Kolkata")
                          .format("MM/DD/YYYY"),
                        "aboutPc.activityName": acitivityName,
                        allStages: stagesArr,
                        thingsToDo: newStage
                        // dailyUpdates:dailyUpdateArr
                      };
                      let productJourney = new ProductJourneyModel(obj);
                      productJourney.save((err, pJData) => {
                        if (err) {
                          res.json(500, {
                            statusCode: 500,
                            err: err
                          });
                        } else if (pJData) {
                          res.status(200).send({ data: pJData });
                        }
                      });
                    }
                  }
                );
              } else {
                res
                  .status(404)
                  .send({ msg: "Project Not Found or Project Already Start" });
              }
            }
          );
        } else {
          console.log("not found data");
          res
            .status(404)
            .send({ msg: "Project Not Found or Project Already Start" });
        }
      }
    );
  } else {
    // return (new Error({status:401, err:"Incomplete Parameters!"}));
    res.status(401).send({ msg: "Incomplete Parameters!" });
  }
};

//addTask
ActivitiesCardController.addTask = (req, callback) => {
  console.log("addTask", req);
  if (req.projectId && req.activityId && req.stageId) {
    var createdBy={}, _update={}, _updateThingsToDo={};
    if(req.userType==='DL' || req.userType==='DP'){
      DesignerModel.findOne({userId:req.userId},(err, designerData)=>{
        if(err){
          callback({ status: 500, err: err });
        }
        else if(designerData){
          _updateThingsToDo={};
          _updateThingsToDo = {
            createdDate: moment().tz("Asia/Kolkata").format("MM/DD/YYYY"),
            "createdBy.userId":designerData.userId,
            "createdBy.mongooseId":designerData._id,
            "createdBy.name":designerData.name
          };
          
          console.log('_updateThingsToDo= ', _updateThingsToDo);
          _update={};
           _update = {
            "thingsToDo.$.tasks": _updateThingsToDo
          };
          ActivitiesCardController.addInTask(req, _update, (err, updatedData)=>{
            if(err){
              callback(err);
            }
            else{
              callback(updatedData)
            }
          })
        }
        else{
          callback({status:404, err:'Designer not found!'});
        }
      });
    }
    else if(req.userType==='PC'){
      UserModel.findOne({userId:req.userId},(err, userData)=>{
        if(err){
          res.status(500).send({ err: err });
        }
        else{
          updateThingsToDo={};
          _updateThingsToDo = {
            createdDate: moment().tz("Asia/Kolkata").format("MM/DD/YYYY"),
            "createdBy.userId":userData.userId,
            "createdBy.mongooseId":userData._id,
            "createdBy.name":userData.name
          };
          console.log('_updateThingsToDo= ', _updateThingsToDo);
          _update={};
           _update = {
            "thingsToDo.$.tasks": _updateThingsToDo
          };
          ActivitiesCardController.addInTask(req, _update, (err, updatedData)=>{
            if(err){
              callback(err);
            }
            else{
              callback(updatedData);
            }
          })
        }
      });
    }
    else{
      console.log('Unauthorise user try to add task!');
      callback({ status: 400, err: "Authentication Error!" });
    }
  } else {
    console.log("in addTask Incomplete");
    callback({ status: 400, err: "Incomplete Parameters!" });
  }
};
ActivitiesCardController.addTask1 = (req1, res) => {
  let req = req1.body;
  console.log("addTask", req);
  if (req.projectId && req.activityId && req.stageId) {
    var createdBy={}, _update={}, _updateThingsToDo={};
    if(req.userType==='DL' || req.userType==='DP'){
      DesignerModel.findOne({userId:req.userId},(err, designerData)=>{
        if(err){
          res.status(500).send({ err: err });
        }
        else{
          _updateThingsToDo={};
          _updateThingsToDo = {
            createdDate: moment().tz("Asia/Kolkata").format("MM/DD/YYYY"),
            "createdBy.userId":designerData.userId,
            "createdBy.mongooseId":designerData._id,
            "createdBy.name":designerData.name
          };
          
          console.log('_updateThingsToDo= ', _updateThingsToDo);
          _update={};
           _update = {
            "thingsToDo.$.tasks": _updateThingsToDo
          };
          ActivitiesCardController.addInTask(req, _update, (err, updatedData)=>{
            if(err){
              res.send(err);
            }
            else{
              res.send(updatedData);
            }
          })
        }
      });
    }
    else if(req.userType==='PC'){
      UserModel.findOne({userId:req.userId},(err, userData)=>{
        if(err){
          res.status(500).send({ err: err });
        }
        else{
          updateThingsToDo={};
          _updateThingsToDo = {
            createdDate: moment().tz("Asia/Kolkata").format("MM/DD/YYYY"),
            "createdBy.userId":userData.userId,
            "createdBy.mongooseId":userData._id,
            "createdBy.name":userData.name
          };
          console.log('_updateThingsToDo= ', _updateThingsToDo);
          _update={};
           _update = {
            "thingsToDo.$.tasks": _updateThingsToDo
          };
          ActivitiesCardController.addInTask(req, _update, (err, updatedData)=>{
            if(err){
              res.send(err);
            }
            else{
              res.send(updatedData);
            }
          })


        }
      });
    }
    else{
      res.status(400).send({ err: "Not Found" });
    }
  } else {
    console.log("in addTask Incomplete");
    res.status(400).send({ msg: "Incomplete Parameters!" });

    // callback({status:400, err : "Incomplete Parameters!"});
  }
};

ActivitiesCardController.addInTask = (req, _update , callback)=>{

  ProductJourneyModel.findOneAndUpdate(
    {
      projectId: req.projectId,
      activityId: req.activityId,
      "thingsToDo._id": req.stageId
    },
    // 'thingsToDo.$',
    { $push: _update },
    { new: true },
    (err, pJData) => {
      if (err) {
        // res.status(500).send({ err: err });
        callback({status:500, err : err});
      } else if (pJData) {
        // res.send({ data: pJData });
        callback(null,{status:200, journeyData:pJData});
      } else {
        callback({ status: 400, err: "Not Found" });
              // res.status(400).send({ err: "Not Found" });
      }
    }
  );
}



//addStage
ActivitiesCardController.addStage = (req, callback) => {
  if (req.projectId && req.activityId && req.userId) {
    var stageObj={}, _update={}, taskArr=[], taskObj={};

    if(req.userType==='DL' || req.userType==='DP'){
      DesignerModel.findOne({userId:req.userId},(err, designerData)=>{
        if(err){
          callback({ status: 500, err: err });
        }
        else{
          taskArr=[];
          taskObj = {
            createdDate: moment().tz("Asia/Kolkata").format("MM/DD/YYYY"),
            "createdBy.userId":designerData.userId,
            "createdBy.mongooseId":designerData._id,
            "createdBy.name":designerData.name

          };
          taskArr.push(taskObj);
          stageObj={};
          stageObj = {
            createdDate: moment().tz("Asia/Kolkata").format("MM/DD/YYYY"),
            tasks: taskArr,
            "createdBy.userId":designerData.userId,
            "createdBy.mongooseId":designerData._id,
            "createdBy.name":designerData.name
          };
          
          console.log('stageObj= ', stageObj);
          _update={};
          _update = {
            thingsToDo: stageObj
          };
          ActivitiesCardController.addInStage(req, _update, (err, updatedData)=>{
            if(err){
              callback(err);
            }
            else{
              callback(updatedData);
            }
          })
        }
      });
    }
    else if(req.userType==='PC'){
      UserModel.findOne({userId:req.userId},(err, userData)=>{
        if(err){
          res.status(500).send({ err: err });
        }
        else{
          taskArr=[];
          taskObj = {
            createdDate: moment().tz("Asia/Kolkata").format("MM/DD/YYYY"),
            "createdBy.userId":userData.userId,
            "createdBy.mongooseId":userData._id,
            "createdBy.name":userData.name

          };
          taskArr.push(taskObj);
          stageObj={};
          stageObj = {
            createdDate: moment().tz("Asia/Kolkata").format("MM/DD/YYYY"),
            tasks: taskArr,
            "createdBy.userId":userData.userId,
            "createdBy.mongooseId":userData._id,
            "createdBy.name":userData.name
          };
          
          console.log('stageObj= ', stageObj);
          _update={};
          _update = {
            thingsToDo: stageObj
          };
          ActivitiesCardController.addInStage(req, _update, (err, updatedData)=>{
            if(err){
              callback(err);
            }
            else{
              callback(updatedData);
            }
          })


        }
      });
    }
    else{
      console.log('Unauthorise user try to add stage!');
      callback({ status: 400, err: "Authentication Error!" });
    }
    // ProductJourneyModel.findOneAndUpdate(
    //   {
    //     projectId: req.projectId,
    //     activityId: req.activityId,
    //     userId: req.userId
    //   },
    //   { $push: _update },
    //   { new: true },
    //   (err, pJData) => {
    //     if (err) {
    //       //  res.status(500).send({err:err});
    //       callback({ status: 500, err: err });
    //     } else if (pJData) {
    //       //  res.send({data:pJData});
    //       callback(null, { status: 200, journeyData: pJData });
    //     } else {
    //       // res.send({msg:"not"});
    //       callback({ status: 404, err: "Not Found!" });
    //     }
    //   }
    // );
  
  } else {
    callback({ status: 400, err: "Incomplete Parameters!" });
  }
};
ActivitiesCardController.addStage1 = (req1, res) => {
  let req = req1.body;
  if (req.projectId && req.activityId && req.userId) {
    var stageObj={}, _update={}, taskArr=[], taskObj={};

    if(req.userType==='DL' || req.userType==='DP'){
      DesignerModel.findOne({userId:req.userId},(err, designerData)=>{
        if(err){
          res.status(500).send({ err: err });
        }
        else{
          taskArr=[];
          taskObj = {
            createdDate: moment().tz("Asia/Kolkata").format("MM/DD/YYYY"),
            "createdBy.userId":designerData.userId,
            "createdBy.mongooseId":designerData._id,
            "createdBy.name":designerData.name

          };
          taskArr.push(taskObj);
          stageObj={};
          stageObj = {
            createdDate: moment().tz("Asia/Kolkata").format("MM/DD/YYYY"),
            tasks: taskArr,
            "createdBy.userId":designerData.userId,
            "createdBy.mongooseId":designerData._id,
            "createdBy.name":designerData.name
          };
          
          console.log('stageObj= ', stageObj);
          _update={};
          _update = {
            thingsToDo: stageObj
          };
          ActivitiesCardController.addInStage(req, _update, (err, updatedData)=>{
            if(err){
              res.send(err);
            }
            else{
              res.send(updatedData);
            }
          })
        }
      });
    }
    else if(req.userType==='PC'){
      UserModel.findOne({userId:req.userId},(err, userData)=>{
        if(err){
          res.status(500).send({ err: err });
        }
        else{
          taskArr=[];
          taskObj = {
            createdDate: moment().tz("Asia/Kolkata").format("MM/DD/YYYY"),
            "createdBy.userId":userData.userId,
            "createdBy.mongooseId":userData._id,
            "createdBy.name":userData.name

          };
          taskArr.push(taskObj);
          stageObj={};
          stageObj = {
            createdDate: moment().tz("Asia/Kolkata").format("MM/DD/YYYY"),
            tasks: taskArr,
            "createdBy.userId":userData.userId,
            "createdBy.mongooseId":userData._id,
            "createdBy.name":userData.name
          };
          
          console.log('stageObj= ', stageObj);
          _update={};
          _update = {
            thingsToDo: stageObj
          };
          ActivitiesCardController.addInStage(req, _update, (err, updatedData)=>{
            if(err){
              res.send(err);
            }
            else{
              res.send(updatedData);
            }
          })


        }
      });
    }
    else{
      res.status(400).send({ err: "Not Found" });
    }



    // ProductJourneyModel.findOneAndUpdate(
    //   {
    //     projectId: req.projectId,
    //     activityId: req.activityId,
    //     userId: req.userId
    //   },
    //   { $push: _update },
    //   { new: true },
    //   (err, pJData) => {
    //     if (err) {
    //       res.status(500).send({ err: err });
    //       // callback({status:500, err : err});
    //     } else if (pJData) {
    //       res.send({ data: pJData });
    //       // callback(null,{status:200, data : pJData});
    //     } else {
    //       res.send({ msg: "not" });
    //       // callback({status:404, err:'Not Found!'});
    //     }
    //   }
    // );
  } else {
    // callback({status:400, err : "Incomplete Parameters!"});
    res.send({ status: 400, err: "Incomplete Parameters!" });
  }
};
ActivitiesCardController.addInStage = (req, _update, callback)=>{
  ProductJourneyModel.findOneAndUpdate(
      {
        projectId: req.projectId,
        activityId: req.activityId,
      },
      { $push: _update },
      { new: true },
      (err, pJData) => {
        if (err) {
          callback({status:500, err : err});
        } else if (pJData) {
          callback(null,{status:200, journeyData : pJData});
        } else {
          callback({status:404, err:'Not Found!'});
        }
      }
    );
}


//update in stage
ActivitiesCardController.updateInStage = (req, callback) => {
  let _update = {};
  console.log("stages------->", req);
  if (req.stageId) {
    let keys = Object.keys(req);
    let condition = {
      "thingsToDo._id": req.stageId
    };
    if (keys.includes("stages")) {
      _update = {};
      _update = {
        "thingsToDo.$.stages": req.stages
      };
    } else if (keys.includes("stageDetails")) {
      _update = {};
      _update = {
        "thingsToDo.$.stageDetails": req.stageDetails
      };
    } else if (keys.includes("expectedHours")) {
      _update = {};
      _update = {
        "thingsToDo.$.expectedHours": req.expectedHours
      };
    } else if (keys.includes("actualHours")) {
      _update = {};
      _update = {
        "thingsToDo.$.actualHours": req.actualHours
      };
    } else if (keys.includes("stageStatus")) {
      _update = {};
      _update = {
        "thingsToDo.$.stageStatus": req.stageStatus
      };
    } else if (keys.includes("addATag")) {
      _update = {};
      _update = {
        "thingsToDo.$.addATag": req.addATag
      };
    } else if (keys.includes("timeline")) {
      _update = {};
      _update = {
        "thingsToDo.$.timeline": req.timeline
      };
    } else if (keys.includes("deliverables")) {
      _update = {};
      _update = {
        "thingsToDo.$.deliverables": req.deliverables
      };
    }
    ProductJourneyModel.findOneAndUpdate(
      condition,
      { $set: _update },
      { new: true },
      (err, updatedData) => {
        if (err) {
          // res.status(500).send({err:err});
          callback({ status: 500, err: err });
        } else if (updatedData) {
          // res.status(200).send({msg:"Saving.."});
          callback(null, updatedData);
        } else {
          callback({ status: 404, data: "Not found!" });
        }
      }
    );
  } else {
    // res.status(400).send({msg:"Incomplete Parameters!"});
    callback({ status: 400, err: "Incomplete Parameters!" });
  }
};

//update in task
ActivitiesCardController.updateInTask = (req, callback) => {
  let sendUpdatedData={};
  if (req.taskId) {
    let condition = {
      "thingsToDo.tasks._id": req.taskId
    };

    ProductJourneyModel.findOne(condition, (err, data) => {
      if (err) {
        // res.status(500).send({err:err});
        callback({ status: 500, err: err });
      } else if (data) {
        let thingsCount = 0,
          tasksCount = 0,
          arr = [];
        async.forEachSeries(
          data.thingsToDo,
          (thingsData, thingsCallback) => {
            tasksCount = 0;
            async.forEachSeries(
              thingsData.tasks,
              (tasksData, tasksCallback) => {
                if (
                  JSON.stringify(tasksData._id) === JSON.stringify(req.taskId)
                ) {
                  ActivitiesCardController.updateDataInTask(
                    req,
                    thingsCount,
                    tasksCount,
                    data,
                    (errInUpdate, updatedData) => {
                      if (errInUpdate) {
                        // res.status(500).send({err:err});
                        callback({ status: 500, err: err });
                      } else if (updatedData) {
                        // arr.push(updatedData);
                        sendUpdatedData = updatedData;
                        tasksCallback(true);
                      }
                    }
                  );
                } else {
                  tasksCount++;
                  tasksCallback();
                }
              },
              tasksError => {
                if (tasksError) {
                  thingsCallback(true);
                } else {
                  thingsCount++;
                  thingsCallback();
                }
              }
            );
          },
          thingsError => {
            if (thingsError) {
              // res.status(200).send({msg:arr});
              callback(null, sendUpdatedData);
            } else {
              // res.status(404).send({msg:"Not Found!"});
              callback({ status: 404, err: "Not Found!" });
            }
          }
        );
      } else {
        callback({ status: 404, msg: "Not Found!" });
      }
    });
  } else {
    // res.status(400).send({msg:"Incomplete Parameters!"})
    callback({ status: 400, err: "Incomplete Parameters!" });
  }
};
ActivitiesCardController.updateInTask1 = (_req, res) => {
  let sendUpdatedData={};
  let req = _req.body;
  if (req.taskId) {
    let condition = {
      "thingsToDo.tasks._id": req.taskId
    };

    ProductJourneyModel.findOne(condition, (err, data) => {
      // console.log('data ', data)
      if (err) {
        console.log("err in updateTask1 1");
        res.status(500).send({ err: err });
        // callback({status:500, err:err});
      } else if (data) {
        let thingsCount = 0,
          tasksCount = 0,
          arr = [];
        async.forEachSeries(
          data.thingsToDo,
          (thingsData, thingsCallback) => {
            tasksCount = 0;
            async.forEachSeries(
              thingsData.tasks,
              (tasksData, tasksCallback) => {
                if (
                  JSON.stringify(tasksData._id) === JSON.stringify(req.taskId)
                ) {
                  ActivitiesCardController.updateDataInTask(
                    req,
                    thingsCount,
                    tasksCount,
                    data,
                    (errInUpdate, updatedData) => {
                      if (errInUpdate) {
                        console.log("err in ", err);
                        res.status(500).send({ err: err });
                        // callback({status:500, err:err});
                      } else if (updatedData) {
                        // arr.push(updatedData);
                        sendUpdatedData=updatedData;
                        tasksCallback(true);
                      }
                    }
                  );
                } else {
                  tasksCount++;
                  tasksCallback();
                }
              },
              tasksError => {
                if (tasksError) {
                  thingsCallback(true);
                } else {
                  thingsCount++;
                  thingsCallback();
                }
              }
            );
          },
          thingsError => {
            if (thingsError) {
              res.status(200).send({ msg: updatedData });
              // callback(null, {status:200, data:"updated!"});
            } else {
              res.status(404).send({ msg: "Not Found!" });
              // callback({status:404, err:'Not Found!'});
            }
          }
        );
      } else {
        res.status(404).send({ msg: "Not Found!" });
      }
    });
  } else {
    res.status(400).send({ msg: "Incomplete Parameters!" });
    // callback({status:400, err:'Incomplete Parameters!'});
  }
};

ActivitiesCardController.updateDataInTask = (
    req,
    thingsCount,
    tasksCount,
    data,
    callback
  ) => {
  // console.log('req = ', req,
  //           "\n thingsCount = ",thingsCount ,
  //           "\n tasksCount = ",tasksCount,
  //           "\n data = ", data)

  let keys = Object.keys(req);
  let condition = {
    "thingsToDo.tasks._id": req.taskId
  };
  let update = {};
  if (keys.includes("thingsToDo")) {
    console.log("thingsToDo", req.thingsToDo);
    data.thingsToDo[thingsCount].tasks[tasksCount].thingsToDo = req.thingsToDo;
  } else if (keys.includes("taskDetails")) {
    data.thingsToDo[thingsCount].tasks[tasksCount].taskDetails =
      req.taskDetails;
  } else if (keys.includes("expectedHours")) {
    data.thingsToDo[thingsCount].tasks[tasksCount].expectedHours =
      req.expectedHours;
  } else if (keys.includes("addAState")) {
    data.thingsToDo[thingsCount].tasks[tasksCount].addAState = req.addAState;
  } else if (keys.includes("addATag")) {
    data.thingsToDo[thingsCount].tasks[tasksCount].addATag = req.addATag;
  } else if (keys.includes("timeline")) {
    data.thingsToDo[thingsCount].tasks[tasksCount].timeline = req.timeline;
  } else if (keys.includes("deliverables")) {
    data.thingsToDo[thingsCount].tasks[tasksCount].deliverables =
      req.deliverables;
  } else if (keys.includes("comment")) {
    data.thingsToDo[thingsCount].tasks[tasksCount].comment = req.comment;
  } else if (keys.includes("ownerShip")) {
    data.thingsToDo[thingsCount].tasks[tasksCount].ownerShip.userId =
      req.ownerShip.userId;
    data.thingsToDo[thingsCount].tasks[tasksCount].ownerShip.mongooseId =
      req.ownerShip.mongooseId;
    data.thingsToDo[thingsCount].tasks[tasksCount].ownerShip.name =
      req.ownerShip.name;
  }

  data.save((errInUpdate, updatedData) => {
    // console.log('error in save of updateInTask', errInUpdate, updatedData)
    if (errInUpdate) {
      callback(errInUpdate);
    } else if (updatedData) {
      // arr.push(updatedData);
      callback(null, updatedData);
    }
  });
};

//START TIMER WEBSOCKET
ActivitiesCardController.startTaskTimer = (req, callback) => {
  // let req = req1.body;
  console.log("timer Value  = ", req);
  console.log("hours = ",utility.convertsMilliToHours(parseInt(req.timerValue)));
  if (req.taskId && req.timerValue>=0 && req.workingStatus && req.userId) {

    //CHECK TIMER ALREADY START OR NOT      
    if(req.tickTimer==='start'){
      let ownerShipCondition = {
        "thingsToDo.tasks":{"$elemMatch":{"ownerShip.userId":req.userId,workingStatus:"working"}}
      }
      ProductJourneyModel.find(ownerShipCondition,(err,canStartTimer)=>{
        if(err){
          callback({ status: 500, err: err });
        }
        else if(canStartTimer.length>0){

          //TIMER CAN'T BE START
          callback({ status: 203, taskId:req.taskId, change_type:"InitialStartTimer"});
        }
        else{
          //TIMER START
          ActivitiesCardController.startTimer(req,(err, startTimerData)=>{
            if(err){
              callback(err);
            }
            else{
              callback(null,startTimerData);
            }
          })
        }
      });
    }
    else{
      //TIMER START
      ActivitiesCardController.startTimer(req,(err, startTimerData)=>{
        if(err){
          callback(err);
        }
        else{
          callback(null, startTimerData);
        }
      })
    }

  } else {
    callback({ status: 400, err: "Incomplete parameter!" });
  }
};

//START TIMER
ActivitiesCardController.startTimer = (req, callback)=>{
  let startDate = moment().tz("Asia/Kolkata").format("MM/DD/YYYY");
  // let isoDate = new Date(startDate);
  console.log("startDate= ", startDate);
  let condition1 = {
    projectId: req.projectId,
    activityId: req.activityId,
    dailyUpdates: { $elemMatch: { date: startDate,taskId:req.taskId } },
  };
  let condition2 = {
    projectId: req.projectId,
    activityId: req.activityId
  };
  let update1 = {
    "dailyUpdates.$.hoursSpent": utility.convertsMilliToHours(req.timerValue)
  };
  let pushObj = {
    taskId: req.taskId,
    date: startDate,
    hoursSpent: utility.convertsMilliToHours(req.timerValue)
  };
  let update2 = {
    dailyUpdates: pushObj
  };

  ProductJourneyModel.update(
    condition1,
    { $set: update1 },
    (err, updatedData1) => {
      if (err) {
        callback({ status: 500, err: err });
      } else if (updatedData1.nModified === 0) {
        console.log("$push condition");
        ProductJourneyModel.update(
          condition2,
          { $push: update2 },
          (err, updateData2) => {
            if (err) {
              callback({ status: 500, err: err });
            } else if (updateData2.nModified > 0) {
              ActivitiesCardController.updatedHoursInJourney(
                req,
                (err, updatedHours) => {
                  if (err) {
                    callback({ status: 500, err: err });
                    
                  } else {
                    callback(null, { status: 200, data: updatedHours });
                  }
                }
              );
            } else {
              callback(null, { status: 200, data: "Not Updated!" });
            }
          }
        );
      } else {
        console.log("$set condition");
        ActivitiesCardController.updatedHoursInJourney(
          req,
          (err, updatedHours) => {
            if (err) {
              callback({ status: 500, err: err });
            } else {
              callback(null, { status: 200, data: updatedHours });
            }
          }
        );
      }
    }
  );
}
//START TIMER DIRECT
ActivitiesCardController.startTaskTimer1 = (req1, res) => {
  let req = req1.body;
  // console.log("req = ", req)
  console.log("hours = ", utility.convertsMilliToHours(req.timerValue));
  if (req.taskId && req.timerValue && req.workingStatus && req.userId) {

    //CHECK TIMER ALREADY START OR NOT
    
    let ownerShipCondition = {
      // "thingsToDo.tasks.ownerShip.userId":req.userId
      "thingsToDo.tasks":{"$elemMatch":{"ownerShip.userId":req.userId,workingStatus:"working"}}
    }
    ProductJourneyModel.find(ownerShipCondition,(err,canStartTimer)=>{
      if(err){
        res.status(500).send({err:err});
      }
      else if(canStartTimer.length>0){
        res.status(203).send({err:"Already one timer running!", data:canStartTimer});
      }
      else{
        //TIMER START
        ActivitiesCardController.startTimer(req,(err, startTimerData)=>{
          if(err){
            res.send(err)
          }
          else{
            res.send(startTimerData)
          }
        })
      }
   });


    // let startDate = moment().tz("Asia/Kolkata").format("MM/DD/YYYY");
    // console.log("startDate= ", startDate);
    // let condition1 = {
    //   projectId: req.projectId,
    //   activityId: req.activityId,
    //   dailyUpdates: { $elemMatch: { date: startDate,taskId:req.taskId } },
    // };
    // let condition2 = {
    //   projectId: req.projectId,
    //   activityId: req.activityId
    // };
    // let update1 = {
    //   "dailyUpdates.$.hoursSpent": utility.convertsMilliToHours(req.timerValue)
    // };
    // let pushObj = {
    //   taskId: req.taskId,
    //   date: startDate,
    //   hoursSpent: utility.convertsMilliToHours(req.timerValue)
    // };
    // let update2 = {
    //   dailyUpdates: pushObj
    // };
    // ProductJourneyModel.update(condition1,
    //   {$set:update1},
    //   (err, updatedData1)=>{
    //     if(err){
    //       res.send(err)
    //     }
    //     else if(updatedData1.nModified===0){
    //       console.log('push condition')
    //       ProductJourneyModel.update(condition2,{$push:update2},(err, updateData2)=>{
    //       if(err){
    //           res.send(err)
    //       }
    //       else if(updateData2.nModified>0){

    //           ActivitiesCardController.updatedHoursInJourney(req, (err, updatedHours)=>{
    //             if(err){
    //               res.send(err)
    //             }
    //             else{
    //               res.send(updatedHours)
    //             }
    //           })
    //       }
    //       else{
    //           res.status(200).send({data:"Not Updated!"})
    //       }
    //     })
    //   }
    //   else{
    //     console.log('$set condition')
    //     ActivitiesCardController.updatedHoursInJourney(req, (err, updatedHours)=>{
    //       if(err){
    //         res.send(err)
    //       }
    //       else{
    //         res.send(updatedHours)
    //       }
    //     })
    //   }
    // });
  } else {
    res.status(400).send({ err: "Incomplete parameter!" });
  }
};

ActivitiesCardController.updatedHoursInJourney = (req, callback) => {
  if (req.taskId) {
    let condition = {
      "thingsToDo.tasks._id": req.taskId
    };

    ProductJourneyModel.findOne(condition, (err, data) => {
      if (err) {
        // res.status(500).send({err:err});
        callback({ status: 500, err: err });
      } else if (data) {
        let thingsCount = 0,
          tasksCount = 0,
          arr = {},
          flag=false,
          stageHours=0;
        async.forEachSeries(
          data.thingsToDo,
          (thingsData, thingsCallback) => {
            tasksCount = 0;
            stageHours=0;
            async.forEachSeries(
              thingsData.tasks,
              (tasksData, tasksCallback) => {
                if (JSON.stringify(tasksData._id) === JSON.stringify(req.taskId)) {
                  
                  ActivitiesCardController.updateHoursInTask(
                    req,
                    thingsCount,
                    tasksCount,
                    data,
                    (errInUpdate, updatedData) => {
                      if (errInUpdate) {
                        // res.status(500).send({err:err});
                        callback({ status: 500, err: err });
                      } else if (updatedData) {
                        // console.log('updatedData = ',updatedData)

                        // arr.push(updatedData);
                        arr = updatedData;
                        stageHours += tasksData.hoursSpent;
                        flag=true;
                        tasksCallback();
                      }
                    }
                  );
                } else {
                  tasksCount++;
                  stageHours += tasksData.hoursSpent;
                  tasksCallback();
                }
              },
              tasksError => {
                if (flag) {
                  thingsCallback(true);
                } else {
                  thingsCount++;
                  thingsCallback();
                }
              }
            );
          },
          thingsError => {
            if (thingsError) {
              data.thingsToDo[thingsCount].actualHours = stageHours;
              data.save((errInUpdate, updatedData) => {
                if (errInUpdate) {
                  callback(errInUpdate);
                } else if (updatedData) {
                  callback(null, { status: 200, data: updatedData });
                }
              });
            } 
            else {
              callback({ status: 404, err: "Not Found!" });
            }
          }
        );
      }
    });
  } else {
    // res.status(400).send({msg:"Incomplete Parameters!"})
    callback({ status: 400, err: "Incomplete Parameters!" });
  }
};

ActivitiesCardController.updateHoursInTask = (req,thingsCount,tasksCount,data,callback) => {
  // let keys = Object.keys(req);
  // let condition = {
  //   "thingsToDo.tasks._id": req.taskId,
  //   "thingsToDo._id": req.stageId
  // };
  // let update = {};
  data.thingsToDo[thingsCount].tasks[tasksCount].hoursSpent = utility.convertsMilliToHours(req.timerValue);
  data.thingsToDo[thingsCount].tasks[tasksCount].workingStatus = req.workingStatus;

  data.save((errInUpdate, updatedData) => {
    if (errInUpdate) {
      callback(errInUpdate);
    } else if (updatedData) {
      // arr.push(updatedData);
      callback(null, updatedData);
    }
  });
};

//DELETE STAGE DIRECT
ActivitiesCardController.deletedStage1 = (req1, res) => {
  let req = req1.body;
  let minSeconds =parseFloat((10/3600).toFixed(4));
  if (req.stageId) {
    let condition = {
      "thingsToDo._id": req.stageId
    };
    let condition1 = {
      projectId: req.projectId,
      activityId: req.activityId
    };

    ProductJourneyModel.findOne(condition,{projectId:1, activityId:1, "thingsToDo.$":1}  ,(err, data) => {
      if (err) {
        res.status(500).send({ err: err });
      } else if (data) {
        // console.log("data ", data);
        let actualData = data.thingsToDo[0];
        let stageHours = 0;
        let taskIds=[];
        // res.status(200).send({ data:data });
        async.forEachSeries(actualData.tasks, (taskData, taskCB)=>{
          stageHours += taskData.hoursSpent;
          if(stageHours>minSeconds){
            taskCB(true);
          }
          else{
            taskIds.push(taskData);
            taskCB();
          }
        }, taskErr =>{
          if(taskErr){
            res.status(203).send({msg:"Can't Delete Stage!"});
          }
          else{
            let _updateData={
              taskIds:taskIds,
              stageId:req.stageId,
              projectId:data.projectId,
              activityId:data.activityId,
              stageData:actualData
            }
            ActivitiesCardController.updationForDeleteStage(_updateData, (err,updationData)=>{
              console.log('comeback')
              if(err){
                res.status(500).send({err:err});
              }
              else{
                res.status(200).send({data:"Stage Successfully Deleted!"});
              }
            })
          }
        })
      } else {
        res.status(200).send({ data: "Not found!" });
      }
    });
  } else {
    res.status(400).send({ err: "Incomplete parameters!" });
  }
};

//DELETE STAGE WEBSOCKET
ActivitiesCardController.deleteStage = (req, mainCallback) => {
  
  let minSeconds =parseFloat((10/3600).toFixed(4));
  if (req.stageId) {
    let condition = {
      "thingsToDo._id": req.stageId
    };
    ProductJourneyModel.findOne(condition,{projectId:1, activityId:1, "thingsToDo.$":1}  ,(err, data) => {
      if (err) {
        console.log("err in deletedStage 1");
        mainCallback({status:500, err:err});
      } else if (data) {
        // console.log("data ", data);
        let actualData = data.thingsToDo[0];
        let stageHours = 0;
        let taskIds=[];
        // res.status(200).send({ data:data });
        async.forEachSeries(actualData.tasks, (taskData, taskCB)=>{
          stageHours += taskData.hoursSpent;
          if(stageHours>minSeconds){
            taskCB(true);
          }
          else{
            taskIds.push(taskData);
            taskCB();
          }
        }, taskErr =>{
          if(taskErr){
            console.log("err in deletedStage 2");
            mainCallback({status:203, err:"Can't Delete Stage!"});
          }
          else{
            let _updateData={
              taskIds:taskIds,
              stageId:req.stageId,
              projectId:data.projectId,
              activityId:data.activityId,
              stageData:actualData
            }
            ActivitiesCardController.updationForDeleteStage(_updateData, (err,updationData)=>{
              console.log('comeback')
              if(err){
                console.log("err in deletedStage 3");
                mainCallback({status:500, err:err});
              }
              else{
                console.log("stage deleted successfully");
                mainCallback({status:200, data:"Stage Successfully Deleted!"});
              }
            })
          }
        })
      } else {
        console.log("err in deletedStage 5");
        mainCallback({status:404, err:"Not found!"});
      }
    });
  } else {
    console.log("err in deletedStage 6");
    mainCallback({status:400, err:"Incomplete parameters!"});
  }
};

//UPDATION AFTER DELETE STAGE
ActivitiesCardController.updationForDeleteStage = (data, mainCallback)=>{
  async.parallel({
    pushDeletedTask: function(callback1){

      async.forEachSeries(data.taskIds,(taskData1, taskCB1)=>{
        console.log("taskData1")
        let condition1 = {
          projectId: data.projectId,
          activityId: data.activityId,
        };
        let update = {
          deletedTasks: taskData1
        };
        ProductJourneyModel.update(
          condition1,
          { $push: update },
          (err, pushDeleteData) => {
            taskCB1();
          }
        );
      }, taskErr1 =>{
        console.log('pushed tasks in deteletedTasks Array');
        callback1(null,"pushed");
      });
    },
    deleteDailyUpdate:function(callback2){
      async.forEachSeries(data.taskIds,(taskData2, taskCB2)=>{
        let condition={
          "dailyUpdates.taskId": taskData2._id
        }
        let _pullData = {
          $pull:{dailyUpdates:{taskId:taskData2._id}}
        }
        ProductJourneyModel.update(
          condition,
          _pullData,
          {multi:true}, (err, dailyUpdate)=>{
            taskCB2();
        })
      }, taskErr2 =>{
        console.log('deleted tasks from  dailyUpdate Array');
        callback2(null,"Deleted from dailyUpdate");
      });
    },
    deleteThingsToDo: function(callback3){
      let condition = {
        "thingsToDo._id": data.stageId
      };
      let _pullStageData = {
        $pull:{thingsToDo:{_id : data.stageId}}
      }
      ProductJourneyModel.update(condition,_pullStageData,(err, dailyUpdate)=>{
        console.log('Deleted stage from thingsToDo', dailyUpdate);
        callback3(err,"Deleted stage from thingsToDo");
      })
    },
    pushDeletedStage: function(callback4){
      let stageCondition={
        projectId:data.projectId,
        activityId:data.activityId
      }
      let update={
        deletedStage:data.stageData
      }
      ProductJourneyModel.update(stageCondition,
      {$push:update},(err, deletedStage)=>{
        callback4(err,"pushed DeletedStage");
      })
    }
  },
    function(err, parallelData) {
      if(err){
        mainCallback(err);
      }
      else{
        mainCallback(null, parallelData);
      }
      
    }
  )
}

//DELETE TASK DIRECT
ActivitiesCardController.deleteTask1 = (req1, res)=>{
  let minSeconds =parseFloat((10/3600).toFixed(4));
  console.log('minSeconds = ', minSeconds);
  let req = req1.body, deletedArr=[], count=0;
  if(req.taskId){
    let condition1 = {
      "thingsToDo.tasks":{"$elemMatch":{"_id":req.taskId,"hoursSpent":{$lte:minSeconds}}}
    }
    let condition3 = {};
    ProductJourneyModel.findOne(condition1,
      (err, data)=>{
      if(err){
        res.status(500).send({err:err});
      }
      else if(data){
        async.forEachSeries(data.thingsToDo, (thingsData, thingsCB)=>{
          count=0;
          async.forEachSeries(thingsData.tasks, (tasksData, tasksCB)=>{
            
            if(JSON.stringify(tasksData._id)===JSON.stringify(req.taskId) && tasksData.hoursSpent<=minSeconds){
              console.log('find condition');
              let condition2 = {
                projectId: data.projectId,
                activityId: data.activityId,
              };
              condition3 = {
                "thingsToDo._id": thingsData._id,
              };
              let update = {
                deletedTasks: tasksData
              };
              ProductJourneyModel.update(
                condition2,
                { $push: update },
                (err, pushDeleteData) => {
                  if (err) {
                    res.status(500).send({ err: err });
                  } else {
                    console.log('before delete = ', thingsData.tasks.length)
                    thingsData.tasks.splice(count, 1);
                    console.log('after delete = ', thingsData.tasks.length)
                    deletedArr = thingsData.tasks;
                    count++;
                    tasksCB(true);
                  }
                }
              );
            }
            else{
              count++;
              tasksCB();
            }
          }, taskErr=>{
            if(taskErr){
              console.log('taskErr true')
              let _updateTasks = {
                "thingsToDo.$.tasks": deletedArr
              };
              ProductJourneyModel.update(
                condition3,
                { $set: _updateTasks },
                (err, updatedData) => {
                  if (err) {
                    res.status(500).send({ err: err });
                  } else {
                    let _pullData = {
                      $pull:{dailyUpdates:{taskId:req.taskId}}
                    }
                    ProductJourneyModel.update(
                      {},
                      _pullData,
                      {multi:true}, (err, dailyUpdate)=>{
                      if(err){
                        res.status(500).send({ err: err });
                      }
                      else{
                        thingsCB(true);
                      }
                    })
                  }
                }
              );
            }
            else{
              console.log('taskErr false');
              thingsCB();
            }
          })
        }, thingsErr =>{
          if(thingsErr){
            console.log('things true');
            res.status(200).send({ msg: "Successfully Deleted!" });
          }
          else{
            console.log('things false');
            res.status(203).send({ msg: "Not Deleted!" });
          }
        })
      }
      else{
        res.status(203).send({msg:"Can't Delete Task!"});
      }
    })
  }
  else{
    res.status(400).send({msg:"Incomlete parameters!"});
  }
  
}
//DELETE TASK WEBSOCKET
ActivitiesCardController.deleteTask = (req, mainCallback)=>{
  let minSeconds =parseFloat((10/3600).toFixed(4));
  console.log('minSeconds = ', minSeconds);
  let deletedArr=[], count=0;
  if(req.taskId){
    let condition1 = {
      "thingsToDo.tasks":{"$elemMatch":{"_id":req.taskId,"hoursSpent":{$lte:minSeconds}}}
    }
    let condition3 = {};
    ProductJourneyModel.findOne(condition1,
      (err, data)=>{
      if(err){
        console.log('err in deleteTask 1');
        mainCallback({status:500, err:err});
      }
      else if(data){
        async.forEachSeries(data.thingsToDo, (thingsData, thingsCB)=>{
          count=0;
          async.forEachSeries(thingsData.tasks, (tasksData, tasksCB)=>{
            
            if(JSON.stringify(tasksData._id)===JSON.stringify(req.taskId) && tasksData.hoursSpent<=minSeconds){
              console.log('find condition 1');
              let condition2 = {
                projectId: data.projectId,
                activityId: data.activityId,
              };
              condition3 = {
                "thingsToDo._id": thingsData._id,
              };
              let update = {
                deletedTasks: tasksData
              };
              ProductJourneyModel.update(
                condition2,
                { $push: update },
                (err, pushDeleteData) => {
                  console.log('push deleted ', err , pushDeleteData)
                  if (err) {
                    console.log('err in deleteTask 2');
                    mainCallback({status:500, err:err});
                  } else {
                    console.log('before delete = ', thingsData.tasks.length)
                    thingsData.tasks.splice(count, 1);
                    console.log('after delete = ', thingsData.tasks.length)
                    deletedArr = thingsData.tasks;
                    count++;
                    tasksCB(true);
                  }
                }
              );
            }
            else{
              count++;
              tasksCB();
            }
          }, taskErr=>{
            if(taskErr){
              console.log('taskErr true')
              let _updateTasks = {
                "thingsToDo.$.tasks": deletedArr
              };
              ProductJourneyModel.update(
                condition3,
                { $set: _updateTasks },
                (err, updatedData) => {
                  if (err) {
                    console.log('err in deleteTask 3');
                    mainCallback({status:500, err:err});
                  } else {
                    let _pullData = {
                      $pull:{dailyUpdates:{taskId:req.taskId}}
                    }
                    ProductJourneyModel.update(
                      {},
                      _pullData,
                      {multi:true}, (err, dailyUpdate)=>{
                      if(err){
                        console.log('err in deleteTask 4');
                        mainCallback({status:500, err:err});
                      }
                      else{
                        thingsCB(true);
                      }
                    })
                  }
                }
              );
            }
            else{
              console.log('taskErr false');
              thingsCB();
            }
          })
        }, thingsErr =>{
          if(thingsErr){
            console.log('things true');
            mainCallback(null,{status:200, msg: "Successfully Deleted!"});
          }
          else{
            console.log('things false');
            mainCallback({status:203, msg: "Not Deleted!"});
          }
        })
      }
      else{
        mainCallback({status:203, msg: "Can't Delete Task!"});
      }
    })
  }
  else{
    mainCallback({status:400, msg: "Incomlete parameters!"});
  }
  
}

//NEW PAYMENT ADDONS CRON METHOD
ActivitiesCardController.addonsPayment = (req, res) => {
  let arr = [];
  var paymentData1={};
  ProjectModel.find({folderCreated:true }, (err, projectData) => {
    if (err) {
      console.log("err in addonsPayment 1");
      res.status(500).send({ err: err });
    } else if (projectData.length > 0) {
      console.log("projectData found ", projectData.length);
      let obj=[];
      async.forEachSeries(
        projectData,
        (oneProject, oneProjectCB) => {
          PaymentModel.findOne(
            { projectId: oneProject._id },
            (err, paymentData) => {
              if (err) {
                console.log("err in addonsPayment 2");
                // res.status(500).send({ err: err });
                oneProjectCB();
              } else if (paymentData) {
                paymentData1={};
                paymentData1 = paymentData;
                //<----get payment date---->
                let paymentDate = paymentData.paymentDate;
                console.log('paymentDate = ', paymentDate)
                let flag = false;
                async.forEachSeries(oneProject.activities,(oneActivity, oneActivityCB) => {
                  if (oneActivity.fileCreated) {
                    ProductJourneyModel.findOne({ activityId: oneActivity._id },
                        (err, oneProductJourneyData) => {
                          // console.log("oneProductJourneyData ", oneProductJourneyData);
                          arr.push(oneProductJourneyData);
                          if (err) {
                            console.log("err in addonsPayment 3");
                            oneActivityCB()
                          } else if (oneProductJourneyData) {
                            //calculate next date
                            // console.log('paymentData.period = ', paymentData)
                            let startDate, nextDate;
                            if (paymentData.period === "weekly") {
                              startDate = moment(new Date(paymentDate)).tz("Asia/Kolkata").format("MM/DD/YYYY");
                              nextDate = moment(startDate, "MM/DD/YYYY").add(7, "days").format("MM/DD/YYYY");
                            } else if (paymentData.period === "quaterly") {
                            } else if (paymentData.period === "yearly") {
                            }
                            let i = 0,
                              hrs = 0.0,
                              weeks = [];
                            let dailyUpdate = oneProductJourneyData.dailyUpdates;
                            
                            flag = true;
                            async.forEachSeries(
                              dailyUpdate,
                              (oneDailyUpdate, oneDailyUpdateCB) => {
                                // console.log('oneDailyUpdate.hoursSpent = ', oneDailyUpdate.hoursSpent)
                                console.log('next = ', nextDate, "start = ", oneDailyUpdate.date );
                                
                                while(flag){
                                  console.log('flag = ', flag)
                                  if(startDate<oneDailyUpdate.date && nextDate<oneDailyUpdate.date){
                                    weeks.push(hrs);
                                    hrs=0.0;
                                    startDate = nextDate;
                                    nextDate = moment(startDate, "MM/DD/YYYY").add(7, "days").format("MM/DD/YYYY");
                                  }
                                  else{
                                    if (nextDate > oneDailyUpdate.date) {
                                      
                                      if (i == 0) {
                                        console.log('i=0 time')
                                        hrs += parseFloat(oneDailyUpdate.hoursSpent);
                                        i++;
                                        
                                        oneDailyUpdateCB();
                                      } else {
                                        console.log('i>0 time')
                                        hrs +=
                                          parseFloat(dailyUpdate[i].hoursSpent) -
                                          parseFloat(dailyUpdate[i - 1].hoursSpent);
                                          
                                        i++;
                                        oneDailyUpdateCB();
                                      }
                                    } else{
                                      console.log('greater time')
                                      weeks.push(parseFloat(hrs.toFixed(4)));
                                      hrs = 0.0;
                                      hrs = i == 0
                                          ? parseFloat(dailyUpdate[i].hoursSpent)
                                          : parseFloat(dailyUpdate[i].hoursSpent) -
                                            parseFloat(
                                              dailyUpdate[i - 1].hoursSpent
                                            );
                                      i++;
                                      nextDate = moment(nextDate, "MM/DD/YYYY").add(7, "days").format("MM/DD/YYYY");
                                      oneDailyUpdateCB();
                                    }
                                  }
                                }
                              },
                              err => {
                                weeks.push(parseFloat(hrs.toFixed(4)));
                                console.log("weeks =  ", weeks);
                                flag=false;
                                async.parallel({
                                  project : function(callbackProject){
                                     //update in activity in project
                                    let _updateActivity = {
                                      "activities.$.weeks":weeks
                                    }
                                    console.log(' oneActivity._id ', oneActivity._id)
                                    ProjectModel.update(
                                      {"activities._id":oneActivity._id},
                                      {$set:_updateActivity},
                                      (err, updatedInProject)=>{
                                        if(err){
                                          console.log("err in addonsPayment 4");
                                          oneActivityCB();
                                        }
                                        else{
                                          console.log('updated in project');
                                          callbackProject(null, "ok");
                                        }
                                    });

                                  },
                                  journey: function(callbackJourney){
                                    oneProductJourneyData.weeks = weeks;
                                    oneProductJourneyData.save((err, updatedInProject)=>{
                                        if(err){
                                          console.log("err in addonsPayment 5");
                                          // res.status(500).send({err:err});
                                          oneActivityCB();
                                          // oneProjectCB();
                                        }
                                        else{
                                          console.log('updated in project');
                                          callbackJourney(null,"ok");
                                          // oneProjectCB();
                                        }
                                    });
                                  }
                                },
                                function(errP, result){
                                  if(err){
                                    console.log("err in addonsPayment 6");
                                      // res.status(500).send({err:err});
                                      oneActivityCB();
                                      // oneProjectCB();
                                  }
                                  else{
                                    console.log("updated in project and journey");
                                    oneActivityCB();
                                    // oneProjectCB();
                                  }
                                });
                              }
                            );
                          } else {
                            oneActivityCB();
                            // oneProjectCB();
                          }
                        }
                      );
                    } else {
                      oneActivityCB();
                      // oneProjectCB();
                    }
                  },
                  oneActivityErr => {
                    
                    ActivitiesCardController.saveWorkingHoursInPayment(paymentData1, (err, addOnsData)=>{
                      if(err){
                        console.log("err of project async ");
                        oneProjectCB();
                      }
                      else{
                        oneProjectCB();
                      }
                    });
                  }
                );
              } else {
                oneProjectCB();
              }
            }
          );
        },
        oneProjectErr => {
          console.log("successfully updated!");
          res.status(200).send({msg :"successfully updated!" });
        }
      );
    } else {
      console.log("projectData not found!");
      res.status(404).send({ err: "Not found!" });
    }
  });
};

ActivitiesCardController.saveWorkingHoursInPayment = (paymentData, mainCallback) => {
  console.log('saveWorkingHoursInPayment called')
  let dewDate = moment(new Date(paymentData.nextDewDate)).subtract(1, "days").format("MM/DD/YYYY");
  let currentDate = moment().tz("Asia/Kolkata").format("MM/DD/YYYY");
  console.log("dewDate -> ", dewDate);
  ProjectModel.findOne(
    { _id: paymentData.projectId },
    (err, projects) => {
      if (err) {
        console.log("saveWorkingHoursInPayment 1");
        mainCallback(err);
      } else {
        async.waterfall([
          function(totalHoursCallback) {
            let count = 0, hoursArr=[], Total=[];
            async.forEachSeries(projects.activities,(hoursresult, hoursCallback) => {
              //  console.log('hoursresult ------>', hoursresult)
              if ( hoursresult.weeks.length > 0 && count == 0) {
                  hoursArr = hoursresult.weeks;
                  count++;
                  hoursCallback();
              } else if (hoursresult.weeks.length > 0 && count > 0) {
                let arr1 = [];
                arr1 = hoursresult.weeks;
                let maxArr = [];
                maxArr = arr1.length > hoursArr.length ? arr1 : hoursArr;
                let i = 0;
                async.forEach(maxArr,(item, eachCallback) => {
                    let a = arr1[i] === undefined ? 0 : arr1[i];
                    let b = hoursArr[i] === undefined ? 0 : hoursArr[i];
                    Total.push(a + b);
                    i++;
                    eachCallback();
                  },
                  err => {
                    hoursArr = [];
                    hoursArr = Total;
                    Total = [];
                    hoursCallback();
                  }
                );
              } else {
                hoursCallback();
              }
            },err => {
                totalHoursCallback(null, hoursArr);
              }
            );
          },
          function(workingHours, extraAmountCallback) {
            console.log("callback called====================",workingHours,
              "\n paidCount = ",paymentData.paidCount,
              "\n paidHours = ",paymentData.paidHours
            );
            let paidCount = paymentData.paidCount;
            let paidHours = paymentData.paidHours;
            // let workingHours = hoursArr;
            let extraAmount = 0;
            let i = 0;
            if (paidHours.length >= workingHours.length) {
              i = 0;
              console.log("in small");
              async.forEach(paidHours,(item, eachCallback) => {
                if (workingHours[i] > paidHours[i]) {
                    extraAmount = extraAmount + (workingHours[i] - paidHours[i]);
                    i++;
                    eachCallback();
                  } else {
                    i++;
                    eachCallback();
                  }
                },
                err => {
                  console.log("in extra amount call",workingHours,extraAmount.toFixed(4));
                  extraAmountCallback(null,workingHours,extraAmount.toFixed(4));
                }
              );
            } else {
              console.log("in greater");
              i = 0;
              async.forEach(workingHours,(item, eachCallback) => {
                  console.log("paid hours = ",paidHours[i] === undefined? 0:paidHours[i]);
                  let _paidHours = paidHours[i] === undefined? 0: paidHours[i];
                  if (workingHours[i] > _paidHours) {
                    extraAmount = extraAmount + (workingHours[i] - _paidHours);
                    i++;
                    eachCallback();
                  } else {
                    i++;
                    eachCallback();
                  }
                },
                err => {
                  console.log("in extra amount call", workingHours,extraAmount.toFixed(2));
                  extraAmountCallback(null,workingHours,extraAmount.toFixed(2));
                }
              );
            }
          }
        ],
        function(err, workingHours, extraHours) {
          console.log("workingHours= ",workingHours,"extraHours = ",extraHours);
          paymentData.workingHours = workingHours;
          paymentData.save((err, saveInPayment) => {
            if (err) {
              console.log("saveWorkingHoursInPayment 2");
              mainCallback(err);
            } else if (saveInPayment) {
              console.log("save in payment ",currentDate,dewDate);
              //  callback();
              if (currentDate === dewDate && 'production' == app.get('env')) {
                logger.log(" satisfy condition", new Date());
                if (extraHours > 0 && paymentData.subscriptionId) {
                  logger.log("subscriptionId    ",paymentData.subscriptionId, new Date());
                  let _obj = {
                    amount:extraHours * paymentData.unitAmount * 100,
                    subscriptionId: paymentData.subscriptionId
                  };
                  utility.subscriptionAddons(
                    _obj,
                    (err, addonsResponse) => {
                      if (err) {
                        logger.log("err in addons ", err, new Date());
                        mainCallback(err);
                      } else if (addonsResponse) {
                        logger.log("addonsResponse",addonsResponse, new Date());
                        let _addonsHours = workingHours;
                        _addonsHours.push(10);
                        paymentData.addonHours = _addonsHours;
                        paymentData.save(
                          (err, saveAddons) => {
                            if (err) {
                              logger.log("error in saving working hours", new Date());
                              mainCallback(err);
                            } else if (saveAddons) {
                              logger.log("save addons!", new Date());
                              mainCallback(null, "ok");
                            }
                          }
                        );
                      }
                    }
                  );
                } else {
                  let _addonsHours = workingHours;
                  _addonsHours.push(10);
                  paymentData.addonHours = _addonsHours;
                  paymentData.save((err, saveAddons) => {
                    if (err) {
                      console.log(
                        "error in saving working hours"
                      );
                      mainCallback(err);
                    } else if (saveAddons) {
                      console.log("save addons!");
                      mainCallback(null, "ok");
                    }
                  });
                }
              } else {
                mainCallback(null, "ok");
              }
            } else {
              mainCallback(null, "ok");
            }
          });
        }
        );
      }
    }
  );
                  
                  
}

module.exports = ActivitiesCardController;
