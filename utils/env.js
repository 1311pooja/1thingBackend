
var express = require('express');
var app = express();

if ('local' == app.get('env') || 'development' == app.get('env')) {
    console.log("currently running on ", app.get('env'))
    // var team_id = "iqnth66oafbazem3o3p7p9fsoy"; 
    //teams ids
    var team_id = "mjzran9g6bbodkrajtk5hmne7w"; //onething
    var monochrome_team="aikobea7epn95npn6yt8ydmgfa";
    var town_hall="5nxrm1e84jgdbcyxhx17asdnsr";


    var base_path = "https://staging.1thing.io/";
    var designer_admin = {
        email: "manik@1thing.design",
        password: "manik314"

    }
    var client_admin = {
        email: "manik@1thing.design",
        password: "manik314"
    }

    var teamCreatecredentials = {
        email: "mimi@1thing.design",
        password: "care@1thing"
    }

    //var redirect_url = "http://staging.1thing.io/staging/channels/"
    var redirect_url = "https://staging.1thing.io/"
    var client_mail_array=["vipinbimt@gmail.com"];
    var designer_mail_array=["vipinbimt@gmail.com"];
    var dayLimitForEmailSend=3;

    //pooja's code for Razorpay
    
    // var key_id="rzp_test_z7HsK7M0Hi64pr";
    // var key_secret="02XdaoJQ2Coioi0imBcv6KMF";
    // var rajzorpay_path= "https://"+key_id+":"+key_secret+"@api.razorpay.com/v1/";


    var key_id="rzp_live_zwdZ0eKUI0IdAq";
    var key_secret="5A1yg40vTVvdPtON71qd9PqG";
    var rajzorpay_path= "https://"+key_id+":"+key_secret+"@api.razorpay.com/v1/";

    //users add in channel mimi
    // var userId1="tww93hfujina8moo81raraq49e"; //varun 
    // var userId2="kwnieu1pipf5pcfc43xekg8awo"; //danish
    // var userId3="ye7u8qkuz7nhiq7eia8yfyqjsc"; //mimi

    //folder id on google doc
    var parentFolderId = '1CCZ7AdjSkvmXrIWIeO42oYAnC9NpWvAF';

    //payment amount according to plan
    weekly_amount=1;
    quaterly_amount=1;
    yearly_amount=1;

    //offamount
    weekly_12perOffAmount=1;

    //plan id according to plan
    weekly_planId="plan_A0FdNrKPc6ZwnQ",//"plan_9t4sV6DjB2kspj";
    quaterly_planId="plan_9t4tmpYBFIOfWu";
    yearly_planId="plan_9t4uIUbiFkLmfg";

    //off plans
    weekly_12perOffId='plan_A1RQydbWO1k7dx';

    //total count for subcription
    weekly_count=1;
    quaterly_count=4;
    yearly_count=1;

    //minimum hours according to plan
    weekly_hours=10;
    quaterly_hours=130;
    yearly_hours=520;

}
if ('production' == app.get('env')) {
    console.log("currently running on ", app.get('env'))
    //teams ids
    var team_id = "deeaef8qbp8f3nbpw1xbkcuhph"; //onething
    var monochrome_team="jjcisg97xpydzcg9mrsptcihsa";
    var town_hall="ymo1pc7y6j8jjjt9h3ky1mwpue";
    
    
    var dayLimitForEmailSend=3;    
    var base_path = "https://workspace.1thing.io/";
    var designer_admin = {
        email: "manik@1thing.design",
        password: "Mustang@395bhp"
    }
    var client_admin = {
        email: "divanshu@1thing.design",
        password: "Cowrks@0204"
    }

    var teamCreatecredentials = {
        email: "mimi@1thing.design",
        password: "care@1thing"
    }
  //  var redirect_url = "http://workspace.1thing.io/onething/channels/";
    var redirect_url = "https://workspace.1thing.io/";
    var client_mail_array=["manik@1thing.design","varun@1thing.design","divanshu@1thing.design"];
    var designer_mail_array=["manik@1thing.design","priyank@1thing.design","shashank@1thing.design","shreya@1thing.design"]


    //pooja's code for Razorpay
    var key_id="rzp_live_zwdZ0eKUI0IdAq";
    var key_secret="5A1yg40vTVvdPtON71qd9PqG";
    var rajzorpay_path= "https://"+key_id+":"+key_secret+"@api.razorpay.com/v1/";

    //users add in channel mimi
    // var userId1="zmfxtxotdbyzzqf13zttepjz8h" //varun
    // var userId2="7ed1onfczjf3mxmnpdw9c1yfko" //danish
    // var userId3="tbuwu3qyp7gxffuu593hfijw1w" //manik

    //folder id on google doc
    var parentFolderId = '1WUiauaAWw1N44GzGcv4QrrfbghXy54Z2';

    //payment amount according to plan
    weekly_amount=2499;
    quaterly_amount=2299;
    yearly_amount=1999;

    //offamount
    weekly_12perOffAmount=2199;

    //plan id according to plan
    weekly_planId="plan_9se16kSfajtWSS";
    quaterly_planId="plan_9t4tmpYBFIOfWu";
    yearly_planId="plan_9t4uIUbiFkLmfg";

    //off plans
    weekly_12perOffId='plan_A1QxfW7Tpr7YUk';

    //total count for subcription
    weekly_count=52
    quaterly_count=4
    yearly_count=1

    //minimum hours according to plan
    weekly_hours=10;
    quaterly_hours=130;
    yearly_hours=520;
}
module.exports =
    {
        dayLimitForEmailSend:dayLimitForEmailSend,     
        team_id: team_id,
        monochrome_team:monochrome_team,
        base_path: base_path,
        designer_admin: designer_admin,
        client_admin: client_admin,
        redirect_url: redirect_url,
        client_mail_array:client_mail_array,
        designer_mail_array:designer_mail_array,
        rajzorpay_path:rajzorpay_path,
        // userId1,
        // userId2,
        // userId3,
        parentFolderId,
        teamCreatecredentials,
        weekly_amount,
        quaterly_amount,
        yearly_amount,
        weekly_planId,
        quaterly_planId,
        yearly_planId,
        weekly_count,
        quaterly_count,
        yearly_count,
        weekly_hours,
        quaterly_hours,
        yearly_hours,    
        weekly_12perOffId,
        weekly_12perOffAmount,
        town_hall
    };
