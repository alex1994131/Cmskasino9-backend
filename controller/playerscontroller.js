
const sessionmodel = require("../models/users_model").sessionmodel;
const gamesessionmodel = require("../models/users_model").gamesessionmodel;
const balance_histoy = require("../models/users_model").balance_histoy;
const playersUser = require("../models/users_model").GamePlay;
const Users = require("../models/users_model").adminUser;
const parse = require('xml-parser');
const BASECONTROL = require("./basecontroller")
const request  = require("request");
const BASECONFIG = require("../config/index.json");
const UsersControl = require("./userscontroller")
const playerlimits = require("../models/users_model").playerlimit;
const documentModel = require('../models/profile_model').documentModel;

exports.players_load = async(req,res,next)=>{
    var role =await BASECONTROL.get_useritem_fromid(req)
    var userslist = await UsersControl.get_users_items(role);
    var news = [];
    for(var i = 0 ; i < userslist.length ; i++){
        var data = await BASECONTROL.BfindOne(playersUser,{email : userslist[i].email});
        if(data){
            var ddd = Object.assign({},userslist[i]._doc ? userslist[i]._doc : userslist[i], data._doc ? data._doc : data);
            news.push(ddd);
        }
    }
    var roledata = await UsersControl.roles_get_fact(role);
    res.json({
        status : true,
        data : news,roledata : roledata
    });
    return next();
}

exports.realtimeusers_load =async (req,res,next) =>{
    var rdata = await BASECONTROL.Bfind(sessionmodel);
    if(!rdata){ 
        res.json({
            status : false
        });
        return next();
    }else{
        res.json({
            status : true,
            data : rdata
        });
        return next();
    }
}

exports.gamesrealtimeusers_load = async (req,res,next) =>{
    var rdata = await BASECONTROL.Bfind(gamesessionmodel);
    if(!rdata){ 
        res.json({
            status : false
        });
        return next();
    }else{
        res.json({
            status : true,
            data : rdata
        });
        return next();
    }
}

exports.gamesrealtimeusers_delete = (req,res,next) =>{
    gamesessionmodel.findOneAndDelete({email : req.body.email}).then(rdata =>{
        if(!rdata){
            res.json({
                status : false
            })
            next();
        }else{
            gamesessionmodel.find().then(rdata =>{
                if(!rdata){
                    res.json({
                        status : false
                    })
                    next();
                }else{  
                    res.json({
                        status : true,
                        data : rdata
                    })
                    next();
                }
            })
        }
    })
}

exports.balances_load= async(req,res,next) =>{
    var rdata = await BASECONTROL.Bfind(playersUser);
    if(!rdata){
        res.json({
            status : false
        })
    }else{
        res.json({status : true,
        data : rdata})
    }

}

exports.deposit_action = async (req,res,next) =>{
    var inputdata = req.body.data;
    var amount = inputdata.amount;
    var username = inputdata.username;
    var amounttype = inputdata.amounttype;
    var cemail = inputdata.cemail;
    var uphandle = null;
    if(amounttype === "1"){
        uphandle =  await BASECONTROL.player_balanceupdatein_Username(amount,username);
    }else{
        uphandle = await BASECONTROL.player_Bonusupdatein_Username(amount,username);
    }
    
    if(!uphandle){
        res.json({
            status : false
        })
    }else{
        var row = {
            type : 1,
            order_no : new Date().valueOf(),
            email : inputdata.email,
            username : inputdata.username,
            amount : inputdata.amount,
            amounttype  : amounttype,
            cemail  :cemail
        }
        var saveHandle = await BASECONTROL.data_save(row,balance_histoy);
        if(!saveHandle){
            res.json({
                status : false
            })
        }else{
            this.players_load(req,res,next);
        }
    }
}

