
const BASECONTROL=require("./basecontroller");
const request  = require("request");
const parse = require('xml-parser');
const axios = require("axios")
const CONFIG = require("../config/index.json");
const config_dr = require('../db');
const fs = require("fs");

// var WebSocketClient = require('websocket').client;
const GAMELISTMODEL = require("../models/games_model").GAMELISTMODEL;
const PROVIDERMODELS = require("../models/games_model").PROVIDERMODELS;
const FIRSTPAGE_GEMLIST_Model = require("../models/games_model").FIRSTPAGE_GAMELIST_MODEL

const WebSocket = require('ws');
const DB = require("../config/index.json");
var wsUri = "wss://engine.livetables.io:443/GameServer/gameNotifications";
var SOCKETIO = require('socket.io-client')(DB.admindomain);

exports.LivecasinoproviderLoad =async (req,res,next)=>{

    var bool = req.body.bool;
    var row = {};
    row["bool."+bool] = true;
    row['status'] = true
    var pdata = await get_menuitems(PROVIDERMODELS,row);
    if(!pdata){
        res.json({
            status : false,data : "fail"
        })
        return next();
    }else{
        if(pdata.length > 0)
        {
            var tdata = pdata[0].type;
            if(tdata && tdata.length > 0){
                var pro  = pdata[0].provider;
                var type = tdata[0];
                var gamelist = await BASECONTROL.BSortfind(GAMELISTMODEL,{PROVIDERID : pro},{order : 1});
                res.json({status : true,data : {pdata : pdata,tdata : tdata,list : gamelist,deftype : CONFIG.keylaunchurl_type[bool] }})
                return next();
            }else{
                res.json({status : true,data : {pdata : pdata,deftype : CONFIG.keylaunchurl_type[bool]}})
                return next();
            }
        }else{
            res.json({status: false,data : "No db"})
            return next();
        }
    }
}

exports.LivecasinoproviderChange = async(req,res,next)=>{
    var pro = req.body.data;
    var gamelist = await BASECONTROL.BSortfind(GAMELISTMODEL,{PROVIDERID : pro},{order  :1});
    if(gamelist){
        res.json({status : true,data : gamelist});
        return next();
    }else{
        res.json({status : false});
        return next();
    }
}

exports.LivecasinoProviderCheck =async (req,res,next)=>{
    var provider = req.body.provider;
    var bool = req.body.bool;
    var updatehandle = null;
    await GAMELISTMODEL.updateMany({PROVIDERID : provider},{status : bool}).then(rdata=>{
        updatehandle = rdata;
    });
    if(updatehandle){
        var gamelist = await BASECONTROL.BSortfind(GAMELISTMODEL,{PROVIDERID : provider},{order :1});
        if(gamelist){
            res.json({status : true,data : gamelist});
            return next();
        }else{
            res.json({status : false});
            return next();
        }
    }else{
        res.json({status : false});
        return next();
    }
}

exports.Livecasinostatuspagecheck = async (req,res,next)=>{
    var row = req.body.row;
    var bool = req.body.bool;
    var updatehandle = null;

    await GAMELISTMODEL.findOneAndUpdate({_id : row._id},{status : bool}).then(Rdata=>{
        updatehandle = Rdata
    });
    if(updatehandle){
        var gamelist = await BASECONTROL.BSortfind(GAMELISTMODEL,{PROVIDERID :  row.PROVIDERID},{order:1});
        if(gamelist){
            res.json({status : true,data : gamelist});
            return next();
        }else{
            res.json({status : false});
            return next();
        }
    }else{
        res.json({status : false});
        return next();
    }
}

