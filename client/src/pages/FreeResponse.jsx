import { useEffect, useState, useCallback, useRef } from 'react';

export default function FreeResponse() {
  const [word, setWord] = useState(null);
  const [response, setResponse] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [done, setDone] = useState(false);
  const textareaRef = useRef(null);

  const fetchNext = useCallback(() => {
    setLoading(true);
    setResponse('');
    setRevealed(false);
    fetch('/api/study/free-response')
      .then(r => r.json())
      .then(data => {
        if (!data.success || !data.data) setDone(true);
        else setWord(data.data);
        setLoading(false);
        setTimeout(() => textareaRef.current?.focus(), 100);
      });
  }, []);

  useEffect(() => { fetchNext(); }, [fetchNext]);

  const handleReveal = () => setRevealed(true);

  const handleAnswer = async (correct) => {
    await fetch('/api/study/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word_id: word.id, mode: 'free_response', correct }),
    });
    setSessionTotal(t => t + 1);
    if (correct) setSessionCorrect(c => c + 1);
    fetchNext();
  };

  if (done) return (
    <div className="empty-state">
      <div className="ornament">✦ ✦ ✦</div>
      <div style={{ fontFamily: 'var(--font-sc)', fontSize: '1.2rem', margin: '0.75rem 0 0.5rem' }}>
        Session Complete
      </div>
      <p className="text-muted">
        {sessionTotal > 0 ? `${sessionCorrect} self-reported correct of ${sessionTotal} attempted` : 'No words available.'}
      </p>
      <button className="btn btn-primary mt-3" onClick={() => { setDone(false); setSessionCorrect(0); setSessionTotal(0); fetchNext(); }}>
        Start Again
      </button>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h2>Free Response</h2>
            <p>Write your own definition, then reveal the correct one</p>
          </div>
          <div className="session-score">{sessionCorrect} / {sessionTotal}</div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading…</p></div>
      ) : word ? (
        <div style={{ maxWidth: '620px' }}>
          <div className="card mb-2">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <span className={`badge badge-d${word.difficulty}`}>
                {word.difficulty === 1 ? 'Moderate' : word.difficulty === 2 ? 'Hard' : 'Very Hard'}
              </span>
              <span className="badge">{word.part_of_speech}</span>
            </div>

            <div style={{ fontFamily: 'var(--font-sc)', fontSize: '2.4rem', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              {word.word}
            </div>
            <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--ink-faint)', marginBottom: '1.25rem' }}>
              Write your definition below, then check your answer
            </div>

            <div className="form-group">
              <label className="form-label">Your Definition</label>
              <textarea
                ref={textareaRef}
                className="free-response-input"
                value={response}
                onChange={e => setResponse(e.target.value)}
                placeholder="Enter your definition here…"
                disabled={revealed}
              />
            </div>

            {!revealed ? (
              <button
                className="btn btn-primary"
                onClick={handleReveal}
                disabled={!response.trim()}
              >
                Reveal Definition
              </button>
            ) : (
              <>
                <div style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)', padding: '1rem 1.25rem', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                  <div style={{ fontFamily: 'var(--font-sc)', fontSize: '0.72rem', letterSpacing: '0.1em', color: 'var(--ink-faint)', marginBottom: '0.4rem' }}>
                    Correct Definition
                  </div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--ink)', lineHeight: 1.65 }}>{word.definition}</div>
                  {word.example_sentence && (
                    <div style={{ fontStyle: 'italic', fontSize: '0.875rem', color: 'var(--ink-muted)', marginTop: '0.75rem', borderLeft: '2px solid var(--border-dark)', paddingLeft: '0.75rem' }}>
                      "{word.example_sentence}"
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
                  Compare with your answer honestly — only you can judge.
                </div>
                <div className="btn-group">
                  <button className="btn btn-incorrect" onClick={() => handleAnswer(false)}>
                    ✗ &nbsp;I Was Wrong
                  </button>
                  <button className="btn btn-correct" onClick={() => handleAnswer(true)}>
                    ✓ &nbsp;I Was Right
                  </button>
                </div>
              </>
            )}
          </div>

          {word.times_seen > 0 && (
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', fontStyle: 'italic', textAlign: 'center' }}>
              Seen {word.times_seen} time{word.times_seen !== 1 ? 's' : ''} ·{' '}
              {word.times_seen > 0 ? `${Math.round((word.times_correct / word.times_seen) * 100)}% correct` : ''}
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
