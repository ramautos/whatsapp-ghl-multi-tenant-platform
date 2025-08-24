# ⚡ QUICK REFERENCE - WhatsApp-GHL Platform

## 🔑 KEY URLS & CREDENTIALS

### **Production URLs:**
- **Main Platform:** https://whatsapp.cloude.es
- **Client Dashboard:** https://whatsapp.cloude.es/dashboard/{locationId}
- **Admin Panel:** https://whatsapp.cloude.es/admin
- **API Health:** https://whatsapp.cloude.es/api/health

### **Credentials:**
- **API Key:** `cloude-api-key-2024`
- **Evolution API:** `https://evolutionv2.cloude.es`
- **Evolution Key:** `CwLLVHNynMyfeM7ePCyUgBr6EdOk3eRg`

---

## 🧪 TESTING COMMANDS

### **Create Test Installation:**
```bash
node test-production-fixed.js
```

### **API Tests:**
```bash
# Health Check
curl https://whatsapp.cloude.es/api/health

# Frontend API (no auth)
curl https://whatsapp.cloude.es/api/instances/LOCATION_ID

# Admin API (requires auth)  
curl -H "X-API-Key: cloude-api-key-2024" https://whatsapp.cloude.es/api/admin/stats
```

---

## 🔧 MAINTENANCE

### **Restart Server:**
```bash
pkill -f "node server-multitenant.js"
node server-multitenant.js
```

### **Deploy to Production:**
1. `git add .`
2. `git commit -m "message"`
3. `git push`
4. Redeploy in Coolify: https://app.cloude.es

---

## 📊 ARCHITECTURE

### **File Structure:**
```
├── server-multitenant.js          # Main server
├── routes/multiTenantApi.js        # API + auth
├── services/evolutionService.js    # WhatsApp integration  
├── public/simple-dashboard.html    # Main dashboard UI
└── config/database-sqlite.js       # Database layer
```

### **Multi-Tenant Pattern:**
- Each client = unique `locationId`
- Each client = 5 WhatsApp instances max
- Complete isolation between clients
- Instance naming: `{locationId}_wa_{position}`

---

## 🐛 FIXED ISSUES

### **JavaScript Error (FIXED):**
- **Issue:** "Cannot set properties of null"
- **Fixed in:** `public/simple-dashboard.html`
- **Solution:** Safe button handling + error boundaries

### **Health Check Error (FIXED):**  
- **Issue:** "healthCheck is not a function"
- **Fixed in:** `services/evolutionService.js`
- **Solution:** Added missing health methods

### **API Authentication (FIXED):**
- **Issue:** Dashboard required API key
- **Fixed in:** `routes/multiTenantApi.js`  
- **Solution:** Frontend patterns exempt from auth

---

## 🚀 STATUS: 100% PRODUCTION READY ✅

**Last Updated:** 2025-08-24  
**Version:** 1.0.0 Final  
**Deployment:** Coolify Auto-Deploy Enabled