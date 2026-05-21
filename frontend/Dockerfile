# ============ ETAPA 1: Build ============
FROM node:20-alpine AS builder

WORKDIR /app

# Variables de build (vite las inyecta en el bundle)
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ============ ETAPA 2: Servir con Nginx ============
FROM nginx:alpine

# Copiar build
COPY --from=builder /app/build /usr/share/nginx/html

# Config Nginx personalizada para SPA
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # SPA - todas las rutas van al index.html \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Headers de seguridad \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    \
    # Cache de assets estaticos \
    location ~* \\.(jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
