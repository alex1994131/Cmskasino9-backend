const express = require('express');
const router = express.Router();
const ProviderCon =require("../controller/providerscontroller")
const multer = require('multer');
const config = require('../db');

router.post("/LivecasinoproviderLoad",ProviderCon.LivecasinoproviderLoad);
router.post("/LivecasinoproviderChange",ProviderCon.LivecasinoproviderChange);
router.post("/LivecasinoProviderCheck",ProviderCon.LivecasinoProviderCheck);
router.post("/Livecasinostatuspagecheck",ProviderCon.Livecasinostatuspagecheck);
router.post("/LivecasinoFirstPageCheck",ProviderCon.LivecasinoFirstPageCheck);
router.post("/Livecasinoitemsadd",ProviderCon.Livecasinoitemsadd);
router.post("/Livecasinoitemsimg_upload",multer({dest:config.BASEURL}).any(),ProviderCon.Livecasinoitemsimg_upload);

router.post("/get_firstpage_gamelist",ProviderCon.get_firstpage_gamelist);
router.post("/update_firstpage_gamelist",ProviderCon.update_firstpage_gamelist);
router.post("/delete_firstpage_gamelist",ProviderCon.delete_firstpage_gamelist);


router.post("/gameinforchange",ProviderCon.gameinforchange);
router.post("/allrefreshGames",ProviderCon.allrefreshGames);
router.post("/newtokeninit",ProviderCon.newtokeninit);
router.post("/createnewtoken",ProviderCon.createnewtoken);


module.exports = router;   