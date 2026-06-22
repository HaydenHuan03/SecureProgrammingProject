import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useLogout } from "../auth/hooks/useLogout";
import { useUsers } from "./hooks/useUsers";
import { useCreateUser } from "./hooks/useCreateUser";
import { useUpdateUser } from "./hooks/useUpdateUser";
import { useDeleteUser } from "./hooks/useDeleteUser";
import { useProducts } from "../products/hooks/useProducts";
import { useCreateProduct } from "../products/hooks/useCreateProduct";
import { useUpdateProduct } from "../products/hooks/useUpdateProduct";
import { useDeleteProduct } from "../products/hooks/useDeleteProduct";
import { useOrders } from "../orders/hooks/useOrders";
import { useUpdateOrderStatus } from "../orders/hooks/useUpdateOrderStatus";
import type { Role, User } from "../../api/users";
import type { Product } from "../../api/products";
import { ORDER_STATUSES } from "../../api/orders";

type Tab = "users" | "products" | "orders";
const STATUS_COLORS: Record<string, string> = {
  pending: "#d97706", confirmed: "#2563eb", shipped: "#7c3aed",
  delivered: "#16a34a", cancelled: "#dc2626",
};

// ─── Users section ────────────────────────────────────────────────────────────
function UsersSection() {
  const { data: users, isLoading, error } = useUsers();
  const { mutate: doCreate, isPending: creating, error: createError } = useCreateUser();
  const { mutate: doUpdate, isPending: updating, error: updateError } = useUpdateUser();
  const { mutate: doDelete } = useDeleteUser();

  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("user");

  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<Role>("user");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    doCreate(
      { username: newUsername, email: newEmail, password: newPassword, role: newRole },
      { onSuccess: () => { setNewUsername(""); setNewEmail(""); setNewPassword(""); setNewRole("user"); } }
    );
  }

  function openEdit(u: User) {
    setEditTarget(u); setEditUsername(u.username);
    setEditEmail(u.email); setEditPassword(""); setEditRole(u.role);
  }

  function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    const data: { username?: string; email?: string; password?: string; role?: Role } = {};
    if (editUsername !== editTarget.username) data.username = editUsername;
    if (editEmail !== editTarget.email) data.email = editEmail;
    if (editPassword) data.password = editPassword;
    if (editRole !== editTarget.role) data.role = editRole;
    doUpdate({ userId: editTarget.user_id, data }, { onSuccess: () => setEditTarget(null) });
  }

  return (
    <>
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Create User</h3>
        <form onSubmit={handleCreate} style={styles.inlineForm}>
          <input style={styles.input} placeholder="Username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required />
          <input style={styles.input} type="email" placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
          <input style={styles.input} type="password" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          <select style={styles.input} value={newRole} onChange={(e) => setNewRole(e.target.value as Role)}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <button style={styles.primaryBtn} type="submit" disabled={creating}>{creating ? "Creating…" : "Create"}</button>
        </form>
        {createError && <p style={styles.error}>{createError.message}</p>}
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>All Users</h3>
        {isLoading && <p>Loading…</p>}
        {error && <p style={styles.error}>{error.message}</p>}
        {users && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Username</th><th style={styles.th}>Email</th>
                <th style={styles.th}>Role</th><th style={styles.th}>User ID</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id} style={styles.tr}>
                  <td style={styles.td}>{u.username}</td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, background: u.role === "admin" ? "#7c3aed" : "#059669" }}>{u.role}</span>
                  </td>
                  <td style={{ ...styles.td, fontSize: "0.75rem", color: "#6b7280" }}>{u.user_id}</td>
                  <td style={styles.td}>
                    <button style={styles.editBtn} onClick={() => openEdit(u)}>Edit</button>
                    <button style={styles.deleteBtn} onClick={() => setDeleteConfirm(u.user_id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {editTarget && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.sectionTitle}>Edit User</h3>
            <form onSubmit={handleUpdate} style={styles.stackForm}>
              <label style={styles.label}>Username<input style={styles.input} value={editUsername} onChange={(e) => setEditUsername(e.target.value)} required /></label>
              <label style={styles.label}>Email<input style={styles.input} type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required /></label>
              <label style={styles.label}>New Password <span style={{ color: "#6b7280", fontWeight: 400 }}>(leave blank to keep)</span><input style={styles.input} type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} /></label>
              <label style={styles.label}>Role<select style={styles.input} value={editRole} onChange={(e) => setEditRole(e.target.value as Role)}><option value="user">user</option><option value="admin">admin</option></select></label>
              {updateError && <p style={styles.error}>{updateError.message}</p>}
              <div style={styles.modalActions}>
                <button style={styles.secondaryBtn} type="button" onClick={() => setEditTarget(null)}>Cancel</button>
                <button style={styles.primaryBtn} type="submit" disabled={updating}>{updating ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteConfirm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <p>Delete this user? This cannot be undone.</p>
            <div style={styles.modalActions}>
              <button style={styles.secondaryBtn} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button style={styles.deleteBtn} onClick={() => { doDelete(deleteConfirm, { onSuccess: () => setDeleteConfirm(null) }); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Products section ─────────────────────────────────────────────────────────
function ProductsSection() {
  const { data: products, isLoading, error } = useProducts();
  const { mutate: doCreate, isPending: creating, error: createError } = useCreateProduct();
  const { mutate: doUpdate, isPending: updating, error: updateError } = useUpdateProduct();
  const { mutate: doDelete } = useDeleteProduct();

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("0");

  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("0");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    doCreate(
      { name: newName, description: newDesc, price: newPrice, stock: parseInt(newStock) },
      { onSuccess: () => { setNewName(""); setNewDesc(""); setNewPrice(""); setNewStock("0"); } }
    );
  }

  function openEdit(p: Product) {
    setEditTarget(p); setEditName(p.name); setEditDesc(p.description);
    setEditPrice(p.price); setEditStock(String(p.stock));
  }

  function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    const data: Parameters<typeof doUpdate>[0]["data"] = {};
    if (editName !== editTarget.name) data.name = editName;
    if (editDesc !== editTarget.description) data.description = editDesc;
    if (editPrice !== editTarget.price) data.price = editPrice;
    if (parseInt(editStock) !== editTarget.stock) data.stock = parseInt(editStock);
    doUpdate({ productId: editTarget.product_id, data }, { onSuccess: () => setEditTarget(null) });
  }

  return (
    <>
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Create Product</h3>
        <form onSubmit={handleCreate} style={styles.inlineForm}>
          <input style={styles.input} placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
          <input style={styles.input} placeholder="Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          <input style={styles.input} placeholder="Price (e.g. 9.99)" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required />
          <input style={{ ...styles.input, maxWidth: "100px" }} type="number" placeholder="Stock" min="0" value={newStock} onChange={(e) => setNewStock(e.target.value)} required />
          <button style={styles.primaryBtn} type="submit" disabled={creating}>{creating ? "Creating…" : "Create"}</button>
        </form>
        {createError && <p style={styles.error}>{createError.message}</p>}
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>All Products</h3>
        {isLoading && <p>Loading…</p>}
        {error && <p style={styles.error}>{error.message}</p>}
        {products && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th><th style={styles.th}>Description</th>
                <th style={styles.th}>Price</th><th style={styles.th}>Stock</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.product_id} style={styles.tr}>
                  <td style={styles.td}>{p.name}</td>
                  <td style={{ ...styles.td, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.description}</td>
                  <td style={styles.td}>RM {p.price}</td>
                  <td style={styles.td}>
                    <span style={{ color: p.stock === 0 ? "#dc2626" : "#111" }}>{p.stock}</span>
                  </td>
                  <td style={styles.td}>
                    <button style={styles.editBtn} onClick={() => openEdit(p)}>Edit</button>
                    <button style={styles.deleteBtn} onClick={() => setDeleteConfirm(p.product_id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {editTarget && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.sectionTitle}>Edit Product</h3>
            <form onSubmit={handleUpdate} style={styles.stackForm}>
              <label style={styles.label}>Name<input style={styles.input} value={editName} onChange={(e) => setEditName(e.target.value)} required /></label>
              <label style={styles.label}>Description<input style={styles.input} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} /></label>
              <label style={styles.label}>Price<input style={styles.input} value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required /></label>
              <label style={styles.label}>Stock<input style={styles.input} type="number" min="0" value={editStock} onChange={(e) => setEditStock(e.target.value)} required /></label>
              {updateError && <p style={styles.error}>{updateError.message}</p>}
              <div style={styles.modalActions}>
                <button style={styles.secondaryBtn} type="button" onClick={() => setEditTarget(null)}>Cancel</button>
                <button style={styles.primaryBtn} type="submit" disabled={updating}>{updating ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteConfirm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <p>Delete this product? This cannot be undone.</p>
            <div style={styles.modalActions}>
              <button style={styles.secondaryBtn} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button style={styles.deleteBtn} onClick={() => { doDelete(deleteConfirm, { onSuccess: () => setDeleteConfirm(null) }); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Orders section ───────────────────────────────────────────────────────────
function OrdersSection() {
  const { data: orders, isLoading, error } = useOrders();
  const { mutate: doUpdateStatus, error: statusError } = useUpdateOrderStatus();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section style={styles.section}>
      <h3 style={styles.sectionTitle}>All Orders</h3>
      {isLoading && <p>Loading…</p>}
      {error && <p style={styles.error}>{error.message}</p>}
      {statusError && <p style={styles.error}>{statusError.message}</p>}
      {orders && orders.length === 0 && <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>No orders yet.</p>}
      {orders?.map((o) => (
        <div key={o.order_id} style={styles.orderCard}>
          <div style={styles.orderHeader} onClick={() => setExpandedId(expandedId === o.order_id ? null : o.order_id)}>
            <div>
              <strong style={{ fontSize: "0.875rem" }}>#{o.order_id.slice(0, 8).toUpperCase()}</strong>
              <span style={{ marginLeft: "0.75rem", fontSize: "0.8rem", color: "#6b7280" }}>{new Date(o.created_at).toLocaleString()}</span>
              <span style={{ marginLeft: "0.75rem", fontSize: "0.8rem", color: "#6b7280" }}>User: {o.user_id.slice(0, 8)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ ...styles.badge, background: STATUS_COLORS[o.status] ?? "#6b7280" }}>{o.status}</span>
              <strong style={{ fontSize: "0.875rem" }}>RM {o.total_price}</strong>
              <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{expandedId === o.order_id ? "▲" : "▼"}</span>
            </div>
          </div>
          {expandedId === o.order_id && (
            <div style={styles.orderBody}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Product</th><th style={styles.th}>Unit Price</th>
                    <th style={styles.th}>Qty</th><th style={styles.th}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {o.items.map((item, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{item.product_name}</td>
                      <td style={styles.td}>RM {item.unit_price}</td>
                      <td style={styles.td}>{item.quantity}</td>
                      <td style={styles.td}>RM {item.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>Status:</label>
                <select
                  style={{ ...styles.input, flex: "none", width: "auto" }}
                  value={o.status}
                  onChange={(e) => doUpdateStatus({ orderId: o.order_id, status: e.target.value })}
                >
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

// ─── Main AdminPanel ──────────────────────────────────────────────────────────
export function AdminPanel() {
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const { mutate: doLogout } = useLogout();
  const [tab, setTab] = useState<Tab>("users");

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Admin Panel</h2>
          <div style={styles.headerRight}>
            <span style={styles.userBadge}>Logged in as <strong>{me?.username}</strong></span>
            <button style={styles.logoutBtn} onClick={() => doLogout(undefined, { onSuccess: () => navigate("/login") })}>Logout</button>
          </div>
        </div>

        <div style={styles.tabs}>
          {(["users", "products", "orders"] as Tab[]).map((t) => (
            <button
              key={t}
              style={{ ...styles.tab, ...(tab === t ? styles.activeTab : {}) }}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === "users" && <UsersSection />}
        {tab === "products" && <ProductsSection />}
        {tab === "orders" && <OrdersSection />}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f5f5f5", padding: "2rem" },
  container: { maxWidth: "1100px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" },
  title: { margin: 0, fontSize: "1.5rem" },
  headerRight: { display: "flex", alignItems: "center", gap: "1rem" },
  userBadge: { fontSize: "0.875rem" },
  logoutBtn: { padding: "0.375rem 0.75rem", background: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" },
  tabs: { display: "flex", gap: "0.25rem", marginBottom: "1.25rem", borderBottom: "2px solid #e5e7eb", paddingBottom: "0" },
  tab: { padding: "0.5rem 1.25rem", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", color: "#6b7280", borderBottom: "2px solid transparent", marginBottom: "-2px" },
  activeTab: { color: "#2563eb", borderBottom: "2px solid #2563eb", fontWeight: 600 },
  section: { background: "#fff", borderRadius: "8px", padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  sectionTitle: { margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600 },
  inlineForm: { display: "flex", gap: "0.75rem", flexWrap: "wrap" },
  stackForm: { display: "flex", flexDirection: "column", gap: "1rem" },
  input: { padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px", fontSize: "0.875rem", flex: 1, minWidth: "120px" },
  primaryBtn: { padding: "0.5rem 1rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.875rem" },
  secondaryBtn: { padding: "0.5rem 1rem", background: "#e5e7eb", color: "#111", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.875rem" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "0.5rem 0.75rem", borderBottom: "2px solid #e5e7eb", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "#6b7280" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "0.625rem 0.75rem", fontSize: "0.875rem" },
  badge: { display: "inline-block", padding: "2px 8px", borderRadius: "9999px", color: "#fff", fontSize: "0.75rem", fontWeight: 500 },
  editBtn: { marginRight: "0.5rem", padding: "0.25rem 0.625rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem" },
  deleteBtn: { padding: "0.25rem 0.625rem", background: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "#fff", borderRadius: "8px", padding: "1.5rem", width: "400px", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" },
  label: { display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.875rem", fontWeight: 500 },
  error: { color: "#dc2626", fontSize: "0.875rem", margin: "0.5rem 0 0" },
  orderCard: { border: "1px solid #e5e7eb", borderRadius: "6px", marginBottom: "0.75rem", overflow: "hidden" },
  orderHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", cursor: "pointer", background: "#fafafa" },
  orderBody: { padding: "0 1rem 1rem", borderTop: "1px solid #e5e7eb" },
};
