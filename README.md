# SERCOFUN - Sistema de Homenajes Digitales

Sistema completo (frontend + backend) para la gestion digital de homenajes funerarios.

Desarrollado por **IPTEGRA SAS** para **SERCOFUN LTDA - Funerario Los Olivos**.

## Resumen

Este proyecto contiene:
- **Frontend** (React 18 + Vite + Tailwind) - Dashboard admin + pantallas publicas
- **Backend** (Node.js + Express + PostgreSQL) - API REST con JWT auth
- **Base de datos** PostgreSQL con datos demo
- Todo orquestado con **Docker Compose**

## Inicio Rapido (TODO con un solo comando)

### Requisitos
- Docker 20+
- Docker Compose 2+

### Pasos

```bash
# 1. Configurar variables (cambiar JWT_SECRET y DB_PASSWORD)
cp .env.example .env
nano .env

# 2. Levantar TODO con un comando
docker compose up -d

# 3. Esperar ~1 minuto a que todo arranque
docker compose logs -f backend
```

**Eso es todo.** Se levantan:
- PostgreSQL en puerto **5432**
- Backend API en puerto **3001**
- Frontend en puerto **8080**

### Acceder al sistema

| Servicio                    | URL                                                          |
|-----------------------------|--------------------------------------------------------------|
| Frontend (Admin Dashboard)  | http://localhost:8080                                        |
| Backend API                 | http://localhost:3001                                        |
| Documentacion API           | http://localhost:3001/api/docs                               |
| Health Check                | http://localhost:3001/api/health                             |

### Credenciales de Acceso

| Usuario     | Contrasena    | Rol         |
|-------------|---------------|-------------|
| admin       | admin123      | admin       |
| supervisor  | super123      | supervisor  |
| operator    | operator123   | operator    |

## Flujo de Prueba Completo

### 1. Acceder al Dashboard Admin

1. Abre http://localhost:8080
2. Haz login con `admin / admin123`
3. Veras el dashboard con KPIs reales (datos demo)
4. Explora: Centro de Operaciones, Analisis, Rendimiento por Ubicacion

### 2. Obtener el ID de una sala

En la consola del navegador (F12) o con curl:
```bash
# Obtener token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.data.token')

# Listar salas
curl http://localhost:3001/api/rooms \
  -H "Authorization: Bearer $TOKEN" | jq '.data[0].id'
```

### 3. Ver el Display de Pantalla

Con el ID de la sala obtenido:
```
http://localhost:8080/digital-display-screen/{ROOM_ID}
```

Veras:
- Pantalla 1: Foto de Pedro Rojas, mensaje emotivo, fechas
- Pantalla 2 (cada 25s): QR code para condolencias
- Rotacion automatica con transiciones suaves

### 4. Probar el Formulario de Condolencias

Escanea el QR del display, o directamente:
```
http://localhost:8080/memorial-form/{ROOM_ID}
```

Llena el formulario y envia. La condolencia se guardara en la BD.

### 5. Verificar que llego la condolencia

Vuelve al dashboard, en Centro de Operaciones veras la condolencia recien creada.

## Estructura del Proyecto

```
sercofun-homenajes/
├── docker-compose.yml      # Orquesta todo
├── .env.example            # Configuracion centralizada
├── README.md               # Este archivo
│
├── backend/                # API REST
│   ├── Dockerfile
│   ├── package.json
│   ├── README.md           # Doc tecnica del backend
│   ├── postman_collection.json
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/         # PostgreSQL pool
│       ├── controllers/    # Logica de negocio
│       ├── routes/         # Endpoints
│       ├── middleware/     # Auth, errores, upload
│       └── db/             # Migrate + Seed
│
└── frontend/               # React App
    ├── Dockerfile
    ├── package.json
    ├── .env                # VITE_API_URL
    └── src/
        ├── App.jsx
        ├── Routes.jsx      # Rutas protegidas
        ├── services/
        │   └── api.js      # Cliente HTTP con interceptores JWT
        ├── context/
        │   └── AuthContext.jsx
        └── pages/
            ├── login/          # Pagina de login
            ├── executive-overview/
            ├── analytics-hub/
            ├── operations-control-center/
            ├── location-performance/
            ├── system-health-monitor/
            ├── tribute-creation-studio/
            ├── digital-display-screen/  # PUBLICO - sin auth
            └── memorial-form/           # PUBLICO - sin auth
```

## Desarrollo (sin Docker)

### Backend en modo dev

```bash
cd backend
npm install
cp .env.example .env  # Ajustar credenciales PostgreSQL
npm run migrate
npm run seed
npm run dev           # Auto-reload con nodemon
```

### Frontend en modo dev (con hot reload de Vite)

```bash
cd frontend
npm install
# Ajustar VITE_API_URL en .env si el backend no esta en localhost:3001
npm start             # Vite dev server en http://localhost:5173
```

