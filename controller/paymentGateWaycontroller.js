const express = require('express');
const router = express.Router();
const CryptoJS = require('crypto-js');
const request = require("request");
const moment = require('moment');
const BASECON = require("./basecontroller");
const CONFIG = require("../config");
const ERRORCONFIG = require("../config/paymenterror.json");
const adminUser = require("../models/users_model").adminUser;
const GamePlay = require("../models/users_model").GamePlay;
const Paymentconfig = require("../models/paymentGateWayModel").Paymentconfig;
const TransactionsHistory = require("../models/paymentGateWayModel").TransactionsHistory;
const WithdrawHistory = require("../models/paymentGateWayModel").WithdrawHistory;
const paymentMenuModel = require("../models/paymentGateWayModel").paymentMenuModel;
const paymentMethod = require("../models/paymentGateWayModel").paymentMethod;
const balance_histoy = require("../models/users_model").balance_histoy;
const payment_FTD_model = require("../models/paymentGateWayModel").payment_FTD_model

router.post("/PaymentconfigSave", (req,res,next) =>{
    let data = req.body.params;
    Paymentconfig.findOneAndUpdate({type:data.type}, data, { upsert: true }, (err, result)=>{
        console.log('err, result', err, result)
        if(err){
            return res.json({status:false, data:"failed"});
        }else{
            return res.json({status:true, data:"success"});
        }
    })
});

router.post("/PaymentconfigLoad", async (req,res,next) =>{
    let result = await Paymentconfig.findOne({ type:req.body.type });
    if(result){
        return res.json({ status:true, data:result });
    }else{
        return res.json({ status:false, data:'failed' });
    }
});

router.post("/paymentMethodLoad", async (req,res,next) =>{
    const { type, email } = req.body;
    let result = await paymentMethod.findOne({ type, email });
    if(result){
        return res.json({ status:true, data:result });
    }else{
        return res.json({ status:false, data:'failed' });
    }
});

router.post("/YaarPayCheckOut", async (req,res,next) =>{
    const { type, depositBankCode, bankType, amount, first_name, last_name, email } = req.body.params;
    let paymentconfigData = await Paymentconfig.findOne({type});
    if(!paymentconfigData){
        return res.json({ status : false, data: 'failed' });
    }else if(!paymentconfigData.state){
        return res.json({ status : false, data: type+' has been disabled.' });
    }
    else{
        const { merchant_id, merchant_key, application_id, request_url, notify_url2, notify_url, return_url2, return_url } = paymentconfigData.configData;
        const currency = 'inr';
        const version = '1.0';
        const notify_urls = bankType=='8036'?notify_url2:notify_url;
        const return_urls = bankType=='8036'||depositBankCode=='YP_AXIS'?return_url2:return_url;
        const orderNO = "YaarpayDeposit-" + moment(new Date()).format('YYYYMMDDhhmmss');
        let rawSign='';
        if(bankType=='8036'){
            rawSign='amount='+(parseInt(amount)*100)+
            '&appId='+application_id+
            "&channelId="+bankType+
            "&currency="+currency+
            "&depositBankCode="+depositBankCode+
            "&depositName="+first_name+" "+last_name+
            "&mchId="+merchant_id+
            "&mchOrderNo="+orderNO+
            "&notifyUrl="+notify_urls+
            "&returnUrl="+return_urls+
            "&version="+version+
            "&key="+merchant_key;
        }else{
            rawSign='amount='+(parseInt(amount)*100)+
            '&appId='+application_id+
            "&channelId="+bankType+
            "&currency="+currency+
            "&depositBankCode="+ depositBankCode+
            "&mchId="+merchant_id+
            "&mchOrderNo="+orderNO+
            "&notifyUrl="+notify_urls+
            "&returnUrl="+return_urls+
            "&version="+version+
            "&key="+merchant_key;
        }
        let sign = CryptoJS.MD5(rawSign).toString().toUpperCase(); 
        let successData={
            mchOrderNo:orderNO,
            version,
            channelId:bankType,
            amount:(parseInt(amount)*100).toString(),
            currency:currency,
            mchId:merchant_id,
            appId:application_id,
            notifyUrl:notify_urls,
            returnUrl:return_urls,
            sign,
            depositBankCode,
            depositName:bankType=='8036'?first_name+" "+last_name:null
        }
        let transactiondata = {
            type,
            email,
            order_no : orderNO,
            status : 'deposit',
            amount,
            requestData : req.body.params,
        };
        if(bankType=='8036'){
            transactiondata = Object.assign({}, transactiondata, {resultData:{
                orderAmount : amount,
                currency,
                status : 'processing',
                depositBankCode : depositBankCode
            }})
        }
        const transactionsHistory = new TransactionsHistory(transactiondata);
        transactionsHistory.save((err)=>{
            if(err){
                return res.json({status : false, data : "failed"});
            }else{
                return res.json({status : true, data : successData, request_url: request_url});
            }
        });
    }
});

