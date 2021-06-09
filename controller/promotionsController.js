const express = require('express');
const router = express.Router();
const BASECONTROLL = require("./basecontroller");
const bethistory_model = require('../models/bethistory_model');  
const GamePlay = require('../models/users_model').GamePlay;  
const BonusMenuModel = require("../models/promotion_model").BonusMenumodel
const payment_FTD_model = require("../models/paymentGateWayModel").payment_FTD_model
const BonusHistory = require("../models/promotion_model").BonusHistory

function BettingHistory_model (dt){
    return bethistory_model.BettingHistory_model(dt);
}

router.post("/bonus_menuload",async(req,res,next)=>{
    var findhandle = "";
    findhandle = await BASECONTROLL.BfindSort(BonusMenuModel,{});
    if(!findhandle){
        res.json({status : false,data : "fail"})
        return next();
    }else{
        res.json({status : true,data : findhandle})
        return next();
    }
});

router.post("/bonus_menuloads",async(req,res,next)=>{
    var indata = req.body;
    var findhandle = [];
    findhandle = await BASECONTROLL.Bfind(BonusMenuModel,{status:true, type:req.body.type});
    if(!findhandle){
        res.json({status : false,data : "fail"})
        return next();  
    }else{
        var rows =[];
        for(var i = 0 ; i < findhandle.length ; i++){
            var last = await BASECONTROLL.BfindOne(BonusHistory,{bonusid : findhandle[i]._id,email : indata.email});
            if(!last){
                rows.push(findhandle[i]);
            }
        }
        res.json({status : true,data : rows})
        return next();
    }
});

function get_date (date, i=0){
    var d = new Date(date);
    var year = d.getFullYear();
    var month = parseInt(d.getMonth()) + 1 +i;
    var mh = month > 9 ? month : "0" + month;
    var datestring = year + "-"+mh;
    return datestring;
}

router.post("/wagered_load",async(req,res,next)=>{
    var query = req.body;
    var start = new Date(query.start);
    var end = new Date(query.end);
    var ddd = end.getMonth()+1 - start.getMonth();
    var amount = 0;
    await GamePlay.findOne({email:query.email}).then( async rdata =>{
        if(rdata){
            for(var j = 0;  j < ddd; j++){
                await BettingHistory_model(get_date(start, j)).aggregate([
                    {$match: { $and: [ { "DATE": { $gte: start } }, { "DATE": { $lte: end } }, {USERID:rdata.id}, {TYPE:'BET'} ] }},
                    {$group : {
                        _id:null,
                        AMOUNT:{$sum:"$AMOUNT"}
                    }},
                ]).then(async playersAmount=>{
                    if(playersAmount.length){
                        amount += await playersAmount[0].AMOUNT;
                    }
                })
            }
            res.json({status : true,data : amount})
            return next();
        }else{
            res.json({status : false,data : "fail" })
            return next();
        }
    })
});

router.post("/bonusmenu_delete",async(req,res,next)=>{
    var indata = req.body.data;
   
    var outdata =  await BASECONTROLL.BfindOneAndDelete(BonusMenuModel,{_id : indata._id}) 
    if(!outdata){
        res.json({status : false,data : "fail"})
        return next();
    }else{
        var findhandle = "";
        findhandle = await BASECONTROLL.BfindSort(BonusMenuModel);
        if(!findhandle){
            res.json({status : false,data : "fail"})
            return next();
        }else{
            res.json({status : true,data : findhandle})
            return next();
        }
    }
});

router.post("/bonusmenu_save",async(req,res,next)=>{
    var indata = req.body.data;
    var savehandle = await BASECONTROLL.data_save(indata,BonusMenuModel);
    if(!savehandle){
        res.json({status : false,data : "fail"});
        return next();
    }else{
        var  findhandle = await BASECONTROLL.BfindSort(BonusMenuModel);       
        if(!findhandle){
            res.json({status : false,data : "fail"})
            return next();
        }else{
            res.json({status : true,data : findhandle})
            return next();
        }
    }
});

router.post("/bonus_menuupdate",async(req,res,next)=>{
    var indata = req.body.data;
    for(var i = 0 ; i < indata.length ; i++)
    {
        var updatehandle =  await BASECONTROLL.BfindOneAndUpdate(BonusMenuModel,{_id : indata[i]._id},indata[i],);
        if(!updatehandle){
            res.json({status : false,data : "fail"});
            return next();
        }
    }
    var  findhandle = await BASECONTROLL.BfindSort(BonusMenuModel);
    if(!findhandle){
        res.json({status : false,data : "fail"})
        return next();
    }else{
        res.json({status : true,data : findhandle})
        return next();
    }
});


router.post("/Claim_request",async(req,res,next)=>{
    var data =req.body.data;
    var Bonusdata = await BASECONTROLL.BfindOne(payment_FTD_model,{email : data.email});
    if(Bonusdata){
        var fdt_amount = parseInt(Bonusdata.bonusamount);
        data['amount'] = fdt_amount;
        var uhandle = await BASECONTROLL.BfindOne(BonusHistory,{email : data.email});
        if(!uhandle){
            var shandle = await BASECONTROLL.data_save(data,BonusHistory);
            if(shandle){
                var udata = await BASECONTROLL.email_balanceandbonusupdate(data.email,fdt_amount,fdt_amount * -1);
                if(udata){
                    res.json({status : true,data : fdt_amount});
                    return next();
                }else{
                    res.json({status : false,});
                    return next();                            
                }
            }else{
                res.json({status : false,});
                return next();            
            }
        }else{
            res.json({status : false,});
            return next();     
        }
    }else{
        res.json({status : false,});
        return next();
    }
});
    

module.exports = router;