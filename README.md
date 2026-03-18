# SalesPulse CRM — Backend

Node.js + Express + MongoDB backend for the SalesPulse CRM platform.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Database | MongoDB 6+ via Mongoose 8 |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | express-validator |
| Email | Nodemailer (SMTP) |
| Scheduling | node-cron |
| Security | helmet, express-rate-limit, express-mongo-sanitize |

---

## Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB running locally **or** a MongoDB Atlas connection string

### 2. Install
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env and set your MONGODB_URI and SMTP credentials
```

### 4. Seed the database
```bash
npm run seed
```
This creates 3 users, 14 products, 6 customers, 5 interactions, 5 inventory records, and sample notifications.

**Default credentials (all passwords: `Password@123`)**
| Role | Email |
|---|---|
| Admin | admin@salespulse.com |
| Sales Rep (Maharashtra, Karnataka) | priya@salespulse.com |
| Sales Rep (Gujarat) | rahul@salespulse.com |

### 5. Run
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server starts at `http://localhost:5000`

---

## Project Structure

```
salespulse-crm/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── models/
│   │   ├── User.js                # User + User-to-State mapping
│   │   ├── Customer.js            # Customer with approval workflow
│   │   ├── Product.js             # Products with pending flag
│   │   ├── Interaction.js         # Call logs + next action
│   │   ├── Inventory.js           # Stock at customer/dealer site
│   │   └── Notification.js        # In-app + email notifications
│   ├── middleware/
│   │   ├── auth.js                # JWT protect + RBAC + state filter
│   │   └── errorHandler.js        # Central error handler + asyncHandler
│   ├── routes/
│   │   ├── auth.js                # Login, register, profile
│   │   ├── customers.js           # CRUD + approve/reject workflow
│   │   ├── interactions.js        # Log calls, email intro, reminders
│   │   ├── products.js            # Product catalog + pending approval
│   │   ├── inventory.js           # Stock tracking + alerts
│   │   └── misc.js                # Users, Notifications, Dashboard stats
│   ├── utils/
│   │   ├── email.js               # Nodemailer wrapper
│   │   ├── reminderCron.js        # Cron: send reminders 15 min before due
│   │   └── seed.js                # Database seeder
│   └── server.js                  # App entry point
├── public/                        # Place your built frontend here
├── .env.example
└── package.json
```

---

## API Reference

### Authentication
All endpoints except `POST /api/auth/login` require:
```
Authorization: Bearer <token>
```

---

### Auth  `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/login` | Public | Login, returns JWT |
| POST | `/register` | Admin | Create new user |
| GET | `/me` | Auth | Get current user profile |
| PATCH | `/change-password` | Auth | Change own password |

**Login request:**
```json
POST /api/auth/login
{
  "email": "admin@salespulse.com",
  "password": "Password@123"
}
```
**Response:**
```json
{
  "status": "success",
  "token": "eyJ...",
  "data": {
    "user": { "id": "...", "name": "Arjun Kumar", "role": "admin", "assignedStates": [...] }
  }
}
```

---

### Customers  `/api/customers`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Auth | List customers (state-filtered for sales reps) |
| POST | `/` | Auth | Submit new customer (pending) |
| GET | `/:id` | Auth | Get single customer |
| PATCH | `/:id` | Auth | Update customer |
| POST | `/:id/approve` | Admin | Approve pending customer |
| POST | `/:id/reject` | Admin | Reject with reason |
| DELETE | `/:id` | Admin | Soft-delete customer |
| GET | `/pending/list` | Admin | All pending submissions |

**Query params for GET /:**
- `search` — full-text search on name/city
- `state` — filter by state (admin only)
- `segment` — e.g. `Industry:Manufacturing`
- `status` — `active`, `pending`, `inactive`
- `competition` — `New Account`, `Existing Account`, `Competitor Account`
- `page`, `limit` — pagination

**State-based filtering logic:**
- Admin → sees all customers across all states
- Sales Rep → `address.state` must be in `user.assignedStates`
- Sales Rep → also sees their own `pending` submissions

**Submit new customer (pending):**
```json
POST /api/customers
{
  "name": "Nexus Solutions Pvt Ltd",
  "segment": { "category": "Industry", "value": "IT Services" },
  "unit": "Unit 1",
  "competition": "New Account",
  "address": { "street": "MG Road", "city": "Bengaluru", "state": "Karnataka", "pinCode": "560001" },
  "contacts": [
    { "name": "Amit Shah", "phone": "+91 98000 11111", "designation": "CEO", "isPrimary": true }
  ],
  "productInterests": [
    { "productGroup": "Software", "productName": "ERP Suite Pro", "potentialRevenue": 20 }
  ],
  "competitors": [{ "name": "SAP India" }]
}
```

---

### Interactions  `/api/interactions`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Auth | List interactions (own for sales reps) |
| POST | `/` | Auth | Log new interaction |
| GET | `/upcoming` | Auth | Actions due in next N days |
| POST | `/email-preview` | Auth | Preview intro email template |
| PATCH | `/:id/complete-action` | Auth | Mark next action as done |

