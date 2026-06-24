const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  source: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  callbackUrl: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  signingSecret: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
