require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: [process.env.FRONTEND_URL, 'http://localhost:3000'], credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'Marche Direct API' }));
app.get('/test', (req, res) => res.json({ message: 'Backend working!', time: new Date() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/escrow', require('./routes/escrow'));

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => console.log('Marche Direct API on port ' + PORT));
