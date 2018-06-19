const crypto = require('crypto');
const config = require('../config.js')
const env=require('./env')
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var sgTransport = require('nodemailer-sendgrid-transport');
const moment = require('moment-timezone');
const request = require('request-promise');
const async = require('async');
var xlsxtojson = require("xls-to-json");
//edit in excel sheet
var Excel = require('exceljs');
var workbook = new Excel.Workbook();
// google api vars
var fs = require('fs');
var readline = require('readline');

var google = require('googleapis');
var googleAuth = require('google-auth-library');
var OAuth2 = google.auth.OAuth2;

var drive = google.drive({ version: 'v3', auth: oauth2Client });
var oauth2Client = new OAuth2(
  'AIzaSyBkqALVkaDOWqZQ-JuGlV7IBUg2A6RX5oM',
  '"RnEmP9xJcr08y_RVkRW6JGwk"',
  'urn:ietf:wg:oauth:2.0:oob'
);
var SCOPES = ['https://www.googleapis.com/auth/drive','https://www.googleapis.com/auth/spreadsheets' ];
var TOKEN_DIR =   './credentials/';
var TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json';

//****************** */

//to get location variables
var NodeGeocoder = require('node-geocoder');
var options = {
    provider: 'google',
   
    // Optional depending on the providers
    httpAdapter: 'https', // Default
    apiKey: 'AIzaSyDYb6o1SGtwbNjG6oXY3rr18ZyePOV9wzw', // use your own google API key
    formatter: null         // 'gpx', 'string', ...
  };
   
var geocoder = NodeGeocoder(options);

var url = "http://workspace.1thing.io/";
//var team_id = "ot67q9oyupdrzctf94qsh4i5aa"
// const team_id="deeaef8qbp8f3nbpw1xbkcuhph"
// exports.team_id=team_id;
exports.firstMsg="We are delighted to have you at 1THING."+":grinning:"+"\n"+
"I am your account manager for All things 1THING. I'll be here for anything you may need. For ease - I am also available at 9958198311 and divanshu@1thing.design."
exports.DesignerfirstMsg="We are delighted to have you at 1THING."+":grinning:"+"\n"+
"I am your onboarding manager for All things 1THING. I'll be here for anything you may need. For ease - I am also available at 9958392157 and shreya@1thing.design."





exports.createHash = function (string) {
    return crypto.createHash('sha512').update(string).digest('hex');
};
exports.randomString = (length) => {
    var chars = "12345678123456789090abcdefghijklmnopqrstuvwxyz", result = "";
    for (var i = length; i > 0; --i)
        result += chars[Math.floor(Math.random() * chars.length)];
    console.log("result", result)
    return result;
}
exports.createPassword = (length) => {
    var chars = "1234567812345678998763756463565646893993", result = "";
    for (var i = length; i > 0; --i)
        result += chars[Math.floor(Math.random() * chars.length)];
    console.log("result", result)
    return result;
}
exports.randomStringforUsername = (length) => {
    var chars = "12345678123456789090", result = "";
    for (var i = length; i > 0; --i)
        result += chars[Math.floor(Math.random() * chars.length)];
    console.log("result", result)
    return result;
}
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
exports.sendMail = (to,html, subject,from, callback) => {
    var client = nodemailer.createTransport('SMTP', {
        service: 'SendGrid',
        auth: {
            user: '1thing.design',
            //pass: 'innotical24x7'
            pass: 'Shepherd@1'
        }
    });
    var str=from.split('@');
    var name=str[0]
    name=capitalizeFirstLetter(name)
    var email = {
        from:name+' from 1THING' +'<'+from+'>',
        to: to,
        subject:subject,
        html: html
    };
    client.sendMail(email, function (err, info) {
        if (err) {
            console.log(err);
        }
        else {
            console.log('Message sent: ' + info.response);
            callback(err,info)
        }
    });
}

exports.groupEmail = (html,subject,type, callback) => {
    var array=[];
   // "varun@1thing.design","shashank@1thing.design","divanshu@1thing.design"
    // var clientArray=["manik@1thing.design","varun@1thing.design","divanshu@1thing.design"];
    // var designerArray=["manik@1thing.design","priyank@1thing.design","shashank@1thing.design","shreya@1thing.design"]
    //var test=["vipinbimt@gmail.com"]

    if(type=="designer"){
        array=env.designer_mail_array;
    }else{
    array=env.client_mail_array
    }
    var client = nodemailer.createTransport('SMTP', {
        service: 'SendGrid',
        auth: {
            user: '1thing.design',
            //pass: 'innotical24x7'
            pass: 'Shepherd@1'
        }
    });
    var email = {
        from: 'Steve from 1THING<steve@1thing.design>',
        to: array,
        subject: subject,
        // text: 'Hello world hello world vipin ',
        html: html
    };
    client.sendMail(email, function (err, info) {
        if (err) {
            console.log(err);
        }
        else {
            console.log('Message sent: ' + info.response);
            callback(err,info)
        }
    });
}
exports.sendMailToGroupUsers = (array,html, callback) => {
   // "varun@1thing.design","shashank@1thing.design","divanshu@1thing.design"
    var client = nodemailer.createTransport('SMTP', {
        service: 'SendGrid',
        auth: {
            user: '1thing.design',
            //pass: 'innotical24x7'
            pass: 'Shepherd@1'
        }
    });
    var email = {
        from: 'admin@1thing.com',
        to: array,
        subject: "1Thing user registration",
        // text: 'Hello world hello world vipin ',
        html: html
    };
    client.sendMail(email, function (err, info) {
        if (err) {
            console.log(err);
        }
        else {
            console.log('Message sent: ' + info.response);
            callback(err,info)
        }
    });
}
exports.updateChannelName=(data,token,callback)=>{
    const options = {
        method: 'PUT',
        uri: env.base_path + 'api/v4/channels/' + data.channelId ,
        json: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: {
            "id":data.channelId,
            "name": data.name,
            "display_name": data.display_name,
            "type": data.type
        },

        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            callback(null, response)
        })
        .catch(function (err) {
            callback(err)
        })
}
exports.sign_up=(user,callback)=>{
    const options = {
        method: 'POST',
        uri: env.base_path+'api/v4/users',
        json: true,
        body: {
            "email": user.email,
            "password": user.password,
            "username":user.username
        },
        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            callback(null,response)
        })
        .catch(function (err) {
            console.log("err in signup ", err)
            callback(err)
        })
}
exports.userExist=(user,token,callback)=>{
    const options = {
        method: 'POST',
        uri: env.base_path+'api/v4/users/usernames',
        json: true,
        body: user,
        headers: {
            "Authorization": "Bearer "+token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            console.log("response of user is",response)
            callback(null,response)
        })
        .catch(function (err) {
            console.log(err)
            callback(err)
        })
}
exports.userExistByEmail=(email,token,callback)=>{
    const options = {
        method: 'GET',
        uri: env.base_path+'api/v4/users/email/'+email,
        json: true,
        headers: {
            "Authorization": "Bearer "+token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            console.log("response of user email issis",response)
            callback(null,response)
        })
        .catch(function (err) {
            // console.log("err in userExistByEmail",err)
            callback(err)
        })
}
exports.getAllUsers=(token,callback)=>{
    const options = {
        method: 'GET',
        uri: env.base_path+'api/v4/users?per_page=200&page=3',
        json: true,
        headers: {
            "Authorization": "Bearer "+token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            console.log("response of user is",response)
            callback(null,response)
        })
        .catch(function (err) {
            console.log(err)
            callback(err)
        })
}
exports.loginByMattermost = (user, callback) => {
    const options = {
        method: 'POST',
        uri: env.base_path + 'api/v4/users/login',
        json: true,
        resolveWithFullResponse: true,
        body: {
            "login_id": user.email,
            "password": user.password,
        },
        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            // console.log("response",response['token'])
            callback(null, response)
        })
        .catch(function (err) {
            callback(err)
        })
}




//deeaef8qbp8f3nbpw1xbkcuhph
exports.createChannel = (data, token, callback) => {
    const options = {
        method: 'POST',
        uri: env.base_path + 'api/v3/teams/' + env.team_id + '/channels/create',
        json: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: {
            "name": data.name,
            "display_name": data.display_name,
            "type": data.type
        },

        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            callback(null, response)
        })
        .catch(function (err) {
            callback(err)
        })
}