router.post("/YaarReturn",async (req,res,next) =>{
    const data = req.body.cartId;
    let paymentconfigData = await Paymentconfig.findOne({ type : 'YaarPay' });
    if(!paymentconfigData){
        res.writeHead(301,{ Location : paymentconfigData.configData.return_url2});
        return res.end();
    }else{
        let transactionsHistory = await TransactionsHistory.findOne({'resultData.payOrderId' : data.cartId});
        if(transactionsHistory){
            res.writeHead(301,{ Location : paymentconfigData.configData.redirect_url+'/:'+data.cartId});
            return res.end();
        }else{
            res.writeHead(301,{ Location : paymentconfigData.configData.return_url2});
            return res.end();
        }
    }
});

router.post("/YaarNotyfy", async (req,res,next) =>{
    const { mchOrderNo, status } = req.body;
    let paymentconfig = await Paymentconfig.findOne({ type : 'YaarPay' });
    if(!paymentconfig){
        return res.json({ status : false, data: 'failed' });
    }else{
        let transactionsHistory = await TransactionsHistory.findOneAndUpdate({ order_no : mchOrderNo, resultData:null }, { resultData : req.body });
        if(!transactionsHistory){
            return res.status(500);
        }else{
            var state = status.toString().toLowerCase();
            var amount = parseFloat(transactionsHistory.amount)
            if(state==2){
                await BalanceUpdate(transactionsHistory.email, amount);
            }
            return res.status(200);
        }
    }
});

router.post("/YaarResults", async (req,res,next) =>{
    const { order_no } = req.body;
    let transactionsHistory = await TransactionsHistory.findOne({ 'resultData.payOrderId' : order_no, type:'YaarPay' });
    if(!transactionsHistory){
        return res.json({ status : false, data: 'failed' });
    }else{  
        return res.json({ status : true, data : transactionsHistory });
    }
});

router.post("/YaarPayWithdraw", async (req,res,next) =>{
    var data = req.body;
    let withdrawHistory = await WithdrawHistory.findOne({ "email": data.email, $or: [ { "status": "processing" }, { $or: [ { "status": "pending" } ] } ] });
    if(!withdrawHistory){
        let balanceData = await GamePlay.findOne({email:data.email});
        if(parseFloat(balanceData.balance)>parseFloat(data.amount)){
            let type = data.type+'-'+data.bankType;
            let paymentMethodData = { email:data.email, type, paymentData:data };
            await paymentMethod.findOneAndUpdate({type, email:data.email}, paymentMethodData, { upsert: true }, async(err)=>{
                if(err){
                    return res.json({status:false, data:"failed"});
                }else{
                    const withdrawHistoryData = new WithdrawHistory(data);
                    withdrawHistoryData.save((err)=>{
                        if(err){
                            return res.json({status : false, data : "failed"});
                        }else{
                            return res.json({status : true, data : "Success"});
                        }
                    });
                }
            })
        }else{
            return res.json({status : false, data : "You cannot withdraw many than the balance amount."});
        }
    }else{
        return res.json({status : false, data : "There has been a recent change to the withdrawal process, users are allowed to have only 1 pending withdrawal at a time. Please cancel and resubmit your withdrawal request."});
    }
});

router.post("/YaarNotyfy3",async (req,res,next) =>{
    var data = req.body;
    let resultData = await TransactionsHistory.findOneAndUpdate({order_no:data.mchOrderNo, resultData:null}, {resultData:Object.assign({}, data, {completedTime:(new Date)})});
    if(!resultData){
        return res.status(500);
    }else{
        var status = data.status.toString().toLowerCase();
        var amount = parseFloat(resultData.amount);
        if(status==2){
            await BASECON.email_balanceupdate(resultData.email, amount);
        }
        return res.status(200);
    }
});



router.post("/Payout", async (req,res,next) =>{
    var data = req.body;
    switch(data.type){
        case "YaarPay":
            return await YaarPayPayout(req,res,next);
        case "netcents":
            return await netcentsPayout(req,res,next);
        case "Qpay":
            return await QpayPayout(req,res,next);
    }
});


