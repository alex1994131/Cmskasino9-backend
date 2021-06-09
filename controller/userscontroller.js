
const BASECONTROL = require("./basecontroller");
const USERS = require("../models/users_model");
const BASECON = require("./basecontroller");
const CONFIG = require("../config/index.json");
const jwt = require('jsonwebtoken');
const request = require("request");
const ObjectId = require('mongodb').ObjectID;
const hex = require('string-hex');
const parse = require('xml-parser');
const Sendy = require('sendy-api');
const DB = require("../config/index.json");
const CryptoJS = require("crypto-js");
const PlayersController = require("./playerscontroller")

const adminUser = USERS.adminUser;
const themeModel = USERS.get_themeinfor;
const permission_model = USERS.permission_model;
const totalusermodel = USERS.totalusermodel;
const GamePlay = USERS.GamePlay;
const sidebarmodel = USERS.sidebarmodel;
const testsidebarmodel = USERS.testsidebarmodel;
const sendy = new Sendy(CONFIG.sendy.url, CONFIG.sendy.api_key);

function list_to_tree(list) {
    var map = {}, node, roots = [], i;    
    for (i = 0; i < list.length; i += 1) {
        map[list[i].id] = i; // initialize the map
        list[i].children = []; // initialize the children
    }

    for (i = 0; i < list.length; i += 1) {
        node = list[i];
        if (node.pid !== "0") {
            if(list[map[node.pid]]){
                list[map[node.pid]].children.push(node);
                // return;
            }else{
                // return;
            }
            // if you have dangling branches check that map[node.parentId] exists
        } else {
            roots.push(node);
        }
    }
    return roots;
}

function jwt_regiser(userinfor,callback){
    var date = (new Date()).valueOf()+'';
    var token = BASECONTROL.md5convert(date);
    const payload = {
        username: userinfor.username,
        firstname : userinfor.firstname,
        lastname : userinfor.lastname,
        fullname : userinfor.fullname,
        email : userinfor.email,
        password : userinfor.password,
        _id : userinfor._id,
        currency : userinfor.currency,
        intimestamp :date,
        token : token,
        role : userinfor.permission
    } 
    jwt.sign(payload,'secret', {expiresIn: CONFIG.session.expiretime},async (err, token) => {
        if(err){
            callback({
                status : false,
                data : "Server is error"
            })
        }
        else {
            await BASECONTROL.data_save({email:userinfor.email},totalusermodel);

            callback({
                status : true,
                token : token,
                data : payload,
                detail : userinfor
            });
        }
    });
}

async function email_verify(email){
    var data = null;
    var user =  await BASECONTROL.BfindOne(adminUser,{email : email});
    if(!user){
        data = false;            
    }else{
        data = true
    }
    return data;
}

async function username_verify(username){
    var data = null
    var user =  await BASECONTROL.BfindOne(adminUser,{username : username});
    if(!user){
        data = false;            
    }else{
        data = true
    }
    return data;
}

async function permission_verify(email){
    var data = null;
    var user = await BASECONTROL.BfindOne(adminUser,{email : email,permission : CONFIG.USERS.player});
    if(!user){
        var user1 = await BASECONTROL.BfindOne(adminUser,{username : email,permission : CONFIG.USERS.player});
        if(!user1){
            data = false;
        }else{
            data = true;            
        }
    }else{
        data = true
    }
    return data;
}

async function deleted_verify(email){
    var data = null;
    var user = await BASECONTROL.BfindOne(adminUser,{email : email,isdelete : false });
    if(!user){
        var user1 = await BASECONTROL.BfindOne(adminUser,{username : email,isdelete : false });
        if(!user1){
            data = false;
        }else{
            data = true;            
        }
    }else{
        data = true
    }
    return data;    
}

async function status_verify1(email){
    var data = null;
    var user = await BASECONTROL.BfindOne(adminUser,{email : email,status : CONFIG.USERS.status.pending });
    if(!user){
        var user1 = await BASECONTROL.BfindOne(adminUser,{username : email,status : CONFIG.USERS.status.pending  });
        if(!user1){
            data = true;
        }else{
            data = false;            
        }
    }else{
        data = false;
    }
    return data; 
}

