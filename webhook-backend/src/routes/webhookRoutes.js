const express = require("express");
const { receiveWebhook, getEvents } = require("../controllers/webhookController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/webhooks/:source", receiveWebhook);
router.get("/events", authMiddleware, getEvents);

module.exports = router;
