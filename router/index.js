const express = require('express');
const router = express.Router();
const TOKEN = require("./token");

const DashboardRouter = require("./dashboard_router");
const PlayerRouter = require("./player_router");
const UsersRouter = require("./users_router");
const PermissionRouter = require("./permission_router");
const FirstpageRouter = require("./firstpage_router");
const SettingRouter = require("./SettingRouter");
const CmsRouter = require("./cms_router");
const provider_Router = require("./provider_router")
const Reports_Router = require("./report_router");
const gameProvider_Router = require("./gameprovider_router");
const exchg_Router = require("./exchg_Router")
// const GameProviders = require("../controller/gameproviders.js");
const paymentGateWay = require("../controller/paymentGateWaycontroller.js");
const Tools = require("../controller/ToolsController");
const profile = require("../controller/profilecontroller");

const SportsControl  = require("../controller/sportsControl");


const promotionsControl  = require("../controller/promotionsController");

router.use("/dashboard",TOKEN.check_token,DashboardRouter);
router.use("/players",TOKEN.check_token,PlayerRouter);
router.use("/users",UsersRouter);
router.use("/permission",PermissionRouter);
router.use("/firstpage",TOKEN.check_token, FirstpageRouter);
router.use("/settings",TOKEN.check_token, SettingRouter)
router.use("/cms",TOKEN.check_token,CmsRouter);
router.use("/reports",TOKEN.check_token,Reports_Router);
router.use("/providermanager",TOKEN.check_token,provider_Router);
router.use("/gameprovider",TOKEN.check_token,gameProvider_Router);
router.use("/exchg",TOKEN.check_token,exchg_Router);

// router.use("/gameprovider",TOKEN.check_token,GameProviders); 
router.use("/promotions",TOKEN.check_token,promotionsControl);

//player 
router.use("/profile",TOKEN.check_token,profile);
router.use("/sports",TOKEN.check_token,SportsControl);
router.use("/Tools",TOKEN.check_token,Tools);
router.use("/paymentGateWay",TOKEN.check_token,paymentGateWay);
// app.get('/file/download/:filename/:originalname' , function(req,res,next){ 
//   var filename = req.params.filename;
//   var originalname = req.params.originalname;
//   var directory = dl_dir.BASEURL + "/uploads/" + filename;
//   res.download(directory,originalname,'');
// })  

module.exports = router;