import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "./hooks/useLogin";
import { useSendOTP } from "./hooks/useSendOTP";
import { useMFAVerify } from "./hooks/useMFAVerify";

type Step = "credentials" | "email" | "otp";

export function LoginPage() {
  const navigate = useNavigate();
  const { mutate: doLogin, isPending: loginPending, error: loginError } = useLogin();
  const { mutate: doSendOTP, isPending: sendPending, error: sendError } = useSendOTP();
  const { mutate: doVerify, isPending: verifyPending, error: verifyError } = useMFAVerify();

  const [step, setStep] = useState<Step>("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");

  function handleLogin(e: FormEvent) {
    e.preventDefault();
    doLogin(
      { username, password },
      { onSuccess: (res) => { setMfaToken(res.mfa_token); setStep("email"); } }
    );
  }

  function handleSendOTP(e: FormEvent) {
    e.preventDefault();
    doSendOTP(
      { mfa_token: mfaToken, email },
      { onSuccess: () => setStep("otp") }
    );
  }

  function handleVerify(e: FormEvent) {
    e.preventDefault();
    doVerify(
      { mfa_token: mfaToken, otp_code: otpCode },
      { onSuccess: (user) => navigate(user.role === "admin" ? "/admin" : "/profile") }
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>SecureApp</h1>

        {step === "credentials" && (
          <form onSubmit={handleLogin} style={styles.form}>
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
              Password
              <input
                style={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            {loginError && <p style={styles.error}>{loginError.message}</p>}
            <button style={styles.button} type="submit" disabled={loginPending}>
              {loginPending ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}

        {step === "email" && (
          <form onSubmit={handleSendOTP} style={styles.form}>
            <p style={styles.hint}>Enter your registered email to receive a verification code.</p>
            <label style={styles.label}>
              Email
              <input
                style={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                required
              />
            </label>
            {sendError && <p style={styles.error}>{sendError.message}</p>}
            <button style={styles.button} type="submit" disabled={sendPending}>
              {sendPending ? "Sending…" : "Send Code"}
            </button>
            <button style={styles.linkBtn} type="button" onClick={() => setStep("credentials")}>
              Back to login
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerify} style={styles.form}>
            <p style={styles.hint}>A 6-digit code was sent to <strong>{email}</strong>.</p>
            <label style={styles.label}>
              Verification Code
              <input
                style={styles.input}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                required
              />
            </label>
            {verifyError && <p style={styles.error}>{verifyError.message}</p>}
            <button style={styles.button} type="submit" disabled={verifyPending}>
              {verifyPending ? "Verifying…" : "Verify"}
            </button>
            <button style={styles.linkBtn} type="button" onClick={() => setStep("email")}>
              Resend code
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" },
  card: { background: "#fff", padding: "2rem", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", width: "320px" },
  title: { margin: "0 0 1.5rem", fontSize: "1.5rem", textAlign: "center" },
  hint: { fontSize: "0.875rem", color: "#6b7280", margin: "0 0 0.75rem" },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  label: { display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.875rem", fontWeight: 500 },
  input: { padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px", fontSize: "1rem" },
  button: { padding: "0.625rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", fontSize: "1rem", cursor: "pointer" },
  linkBtn: { background: "none", border: "none", color: "#2563eb", fontSize: "0.875rem", cursor: "pointer", textAlign: "center" },
  error: { color: "#dc2626", fontSize: "0.875rem", margin: 0 },
};
