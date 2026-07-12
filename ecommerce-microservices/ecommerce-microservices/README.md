# Zonto — Amazon-style E-Commerce Microservices Platform

A full-stack, event-driven e-commerce platform built with independent microservices,
JWT authentication/authorization, Apache Kafka for asynchronous communication,
MongoDB (database-per-service), and a React frontend — all wired together with
Docker Compose.

## Architecture

```
                                   ┌─────────────┐
                                   │   Frontend   │  React + Vite (served by nginx)
                                   │  (port 3000) │
                                   └──────┬───────┘
                                          │ REST (JWT bearer)
                                   ┌──────▼───────┐
                                   │ API Gateway   │  single entry point, reverse proxy,
                                   │ (port 8080)   │  aggregated /system/db-info & /system/health
                                   └───┬───┬───┬───┘
              ┌────────────┬──────────┤   │   ├───────────┬─────────────┐
              ▼            ▼          ▼   ▼   ▼           ▼             ▼
        ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌────────────┐ ┌────────────────┐
        │  auth    │ │  user    │ │  product  │ │   order    │ │ payment/inventory│
        │ service  │ │ service  │ │  service  │ │  service   │ │  /notification   │
        │ (JWT)    │ │(profile) │ │ (catalog) │ │ (orders)   │ │   services       │
        └────┬─────┘ └────┬─────┘ └─────┬─────┘ └─────┬──────┘ └────────┬─────────┘
             │            │             │              │                │
             ▼            ▼             ▼              ▼                ▼
        ┌─────────────────────────── MongoDB (1 DB per service) ─────────────────┐
        └───────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────────────────────────┐
                         │        Apache Kafka (event bus)       │
                         │  topics: order.events, inventory.events,
                         │          payment.events, notification.events
                         └─────────────────────────────────────┘
```

### Order saga (event-driven, decoupled via Kafka)

1. **order-service** creates the order (`PENDING`) and publishes `order.created` → topic `order.events`.
2. **inventory-service** consumes `order.created`, checks/decrements stock via `product-service` API,
   then publishes `inventory.reserved` or `inventory.failed` → topic `inventory.events`.
3. **payment-service** consumes `inventory.reserved`, simulates charging the customer, then publishes
   `payment.completed` or `payment.failed` → topic `payment.events`.
4. **order-service** consumes both `inventory.events` and `payment.events` to update the order's
   final status (`CONFIRMED`, `INVENTORY_FAILED`, `PAYMENT_FAILED`).
5. **notification-service** consumes every event across all three topics and simulates
   sending the customer an email/SMS at each step.

