const CategoryModel=require('../models/category');



var categoryController={};

categoryController.addCategory=(req,res)=>{
    var category=new CategoryModel({
           name:req.body.name    
    })
        category.save((err,data)=>{
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

categoryController.getAllCategories=(req,res)=>{
   CategoryModel.find({isActive:true},(err,data)=>{
       if(err)
        res.json(500,err)
       else
        res.json(200,{
            data:data
        })
   }) 
}

module.exports = categoryController;
