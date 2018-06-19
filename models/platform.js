const mongoose = require('mongoose');
const Schema = mongoose.Schema;


var platformSchema = new Schema({
    name:{type:String,trim:true},
    isActive:{type:Boolean,default:true}
   
},
    {
        timestamps: { createdAt: 'createdAt', lastUpdated: 'lastUpdated' }
    });



    module.exports = mongoose.model('platform', platformSchema);