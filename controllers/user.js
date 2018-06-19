const UserModel = require("../models/user");
const ProjectModel = require("../models/project");
const ActivitiesCardsModel = require("../models/activitiesCards");
const projectController = require("./project");
const DesignerModel = require("../models/designer");
const ProductJourney = require("../models/productJourney");
const PaymentModel = require("../models/projectPayment");
const AdminModel = require("../models/admin");
const emailController = require("./emailer");
const config = require("../config");
const request = require("request-promise");
const moment = require("moment-timezone");
const utility = require("../utils/utility");
const env = require("../utils/env");
const async = require("async");
const atob = require("atob");
var fs = require("fs");
const XLSX = require("xlsx");
var xlstojson = require("xls-to-json");
var xlsxtojson = require("xls-to-json");
var multer = require("multer");
// const basepath = "http://workspace.1thing.io";
var userController = {};

userController.register = (req, res) => {
  var project = {},
    channelId,
    userArray = [],
    adminToken,
    adminId,
    userObject = {},
    userId,
    userToken,
    userHeader;
  var userName = req.body.name.toLowerCase();
  var random_string = utility.randomString(8);
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
  // var adminObject = {
  //     email: "divanshu@1thing.design",
  //     username: "client",
  //     password: "1thing"
  // }
  utility.loginByMattermost(env.client_admin, (err, adminObj) => {
    if (err) {
      res.json(500, {
        statusCode: 500,
        err: err
      });
    }
    console.log("login admin", err, adminObj.body);
    console.log("admintok", adminObj.headers.token, adminObj.body.id);
    adminToken = adminObj.headers.token;
    adminId = adminObj.body.id;
    utility.userExist(userArray, adminToken, (err, userexist) => {
      if (err) {
        res.json(500, {
          statusCode: 500,
          err: err
        });
      } else if (userexist.length != 0) {
        userName = userName + "_" + utility.randomStringforUsername(2);
      }
      console.log("userName", userName);
      userObject = {
        email: req.body.email.toLowerCase(),
        password: req.body.password,
        username: userName
      };
      utility.sign_up(userObject, (err, userData) => {
        console.log("id checking", err, userData);
        if (err) {
          res.json(400, {
            err: err
          });
        } else {
          myobject = {
            userName: userName,
            name: req.body.name,
            email: req.body.email.toLowerCase(),
            Designation: req.body.Designation,
            mobile: req.body.mobile,
            linkedinProfile: req.body.linkedinProile,
            userId: userData.id,
            userType: "client",
            channelName: random_string
          };
          var user = new UserModel(myobject);
          user.password = user.generateHash(req.body.password);
          user.save((err, data) => {
            console.log("user save data successfully", data);
            if (err)
              res.json(500, {
                statusCode: 500,
                err: err
              });
            emailController.addEmailer(data, (err, emailer) => {
              console.log("add emailer", err, emailer);
              data.password = req.body.password;
              userId = userData.id;
              let obj = {
                userId: userId
              };
              utility.addUserinTeam(obj, adminToken, (err, clientData) => {
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
                        name: myobject.channelName,
                        display_name: "new client-" + req.body.name,
                        type: "P"
                      };
                      console.log("post data", post, userToken);
                      utility.createChannel(post, userToken, (err, channel) => {
                        console.log("create channel response", err, channel);
                        if (err) {
                          res.json(500, {
                            statusCode: 500,
                            err: err
                          });
                        }
                        channelId = channel.id;
                        userData = {
                          channelid: channelId,
                          userId: adminId
                        };
                        console.log("userData for add user", userData);
                        utility.addUser(userData, userToken, (err, adduser) => {
                          console.log("add user response", err, adduser);
                          utility.addUserinChannelforClient(
                            userData,
                            userToken,
                            (err, userDt) => {
                              console.log("add user in channel", err, userDt);
                            }
                          );
                          if (err) {
                            res.json(500, {
                              statusCode: 500,
                              err: err
                            });
                          } else {
                            UserModel.update(
                              { _id: data._id },
                              { $set: { channelId: channelId } },
                              (err, update) => {
                                if (err) {
                                  res.json(500, err);
                                } else {
                                  data.password = req.body.password;
                                  console.log("redirect");
                                  return res.json(200, {
                                    user: data
                                  });
                                }
                              }
                            );
                            // userController.sendEmailSystem(myobject, project, res, (err, data) => {
                            //     console.log("mail send from quick chat", err, data)
                            // })
                            // //userController.setCookies(req,res,userHeader,random_string)
                            // //return res.redirect('http://staging.1thing.io/staging/channels/'+random_string)

                            //  }
                            //})
                          }
                        });
                      });
                    }
                  });
                }
              });
            });
          });
        }
      });
    });
  });
};
userController.sendEmailSystem = (data, project, res, callback) => {
  console.log("calling", project);
  async.parallel(
    {
      now: function(callback) {
        res.render(
          "firstMailerClient",
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
                console.log("at the time mail", err, data);
                callback(err, data);
              }
            );
          }
        );
      },
      delay: function(callback) {
        res.render(
          "gettingStartedWithClient",
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
                  "divanshu@1thing.design",
                  (err, data) => {
                    console.log("after5 min mail", err, data);
                  }
                );
              },
              300000,
              data,
              HTML
            );
            callback(err, "okk");
          }
        );
      },
      admin: function(callback) {
        res.render(
          "1thingWelcome",
          {
            info1: data,
            info2: project
          },
          function(err, HTML) {
            console.log("checking err of html", err);
            utility.groupEmail(
              HTML,
              "1THING client registration",
              "client",
              (err, data) => {
                console.log("groupmail", err, data);
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

userController.sendEmailwithNextStep = (data, project, res, callback) => {
  console.log("calling", project);
  async.parallel(
    {
      now: function(callback) {
        res.render(
          "firstMailerClient",
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
                console.log("at the time mail", err, data);
                callback(err, data);
              }
            );
          }
        );
      },
      admin: function(callback) {
        res.render(
          "1thingWelcome",
          {
            info1: data,
            info2: project
          },
          function(err, HTML) {
            console.log("checking err of html", err);
            utility.groupEmail(
              HTML,
              "1THING client registration",
              "client",
              (err, data) => {
                console.log("groupmail", err, data);
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

userController.quickChat = (req, res) => {
  var channelId,
    userArray = [],
    userObject = {},
    userHeader,
    userId,
    userToken,
    adminToken,
    adminId,
    myobject = {},
    project = {};
  var random_string = utility.randomString(8);
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
  // var adminObject = {
  //     email: "divanshu@1thing.design",
  //     username: "client",
  //     password: "1thing"
  // }
  utility.loginByMattermost(env.client_admin, (err, varunObject) => {
    if (err) {
      res.json(500, {
        statusCode: 500,
        err: err
      });
    } else {
      console.log("login admin", err, varunObject);
      //  console.log("admintok", varunObject.headers.token, varunObject.body.id)
      adminToken = varunObject.headers.token;
      adminId = varunObject.body.id;
      console.log("username array", userArray);
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
        console.log("userName", userName, userObject);
        utility.sign_up(userObject, (err, userData) => {
          console.log("id checking", err, userData);
          if (err) {
            res.json(400, {
              err: err
            });
          } else {
            myobject = {
              userName: userName,
              name: req.body.name,
              email: req.body.email.toLowerCase(),
              Designation: req.body.Designation,
              mobile: req.body.mobile,
              linkedinProfile: req.body.linkedinProile,
              userId: userData.id,
              userType: "client",
              channelName: random_string
            };
            var user = new UserModel(myobject);
            user.password = user.generateHash(req.body.password);
            user.save((err, data) => {
              console.log("user save data successfully", data);
              if (err)
                res.json(500, {
                  statusCode: 500,
                  err: err
                });
              emailController.addEmailer(data, (err, emailer) => {
                console.log("add emailer", err, emailer);
                userId = userData.id;
                let obj = {
                  userId: userId
                };
                utility.addUserinTeam(obj, adminToken, (err, data) => {
                  console.log("add user in team", err, data);
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
                        console.log("userheader is", userHeader);
                        console.log("userId", userId, userToken);
                        console.log("checking ", utility.randomString(3));
                        var post = {
                          name: myobject.channelName,
                          display_name: "new client-" + req.body.name,
                          type: "P"
                        };
                        console.log("post data", post, userToken);
                        utility.createChannel(
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
                              userId: adminId
                            };
                            console.log("userData for add user", userData);
                            utility.addUser(
                              userData,
                              userToken,
                              (err, adduser) => {
                                console.log("add user response", err, adduser);
                                utility.addUserinChannelforClient(
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
                                  let msg =
                                    "Hi " +
                                    req.body.name +
                                    ".\n" +
                                    utility.firstMsg;
                                  let postData = {
                                    channel_id: channelId,
                                    message: msg
                                  };
                                  console.log("create post finally", postData);
                                  utility.createPost(
                                    postData,
                                    adminToken,
                                    (err, postdata) => {
                                      console.log(
                                        "response create post",
                                        err,
                                        postdata
                                      );
                                      if (err)
                                        res.json(500, {
                                          statusCode: 500,
                                          err: err
                                        });
                                      else {
                                        userController.sendEmailSystem(
                                          myobject,
                                          project,
                                          res,
                                          (err, data) => {
                                            console.log(
                                              "mail send from quick chat",
                                              err,
                                              data
                                            );
                                          }
                                        );
                                        //userController.setCookies(req,res,userHeader,random_string)
                                        //return res.redirect('http://staging.1thing.io/staging/channels/'+random_string)
                                        console.log("redirect");
                                        if (userHeader.length == 2) {
                                          userHeader.splice(0, 0, "extra");
                                        }
                                        return res.json(200, {
                                          msg: "done",
                                          token: userHeader,
                                          random_string: random_string,
                                          url:
                                            "/onething/channels/" +
                                            random_string
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
            });
          }
        });
      });
    }
  });
};

userController.setCookies = (req, res) => {
  console.log("req body", req.body);
  const cookie = req.cookies.cookieName;
  const token1 = req.body.token1;
  const token2 = req.body.token2;
  console.log("token", token1);
  console.log("token checking", token2);
  // console.log("token token2", cookie);
  // const string = req.body.random_string;
  const string = "dashboard";
  if (cookie === undefined) {
    let muser_token = token1.split(";")[0].split("=")[1];
    let muser_token_key = token1.split(";")[0].split("=")[0];
    let muser_id = token2.split(";")[0].split("=")[1];
    let muser_id_key = token2.split(";")[0].split("=")[0];
    let muser_expiry = token1.split(";")[2].split("=")[1];
    let maxage = token1.split(";")[3].split("=")[1];
    console.log("max age", maxage);
    console.log("max age", muser_token);
    console.log("max age", muser_token_key);
    console.log("max age", muser_id);
    console.log("max age", muser_id_key);
    res.cookie(muser_token_key, muser_token, {
      maxAge: maxage,
      domain: ".1thing.io",
      path: "/",
      httpOnly: true
    });
    res.cookie(muser_id_key, muser_id, {
      maxAge: maxage,
      domain: ".1thing.io",
      path: "/"
    });
    console.log("cookie created successfully");
    return res.redirect(env.redirect_url + string);
  } else {
    console.log("cookie exists", cookie);
    return res.redirect(env.redirect_url + string);
  }
};
userController.sendmail = (req, res) => {
  res.send("Hello Pinki");
};

userController.quickChatWithLogin = (req, res) => {
  if (req.body.email && req.body.password && req.body.projectId) {
    var userHeader, userToken, userId, adminToken;
    var random_string;
    async.parallel(
      {
        client: function(callback) {
          UserModel.findOne(
            { email: req.body.email.toLowerCase() },
            (err, user) => {
              if (err) {
                callback(err);
              } else {
                callback(null, user);
              }
            }
          );
        },
        project: function(callback) {
          ProjectModel.findOne({ _id: req.body.projectId }, (err, project) => {
            if (err) {
              callback(err);
            } else {
              callback(null, project);
            }
          });
        }
      },
      function(err, results) {
        if (err) {
          res.json(500, {
            err: err
          });
        } else if (!results.client) {
          res.json(400, {
            msg: "user not exist"
          });
        } else {
          var user_name = results.client.name;
          var channelId = results.client.channelId;
          random_string = results.client.channelName;
          var userObject = {
            email: req.body.email.toLowerCase(),
            password: req.body.password
          };
          utility.loginByMattermost(userObject, (err, userObj) => {
            if (err) {
              res.json(500, {
                statusCode: 500,
                err: err
              });
            } else if (userObj) {
              console.log("response", userObj.headers["set-cookie"]);
              console.log("response", userObj.headers.token);
              //console.log("login", login)
              userHeader = userObj.headers["set-cookie"];
              userToken = userObj.headers.token;
              userId = userObj.body.id;
              // var adminObj = {
              //     email: "manik@1thing.design",
              //     username: "client",
              //     password: "manik314"
              // }
              // var adminObj = {
              //     email: "divanshu@1thing.design",
              //     username: "client",
              //     password: "1thing"
              // }
              utility.loginByMattermost(
                env.client_admin,
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
                  // let msg = "Welcome " + userObject.username + ".\n" + utility.firstMsg
                  var msg = userController.message(
                    results.client,
                    results.project
                  );
                  console.log("msg is", msg);
                  var msg2 =
                    "Thanks for sharing the information." +
                    "\n" +
                    "1THING will share the **proposal with cost, time estimates, design process and most importantly, details on your right design team within 48 hours.**";
                  var msg3 = "Hi " + user_name + ".\n" + utility.firstMsg;
                  var postData = {
                    channel_id: channelId,
                    message: msg
                  };
                  var postData2 = {
                    channel_id: channelId,
                    message: msg2
                  };
                  var postData3 = {
                    channel_id: channelId,
                    message: msg3
                  };
                  console.log("create post finally", postData);
                  let channelData = {
                    channelId: channelId,
                    name: random_string,
                    display_name: "new project-" + results.project.name,
                    type: "P"
                  };
                  utility.updateChannelName(
                    channelData,
                    userToken,
                    (err, updateChannel) => {
                      console.log("update channel", updateChannel);
                      if (err) {
                        return res.json(500, err);
                      }
                      utility.createPost(
                        postData,
                        adminToken,
                        (err, postdata) => {
                          console.log("response creste post", err, postdata);
                          utility.createPost(
                            postData2,
                            adminToken,
                            (err, postdata) => {
                              utility.createPost(
                                postData3,
                                adminToken,
                                (err, postdata) => {}
                              );
                            }
                          );
                          if (err)
                            res.json(500, {
                              statusCode: 500,
                              err: err
                            });
                          else {
                            if (
                              results.project.userProposal.startTime &&
                              results.project.userProposal.timeline
                            ) {
                              userController.sendEmailwithNextStep(
                                results.client,
                                results.project,
                                res,
                                (err, data) => {
                                  console.log("mail send", err, data);
                                }
                              );
                              return res.json(200, {
                                msg: "done",
                                token: userHeader,
                                random_string: random_string,
                                url: "/onething/channels/" + random_string
                              });
                            } else {
                              userController.sendEmailSystem(
                                results.client,
                                results.project,
                                res,
                                (err, data) => {
                                  console.log("mail send", err, data);
                                }
                              );
                              if (userHeader.length == 2) {
                                userHeader.splice(0, 0, "extra");
                              }
                              return res.json(200, {
                                msg: "done",
                                token: userHeader,
                                random_string: random_string,
                                url: "/onething/channels/" + random_string
                              });
                            }
                          }
                        }
                      );
                    }
                  );
                }
              );
            }
          });
        }
      }
    );
  } else {
    res.json(400, {
      msg: "sorry please send emailid or password "
    });
  }
};

userController.message = (user, product) => {
  let msg =
    "Here are the details you just shared with 1THING:" +
    "\n" +
    "**About You**  " +
    "\n" +
    "name : " +
    user.name +
    "\n" +
    "email : " +
    user.email +
    "\n" +
    "mobile : " +
    user.mobile +
    "\n" +
    "linkedin profile : " +
    user.linkedinProfile +
    "\n" +
    "designation : " +
    user.Designation +
    "\n";
  //     "**About your product**  " + "\n" +
  //     'product name : ' + product.name + '\n' +
  //     'domain(s) : ' + product.domain + '\n' +
  //     'project type : ' + product.projectType.projectType + '\n';
  // if (product.projectType.link) {
  //     msg = msg + 'product link : ' + product.projectType.link + '\n'
  // }
  // msg = msg +
  //     'platform(s) : ' + product.platform + '\n' +
  //     'similar product(s) : ' + product.similarProduct + '\n';
  // if (product.userDocumentLink.length > 0)
  //     msg = msg + 'scope document link(s) : ' + product.userDocumentLink + '\n';
  // if (product.userProposal.startTime) {
  //     msg = msg + 'start time : ' + product.userProposal.startTime + '\n' +
  //         'expected timeline : ' + product.userProposal.timeline + '\n' +
  //         'budget range : ' + product.userProposal.budgetRange + '\n' +
  //         'design objective : ' + product.userProposal.designObjective + '\n' +
  //         'reference link(s) : ' + product.userProposal.referenceLink + '\n'
  // }
  return msg;
};
userController.quickChatWithCrossSign = (req, res) => {
  if (req.body.email && req.body.password) {
    var userHeader, userToken, userId, adminToken;
    var random_string;
    async.parallel(
      {
        client: function(callback) {
          UserModel.findOne(
            { email: req.body.email.toLowerCase() },
            (err, user) => {
              if (err) {
                callback(err);
              } else {
                callback(null, user);
              }
            }
          );
        }
      },
      function(err, results) {
        if (err) {
          res.json(500, {
            err: err
          });
        } else if (!results.client) {
          res.json(400, {
            msg: "user not exist"
          });
        } else {
          var channelId = results.client.channelId;
          var userName = results.client.name;
          random_string = results.client.channelName;
          var userObject = {
            email: req.body.email.toLowerCase(),
            password: req.body.password,
            username: userName
          };
          utility.loginByMattermost(userObject, (err, userObj) => {
            if (err) {
              res.json(500, {
                statusCode: 500,
                err: err
              });
            } else if (userObj) {
              console.log("response", userObj.headers["set-cookie"]);
              console.log("response", userObj.headers.token);
              //console.log("login", login)
              userHeader = userObj.headers["set-cookie"];
              userToken = userObj.headers.token;
              userId = userObj.body.id;
              // var adminObj = {
              //     email: "manik@1thing.design",
              //     username: "client",
              //     password: "manik314"
              // }
              // var adminObj = {
              //     email: "divanshu@1thing.design",
              //     username: "client",
              //     password: "1thing"
              // }
              utility.loginByMattermost(
                env.client_admin,
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
                  let msg =
                    "Hi " + userObject.username + ".\n" + utility.firstMsg;
                  let postData = {
                    channel_id: channelId,
                    message: msg
                  };
                  console.log("create post finally", postData);
                  utility.createPost(postData, adminToken, (err, postdata) => {
                    console.log("response create post", err, postdata);
                    if (err)
                      res.json(500, {
                        statusCode: 500,
                        err: err
                      });
                    else {
                      var project = {};
                      userController.sendEmailSystem(
                        results.client,
                        project,
                        res,
                        (err, data) => {
                          console.log("mail send", err, data);
                        }
                      );
                      if (userHeader.length == 2) {
                        userHeader.splice(0, 0, "extra");
                      }
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
        }
      }
    );
  } else {
    res.json(400, {
      msg: "sorry please send emailid or password "
    });
  }
};

userController.getAllDesigners = (req, res) => {
  let condition = {};
  if (req.query.email) {
    var emailemp = new RegExp("^" + req.query.email, "i");
    condition.email = { $regex: emailemp };
  }
  UserModel.find(condition, (err, data) => {
    if (err) {
      res.json(500, {
        statusCode: 500,
        err: err
      });
    } else {
      return res.json(200, {
        designers: data
      });
    }
  });
};

userController.login = (req, res) => {
  let auth = req.headers.authorization;
  let dta = auth.split("Basic"),
    tokenData = {};
  let encrypt = atob(dta[1]);
  let decryptdata = encrypt.split(":");
  let storeData = {
    email: decryptdata[0].toLowerCase(),
    password: decryptdata[1]
  };
  console.log("login", storeData);
  let condition = {
    email: storeData.email.trim()
  };
  UserModel.findOne(condition, (err, existing) => {
    if (err) res.json(500, err);
    else if (!existing) {
      res.json(401, {
        msg: "user not exist"
      });
    } else {
      UserModel.findOne(
        { password: storeData.password, email: storeData.email.trim() },
        (err, user) => {
          if (err) {
            res.json(500, err);
          } else if (!user) {
            res.json(401, {
              msg: "password not match"
            });
          } else {
            console.log("user", user);
            let tokenData = { userId: user._id, muserId: user.userId };
            console.log("tokenData", tokenData);
            UserModel.encode(tokenData, (err, token) => {
              console.log("checking", token, err);
              if (err) {
                return res.json(500, {
                  data: err
                });
              } else if (token) {
                return res.json(200, {
                  token: token,
                  tokenExpiry: config.token.EXPIRY,
                  user: user
                });
              }
            });
          }
        }
      );
    }
  });
};
userController.userLogin = (req, res) => {
  if (req.body.email && req.body.password) {
    var user = {
      email: req.body.email,
      password: req.body.password
    };
    utility.loginByMattermost(user, (err, userObj) => {
      if (err) {
        res.json(400, {
          statusCode: 400,
          err: err
        });
      } else {
        var userHeader = userObj.headers["set-cookie"];
        res.json(200, {
          token: userHeader
        });
      }
    });
  } else {
    res.json(400, {
      msg: "please provide email and password"
    });
  }
};

userController.testingSearch = (req, res) => {
  UserModel.find(
    { $text: { $search: req.body.search, $language: "en" } },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .exec(function(err, results) {
      if (err) {
        console.log("err", err);
        res.json(500, err);
      } else {
        console.log("result", results);
        res.json(200, {
          data: results
        });
      }
      // callback
    });
};

//workspace work
userController.findUserDetailsForWorkspace = (req, res) => {
  if (req.params.id) {
    let condition = {
      userId: req.params.id
    };
    async.parallel(
      {
        one: function(callback) {
          UserModel.findOne(condition, (err, data) => {
            callback(err, data);
          });
        },
        two: function(callback) {
          DesignerModel.findOne(condition, (err, data) => {
            callback(err, data);
          });
        }
      },
      function(err, results) {
        if (err) {
          res.json(500, err);
        }
        if (results.one) {
          res.json(200, {
            data: results.one
          });
        } else {
          res.json(200, {
            data: results.two
          });
        }
      }
    );
  } else {
    res.json(400, "sorry please provide userId");
  }
};
userController.addUsersByExcelSheet = (req, res) => {
  console.log("dvgbfhgfgh");
  var exceltojson, extension, fileExtension;
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
                  if (data.userType == "PC") {
                    myobj.email = data.Email;
                    myobj.userId = data.userId;
                    myobj.userName = data.userName;
                    if (data.firstName == "" || data.firstName == undefined) {
                      myobj.name = data.userName;
                    } else {
                      myobj.name = data.firstName + " " + data.lastName;
                    }
                    var user = new UserModel(myobj);
                    console.log("count", count++);
                    user.save((error, designer) => {
                      if (error) {
                        callback(true, error);
                      } else {
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

//********************  Pooja's Code  ***************************//

// EMAIL api and checking email existing
userController.emailAlreadyExist = (req, res) => {
  var adminToken;
  // adminId,
  // userId,
  // userToken,
  // userHeader;
  // console.log("res------>", req.body.email);
  let _req = req.body;
  utility.loginByMattermost(env.client_admin, (err, adminObj) => {
    if (err) {
      res.json(500, {
        statusCode: 500,
        err: err
      });
    }
    adminToken = adminObj.headers.token;
    // adminId = adminObj.body.id;
    utility.userExistByEmail(_req.email, adminToken, (err, user) => {
      // console.log("id checking userExistByEmail", err, user);
      if (user) {
        _data = {
          msg: "email already exist",
          status: 401
        };
        res.send(401, _data);
      } else {
        UserModel.findOne({ email: _req.email }, (err, userData) => {
          // console.log("user Data---->", userData);
          if (err) {
            res.json(500, {
              statusCode: 500,
              err: err
            });
          } else if (userData) {
            _data = {
              msg: "ok",
              status: 200
            };

            res.send(200, _data);
          } else {
            let _obj = {
              email: _req.email.toLowerCase(),
              newUser: true
            };
            var user = new UserModel(_obj);
            user.save((err, data) => {
              // console.log("data------>", data)
              if (err) {
                res.json(500, {
                  statusCode: 500,
                  err: err
                });
              } else if (data) {
                // setTimeout(function (){userController.sendMailToNonSignUpUser(req.body.email,(err,data1)=>{
                //     console.log("data1=======>", data1)
                // })},5000);
                _data = {
                  msg: "ok",
                  status: 200
                  // data:data,
                };
                res.send(200, _data);
              }
            });
          }
        });
      }
    });
  });
};

//NAME api
userController.saveNameOfUser = (req, res) => {
  UserModel.findOneAndUpdate(
    { email: req.body.email.toLowerCase() },
    { $set: { name: req.body.name } },
    { new: true },
    (err, data) => {
      if (err) {
        res.json(500, {
          statusCode: 500,
          err: err
        });
      } else if (data) {
        res.json(200, {
          statusCode: 200,
          msg: "OK",
          data: data
        });
      } else {
        res.json(404, {
          statusCode: 404,
          msg: "NOT FOUND!"
        });
      }
    }
  );
};

//LOCATION api and checking city is valid or not
userController.checkLocationValidOrNot = (req, res) => {
  utility.getLocations(req.body.location, (err, location) => {
    console.log("location-------->", location);
    if (err) {
      res.json(500, {
        statusCode: 500,
        err: err
      });
    } else if (location) {
      res.json(200, {
        statusCode: 200,
        msg: "Valid location"
      });
    } else {
      res.json(400, {
        statusCode: 400,
        msg: "Invalid location"
      });
    }
  });
};

//DESIGNATION api
userController.saveDesignationOfUser = (req, res) => {
  UserModel.findOneAndUpdate(
    { email: req.body.email.toLowerCase() },
    { $set: { Designation: req.body.Designation } },
    { new: true },
    (err, data) => {
      if (err) {
        res.json(500, {
          statusCode: 500,
          err: err
        });
      } else if (data) {
        res.json(200, {
          statusCode: 200,
          msg: "OK",
          data: data
        });
      } else {
        res.json(404, {
          statusCode: 404,
          msg: "NOT FOUND!"
        });
      }
    }
  );
};

//PASSWORD api
userController.savePasswordOfUser = (req, res) => {
  user = new UserModel();
  let _obj = {
    name: req.body.name,
    location: req.body.location,
    Designation: req.body.Designation,
    password: user.generateHash(req.body.password)
  };
  UserModel.findOneAndUpdate(
    { email: req.body.email.toLowerCase() },
    { $set: _obj },
    { new: true },
    (err, data) => {
      if (err) {
        res.json(500, {
          statusCode: 500,
          err: err
        });
      } else if (data) {
        let _myobject = {
          name: req.body.name,
          email: req.body.email
        };
        userController.sendEmailSystemAfterEnterPassword(
          _myobject,
          res,
          (err, send) => {
            console.log("mail send after password entered !");
            res.json(200, {
              statusCode: 200,
              msg: "OK"
            });
          }
        );
      } else {
        res.json(404, {
          statusCode: 404,
          msg: "NOT FOUND!"
        });
      }
    }
  );
};

//Mobile api
userController.saveMobileOfUser = (req, res) => {
  UserModel.findOneAndUpdate(
    { email: req.body.email.toLowerCase() },
    { $set: { password: req.body.mobile } },
    { new: true },
    (err, data) => {
      if (err) {
        res.json(500, {
          statusCode: 500,
          err: err
        });
      } else if (data) {
        res.json(200, {
          statusCode: 200,
          msg: "OK",
          data: data
        });
      } else {
        res.json(404, {
          statusCode: 404,
          msg: "NOT FOUND!"
        });
      }
    }
  );
};

userController.signUpForUserApp = (req, res) => {
  let adminToken,
    adminId,
    userArray = [];

  let random_string = utility.randomString(8);
  let userName = req.body.name.toLowerCase();
  userName = userName.split(" ");
  if (userName[0] && userName[1]) {
    userName = userName[0] + "_" + userName[1];
  } else {
    userName = userName[0];
  }
  userArray.push(userName);

  utility.loginByMattermost(env.teamCreatecredentials, (err, adminObj) => {
    let adminUserId = adminObj.body.id;
    if (err) {
      console.log("signUpForUserApp 1");
      res.status(500).send({ err: err });
    } else {
      adminToken = adminObj.headers.token;
      adminId = adminObj.body.id;
      utility.userExistByEmail(req.body.email, adminToken, (err, exitEmail) => {
        if (exitEmail) {
          res.status(302).send({ msg: "Email already exist!" });
        } else {
          utility.userExist(userArray, adminToken, (err, userExist) => {
            if (err) {
              console.log("signUpForUserApp 2");
              res.status(500).send({ err: err });
            } else if (userExist.length !== 0) {
              userName = userName + "_" + utility.randomStringforUsername(2);
            }
            userObject = {
              email: req.body.email.toLowerCase(),
              password: req.body.password,
              username: userName
            };
            utility.sign_up(userObject, (err, sigupData) => {
              if (err) {
                console.log("signUpForUserApp 3");
                res.status(500).send({ err: err });
              } else if (sigupData) {
                console.log("in Sinup Data!");
                let data = {
                  userId: sigupData.id
                };
                utility.addUserinMonochromeTeam(
                  data,
                  adminToken,
                  (err, monochromeData) => {
                    if (err) {
                      console.log("signUpForUserApp 4");
                      res.status(500).send({ err: err });
                    } else if (monochromeData) {
                      console.log("momochromeData!");
                      res.status(200).send({ msg: "Successfully signup" });
                    }
                  }
                );
              }
            });
          });
        }
      });
    }
  });
};

userController.getSignupType = (req, res) => {
  res.status(200).send({ signUp: false });
};
//user sign up with details old method
userController.userSignUp = (req, res) => {
  let userArray = [],
    adminToken,
    adminId,
    userId,
    userToken,
    userHeader,
    _data = {},
    myobject = {},
    userObject = {};

  let random_string = utility.randomString(8);
  let userName = req.body.name.toLowerCase();
  userName = userName.split(" ");
  if (userName[0] && userName[1]) {
    userName = userName[0] + "_" + userName[1];
  } else {
    userName = userName[0];
  }
  userArray.push(userName);

  let _req = req.body;
  utility.loginByMattermost(env.teamCreatecredentials, (err, adminObj) => {
    let adminUserId = adminObj.body.id;
    if (err) {
      console.log("singup error 1");
      res.json(500, {
        statusCode: 500,
        err: err
      });
    }
    adminToken = adminObj.headers.token;
    adminId = adminObj.body.id;
    utility.userExistByEmail(_req.email, adminToken, (err, user) => {
      if (user) {
        _data = {
          msg: "email already exist",
          status: 401
        };
        res.send(401, _data);
      } else {
        //sign up
        // console.log("username array", userArray);
        utility.userExist(userArray, adminToken, (err, userexist) => {
          if (err) {
            console.log("singup error 3");
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
          // console.log("userName", userName, userObject);
          //find client's lat long
          utility.getLocations(req.body.location, (err, clientLocation) => {
            if (err) {
              console.log("singup error getlocation");
              res.json(500, {
                statusCode: 500,
                err: err
              });
            } else if (clientLocation) {
              utility.sign_up(userObject, (err, userData) => {
                // console.log("id checking", err, userData);

                if (err) {
                  console.log("singup error 4");
                  return res.json(400, {
                    err: err
                  });
                } else {
                  //find designe lead

                  let designer = {
                    clientDomain: req.body.allTags,
                    clientCoordinate: clientLocation
                  };
                  userController.getDesignerLead(designer, (err, dLead) => {
                    if (err) {
                      console.log("singup error 5");
                      return res.json(500, {
                        err: err
                      });
                    } else {
                      // console.log("dLead--------->", dLead);
                      let user = new UserModel();
                      // console.log('password ============',user.generateHash(req.body.password))
                      myobject = {
                        userName: userName,
                        name: req.body.name,
                        // email: req.body.email.toLowerCase(),
                        Designation: req.body.Designation,
                        mobile: req.body.mobile,
                        linkedinProfile: req.body.linkedinProile,
                        userId: userData.id,
                        // userType: "client",
                        longLatLocation: clientLocation,
                        password: req.body.password,
                        nonSignupUser: false,
                        location: req.body.location,
                        password: user.generateHash(req.body.password)
                        // channelName: random_string
                      };
                      UserModel.findOneAndUpdate(
                        { email: req.body.email.toLowerCase() },
                        { $set: myobject },
                        { new: true },
                        (err, data) => {
                          console.log("data------->", data);
                          if (err) {
                            console.log("singup error 6");
                            res.json(500, {
                              statusCode: 500,
                              err: err
                            });
                          } else if (data) {
                            console.log("m in data");
                            projectController.addProjectByUserChatBot(
                              data,
                              dLead,
                              req,
                              (err, project) => {
                                // console.log('project data----->', err, project);
                                if (err) {
                                  console.log("singup error 7");
                                  return res.json(500, {
                                    statusCode: 500,
                                    err: err
                                  });
                                } else {
                                  //update designer
                                  DesignerModel.update(
                                    { email: dLead.email },
                                    {
                                      $set: {
                                        "profileInfo.assignedProject":
                                          dLead.assignedProject + 1
                                      }
                                    },
                                    (err, updateData) => {
                                      if (err) {
                                        console.log("singup error 8");
                                        return res.json(500, {
                                          statusCode: 500,
                                          err: err
                                        });
                                      } else {
                                        // console.log("update data-------->",updateData);
                                        emailController.addEmailer(
                                          data,
                                          (err, emailer) => {
                                            // console.log("add emailer", err, emailer);

                                            //create team
                                            let teamObj = {
                                              name:
                                                req.body.projectName
                                                  .toLowerCase()
                                                  .replace(" ", "") +
                                                utility.randomString(3) +
                                                utility.randomStringforUsername(
                                                  2
                                                ),
                                              display_name:
                                                req.body.projectName,
                                              type: "O"
                                            };
                                            console.log(
                                              "teamObj print---------->",
                                              teamObj
                                            );
                                            utility.createTeam(
                                              teamObj,
                                              adminToken,
                                              (err, teamData) => {
                                                if (err) {
                                                  console.log(
                                                    "singup error 10"
                                                  );
                                                  res.json(500, {
                                                    statusCode: 500,
                                                    err: err
                                                  });
                                                } else {
                                                  console.log("count admin");
                                                  var adminArr = [];
                                                  adminArr.push({
                                                    team_id: teamData.id,
                                                    user_id: userData.id
                                                  });

                                                  utility.addUsersinClientTeam(
                                                    adminArr,
                                                    adminToken,
                                                    teamData.id,
                                                    (
                                                      err,
                                                      membersAdded
                                                    ) => {
                                                      if (err) {
                                                        console.log(
                                                          "singup error 11",
                                                          err
                                                        );
                                                        res.json(
                                                          500,
                                                          {
                                                            statusCode: 500,
                                                            err: err
                                                          }
                                                        );
                                                      } else {
                                                        // console.log("membersAdded--------->",membersAdded);
                                                        userController.createSetOfChannelsAfterSignup(
                                                          teamData.id,
                                                          req.body
                                                            .projectName,
                                                          userData.id,
                                                          adminToken,
                                                          (
                                                            err,
                                                            createResponse
                                                          ) => {
                                                            // console.log("createResponse==============>", createResponse)
                                                            if (err) {
                                                              console.log(
                                                                "singup error 12",
                                                                err
                                                              );
                                                              res.json(
                                                                500,
                                                                {
                                                                  statusCode: 500,
                                                                  err: err
                                                                }
                                                              );
                                                            } else if (
                                                              createResponse
                                                            ) {
                                                              console.log(
                                                                "channels created!!!"
                                                              );
                                                              ProjectModel.findOneAndUpdate(
                                                                {
                                                                  "user.id":
                                                                    userData.id
                                                                },
                                                                {
                                                                  $set: {
                                                                    "teamDetails.teamId":
                                                                      teamData.id,
                                                                    "teamDetails.name":
                                                                      teamObj.name,
                                                                    //public channels
                                                                    productChannelId:
                                                                      createResponse
                                                                        .product
                                                                        .id,
                                                                    knowledgeChannelId:
                                                                      createResponse
                                                                        .knowledgebase
                                                                        .id,
                                                                    minutesOfMeetingsChannelId:
                                                                      createResponse
                                                                        .minutesofmeetings
                                                                        .id,
                                                                    // docsAndDeliverablesChannelId:"",

                                                                    //private channels
                                                                    designChannelId:
                                                                      createResponse
                                                                        .design
                                                                        .id,
                                                                    reviewChannelId:
                                                                      createResponse
                                                                        .review
                                                                        .id,
                                                                    mimiChannelId:
                                                                      createResponse
                                                                        .mimi
                                                                        .id,
                                                                    mimiProductChannelId:
                                                                      createResponse
                                                                        .mimiFromProduct
                                                                        .id
                                                                  }
                                                                },
                                                                {
                                                                  new: true
                                                                },
                                                                (
                                                                  err,
                                                                  projectUpdate
                                                                ) => {
                                                                  if (
                                                                    err
                                                                  ) {
                                                                    res.json(
                                                                      500,
                                                                      {
                                                                        statusCode: 500,
                                                                        err: err
                                                                      }
                                                                    );
                                                                  } else if (
                                                                    projectUpdate
                                                                  ) {
                                                                    // console.log("projectUpdate=======>", projectUpdate)
                                                                    utility.loginByMattermost(
                                                                      userObject,
                                                                      (
                                                                        err,
                                                                        login
                                                                      ) => {
                                                                        if (
                                                                          err
                                                                        ) {
                                                                          res.json(
                                                                            500,
                                                                            {
                                                                              statusCode: 500,
                                                                              err: err
                                                                            }
                                                                          );
                                                                        } else if (
                                                                          login
                                                                        ) {
                                                                          console.log(
                                                                            "login.headers.token--------->",
                                                                            login
                                                                              .headers
                                                                              .token
                                                                          );
                                                                          userHeader =
                                                                            login
                                                                              .headers[
                                                                              "set-cookie"
                                                                            ];
                                                                          // userToken = login.headers.token;
                                                                          // userId = login.body.id;

                                                                          console.log(
                                                                            "redirect"
                                                                          );
                                                                          let _myobject = {
                                                                            name:
                                                                              req
                                                                                .body
                                                                                .name,
                                                                            email:
                                                                              req
                                                                                .body
                                                                                .email
                                                                          };
                                                                          userController.sendEmailSystemAfterSignUp(
                                                                            _myobject,
                                                                            res,
                                                                            (
                                                                              err,
                                                                              data
                                                                            ) => {
                                                                              console.log(
                                                                                "mail send after signup"
                                                                              );
                                                                            }
                                                                          );
                                                                          if (
                                                                            userHeader.length ==
                                                                            2
                                                                          ) {
                                                                            userHeader.splice(
                                                                              0,
                                                                              0,
                                                                              "extra"
                                                                            );
                                                                          }
                                                                          return res.json(
                                                                            200,
                                                                            {
                                                                              msg:
                                                                                "done",
                                                                              token: userHeader,
                                                                              random_string: random_string,
                                                                              user: {
                                                                                userId:
                                                                                  myobject.userId
                                                                              },
                                                                              team: {
                                                                                name:
                                                                                  teamData.name
                                                                              }
                                                                              // project:projectUpdate,
                                                                              // channel:createResponse
                                                                              // url: "/onething/channels/" + random_string
                                                                            }
                                                                          );
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
                                                    }
                                                  );




                                                  // AdminModel.find(
                                                  //   {},
                                                  //   (err, adminData) => {
                                                  //     if (err) {
                                                  //       res
                                                  //         .status(500)
                                                  //         .send({ err: err });
                                                  //     } else {
                                                  //       console.log(
                                                  //         "count admin else "
                                                  //       );
                                                  //       var adminArr = [];
                                                  //       adminArr.push({
                                                  //         team_id: teamData.id,
                                                  //         user_id: userData.id
                                                  //       });
                                                  //       async.forEachSeries(
                                                  //         adminData,
                                                  //         (
                                                  //           adminResult,
                                                  //           adminCallback
                                                  //         ) => {
                                                  //           adminArr.push({
                                                  //             team_id:
                                                  //               teamData.id,
                                                  //             user_id:
                                                  //               adminResult.userId
                                                  //           });
                                                  //           adminCallback();
                                                  //         },
                                                  //         err => {
                                                  //           //   let addMemberObj = {
                                                  //           //   teamId: teamData.id,
                                                  //           //   adminUserId: userData.id
                                                  //           // };
                                                  //           console.log(
                                                  //             "adminArr",
                                                  //             adminArr
                                                  //           );
                                                  //           adminArr.push({
                                                  //             team_id:
                                                  //               teamData.id,
                                                  //             user_id:
                                                  //               userData.id
                                                  //           });
                                                  //           utility.addUsersinClientTeam(
                                                  //             adminArr,
                                                  //             adminToken,
                                                  //             teamData.id,
                                                  //             (
                                                  //               err,
                                                  //               membersAdded
                                                  //             ) => {
                                                  //               if (err) {
                                                  //                 console.log(
                                                  //                   "singup error 11",
                                                  //                   err
                                                  //                 );
                                                  //                 res.json(
                                                  //                   500,
                                                  //                   {
                                                  //                     statusCode: 500,
                                                  //                     err: err
                                                  //                   }
                                                  //                 );
                                                  //               } else {
                                                  //                 // console.log("membersAdded--------->",membersAdded);
                                                  //                 userController.createSetOfChannelsAfterSignup(
                                                  //                   teamData.id,
                                                  //                   req.body
                                                  //                     .projectName,
                                                  //                   userData.id,
                                                  //                   adminToken,
                                                  //                   (
                                                  //                     err,
                                                  //                     createResponse
                                                  //                   ) => {
                                                  //                     // console.log("createResponse==============>", createResponse)
                                                  //                     if (err) {
                                                  //                       console.log(
                                                  //                         "singup error 12",
                                                  //                         err
                                                  //                       );
                                                  //                       res.json(
                                                  //                         500,
                                                  //                         {
                                                  //                           statusCode: 500,
                                                  //                           err: err
                                                  //                         }
                                                  //                       );
                                                  //                     } else if (
                                                  //                       createResponse
                                                  //                     ) {
                                                  //                       console.log(
                                                  //                         "channels created!!!"
                                                  //                       );
                                                  //                       ProjectModel.findOneAndUpdate(
                                                  //                         {
                                                  //                           "user.id":
                                                  //                             userData.id
                                                  //                         },
                                                  //                         {
                                                  //                           $set: {
                                                  //                             "teamDetails.teamId":
                                                  //                               teamData.id,
                                                  //                             "teamDetails.name":
                                                  //                               teamObj.name,
                                                  //                             //public channels
                                                  //                             productChannelId:
                                                  //                               createResponse
                                                  //                                 .product
                                                  //                                 .id,
                                                  //                             knowledgeChannelId:
                                                  //                               createResponse
                                                  //                                 .knowledgebase
                                                  //                                 .id,
                                                  //                             minutesOfMeetingsChannelId:
                                                  //                               createResponse
                                                  //                                 .minutesofmeetings
                                                  //                                 .id,
                                                  //                             // docsAndDeliverablesChannelId:"",

                                                  //                             //private channels
                                                  //                             designChannelId:
                                                  //                               createResponse
                                                  //                                 .design
                                                  //                                 .id,
                                                  //                             reviewChannelId:
                                                  //                               createResponse
                                                  //                                 .review
                                                  //                                 .id,
                                                  //                             mimiChannelId:
                                                  //                               createResponse
                                                  //                                 .mimi
                                                  //                                 .id,
                                                  //                             mimiProductChannelId:
                                                  //                               createResponse
                                                  //                                 .mimiFromProduct
                                                  //                                 .id
                                                  //                           }
                                                  //                         },
                                                  //                         {
                                                  //                           new: true
                                                  //                         },
                                                  //                         (
                                                  //                           err,
                                                  //                           projectUpdate
                                                  //                         ) => {
                                                  //                           if (
                                                  //                             err
                                                  //                           ) {
                                                  //                             res.json(
                                                  //                               500,
                                                  //                               {
                                                  //                                 statusCode: 500,
                                                  //                                 err: err
                                                  //                               }
                                                  //                             );
                                                  //                           } else if (
                                                  //                             projectUpdate
                                                  //                           ) {
                                                  //                             // console.log("projectUpdate=======>", projectUpdate)
                                                  //                             utility.loginByMattermost(
                                                  //                               userObject,
                                                  //                               (
                                                  //                                 err,
                                                  //                                 login
                                                  //                               ) => {
                                                  //                                 if (
                                                  //                                   err
                                                  //                                 ) {
                                                  //                                   res.json(
                                                  //                                     500,
                                                  //                                     {
                                                  //                                       statusCode: 500,
                                                  //                                       err: err
                                                  //                                     }
                                                  //                                   );
                                                  //                                 } else if (
                                                  //                                   login
                                                  //                                 ) {
                                                  //                                   console.log(
                                                  //                                     "login.headers.token--------->",
                                                  //                                     login
                                                  //                                       .headers
                                                  //                                       .token
                                                  //                                   );
                                                  //                                   userHeader =
                                                  //                                     login
                                                  //                                       .headers[
                                                  //                                       "set-cookie"
                                                  //                                     ];
                                                  //                                   // userToken = login.headers.token;
                                                  //                                   // userId = login.body.id;

                                                  //                                   console.log(
                                                  //                                     "redirect"
                                                  //                                   );
                                                  //                                   let _myobject = {
                                                  //                                     name:
                                                  //                                       req
                                                  //                                         .body
                                                  //                                         .name,
                                                  //                                     email:
                                                  //                                       req
                                                  //                                         .body
                                                  //                                         .email
                                                  //                                   };
                                                  //                                   userController.sendEmailSystemAfterSignUp(
                                                  //                                     _myobject,
                                                  //                                     res,
                                                  //                                     (
                                                  //                                       err,
                                                  //                                       data
                                                  //                                     ) => {
                                                  //                                       console.log(
                                                  //                                         "mail send after signup"
                                                  //                                       );
                                                  //                                     }
                                                  //                                   );
                                                  //                                   if (
                                                  //                                     userHeader.length ==
                                                  //                                     2
                                                  //                                   ) {
                                                  //                                     userHeader.splice(
                                                  //                                       0,
                                                  //                                       0,
                                                  //                                       "extra"
                                                  //                                     );
                                                  //                                   }
                                                  //                                   return res.json(
                                                  //                                     200,
                                                  //                                     {
                                                  //                                       msg:
                                                  //                                         "done",
                                                  //                                       token: userHeader,
                                                  //                                       random_string: random_string,
                                                  //                                       user: {
                                                  //                                         userId:
                                                  //                                           myobject.userId
                                                  //                                       },
                                                  //                                       team: {
                                                  //                                         name:
                                                  //                                           teamData.name
                                                  //                                       }
                                                  //                                       // project:projectUpdate,
                                                  //                                       // channel:createResponse
                                                  //                                       // url: "/onething/channels/" + random_string
                                                  //                                     }
                                                  //                                   );
                                                  //                                 }
                                                  //                               }
                                                  //                             );
                                                  //                           }
                                                  //                         }
                                                  //                       );
                                                  //                     }
                                                  //                   }
                                                  //                 );
                                                  //               }
                                                  //             }
                                                  //           );
                                                  //         }
                                                  //       );
                                                  //     }
                                                  //   }
                                                  // );
                                                }
                                              }
                                            );
                                          }
                                        );
                                      }
                                    }
                                  );
                                }
                              }
                            );
                          } else {
                            res.json(404, {
                              statusCode: 404,
                              msg: "Email Not Found!"
                            });
                          }
                        }
                      );
                    }
                  });
                }
              });
            } else {
              res.json(400, {
                statusCode: 400,
                msg: "Please provide correct location!"
              });
            }
          });
        });
      }
    });
  });
};

// new method
userController.userSignUpTesting = (req, res) => {
  let userArray = [],
    adminToken,
    adminId,
    userId,
    userToken,
    userHeader,
    _data = {},
    myobject = {},
    userObject = {};

  let random_string = utility.randomString(8);
  let userName = req.body.name.toLowerCase();
  userName = userName.split(" ");
  if (userName[0] && userName[1]) {
    userName = userName[0] + "_" + userName[1];
  } else {
    userName = userName[0];
  }
  userArray.push(userName);

  let _req = req.body;
  utility.loginByMattermost(env.teamCreatecredentials, (err, adminObj) => {
    let adminUserId = adminObj.body.id;
    if (err) {
      console.log("singup error 1");
      res.json(500, {
        statusCode: 500,
        err: err
      });
    }
    adminToken = adminObj.headers.token;
    adminId = adminObj.body.id;
    utility.userExistByEmail(_req.email, adminToken, (err, user) => {
      if (user) {
        _data = {
          msg: "email already exist",
          status: 401
        };
        res.send(401, _data);
      } else {
        //sign up
        // console.log("username array", userArray);
        utility.userExist(userArray, adminToken, (err, userexist) => {
          if (err) {
            console.log("singup error 3");
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
          // console.log("userName", userName, userObject);
          //find client's lat long
          utility.getLocations(req.body.location, (err, clientLocation) => {
            if (err) {
              console.log("singup error getlocation");
              res.json(500, {
                statusCode: 500,
                err: err
              });
            } else if (clientLocation) {
              utility.sign_up(userObject, (err, userData) => {
                // console.log("id checking", err, userData);

                if (err) {
                  console.log("singup error 4");
                  return res.json(400, {
                    err: err
                  });
                } else {
                  //find designe lead
                  let designer = {
                    clientDomain: req.body.allTags,
                    clientCoordinate: clientLocation
                  };
                  userController.getDesignerLeads(designer, (err, dLead) => {
                    if (err) {
                      console.log("singup error 5");
                      return res.json(500, {
                        err: err
                      });
                    } else {
                      console.log("dLead--------->", dLead);
                      let user = new UserModel();
                      myobject = {
                        userName: userName,
                        name: req.body.name,
                        // email: req.body.email.toLowerCase(),
                        Designation: req.body.Designation,
                        mobile: req.body.mobile,
                        linkedinProfile: req.body.linkedinProile,
                        userId: userData.id,
                        userType: "client",
                        longLatLocation: clientLocation,
                        password: req.body.password,
                        nonSignupUser: false,
                        location: req.body.location,
                        password: user.generateHash(req.body.password)
                      };
                      UserModel.findOneAndUpdate(
                        { email: req.body.email.toLowerCase() },
                        { $set: myobject },
                        { new: true },
                        (err, data) => {
                          // console.log('data------->', data)
                          if (err) {
                            console.log("singup error 6");
                            res.json(500, {
                              statusCode: 500,
                              err: err
                            });
                          } else if (data) {
                            projectController.addProjectByUserChatBots(
                              data,
                              dLead,
                              req,
                              (err, project) => {
                                // console.log('project data----->', err, project);
                                if (err) {
                                  console.log("singup error 7");
                                  return res.json(500, {
                                    statusCode: 500,
                                    err: err
                                  });
                                } else {
                                  //update designer
                                  // DesignerModel.update(
                                  //   { email: dLead.email },
                                  //   {
                                  //     $set: {
                                  //       "profileInfo.assignedProject":
                                  //         dLead.assignedProject + 1
                                  //     }
                                  //   },
                                  //   (err, updateData) => {
                                  // if (err) {
                                  //   console.log("singup error 8");
                                  //   return res.json(500, {
                                  //     statusCode: 500,
                                  //     err: err
                                  //   });
                                  // } else {
                                  // console.log("update data-------->",updateData);
                                  emailController.addEmailer(
                                    data,
                                    (err, emailer) => {
                                      // console.log("add emailer", err, emailer);

                                      //create team
                                      let teamObj = {
                                        name:
                                          req.body.projectName
                                            .toLowerCase()
                                            .replace(" ", "") +
                                          utility.randomString(3) +
                                          utility.randomStringforUsername(2),
                                        display_name: req.body.projectName,
                                        type: "O"
                                      };
                                      console.log(
                                        "teamObj print---------->",
                                        teamObj
                                      );
                                      utility.createTeam(
                                        teamObj,
                                        adminToken,
                                        (err, teamData) => {
                                          if (err) {
                                            console.log("singup error 10");
                                            res.json(500, {
                                              statusCode: 500,
                                              err: err
                                            });
                                          } else {
                                            // console.log(
                                            //   "teamData------>",
                                            //   teamData
                                            // );
                                            var adminArr = [];
                                            adminArr.push({
                                              team_id: teamData.id,
                                              user_id: userData.id
                                            });

                                            utility.addUsersinClientTeam(
                                              adminArr,
                                              adminToken,
                                              teamData.id,
                                              (
                                                err,
                                                membersAdded
                                              ) => {
                                                if (err) {
                                                  console.log(
                                                    "singup error 11",
                                                    err
                                                  );
                                                  res.json(
                                                    500,
                                                    {
                                                      statusCode: 500,
                                                      err: err
                                                    }
                                                  );
                                                } else {
                                                  // console.log("membersAdded--------->",membersAdded);
                                                  userController.createSetOfChannelsAfterSignup(
                                                    teamData.id,
                                                    req.body
                                                      .projectName,
                                                    userData.id,
                                                    adminToken,
                                                    (
                                                      err,
                                                      createResponse
                                                    ) => {
                                                      // console.log("createResponse==============>", createResponse)
                                                      if (err) {
                                                        console.log(
                                                          "singup error 12",
                                                          err
                                                        );
                                                        res.json(
                                                          500,
                                                          {
                                                            statusCode: 500,
                                                            err: err
                                                          }
                                                        );
                                                      } else if (
                                                        createResponse
                                                      ) {
                                                        console.log(
                                                          "channels created!!!"
                                                        );
                                                        ProjectModel.findOneAndUpdate(
                                                          {
                                                            "user.id":
                                                              userData.id
                                                          },
                                                          {
                                                            $set: {
                                                              "teamDetails.teamId":
                                                                teamData.id,
                                                              "teamDetails.name":
                                                                teamObj.name,
                                                              //public channels
                                                              productChannelId:
                                                                createResponse
                                                                  .product
                                                                  .id,
                                                              knowledgeChannelId:
                                                                createResponse
                                                                  .knowledgebase
                                                                  .id,
                                                              minutesOfMeetingsChannelId:
                                                                createResponse
                                                                  .minutesofmeetings
                                                                  .id,
                                                              // docsAndDeliverablesChannelId:"",

                                                              //private channels
                                                              designChannelId:
                                                                createResponse
                                                                  .design
                                                                  .id,
                                                              reviewChannelId:
                                                                createResponse
                                                                  .review
                                                                  .id,
                                                              mimiChannelId:
                                                                createResponse
                                                                  .mimi
                                                                  .id,
                                                              mimiProductChannelId:
                                                                createResponse
                                                                  .mimiFromProduct
                                                                  .id
                                                            }
                                                          },
                                                          {
                                                            new: true
                                                          },
                                                          (
                                                            err,
                                                            projectUpdate
                                                          ) => {
                                                            if (
                                                              err
                                                            ) {
                                                              res.json(
                                                                500,
                                                                {
                                                                  statusCode: 500,
                                                                  err: err
                                                                }
                                                              );
                                                            } else if (
                                                              projectUpdate
                                                            ) {
                                                              // console.log("projectUpdate=======>", projectUpdate)
                                                              utility.loginByMattermost(
                                                                userObject,
                                                                (
                                                                  err,
                                                                  login
                                                                ) => {
                                                                  if (
                                                                    err
                                                                  ) {
                                                                    res.json(
                                                                      500,
                                                                      {
                                                                        statusCode: 500,
                                                                        err: err
                                                                      }
                                                                    );
                                                                  } else if (
                                                                    login
                                                                  ) {
                                                                    console.log(
                                                                      "login.headers.token--------->",
                                                                      login
                                                                        .headers
                                                                        .token
                                                                    );
                                                                    userHeader =
                                                                      login
                                                                        .headers[
                                                                        "set-cookie"
                                                                      ];
                                                                    // userToken = login.headers.token;
                                                                    // userId = login.body.id;

                                                                    console.log(
                                                                      "redirect"
                                                                    );
                                                                    let _myobject = {
                                                                      name:
                                                                        req
                                                                          .body
                                                                          .name,
                                                                      email:
                                                                        req
                                                                          .body
                                                                          .email
                                                                    };
                                                                    userController.sendEmailSystemAfterSignUp(
                                                                      _myobject,
                                                                      res,
                                                                      (
                                                                        err,
                                                                        data
                                                                      ) => {
                                                                        console.log(
                                                                          "mail send after signup"
                                                                        );
                                                                      }
                                                                    );
                                                                    if (
                                                                      userHeader.length ==
                                                                      2
                                                                    ) {
                                                                      userHeader.splice(
                                                                        0,
                                                                        0,
                                                                        "extra"
                                                                      );
                                                                    }
                                                                    return res.json(
                                                                      200,
                                                                      {
                                                                        msg:
                                                                          "done",
                                                                        token: userHeader,
                                                                        random_string: random_string,
                                                                        user: {
                                                                          userId:
                                                                            myobject.userId
                                                                        },
                                                                        team: {
                                                                          name:
                                                                            teamData.name
                                                                        }
                                                                        // project:projectUpdate,
                                                                        // channel:createResponse
                                                                        // url: "/onething/channels/" + random_string
                                                                      }
                                                                    );
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
                                              }
                                            );
                                            // AdminModel.find(
                                            //   {},
                                            //   (err, adminData) => {
                                            //     if (err) {
                                            //       res
                                            //         .status(500)
                                            //         .send({ err: err });
                                            //     } else {
                                            //       let adminArr = [];
                                            //       async.forEachSeries(
                                            //         adminData,
                                            //         (
                                            //           adminResult,
                                            //           adminCallback
                                            //         ) => {
                                            //           adminArr.push({
                                            //             team_id: teamData.id,
                                            //             user_id:
                                            //               adminResult.userId
                                            //           });
                                            //           adminCallback();
                                            //         },
                                            //         err => {
                                            //           //   let addMemberObj = {
                                            //           //   teamId: teamData.id,
                                            //           //   adminUserId: userData.id
                                            //           // };
                                            //           adminArr.push({
                                            //             team_id: teamData.id,
                                            //             user_id: userData.id
                                            //           });
                                            //           console.log(
                                            //             "admin Arr =========",
                                            //             adminArr
                                            //           );
                                            //           utility.addUsersinClientTeam(
                                            //             adminArr,
                                            //             adminToken,
                                            //             teamData.id,
                                            //             (err, membersAdded) => {
                                            //               if (err) {
                                            //                 console.log(
                                            //                   "singup error 11",
                                            //                   err
                                            //                 );
                                            //                 res.json(500, {
                                            //                   statusCode: 500,
                                            //                   err: err
                                            //                 });
                                            //               } else {
                                            //                 console.log(
                                            //                   "membersAdded--------->",
                                            //                   membersAdded
                                            //                 );
                                            //                 userController.createSetOfChannelsAfterSignup(
                                            //                   teamData.id,
                                            //                   req.body
                                            //                     .projectName,
                                            //                   userData.id,
                                            //                   adminToken,
                                            //                   (
                                            //                     err,
                                            //                     createResponse
                                            //                   ) => {
                                            //                     // console.log("createResponse==============>", createResponse)
                                            //                     if (err) {
                                            //                       console.log(
                                            //                         "singup error 12",
                                            //                         err
                                            //                       );
                                            //                       res.json(
                                            //                         500,
                                            //                         {
                                            //                           statusCode: 500,
                                            //                           err: err
                                            //                         }
                                            //                       );
                                            //                     } else if (
                                            //                       createResponse
                                            //                     ) {
                                            //                       console.log(
                                            //                         "channels created!!!"
                                            //                       );
                                            //                       ProjectModel.findOneAndUpdate(
                                            //                         {
                                            //                           "user.id":
                                            //                             userData.id
                                            //                         },
                                            //                         {
                                            //                           $set: {
                                            //                             "teamDetails.teamId":
                                            //                               teamData.id,
                                            //                             "teamDetails.name":
                                            //                               teamObj.name,
                                            //                             //public channels
                                            //                             productChannelId:
                                            //                               createResponse
                                            //                                 .product
                                            //                                 .id,
                                            //                             knowledgeChannelId:
                                            //                               createResponse
                                            //                                 .knowledgebase
                                            //                                 .id,
                                            //                             minutesOfMeetingsChannelId:
                                            //                               createResponse
                                            //                                 .minutesofmeetings
                                            //                                 .id,
                                            //                             // docsAndDeliverablesChannelId:"",

                                            //                             //private channels
                                            //                             designChannelId:
                                            //                               createResponse
                                            //                                 .design
                                            //                                 .id,
                                            //                             reviewChannelId:
                                            //                               createResponse
                                            //                                 .review
                                            //                                 .id,
                                            //                             mimiChannelId:
                                            //                               createResponse
                                            //                                 .mimi
                                            //                                 .id,
                                            //                             mimiProductChannelId:
                                            //                               createResponse
                                            //                                 .mimiFromProduct
                                            //                                 .id
                                            //                           }
                                            //                         },
                                            //                         {
                                            //                           new: true
                                            //                         },
                                            //                         (
                                            //                           err,
                                            //                           projectUpdate
                                            //                         ) => {
                                            //                           if (err) {
                                            //                             res.json(
                                            //                               500,
                                            //                               {
                                            //                                 statusCode: 500,
                                            //                                 err: err
                                            //                               }
                                            //                             );
                                            //                           } else if (
                                            //                             projectUpdate
                                            //                           ) {
                                            //                             // console.log("projectUpdate=======>", projectUpdate)
                                            //                             utility.loginByMattermost(
                                            //                               userObject,
                                            //                               (
                                            //                                 err,
                                            //                                 login
                                            //                               ) => {
                                            //                                 if (
                                            //                                   err
                                            //                                 ) {
                                            //                                   res.json(
                                            //                                     500,
                                            //                                     {
                                            //                                       statusCode: 500,
                                            //                                       err: err
                                            //                                     }
                                            //                                   );
                                            //                                 } else if (
                                            //                                   login
                                            //                                 ) {
                                            //                                   console.log(
                                            //                                     "login.headers.token--------->",
                                            //                                     login
                                            //                                       .headers
                                            //                                       .token
                                            //                                   );
                                            //                                   userHeader =
                                            //                                     login
                                            //                                       .headers[
                                            //                                       "set-cookie"
                                            //                                     ];
                                            //                                   // userToken = login.headers.token;
                                            //                                   // userId = login.body.id;

                                            //                                   console.log(
                                            //                                     "redirect"
                                            //                                   );
                                            //                                   let _myobject = {
                                            //                                     name:
                                            //                                       req
                                            //                                         .body
                                            //                                         .name,
                                            //                                     email:
                                            //                                       req
                                            //                                         .body
                                            //                                         .email
                                            //                                   };
                                            //                                   userController.sendEmailSystemAfterSignUp(
                                            //                                     _myobject,
                                            //                                     res,
                                            //                                     (
                                            //                                       err,
                                            //                                       data
                                            //                                     ) => {
                                            //                                       console.log(
                                            //                                         "mail send after signup"
                                            //                                       );
                                            //                                     }
                                            //                                   );
                                            //                                   if (
                                            //                                     userHeader.length ==
                                            //                                     2
                                            //                                   ) {
                                            //                                     userHeader.splice(
                                            //                                       0,
                                            //                                       0,
                                            //                                       "extra"
                                            //                                     );
                                            //                                   }
                                            //                                   return res.json(
                                            //                                     200,
                                            //                                     {
                                            //                                       msg:
                                            //                                         "done",
                                            //                                       token: userHeader,
                                            //                                       random_string: random_string,
                                            //                                       user: {
                                            //                                         userId:
                                            //                                           myobject.userId
                                            //                                       },
                                            //                                       team: {
                                            //                                         name:
                                            //                                           teamData.name
                                            //                                       }
                                            //                                       // project:projectUpdate,
                                            //                                       // channel:createResponse
                                            //                                       // url: "/onething/channels/" + random_string
                                            //                                     }
                                            //                                   );
                                            //                                 }
                                            //                               }
                                            //                             );
                                            //                           }
                                            //                         }
                                            //                       );
                                            //                     }
                                            //                   }
                                            //                 );
                                            //               }
                                            //             }
                                            //           );
                                            //         }
                                            //       );
                                            //     }
                                            //   }
                                            // );
                                          }
                                        }
                                      );
                                    }
                                  );
                                  // }
                                  // }
                                  //);
                                }
                              }
                            );
                          } else {
                            res.json(404, {
                              statusCode: 404,
                              msg: "Email Not Found!"
                            });
                          }
                        }
                      );
                    }
                  });
                }
              });
            } else {
              res.json(400, {
                statusCode: 400,
                msg: "Please provide correct location!"
              });
            }
          });
        });
      }
    });
  });
};

//specific user sign up to assign DL
userController.userSignUpSpecific = (req, res) => {
  let userArray = [],
    adminToken,
    adminId,
    userId,
    userToken,
    userHeader,
    _data = {},
    myobject = {},
    userObject = {};

  let random_string = utility.randomString(8);
  let userName = req.body.name.toLowerCase();
  userName = userName.split(" ");
  if (userName[0] && userName[1]) {
    userName = userName[0] + "_" + userName[1];
  } else {
    userName = userName[0];
  }
  userArray.push(userName);

  let _req = req.body;
  utility.loginByMattermost(env.teamCreatecredentials, (err, adminObj) => {
    let adminUserId = adminObj.body.id;
    if (err) {
      console.log("singup error 1");
      res.json(500, {
        statusCode: 500,
        err: err
      });
    }
    adminToken = adminObj.headers.token;
    adminId = adminObj.body.id;
    utility.userExistByEmail(_req.email, adminToken, (err, user) => {
      if (user) {
        _data = {
          msg: "email already exist",
          status: 401
        };
        res.send(401, _data);
      } else {
        //sign up
        // console.log("username array", userArray);
        utility.userExist(userArray, adminToken, (err, userexist) => {
          if (err) {
            console.log("singup error 3");
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
          // console.log("userName", userName, userObject);
          //find client's lat long
          utility.getLocations(req.body.location, (err, clientLocation) => {
            if (err) {
              console.log("singup error getlocation");
              res.json(500, {
                statusCode: 500,
                err: err
              });
            } else if (clientLocation) {
              utility.sign_up(userObject, (err, userData) => {
                // console.log("id checking", err, userData);

                if (err) {
                  console.log("singup error 4");
                  return res.json(400, {
                    err: err
                  });
                } else {
                  //find designe lead
                  let designer = {
                    clientDomain: req.body.allTags,
                    clientCoordinate: clientLocation
                  };
                  if (req.body.projectName === "pooja") {
                    DesignerModel.findOne(
                      { email: "adhithya@1thing.design" },
                      (err, data) => {
                        let dLead = {
                          name: data.name,
                          workspaceId: data.userId,
                          mongooseId: data._id,
                          assignedProject: data.profileInfo.assignedProject,
                          email: data.email
                        };

                        // userController.getDesignerLead(designer, (err, dLead) => {
                        //   if (err) {
                        //     console.log("singup error 5");
                        //     return res.json(500, {
                        //       err: err
                        //     });
                        //   } else {
                        // console.log("dLead--------->", dLead);
                        let user = new UserModel();
                        myobject = {
                          userName: userName,
                          name: req.body.name,
                          // email: req.body.email.toLowerCase(),
                          Designation: req.body.Designation,
                          mobile: req.body.mobile,
                          linkedinProfile: req.body.linkedinProile,
                          userId: userData.id,
                          userType: "client",
                          longLatLocation: clientLocation,
                          password: req.body.password,
                          nonSignupUser: false,
                          password: user.generateHash(req.body.password)
                          // channelName: random_string
                        };
                        UserModel.findOneAndUpdate(
                          { email: req.body.email.toLowerCase() },
                          { $set: myobject },
                          { new: true },
                          (err, data) => {
                            // console.log('data------->', data)
                            if (err) {
                              console.log("singup error 6");
                              res.json(500, {
                                statusCode: 500,
                                err: err
                              });
                            } else if (data) {
                              projectController.addProjectByUserChatBot(
                                data,
                                dLead,
                                req,
                                (err, project) => {
                                  // console.log('project data----->', err, project);
                                  if (err) {
                                    console.log("singup error 7");
                                    return res.json(500, {
                                      statusCode: 500,
                                      err: err
                                    });
                                  } else {
                                    //update designer
                                    DesignerModel.update(
                                      { email: dLead.email },
                                      {
                                        $set: {
                                          "profileInfo.assignedProject":
                                            dLead.assignedProject + 1
                                        }
                                      },
                                      (err, updateData) => {
                                        if (err) {
                                          console.log("singup error 8");
                                          return res.json(500, {
                                            statusCode: 500,
                                            err: err
                                          });
                                        } else {
                                          // console.log("update data-------->",updateData);
                                          emailController.addEmailer(
                                            data,
                                            (err, emailer) => {
                                              // console.log("add emailer", err, emailer);

                                              //create team
                                              let teamObj = {
                                                name:
                                                  req.body.projectName
                                                    .toLowerCase()
                                                    .replace(" ", "") +
                                                  utility.randomString(3) +
                                                  utility.randomStringforUsername(
                                                    2
                                                  ),
                                                display_name:
                                                  req.body.projectName,
                                                type: "O"
                                              };
                                              // console.log("teamObj print---------->",teamObj);
                                              utility.createTeam(
                                                teamObj,
                                                adminToken,
                                                (err, teamData) => {
                                                  if (err) {
                                                    console.log(
                                                      "singup error 10"
                                                    );
                                                    res.json(500, {
                                                      statusCode: 500,
                                                      err: err
                                                    });
                                                  } else {
                                                    var adminArr = [];
                                                    adminArr.push({
                                                      team_id: teamData.id,
                                                      user_id: userData.id
                                                    });

                                                    utility.addUsersinClientTeam(
                                                      adminArr,
                                                      adminToken,
                                                      teamData.id,
                                                      (
                                                        err,
                                                        membersAdded
                                                      ) => {
                                                        if (err) {
                                                          console.log(
                                                            "singup error 11",
                                                            err
                                                          );
                                                          res.json(
                                                            500,
                                                            {
                                                              statusCode: 500,
                                                              err: err
                                                            }
                                                          );
                                                        } else {
                                                          // console.log("membersAdded--------->",membersAdded);
                                                          userController.createSetOfChannelsAfterSignup(
                                                            teamData.id,
                                                            req.body
                                                              .projectName,
                                                            userData.id,
                                                            adminToken,
                                                            (
                                                              err,
                                                              createResponse
                                                            ) => {
                                                              // console.log("createResponse==============>", createResponse)
                                                              if (err) {
                                                                console.log(
                                                                  "singup error 12",
                                                                  err
                                                                );
                                                                res.json(
                                                                  500,
                                                                  {
                                                                    statusCode: 500,
                                                                    err: err
                                                                  }
                                                                );
                                                              } else if (
                                                                createResponse
                                                              ) {
                                                                console.log(
                                                                  "channels created!!!"
                                                                );
                                                                ProjectModel.findOneAndUpdate(
                                                                  {
                                                                    "user.id":
                                                                      userData.id
                                                                  },
                                                                  {
                                                                    $set: {
                                                                      "teamDetails.teamId":
                                                                        teamData.id,
                                                                      "teamDetails.name":
                                                                        teamObj.name,
                                                                      //public channels
                                                                      productChannelId:
                                                                        createResponse
                                                                          .product
                                                                          .id,
                                                                      knowledgeChannelId:
                                                                        createResponse
                                                                          .knowledgebase
                                                                          .id,
                                                                      minutesOfMeetingsChannelId:
                                                                        createResponse
                                                                          .minutesofmeetings
                                                                          .id,
                                                                      // docsAndDeliverablesChannelId:"",

                                                                      //private channels
                                                                      designChannelId:
                                                                        createResponse
                                                                          .design
                                                                          .id,
                                                                      reviewChannelId:
                                                                        createResponse
                                                                          .review
                                                                          .id,
                                                                      mimiChannelId:
                                                                        createResponse
                                                                          .mimi
                                                                          .id,
                                                                      mimiProductChannelId:
                                                                        createResponse
                                                                          .mimiFromProduct
                                                                          .id
                                                                    }
                                                                  },
                                                                  {
                                                                    new: true
                                                                  },
                                                                  (
                                                                    err,
                                                                    projectUpdate
                                                                  ) => {
                                                                    if (
                                                                      err
                                                                    ) {
                                                                      res.json(
                                                                        500,
                                                                        {
                                                                          statusCode: 500,
                                                                          err: err
                                                                        }
                                                                      );
                                                                    } else if (
                                                                      projectUpdate
                                                                    ) {
                                                                      // console.log("projectUpdate=======>", projectUpdate)
                                                                      utility.loginByMattermost(
                                                                        userObject,
                                                                        (
                                                                          err,
                                                                          login
                                                                        ) => {
                                                                          if (
                                                                            err
                                                                          ) {
                                                                            res.json(
                                                                              500,
                                                                              {
                                                                                statusCode: 500,
                                                                                err: err
                                                                              }
                                                                            );
                                                                          } else if (
                                                                            login
                                                                          ) {
                                                                            console.log(
                                                                              "login.headers.token--------->",
                                                                              login
                                                                                .headers
                                                                                .token
                                                                            );
                                                                            userHeader =
                                                                              login
                                                                                .headers[
                                                                                "set-cookie"
                                                                              ];
                                                                            // userToken = login.headers.token;
                                                                            // userId = login.body.id;

                                                                            console.log(
                                                                              "redirect"
                                                                            );
                                                                            let _myobject = {
                                                                              name:
                                                                                req
                                                                                  .body
                                                                                  .name,
                                                                              email:
                                                                                req
                                                                                  .body
                                                                                  .email
                                                                            };
                                                                            userController.sendEmailSystemAfterSignUp(
                                                                              _myobject,
                                                                              res,
                                                                              (
                                                                                err,
                                                                                data
                                                                              ) => {
                                                                                console.log(
                                                                                  "mail send after signup"
                                                                                );
                                                                              }
                                                                            );
                                                                            if (
                                                                              userHeader.length ==
                                                                              2
                                                                            ) {
                                                                              userHeader.splice(
                                                                                0,
                                                                                0,
                                                                                "extra"
                                                                              );
                                                                            }
                                                                            return res.json(
                                                                              200,
                                                                              {
                                                                                msg:
                                                                                  "done",
                                                                                token: userHeader,
                                                                                random_string: random_string,
                                                                                user: {
                                                                                  userId:
                                                                                    myobject.userId
                                                                                },
                                                                                team: {
                                                                                  name:
                                                                                    teamData.name
                                                                                }
                                                                                // project:projectUpdate,
                                                                                // channel:createResponse
                                                                                // url: "/onething/channels/" + random_string
                                                                              }
                                                                            );
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
                                                      }
                                                    );
                                                  }
                                                }
                                              );
                                            }
                                          );
                                        }
                                      }
                                    );
                                  }
                                }
                              );
                            } else {
                              res.json(404, {
                                statusCode: 404,
                                msg: "Email Not Found!"
                              });
                            }
                          }
                        );
                        //   }
                        // });
                      }
                    );
                  }
                }
              });
            } else {
              res.json(400, {
                statusCode: 400,
                msg: "Please provide correct location!"
              });
            }
          });
        });
      }
    });
  });
};  

//<-----------create channels---------------->
userController.createSetOfChannelsAfterSignup = (teamId,productName,userId,token,channelCallback) => {
  let _productName = productName.toLowerCase().replace(" ", "_");
  console.log("product name========>", productName);

  async.parallel(
    {
      //public channels
      product: function(callback1) {
        let _publicChannel = {
          channelName: "all-about-your-product",
          teamId: teamId
        };
        utility.getChannelIdByChannelName(
          _publicChannel,
          token,
          (err1, productChannel) => {
            if (err1) {
              console.log("error in getChannelIdByChannelName product");
              channelCallback(err1);
            } else if (productChannel) {
              let msg =
                "Hi everyone This channel brings us all together for planning, strategising, announcements, standups and similar such discussions";
              let postData = {
                channel_id: productChannel.id,
                message: msg
              };
              // console.log("create post finally", postData);
              utility.createPost(postData, token, (err, post) => {
                callback1(err, productChannel);
              });
            }
          }
        );
      },
      knowledgebase: function(callback2) {
        let _publicChannel = {
          channelName: "knowledge-base",
          teamId: teamId
        };
        utility.getChannelIdByChannelName(
          _publicChannel,
          token,
          (err1, knowledgebaseChannel) => {
            // console.log("knowledgebase channel");
            if (err1) {
              console.log("error in getChannelIdByChannelName knowledgebase");
              channelCallback(err1);
            } else if (knowledgebaseChannel) {
              let msg =
                "Hi everyone Knowledge Base brings us all together for gathering knowledge resources, reference links, design inspiration, and any other resources that will aid our design journey.";
              let postData = {
                channel_id: knowledgebaseChannel.id,
                message: msg
              };
              utility.createPost(postData, token, (err, post) => {
                callback2(err, knowledgebaseChannel);
              });

              // let _arr =[
              //   {user_id:env.userId1},
              //   {user_id:env.userId2},
              //   {user_id:env.userId3}
              // ];
              // let _addUserInChannel={
              //     teamId:teamId,
              //     channelId:knowledgebaseChannel.id,
              //     userData:_arr,
              // }
              // utility.addUserinDifferentChannels(_addUserInChannel,token,(err,addedUser)=>{
              //   if(err){
              //     console.log("error in addUserinDifferentChannels knowledgebase")
              //   }
              //   else if(addedUser){
              //     let msg = "Hi everyone Knowledge Base brings us all together for gathering knowledge resources, reference links, design inspiration, and any other resources that will aid our design journey."
              //     let postData = {
              //       channel_id: knowledgebaseChannel.id,
              //       message: msg
              //     };
              //     utility.createPost(postData, token, (err, post)=>{
              //       callback2(err,knowledgebaseChannel);
              //     })
              //   }
              // });
            }
          }
        );
      },
      minutesofmeetings: function(callback3) {
        let _publicChannel = {
          channelName: "mom",
          teamId: teamId
        };
        utility.getChannelIdByChannelName(
          _publicChannel,
          token,
          (err1, minutesofmeetingsChannel) => {
            // console.log("minutesofmeetings channel");
            if (err1) {
              console.log(
                "error in getChannelIdByChannelName minutesofmeetings"
              );
              channelCallback(err1);
            } else if (minutesofmeetingsChannel) {
              let msg =
                "Hi everyone This channel is to record minutes for all our meetings that are held over video/audio calls to keep everyone in the loop. Use @ to tag team members.";
              let postData = {
                channel_id: minutesofmeetingsChannel.id,
                message: msg
              };
              // console.log("create post finally", postData);
              utility.createPost(postData, token, (err, post) => {
                callback3(err, minutesofmeetingsChannel);
              });
            }
          }
        );
      },
      //private channels
      design: function(callback4) {
        let _privateChannel = {
          name: "design" + utility.randomString(4),
          display_name: "design",
          type: "P",
          teamId: teamId
        };
        // _privateChannel.name="design"+utility.randomString(4);
        // _privateChannel.display_name="design";
        utility.createSetOfChannels(
          _privateChannel,
          token,
          (err1, designChannel) => {
            // console.log("design channel");
            if (err1) {
              console.log("error in createSetOfChannels design");
              channelCallback(err1);
            } else if (designChannel) {
              let msg =
                "Hi Design Team This channel brings the design team together for collaboration on all things design. Review, iterate and reiterate till we do great work";
              let postData = {
                channel_id: designChannel.id,
                message: msg
              };
              // console.log("create post finally", postData);
              utility.createPost(postData, token, (err, post) => {
                callback4(err, designChannel);
              });
            }
          }
        );
      },
      review: function(callback5) {
        let _privateChannel = {
          name: "review" + utility.randomString(4),
          display_name: "Design review",
          type: "P",
          teamId: teamId
        };
        utility.createSetOfChannels(
          _privateChannel,
          token,
          (err1, reviewChannel) => {
            if (err1) {
              console.log("error in createSetOfChannels review");
              channelCallback(err1);
            } else if (reviewChannel) {
              let _arr = [{ user_id: userId }];
              let _addUserInChannel = {
                teamId: teamId,
                channelId: reviewChannel.id,
                userData: _arr
              };
              utility.addUserinDifferentChannels(
                _addUserInChannel,
                token,
                (err, addedUser) => {
                  if (err) {
                    console.log("error in addUserinDifferentChannels review");
                    channelCallback(err1);
                  } else if (addedUser) {
                    let msg =
                      "Hi This channel is where the final docs, designs & files are shared for review & feedback by our Partner Company.";
                    let postData = {
                      channel_id: reviewChannel.id,
                      message: msg
                    };
                    // console.log("create post finally", postData);
                    utility.createPost(postData, token, (err, post) => {
                      // console.log("m callback")
                      callback5(err, reviewChannel);
                    });
                  }
                }
              );
            }
          }
        );
      },
      mimi: function(callback6) {
        let _privateChannel = {
          name: "mimi" + utility.randomString(4),
          display_name: "Mimi from 1THING",
          type: "P",
          teamId: teamId
        };
        utility.createSetOfChannels(
          _privateChannel,
          token,
          (err1, mimiChannel) => {
            console.log("mimi channel", mimiChannel.id);
            if (err1) {
              console.log("error in createSetOfChannels mimi");
              channelCallback(err1);
            } else if (mimiChannel) {
              let msg =
                "Hi there This is our channel where you can speak with me on all things 1THING. Need additional skills? Need to discuss anything about the design team or partner company? New project or optimum utilisation of hours. I am here for you.";
              let postData = {
                channel_id: mimiChannel.id,
                message: msg
              };
              // console.log("create post finally", postData);
              utility.createPost(postData, token, (err, post) => {
                callback6(err, mimiChannel);
              });

              // let _arr=[
              //   {user_id:userId},
              //   {user_id:env.userId1},
              //   {user_id:env.userId2},
              // ];
              // _addUserInChannel.channelId=mimiChannel.id;
              // _addUserInChannel.userData=_arr;

              //  let _addUserInChannel={
              //     teamId:teamId,
              //     channelId:mimiChannel.id,
              //     userData:_arr,
              // }

              // utility.addUserinDifferentChannels(_addUserInChannel,token,(err,addedUser)=>{
              //   if(err){
              //     console.log("error in addUserinDifferentChannels mimi");
              //     channelCallback(err1);
              //   }
              //   else if(addedUser){
              //     let msg = "Hi there This is our channel where you can speak with me on all things 1THING. Need additional skills? Need to discuss anything about the design team or partner company? New project or optimum utilisation of hours. I am here for you."
              //     let postData = {
              //       channel_id: mimiChannel.id,
              //       message: msg
              //     };
              //     // console.log("create post finally", postData);
              //     utility.createPost(postData, token, (err, post)=>{
              //       callback6(err,mimiChannel);
              //     })
              //   }

              // })
            }
          }
        );
      },
      mimiFromProduct: function(callback7) {
        let _privateChannel = {
          name: "mimi" + _productName + utility.randomString(4),
          display_name: "Mimi from " + _productName,
          type: "P",
          teamId: teamId
        };
        utility.createSetOfChannels(
          _privateChannel,
          token,
          (err1, mimifromproduct) => {
            if (err1) {
              console.log("error in createSetOfChannels mimiFromProduct");
              channelCallback(err1);
            } else if (mimifromproduct) {
              let _arr = [{ user_id: userId }];
              let _addUserInChannel = {
                teamId: teamId,
                channelId: mimifromproduct.id,
                userData: _arr
              };
              utility.addUserinDifferentChannels(
                _addUserInChannel,
                token,
                (err, addedUser) => {
                  if (err) {
                    console.log(
                      "error in addUserinDifferentChannels mimiFromProduct"
                    );
                    channelCallback(err1);
                  } else if (addedUser) {
                    let msg =
                      "Hi there This is our channel where you can speak with me on all things 1THING. Need additional skills? Need to discuss anything about the design team or partner company? New project or optimum utilisation of hours. I am here for you.";
                    let postData = {
                      channel_id: mimifromproduct.id,
                      message: msg
                    };
                    // console.log("create post finally", postData);
                    utility.createPost(postData, token, (err, post) => {
                      // console.log("m callback")
                      callback7(err, mimifromproduct);
                    });
                  }
                }
              );
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

//<------Algorithm code to find designer--------->

userController.getDesignerLead = (client, CALLBACK) => {
  // console.log('client--------->', client)
  let clientCoordinate = client.clientCoordinate;
  let clientDomain = client.clientDomain;
  let longitude1 = clientCoordinate[0];
  let latitude1 = clientCoordinate[1];

  DesignerModel.find({
    "profileInfo.newLocation": {
      $near: {
        $geometry: { type: "point", coordinates: clientCoordinate }
      }
    }
  }).exec((err, result) => {
    if (err) {
      console.log("err--------->1", err);
    } else {
      let maxDistance = 0;
      let tempArr = [];

      async.forEachSeries(
        result,
        (data, callback) => {
          let _avaibility = data.profileInfo.assignedProject;
          if (data.isLatLong && _avaibility < 2 && data.userType==='DL') {
            let dLInfo = {
              name: data.name,
              workspaceId: data.userId,
              mongooseId: data._id,
              assignedProject: data.profileInfo.assignedProject,
              email: data.email,
              aviability: _avaibility
            };

            let longitude2 = data.profileInfo.newLocation[0];
            let latitude2 = data.profileInfo.newLocation[1];
            let designerDomain =
              data.profileInfo.domainName === ""
                ? []
                : data.profileInfo.domainName;

            let distance = utility.getDistanceFromLatLonInKm(
              latitude1,
              longitude1,
              latitude2,
              longitude2
            );
            if (maxDistance < distance) {
              maxDistance = distance;
            }
            tempArr.push({
              dist: +distance.toFixed(2),
              domains: designerDomain,
              data: dLInfo
            });
          }
          callback();
        },
        err => {
          if (err) {
            console.log("err--------->2", err);
          } else {
            let x = 0;
            let y = 0;
            let priority = 0;
            let matchDomain = 0;
            let designerInfo = {};
            let disgnerArr = [];

            if (tempArr.length === 0) {
              // console.log("in if staticDesigner");
              // DesignerModel.find({"profileInfo.assignedProject":2},(err, data)=>{
              // console.log('data for d', data);
              // })

              DesignerModel.find({ isStatic: true })
                .sort({ "profileInfo.assignedProject": 1 })
                .limit(1)
                .exec((err, staticDesigner) => {
                  if (err) {
                    res.json(500, {
                      statusCode: 500,
                      err: err
                    });
                  }
                  // console.log("data for d", staticDesigner[0]);
                  designerInfo = {
                    name: staticDesigner[0].name,
                    workspaceId: staticDesigner[0].userId,
                    mongooseId: staticDesigner[0]._id,
                    assignedProject:
                      staticDesigner[0].profileInfo.assignedProject,
                    email: staticDesigner[0].email
                  };
                  CALLBACK(null, designerInfo);
                });
            } else {
              tempArr.map((value, key) => {
                let matchDomain = 0;
                for (let i = 0; i < clientDomain.length; i++) {
                  for (let j = 0; j < value.domains.length; j++) {
                    if (clientDomain[i] === value.domains[j]) matchDomain++;
                  }
                }

                //to find x
                x = +(
                  100 - +(value.dist * 100 / maxDistance.toFixed(2))
                ).toFixed(2);

                //to find y
                // console.log('matchDomain------>', matchDomain)
                y = +(matchDomain * 100 / clientDomain.length).toFixed(2);

                let z = +(x * 1.5 + y * 1).toFixed(2);

                if (priority < z) {
                  priority = z;
                  designerInfo = value.data;
                }
              });
              if (Object.keys(designerInfo).length === 0) {
                // console.log("yes", Object.keys(designerInfo).length);
                async.forEachSeries(
                  tempArr,
                  (tempResult, callback1) => {
                    // console.log('tempResult------>', tempResult);
                    if (tempResult.data.aviability <= 1) {
                      designerInfo = tempResult.data;
                      callback1("success", "found Data");
                    } else {
                      callback1();
                    }
                  },
                  err => {
                    // console.log("successful data inner");
                    CALLBACK(null, designerInfo);
                    // CALLBACK(null, designerInfo)
                  }
                );
              } else {
                // console.log("data available in dleadInfo");
                CALLBACK(null, designerInfo);
              }
            }
            // console.log("successful data outer", designerInfo);
          }
        }
      );
    }
  });
  // console.log('data----------->', data)
  //    })
};

userController.getStaticDesigners = (limit, designerCallBack) => {
  let designerInfo = [];
  DesignerModel.find({ isStatic: true , userType:"DL"})
    .sort({ "profileInfo.assignedProject": 1 })
    .limit(limit)
    .exec((err, allStaticDesigner) => {
      if (err) {
        // CALLBACK(err);
        res.json(500, {
          statusCode: 500,
          err: err
        });
      } else {
        async.forEachSeries(
          allStaticDesigner,
          (staticDesigner, staticCallback) => {
            let info = {
              name: staticDesigner.name,
              workspaceId: staticDesigner.userId,
              mongooseId: staticDesigner._id,
              assignedProject: staticDesigner.profileInfo.assignedProject,
              email: staticDesigner.email
            };
            designerInfo.push(info);
            staticCallback();
          },
          err => {
            designerCallBack(null, designerInfo);
            // CALLBACK.json(200,{
            //   statusCode:200,
            //   data:designerInfo
            // });
          }
        );
      }
    });
};

userController.getDesignerLeads = (client, CALLBACK) => {
  // console.log('client--------->', client.body)
  // let client = client1.body;
  let clientCoordinate = client.clientCoordinate;
  let clientDomain = client.clientDomain;
  let longitude1 = clientCoordinate[0];
  let latitude1 = clientCoordinate[1];

  DesignerModel.find({
    "profileInfo.newLocation": {
      $near: {
        $geometry: { type: "point", coordinates: clientCoordinate }
      }
    }
  }).exec((err, result) => {
    if (err) {
      console.log("err--------->1", err);
    } else {
      let maxDistance = 0;
      let tempArr = [];

      async.forEachSeries(
        result,
        (data, callback) => {
          let _avaibility = data.profileInfo.assignedProject;
          if (data.isLatLong && _avaibility < 1 && data.userType==='DL') {
            let dLInfo = {
              name: data.name,
              workspaceId: data.userId,
              mongooseId: data._id,
              assignedProject: data.profileInfo.assignedProject,
              email: data.email,
              aviability: _avaibility
            };

            let longitude2 = data.profileInfo.newLocation[0];
            let latitude2 = data.profileInfo.newLocation[1];
            let designerDomain =
              data.profileInfo.domainName === ""
                ? []
                : data.profileInfo.domainName;

            let distance = utility.getDistanceFromLatLonInKm(
              latitude1,
              longitude1,
              latitude2,
              longitude2
            );
            if (maxDistance < distance) {
              maxDistance = distance;
            }
            tempArr.push({
              dist: +distance.toFixed(2),
              domains: designerDomain,
              data: dLInfo
            });
          }
          callback();
        },
        err => {
          if (err) {
            console.log("err--------->2", err);
          } else {
            let x = 0;
            let y = 0;
            let priority = 0;
            let matchDomain = 0;
            let designerInfo = [];
            let disgnerArr = [];

            if (tempArr.length === 0) {
              console.log("in if staticDesigner");
              userController.getStaticDesigners(3, (err, allStaticDesigner) => {
                if (err) {
                  CALLBACK(err);
                  // res.json(500, {
                  //   statusCode: 500,
                  //   err: err
                  // });
                } else {
                  CALLBACK(null, allStaticDesigner);
                  // CALLBACK.json(200,{
                  //   statusCode:200,
                  //   data:allStaticDesigner
                  // });
                }
              });
            } else {
              let _highPriorityArr = [];
              tempArr.map((value, key) => {
                let matchDomain = 0;
                for (let i = 0; i < clientDomain.length; i++) {
                  for (let j = 0; j < value.domains.length; j++) {
                    if (clientDomain[i] === value.domains[j]) matchDomain++;
                  }
                }

                //to find x
                x = +(
                  100 - +(value.dist * 100 / maxDistance.toFixed(2))
                ).toFixed(2);

                //to find y
                // console.log('matchDomain------>', matchDomain)
                y = +(matchDomain * 100 / clientDomain.length).toFixed(2);

                let z = +(x * 1.5 + y * 1).toFixed(2);
                // if(z!=0){
                _highPriorityArr.push({
                  designerInfo: value.data,
                  z: z
                });
                // }
              });
              if (_highPriorityArr.length > 0) {
                let temp = {};
                for (let i = 0; i < _highPriorityArr.length; i++) {
                  for (let j = i + 1; j < _highPriorityArr.length; j++) {
                    // console.log("_highPriorityArr=========>", _highPriorityArr)
                    if (_highPriorityArr[i].z < _highPriorityArr[j].z) {
                      temp = _highPriorityArr[j];
                      _highPriorityArr[j] = _highPriorityArr[i];
                      _highPriorityArr[i] = temp;
                      console.log("temp====>", temp, j);
                    }
                  }
                }
                for (let i = 0; i < _highPriorityArr.length; i++) {
                  if (i < 3) {
                    designerInfo.push(_highPriorityArr[i].designerInfo);
                  }
                }
              }
              if (designerInfo.length < 3) {
                switch (designerInfo.length) {
                  case 0:
                    userController.getStaticDesigners(
                      3,
                      (err, allStaticDesigner) => {
                        if (err) {
                          CALLBACK(err);
                          // res.json(500, {
                          //   statusCode: 500,
                          //   err: err
                          // });
                        } else {
                          CALLBACK(null, allStaticDesigner);
                          // CALLBACK.json(200,{
                          //   statusCode:200,
                          //   data:allStaticDesigner
                          // });
                        }
                      }
                    );
                    break;
                  case 1:
                    userController.getStaticDesigners(
                      2,
                      (err, allStaticDesigner) => {
                        if (err) {
                          CALLBACK(err);
                          // res.json(500, {
                          //   statusCode: 500,
                          //   err: err
                          // });
                        } else {
                          allStaticDesigner.push(designerInfo[0]);
                          CALLBACK(null, allStaticDesigner);
                          // CALLBACK.json(200,{
                          //   statusCode:200,
                          //   data:allStaticDesigner
                          // });
                        }
                      }
                    );
                    break;
                  case 2:
                    userController.getStaticDesigners(
                      1,
                      (err, allStaticDesigner) => {
                        if (err) {
                          CALLBACK(err);
                          // res.json(500, {
                          //   statusCode: 500,
                          //   err: err
                          // });
                        } else {
                          designerInfo.push(allStaticDesigner[0]);
                          CALLBACK(null, designerInfo);
                          // CALLBACK.json(200,{
                          //   statusCode:200,
                          //   data:designerInfo
                          // });
                        }
                      }
                    );
                    break;
                }
              } else {
                // console.log("data available in dleadInfo");
                CALLBACK(null, designerInfo);
                // CALLBACK.json(200,{
                //     statusCode:200,
                //     data:designerInfo
                //   });
              }
            }
            // console.log("successful data outer", designerInfo);
          }
        }
      );
    }
  });
  // console.log('data----------->', data)
  //    })
};

// <-----workspace data new jan 2018-------->

userController.findUserDetailsForWorkspaceV3 = (req, res) => {
  // console.log('id---------->', req)
  if (req.params.id) {
    let condition = {
      userId: req.params.id
    };

    async.parallel(
      {
        one: function(callback) {
          UserModel.findOne(condition, { password: 0 }, (err, data) => {
            if (err) {
              res.json(500, {
                statusCode: 500,
                err: err
              });
            }
            // console.log("data---------->", data);
            else if (data) {
              callback(err, data);
            } else {
              res.json(404, {
                statusCode: 404,
                msg: "Not Found"
              });
            }
          });
        },
        two: function(callback) {
          ProjectModel.findOne({ "user.id": req.params.id }, (err, data) => {
            // console.log('data two---------->', data);
            if (err) {
              res.json(500, {
                statusCode: 500,
                err: err
              });
            } else if (data) {
              let _productJourneyArr = [];
              if (data.folderCreated) {
                async.forEachSeries(
                  data.activities,
                  (activitiesData, activityCallback) => {
                    if (activitiesData.fileCreated) {
                      console.log("file created");
                      ProductJourney.findOne(
                        { activityId: activitiesData._id },
                        (err, productJourneyData) => {
                          if (productJourneyData) {
                            // console.log('m in')
                            _productJourneyArr.push(productJourneyData);
                            activityCallback();
                          } else {
                            console.log("not found", activitiesData._id);
                            activityCallback();
                          }
                        }
                      );
                    } else {
                      activityCallback();
                    }
                  },
                  err => {
                    console.log("m in last callback ");
                    let designerId = data.DLead.workspaceId;
                    DesignerModel.findOne(
                      { userId: designerId },
                      (err, data1) => {
                        newData = {
                          projectData: data,
                          designerData: data1,
                          productJourneyData: _productJourneyArr
                        };
                        callback(err, newData);
                      }
                    );
                  }
                );
              } else {
                // console.log('m out of if');
                let designerId = data.DLead.workspaceId;
                DesignerModel.findOne({ userId: designerId }, (err, data1) => {
                  newData = {
                    projectData: data,
                    designerData: data1,
                    productJourneyData: _productJourneyArr
                  };
                  callback(err, newData);
                });
              }
            }
          });
        },
        three: function(callback) {
          ActivitiesCardsModel.find({}, (err, data) => {
            // console.log('data of activities------>',data);
            callback(err, data);
          });
        },
        four: function(callback) {
          PaymentModel.find({ "user.userId": req.params.id }, (err, data) => {
            callback(err, data);
          });
        }
      },
      function(err, results) {
        // console.log("results------->", results)
        if (err) {
          res.json(500, err);
        } else if (results) {
          res.json(200, {
            data: results
          });
        } else {
          res.json(200, {
            data: []
          });
        }
      }
    );
  } else {
    res.json(400, "sorry please provide userId");
  }
};

//method for new userType
userController.findUserDetailsForWorkspaceV4 = (req, res) => {
  // console.log('id---------->', req)
  if (req.params.id) {
    let condition = {
      userId: req.params.id
    };

    async.parallel(
      {
        one: function(callback) {
          UserModel.findOne(condition, { password: 0 }, (err, data) => {
            if (err) {
              res.json(500, {
                statusCode: 500,
                err: err
              });
            }
            // console.log("data---------->", data);
            else if (data) {
              callback(err, data);
            } else {
              userController.findOtherUserTypeData(condition, (err, otherDtaa)=>{
                if(err){
                  res.status(500).send({err:err});
                }
                else{
                  res.status(otherDtaa.statusCode).send(otherDtaa);
                }
              })
            }
          });
        },
        two: function(callback) {
          ProjectModel.findOne({ "user.id": req.params.id }, (err, data) => {
            // console.log('data two---------->', data);
            if (err) {
              res.json(500, {
                statusCode: 500,
                err: err
              });
            } else if (data) {
              let _productJourneyArr = [];
              if (data.folderCreated) {
                async.forEachSeries(
                  data.activities,
                  (activitiesData, activityCallback) => {
                    if (activitiesData.fileCreated) {
                      console.log("file created");
                      ProductJourney.findOne(
                        { activityId: activitiesData._id },
                        (err, productJourneyData) => {
                          if (productJourneyData) {
                            // console.log('m in')
                            _productJourneyArr.push(productJourneyData);
                            activityCallback();
                          } else {
                            console.log("not found", activitiesData._id);
                            activityCallback();
                          }
                        }
                      );
                    } else {
                      activityCallback();
                    }
                  },
                  err => {
                    console.log("m in last callback ");
                    let designerId = data.DLead.workspaceId;
                    DesignerModel.findOne(
                      { userId: designerId },
                      (err, data1) => {
                        newData = {
                          projectData: data,
                          designerData: data1,
                          productJourneyData: _productJourneyArr
                        };
                        callback(err, newData);
                      }
                    );
                  }
                );
              } else {
                // console.log('m out of if');
                let designerId = data.DLead.workspaceId;
                DesignerModel.findOne({ userId: designerId }, (err, data1) => {
                  newData = {
                    projectData: data,
                    designerData: data1,
                    productJourneyData: _productJourneyArr
                  };
                  callback(err, newData);
                });
              }
            }
          });
        },
        three: function(callback) {
          ActivitiesCardsModel.find({}, (err, data) => {
            // console.log('data of activities------>',data);
            callback(err, data);
          });
        },
        four: function(callback) {
          PaymentModel.find({ "user.userId": req.params.id }, (err, data) => {
            callback(err, data);
          });
        }
      },
      function(err, results) {
        // console.log("results------->", results)
        if (err) {
          res.json(500, err);
        } else if (results) {
          res.json(200, {
            data: results
          });
        } else {
          res.json(200, {
            data: []
          });
        }
      }
    );
  } else {
    res.json(400, "sorry please provide userId");
  }
};

userController.findOtherUserTypeData = (condition, callback)=>{
  console.log('m call')
  DesignerModel.findOne(condition, (err, designerData)=>{
    if(err){
      callback(err);
    }
    else if(designerData){
      callback(null,{statusCode:200,userType:designerData.userType});
    }
    else{
      AdminModel.findOne(condition,(err, adminData)=>{
        if(err){
          callback(err);
        }
        else if(adminData){
          callback(null,{statusCode:200,userType:adminData.userType});
        }
        else{
          callback(null,{statusCode:203,userType:'other'});
        }
      });
    }
  })
}

userController.findUserDetailsForWorkspaceV3ByTeamId = (req, res) => {
  // console.log('id---------->', req)
  if (req.params.id) {
    ProjectModel.findOne(
      { "teamDetails.teamId": req.params.id },
      (err, projectTeamData) => {
        if (err) {
          res.json(500, {
            statusCode: 500,
            err: err
          });
        } else if (projectTeamData) {
          let condition = {
            userId: projectTeamData.user.id
          };
          async.parallel(
            {
              one: function(callback) {
                UserModel.findOne(condition, (err, data) => {
                  if (err) {
                    res.json(500, {
                      statusCode: 500,
                      err: err
                    });
                  }
                  // console.log("data---------->", data);
                  else if (data) {
                    callback(err, data);
                  } else {
                    res.json(404, {
                      statusCode: 404,
                      msg: "Not Found"
                    });
                  }
                });
              },
              two: function(callback) {
                ProjectModel.findOne(
                  { "user.id": projectTeamData.user.id },
                  (err, data) => {
                    // console.log('data two---------->', data);
                    if (err) {
                      res.json(500, {
                        statusCode: 500,
                        err: err
                      });
                    } else if (data) {
                      let _productJourneyArr = [];
                      if (data.folderCreated) {
                        async.forEachSeries(
                          data.activities,
                          (activitiesData, activityCallback) => {
                            if (activitiesData.fileCreated) {
                              ProductJourney.findOne(
                                { activityId: activitiesData._id },
                                (err, productJourneyData) => {
                                  // console.log('err ', err, "productJourneyData = ", productJourneyData)
                                  if (productJourneyData) {
                                    console.log("m in");
                                    _productJourneyArr.push(productJourneyData);
                                    activityCallback();
                                  }
                                  else{
                                    console.log("not found", activitiesData._id);
                                    activityCallback();
                                  }
                                }
                              );
                            } else {
                              activityCallback();
                            }
                          },
                          err => {
                            console.log("m in last callback ");
                            let designerId = data.DLead.workspaceId;
                            DesignerModel.findOne(
                              { userId: designerId },
                              (err, data1) => {
                                newData = {
                                  projectData: data,
                                  designerData: data1,
                                  productJourneyData: _productJourneyArr
                                };
                                callback(err, newData);
                              }
                            );
                          }
                        );
                      } else {
                        console.log("m out of if");
                        let designerId = data.DLead.workspaceId;
                        DesignerModel.findOne(
                          { userId: designerId },
                          (err, data1) => {
                            newData = {
                              projectData: data,
                              designerData: data1,
                              productJourneyData: _productJourneyArr
                            };
                            callback(err, newData);
                          }
                        );
                      }
                    }
                  }
                );
              },
              three: function(callback) {
                ActivitiesCardsModel.find({}, (err, data) => {
                  // console.log('data of activities------>',data);
                  callback(err, data);
                });
              },
              four: function(callback) {
                PaymentModel.find(
                  { "user.userId": projectTeamData.user.id },
                  (err, data) => {
                    callback(err, data);
                  }
                );
              }
            },
            function(err, results) {
              // console.log("results------->", results)
              if (err) {
                res.json(500, err);
              } else if (results) {
                res.json(200, {
                  data: results
                });
              } else {
                res.json(200, {
                  data: []
                });
              }
            }
          );
        } else {
          res.json(404, {
            statusCode: 404,
            msg: "Team Id Not Found!"
          });
        }
      }
    );
  } else {
    res.json(400, "sorry please provide userId");
  }
};

userController.setCookiesLanding = (req, res) => {
  console.log("teamName=======>", req.body.teamName);

  const cookie = req.cookies.cookieName;
  const token1 = req.body.token1;
  const token2 = req.body.token2;
  // https://staging.1thing.io/ashishkumarfzi74/channels/timeline

  // const string = req.body.teamName+"/channels/1thing"; //comment by salman
  const string = req.body.teamName + "/channels/timeline";

  if (cookie === undefined) {
    let muser_token = token1.split(";")[0].split("=")[1];
    let muser_token_key = token1.split(";")[0].split("=")[0];

    let muser_id = token2.split(";")[0].split("=")[1];
    let muser_id_key = token2.split(";")[0].split("=")[0];

    let muser_expiry = token1.split(";")[2].split("=")[1];
    let maxage = token1.split(";")[3].split("=")[1];
    console.log("max age", muser_id);
    console.log("max age", muser_id_key);
    res.cookie(muser_token_key, muser_token, {
      maxAge: maxage,
      domain: ".1thing.io",
      path: "/",
      httpOnly: true
    });
    res.cookie(muser_id_key, muser_id, {
      maxAge: maxage,
      domain: ".1thing.io",
      path: "/"
    });
    console.log("cookie created successfully", env.redirect_url + string);
    return res.redirect(env.redirect_url + string);
  } else {
    console.log("cookie exists", cookie, env.redirect_url + string);
    return res.redirect(env.redirect_url + string);
  }
};

userController.getChannelsMsgByTeamId = (req, res) => {
  console.log("req team id------>", req.body);
  let userObject = {
    email: req.body.email.toLowerCase(),
    password: req.body.password
  };
  utility.loginByMattermost(userObject, (err, login) => {
    if (err) {
      res.send(500, {
        statusCode: 500,
        err: err
      });
    } else {
      let token = login.headers.token;
      let msg = [];
      let obj = {};
      async.forEachSeries(
        req.body.channelIds,
        (data, callback) => {
          console.log("adtaa---------->", data);
          utility.getMsgByChannelId(data, token, (err, channels) => {
            if (err) {
              console.log("in error   ");
              res.send(500, {
                statusCode: 500,
                err: err
              });
            } else {
              let arr = Object.keys(channels.posts);
              arr.map((value, key) => {
                let _userId = channels.posts[value].user_id;
                let _channelId = channels.posts[value].channel_id;
                let _message = channels.posts[value].message;
                UserModel.findOne({ userId: _userId }, (err, response) => {
                  if (err) {
                    res.send(500, {
                      statusCode: 500,
                      err: err
                    });
                  } else {
                    console.log("ressss", response);
                    msg.push({
                      [_channelId]: {
                        message: _message,
                        userName: response.userName
                      }
                    });
                    callback();
                  }
                });
              });
              // callback();
            }
          });
        },
        err => {
          res.send(200, {
            statusCode: 200,
            msg: msg
          });
        }
      );
    }
  });
};

// <-----send mail system jan 2018-------->

userController.sendEmailSystemAfterSignUp = (data1, res, callback) => {
  async.parallel(
    {
      // now: function(callback) {
      //   res.render(
      //     "welcome_to_1THING",
      //     {
      //       info1: data1
      //     },
      //     function(err, HTML) {
      //       utility.sendMailWithCC(
      //         data1.email,
      //         HTML,
      //         "You made our day",
      //         // "varun@1thing.design",
      //         "mimi@1thing.design",
      //         (err, data) => {
      //           console.log("at the time mail", err, data);
      //           callback(err, data);
      //         }
      //       );
      //     }
      //   );
      // },
      delay: function(callback) {
        res.render(
          "next_steps_with_1THING",
          {
            info1: data1
          },
          function(err, HTML) {
            setTimeout(
              function() {
                utility.sendMail(
                  data1.email,
                  HTML,
                  "Getting Started with 1THING",
                  // "divanshu@1thing.design",
                  "mimi@1thing.design",
                  (err, data) => {
                    console.log("after5 min mail", err, data);
                  }
                );
              },
              1 * 60 * 60 * 1000,
              data1,
              HTML
            );
            callback(err, "okk");
          }
        );
      }
      // admin: function(callback) {
      //   res.render(
      //     "1thingWelcome",
      //     {
      //       info1: data,
      //       info2: project
      //     },
      //     function(err, HTML) {
      //       console.log("checking err of html", err);
      //       utility.groupEmail(
      //         HTML,
      //         "1THING client registration",
      //         "client",
      //         (err, data) => {
      //           console.log("groupmail", err, data);
      //         }
      //       );
      //       callback(null, "ok");
      //     }
      //   );
      // }
    },
    function(err, results) {
      if (err) {
        console.log("mail not send");
        callback(err);
      } else {
        console.log("mail send");
        callback(err, results);
      }
    }
  );
};

userController.sendEmailSystemAfterEnterPassword = (data1, res, callback) => {
  res.render(
    "welcome_to_1THING",
    {
      info1: data1
    },
    function(err, HTML) {
      utility.sendMailWithCC(
        data1.email,
        HTML,
        "You made our day",
        // "varun@1thing.design",
        "mimi@1thing.design",
        (err, data) => {
          // console.log("send mail ", err, data);
          callback(err, data);
        }
      );
    }
  );
};

userController.sendMailToNonSignUpUser = (name, callback) => {
  console.log("time out==========>");
  callback(null, name);
};
userController.sendEmailSystemAfterAfterDropUser = (req, res) => {
  var data = req.body;
  var project = {};
  async.parallel(
    {
      now: function(callback) {
        res.render(
          "firstMailerClient",
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
                console.log("at the time mail", err, data);
                callback(err, data);
              }
            );
          }
        );
      },
      delay: function(callback) {
        res.render(
          "gettingStartedWithClient",
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
                  "divanshu@1thing.design",
                  (err, data) => {
                    console.log("after5 min mail", err, data);
                  }
                );
              },
              300000,
              data,
              HTML
            );
            callback(err, "okk");
          }
        );
      },
      admin: function(callback) {
        res.render(
          "1thingWelcome",
          {
            info1: data,
            info2: project
          },
          function(err, HTML) {
            console.log("checking err of html", err);
            utility.groupEmail(
              HTML,
              "1THING client registration",
              "client",
              (err, data) => {
                console.log("groupmail", err, data);
              }
            );
            callback(null, "ok");
          }
        );
      }
    },
    function(err, results) {
      res.json(200, {
        statusCode: 200,
        data: "mail send"
      });
    }
  );
};

userController.updateLocation = (req, res) => {
  UserModel.find({ newUser: true }, (err, userData) => {
    if (err) {
      res.json(500, {
        statusCode: 500,
        err: err
      });
    } else if (userData.length > 0) {
      let arr = [];
      let arr1 = [];
      async.forEachSeries(
        userData,
        (uData, userCallback) => {
          // console.log("location type=====>", typeof uData.location);
          if (typeof uData.location == "undefined" || uData.location === "") {
            utility.getPlace(uData.longLatLocation, (err, place) => {
              if (err) {
                res.json(500, {
                  statusCode: 500,
                  err: err
                });
              } else if (place) {
                console.log("place=====>", place, "========", place[0].city);
                let location = place[0].city == undefined ? "" : place[0].city;

                UserModel.findOneAndUpdate(
                  { email: uData.email },
                  { $set: { location: "location" } },
                  { new: true },
                  (err, updateLocation) => {
                    if (err) {
                      res.json(500, {
                        statusCode: 500,
                        err: err
                      });
                    } else {
                      arr.push(updateLocation);
                    }
                  }
                );
                userCallback();
              }
            });
          } else {
            arr1.push(uData);
            userCallback();
          }
        },
        err => {
          res.json(200, {
            statusCode: 200,
            data: userData
          });
        }
      );
    }
  });
};

userController.checkMultipartData = (req, res) => {
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
    storage: storage
  }).array("file", 2);
  upload(req, res, function(err) {
    console.log("files ", req.files);
    // res.send(file)
    // console.log("err in uploading file", req.file, err);
    // if (err) {
    //   console.log("err in 1st", err);
    //   res.json({ error_code: 1, err_desc: err });
    //   return;
    // }
    // /** Multer gives us file info in req.file object */
    // if (!req.file) {
    //   console.log("err in req.file", err);
    //   res.json({ error_code: 1, err_desc: "No file passed" });
    //   return;
    // }
    // if (
    //   req.file.originalname.split(".")[
    //     req.file.originalname.split(".").length - 1
    //   ] === "xlsx"
    // ) {
    //   exceltojson = xlsxtojson;
    // } else {
    //   exceltojson = xlstojson;
    // }
    // try {
    //   exceltojson(
    //     {
    //       input: req.file.path,
    //       output: null, //since we don't need output.json
    //       lowerCaseHeaders: true
    //     },
    //     function(err, result) {
    //       // console.log('result--------->', result)
    //       if (err) {
    //         console.log("err in 2nd", err);
    //         return res.json({ error_code: 1, err_desc: err, data: null });
    //       } else {
    //         var count = 1;
    //         let domain = "";
    //         // let ava=0;

    //         async.forEachSeries(
    //           result,
    //           (data, callback) => {
    //             console.log("data----------->", data);
    //             callback();
    //           },
    //           err => {
    //             // console.log("hello");
    //             if (err) {
    //               console.log("err", err);
    //               return res.json({
    //                 data: "Invalid Data",
    //                 err: "not uploaded file"
    //               });
    //             } else {
    //               console.log("lastest Approach");
    //               return res.json({
    //                 error_code: 0,
    //                 err_desc: null,
    //                 message: "Successfully uploaded"
    //               });
    //             }
    //           }
    //         );

    //         // });
    //       }
    //     }
    //   );
    // } catch (e) {
    //   res.json({ error_code: 1, err_desc: "Corupted excel file" });
    // }

    // try {
    //   fs.unlinkSync(req.file.path);
    // } catch (e) {
    //   //error deleting the file
    //   console.log("in catch");
    // }
  });
};

//<---------------------*********************Admin panel*******************------------------>

//get all users data
userController.getAllUsersData = (req, res) => {
  console.log("page = ", req.query.page, " limit = ", req.query.limit);
  let page = parseInt(req.query.page);
  let limit = parseInt(req.query.limit);

  UserModel.find({ newUser: true })
    .skip((page - 1) * limit)
    .limit(limit)
    .exec((err, allUserData) => {
      if (err) {
        console.log("err in 1");
        res.json(500, {
          statusCode: 500,
          err: err
        });
      } else if (allUserData.length > 0) {
        let count = 0;
        let arr = [];
        let arr1 = [];
        let userData = [];
        async.forEachSeries(
          allUserData,
          (uData, userCallback) => {
            userController.getProjectData(uData, (err, wholeData) => {
              if (err) {
                console.log("err in 2");
                res.json(500, {
                  statusCode: 500,
                  err: err
                });
              } else {
                userData.push(wholeData);
                userCallback();
              }
            });
          },
          err => {
            UserModel.find({ newUser: true }, (err, data) => {
              res.json(200, {
                statusCode: 200,
                data: userData,
                totalCount: data.length
              });
            });
          }
        );
      } else {
        res.json(404, {
          statusCode: 404,
          msg: "no data"
        });
      }
    });
};

userController.updateLocations = (req, res) => {
  UserModel.find({ newUser: true }, (err, data) => {
    if (err) {
      console.log("err in 1 updateLocations");
      res.json(500, {
        statusCode: 500,
        err: err
      });
    } else if (data.length > 0) {
      async.forEachSeries(
        data,
        (user, userCallback) => {
          if (
            (typeof user.location == "undefined" || user.location === "") &&
            user.longLatLocation.length > 0
          ) {
            utility.getPlace(user.longLatLocation, (err, location) => {
              if (err) {
                console.log("err in 2 updateLocations");
                res.json(500, {
                  statusCode: 500,
                  err: err
                });
              } else if (location) {
                // console.log("location=====>",location,  "========" ,location[0].city);
                user.location = location[0].city;
                user.save((err, saveData) => {
                  if (err) {
                    console.log("err in 3 updateLocations");
                    res.json(500, {
                      statusCode: 500,
                      err: err
                    });
                  } else if (saveData) {
                    userCallback();
                  }
                });
              }
            });
          } else {
            userCallback();
          }
        },
        err => {
          res.json(200, {
            statusCode: 200,
            msg: "Updated locations"
          });
        }
      );
    }
  });
};

userController.getProjectData = (data, mainCallback) => {
  let projectData1 = [];
  ProjectModel.find({ "user.id": data.userId }, (err, projectData) => {
    console.log("projectData.length ", projectData.length);
    if (err) {
      mainCallback(err);
    } else if (projectData.length > 0) {
      async.forEachSeries(
        projectData,
        (project, projectCallback) => {
          // console.log('activity ', project.productStatus)
          let count = 0;
          async.forEachSeries(
            project.activities,
            (activity, activityCallback) => {
              if (activity.fileCreated) {
                count++;
                activityCallback();
              } else {
                activityCallback();
              }
            },
            err => {
              let _obj = {
                projectId: project._id,
                name: project.name,
                startProjects: count,
                DLead: project.DLead === undefined ? "" : project.DLead,
                status: project.productStatus
              };
              projectData1.push(_obj);
              projectCallback();
            }
          );
        },
        err => {
          let _user = {
            userId: data.userId,
            name: data.name,
            email: data.email,
            location: data.location,
            StartDate: data.createdAt,
            projects: projectData1
          };
          mainCallback(null, _user);
        }
      );
    } else {
      let _user = {
        userId: data.userId,
        name: data.name,
        email: data.email,
        location: data.location,
        StartDate: data.createdAt,
        projects: projectData1
      };
      mainCallback(null, _user);
    }
  });
};
userController.checkUserDublicacy = (req, res) => {
  let result = [];
  UserModel.find({}, (err, data) => {
    if (err) {
      console.log("err 1");
      res.json(500, {
        statusCode: 500,
        err: err
      });
    } else if (data.length > 0) {
      async.forEachSeries(
        data,
        (designer, callback1) => {
          UserModel.find({ userId: designer.userId }, (err, data1) => {
            if (err) {
              console.log("err 2");
              res.json(500, {
                statusCode: 500,
                err: err
              });
            } else if (data1.length > 1) {
              // async.forEachSeries()
              result.push({
                count: data1.length,
                name: designer.name,
                emailId: designer.email,
                date: designer.createdAt,
                userId: designer.userId,
                data1: data1
              });
              callback1();
            } else {
              callback1();
            }
          });
        },
        err => {
          res.json(200, {
            statusCode: 200,
            result: result
          });
        }
      );
    }
  });
};

module.exports = userController;
