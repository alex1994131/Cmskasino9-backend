const express = require('express');
const router = express.Router();
const DashboardControl = require("../controller/dashboardController")

router.post("/revenue_load",DashboardControl.revenue_load);

module.exports = router;