**Nota:** El frontend en modo Vite (npm start) usa puerto 5173, no 8080.

## Comandos Utiles

```bash
# Ver logs en vivo
docker compose logs -f                 # Todos
docker compose logs -f backend         # Solo backend
docker compose logs -f frontend        # Solo frontend
docker compose logs -f postgres        # Solo postgres

# Reiniciar un servicio
docker compose restart backend
docker compose restart frontend

# Acceder a PostgreSQL
docker compose exec postgres psql -U sercofun_admin -d sercofun_homenajes

# Resetear BD completa (BORRA TODO)
docker compose down -v
docker compose up -d

# Backup de BD
docker compose exec postgres pg_dump -U sercofun_admin sercofun_homenajes > backup_$(date +%Y%m%d).sql

# Restaurar BD
cat backup.sql | docker compose exec -T postgres psql -U sercofun_admin -d sercofun_homenajes

# Rebuild despues de cambios
docker compose up -d --build

# Detener todo
docker compose down

# Detener y eliminar volumenes (datos)
docker compose down -v
```

## Despliegue en VPS

### Opcion 1: VPS con Docker (RECOMENDADO)

```bash
# En tu VPS (Ubuntu 22+)
sudo apt update
sudo apt install -y docker.io docker-compose-v2

# Subir el proyecto
scp -r sercofun-homenajes user@tu-vps:/home/user/

# En el VPS
cd /home/user/sercofun-homenajes
cp .env.example .env
nano .env  # IMPORTANTE: cambiar JWT_SECRET, DB_PASSWORD y URLs

# Levantar
docker compose up -d
```

### Opcion 2: Con Nginx + HTTPS (Produccion)

Si tienes dominio propio (ej: `homenajes.sercofun.co` y `api.homenajes.sercofun.co`):

**1. Configurar Nginx en el VPS:**

```nginx
# /etc/nginx/sites-available/sercofun
server {
    listen 80;
    server_name homenajes.sercofun.co;
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name api.homenajes.sercofun.co;
    client_max_body_size 10M;
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/sercofun /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**2. Obtener certificados SSL gratuitos:**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d homenajes.sercofun.co -d api.homenajes.sercofun.co
```

**3. Ajustar `.env` con las URLs reales:**

```env
BACKEND_PUBLIC_URL=https://api.homenajes.sercofun.co
FRONTEND_URL=https://homenajes.sercofun.co
VITE_API_URL=https://api.homenajes.sercofun.co
CORS_ORIGIN=https://homenajes.sercofun.co
```

**4. Rebuild con las nuevas URLs:**

```bash
docker compose down
docker compose up -d --build
```

## Checklist Pre-Produccion

- [ ] Cambiar `JWT_SECRET` por valor aleatorio largo (min 32 chars)
- [ ] Cambiar `DB_PASSWORD`
- [ ] Cambiar contrasenas de usuarios demo
- [ ] Configurar `CORS_ORIGIN` con dominio especifico
- [ ] Configurar HTTPS con SSL
- [ ] Configurar firewall (solo puertos 80, 443, 22)
- [ ] Configurar backups automaticos de PostgreSQL
- [ ] Migrar uploads a S3 o similar
- [ ] Configurar monitoring (UptimeRobot, etc.)
- [ ] Configurar logs centralizados

## Endpoints API Principales

Ver documentacion completa en: http://localhost:3001/api/docs

### Publicos (sin auth)
- `POST /api/auth/login` - Iniciar sesion
- `GET /api/rooms/:id/active-memorial` - Memorial activo (para display)
- `POST /api/condolences/submit` - Enviar condolencia (con archivos)
- `GET /api/analytics/health` - Estado del sistema

### Protegidos (requieren JWT)
- `GET /api/auth/me` - Datos del usuario
- `GET /api/locations` - Sedes (CRUD completo)
- `GET /api/rooms` - Salas (CRUD completo)
- `GET /api/memorials` - Homenajes (CRUD completo)
- `GET /api/condolences` - Condolencias (lista admin)
- `GET /api/analytics/executive` - KPIs ejecutivos
- `GET /api/analytics/by-location` - Por sede
- `GET /api/analytics/operations` - Centro operativo

## Datos Demo Incluidos

- **3 usuarios** admin/supervisor/operator
- **5 sedes** (Cali, Cali Norte, Palmira, Buga, Tulua)
- **55 salas** (11 por sede)
- **1 homenaje activo**: Pedro Rojas (1995-2026)
- **3 condolencias** de muestra

## Soporte

**IPTEGRA SAS**
- Email: lramirez@iptegra.com
- Sitio web: www.iptegra.com
- CEO: Ludwig Ramirez

---

Copyright 2026 IPTEGRA SAS - Todos los derechos reservados