exports.withdrawl_action = async (req,res,next) =>{
    var inputdata = req.body.data;
    var amount = inputdata.amount;
    var username = inputdata.username;
    var amounttype = inputdata.amounttype;
    var cemail = inputdata.cemail;
    if(amounttype == "1"){
        uphandle =  await BASECONTROL.player_balanceupdatein_Username(amount * -1,username);
    }else{
        uphandle = await BASECONTROL.player_Bonusupdatein_Username(amount * -1,username);
    }
    if(!uphandle){
        res.json({
            status : false
        })
    }else{
        var row = {
            type : 2,
            email : inputdata.email,
            username : inputdata.username,
            amount : inputdata.amount,
            amounttype : amounttype,
            order_no : new Date().valueOf(),
            cemail  :cemail

        }
        var saveHandle = await BASECONTROL.data_save(row,balance_histoy);
        if(!saveHandle){
            res.json({
                status : false
            })
        }else{
            this.players_load(req,res,next);        
        }
    }
}

exports.balance_history_load = async (req,res,next) =>{
    var bool = req.body.bool;
    var date = req.body.dates;
    var start = new Date(date[0]);
    var end = new Date(date[1]);
    var data;
    await balance_histoy.find({type : bool, date :{$gte: start, $lte:end}}).then( rdata=>{
        data = rdata;
    });
    if(!data){
        res.json({
            status : false
        })
    }else{
        res.json({status : true,
        data : data})
    }
}

exports.kickPlayerFromGames_action = async(req,res,next) =>{
    
}

exports.getaccount = async (req,res,next) =>{
    var status = await BASECONTROL.BfindOne(playersUser,{email : req.body.data});
    if(!status){
        res.json({ 
            data : status,
            status : false
        })
        return next();
     }else{
         res.json({
             data : status,
             status : true
         })
         return next();
    }
}

exports.get_guestgameaccount =async(req,res,next)=>{
     var gamedata = req.body.game;
     var width = req.body.width
     guset_launch_url(gamedata,width,(rdata)=>{
         if(rdata.status){
             res.json({
                 status : true,data : rdata.data
             });
             return next();
         }else{
             res.json({
                 status : false,data : rdata.data
             });
             return next();
         }
     })
}

exports.get_realgameaccount =async(req,res,next)=>{
     var user = req.body.user;
     var width = req.body.width
     var gamedata = req.body.game;
     var playaccount = await get_gameaccount(req);
     if(!playaccount.status){
         res.json({status : false,data : playaccount.data});
         return next();
     }else{
         var account = playaccount.data;
         var newtoken = make_token(account);        
         get_launch_url(account,gamedata,newtoken,width,async(rdata)=>{
             if(rdata.status){
                var finhandle = await BASECONTROL.BfindOne(gamesessionmodel,{email : newtoken.email});
                if(finhandle){
                    var uhandle = await BASECONTROL.BfindOneAndUpdate(gamesessionmodel,{email : newtoken.email},newtoken);
                    if(uhandle){
                        res.json({
                            status : true,data : {url : rdata.url,token : newtoken}
                        });
                        return next();
                    }else{
                        // res.json({status : false,data : "You cannot bet Simultaniously "});
                        res.json({status : false,data : "You cannot bet Play"});
                        return next();
                    }
                }else{
                    var savehandle =  await BASECONTROL.data_save(newtoken,gamesessionmodel);
                    if(!savehandle){
                        res.json({status : false,data : "You cannot bet Play"});
                        return next();
                    }else{
                        res.json({
                            status : true,data : {url : rdata.url,token : newtoken}
                        });
                        return next();
                    }
                }
             }else{
                 res.json({status : false,data : rdata.data});
                 return next();
             }
         });
 
     }
}
 