async function status_verify2(email){
    var data = null;
    var user = await BASECONTROL.BfindOne(adminUser,{email : email,status : CONFIG.USERS.status.block });
    if(!user){
        var user1 = await BASECONTROL.BfindOne(adminUser,{username : email,status : CONFIG.USERS.status.block  });
        if(!user1){
            data = true;
        }else{
            data = false;            
        }
    }else{
        data = false
    }
    return data; 
}

async function password_verify(email,password){
    var data = null;
    var user = await BASECONTROL.BfindOne(adminUser,{email : email,password : password });
    if(!user){
        var user1 = await BASECONTROL.BfindOne(adminUser,{username : email,password : password  });
        if(!user1){
            data = false;
        }else{
            data = user1;            
        }
    }else{
        data = user;
    }
    return data;
}

async function permission_verify1(email){
    var data = null;
    var user = await BASECONTROL.BfindOne(adminUser,{email : email,permission : CONFIG.USERS.player });
    if(!user){
        var user1 = await BASECONTROL.BfindOne(adminUser,{username : email,permission : CONFIG.USERS.player  });
        if(!user1){
            data = true;
        }else{
            data = false;  
        }
    }else{
        data = false
    }
    return data;
}

async function get_max_id (){
    var user2 = await BASECONTROL.BSortfind(adminUser,{},{id : 1});
    var player1 = await BASECONTROL.BSortfind(GamePlay,{},{pid : 1});
    var id = 0;
    var pid = 0;
    if(user2.length > 0){
        id = user2[user2.length-1].id + 1;
    }
    if(player1.length > 0){
        pid = player1[player1.length-1].pid + 1;
    }
    var row = {
        id : id,pid : pid
    }
    return row;
}

function xpg_register(username,callback){
    var serverurl = CONFIG.xpg.serverurl + "createAccount";
    var password = BASECONTROL.md5convert(username);
    var privatekey = CONFIG.xpg.passkey;
    var operatorId = CONFIG.xpg.operatorid;
    var headers = {'Content-Type': 'application/x-www-form-urlencoded'};// method: 'POST', 'cache-control': 'no-cache', 
    var acpara = {operatorId : operatorId, username : username,userPassword : password,}
    var accessPassword = BASECONTROL.get_accessPassword(privatekey,acpara);
    var  parameter = {accessPassword : accessPassword,operatorId : operatorId,username : username,userPassword : password}        
    request.post(serverurl,{ form : parameter, headers: headers, },async (err, httpResponse, body)=>{
        if (err) {
            callback({status : false});
        }else{
            var xml =parse(body);
            var xmld = xml.root;
            var errorcode = xmld['children'][0]['content'];
            switch(errorcode){
                case "0" :
                    callback(true)
                    break;
                default :
                    callback({status : false});
                break;
            }
        }
    });
}

async function register_action(req,callback){
    var user = req.body.user;
    var password = await BASECONTROL.jwt_encode(user.password)
    var userdata = user;
    var rdata = await email_verify(user.email);
    if(!rdata){
        var user1 = await BASECONTROL.BfindOne(adminUser,{username : user.username});
        if(!user1){
            xpg_register(user.username,async(creathandle)=>{
                if(!creathandle){
                    callback ({ status : false, data : "This nickname have already registered." })
                }else{
                    signup_subscribe(userdata,async(sdata)=>{
                        if(!sdata){
                            callback ({ status : false, data : "server error" });
                        }else{
                            var id =  ObjectId(hex(BASECONTROL.get_timestamp()+"").slice(0,24));
                            var iddata =await get_max_id();
                            var userid = iddata.id;
                            var pid  = iddata.pid;
                            var register = userdata;
                            register['password'] = password;
                            register['_id'] = id;
                            register['id'] = userid;
                            var playerregister = {
                                username : userdata.username,
                                id : id,
                                email : userdata.email,
                                firstname : userdata.firstname,
                                lastname : userdata.lastname,
                                pid : pid   
                            }
                            var user =await BASECONTROL.data_save(register,adminUser);
                            if(!user){

                                callback ({ status : false, data : "server error" })
                            }else{
                                var playerhandle = await BASECONTROL.data_save(playerregister,GamePlay);
                                if(playerhandle){
                                    callback ({ status : true,data : "success"})
                                }else{

                                    callback ({ status : false,data : "server error"})
                                }
                            }
                        }
                    })
                }
            })
        }else{
            callback ({ status : false, data : "This nickname have already registered." })
        }
    }else{
        callback ({ status : false, data :"This email already exist!"})
    }
}

