const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authMiddleware } = require('./middleware/auth');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const COMMISSION_RATE = 0.05;

router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { offer_id, amount } = req.body;
    const commission = Math.round(amount * COMMISSION_RATE);
    const { data: offer } = await supabase.from('offers').select('*').eq('id', offer_id).single();
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    if (offer.buyer_id !== req.user.userId) return res.status(403).json({ error: 'Only buyer can create escrow' });
    const { data, error } = await supabase.from('escrow').insert({ offer_id, buyer_id: offer.buyer_id, seller_id: offer.seller_id, listing_id: offer.listing_id, amount, commission, status: 'pending_payment' }).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data, commission, total: amount + commission });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/release', authMiddleware, async (req, res) => {
  try {
    const { data: escrow } = await supabase.from('escrow').select('*').eq('id', req.params.id).single();
    if (!escrow || escrow.buyer_id !== req.user.userId) return res.status(403).json({ error: 'Unauthorized' });
    if (escrow.status !== 'held') return res.status(400).json({ error: 'Not in held state' });
    const { data, error } = await supabase.from('escrow').update({ status: 'released', released_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error) throw error;
    await supabase.from('listings').update({ status: 'sold' }).eq('id', escrow.listing_id);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/dispute', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const { data: escrow } = awaroutes/escrow.jsit supabase.from('escrow').select('*').eq('id', req.params.id).single();
    if (!escrow || (escrow.buyer_id !== req.user.userId && escrow.seller_id !== req.user.userId)) return res.status(403).json({ error: 'Unauthorized' });
    const { data, error } = await supabase.from('escrow').update({ status: 'disputed', dispute_reason: reason }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const uid = req.user.userId;
    const { data, error } = await supabase.from('escrow').select('*, listings(title)').or('buyer_id.eq.' + uid + ',seller_id.eq.' + uid).order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
