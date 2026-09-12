# 🚀 ITCYBER Lead Scraping Dashboard - Quick Start

## ✅ The Dashboard is LIVE!

**You're looking at it right now!** The dashboard is fully functional in demo mode.

---

## 🎯 What You Can Do RIGHT NOW

### 1. **Explore the Dashboard** (No Setup Required)
- ✅ View the dashboard interface
- ✅ See demo scraping jobs
- ✅ Browse the lead database
- ✅ Check activity logs
- ✅ View settings and API endpoints

### 2. **Try Demo Scraping** (Works Immediately)
Click **"New Scrape"** in the sidebar:
- Enter any query (e.g., "hospitals in Pune", "restaurants in Mumbai")
- Set target leads (1-2000)
- Choose enrichment level
- Select output format (CSV/XLSX/JSON)
- Click **"Start Demo Scraping"**

You'll see a simulated scraping process with demo data.

### 3. **Download Backend for Live Scraping**
To enable **real Google Maps scraping**:

**Option A: One-Click Download**
1. Click **"Get Backend"** button (amber button in sidebar or top banner)
2. Click **"Download Complete Backend (ZIP)"**
3. Extract the ZIP file
4. Follow the instructions in `START_HERE.txt`

**Option B: Manual Download**
Go to the **Backend Setup** page and download individual files.

---

## 🔥 Enable Live Scraping (5 Minutes)

### Step 1: Download Backend
```bash
# Click "Download Complete Backend (ZIP)" in the dashboard
# Or manually download from /backend/ folder
```

### Step 2: Install Dependencies
```bash
cd itcyber-backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install packages
pip install -r requirements.txt

# Install Playwright browser
playwright install chromium
```

### Step 3: Start Backend
```bash
python dashboard_server.py
```

You should see:
```
🚀 ITCYBER Backend Server starting...
📡 Server running at http://localhost:8000
🔗 CORS enabled for: http://localhost:5173
✅ Ready to accept connections
```

### Step 4: Connect Dashboard
The dashboard will **automatically detect** the backend within 5 seconds.

You'll see:
- ✅ Green "Backend Connected" indicator
- ✅ "Live" badge instead of "Demo"
- ✅ Real scraping capabilities enabled

---

## 📊 Dashboard Features

### 🏠 Dashboard (Home)
- View all scraping jobs
- Monitor active jobs in real-time
- See job statistics
- Quick access to recent results

### 🔍 New Scrape
- Enter natural language queries
- Examples:
  - "hospitals in Pune"
  - "restaurants near Mumbai"
  - "schools in Delhi"
  - "gyms in Bangalore"
- Set target leads (1-2000)
- Choose enrichment level:
  - **None**: Basic info only (fastest)
  - **Website**: + website data
  - **Full**: + social media (slowest)
- Select output format (CSV/XLSX/JSON)

### 📋 Lead Database
- View all scraped leads
- Search and filter results
- Export data
- See quality scores and verification status

### 📜 Activity Logs
- Real-time scraping logs
- Error tracking
- Performance metrics

### ⚙️ Backend Setup
- Connection status
- Backend URL configuration
- Download backend files
- Setup instructions

### 🔧 Settings
- API endpoint configuration
- Backend diagnostics
- System information

---

## 🎨 Demo Mode vs Live Mode

### Demo Mode (Current)
- ✅ Dashboard fully functional
- ✅ Simulated scraping jobs
- ✅ Demo lead data
- ❌ No real Google Maps data
- ❌ No actual web scraping

### Live Mode (After Backend Setup)
- ✅ Real Google Maps scraping
- ✅ Actual business data
- ✅ Live progress tracking
- ✅ Real contact information
- ✅ Export to CSV/XLSX/JSON

---

## 🛠️ Troubleshooting

### "Backend Not Connected" Warning
**Solution**: This is normal in demo mode. To enable live scraping:
1. Download backend files
2. Install dependencies
3. Start backend server
4. Dashboard will auto-connect

### Demo Scraping Not Working
**Solution**: Demo mode should work immediately. If not:
1. Refresh the page
2. Check browser console for errors
3. Try a different query

### Backend Won't Start
**Common Issues**:
- Python not installed → Install Python 3.8+
- Port 8000 in use → Change port in `dashboard_server.py`
- Playwright not installed → Run `playwright install chromium`

### CORS Errors
**Solution**: Backend CORS is pre-configured for `http://localhost:5173`. If you're running on a different port, update `ALLOWED_ORIGINS` in `dashboard_server.py`.

---

## 📱 Browser Compatibility

✅ Chrome/Edge (Recommended)
✅ Firefox
✅ Safari
✅ Mobile browsers (limited features)

---

## 🌐 Deployment Options

### Local Development (Current)
- Frontend: This dashboard (already running)
- Backend: Python server on localhost:8000

### Production Deployment
See `DEPLOYMENT.md` for:
- Docker deployment
- Vercel + Railway
- VPS deployment
- Nginx configuration

---

## 📞 Need Help?

1. **Check the Backend Setup page** - Step-by-step instructions
2. **Read START_HERE.txt** - Included in backend ZIP
3. **View DEPLOYMENT.md** - Advanced deployment options
4. **Check activity logs** - See what's happening

---

## 🎉 You're All Set!

The dashboard is ready to use. Start with demo mode to explore, then download the backend when you're ready for live scraping.

**Next Steps**:
1. ✅ Explore the dashboard (you're here!)
2. 🔍 Try "New Scrape" with demo data
3. 📥 Download backend for live scraping
4. 🚀 Start real Google Maps scraping!

---

**Happy Scraping!** 🎯
