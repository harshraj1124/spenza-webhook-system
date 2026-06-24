const crypto = require("crypto");
const axios = require("axios");
const Subscription = require("../models/Subscription");
const WebhookEvent = require("../models/WebhookEvent");
const { normalizeSource, getShortErrorMessage } = require("../utils/helpers");

// Retry delays: 1 min after attempt 1, 5 min after attempt 2
const RETRY_DELAYS_MS = [0, 1 * 60 * 1000, 5 * 60 * 1000];

async function deliverWebhookEvent(eventId) {
  const event = await WebhookEvent.findById(eventId).populate("subscription");

  if (!event || !event.subscription) {
    return;
  }

  // Don't deliver if subscription was cancelled
  if (!event.subscription.isActive) {
    console.log("Skipping delivery - subscription is no longer active");
    return;
  }

  try {
    event.attempts += 1;
    event.lastAttempt = new Date();
    await event.save();

    const payloadString = JSON.stringify(event.payload);
    const deliveryHeaders = {
      "Content-Type": "application/json",
      "X-Webhook-Source": event.source,
      "X-Webhook-Timestamp": new Date().toISOString()
    };

    if (event.subscription.signingSecret) {
      const signature = crypto
        .createHmac("sha256", event.subscription.signingSecret)
        .update(payloadString)
        .digest("hex");
      deliveryHeaders["X-Webhook-Signature"] = `sha256=${signature}`;
    }

    await axios.post(event.subscription.callbackUrl, event.payload, {
      timeout: 8000,
      headers: deliveryHeaders
    });

    event.deliveryStatus = "delivered";
    event.deliveredAt = new Date();
    event.errorMessage = "";
    await event.save();

    console.log("Delivery successful to", event.subscription.callbackUrl);
  } catch (error) {
    event.deliveryStatus = "failed";
    event.errorMessage = getShortErrorMessage(error);
    await event.save();

    console.log("Delivery failed, will retry later:", event.errorMessage);
  }
}

async function receiveWebhook(req, res) {
  try {
    const source = normalizeSource(req.params.source);

    if (!source) {
      return res.status(400).json({
        success: false,
        message: "Source is required"
      });
    }

    console.log("Webhook received for source:", source);

    const subscriptions = await Subscription.find({
      source,
      isActive: true
    });

    const createdEvents = [];

    for (const subscription of subscriptions) {
      const event = await WebhookEvent.create({
        user: subscription.user,
        subscription: subscription._id,
        source,
        payload: req.body,
        receivedAt: new Date(),
        deliveryStatus: "pending"
      });

      createdEvents.push(event);
    }

    // Respond quickly. Delivery happens just after response so webhook sender is not blocked.
    res.status(200).json({
      success: true,
      data: {
        source,
        subscriptionsFound: subscriptions.length,
        eventsCreated: createdEvents.length
      }
    });

    setImmediate(() => {
      createdEvents.forEach((event) => {
        deliverWebhookEvent(event._id).catch((error) => {
          console.log("Background delivery error:", error.message);
        });
      });
    });
  } catch (error) {
    console.log("Receive webhook error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while receiving webhook"
    });
  }
}

async function getEvents(req, res) {
  try {
    const events = await WebhookEvent.find({
      user: req.user._id
    })
      .populate("subscription", "source callbackUrl isActive")
      .sort({ receivedAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.log("Get events error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching events"
    });
  }
}

async function retryFailedDeliveries() {
  try {
    const failedEvents = await WebhookEvent.find({
      deliveryStatus: "failed",
      attempts: { $lt: 3 }
    }).limit(20);

    const now = Date.now();

    const eventsToRetry = failedEvents.filter((event) => {
      const delay = RETRY_DELAYS_MS[event.attempts] ?? 0;
      const elapsed = now - new Date(event.lastAttempt).getTime();
      return elapsed >= delay;
    });

    if (eventsToRetry.length > 0) {
      console.log("Retrying failed webhook deliveries:", eventsToRetry.length);
    }

    for (const event of eventsToRetry) {
      await deliverWebhookEvent(event._id);
    }
  } catch (error) {
    console.log("Retry job error:", error.message);
  }
}

function startRetryJob() {
  console.log("Webhook retry job started");

  setInterval(() => {
    retryFailedDeliveries();
  }, 30000);
}

module.exports = {
  receiveWebhook,
  getEvents,
  deliverWebhookEvent,
  retryFailedDeliveries,
  startRetryJob
};
