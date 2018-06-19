const PaymentHistoryModel = require("../models/paymentHistory");
const paymentModel = require('../models/projectPayment');
const env = require("../utils/env");
const async = require("async");
const utility = require("../utils/utility");
// var express = require('express');
// var app = express();
const logger1 = require("../utils/logger");
const moment = require('moment-timezone');


var paymentHistoryController = {};
const logger = logger1.logger;

paymentHistoryController.getPaymentsByWebhook = (req, res)=>{
    logger.log("info",'event -------->',req.body, new Date().toString());
    console.log('webhook called',new Date().toString())
    var _sC={}, _payment={}, _obj={}, nextChargeDate;
    if(req.body){
        switch(req.body.event){
            case 'subscription.charged':
                    logger.log("info",'subscription.charged method');
                    logger.log("info","subscription", req.body.payload.subscription.entity);
                    logger.log("info","payment", req.body.payload.payment.entity);
                     _sC = req.body.payload.subscription.entity;
                     _payment = req.body.payload.payment.entity;
                    
                    paymentModel.findOne({subscriptionId:_sC.id},(err, paymentData)=>{
                        if(err){
                            logger.log("info",'err in payment', err);
                            res.status(203).send({msg:"Ok"});
                        }
                        else if(paymentData){
                            if(_sC.paid_count ===1){
                                logger.log("info",'count 1 ', _sC.customer_id)
                                paymentData.customerId=_sC.customer_id;
                                paymentData.subscriptionStatus=_sC.status;
                                paymentData.paymentStatus=_payment.status;
                            }
                            else{
                                logger.log("info",'count else', _sC.customer_id);
                                console.log('in else ')
                                if(paymentData.period==='weekly'){
                                    //salman 
                                    let startDate = moment(paymentData.nextDewDate).tz('Asia/Kolkata').format('MM/DD/YYYY');
                                    nextChargeDate = moment(startDate, "MM/DD/YYYY").add('days', 7).format('MM/DD/YYYY');
                                }
                                // monthly yearly nextDewDate

                                paymentData.paidCount=_sC.paid_count;
                                paymentData.subscriptionStatus=_sC.status;
                                paymentData.paymentStatus=_payment.status;
                                paymentData.paidHours=paymentData.addonHours;
                                //salman
                                paymentData.nextDewDate=nextChargeDate;
                                paymentData.customerId=_sC.customer_id;

                                //calculation here
                            }
                            paymentData.save((err, savePayment)=>{
                                if(err){
                                    logger.log("info",'err in payment', err);
                                    res.status(203).send({msg:"Ok"});
                                }
                                else if(savePayment){
                                    logger.log("info",'in payment save in subscription charged')
                                    _obj={};
                                     _obj = {
                                        subscriptionId:_sC.id,
                                        transactionId:_payment.id,
                                        projectId:savePayment.projectId,
                                        orderId:_payment.order_id,
                                        invoiceId:_payment.invoice_id,
                                        customerId:_sC.customer_id,
                                        subscriptionStatus:_sC.status,
                                        paymentStatus:_payment.status,
                                        user:{
                                            userId:savePayment.user.userId,
                                            name:savePayment.user.name,
                                        },
                                        subscriptionCount:_sC.total_count,
                                        paidCount:_sC.paid_count,
                                        amount:_payment.amount/100,
                                    }
                                    let historyPayment = new PaymentHistoryModel(_obj);
                                    historyPayment.save((err, historyPayment)=>{
                                        if(err){
                                            logger.log("info",'err in payment', err);
                                            res.status(203).send({msg:"Ok"});
                                        }
                                        else if(historyPayment){
                                            logger.log("info",'historyPayment');
                                            res.status(200).send({msg:"Save data!"});
                                        }
                                    })

                                }
                            })
                        }
                        else{
                            let notFindObj={
                                customerId:_sC.customer_id,
                                subscriptionStatus:_sC.status,
                                paymentStatus:_payment.status
                            }
                            let paymentCreateObj = new paymentModel(notFindObj);
                            paymentCreateObj.save((err, data)=>{
                                if(err){
                                    res.status(203).send({msg:"Ok"});                                            
                                }
                                else{
                                    _obj={};
                                     _obj = {
                                        subscriptionId:_sC.id,
                                        transactionId:_payment.id,
                                        // projectId:savePayment.projectId,
                                        orderId:_payment.order_id,
                                        invoiceId:_payment.invoice_id,
                                        customerId:_sC.customer_id,
                                        subscriptionStatus:_sC.status,
                                        paymentStatus:_payment.status,
                                        // user:{
                                        //     userId:savePayment.user.userId,
                                        //     name:savePayment.user.name,
                                        // },
                                        subscriptionCount:_sC.total_count,
                                        paidCount:_sC.paid_count,
                                        amount:_payment.amount/100,
                                    }
                                    let historyPayment = new PaymentHistoryModel(_obj);
                                    historyPayment.save((err, historyPayment)=>{
                                        if(err){
                                            logger.log("info",'err in payment', err);
                                            res.status(203).send({msg:"Ok"});
                                        }
                                        else if(historyPayment){
                                            logger.log("info",'historyPayment');
                                            res.status(200).send({msg:"Save data!"});
                                        }
                                    })
                                }
                            })
                        }
                    })
                    
                    break;
            case 'subscription.completed':
                        logger.log("info",'subscription.completed method');
                        logger.log("info","subscription", req.body.payload.subscription.entity);
                         _sC = req.body.payload.subscription.entity;
                        _obj = {};
                        _obj.paidCount=_sC.paid_count
                        _obj.subscriptionStatus=_sC.status;
                        paymentModel.findOneAndUpdate(
                                {subscriptionId:_sC.id},
                                {$set:_obj},
                                {new:true},(err, savePayment)=>{
                                if(err){
                                    logger.log("info",'err in payment', err);
                                    res.status(203).send({msg:"Ok"});
                                }
                                else if(savePayment){
                                    _obj={};
                                     _obj = {
                                        subscriptionId:_sC.id,
                                        transactionId:_payment.id,
                                        projectId:savePayment.projectId,
                                        orderId:_payment.order_id,
                                        invoiceId:_payment.invoice_id,
                                        customerId:_sC.customer_id,
                                        subscriptionStatus:_sC.status,
                                        paymentStatus:_payment.status,
                                        user:{
                                            userId:savePayment.user.userId,
                                            name:savePayment.user.name,
                                        },
                                        subscriptionCount:_sC.total_count,
                                        paidCount:_sC.paid_count,
                                        amount:_payment.amount/100,
                                    }
                                    let historyPayment = new PaymentHistoryModel(_obj);
                                    historyPayment.save((err, historyPayment)=>{
                                        if(err){
                                            logger.log("info",'err in payment', err);
                                            res.json(500,{
                                                statusCode:500,
                                                err:err
                                            });
                                        }
                                        else if(historyPayment){
                                            logger.log("info",'historyPayment');
                                            res.json(200,{
                                                statusCode:200,
                                                msg:'subscription completed'
                                            });
                                        }
                                    })


                                }
                                else{
                                    res.status(203).send({msg:"Ok"});
                                }
                            })
                        break;   
            case 'payment.failed':
                        logger.log("info","payment.failed , ", req.body.payload.payment.entity);
                        let arr = [];
                        arr.push(req.body.payload.payment.entity);
                        let obj = {
                            paymentFailedObj:arr,
                        }
                        historyPayment = new PaymentHistoryModel(obj);
                        historyPayment.save((err, saveData)=>{
                            if(err){
                                logger.log("info",'err in payment failed', err);
                                res.status(203).send({msg:"Ok"});
                            }
                            else{
                                res.status(200).send({msg:"payment faild!"});
                            }
                        })
                        
                        break;
            case 'subscription.pending':
                        logger.log("info",'subscription.pending method');
                        logger.log("info","subscription.pending ", req.body.payload.subscription.entity);
                         _sC = req.body.payload.subscription.entity;
                        paymentModel.findOne({subscriptionId:_sC.id},(err, paymentData)=>{
                            if(err){
                                logger.log("info",'err in payment db', err);
                                res.status(203).send({msg:"Ok"});
                            }
                            else if(paymentData){
                                paymentData.subscriptionStatus=_sC.status;
                                paymentData.save((err, savePayment)=>{
                                    if(err){
                                        logger.log("info",'err in subscription.pending', err);
                                        res.status(203).send({msg:"Ok"});
                                    }
                                    else if(savePayment){
                                        _obj={};
                                         _obj = {
                                            subscriptionId:_sC.id,
                                            // transactionId:_payment.id,
                                            projectId:savePayment.projectId,
                                            // orderId:_payment.order_id,
                                            // invoiceId:_payment.invoice_id,
                                            customerId:_sC.customer_id,
                                            subscriptionStatus:_sC.status,
                                            // paymentStatus:_payment.status,
                                            user:{
                                                userId:savePayment.user.userId,
                                                name:savePayment.user.name,
                                            },
                                            subscriptionCount:_sC.total_count,
                                            paidCount:_sC.paid_count,
                                            // amount:_payment.amount/100,
                                        }
                                        let historyPayment = new PaymentHistoryModel(_obj);
                                        historyPayment.save((err, historyPayment)=>{
                                            if(err){
                                                logger.log("info",'err in subscription.pending', err);
                                                res.status(203).send({msg:"Ok"});
                                            }
                                            else if(historyPayment){
                                                logger.log("info",'historyPayment subscription.pending');
                                                res.status(200).send({msg:"subscription.pending!"});
                                            }
                                        })

                                    }
                                })
                            }
                        })
                        break;
            case 'subscription.halted':
                        logger.log("info",'subscription.halted method');
                        logger.log("info","subscription.halted ", req.body.payload.subscription.entity);
                         _sC = req.body.payload.subscription.entity;
                        paymentModel.findOne({subscriptionId:_sC.id},(err, paymentData)=>{
                            if(err){
                                logger.log("info",'err in payment db', err);
                                res.status(203).send({msg:"Ok"});
                            }
                            else if(paymentData){
                                paymentData.subscriptionStatus=_sC.status;
                                paymentData.save((err, savePayment)=>{
                                    if(err){
                                        logger.log("info",'err in subscription.halted', err);
                                        res.status(203).send({msg:"Ok"});
                                    }
                                    else if(savePayment){
                                        _obj={};
                                         _obj = {
                                            subscriptionId:_sC.id,
                                            // transactionId:_payment.id,
                                            projectId:savePayment.projectId,
                                            // orderId:_payment.order_id,
                                            // invoiceId:_payment.invoice_id,
                                            customerId:_sC.customer_id,
                                            subscriptionStatus:_sC.status,
                                            // paymentStatus:_payment.status,
                                            user:{
                                                userId:savePayment.user.userId,
                                                name:savePayment.user.name,
                                            },
                                            subscriptionCount:_sC.total_count,
                                            paidCount:_sC.paid_count,
                                            // amount:_payment.amount/100,
                                        }
                                        let historyPayment = new PaymentHistoryModel(_obj);
                                        historyPayment.save((err, historyPayment)=>{
                                            if(err){
                                                logger.log("info",'err in subscription.halted', err);
                                                res.status(203).send({msg:"Ok"});
                                            }
                                            else if(historyPayment){
                                                logger.log("info",'historyPayment subscription.halted');
                                                res.status(200).send({msg:"subscription.halted!"});
                                            }
                                        })

                                    }
                                })
                            }
                        })
                        break;
            case 'subscription.cancelled':
                        logger.log("info",'subscription.cancelled method');
                        logger.log("info","subscription.cancelled ", req.body.payload.subscription.entity);
                        _sC = req.body.payload.subscription.entity;
                        paymentModel.findOne({subscriptionId:_sC.id},(err, paymentData)=>{
                            if(err){
                                logger.log("info",'err in payment db', err);
                                res.status(203).send({msg:"Ok"});
                            }
                            else if(paymentData){
                                paymentData.subscriptionStatus=_sC.status;
                                paymentData.save((err, savePayment)=>{
                                    if(err){
                                        logger.log("info",'err in payment', err);
                                        res.status(203).send({msg:"Ok"});
                                    }
                                    else if(savePayment){
                                        _obj={};
                                        _obj = {
                                            subscriptionId:_sC.id,
                                            // transactionId:_payment.id,
                                            projectId:savePayment.projectId,
                                            // orderId:_payment.order_id,
                                            // invoiceId:_payment.invoice_id,
                                            customerId:_sC.customer_id,
                                            subscriptionStatus:_sC.status,
                                            // paymentStatus:_payment.status,
                                            user:{
                                                userId:savePayment.user.userId,
                                                name:savePayment.user.name,
                                            },
                                            subscriptionCount:_sC.total_count,
                                            paidCount:_sC.paid_count,
                                            // amount:_payment.amount/100,
                                        }
                                        let historyPayment = new PaymentHistoryModel(_obj);
                                        historyPayment.save((err, historyPayment)=>{
                                            if(err){
                                                logger.log("info",'err in payment', err);
                                                res.status(203).send({msg:"Ok"});
                                            }
                                            else if(historyPayment){
                                                logger.log("info",'historyPayment');
                                                res.status(200).send({msg:"Save Data!"});
                                            }
                                        })

                                    }
                                })
                            }
                        })
            default:
                        logger.log("info",'default case');
                        res.status(200).send({msg:"default case"});
    }
    }
    else{
        res.status(203).send({msg:"ok"});
    }
}

module.exports = paymentHistoryController;
