const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authMiddleware } = require('./middleware/auth');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { listing_id, amount, message } = req.body;
    if (!listing_id || !amount) return res.status(400).json({ error: 'Listing ID and amount required' });
    const { data: listing } = await supabase.from('listings').select('seller_id').eq('id', listing_id).single();
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.seller_id === req.user.userId) return res.status(400).json({ error: 'Cannot offer on own listing' });
    const { data, error } = await supabase.from('offers').insert({ listing_id, buyer_id: req.user.userId, seller_id: listing.seller_id, amount, message, status: 'pending' }).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const uid = req.user.userId;
    const { data, error } = await supabase.from('offers').select('*, listings(title, price)').or('buyer_id.eq.' + uid + ',seller_id.eq.' + uid);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const { data: offer } = await supabase.from('offers').select('*').eq('id', req.params.id).single();
    if (!offer || offer.seller_id !== req.user.userId) return res.status(403).json({ error: 'Unauthorized' });
    const { data, error } = await supabase.from('offers').update({ status: 'accepted' }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/reject', authMiddleware, async (req, res) => {
  try {
    const { data: offer } = await supabase.from('offers').select('seller_id').eq('id', req.params.id).single();
    if (!offer || offer.seller_id !== req.user.userId) return res.status(403).json({ error: 'Unauthorized' });
    await supabase.from('offers').update({ status: 'rejected' }).eq('id', req.params.id);
    res.json({ success: true, message: 'Offer rejected' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