exports.LivecasinoFirstPageCheck = async (req,res,next)=>{
    var row = req.body.row;
    var bool = req.body.bool;
    var updatehandle = null;
    
    var data = await BASECONTROL.BfindOne(FIRSTPAGE_GEMLIST_Model,{gameid:row._id});
    if(!data){
        if(bool){
            var newrow = {};
            var alllist = await BASECONTROL.BSortfind(FIRSTPAGE_GEMLIST_Model,{type : req.body.type},{order : 1});
            if(alllist.length> 0){
                newrow['order'] = alllist[alllist.length -1].order + 1;
            }else{
                newrow['order'] = 0;
            }
            newrow['type'] = req.body.type;
            newrow['gameid'] =row._id;
            var shandle = await BASECONTROL.data_save(newrow,FIRSTPAGE_GEMLIST_Model);
        }else{
            await BASECONTROL.BfindOneAndDelete(FIRSTPAGE_GEMLIST_Model,{gameid : row._id});
        }
    }else{

    }

    await GAMELISTMODEL.findOneAndUpdate({_id : row._id},{fpstatus : bool}).then(rdata=>{
        updatehandle = rdata
        });
    if(updatehandle){            
        var gamelist = await BASECONTROL.BSortfind(GAMELISTMODEL,{PROVIDERID :  row.PROVIDERID},{order : 1});
        if(gamelist){
            res.json({status : true,data : gamelist});
            return next();
        }else{
            res.json({status : false});
            return next();
        }
    }else{
        res.json({status : false});
        return next();
    }
}

exports.get_firstpage_gamelist = async (req,res,next) =>{
    var type = req.body.type;
    var get_list = await BASECONTROL.BSortfind(FIRSTPAGE_GEMLIST_Model,{type : type},{order : 1});
    var rows = [];
    for(var i = 0 ; i < get_list.length ; i++){
        var item = await BASECONTROL.BfindOne(GAMELISTMODEL,{_id : get_list[i].gameid});
        var dd = Object.assign({},item._doc ? item._doc : item,get_list[i]._doc ? get_list[i]._doc :get_list[i] ,);
        rows.push(dd);
    }
    if(rows){
        res.json({status : true,data : rows});
        return next();
    }else{
        res.json({status : false});
        return next();
    }
}

exports.update_firstpage_gamelist = async (req,res,next) =>{
    var data = req.body.data;
    for(var i = 0 ; i < data.length ; i++){
        var uhandle = await BASECONTROL.BfindOneAndUpdate(FIRSTPAGE_GEMLIST_Model,{_id : data[i]._id},{order : data[i].order});
    }
    this.get_firstpage_gamelist(req,res,next);
}

exports.delete_firstpage_gamelist = async (req,res,next) =>{
    var data=req.body.data
    var udata = await BASECONTROL.BfindOneAndDelete(FIRSTPAGE_GEMLIST_Model,{gameid :data.gameid})
    var udata = await BASECONTROL.BfindOneAndUpdate(GAMELISTMODEL,{_id :data.gameid},{fpstatus : false})

    this.get_firstpage_gamelist(req,res,next);
}

exports.Livecasinoitemsadd = async (req,res,next)=>{
    var data = req.body.data;
    // var bool = req.body.data.bool;
    var fhandle = await BASECONTROL.BfindOne(GAMELISTMODEL,{PROVIDERID : data.PROVIDERID,ID : data.ID});
    if(fhandle){
        res.json({status : false,data : "fail"});
        return next();
    }else{
        var shandle = await BASECONTROL.data_save(data,GAMELISTMODEL);
        if(!shandle){
            res.json({status : false,data : "fail"});
            return next();
        }else{
            var gamelist = await BASECONTROL.BSortfind(GAMELISTMODEL,{PROVIDERID :  data.PROVIDERID},{order :1});
            if(gamelist){
                res.json({status : true,data : gamelist});
                return next();
            }else{
                res.json({status : false});
                return next();
            }
        }
    }
}

exports.Livecasinoitemsimg_upload = async (req,res,next) =>{
    var filename = req.files[0].filename;
    var filetype = req.files[0].mimetype.split("/")[1];
    var now_path = config_dr.BASEURL + filename;
    var new_path = config_dr.BASEURL + filename + "." + filetype;
    
    fileupload(now_path,new_path,filename,filetype,req.body._id,async function(rdata){
      if(!rdata){
        res.json({
          status: false
        });
        return next();
      }else{
        var gamelist = await BASECONTROL.BSortfind(GAMELISTMODEL,{PROVIDERID :  req.body.PROVIDERID},{order :1});
        if(gamelist){
            res.json({status : true,data : gamelist});
            return next();
        }else{
            res.json({status : false});
            return next();
        }
      }
    })
}

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
          var del_path = config_dr.BASEURL  + res.image;
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

