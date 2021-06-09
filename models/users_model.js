const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const CONFIG = require("../config/index.json").USERMNG

const users = () =>{
    var  UserSchema = new Schema({
        id : { type : Number, required : true ,unique:true},  
        emailverify : { type : Boolean, default : false },
        date: { type: Date, default: Date.now },
        password :{ type : String, default : "" },
        email : { type : String, required : true ,unique:true},
        username : { type : String, required : true ,unique:true},
        firstname : { type : String,  required : true },
        lastname : { type : String,  required : true },
        permission :{ type : String, required : true },
        status : { type : String, required : true },

        currency : { type : String, default : "" },
        country_name : { type : String, default : "" },
        region_name : { type : String, default : "" },
        birth_region_code : { type : String, default : ""},
        birth_region_id : {type : String, default : "" },
        birth_department : {type : String, default : "" },
        birth_city : {type : String, default : "" },

        time_zone : { type : String, default : "" },
        city_name : { type : String, default : "" },
        country_code : { type : String, default : "" },
        zip_code  : {type : String, default : "" },
        area_code : { type : String, default : "" },
        ip : { type : String, default : "" },
        contact : { type : String, default : "" },
        address : { type : String, default : "" },
        mobilenumber :{ type : String,default :""},
        avatar : { type : String, default: ""},
        accountholder : { type : String, default : "" },
        cashdesk : { type : String, default : ""},
        language : { type : String, default : "" },
        middlename : { type : String, default : "" },
        phone : { type : String, default : "" },
        created : {type : String, default : "" },
        personal_id : {type : String, default : "" },
        affiliate_id : {type : String, default : "" },
        btag : {type : String, default : "" },
        external_id : {type : String, default : "" },
        balance : {type : String, default : "" },
        document_issue_code : {type : String, default : "" },
        document_issuedby : {type : String, default : "" },
        document_number : {type : String, default : "" },
        iban : {type : String, default : "" },
        is_logged_in : {type : String, default : "" },
        profile_id : {type : String, default : "" },
        promo_code : {type : String, default : "" },
        province : {type : String, default : "" },
        registration_source : {type : String, default : "" },
        client_category : {type : String, default : "" },
        swiftcode : {type : String, default : "" },
        bank_name : {type : String, default : "" },
        state : {type : String, default : "" },
        last_login_ip : {type : String, default : "" },
        sport_last_bet : {type : String, default : "" },
        gaming_last_bet : {type : String, default : "" },
        custome_player_category : {type : String, default : "" },
        wrong_login_attempts : {type : String, default : "" },
        pep_status : {type : String, default : "" },
        gender : { type : String, default : ""},
        
        last_login_date : {type : String, default : "" },
        first_deposit_date : {type : String, default : "" },
        document_issue_date : {type : Date, default : "" },
        wrong_login_block_time : {type : Date, default : "" },
        birthday : { type : Date, default : "" },
        date: { type: Date, default: Date.now },
        
        test : { type : Boolean, default : false },
        is_verified : {type : Boolean, default : false },
        subscribedtosms : {type : Boolean,default : false},
        subscribedtoemail : {type : Boolean,default : false},
        subscribed_to_newsletter : {type : Boolean, default : false },
        subscribed_to_phone_call : {type : Boolean, default : false },
        subscripted_internal_message : {type : Boolean, default : false },
        subscribed_to_push_notifications : {type : Boolean, default : false },
        usingloyaltyprogram : { type : Boolean, default : false },

        idverify : {type : Boolean,default : false},
        resident : { type : Boolean, default : false },
        isdelete : { type : Boolean, default : false },
    });
    return mongoose.model(CONFIG.table.users, UserSchema)
}

const admin_them = () =>{
    var  UserSchema = new Schema({
        layout: {
            type: String,
            default : "vertical"
        },
        theme: {
            type: String,
            default : "dark"
        },
        sidebarCollapsed: {
            type: Boolean,
            default : false
        },
        navbarColor: {
            type: String,
            default : "success"
        },
        navbarType : {
            type: String,
            default : "floating"
        },
        footerType : {
            type: String,
            default : "static"
        },
        disableCustomizer: {
            type: Boolean,
            default : false
        },
        hideScrollToTop: {
            type: Boolean,
            default : false
        },
        disableThemeTour: {
            type: Boolean,
            default : false
        },
        menuTheme : {
            type: String,
            default : "success"
        },
        direction : {
            type: String,
            default : "ltr"
        },
        email :{
            type: String,
            default : "ltr"
        }
    });
    return mongoose.model(CONFIG.table.admintheme, UserSchema)
}

const sessionmodel = () =>{
    var  UserSchema = new Schema({
        email: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: true,unique:true
        },
        firstname: {
            type: String,
            required: true
        },
        lastname: {
            type: String,
            required: true
        },
        currency: {
            type: String,
            default: "INR"
        },
        date: {
            type: Date,
            default: Date.now
        },
        token : {
            type :String,
            required : true
        },
      
        intimestamp : {
            type: String,
            required: true
        },
        role : {
            type : String,
            required : true
        }
    });
    return mongoose.model(CONFIG.table.session, UserSchema)
}

