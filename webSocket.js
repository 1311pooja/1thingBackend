const activityController = require('./controllers/activitiesCards');
const productJourneyController = require('./controllers/productJourney');
const designerController = require('./controllers/designer');
const productJourneyModel = require('./models/productJourney');
const utility = require("./utils/utility");
const env = require("./utils/env");
const async = require('async');
var mwServer  = require('uws').Server;
var  webServer= new mwServer({port:8000});


var onlineUser = [];
global.onlineUser = onlineUser;
global.webServer = webServer;
webServer.on('connection', (ws)=>{
    console.log('connections stablish!');
    //ping pong connection

    let heartbeat_interval = null, missed_heartbeats = 0;
    let heartBeat = {
        data:"--hearbeat--"
    }
    var onlineUserId = "";
    if(heartbeat_interval===null){
        missed_heartbeats=0;
        heartbeat_interval = setInterval(()=>{
            try{
                missed_heartbeats++;
                if(missed_heartbeats>=4)
                    throw new Error('Too many missed heartbeats!');
                ws.send(JSON.stringify(heartBeat));
            }catch(e){
                let offlineUserIndex = onlineUser.findIndex((item)=>{return onlineUserId===item.userId});
                // console.log("offline user index------->",offlineUserIndex)
                let offlineUser = onlineUser[offlineUserIndex];
                productJourneyController.sendInfoToOnlineUsers(offlineUser, onlineUserId, (err,pJData)=>{
                    if(err){
                        console.log('err in offline ping pong', err);
                        clearInterval(heartbeat_interval);
                        heartbeat_interval=null;
                        ws.close();
                    }
                    else{
                        async.forEachSeries(offlineUser.teamMembers, (member, memberCallback)=>{
                            let index = onlineUser.findIndex((item)=>{
                                return member.user_id === item.userId });
                            if(index>=0){
                                onlineUser[index].ws.send(JSON.stringify({journeyData:pJData}));
                                // onlineUser[index].ws.send(JSON.stringify(sTTData));
                                memberCallback();
                            }
                            else{
                                memberCallback();
                            }
                        }, err=>{
                            clearInterval(heartbeat_interval);
                            // console.log('onlineUserId = ping pong when offline ', onlineUserId);
                            heartbeat_interval=null;
                            ws.close();
                        });
                    }
                });
            }
        },4000);
    }
    ws.on('message', async (message)=>{
        // console.log('msgg', message)
        // console.log("Received "+JSON.parse(message));
        
        let mss = JSON.parse(message);
        // let mss = message
        // console.log('mss = ', mss)
        onlineUserId = mss.userId;
        // console.log('total online user = ', onlineUser);
        let onlineIndex = onlineUser.findIndex((item)=>{
            let result = onlineUserId===undefined?false:item.userId===onlineUserId
            return result});
        if(onlineIndex<0){
            onlineUser.push({
                mongooseId:mss.mongooseId,
                projectId:mss.projectId,
                userId:mss.userId,
                teamMembers:[],
                userType:mss.userType,
                ws:ws,
            });
        }
            let data = {};
            switch(mss.change_type){
                case 'getJourneyData':
                    productJourneyController.getJourneyData(mss, (err, pJData)=>{
                        // console.log('getJourneyData = ', mss)
                        if(err){
                            ws.send(JSON.stringify(err));
                        }
                        else{
                            designerController.getSelecetDps(mss,(err, dPsData)=>{
                                if(err){
                                    ws.send(JSON.stringify(err));
                                }
                                else{
                                    productJourneyController.getProjectJourneyData(mss, (err,totalAssignTask)=>{
                                        // console.log('totalAssignTask ', totalAssignTask)
                                        if(err){
                                            ws.send(JSON.stringify(err));
                                        }
                                        else{
                                            // console.log('totalAssignTask ', totalAssignTask)
                                            utility.loginByMattermost(env.teamCreatecredentials,(err, adminObj)=>{
                                                // let adminUserId = adminObj.body.id;
                                                if (err) {
                                                    console.log("singup error 1");
                                                    ws.send(JSON.stringify(err));
                                                }
                                                else{
                                                    token = adminObj.headers.token;
                                                    utility.getTeamMembers(mss.teamId, token, (err, teamMembers)=>{
                                                        if(err){
                                                            console.log('err in websocket getTeamMembers', err);
                                                            ws.send(JSON.stringify(err));
                                                        }
                                                        else if(teamMembers.length>=0){

                                                            let index = onlineUser.findIndex((item)=>{
                                                                return mss.userId == item.userId},mss.userId);
                                                            if(index>=0){
                                                                onlineUser[index].teamMembers=teamMembers;
                                                            }
                                                            else{
                                                                // onlineUser[index].teamMembers=[];
                                                                console.log('No team members++++++++')
                                                            }

                                                            let _obj = {
                                                                journeyData:pJData,
                                                                dPsData:dPsData.data,
                                                                totalAssignTask:totalAssignTask
                                                            }
                                                            ws.send(JSON.stringify(_obj));
                                                        }
                                                        else{
                                                            // console.log('teamMembers.length else = ', teamMembers.length);

                                                            let _obj = {
                                                                journeyData:pJData,
                                                                dPsData:dPsData.data,
                                                                totalAssignTask:totalAssignTask
                                                            }
                                                            ws.send(JSON.stringify(_obj));
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    })
                                }
                                
                            });
                        }
                    });
                    break;
                case 'addTask':
                    console.log('addTask');
                    activityController.addTask(mss,(err, aTData)=>{
                        if(err){
                            ws.send(JSON.stringify(err));
                        }
                        else{
                            // console.log("in SpData");
                            ws.send(JSON.stringify(aTData));
                        }
                    })
                    break;
                case 'addStage':
                    console.log('addStage');
                    activityController.addStage(mss,(err, aSData)=>{
                        if(err){
                            ws.send(JSON.stringify(err));
                        }
                        else{
                            // console.log("in SpData");
                            ws.send(JSON.stringify(aSData));
                        }
                    });
                    break;
                case 'updateInStage':
                    console.log('updateInStage');
                    activityController.updateInStage(mss,(err, uInSData)=>{
                        if(err){
                            ws.send(JSON.stringify(err));
                        }
                        else{
                            // // console.log("in SpData");
                            // ws.send(JSON.stringify(uInSData));
                            sendDataToTeamMembersInUpdate(mss,onlineUser,onlineUserId,ws,uInSData ,(err, response)=>{
                                if(err){
                                    ws.send(JSON.stringify(err));
                                }
                                else{
                                    console.log('every thing is done after updation in stage!');
                                }
                            });
                        }
                    });
                    break;
                case 'updateInTask':
                    console.log('updateInTask');
                    activityController.updateInTask(mss,(err, uInTData)=>{
                        if(err){
                            ws.send(JSON.stringify(err));
                        }
                        else{
                            sendDataToTeamMembersInUpdate(mss,onlineUser,onlineUserId,ws,uInTData ,(err, response)=>{
                                if(err){
                                    ws.send(JSON.stringify(err));
                                }
                                else{
                                    console.log('every thing is done after updation in task!');
                                }
                            });
                        }
                    });
                    break;
                case 'startTaskTimer':
                    console.log('startTaskTimer');
                    activityController.startTaskTimer(mss, (err, sTTData)=>{
                        if(err){
                            ws.send(JSON.stringify(err));
                        }
                        else{
                            // console.log('teamId===',mss.teamId);
                            productJourneyController.getJourneyData(mss, (err, journeyData)=>{
                                if(err){
                                    console.log('err from getJourneyData startTimer');
                                    ws.send(JSON.stringify(err));
                                }
                                else{
                                    console.log('in else part');
                                    sendDataToTeamMembersInStartTimer(
                                        mss,
                                        onlineUser, 
                                        onlineUserId, 
                                        ws, 
                                        journeyData,
                                        (response)=>{
                                            console.log('every thing done in startTaskTimer');
                                    })
                                    // let offlineUserIndex = onlineUser.findIndex((item)=>{ return onlineUserId===item.userId});
                                    // let offlineUser = onlineUser[offlineUserIndex];
                                    // if(offlineUser && offlineUser.teamMembers.length>0){
                                    //     async.forEachSeries(offlineUser.teamMembers, (member, memberCallback)=>{
                                    //         let index = onlineUser.findIndex((item)=>{
                                    //             return member.user_id === item.userId && member.user_id!==onlineUserId });
                                    //         if(index>=0){
                                    //             onlineUser[index].ws.send(JSON.stringify({status:200,change_type:'teamMemberoff',journeyData:journeyData}));
                                    //             memberCallback();
                                    //         }
                                    //         else{
                                    //             memberCallback();
                                    //         }
                                    //     }, err=>{
                                    //         if(mss.tickTimer==='start' || mss.tickTimer==='stop'){
                                    //             ws.send(JSON.stringify({status:200,journeyData:journeyData, change_type:"InitialStartTimer"}));
                                    //         }
                                    //         else{
                                    //             ws.send(JSON.stringify({status:200,data:"ok"}));
                                    //         }
                                    //     });
                                    // }else{
                                    //     if(mss.tickTimer==='start' || mss.tickTimer==='stop'){
                                    //         console.log('first time Timer')
                                    //         ws.send(JSON.stringify({status:200,journeyData:journeyData}));
                                    //     }
                                    //     else{
                                    //         console.log('other time Timer')
                                    //         ws.send(JSON.stringify({status:200,data:"ok"}));
                                    //     }
                                    // }
                                }
                            });
                            }
                        });
                    break;
                case 'heartBeat':
                    missed_heartbeats=0;
                    break;
                case 'deleteTask':
                    console.log('deleteTask');
                    activityController.deleteTask(mss, (err, dTData)=>{
                        if(err){
                          ws.send(JSON.stringify(err));
                        }
                        else{
                          ws.send(JSON.stringify(dTData));
                        }
                    })
                    break;
                case 'deleteStage':
                    console.log('deleteStage');
                    activityController.deleteStage(mss, (err, dSData)=>{
                        if(err){
                        ws.send(JSON.stringify(err));
                        }
                        else{
                        ws.send(JSON.stringify(dTData));
                        }
                    })
                    break;
                default:
                    console.log('default case!');
                    break;
            }   
        //  });    
        });
    ws.on('close', (disconnect)=>{
        console.log('connection disconnect!');
        let offlineUserIndex = onlineUser.findIndex((item)=>{return onlineUserId===item.userId});
        console.log("offline user index in close------->",offlineUserIndex)
        let offlineUser = onlineUser[offlineUserIndex];
        productJourneyController.sendInfoToOnlineUsers(offlineUser, onlineUserId, (err,pJData)=>{
            if(err){
                console.log('err in offline ping pong in close', err);
                onlineUser.splice(offlineUserIndex,1);
                let index = onlineUser.findIndex((item)=>{
                    return item.userId===undefined });
                if(index>=0)    
                   onlineUser.splice(index,1);
                clearInterval(heartbeat_interval);
                heartbeat_interval=null;
                ws.close();
            }
            else if(pJData){
                async.forEachSeries(offlineUser.teamMembers, (member, memberCallback)=>{
                    let index = onlineUser.findIndex((item)=>{
                        return member.user_id === item.userId });
                    if(index>=0){
                        let obj = {
                            journeyData:pJData
                        }
                        onlineUser[index].ws.send(JSON.stringify(obj));
                        memberCallback();
                    }
                    else{
                        memberCallback();
                    }
                }, err=>{
                    console.log('Before delete user from online user', onlineUser.length);
                    onlineUser.splice(offlineUserIndex,1);
                    let index = onlineUser.findIndex((item)=>{
                        return item.userId===undefined });
                    if(index>=0)    
                       onlineUser.splice(index,1);
                    // console.log('After delete user from online user', onlineUser);
                    clearInterval(heartbeat_interval);
                    heartbeat_interval=null;
                    ws.close();
                });
            }
            else{
                console.log('Before user only come ', onlineUser.length);
                // console.log('Before user only come ', onlineUser);
                onlineUser.splice(offlineUserIndex,1);
                let index = onlineUser.findIndex((item)=>{
                    return item.userId===undefined });
                if(index>=0)    
                 onlineUser.splice(index,1);
                console.log('After user only come', onlineUser.length);
                clearInterval(heartbeat_interval);
                heartbeat_interval=null;
                ws.close();
            }
        });

    });
});


sendDataToTeamMembersInStartTimer = (mss,onlineUser, onlineUserId, ws, journeyData, callback)=>{
    let offlineUserIndex = onlineUser.findIndex((item)=>{ return onlineUserId===item.userId});
    let offlineUser = onlineUser[offlineUserIndex];
    if(offlineUser && offlineUser.teamMembers.length>0){
        if(mss.tickTimer==='start' || mss.tickTimer==='stop'){
            ws.send(JSON.stringify({status:200,journeyData:journeyData, change_type:"InitialStartTimer"}));
            // callback("send");
        }
        else{
            ws.send(JSON.stringify({status:200,data:"ok"}));
            // callback("send");
        }

        async.forEachSeries(offlineUser.teamMembers, (member, memberCallback)=>{
            let index = onlineUser.findIndex((item)=>{
                return member.user_id === item.userId && member.user_id!==onlineUserId });
            if(index>=0){
                onlineUser[index].ws.send(JSON.stringify({status:200,change_type:'teamMemberoff',journeyData:journeyData}));
                memberCallback();
            }
            else{
                memberCallback();
            }
        }, err=>{
            callback("send");
            // if(mss.tickTimer==='start' || mss.tickTimer==='stop'){
            //     ws.send(JSON.stringify({status:200,journeyData:journeyData, change_type:"InitialStartTimer"}));
            //     callback("send");
            // }
            // else{
            //     ws.send(JSON.stringify({status:200,data:"ok"}));
            //     callback("send");
            // }
        });
    }else{
        if(mss.tickTimer==='start' || mss.tickTimer==='stop'){
            console.log('first time Timer')
            ws.send(JSON.stringify({status:200,journeyData:journeyData}));
            callback("send");
        }
        else{
            console.log('other time Timer')
            ws.send(JSON.stringify({status:200,data:"ok"}));
            callback("send");
        }
    }
}

sendDataToTeamMembersInUpdate = (mss,onlineUser,onlineUserId,ws, journeyData, callback)=>{
    let obj={};
    productJourneyController.getProjectJourneyData(mss, (err,totalAssignTask)=>{
        if(err){
            callback(err);
        }
        else{
            obj={
                journeyData:journeyData,
                totalAssignTask:totalAssignTask
            }
            let offlineUserIndex = onlineUser.findIndex((item)=>{ return onlineUserId===item.userId});
            let offlineUser = onlineUser[offlineUserIndex];
            let i=0;
            if(offlineUser && offlineUser.teamMembers.length>0){
                console.log('team member present',offlineUser.teamMembers.length )
                async.forEachSeries(offlineUser.teamMembers, (member, memberCallback)=>{
                    let index = onlineUser.findIndex((item)=>{
                        return member.user_id === item.userId && member.user_id!==onlineUserId });
                    if(index>=0){
                        // console.log("send data in team membeers", JSON.stringify(obj));
                        console.log('send', i++);
                        onlineUser[index].ws.send(JSON.stringify(obj));
                        memberCallback();
                    }
                    else{
                        memberCallback();
                    }
                }, err=>{
                    ws.send(JSON.stringify(obj.journeyData));
                    callback(null,'send')
                });
            }else{
                console.log('no team members ')
                ws.send(JSON.stringify(obj.journeyData));
                callback(null,'send')
            }
        }
    });
}

sendDataToTeamMembersAfterAdd = (mss,onlineUser,onlineUserId,ws, journeyData, callback)=>{
    let obj={};
    // productJourneyController.getProjectJourneyData(mss, (err,totalAssignTask)=>{
    //     if(err){
    //         callback(err);
    //     }
    //     else{
            // obj={
            //     journeyData:journeyData,
            // }
            let offlineUserIndex = onlineUser.findIndex((item)=>{ return onlineUserId===item.userId});
            let offlineUser = onlineUser[offlineUserIndex];
            let i=0;
            if(offlineUser && offlineUser.teamMembers.length>0){
                console.log('team member present',offlineUser.teamMembers.length )
                async.forEachSeries(offlineUser.teamMembers, (member, memberCallback)=>{
                    let index = onlineUser.findIndex((item)=>{
                        return member.user_id === item.userId && member.user_id!==onlineUserId });
                    if(index>=0){
                        // console.log("send data in team membeers", JSON.stringify(obj));
                        console.log('send', i++);
                        onlineUser[index].ws.send(JSON.stringify(journeyData));
                        memberCallback();
                    }
                    else{
                        memberCallback();
                    }
                }, err=>{
                    ws.send(JSON.stringify(journeyData));
                    callback(null,'send')
                });
            }else{
                console.log('no team members ')
                ws.send(JSON.stringify(journeyData));
                callback(null,'send')
            }
    //     }
    // });
}

module.exports = webServer;