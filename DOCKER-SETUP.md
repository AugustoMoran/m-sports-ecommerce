# 🐳 M SPORTS - DEPLOYMENT CON DOCKER

## Requisitos Previos

1. **Docker** instalado: https://www.docker.com/products/docker-desktop
2. **Docker Compose** (viene con Docker Desktop)
3. Proyecto clonado/configurado localmente

## 🚀 Lanzar TODO con 1 Comando

```bash
# En la raíz del proyecto (donde está docker-compose.yml)
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
```

## ✅ URLs Locales (con Docker)

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **MongoDB**: Remota (no local, en Cluster0)

## 🛑 Detener Todo

```bash
docker-compose down

# Detener y eliminar volúmenes (CUIDADO: borra datos locales de DB)
docker-compose down -v
```

## 🔧 Troubleshooting

### Puerto 5000 o 5173 ocupado
```bash
# Cambiar puerto en docker-compose.yml o liberar el puerto
docker-compose down
```

### Rebuild después de cambios en código
```bash
docker-compose up -d --build
```

### Ver containers corriendo
```bash
docker ps
```

### Acceder a un container
```bash
docker exec -it [container-id] sh
```

## 📝 Configuración

### Cambiar variables de entorno
Edita `docker-compose.yml` en la sección `environment` de cada servicio.

### Usar MongoDB local (opcional)
En `docker-compose.yml`, descomenta la sección `mongodb`:
1. Descomenta `mongodb:` service
2. Cambia `MONGO_URI` a `mongodb://msportsbsports_db_user:nzrmfOlFqUWb3cVI@mongodb:27017/ecommerce`

## 📊 Ventajas de Docker Local

✅ Mismo entorno en dev que en producción  
✅ No ocupas puertos del SO  
✅ Fácil de pausar/resumir  
✅ Puedes agregar más servicios (Redis, PostgreSQL, etc)  
✅ Listo para desplegar a Render/Vercel cuando quieras  
✅ Funciona igual en Windows/Mac/Linux  

## 🔄 Workflow Recomendado

1. Edita código en tu IDE normalmente
2. `docker-compose up -d --build` cuando cambies dependencias
3. Los cambios de código se recargan automáticamente (nodemon en backend, Vite en frontend)
4. Push a GitHub cuando esté todo OK
5. Vercel/Render toman los Dockerfiles y despliegan

---

**¿Preguntas? Ejecuta:** `docker-compose logs -f` para ver qué está pasando
