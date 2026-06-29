const express = require('express');
const router = express.Router();
const db = require('../db');

function sm2Update(progress, correct) {
  let { interval_days, ease_factor, streak } = progress;
  interval_days = parseFloat(interval_days) || 1;
  ease_factor = parseFloat(ease_factor) || 2.5;
  streak = parseInt(streak) || 0;

  if (correct) {
    const new_interval = interval_days * ease_factor;
    ease_factor = Math.min(2.5, ease_factor + 0.1);
    streak = streak + 1;
    const next_review = new Date(Date.now() + new_interval * 86400000);
    const mastered = streak >= 5 && new_interval >= 21;
    return { interval_days: new_interval, ease_factor, streak, next_review, mastered };
  } else {
    const new_interval = 1;
    ease_factor = Math.max(1.3, ease_factor - 0.2);
    streak = 0;
    const next_review = new Date(Date.now() + 86400000);
    return { interval_days: new_interval, ease_factor, streak, next_review, mastered: false };
  }
}

async function getNextWord(mode) {
  // Prioritize due words, exclude mastered and skipped
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
    ORDER BY
      CASE WHEN p.next_review IS NULL OR p.next_review <= NOW() THEN 0 ELSE 1 END,
      p.next_review ASC NULLS FIRST,
      RANDOM()
    LIMIT 1
  `);
  return result.rows[0] || null;
}

// GET /api/study/flashcard
router.get('/flashcard', async (req, res) => {
  try {
    const word = await getNextWord('flashcard');
    if (!word) return res.json({ success: true, data: null });
    res.json({ success: true, data: word });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/study/multiple-choice
router.get('/multiple-choice', async (req, res) => {
  try {
    const word = await getNextWord('multiple_choice');
    if (!word) return res.json({ success: true, data: null });

    // Get 3 distractors from other words
    const distractors = await db.query(`
      SELECT id, definition FROM words
      WHERE id != $1
      ORDER BY RANDOM()
      LIMIT 3
    `, [word.id]);

    const options = [
      { id: word.id, definition: word.definition, correct: true },
      ...distractors.rows.map(d => ({ id: d.id, definition: d.definition, correct: false }))
    ].sort(() => Math.random() - 0.5);

    res.json({ success: true, data: { word, options } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/study/free-response
router.get('/free-response', async (req, res) => {
  try {
    const word = await getNextWord('free_response');
    if (!word) return res.json({ success: true, data: null });
    res.json({ success: true, data: word });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/study/answer
router.post('/answer', async (req, res) => {
  const { word_id, mode, correct, response_time_ms } = req.body;
  if (word_id == null || correct == null) {
    return res.status(400).json({ success: false, error: 'word_id and correct are required' });
  }
  try {
    // Fetch current progress
    const existing = await db.query(
      'SELECT * FROM user_progress WHERE word_id = $1', [word_id]
    );
    const prev = existing.rows[0] || { interval_days: 1, ease_factor: 2.5, streak: 0 };
    const update = sm2Update(prev, correct);

    await db.query(`
      INSERT INTO user_progress
        (word_id, times_seen, times_correct, times_incorrect, last_seen, next_review, interval_days, ease_factor, streak, mastered)
      VALUES ($1, 1, $2, $3, NOW(), $4, $5, $6, $7, $8)
      ON CONFLICT (word_id) DO UPDATE SET
        times_seen = user_progress.times_seen + 1,
        times_correct = user_progress.times_correct + $2,
        times_incorrect = user_progress.times_incorrect + $3,
        last_seen = NOW(),
        next_review = $4,
        interval_days = $5,
        ease_factor = $6,
        streak = $7,
        mastered = $8
    `, [
      word_id,
      correct ? 1 : 0,
      correct ? 0 : 1,
      update.next_review,
      update.interval_days,
      update.ease_factor,
      update.streak,
      update.mastered
    ]);

    res.json({ success: true, data: { ...update, word_id } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