exports.get_location = (req,res,next)=>{
    var ip = req.body.ip;
    var key = CONFIG.iplocation.key;
    var options = {
        'method': 'GET',
        'url': CONFIG.iplocation.url+'ip='+ip+'&key='+key+'&package='+CONFIG.iplocation.package,
        'headers': {}
    };
    request(options, function (error, response) {
        if (error)
        {
            res.json({
                status : false,
            })
        }else{
            var location = JSON.parse(response.body);
            location['ip'] = ip;
            res.json({
                status : true,
                data : location
            })
            return next();
        }
    });
    return;
}

exports.player_login = async(req,res,next)=>{
    const email = req.body.email;
    const password = await BASECONTROL.jwt_encode(req.body.password);
    var email_ =  await email_verify(email);
    if(!email_){
        var username_ =  await username_verify(email);
        if(!username_){
            res.json({ status : false,data : "we can't find this email / username"});
           return next();
        }
    }

    var permission_ = await permission_verify(email);
    if(!permission_){
        res.json({status : false,data : "You can't login with this email."})
        return next();
    }
    var deleted_ = await deleted_verify(email);
    if(!deleted_){
        res.json({status : false,data : "This email was deleted."})
        return next();
    }
    var status_1 = await status_verify1(email);
    if(!status_1){
        res.json({status : false,data : "This email is pending."})
        return next();
    }
    var status_2 = await status_verify2(email);
    if(!status_2){
        res.json({status : false,data : "This email was blocked."});
        return next();
    }

    var userinfor =  await password_verify(email,password)
    if(!userinfor){
        res.json({
            status : false,
            data : "Please enter correct password."
        })
        return next();
    }else{
        jwt_regiser(userinfor,(rdata)=>{
            res.json(rdata);
            return next();
        })
    }
}

exports.admin_login = async(req,res,next)=>{
    const email = req.body.email;
    const password = await BASECONTROL.jwt_encode(req.body.password);
    var email_ =  await email_verify(email);
    if(!email_){
        res.json({ status : false,data : "Email not found"});
       return next();
    }
    // var email_verify2 = await email_verify2_(email);
    // if(!email_verify2){
    //     res.json({status : false,data : "You can't login without email verify"})
    //     return next();
    // }
    var permission_ = await permission_verify1(email);
    if(!permission_){
        res.json({status : false,data : "You can't login with this email."})
        return next();
    }
    var deleted_ = await deleted_verify(email);
    if(!deleted_){
        res.json({status : false,data : "This email was deleted."})
        return next();
    }
    var status_1 = await status_verify1(email);
    if(!status_1){
        res.json({status : false,data : "This email is pending."})
        return next();
    }
    var status_2 = await status_verify2(email);
    if(!status_2){
        res.json({status : false,data : "This email was blocked."});
        return next();
    }

    var userinfor =  await password_verify(email,password)
    if(!userinfor){
        res.json({
            status : false,
            data : "Please input correct password."
        })
        return next();
    }else{
        var rdatas = await BASECONTROL.BfindOne(sidebarmodel,{permission : userinfor.permission});        
        if(!rdatas){
            jwt_regiser(userinfor,(rdata)=>{
                res.json(Object.assign(rdata,{permission:rdatas}));
                return next();
            })
        }else{  
            jwt_regiser(userinfor,(rdata)=>{
                res.json(Object.assign(rdata,{permission:rdatas}));
                return next();
            })
        }        
    }
}

exports.player_register = async (req,res,next) =>{
    register_action(req,async(rdata)=>{
        if(rdata.status){
            var redata = await BASECONTROL.BfindOne(adminUser,{email : req.body.user.email});
            if(!redata){
                res.json({ status : false, data : "server error"});
                return next();
            }else{
                jwt_regiser(redata,(tdata)=>{
                    res.json(tdata);
                    return next();
                })
            }
        }else{
            res.json(rdata);
            return next();
        }
    });
}

exports.get_adminthemestyle = async (req,res,next) =>{
    var email = req.body.data;
    var rdata = await BASECONTROL.BfindOne(themeModel,{email : email})
    if(!rdata){
        res.json({status : false,data:"fail"});
        return next();
    }else{
        res.json({status : true,data : rdata});
        return next();
    }
}