exports.createDynamicChannel = (data, token, callback) => {
    const options = {
        method: 'POST',
        uri: env.base_path + 'api/v3/teams/' + data.team_id + '/channels/create',
        json: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: {
            "name": data.name,
            "display_name": data.display_name,
            "type": data.type
        },

        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            callback(null, response)
        })
        .catch(function (err) {
            callback(err)
        })
}

exports.addUserinMonochromeTeam = (data, token, callback) => {
    console.log("monochrome team id",  env.monochrome_team)
    const options = {
        method: 'POST',
        uri: env.base_path + 'api/v4/teams/' + env.monochrome_team + '/members',
        json: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Content-Type': 'application/json'
        },
        body: {
            team_id: env.monochrome_team,
            user_id: data.userId
        }
        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            callback(null, response)
        })
        .catch(function (err) {
            callback(err)
        })
}
exports.addUserinTeam = (data, token, callback) => {
    //  api/v4/teams/st7wjd3mytfympiktqmydryp3y/members/batch
    var array = [{ team_id: env.team_id, user_id: data.userId }]

    console.log("array of add team", array)
    const options = {
        method: 'POST',
        uri: env.base_path + 'api/v4/teams/' + env.team_id + '/members',
        json: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Content-Type': 'application/json'
        },
        body: {
            team_id: env.team_id,
            user_id: data.userId
        }

        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            callback(null, response)
        })
        .catch(function (err) {
            callback(err)
        })
}

exports.addUser = (data, token, callback) => {
    const options = {
        method: 'POST',
        uri: env.base_path + 'api/v3/teams/' + env.team_id + '/channels/' + data.channelid + '/add',
        json: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: {
            user_id: data.userId
        },
    }
    request(options)
        .then(function (response) {
            callback(null, response)
        })
        .catch(function (err) {
            callback(err)
        })
}
exports.addUserinChannelforDesigners = (data, token, callback) => {
    var array=[{
        user_id:'mje7a7fr47g4bckt5qebdpqscc' 
    },{
        user_id:'tbuwu3qyp7gxffuu593hfijw1w'  
    },{
        user_id:"ifrjkzrfktdh5dk9q6iuop85uy"
    }
    ]
    async.eachSeries(array, function (item, cb) {
        const options = {
            method: 'POST',
            uri: env.base_path + 'api/v3/teams/' + env.team_id + '/channels/' + data.channelid + '/add',
            json: true,
            headers: {
                "Authorization": "Bearer " + token,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: {
                user_id: item.user_id
            },
        }
        request(options)
            .then(function (response) {
                console.log("addusers for admin in group",response)
                cb()
            })
            .catch(function (err) {
                console.log("addusers for admin in group",err)
                cb(err)
            })
    },(err)=>{
        if(err){
            console.log("err",err)
            callback(err)
        }else{
            callback(null,"success")
        }

    })
   
}

exports.addUserinDynamicChannelforDesigners = (data, token, callback) => {
    var array=[{
        user_id:'mje7a7fr47g4bckt5qebdpqscc' 
    },{
        user_id:'tbuwu3qyp7gxffuu593hfijw1w'  
    },{
        user_id:"ifrjkzrfktdh5dk9q6iuop85uy"
    }
    ]
    async.eachSeries(array, function (item, cb) {
        const options = {
            method: 'POST',
            uri: env.base_path + 'api/v3/teams/' + data.team_id + '/channels/' + data.channelid + '/add',
            json: true,
            headers: {
                "Authorization": "Bearer " + token,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: {
                user_id: item.user_id
            },
        }
        request(options)
            .then(function (response) {
                console.log("addusers for admin in group",response)
                cb()
            })
            .catch(function (err) {
                console.log("addusers for admin in group",err)
                cb(err)
            })
    },(err)=>{
        if(err){
            console.log("err",err)
            callback(err)
        }else{
            callback(null,"success")
        }

    })
   
}
exports.addUserinChannelforClient= (data, token, callback) => {
    var array=[{
        user_id:'zmfxtxotdbyzzqf13zttepjz8h' 
    },{
        user_id:'idxhmyx1upncjgdb5khba737ga'  
    },{
        user_id:"tbuwu3qyp7gxffuu593hfijw1w"
    }
    ]
    async.eachSeries(array, function (item, cb) {
        const options = {
            method: 'POST',
            uri: env.base_path + 'api/v3/teams/' + env.team_id + '/channels/' + data.channelid + '/add',
            json: true,
            headers: {
                "Authorization": "Bearer " + token,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: {
                user_id: item.user_id
            },
        }
        request(options)
            .then(function (response) {
                console.log("addusers for admin in group",response)
                cb()
            })
            .catch(function (err) {
                cb(err)
                console.log("addusers for admin in group",err)
            })
    },(err)=>{
        if(err){
            // conso1FmczydiWl7Kp036fuOcgqVzJKCNVaU3PN6mObUKR36Ele.log("err",err)
            console.log("err",err)
            callback(err)
        }else{
            callback(null,"success")
        }

    })
   
}
exports.addUserInChannelDynamic = (data, token, callback) => {
    const options = {
        method: 'POST',
        uri: env.base_path + 'api/v3/teams/' + data.team_id + '/channels/' + data.channelid + '/add',
        json: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: {
            user_id: data.userId
        },
        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            callback(null, response)
        })
        .catch(function (err) {
            callback(err)
        })
}
exports.addUser = (data, token, callback) => {
    const options = {
        method: 'POST',
        uri: env.base_path + 'api/v3/teams/' + env.team_id + '/channels/' + data.channelid + '/add',
        json: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: {
            user_id: data.userId
        },
        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            callback(null, response)
        })
        .catch(function (err) {
            callback(err)
        })
}
exports.createPost = (data, token, callback) => {
    const options = {
        method: 'POST',
        uri: env.base_path + 'api/v4/posts',
        json: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: {
            channel_id: data.channel_id,
            message: data.message
        },
        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            callback(null, response)
        })
        .catch(function (err) {
            callback(err)
        })
}

// pooja's code 
exports.existTeamMember=(user,token,callback)=>{
     const options = {
        method: 'GET',
        uri: env.base_path+'api/v4/teams/'+env.team_id+'/members/'+user.userId,
        json: true,
        headers: {
            "Authorization": "Bearer "+token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            callback(null,response)
        })
        .catch(function (err) {
            callback(err)
        })
}

//find longitude and latitude
exports.getLocations=(place, callback)=>{
    // console.log("place===>", place)
    let arr = []
    geocoder.geocode(place, function(err, res) {
        if(err){
            console.log("error--------->", err)
            callback(true , err)
        }
        else if(res.length>0){
            let latitude=res[0].latitude;
            let longitude=res[0].longitude;
            arr=[longitude, latitude]
            // console.log(latitude,'resss', longitude, 'arr', arr);
            callback(null, arr);
        }
        else{
            callback(null , "")
        }
      });
}

exports.getPlace=(latlong, callback)=>{
    geocoder.reverse({lat:latlong[1], lon:latlong[0]}, function(err, res){
        if(err){
            callback(err)
        }
        else{
            callback(null, res)
        }
    })
}

//find distance between two longitude and latitude

exports.getDistanceFromLatLonInKm=(lat1,lon1,lat2,lon2)=> {
  let R = 6371; // Radius of the earth in km
  let dLat = deg2rad(lat2-lat1);  // deg2rad below
  let dLon = deg2rad(lon2-lon1); 
  let a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  let d = R * c; // Distance in km
  return d;
}

deg2rad=(deg)=> {
  return deg * (Math.PI/180)
}

//code for trim array string;
exports.trimString = (arr)=>{
    let temp=[];
    arr.map((value, key)=>{
        temp.push(value.trim());
    });
    return temp;
}

exports.createTeam=(user,token,callback)=>{
    const options = {
        method: 'POST',
        uri: env.base_path+'api/v4/teams',
        json: true,
        body: user,
        headers: {
            "Authorization": "Bearer "+token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            // console.log("response of user is",response)
            callback(null,response)
        })
        .catch(function (err) {
            console.log(err)
            callback(err)
        })
}

//to add multiple users in team
exports.addUsersinClientTeam = (data, token, teamId,callback) => {
    // var array = [
    //         { 
    //             team_id: data.teamId, 
    //             user_id: data.adminUserId
    //         }]

    // console.log("array of add team", array)  
    //  api/v4/teams/st7wjd3mytfympiktqmydryp3y/members/batch
    const options = {
        method: 'POST',
        uri: env.base_path + 'api/v4/teams/' + teamId + '/members/batch',
        json: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Content-Type': 'application/json'
        },
        body: data

        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            callback(null, response)
        })
        .catch(function (err) {
            console.log('err in request------->', err)
            callback(err)
        })
}

