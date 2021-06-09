
const BASECONTROLL = require("./basecontroller")
const FIRSTCON = require("../models/firstpage_model");
const CONFIG = require("../config/index.json")
const firstMenuModel = FIRSTCON.firstMenuModel;
const FirstpagePaymentMethodImg = FIRSTCON.FirstpagePaymentMethodImg;
const FirstpageProviderImg = FIRSTCON.FirstpageProviderImg;
const firstpagesetting = FIRSTCON.firstpagesetting;
const SliderIMGModel = FIRSTCON.SliderIMGModel;
const GAMELISTMODEL = require("../models/games_model").GAMELISTMODEL;
const FIRSTPAGE_GAMELIST_MODEL = require("../models/games_model").FIRSTPAGE_GAMELIST_MODEL;
const PROVIDERMODELS = require("../models/games_model").PROVIDERMODELS;

exports.firstpage_load = async (req,res,next) => {
    var totalData = {};
    var first_setting = await BASECONTROLL.Bfind(firstpagesetting);
    for(var i in first_setting){
        totalData[first_setting[i].type] = first_setting[i].content;
    }

    var firstpages1 =[];
    var fp1 = await BASECONTROLL.BSortfind(SliderIMGModel,{bool : "5"},{order : 1});

    for(var i = 0 ; i < fp1.length ; i++){
        var item = await BASECONTROLL.BfindOne(GAMELISTMODEL,{_id : fp1[i].data.gamedata});
        var dd = Object.assign({},item._doc ? item._doc : item,fp1[i]._doc ? fp1[i]._doc :fp1[i] ,);
        firstpages1.push(dd);
    }

    var firstpages2 = [];
    var fp2 = await BASECONTROLL.BSortfind(SliderIMGModel,{bool : "6"},{order : 1});
    for(var i = 0 ; i < fp2.length ; i++){
        var item = await BASECONTROLL.BfindOne(GAMELISTMODEL,{_id : fp2[i].data.gamedata});
        var dd = Object.assign({},item._doc ? item._doc : item,fp2[i]._doc ? fp2[i]._doc :fp2[i] ,);
        firstpages2.push(dd);
    }
    
    var firstpages3 = [];
    var fp3=  await BASECONTROLL.BSortfind(SliderIMGModel,{bool : "7"},{order : 1});
    for(var i = 0 ; i < fp3.length ; i++){
        var item = await BASECONTROLL.BfindOne(GAMELISTMODEL,{_id : fp3[i].data.gamedata});
        var dd = Object.assign({},item._doc ? item._doc : item,fp3[i]._doc ? fp3[i]._doc :fp3[i] ,);
        firstpages3.push(dd);
    }
    
    totalData['firstpages1'] = firstpages1;
    totalData['firstpages2'] = firstpages2;
    totalData['firstpages3'] = firstpages3;
    var firstmenu = await BASECONTROLL.BSortfind(firstMenuModel,{bool : "1",status : true},{order : 1});
    var firstquick = await BASECONTROLL.BSortfind(firstMenuModel,{bool : "2",status : true},{order : 1});
    var privacypolicy = await BASECONTROLL.BSortfind(firstMenuModel,{bool : "5",status : true},{order : 1});
    var sociallink = await BASECONTROLL.BSortfind(firstMenuModel,{bool : "3",status : true},{order : 1});
    var newtext = await BASECONTROLL.BSortfind(firstMenuModel,{bool : "4",status : true},{order : 1});
    var faqpage = await BASECONTROLL.BSortfind(firstMenuModel,{bool : "6",status : true},{order : 1});
    var contactus = await BASECONTROLL.BSortfind(firstMenuModel,{bool : "7",status : true},{order : 1});
    var aboutus = await BASECONTROLL.BSortfind(firstMenuModel,{bool : "8",status : true},{order : 1});
    totalData['firstmenu'] = firstmenu;
    totalData['contactus'] = contactus;
    totalData['firstquick'] = firstquick;
    totalData['privacypolicy'] = privacypolicy;
    totalData['faqpage'] = faqpage;
    totalData['newtext'] = newtext;
    totalData['sociallink'] = sociallink;
    totalData['aboutus'] = aboutus;
    var paymentimgs = await BASECONTROLL.Bfind(FirstpagePaymentMethodImg)
    var providerimgs = await BASECONTROLL.Bfind(FirstpageProviderImg)
    totalData['paymentimgs'] = paymentimgs;
    totalData['providerimgs'] = providerimgs;
    var get_list = await BASECONTROLL.BSortfind(FIRSTPAGE_GAMELIST_MODEL,{type : "2"},{order : 1});
    var livecasinoitems = [];
    for(var i = 0 ; i < get_list.length ; i++){
        var item = await BASECONTROLL.BfindOne(GAMELISTMODEL,{_id : get_list[i].gameid});
        var dd = Object.assign({},item._doc ? item._doc : item,get_list[i]._doc ? get_list[i]._doc :get_list[i] ,);
        livecasinoitems.push(dd);
    }
    totalData['livecasinoitems'] = livecasinoitems;
    var casinoitems = [];
    var get_list1 = await BASECONTROLL.BSortfind(FIRSTPAGE_GAMELIST_MODEL,{type : "1"},{order : 1});
    for(var i = 0 ; i < get_list1.length ; i++){
        var item = await BASECONTROLL.BfindOne(GAMELISTMODEL,{_id : get_list1[i].gameid});
        var dd = Object.assign({},item._doc ? item._doc : item,get_list1[i]._doc ? get_list1[i]._doc :get_list1[i] ,);
        casinoitems.push(dd);
    }
    totalData['casinoitems'] = casinoitems;
    res.json({status : true,data : totalData});
    return next();
}

