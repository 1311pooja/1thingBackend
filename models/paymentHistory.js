const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var paymentHistory = new Schema({
    subscriptionId:{type:String},
    transactionId:{type:String},
    projectId:{type:String},
    orderId:{type:String},
    invoiceId:{type:String},
    customerId:{type:String},
    subscriptionStatus:{type:String},
    paymentStatus:{type:String},
    user:{
        userId:{type:String},
        name:{type:String},
    },
    subscriptionCount:{type:Number},
    paidCount:{type:Number},
    amount:{type:Number,default:0},
    paymentFailedObj:[],
    subscriptionPendingObj:[],
    subscriptionHaltedObj : [],
    subscriptionCancelledObj:[]
}, {
        timestamps: { createdAt: 'createdAt', lastUpdated: 'lastUpdated' }
});

module.exports = mongoose.model('paymenthistory', paymentHistory);