const cron = require('node-cron');
const usermodel = require('../models/user');
const designerModel = require('../models/designer');
const env = require('../utils/env')
const config = require('../config');
const request = require('request-promise');
const moment = require('moment-timezone');
const utility = require('../utils/utility')
const async = require('async');
const EmailModel = require('../models/emailer');

var cronController = {};

// cron.schedule('30 4 * * *', function () {
//     console.log("calling");
//     request.get('http://localhost:8080/user/sendMailForUsers')
// })

// cronController.sendMailForUsers = (req, res) => {
//     var currDate = moment().tz('Asia/Kolkata').format('MM/DD/YYYY');
//     var lastDate, day1 = [], day2 = [], day3 = [], day4 = [], day5 = [], day6 = [], day7 = [], day8 = [];
//     currDate = Date.parse(currDate)
//     var userDate;
//     async.parallel({
//         one: (cb) => {
//             usermodel.find({}, (err, data) => {
//                 if (err) {
//                     console.log("err", err)
//                     cb(err)
//                 } else if (data.length == 0) {
//                     cb(null, "ffsg")
//                 } else {
//                     console.log("enter in series for loop")
//                     async.eachSeries(data, function (item, callback) {
//                         lastDate = moment(item.createdAt).add(8, 'd').tz('Asia/Kolkata').format('MM/DD/YYYY');
//                         lastDate = Date.parse(lastDate)
//                         userDate = Date.parse(item.createdAt)
//                         console.log("date checking", currDate > userDate, currDate <= lastDate)
//                         if (currDate > userDate && currDate <= lastDate && item.EmailSend.finish != true) {
//                             console.log("enter first condition")
//                             if (item.EmailSend.day1) {
//                                 day1.push(item.email)
//                                 res.render('day1client', {
//                                     info1: item,
//                                 }, function (err, HTML) {
//                                     utility.sendMail(item.email, HTML, '1THING onboards select designers', 'shashank@1thing.design', (err, data) => {
//                                         console.log("mail send day1", err, data)
//                                     })
//                                 })
//                             } else if (item.EmailSend.day2) {
//                                 day2.push(item.email)
//                                 res.render('day2client', {
//                                     info1: item,
//                                 }, function (err, HTML) {
//                                     utility.sendMail(item.email, HTML, '1THING: Network of top design talent from India & outside', 'priyank@1thing.design', (err, data) => {
//                                         console.log("mail send day1", err, data)
//                                     })
//                                 })
//                             } else if (item.EmailSend.day3) {
//                                 day3.push(item.email)
//                                 res.render('day3client', {
//                                     info1: item,
//                                 }, function (err, HTML) {
//                                     utility.sendMail(item.email, HTML, '1THING: Every Productʼs Right Design Team', 'varun@1thing.design', (err, data) => {
//                                         console.log("mail send day1", err, data)
//                                     })
//                                 })
//                             } else if (item.EmailSend.day4) {
//                                 day4.push(item.email)
//                                 res.render('day4client', {
//                                     info1: item,
//                                 }, function (err, HTML) {
//                                     utility.sendMail(item.email, HTML, '1THING: Faster Turnaround Time', 'manik@1thing.design', (err, data) => {
//                                         console.log("mail send day1", err, data)
//                                     })
//                                 })
//                             } else if (item.EmailSend.day5) {
//                                 day5.push(item.email)
//                                 res.render('day5client', {
//                                     info1: item,
//                                 }, function (err, HTML) {
//                                     utility.sendMail(item.email, HTML, '1THING: Start anytime. Stop anytime', '', (err, data) => {
//                                         console.log("mail send day1", err, data)
//                                     })
//                                 })
//                             } else if (item.EmailSend.day6) {
//                                 day6.push(item.email)
//                                 res.render('day6client', {
//                                     info1: item,
//                                 }, function (err, HTML) {
//                                     utility.sendMail(item.email, HTML, '1THING: Development friendly deliverables', 'shashank@1thing.design', (err, data) => {
//                                         console.log("mail send day1", err, data)
//                                     })
//                                 })
//                             } //else if (item.EmailSend.day7) {
//                             callback()

