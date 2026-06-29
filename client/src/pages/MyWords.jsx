import { useEffect, useState } from 'react';
import WordModal from '../components/WordModal';

const FILTERS = ['All', 'Due Today', 'Mastered', 'Skipped', 'Custom'];
const DIFF_LABEL = { 1: 'Moderate', 2: 'Hard', 3: 'Very Hard' };

export default function MyWords() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);

  const loadWords = () => {
    setLoading(true);
    fetch('/api/words')
      .then(r => r.json())
      .then(data => {
        if (data.success) setWords(data.data);
        setLoading(false);
      });
  };

  useEffect(() => { loadWords(); }, []);

  const filtered = words.filter(w => {
    const q = search.toLowerCase();
    const matchSearch = !q || w.word.toLowerCase().includes(q) || w.definition.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (filter === 'Mastered') return w.mastered;
    if (filter === 'Skipped') return w.skipped;
    if (filter === 'Custom') return w.is_custom;
    if (filter === 'Due Today') return !w.mastered && !w.skipped && (!w.next_review || new Date(w.next_review) <= new Date());
    return true;
  });

  const handleDelete = async (id) => {
    if (!confirm('Delete this word?')) return;
    await fetch(`/api/words/${id}`, { method: 'DELETE' });
    loadWords();
    if (selected?.id === id) setSelected(null);
  };

  const handleMaster = async (id) => {
    await fetch(`/api/words/${id}/master`, { method: 'POST' });
    loadWords();
  };

  const handleSkip = async (id) => {
    await fetch(`/api/words/${id}/skip`, { method: 'POST' });
    loadWords();
  };

  const accuracy = (w) =>
    w.times_seen > 0 ? `${Math.round((w.times_correct / w.times_seen) * 100)}%` : '–';

  return (
    <>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h2>My Words</h2>
            <p>Browse, filter, and manage your vocabulary</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
            + Add Word
          </button>
        </div>
      </div>

      <div className="search-row">
        <input
          type="text"
          placeholder="Search words or definitions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '280px' }}
        />
        <div className="filter-tabs">
          {FILTERS.map(f => (
            <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--ink-faint)', fontStyle: 'italic', marginLeft: 'auto' }}>
          {filtered.length} word{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {selected && (
        <div className="word-detail mb-2">
          <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
            <h3>{selected.word}</h3>
            <button style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: '1.1rem' }} onClick={() => setSelected(null)}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <span className="badge">{selected.part_of_speech}</span>
            <span className={`badge badge-d${selected.difficulty}`}>{DIFF_LABEL[selected.difficulty]}</span>
            {selected.mastered && <span className="badge badge-mastered">Mastered</span>}
            {selected.skipped && <span className="badge badge-skipped">Skipped</span>}
            {selected.is_custom && <span className="badge badge-custom">Custom</span>}
          </div>
          <div style={{ fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '0.75rem' }}>{selected.definition}</div>
          {selected.example_sentence && (
            <div className="flashcard-example" style={{ marginBottom: '1rem' }}>"{selected.example_sentence}"</div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
            {[
              ['Times Seen', selected.times_seen],
              ['Correct', selected.times_correct],
              ['Incorrect', selected.times_incorrect],
              ['Accuracy', accuracy(selected)],
            ].map(([label, val]) => (
              <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-faint)', marginBottom: '0.2rem' }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-sc)', fontSize: '1.3rem' }}>{val}</div>
              </div>
            ))}
          </div>
          <div className="btn-group">
            {!selected.mastered && <button className="btn btn-sm" onClick={() => handleMaster(selected.id)}>Mark Mastered</button>}
            {!selected.skipped && <button className="btn btn-sm" onClick={() => handleSkip(selected.id)}>Skip Word</button>}
            {selected.is_custom && (
              <>
                <button className="btn btn-sm" onClick={() => { setEditing(selected); setShowModal(true); }}>Edit</button>
                <button className="btn btn-sm" style={{ borderColor: 'var(--incorrect)', color: 'var(--incorrect)' }} onClick={() => handleDelete(selected.id)}>Delete</button>
              </>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty-state"><p>Loading…</p></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Word</th>
                  <th>Definition</th>
                  <th>P.O.S.</th>
                  <th>Difficulty</th>
                  <th>Seen</th>
                  <th>Accuracy</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', fontStyle: 'italic', color: 'var(--ink-faint)' }}>No words found</td></tr>
                ) : filtered.map(w => (
                  <tr key={w.id} onClick={() => setSelected(w)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontStyle: 'italic', minWidth: '120px' }}>{w.word}</td>
                    <td style={{ maxWidth: '280px', color: 'var(--ink-muted)' }}>
                      {w.definition.length > 65 ? w.definition.slice(0, 65) + '…' : w.definition}
                    </td>
                    <td style={{ color: 'var(--ink-faint)', fontSize: '0.8rem' }}>{w.part_of_speech}</td>
                    <td><span className={`badge badge-d${w.difficulty}`}>{DIFF_LABEL[w.difficulty]}</span></td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-sc)', fontSize: '0.9rem' }}>{w.times_seen}</td>
                    <td style={{ textAlign: 'right' }}>{accuracy(w)}</td>
                    <td>
                      {w.mastered && <span className="badge badge-mastered">Mastered</span>}
                      {w.skipped && <span className="badge badge-skipped">Skipped</span>}
                      {w.is_custom && <span className="badge badge-custom">Custom</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <WordModal
          word={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); loadWords(); }}
        />
      )}
    </>
  );
}
