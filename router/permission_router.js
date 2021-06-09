const express = require('express');
const router = express.Router();
const PermissionCon = require("../controller/permissioncontroller")

router.post("/role_menuload",PermissionCon.roles_load)
router.post("/role_menuadd",PermissionCon.roles_add)
router.post("/role_menudelete",PermissionCon.roles_delete)
router.post("/role_menuupdate",PermissionCon.roles_update)


module.exports = router;