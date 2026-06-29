import { useEffect, useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Flashcard from './pages/Flashcard';
import MultipleChoice from './pages/MultipleChoice';
import FreeResponse from './pages/FreeResponse';
import MyWords from './pages/MyWords';
import Stats from './pages/Stats';

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>SAT Vocabulary Bank</h1>
          <p>Reading &amp; Writing</p>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Study</div>
          <nav>
            <NavLink to="/" end>⌂ &nbsp;Dashboard</NavLink>
            <NavLink to="/flashcard">⧉ &nbsp;Flashcards</NavLink>
            <NavLink to="/multiple-choice">◎ &nbsp;Multiple Choice</NavLink>
            <NavLink to="/free-response">✎ &nbsp;Free Response</NavLink>
          </nav>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Library</div>
          <nav>
            <NavLink to="/words">☰ &nbsp;My Words</NavLink>
            <NavLink to="/stats">◈ &nbsp;Statistics</NavLink>
          </nav>
        </div>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={() => setDark(d => !d)}>
            {dark ? '☀ Light Mode' : '☽ Dark Mode'}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/flashcard" element={<Flashcard />} />
          <Route path="/multiple-choice" element={<MultipleChoice />} />
          <Route path="/free-response" element={<FreeResponse />} />
          <Route path="/words" element={<MyWords />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </main>
    </div>
  );
}