exports.gameinforchange = async (req,res,next)=>{
    var row = req.body.row;
    var bool = req.body.bool;
    var updatehandle = null;
    for(var i =  0 ; i < row.length ; i++){
        await GAMELISTMODEL.findOneAndUpdate({_id : row[i]._id},row[i]).then(rdata=>{
            updatehandle = rdata
        });
    }
    if(updatehandle){
        var gamelist = await BASECONTROL.BSortfind(GAMELISTMODEL,{PROVIDERID :  row[0].PROVIDERID},{order :1});
        if(gamelist){
            res.json({status : true,data : gamelist});
            return next();
        }else{
            res.json({status : false});
            return next();
        }
    }else{
        res.json({status : false});
        return next();
    }
}

async function get_menuitems(model,condition = {}){
    var outdata = null;
    await model.find(condition).sort({order : 1}).then(rdata=>{
        if(!rdata){
            outdata = false;
        }else{
            outdata = rdata;
        }
    });
    return outdata;
}



 var typesArray = {
        1 : "Blackjack",
        2 : "Baccarat",
        3 : "Roulette",
        4 : "Bet on Numbers",
        5 : "Hybrid Blackjack",
        6 : "Keno",
        7 : "Automatic Roulette",
        8 : "Wheel of Dice",
        9 : "Sede",
        10 : "American Blackjack",
        11 : "American Hybrid Blackjack",
        12 : "Unlimited Blackjack",
        13 : "Lucky 7",
        14 : "Sic BO",
        15 : "Casino Holdem",
        16 : 'Bet on Teen Patti and 20/20 Teen Patti',
        17 : "Three Card Poker and Teen Patti",
        20 : "Baccarat KO",
        21 : "Baccarat Super 6",
        24 : "Dragon Tiger",
        25 : "No Commision Baccarat",
        26 : "Baccarat Dragon Bonus",
        27 : "BaccaratQueenco",
        28 : "BaccaratPuntoBanco",
        29 : "RoulettePortomaso",
        31 : "American Roulette",
        32 : "Triple Roulette",
        38 : "Andar Bahar"
    }   

function init()
{
  testWebSocket();
}

function testWebSocket()
{
  websocket = new WebSocket(wsUri);
  websocket.onopen = function(evt) { onOpen(evt) };
  websocket.onclose = function(evt) { onClose(evt) };
  websocket.onmessage = function(evt) { onMessage(evt) };
  websocket.onerror = function(evt) { onError(evt) };
}

function onOpen(evt)
{
    let param1 = {
        "MessageType": "InitializeSession",
        "OperatorID": CONFIG.ezugi.operatorId,
        "vipLevel": 0,
        "SessionCurrency": "INR"
    };
    param1 = JSON.stringify(param1);
    doSend(param1);
}

function onClose(evt)
{

}

async function onMessage(evt)
{
    var indata =JSON.parse(evt.data);
    var MessageType = indata.MessageType;
    switch(MessageType){
        case "InitializeSession":

            break;
        case "AuthenticateSession":
            
            break;
        case "SessionInitialized": 

        break;
        case "DealerChanged" :
            var TableId = indata.TableId;
            var DealerName = indata.NAME;
            var fdata = await BASECONTROL.BfindOne(GAMELISTMODEL,{LAUNCHURL :"3" ,ID : TableId});
            var uhandle = await BASECONTROL.BfindOneAndUpdate(GAMELISTMODEL,{LAUNCHURL : "3",ID  :TableId},{NAME : DealerName});
            
        break;

        case "ActiveTablesList" : 
            var TablesList = indata.TablesList;
            SOCKETIO.emit("ezugi_tablelist",{data : TablesList});
            await  euzgi_update(TablesList)

        break;
    }
//   websocket.close();
}

