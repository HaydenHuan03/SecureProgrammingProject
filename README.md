# SecureProgrammingProject

SECR4483 Secure Programming — Group Project (2025/2026-02)

A secure e-commerce web application demonstrating authentication, session management, role-based access control, and transaction security.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12 · Django 5.1 · Django REST Framework |
| Frontend | React 19 · TypeScript · Vite · TanStack Query · React Router v7 |
| Database | PostgreSQL 16 |
| Local email | Mailhog (SMTP catcher for OTP demo) |
| Containers | Docker Compose |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Compose                       │
│                                                         │
│  ┌──────────────────────┐  ┌──────────────┐ ┌────────┐ │
│  │  React/TS SPA        │─▶│  Django DRF  │─▶Postgres│ │
│  │  + TanStack Query    │  │  (port 8000) │ │        │ │
│  │  (port 3000)         │  └──────┬───────┘ └────────┘ │
│  └──────────────────────┘         │                     │
│                            ┌──────▼───────┐             │
│                            │   Mailhog    │             │
│                            │  (port 8025) │             │
│                            └──────────────┘             │
└─────────────────────────────────────────────────────────┘
```

- **React SPA** communicates with Django via `fetch` (TanStack Query manages caching and mutations). All requests include session cookies and CSRF tokens automatically.
- **Django DRF** serves a REST API with session-based authentication. Business logic, RBAC enforcement, OTP dispatch, and security controls all live here.
- **PostgreSQL** stores all application data including Django sessions (`django.contrib.sessions.backends.db`).
- **Mailhog** catches outbound SMTP so OTP emails are visible in a browser UI during development and demos — no real mail server needed.

### Backend Structure

```
backend/
├── config/        — Django project settings and root URL config
├── core/          — Shared permission classes (IsAdmin, IsCustomer) and exception handler
├── accounts/      — User model, OTPToken model, auth views
├── products/      — Product model, views (admin write / public read)
└── orders/        — Order and OrderItem models, views
```

### Frontend Structure

```
frontend/src/
├── api/client.ts        — Central fetch wrapper (credentials, CSRF header)
├── features/
│   ├── auth/            — Login (two-step), Register, hooks
│   ├── products/        — Product listing, admin form, hooks
│   └── orders/          — Cart, order history, hooks
├── components/          — ProtectedRoute, shared UI components
└── router/              — React Router with role-based route guards
```

---

## Security Features

| Feature | Implementation |
|---------|---------------|
| Password hashing | Argon2 (Django's strongest built-in hasher) |
| Session security | HttpOnly cookie · SameSite=Lax · 30-min timeout · regenerated on login |
| Multi-factor auth | Email OTP — 6-digit code, SHA-256 hashed in DB, 5-min expiry, single-use |
| Brute force protection | Account locked for 15 min after 5 failed login attempts |
| RBAC | `customer` and `admin` roles enforced server-side on every DRF view |
| CSRF protection | Django `CsrfViewMiddleware` + `X-CSRFToken` header on all mutations |
| SQL injection | ORM-only queries — no raw SQL |
| XSS | DRF output escaping + React JSX escaping |
| Price manipulation | `unit_price` snapshotted at order creation — never read from client |
| Error disclosure | Generic error messages — stack traces never reach the client |

---

## Running Locally

**Prerequisites:** Docker and Docker Compose

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Mailhog (OTP emails) | http://localhost:8025 |
| PostgreSQL | localhost:5432 |

---

## API Overview

```
POST   /api/auth/register/          Register new account (sends email verification OTP)
POST   /api/auth/verify-email/      Submit email verification OTP
POST   /api/auth/login/             Step 1 — validate password, send MFA OTP
POST   /api/auth/login/verify-otp/  Step 2 — submit OTP, create session
POST   /api/auth/logout/            Delete session server-side
GET    /api/auth/me/                Current user info and role

GET    /api/products/               List active products (public)
POST   /api/products/               Create product [admin]
PATCH  /api/products/:id/           Update product [admin]
DELETE /api/products/:id/           Soft-delete product [admin]

GET    /api/orders/                 List own orders [customer]
POST   /api/orders/                 Place order [customer]
DELETE /api/orders/:id/             Cancel pending order [customer]

GET    /api/admin/orders/           List all orders [admin]
PATCH  /api/admin/orders/:id/       Update order status [admin]
GET    /api/admin/users/            List all users [admin]
```