//                         } else {
//                             callback()
//                         }
//                     }, (err) => {
//                         console.log("err of loop", err)
//                         cb(null, "hey")
//                     })
//                 }
//             })
//         },
//         two: (cb) => {
//             designerModel.find({}, (err, data) => {
//                 if (err) {
//                     console.log("err", err)
//                     cb(err)
//                 } else if (data.length == 0) {
//                     cb(null, "ffsg")
//                 } else {
//                     async.eachSeries(data, function (item, callback) {
//                         lastDate = moment(item.createdAt).add(8, 'd').tz('Asia/Kolkata').format('MM/DD/YYYY');
//                         userDate = Date.parse(item.createdAt)
//                         if (currDate > userDate && currDate <= lastDate && item.EmailSend.finish != true) {
//                             if (item.EmailSend.day1) {
//                                 day1.push(item.email)
//                                 res.render('day1designer', {
//                                     info1: item,
//                                 }, function (err, HTML) {
//                                     utility.sendMail(item.email, HTML, '1THING onboards select designers', 'shashank@1thing.design', (err, data) => {
//                                         console.log("mail send day1", err, data)
//                                     })
//                                 })
//                             } else if (item.EmailSend.day2) {
//                                 day2.push(item.email)
//                                 res.render('day2designer', {
//                                     info1: item,
//                                 }, function (err, HTML) {
//                                     utility.sendMail(item.email, HTML, 'Being a part of 1THING Design Network is special for multiple reasons', 'priyank@1thing.design', (err, data) => {
//                                         console.log("mail send day1", err, data)
//                                     })
//                                 })
//                             } else if (item.EmailSend.day3) {
//                                 day3.push(item.email)
//                                 res.render('day3designer', {
//                                     info1: item,
//                                 }, function (err, HTML) {
//                                     utility.sendMail(item.email, HTML, '1THING: Never pitch for work again', 'swati@1thing.design', (err, data) => {
//                                         console.log("mail send day1", err, data)
//                                     })
//                                 })
//                             } else if (item.EmailSend.day4) {
//                                 day4.push(item.email)
//                                 res.render('day4designer', {
//                                     info1: item,
//                                 }, function (err, HTML) {
//                                     utility.sendMail(item.email, HTML, '1THING: Payments, on time, by hour, every month', 'rajat@1thing.design', (err, data) => {
//                                         console.log("mail send day1", err, data)
//                                     })
//                                 })
//                             } else if (item.EmailSend.day5) {
//                                 day5.push(item.email)
//                                 res.render('day5designer', {
//                                     info1: item,
//                                 }, function (err, HTML) {
//                                     utility.sendMail(item.email, HTML, '1THING: In this for long run, months & years', 'sandesh@1thing.design', (err, data) => {
//                                         console.log("mail send day1", err, data)
//                                     })
//                                 })
//                             } else if (item.EmailSend.day6) {
//                                 day6.push(item.email)
//                                 res.render('day6designer', {
//                                     info1: item,
//                                 }, function (err, HTML) {
//                                     utility.sendMail(item.email, HTML, '1THING: Opportunity to work on great products', 'saibal@1thing.design', (err, data) => {
//                                         console.log("mail send day1", err, data)
//                                     })
//                                 })
//                             } else if (item.EmailSend.day7) {
//                                 day7.push(item.email)
//                                 res.render('day7designer', {
//                                     info1: item,
//                                 }, function (err, HTML) {
//                                     utility.sendMail(item.email, HTML, '1THING: Opportunity to work with great designers', 'vasu@1thing.design', (err, data) => {
//                                         console.log("mail send day1", err, data)
//                                     })
//                                 })
//                             } else if (item.EmailSend.day8) {
//                                 day8.push(item.email)
//                                 res.render('day8designer', {
//                                     info1: item,
//                                 }, function (err, HTML) {
//                                     utility.sendMail(item.email, HTML, '1THING: Takes care of your overall growth', 'kanwar@1thing.design', (err, data) => {
//                                         console.log("mail send day1", err, data)
//                                     })
//                                 })
//                             }
//                             callback()
//                         } else {
//                             callback()
//                         }
//                     }, (err) => {
//                         console.log("errrrrrrrrrrrrr is designers", err)
//                         cb(null, "hey")
//                     })
//                 }
//             })
//         }
//     }, (err, results) => {
//         console.log("array checking in cron=day1", day1)
//         console.log("array checking in cron=day2", day2)
//         console.log("array checking in cron=day3", day3)
//         console.log("array checking in cron=day4", day4)
//         console.log("array checking in cron=day5", day5)
//         console.log("array checking in cron=day6", day6)
//         console.log("array checking in cron=day7", day7)
//         console.log("array checking in cron=day8", day8)
//         console.log("err", err, results)
//         async.parallel({
//             one: (callback) => {
//                 usermodel.update({ email: { $in: day1 } }, { $set: { "EmailSend.day1": false, "EmailSend.day2": true } }, { multi: true }, (err, data) => {
//                     console.log("day1", err, data)
//                     designerModel.update({ email: { $in: day1 } }, { $set: { "EmailSend.day1": false, "EmailSend.day2": true } }, { multi: true }, (err, data) => {
//                         console.log("designer update", err, data)
//                         callback(null, "success")
//                     })
//                 })
//             },
//             two: (callback) => {
//                 usermodel.update({ email: { $in: day2 } }, { $set: { "EmailSend.day2": false, "EmailSend.day3": true } }, { multi: true }, (err, data) => {
//                     console.log("day2", err, data)
//                     designerModel.update({ email: { $in: day2 } }, { $set: { "EmailSend.day2": false, "EmailSend.day3": true } }, { multi: true }, (err, data) => {
//                         console.log(" designer day2", err, data)
//                         callback(null, "success")
//                     })
//                 })
//             },
//             three: (callback) => {
//                 usermodel.update({ email: { $in: day3 } }, { $set: { "EmailSend.day3": false, "EmailSend.day4": true } }, { multi: true }, (err, data) => {
//                     console.log("day3", err, data)
//                     designerModel.update({ email: { $in: day3 } }, { $set: { "EmailSend.day3": false, "EmailSend.day4": true } }, { multi: true }, (err, data) => {
//                         console.log(" designer day3", err, data);
//                         callback(null, "success")
//                     })
//                 })
//             },
//             four: (callback) => {
//                 usermodel.update({ email: { $in: day4 } }, { $set: { "EmailSend.day4": false, "EmailSend.day5": true } }, { multi: true }, (err, data) => {
//                     console.log("day4", err, data)
//                     designerModel.update({ email: { $in: day4 } }, { $set: { "EmailSend.day4": false, "EmailSend.day5": true } }, { multi: true }, (err, data) => {
//                         console.log("designer day4", err, data);
//                         callback(null, "success")
//                     })
//                 })
//             },
//             five: (callback) => {
//                 usermodel.update({ email: { $in: day5 } }, { $set: { "EmailSend.day5": false, "EmailSend.day6": true } }, { multi: true }, (err, data) => {
//                     console.log("day5", err, data)
//                     designerModel.update({ email: { $in: day5 } }, { $set: { "EmailSend.day5": false, "EmailSend.day6": true } }, { multi: true }, (err, data) => {
//                         console.log("designer day5", err, data);
//                         callback(null, "success")
//                     })
//                 })
//             },
//             six: (callback) => {
//                 usermodel.update({ email: { $in: day6 } }, { $set: { "EmailSend.day6": false, "EmailSend.finish": true } }, { multi: true }, (err, data) => {
//                     console.log("day6", err, data)
//                     designerModel.update({ email: { $in: day6 } }, { $set: { "EmailSend.day6": false, "EmailSend.day7": true } }, { multi: true }, (err, data) => {
//                         console.log("designer day6", err, data);
//                         callback(null, "success")
//                     })
//                 })
//             },
//             seven: (callback) => {

