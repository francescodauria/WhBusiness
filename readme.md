# WhBusiness – WhatsApp Business Dashboard

A full-stack dashboard to send and receive WhatsApp messages via **Meta's WhatsApp Business Cloud API**.

---

## Features

| Feature | Details |
|---|---|
| 📊 **Dashboard** | Real-time stats: total contacts, messages, today's activity |
| 💬 **Conversations** | Chat UI – send & receive messages per contact |
| 📥 **Webhook** | Receives inbound messages from Meta in real time |
| 📤 **Send API** | Sends text messages via WhatsApp Business Cloud API |
| 👥 **Contacts** | Auto-created on first inbound; searchable list |
| 💾 **Storage** | SQLite (via Node.js built-in `node:sqlite`) – no external DB needed |
| 🐳 **Docker** | Full Docker Compose setup for production |

---

## Tech Stack

- **Backend**: Node.js 22+ · Express · node:sqlite
- **Frontend**: React 18 · Vite · React Router · CSS Modules

---

## Prerequisites

1. A **Meta Business Account** with access to [Meta for Developers](https://developers.facebook.com/)
2. A **WhatsApp Business App** with a phone number configured
3. Node.js ≥ 22 (built-in `node:sqlite`)

---

## Quick Start (Local Dev)

```bash
# 1. Clone and install
git clone <repo>
cd WhBusiness

# Install root dev tools
npm install

# Install backend
cd backend && npm install && cd ..

# Install frontend
cd frontend && npm install && cd ..

# 2. Configure the backend
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials (see below)

# 3. Run both services concurrently
npm run dev
# Backend:  http://localhost:4000
# Frontend: http://localhost:5173
```

---

## Environment Variables (`backend/.env`)

| Variable | Description |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Permanent system user token from Meta Developer portal |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone Number ID (not the phone number itself) |
| `WHATSAPP_API_VERSION` | Graph API version (default: `v19.0`) |
| `WEBHOOK_VERIFY_TOKEN` | Secret string – must match what you enter in Meta's webhook config |
| `PORT` | Backend HTTP port (default: `4000`) |
| `FRONTEND_ORIGIN` | Frontend URL for CORS (default: `http://localhost:5173`) |

---

## Webhook Setup (Meta Developer Portal)

1. Go to your App → **WhatsApp → Configuration**
2. Set **Callback URL** to `https://<your-domain>/webhook`
3. Set **Verify Token** to the same value as `WEBHOOK_VERIFY_TOKEN`
4. Subscribe to: `messages`, `message_deliveries`, `message_reads`

> **Local testing**: expose the backend with `npx ngrok http 4000` and use the HTTPS URL.

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/webhook` | Meta verification handshake |
| `POST` | `/webhook` | Inbound messages & status updates |
| `GET` | `/api/stats` | Dashboard statistics |
| `GET` | `/api/contacts` | List all contacts |
| `POST` | `/api/contacts` | Create/update a contact |
| `GET` | `/api/contacts/:id/messages` | Conversation messages |
| `POST` | `/api/messages/send` | Send a message |

### Send a message

```json
POST /api/messages/send
{
  "phone": "393401234567",
  "message": "Ciao! 👋",
  "name": "Mario Rossi"
}
```

---

## Docker Compose (Production)

```bash
cp backend/.env.example backend/.env
# Edit backend/.env

docker compose up -d
# Frontend: http://localhost:80
# Backend:  http://localhost:4000
```

---

## Project Structure

```
WhBusiness/
├── backend/
│   ├── db/
│   │   └── database.js     # SQLite helpers (node:sqlite)
│   ├── routes/
│   │   ├── api.js          # REST API routes
│   │   └── webhook.js      # WhatsApp webhook handler
│   ├── server.js           # Express server entry point
│   ├── .env.example        # Environment variable template
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/     # ChatPanel, ContactsList, Sidebar
│   │   ├── context/        # ContactsContext
│   │   ├── pages/          # Dashboard, ChatPage, Settings
│   │   ├── api.js          # Axios API client
│   │   └── App.jsx
│   ├── nginx.conf          # Nginx config for production
│   └── Dockerfile
├── docker-compose.yml
└── readme.md
```
