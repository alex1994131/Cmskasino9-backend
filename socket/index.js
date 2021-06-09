const SessionModel = require("../models/users_model").sessionmodel
const gamesessionmodel = require("../models/users_model").gamesessionmodel
const sports_list = require("../models/sports_model").sports_list;
const odds_change = require("../models/sports_model").odds_change;
const net_player = require("../models/users_model").GamePlay;
const user_bet = require("../models/sports_model").user_bet;
const sporttemp = require("../models/sports_model").sporttemp;

const BASECONTROL = require("../controller/basecontroller");
const config = require("../config");
const gameexpiredtime = config.gamesession.expiretime * 1000;

var ObjectId = require('mongodb').ObjectID;
var hex = require('string-hex');
var userexpiredtime = config.session.expiretime * 1000
var index = 0;

module.exports = (io) => {
  io.on("connection",async(socket) => {

    save(socket.handshake.query,socket.id)

  socket.on("gamesavetoken",async(rdata)=>{
    var find = await BASECONTROL.BfindOne(gamesessionmodel,{ email : rdata.email});
    if(!find){
      rdata["socketid"] = socket.id;
      var savehandle =  await BASECONTROL.data_save(rdata,gamesessionmodel);
      if(!savehandle){
        socket.emit("gamedestory",{data : false})
      }
    }else{
      socket.emit("gamedestory",{data : false})
    }
  });

  socket.on("gamedelete",async(rdata)=>{
    await gamesessionremove(rdata.data);
  });

  
  
  socket.on('disconnect', async(disdata) => {
  });

    socket.on("sport_javaSocketConnect",async(data)=>{
      var result = await BASECONTROL.BfindOne(sporttemp , {key : "timestamp"});
      if(!result){
        socket.emit("sendTimeStamp" , {timestamp : "false"});
      }else{
        socket.emit("sendTimeStamp" , {timestamp : result.timestamp});
      }
    });

    socket.on("sport_allSportsInfo",async(data)=>{
      for(var i = 0 ; i < data.data.length ; i ++){
        var sport = await BASECONTROL.BfindOneAndUpdate(sports_list , {sport_id : data.data[i].sport_id},data.data[i]);
        if(!sport){
          await BASECONTROL.data_save(data.data[i] , sports_list);
        }
      }
    });

    socket.on("market_list" , async(data) => {
    })

    socket.on("fixturechange",async(data)=>{
      if(data.data.OddsType == "SoccerEvent" || data.data.OddsType == "Match"){
        await saveTimeStamp(data.timestamp);
        var row = await BASECONTROL.BfindOneAndUpdate(odds_change ,{event_id : data.data.event_id} , data.data);
        data.data.permission = true; /////////////////////////////////////
        if(!row){
          await BASECONTROL.data_save(data.data , odds_change);
          io.sockets.emit('broadcast', {data : data.data , key : "fixturechange"});
        }else{
          io.sockets.emit('broadcast', {data : row , key : "fixturechange"});
        }
      }
    });

    socket.on("sport_oddschange",async(data)=>{
      sporttemp.create({time : "Tue Oct 27 04:19:18 PDT 2020"})
      if(!data.data.event_id) return;
      if(data.data.OddsType == "SoccerEvent" || data.data.OddsType == "Match"){
        await saveTimeStamp(data.timestamp);
        var saveData = data.data;
        saveData.market = data.market;
        saveData.permission = true; //////////////////////////////////////
        var row = await BASECONTROL.BfindOne(odds_change ,{event_id : saveData.event_id});
        if(row){
          var market = row.market;
          if(market && market.length){
            for(var i = 0 ; i < saveData.market.length; i ++){
              var index = market.findIndex(item => 
                item.MarketName === saveData.market[i].MarketName && 
                item.MarketId === saveData.market[i].MarketId && 
                item.MarketSpecifiers === saveData.market[i].MarketSpecifiers
              );
              if(index > -1){
                market[index] = saveData.market[i];
              }else{
                market.push(saveData.market[i]);
              }
            }
          }else{
            market = saveData.market;
          }
          saveData.market = market;
          odds_change.updateOne({event_id : saveData.event_id} , saveData).then(err=>{
            io.sockets.emit('broadcast', {data : row , key : "oddschange"});
          })
        }else{
          BASECONTROL.data_save(saveData , odds_change);
          io.sockets.emit('broadcast', {data : saveData , key : "oddschange"});
        }
      }
    });

    socket.on("betstop",async(data)=>{
      await saveTimeStamp(data.timestamp);
      var row = await BASECONTROL.BfindOne(odds_change ,{event_id : data.event_id});
      if(row){
        var market = row.market;
        var temp = 0;
        for(var i = 0 ; i < market.length ; i ++){
          market[i].MarketStatus = "Suspended";
          temp ++;
          if(temp == market.length){
            odds_change.updateOne({event_id : data.event_id} , {market : market}).then(err => {
              io.sockets.emit('broadcast', {data : row , key : "betstop"});
            })
          }
        }
      }
    });

    socket.on("betsettlement",async(data)=>{
      if(!data.event_id) return;
      await saveTimeStamp(data.timestamp);
      odds_change.updateOne({event_id : data.event_id} , {market : data.market , EventStatus : "Finished"} , async(err) => {
        for(var i = 0 ; i < data.market.length ; i ++){
          var market = data.market[i];
          for(var j = 0 ; j < market.Outcomes.length ; j ++){
            var outcome = market.Outcomes[j];
            var searchData = {
              "GAMEID" : data.event_id , 
              "betting.MarketId" : market.MarketId, 
              "betting.MarketName" : market.MarketName, 
              "betting.MarketSpecifiers" : market.MarketSpecifiers ? market.MarketSpecifiers : "",
              "betting.OutcomeId" : outcome.OutcomeId , 
              "betting.OutcomeName" : outcome.OutcomeName, 
              "TYPE" : "BET",
              "betting.handleState" : false
            }
            var allBet = await BASECONTROL.Bfind(user_bet , searchData);
            for(var k = 0 ; k < allBet.length ; k ++){              
              var bet_one_item = allBet[k];
              if(outcome.OutcomeResult.toLowerCase() == "won"){
                if(bet_one_item.betting.betType.toLowerCase() === "single"){
                  var updateMoney = parseFloat(bet_one_item.betting.OutcomeOdds) * parseFloat(bet_one_item.AMOUNT);
                  var bonus = 0;
                  if(outcome.OutcomeVoidFactor == 0.5){
                    await user_bet.updateOne(bet_one_item , {"betting.handleState" : true , TYPE : "WIN" , "betting.isVFHALFWIN" : true}).then(async(err)=>{
                      bonus += parseFloat(bet_one_item.AMOUNT) / 2;
                      updateMoney = parseFloat(updateMoney) / 2;
                    })
                  }else if(outcome.OutcomeDeadHeatFactor == 0.33){
                    await user_bet.updateOne(bet_one_item , {"betting.handleState" : true , TYPE : "WIN" , "betting.isDHFTHIRDWIN" : true}).then(async(err)=>{
                      updateMoney = parseFloat(updateMoney) * 0.33;
                    })
                  }else if(outcome.OutcomeDeadHeatFactor == 0.5){
                    await user_bet.updateOne(bet_one_item , {"betting.handleState" : true , TYPE : "WIN" , "betting.isDHFHALFWIN" : true}).then(async(err)=>{
                      updateMoney = parseFloat(updateMoney) * 0.5;
                    })
                  }else{
                      await user_bet.updateOne(bet_one_item , {"betting.handleState" : true , TYPE : "WIN"}).then(async(err)=>{
                      })
                  }if(bonus){
                    updateMoney = parseFloat(updateMoney) + parseFloat(bonus);
                  }
                  await setBalance(bet_one_item.USERID , updateMoney , 1);
                }else{
                  if(outcome.OutcomeVoidFactor == 0.5){
                    await user_bet.updateOne(bet_one_item , {"betting.handleState" : true , TYPE : "WIN" , "betting.isVFHALFWIN" : true}).then(async(err)=>{})
                  }else if(outcome.OutcomeDeadHeatFactor == 0.33){
                    await user_bet.updateOne(bet_one_item , {"betting.handleState" : true , TYPE : "WIN" , "betting.isDHFTHIRDWIN" : true}).then(async(err)=>{})
                  }else if(outcome.OutcomeDeadHeatFactor == 0.5){
                    await user_bet.updateOne(bet_one_item , {"betting.handleState" : true , TYPE : "WIN" , "betting.isDHFHALFWIN" : true}).then(async(err)=>{})
                  }else{
                    await user_bet.updateOne(bet_one_item , {"betting.handleState" : true , TYPE : "WIN"}).then(async(err)=>{})
                  }
                  var multiData = await BASECONTROL.Bfind(user_bet , { "betting.transactionId" : bet_one_item.betting.transactionId , TYPE : "BET"});
                  if(!multiData || !multiData.length){
                    var multiLostData = await BASECONTROL.Bfind(user_bet , { "betting.transactionId" : bet_one_item.betting.transactionId , TYPE : "LOST"});
                    if(!multiLostData || !multiLostData.length){
                      var multiWinData = await BASECONTROL.Bfind(user_bet , { "betting.transactionId" : bet_one_item.betting.transactionId , TYPE : "WIN"});
                      var updateMoney = parseFloat(multiWinData[0].AMOUNT);
                      var bonus = 0;
                      for(var p = 0 ; p < multiWinData.length ; p ++){
                        updateMoney = parseFloat(multiWinData[p].betting.OutcomeOdds) * parseFloat(updateMoney);
                        if(multiWinData[p].betting.isVFHALFWIN){
                          updateMoney = parseFloat(updateMoney) / 2;
                          bonus += parseFloat(multiWinData[p].AMOUNT) / 2;
                        }else if(multiWinData[p].betting.isDHFTHIRDWIN){
                          updateMoney = parseFloat(updateMoney) * 0.33;
                        }else if(multiWinData[p].betting.isDHFHALFWIN){
                          updateMoney = parseFloat(updateMoney) * 0.5;
                        }
                        if(p == multiWinData.length - 1){
                          if(bonus){
                            updateMoney = parseFloat(updateMoney) + parseFloat(bonus);
                          }
                          await setBalance(bet_one_item.USERID , updateMoney , 1)
                        }
                      }
                    }
                  }
                }
              }else{
                if(outcome.OutcomeVoidFactor == 1){
                  await user_bet.updateOne(bet_one_item , { "betting.handleState" : true , TYPE : "LOST" , "betting.isVFHALFLOST" : true}).then(async(err)=>{
                    await setBalance(bet_one_item.USERID , bet_one_item.AMOUNT , 1);
                  });
                }else if(outcome.OutcomeVoidFactor == 0.5){
                  await user_bet.updateOne(bet_one_item , { "betting.handleState" : true , TYPE : "LOST" , "betting.isVFALLLOST" : true}).then(async(err)=>{
                    await setBalance(bet_one_item.USERID , parseFloat(bet_one_item.AMOUNT) / 2 , 1);
                  });
                }else{
                  await user_bet.updateOne(bet_one_item , { "betting.handleState" : true , TYPE : "LOST"}).then(err=>{});
                }
              }
            }
          }
        }
        data.permission = true;
        io.sockets.emit('broadcast', {data :data , key : "betsettlement"});
      })
    });

    socket.on("rollbackbetsettlement" , async(data) => {
      await saveTimeStamp(data.timestamp);
      for(var i = 0 ; i < data.market.length ; i ++){
        var market = data.market[i];
        var searchData = {
          GAMEID : data.event_id,
          "betting.MarketId" : market.MarketId, 
          "betting.MarketName" : market.MarketName, 
          "betting.MarketSpecifiers" : market.MarketSpecifiers ? market.MarketSpecifiers : "",
          "TYPE" : "WIN",
          "betting.handleState" : true
        }
        var bet_won = await BASECONTROL.Bfind(user_bet , searchData);
        for(var k = 0 ; k < bet_won.length ; k ++){
          var bet_won_item = bet_won[k];
          if(bet_won_item.TYPE.toLowerCase() == "win"){
            if(bet_won_item.betting.betType.toLowerCase() === "single"){
              var updateMoney = parseFloat(bet_won_item.betting.OutcomeOdds) * parseFloat(bet_won_item.AMOUNT);
              var bonus = 0;
              if(bet_won_item.betting.isVFHALFWIN){
                await user_bet.updateOne(bet_won_item , {"betting.handleState" : false , TYPE : "BET" , "betting.isVFHALFWIN" : false}).then(async(err)=>{
                  bonus += parseFloat(bet_won_item.AMOUNT) / 2;
                  updateMoney = parseFloat(updateMoney) / 2;
                })
              }else if(bet_won_item.betting.isDHFTHIRDWIN){
                await user_bet.updateOne(bet_won_item , {"betting.handleState" : false , TYPE : "BET" , "betting.isDHFTHIRDWIN" : false}).then(async(err)=>{
                  updateMoney = parseFloat(updateMoney) * 0.33;
                })
              }else if(bet_won_item.betting.isDHFHALFWIN){
                await user_bet.updateOne(bet_won_item , {"betting.handleState" : false , TYPE : "BET" , "betting.isDHFHALFWIN" : false}).then(async(err)=>{
                  updateMoney = parseFloat(updateMoney) * 0.5;
                })
              }else{
                  await user_bet.updateOne(bet_won_item , {"betting.handleState" : false , TYPE : "BET"}).then(async(err)=>{})
              }if(bonus){
                updateMoney = parseFloat(updateMoney) + parseFloat(bonus);
              }
              await setBalance(bet_won_item.USERID , updateMoney , 0);
            }else{
              if(bet_won_item.betting.isVFHALFWIN){
                await user_bet.updateOne(bet_won_item , {"betting.handleState" : false , TYPE : "BET" , "betting.isVFHALFWIN" : false}).then(async(err)=>{})
              }else if(bet_won_item.betting.isDHFTHIRDWIN){
                await user_bet.updateOne(bet_won_item , {"betting.handleState" : false , TYPE : "BET" , "betting.isDHFTHIRDWIN" : false}).then(async(err)=>{})
              }else if(bet_won_item.betting.isDHFHALFWIN){
                await user_bet.updateOne(bet_won_item , {"betting.handleState" : false , TYPE : "BET" , "betting.isDHFHALFWIN" : false}).then(async(err)=>{})
              }else{
                await user_bet.updateOne(bet_won_item , {"betting.handleState" : false , TYPE : "BET"}).then(async(err)=>{})
              }
              var multiData = await BASECONTROL.Bfind(user_bet , { "betting.transactionId" : bet_won_item.betting.transactionId , TYPE : "WIN"});
              if(!multiData || !multiData.length){
                var multiLostData = await BASECONTROL.Bfind(user_bet , { "betting.transactionId" : bet_won_item.betting.transactionId , TYPE : "LOST"});
                if(!multiLostData || !multiLostData.length){
                  var multiBetData = await BASECONTROL.Bfind(user_bet , { "betting.transactionId" : bet_won_item.betting.transactionId , TYPE : "BET"});
                  var updateMoney = parseFloat(multiBetData[0].AMOUNT);
                  var bonus = 0;
                  for(var p = 0 ; p < multiBetData.length ; p ++){
                    updateMoney = parseFloat(multiBetData[p].betting.OutcomeOdds) * parseFloat(updateMoney);
                    if(multiBetData[p].betting.isVFHALFWIN){
                      updateMoney = parseFloat(updateMoney) / 2;
                      bonus += parseFloat(multiBetData[p].AMOUNT) / 2;
                    }else if(multiBetData[p].betting.isDHFTHIRDWIN){
                      updateMoney = parseFloat(updateMoney) * 0.33;
                    }else if(multiBetData[p].betting.isDHFHALFWIN){
                      updateMoney = parseFloat(updateMoney) * 0.5;
                    }
                    if(p == multiBetData.length - 1){
                      if(bonus){
                        updateMoney = parseFloat(updateMoney) + parseFloat(bonus);
                      }
                      await setBalance(bet_won_item.USERID , updateMoney , 0)
                    }
                  }
                }
              }
            }
          }else{
            if(bet_won_item.betting.isVFHALFLOST){
              await user_bet.updateOne(bet_won_item , { "betting.handleState" : false , TYPE : "BET" , "betting.isVFHALFLOST" : false}).then(async(err)=>{
                await setBalance(bet_won_item.USERID , bet_won_item.AMOUNT , 0);
              });
            }else if(bet_won_item.betting.isVFALLLOST){
              await user_bet.updateOne(bet_won_item , { "betting.handleState" : false , TYPE : "BET" , "betting.isVFALLLOST" : false}).then(async(err)=>{
                await setBalance(bet_won_item.USERID , parseFloat(bet_won_item.AMOUNT) / 2 , 0);
              });
            }else{
              await user_bet.updateOne(bet_won_item , { "betting.handleState" : false , TYPE : "BET"}).then(err=>{});
            }
          }
        }
      }
    })

    socket.on("betcancel" , async(data) => {
      sporttemp.create({key : "betcancel" , data : data});
      await saveTimeStamp(data.timestamp);
      for(var i = 0 ; i < data.market.length ; i ++){
        var market = data.market[i];
        var searchData = {
          GAMEID : data.event_id,
          "betting.MarketId" : market.MarketId, 
          "betting.MarketName" : market.MarketName, 
          "betting.MarketSpecifiers" : market.MarketSpecifiers ? market.MarketSpecifiers : "",
          "TYPE" : "BET",
          "betting.handleState" : false
        }
        var result = await BASECONTROL.Bfind(user_bet , searchData);
        if(result){
          for(var i = 0 ; i < result.length ; i ++){
            var result_item = result[i];
            var flag = false;
            if(data.StartTime && data.EndTime){
              if(new Date(data.StartTime) <= new Date(result_item.DATE) && new Date(result_item.DATE) <= new Date(data.EndTime)){
                flag = true;
              }
            }else if(data.StartTime && !data.EndTime){
                if(new Date(data.StartTime) <= new Date(result_item.DATE)){
                  flag = true;
                }
            }else if(!data.StartTime && data.EndTime){
              if(new Date(result_item.DATE) <= new Date(data.EndTime)){
                flag = true;
              }
            }else if(!data.StartTime && !data.EndTime){
              flag = true;
            }
            if(flag){
              if(result_item.betting.betType.toLowerCase() == "single"){
                await user_bet.updateOne(result_item , {TYPE : "BCANCEL" , "betting.handleState" : true});
                await setBalance(result_item.USERID , result_item.AMOUNT , 1);
              }else{
                var multiData = await BASECONTROL.Bfind(user_bet , { "betting.transactionId" : result_item.betting.transactionId , TYPE : "BET"});
                if(multiData.length){
                  await setBalance(result_item.USERID , result_item.AMOUNT , 1);
                  user_bet.updateMany({"betting.transactionId" : result_item.betting.transactionId} , {TYPE : "BCANCEL" , "betting.handleState" : true})
                }
              }
            }
          }
        }
      }
    })

    socket.on("rollbackbetcancel" , async(data) => {
      sporttemp.create({key : "rollbackbetcancel" , data : data});
      await saveTimeStamp(data.timestamp);
      for(var i = 0 ; i < data.market.length ; i ++){
        var market = data.market[i];
        var searchData = {
          GAMEID : data.event_id,
          "betting.MarketId" : market.MarketId, 
          "betting.MarketName" : market.MarketName, 
          "betting.MarketSpecifiers" : market.MarketSpecifiers ? market.MarketSpecifiers : "",
          "TYPE" : "BCANCEL",
          "betting.handleState" : true
        }
        var result = await BASECONTROL.Bfind(user_bet , searchData);
        if(result){
          for(var i = 0 ; i < result.length ; i ++){
            var result_item = result[i];
            var flag = false;
            if(data.StartTime && data.EndTime){
              if(new Date(data.StartTime) <= new Date(result_item.DATE) && new Date(result_item.DATE) <= new Date(data.EndTime)){
                flag = true;
              }
            }else if(data.StartTime && !data.EndTime){
                if(new Date(data.StartTime) <= new Date(result_item.DATE)){
                  flag = true;
                }
            }else if(!data.StartTime && data.EndTime){
              if(new Date(result_item.DATE) <= new Date(data.EndTime)){
                flag = true;
              }
            }else if(!data.StartTime && !data.EndTime){
              flag = true;
            }
            if(flag){
              if(result_item.betting.betType.toLowerCase() == "single"){
                await user_bet.updateOne(result_item , {TYPE : "BET" , "betting.handleState" : false});
                await setBalance(result_item.USERID , result_item.AMOUNT , 1);
              }else{
                var multiData = await BASECONTROL.Bfind(user_bet , { "betting.transactionId" : result_item.betting.transactionId , TYPE : "BCANCEL"});
                if(multiData.length){
                  await setBalance(result_item.USERID , result_item.AMOUNT , 1);
                  user_bet.updateMany({"betting.transactionId" : result_item.betting.transactionId} , {TYPE : "BET" , "betting.handleState" : false})
                }
              }
            }
          }
        }
      }
    });

    socket.on("sport_recovery_event" , async(data) => {
      if(data.key == "onProducerStatusChange"){
        if(data.isDown){
          await odds_change.updateMany({} , {produceStatus : false}).then(() => {});
        }else{
          await odds_change.updateMany({} , {produceStatus : true}).then(() => {});
        }
        io.sockets.emit('broadcast', {data :{produceStatus : !data.isDown , permission : true} , key : "sport_recovery_event"});
      }
      if(data.key == "onConnectionDown"){
        await odds_change.updateMany({} , {produceStatus : false}).then(() => {});
        io.sockets.emit('broadcast', {data :{produceStatus : false , permission : true} , key : "sport_recovery_event"});
      }
    })
  });
  setInterval(async() => {

    var findhandle =  await BASECONTROL.Bfind(gamesessionmodel);
    for(var i = 0 ; i < findhandle.length ; i++){
      var lasttime = findhandle[i].intimestamp;
      var nowtime = BASECONTROL.get_timestamp();
      var expire = nowtime - parseInt(lasttime);
      if( expire > gameexpiredtime){
        await gamesessionremove(findhandle[i]);
        io.sockets.emit('expiredestory',{ data:findhandle[i]});
      }else{

      }
    }

    var usersession = await BASECONTROL.Bfind(SessionModel);
    for(var i = 0 ; i < usersession.length ; i++){
      var lasttime = usersession[i].intimestamp;
      var nowtime = BASECONTROL.get_timestamp();
      var expire = nowtime - parseInt(lasttime);
      if( expire > userexpiredtime){
        await sessionremove(usersession[i]);
        io.sockets.emit('userexpiredestory',{ data:usersession[i]});
      }else{

      }
    }

  var players =  await BASECONTROL.Bfind(net_player);
  io.sockets.emit('balance',{ data:players});
}, 5000);



  async function sessionremove(inputdata){
    await SessionModel.findOneAndDelete({email : inputdata.email}).then(rdata=>{
      outdata = rdata;
    });
  }

  async function gamesessionremove(inputdata){
    await gamesessionmodel.findOneAndDelete({email : inputdata.email}).then(rdata=>{
      outdata = rdata;
    });
  }


  async function save(data,socketid){
    if(data.email){
        index++;
        var socketid__ = index + socketid;
        id = ObjectId(hex(socketid__).slice(0,24));
      data["_id"] = id;
      var fhandle = await BASECONTROL.BfindOne(SessionModel,{email : data.email});
      if(fhandle){
        await BASECONTROL.BfindOneAndUpdate(SessionModel,{email : data.email},{intimestamp : new Date().valueOf()});
      }else{
        await BASECONTROL.data_save(data,SessionModel);
      }
    }
  }

};

