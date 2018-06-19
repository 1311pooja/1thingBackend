const winston = require('winston');
var express = require('express');
var app = express();
const type = app.get('env')==='production';
var transport = type?new (winston.transports.File)({ filename: 'payment.log' }):
                     new (winston.transports.Console)()
const logger = new (winston.Logger)({
    level: 'info',
    transports: [
      //
      // - Write to all logs with level `info` and below to `combined.log` 
      // - Write all logs error (and below) to `error.log`.
      //
     //   new winston.transports.File({ filename: 'error.log', level: 'error' }),
    //   new (winston.transports.File)({ filename: 'payment.log' })
    transport
    ]
  });
  var transport1 = new (winston.transports.File)({ filename: 'addOns.log' });
  const logger1 = new (winston.Logger)({
    level: 'info',
    transports: [
      //
      // - Write to all logs with level `info` and below to `combined.log` 
      // - Write all logs error (and below) to `error.log`.
      //
     //   new winston.transports.File({ filename: 'error.log', level: 'error' }),
    //   new (winston.transports.File)({ filename: 'payment.log' })
    transport1
    ]
  });
  module.exports = {
    logger:logger,
    logger1:logger1
  };