router.post("/transactionHistoryLoad", async (req,res,next) =>{
    var data = req.body;
    var resultData = [];
    var start = new Date(data.start);
    var end = new Date(data.end);
    await balance_histoy.find({type : 1, date :{$gte: start, $lte:end,},email : data.email}).then( rdata=>{
        resultData = rdata;
    });
    var query ={resultData: {$ne: null}, createDate :{$gte: start, $lte:end}};
    if(data.email){
        query ={resultData: {$ne: null}, email:data.email, createDate :{$gte: start, $lte:end}};
    }    
    await TransactionsHistory.find(query).then(async rdata =>{
        if(!rdata){
            res.json({ status : false, data: 'failed' });
            return next();
        }else{  
            for(var i in rdata){
                await adminUser.findOne({email:rdata[i].email}).then(async rdt=>{
                    if(!rdt){
                        await resultData.push([]);
                    }else{
                        
                        var transaction = rdata[i]._doc;
                        var userData = rdt._doc;
                        var dt = {};
                        if(transaction.type==='netcents'){
                            dt = {
                                id : transaction._id,
                                pid : userData.id,
                                transactionDate : transaction.resultData.blockchain_transactions[0].find_time,
                                createdDate :  transaction.createDate,
                                type : transaction.status,
                                paymentType : transaction.type,
                                currency : transaction.resultData.exchange_rate_currency,
                                amount : transaction.amount,
                                ps_name : transaction.type,
                                notes : '',
                                externalid : transaction.order_no,
                                status : transaction.resultData.transaction_status,
                                // cashdesk : transaction.resultData.transaction_currency,
                                username : userData.username,
                                requestData :transaction.requestData
                            }
                        }else if(transaction.type==='YaarPay'){
                            var status = '';
                            if(transaction.resultData.status==3){
                                status = 'Failed';
                            }else if(transaction.resultData.status==2){
                                status = 'Success';
                            }else if(transaction.resultData.status==1){
                                status = 'Processing';
                            }else{
                                status = transaction.resultData.status;
                            }
                            var paymentType = await getYaarPayBankName(""+transaction.requestData.bankType);
                            dt = {
                                id : transaction._id,
                                pid : userData.id,
                                transactionDate : new Date(parseInt(transaction.resultData.completedTime)),
                                createdDate :  transaction.createDate,
                                type : transaction.status,
                                paymentType : paymentType,
                                currency : transaction.resultData.currency,
                                amount : transaction.amount,
                                ps_name : transaction.resultData.depositBankCode,
                                notes : transaction.resultData.statusMessage ? transaction.resultData.statusMessage  : '',
                                externalid : transaction.order_no,
                                status : status,
                                // cashdesk : transaction.resultData.orderAmount ? transaction.resultData.orderAmount : transaction.resultData.amount/100,
                                username : userData.username,
                                requestData :transaction.requestData
                            }
                        }else if(transaction.type==='Qpay'){
                            dt = {
                                id : transaction._id,
                                pid : userData.id,
                                transactionDate : transaction.resultData.txn_response.txn_date+" "+transaction.resultData.txn_response.txn_time,
                                createdDate :  transaction.createDate,
                                type : transaction.status,
                                paymentType : transaction.type,
                                currency : transaction.resultData.txn_response.currency,
                                amount : transaction.amount,
                                ps_name : transaction.resultData.pg_details.pg_name,
                                notes : transaction.resultData.txn_response.res_message,
                                externalid : transaction.order_no,
                                status : transaction.resultData.txn_response.status,
                                // cashdesk : transaction.resultData.txn_response.amount,
                                username : userData.username,
                                requestData :transaction.requestData
                            }
                        }
                        await resultData.push(dt);
                    }
                })
            }
        }
    })
    res.json({ status : true, data : resultData });
    return next();
});

async function getYaarPayBankName(query){
    var result = '';
    await paymentMenuModel.findOne({ "paymentType": { "$regex": query, "$options": "i" } }).then(async rdata =>{
        if(rdata){
            result = rdata.name;
        }
    })
    return result;
}

router.post("/WithdrawHistoryLoad", async (req,res,next) =>{
    var data = req.body;
    var start = new Date(data.start);
    var end = new Date(data.end);
    var resultdata =  [];
    await balance_histoy.find({type : 2, date :{$gte: start, $lte:end,},email : data.email}).then( rdata=>{
        resultdata = rdata;
    });

    var query ={createDate :{$gte: start, $lte:end}};
    if(data.email){
        query ={email:data.email, createDate :{$gte: start, $lte:end}};
    }

    await WithdrawHistory.find(query).then(async rdata =>{
        if(!rdata){
            res.json({ status : false, data: 'failed' });
            return next();
        }else{  
            for(var i = 0 ; i < rdata.length ; i++){
                resultdata.push(rdata[i]);
            }
            res.json({ status : true, data : rdata });
            return next();
        }
    })
});

async function PayoutOrder(req,res,next){
    var data = req.body
    await WithdrawHistory.updateOne({ _id : data._id}, {status: data.status} ).then( rdata => {
        res.json({ status : true, data: data.status });
        return next();
    });
}

