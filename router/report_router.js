const express = require('express');
const router = express.Router();
const Report_control =require("../controller/reportcontroller")

router.post("/reports_email_load",Report_control.reports_email_load)
router.post("/reports_gameId_load",Report_control.reports_gameId_load)
router.post("/reports_PLAYERID_load",Report_control.reports_PLAYERID_load)
router.post("/report_provider_id",Report_control.report_provider_id)
router.post("/report_game_player_id",Report_control.report_game_player_id)

module.exports = router;