import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../features/auth/LoginPage";
import { AdminPanel } from "../features/users/AdminPanel";
import { ProfilePage } from "../features/users/ProfilePage";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAuth } from "../features/auth/AuthContext";

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/profile"} replace />;
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/admin",
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminPanel />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  { path: "/", element: <RootRedirect /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);
