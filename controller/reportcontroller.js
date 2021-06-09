const bethistory_model = require('../models/bethistory_model');  
const GAMELISTMODEL = require('../models/games_model').GAMELISTMODEL;  
const GamePlay = require('../models/users_model').GamePlay;  
const BASECON = require("./basecontroller");
const PROVIDERMODELS = require("../models/games_model").PROVIDERMODELS;
const UsersControl = require("./userscontroller")
const BASECONTROL = require("./basecontroller");
const UserModel = require("../models/users_model").adminUser

function BettingHistory_model (dt){
    return bethistory_model.BettingHistory_model(dt);
}

exports.reports_email_load = async(req,res,next)=>{

    var query = req.body
    var start = new Date(query.start);
    var end = new Date(query.end);
    var total = get_Months(start,end);
    var array = [];
    await GamePlay.findOne({email:query.email}).then(async rdt=>{
        if(rdt){ 
            for(var j = 0;  j < total; j++){
                await BettingHistory_model( get_bettingtable_prefix(start,j))
                .find({DATE: {$gte: start,$lte:end}, USERID:rdt.id},).sort({DATE : -1}).then(async rdata =>{
                    if(rdata&&rdata.length){
                        for(var k in rdata){
                            await GAMELISTMODEL.findOne({LAUNCHURL:rdata[k].LAUNCHURL, ID:rdata[k].GAMEID}).then(async gamelist=>{
                                if(gamelist){
                                    await array.push(Object.assign({},gamelist._doc, rdata[k]._doc)) ;
                                }else{
                                    await array.push(Object.assign({}, rdata[k]._doc)) ;
                                }
                            })
                        }
                    }
                })
            }
        }
    })
    if(array.length){
        res.json({status : true,data : array});
        return next();
    }else{
        res.json({status : false,data : array})
        return next();
    }
}

async function get_signup_count(userslist,start,end){
    // var start = "2020-09-01";
    start = new Date(start)
    end = new Date(end)
    var index = get_Months(start,end);
    var row ={}
    for(var i in userslist){
        if (!row[userslist[i]._id]){
            for(var j = 0;  j < index; j++){
                await BettingHistory_model( get_bettingtable_prefix(start,j)).findOne({$and: [ { "DATE": { $gte: start } }, { "DATE": { $lte: end } },{USERID : userslist[i]._id}]}).then(rdata=>{
                    if(rdata){
                       row[userslist[i]._id] = true;
                    }
                });
            }
        }
    }
    var totalcount = 0;
    for(var i in row){
        totalcount ++;
    }
    return totalcount;
}


exports.reports_PLAYERID_load = async(req,res,next)=>{
    var sdate = req.body.sdate;
    var edate = req.body.edate;
    var role =await BASECONTROL.get_useritem_fromid(req)
    var userslist = await UsersControl.get_users_items(role);

    var start = new Date(sdate);
    var end = new Date(edate);
    var ddd = get_Months(start,end);
    var array = [];
    for(var j = 0;  j < ddd; j++){
        await BettingHistory_model( get_bettingtable_prefix(start,j)).find({ $and: [ { "DATE": { $gte: start } }, { "DATE": { $lte: end } }]}).then(rdata=>{
            if(rdata){
                array.push(rdata);
            }
        });
    }
    var rows_key =  {}
    for(var i in array ){
        for(var j in array[i]){
            var item = userslist.find(obj => obj._id == array[i][j].USERID );
            if(item){
                var lastd = await BASECONTROL.BfindOne(GAMELISTMODEL,{LAUNCHURL : array[i][j].LAUNCHURL,ID : array[i][j].GAMEID });
                if(lastd){
                    var newrow = Object.assign({}, lastd._doc ? lastd._doc : lastd,array[i][j]._doc ? array[i][j]._doc : array[i][j]);
                    if(!rows_key[newrow.USERID]){
                        var users = await BASECONTROL.BfindOne(UserModel,{_id : newrow.USERID});
                        if(users){
                            rows_key[newrow.USERID] = {
                                WIN : 0,
                                BET : 0,
                                CANCELED_BET : 0,
                                USERID : newrow.USERID,
                                USERNAME : users.username,
                                ID : users.id
                            }
                        }
                    }
                    var bool = newrow.TYPE;
                    rows_key[newrow.USERID][bool] += newrow.AMOUNT;
                }
            }
        }
    }

    var array1 = [];
    var totalwin = 0;
    var totalbet = 0;
    var totalggr = 0;
    for(var i in rows_key){
        var GGR = rows_key[i].BET - rows_key[i].WIN - rows_key[i].CANCELED_BET;
        totalwin += rows_key[i].WIN;
        totalbet += rows_key[i].BET;
        totalggr += GGR;
        var row = Object.assign({},rows_key[i],{GGR : GGR});
        array1.push(row)
    }    

    var signuplist  = await BASECONTROL.Bfind(UserModel,{ $and: [ { "date": { $gte: start } }, { "date": { $lte: end } }]});
    var signupcount = signuplist.length;  
    var realplayerscount = await get_signup_count(userslist,sdate,edate)
    totalwin =  totalwin ? totalwin.toFixed(2) : totalwin;
    totalbet =  totalbet ? totalbet.toFixed(2) : totalbet;
    totalggr =  totalggr ? totalggr.toFixed(2) : totalggr;

    res.json({status : true,data : array1,userlist : userslist,toptbl :  {totalwin : totalwin ,totalbet : totalbet,totalggr : totalggr, signupcount :signupcount ,realplayerscount : realplayerscount}});
    return next();
    
}

