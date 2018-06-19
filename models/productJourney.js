const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var productJourneySchema = new Schema({
    activityId:{type:String, required:true},
    projectId:{type:String, required:true},
    userId:{type:String, required:true},
    startDate:{type:String, default:""},
    endDate:{type:String, default:""},
    totalMinHours:{type:Number, default:0},
    totalMaxHours:{type:Number, default:0},
    weeks:[],
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
        activityName:{type:String, default:""}
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
        createdDate:{type:String ,default:""},
        stages:{type:String ,default:""},
        minHours:{type:Number},
        maxHours:{type:Number},
        startDate:{type:String, default:""},
        endDates:{type:String ,default:""},
        stageStatus:{type:String ,default:""},
        tasks1:[],
        tasks:[{
            createdDate:{type:String, default:""},
            // task:{type:String ,default:""},
            thingsToDo:{type:String ,default:""},
            ownerShip:{
                userId:{type:String, default:""},
                mongooseId:{type:String,default:""},
                name:{type:String, default:""}
            },
            createdBy:{
                userId:{type:String, default:""},
                mongooseId:{type:String,default:""},
                name:{type:String, default:""}
            },
            taskDetails:{type:String, default:""},
            expectedHours:{type:Number, default:0},
            deliverables:[],
            timeline:{type:String, default:""},
            addAState:{type:String ,default:""},
            addATag:{type:String ,default:""},
            comment:{type:String ,default:""},
            hoursSpent:{type:Number ,default:0},
            workingStatus:{type:String, default:"stop"},
            
        }],
        stageDetails:{type:String, default:""},
        addATag:{type:String ,default:""},
        timeline:{type:String ,default:""},
        actualHours:{type:Number, default:0},
        deliverables:[],
        expectedHours:{type:Number, default:0},
        createdBy:{
            userId:{type:String, default:""},
            mongooseId:{type:String,default:""},
            name:{type:String, default:""}
        },
    }],
    dailyUpdates:[{
        date:{type:String ,default:""},
        taskId:{type:String ,default:""},
        thingsToDo:{type:String ,default:""},
        isoDate:{type:String ,default:""},
        // taskDetails:{type:String, default:""},
        // expectedHours:{type:Number, default:0},
        ownerShip:{type:String, default:""},
        stages:{type:String ,default:""},
        deliverables:[],
        timeline:{type:String, default:""},
        addAState:{type:String ,default:""},
        addATag:{type:String ,default:""},
        addAnotherTag:{type:String, default:""},
        link:{type:String ,default:""},
        overallStatus:{type:String ,default:""},
        comment:{type:String ,default:""},
        hoursSpent:{type:Number ,default:0},
    }],
    allStages:[],
    deletedStage:[],
    deletedTasks:[]
},{
    timestamps:{createdAt:'createdAt', lastUpdated:'lastUpdated'}
});

module.exports = mongoose.model('productJourney', productJourneySchema)