No service calls another service synchronously for this workflow — everything is decoupled
through Kafka, so any service can be down momentarily without blocking the others (messages
are replayed once it's back up).

## Services

| Service              | Port | Responsibility                                             | Database        |
|----------------------|------|--------------------------------------------------------------|-----------------|
| api-gateway          | 8080 | Single entry point, request routing, aggregated health/db info | -               |
| auth-service         | 4001 | Register/login, JWT access + refresh tokens, token verification | auth_db         |
| user-service          | 4002 | User profile & addresses                                      | user_db         |
| product-service       | 4003 | Product catalog, categories, search, stock                    | product_db      |
| order-service         | 4004 | Order creation, saga status tracking                           | order_db        |
| inventory-service     | 4006 | Stock reservation (Kafka consumer/producer)                    | inventory_db    |
| payment-service       | 4005 | Simulated payment gateway (Kafka consumer/producer)             | payment_db      |
| notification-service  | 4007 | Simulated email/SMS notifications (Kafka consumer)              | notification_db |
| frontend             | 3000 | React storefront                                               | -               |
| kafka / zookeeper    | 9092/2181 | Event bus                                                | -               |
| kafka-ui             | 9093 | Web UI to inspect Kafka topics/messages                        | -               |
| mongo                | 27017| Shared MongoDB instance (one logical DB per service)            | -               |

## Authentication & authorization

- **auth-service** issues a short-lived **JWT access token** (15 min) and a longer-lived
  **refresh token** (7 days) on register/login. Refresh tokens are stored (hashed in
  production; plain here for simplicity) against the user so they can be revoked on logout.
- Every other service verifies the access token **statelessly** using the shared
  `JWT_SECRET` (see `shared/middleware/authMiddleware.js`) — no network call to
  auth-service is needed per request.
- Role-based **authorization** (`customer`, `seller`, `admin`) is enforced with the
  `authorize(...roles)` middleware, e.g. only `seller`/`admin` can create products.
- The frontend automatically refreshes an expired access token using the refresh token
  (see `frontend/src/api/client.js` axios interceptor) and retries the original request.

## Database server info APIs

Every service exposes:
- `GET /health` — liveness check
- `GET /db-info` — current MongoDB connection state (host, db name, ready state)

The gateway aggregates these across all services:
- `GET /api/system/health`
- `GET /api/system/db-info`

The frontend's **Admin → System** page (visible to `admin` role users) polls this every
5 seconds to show a live dashboard of every service's database connectivity.

## Running the project

### Prerequisites
- Docker & Docker Compose installed

### 1. Configure environment
```bash
cp .env.example .env
# edit .env if you want to change secrets/ports
```

### 2. Start everything
```bash
docker compose up --build
```
This starts: Zookeeper, Kafka, Kafka UI, MongoDB, all 7 backend microservices,
the API gateway, and the frontend.

### 3. Seed sample products
```bash
docker compose exec product-service node src/seed.js
```

### 4. Open the app
- Storefront: http://localhost:3000
- API Gateway: http://localhost:8080
- Kafka UI (inspect topics/messages): http://localhost:9093

### 5. Create an admin user (to view the System dashboard)
Register normally through the UI, then either:
- Register with `"roles": ["admin"]` via the API directly:
  ```bash
  curl -X POST http://localhost:8080/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"name":"Admin","email":"admin@zonto.com","password":"admin123","roles":["admin"]}'
  ```

## Key API endpoints (via gateway, base URL `http://localhost:8080/api`)

### Auth
- `POST /auth/register` — { name, email, password, roles? }
- `POST /auth/login` — { email, password }
- `POST /auth/refresh` — { refreshToken }
- `POST /auth/logout` — { refreshToken }
- `GET /auth/verify` — Bearer token → returns decoded user

### Products
- `GET /products?q=&category=&minPrice=&maxPrice=&page=&limit=`
- `GET /products/categories`
- `GET /products/:id`
- `POST /products` (seller/admin, JWT required)
- `PUT /products/:id` (owner seller/admin)
- `DELETE /products/:id` (owner seller/admin)

### Orders
- `POST /orders` — { items: [{productId, title, price, quantity}], shippingAddress } (JWT required)
- `GET /orders/my-orders` (JWT required)
- `GET /orders/:id` (JWT required)
- `POST /orders/:id/cancel` (JWT required)

### Payments
- `GET /payments/my-payments` (JWT required)
- `GET /payments/order/:orderId` (JWT required)

### Users
- `GET /users/me` (JWT required)
- `PUT /users/me` (JWT required)
- `POST /users/me/addresses` (JWT required)

### System / infra
- `GET /system/health`
- `GET /system/db-info`

## Tech stack

- **Frontend**: React 18, Vite, React Router, Axios, plain CSS design tokens
- **Backend**: Node.js, Express, Mongoose
- **Auth**: JWT (access + refresh), bcrypt password hashing, role-based authorization
- **Messaging**: Apache Kafka (via kafkajs), Zookeeper, Kafka UI for inspection
- **Database**: MongoDB — one logical database per microservice (database-per-service pattern)
- **Infra**: Docker, Docker Compose

## Notes / production hardening ideas

- Replace the simulated payment gateway (`payment-service/src/kafka/kafka.js`) with a
  real provider SDK (Stripe, Razorpay, etc.).
- Replace simulated email/SMS logging in `notification-service` with a real provider
  (SES, SendGrid, Twilio).
- Add outbox pattern / idempotency keys for exactly-once semantics across services.
- Add a distributed tracing solution (OpenTelemetry + Jaeger) to trace requests
  across services and Kafka events.
- Move refresh tokens to Redis with TTL instead of embedding in the Mongo user document.
- Put Kafka, Mongo, and each service behind proper secrets management in production
  (this repo's `.env.example` uses placeholder secrets for local development only).
