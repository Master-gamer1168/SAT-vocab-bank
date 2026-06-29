import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#5c3d1e', '#a07c3a', '#c8bfa8'];

export default function Stats() {
  const [overview, setOverview] = useState(null);
  const [history, setHistory] = useState([]);
  const [allWords, setAllWords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats/overview').then(r => r.json()),
      fetch('/api/stats/history').then(r => r.json()),
      fetch('/api/words').then(r => r.json()),
    ]).then(([ov, hist, words]) => {
      if (ov.success) setOverview(ov.data);
      if (hist.success) setHistory(hist.data);
      if (words.success) setAllWords(words.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="empty-state"><p>Loading…</p></div>;

  // Build bar chart data (last 14 days sessions grouped by day)
  const sessionsByDay = {};
  history.forEach(s => {
    const day = new Date(s.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!sessionsByDay[day]) sessionsByDay[day] = { day, correct: 0, total: 0 };
    sessionsByDay[day].correct += s.correct_answers || 0;
    sessionsByDay[day].total += s.total_questions || 0;
  });
  const barData = Object.values(sessionsByDay).slice(-14);

  // Pie chart data
  const mastered = allWords.filter(w => w.mastered).length;
  const started = allWords.filter(w => !w.mastered && w.times_seen > 0).length;
  const notStarted = allWords.filter(w => !w.mastered && w.times_seen === 0).length;
  const pieData = [
    { name: 'Mastered', value: mastered },
    { name: 'Learning', value: started },
    { name: 'Not Started', value: notStarted },
  ];

  // Hardest words (lowest accuracy, min 3 attempts)
  const hardest = [...allWords]
    .filter(w => w.times_seen >= 3)
    .map(w => ({ ...w, acc: w.times_seen > 0 ? w.times_correct / w.times_seen : 0 }))
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 10);

  return (
    <>
      <div className="page-header">
        <h2>Statistics</h2>
        <p>Your study history and performance</p>
      </div>

      <div className="card-grid card-grid-4 mb-2">
        {[
          ['Total Words', overview?.total_words],
          ['Mastered', overview?.mastered_count],
          ['Due Today', overview?.due_today],
          ['Accuracy', `${overview?.accuracy_pct}%`],
        ].map(([label, val]) => (
          <div key={label} className="stat-card">
            <div className="stat-label">{label}</div>
            <div className="stat-value">{val ?? '–'}</div>
          </div>
        ))}
      </div>

      <div className="card-grid card-grid-2 mb-2">
        {/* Bar chart */}
        <div className="card">
          <div style={{ fontFamily: 'var(--font-sc)', fontSize: '0.8rem', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: '1rem' }}>
            Quiz Scores — Last 14 Days
          </div>
          {barData.length === 0 ? (
            <div className="text-muted" style={{ padding: '1rem 0', fontSize: '0.85rem' }}>No quiz sessions recorded yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--ink-faint)', fontFamily: 'Times New Roman' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--ink-faint)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', fontFamily: 'Times New Roman', fontSize: '0.8rem' }}
                  formatter={(val, name) => [val, name === 'correct' ? 'Correct' : 'Total']}
                />
                <Bar dataKey="correct" fill="var(--correct)" radius={[1,1,0,0]} />
                <Bar dataKey="total" fill="var(--border)" radius={[1,1,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="card">
          <div style={{ fontFamily: 'var(--font-sc)', fontSize: '0.8rem', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: '1rem' }}>
            Vocabulary Status
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend
                wrapperStyle={{ fontFamily: 'Times New Roman', fontSize: '0.78rem', color: 'var(--ink-muted)' }}
              />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', fontFamily: 'Times New Roman', fontSize: '0.8rem' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hardest words */}
      {hardest.length > 0 && (
        <div className="card mb-2">
          <div style={{ fontFamily: 'var(--font-sc)', fontSize: '0.8rem', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: '1rem' }}>
            Most Challenging Words
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Word</th>
                  <th>P.O.S.</th>
                  <th>Attempts</th>
                  <th>Correct</th>
                  <th>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {hardest.map(w => (
                  <tr key={w.id}>
                    <td style={{ fontStyle: 'italic' }}>{w.word}</td>
                    <td style={{ color: 'var(--ink-faint)', fontSize: '0.8rem' }}>{w.part_of_speech}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-sc)' }}>{w.times_seen}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-sc)' }}>{w.times_correct}</td>
                    <td style={{ textAlign: 'right', color: w.acc < 0.5 ? 'var(--incorrect)' : 'var(--ink-mid)' }}>
                      {Math.round(w.acc * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent sessions */}
      {history.length > 0 && (
        <div className="card">
          <div style={{ fontFamily: 'var(--font-sc)', fontSize: '0.8rem', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: '1rem' }}>
            Recent Sessions
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Mode</th>
                  <th>Score</th>
                  <th>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 20).map(s => (
                  <tr key={s.id}>
                    <td>{new Date(s.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</td>
                    <td style={{ fontStyle: 'italic', color: 'var(--ink-muted)' }}>{s.mode?.replace('_', ' ')}</td>
                    <td style={{ fontFamily: 'var(--font-sc)' }}>{s.correct_answers}/{s.total_questions}</td>
                    <td>{s.total_questions > 0 ? `${Math.round((s.correct_answers / s.total_questions) * 100)}%` : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
