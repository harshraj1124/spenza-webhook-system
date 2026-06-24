# Spenza Webhook Frontend

React frontend for the Spenza webhook assignment.

## Tech Stack

- Vite + React 18
- React Router v6
- Axios
- react-hot-toast
- lucide-react
- Tailwind CSS via CDN

## Setup

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

The app will run at:

```
http://localhost:5173
```

## Environment

The frontend reads the backend URL from `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Keep the backend running on port `5000`, or update this value.

## Features

### Authentication
- Register and login pages with JWT-based auth.
- On session expiry, a toast message explains why the user is redirected to login.

### Subscriptions
- Create a subscription by entering a source name (e.g. `stripe`) and a public callback URL.
- After creation, a signing secret is displayed with a one-click copy button. Save it — it is used to verify that deliveries came from this server.
- View all active subscriptions in a table.
- Cancel any subscription with a confirmation prompt.

### Event Log
- Shows recent webhook events with delivery status badges (pending / delivered / failed).
- Filter events by status using the All / Pending / Delivered / Failed buttons.
- Each event is expandable to show the full JSON payload.
- Auto-refreshes every 7 seconds.

## Testing Callback URLs

Use a real public callback URL while testing delivery. A simple option is
[webhook.site](https://webhook.site), which gives you a temporary URL where you
can see the forwarded webhook payloads and the signature headers.

## Design Choices

- **Axios interceptor for auth** — a single request interceptor attaches the JWT token to every outgoing request. A response interceptor catches 401s globally, shows a "Session expired" toast, clears localStorage, and redirects to login — so individual components never need to handle auth errors.
- **Polling over WebSockets** — the event log refreshes every 7 seconds using `setInterval`. This avoids the complexity of a WebSocket connection while still keeping the log reasonably up to date for a demo system.
- **Signing secret shown once at creation** — after subscribing, the signing secret is displayed with a one-click copy button. It can also be revealed later from the subscription list. This mirrors how real webhook providers (like Stripe) handle secrets.
- **Client-side event filtering** — the All / Pending / Delivered / Failed filter buttons filter the already-fetched event list in memory rather than making a new API call per filter. This keeps the UI instant to interact with.
- **Protected routes** — `ProtectedRoute` checks for a token in localStorage before rendering the dashboard. If missing, it redirects to `/login`. This prevents unauthenticated users from seeing the dashboard even if they navigate directly to the URL.
- **Controlled forms** — all form inputs use React controlled state (`useState`) rather than uncontrolled refs, making validation and reset straightforward.

## Full Flow Testing

1. Start MongoDB.
2. Start the backend from `webhook-backend`:

```bash
npm run dev
```

3. Start this frontend from `webhook-frontend`:

```bash
npm run dev
```

4. Register a new user at `http://localhost:5173/register`.
5. Create a subscription with source `stripe` and a webhook.site callback URL.
6. Copy and save the signing secret shown after creation.
7. Simulate webhook events from the backend directory:

```bash
npm run simulate
```

8. Open the dashboard and check Recent Webhook Events.
   - Use the filter buttons to view only failed or delivered events.
   - The log auto-refreshes every 7 seconds.
9. Open webhook.site and verify the payload arrived with `X-Webhook-Signature` and `X-Webhook-Timestamp` headers.
