const mongoose  = require('mongoose');
const Schema = mongoose.Schema;

var careersSchema = new Schema({
    email:{type:String},
    name:{type:String},
    profileLink:{type:String},
    coverLetter:{type:String},
},{
    timestamps:{ createdAt:'createdAt', lastUpdated:'lastUpdated' }
});

module.exports = mongoose.model('careers',careersSchema)