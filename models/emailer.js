const mongoose = require('mongoose');
const Schema = mongoose.Schema;


var emailerSchema = new Schema({
    email:{type:String,required:true,trim:true},
    userId:{type:String},
    isActive:{type:Boolean,default:true},
    userType:{type:String},
    name:{type:String},
    userName:{type:String},
    firstMail:{
        status:{type:Boolean,default:false},
        date:{type:String,default:""}
    },
    secondMail:{
        status:{type:Boolean,default:false},
        date:{type:String,default:""}
    },
    thirdMail:{
        status:{type:Boolean,default:false},
        date:{type:String,default:""}
    },
    fourthMail:{
        status:{type:Boolean,default:false},
        date:{type:String,default:""}
    },
    fifthMail:{
        status:{type:Boolean,default:false},
        date:{type:String,default:""}
    },
    sixthMail:{
        status:{type:Boolean,default:false},
        date:{type:String,default:""}
    },
    seventhMail:{
        status:{type:Boolean,default:false},
        date:{type:String,default:""}
    },
    eightMail:{
        status:{type:Boolean,default:false},
        date:{type:String,default:""}
    },
    finish:{
        status: { type: Boolean, default: false },
        date:{type:String,default:""}
    }
},
    {
        timestamps: { createdAt: 'createdAt', lastUpdated: 'lastUpdated' }
    });



    module.exports = mongoose.model('email', emailerSchema);