const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment-timezone');


var projectSchema = new Schema({
    name: { type: String, trim: true },
    projectInfo: { type: String },
    projectType:{
        projectType:String,
        link:String
    },
    similarProduct:{type:String},
    isActive: { type: Boolean, default: true },
    platform: [],
    category: {
        id: String,
        name: String
    },
    user: {
        id: String,
        name: String
    },
    mUserId: { type: String, default:"" },
    dateString: { type: String },
    statusBar:{
        product:{
         completed:{type:Boolean,default:false},
         completedDate:{type:String,default:""}
        },
        design:{
            completed:{type:Boolean,default:false},
            completedDate:{type:String,default:""}
        },
        timeline:{
            completed:{type:Boolean,default:false},
            completedDate:{type:String,default:""}
        }
    },
    userProposal:{
        startTime:{type:String,default:""},
        timeline:{type:String,default:""},
        budgetRange:{type:String,default:""},
        designObjective:{type:String,default:""},
        designServices:{type:String,default:''},
        referenceLink:[]
    },
    proposal: {
        timeEstimation: String,
        costEstimation: String,
        tags: String,
        expectedHours: String
    },
    conversationStage: {
        running: {
            status: { type: Boolean, default: true },
            date: { type: String, default: moment().tz('Asia/Kolkata').format('MM/DD/YYYY') },
            time: { type: String, default: moment().tz('Asia/Kolkata').format('LLLL') }
        },
        complete: {
            status: { type: Boolean, default: false },
            date: { type: String },
            time: { type: String }
        },
        // hold: {
        //     status: { type: Boolean, default: false },
        //     date: { type: String },
        //     time: { type: String }
        // },
        yetToStart: {
            status: { type: Boolean, default: false },
            date: { type: String },
            time: { type: String }
        }
    },
    documentStage: {
        running: {
            status: { type: Boolean, default: false },
            date: { type: String },
            time: { type: String }
        },
        complete: {
            status: { type: Boolean, default: false },
            date: { type: String },
            time: { type: String }
        },
        // hold: {
        //     status: { type: Boolean, default: false },
        //     date: { type: String },
        //     time: { type: String }
        // },
        yetToStart: {
            status: { type: Boolean, default: false },
            date: { type: String },
            time: { type: String }
        }
    },
    ongoingStage: {
        running: {
            status: { type: Boolean, default: false },
            date: { type: String },
            time: { type: String }
        },
        complete: {
            status: { type: Boolean, default: false },
            date: { type: String },
            time: { type: String }
        },
        // hold: {
        //     status: { type: Boolean, default: false },
        //     date: { type: String },
        //     time: { type: String }
        // },
        yetToStart: {
            status: { type: Boolean, default: false },
            date: { type: String },
            time: { type: String }
        }
    },
    team: [{
        designation: String,
        userId: String,
        userName: String
    }],
    userDocumentLink:[],
    documentLink:[],
    domain:[],
    module: [{
        module: String
    }],
    status: { type: String },

    //pooja's fields
    domainName:[],
    subDomains:[],
    projects:[],
    memberTypes:[],
    allTags:[],
    DLead:{
        workspaceId:String,
        name:String,
        mongooseId:String,
    },
    assigneTopDLead:[],
    assigneDPs:[],
    assignDLeadConformation:{type:Boolean, default:false},
    likeWorkSpace:{type:Boolean, default:false},
    paymentDone:{type:Boolean, default:false},

    subscriptionId:{type:String},
    period:{type:String},
    addonHours:{type:Number},
    discount:{type:Boolean, default:false},
    discountType:{type:String},
    // paidHours : [],
    // workingHours:[],

    folderId:{type:String},
    folderCreated:{type:Boolean, default:false},
    teamDetails:{
        name:{type:String},
        teamId:{type:String},
    },
    activities:[{
        activitiesCardId:{type:String},
        startDate:{type:String, default:""},
        endDate:{type:String, default:""},
        name:{type:String},
        status:{type:String},
        fileName:{type:String},
        team:[],
        deliverables:[],
        approxDesignHours:{type:String, default:""},
        approxTimeline:{type:String, default:""},
        bigTitles:{type:String, default:""},
        stages:[],
        bannerURL:{type:String, default:""},
        iconURL:{type:String, default:""},
        colorCode:{type:String, default:""},
        weeks:[],
        fileId:{type:String},
        fileCreated:{type:Boolean, default:false},
        sheetFolders:{type:String, default:""},
    }],
    signUpDate:{type:String},
    updatedDate:{type:String},

    //public channels
    productChannelId:{type:String},
    knowledgeChannelId:{type:String},
    minutesOfMeetingsChannelId:{type:String},
    // docsAndDeliverablesChannelId:{type:String},

    //private channels
    designChannelId:{type:String},
    reviewChannelId:{type:String},
    mimiChannelId:{type:String},
    mimiProductChannelId:{type:String},

    //aggrement
    aggrement:{type:Boolean, default:false},

    //status
    productStatus:{type:String, default:'Onboarding pending'}
},
{
    timestamps: { createdAt: 'createdAt', lastUpdated: 'lastUpdated' }
});



module.exports = mongoose.model('project', projectSchema);