import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useLogout } from "../auth/hooks/useLogout";
import { useOrders } from "./hooks/useOrders";
import type { Order } from "../../api/orders";

const STATUS_COLORS: Record<string, string> = {
  pending: "#d97706",
  confirmed: "#2563eb",
  shipped: "#7c3aed",
  delivered: "#16a34a",
  cancelled: "#dc2626",
};

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader} onClick={() => setExpanded((v) => !v)}>
        <div>
          <span style={styles.orderId}>#{order.order_id.slice(0, 8).toUpperCase()}</span>
          <span style={styles.date}>{new Date(order.created_at).toLocaleDateString()}</span>
        </div>
        <div style={styles.cardHeaderRight}>
          <span
            style={{
              ...styles.statusBadge,
              background: STATUS_COLORS[order.status] ?? "#6b7280",
            }}
          >
            {order.status}
          </span>
          <span style={styles.total}>RM {order.total_price}</span>
          <span style={styles.toggle}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div style={styles.itemsTable}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Unit Price</th>
                <th style={styles.th}>Qty</th>
                <th style={styles.th}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i}>
                  <td style={styles.td}>{item.product_name}</td>
                  <td style={styles.td}>RM {item.unit_price}</td>
                  <td style={styles.td}>{item.quantity}</td>
                  <td style={styles.td}>RM {item.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { mutate: doLogout } = useLogout();
  const { data: orders, isLoading, error } = useOrders();

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>My Orders</h2>
          <div style={styles.headerRight}>
            <span style={styles.userBadge}>
              Logged in as <strong>{user?.username}</strong>
            </span>
            <Link to="/products" style={styles.navLink}>Products</Link>
            <Link to="/profile" style={styles.navLink}>Profile</Link>
            <button
              style={styles.logoutBtn}
              onClick={() => doLogout(undefined, { onSuccess: () => navigate("/login") })}
            >
              Logout
            </button>
          </div>
        </div>

        {isLoading && <p>Loading orders…</p>}
        {error && <p style={styles.errorText}>{error.message}</p>}
        {orders && orders.length === 0 && (
          <div style={styles.empty}>
            <p>No orders yet.</p>
            <Link to="/products" style={styles.shopLink}>Browse Products →</Link>
          </div>
        )}
        {orders?.map((o) => <OrderCard key={o.order_id} order={o} />)}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f5f5f5", padding: "2rem" },
  container: { maxWidth: "800px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" },
  title: { margin: 0, fontSize: "1.5rem" },
  headerRight: { display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" },
  userBadge: { fontSize: "0.875rem" },
  navLink: { fontSize: "0.875rem", color: "#2563eb", textDecoration: "none" },
  logoutBtn: { padding: "0.375rem 0.75rem", background: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.875rem" },
  card: { background: "#fff", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: "1rem", overflow: "hidden" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", cursor: "pointer", userSelect: "none" },
  cardHeaderRight: { display: "flex", alignItems: "center", gap: "1rem" },
  orderId: { fontWeight: 600, fontSize: "0.9rem", marginRight: "0.75rem" },
  date: { fontSize: "0.8rem", color: "#6b7280" },
  statusBadge: { display: "inline-block", padding: "2px 10px", borderRadius: "9999px", color: "#fff", fontSize: "0.75rem", fontWeight: 500 },
  total: { fontWeight: 600, fontSize: "0.9rem" },
  toggle: { fontSize: "0.75rem", color: "#9ca3af" },
  itemsTable: { borderTop: "1px solid #f3f4f6", padding: "0 1.25rem 1rem" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: "0.75rem" },
  th: { textAlign: "left", padding: "0.5rem 0.5rem", borderBottom: "2px solid #e5e7eb", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "#6b7280" },
  td: { padding: "0.5rem 0.5rem", fontSize: "0.875rem", borderBottom: "1px solid #f3f4f6" },
  empty: { textAlign: "center", padding: "3rem", color: "#6b7280" },
  shopLink: { color: "#2563eb", textDecoration: "none", fontWeight: 500 },
  errorText: { color: "#dc2626", fontSize: "0.875rem" },
};
