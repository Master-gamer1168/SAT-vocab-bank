# Conversation Handoff

## What was built
A full-stack SAT Reading & Writing vocabulary web app called **SAT Vocabulary Bank**.

- **Repo:** `master-gamer1168/sat-vocab-bank`
- **Branch:** `claude/youthful-goodall-l7vtqg`

## Tech stack
- Frontend: React + Vite (built to `client/dist/`)
- Backend: Node.js + Express (serves both API and static frontend)
- Database: PostgreSQL
- Charts: Recharts
- Font: IM Fell English (academic serif, similar to Times New Roman)

## Project structure
```
/SAT-vocab-bank
  /client          React frontend (Vite)
  /server          Express backend (also serves built frontend)
  /db              migrate.js + seed.js (~350 SAT words)
  install-service.sh   Sets up systemd auto-start
  sat-vocab.service    Systemd unit file
  README.md
```

## Database schema
- `words` — id, word, definition, part_of_speech, example_sentence, difficulty (1-3), is_custom
- `user_progress` — SM-2 spaced repetition fields (interval_days, ease_factor, streak, next_review, mastered, skipped)
- `quiz_sessions` — mode, scores, words_studied

## API endpoints
- `GET/POST/PUT/DELETE /api/words`
- `GET /api/words/due` — SR-prioritized due words
- `GET /api/words/:id/master` and `/skip`
- `GET /api/study/flashcard|multiple-choice|free-response`
- `POST /api/study/answer` — submits answer, runs SM-2 update
- `GET /api/stats/overview|history|word/:id`

## Current state
- All code is committed and pushed to `claude/youthful-goodall-l7vtqg`
- The user has NOT yet cloned the repo to their local machine
- They were trying to clone with:
  ```bash
  git clone https://github.com/master-gamer1168/sat-vocab-bank.git
  ```

## What the user still needs to do (local setup)
1. Clone the repo
2. `cd sat-vocab-bank/server && npm install`
3. `cd ../client && npm install && npm run build`
4. Create `server/.env` (copy from `server/.env.example`), set `DATABASE_URL`
5. `node db/migrate.js` (needs `NODE_PATH=./server/node_modules` or run from server dir)
6. `node db/seed.js`
7. `bash install-service.sh` — registers systemd service, app auto-starts on boot at **http://localhost:3001**

## Known issue with db scripts
The `db/migrate.js` and `db/seed.js` scripts use `require('dotenv')` but live outside the server's `node_modules`. Work around:
```bash
NODE_PATH=/path/to/sat-vocab-bank/server/node_modules node db/migrate.js
NODE_PATH=/path/to/sat-vocab-bank/server/node_modules node db/seed.js
```
Or just run them from inside the `server/` directory with a relative path adjustment.

## Design notes
- Academic serif aesthetic: IM Fell English font, parchment/ink color palette
- No rounded corners (border-radius: 2px)
- Dark mode toggle in sidebar, persisted to localStorage
- Color accents: matte gold (`#a07c3a`), dark brown (`#5c3d1e`)

## Outstanding items / possible next steps
- Fix the db script module resolution (add a `package.json` to `/db` or symlink node_modules)
- The user mentioned "ponytail skill" and "ui pro max skill" — these don't exist, may be custom tools they expected
- No authentication (intentional — personal local tool)
- No PR created yet; user may want one
