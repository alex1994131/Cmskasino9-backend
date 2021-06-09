const express = require('express');
const router = express.Router();
const GameProviderCon = require("../controller/gameproviders")

router.post("/get_allgamelist",GameProviderCon.get_allgamelist)
router.post("/providerload",GameProviderCon.providerload)
router.post("/providersave",GameProviderCon.providersave)
router.post("/providerupdate",GameProviderCon.providerupdate)
router.post("/providerdelete",GameProviderCon.providerdelete)

module.exports = router;