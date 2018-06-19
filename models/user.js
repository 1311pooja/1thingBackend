const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
const config = require('../config');
const jwt = require('jsonwebtoken');


/*** Model for the user collection.*
 *  It is used to perform any db operations on user collection*
 *  @module models/user*/

var Token = new Schema({
    token: String,
    tokenExpires: Date,
    flag: Boolean
})
var userSchema = new Schema({
    name: { type: String },
    email: { type: String, trim: true, required: true },
    Designation: { type: String },
    mobile: { type: String },
    linkedinProfile: { type: String },
    channelName: { type: String },
    channelId: { type: String },
    password: { type: String },
    userType: { type: String, default:"client" },
    userName: { type: String },
    location:{type:String},
    token: [Token],
    getEstimate: { type: Boolean },
    isActive: { type: Boolean, default: true },
    userId: { type: String },
    EmailSend: {
        day1: { type: Boolean, default: true },
        day2: Boolean,
        day3: Boolean,
        day4: Boolean,
        day5: Boolean,
        day6: Boolean,
        finish: { type: Boolean, default: false }
    },
    longLatLocation:[],
    teamId:{type:String},
    teamName:{type:String},
    newUser:{type:Boolean, default:false},
    nonSignupUser:{type:Boolean, default:true},
    droppedUser:{
        visitedDate:{type:String},
        updatedDate:{type:String},
        day:{type:Number},
    }
    
},
    {
        timestamps: { createdAt: 'createdAt', lastUpdated: 'lastUpdated' }
    });
userSchema.statics.encode = (data, callback) => {
    console.log("config.token.TOKEN_SECRET", config.token.TOKEN_SECRET)
    jwt.sign(data, config.token.TOKEN_SECRET, { expiresIn: config.token.EXPIRY }, function (err, data) {
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
userSchema.statics.decode = (token) => {
    try {
        var decoded = jwt.verify(token, config.token.TOKEN_SECRET);
        return decoded;
    } catch (err) {
        return false;
    }
}

/**
 * generate hash password
 */
userSchema.methods.generateHash = (password) => {
    console.log("passsword", password)
    return bcrypt.hashSync(password, bcrypt.genSaltSync(9));
}
/**
 * compare hash password
 */
userSchema.methods.comparePassword = function (passwordToCompare, callback) {
    console.log("bhjjhfhjdef", this.password)
    bcrypt.compare(passwordToCompare, this.password, function (err, isMatch) {
        if (err) {
            return callback(err);
        }
        callback(null, isMatch);
    });
};
userSchema.index({ email: 'text', name: 'text' });


module.exports = mongoose.model('User', userSchema);