// async function report_game_player_id(sdate,edate,req){
//     var start = new Date(sdate);
//     var end = new Date(edate);
//     var role =await BASECONTROL.get_useritem_fromid(req)
//     var userslist = await UsersControl.get_users_items(role);

//     var ddd = end.getMonth()+1 - start.getMonth();
//     var array = [];
//     for(var j = 0;  j < ddd; j++){
//         await BettingHistory_model(get_date(start, j)).aggregate([
//             {$match: { $and: [ { "DATE": { $gte: start } }, { "DATE": { $lte: end } } ] }},
//             {$group: {
//                 _id: {
//                     "GAMEID": "$GAMEID",
//                     "USERID": "$USERID",
//                     "TYPE": "$TYPE",
//                     "LAUNCHURL": "$LAUNCHURL"
//                 },
//                 AMOUNT: {$sum: '$AMOUNT'},
//             }},
//             { $group: {
//                 "_id": {
//                     "GAMEID":"$_id.GAMEID",
//                     "USERID":"$_id.USERID",
//                     "LAUNCHURL":"$_id.LAUNCHURL",
//                 },
//                 "DATA": { 
//                     "$push": { 
//                         "AMOUNT": "$AMOUNT",
//                         "TYPE": "$_id.TYPE",
//                     },
//                 },
//             }},
//         ]).then(async rdata =>{
//             if(rdata&&rdata.length){
//                 for(var k in rdata){
//                     var item = userslist.find(obj=>obj._id == rdata[k]._id.USERID);
//                     if(item){
//                         var keyData = [];
//                         var valueData = [];
//                         for(var z in rdata[k].DATA){
//                             keyData.push(rdata[k].DATA[z].TYPE);
//                             valueData.push(rdata[k].DATA[z].AMOUNT);
//                         }
//                         var result =  valueData.reduce(function(result, field, index) {
//                             result[keyData[index]] = field;
//                             return result;
//                         }, {});
                        
//                             await GAMELISTMODEL.findOne({LAUNCHURL:rdata[k]._id.LAUNCHURL, ID:rdata[k]._id.GAMEID}).then(async gamelist=>{
//                                 if(gamelist){
//                                     await GamePlay.findOne({id:rdata[k]._id.USERID}).then(async userlist=>{
//                                         if(userlist){
//                                             await array.push(Object.assign({}, rdata[k]._id, {id:userlist.pid}, {userName:userlist.username}, result, 
//                                                 {Gtype:gamelist.TYPE}, {Gname:gamelist.NAME},{PROVIDERID:gamelist.PROVIDERID} ));
//                                         }else{
//                                         }
//                                     })
//                                 }else{
//                                 }
//                             })
//                     }
//                 }
//             }
//         })
//     }
//     for(var i in array){
//         for(var j = 0; j < i; j++){
//             if(array[i].GAMEID==array[j].GAMEID&&array[i].LAUNCHURL==array[j].LAUNCHURL&&array[i].USERID==array[j].USERID){
//                 var win = (Number(array[i].WIN)?array[i].WIN:0)+(Number(array[j].WIN)?array[j].WIN:0);
//                 var bet = (Number(array[i].BET)?array[i].BET:0)+(Number(array[j].BET)?array[j].BET:0);
//                 var cancel_bet = (Number(array[i].CANCELED_BET)?array[i].CANCELED_BET:0)+(Number(array[j].CANCELED_BET)?array[j].CANCELED_BET:0);
//                 var object={
//                     GAMEID:array[i].GAMEID,
//                     LAUNCHURL:array[i].LAUNCHURL,
//                     Gtype:array[i].Gtype,
//                     Gname:array[i].Gname,
//                     PROVIDERID:array[i].PROVIDERID,
//                     userName:array[i].userName,
//                     id:array[i].id,
//                     WIN:win,
//                     BET:bet,
//                     CANCEL_BET:cancel_bet,
//                 }
//                 array[i]=object;
//                 array[j]={BIN:'BIN'}
//             }
//         }
//     }
//     var resultData=[];
//     for(var i in array){
//         if(array[i].BIN!=='BIN'){
//             resultData.push(array[i]);
//         }
//     }
//     if(resultData.length){
//         return resultData;
//     }else{
//         return [];
//     }
// }

