import { useEffect, useState, useCallback } from 'react';

export default function Flashcard() {
  const [word, setWord] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [answering, setAnswering] = useState(false);

  const fetchNext = useCallback(() => {
    setLoading(true);
    setFlipped(false);
    fetch('/api/study/flashcard')
      .then(r => r.json())
      .then(data => {
        if (!data.success || !data.data) setDone(true);
        else setWord(data.data);
        setLoading(false);
      });
  }, []);

  useEffect(() => { fetchNext(); }, [fetchNext]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === ' ') { e.preventDefault(); setFlipped(f => !f); }
      if (e.key === 'ArrowRight' && flipped && !answering) handleAnswer(true);
      if (e.key === 'ArrowLeft' && flipped && !answering) handleAnswer(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flipped, word, answering]);

  const handleAnswer = async (correct) => {
    if (!word || answering) return;
    setAnswering(true);
    await fetch('/api/study/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word_id: word.id, mode: 'flashcard', correct }),
    });
    setSessionCount(c => c + 1);
    if (correct) setSessionCorrect(c => c + 1);
    setAnswering(false);
    fetchNext();
  };

  if (done) return (
    <div className="empty-state">
      <div className="ornament">✦ ✦ ✦</div>
      <div style={{ fontFamily: 'var(--font-sc)', fontSize: '1.2rem', margin: '0.75rem 0 0.5rem' }}>
        Session Complete
      </div>
      <p className="text-muted">
        {sessionCount > 0 ? `${sessionCorrect} correct of ${sessionCount} reviewed` : 'No words due for review.'}
      </p>
      <button className="btn btn-primary mt-3" onClick={() => { setDone(false); setSessionCount(0); setSessionCorrect(0); fetchNext(); }}>
        Start Again
      </button>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h2>Flashcards</h2>
            <p>Press Space to flip · → correct · ← still learning</p>
          </div>
          <div className="session-score">{sessionCorrect} / {sessionCount}</div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading…</p></div>
      ) : word ? (
        <>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
            <span className={`badge badge-d${word.difficulty}`}>
              {word.difficulty === 1 ? 'Moderate' : word.difficulty === 2 ? 'Hard' : 'Very Hard'}
            </span>
            <span className="badge">{word.part_of_speech}</span>
            {word.streak > 0 && <span className="badge">Streak: {word.streak}</span>}
          </div>

          <div className="flashcard-scene" onClick={() => setFlipped(f => !f)}>
            <div className={`flashcard-inner${flipped ? ' flipped' : ''}`}>
              {/* Front */}
              <div className="flashcard-face">
                <div className="flashcard-word">{word.word}</div>
                <div className="flashcard-pos">{word.part_of_speech}</div>
                <div className="flashcard-hint">— tap or press Space to reveal —</div>
              </div>
              {/* Back */}
              <div className="flashcard-face flashcard-back">
                <div style={{ fontFamily: 'var(--font-sc)', fontSize: '1.4rem', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                  {word.word}
                </div>
                <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--ink-faint)', marginBottom: '1rem' }}>
                  {word.part_of_speech}
                </div>
                <div className="flashcard-definition">{word.definition}</div>
                {word.example_sentence && (
                  <div className="flashcard-example mt-2">
                    "{word.example_sentence}"
                  </div>
                )}
              </div>
            </div>
          </div>

          {flipped && (
            <div className="btn-group mt-3" style={{ justifyContent: 'center' }}>
              <button className="btn btn-incorrect" onClick={() => handleAnswer(false)} disabled={answering}>
                ✗ &nbsp;Still Learning
              </button>
              <button className="btn btn-correct" onClick={() => handleAnswer(true)} disabled={answering}>
                ✓ &nbsp;Got It
              </button>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--ink-faint)', fontStyle: 'italic' }}>
            {word.times_seen > 0
              ? `Seen ${word.times_seen} time${word.times_seen !== 1 ? 's' : ''} · Next review: ${word.next_review ? new Date(word.next_review).toLocaleDateString() : 'soon'}`
              : 'First encounter with this word'}
          </div>
        </>
      ) : null}
    </>
  );
}
