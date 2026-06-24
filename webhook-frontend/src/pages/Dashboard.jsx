import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api.js";
import EventLog from "../components/EventLog.jsx";
import Navbar from "../components/Navbar.jsx";
import SubscriptionForm from "../components/SubscriptionForm.jsx";
import SubscriptionList from "../components/SubscriptionList.jsx";

function Dashboard() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [events, setEvents] = useState([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);

  async function fetchSubscriptions() {
    setSubscriptionsLoading(true);

    try {
      const response = await api.get("/subscriptions");
      setSubscriptions(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load subscriptions");
    } finally {
      setSubscriptionsLoading(false);
    }
  }

  async function fetchEvents(showLoading = true) {
    if (showLoading) {
      setEventsLoading(true);
    }

    try {
      const response = await api.get("/events");
      setEvents(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load events");
    } finally {
      setEventsLoading(false);
    }
  }

  useEffect(() => {
    fetchSubscriptions();
    fetchEvents();

    // Simple polling keeps the log fresh without adding Socket.io.
    const intervalId = setInterval(() => {
      fetchEvents(false);
    }, 7000);

    return () => clearInterval(intervalId);
  }, []);

  async function handleSubscriptionCreated() {
    await fetchSubscriptions();
    await fetchEvents(false);
  }

  async function handleCancel(subscriptionId) {
    const confirmCancel = window.confirm("Cancel this subscription?");

    if (!confirmCancel) {
      return;
    }

    try {
      await api.delete(`/subscriptions/${subscriptionId}`);
      toast.success("Subscription cancelled");
      await fetchSubscriptions();
      await fetchEvents(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel subscription");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            Webhook Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Subscribe to sources, forward events, and watch delivery status update.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <SubscriptionForm onCreated={handleSubscriptionCreated} />
          <SubscriptionList
            subscriptions={subscriptions}
            loading={subscriptionsLoading}
            onCancel={handleCancel}
          />
        </div>

        <div className="mt-6">
          <EventLog
            events={events}
            loading={eventsLoading}
            onRefresh={() => fetchEvents()}
          />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