//to add single user in any team
exports.addUserInDynamicTeam = (data, token, callback)=>{
    const options = {
        method: 'POST',
        uri: env.base_path + 'api/v4/teams/' + data.team_id + '/members',
        json: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Content-Type': 'application/json'
        },
        body: {
            team_id: data.team_id,
            user_id: data.userId
        }

        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            callback(null, response)
        })
        .catch(function (err) {
            callback(err)
        })
}

//to add single user in team
exports.addSingleUserinClienTeam = (data, token, callback) => {
    
    const options = {
        method: 'POST',
        uri: env.base_path + 'api/v4/teams/' + data.teamId + '/members',
        json: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Content-Type': 'application/json'
        },
        body: {
            team_id: data.teamId,
            user_id: data.adminUserId
        }
    }
    request(options)
        .then(function (response) {
            callback(null, response)
        })
        .catch(function (err) {
            console.log("err in addSingleUserinClienTeam", err)
            callback(err)
        })
}

//remove user from  team 
exports.removeUserFromTeam = (data, token, callback) => {
    
    const options = {
        method: 'POST',
        uri: env.base_path + 'api/v3/teams/' + data.teamId + '/remove_user_from_team',
        json: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Content-Type': 'application/json'
        },
        body:{
            user_id: data.userId
        }
    }
    request(options)
        .then(function (response) {
            callback(null, response)
        })
        .catch(function (err) {
            console.log("err in removeUserFromTeam", err)
            callback(err)
        })
}

exports.getMsgByChannelId = (channelId, token, callback) => {
    console.log(channelId+'========='+token)
    const options = {
        method: 'GET',
        uri: env.base_path + 'api/v4/channels/'+ channelId + '/posts?page=0&per_page=1',
        json: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Content-Type': 'application/json'
        },
        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            callback(null, response)
        })
        .catch(function (err) {
            // console.log('err in request------->', err)
            callback(err)
        })
}

//razar pay api
exports.paymentCapture = (transactionId,amount, callback)=>{
     const options = {
        method: 'POST',
        uri: env.rajzorpay_path+"payments/"+transactionId+"/capture",
        json: true,
        form:{
            amount:amount
        }
        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            console.log("response of payment is",response)
            callback(null,response)
        })
        .catch(function (err) {
            console.log(err)
            callback(err)
        })
}

exports.subscribePlan = (data, callback)=>{
    
    const options = {
        method: 'POST',
        uri: env.rajzorpay_path+"subscriptions",
        json: true,
        form:{
            plan_id: data.planId,
            customer_notify: 1,
            total_count: data.totalCount,
        }
        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            console.log("response of subscribe is",response)
            callback(null,response)
        })
        .catch(function (err) {
            // console.log(err)
            callback(err)
        })
}

exports.subscriptionAddons = (data, callback)=>{
    console.log('data---->', data);
    // callback(null, 'hy');
    const options = {
        method: 'POST',
        uri: env.rajzorpay_path+"subscriptions/"+data.subscriptionId+"/addons",
        json: true,
        form:{
            item: {
                name: "Extra charge",
                amount: data.amount,
                currency: "INR"
            }
        },
        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            console.log("response of addons ",response)
            callback(null,response)
        })
        .catch(function (err) {
            console.log(err)
            callback(err)
    })

}

