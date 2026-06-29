import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [dueWords, setDueWords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats/overview').then(r => r.json()),
      fetch('/api/words/due').then(r => r.json()),
    ]).then(([s, d]) => {
      if (s.success) setStats(s.data);
      if (d.success) setDueWords(d.data.slice(0, 5));
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="empty-state"><p>Loading…</p></div>;

  const masteredPct = stats ? Math.round((stats.mastered_count / stats.total_words) * 100) : 0;

  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Your progress at a glance</p>
      </div>

      <div className="card-grid card-grid-4 mb-2">
        <div className="stat-card">
          <div className="stat-label">Due Today</div>
          <div className="stat-value">{stats?.due_today ?? '–'}</div>
          <div className="stat-sub">words to review</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Mastered</div>
          <div className="stat-value">{stats?.mastered_count ?? '–'}</div>
          <div className="stat-sub">of {stats?.total_words} words</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Accuracy</div>
          <div className="stat-value">{stats?.accuracy_pct ?? '–'}%</div>
          <div className="stat-sub">overall correct</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Daily Streak</div>
          <div className="stat-value">{stats?.daily_streak ?? '–'}</div>
          <div className="stat-sub">consecutive days</div>
        </div>
      </div>

      {/* Mastery progress bar */}
      <div className="card mb-2">
        <div className="flex-between mb-1">
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-faint)' }}>
            Mastery Progress
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{masteredPct}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${masteredPct}%` }} />
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', marginTop: '0.5rem', fontStyle: 'italic' }}>
          {stats?.mastered_count} mastered · {(stats?.total_words ?? 0) - (stats?.mastered_count ?? 0)} remaining
        </div>
      </div>

      {/* Start review CTA */}
      {stats?.due_today > 0 && (
        <div className="card mb-2" style={{ borderLeft: '3px solid var(--accent-gold)' }}>
          <div className="flex-between">
            <div>
              <div style={{ fontFamily: 'var(--font-sc)', fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                {stats.due_today} {stats.due_today === 1 ? 'word' : 'words'} due for review
              </div>
              <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                Spaced repetition recommends reviewing these today
              </div>
            </div>
            <Link to="/flashcard" className="btn btn-primary">Start Review →</Link>
          </div>
        </div>
      )}

      {/* Due words preview */}
      {dueWords.length > 0 && (
        <div className="card">
          <div style={{ marginBottom: '0.75rem', fontFamily: 'var(--font-sc)', fontSize: '0.85rem', letterSpacing: '0.06em', color: 'var(--ink-muted)' }}>
            Upcoming Words
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {dueWords.map(w => (
              <div key={w.id} style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', padding: '0.4rem 0', borderBottom: '1px solid var(--bg-alt)' }}>
                <span style={{ fontStyle: 'italic', minWidth: '160px' }}>{w.word}</span>
                <span style={{ color: 'var(--ink-faint)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{w.part_of_speech}</span>
                <span style={{ color: 'var(--ink-muted)', fontSize: '0.85rem', fontStyle: 'italic', flex: 1 }}>
                  {w.definition.length > 70 ? w.definition.slice(0, 70) + '…' : w.definition}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <Link to="/words" className="btn btn-sm">View All Words →</Link>
          </div>
        </div>
      )}

      {stats?.due_today === 0 && (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div className="ornament">✦ ✦ ✦</div>
          <div style={{ fontFamily: 'var(--font-sc)', fontSize: '1.1rem', margin: '0.75rem 0 0.5rem' }}>
            All caught up for today
          </div>
          <p className="text-muted">No words are due for review. Explore a study mode below.</p>
          <div className="btn-group mt-2" style={{ justifyContent: 'center' }}>
            <Link to="/flashcard" className="btn">Flashcards</Link>
            <Link to="/multiple-choice" className="btn">Multiple Choice</Link>
            <Link to="/free-response" className="btn">Free Response</Link>
          </div>
        </div>
      )}
    </>
  );
}
