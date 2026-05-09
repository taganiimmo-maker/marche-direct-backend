const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authMiddleware } = require('./middleware/auth');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const [usersRes, listingsRes, escrowRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('escrow').select('amount').eq('status', 'released')
    ]);
    const totalRevenue = (escrowRes.data || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    res.json({ success: true, data: { total_users: usersRes.count || 0, active_listings: listingsRes.count || 0, total_revenue_gnf: totalRevenue } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/my-stats', authMiddleware, async (req, res) => {
  try {
    const uid = req.user.userId;
    const [listingsRes, offersRes, salesRes] = await Promise.all([
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('seller_id', uid),
      supabase.from('offers').select('id', { count: 'exact', head: true }).eq('buyer_id', uid),
      supabase.from('escrow').select('amount').eq('seller_id', uid).eq('status', 'released')
    ]);
    const earnings = (salesRes.data || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    res.json({ success: true, data: { my_listings: listingsRes.count || 0, my_offers: offersRes.count || 0, total_earnings_gnf: earnings } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