async function euzgi_update(TablesList){
    var provider = "EZUGI";
    var rows= [];
    for(var i = 0 ; i < TablesList.length ; i++)
    {
        var row = {};
        row['TYPE'] =typesArray[TablesList[i].GameType];
        row['ID'] =TablesList[i].TableId;
        row['LAUNCHURL'] = '3';
        row['image']  ="https://recording.ezugicdn.com/Dealer-Images/Single/"+TablesList[i].TableId + ".jpg"
        row['PROVIDERID'] = provider;
        row['NAME'] =TablesList[i].DealerName;
        if(!TablesList[i].IsActive){
            continue;
        }
        row['status'] = true;
        var min = TablesList[i].LimitsList[0].Min_Bet;
        var max = TablesList[i].LimitsList[0].Max_Bet;
        row['WITHOUT'] = {
            min : min,
            max : max,
            MetaTableID:TablesList[i].MetaTableID,
            DealerId:TablesList[i].DealerId,
            PlayersNumber: TablesList[i].PlayersNumber,
            PictureLink : TablesList[i].PictureLink,
            LimitsList:TablesList[i].LimitsList
        };
        rows.push(row)
    }
    var rdata = rows;
    
    for(var i = 0 ; i < rdata.length ; i++){        
        var findhandle = await BASECONTROL.BfindOne(GAMELISTMODEL,{ID : rdata[i].ID,PROVIDERID : rdata[i].PROVIDERID});
        if(!findhandle){
            var findlength = await BASECONTROL.Bfind(GAMELISTMODEL,{PROVIDERID : provider});
            rdata[i]['order'] = findlength.length + 1;
            var savehandle = await BASECONTROL.data_save(rdata[i],GAMELISTMODEL);
        }else{
            var updatehandle = await BASECONTROL.BfindOneAndUpdate(GAMELISTMODEL,{ID :rdata[i].ID,PROVIDERID : rdata[i].PROVIDERID },rdata[i]);
        }
    }
    return true;

}

function onError(evt)
{

}

function doSend(message)
{
  websocket.send(message);
}

//-------------------------"BETSOFT"
async function betsoftrefreshgames(provider,callback){
    var options = {
        'method': 'POST',
        'url': CONFIG.betsoft.gamelist+'bankId='+CONFIG.betsoft.bankId,
        'headers': {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': 'JSESSIONID=node01aro5bukviqrb1f7z0mdvy67mj5461130.node0'
        },
        form: {
          'bankId': CONFIG.betsoft.bankId,
          'version': '2'
        }
    };
    request(options,async function (error, response) {
        if (error){
            callback(false)        
        }else{
            var xml = parse(response.body);
            var row = gamelist(xml.root.children[0].children,provider);
            callback(row);
        }
    });

    function gamelist(inputdata,provider){
        var rows = [];
        for(var i = 0 ; i < inputdata.length;i++){
              var data = inputdata[i].children[0].children;
            for(var j = 0 ; j < data.length; j++ ){
                var row = {};
                row={
                    TYPE : inputdata[i].attributes.NAME,
                    ID : data[j].attributes.ID,
                    NAME : data[j].attributes.NAME,
                    PROVIDERID : provider,
                    LAUNCHURL : "1"
                }
                rows.push(row);
            }
      
        }
        return rows;
      }
      
}

