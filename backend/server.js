require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

const webhookRoutes = require('./routes/webhook');
const apiRoutes     = require('./routes/api');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Raw body for webhook signature verification (future-proof)
app.use('/webhook', express.raw({ type: 'application/json' }), (req, _res, next) => {
  if (Buffer.isBuffer(req.body)) req.body = JSON.parse(req.body.toString());
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/webhook', webhookRoutes);
app.use('/api',     apiRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] Running on http://localhost:${PORT}`);
  console.log(`[server] Webhook endpoint: POST http://localhost:${PORT}/webhook`);
  if (!process.env.WHATSAPP_ACCESS_TOKEN)    console.warn('[server] ⚠  WHATSAPP_ACCESS_TOKEN not set');
  if (!process.env.WHATSAPP_PHONE_NUMBER_ID) console.warn('[server] ⚠  WHATSAPP_PHONE_NUMBER_ID not set');
  if (!process.env.WEBHOOK_VERIFY_TOKEN)     console.warn('[server] ⚠  WEBHOOK_VERIFY_TOKEN not set');
});

module.exports = app;
