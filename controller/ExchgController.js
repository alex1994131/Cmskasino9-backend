const BASECONTROL = require("./basecontroller");
const EXCHG = require("../models/exchg_model");
const EXCHGDATAMODEL = EXCHG.ExchgModel;
const exchgXmlConfig = require("../config/exchgXmlConfig");

// CMS
exports.load_exchgdata = async (req , res , next) => {
    EXCHGDATAMODEL.find({} , "_id Id Name DisplayOrder IsEnabledForMultiples icon viewBox color status").sort({DisplayOrder : 1}).then( data => {
        res.json({status : true , data : data});
        return next();
    }).catch(err => {
        res.json({status : false});
        return next();
    })    
}

exports.exchg_update = async (req , res , next) => {
    var indata = req.body.data;
    for(var i = 0 ; i < indata.length ; i++)
    {
        delete indata[i]._id
        var updatehandle =  await BASECONTROL.BfindOneAndUpdate(EXCHGDATAMODEL,{Id : indata[i].Id},indata[i]);
        if(!updatehandle){
            res.json({status : false , data : "fail1"});
            return next();
        }
    }
    var  findhandle = await BASECONTROL.BSortfind(EXCHGDATAMODEL,{},{ DisplayOrder :1 });
    if(!findhandle){
        res.json({status : false , data : "fail2"})
        return next();
    }else{
        res.json({status : true,data : findhandle})
        return next();
    }
}

// Frontend
exports.getExchgHeaderData = async(req,res,next)=>{
    EXCHGDATAMODEL.find({status : true} , "Id Name icon viewBox color").sort({DisplayOrder : 1}).then( data => {
        res.json({status : true , data : data});
        return next();
    }).catch(err => {
        res.json({status : false});
        return next();
    })
}

exports.getExchgData = async(req,res,next)=>{
    var data = req.body.data;
    EXCHGDATAMODEL.findOne({Id : data.Id}).then( result => {
        res.json({status : true , data : result.Category});
        return next();
    }).catch(err => {
        res.json({status : false});
        return next();
    })
}

// Event
exports.ListTopLevelEvents = async (req,res,next) => {
    await BASECONTROL.sendRequest(exchgXmlConfig.ListTopLevelEvents() , async (ListTopLevelEventsData) => {
        if(ListTopLevelEventsData){
            var saveData = [];
            var ListTopLevelEventsResponse = ListTopLevelEventsData['ListTopLevelEventsResponse'][0]['ListTopLevelEventsResult'][0]['EventClassifiers'];
            for(var i = 0 ; i < ListTopLevelEventsResponse.length ; i ++) {
                var data = ListTopLevelEventsResponse[i]['$'];
                var temp = {
                    Id: data.Id,
                    Name: data.Name,
                    DisplayOrder: data.DisplayOrder,
                    IsEnabledForMultiples: data.IsEnabledForMultiples,
                }
                var key = await BASECONTROL.BfindOneAndUpdate(EXCHGDATAMODEL , temp);
                if(!key){
                    await BASECONTROL.data_save(temp , EXCHGDATAMODEL);
                }
            }
            res.json({status : true , message : "successfully saved data."});
            return next();
        }else{
            res.json({status : false , message : "this request is error."});
            return next();
        }
    });
}

exports.GetEventSubTreeNoSelections = (req,res,next) => {
    EXCHGDATAMODEL.find({}).then(async(data) => {
        var temp_key = 0;
        for(var i = 0 ; i < data.length ; i ++){
            await BASECONTROL.sendRequest(exchgXmlConfig.GetEventSubTreeNoSelections(data[i].Id) , async (GetEventSubTreeNoSelectionsData) => {
                var GetEventSubTreeNoSelectionsResponse = GetEventSubTreeNoSelectionsData['GetEventSubTreeNoSelectionsResponse'][0]['GetEventSubTreeNoSelectionsResult'][0]['EventClassifiers'][0];
                var eventId = GetEventSubTreeNoSelectionsResponse['$'].Id;
                var GetEventSubTreeNoSelectionsResult = GetEventSubTreeNoSelectionsResponse['EventClassifiers'];
                var Category = [];
                for(var j = 0 ; j < GetEventSubTreeNoSelectionsResult.length ; j ++){
                    var subData = GetEventSubTreeNoSelectionsResult[j]['$'];
                    var subNavData = GetEventSubTreeNoSelectionsResult[j]['EventClassifiers'] ? GetEventSubTreeNoSelectionsResult[j]['EventClassifiers'] : [];
                    var Matchs = [];
                    if(subNavData.length){
                        for(var k = 0 ; k < subNavData.length ; k ++){
                            var subMatchData = subNavData[k]['$'];
                            if(subNavData[0]['EventClassifiers']){
                                var subNavMatchData = subNavData[k]['EventClassifiers'] ? subNavData[k]['EventClassifiers'] : [];
                                for(var l = 0 ; l < subNavMatchData.length ; l ++){
                                    var subMarketData = subNavMatchData[l]['$'];
                                    subMarketData.SId = subMatchData.Id;
                                    subMarketData.SName = subMatchData.Name;
                                    subMarketData.SDisplayOrder = subMatchData.DisplayOrder;
                                    subMarketData.SIsEnabledForMultiples = subMatchData.IsEnabledForMultiples;
                                    subMarketData.SParentId = subMatchData.ParentId;
                                    var subNavMarketData = subNavMatchData[l]['Markets'] ? subNavMatchData[l]['Markets'] : [];
                                    var Market = [];
                                    for(var m = 0 ; m < subNavMarketData.length ; m ++){
                                        var subOddsData = subNavMarketData[m]['$'];
                                        Market.push(subOddsData);
                                    }
                                    subMarketData.marketData = Market;
                                    Matchs.push(subMarketData);    
                                }
                            }else{
                                var subNavMarketData = subNavData[k]['Markets'] ? subNavData[k]['Markets'] : [];
                                var Market = [];
                                for(var l = 0 ; l < subNavMarketData.length ; l ++){
                                    var subOddsData = subNavMarketData[l]['$'];
                                    Market.push(subOddsData);
                                }                                
                                subMatchData.marketData = Market;
                                Matchs.push(subMatchData);    
                            }
                        }
                    }
                    subData.SubData = Matchs;
                    Category.push(subData);
                }
                await EXCHGDATAMODEL.updateOne({Id:eventId},{Category:Category}).then(err=>{});
                temp_key ++;
                if(temp_key == data.length){
                    res.json({status : true , message : "successfully saved data."});
                    return next();
                }
            });
        }
    }).catch(err => {
        res.json({status : false , message : err});
        return next();
    })
}