const Players = ()=>{
    var  UserSchema = new Schema({
        username: {
            type: String,
            required : true,unique:true
        },
        id: {
            type: String,
            required : true,
            unique:true,unique:true
        },
        email: {
            type: String,
            required : true,unique:true
        },
        balance : {
            type : Number,
            default : 0
        },
        currency : {
            type: String,
            default : "INR"
        },
        firstname : {
            type: String,
            required : true
        },
        lastname : {
            type: String,
            required : true
        },
        pid : {
            type : Number,
            required : true,unique:true
        },
        bonusbalance : {
            type : Number,
            default : 0
        },
    });
    return mongoose.model(CONFIG.table.players, UserSchema)
    // return mongoose.model('netplayerusers', UserSchema)
}

const gamesessionmodel = () =>{
    var  UserSchema = new Schema({
        email: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: true
        },
        firstname: {
            type: String,
            required: true
        },
        lastname: {
            type: String,
            required: true
        },
        currency: {
            type: String,
            default: "INR"
        },
        date: {
            type: Date,
            default: Date.now
        },
        token : {
            type :String,
            required : true
        },
        intimestamp : {
            type: String,
            required: true
        },
        id :{
            type: String,
            required: true
        },
        socketid :{
            type : String,
            default : ""
        },
    });
    return mongoose.model(CONFIG.table.gamesession, UserSchema)
}

const playerlimitModel = () =>{
    var  UserSchema = new Schema({
        email: {
            type: String,
            required: true,unique:true
        },
        daylimit : {
            type:Number,
            default :5000 
        },
        weeklimit : {
            type:Number,
            default :15000 
        },
        monthlimit : {
            type:Number,
            default :100000 
        }
    });
    return mongoose.model(CONFIG.table.limit, UserSchema)
}

const balance_histoy = () =>{
    var  UserSchema = new Schema({
        email: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        transactionDate : {
            type: Date,
            default: Date.now
        },
        amount : {
            type : Number,
            required : true
        },
        type : {
            type : Number,
            required : true
        },
        amounttype : {
            type : Number,
            required : true
        },
        cemail : {
            type : String,
            required : true
        },
        order_no : {
            type : String,
            required : true
        },
        currency :{
            type : String,
            default : "INR"
        },
        status : {
            type : String,
            default : "success"            
        },
        paymentType : {
            type : String,
            default : "admin"  
        }
        
    });
    return mongoose.model(CONFIG.table.balancehis, UserSchema)
}

const permission_model = () =>{
    var  UserSchema = new Schema({
        title:{
            type : String,
            required : true
        },
        order : {
            type : Number,
            default : 0
        },
        id :{
            type : String,
            required : true,
            unique : true
        },
        pid : { 
            type : String,
            default : 0
        },

    });
    return mongoose.model(CONFIG.table.role, UserSchema)
}

const totalusermodel = () =>{
    var UserSchema = new Schema({
        email : {
            type : String,
            required : true  
        },
        date: {
            type: Date,
            default: Date.now
        },
    });
    return mongoose.model(CONFIG.table.totallogin, UserSchema);
}

const sidebarmodel = () =>{
    var  UserSchema = new Schema({
        roles : {
            type : Object,
            required : true,
        },
        navLink : {
            type : String,
            required : true
        },
        id : {
            type : String,
            required : true,
            unique  :true,
        },
        icon : {
            type : String,
            required : true
        },
        title : {
            type : String,
            required : true
        },
        status : {
            type : Boolean,
            required : true
        },
        pid : {
            type : String,
            required : true
        },
        type : {
            type : String,
            required : true
        },
        children : {
            type : Object,
            default : []
        },
        order : {
            type : Number,
            required : true
        }
    });
    return mongoose.model(CONFIG.table.adminsidebar, UserSchema);
}

const testsidebarmodel = () =>{
    var  UserSchema = new Schema({
        roles : {
            type : Object,
            required : true  
        },
        sidebar : {
            type : Object,
            required : true  
        },
        id : {
            type : Object,
            required : true  
        },
        date: {
            type: Date,
            default: Date.now
        },
        order : {
            type:Number,
            required : true
        },
        status  :{
            type : Boolean,
            default : false
        }
    });
    return mongoose.model(CONFIG.table.adminsidebartest, UserSchema);
}

module.exports  = {
    totalusermodel : totalusermodel(),
    adminUser : users(),
    get_themeinfor: admin_them(),
    sessionmodel  :sessionmodel(),
    GamePlay : Players(),
    gamesessionmodel : gamesessionmodel(),
    playerlimit : playerlimitModel(),
    balance_histoy : balance_histoy(),
    permission_model : permission_model(),
    sidebarmodel : sidebarmodel(),
    testsidebarmodel : testsidebarmodel(),
}