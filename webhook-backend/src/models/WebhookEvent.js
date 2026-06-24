const mongoose = require("mongoose");

const webhookEventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription"
  },
  source: {
    type: String
  },
  payload: {
    type: mongoose.Schema.Types.Mixed
  },
  receivedAt: {
    type: Date,
    default: Date.now
  },
  deliveryStatus: {
    type: String,
    enum: ["pending", "delivered", "failed"],
    default: "pending"
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastAttempt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  errorMessage: {
    type: String
  }
});

module.exports = mongoose.model("WebhookEvent", webhookEventSchema);
