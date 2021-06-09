const express = require('express');
const router = express.Router();
const CmsControll = require("../controller/CMSController")
const multer = require('multer');
const config = require('../db');

// router.post("/loadFpMngData",CmsControll.get_firstpageimgs);

router.post("/Slider_load",CmsControll.get_sliderimgs);
router.post("/Slider_save",multer({dest:config.BASEURL}).any(),CmsControll.save_sldierimgs);
router.post("/Slider_delete",CmsControll.delete_sldierimgs);
router.post("/Slider_update",CmsControll.update_sldierimgs);

router.post("/logoimg_save",multer({dest:config.BASEURL}).any(),CmsControll.save_logos);
router.post("/firstpage_load",CmsControll.firstpage_load);
router.post("/logoimg_load",CmsControll.logoimg_load);
router.post("/trackcode_save",CmsControll.setting_etc);
router.post("/providerImg",CmsControll.setting_etc);

router.post("/menusave",CmsControll.save_menu);
router.post("/menuupdate",CmsControll.update_menu);
router.post("/menudelete",CmsControll.delete_menu);
router.post("/menuload",CmsControll.load_menu);

router.post("/paymentimg_delete",CmsControll.paymentimg_delete);
router.post("/providerimg_delete",CmsControll.providerimg_delete);
router.post("/upload_provider_paymentimg",multer({dest:config.BASEURL}).any(),CmsControll.upload_provider_paymentimg);

// router.post("/faviconimg_save",multer({dest:config.BASEURL}).any(),CmsControll.save_faviconimg);


module.exports = router;