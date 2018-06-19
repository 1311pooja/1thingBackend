const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
const config = require('../config');
const jwt = require('jsonwebtoken');


/*** Model for the user collection.*
 *  It is used to perform any db operations on user collection*
 *  @module models/customer*/

var adminSchema = new Schema({
    email: { type: String, required: true},
    name:{type:String,required:false},
    password:{type:String,required:false},
    userType:{type:String,required:false, default:'admin'},
    isActive:{type:Boolean,required:false,default:true},
    userId:{ type: String, required: true},
},
    {
        timestamps: { createdAt: 'createdAt', lastUpdated: 'lastUpdated' }
    });


/**
 * method for create user access token
 * with expires limit
 */
adminSchema.statics.encode = (data, callback) => {
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
adminSchema.statics.decode = (token) => {
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
adminSchema.methods.generateHash = (password) => {
    console.log("passsword", password)
    return bcrypt.hashSync(password, bcrypt.genSaltSync(9));
}
/**
 * compare hash password
 */
adminSchema.methods.comparePassword = function (passwordToCompare, callback) {
    console.log("bhjjhfhjdef", this.password)
    bcrypt.compare(passwordToCompare, this.password, function (err, isMatch) {
        if (err) {
            return callback(err);
        }

        callback(null, isMatch);
    });
};

module.exports = mongoose.model('Admin', adminSchema);