async function get_launch_url(account,gamedata,token,width,callback){
     var LAUNCH_FLAG = gamedata.LAUNCHURL;
     switch(LAUNCH_FLAG){
         case "1" :{
             var url = BASECONFIG.betsoft.real+"bankId="+BASECONFIG.betsoft.bankId+"&gameId="+gamedata.ID+"&mode=real&token="+token.token+"&lang=en&homeUrl="+BASECONFIG.homedomain;
             //betsoft
             callback({status : true,url : url})
             break;
         }
 
         case "2" :{
             //xpg
             xpg_token(account,gamedata,(rdata)=>{
                 callback(rdata);
             });
             break;
         }
 
         case "3" :{
             //ezugi
             var  url = BASECONFIG.ezugi.url+"token="+token.token+"&operatorId="+BASECONFIG.ezugi.operatorId+"&language=en&clientType=html5&openTable="+ gamedata.ID +"&homeUrl="+BASECONFIG.homedomain
             callback({status : true,url : url})
             break;
         }
 
         case "4" :{
             //vivo
             // var gametypes = {
             //     1 : "Roulette",
             //     2 : "Baccarat",
             //     3 : "Blackjack",
             //     4 : "Poker"
             // }
             var gametypes = {
                "Roulette":"roulette",
                "Baccarat":"baccarat",
                "Blackjack":"blackjack",
               "Poker":"casinoholdem"
            }
             var select_game = gametypes[gamedata.TYPE];
            var limitIds = gamedata.WITHOUT;
            if(limitIds.Mojos){
                var url = BASECONFIG.vivo.url2+
                "tableguid="+limitIds.tableguid+
                "&token=" +token.token +
                "&operatorID="+BASECONFIG.vivo.operatorid+
                "&homeURL="+BASECONFIG.homedomain +
                "&gameid=" + limitIds.gameid+
                "&mode=real"+
                "&language=EN"+
                "&currency=INR"+
                "&operatorToken=" + limitIds.operatorToken+
                "&host=https://de-lce.svmsrv.com"+
                "&gametype=live";
                callback({status : true,url : url})
            }else{
                var  url = BASECONFIG.vivo.url+
                    "token="+token.token+
                    "&operatorid="+BASECONFIG.vivo.operatorid+
                    "&language=EN"+
                    "&serverid="+BASECONFIG.vivo.serverid+
                    "&modeselection=3D" +
                    "&responsive=true"+
                    "&isgamelauncher=true"+
                    "&isinternalpop=false" +
                    "&isswitchlobby=true"+
                    "&securedomain=true"+
                    "&tableid="+gamedata.ID+
                    "&limitid="+limitIds.limitid+
                    "&application="+select_game+
                    "&homeurl="+BASECONFIG.homedomain;
                    callback({status : true,url : url})
                }
                break;
         }
 
         case "5" :{
             //wac
             // https://pi-test.njoybingo.com/game.do?token=934fc6cc086a0bba00a8fe9bda626de2&pn=kasino9&lang=en&game=1X2-8008&type=CHARGED
             var url = BASECONFIG.wac.url + "token="+token.token+"&pn="+ BASECONFIG.wac.pn + "&lang=en&game="+ gamedata.ID+"&type=CHARGED";
            callback({status : true,url : url});
            break;
         }

        case "6" : {
            var clientPlatform = width < 768 ?  "mobile" : "desktop";
            var mode = gamedata.mode ? "0" : "1";
            var hashstring = token.token+gamedata.ID+BASECONFIG.homedomain+mode+"enmaster"+clientPlatform+BASECONFIG.homedomain+BASECONFIG.xpress.hashkey;
             var hash = BASECONTROL.md5convert(hashstring);
             var url = BASECONFIG.xpress.url + 
             "token="+token.token + 
             "&game=" + gamedata.ID + 
             "&backurl="+BASECONFIG.homedomain+
             "&mode="+ mode +
             "&language=en"+
             "&group=master"+
             "&clientPlatform="+clientPlatform +
             "&cashierurl="+BASECONFIG.homedomain+
             "&h="+hash;
             callback({status : true,url : url});
             break;
        }
        case "7" :{
            var URL = BASECONFIG.betgames.url +
            "/ext/client/index/" + BASECONFIG.betgames.apicode +
            "/" + token.token + 
            "/" + "en" +
            "/" + "0" + 
            "/" + "0" + 
            "/" + gamedata.ID + 
            "/" + "india" + 
            "?" + BASECONFIG.homedomain;
            callback({status : true,url : URL});
            break;
        }


//Real play: https://staging.mrslotty.com/integrations/igamez/rpc?
//action=real_play
//&secret=9636ddf7-d21f-4cbf-adad-56132a9bd64d
//&game_id=virtualgeneration-horse-racing-real
//&player_id=313630303836363337343630
//&currency=INR

//Demo play: https://staging.mrslotty.com/integrations/igamez/rpc?action=demo_play&secret=9636ddf7-d21f-4cbf-adad-56132a9bd64d&game_id={}

        case "8" : {
            var URL = BASECONFIG.MySlotty.URL + 
            "action=" + "real_play" +
            "&secret=" + BASECONFIG.MySlotty.RPCSecret +
            "&game_id=" + gamedata.ID +
            "&player_id=" + account.id +
            "&currency=" + "INR";

            var options = {
                'method': 'GET',
                'url': URL,
                'headers': {
                }
              };
              request(options, function (error, response) {
                if (error) {
                    callback({status : false,data : "We are sorry. You can't play"});                
                } else{
                    var outdata = JSON.parse(response.body);
                    if (outdata.status != 200){
                        callback({status : false,data : outdata.message});
                    }else{
                        var game_url = outdata.response.game_url;
                        callback({status : true,url : game_url});
                    }

                    // var token = outdata.response.token;
                }
              });
        }
     }
}
 
