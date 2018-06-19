const emailModel=require('../models/emailer');
const moment = require('moment-timezone');
const env = require('../utils/env')

let emailController={}


emailController.addEmailer=(data,callback)=>{
    var dayLimit=env.dayLimitForEmailSend;
    var limitDate=moment().add(dayLimit, 'd').tz('Asia/Kolkata').format('MM/DD/YYYY');
    let email=new emailModel({
        email:data.email,
        userId:data._id,
        userType:data.userType,
        name:data.name,
        userName:data.userName,
        firstMail:{
            status:true,
            date:limitDate
        },
    })
    email.save((err,data)=>{
        // console.log("emailer data",err,data)
        callback(err,data)
    })
}

module.exports=emailController;