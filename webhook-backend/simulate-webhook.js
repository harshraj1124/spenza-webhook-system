const axios = require("axios");

const WEBHOOK_URL = "http://localhost:5000/api/webhooks/stripe";

// TODO: change this source or payload when testing other webhook types later.
const sampleEvents = [
  {
    id: "evt_1001",
    type: "payment_succeeded",
    amount: 499,
    currency: "INR",
    customerEmail: "demo@example.com"
  },
  {
    id: "evt_1002",
    type: "subscription_created",
    plan: "starter",
    customerEmail: "demo@example.com"
  },
  {
    id: "evt_1003",
    type: "payment_failed",
    amount: 999,
    currency: "INR",
    reason: "card_declined"
  }
];

async function sendEvents() {
  try {
    for (const event of sampleEvents) {
      const response = await axios.post(WEBHOOK_URL, event);
      console.log("Webhook sent:", event.type, response.data);
    }
  } catch (error) {
    if (error.response) {
      console.log("Webhook simulation failed:", error.response.data);
    } else {
      console.log("Webhook simulation failed:", error.message);
    }
  }
}

sendEvents();
