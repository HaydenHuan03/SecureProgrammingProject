import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useUser } from "./hooks/useUser";
import { useLogout } from "../auth/hooks/useLogout";

export function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, error } = useUser(user!.user_id);
  const { mutate: doLogout, isPending } = useLogout();

  function handleLogout() {
    doLogout(undefined, { onSuccess: () => navigate("/login") });
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>My Profile</h2>
          <button style={styles.logoutBtn} onClick={handleLogout} disabled={isPending}>
            {isPending ? "Logging out…" : "Logout"}
          </button>
        </div>
        {isLoading && <p>Loading…</p>}
        {error && <p style={styles.error}>{error.message}</p>}
        {data && (
          <dl style={styles.dl}>
            <dt style={styles.dt}>User ID</dt>
            <dd style={styles.dd}>{data.user_id}</dd>
            <dt style={styles.dt}>Username</dt>
            <dd style={styles.dd}>{data.username}</dd>
            <dt style={styles.dt}>Email</dt>
            <dd style={styles.dd}>{data.email}</dd>
            <dt style={styles.dt}>Role</dt>
            <dd style={styles.dd}>{data.role}</dd>
          </dl>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" },
  card: { background: "#fff", padding: "2rem", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", width: "400px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  title: { margin: 0, fontSize: "1.25rem" },
  logoutBtn: { padding: "0.375rem 0.75rem", background: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.875rem" },
  dl: { display: "grid", gridTemplateColumns: "120px 1fr", rowGap: "0.75rem", columnGap: "1rem", margin: 0 },
  dt: { fontWeight: 600, fontSize: "0.875rem", color: "#6b7280" },
  dd: { margin: 0, fontSize: "0.875rem", wordBreak: "break-all" },
  error: { color: "#dc2626", fontSize: "0.875rem" },
};
