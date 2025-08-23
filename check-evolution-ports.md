# 🔍 PUERTOS Y CONECTIVIDAD EVOLUTION API

## Puertos que usa Evolution API:

### **PUERTOS INTERNOS (dentro del contenedor Docker):**
- **8080**: Puerto principal de la API HTTP
- **5432**: PostgreSQL (si usa base de datos)
- **6379**: Redis (si usa caché)

### **PUERTOS EXTERNOS (Coolify/Ubuntu):**
- **80**: HTTP (redirige a HTTPS)
- **443**: HTTPS (tu dominio evolution.cloude.es)
- **22**: SSH (para administración)

### **CONECTIVIDAD SALIENTE (Evolution → Servicios externos):**
- **443**: HTTPS para webhooks salientes
- **80**: HTTP para webhooks salientes
- **53**: DNS resolution
- **587/465**: Email (si usa notificaciones)

## Verificación de puertos en Ubuntu:

```bash
# Verificar puertos abiertos
sudo netstat -tulpn | grep LISTEN

# Verificar puertos específicos
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :8080

# Verificar firewall
sudo ufw status

# Verificar iptables
sudo iptables -L

# Test de conectividad saliente
curl -I https://ray.cloude.es/webhook/evolution1
nc -zv ray.cloude.es 443
```

## Posibles problemas de red:

### **1. Firewall bloqueando salida**
```bash
# Verificar si puede hacer requests HTTPS salientes
curl -I https://google.com
curl -I https://ray.cloude.es
```

### **2. DNS resolution**
```bash
# Verificar si puede resolver dominios
nslookup ray.cloude.es
dig ray.cloude.es
```

### **3. Docker network issues**
```bash
# Verificar redes Docker
docker network ls
docker network inspect [network_name]
```

## Configuración específica para Coolify:

### **Variables de red que pueden afectar:**
- `SERVER_URL`: Debe ser la URL externa real
- `WEBHOOK_GLOBAL_URL`: Debe ser accesible desde el contenedor
- Docker network settings en Coolify

### **Test desde dentro del contenedor:**
```bash
# Entrar al contenedor Evolution
docker exec -it [evolution_container] bash

# Test conectividad desde dentro
curl -I https://ray.cloude.es/webhook/evolution1
wget --spider https://ray.cloude.es/webhook/evolution1
```