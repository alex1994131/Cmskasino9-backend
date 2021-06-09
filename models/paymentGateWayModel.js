const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const CONFIG = require("../config/index.json").PAYMENTGATEWAYMNG.table;


const Paymentconfig = ()=>{
    var  UserSchema = new Schema({
        type           : { type : String,  default : '' },
        configData     : { type : Object,  default : {} },
        state          : { type : Boolean, default : false },
        createDate     : { type : Date,    default: Date.now },
    });
    return mongoose.model(CONFIG.Paymentconfig, UserSchema)
}

const Payment_history = ()=>{
    var  UserSchema = new Schema({
        type           : { type : String,  default : '' },
        order_no       : { type : String,  default : '' },
        amount         : { type : String,  default : '' },
        email          : { type : String,  default : '' },
        status         : { type : String,  default : '' },
        requestData    : { type : Object,  default : {} },
        resultData     : { type : Object,  default : {} },
        createDate     : { type : Date,    default: Date.now },
    });
    return mongoose.model(CONFIG.TransactionsHistory, UserSchema)
}

const Payment_withdrawlrequest = ()=>{
    var  UserSchema = new Schema({
        payoutData    : {type : Object, default:{}},
        amount        : {type : String, default:''},
        email         : {type : String, default:''},
        first_name    : {type : String, default:''},
        last_name     : {type : String, default:''},
        type          : {type : String, default:''},
        currency      : {type : String, default:''},
        bankType      : {type : String, default:''},
        status        : { type : String,  default : 'pending' },
        createDate    : { type : Date,    default: Date.now },
    });
    return mongoose.model(CONFIG.Withdraw_request, UserSchema)
}
const Payment_ourinfor = () =>{
    var  UserSchema = new Schema({
        name             : {type : String,  default:''},
        type             : {type : String,  default:''},
        paymentType      : {type : String,  default:''},
        paymentMethodType: {type : Object,  default:{}},
        currency         : {type : String,  default:''},
        date             : {type : String,  default:''},
        info             : {type : String,  default:''},
        image            : {type : String,  default:''},
        min              : {type : Number,  default:0},
        max              : {type : Number,  default:0},
        fee              : {type : Number,  default:0},
        order            : {type : Number,  default:0},
        depositBankCode  : {type : Object,  default:[{ value:'', label:'Select...'}]},
        status           : {type : Boolean, default : false},
        createDate       : {type : Date,    default: Date.now },
    });
    return mongoose.model(CONFIG.Payment_ourinfor, UserSchema)
}

const Payment_withdrawl_infor = () =>{
    var  UserSchema = new Schema({
        email            : {type : String,  default:''},
        type             : {type : String,  default:''},
        paymentData      : {type : Object,  default:''},
        createDate       : {type : Date,    default: Date.now },
    });
    return mongoose.model(CONFIG.Payment_withdrawl_infor, UserSchema)
}
const payment_FTD_model = () =>{
    var  UserSchema = new Schema({
        email            : {type : String,  required : true},
        bonusamount            : {type : String,  required : true},
        date       : {type : Date,    default: Date.now },
    });
    return mongoose.model(CONFIG.payment_FTD_model, UserSchema)
}

module.exports  = {
    paymentMethod : Payment_withdrawl_infor(),
    Paymentconfig : Paymentconfig(),
    WithdrawHistory : Payment_withdrawlrequest(),
    paymentMenuModel : Payment_ourinfor(),
    TransactionsHistory : Payment_history(),
    payment_FTD_model : payment_FTD_model()
}