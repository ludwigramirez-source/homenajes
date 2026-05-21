# SERCOFUN Homenajes Digitales - Backend API

Backend para el Sistema de Gestion de Homenajes Digitales de SERCOFUN LTDA / Funerario Los Olivos.

Desarrollado por **IPTEGRA SAS**.

## Stack Tecnologico

- **Runtime:** Node.js 20+
- **Framework:** Express 4
- **Base de datos:** PostgreSQL 16
- **Autenticacion:** JWT (jsonwebtoken)
- **Carga de archivos:** Multer (almacenamiento local)
- **Contenedores:** Docker + Docker Compose

## Instalacion Rapida (Docker - RECOMENDADO)

### Requisitos
- Docker 20+
- Docker Compose 2+

### Pasos

```bash
# 1. Copiar archivo de configuracion
cp .env.example .env

# 2. Editar .env con tus valores (especialmente JWT_SECRET y DB_PASSWORD)
nano .env

# 3. Levantar todo (PostgreSQL + Backend + Migraciones + Seed)
docker compose up -d

# 4. Ver logs
docker compose logs -f backend

# 5. Verificar que esta corriendo
curl http://localhost:3001/api/health
```

El backend automaticamente:
1. Levanta PostgreSQL
2. Espera que la BD este lista
3. Ejecuta migraciones (crea tablas)
4. Ejecuta seed (datos demo)
5. Inicia el servidor en puerto 3001

## Instalacion Manual (Sin Docker)

### Requisitos
- Node.js 20+
- PostgreSQL 14+

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

# 3. Crear base de datos
createdb sercofun_homenajes

# 4. Ejecutar migraciones
npm run migrate

# 5. Cargar datos demo
npm run seed

# 6. Iniciar servidor
npm start

# Para desarrollo (con auto-reload):
npm run dev
```

## Credenciales de Acceso (Demo)

| Usuario     | Contrasena    | Rol         |
|-------------|---------------|-------------|
| admin       | admin123      | admin       |
| supervisor  | super123      | supervisor  |
| operator    | operator123   | operator    |

**IMPORTANTE:** Cambiar estas contrasenas en produccion.

## Datos Demo Incluidos

- **5 sedes** (Cali Principal, Cali Norte, Palmira, Buga, Tulua)
- **55 salas** (11 por sede)
- **1 homenaje activo:** Pedro Rojas (1995-2026) en Capilla 1 de Cali Principal
- **3 condolencias** de muestra

## Estructura del Proyecto

```
sercofun-backend/
├── docker-compose.yml      # Orquestacion Docker
├── Dockerfile              # Imagen del backend
├── .env.example            # Variables de entorno (template)
├── package.json
├── README.md
├── src/
│   ├── server.js           # Entry point
│   ├── app.js              # Express config
│   ├── config/
│   │   └── database.js     # PostgreSQL pool
│   ├── middleware/
│   │   ├── auth.js         # JWT
│   │   ├── errorHandler.js
│   │   └── upload.js       # Multer
│   ├── routes/             # Definicion de rutas
│   ├── controllers/        # Logica de negocio
│   ├── utils/
│   │   └── jwt.js
│   └── db/
│       ├── migrate.js      # Crear tablas
│       └── seed.js         # Datos demo
└── uploads/                # Archivos subidos
```

## Endpoints Principales

Documentacion completa: `GET /api/docs`

### Autenticacion (PUBLICO)
- `POST /api/auth/login` - Iniciar sesion
- `GET /api/auth/me` - Datos del usuario (requiere token)

### Display Digital (PUBLICO - sin auth)
- `GET /api/rooms/:id/active-memorial` - Obtener memorial activo de una sala

### Formulario de Condolencias (PUBLICO - sin auth)
- `POST /api/condolences/submit` - Enviar condolencia (con hasta 2 archivos)

### Admin (Requieren JWT)
- `GET /api/locations` - Sedes
- `GET /api/rooms` - Salas
- `GET /api/memorials` - Homenajes
- `GET /api/condolences` - Todas las condolencias
- `GET /api/analytics/executive` - KPIs ejecutivos
- `GET /api/analytics/by-location` - Por sede
- `GET /api/analytics/operations` - Centro de control

## Ejemplos de Uso

### 1. Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": { "id": "...", "username": "admin", "role": "admin" }
  }
}
```

### 2. Obtener memorial activo de una sala (PUBLICO - para display)

```bash
# Primero obtienes el ID de la sala (con auth)
curl http://localhost:3001/api/rooms \
  -H "Authorization: Bearer TU_TOKEN"

# Luego, sin auth, obtienes el memorial activo
curl http://localhost:3001/api/rooms/{ROOM_ID}/active-memorial
```

