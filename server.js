require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
      res.json({ ok: true, time: new Date(), service: 'Marche Direct API' });
});

app.get('/test', (req, res) => {
      res.json({ message: 'Backend working!' });
});

app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
      console.log('Marche Direct API running on port ' + PORT);
});