// google api 
exports.uploadSheetOnDrive = (data,sheetCallback) => {
    
    var row, _link;                
    var pickFile=(data.fileName.split("_"))[0];  
    console.log("uploaded data----------->", pickFile)                          
    // editing in excel sheet 

    async.waterfall([
            function(callback1){
                workbook.xlsx.readFile("./public/"+pickFile+".xlsx").then(function() {
                    //***************editing in About PC*****************
                    // var aboutPcWorkSheet = workbook.getWorksheet('Project');
                    // console.log('row count',aboutPcWorkSheet.actualRowCount);

                    //===========editing for userInfo==========
                    // row= aboutPcWorkSheet.getRow(1);
                    // row.getCell(3).value = "Yet to Start"; //set user file status
                    // row.commit();
                    // row= aboutPcWorkSheet.getRow(4);
                    // row.getCell(3).value = data.userInfo.name; //set user name
                    // row.commit();
                    // row = aboutPcWorkSheet.getRow(5);
                    // row.getCell(3).value = data.userInfo.email; //set user email
                    // row.commit();
                    // row = aboutPcWorkSheet.getRow(6);
                    // row.getCell(3).value = data.userInfo.mobile; //set user mobile
                    // row.commit();

                    //============editing for projectInfo==========
                    // row= aboutPcWorkSheet.getRow(9);
                    // row.getCell(3).value = data.projectInfo.name; //set project name
                    // row.commit();
                    // row = aboutPcWorkSheet.getRow(10);
                    // row.getCell(3).value = data.projectInfo.labels; //set project labels
                    // row.commit();
                    // row = aboutPcWorkSheet.getRow(11);
                    // row.getCell(3).value = data.projectInfo.link; //set project link
                    // row.commit();

                    //============editing for paymentInfo==========
                    // row= aboutPcWorkSheet.getRow(5);
                    // row.getCell(3).value = ""; //set payment kickOffDate
                    // row.commit();
                    // row = aboutPcWorkSheet.getRow(6);
                    // row.getCell(3).value = ""; //set payment renewalDate
                    // row.commit();

                    //***************editing in Right Design Team*****************
                    var rdtWorkSheet = workbook.getWorksheet('Right Design Team');
                    row= rdtWorkSheet.getRow(2);
                    
                    row.getCell(1).value = data.designerInfo.name; //set designerInfo name
                    row.getCell(3).value = data.designerInfo.email; //set designerInfo email
                    row.getCell(4).value = data.designerInfo.mobile; //set designerInfo mobile
                    row.commit();

                    //***************editing in Resources*****************

                    var resources = workbook.getWorksheet('Resources');
                    
                    row = resources.getRow(2);
                    _link = env.base_path+data.projectInfo.teamName+"/channels/town-square";
                    
                    // row.getCell(3).value ={text:"Link",hyperlink:_link};
                    row.getCell(3).value =_link;
                    row.commit();

                    row = resources.getRow(3);
                    _link= "https://drive.google.com/drive/folders/"+data.folderId
                    // row.getCell(3).value = {text:"Link",hyperlink:_link};
                    row.getCell(3).value = _link;
                    row.commit();
                    //**************editing in Daily Updates*************
                     var dUpdates = workbook.getWorksheet('Daily Updates ');
                    //  for(let i=2;i<59;i++){
                    //      row = dUpdates.getRow(i);
                    //      row.getCell(1).value =data.days[i-2];
                    //      row.commit();
                    // }
                    workbook.xlsx.writeFile('file1.xlsx').then(()=>callback1(null, "Done"));
                })      
                
            },
            function(result, callback2){
                console.log("result", result)
                // Load client secrets from a local file.
                fs.readFile('client_secret.json', function processClientSecrets(err, content) {
                if (err) {
                    console.log('Error loading client secret file: ' + err);
                    return;
                }
                // Authorize a client with the loaded credentials, then call the
                // Google Sheets API.
                authorize(JSON.parse(content), createFile);
                });


                /**
                 * Create an OAuth2 client with the given credentials, and then execute the
                 * given callback function.
                 *
                 * @param {Object} credentials The authorization client credentials.
                 * @param {function} callback The callback to call with the authorized client.
                 */
                function authorize(credentials, callback) {
                var clientSecret = credentials.installed.client_secret;
                var clientId = credentials.installed.client_id;
                var redirectUrl = credentials.installed.redirect_uris[0];
                var auth = new googleAuth();
                var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

                // Check if we have previously stored a token.
                fs.readFile(TOKEN_PATH, function(err, token) {
                    console.log('console 3');
                    if (err) {
                    getNewToken(oauth2Client, callback);
                    } else {
                    console.log('console 4');
                    oauth2Client.credentials = JSON.parse(token);
                    // oauth2Client.info={folderName:'pooja', fileName:'pinki'}
                    callback(oauth2Client);
                    }
                });
                }

                /**
                 * Get and store new token after prompting for user authorization, and then
                 * execute the given callback with the authorized OAuth2 client.
                 *
                 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
                 * @param {getEventsCallback} callback The callback to call with the authorized
                 *     client.
                 */
                function getNewToken(oauth2Client, callback) {
                var authUrl = oauth2Client.generateAuthUrl({
                    access_type: 'offline',
                    scope: SCOPES
                });
                console.log('Authorize this app by visiting this url: ', authUrl);

                var rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout,
                    terminal:true,
                });
                rl.question('Enter the code from that page here: ', function(code) {
                    console.log('in code function', code)
                    rl.close();
                    oauth2Client.getToken(code, function(err, token) {
                    if (err) {
                        console.log('Error while trying to retrieve access token', err);
                        oauth2Client.setCredentials(tokens);
                        return;
                    }
                    oauth2Client.credentials = token;
                    storeToken(token);
                    callback(oauth2Client);
                    });
                });
                }

                /**
                 * Store token to disk be used in later program executions.
                 *
                 * @param {Object} token The token to store to disk.
                 */
                function storeToken(token) {
                try {
                    fs.mkdirSync(TOKEN_DIR);
                } catch (err) {
                    if (err.code != 'EEXIST') {
                    throw err;
                    }
                }
                fs.writeFile(TOKEN_PATH, JSON.stringify(token));
                console.log('Token stored to ' + TOKEN_PATH);
                }
                function createFile(auth) {
                   uploadFile(auth,data,(err,uploadedRes)=>{
                       if(err){
                           console.log('file not found ***********************');
                           callback2(err);
                        }else{
                            try {
                                fs.unlinkSync("file1.xlsx");
                                // afterDeleteCallback(null,resource, rdt, thingsToDo, dailyUpdates)
                            } catch (e) {
                                //error deleting the file
                                console.log("in catch");
                            }
                            callback2(null,uploadedRes);
                        }
                       
                   })
                }

                
            },
        ], function (err, result) {
            if(err){
                sheetCallback(err);
            }
            else{
                sheetCallback(null,result);
            }
         
        });
    


}
uploadFile=(auth,data,fileCallback)=>{
    var row, _link;
    if(data.folderId===""){
                    console.log('m in new folder google  docs');

                    let folderMetaData = {
                        'name': data.folderName,
                        'mimeType': 'application/vnd.google-apps.folder',
                        // parents: ['1ZiENw9dwjtpr1_FyZLdSaRIgx7slL_zb']   //salman
                        parents: [env.parentFolderId] 
                        };

                    //create product name folder in 1thing folder
                    drive.files.create({
                        resource: folderMetaData,
                        fields: 'id',
                        auth: auth,
                        
                    }, function (err, folder)   {
                        if (err) {
                            console.error('error',err);
                            fileCallback(err);
                        } else {

                        var folder_id=folder.id;
                        var sheet_fileMetadata = {
                            'name': data.fileName,
                            'mimeType': 'application/vnd.google-apps.folder',
                            parents: [folder_id] 
                        };

                        //create activity name folder(project) in product name folder
                        drive.files.create({
                            resource: sheet_fileMetadata,
                            fields: 'id',
                            auth: auth
                        },function (sheet_err,sheet_folder){
                            if(sheet_err){
                                console.log('in sheet folder err',sheet_err);
                                fileCallback(sheet_err);
                            }
                            else{
                                var sheet_FolderId=sheet_folder.id;

                                async.waterfall([
                             function(callback3){
                                 workbook.xlsx.readFile("file1.xlsx").then(function() {
                                     
                                    var resources = workbook.getWorksheet('Resources');
                                    console.log('row count',resources.actualRowCount);

                                    var resources = workbook.getWorksheet('Resources');
                    
                                    row = resources.getRow(2);
                                    _link = env.base_path+data.projectInfo.teamName+"/channels/town-square";
                                    
                                    // row.getCell(3).value ={text:"Link",hyperlink:_link};
                                    row.getCell(3).value =_link;
                                    row.commit();

                                    row = resources.getRow(3);
                                    _link= "https://drive.google.com/drive/folders/"+folder_id

                                    // row.getCell(3).value = {text:"Link",hyperlink:_link};
                                    row.getCell(3).value = _link;
                                    row.commit();

                                    workbook.xlsx.writeFile('file1.xlsx').then(()=>{callback3(null, "Done")});
                                 })
                             },
                            function(res, callback4){
                                console.log("m in callback4");
                                let fileMetadata = {
                                    'name': data.fileName+'.xlsx',
                                    parents: [sheet_FolderId],
                                    mimeType: 'application/vnd.google-apps.spreadsheet',
                                };
                                let media = {
                                    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                    body: fs.createReadStream('./file1.xlsx')
                                };

                                //create sheet file in sheet_folder
                                drive.files.create({
                                    resource: fileMetadata,
                                    media: media,
                                    fields: 'id',
                                    auth: auth,
                                }, function (err, file) {
                                    if (err) {
                                        console.log('in sheet file err',err);
                                        fileCallback(err);
                                    } 
                                    else {
                                        console.log('File Id: ', file.id);
                                        let fileId = file.id;
                                        let obj={
                                            folder_id:folder_id,
                                            sheet_FolderId:sheet_FolderId,
                                            fileId:fileId
                                        }
                                        //code for folder access to dL
                                        drive.permissions.create({
                                            resource: {
                                                'type': 'anyone',
                                                'role': 'reader',
                                            },
                                            fileId: fileId,
                                            fields: 'id',
                                            auth:auth
                                            }, function(err, res) {
                                            if (err) {
                                                console.log('in  folder access reader err',err);
                                                fileCallback(err);
                                            } else {
                                                console.log('Permission ID: ', res.id);

                                            drive.permissions.create({
                                                resource:{
                                                'type':'user',
                                                'role':'writer',
                                                'emailAddress': data.designerInfo.email
                                                },
                                                fileId: fileId,
                                                fields: 'id',
                                                auth:auth
                                            },(err,resp)=>{
                                                if(err){
                                                    console.log('in  folder access writer to dl err',err);
                                                    fileCallback(err);
                                                }
                                                else{
                                                console.log('Permission ID: ', resp.id);

                                                //create stages folders
                                                createStagesFolder(auth, data.statgesArr,sheet_FolderId, (err, stagesResult)=>{
                                                    if(err){
                                                        console.log('in  createStagesFolder err',err);
                                                        fileCallback(err);
                                                    }
                                                    else{
                                                        console.log("stagesResult ", stagesResult);
                                                        callback4(null,obj);
                                                    }
                                                 })
                                                }
                                            })
                                            }
                                        });
                                    }
                                });
                            }
                           
                        ], function(err,result){
                            if(err){
                                fileCallback(err);
                            }
                            else{
                                fileCallback(null, result);
                            }
                             
                        })
                            }
                        })
                       
                        }
                    });
                   }
                   else{

                    console.log('m in existing folder google docs');
                         let folderMetaData = {
                            'name': data.fileName,
                            'mimeType': 'application/vnd.google-apps.folder',
                            parents: [data.folderId]  
                        };
                        //create activity name folder(project) in product name folder
                        drive.files.create({
                            resource: folderMetaData,
                            fields: 'id',
                            auth: auth,
                            
                        },function (err,folder){
                        if(err){
                            console.log('error in create sheet folder exsisting folder',err);
                            fileCallback(err);
                        }
                        else{
                            var sheet_FolderId=folder.id;
                            let fileMetadata = {
                                'name': data.fileName+'.xlsx',
                                parents: [sheet_FolderId],
                                mimeType: 'application/vnd.google-apps.spreadsheet',
                            };
                            let media = {
                                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                body: fs.createReadStream('./file1.xlsx')
                            };
                            //create sheet file in sheet_folder
                            drive.files.create({
                                resource: fileMetadata,
                                media: media,
                                fields: 'id',
                                auth: auth,
                            }, function (err, file) {
                                if (err) {
                                    console.error('error existing',err);
                                    fileCallback(err);
                                } else {
                                    console.log('File Id: existing', file.id);
                                    let fileId = file.id;
                                    let obj={
                                        fileId:fileId,
                                        sheet_FolderId:sheet_FolderId   
                                    }
                                    //code for folder access to dL
                                        drive.permissions.create({
                                            resource: {
                                                'type': 'anyone',
                                                'role': 'reader',
                                            },
                                            fileId: fileId,
                                            fields: 'id',
                                            auth:auth
                                            }, function(err, res) {
                                            if (err) {
                                                console.log('in existing folder access reader err',err);
                                                fileCallback(err);
                                            } else {
                                                console.log('Permission ID: existing', res.id);

                                            drive.permissions.create({
                                                resource:{
                                                'type':'user',
                                                'role':'writer',
                                                'emailAddress': data.designerInfo.email
                                                },
                                                fileId: fileId,
                                                fields: 'id',
                                                auth:auth
                                            },(err,resp)=>{
                                                if(err){
                                                    console.log('in existing folder access writer to dl err',err);
                                                    fileCallback(err);
                                                }
                                                else{
                                                console.log('Permission ID: existing', resp.id);

                                                //create stages folders
                                                createStagesFolder(auth, data.statgesArr,sheet_FolderId, (err, stagesResult)=>{
                                                    if(err){
                                                        console.log('in existing createStagesFolder err',err);
                                                        fileCallback(err);
                                                    }
                                                    else{
                                                        console.log("stagesResult existing", stagesResult);
                                                        fileCallback(null, obj);
                                                    }
                                                 })
                                                }
                                            })
                                            }
                                        });
                                }
                            });
                        }
                    });
                   }
}