exports.allrefreshGames= (req,res,next)=>{
    res.json({
        status : true,data : "success"
    })
    betsoftrefreshgames("BETSOFT",async(rdata)=>{
        for(var i = 0 ; i < rdata.length ; i++){
            
            var findhandle = await BASECONTROL.BfindOne(GAMELISTMODEL,{ID : rdata[i].ID,PROVIDERID : rdata[i].PROVIDERID});
            if(!findhandle){
                var savehandle = await BASECONTROL.data_save(rdata[i],GAMELISTMODEL);
            }else{
                var updatehandle = await BASECONTROL.BfindOneAndUpdate(GAMELISTMODEL,{ID :rdata[i].ID,PROVIDERID : rdata[i].PROVIDERID },rdata[i]);
            }
        }
    
    })
    
    
    wac_refreshgames((rdata)=>{
        // res.json({
        //     status : true,data : "success"
        // })
    }); 
    
    xpgrefreshgames("XPG",async(rdata)=>{
            for(var i = 0 ; i < rdata.length ; i++){
            
                var findhandle = await BASECONTROL.BfindOne(GAMELISTMODEL,{ID : rdata[i].ID,PROVIDERID : rdata[i].PROVIDERID});
                if(!findhandle){
                    var savehandle = await BASECONTROL.data_save(rdata[i],GAMELISTMODEL);
                }else{
                    var updatehandle = await BASECONTROL.BfindOneAndUpdate(GAMELISTMODEL,{ID :rdata[i].ID,PROVIDERID : rdata[i].PROVIDERID },rdata[i]);
                }
            }
    
    })
    
    
    ezugi_refreshgames("EZUGI",async(rdata)=>{
            for(var i = 0 ; i < rdata.length ; i++){
            
                var findhandle = await BASECONTROL.BfindOne(GAMELISTMODEL,{ID : rdata[i].ID,PROVIDERID : rdata[i].PROVIDERID});
                if(!findhandle){
                    var savehandle = await BASECONTROL.data_save(rdata[i],GAMELISTMODEL);
                }else{
                    var updatehandle = await BASECONTROL.BfindOneAndUpdate(GAMELISTMODEL,{ID :rdata[i].ID,PROVIDERID : rdata[i].PROVIDERID },rdata[i]);
                }
            }
    });
    
    
    vivo_refreshgames("VIVO",async(rdata)=>{
        for(var i = 0 ; i < rdata.length ; i++){
        
            var findhandle = await BASECONTROL.BfindOne(GAMELISTMODEL,{ID : rdata[i].ID,PROVIDERID : rdata[i].PROVIDERID});
            if(!findhandle){
                var savehandle = await BASECONTROL.data_save(rdata[i],GAMELISTMODEL);
            }else{
                var updatehandle = await BASECONTROL.BfindOneAndUpdate(GAMELISTMODEL,{ID :rdata[i].ID,PROVIDERID : rdata[i].PROVIDERID },rdata[i]);
            }
        }
    });
    
}
//-----------------------XPG
async function xpgrefreshgames(provider,callback){

    var types = {
        24 : "AndarBahar",
        2 : "Blackjack",
        4 : "Baccarat",
        8 : "Live Texas Hold’em Bonus",
        12 : "DragonTiger",
        16 : "SicBo",
        22 : "Wheel Of Fortune",
        1 : "Roulette"
    }        
    var accessPassword = "";
    var serverurl = CONFIG.xpg.serverurl + "getGamesListWithLimits";
    var parameter = "";
    var privatekey = CONFIG.xpg.passkey;
    var operatorId = CONFIG.xpg.operatorid;
    var headers = {'Content-Type': 'application/x-www-form-urlencoded'};// method: 'POST', 'cache-control': 'no-cache', 
    var ap_para  = '';
    ap_para = { operatorId : operatorId,username : "WangMin",gameType : "0",onlineOnly :"1"}
    accessPassword = BASECONTROL.get_accessPassword(privatekey,ap_para);
    parameter = { accessPassword : accessPassword,operatorId : operatorId,username : "WangMin",gameType : "0", onlineOnly : "1"}
    request.post(serverurl,{ form : parameter, headers: headers, },async (err, httpResponse, body)=>{
        if (err) {
            callback(false);
        }else{
            if(body){
                var xml =parse(body);
                var outdata = get_gamelist(xml.root.children[0].children,provider);
                   callback(outdata)
            }else{
                callback(false);                    
            }
        }
    });
    function get_gamelist(gamelist,provider){
        var newgame = [];
        for(var i = 0 ; i < gamelist.length ; i++){
            var gamenode = gamelist[i]['children'];
            var newlist = {};
            for(var j = 0 ; j < 11 ; j++){
                if(j == 0){
                    newlist['limitId'] = get_limitid(gamenode[j].children);
                }else{
                    newlist[gamenode[j]['name']] = gamenode[j].content;
                }
            }
            newlist['TYPE'] = types[newlist['gameType']];
            newlist['ID'] = newlist['gameID'];
            newlist['NAME'] = newlist['gameName'];
            newlist['PROVIDERID'] = provider;
            newlist['LAUNCHURL'] = '2';
            newlist['WITHOUT'] = {
                limitId : newlist['limitId']
            }
            newgame.push(newlist);
        }
        return newgame;
    }
    function get_limitid(outdata){
        var indata = outdata[0].children[0].content;
        return indata;
    }
    
}

//---------------------VIVO

