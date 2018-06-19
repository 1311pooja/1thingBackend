const mongoose = require('mongoose');
const Schema = mongoose.Schema;


var subscriberSchema = new Schema({
    name:{type:String},
    email:{type:String,required:true,trim:true},
    isActive:{type:Boolean,default:true},
    userType:{type:String},
    isEmail:{type:Boolean,default:false}
},
    {
        timestamps: { createdAt: 'createdAt', lastUpdated: 'lastUpdated' }
    });



    module.exports = mongoose.model('subscriber', subscriberSchema);