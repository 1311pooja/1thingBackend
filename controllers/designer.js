const DesignerModel = require("../models/designer");
const ProjectModel = require("../models/project");
const UserModel = require("../models/user");
const emailController = require("./emailer");
const paymentController = require('./projectPayment');
const config = require("../config");
const request = require("request-promise");
const moment = require("moment-timezone");
const utility = require("../utils/utility");
const env = require("../utils/env");
const async = require("async");
var fs = require("fs");
var json2csv = require("json2csv");
const XLSX = require("xlsx");
var xlstojson = require("xls-to-json");
var xlsxtojson = require("xls-to-json");
var multer = require("multer");
var designerController = {};

designerController.quickChatWithLogin = (req, res) => {
  if (req.body.email && req.body.password) {
    DesignerModel.findOne(
      { email: req.body.email.toLowerCase() },
      (err, designData) => {
        if (err) {
          res.json(500, err);
        } else if (designData) {
          var channelId,
            userHeader,
            userId,
            userToken,
            adminToken,
            adminId,
            random_string,
            userName;
          random_string = designData.channelName;
          var userObject = {
            email: req.body.email.toLowerCase(),
            password: req.body.password,
            username: req.body.name
          };
          // var adminObj = {
          //     email: "manik@1thing.design",
          //     username: "client",
          //     password: "manik314"
          // }
          // var adminObj={
          //     email: "priyank@1thing.design",
          //     username: "client",
          //     password: "design.1"
          // }
          utility.loginByMattermost(userObject, (err, userObj) => {
            if (err) {
              res.json(400, {
                statusCode: 400,
                err: err
              });
            } else if (userObj) {
              console.log("response", userObj.headers["set-cookie"]);
              console.log("response", userObj.headers.token);
              //console.log("login", login)
              userHeader = userObj.headers["set-cookie"];
              userToken = userObj.headers.token;
              userId = userObj.body.id;
              console.log("userId", userId, userToken);
              console.log("checking ", utility.randomString(3));
              utility.loginByMattermost(
                env.designer_admin,
                (err, adminobject) => {
                  if (err) {
                    res.json(500, {
                      statusCode: 500,
                      err: err
                    });
                  }
                  console.log("login admin", err, adminobject.body);
                  console.log(
                    "admintok",
                    adminobject.headers.token,
                    adminobject.body.id
                  );
                  adminToken = adminobject.headers.token;
                  adminId = adminobject.body.id;
                  let obj = {
                    userId: userId
                  };
                  console.log("admintoken", adminToken);
                  let msg = designerController.message(designData);
                  let msg2 =
                    "Hi " + designData.name + ".\n" + utility.DesignerfirstMsg;
                  let postData = {
                    channel_id: designData.channelId,
                    message: msg
                  };
                  let postData2 = {
                    channel_id: designData.channelId,
                    message: msg2
                  };
                  // let msg = "Welcome " + userObject.username + ".\n" + utility.firstMsg
                  // let postData = {
                  //     channel_id: designData.channelId,
                  //     message: msg
                  // }
                  console.log("create post finally", postData);
                  utility.createPost(postData, adminToken, (err, postdata) => {
                    console.log("response create post", err, postdata);
                    utility.createPost(
                      postData2,
                      adminToken,
                      (err, postdata2) => {
                        console.log("err", err, postdata2);
                      }
                    );
                    if (err)
                      res.json(500, {
                        statusCode: 500,
                        err: err
                      });
                    else {
                      var project = {};
                      designerController.sendEmailSystem(
                        designData,
                        project,
                        res,
                        (err, data) => {
                          console.log(
                            "mail send from designer chat",
                            err,
                            data
                          );
                        }
                      );
                      return res.json(200, {
                        msg: "done",
                        token: userHeader,
                        random_string: random_string,
                        url: "/onething/channels/" + random_string
                      });
                    }
                  });
                }
              );
            }
          });
        } else {
          res.json(400, designData);
        }
      }
    );
  } else {
    res.json(400, {
      msg: "sorry please send emailid or password "
    });
  }
};
designerController.message = designData => {
  var count = 1;
  let msg =
    "Here are the details you just shared with 1THING:" +
    "\n" +
    "**About You**" +
    "\n" +
    "name : " +
    designData.name +
    "\n" +
    "email : " +
    designData.email +
    "\n" +
    "location : " +
    designData.location +
    "\n" +
    "you are : " +
    designData.myself +
    "\n" +
    "mobile : " +
    designData.mobile +
    "\n";
  //     '**tell us more about yourself**' + "\n" +
  //     'you identify yourself as : ' + designData.profile + "\n" +
  //     'linkedin profile : ' + designData.linkedinProfile + "\n" +
  //     'you are : ' + designData.myself + "\n" +
  //     'work experience : ' + designData.workExperience + "\n" +
  //     'you are here for? : ' + designData.role + "\n" +
  //     'availibility in hours : ' + designData.hoursAvailable + "\n" +
  //     'portfolio : ' + designData.portfolio + "\n" +
  //     '**tell us about your expertise**' + "\n" +
  //     'expertise platform(s) : ' + designData.expertisePlatform + "\n"
  // if (designData.expertiseDomain.length > 0) {
  //     for (let i = 0; i < designData.expertiseDomain.length; i++) {
  //         msg = msg + 'select your preferred domain(' + count + ') : ' + designData.expertiseDomain[i].name + "\n" +
  //             'domain modules(' + count + ') : ' + designData.expertiseDomain[i].info + "\n";
  //         count++;
  //     }
  // }
  // msg = msg + '**favourite product(s)**' + "\n" +
  //     'product1 : ' + designData.work.product1 + "\n" +
  //     'what do you like about it? : ' + designData.work.info1 + "\n" +
  //     'product2 : ' + designData.work.product2 + "\n" +
  //     'what do you like about it? : ' + designData.work.info2 + "\n" +
  //     'product3 : ' + designData.work.product3 + "\n" +
  //     'what do you like about it? : ' + designData.work.info3 + "\n" +
  //     'where do you work from? : ' + designData.workingPlace + "\n" +
  //     'three ncecessary things for you to design : ' + designData.necessaryThing.things + "\n" +
  //     'what would you pick? : ' + designData.necessaryThing.selected + "\n" +
  //     '**how you think about yourself**' + "\n" +
  //     'quality of design : ' + designData.rating.design + "\n" +
  //     'ability to use tools : ' + designData.rating.tools + "\n" +
  //     'communication skills : ' + designData.rating.communication + "\n" +
  //     'project management : ' + designData.rating.projectManagement + "\n" +
  //     'working in a team : ' + designData.rating.workingWithTeam + "\n" +
  //     'leading a design team : ' + designData.rating.teamLead + "\n" +
  //     'where did you learn about 1thing? : ' + designData.about1thing

  return msg;
};
designerController.sendEmailSystem = (data, project, res, callback) => {
  async.parallel(
    {
      now: function(callback) {
        res.render(
          "firstMailerDesigner",
          {
            info1: data
          },
          function(err, HTML) {
            utility.sendMail(
              data.email,
              HTML,
              "You made our day",
              "varun@1thing.design",
              (err, data) => {
                console.log("err", err, data);
                callback(err, data);
              }
            );
          }
        );
      },
      delay: function(callback) {
        res.render(
          "gettingStartedWithDesigner",
          {
            info1: data
          },
          function(err, HTML) {
            setTimeout(
              function() {
                utility.sendMail(
                  data.email,
                  HTML,
                  "Getting Started with 1THING",
                  "shreya@1thing.design",
                  (err, data) => {
                    console.log("err", err, data);
                  }
                );
              },
              60000,
              data,
              HTML
            );
            callback(err, "okk");
          }
        );
      },
      admin: function(callback) {
        res.render(
          "1thingdesignerWelcome",
          {
            info1: data,
            info2: project
          },
          function(err, HTML) {
            utility.groupEmail(
              HTML,
              "1THING designer registration",
              "designer",
              (err, data) => {
                console.log("err", err, data);
              }
            );
            callback(null, "ok");
          }
        );
      }
    },
    function(err, results) {
      callback(err, results);
    }
  );
};