async function YaarPayPayout(req,res,next){
    var data = req.body;
    if(data.status=="payout"){
        await GamePlay.findOne({email:data.email}).then(async balanceData=>{
            if(parseFloat(balanceData.balance)>parseFloat(data.amount)){
                await Paymentconfig.findOne({ type : data.type }).then(async rdata =>{
                    if(!rdata){
                        res.json({ status : false, data: 'failed' });
                        return next();
                    }else if(!rdata.state){
                        res.json({ status : false, data: 'YaarPay has been disabled.' });
                        return next();
                    }
                    else{
                        var dateValue = new Date();
                        var monthValue = dateValue.getMonth() + 1;
                        var dayValue = dateValue.getDate();
                        var yearValue = dateValue.getFullYear();
                        var hoursValue = dateValue.getHours();
                        var minutesValue = dateValue.getMinutes();
                        var secondsValue = dateValue.getSeconds();
                        if ( monthValue < 10 )
                            monthValue = '0' + monthValue;
                        if ( dayValue < 10 )
                            dayValue = '0' + dayValue;
                        if ( hoursValue < 10 )
                            hoursValue = '0' + hoursValue;
                        if ( minutesValue < 10 )
                            minutesValue = '0' + minutesValue;
                        if ( secondsValue < 10 )
                            secondsValue = '0' + secondsValue;
            
                        var merchant_id = rdata.configData.merchant_id;
                        var merchant_key = rdata.configData.merchant_key;
                        var request_url = rdata.configData.payout_request_url;
                        var notify_url = rdata.configData.payout_notify_url;
            
                        var reqTime = yearValue+""+monthValue + ""+dayValue + "" + hoursValue +""+ minutesValue + ""+secondsValue+"";
                        var orderNO = "YaarPayOut-" + reqTime;
            
                        var rawSign=
                            'accountName='+data.accountName+
                            '&accountNo='+data.accountNo+
                            "&amount="+(parseInt(data.amount)*100)+
                            "&ifscCode="+data.ifscCode+
                            "&mchId="+merchant_id+
                            "&mchOrderNo="+orderNO+
                            "&notifyUrl="+notify_url+
                            "&payoutBankCode="+data.payoutBankCode+
                            "&reqTime="+reqTime+
                            "&key="+merchant_key;
            
                        var sign = CryptoJS.MD5(rawSign);   
                            sign = sign.toString().toUpperCase()  
                        var successData={
                            mchId:merchant_id,
                            notifyUrl:notify_url,
            
                            mchOrderNo:orderNO,
                            reqTime:reqTime,
                            sign:sign,
            
                            accountName:data.accountName,
                            accountNo:data.accountNo,
                            amount:""+(parseInt(data.amount)*100),
                            payoutBankCode:data.payoutBankCode,
                            ifscCode:data.ifscCode,
                        }
                        var transactiondata = {
                            type : data.type,
                            email : data.email,
                            order_no : orderNO,
                            status : 'payout',
                            amount : data.amount,
                            requestData : data
                        }
                        var options = {
                            'method': 'POST',
                            'url': request_url,
                            "accept-charset":"UTF-8",
                            'headers': {
                                'Accept': 'application/json',
                                'Content-Type': 'application/x-www-form-urlencoded',
                            },
                            form:successData
                        };
                        request.post(options, async function (error, response) {
                            if (error){
                                res.json({ status : false, data: 'failed' });
                                return next();
                            }else{
                                var outdata = JSON.parse(response.body);
                                if(outdata.retCode=="101"){
                                    res.json({ status : false,  data: ERRORCONFIG.yaarpayouterrcode[outdata.errCode]});
                                    return next();
                                }else if(outdata.retCode=="100"){
                                    var savehandle = await BASECON.data_save(transactiondata, TransactionsHistory);
                                    if(!savehandle){
                                        res.json({status : false, data : "failed"});
                                        return next();
                                    }else{
                                        await WithdrawHistory.updateOne({ _id : data._id}, {status: 'processing'} ).then( async rdata => {
                                            await BASECON.email_balanceupdate(data.email, -parseFloat(data.amount));
                                            res.json({ status : true, data:'processing'});
                                            return next();
                                        });
                                    }
                                }
                            }  
                        })
                    }
                })
            }else{
                res.json({status : false, data : "You cannot Payout many than the balance amount."});
                return next();
            }
        })
    }else{
        await PayoutOrder(req,res,next);
    }
}

async function netcentsPayout(req,res,next){
    var data = req.body
    res.json({status : true,data : data});
    return next();
}

async function QpayPayout(req,res,next){
    var data = req.body
    res.json({status : true,data : data});
    return next();
}

