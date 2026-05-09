const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authMiddleware } = require('./middleware/auth');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function sendSMS(phone, message) {
  try {
    const AT = require('africastalking');
    const at = AT({ apiKey: process.env.AT_API_KEY, username: process.env.AT_USERNAME });
    await at.SMS.send({ to: [phone], message });
    return true;
  } catch (err) { console.error('SMS error:', err.message); return false; }
}

router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ error: 'Phone and message required' });
    const sent = await sendSMS(phone, message);
    await supabase.from('sms_logs').insert({ phone, message, status: sent ? 'sent' : 'failed', sender_id: req.user.userId });
    res.json({ success: sent });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/bulk', authMiddleware, async (req, res) => {
  try {
    const { phones, message } = req.body;
    if (!phones || !phones.length || !message) return res.status(400).json({ error: 'Phones and message required' });
    const results = await Promise.all(phones.map(p => sendSMS(p, message)));
    const sent = results.filter(r => r).length;
    res.json({ success: true, total: phones.length, sent, failed: phones.length - sent });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
