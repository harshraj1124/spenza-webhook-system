import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api.js";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/auth/register", form);
      const { token, user } = response.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      toast.success("Account created");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Register</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create an account to manage webhook subscriptions.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-700"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              minLength="2"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-700"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-700"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              minLength="6"
              required
            />
          </div>

          <button
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          Already registered?{" "}
          <Link className="font-medium text-slate-900 underline" to="/login">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}

export default Register;
