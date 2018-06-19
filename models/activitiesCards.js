const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var activitiesCardSchema = new Schema({
    name:{type:String},
    fileName:{type:String},
    deliverables:[],
    team:[],
    approxDesignHours:{type:String},
    approxTimeline:{type:String},
    bigTitles:{type:String},
    stages:[],
    bannerURL:{type:String},
    iconURL:{type:String},
    colorCode:{type:String}
    
},{
    timestamps:{createdAt:'createdAt', lastUpdated:'lastUpdated'}
});

module.exports = mongoose.model('activitiesCard',activitiesCardSchema);