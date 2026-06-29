require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const wordsRouter = require('./routes/words');
const studyRouter = require('./routes/study');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/words', wordsRouter);
app.use('/api/study', studyRouter);
app.use('/api/stats', statsRouter);

// Serve the built React frontend
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: err.message });
});

app.listen(PORT, () => {
  console.log(`SAT Vocab app running on http://localhost:${PORT}`);
});
