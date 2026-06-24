import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useRegister } from "./hooks/useRegister";

export function RegisterPage() {
  const navigate = useNavigate();
  const { mutate: doRegister, isPending, error } = useRegister();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [clientError, setClientError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setClientError("");
    if (password !== confirm) {
      setClientError("Passwords do not match");
      return;
    }
    doRegister(
      { username, email, password },
      { onSuccess: () => navigate("/login") }
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create Account</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Username
            <input
              style={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label style={styles.label}>
            Email
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label style={styles.label}>
            Password
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          <label style={styles.label}>
            Confirm Password
            <input
              style={styles.input}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          {(clientError || error) && (
            <p style={styles.error}>{clientError || error?.message}</p>
          )}
          <button style={styles.button} type="submit" disabled={isPending}>
            {isPending ? "Creating account…" : "Register"}
          </button>
        </form>
        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" },
  card: { background: "#fff", padding: "2rem", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", width: "320px" },
  title: { margin: "0 0 1.5rem", fontSize: "1.5rem", textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  label: { display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.875rem", fontWeight: 500 },
  input: { padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px", fontSize: "1rem" },
  button: { padding: "0.625rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", fontSize: "1rem", cursor: "pointer" },
  error: { color: "#dc2626", fontSize: "0.875rem", margin: 0 },
  footer: { textAlign: "center", fontSize: "0.875rem", marginTop: "1rem", color: "#6b7280" },
  link: { color: "#2563eb", textDecoration: "none" },
};