exports.save_adminthmestyle = async function(req,res,next){ 
    var outdata = await BASECONTROL.BfindOne(themeModel,{email : req.body.data.email})
    if(!outdata){
        var rdata = await BASECONTROL.data_save(req.body.data,themeModel);
        if(!rdata){
            res.json({
                status : false,
                data : "Fail"
            })
            return next();
        }else{
            res.json({
                status : true,
                data : rdata
            })
            return next();
        }
    }else{
        var rdata = await BASECONTROL.BfindOneAndUpdate(themeModel,{email : req.body.data.email},req.body.data)
        if(!rdata){
            res.json({
                status : false,
                data : "Fail"
            })
            return next();
        }else{
            res.json({
                status : true,
                data : req.body.data
            })
            return next();
        }
    }
}

exports.get_user_detail = async(req,res,next)=>{
    var user = req.body.user;
    var rdata = await BASECONTROL.BfindOne(adminUser,{email : user});
    if(!rdata){
        res.json({
            status : false,
            data : "Email not found"
        })
        return next();
    }else{
        res.json({
            status : true,
            data : rdata
        })
        return next();
    }
}

exports.user_changepassword = async(req,res,next)=>{
    var user = req.body.data;
    user.password =await  BASECONTROL.jwt_encode(user.password);
    var rdata = await BASECONTROL.BfindOneAndUpdate(adminUser,{email : user.email},{password : user.password});
    if(!rdata){
        res.json({
            status : false,
            data : "Email not found"
        })
        return next();
    }else{
        rdata.password = user.password;
        res.json({
            status : true,
            data : await BASECONTROL.jwt_encode(rdata)
        })
        return next();
    }
}

exports.admin_changepassword = async(req,res,next)=>{
    var user = req.body.user;
    user.password =await BASECONTROL.jwt_encode(user.password);
    var userinfor = await BASECONTROL.BfindOneAndUpdate(adminUser,{email : user.email},{password : user.password});
    if(!userinfor){
        res.json({
            status : false,
            data : "Email not found"
        })
        return next();
    }else{
        jwt_regiser(userinfor,(rdata)=>{
            res.json(rdata);
            return next();
        })
    }
};

//////////////---------------email verify ------------------------////////////////////////////
function signup_subscribe(user,callback){
    var domain = null;
    if(user.permission == CONFIG.USERS.player){
        domain = DB.homedomain;
    }else{
        domain = DB.admindomain;
    }
    var init = new Date().valueOf()
    var data = {
        email : user.email,
        permission : user.permission,
        init : init,
    }
    
    var verifyCode = CryptoJS.AES.encrypt(JSON.stringify(data), CONFIG.USERS.secret_key).toString();
    var verifyString = '<a href="' + domain + CONFIG.USERS.emailverify_url + verifyCode + '" id="kasino9-confirm" target="_blank"><span>Confirm</span> </a>';
    sendy.subscribe({email: user.email, list_id: CONFIG.sendy.list_id1,api_key : CONFIG.sendy.api_key,name : user.username,verify : verifyString}, function(err, result){
        if(err){
            callback(false,err);
        }else{
            callback(true,result);
        }
    });

};

function forgotPassword_sendmail(user,callback){
    var domain = null;
    if(user.permission == CONFIG.USERS.player){
        domain = DB.homedomain;
    }else{
        domain = DB.admindomain;
    }
    var init = new Date().valueOf();
    var data = {
        email : user.email,
        permission : user.permission,
        init : init,
    }
    
    var verifyCode = CryptoJS.AES.encrypt(JSON.stringify(data), CONFIG.USERS.secret_key).toString();
    var verifyString = '<a href="' + domain + CONFIG.USERS.forgotpasswordverify_url + verifyCode + '" id="kasino9-confirm" target="_blank"><span>RESET</span> </a>';
    sendy.subscribe({email: user.email, list_id: CONFIG.sendy.list_id2,api_key : CONFIG.sendy.api_key,name : user.username,forgotemailverify : verifyString}, function(err, result){
        if(err){
            callback(false);
        }else{
            callback(true);
        }
    });

};

