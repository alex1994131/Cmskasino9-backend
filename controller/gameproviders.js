const BASECONTROL = require("./basecontroller");
const PROVIDERMODELS = require("../models/games_model").PROVIDERMODELS;
const GAMELISTMODEL = require("../models/games_model").GAMELISTMODEL;
const fs = require("fs");
const config = require('../db');
const IMGMODEL = require("../models/firstpage_model").firstpagesetting


exports.get_allgamelist = async(req,res,next)=>{
    var findhandle = await BASECONTROL.Bfind(GAMELISTMODEL);
    if(!findhandle){
        res.json({status : false,data : "fail"})
        return next();
    }else{
        res.json({status : true,data : findhandle})
        return next();
    }
}

exports.providerload =  async(req,res,next)=>{
    
    var  findhandle = await get_menuitems(PROVIDERMODELS, req.body.bool );
    if(!findhandle){
        res.json({status : false,data : "fail"})
        return next();
    }else{
        res.json({status : true,data : findhandle})
        return next();
    }
}

exports.providersave = async(req,res,next)=>{
    var sdata = req.body.data;
    var savehandle = await BASECONTROL.data_save(sdata,PROVIDERMODELS);
    if(!savehandle){
        res.json({
            status : false,data : "fail"
        })
        return next();
    }else{

        var  findhandle = await get_menuitems(PROVIDERMODELS,req.body.bool);
    if(!findhandle){
        res.json({status : false,data : "fail"})
        return next();
    }else{
        res.json({status : true,data : findhandle})
        return next();
    }
    }
}

exports.providerupdate  = async(req,res,next)=>{
    var indata = req.body.data;
    for(var i = 0 ; i < indata.length ; i++)
    {
        var updatehandle =  await BASECONTROL.BfindOneAndUpdate(PROVIDERMODELS,{_id : indata[i]._id},indata[i]);
        if(!updatehandle){
            res.json({status : false,data : "fail"});
            return next();
        }
    }

    var  findhandle = await get_menuitems(PROVIDERMODELS,req.body.bool);
    if(!findhandle){
        res.json({status : false,data : "fail"})
        return next();
    }else{
        res.json({status : true,data : findhandle})
        return next();
    }
}

exports.providerdelete  = async(req,res,next)=>{
    var indata = req.body.data;
   
    var outdata = null;
    await PROVIDERMODELS.findOneAndDelete({_id : indata._id}).then(rdata=>{
        if(!rdata){
            outdata =false;
        }else{
            outdata = true;
        }
    });
    if(!outdata){
        res.json({status : false,data : "fail"})
        return next();
    }else{
        var findhandle = "";
        findhandle = await get_menuitems(PROVIDERMODELS, req.body.bool );
        if(!findhandle){
            res.json({status : false,data : "fail"})
            return next();
        }else{
            res.json({status : true,data : findhandle})
            return next();
        }
    }
}


async function get_menuitems(model,bool){
    var outdata = null;
    var condition = {}
    if(bool != "0"){
        condition["bool."+bool] = true;
    }
    await model.find(condition).sort({order : 1}).then(rdata=>{
        if(!rdata){
            outdata = false;
        }else{
            outdata = rdata;
        }
    });
    return outdata;
}