router.post("/QpayCheckOut", async (req,res,next) =>{
    var data = req.body.params;
    await Paymentconfig.findOne({ type : data.type }).then(async rdata =>{
        if(!rdata){
            res.json({ status : false, data: 'failed' });
            return next();
        }else if(!rdata.state){
            res.json({ status : false, data: data.type+' has been disabled.' });
            return next();
        }
        else{  
            var merchant_key = rdata.configData.merchant_key;
            var merchant_id = rdata.configData.merchant_id;
            var aggregator_id = rdata.configData.aggregator_id;
            var hData = {
                order_no: (new Date()).getTime()+Math.floor((Math.random() * 100000) + 1),
                country: 'IND',
                countryCurrncy: 'INR',
                tranxnType: 'SALE',
                channel: 'WEB',
                payGateId: '',
                paymode: '',
                scheme: '',
                emiMonth: '',
                cardNo: '',
                expireMonth: '',
                expireYear: '',
                cvv2: '',
                cardName: '',
                customerName: '',
                emailId: '',
                mobileNo: '',
                uniqueId: '',
                ifUserLogged: 'Y',
                billaddress: '',
                billCity: '',
                billState: '',
                billCountry: '',
                billZip: '',
                shipaddress: '',
                shipCity: '',
                shipState: '',
                shipCountry: '',
                shipZip: '',
                shipDays: '',
                addressCount: '',
                itemCount: '',
                itemValue: '',
                itemCategory: '',
                udf1: '',
                udf2: '',
                udf3: '',
                udf4: '',
                udf5: '',
            };
            var return_elements = {};

            return_elements.me_id = merchant_id;

            var txn_details = aggregator_id + '|' + merchant_id.toString() + '|' +  hData.order_no.toString() + '|' + data.amount.toString() + '|'+ hData.country + '|' + hData.countryCurrncy + '|' + hData.tranxnType + '|' + rdata.configData.success_url + '|'+ rdata.configData.failure_url + '|' + hData.channel;


            return_elements.txn_details = Qpayencode(txn_details.toString().trim(), merchant_key.toString());


            return_elements.txn_details = Qpayencode(txn_details.toString().trim(), merchant_key.toString(), rdata.configData.generate_key);
            
            var pg_details = hData.payGateId + '|' + hData.paymode + '|' + hData.scheme + '|' + hData.emiMonth;
            return_elements.pg_details = Qpayencode(pg_details, merchant_key, rdata.configData.generate_key);
            
            var card_details =  hData.cardNo +'|' + hData.expireMonth + '|' + hData.expireYear + '|' + hData.cvv2 +'|' + hData.cardName;
            return_elements.card_details = Qpayencode(card_details, merchant_key, rdata.configData.generate_key);
            
            var cust_details = hData.customerName + '|' + hData.emailId + '|' + hData.mobileNo +'|' + hData.uniqueId + '|'+ hData.ifUserLogged;
            return_elements.cust_details = Qpayencode(cust_details, merchant_key, rdata.configData.generate_key);
            
            var bill_details = hData.billaddress + '|' + hData.billCity + '|' + hData.billState + '|' + hData.billCountry + '|' + hData.billZip;
            return_elements.bill_details = Qpayencode(bill_details, merchant_key, rdata.configData.generate_key);
            
            var ship_details = hData.shipaddress + '|' + hData.shipCity + '|' + hData.shipState + '|' + hData.shipCountry + '|' + hData.shipZip + '|' + hData.shipDays + '|' + hData.addressCount;
            return_elements.ship_details = Qpayencode(ship_details, merchant_key, rdata.configData.generate_key);

            var item_details = hData.itemCount + '|' + hData.itemValue + '|' + hData.itemCategory;
            return_elements.item_details = Qpayencode(item_details, merchant_key, rdata.configData.generate_key);
            
            var other_details = hData.udf1 + '|' + hData.udf2 + '|' + hData.udf3 + '|' + hData.udf4 +'|' + hData.udf5;
            return_elements.other_details = Qpayencode(other_details, merchant_key, rdata.configData.generate_key);

            var transactiondata = {
                type: data.type,
                email : data.email,
                order_no : hData.order_no,
                status : 'deposit',
                requestData : data,
                amount : data.amount
            }
            var savehandle = await BASECON.data_save(transactiondata, TransactionsHistory);
            if(!savehandle){
                res.json({status : false,data : "failed"});
                return next();
            }else{
                res.json({ status : true, data : return_elements, request_url: rdata.configData.request_url});
                return next();
            }
        }
    })
});

