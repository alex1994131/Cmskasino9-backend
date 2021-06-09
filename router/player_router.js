const express = require('express');
const router = express.Router();
const Players = require("../controller/playerscontroller")

router.post("/playerlist", Players.players_load);
router.post("/realtimeusers",Players.realtimeusers_load);
router.post("/gamesrealtimeusers",Players.gamesrealtimeusers_load);
router.post("/gamesrealtimeusersdelete",Players.gamesrealtimeusers_delete);
router.post("/get_balances", Players.balances_load);
router.post("/deposittion", Players.deposit_action);
router.post("/withdrawaction", Players.withdrawl_action);
router.post("/balance_history",Players.balance_history_load);
router.post("/kickPlayerFromGames",Players.kickPlayerFromGames_action);
router.post("/getaccount", Players.getaccount);
router.post("/guestgameaccount", Players.get_guestgameaccount);
router.post("/gameaccount", Players.get_realgameaccount);
router.post("/KYCmenuload", Players.get_kycmenuLoad);
router.post("/KYCupdate", Players.update_kycmenu);
router.post("/playerlimit_load",Players.get_playerlimit);
router.post("/playerlimit_update",Players.update_playerlimit);


module.exports = router;