const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authMiddleware } = require('./middleware/auth');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', req.user.userId).single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { full_name, email, location, bio, avatar_url } = req.body;
    const { data, error } = await supabase.from('users').update({ full_name, email, location, bio, avatar_url, updated_at: new Date().toISOString() }).eq('id', req.user.userId).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('id, full_name, location, bio, avatar_url, created_at, role').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
