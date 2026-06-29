import { useEffect, useState, useCallback } from 'react';

export default function MultipleChoice() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchNext = useCallback(() => {
    setLoading(true);
    setSelected(null);
    fetch('/api/study/multiple-choice')
      .then(r => r.json())
      .then(res => {
        if (!res.success || !res.data || !res.data.word) setDone(true);
        else setData(res.data);
        setLoading(false);
      });
  }, []);

  useEffect(() => { fetchNext(); }, [fetchNext]);

  const handleSelect = async (option) => {
    if (selected || submitting) return;
    setSelected(option);
    setSubmitting(true);
    const correct = option.correct;
    await fetch('/api/study/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word_id: data.word.id, mode: 'multiple_choice', correct }),
    });
    setSessionTotal(t => t + 1);
    if (correct) setSessionCorrect(c => c + 1);
    setSubmitting(false);
  };

  const handleNext = () => fetchNext();

  if (done) return (
    <div className="empty-state">
      <div className="ornament">✦ ✦ ✦</div>
      <div style={{ fontFamily: 'var(--font-sc)', fontSize: '1.2rem', margin: '0.75rem 0 0.5rem' }}>
        Session Complete
      </div>
      <p className="text-muted">
        {sessionTotal > 0 ? `${sessionCorrect} correct of ${sessionTotal} answered` : 'No words available.'}
      </p>
      <button className="btn btn-primary mt-3" onClick={() => { setDone(false); setSessionCorrect(0); setSessionTotal(0); fetchNext(); }}>
        Start Again
      </button>
    </div>
  );

  const word = data?.word;
  const options = data?.options || [];

  return (
    <>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h2>Multiple Choice</h2>
            <p>Select the correct definition</p>
          </div>
          <div className="session-score">{sessionCorrect} / {sessionTotal}</div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading…</p></div>
      ) : word ? (
        <div className="card" style={{ maxWidth: '680px' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <span className={`badge badge-d${word.difficulty}`}>
              {word.difficulty === 1 ? 'Moderate' : word.difficulty === 2 ? 'Hard' : 'Very Hard'}
            </span>
            <span className="badge">{word.part_of_speech}</span>
          </div>

          <div style={{ fontFamily: 'var(--font-sc)', fontSize: '2rem', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            {word.word}
          </div>
          <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--ink-faint)', marginBottom: '0.5rem' }}>
            Which definition is correct?
          </div>

          <div className="mc-options">
            {options.map((opt, i) => {
              let cls = 'mc-option';
              if (selected) {
                if (opt.correct) cls += ' correct';
                else if (selected === opt) cls += ' incorrect';
              }
              return (
                <button
                  key={i}
                  className={cls}
                  onClick={() => handleSelect(opt)}
                  disabled={!!selected}
                >
                  <span style={{ color: 'var(--ink-faint)', marginRight: '0.5rem', fontFamily: 'var(--font-sc)', fontSize: '0.75rem' }}>
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {opt.definition}
                </button>
              );
            })}
          </div>

          {selected && (
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ padding: '0.75rem 1rem', background: selected.correct ? 'var(--correct-bg)' : 'var(--incorrect-bg)', border: `1px solid ${selected.correct ? 'var(--correct)' : 'var(--incorrect)'}`, borderRadius: 'var(--radius)', marginBottom: '0.75rem' }}>
                <div style={{ fontFamily: 'var(--font-sc)', fontSize: '0.8rem', letterSpacing: '0.06em', color: selected.correct ? 'var(--correct)' : 'var(--incorrect)', marginBottom: '0.25rem' }}>
                  {selected.correct ? '✓ Correct' : '✗ Incorrect'}
                </div>
                {word.example_sentence && (
                  <div style={{ fontStyle: 'italic', fontSize: '0.875rem', color: 'var(--ink-mid)' }}>
                    "{word.example_sentence}"
                  </div>
                )}
              </div>
              <button className="btn btn-primary" onClick={handleNext}>Next Word →</button>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
