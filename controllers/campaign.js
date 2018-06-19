const CampaignModel=require('../models/campaign');



var campaignController={};

campaignController.addCampaign=(req,res)=>{
    let email=req.body.email.toLowerCase();
    CampaignModel.findOne({email:email},(err,data)=>{
        if(err){
            res.json(500,err)
        }else if(data){
            res.json(400,"already exist")
        }else{
            var campaign=new CampaignModel(req.body)
            campaign.email=email
            campaign.save((err,data)=>{
                    if(err){
                        res.json(500,{
                            err:err
                        })
                    }else{
                        res.json(201,'ok')
                    }
                })
        }
    })

    
}



module.exports = campaignController;