router.post('/QpayResponse', async (req, res, next) => {
    await Paymentconfig.findOne({ type : 'Qpay' }).then(async rdata =>{
        if(!rdata){
            res.json({ status : false, data: 'failed' });
            return next();
        }else{
            let return_elements = {};
            let merchant_key = rdata.configData.merchant_key;
            let txn_response1 = req.body.txn_response ? req.body.txn_response : '';
            txn_response1 = Qpaydecrypt(txn_response1, merchant_key, rdata.configData.generate_key);
            let txn_response_arr = txn_response1.split('|');	
            let txn_response = {};
            txn_response.ag_id = txn_response_arr[0]?txn_response_arr[0]:'';
            txn_response.me_id = txn_response_arr[1]?txn_response_arr[1]:'';
            txn_response.order_no = txn_response_arr[2]?txn_response_arr[2]:'';
            txn_response.amount = txn_response_arr[3]?txn_response_arr[3]:'';
            txn_response.country = txn_response_arr[4]?txn_response_arr[4]:'';
            txn_response.currency = txn_response_arr[5]?txn_response_arr[5]:'';
            txn_response.txn_date = txn_response_arr[6]?txn_response_arr[6]:'';
            txn_response.txn_time = txn_response_arr[7]?txn_response_arr[7]:'';
            txn_response.ag_ref = txn_response_arr[8]?txn_response_arr[8]:'';
            txn_response.pg_ref = txn_response_arr[9]?txn_response_arr[9]:'';
            txn_response.status = txn_response_arr[10]?txn_response_arr[10]:'';
            txn_response.res_code = txn_response_arr[11]?txn_response_arr[11]:'';
            txn_response.res_message = txn_response_arr[12]?txn_response_arr[12]:'';
        
            return_elements.txn_response = txn_response;
            
            let pg_details1 = req.body.pg_details ? req.body.pg_details: '';
            pg_details1 = Qpaydecrypt(pg_details1, merchant_key, rdata.configData.generate_key);
            let pg_details_arr = pg_details1.split('|');
            let pg_details = {};
            pg_details.pg_id = pg_details_arr[0]?pg_details_arr[0]:'';
            pg_details.pg_name = pg_details_arr[1]?pg_details_arr[1]:'';
            pg_details.paymode = pg_details_arr[2]?pg_details_arr[2]:'';
            pg_details.emi_months = pg_details_arr[3]?pg_details_arr[3]:'';
        
            return_elements.pg_details = pg_details;
            
            let fraud_details1 = req.body.fraud_details ? req.body.fraud_details : '';
            fraud_details1 = Qpaydecrypt(fraud_details1, merchant_key, rdata.configData.generate_key);
            let fraud_details_arr = fraud_details1.split('|');
            let fraud_details = {};
            fraud_details.fraud_action = fraud_details_arr[0]?fraud_details_arr[0]:'';
            fraud_details.fraud_message = fraud_details_arr[1]?fraud_details_arr[1]:'';
            fraud_details.score = fraud_details_arr[0]?fraud_details_arr[0]:'';
        
            return_elements.fraud_details = fraud_details;
            
            let other_details1 = req.body.other_details ? req.body.other_details : '';
            other_details1 = Qpaydecrypt(other_details1, merchant_key, rdata.configData.generate_key);
            let other_details_arr = other_details1.split('|');
            let other_details = {};
            other_details.udf_1 = other_details_arr[0]?other_details_arr[0]:'';
            other_details.udf_2 = other_details_arr[1]?other_details_arr[1]:'';
            other_details.udf_3 = other_details_arr[2]?other_details_arr[2]:'';
            other_details.udf_4 = other_details_arr[3]?other_details_arr[3]:'';
            other_details.udf_5 = other_details_arr[4]?other_details_arr[4]:'';
        
            return_elements.other_details = other_details;

            var transactiondata = { 
                type : rdata.type,
                order_no : return_elements.txn_response.order_no,
                resultData : {
                    txn_response : return_elements.txn_response,
                    pg_details : return_elements.pg_details,
                    fraud_details : return_elements.fraud_details,
                    other_details : return_elements.other_details,
                }
            }
            var condition = { order_no : return_elements.txn_response.order_no};
            var udata = await BASECON.BfindOneAndUpdate(TransactionsHistory,condition,transactiondata)
                if(!udata){
                    res.json({ status : false, data: 'failed' });
                    return next();
                }else{
                    await BalanceUpdate(udata.email, parseFloat(udata.amount));
                    res.writeHead(301,{ Location : rdata.configData.redirect_url+'/:'+return_elements.txn_response.order_no});
                    res.end();
                    return next();
                }
        }
    })
});

router.post("/QpayResults", async (req,res,next) =>{
    var order_no = req.body.order_no;
    await TransactionsHistory.findOne({ order_no : order_no, type:'Qpay' }).then(rdata =>{
        if(!rdata){
            res.json({ status : false, data: 'failed' });
            return next();
        }else{  
            res.json({ status : true, data : rdata });
            return next();
        }
    })
});

