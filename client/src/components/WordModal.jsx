import { useState } from 'react';

export default function WordModal({ word, onClose, onSaved }) {
  const [form, setForm] = useState({
    word: word?.word || '',
    definition: word?.definition || '',
    part_of_speech: word?.part_of_speech || 'noun',
    example_sentence: word?.example_sentence || '',
    difficulty: word?.difficulty || 1,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.word.trim() || !form.definition.trim()) {
      setError('Word and definition are required.');
      return;
    }
    setSaving(true);
    setError('');
    const url = word ? `/api/words/${word.id}` : '/api/words';
    const method = word ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(r => r.json());

    if (!res.success) {
      setError(res.error || 'Failed to save.');
      setSaving(false);
    } else {
      onSaved();
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{word ? 'Edit Word' : 'Add Custom Word'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Word *</label>
            <input type="text" value={form.word} onChange={e => set('word', e.target.value)} placeholder="e.g. perspicacious" />
          </div>

          <div className="form-group">
            <label className="form-label">Definition *</label>
            <textarea value={form.definition} onChange={e => set('definition', e.target.value)} placeholder="A clear, precise definition…" />
          </div>

          <div className="form-group">
            <label className="form-label">Part of Speech</label>
            <select value={form.part_of_speech} onChange={e => set('part_of_speech', e.target.value)}>
              {['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'interjection'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Example Sentence</label>
            <textarea value={form.example_sentence} onChange={e => set('example_sentence', e.target.value)} placeholder="An example sentence using the word…" style={{ minHeight: '60px' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Difficulty</label>
            <select value={form.difficulty} onChange={e => set('difficulty', parseInt(e.target.value))}>
              <option value={1}>1 — Moderate</option>
              <option value={2}>2 — Hard</option>
              <option value={3}>3 — Very Hard</option>
            </select>
          </div>

          {error && (
            <div style={{ color: 'var(--incorrect)', fontSize: '0.85rem', marginBottom: '0.75rem', fontStyle: 'italic' }}>
              {error}
            </div>
          )}

          <div className="btn-group">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : word ? 'Save Changes' : 'Add Word'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
