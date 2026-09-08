import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useSession } from "../lib/session";

export function DashboardPage() {
  const { state, refresh } = useSession();
  const navigate = useNavigate();

  if (state.status !== "signed-in") return null;

  async function handleSignOut() {
    await api.signOut();
    await refresh();
    navigate("/signin");
  }

  return (
    <main className="auth-page">
      <p>Signed in as {state.status === "signed-in" ? state.email : ""}</p>
      <button type="button" onClick={handleSignOut}>
        Sign out
      </button>
    </main>
  );
}