designerController.addDesigner = (req, res) => {
  var userObject = {},
    obj = {},
    userArray = [],
    userId,
    channelId,
    userToken,
    userHeader;
  let channel = utility.randomString(8);
  var userName = req.body.name.toLowerCase();
  userName = userName.split(" ");
  if (userName[0] && userName[1]) {
    userName = userName[0] + "_" + userName[1];
  } else {
    userName = userName[0];
  }
  userArray.push(userName);
  // var adminObject = {
  //     email: "manik@1thing.design",
  //     username: "client",
  //     password: "manik314"
  // }
  // var adminObject={
  //     email: "priyank@1thing.design",
  //     username: "client",
  //     password: "design.1"
  // }
  utility.loginByMattermost(env.designer_admin, (err, varunObject) => {
    if (err) {
      res.json(500, {
        statusCode: 500,
        err: err
      });
    }
    console.log("login admin", err, varunObject.body);
    console.log("admintok", varunObject.headers.token, varunObject.body.id);
    var adminToken = varunObject.headers.token;
    var adminId = varunObject.body.id;
    utility.userExist(userArray, adminToken, (err, userexist) => {
      if (err) {
        res.json(500, {
          statusCode: 500,
          err: err
        });
      } else if (userexist.length != 0) {
        userName = userName + "_" + utility.randomStringforUsername(2);
      }
      userObject = {
        email: req.body.email.toLowerCase(),
        password: req.body.password,
        username: userName
      };
      utility.sign_up(userObject, (err, user) => {
        console.log("id checking", user);
        if (err) {
          res.json(400, {
            err: err
          });
        } else {
          obj = {
            name: req.body.name,
            email: req.body.email.toLowerCase(),
            userName: userName,
            mobile: req.body.mobile,
            location: req.body.location,
            myself: req.body.myself,
            userId: user.id,
            userType: "designer",
            channelName: channel
          };
          var designer = new DesignerModel(obj);
          designer.password = designer.generateHash(req.body.password);
          designer.save((err, data) => {
            if (err) {
              res.json(500, {
                err: err
              });
            } else {
              emailController.addEmailer(data, (err, emailer) => {
                console.log("add emailer", err, emailer);
                data.password = req.body.password;
                userId = user.id;
                let obj = {
                  team_id:env.town_hall,
                  userId:userId
                };
                utility.addUserInDynamicTeam(obj, adminToken, (err, clientData) => {
                  console.log("add user in team", err, clientData);
                  if (err) {
                    res.json(500, {
                      statusCode: 500,
                      err: err
                    });
                  } else {
                    utility.loginByMattermost(userObject, (err, login) => {
                      if (err) {
                        console.log("err", err);
                        res.json(500, {
                          statusCode: 500,
                          err: err
                        });
                      } else if (login) {
                        console.log("response", login.headers["set-cookie"]);
                        console.log("response", login.headers.token);
                        //console.log("login", login)
                        userHeader = login.headers["set-cookie"];
                        userToken = login.headers.token;
                        userId = login.body.id;
                        console.log("userId", userId, userToken);
                        console.log("checking ", utility.randomString(3));
                        var post = {
                          name: data.channelName,
                          display_name: "new designer-" + data.userName,
                          type: "P",
                          team_id:env.town_hall
                        };
                        console.log("post data", post, userToken);
                        utility.createDynamicChannel(
                          post,
                          userToken,
                          (err, channel) => {
                            console.log(
                              "create channel response",
                              err,
                              channel
                            );
                            if (err) {
                              res.json(500, {
                                statusCode: 500,
                                err: err
                              });
                            }
                            channelId = channel.id;
                            userData = {
                              channelid: channelId,
                              userId: adminId,
                              team_id:env.town_hall
                            };
                            console.log("userData for add user", userData);
                            utility.addUserInChannelDynamic(
                              userData,
                              userToken,
                              (err, adduser) => {
                                console.log("add user response", err, adduser);
                                utility.addUserinDynamicChannelforDesigners(
                                  userData,
                                  userToken,
                                  (err, userDt) => {
                                    console.log(
                                      "add user in channel",
                                      err,
                                      userDt
                                    );
                                  }
                                );
                                if (err) {
                                  res.json(500, {
                                    statusCode: 500,
                                    err: err
                                  });
                                } else {
                                  DesignerModel.update(
                                    { _id: data._id },
                                    { $set: { channelId: channelId } },
                                    (err, update) => {
                                      if (err) {
                                        res.json(500, err);
                                      } else {
                                        console.log("redirect");
                                        return res.json(200, {
                                          data: data
                                        });
                                      }
                                    }
                                  );
                                }
                              }
                            );
                          }
                        );
                      }
                    });
                  }
                });
              });
            }
          });
        }
      });
    });
  });
};
designerController.addDesignerDetails = (req, res) => {
  if (req.body.designerId) {
    let update = {
      profile: req.body.profile,
      linkedinProfile: req.body.linkedinProfile,
      workExperience: req.body.workExperience,
      role: req.body.role,
      hoursAvailable: req.body.hoursAvailable,
      portfolio: req.body.portfolio
    };
    DesignerModel.update(
      { _id: req.body.designerId },
      { $set: update },
      (err, data) => {
        if (err) {
          res.json(500, err);
        } else {
          res.json(200, data);
        }
      }
    );
  } else {
    res.json(401, {
      msg: "sorry designer id missing"
    });
  }
};
designerController.designerExpertise = (req, res) => {
  if (req.body.designerId) {
    let update = {
      profile: req.body.profile,
      linkedinProfile: req.body.linkedinProfile,
      workExperience: req.body.workExperience,
      role: req.body.role,
      hoursAvailable: req.body.hoursAvailable
    };
    DesignerModel.update(
      { _id: req.body.designerId },
      { $set: update },
      (err, data) => {
        if (err) {
          res.json(500, err);
        } else {
          res.json(200, data);
        }
      }
    );
  } else {
    res.json(401, {
      msg: "sorry designer id missing"
    });
  }
};
designerController.addPerspective = (req, res) => {
  if (req.body.designerId) {
    let update = {
      "work.product1": req.body.product1,
      "work.info1": req.body.info1,
      "work.product2": req.body.product2,
      "work.info2": req.body.info2,
      "work.product3": req.body.product3,
      "work.info3": req.body.info3,
      workingPlace: req.body.workingPlace,
      "necessaryThing.things": req.body.things,
      "necessaryThing.selected": req.body.selected
    };
    DesignerModel.update(
      { _id: req.body.designerId },
      { $set: update },
      (err, data) => {
        if (err) {
          res.json(500, err);
        } else {
          res.json(200, data);
        }
      }
    );
  } else {
    res.json(401, {
      msg: "sorry designer id missing"
    });
  }
};
designerController.addExpertige = (req, res) => {
  if (req.body.designerId) {
    let update = {
      expertisePlatform: req.body.expertisePlatform,
      expertiseDomain: req.body.expertiseDomain
    };
    DesignerModel.update(
      { _id: req.body.designerId },
      { $set: update },
      (err, data) => {
        if (err) {
          res.json(500, err);
        } else {
          res.json(200, data);
        }
      }
    );
  } else {
    res.json(401, {
      msg: "sorry designer id missing"
    });
  }
};

