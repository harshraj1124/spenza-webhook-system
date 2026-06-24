import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Copy, Check, ShieldCheck } from "lucide-react";
import api from "../api.js";

function SubscriptionForm({ onCreated }) {
  const [form, setForm] = useState({ source: "", callbackUrl: "" });
  const [loading, setLoading] = useState(false);
  const [newSecret, setNewSecret] = useState(null);
  const [copied, setCopied] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/subscriptions", form);
      const subscription = response.data.data;

      setNewSecret({
        source: subscription.source,
        secret: subscription.signingSecret
      });

      setForm({ source: "", callbackUrl: "" });
      onCreated();
      toast.success("Subscription created");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to subscribe");
    } finally {
      setLoading(false);
    }
  }

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(newSecret.secret);
      setCopied(true);
      toast.success("Secret copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Please copy manually.");
    }
  }

  function dismissSecret() {
    setNewSecret(null);
    setCopied(false);
  }

  if (newSecret) {
    return (
      <section className="rounded-lg bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-green-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            Subscription Created
          </h2>
        </div>

        <p className="mt-3 text-sm text-slate-600">
          Here is the signing secret for{" "}
          <span className="font-semibold text-slate-900">{newSecret.source}</span>.
          Use it to verify that webhook deliveries come from this server.
        </p>

        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="mb-1 text-xs font-medium text-slate-500 uppercase tracking-wide">
            Signing Secret
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all text-xs text-slate-800 select-all">
              {newSecret.secret}
            </code>
            <button
              type="button"
              onClick={copySecret}
              className="shrink-0 rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100"
              title="Copy secret"
            >
              {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2">
          Save this secret now — it cannot be recovered if lost.
        </p>

        <button
          type="button"
          onClick={dismissSecret}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          <Plus size={16} />
          Subscribe Another
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-lg bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        Subscribe to Webhook
      </h2>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Source
          </label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-700"
            type="text"
            name="source"
            value={form.source}
            onChange={handleChange}
            placeholder="stripe"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Callback URL
          </label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-700"
            type="url"
            name="callbackUrl"
            value={form.callbackUrl}
            onChange={handleChange}
            placeholder="https://webhook.site/your-url"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Use <a href="https://webhook.site" target="_blank" rel="noreferrer" className="underline">webhook.site</a> to get a free test URL.
          </p>
        </div>

        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          type="submit"
          disabled={loading}
        >
          <Plus size={16} />
          {loading ? "Subscribing..." : "Subscribe"}
        </button>
      </form>
    </section>
  );
}

export default SubscriptionForm;
