# Secure E-Commerce Application — Design Spec
**Course:** SECR4483 Secure Programming — Group Project 2025/2026-02
**Date:** 2026-06-07

---

## 1. Overview

A secure e-commerce web application combining a login/registration system (Part 1) and an order/transaction module (Part 2) into a fully integrated application (Part 3). The application demonstrates security controls mapped directly to OWASP vulnerabilities and the assignment rubric.

**Tech Stack:**
- Backend: Django + Django REST Framework (Python)
- Frontend: React with TypeScript + TanStack Query
- Database: PostgreSQL
- Local email: Mailhog (SMTP catcher for OTP demo)
- Containerization: Docker Compose (local only)

---

## 2. Architecture

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

- **React/TS SPA** — all UI, communicates with Django via `fetch` (TanStack Query manages server state, caching, and mutations)
- **Django DRF** — REST API, session-based auth, business logic, email OTP dispatch, RBAC enforcement
- **PostgreSQL** — persists all application data including Django sessions
- **Mailhog** — local SMTP server; catches outbound email so OTP codes are visible during demo without a real mail provider

---

## 3. Data Model

### User
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| email | string | Unique, used for login |
| username | string | Display name |
| password | string | Argon2 hash |
| role | enum | `customer` or `admin` |
| is_active | bool | Account enabled |
| is_email_verified | bool | Email OTP verified |
| failed_login_attempts | int | Brute force counter |
| lockout_until | datetime | Null if not locked |
| created_at | datetime | |
| last_login | datetime | |

### OTPToken
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| user | FK → User | |
| code | string | SHA-256 hashed |
| purpose | enum | `login_mfa` or `email_verify` |
| created_at | datetime | |
| expires_at | datetime | 5 minutes after creation |
| is_used | bool | Single-use enforcement |

### Product
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| name | string | |
| description | text | |
| price | decimal | |
| stock | int | |
| created_by | FK → User | Admin who created it |
| is_active | bool | Soft delete |

### Order
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| user | FK → User | Owner |
| status | enum | `pending`, `confirmed`, `cancelled` |
| total_amount | decimal | Calculated server-side |
| created_at | datetime | |

### OrderItem
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| order | FK → Order | |
| product | FK → Product | |
| quantity | int | |
| unit_price | decimal | **Snapshot at order time** — prevents price manipulation |

---

## 4. Security Controls

Maps to Part 3 rubric: at least 4 security elements required. All 7 are implemented.

### 4.1 Input Validation & Output Sanitization
- DRF serializers validate all input server-side (type, length, format, allowed characters)
- React forms validate client-side for UX only — backend never trusts client input
- All DB queries use Django ORM (parameterized) — no raw SQL, no SQLi risk
- DRF auto-escapes serialized output; React JSX escapes by default — no XSS risk

### 4.2 Secure Session Management
- `SESSION_COOKIE_HTTPONLY = True` — JavaScript cannot read the session cookie
- `SESSION_COOKIE_SAMESITE = "Strict"` — blocks CSRF via cross-site requests
- `SESSION_COOKIE_SECURE = True` in production config; `False` in local Docker dev (HTTP only — no nginx/TLS in local stack)
- Session ID regenerated on login (`request.session.cycle_key()`) — prevents session fixation
- Session expires after 30 min inactivity (`SESSION_COOKIE_AGE = 1800`)
- Full session deleted on logout — not just the cookie

### 4.3 Email OTP (Multi-Factor Authentication)
- Triggered after correct password entry on login
- 6-digit numeric code; stored SHA-256 hashed in DB
- Expires in 5 minutes; single-use (marked `is_used = True` on consumption)
- Rate-limited: max 3 OTP requests per 15 min per user (prevents OTP flooding)

