var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var domainDetailsSchema = new Schema({
    // domainName:{type:String},
    // subDomains:[{
    //   subDomainName:{type:String},
    //   subSubDomains:[]
    // }],
    // projects:[],
    // memberType:[],

    domainName:{type:String},
    subDomains:[],
    projects:[],
    memberType:[],
  
},{ 
  timestamps: { createdAt: 'created_at', updatedAt:'lastUpdate'}
 });

module.exports= mongoose.model('domaindetails', domainDetailsSchema);