async function vivo_refreshgames(provider,callback){

    var rows =  await get_vivogames(provider);
    callback(rows)
    async function get_vivogames(provider){
        var rows = []; 
        var gametypes = {
            1 : "Roulette",
            2 : "Baccarat",
            3 : "Blackjack",
            4 : "Poker"
        }
        for(var i in gametypes){
            var data =  await get_axois(gametypes[i],provider);
            for(var j = 0 ; j < data.length ; j++){
                    rows.push(data[j]);
            }
        }
        return rows;
    }
    
    async function get_axois(gameName,PROVIDERID){
        var rows = [];
        await axios.get(CONFIG.vivo.gamelist+"mobile=true&operatorId="+"41"+"&gameName="+gameName+"&playerCurrency=USD").then(rdata=>{

            var tbldata = rdata.data.gameData.tables
            for(var i in tbldata){

                var row = tbldata[i]
                var newrow = {}
                newrow['TYPE'] = gameName;
                newrow['NAME'] = row.dealerName;
                newrow['ID'] = row.tableId;
                newrow['LAUNCHURL'] = '4';
                newrow['PROVIDERID'] = PROVIDERID;
                newrow['WITHOUT'] = {
                   limitId : row.limits[0].limitid,
                   min : row.limits[0].limitMin,
                   max : row.limits[0].limitMax
                }
                rows.push(newrow);
            }
        // }
        });
        return rows;
    }
}
//--------------------WAC
async function wac_refreshgames(callback){

    var options = {
        'method': 'GET',
        'url': 'https://pi.njoybingo.com/v1/publisher/games/splendorcasino',
        'headers': {}
      };
      request(options,async function (error, response) {
        if(error){
            res.json({status : false})
            return next()
        }else{
            var data = JSON.parse(response.body);
            var providers = data.providers;
            var providerslist=[];
            var allgamelist = [];
            for(var i = 0 ; i < providers.length ; i++){
                var games = providers[i].games;
                var providername = providers[i].name;
                var type={}
                for(var j = 0 ; j < games.length; j++){
                    var row = {};
                    row['NAME'] = games[j].description;
                    row['ID'] = games[j].name;
                    row['LAUNCHURL'] = '5';
                    row['TYPE'] = games[j].category;
                    row['PROVIDERID'] = games[j].provider;
                    row['image'] = games[j].image != null ? games[j].image.url : "";
                    row['WITHOUT'] = games[j].url;
                    type[games[j].category] = games[j].category;
                    allgamelist.push(row);
                }
                var types = [];
                for(var k in type){
                    types.push(type[k]);
                  }
                providerslist.push({provider : providername,type : types});
            }

            // for(var i = 0 ; i < allgamelist.length ; i ++){
            //     var findhandle = await BASECONTROL.BfindOne(GAMELISTMODEL,{ID : allgamelist[i].ID});
            //     if(!findhandle){
            //         var savehandle = await BASECONTROL.data_save(allgamelist[i],GAMELISTMODEL);
            //     }else{
            //         var updatehandle = await BASECONTROL.BfindOneAndUpdate(GAMELISTMODEL,{ID :allgamelist[i].ID },allgamelist[i]);
            //     }
            // }

            
            // for(var i = 0 ; i  < providerslist.length ; i++){
            //     // providerslist[i]['order'] = i;
            //     var findhandle = await BASECONTROL.BfindOne(PROVIDERMODELS,{provider : providerslist[i].provider});
            //     if(!findhandle){
            //         var savehandle = await BASECONTROL.data_save(providerslist[i],PROVIDERMODELS);
            //     }else{
            //         var updatehandle = await BASECONTROL.BfindOneAndUpdate(PROVIDERMODELS,{provider :providerslist[i].provider });
            //     }
            // }
            // callback(true)

            // await providers_model.insertMany(providerslist);
            // res.json({ status : true, data : allgamelist, list : providerslist });
        }    
    });
}


exports.newtokeninit = (req,res,next)=>{
    init()
    res.json({status : true})
}

exports.createnewtoken = (req,res,next)=>{
    let param = req.body;
    var row = {
        "MessageType": "AuthenticateSession",
        "OperatorID": CONFIG.ezugi.operatorId,
        "vipLevel": 0,
        "SessionCurrency": "INR",
        "Token": param.Token
    };
    var  newparam = JSON.stringify(row);
    doSend(newparam)    
}



