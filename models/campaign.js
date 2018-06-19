const mongoose = require('mongoose');
const Schema = mongoose.Schema;


var campaignSchema = new Schema({
    name:{type:String,trim:true},
    email:{type:String,trim:true},
    mobile:{type:String,trim:true},
    appLink:{type:String,trim:true},
    category:{type:String},
    isActive:{type:Boolean,default:true}
   
},
    {
        timestamps: { createdAt: 'createdAt', lastUpdated: 'lastUpdated' }
    });



    module.exports = mongoose.model('campaign', campaignSchema);