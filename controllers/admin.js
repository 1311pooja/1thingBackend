const Admin = require("../models/admin");
const config = require("../config.js");
const moment = require("moment-timezone");
const utility = require("../utils/utility");
const env = require("../utils/env");
var atob = require("atob");
var async = require("async");
var fs = require('fs');
const XLSX = require('xlsx');
var xlstojson = require("xls-to-json");
var xlsxtojson = require("xls-to-json");
var multer = require('multer');
var adminController = {};

adminController.login = (req, res) => {
  let auth = req.headers.authorization;
  let dta = auth.split("Basic");
  let encrypt = atob(dta[1]);
  let decryptdata = encrypt.split(":");
  let storeData = {
    email: decryptdata[0].toLowerCase(),
    password: decryptdata[1]
  };
  console.log("login", storeData);
  let condition = {
    email: storeData.email,
    isActive: true
  };
  Admin.findOne(condition, (err, user) => {
    if (err) {
      return res.json(500, {
        err: err
      });
    } else {
      if (!user) {
        return res.json(401, {
          msg: "sorry user does not exist"
        });
      } else {
        user.comparePassword(storeData.password, (err, isMatch) => {
          if (isMatch) {
            Admin.encode(
              { email: user.email, userId: user._id.toString(), isAdmin: true },
              (err, token) => {
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
              }
            );
          } else {
            return res.json(401, {
              message: "Invalid password.Please try again."
            });
          }
        });
      }
    }
  });
};

adminController.register = (req, res) => {
  Admin.findOne({ email: req.body.email }, (err, adminExist) => {
    if (err) {
      res.status(500).send({ err: err });
    } else if (adminExist) {
      res.send(302).send({ err: "All ready Exist!" });
    } else {
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
      utility.loginByMattermost(env.teamCreatecredentials, (err, adminObj) => {
        if (err) {
          res.json(500, {
            statusCode: 500,
            err: err
          });
        }
        console.log("login admin", err, adminObj.body);
        console.log("admintok", adminObj.headers.token, adminObj.body.id);
        var adminToken = adminObj.headers.token;
        var adminId = adminObj.body.id;
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
                userId: user.id,
                userType: "admin"
              };
              var adminModel = new Admin(obj);
              adminModel.password = adminModel.generateHash(req.body.password);
              adminModel.save((err, data) => {
                if (err) {
                  res.json(500, {
                    err: err
                  });
                } else {
                  data.password = req.body.password;
                  userId = user.id;
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
                      res.status(200).send({ data: "Successfully register!" });
                    }
                  });
                }
              });
            }
          });
        });
      });
    }
  });
};

