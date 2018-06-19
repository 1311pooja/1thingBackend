const DomainDetailsModel = require("../models/domains_details");
const utility = require("../utils/utility");
var xlsxtojson = require("xls-to-json");
var multer = require("multer");
var path = require("path");
var async = require("async");
var fs = require("fs");

var domainDetailsController = {};

//POST DATA FROM EXCEL SHEET INTO DATABASE
domainDetailsController.getDomainsDetialsExcelSheet = (req, res) => {
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
        "domainFile" +
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
    // console.log("err in uploading file", req.file, err);
    if (err) {
      console.log("err in 1st", err);
      res.json({ error_code: 1, err_desc: err });
      return;
    }
    /** Multer gives us file info in req.file object */
    if (!req.file) {
      // console.log("err in req.file", err);
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
            var subDomainArr = [];
            async.forEachSeries(
              result,
              (data, callback) => {
                // console.log("data=======>", data)
                var detailsObj = {};
                // if (
                //   data.Domains === "" &&
                //   data.SubDomains === "" &&
                //   data.Projects === "" &&
                //   data.KindOfMembers === ""
                // ) {
                //   console.log("empty callback!!!!");
                //   callback();
                // } else {
                      if (data.Domains && data.SubDomains && data.Projects && data.KindOfMembers) {
                      domain = data.Domains;
                      let subDomain =
                        data.SubDomains === "" ? [] : utility.trimString(data.SubDomains.split(","));
                      detailsObj = {
                        domainName: domain,
                        subDomains: subDomain,
                        projects: data.Projects==="" ? [] : utility.trimString(data.Projects.split(",")),
                        memberType: data.KindOfMembers==="" ? [] : utility.trimString(data.KindOfMembers.split(","))
                      };
                      domains_details = new DomainDetailsModel(detailsObj);
                      domains_details.save((err, data) => {
                        if (err) {
                          callback(err, null);
                        } else {
                          // console.log("data=======>", data);
                          callback();
                        }
                      });
                    }else {
                      // console.log("empty callback");
                      callback("empty", "no data");
                  }
                  // if (data.Domains !== "") {
                  //   domain = data.Domains;
                  //   console.log("SubDomain create======>", data.SubDomains);
                  //   let subDomain =
                  //     data.SubDomains === "" ? "" : data.SubDomains;
                  //   let subSubDomain =
                  //     data.SubSubDomains === ""
                  //       ? []
                  //       : data.SubSubDomains.split(",");
                  //   subDomainArr = [];
                  //   subDomainArr.push({
                  //     subDomainName: subDomain,
                  //     subSubDomains: subSubDomain
                  //   });
                  //   detailsObj = {
                  //     domainName: domain,
                  //     subDomains: subDomainArr,
                  //     projects: data.Projects.split(","),
                  //     memberType: data.KindOfMembers.split(",")
                  //   };
                  //   domains_details = new DomainDetailsModel(detailsObj);
                  //   domains_details.save((err, data) => {
                  //     if (err) {
                  //       callback(err, null);
                  //     } else {
                  //       console.log("data=======>", data);
                  //       callback();
                  //     }
                  //   });
                  // } else if (
                  //   data.Domains === "" ||
                  //   data.subDomains ||
                  //   data.SubSubDomains
                  // ) {
                  //   console.log("SubDomain update======>", data.SubDomains);
                  //   let subDomain =
                  //     data.SubDomains === "" ? "" : data.SubDomains;
                  //   let subSubDomain =data.SubSubDomains === ""? []
                  //       : data.SubSubDomains.split(",");
                  //   DomainDetailsModel.update(
                  //     { domainName: domain },
                  //     {
                  //       $push: {
                  //         "subDomains":{
                  //            subDomainName: subDomain,
                  //            subSubDomains: subSubDomain
                  //         }
                  //       },
                  //     },
                  //     { new: true },
                  //     (err, updateDetails) => {
                  //       if (err) {
                  //         console.log("err in update details!!!");
                  //         callback(err, null);
                  //       } else {
                  //         console.log("updateDetails=======>", updateDetails);
                  //         callback();
                  //       }
                  //     }
                  //   );
                  // }
               // }
              },
              (err) => {
                // console.log("err =====>", err)
                if (err==="empty") {
                  // console.log("lastest Approach");
                  return res.json({
                    error_code: 0,
                    err_desc: null,
                    message: "Successfully uploaded"
                  });
                } else{
                  // console.log("err", err);
                  return res.json({
                    data: "Invalid Data",
                    err: "not uploaded file"
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

//GET DATA ACCORDING TO DOMAIN
domainDetailsController.getDomainsTags = (req, res) => {
  // console.log("get domain details in query---->", req.query);
  _req = req.query;
  DomainDetailsModel.find({ domainName: _req.domainName }).exec((err, data) => {
    // console.log('error in find----->', err, 'data in find------->', data);
    if (err) {
      res.send(500, err);
    } else {
      let _arr = [];
      data.map((value, key) => {
        if (value.subDomains !== "") {
          _arr = _arr.concat(value.subDomains);
        }
      });
      // console.log("_arr in ", _arr);
      _data = {
        data: _arr,
        status: 200
      };
      res.send(200, _data);
    }

    // if()
  });
};

domainDetailsController.getAllDomains = (req, res) => {
  DomainDetailsModel.find({}).exec((err, data) => {
    if (err) {
      res.send(500, err);
    } else {
      let _arr = [];
      data.map((value, key) => {
        if (_arr.includes(value.domainName)) {
        } else {
          _arr = _arr.concat(value.domainName);
        }
      });
      // console.log("_arr in ", _arr);
      _data = {
        data: _arr,
        status: 200
      };
      res.send(200, _data);
    }
  });
};

domainDetailsController.getAllProjects = (req, res) =>{
  DomainDetailsModel.find({}).exec((err, data) => {
    if (err) {
      res.send(500, err);
    } else {
      let _arr = data[0].projects;
      
      // console.log("_arr in ", _arr);
      _data = {
        data: _arr,
        status: 200
      };
      res.send(200, _data);
    }
  });
}

domainDetailsController.KindOfMembers = (req, res) =>{
  DomainDetailsModel.find({}).exec((err, data) => {
    if (err) {
      res.send(500, err);
    } else {
      let _arr = data[0].memberType;
      
      // console.log("_arr in ", _arr);
      _data = {
        data: _arr,
        status: 200
      };
      res.send(200, _data);
    }
  });
}

module.exports = domainDetailsController;
