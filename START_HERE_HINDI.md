# 🎯 ITCYBER Dashboard - Aap Kaise Use Karein?

## 📍 Aapka Dashboard Link

**Aapka dashboard already ready hai!** 

Ye jo preview aap dekh rahe hain - **yahi aapka dashboard hai!**

Lekin ise **apne computer pe locally** chalane ke liye (http://127.0.0.1:5173/ pe), aapko ye steps follow karne honge:

---

## 🚀 Sabse Aasan Tarika (2 Minutes)

### Step 1: Files Download Karo

Aapke paas ye files hain:
- ✅ `start_all.bat` - Sab kuch ek saath start karta hai
- ✅ `setup_backend.bat` - Backend setup karta hai
- ✅ `start_backend.bat` - Backend start karta hai
- ✅ `start_frontend.bat` - Frontend start karta hai
- ✅ `check_status.bat` - Check karta hai sab ready hai ya nahi

### Step 2: Pehle Check Karo

**`check_status.bat`** pe double-click karo

Ye batayega:
- ✅ Python installed hai ya nahi
- ✅ Node.js installed hai ya nahi
- ✅ Backend setup hai ya nahi
- ✅ Frontend dependencies installed hain ya nahi

### Step 3: Sab Start Karo

**`start_all.bat`** pe double-click karo

Ye automatically:
1. Backend setup karega (agar nahi hai)
2. Backend server start karega (port 8766)
3. Frontend server start karega (port 5173)
4. 2 windows open hongi

### Step 4: Browser Kholo

Apne browser mein jao:

```
http://127.0.0.1:5173
```

**Bas! Dashboard ready hai!** 🎉

---

## 🔥 Backend Ko Online Kaise Karein?

Backend **automatically online** ho jayega jab aap `start_all.bat` ya `start_backend.bat` run karoge.

### Backend Online Hai Ya Nahi - Kaise Check Karein?

**Tarika 1: Dashboard Mein Dekho**
- Dashboard kholo: http://127.0.0.1:5173
- Sidebar mein dekho:
  - 🟢 **Green dot** = Backend ONLINE ✅
  - 🔴 **Red dot** = Backend OFFLINE ❌

**Tarika 2: Browser Mein Check Karo**
```
http://127.0.0.1:8766/api/health
```

Agar ye dikhe toh backend **ONLINE** hai:
```json
{
  "ok": true,
  "status": "online",
  "version": "2.0.0"
}
```

**Tarika 3: Dashboard Banner**
- 🟢 **Green banner** = Backend connected (LIVE mode)
- 🟡 **Yellow banner** = Backend offline (DEMO mode)

---

## 📋 Complete Setup Steps (Hindi Mein)

### Pehli Baar Setup (10-15 Minutes)

1. **Python Install Karo** (agar nahi hai)
   - Download: https://python.org
   - Install karte waqt "Add Python to PATH" tick karo

2. **Node.js Install Karo** (agar nahi hai)
   - Download: https://nodejs.org
   - LTS version install karo

3. **Check Karo Sab Ready Hai**
   ```
   check_status.bat run karo
   ```

4. **Backend Setup Karo**
   ```
   setup_backend.bat run karo
   ```
   - Ye 5-10 minutes lega
   - Virtual environment banayega
   - Dependencies install karega
   - Playwright browser install karega

5. **Sab Start Karo**
   ```
   start_all.bat run karo
   ```

6. **Browser Kholo**
   ```
   http://127.0.0.1:5173
   ```

### Roz Use Karne Ke Liye (10 Seconds)

Bas **`start_all.bat`** run karo aur browser kholo!

---

## 🎨 Demo Mode vs Live Mode

### Demo Mode (Backend OFFLINE)
- ✅ Dashboard dekh sakte ho
- ✅ Demo scraping try kar sakte ho
- ✅ UI explore kar sakte ho
- ❌ Real Google Maps data nahi milega
- ❌ Real businesses nahi milenge

### Live Mode (Backend ONLINE)
- ✅ Real Google Maps scraping
- ✅ Actual business data
- ✅ Live progress tracking
- ✅ Real contact information
- ✅ CSV/XLSX/JSON export

---

## ❓ Common Questions

### Q: Backend Offline Kyun Hai?

**A:** Backend ko separately start karna padta hai. Ye steps follow karo:

1. `start_backend.bat` run karo
2. Wait karo jab tak server start ho jaye
3. Dashboard refresh karo
4. Green indicator dikhega

### Q: Frontend Kahan Hai?

**A:** Frontend **already built** hai (dist/ folder mein). Aap:
- Preview mein dekh sakte ho (ye jo abhi dekh rahe ho)
- Ya locally run kar sakte ho: `start_frontend.bat`

### Q: Kya Main Directly Servers Start Kar Sakta Hoon?

**A:** Main ek AI assistant hoon, main directly servers run nahi kar sakta. Lekin maine aapke liye **ready-made scripts** bana diye hain. Aapko bas unhe run karna hai.

### Q: Scripts Kahan Se Download Karun?

**A:** Ye scripts aapke project folder mein already hain:
- `start_all.bat`
- `start_backend.bat`
- `start_frontend.bat`
- `setup_backend.bat`
- `check_status.bat`

Bas inhe apne computer pe copy karo aur run karo.

---

## 🎯 Quick Start Checklist

- [ ] Python installed hai? (`python --version`)
- [ ] Node.js installed hai? (`node --version`)
- [ ] `check_status.bat` run kiya?
- [ ] `setup_backend.bat` run kiya? (pehli baar)
- [ ] `start_all.bat` run kiya?
- [ ] Browser mein http://127.0.0.1:5173 khola?
- [ ] Green "Backend Connected" indicator dikha?

**Sab ✓ hai? Toh aap ready ho!** 🚀

---

## 📞 Problem Aaye Toh?

### Backend Start Nahi Ho Raha
→ `setup_backend.bat` dobara run karo

### Frontend Start Nahi Ho Raha
→ `npm install` run karo manually

### Port Already In Use
→ Dusri window close karo ya computer restart karo

### Browser Mein Kuch Nahi Dikh Raha
→ Console check karo (F12 press karo)

---

## 🎉 Summary

**Aapka dashboard ready hai!** 

Bas ye karo:
1. ✅ `start_all.bat` run karo
2. ✅ Browser kholo: http://127.0.0.1:5173
3. ✅ Backend automatically online ho jayega
4. ✅ Scraping start karo!

**Detailed instructions ke liye:** `README_HINDI.md` padho

---

**Ab aap ready ho! Start karo aur scraping karo!** 🚀🎯
