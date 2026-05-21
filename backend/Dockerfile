FROM node:20-alpine

WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache postgresql-client

# Copiar package.json e instalar dependencias
COPY package*.json ./
RUN npm install --production

# Copiar codigo fuente
COPY . .

# Crear directorio de uploads
RUN mkdir -p uploads && chmod 755 uploads

# Exponer puerto
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/api/health || exit 1

# Comando de inicio - espera a que PostgreSQL este listo, ejecuta migraciones y arranca
CMD ["sh", "-c", "until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do echo 'Esperando PostgreSQL...'; sleep 2; done && node src/db/migrate.js && node src/db/seed.js && node src/server.js"]
