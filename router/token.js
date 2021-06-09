const jwt =  require("jwt-simple");
const config = require('./../db');
const jwt_decode = require('jsonwebtoken');
const BASECONTROL = require("../controller/basecontroller");
var SessionModel = require("../models/users_model").sessionmodel;

exports.check_token = async(req,res,next) =>{
    var token = req.headers.authorization;
    // if(!token){
    //     res.status(404,{msg : "BAD request"})
    //     return next();
    // }else{
        // try{
        //     const tdata= await this.jwt_decode(token);
        //     var data =  await BASECONTROL.BfindOneAndUpdate(SessionModel,{email : tdata.email},{intimestamp :  new Date().valueOf()});
        //     if(data){
                next();
        //     }else{
        //         res.status(404,{msg : "BAD request"})
        //         return next();
        //     }
        // } catch (e){
        //     res.status(404,{msg : "BAD request"})
        //     return next();
        // }
    // }
}

exports.jwt_encode =async function(string){
    try{
        var token = await jwt.encode(string, config.ADMINPASSMETHOD);
        return token;
    } catch (e){
        return false;
    }
}

exports.jwt_decode =async function(string){
    try{
        var token = await jwt_decode.decode(string);
        return token;
    } catch(e){
        return false;       
    }
}