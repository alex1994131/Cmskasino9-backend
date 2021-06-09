const express = require('express');
const router = express.Router();
const BASECON = require("../controller/basecontroller")
const sports_list = require("../models/sports_model").sports_list;
const odds_change = require("../models/sports_model").odds_change;
const user_bet = require("../models/sports_model").user_bet;
const net_player = require("../models/users_model").GamePlay;


function run () {
    // odds_change.updateMany({} , {permission : true});
    sports_list.updateMany({} , {category : []}).then({})
}
run();

router.post("/load_sportsdata",async(req,res,next)=>{
    var rdata =  await BASECON.BSortfind(sports_list,{},{order :1 })
    if(rdata){
        res.json({status : true,data : rdata});
        return next();
    }else{
        res.json({status : false});
        return next();
    }
});

router.post("/sports_update",async (req,res,next)=>{
    var indata = req.body.data;
    for(var i = 0 ; i < indata.length ; i++)
    {
        delete indata[i]._id
        var updatehandle =  await BASECON.BfindOneAndUpdate(sports_list,{sport_id : indata[i].sport_id},indata[i]);
        if(!updatehandle){
            res.json({status : false,data : "fail"});
            return next();
        }
    }
    var  findhandle = await BASECON.BSortfind(sports_list,{},{order :1 });
    if(!findhandle){
        res.json({status : false,data : "fail"})
        return next();
    }else{
        res.json({status : true,data : findhandle})
        return next();
    }
});

router.post("/load_sportsdata_player",async(req,res,next)=>{
    var list_data =  await BASECON.BSortfind(sports_list,{status : true},{order :1 });
    var odds_data = await BASECON.Bfind(odds_change , {flag : true});
    res.json({status : true,data : {list_data,odds_data}})
});

/////////////////////////////////////////////////////////////////////////////////////
router.post("/load_sportslist_admin",(req,res,next)=>{
    odds_change.distinct("sportid" ,  {$nor : [{EventStatus : "Finished"}]}).then( async (row) => {
        var query = [];
        for(var i = 0 ; i < row.length ; i ++){
            var temp = {
                sport_id : row[i]
            }
            query.push(temp);
        }
        if(query.length == row.length){
            var list_data =  await BASECON.BSortfind(sports_list,{ status : true , $or:query },{order :1 });
            if(!list_data){
                list_data = [];
            }
            res.json({status : true,data : {list_data}});
            return next();
        }
    })
});

router.post("/load_sportsodds_bysportid",async(req,res,next)=>{
    var data = req.body;
    var odds_data = null;
    if(data.EventStatus == "Live"){
        odds_data = await BASECON.Bfind(odds_change,{sportid : data.sportid , $or:[{EventStatus : "Live"} , {EventStatus : "Suspended" }]});
    }else{
        odds_data = await BASECON.Bfind(odds_change,{sportid : data.sportid , EventStatus : data.EventStatus});
    }
    res.json({status : true,data : {odds_data}})
});

router.post("/remove_duplicate" , async(req , res , next) => {
    var data = req.body;
    var updateData = await BASECON.BfindOne(odds_change,{_id : data[1]});
    var update = {};
    update = {
        event_name: updateData.event_name,
        sportid: updateData.sportid,
        ScheduledTime: updateData.ScheduledTime,
        EventStatus: updateData.EventStatus,
        Status: updateData.Status,
        Venue: updateData.Venue,
        HomeCompetitor: updateData.HomeCompetitor,
        AwayCompetitor: updateData.AwayCompetitor,
        Season: updateData.Season,
    }
    if(updateData.market) update.market = updateData.market;
    odds_change.updateOne({_id : data[0]} , update , (err) => {
    });
    odds_change.deleteOne({_id : data[1]} , (err) => {
    })
    res.send(true);
    return next();
})

router.post("/changeStatus_admin",async(req,res,next)=>{
    var data = req.body;
    odds_change.updateOne({event_id : data.row.event_id} , {permission : data.row.permission} , async (err)=>{
        if(!err){
            var odds_data = [];
            if(data.data.EventStatus == "Live"){
                odds_data = await BASECON.Bfind(odds_change,{sportid : data.data.sportid , $or:[{EventStatus : "Live"} , {EventStatus : "Suspended" }]});
            }else{
                odds_data = await BASECON.Bfind(odds_change,{sportid : data.data.sportid , EventStatus : data.data.EventStatus});
            }
            
            res.json({status : true,data : {odds_data}})                    
            return next();
        }
    })
});

// //////////////////////////////////////////////////////////////////////////////////
// Front-end ////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

