# ITCYBER Lead Scraping Dashboard — Deployment Guide

## 🚀 Quick Deploy Options

### Option 1: Local Development (Recommended for Testing)

**Backend (Terminal 1):**
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m playwright install chromium
python dashboard_server.py --host 127.0.0.1 --port 8766 --no-open
```

**Frontend (Terminal 2):**
```powershell
npm install
npm run dev
```

Open: http://127.0.0.1:5173

---

### Option 2: Docker (Full Stack)

```bash
# Build frontend first
npm run build

# Start everything
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8766

---

### Option 3: Vercel (Frontend) + Railway/Render (Backend)

**Frontend → Vercel:**
```bash
npm install -g vercel
vercel deploy
```

The `vercel.json` is pre-configured. Backend files are served from `/backend/*`.

**Backend → Railway/Render:**
1. Push `backend/` folder to a Git repo
2. Connect repo to Railway or Render
3. Set build command: `pip install -r requirements.txt && python -m playwright install chromium`
4. Set start command: `python dashboard_server.py --host 0.0.0.0 --port $PORT --no-open`
5. Add environment variable: `ITCYBER_ALLOWED_ORIGINS=https://your-frontend.vercel.app`

**Connect Frontend to Backend:**
- Open dashboard → Backend Setup page
- Enter your deployed backend URL (e.g., `https://your-app.railway.app`)
- Click Save

---

### Option 4: Single VPS (Nginx + Systemd)

**1. Install dependencies:**
```bash
sudo apt update
sudo apt install python3 python3-venv python3-pip nginx nodejs npm
```

**2. Setup backend as systemd service:**
```bash
# /etc/systemd/system/itcyber-backend.service
[Unit]
Description=ITCYBER Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/itcyber/backend
ExecStart=/opt/itcyber/backend/.venv/bin/python dashboard_server.py --host 127.0.0.1 --port 8766
Restart=always

[Install]
WantedBy=multi-user.target
```

**3. Nginx config:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /opt/itcyber/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:8766;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🔧 Backend URL Configuration

The frontend connects to the backend via a configurable URL:

1. **Default:** `http://127.0.0.1:8766` (local development)
2. **URL Parameter:** Add `?backend=https://your-backend.com` to the dashboard URL
3. **Settings Page:** Open Backend Setup → change URL → Save
4. **localStorage:** URL is persisted in browser storage

---

## 📁 Project Structure

```
├── src/                    # Frontend source (React + Vite + Tailwind)
│   ├── App.tsx            # Main dashboard
│   ├── services/api.ts    # Backend API client
│   └── types/index.ts     # TypeScript types
├── public/backend/         # Backend files (served as downloads)
│   ├── dashboard_server.py
│   ├── connected_scraper.py
│   ├── universal_query.py
│   ├── location_planner.py
│   ├── contact_utils.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── Procfile
│   └── README.md
├── dist/                   # Built frontend (deploy this)
├── vercel.json            # Vercel deployment config
├── docker-compose.yml     # Docker full-stack config
├── nginx.conf             # Nginx config for Docker
└── package.json           # Frontend dependencies
```

---

## 🔒 Security Notes

- Backend CORS is configured via `ITCYBER_ALLOWED_ORIGINS` env var
- No API keys required for local mode (uses public Google Maps)
- Scraper respects rate limits and detects CAPTCHAs
- No data is sent to third-party services
- All scraping uses publicly available information only

---

## 🐛 Troubleshooting

### Backend won't connect
- Check backend is running: `curl http://127.0.0.1:8766/api/health`
- Verify CORS origins include your frontend URL
- Check firewall rules for port 8766

### Playwright/Chromium issues
```bash
# Reinstall Chromium
python -m playwright install chromium

# Check diagnostics
curl http://127.0.0.1:8766/api/diagnostics
```

### Docker issues
```bash
# Rebuild from scratch
docker-compose down -v
docker-compose up --build
```

---

## 📊 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8766` | Backend port (for PaaS) |
| `HOST` | `127.0.0.1` | Backend bind address |
| `ITCYBER_ALLOWED_ORIGINS` | `http://localhost:5173,...` | CORS allowed origins |

---

## 📄 License

Internal use only.
