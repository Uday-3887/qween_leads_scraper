# ITCYBER Lead Scraping Dashboard v2.0

A production-style local lead scraping application that discovers businesses from Google Maps using Playwright browser automation. Supports arbitrary business categories, natural language queries (English, Marathi, Hindi), and multiple output formats.

## Architecture

```
┌─────────────────────┐     ┌─────────────────────────┐
│   Frontend (React)  │────▶│  Backend (Python/Flask)  │
│   Port: 5173        │     │  Port: 8766              │
│   Vite + Tailwind   │     │  Job management + API    │
└─────────────────────┘     └───────────┬─────────────┘
                                        │
                              ┌─────────▼──────────┐
                              │  Connected Scraper  │
                              │  Playwright + Maps  │
                              │  Subprocess worker  │
                              └────────────────────┘
```

## Quick Start

### Backend Setup (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m playwright install chromium
python dashboard_server.py --host 127.0.0.1 --port 8766 --no-open
```

### Frontend Setup (separate terminal)

```powershell
cd frontend
npm install
npm run dev
```

### Open Dashboard

```
http://127.0.0.1:5173
```

## Features

### Universal Query Support
- English: "hospitals in Pusad"
- Marathi: "Pusad mdhi hospitals"
- Hindi: "Pusad mein hospitals"
- Mixed: "Pusad mdhi hospitals kiti ahe"

### Arbitrary Categories
Not limited to a hard-coded list. Works with any legitimate business category:
- hospitals, restaurants, schools, gyms
- solar panel dealers, tile adhesive dealers
- wedding photographers, banquet halls
- computer institutes, packers and movers

### Smart Filtering
- Hospital search excludes pharmacies/medical stores
- Government qualifier enforcement
- Relevance scoring (0-100)
- Multi-key deduplication

### Output Formats
- CSV (UTF-8 with BOM for Unicode support)
- XLSX (Excel format)
- JSON

### Enrichment Levels
- **None**: Google Maps data only
- **Website**: Maps + business website contact info
- **Full**: Maps + website + public social profiles

### Reliability
- Atomic checkpoint saving (data preserved on crash)
- Browser crash recovery
- CAPTCHA detection (no bypass)
- Controlled retry logic
- Windows-compatible file handling

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/jobs` | GET | List all jobs |
| `/api/jobs` | POST | Create new job |
| `/api/jobs/{id}` | GET | Job details |
| `/api/jobs/{id}/stop` | POST | Stop running job |
| `/api/jobs/{id}/results` | GET | Get results |
| `/api/jobs/{id}/download` | GET | Download file |
| `/api/diagnostics` | GET | Deep diagnostics |

## CLI Usage

```bash
# Basic scraping
python connected_scraper.py --query "hospitals in Pusad" --target 10 --format csv --output output/hospitals.csv

# With website enrichment
python connected_scraper.py --query "restaurants in Pune" --target 50 --enrichment website --format xlsx --output output/restaurants.xlsx

# Full enrichment (website + social)
python connected_scraper.py --query "interior designers in Nagpur" --target 20 --enrichment full --format json --output output/designers.json

# Government filter
python connected_scraper.py --query "government hospitals in Yavatmal district" --target 30 --format csv --output output/govt_hospitals.csv
```

## Data Fields

Each lead record contains:

| Field | Description |
|-------|-------------|
| business_name | Business name from Maps |
| category | Maps category |
| google_address | Full address |
| google_phone | Phone number |
| official_website | Business website |
| public_emails | Emails found on website |
| facebook_url | Facebook page |
| instagram_url | Instagram profile |
| linkedin_url | LinkedIn page |
| rating | Google rating |
| review_count | Number of reviews |
| hours | Business hours |
| latitude/longitude | GPS coordinates |
| quality_score | 0-100 completeness score |
| verification_status | high/medium/basic |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ITCYBER_ALLOWED_ORIGINS` | `http://localhost:5173,...` | CORS allowed origins |

### Backend Arguments

| Argument | Default | Description |
|----------|---------|-------------|
| `--host` | `127.0.0.1` | Bind address |
| `--port` | `8766` | Listen port |
| `--no-open` | - | Don't open browser |
| `--debug` | - | Debug mode |

## Troubleshooting

### Backend won't start
```powershell
# Check Python version (need 3.8+)
python --version

# Reinstall dependencies
pip install -r requirements.txt

# Install browser
python -m playwright install chromium
```

### Browser won't launch
```powershell
# Reinstall Chromium
python -m playwright install chromium

# Check diagnostics
curl http://127.0.0.1:8766/api/diagnostics
```

### Frontend can't connect
- Ensure backend is running on port 8766
- Check browser console for CORS errors
- Verify `http://127.0.0.1:8766/api/health` responds

### CAPTCHA/rate limiting
- Google may show CAPTCHA after many requests
- The scraper detects this and stops gracefully
- Wait 15-30 minutes before retrying
- Partial results are preserved

## Responsible Scraping

This tool:
- ✅ Uses only publicly available data
- ✅ Respects robots.txt where applicable
- ✅ Uses reasonable request frequency
- ✅ Does NOT bypass CAPTCHA
- ✅ Does NOT bypass login walls
- ✅ Does NOT scrape private accounts
- ✅ Checkpoints data on interruption

## License

Internal use only.
