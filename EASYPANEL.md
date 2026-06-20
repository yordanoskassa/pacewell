# Deploy PaceWell on Easypanel

Easypanel runs each service as a Docker container. Deploy **two App services**: API + frontend.

Docs: [easypanel.io/docs/services/app](https://easypanel.io/docs/services/app)

---

## 1. Create project

1. Easypanel → **New Project** → name it `pacewell`
2. Add **App** service → **GitHub** → repo `yordanoskassa/pacewell`, branch `master`

---

## 2. Backend API service

| Setting | Value |
|---------|--------|
| **Service name** | `api` |
| **Dockerfile path** | `Dockerfile` (repo root) |
| **Build context** | `.` (root) |
| **App / Proxy port** | `8000` |
| **Health check path** | `/health` |

### Environment variables

Copy from `backend/.env.example`:

```
PORT=8000
FRONTEND_URL=https://YOUR-FRONTEND-DOMAIN
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://YOUR-API-DOMAIN/auth/fitbit/callback
FERNET_KEY=
BUTTERBASE_APP_ID=
BUTTERBASE_API_URL=https://api.butterbase.ai
BUTTERBASE_API_KEY=
```

Generate Fernet key:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Set `FRONTEND_URL` to your Easypanel frontend URL after step 3.

Deploy → note the API URL (e.g. `https://pacewell-api.your-panel.host`).

---

## 3. Frontend web service

Add a second **App** service in the same project:

| Setting | Value |
|---------|--------|
| **Service name** | `web` |
| **Dockerfile path** | `frontend/Dockerfile` |
| **Build context** | `.` (repo root) |
| **App / Proxy port** | `80` |

### Build argument (required)

In Easypanel → **Build** → **Build Arguments**:

```
VITE_API_URL=https://YOUR-API-DOMAIN
```

Use the API URL from step 2 (no trailing slash).

Redeploy after changing `VITE_API_URL`.

---

## 4. Domains & SSL

- **api** service → add domain → Easypanel provisions HTTPS
- **web** service → add domain → this is your public app URL
- Update `FRONTEND_URL` and `GOOGLE_REDIRECT_URI` on the API to match

CORS already allows `*.easypanel.host` and custom domains via `FRONTEND_URL`.

---

## 5. Verify

```bash
curl https://YOUR-API-DOMAIN/health
curl -X POST "https://YOUR-API-DOMAIN/demo/seed?user_id=guest"
```

Open frontend → **Get Started** → dashboard should load.

---

## Local test (Docker Compose)

```bash
cp backend/.env.example backend/.env   # fill in keys
docker compose up --build
```

- Frontend: http://localhost:3000  
- API: http://localhost:8000  
- API docs: http://localhost:8000/docs  

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `No module named 'app'` | Dockerfile path must be root `Dockerfile`, start uses `run:app` |
| Frontend empty / API errors | Rebuild `web` with correct `VITE_API_URL` build arg |
| CORS blocked | Set `FRONTEND_URL` on API to exact frontend HTTPS URL |
| OAuth redirect fails | `GOOGLE_REDIRECT_URI` must match Google Cloud console |
| Cold start slow | Easypanel keeps container running; first request may still warm up |

---

## Auto-deploy

Enable **Auto Deploy** on both services → Easypanel webhook redeploys on every `git push`.
