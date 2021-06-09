const express = require('express');
const router = express.Router();
const FirstPageCon = require("../controller/firstpageController")

router.post('/load_data',FirstPageCon.firstpage_load);
router.post('/menuload',FirstPageCon.FirstPage_menuload);
router.post('/LivecasinoproviderChange',FirstPageCon.LivecasinoproviderChange);
router.post('/LivecasinoproviderLoad',FirstPageCon.LivecasinoproviderLoad);

router.post('/Liveslider_load',FirstPageCon.Liveslider_load);


module.exports = router;