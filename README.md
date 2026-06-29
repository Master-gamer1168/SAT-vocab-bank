# SAT Vocabulary Bank

A full-stack personal study tool for SAT Reading & Writing vocabulary.
Flashcards, multiple choice, and free-response modes — powered by a
spaced-repetition (SM-2) algorithm, backed by PostgreSQL.

---

## Prerequisites

- Node.js 18+
- PostgreSQL (running locally)

---

## Setup

### 1. Clone & install dependencies

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Create the database

```bash
createdb sat_vocab
```

### 3. Configure environment

```bash
cp server/.env.example server/.env
# Edit server/.env and set your DATABASE_URL, e.g.:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/sat_vocab
```

### 4. Run migrations

```bash
node db/migrate.js
```

### 5. Seed vocabulary (~300 SAT-level words)

```bash
node db/seed.js
```

### 6. Start the servers

In two separate terminals:

```bash
# Terminal 1 — API server (port 3001)
cd server && npm run dev

# Terminal 2 — React client (port 5173)
cd client && npm run dev
```

### 7. Open the app

```
http://localhost:5173
```

---

## Project Structure

```
/sat-vocab-app
  /client          React + Vite frontend
    /src
      /pages       Dashboard, Flashcard, MultipleChoice, FreeResponse, MyWords, Stats
      /components  WordModal
  /server          Express REST API
    /routes        words.js, study.js, stats.js
    db.js          PostgreSQL pool
    index.js       Entry point
  /db
    migrate.js     Creates all tables
    seed.js        Inserts ~300 SAT vocabulary words
  README.md
```

---

## Features

- **Flashcard mode** — flip animation, keyboard shortcuts (Space / ← →)
- **Multiple Choice** — 4 options with immediate color feedback
- **Free Response** — self-reported grading after definition reveal
- **SM-2 Spaced Repetition** — interval and ease-factor updated on every answer
- **My Words** — full table with search, filter, add/edit/delete (custom words)
- **Stats** — bar chart of recent sessions, vocabulary status pie chart, hardest words
- **Dark mode** — toggled in the sidebar, persisted to localStorage
- **Academic aesthetic** — IM Fell English serif font, ink-and-parchment palette

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/words` | All words with progress |
| GET | `/api/words/due` | Words due for review |
| GET | `/api/words/:id` | Single word |
| POST | `/api/words` | Add custom word |
| PUT | `/api/words/:id` | Edit word |
| DELETE | `/api/words/:id` | Delete custom word |
| POST | `/api/words/:id/master` | Mark mastered |
| POST | `/api/words/:id/skip` | Skip word |
| GET | `/api/study/flashcard` | Next flashcard |
| GET | `/api/study/multiple-choice` | Word + 3 distractors |
| GET | `/api/study/free-response` | Next free-response word |
| POST | `/api/study/answer` | Submit answer & update SR |
| GET | `/api/stats/overview` | Dashboard stats |
| GET | `/api/stats/history` | Last 30 sessions |
| GET | `/api/stats/word/:id` | Per-word history |