createStagesFolder =(auth, data,parent, stagesCallback)=>{
    async.forEachSeries(data, (result, callback)=>{
        let folderMetaData = {
            'name': result,
            'mimeType': 'application/vnd.google-apps.folder',
            parents: [parent],
        };
        drive.files.create({
            resource: folderMetaData,
            fields: 'id',
            auth: auth,
        }, function (err, folder)   {
            if (err) {
                console.error('err in create stages folder',err);
                stagesCallback(err)
            } else {
                console.log('folder Id', folder.id);
                callback();
            }
         }
        )
    },err=>{
        stagesCallback(null, "done");
    })
}
exports.downloadExcelSheetFromDrive=(fileId, downLoadCallback)=>{

    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
                if (err) {
                    console.log('Error loading client secret file: ' + err);
                    return;
                }
                // Authorize a client with the loaded credentials, then call the
                // Google Sheets API.
                authorize(JSON.parse(content), downLoadSheet);
                });


                /**
                 * Create an OAuth2 client with the given credentials, and then execute the
                 * given callback function.
                 *
                 * @param {Object} credentials The authorization client credentials.
                 * @param {function} callback The callback to call with the authorized client.
                 */
                function authorize(credentials, callback) {
                var clientSecret = credentials.installed.client_secret;
                var clientId = credentials.installed.client_id;
                var redirectUrl = credentials.installed.redirect_uris[0];
                var auth = new googleAuth();
                var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

                // Check if we have previously stored a token.
                fs.readFile(TOKEN_PATH, function(err, token) {
                    // console.log('console 3');
                    if (err) {
                    getNewToken(oauth2Client, callback);
                    } else {
                    // console.log('console 4');
                    oauth2Client.credentials = JSON.parse(token);
                    // oauth2Client.info={folderName:'pooja', fileName:'pinki'}
                    callback(oauth2Client);
                    }
                });
                }

                /**
                 * Get and store new token after prompting for user authorization, and then
                 * execute the given callback with the authorized OAuth2 client.
                 *
                 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
                 * @param {getEventsCallback} callback The callback to call with the authorized
                 *     client.
                 */
                function getNewToken(oauth2Client, callback) {
                var authUrl = oauth2Client.generateAuthUrl({
                    access_type: 'offline',
                    scope: SCOPES
                });
                console.log('Authorize this app by visiting this url: ', authUrl);

                var rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout,
                    terminal:true,
                });
                rl.question('Enter the code from that page here: ', function(code) {
                    console.log('in code function', code)
                    rl.close();
                    oauth2Client.getToken(code, function(err, token) {
                    if (err) {
                        console.log('Error while trying to retrieve access token', err);
                        oauth2Client.setCredentials(tokens);
                        return;
                    }
                    oauth2Client.credentials = token;
                    storeToken(token);
                    callback(oauth2Client);
                    });
                });
                }

                /**
                 * Store token to disk be used in later program executions.
                 *
                 * @param {Object} token The token to store to disk.
                 */
                function storeToken(token) {
                try {
                    fs.mkdirSync(TOKEN_DIR);
                } catch (err) {
                    if (err.code != 'EEXIST') {
                    throw err;
                    }
                }
                fs.writeFile(TOKEN_PATH, JSON.stringify(token));
                // console.log('Token stored to ' + TOKEN_PATH);
                }


                function downLoadSheet(auth) {
                    console.log('file id-------->', fileId)
                    drive.files.get({
                        fileId: fileId,
                        auth:auth
                    }, (err, metadata) => {
                        if (err) {
                            console.log("errror in downloading file1");
                            // throw err;
                            downLoadCallback();
                        }
                        else{
                            const dest = fs.createWriteStream("./pooja.xlsx");
                    
                            drive.files.export({
                            fileId: fileId,
                            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            auth:auth
                            })
                            .on('error', err => {
                                // console.error('Error downloading file');
                                // throw err;
                                console.log("errror in downloading file2")
                                downLoadCallback()
                            })
                            .pipe(dest);

                            dest
                            .on('finish', () => {
                                // console.log('Downloaded %s!', metadata.name);
                                // console.log("file downloaded!!!", metadata)
                                downLoadCallback(null,metadata.name)
                                // process.exit();
                            })
                            .on('error', err => {
                                console.error('Error writing file!');
                                // throw err;
                                downLoadCallback()
                            });
                        }
                        
                    });
                }
    
}

