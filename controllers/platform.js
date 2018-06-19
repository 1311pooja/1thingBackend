const PlatformModel=require('../models/platform');



var platformController={};

platformController.addPlatform=(req,res)=>{
    var platform=new PlatformModel({
           name:req.body.name    
    })
        platform.save((err,data)=>{
            if(err){
                res.json(500,{
                    err:err
                })
            }else{
                res.json(201,{
                    data:data
                })
            }
        })
}

module.exports = platformController;
