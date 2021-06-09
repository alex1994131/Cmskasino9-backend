const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const config = require("../config/index.json").GAMEMNG.table

const PROVIDERMODELS = ()=>{
    var  UserSchema = new Schema({
        type: {
            type: Object,
            default : {}
        },  
        provider: {
            type: String,
            required  :true,
        },
        text: {
            type: String,
            required  :true,
        },
        bool : {
            type : Object,
            required : true
        },
        order : {
            type : Number,
            default : 0
        },
        status : {
            type : Boolean,
            default : false
        },
        Route : {
            type : Boolean,
            default : false
        },
        Money : {
            type : String,
            required : true
        },
        Percentage : {
            type : String,
            required : true
        },
        currency : {
            type : String,
            required : true
        },
        Type : {
            type : String,
            required : true
        },
        LAUNCHURL : {
            type : String,
            required : true
        },

    });
  return  mongoose.model(config.GAMEPROVIDERSMODEL, UserSchema)
}

const GAMELISTMODEL = () =>{
    var  UserSchema = new Schema({
        TYPE: {
            type: String,
            default : ''
        },
        ID : {
            type : String,
            default : ''
        },
        NAME : {
            type : String,
            default : ''
        },    
        status : {
            type : Boolean,
            default : false
        },
        backImage : {
            type : String,
            default : "",
        },
        gameImage : {
            type : String,
            default : "",
        },
        fpstatus : {
            type : Boolean,
            default : false
        },
        PROVIDERID :{
            type : String,
            default : ""
        },
        WITHOUT : {
            type:Object,
            default :{
                maxbet : 0,
                minbet : 0
            }
        },
        LAUNCHURL : {
            type : String,
            required : true
        },
        image : {
            type : String,
            default : ""
        },
        order :{
            type : Number,
            required : true
        }
    });
    return mongoose.model(config.GAMELIST, UserSchema)
}


const FIRSTPAGE_GAMELIST_MODEL = ()=>{
    var  UserSchema = new Schema({
        gameid : {
            type : String,
            required : true
        },
        order : {
            type : Number,
            default : 0
        },
        status : {
            type : Boolean,
            default : false
        },
        type : {
            type : String,
            required : true
        }
    });
  return  mongoose.model(config.FIRSTPAGE_GAMELIST, UserSchema)
}



module.exports = {
    PROVIDERMODELS : PROVIDERMODELS(),
    GAMELISTMODEL : GAMELISTMODEL(),
    FIRSTPAGE_GAMELIST_MODEL : FIRSTPAGE_GAMELIST_MODEL()
}