function unsubscribe(user,listid,callback){
  var params = {
    email: user.email,
    list_id: listid
  }
 
  sendy.unsubscribe(params, function(err, result) {
    if (err){
      callback(false,err)
    }else{
      callback(true,result)
    }
  })
}

exports.emailverify_receive_action =  async (req,res,next)=>{
    var data = req.body.data;
    try{
        var bytes  = CryptoJS.AES.decrypt(data,  CONFIG.USERS.secret_key);
        var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        var fuserdata = await BASECON.BfindOne(adminUser,{email : decryptedData.email,emailverify  :true});
        if(fuserdata.emailverify){
            res.json({status : false,data : "This email already verify"})
        }else{
            var rdata = await BASECON.BfindOneAndUpdate(adminUser,{email : decryptedData.email},{emailverify : true});
            if(rdata){
                jwt_regiser(rdata,(tdata)=>{
                    res.json(tdata);
                    return next();
                })
            }else{
                res.json({status: false,data : "server error"})
                return next()            
            }
        }
    }catch(e){
        res.json({status: false,data : "server error"})
        return next()
    }
}

exports.forgotpassword_receive_action = async (req,res,next)=>{
    var data = req.body.data;
    try{
        var bytes  = CryptoJS.AES.decrypt(data,  CONFIG.USERS.secret_key);
        var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        var fuserdata = await BASECON.BfindOne(adminUser,{email : decryptedData.email});
        if(fuserdata){
            res.json({status : true,data :fuserdata.email });
            return next();
        }else{
            res.json({status : false,data : "fail"});
            return next();
        }
    }catch(e){
        res.json({status: false,data : "server error"})
        return next()
    }
}

exports.forgotpassword_send_action = async(req,res,next)=>{
    
    var data = req.body.email;
    var fdata = await BASECONTROL.BfindOne(adminUser,{email : data});
    if(fdata){
        unsubscribe(fdata,CONFIG.sendy.list_id2,(rdata)=>{
            forgotPassword_sendmail(fdata,(rdata)=>{
                if(rdata){
                    res.json({status: true});
                    return next();                
                }else{
                    res.json({status: false});
                    return next();
                }
            })
        })
    }else{
        res.json({status: false,data : "we are sorry. we can't this email"});
        return next();
    }
}

exports.forgotpassword_set_action = async (req,res,next) =>{
    var data = req.body.data;
    var fdata = await BASECONTROL.BfindOne(adminUser,{email : data.email});
    if(fdata){
        var row ={};
        row['password'] = await BASECONTROL.jwt_encode(data.password);
        var fupdate = await BASECONTROL.BfindOneAndUpdate(adminUser,{email : data.email},row);
        if(fupdate){
            jwt_regiser(fupdate,(tdata)=>{
                res.json(tdata);
                return next();
            })            
        }else{
            res.json({status : false,data : "server error"})
            return next();
        }
    }else{
        res.json({status : false,data : "server error"})
        return next();
    }
}

exports.resend_email_action = async(req,res,next)=>{
    var email = req.body.email;
    var userdata = await BASECON.BfindOne(adminUser,{email : email});
    if(userdata){
        unsubscribe(userdata,CONFIG.sendy.list_id1,(rdata,result)=>{
            signup_subscribe(userdata,(rdata,detail)=>{
                if(!rdata){                        
                    res.json({status : false,data : "Please check your email"})
                    return next();
                }else{
                    res.json({status : true,data : "server error"})
                    return next();
                }
            });
        });
    }else{
        res.json({status : false,data : "This email don't exist"})
        return next();
    }
}

/////////--------------------------roles ----------------
exports.roles_load = async (req,res,next)=>{
    var findhandle = "";
    findhandle = await BASECONTROL.BSortfind(permission_model,{},{order : 1});
    if(!findhandle){
        res.json({status : false,data : "fail"})
        return next();
    }else{
        var data = BASECONTROL.array_sort(findhandle,"order")
        res.json({status : true,data : data})
        return next();
    }
}