exports.readAllCellsValueOfExcelSheet = (activityStatus,sheetCallback)=>{   
    var row, readExcelSheetObj={};
    workbook.xlsx.readFile("pooja.xlsx").then(function() {

                    //***************editing in About PC*****************
                    var aboutPcWorkSheet = workbook.getWorksheet('Project');
                    if(aboutPcWorkSheet){
                        // console.log("aboutPcWorkSheet=====>", aboutPcWorkSheet);
                        row= aboutPcWorkSheet.getRow(1);
                        let sheetStatus=(row.getCell(3).value).trim();
                        row = aboutPcWorkSheet.getRow(5);
                        let startDate = row.getCell(3).value;
                        row = aboutPcWorkSheet.getRow(6);
                        let endDate = row.getCell(3).value;
                        var aboutPc = {
                            sheetStatus:sheetStatus,
                            startDate:startDate,
                            endDate:endDate
                        }
                        console.log('sheetStatus=====>',sheetStatus, "activityStatus======",activityStatus)
                        if((sheetStatus==="In Progress" || sheetStatus==="Completed") && sheetStatus!==activityStatus){
                        // console.log("condition satisfy")
                            async.waterfall([
                            function(rdtCallback){
                                console.log('rdt callback');
                                let _rdtArr=[];
                                xlsxtojson(
                                {
                                    input: "pooja.xlsx",
                                    output: null, //since we don't need output.json
                                    sheet:"Right Design Team"
                                },
                                function(err, result) {
                                    // console.log('result',result)
                                    if (err) {
                                    console.log("err in 2nd", err);
                                    //   return res.json({ error_code: 1, err_desc: err, data: null });
                                    } else {
                                    //   console.log('result',result);
                                    async.forEachSeries(result,(rdtData, rdtCb)=>{
                                        // console.log('rdtData-------->', rdtData);
                                        if(rdtData.Role){
                                            let _obj={
                                                name:rdtData.Name,
                                                role:rdtData.Role,
                                                email:rdtData.Email,
                                                phone:rdtData.Phone,
                                                availabel:rdtData.Available,
                                                notAvailable:rdtData.Not_Available,
                                                anyThingElse:rdtData.Anything_Else,
                                            }
                                            _rdtArr.push(_obj);
                                            rdtCb();
                                        }
                                        else{
                                            rdtCb();
                                        }
                                    },err=>{
                                        rdtCallback(null,_rdtArr);
                                    })
                                    }
                                }
                                );
                            },
                            function(rdt, resourceCallback){
                                console.log('resourceCallback callback');
                                let resourceArr=[];
                                xlsxtojson(
                                {
                                    input: "pooja.xlsx",
                                    output: null, //since we don't need output.json
                                    sheet:"Resources"
                                },
                                function(err, result) {
                                    // console.log('result',result)
                                    if (err) {
                                    console.log("err in 2nd", err);
                                    //   return res.json({ error_code: 1, err_desc: err, data: null });
                                    } else {
                                        
                                    async.forEachSeries(result,(resourcesData, resCb)=>{
                                        if(resourcesData.Link){
                                            let _obj={
                                                name:resourcesData.Name,
                                                purpose:resourcesData.Purpose,
                                                link:resourcesData.Link,
                                            }
                                            resourceArr.push(_obj);
                                            resCb();
                                        }
                                        else{
                                            resCb();
                                        }
                                    },err=>{
                                        resourceCallback(null, resourceArr, rdt)
                                    })
                                    }
                                }
                                );
                            },
                            function(resource,rdt,thingsCallback){
                                console.log('thingsCallback   ')
                                let _thingsToDoArr=[];
                                xlsxtojson(
                                {
                                    input: "pooja.xlsx",
                                    output: null, //since we don't need output.json
                                    sheet:"Things To Do"
                                },
                                function(err, result) {
                                    if (err) {
                                    console.log("err in 2nd", err);
                                    //   return res.json({ error_code: 1, err_desc: err, data: null });
                                    } else {
                                        let _toDoObj={},_taskArr=[],_lastRowObj={} ;
                                    async.forEachSeries(result,(thingsToDoData, thingsCb)=>{
                                            if(thingsToDoData.Stages){
                                                if(_toDoObj && _taskArr.length!==0){
                                                    let _obj={
                                                        stages:_toDoObj.stages,
                                                        minHours:_toDoObj.minHours,
                                                        maxHours:_toDoObj.maxHours,
                                                        endDates:_toDoObj.date,
                                                        stageStatus:_toDoObj.addStatus,
                                                        tasks:_taskArr
                                                    }
                                                    _thingsToDoArr.push(_obj);
                                                }
                                                _taskArr=[],_toDoObj={};
                                                _toDoObj.stages=thingsToDoData.Stages,
                                                _toDoObj.minHours=(thingsToDoData["Hours(Min)"].trim()!==""?parseFloat(thingsToDoData["Hours(Min)"].trim()):0),
                                                _toDoObj.maxHours=(thingsToDoData["Hours(Max)"].trim()!==""?parseFloat(thingsToDoData["Hours(Max)"].trim()):0),
                                                _toDoObj.date=thingsToDoData.Timeline,
                                                _toDoObj.addStatus=thingsToDoData.Stage_Status,
                                                _taskArr.push({
                                                    thingsToDo:thingsToDoData.Things_To_Do,
                                                    ownerShip:thingsToDoData.Ownership,
                                                });
                                                thingsCb();
                                            }
                                            else{
                                                if(!thingsToDoData.Things_To_Do && thingsToDoData["Hours(Min)"] && thingsToDoData["Hours(Max)"]){
                                                    // _lastRowObj.totalMinHours=parseFloat(thingsToDoData["Hours(Min)"]);
                                                    _lastRowObj.totalMinHours=(thingsToDoData["Hours(Min)"].trim()!==""?parseFloat(thingsToDoData["Hours(Min)"].trim()):0),
                                                    
                                                    // _lastRowObj.totalMaxHours=parseFloat(thingsToDoData["Hours(Max)"]);
                                                    _lastRowObj.totalMaxHours=(thingsToDoData["Hours(Max)"].trim()!==""?parseFloat(thingsToDoData["Hours(Max)"].trim()):0);
                                                    _lastRowObj.endDate=thingsToDoData.Dates
                                                //    console.log('****',thingsToDoData["Hours(Min)"],"\n",thingsToDoData["Hours(Max)"])
                                                }
                                                _taskArr.push({
                                                    thingsToDo:thingsToDoData.Things_To_Do,
                                                    ownerShip:thingsToDoData.Ownership,
                                                });
                                                thingsCb();
                                            }
                                            
                                            
                                    },err=>{
                                        let _thingsToDo={
                                            thingsToDoData:_thingsToDoArr,
                                            lastRowData:_lastRowObj
                                        }  
                                        thingsCallback(null, resource, rdt, _thingsToDo)
                                    })
                                    }
                                }
                                );
                            },
                            function(resource, rdt, thingsToDo,dailyUpdatesCallback){
                                console.log('dailyUpdatesCallback');
                                let _dailyUpdatesArr=[];
                                let days=1,_week=[], hrsSpent=0, count=0, inProgressTask=[], completetedTask=[],startDate="",monthsHours=0,month="",monthArr=[];
                                xlsxtojson(
                                    {
                                    input: "pooja.xlsx",
                                    output: null, //since we don't need output.json
                                    sheet:"Daily Updates "
                                    },
                                    function(err, result) {
                                    if (err) {
                                        console.log("err in 2nd", err);
                                        // return res.json({ error_code: 1, err_desc: err, data: null });
                                    } else {
                                        async.forEachSeries(result,(updatesData, updatesCb)=>{
                                            if( days%7>0 && days%7<=1 ){ startDate=updatesData.Dates}
                                        if(updatesData.Things_To_Do){
                                            // console.log('Things_To_Do ----->', updatesData.Things_To_Do);

                                        //************ weeks total hrs count    
                                        let weekValue=Math.ceil(days/7);
                                        hrsSpent+=parseInt(updatesData.Hours_Spent===""?0:updatesData.Hours_Spent);
                                        _week[weekValue-1]=hrsSpent; 
                                        // _week[weekValue-1]={ dateRange: startDate+"-"+updatesData.Dates,total: hrsSpent};
                                        days++;
                                        if(Math.ceil(days/7)>weekValue){
                                                hrsSpent=0;
                                            }
                                            if(updatesData.Add_a_State==="In Progress"){
                                                
                                                if ( inProgressTask.filter(e => e.things_To_Do === updatesData.Things_To_Do).length > 0) {
                                                    // console.log("available")
                                                }
                                                else{
                                                    //  console.log('in else ')
                                                    inProgressTask.push({
                                                        stage:updatesData.Stages,
                                                        things_To_Do:updatesData.Things_To_Do
                                                    });
                                                }
                                            }
                                            else if(updatesData.Add_a_State==="Completed"){
                                                if ( completetedTask.filter(e => e.things_To_Do === updatesData.Things_To_Do).length > 0) {
                                                    // console.log("available completetd")
                                                }
                                                else{
                                                    //  console.log('in else ')
                                                    completetedTask.push({
                                                        stage:updatesData.Stages,
                                                        things_To_Do:updatesData.Things_To_Do
                                                    });
                                                    if(inProgressTask.filter(e => e.things_To_Do === updatesData.Things_To_Do).length > 0){
                                                        inProgressTask.forEach((value,key)=>{ 
                                                            if(value.things_To_Do===updatesData.Things_To_Do){ 
                                                                inProgressTask.splice(key,1) } 
                                                                })
                                                            }
                                                }
                                                
                                            }
                                            let _obj={
                                                date:updatesData.Dates,
                                                thingsToDo:updatesData.Things_To_Do,
                                                stages:updatesData.Stages,
                                                addAState:updatesData.Add_a_State,
                                                addATag:updatesData.Add_a_Tag,
                                                addAnotherTag:updatesData.Add_another_Tag,
                                                link:updatesData.Deliverable_Link,
                                                overallStatus:updatesData.Overall_Status,
                                                comment:updatesData["Comments(if_any)"],
                                                hoursSpent:updatesData.Hours_Spent,
                                            }
                                            _dailyUpdatesArr.push(_obj);
                                            updatesCb();
                                        }
                                        else{
                                            // console.log('Things_To_Do ----->', updatesData.Things_To_Do);
                                            updatesCb(true);
                                        }
                                        },err=>{
                                            
                                            let _result={
                                                weeks:_week,
                                                // monthsTotalHours:monthArr,
                                                inProgress:inProgressTask,
                                                completeted:completetedTask,
                                                dailyData:_dailyUpdatesArr
                                            }
                                            dailyUpdatesCallback(null, resource, rdt, thingsToDo, _result);
                                        })
                                    }
                                    }
                                );
                            },
                            function (resource, rdt, thingsToDo, dailyUpdates , afterDeleteCallback){
                                try {
                                    fs.unlinkSync("pooja.xlsx");
                                    afterDeleteCallback(null,resource, rdt, thingsToDo, dailyUpdates)
                                } catch (e) {
                                    //error deleting the file
                                    console.log("in catch", e);
                                }
                            },
                            ], function (err, resource, rdt, thingsToDo, dailyUpdates) {
                            // result now equals 'done'
                            readExcelSheetObj = {
                                aboutPc:aboutPc,
                                rdt:rdt,
                                resource:resource,
                                thingsToDo:thingsToDo,
                                dailyUpdates:dailyUpdates,
                            }
                            sheetCallback(null, readExcelSheetObj) 
                        });
                        }
                    else{
                        console.log('m in file not ready');
                        try {
                            fs.unlinkSync("pooja.xlsx");
                            // afterDeleteCallback(null,resource, rdt, thingsToDo, dailyUpdates)
                        } catch (e) {
                            //error deleting the file
                            console.log("in catch");
                        }
                        sheetCallback(null,[]) 
                    }
            }
            else{
                console.log("aboutPcWorkSheet else=====>", aboutPcWorkSheet);
                sheetCallback(true);
            }
                    
    });
                    
}


