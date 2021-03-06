const BASECONTROL = require("./basecontroller");
const USERS = require("../models/users_model");
const sidebarmodel = USERS.sidebarmodel;
const permission_model = USERS.permission_model;

exports.roles_load = async (req,res,next)=>{
    var findhandle = "";
    findhandle = await BASECONTROL.BSortfind(permission_model,{},{order : 1});
    var  roles = await BASECONTROL.Bfind(sidebarmodel);
    if(!findhandle){
        res.json({status : false,data : "fail"})
        return next();
    }else{
        var data = BASECONTROL.array_sort(findhandle,"order")
        res.json({status : true,data : data,list :roles})
        return next();
    }
}

exports.roles_add = async(req,res,next) =>{ 
    var data = req.body.data;
    var roles = await BASECONTROL.Bfind(sidebarmodel,{pid : data.pid});
    var order = 1;
    if(roles.length > 0){
        order = roles[roles.length-1].order + 1;
    }
    data['order'] = order;    
    var shandle = await BASECONTROL.data_save(data,sidebarmodel);
    if(shandle){
        res.json({status : true});
        return next();
    }else{
        res.json({status : false});
        return next();
    }
}

exports.roles_delete = async(req,res,next) =>{
    var data = req.body.data;
    var ids = await get_deleteids(data.id);
    for(var i = 0 ; i < ids.length ; i++){
        var handel = await BASECONTROL.BfindOneAndDelete(sidebarmodel,{id : ids[i]})
    }
    res.json({status : true});
    return next()
}

async function get_deleteids(id) {
    var data = [];
    async function  fact(pid){
        var child = await BASECONTROL.Bfind(sidebarmodel,{pid : pid});
        if(child.length > 0){
            for(var i = 0 ; i < child.length ; i++){
                data.push(child[i].id);
                await fact(child[i].id);
            }
        }else{
            return;
        }
    }
    await fact(id);
    data.push(id);
    return data;
}

async function get_deletePids(pid){
    var data = [];
    async function fact(parent){
        var pitems = await BASECONTROL.BfindOne(sidebarmodel,{id : parent});
        if(pitems){
            data.push(pitems);
            await fact(pitems.pid);
        }else{
            return;
        }
    }
    if(pid != "0"){
        await fact(pid)
        return data;
    }else{
        return [];
    }
}


exports.roles_update = async(req,res,next) =>{
    var data = req.body.data;
    var row = {};
    row['title'] = data.title;
    row['navLink'] = data.navLink;
    row['icon'] = data.icon;
    row['status'] = data.status;
    row['roles'] = data.roles;
    var uhandle = await BASECONTROL.BfindOneAndUpdate(sidebarmodel,{id : data.id},row);
    // var pids = await get_deletePids(uhandle.pid);
    // for(var i = 0 ; i < pids.length ; i++){
    //     uhandle = await BASECONTROL.BfindOneAndUpdate(sidebarmodel,{id :pids[i].id},{roles : data.roles,status : data.status});
    // }
    var ids = await get_deleteids(data.id);
    for(var i = 0 ; i < ids.length ; i++){
        uhandle = await BASECONTROL.BfindOneAndUpdate(sidebarmodel,{id :ids[i]},{roles : data.roles,status : data.status});
    }
    if(uhandle){
        res.json({status : true});
        return next()
    }else{ 
        res.json({status : false});
        return next()
    }
}