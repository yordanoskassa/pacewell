# Deploy backend to Render

No database setup needed — data is stored **in memory** (resets on restart).

## 1. Fernet key (one-time)

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Save output as `FERNET_KEY`.

## 2. Deploy on Render

**Option A — Blueprint**

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
2. Connect `yordanoskassa/pacewell`
3. Fill env vars → Deploy

**Option B — Manual (repo root)**

1. **New** → **Web Service** → connect repo
2. **Root Directory:** leave empty
3. **Build:** `pip install -r requirements.txt`
4. **Start:** `uvicorn run:app --host 0.0.0.0 --port $PORT`
5. **Environment:** `PYTHON_VERSION=3.11.9`

Do **not** use `uvicorn app.main:app` from repo root — that causes `No module named 'app'`.

## 3. Environment variables

| Key | Example |
|-----|---------|
| `FERNET_KEY` | output from step 1 |
| `GEMINI_API_KEY` | your Google AI key |
| `GOOGLE_CLIENT_ID` | `....apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | your secret |
| `GOOGLE_REDIRECT_URI` | `https://YOUR-SERVICE.onrender.com/auth/fitbit/callback` |
| `FRONTEND_URL` | `https://your-app.netlify.app` |
| `BUTTERBASE_APP_ID` | `app_...` from Butterbase dashboard |
| `BUTTERBASE_API_URL` | `https://api.butterbase.ai` |
| `BUTTERBASE_API_KEY` | `bb_sk_...` service key |

## 4. Google OAuth

Add redirect URI in [Google Cloud Console](https://console.cloud.google.com/):

`https://YOUR-RENDER-URL/auth/fitbit/callback`

## 5. Point Netlify at Render

```
VITE_API_URL=https://YOUR-RENDER-URL
```

## 6. Verify

```bash
curl https://YOUR-RENDER-URL/health
```
