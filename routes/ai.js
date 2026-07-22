const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const aiController = require("../controllers/ai.js");

router.post("/api/ai-chat", wrapAsync(aiController.chat));

module.exports = router;