function make_token(account){
    var row = {};
    row['intimestamp'] = (new Date()).valueOf();
    row['id'] = account.id;
    row['username'] = account.username;
    row['email'] = account.email;
    row['currency'] = account.currency;
    row['lastname'] = account.lastname;
    row['firstname'] = account.firstname;
    var token = BASECONTROL.md5convert(JSON.stringify(row));
    row['token'] = token;
    return row;
}
 
function xpg_token(rdata,game,callback){
    var username =rdata.username;
    var accessPassword = "";
    var registerToken ="";
    var serverurl = BASECONFIG.xpg.serverurl + "registerToken";
    var parameter = "";
    var privatekey = BASECONFIG.xpg.passkey;
    var operatorId = BASECONFIG.xpg.operatorid;
    var headers = {'Content-Type': 'application/x-www-form-urlencoded'};// method: 'POST', 'cache-control': 'no-cache', 
    var ap_para  = '';
    ap_para = {
        operatorId : operatorId,
        username : username,
        props : ""
    } 
    accessPassword = BASECONTROL.get_accessPassword(privatekey,ap_para);
    parameter = {
        accessPassword : accessPassword,
        operatorId : operatorId,
        username : username,
        props : ""
    }
    request.post(serverurl,{ form : parameter, headers: headers, },async (err, httpResponse, body)=>{
        if (err) {
            callback({status : false});
        }else{
            var xml =parse(body);
            var xmld = xml.root;
            var errorcode = xmld['children'][0]['content'];
            switch(errorcode){
                case "0" :
                    var registerToken = xmld['children'][1]['content'];
                    // var Security = BASECONTROL.md5convert(privatekey+"operatorId="+operatorId+"&loginToken="+registerToken);
                    // var SecurityCode = Security.toLocaleUpperCase();
                    var livecasino_url_ = BASECONFIG.xpg.url+'operatorId='+operatorId+'&token='+registerToken+'&username='+username+'&gameId='+game.ID+'&gameType='+game.TYPE +"&limitId="+game.WITHOUT.limitId+'&DefaultCategory=Roulette';
                    callback({status : true,url : livecasino_url_});
                break;
                default :
                callback({status : false});
                break;
            }
        }    
    });
}
 
async function get_gameaccount(req){
    var reqdata = req.body;
    var user = reqdata.user;
    var rdata = await BASECONTROL.BfindOne(playersUser,{email : user.email});
    if(rdata){ 
    if(rdata.balance > 0){
        return {status : true,data : rdata} 
    }else{
        return {status : false,data : "please deposit"}
    }
}else{
    return {status : false,data : " server error"}
}
}