### 4.4 Role-Based Access Control (RBAC)
- Two roles: `customer` and `admin`
- Custom DRF permission classes enforced on every view
- Admin-only: create, update, soft-delete products; view all orders; manage users
- Customer-only: place orders, view own order history (no access to other users' data)

### 4.5 Brute Force Protection
- 5 failed login attempts triggers account lockout for 15 minutes
- Counter and lockout timestamp stored on `User` model
- Counter resets on successful login

### 4.6 Encrypted Storage of Sensitive Data
- Passwords: Argon2 hashing (Django's strongest built-in hasher)
- OTP codes: SHA-256 hashed before storage — plaintext never persisted

### 4.7 Proper Error Handling with Limited Information Disclosure
- All auth errors return generic messages (e.g., "Invalid credentials" — never distinguishes "user not found" from "wrong password")
- `DEBUG = False` in all non-development configs
- Custom 404/500 handlers — no stack traces exposed to clients
- Server errors logged internally, not surfaced to API responses

### 4.8 CSRF Protection
- Django's `CsrfViewMiddleware` active on all endpoints
- React fetches `/api/auth/csrf/` on startup to obtain CSRF cookie
- All mutating requests (`POST`, `PATCH`, `DELETE`) include `X-CSRFToken` header via TanStack Query fetch wrapper

---

## 5. API Design

All endpoints prefixed with `/api/`. Session cookie sent automatically by the browser.

```
AUTH
POST   /api/auth/register/          — create account, send email verification OTP
POST   /api/auth/verify-email/      — submit email verification OTP
GET    /api/auth/csrf/              — obtain CSRF cookie
POST   /api/auth/login/             — step 1: validate password, send MFA OTP
POST   /api/auth/login/verify-otp/  — step 2: submit OTP, create session
POST   /api/auth/logout/            — delete session server-side
GET    /api/auth/me/                — return current user info + role

PRODUCTS (public read, admin write)
GET    /api/products/               — list active products
GET    /api/products/:id/           — product detail
POST   /api/products/               — [admin] create product
PATCH  /api/products/:id/           — [admin] update product
DELETE /api/products/:id/           — [admin] deactivate product (soft delete)

ORDERS (authenticated customers only)
GET    /api/orders/                 — list own orders
POST   /api/orders/                 — place new order
GET    /api/orders/:id/             — own order detail
DELETE /api/orders/:id/             — cancel pending order

ADMIN
GET    /api/admin/orders/           — [admin] list all orders
PATCH  /api/admin/orders/:id/       — [admin] update order status
GET    /api/admin/users/            — [admin] list all users
```

---

## 6. Frontend Structure

```
src/
├── api/
│   └── client.ts               — fetch wrapper (CSRF header, credentials: "include")
├── features/
│   ├── auth/
│   │   ├── LoginPage.tsx        — two-step: password → OTP
│   │   ├── RegisterPage.tsx
│   │   └── hooks/              — useLogin, useRegister, useLogout (TanStack mutations)
│   ├── products/
│   │   ├── ProductList.tsx      — public product listing
│   │   ├── ProductForm.tsx      — admin create/edit form
│   │   └── hooks/              — useProducts, useCreateProduct, useUpdateProduct
│   └── orders/
│       ├── CartPage.tsx
│       ├── OrderHistory.tsx
│       └── hooks/              — useOrders, usePlaceOrder, useCancelOrder
├── components/
│   ├── ProtectedRoute.tsx       — redirects unauthenticated users, enforces role
│   ├── Button.tsx
│   └── Input.tsx
├── router/
│   └── index.tsx               — React Router v6, role-based route guards
└── main.tsx
```

**Key frontend security decisions:**
- `ProtectedRoute` enforces role-based access client-side (backed by server enforcement on every request)
- `credentials: "include"` on every fetch — sends session cookie cross-origin (port 3000 → port 8000)
- No sensitive data in `localStorage` — session lives in the HttpOnly cookie only; TanStack Query cache is in-memory only
- Two-step login flow: password submission → OTP verification → session established

---

## 7. Django App Structure

```
backend/
├── config/                 — Django project settings, URLs, WSGI
├── apps/
│   ├── accounts/           — User model, OTPToken, auth views, serializers
│   ├── products/           — Product model, views, serializers
│   └── orders/             — Order, OrderItem models, views, serializers
├── core/
│   ├── permissions.py      — IsAdmin, IsCustomer DRF permission classes
│   └── exceptions.py       — Custom exception handler (generic error messages)
├── manage.py
└── requirements.txt
```

---

## 8. Seeding & Initial Admin

A Django management command (`python manage.py seed`) will:
- Create one admin user (credentials printed to console on first run)
- Seed 5–10 sample products

This ensures the app is immediately demo-able after `docker compose up`.

---

## 9. Docker Compose Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| db | postgres:16 | 5432 | PostgreSQL database |
| backend | custom (Python 3.12) | 8000 | Django DRF API |
| frontend | custom (Node 20) | 3000 | React dev server |
| mailhog | mailhog/mailhog | 8025 | Local SMTP + web UI for OTP |

---

## 10. Assignment Rubric Mapping

| Rubric Item | Implementation |
|-------------|---------------|
| **Part 1** Input validation flaws | DRF serializer validation + ORM parameterized queries |
| **Part 1** Weak password handling | Argon2 hashing + min-length/complexity enforcement |
| **Part 1** SQL injection/XSS | ORM-only queries; JSX + DRF output escaping |
| **Part 1** Session initialization risks | `cycle_key()` on login; HttpOnly+SameSite cookie |
| **Part 2** Session fixation/hijacking | Session regeneration; HttpOnly; SameSite=Strict |
| **Part 2** Client-side state manipulation | `unit_price` snapshot; all totals computed server-side |
| **Part 2** Authorization gaps | DRF permission classes on every view; ownership checks |
| **Part 2** Input/output sanitization | Serializer validation; DRF + JSX escaping |
| **Part 3** Functional integration | Login → OTP → product browse → place order → history |
| **Part 3** Security (≥4 elements) | 7 elements implemented (see Section 4) |
| **Part 3** Testing & evaluation | Burp Suite / OWASP ZAP scan against running Docker stack |
| **Part 3** Documentation quality | This spec + inline code comments + technical report |