designerController.ratingYourself = (req, res) => {
  if (req.body.designerId) {
    let update = {
      about1thing: req.body.about1thing,
      rating: req.body.rating
    };
    DesignerModel.update(
      { _id: req.body.designerId },
      { $set: update },
      (err, data) => {
        if (err) {
          res.json(500, err);
        } else {
          res.json(200, data);
        }
      }
    );
  } else {
    res.json(401, {
      msg: "sorry designer id missing"
    });
  }
};
designerController.getProfileInfoByUsername = (req, res) => {
  let condition = {};
  condition.userName = req.params.userName;
  DesignerModel.findOne(
    condition,
    { profileInfo: 1, name: 1, userName: 1, email: 1 },
    (err, data) => {
      if (err) {
        res.json(500, err);
      } else if (!data) {
        res.json(400, data);
      } else {
        res.json(200, data);
      }
    }
  );
};
designerController.addDesignerForDummyData = (req, res) => {
  let designer = new DesignerModel({
    name: req.body.name,
    userName: req.body.userName,
    email: req.body.email,
    profileInfo: {
      pic: req.body.pic,
      bio: req.body.bio,
      fb: req.body.fb,
      linkedin: req.body.linkedin,
      insta: req.body.insta,
      pinterest: req.body.pinterest,
      dribble: req.body.dribble,
      behance: req.body.behance,
      portfolio: req.body.portfolio,
      medium: req.body.medium,
      twitter: req.body.twitter,
      google: req.body.google,
      tumblr: req.body.tumblr
    }
  });
  designer.save((err, data) => {
    if (err) {
      res.json(500, err);
    } else {
      res.json(200, data);
    }
  });
};
// workspace work
designerController.addAboutYourself = (req, res) => {
  if (req.body.designerId) {
    let update = {
      profile: req.body.profile,
      linkedinProfile: req.body.linkedinProfile,
      workExperience: req.body.workExperience,
      role: req.body.role,
      hoursAvailable: req.body.hoursAvailable,
      "statusBar.aboutYourself.completed": true,
      "statusBar.aboutYourself.completedDate": moment()
        .tz("Asia/Kolkata")
        .format("LLLL")
    };
    DesignerModel.update(
      { _id: req.body.designerId },
      { $set: update },
      (err, data) => {
        if (err) {
          res.json(500, err);
        } else {
          res.json(200, data);
        }
      }
    );
  } else {
    res.json(401, {
      msg: "sorry designer id missing"
    });
  }
};
designerController.addExpertigeForWorkspace = (req, res) => {
  if (req.body.designerId) {
    let update = {
      expertisePlatform: req.body.expertisePlatform,
      expertiseDomain: req.body.expertiseDomain,
      "statusBar.expertise.completed": true,
      "statusBar.expertise.completedDate": moment()
        .tz("Asia/Kolkata")
        .format("LLLL")
    };
    DesignerModel.update(
      { _id: req.body.designerId },
      { $set: update },
      (err, data) => {
        if (err) {
          res.json(500, err);
        } else {
          res.json(200, data);
        }
      }
    );
  } else {
    res.json(401, {
      msg: "sorry designer id missing"
    });
  }
};
designerController.addPerspectiveForWorkspace = (req, res) => {
  if (req.body.designerId) {
    let update = {
      "work.product1": req.body.product1,
      "work.info1": req.body.info1,
      "work.product2": req.body.product2,
      "work.info2": req.body.info2,
      "work.product3": req.body.product3,
      "work.info3": req.body.info3,
      workingPlace: req.body.workingPlace,
      "necessaryThing.things": req.body.things,
      "necessaryThing.selected": req.body.selected,
      "statusBar.perspective.completed": true,
      "statusBar.perspective.completedDate": moment()
        .tz("Asia/Kolkata")
        .format("LLLL")
    };
    DesignerModel.update(
      { _id: req.body.designerId },
      { $set: update },
      (err, data) => {
        if (err) {
          res.json(500, err);
        } else {
          res.json(200, data);
        }
      }
    );
  } else {
    res.json(401, {
      msg: "sorry designer id missing"
    });
  }
};
designerController.ratingYourselfFromWorkspace = (req, res) => {
  if (req.body.designerId) {
    let update = {
      about1thing: req.body.about1thing,
      rating: req.body.rating,
      "statusBar.thinkAboutYourself.completed": true,
      "statusBar.thinkAboutYourself.completedDate": moment()
        .tz("Asia/Kolkata")
        .format("LLLL")
    };
    DesignerModel.update(
      { _id: req.body.designerId },
      { $set: update },
      (err, data) => {
        if (err) {
          res.json(500, err);
        } else {
          res.json(200, data);
        }
      }
    );
  } else {
    res.json(401, {
      msg: "sorry designer id missing"
    });
  }
};
designerController.getDesignerDetailsByStage = (req, res) => {
  let filter = {};
  console.log("checking", req.query);
  if (req.query.stage == 1) {
    filter.profile = 1;
    filter.linkedinProfile = 1;
    filter.workExperience = 1;
    filter.role = 1;
    filter.hoursAvailable = 1;
    filter.statusBar = 1;
    filter._id = 1;
  }
  if (req.query.stage == 2) {
    filter.expertisePlatform = 1;
    filter.expertiseDomain = 1;
    filter.statusBar = 1;
    filter._id = 1;
  }
  if (req.query.stage == 3) {
    filter.work = 1;
    filter.workingPlace = 1;
    filter.necessaryThing = 1;
    filter.statusBar = 1;
    filter._id = 1;
  }
  if (req.query.stage == 4) {
    filter.about1thing = 1;
    filter.rating = 1;
    filter.statusBar = 1;
    filter._id = 1;
  }
  console.log("fileter", filter);
  DesignerModel.findOne(
    { _id: req.params.id, isActive: true },
    filter,
    (err, data) => {
      if (err) res.json(500, err);
      else res.json(200, data);
    }
  );
};
designerController.usersCsvDownloads = (req, res) => {
  utility.loginByMattermost(env.client_admin, (err, varunObject) => {
    if (err) {
      res.json(500, {
        statusCode: 500,
        err: err
      });
    }
    console.log("login admin", err, varunObject.headers.token);
    var adminToken = varunObject.headers.token;
    utility.getAllUsers(adminToken, (err, data) => {
      if (err) {
        res.json(500, err);
      } else {
        console.log("data", data.length);
      }
      var storeData = [];
      var fields = ["email", "userName", "firstName", "lastName", "userId"];
      async.forEachSeries(
        data,
        (dta, callBack) => {
          var tempData = {
            firstName: dta.first_name,
            lastName: dta.last_name,
            email: dta.email,
            userId: dta.id,
            userName: dta.username
          };
          storeData.push(tempData);
          setImmediate(callBack);
        },
        (err, data) => {
          console.log("hii");
          var csv = json2csv({ data: storeData, fields: fields });
          let d = new Date();
          let curr_date = d.getDate();
          let curr_month = d.getMonth();
          curr_month++;
          let curr_year = d.getFullYear();
          let date = curr_date + "-" + curr_month + "-" + curr_year;
          let time = d.getHours() + "-" + d.getMinutes() + "-" + d.getSeconds();
          let path = "./public/" + date + "_" + time + ".csv";
          fs.writeFile(path, csv, function(err) {
            if (err) {
              console.log("err in to write data in csv formate", err);
              return res.json(500, { message: err });
            } else {
              console.log("file saved");
              fs.readFile(path, function(err, rslt) {
                if (err) {
                  console.log("err in to reading file", err);
                  return res.json(500, { error: err });
                } else {
                  res.json("success");
                }
              });
            }
          });
        }
      );
    });
  });
};