adminController.registerAllreadyInW = (req, res) => {
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
        "admin" +
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
                Admin.findOne({ email: data.email }, (err, adminExist) => {
                  if (err) {
                    // res.status(500).send({ err: err });
                    console.log("err in admin findone");
                    callback();
                  } else if (adminExist) {
                    // res.send(302).send({ err: "All ready Exist!" });
                    console.log("Email allready exist ", data.email);
                    callback();
                  } else {
                    utility.loginByMattermost(
                      env.teamCreatecredentials,
                      (err, adminObj) => {
                        if (err) {
                          console.log("err in loginByMattermost");
                          callback();
                        } else {
                          
                          var adminToken = adminObj.headers.token;
                          utility.findUserIdByEmail(
                            data.email,
                            adminToken,
                            (err, findUserIdData) => {
                              if (err) {
                                console.log("err in findUserIdByEmail", err.statusCode==404);
                                if(err.statusCode==404){
                                  // console.log("err in findUserIdByEmail", err, err.statusCode);
                                  console.log('m in signup')
                                  let _obj = {
                                    email:data.email,
                                    password:data.password,
                                    name:data.name
                                  }
                                  adminController.signupAdmin(_obj,adminToken, (err, adminSingupData)=>{
                                    if(err){
                                      callback();
                                    }
                                    else {
                                      callback();
                                    }
                                  });
                                }
                                else{
                                  callback();
                                }
                                
                              } else {
                                console.log('existing user')
                                obj = {
                                  name: data.name,
                                  email: data.email.toLowerCase(),
                                  userName: findUserIdData.username,
                                  userId: findUserIdData.id,
                                  userType: "admin"
                                };
                                var adminModel = new Admin(obj);
                                adminModel.password = adminModel.generateHash(
                                  data.password
                                );
                                adminModel.save((err, data) => {
                                  if (err) {
                                    console.log("err in save");
                                    callback();
                                  } else {
                                    let userId = findUserIdData.id;
                                    let obj = {
                                      userId: userId
                                    };
                                    utility.addUserinTeam(
                                      obj,
                                      adminToken,
                                      (err, clientData) => {
                                        console.log(
                                          "add user in team",
                                          err,
                                          clientData
                                        );
                                        if (err) {
                                          console.log("err in addUserinTeam");
                                          callback();
                                        } else {
                                          console.log("err in else addUserinTeam");
                                          callback();
                                        }
                                      }
                                    );
                                  }
                                });
                              }
                            }
                          );
                        }
                      }
                    );
                  }
                });
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

adminController.signupAdmin=(data, token, callback)=>{
  console.log('signupAdmin')
  var userObject = {},
        obj = {},
        userArray = [],
        userId,
        channelId,
        userToken,
        userHeader;
      let channel = utility.randomString(8);
      var userName = data.name.toLowerCase();
      userName = userName.split(" ");
      if (userName[0] && userName[1]) {
        userName = userName[0] + "_" + userName[1];
      } else {
        userName = userName[0];
      }
      userArray.push(userName);
      utility.userExist(userArray, token, (err, userexist) => {
        if (err) {
          callback(err);
        } else if (userexist.length != 0) {
          userName = userName + "_" + utility.randomStringforUsername(2);
        }
        userObject = {
          email: data.email.toLowerCase(),
          password: data.password,
          username: userName
        };
        utility.sign_up(userObject, (err, user) => {
          console.log("id checking", user);
          if (err) {
            callback(err);
          } else {
            obj = {
              name: data.name,
              email: data.email.toLowerCase(),
              userName: userName,
              userId: user.id,
              userType: "admin"
            };
            var adminModel = new Admin(obj);
            adminModel.password = adminModel.generateHash(data.password);
            adminModel.save((err, data) => {
              if (err) {
                callback(err);
              } else {
                data.password = data.password;
                userId = user.id;
                let obj = {
                  userId: userId
                };
                utility.addUserinTeam(obj, token, (err, clientData) => {
                  console.log("add user in team", err, clientData);
                  if (err) {
                    callback(err);
                  } else {
                    callback(null,'ok');
                  }
                });
              }
            });
          }
        });
      });
}

// adminController.register = (req, res) => {
//     if (req.body.password && req.body.email) {
//         var condition = {
//             email: req.body.email.toLowerCase(), isActive: true
//         }
//         Admin.findOne(condition, (err, existingUser) => {
//             if (err) {
//                 return res.json(500, {
//                     err: err
//                 })
//             } else if (existingUser) {
//                 return res.json(401, {
//                     msg: "user Already exist"
//                 })
//             } else {
//                 // if(req.body.password &&req.body.email&&req.body.mobile&&req.body.name){
//                 let password = req.body.password;
//                 let user = new Admin();

//                 user.email = req.body.email.toLowerCase();
//                 user.password = user.generateHash(password);

//                 user.save((err, data) => {
//                     if (err) {
//                         return res.json(500, {
//                             err: err
//                         })
//                     } else {
//                         return res.json("okk sucess")
//                     }
//                 })
//             }
//         })
//     } else {
//         return res.json(400, "sorry please provide all details for registration")
//     }
// }

module.exports = adminController;
