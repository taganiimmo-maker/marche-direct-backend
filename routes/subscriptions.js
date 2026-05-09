const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authMiddleware } = require('./middleware/auth');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const PLANS = {
  free: { name: 'Free', max_listings: 3, price_gnf: 0 },
  basic: { name: 'Basic', max_listings: 20, price_gnf: 50000 },
  pro: { name: 'Pro', max_listings: 100, price_gnf: 150000 },
  enterprise: { name: 'Enterprise', max_listings: -1, price_gnf: 500000 }
};

router.get('/plans', (req, res) => res.json({ success: true, plans: PLANS }));

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', req.user.userId).order('created_at', { ascending: false }).limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    res.json({ success: true, subscription: data || { plan: 'free', status: 'active' } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const { data, error } = await supabase.from('subscriptions').upsert({ user_id: req.user.userId, plan, status: 'active', expires_at: expiresAt.toISOString(), price_paid: PLANS[plan].price_gnf }, { onConflict: 'user_id' }).select().single();
    if (error) throw error;
    res.json({ success: true, data, plan: PLANS[plan] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
