# Haven Backend

Haven is a property management platform backend built with **Node.js**, **Express**, and **MongoDB**. It provides RESTful APIs for landlord and tenant operations including property management, lease handling, maintenance tracking, AI-powered document extraction, real-time notifications, and subscription billing.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Properties](#properties)
  - [Lease Management](#lease-management)
  - [Maintenance](#maintenance)
  - [Notifications](#notifications)
  - [AI Document Extraction](#ai-document-extraction)
  - [Subscriptions](#subscriptions)
  - [Webhooks](#webhooks)
  - [Performance](#performance)
  - [Updates](#updates)
- [Data Models](#data-models)
- [WebSocket Events](#websocket-events)
- [Swagger Documentation](#swagger-documentation)

---

## Tech Stack

| Technology           | Purpose                              |
| -------------------- | ------------------------------------ |
| **Express.js**       | HTTP server & routing                |
| **MongoDB/Mongoose** | Database & ODM                       |
| **Socket.IO**        | Real-time notifications & events     |
| **Cloudinary**       | Image/media storage                  |
| **JWT**              | Authentication & token management    |
| **Argon2**           | Password hashing                     |
| **Multer**           | File upload handling                 |
| **LangChain + Groq** | AI-powered lease document extraction |
| **Flutterwave**      | Payment processing & subscriptions   |
| **Nodemailer/Resend** | Transactional emails                |
| **Swagger**          | Interactive API documentation        |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **MongoDB** (local instance or Atlas connection string)
- **Cloudinary** account (for media uploads)

### Installation

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Start the development server (uses nodemon)
npm start
```

The server runs on **port 4000** by default.

---

## Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Cloudinary
API_KEY=<cloudinary_api_key>
API_SECRET=<cloudinary_api_secret>
CLOUD_NAME=<cloudinary_cloud_name>

# App URLs
FRONTENDURL=http://localhost:3000
BACKENDURL=http://localhost:4000

# Auth
JWTSECRET=<your_jwt_secret>

# Email
MAILERPASSWORD=<gmail_app_password>
RESEND_API_KEY=<resend_api_key>

# Database
MONGOCONNECTIONSTRING=mongodb://localhost:27017/haven

# Google OAuth
GOOGLE_CLIENT_ID=<google_oauth_client_id>

# Flutterwave (Payments)
FLW_SECRET_HASH=<flutterwave_webhook_hash>
FLW_SECRET_KEY=<flutterwave_secret_key>
```

---

## Project Structure

```
backend/
├── index.js              # App entry point — Express setup, middleware, routes, Socket.IO
├── package.json
├── .env
├── controllers/          # Business logic
│   ├── users.js          # Auth & user profile operations
│   ├── property.js       # Property CRUD
│   ├── lease.js          # Lease lifecycle management
│   ├── maintenance.js    # Maintenance request handling
│   ├── performance.js    # Dashboard analytics
│   ├── flwWebhook.js     # Flutterwave webhook handlers
│   └── updates.js        # Landlord update broadcasts
├── routes/               # Route definitions (with Swagger JSDoc)
│   ├── user.js           # Auth & user routes
│   ├── property.js       # Property routes
│   ├── lease.js          # Lease routes
│   ├── maintenance.js    # Maintenance routes
│   ├── notification.js   # Notification routes
│   ├── aiExtraction.js   # AI extraction routes
│   ├── subscribe.js      # Subscription routes
│   ├── webhooks.js       # Flutterwave webhook routes
│   ├── flwWebhook.js     # Legacy Flutterwave routes
│   ├── performance.js    # Performance/analytics routes
│   └── updates.js        # Landlord updates routes
├── schema/               # Mongoose models
│   ├── user.js
│   ├── property.js
│   ├── lease.js
│   ├── maintenance.js
│   ├── notification.js
│   ├── subscriptions.js
│   ├── messages.js
│   ├── updates.js
│   └── media-reference.js
└── utils/                # Shared utilities
    ├── aiExtractor.js    # LLM-based PDF lease extraction (LangChain + Groq)
    ├── authMiddleware.js # JWT verification middleware
    ├── cloudinary.js     # Cloudinary SDK configuration
    ├── cookie.js         # Cookie helpers
    ├── deleteMedia.js    # Cloudinary media deletion
    ├── filterSetting.js  # Query filter utilities
    ├── hash.js           # Argon2 password hashing
    ├── jwt.js            # JWT sign / verify helpers
    ├── multer.js         # Multer upload configuration
    ├── sendEmail.js      # Email templates & sending (Nodemailer / Resend)
    ├── sendNotification.js # Push notification via Socket.IO
    ├── sendResponse.js   # Standardized API response helper
    ├── socketHandlers.js # Socket.IO event handlers
    ├── swagger.js        # Swagger/OpenAPI configuration
    └── userSockets.js    # User-to-socket mapping
```

---

## API Reference

All routes return JSON responses. Protected routes require a **Bearer** JWT token in the `Authorization` header.

### Authentication

| Method    | Endpoint                          | Description                           | Auth |
| --------- | --------------------------------- | ------------------------------------- | ---- |
| `POST`    | `/auth/register`                  | Register a new user                   | No   |
| `POST`    | `/auth/verify-email`              | Verify email with token               | No   |
| `POST`    | `/auth/resend-email-verification` | Resend verification email             | No   |
| `POST`    | `/auth/login`                     | Login and receive JWT                 | No   |
| `GET`     | `/auth/current-user`              | Get current authenticated user        | Yes  |
| `POST`    | `/auth/forgot-password`           | Send password reset email             | No   |
| `POST`    | `/auth/reset-password`            | Reset password with token             | No   |
| `POST`    | `/account/google-auth`            | Login/register via Google OAuth       | No   |
| `PATCH`   | `/auth/edit-user`                 | Edit personal details (no image)      | Yes  |
| `PATCH`   | `/auth/edit-user-with-image`      | Edit personal details (with avatar)   | Yes  |
| `PATCH`   | `/auth/edit-company-info`         | Edit company information              | Yes  |
| `PATCH`   | `/auth/edit-user-security`        | Update password                       | Yes  |

---

### Properties

| Method    | Endpoint                                    | Description                        | Auth |
| --------- | ------------------------------------------- | ---------------------------------- | ---- |
| `GET`     | `/dashboard/get-property`                   | Get all properties for user        | Yes  |
| `POST`    | `/dashboard/add-property`                   | Add a new property (with images)   | Yes  |
| `PATCH`   | `/dashboard/edit-property/:propertyId`      | Edit an existing property          | Yes  |
| `DELETE`  | `/dashboard/delete-property/:propertyId`    | Delete a property                  | Yes  |

---

### Lease Management

| Method    | Endpoint                                    | Description                              | Auth |
| --------- | ------------------------------------------- | ---------------------------------------- | ---- |
| `POST`    | `/dashboard/create-lease-form-token`        | Generate lease form URL for a tenant     | Yes  |
| `POST`    | `/dashboard/send-lease-as-email`            | Email lease form link to tenant          | Yes  |
| `POST`    | `/dashboard/landlord-create-lease`          | Landlord creates a lease (with avatar)   | Yes  |
| `POST`    | `/dashboard/tenant-create-lease`            | Tenant submits a lease (with avatar)     | No   |
| `GET`     | `/dashboard/get-lease`                      | Landlord gets all leases                 | Yes  |
| `PATCH`   | `/dashboard/edit-lease/:leaseId`            | Edit lease details                       | Yes  |
| `PATCH`   | `/dashboard/approve-lease/:leaseId`         | Approve a pending lease                  | Yes  |
| `DELETE`  | `/dashboard/delete-lease/:leaseId`          | Delete a lease                           | Yes  |
| `POST`    | `/tenant/login-mail`                        | Tenant requests magic login link         | No   |
| `POST`    | `/tenant/verify-magic-link`                 | Verify tenant magic link token           | No   |
| `GET`     | `/tenant/get-my-lease-info`                 | Get tenant's lease information           | Yes  |

---

### Maintenance

| Method    | Endpoint                                          | Description                           | Auth |
| --------- | ------------------------------------------------- | ------------------------------------- | ---- |
| `GET`     | `/dashboard/get-all-maintenance`                  | Landlord gets all maintenance requests| Yes  |
| `POST`    | `/dashboard/add-maintenance/`                     | Landlord adds a maintenance request   | Yes  |
| `PATCH`   | `/dashboard/approve-maintenance/:maintenanceId`   | Approve/resolve maintenance           | Yes  |
| `DELETE`  | `/dashboard/delete-maintenance/:maintenanceId`    | Delete a maintenance request          | Yes  |
| `GET`     | `/tenant/get-tenant-maintenance`                  | Tenant gets their maintenance requests| Yes  |
| `POST`    | `/tenant/add-maintenance/`                        | Tenant submits maintenance request    | Yes  |
| `DELETE`  | `/tenant/delete-maintenance/:maintenanceId`       | Tenant deletes maintenance request    | Yes  |

---

### Notifications

| Method    | Endpoint               | Description                        | Auth |
| --------- | ---------------------- | ---------------------------------- | ---- |
| `POST`    | `/test-notification`   | Send a notification to a user      | No   |

---

### AI Document Extraction

| Method    | Endpoint             | Description                                    | Auth |
| --------- | -------------------- | ---------------------------------------------- | ---- |
| `POST`    | `/landlord/extract`  | Upload a PDF lease and extract info using AI   | No   |

Accepts `multipart/form-data` with a `document` field (PDF only). Uses **LangChain + Groq LLM** to parse and extract structured lease data from uploaded documents.

---

### Subscriptions

| Method    | Endpoint                       | Description                                 | Auth |
| --------- | ------------------------------ | ------------------------------------------- | ---- |
| `POST`    | `/api/subscribe/create-sub`    | Initiate a subscription payment via Flutterwave | No   |

---

### Webhooks

| Method    | Endpoint                    | Description                                   | Auth |
| --------- | --------------------------- | --------------------------------------------- | ---- |
| `POST`    | `/flutterwave`              | Flutterwave webhook (charge + subscription)   | Signature |
| `POST`    | `/flw-webhook`              | Legacy Flutterwave webhook                    | No   |
| `POST`    | `/flw-payment-completed`    | Payment completion handler                    | No   |

The `/flutterwave` webhook verifies the `verif-hash` header for security. It handles `charge.completed`, `subscription.deactivated`, `subscription.cancelled`, and `charge.failed` events.

---

### Performance

| Method    | Endpoint                          | Description                    | Auth |
| --------- | --------------------------------- | ------------------------------ | ---- |
| `GET`     | `/performance/dashboard-data`     | Get dashboard analytics data   | Yes  |

---

### Updates

| Method    | Endpoint                              | Description                          | Auth |
| --------- | ------------------------------------- | ------------------------------------ | ---- |
| `GET`     | `/property/landlord-get-updates`      | Get all landlord updates             | Yes  |
| `POST`    | `/property/landlord-send-updates`     | Send an update to tenants (with files)| Yes  |

---

## Data Models

### User
| Field             | Type      | Description                        |
| ----------------- | --------- | ---------------------------------- |
| `email`           | String    | Unique, lowercase                  |
| `passwordHash`    | String    | Argon2 hash                        |
| `personal`        | Object    | `fullName`, `avatarUrl`, `phoneNumber`, `imageId` |
| `companyInfo`     | Object    | `companyName`, `companyWebsite`    |
| `subscription`    | String    | `"free"` or `"pro"`               |
| `emailVerified`   | Boolean   | Default: `false`                   |
| `version`         | Number    | Optimistic concurrency control     |

### Property
| Field               | Type    | Description                     |
| ------------------- | ------- | ------------------------------- |
| `userId`            | String  | Owner user ID                   |
| `propertyName`      | String  | Name of the property            |
| `propertyLocation`  | String  | Address/location                |
| `country`           | String  | Country                         |
| `numberOfUnits`     | Number  | Total units                     |
| `propertyType`      | String  | Type (apartment, house, etc.)   |
| `propertyImagesUrl` | String  | Cloudinary image URL            |
| `occupiedUnits`     | Number  | Currently occupied units        |
| `pendingUnits`      | Number  | Pending lease units             |

### Lease
| Field                | Type    | Description                    |
| -------------------- | ------- | ------------------------------ |
| `landlordId`         | String  | Landlord user ID               |
| `propertyId`         | String  | Associated property            |
| `tenantName`         | String  | Tenant full name               |
| `tenantEmailAddress` | String  | Tenant email                   |
| `tenantUnit`         | String  | Assigned unit                  |
| `tenantGender`       | String  | Tenant gender                  |
| `tenantPhoneNumber`  | String  | Tenant phone                   |
| `leaseFee`           | Number  | Monthly/cycle fee              |
| `leaseCycle`         | String  | Billing cycle                  |
| `startsFrom`         | Date    | Lease start date               |
| `endsOn`             | Date    | Lease end date                 |
| `leaseStatus`        | String  | `"pending"`, `"active"`, etc.  |
| `avatar`             | String  | Tenant avatar URL              |

### Maintenance
| Field                 | Type     | Description                       |
| --------------------- | -------- | --------------------------------- |
| `requestCategory`     | String   | Category of request               |
| `requestType`         | String   | Type of maintenance               |
| `affectedUnit`        | String   | Unit affected                     |
| `estimatedCost`       | Number   | Cost estimate                     |
| `requestDescription`  | String   | Detailed description              |
| `requestImages`       | [String] | Cloudinary image URLs             |
| `propertyId`          | String   | Associated property               |
| `landlordId`          | String   | Landlord user ID                  |
| `isResolved`          | Boolean  | Resolution status                 |
| `priority`            | String   | `"low"`, `"medium"`, `"high"`     |
| `tenantId`            | String   | Requesting tenant ID              |

### Notification
| Field     | Type     | Description                                    |
| --------- | -------- | ---------------------------------------------- |
| `userId`  | ObjectId | Target user                                    |
| `type`    | String   | `"message"`, `"lease"`, `"maintenance"`, `"other"` |
| `payload` | Object   | Notification content (title, message, etc.)    |
| `data`    | Object   | Additional data                                |
| `read`    | Boolean  | Read status                                    |

### Subscription
| Field               | Type     | Description                                          |
| ------------------- | -------- | ---------------------------------------------------- |
| `user`              | ObjectId | Reference to user                                    |
| `flwSubscriptionId` | String   | Flutterwave subscription ID                          |
| `planId`            | String   | Flutterwave plan ID                                  |
| `amount`            | Number   | Subscription amount                                  |
| `currency`          | String   | Currency code (default: `"NGN"`)                     |
| `status`            | String   | `"active"`, `"inactive"`, `"cancelled"`, `"pending"`, `"failed"` |
| `cardType`          | String   | Card type (Visa, Mastercard, etc.)                   |
| `lastFourDigits`    | Number   | Last 4 digits of card                                |
| `nextBillingDate`   | String   | Next charge date                                     |

### Message
| Field          | Type    | Description                  |
| -------------- | ------- | ---------------------------- |
| `ownerUsername` | String  | Message sender username      |
| `type`         | String  | Message type (text, audio)   |
| `messageText`  | String  | Text content                 |
| `audioUrl`     | String  | Audio file URL               |
| `isOpened`     | Boolean | Read/opened status           |
| `isStarred`    | Boolean | Starred/flagged status       |

### Update
| Field        | Type     | Description                   |
| ------------ | -------- | ----------------------------- |
| `userId`     | String   | Landlord user ID              |
| `message`    | String   | Update message                |
| `files`      | [Object] | Attached files (`url`, `type`, `name`, `size`) |
| `propertyId` | String   | Associated property           |

---

## WebSocket Events

Socket.IO is used for real-time communication. Connections require a JWT token via `socket.handshake.auth.token` and a `role` (`"landlord"` or `"tenant"`).

### Connection Flow

| Role       | On Connect                                           |
| ---------- | ---------------------------------------------------- |
| `landlord` | Joins room by user ID, receives `notifications:init` |
| `tenant`   | Joins room by property ID, receives `landlord_update:init` |

### Client → Server Events

| Event                   | Payload       | Description                      |
| ----------------------- | ------------- | -------------------------------- |
| `notifications:read`    | `string[]`    | Mark notification IDs as read    |
| `notifications:delete`  | `string[]`    | Delete notification IDs          |

### Server → Client Events

| Event                   | Payload              | Description                          |
| ----------------------- | -------------------- | ------------------------------------ |
| `notifications:init`    | `Notification[]`     | Initial notifications on connect     |
| `landlord_update:init`  | `Update[]`           | Initial updates for tenant on connect|
| `notification:new`      | `Notification`       | New real-time notification           |

---

## Swagger Documentation

Interactive API docs are available at:

```
http://localhost:4000/api-docs
```

Swagger is auto-generated from JSDoc comments in the route files using `swagger-jsdoc` and served via `swagger-ui-express`.

---

## License

ISC