exports.report_game_player_id = async (req,res,next)=>{
    var sdate = req.body.sdate;
    var edate = req.body.edate;
    // var pdata = await BASECON.BfindSort(PROVIDERMODELS,{status : true});
    // var result =  await report_game_player_id(sdate,edate,req);
    res.json({status : true,data : {data : result,provider : pdata}});
    return next();
}

exports.report_provider_id = async (req,res,next)=>{

    var role =await BASECONTROL.get_useritem_fromid(req)
    var userslist = await UsersControl.get_users_items(role);
    var pdata = await BASECON.BfindSort(PROVIDERMODELS,{status : true});
    var start = new Date(req.body.sdate);
    var end = new Date(req.body.edate);
    var ddd = get_Months(start,end);
    var array = [];
    for(var j = 0;  j < ddd; j++){
        await BettingHistory_model(get_bettingtable_prefix(start,j)).find({ $and: [ { "DATE": { $gte: start } }, { "DATE": { $lte: end } }]}).then(rdata=>{
            if(rdata){
                array.push(rdata);
            }
        });
    }
    var rows_key =  {}
    for(var i in array ){
        for(var j in array[i]){
            var item = userslist.find(obj => obj._id == array[i][j].USERID );
            if(item){
                var lastd = await BASECONTROL.BfindOne(GAMELISTMODEL,{LAUNCHURL : array[i][j].LAUNCHURL,ID : array[i][j].GAMEID });
                if(lastd){
                    var newrow = Object.assign({}, lastd._doc,array[i][j]._doc ? array[i][j]._doc : array[i][j]);
                    if(!rows_key[newrow.PROVIDERID]){
                        rows_key[newrow.PROVIDERID] = {
                            WIN : 0,
                            BET : 0,
                            CANCELED_BET : 0
                        }
                    }
                    var bool = newrow.TYPE;
                    rows_key[newrow.PROVIDERID][bool] += newrow.AMOUNT;
                }
            }
        }
    }
    var totalwin = 0;
    var totalbet = 0;
    var totalggr = 0;
    var array1 = [];
    for(var i in rows_key){
        var GGR = rows_key[i].BET - rows_key[i].WIN - rows_key[i].CANCELED_BET;
        totalwin += rows_key[i].WIN;
        totalbet += rows_key[i].BET;
        totalggr += GGR;
        var row = Object.assign({},rows_key[i],{PROVIDERID : i},{GGR : GGR});
        array1.push(row)
    }

    var signuplist  = await BASECONTROL.Bfind(UserModel,{ $and: [ { "date": { $gte: start } }, { "date": { $lte: end } }]});
    var signupcount = signuplist.length;    
    var realplayerscount = await get_signup_count(userslist,start,end)
    totalwin =  totalwin ? totalwin.toFixed(2) : totalwin;
    totalbet =  totalbet ? totalbet.toFixed(2) : totalbet;
    totalggr =  totalggr ? totalggr.toFixed(2) : totalggr;


    res.json({status:true, data:array1,provider :pdata,toptbl :  {totalwin : totalwin ,totalbet : totalbet,totalggr : totalggr, signupcount :signupcount ,realplayerscount : realplayerscount}})
    return next();    
}

