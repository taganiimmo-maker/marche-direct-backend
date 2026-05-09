const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authMiddleware } = require('./middleware/auth');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

router.post('/orange-money/initiate', authMiddleware, async (req, res) => {
  try {
    const { escrow_id, phone, amount } = req.body;
    if (!escrow_id || !phone || !amount) return res.status(400).json({ error: 'Required fields missing' });
    const reference = 'MD-OM-' + Date.now();
    res.json({ success: true, reference, amount, phone, instructions: 'Dial *144# and confirm with ref: ' + reference });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/orange-money/confirm', authMiddleware, async (req, res) => {
  try {
    const { escrow_id, reference } = req.body;
    const { data, error } = await supabase.from('escrow').update({ status: 'held', payment_reference: reference, payment_method: 'orange_money', paid_at: new Date().toISOString() }).eq('id', escrow_id).select().single();
    if (error) throw error;
    res.json({ success: true, data, message: 'Payment confirmed. Funds held in escrow.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/mtn-momo/initiate', authMiddleware, async (req, res) => {
  try {routes/payments.js
    const { escrow_id, phone, amount } = req.body;
    if (!escrow_id || !phone || !amount) return res.status(400).json({ error: 'Required fields missing' });
    const reference = 'MD-MTN-' + Date.now();
    res.json({ success: true, reference, amount, phone });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/mtn-momo/confirm', authMiddleware, async (req, res) => {
  try {
    const { escrow_id, reference } = req.body;
    const { data, error } = await supabase.from('escrow').update({ status: 'held', payment_reference: reference, payment_method: 'mtn_momo', paid_at: new Date().toISOString() }).eq('id', escrow_id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