router.post("/netcentsResults",async (req,res,next) =>{
    var order_no = req.body.order_no;
    await TransactionsHistory.findOne({ order_no : order_no, type:'netcents' }).then(rdata =>{
        if(!rdata){
            res.json({ status : false, data: 'failed' });
            return next();
        }else{  
            res.json({ status : true, data : rdata });
            return next();
        }
    })
});

router.post("/netcentCheckOut",async(req,res,next)=>{
    var inputdata = req.body.data;

    await Paymentconfig.findOne({ type : inputdata.type }).then(async rdata =>{
        if(!rdata){
            res.json({ status : false, data: 'failed' });
            return next();
        }else if(!rdata.state){
            res.json({ status : false, data: inputdata.type+' has been disabled.' });
            return next();
        }
        else{
            const hosted_payment_id = rdata.configData.pluginid;
            const netcents_apikey = rdata.configData.apikey;
            const netcents_apisecret = rdata.configData.apisecret;
            var Authorization = BASECON.cv_ebase64(netcents_apikey+":"+netcents_apisecret);
            var external_id = (new Date()).valueOf(); 
            var formdata = {
                external_id : external_id,
                hosted_payment_id : hosted_payment_id,
                amount : inputdata.amount,
                email : inputdata.email,
                first_name : inputdata.first_name,
                last_name : inputdata.last_name
            }
            var options = {
                'method': 'POST',
                'url': rdata.configData.request_url1,
                'headers': {
                    'Accept': 'application/json',
                    'Authorization': 'Basic '+ Authorization,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': 'ahoy_visitor=1860d533-36e8-4765-8608-aeda30884572; ahoy_track=true'
                },
                form:formdata
            };
            request.post(options, async function (error, response) {
                if (error){
                    res.json({status : false})
                    return next();
                }else{
                    var transactiondata = {
                        type: inputdata.type,
                        email : inputdata.email,
                        order_no : external_id,
                        status : 'deposit',
                        requestData : inputdata,
                        amount : inputdata.amount
                    }
                    var savehandle = await BASECON.data_save(transactiondata, TransactionsHistory);
                    if(!savehandle){
                        res.json({status : false,data : "failed"});
                        return next();
                    }else{
                        var outdata = JSON.parse(response.body);
                        res.json({status : true,
                        data : rdata.configData.request_url2+outdata.token});
                        return next();
                    }
                }           
            });
            return;
        }
    })
}); 

router.post("/netcents_cancel",async (req,res,next)=>{
    var params = req.body;
});

router.post("/netcents_webhook",async (req,res,next)=>{
    var params = req.body;
    var jsonstring = BASECON.cv_dbase64(params['data']);
    var outdata = JSON.parse(jsonstring);
    await TransactionsHistory.updateOne({ order_no : outdata.external_id}, {resultData:outdata} ).then( data => {
        if(!data){
            res.status(500);
            return next();
        }else{
            res.status(200);
            return next();
        }
    });
    return next();  
});

function Qpayencode(text, skey, generate_key) {
	var base64Iv = generate_key;
	var key = CryptoJS.enc.Base64.parse(skey);
	var iv = CryptoJS.enc.Utf8.parse(base64Iv);
	var encrypted = CryptoJS.AES.encrypt(text, key, {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7});    
    var decryptedData = encrypted.toString();
	return decryptedData;
}

function Qpaydecrypt(text, skey, generate_key) {
    var base64Iv = generate_key;
    var key = CryptoJS.enc.Base64.parse(skey);
    var iv = CryptoJS.enc.Utf8.parse(base64Iv);
    var decrypted = CryptoJS.AES.decrypt(text, key, {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7});
    var decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
    return decryptedData;
}

router.post("/menuupdate",async (req,res,next)=>{
    var indata = req.body.data;
    for(var i = 0 ; i < indata.length ; i++)
    {
        var updatehandle =  await data_update(indata[i],paymentMenuModel);
        if(!updatehandle){
            res.json({status : false,data : "failed"});
            return next();
        }
    }
    var  findhandle = await get_menuitems(paymentMenuModel);
    if(!findhandle){
        res.json({status : false,data : "failed"})
        return next();
    }else{
        res.json({status : true,data : findhandle})
        return next();
    }
});

router.post("/menusave",async (req,res,next)=>{
   
    var indata = req.body.data;
    var savehandle = await BASECON.data_save(indata,paymentMenuModel);
    if(!savehandle){
        res.json({status : false,data : "failed"});
        return next();
    }else{
        var  findhandle = await get_menuitems(paymentMenuModel);       
        if(!findhandle){
            res.json({status : false,data : "failed"})
            return next();
        }else{
            res.json({status : true,data : findhandle})
            return next();
        }
    }
});