router.post("/load_sportslist_player",(req,res,next)=>{
    var EventStatus = req.body.data;
    var condition = {};
    if(EventStatus == "All"){
        condition = { $nor : [{EventStatus : "Finished"}] , permission : true };
    }else{
        condition = { EventStatus : EventStatus , permission : true };
    }

    odds_change.distinct("sportid" ,  condition).then( async (row) => {
        var query = [];
        for(var i = 0 ; i < row.length ; i ++){
            var temp = {
                sport_id : row[i]
            }
            query.push(temp);
        }
        if(query.length == row.length){
            var list_data =  await BASECON.BSortfind(sports_list,{ status : true , $or:query },{order :1 });
            if(!list_data){
                list_data = [];
            }
            res.json({status : true,data : list_data});
            return next();
        }
    })
});

router.post("/load_sportsodds_bysportid_player",async(req,res,next)=>{
    var data = req.body;
    var sendData = {recovery : data}
    var odds_data = null;
    if(data.EventStatus == "All"){
        var odds_data = await BASECON.Bfind(odds_change,{sportid : data.sportid , permission : true});
    }else if(data.EventStatus == "TopBet"){
        var odds_data = await odds_change.find({sportid : data.sportid , $nor : [{EventStatus : "Finished"}] , permission : true}).sort({betCount : -1});
    }else if(data.EventStatus == "Next24"){
        var odds_data = await odds_change.find({sportid : data.sportid , $nor : [{EventStatus : "Finished"}] , permission : true , ScheduledTime:{ $gte: Date.now() , $lt: Date.now() + 86400000 }}).sort({betCount : -1});
    }else if(data.event_id){
        var odds_data = await BASECON.Bfind(odds_change,{event_id : data.event_id});
    }else{
        var odds_data = await BASECON.Bfind(odds_change,{sportid : data.sportid , EventStatus : data.EventStatus , permission : true});
    }
    if(odds_data){
        sendData.status = true;
        sendData.data = odds_data
    }else{
        sendData.status = false;
    }
    res.json(sendData);
    return next();
});

router.post("/place_bet" , async(req,res,next) => {
    var data = req.body;
    var userData = await BASECON.BfindOne( net_player , { id : data.user });
    if(userData){
        var realBalance = (parseFloat(userData.balance) - parseFloat(data.allAmount)).toFixed(2);
        net_player.updateOne({id : data.user} , {balance : realBalance} , async(err) => {
            if(err) {
                res.json({status : false});
                return next();
            }
            else{
                var transactionId = BASECON.get_timestamp();
                for(var i = 0 ; i < data.bet.length ; i ++){
                    var saveData = data.bet[i];
                    saveData.betting.betType = data.betType;
                    saveData.betting.betId = data.betId;
                    saveData.betting.handleState = false;
                    saveData.betting.isVFHALFWIN = false;
                    saveData.betting.isDHFTHIRDWIN = false;
                    saveData.betting.isDHFHALFWIN = false;
                    saveData.betting.isVFHALFLOST = false;
                    saveData.betting.isVFALLLOST = false;
                    if(data.betType == "MULTI"){
                        saveData.betting.transactionId = transactionId;
                    }else{
                        saveData.betting.transactionId = BASECON.get_timestamp();
                    }
                    var betOdd = await BASECON.BfindOne(odds_change , {event_id : saveData.event_id});
                    if(betOdd){
                        if(!betOdd.betCount){
                            betOdd.betCount = 0;
                        }else{
                            betOdd.betCount += 1;
                        }
                        await odds_change.updateOne({event_id : saveData.event_id} , {betCount : betOdd.betCount}).then(err=>{})
                    }
                    await BASECON.data_save(saveData , user_bet);
                }
                res.json({balance : realBalance , status : true});
                return next();
            }
        })        
    }else{
        res.json({status : false});
        return next();
    }
})

router.post("/get_bet_history" , async (req , res, next) => {
    var data = req.body;
    var searchData = { USERID : data.user }
    if(data.selectId == 1){
        searchData["betting.handleState"] = false;
    }else if(data.selectId == 2){
        searchData["betting.handleState"] = true;
    }else if(data.betId){
        searchData["betting.betId"] = data.betId;
    }
    var result = await BASECON.Bfind(user_bet , searchData);
    if(result){
        res.json({status : true , data : result});
        return next();
    }else{
        res.json({status : false });
        return next();
    }
})

router.post("/cashout" , async(req , res , next) => {
    var result_item = req.body;
    var user = await BASECON.BfindOne(net_player , {id : result_item.USERID});
    var realBalance = (parseFloat(user.balance) + parseFloat(result_item.AMOUNT) - 0.1).toFixed(2);
    await net_player.updateOne({ id : result_item.USERID} , {balance : realBalance});
    await user_bet.updateMany({"betting.transactionId" : result_item.betting.transactionId} , {"betting.betResult" : "CANCEL" , "betting.handleState" : true});
    res.json({status : true});
    return next();
})

module.exports = router;