import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";

function formatDate(dateValue) {
  return new Date(dateValue).toLocaleString();
}

function SecretCell({ secret }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      toast.success("Secret copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Please copy manually.");
    }
  }

  if (!secret) return <span className="text-xs text-slate-400">—</span>;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
      >
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {open ? "Hide" : "Show secret"}
      </button>

      {open && (
        <div className="mt-1 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
          <code className="flex-1 break-all text-xs text-slate-700 select-all">
            {secret}
          </code>
          <button
            type="button"
            onClick={copySecret}
            className="shrink-0 rounded p-1 text-slate-500 hover:bg-slate-200"
            title="Copy"
          >
            {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
          </button>
        </div>
      )}
    </div>
  );
}

function SubscriptionList({ subscriptions, loading, onCancel }) {
  return (
    <section className="rounded-lg bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">
          My Subscriptions
        </h2>
        {loading && <span className="text-xs text-slate-500">Loading...</span>}
      </div>

      {subscriptions.length === 0 && !loading ? (
        <p className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
          No active subscriptions yet.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-2 pr-4 font-medium">Source</th>
                <th className="py-2 pr-4 font-medium">Callback URL</th>
                <th className="py-2 pr-4 font-medium">Signing Secret</th>
                <th className="py-2 pr-4 font-medium">Created</th>
                <th className="py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription._id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium text-slate-900">
                    {subscription.source}
                  </td>
                  <td className="max-w-xs break-all py-3 pr-4 text-slate-600">
                    {subscription.callbackUrl}
                  </td>
                  <td className="py-3 pr-4 min-w-[180px]">
                    <SecretCell secret={subscription.signingSecret} />
                  </td>
                  <td className="whitespace-nowrap py-3 pr-4 text-slate-600">
                    {formatDate(subscription.createdAt)}
                  </td>
                  <td className="py-3">
                    <button
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                      type="button"
                      onClick={() => onCancel(subscription._id)}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default SubscriptionList;
