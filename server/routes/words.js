const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/words — all words with progress joined
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT w.*,
        COALESCE(p.times_seen, 0) AS times_seen,
        COALESCE(p.times_correct, 0) AS times_correct,
        COALESCE(p.times_incorrect, 0) AS times_incorrect,
        COALESCE(p.mastered, false) AS mastered,
        COALESCE(p.skipped, false) AS skipped,
        p.last_seen,
        p.next_review,
        COALESCE(p.interval_days, 1) AS interval_days,
        COALESCE(p.ease_factor, 2.5) AS ease_factor,
        COALESCE(p.streak, 0) AS streak
      FROM words w
      LEFT JOIN user_progress p ON p.word_id = w.id
      ORDER BY w.word ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/words/due — words due for review today
router.get('/due', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT w.*,
        COALESCE(p.times_seen, 0) AS times_seen,
        COALESCE(p.times_correct, 0) AS times_correct,
        COALESCE(p.times_incorrect, 0) AS times_incorrect,
        COALESCE(p.mastered, false) AS mastered,
        COALESCE(p.skipped, false) AS skipped,
        p.next_review,
        COALESCE(p.interval_days, 1) AS interval_days,
        COALESCE(p.ease_factor, 2.5) AS ease_factor,
        COALESCE(p.streak, 0) AS streak
      FROM words w
      LEFT JOIN user_progress p ON p.word_id = w.id
      WHERE COALESCE(p.mastered, false) = false
        AND COALESCE(p.skipped, false) = false
        AND (p.next_review IS NULL OR p.next_review <= NOW())
      ORDER BY p.next_review ASC NULLS FIRST
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/words/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT w.*,
        COALESCE(p.times_seen, 0) AS times_seen,
        COALESCE(p.times_correct, 0) AS times_correct,
        COALESCE(p.times_incorrect, 0) AS times_incorrect,
        COALESCE(p.mastered, false) AS mastered,
        COALESCE(p.skipped, false) AS skipped,
        p.last_seen, p.next_review,
        COALESCE(p.interval_days, 1) AS interval_days,
        COALESCE(p.ease_factor, 2.5) AS ease_factor,
        COALESCE(p.streak, 0) AS streak
      FROM words w
      LEFT JOIN user_progress p ON p.word_id = w.id
      WHERE w.id = $1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Word not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/words — add custom word
router.post('/', async (req, res) => {
  const { word, definition, part_of_speech, example_sentence, difficulty } = req.body;
  if (!word || !definition) return res.status(400).json({ success: false, error: 'word and definition required' });
  try {
    const result = await db.query(`
      INSERT INTO words (word, definition, part_of_speech, example_sentence, difficulty, is_custom)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `, [word, definition, part_of_speech || null, example_sentence || null, difficulty || 1]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, error: 'Word already exists' });
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/words/:id — edit a word
router.put('/:id', async (req, res) => {
  const { word, definition, part_of_speech, example_sentence, difficulty } = req.body;
  try {
    const result = await db.query(`
      UPDATE words SET word=$1, definition=$2, part_of_speech=$3, example_sentence=$4, difficulty=$5
      WHERE id=$6 RETURNING *
    `, [word, definition, part_of_speech, example_sentence, difficulty, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Word not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/words/:id — only custom words
router.delete('/:id', async (req, res) => {
  try {
    const check = await db.query('SELECT is_custom FROM words WHERE id=$1', [req.params.id]);
    if (!check.rows.length) return res.status(404).json({ success: false, error: 'Word not found' });
    if (!check.rows[0].is_custom) return res.status(403).json({ success: false, error: 'Cannot delete seeded words' });
    await db.query('DELETE FROM words WHERE id=$1', [req.params.id]);
    res.json({ success: true, data: null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/words/:id/master
router.post('/:id/master', async (req, res) => {
  try {
    await db.query(`
      INSERT INTO user_progress (word_id, mastered, times_seen)
      VALUES ($1, true, 0)
      ON CONFLICT (word_id) DO UPDATE SET mastered = true
    `, [req.params.id]);
    res.json({ success: true, data: null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/words/:id/skip
router.post('/:id/skip', async (req, res) => {
  try {
    await db.query(`
      INSERT INTO user_progress (word_id, skipped, times_seen)
      VALUES ($1, true, 0)
      ON CONFLICT (word_id) DO UPDATE SET skipped = true
    `, [req.params.id]);
    res.json({ success: true, data: null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