//                 designerModel.update({ email: { $in: day7 } }, { $set: { "EmailSend.day7": false, "EmailSend.day8": true } }, { multi: true }, (err, data) => {
//                     console.log("designer day7", err, data);
//                     callback(null, "success")
//                 })
//             },
//             eight: (callback) => {
//                 //  usermodel.update({ email: { $in: day8 } }, { $set: { "EmailSend.day8": false, "EmailSend.finish": true } },{multi:true}, (err, data) => {
//                 designerModel.update({ email: { $in: day8 } }, { $set: { "EmailSend.day8": false, "EmailSend.finish": true } }, { multi: true }, (err, data) => {
//                     console.log("designer day8", err, data);
//                     callback(null, "success")
//                 })
//                 // })
//             }
//         }, (err, result) => {
//             console.log(err, result, 'finally cron worked')
//             res.json("successsss")
//         })
//     });
// }






//cron for every 3 days send mail for designers and clients.
//you can change days interval for sending email by env file in utils.
cronController.sendMailAgain = (req, res) => {
    var dayLimit = env.dayLimitForEmailSend;
    var currDate = moment().tz('Asia/Kolkata').format('MM/DD/YYYY');
    var currentDate = moment().tz('Asia/Kolkata').format('MM/DD/YYYY');
    var limitDate = moment().add(dayLimit, 'd').tz('Asia/Kolkata').format('MM/DD/YYYY');
    var lastDate, day1 = [], day2 = [], day3 = [], day4 = [], day5 = [], day6 = [], day7 = [], day8 = [];
    currDate = Date.parse(currDate)
    var userDate;
    async.parallel({
        one: (cb) => {
            EmailModel.find({ userType: "client" }, (err, data) => {
                if (err) {
                    console.log("err", err)
                    cb(err)
                } else if (data.length == 0) {
                    cb(null, "ffsg")
                } else {
                    console.log("enter in series for loop")
                    async.eachSeries(data, function (item, callback) {
                        lastDate = moment(item.createdAt).add(8 * dayLimit, 'd').tz('Asia/Kolkata').format('MM/DD/YYYY');
                        lastDate = Date.parse(lastDate)
                        userDate = Date.parse(item.createdAt)
                        console.log("date checking", currDate > userDate, currDate <= lastDate)
                        if (currDate > userDate && currDate <= lastDate && item.EmailSend.finish != true) {
                            console.log("enter first condition")
                            if (item.firstMail.status) {
                                if (item.firstMail.date == currentDate) {
                                    day1.push(item.email)
                                    res.render('day1client', {
                                        info1: item,
                                    }, function (err, HTML) {
                                        utility.sendMail(item.email, HTML, '1THING onboards select designers', 'shashank@1thing.design', (err, data) => {
                                            console.log("mail send day1", err, data)
                                            callback()
                                        })
                                    })
                                } else {
                                    callback()
                                }
                            } else if (item.secondMail.status) {
                                if (item.secondMail.date == currentDate) {
                                    day2.push(item.email)
                                    res.render('day2client', {
                                        info1: item,
                                    }, function (err, HTML) {
                                        utility.sendMail(item.email, HTML, '1THING: Network of top design talent from India & outside', 'priyank@1thing.design', (err, data) => {
                                            console.log("mail send day1", err, data)
                                            callback()
                                        })
                                    })
                                }
                                else {
                                    callback()
                                }
                            } else if (item.thirdMail.status) {
                                if (item.thirdMail.date == currentDate) {
                                    day3.push(item.email)
                                    res.render('day3client', {
                                        info1: item,
                                    }, function (err, HTML) {
                                        utility.sendMail(item.email, HTML, '1THING: Every Productʼs Right Design Team', 'varun@1thing.design', (err, data) => {
                                            console.log("mail send day1", err, data);
                                            callback()
                                        })
                                    })
                                }
                                else {
                                    callback()
                                }
                            } else if (item.fourthMail.status) {
                                if (item.fourthMail.date == currentDate) {
                                    day4.push(item.email)
                                    res.render('day4client', {
                                        info1: item,
                                    }, function (err, HTML) {
                                        utility.sendMail(item.email, HTML, '1THING: Faster Turnaround Time', 'manik@1thing.design', (err, data) => {
                                            console.log("mail send day1", err, data)
                                            callback()
                                        })
                                    })
                                }
                                else {
                                    callback()
                                }
                            } else if (item.fifthMail.status) {
                                if (item.fifthMail.date == currentDate) {
                                    day5.push(item.email)
                                    res.render('day5client', {
                                        info1: item,
                                    }, function (err, HTML) {
                                        utility.sendMail(item.email, HTML, '1THING: Start anytime. Stop anytime', '', (err, data) => {
                                            console.log("mail send day1", err, data)
                                            callback()
                                        })
                                    })
                                }
                                else {
                                    callback()
                                }
                            } else if (item.sixthMail.status) {
                                if (item.sixthMail.date == currentDate) {
                                    day6.push(item.email)
                                    res.render('day6client', {
                                        info1: item,
                                    }, function (err, HTML) {
                                        utility.sendMail(item.email, HTML, '1THING: Development friendly deliverables', 'shashank@1thing.design', (err, data) => {
                                            console.log("mail send day1", err, data)
                                            callback()
                                        })
                                    })
                                }
                                else {
                                    callback()
                                }
                            } else {
                                callback()
                            }
                        } else {
                            callback()
                        }
                    }, (err) => {
                        console.log("err of loop", err)
                        cb(null, "hey")
                    })
                }
            })
        },
        two: (cb) => {
            EmailModel.find({ userType: "designer" }, (err, data) => {
                if (err) {
                    console.log("err", err);
                    cb(err)
                } else if (data.length == 0) {
                    cb(null, "ffsg")
                } else {
                    async.eachSeries(data, function (item, callback) {
                        lastDate = moment(item.createdAt).add(8 * dayLimit, 'd').tz('Asia/Kolkata').format('MM/DD/YYYY');
                        userDate = Date.parse(item.createdAt)
                        if (currDate > userDate && currDate <= lastDate && item.EmailSend.finish != true) {
                            if (item.firstMail.status) {
                                if (item.firstMail.date == currentDate) {
                                    day1.push(item.email)
                                    res.render('day1designer', {
                                        info1: item,
                                    }, function (err, HTML) {
                                        utility.sendMail(item.email, HTML, '1THING onboards select designers', 'shashank@1thing.design', (err, data) => {
                                            console.log("mail send day1", err, data)
                                            callback()
                                        })
                                    })
                                }
                                else {
                                    callback()
                                }
                            } else if (item.secondMail.status) {
                                if (item.secondMail.date == currentDate) {
                                    day2.push(item.email)
                                    res.render('day2designer', {
                                        info1: item,
                                    }, function (err, HTML) {
                                        utility.sendMail(item.email, HTML, 'Being a part of 1THING Design Network is special for multiple reasons', 'priyank@1thing.design', (err, data) => {
                                            console.log("mail send day1", err, data);
                                            callback()
                                        })
                                    })
                                }
                                else {
                                    callback()
                                }
                            } else if (item.thirdMail.status) {
                                if (item.thirdMail.date == currentDate) {
                                    day3.push(item.email)
                                    res.render('day3designer', {
                                        info1: item,
                                    }, function (err, HTML) {
                                        utility.sendMail(item.email, HTML, '1THING: Never pitch for work again', 'swati@1thing.design', (err, data) => {
                                            console.log("mail send day1", err, data)
                                            callback()
                                        })
                                    })
                                }
                                else {
                                    callback()
                                }
                            } else if (item.fourthMail.status) {
                                if (item.fourthMail.date == currentDate) {
                                    day4.push(item.email)
                                    res.render('day4designer', {
                                        info1: item,
                                    }, function (err, HTML) {
                                        utility.sendMail(item.email, HTML, '1THING: Payments, on time, by hour, every month', 'rajat@1thing.design', (err, data) => {
                                            console.log("mail send day1", err, data)
                                            callback()
                                        })
                                    })
                                }
                                else {
                                    callback()
                                }
                            } else if (item.fifthMail.status) {
                                if (item.fifthMail.date == currentDate) {
                                    day5.push(item.email)
                                    res.render('day5designer', {
                                        info1: item,
                                    }, function (err, HTML) {
                                        utility.sendMail(item.email, HTML, '1THING: In this for long run, months & years', 'sandesh@1thing.design', (err, data) => {
                                            console.log("mail send day1", err, data)
                                            callback()
                                        })
                                    })
                                }
                                else {
                                    callback()
                                }
                            } else if (item.sixthMail.status) {
                                if (item.sixthMail.date == currentDate) {
                                    day6.push(item.email)
                                    res.render('day6designer', {
                                        info1: item,
                                    }, function (err, HTML) {
                                        utility.sendMail(item.email, HTML, '1THING: Opportunity to work on great products', 'saibal@1thing.design', (err, data) => {
                                            console.log("mail send day1", err, data)
                                            callback()
                                        })
                                    })
                                }
                                else {
                                    callback()
                                }
                            } else if (item.seventhMail.status) {
                                if (item.seventhMail.date == currentDate) {
                                    day7.push(item.email)
                                    res.render('day7designer', {
                                        info1: item,
                                    }, function (err, HTML) {
                                        utility.sendMail(item.email, HTML, '1THING: Opportunity to work with great designers', 'vasu@1thing.design', (err, data) => {
                                            console.log("mail send day1", err, data)
                                            callback()
                                        })
                                    })
                                }
                                else {
                                    callback()
                                }
                            } else if (item.eightMail.status) {
                                if (item.eightMail.date == currentDate) {
                                    day8.push(item.email)
                                    res.render('day8designer', {
                                        info1: item,
                                    }, function (err, HTML) {
                                        utility.sendMail(item.email, HTML, '1THING: Takes care of your overall growth', 'kanwar@1thing.design', (err, data) => {
                                            console.log("mail send day1", err, data)
                                            callback()
                                        })
                                    })
                                }
                                else {
                                    callback()
                                }
                            } else {
                                callback()
                            }
                        } else {
                            callback()
                        }
                    }, (err) => {
                        console.log("errrrrrrrrrrrrr is designers", err)
                        cb(null, "hey")
                    })
                }
            })
        }
    }, (err, results) => {
        console.log("array checking in cron=day1", day1)
        console.log("array checking in cron=day2", day2)
        console.log("array checking in cron=day3", day3)
        console.log("array checking in cron=day4", day4)
        console.log("array checking in cron=day5", day5)
        console.log("array checking in cron=day6", day6)
        console.log("array checking in cron=day7", day7)
        console.log("array checking in cron=day8", day8)
        console.log("err", err, results)
        async.parallel({
            one: (callback) => {
                EmailModel.update({ email: { $in: day1 } }, { $set: { "firstMail.status": false, "secondMail.status": true, "secondMail.date": limitDate } }, { multi: true }, (err, data) => {
                    console.log("day1", err, data)
                    callback(null, "success")
                })
            },
            two: (callback) => {
                EmailModel.update({ email: { $in: day2 } }, { $set: { "secondMail.status": false, "thirdMail.status": true, "thirdMail.date": limitDate } }, { multi: true }, (err, data) => {
                    console.log("day2", err, data)
                    callback(null, "success")
                })
            },
            three: (callback) => {
                EmailModel.update({ email: { $in: day3 } }, { $set: { "thirdMail.status": false, "fourthMail.status": true, "fourthMail.date": limitDate } }, { multi: true }, (err, data) => {
                    console.log("day3", err, data)
                    callback(null, "success")
                })
            },
            four: (callback) => {
                EmailModel.update({ email: { $in: day4 } }, { $set: { "fourthMail.status": false, "fifthMail.status": true, "fifthMail.date": currentDate } }, { multi: true }, (err, data) => {
                    console.log("designer day4", err, data);
                    callback(null, "success")
                })
            },
            five: (callback) => {
                EmailModel.update({ email: { $in: day5 } }, { $set: { "fifthMail.status": false, "sixthMail.status": true, "sixthMail.date": currentDate } }, { multi: true }, (err, data) => {
                    console.log("day5", err, data)
                    callback(null, "success")
                })
            },
            six: (callback) => {
                EmailModel.update({ email: { $in: day6 }, userType: "designer" }, { $set: { "sixthMail.status": false, "seventhMail.status": true, "seventhMail.date": currentDate } }, { multi: true }, (err, data) => {
                    console.log("day6", err, data)
                    EmailModel.update({ email: { $in: day6 }, userType: "client" }, { $set: { "sixthMail.status": false, "finish.status": true, "finish.date": currentDate } }, { multi: true }, (err, data) => {
                        console.log("designer day6", err, data);
                        callback(null, "success")
                    })
                })
            },
            seven: (callback) => {
                EmailModel.update({ email: { $in: day7 }, userType: "designer" }, { $set: { "seventhMail.status": false, "eightMail.status": true, "eightMail.date": currentDate } }, { multi: true }, (err, data) => {
                    console.log("designer day7", err, data);
                    callback(null, "success")
                })
            },
            eight: (callback) => {
                EmailModel.update({ email: { $in: day8 }, userType: "designer" }, { $set: { "eightMail.status": false, "finish.status": true, "finish.date": currentDate } }, { multi: true }, (err, data) => {
                    console.log("designer day8", err, data);
                    callback(null, "success")
                })
            }
        }, (err, result) => {
            console.log(err, result, 'finally cron worked')
            res.json("successsss")
        })
    });
}

module.exports = cronController;