exports.roles_menusave = async (req,res,next)=>{
    var indata = req.body.data;
    indata['id'] = new Date().valueOf();
    var lastdata = await BASECONTROL.BSortfind(permission_model,{},{order : 1});
    if(!lastdata){
        res.json({status : false,data : "fail"});
        return next();
    }else{
        indata['order'] = lastdata[lastdata.length-1].order  + 1;
        var savehandle = await BASECON.data_save(indata,permission_model);
        if(!savehandle){
            res.json({status : false,data : "fail"});
            return next();
        }else{
            var  findhandle = await BASECONTROL.BSortfind(permission_model,{},{order : 1});       
            if(!findhandle){
                res.json({status : false,data : "fail"})
                return next();
            }else{
                var data = BASECONTROL.array_sort(findhandle,"order")
                res.json({status : true,data : data})
                return next();
            }
        }
    }
}

exports.roles_menuupdate = async (req,res,next)=>{
    var indata = req.body.data;
    for(var i = 0 ; i < indata.length ; i++)
    {
        var updatehandle =  await BASECONTROL.BfindOneAndUpdate(permission_model,{_id : indata[i]._id},indata[i]);
        if(!updatehandle){
            res.json({status : false,data : "fail"});
            return next();
        }
    }
    var  findhandle = await BASECONTROL.BSortfind(permission_model,{},{order : 1});     
    if(!findhandle){
        res.json({status : false,data : "fail"})
        return next();
    }else{
        var data = BASECONTROL.array_sort(findhandle,"order")
        res.json({status : true,data : data})
        return next();
    }
}

exports.roles_menudelete = async(req,res,next)=>{
    var indata = req.body.data;
    var outdata = await BASECONTROL.BfindOneAndDelete(permission_model,{_id : indata._id})
    if(!outdata){
        res.json({status : false,data : "fail"})
        return next();
    }else{
        var findhandle = "";
        findhandle = await  BASECONTROL.BSortfind(permission_model,{},{order : 1});     
        if(!findhandle){
            res.json({status : false,data : "fail"})
            return next();
        }else{
            var data = BASECONTROL.array_sort(findhandle,"order")
            res.json({status : true,data : data})
            return next();
        }
    }
}
///////---------------users cms
exports.get_users_items = async(role) =>{                 ///////////////-----------------get user items
    var data = [];
    async function recurse(email){
        var rows = await BASECONTROL.Bfind(adminUser,{isdelete : false,created : email});
        if(rows.length == 0) {
            return;
        } else {
            for(var i = 0 ; i < rows.length ; i++){
                data.push(rows[i]);
                await recurse(rows[i].email);
            }
        }
    }
    if(role.permission == CONFIG.USERS.superadmin){
       data = await BASECONTROL.Bfind(adminUser,{isdelete : false});
    }else{
        await recurse(role.email);
    }
    var roles = await BASECONTROL.Bfind(permission_model);
    var newrow = [];
    for(var i = 0 ; i < data.length ; i++){
        var roleitem = roles.find(obj => obj.id == data[i].permission);
        var item = {};
        item['permission'] = roleitem.id;
        item['permissiontitle'] = roleitem.title;
        var row = Object.assign({},data[i]._doc,item);
        newrow.push(row);
    }
    return newrow;
}

exports.get_users_for_permission = async(role,start,end) =>{                 ///////////////-----------------get user items
    var data = [];
    async function recurse(email){
        var rows = await BASECONTROL.Bfind(adminUser,{ $and: [ { "date": { $gte: start } }, { "date": { $lte: end } }, { "permission": CONFIG.USERS.player },{isdelete : false},{created : email} ] });
        if(rows.length == 0) {
            return;
        } else {
            for(var i = 0 ; i < rows.length ; i++){
                data.push(rows[i]);
                await recurse(rows[i].email);
            }
        }
    }

    if(role.permission == CONFIG.USERS.superadmin){
       data = await BASECONTROL.Bfind(adminUser,{ $and: [ { "date": { $gte: start } }, { "date": { $lte: end } },{isdelete : false}, { "permission": CONFIG.USERS.player }]});
    }else{
        await recurse(role.email);
    }
    var roles = await BASECONTROL.Bfind(permission_model);
    var newrow = [];
    for(var i = 0 ; i < data.length ; i++){
        var roleitem = roles.find(obj => obj.id == data[i].permission);
        var item = {};
        item['permission'] = roleitem.id;
        item['permissiontitle'] = roleitem.title;
        var row = Object.assign({},data[i]._doc,item);
        newrow.push(row);
    }
    return newrow;
}


