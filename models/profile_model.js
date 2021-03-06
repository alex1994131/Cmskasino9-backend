const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const config = require("../config/index.json").PROFILEMNG.table

const documentModel = ()=>{
    var  UserSchema = new Schema({
        name          : { type : String,  default : '' },
        filename      : { type : String,  default : '' },
        email         : { type : String,  default : '' },
        name          : { type : String,  default : '' },
        verifyId      : { type : String,  default : '' },
        status      : { type : String,  default :  0 },
        date          : { type : Date,    default: Date.now },
    });
    return mongoose.model(config.kycmodel, UserSchema)
}

const pro_notification = ()=>{
    var  UserSchema = new Schema({
        email: {
            type: String,
            default : ''
        },
        internalmessage : {
            type : Boolean,
            default : false
        },
        pushnotification : {
            type : Boolean,
            default : false
        },
        emailnotification : {
            type : Boolean,
            default : false
        },
        sms : {
            type : Boolean,
            default : false
        },
        phonecall :{
            type : Boolean,
            default : false
        },
        date: {
            type: Date,
            default: Date.now
        },
    });
    return mongoose.model(config.notification, UserSchema)
}

module.exports  = {
    documentModel : documentModel(),
    pro_notification : pro_notification()
}