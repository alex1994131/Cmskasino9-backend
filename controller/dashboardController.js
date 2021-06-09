const bethistory_model = require('../models/bethistory_model');  
const adminUser = require('../models/users_model').adminUser;  
const GamePlay = require('../models/users_model').GamePlay;  
const totalusermodel = require('../models/users_model').totalusermodel;  
const TransactionsHistory = require('../models/paymentGateWayModel').TransactionsHistory;  
const balance_histoy = require("../models/users_model").balance_histoy;
const CONFIG = require("../config/index.json");
const BASECONTROL = require("./basecontroller");
const UsersControl = require("./userscontroller");
const SessionModel = require("../models/users_model").sessionmodel;

function BettingHistory_model (dt){
    return bethistory_model.BettingHistory_model(dt);
}

function get_date (date, i=0){
    var d = new Date(date);
    var year = d.getFullYear();
    var month = parseInt(d.getMonth()) + 1 +i;
    var mh = month > 9 ? month : "0" + month;
    var datestring = year + "-"+mh;
    return datestring;
}

exports.revenue_load =async (req,res,next) =>{
    var start = new Date(req.body.startDate);
    var end = new Date(req.body.endDate);
    var total = {};
    var role =await BASECONTROL.get_useritem_fromid(req)
    var userslist = await UsersControl.get_users_for_permission(role,start,end);
    total = await Object.assign(total, {playersRegistered:userslist.length});    
     userslist = await UsersControl.get_users_items(role);
    
    await totalusermodel.aggregate([
        {$match : { $and: [ { "date": { $gte: start } }, { "date": { $lte:end} }] }},
        {$group : { _id:{"email":"$email"}, totallogincount:{$sum:1} }}
    ]).then(async totallogincount=>{
        total = await Object.assign(total, {totallogincount:totallogincount.length});
    })
    
    var Playerslogged = [];
    var sessiondata = await BASECONTROL.Bfind(SessionModel,{role : CONFIG.USERS.player});
    for(var i = 0 ; i < sessiondata.length ; i++){
        var item = userslist.find(obj=>obj.email == sessiondata[i].email);
        if(item){
            Playerslogged.push(item);
        }
    }
    total = await Object.assign(total, {playersLoggedIn:Playerslogged.length});

    var Players = await BASECONTROL.Bfind(GamePlay);
    var totalPlayerBalance = 0;
    var totalPlayerBonusBalance = 0;
    for(var i = 0 ; i < Players.length ; i++){
        var item = userslist.find(obj=>obj.email == Players[i].email);
        if(item){
            totalPlayerBalance += Players[i].balance;
            totalPlayerBonusBalance += Players[i].bonusbalance;
        }       
    }

    total = await Object.assign(total, {playersBalance:totalPlayerBalance});
    total = await Object.assign(total, {playersBonusBalance:totalPlayerBonusBalance});
  
    var ddd = end.getMonth()+1 - start.getMonth();
    var array = [];
    for(var j = 0;  j < ddd; j++){
        await BettingHistory_model(get_date(start, j)).find({ $and: [ { "DATE": { $gte: start } }, { "DATE": { $lte:end} }] }).then(async betts=>{
            array.push(betts);
        });
    }

    var totalbets = {BET : 0,WIN : 0,CANCELED_BET: 0};

    for(var i in array){
        for(var j in array[i]){
            var item = userslist.find(obj=>obj._id == array[i][j].USERID);
            if (item){
                totalbets[array[i][j].TYPE] += array[i][j].AMOUNT ? array[i][j].AMOUNT : 0 ;
            }
        }
    }

    var Profit = totalbets.BET - totalbets.CANCELED_BET - totalbets.WIN;
    total = Object.assign(total, {Profit:Profit});
    
    var playersMakingDeposit = 0;
    var DepostiObj = {};
    var MakingDepositsAmount = 0;
    var trsdepositdata = await BASECONTROL.Bfind(TransactionsHistory,{ $and: [ { "createDate": { $gte: start } }, { "createDate": { $lte: end } }, { "status": 'deposit' }, { "resultData.status": '2' }]});
    for(var i in trsdepositdata){
        var item = userslist.find(obj=>obj.email == trsdepositdata[i].email);
        if(item){
            MakingDepositsAmount += parseFloat(trsdepositdata[i].amount);
            DepostiObj[trsdepositdata[i].email] = trsdepositdata[i].email;
        }
    }

    for(var i in DepostiObj){
        playersMakingDeposit ++;
    }

    total = await Object.assign(total, {playersMakingDeposit:playersMakingDeposit});

    var datasdeposit = await BASECONTROL.Bfind(balance_histoy,{ $and: [ { "date": { $gte: start } }, { "date": { $lte: end } },{type : 1}]});
    for(var i in datasdeposit){
        var item = userslist.find(obj=>obj.email == datasdeposit[i].email);
        if (item){
            MakingDepositsAmount += parseFloat(datasdeposit[i].amount);
        }
    }
    total = await Object.assign(total, {MakingDeposits:MakingDepositsAmount});

    var playersMakingWithdrawl = 0;
    var WithdrawlObj = {};
    var MakingWithdrawlAmount = 0;
    var trsWithdrawldata = await BASECONTROL.Bfind(TransactionsHistory,{ $and: [ { "createDate": { $gte: start } }, { "createDate": { $lte: end } }, { "status": 'payout' }, { "resultData.status": '2' }]});
    for(var i in trsWithdrawldata){
        var item = userslist.find(obj=>obj.email == trsWithdrawldata[i].email);
        if(item){
            MakingWithdrawlAmount += parseFloat(trsWithdrawldata[i].amount);
            WithdrawlObj[trsWithdrawldata[i].email] = trsWithdrawldata[i].email;
        }
    }

    for(var i in WithdrawlObj){
        playersMakingWithdrawl ++;
    }

    total = await Object.assign(total, {playersMakingWithdrawals:playersMakingWithdrawl});

    var dataswithdrawl = await BASECONTROL.Bfind(balance_histoy,{ $and: [ { "date": { $gte: start } }, { "date": { $lte: end } },{type : 2}]});
    for(var i in dataswithdrawl){
        var item = userslist.find(obj=>obj.email == dataswithdrawl[i].email);
        if (item){
            MakingWithdrawlAmount += parseFloat(dataswithdrawl[i].amount);
        }
    }

    total = await Object.assign(total, {MakingWithdrawals:MakingWithdrawlAmount});

    await res.json({status:true, data:total});
    return next();
}