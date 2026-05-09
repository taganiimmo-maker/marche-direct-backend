const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { authMiddleware } = require('./middleware/auth');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/analyze-listing', authMiddleware, async (req, res) => {
  try {
    const { title, description, price, category } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const prompt = 'Analyze listing for fraud. Title: ' + title + '. JSON only: { "fraud_score": 0-100, "risk_level": "low|medium|high", "flags": [], "recommendation": "approve|review|reject", "reason": "" }';
    const msg = await client.messages.create({ model: 'claude-haiku-4-5', max_tokens: 500, messages: [{ role: 'user', content: prompt }] });
    let analysis;
    try { const m = msg.content[0].text.match(/{[sS]*}/); analysis = m ? JSON.parse(m[0]) : { fraud_score: 0, risk_level: 'low', recommendation: 'approve' }; } catch (e) { analysis = { fraud_score: 0, risk_level: 'low', recommendation: 'approve' }; }
    res.json({ success: true, analysis });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    const resp = await client.messages.create({ model: 'claude-haiku-4-5', max_tokens: 1000, messages: [{ role: 'user', content: 'Assistant for Marche Direct Guinea marketplace. French or English. User: ' + message }] });
    res.json({ success: true, reply: resp.content[0].text });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
