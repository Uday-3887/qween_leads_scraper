# 🚀 ITCYBER Lead Scraping Dashboard - Setup Guide (Hindi/Hinglish)

## 📋 Kya Karna Hai?

Aapko **2 cheezein** chahiye:
1. **Frontend** - Dashboard jo aap browser mein dekhenge (port 5173)
2. **Backend** - Python server jo Google Maps se data scrape karega (port 8766)

---

## 🎯 Sabse Aasan Tarika (Recommended)

### Step 1: Sab Kuch Ek Saath Start Karo

Bas **ek file** run karo:

```
start_all.bat
```

**Double-click** karo is file pe. Ye automatically:
- Backend setup karega (agar nahi hai toh)
- Backend server start karega (port 8766)
- Frontend server start karega (port 5173)
- 2 windows open hongi (ek backend ke liye, ek frontend ke liye)

### Step 2: Browser Kholo

Apne browser mein jao:

```
http://127.0.0.1:5173
```

**Bas! Dashboard ready hai!** 🎉

---

## 🔧 Manual Setup (Agar Aasan Tarika Kaam Na Kare)

### Backend Setup (Pehli Baar)

1. **setup_backend.bat** pe double-click karo
   - Ye Python virtual environment banayega
   - Dependencies install karega
   - Playwright browser install karega
   - **Time**: 5-10 minutes (pehli baar)

2. Wait karo jab tak setup complete ho jaye

### Backend Start Karo

1. **start_backend.bat** pe double-click karo
2. Ek nayi window open hogi
3. Wait karo jab tak ye message aaye:
   ```
   🚀 ITCYBER Backend Server starting...
   📡 Server running at http://127.0.0.1:8766
   ```

### Frontend Start Karo

1. **start_frontend.bat** pe double-click karo
2. Ek nayi window open hogi
3. Wait karo jab tak ye message aaye:
   ```
   VITE ready in XXX ms
   ➜  Local:   http://127.0.0.1:5173/
   ```

### Browser Kholo

```
http://127.0.0.1:5173
```

---

## ✅ Check Karo Sab Kaam Kar Raha Hai

### Backend Check

Browser mein jao:
```
http://127.0.0.1:8766/api/health
```

Agar ye dikhe toh backend **ONLINE** hai:
```json
{
  "ok": true,
  "status": "online",
  "version": "2.0.0",
  ...
}
```

### Frontend Check

Browser mein jao:
```
http://127.0.0.1:5173
```

Dashboard khulna chahiye with **green "Backend Connected"** indicator.

---

## 🎨 Dashboard Use Karna

### Demo Mode (Bina Backend Ke)

Agar backend nahi chal raha, toh dashboard **demo mode** mein kaam karega:
- ✅ Dashboard dekh sakte ho
- ✅ Demo scraping try kar sakte ho
- ❌ Real Google Maps data nahi milega

### Live Mode (Backend Ke Saath)

Jab backend chal raha ho:
- ✅ Real Google Maps scraping
- ✅ Actual business data
- ✅ Live progress tracking
- ✅ Real contact information

---

## 🚀 Live Scraping Kaise Karein?

1. **Dashboard kholo**: http://127.0.0.1:5173
2. **"New Scrape"** pe click karo
3. Query enter karo, jaise:
   - `hospitals in Pune`
   - `restaurants in Mumbai`
   - `schools in Delhi`
4. Target set karo (kitne leads chahiye)
5. Enrichment level choose karo
6. Format choose karo (CSV/XLSX/JSON)
7. **"Start Live Scraping"** pe click karo
8. Wait karo aur results dekho!

---

## ❌ Problems Aur Solutions

### "Backend Not Connected" Dikh Raha Hai

**Problem**: Dashboard mein red warning aa raha hai

**Solution**:
1. Check karo backend chal raha hai ya nahi
2. `start_backend.bat` run karo
3. Wait karo 5-10 seconds
4. Dashboard refresh karo

### Backend Start Nahi Ho Raha

**Problem**: `start_backend.bat` run karne pe error aa raha hai

**Solution**:
1. Check karo Python installed hai ya nahi:
   ```
   python --version
   ```
2. Agar nahi hai toh install karo: https://python.org
3. `setup_backend.bat` dobara run karo

### Frontend Start Nahi Ho Raha

**Problem**: `start_frontend.bat` run karne pe error aa raha hai

**Solution**:
1. Check karo Node.js installed hai ya nahi:
   ```
   node --version
   npm --version
   ```
2. Agar nahi hai toh install karo: https://nodejs.org
3. `start_frontend.bat` dobara run karo

### Port Already In Use

**Problem**: "Port 5173 already in use" ya "Port 8766 already in use"

**Solution**:
1. Dusri window close karo jo same port use kar rahi hai
2. Ya computer restart karo
3. Ya scripts mein port change karo (advanced)

### Playwright Browser Install Nahi Ho Raha

**Problem**: `playwright install chromium` fail ho raha hai

**Solution**:
1. Internet connection check karo
2. Administrator rights se run karo
3. Manual install karo:
   ```
   cd backend
   venv\Scripts\activate
   python -m playwright install chromium
   ```

---

## 📁 Files Ka Matlab

| File | Kya Karta Hai |
|------|---------------|
| `setup_backend.bat` | Backend pehli baar setup karta hai |
| `start_backend.bat` | Backend server start karta hai |
| `start_frontend.bat` | Frontend server start karta hai |
| `start_all.bat` | Dono ek saath start karta hai |
| `backend/` | Python backend code |
| `dist/` | Built frontend (ready to deploy) |
| `src/` | Frontend source code |

---

## 🎯 Quick Commands

### Sirf Backend Start Karo
```
start_backend.bat
```

### Sirf Frontend Start Karo
```
start_frontend.bat
```

### Dono Start Karo
```
start_all.bat
```

### Backend Setup Karo (Pehli Baar)
```
setup_backend.bat
```

---

## 🌐 URLs

| Service | URL |
|---------|-----|
| Frontend Dashboard | http://127.0.0.1:5173 |
| Backend API | http://127.0.0.1:8766 |
| Backend Health | http://127.0.0.1:8766/api/health |

---

## 💡 Tips

1. **Pehli baar setup** mein 10-15 minutes lag sakte hain
2. **Uske baad** bas `start_all.bat` run karo, 10 seconds mein ready
3. **Backend window** aur **Frontend window** dono open rakho
4. **Band karne ke liye** Ctrl+C press karo ya windows close karo
5. **Demo mode** mein bhi dashboard use kar sakte ho (bina backend ke)

---

## 🎉 Bas Ho Gaya!

Ab aap ready ho:

1. ✅ `start_all.bat` run karo
2. ✅ Browser kholo: http://127.0.0.1:5173
3. ✅ Scraping start karo!

**Happy Scraping!** 🚀

---

## 📞 Help Chahiye?

1. **Dashboard mein**: "Backend Setup" page dekho
2. **Backend logs**: Backend window mein dekho
3. **Frontend logs**: Frontend window mein dekho
4. **Browser console**: F12 press karo browser mein

---

**Koi problem aaye toh batana!** 😊
