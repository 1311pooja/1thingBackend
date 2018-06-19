const mongoose = require('mongoose');
const Schema = mongoose.Schema;


var milestoneSchema = new Schema({
    projectId:{type:String},
    title:{type:String,trim:true},
    startDate:{type:Date},
    endDate:{type:Date},
    start:{type:Boolean},
    isActive:{type:Boolean,default:true}
   
},
    {
        timestamps: { createdAt: 'createdAt', lastUpdated: 'lastUpdated' }
    });



    module.exports = mongoose.model('milestone', milestoneSchema);