require('dotenv').config();
const express = require('express');
const cors = require('cors');

const wordsRouter = require('./routes/words');
const studyRouter = require('./routes/study');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/words', wordsRouter);
app.use('/api/study', studyRouter);
app.use('/api/stats', statsRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: err.message });
});

app.listen(PORT, () => {
  console.log(`SAT Vocab API running on http://localhost:${PORT}`);
});
