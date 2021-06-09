const express = require('express');
const router = express.Router();
// const pro_depositlimit = require('../models/profiledepositlimitmodel');
// const pro_notification = require("../models/pronotificationmodel");
const BASECONTROLL = require("./basecontroller");
const config = require('../db');
const documentModel = require('../models/profile_model').documentModel;
const pro_notification = require('../models/profile_model').pro_notification;
const usersmodel = require("../models/users_model").adminUser;
var multer  = require('multer');
var fs = require('fs');

router.post('/set_document',multer({dest:config.BASEURL}).any(),( req, res, next ) => 
{
    var uploadData = req.body;
    var filenames = "";
    var originalnames = "";
    var flag = 0;
    for(var i = 0 ; i < req.files.length ; i ++)
    {
        var filename = req.files[i].filename;
        var originalname = req.files[i].originalname;
        var filetype = req.files[i].mimetype.split("/")[1];
        // var filetype = req.files[i].originalname.split(".")[req.files[i].originalname.split(".").length-1];
        var current_path = config.BASEURL + req.files[i].filename;
        filename += "." + filetype;
        var new_path = config.BASEURL + filename;
        filenames += filename + "#|@|#";
        originalnames += originalname + "#|@|#";
        fs.rename( current_path, new_path, function(err){
            if(err) throw err;
            if(flag == req.files.length-1)
            {
                var datas = {
                    email : uploadData.email,
                    verifyId : uploadData.verifyId,
                    filename : filenames, 
                    name : originalnames, 
                };
                const newupload = new documentModel(datas);
                newupload.save().then( rdatas =>{
                    if(!rdatas){
                        res.json({ status : false, msg : 'Failure' })
                    }else{
                        documentModel.find({email:uploadData.email}).then( rdata =>{
                            if(!rdata){
                                res.json({status : false,data : "fail"});
                                return next();
                            }else{  
                                res.json({ status : true, data: rdata });
                                return next();
                            }
                        })
                    }
                })
            }
            flag++;
        })
    }
})

router.post("/get_document",async (req,res,next) =>{
    var email = req.body.email;
    var rdata = await BASECONTROLL.Bfind(documentModel,{email : email});
    if(!rdata){
        res.json({status : false,data : "fail"});
        return next();
    }else{  
        res.json({ status : true, data: rdata });
        return next();
    }
});

router.post("/profilesave",multer({dest:config.BASEURL}).any(),(req,res,next)=>{

    var users = req.body;
    var filename = req.files[0].filename;
    var filetype = req.files[0].mimetype.split("/")[1];
    var now_path = config.BASEURL + filename;
    var new_path = config.BASEURL + filename + "." + filetype;
    

    profilesave(now_path,new_path,filename,filetype,users,async(rdata)=>{
      if(!rdata){
        res.json({
          status: false
        });
        return next();
      }else{
            var rdata = await BASECONTROLL.BfindOne(usersmodel,{email : users.email});
            if(!rdata){
                res.json({
                    status: false
                });
                return next();
            }else{
                res.json({
                    status: true,
                    data : rdata
                });
                return next();
            }
      }
    })
});

function profilesave(now_path,new_path,filename,filetype,users,callback){
    fs.rename(now_path , new_path,async(err)=>{
        if(err) {
            callback(false);
        }else{
            var Model = usersmodel;
            var result = await BASECONTROLL.BfindOne(Model,{email : users.email});
            if(result){
                // if(!result.avatar){
                //     callback(false);
                // }else{
                    users['avatar'] = filename+"."+filetype;
                    var data = await BASECONTROLL.BfindOneAndUpdate(Model,{email : users.email},users);
                    if(!data) {
                        callback(false);
                    }else {
                        callback(true);
                    }
                // }
            }else{
                users['avatar'] = filename+"."+filetype;
                var del_path = config.BASEURL  + result.avatar;
                fs.unlink(del_path, async(err)=>{
                    var data = await BASECONTROLL.BfindOneAndUpdate(Model,{email : users.email},users);
                    if(!data) {
                        callback(false);
                    }else{
                        callback(true);
                    }
                })
            }
        }
    });
}

router.post("/set_notification",async(req,res,next)=>{
    var data = req.body.data;
    var rdata = await BASECONTROLL.BfindOneAndUpdate(pro_notification,{email : data.email},data);
    if(!rdata){
        var newdata = await BASECONTROLL.data_save(data,pro_notification);
        if(!newdata){
            res.json({
                status : false,
                data : "fail"
            })
            return next();
        }else{
            res.json({
                status : true,
                data : newdata
            })
            return  next();
        }
    }else{
        res.json({
            status : true,
            data : rdata
        })
        return next();
    }
})

router.post("/get_notification",async(req,res,next)=>{
    var rdata = await BASECONTROLL.BfindOne(pro_notification,{email : req.body.data});
    if(!rdata){
        res.json({status : false,data : "no database"})
        return next();
    }else{  
        res.json({status : true,data : rdata})
        return next();
    }
})


module.exports = router;