//Goldenrace()
function Goldenrace(){
    var options = {
        'method': 'POST',
        'url': 'https://igamez-api.staging-hub.xpressgaming.net/api/v3/get-game-list',
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            'siteId': '5878',
            'publicKey': 'iFCQGOKoNFgPvoJ'
        }
    };
    request(options,async function (error, response) {
        if (error) throw new Error(error);
        var data = JSON.parse(response.body).data;
        var types = {};
        var provider = {};
        var rows = [];
        var index = 100;
        for(var i = 0 ; i < data.length ; i++){
            types[data[i].type] = data[i].type;
            provider[data[i].provider] = data[i].provider;
            if (data[i].provider != "HollywoodTV"){
                continue;
            }
            var row={};
            row['TYPE'] = data[i].type;
            row['ID'] = data[i].gameId;
            row['NAME'] = data[i].gameFriendlyName;
            row['PROVIDERID'] = data[i].provider;
            row["LAUNCHURL"] = "6";
            row["order"] = index;
            index ++;

            if(!data[i].thumbnail){
    
            }else{
                row['image'] = data[i].thumbnail;
            }
            var savehandle = await BASECONTROL.data_save(row,GAMELISTMODEL);
            rows.push(row);
        }


    });

}

function myslotty(){

    var providers = {};
    var options = {
        'method': 'POST',
        'url': 'https://staging.mrslotty.com/integrations/igamez/rpc?action=available_games&secret=9636ddf7-d21f-4cbf-adad-56132a9bd64d',
        'headers': {
          'Cookie': '__cfduid=dfa46ec841b3e4a3018ad3be52fe737c21605268800'
        }
      };
      request(options, async function (error, response) {
        if (error) throw new Error(error);
        var indata =JSON.parse(response.body).response;
        var allgamelist = [];
        var index = 0;

        for(var i in indata)
        {
            index ++
            var row = {};
            providers[indata[i].provider] = true;
            row['NAME'] = indata[i].name;
            row['ID'] = indata[i].id;
            row['order'] =index;
            row['LAUNCHURL'] = '8';
            row['TYPE'] = indata[i].categories ? indata[i].categories[0] : "";
            row['PROVIDERID'] = indata[i].provider;
            row['image'] = indata[i].media ? indata[i].media.icon : "";
            row['WITHOUT'] =  indata[i];
            var savehandle = await BASECONTROL.data_save(row,GAMELISTMODEL);
            // allgamelist.push(row);
        }

        var saveprodata = []

        for ( var i in providers){
            var allpro = await BASECONTROL.Bfind(PROVIDERMODELS,{});
            var order = allpro[allpro.length -1].order + 1;
            var row1 = {
                bool : {1 : true}
            }
            var row = Object.assign({},row1,{order : order},{provider : i},{text : i},{LAUNCHURL : "8"},{Type : "1"},{currency : "1"},
            {Percentage : "1"},
            {Money : "1"},
            );
            var savehandle = await BASECONTROL.data_save(row,PROVIDERMODELS);

            // saveprodata.push(row);
        }
      });
      
      

}
evoplay()

function evoplay(){
    var options = {
        'method': 'GET',
        'url': 'http://api.8provider.com/Game/getList?project=1234&version=1&signature=0fe9ebcbcf8f6a4bfe844b36ae3b80e5',
        'headers': {
          'Cookie': '__cfduid=d635ede816613aef84794fa9972efcb791605643397'
        }
      };
      request(options, async function (error, response) {
        if (error) throw new Error(error);
        var indata = JSON.parse(response.body).data;
        var index = 0;
        for (var i in indata){
            var row={}
            row['NAME'] = indata[i].name;
            row['ID'] = i;
            row['order'] =index;
            row['LAUNCHURL'] = '9';
            row['TYPE'] = indata[i].game_sub_type;
            row['PROVIDERID'] = "EVOPLAY";
            row['image'] = "";
            row['WITHOUT'] =  indata[i];
            index ++;
            var savehandle = await BASECONTROL.data_save(row,GAMELISTMODEL);
        }

      });

}