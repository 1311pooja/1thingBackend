const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var projectPayment = new Schema({
    transactionId:{type:String, require:true},
    subscriptionId:{type:String, require:true, default:''},
    customerId:{type:String,default:''},
    paymentSignature:{type:String, require:true},
    period:{type:String, default:""},
    interval:{type:Number, require:true},
    subscriptionCount:{type:Number, require:true},
    paidCount:{type:Number, require:true,default:0},
    amount:{type:Number,default:0},
    unitAmount:{type:Number},
    unitHours:{type:Number, default:0},
    paidHours:[],
    workingHours:[],
    addonHours:[],
    discount:{type:Boolean},
    discountType:{type:String},
    nextDewDate:{type:String, require:true, default:''},
    projectId:{type:String,require:true},
    user:{
        userId:{type:String, require:true},
        name:{type:String, require:true},
    },
    subscriptionStatus:{type:String, default:''},
    paymentStatus:{type:String, default:''},
    renewalDate:{type:String},
    paymentDate:{type:String},
}, {
        timestamps: { createdAt: 'createdAt', lastUpdated: 'lastUpdated' }
});

module.exports = mongoose.model('payment', projectPayment);