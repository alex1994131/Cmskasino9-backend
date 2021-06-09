const express = require('express');
const router = express.Router();
const UserCon = require("../controller/userscontroller")

router.post("/get_iplocation",UserCon.get_location)
router.post("/login",UserCon.player_login)
router.post("/adminlogin",UserCon.admin_login)
router.post("/register",UserCon.player_register)

router.post("/adminregister",UserCon.admin_register)
router.post("/adminusers_again",UserCon.adminuser_again)
router.post("/getlist",UserCon.get_users_load)
router.post("/adminplayerregister",UserCon.Player_register)

router.post("/get_themeinfor",UserCon.get_adminthemestyle)
router.post("/save_themeinfor",UserCon.save_adminthmestyle)
router.post("/get_userinfor",UserCon.get_user_detail)
router.post("/changepassword",UserCon.user_changepassword)
router.post("/adminchangepassword",UserCon.admin_changepassword)
router.post("/emailverify_receive",UserCon.emailverify_receive_action)
router.post("/forgotpassword_receive",UserCon.forgotpassword_receive_action)
router.post("/forgotpassword_send",UserCon.forgotpassword_send_action)
router.post("/forgotpassword_set",UserCon.forgotpassword_set_action)
router.post("/resend_email",UserCon.resend_email_action)
router.post("/role_menuload",UserCon.roles_load)
router.post("/role_menusave",UserCon.roles_menusave)
router.post("/role_menuupdate",UserCon.roles_menuupdate)
router.post("/role_menudelete",UserCon.roles_menudelete)
router.post("/role_manager_load",UserCon.role_manager_load)
router.post("/role_manager_update",UserCon.role_manager_update)
router.post("/adminsidebar_load",UserCon.adminsidebar_load)
router.post("/againusersave",UserCon.userdetail_save)
router.post("/role_menuload_permission",UserCon.get_rolesfrom_per)


module.exports = router;