const express = require('express');
const router  = express.Router();
const { upsertContact, saveMessage, updateMessageStatus } = require('../db/database');

/**
 * GET /webhook
 * Meta webhook verification handshake
 */
router.get('/', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('[webhook] Verification successful');
    // Send back the challenge as plain text to prevent any reflected XSS
    res.set('Content-Type', 'text/plain');
    return res.status(200).send(String(challenge));
  }
  console.warn('[webhook] Verification failed');
  res.sendStatus(403);
});

/**
 * POST /webhook
 * Handle incoming WhatsApp events
 */
router.post('/', (req, res) => {
  const body = req.body;

  if (body.object !== 'whatsapp_business_account') {
    return res.sendStatus(404);
  }

  try {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;

        // ---- incoming messages ----
        for (const msg of value.messages || []) {
          const phone   = msg.from;
          const profile = (value.contacts || []).find(c => c.wa_id === phone);
          const name    = profile?.profile?.name || null;

          const contact = upsertContact(phone, name);

          const text = msg.type === 'text' ? msg.text?.body
                     : msg.type === 'image'    ? '[Image]'
                     : msg.type === 'audio'    ? '[Audio]'
                     : msg.type === 'video'    ? '[Video]'
                     : msg.type === 'document' ? '[Document]'
                     : msg.type === 'sticker'  ? '[Sticker]'
                     : msg.type === 'location' ? '[Location]'
                     : msg.type === 'contacts' ? '[Contact card]'
                     : '[Unsupported message]';

          saveMessage({
            wam_id:      msg.id,
            contact_id:  contact.id,
            direction:   'inbound',
            type:        msg.type,
            body:        text,
            status:      'received',
            timestamp:   parseInt(msg.timestamp, 10),
            raw_payload: JSON.stringify(msg),
          });

          console.log(`[webhook] Inbound from ${phone}: ${text}`);
        }

        // ---- status updates ----
        for (const status of value.statuses || []) {
          updateMessageStatus(status.id, status.status);
          console.log(`[webhook] Status update ${status.id} → ${status.status}`);
        }
      }
    }
  } catch (err) {
    console.error('[webhook] Error processing payload:', err);
  }

  // Always respond 200 to acknowledge receipt
  res.sendStatus(200);
});

module.exports = router;
