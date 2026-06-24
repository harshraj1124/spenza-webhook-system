import { useState } from "react";
import { RefreshCw } from "lucide-react";

function formatDate(dateValue) {
  return new Date(dateValue).toLocaleString();
}

function getStatusClass(status) {
  if (status === "delivered") return "bg-green-100 text-green-700";
  if (status === "failed") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
}

const FILTERS = ["all", "pending", "delivered", "failed"];

function EventLog({ events, loading, onRefresh }) {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? events : events.filter((e) => e.deliveryStatus === filter);

  return (
    <section className="rounded-lg bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Webhook Events
          </h2>
          <p className="text-xs text-slate-500">
            Auto-refreshes every 7 seconds.
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          type="button"
          onClick={onRefresh}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="mt-4 flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize border transition-colors ${
              filter === f
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {f}
            {f !== "all" && (
              <span className="ml-1 opacity-70">
                ({events.filter((e) => e.deliveryStatus === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 && !loading ? (
        <p className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
          {filter === "all"
            ? "No webhook events received yet."
            : `No ${filter} events.`}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {loading && <p className="text-sm text-slate-500">Loading events...</p>}

          {filtered.map((event) => (
            <article
              key={event._id}
              className="rounded-md border border-slate-200 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-slate-900">{event.source}</p>
                  <p className="text-xs text-slate-500">
                    Received: {formatDate(event.receivedAt)}
                  </p>
                  {event.subscription?.callbackUrl && (
                    <p className="mt-1 max-w-2xl break-all text-xs text-slate-500">
                      Callback: {event.subscription.callbackUrl}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(event.deliveryStatus)}`}
                  >
                    {event.deliveryStatus}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    Attempts: {event.attempts}
                  </span>
                </div>
              </div>

              {event.errorMessage && (
                <p className="mt-3 rounded-md bg-red-50 p-2 text-xs text-red-700">
                  {event.errorMessage}
                </p>
              )}

              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-slate-700">
                  View payload
                </summary>
                <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              </details>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default EventLog;
