# 🔥 CÓMO USAR LAS HERRAMIENTAS EN VS CODE

## ✅ **3 FORMAS DE USAR LAS HERRAMIENTAS:**

---

## **1️⃣ USANDO NPM (MÁS FÁCIL)**

En la terminal de VS Code, escribe:

```bash
# Ver todas las herramientas
npm run tools

# O comandos directos:
npm start          # Iniciar servidor
npm run dashboard  # Abrir dashboard local
npm run production # Abrir producción
npm run verify     # Verificar sistema
npm run deploy     # Deploy rápido
npm run power      # POWER MODE - Abrir todo
```

### **Lista completa de comandos NPM:**
| Comando | Acción |
|---------|--------|
| `npm start` | 🚀 Iniciar servidor |
| `npm run dashboard` | 📱 Abrir dashboard local |
| `npm run production` | 🌐 Abrir producción |
| `npm run verify` | 🧪 Verificar sistema |
| `npm run check` | 🔍 Check producción |
| `npm run deploy` | 🚀 Deploy rápido |
| `npm run status` | 📊 Git status |
| `npm run logs` | 📋 Ver logs |
| `npm run power` | 🔥 POWER MODE |

---

## **2️⃣ USANDO NODE (FUNCIONA SIEMPRE)**

```bash
# En terminal VS Code:
node run.js
```

**Aparece menú interactivo:**
```
🎯 HERRAMIENTAS DISPONIBLES:
1. 🚀 Start Server
2. 🧪 Test All APIs
3. 📱 Open Local Dashboard
4. 🌐 Open Production
5. 📊 Git Status
6. 🗄️ Check Database
7. 🚀 Quick Deploy
8. 🔥 POWER MODE (Abrir TODO)
0. 👋 Salir

Selecciona una opción: _
```

---

## **3️⃣ USANDO BASH (SI FUNCIONA)**

```bash
# Si funciona en tu terminal:
./dev-tools.sh

# O con bash explícito:
bash dev-tools.sh
```

---

## ⌨️ **ATAJOS DE TECLADO EN VS CODE**

Una vez configurados, usa:

| Atajo | Acción |
|-------|--------|
| `Cmd+Shift+S` | 🚀 Start Server |
| `Cmd+Shift+T` | 🧪 Test APIs |
| `Cmd+Shift+O` | 📱 Open Local |
| `Cmd+Shift+P` | 🌐 Open Production |
| `Cmd+Shift+D` | 🚀 Quick Deploy |

---

## 🎯 **MÉTODO RECOMENDADO PARA TI:**

### **Si el script bash no funciona, usa NPM:**

```bash
# POWER MODE - Abre todo de una vez
npm run power

# O paso a paso:
npm start          # Iniciar servidor
npm run dashboard  # Abrir dashboard
```

### **O usa Node directamente:**
```bash
node run.js
# Selecciona opción 8 (POWER MODE)
```

---

## 🚀 **QUICK START (30 SEGUNDOS):**

1. **Abre terminal en VS Code** (Terminal → New Terminal)

2. **Verifica que estás en el directorio correcto:**
   ```bash
   pwd
   # Debe mostrar: /Users/rayalvarado/Downloads/chrome_extension_agente_ia_crm_v5/evolution-ghl-integration
   ```

3. **Ejecuta POWER MODE:**
   ```bash
   npm run power
   ```

4. **¡LISTO!** Se abre todo automáticamente:
   - ✅ Servidor corriendo
   - ✅ Dashboard local abierto
   - ✅ Dashboard producción abierto
   - ✅ VS Code listo con todas las herramientas

---

## 🔧 **TROUBLESHOOTING:**

### **Error: "command not found"**
```bash
# Usa npm en lugar de ./script:
npm run tools
```

### **Error: "permission denied"**
```bash
# Usa node directamente:
node run.js
```

### **Terminal no está en el directorio correcto:**
```bash
# Navega al directorio:
cd /Users/rayalvarado/Downloads/chrome_extension_agente_ia_crm_v5/evolution-ghl-integration

# Luego ejecuta:
npm run power
```

---

## 💡 **TIPS:**

1. **Siempre usa `npm run` si los scripts bash fallan**
2. **El comando `node run.js` funciona en cualquier OS**
3. **POWER MODE (`npm run power`) abre todo de una vez**
4. **Los atajos de teclado funcionan después de reiniciar VS Code**

---

## 🎉 **¡AHORA SÍ FUNCIONA TODO!**

Usa el método que prefieras:
- `npm run power` → Más rápido
- `node run.js` → Menú interactivo
- `bash dev-tools.sh` → Si funciona en tu sistema

**¡Todas las herramientas están listas para máxima productividad!** 🚀