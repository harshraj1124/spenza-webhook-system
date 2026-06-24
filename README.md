# Spenza Webhook System

A full-stack webhook subscription and delivery system built with Node.js (Express) and React.

Users can subscribe to webhook sources, receive incoming events, and have them automatically forwarded to their callback URLs with signed payloads and automatic retry on failure.

---

## Project Structure

```
spenza-webhook-system/
├── webhook-backend/    # Node.js + Express REST API
└── webhook-frontend/   # React + Vite SPA
```

---

## How to Run Locally

### Prerequisites

- Node.js v18+
- MongoDB running locally (or a free MongoDB Atlas URI)

### 1. Clone the repo

```bash
git clone https://github.com/harshraj1124/spenza-webhook-system.git
cd spenza-webhook-system
```

### 2. Start the backend

```bash
cd webhook-backend
npm install
cp .env.example .env     # Windows: Copy-Item .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/spenza_webhooks
JWT_SECRET=any_long_random_string_here
FRONTEND_URL=http://localhost:5173
```

```bash
npm run dev
```

Backend runs at `http://localhost:5000`

### 3. Start the frontend

Open a new terminal:

```bash
cd webhook-frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### 4. Test with the simulation script

After registering and creating a `stripe` subscription in the dashboard:

```bash
cd webhook-backend
npm run simulate
```

This sends 3 sample Stripe-like events to the backend.

---

## Full Flow

1. Register an account at `http://localhost:5173/register`
2. Create a subscription — enter source (e.g. `stripe`) and a callback URL from [webhook.site](https://webhook.site)
3. Save the **signing secret** shown after creation
4. Run `npm run simulate` from the backend folder
5. Watch events appear in the dashboard event log
6. Check webhook.site to see the forwarded payload with `X-Webhook-Signature` header

---

## Architecture Overview

The system has three main parts:

**Backend** handles all business logic — authentication, subscription management, webhook intake, and delivery. When a webhook arrives at `POST /api/webhooks/:source`, the server immediately returns 200 to the sender, then forwards the event to all matching subscriber callback URLs asynchronously. This keeps the intake endpoint fast regardless of delivery outcome.

**Frontend** is a single-page React app that communicates with the backend via a JWT-authenticated Axios client. The dashboard polls for new events every 7 seconds to show a near-real-time event log without needing WebSockets.

**Retry job** runs every 30 seconds inside the backend process. It picks up failed deliveries and retries them with exponential backoff — 1 minute after the first failure, 5 minutes after the second. Deliveries are abandoned after 3 attempts.

---

## Design Choices

- **Async delivery with `setImmediate`** — the webhook sender always gets a fast 200 response. Actual forwarding to callback URLs happens in the background after the response is sent.
- **HMAC-SHA256 signing** — each subscription gets a unique randomly generated secret. Every delivery is signed with that secret, so receivers can verify the payload wasn't tampered with.
- **SSRF protection** — callback URLs are validated at subscription creation time. Localhost and private IP ranges (`10.x`, `192.168.x`, `172.16-31.x`) are blocked to prevent the server from making requests to internal services.
- **Rate limiting** — the public webhook intake endpoint is capped at 30 requests/minute per IP using `express-rate-limit`.
- **Soft delete for subscriptions** — cancelled subscriptions are marked `isActive: false` instead of being deleted. This preserves the event history linked to that subscription.
- **Source normalization** — sources are lowercased and trimmed, so `Stripe`, `stripe`, and ` STRIPE ` all route to the same subscriptions.
- **JWT auth middleware** — protected routes validate the Bearer token and fetch the user from the database on every request, ensuring deleted users lose access immediately.

---

## Repositories

- Backend: [webhook-backend/](./webhook-backend)
- Frontend: [webhook-frontend/](./webhook-frontend)

Each folder has its own README with detailed API docs, curl examples, and folder structure.
