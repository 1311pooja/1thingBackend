const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
const config = require('../config');
const jwt = require('jsonwebtoken');


/*** Model for the user collection.*
 *  It is used to perform any db operations on user collection*
 *  @module models/customer*/

var designerSchema = new Schema({
    email: { type: String, required: true, trim: true },
    name: { type: String, required: false },
    userName: { type: String },
    userId: { type: String },
    mobile: { type: String, required: false },
    channelName: { type: String },
    userType:{type:String,default:"designer"},
    channelId: { type: String },
    portfolio: [],
    password: { type: String, required: false },
    expertisePlatform: [],
    expertiseDomain: [{
        name: { type: String },
        info: { type: String }
    }],
    statusBar:{
        aboutYourself:{
         completed:{type:Boolean,default:false},
         completedDate:{type:String,default:""}
        },
        expertise:{
            completed:{type:Boolean,default:false},
            completedDate:{type:String,default:""}
        },
        perspective:{
            completed:{type:Boolean,default:false},
            completedDate:{type:String,default:""}
        },
        thinkAboutYourself:{
            completed:{type:Boolean,default:false},
            completedDate:{type:String,default:""}
        }
    },
    EmailSend: {
        day1: { type: Boolean, default: true },
        day2: Boolean,
        day3: Boolean,
        day4: Boolean,
        day5: Boolean,
        day6: Boolean,
        day7: Boolean,
        day8: Boolean,
        finish: { type: Boolean, default: false }
    },
    profile: [],
    linkedinProfile: { type: String },
    workExperience: { type: String },
    role: { type: String },
    hoursAvailable: { type: String },
    location: { type: String },
    myself: { type: String },
    work: {
        product1: { type: String },
        info1: { type: String },
        product2: { type: String },
        info2: { type: String },
        product3: { type: String },
        info3: { type: String }
    },
    rating: {
        design: { type: String },
        tools: { type: String },
        communication: { type: String },
        projectManagement: { type: String },
        workingWithTeam: { type: String },
        teamLead: { type: String },
    },
    workingPlace: { type: String },
    necessaryThing: {
        things: { type: String },
        selected: { type: String }
    },
    aboutUs: { type: String },
    about1thing: { type: String },

    //it specify which DL have longitude and altitude
    isLatLong:{type:Boolean, default:false},
    isStatic:{type:Boolean, default:false},
    profileInfo: {

        //pooja's code

        assignedProject:{type:Number,default:0},
        fb: { type: String ,default:""},
        linkedin: { type: String ,default:""},
        insta: { type: String ,default:""},
        pinterest: { type: String ,default:""},
        dribble: { type: String ,default:""},
        behance: { type: String ,default:""},
        twitter: { type: String ,default:""},
        skills:[],
        seniority:{type:String,default:""},
        compWorkWith:[],
        jobType:{type:String, default:""},
        experienceYear:{type:Number, default:0},
        productDesigned:[],
        newLocation:{
            type:[Number],
            index:"2dsphere"
        },
        domainName:[],
        productUrl:[],
        features:[],
        platformSpecialises:[],
        in1ThingTeam:{type:Boolean, default:false},
        hourlyRates:[],
        
        // pic: { type: String ,default:""},
        // bio: { type: String ,default:""},
        // portfolio: { type: String ,default:""},
        // medium:{ type: String ,default:""},
        
        // google:{ type: String ,default:""},
        // tumblr: { type: String ,default:""},
        // angel: { type: String ,default:""},
        // github:{ type: String ,default:""},
        // productHunt: { type: String ,default:""},

    },
    isActive: { type: Boolean, required: false, default: true },
    workingStatus:{type:String, default:"idle"}
},
    {
        timestamps: { createdAt: 'createdAt', lastUpdated: 'lastUpdated' }
    });

/**
 * method for create user access token
 * with expires limit
 */
designerSchema.statics.encode = (data, callback) => {
    console.log("config.token.TOKEN_SECRET", config.token.TOKEN_SECRET_A)
    jwt.sign(data, config.token.TOKEN_SECRET_A, { expiresIn: config.token.EXPIRY }, function (err, data) {
        console.log("err")
        console.log("data")
        console.log("data===========")
        if (err) {
            return callback(err)
        }
        callback(null, data)
    });
};
/**
 * feth user detail from access token
 * @check also token is valid or not
 */
designerSchema.statics.decode = (token) => {
    try {
        var decoded = jwt.verify(token, config.token.TOKEN_SECRET_A);
        return decoded;
    } catch (err) {
        return false;
    }
}
/**
 * generate hash password
 */
designerSchema.methods.generateHash = (password) => {
    console.log("passsword", password)
    return bcrypt.hashSync(password, bcrypt.genSaltSync(9));
}
/**
 * compare hash password
 */
designerSchema.methods.comparePassword = function (passwordToCompare, callback) {
    console.log("bhjjhfhjdef", this.password)
    bcrypt.compare(passwordToCompare, this.password, function (err, isMatch) {
        if (err) {
            return callback(err);
        }

        callback(null, isMatch);
    });
};

module.exports = mongoose.model('designer', designerSchema);