async function saveTimeStamp(timestamp){
  if(timestamp){
    await sporttemp.findOne({key : "timestamp"}).then( async (data) => {
      if(data){
        await sporttemp.updateOne({key : "timestamp"} , {timestamp : timestamp});
        return true;
      }else{
        await sporttemp.create({key : "timestamp" , timestamp : timestamp})
        return true;
      }
    })
  }else{
    return false;
  }
}

async function setBalance(id,changeBalance,flag){
  var userData = await BASECONTROL.BfindOne(net_player , {id : id});
  var realBalance = 0;
  if(flag){
    realBalance = (parseFloat(userData.balance) + parseFloat(changeBalance)).toFixed(2);
  }else{
    realBalance = (parseFloat(userData.balance) - parseFloat(changeBalance)).toFixed(2);
  }
  await net_player.updateOne({id : id} , {balance : realBalance})
}



/*

  Sports Bet result type : 

  LOST,           Bet lost
  WIN,            Bet win
  CANCEL,         user cash out
  BCANCEL,        bet cancelled 

  VFHALFWIN,      void factor = 0.5 win , 0.5 refund
  VFALLCANCEL,    void factor all refund 
  VFHALFCANCEL,   void factor half refund

  DHFHALFWIN,     dead heat half
  DHFTHIRDWIN,    dead heat one / third

*/