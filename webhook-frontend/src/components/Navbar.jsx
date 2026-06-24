import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div>
          <p className="text-lg font-semibold text-slate-900">Spenza Webhooks</p>
          <p className="text-xs text-slate-500">
            {user.name ? `${user.name} · ${user.email}` : user.email}
          </p>
        </div>

        <button
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          type="button"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;