designerController.addUsersByExcelSheet = (req, res) => {
  console.log("dvgbfhgfgh");
  var exceltojson, extension, fileExtension;
  var count = 0;
  var storage = multer.diskStorage({
    //multers disk storage settings
    destination: function(req, file, cb) {
      cb(null, "./public");
    },
    filename: function(req, file, cb) {
      console.log("filename", file.fieldname);
      var datetimestamp = Date.now();
      let d = new Date();
      let curr_date = d.getDate();
      let curr_month = d.getMonth();
      curr_month++;
      let curr_year = d.getFullYear();
      let date = curr_date + "-" + curr_month + "-" + curr_year;
      let time = d.getHours() + "-" + d.getMinutes() + "-" + d.getSeconds();
      cb(
        null,
        file.fieldname +
          "-" +
          date +
          "-" +
          time +
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
      console.log("file information", file);
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
    console.log("err in uploading file", err);
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
    if (
      req.file.originalname.split(".")[
        req.file.originalname.split(".").length - 1
      ] === "xlsx"
    ) {
      exceltojson = xlsxtojson;
    } else {
      exceltojson = xlstojson;
    }
    console.log(req.file.path);
    try {
      exceltojson(
        {
          input: req.file.path,
          output: null, //since we don't need output.json
          lowerCaseHeaders: true
        },
        function(err, result) {
          if (err) {
            return res.json({ error_code: 1, err_desc: err, data: null });
          } else {
            console.log("xcel data********", result);
            var count = 1;
            async.forEachSeries(
              result,
              (data, callback) => {
                var myobj = {};
                console.log("start point", data);
                if (data.Email && data.userId && data.userName) {
                  if (data.userType == "DP") {
                    myobj.email = data.Email;
                    myobj.userId = data.userId;
                    myobj.userName = data.userName;
                    if (data.firstName == "" || data.firstName == undefined) {
                      myobj.name = data.userName;
                    } else {
                      myobj.name = data.firstName + " " + data.lastName;
                    }
                    var designer = new DesignerModel(myobj);
                    console.log("count", count++);
                    designer.save((error, designer) => {
                      if (error) {
                        callback(true, error);
                      } else {
                        console.log("pincode schema", designer);
                        callback();
                      }
                    });
                  } else {
                    callback();
                  }
                } else {
                  console.log("no data");
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
  });
};

//pooja's code

//<------code for saving designer data from excel sheet--------->
designerController.addDsignerInfoForAlgorithm = (req, res) => {
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
        "designerInfo" +
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
          // console.log('result--------->', result)
          if (err) {
            console.log("err in 2nd", err);
            return res.json({ error_code: 1, err_desc: err, data: null });
          } else {
            var count = 1;
            let domain = "";
            // let ava=0;

            async.forEachSeries(
              result,
              (data, callback) => {
                console.log("data----------->", data);
                if(data.Location){
                  utility.getLocations(data.Location, (err, locationArr) => {
                    if (err) {
                      console.log("err in 3rd", err);
                      return res.json({
                        error_code: 1,
                        err_desc: err,
                        data: null
                      });
                    } else {
                      //  console.log('new location'+count++, locationArr);
                      if (data.Email && data.Name && data.Location) {
                        let update = {
                          // name: data.Name,
                          // email: data.Email,
                          location: data.Location.trim(),
                          isLatLong:true,
                          userType:data.userType,
                          isStatic:(((data.IsStatic).toLowerCase()).trim()==="yes")?true:false,
                          name:data.Name.trim(),
                          //profileInfo: {
                            // assignedProject:1,
                            "profileInfo.fb": data.Facebook.trim(),
                            "profileInfo.linkedin": data.Linkedin.trim(),
                            "profileInfo.insta": data.Instagram.trim(),
                            "profileInfo.pinterest": data.Pinterest.trim(),
                            "profileInfo.dribble": data.Dribbble.trim(),
                            "profileInfo.behance": data.Behance.trim(),
                            "profileInfo.twitter": data.Twitter.trim(),
                            "profileInfo.skills":data.Skills === "" ? [] :utility.trimString(data.Skills.split(",")),
                            "profileInfo.seniority": data.Seniority.trim(),
                            "profileInfo.compWorkWith":data.CompaniesWorkedWith === ""? []: utility.trimString(data.CompaniesWorkedWith.split(",")),
                            "profileInfo.jobType": data.JobType.trim(),
                            "profileInfo.experienceYear": data.ExperienceYears.trim(),
                            "profileInfo.productDesigned":data.ProductsDesigned === ""? []: utility.trimString(data.ProductsDesigned.split(",")),
                            "profileInfo.newLocation": locationArr,
                            "profileInfo.domainName":data.DomainName === ""? []: utility.trimString(data.DomainName.split(",")),
                            "profileInfo.productUrl":data.ProductUrl === ""? []: utility.trimString(data.ProductUrl.split(",")),
                            "profileInfo.features":data.Features === ""? []: utility.trimString(data.Features.split(",")),
                            "profileInfo.platformSpecialises":data.PlatformsSpecialises === ""? []: utility.trimString(data.PlatformsSpecialises.split(",")),
                            "profileInfo.in1ThingTeam": (((data.In1thingTeam).toLowerCase()).trim()==="yes")?true:false,
                            "profileInfo.hourlyRates":data.HourlyRates === ""? []: utility.trimString(data.HourlyRates.split(","))
                          //}
                        };
                        DesignerModel.findOneAndUpdate(
                            {email:data.Email.trim()},
                            {$set: update},(err,updateData)=>{
                              if(err){
                                console.log('err------->', err);
                                res.json(500, err);
                              }
                              else{ 
                                // console.log('updateData-------->', updateData);
                                callback();
                              }
                            }
                          )
                      } else {
                        callback();
                      }
                    }
                  });
                }
                else{
                  callback();
                }
                






                
                // let update = {
                //         name: data.Name,
                //         email: data.Email,
                //         location: data.Location,
                //         profileInfo: {
                //           assignedProject:0,
                //           fb: data.Facebook,
                //           linkedin: data.Linkedin,
                //           insta: data.Instagram,
                //           pinterest: data.Pinterest,
                //           dribble: data.Dribbble,
                //           behance: data.Behance,
                //           twitter: data.Twitter,
                //           skills:data.Skills === "" ? [] :utility.trimString(data.Skills.split(",")),
                //           seniority: data.Seniority,
                //           compWorkWith:data.CompaniesWorkedWith === ""? []: utility.trimString(data.CompaniesWorkedWith.split(",")),
                //           jobType: data.JobType,
                //           experienceYear: data.ExperienceYears,
                //           productDesigned:data.ProductsDesigned === ""? []: utility.trimString(data.ProductsDesigned.split(",")),
                //           newLocation: locationArr,
                //           domainName:data.DomainName === ""? []: utility.trimString(data.DomainName.split(",")),
                //           productUrl:data.ProductUrl === ""? []: utility.trimString(data.ProductUrl.split(",")),
                //           features:data.Features === ""? []: utility.trimString(data.Features.split(",")),
                //           platformSpecialises:data.PlatformsSpecialises === ""? []: utility.trimString(data.PlatformsSpecialises.split(",")),
                //           in1ThingTeam: data.In1thingTeam,
                //           hourlyRates:data.HourlyRates === ""? []: utility.trimString(data.HourlyRates.split(","))
                //         }
                //       };
                
                // DesignerModel.findOneAndUpdate(
                //   {email:data.Email},
                //   {$set: { "profileInfo.assignedProject": 0}},(err,updateData)=>{
                //     if(err){
                //       console.log('err------->', err);
                //     }
                //     else{
                //       console.log('updateData-------->', updateData)
                //     }
                //   }
                // )
                
                // utility.getLocations(data.Location, (err, locationArr) => {
                //   if (err) {
                //     console.log("err in 3rd", err);
                //     return res.json({
                //       error_code: 1,
                //       err_desc: err,
                //       data: null
                //     });
                //   } else {
                //     //  console.log('new location'+count++, locationArr);
                //     var myobj = {};
                //     if (data.Name && data.Email && data.Location) {
                //       myobj = {
                //         name: data.Name,
                //         email: data.Email,
                //         location: data.Location,
                //         profileInfo: {
                //           assignedProject:0,
                //           fb: data.Facebook,
                //           linkedin: data.Linkedin,
                //           insta: data.Instagram,
                //           pinterest: data.Pinterest,
                //           dribble: data.Dribbble,
                //           behance: data.Behance,
                //           twitter: data.Twitter,
                //           skills:data.Skills === "" ? [] :utility.trimString(data.Skills.split(",")),
                //           seniority: data.Seniority,
                //           compWorkWith:data.CompaniesWorkedWith === ""? []: utility.trimString(data.CompaniesWorkedWith.split(",")),
                //           jobType: data.JobType,
                //           experienceYear: data.ExperienceYears,
                //           productDesigned:data.ProductsDesigned === ""? []: utility.trimString(data.ProductsDesigned.split(",")),
                //           newLocation: locationArr,
                //           domainName:data.DomainName === ""? []: utility.trimString(data.DomainName.split(",")),
                //           productUrl:data.ProductUrl === ""? []: utility.trimString(data.ProductUrl.split(",")),
                //           features:data.Features === ""? []: utility.trimString(data.Features.split(",")),
                //           platformSpecialises:data.PlatformsSpecialises === ""? []: utility.trimString(data.PlatformsSpecialises.split(",")),
                //           in1ThingTeam: data.In1thingTeam,
                //           hourlyRates:data.HourlyRates === ""? []: utility.trimString(data.HourlyRates.split(","))
                //         }
                //       };
                //       var designer = new DesignerModel(myobj);
                //       designer.save((err, data) => {
                //         if (err) {
                //           console.log("err in 4th", err);
                //           callback(err, null);
                //         } else {
                //           console.log("in callback save");
                //           callback();
                //         }
                //       });
                //     } else {
                //       console.log("in else ");
                //       callback(true, "no data");
                //     }
                //   }
                // });
              },
              err => {
                // console.log("hello");
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

            // });
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

designerController.signupDesignerAlreadyInWorkspace = (req, res)=>{
  let obj = {
              name: req.body.name,
              email: req.body.email.toLowerCase(),
              userName: req.body.userName,
              location: req.body.location,
              myself: req.body.myself,
              userId: req.body.userId,
              userType: "designer",
          };
  var designer = new DesignerModel(obj);
  designer.save((err, data) => {
            if (err) {
              res.json(500, {
                err: err
              });
            }
            else if(data){
              res.json(200, {
                statusCode:200,
                msg:"successfully signup!"
              })
            }
    });
}

//update status
designerController.updateDesignerStatus = (req, res)=>{
  let _obj = {
    workingStatus:"working"
  }
  DesignerModel.update({"profileInfo.assignedProject":{$gt: 0}},{ $set : _obj},{multi:true},(err, data)=>{
    if(err){
      res.status(500).send({err:err});
    }
    else{
      res.status(200).send({data:data})
    }
  });
}
designerController.getSelecetDps1 = (req, res)=>{
  if(req.body.projectId){
    ProjectModel.findOne({_id:req.body.projectId},(err, data)=>{
      if(err){
        res.status(500).send({err:err});
      }
      else if(data){
        res.status(200).send({data:data.assigneDPs});
      }
      else{
        res.status(404).send({err:'Not Found!'});
      }
    });
  }
  else{
    res.status(401).send({err:"Incomplete parameters!"});
  }
}
designerController.getSelecetDps = (req, callBack)=>{
  if(req.projectId){
    ProjectModel.findOne({_id:req.projectId},(err, data)=>{
      if(err){
        // res.status(500).send({err:err});
        callBack({status:500,err:err});
      }
      else if(data){
        // res.status(200).send({data:data.assigneDPs});
        callBack(null,{status:200,data:data.assigneDPs});
      }
      else{
        // res.status(404).send({err:'Not Found!'});
        callBack({status:404,err:'Not Found!'})
      }
    });
  }
  else{
    // res.status(401).send({err:"Incomplete parameters!"});
    callBack({status:404,err:'Incomplete parameters!'})
  }
}

//

//<-----------------------admin panel ------------------------>

//select DL out of three
designerController.getTopSelectDesigner = (req, res)=>{
  console.log('req = ', req.params)
  var designers = [];
  ProjectModel.findOne({_id : req.params.projectId}, (err, projectData)=>{
    // console.log('err in 1 ',err, 'projectData = ', projectData)
    if(err){
      res.json(500, {
        statusCode:500,
        err:err
      })
    }
    else if(projectData){
      
      async.forEachSeries(projectData.assigneTopDLead, (result, projectCallback)=>{
        DesignerModel.findOne(
          {userId:result.workspaceId,_id:result.mongooseId},(err, designerData)=>{
          if(err){
            projectCallback();
          }
          else if(designerData){  
            console.log('Dl------>', designerData.workingStatus)
            let workingProjects = [];
            ProjectModel.find(
              {"DLead.workspaceId":result.workspaceId, 
              "DLead.mongooseId":result.mongooseId},(err, allDesigners)=>{
                console.log('designer', allDesigners.length)
              if(err){
                projectCallback();
              }
              else if(allDesigners.length>0){
                async.forEachSeries(allDesigners, (projectName, projectNameCallback)=>{
                  workingProjects.push(projectName.name);
                  projectNameCallback();
                }, err=>{
                  let _obj = {
                    mongooseId : result.mongooseId,
                    workspaceId : result.workspaceId,
                    name : designerData.name,
                    location : designerData.location,
                    workingProjects : workingProjects,
                    pricePerHour : designerData.profileInfo.hourlyRates,
                    status:designerData.workingStatus
                  }
                  designers.push(_obj);
                  projectCallback();
                })
              }
              else{
                let _obj = {
                  mongooseId : result.mongooseId,
                  workspaceId : result.workspaceId,
                  name : designerData.name,
                  location : designerData.location,
                  workingProjects : [],
                  pricePerHour : designerData.profileInfo.hourlyRates,
                  status:designerData.workingStatus
                }
                designers.push(_obj);
                projectCallback();
              }
            })
          }
          else{
            projectCallback();
          }
        })
      },err => {

          res.json(200, {
          statusCode:200,
          data:designers
        });
      })
    }
    else{
      res.json(404, {
        statusCode:404,
        msg:'Not Found'
      })
    }
  })
}

designerController.selectDL = (req, res)=>{
  console.log('body ', req.body);
  let obj = {
        workspaceId:req.body.workspaceId,
        name:req.body.name,
        mongooseId:req.body.mongooseId,
    }
  ProjectModel.findOneAndUpdate(
    {_id : req.body.projectId},
    {$set : {DLead:obj}},
     {new : true},(err, projectData)=>{
       console.log('projectData', projectData)
       if(err){
         res.json(500,{
           statusCode:500,
           err:err
         });
       }
        else if(projectData){
            //object for add in team
            let teamObject = {
              teamId : projectData.teamDetails.teamId,
              adminUserId :projectData.DLead.workspaceId,
            }

          // add in team and channels
          utility.loginByMattermost(env.teamCreatecredentials, (err, login)=>{
            if(err){
            console.log('add in team error 1');
              res.json(500, {
                statusCode: 500,
                err: err
              });
            }
            else if(login){
              let token = login.headers.token;
              console.log('token-------->', token)
              utility.addSingleUserinClienTeam(teamObject, token, (err, addDesigner)=>{
                if(err){
                  res.json(500,{
                    statusCode : 500,
                    err : err
                  });
                }
                else if(addDesigner){
                  paymentController.addDLInSetOfChannels(projectData,token,(err,addedInChannel)=>{
                      if(err){
                        console.log("err 10")
                        res.json(500,{
                          statusCode:500,
                          err:err
                        });
                      }
                      else if(addedInChannel){
                        res.json(200, {
                            statusCode: 200,
                            msg:'Successfully added in team!'
                        });
                      }
                  });
                }
              });
            }
          });
        }
        else{
          res.status(404).send({err:"Not Found!"})
        }
     });
}

designerController.checkDesignerDublicacy = (req, res)=>{
  let result=[];
  DesignerModel.find({}, (err, data)=>{
    if(err){
      console.log("err 1");
      res.json(500,{
        statusCode:500,
        err:err
      });
    }
    else if(data.length>0){
      async.forEachSeries(data, (designer, callback1)=>{
        DesignerModel.find({userId:designer.userId},(err, data1)=>{
          if(err){
            console.log('err 2');
            res.json(500,{
              statusCode:500,
              err:err
            })
          }
          else if(data1.length>1){
            // async.forEachSeries()
            result.push({
              count:data1.length,
              name:designer.name,
              emailId:designer.email,
              date:designer.createdAt,
              userId:designer.userId,
              data1:data1
            });
            callback1();
          }
          else{
            callback1();
          }
        })
      }, err => {
        res.json(200,{
          statusCode:200,
          result:result
        })
      })
    }
  });
}

designerController.getAllDps = (req, res)=>{
  console.log('getAllDps')
  DesignerModel.find({userType:"DP"},{userId:1, name:1, _id:1},(err, dps)=>{
    console.log('dps = ', dps.length)
    if(err){
      console.log('err', err)
      res.status(500).send({err:err});  
    }
    else if(dps.length>0){
      res.status(200).send({data:dps});
    }
    else{
      res.status(204).send({data:"No DPs Found!"});
    }
  });
}

designerController.selectDps = (req, res)=>{
  console.log('selectDps');
  if(req.body._id && req.body.userId && req.body.name && req.body.projectId){
    let _update={
      userId:req.body.userId,
      _id:req.body._id,
      name:req.body.name
    }
    let condition1 = {
      _id:req.body.projectId,
      "assigneDPs.userId":req.body.userId,
      "assigneDPs._id":req.body._id,
      "assigneDPs.name":req.body.name
    }
    ProjectModel.findOne(condition1, (err, findData)=>{
      if(err){
        res.status(500).send({err:err});
      }
      else if(findData){
        // console.log("find dp data---->",findData)
        res.status(302).send({msg:'Already updated!'});
      }
      else{
        ProjectModel.findOneAndUpdate({_id:req.body.projectId},
          {$push:{assigneDPs:_update}},(err, projectData)=>{
          if(err){
            res.status(500).send({err:err});
          }
          else if(projectData){
            let teamObject = {
              teamId : projectData.teamDetails.teamId,
              adminUserId :req.body.userId,
            }
    
            // add dp in team
            utility.loginByMattermost(env.teamCreatecredentials, (err, login)=>{
              if(err){
              console.log('add in team error 1');
              res.status(500).send({err:err});
              }
              else if(login){
                let token = login.headers.token;
                console.log('token-------->', token)
                utility.addSingleUserinClienTeam(teamObject, token, (err, addDesigner)=>{
                  console.log('addSingleUserinClienTeam ', err,addDesigner );
                  
                  if(err){
                    res.status(500).send({err:err});
                    // res.json(500,{
                    //   statusCode : 500,
                    //   err : err
                    // });
                  }
                  else if(addDesigner){
                    res.status(200).send({msg:"Dps Successfully updated!"});
                    // paymentController.addDLInSetOfChannels(projectData,token,(err,addedInChannel)=>{
                    //     if(err){
                    //       console.log("err 10")
                    //       res.json(500,{
                    //         statusCode:500,
                    //         err:err
                    //       });
                    //     }
                    //     else if(addedInChannel){
                    //       res.json(200, {
                    //           statusCode: 200,
                    //           msg:'Successfully added in team!'
                    //       });
                    //     }
                    // });
                  }
                });
              }
            });
            
          }
          else{
            res.status(404).send({msg:"Not found!"});
          }
        });
      }
    })
    
  }
  else{
    res.status(400).send({msg:"Incomplete parameters!"});
  }


  // if(req.body.designerPartners!==undefined || req.body.projectId){
  //   let _update={
  //     assigneDPs:req.body.designerPartners  
  //   }
  //   ProjectModel.findOneAndUpdate({_id:req.body.projectId},
  //     {$set:_update},(err, projectData)=>{
  //     if(err){
  //       res.status(500).send({err:err});
  //     }
  //     else if(projectData){
  //       res.status(200).send({msg:"Dps Successfully updated!"});
  //     }
  //     else{
  //       res.status(404).send({msg:"Not found!"});
  //     }
  //   });
  // }
  // else{
  //   res.status(400).send({msg:"Incomplete parameters!"});
  // }
}
designerController.deteteDps = (req, res)=>{
  console.log('deteteDps');
  if(req.body._id && req.body.userId && req.body.name && req.body.projectId){
    let _update={
      userId:req.body.userId,
      _id:req.body._id,
      name:req.body.name
    }
    let condition = {
      _id:req.body.projectId,
      "assigneDPs.userId":req.body.userId,
      "assigneDPs._id":req.body._id,
      "assigneDPs.name":req.body.name
    }
    ProjectModel.findOne(condition ,(err, dpsData)=>{
      if(err){
        res.status(500).send({err:err});
      }
      else if(dpsData){
        // console.log('dpsData', dpsData)
        //remove dp from team
        utility.loginByMattermost(env.teamCreatecredentials, (err, login)=>{
          if(err){
          console.log('add in team error 1');
            res.json(500, {
              statusCode: 500,
              err: err
            });
          }
          else if(login){
            let token = login.headers.token;
            // console.log('token-------->', token)
            let teamObject = {
              teamId:dpsData.teamDetails.teamId,
              userId:req.body.userId
            }
            console.log('token-------->', token, teamObject)
            utility.removeUserFromTeam(teamObject, token, (err, deleteUser)=>{
              console.log('removeUserFromTeam ', err,deleteUser )
              if(err){
                res.json(500,{
                  statusCode : 500,
                  err : err
                });
              }
              else if(deleteUser){
                // res.status(200).send({msg:"Dps Successfully Deleted!"});
                let count=0;
                let arr = [];
                arr = dpsData.assigneDPs;
                async.forEachSeries(arr,(result, callback)=>{
                  if(result.userId===req.body.userId && result._id===req.body._id && result.name===req.body.name){
                    arr.splice(count, 1);
                    count++;
                    callback(true);
                  }
                  else{
                    count++;
                    callback();
                  }
                },err=>{
                  dpsData.assigneDPs = arr;
                  dpsData.save((err, data)=>{
                    if(err){
                      res.status(500).send({err:err});
                    }
                    else{
                      res.status(200).send({data:data})
                    }
                  })
                })
              }
            });
          }
          else{
            res.status(404).send({err:"Admin credentails changes!"});
          }
        });
      
      
      }
      else{
          res.status(404).send({err:"Not found!"})  
      }
    })
      
    
  }
  else{
    res.status(400).send({msg:"Incomplete parameters!"});
  }
}

module.exports = designerController;
