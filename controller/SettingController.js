const SettingMD = require("../models/settings_model");
const BASECONTROLL =require("./basecontroller");
const ProviderCredential = SettingMD.provider_credential;
const JSONdata = require("../config/index.json")
const fs =require("fs");
const config = require("../db")

exports.get_provider_credential = async (req,res,next) =>{
    // var data = await BASECONTROLL.Bfind(ProviderCredential,{});
    if(!JSONdata){
        res.json({status : false});
        return next();
    }else{
        res.json({status : true,data : JSONdata});
        return next();
    }
}

exports.save_provider_credential =async (req,res,next) =>{
    var ndata = req.body.data;
    var ldata = await BASECONTROLL.BfindOne(ProviderCredential,{launchID : ndata.launchID});
    if(ldata){
        res.json({status : false,data : ""});
        return next();
    }else{
        var sHandle = await BASECONTROLL.data_save(ndata,ProviderCredential);
        if(!sHandle){
            res.json({status : false,data : ""});
            return next();
        }else{
            this.get_provider_credential(req,res,next);
        }
    }
}

exports.update_provider_credential=async (req,res,next) =>{
    var udata = req.body.data;
    let data = JSON.stringify(udata);
    fs.writeFileSync(config.DIR+"/config/index.json", data,(error)=>{
        if(error){

        }else{
            res.json({status  :true});
            return next();
        }
    });

    // var uphandle = await BASECONTROLL.BfindOneAndUpdate(ProviderCredential,{_id : udata._id},udata);
    // if(!uphandle){
    //     res.json({status : false,data : ""});
    //     return next();
    // }else{
    //     this.get_provider_credential(req,res,next);
    // }
}

exports.delete_provider_credential=async (req,res,next) =>{
    var udata = req.body.data;
    var uphandle = await BASECONTROLL.BfindOneAndDelete(ProviderCredential,{_id : udata._id},udata);
    if(!uphandle){
        res.json({status : false,data : ""});
        return next();
    }else{
        this.get_provider_credential(req,res,next);
    }
}