function guset_launch_url(gamedata,width,callback){
    var LAUNCH_FLAG = gamedata.LAUNCHURL;
    switch(LAUNCH_FLAG){
        case "1" :{
            var url = BASECONFIG.betsoft.guest+"bankId="+BASECONFIG.betsoft.bankId+"&gameId="+gamedata.ID+"&lang=en&homeUrl="+BASECONFIG.homedomain;
            callback({status : true,data : url})
            break;
        }
        case "5" :{
            //wac
            // https://pi-test.njoybingo.com/game.do?token=934fc6cc086a0bba00a8fe9bda626de2&pn=kasino9&lang=en&game=1X2-8008&type=CHARGED
            var url = BASECONFIG.wac.url + "token=934fc6cc086a0bba00a8fe9bda626de2&pn="+ BASECONFIG.wac.pn + "&lang=en&game="+ gamedata.ID+"&type=FREE";
            callback({status : true,data : url});
            break;
        }

        case "6" : {
            var clientPlatform = width < 768 ?  "mobile" : "desktop";
            var mode = "0";
            var hashstring = gamedata.ID+BASECONFIG.homedomain+mode+"enmaster"+clientPlatform+BASECONFIG.homedomain+BASECONFIG.xpress.hashkey;
             var hash = BASECONTROL.md5convert(hashstring);
             var url = BASECONFIG.xpress.url + 
             "token="+ 
             "&game=" + gamedata.ID + 
             "&backurl="+BASECONFIG.homedomain+
             "&mode="+ mode +
             "&language=en"+
             "&group=master"+
             "&clientPlatform="+clientPlatform +
             "&cashierurl="+BASECONFIG.homedomain+
             "&h="+hash;
             callback({status : true,data : url});
             break;
        }

        case "8" : {
            if ( gamedata.WITHOUT.is_demo_supported){
                var url = gamedata.WITHOUT.demo_url
                callback({status : true,data : url});
            }else{
                callback({status : false,data : "We are sorry . Demo is not supported"});
            }
        }        
        
        default :{
            callback({status : false,data : "We are sorry You can't play"})
            break;
        }
    }
}

exports.get_kycmenuLoad = async(req,res,next)=>{
    var status =req.body.status;
    var rdata = await BASECONTROL.Bfind(documentModel,{status : status});
    var role =await BASECONTROL.get_useritem_fromid(req)
    var userslist = await UsersControl.get_users_items(role);
    var rows = []
    for(var i = 0 ; i < rdata.length ; i++){
        var item = userslist.find(obj=>obj.email == rdata[i].email);
        if(item){
            rows.push(rdata[i])
        }
    }
    if(!rdata){
        res.json({status : false});
        return next();
    }else{
        res.json({status : true,data : rows})
        return next();
    }
}

exports.update_kycmenu = async(req,res,next)=>{
    var bool = req.body.data.bool;
    var email = req.body.data.email;
    var rdata =await BASECONTROL.BfindOneAndUpdate(documentModel,{email : email},{status : req.body.data.bool})
    if(!rdata){
        res.json({status : false});
        return next();
    }else{
        if(bool == "2"){
            var udata = await BASECONTROL.BfindOneAndUpdate(Users,{email : email},{idverify : true });
            if(!udata){
                res.json({status : false});
                return next();
            }else{
               this.get_kycmenuLoad(req,res,next) 
            }
        }else{
            this.get_kycmenuLoad(req,res,next)             
        }
    }
}

exports.get_playerlimit = async(req,res,next)=>{
    var role =await BASECONTROL.get_useritem_fromid(req)
    var userslist = await UsersControl.get_users_items(role);
    var news =[];
    for(var i = 0 ; i < userslist.length ; i++){
        var data = await BASECONTROL.BfindOne(playerlimits,{email : userslist[i].email});
        if(data){
            var row= Object.assign({},userslist[i]._doc ? userslist[i]._doc : userslist[i] ,data._doc ? data._doc : data);
            news.push(row)
        }else{
            var newrow = {daylimit : BASECONFIG.USERS.daylimit,
                weeklimit : BASECONFIG.USERS.weeklimit,
                email : userslist[i].email,
                monthlimit :BASECONFIG.USERS.monthlimit }
                
            var shandle = await BASECONTROL.data_save(  newrow,playerlimits);
            var row = Object.assign({},
                userslist[i]._doc ? userslist[i]._doc : userslist[i] ,
                {daylimit : BASECONFIG.USERS.daylimit},
                {weeklimit : BASECONFIG.USERS.weeklimit},
                {monthlimit :BASECONFIG.USERS.monthlimit }
            );
            news.push(row);
        }
    }
    if(!news){ 
        res.json({ status : false });
        return next();
    }else{
        res.json({ status : true, data : news });
        return next();
    }
}

exports.update_playerlimit = async(req,res,next)=>{
    var email = req.body.data.email;
    var data = await BASECONTROL.BfindOneAndUpdate(playerlimits,{email : email},req.body.data);
    if(!data){
        res.json({status :false});
        return next()
    }else{
        this.get_playerlimit(req,res,next)
    }
}