exports.FirstPage_menuload =async (req,res,next)=>{
    var findhandle = "";
    findhandle = await get_menuitems(firstMenuModel);
    if(!findhandle){
        res.json({status : false,data : "fail"})
        return next();
    }else{
        res.json({status : true,data : findhandle})
        return next();
    }
}

async function get_menuitems(model){
    var outdata = null;
    await model.find({status : true}).sort({order : 1}).then(rdata=>{
        if(!rdata){
            outdata = false;
        }else{
            outdata = rdata;
        }
    });
    return outdata;
}

exports.LivecasinoproviderLoad = async (req,res,next)=>{

    var bool = req.body.bool;
    var newbool={};
    newbool['bool.'+bool] = true;
    newbool['status'] = true;
    var pdata = await BASECONTROLL.BSortfind(PROVIDERMODELS,newbool,{order : 1});
    if(!pdata){
        res.json({ status : false,data : "fail" })
        return next();
    }else{
        if(pdata.length > 0)
        {
            var tdata = CONFIG.keylaunchurl_type[bool]; 
            var pro  = pdata;
            // var gamelist = await BASECONTROLL.BSortfind(GAMELISTMODEL,{PROVIDERID : pro,status : true},{order : 1});
            var gamelist = [];
            for(var i =  0 ; i < pro.length ; i++){
                var rows= await BASECONTROLL.BSortfind(GAMELISTMODEL,{PROVIDERID : pro[i].provider,status : true},{order : 1});
                for(var j = 0 ; j < rows.length ; j++ ){
                    gamelist.push(rows[j])
                }
            }

            var firstpages3 = [];
            var fp3=  await BASECONTROLL.BSortfind(SliderIMGModel,{bool : req.body.type},{order : 1});
            for(var i = 0 ; i < fp3.length ; i++){
                var item = await BASECONTROLL.BfindOne(GAMELISTMODEL,{_id : fp3[i].data.gamedata});
                var dd = Object.assign({},item._doc ? item._doc : item,fp3[i]._doc ? fp3[i]._doc :fp3[i] ,);
                firstpages3.push(dd);
            }
            res.json({status : true,data : {pdata : pdata,tdata : tdata,list : gamelist,imgs :firstpages3}})
            return next();
        }else{
            res.json({status: false,data : "No db"})
            return next();
        }
    }
}

exports.LivecasinoproviderChange = async(req,res,next)=>{

    var pro = req.body.data;
    var bool = req.body.bool;
    var gamelist = []
    for(var i =  0 ; i < pro.length ; i++){
        var rows= await BASECONTROLL.BSortfind(GAMELISTMODEL,{PROVIDERID : pro[i].value,status : true},{order : 1});
        for(var j = 0 ; j < rows.length ; j++ ){
            gamelist.push(rows[j])
        }
    }
    if(gamelist){
        res.json({status : true,data : gamelist});
        return next();
    }else{
        res.json({status : false});
        return next();
    }
}

exports.Liveslider_load =async (req,res,next) => {
    var firstpages3 = [];
    var fp3=  await BASECONTROLL.BSortfind(SliderIMGModel,{bool : req.body.bool},{order : 1});
    for(var i = 0 ; i < fp3.length ; i++){
        var item = await BASECONTROLL.BfindOne(GAMELISTMODEL,{_id : fp3[i].data.gamedata});
        var dd = Object.assign({},item._doc ? item._doc : item,fp3[i]._doc ? fp3[i]._doc :fp3[i] ,);
        firstpages3.push(dd);
    }
    if(!firstpages3){
        res.json({
            status:false,
        })
        return next();
    }else{
        res.json({
            status:true,
            data: firstpages3
        })
        return next();
    }
}