### 3. Enviar condolencia desde formulario (PUBLICO)

```bash
curl -X POST http://localhost:3001/api/condolences/submit \
  -F "memorial_id={MEMORIAL_ID}" \
  -F "sender_name=Juan Perez" \
  -F "sender_email=juan@example.com" \
  -F "sender_phone=+57 300 1234567" \
  -F "message=Mis sinceras condolencias a la familia" \
  -F "marketing_consent=true" \
  -F "files=@foto1.jpg" \
  -F "files=@foto2.jpg"
```

### 4. KPIs ejecutivos

```bash
curl http://localhost:3001/api/analytics/executive \
  -H "Authorization: Bearer TU_TOKEN"
```

## Despliegue en VPS (Produccion)

### En VPS con Docker

```bash
# 1. En tu VPS, clonar/subir el proyecto
git clone tu-repo.git
cd sercofun-backend

# 2. Configurar variables de produccion
cp .env.example .env
nano .env
# - Cambiar JWT_SECRET por algo robusto y aleatorio
# - Cambiar DB_PASSWORD
# - Configurar CORS_ORIGIN con tu dominio del frontend
# - Configurar PUBLIC_URL con la URL de tu servidor

# 3. Levantar en modo produccion
docker compose up -d

# 4. Configurar Nginx como reverse proxy (opcional pero recomendado)
# Ver seccion abajo sobre Nginx
```

### Configuracion Nginx (Reverse Proxy con HTTPS)

```nginx
server {
    listen 80;
    server_name api.tudominio.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.tudominio.com;

    ssl_certificate /etc/letsencrypt/live/api.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.tudominio.com/privkey.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL Gratis con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.tudominio.com
```

## Conectar el Frontend (Rocket.new)

En el frontend hay que cambiar las llamadas de mock a la API real.

### 1. Configurar variable de entorno en el frontend

Editar `.env` del proyecto rocket:
```
VITE_API_URL=http://localhost:3001
```

### 2. Crear servicio API

Crear `src/services/api.js`:

```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor para JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

### 3. Llamadas en componentes

**Display Screen** (`digital-display-screen/index.jsx`):
```javascript
// Reemplazar el mock por:
useEffect(() => {
  fetch(`${API_URL}/api/rooms/${roomId}/active-memorial`)
    .then(r => r.json())
    .then(({ data }) => setMemorialData(data));
}, [roomId]);
```

**Memorial Form** (`memorial-form/index.jsx`):
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append('memorial_id', memorialId);
  formData.append('sender_name', formData.name);
  formData.append('sender_email', formData.email);
  formData.append('sender_phone', formData.phone);
  formData.append('message', formData.message);
  formData.append('marketing_consent', authorized);
  files.forEach(f => formData.append('files', f));
  
  const res = await fetch(`${API_URL}/api/condolences/submit`, {
    method: 'POST',
    body: formData
  });
  if (res.ok) setIsSubmitted(true);
};
```

## Comandos Utiles

```bash
# Ver logs del backend
docker compose logs -f backend

# Ver logs de PostgreSQL
docker compose logs -f postgres

# Reiniciar backend
docker compose restart backend

# Acceder a PostgreSQL
docker compose exec postgres psql -U sercofun_admin -d sercofun_homenajes

# Resetear base de datos (CUIDADO - borra todo)
docker compose down -v
docker compose up -d

# Backup de BD
docker compose exec postgres pg_dump -U sercofun_admin sercofun_homenajes > backup.sql

# Restaurar BD
cat backup.sql | docker compose exec -T postgres psql -U sercofun_admin -d sercofun_homenajes
```

## Seguridad - Checklist Pre-Produccion

- [ ] Cambiar JWT_SECRET por valor aleatorio largo (min 32 caracteres)
- [ ] Cambiar DB_PASSWORD
- [ ] Cambiar contrasenas de usuarios demo (admin/supervisor/operator)
- [ ] Configurar CORS_ORIGIN con dominios especificos (no usar `*`)
- [ ] Configurar HTTPS con SSL
- [ ] Configurar firewall (solo abrir puertos 80, 443, 22)
- [ ] Configurar backups automaticos de PostgreSQL
- [ ] Configurar logs centralizados
- [ ] Migrar uploads a S3 o similar para escalabilidad
- [ ] Configurar rate limiting (express-rate-limit)
- [ ] Configurar monitoring (UptimeRobot, DataDog, etc.)

## Soporte

Para soporte tecnico contactar a IPTEGRA SAS:
- Email: lramirez@iptegra.com
- Sitio web: www.iptegra.com

---

Desarrollado por IPTEGRA SAS - Copyright 2026
