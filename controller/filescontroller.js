const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require("fs");
const config = require('../db');
const GAMELISTMODEL = require("../models/games_model").GAMELISTMODEL;

router.post('/betsoftsetgameImage',multer({dest:config.BASEURL}).any(), (req,res,next) => {

  var filename = req.files[0].filename;
  var filetype = req.files[0].mimetype.split("/")[1];
  var now_path = config.BASEURL + filename;
  var new_path = config.BASEURL + filename + "." + filetype;
 
  fileupload(now_path,new_path,filename,filetype,req.body.id,function(rdata){
    if(!rdata){
      res.json({
        status: false
      });
      return next();
    }else{
      res.json({
        status: true
      });
    }
  })
});

function fileupload(now_path,new_path,filename,filetype,id,callback){
  fs.rename(now_path , new_path, function(err){
    if(err) {
      callback(false);
    }else{
      var res = null;
      var Model = GAMELISTMODEL;
      Model.findOne({_id: id}).then((result) => {
        if(!result)
        {
          callback(false);
        }else{
          res = result;
          if(res.image != ""){
            var del_path = config.BASEURL  + res.image;
            fs.unlink(del_path, (err)=>{
                Model.findOneAndUpdate({_id: id}, {image: filename + "." + filetype}).then(data => {
                  if(!data) {
                    callback(false);
                  }else {
                    callback(true);
                  }
                })            
            })
          }else{
            Model.findOneAndUpdate({_id: id}, {image: filename + "." + filetype}).then(data => {
              if (!data) {
                callback(false)              
              }else {
                callback(true);
              }
            })
          }            
        } 
      })      
    }
  });
}


module.exports = router;