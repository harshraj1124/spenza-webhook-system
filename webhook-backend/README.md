# Spenza Webhook Backend

Node.js + Express backend for webhook subscriptions, delivery, and retry handling.

## What This Project Does

- Users can register and log in with JWT authentication.
- Logged-in users can create webhook subscriptions for a source like `stripe` or `github`.
- Each subscription gets a unique HMAC-SHA256 signing secret generated automatically.
- A public webhook endpoint receives events at `POST /api/webhooks/:source`.
- The backend stores every event and forwards it to matching subscribers' callback URL.
- Deliveries include an `X-Webhook-Signature` header so receivers can verify authenticity.
- Failed deliveries are retried with exponential backoff: 1 min after attempt 1, 5 min after attempt 2.
- Users can view and filter their recent webhook events.

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT using `jsonwebtoken`
- Password hashing using `bcryptjs`
- Axios for webhook delivery
- express-rate-limit for public endpoint protection
- dotenv and cors

## Folder Structure

```
src/
├── controllers/
│   ├── authController.js
│   ├── subscriptionController.js
│   └── webhookController.js
├── models/
│   ├── User.js
│   ├── Subscription.js
│   └── WebhookEvent.js
├── routes/
│   ├── authRoutes.js
│   ├── subscriptionRoutes.js
│   └── webhookRoutes.js
├── middleware/
│   └── authMiddleware.js
├── utils/
│   └── helpers.js
└── server.js
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Update `.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/spenza_webhooks
JWT_SECRET=change_this_to_any_long_random_secret
FRONTEND_URL=http://localhost:5173
```

4. Start in development mode:

```bash
npm run dev
```

Or for production:

```bash
npm start
```

## API Endpoints

### Health Check

```bash
curl http://localhost:5000/api/health
```

### Register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Rahul\",\"email\":\"rahul@example.com\",\"password\":\"password123\"}"
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"rahul@example.com\",\"password\":\"password123\"}"
```

Copy the `token` from the response. Use it as `Bearer YOUR_TOKEN` in protected routes.

### Create Subscription

The response includes a `signingSecret`. Save it — use it to verify deliveries came from this server.

```bash
curl -X POST http://localhost:5000/api/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"source\":\"stripe\",\"callbackUrl\":\"https://webhook.site/your-test-url\"}"
```

### List Active Subscriptions

```bash
curl http://localhost:5000/api/subscriptions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Cancel Subscription

```bash
curl -X DELETE http://localhost:5000/api/subscriptions/SUBSCRIPTION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Receive Webhook (public — rate limited to 30 req/min)

```bash
curl -X POST http://localhost:5000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"payment_succeeded\",\"amount\":499,\"currency\":\"INR\"}"
```

### View Recent Events

```bash
curl http://localhost:5000/api/events \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Webhook Signing & Verification

Every delivery includes:

- `X-Webhook-Signature`: `sha256=<hmac_hex>` — HMAC-SHA256 of the JSON payload using the subscription's signing secret
- `X-Webhook-Timestamp`: ISO timestamp of the delivery attempt

To verify on your receiver side:

```js
const crypto = require("crypto");

function isValidSignature(payload, receivedSignature, secret) {
  const expected = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(receivedSignature));
}
```

## Simulation Script

After creating a `stripe` subscription, run:

```bash
npm run simulate
```

This sends 3 sample Stripe-like events to `http://localhost:5000/api/webhooks/stripe`.

## Full Flow Test

1. Start MongoDB.
2. Run `npm run dev`.
3. Register a user.
4. Log in and copy the JWT token.
5. Create a subscription for `stripe` with a callback URL from [webhook.site](https://webhook.site).
6. Save the `signingSecret` from the response.
7. Run `npm run simulate`.
8. Check webhook.site — the payload should arrive with `X-Webhook-Signature` and `X-Webhook-Timestamp` headers.
9. Call `GET /api/events` to see all stored events with delivery status.

## Design Choices

- **Source normalization**: `Stripe`, `stripe`, and ` STRIPE ` all match the same subscriptions.
- **Async delivery**: `setImmediate` ensures the webhook sender gets a quick 200 before any forwarding begins.
- **Exponential backoff**: Failed deliveries wait 1 minute before attempt 2, and 5 minutes before attempt 3.
- **HMAC signing**: Each subscription has a unique `signingSecret`. Deliveries are signed with HMAC-SHA256 so receivers can verify authenticity.
- **SSRF protection**: Callback URLs pointing to localhost or private IP ranges are rejected at subscription creation time.
- **Rate limiting**: The public `/api/webhooks/:source` endpoint is limited to 30 requests/minute per IP.
- **Event isolation**: Each event is tied to a user through the subscription, so users only see their own events.