**Log interaction with all features:**
```json
POST /api/interactions
{
  "customer": "<customerId>",
  "callType": "Follow-up",
  "interactionDate": "2026-03-18T10:00:00.000Z",
  "productGroup": "Consumables",
  "product": "<productId>",
  "productName": "Toner Cartridge Black",
  "notes": "Customer confirmed 50 unit requirement.",
  "quickNoteUsed": "Interested in trial",
  "sendEmail": true,
  "stockSnapshot": {
    "unitsAtSite": 8,
    "threshold": 10
  },
  "nextAction": {
    "type": "Send Quote",
    "dueDate": "2026-03-19T14:00:00.000Z",
    "assignedTo": "<userId>"
  }
}
```

**Behavior:**
- If `stockSnapshot.unitsAtSite <= threshold` → inventory record upserted + low-stock notification created
- If `sendEmail: true` → intro email sent to customer's primary contact
- If `nextAction.dueDate` set → in-app reminder created; cron will send email 15 min before

---

### Products  `/api/products`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Auth | List active products (filter by `?group=`) |
| POST | `/` | Auth | Create product (omit `group` → pending) |
| GET | `/pending` | Admin | Pending products needing categorization |
| POST | `/:id/approve` | Admin | Approve + assign group |
| DELETE | `/:id` | Admin | Deactivate product |

**Add new pending product (sales rep flow):**
```json
POST /api/products
{ "name": "HP Ink X500" }
```
→ `isPending: true`, admins notified for categorization

---

### Inventory  `/api/inventory`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Auth | All stock records (state-filtered) |
| GET | `/alerts` | Auth | Only below-threshold items |
| PATCH | `/:id` | Auth | Update stock level |
| POST | `/:id/acknowledge-alert` | Auth | Clear alert flag |

**Update stock:**
```json
PATCH /api/inventory/:id
{ "currentStock": 15, "threshold": 10, "notes": "Replenished after reorder" }
```
Full history of changes is maintained in `inventory.history[]`.

---

### Notifications  `/api/notifications`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Auth | User's notifications (+ unread count) |
| PATCH | `/:id/read` | Auth | Mark one as read |
| PATCH | `/mark-all-read` | Auth | Mark all as read |

---

### Users  `/api/users`  *(Admin only)*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all active users |
| GET | `/:id` | Get user details |
| PATCH | `/:id` | Update user |
| PATCH | `/:id/states` | Update assigned states |
| DELETE | `/:id` | Deactivate user |

**Update state assignments:**
```json
PATCH /api/users/:id/states
{ "assignedStates": ["Maharashtra", "Karnataka", "Goa"] }
```

---

### Dashboard  `/api/dashboard`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/stats` | KPI counts + recent interactions |

---

## Key Design Decisions

### State-Based Filtering
The `applyStateFilter` middleware reads `user.assignedStates` and builds a MongoDB query filter:
```js
// Sales rep → only their states
req.stateFilter = { 'address.state': { $in: req.user.assignedStates } }
// Admin → no restriction
req.stateFilter = {}
```
Every customer list query merges this filter automatically. Sales reps physically cannot query customers outside their state — it's enforced at the query level, not just the UI.

### Approval Workflow
```
Sales Rep submits → status: "pending", isPending: true
                  → Admin notification created
Admin approves   → status: "active", isPending: false, approvedBy, approvedAt
                  → Salesperson notification created
Admin rejects    → status: "rejected", rejectionReason
                  → Salesperson notification created
```
Pending customers are visible only to their submitter and admins. Approved customers become visible to all reps in their state.

### Reminder Cron
Runs every minute. Finds interactions where:
- `nextAction.dueDate` is within the next `REMINDER_LEAD_MINUTES` minutes
- `nextAction.isCompleted = false`
- `nextAction.reminderSent = false`

Sends in-app `Notification` + email, then sets `reminderSent: true` to prevent duplicates.

### Inventory Auto-Alert
`Inventory.pre('save')` automatically sets `isBelowThreshold = currentStock <= threshold` on every save. Stock is upserted from interaction logs, keeping records current without manual entry.

### Soft Deletes
Customers are never hard-deleted. A `pre(/^find/)` middleware on the Customer model excludes `isDeleted: true` from all queries automatically. Only admins can set this flag.

---

## Connecting the Frontend

Add this to your frontend's API client (or `fetch` wrapper):

```js
const BASE = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

const api = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API error');
  return data;
};

// Login
const { token, data } = await api('POST', '/auth/login', { email, password });
localStorage.setItem('token', token);

// Get customers (auto state-filtered)
const { data } = await api('GET', '/customers?status=active&page=1&limit=20');

// Log interaction
await api('POST', '/interactions', { customer: id, callType: 'Follow-up', ... });
```

---

## Deploying to Production

1. **MongoDB Atlas** — Update `MONGODB_URI` in `.env`
2. **Environment** — Set `NODE_ENV=production`
3. **JWT Secret** — Use a 64+ character random string
4. **Frontend** — Build your frontend and place files in `public/`
5. **Process manager** — Use PM2: `pm2 start src/server.js --name salespulse-crm`
6. **Reverse proxy** — Nginx in front of Node on port 5000

```bash
# PM2 ecosystem file
pm2 start src/server.js --name salespulse-crm --watch
pm2 startup
pm2 save
```
