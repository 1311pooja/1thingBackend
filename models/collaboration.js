const mongoose = require('mongoose');
const Schema =  mongoose.Schema;

var collaborationSchema = new Schema({
    name:{type:String},
    email:{type:String},
    link:{type:String},
    aboutYou:{type:String},
},{
    timestamps : { createdAt : "createdAt", lastUpdated : "lastUpdated"}
})
module.exports = mongoose.model('collaboration',collaborationSchema);