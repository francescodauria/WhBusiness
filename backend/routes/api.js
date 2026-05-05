const express = require('express');
const router  = express.Router();
const axios   = require('axios');
const { body, param, query, validationResult } = require('express-validator');
const { upsertContact, saveMessage, getContacts, getMessages, getStats } = require('../db/database');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

function whatsappApiUrl() {
  return `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v19.0'}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
}

// GET /api/stats
router.get('/stats', (req, res) => {
  res.json(getStats());
});

// GET /api/contacts
router.get('/contacts', (req, res) => {
  res.json(getContacts());
});

// GET /api/contacts/:id/messages
router.get(
  '/contacts/:id/messages',
  [
    param('id').isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('before').optional().isInt({ min: 0 }),
  ],
  validate,
  (req, res) => {
    const messages = getMessages(
      parseInt(req.params.id),
      req.query.limit  ? parseInt(req.query.limit)  : 50,
      req.query.before ? parseInt(req.query.before) : null,
    );
    res.json(messages);
  },
);

// POST /api/messages/send
router.post(
  '/messages/send',
  [
    body('phone').notEmpty().matches(/^\d{7,15}$/),
    body('message').notEmpty().isString().isLength({ max: 4096 }),
    body('name').optional().isString().isLength({ max: 100 }),
  ],
  validate,
  async (req, res) => {
    const { phone, message, name } = req.body;

    const payload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: message },
    };

    let wam_id = null;

    try {
      const response = await axios.post(whatsappApiUrl(), payload, {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      wam_id = response.data?.messages?.[0]?.id || null;
    } catch (err) {
      const detail = err.response?.data || err.message;
      console.error('[send] WhatsApp API error:', detail);
      return res.status(502).json({ error: 'Failed to send message via WhatsApp API', detail });
    }

    const contact = upsertContact(phone, name || null);
    saveMessage({
      wam_id,
      contact_id:  contact.id,
      direction:   'outbound',
      type:        'text',
      body:        message,
      status:      'sent',
      timestamp:   Math.floor(Date.now() / 1000),
      raw_payload: JSON.stringify(payload),
    });

    res.json({ success: true, wam_id, contact });
  },
);

// POST /api/contacts  (create/update a contact manually)
router.post(
  '/contacts',
  [
    body('phone').notEmpty().matches(/^\d{7,15}$/),
    body('name').optional().isString().isLength({ max: 100 }),
  ],
  validate,
  (req, res) => {
    const contact = upsertContact(req.body.phone, req.body.name || null);
    res.json(contact);
  },
);

module.exports = router;
