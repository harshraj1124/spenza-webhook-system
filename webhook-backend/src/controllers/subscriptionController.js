const crypto = require("crypto");
const Subscription = require("../models/Subscription");
const { isValidUrl, normalizeSource } = require("../utils/helpers");

async function createSubscription(req, res) {
  try {
    const { source, callbackUrl } = req.body;
    const normalizedSource = normalizeSource(source);

    if (!normalizedSource) {
      return res.status(400).json({
        success: false,
        message: "Source is required"
      });
    }

    if (!callbackUrl || !isValidUrl(callbackUrl)) {
      return res.status(400).json({
        success: false,
        message: "A valid callback URL is required (must be a public http/https URL)"
      });
    }

    const existingSubscription = await Subscription.findOne({
      user: req.user._id,
      source: normalizedSource,
      isActive: true
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: "You already have an active subscription for this source"
      });
    }

    const signingSecret = crypto.randomBytes(32).toString("hex");

    const subscription = await Subscription.create({
      user: req.user._id,
      source: normalizedSource,
      callbackUrl,
      signingSecret
    });

    console.log("New subscription created:", normalizedSource, "for", req.user.email);

    return res.status(201).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.log("Create subscription error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating subscription"
    });
  }
}

async function getSubscriptions(req, res) {
  try {
    const subscriptions = await Subscription.find({
      user: req.user._id,
      isActive: true
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.log("Get subscriptions error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching subscriptions"
    });
  }
}

async function cancelSubscription(req, res) {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Active subscription not found"
      });
    }

    subscription.isActive = false;
    await subscription.save();

    console.log("Subscription cancelled:", subscription.source, "by", req.user.email);

    return res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.log("Cancel subscription error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while cancelling subscription"
    });
  }
}

module.exports = {
  createSubscription,
  getSubscriptions,
  cancelSubscription
};
