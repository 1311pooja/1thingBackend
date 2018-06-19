var express = require('express');
var mongoose = require('mongoose');
var async = require('async');
var app = express();
var path=require('path')
var bodyParser = require('body-parser');
var morgan = require('morgan');
var Routes = express.Router();
var cors = require('cors');
var config = require('./config');
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
var ejs = require("ejs");
var logger = require("./utils/logger");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
var cookieParser = require('cookie-parser');
app.use(cookieParser());
// set a cookie
const moment = require('moment-timezone');

app.use(morgan('dev'));
app.use(cors());
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.send("Welcome to 1Thing project ");
});


//Require config for development environment
if ('local' == app.get('env')) {
    console.log("local phase");
    mongoose.connect(config.db.uri);
} else if ('development' == app.get('env')) {
    console.log("development");
    mongoose.connect(config.db.uri);
} else if ('production' == app.get('env')) {
    console.log("production", app.get('env'));
    mongoose.connect(config.prodDb.uri);
}

var index = require('./routes/index.js')(app);
var webSocket = require('./webSocket.js');




app.listen(port); 
console.log('Magic happens at http://localhost:' + port);
logger.logger.log("info","testing serverjs");


//const request = require('request')

// const options = {  
//     url: 'http://1thing.sia.co.in/project/getproject/59802e5715523c055c92a3c0',
//     method: 'GET',
//     headers: {
//         'Accept': 'application/json',
//         'Accept-Charset': 'utf-8',
//        // 'Authorization': 'Bearer iiesxufobtyhiqyhq156ernsjh'
//     }
// };

// request(options, function(err, res, body) {  
//     var data=JSON.parse(body)
// console.log("res",data.data.platform[0])

// });


//pm2 start process.json --env production
//const moment = require('moment-timezone');

console.log("ghf",moment().tz('Asia/Kolkata').format('LLLL'))