exports.readAllCellsValueOfExcelSheet1 = (activityStatus,paymentDate,ProductName, sheetCallback)=>{   
    var row, readExcelSheetObj={};
    workbook.xlsx.readFile("pooja.xlsx").then(function() {

                    //***************editing in About PC*****************
                    var aboutPcWorkSheet = workbook.getWorksheet('Project');
                    if(aboutPcWorkSheet){
                        // console.log("aboutPcWorkSheet=====>", aboutPcWorkSheet);
                        row= aboutPcWorkSheet.getRow(1);
                        let sheetStatus=(row.getCell(3).value).trim();
                        row = aboutPcWorkSheet.getRow(5);
                        let startDate = row.getCell(3).value;
                        row = aboutPcWorkSheet.getRow(6);
                        let endDate = row.getCell(3).value;
                        var aboutPc = {
                            sheetStatus:sheetStatus,
                            startDate:startDate,
                            endDate:endDate
                        }
                        // console.log('sheetStatus=====>',sheetStatus, "activityStatus======",activityStatus)
                        if((sheetStatus==="In Progress" || sheetStatus==="Completed") && sheetStatus!==activityStatus){
                        // console.log("condition satisfy")
                            async.waterfall([
                            function(rdtCallback){
                                let _rdtArr=[];
                                xlsxtojson(
                                {
                                    input: "pooja.xlsx",
                                    output: null, //since we don't need output.json
                                    sheet:"Right Design Team"
                                },
                                function(err, result) {
                                    // console.log('result',result)
                                    if (err) {
                                    console.log("err in 2nd", err);
                                    //   return res.json({ error_code: 1, err_desc: err, data: null });
                                    } else {
                                    //   console.log('result',result);
                                    async.forEachSeries(result,(rdtData, rdtCb)=>{
                                        // console.log('rdtData-------->', rdtData);
                                        if(rdtData.Role){
                                            let _obj={
                                                name:rdtData.Name,
                                                role:rdtData.Role,
                                                email:rdtData.Email,
                                                phone:rdtData.Phone,
                                                availabel:rdtData.Available,
                                                notAvailable:rdtData.Not_Available,
                                                anyThingElse:rdtData.Anything_Else,
                                            }
                                            _rdtArr.push(_obj);
                                            rdtCb();
                                        }
                                        else{
                                            rdtCb();
                                        }
                                    },err=>{
                                        rdtCallback(null,_rdtArr);
                                    })
                                    }
                                }
                                );
                            },
                            function(rdt, resourceCallback){
                                let resourceArr=[];
                                xlsxtojson(
                                {
                                    input: "pooja.xlsx",
                                    output: null, //since we don't need output.json
                                    sheet:"Resources"
                                },
                                function(err, result) {
                                    // console.log('result',result)
                                    if (err) {
                                    console.log("err in 2nd", err);
                                    //   return res.json({ error_code: 1, err_desc: err, data: null });
                                    } else {
                                        
                                    async.forEachSeries(result,(resourcesData, resCb)=>{
                                        if(resourcesData.Link){
                                            let _obj={
                                                name:resourcesData.Name,
                                                purpose:resourcesData.Purpose,
                                                link:resourcesData.Link,
                                            }
                                            resourceArr.push(_obj);
                                            resCb();
                                        }
                                        else{
                                            resCb();
                                        }
                                    },err=>{
                                        resourceCallback(null, resourceArr, rdt)
                                    })
                                    }
                                }
                                );
                            },
                            function(resource,rdt,thingsCallback){
                                let _thingsToDoArr=[];
                                xlsxtojson(
                                {
                                    input: "pooja.xlsx",
                                    output: null, //since we don't need output.json
                                    sheet:"Things To Do"
                                },
                                function(err, result) {
                                    if (err) {
                                    console.log("err in 2nd", err);
                                    //   return res.json({ error_code: 1, err_desc: err, data: null });
                                    } else {
                                        let _toDoObj={},_taskArr=[],_lastRowObj={} ;
                                    async.forEachSeries(result,(thingsToDoData, thingsCb)=>{
                                            if(thingsToDoData.Stages){
                                                if(_toDoObj && _taskArr.length!==0){
                                                    let _obj={
                                                        stages:_toDoObj.stages,
                                                        minHours:_toDoObj.minHours,
                                                        maxHours:_toDoObj.maxHours,
                                                        endDates:_toDoObj.date,
                                                        stageStatus:_toDoObj.addStatus,
                                                        tasks1:_taskArr
                                                    }
                                                    _thingsToDoArr.push(_obj);
                                                }
                                                _taskArr=[],_toDoObj={};
                                                _toDoObj.stages=thingsToDoData.Stages,
                                                _toDoObj.minHours=(thingsToDoData["Hours(Min)"].trim()!==""?parseInt(thingsToDoData["Hours(Min)"].trim()):0),
                                                _toDoObj.maxHours=(thingsToDoData["Hours(Max)"].trim()!==""?parseInt(thingsToDoData["Hours(Max)"].trim()):0),
                                                _toDoObj.date=thingsToDoData.Timeline,
                                                _toDoObj.addStatus=thingsToDoData.Stage_Status,
                                                _taskArr.push({
                                                    thingsToDo:thingsToDoData.Things_To_Do,
                                                    ownerShip:thingsToDoData.Ownership,
                                                })
                                            }
                                            else{
                                                if(!thingsToDoData.Things_To_Do && thingsToDoData["Hours(Min)"] && thingsToDoData["Hours(Max)"]){
                                                    // _lastRowObj.totalMinHours=parseInt(thingsToDoData["Hours(Min)"]);
                                                    _lastRowObj.totalMinHours=(thingsToDoData["Hours(Min)"].trim()!==""?parseInt(thingsToDoData["Hours(Min)"].trim()):0),
                                                    
                                                    // _lastRowObj.totalMaxHours=parseInt(thingsToDoData["Hours(Max)"]);
                                                    _lastRowObj.totalMaxHours=(thingsToDoData["Hours(Max)"].trim()!==""?parseInt(thingsToDoData["Hours(Max)"].trim()):0);
                                                    _lastRowObj.endDate=thingsToDoData.Dates
                                                //    console.log('****',thingsToDoData["Hours(Min)"],"\n",thingsToDoData["Hours(Max)"])
                                                }
                                                _taskArr.push({
                                                    thingsToDo:thingsToDoData.Things_To_Do,
                                                    ownerShip:thingsToDoData.Ownership,
                                                })
                                            }
                                            
                                            thingsCb();
                                    },err=>{
                                        let _thingsToDo={
                                            thingsToDoData:_thingsToDoArr,
                                            lastRowData:_lastRowObj
                                        }  
                                        thingsCallback(null, resource, rdt, _thingsToDo)
                                    })
                                    }
                                }
                                );
                            },
                            function(resource, rdt, thingsToDo,dailyUpdatesCallback){
                                console.log('dailyUpdatesCallback ', ProductName)
                                let _dailyUpdatesArr=[];
                                // let days=1,_week=[], hrsSpent=0, count=0, inProgressTask=[], completetedTask=[],startDate="",monthsHours=0,month="",monthArr=[];
                                xlsxtojson(
                                    {
                                    input: "pooja.xlsx",
                                    output: null, //since we don't need output.json
                                    sheet:"Daily Updates "
                                    },
                                    function(err, result) {
                                    if (err) {
                                        console.log("err in 2nd", err);
                                        // return res.json({ error_code: 1, err_desc: err, data: null });
                                    } else {
                                        let tempDate = '', count=0, weeks=[], hoursSpent=0.0, i=0, flag=true;
                                        let startDate = moment(new Date(paymentDate)).tz('Asia/Kolkata').format('MM/DD/YYYY');
                                        
                                        var nextTemp = moment(startDate, "MM/DD/YYYY").add('days', 7);
                                        var nextDate = nextTemp.format('MM')+'/'+nextTemp.format('DD')+'/'+nextTemp.format('YYYY');

                                        // console.log('startDate = ', startDate, ' nextDate = ', nextDate, ' payment date = ', paymentDate)
                                        
                                        async.forEachSeries(result,(updatesData, updatesCb)=>{
                                            // if( days%7>0 && days%7<=1 ){ startDate=updatesData.Dates}
                                        if(updatesData.Things_To_Do && updatesData.Hours_Spent){
                                            let sheet_date = moment(new Date(updatesData.Dates)).tz('Asia/Kolkata').format('MM/DD/YYYY');
                                            console.log(ProductName, ' sheet Data = ', sheet_date,nextDate,nextDate>sheet_date, aboutPc)
                                            // if(nextDate>sheet_date){
                                            //     // console.log('updatesData date ------->',nextDate,' ==  ', sheet_date);
                                            //     hoursSpent = hoursSpent + parseFloat(updatesData.Hours_Spent);
                                            // }
                                            // else{
                                            //     weeks.push(hoursSpent);
                                            //     hoursSpent=0;
                                            //     hoursSpent = updatesData.Hours_Spent===undefined?0:parseFloat(updatesData.Hours_Spent);
                                            //     let temp = moment(nextDate, "MM/DD/YYYY").add('days', 7);
                                            //     nextDate = temp.format('MM')+'/'+temp.format('DD')+'/'+temp.format('YYYY');
                                            // }
                                            while(flag){
                                                console.log('flag = ', flag)
                                                if(startDate<sheet_date && nextDate<sheet_date){
                                                  weeks.push(hoursSpent);
                                                  hoursSpent=0.0;
                                                  startDate = nextDate;
                                                  nextDate = moment(startDate, "MM/DD/YYYY").add(7, "days").format("MM/DD/YYYY");
                                                }
                                                else{
                                                  if (nextDate > sheet_date) {
                                                      hoursSpent = hoursSpent + parseFloat(updatesData.Hours_Spent);
                                                  } else{
                                                    console.log('greater time')
                                                    weeks.push(hoursSpent);
                                                    hoursSpent=0;
                                                    hoursSpent = updatesData.Hours_Spent===undefined?0:parseFloat(updatesData.Hours_Spent);
                                                    nextDate = moment(nextDate, "MM/DD/YYYY").add(7, "days").format("MM/DD/YYYY");
                                                  }
                                                    let _obj={
                                                        date:updatesData.Dates,
                                                        thingsToDo:updatesData.Things_To_Do,
                                                        stages:updatesData.Stages,
                                                        addAState:updatesData.Add_a_State,
                                                        addATag:updatesData.Add_a_Tag,
                                                        addAnotherTag:updatesData.Add_another_Tag,
                                                        link:updatesData.Deliverable_Link,
                                                        overallStatus:updatesData.Overall_Status,
                                                        comment:updatesData["Comments(if_any)"],
                                                        hoursSpent:updatesData.Hours_Spent,
                                                    }
                                                    _dailyUpdatesArr.push(_obj);
                                                    updatesCb();
                                                }
                                              }
                                        }
                                        else{
                                            updatesCb();
                                        }
                                        },err=>{
                                            weeks.push(hoursSpent)
                                            console.log('weeks ---->', weeks);
                                            flag=false;
                                            let _result={
                                                weeks:weeks,
                                                dailyData:_dailyUpdatesArr
                                            }
                                            dailyUpdatesCallback(null, resource, rdt, thingsToDo, _result);
                                        })
                                    }
                                    }
                                );
                            },
                            function (resource, rdt, thingsToDo, dailyUpdates , afterDeleteCallback){
                                try {
                                    fs.unlinkSync("pooja.xlsx");
                                    afterDeleteCallback(null,resource, rdt, thingsToDo, dailyUpdates)
                                } catch (e) {
                                    //error deleting the file
                                    console.log("in catch");
                                }
                            },
                            ], function (err, resource, rdt, thingsToDo, dailyUpdates) {
                            // result now equals 'done'
                            readExcelSheetObj = {
                                aboutPc:aboutPc,
                                rdt:rdt,
                                resource:resource,
                                thingsToDo:thingsToDo,
                                dailyUpdates:dailyUpdates,
                            }
                            sheetCallback(null, readExcelSheetObj) 
                        });
                        }
                    else{
                        console.log('m in file not ready');
                        try {
                            fs.unlinkSync("pooja.xlsx");
                            // afterDeleteCallback(null,resource, rdt, thingsToDo, dailyUpdates)
                        } catch (e) {
                            //error deleting the file
                            console.log("in catch");
                        }
                        sheetCallback(null,[]) 
                    }
            }
            else{
                console.log("aboutPcWorkSheet else=====>", aboutPcWorkSheet);
                sheetCallback(true);
            }
                    
    });
                    
}

