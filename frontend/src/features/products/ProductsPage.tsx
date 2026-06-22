import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useLogout } from "../auth/hooks/useLogout";
import { useProducts } from "./hooks/useProducts";
import { useCreateOrder } from "../orders/hooks/useCreateOrder";
import type { Product } from "../../api/products";

interface CartItem {
  product: Product;
  quantity: number;
}

export function ProductsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { mutate: doLogout } = useLogout();
  const { data: products, isLoading, error } = useProducts();
  const { mutate: doOrder, isPending: ordering, error: orderError } = useCreateOrder();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderSuccess, setOrderSuccess] = useState(false);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.product_id === product.product_id);
      if (existing) {
        return prev.map((c) =>
          c.product.product_id === product.product_id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((c) => c.product.product_id !== productId));
  }

  function updateQty(productId: string, qty: number) {
    if (qty < 1) return removeFromCart(productId);
    setCart((prev) =>
      prev.map((c) => (c.product.product_id === productId ? { ...c, quantity: qty } : c))
    );
  }

  function cartTotal() {
    return cart
      .reduce((sum, c) => sum + parseFloat(c.product.price) * c.quantity, 0)
      .toFixed(2);
  }

  function handleCheckout() {
    const items = cart.map((c) => ({
      product_id: c.product.product_id,
      quantity: c.quantity,
    }));
    doOrder(items, {
      onSuccess: () => {
        setCart([]);
        setOrderSuccess(true);
        setTimeout(() => setOrderSuccess(false), 4000);
      },
    });
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Products</h2>
          <div style={styles.headerRight}>
            <span style={styles.userBadge}>
              Logged in as <strong>{user?.username}</strong>
            </span>
            <Link to="/orders" style={styles.navLink}>My Orders</Link>
            <Link to="/profile" style={styles.navLink}>Profile</Link>
            <button
              style={styles.logoutBtn}
              onClick={() => doLogout(undefined, { onSuccess: () => navigate("/login") })}
            >
              Logout
            </button>
          </div>
        </div>

        {orderSuccess && (
          <div style={styles.successBanner}>
            Order placed successfully! View it in <Link to="/orders" style={{ color: "#fff" }}>My Orders</Link>.
          </div>
        )}

        <div style={styles.layout}>
          {/* Product grid */}
          <div style={styles.productArea}>
            {isLoading && <p>Loading products…</p>}
            {error && <p style={styles.errorText}>{error.message}</p>}
            {products && products.length === 0 && (
              <p style={styles.emptyText}>No products available yet.</p>
            )}
            <div style={styles.grid}>
              {products?.map((p) => (
                <div key={p.product_id} style={styles.card}>
                  <div style={styles.cardBody}>
                    <h3 style={styles.productName}>{p.name}</h3>
                    {p.description && (
                      <p style={styles.productDesc}>{p.description}</p>
                    )}
                    <div style={styles.cardFooter}>
                      <span style={styles.price}>RM {p.price}</span>
                      <span style={styles.stock}>
                        {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                      </span>
                    </div>
                  </div>
                  <button
                    style={p.stock === 0 ? styles.disabledBtn : styles.addBtn}
                    disabled={p.stock === 0}
                    onClick={() => addToCart(p)}
                  >
                    {p.stock === 0 ? "Out of stock" : "Add to Cart"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <aside style={styles.cart}>
            <h3 style={styles.cartTitle}>Cart {cart.length > 0 && `(${cart.length})`}</h3>
            {cart.length === 0 ? (
              <p style={styles.emptyText}>Your cart is empty.</p>
            ) : (
              <>
                {cart.map((c) => (
                  <div key={c.product.product_id} style={styles.cartItem}>
                    <div style={styles.cartItemName}>{c.product.name}</div>
                    <div style={styles.cartItemControls}>
                      <button style={styles.qtyBtn} onClick={() => updateQty(c.product.product_id, c.quantity - 1)}>−</button>
                      <span style={styles.qtyNum}>{c.quantity}</span>
                      <button
                        style={styles.qtyBtn}
                        disabled={c.quantity >= c.product.stock}
                        onClick={() => updateQty(c.product.product_id, c.quantity + 1)}
                      >+</button>
                      <button style={styles.removeBtn} onClick={() => removeFromCart(c.product.product_id)}>✕</button>
                    </div>
                    <div style={styles.cartItemSubtotal}>
                      RM {(parseFloat(c.product.price) * c.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
                <div style={styles.cartTotal}>
                  <strong>Total: RM {cartTotal()}</strong>
                </div>
                {orderError && <p style={styles.errorText}>{orderError.message}</p>}
                <button
                  style={styles.checkoutBtn}
                  disabled={ordering}
                  onClick={handleCheckout}
                >
                  {ordering ? "Placing order…" : "Place Order"}
                </button>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f5f5f5", padding: "2rem" },
  container: { maxWidth: "1100px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" },
  title: { margin: 0, fontSize: "1.5rem" },
  headerRight: { display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" },
  userBadge: { fontSize: "0.875rem" },
  navLink: { fontSize: "0.875rem", color: "#2563eb", textDecoration: "none" },
  logoutBtn: { padding: "0.375rem 0.75rem", background: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.875rem" },
  successBanner: { background: "#16a34a", color: "#fff", padding: "0.75rem 1rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.875rem" },
  layout: { display: "flex", gap: "1.5rem", alignItems: "flex-start" },
  productArea: { flex: 1 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" },
  card: { background: "#fff", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column" },
  cardBody: { padding: "1rem", flex: 1 },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem" },
  productName: { margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 600 },
  productDesc: { margin: "0", fontSize: "0.8rem", color: "#6b7280", lineHeight: 1.4 },
  price: { fontWeight: 700, color: "#111" },
  stock: { fontSize: "0.75rem", color: "#6b7280" },
  addBtn: { margin: "0.75rem", padding: "0.5rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.875rem" },
  disabledBtn: { margin: "0.75rem", padding: "0.5rem", background: "#d1d5db", color: "#9ca3af", border: "none", borderRadius: "4px", cursor: "not-allowed", fontSize: "0.875rem" },
  cart: { width: "280px", flexShrink: 0, background: "#fff", borderRadius: "8px", padding: "1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", position: "sticky", top: "2rem" },
  cartTitle: { margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600 },
  cartItem: { borderBottom: "1px solid #f3f4f6", paddingBottom: "0.75rem", marginBottom: "0.75rem" },
  cartItemName: { fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.375rem" },
  cartItemControls: { display: "flex", alignItems: "center", gap: "0.375rem" },
  cartItemSubtotal: { fontSize: "0.8rem", color: "#6b7280", marginTop: "0.25rem" },
  qtyBtn: { width: "24px", height: "24px", border: "1px solid #ccc", borderRadius: "4px", background: "#f9fafb", cursor: "pointer", fontSize: "0.875rem", display: "flex", alignItems: "center", justifyContent: "center" },
  qtyNum: { minWidth: "24px", textAlign: "center", fontSize: "0.875rem" },
  removeBtn: { marginLeft: "auto", background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.75rem" },
  cartTotal: { fontSize: "0.875rem", marginBottom: "1rem", textAlign: "right" },
  checkoutBtn: { width: "100%", padding: "0.625rem", background: "#16a34a", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 },
  emptyText: { color: "#9ca3af", fontSize: "0.875rem" },
  errorText: { color: "#dc2626", fontSize: "0.875rem" },
};
