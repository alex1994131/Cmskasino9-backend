const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sports_list = () =>{
    var  UserSchema = new Schema({
        sport_id : { type : String, required : true },
        sport_name : { type : String, required : true },
        category_len : { type : Number, required : true },
        category : { type : Array, required : true },
        status : { type : Boolean, default : false },
        order : { type : Number, default : 0 },
        icon : { type : String, default : "" },
        viewBox :{ type : String, default : "" },
        color :{ type : String, default : "" },
    });
    return mongoose.model('sports_list', UserSchema)
}
const user_bet = () =>{
    var  UserSchema = new Schema({
        GAMEID : { type : String, required : true},     // event_id
        USERID : { type : String, required : true},     // user
        LAUNCHURL : { type : String, required : true }, 
        AMOUNT : { type : Number , required : true },   // amount
        betting : { type :Object, required : true },
        TYPE : { type : String, default : "BET"},      // betType
        DATE: { type: Date, default: Date.now},         // currentTime

        // sportid : { type : String, required : true },
        // betId : { type : String, required : true },
        // transactionId : { type : String, required : true },

        // MatchName : { type : String, required : true },
        // MarketId : { type : String, required : true },
        // MarketName : { type : String, required : true },
        // MarketSpecifiers : { type : String, default : "" },
        // OutcomeId : { type : String, required : true },
        // OutcomeName : { type : String, required : true },
        // OutcomeOdds : { type : String, required : true },

        // betType : { type : String, required : true },
        // betResult : { type : String, default : "BET"},
        // handleState : {type : Boolean, default : false},
        // isBoosted : {type : Boolean , default : false},
    });
    return mongoose.model('sports_user_bet', UserSchema)
}

const odds_change = () =>{
    var  UserSchema = new Schema({
        event_id:{type:String,default:""},
        event_name:{type:String,default:""},
        sportid:{type:String,default:""},
        ScheduledTime:{type : String , default : ""},
        EventStatus:{type : String , default : ""},
        BookingStatus:{type : String , default : ""},        
        Status:{type : Object , default : {}},
        Venue:{type : Object , default : {}},
        HomeCompetitor:{type : Object , default : {}},
        AwayCompetitor:{type : Object , default : {}},
        Season:{type : Object, default : {}},
        market:{type : Object , default : {}},
        permission : {type : Boolean , default : false},
        betCount:{type : Number , default : 0},
        produceStatus:{type : Boolean , default : true},

        // ScheduledEndTime:{type : String , default : ""},
        // TournamentRound:{type : Object , default : {}},
        // BasicTournament:{type : Object , default : {}},
        // SoccerStatistics:{type : Object , default : {}},
        // Tournament:{type : Object , default : {}},
        // stagesEvent:{type : Object , default : {}},
        // drawEvent:{type : Object , default : {}},
        // lotteryEvent:{type : Object , default : {}},
    });
    return mongoose.model('sports_oddsChange', UserSchema)
}

const sporttemp = () =>{
    var  UserSchema = new Schema({
        key:{type : String , required : true},
        timestamp:{type : String },
        data:{type : Object , default : {}},
        time : {type :Date}
    });
    return mongoose.model('sports_temp', UserSchema)
}

module.exports ={
    sports_list : sports_list(),
    odds_change : odds_change(),
    user_bet : user_bet(),
    sporttemp : sporttemp()
}