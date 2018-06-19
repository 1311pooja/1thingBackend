const mongoose = require('mongoose');
const Schema = mongoose.Schema;


var campaignSchema = new Schema({
    name:{type:String,trim:true},
    email:{type:String,trim:true},
    userName:{type:String},
    password:{type:String},
    linkedin:{type:String,trim:true},
    alreadyExist:{type:Boolean,default:false},
    invite:{
      name:{type:String},
      email:{type:String}
    },
    userId:{type:String},
    isActive:{type:Boolean,default:true}
   
},
    {
        timestamps: { createdAt: 'createdAt', lastUpdated: 'lastUpdated' }
    });



    module.exports = mongoose.model('AMACampaign', campaignSchema);