function get_bettingtable_prefix(start,i){
    var date = new Date(start);
    var year = date.getFullYear();
    var smonth = date.getMonth() + 1;
    var addyear = parseInt((i + smonth) / 13);
    var fullyear = year + addyear;
    var addmonth = (i + smonth) % 12;
    addmonth = addmonth == 0 ? "12" : addmonth
    var fullmonth = addmonth > 9 ? addmonth : "0" + addmonth;
    var datestring = fullyear + "-"+fullmonth;
    return datestring
}

function get_Months(start,end){
    var date1 = new Date(start);
    var date2 = new Date(end);
    var index1 = (date2.getMonth() + 1) + 1;
    var index2 = 12 - (date1.getMonth() + 1);
    var year = date2.getFullYear() - date1.getFullYear() - 1;
    var total = index1 + index2 + year * 12;
    return total;
}

exports.reports_gameId_load =async(req,res,next)=>{
    var sdate = req.body.sdate;
    var edate = req.body.edate;
    var pdata = await BASECON.BfindSort(PROVIDERMODELS,{status : true});
    var start = new Date(sdate);
    var end = new Date(edate);
    var role =await BASECONTROL.get_useritem_fromid(req)
    var userslist = await UsersControl.get_users_items(role);
    var pdata = await BASECON.BfindSort(PROVIDERMODELS,{status : true});
    var ddd = get_Months(start,end);
    var array = [];
    for(var j = 0;  j < ddd; j++){
        await BettingHistory_model(get_bettingtable_prefix(start,j)).find({ $and: [ { "DATE": { $gte: start } }, { "DATE": { $lte: end } }]}).then(rdata=>{
            if(rdata){
                array.push(rdata);
            }
        });
    }
    var rows_key =  {}
    for(var i in array ){
        for(var j in array[i]){
            var item = userslist.find(obj => obj._id == array[i][j].USERID );
            if(item){
                var lastd = await BASECONTROL.BfindOne(GAMELISTMODEL,{LAUNCHURL : array[i][j].LAUNCHURL,ID : array[i][j].GAMEID });
                if(lastd){
                    var newrow = Object.assign({}, lastd._doc ? lastd._doc : lastd,array[i][j]._doc ? array[i][j]._doc : array[i][j]);
                    if(!rows_key[newrow.PROVIDERID + "," + newrow.ID ]){
                        rows_key[newrow.PROVIDERID + "," + newrow.ID] = {
                            WIN : 0,
                            BET : 0,
                            CANCELED_BET : 0,
                            PROVIDER : newrow.PROVIDERID,
                            GAMEID  : newrow.GAMEID,
                            GAMETYPE :  lastd.TYPE,
                            GAMENAME : newrow.NAME,
                            users : {}
                        }
                    }
                    var bool = newrow.TYPE;
                    rows_key[newrow.PROVIDERID + "," + newrow.ID][bool] += newrow.AMOUNT;
                    rows_key[newrow.PROVIDERID + "," + newrow.ID]["users"][newrow.USERID]= true; 
                }
            }
        }
    }

    var array1 = [];
    var totalwin = 0;
    var totalbet = 0;
    var totalggr = 0;
    for(var i in rows_key){
        var GGR = rows_key[i].BET - rows_key[i].WIN - rows_key[i].CANCELED_BET;
        var index = 0;
        for(var j in rows_key[i].users){
            index ++;
        }
        totalwin += rows_key[i].WIN;
        totalbet += rows_key[i].BET;
        totalggr += GGR;
        var row = Object.assign({},rows_key[i],{GGR : GGR},{PLAYERINDEX : index});
        array1.push(row)
    }

    var signuplist  = await BASECONTROL.Bfind(UserModel,{ $and: [ { "date": { $gte: start } }, { "date": { $lte: end } }]});
    var signupcount = signuplist.length;
    var realplayerscount = await get_signup_count(userslist,sdate,edate)
    totalwin =  totalwin ? totalwin.toFixed(2) : totalwin;
    totalbet =  totalbet ? totalbet.toFixed(2) : totalbet;
    totalggr =  totalggr ? totalggr.toFixed(2) : totalggr;

    res.json({status : true,data : {data : array1,provider : pdata},toptbl :  {totalwin : totalwin ,totalbet : totalbet,totalggr : totalggr, signupcount :signupcount ,realplayerscount : realplayerscount}});
    return next();
}