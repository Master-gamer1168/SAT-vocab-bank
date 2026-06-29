const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/stats/overview
router.get('/overview', async (req, res) => {
  try {
    const [total, mastered, due, accuracy] = await Promise.all([
      db.query('SELECT COUNT(*) FROM words'),
      db.query("SELECT COUNT(*) FROM user_progress WHERE mastered = true"),
      db.query(`
        SELECT COUNT(*) FROM words w
        LEFT JOIN user_progress p ON p.word_id = w.id
        WHERE COALESCE(p.mastered, false) = false
          AND COALESCE(p.skipped, false) = false
          AND (p.next_review IS NULL OR p.next_review <= NOW())
      `),
      db.query(`
        SELECT
          COALESCE(SUM(times_correct), 0) AS correct,
          COALESCE(SUM(times_correct) + SUM(times_incorrect), 0) AS total
        FROM user_progress
      `)
    ]);

    const acc = accuracy.rows[0];
    const accuracyPct = acc.total > 0 ? Math.round((acc.correct / acc.total) * 100) : 0;

    // Daily streak: count consecutive days with at least one answer
    const streakResult = await db.query(`
      SELECT DATE(last_seen) AS day
      FROM user_progress
      WHERE last_seen IS NOT NULL
      GROUP BY DATE(last_seen)
      ORDER BY day DESC
    `);
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < streakResult.rows.length; i++) {
      const day = new Date(streakResult.rows[i].day);
      day.setHours(0, 0, 0, 0);
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      if (day.getTime() === expected.getTime()) streak++;
      else break;
    }

    res.json({
      success: true,
      data: {
        total_words: parseInt(total.rows[0].count),
        mastered_count: parseInt(mastered.rows[0].count),
        due_today: parseInt(due.rows[0].count),
        accuracy_pct: accuracyPct,
        daily_streak: streak
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/stats/history — last 30 quiz sessions
router.get('/history', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM quiz_sessions
      ORDER BY started_at DESC
      LIMIT 30
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/stats/word/:id
router.get('/word/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM user_progress WHERE word_id = $1', [req.params.id]
    );
    res.json({ success: true, data: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
