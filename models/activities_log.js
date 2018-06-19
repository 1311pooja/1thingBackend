const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var activitiesLogSchema = new Schema({
    activityId:{type:String, required:true},
    projectId:{type:String, required:true},
    userId:{type:String, required:true},
    startDate:{type:String},
    endDate:{type:String},
    totalMinHours:{type:String},
    totalMaxHours:{type:String},
    inProgress:[{
        stage:{type:String},
        things_To_Do:{type:String}
    }],
    completeted:[{
        stage:{type:String},
        things_To_Do:{type:String}
    }],
    aboutPc:{
        sheetStatus:{type:String, default:"Yet to Start"},
    },
    rightDesignTeam:[{
        name:{type:String, default:""},
        role:{type:String ,default:""},
        email:{type:String ,default:""},
        phone:{type:String ,default:""},
        availabel:{type:String ,default:""},
        notAvailable:{type:String ,default:""},
        anyThingElse:{type:String ,default:""},
    }],
    resources:[{
        name:{type:String ,default:""},
        purpose:{type:String ,default:""},
        link:{type:String ,default:""},
    }],
    thingsToDo:[{
        stages:{type:String ,default:""},
        minHours:{type:Number, default:0},
        maxHours:{type:Number, default:0},
        endDates:{type:String ,default:""},
        state:{type:String ,default:""},
        tasks:[{
            thingsToDo:{type:String ,default:""},
            ownerShip:{type:String ,default:""},
        }]
    }],
    dailyUpdates:[{
        date:{type:String ,default:""},
        thingsToDo:{type:String ,default:""},
        stages:{type:String ,default:""},
        addAState:{type:String ,default:""},
        addATag:{type:String ,default:""},
        link:{type:String ,default:""},
        overallStatus:{type:String ,default:""},
        comment:{type:String ,default:""},
        hoursSpent:{type:Number ,default:0},
    }]

},{
    timestamps:{createdAt:'createdAt', lastUpdated:'lastUpdated'}
});

module.exports = mongoose.model('activitiesLogs', activitiesLogSchema)