exports.get_users_load = async (req,res,next) => {
    var role =await BASECONTROL.get_useritem_fromid(req)
    var userslist = await this.get_users_items(role);
    var data = await this.roles_get_fact(role);
    if(!userslist){
        res.json({
            status : false,
            data: 'failture'
        });
        return next();
    }else{
        res.json({
            status : true,
            data : userslist,roledata : data
        });
        return next();
    }
}

exports.admin_register = async (req,res,next) =>{
    register_action(req,async(rdata)=>{
        if(rdata.status){
            this.get_users_load(req,res,next);
            return;
        }else{
            res.json(rdata);
            return next();
        }
    });
}

exports.get_rolesfrom_per = async (req,res,next) =>{
    var role = await BASECONTROL.get_useritem_fromid(req)
    var data = await this.roles_get_fact(role);
    if(data){
        res.json({status : true,data : data});
        return next();
    }else{
        res.json({status : false,data : "false"});
        return next();
    }
}

exports.roles_get_fact = async(role) =>{
    var data = [];
    async function recurse(id){
        var rows = await BASECONTROL.Bfind(permission_model,{pid : id});
        if(rows.length == 0) {
            return;
        } else {
            for(var i = 0 ; i < rows.length ; i++){
                data.push(rows[i]);
                await recurse(rows[i].id);
            }
        }
    }
    if(role.permission == CONFIG.USERS.superadmin){
        data = await BASECONTROL.Bfind(permission_model,);
    }else{
        await recurse(role.permission);
    }
    return data;
}
/////////////////-------------role manger- cms
exports.role_manager_load = async (req,res,next) =>{

    var roles_array = await BASECONTROL.BSortfind(permission_model,{},{order : 1});
    var roles = await BASECONTROL.BSortfind(testsidebarmodel,{},{order : 1});
    if(roles){
        var newdata = BASECONTROL.array_sort(roles,"order")
        res.json({status : true,data : newdata,roles :roles_array })
        return next();
    }else{
        res.json({status : false})
        return next();
    }
}

exports.role_manager_update = async (req,res,next)=>{
    var indata = req.body.data;
    for(var i = 0 ; i < indata.length ; i++)
    {
        var updatehandle =  await BASECONTROL.BfindOneAndUpdate(testsidebarmodel,{_id : indata[i]._id},indata[i]);
        if(!updatehandle){
            res.json({status : false,data : "fail"});
            return next();
        }
    }
    var  findhandle = await BASECONTROL.BSortfind(testsidebarmodel,{},{order : 1});     
    if(!findhandle){
        res.json({status : false,data : "fail"})
        return next();
    }else{
        res.json({status : true,data : findhandle})
        return next();
    }
}

exports.adminsidebar_load = async (req,res,next) =>{
    var role = req.body.role;
    var condition = {};
    condition["roles."+role] = true;
    condition['status'] = true;
    var rdata = await BASECONTROL.BSortfind(sidebarmodel,condition,);
    if(rdata){
        var newrow = list_to_tree(rdata)
        res.json({status : true,data : newrow});
        return next();
    }else{
        res.json({status : false,data : []});
        return next();
    }
}

exports.userdetail_save = async(req,res,next)=>{
    var user = req.body.user;
    var rdata = await BASECONTROL.BfindOneAndUpdate(adminUser,{email : user.email},user);
    if(rdata){
        jwt_regiser(rdata,(returndata)=>{
            res.json(returndata)
            return next();
        })
    }else{
        res.json({
            status : false,
            data : "Email not found"
        })
        return next();
    }
}

exports.adminuser_again = async (req,res,next)=>{
    // req.body.newinfor.password =await BASECONTROL.jwt_encode(req.body.newinfor.password);
    var rdata = await BASECONTROL.BfindOneAndUpdate(adminUser,{_id : req.body.newinfor._id},req.body.newinfor);
    if(!rdata){
        res.json({
            status : false,
            data: 'failture'
        });
        next();
    }else{
        this.get_users_load(req,res,next);
        return;
    }
}

exports.Player_register = async(req,res,next)=>{
    register_action(req,async(rdata)=>{
        if(rdata.status){
            PlayersController.players_load(req,res,next);
        }else{
            res.json(rdata);
            return next();
        }
    });
}