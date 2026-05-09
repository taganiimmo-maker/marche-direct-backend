const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendSMS(phone, message) {
  try {
    const AT = require('africastalking');
    const at = AT({ apiKey: process.env.AT_API_KEY, username: process.env.AT_USERNAME });
    const sms = at.SMS;
    await sms.send({ to: [phone], message, from: process.env.AT_SENDER_ID || 'MARCHEDIRECT' });
    return true;
  } catch (err) {
    console.error('SMS error:', err.message);
    return false;
  }
}

router.post('/request-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await supabase.from('otps').upsert({ phone, otp, expires_at: expiresAt.toISOString(), used: false }, { onConflict: 'phone' });
    await sendSMS(phone, 'Marche Direct: Votre code est ' + otp + '. Valide 10 min.');
    res.json({ success: true, message: 'OTP sent', debug: process.env.NODE_ENV === 'development' ? otp : undefined });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });
    const { data: otpRecord } = await supabase.from('otps').select('*').eq('phone', phone).eq('otp', otp).eq('used', false).single();
    if (!otpRecord) return res.status(400).json({ error: 'Invalid OTP' });
    if (new Date(otpRecord.expires_at) < new Date()) return res.status(400).json({ error: 'OTP expired' });
    await supabase.from('otps').update({ used: true }).eq('phone', phone);
    let { data: user } = await supabase.from('users').select('*').eq('phone', phone).single();
    if (!user) {
      const { data: newUser } = await supabase.from('users').insert({ phone, role: 'buyer', is_verified: true }).select().single();
      user = newUser;
    }
    const token = jwt.sign({ userId: user.id, phone: user.phone, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
