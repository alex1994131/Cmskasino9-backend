const express = require('express');
const router = express.Router();
const ExchgControll = require("../controller/ExchgController")

router.post("/load_exchgdata",ExchgControll.load_exchgdata);
router.post("/exchg_update",ExchgControll.exchg_update);

router.post("/getExchgHeaderData",ExchgControll.getExchgHeaderData);
router.post("/getExchgData",ExchgControll.getExchgData);

router.post("/ListTopLevelEvents",ExchgControll.ListTopLevelEvents);
router.post("/GetEventSubTreeNoSelections",ExchgControll.GetEventSubTreeNoSelections);

module.exports = router;