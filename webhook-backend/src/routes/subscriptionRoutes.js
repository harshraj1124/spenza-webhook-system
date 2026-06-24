const express = require("express");
const {
  createSubscription,
  getSubscriptions,
  cancelSubscription
} = require("../controllers/subscriptionController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createSubscription);
router.get("/", getSubscriptions);
router.delete("/:id", cancelSubscription);

module.exports = router;