exports.createSetOfChannels = (data, token, callback) => {
    // console.log("createSetOfChannels======>", data.display_name)
    const options = {
        method: 'POST',
        uri: env.base_path + 'api/v3/teams/' + data.teamId + '/channels/create',
        json: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: {
            "name": data.name,
            "display_name": data.display_name,
            "type": data.type
        },

        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            // console.log("test123")
            callback(null, response)
        })
        .catch(function (err) {
              console.log("test234",err)
            callback(err)
        })
}

exports.addUserinDifferentChannels= (data, token, callback) => {
    async.forEachSeries(data.userData, function (item, cb) {
        const options = {
            method: 'POST',
            uri: env.base_path + 'api/v3/teams/' + data.teamId + '/channels/' + data.channelId + '/add',
            json: true,
            headers: {
                "Authorization": "Bearer " + token,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: {
                user_id: item.user_id
            },
        }
        request(options)
            .then(function (response) {
                console.log("addUserinDifferentChannels ",data.channelId)
                cb()
            })
            .catch(function (err) {
                console.log(item.user_id+" add in channel err=======>",err)
                cb(err)
                
            })
    },(err)=>{
        if(err){
            // conso1FmczydiWl7Kp036fuOcgqVzJKCNVaU3PN6mObUKR36Ele.log("err",err)
            console.log("err",err)
            callback(err)
        }else{
            callback(null,"success")
        }

    })
   
}

exports.getChannelIdByChannelName = (data, token, callback)=>{
    const options = {
        method: 'GET',
        uri: env.base_path + 'api/v4/teams/' + data.teamId + '/channels/name/'+data.channelName,
        json: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            // console.log("test123")
            callback(null, response)
        })
        .catch(function (err) {
              console.log("err in getChannelIdByChannelName", err)
            callback(err)
        })
}


exports.sendMailWithCC = (to,html, subject,from, callback) => {
    var client = nodemailer.createTransport('SMTP', {
        service: 'SendGrid',
        auth: {
            user: '1thing.design',
            //pass: 'innotical24x7'
            pass: 'Shepherd@1'
        }
    });
    var str=from.split('@');
    var name=str[0]
    name=capitalizeFirstLetter(name)
    var email = {
        from:name+' from 1THING' +'<'+from+'>',
        to: to,
        cc:'mimi@1thing.design,divanshu@1thing.design',
        // cc:'poojachauhanmyweb1311@gmail.com,shivali1310@gmail.com',
        subject:subject,
        html: html
    };
    client.sendMail(email, function (err, info) {
        if (err) {
            console.log(err);
        }
        else {
            console.log('Message sent: ' + info.response);
            callback(err,info)
        }
    });
}

exports.findUserIdByEmail = (email, token, callback)=>{
    const options = {
        method: 'GET',
        uri: env.base_path + 'api/v4/users/email/' + email,
        json: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        // JSON stringifies the body automatically
    }
    request(options)
        .then(function (response) {
            // console.log("test123")
            callback(null, response)
        })
        .catch(function (err) {
            //   console.log("err in findUserIdByEmail", err)
            callback(err)
    });
}

//convert milliseconds to hours
exports.convertsMilliToHours = (milliseconds)=>{
    if(milliseconds){
        // let hours = (milliseconds/3600000).toFixed(3);
        return (parseFloat(milliseconds/3600000)).toFixed(4)
    }
    else{
        return 0
    }
}

//get team members of a team
exports.getTeamMembers = (teamId, token, callback)=>{
    // console.log('In getTeamMembers ', teamId)
    const options = {
        method:'GET',
        uri:env.base_path+'api/v4/teams/'+teamId+"/members",
        json:true,
        headers:{
            "Authorization": "Bearer " + token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }
    request(options)
        .then(function(response){
            // console.log('response = ', response)
            callback(null, response);
        })
        .catch(function(err){
            console.log('err in getTeamMembers', err);
            callback(err);
        });
}   