router.post("/menudelete",async(req,res,next)=>{
    var indata = req.body.data;
   
    var outdata = null;
    await paymentMenuModel.findOneAndDelete({_id : indata._id}).then(rdata=>{
        if(!rdata){
            outdata =false;
        }else{
            outdata = true;
        }
    });
    if(!outdata){
        res.json({status : false,data : "failed"})
        return next();
    }else{
        var findhandle = "";
        findhandle = await get_menuitems(paymentMenuModel);
        if(!findhandle){
            res.json({status : false,data : "failed"})
            return next();
        }else{
            res.json({status : true,data : findhandle})
            return next();
        }
    }
});

router.post("/menuload",async (req,res,next)=>{
    var findhandle = "";
    findhandle = await get_menuitems(paymentMenuModel);
    if(!findhandle){
        res.json({status : false,data : "failed"})
        return next();
    }else{
        res.json({status : true,data : findhandle})
        return next();
    }
});

router.post("/menuloads",async (req,res,next)=>{
    var type = req.body.type;
    var email = req.body.email;
    var findhandle = "";
    if(type == 2){
        WithdrawHistory.findOne({ "email": email, $or: [ { "status": "processing" }, { $or: [ { "status": "pending" } ] } ] }).then(async rdata =>{
            if(!rdata){
                var fdata = await BASECON.BfindOne(adminUser,{email : email,emailverify : true});
                if(!fdata){
                    res.json({status : false,data : {bool : 2,data : "emailverify required"}})
                    return next();
                }else{
                var kycverify = await BASECON.BfindOne(adminUser,{email : email,idverify : true});
                    if(kycverify){
                        findhandle = await get_paymentType(type);
                        if(!findhandle){
                            res.json({status : false,data : {bool : 3 , data : "server error"}});
                            return next();
                        }else{
                            res.json({status : true,data : findhandle});
                            return next();
                        }
                    }else{
                        res.json({status : false,data : {bool : 4,data : "KYCverify required"}})
                        return next();
                    }
                }
            }else{
                res.json({status : false,data : {bool : 1,data : "already withdraw"}});
                return next();
            }
        });
    }else{
        findhandle = await get_paymentType(type);
        if(!findhandle){
            res.json({status : false,data : {bool : 3 , data : "server error"}});
            return next();
        }else{
            res.json({status : true,data : findhandle});
            return next();
        }
    }
});

async function get_paymentType(type){
    var outdata = [];
    await paymentMenuModel.find({status:true}).sort({order : 1}).then(async rdata=>{
        if(!rdata){
            outdata = false;
        }else{
            if(type==1){
                for(var i in rdata){
                    if(JSON.stringify(rdata[i].paymentMethodType).indexOf('deposit')!=-1){
                        outdata.push(rdata[i]);
                    }
                }
            }else if(type==2){
                for(var i in rdata){
                    if(JSON.stringify(rdata[i].paymentMethodType).indexOf('payout')!=-1){
                        outdata.push(rdata[i]);
                    }
                }
            }
        }
    });
    return outdata;
}

async function get_menuitems(model){
    var outdata = null;
    await model.find().sort({order : 1}).then(rdata=>{
        if(!rdata){
            outdata = false;
        }else{
            outdata = rdata;
        }
    });
    return outdata;
}

async function data_update(data,model)
{
    var outdata = null;
    await model.findOneAndUpdate({_id : data._id},data).then(rdata=>{
        if(!rdata){
            outdata =false;
        }else{
            outdata = true;
        }
    });
    return outdata;
}

async function BalanceUpdate(email, amount){
    var outdata = null;
    var lastdeposit =  await BASECON.Bfind(TransactionsHistory,{'resultData.status':'2', email:email});
    var bonusamount = 0;
    if(lastdeposit.length == 1){
        if(CONFIG.BONUS.max <= amount){
            bonusamount = CONFIG.BONUS.max;
        }else if( amount >= CONFIG.BONUS.min && amount <= CONFIG.BONUS.max){
            bonusamount = amount * CONFIG.BONUS.percent;
        }
    }
    var  data = {
        bonusamount : bonusamount,
        email : email
    }
    var shandle = await BASECON.data_save(data,payment_FTD_model)
    if(shandle){
        await GamePlay.findOneAndUpdate({email :email },{$inc : {balance : amount,bonusbalance  :bonusamount}}).then((rdata)=>{
            outdata = rdata;
        });
        if(!outdata){
            return false;
        }else{
            return outdata.balance + amount;
        }
    }else{
        return false;
    }
}

module.exports = router;