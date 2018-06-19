var express = require('express');
var app = express();




var RESET_TOKEN_IN_HOURS = 6;



module.exports =
	{
		token: {
			TOKEN_SECRET_A: process.env.TOKEN_SECRET_A || 'mybestsoftwares',
			TOKEN_SECRET: process.env.TOKEN_SECRET || 'mybestinnotical',
			EXPIRY: process.env.EXPIRY || 86400,
			Admin_EXPIRY: process.env.Admin_EXPIRY || 3600
		},
		server: {
			timezone: process.env.TZ || 'Asia/Kolkata'
		},
		login: {
			passwordResetTimeLimitInMinutes: process.env.PASSWORD_RESET_TIME_LIMIT_IN_HOURS || 30,
			otpExpiresTime: process.env.otpExpiresTime || 15
		},
		db: {
			uri: process.env.MONGODB_URI || 'mongodb://localhost/1thingProduction',
			// uri: process.env.MONGODB_URI || 'mongodb://localhost:4321/1thingProduction',
			//	'mongodb://localhost:4322/naytr',
		},
		prodDb: {
			uri: process.env.MONGODB_URI || 'mongodb://localhost/1thingProduction',
			//	'mongodb://localhost:4322/naytr',
		},


	};
