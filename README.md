# WikiTok

React + Flask app that lets you scroll random Wikipedia articles, save favorites, and view them later. Google OAuth secures save/like/history actions.

## Quick start

1) Install frontend deps  
`npm install`

2) Backend setup  
```
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\\Scripts\\activate on Windows
pip install -r requirements.txt
```

3) Configure Google OAuth (values from the console screenshot)  
```
export GOOGLE_CLIENT_ID=""
export GOOGLE_CLIENT_SECRET=""
export FRONTEND_URL="http://localhost:5173"  # optional override
export SECRET_KEY="change-me"
```

Add `http://localhost:5000/api/auth/callback` as an authorized redirect URI in the Google console.

4) Run the servers  
- Backend (from repo root or backend folder): `python backend/app.py`  
- Frontend: `npm run dev` (Vite proxies `/api` to the Flask server)

## Notable endpoints
- `GET /api/auth/login` → kicks off Google OAuth
- `GET /api/auth/me` → current user (returns 401 when signed out)
- `POST /api/auth/logout` → clears the session
- `POST /api/articles/:id/like|view`, `GET /api/articles/liked` → save/like/history powered by your Google account
